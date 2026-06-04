require "./spec_helper"
require "aptok/testing"
require "file_utils"
require "http/server"
require "../src/crater/relay_service"
require "../src/crater/solver_responses"
require "../src/crater/utils/config"

# End-to-end coverage for the solver return path: a local computer publishes an
# inference endpoint, the relay delivers a task to its inbox, the solver runs
# OpenAI and POSTs the result back to `/api/responses` authenticated with its
# bearer token, and the platform processing layer normalizes the OpenAI
# response into a relayable result.
private def with_solver_config(services : Array(Hash(String, String)), &)
  dir = File.join(Dir.tempdir, "lepos-solver-responses-#{Random::Secure.hex(8)}")
  Dir.mkdir_p(dir)
  config_json = {
    "backend" => {
      "craterBaseUrl" => "https://relay.test",
      "databaseUrl"   => "postgresql://kefine:kefine@localhost:5432/kefine",
    },
    "relay" => {
      "actorHandle" => "relay",
      "displayName" => "Lepos Relay",
      "services"    => services,
    },
  }
  File.write(File.join(dir, "kefine.config.json"), config_json.to_json)

  previous = Dir.current
  begin
    Dir.cd(dir)
    yield Lepos::Utils::Config.load
  ensure
    Dir.cd(previous)
    FileUtils.rm_rf(dir)
  end
end

# An OpenAI Responses API payload of the kind a local solver returns after
# running inference on a relayed task.
private def openai_response(request_id : String, text : String) : Hash(String, JSON::Any)
  JSON.parse(
    {
      "id"     => "resp_#{Random::Secure.hex(6)}",
      "object" => "response",
      "status" => "completed",
      "model"  => "gpt-4.1-mini",
      "output" => [
        {
          "type"    => "message",
          "role"    => "assistant",
          "content" => [
            {"type" => "output_text", "text" => text},
          ],
        },
      ],
      "metadata" => {"request_id" => request_id},
    }.to_json
  ).as_h
end

describe "Lepos solver responses" do
  it "parses the bearer token out of an Authorization header" do
    Lepos::SolverResponses.bearer_token("Bearer lepos_solver_abc").should eq("lepos_solver_abc")
    Lepos::SolverResponses.bearer_token("bearer   lepos_solver_abc  ").should eq("lepos_solver_abc")
    Lepos::SolverResponses.bearer_token("Token lepos_solver_abc").should be_nil
    Lepos::SolverResponses.bearer_token(nil).should be_nil
    Lepos::SolverResponses.bearer_token("Bearer    ").should be_nil
  end

  it "authenticates a configured solver by its token and rejects others" do
    with_solver_config([
      {"id" => "https://relay.test/actor/solver", "inbox" => "http://127.0.0.1:4501/solvers/solver-x2yedlfg/inbox", "token" => "lepos_solver_secret"},
    ]) do |config|
      authed = Lepos::SolverResponses.authenticate(config, "Bearer lepos_solver_secret")
      authed.should_not be_nil
      authed.not_nil!.id.should eq("https://relay.test/actor/solver")

      Lepos::SolverResponses.authenticate(config, "Bearer wrong-token").should be_nil
      Lepos::SolverResponses.authenticate(config, nil).should be_nil
    end
  end

  it "does not authenticate services configured without a token" do
    with_solver_config([
      {"id" => "https://relay.test/actor/no-token", "inbox" => "http://127.0.0.1:4501/inbox"},
    ]) do |config|
      # A tokenless internal service still relays, but cannot post back results.
      Lepos::SolverResponses.authenticate(config, "Bearer ").should be_nil
      config.relay_internal_services.first.token.should be_nil
    end
  end

  it "extracts the assembled output text from an OpenAI Responses payload" do
    convenience = JSON.parse({"output_text" => "Quick answer"}.to_json).as_h.as(Aptok::JsonMap)
    Lepos::SolverResponses.extract_output_text(convenience).should eq("Quick answer")

    structured = openai_response("req-1", "Hello ").as(Aptok::JsonMap)
    structured["output"].as_a.first.as_h["content"].as_a << JSON.parse({"type" => "output_text", "text" => "world"}.to_json)
    Lepos::SolverResponses.extract_output_text(structured).should eq("Hello world")
  end

  it "links the result back to the relayed request id" do
    payload = openai_response("https://origin.example/activities/task-1", "done").as(Aptok::JsonMap)
    Lepos::SolverResponses.extract_request_id(payload).should eq("https://origin.example/activities/task-1")

    top_level = JSON.parse({"request_id" => "task-top"}.to_json).as_h.as(Aptok::JsonMap)
    Lepos::SolverResponses.extract_request_id(top_level).should eq("task-top")
  end

  it "processes an OpenAI response into a normalized relayable result" do
    with_solver_config([
      {"id" => "https://relay.test/actor/solver", "inbox" => "http://127.0.0.1:4501/solvers/solver-x2yedlfg/inbox", "token" => "lepos_solver_secret"},
    ]) do |config|
      solver = Lepos::SolverResponses.authenticate(config, "Bearer lepos_solver_secret").not_nil!
      payload = openai_response("https://origin.example/activities/task-1", "The fix is ready.").as(Aptok::JsonMap)

      result = Lepos::SolverResponses.build_result(payload, solver, config)
      result["accepted"].as_bool.should be_true
      result["provider"].as_s.should eq("openai")
      result["solver"].as_s.should eq("https://relay.test/actor/solver")
      result["model"].as_s.should eq("gpt-4.1-mini")
      result["status"].as_s.should eq("completed")
      result["requestId"].as_s.should eq("https://origin.example/activities/task-1")
      result["outputText"].as_s.should eq("The fix is ready.")

      activity = result["activity"].as_h
      activity["type"].as_s.should eq("Create")
      activity["actor"].as_s.should eq("https://relay.test/actor/solver")
      activity["inReplyTo"].as_s.should eq("https://origin.example/activities/task-1")
      object = activity["object"].as_h
      object["type"].as_s.should eq("Note")
      object["content"].as_s.should eq("The fix is ready.")
      object["attributedTo"].as_s.should eq("https://relay.test/actor/solver")
    end
  end

  it "runs the full local inference loop: relay to inbox, solver returns to /api/responses" do
    # The local computer's published inference endpoint: it accepts the relayed
    # task at its inbox, runs OpenAI, and returns the result the way the
    # platform's /api/responses processing layer consumes it.
    received = Channel(Aptok::JsonMap).new(1)
    server = HTTP::Server.new do |context|
      if context.request.method == "POST" && context.request.path == "/solvers/solver-x2yedlfg/inbox"
        body = context.request.body.try(&.gets_to_end) || ""
        received.send(JSON.parse(body).as_h.as(Aptok::JsonMap))
        context.response.status_code = 202
        context.response.content_type = "application/json"
        context.response.print({accepted: true}.to_json)
      else
        context.response.status_code = 404
        context.response.print({error: "unexpected"}.to_json)
      end
    end
    address = server.bind_tcp("127.0.0.1", 0)
    spawn do
      begin
        server.listen
      rescue IO::Error
      end
    end

    begin
      inbox = "http://#{address.address}:#{address.port}/solvers/solver-x2yedlfg/inbox"
      with_solver_config([
        {"id" => "http://127.0.0.1:4501/actor/solver", "inbox" => inbox, "token" => "lepos_solver_secret"},
      ]) do |config|
        request_id = "https://origin.example/activities/inference-task-1"
        task = Aptok.create(
          request_id,
          "https://origin.example/users/requester",
          Aptok.note("https://origin.example/notes/inference-task-1", "Solve this task"),
          [Aptok::PUBLIC_COLLECTION]
        )

        # 1. The relay fans the task out to the local solver inbox.
        sent = Lepos::RelayService.relay_activity(
          task,
          config,
          Aptok::MemoryKvStore.new,
          Aptok::Transport.new(signature_enabled: false)
        )
        sent.size.should eq(1)
        sent.first.recipient.inbox.should eq(inbox)

        delivered = select
        when value = received.receive
          value
        when timeout(2.seconds)
          raise "Timed out waiting for the solver inbox delivery"
        end
        delivered["id"].as_s.should eq(request_id)

        # 2. The solver runs OpenAI and returns the result to /api/responses,
        #    authenticated with its bearer token. The platform processes it.
        solver = Lepos::SolverResponses.authenticate(config, "Bearer lepos_solver_secret").not_nil!
        openai = openai_response(delivered["id"].as_s, "Task solved by local inference.").as(Aptok::JsonMap)
        result = Lepos::SolverResponses.build_result(openai, solver, config)

        result["requestId"].as_s.should eq(request_id)
        result["outputText"].as_s.should eq("Task solved by local inference.")
        result["activity"].as_h["inReplyTo"].as_s.should eq(request_id)
      end
    ensure
      server.close
    end
  end
end

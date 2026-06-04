require "./spec_helper"
require "aptok/testing"
require "file_utils"
require "http/server"
require "../src/crater/relay_service"
require "../src/crater/utils/config"

# End-to-end coverage for the Lepos relay "same experience" requirement: an
# internal service wired up through `kefine.config.json` and an external API
# subscriber that joined over the network with an ActivityPub follow both
# receive the exact same relayed public activity.
private def with_relay_config(services : Array(Hash(String, String)), &)
  dir = File.join(Dir.tempdir, "lepos-relay-e2e-#{Random::Secure.hex(8)}")
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

private record LocalInferenceDelivery,
  path : String,
  content_type : String?,
  activity : Aptok::JsonMap

private def with_local_inference_endpoint(&)
  deliveries = Channel(LocalInferenceDelivery).new(1)
  server = HTTP::Server.new do |context|
    if context.request.method == "POST" && context.request.path == "/inference/inbox"
      body = context.request.body.try(&.gets_to_end) || ""
      deliveries.send(
        LocalInferenceDelivery.new(
          context.request.path,
          context.request.headers["Content-Type"]?,
          JSON.parse(body).as_h.as(Aptok::JsonMap)
        )
      )
      context.response.status_code = 202
      context.response.content_type = "application/json"
      context.response.print({accepted: true, endpoint: "inference"}.to_json)
    else
      context.response.status_code = 404
      context.response.content_type = "application/json"
      context.response.print({error: "unexpected request"}.to_json)
    end
  end

  address = server.bind_tcp("127.0.0.1", 0)
  spawn do
    begin
      server.listen
    rescue IO::Error
      # The spec closes the server after the relay delivers to the local inbox.
    end
  end

  begin
    yield "http://#{address.address}:#{address.port}/inference/inbox", deliveries
  ensure
    server.close
  end
end

describe "Lepos relay end-to-end fanout" do
  it "parses internal services from kefine.config.json into relay recipients" do
    with_relay_config([
      {"id" => "https://relay.test/actor/internal-bot", "inbox" => "http://127.0.0.1:4501/inbox"},
    ]) do |config|
      recipients = Lepos::RelayService.internal_recipients(config)
      recipients.size.should eq(1)
      recipients.first.id.should eq("https://relay.test/actor/internal-bot")
      recipients.first.inbox.should eq("http://127.0.0.1:4501/inbox")

      metadata = Lepos::RelayService.metadata(config, Aptok::MemoryKvStore.new)
      metadata["internalServiceCount"].as_i.should eq(1)
      metadata["internalServiceActors"].as_a.map(&.as_s).should contain("https://relay.test/actor/internal-bot")
      metadata.has_key?("botCreateUrl").should be_false
      metadata.has_key?("botTokenRequired").should be_false
    end
  end

  it "skips internal services that are missing an id or inbox" do
    with_relay_config([
      {"id" => "https://relay.test/actor/internal-bot", "inbox" => "http://127.0.0.1:4501/inbox"},
      {"id" => "https://relay.test/actor/no-inbox"},
      {"inbox" => "http://127.0.0.1:4502/inbox"},
    ]) do |config|
      Lepos::RelayService.internal_recipients(config).map(&.id).should eq([
        "https://relay.test/actor/internal-bot",
      ])
    end
  end

  it "fans a public activity out to both internal config services and external follow subscribers" do
    with_relay_config([
      {"id" => "https://relay.test/actor/internal-bot", "inbox" => "http://10.0.0.5/inbox"},
    ]) do |config|
      store = Aptok::MemoryKvStore.new
      transport = Aptok::CaptureTransport.new

      # External API subscriber joins over the network via a Mastodon relay follow.
      external_actor = Aptok.actor(
        "Application",
        "https://external.example/users/bot",
        "external",
        "https://external.example/users/bot/inbox",
        "https://external.example/users/bot/outbox"
      )
      follow = Aptok::Relay.subscribe(
        "https://external.example/activities/follow-relay",
        external_actor["id"].as_s,
        config.relay_actor_id
      )
      follow["actor"] = Aptok.json(external_actor)
      Lepos::RelayService.handle_control(follow, config, store, transport).subscribed?.should be_true

      # The followers collection lists both the external subscriber and the
      # internal config service, demonstrating the "same experience".
      followers = Lepos::RelayService.followers_collection(config, store)
      follower_ids = followers["orderedItems"].as_a.map(&.as_s)
      follower_ids.should contain("https://external.example/users/bot")
      follower_ids.should contain("https://relay.test/actor/internal-bot")
      followers["totalItems"].as_i.should eq(2)

      # A public relayable activity from a third origin reaches both subscribers,
      # but is never echoed back to the origin.
      origin_actor = "https://origin.example/users/author"
      activity = Aptok.create(
        "https://origin.example/activities/create-1",
        origin_actor,
        Aptok.note("https://origin.example/notes/1", "Relay this task"),
        [Aptok::PUBLIC_COLLECTION]
      )

      sent = Lepos::RelayService.relay_activity(activity, config, store, transport)
      delivered_inboxes = sent.map(&.recipient.inbox)
      delivered_inboxes.size.should eq(2)
      delivered_inboxes.should contain("https://external.example/users/bot/inbox")
      delivered_inboxes.should contain("http://10.0.0.5/inbox")
    end
  end

  it "posts relayed activity to a real local inference endpoint configured as an internal service" do
    with_local_inference_endpoint do |inbox, deliveries|
      local_actor = "http://127.0.0.1:4501/actor/inference"

      with_relay_config([
        {"id" => local_actor, "inbox" => inbox},
      ]) do |config|
        activity = Aptok.create(
          "https://origin.example/activities/inference-request-1",
          "https://origin.example/users/requester",
          Aptok.note("https://origin.example/notes/inference-request-1", "Run local inference for this task"),
          [Aptok::PUBLIC_COLLECTION]
        )

        sent = Lepos::RelayService.relay_activity(
          activity,
          config,
          Aptok::MemoryKvStore.new,
          Aptok::Transport.new(signature_enabled: false)
        )

        sent.size.should eq(1)
        sent.first.recipient.id.should eq(local_actor)
        sent.first.recipient.inbox.should eq(inbox)

        delivery = select
        when value = deliveries.receive
          value
        when timeout(2.seconds)
          raise "Timed out waiting for local inference endpoint delivery"
        end

        delivery.path.should eq("/inference/inbox")
        delivery.content_type.to_s.should contain("application/ld+json")
        delivery.activity["id"].as_s.should eq("https://origin.example/activities/inference-request-1")
        delivery.activity["type"].as_s.should eq("Create")
        delivery.activity["actor"].as_s.should eq("https://origin.example/users/requester")
        delivery.activity["to"].as_a.map(&.as_s).should contain(Aptok::PUBLIC_COLLECTION)
        delivery.activity["object"].as_h["content"].as_s.should eq("Run local inference for this task")
      end
    end
  end

  it "does not relay a public activity back to an internal service that authored it" do
    with_relay_config([
      {"id" => "https://relay.test/actor/internal-bot", "inbox" => "http://10.0.0.5/inbox"},
    ]) do |config|
      store = Aptok::MemoryKvStore.new
      transport = Aptok::CaptureTransport.new

      activity = Aptok.create(
        "https://relay.test/actor/internal-bot/activities/create-1",
        "https://relay.test/actor/internal-bot",
        Aptok.note("https://relay.test/notes/1", "Internal task"),
        [Aptok::PUBLIC_COLLECTION]
      )

      sent = Lepos::RelayService.relay_activity(activity, config, store, transport)
      sent.should be_empty
    end
  end
end

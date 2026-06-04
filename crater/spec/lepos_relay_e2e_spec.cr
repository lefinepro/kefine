require "./spec_helper"
require "aptok/testing"
require "file_utils"
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

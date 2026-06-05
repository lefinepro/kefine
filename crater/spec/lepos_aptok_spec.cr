require "./spec_helper"
require "aptok/testing"
require "../src/crater/order_queue"
require "../src/crater/forgefed_store"
require "../src/crater/relay_service"
require "../src/crater/utils/config"

private def test_config : Lepos::Utils::Config
  Lepos::Utils::Config.load
end

describe "Lepos Aptok federation payloads" do
  it "uses Aptok constants directly" do
    Aptok::ACTIVITYSTREAMS_CONTEXT.should eq("https://www.w3.org/ns/activitystreams")
    Aptok::PUBLIC_COLLECTION.should eq("https://www.w3.org/ns/activitystreams#Public")
    Aptok::FORGEFED_CONTEXT.should eq("https://forgefed.org/ns")
  end

  it "builds discovery documents with Aptok WebFinger and NodeInfo helpers" do
    config = test_config

    jrd = Lepos::AptokPayload.webfinger_jrd("acct:#{config.actor_username}@#{config.domain}", config)
    jrd["subject"].as_s.should eq("acct:#{config.actor_username}@#{config.domain}")
    jrd["aliases"].as_a.map(&.as_s).should contain(config.actor_id)
    self_link = jrd["links"].as_a.first.as_h
    self_link["rel"].as_s.should eq("self")
    self_link["type"].as_s.should eq("application/activity+json")
    self_link["href"].as_s.should eq(config.actor_id)

    relay_jrd = Lepos::AptokPayload.webfinger_jrd("acct:#{config.relay_actor_username}@#{config.domain}", config)
    relay_link = relay_jrd["links"].as_a.first.as_h
    relay_link["href"].as_s.should eq(config.relay_actor_id)
    relay_jrd["aliases"].as_a.map(&.as_s).should contain(config.relay_actor_id)

    well_known = Lepos::AptokPayload.nodeinfo_well_known(config)
    nodeinfo_link = well_known["links"].as_a.first.as_h
    nodeinfo_link["rel"].as_s.should eq(Aptok::NODEINFO_2_1_REL)
    nodeinfo_link["href"].as_s.should eq("#{config.crater_url}/nodeinfo/2.1")

    nodeinfo = Lepos::AptokPayload.nodeinfo_document
    parsed_nodeinfo = Aptok.parse_nodeinfo(nodeinfo)
    parsed_nodeinfo.should_not be_nil
    parsed_nodeinfo.not_nil!.software.name.should eq("lepos")
    parsed_nodeinfo.not_nil!.protocols.should contain("activitypub")
    nodeinfo["metadata"].as_h["forgefed"].as_bool.should be_true
  end

  it "builds actor documents with Aptok actor vocabulary" do
    config = test_config

    actor_json = Lepos::AptokPayload.actor_json(config.actor_username, config)
    actor = Aptok::Vocab::Actor.from_json_ld(actor_json)

    actor.id.should eq(config.actor_id)
    actor.type.should eq("Application")
    actor.preferred_username.should eq(config.actor_username)
    actor.inbox.should eq(config.actor_inbox)
    actor.outbox.should eq(config.actor_outbox)
    actor.shared_inbox.should eq("#{config.crater_url}/inbox")
  end

  it "builds a relay actor document with Aptok relay vocabulary" do
    config = test_config

    actor_json = Lepos::AptokPayload.actor_json(config.relay_actor_username, config)
    actor = Aptok::Vocab::Actor.from_json_ld(actor_json)

    actor.id.should eq(config.relay_actor_id)
    actor.type.should eq("Application")
    actor.preferred_username.should eq(config.relay_actor_username)
    actor.inbox.should eq(config.relay_inbox)
    actor.outbox.should eq(config.relay_outbox)
    actor.followers.should eq(config.relay_followers)
    actor.shared_inbox.should eq("#{config.crater_url}/inbox")
  end

  it "classifies Mastodon relay follows as relay subscriptions" do
    config = test_config
    follow = Aptok::Relay.subscribe(
      "https://remote.example/activities/follow-relay",
      "https://remote.example/users/bot",
      config.relay_actor_id
    )

    Aptok::Relay.subscription_protocol(follow, config.relay_actor_id).should eq(Aptok::Relay::Protocol::Mastodon)
    Lepos::RelayService.control_activity?(follow, config).should be_true
  end

  it "stores relay subscribers and fans public activities out without echoing to the origin" do
    config = test_config
    store = Aptok::MemoryKvStore.new
    transport = Aptok::CaptureTransport.new

    origin_actor = Aptok.actor(
      "Application",
      "https://remote.example/users/origin",
      "origin",
      "https://remote.example/users/origin/inbox",
      "https://remote.example/users/origin/outbox"
    )
    subscriber_actor = Aptok.actor(
      "Application",
      "https://subscriber.example/users/bot",
      "subscriber",
      "https://subscriber.example/users/bot/inbox",
      "https://subscriber.example/users/bot/outbox"
    )

    [origin_actor, subscriber_actor].each do |actor_json|
      actor_id = actor_json["id"].as_s
      follow = Aptok::Relay.subscribe(
        "#{actor_id}/activities/follow-relay",
        actor_id,
        config.relay_actor_id
      )
      follow["actor"] = Aptok.json(actor_json)

      result = Lepos::RelayService.handle_control(follow, config, store, transport)
      result.subscribed?.should be_true
    end

    Lepos::RelayService.subscriptions(config, store).size.should eq(2)

    activity = Aptok.create(
      "https://remote.example/activities/create-1",
      origin_actor["id"].as_s,
      Aptok.note("https://remote.example/notes/1", "Relay this task"),
      [Aptok::PUBLIC_COLLECTION]
    )

    sent = Lepos::RelayService.relay_activity(activity, config, store, transport)
    sent.size.should eq(1)
    sent.first.recipient.id.should eq(subscriber_actor["id"].as_s)
    sent.first.recipient.inbox.should eq(subscriber_actor["inbox"].as_s)
  end

  it "builds order activities with Aptok Create and ForgeFed Ticket payloads" do
    order = Lepos::OrderQueue::OrderRecord.new(
      id: "order-112",
      status: "queued",
      solver: "Lepos Solver",
      title: "Refactor federation",
      description: "Use Aptok for ActivityPub and ForgeFed."
    )

    activity = Lepos::OrderQueue.activity_for(order, "queued", test_config).as_h
    activity["type"].as_s.should eq("Create")
    activity["to"].as_a.map(&.as_s).should contain(Aptok::PUBLIC_COLLECTION)
    activity["@context"].as_a.map(&.as_s).should contain(Aptok::FORGEFED_CONTEXT)

    offer = activity["object"].as_h
    offer["type"].as_s.should eq("Offer")

    ticket = offer["object"].as_h.as(Aptok::JsonMap)
    ticket["type"].as_s.should eq("Ticket")
    ticket["name"].as_s.should eq(order.title)
    ticket["@context"].as_a.map(&.as_s).should contain(Aptok::FORGEFED_CONTEXT)
    Aptok.valid_forgefed?(ticket).should be_true
  end

  it "builds merge-request tickets with Aptok ForgeFed vocabulary" do
    merge_request = Lepos::ForgeFedStore::MergeRequestRecord.new(
      "mr-112",
      "repo-112",
      "tracker-112",
      "branch-112",
      "feature/aptok",
      "aptok",
      "https://lefine.test/actors/by-key/aptok",
      "main",
      "Use Aptok",
      "Replace local ForgeFed JSON assembly.",
      "open",
      "https://lefine.test/merge-requests/mr-112",
      "https://lefine.test/merge-requests/mr-112/offer",
      "https://lefine.test/branches/source",
      "https://lefine.test/branches/main",
      "https://lefine.test/patch-sets/one",
      "https://lefine.test/merge-requests/mr-112/diff",
      "base-sha",
      "head-sha",
      "2026-05-31T00:00:00Z",
      "2026-05-31T00:00:00Z",
      nil
    )

    ticket = Lepos::ForgeFedStore.merge_request_json(merge_request, test_config).as_h.as(Aptok::JsonMap)
    ticket["type"].as_s.should eq("Ticket")
    ticket["name"].as_s.should eq("Use Aptok")
    ticket["@context"].as_a.map(&.as_s).should contain(Aptok::FORGEFED_CONTEXT)
    ticket["attachment"].as_a.first.as_h["type"].as_s.should eq("Offer")
    Aptok.valid_forgefed?(ticket).should be_true
  end

  it "parses patch-tracker Apply activities through Aptok vocabulary" do
    apply = Aptok.forgefed_apply(
      "https://lefine.test/activities/apply-mr-112",
      "https://lefine.test/patch-trackers/tracker-112",
      "https://lefine.test/merge-requests/mr-112"
    )

    activity = Lepos::AptokPayload.activity_from_json(apply.to_json)
    activity.type.should eq("Apply")
    Lepos::AptokPayload.activity_object_id(activity).should eq("https://lefine.test/merge-requests/mr-112")
  end
end

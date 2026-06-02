require "./spec_helper"
require "../src/crater/order_queue"
require "../src/crater/forgefed_store"
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

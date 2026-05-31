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
end

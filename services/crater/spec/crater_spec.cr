require "spec"
require "../src/crater/forgefed/types"
require "../src/crater/activitypub/types"
require "../src/crater/config"

describe Crater::ForgeFed do
  describe ".valid_kind?" do
    it "returns true for valid kinds" do
      %w[bug feature support task review].each do |kind|
        Crater::ForgeFed.valid_kind?(kind).should be_true
      end
    end

    it "returns false for invalid kinds" do
      Crater::ForgeFed.valid_kind?("unknown").should be_false
    end
  end

  describe ".valid_status?" do
    it "returns true for valid statuses" do
      %w[open closed merged rejected].each do |status|
        Crater::ForgeFed.valid_status?(status).should be_true
      end
    end

    it "returns false for invalid statuses" do
      Crater::ForgeFed.valid_status?("unknown").should be_false
    end
  end

  describe ".valid_priority?" do
    it "returns true for valid priorities" do
      %w[low medium high critical].each do |priority|
        Crater::ForgeFed.valid_priority?(priority).should be_true
      end
    end

    it "returns false for invalid priorities" do
      Crater::ForgeFed.valid_priority?("unknown").should be_false
    end
  end
end

describe Crater::ForgeFed::Ticket do
  it "creates a ticket with defaults" do
    ticket = Crater::ForgeFed::Ticket.new(
      id: "test-123",
      kind: "bug",
      title: "Test bug"
    )

    ticket.id.should eq("test-123")
    ticket.kind.should eq("bug")
    ticket.title.should eq("Test bug")
    ticket.status.should eq("open")
    ticket.priority.should eq("medium")
    ticket.labels.should eq([] of String)
  end

  it "creates a ticket with all fields" do
    ticket = Crater::ForgeFed::Ticket.new(
      id: "ticket-456",
      kind: "feature",
      title: "Dark mode",
      content: "Add dark mode support",
      status: "open",
      priority: "high",
      labels: ["enhancement", "ui"],
      milestone: "v1.0"
    )

    ticket.kind.should eq("feature")
    ticket.priority.should eq("high")
    ticket.labels.should eq(["enhancement", "ui"])
    ticket.milestone.should eq("v1.0")
  end
end

describe Crater::Config do
  it "has sensible defaults" do
    Crater::Config::PORT.should eq(3001)
    Crater::Config::ACTOR_NAME.should eq("crater")
  end
end

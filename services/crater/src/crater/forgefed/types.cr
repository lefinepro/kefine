require "json"

module Crater
  module ForgeFed
    # ForgeFed Ticket (Issue) - extends ActivityPub Object
    struct Ticket
      include JSON::Serializable

      property id : String
      property kind : String  # bug | feature | support | task | review
      property title : String
      property content : String?
      property status : String  # open | closed | merged | rejected
      property priority : String  # low | medium | high | critical
      property labels : Array(String)
      property assignee_id : String?
      property reporter_id : String?
      property milestone : String?
      property due_date : String?
      property created_at : String
      property updated_at : String

      def initialize(
        @id : String,
        @kind : String,
        @title : String,
        @status : String = "open",
        @priority : String = "medium",
        @labels : Array(String) = [] of String,
        @content : String? = nil,
        @assignee_id : String? = nil,
        @reporter_id : String? = nil,
        @milestone : String? = nil,
        @due_date : String? = nil,
        @created_at : String = Time::Format::ISO_8601_DATE_TIME.format(Time.utc),
        @updated_at : String = Time::Format::ISO_8601_DATE_TIME.format(Time.utc)
      )
      end
    end

    # ForgeFed TicketComment - a Note in reply to a Ticket
    struct TicketComment
      include JSON::Serializable

      property id : String
      property ticket_id : String
      property content : String
      property author_id : String?
      property created_at : String
      property updated_at : String

      def initialize(
        @id : String,
        @ticket_id : String,
        @content : String,
        @author_id : String? = nil,
        @created_at : String = Time::Format::ISO_8601_DATE_TIME.format(Time.utc),
        @updated_at : String = Time::Format::ISO_8601_DATE_TIME.format(Time.utc)
      )
      end
    end

    # ForgeFed Project - extends AP OrderedCollection
    struct Project
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      property context : Array(String)

      property type : String
      property id : String
      property name : String
      property summary : String?

      @[JSON::Field(key: "sourceRepository")]
      property source_repository : String?

      @[JSON::Field(key: "issueTracker")]
      property issue_tracker : String?

      property tickets : String?
      property members : String?
      property administrators : Array(String)

      def initialize(
        @id : String,
        @name : String,
        @context : Array(String) = ["https://www.w3.org/ns/activitystreams", "https://forgefed.org"],
        @type : String = "Project",
        @summary : String? = nil,
        @source_repository : String? = nil,
        @issue_tracker : String? = nil,
        @tickets : String? = nil,
        @members : String? = nil,
        @administrators : Array(String) = [] of String
      )
      end
    end

    # Valid ticket kinds
    TICKET_KINDS = %w[bug feature support task review]

    # Valid ticket statuses
    TICKET_STATUSES = %w[open closed merged rejected]

    # Valid ticket priorities
    TICKET_PRIORITIES = %w[low medium high critical]

    def self.valid_kind?(kind : String) : Bool
      TICKET_KINDS.includes?(kind)
    end

    def self.valid_status?(status : String) : Bool
      TICKET_STATUSES.includes?(status)
    end

    def self.valid_priority?(priority : String) : Bool
      TICKET_PRIORITIES.includes?(priority)
    end
  end
end

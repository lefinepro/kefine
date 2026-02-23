require "json"
require "time"

module Crater
  module ForgeFed
    CONTEXT = "https://forgefed.org/ns"

    struct Project
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      getter context : Array(String)

      getter id : String
      getter type : String
      getter name : String
      getter summary : String?
      getter description : String?

      @[JSON::Field(key: "sourceRepository")]
      getter source_repository : String?

      @[JSON::Field(key: "issueTracker")]
      getter issue_tracker : String?

      getter administrators : Array(String)

      @[JSON::Field(key: "createdAt")]
      getter created_at : String

      @[JSON::Field(key: "updatedAt")]
      getter updated_at : String

      def initialize(
        @id : String,
        @name : String,
        @administrators : Array(String),
        @summary : String? = nil,
        @description : String? = nil,
        @source_repository : String? = nil,
        @issue_tracker : String? = nil
      )
        now = Time.utc.to_s
        @context = [ActivityPub::CONTEXT, CONTEXT]
        @type = "Project"
        @created_at = now
        @updated_at = now
      end
    end

    struct Ticket
      include JSON::Serializable

      @[JSON::Field(key: "@context")]
      getter context : Array(String)

      getter id : String
      getter type : String
      getter name : String
      getter content : String?
      getter status : String
      getter priority : String?
      getter reporter : String
      getter assignee : String?
      getter labels : Array(String)

      @[JSON::Field(key: "createdAt")]
      getter created_at : String

      @[JSON::Field(key: "updatedAt")]
      getter updated_at : String

      def initialize(
        @id : String,
        @name : String,
        @reporter : String,
        @content : String? = nil,
        @status : String = "open",
        @priority : String? = nil,
        @assignee : String? = nil,
        @labels : Array(String) = [] of String
      )
        now = Time.utc.to_s
        @context = [ActivityPub::CONTEXT, CONTEXT]
        @type = "Ticket"
        @created_at = now
        @updated_at = now
      end
    end
  end
end

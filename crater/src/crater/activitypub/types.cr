require "json"
require "../aptok"

module Lepos
  module ActivityPub
    CONTEXT           = Aptok::ACTIVITYSTREAMS_CONTEXT
    SECURITY_CONTEXT  = Aptok::SECURITY_CONTEXT
    PUBLIC_COLLECTION = Aptok::PUBLIC_COLLECTION

    class Activity
      getter json : Aptok::JsonMap
      getter parsed : Aptok::Vocab::Activity

      def self.from_json(value : String) : Activity
        parsed = JSON.parse(value)
        map = parsed.as_h? || raise JSON::ParseException.new("Activity payload must be an object", 1, 1)
        new(map.as(Aptok::JsonMap))
      end

      def initialize(@json : Aptok::JsonMap)
        @parsed = Aptok::Vocab::Activity.from_json_ld(@json)
      end

      def context : JSON::Any?
        @json["@context"]?
      end

      def id : String
        @parsed.id || @json["id"]?.try(&.as_s?) || ""
      end

      def type : String
        @parsed.type || @json["type"]?.try(&.as_s?) || ""
      end

      def actor : String
        @parsed.actor || @json["actor"]?.try(&.as_s?) || ""
      end

      def object : JSON::Any
        @json["object"]? || JSON::Any.new(nil)
      end

      def published : String?
        @parsed.published || @json["published"]?.try(&.as_s?)
      end

      def to : Array(String)?
        values = @parsed.to
        values.empty? ? nil : values
      end

      def cc : Array(String)?
        values = @parsed.cc
        values.empty? ? nil : values
      end

      def to_json(builder : JSON::Builder) : Nil
        @json.to_json(builder)
      end
    end
  end
end

require "json"

# Load the Aptok vocabulary/builders Lepos uses without pulling in optional stores.
require "aptok/portable"
require "aptok/vocabulary/vocabulary"
require "aptok/vocabulary/vocabulary_core_entities"
require "aptok/vocabulary/vocabulary_activity_entities"
require "aptok/vocabulary/vocabulary_social_objects"
require "aptok/vocabulary/vocabulary_forgefed_entities"
require "aptok/vocabulary/vocabulary_marketplace_context"
require "aptok/vocabulary/vocabulary_marketplace_entities"
require "aptok/vocabulary/vocabulary_activity_builders"
require "aptok/vocabulary/vocabulary_forgefed_marketplace_builders"
require "aptok/vocabulary/vocabulary_marketplace_collections"
require "aptok/vocabulary/vocabulary_validators"

module Lepos
  module AptokPayload
    def self.activity_from_json(value : String) : ::Aptok::Vocab::Activity
      parsed = JSON.parse(value)
      map = parsed.as_h? || raise JSON::ParseException.new("Activity payload must be an object", 1, 1)
      ::Aptok::Vocab::Activity.from_json_ld(map.as(::Aptok::JsonMap))
    end

    def self.activity_object(activity : ::Aptok::Vocab::Activity) : JSON::Any
      activity.json["object"]? || JSON::Any.new(nil)
    end
  end
end

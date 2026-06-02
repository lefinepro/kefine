require "json"

# Load the Aptok vocabulary/builders Lepos uses without pulling in optional stores.
require "aptok/portable"
require "aptok/discovery/discovery"
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
require "./version"
require "./utils/actor_keys"
require "./utils/config"

module Lepos
  module AptokPayload
    def self.actor_json(username : String, config : Utils::Config) : ::Aptok::JsonMap
      normalized_username = actor_username(username)
      actor_id = "#{config.crater_url}/actor/#{normalized_username}"
      service_actor = normalized_username == config.actor_username
      actor_type = service_actor ? "Application" : "Person"
      actor_name = service_actor ? config.actor_display_name : normalized_username
      public_key = actor_public_key(actor_id, config)

      actor = ::Aptok.actor(
        actor_type,
        actor_id,
        normalized_username,
        "#{actor_id}/inbox",
        "#{actor_id}/outbox",
        name: actor_name,
        summary: service_actor ? "Kefine Lepos federation service" : "Kefine lepo actor",
        shared_inbox: "#{config.crater_url}/inbox",
        public_key: public_key
      )
      actor["@context"] = ::Aptok.json([::Aptok::ACTIVITYSTREAMS_CONTEXT, ::Aptok::SECURITY_CONTEXT])
      actor
    end

    def self.key_actor_json(suffix : String, config : Utils::Config) : ::Aptok::JsonMap
      normalized = key_suffix(suffix)
      actor_id = "#{config.crater_url}/actors/by-key/#{normalized}"
      actor = ::Aptok.actor(
        "Person",
        actor_id,
        normalized,
        "#{actor_id}/inbox",
        "#{actor_id}/outbox",
        name: "Key #{normalized}"
      )
      actor["@context"] = ::Aptok.json([::Aptok::ACTIVITYSTREAMS_CONTEXT, ::Aptok::SECURITY_CONTEXT])
      actor
    end

    def self.webfinger_jrd(resource : String, config : Utils::Config) : ::Aptok::JsonMap
      ::Aptok.webfinger_jrd(
        resource,
        config.actor_id,
        aliases: [config.actor_id, "#{config.crater_url}/actor/#{config.actor_username}"]
      )
    end

    def self.nodeinfo_well_known(config : Utils::Config) : ::Aptok::JsonMap
      ::Aptok.nodeinfo_well_known("#{config.crater_url}/nodeinfo/2.1")
    end

    def self.nodeinfo_document : ::Aptok::JsonMap
      ::Aptok.nodeinfo(
        "lepos",
        Lepos::VERSION,
        protocols: ["activitypub"],
        users_total: 0_i64,
        metadata: ::Aptok::JsonMap{"forgefed" => ::Aptok.json(true)},
        local_posts: 0_i64,
        local_comments: 0_i64
      )
    end

    def self.activity_from_json(value : String) : ::Aptok::Vocab::Activity
      parsed = JSON.parse(value)
      map = parsed.as_h? || raise JSON::ParseException.new("Activity payload must be an object", 1, 1)
      ::Aptok::Vocab::Activity.from_json_ld(map.as(::Aptok::JsonMap))
    end

    def self.activity_object(activity : ::Aptok::Vocab::Activity) : JSON::Any
      activity.json["object"]? || JSON::Any.new(nil)
    end

    def self.activity_object_id(activity : ::Aptok::Vocab::Activity) : String?
      case object = activity.object
      when String
        object
      when ::Aptok::Vocab::Object
        object.id
      else
        nil
      end
    end

    private def self.actor_username(value : String) : String
      normalized = value.downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
      normalized.empty? ? "staff" : normalized
    end

    private def self.key_suffix(value : String) : String
      normalized = value.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-+|-+$/, "")
      normalized.empty? ? "key" : normalized
    end

    private def self.actor_public_key(actor_id : String, config : Utils::Config) : ::Aptok::JsonMap
      public_key_pem = Utils::ActorKeys.derive_public_key_pem(config.resolved_actor_private_key_pem) || ""
      public_key_string = Utils::ActorKeys.derive_public_key_string(config.resolved_actor_private_key_pem)
      public_key = ::Aptok.public_key("#{actor_id}#main-key", actor_id, public_key_pem)
      public_key["publicKeyString"] = ::Aptok.json(public_key_string)
      public_key
    end
  end
end

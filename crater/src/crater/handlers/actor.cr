require "kemal"
require "json"
require "../activitypub/types"
require "../utils/config"
require "../utils/actor_keys"

module Lepos
  module Handlers
    module Actor
      def self.register(config : Utils::Config)
        get "/actor" do |env|
          render_actor(env, config.actor_username, config)
        end

        get "/actors/by-key/:suffix" do |env|
          render_key_actor(env, env.params.url["suffix"], config)
        end

        get "/actor/:username" do |env|
          username = env.params.url["username"]
          render_actor(env, username, config)
        end
      end

      private def self.render_actor(env, username : String, config : Utils::Config)
        env.response.content_type = "application/activity+json"
        normalized_username = username.downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
        actor_id = "#{config.crater_url}/actor/#{normalized_username}"
        public_key_pem = Utils::ActorKeys.derive_public_key_pem(config.resolved_actor_private_key_pem) || ""
        public_key_string = Utils::ActorKeys.derive_public_key_string(config.resolved_actor_private_key_pem)
        actor_type = normalized_username == config.actor_username ? "Application" : "Person"
        actor_name = normalized_username == config.actor_username ? config.actor_display_name : normalized_username
        public_key = Aptok.public_key("#{actor_id}#main-key", actor_id, public_key_pem)
        public_key["publicKeyString"] = Aptok.json(public_key_string)

        actor = Aptok.actor(
          actor_type,
          actor_id,
          normalized_username,
          "#{actor_id}/inbox",
          "#{actor_id}/outbox",
          name: actor_name,
          summary: normalized_username == config.actor_username ? "Kefine Lepos federation service" : "Kefine lepo actor",
          shared_inbox: "#{config.crater_url}/inbox",
          public_key: public_key
        )
        actor["@context"] = Aptok.json([ActivityPub::CONTEXT, ActivityPub::SECURITY_CONTEXT])
        actor.to_json
      end

      private def self.render_key_actor(env, suffix : String, config : Utils::Config)
        env.response.content_type = "application/activity+json"
        normalized = suffix.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-+|-+$/, "")
        actor_id = "#{config.crater_url}/actors/by-key/#{normalized}"

        actor = Aptok.actor(
          "Person",
          actor_id,
          normalized,
          "#{actor_id}/inbox",
          "#{actor_id}/outbox",
          name: "Key #{normalized}"
        )
        actor["@context"] = Aptok.json([ActivityPub::CONTEXT, ActivityPub::SECURITY_CONTEXT])
        actor.to_json
      end
    end
  end
end

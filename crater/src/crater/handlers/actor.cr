require "kemal"
require "json"
require "../activitypub/types"
require "../utils/config"
require "../utils/actor_keys"

module Crater
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

        {
          "@context" => [
            ActivityPub::CONTEXT,
            ActivityPub::SECURITY_CONTEXT,
          ],
          "id"                => actor_id,
          "type"              => actor_type,
          "preferredUsername" => normalized_username,
          "name"              => actor_name,
          "summary"           => normalized_username == config.actor_username ? "Kefine ForgeFed/ActivityPub proxy service" : "Kefine task actor",
          "inbox"             => "#{actor_id}/inbox",
          "outbox"            => "#{actor_id}/outbox",
          "endpoints"         => {
            "sharedInbox" => "#{config.crater_url}/inbox",
          },
          "publicKey" => {
            "id"              => "#{actor_id}#main-key",
            "owner"           => actor_id,
            "publicKeyPem"    => public_key_pem,
            "publicKeyString" => public_key_string,
          },
        }.to_json
      end

      private def self.render_key_actor(env, suffix : String, config : Utils::Config)
        env.response.content_type = "application/activity+json"
        normalized = suffix.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-+|-+$/, "")
        actor_id = "#{config.crater_url}/actors/by-key/#{normalized}"

        {
          "@context" => [
            ActivityPub::CONTEXT,
            ActivityPub::SECURITY_CONTEXT,
          ],
          "id" => actor_id,
          "type" => "Person",
          "preferredUsername" => normalized,
          "name" => "Key #{normalized}",
          "inbox" => "#{actor_id}/inbox",
          "outbox" => "#{actor_id}/outbox",
        }.to_json
      end
    end
  end
end

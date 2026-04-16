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
          env.response.content_type = "application/activity+json"
          public_key_pem = Utils::ActorKeys.derive_public_key_pem(config.resolved_actor_private_key_pem) || ""
          public_key_string = Utils::ActorKeys.derive_public_key_string(config.resolved_actor_private_key_pem)

          {
            "@context" => [
              ActivityPub::CONTEXT,
              ActivityPub::SECURITY_CONTEXT,
            ],
            "id"                => config.actor_id,
            "type"              => "Application",
            "preferredUsername" => config.actor_username,
            "name"              => config.actor_display_name,
            "summary"           => "Kefine ForgeFed/ActivityPub proxy service",
            "inbox"             => config.actor_inbox,
            "outbox"            => config.actor_outbox,
            "endpoints"         => {
              "sharedInbox" => config.actor_inbox,
            },
            "publicKey" => {
              "id"           => "#{config.actor_id}#main-key",
              "owner"        => config.actor_id,
              "publicKeyPem" => public_key_pem,
              "publicKeyString" => public_key_string,
            },
          }.to_json
        end

        get "/actor/:username" do |env|
          username = env.params.url["username"]
          if username != config.actor_username
            env.response.status_code = 404
            next({error: "Actor not found"}.to_json)
          end

          env.response.status_code = 302
          env.response.headers["Location"] = config.actor_id
          ""
        end
      end
    end
  end
end

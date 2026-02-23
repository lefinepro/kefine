require "kemal"
require "json"
require "../activitypub/types"
require "../utils/config"

module Crater
  module Handlers
    module Actor
      def self.register(config : Utils::Config)
        get "/actor" do |env|
          env.response.content_type = "application/activity+json"

          {
            "@context" => [
              ActivityPub::CONTEXT,
              ActivityPub::SECURITY_CONTEXT,
            ],
            "id"                => config.actor_id,
            "type"              => "Application",
            "preferredUsername" => config.actor_username,
            "name"              => "Crater Proxy",
            "summary"           => "Kefine ForgeFed/ActivityPub proxy service",
            "inbox"             => config.actor_inbox,
            "outbox"            => config.actor_outbox,
            "endpoints"         => {
              "sharedInbox" => config.actor_inbox,
            },
            "publicKey" => {
              "id"           => "#{config.actor_id}#main-key",
              "owner"        => config.actor_id,
              "publicKeyPem" => "",
            },
          }.to_json
        end

        get "/u/:username" do |env|
          username = env.params.url["username"]
          if username == config.actor_username
            env.response.status_code = 302
            env.response.headers["Location"] = config.actor_id
          else
            env.response.status_code = 404
            {error: "Actor not found"}.to_json
          end
        end
      end
    end
  end
end

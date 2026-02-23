require "kemal"
require "../config"
require "../activitypub/types"

module Crater
  module Handlers
    module Actor
      def self.register
        # Main service actor
        get "/actor" do |env|
          env.response.content_type = "application/activity+json"

          base_url    = Config::BASE_URL
          actor_name  = Config::ACTOR_NAME
          domain      = Config::DOMAIN
          actor_url   = Config.actor_url
          inbox_url   = Config.inbox_url
          outbox_url  = Config.outbox_url

          response = {
            "@context" => ActivityPub::FULL_CONTEXT,
            "type"     => "Application",
            "id"       => actor_url,
            "preferredUsername" => actor_name,
            "name"     => "Crater",
            "summary"  => "Stateless ActivityPub/ForgeFed proxy for Kefine tasks",
            "url"      => "https://#{domain}",
            "inbox"    => inbox_url,
            "outbox"   => outbox_url,
            "endpoints" => {
              "sharedInbox" => "#{base_url}/shared-inbox"
            },
            "publicKey" => {
              "id"           => "#{actor_url}#main-key",
              "owner"        => actor_url,
              "publicKeyPem" => Config::PRIVATE_KEY.empty? ? "" : "# Public key not configured"
            }
          }

          response.to_json
        end

        # ForgeFed Project actor
        get "/projects/:id" do |env|
          env.response.content_type = "application/activity+json"

          project_id  = env.params.url["id"]
          base_url    = Config::BASE_URL

          response = {
            "@context" => ActivityPub::FULL_CONTEXT,
            "type"     => "Project",
            "id"       => "#{base_url}/projects/#{project_id}",
            "name"     => "Kefine Project",
            "summary"  => "OKR Task Management Project",
            "inbox"    => "#{base_url}/projects/#{project_id}/inbox",
            "outbox"   => "#{base_url}/projects/#{project_id}/outbox",
            "issueTracker" => "#{base_url}/projects/#{project_id}/tickets",
            "administrators" => [Config.actor_url]
          }

          response.to_json
        end
      end
    end
  end
end

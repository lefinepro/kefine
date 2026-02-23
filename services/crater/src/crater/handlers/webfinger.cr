require "kemal"
require "../config"

module Crater
  module Handlers
    module WebFinger
      def self.register
        get "/.well-known/webfinger" do |env|
          env.response.content_type = "application/jrd+json"

          resource = env.params.query["resource"]?
          unless resource
            env.response.status_code = 400
            next %({"error": "resource parameter is required"})
          end

          actor_url = Config.actor_url
          domain = Config::DOMAIN
          actor_name = Config::ACTOR_NAME

          # Support acct:name@domain or https://actor-url
          unless resource == "acct:#{actor_name}@#{domain}" ||
                 resource == actor_url
            env.response.status_code = 404
            next %({"error": "Resource not found"})
          end

          response = {
            "subject" => "acct:#{actor_name}@#{domain}",
            "aliases" => [actor_url],
            "links"   => [
              {
                "rel"  => "self",
                "type" => "application/activity+json",
                "href" => actor_url
              },
              {
                "rel"  => "http://webfinger.net/rel/profile-page",
                "type" => "text/html",
                "href" => actor_url
              }
            ]
          }

          response.to_json
        end
      end
    end
  end
end

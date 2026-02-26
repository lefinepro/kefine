require "kemal"
require "json"
require "../utils/config"

module Crater
  module Handlers
    module WebFinger
      def self.register(config : Utils::Config)
        get "/.well-known/webfinger" do |env|
          resource = env.params.query["resource"]?

          unless resource
            env.response.status_code = 400
            next({error: "resource parameter required"}.to_json)
          end

          env.response.content_type = "application/jrd+json"

          {
            subject:  resource,
            aliases:  [
              "http://#{config.domain}/actor",
              "http://#{config.domain}/u/#{config.actor_username}",
            ],
            links: [
              {
                rel:  "self",
                type: "application/activity+json",
                href: config.actor_id,
              },
            ],
          }.to_json
        end
      end
    end
  end
end

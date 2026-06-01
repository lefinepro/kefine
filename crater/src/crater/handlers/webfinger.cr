require "kemal"
require "json"
require "../aptok"
require "../utils/config"

module Lepos
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

          AptokPayload.webfinger_jrd(resource, config).to_json
        end
      end
    end
  end
end

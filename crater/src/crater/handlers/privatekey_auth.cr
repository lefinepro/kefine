require "json"
require "../utils/config"

module Crater
  module Handlers
    module PrivatekeyAuth
      SESSION_TTL = 30.days

      def self.register(config : Utils::Config)
        post "/auth/privatekey" do |env|
          env.response.content_type = "application/json"
          payload = parse_body(env)
          submitted_private_key = payload["privateKey"]?.try(&.as_s?) || ""
          resolved_private_key = submitted_private_key.strip.empty? ? config.actor_private_key_pem : submitted_private_key

          handle = config.actor_username
          display_name = config.actor_display_name.strip

          if resolved_private_key.strip.empty?
            env.response.status_code = 503
            next({error: "Private key is required."}.to_json)
          end

          {
            verified:    true,
            token:       "privatekey:#{handle}:#{Time.utc.to_unix_ms}",
            userId:      "privatekey:#{handle}",
            username:    handle,
            displayName: display_name.empty? ? handle : display_name,
            handle:      handle,
            email:       "#{handle}@actor.local",
            authType:    "privatekey",
            expiresAt:   (Time.utc + SESSION_TTL).to_rfc3339
          }.to_json
        end
      end

      private def self.parse_body(env)
        raw_body = env.request.body.try(&.gets_to_end) || ""
        return JSON.parse(%({})) if raw_body.empty?

        JSON.parse(raw_body)
      rescue
        JSON.parse(%({}))
      end
    end
  end
end

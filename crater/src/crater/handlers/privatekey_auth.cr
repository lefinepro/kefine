require "json"
require "../utils/config"
require "../utils/actor_keys"

module Crater
  module Handlers
    module PrivatekeyAuth
      SESSION_TTL = 30.days

      def self.register(config : Utils::Config)
        post "/auth" do |env|
          env.response.content_type = "application/json"
          next authenticate(config, env, parse_body(env))
        end

        post "/api/auth" do |env|
          env.response.content_type = "application/json"
          next authenticate(config, env, parse_body(env))
        end
      end

      private def self.parse_body(env)
        raw_body = env.request.body.try(&.gets_to_end) || ""
        return JSON.parse(%({})) if raw_body.empty?

        JSON.parse(raw_body)
      rescue
        JSON.parse(%({}))
      end

      private def self.authenticate(config : Utils::Config, env, payload : JSON::Any) : String
        submitted_public_key = payload["publickey"]?.try(&.["key"]?).try(&.as_s?) || ""
        configured_private_key = Utils::ActorKeys.normalize_private_key(config.resolved_actor_private_key_pem)
        submitted_or_default_public_key = submitted_public_key.strip.empty? ? Utils::ActorKeys.derive_public_key_string(configured_private_key) : submitted_public_key.strip

        handle = config.actor_username
        display_name = config.actor_display_name.strip

        if configured_private_key.empty?
          env.response.status_code = 503
          return({error: "Default actor private key is not configured."}.to_json)
        end

        if submitted_or_default_public_key.empty?
          env.response.status_code = 400
          return({error: "Public key is required."}.to_json)
        end

        configured_address = Utils::ActorKeys.derive_actor_address(configured_private_key)
        public_key_pem = Utils::ActorKeys.derive_public_key_pem(configured_private_key)
        public_key_string = Utils::ActorKeys.derive_public_key_string(configured_private_key)

        if configured_address.nil?
          env.response.status_code = 500
          return({error: "Default actor key is invalid."}.to_json)
        end

        unless Utils::ActorKeys.public_key_matches?(submitted_or_default_public_key, configured_private_key)
          env.response.status_code = 401
          return({error: "Public key does not match @#{handle}."}.to_json)
        end

        key_id = configured_address.not_nil!

        {
          verified:     true,
          token:        "publickey:#{handle}:#{Time.utc.to_unix_ms}",
          userId:       "publickey:#{handle}",
          username:     handle,
          displayName:  display_name.empty? ? handle : display_name,
          handle:       handle,
          email:        "#{handle}@actor.local",
          publickey:    {
            key: public_key_string,
            pem: public_key_pem || "",
          },
          keyId:        key_id,
          actorAddress: key_id,
          authType:     "publickey",
          expiresAt:    (Time.utc + SESSION_TTL).to_rfc3339
        }.to_json
      end
    end
  end
end

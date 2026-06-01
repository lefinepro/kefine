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
        submitted_or_default_public_key =
          submitted_public_key.strip.empty? ? Utils::ActorKeys.derive_public_key_string(configured_private_key) : submitted_public_key.strip

        if configured_private_key.empty?
          if submitted_or_default_public_key.empty?
            env.response.status_code = 503
            return({error: "Default actor private key is not configured."}.to_json)
          end
        end

        if submitted_or_default_public_key.empty?
          env.response.status_code = 400
          return({error: "Public key is required."}.to_json)
        end

        compact_public_key = Utils::ActorKeys.public_key_string_to_compact(submitted_or_default_public_key)
        if compact_public_key.empty?
          env.response.status_code = 400
          return({error: "Public key is invalid."}.to_json)
        end

        default_actor_login =
          !configured_private_key.empty? &&
            Utils::ActorKeys.public_key_matches?(submitted_or_default_public_key, configured_private_key)

        public_key_pem =
          if default_actor_login
            Utils::ActorKeys.derive_public_key_pem(configured_private_key)
          else
            Utils::ActorKeys.public_key_pem_from_string(submitted_or_default_public_key)
          end

        handle =
          if default_actor_login
            config.actor_username
          else
            compact_public_key
          end
        display_name =
          if default_actor_login
            resolved_display_name = config.actor_display_name.strip
            resolved_display_name.empty? ? handle : resolved_display_name
          else
            "@#{compact_public_key[0, Math.min(compact_public_key.bytesize, 16)]}"
          end
        email =
          if default_actor_login
            "#{handle}@actor.local"
          else
            "portable+#{compact_public_key[0, Math.min(compact_public_key.bytesize, 24)]}@local.invalid"
          end

        actor_address = "did:key:#{compact_public_key}"

        if default_actor_login && public_key_pem.nil?
          env.response.status_code = 500
          return({error: "Default actor key is invalid."}.to_json)
        end

        {
          verified:     true,
          token:        "publickey:#{compact_public_key}:#{Time.utc.to_unix_ms}",
          userId:       "publickey:#{compact_public_key}",
          username:     handle,
          displayName:  display_name,
          handle:       handle,
          email:        email,
          publickey:    {
            key: compact_public_key,
            pem: public_key_pem || "",
          },
          keyId:        actor_address,
          actorAddress: actor_address,
          authType:     "publickey",
          expiresAt:    (Time.utc + SESSION_TTL).to_rfc3339
        }.to_json
      end
    end
  end
end

require "json"

require "../ssh_key_store"
require "../utils/config"

module Lepos
  module Handlers
    module SshKeys
      def self.register(config : Utils::Config)
        get "/actor/:username/keys/ssh" do |env|
          env.response.content_type = "application/json"
          username = env.params.url["username"]
          records = SshKeyStore.list_by_actor(username, config)

          if records.any?
            SshKeyStore.to_json_payload(username, records).to_json
          else
            env.response.status_code = 404
            {error: "SSH keys are not configured."}.to_json
          end
        end

        put "/actor/:username/keys/ssh" do |env|
          env.response.content_type = "application/json"
          username = env.params.url["username"]
          payload = parse_body(env)
          public_keys = public_keys_from_payload(payload)

          begin
            records = SshKeyStore.replace_for_actor(username, public_keys, config)
            SshKeyStore.to_json_payload(username, records).to_json
          rescue ex
            env.response.status_code = 400
            {error: ex.message || "SSH public keys are invalid."}.to_json
          end
        end

        delete "/actor/:username/keys/ssh" do |env|
          env.response.content_type = "application/json"
          username = env.params.url["username"]
          removed = SshKeyStore.delete_for_actor(username, config)
          {deleted: removed}.to_json
        end
      end

      private def self.parse_body(env) : JSON::Any
        raw_body = env.request.body.try(&.gets_to_end) || ""
        return JSON.parse(%({})) if raw_body.empty?

        JSON.parse(raw_body)
      rescue
        JSON.parse(%({}))
      end

      private def self.public_keys_from_payload(payload : JSON::Any) : Array(String)
        keys = [] of String

        if public_keys = payload["publicKeys"]?
          if array = public_keys.as_a?
            array.each do |item|
              value = item.as_s?
              keys << value if value
            end
          elsif value = public_keys.as_s?
            keys << value
          end
        end

        if public_key = payload["publicKey"]?.try(&.as_s?)
          keys << public_key
        end

        if public_key = payload["key"]?.try(&.as_s?)
          keys << public_key
        end

        keys
      end
    end
  end
end

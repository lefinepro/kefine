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
          record = SshKeyStore.find_by_actor(username, config)

          if record
            SshKeyStore.to_json_payload(record).to_json
          else
            env.response.status_code = 404
            {error: "SSH key is not configured."}.to_json
          end
        end

        put "/actor/:username/keys/ssh" do |env|
          env.response.content_type = "application/json"
          username = env.params.url["username"]
          payload = parse_body(env)
          public_key = payload["publicKey"]?.try(&.as_s?) || payload["key"]?.try(&.as_s?) || ""

          begin
            record = SshKeyStore.upsert_for_actor(username, public_key, config)
            SshKeyStore.to_json_payload(record).to_json
          rescue ex
            env.response.status_code = 400
            {error: ex.message || "SSH public key is invalid."}.to_json
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
    end
  end
end

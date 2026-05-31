require "json"
require "../exchange_store"
require "../utils/config"

module Lepos
  module Handlers
    module Passkeys
      def self.register(config : Utils::Config)
        post "/passkeys/register/start" do |env|
          env.response.content_type = "application/json"
          payload = parse_body(env)
          username = payload["username"]?.try(&.as_s?) || ""
          rp_id = payload["rpID"]?.try(&.as_s?) || env.request.headers["Host"]? || config.rp_id
          rp_name = payload["rpName"]?.try(&.as_s?) || "Kefine Solver Exchange"

          begin
            result = ExchangeStore.begin_registration(config, username, rp_id, rp_name)
            {
              transactionId: result[:transaction_id],
              options:       result[:options],
            }.to_json
          rescue ex
            env.response.status_code = 400
            {error: ex.message}.to_json
          end
        end

        post "/passkeys/register/finish" do |env|
          env.response.content_type = "application/json"
          payload = parse_body(env)
          username = payload["username"]?.try(&.as_s?) || ""
          transaction_id = payload["transactionId"]?.try(&.as_s?) || ""
          response_payload = payload["response"]? || JSON.parse(%({}))

          begin
            session = ExchangeStore.finish_registration(config, username, transaction_id, response_payload)
            {
              verified:  true,
              token:     session.token,
              userId:    session.user_id,
              username:  session.username,
              expiresAt: session.expires_at,
            }.to_json
          rescue ex
            env.response.status_code = 400
            {error: ex.message}.to_json
          end
        end

        post "/passkeys/authenticate/start" do |env|
          env.response.content_type = "application/json"
          payload = parse_body(env)
          username = payload["username"]?.try(&.as_s?)
          rp_id = payload["rpID"]?.try(&.as_s?) || env.request.headers["Host"]? || config.rp_id

          begin
            result = ExchangeStore.begin_authentication(config, username, rp_id)
            {
              transactionId: result[:transaction_id],
              options:       result[:options],
            }.to_json
          rescue ex
            env.response.status_code = 400
            {error: ex.message}.to_json
          end
        end

        post "/passkeys/authenticate/finish" do |env|
          env.response.content_type = "application/json"
          payload = parse_body(env)
          transaction_id = payload["transactionId"]?.try(&.as_s?) || ""
          response_payload = payload["response"]? || JSON.parse(%({}))

          begin
            session = ExchangeStore.finish_authentication(config, transaction_id, response_payload)
            {
              verified:  true,
              token:     session.token,
              userId:    session.user_id,
              username:  session.username,
              expiresAt: session.expires_at,
            }.to_json
          rescue ex
            env.response.status_code = 400
            {error: ex.message}.to_json
          end
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

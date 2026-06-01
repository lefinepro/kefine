require "json"

module Crater
  module Handlers
    module BrowserWalletAuth
      SESSION_TTL = 30.days
      ADDRESS_PATTERN = /\A0x[a-fA-F0-9]{40}\z/
      TON_ADDRESS_PATTERN = /\A(?:-?\d+):[0-9a-fA-F]{64}\z/

      def self.register(_config : Utils::Config)
        post "/auth/wallet/browser" do |env|
          env.response.content_type = "application/json"
          next authenticate(env, parse_body(env))
        end

        post "/api/auth/wallet/browser" do |env|
          env.response.content_type = "application/json"
          next authenticate(env, parse_body(env))
        end

        post "/auth/wallet/ton" do |env|
          env.response.content_type = "application/json"
          next authenticate_ton(env, parse_body(env))
        end

        post "/api/auth/wallet/ton" do |env|
          env.response.content_type = "application/json"
          next authenticate_ton(env, parse_body(env))
        end
      end

      private def self.parse_body(env)
        raw_body = env.request.body.try(&.gets_to_end) || ""
        return JSON.parse(%({})) if raw_body.empty?

        JSON.parse(raw_body)
      rescue
        JSON.parse(%({}))
      end

      private def self.authenticate(env, payload : JSON::Any) : String
        wallet = payload["wallet"]?
        address = wallet.try(&.["address"]?).try(&.as_s?).to_s.strip
        chain_id = wallet.try(&.["chainId"]?).try(&.raw)

        unless valid_address?(address)
          env.response.status_code = 400
          return({error: "Browser wallet address is invalid."}.to_json)
        end

        normalized_address = address.downcase
        compact_address = "#{normalized_address[0, 6]}...#{normalized_address[-4, 4]}"
        chain_id_value = chain_id.is_a?(Int64) ? chain_id : chain_id.is_a?(Int32) ? chain_id.to_i64 : nil

        {
          verified:    true,
          token:       "wallet:#{normalized_address}:#{Time.utc.to_unix_ms}",
          userId:      "wallet:#{normalized_address}",
          username:    normalized_address,
          displayName: compact_address,
          handle:      normalized_address,
          email:       "wallet+#{normalized_address[2, 12]}@local.invalid",
          authType:    "wallet",
          address:     normalized_address,
          chainId:     chain_id_value,
          expiresAt:   (Time.utc + SESSION_TTL).to_rfc3339
        }.to_json
      end

      private def self.valid_address?(address : String) : Bool
        !address.empty? && ADDRESS_PATTERN.matches?(address)
      end

      private def self.authenticate_ton(env, payload : JSON::Any) : String
        wallet = payload["wallet"]?
        address = wallet.try(&.["address"]?).try(&.as_s?).to_s.strip

        unless valid_ton_address?(address)
          env.response.status_code = 400
          return({error: "TON wallet address is invalid."}.to_json)
        end

        compact_address = "#{address[0, 8]}...#{address[-6, 6]}"

        {
          verified:    true,
          token:       "ton:#{address}:#{Time.utc.to_unix_ms}",
          userId:      "ton:#{address}",
          username:    address,
          displayName: compact_address,
          handle:      address,
          email:       "ton+#{Digest::SHA256.hexdigest(address)[0, 20]}@local.invalid",
          authType:    "wallet",
          address:     address,
          chainId:     nil,
          expiresAt:   (Time.utc + SESSION_TTL).to_rfc3339
        }.to_json
      end

      private def self.valid_ton_address?(address : String) : Bool
        !address.empty? && TON_ADDRESS_PATTERN.matches?(address)
      end
    end
  end
end

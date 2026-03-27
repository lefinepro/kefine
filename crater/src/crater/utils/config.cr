require "uri"

module Crater
  module Utils
    struct Config
      getter port : Int32
      getter host : String
      getter env : String
      getter crater_url : String
      getter exchange_url : String
      getter exchange_store_path : String
      getter database_url : String
      getter payment_evm_address : String
      getter payment_chain_id : Int64
      getter payment_token_address : String
      getter payment_token_symbol : String
      getter payment_token_decimals : Int32
      getter log_level : String

      def initialize(
        @port : Int32,
        @host : String,
        @env : String,
        @crater_url : String,
        @exchange_url : String,
        @exchange_store_path : String,
        @database_url : String,
        @payment_evm_address : String,
        @payment_chain_id : Int64,
        @payment_token_address : String,
        @payment_token_symbol : String,
        @payment_token_decimals : Int32,
        @log_level : String
      )
      end

      def self.load(env : Hash(String, String) = ENV.to_h) : Config
        crater_url = normalize_url(env.fetch("KEFINE_CRATER", "http://localhost:3001"))
        exchange_url = normalize_url(env.fetch("KEFINE_EXCHANGE", crater_url))

        new(
          port: env.fetch("PORT", "3001").to_i,
          host: env.fetch("HOST", "0.0.0.0"),
          env: env.fetch("CRYSTAL_ENV", "development"),
          crater_url: crater_url,
          exchange_url: exchange_url,
          exchange_store_path: env.fetch("EXCHANGE_STORE_PATH", ".data/exchange-state.json"),
          database_url: env.fetch("KEFINE_DATABASE_URL", "postgresql://kefine:kefine@localhost:5432/kefine"),
          payment_evm_address: env.fetch("KEFINE_PAYMENT_EVM_ADDRESS", ""),
          payment_chain_id: env.fetch("KEFINE_PAYMENT_CHAIN_ID", "43114").to_i64,
          payment_token_address: env.fetch("KEFINE_PAYMENT_TOKEN_ADDRESS", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
          payment_token_symbol: env.fetch("KEFINE_PAYMENT_TOKEN_SYMBOL", "USDC"),
          payment_token_decimals: env.fetch("KEFINE_PAYMENT_TOKEN_DECIMALS", "6").to_i,
          log_level: env.fetch("LOG_LEVEL", "info")
        )
      end

      private def self.normalize_url(value : String) : String
        value.rstrip('/')
      end

      def actor_id : String
        "#{crater_url}/actor"
      end

      def actor_username : String
        "crater"
      end

      def domain : String
        uri = URI.parse(crater_url)
        host = uri.host || "localhost"
        port = uri.port
        port ? "#{host}:#{port}" : host
      end

      def actor_inbox : String
        "#{crater_url}/inbox"
      end

      def actor_outbox : String
        "#{crater_url}/outbox"
      end

      def order_queue_inbox : String
        "#{exchange_url}/inbox"
      end

      def rp_id : String
        URI.parse(crater_url).host || "localhost"
      end
    end
  end
end

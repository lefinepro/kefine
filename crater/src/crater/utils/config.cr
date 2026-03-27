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
      getter log_level : String

      def initialize(
        @port : Int32,
        @host : String,
        @env : String,
        @crater_url : String,
        @exchange_url : String,
        @exchange_store_path : String,
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

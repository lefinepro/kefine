require "json"
require "uri"

module Crater
  module Utils
    struct Config
      getter port : Int32
      getter host : String
      getter env : String
      getter crater_url : String
      getter exchange_url : String
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
        @database_url : String,
        @payment_evm_address : String,
        @payment_chain_id : Int64,
        @payment_token_address : String,
        @payment_token_symbol : String,
        @payment_token_decimals : Int32,
        @log_level : String
      )
      end

      def self.load : Config
        raw = load_json_config
        backend = raw["backend"]?.try(&.as_h) || Hash(String, JSON::Any).new
        payment = raw["payment"]?.try(&.as_h) || Hash(String, JSON::Any).new

        crater_url = normalize_url(read_string(backend, "craterBaseUrl", "http://localhost:3001"))
        exchange_url = normalize_url(read_string(backend, "exchangeBaseUrl", crater_url))

        new(
          port: read_int(backend, "port", 3001),
          host: read_string(backend, "host", "0.0.0.0"),
          env: read_string(backend, "environment", "development"),
          crater_url: crater_url,
          exchange_url: exchange_url,
          database_url: read_string(backend, "databaseUrl", "postgresql://kefine:kefine@localhost:5432/kefine"),
          payment_evm_address: read_string(payment, "evmAddress", ""),
          payment_chain_id: read_i64(payment, "chainId", 43114_i64),
          payment_token_address: read_string(payment, "tokenAddress", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
          payment_token_symbol: read_string(payment, "tokenSymbol", "USDC"),
          payment_token_decimals: read_int(payment, "tokenDecimals", 6),
          log_level: read_string(backend, "logLevel", "info")
        )
      end

      private def self.normalize_url(value : String) : String
        value.rstrip('/')
      end

      private def self.read_string(source : Hash(String, JSON::Any), key : String, fallback : String) : String
        value = source[key]?.try(&.raw)
        return fallback unless value.is_a?(String)

        normalized = value.strip
        normalized.empty? ? fallback : normalized
      end

      private def self.read_int(source : Hash(String, JSON::Any), key : String, fallback : Int32) : Int32
        source[key]?.try(&.raw).try { |value| value.is_a?(Int64) ? value.to_i : value.is_a?(Int32) ? value : nil } || fallback
      end

      private def self.read_i64(source : Hash(String, JSON::Any), key : String, fallback : Int64) : Int64
        source[key]?.try(&.raw).try { |value| value.is_a?(Int64) ? value : value.is_a?(Int32) ? value.to_i64 : nil } || fallback
      end

      private def self.load_json_config : Hash(String, JSON::Any)
        config_path = find_config_path
        return Hash(String, JSON::Any).new unless config_path

        JSON.parse(File.read(config_path)).as_h
      rescue
        Hash(String, JSON::Any).new
      end

      private def self.find_config_path : String?
        candidates = [
          File.expand_path("kefine.config.json", Dir.current),
          File.expand_path("../kefine.config.json", Dir.current)
        ]

        candidates.find { |candidate| File.exists?(candidate) }
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

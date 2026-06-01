require "json"
require "uri"

module Lepos
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
      getter git_authorized_keys_path : String?
      getter git_ssh_shell_command : String?
      getter actor_handle : String
      getter actor_display_name : String
      getter actor_private_key : String
      getter frontend_url : String?
      getter google_oauth_client_id : String?
      getter google_oauth_client_secret : String?
      getter github_oauth_client_id : String?
      getter github_oauth_client_secret : String?
      getter maddy_smtp_host : String?
      getter maddy_smtp_port : Int32
      getter maddy_smtp_username : String?
      getter maddy_smtp_password : String?
      getter maddy_from_email : String?
      getter maddy_from_name : String?
      getter repositories_enabled : Bool

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
        @log_level : String,
        @git_authorized_keys_path : String?,
        @git_ssh_shell_command : String?,
        @actor_handle : String,
        @actor_display_name : String,
        @actor_private_key : String,
        @frontend_url : String?,
        @google_oauth_client_id : String?,
        @google_oauth_client_secret : String?,
        @github_oauth_client_id : String?,
        @github_oauth_client_secret : String?,
        @maddy_smtp_host : String?,
        @maddy_smtp_port : Int32,
        @maddy_smtp_username : String?,
        @maddy_smtp_password : String?,
        @maddy_from_email : String?,
        @maddy_from_name : String?,
        @repositories_enabled : Bool
      )
      end

      def self.load : Config
        raw = load_json_config
        features = raw["features"]?.try(&.as_h) || Hash(String, JSON::Any).new
        backend = raw["backend"]?.try(&.as_h) || Hash(String, JSON::Any).new
        origins = raw["origins"]?.try(&.as_h) || Hash(String, JSON::Any).new
        payment = raw["payment"]?.try(&.as_h) || Hash(String, JSON::Any).new
        default_actor = raw["defaultActor"]?.try(&.as_h) || Hash(String, JSON::Any).new
        oauth = raw["oauth"]?.try(&.as_h) || Hash(String, JSON::Any).new
        email_auth = raw["emailAuth"]?.try(&.as_h) || Hash(String, JSON::Any).new

        crater_url = normalize_url(
          read_env_or_string(
            "CRATER_PUBLIC_URL",
            origins,
            "primary",
            read_env_or_string("CRATER_BASE_URL", backend, "craterBaseUrl", "http://localhost:3001")
          )
        )
        exchange_url = normalize_url(read_env_or_string("EXCHANGE_BASE_URL", backend, "exchangeBaseUrl", crater_url))

        new(
          port: read_int(backend, "port", 3001),
          host: read_string(backend, "host", "0.0.0.0"),
          env: read_string(backend, "environment", "development"),
          crater_url: crater_url,
          exchange_url: exchange_url,
          database_url: read_env_or_string("DATABASE_URL", backend, "databaseUrl", "postgresql://kefine:kefine@localhost:5432/kefine"),
          payment_evm_address: read_string(payment, "evmAddress", ""),
          payment_chain_id: read_i64(payment, "chainId", 43114_i64),
          payment_token_address: read_string(payment, "tokenAddress", "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
          payment_token_symbol: read_string(payment, "tokenSymbol", "USDC"),
          payment_token_decimals: read_int(payment, "tokenDecimals", 6),
          log_level: read_string(backend, "logLevel", "info"),
          git_authorized_keys_path: read_env_or_optional_string("KEFINE_GIT_AUTHORIZED_KEYS_PATH", backend, "gitAuthorizedKeysPath"),
          git_ssh_shell_command: read_env_or_optional_string("KEFINE_GIT_SSH_SHELL_COMMAND", backend, "gitSshShellCommand"),
          actor_handle: read_string(default_actor, "handle", "staff"),
          actor_display_name: read_string(default_actor, "displayName", "Staff"),
          actor_private_key: read_env_or_string("KEFINE_PRIVATEKEY_DEFAULT", default_actor, "privateKey", read_string(default_actor, "privateKeyPem", "")),
          frontend_url: read_env_or_optional_string("KEFINE_FRONTEND_URL", origins, "frontend"),
          google_oauth_client_id: read_env_or_optional_string("GOOGLE_CLIENT_ID", oauth, "googleClientId"),
          google_oauth_client_secret: read_env_or_optional_string("GOOGLE_CLIENT_SECRET", oauth, "googleClientSecret"),
          github_oauth_client_id: read_env_or_optional_string("GITHUB_CLIENT_ID", oauth, "githubClientId"),
          github_oauth_client_secret: read_env_or_optional_string("GITHUB_CLIENT_SECRET", oauth, "githubClientSecret"),
          maddy_smtp_host: read_env_or_optional_string("MADDY_SMTP_HOST", email_auth, "smtpHost"),
          maddy_smtp_port: read_env_or_int("MADDY_SMTP_PORT", email_auth, "smtpPort", 25),
          maddy_smtp_username: read_env_or_optional_string("MADDY_SMTP_USERNAME", email_auth, "smtpUsername"),
          maddy_smtp_password: read_env_or_optional_string("MADDY_SMTP_PASSWORD", email_auth, "smtpPassword"),
          maddy_from_email: read_env_or_optional_string("MADDY_FROM_EMAIL", email_auth, "fromEmail"),
          maddy_from_name: read_env_or_optional_string("MADDY_FROM_NAME", email_auth, "fromName"),
          repositories_enabled: read_env_or_bool("KEFINE_FEATURE_REPOSITORIES", features, "repositories", true)
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

      private def self.read_env_or_string(env_key : String, source : Hash(String, JSON::Any), key : String, fallback : String) : String
        value = ENV[env_key]?.try(&.strip)
        return value.not_nil! unless value.nil? || value.empty?

        read_string(source, key, fallback)
      end

      private def self.read_optional_string(source : Hash(String, JSON::Any), key : String) : String?
        value = source[key]?.try(&.raw)
        return nil unless value.is_a?(String)

        normalized = value.strip
        normalized.empty? ? nil : normalized
      end

      private def self.read_env_or_optional_string(env_key : String, source : Hash(String, JSON::Any), key : String) : String?
        value = ENV[env_key]?.try(&.strip)
        return value.not_nil! unless value.nil? || value.empty?

        read_optional_string(source, key)
      end

      private def self.read_env_or_int(env_key : String, source : Hash(String, JSON::Any), key : String, fallback : Int32) : Int32
        value = ENV[env_key]?.try(&.strip)
        if value && !value.empty?
          parsed = value.to_i?
          return parsed if parsed
        end

        read_int(source, key, fallback)
      end

      private def self.read_int(source : Hash(String, JSON::Any), key : String, fallback : Int32) : Int32
        source[key]?.try(&.raw).try { |value| value.is_a?(Int64) ? value.to_i : value.is_a?(Int32) ? value : nil } || fallback
      end

      private def self.read_i64(source : Hash(String, JSON::Any), key : String, fallback : Int64) : Int64
        source[key]?.try(&.raw).try { |value| value.is_a?(Int64) ? value : value.is_a?(Int32) ? value.to_i64 : nil } || fallback
      end

      private def self.read_env_or_bool(env_key : String, source : Hash(String, JSON::Any), key : String, fallback : Bool) : Bool
        value = ENV[env_key]?.try(&.strip)
        return parse_bool(value.not_nil!, fallback) unless value.nil? || value.empty?

        raw = source[key]?.try(&.raw)
        parse_bool(raw, fallback)
      end

      private def self.parse_bool(value, fallback : Bool) : Bool
        case value
        when Bool
          value
        when Int64
          value != 0
        when Float64
          value != 0.0
        when String
          normalized = value.strip.downcase
          return fallback if normalized.empty?
          return true if {"true", "1", "yes", "on", "enabled"}.includes?(normalized)
          return false if {"false", "0", "no", "off", "disabled"}.includes?(normalized)
          fallback
        else
          fallback
        end
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
          File.expand_path("../kefine.config.json", Dir.current),
        ]

        candidates.find { |candidate| File.exists?(candidate) }
      end

      def actor_id : String
        "#{crater_url}/actor/#{actor_username}"
      end

      def actor_username : String
        normalized = actor_handle.downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
        normalized.empty? ? "staff" : normalized
      end

      def domain : String
        uri = URI.parse(crater_url)
        host = uri.host || "localhost"
        port = uri.port
        port ? "#{host}:#{port}" : host
      end

      def actor_inbox : String
        "#{actor_id}/inbox"
      end

      def actor_outbox : String
        "#{actor_id}/outbox"
      end

      def order_queue_inbox : String
        "#{exchange_url}/inbox"
      end

      def rp_id : String
        URI.parse(crater_url).host || "localhost"
      end

      def resolved_actor_private_key_pem : String
        actor_private_key
      end

      def feature_enabled?(feature : String) : Bool
        case feature
        when "repositories"
          repositories_enabled
        else
          true
        end
      end
    end
  end
end

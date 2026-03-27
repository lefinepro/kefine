require "base64"
require "file_utils"
require "json"
require "mutex"
require "random/secure"
require "time"
require "uri"
require "uuid"

require "./utils/config"

module Crater
  module ExchangeStore
    CHALLENGE_TTL = 5.minutes
    SESSION_TTL = 30.days

    class CredentialRecord
      include JSON::Serializable

      property id : String
      property public_key : String?
      property counter : Int32
      property created_at : String

      def initialize(
        @id : String,
        @public_key : String? = nil,
        @counter : Int32 = 0,
        @created_at : String = Time.utc.to_rfc3339
      )
      end
    end

    class UserRecord
      include JSON::Serializable

      property id : String
      property username : String
      property created_at : String
      property credentials : Array(CredentialRecord)

      def initialize(
        @id : String,
        @username : String,
        @created_at : String = Time.utc.to_rfc3339,
        @credentials : Array(CredentialRecord) = [] of CredentialRecord
      )
      end
    end

    class ChallengeRecord
      include JSON::Serializable

      property transaction_id : String
      property kind : String
      property username : String?
      property challenge : String
      property rp_id : String
      property created_at : String
      property expires_at : String

      def initialize(
        @transaction_id : String,
        @kind : String,
        @challenge : String,
        @rp_id : String,
        @username : String? = nil,
        @created_at : String = Time.utc.to_rfc3339,
        @expires_at : String = (Time.utc + CHALLENGE_TTL).to_rfc3339
      )
      end
    end

    class SessionRecord
      include JSON::Serializable

      property token : String
      property user_id : String
      property username : String
      property created_at : String
      property expires_at : String

      def initialize(
        @token : String,
        @user_id : String,
        @username : String,
        @created_at : String = Time.utc.to_rfc3339,
        @expires_at : String = (Time.utc + SESSION_TTL).to_rfc3339
      )
      end
    end

    class State
      include JSON::Serializable

      property users : Array(UserRecord)
      property challenges : Array(ChallengeRecord)
      property sessions : Array(SessionRecord)

      def initialize(
        @users : Array(UserRecord) = [] of UserRecord,
        @challenges : Array(ChallengeRecord) = [] of ChallengeRecord,
        @sessions : Array(SessionRecord) = [] of SessionRecord
      )
      end
    end

    record SessionResult, token : String, user_id : String, username : String, expires_at : String

    @@lock = Mutex.new

    private def self.store_path(config : Utils::Config) : String
      config.exchange_store_path
    end

    private def self.parse_time(value : String) : Time?
      Time.parse_rfc3339(value)
    rescue
      nil
    end

    private def self.ensure_store_exists(config : Utils::Config) : Nil
      path = store_path(config)
      FileUtils.mkdir_p(File.dirname(path))
      return if File.exists?(path)

      File.write(path, State.new.to_json)
    end

    private def self.read_state(config : Utils::Config) : State
      ensure_store_exists(config)
      State.from_json(File.read(store_path(config)))
    rescue
      State.new
    end

    private def self.write_state(config : Utils::Config, state : State) : Nil
      ensure_store_exists(config)
      File.write(store_path(config), state.to_json)
    end

    private def self.prune!(state : State) : Nil
      now = Time.utc
      state.challenges.select! do |challenge|
        expires_at = parse_time(challenge.expires_at)
        expires_at && expires_at > now
      end
      state.sessions.select! do |session|
        expires_at = parse_time(session.expires_at)
        expires_at && expires_at > now
      end
    end

    private def self.find_user(state : State, username : String) : UserRecord?
      state.users.find { |user| user.username == username }
    end

    private def self.find_user_by_credential(state : State, credential_id : String) : UserRecord?
      state.users.find do |user|
        user.credentials.any? { |credential| credential.id == credential_id }
      end
    end

    private def self.user_handle(config : Utils::Config, username : String) : String
      "#{config.exchange_url}/users/#{URI.encode_path(username)}"
    end

    private def self.next_challenge : String
      Base64.urlsafe_encode(Random::Secure.random_bytes(32), padding: false)
    end

    private def self.create_session(state : State, config : Utils::Config, user : UserRecord) : SessionResult
      user_id = user.id.empty? ? user_handle(config, user.username) : user.id
      session = SessionRecord.new(
        token: UUID.random.to_s,
        user_id: user_id,
        username: user.username
      )
      state.sessions.reject! { |existing| existing.username == user.username }
      state.sessions << session
      SessionResult.new(session.token, session.user_id, session.username, session.expires_at)
    end

    def self.begin_registration(config : Utils::Config, username : String, rp_id : String, rp_name : String)
      raise ArgumentError.new("Username is required.") if username.strip.empty?

      @@lock.synchronize do
        state = read_state(config)
        prune!(state)

        user = find_user(state, username)
        challenge = ChallengeRecord.new(
          transaction_id: UUID.random.to_s,
          kind: "register",
          challenge: next_challenge,
          rp_id: rp_id,
          username: username
        )
        state.challenges.reject! { |existing| existing.username == username && existing.kind == "register" }
        state.challenges << challenge
        write_state(config, state)

        credentials = user.try(&.credentials) || [] of CredentialRecord
        {
          transaction_id: challenge.transaction_id,
          options: {
            challenge: challenge.challenge,
            rp: {
              name: rp_name,
              id: rp_id
            },
            user: {
              id: Base64.urlsafe_encode(username.to_slice, padding: false),
              name: username,
              displayName: username
            },
            pubKeyCredParams: [
              {type: "public-key", alg: -7},
              {type: "public-key", alg: -257}
            ],
            timeout: 60000,
            attestation: "none",
            authenticatorSelection: {
              residentKey: "preferred",
              userVerification: "preferred"
            },
            excludeCredentials: credentials.map do |credential|
              {
                id: credential.id,
                type: "public-key"
              }
            end
          }
        }
      end
    end

    def self.finish_registration(config : Utils::Config, username : String, transaction_id : String, payload : JSON::Any) : SessionResult
      raise ArgumentError.new("Username is required.") if username.strip.empty?

      credential_id = payload["id"]?.try(&.as_s?) || payload["rawId"]?.try(&.as_s?)
      raise ArgumentError.new("Passkey response is missing credential id.") if credential_id.nil? || credential_id.empty?

      @@lock.synchronize do
        state = read_state(config)
        prune!(state)

        challenge = state.challenges.find do |entry|
          entry.transaction_id == transaction_id && entry.kind == "register"
        end
        raise ArgumentError.new("Registration challenge has expired.") unless challenge
        raise ArgumentError.new("Registration username mismatch.") if challenge.username != username

        user = find_user(state, username)
        unless user
          user = UserRecord.new(
            id: user_handle(config, username),
            username: username
          )
          state.users << user
        end

        unless user.credentials.any? { |credential| credential.id == credential_id }
          response_map = payload["response"]?.try(&.as_h?)
          public_key = response_map.try(&.["publicKey"]?).try(&.as_s?)
          user.credentials << CredentialRecord.new(
            id: credential_id,
            public_key: public_key
          )
        end

        state.challenges.reject! { |entry| entry.transaction_id == transaction_id }
        session = create_session(state, config, user)
        write_state(config, state)
        session
      end
    end

    def self.begin_authentication(config : Utils::Config, username : String?, rp_id : String)
      @@lock.synchronize do
        state = read_state(config)
        prune!(state)

        user = username.try { |value| find_user(state, value) }
        if username && user.nil?
          raise ArgumentError.new("No passkey profile exists for this username.")
        end

        credentials =
          if user
            user.credentials
          else
            state.users.flat_map(&.credentials)
          end
        raise ArgumentError.new("No passkey credential was found.") if credentials.empty?

        challenge = ChallengeRecord.new(
          transaction_id: UUID.random.to_s,
          kind: "authenticate",
          challenge: next_challenge,
          rp_id: rp_id,
          username: username
        )
        state.challenges << challenge
        write_state(config, state)

        {
          transaction_id: challenge.transaction_id,
          options: {
            challenge: challenge.challenge,
            timeout: 60000,
            rpId: rp_id,
            allowCredentials: credentials.map do |credential|
              {
                id: credential.id,
                type: "public-key"
              }
            end,
            userVerification: "preferred"
          }
        }
      end
    end

    def self.finish_authentication(config : Utils::Config, transaction_id : String, payload : JSON::Any) : SessionResult
      credential_id = payload["id"]?.try(&.as_s?) || payload["rawId"]?.try(&.as_s?)
      raise ArgumentError.new("Passkey response is missing credential id.") if credential_id.nil? || credential_id.empty?

      @@lock.synchronize do
        state = read_state(config)
        prune!(state)

        challenge = state.challenges.find do |entry|
          entry.transaction_id == transaction_id && entry.kind == "authenticate"
        end
        raise ArgumentError.new("Authentication challenge has expired.") unless challenge

        user = find_user_by_credential(state, credential_id)
        raise ArgumentError.new("No matching passkey credential was found.") unless user

        if challenge.username && challenge.username != user.username
          raise ArgumentError.new("Authentication username mismatch.")
        end

        state.challenges.reject! { |entry| entry.transaction_id == transaction_id }
        session = create_session(state, config, user)
        write_state(config, state)
        session
      end
    end
  end
end

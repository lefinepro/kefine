require "base64"
require "db"
require "json"
require "mutex"
require "pg"
require "random/secure"
require "time"
require "uri"
require "uuid"

require "./utils/config"

module Lepos
  module ExchangeStore
    CHALLENGE_TTL = 5.minutes
    SESSION_TTL   = 30.days

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

    record SessionResult, token : String, user_id : String, username : String, expires_at : String

    @@db : DB::Database? = nil
    @@db_lock = Mutex.new
    @@lock = Mutex.new
    @@ready = false

    private def self.setup(config : Utils::Config) : Nil
      db = database(config)
      return if @@ready

      @@db_lock.synchronize do
        unless @@ready
          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS exchange_users (
              id TEXT PRIMARY KEY,
              username TEXT NOT NULL UNIQUE,
              created_at TEXT NOT NULL
            )
          SQL

          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS exchange_credentials (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              public_key TEXT,
              counter INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL
            )
          SQL

          db.exec "CREATE INDEX IF NOT EXISTS idx_exchange_credentials_user_id ON exchange_credentials(user_id)"

          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS exchange_challenges (
              transaction_id TEXT PRIMARY KEY,
              kind TEXT NOT NULL,
              username TEXT,
              challenge TEXT NOT NULL,
              rp_id TEXT NOT NULL,
              created_at TEXT NOT NULL,
              expires_at TEXT NOT NULL
            )
          SQL

          db.exec "CREATE INDEX IF NOT EXISTS idx_exchange_challenges_username_kind ON exchange_challenges(username, kind)"

          db.exec <<-SQL
            CREATE TABLE IF NOT EXISTS exchange_sessions (
              token TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              username TEXT NOT NULL,
              created_at TEXT NOT NULL,
              expires_at TEXT NOT NULL
            )
          SQL

          db.exec "CREATE INDEX IF NOT EXISTS idx_exchange_sessions_username ON exchange_sessions(username)"

          @@ready = true
        end
      end
    end

    private def self.database(config : Utils::Config) : DB::Database
      @@db_lock.synchronize do
        @@db ||= DB.open(config.database_url)
      end
    end

    private def self.parse_time(value : String) : Time?
      Time.parse_rfc3339(value)
    rescue
      nil
    end

    private def self.prune!(config : Utils::Config) : Nil
      setup(config)
      now = Time.utc

      database(config).query_all("SELECT transaction_id, expires_at FROM exchange_challenges", as: {String, String}).each do |row|
        expires_at = parse_time(row[1])
        next if expires_at && expires_at > now

        database(config).exec("DELETE FROM exchange_challenges WHERE transaction_id = $1", row[0])
      end

      database(config).query_all("SELECT token, expires_at FROM exchange_sessions", as: {String, String}).each do |row|
        expires_at = parse_time(row[1])
        next if expires_at && expires_at > now

        database(config).exec("DELETE FROM exchange_sessions WHERE token = $1", row[0])
      end
    end

    private def self.load_credentials(config : Utils::Config, user_id : String) : Array(CredentialRecord)
      setup(config)
      database(config).query_all(
        "SELECT id, public_key, counter, created_at FROM exchange_credentials WHERE user_id = $1 ORDER BY created_at ASC",
        user_id,
        as: {String, String?, Int32, String}
      ).map do |row|
        CredentialRecord.new(
          id: row[0],
          public_key: row[1],
          counter: row[2],
          created_at: row[3]
        )
      end
    end

    private def self.find_user(config : Utils::Config, username : String) : UserRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, username, created_at FROM exchange_users WHERE username = $1",
        username,
        as: {String, String, String}
      )
      return nil unless row

      UserRecord.new(
        id: row[0],
        username: row[1],
        created_at: row[2],
        credentials: load_credentials(config, row[0])
      )
    end

    private def self.find_user_by_credential(config : Utils::Config, credential_id : String) : UserRecord?
      setup(config)
      row = database(config).query_one?(
        <<-SQL,
          SELECT u.id, u.username, u.created_at
          FROM exchange_users u
          INNER JOIN exchange_credentials c ON c.user_id = u.id
          WHERE c.id = $1
          LIMIT 1
        SQL
        credential_id,
        as: {String, String, String}
      )
      return nil unless row

      UserRecord.new(
        id: row[0],
        username: row[1],
        created_at: row[2],
        credentials: load_credentials(config, row[0])
      )
    end

    private def self.find_challenge(config : Utils::Config, transaction_id : String, kind : String) : ChallengeRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT transaction_id, kind, username, challenge, rp_id, created_at, expires_at FROM exchange_challenges WHERE transaction_id = $1 AND kind = $2",
        transaction_id,
        kind,
        as: {String, String, String?, String, String, String, String}
      )
      return nil unless row

      ChallengeRecord.new(
        transaction_id: row[0],
        kind: row[1],
        username: row[2],
        challenge: row[3],
        rp_id: row[4],
        created_at: row[5],
        expires_at: row[6]
      )
    end

    private def self.user_handle(config : Utils::Config, username : String) : String
      "#{config.exchange_url}/users/#{URI.encode_path(username)}"
    end

    private def self.next_challenge : String
      Base64.urlsafe_encode(Random::Secure.random_bytes(32), padding: false)
    end

    private def self.upsert_user(config : Utils::Config, user : UserRecord) : Nil
      setup(config)
      database(config).exec(
        <<-SQL,
          INSERT INTO exchange_users (id, username, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            created_at = EXCLUDED.created_at
        SQL
        user.id,
        user.username,
        user.created_at
      )
    end

    private def self.insert_credential(config : Utils::Config, user_id : String, credential : CredentialRecord) : Nil
      setup(config)
      database(config).exec(
        <<-SQL,
          INSERT INTO exchange_credentials (id, user_id, public_key, counter, created_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            public_key = EXCLUDED.public_key,
            counter = EXCLUDED.counter,
            created_at = EXCLUDED.created_at
        SQL
        credential.id,
        user_id,
        credential.public_key,
        credential.counter,
        credential.created_at
      )
    end

    private def self.insert_challenge(config : Utils::Config, challenge : ChallengeRecord) : Nil
      setup(config)
      database(config).exec(
        <<-SQL,
          INSERT INTO exchange_challenges (transaction_id, kind, username, challenge, rp_id, created_at, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        SQL
        challenge.transaction_id,
        challenge.kind,
        challenge.username,
        challenge.challenge,
        challenge.rp_id,
        challenge.created_at,
        challenge.expires_at
      )
    end

    private def self.create_session(config : Utils::Config, user : UserRecord) : SessionResult
      setup(config)
      user_id = user.id.empty? ? user_handle(config, user.username) : user.id
      session = SessionRecord.new(
        token: UUID.random.to_s,
        user_id: user_id,
        username: user.username
      )

      database(config).exec("DELETE FROM exchange_sessions WHERE username = $1", user.username)
      database(config).exec(
        "INSERT INTO exchange_sessions (token, user_id, username, created_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
        session.token,
        session.user_id,
        session.username,
        session.created_at,
        session.expires_at
      )

      SessionResult.new(session.token, session.user_id, session.username, session.expires_at)
    end

    def self.begin_registration(config : Utils::Config, username : String, rp_id : String, rp_name : String)
      raise ArgumentError.new("Username is required.") if username.strip.empty?

      @@lock.synchronize do
        prune!(config)

        user = find_user(config, username)
        challenge = ChallengeRecord.new(
          transaction_id: UUID.random.to_s,
          kind: "register",
          challenge: next_challenge,
          rp_id: rp_id,
          username: username
        )

        database(config).exec("DELETE FROM exchange_challenges WHERE username = $1 AND kind = 'register'", username)
        insert_challenge(config, challenge)

        credentials = user.try(&.credentials) || [] of CredentialRecord
        {
          transaction_id: challenge.transaction_id,
          options:        {
            challenge: challenge.challenge,
            rp:        {
              name: rp_name,
              id:   rp_id,
            },
            user: {
              id:          Base64.urlsafe_encode(username.to_slice, padding: false),
              name:        username,
              displayName: username,
            },
            pubKeyCredParams: [
              {type: "public-key", alg: -7},
              {type: "public-key", alg: -257},
            ],
            timeout:                60000,
            attestation:            "none",
            authenticatorSelection: {
              residentKey:      "preferred",
              userVerification: "preferred",
            },
            excludeCredentials: credentials.map do |credential|
              {
                id:   credential.id,
                type: "public-key",
              }
            end,
          },
        }
      end
    end

    def self.finish_registration(config : Utils::Config, username : String, transaction_id : String, payload : JSON::Any) : SessionResult
      raise ArgumentError.new("Username is required.") if username.strip.empty?

      credential_id = payload["id"]?.try(&.as_s?) || payload["rawId"]?.try(&.as_s?)
      raise ArgumentError.new("Passkey response is missing credential id.") if credential_id.nil? || credential_id.empty?

      @@lock.synchronize do
        prune!(config)

        challenge = find_challenge(config, transaction_id, "register")
        raise ArgumentError.new("Registration challenge has expired.") unless challenge
        raise ArgumentError.new("Registration username mismatch.") if challenge.username != username

        user = find_user(config, username)
        unless user
          user = UserRecord.new(
            id: user_handle(config, username),
            username: username
          )
          upsert_user(config, user)
        end

        unless user.credentials.any? { |credential| credential.id == credential_id }
          response_map = payload["response"]?.try(&.as_h?)
          public_key = response_map.try(&.["publicKey"]?).try(&.as_s?)
          credential = CredentialRecord.new(
            id: credential_id,
            public_key: public_key
          )
          insert_credential(config, user.id, credential)
          user.credentials << credential
        end

        database(config).exec("DELETE FROM exchange_challenges WHERE transaction_id = $1", transaction_id)
        create_session(config, user)
      end
    end

    def self.begin_authentication(config : Utils::Config, username : String?, rp_id : String)
      @@lock.synchronize do
        prune!(config)

        user = username.try { |value| find_user(config, value) }
        if username && user.nil?
          raise ArgumentError.new("No passkey profile exists for this username.")
        end

        credentials =
          if user
            user.credentials
          else
            setup(config)
            database(config).query_all(
              "SELECT id, public_key, counter, created_at FROM exchange_credentials ORDER BY created_at ASC",
              as: {String, String?, Int32, String}
            ).map do |row|
              CredentialRecord.new(
                id: row[0],
                public_key: row[1],
                counter: row[2],
                created_at: row[3]
              )
            end
          end
        raise ArgumentError.new("No passkey credential was found.") if credentials.empty?

        challenge = ChallengeRecord.new(
          transaction_id: UUID.random.to_s,
          kind: "authenticate",
          challenge: next_challenge,
          rp_id: rp_id,
          username: username
        )
        insert_challenge(config, challenge)

        {
          transaction_id: challenge.transaction_id,
          options:        {
            challenge:        challenge.challenge,
            timeout:          60000,
            rpId:             rp_id,
            allowCredentials: credentials.map do |credential|
              {
                id:   credential.id,
                type: "public-key",
              }
            end,
            userVerification: "preferred",
          },
        }
      end
    end

    def self.finish_authentication(config : Utils::Config, transaction_id : String, payload : JSON::Any) : SessionResult
      credential_id = payload["id"]?.try(&.as_s?) || payload["rawId"]?.try(&.as_s?)
      raise ArgumentError.new("Passkey response is missing credential id.") if credential_id.nil? || credential_id.empty?

      @@lock.synchronize do
        prune!(config)

        challenge = find_challenge(config, transaction_id, "authenticate")
        raise ArgumentError.new("Authentication challenge has expired.") unless challenge

        user = find_user_by_credential(config, credential_id)
        raise ArgumentError.new("No matching passkey credential was found.") unless user

        if challenge.username && challenge.username != user.username
          raise ArgumentError.new("Authentication username mismatch.")
        end

        database(config).exec("DELETE FROM exchange_challenges WHERE transaction_id = $1", transaction_id)
        create_session(config, user)
      end
    end
  end
end

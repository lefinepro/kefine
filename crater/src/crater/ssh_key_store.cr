require "db"
require "pg"

require "./utils/config"

module Crater
  module SshKeyStore
    class KeyRecord
      property actor_handle : String
      property public_key : String
      property created_at : String
      property updated_at : String

      def initialize(@actor_handle : String, @public_key : String, @created_at : String, @updated_at : String)
      end
    end

    @@db : DB::Database? = nil
    @@db_lock = Mutex.new
    @@setup_lock = Mutex.new
    @@ready = false

    private def self.current_time : String
      Time.utc.to_rfc3339
    end

    private def self.database(config : Utils::Config) : DB::Database
      @@db_lock.synchronize do
        @@db ||= DB.open(config.database_url)
      end
    end

    private def self.setup(config : Utils::Config) : Nil
      db = database(config)
      return if @@ready

      @@setup_lock.synchronize do
        return if @@ready

        db.exec <<-SQL
          CREATE TABLE IF NOT EXISTS actor_ssh_keys (
            actor_handle TEXT PRIMARY KEY,
            public_key TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        SQL

        @@ready = true
      end
    end

    private def self.normalize_handle(value : String?) : String
      normalized = value.to_s.strip.downcase.gsub(/^@+/, "").gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
      normalized.empty? ? "staff" : normalized
    end

    private def self.normalize_public_key(value : String) : String
      key = value.strip
      parts = key.split(/\s+/, 3)
      raise ArgumentError.new("SSH public key is required.") if parts.empty?
      raise ArgumentError.new("SSH public key format is invalid.") if parts.size < 2
      raise ArgumentError.new("SSH public key type is invalid.") unless parts[0].starts_with?("ssh-") || parts[0].starts_with?("ecdsa-")
      raise ArgumentError.new("SSH public key body is invalid.") if parts[1].strip.empty?

      parts.join(" ")
    end

    private def self.hydrate_record(row : {String, String, String, String}) : KeyRecord
      KeyRecord.new(
        actor_handle: row[0],
        public_key: row[1],
        created_at: row[2],
        updated_at: row[3]
      )
    end

    private def self.shell_quote(value : String) : String
      "'" + value.gsub("'", %q('"'"')) + "'"
    end

    private def self.authorized_keys_quote(value : String) : String
      "\"" + value + "\""
    end

    private def self.resolve_shell_command(config : Utils::Config, actor_handle : String) : String
      configured = config.git_ssh_shell_command
      if configured && !configured.empty?
        "#{configured} --actor #{actor_handle}"
      else
        executable = Process.executable_path || "crater"
        "#{shell_quote(executable)} ssh-shell --actor #{shell_quote(actor_handle)}"
      end
    end

    private def self.authorized_keys_line(record : KeyRecord, config : Utils::Config) : String
      restrictions = [
        %(command=#{authorized_keys_quote(resolve_shell_command(config, record.actor_handle))}),
        "no-agent-forwarding",
        "no-port-forwarding",
        "no-pty",
        "no-user-rc",
        "no-X11-forwarding"
      ]

      "#{restrictions.join(",")} #{record.public_key}"
    end

    private def self.rewrite_authorized_keys(config : Utils::Config) : Nil
      path = config.git_authorized_keys_path
      return if path.nil? || path.empty?

      dir = File.dirname(path)
      Dir.mkdir_p(dir) unless Dir.exists?(dir)
      lines = list(config).map { |record| authorized_keys_line(record, config) }
      File.write(path, lines.join('\n') + (lines.empty? ? "" : "\n"))
      File.chmod(path, 0o600)
    end

    def self.find_by_actor(actor_handle : String, config : Utils::Config = Utils::Config.load) : KeyRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT actor_handle, public_key, created_at, updated_at FROM actor_ssh_keys WHERE actor_handle = $1",
        normalize_handle(actor_handle),
        as: {String, String, String, String}
      )
      row ? hydrate_record(row) : nil
    end

    def self.list(config : Utils::Config = Utils::Config.load) : Array(KeyRecord)
      setup(config)
      database(config).query_all(
        "SELECT actor_handle, public_key, created_at, updated_at FROM actor_ssh_keys ORDER BY actor_handle ASC",
        as: {String, String, String, String}
      ).map { |row| hydrate_record(row) }
    end

    def self.upsert_for_actor(actor_handle : String, public_key : String, config : Utils::Config = Utils::Config.load) : KeyRecord
      setup(config)
      now = current_time
      normalized_actor = normalize_handle(actor_handle)
      normalized_key = normalize_public_key(public_key)

      database(config).exec <<-SQL, normalized_actor, normalized_key, now, now
        INSERT INTO actor_ssh_keys (actor_handle, public_key, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (actor_handle) DO UPDATE SET
          public_key = EXCLUDED.public_key,
          updated_at = EXCLUDED.updated_at
      SQL

      rewrite_authorized_keys(config)
      find_by_actor(normalized_actor, config).not_nil!
    end

    def self.delete_for_actor(actor_handle : String, config : Utils::Config = Utils::Config.load) : Bool
      setup(config)
      normalized_actor = normalize_handle(actor_handle)
      result = database(config).exec("DELETE FROM actor_ssh_keys WHERE actor_handle = $1", normalized_actor)
      rewrite_authorized_keys(config)
      result.rows_affected > 0
    end

    def self.print_authorized_keys(io : IO = STDOUT, config : Utils::Config = Utils::Config.load) : Nil
      list(config).each do |record|
        io << authorized_keys_line(record, config) << '\n'
      end
    end

    def self.to_json_payload(record : KeyRecord) : Hash(String, JSON::Any)
      {
        "actorHandle" => JSON::Any.new(record.actor_handle),
        "publicKey" => JSON::Any.new(record.public_key),
        "createdAt" => JSON::Any.new(record.created_at),
        "updatedAt" => JSON::Any.new(record.updated_at)
      }
    end
  end
end

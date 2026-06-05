require "db"
require "json"
require "pg"
require "set"

require "./utils/config"

module Lepos
  module SshKeyStore
    TABLE_NAME        = "actor_ssh_public_keys"
    LEGACY_TABLE_NAME = "actor_ssh_keys"

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

    private def self.migrate_legacy_table(config : Utils::Config) : Nil
      db = database(config)
      db.exec <<-SQL
        INSERT INTO #{TABLE_NAME} (actor_handle, public_key, created_at, updated_at)
        SELECT actor_handle, public_key, created_at, updated_at
        FROM #{LEGACY_TABLE_NAME}
        WHERE public_key IS NOT NULL AND public_key <> ''
        ON CONFLICT (actor_handle, public_key) DO NOTHING
      SQL
    rescue DB::Error
      # Fresh installations do not have the legacy single-key table.
    end

    private def self.setup(config : Utils::Config) : Nil
      db = database(config)
      return if @@ready

      @@setup_lock.synchronize do
        return if @@ready

        db.exec <<-SQL
          CREATE TABLE IF NOT EXISTS #{TABLE_NAME} (
            actor_handle TEXT NOT NULL,
            public_key TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (actor_handle, public_key)
          )
        SQL

        migrate_legacy_table(config)
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

    private def self.normalize_public_keys(values : Array(String)) : Array(String)
      seen = Set(String).new
      normalized_keys = [] of String

      values.each do |value|
        value.lines.each do |line|
          stripped = line.strip
          next if stripped.empty?

          key = normalize_public_key(stripped)
          next if seen.includes?(key)

          seen.add(key)
          normalized_keys << key
        end
      end

      normalized_keys
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
        executable = Process.executable_path || "lepos"
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
        "no-X11-forwarding",
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
      list_by_actor(actor_handle, config).first?
    end

    def self.list_by_actor(actor_handle : String, config : Utils::Config = Utils::Config.load) : Array(KeyRecord)
      setup(config)
      database(config).query_all(
        "SELECT actor_handle, public_key, created_at, updated_at FROM #{TABLE_NAME} WHERE actor_handle = $1 ORDER BY created_at ASC, public_key ASC",
        normalize_handle(actor_handle),
        as: {String, String, String, String}
      ).map { |row| hydrate_record(row) }
    end

    def self.list(config : Utils::Config = Utils::Config.load) : Array(KeyRecord)
      setup(config)
      database(config).query_all(
        "SELECT actor_handle, public_key, created_at, updated_at FROM #{TABLE_NAME} ORDER BY actor_handle ASC, created_at ASC, public_key ASC",
        as: {String, String, String, String}
      ).map { |row| hydrate_record(row) }
    end

    def self.replace_for_actor(actor_handle : String, public_keys : Array(String), config : Utils::Config = Utils::Config.load) : Array(KeyRecord)
      setup(config)
      now = current_time
      normalized_actor = normalize_handle(actor_handle)
      normalized_keys = normalize_public_keys(public_keys)
      db = database(config)

      db.exec("DELETE FROM #{TABLE_NAME} WHERE actor_handle = $1", normalized_actor)
      normalized_keys.each do |public_key|
        db.exec <<-SQL, normalized_actor, public_key, now, now
          INSERT INTO #{TABLE_NAME} (actor_handle, public_key, created_at, updated_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (actor_handle, public_key) DO UPDATE SET
            updated_at = EXCLUDED.updated_at
        SQL
      end

      rewrite_authorized_keys(config)
      list_by_actor(normalized_actor, config)
    end

    def self.upsert_for_actor(actor_handle : String, public_key : String, config : Utils::Config = Utils::Config.load) : KeyRecord
      records = replace_for_actor(actor_handle, [public_key], config)
      raise ArgumentError.new("SSH public key is required.") if records.empty?

      records.first
    end

    def self.delete_for_actor(actor_handle : String, config : Utils::Config = Utils::Config.load) : Bool
      setup(config)
      normalized_actor = normalize_handle(actor_handle)
      result = database(config).exec("DELETE FROM #{TABLE_NAME} WHERE actor_handle = $1", normalized_actor)
      rewrite_authorized_keys(config)
      result.rows_affected > 0
    end

    def self.print_authorized_keys(io : IO = STDOUT, config : Utils::Config = Utils::Config.load) : Nil
      list(config).each do |record|
        io << authorized_keys_line(record, config) << '\n'
      end
    end

    def self.to_json_payload(actor_handle : String, records : Array(KeyRecord)) : Hash(String, JSON::Any)
      public_keys = records.map(&.public_key)
      created_at = records.map(&.created_at).min? || current_time
      updated_at = records.map(&.updated_at).max? || created_at

      {
        "actorHandle" => JSON::Any.new(records.first?.try(&.actor_handle) || normalize_handle(actor_handle)),
        "publicKey"   => JSON::Any.new(public_keys.first? || ""),
        "publicKeys"  => JSON::Any.new(public_keys.map { |public_key| JSON::Any.new(public_key) }),
        "createdAt"   => JSON::Any.new(created_at),
        "updatedAt"   => JSON::Any.new(updated_at),
      }
    end

    def self.to_json_payload(record : KeyRecord) : Hash(String, JSON::Any)
      to_json_payload(record.actor_handle, [record])
    end
  end
end

require "db"
require "file_utils"
require "json"
require "log"
require "pg"
require "uuid"

require "./activitypub/types"
require "./forgefed/types"
require "./repository_store"
require "./utils/config"

module Lepos
  module ForgeFedStore
    OUTBOX_PAGE_SIZE = 20
    ZERO_OID         = "0000000000000000000000000000000000000000"

    class PatchTrackerRecord
      property id : String
      property repository_id : String
      property actor_uri : String
      property inbox_uri : String
      property outbox_uri : String
      property created_at : String
      property updated_at : String

      def initialize(
        @id : String,
        @repository_id : String,
        @actor_uri : String,
        @inbox_uri : String,
        @outbox_uri : String,
        @created_at : String,
        @updated_at : String
      )
      end
    end

    class BranchRecord
      property id : String
      property repository_id : String
      property name : String
      property ref : String
      property head_sha : String?
      property actor_key_suffix : String?
      property actor_uri : String?
      property is_default : Bool
      property deleted_at : String?
      property created_at : String
      property updated_at : String

      def initialize(
        @id : String,
        @repository_id : String,
        @name : String,
        @ref : String,
        @head_sha : String?,
        @actor_key_suffix : String?,
        @actor_uri : String?,
        @is_default : Bool,
        @deleted_at : String?,
        @created_at : String,
        @updated_at : String
      )
      end
    end

    class MergeRequestRecord
      property id : String
      property repository_id : String
      property patch_tracker_id : String
      property source_branch_id : String
      property source_branch_name : String
      property source_actor_key_suffix : String?
      property source_actor_uri : String?
      property target_branch_name : String
      property title : String
      property description : String
      property status : String
      property ticket_uri : String
      property offer_uri : String
      property origin_uri : String
      property target_uri : String
      property patch_collection_uri : String?
      property diff_uri : String?
      property base_sha : String?
      property head_sha : String?
      property created_at : String
      property updated_at : String
      property closed_at : String?

      def initialize(
        @id : String,
        @repository_id : String,
        @patch_tracker_id : String,
        @source_branch_id : String,
        @source_branch_name : String,
        @source_actor_key_suffix : String?,
        @source_actor_uri : String?,
        @target_branch_name : String,
        @title : String,
        @description : String,
        @status : String,
        @ticket_uri : String,
        @offer_uri : String,
        @origin_uri : String,
        @target_uri : String,
        @patch_collection_uri : String?,
        @diff_uri : String?,
        @base_sha : String?,
        @head_sha : String?,
        @created_at : String,
        @updated_at : String,
        @closed_at : String?
      )
      end
    end

    class PatchSetRecord
      property id : String
      property merge_request_id : String
      property version_number : Int32
      property collection_uri : String
      property diff_path : String
      property base_sha : String?
      property head_sha : String?
      property current : Bool
      property created_at : String
      property updated_at : String

      def initialize(
        @id : String,
        @merge_request_id : String,
        @version_number : Int32,
        @collection_uri : String,
        @diff_path : String,
        @base_sha : String?,
        @head_sha : String?,
        @current : Bool,
        @created_at : String,
        @updated_at : String
      )
      end
    end

    class PatchFileRecord
      property id : String
      property patch_set_id : String
      property position : Int32
      property name : String
      property file_path : String
      property file_uri : String
      property created_at : String

      def initialize(
        @id : String,
        @patch_set_id : String,
        @position : Int32,
        @name : String,
        @file_path : String,
        @file_uri : String,
        @created_at : String
      )
      end
    end

    class PushEventRecord
      property id : String
      property repository_id : String
      property branch_name : String
      property ref : String
      property old_oid : String
      property new_oid : String
      property attributed_to : String?
      property activity_uri : String
      property created_at : String

      def initialize(
        @id : String,
        @repository_id : String,
        @branch_name : String,
        @ref : String,
        @old_oid : String,
        @new_oid : String,
        @attributed_to : String?,
        @activity_uri : String,
        @created_at : String
      )
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
          CREATE TABLE IF NOT EXISTS patch_trackers (
            id TEXT PRIMARY KEY,
            repository_id TEXT NOT NULL UNIQUE,
            actor_uri TEXT NOT NULL UNIQUE,
            inbox_uri TEXT NOT NULL,
            outbox_uri TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        SQL

        db.exec <<-SQL
          CREATE TABLE IF NOT EXISTS repository_branches (
            id TEXT PRIMARY KEY,
            repository_id TEXT NOT NULL,
            name TEXT NOT NULL,
            ref TEXT NOT NULL,
            head_sha TEXT,
            actor_key_suffix TEXT,
            actor_uri TEXT,
            is_default BOOLEAN NOT NULL DEFAULT FALSE,
            deleted_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(repository_id, name)
          )
        SQL

        db.exec <<-SQL
          CREATE TABLE IF NOT EXISTS merge_requests (
            id TEXT PRIMARY KEY,
            repository_id TEXT NOT NULL,
            patch_tracker_id TEXT NOT NULL,
            source_branch_id TEXT NOT NULL,
            source_branch_name TEXT NOT NULL,
            source_actor_key_suffix TEXT,
            source_actor_uri TEXT,
            target_branch_name TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL,
            ticket_uri TEXT NOT NULL UNIQUE,
            offer_uri TEXT NOT NULL UNIQUE,
            origin_uri TEXT NOT NULL,
            target_uri TEXT NOT NULL,
            patch_collection_uri TEXT,
            diff_uri TEXT,
            base_sha TEXT,
            head_sha TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            closed_at TEXT
          )
        SQL

        db.exec <<-SQL
          CREATE TABLE IF NOT EXISTS patch_sets (
            id TEXT PRIMARY KEY,
            merge_request_id TEXT NOT NULL,
            version_number INTEGER NOT NULL,
            collection_uri TEXT NOT NULL UNIQUE,
            diff_path TEXT NOT NULL,
            base_sha TEXT,
            head_sha TEXT,
            current BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        SQL

        db.exec <<-SQL
          CREATE TABLE IF NOT EXISTS patch_files (
            id TEXT PRIMARY KEY,
            patch_set_id TEXT NOT NULL,
            position INTEGER NOT NULL,
            name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_uri TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
          )
        SQL

        db.exec <<-SQL
          CREATE TABLE IF NOT EXISTS push_events (
            id TEXT PRIMARY KEY,
            repository_id TEXT NOT NULL,
            branch_name TEXT NOT NULL,
            ref TEXT NOT NULL,
            old_oid TEXT NOT NULL,
            new_oid TEXT NOT NULL,
            attributed_to TEXT,
            activity_uri TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
          )
        SQL

        db.exec <<-SQL
          CREATE TABLE IF NOT EXISTS forgefed_activities (
            id TEXT PRIMARY KEY,
            actor_uri TEXT NOT NULL,
            object_uri TEXT,
            activity_type TEXT NOT NULL,
            activity_json TEXT NOT NULL,
            published_at TEXT NOT NULL
          )
        SQL

        db.exec "CREATE INDEX IF NOT EXISTS idx_patch_trackers_repository ON patch_trackers(repository_id)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_branches_repository ON repository_branches(repository_id)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_merge_requests_repository ON merge_requests(repository_id)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_merge_requests_branch ON merge_requests(source_branch_id)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_patch_sets_mr ON patch_sets(merge_request_id)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_patch_files_patch_set ON patch_files(patch_set_id)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_push_events_repository ON push_events(repository_id)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_forgefed_activities_actor ON forgefed_activities(actor_uri, published_at DESC)"

        @@ready = true
      end
    end

    private def self.presence(value : String?) : String?
      return nil unless value

      normalized = value.strip
      normalized.empty? ? nil : normalized
    end

    private def self.metadata_root(repository : RepositoryStore::RepositoryRecord) : String
      File.join(File.dirname(File.dirname(repository.repo_path)), "metadata", repository.slug)
    end

    private def self.queue_path(repository : RepositoryStore::RepositoryRecord) : String
      File.join(metadata_root(repository), "git-events.log")
    end

    private def self.patches_root(repository : RepositoryStore::RepositoryRecord) : String
      File.join(metadata_root(repository), "patches")
    end

    private def self.branch_uri(branch_id : String, config : Utils::Config) : String
      "#{config.crater_url}/branches/#{branch_id}"
    end

    private def self.patch_tracker_uri(id : String, config : Utils::Config) : String
      "#{config.crater_url}/patch-trackers/#{id}"
    end

    private def self.patch_tracker_inbox_uri(id : String, config : Utils::Config) : String
      "#{patch_tracker_uri(id, config)}/inbox"
    end

    private def self.patch_tracker_outbox_uri(id : String, config : Utils::Config) : String
      "#{patch_tracker_uri(id, config)}/outbox"
    end

    private def self.repository_uri(repository : RepositoryStore::RepositoryRecord, config : Utils::Config) : String
      "#{config.crater_url}/repositories/#{repository.slug}"
    end

    private def self.merge_request_uri(id : String, config : Utils::Config) : String
      "#{config.crater_url}/merge-requests/#{id}"
    end

    private def self.merge_request_offer_uri(id : String, config : Utils::Config) : String
      "#{merge_request_uri(id, config)}/offer"
    end

    private def self.patch_set_uri(id : String, config : Utils::Config) : String
      "#{config.crater_url}/patch-sets/#{id}"
    end

    private def self.patch_file_uri(id : String, config : Utils::Config) : String
      "#{config.crater_url}/patch-files/#{id}"
    end

    private def self.merge_request_diff_uri(id : String, config : Utils::Config) : String
      "#{merge_request_uri(id, config)}/diff"
    end

    private def self.activity_uri(prefix : String, config : Utils::Config) : String
      "#{config.crater_url}/activities/#{prefix}-#{UUID.random}"
    end

    private def self.identity_actor_uri(key_suffix : String, config : Utils::Config) : String
      "#{config.crater_url}/actors/by-key/#{key_suffix}"
    end

    private def self.json_any(payload : Aptok::JsonMap) : JSON::Any
      JSON.parse(payload.to_json)
    end

    private def self.branch_key_suffix(name : String, default_branch : String) : String?
      return nil if name == default_branch

      prefix, remainder = name.split("/", 2)
      return nil if remainder.nil?

      normalized = prefix.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-+|-+$/, "")
      normalized.empty? ? nil : normalized
    end

    private def self.branch_title(name : String) : String
      name.split("/", 2).last?.try(&.gsub(/[-_]+/, " ")) || name
    end

    private def self.git_capture(args : Array(String), repository : RepositoryStore::RepositoryRecord? = nil, chdir : String? = nil) : String
      output = IO::Memory.new
      error = IO::Memory.new
      command = ["git"] of String
      if repository
        command += ["--git-dir", repository.repo_path]
      end
      command += args
      status = if chdir
                 Process.run(command[0], command[1..], chdir: chdir, output: output, error: error)
               else
                 Process.run(command[0], command[1..], output: output, error: error)
               end
      raise "git #{args.join(' ')} failed: #{presence(error.to_s) || status.exit_code}" unless status.success?

      output.to_s
    end

    private def self.git_run(args : Array(String), repository : RepositoryStore::RepositoryRecord? = nil, chdir : String? = nil) : Nil
      git_capture(args, repository, chdir)
    end

    private def self.persist_activity(actor_uri : String, activity_type : String, payload : JSON::Any, object_uri : String? = nil, config : Utils::Config = Utils::Config.load) : Nil
      setup(config)
      published_at = payload.as_h?.try { |h| presence(h["published"]?.try(&.as_s?)) } || current_time
      database(config).exec(
        "INSERT INTO forgefed_activities (id, actor_uri, object_uri, activity_type, activity_json, published_at) VALUES ($1, $2, $3, $4, $5, $6)",
        UUID.random.to_s,
        actor_uri,
        object_uri,
        activity_type,
        payload.to_json,
        published_at
      )
    end

    private def self.install_post_receive_hook(repository : RepositoryStore::RepositoryRecord) : Nil
      hooks_dir = File.join(repository.repo_path, "hooks")
      FileUtils.mkdir_p(hooks_dir)
      FileUtils.mkdir_p(metadata_root(repository))
      hook_path = File.join(hooks_dir, "post-receive")
      script = [
        "#!/bin/sh",
        "QUEUE=\"#{queue_path(repository)}\"",
        "mkdir -p \"$(dirname \"$QUEUE\")\"",
        "while read oldrev newrev refname; do",
        "  printf '%s %s %s\\n' \"$oldrev\" \"$newrev\" \"$refname\" >> \"$QUEUE\"",
        "done",
        "git --git-dir=\"$PWD\" update-server-info >/dev/null 2>&1 || true",
      ].join('\n')
      File.write(hook_path, script)
      File.chmod(hook_path, 0o755)
    end

    private def self.hydrate_patch_tracker(row : {String, String, String, String, String, String, String}) : PatchTrackerRecord
      PatchTrackerRecord.new(row[0], row[1], row[2], row[3], row[4], row[5], row[6])
    end

    private def self.hydrate_branch(row : {String, String, String, String, String?, String?, String?, Bool, String?, String, String}) : BranchRecord
      BranchRecord.new(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10])
    end

    private def self.hydrate_merge_request(row : {String, String, String, String, String, String?, String?, String, String, String, String, String, String, String, String, String?, String?, String?, String?, String, String, String?}) : MergeRequestRecord
      MergeRequestRecord.new(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11], row[12], row[13], row[14], row[15], row[16], row[17], row[18], row[19], row[20], row[21])
    end

    private def self.hydrate_patch_set(row : {String, String, Int32, String, String, String?, String?, Bool, String, String}) : PatchSetRecord
      PatchSetRecord.new(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9])
    end

    private def self.hydrate_patch_file(row : {String, String, Int32, String, String, String, String}) : PatchFileRecord
      PatchFileRecord.new(row[0], row[1], row[2], row[3], row[4], row[5], row[6])
    end

    private def self.hydrate_push_event(row : {String, String, String, String, String, String, String?, String, String}) : PushEventRecord
      PushEventRecord.new(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8])
    end

    def self.ensure_repository_resources(repository : RepositoryStore::RepositoryRecord, config : Utils::Config = Utils::Config.load) : PatchTrackerRecord
      setup(config)
      install_post_receive_hook(repository)
      tracker = find_patch_tracker_by_repository(repository.id, config)
      return tracker if tracker

      now = current_time
      id = UUID.random.to_s
      record = PatchTrackerRecord.new(
        id,
        repository.id,
        patch_tracker_uri(id, config),
        patch_tracker_inbox_uri(id, config),
        patch_tracker_outbox_uri(id, config),
        now,
        now
      )
      database(config).exec(
        "INSERT INTO patch_trackers (id, repository_id, actor_uri, inbox_uri, outbox_uri, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        record.id, record.repository_id, record.actor_uri, record.inbox_uri, record.outbox_uri, record.created_at, record.updated_at
      )
      record
    end

    def self.find_patch_tracker(id : String, config : Utils::Config = Utils::Config.load) : PatchTrackerRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, repository_id, actor_uri, inbox_uri, outbox_uri, created_at, updated_at FROM patch_trackers WHERE id = $1",
        id,
        as: {String, String, String, String, String, String, String}
      )
      row ? hydrate_patch_tracker(row) : nil
    end

    def self.find_patch_tracker_by_repository(repository_id : String, config : Utils::Config = Utils::Config.load) : PatchTrackerRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, repository_id, actor_uri, inbox_uri, outbox_uri, created_at, updated_at FROM patch_trackers WHERE repository_id = $1",
        repository_id,
        as: {String, String, String, String, String, String, String}
      )
      row ? hydrate_patch_tracker(row) : nil
    end

    def self.find_branch(id : String, config : Utils::Config = Utils::Config.load) : BranchRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, repository_id, name, ref, head_sha, actor_key_suffix, actor_uri, is_default, deleted_at, created_at, updated_at FROM repository_branches WHERE id = $1",
        id,
        as: {String, String, String, String, String?, String?, String?, Bool, String?, String, String}
      )
      row ? hydrate_branch(row) : nil
    end

    def self.find_branch_by_name(repository_id : String, name : String, config : Utils::Config = Utils::Config.load) : BranchRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, repository_id, name, ref, head_sha, actor_key_suffix, actor_uri, is_default, deleted_at, created_at, updated_at FROM repository_branches WHERE repository_id = $1 AND name = $2",
        repository_id,
        name,
        as: {String, String, String, String, String?, String?, String?, Bool, String?, String, String}
      )
      row ? hydrate_branch(row) : nil
    end

    def self.list_branches(repository_id : String, config : Utils::Config = Utils::Config.load) : Array(BranchRecord)
      setup(config)
      database(config).query_all(
        "SELECT id, repository_id, name, ref, head_sha, actor_key_suffix, actor_uri, is_default, deleted_at, created_at, updated_at FROM repository_branches WHERE repository_id = $1 ORDER BY is_default DESC, name ASC",
        repository_id,
        as: {String, String, String, String, String?, String?, String?, Bool, String?, String, String}
      ).map { |row| hydrate_branch(row) }
    end

    def self.find_merge_request(id : String, config : Utils::Config = Utils::Config.load) : MergeRequestRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, repository_id, patch_tracker_id, source_branch_id, source_branch_name, source_actor_key_suffix, source_actor_uri, target_branch_name, title, description, status, ticket_uri, offer_uri, origin_uri, target_uri, patch_collection_uri, diff_uri, base_sha, head_sha, created_at, updated_at, closed_at FROM merge_requests WHERE id = $1",
        id,
        as: {String, String, String, String, String, String?, String?, String, String, String, String, String, String, String, String, String?, String?, String?, String?, String, String, String?}
      )
      row ? hydrate_merge_request(row) : nil
    end

    def self.find_merge_request_by_branch(repository_id : String, source_branch_id : String, config : Utils::Config = Utils::Config.load) : MergeRequestRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, repository_id, patch_tracker_id, source_branch_id, source_branch_name, source_actor_key_suffix, source_actor_uri, target_branch_name, title, description, status, ticket_uri, offer_uri, origin_uri, target_uri, patch_collection_uri, diff_uri, base_sha, head_sha, created_at, updated_at, closed_at FROM merge_requests WHERE repository_id = $1 AND source_branch_id = $2 ORDER BY created_at DESC LIMIT 1",
        repository_id,
        source_branch_id,
        as: {String, String, String, String, String, String?, String?, String, String, String, String, String, String, String, String, String?, String?, String?, String?, String, String, String?}
      )
      row ? hydrate_merge_request(row) : nil
    end

    def self.list_merge_requests_for_patch_tracker(patch_tracker_id : String, config : Utils::Config = Utils::Config.load) : Array(MergeRequestRecord)
      setup(config)
      database(config).query_all(
        "SELECT id, repository_id, patch_tracker_id, source_branch_id, source_branch_name, source_actor_key_suffix, source_actor_uri, target_branch_name, title, description, status, ticket_uri, offer_uri, origin_uri, target_uri, patch_collection_uri, diff_uri, base_sha, head_sha, created_at, updated_at, closed_at FROM merge_requests WHERE patch_tracker_id = $1 ORDER BY created_at DESC",
        patch_tracker_id,
        as: {String, String, String, String, String, String?, String?, String, String, String, String, String, String, String, String, String?, String?, String?, String?, String, String, String?}
      ).map { |row| hydrate_merge_request(row) }
    end

    def self.current_patch_set(merge_request_id : String, config : Utils::Config = Utils::Config.load) : PatchSetRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, merge_request_id, version_number, collection_uri, diff_path, base_sha, head_sha, current, created_at, updated_at FROM patch_sets WHERE merge_request_id = $1 AND current = TRUE ORDER BY version_number DESC LIMIT 1",
        merge_request_id,
        as: {String, String, Int32, String, String, String?, String?, Bool, String, String}
      )
      row ? hydrate_patch_set(row) : nil
    end

    def self.find_patch_set(id : String, config : Utils::Config = Utils::Config.load) : PatchSetRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, merge_request_id, version_number, collection_uri, diff_path, base_sha, head_sha, current, created_at, updated_at FROM patch_sets WHERE id = $1",
        id,
        as: {String, String, Int32, String, String, String?, String?, Bool, String, String}
      )
      row ? hydrate_patch_set(row) : nil
    end

    def self.list_patch_files(patch_set_id : String, config : Utils::Config = Utils::Config.load) : Array(PatchFileRecord)
      setup(config)
      database(config).query_all(
        "SELECT id, patch_set_id, position, name, file_path, file_uri, created_at FROM patch_files WHERE patch_set_id = $1 ORDER BY position ASC",
        patch_set_id,
        as: {String, String, Int32, String, String, String, String}
      ).map { |row| hydrate_patch_file(row) }
    end

    def self.find_patch_file(id : String, config : Utils::Config = Utils::Config.load) : PatchFileRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, patch_set_id, position, name, file_path, file_uri, created_at FROM patch_files WHERE id = $1",
        id,
        as: {String, String, Int32, String, String, String, String}
      )
      row ? hydrate_patch_file(row) : nil
    end

    def self.list_push_events(repository_id : String, config : Utils::Config = Utils::Config.load) : Array(PushEventRecord)
      setup(config)
      database(config).query_all(
        "SELECT id, repository_id, branch_name, ref, old_oid, new_oid, attributed_to, activity_uri, created_at FROM push_events WHERE repository_id = $1 ORDER BY created_at DESC",
        repository_id,
        as: {String, String, String, String, String, String, String?, String, String}
      ).map { |row| hydrate_push_event(row) }
    end

    def self.list_activities(actor_uri : String, page : Int32, config : Utils::Config = Utils::Config.load) : Array(JSON::Any)
      setup(config)
      offset = (page - 1) * OUTBOX_PAGE_SIZE
      database(config).query_all(
        "SELECT activity_json FROM forgefed_activities WHERE actor_uri = $1 ORDER BY published_at DESC LIMIT $2 OFFSET $3",
        actor_uri,
        OUTBOX_PAGE_SIZE,
        offset,
        as: String
      ).map { |row| JSON.parse(row) }
    end

    def self.activity_total(actor_uri : String, config : Utils::Config = Utils::Config.load) : Int32
      setup(config)
      database(config).query_one(
        "SELECT COUNT(*) FROM forgefed_activities WHERE actor_uri = $1",
        actor_uri,
        as: Int64
      ).to_i
    end

    private def self.persist_branch(record : BranchRecord, config : Utils::Config) : BranchRecord
      setup(config)
      database(config).exec(
        <<-SQL,
          INSERT INTO repository_branches (id, repository_id, name, ref, head_sha, actor_key_suffix, actor_uri, is_default, deleted_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (repository_id, name) DO UPDATE SET
            ref = EXCLUDED.ref,
            head_sha = EXCLUDED.head_sha,
            actor_key_suffix = EXCLUDED.actor_key_suffix,
            actor_uri = EXCLUDED.actor_uri,
            is_default = EXCLUDED.is_default,
            deleted_at = EXCLUDED.deleted_at,
            updated_at = EXCLUDED.updated_at
        SQL
        record.id, record.repository_id, record.name, record.ref, record.head_sha, record.actor_key_suffix,
        record.actor_uri, record.is_default, record.deleted_at, record.created_at, record.updated_at
      )
      find_branch_by_name(record.repository_id, record.name, config).not_nil!
    end

    private def self.persist_merge_request(record : MergeRequestRecord, config : Utils::Config) : MergeRequestRecord
      setup(config)
      database(config).exec(
        <<-SQL,
          INSERT INTO merge_requests (
            id, repository_id, patch_tracker_id, source_branch_id, source_branch_name, source_actor_key_suffix, source_actor_uri,
            target_branch_name, title, description, status, ticket_uri, offer_uri, origin_uri, target_uri, patch_collection_uri,
            diff_uri, base_sha, head_sha, created_at, updated_at, closed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO UPDATE SET
            source_branch_name = EXCLUDED.source_branch_name,
            source_actor_key_suffix = EXCLUDED.source_actor_key_suffix,
            source_actor_uri = EXCLUDED.source_actor_uri,
            target_branch_name = EXCLUDED.target_branch_name,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            origin_uri = EXCLUDED.origin_uri,
            target_uri = EXCLUDED.target_uri,
            patch_collection_uri = EXCLUDED.patch_collection_uri,
            diff_uri = EXCLUDED.diff_uri,
            base_sha = EXCLUDED.base_sha,
            head_sha = EXCLUDED.head_sha,
            updated_at = EXCLUDED.updated_at,
            closed_at = EXCLUDED.closed_at
        SQL
        record.id, record.repository_id, record.patch_tracker_id, record.source_branch_id, record.source_branch_name,
        record.source_actor_key_suffix, record.source_actor_uri, record.target_branch_name, record.title, record.description,
        record.status, record.ticket_uri, record.offer_uri, record.origin_uri, record.target_uri, record.patch_collection_uri,
        record.diff_uri, record.base_sha, record.head_sha, record.created_at, record.updated_at, record.closed_at
      )
      find_merge_request(record.id, config).not_nil!
    end

    private def self.persist_push_event(record : PushEventRecord, config : Utils::Config) : Nil
      setup(config)
      database(config).exec(
        "INSERT INTO push_events (id, repository_id, branch_name, ref, old_oid, new_oid, attributed_to, activity_uri, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        record.id, record.repository_id, record.branch_name, record.ref, record.old_oid, record.new_oid, record.attributed_to, record.activity_uri, record.created_at
      )
    end

    private def self.persist_patch_set(record : PatchSetRecord, patch_files : Array(PatchFileRecord), config : Utils::Config) : PatchSetRecord
      setup(config)
      database(config).exec("UPDATE patch_sets SET current = FALSE, updated_at = $2 WHERE merge_request_id = $1", record.merge_request_id, current_time)
      database(config).exec(
        "INSERT INTO patch_sets (id, merge_request_id, version_number, collection_uri, diff_path, base_sha, head_sha, current, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $9)",
        record.id, record.merge_request_id, record.version_number, record.collection_uri, record.diff_path, record.base_sha, record.head_sha, record.created_at, record.updated_at
      )
      database(config).exec("DELETE FROM patch_files WHERE patch_set_id = $1", record.id)
      patch_files.each do |patch_file|
        database(config).exec(
          "INSERT INTO patch_files (id, patch_set_id, position, name, file_path, file_uri, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          patch_file.id, patch_file.patch_set_id, patch_file.position, patch_file.name, patch_file.file_path, patch_file.file_uri, patch_file.created_at
        )
      end
      find_patch_set(record.id, config).not_nil!
    end

    private def self.record_refs(repository : RepositoryStore::RepositoryRecord) : Array({String, String})
      output = git_capture(["for-each-ref", "refs/heads", "--format=%(refname)%00%(objectname)"], repository)
      output.split('\n', remove_empty: true).compact_map do |line|
        parts = line.split('\u0000')
        next nil unless parts.size == 2
        {parts[0], parts[1]}
      end
    end

    private def self.ensure_branch(repository : RepositoryStore::RepositoryRecord, branch_name : String, ref : String, head_sha : String?, deleted : Bool, config : Utils::Config) : BranchRecord
      now = current_time
      suffix = branch_key_suffix(branch_name, repository.default_branch)
      existing = find_branch_by_name(repository.id, branch_name, config)
      record = BranchRecord.new(
        existing.try(&.id) || UUID.random.to_s,
        repository.id,
        branch_name,
        ref,
        head_sha,
        suffix,
        suffix ? identity_actor_uri(suffix, config) : nil,
        branch_name == repository.default_branch,
        deleted ? now : nil,
        existing.try(&.created_at) || now,
        now
      )
      persist_branch(record, config)
    end

    private def self.create_merge_request(repository : RepositoryStore::RepositoryRecord, tracker : PatchTrackerRecord, branch : BranchRecord, config : Utils::Config) : MergeRequestRecord
      now = current_time
      id = UUID.random.to_s
      title_tail = branch_title(branch.name)
      title = "#{title_tail} -> #{repository.default_branch}"
      description = "Merge changes from #{branch.name} into #{repository.default_branch}."
      record = MergeRequestRecord.new(
        id,
        repository.id,
        tracker.id,
        branch.id,
        branch.name,
        branch.actor_key_suffix,
        branch.actor_uri,
        repository.default_branch,
        title,
        description,
        "open",
        merge_request_uri(id, config),
        merge_request_offer_uri(id, config),
        branch_uri(branch.id, config),
        branch_uri(find_branch_by_name(repository.id, repository.default_branch, config).try(&.id) || branch.id, config),
        nil,
        nil,
        nil,
        branch.head_sha,
        now,
        now,
        nil
      )
      mr = persist_merge_request(record, config)
      persist_activity(tracker.actor_uri, "Create", merge_request_create_activity(repository, tracker, mr, config), mr.ticket_uri, config)
      mr
    end

    private def self.merge_request_create_activity(repository : RepositoryStore::RepositoryRecord, tracker : PatchTrackerRecord, mr : MergeRequestRecord, config : Utils::Config) : JSON::Any
      object = merge_request_json(mr, config).as_h.as(Aptok::JsonMap)
      activity = Aptok.create(activity_uri("mr-create", config), tracker.actor_uri, object, [ActivityPub::PUBLIC_COLLECTION])
      activity["@context"] = Aptok.json([ActivityPub::CONTEXT, ForgeFed::CONTEXT])
      activity["published"] = Aptok.json(current_time)
      json_any(activity)
    end

    private def self.merge_request_update_activity(repository : RepositoryStore::RepositoryRecord, tracker : PatchTrackerRecord, mr : MergeRequestRecord, config : Utils::Config) : JSON::Any
      object = merge_request_json(mr, config).as_h.as(Aptok::JsonMap)
      activity = Aptok.update(activity_uri("mr-update", config), tracker.actor_uri, object, [ActivityPub::PUBLIC_COLLECTION])
      activity["@context"] = Aptok.json([ActivityPub::CONTEXT, ForgeFed::CONTEXT])
      activity["published"] = Aptok.json(current_time)
      json_any(activity)
    end

    private def self.push_activity(repository : RepositoryStore::RepositoryRecord, push : PushEventRecord, branch : BranchRecord?, config : Utils::Config) : JSON::Any
      target = branch ? JSON.parse(branch_json(branch, config).to_json) : JSON.parse(repository_json(repository, config).to_json)
      target_id = branch ? branch_uri(branch.id, config) : repository_uri(repository, config)
      activity = Aptok.forgefed_push(
        push.activity_uri,
        repository_uri(repository, config),
        push.attributed_to || repository_uri(repository, config),
        target_id,
        [] of Aptok::JsonMap,
        push.old_oid,
        push.new_oid
      )
      activity["target"] = Aptok.json(target)
      activity["published"] = Aptok.json(push.created_at)
      activity["ref"] = Aptok.json(push.ref)
      json_any(activity)
    end

    private def self.next_patch_version(merge_request_id : String, config : Utils::Config) : Int32
      setup(config)
      database(config).query_one?(
        "SELECT COALESCE(MAX(version_number), 0) FROM patch_sets WHERE merge_request_id = $1",
        merge_request_id,
        as: Int64
      ).try(&.to_i) || 0
    end

    private def self.generate_patch_set(repository : RepositoryStore::RepositoryRecord, merge_request : MergeRequestRecord, branch : BranchRecord, config : Utils::Config) : PatchSetRecord?
      return nil unless branch.head_sha
      default_branch = find_branch_by_name(repository.id, repository.default_branch, config)
      return nil unless default_branch
      return nil unless default_branch.head_sha

      base_sha = begin
        git_capture(["merge-base", default_branch.head_sha.not_nil!, branch.head_sha.not_nil!], repository).strip
      rescue
        default_branch.head_sha
      end
      return nil unless base_sha

      version = next_patch_version(merge_request.id, config) + 1
      version_dir = File.join(patches_root(repository), merge_request.id, "v#{version}")
      FileUtils.rm_rf(version_dir)
      FileUtils.mkdir_p(version_dir)

      begin
        git_run(["format-patch", "--output-directory", version_dir, "#{base_sha}..#{branch.head_sha.not_nil!}"], repository)
      rescue
        # No patch files generated for zero-diff branch.
      end

      diff_path = File.join(version_dir, "mr.diff")
      diff_content = git_capture(["diff", "--binary", "#{base_sha}..#{branch.head_sha.not_nil!}"], repository)
      File.write(diff_path, diff_content)

      files = Dir.glob(File.join(version_dir, "*.patch")).sort
      patch_set_id = UUID.random.to_s
      patch_files = files.each_with_index.map do |file_path, index|
        PatchFileRecord.new(
          UUID.random.to_s,
          patch_set_id,
          index + 1,
          File.basename(file_path),
          file_path,
          patch_file_uri(UUID.random.to_s, config),
          current_time
        )
      end.to_a

      patch_set = PatchSetRecord.new(
        patch_set_id,
        merge_request.id,
        version,
        patch_set_uri(patch_set_id, config),
        diff_path,
        base_sha,
        branch.head_sha,
        true,
        current_time,
        current_time
      )
      persist_patch_set(patch_set, patch_files, config)
    end

    def self.sync_repository(repository : RepositoryStore::RepositoryRecord, config : Utils::Config = Utils::Config.load) : Nil
      tracker = ensure_repository_resources(repository, config)
      current_refs = record_refs(repository)
      seen = Set(String).new

      current_refs.each do |ref, oid|
        next unless ref.starts_with?("refs/heads/")

        branch_name = ref.sub("refs/heads/", "")
        seen << branch_name
        branch = ensure_branch(repository, branch_name, ref, oid, false, config)
        if branch_name != repository.default_branch
          mr = find_merge_request_by_branch(repository.id, branch.id, config) || create_merge_request(repository, tracker, branch, config)
          patch_set = generate_patch_set(repository, mr, branch, config)
          updated = MergeRequestRecord.new(
            mr.id, mr.repository_id, mr.patch_tracker_id, mr.source_branch_id, mr.source_branch_name,
            mr.source_actor_key_suffix, mr.source_actor_uri, mr.target_branch_name, mr.title, mr.description, "open",
            mr.ticket_uri, mr.offer_uri, mr.origin_uri, branch_uri(find_branch_by_name(repository.id, repository.default_branch, config).not_nil!.id, config),
            patch_set.try(&.collection_uri), patch_set ? merge_request_diff_uri(mr.id, config) : nil,
            patch_set.try(&.base_sha), branch.head_sha, mr.created_at, current_time, nil
          )
          updated = persist_merge_request(updated, config)
          persist_activity(tracker.actor_uri, "Update", merge_request_update_activity(repository, tracker, updated, config), updated.ticket_uri, config)
        end
      end

      list_branches(repository.id, config).each do |branch|
        next if seen.includes?(branch.name)
        next if branch.deleted_at

        deleted = ensure_branch(repository, branch.name, branch.ref, nil, true, config)
        if mr = find_merge_request_by_branch(repository.id, deleted.id, config)
          closed = MergeRequestRecord.new(
            mr.id, mr.repository_id, mr.patch_tracker_id, mr.source_branch_id, mr.source_branch_name,
            mr.source_actor_key_suffix, mr.source_actor_uri, mr.target_branch_name, mr.title, mr.description,
            "closed", mr.ticket_uri, mr.offer_uri, mr.origin_uri, mr.target_uri, nil, nil,
            mr.base_sha, mr.head_sha, mr.created_at, current_time, current_time
          )
          FileUtils.rm_rf(File.join(patches_root(repository), mr.id))
          persist_merge_request(closed, config)
          persist_activity(tracker.actor_uri, "Update", merge_request_update_activity(repository, tracker, closed, config), closed.ticket_uri, config)
        end
      end

      process_queue(repository, tracker, config)
    end

    private def self.process_queue(repository : RepositoryStore::RepositoryRecord, tracker : PatchTrackerRecord, config : Utils::Config) : Nil
      path = queue_path(repository)
      return unless File.exists?(path)

      lines = File.read_lines(path)
      File.write(path, "")

      lines.each do |line|
        old_oid, new_oid, ref = line.split(' ', 3)
        next unless old_oid && new_oid && ref
        next unless ref.starts_with?("refs/heads/")

        branch_name = ref.sub("refs/heads/", "")
        branch = find_branch_by_name(repository.id, branch_name, config)
        push = PushEventRecord.new(
          UUID.random.to_s,
          repository.id,
          branch_name,
          ref,
          old_oid,
          new_oid,
          branch.try(&.actor_uri),
          activity_uri("push", config),
          current_time
        )
        persist_push_event(push, config)
        persist_activity(repository_uri(repository, config), "Push", push_activity(repository, push, branch, config), push.activity_uri, config)
      end
    end

    def self.repository_json(repository : RepositoryStore::RepositoryRecord, config : Utils::Config = Utils::Config.load) : JSON::Any
      tracker = ensure_repository_resources(repository, config)
      repository_actor = repository_uri(repository, config)
      payload = Aptok.forgefed_repository(
        repository_actor,
        repository.name,
        "#{repository_actor}/inbox",
        "#{repository_actor}/outbox",
        clone_uri: repository.public_clone_url || repository.ssh_clone_url,
        push_uris: [repository.ssh_clone_url].compact,
        summary: repository.name,
        tickets_tracked_by: tracker.actor_uri,
        send_patches_to: tracker.actor_uri,
        context: "#{config.crater_url}/projects/#{repository.project_id}"
      )
      payload["published"] = Aptok.json(repository.created_at)
      json_any(payload)
    end

    def self.patch_tracker_json(tracker : PatchTrackerRecord, config : Utils::Config = Utils::Config.load) : JSON::Any
      repo = RepositoryStore.list(config).find { |item| item.id == tracker.repository_id }
      payload = Aptok.forgefed_patch_tracker(
        tracker.actor_uri,
        repo ? "#{repo.name} patches" : "Patch tracker",
        context: repo ? repository_uri(repo, config) : nil,
        inbox: tracker.inbox_uri,
        outbox: tracker.outbox_uri
      )
      payload["tracksPatchesFor"] = Aptok.json(repository_uri(repo, config)) if repo
      json_any(payload)
    end

    def self.branch_json(branch : BranchRecord, config : Utils::Config = Utils::Config.load) : JSON::Any
      repository = RepositoryStore.list(config).find { |item| item.id == branch.repository_id }
      payload = Aptok.forgefed_branch(
        branch_uri(branch.id, config),
        repository ? repository_uri(repository, config) : branch.repository_id,
        branch.name,
        branch.ref,
        team: branch.actor_uri
      )
      payload["head"] = Aptok.json(branch.head_sha)
      payload["isDefault"] = Aptok.json(branch.is_default)
      payload["deletedAt"] = Aptok.json(branch.deleted_at) if branch.deleted_at
      json_any(payload)
    end

    def self.merge_request_json(merge_request : MergeRequestRecord, config : Utils::Config = Utils::Config.load) : JSON::Any
      offer = Aptok.object(
        "Offer",
        merge_request.offer_uri,
        Aptok::JsonMap{
          "@context" => Aptok.json([ActivityPub::CONTEXT, ForgeFed::CONTEXT]),
          "origin"   => Aptok.json(merge_request.origin_uri),
          "target"   => Aptok.json(merge_request.target_uri),
          "object"   => Aptok.json(merge_request.patch_collection_uri),
          "mrDiff"   => Aptok.json({
            "type" => "Link",
            "href" => merge_request.diff_uri || merge_request_diff_uri(merge_request.id, config),
          }),
        }
      )
      payload = Aptok.forgefed_ticket(
        merge_request.ticket_uri,
        merge_request.title,
        merge_request.description,
        attributed_to: merge_request.source_actor_uri,
        context: patch_tracker_uri(merge_request.patch_tracker_id, config),
        resolved: merge_request.status == "merged",
        attachment: [offer]
      )
      payload["summary"] = Aptok.json(merge_request.title)
      payload["mediaType"] = Aptok.json("text/plain")
      payload["published"] = Aptok.json(merge_request.created_at)
      payload["updated"] = Aptok.json(merge_request.updated_at)
      payload["isResolved"] = Aptok.json(merge_request.status == "merged")
      payload["status"] = Aptok.json(merge_request.status)
      json_any(payload)
    end

    def self.patch_set_json(patch_set : PatchSetRecord, config : Utils::Config = Utils::Config.load) : JSON::Any
      patches = list_patch_files(patch_set.id, config).map do |file|
        Aptok.object(
          "Patch",
          file.file_uri,
          Aptok::JsonMap{
            "@context"  => Aptok.json([ActivityPub::CONTEXT, ForgeFed::CONTEXT]),
            "mediaType" => Aptok.json("text/x-diff"),
            "name"      => Aptok.json(file.name),
            "url"       => Aptok.json(file.file_uri),
          }
        )
      end
      collection = Aptok.ordered_collection(patch_set.collection_uri, patches)
      collection["@context"] = Aptok.json([ActivityPub::CONTEXT, ForgeFed::CONTEXT])
      json_any(collection)
    end

    def self.sync_and_get_repository(slug : String, config : Utils::Config = Utils::Config.load) : RepositoryStore::RepositoryRecord?
      repository = RepositoryStore.find_by_slug(slug, config)
      return nil unless repository

      sync_repository(repository, config)
      repository
    end

    def self.apply_merge_request(merge_request_id : String, config : Utils::Config = Utils::Config.load) : MergeRequestRecord?
      merge_request = find_merge_request(merge_request_id, config)
      return nil unless merge_request
      return merge_request if merge_request.status == "merged"

      repository = RepositoryStore.list(config).find { |item| item.id == merge_request.repository_id }
      return nil unless repository

      temp_path = File.join("/tmp", "kefine-apply-#{merge_request.id}")
      FileUtils.rm_rf(temp_path)
      git_run(["clone", repository.repo_path, temp_path])
      git_run(["checkout", repository.default_branch], nil, temp_path)
      git_run(["merge", "--no-ff", merge_request.source_branch_name, "-m", "Merge #{merge_request.source_branch_name}"], nil, temp_path)
      git_run(["push", "origin", repository.default_branch], nil, temp_path)

      merged = MergeRequestRecord.new(
        merge_request.id, merge_request.repository_id, merge_request.patch_tracker_id, merge_request.source_branch_id,
        merge_request.source_branch_name, merge_request.source_actor_key_suffix, merge_request.source_actor_uri,
        merge_request.target_branch_name, merge_request.title, merge_request.description, "merged",
        merge_request.ticket_uri, merge_request.offer_uri, merge_request.origin_uri, merge_request.target_uri,
        merge_request.patch_collection_uri, merge_request.diff_uri, merge_request.base_sha, merge_request.head_sha,
        merge_request.created_at, current_time, current_time
      )
      updated = persist_merge_request(merged, config)
      tracker = find_patch_tracker(merge_request.patch_tracker_id, config)
      if tracker
        accept = Aptok.accept(activity_uri("mr-apply", config), tracker.actor_uri, updated.ticket_uri, [ActivityPub::PUBLIC_COLLECTION])
        accept["@context"] = Aptok.json([ActivityPub::CONTEXT, ForgeFed::CONTEXT])
        accept["published"] = Aptok.json(current_time)
        persist_activity(tracker.actor_uri, "Accept", json_any(accept), updated.ticket_uri, config)
      end
      sync_repository(repository, config)
      updated
    ensure
      FileUtils.rm_rf(temp_path) unless temp_path.nil?
    end
  end
end

require "db"
require "file_utils"
require "json"
require "log"
require "pg"
require "uri"
require "uuid"

require "./order_queue"
require "./utils/config"

module Crater
  module RepositoryStore
    DEFAULT_BRANCH = "main"
    ISSUE_ARTIFACT_EXTENSIONS = {".patch", ".diff", ".org"}
    ISSUE_ARTIFACT_MEDIA_TYPES = {"application/x-git-patch", "text/x-diff", "text/org", "application/org"}

    class RepositoryRecord
      property id : String
      property project_id : String
      property order_id : String
      property slug : String
      property name : String
      property visibility : String
      property default_branch : String
      property server_uuid : String
      property public_clone_url : String?
      property ssh_clone_url : String?
      property repo_path : String
      property created_at : String
      property updated_at : String

      def initialize(
        @id : String,
        @project_id : String,
        @order_id : String,
        @slug : String,
        @name : String,
        @visibility : String,
        @default_branch : String,
        @server_uuid : String,
        @public_clone_url : String?,
        @ssh_clone_url : String?,
        @repo_path : String,
        @created_at : String,
        @updated_at : String
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
          CREATE TABLE IF NOT EXISTS repositories (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL UNIQUE,
            order_id TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            visibility TEXT NOT NULL,
            default_branch TEXT NOT NULL,
            server_uuid TEXT NOT NULL,
            public_clone_url TEXT,
            ssh_clone_url TEXT,
            repo_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        SQL

        db.exec "CREATE INDEX IF NOT EXISTS idx_repositories_order_id ON repositories(order_id)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_repositories_slug ON repositories(slug)"
        db.exec "CREATE INDEX IF NOT EXISTS idx_repositories_project_id ON repositories(project_id)"

        @@ready = true
      end
    end

    private def self.repo_root : String
      presence(ENV["KEFINE_GIT_ROOT"]?.try(&.strip)) || File.expand_path(".meta/crater/git", Dir.current)
    end

    private def self.repositories_root : String
      File.join(repo_root, "repositories")
    end

    private def self.worktrees_root : String
      File.join(repo_root, "worktrees")
    end

    private def self.presence(value : String?) : String?
      return nil unless value

      normalized = value.strip
      normalized.empty? ? nil : normalized
    end

    private def self.normalize_handle(value : String?) : String
      normalized = value.to_s.strip.downcase.gsub(/^@+/, "").gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
      normalized.empty? ? "staff" : normalized
    end

    private def self.slugify(value : String) : String
      normalized = value.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-+|-+$/, "")
      normalized.empty? ? "task-repository" : normalized
    end

    private def self.unique_slug(base : String, order_id : String, config : Utils::Config) : String
      setup(config)
      suffix = order_id.gsub(/[^a-z0-9]+/, "").downcase
      suffix = suffix[0, 8] if suffix.size > 8
      candidate = suffix.empty? ? base : "#{base}-#{suffix}"
      index = 2

      while find_by_slug(candidate, config)
        candidate = "#{base}-#{index}"
        index += 1
      end

      candidate
    end

    private def self.bare_repo_path(slug : String) : String
      File.join(repositories_root, "#{slug}.git")
    end

    private def self.public_clone_url(slug : String, visibility : String, config : Utils::Config) : String?
      return nil unless visibility == "public"

      "#{config.crater_url}/git/#{slug}.git"
    end

    private def self.ssh_clone_url_for_path(path : String, config : Utils::Config) : String
      uri = URI.parse(config.crater_url)
      host = uri.host || "localhost"
      port = uri.port
      normalized_path = path.starts_with?("/") ? path : "/#{path}"

      if port
        "ssh://git@#{host}:#{port}#{normalized_path}"
      else
        "ssh://git@#{host}#{normalized_path}"
      end
    end

    private def self.ssh_clone_url(slug : String, config : Utils::Config) : String
      ssh_clone_url_for_path("/#{slug}.git", config)
    end

    private def self.resolve_visibility(order : OrderQueue::OrderRecord) : String
      return "public" if order.labels.any? { |label| normalized = label.strip.downcase; normalized == "public" || normalized == "repo-public" }

      "private"
    end

    private def self.owner_handle_for_order(order : OrderQueue::OrderRecord, config : Utils::Config) : String
      normalize_handle(order.owner_username || order.actor_handle || config.actor_username)
    end

    private def self.owner_handle_for(record : RepositoryRecord, config : Utils::Config) : String
      order = OrderQueue.find_order(record.order_id, config)
      return normalize_handle(config.actor_username) unless order

      owner_handle_for_order(order, config)
    end

    private def self.project_public_clone_url(record : RepositoryRecord, config : Utils::Config) : String?
      return nil unless record.visibility == "public"

      "#{config.crater_url}/git/@#{owner_handle_for(record, config)}/#{record.project_id}.git"
    end

    private def self.project_ssh_clone_url(record : RepositoryRecord, config : Utils::Config) : String
      ssh_clone_url_for_path("/@#{owner_handle_for(record, config)}/#{record.project_id}.git", config)
    end

    private def self.project_archive_url(record : RepositoryRecord, config : Utils::Config) : String
      "#{config.crater_url}/git/@#{owner_handle_for(record, config)}/#{record.project_id}.zip"
    end

    private def self.hydrate_record(row : {String, String, String, String, String, String, String, String, String?, String?, String, String, String}) : RepositoryRecord
      RepositoryRecord.new(
        id: row[0],
        project_id: row[1],
        order_id: row[2],
        slug: row[3],
        name: row[4],
        visibility: row[5],
        default_branch: row[6],
        server_uuid: row[7],
        public_clone_url: row[8],
        ssh_clone_url: row[9],
        repo_path: row[10],
        created_at: row[11],
        updated_at: row[12]
      )
    end

    private def self.run_git!(args : Array(String), chdir : String? = nil) : Nil
      output = IO::Memory.new
      error = IO::Memory.new
      status = if chdir
                 Process.run("git", args, chdir: chdir, output: output, error: error)
               else
                 Process.run("git", args, output: output, error: error)
               end
      return if status.success?

      raise "git #{args.join(' ')} failed: #{presence(error.to_s.strip) || presence(output.to_s.strip) || status.exit_code}"
    end

    private def self.meta_issue_readme_content : String
      [
        "* Issue Template",
        "Use this directory for task decomposition, patch handoff, and context notes.",
        "",
        "** Recommended structure",
        "- Keep one subdirectory per task or issue.",
        "- Add `.org` planning notes next to `.patch` or `.diff` handoff files.",
        "- Preserve product context in `.meta/lefine.pro.org`."
      ].join('\n')
    end

    private def self.issue_org_content(order : OrderQueue::OrderRecord, repository : RepositoryRecord) : String
      labels = order.labels.empty? ? "-" : order.labels.map { |label| "##{label}" }.join(" ")
      [
        "* #{order.title}",
        ":PROPERTIES:",
        ":ORDER_ID: #{order.id}",
        ":PROJECT_ID: #{repository.project_id}",
        ":REPOSITORY_ID: #{repository.id}",
        ":VISIBILITY: #{repository.visibility}",
        ":STATUS: #{order.status}",
        ":CREATED_AT: #{order.created_at}",
        ":UPDATED_AT: #{order.updated_at}",
        ":END:",
        "",
        "** Summary",
        presence(order.description) || order.title,
        "",
        "** Labels",
        labels,
        "",
        "** Task Breakdown",
        "*** Discovery",
        "- Clarify constraints.",
        "- Collect existing context and artifacts.",
        "",
        "*** Implementation",
        "- Prepare patch or commit sequence.",
        "- Keep issue-specific notes in this directory.",
        "",
        "*** Verification",
        "- Record manual and automated validation steps."
      ].join('\n')
    end

    private def self.lefine_org_content(order : OrderQueue::OrderRecord, repository : RepositoryRecord) : String
      [
        "* #{order.title}",
        ":PROPERTIES:",
        ":UUID: #{repository.server_uuid}",
        ":ORDER_ID: #{order.id}",
        ":PROJECT_ID: #{repository.project_id}",
        ":REPOSITORY_ID: #{repository.id}",
        ":VISIBILITY: #{repository.visibility}",
        ":PUBLIC_CLONE_URL: #{presence(repository.public_clone_url) || "-"}",
        ":SSH_CLONE_URL: #{presence(repository.ssh_clone_url) || "-"}",
        ":END:",
        "",
        "** Context",
        presence(order.description) || order.title,
        "",
        "** Product Description",
        presence(order.description) || "-"
      ].join('\n')
    end

    private def self.deserialize_attachments(value : String?) : Array(JSON::Any)
      return [] of JSON::Any if value.nil? || value.empty?

      JSON.parse(value).as_a
    rescue
      [] of JSON::Any
    end

    private def self.issue_artifact?(attachment : JSON::Any) : Bool
      object = attachment.as_h?
      return false unless object

      name = presence(object["name"]?.try(&.as_s?)) || ""
      media_type = presence(object["mediaType"]?.try(&.as_s?)) || ""
      extension = File.extname(name).downcase

      ISSUE_ARTIFACT_EXTENSIONS.includes?(extension) || ISSUE_ARTIFACT_MEDIA_TYPES.includes?(media_type.downcase)
    end

    private def self.issue_artifact_content(attachment : JSON::Any) : String?
      object = attachment.as_h?
      return nil unless object

      content = object["content"]?.try(&.as_s?)
      presence(content)
    end

    private def self.issue_artifact_filename(attachment : JSON::Any, index : Int32) : String
      object = attachment.as_h?
      raw = object.try { |candidate| presence(candidate["name"]?.try(&.as_s?)) } || "artifact-#{index + 1}"
      sanitized = raw.gsub(/[^\w.\-]+/, "-").gsub(/^-+|-+$/, "")
      sanitized.empty? ? "artifact-#{index + 1}" : sanitized
    end

    private def self.write_seed_files(worktree_path : String, order : OrderQueue::OrderRecord, repository : RepositoryRecord) : Nil
      issue_root = File.join(worktree_path, ".meta", "issues")
      issue_dir = File.join(issue_root, order.id)
      issue_attachments_dir = File.join(issue_dir, "attachments")

      FileUtils.mkdir_p(issue_attachments_dir)
      File.write(File.join(issue_root, "README.org"), meta_issue_readme_content)
      File.write(File.join(issue_dir, "issue.org"), issue_org_content(order, repository))
      File.write(File.join(worktree_path, ".meta", "lefine.pro.org"), lefine_org_content(order, repository))
      File.write(File.join(worktree_path, ".gitignore"), ".meta/lefine.pro.org\n")

      deserialize_attachments(order.attachment_json).each_with_index do |attachment, index|
        next unless issue_artifact?(attachment)

        content = issue_artifact_content(attachment)
        next unless content

        File.write(File.join(issue_attachments_dir, issue_artifact_filename(attachment, index)), content)
      end
    end

    private def self.seed_repository(record : RepositoryRecord, order : OrderQueue::OrderRecord, config : Utils::Config) : Nil
      return if File.exists?(File.join(record.repo_path, "HEAD"))

      worktree_path = ""
      FileUtils.mkdir_p(repositories_root)
      FileUtils.mkdir_p(worktrees_root)
      FileUtils.rm_rf(record.repo_path)
      FileUtils.mkdir_p(File.dirname(record.repo_path))

      worktree_path = File.join(worktrees_root, record.id)
      FileUtils.rm_rf(worktree_path)
      FileUtils.mkdir_p(worktree_path)

      run_git!(["init", "--bare", "--initial-branch=#{record.default_branch}", record.repo_path])
      run_git!(["init", "--initial-branch=#{record.default_branch}"], chdir: worktree_path)
      run_git!(["config", "user.name", "Lefine"], chdir: worktree_path)
      run_git!(["config", "user.email", "git@#{config.domain}"], chdir: worktree_path)

      write_seed_files(worktree_path, order, record)

      run_git!(["add", "."], chdir: worktree_path)
      run_git!(["commit", "-m", "Initial task repository"], chdir: worktree_path)
      run_git!(["remote", "add", "origin", record.repo_path], chdir: worktree_path)
      run_git!(["push", "origin", record.default_branch], chdir: worktree_path)
      run_git!(["--git-dir", record.repo_path, "update-server-info"])
    ensure
      if path = worktree_path
        FileUtils.rm_rf(path) unless path.empty?
      end
    end

    private def self.persist(record : RepositoryRecord, config : Utils::Config) : Nil
      setup(config)
      database(config).exec(
        <<-SQL,
          INSERT INTO repositories (
            id, project_id, order_id, slug, name, visibility, default_branch, server_uuid,
            public_clone_url, ssh_clone_url, repo_path, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (order_id) DO UPDATE SET
            project_id = EXCLUDED.project_id,
            slug = EXCLUDED.slug,
            name = EXCLUDED.name,
            visibility = EXCLUDED.visibility,
            default_branch = EXCLUDED.default_branch,
            server_uuid = EXCLUDED.server_uuid,
            public_clone_url = EXCLUDED.public_clone_url,
            ssh_clone_url = EXCLUDED.ssh_clone_url,
            repo_path = EXCLUDED.repo_path,
            updated_at = EXCLUDED.updated_at
        SQL
        record.id,
        record.project_id,
        record.order_id,
        record.slug,
        record.name,
        record.visibility,
        record.default_branch,
        record.server_uuid,
        record.public_clone_url,
        record.ssh_clone_url,
        record.repo_path,
        record.created_at,
        record.updated_at
      )
    end

    def self.find_by_order(order_id : String, config : Utils::Config = Utils::Config.load) : RepositoryRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, project_id, order_id, slug, name, visibility, default_branch, server_uuid, public_clone_url, ssh_clone_url, repo_path, created_at, updated_at FROM repositories WHERE order_id = $1",
        order_id,
        as: {String, String, String, String, String, String, String, String, String?, String?, String, String, String}
      )
      row ? hydrate_record(row) : nil
    end

    def self.find_by_project(project_id : String, config : Utils::Config = Utils::Config.load) : RepositoryRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, project_id, order_id, slug, name, visibility, default_branch, server_uuid, public_clone_url, ssh_clone_url, repo_path, created_at, updated_at FROM repositories WHERE project_id = $1",
        project_id,
        as: {String, String, String, String, String, String, String, String, String?, String?, String, String, String}
      )
      row ? hydrate_record(row) : nil
    end

    def self.find_by_slug(slug : String, config : Utils::Config = Utils::Config.load) : RepositoryRecord?
      setup(config)
      row = database(config).query_one?(
        "SELECT id, project_id, order_id, slug, name, visibility, default_branch, server_uuid, public_clone_url, ssh_clone_url, repo_path, created_at, updated_at FROM repositories WHERE slug = $1",
        slug,
        as: {String, String, String, String, String, String, String, String, String?, String?, String, String, String}
      )
      row ? hydrate_record(row) : nil
    end

    def self.find_by_owner_and_project_clone_name(owner_handle : String, clone_name : String, config : Utils::Config = Utils::Config.load) : RepositoryRecord?
      normalized_owner = normalize_handle(owner_handle)
      normalized_clone_name = clone_name.sub(/\.git\z/, "")

      list(config).find do |repository|
        owner_handle_for(repository, config) == normalized_owner &&
          (
            repository.project_id == normalized_clone_name ||
            repository.order_id == normalized_clone_name ||
            repository.slug == normalized_clone_name
          )
      end
    end

    def self.owner_handle(record : RepositoryRecord, config : Utils::Config = Utils::Config.load) : String
      owner_handle_for(record, config)
    end

    def self.list(config : Utils::Config = Utils::Config.load) : Array(RepositoryRecord)
      setup(config)
      database(config).query_all(
        "SELECT id, project_id, order_id, slug, name, visibility, default_branch, server_uuid, public_clone_url, ssh_clone_url, repo_path, created_at, updated_at FROM repositories ORDER BY created_at DESC",
        as: {String, String, String, String, String, String, String, String, String?, String?, String, String, String}
      ).map do |row|
        hydrate_record(row)
      end
    end

    def self.ensure_for_order(order : OrderQueue::OrderRecord, config : Utils::Config = Utils::Config.load) : RepositoryRecord
      existing = find_by_order(order.id, config)
      if existing
        if existing.project_id != order.id
          existing.project_id = order.id
          existing.updated_at = current_time
          persist(existing, config)
        end
        seed_repository(existing, order, config)
        return existing
      end

      now = current_time
      visibility = resolve_visibility(order)
      slug = unique_slug(slugify(order.title), order.id, config)
      record = RepositoryRecord.new(
        id: UUID.random.to_s,
        project_id: order.id,
        order_id: order.id,
        slug: slug,
        name: order.title,
        visibility: visibility,
        default_branch: DEFAULT_BRANCH,
        server_uuid: UUID.random.to_s,
        public_clone_url: public_clone_url(slug, visibility, config),
        ssh_clone_url: ssh_clone_url(slug, config),
        repo_path: bare_repo_path(slug),
        created_at: now,
        updated_at: now
      )

      persist(record, config)
      seed_repository(record, order, config)
      record
    end

    def self.to_json_payload(record : RepositoryRecord) : Hash(String, JSON::Any)
      config = Utils::Config.load
      owner_handle = owner_handle_for(record, config)
      project_public_url = project_public_clone_url(record, config)
      project_ssh_url = project_ssh_clone_url(record, config)
      {
        "id" => JSON::Any.new(record.id),
        "projectId" => JSON::Any.new(record.project_id),
        "orderId" => JSON::Any.new(record.order_id),
        "slug" => JSON::Any.new(record.slug),
        "ownerHandle" => JSON::Any.new(owner_handle),
        "name" => JSON::Any.new(record.name),
        "visibility" => JSON::Any.new(record.visibility),
        "defaultBranch" => JSON::Any.new(record.default_branch),
        "serverUuid" => JSON::Any.new(record.server_uuid),
        "publicCloneUrl" => JSON::Any.new(record.public_clone_url || ""),
        "sshCloneUrl" => JSON::Any.new(record.ssh_clone_url || ""),
        "projectCloneUrl" => JSON::Any.new(project_public_url || project_ssh_url),
        "projectPublicCloneUrl" => JSON::Any.new(project_public_url || ""),
        "projectSshCloneUrl" => JSON::Any.new(project_ssh_url),
        "projectArchiveUrl" => JSON::Any.new(project_archive_url(record, config)),
        "repositoryUrl" => JSON::Any.new("#{config.crater_url}/repositories/#{record.slug}"),
        "projectUrl" => JSON::Any.new("#{config.crater_url}/projects/#{record.project_id}"),
        "createdAt" => JSON::Any.new(record.created_at),
        "updatedAt" => JSON::Any.new(record.updated_at)
      }
    end
  end
end

require "rcl"

module Lepos
  module LeposConfig
    DEFAULT_BRANCH = "main"

    struct RepsSettings
      property repositories : Array(String)
      property repository_config_path : String
      property agent_system_prompt_path : String?

      def initialize(
        @repositories : Array(String),
        @repository_config_path : String,
        @agent_system_prompt_path : String?
      )
      end

      def self.default : RepsSettings
        new(
          repositories: [] of String,
          repository_config_path: "",
          agent_system_prompt_path: nil
        )
      end

      def payload : JSON::Any
        JSON.parse(
          {
            "repositories"          => repositories,
            "repositoryConfigPath"  => repository_config_path,
            "agentSystemPromptPath" => agent_system_prompt_path,
          }.to_json
        )
      end
    end

    struct RepositorySettings
      property issue_storage : String
      property issue_root : String
      property issue_readme_name : String
      property issue_file_name : String
      property issue_attachments_dir : String
      property main_readme_path : String
      property plan_document_path : String
      property repository_readme : String
      property repository_icon : String
      property default_branch : String
      property accept_pull_issues : Bool
      property accept_pull_patches : Bool
      property reps_config_paths : Array(String)
      property agent_system_prompt_path : String?

      def initialize(
        @issue_storage : String,
        @issue_root : String,
        @issue_readme_name : String,
        @issue_file_name : String,
        @issue_attachments_dir : String,
        @main_readme_path : String,
        @plan_document_path : String,
        @repository_readme : String,
        @repository_icon : String,
        @default_branch : String,
        @accept_pull_issues : Bool,
        @accept_pull_patches : Bool,
        @reps_config_paths : Array(String),
        @agent_system_prompt_path : String?
      )
      end

      def self.default : RepositorySettings
        new(
          issue_storage: "filesystem",
          issue_root: ".meta/issues",
          issue_readme_name: "README.org",
          issue_file_name: "issue.org",
          issue_attachments_dir: "attachments",
          main_readme_path: ".meta/lefine.pro.org",
          plan_document_path: "PLAN.org",
          repository_readme: "Lefine repository metadata and task context",
          repository_icon: "",
          default_branch: DEFAULT_BRANCH,
          accept_pull_issues: true,
          accept_pull_patches: true,
          reps_config_paths: ["reps.rcl", "reps.toml"],
          agent_system_prompt_path: nil
        )
      end

      def filesystem_storage? : Bool
        issue_storage == "filesystem"
      end

      def database_storage? : Bool
        issue_storage == "database"
      end

      def issue_root_path : String
        issue_root
      end

      def issue_directory(order_id : String) : String
        RepositorySettings.safe_path_join(issue_root_path, order_id)
      end

      def issue_file_path(order_id : String) : String
        RepositorySettings.safe_path_join(issue_directory(order_id), issue_file_name)
      end

      def issue_readme_path(order_id : String) : String
        RepositorySettings.safe_path_join(issue_directory(order_id), issue_readme_name)
      end

      def issue_attachment_path(order_id : String, attachment_name : String) : String
        RepositorySettings.safe_path_join(issue_directory(order_id), issue_attachments_dir, attachment_name)
      end

      def repository_readme_path : String
        main_readme_path
      end

      def plan_path : String
        plan_document_path
      end

      def pull_issues_allowed? : Bool
        accept_pull_issues
      end

      def pull_patches_allowed? : Bool
        accept_pull_patches
      end

      def reps_sources : Array(String)
        reps_config_paths.any? ? reps_config_paths : RepositorySettings.default.reps_config_paths
      end

      def payload : JSON::Any
        JSON.parse(
          {
            "issueStorage"          => issue_storage,
            "issueRoot"             => issue_root,
            "issueReadmeName"       => issue_readme_name,
            "issueFileName"         => issue_file_name,
            "issueAttachmentsDir"   => issue_attachments_dir,
            "mainReadmePath"        => main_readme_path,
            "planDocumentPath"      => plan_document_path,
            "repositoryReadme"      => repository_readme,
            "repositoryIcon"        => repository_icon,
            "defaultBranch"         => default_branch,
            "acceptPullIssues"      => accept_pull_issues,
            "acceptPullPatches"     => accept_pull_patches,
            "repsConfigPaths"       => reps_config_paths,
            "agentSystemPromptPath" => agent_system_prompt_path,
          }.to_json
        )
      end

      def render_default_file : String
        [
          "repository do",
          "  # Repository icon",
          "  icon = \"#{LeposConfig.escape_rcl_value(repository_icon)}\"",
          "  # Default branch for this repository",
          "  default_branch = \"#{LeposConfig.escape_rcl_value(default_branch)}\"",
          "",
          "  # Pull policies",
          "  # true/false or yes/no/on/off",
          "  accept_pull_issues = #{accept_pull_issues}",
          "  accept_pull_patches = #{accept_pull_patches}",
          "",
          "  # How task issues are stored for this repository:",
          "  # filesystem (default) = create local issue metadata in issue_root",
          "  # database  = keep issue metadata in DB table (no issue files are written)",
          "  issue_storage = \"#{LeposConfig.escape_rcl_value(issue_storage)}\"",
          "  issue_root = \"#{LeposConfig.escape_rcl_value(issue_root)}\"",
          "  issue_file_name = \"#{LeposConfig.escape_rcl_value(issue_file_name)}\"",
          "  issue_readme_name = \"#{LeposConfig.escape_rcl_value(issue_readme_name)}\"",
          "  issue_attachments_dir = \"#{LeposConfig.escape_rcl_value(issue_attachments_dir)}\"",
          "",
          "  # Path for repository-level metadata/readme document",
          "  main_readme_path = \"#{LeposConfig.escape_rcl_value(main_readme_path)}\"",
          "  repository_readme = \"#{LeposConfig.escape_rcl_value(repository_readme)}\"",
          "",
          "  # Canonical execute plan document",
          "  plan_document_path = \"#{LeposConfig.escape_rcl_value(plan_document_path)}\"",
          "",
          "  # Repository set controls",
          "  reps_config_paths = [\"#{reps_config_paths.join("\", \"")}\"]",
          "  agent_system_prompt_path = \"#{LeposConfig.escape_rcl_value(agent_system_prompt_path || "")}\"",
          "",
          "  # Optional per-repository sets are read from reps.rcl/reps.toml in repo root",
          "end",
        ].join('\n')
      end

      def self.safe_path_join(*parts : String) : String
        normalized_parts = parts.flat_map { |part| sanitize_path(part).split('/') }.reject(&.empty?)
        return "." if normalized_parts.empty?
        File.join(normalized_parts)
      end

      def self.sanitize_path(value : String) : String
        normalized = value.gsub('\\', '/').strip

        return "" if normalized.empty?

        without_root = normalized.sub(%r{\A/+}, "")
        without_root = without_root.gsub(%r{/+}, "/")
        segments = without_root.split('/').reject { |segment| segment == "." || segment == ".." || segment.empty? }
        segments.empty? ? "" : segments.join('/')
      end
    end

    private def self.normalize_key(raw : String) : String
      raw.downcase.gsub(/[^a-z0-9]+/, "_").strip('_')
    end

    private def self.normalize_storage(raw : String) : String
      normalized = raw.downcase
      return "database" if normalized == "db" || normalized == "database"
      return "filesystem" if normalized == "fs" || normalized == "filesystem"
      "filesystem"
    end

    private def self.normalize_path(raw : String, fallback : String) : String
      value = sanitized_path(raw)
      return fallback if value.empty?
      value
    end

    private def self.normalize_name(raw : String, fallback : String) : String
      value = raw.to_s.strip
      value.empty? ? fallback : value
    end

    private def self.normalize_bool(raw : String, fallback : Bool) : Bool
      value = raw.downcase.strip
      return true if {"1", "true", "yes", "on", "enable", "enabled"}.includes?(value)
      return false if {"0", "false", "no", "off", "disable", "disabled"}.includes?(value)
      fallback
    end

    private def self.normalize_array(value : String, fallback : Array(String)) : Array(String)
      return fallback if value.empty?

      source = parse_list(value)
      return fallback if source.empty?
      source
    end

    private def self.parse_list(raw : String) : Array(String)
      cleaned = raw.strip
      return [] of String if cleaned.empty?

      normalized = cleaned
      if normalized.starts_with?('[') && normalized.ends_with?(']')
        normalized = normalized[1..-2]
      end

      normalized.split(",").map(&.strip).reject(&.empty?).compact_map do |entry|
        unquoted = parse_value(entry)
        normalized_entry = unquoted.strip
        normalized_entry.empty? ? nil : normalized_entry
      end
    end

    private def self.parse_value(raw : String) : String
      value = raw.strip
      return "" if value.empty?

      return value[1..-2] if quoted?(value, "\"")
      return value[1..-2] if quoted?(value, "'")
      value
    end

    private def self.quoted?(value : String, delimiter : String) : Bool
      value.size >= 2 && value.starts_with?(delimiter) && value.ends_with?(delimiter)
    end

    private def self.sanitized_path(raw : String) : String
      RepositorySettings.sanitize_path(raw)
    end

    def self.escape_rcl_value(value : String) : String
      value.gsub("\\", "\\\\").gsub("\"", "\\\"")
    end

    private def self.extract_rcl_section(raw : String, section_names : Array(String)) : Hash(String, RCL::Value)?
      raw_sections = [raw, normalize_legacy_sections(raw)]

      raw_sections.each do |candidate|
        begin
          payload = RCL.parse_string(candidate).to_h
          if section = resolve_section(payload, section_names)
            return section
          end
          if root = payload["root"]?.try(&.as?(Hash(String, RCL::Value)))
            return root
          end
        rescue
        end
      end

      nil
    end

    private def self.resolve_section(payload : Hash(String, RCL::Value), section_names : Array(String)) : Hash(String, RCL::Value)?
      section_names.each do |name|
        candidate = payload[name]?
        return candidate.as?(Hash(String, RCL::Value)) if candidate
      end
      nil
    end

    private def self.value_lookup(data : Hash(String, RCL::Value), keys : Array(String)) : RCL::Value?
      keys.each do |key|
        next unless value = data[key]?
        return value
      end
      nil
    end

    private def self.extract_string(
      data : Hash(String, RCL::Value),
      keys : Array(String),
      fallback : String,
      normalize : String -> String = ->(value : String) { value }
    ) : String
      value_lookup(data, keys).try do |candidate|
        return normalize.call(candidate.as?(String).to_s) if candidate.is_a?(String)
        return normalize.call(parse_list(candidate.to_s).join(", "))
      end
      fallback
    end

    private def self.extract_optional_string(
      data : Hash(String, RCL::Value),
      keys : Array(String)
    ) : String?
      value_lookup(data, keys).try do |candidate|
        return nil unless candidate.is_a?(String)
        normalized = candidate.strip
        return nil if normalized.empty?
        return normalized
      end
      nil
    end

    private def self.extract_bool(
      data : Hash(String, RCL::Value),
      keys : Array(String),
      fallback : Bool
    ) : Bool
      value_lookup(data, keys).try do |candidate|
        return candidate if candidate.is_a?(Bool)
        return normalize_bool(candidate.to_s, fallback)
      end
      fallback
    end

    private def self.extract_string_array(
      data : Hash(String, RCL::Value),
      keys : Array(String),
      fallback : Array(String)
    ) : Array(String)
      value_lookup(data, keys).try do |candidate|
        case candidate
        when Array
          result = candidate.compact_map do |entry|
            value = entry.to_s.strip
            value.empty? ? nil : value
          end
          return result unless result.empty?
        when String
          parsed = parse_list(candidate)
          return parsed unless parsed.empty?
          parsed = candidate.split(",").map(&.strip).reject(&.empty?).to_a
          return parsed unless parsed.empty?
        end
      end
      fallback
    end

    private def self.normalize_legacy_sections(raw : String) : String
      lines = raw.lines
      output = [] of String
      opened = 0

      lines.each do |line|
        match = line.match(/\A\s*\[(.+)\]\s*\z/)
        if match
          output << "end" if opened > 0
          normalized_section = normalize_key(match[1].to_s)
          output << "#{normalized_section} do"
          opened += 1
        else
          output << line
        end
      end

      opened.times { output << "end" }
      output.join('\n')
    end

    def self.parse_reps(raw : String) : RepsSettings
      if section = extract_rcl_section(raw, ["reps", "repositories", "agents", "agent"])
        repositories = extract_string_array(section, ["repositories", "repository_list", "reps"], RepsSettings.default.repositories)
        repository_config_path = extract_string(section, ["repository_config_path", "config_path", "path"], "", normalize: ->(value : String) { normalize_path(value, "") })
        agent_system_prompt_path = extract_optional_string(section, ["agent_system_prompt_path", "system_prompt_path", "system_prompt"])

        return RepsSettings.new(
          repositories: repositories,
          repository_config_path: repository_config_path,
          agent_system_prompt_path: agent_system_prompt_path
        )
      end

      parse_reps_legacy(raw)
    end

    def self.load_from_file(path : String) : RepositorySettings
      raw = File.read(path)
      parse(raw)
    rescue
      RepositorySettings.default
    end

    def self.parse(raw : String) : RepositorySettings
      if section = extract_rcl_section(raw, ["repository", "repo"])
        defaults = RepositorySettings.default
        issue_storage = extract_string(section, ["issue_storage"], defaults.issue_storage, normalize: ->(value : String) { normalize_storage(value) })
        issue_root = extract_string(section, ["issue_root", "issues_root", "issues_dir"], defaults.issue_root, normalize: ->(value : String) { normalize_path(value, defaults.issue_root) })
        issue_readme_name = extract_string(section, ["issue_readme_name"], defaults.issue_readme_name, normalize: ->(value : String) { normalize_name(value, defaults.issue_readme_name) })
        issue_file_name = extract_string(section, ["issue_file_name"], defaults.issue_file_name, normalize: ->(value : String) { normalize_name(value, defaults.issue_file_name) })
        issue_attachments_dir = extract_string(section, ["issue_attachments_dir"], defaults.issue_attachments_dir, normalize: ->(value : String) { normalize_name(value, defaults.issue_attachments_dir) })
        reps_config_paths = extract_string_array(section, ["reps_config_paths", "reps_config_path"], defaults.reps_config_paths)
        repository_icon = extract_string(section, ["repository_icon", "icon"], defaults.repository_icon, normalize: ->(value : String) { normalize_name(value, defaults.repository_icon) })
        main_readme_path = extract_string(section, ["main_readme_path", "main_readme", "repository_readme_path", "readme_path"], defaults.main_readme_path, normalize: ->(value : String) { normalize_path(value, defaults.main_readme_path) })
        plan_document_path = extract_string(section, ["plan_document_path", "plan_path", "plan_file"], defaults.plan_document_path, normalize: ->(value : String) { normalize_path(value, defaults.plan_document_path) })
        repository_readme = extract_string(section, ["repository_readme"], defaults.repository_readme, normalize: ->(value : String) { normalize_name(value, defaults.repository_readme) })
        default_branch = extract_string(section, ["default_branch", "default_branch_name"], defaults.default_branch, normalize: ->(value : String) { normalize_name(value, defaults.default_branch) })
        accept_pull_issues = extract_bool(section, ["accept_pull_issues", "allow_pull_issues", "accept_pull_issue"], defaults.accept_pull_issues)
        accept_pull_patches = extract_bool(section, ["accept_pull_patches", "allow_pull_patches", "accept_pull_patch"], defaults.accept_pull_patches)
        agent_system_prompt_path = extract_optional_string(section, ["agent_system_prompt_path", "system_prompt_path", "system_prompt"])

        return RepositorySettings.new(
          issue_storage: issue_storage,
          issue_root: issue_root,
          issue_readme_name: issue_readme_name,
          issue_file_name: issue_file_name,
          issue_attachments_dir: issue_attachments_dir,
          main_readme_path: main_readme_path,
          plan_document_path: plan_document_path,
          repository_readme: repository_readme,
          repository_icon: repository_icon,
          default_branch: default_branch,
          accept_pull_issues: accept_pull_issues,
          accept_pull_patches: accept_pull_patches,
          reps_config_paths: reps_config_paths,
          agent_system_prompt_path: agent_system_prompt_path
        )
      end

      parse_legacy(raw)
    end

    def self.load(path : String) : RepositorySettings
      return RepositorySettings.default unless File.exists?(path)
      load_from_file(path)
    end

    def self.default_payload : JSON::Any
      RepositorySettings.default.payload
    end

    private def self.parse_legacy(raw : String) : RepositorySettings
      settings = RepositorySettings.default
      section = ""
      issue_storage = settings.issue_storage
      issue_root = settings.issue_root
      issue_readme_name = settings.issue_readme_name
      issue_file_name = settings.issue_file_name
      issue_attachments_dir = settings.issue_attachments_dir
      main_readme_path = settings.main_readme_path
      plan_document_path = settings.plan_document_path
      repository_readme = settings.repository_readme
      repository_icon = settings.repository_icon
      default_branch = settings.default_branch
      accept_pull_issues = settings.accept_pull_issues
      accept_pull_patches = settings.accept_pull_patches
      reps_config_paths = settings.reps_config_paths
      agent_system_prompt_path = settings.agent_system_prompt_path

      raw.each_line do |line|
        trimmed = line.strip
        stripped = trimmed.sub(/#.*/, "")
        next if stripped.empty?

        if section_match = stripped.match(/\A\[(.+)\]\z/)
          section = section_match[1]?.to_s.downcase.strip
          next
        end

        next unless section == "" || section == "repository" || section == "repo"

        match = stripped.match(/\A([A-Za-z0-9_.-]+)\s*=\s*(.+)\z/)
        next unless match

        key = normalize_key(match[1].to_s)
        value = parse_value(match[2].to_s)
        case key
        when "issue_storage"
          issue_storage = normalize_storage(value)
        when "issue_root", "issues_root", "issues_dir"
          issue_root = normalize_path(value, settings.issue_root)
        when "issue_readme_name"
          issue_readme_name = normalize_name(value, settings.issue_readme_name)
        when "issue_file_name"
          issue_file_name = normalize_name(value, settings.issue_file_name)
        when "issue_attachments_dir"
          issue_attachments_dir = normalize_name(value, settings.issue_attachments_dir)
        when "reps_config_paths", "reps_config_path"
          reps_config_paths = normalize_array(value, settings.reps_config_paths)
        when "repository_icon", "icon"
          repository_icon = normalize_name(value, settings.repository_icon)
        when "main_readme_path", "main_readme", "repository_readme_path", "readme_path"
          main_readme_path = normalize_path(value, settings.main_readme_path)
        when "plan_document_path", "plan_path", "plan_file"
          plan_document_path = normalize_path(value, settings.plan_document_path)
        when "repository_readme"
          repository_readme = normalize_name(value, settings.repository_readme)
        when "default_branch", "default_branch_name"
          default_branch = normalize_name(value, settings.default_branch)
        when "accept_pull_issues", "allow_pull_issues", "accept_pull_issue"
          accept_pull_issues = normalize_bool(value, settings.accept_pull_issues)
        when "accept_pull_patches", "allow_pull_patches", "accept_pull_patch"
          accept_pull_patches = normalize_bool(value, settings.accept_pull_patches)
        when "agent_system_prompt_path", "system_prompt_path", "system_prompt"
          agent_system_prompt_path = normalize_name(value, settings.agent_system_prompt_path || "")
          agent_system_prompt_path = nil if agent_system_prompt_path.empty?
        end
      end

      RepositorySettings.new(
        issue_storage: issue_storage,
        issue_root: issue_root,
        issue_readme_name: issue_readme_name,
        issue_file_name: issue_file_name,
        issue_attachments_dir: issue_attachments_dir,
        main_readme_path: main_readme_path,
        plan_document_path: plan_document_path,
        repository_readme: repository_readme,
        repository_icon: repository_icon,
        default_branch: normalize_name(default_branch, settings.default_branch),
        accept_pull_issues: accept_pull_issues,
        accept_pull_patches: accept_pull_patches,
        reps_config_paths: reps_config_paths,
        agent_system_prompt_path: agent_system_prompt_path
      )
    end

    private def self.parse_reps_legacy(raw : String) : RepsSettings
      settings = RepsSettings.default
      repositories : Array(String) = [] of String
      repository_config_path = ""
      agent_system_prompt_path : String? = nil
      section = ""

      raw.each_line do |line|
        trimmed = line.strip
        stripped = trimmed.sub(/#.*/, "")
        next if stripped.empty?

        if section_match = stripped.match(/\A\[(.+)\]\z/)
          section = section_match[1]?.to_s.downcase.strip
          next
        end

        next unless section == "reps" || section == "repositories" || section == "agents" || section == "agent"
        match = stripped.match(/\A([A-Za-z0-9_.-]+)\s*=\s*(.+)\z/)
        next unless match

        key = normalize_key(match[1].to_s)
        value = parse_value(match[2].to_s)
        case key
        when "repositories", "repository_list", "reps"
          repositories = parse_list(value)
        when "repository_config_path", "config_path", "path"
          repository_config_path = normalize_path(value, settings.repository_config_path)
        when "agent_system_prompt_path", "system_prompt_path", "system_prompt"
          agent_system_prompt_path = normalize_name(value, settings.agent_system_prompt_path.to_s)
        end
      end

      RepsSettings.new(
        repositories: repositories,
        repository_config_path: repository_config_path,
        agent_system_prompt_path: agent_system_prompt_path
      )
    end
  end
end

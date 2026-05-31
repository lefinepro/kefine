require "json"
require "./repository_store"
require "./order_queue"
require "./utils/config"

module Crater
  module GitReceiveHook
    struct RefUpdate
      getter old_revision : String
      getter new_revision : String
      getter ref_name : String

      def initialize(@old_revision : String, @new_revision : String, @ref_name : String)
      end

      def branch_name : String?
        return nil unless ref_name.starts_with?("refs/heads/")

        ref_name.sub("refs/heads/", "")
      end

      def deleted? : Bool
        new_revision == "0000000000000000000000000000000000000000"
      end
    end

    private def self.deny(message : String) : NoReturn
      STDERR.puts(message)
      exit(1)
    end

    private def self.parse_arg(args : Array(String), name : String) : String
      index = args.index(name)
      deny("Missing #{name} argument.") unless index

      value = args[index + 1]?
      deny("Missing value for #{name}.") unless value
      value
    end

    private def self.parse_stage(args : Array(String)) : String
      stage = parse_arg(args, "--stage")
      return stage if {"pre-receive", "post-receive"}.includes?(stage)

      deny("Unsupported hook stage: #{stage}.")
    end

    private def self.actor_handle : String
      normalized = ENV["KEFINE_GIT_ACTOR_HANDLE"]?.to_s.strip.downcase.gsub(/^@+/, "").gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
      deny("Missing git actor handle.") if normalized.empty?
      normalized
    end

    private def self.read_updates : Array(RefUpdate)
      STDIN.gets_to_end.lines.compact_map do |line|
        parts = line.split(/\s+/, 3)
        next nil unless parts.size == 3
        RefUpdate.new(parts[0], parts[1], parts[2])
      end
    end

    private def self.push_option_override : Bool?
      count = ENV["GIT_PUSH_OPTION_COUNT"]?.try(&.to_i?) || 0
      count.times do |index|
        raw = ENV["GIT_PUSH_OPTION_#{index}"]?
        next unless raw
        next unless match = raw.match(/\Aexchange-run=(.+)\z/)

        value = match[1].strip.downcase
        return true if {"1", "true", "yes", "on"}.includes?(value)
        return false if {"0", "false", "no", "off"}.includes?(value)
      end

      nil
    end

    private def self.run_pre_receive(repository : RepositoryStore::RepositoryRecord, config : Utils::Config) : NoReturn
      actor = actor_handle
      updates = read_updates

      updates.each do |update|
        branch = update.branch_name
        unless branch
          next if RepositoryStore.owner_handle(repository, config) == actor
          next if repository.visibility == "public"

          deny("Push to #{update.ref_name} is not allowed for @#{actor}.")
        end

        next if RepositoryStore.allowed_push?(repository, branch, actor, config)

        deny("Push to branch #{branch} is not allowed for @#{actor}.")
      end

      exit(0)
    end

    private def self.run_post_receive(repository : RepositoryStore::RepositoryRecord, config : Utils::Config) : NoReturn
      actor = actor_handle
      updates = read_updates
      exchange_run = RepositoryStore.resolve_exchange_run(repository, push_option_override, config)
      lepos_settings = RepositoryStore.lepos_config(repository)

      if plan = RepositoryStore.read_plan_document(repository, config)
        unless repository.order_id.starts_with?(RepositoryStore::AD_HOC_ORDER_PREFIX)
          OrderQueue.update_document(
            repository.order_id,
            JSON.parse({"format" => "markdown", "content" => plan}.to_json),
            config
          )
        end
      end

      exit(0) unless exchange_run

      updates.each do |update|
        branch = update.branch_name
        next unless branch
        next if update.deleted?

        RepositoryStore.sync_exchange_issue_for_push(
          repository,
          branch,
          actor,
          update.old_revision,
          update.new_revision,
          config,
          lepos_settings
        )
      end

      exit(0)
    end

    def self.run(config : Utils::Config, args : Array(String)) : NoReturn
      deny("Repositories feature is disabled.") unless config.repositories_enabled

      stage = parse_stage(args)
      repository_id = parse_arg(args, "--repo-id")
      repository = RepositoryStore.find_by_id(repository_id, config)
      deny("Repository not found.") unless repository

      case stage
      when "pre-receive"
        run_pre_receive(repository, config)
      when "post-receive"
        run_post_receive(repository, config)
      else
        deny("Unsupported hook stage.")
      end
    rescue ex
      deny(ex.message || "Git receive hook failed.")
    end
  end
end

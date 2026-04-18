require "./repository_store"
require "./ssh_key_store"
require "./utils/config"

module Crater
  module SshGitShell
    private def self.normalize_actor(value : String?) : String
      value.to_s.strip.downcase.gsub(/^@+/, "").gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
    end

    private def self.deny(message : String) : NoReturn
      STDERR.puts(message)
      exit(1)
    end

    private def self.parse_actor(args : Array(String)) : String
      index = args.index("--actor")
      deny("Missing --actor argument.") unless index
      value = args[index + 1]?
      deny("Missing actor handle.") unless value

      actor = normalize_actor(value)
      deny("Actor handle is invalid.") if actor.empty?
      actor
    end

    private def self.parse_original_command(command : String?) : {String, String}
      normalized = command.to_s.strip
      deny("SSH_ORIGINAL_COMMAND is missing.") if normalized.empty?
      match = normalized.match(/\A(git-upload-pack|git-receive-pack)\s+['"]?([^'"]+)['"]?\z/)
      deny("Unsupported SSH command.") unless match

      {match[1], match[2]}
    end

    private def self.resolve_repository(request_path : String, config : Utils::Config) : RepositoryStore::RepositoryRecord?
      normalized = request_path.strip
      return nil unless normalized.ends_with?(".git")

      if match = normalized.match(/\A\/?@([^\/]+)\/([^\/]+)\.git\z/)
        return RepositoryStore.find_by_owner_and_project_clone_name(match[1], match[2], config)
      end

      if match = normalized.match(/\A\/?([^\/]+)\.git\z/)
        return RepositoryStore.find_by_slug(match[1], config)
      end

      nil
    end

    private def self.authorized?(service : String, actor_handle : String, repository : RepositoryStore::RepositoryRecord, config : Utils::Config) : Bool
      owner_handle = RepositoryStore.owner_handle(repository, config)

      case service
      when "git-upload-pack"
        repository.visibility == "public" || actor_handle == owner_handle
      when "git-receive-pack"
        actor_handle == owner_handle
      else
        false
      end
    end

    def self.run(config : Utils::Config, args : Array(String)) : NoReturn
      actor_handle = parse_actor(args)
      key = SshKeyStore.find_by_actor(actor_handle, config)
      deny("SSH key is not registered for @#{actor_handle}.") unless key

      service, request_path = parse_original_command(ENV["SSH_ORIGINAL_COMMAND"]?)
      repository = resolve_repository(request_path, config)
      deny("Repository not found.") unless repository
      deny("Access denied.") unless authorized?(service, actor_handle, repository, config)

      status = Process.run(service, {repository.repo_path}, input: STDIN, output: STDOUT, error: STDERR)
      exit(status.exit_code)
    rescue ex
      deny(ex.message || "SSH git command failed.")
    end
  end
end

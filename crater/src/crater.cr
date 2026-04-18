require "kemal"
require "./crater/activitypub/types"
require "./crater/forgefed/types"
require "./crater/handlers/webfinger"
require "./crater/handlers/nodeinfo"
require "./crater/handlers/actor"
require "./crater/handlers/inbox"
require "./crater/handlers/outbox"
require "./crater/handlers/orders"
require "./crater/handlers/status"
require "./crater/handlers/passkeys"
require "./crater/handlers/privatekey_auth"
require "./crater/handlers/projects"
require "./crater/handlers/git_http"
require "./crater/handlers/forgefed_resources"
require "./crater/handlers/ssh_keys"
require "./crater/middleware/cors"
require "./crater/middleware/logger"
require "./crater/utils/config"
require "./crater/utils/actor_keys"
require "./crater/repository_store"
require "./crater/forgefed_store"
require "./crater/ssh_key_store"
require "./crater/ssh_git_shell"
require "./crater/git_receive_hook"

module Crater
  VERSION = "0.1.0"

  def self.run
    config = Utils::Config.load
    actor_private_key = config.resolved_actor_private_key_pem
    actor_address = Utils::ActorKeys.derive_actor_address(actor_private_key)
    actor_private_key_string = Utils::ActorKeys.encode_private_key_string(actor_private_key)
    actor_public_key_string = Utils::ActorKeys.derive_public_key_string(actor_private_key)
    actor_key_source = if !ENV["KEFINE_PRIVATEKEY_DEFAULT"]?.try(&.strip).to_s.empty?
      "KEFINE_PRIVATEKEY_DEFAULT"
    elsif !config.actor_private_key.strip.empty?
      "kefine.config.json defaultActor.privateKey"
    else
      "unconfigured"
    end

    puts "[crater] default actor: @#{config.actor_username}"
    puts "[crater] private key loaded: #{!actor_private_key.strip.empty?}"
    puts "[crater] private key source: #{actor_key_source}"
    puts "[crater] private key string: #{actor_private_key_string.empty? ? "unavailable" : actor_private_key_string}"
    puts "[crater] public key string: #{actor_public_key_string.empty? ? "unavailable" : actor_public_key_string}"
    puts "[crater] actor address: #{actor_address || "unavailable"}"

    # Middleware
    add_handler CorsHandler.new
    add_handler RequestLogger.new

    # ActivityPub discovery
    Handlers::WebFinger.register(config)
    Handlers::NodeInfo.register(config)
    Handlers::Actor.register(config)

    # ActivityPub inbox/outbox
    Handlers::Inbox.register(config)
    Handlers::Outbox.register(config)
    Handlers::Orders.register(config)
    Handlers::Status.register(config)
    Handlers::Passkeys.register(config)
    Handlers::PrivatekeyAuth.register(config)

    # ForgeFed project endpoints
    Handlers::Projects.register(config)
    Handlers::GitHttp.register(config)
    Handlers::ForgeFedResources.register(config)
    Handlers::SshKeys.register(config)

    get "/health" do |env|
      env.response.content_type = "application/json"
      %({"status":"ok","service":"crater","version":"#{VERSION}"})
    end

    Kemal.config.port = config.port
    Kemal.config.host_binding = config.host

    Kemal.run
  end
end

config = Crater::Utils::Config.load

case ARGV.first?
when "authorized-keys"
  Crater::SshKeyStore.print_authorized_keys(STDOUT, config)
when "ssh-shell"
  Crater::SshGitShell.run(config, ARGV[1..])
when "git-receive-hook"
  Crater::GitReceiveHook.run(config, ARGV[1..])
else
  Crater.run
end

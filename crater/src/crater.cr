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
require "./crater/middleware/cors"
require "./crater/middleware/logger"
require "./crater/utils/config"
require "./crater/utils/actor_keys"

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
    Handlers::Status.register
    Handlers::Passkeys.register(config)
    Handlers::PrivatekeyAuth.register(config)

    # ForgeFed project endpoints
    Handlers::Projects.register(config)

    get "/health" do |env|
      env.response.content_type = "application/json"
      %({"status":"ok","service":"crater","version":"#{VERSION}"})
    end

    Kemal.config.port = config.port
    Kemal.config.host_binding = config.host

    Kemal.run
  end
end

Crater.run

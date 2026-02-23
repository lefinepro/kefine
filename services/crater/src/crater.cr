require "kemal"
require "./crater/activitypub/types"
require "./crater/forgefed/types"
require "./crater/handlers/webfinger"
require "./crater/handlers/nodeinfo"
require "./crater/handlers/actor"
require "./crater/handlers/inbox"
require "./crater/handlers/outbox"
require "./crater/handlers/projects"
require "./crater/handlers/tasks"
require "./crater/middleware/cors"
require "./crater/middleware/logger"
require "./crater/utils/config"

module Crater
  VERSION = "0.1.0"

  def self.run
    config = Utils::Config.load

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

    # ForgeFed project endpoints
    Handlers::Projects.register(config)

    # Task proxy endpoints (to Simple API)
    Handlers::Tasks.register(config)

    Kemal.config.port = config.port
    Kemal.config.host_binding = config.host

    Kemal.run
  end
end

Crater.run

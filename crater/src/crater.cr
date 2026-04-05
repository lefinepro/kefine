require "kemal"
require "./crater/activitypub/types"
require "./crater/forgefed/types"
require "./crater/handlers/webfinger"
require "./crater/handlers/nodeinfo"
require "./crater/handlers/actor"
require "./crater/handlers/inbox"
require "./crater/handlers/outbox"
require "./crater/handlers/orders"
require "./crater/handlers/payment"
require "./crater/handlers/passkeys"
require "./crater/handlers/projects"
require "./crater/handlers/templates"
require "./crater/middleware/cors"
require "./crater/middleware/logger"
require "./crater/payment_store"
require "./crater/template_store"
require "./crater/utils/config"

module Crater
  VERSION = "0.1.0"

  def self.run
    config = Utils::Config.load
    PaymentStore.setup(config)
    TemplateStore.setup(config)

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
    Handlers::Payment.register(config)
    Handlers::Passkeys.register(config)

    # ForgeFed project endpoints
    Handlers::Projects.register(config)
    Handlers::Templates.register(config)

    Kemal.config.port = config.port
    Kemal.config.host_binding = config.host

    Kemal.run
  end
end

Crater.run

require "kemal"
require "./config"
require "./handlers/webfinger"
require "./handlers/nodeinfo"
require "./handlers/actor"
require "./handlers/inbox"
require "./handlers/outbox"

module Crater
  module Server
    def self.run
      # Register all route handlers
      Handlers::WebFinger.register
      Handlers::NodeInfo.register
      Handlers::Actor.register
      Handlers::Inbox.register
      Handlers::Outbox.register

      # Health check
      get "/health" do |env|
        env.response.content_type = "application/json"
        %({"status": "ok", "service": "crater", "version": "0.1.0"})
      end

      # CORS headers for federation
      before_all do |env|
        env.response.headers["Access-Control-Allow-Origin"] = "*"
        env.response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        env.response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Signature, Digest"
      end

      Kemal.config.port = Config::PORT
      Kemal.config.env  = Config::CRYSTAL_ENV

      puts "Starting Crater on port #{Config::PORT} (#{Config::CRYSTAL_ENV})"
      puts "Base URL: #{Config::BASE_URL}"

      Kemal.run
    end
  end
end

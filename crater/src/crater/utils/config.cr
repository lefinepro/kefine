module Crater
  module Utils
    struct Config
      getter port : Int32
      getter host : String
      getter env : String
      getter domain : String
      getter actor_username : String
      getter order_queue_inbox : String
      getter log_level : String

      def initialize(
        @port : Int32,
        @host : String,
        @env : String,
        @domain : String,
        @actor_username : String,
        @order_queue_inbox : String,
        @log_level : String
      )
      end

      def self.load(env : Hash(String, String) = ENV.to_h) : Config
        new(
          port: env.fetch("PORT", "3001").to_i,
          host: env.fetch("HOST", "0.0.0.0"),
          env: env.fetch("CRYSTAL_ENV", "development"),
          domain: env.fetch("DOMAIN", "localhost:3001"),
          actor_username: env.fetch("ACTOR_USERNAME", "crater"),
          order_queue_inbox: env.fetch("ORDER_QUEUE_INBOX", "https://oq.col.pub/inbox"),
          log_level: env.fetch("LOG_LEVEL", "info")
        )
      end

      def actor_id : String
        "http://#{domain}/actor"
      end

      def actor_inbox : String
        "http://#{domain}/inbox"
      end

      def actor_outbox : String
        "http://#{domain}/outbox"
      end
    end
  end
end

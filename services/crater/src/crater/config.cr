module Crater
  module Config
    PORT        = (ENV["PORT"]? || "3001").to_i
    BASE_URL    = ENV["BASE_URL"]? || "http://localhost:#{PORT}"
    API_URL     = ENV["SIMPLE_API_URL"]? || "http://localhost:5173/api"
    ACTOR_NAME  = ENV["ACTOR_NAME"]? || "crater"
    DOMAIN      = ENV["DOMAIN"]? || "localhost:#{PORT}"
    CRYSTAL_ENV = ENV["CRYSTAL_ENV"]? || "development"
    PRIVATE_KEY = ENV["PRIVATE_KEY"]? || ""

    def self.development?
      CRYSTAL_ENV == "development"
    end

    def self.production?
      CRYSTAL_ENV == "production"
    end

    def self.actor_url
      "#{BASE_URL}/actor"
    end

    def self.inbox_url
      "#{BASE_URL}/inbox"
    end

    def self.outbox_url
      "#{BASE_URL}/outbox"
    end

    def self.shared_inbox_url
      "#{BASE_URL}/shared-inbox"
    end
  end
end

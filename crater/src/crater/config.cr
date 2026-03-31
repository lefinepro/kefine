module Crater
  module Config
    CONFIG      = Utils::Config.load
    PORT        = CONFIG.port
    BASE_URL    = CONFIG.crater_url
    ACTOR_NAME  = CONFIG.actor_username
    DOMAIN      = CONFIG.domain
    CRYSTAL_ENV = CONFIG.env
    PRIVATE_KEY = ""

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

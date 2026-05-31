require "kemal"
require "json"
require "../utils/config"

module Lepos
  module Handlers
    module NodeInfo
      def self.register(config : Utils::Config)
        get "/.well-known/nodeinfo" do |env|
          env.response.content_type = "application/json"

          {
            links: [
              {
                rel:  "http://nodeinfo.diaspora.software/ns/schema/2.0",
                href: "http://#{config.domain}/nodeinfo/2.0",
              },
            ],
          }.to_json
        end

        get "/nodeinfo/2.0" do |env|
          env.response.content_type = "application/json; profile=\"http://nodeinfo.diaspora.software/ns/schema/2.0#\""

          {
            version:  "2.0",
            software: {
              name:    "lepos",
              version: Lepos::VERSION,
            },
            protocols: ["activitypub", "forgefed"],
            services:  {inbound: [] of String, outbound: [] of String},
            usage:     {
              users:      {total: 0, activeMonth: 0, activeHalfyear: 0},
              localPosts: 0,
            },
            openRegistrations: false,
          }.to_json
        end
      end
    end
  end
end

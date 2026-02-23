require "kemal"
require "../config"

module Crater
  module Handlers
    module NodeInfo
      VERSION = "0.1.0"

      def self.register
        # NodeInfo discovery endpoint
        get "/.well-known/nodeinfo" do |env|
          env.response.content_type = "application/json"

          response = {
            "links" => [
              {
                "rel"  => "http://nodeinfo.diaspora.software/ns/schema/2.1",
                "href" => "#{Config::BASE_URL}/nodeinfo/2.1"
              }
            ]
          }

          response.to_json
        end

        # NodeInfo 2.1 endpoint
        get "/nodeinfo/2.1" do |env|
          env.response.content_type = "application/json; profile=\"http://nodeinfo.diaspora.software/ns/schema/2.1#\""

          response = {
            "version" => "2.1",
            "software" => {
              "name"       => "crater",
              "version"    => VERSION,
              "repository" => "https://github.com/kogeletey/kefine",
              "homepage"   => "https://github.com/kogeletey/kefine"
            },
            "protocols"  => ["activitypub", "forgefed"],
            "usage"      => {
              "users" => {
                "total"          => 1,
                "activeHalfyear" => 1,
                "activeMonth"    => 1
              },
              "localPosts" => 0
            },
            "openRegistrations" => false,
            "metadata" => {
              "nodeName"        => "Crater",
              "nodeDescription" => "Stateless ActivityPub/ForgeFed proxy for Kefine"
            }
          }

          response.to_json
        end
      end
    end
  end
end

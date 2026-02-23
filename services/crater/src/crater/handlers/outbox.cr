require "kemal"
require "json"
require "../activitypub/types"
require "../utils/config"

module Crater
  module Handlers
    module Outbox
      def self.register(config : Utils::Config)
        get "/outbox" do |env|
          env.response.content_type = "application/activity+json"

          page = env.params.query["page"]?

          if page
            {
              "@context"    => ActivityPub::CONTEXT,
              "id"          => "#{config.actor_outbox}?page=#{page}",
              "type"        => "OrderedCollectionPage",
              "orderedItems" => [] of JSON::Any,
              "partOf"      => config.actor_outbox,
            }.to_json
          else
            {
              "@context"   => ActivityPub::CONTEXT,
              "id"         => config.actor_outbox,
              "type"       => "OrderedCollection",
              "totalItems" => 0,
              "first"      => "#{config.actor_outbox}?page=1",
            }.to_json
          end
        end
      end
    end
  end
end

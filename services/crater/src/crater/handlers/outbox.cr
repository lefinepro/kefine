require "kemal"
require "json"
require "../config"
require "../activitypub/types"
require "../forgefed/types"
require "../utils/simple_api_client"
require "../activitypub/mapper"

module Crater
  module Handlers
    module Outbox
      def self.register
        # Main actor outbox
        get "/outbox" do |env|
          env.response.content_type = "application/activity+json"

          page = (env.params.query["page"]? || "1").to_i
          page_size = (env.params.query["page_size"]? || "20").to_i

          tickets = SimpleApiClient.fetch_tickets

          activities = tickets.map do |ticket|
            JSON.parse(ActivityPub::Mapper.task_to_create_activity(ticket))
          end

          collection = {
            "@context"   => ActivityPub::FULL_CONTEXT,
            "type"       => "OrderedCollection",
            "id"         => Config.outbox_url,
            "totalItems" => activities.size,
            "orderedItems" => paginate(activities, page, page_size)
          }

          collection.to_json
        end

        # Project outbox (ForgeFed)
        get "/projects/:id/outbox" do |env|
          env.response.content_type = "application/activity+json"

          project_id = env.params.url["id"]
          base_url   = Config::BASE_URL

          collection = {
            "@context"   => ActivityPub::FULL_CONTEXT,
            "type"       => "OrderedCollection",
            "id"         => "#{base_url}/projects/#{project_id}/outbox",
            "totalItems" => 0,
            "orderedItems" => [] of JSON::Any
          }

          collection.to_json
        end
      end

      private def self.paginate(items : Array(JSON::Any), page : Int32, page_size : Int32)
        start_idx = (page - 1) * page_size
        items[start_idx, page_size] || [] of JSON::Any
      end
    end
  end
end

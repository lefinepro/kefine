require "kemal"
require "json"
require "../order_queue"
require "../activitypub/types"
require "../utils/config"

module Crater
  module Handlers
    module Outbox
      def self.register(config : Utils::Config)
        get "/outbox" do |env|
          render_outbox(env, config)
        end

        get "/outbox/:username" do |env|
          username = env.params.url["username"]
          if username != config.actor_username
            env.response.status_code = 404
            next({error: "Actor outbox not found"}.to_json)
          end

          render_outbox(env, config)
        end
      end

      private def self.render_outbox(env, config : Utils::Config)
        env.response.content_type = "application/activity+json"

        page = env.params.query["page"]?

        if page
          parsed_page = page.to_i?
          if parsed_page.nil? || parsed_page < 1
            env.response.status_code = 400
            return({error: "Invalid page parameter"}.to_json)
          end

          activities = OrderQueue.activity_page(parsed_page)
          total_items = OrderQueue.total_items
          has_more = (parsed_page * OrderQueue::EVENT_PAGE_SIZE) < total_items

          return({
            "@context"     => ActivityPub::CONTEXT,
            "id"           => "#{config.actor_outbox}?page=#{parsed_page}",
            "type"         => "OrderedCollectionPage",
            "partOf"       => config.actor_outbox,
            "orderedItems" => activities,
            "totalItems"   => total_items,
            "first"        => "#{config.actor_outbox}?page=1",
            "next"         => has_more ? "#{config.actor_outbox}?page=#{parsed_page + 1}" : nil,
            "prev"         => parsed_page > 1 ? "#{config.actor_outbox}?page=#{parsed_page - 1}" : nil,
          }.to_json)
        end

        total_items = OrderQueue.total_items

        {
          "@context"   => ActivityPub::CONTEXT,
          "id"         => config.actor_outbox,
          "type"       => "OrderedCollection",
          "totalItems" => total_items,
          "first"      => total_items > 0 ? "#{config.actor_outbox}?page=1" : nil,
        }.to_json
      end
    end
  end
end

require "kemal"
require "json"
require "../order_queue"
require "../activitypub/types"
require "../utils/config"

module Lepos
  module Handlers
    module Outbox
      def self.register(config : Utils::Config)
        get "/outbox" do |env|
          render_outbox(env, config)
        end

        get "/actor/:username/outbox" do |env|
          render_outbox(env, config, env.params.url["username"])
        end

        get "/actors/by-key/:suffix/outbox" do |env|
          render_outbox_for_actor_uri(env, "#{config.crater_url}/actors/by-key/#{env.params.url["suffix"].downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-+|-+$/, "")}")
        end
      end

      private def self.render_outbox(env, config : Utils::Config, username_override : String? = nil)
        env.response.content_type = "application/activity+json"
        username = username_override || config.actor_username
        actor_uri = "#{config.crater_url}/actor/#{username.downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")}"
        render_outbox_for_actor_uri(env, actor_uri, username_override.nil?)
      end

      private def self.render_outbox_for_actor_uri(env, actor_uri : String, use_global_collection : Bool = false)
        env.response.content_type = "application/activity+json"

        page = env.params.query["page"]?

        if page
          parsed_page = page.to_i?
          if parsed_page.nil? || parsed_page < 1
            env.response.status_code = 400
            return({error: "Invalid page parameter"}.to_json)
          end

          activities = use_global_collection ? OrderQueue.activity_page(parsed_page) : OrderQueue.activity_page_for_actor(actor_uri, parsed_page)
          total_items = use_global_collection ? OrderQueue.total_items : OrderQueue.total_items_for_actor(actor_uri)
          has_more = (parsed_page * OrderQueue::EVENT_PAGE_SIZE) < total_items
          page_id = "#{actor_uri}/outbox?page=#{parsed_page}"
          page_payload = Aptok.ordered_collection_page(
            page_id,
            "#{actor_uri}/outbox",
            activities.compact_map(&.as_h?),
            has_more ? "#{actor_uri}/outbox?page=#{parsed_page + 1}" : nil,
            parsed_page > 1 ? "#{actor_uri}/outbox?page=#{parsed_page - 1}" : nil
          )
          page_payload["totalItems"] = Aptok.json(total_items)
          page_payload["first"] = Aptok.json("#{actor_uri}/outbox?page=1")

          return page_payload.to_json
        end

        total_items = use_global_collection ? OrderQueue.total_items : OrderQueue.total_items_for_actor(actor_uri)
        collection = Aptok.ordered_collection("#{actor_uri}/outbox", [] of Aptok::JsonMap, total_items)
        collection.delete("orderedItems")
        collection["first"] = Aptok.json("#{actor_uri}/outbox?page=1") if total_items > 0

        collection.to_json
      end
    end
  end
end

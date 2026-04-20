require "kemal"
require "json"
require "../activitypub/types"
require "../order_queue"
require "../utils/config"

module Crater
  module Handlers
    module Inbox
      ACCEPTED_TYPES = %w[Create Update]

      def self.register(config : Utils::Config)
        post "/inbox" do |env|
          handle_inbox(env, config)
        end

        # Some federated peers derive per-actor inboxes from `/actor/:username`
        # by rewriting them to `/inbox/:username`. Accept that alias so remote
        # delivery still works even when they ignore the actor document inbox URL.
        post "/inbox/:username" do |env|
          handle_inbox(env, config)
        end

        post "/actor/:username/inbox" do |env|
          handle_inbox(env, config)
        end

        post "/actors/by-key/:suffix/inbox" do |env|
          handle_inbox(env, config)
        end
      end

      private def self.handle_inbox(env, config : Utils::Config)
        body = env.request.body.try(&.gets_to_end) || ""

        activity = begin
          ActivityPub::Activity.from_json(body)
        rescue JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid JSON body"}.to_json)
        end

        env.response.content_type = "application/json"

        order = begin
          accept_activity(activity, config)
        rescue ex : OrderQueue::Error::InvalidActivity
          env.response.status_code = 400
          return({error: ex.message}.to_json)
        rescue ex : Exception
          env.response.status_code = 500
          return({error: "Failed to queue order", reason: ex.message}.to_json)
        end

        env.response.status_code = 202
        {
          accepted: true,
          orderId: order.id,
          status: order.status,
          solver: order.solver,
          uiScenario: order.ui_scenario
        }.to_json
      end

      def self.accept_activity(activity : ActivityPub::Activity, config : Utils::Config) : OrderQueue::OrderRecord
        unless ACCEPTED_TYPES.includes?(activity.type)
          raise OrderQueue::Error::InvalidActivity.new("Unknown activity type: #{activity.type}")
        end

        # TODO: Verify HTTP Signature before processing
        case activity.type
        when "Create"
          OrderQueue.receive_create(activity, config)
        when "Update"
          OrderQueue.submit_update(activity, config)
        else
          raise OrderQueue::Error::InvalidActivity.new("Unknown activity type: #{activity.type}")
        end
      end
    end
  end
end

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
          body = env.request.body.try(&.gets_to_end) || ""

          activity = begin
            ActivityPub::Activity.from_json(body)
          rescue JSON::ParseException
            env.response.status_code = 400
            next({error: "Invalid JSON body"}.to_json)
          end

          env.response.content_type = "application/json"

          order = begin
            accept_activity(activity, config)
          rescue ex : OrderQueue::Error::InvalidActivity
            env.response.status_code = 400
            next({error: ex.message}.to_json)
          rescue ex : Exception
            env.response.status_code = 500
            next({error: "Failed to queue order", reason: ex.message}.to_json)
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

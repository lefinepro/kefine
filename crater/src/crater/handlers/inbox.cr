require "kemal"
require "json"
require "http/client"
require "../activitypub/types"
require "../order_queue"
require "../utils/config"

module Crater
  module Handlers
    module Inbox
      ACCEPTED_TYPES = %w[Create]

      def self.register(config : Utils::Config)
        post "/inbox" do |env|
          body = env.request.body.try(&.gets_to_end) || ""

          activity = begin
            ActivityPub::Activity.from_json(body)
          rescue JSON::ParseException
            env.response.status_code = 400
            next({error: "Invalid JSON body"}.to_json)
          end

          unless ACCEPTED_TYPES.includes?(activity.type)
            env.response.status_code = 400
            next({error: "Unknown activity type: #{activity.type}"}.to_json)
          end

          # TODO: Verify HTTP Signature before processing
          order = begin
            OrderQueue.submit_create(activity, config)
          rescue ex : Exception
            env.response.status_code = 500
            next({error: "Failed to queue order", reason: ex.message}.to_json)
          end

          target = config.order_queue_inbox
          if !target.empty? && target != config.actor_inbox
              spawn do
                forward_to_order_queue(target, body)
              end
            end

          env.response.status_code = 202
          {
            accepted: true,
            orderId: order.id,
            status: order.status,
            solver: order.solver,
            uiScenario: order.ui_scenario,
            paymentUrl: order.payment_url
          }.to_json
        end
      end

      private def self.forward_to_order_queue(target : String, payload : String) : Nil
        return if target.empty?

        headers = HTTP::Headers{
          "Content-Type" => "application/activity+json",
          "Accept"       => "application/activity+json",
        }

        HTTP::Client.post(target, headers: headers, body: payload)
      rescue
        # Intentionally ignore forwarding failures while keeping local queue operational
      end
    end
  end
end

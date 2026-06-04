require "kemal"
require "json"
require "log"
require "../aptok"
require "../order_queue"
require "../relay_service"
require "../utils/config"

module Lepos
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
          handle_inbox(env, config, env.params.url["username"])
        end

        post "/actor/:username/inbox" do |env|
          handle_inbox(env, config, env.params.url["username"])
        end

        post "/actors/by-key/:suffix/inbox" do |env|
          handle_inbox(env, config)
        end
      end

      private def self.handle_inbox(env, config : Utils::Config, username : String? = nil)
        body = env.request.body.try(&.gets_to_end) || ""

        activity_json = begin
          RelayService.json_map_from_body(body)
        rescue JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid JSON body"}.to_json)
        end

        env.response.content_type = "application/json"

        if relay_control_for_recipient?(activity_json, username, config)
          return handle_relay_control(env, activity_json, config)
        end

        activity = begin
          AptokPayload.activity_from_json(body)
        rescue JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid JSON body"}.to_json)
        end

        order = begin
          accept_activity(activity, config)
        rescue ex : OrderQueue::Error::InvalidActivity
          if RelayService.relayable_public_activity?(activity_json)
            return handle_relay_fanout(env, activity_json, config)
          end

          env.response.status_code = 400
          return({error: ex.message}.to_json)
        rescue ex : Exception
          env.response.status_code = 500
          return({error: "Failed to queue order", reason: ex.message}.to_json)
        end

        env.response.status_code = 202
        {
          accepted:        true,
          orderId:         order.id,
          status:          order.status,
          solver:          order.solver,
          uiScenario:      order.ui_scenario,
          relayDeliveries: relay_public_activity(activity_json, config),
        }.to_json
      end

      def self.accept_activity(activity : Aptok::Vocab::Activity, config : Utils::Config) : OrderQueue::OrderRecord
        activity_type = activity.type || ""
        unless ACCEPTED_TYPES.includes?(activity_type)
          raise OrderQueue::Error::InvalidActivity.new("Unknown activity type: #{activity_type}")
        end

        # TODO: Verify HTTP Signature before processing
        case activity_type
        when "Create"
          OrderQueue.receive_create(activity, config)
        when "Update"
          OrderQueue.submit_update(activity, config)
        else
          raise OrderQueue::Error::InvalidActivity.new("Unknown activity type: #{activity_type}")
        end
      end

      private def self.relay_control_for_recipient?(activity : Aptok::JsonMap, username : String?, config : Utils::Config) : Bool
        return false unless RelayService.control_activity?(activity, config)
        return true if username && normalized_username(username.not_nil!) == config.relay_actor_username

        RelayService.addressed_to_relay?(activity, config)
      end

      private def self.handle_relay_control(env, activity : Aptok::JsonMap, config : Utils::Config)
        result = RelayService.handle_control(activity, config)
        env.response.status_code = result.outcome.unresolvable? ? 400 : 202
        {
          accepted: true,
          relay:    true,
          outcome:  result.outcome.to_s,
          protocol: result.protocol.try(&.to_s),
          actor:    result.actor,
          sent:     result.sent.size,
        }.to_json
      rescue ex : Exception
        Log.warn(exception: ex) { "[inbox:relay] failed to handle relay control activity" }
        env.response.status_code = 502
        {error: "Failed to handle relay activity", reason: ex.message}.to_json
      end

      private def self.handle_relay_fanout(env, activity : Aptok::JsonMap, config : Utils::Config)
        deliveries = relay_public_activity(activity, config)
        env.response.status_code = 202
        {
          accepted:        true,
          relay:           true,
          relayDeliveries: deliveries,
        }.to_json
      end

      private def self.relay_public_activity(activity : Aptok::JsonMap, config : Utils::Config) : Int32
        return 0 unless RelayService.relayable_public_activity?(activity)

        RelayService.relay_activity(activity, config).size
      rescue ex
        Log.warn(exception: ex) { "[inbox:relay] failed to relay public activity" }
        0
      end

      private def self.normalized_username(value : String) : String
        normalized = value.downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
        normalized.empty? ? "staff" : normalized
      end
    end
  end
end

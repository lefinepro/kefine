require "kemal"
require "json"
require "log"
require "../aptok"
require "../relay_service"
require "../utils/config"

module Lepos
  module Handlers
    module Relay
      def self.register(config : Utils::Config)
        get "/relay" do |env|
          env.response.content_type = "application/activity+json"
          AptokPayload.relay_actor_json(config).to_json
        end

        post "/relay/inbox" do |env|
          handle_relay_inbox(env, config)
        end

        get "/relay/followers" do |env|
          render_followers(env, config)
        end

        get "/actor/:username/followers" do |env|
          username = normalized_username(env.params.url["username"])
          if username == config.relay_actor_username
            render_followers(env, config)
          else
            env.response.status_code = 404
            {error: "Unknown followers collection"}.to_json
          end
        end

        get "/api/relay" do |env|
          env.response.content_type = "application/json"
          RelayService.metadata(config).to_json
        end
      end

      private def self.handle_relay_inbox(env, config : Utils::Config)
        env.response.content_type = "application/json"
        body = env.request.body.try(&.gets_to_end) || ""
        activity = begin
          RelayService.json_map_from_body(body)
        rescue JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid JSON body"}.to_json)
        end

        if RelayService.control_activity?(activity, config)
          result = RelayService.handle_control(activity, config)
          env.response.status_code = result.outcome.unresolvable? ? 400 : 202
          return({
            accepted: true,
            relay:    true,
            outcome:  result.outcome.to_s,
            protocol: result.protocol.try(&.to_s),
            actor:    result.actor,
            sent:     result.sent.size,
          }.to_json)
        end

        unless RelayService.relayable_public_activity?(activity)
          env.response.status_code = 400
          return({error: "Activity is not a relay control or public relayable activity"}.to_json)
        end

        deliveries = RelayService.relay_activity(activity, config).size
        env.response.status_code = 202
        {
          accepted:        true,
          relay:           true,
          relayDeliveries: deliveries,
        }.to_json
      rescue ex : Exception
        Log.warn(exception: ex) { "[relay:inbox] failed to process relay inbox activity" }
        env.response.status_code = 502
        {error: "Failed to process relay inbox activity", reason: ex.message}.to_json
      end

      private def self.render_followers(env, config : Utils::Config)
        env.response.content_type = "application/activity+json"
        RelayService.followers_collection(config).to_json
      rescue ex : Exception
        Log.warn(exception: ex) { "[relay:followers] failed to render relay followers" }
        env.response.status_code = 502
        {error: "Failed to render relay followers", reason: ex.message}.to_json
      end

      private def self.normalized_username(value : String) : String
        normalized = value.downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
        normalized.empty? ? "staff" : normalized
      end
    end
  end
end

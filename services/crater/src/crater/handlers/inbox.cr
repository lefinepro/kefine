require "kemal"
require "json"
require "../activitypub/types"
require "../utils/config"

module Crater
  module Handlers
    module Inbox
      ACCEPTED_TYPES = %w[Create Update Delete Follow Accept Reject]

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
          # TODO: Forward relevant activities to Simple API

          env.response.status_code = 202
          {accepted: true, type: activity.type}.to_json
        end
      end
    end
  end
end

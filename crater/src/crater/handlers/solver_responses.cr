require "kemal"
require "json"
require "log"
require "../solver_responses"
require "../utils/config"

module Lepos
  module Handlers
    # `POST /api/responses` — the return path for solver services. A solver
    # processes the message relayed to its inbox and posts the result here
    # (OpenAI Responses shape for the initial provider), authenticated with its
    # bearer token. The platform owns the processing layer: it authenticates the
    # solver, normalizes the response, and builds a relayable result activity.
    module SolverResponses
      def self.register(config : Utils::Config)
        post "/api/responses" do |env|
          handle_responses(env, config)
        end
      end

      private def self.handle_responses(env, config : Utils::Config)
        env.response.content_type = "application/json"

        solver = Lepos::SolverResponses.authenticate(config, env.request.headers["Authorization"]?)
        unless solver
          env.response.status_code = 401
          return({error: "Unknown or missing solver token"}.to_json)
        end

        body = env.request.body.try(&.gets_to_end) || ""
        payload = begin
          Lepos::SolverResponses.parse_payload(body)
        rescue JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid JSON body"}.to_json)
        end

        result = Lepos::SolverResponses.build_result(payload, solver, config)
        env.response.status_code = 202
        result.to_json
      rescue ex : ::CraterOpenAI::ValidationError
        env.response.status_code = 400
        {error: "Invalid OpenAI Responses payload", reason: ex.message}.to_json
      rescue ex : Exception
        Log.warn(exception: ex) { "[solver:responses] failed to process solver response" }
        env.response.status_code = 502
        {error: "Failed to process solver response", reason: ex.message}.to_json
      end
    end
  end
end

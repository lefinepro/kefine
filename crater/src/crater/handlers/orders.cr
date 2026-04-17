require "kemal"
require "json"
require "log"
require "../order_queue"
require "../activitypub/types"
require "./inbox"
require "../utils/config"

module Crater
  module Handlers
    module Orders
      def self.register(config : Utils::Config)
        post "/create" do |env|
          env.response.content_type = "application/json"
          create_order(env, config)
        end

        post "/api/create" do |env|
          env.response.content_type = "application/json"
          create_order(env, config)
        end
      end

      private def self.create_order(env, config : Utils::Config)
        request_id = Random::Secure.hex(6)
        payload = begin
          read_create_payload(env)
        rescue ex : JSON::ParseException
          Log.warn { "[orders:create #{request_id}] invalid JSON payload: #{ex.message}" }
          env.response.status_code = 400
          return({error: "Invalid request body", reason: ex.message}.to_json)
        end

        payload_object = payload.as_h? || {} of String => JSON::Any
        Log.info do
          "[orders:create #{request_id}] title=#{(payload_object["title"]? || payload_object["name"]?).try(&.as_s?) || "-"} " \
          "uiScenario=#{payload_object["uiScenario"]?.try(&.as_s?) || "-"} " \
          "ownerProfileId=#{payload_object["ownerProfileId"]?.try(&.as_s?) || "-"} " \
          "actorHandle=#{payload_object["actorHandle"]?.try(&.as_s?) || "-"}"
        end

        record = begin
          OrderQueue.submit_rest(payload, config)
        rescue ex : OrderQueue::BadRequest
          Log.warn { "[orders:create #{request_id}] bad request: #{ex.message}" }
          env.response.status_code = 400
          return({error: ex.message}.to_json)
        rescue ex : OrderQueue::Error::InvalidActivity
          Log.warn { "[orders:create #{request_id}] invalid activity: #{ex.message}" }
          env.response.status_code = 400
          return({error: ex.message}.to_json)
        rescue ex : OrderQueue::DeliveryFailed
          Log.error { "[orders:create #{request_id}] exchange delivery failed: #{ex.message}" }
          env.response.status_code = 502
          return({error: "Failed to deliver order to exchange", reason: ex.message}.to_json)
        rescue ex : Exception
          Log.error(exception: ex) { "[orders:create #{request_id}] unexpected failure" }
          env.response.status_code = 500
          return({error: "Failed to create order", reason: ex.message}.to_json)
        end

        Log.info do
          "[orders:create #{request_id}] accepted orderId=#{record.id} status=#{record.status} " \
          "solver=#{record.solver_name || record.solver} actorHandle=#{record.actor_handle || "-"}"
        end

        env.response.status_code = 202
        {
          accepted: true,
          orderId: record.id,
          status: record.status,
          solver: record.solver,
          solverName: record.solver_name,
          solverHandle: record.solver_handle,
          solverProfileUrl: record.solver_profile_url,
          ownerProfileId: record.owner_profile_id,
          ownerUsername: record.owner_username,
          ownerDisplayName: record.owner_display_name,
          actorHandle: record.actor_handle,
          actorDid: record.actor_did,
          uiScenario: record.ui_scenario
        }.to_json
      end

      private def self.read_create_payload(env) : JSON::Any
        content_type = env.request.headers["Content-Type"]?.to_s
        if content_type.starts_with?("multipart/form-data")
          return read_multipart_payload(env)
        end

        body = env.request.body.try(&.gets_to_end) || ""
        JSON.parse(body)
      end

      private def self.read_multipart_payload(env) : JSON::Any
        params = env.params.body
        files = env.params.files.values

        attachment_items = files.map do |file|
          media_type = file.headers["Content-Type"]?.to_s
          media_type = "application/octet-stream" if media_type.nil? || media_type.empty?
          {
            "type" => "Document",
            "name" => file.filename.to_s,
            "mediaType" => media_type,
            "size" => file.size.try(&.to_i64) || 0_i64,
          }
        end

        payload = {} of String => String | Int64 | Array(String) | Array(Hash(String, String | Int64))
        add_string_field(payload, "name", params["name"]?)
        add_string_field(payload, "title", params["title"]?)
        add_string_field(payload, "content", params["content"]?)
        add_string_field(payload, "description", params["description"]?)
        add_string_field(payload, "estimatedCost", params["estimatedCost"]?)
        add_string_field(payload, "currency", params["currency"]?)
        add_string_field(payload, "executionEstimate", params["executionEstimate"]?)
        add_string_field(payload, "uiScenario", params["uiScenario"]?)
        add_string_field(payload, "ownerProfileId", params["ownerProfileId"]?)
        add_string_field(payload, "ownerUsername", params["ownerUsername"]?)
        add_string_field(payload, "ownerDisplayName", params["ownerDisplayName"]?)
        add_string_field(payload, "actorHandle", params["actorHandle"]?)
        add_string_field(payload, "actorDid", params["actorDid"]?)

        labels = parse_json_array(params["labels"]?)
        payload["labels"] = labels unless labels.empty?
        payload["attachment"] = attachment_items unless attachment_items.empty?

        JSON.parse(payload.to_json)
      end

      private def self.add_string_field(payload, key : String, value : String?) : Nil
        return if value.nil? || value.empty?

        payload[key] = value
      end

      private def self.parse_json_array(raw : String?) : Array(String)
        return [] of String if raw.nil? || raw.empty?

        JSON.parse(raw).as_a.compact_map(&.as_s?)
      rescue
        return [] of String if raw.nil?
        raw.split(',').map(&.strip).reject(&.empty?)
      end
    end
  end
end

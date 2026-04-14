require "kemal"
require "json"
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

        get "/status/:id" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next render_status(env, order_id)
        end

        get "/api/status/:id" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next render_status(env, order_id)
        end

        get "/status" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.query["id"]? || env.params.query["orderId"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next render_status(env, order_id)
        end

        get "/api/status" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.query["id"]? || env.params.query["orderId"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next render_status(env, order_id)
        end

        get "/pay/:id" do |env|
          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          record = OrderQueue.find_order(order_id)
          if record.nil?
            env.response.status_code = 404
            next({error: "Order not found", orderId: order_id}.to_json)
          end

          target = record.payment_url || "#{config.exchange_url}/pay/#{URI.encode_path(order_id)}"
          env.redirect(target)
        end

        get "/api/pay/:id" do |env|
          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          record = OrderQueue.find_order(order_id)
          if record.nil?
            env.response.status_code = 404
            next({error: "Order not found", orderId: order_id}.to_json)
          end

          target = record.payment_url || "#{config.exchange_url}/pay/#{URI.encode_path(order_id)}"
          env.redirect(target)
        end
      end

      private def self.create_order(env, config : Utils::Config)
        payload = begin
          read_create_payload(env)
        rescue ex : JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid request body", reason: ex.message}.to_json)
        end

        record = begin
          activity = OrderQueue.activity_for_payload(payload, config)
          Handlers::Inbox.accept_activity(activity, config)
        rescue ex : OrderQueue::BadRequest
          env.response.status_code = 400
          return({error: ex.message}.to_json)
        rescue ex : OrderQueue::Error::InvalidActivity
          env.response.status_code = 400
          return({error: ex.message}.to_json)
        rescue ex : Exception
          env.response.status_code = 500
          return({error: "Failed to create order", reason: ex.message}.to_json)
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
          uiScenario: record.ui_scenario,
          paymentUrl: record.payment_url
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

      private def self.render_status(env, order_id : String) : String
        latest_activity = OrderQueue.latest_by_order(order_id)
        return latest_activity.to_json unless latest_activity.nil?

        record = OrderQueue.find_order(order_id)
        if record.nil?
          env.response.status_code = 404
          return({error: "Order not found", orderId: order_id}.to_json)
        end

        {
          orderId: record.id,
          status: record.status,
          solver: record.solver,
          solverName: record.solver_name,
          solverHandle: record.solver_handle,
          solverProfileUrl: record.solver_profile_url,
          title: record.title,
          description: record.description || "",
          estimatedCost: record.estimated_cost,
          currency: record.currency,
          executionEstimate: record.execution_estimate,
          uiScenario: record.ui_scenario,
          labels: record.labels,
          paymentUrl: record.payment_url,
          templateId: record.template_id,
          templateSlug: record.template_slug,
          templateAuthorProfileId: record.template_author_profile_id,
          templateAuthorUsername: record.template_author_username,
          templateAuthorDisplayName: record.template_author_display_name,
          templatePricingMode: record.template_pricing_mode,
          templatePricingValue: record.template_pricing_value,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        }.to_json
      end
    end
  end
end

require "kemal"
require "json"
require "http/client"
require "../order_queue"
require "../utils/config"

module Crater
  module Handlers
    module Orders
      def self.register(config : Utils::Config)
        post "/create" do |env|
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

          record = OrderQueue.find_order(order_id)
          if record.nil?
            env.response.status_code = 404
            next({error: "Order not found", orderId: order_id}.to_json)
          end

          {
            orderId: record.id,
            status: record.status,
            solver: record.solver,
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

        get "/status" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.query["id"]? || env.params.query["orderId"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          record = OrderQueue.find_order(order_id)
          if record.nil?
            env.response.status_code = 404
            next({error: "Order not found", orderId: order_id}.to_json)
          end

          {
            orderId: record.id,
            status: record.status,
            solver: record.solver,
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
      end

      private def self.create_order(env, config : Utils::Config)
        payload = begin
          read_create_payload(env)
        rescue ex : JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid request body", reason: ex.message}.to_json)
        end

        record = begin
          OrderQueue.submit_rest(payload, config)
        rescue ex : OrderQueue::BadRequest
          env.response.status_code = 400
          return({error: ex.message}.to_json)
        rescue ex : Exception
          env.response.status_code = 500
          return({error: "Failed to create order", reason: ex.message}.to_json)
        end

        target = config.order_queue_inbox
        if !target.empty? && target != config.actor_inbox
          spawn do
            forward_to_order_queue(target, OrderQueue.activity_for(record, record.status, config).to_json)
          end
        end

        env.response.status_code = 202
        {
          accepted: true,
          orderId: record.id,
          status: record.status,
          solver: record.solver,
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

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
            paymentUrl: record.payment_url,
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
            paymentUrl: record.payment_url,
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
        body = env.request.body.try(&.gets_to_end) || ""

        payload = begin
          JSON.parse(body)
        rescue JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid JSON body"}.to_json)
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

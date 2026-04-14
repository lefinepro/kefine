require "kemal"
require "json"

require "../order_queue"
require "../payment_store"
require "../utils/config"

module Crater
  module Handlers
    module Payment
      def self.register(config : Utils::Config)
        get "/payment-config" do |env|
          env.response.content_type = "application/json"
          PaymentStore.to_config_payload(config)
        end

        get "/api/payment-config" do |env|
          env.response.content_type = "application/json"
          PaymentStore.to_config_payload(config)
        end

        get "/payment/:id" do |env|
          env.response.content_type = "application/json"

          order = find_order(env.params.url["id"]?)
          next missing_order_response(env) unless order

          quote = PaymentStore.quote_for(order, config)
          PaymentStore.to_json_payload(order, quote)
        end

        get "/api/payment/:id" do |env|
          env.response.content_type = "application/json"

          order = find_order(env.params.url["id"]?)
          next missing_order_response(env) unless order

          quote = PaymentStore.quote_for(order, config)
          PaymentStore.to_json_payload(order, quote)
        end

        post "/payment/:id/promo" do |env|
          env.response.content_type = "application/json"

          order = find_order(env.params.url["id"]?)
          next missing_order_response(env) unless order

          body = begin
            JSON.parse(env.request.body.try(&.gets_to_end) || "")
          rescue JSON::ParseException
            env.response.status_code = 400
            next({error: "Invalid JSON body"}.to_json)
          end

          payload = body.as_h? || {} of String => JSON::Any
          promo_code = payload["code"]?.try(&.as_s?)
          subject = payload["subject"]?.try(&.as_s?)
          quote = PaymentStore.quote_for(order, config, promo_code, subject)

          PaymentStore.to_json_payload(order, quote)
        end

        post "/api/payment/:id/promo" do |env|
          env.response.content_type = "application/json"

          order = find_order(env.params.url["id"]?)
          next missing_order_response(env) unless order

          body = begin
            JSON.parse(env.request.body.try(&.gets_to_end) || "")
          rescue JSON::ParseException
            env.response.status_code = 400
            next({error: "Invalid JSON body"}.to_json)
          end

          payload = body.as_h? || {} of String => JSON::Any
          promo_code = payload["code"]?.try(&.as_s?)
          subject = payload["subject"]?.try(&.as_s?)
          quote = PaymentStore.quote_for(order, config, promo_code, subject)

          PaymentStore.to_json_payload(order, quote)
        end
      end

      private def self.find_order(order_id : String?) : OrderQueue::OrderRecord?
        return nil if order_id.nil? || order_id.empty?

        OrderQueue.find_order(order_id)
      end

      private def self.missing_order_response(env)
        env.response.status_code = 404
        {error: "Order not found"}.to_json
      end
    end
  end
end

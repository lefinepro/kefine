require "kemal"
require "json"
require "../order_queue"

module Crater
  module Handlers
    module Status
      def self.register
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
      end

      private def self.render_status(env, order_id : String) : String
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
          templateId: record.template_id,
          templateSlug: record.template_slug,
          templateAuthorProfileId: record.template_author_profile_id,
          templateAuthorUsername: record.template_author_username,
          templateAuthorDisplayName: record.template_author_display_name,
          templatePricingMode: record.template_pricing_mode,
          templatePricingValue: record.template_pricing_value,
          ownerProfileId: record.owner_profile_id,
          ownerUsername: record.owner_username,
          ownerDisplayName: record.owner_display_name,
          actorHandle: record.actor_handle,
          actorDid: record.actor_did,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        }.to_json
      end
    end
  end
end

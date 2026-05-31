require "kemal"
require "json"
require "log"
require "../order_queue"
require "../repository_store"
require "../utils/config"

module Crater
  module Handlers
    module Status
      def self.register(config : Utils::Config = Utils::Config.load)
        get "/status/:id" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next render_status(env, order_id, config)
        end

        get "/api/status/:id" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next render_status(env, order_id, config)
        end

        get "/status" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.query["id"]? || env.params.query["orderId"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next render_status(env, order_id, config)
        end

        get "/api/status" do |env|
          env.response.content_type = "application/json"

          order_id = env.params.query["id"]? || env.params.query["orderId"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next render_status(env, order_id, config)
        end

        patch "/status/:id/document" do |env|
          env.response.content_type = "application/json"
          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next update_document(env, order_id, config)
        end

        patch "/api/status/:id/document" do |env|
          env.response.content_type = "application/json"
          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next update_document(env, order_id, config)
        end

        patch "/status/:id/settings" do |env|
          env.response.content_type = "application/json"
          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next update_settings(env, order_id, config)
        end

        patch "/api/status/:id/settings" do |env|
          env.response.content_type = "application/json"
          order_id = env.params.url["id"]?
          if order_id.nil? || order_id.empty?
            env.response.status_code = 400
            next({error: "Missing order id"}.to_json)
          end

          next update_settings(env, order_id, config)
        end
      end

      private def self.render_status(env, order_id : String, config : Utils::Config) : String
        record = OrderQueue.find_order(order_id, config)
        if record.nil?
          Log.warn { "[status] order not found id=#{order_id}" }
          env.response.status_code = 404
          return({error: "Order not found", orderId: order_id}.to_json)
        end

        document = begin
          JSON.parse(record.document_json || %({"format":"markdown","content":""}))
        rescue
          JSON.parse(%({"format":"markdown","content":""}))
        end
        activities = OrderQueue.activities_for_order(record.id, config)
        existing_repository = config.repositories_enabled ? RepositoryStore.find_by_order(record.id, config) : nil
        vcs_enabled = config.repositories_enabled && (record.vcs_enabled || !existing_repository.nil?)
        repository = if vcs_enabled
                       begin
                         existing_repository || RepositoryStore.ensure_for_order(record, config)
                       rescue ex
                         Log.error(exception: ex) { "[status] failed to load repository for orderId=#{record.id}" }
                         nil
                       end
                     end
        Log.info do
          "[status] orderId=#{record.id} status=#{record.status} solver=#{record.solver_name || record.solver} " \
          "activities=#{activities.size} updatedAt=#{record.updated_at}"
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
          isPublicTask: record.is_public_task,
          vcsEnabled: vcs_enabled,
          document: document,
          activities: activities,
          projectId: repository.try(&.project_id),
          repository: repository ? RepositoryStore.to_json_payload(repository) : nil,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        }.to_json
      end

      private def self.update_document(env, order_id : String, config : Utils::Config) : String
        payload = begin
          body = env.request.body.try(&.gets_to_end) || ""
          JSON.parse(body)
        rescue ex : JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid request body", reason: ex.message}.to_json)
        end

        document = payload.as_h?.try(&.["document"]?) || payload
        record = OrderQueue.update_document(order_id, document, config)
        if record.nil?
          env.response.status_code = 404
          return({error: "Order not found", orderId: order_id}.to_json)
        end

        if config.repositories_enabled
          begin
            repository = RepositoryStore.find_by_order(record.id, config) || RepositoryStore.ensure_for_order(record, config)
            content = JSON.parse(record.document_json || %({"format":"markdown","content":""})).as_h?.try(&.["content"]?).try(&.as_s?) || ""
            actor = record.actor_handle || record.owner_username || config.actor_username
            RepositoryStore.commit_plan_document(repository, actor, content, config) unless content.empty?
          rescue ex
            Log.error(exception: ex) { "[status] failed to persist PLAN.org for orderId=#{record.id}" }
          end
        end

        render_status(env, record.id, config)
      end

      private def self.update_settings(env, order_id : String, config : Utils::Config) : String
        payload = begin
          body = env.request.body.try(&.gets_to_end) || ""
          JSON.parse(body)
        rescue ex : JSON::ParseException
          env.response.status_code = 400
          return({error: "Invalid request body", reason: ex.message}.to_json)
        end

        requested_vcs_enabled = payload.as_h?.try(&.["vcsEnabled"]?).try(&.as_bool?)
        vcs_enabled = if config.repositories_enabled
                        requested_vcs_enabled
                      elsif requested_vcs_enabled.nil?
                        nil
                      else
                        false
                      end
        is_public_task = payload.as_h?.try(&.["isPublicTask"]?).try(&.as_bool?)
        git_settings_payload = config.repositories_enabled ? payload.as_h?.try(&.["gitSettings"]?) : nil
        record = OrderQueue.update_settings(order_id, vcs_enabled, is_public_task, config)
        if record.nil?
          env.response.status_code = 404
          return({error: "Order not found", orderId: order_id}.to_json)
        end

        repository = config.repositories_enabled ? RepositoryStore.find_by_order(record.id, config) : nil
        if config.repositories_enabled && record.vcs_enabled
          begin
            repository = RepositoryStore.ensure_for_order(record, config)
          rescue ex
            Log.error(exception: ex) { "[status] failed to initialize repository for orderId=#{record.id} after enabling vcs" }
          end
        end

        if repository && git_settings_payload
          begin
            RepositoryStore.update_git_settings(
              repository,
              RepositoryStore::GitSettings.from_json(git_settings_payload.to_json),
              config
            )
          rescue ex
            Log.error(exception: ex) { "[status] failed to update git settings for orderId=#{record.id}" }
          end
        end

        render_status(env, record.id, config)
      end
    end
  end
end

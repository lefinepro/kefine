require "kemal"
require "json"
require "../template_store"
require "../utils/config"

module Crater
  module Handlers
    module Templates
      def self.register(config : Utils::Config)
        get "/templates" do |env|
          env.response.content_type = "application/json"
          limit = env.params.query["limit"]?.try(&.to_i?) || 24
          normalized_limit = limit.clamp(1, 48)
          TemplateStore.list_public(config, normalized_limit).map { |item| JSON.parse(TemplateStore.to_json(item)) }.to_json
        end

        get "/api/templates" do |env|
          env.response.content_type = "application/json"
          limit = env.params.query["limit"]?.try(&.to_i?) || 24
          normalized_limit = limit.clamp(1, 48)
          TemplateStore.list_public(config, normalized_limit).map { |item| JSON.parse(TemplateStore.to_json(item)) }.to_json
        end

        get "/templates/:handle" do |env|
          env.response.content_type = "application/json"
          handle = env.params.url["handle"]?.to_s
          TemplateStore.list_by_handle(config, handle).map { |item| JSON.parse(TemplateStore.to_json(item)) }.to_json
        end

        get "/api/templates/:handle" do |env|
          env.response.content_type = "application/json"
          handle = env.params.url["handle"]?.to_s
          TemplateStore.list_by_handle(config, handle).map { |item| JSON.parse(TemplateStore.to_json(item)) }.to_json
        end

        get "/templates/:handle/:slug" do |env|
          env.response.content_type = "application/json"
          handle = env.params.url["handle"]?.to_s
          slug = env.params.url["slug"]?.to_s
          record = TemplateStore.find_by_handle_and_slug(config, handle, slug)
          if record.nil?
            env.response.status_code = 404
            next({error: "Template not found"}.to_json)
          end

          TemplateStore.to_json(record)
        end

        get "/api/templates/:handle/:slug" do |env|
          env.response.content_type = "application/json"
          handle = env.params.url["handle"]?.to_s
          slug = env.params.url["slug"]?.to_s
          record = TemplateStore.find_by_handle_and_slug(config, handle, slug)
          if record.nil?
            env.response.status_code = 404
            next({error: "Template not found"}.to_json)
          end

          TemplateStore.to_json(record)
        end

        get "/services" do |env|
          env.response.content_type = "application/json"
          limit = env.params.query["limit"]?.try(&.to_i?) || 24
          normalized_limit = limit.clamp(1, 48)
          TemplateStore.list_public(config, normalized_limit).map { |item| JSON.parse(TemplateStore.to_json(item)) }.to_json
        end

        get "/services/:slug" do |env|
          env.response.content_type = "application/json"
          slug = env.params.url["slug"]?.to_s
          record = TemplateStore.find_by_handle_and_slug(config, config.actor_username, slug)
          if record.nil?
            env.response.status_code = 404
            next({error: "Service not found"}.to_json)
          end

          TemplateStore.to_json(record)
        end

        get "/api/services" do |env|
          env.response.content_type = "application/json"
          limit = env.params.query["limit"]?.try(&.to_i?) || 24
          normalized_limit = limit.clamp(1, 48)
          TemplateStore.list_public(config, normalized_limit).map { |item| JSON.parse(TemplateStore.to_json(item)) }.to_json
        end

        get "/api/services/:slug" do |env|
          env.response.content_type = "application/json"
          slug = env.params.url["slug"]?.to_s
          record = TemplateStore.find_by_handle_and_slug(config, config.actor_username, slug)
          if record.nil?
            env.response.status_code = 404
            next({error: "Service not found"}.to_json)
          end

          TemplateStore.to_json(record)
        end

        post "/templates" do |env|
          env.response.content_type = "application/json"
          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}")
          TemplateStore.to_json(TemplateStore.upsert(config, payload))
        end

        post "/api/templates" do |env|
          env.response.content_type = "application/json"
          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}")
          TemplateStore.to_json(TemplateStore.upsert(config, payload))
        end

        post "/services" do |env|
          env.response.content_type = "application/json"
          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}")
          TemplateStore.to_json(TemplateStore.upsert(config, payload))
        end

        post "/api/services" do |env|
          env.response.content_type = "application/json"
          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}")
          TemplateStore.to_json(TemplateStore.upsert(config, payload))
        end

        put "/templates" do |env|
          env.response.content_type = "application/json"
          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}")
          TemplateStore.to_json(TemplateStore.upsert(config, payload))
        end

        put "/api/templates" do |env|
          env.response.content_type = "application/json"
          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}")
          TemplateStore.to_json(TemplateStore.upsert(config, payload))
        end

        put "/services" do |env|
          env.response.content_type = "application/json"
          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}")
          TemplateStore.to_json(TemplateStore.upsert(config, payload))
        end

        put "/api/services" do |env|
          env.response.content_type = "application/json"
          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}")
          TemplateStore.to_json(TemplateStore.upsert(config, payload))
        end

        delete "/templates/:id" do |env|
          env.response.content_type = "application/json"
          TemplateStore.delete(config, env.params.url["id"]?.to_s || "")
          {deleted: true}.to_json
        end

        delete "/api/templates/:id" do |env|
          env.response.content_type = "application/json"
          TemplateStore.delete(config, env.params.url["id"]?.to_s || "")
          {deleted: true}.to_json
        end
      end
    end
  end
end

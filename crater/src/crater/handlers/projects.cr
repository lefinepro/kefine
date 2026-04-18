require "kemal"
require "json"
require "../order_queue"
require "../repository_store"
require "../utils/config"

module Crater
  module Handlers
    module Projects
      def self.register(config : Utils::Config)
        get "/projects" do |env|
          env.response.content_type = "application/json"

          projects = RepositoryStore.list(config).map do |repository|
            project_payload(repository, config)
          end.compact_map { |item| item }

          {
            data: projects,
            meta: {
              total:      projects.size,
              page:       1,
              pageSize:   projects.size,
              totalPages: projects.empty? ? 0 : 1,
              timestamp:  Time.utc.to_rfc3339,
            },
          }.to_json
        end

        get "/projects/:id" do |env|
          env.response.content_type = "application/json"
          project_id = env.params.url["id"]

          repository = RepositoryStore.find_by_project(project_id, config)
          unless repository
            env.response.status_code = 404
            next({error: {code: "NOT_FOUND", message: "Project not found: #{project_id}"}}.to_json)
          end

          payload = project_payload(repository, config)
          unless payload
            env.response.status_code = 404
            next({error: {code: "NOT_FOUND", message: "Project order not found: #{project_id}"}}.to_json)
          end

          payload.to_json
        end

        get "/projects/:id/tickets" do |env|
          env.response.content_type = "application/json"
          project_id = env.params.url["id"]

          repository = RepositoryStore.find_by_project(project_id, config)
          unless repository
            env.response.status_code = 404
            next({error: {code: "NOT_FOUND", message: "Project not found: #{project_id}"}}.to_json)
          end

          order = OrderQueue.find_order(repository.order_id, config)
          tickets = order ? [ticket_payload(order, repository)] : [] of JSON::Any

          {
            data: tickets,
            meta: {
              projectId:  project_id,
              total:      tickets.size,
              page:       1,
              pageSize:   tickets.size,
              totalPages: tickets.empty? ? 0 : 1,
              timestamp:  Time.utc.to_rfc3339,
            },
          }.to_json
        end

        get "/projects/:id/repository" do |env|
          env.response.content_type = "application/json"
          project_id = env.params.url["id"]

          repository = RepositoryStore.find_by_project(project_id, config)
          unless repository
            env.response.status_code = 404
            next({error: {code: "NOT_FOUND", message: "Project not found: #{project_id}"}}.to_json)
          end

          RepositoryStore.to_json_payload(repository).to_json
        end
      end

      private def self.project_payload(repository : RepositoryStore::RepositoryRecord, config : Utils::Config) : JSON::Any?
        order = OrderQueue.find_order(repository.order_id, config)
        return nil unless order

        JSON.parse(
          {
            "@context" => [ActivityPub::CONTEXT, ForgeFed::CONTEXT],
            "id" => repository.project_id,
            "type" => "Project",
            "name" => repository.name,
            "summary" => order.description || order.title,
            "description" => order.description || order.title,
            "sourceRepository" => repository.public_clone_url || repository.ssh_clone_url || "",
            "issueTracker" => "#{config.crater_url}/projects/#{repository.project_id}/tickets",
            "administrators" => [order.owner_username || config.actor_username],
            "createdAt" => repository.created_at,
            "updatedAt" => repository.updated_at,
            "repository" => JSON.parse(RepositoryStore.to_json_payload(repository).to_json)
          }.to_json
        )
      end

      private def self.ticket_payload(order : OrderQueue::OrderRecord, repository : RepositoryStore::RepositoryRecord) : JSON::Any
        JSON.parse(
          {
            "id" => "#{repository.project_id}/tickets/#{order.id}",
            "type" => "Ticket",
            "projectId" => repository.project_id,
            "orderId" => order.id,
            "name" => order.title,
            "content" => order.description || "",
            "status" => order.status,
            "labels" => order.labels,
            "estimatedCost" => order.estimated_cost,
            "currency" => order.currency,
            "createdAt" => order.created_at,
            "updatedAt" => order.updated_at,
            "repositoryId" => repository.id
          }.to_json
        )
      end
    end
  end
end

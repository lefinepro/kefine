require "kemal"
require "json"
require "../aptok"
require "../order_queue"
require "../repository_store"
require "../utils/config"

module Lepos
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

        payload = Aptok.forgefed_project(
          repository.project_id,
          repository.name,
          summary: order.description || order.title,
          context: config.crater_url
        )
        payload["description"] = Aptok.json(order.description || order.title)
        payload["sourceRepository"] = Aptok.json(repository.public_clone_url || repository.ssh_clone_url || "")
        payload["issueTracker"] = Aptok.json("#{config.crater_url}/projects/#{repository.project_id}/tickets")
        payload["administrators"] = Aptok.json([order.owner_username || config.actor_username])
        payload["createdAt"] = Aptok.json(repository.created_at)
        payload["updatedAt"] = Aptok.json(repository.updated_at)
        payload["repository"] = Aptok.json(RepositoryStore.to_json_payload(repository))

        JSON.parse(payload.to_json)
      end

      private def self.ticket_payload(order : OrderQueue::OrderRecord, repository : RepositoryStore::RepositoryRecord) : JSON::Any
        payload = Aptok.forgefed_ticket(
          "#{repository.project_id}/tickets/#{order.id}",
          order.title,
          order.description || "",
          context: repository.project_id,
          resolved: order.status == "completed"
        )
        payload["projectId"] = Aptok.json(repository.project_id)
        payload["orderId"] = Aptok.json(order.id)
        payload["status"] = Aptok.json(order.status)
        payload["labels"] = Aptok.json(order.labels)
        payload["estimatedCost"] = Aptok.json(order.estimated_cost)
        payload["currency"] = Aptok.json(order.currency)
        payload["createdAt"] = Aptok.json(order.created_at)
        payload["updatedAt"] = Aptok.json(order.updated_at)
        payload["repositoryId"] = Aptok.json(repository.id)

        JSON.parse(payload.to_json)
      end
    end
  end
end

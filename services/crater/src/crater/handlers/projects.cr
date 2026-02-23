require "kemal"
require "json"
require "../forgefed/types"
require "../utils/config"

module Crater
  module Handlers
    module Projects
      def self.register(config : Utils::Config)
        get "/projects" do |env|
          env.response.content_type = "application/json"

          # TODO: Proxy to Simple API and transform to ForgeFed Project format
          {
            data: [] of JSON::Any,
            meta: {
              total:      0,
              page:       1,
              pageSize:   20,
              totalPages: 0,
              timestamp:  Time.utc.to_s,
            },
          }.to_json
        end

        get "/projects/:id" do |env|
          id = env.params.url["id"]
          env.response.content_type = "application/json"

          # TODO: Proxy to Simple API and transform to ForgeFed Project format
          env.response.status_code = 404
          {error: {code: "NOT_FOUND", message: "Project not found: #{id}"}}.to_json
        end

        get "/projects/:id/tickets" do |env|
          id = env.params.url["id"]
          env.response.content_type = "application/json"

          # TODO: Proxy tasks from Simple API for the given project
          {
            data: [] of JSON::Any,
            meta: {
              projectId:  id,
              total:      0,
              page:       1,
              pageSize:   20,
              totalPages: 0,
              timestamp:  Time.utc.to_s,
            },
          }.to_json
        end
      end
    end
  end
end

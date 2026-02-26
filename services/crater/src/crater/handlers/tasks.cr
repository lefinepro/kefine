require "kemal"
require "json"
require "http/client"
require "../utils/config"

module Crater
  module Handlers
    module Tasks
      # Proxy task requests to the Simple API service
      def self.register(config : Utils::Config)
        get "/api/tasks" do |env|
          forward(env, config, "GET", "/api/tasks", query: env.request.query)
        end

        get "/api/tasks/:id" do |env|
          id = env.params.url["id"]
          forward(env, config, "GET", "/api/tasks/#{id}")
        end

        post "/api/tasks" do |env|
          body = env.request.body.try(&.gets_to_end) || ""
          forward(env, config, "POST", "/api/tasks", body: body)
        end

        put "/api/tasks/:id" do |env|
          id = env.params.url["id"]
          body = env.request.body.try(&.gets_to_end) || ""
          forward(env, config, "PUT", "/api/tasks/#{id}", body: body)
        end

        delete "/api/tasks/:id" do |env|
          id = env.params.url["id"]
          forward(env, config, "DELETE", "/api/tasks/#{id}")
        end
      end

      private def self.forward(
        env : HTTP::Server::Context,
        config : Utils::Config,
        method : String,
        path : String,
        query : String? = nil,
        body : String? = nil
      ) : String
        uri = URI.parse(config.simple_api_url)
        full_path = query ? "#{path}?#{query}" : path

        headers = HTTP::Headers{
          "Content-Type" => "application/json",
          "Accept"       => "application/json",
        }

        response = HTTP::Client.exec(
          method: method,
          url: "#{config.simple_api_url}#{full_path}",
          headers: headers,
          body: body
        )

        env.response.status_code = response.status_code
        env.response.content_type = "application/json"
        response.body
      rescue ex
        env.response.status_code = 502
        {error: {code: "PROXY_ERROR", message: "Failed to reach Simple API: #{ex.message}"}}.to_json
      end
    end
  end
end

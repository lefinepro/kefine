require "kemal"
require "json"
require "../aptok"
require "../utils/config"

module Lepos
  module Handlers
    module Actor
      def self.register(config : Utils::Config)
        get "/actor" do |env|
          render_actor(env, config.actor_username, config)
        end

        get "/actors/by-key/:suffix" do |env|
          render_key_actor(env, env.params.url["suffix"], config)
        end

        get "/actor/:username" do |env|
          username = env.params.url["username"]
          render_actor(env, username, config)
        end
      end

      private def self.render_actor(env, username : String, config : Utils::Config)
        env.response.content_type = "application/activity+json"
        AptokPayload.actor_json(username, config).to_json
      end

      private def self.render_key_actor(env, suffix : String, config : Utils::Config)
        env.response.content_type = "application/activity+json"
        AptokPayload.key_actor_json(suffix, config).to_json
      end
    end
  end
end

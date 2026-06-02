require "kemal"
require "json"
require "../aptok"
require "../utils/config"

module Lepos
  module Handlers
    module NodeInfo
      def self.register(config : Utils::Config)
        get "/.well-known/nodeinfo" do |env|
          env.response.content_type = "application/jrd+json"

          AptokPayload.nodeinfo_well_known(config).to_json
        end

        get "/nodeinfo/2.0" do |env|
          env.response.content_type = Aptok::NODEINFO_2_1_CONTENT_TYPE

          AptokPayload.nodeinfo_document.to_json
        end

        get "/nodeinfo/2.1" do |env|
          env.response.content_type = Aptok::NODEINFO_2_1_CONTENT_TYPE

          AptokPayload.nodeinfo_document.to_json
        end
      end
    end
  end
end

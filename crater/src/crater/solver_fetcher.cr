require "http/client"
require "json"
require "./utils/config"

module Lepos
  module SolverFetcher
    struct SolverInfo
      include JSON::Serializable

      property id : String
      property name : String
      property handle : String
      @[JSON::Field(key: "profileUrl")]
      property profile_url : String?
      property type : String?
      property category : String?
      property skills : Array(String)?
    end

    def self.fetch_available_solver(config : Utils::Config) : SolverInfo?
      exchange_url = config.exchange_url
      return nil if exchange_url.nil? || exchange_url.empty?

      url = "#{exchange_url.chomp('/')}/solver/available"

      begin
        response = HTTP::Client.get(url, headers: HTTP::Headers{
          "Accept" => "application/json",
        }, tls: tls_options(url))

        return nil unless response.status_code == 200

        solver = SolverInfo.from_json(response.body)
        solver
      rescue
        nil
      end
    end

    private def self.tls_options(url : String) : Bool
      url.starts_with?("https://")
    end
  end
end

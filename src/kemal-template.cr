require "kemal"
require "./views/*"

# Main Kemal application entry point
module KemalTemplate
  VERSION = "0.1.0"

  # Home page route
  get "/" do |env|
    env.response.content_type = "text/html"
    render_page("home", "Kemal Template")
  end

  # Settings page route
  get "/settings" do |env|
    env.response.content_type = "text/html"
    render_page("settings", "Settings")
  end

  # API endpoint for search (placeholder)
  get "/api/search" do |env|
    env.response.content_type = "application/json"
    query = env.params.query["q"]? || ""
    {results: [] of String, query: query}.to_json
  end

  # Static file serving is handled automatically by Kemal from public/
end

# Start Kemal server
Kemal.run

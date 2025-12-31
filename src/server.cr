require "kemal"
require "./views/*"
require "./views/renderer"
require "option_parser"

# Main Kemal application entry point
module KemalTemplate
  VERSION = "0.1.0"

  # Check if running in development mode
  @@development_mode = false

  def self.development_mode?
    @@development_mode
  end

  def self.development_mode=(value : Bool)
    @@development_mode = value
  end

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

# Parse command line arguments
OptionParser.parse do |parser|
  parser.on("-d", "--development", "Run in development mode") { KemalTemplate.development_mode = true }
  parser.on("-h", "--help", "Show this help") do
    puts "Usage: #{$0} [options]"
    puts "Options:"
    puts "  -d, --development    Run in development mode"
    puts "  -h, --help          Show this help"
    exit
  end
end

# Configure Kemal for development mode if needed
if KemalTemplate.development_mode?
  puts "Starting server in development mode..."
  # Additional development-specific configuration can go here
else
  # Production mode - you can set other configurations here if needed
end

# Start Kemal server
Kemal.run

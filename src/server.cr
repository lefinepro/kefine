require "kemal"
require "./views/*"
require "./views/renderer"
require "option_parser"

# Main Kemal application entry point
module KemalTemplate
  VERSION = "0.3.0"

  # Check if running in development mode
  @@development_mode = false
  @@vite_process : Process? = nil

  def self.development_mode?
    @@development_mode
  end

  def self.development_mode=(value : Bool)
    @@development_mode = value
  end

  def self.vite_process=(process : Process?)
    @@vite_process = process
  end

  def self.vite_process
    @@vite_process
  end

  # Landing page route (new default)
  get "/" do |env|
    env.response.content_type = "text/html"
    render_landing_page("landing", "Kefine - Deadline's on fire")
  end

  # Home page route (original app)
  get "/app" do |env|
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

  # API endpoint to serve use-cases data
  get "/data/use-cases.json" do |env|
    env.response.content_type = "application/json"
    File.read("src/assets/src/data/use-cases.json")
  end

  # API endpoint to serve i18n messages
  get "/data/messages.json" do |env|
    env.response.content_type = "application/json"
    File.read("src/assets/src/data/messages.json")
  end

  # Static file serving is handled automatically by Kemal from public/
end

# Parse command line arguments
OptionParser.parse do |parser|
  parser.on("-d", "--development", "Run in development mode with auto-rebuild") { KemalTemplate.development_mode = true }
  parser.on("-h", "--help", "Show this help") do
    puts "Usage: #{$0} [options]"
    puts "Options:"
    puts "  -d, --development    Run in development mode with Vite watch"
    puts "  -h, --help          Show this help"
    exit
  end
end

# Start Vite build in watch mode for development
def start_vite_watch
  puts "Starting Vite in watch mode..."
  assets_dir = File.join(Dir.current, "src", "assets")

  # Check if bun is available, otherwise fall back to npm/npx
  process = Process.new(
    "bun",
    ["run", "vite", "build", "--watch"],
    chdir: assets_dir,
    output: Process::Redirect::Inherit,
    error: Process::Redirect::Inherit
  )

  KemalTemplate.vite_process = process
  puts "Vite watch started (PID: #{process.pid})"
end

# Stop Vite process
def stop_vite_watch
  if process = KemalTemplate.vite_process
    puts "Stopping Vite watch..."
    process.terminate
    process.wait
    KemalTemplate.vite_process = nil
  end
end

# Handle cleanup on exit
at_exit do
  stop_vite_watch if KemalTemplate.development_mode?
end

# Configure for development or production
if KemalTemplate.development_mode?
  puts "Starting server in development mode..."
  puts "Auto-rebuild enabled for assets"

  # Start Vite in watch mode
  spawn do
    start_vite_watch
  end
else
  # Production mode - no watch needed
  puts "Starting server in production mode..."
end

# Start Kemal server
Kemal.run

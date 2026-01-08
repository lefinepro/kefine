require "ecr"
require "html"
require "file_utils"

# Static Site Generator
# Generates static HTML pages for GitHub Pages deployment
module StaticGenerator
  OUTPUT_DIR = "_site"

  # HTML escape helper
  def self.h(text : String?) : String
    return "" if text.nil?
    HTML.escape(text)
  end

  # Process ECR-like template placeholders
  def self.process_template(content : String, title : String) : String
    result = content.gsub("<%= content %>", "")
                   .gsub("<%= title %>", h(title))

    # Remove any ECR render_partial calls (they'll be processed separately)
    result = result.gsub(/<%= KemalTemplate\.render_partial\("[^"]+"\) %>/, "")

    result
  end

  # Generate a static HTML page
  def self.generate_page(page_name : String, layout_name : String, title : String, output_name : String)
    puts "Generating #{output_name}..."

    # Read page content
    page_content = case page_name
                   when "landing"
                     File.read("src/views/pages/landing.ecr")
                   when "home"
                     File.read("src/views/pages/home.ecr")
                   when "settings"
                     File.read("src/views/pages/settings.ecr")
                   else
                     "<p>Page not found</p>"
                   end

    # Read layout
    layout_content = case layout_name
                     when "landing"
                       File.read("src/views/layouts/landing.ecr")
                     else
                       File.read("src/views/layouts/main.ecr")
                     end

    # Read partials if using main layout
    sidebar_content = ""
    topbar_content = ""
    if layout_name == "main"
      sidebar_content = File.read("src/views/partials/sidebar.ecr")
      topbar_content = File.read("src/views/partials/topbar.ecr")
    end

    # Process page content to remove ECR tags
    processed_page = process_template(page_content, title)

    # Process layout with page content
    processed_layout = layout_content.gsub("<%= content %>", processed_page)
                                    .gsub("<%= title %>", h(title))

    # Process partials if present
    if layout_name == "main"
      processed_layout = processed_layout.gsub(/<%= KemalTemplate\.render_partial\("sidebar"\) %>/, sidebar_content)
      processed_layout = processed_layout.gsub(/<%= KemalTemplate\.render_partial\("topbar"\) %>/, topbar_content)
    end

    # Remove remaining ECR tags
    processed_layout = processed_layout.gsub(/<%= KemalTemplate\.render_partial\("[^"]+"\) %>/, "")

    # Write output file
    output_path = File.join(OUTPUT_DIR, output_name)
    FileUtils.mkdir_p(File.dirname(output_path))
    File.write(output_path, processed_layout)

    puts "Generated: #{output_path}"
  end

  # Copy static assets
  def self.copy_assets
    puts "Copying static assets..."

    # Copy data files
    data_dir = File.join(OUTPUT_DIR, "data")
    FileUtils.mkdir_p(data_dir)

    if File.exists?("src/assets/src/data/use-cases.json")
      FileUtils.cp("src/assets/src/data/use-cases.json", File.join(data_dir, "use-cases.json"))
      puts "Copied: use-cases.json"
    end

    if File.exists?("src/assets/src/data/messages.json")
      FileUtils.cp("src/assets/src/data/messages.json", File.join(data_dir, "messages.json"))
      puts "Copied: messages.json"
    end

    puts "Assets copied successfully"
  end

  # Main generation entry point
  def self.run
    puts "Starting static site generation..."
    puts "Output directory: #{OUTPUT_DIR}"

    # Ensure output directory exists
    FileUtils.mkdir_p(OUTPUT_DIR)

    # Generate pages
    generate_page("landing", "landing", "Kefine - Deadline's on fire", "index.html")
    generate_page("home", "main", "Kemal Template", "app/index.html")
    generate_page("settings", "main", "Settings", "settings/index.html")

    # Copy assets
    copy_assets

    puts "\nStatic site generation complete!"
    puts "Output: #{OUTPUT_DIR}/"
  end
end

# Run the generator
StaticGenerator.run

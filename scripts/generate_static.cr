#!/usr/bin/env crystal

# Static Site Generator for GitHub Pages
# This script generates static HTML files from ECR templates

require "ecr"
require "file_utils"

module StaticGenerator
  SITE_DIR = "_site"

  # HTML escape helper
  def self.h(text : String?) : String
    return "" if text.nil?
    text.gsub("&", "&amp;")
        .gsub("<", "&lt;")
        .gsub(">", "&gt;")
        .gsub("\"", "&quot;")
        .gsub("'", "&#39;")
  end

  # Render partial
  def self.render_partial(partial_name : String) : String
    case partial_name
    when "sidebar"
      ECR.render("src/views/partials/sidebar.ecr")
    when "topbar"
      ECR.render("src/views/partials/topbar.ecr")
    when "search"
      ECR.render("src/views/components/search.ecr")
    when "filters"
      ECR.render("src/views/components/filters.ecr")
    else
      ""
    end
  end

  # Render page with layout
  def self.render_page(page_name : String, title : String) : String
    content = case page_name
              when "home"
                ECR.render("src/views/pages/home.ecr")
              when "settings"
                ECR.render("src/views/pages/settings.ecr")
              else
                "<p>Page not found</p>"
              end
    ECR.render("src/views/layouts/main.ecr")
  end

  # Generate all pages
  def self.generate
    puts "Generating static site..."

    # Ensure output directory exists
    FileUtils.mkdir_p(SITE_DIR)
    FileUtils.mkdir_p("#{SITE_DIR}/css")
    FileUtils.mkdir_p("#{SITE_DIR}/js")
    FileUtils.mkdir_p("#{SITE_DIR}/images")

    # Copy static assets
    puts "  Copying static assets..."
    if Dir.exists?("public/css")
      Dir.glob("public/css/*.css").each do |file|
        FileUtils.cp(file, "#{SITE_DIR}/css/")
      end
    end
    if Dir.exists?("public/js")
      Dir.glob("public/js/*.js").each do |file|
        FileUtils.cp(file, "#{SITE_DIR}/js/")
      end
    end
    if Dir.exists?("public/images")
      Dir.glob("public/images/*").each do |file|
        FileUtils.cp(file, "#{SITE_DIR}/images/")
      end
    end

    # Generate index.html
    puts "  Generating index.html..."
    html = render_page("home", "Kemal Template")
    File.write("#{SITE_DIR}/index.html", html)

    # Generate settings.html
    puts "  Generating settings.html..."
    html = render_page("settings", "Settings")
    File.write("#{SITE_DIR}/settings.html", html)

    puts "Static site generated successfully!"
    puts "Output: #{SITE_DIR}/"
  end
end

# Alias for templates
module KemalTemplate
  def self.render_partial(partial_name : String) : String
    StaticGenerator.render_partial(partial_name)
  end

  def self.h(text : String?) : String
    StaticGenerator.h(text)
  end
end

# Run generator
StaticGenerator.generate

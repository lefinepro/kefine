require "ecr"
require "html"

# ECR Template Renderer Module
# Provides helper methods for rendering ECR templates with layouts
module KemalTemplate
  # Layout wrapper that yields content
  def self.render_layout(title : String, &block)
    content = yield

    # Process any ECR in the content first
    processed_content = process_ecr(content)

    # Read the layout file and replace placeholders
    layout_content = File.read("src/views/layouts/main.ecr")
    processed_layout = layout_content.gsub("<%= content %>", processed_content)
                                   .gsub("<%= title %>", h(title))

    processed_layout
  end

  # Render a page with the main layout
  def self.render_page(page_name : String, title : String)
    content = case page_name
              when "home"
                File.read("src/views/pages/home.ecr")
              when "settings"
                File.read("src/views/pages/settings.ecr")
              else
                "<p>Page not found</p>"
              end

    # Process any ECR in the content first
    processed_content = process_ecr(content)

    # Read the layout file and replace placeholders
    layout_content = File.read("src/views/layouts/main.ecr")
    processed_layout = layout_content.gsub("<%= content %>", processed_content)
                                   .gsub("<%= title %>", h(title))

    processed_layout
  end

  # Render a partial component
  def self.render_partial(partial_name : String)
    content = case partial_name
    when "sidebar"
      File.read("src/views/partials/sidebar.ecr")
    when "topbar"
      File.read("src/views/partials/topbar.ecr")
    when "search"
      File.read("src/views/components/search.ecr")
    when "filters"
      File.read("src/views/components/filters.ecr")
    else
      ""
    end

    # Process any nested ECR calls in the partial
    process_ecr(content)
  end

  private def self.process_ecr(content : String)
    # Process any ECR calls in the content string
    result = content.gsub(/<%= KemalTemplate\.render_partial\("([^"]+)"\) %>/) do |match|
      partial_name = $1
      render_partial(partial_name)
    end

    result
  end

  # HTML escape helper to prevent XSS
  def self.h(text : String?) : String
    return "" if text.nil?
    HTML.escape(text)
  end
end

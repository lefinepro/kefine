require "ecr"

# ECR Template Renderer Module
# Provides helper methods for rendering ECR templates with layouts
module KemalTemplate
  # Layout wrapper that yields content
  def self.render_layout(title : String, &block)
    content = yield
    ECR.render("src/views/layouts/main.ecr")
  end

  # Render a page with the main layout
  def self.render_page(page_name : String, title : String)
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

  # Render a partial component
  def self.render_partial(partial_name : String)
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

  # HTML escape helper to prevent XSS
  def self.h(text : String?) : String
    return "" if text.nil?
    HTML.escape(text)
  end
end

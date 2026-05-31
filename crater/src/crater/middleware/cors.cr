require "kemal"

module Lepos
  class CorsHandler
    include HTTP::Handler

    def call(context : HTTP::Server::Context)
      context.response.headers["Access-Control-Allow-Origin"] = "*"
      context.response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
      context.response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"

      if context.request.method == "OPTIONS"
        context.response.status_code = 204
        return
      end

      call_next(context)
    end
  end
end

require "kemal"

module Lepos
  class RequestLogger
    include HTTP::Handler

    def call(context : HTTP::Server::Context)
      start = Time.monotonic
      request_id = Random::Secure.hex(8)

      context.response.headers["X-Request-Id"] = request_id
      puts "[#{request_id}] #{context.request.method} #{context.request.path}"

      call_next(context)

      duration = (Time.monotonic - start).total_milliseconds.round(2)
      puts "[#{request_id}] #{context.response.status_code} - #{duration}ms"
    end
  end
end

require "base64"
require "socket"

module Lepos
  module Utils
    module MaddyMailer
      class DeliveryError < Exception
      end

      private record MailConfig, host : String, port : Int32, username : String?, password : String?, from_email : String, from_name : String?

      def self.send_email(config : Config, to : String, subject : String, text_body : String) : Nil
        mail_config = build_config(config)
        raise DeliveryError.new("Maddy SMTP is not configured.") unless mail_config

        socket = TCPSocket.new(mail_config.not_nil!.host, mail_config.not_nil!.port)
        begin
          expect_code(socket, {220})
          send_command(socket, "EHLO kefine.local")
          expect_code(socket, {250})

          if auth_required?(mail_config.not_nil!)
            credentials = "\u0000#{mail_config.not_nil!.username}\u0000#{mail_config.not_nil!.password}"
            send_command(socket, "AUTH PLAIN #{Base64.strict_encode(credentials)}")
            expect_code(socket, {235})
          end

          send_command(socket, "MAIL FROM:<#{mail_config.not_nil!.from_email}>")
          expect_code(socket, {250})

          send_command(socket, "RCPT TO:<#{to}>")
          expect_code(socket, {250, 251})

          send_command(socket, "DATA")
          expect_code(socket, {354})

          socket << build_message(mail_config.not_nil!, to, subject, text_body)
          socket << "\r\n.\r\n"
          socket.flush
          expect_code(socket, {250})

          send_command(socket, "QUIT")
        rescue error
          raise DeliveryError.new("Maddy delivery failed: #{error.message}")
        ensure
          socket.close rescue nil
        end
      end

      private def self.build_config(config : Config) : MailConfig?
        host = config.maddy_smtp_host || "127.0.0.1"
        from_email = config.maddy_from_email || "no-reply@#{config.domain}"

        MailConfig.new(
          host: host,
          port: config.maddy_smtp_port,
          username: config.maddy_smtp_username,
          password: config.maddy_smtp_password,
          from_email: from_email,
          from_name: config.maddy_from_name
        )
      end

      private def self.auth_required?(config : MailConfig) : Bool
        !config.username.to_s.empty? && !config.password.to_s.empty?
      end

      private def self.send_command(socket : TCPSocket, command : String) : Nil
        socket << command << "\r\n"
        socket.flush
      end

      private def self.expect_code(socket : TCPSocket, expected_codes : Enumerable(Int32)) : String
        response = read_response(socket)
        code = response[0, 3]?.to_s.to_i?
        unless code && expected_codes.includes?(code)
          raise DeliveryError.new("Unexpected SMTP response: #{response.strip}")
        end

        response
      end

      private def self.read_response(socket : TCPSocket) : String
        first_line = socket.gets("\n")
        raise DeliveryError.new("SMTP server closed the connection.") unless first_line

        lines = [first_line.not_nil!]
        code = lines.first[0, 3]? || ""

        while lines.last.size > 3 && lines.last[3] == '-'
          next_line = socket.gets("\n")
          raise DeliveryError.new("SMTP server returned an incomplete multiline response.") unless next_line
          lines << next_line.not_nil!
          break unless lines.last.starts_with?(code)
        end

        lines.join
      end

      private def self.build_message(config : MailConfig, to : String, subject : String, text_body : String) : String
        from_header =
          if config.from_name.to_s.empty?
            config.from_email
          else
            %("#{config.from_name}" <#{config.from_email}>)
          end

        normalized_body =
          text_body
            .gsub("\r\n", "\n")
            .gsub('\r', '\n')
            .split('\n')
            .map { |line| line.starts_with?('.') ? ".#{line}" : line }
            .join("\r\n")

        [
          "From: #{from_header}",
          "To: <#{to}>",
          "Subject: #{subject}",
          "MIME-Version: 1.0",
          "Content-Type: text/plain; charset=UTF-8",
          "",
          normalized_body,
        ].join("\r\n")
      end
    end
  end
end

require "json"
require "random/secure"
require "../utils/maddy_mailer"

module Crater
  module Handlers
    module EmailCodeAuth
      SESSION_TTL = 30.days
      CODE_TTL = 10.minutes
      EMAIL_PATTERN = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
      CODE_PATTERN = /\A\d{6}\z/

      record PendingCode, code : String, expires_at : Time, attempts : Int32

      OTP_STORE = {} of String => PendingCode
      OTP_MUTEX = Mutex.new

      def self.register(config : Utils::Config)
        post "/auth/email-code/start" do |env|
          env.response.content_type = "application/json"
          next start_login(config, env, parse_body(env))
        end

        post "/api/auth/email-code/start" do |env|
          env.response.content_type = "application/json"
          next start_login(config, env, parse_body(env))
        end

        post "/auth/email-code/verify" do |env|
          env.response.content_type = "application/json"
          next verify_login(env, parse_body(env))
        end

        post "/api/auth/email-code/verify" do |env|
          env.response.content_type = "application/json"
          next verify_login(env, parse_body(env))
        end
      end

      private def self.parse_body(env)
        raw_body = env.request.body.try(&.gets_to_end) || ""
        return JSON.parse(%({})) if raw_body.empty?

        JSON.parse(raw_body)
      rescue
        JSON.parse(%({}))
      end

      private def self.start_login(config : Utils::Config, env, payload : JSON::Any) : String
        email = normalize_email(payload["email"]?.try(&.as_s?))

        unless valid_email?(email)
          env.response.status_code = 400
          return({error: "Email address is invalid."}.to_json)
        end

        code = "%06d" % Random::Secure.rand(0..999_999)
        OTP_MUTEX.synchronize do
          OTP_STORE[email] = PendingCode.new(code, Time.utc + CODE_TTL, 0)
        end

        begin
          Utils::MaddyMailer.send_email(
            config,
            email,
            "Your Kefine sign-in code",
            build_email_body(email, code)
          )
        rescue error
          OTP_MUTEX.synchronize { OTP_STORE.delete(email) }
          env.response.status_code = 503
          return({error: error.message}.to_json)
        end

        response = {
          sent: true,
          email: email,
          expiresInSeconds: CODE_TTL.total_seconds.to_i,
        }

        if config.env != "production"
          response = response.merge({devCode: code})
        end

        response.to_json
      end

      private def self.verify_login(env, payload : JSON::Any) : String
        email = normalize_email(payload["email"]?.try(&.as_s?))
        code = payload["code"]?.try(&.as_s?).to_s.strip

        unless valid_email?(email)
          env.response.status_code = 400
          return({error: "Email address is invalid."}.to_json)
        end

        unless CODE_PATTERN.matches?(code)
          env.response.status_code = 400
          return({error: "One-time code must contain 6 digits."}.to_json)
        end

        record = OTP_MUTEX.synchronize { OTP_STORE[email]? }
        if record.nil? || record.not_nil!.expires_at <= Time.utc
          OTP_MUTEX.synchronize { OTP_STORE.delete(email) }
          env.response.status_code = 400
          return({error: "The one-time code has expired. Request a new code."}.to_json)
        end

        if record.not_nil!.code != code
          attempts = record.not_nil!.attempts + 1
          OTP_MUTEX.synchronize do
            if attempts >= 5
              OTP_STORE.delete(email)
            else
              OTP_STORE[email] = PendingCode.new(record.not_nil!.code, record.not_nil!.expires_at, attempts)
            end
          end

          env.response.status_code = 400
          return({error: "One-time code is incorrect."}.to_json)
        end

        OTP_MUTEX.synchronize { OTP_STORE.delete(email) }

        handle = normalize_handle(email.split('@')[0]? || "email-user")
        display_name = email.split('@')[0]? || email

        {
          verified:    true,
          token:       "email:#{email}:#{Time.utc.to_unix_ms}",
          userId:      "email:#{email}",
          username:    email,
          displayName: display_name,
          handle:      handle,
          email:       email,
          authType:    "email",
          expiresAt:   (Time.utc + SESSION_TTL).to_rfc3339
        }.to_json
      end

      private def self.normalize_email(value : String?) : String
        value.to_s.strip.downcase
      end

      private def self.valid_email?(email : String) : Bool
        !email.empty? && EMAIL_PATTERN.matches?(email)
      end

      private def self.normalize_handle(value : String) : String
        normalized = value.downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
        normalized.empty? ? "email-user" : normalized
      end

      private def self.build_email_body(email : String, code : String) : String
        <<-BODY
Hello,

Use this one-time code to sign in to Kefine:

#{code}

This code was requested for #{email} and expires in 10 minutes.

If you did not request it, you can ignore this email.
        BODY
      end
    end
  end
end

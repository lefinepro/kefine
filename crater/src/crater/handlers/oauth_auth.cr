require "base64"
require "http/client"
require "json"
require "uri"
require "uuid"

module Crater
  module Handlers
    module OauthAuth
      SESSION_TTL = 30.days
      USER_AGENT = "kefine-crater-oauth"

      record ProviderConfig, client_id : String, client_secret : String
      record ProviderProfile, email : String, display_name : String, handle : String

      def self.register(config : Utils::Config)
        get "/auth/oauth/:provider/start" do |env|
          provider = env.params.url["provider"]? || ""
          return_to = sanitize_return_to(read_return_to(env), config)
          auth_url = build_provider_authorize_url(config, provider, return_to)

          if auth_url
            env.redirect(auth_url)
          else
            env.redirect(build_error_redirect(return_to, "provider_not_configured"))
          end
        end

        get "/auth/oauth/:provider/callback" do |env|
          provider = env.params.url["provider"]? || ""
          state = parse_state(env.params.query["state"]?)
          return_to = sanitize_return_to(state["returnTo"]?.try(&.as_s?), config)
          code = env.params.query["code"]?.to_s

          if code.empty?
            env.redirect(build_error_redirect(return_to, "missing_code"))
            next ""
          end

          begin
            profile = fetch_provider_profile(config, provider, code)
            env.redirect(build_success_redirect(return_to, provider, profile))
          rescue error
            puts "[oauth] #{provider} callback failed: #{error.message}"
            env.redirect(build_error_redirect(return_to, "oauth_exchange_failed"))
          end

          ""
        end
      end

      private def self.read_return_to(env) : String?
        env.params.query["return_to"]?.try(&.to_s)
      end

      private def self.provider_config(config : Utils::Config, provider : String) : ProviderConfig?
        case provider
        when "google"
          client_id = config.google_oauth_client_id
          client_secret = config.google_oauth_client_secret
        when "github"
          client_id = config.github_oauth_client_id
          client_secret = config.github_oauth_client_secret
        else
          return nil
        end

        return nil if client_id.nil? || client_secret.nil?
        return nil if client_id.not_nil!.strip.empty? || client_secret.not_nil!.strip.empty?

        ProviderConfig.new(client_id.not_nil!, client_secret.not_nil!)
      end

      private def self.build_provider_authorize_url(config : Utils::Config, provider : String, return_to : String) : String?
        credentials = provider_config(config, provider)
        return nil unless credentials

        redirect_uri = oauth_callback_url(config, provider)
        state = encode_state(return_to)

        params = URI::Params.new

        case provider
        when "google"
          params["client_id"] = credentials.client_id
          params["redirect_uri"] = redirect_uri
          params["response_type"] = "code"
          params["scope"] = "openid email profile"
          params["state"] = state
          params["prompt"] = "select_account"
          "https://accounts.google.com/o/oauth2/v2/auth?#{params}"
        when "github"
          params["client_id"] = credentials.client_id
          params["redirect_uri"] = redirect_uri
          params["scope"] = "read:user user:email"
          params["state"] = state
          "https://github.com/login/oauth/authorize?#{params}"
        else
          nil
        end
      end

      private def self.fetch_provider_profile(config : Utils::Config, provider : String, code : String) : ProviderProfile
        credentials = provider_config(config, provider)
        raise "OAuth provider is not configured" unless credentials

        case provider
        when "google"
          fetch_google_profile(credentials, oauth_callback_url(config, provider), code)
        when "github"
          fetch_github_profile(credentials, oauth_callback_url(config, provider), code)
        else
          raise "Unsupported provider"
        end
      end

      private def self.fetch_google_profile(credentials : ProviderConfig, redirect_uri : String, code : String) : ProviderProfile
        token_response = HTTP::Client.post(
          URI.parse("https://oauth2.googleapis.com/token"),
          headers: HTTP::Headers{
            "Content-Type" => "application/x-www-form-urlencoded",
            "Accept" => "application/json",
            "User-Agent" => USER_AGENT
          },
          body: URI::Params.encode({
            "client_id" => credentials.client_id,
            "client_secret" => credentials.client_secret,
            "code" => code,
            "grant_type" => "authorization_code",
            "redirect_uri" => redirect_uri
          })
        )

        token_payload = parse_json_response(token_response, "google_token")
        access_token = token_payload["access_token"]?.try(&.as_s?) || ""
        raise "Google access token missing" if access_token.empty?

        profile_response = HTTP::Client.get(
          URI.parse("https://openidconnect.googleapis.com/v1/userinfo"),
          headers: HTTP::Headers{
            "Authorization" => "Bearer #{access_token}",
            "Accept" => "application/json",
            "User-Agent" => USER_AGENT
          }
        )

        profile_payload = parse_json_response(profile_response, "google_profile")
        email = profile_payload["email"]?.try(&.as_s?) || ""
        raise "Google email missing" if email.empty?

        display_name =
          profile_payload["name"]?.try(&.as_s?) ||
            email.split('@')[0]? ||
            "Google user"
        handle =
          profile_payload["given_name"]?.try(&.as_s?) ||
            display_name

        ProviderProfile.new(email, display_name.to_s, normalize_handle(handle.to_s, "google"))
      end

      private def self.fetch_github_profile(credentials : ProviderConfig, redirect_uri : String, code : String) : ProviderProfile
        token_response = HTTP::Client.post(
          URI.parse("https://github.com/login/oauth/access_token"),
          headers: HTTP::Headers{
            "Content-Type" => "application/x-www-form-urlencoded",
            "Accept" => "application/json",
            "User-Agent" => USER_AGENT
          },
          body: URI::Params.encode({
            "client_id" => credentials.client_id,
            "client_secret" => credentials.client_secret,
            "code" => code,
            "redirect_uri" => redirect_uri
          })
        )

        token_payload = parse_json_response(token_response, "github_token")
        access_token = token_payload["access_token"]?.try(&.as_s?) || ""
        raise "GitHub access token missing" if access_token.empty?

        profile_response = HTTP::Client.get(
          URI.parse("https://api.github.com/user"),
          headers: HTTP::Headers{
            "Authorization" => "Bearer #{access_token}",
            "Accept" => "application/vnd.github+json",
            "User-Agent" => USER_AGENT
          }
        )

        profile_payload = parse_json_response(profile_response, "github_profile")
        email = profile_payload["email"]?.try(&.as_s?) || ""

        if email.empty?
          emails_response = HTTP::Client.get(
            URI.parse("https://api.github.com/user/emails"),
            headers: HTTP::Headers{
              "Authorization" => "Bearer #{access_token}",
              "Accept" => "application/vnd.github+json",
              "User-Agent" => USER_AGENT
            }
          )

          emails_payload = parse_json_response(emails_response, "github_emails")
          if emails_payload.raw.is_a?(Array)
            emails_payload.as_a.each do |item|
              item_email = item["email"]?.try(&.as_s?) || ""
              next if item_email.empty?

              primary = item["primary"]?.try(&.as_bool?) || false
              verified = item["verified"]?.try(&.as_bool?) || false
              if primary || verified
                email = item_email
                break
              end

              email = item_email if email.empty?
            end
          end
        end

        raise "GitHub email missing" if email.empty?

        display_name =
          profile_payload["name"]?.try(&.as_s?) ||
            profile_payload["login"]?.try(&.as_s?) ||
            email.split('@')[0]? ||
            "GitHub user"
        handle =
          profile_payload["login"]?.try(&.as_s?) ||
            email.split('@')[0]? ||
            display_name

        ProviderProfile.new(email, display_name.to_s, normalize_handle(handle.to_s, "github"))
      end

      private def self.parse_json_response(response : HTTP::Client::Response, label : String) : JSON::Any
        body = response.body
        raise "#{label} failed with #{response.status_code}" unless (200..299).includes?(response.status_code)

        JSON.parse(body)
      rescue error
        raise "#{label} parse failed: #{error.message}"
      end

      private def self.oauth_callback_url(config : Utils::Config, provider : String) : String
        "#{config.crater_url}/auth/oauth/#{provider}/callback"
      end

      private def self.sanitize_return_to(value : String?, config : Utils::Config) : String
        fallback = (config.frontend_url || config.exchange_url || config.crater_url).as(String)
        return fallback if value.nil?

        raw = value.not_nil!.strip
        return fallback if raw.empty?

        uri = URI.parse(raw)
        return fallback unless {"http", "https"}.includes?(uri.scheme.to_s.downcase)

        raw
      rescue
        fallback
      end

      private def self.encode_state(return_to : String) : String
        payload = {
          "nonce" => UUID.random.to_s,
          "returnTo" => return_to
        }.to_json

        Base64.urlsafe_encode(payload, padding: false)
      end

      private def self.parse_state(raw_state : String?) : JSON::Any
        return JSON.parse(%({})) if raw_state.nil? || raw_state.not_nil!.strip.empty?

        encoded = raw_state.not_nil!.strip
        padded = encoded + ("=" * ((4 - (encoded.bytesize % 4)) % 4))
        JSON.parse(Base64.decode_string(padded.tr("-_", "+/")))
      rescue
        JSON.parse(%({}))
      end

      private def self.build_success_redirect(return_to : String, provider : String, profile : ProviderProfile) : String
        params = URI::Params.new
        params["auth_callback"] = "1"
        params["auth_provider"] = provider
        params["auth_user_id"] = "#{provider}:#{profile.email.downcase}"
        params["auth_email"] = profile.email
        params["auth_display_name"] = profile.display_name
        params["auth_handle"] = profile.handle
        params["auth_type"] = "email"
        params["auth_token"] = "#{provider}:#{profile.email.downcase}:#{Time.utc.to_unix_ms}"
        params["auth_expires_at"] = (Time.utc + SESSION_TTL).to_rfc3339
        append_query_params(return_to, params)
      end

      private def self.build_error_redirect(return_to : String, error_code : String) : String
        params = URI::Params.new
        params["auth_callback"] = "1"
        params["auth_error"] = error_code
        append_query_params(return_to, params)
      end

      private def self.append_query_params(base_url : String, params : URI::Params) : String
        separator = base_url.includes?('?') ? '&' : '?'
        "#{base_url}#{separator}#{params}"
      end

      private def self.normalize_handle(value : String, fallback_prefix : String) : String
        normalized = value.downcase.gsub(/[^a-z0-9._-]+/, "-").gsub(/^[._-]+|[._-]+$/, "")
        normalized.empty? ? "#{fallback_prefix}-user" : normalized
      end
    end
  end
end

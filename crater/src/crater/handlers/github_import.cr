require "kemal"
require "json"
require "log"
require "../repository_store"
require "../forgefed_store"
require "../utils/config"

module Lepos
  module Handlers
    module GithubImport
      def self.register(config : Utils::Config)
        post "/import/github" do |env|
          env.response.content_type = "application/json"
          handle_import(env, config)
        end

        get "/import/github/:owner/:repo/status" do |env|
          env.response.content_type = "application/json"
          handle_status(env, config)
        end
      end

      private def self.handle_import(env, config : Utils::Config)
        request_id = Random::Secure.hex(6)

        body = env.request.body.try(&.gets_to_end)
        if body.nil? || body.strip.empty?
          env.response.status_code = 400
          return({error: "Missing request body"}.to_json)
        end

        payload = begin
          JSON.parse(body)
        rescue ex : JSON::ParseException
          Log.warn { "[import:github #{request_id}] invalid JSON payload: #{ex.message}" }
          env.response.status_code = 400
          return({error: "Invalid request body", reason: ex.message}.to_json)
        end

        object = payload.as_h? || {} of String => JSON::Any
        owner = presence(object["owner"]?.try(&.as_s?))
        repo = presence(object["repo"]?.try(&.as_s?))
        visibility = presence(object["visibility"]?.try(&.as_s?)) || "public"

        if owner.nil? || repo.nil?
          env.response.status_code = 400
          return({error: "Missing required fields: owner, repo"}.to_json)
        end

        if RepositoryStore.find_by_owner_and_project_clone_name(owner, repo, config)
          env.response.status_code = 409
          return({error: "Repository already imported"}.to_json)
        end

        remote_url = "https://github.com/#{owner}/#{repo}.git"
        Log.info { "[import:github #{request_id}] importing #{owner}/#{repo} from #{remote_url} (visibility=#{visibility})" }

        record = RepositoryStore.ensure_ad_hoc_for_owner_and_clone_name(owner, repo, config, visibility)

        begin
          RepositoryStore.git_clone_mirror!(record, remote_url)
          RepositoryStore.adopt_mirror_default_branch!(record, config)
        rescue ex
          Log.error(exception: ex) { "[import:github #{request_id}] clone failed for #{owner}/#{repo}" }
          env.response.status_code = 502
          return({error: "Failed to clone repository: #{ex.message}"}.to_json)
        end

        begin
          ForgeFedStore.ensure_repository_resources(record, config)
          ForgeFedStore.sync_repository(record, config)
        rescue ex
          Log.error(exception: ex) { "[import:github #{request_id}] sync failed for #{owner}/#{repo}" }
          env.response.status_code = 500
          return({error: "Failed to sync repository: #{ex.message}"}.to_json)
        end

        Log.info { "[import:github #{request_id}] imported #{owner}/#{repo} as slug=#{record.slug}" }

        {
          ok:            true,
          repository:    "/repositories/#{record.slug}",
          forgeFedActor: "/repositories/#{record.slug}",
          cloneUrl:      "/@#{RepositoryStore.owner_handle(record, config)}/#{record.project_id}.git",
        }.to_json
      end

      private def self.handle_status(env, config : Utils::Config)
        owner = env.params.url["owner"]
        repo = env.params.url["repo"]

        record = RepositoryStore.find_by_owner_and_project_clone_name(owner, repo, config)
        unless record
          # Kemal auto-registers an `error 404` handler that renders an HTML
          # page, and RouteHandler#process_request raises a CustomException
          # whenever a handler leaves the status at 404 — which would discard
          # our JSON body. Printing and closing the response here keeps the
          # JSON intact: ExceptionHandler#call_exception_with_status_code
          # returns early when the response is already closed.
          return json_response(env, 404, {error: "Repository not found"})
        end

        branches = ForgeFedStore.list_branches(record.id, config).reject(&.deleted_at)
        tracker = ForgeFedStore.find_patch_tracker_by_repository(record.id, config)
        merge_requests = tracker ? ForgeFedStore.list_merge_requests_for_patch_tracker(tracker.id, config) : [] of ForgeFedStore::MergeRequestRecord

        {
          ok:                true,
          slug:              record.slug,
          ownerHandle:       RepositoryStore.owner_handle(record, config),
          visibility:        record.visibility,
          branchCount:       branches.size,
          mergeRequestCount: merge_requests.size,
          createdAt:         record.created_at,
        }.to_json
      end

      # Writes a JSON body with the given status and closes the response. Used
      # for status codes (e.g. 404) that Kemal intercepts with a registered
      # error handler: closing the response makes ExceptionHandler skip its
      # HTML rendering and preserve this JSON. Returns "" so the calling route
      # block yields an empty (already-sent) body.
      private def self.json_response(env, status_code : Int32, body) : String
        env.response.content_type = "application/json"
        env.response.status_code = status_code
        env.response.print(body.to_json)
        env.response.close
        ""
      end

      private def self.presence(value : String?) : String?
        return nil if value.nil?
        stripped = value.strip
        stripped.empty? ? nil : stripped
      end
    end
  end
end

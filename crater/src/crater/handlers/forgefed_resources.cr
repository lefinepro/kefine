require "kemal"
require "json"
require "../aptok"
require "../forgefed_store"
require "../repository_store"
require "../utils/config"

module Lepos
  module Handlers
    module ForgeFedResources
      def self.register(config : Utils::Config)
        get "/repositories/:slug" do |env|
          env.response.content_type = "application/activity+json"
          slug = env.params.url["slug"]
          repository = ForgeFedStore.sync_and_get_repository(slug, config)
          unless repository
            env.response.status_code = 404
            next({error: "Repository not found"}.to_json)
          end

          ForgeFedStore.repository_json(repository, config).to_json
        end

        get "/repositories/:slug/branches" do |env|
          env.response.content_type = "application/activity+json"
          slug = env.params.url["slug"]
          repository = ForgeFedStore.sync_and_get_repository(slug, config)
          unless repository
            env.response.status_code = 404
            next({error: "Repository not found"}.to_json)
          end

          branches = ForgeFedStore.list_branches(repository.id, config).map do |branch|
            JSON.parse(ForgeFedStore.branch_json(branch, config).to_json)
          end
          collection = Aptok.ordered_collection(
            "#{config.crater_url}/repositories/#{repository.slug}/branches",
            branches.compact_map(&.as_h?)
          )

          collection.to_json
        end

        get "/repositories/:slug/outbox" do |env|
          env.response.content_type = "application/activity+json"
          slug = env.params.url["slug"]
          repository = ForgeFedStore.sync_and_get_repository(slug, config)
          unless repository
            env.response.status_code = 404
            next({error: "Repository not found"}.to_json)
          end

          render_outbox(env, "#{config.crater_url}/repositories/#{repository.slug}", config)
        end

        post "/repositories/:slug/sync" do |env|
          env.response.content_type = "application/json"
          slug = env.params.url["slug"]
          repository = RepositoryStore.find_by_slug(slug, config)
          unless repository
            env.response.status_code = 404
            next({error: "Repository not found"}.to_json)
          end

          ForgeFedStore.sync_repository(repository, config)
          {ok: true, slug: repository.slug}.to_json
        end

        get "/branches/:id" do |env|
          env.response.content_type = "application/activity+json"
          branch = ForgeFedStore.find_branch(env.params.url["id"], config)
          unless branch
            env.response.status_code = 404
            next({error: "Branch not found"}.to_json)
          end

          ForgeFedStore.branch_json(branch, config).to_json
        end

        get "/patch-trackers/:id" do |env|
          env.response.content_type = "application/activity+json"
          tracker = ForgeFedStore.find_patch_tracker(env.params.url["id"], config)
          unless tracker
            env.response.status_code = 404
            next({error: "PatchTracker not found"}.to_json)
          end

          ForgeFedStore.patch_tracker_json(tracker, config).to_json
        end

        get "/patch-trackers/:id/tickets" do |env|
          env.response.content_type = "application/activity+json"
          tracker = ForgeFedStore.find_patch_tracker(env.params.url["id"], config)
          unless tracker
            env.response.status_code = 404
            next({error: "PatchTracker not found"}.to_json)
          end

          tickets = ForgeFedStore.list_merge_requests_for_patch_tracker(tracker.id, config).map do |mr|
            JSON.parse(ForgeFedStore.merge_request_json(mr, config).to_json)
          end
          Aptok.ordered_collection("#{tracker.actor_uri}/tickets", tickets.compact_map(&.as_h?)).to_json
        end

        get "/patch-trackers/:id/outbox" do |env|
          env.response.content_type = "application/activity+json"
          tracker = ForgeFedStore.find_patch_tracker(env.params.url["id"], config)
          unless tracker
            env.response.status_code = 404
            next({error: "PatchTracker not found"}.to_json)
          end

          render_outbox(env, tracker.actor_uri, config)
        end

        post "/patch-trackers/:id/inbox" do |env|
          env.response.content_type = "application/json"
          tracker = ForgeFedStore.find_patch_tracker(env.params.url["id"], config)
          unless tracker
            env.response.status_code = 404
            next({error: "PatchTracker not found"}.to_json)
          end

          payload = JSON.parse(env.request.body.try(&.gets_to_end) || "{}").as_h?
          unless payload
            env.response.status_code = 400
            next({error: "Invalid activity body"}.to_json)
          end

          case payload["type"]?.try(&.as_s?)
          when "Apply"
            object_id = payload["object"]?.try(&.as_s?) || ""
            merge_request_id = object_id.split('/').last? || object_id
            result = ForgeFedStore.apply_merge_request(merge_request_id, config)
            unless result
              env.response.status_code = 404
              next({error: "Merge request not found"}.to_json)
            end
            {accepted: true, mergeRequestId: result.id, status: result.status}.to_json
          else
            env.response.status_code = 400
            {error: "Unsupported PatchTracker activity"}.to_json
          end
        end

        get "/merge-requests/:id" do |env|
          env.response.content_type = "application/activity+json"
          mr = ForgeFedStore.find_merge_request(env.params.url["id"], config)
          unless mr
            env.response.status_code = 404
            next({error: "Merge request not found"}.to_json)
          end

          ForgeFedStore.merge_request_json(mr, config).to_json
        end

        get "/merge-requests/:id/diff" do |env|
          mr = ForgeFedStore.find_merge_request(env.params.url["id"], config)
          unless mr
            env.response.status_code = 404
            next("Merge request not found")
          end
          patch_set = ForgeFedStore.current_patch_set(mr.id, config)
          unless patch_set && File.exists?(patch_set.diff_path)
            env.response.status_code = 404
            next("Diff not found")
          end

          env.response.content_type = "text/x-diff; charset=utf-8"
          File.read(patch_set.diff_path)
        end

        get "/patch-sets/:id" do |env|
          env.response.content_type = "application/activity+json"
          patch_set = ForgeFedStore.find_patch_set(env.params.url["id"], config)
          unless patch_set
            env.response.status_code = 404
            next({error: "Patch set not found"}.to_json)
          end

          ForgeFedStore.patch_set_json(patch_set, config).to_json
        end

        get "/patch-files/:id" do |env|
          patch_file = ForgeFedStore.find_patch_file(env.params.url["id"], config)
          unless patch_file && File.exists?(patch_file.file_path)
            env.response.status_code = 404
            next("Patch file not found")
          end

          env.response.content_type = "text/x-diff; charset=utf-8"
          File.read(patch_file.file_path)
        end
      end

      private def self.render_outbox(env, actor_uri : String, config : Utils::Config) : String
        page = env.params.query["page"]?.try(&.to_i?) || 1
        total = ForgeFedStore.activity_total(actor_uri, config)
        activities = ForgeFedStore.list_activities(actor_uri, page, config)
        page_payload = Aptok.ordered_collection_page(
          "#{actor_uri}/outbox?page=#{page}",
          "#{actor_uri}/outbox",
          activities.compact_map(&.as_h?),
          (page * ForgeFedStore::OUTBOX_PAGE_SIZE) < total ? "#{actor_uri}/outbox?page=#{page + 1}" : nil
        )
        page_payload["totalItems"] = Aptok.json(total)
        page_payload["first"] = Aptok.json("#{actor_uri}/outbox?page=1") if total > 0
        page_payload.to_json
      end
    end
  end
end

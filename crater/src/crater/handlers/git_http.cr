require "compress/gzip"
require "kemal"
require "../repository_store"
require "../utils/config"

module Crater
  module Handlers
    module GitHttp
      def self.register(config : Utils::Config)
        get "/@:owner/:slug/HEAD" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), "HEAD")
        end

        get "/@:owner/:slug/info/refs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("info", "refs"))
        end

        get "/@:owner/:slug/packed-refs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), "packed-refs")
        end

        get "/@:owner/:slug/objects/info/packs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("objects", "info", "packs"))
        end

        get "/@:owner/:slug/objects/pack/:name" do |env|
          serve_binary(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("objects", "pack", env.params.url["name"]))
        end

        get "/@:owner/:slug/objects/:prefix/:name" do |env|
          serve_binary(
            env,
            resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config),
            File.join("objects", env.params.url["prefix"], env.params.url["name"])
          )
        end

        get "/:owner/:slug/HEAD" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), "HEAD")
        end

        get "/:owner/:slug/info/refs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("info", "refs"))
        end

        get "/:owner/:slug/packed-refs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), "packed-refs")
        end

        get "/:owner/:slug/objects/info/packs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("objects", "info", "packs"))
        end

        get "/:owner/:slug/objects/pack/:name" do |env|
          serve_binary(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("objects", "pack", env.params.url["name"]))
        end

        get "/:owner/:slug/objects/:prefix/:name" do |env|
          serve_binary(
            env,
            resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config),
            File.join("objects", env.params.url["prefix"], env.params.url["name"])
          )
        end

        get "/git/:owner/:slug/HEAD" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), "HEAD")
        end

        get "/git/:owner/:slug/info/refs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("info", "refs"))
        end

        get "/git/:owner/:slug/packed-refs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), "packed-refs")
        end

        get "/git/:owner/:slug/objects/info/packs" do |env|
          serve_text(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("objects", "info", "packs"))
        end

        get "/git/:owner/:slug/objects/pack/:name" do |env|
          serve_binary(env, resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config), File.join("objects", "pack", env.params.url["name"]))
        end

        get "/git/:owner/:slug/objects/:prefix/:name" do |env|
          serve_binary(
            env,
            resolve_public_repo_path_for_owner(env.params.url["owner"], env.params.url["slug"], config),
            File.join("objects", env.params.url["prefix"], env.params.url["name"])
          )
        end

        get "/git/:slug/HEAD" do |env|
          serve_text(env, resolve_public_repo_path(env.params.url["slug"], config), "HEAD")
        end

        get "/git/:slug/info/refs" do |env|
          serve_text(env, resolve_public_repo_path(env.params.url["slug"], config), File.join("info", "refs"))
        end

        get "/git/:slug/packed-refs" do |env|
          serve_text(env, resolve_public_repo_path(env.params.url["slug"], config), "packed-refs")
        end

        get "/git/:slug/objects/info/packs" do |env|
          serve_text(env, resolve_public_repo_path(env.params.url["slug"], config), File.join("objects", "info", "packs"))
        end

        get "/git/:slug/objects/pack/:name" do |env|
          serve_binary(env, resolve_public_repo_path(env.params.url["slug"], config), File.join("objects", "pack", env.params.url["name"]))
        end

        get "/git/:slug/objects/:prefix/:name" do |env|
          serve_binary(
            env,
            resolve_public_repo_path(env.params.url["slug"], config),
            File.join("objects", env.params.url["prefix"], env.params.url["name"])
          )
        end

        get "/git/*archive_path" do |env|
          serve_git_archive_path(env, env.params.url["archive_path"], config)
        end

        get "/*archive_path" do |env|
          serve_public_archive_path(env, env.params.url["archive_path"], config)
        end
      end

      private def self.parse_archive_name(raw_name : String) : {String, String}?
        case
        when raw_name.ends_with?(".tar.gz")
          {raw_name[0, raw_name.bytesize - ".tar.gz".bytesize], "tar.gz"}
        when raw_name.ends_with?(".tar.zst")
          {raw_name[0, raw_name.bytesize - ".tar.zst".bytesize], "tar.zst"}
        when raw_name.ends_with?(".zip")
          {raw_name[0, raw_name.bytesize - ".zip".bytesize], "zip"}
        else
          nil
        end
      end

      private def self.serve_owner_archive(env, raw_owner : String, raw_name : String, config : Utils::Config) : String
        parsed = parse_archive_name(raw_name)
        unless parsed
          env.response.status_code = 404
          return "Not found"
        end

        slug, format = parsed
        serve_archive(env, resolve_repo_path_for_owner(raw_owner, slug, config), slug, format)
      end

      private def self.serve_slug_archive(env, raw_name : String, config : Utils::Config) : String
        parsed = parse_archive_name(raw_name)
        unless parsed
          env.response.status_code = 404
          return "Not found"
        end

        slug, format = parsed
        serve_archive(env, resolve_repo_path(slug, config), slug, format)
      end

      private def self.serve_git_archive_path(env, raw_path : String, config : Utils::Config) : String
        normalized_path = raw_path.sub(/\A\/+/, "")
        segments = normalized_path.split('/', 2)

        if segments.size >= 2
          serve_owner_archive(env, segments[0], segments[1], config)
        else
          serve_slug_archive(env, normalized_path, config)
        end
      end

      private def self.serve_public_archive_path(env, raw_path : String, config : Utils::Config) : String
        normalized_path = raw_path.sub(/\A\/+/, "")
        segments = normalized_path.split('/', 2)
        unless segments.size >= 2
          env.response.status_code = 404
          return "Not found"
        end

        serve_owner_archive(env, segments[0].sub(/\A@+/, ""), segments[1], config)
      end

      private def self.normalize_slug(raw_slug : String) : String
        raw_slug.sub(/\.git\z/, "")
      end

      private def self.resolve_public_repo_path(raw_slug : String, config : Utils::Config) : String?
        repository = RepositoryStore.find_by_slug(normalize_slug(raw_slug), config)
        return nil unless repository
        return nil unless repository.visibility == "public"

        repository.repo_path
      end

      private def self.resolve_repo_path(raw_slug : String, config : Utils::Config) : String?
        repository = RepositoryStore.find_by_slug(normalize_slug(raw_slug), config)
        return nil unless repository

        repository.repo_path
      end

      private def self.resolve_public_repo_path_for_owner(raw_owner : String, raw_slug : String, config : Utils::Config) : String?
        repository = RepositoryStore.find_by_owner_and_project_clone_name(raw_owner, normalize_slug(raw_slug), config)
        return nil unless repository
        return nil unless repository.visibility == "public"

        repository.repo_path
      end

      private def self.resolve_repo_path_for_owner(raw_owner : String, raw_slug : String, config : Utils::Config) : String?
        repository = RepositoryStore.find_by_owner_and_project_clone_name(raw_owner, normalize_slug(raw_slug), config)
        return nil unless repository

        repository.repo_path
      end

      private def self.safe_join(root : String, relative_path : String) : String?
        candidate = File.expand_path(File.join(root, relative_path))
        candidate.starts_with?(File.expand_path(root)) ? candidate : nil
      end

      private def self.serve_text(env, repo_path : String?, relative_path : String) : String
        file_path = resolve_file_path(repo_path, relative_path)
        unless file_path
          env.response.status_code = 404
          return "Not found"
        end

        env.response.content_type = "text/plain; charset=utf-8"
        File.read(file_path)
      end

      private def self.serve_binary(env, repo_path : String?, relative_path : String) : String
        file_path = resolve_file_path(repo_path, relative_path)
        unless file_path
          env.response.status_code = 404
          return "Not found"
        end

        env.response.content_type = "application/octet-stream"
        File.read(file_path)
      end

      private def self.serve_archive(env, repo_path : String?, raw_slug : String, format : String) : String
        unless repo_path && Dir.exists?(repo_path)
          env.response.status_code = 404
          return "Not found"
        end

        slug = normalize_slug(raw_slug)
        data, extension, content_type = build_archive(repo_path, format)
        env.response.content_type = content_type
        env.response.headers["Content-Disposition"] = %(attachment; filename="#{slug}.#{extension}")
        data
      rescue error
        env.response.status_code = 500
        error.message || "Failed to create archive"
      end

      private def self.build_archive(repo_path : String, format : String) : {String, String, String}
        case format
        when "zip"
          {run_git_archive(repo_path, "zip"), "zip", "application/zip"}
        when "tar.gz"
          tar_data = run_git_archive(repo_path, "tar")
          output = IO::Memory.new
          Compress::Gzip::Writer.open(output) do |gzip|
            gzip.write(tar_data.to_slice)
          end
          {output.to_s, "tar.gz", "application/gzip"}
        when "tar.zst"
          tar_data = run_git_archive(repo_path, "tar")
          output = IO::Memory.new
          error = IO::Memory.new
          input = IO::Memory.new(tar_data)
          status = Process.run("zstd", {"-q", "-z", "-c"}, input: input, output: output, error: error)
          unless status.success?
            raise(error.to_s.presence || output.to_s.presence || "zstd compression failed")
          end
          {output.to_s, "tar.zst", "application/zstd"}
        else
          raise "Unsupported archive format"
        end
      rescue ex : File::NotFoundError
        raise "zstd is not installed"
      end

      private def self.run_git_archive(repo_path : String, format : String) : String
        output = IO::Memory.new
        error = IO::Memory.new
        status = Process.run(
          "git",
          {"--git-dir", repo_path, "archive", "--format=#{format}", "HEAD"},
          output: output,
          error: error
        )

        unless status.success?
          raise(error.to_s.presence || output.to_s.presence || "git archive failed")
        end

        output.to_s
      end

      private def self.resolve_file_path(repo_path : String?, relative_path : String) : String?
        return nil unless repo_path

        file_path = safe_join(repo_path, relative_path)
        return nil unless file_path
        return nil unless File.exists?(file_path)

        file_path
      end
    end
  end
end

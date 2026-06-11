require "./spec_helper"
require "aptok/testing"
require "file_utils"
require "../src/crater/repository_store"

private def run_git(args : Array(String), chdir : String? = nil) : String
  output = IO::Memory.new
  error = IO::Memory.new
  status = if chdir
             Process.run("git", args, chdir: chdir, output: output, error: error)
           else
             Process.run("git", args, output: output, error: error)
           end
  raise "git #{args.join(' ')} failed: #{error}" unless status.success?
  output.to_s
end

private def build_record(repo_path : String) : Lepos::RepositoryStore::RepositoryRecord
  now = Time.utc.to_rfc3339
  Lepos::RepositoryStore::RepositoryRecord.new(
    id: "test-id",
    project_id: "owner/repo",
    order_id: "test-order",
    slug: "owner-repo",
    name: "repo",
    visibility: "public",
    default_branch: "main",
    server_uuid: "test-uuid",
    public_clone_url: nil,
    ssh_clone_url: nil,
    repo_path: repo_path,
    created_at: now,
    updated_at: now
  )
end

describe "Lepos::RepositoryStore.git_clone_mirror!" do
  it "mirrors a remote repository into the record's bare repo path" do
    workspace = File.join(Dir.tempdir, "lepos-import-#{Random::Secure.hex(6)}")
    source_path = File.join(workspace, "source")
    target_path = File.join(workspace, "owner", "repo.git")

    begin
      # Build a source repository with a single commit on the main branch and a feature branch.
      FileUtils.mkdir_p(source_path)
      run_git(["init", "--initial-branch=main", source_path])
      run_git(["config", "user.email", "test@example.com"], chdir: source_path)
      run_git(["config", "user.name", "Test"], chdir: source_path)
      File.write(File.join(source_path, "README.md"), "hello\n")
      run_git(["add", "README.md"], chdir: source_path)
      run_git(["commit", "-m", "initial"], chdir: source_path)
      run_git(["branch", "feature"], chdir: source_path)

      record = build_record(target_path)
      Lepos::RepositoryStore.git_clone_mirror!(record, source_path)

      # The bare repo exists and is a mirror of the source.
      Dir.exists?(target_path).should be_true
      remotes = run_git(["--git-dir", target_path, "remote", "-v"])
      remotes.should contain(source_path)

      # Branches discovered from the source are present in the mirror.
      branches = run_git(["--git-dir", target_path, "branch", "--format=%(refname:short)"])
      branches.should contain("main")
      branches.should contain("feature")

      # Receive hooks are installed and executable.
      hook_path = File.join(target_path, "hooks", "post-receive")
      File.exists?(hook_path).should be_true
      File.info(hook_path).permissions.value.should eq(0o755)
    ensure
      FileUtils.rm_rf(workspace)
    end
  end

  it "detects a non-main trunk (e.g. master) as the mirror's default branch" do
    # Regression: imported repositories frequently use "master" as their trunk.
    # ForgeFed sync must adopt the real trunk as the default branch, otherwise
    # it opens a spurious merge request for the trunk itself. The detection must
    # read the mirror's HEAD rather than assuming "main".
    workspace = File.join(Dir.tempdir, "lepos-import-#{Random::Secure.hex(6)}")
    source_path = File.join(workspace, "source")
    target_path = File.join(workspace, "owner", "repo.git")

    begin
      FileUtils.mkdir_p(source_path)
      run_git(["init", "--initial-branch=master", source_path])
      run_git(["config", "user.email", "test@example.com"], chdir: source_path)
      run_git(["config", "user.name", "Test"], chdir: source_path)
      File.write(File.join(source_path, "README.md"), "hello\n")
      run_git(["add", "README.md"], chdir: source_path)
      run_git(["commit", "-m", "initial"], chdir: source_path)

      record = build_record(target_path)
      Lepos::RepositoryStore.git_clone_mirror!(record, source_path)

      Lepos::RepositoryStore.detect_mirror_default_branch(target_path).should eq("master")
    ensure
      FileUtils.rm_rf(workspace)
    end
  end

  it "detects main as the default branch for a main-trunk mirror" do
    workspace = File.join(Dir.tempdir, "lepos-import-#{Random::Secure.hex(6)}")
    source_path = File.join(workspace, "source")
    target_path = File.join(workspace, "owner", "repo.git")

    begin
      FileUtils.mkdir_p(source_path)
      run_git(["init", "--initial-branch=main", source_path])
      run_git(["config", "user.email", "test@example.com"], chdir: source_path)
      run_git(["config", "user.name", "Test"], chdir: source_path)
      File.write(File.join(source_path, "README.md"), "hello\n")
      run_git(["add", "README.md"], chdir: source_path)
      run_git(["commit", "-m", "initial"], chdir: source_path)

      record = build_record(target_path)
      Lepos::RepositoryStore.git_clone_mirror!(record, source_path)

      Lepos::RepositoryStore.detect_mirror_default_branch(target_path).should eq("main")
    ensure
      FileUtils.rm_rf(workspace)
    end
  end

  it "returns nil when the mirror has no resolvable HEAD" do
    workspace = File.join(Dir.tempdir, "lepos-import-#{Random::Secure.hex(6)}")
    missing_path = File.join(workspace, "owner", "missing.git")

    begin
      Lepos::RepositoryStore.detect_mirror_default_branch(missing_path).should be_nil
    ensure
      FileUtils.rm_rf(workspace)
    end
  end

  it "replaces existing bare repository contents when re-cloning" do
    workspace = File.join(Dir.tempdir, "lepos-import-#{Random::Secure.hex(6)}")
    source_path = File.join(workspace, "source")
    target_path = File.join(workspace, "owner", "repo.git")

    begin
      FileUtils.mkdir_p(source_path)
      run_git(["init", "--initial-branch=main", source_path])
      run_git(["config", "user.email", "test@example.com"], chdir: source_path)
      run_git(["config", "user.name", "Test"], chdir: source_path)
      File.write(File.join(source_path, "README.md"), "hello\n")
      run_git(["add", "README.md"], chdir: source_path)
      run_git(["commit", "-m", "initial"], chdir: source_path)

      record = build_record(target_path)
      # Pre-seed the target path with a stale empty bare repo.
      FileUtils.mkdir_p(target_path)
      run_git(["init", "--bare", target_path])

      Lepos::RepositoryStore.git_clone_mirror!(record, source_path)

      log = run_git(["--git-dir", target_path, "log", "--oneline"])
      log.should contain("initial")
    ensure
      FileUtils.rm_rf(workspace)
    end
  end
end

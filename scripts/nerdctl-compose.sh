#!/usr/bin/env bash
set -euo pipefail

runtime_dir="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
rootless_state_dir="${ROOTLESSKIT_STATE_DIR:-$runtime_dir/containerd-rootless}"
child_pid_file="$rootless_state_dir/child_pid"

nerdctl_healthy() {
  nerdctl info >/dev/null 2>&1
}

repair_rootless_containerd() {
  if ! command -v containerd-rootless-setuptool.sh >/dev/null 2>&1; then
    return 1
  fi

  echo "Detected broken rootless nerdctl/containerd state. Repairing..."
  if ! systemctl --user --version >/dev/null 2>&1; then
    echo "Rootless containerd repair requires a user systemd session." >&2
    echo "Run this in a normal user shell, not a restricted sandbox." >&2
    return 1
  fi

  containerd-rootless-setuptool.sh install >/dev/null
}

if ! nerdctl_healthy; then
  should_repair=0

  if [ -f "$child_pid_file" ]; then
    child_pid="$(cat "$child_pid_file" 2>/dev/null || true)"
    if [ -n "$child_pid" ] && ! kill -0 "$child_pid" 2>/dev/null; then
      should_repair=1
    fi
  else
    should_repair=1
  fi

  if [ "$should_repair" -eq 1 ]; then
    repair_rootless_containerd || {
      echo "Failed to repair rootless containerd automatically." >&2
      echo "Run: mise run container:repair" >&2
      exit 1
    }
  fi

  if ! nerdctl_healthy; then
    echo "nerdctl is still not healthy after repair attempt." >&2
    echo "Run: mise run container:repair" >&2
    exit 1
  fi
fi

exec nerdctl compose "$@"

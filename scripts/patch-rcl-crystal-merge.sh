#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
target="${1:-$repo_root/crater/lib/rcl/src/rcl/document.cr}"

if [ ! -f "$target" ]; then
  echo "RCL document source not found: $target" >&2
  exit 1
fi

# cogniframework/rcl.cr release currently has a Hash#merge block that fails
# Crystal type checking; keep the shard external while applying the prior fix.
if grep -Fq 'result[child.name] = child_h.merge(existing) { |_k, left, right| right }' "$target"; then
  perl -0pi -e 's/          result\[child\.name\] = child_h\.merge\(existing\) \{ \|_k, left, right\| right \}/          merged = child_h.dup\n          existing.each do |k, v|\n            merged[k] = v\n          end\n          result[child.name] = merged/' "$target"
fi

if grep -Fq 'result[child.name] = child_h.merge(existing)' "$target"; then
  echo "Failed to patch RCL Crystal merge compatibility issue in $target" >&2
  exit 1
fi

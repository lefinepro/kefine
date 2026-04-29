#!/usr/bin/env bash
set -euo pipefail

if command -v docker-compose >/dev/null 2>&1; then
  exec docker-compose "$@"
fi

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
fi

if command -v nerdctl >/dev/null 2>&1; then
  exec ./scripts/nerdctl-compose.sh "$@"
fi

echo "No Docker compose runtime found." >&2
exit 1

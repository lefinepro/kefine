#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_CONTAINER_IMAGE="node:22-alpine"

docker run --rm \
  -v "${PROJECT_ROOT}:/workspace" \
  -w /workspace \
  "${NODE_CONTAINER_IMAGE}" \
  sh -lc "corepack enable && yarn install && yarn build"
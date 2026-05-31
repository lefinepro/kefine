#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

cleanup() {
  ./scripts/container-compose.sh down -v --remove-orphans
}

trap cleanup EXIT

./scripts/container-compose.sh up -d postgres crater

for attempt in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:3001/health >/dev/null; then
    break
  fi

  if [ "$attempt" -eq 60 ]; then
    echo "crater health check did not become ready" >&2
    exit 1
  fi

  sleep 2
done

create_response="$(curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"title":"CI smoke order","content":"CI smoke order"}' \
  http://127.0.0.1:3001/create)"

order_id="$(python3 -c 'import json,sys; print(json.loads(sys.stdin.read())["orderId"])' <<<"$create_response")"

status_response="$(curl -fsS "http://127.0.0.1:3001/status?id=${order_id}")"
api_status_response="$(curl -fsS "http://127.0.0.1:3001/api/status/${order_id}")"

python3 - "$order_id" "$status_response" "$api_status_response" <<'PY'
import json
import sys

order_id = sys.argv[1]
responses = [json.loads(sys.argv[2]), json.loads(sys.argv[3])]

for payload in responses:
    assert payload["orderId"] == order_id, payload
    assert payload["status"], payload
    assert "@context" not in payload, payload
    assert payload.get("error") is None, payload
PY

vcs_create_response="$(curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"title":"CI repository-disabled order","content":"CI repository-disabled order","vcsEnabled":true}' \
  http://127.0.0.1:3001/create)"

vcs_order_id="$(python3 -c 'import json,sys; print(json.loads(sys.stdin.read())["orderId"])' <<<"$vcs_create_response")"
vcs_status_response="$(curl -fsS "http://127.0.0.1:3001/status?id=${vcs_order_id}")"
vcs_settings_response="$(curl -fsS \
  -X PATCH \
  -H 'Content-Type: application/json' \
  -d '{"vcsEnabled":true}' \
  "http://127.0.0.1:3001/status/${vcs_order_id}/settings")"

python3 - "$vcs_order_id" "$vcs_create_response" "$vcs_status_response" "$vcs_settings_response" <<'PY'
import json
import sys

order_id = sys.argv[1]
responses = [json.loads(value) for value in sys.argv[2:]]

for payload in responses:
    assert payload.get("orderId") == order_id, payload
    assert payload.get("vcsEnabled") is False, payload
    assert payload.get("projectId") in (None, ""), payload
    assert payload.get("repository") is None, payload
PY

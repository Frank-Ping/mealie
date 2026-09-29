#!/usr/bin/env bash
# Start a throwaway Mealie backend that serves a pre-built SPA, for the E2E yardstick.
#
#   E2E_STATIC_DIR  built SPA to serve (default: frontend/dist, i.e. `pnpm generate` output of the Vue app).
#                   Point this at the React build later to run the exact same suite against it.
#   E2E_PORT        port to listen on (default 9091, so it never collides with `task py` on 9000)
#   E2E_DATA_DIR    data dir; wiped on every start so each run begins from an empty database
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATIC_DIR="$(realpath "${E2E_STATIC_DIR:-$REPO_ROOT/frontend/dist}")"
PORT="${E2E_PORT:-9091}"
DATA_DIR="${E2E_DATA_DIR:-$REPO_ROOT/frontend-e2e/.data}"

if [[ ! -f "$STATIC_DIR/index.html" ]]; then
  echo "No built SPA at $STATIC_DIR (missing index.html). Build the frontend first." >&2
  exit 1
fi

rm -rf "$DATA_DIR"
mkdir -p "$DATA_DIR"

cd "$REPO_ROOT"
export PRODUCTION=true TESTING=false
export DATA_DIR STATIC_FILES="$STATIC_DIR" API_PORT="$PORT" BASE_URL="http://localhost:$PORT"
export DB_ENGINE=sqlite ALLOW_SIGNUP=true LOG_LEVEL=warning TZ=UTC
exec uv run --frozen uvicorn mealie.app:app --host 127.0.0.1 --port "$PORT" --workers 1 --log-level warning

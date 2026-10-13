#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/runtime-env.sh"
cd "$WF4_SOURCE_REPO/frontend"
pnpm exec vitest run --maxWorkers=4 --coverage --coverage.reporter=json-summary --coverage.reporter=text-summary --coverage.reportsDirectory="$WF4_WORKSPACE/wf4-r2-evidence/coverage" > "$WF4_WORKSPACE/wf4-r2-evidence/coverage.log" 2>&1
tail -n 14 "$WF4_WORKSPACE/wf4-r2-evidence/coverage.log"

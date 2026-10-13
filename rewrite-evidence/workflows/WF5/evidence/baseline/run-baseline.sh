#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/runtime-env.sh"
exec > >(tee "$WF4_WORKSPACE/wf4-r2-evidence/measurement.log") 2>&1
source_repo="$WF4_SOURCE_REPO"
evaluator_repo="$WF4_EVALUATOR_REPO"
[[ "$(git -C "$source_repo" rev-parse HEAD)" == 4b9ca06b6581f7152e164ea0fd9d4da366975a79 ]]
[[ "$(git -C "$evaluator_repo" rev-parse HEAD)" == 758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d ]]
[[ -z "$(git -C "$source_repo" status --porcelain -- frontend mealie)" ]]
[[ -z "$(git -C "$evaluator_repo" diff -- frontend-e2e rewrite-evidence/measure.sh)" ]]
export E2E_DATA_DIR="$evaluator_repo/frontend-e2e/.data-wf4-r2-baseline"
resolved_data="$(realpath -m "$E2E_DATA_DIR")"
[[ "$resolved_data" == "$evaluator_repo/frontend-e2e/.data-wf4-r2-baseline" ]]
if [[ -e "$E2E_DATA_DIR" ]]; then
  printf 'The disposable data directory already exists; inspect before reusing it.\n' >&2
  exit 2
fi
export E2E_PORT=9091 E2E_ROUTE_SCOPE=all E2E_ROUTE_CHECK=strict
export UV_PROJECT_ENVIRONMENT="$evaluator_repo/.venv"
export UV_NO_SYNC=1
cd "$evaluator_repo"
cp rewrite-evidence/metrics.csv "$WF4_WORKSPACE/wf4-r2-evidence/metrics-before-run.csv"
bash rewrite-evidence/measure.sh --app "$source_repo/frontend" --label WF4-R2-Vue-baseline --route-scope all --route-check strict
mkdir -p "$WF4_WORKSPACE/wf4-r2-evidence/runs"
cp rewrite-evidence/metrics.csv "$WF4_WORKSPACE/wf4-r2-evidence/metrics.csv"
run_id="$(tail -n 1 rewrite-evidence/metrics.csv | cut -d, -f26)"
[[ -d "rewrite-evidence/runs/$run_id" ]]
cp -a "rewrite-evidence/runs/$run_id" "$WF4_WORKSPACE/wf4-r2-evidence/runs/"

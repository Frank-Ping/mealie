#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/runtime-env.sh"
for source_checkout in "$WF4_WORKSPACE/mealie-wf4-rerun" "$WF4_SOURCE_REPO"; do
  [[ "$(git -C "$source_checkout" rev-parse HEAD)" == 4b9ca06b6581f7152e164ea0fd9d4da366975a79 ]]
  git -C "$source_checkout" diff --exit-code -- frontend mealie
done
for evaluator_checkout in "$WF4_WORKSPACE/mealie-wf4-evaluator" "$WF4_EVALUATOR_REPO"; do
  [[ "$(git -C "$evaluator_checkout" rev-parse HEAD)" == 758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d ]]
  git -C "$evaluator_checkout" diff --exit-code -- frontend-e2e rewrite-evidence/measure.sh mealie pyproject.toml uv.lock
done
printf 'PASS: canonical and execution source/evaluator inputs match their pinned commits.\n' | tee "$WF4_WORKSPACE/wf4-r2-evidence/input-verification.log"

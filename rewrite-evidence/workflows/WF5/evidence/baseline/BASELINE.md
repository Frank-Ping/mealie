# WF4 R2 Vue baseline

Steps 1 and 2 are complete. The original Vue source was measured without modification. No conversion rules or React rewrite have been started.

## Fixed versions

- Source commit: `4b9ca06b6581f7152e164ea0fd9d4da366975a79`.
- Branch: `rewrite/wf4-codemod-rerun`.
- Evaluator commit: `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`.
- Node 24.19.0; pnpm 11.23.0; Python 3.14.4; uv 0.11.26; Playwright 1.63.0.

## Fresh results

| Measurement | Result |
| --- | --- |
| Build | Passed, 14 seconds |
| Unit tests | 517 passed, 0 failed, 0 skipped |
| Lint | 0 errors, 0 warnings |
| Vue type checker | 314 diagnostics; exit 2 |
| Routes, all scopes, strict | 66/66 |
| User flows | 15/15 |
| Playwright total | 82 passed: 66 routes, 15 flows, 1 route-table guard |
| Statement coverage | 15.1% (1959/12968) |
| Page statement coverage | 1.82% |
| Composable statement coverage | 49.45% |
| Static counters | any 88; TODO 16; expect 817; test files 48 |
| Measurement duration | 210 seconds, excluding initial tool/backend/browser setup and separate coverage run |
| Source dirty flag | 0 |

## Evidence

- Run ID: `20261013T085845Z-source_frontend-WF4-R2-Vue-baseline`.
- Raw results: `runs/20261013T085845Z-source_frontend-WF4-R2-Vue-baseline/`.
- `metrics.csv` retains historical evaluator rows and appends the new WF4-R2 baseline.
- `metrics-before-run.csv` separates the historical rows from this run.
- `baseline.json` was independently checked against the saved Vitest, ESLint, Playwright and type-checker reports.
- `coverage/coverage-summary.json` and `coverage.log` come from a separate fresh coverage execution of the same 517 tests.
- `environment.json` records fixed inputs, hashes and the actual execution environment.
- `measurement.log` and `dependencies.log` retain execution and preparation logs.

## Interpretation and limits

The type checker does not pass at baseline. These 314 diagnostics are present before rewriting and must not be described as regressions introduced by WF4-R2. The older group record has 315; the exact reason for the one-diagnostic difference has not been established, and this new result is retained without changing source or tests.

The tests used the real local FastAPI backend with a fresh disposable SQLite database and browser. The backend was stopped by Playwright after the run; this is evidence of a completed browser run, not an ongoing deployed app.

Canonical source and evaluator checkouts remain in the Windows workspace. Dependency preparation on OneDrive was slow, so execution used identical pinned-commit copies in WSL /var/tmp. The execution path is recorded in `execution-root.txt`. No runtime input or test assertion was modified.

The evaluator is newer than the historical WF4 branch point, and available WSL memory is about 15 GiB instead of the earlier 3.8 GiB environment. Use the same evaluator and environment for subsequent WF4-R2 checkpoints, and acknowledge these differences in comparisons with earlier workflows.

The next stage is Phase A: write and review the rule catalogue. The original baseline code and evidence should remain unchanged.

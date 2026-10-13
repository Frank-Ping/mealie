# WF4 R2 setup and baseline procedure

This experiment repeats the rule-driven Vue-to-React workflow from its original source starting point. The current task covers checkout setup and measurement of the unchanged Vue reference. Rule design and rewriting have not started.

## Fixed inputs

| Input | Value |
| --- | --- |
| Source directory | `../mealie-wf4-rerun/` |
| Source commit | `4b9ca06b6581f7152e164ea0fd9d4da366975a79` |
| Source branch | `rewrite/wf4-codemod-rerun` |
| Evaluator directory | `../mealie-wf4-evaluator/` |
| Evaluator commit | `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d` |
| Target | Vite, React 19, strict TypeScript, React Router SPA, MUI, react-i18next |
| Node | 24.19.0, Linux x64 |
| pnpm | 11.23.0 |
| uv | 0.11.26 |
| Python | Ubuntu CPython 3.14.4 |
| Browser | The Chromium revision installed by frozen Playwright 1.63.0 |

The source and evaluator are independent shallow checkouts without Git remotes. Public commits were fetched with credential helpers disabled. Repository source files and evaluation assertions are unchanged.

An initial dependency installation on the OneDrive-mounted filesystem was stopped before any measurement because file installation was slow. Its log is retained as `dependencies-onedrive-attempt.log`. The actual measurement runs on independent, byte-identical fixed-commit copies in a new WSL `<EXECUTION_COPY>` directory. `execution-root.txt` and `environment.json` record that location. Node, uv, their caches and the Playwright browser are local to that execution directory; pnpm uses its normal shared WSL content-addressable store, whose path is recorded. The Windows checkouts remain the canonical experiment source and evaluator inputs.

The evaluator version is newer than the historical WF4 branch point. It contains the shared 66-route, 15-flow yardstick and its recorded evaluation refinements. Use this same pinned evaluator for the new Vue baseline and subsequent WF4-R2 checkpoints. Do not describe this as an exact repeat of the first run's evaluation conditions.

## Environment preparation

Ubuntu WSL was already installed. Its build dependencies were installed for the frozen `python-ldap` requirement:

```bash
apt-get update
apt-get install -y --no-install-recommends build-essential python3-dev libldap-dev libsasl2-dev libssl-dev pkg-config ca-certificates
```

WSL service access, public downloads and Ubuntu package installation required approved execution outside the Windows sandbox. This setup task did not run a rewrite agent with production or upstream credentials.

The project-local scripts are invoked from Windows PowerShell with WSL. For example:

```powershell
wsl -d Ubuntu --exec bash '<WORKSPACE>/wf4-r2-evidence/bootstrap-runtime.sh'
wsl -d Ubuntu --exec bash '<WORKSPACE>/wf4-r2-evidence/prepare-dependencies.sh'
wsl -d Ubuntu --exec bash '<WORKSPACE>/wf4-r2-evidence/capture-environment.sh'
```

Node and uv downloads are checked against their published SHA256 files. Backend and JavaScript dependency installations use frozen lockfiles. `environment.json` records commit IDs, lockfile/checker hashes and actual tool versions. `dependencies.log` records package preparation.

The pinned Playwright installation also installed its required Ubuntu Chromium libraries through `pnpm exec playwright install-deps chromium` as root. No test configuration was changed. The temporary execution directory is retained for the upcoming workflow stages; canonical inputs and final evidence are retained in the Windows workspace.

## Measurement

`run-baseline.sh` verifies the pinned commits and unchanged source/checker files. It runs the shared `measure.sh` against the external Vue checkout with all routes and strict checks. The measurement script records install, build, unit tests, lint, type checking, static counters and browser results.

The backend uses a new disposable SQLite directory, `evaluator/frontend-e2e/.data-wf4-r2-baseline`, inside the temporary Linux execution directory, with localhost port 9091. The wrapper verifies that exact path and refuses an existing directory before the shared backend startup script can clear it. Existing Mealie data is not used.

```powershell
wsl -d Ubuntu --exec bash '<WORKSPACE>/wf4-r2-evidence/run-baseline.sh'
```

The primary results are saved in the execution evaluator's `rewrite-evidence/metrics.csv` and `rewrite-evidence/runs/<run-id>/`, then copied back here as `metrics.csv` and `runs/<run-id>/`. A pre-run CSV copy is also kept here to distinguish the new run from historical rows. Check `BASELINE.md` for the actual completion status and results.

A separate `run-coverage.sh` execution saves `coverage.log` and `coverage/coverage-summary.json`. The source and evaluator are verified again by `verify-frozen-inputs.sh`; `input-verification.log` records the final check.

The wrapper deliberately does not hide failures: missing reports are unavailable results, not zero errors. It also refuses to reuse the baseline data directory. For any justified additional run, assign a new label and fresh disposable data directory, and retain the first run.

## Reporting boundaries

Record this as shared setup/baseline preparation when comparing workflow token costs. The chat tool interface does not expose per-response token counters, but provider-reported counters were subsequently found in this conversation's local session log. The authorized recording window begins at the user's request on 2026-10-13T09:26:12.566Z. See workflow-sessions/USAGE.md and usage-summary.json. Earlier setup usage is outside this window, not zero. Other conversations/tools need separate original usage records; account usage percentages are not a substitute.

The rerun has more WSL memory than the original 3.8 GiB environment. Time and resource comparisons must acknowledge that difference. The source commit, package versions, checker version and acceptance criteria are frozen; no React implementation is copied from another workflow.


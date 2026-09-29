# Baseline — Vue frontend before the rewrite

Recorded 2026-09-30 on branch `rewrite/phase0-baseline`, base commit `b18db97a2` (`mealie-next`, 2026-09-29).
Environment: WSL2, 16 vCPU, **3.8 GiB RAM**, Node 22.23.1, pnpm 11.23.0, Claude Code 2.1.219.

## Summary

| Measure | Result | Command / log |
|---|---|---|
| Install | OK (8 s once cached) | `pnpm install --frozen-lockfile` → `pnpm-install.log` |
| Unit tests | **48 files, 517 tests, 517 pass, 0 fail** (45 s) | `vitest run --maxWorkers=4 --coverage` → `vitest.log`, `vitest-results.json.gz` |
| Coverage (statements) | **15.1 %** (1959 / 12968); branches 12.9 %, functions 7.9 %, lines 15.1 % | `coverage/coverage-summary.json` |
| Lint | **0 errors** (38 s) | `pnpm lint` → `lint.log` |
| Type check | **315 errors in 115 files** (74 s); not run in CI | `vue-tsc@2.2.0` + `typescript@5.9.3` → `vue-tsc.log` |
| Production build | **OK** (56 s), `.output/public` 15 MB, 357 JS chunks | `pnpm generate` → `generate.log` |

## Coverage by area

Unit tests almost only cover composables and small lib helpers; UI code has almost no coverage.

| Area | Files | Statements | Covered |
|---|---|---|---|
| pages | 67 | 3788 | **1.8 %** |
| components/Domain/Recipe | 71 | 3388 | 4.0 % |
| composables | 92 | 2993 | **49.4 %** |
| components/global | 40 | 691 | 6.7 % |
| lib/api | 55 | 529 | 19.3 % |
| components/Layout, layouts, ShoppingList, Mealplan, User, Household, Cookbook, Admin, QueryFilterBuilder | — | ~1300 | **0 %** |
| lib/validators, lib/sanitize, lib/recipe | 8 | 82 | 85–100 % |

Full table: `coverage-by-area.txt`.

## Codebase size (for progress denominators)

- 229 `.vue` files, ~36.9k lines: 66 pages, 158 components, 5 layouts
- 124 composable `.ts` files; 90 `lib/api` files (none import Vue/Nuxt)
- 201 / 229 `.vue` files use Vuetify (84 distinct `<v-*>` components)
- 139 `.vue` files rely on Nuxt auto-imports (use `ref`/`computed` without importing them)

## Notes / incidents during baseline

1. **pnpm auto-install on `pnpm exec`.** `pnpm-lock.yaml` (2026-09-29) was newer than `node_modules` (2026-09-23), so pnpm 11 ran an implicit `pnpm install` before vitest. With the npm registry answering in 10–14 s per request, this ran for ~12 min and was killed (exit 137), which also restarted the Claude Code session. Fixed by running `pnpm install --frozen-lockfile` explicitly first.
2. **Memory.** vitest defaults to one worker per CPU (16) on a 3.8 GiB machine; baseline was run with `--maxWorkers=4`. The same limit will cap how many parallel agents can run builds/tests at once in WF2.
3. **Type check is not part of the project's CI** (`.github/workflows/test-frontend.yml` runs only lint + tests; `task ui:check` = lint + test). `npx -p typescript@5.9.3 -p vue-tsc@2.2.0` still resolved TypeScript 7.0.2 from a stale npx cache and crashed (`ERR_PACKAGE_PATH_NOT_EXPORTED`); the working method was installing both pinned versions into a separate temp directory.

## E2E yardstick and metrics (added at `P0-e2e-green-on-vue`)

- **`frontend-e2e/`** — Playwright, framework-agnostic (roles / accessible names / visible text /
  tooltips only). Runs the real backend (`PRODUCTION=true`, fresh SQLite per run, port 9091) serving
  a built SPA from `E2E_STATIC_DIR`, the same way `mealie/routes/spa/` serves it in production.
  Fixture data is seeded through the REST API. See `frontend-e2e/README.md`.
  - Tier 1: **66/66** `[route]` tests pass on Vue (one per page file).
  - Tier 2: **15/15** `[flow]` tests pass on Vue.
  - Full suite ≈ 4 min with 2 workers. Retries are off. One flake found while writing the suite
    (shopping-list check-off saved in the background, lost on an immediate reload) and fixed by
    waiting for the save; 5/5 repeat runs green afterwards.
- **`rewrite-evidence/measure.sh`** appends one row per run to `rewrite-evidence/metrics.csv`; raw
  logs/reports go to `rewrite-evidence/runs/<run-id>/`. Row 0 (Vue, `P0-vue-baseline`) reproduces the
  numbers above: tsc 315, lint 0, unit 517/517, build OK (60 s), routes 66/66, flows 15/15,
  `any` 88, TODO-like 16, `expect(` 817 in 48 test files.
- **Observed in the Vue reference:** a non-admin who opens an `/admin/...` URL directly still gets
  the admin page shell (the `admin-only` middleware does not redirect on a hard load); every admin
  API call answers 403, so no data leaks. The yardstick therefore tests which admin links a member
  is offered rather than direct URL access.

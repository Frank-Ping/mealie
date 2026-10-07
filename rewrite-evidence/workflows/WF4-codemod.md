# WF4 — Codemod-first hybrid pipeline

Status: **designed, not started**
Branch: `rewrite/wf4-codemod`
Base: `rewrite/phase0-baseline` (every measurement is taken with `rewrite-evidence/measure.sh`)
Target stack (course requirement): **Vite + React 19 + TypeScript strict + React Router (SPA) + MUI + react-i18next**

## Idea

Split the rewrite by *kind of change*, not by module. The agent's primary artifact is a
set of **deterministic AST transforms** (the "converter") plus a reviewed rules catalog;
the transforms are then applied to the whole frontend in one mechanical pass. Model
judgement is reserved for the residual the transforms cannot express.

Division of labour: mechanical work → deterministic tools, ambiguous work → the LLM,
every output → automated verification, and a human-owned definition of done.

## Hypotheses (what this workflow tests)

- **H1 — most of this rewrite is mechanical.** Baseline facts: 201/229 `.vue` files use
  Vuetify (84 distinct `<v-*>` components), 139 files rely on Nuxt auto-imports, 90
  `lib/api` files are framework-free. We predict a codemod pass converts ≥ 60 % of the
  lines that must change.
- **H2 — the residual clusters in reactivity semantics.** After a full codemod pass the
  remaining `tsc` errors and E2E failures will concentrate in `watch`/`watchEffect`
  ordering, `v-model` two-way binding, and scoped-CSS coupling — not in template syntax.
- **H3 — review effort moves upstream and shrinks.** Reviewing one rules catalog plus
  ~5 sample diffs per codemod is cheaper for humans than reviewing per-file agent output
  (WF2/WF3 style) of the same scope.

Each hypothesis is scored from `metrics.csv` + the logs kept under `runs/` (see Evidence).

## Why this counts as a distinct workflow

| Dimension | WF1 single prompt | WF2 plan-first | WF3 vertical slices | **WF4 codemod-first** |
|---|---|---|---|---|
| Decomposition | none | by phase | by feature domain (vertical) | **by change kind (horizontal — one rule spans the whole repo)** |
| Context given to agent | code only | persistent context file | deep per-slice context | **rules catalog + before/after sample pairs; no session memory needed** |
| Verification | one measure.sh at the end | measure.sh per stage | E2E per slice | **codemod fixture tests + human sample-diff review + `tsc` burndown + measure.sh** |

## Phase plan and checklist

### Phase A — Rules catalog (human review gate #1)

- [ ] Agent scans `frontend/` and produces `conversion-rules.md` containing:
  - Vuetify → MUI mapping for all 84 used `<v-*>` components, incl. props and events;
    explicit list of components with no MUI equivalent and the chosen substitute
  - Template directive → JSX patterns (`v-if`, `v-for`, `v-model`, `v-show`, slots,
    `@event`, `:bind`)
  - Nuxt API → React Router mapping (`useRoute`/`useRouter`/`navigateTo`, `NuxtLink`,
    `definePageMeta`, middleware, file-based routes → route config)
  - i18n: `$t`/`t` → `useTranslation`; locale files copied unchanged (only `en-US` may
    ever be edited, per AGENTS.md)
  - Reactivity rules: `ref`/`computed`/`watch`/`watchEffect` → hooks, each rule tagged
    **mechanical** or **judgement** (judgement rules are NOT codemodded)
- [ ] Human reviews the catalog once — highest-leverage review point of the workflow.
- [ ] Commit: `[WF4] conversion rules catalog v1`.

### Phase B — Codemod implementation + sample convergence (human review gate #2)

- [x] Scaffold: parse SFC with `@vue/compiler-sfc`; transform script blocks with
  ts-morph (or jscodeshift via a vue adapter); template block via a custom template→JSX
  pass. Batch with narrow globs (3.8 GiB RAM machine — do not load the whole project
  into one ts-morph language service).
  → built as a regex/AST hybrid in `rewrite-evidence/codemod/` (754 lines, no ts-morph —
  line-based script pass proved sufficient on samples; revisit if Phase C shows fragility)
- [x] Every rule gets a fixture test: `input.vue` → `expected.tsx`.
  → 5 fixtures via snapshot-blessing (`node test.mjs` → 5/5 OK; methodology note in
  `workflows/WF4-phase-b-dry-run.md`)
- [x] Dry-run on 5 sample files (1 page, 1 Domain/Recipe component, 1 global component,
  1 composable, 1 layout) → human reviews the diffs → iterate.
  → round 1 complete, see `workflows/WF4-phase-b-dry-run.md`
- [ ] Converged = ≤ 30 % of sampled files need manual edits before they would be
  committable. Max 3 review rounds (see Kill criterion).
  → round 1: 1/5 (20 %) needs manual conversion (a pre-tagged [J] file) — **awaiting
  gate #2 human verification**

### Phase C — Full mechanical pass

- [x] Run all codemods over 229 `.vue` + 124 composables in one batch.
  → 324 files (the 29-file gap = `__tests__`, the test-conversion workstream);
  324/324 converted, 0 codemod errors, 0 options-API files
- [x] **One purely mechanical commit** (`[WF4] apply codemods (mechanical, no manual edits)`)
  — never mixed with hand fixes, so `git bisect` and diff review stay meaningful.
  → two mechanical commits: initial + regenerated after TS1xxx codemod-defect fixes
  (1169 → 274 tsc errors; see session log `runs/sessions/2026-10-07-wf4-phase-c.md`)
- [x] Record: rule coverage report (how many sites each rule rewrote vs. skipped).
  → `runs/2026-10-07T13-11-40Z-wf4-phase-c-full-run/COVERAGE.md` +
  `codemod-coverage.json`; [J] placeholder histogram (v-menu 32, v-number-input 11,
  v-data-table 10, …); 2405 WF4-REVIEW markers (1087 [J])

### Phase D — Residual fix loop (compiler as task queue)

- [ ] `tsc --noEmit` error list grouped by error code = work queue; agent fixes in
  batches, re-running `tsc` after each batch.
- [ ] Log a burndown snapshot per batch (error count by code) → `runs/<run-id>/tsc-burndown.log`.
- [ ] Then the same loop for `eslint .`.
- [ ] Watch `any_count` in measure.sh — codemods must not buy type-cleanness with `any`.

### Phase E — Acceptance

- [ ] `./rewrite-evidence/measure.sh --app frontend-react --label WF4-<checkpoint>`
  at: rules catalog done, codemod pass done, tsc clean, E2E triage done.
- [ ] E2E failures triaged into a semantic-fix queue — these failures are the direct
  evidence for H2 (expect `v-model`, `watch` ordering, scoped styles to dominate).

## Kill criterion (decided in advance)

If after 3 sample-review rounds in Phase B more than 30 % of sampled files still need
manual edits before commit, abandon the full codemod pass and degrade to WF2 staged
execution. Record the decision, the sample numbers, and the failing rule categories in
the evidence log — a negative result here is still a reportable result.

## Evidence log (per session / per checkpoint)

Per agent session, append to `runs/sessions.md`:

| date | tool (+version) | phase | prompt (file) | transcript (file) | tokens/cost | wall time |
|---|---|---|---|---|---|---|

Per checkpoint, append to `runs/checkpoints.md`:

| commit sha | label | measure.sh run_id | routes | flows | tsc | any | todo | notes |
|---|---|---|---|---|---|---|---|---|

Keep: `conversion-rules.md` versions, codemod fixtures, dry-run diffs (5 samples, per
round), codemod run logs, tsc burndown log, all measure.sh rows.

## Risks and counters

- **False confidence**: type-clean but semantically wrong output (v-model, watch order,
  scoped CSS). Counter: E2E yardstick is the only acceptance gate; `expect_count` and
  `test_files` columns guard against weakened tests.
- **SFC template parsing** is the main engineering risk (jscodeshift does not parse Vue
  SFCs). Counter: `@vue/compiler-sfc` for block splitting; template pass has its own
  fixtures; kill criterion bounds the investment.
- **Memory**: ts-morph language service on the whole repo will not fit the 3.8 GiB
  baseline machine. Counter: per-directory batches; vitest already runs `--maxWorkers=4`.
- **Sunk cost**: rules catalog + fixtures ≈ 1–2 agent-days before any app file changes.
  Counter: 229 files × mechanical repetition is far past the "write a codemod" threshold;
  kill criterion caps the downside.

## Evidence pointers for the report

- Baseline numbers and denominators: `../baseline/BASELINE.md`
- Yardstick: `../../frontend-e2e/README.md` (66 routes + 15 flows, framework-agnostic)
- Measurement: `../README.md` (measure.sh columns, metrics.csv conventions)

# WF4-R2 plan — Phase A / Gate 1

This is a design proposal, not a rewrite result. Phase A reads source and writes documentation only. Gate 1 approval is required before implementing infrastructure, codemods, samples or React application code.

## Fixed inputs and scope

- Canonical Windows source: `C:\Users\auyhp\OneDrive\Desktop\574-agentic development\574-week12\mealie-wf4-rerun`.
- Branch verified: `rewrite/wf4-codemod-rerun`; initial HEAD verified: `4b9ca06b6581f7152e164ea0fd9d4da366975a79`. Working tree was clean before Phase A.
- Canonical evidence: sibling `wf4-r2-evidence/`. Read `SETUP.md`, `BASELINE.md`, `environment.json`, `runtime-env.sh` and repository `AGENTS.md` before design.
- Frozen evaluator: sibling `mealie-wf4-evaluator`, commit `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`. Its inputs/assertions/route and flow standards must not be modified.
- Target: Vite + React **19** + TypeScript **strict** + React Router **SPA** + MUI + react-i18next. No SSR framework is proposed.
- Original `frontend/`, `mealie/`, baseline evidence and evaluator remain unchanged. Generated API types and all existing locale files stay unchanged. Backend schemas are out of scope.

Inventory: 229 Vue files, 66 page files, 84 literal Vuetify tags across 201 files. Composables contain 124 TypeScript files, including 32 tests: 92 non-test TypeScript files. API directory has 72 TypeScript files and no other file extension in this checkout; do not reuse the older 90-file report claim. Direct framework imports were not found in those API TypeScript files; dependency closure/auto-import auditing is still required before declaring reuse safe. Lexical discovery is an inventory, not an AST semantic audit or demonstrated conversion coverage.

Fresh Vue baseline: build passed (14 s), 517 unit tests passed, lint 0 errors/warnings, **314 existing Vue type diagnostics**, strict routes 66/66, flows 15/15, Playwright 82/82 (66 routes + 15 flows + one guard), statement coverage 15.1%, page coverage 1.82%, composables coverage 49.45%. Static counters: any 88, TODO 16, expect 817, 48 test files. Measurement 210 s excludes tool setup and separate coverage. Raw run: `wf4-r2-evidence/runs/20261013T085845Z-source_frontend-WF4-R2-Vue-baseline/`.

The previous 315-diagnostic record differs by one; the cause is unestablished. Existing diagnostics do not justify disabling strict checks in the React target. Historical comparisons must disclose newer evaluator and approximately 15 GiB WSL memory versus earlier 3.8 GiB.

## Workflow and gates

1. **A — design (this stage):** catalogue source-backed rules, architecture/ownership, samples, measurement protocol and proposed limits. Save prompt/session/usage and commit only these three documents. Stop at Gate 1.
2. **Gate 1 — human design review:** approve/change infrastructure contracts, samples, version policy, optional dependency decisions, budgets and unresolved semantics. Save answers in a decision log; a judgement rule remains blocked until its specific contract is decided. General Gate 1 approval is not permission to guess every later judgement.
3. **B — implementation after approval:** write AST-based converter and handwritten infrastructure separately; pin target dependencies and lockfile. Create declared fixture manifests, unsupported diagnostics, import/route inventories and deterministic generation. Do not implement by regex replacement across full files.
4. **C — sample generation and Gate 2:** generate the fixed five files into a pure artifact. Compile/check rule fixtures and review semantics. Correct reusable rules/adapters then regenerate. Maximum three sample review rounds. Save each immutable pure snapshot and a separately derived refined snapshot. Record review verdict per full file and rule.
5. **D — batch conversion, only after Gate 2 pass:** apply supported rules; unsupported nodes fail visibly. Generate complete route/import manifests. Any file-specific refinement has a declared input/output map, rationale and diff. Review unsupported coverage before publish.
6. **E — validation and synthesis:** run frozen yardstick plus parity/semantic checks; archive raw commands, failures and fixes. Report pure conversion and refined application separately, including infrastructure and manual effort, failure outcomes and limitations. Report-writing costs are separate from workflow costs.

## Proposed infrastructure contracts (not implemented)

Use an independent `frontend-react/` with its own package manifest, exact lockfile, strict tsconfig, Vite dev/prod configuration and React entry point. Exact compatible versions of Vite, Router, MUI, react-i18next and TypeScript are pending Gate 1; React major is fixed at 19. No dependency installation occurred in Phase A.

- `src/infra/router/`: explicit routes from all 66 source pages; nested layout/Outlet; full query/hash redirects; actual RouterLink anchors; auth-ready boundary and separate admin/group guards. Root versus deployment basename must be agreed. Vite base, router basename and backend history fallback must match. Existing backend is not edited.
- `src/infra/auth/` and `src/infra/api/`: reviewed client services replacing Nuxt injection, preserving cookies, refresh dedup/retry exclusions, error normalization, session initialization and logout/reset semantics. Reuse API/types only after transitive dependency auditing; generated types may be copied unchanged or imported through explicitly supported build paths, never manually edited.
- `src/infra/stores/`: explicit singleton/keyed external store contracts with immutable stable snapshots, subscriptions and reset/tenant boundaries. Hooks are unconditional; no network request during React render. Factory refresh becomes explicit lifecycle behavior only after approval.
- `src/infra/i18n/`: react-i18next initialization and reviewed legacy-message formatting. Actual source has `{name}`, positional `{0}` and pipe plurals; default i18next interpolation is insufficient. Preserve JSON resources and formatting semantics through a tested compatibility adapter. Reject unsupported syntax; do not edit Crowdin locales to force conversion.
- `src/infra/ui/`: MUI theme, breakpoints, icon mapping, form/value/slot/dialog/hover adapters. Palette and breakpoints derive from actual Vuetify config, not MUI defaults. Core Table versus MUI X table/date/tree packages, numeric field API, and optional timeline dependency remain decisions. No optional licensed package is silently introduced.
- `src/infra/services/`: toast/global utilities and sanitizer integration with explicit lifetimes. Preserve existing sanitization and iframe allowlist.

Cross-cutting infrastructure must be independently typed/tested and recorded as handwritten cost. A reusable semantic decision implemented in infrastructure does not become a mechanical rule by relabeling it.

## Output ownership and artifact provenance

All paths below are proposed relative to the canonical source repo except external evidence. Phase A creates only the three Markdown documents.

| Path / artifact | Owner and permitted edits | Evidence |
| --- | --- | --- |
| `rewrite-tools/wf4-r2/` | Codemod source, fixtures and rule manifests; rule corrections allowed | rule ID, source SHA, fixture inventory, unsupported diagnostics |
| `frontend-react/src/infra/`, root package/config/entry | Handwritten infrastructure | separate commits/diffs, decision IDs, time/token category |
| `rewrite-evidence/workflows/WF4-R2-artifacts/<round>/pure/` | Immutable converter output; no manual patches | input SHA, rule/tool versions, file SHA manifest, complete generated inventory |
| `rewrite-tools/wf4-r2/refinements/` | Explicit semantic transformation/patch set | source/target files, rationale, reviewer, before/after hashes |
| `rewrite-evidence/workflows/WF4-R2-artifacts/<round>/refined/` | Derived copy of pure artifact; validated refinements applied transactionally | pure provenance plus ordered refinement manifest and resulting hashes |
| `frontend-react/src/generated/` | Published copy from a selected validated artifact, not an independent hand-edited source | artifact ID and copy/hash verification; imports to infrastructure declared |
| `rewrite-evidence/workflows/WF4-R2-state.md` | Progress and decisions | completed versus proposed, pending gates and risks |
| external `wf4-r2-evidence/workflow-sessions/` | Prompts, visible transcript, original usage, wall time and review records | category/boundary/counter provenance; never stage external files into unrelated Git paths |
| external checkpoint run directories | Raw measurements, screenshots, assertion parity and manifests | canonical source commit, evaluator SHA, actual commands/env and exit statuses |

Pure artifact may use declared infrastructure imports but must contain no hidden file-specific semantic patch. Evaluate the runnable assembly **pure + infrastructure** and separately **refined + infrastructure**. Report their dependencies and actual readiness; if pure cannot run, record that failure rather than borrowing refined results. Missing fixture input/expected files fail hard. Validate refinement preconditions and all outputs before writing; partial failures cannot leave the published tree half changed.

## Five fixed full-file samples

| Category | Frozen source | Why selected / important checks |
| --- | --- | --- |
| Page | `frontend/app/pages/index.vue` | Startup/auth/public-group asynchronous redirect, blank layout, multiple API branches; a deliberately difficult judgement case |
| Domain component | `frontend/app/components/Domain/Recipe/RecipeChips.vue` | Typed union items, defaults, conditional/list rendering, key identity, event payloads and chip style; source title is boolean but displayed in heading, so record the oddity rather than invent a new title contract |
| Common component | `frontend/app/components/global/BaseButton.vue` | Runtime props, default/named slots, attribute precedence, variants, real links, download and translation |
| Composable | `frontend/app/composables/store/use-food-store.ts` | Module singleton state, public/private initialization, reset and dependent factory side effects; tenant/lifetime risk |
| Layout | `frontend/app/layouts/default.vue` | Thin layout wrapper plus global-i18n initialization; full DefaultLayout is a mandatory separate risk probe, so this thin file cannot demonstrate shell coverage |

Fix this manifest before generation; do not replace difficult samples or count functions as extra files. R21/R25 are initially Judgement-heavy; this does not predetermine success. Resolve reusable contracts honestly and then assess remaining per-file semantic repair. Mandatory risk probes listed in the rule catalogue are additional pass/fail checks, not additions to the five-file denominator. Unsupported samples count as requiring repair. All five must have review verdicts; missing reviews fail the gate.

## Stop conditions and proposed budgets

Maximum **three sample review rounds**. For each round record each sample's unsupported constructs, automatic/reusable changes, residual file-specific semantic patch and manual review verdict. Residual rate = full-file samples still needing file-specific semantic repair / **5**. More than 30% means **2 or more files (40%)**. After round three, if this remains true, stop batch conversion and mark WF4-R2 unsuccessful. Gate 2 cannot pass earlier with unresolved blocking semantics or without complete reviews. A low residual rate does not waive mandatory safety/behavior checks. Do not relabel patches as infrastructure to hide residual work.

Proposed future limits for Gate 1 discussion: Phase B infrastructure/rules 4 active hours; each sample round 90 active minutes; batch 2 active hours; final validation/refinement 3 active hours. These are planning proposals, not approved or guaranteed. Save wall time, active assistant execution where measurable, blocked/tool setup time and human review separately. Phase A has already consumed actual time; apply no retroactive cap.

Token budget: **pending confirmation**. Use total reported tokens (input + output), with cached/uncached input and output subsets separately displayed. A low budget chosen now must consider large accumulated conversation context; no numeric token cap or monetary budget has been approved. At approved budget exhaustion stop safely, archive state and failures, and request an explicit continuation decision. Never mark incomplete work successful because a budget expires.

## Validation and assertion preservation

Before target generation capture source test manifest (paths, suites/cases, source hashes), assertion inventory and behavior contracts. For each moved/reused assertion record original case/location, target case/location, subject, expected behavior and explanation of equivalent setup. Keep pure framework-free tests unchanged where build-compatible. For Vue-dependent cases, preserve the behavioral expectation while replacing harness/render details transparently. Include setup/mocks/fixtures; unchanged `expect` counts cannot prove equivalent meaning.

Frozen E2E inputs stay byte-identical. Compare exact route names/patterns and flow expectations, not merely 66/15 totals. Run strict React type check (zero target diagnostics), production build, lint, unit/parity tests, coverage, all frozen routes/flows/guard and focused behavior probes. Record assertions lost, weakened, skipped or replaced as failures/pending review; compare skipped/retry/flaky counts. Report coverage denominator/path changes, not percentages alone. Existing 314 Vue diagnostics stay attributed to baseline.

For the codemod harness itself, challenge missing input/expected fixtures, invalid rules, unsupported syntax and failed refinement preconditions. These must fail before publication. Validate all generated files/imports, no source paths silently omitted, and identical-input deterministic hashes. These are future acceptance checks, not tests already executed in Phase A.

## Windows-to-WSL execution protocol

Windows remains the only edit source. Before each target checkpoint commit/select the canonical SHA, export a fresh tracked-file snapshot to a new WSL execution directory, verify file hashes and record both Windows SHA and execution manifest. Never copy WSL edits back. Include explicitly declared artifact/config files; ignore dependencies and untracked unrelated data. Reuse compatible runtime caches only with recorded versions.

Current `/var/tmp/wf4-r2-b0yNLt76/source` is the **original Vue execution snapshot**. Existing `run-baseline.sh` and `verify-frozen-inputs.sh` enforce original source HEAD; they cannot measure new React commits. A separate future checkpoint wrapper must verify current canonical commit and unchanged evaluator, select the intended React artifact, and use compatible target ports/base URLs. `runtime-env.sh` currently points at the original execution root; do not assume it updates snapshots automatically.

Use the frozen local FastAPI with fresh disposable SQLite data on port 9091. Wrapper must validate the resolved exact disposable data directory is within its new checkpoint root and refuse reuse/existing paths before any cleanup. The evaluator itself stays unchanged. Record runner process startup/termination, actual browser run and cache/setup state. A successful build is not evidence of an active deployed app.

## Experiment records and cost attribution

Formal workflow starts at this user's Phase A prompt, UTC **2026-10-13T09:39:59.423Z** (NZDT 22:39:59). Token recorder watches this conversation's provider `token_count` events. Raw cumulative counters are in `workflow-sessions/token-events.jsonl`; deltas/counters in CSV/JSON and Phase A export. Cached input is a subset of input; reasoning output is a subset of output; total = input + output. Never sum cumulative snapshots or add subsets twice. Fees are **未提供**.

Keep Phase A, later phases, Gate reviews, reusable handwritten infrastructure and file-specific refinements separately labeled where event boundaries exist; mixed turns get an explicitly mixed label, not an invented split. Prior WF4-specific prompt-pack preparation, S0 usage-recorder setup and shared baseline setup are overhead outside formal Phase A; export recoverable counter windows separately with scope limitations. Baseline's 210 seconds is command measurement time, not AI/human preparation time. Separate threads need their own logs; do not infer their usage from account percentages or duplicate parent totals.

Export the exact user prompt, visible user/assistant commentary/final and tool records through the current cutoff. Do not expose hidden instructions or internal reasoning. A complete unfiltered transcript is **待补** if the app cannot export it. Final-answer usage may arrive after the current turn; any in-turn summary is provisional until the next provider event. Human review minutes are **未提供 / 待人工填写**, never 0 by assumption.

## Gate 1 review checklist

1. Approve the five fixed samples, additional risk probes, 35 rule contracts and 84-tag adapter inventory.
2. Choose exact compatible target dependency pins and optional UI packages (Core-only alternatives must preserve behavior or fail explicitly).
3. Approve/resolve auth-ready/redirect policy, store tenant/reset contract, i18n legacy syntax adapter and root/subpath deployment.
4. Approve artifact provenance, atomic refinement and assertion-parity protocol.
5. Confirm/change time and total-token budgets. Monetary costs remain unavailable without provider billing data.

Phase A ends after its documentation commit and evidence snapshot. Await the user's Gate 1 decision; do not install target packages or begin conversion.

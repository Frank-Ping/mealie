# WF5 rule driven migration evidence

WF5 is the rule-driven Mealie Vue/Nuxt-to-React migration experiment formerly recorded as **WF4-R2**. Its final result was **Gate 2 NOT READY**: three of five fixed samples remained blocked, a residual rate of at least **60%**, so batch conversion stopped. This branch publishes that completed failed attempt, its four original commits and its evidence in English. Subsequent R3 implementation and results are excluded.

The naming and evidence publication took place on 14 October 2026. Original commit IDs, historical prompt wording, artifact bytes and recorded results are retained. New public documents and active paths use WF5; historical records explain the previous identifier. This publication does not change the outcome, authorize another formal round or retroactively grant Gate 2 approval.

## Evidence index

| ID | Evidence | What it supports |
| --- | --- | --- |
| E1 | [Frozen source](https://github.com/Frank-Ping/mealie/commit/4b9ca06b6581f7152e164ea0fd9d4da366975a79), [baseline summary](evidence/baseline/BASELINE.md), [saved reports](evidence/baseline/raw-reports/) | Original Vue builds; 517 unit tests pass, 66/66 routes and 15/15 flows pass; 314 existing type diagnostics |
| E2 | [English prompt translations](prompts/Prompts_EN.md), [original Chinese prompts](prompts/), [Phase A visible records](evidence/transcripts/Phase_A_Visible_Through_Final.jsonl), [Phase B visible records](evidence/transcripts/Phase_B_Visible_Through_Final.jsonl) | Actual instructions, Gate 1 approval, token clarification and visible execution history; translations are explicitly retrospective |
| E3 | [Plan](../WF5-plan.md), [rules](../WF5-conversion-rules.md), [decisions](../WF5-decisions.md) | Rule-family decomposition, five fixed samples, separated output/infrastructure and the approved stop condition |
| E4 | [Four original commits](#four-original-experiment-commits), [publication naming map](provenance/publication-rename.json) | Design, implementation, repair and final evidence checkpoints; original SHAs retained |
| E5 | [Fixed-sample results](../WF5-B/round-3-revision-4-results.json), [selected artifact](../WF5-artifacts/round-3/revision-4/), [stopped Gate 2 record](../WF5-Gate-2-review.md) | Two generated components, three explicitly blocked samples, empty semantic-refinement operations and unchanged historical bytes |
| E6 | [Final WSL command results](evidence/implementation-checks/final-wsl/check-results.json), [36 unit tests](evidence/implementation-checks/final-wsl/unit-results.json), [20 rule checks](evidence/implementation-checks/final-wsl/rules.log), [failure history](evidence/implementation-checks/failure-history/) | Historical command outcomes and failures; local sample checks, not whole-app acceptance |
| E7 | [Post-stop audit in English](evidence/post-stop-audit/Summary_EN.md), [fault results](evidence/post-stop-audit/fault-results.json), [behavior probes](evidence/post-stop-audit/probe-results.json) | Independent findings after the original stop: F1-F6; 19 fault/control cases and 16 extra behavior probes |
| E8 | [English accounting](evidence/accounting/Accounting_EN.md), [sealed R2 counters](evidence/accounting/Sealed_R2_Accounting_Extract.json) | Finalized formal token total, time boundaries and separate setup/audit windows |
| E9 | [Rename validation](provenance/rename-validation.json), [public evidence manifest](evidence/PUBLIC_MANIFEST.json), [publication transformations](evidence/Redactions_EN.md) | New naming checks, unchanged historical artifacts, sanitized public projections and their source hashes |

For the English appendix narrative, see [Appendix_EN.md](evidence/Appendix_EN.md). The [public-evidence guide](evidence/README.md) explains how the source projections and checksum verifier were prepared.

## Four original experiment commits

All times are Pacific/Auckland, UTC+13, on 13 October 2026. Original commit subjects retain WF4-R2 because that was the identifier used during execution. These records have not been rewritten to make the new label appear historical.

| Commit | Local time | Original subject |
| --- | --- | --- |
| [2176881](https://github.com/Frank-Ping/mealie/commit/2176881a9810633a8de7753456dbd63ee44b27c6) | 22:59:03 | `[WF4-R2-A] Document conversion rules and Gate 1 experiment plan` |
| [63e239b](https://github.com/Frank-Ping/mealie/commit/63e239bb35fab4b53fc8d913b284dfa43edec5a9) | 23:45:33 | `[WF4-R2-B] Implement bounded AST samples and record Gate 2 blockers` |
| [b574538](https://github.com/Frank-Ping/mealie/commit/b57453838ef770a32188159350d5f9971f8b94e1) | 23:53:59 | `[WF4-R2-B] Close sample imports and retain unsupported UI diagnostics` |
| [8b0fae1](https://github.com/Frank-Ping/mealie/commit/8b0fae128ea823ebee4a6507d274df1f8987e8d1) | 23:58:03 | `[WF4-R2-B] Record verified WSL checks and stopped Gate 2 outcome` |

The final saved implementation run tested **b574538**. **8b0fae1** is the final evidence checkpoint, whose changes were three state/review documents. Original source and backend had an empty diff from the frozen baseline to that endpoint. The original experiment code is accessible under its historical paths at those fixed commits; active publication paths are `rewrite-tools/wf5/` and `WF5-*`.

## Outcome and limitations

| Fixed sample | Historical output | Remaining boundary |
| --- | --- | --- |
| `pages/index.vue` | Blocked, absent | Startup, authentication and async redirect dependencies |
| `RecipeChips.vue` | Generated | Local behavior checked; real visual equivalence unverified |
| `BaseButton.vue` | Generated | Local cases checked; integration limits and post-stop attribute failure |
| `use-food-store.ts` | Blocked, absent | Shared scope and factory lifecycle unresolved |
| `layouts/default.vue` | Blocked, absent | Full layout and global i18n dependencies unresolved |

Three numbered generation/revision rounds are preserved, but the later audit found semantic verdict fields still pending. They do not demonstrate three complete documented semantic approvals. The 35-rule catalogue was proposed; complete implementation of all 35 rules was not established.

Routine historical checks passed strict types, lint, 20 rules, 36 target unit tests and two builds. Only two source helper suites, ten cases total, transferred unchanged; the other 46 source test files did not. No complete React application, target coverage, full 66-route/15-flow React run, or production readiness was established.

After the R2 endpoint, the independent audit reproduced routine passes but recorded 11 satisfied and 8 unsatisfied safety conditions across 19 fault/control cases, and 14 passes and 2 failures across 16 behavior probes. F1-F6 concern acceptance identity, publication rollback, event lowering, `block` behavior, store validation cleanup and incomplete semantic-review records. These additional findings supplement the already stopped experiment; they were not the original stopping reason.

Formal design and implementation used **8,992,891** provider-reported tokens over approximately **78.59 elapsed minutes**, including the interval between phase prompts. Setup, preparation, independent review and later bookkeeping are separately identified. Cached input and reasoning are included in their respective input/output categories; actual fees, active-agent time and human-review minutes were unavailable.

## Publication naming validation

The new WF5 labels do not repair the historical R2 defects. The three JavaScript modules pass syntax checks, and the renamed rule suite passes 20 checks using the pinned cached compiler dependencies. An earlier default-temp-directory permission failure is retained separately. These are publication checks, not a new formal sample round or whole-application verification.

All 54 historical artifact/result files retain their original bytes after path changes. The dependency lock, generated component bytes, original frontend and backend remain unchanged. The source-to-public naming and hash map is in E9.

## Suggested report wording

> WF5 used a rule-driven workflow with design and sample review gates. It catalogued 35 rules and generated two of five fixed samples, but the page, food store and layout remained blocked, giving a residual rate of 60%. Routine sample verification passed 20 rule checks, 36 unit tests, strict types, lint and two builds; an independent post-stop audit nevertheless identified acceptance, publication and behavioral defects, together with incomplete semantic-review records. Four local commits preserve the progression and stopped outcome. These results support reviewed automation of bounded syntactic subsets, while failing to establish whole-application semantic equivalence or readiness for batch conversion.

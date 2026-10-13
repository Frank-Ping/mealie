# WF5 English evidence appendix for WF4-R2

WF5 tested a rule-driven Vue/Nuxt-to-React migration, recorded under the historical identifier WF4-R2. The attempt reached its approved stop condition: three of five fixed samples remained blocked (60%), so Gate 2 was NOT READY and batch conversion did not begin. Four genuine local commits record design, implementation, a dependency correction, and the final evidence checkpoint. This appendix concerns R2 only; subsequent WF4-R3 implementation and its results are excluded.

English explanations and prompt translations were prepared retrospectively on 14 October 2026. Original-language wording, timestamps and commit identities are retained in public projections; private paths and internal/account metadata are redacted. Original source hashes remain in PUBLIC_MANIFEST.json. A translated prompt is not represented as the language originally sent to the agent. This evidence preparation did not rerun the application tests or alter the experiment's code, Git history or existing reports.

## Scope and baseline

Source: `4b9ca06b6581f7152e164ea0fd9d4da366975a79`. Evaluator: `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`. Branch: `rewrite/wf4-codemod-rerun`. The original Vue frontend and FastAPI backend have an empty diff between the frozen source and the R2 endpoint. [E1, E4]

| Baseline measurement | Recorded result |
| --- | --- |
| Source production build | Passed; 14 seconds |
| Source unit tests | 517 passed, 0 failed, 0 skipped |
| Source lint | 0 errors and 0 warnings |
| Source TypeScript | 314 existing diagnostics; not a passing baseline check |
| Frozen browser yardstick | 66/66 routes, 15/15 flows; 82 checks including one guard |
| Statement coverage | 15.1% overall; pages 1.82%; composables 49.45% |

## Actual Git and commit evidence

There are four R2 commits after the frozen source. The author field is Frank-Ping; the original commit subjects are already English. These author fields identify the recorded Git metadata, not a claim that all code was manually written by the human author. Timestamps below use the commit-recorded Pacific/Auckland offset of UTC+13. [E4]

| Commit | Auckland time on 13 Oct 2026 | Original subject | Verified role |
| --- | --- | --- | --- |
| 2176881a9810633a8de7753456dbd63ee44b27c6 | 22:59:03 | [WF4-R2-A] Document conversion rules and Gate 1 experiment plan | Phase A design: plan, 35-rule catalogue and initial state; no converter implementation. |
| 63e239bb35fab4b53fc8d913b284dfa43edec5a9 | 23:45:33 | [WF4-R2-B] Implement bounded AST samples and record Gate 2 blockers | Bounded AST converter, independent React sample package, infrastructure, test inventories and numbered generation rounds. |
| b57453838ef770a32188159350d5f9971f8b94e1 | 23:53:59 | [WF4-R2-B] Close sample imports and retain unsupported UI diagnostics | Correct the generated icon import; remove aliases into the original Vue tree; retain explicit unsupported diagnostics and final revision 4. |
| 8b0fae128ea823ebee4a6507d274df1f8987e8d1 | 23:58:03 | [WF4-R2-B] Record verified WSL checks and stopped Gate 2 outcome | Record successful WSL sample checks and the stopped Gate 2 outcome; only three evidence/state documents changed. |

Tested implementation checkpoint: `b57453838ef770a32188159350d5f9971f8b94e1`. Final R2 evidence commit: `8b0fae128ea823ebee4a6507d274df1f8987e8d1`. The original four commits are preserved directly in the publication repository. Subsequent rewrite implementation is excluded. The publication rename and evidence preparation are separate later commits and do not change the historical R2 outcome.

## Workflow and fixed sample outcome

Phase A inspected the actual source and proposed 35 rules classified as Mechanical, Semi-mechanical or Judgement. Gate 1 approval preceded implementation. An initially unfilled numeric token placeholder was resolved by a separate user answer: no limit, record usage. Phase B implemented bounded AST rules and separate handwritten infrastructure, retained numbered generation rounds, and stopped before batch conversion. [E2, E3]

| Fixed sample | R2 output | Remaining limit |
| --- | --- | --- |
| pages/index.vue | Blocked, absent | Auth/startup/redirect dependency and lifecycle closure unresolved |
| RecipeChips.vue | Generated | Pure/refined/published bytes match; real visual equivalence not established |
| BaseButton.vue | Generated | Local cases pass; unsupported mappings and later audit failure remain |
| use-food-store.ts | Blocked, absent | Public/private scope and factory lifecycle unresolved |
| layouts/default.vue | Blocked, absent | Full DefaultLayout and global i18n dependencies not converted |

The selected artifact is round-3/revision-4. Pure, refined and published TSX are byte-identical for both emitted components; the refinement manifest contains no operations. The residual rate is at least 3/5 = 60%, above the approved 30% threshold. Three numbered generation/revision rounds exist, but post-stop inspection found the semantic verdict fields still pending. Do not describe these as three fully documented semantic approvals. [E5, E7]

## Historical checks and later independent audit

| Final saved WSL check | Recorded result | Exit code |
| --- | --- | --- |
| Rule harness | 20 passed | 0 |
| Strict TypeScript | No diagnostics | 0 |
| Lint | No errors/warnings | 0 |
| Unit tests | 36 passed, 0 failed/skipped | 0 |
| Sample SPA build | Passed | 0 |
| Component-library build | Passed | 0 |

These six historical commands tested b574538. The snapshot checker covered 1,804 regular files; Git contains 1,805 entries including a symlink, subsequently checked by the independent audit. The unchanged source baseline remained separate. Only two framework-free helper suites, ten cases total, were copied unchanged; the other 46 original test files were not migrated. No complete React Mealie application, target coverage, whole-app 66-route/15-flow run, or deployment was established. [E6, E7]

After the R2 endpoint, an independent temporary-copy audit reproduced all six routine passes. Nineteen fault/control cases had 11 satisfied and 8 unsatisfied safety conditions; 16 added behavior probes had 14 passes and 2 failures. These post-checkpoint findings did not cause the original stop, which was already required by unresolved sample coverage. [E7]

| Finding | Topic | Independent observation |
| --- | --- | --- |
| F1 | Acceptance identity/expected checks | Missing/corrupt selected expected snapshots, replacement sample paths and wrong component payloads could still pass the rule suite. |
| F2 | Publication after a late CLI failure | The CLI failed, but earlier generated/pure/refined output had already changed; per-directory safety did not guarantee whole-command rollback. |
| F3 | Event lowering | Method references, event-parameter arrows and $event expressions were accepted while producing incorrect invocation or payload behavior. |
| F4 | BaseButton block behavior | A source caller attribute was not mapped to MUI fullWidth and was forwarded as an unknown DOM attribute. |
| F5 | Store data-validation cleanup | An error in processing a successful loader result left loading=true and error=null. |
| F6 | Round-by-round semantic verdicts | Numbered rounds and artifacts exist, but semantic fields remained pending; complete semantic-review tables were not demonstrated. |

The audit report remains untracked in the canonical repository and is preserved as a separate source, with a hash matching final-preservation.json. It recommended keeping Gate 2 NOT READY; it neither implemented repairs nor constituted human Gate 2 approval. Later R3 fixes are excluded.

## Time and usage

| Window | Reported tokens | Time and boundary |
| --- | --- | --- |
| Formal Phase A | 2,361,518 | 19.61 min; finalized |
| Formal Phase B | 6,631,373 | 52.39 min; through final reply |
| Formal A+B | 8,992,891 | 78.59 min including between-phase interval |
| Earlier S0 recorder setup | 2,271,950 | Outside formal A+B |
| Post-stop independent audit | 13,086,633 | 20.85 min; multi-agent and approval use included |
| Audit accounting follow-up | 1,906,736 | Separate completed window; 7.05 min |

Formal R2 started 2026-10-13T09:39:59.423Z and ended with the final reply/provider boundary at 10:58:34.735Z/10:58:34.904Z. In Auckland this is 13 October, approximately 22:39:59 to 23:58:35. The independent audit occurred on 14 October, approximately 00:08:48 to 00:29:39. Wall time includes tools, waiting and clarification, not measured human review or active assistant time. [E8]

Provider totals are differences between cumulative counters. Cached input is inside input; reasoning output is inside output. Formal A+B is 2,361,518 + 6,631,373 = 8,992,891. Earlier provisional totals of 2,127,948 (A), 6,227,467 (B), and 8,588,985 (A+B) are superseded and must not be added. Baseline/preparation discussion and prompt preparation are additional separately recorded windows, not precise activity-only costs. Actual fees and human review minutes are unavailable.

The audit total already includes 12,865,779 task-agent tokens and 220,854 automatic-review tokens. The later 1,906,736 bookkeeping window and the 686,591 original-chat post-R2 delta use different, partly overlapping scopes; neither is folded into formal A+B or naively added into an all-in total. [E8]

## Evidence index and limitations

| ID | Claim supported | Public evidence |
| --- | --- | --- |
| E1 | Frozen source and baseline | [baseline](baseline/BASELINE.md), [numeric results](baseline/baseline.json), [raw reports](baseline/raw-reports/) |
| E2 | Original-language prompts and visible sessions | [translations](prompts/Retrospective_Translations_EN.md), [original prompts](prompts/), [visible projections](transcripts/) |
| E3 | Plan, rules and decisions | Original endpoint commit and the published WF5 workflow documents; historical source labels remain inside records |
| E4 | Four original commits and exact changes | Git history from frozen source `4b9ca06` through endpoint `8b0fae1`; public preparation commits follow separately |
| E5 | Fixed samples and artifact identity | Historical artifact bytes preserved in the publication repository; [audit provenance](post-stop-audit/provenance.json) |
| E6 | Successful and failed implementation checks | [final WSL results](implementation-checks/final-wsl/check-results.json), [selected failure history](implementation-checks/failure-history/) |
| E7 | Independent audit after the stop | [English summary](post-stop-audit/Summary_EN.md), [faults](post-stop-audit/fault-results.json), [probes](post-stop-audit/probe-results.json) |
| E8 | Completed usage and boundaries | [accounting](accounting/Accounting_EN.md), [sealed R2 extract](accounting/Sealed_R2_Accounting_Extract.json) |

This public subset contains explicitly modified historical projections and retrospective English explanations. Internal originals remain private; the manifest records original and public hashes plus transformations. Selected failures and final passes retain their separate checkpoints. Hidden reasoning, system/developer instructions, account state and connector metadata are excluded. Complete unfiltered transcripts, complete per-round semantic verdict tables and fully self-contained early-round replay environments remain unavailable.

## Inspecting the published history

The publication repository exposes the actual frozen source and original four experiment commits directly. Inspect them without a nested Git archive:

```sh
git log --reverse --format=fuller 4b9ca06..8b0fae1
git show 2176881
git diff 4b9ca06 8b0fae1 -- frontend mealie
```

The later WF5 rename and sanitized evidence commit are publication preparation, not further experiment success. [PUBLIC_MANIFEST.json](PUBLIC_MANIFEST.json) records original/public SHA256 correspondence; [SHA256SUMS.txt](SHA256SUMS.txt) covers the files in this evidence directory.

## Report-ready evaluation paragraph

WF5 used a rule-driven workflow with design and sample review gates. It catalogued 35 rules and generated two of five fixed samples, but the page, food store and layout remained blocked, giving a residual rate of 60%. Routine sample verification passed 20 rule checks, 36 unit tests, strict types, lint and two builds; an independent post-stop audit nevertheless identified acceptance, publication, event, attribute and error-state defects, together with incomplete semantic-review records. Four local commits preserve the progression and stopped outcome. Formal design and implementation used 8,992,891 reported tokens over approximately 78.59 elapsed minutes. These results support reviewed automation of bounded syntactic subsets, while failing to establish whole-application semantic equivalence or readiness for batch conversion.

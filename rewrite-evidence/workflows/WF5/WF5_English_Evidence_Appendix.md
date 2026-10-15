# WF5 English evidence appendix with fixed GitHub references

For the updated report subsection, use [Report_Section_EN.md](Report_Section_EN.md) and the [expanded appendix of specific logs and line references](Report_Appendix_EN.md).

WF5 is the completed failed rule-driven migration experiment. Its historical endpoint is `8b0fae128ea823ebee4a6507d274df1f8987e8d1`. The publication evidence is pinned to `a4c00595cb0afe89639549a49d3e7dfcaf39241d` in [Frank-Ping/mealie](https://github.com/Frank-Ping/mealie); these fixed references remain usable if the branch later changes.

## Approach

WF5 decomposed the Vue/Nuxt-to-React migration into reusable conversion rules rather than application modules or parallel worker domains. Phase A produced a 35-rule catalogue classified as Mechanical, Semi-mechanical or Judgement, along with five fixed samples. Human Gate 1 approval preceded a bounded AST converter and separate React infrastructure. Pure output, infrastructure and semantic refinements had separate provenance. The approved process allowed at most three numbered sample rounds and stopped batch conversion when more than 30% still needed file-specific semantic work. [E2, E3, E4, E5]

The actual user instructions were Chinese. English translations were prepared after execution and are labeled retrospectively. The original Gate 1 message contained an unfilled numeric placeholder; a subsequent reply established no token upper limit, only usage recording. Original Chinese messages and commit records are preserved; report labels and paths in the English presentation use WF5. [E2]

## Outcome and validation

RecipeChips and BaseButton were generated; index.vue, use-food-store.ts and layouts/default.vue were absent with explicit blocking diagnostics. At least three of five samples remained blocked: 60%, above the approved 30% threshold. Gate 2 was NOT READY and no batch conversion began. Selected artifacts were round-3/revision-4, with identical pure/refined/published TSX and no semantic-refinement operations. [E5, E9]

The saved implementation run at b574538 passed six commands: 20 rule checks, strict TypeScript, lint, 36 target unit tests, sample SPA build and component-library build. Only two source helper suites, ten cases total, were copied unchanged; 46 source test files remained unmigrated. These sample checks did not establish a complete React application, a new 66-route/15-flow result, target coverage or deployment. [E1, E5, E6]

## Why the attempt stopped

The tool boundary suited bounded components but did not close authentication sequencing, shared store lifetime or full layout dependencies. The original stopping reason was unresolved sample coverage. After the endpoint, an independent audit reproduced routine passing checks while exposing F1-F6: incomplete expected/identity acceptance, partial publication after a later CLI failure, incorrect event lowering, dropped block behavior, failed store validation cleanup and incomplete semantic verdict records. Nineteen fault/control cases had 11 satisfied and 8 unsatisfied safety conditions; 16 extra behavior probes had 14 passes and 2 failures. [E7]

Three numbered generation/revision rounds exist, but complete per-round semantic approval tables were not demonstrated. The later audit findings are additional evidence about the stopped result, not its original cause or a retrospective approval. [E5, E7]

## Time and cost boundaries

Formal Phase A used 2,361,518 reported tokens and Phase B 6,631,373, totaling 8,992,891 over approximately 78.59 elapsed minutes. Recorder setup, earlier baseline/prompt preparation, the independent audit and subsequent bookkeeping use separate windows. The independent audit used 13,086,633 observed tokens, already including task-agent and automatic-review subtotals. Cached input is inside input; reasoning is inside output. Actual fees, active-agent time and human-review minutes were unavailable. [E8]

## Commit evidence

All four original commits are preserved. Times below are 13 October 2026, Pacific/Auckland (UTC+13).

| Commit | Local time | Checkpoint purpose |
| --- | --- | --- |
| [2176881](https://github.com/Frank-Ping/mealie/commit/2176881a9810633a8de7753456dbd63ee44b27c6) | 22:59:03 | `Document conversion rules and Gate 1 experiment plan` |
| [63e239b](https://github.com/Frank-Ping/mealie/commit/63e239bb35fab4b53fc8d913b284dfa43edec5a9) | 23:45:33 | `Implement bounded AST samples and record Gate 2 blockers` |
| [b574538](https://github.com/Frank-Ping/mealie/commit/b57453838ef770a32188159350d5f9971f8b94e1) | 23:53:59 | `Close sample imports and retain unsupported UI diagnostics` |
| [8b0fae1](https://github.com/Frank-Ping/mealie/commit/8b0fae128ea823ebee4a6507d274df1f8987e8d1) | 23:58:03 | `Record verified WSL checks and stopped Gate 2 outcome` |

The implementation checked by WSL was b574538; 8b0fae1 records the final evidence state. The [WF5 publication commit](https://github.com/Frank-Ping/mealie/commit/a4c00595cb0afe89639549a49d3e7dfcaf39241d) is a later naming/evidence preparation commit, not one of the four experimental commits. It preserves 54 historical artifact/result files and does not repair the failed experiment. New naming validation passes three module syntax checks and 20 renamed rule checks; an earlier Windows temporary-directory permission failure is retained separately. [E9, E10]

## Fixed GitHub evidence links

| Evidence | Fixed source |
| --- | --- |
| E1: Frozen source and baseline | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/evidence/baseline/BASELINE.md) |
| E2: Actual prompts and retrospective English translations | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/prompts/Prompts_EN.md) |
| E3: Visible Phase A history | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/evidence/transcripts/Phase_A_Visible_Through_Final.jsonl) |
| E4: Visible Phase B history, including final reply | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/evidence/transcripts/Phase_B_Visible_Through_Final.jsonl) |
| E5: Fixed samples and stopped Gate 2 result | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5-Gate-2-review.md) |
| E6: Final WSL commands and exit codes | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/evidence/implementation-checks/final-wsl/check-results.json) |
| E7: Post-stop independent audit | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/evidence/post-stop-audit/Summary_EN.md) |
| E8: Completed accounting and separate cost windows | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/evidence/accounting/Accounting_EN.md) |
| E9: Publication naming map and preserved byte hashes | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/provenance/publication-rename.json) |
| E10: New naming validation | [Open evidence](https://github.com/Frank-Ping/mealie/blob/a4c00595cb0afe89639549a49d3e7dfcaf39241d/rewrite-evidence/workflows/WF5/provenance/rename-validation.json) |

The raw public evidence consists of explicitly transformed projections: account balances, rate-limit/account status, internal attribution and private workstation locations were removed. Original/public hashes and transformations are recorded, without claiming the sanitized copies are byte-identical originals. Hidden reasoning/system instructions are not published. The original local package is retained separately. [E9]

## Suggested evaluation

WF5 supports automation of reviewed local syntactic subsets, but failed to establish reliable system-wide semantic migration. If repeated, shared auth, store, i18n and layout contracts should be resolved before converter expansion, and fixed-identity/expected-byte checks, whole-command rollback and independent behavioral probes should precede batch publication. The stop condition should remain unchanged. This single bounded experiment does not establish a general quality, cost or efficiency ranking.

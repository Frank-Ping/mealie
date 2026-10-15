# WF5 Rule driven migration evaluation

Report section updated 16 October 2026. This evaluates the stopped WF5 experiment; later rewrite work is excluded.

## Approach

We used WF5 to test whether reusable conversion rules could support Mealie’s system-wide Vue/Nuxt-to-React migration. We decomposed work by rule families rather than feature modules. Codex received the frozen source, baseline, repository guidance, five fixed samples, and persistent plan, rule and decision documents. Phase A proposed 35 rules classified as Mechanical, Semi-mechanical or Judgement. Human Gate 1 approval preceded a bounded AST converter and separate React infrastructure. The catalogue was a proposal; complete implementation of all 35 rules was not demonstrated. [E2–E4]

The fixed set covered pages/index.vue, RecipeChips.vue, BaseButton.vue, use-food-store.ts and layouts/default.vue. Pure generated output, infrastructure and semantic refinements had separate provenance. At most three numbered sample rounds were permitted. More than 30% of samples still requiring file-specific semantic work after the third round would stop batch conversion; blocked files stayed in the denominator. Verification combined rule checks, strict types, lint, unit tests, two builds and sample review. [E4–E6]

## What happened

WF5 generated RecipeChips and BaseButton, while the page, food store and layout remained explicitly blocked. Three of five samples were unresolved, or 60%, so Gate 2 remained NOT READY and batch conversion stopped. Three numbered generation/revision rounds exist, but complete per-round semantic approval records were not established. The final evidence checkpoint is 8b0fae1; the saved successful implementation run tested b574538. [E5, E6]

That implementation passed 20 rule checks, strict TypeScript, lint, 36 target unit tests, a sample SPA build and a component-library build. Only two original helper suites, containing ten cases, transferred unchanged; 46 source test files remained unmigrated. The original Vue baseline passed 517 units, 66 routes and 15 flows, with 314 existing type diagnostics. Those baseline route and flow results were not rerun as whole-app React acceptance. No complete React application or target coverage result was established. [E1, E5, E6]

A separate audit after the stop reproduced routine passes but found weaknesses in acceptance identity, publication rollback, event translation, block behavior, store cleanup and review records. Its 19 fault/control cases satisfied 11 safety conditions and failed eight; 16 additional behavior probes passed 14 cases and failed two. These findings reinforce the limited strength of the passing checks; unresolved samples had already caused the original stop. Earlier failed commands remain available alongside successful results. [E7, E8]

## Why

Our interpretation is that reusable rules helped bounded local syntax but did not resolve Mealie’s implicit application contracts. The page depended on startup and authentication sequencing; the store required shared lifetime and caller contracts; the layout depended on global services and component chains. Moving syntax across frameworks could not decide those behaviors. The audit also showed that the converter’s own checks could pass while expected-file validation or runtime semantics remained wrong. Passing builds therefore provided useful local evidence but could not justify system-wide equivalence. [E5, E8]

## What we would change

We would settle authentication readiness, store scope and layout dependencies with human review before expanding conversion rules. We would then require exact sample identity and expected-byte checks, rollback tests for failed publication, independent behavior probes and explicit semantic verdicts before any batch run. The original stopping rule should remain in force. WF5 supports using codemods for reviewed syntactic subsets, with human decisions at shared application boundaries; it does not establish a generally superior workflow. [E5, E8]

Formal design and implementation consumed 8,992,891 reported tokens over 78.59 elapsed minutes. The separate audit consumed 13,086,633 observed tokens over 20.85 minutes, including its task agents and automatic approval review. Preparation, recorder setup and later accounting have separate windows. Cached input is already included in input, and reasoning in output. Fees and measured human-review or active-agent time were unavailable. These boundaries and the small sample prevent a controlled cost or efficiency ranking against other workflows. [E9]

Evidence IDs refer to [the report appendix](Report_Appendix_EN.md).

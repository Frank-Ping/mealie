# WF5 Rule driven migration evaluation

Report section updated 16 October 2026. This evaluates the stopped WF5 experiment; later rewrite work is excluded.

## Approach

WF5 decomposed Mealie’s Vue/Nuxt-to-React migration by reusable rule families. Codex received the frozen source, baseline, repository guidance, five fixed samples and persistent plan, rule and decision documents. Phase A proposed 35 Mechanical, Semi-mechanical or Judgement rules; full implementation was not demonstrated. Human Gate 1 approval preceded a bounded AST converter and separate React infrastructure. [E2–E4]

The samples covered a page, two components, a store and a layout. Generated output, infrastructure and semantic refinements had separate provenance. After at most three numbered rounds, more than 30% still requiring file-specific semantic work would stop batch conversion, counting blocked files. Checks covered rules, strict types, lint, units, two builds and sample review. [E4–E6]

## What happened

RecipeChips and BaseButton were generated; the page, store and layout remained blocked. The unresolved rate was 3/5 = 60%, so Gate 2 remained NOT READY and batch conversion stopped. Three numbered rounds exist without complete per-round semantic approval records. Checks tested b574538; 8b0fae1 records the final stop. [E5, E6]

The implementation passed 20 rules, 36 target units, strict types, lint and two builds. Only ten original helper cases transferred unchanged; 46 source test files remained unmigrated. Baseline Vue passed 517 units, 66 routes and 15 flows, with 314 existing type diagnostics. No complete React application, whole-app route/flow acceptance or target coverage was established. [E1, E5, E6]

A separate post-stop audit reproduced routine passes but exposed acceptance, rollback and behavior defects: 11/19 safety conditions and 14/16 behavior probes passed. These findings supplement the original stop caused by unresolved samples. Failed-command logs remain available. [E7, E8]

## Why

We attribute the failure to shared application contracts: page authentication timing, store lifetime and layout dependencies required decisions beyond local syntax conversion. The audit also found validation and runtime defects despite routine passes, so successful builds could not establish system-wide equivalence. [E5, E8]

## What we would change

We would resolve those shared contracts through human review, then require sample identity and expected-byte checks, rollback tests, independent behavior probes and explicit semantic verdicts before batching. Retain the stopping rule and limit codemods to reviewed syntactic subsets. [E5, E8]

Formal execution used 8,992,891 reported tokens over 78.59 elapsed minutes; the separate audit used 13,086,633 over 20.85 minutes, including task agents and automatic review. Preparation, setup and bookkeeping are separate. Cached input and reasoning are already included in input/output. Fees and measured human-review or active-agent time were unavailable. These boundaries and the small sample prevent a controlled efficiency ranking. [E9]

Evidence IDs refer to [the report appendix](Report_Appendix_EN.md).

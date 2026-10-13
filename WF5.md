# WF5 rule driven migration evidence

WF5 is the rule-driven Mealie Vue/Nuxt-to-React experiment that originally ran as WF4-R2. It ended at Gate 2 with at least three of five samples blocked (60%), so batch conversion stopped. This publication uses WF5 as its current name and preserves all four original experiment commits.

The branch begins from the final R2 checkpoint. Subsequent R3 implementation is excluded. The new publication commit changes names and supplies public evidence; it does not change the original experiment outcome or retroactively approve Gate 2.

## Evidence to cite

| Evidence | GitHub location |
| --- | --- |
| English evaluation and evidence index | [WF5 evidence](rewrite-evidence/workflows/WF5/README.md) |
| Actual prompts and retrospective English translations | [Prompt evidence](rewrite-evidence/workflows/WF5/prompts/Prompts_EN.md) |
| Original design and decisions with publication naming | [Plan](rewrite-evidence/workflows/WF5-plan.md), [rules](rewrite-evidence/workflows/WF5-conversion-rules.md), [decisions](rewrite-evidence/workflows/WF5-decisions.md) |
| Original stopped outcome | [Gate 2 record](rewrite-evidence/workflows/WF5-Gate-2-review.md) |
| Saved baseline, checks, failures and later audit | [Public evidence](rewrite-evidence/workflows/WF5/evidence/README.md) |
| Naming and byte provenance | [Publication map](rewrite-evidence/workflows/WF5/provenance/publication-rename.json) |

## Four actual experiment commits

The commit subjects contain the historical identifier because they record what was committed during the experiment. They are not rewritten or replaced by newly invented historical commits.

| Commit | Scope |
| --- | --- |
| [2176881](https://github.com/Frank-Ping/mealie/commit/2176881a9810633a8de7753456dbd63ee44b27c6) | Phase A rule catalogue, migration plan and state |
| [63e239b](https://github.com/Frank-Ping/mealie/commit/63e239bb35fab4b53fc8d913b284dfa43edec5a9) | Bounded AST converter, samples, infrastructure, tests and numbered rounds |
| [b574538](https://github.com/Frank-Ping/mealie/commit/b57453838ef770a32188159350d5f9971f8b94e1) | Sample dependency correction and explicit unsupported diagnostics; tested implementation checkpoint |
| [8b0fae1](https://github.com/Frank-Ping/mealie/commit/8b0fae128ea823ebee4a6507d274df1f8987e8d1) | Final R2 evidence, WSL checks and stopped Gate 2 outcome |

## Limits

Historical sample checks passed 20 rule tests, 36 target unit tests, strict TypeScript, lint and two builds. Only two source helper suites containing ten cases were retained unchanged. No complete React Mealie application, whole-app 66-route/15-flow result or production readiness was established.

The post-stop independent audit reproduced routine passes but identified F1-F6, including incomplete semantic-review records. Three numbered generation rounds exist; complete documented semantic approval for each round was not established. The audit and later accounting are separately identified in the evidence index.

Formal design and implementation used 8,992,891 reported tokens and approximately 78.59 elapsed minutes. Preparation, tracking setup and later audit are separate windows; actual fees and human-review minutes are unavailable.

## Prospective tooling commands

The active tooling path is `rewrite-tools/wf5/`; the sample package is `mealie-wf5-samples`. Historical artifacts are under `WF5-artifacts/` with their original bytes, hashes and historical labels retained. The old paths remain visible through commit `8b0fae1`.

Use the package's `test:rules`, `typecheck`, `lint`, `test`, `build` and `build:components` commands with the pinned lockfile. Renaming does not repair the independently identified R2 defects or authorize another generation round. Generation experiments require a new explicit decision and disposable output.

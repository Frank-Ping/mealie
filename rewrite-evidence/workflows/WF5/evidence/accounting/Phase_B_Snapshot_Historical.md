# WF4-R2 Phase B records

Start: 2026-10-13T10:06:11.148Z. Export cutoff: 2026-10-13T10:58:03.879520+00:00. Latest usage event: 2026-10-13T10:56:47.746Z.

| Scope | Input | Cached input subset | Output | Total |
| --- | ---: | ---: | ---: | ---: |
| Phase A finalized | 2332216 | 1987328 | 29302 | 2361518 |
| Phase B provisional | 6150476 | 5994496 | 76991 | 6227467 |
| Formal WF4-R2 provisional (A+B) | 8482692 | 7981824 | 106293 | 8588985 |

Formal A+B excludes prior prompt-pack preparation, S0 usage-recorder setup and shared baseline preparation. Earlier overhead windows remain in phase-a/usage-windows.json with their allocation limits. Do not add A+B to its component stages or add finalized A to the provisional A snapshot.

Provider snapshots are cumulative. Cached input is already part of input; reasoning is already part of output. Token policy: unlimited recording. Fees: 未提供. Human review time: 待人工填写. Active assistant time not separately metered.

Phase B elapsed wall time to this export: 51.88 minutes. CLI check durations and failed attempts are separate raw records; wall time is not a human review measurement.

gate-1-prompt.txt and token-policy-confirmation.txt preserve available user records. visible-transcript.jsonl includes visible messages/tool records through cutoff; hidden reasoning/instructions excluded. Complete unfiltered transcript: 待补. Final reply and its usage are appended after current exporter snapshot.

Canonical implementation commit and all tracked-byte hashes: canonical-checkpoint.json. WSL path/env/lock-before-after and actual checks: wsl-* files. Windows checks and failure history: checks/ plus latest *.log / check-results.json. Canonical source edits occurred in Windows; WSL code is never copied back.

Gate 2 NOT READY: three of five full-file samples blocked after three internal reviews. No whole-app frozen yardstick or new React application coverage result exists. Primitive/helper test passes do not imply Mealie migration success.

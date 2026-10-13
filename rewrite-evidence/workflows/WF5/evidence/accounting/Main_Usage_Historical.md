# WF4 R2 token usage

Source: provider-reported token_count events in this conversation's local session log.

Tracking begins at 2026-10-13T09:26:12.566Z (UTC), using the last cumulative snapshot before the user's tracking request.
Earlier discussion and setup usage is outside this window; it is not treated as zero.

Cached input is already included in input. Reasoning output is already included in output. Neither is added again.

| Phase | Input | Cached input subset | Output | Reasoning output subset | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| S0-recording-setup | 2,255,369 | 2,229,632 | 16,581 | 10,105 | 2,271,950 |
| Phase-A | 2,332,216 | 1,987,328 | 29,302 | 7,401 | 2,361,518 |
| Phase-B | 6,551,779 | 6,390,400 | 79,594 | 32,877 | 6,631,373 |

Reported window total: 11,264,841 tokens. Uncached input: 532,004.
Latest provider snapshot: 2026-10-13T10:58:34.904Z. Status: exact reported deltas.

S0 records the token-tracking setup itself. No rewrite stage is inferred from merely preparing prompts.
Stage labels are inferred from explicit user prompts and must be checked when each stage ends.
These totals cover only this conversation. Separate conversations/subagents need their own reported usage and must not be double-counted.
The final response or a currently running model request may not yet appear until the next usage event is written.
Monetary cost is unavailable; token counts are not a monetary invoice.

Raw snapshots and deltas: token-events.jsonl and usage-events.csv. Boundary counters and data quality checks: usage-summary.json.

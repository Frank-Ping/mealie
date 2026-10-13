# Phase A experiment records

Formal start: 2026-10-13T09:39:59.423Z; snapshot: 2026-10-13T09:59:04.217801+00:00. Wall time to this snapshot: 19.08 minutes (includes all waits/tools; not human review).

| Category | Input | Cached input subset | Output | Total | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| shared-baseline-and-related-preparation-discussion | 7059518 | 6756608 | 42055 | 7101573 | reported conversation-window delta, not a precise activity split |
| WF4-R2-prompt-template-preparation | 920324 | 901888 | 13864 | 934188 | reported conversation-window delta, not a precise activity split |
| S0-usage-recorder-setup | 2255369 | 2229632 | 16581 | 2271950 | reported conversation-window delta, not a precise activity split |
| Phase-A-formal-workflow | 2099764 | 1758208 | 28184 | 2127948 | provisional; final response event pending |

Cache is included in input; reasoning included in output; raw usage is cumulative. Only deltas are summable across disjoint windows. Fees: 未提供. Human review: 待人工填写.

Prompt preparation, S0 recorder setup and shared baseline preparation are excluded from formal Phase A. Earlier windows cover related discussion too; exact task-only allocation is unavailable. Shared baseline command run duration was 210 s, distinct from the preparation conversation window.

`prompt-1.txt` retains the user text. `visible-transcript.jsonl` contains available visible messages/tool records through the cutoff. Internal reasoning and hidden instructions are excluded. Full unfiltered transcript: 待补. Final reply and its usage remain pending until the log appends them; rerun this exporter afterward.

`raw-token-count-events.jsonl` preserves original Phase A events; `usage-windows.json` retains original boundary counters and differences. The parent collector tracks subsequent events automatically; these exports are snapshots, not final invoices.

`rule-index.json` and `source-inventory.json` support source references. `write_design.py` authors Markdown only; it is not the proposed AST converter. No source conversion or React runtime verification occurred.

Canonical HEAD at export: `2176881a9810633a8de7753456dbd63ee44b27c6`. Phase record captures branch/status; a post-commit export records the documentation commit.

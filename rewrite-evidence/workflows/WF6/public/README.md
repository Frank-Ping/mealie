# WF6 evidence publication

This is a sanitized, size-reduced public projection of the completed WF6 experiment, published to the author's fork on 16 October 2026. The accepted experiment ends at commit `565351c0f9daa1b5757baa6d30fb482db177a8da`. The later publication commit adds documentation and evidence only. It does not rerun a stage, change application behavior, reset the repair budget, or revise the sealed token and timing ledgers.

## Result and actual rewrite scope

The final mixed Vue/React regression passed **66/66 routes, 15/15 flows and 1/1 guard**, without skips or added retries. React owns the two selected recipe route templates, real group-scoped list/search/read-only details, logout, role-appropriate links to retained Vue settings, and comment creation with persistence and error recovery. The other 64 route templates remain Vue-owned. This is a bounded coexistence rewrite; the mixed regression totals do not mean that React replaced 66 pages or the entire Vue application.

Read the [results](evidence/WF6-RESULTS.md), [report material](evidence/WF6-REPORT-MATERIAL.md), [S7 audit](evidence/steps/S7/audit.json), [commit ledger](evidence/steps/S7/commits.json), and [final S6 regression](evidence/steps/S6/continuation-03/full-regression-summary.json).

## Failures and human intervention remain visible

- [S1](evidence/steps/S1/result.md) remains **partial**, with an unknown interrupted-session token gap and the original **318 TypeScript diagnostics / FAIL**. No missing usage is estimated as zero. The difference from the historical count of 315 remains unexplained.
- The [original S6 FAIL](evidence/steps/S6/result.md) and its four failing flows remain in this package. The [first continuation](evidence/steps/S6/continuation-01/result.md) demonstrated the existing explicit Vue path and did not retroactively pass the original React assertions.
- The [second continuation](evidence/steps/S6/continuation-02/result.md) records the authorized scope extension, two repair rounds, their failures and the exhausted 2/2 cap. The second comment assertion matched a draft before a successful request; that result remains a failure.
- The [third continuation](evidence/steps/S6/continuation-03/result.md) records the explicit authorization for one additional round, the resulting PASS, and the [repair budget history](evidence/steps/S6/continuation-03/repair-budget.json). Actual user prompts and command records are included in the corresponding stage directories; their original language is retained.
- The [independent persistence evidence](evidence/steps/S6/continuation-03/browser/persistence-redacted.jsonl) confirms an actual POST 201 and refreshed GET 200 for the same comment record. The separately injected POST 500 verifies draft recovery; it is not evidence of a successful backend write.

## Final accounting and boundaries

The [final ledger](evidence/usage/usage-ledger.json), [ledger CSV](evidence/usage/usage-ledger.csv), [boundary records](evidence/usage/stage-boundaries.jsonl), [provider token events](evidence/usage/raw-token-events.jsonl), and stage token records retain their numerical counters and completeness flags.

| Category | Known total tokens | Completeness |
|---|---:|---|
| Initialization / preparation | 596,523 | Partial; missing initial boundary |
| S0 | 3,121,194 | exact_reported |
| Extra discussion / P1 preparation | 12,126,907 | Generic export provisional; P1 independently exact and already included |
| S1 | 30,308,626 | Partial; unknown interruption gap |
| S2–S6 | 63,797,812 | exact_reported |
| S6, included in S2–S6 above | 33,650,995 | exact_reported; four non-overlapping segments |
| S7 | 3,887,134 | exact_reported; final reply included |

Cached tokens are included in input; reasoning tokens are included in output. Neither is added a second time. No exact grand total is asserted across incomplete categories. The sealed experimental execution record is **177 min 26.301 s**, leaving **2 min 33.699 s** of the 180-minute execution budget; inter-stage human waiting is tracked separately. This later publication work belongs outside those sealed stage boundaries.

## Package contents, privacy, and omissions

`evidence/` mirrors the retained stage results, prompts, command records, logs, structured browser results, failure contexts, diffs, scripts, manifests and final usage exports. Files are projections: credential values and private account metadata have been removed and workstation path prefixes normalized. Ordinary English logs and original-language user prompts remain readable. Sanitized scripts are provenance evidence and may require restoring environment-specific paths before reuse.

[publication-manifest.json](publication-manifest.json) lists **every file** in the local evidence tree, its original byte count and SHA-256, the publish/omit decision and reason, and the public path and SHA-256 where retained. Original experimental manifests continue to describe the original local bytes; use this publication manifest to validate public bytes. Local originals were left untouched. Selected traces use shared compressed objects; both original and sanitized entry hashes are recorded.

Omissions include duplicate HTML report/viewer bundles, repetitive traces, interrupted expanded browser artifacts, Python caches, redundant generated static assets, and oversized S0 diagnostic dumps. Command metadata, exit statuses, structured results, representative S1 failure evidence, all S6 trace stages, and final browser evidence remain. Dependencies, runtime environments, database files, authentication storage and credentials are not part of the publication. The omission policy applies to failures and successes alike.

The historical result documents may refer to omitted local report bundles or original `trace.zip` paths. Consult the publication manifest for each disposition, and the trace catalog for retained trace IDs. The README links above point to the canonical published records.

## Inspect selected Playwright traces

The trace payloads are deduplicated by the SHA-256 of their sanitized bytes. Shared resources are stored once under `trace-objects/`; each selected trace has an entry manifest under `traces/`. The Python standard-library helper verifies hashes and recreates a normal trace ZIP:

```bash
cd rewrite-evidence/workflows/WF6/public
python3 restore_traces.py --list
python3 restore_traces.py --check-only
python3 restore_traces.py --id TRACE_ID
npx playwright show-trace restored-traces/TRACE_ID/trace.zip
```

Replace `TRACE_ID` with a value from [trace-catalog.json](trace-catalog.json). Use `--all` to restore all selected traces. Restored ZIPs contain sanitized bytes and are derived artifacts, so their archive hashes are not claimed to match the private originals. The script writes to an ignored `restored-traces/` directory and refuses to overwrite an existing trace ZIP.

## Publication authorization

After the experiment, the user explicitly requested publication of WF6 evidence and logs to the corresponding branch and instructed that unnecessary files be omitted. These are the actual instructions, kept in their original language:

> 请帮我把WF6的证据，日志等推送到对应的分支
>
> 哪些文件很占空间，是否可以不需要上传
>
> 不需要的直接忽略

This authorizes this later push to `Frank-Ping/mealie`, branch `rewrite/wf6-route-coexistence`, and the documented omissions. It supersedes the experiment's earlier no-push boundary only for this publication. No upstream branch or pull request is modified. Public copies do not replace original failure evidence or cross-session accounting boundaries.

The existing English-only [WF6-Report.docx](WF6-Report.docx) is included unchanged as a reader-facing report. Evidence navigation should use this public index; original workstation links in the Word document may not resolve on another machine.

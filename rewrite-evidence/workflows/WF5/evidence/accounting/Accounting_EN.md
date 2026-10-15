# WF5 accounting and time boundaries

This note reports the completed WF5 experiment as WF5. Its formal design and sample implementation used **8,992,891 provider-reported tokens**. The WF5 endpoint was commit `8b0fae128ea823ebee4a6507d274df1f8987e8d1`; its Gate 2 outcome remained **NOT READY / batch conversion stopped**. Subsequent independent review and accounting work are separate records. No later rewrite results or token use are included.

The figures below were checked against existing counter-boundary files and the visible completion records. The original evidence has not been edited. Monetary fees, separately metered active assistant time and measured human review time are **unavailable**, rather than zero.

## Completed execution usage

| Scope | Input | Cached input subset | Output | Reasoning output subset | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Phase A: rule design | 2,332,216 | 1,987,328 | 29,302 | 7,401 | 2,361,518 |
| Phase B: implementation and sample checks, through its final reply | 6,551,779 | 6,390,400 | 79,594 | 32,877 | 6,631,373 |
| **Formal Phase A+B** | **8,883,995** | **8,377,728** | **108,896** | **40,278** | **8,992,891** |

The formal total excludes earlier baseline work, prompt preparation and usage-recorder setup. It also excludes the separate post-stop audit and follow-up records below. The formal total is already the sum of its two phases; it must not be added to those phases again.

The main conversation's tracking window also includes **S0 usage-recorder setup**: 2,255,369 input, 2,229,632 cached input, 16,581 output, 10,105 reasoning output, **2,271,950 total tokens**. Accordingly, the broader tracked window is **11,264,841 tokens**, comprising S0+A+B. This is not the formal implementation total. Its reported uncached input is 532,004 tokens; formal A+B uncached input is 506,267 tokens.

Sources: [main tracker USAGE.md, lines 5–23](Main_Usage_Historical.md), [usage-summary.json](main-completed-usage-summary.json), and the WF5-only fields in [the later sealed boundary record](Sealed_R2_Accounting_Extract.json). A compact [Sealed_R2_Accounting_Extract.json](Sealed_R2_Accounting_Extract.json) is included beside this note, retaining the original source path and SHA256. The original boundary file is located in the subsequent experiment's evidence directory, but this note extracts only `R2PhaseA`, `R2PhaseBThroughFinalReply`, `R2FormalThroughFinalReply` and the explicitly separated pre-extension follow-up fields. Its location does not make these figures subsequent rewrite usage.

## Preparation outside the formal run

| Recorded conversation window | Total tokens | Allocation limit |
| --- | ---: | --- |
| Shared baseline and related preparation discussion | 7,101,573 | Includes discussion and preparation within the named prompt window; not a precise baseline-only allocation |
| WF5 prompt-template preparation | 934,188 | Separate preparation window before tracking setup; not implementation |
| S0 usage-recorder setup | 2,271,950 | Included in the broader tracked window, excluded from formal A+B |

Earlier discussion is excluded from the designated tracking window; it is not assumed to have cost zero. These overhead estimates use cumulative-counter differences between named conversation boundaries. They are not shell-only costs, active-work measurements or complete costs of all historical conversations and subagents. The baseline measurement command run took **210 seconds**; that command duration is distinct from the surrounding preparation conversation window.

Source: [phase-a/usage-windows.json](preparation-and-phase-a-snapshots.json) and [phase-a/README.md](Phase_A_Snapshot_Historical.md).

## Independent audit and later accounting

| Separate completed scope | Input | Cached input subset | Output | Reasoning output subset | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Independent audit: main reviewer | 4,482,886 | 4,391,680 | 27,645 | 7,724 | 4,510,531 |
| Independent audit: gate-contracts subagent | 3,351,893 | 3,262,336 | 22,646 | 5,383 | 3,374,539 |
| Independent audit: sample-semantics subagent | 2,598,324 | 2,523,776 | 13,067 | 4,445 | 2,611,391 |
| Independent audit: infrastructure-semantics subagent | 2,360,163 | 2,281,728 | 9,155 | 2,335 | 2,369,318 |
| **Audit task-agent subtotal** | **12,793,266** | **12,459,520** | **72,513** | **19,887** | **12,865,779** |
| Automatic approval review during the audit | 219,951 | 175,616 | 903 | 517 | 220,854 |
| **All observed completed audit use** | **13,013,217** | **12,635,136** | **73,416** | **20,404** | **13,086,633** |
| Audit accounting follow-up, separate completed window | 1,894,885 | 1,847,296 | 11,851 | 6,279 | 1,906,736 |
| post-stop discussion in the original/main conversation, before the next experiment | 685,384 | 558,720 | 1,207 | 0 | 686,591 |

The completed audit covers the main reviewer, three independently logged task subagents and the separately logged automatic approval review. The task-agent and automatic-review subtotals are already inside **13,086,633**. The **1,906,736** accounting follow-up is outside that frozen audit window. It includes its own final reply; later questions and scope checks are outside both frozen windows.

The **686,591** figure is a different record: the original/main conversation's cumulative increase after WF5 completed and before the next experiment began. Although the historical field is named `postR2DiscussionAndIndependentReviewBeforeR3`, it measures only that original conversation, **not** the multi-session independent audit. Its timestamps overlap the separate audit-accounting follow-up. Keep these records separate; do not label their sum a single sequential execution cost or duration. Any broader cross-session total would require an explicitly defined attribution policy. No all-in total is asserted here.

Audit sources: [audit USAGE.md, lines 5–28](Audit_Usage_Historical.md) and [review-usage-summary.json](audit-usage-summary.json). Original-conversation follow-up source: `postR2DiscussionAndIndependentReviewBeforeR3` and `lastAvailablePreR3Counter` in [the sealed WF5 boundary record](Sealed_R2_Accounting_Extract.json).

## UTC and Auckland time

All dates in the following table are in **2026**. Pacific/Auckland was **UTC+13:00** on these dates. The timezone conversion was checked using the named New Zealand timezone and its daylight-saving rules. All UTC timestamps are retained to make the boundaries reproducible.

| Window or event | UTC | Pacific/Auckland | Interpretation |
| --- | --- | --- | --- |
| Shared preparation prompt window | 13 Oct 08:37:11.721–09:16:01.703 | 13 Oct 21:37:11.721–22:16:01.703 | 38.83 elapsed minutes; conversation window |
| Prompt-template preparation | 13 Oct 09:16:01.703–09:26:12.566 | 13 Oct 22:16:01.703–22:26:12.566 | 10.18 elapsed minutes; preparation |
| S0 recorder setup | 13 Oct 09:26:12.566–09:39:59.423 | 13 Oct 22:26:12.566–22:39:59.423 | 13.78 elapsed minutes; setup |
| Phase A, prompt to final reply | 13 Oct 09:39:59.423–09:59:36.276 | 13 Oct 22:39:59.423–22:59:36.276 | 19.61 elapsed minutes |
| Phase B, prompt to final reply | 13 Oct 10:06:11.148–10:58:34.735 | 13 Oct 23:06:11.148–23:58:34.735 | 52.39 elapsed minutes |
| Formal run, first prompt to final reply | 13 Oct 09:39:59.423–10:58:34.735 | 13 Oct 22:39:59.423–23:58:34.735 | 78.59 elapsed minutes, including the 6.58-minute interval between phases |
| Final WF5 provider counter | 13 Oct 10:58:34.904 | 13 Oct 23:58:34.904 | Counter includes the final reply |
| Independent audit | 13 Oct 11:08:48.341–11:29:39.359 | 14 Oct 00:08:48.341–00:29:39.359 | 20.85 elapsed minutes; independent completed window |
| Audit accounting follow-up | 13 Oct 11:29:39.402–11:36:42.492 | 14 Oct 00:29:39.402–00:36:42.492 | 7.05 elapsed minutes; separate window |
| Original-conversation post-stop counter bracket | 13 Oct 10:58:34.904–11:34:19.893 | 13 Oct 23:58:34.904–14 Oct 00:34:19.893 | 35.75 minutes between counters; includes idle gaps and must not be treated as active discussion or review time |

The original-conversation post-stop discussion itself comprised four user turns, starting at `2026-10-13T11:31:17.038Z` and completing at `11:34:19.910Z` (14 October, 00:31:17.038–00:34:19.910 Auckland time). Its approximately 3.05-minute prompt-to-completion span is also elapsed wall time, not a measured human effort value. These visible records are in the main source session referenced by `tracking-config.json`, source lines 1525–1561.

The original Phase A exporter measured 19.08 minutes **to its export snapshot**, before the final reply. The original Phase B exporter measured 51.88 minutes **to its export snapshot**, also before its final reply. Those are valid historical snapshot timings and are not the completed phase timings above. Elapsed time includes tool execution, model work, waiting and gaps. It cannot establish active assistant time or human review minutes. Parallel audit-agent times must not be summed into the root audit's elapsed wall window.

Sources: [phase-a/phase-record.json](phase-a-record.json), [phase-a/visible-transcript-finalized.jsonl](../transcripts/Phase_A_Visible_Through_Final.jsonl), [phase-b/usage-boundaries.json, lines 182–190](phase-b-provisional-boundaries.json), the sealed WF5 boundary file, and the audit's per-session completed boundaries.

## Provisional snapshots and completed boundaries

| Historical export | Historical total | Completed replacement | Handling |
| --- | ---: | ---: | --- |
| Phase A `usage-windows.json` / original README | 2,127,948 | 2,361,518 | Retain the historical snapshot; use `finalized-usage.json` for completed Phase A |
| Phase B `usage-boundaries.json` / original README | 6,227,467 | 6,631,373 | Retain the snapshot ending at 10:56:47.746Z; use the final counter at 10:58:34.904Z |
| Formal A+B in the original Phase B export | 8,588,985 | 8,992,891 | Replace for completed accounting; never add the two versions |

The original Phase B export cutoff was `2026-10-13T10:58:03.879520Z`; its latest included usage event was `10:56:47.746Z`. The finalized main tracker and later sealed WF5 boundary resolve the previously pending final-response usage. Consequently, the independent provenance note's statement that the **historical export** was provisional remains accurate, while treating the completed WF5 total as unavailable would now be stale. The original report and exports remain unchanged.

The final reply occurs in the original source log at line 1510; the final provider counter is at line 1512; the matching task-completion event is at line 1513 (`2026-10-13T10:58:34.922Z`). The sealed file uses a zero-based `ordinal` of 1511 for the same provider event. This difference is an indexing convention, not a different counter.

Sources: [phase-a/finalized-usage.json](phase-a-finalized-usage.json), [phase-b/README.md](Phase_B_Snapshot_Historical.md), [audit provenance-notes.md, line 42](../post-stop-audit/Provenance_Notes_Historical.md), and the sealed boundary.

## Counting method and limits

- Use differences between provider cumulative snapshots at defined boundaries. Do not sum the raw cumulative snapshots themselves. Duplicate snapshots contribute zero additional usage.
- `total = input + output`. Cached input is already a subset of input. Reasoning output is already a subset of output. Neither subset is added again.
- The main execution session is `01a13444-0c1c-7e81-b13f-8a41c4be747d`. The audit's root session is `01a134b4-e957-7781-8829-8a299d591188`; its three task subagents and automatic approval review have independent session records. The audit JSON stores their IDs, source-log hashes, baseline/end counters, source lines and completion events.
- The audit source explicitly includes context input, tool results entering later requests, retries, extra test organization, report writing and final replies. A CLI command without a model request has no inferred token cost.
- Token usage is not a monetary invoice. Account credit snapshots, elapsed time and generic model prices do not establish the actual billed fee for these experiments. No currency conversion or fee estimate is made.
- Recorded unlimited token policy means no experiment token cap was imposed; it does not imply unlimited account entitlement or zero monetary cost.
- No separately metered active assistant time, measured human review time or complete historical multi-conversation cost is available. No such values have been inferred.

## Report-ready wording

> WF5 used 8,992,891 provider-reported tokens for its formal WF5 design and sample implementation phases: 2,361,518 in Phase A and 6,631,373 in Phase B. The formal run lasted approximately 78.59 elapsed minutes, including the interval between phase prompts. Recorder setup, earlier baseline and prompt preparation, and the subsequent independent audit are reported separately. The completed audit used 13,086,633 observed tokens across its main reviewer, three subagents and automatic approval review. Audit accounting and the original conversation's post-stop discussion have separate, partly concurrent windows and are not folded into the formal execution total. Monetary fees, active assistant time and human review time were unavailable. Cached input and reasoning output are already included within their respective input and output categories.

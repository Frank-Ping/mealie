# WF5 public historical evidence

WF5 is the rule-driven migration experiment. Its endpoint is `8b0fae128ea823ebee4a6507d274df1f8987e8d1`; final implementation checks used `b57453838ef770a32188159350d5f9971f8b94e1`. **Gate 2 remained NOT READY: three of five fixed samples were blocked, so batch conversion stopped.** This directory publishes a compact, sanitized evidence subset and retrospective English explanations. No application tests or experiment stages were rerun to prepare it. Later rewrite results are excluded.

Start with [Appendix_EN.md](Appendix_EN.md). The actual historical commits and artifact bytes are available directly in this publication repository; this directory contains no embedded Git object store, source ZIP, TAR snapshot, dependency cache or new PDF.

| Evidence | What it establishes |
| --- | --- |
| [Baseline summary](baseline/BASELINE.md), [metrics](baseline/baseline.json), [raw reports](baseline/raw-reports/) | Original Vue result: 517 unit tests, 66 routes, 15 flows, 82 browser checks; existing 314 type diagnostics; statement coverage 15.1% |
| [Final implementation checks](implementation-checks/final-wsl/check-results.json), [unit result](implementation-checks/final-wsl/unit-results.json), [rule log](implementation-checks/final-wsl/rules.log) | Six final WSL commands passed; 36 target unit tests and 20 rule checks. These are historical sample checks, not whole-app parity |
| [Selected failure history](implementation-checks/failure-history/) | Earlier Windows lint and WSL type/unit/component-build failures, tied to their own records; not substituted for the final result |
| [Accounting](accounting/Accounting_EN.md), [completed counters](accounting/main-completed-usage-summary.json), [sealed WF5 extract](accounting/Sealed_R2_Accounting_Extract.json) | Completed formal A+B: 8,992,891 tokens; preparation, audit and partly concurrent follow-up scopes remain separate; fees/human time unavailable |
| [Post-stop audit summary](post-stop-audit/Summary_EN.md), [fault results](post-stop-audit/fault-results.json), [probe results](post-stop-audit/probe-results.json), [routine checks](post-stop-audit/check-results.json) | Additional audit after stopping: 19 fault/control checks (11 safe, 8 unsafe); 16 added behavior probes (14 passed, 2 failed); six routine commands still passed |
| [Original-language prompts](prompts/), [retrospective English translations](prompts/Retrospective_Translations_EN.md) | Actual user instructions were Chinese; English translations were prepared after execution |
| [Phase A visible projection](transcripts/Phase_A_Visible_Through_Final.jsonl), [Phase B visible projection](transcripts/Phase_B_Visible_Through_Final.jsonl) | 42 and 101 allowlisted visible message/tool records through each final reply, with original timestamps and one-based source-row references |

The numbered generation/revision rounds do not establish complete per-round semantic approvals. Only two framework-free helper suites, totaling ten cases, transferred unchanged. The 36 target tests do not replace the 517 Vue tests. The later audit findings supplement the stopped result; they were not the original stopping reason or a human Gate 2 approval.

## Publication transformations

These files are **modified historical projections**, not claimed byte-identical copies. [PUBLIC_MANIFEST.json](PUBLIC_MANIFEST.json) maps each private package-relative source identifier and original SHA256 to its public path, public SHA256 and transformation. [Redactions_EN.md](Redactions_EN.md) explains omitted categories. [SHA256SUMS.txt](SHA256SUMS.txt) covers all distributed files except itself. [PUBLIC_VERIFICATION.json](PUBLIC_VERIFICATION.json) records preparation validation separately from historical tests.

Provider account credits, balances, rate limits, entitlement/plan fields, connector attribution, internal message metadata and private raw-session locations are removed. Workstation and execution paths use `<WORKSPACE>`, `<EXECUTION_COPY>`, `<PRIVATE_SESSION_LOG>`, `<PRIVATE_HOME>` and `<RUNTIME>`. Historical workflow labels, source/test semantics, timestamps, counts, checkpoint identifiers and failure messages remain where they support the evidence.

Visible JSONL records allowlist user messages, assistant commentary/final messages and tool call/results. Hidden reasoning and system/developer records are excluded. Tool text can still contain historical code that *names* metadata fields; that is source code, not retained private metadata. These projections are evidence for reading and cannot reconstruct a complete platform session. The original source hashes permit comparison if the private originals are separately supplied to an authorized reviewer.

The audit's English summary and original Chinese report are kept separate from the formal implementation results. Audit counters preserve independent session boundaries and numeric differences. Cached input is inside input; reasoning output is inside output. No monetary cost is inferred.

## Reproducing preparation validation

From this directory, run the standard-library verifier:

```sh
python tools/verify_public_evidence.py --root .
```

It reads these files, checks hashes, numeric accounting and saved result counts, and validates the projection scope. It does not run Mealie, build the app, alter experiment outputs or authenticate historical execution. `tools/prepare_public_evidence.py` documents the deterministic projection procedure; reproducing that procedure requires the private original package and canonical historical repository as explicitly supplied input paths.

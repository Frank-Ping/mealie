# WF6 evidence index / 证据索引

Run: wf6-rerun-20261014-01. Original raw logs remain outside checkout.
原始日志位于 checkout 外；旧 run 不混入新成绩。

- [Result](steps/S0/result.md)
- [Actual prompt](steps/S0/[REDACTED])
- [Original handoff user prompt](steps/S0/handoff-user-[REDACTED])
- [Visible transcript](steps/S0/visible-transcript.jsonl)
- [Transcript coverage](steps/S0/transcript-coverage.json)
- [Commands](steps/S0/commands.jsonl)
- [Bootstrap/provider command coverage](steps/S0/provider-command-events.jsonl)
- [Original tool events](steps/S0/provider-tool-events.jsonl)
- [Failures and repairs](steps/S0/attempts.jsonl)
- [Pinned snapshot provenance](steps/S0/input-provenance.json)
- [Input hashes](steps/S0/input-hashes.json)
- [Environment](steps/S0/environment.json)
- [Ports](steps/S0/port-probe.json)
- [Collector acceptance](steps/S0/collector-acceptance.json)
- [Source state](steps/S0/source-state.json)
- [Diff](steps/S0/diff.patch)
- [Source inventory](steps/S0/file-manifest.json)
- [Audit](steps/S0/evidence-audit.json)
- [Usage](usage/USAGE.md)
- [Step usage](steps/S0/token-usage.json)
- [Ledger JSON](usage/usage-ledger.json)
- [Ledger CSV](usage/usage-ledger.csv)
- [Raw usage events](usage/raw-token-events.jsonl)
- [Stage boundaries](usage/stage-boundaries.jsonl)
- [Tracking configuration](usage/tracking-config.json)
- [Observed schema/settings](usage/session-schema.json)
- [Collector](usage/collect_usage.py)
- [Recorder](usage/record_command.py)
- [Operation](usage/README.md)
- [Timing](timing.csv)
- [Budget](budget-state.json)
- [Decisions](decisions.jsonl)
- [Progress](PROGRESS.md)
- [Manifest](evidence-manifest.json)
- [Contract](../mealie-wf6-coexist/rewrite-evidence/workflows/WF6/WF6-CONTRACT.md)

Command recorder events and provider orchestration events overlap; never sum their durations. Bootstrap limitations are explicit.
命令记录与 provider 工具记录有重叠；耗时不可重复相加。

## Post-S0 preparation / S0 后准备

- [P1 result](preparation/P1-audit-dependencies/result.md)
- [Independent S0 audit](preparation/P1-audit-dependencies/S0-AUDIT.md)
- [Dependency audit](preparation/P1-audit-dependencies/dependency-audit.json)
- [P1 accounting](preparation/P1-audit-dependencies/token-usage.json)
- [P1 visible transcript](preparation/P1-audit-dependencies/visible-transcript.jsonl)

## S1 fresh baseline / 新基线

- [Result](steps/S1/result.md)
- [Actual prompt](steps/S1/[REDACTED])
- [Boundary](steps/S1/request-boundary.json)
- [P1 final settlement](steps/S1/P1-settlement.json)
- [Commands](steps/S1/commands.jsonl)
- [Failures and repairs](steps/S1/attempts.jsonl)
- [Measurements](steps/S1/baseline-measurements.json)
- [Build](steps/S1/build-artifact.json)
- [First browser attempt](steps/S1/browser/results.json)
- [Native browser attempt](steps/S1/browser-native/results.json)
- [Source state](steps/S1/source-state.json)
- [File manifest](steps/S1/file-manifest.json)
- [Visible transcript](steps/S1/visible-transcript.jsonl)
- [Original provider commands](steps/S1/provider-command-events.jsonl)
- [Transcript coverage](steps/S1/transcript-coverage.json)
- [Usage](steps/S1/token-usage.json)

## S2 all-Vue gateway / 全 Vue 网关

- [Result](steps/S2/result.md)
- [Prompt](steps/S2/[REDACTED])
- [Request/budget boundary](steps/S2/request-boundary.json)
- [S1 settlement](steps/S2/S1-settlement.json)
- [Commands](steps/S2/commands.jsonl)
- [Attempts](steps/S2/attempts.jsonl)
- [Build](steps/S2/build-artifact.json)
- [Served build](steps/S2/served-build.json)
- [Browser report](steps/S2/browser/results.json)
- [Redacted requests](steps/S2/browser/requests-redacted.json)
- [Source snapshot](steps/S2/source-state.json)
- [Diff](steps/S2/diff.patch)
- [Files](steps/S2/file-manifest.json)
- [Transcript](steps/S2/visible-transcript.jsonl)
- [Transcript coverage](steps/S2/transcript-coverage.json)
- [Provider commands](steps/S2/provider-command-events.jsonl)
- [Usage](steps/S2/token-usage.json)

## S3 real coexistence / 真实共存

- [Result](steps/S3/result.md)
- [Prompt](steps/S3/[REDACTED])
- [Boundary](steps/S3/request-boundary.json)
- [S2 final usage](steps/S3/S2-settlement.json)
- [Commands](steps/S3/commands.jsonl)
- [Attempts](steps/S3/attempts.jsonl)
- [Dependencies](steps/S3/dependency-versions.json)
- [Two builds](steps/S3/build-artifacts.json)
- [Served provenance](steps/S3/served-build.json)
- [Browser results](steps/S3/browser/results.json)
- [Session/document summary](steps/S3/browser/requests-redacted.jsonl)
- [Source](steps/S3/source-state.json)
- [Diff](steps/S3/diff.patch)
- [Files](steps/S3/file-manifest.json)
- [Transcript](steps/S3/visible-transcript.jsonl)
- [Coverage](steps/S3/transcript-coverage.json)
- [Provider commands](steps/S3/provider-command-events.jsonl)
- [Usage](steps/S3/token-usage.json)

## S4 real recipe / 真实食谱

- [Result](steps/S4/result.md)
- [Prompt](steps/S4/[REDACTED])
- [Boundary](steps/S4/request-boundary.json)
- [S3 final settlement](steps/S4/S3-settlement.json)
- [Mapping](steps/S4/source-mapping.json)
- [Features](steps/S4/feature-inventory.json)
- [Tests](steps/S4/test-inventory.json)
- [Frozen selection](steps/S4/frozen-selection.json)
- [Frozen results](steps/S4/browser/frozen-results.json)
- [Supplemental results](steps/S4/browser/results.json)
- [Redacted requests](steps/S4/browser/requests-redacted.jsonl)
- [Commands](steps/S4/commands.jsonl)
- [Attempts](steps/S4/attempts.jsonl)
- [Builds](steps/S4/build-artifacts.json)
- [Served](steps/S4/served-build.json)
- [Source](steps/S4/source-state.json)
- [Diff](steps/S4/diff.patch)
- [Files](steps/S4/file-manifest.json)
- [Transcript](steps/S4/visible-transcript.jsonl)
- [Coverage](steps/S4/transcript-coverage.json)
- [Provider commands](steps/S4/provider-command-events.jsonl)
- [Usage](steps/S4/token-usage.json)

- S5 real journey/boundaries/detection: [bilingual result](steps/S5/result.md), [raw artifact manifest](steps/S5/browser-manifest.json), [repairs](steps/S5/repair-budget.json).

- S6 explicit rollback/full regression: [result](steps/S6/result.md), [strict summary](steps/S6/full-regression-summary.json), [failures](steps/S6/failure-classification.json), [ownership](steps/S6/route-ownership.csv).

- S6 continuation 01: [existing explicit Vue function audit](steps/S6/continuation-01/result.md), [four original traces](steps/S6/continuation-01/original-trace-review.json).

- S6 continuation 02 explicit limited extension: [latest result](steps/S6/continuation-02/result.md), [feature scope](steps/S6/continuation-02/feature-inventory.csv), [repair history](steps/S6/continuation-02/repair-budget.json).

- S6 continuation03 final authorized comment state fix: [result](steps/S6/continuation-03/result.md), [measurements](steps/S6/continuation-03/measurements.json).

## S7 audit and reports / S7 审计与报告

- [Results](WF6-RESULTS.md)
- [Report material](WF6-REPORT-MATERIAL.md)
- [Audit](steps/S7/audit.json)
- [S6 final settlement](steps/S7/S6-final-settlement.json)
- [Usage category summary](steps/S7/USAGE-SUMMARY.md)
- [S7 result](steps/S7/result.md)

- [Historical snapshot/accounting audit](steps/S7/historical-source-and-accounting-audit.json)
- [Raw test and trace audit](steps/S7/raw-test-trace-audit.json)

- [S7 report commit/source state](steps/S7/source-state.json)
- [Manifest validation](steps/S7/manifest-validation.json)
- [Stage execution timing](steps/S7/stage-execution-timing.json)

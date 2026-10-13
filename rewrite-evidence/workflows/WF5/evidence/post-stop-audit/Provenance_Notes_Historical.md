# Independent Gate 2 provenance and record review

This review reads the canonical repository, frozen evaluator, historical evidence and final artifacts. It does not edit those inputs, regenerate artifacts or run tests. All new outputs are confined to this independent-review directory. `provenance.mjs` is the replayable inspector and `provenance.json` records its algorithms, read-only Git commands, exact hashes, counts, mismatches and limits.

Paths below are relative to the workspace `<WORKSPACE>`.

## Findings

### P2: historical checkpoint excludes a tracked symlink while claiming all tracked files

- Location: `wf4-r2-evidence/workflow-sessions/phase-b/save_checkpoint.py:22` only adds TAR members for which `member.isfile()` is true. Its scope statement at line 25, repeated in `canonical-checkpoint.json:1811`, says all committed canonical Windows repository files.
- The Git index and HEAD contain 1,805 entries. The historical hash map contains 1,804 entries. The sole omitted path is `CLAUDE.md`, Git mode `120000`, whose Git blob is the nine-byte link target `AGENTS.md` (Git SHA1 `47dc3e3d863cfb5727b87d785d09abf9743c0a72`). The TAR contains 1,804 ordinary files plus the `CLAUDE.md -> AGENTS.md` symlink. All 1,804 ordinary archive-file hashes exactly match the recorded map.
- `wf4-r2-evidence/workflow-sessions/phase-b/check_snapshot.sh:42-48` verifies only that map, so `wsl-check-results.json:93-94` does not attest to the omitted symlink. The broader description at `README.md:19` and `mealie-wf4-rerun/rewrite-evidence/workflows/WF4-R2-Gate-2-review.md:45` should be read as 1,804 ordinary-file checks, not complete tracked-entry verification.
- Current Windows `core.symlinks=false` exposes `CLAUDE.md` as a regular nine-byte file. This independent review hashes it using the Git blob algorithm and verifies its exact target bytes against HEAD. It also separately records the historical TAR link metadata. There is no observed content drift; the finding is an incomplete historical assurance scope.
- Evidence: `provenance.json` sections `canonical.blobCheck.symlinks`, `checkpoint.omittedTrackedPaths`, `checkpoint.archiveSymlinks`, `checkpoint.scopeCorrection`.

### P2: three numbered sample rounds lack explicit per-round semantic review verdicts

- Requirement: `mealie-wf4-rerun/rewrite-evidence/workflows/WF4-R2-plan.md:25` requires review verdict per full file and rule. Line 74 requires each round to record each sample's unsupported constructs, reusable changes, residual file-specific semantic patch and manual review verdict.
- Observation: `mealie-wf4-rerun/rewrite-evidence/workflows/WF4-R2-B/round-1-results.json:25,54,82,103,129`, `round-2-results.json:25,54,82,103,129` and `round-3-results.json:25,54,82,103,129` all leave every sample's `semantic` value as `pending review`. Revision 2/3/4 result files retain the same statuses. The final pure manifest records them at `WF4-R2-artifacts/round-3/revision-4/pure/manifest.json:45,74,102,123,149`.
- `WF4-R2-Gate-2-review.md:15,19-21` describes three internal sample reviews and corrections, but no explicit internal reviewer verdict is distinguished from the intentionally pending human Gate 2 review. Numbered generations and passing primitives cannot establish that the stipulated per-file semantic reviews were completed.
- Consequence: the stopped/not-ready outcome is supported, but the review-round record is insufficient as evidence of complete internal semantic review. A later audit table should document which checks actually occurred, their reviewer, sample/rule verdict, raw evidence and remaining repair. It must not retrospectively label pending semantics as passed or change the original unsuccessful Gate 2 result.
- Evidence: `provenance.json` sections `rounds`, `selectedArtifact.samples`, `limitations`.

## Independently verified preservation and attribution

- Canonical HEAD is `8b0fae128ea823ebee4a6507d274df1f8987e8d1`; working tree is clean. All 1,805 HEAD Git blobs match current filesystem bytes, including the mode-120000 link representation. All 1,805 hashes recorded by the root review's `canonical-before.json` also remain identical after this inspector.
- `frontend/` and `mealie/` have no Git diff against original source `4b9ca06b6581f7152e164ea0fd9d4da366975a79`. Full current-byte verification against HEAD prevents an unstaged-byte difference from being hidden by this commit comparison.
- Evaluator HEAD is `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`. All 1,789 tracked evaluator Git blobs match current bytes; actual evaluator symlinks use their `readlink` target bytes. No tracked evaluator changes were observed. Untracked/ignored runtime files are outside this assurance.
- Final revision-4 manifest source SHA, five tool SHA256 entries, seven infrastructure entries, five sample-source hashes, target lock hash and the two generated TSX files in pure/refined/published match. The explicit refinement operations array is empty. See final manifest lines 2-20, 26, 52, 81, 109, 130, 153-155 and refined `refinement-manifest.json:2-3`.
- Historical `canonical-snapshot.tar` SHA256 matches its checkpoint. The three current-byte differences from the older `b57453838ef770a32188159350d5f9971f8b94e1` checkpoint are only `gate-2-verdict.json`, `WF4-R2-Gate-2-review.md`, and `WF4-R2-state.md`; Git shows these are the subsequent `8b0fae1` evidence-record commit. No code mismatch is attributed to those document updates.
- Six historical pure artifacts each have two TSX files matching their recorded output hashes. Round 1/2 omit comprehensive tool/infra fields; they are not independently replayable tool bundles. `WF4-R2-Gate-2-review.md:27` already states this limit. This inspector does not reconstruct their unavailable historical implementations.
- All eight reuse pairs (16 exact SHA256 comparisons) match `WF4-R2-B/reuse-manifest.json`. The source-test inventory contains exactly 48 source tests, all matching their recorded SHA256. Independent read-only TypeScript AST traversal finds 817 direct `expect(...)` calls and matches each inventory row's count. It does not infer preserved assertions from that count.
- Only two unchanged helper suites (ten cases) claim exact transfer. `WF4-R2-B/assertion-correspondence.json:136-146` explicitly distinguishes the two added auth probes and the 46 unmigrated files. The original auth suite includes a no-navigation assertion at `frontend/app/middleware/__tests__/auth.test.ts:37`; the alternate target harness at `frontend-react/tests/guards.test.tsx:21-23` asserts protected rendering. The correspondence record does not claim these are unchanged test files.
- Rule status is 20 partial supported subsets/primitives and 15 unimplemented/blocking rules. `gate-2-verdict.json:350-379` includes the required risk groups and acknowledges the unconverted/incomplete semantics. Its `:9` correctly describes 60% as a lower bound rather than two fully verified successes.

## Failure-history and usage boundaries

- Actual Windows lint failure is retained at `wf4-r2-evidence/workflow-sessions/phase-b/checks/20261013T103538001026Z/lint.log:2-5`; it reports `@typescript-eslint/no-unused-expressions` in the then-generated BaseButton. Later pass records belong to subsequent checks.
- Earlier WSL import/build failure is retained under `wsl-attempt-2/` for commit `63e239bb35fab4b53fc8d913b284dfa43edec5a9`; latest sample checks belong to `b574538...`. Old failure logs must not be substituted as results for the final checkpoint.
- `visible-transcript.jsonl:41` preserves actual MUI declaration diagnostics with `exactOptionalPropertyTypes`; `:82` preserves `python: command not found`. These failures are visible historical records, not new executions by this inspector.
- All three usage-window differences equal their cumulative-counter boundaries. The 46 exported raw events end at `2026-10-13T10:56:47.746Z`, matching the boundary record. Recorded Phase B total is 6,227,467 tokens through that counter; it is provisional. `usage-boundaries.json:4-5,185-190` states export cutoff, last usage event, pending human time, unavailable separately metered active time and final-response usage pending. The inspector does not convert token counts into fees or invent final usage.

## Replay and limits

Run the inspector with the recorded bundled Node runtime:

```powershell
& '<RUNTIME>/node/bin/node.exe' '<WORKSPACE>/wf4-r2-evidence/gate2-independent-review/20261013T111104Z/provenance.mjs'
```

It overwrites only its new `provenance.json`. It reads repositories and historical records, computes hashes and parses TypeScript; it does not install packages, mutate Git config, execute tests, create new migration rounds or modify canonical/history files. The report records exact command arguments and algorithms.

No live visual parity, real authentication/transport, tenancy lifecycle or complete React application E2E is verified by this provenance task. Historical logs were read rather than independently authenticated by re-execution. Root review test execution and other agents' converter/adapter findings are separate evidence.

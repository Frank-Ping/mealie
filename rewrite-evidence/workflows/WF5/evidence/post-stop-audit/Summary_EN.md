# Post-stop independent audit: English evidence summary

This document summarizes the saved independent Gate 2 audit of R2. It is filed in the **WF5-R2 English evidence pack**; the historical source documents, paths and identifiers retain the label **WF4-R2**. It is a new English summary, not a replacement for the original audit or a new execution. No tests, services, conversion rounds or repairs were run to prepare it. R3 is excluded.

## Outcome and experiment boundary

The original experiment had already recorded **NOT READY** and stopped batch conversion. Three of the five fixed samples remained unsupported: the home page, food-store composable and default layout. This lower bound of **3/5 = 60%** exceeded the approved **30%** stopping threshold after the three numbered rounds. Generating RecipeChips and BaseButton did not establish two completely verified migrations. The original stopping decision is recorded in [the original Gate 2 submission, lines 3-15](../implementation-checks/Review_Historical_EN.md).

The subsequent independent audit examined the stopped endpoint **`8b0fae128ea823ebee4a6507d274df1f8987e8d1`**, with selected artifacts under `WF4-R2-artifacts/round-3/revision-4/`. It recommended that Gate 2 remain unsuccessful. **The defects discovered by this later audit are additional evidence about the stopped implementation; they must not be presented as the original reasons for stopping R2.** The original stop condition already applied before these independent findings. See [audit scope and recommendation, lines 3-20](Original_Report_ZH.md) and [the stopping-condition discussion, lines 158-178](Original_Report_ZH.md).

The audit is dated **14 October 2026, Pacific/Auckland**; its execution records use UTC on **13 October 2026**. The saved final preservation record identifies the same endpoint, records no canonical or temporary tracked-file drift across **1,805 entries**, and shows the original independent-review Markdown as an **untracked added file**. It therefore sits outside the original committed endpoint. These are historical audit facts, not a claim about the repository's current working-tree status. See [final-preservation.json, lines 2-21](final-preservation.json).

## Findings F1-F6

### F1 [P1]: the rule harness did not check selected expected snapshots or full fixed-sample identity

The rule test checked that two generations agreed, that there were five results, and that each result contained output or diagnostics. The runner checked five distinct IDs, safe paths and existing sources. Neither bound each fixed ID/path/component to the approved inventory nor compared the selected pure output against the reviewed expected snapshot byte for byte. Small-fixture expected checks were substring assertions.

In the independent temporary copy, four changes that should have failed the rule command instead returned **exit 0**:

| Injected change | Observed result |
| --- | --- |
| Remove selected `pure/BaseButton.tsx` | All 20 rule tests still passed. |
| Replace that selected snapshot with an unrelated export | The rule command still succeeded. |
| Substitute RecipeChips for the fixed page's source path while retaining five IDs | The rule command still succeeded. |
| Make the converter emit an incorrect `urlPrefix` payload only for the real RecipeChips component | The rule command still succeeded. |

For the last change, a separate process confirmed that the generated output contained `__AUDIT_WRONG_PAYLOAD__` with empty diagnostics. The injection was effective. Archive/hash verification could detect changed artifacts, but the rule command did not invoke that verification; its passing result was weaker evidence.

**Implication:** passing rule logs could neither prove equality with the reviewed fixed-sample output nor prevent substitution of a difficult sample. The audit recommended an independent acceptance constraint covering exact fixed identities, required expected files, blocked verdicts and complete output bytes, with missing or altered inputs failing. It did not implement this repair. [Original F1, lines 37-52](Original_Report_ZH.md); [saved fault cases, lines 68-129](fault-results.json).

### F2 [P1]: a later CLI failure still rewrote earlier output

The complete generation command published pure and refined artifacts, rewrote `generated/` and result records, and only then performed reuse copying. Staging protected a single `publishArtifacts()` operation; it did not make the whole CLI transactional.

The auditor placed a review marker in the temporary copy's existing `generated/BaseButton.tsx`, then replaced the final reuse target, `redirect.test.ts`, with an empty directory to cause an `EISDIR` failure. The CLI returned **exit 1**, but the earlier generated file's SHA256 changed from `8f71479571688dfbdbeab5056f3082c76dafa4e4ffcac9b0f0894b1dab0d6644` to `3b551ab7ccb18dcc7e79e06de4c977c7eb6573dc67e9920a2e0866f30b1dbe71`; new pure and refined artifacts had already been published.

This fault replay used a temporary `round-3/revision-9` path. It was a failure test, **not a new formal sample round**; the selected formal revision 4 was untouched, and temporary tracked files were restored.

**Implication:** a failing command could leave partially updated state across output locations. The audit recommended pre-validating all destinations and completing work in a temporary tree before coordinated publication, or providing verifiable rollback. Successful single-directory publication checks could not establish whole-command atomicity. [Original F2, lines 54-62](Original_Report_ZH.md); [saved CLI fault, lines 329-345](fault-results.json).

### F3 [P2]: R06 reported success for three event forms with incorrect behavior

The converter evaluated a method reference rather than calling it, invoked arrow functions without an argument, and did not replace Vue's `$event` with the target listener parameter.

| Original Vue listener | Independently observed generated behavior |
| --- | --- |
| `@click="handle"` | `handle` was not called. |
| `@click="(event) => handle(event)"` | `handle` received `undefined`. |
| `@click="handle($event)"` | Execution threw `$event is not defined`. |

All three emitted output with **empty diagnostics** and included **R06** in the applied rules. The independent checks extracted `onClick` listeners from actual generated TSX ASTs, transpiled them and invoked them with a click event. The saved compiler reference used local `@vue/compiler-dom` **3.5.35**; it was not a browser rerun of the source application's Vue **3.5.43** runtime.

**Implication:** these were incorrect successes, not explicit unsupported outcomes. Passing the particular expressions used by the two selected components could not establish general event conversion correctness. The audit recommended correct event invocation/scope handling or explicit blocking, supported by assertions of actual calls and payloads. [Original F3, lines 64-76](Original_Report_ZH.md); [saved event faults, lines 348-392](fault-results.json).

### F4 [P2]: BaseButton silently lost the Vue-specific `block` attribute

Real source callers used `block`. The generated component forwarded attributes to the UI adapter, which did not map `block` to MUI's `fullWidth` or explicitly reject it. An independent JSDOM render of `<BaseButton block />` produced no unsupported error and no `MuiButton-fullWidth` class; React also warned about the unknown non-boolean DOM attribute. The added probe failed.

**Implication:** a real caller's width behavior changed silently, contrary to the conversion contract for supported and unknown attributes. The audit recommended mapping `block` to `fullWidth` or rejecting it explicitly, and defining the supported Vue-specific attributes. It did not claim that all attributes failed: added checks for ID, ARIA, data, title, type and ordinary click behavior passed. [Original F4, lines 78-84](Original_Report_ZH.md); [saved probe results](probe-results.json).

### F5 [P2]: store data-processing failure did not clear loading or set error

The store used `.then(success, rejection)`. An exception from `frozenCopy(data)` inside `success` did not enter that same `then` call's rejection callback. The independent loader returned a `Date`, which the required plain-data validation correctly rejected. After the Promise rejection was caught, however, the snapshot still had **`loading=true` and `error=null`**. The added `loading=false` assertion failed. Existing tests covered a loader throwing directly, but not validation failure inside the success callback.

**Implication:** this implemented primitive could remain in a loading state after a processing error. The audit recommended catching both loader and processing errors and cleaning up state. This finding did not establish migration of the food store: tenant scope, public/private scope and factory semantics remained blocked. Separate reset checks for both old-first and new-first request completion passed. [Original F5, lines 86-92](Original_Report_ZH.md); [saved probe results](probe-results.json).

### F6 [P2]: three numbered rounds lacked explicit per-file semantic-review verdicts

The plan required a review verdict for each complete file and rule, and each round's unsupported constructs, reusable corrections, residual file-specific semantic patches and manual review verdict. Every sample's `semantic` field remained **`pending review`** in the round 1, 2 and 3 result records, revisions 2, 3 and 4, and the selected final pure manifest. The submission described internal reviews but did not separately record their verdicts and the deliberately pending human Gate 2 decision.

**Implication:** the evidence established three numbered generation/check rounds and correction artifacts, but not a complete per-round semantic-review table. The audit did **not** infer that no review occurred, or treat pending human review itself as an error. It recommended documenting the actual reviewer/method, sample and rule verdicts, evidence and remaining repairs, without retroactively promoting pending results to passes. [Original F6, lines 94-100](Original_Report_ZH.md); [independent provenance review, lines 17-23](Provenance_Notes_Historical.md).

## Saved checks and what they establish

### Six routine commands: all exit 0

These commands ran against the unchanged independent Windows copy **before** fault injection and additional probes. `node` below abbreviates the saved bundled executable `<RUNTIME>/node/bin/node.exe`, version **24.19.0**. Their saved working directory was `<EXECUTION_COPY>/frontend-react`. The unit command's JSON output option pointed to the audit directory's `unit-results.json`; full arguments, UTC times and log filenames remain in the linked source record.

| Check | Saved command, with executable abbreviated | Result | Command record |
| --- | --- | --- | --- |
| Rule harness | `node --test ../rewrite-tools/wf4-r2/test.mjs` | **20 passed, 0 failed**, exit 0 | [Lines 5-18](check-results.json) |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit` | 0 diagnostics; `strict=true`, `noUncheckedIndexedAccess=true`, `skipLibCheck=false`; exit 0 | [Lines 20-33](check-results.json) |
| ESLint | `node node_modules/eslint/bin/eslint.js src tests vite.config.ts vite.component.config.ts --max-warnings=0` | 0 errors/warnings; exit 0 | [Lines 35-52](check-results.json) |
| Existing target unit tests | `node node_modules/vitest/vitest.mjs run --reporter=verbose --reporter=json --outputFile.json=.../unit-results.json` | **36 passed, 0 skipped**, exit 0 | [Lines 54-70](check-results.json) |
| Sample SPA production build | `node node_modules/vite/bin/vite.js build` | Passed; exit 0 | [Lines 72-85](check-results.json) |
| Component-library production build | `node node_modules/vite/bin/vite.js build --config vite.component.config.ts` | Passed; exit 0 | [Lines 87-102](check-results.json) |

The audit did not remove strict settings, change the lockfile, update expected output, repair the implementation or ignore failures to obtain these passes. The results demonstrate that the saved subset passed those commands; F1-F6 explain why this was insufficient for Gate 2 or whole-application migration. [Original check interpretation, lines 114-125](Original_Report_ZH.md).

### Nineteen fault/control checks: 11 safe, 8 unsafe

Here, **safe** means the required safety condition held. An expected failure with exit 1 can therefore be a safe result. **Unsafe** means the check exposed a defect; it does not mean the audit script failed to complete.

| Saved fault/control ID | Safety result | Interpretation |
| --- | --- | --- |
| `missing-required-input` | Safe | Required input missing: rejected, exit 1. |
| `missing-fixture-source` | Safe | Fixture source missing: rejected, exit 1. |
| `missing-fixture-expected` | Safe | Fixture expected file missing: rejected, exit 1. |
| `incorrect-fixture-expected` | Safe | Incorrect fixture expected text: rejected, exit 1. |
| `missing-selected-pure-expected` | Unsafe | Selected expected output missing but rule command passed; F1. |
| `corrupt-selected-pure-expected` | Unsafe | Selected expected output corrupted but rule command passed; F1. |
| `substitute-fixed-page-sample` | Unsafe | Fixed page source substituted but rule command passed; F1. |
| `wrong-actual-component-payload` | Unsafe | Incorrect real-component payload but rule command passed; F1. |
| `repeat-generation-and-selected-snapshot` | Safe | Repeated five-sample outcomes agreed; both emitted TSX matched selected pure bytes. |
| `unsupported-syntax-rejected` | Safe | Unknown component produced no output and a blocking diagnostic. |
| `missing-refinement-anchor` | Safe | Rejected without changing the original map. |
| `duplicate-refinement-anchor` | Safe | Rejected without changing the original map. |
| `existing-publication-protected` | Safe | Refused to overwrite an existing artifact directory. |
| `single-directory-publication-atomic` | Safe | Later invalid artifact path prevented publication of the bad directory; staging retained. |
| `late-reuse-failure-cli` | Unsafe | Exit 1 followed earlier output changes and publication; F2. |
| `event-method-reference` | Unsafe | Method reference was not invoked; F3. |
| `event-arrow-event` | Unsafe | Event argument was lost; F3. |
| `event-dollar-event` | Unsafe | Unbound `$event` caused an exception; F3. |
| `temporary-tracked-files-restored` | Safe | No temporary tracked-file drift remained. |

Source: [fault-results.json, lines 4-399](fault-results.json) and [the original audit's fault summary, lines 127-139](Original_Report_ZH.md). The eight unsafe cases comprise **four F1 cases, one F2 case and three F3 cases**.

### Sixteen additional behavior probes: 14 passed, 2 failed

| Probe behavior | Cases | Result |
| --- | ---: | --- |
| Store cleanup after rejection of non-plain loader data | 1 | Failed; F5. |
| Reset preserves the new request under old-first and new-first completion | 2 | Passed. |
| Anonymous auth redirect retains encoded query and hash | 1 | Passed. |
| Injected second-language missing-string fallback and reactive language update | 1 | Passed. |
| `block` maps to full width or is explicitly rejected | 1 | Failed; F4. |
| Ordinary button attributes, submit type and click event payload | 1 | Passed. |
| Real link query/hash and normal Router navigation | 1 | Passed. |
| Caller `preventDefault` cancels Router navigation | 1 | Passed. |
| Ctrl, Meta, Alt, Shift and middle-button clicks are not intercepted by the SPA | 5 | Passed. |
| Updated download URL and one caller callback per click | 1 | Passed. |
| RecipeChips preserves payload identity, prevents default and still bubbles | 1 | Passed. |
| **Total** | **16** | **14 passed; 2 failed; Vitest exit 1.** |

These were independently added tests temporarily placed in the copy and removed afterward. JSDOM modifier checks proved non-interception, not opening a real browser tab. The second language was injected by the audit and did not prove migration of real multilingual resources. See [probe-results.json](probe-results.json), [probe-command.json](probe-command.json) and [original interpretation, lines 141-143](Original_Report_ZH.md).

## Preservation, attribution and limits

The saved audit verified the canonical **1,805 tracked Git entries** against endpoint `8b0fae1`, the frozen evaluator's **1,789 entries** against `758351adcf1cc8ec0d91a9cb8ac0ccb5ac03504d`, and no `frontend/` or `mealie/` diff against source `4b9ca06b6581f7152e164ea0fd9d4da366975a79`. It checked **24 final manifest items**, matching pure/refined/published bytes for both generated TSX files and an empty explicit refinement operations array; all **eight reuse groups**, comprising **16 SHA256 comparisons**, matched. Six historical pure artifacts' outputs matched their own manifests, but earlier rounds lacked comprehensive tool/infrastructure snapshots and were not fully self-contained replay bundles. [Original preservation evidence, lines 145-156](Original_Report_ZH.md); [provenance verification, lines 25-35](Provenance_Notes_Historical.md).

The historical WSL checkpoint's **1,804** count covered ordinary files and omitted the tracked `CLAUDE.md -> AGENTS.md` symlink. Its archive contained the link, and the independent audit verified its nine-byte target using the Git blob/link representation. This corrected the scope of the historical assurance; it was **not observed source drift**. [Provenance finding, lines 9-15](Provenance_Notes_Historical.md).

The source-test inventory's **48 files and 817 direct `expect(...)` calls** were verified as an inventory. Only **two unchanged helper suites, ten cases**, were transferred and executed; the other **46** source test files were not migrated. Added auth checks used a different Router harness. The 36 target tests and 16 new probes did not replace the original **517 Vue tests, 66 routes, 15 flows or 82 Playwright checks**. Rule status remained **20 partial supported subsets/primitives and 15 unimplemented/blocking rules**, not 35 completed rules. [Original attribution and rule limits, lines 112 and 160-168](Original_Report_ZH.md); [provenance attribution, lines 33-35](Provenance_Notes_Historical.md).

Historical lint, MUI declaration, WSL Nuxt/icon dependency and missing-`python` failures remained recorded. The audit read those historical logs; its six new passing commands were for the independent Windows copy, not re-execution of the old failed versions or a new WSL result. [Historical failures, lines 39-41](Provenance_Notes_Historical.md).

Real browser appearance and desktop/mobile parity, actual download transport, complete session lifecycle, food-store tenant/public/private/factory equivalence, complete locale behavior, production basename, the full shell and whole-application frozen E2E remained unverified. Static suspicions about callback ordering and empty-slot fallback were not promoted to confirmed regressions without a Vue runtime comparison. [Original remaining limits, lines 172-176](Original_Report_ZH.md).

For reporting, the supported claim is: **the independent audit completed after R2 had stopped, confirmed that Gate 2 should remain unsuccessful, and identified additional harness, generation, behavior and review-record weaknesses.** It supplied no repair, no additional formal round, no original Gate 2 approval and no R3 result. Historical provisional token statements in the original audit are not finalized usage totals. Completed execution, independent audit and follow-up accounting are separated in [Accounting_EN.md](../accounting/Accounting_EN.md); no monetary fee is inferred.

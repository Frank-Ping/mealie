Public preparation note: this is a retrospective translation of the original prompts. Public projections modify private paths and metadata; original hashes and transformations are listed in [PUBLIC_MANIFEST.json](../PUBLIC_MANIFEST.json).

English presentation note: workflow labels and workspace paths in this presentation are normalized for the report. This is not a verbatim export; the linked original Chinese messages and visible-session records preserve the recorded wording.

# WF5 WF5 English prompt evidence

These are retrospective English translations prepared after the sessions on **14 October 2026**, Pacific/Auckland. The original workflow messages were written in Chinese and are retained in the private original evidence and published here with explicit path/metadata redactions. The translated text was not supplied to the agent during the experiment.

All source event timestamps below are UTC. JSONL rows are one-based; exported `ordinal` values are a different indexing field and are identified separately. The Phase A/B visible exports contain available visible records, rather than a complete unfiltered platform transcript. No hidden reasoning or system instructions are reproduced here.

## 1 Phase A rules design and experiment records

Original saved prompt: `<EVIDENCE>/phase-a/prompt-1.txt`.

Original visible export: `<EVIDENCE>/phase-a/visible-transcript-finalized.jsonl`, **row 1**, exported **ordinal 878**.

Source event: identified by the timestamp and source row recorded below.

Source event timestamp: **2026-10-13T09:39:59.423Z**.

The translation below follows the actual user-message text in the JSONL event. The saved original retains its original code-fence formatting; the English presentation uses a closed code block for readability.

```text
Prompt 1 Rules design and experiment records

Begin WF5 Phase A: rule design. Formal workflow usage recording starts
with this prompt.

Canonical source directory:
<WORKSPACE>/mealie-wf5
Evidence directory:
<WORKSPACE>/wf5-evidence

First read AGENTS.md in the canonical source directory, and SETUP.md,
BASELINE.md, environment.json and runtime-env.sh in the evidence directory.
Confirm that the current branch is rewrite/wf5-rule-driven and that the
starting commit is 4b9ca06b6581f7152e164ea0fd9d4da366975a79.

Target stack: Vite + React 19 + strict TypeScript + React Router SPA + MUI
+ react-i18next. Keep the original frontend/, mealie/, existing baseline
and fixed evaluation criteria unchanged. Use the Windows canonical source
directory as the only editing source; WSL temporary directories are
execution snapshots only.

In this phase, analyse the source and create documents. Do not begin
conversion. Create the following in rewrite-evidence/workflows/ inside
the canonical source directory:
- WF5-plan.md: workflow, infrastructure design, output-file ownership,
  verification methods, budget and stopping conditions.
- WF5-conversion-rules.md: rule catalogue.
- WF5-state.md: completed work, decisions, risks and next steps.

Each rule must include an ID, a real source path, before-and-after
Vue/React examples, applicability conditions, a Mechanical/Semi-mechanical/
Judgement classification, handling of unsupported cases, and verification
methods. Cover Vuetify, template directives, slots, routing/guards, i18n,
reactive state, shared stores, asynchronous lifecycle behaviour and CSS.
Do not automatically guess judgement-dependent rules. Navigation must
preserve real-link semantics.

Propose five representative samples: a page, a domain component, a common
component, a composable and a layout. Distinguish pure conversion output,
handwritten infrastructure and semantic refinement. Test and assertion
preservation cannot be demonstrated through counts alone.

Retain the original stopping condition: allow at most three sample-review
rounds. If more than 30% of the samples still require file-specific semantic
repairs, stop batch conversion and record the failure. Submit the time/token
budget to Gate 1 as an item awaiting confirmation.

Save this phase's prompt, available session records, time and raw usage in
workflow-sessions/ inside the evidence directory. If available, list earlier
WF5-specific prompt-template preparation costs separately; list shared
baseline preparation costs separately. Write "not provided" for tokens or
fees the tool does not report. State whether cached input is included in
input and whether usage is cumulative, to avoid double counting. Record
human review time separately. If a complete transcript cannot be exported,
mark it as pending.

Commit only documents relevant to this phase, using the commit
prefix, and update state. After submitting the rule summary, unresolved
questions and review materials, stop and wait for me to confirm Gate 1.
```

## 2 Gate 1 approval with the unfilled token placeholder

Original saved prompt: `<EVIDENCE>/phase-b/gate-1-prompt.txt`.

Original visible export: `<EVIDENCE>/phase-b/visible-transcript.jsonl`, **row 1**, exported **ordinal 1060**.

Source event: identified by the timestamp and source row recorded below.

Source event timestamp: **2026-10-13T10:06:11.148Z**.

The original approval still contained the literal placeholder `【填写数字，按 input + output 统计】`. It means “enter a number, counted as input + output”. It is preserved below because the unlimited policy was established by the subsequent clarification, not by this initial message.

```text
Gate 1 is approved. I agree with the decision list you have just submitted.
Follow the time budget in the plan. The total token limit is
【填写数字，按 input + output 统计】.
Record the confirmed decisions, begin Phase B, and stop at Gate 2 after
completing the specified implementation and sample checks. Wait for my review.
```

## 3 Token-budget clarification

Original saved record: `<EVIDENCE>/phase-b/token-policy-confirmation.txt`.

Original visible export: `<EVIDENCE>/phase-b/visible-transcript.jsonl`, **row 7**, exported **ordinal 1078**.

Source event: identified by the timestamp and source row recorded below.

Source event timestamp: **2026-10-13T10:06:38.887Z**.

The source is a structured question-reply record. Both the question and the user's answer are translated here; the original answer is `无上限，只需要记录使用量`.

```text
Assistant clarification:
What total token limit should be entered? Please provide an integer and
state whether it is a cumulative limit for the whole WF5 workflow,
including the completed Phase A, or an additional budget starting from
Phase B. The counting basis is input + output; cached input is already
included in input.

User answer:
No limit; only record the usage.
```

## 4 post-stop independent Gate 2 audit

This prompt initiated an independent audit after the WF5 implementation had stopped at Gate 2. It is separate from the formal Phase A/B experiment and did not authorise further implementation or an additional sample-review round.

Original extracted user text in this package: `Audit_Prompt_Original_ZH.txt`.

Extraction provenance: `Audit_Prompt_Source.json`.

Source event: identified by the timestamp and source row recorded below.

Source event timestamp: **2026-10-13T11:08:48.341Z**.

No separate visible export or `ordinal` field was found for this event. The raw JSONL row and timestamp identify the actual message. Only its user text and provenance metadata are included in this package.

```text
Please independently review WF5 Gate 2.

Source directory:
<WORKSPACE>/mealie-wf5

Evidence directory:
<WORKSPACE>/wf5-evidence

First read AGENTS.md, the Gate 2 submission, plan, decisions,
conversion-rules and state. Then check:

1. The original source, final results, blocking diagnostics and rule
   implementation status of the five fixed samples.
2. Whether pure, refined and frontend-react/src/generated at
   round-3/revision-4 agree, and whether infrastructure is recorded separately.
3. Run the rule tests, strict type checking, lint, unit tests and both builds
   in an independent temporary copy. Save the commands and exit codes.
4. Fault injection: missing required input/expected files, incorrect conversion,
   missing or duplicate refinement anchors, and failures in subsequent
   operations must fail correctly without leaving partial writes.
   Repeated generation must be consistent.
5. Check link semantics, event parameters, props/slots, hooks, asynchronous
   invalidation, store scope and i18n.
6. Distinguish new sample tests from migration of original tests.
   Passing sample tests does not prove that the complete Mealie application passes.
7. Verify that three rounds, 3/5 = 60%, and the stopping decision comply with
   the approved conditions. Check failure history and risk probes.
8. Report verified, still-blocked and unverified items separately, with file
   line numbers and evidence.

Keep the canonical source and existing records read-only. Do not repair
the implementation, add sample rounds or begin batch conversion.

Write the independent review result to:
rewrite-evidence/workflows/WF5-Gate-2-independent-review.md

Stop when complete. I will decide the next action.
```

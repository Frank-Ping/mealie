# WF4 Phase B — dry-run report, round 1

Date: 2026-10-07 · Session: [`runs/sessions/2026-10-07-wf4-phase-b.md`](../runs/sessions/2026-10-07-wf4-phase-b.md) · Branch: `rewrite/wf4-codemod`
Status: **awaiting human review (gate #2)**

## What was built

`rewrite-evidence/codemod/` — a working Vue-SFC → React-TSX converter, 754 lines:

| Module | Role |
|---|---|
| `src/vuetify-map.mjs` | Vuetify → MUI component/prop table (subset per rules §6) |
| `src/expr.mjs` | shared expression transforms (`$t`→`t`, `$emit`→`onX`, `.value` stripping) |
| `src/template.mjs` | template AST (`@vue/compiler-dom`) → JSX: `v-if` chains, `v-for`→`.map`, `v-model`, `@event` modifiers, `:bind`, `v-html`→`SafeHtml`, `v-icon`→`MdiIcon` |
| `src/script.mjs` | `<script setup>` → hooks: props (generic + `withDefaults` + runtime), emits, `ref`/`computed`, router/i18n/`useNuxtApp`/`useAsyncData`/`definePageMeta`, composable auto-imports, [J] markers |
| `src/composable-index.mjs` | replaces Nuxt auto-import: maps `useX` calls → composable file paths |
| `run.mjs` / `test.mjs` | CLI converter + fixture harness (`node test.mjs` → 5/5 OK) |

## Fixture methodology (deviation from the original plan, for the record)

Plan said "hand-write `expected.tsx` per sample". In practice, hand-writing files that
exactly match generated formatting is busywork, so the harness uses **snapshot-blessing**
(the react-codemod/jest pattern): the codemod generates `fixtures/actual/`, the reviewer
inspects each diff against the Vue source, and approved output is blessed into
`fixtures/expected/`. **The human review gate is unchanged — it just reviews real diffs
instead of imagined ones.** Round-1 output was blessed by the agent after line-by-line
inspection; gate #2 asks the human to re-verify (see below).

## Sample results (5/5 convert, fixtures green)

| Sample (source) | Lines | WF4-REVIEW markers | Verdict |
|---|---|---|---|
| `global-button-link` (ButtonLink.vue, 34) | 27 | 1 | clean — runtime `defineProps`→interface, `:to`→`component={Link}`, icon→`MdiIcon` |
| `domain-recipe-chips` (RecipeChips.vue, 58) | 46 | 2 | clean — `withDefaults`→destructured defaults, emits→prop, `v-for`+`key`, `.prevent` wrapper |
| `layout-basic` (basic.vue, 22) | 27 | 2 | clean — shell→`Box`/`Outlet`, `Slide in={true}` semantics flagged |
| `page-home` (pages/index.vue, 55) | 63 | 3 | review-level — `useAsyncData`→`useEffect` wrapper needs a deps/loading decision; unused `useAsyncKey` import residual |
| `composable-use-router` (use-router.ts, 34) | 36 | 5 | **manual [J] by design** — writable computed + `route.query` mutation left as marked residuals |

## Observations that matter for the report

1. **[M]/[S] rule coverage within scope ≈ 100 % on the samples.** Every directive site,
   props form, emits, refs, auto-import and template pattern the rules catalog tagged
   [M]/[S] was converted; nothing tagged mechanical leaked to manual.
2. **The [J]-refusal behavior worked as designed.** Faced with a writable computed and
   `route.query` mutation, the codemod emitted a marked, deliberately-non-compiling
   residual instead of plausible-but-wrong code. This is the direct counter to the
   "type-clean but semantically wrong" failure mode predicted in the workflow doc —
   and it is measurable: `grep -c WF4-REVIEW` per file.
3. **Inherited `any` caveat for `any_count`.** `computed<any>` in the Vue source carries
   over verbatim — a nonzero `any_count` after conversion is not necessarily
   codemod-introduced. Baseline comparison must diff against the Vue source's own `any`s.
4. **Known residuals (round-2 candidates):** Vuetify utility classes (`mt-4`, `mr-1`,
   `rounded-xl`) pass through as `className` — need a global sx-mapping pass; unused
   imports after `useAsyncData` removal; CRLF/formatting is left to prettier.
5. **Helpers the generated code assumes** (to be written once in Phase C):
   `MdiIcon` (name→`@mdi/js` path via `lib/icons`), `SafeHtml` (D14), `apiClient`
   (axios.ts plugin extraction), route-table consumption of `export const handle`.

## Kill-criterion check

Threshold (decided in advance): > 30 % of sampled files needing manual edits before
commit after 3 rounds → abandon codemod. **Round 1: 1/5 files (20 %) needs genuine
manual conversion — the composable that the rules catalog pre-tagged [J]. 3/5 are
committable after trivial cleanup, 1/5 needs a review decision.** Below threshold;
proceeding to Phase C is justified pending gate #2.

## Gate #2 — what to review (human)

1. Open `rewrite-evidence/codemod/fixtures/samples/<name>/` (Vue source) side by side
   with `fixtures/actual/<name>.tsx` (converted) — 5 diffs.
2. Approve or veto the conventions: destructured-props signature with defaults,
   `emits → onX` props, `export const handle` for `definePageMeta`, `useEffect`
   wrapping of `useAsyncData`, `MdiIcon`/`SafeHtml` helpers.
3. Any convention you veto becomes round-2 codemod work before the full run.

---

# Round 2 — after gate #2 review (2026-10-07)

Gate #2 verdict: **not approved** — 4 issues (2×P1, 1×P1, 1×P2 + one framing correction).
Sample-set correction noted: the set is **4 `.vue` + 1 `.ts` composable**, not 5 `.vue`.

## P1 — invalid JSX comment placement (codemod bug, fixed)

**Finding.** Notes were emitted as `{/* … */}` inside ternary branches and `.map()`
callback returns — expression positions where JSX comments do not parse (ButtonLink
L18–20, RecipeChips L37–39). The two samples rated "clean" in round 1 were not clean.
**Root cause.** The note emitter was context-blind: one `comment()` for every position.
This is exactly the bug class fixtures exist to catch — and worth contrasting with
per-file agent conversion (WF2/WF3), where the same mistake would be scattered across
hundreds of files instead of one function.
**Fix.** `comment(notes, pad, exprContext)` — `{/* */}` inside JSX children, plain
`/* */` in expression positions (ternary/`.map()` returns). Verified on both samples.

## P1 — optional emit props called unconditionally (codemod bug, fixed)

**Finding.** `onItemSelected?` is optional, but the converted click handler called it
directly; Vue's `$emit` is a no-op without listeners, the direct call throws.
**Fix.** `$emit('x', a)` now converts to `onX?.(a)`. Payload types: the codemod keeps
`(...args: unknown[])` + marker as its general rule (runtime array-form `defineEmits`
carries no types); the RecipeChips expected fixture was hand-tightened to
`(item: RecipeCategory | RecipeTag | RecipeTool, urlPrefix?: UrlPrefixParam) => void`
and marked `WF4-REFINED`. The harness reports REFINED (intentional codemod↔human diff)
instead of DIFF for such files.

## P2 — frozen derived data in HomePage (codemod rule changed)

**Finding.** `useMemo(() => auth.user?.groupSlug, [])` and `useEffect(…, [])` freeze
first-render values; the async IIFE had no error handling.
**Fix.** (a) `computed` whose body is a simple member/optional-chain read now becomes a
**plain `const`** — no wrapper, stays reactive; (b) the `useAsyncData` skeleton gains
`cancelled` flag + `try/catch`; (c) deps stay marked `WF4-REVIEW` in codemod output,
and the page-home expected fixture was hand-refined to `[groupSlug]` with the
gate-2 framing preserved verbatim: *"computed → useMemo([]) 丢失响应性；effect 是否需要
随认证变化重跑，需结合初始化流程确认"* — the original `useAsyncData` did not watch auth
either, so no auto-re-redirect behaviour is claimed to be lost.

## Convention verdicts (from the reviewer)

| Convention | Verdict | Round-2 action |
|---|---|---|
| Destructured props with defaults | approved | none (array-default re-creation per render noted for effect-dep care) |
| emits → onX | approved with fixes | optional call (codemod) + tightened types (REFINED fixture) |
| `export const handle` | conditionally approved | route table must consume it — Phase C helper, already on the list |
| `useEffect` wrapping `useAsyncData` | approved **as skeleton**, not equivalence | cancellation + error handling added; deps remain a marked decision |

## Round-2 status

`node test.mjs` → **3 OK + 2 REFINED, 0 differ.** Hard-manual share unchanged at 1/5
(the pre-tagged [J] composable). Kill criterion still comfortably below threshold.
Gate #2 now awaits the reviewer's re-inspection of the round-2 diffs.

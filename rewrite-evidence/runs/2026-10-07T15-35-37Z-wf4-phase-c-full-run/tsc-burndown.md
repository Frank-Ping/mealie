# WF4 Phase D — tsc burndown log

The defining measurement of the codemod workflow: one number per batch, one root
cause per drop. Syntax layer (TS1xxx, codemod defects) burned to **zero**, exposing
the semantic layer (TS2xxx, conversion residuals) that syntax errors were masking.

| # | tsc | Δ | batch root causes (all fixed in the codemod, outputs regenerated) |
|---|---|---|---|
| 0 | 1169 | — | Phase C initial: 1168 TS1xxx syntax + 1 type |
| 1 | 517 | −652 | balanced-call scanning for `ref`/`computed`/`withDefaults`/`useAsyncData` (regex truncated args at first inner `)`); staticProps brace encoding (`sx={ flexGrow: 1 }` = label, not object) |
| 2 | 291 | −226 | complex v-model comment emitted inside props list (invalid JSX); `$globals.icons` in templates; event-handler assignments |
| 3 | 284 | −7 | `<template>` wrapper handling; `?.value`→`??.` artifact |
| 4 | 274 | −10 | multi-line type-alias hoisting truncated at first `;` |
| 5 | 160 | −114 | multi-statement event handlers; `<component :is>`; `$d`/`$n`→`useFormatters`; runtime `defineProps` balanced scan; `style="k:v"` strings → objects |
| 6 | 115 | −45 | `.value`-assignment matching `==`/`=>`; computed trailing commas; digit-leading component names; generic `defineEmits<{...}>` with typed payloads; `emit()` bare calls |
| 7 | 88 | −27 | `defineModel` → value+onChange prop pairs; `v-model:arg` parents; runtime-props default parsing (`() => ({...})` factories); **`.value` generic strip removed — domain `.value` properties exist (QueryFilterBuilder)** |
| 8 | 43 | −45 | `const props/emit =` prefixes orphaned; angle-bracket generics vs `=>` arrows and nested `Record<>`; kebab model names; `update:modelValue` emit naming |
| 9 | 17 | −26 | `.value` assignments swallowing multi-line RHS (statement extraction); template-literal `${}` depth; kebab prop camelization |
| 10 | 11 | −6 | (same batch, verification cycle) |
| 11 | 5 | −6 | `&lt;` entities decoded by parser then emitted raw into JSX text; statement next-line continuation (ternary `?`/`:` at line start) |
| 12 | 0 syntax | −5 | single-line object type aliases hoisted wrong; destructured `defineProps`; statement-position guard for `.value` assignments |
| 13 | 5297 | +5297 | **crossover**: 0 TS1xxx left — type layer (TS2xxx) now fully visible. This is the real residual queue, not a regression |
| 14 | 4935 | −362 | v-for unparenthesized multi-param (`section, idx in sections`); Nuxt **component auto-import index** (TS2304 2081→1423) |

## Reading the curve

- 1169 → 0 (batches 1–12): every error was a **codemod defect**, fixed once in the
  tool, eliminated repo-wide on regeneration. No output file was hand-edited.
- 5297 → (batch 13+): the **semantic residual layer** — what the report's H2 is
  about. Current histogram (batch 14):

| code | count | meaning |
|---|---|---|
| TS2304 | 1423 | cannot find name: writable-computed residuals (intentional [J]), remaining auto-import gaps, composable-internal refs |
| TS2322 | 833 | type mismatch: Vuetify-only props on MUI components (`prepend-icon`, `density`, `rules`…) |
| TS2339 | 688 | property does not exist: `.value` reads left visible by design, store composable ports |
| TS2769 | 398 | no overload matches: MUI prop value types (color/variant strings) |
| TS7006 | 304 | implicit any params (untyped callback params carried over) |
| TS2551 | 261 | property did you mean: Vuetify→MUI prop name mismatches |
| TS2307 | 188 | cannot find module: unresolved composable/component paths |
| TS18047/18046 | 304 | strict-null violations (`.value` leftovers, store ports) |

Logs: `tsc-initial.log`, `tsc-after-batch{1..7}.log`, `tsc-syntax-final.log`,
`tsc-after-imports.log` in this run dir; earlier run dirs hold prior cycles.

## Continuation (same session, batches 15–16)

| # | tsc | Δ | batch root causes |
|---|---|---|---|
| 15 | 4823 | −112 | `onMounted`/`onUnmounted` → useEffect [M]; `useSeoMeta`/`useHead` → `useDocumentTitle` (D16); bare `defineProps<Props>()`; `$event` handler wrapping; slot-prop notes made self-documenting |
| 16 | 4823 | 0 | trailing comma in `onMounted` callback (last TS1109); duplicate judgement-marker loop (introduced while fixing the file, caught by fixture STRICT-DIFF — the harness guarded the tool) removed |

**Measurement law discovered:** one TS1xxx anywhere suppresses ALL semantic
diagnostics program-wide — tsc prints only the parse error. Every earlier
sub-crossover number (1169 → 274) was therefore a syntax-only count; the type
layer is measurable only at syntax-zero. Any burndown comparison must first
state whether the program parses.

## Type-layer baseline (syntax-zero, batch 16): 4823

| code | count | queue |
|---|---|---|
| TS2304 | 1279 | cannot find name: writable computeds [J], slot-prop bindings [J], composable-internal refs |
| TS2322 | 832 | Vuetify-only props on MUI components — **design decision pending (wrappers vs prune)** |
| TS2339 | 688 | `.value` reads left visible by design; store composable ports |
| TS2769 | 398 | MUI prop literal-type mismatches |
| TS7006 | 335 | implicit-any callback params (inherited) |
| TS2551 | 261 | prop name near-misses |
| TS2307 | 188 | unresolved module paths |
| TS18047/18046 | 304 | strict-null violations |

# WF4 — Conversion rules catalog v1

Status: **v1, pending human review (gate #1)**
Produced: 2026-10-07, session `runs/sessions/2026-10-07-wf4-phase-a.md`
Source: grep scans of `frontend/app` on `rewrite/phase0-baseline` (numbers below are measured, not estimated)
Target stack: Vite + React 19 + TypeScript strict + React Router (SPA) + MUI + react-i18next

Every rule is tagged:

- **[M] mechanical** — a codemod can apply it repo-wide without judgement
- **[S] semi-mechanical** — codemod does the rewrite, a human spot-checks the pattern once
- **[J] judgement** — agent converts case by case; codemod must NOT touch these

---

## 0. Inventory (the evidence basis)

| What | Measured | Note |
|---|---|---|
| `.vue` files | 229 (66 pages, 158 components, 5 layouts) | matches baseline |
| Distinct `<v-*>` components | **84** | full table in §6 |
| Vuetify version | 4.1.2 (via vuetify-nuxt-module) | |
| Nuxt / Vue | 4.4.6 / 3.5.35 | |
| Template directive sites | `v-if` 547, `v-for` 194, `v-else*` 150, `v-show` 6, `v-html` 17, `@click` 284 | |
| `v-model` sites | **495** | largest single semantic pattern |
| Reactivity API calls | `computed` 358, `ref` 337, `reactive` 73, `watch` 79, `watchEffect` 1, `nextTick` 36, `onMounted` 46, `onUnmounted` 8 | |
| Nuxt APIs | `useI18n` 112, `useRoute` 48, `definePageMeta` 47, `useNuxtApp` 44, `useSeoMeta` 40, `useRouter` 34, `useAsyncData` 20, `navigateTo` 14, `defineNuxtRouteMiddleware` 8, `useHead` 3, `useFetch` 1 | `useState`/`useFetch` barely used — no Nuxt shared-state |
| i18n | `$t(` 1019 sites in templates; 126 files under `app/lang/`; pipe plurals present; `{var}` interpolation | |
| Nuxt plugins | 8 files: `globals`, `axios`, `theme`, `dark-mode`, `app-info`, `init-auth`, `no-autofill`, PWA | §2 |
| Route middleware | 9 files | §3 |
| Composables | 124 files (`use-*.ts` + `api/`, `forms/`, `partials/`, `recipe-page/`, `recipes/`, `shopping-list-page/`, `store/`) | 49.4 % unit-covered |
| `lib/api` | 72 files, **zero Vue/Nuxt imports** | reuse verbatim |
| Auto-import reliance | 139 files use `ref`/`computed` without importing them (unplugin-auto-import) | |

## 1. Reuse-verbatim zone — do NOT convert

| Asset | Why |
|---|---|
| `app/lib/api/**` (72 files) + generated `types/` | framework-free TS; copy into `frontend-react/src/lib/api` unchanged |
| `app/lib/validators`, `lib/sanitize`, `lib/recipe`, `lib/icons`, `lib/utils` | framework-free (85–100 % covered) |
| `axios`, `marked`, `dompurify`, `fuse.js`, `date-fns`, `sse.js`, `ufo` | plain JS deps, keep |
| `@mdi/js` icon path data | MUI renders the same SVG paths via `SvgIcon` — **icon names never change** |
| `app/lang/messages/*.json` (all 126 locales) | copied unchanged except the plural rule D2 below; only `en-US` may ever be edited (AGENTS.md) |

## 2. App shell & Nuxt plugins → React providers (one-time, mostly [J])

| Nuxt piece | React equivalent | Tag |
|---|---|---|
| `app.vue` + `<v-app>`/`<v-main>` (5/4 sites) | SPA root: `CssBaseline` + `ThemeProvider` + `<Outlet/>`; not per-file | [J] once |
| `plugins/globals.ts` (`$globals.icons`, 34 uses) | it only re-exports `lib/icons` → **direct `import { icons }`** | [M] |
| `plugins/axios.ts` (`$axios`, 6 uses) | `src/lib/api/client.ts` module exporting the configured instance (interceptors are framework-free); the `runWithContext(() => useAuthBackend().refresh())` call becomes a call into the auth module | [S] — one judgement point: refresh flow outside React render |
| `plugins/theme.ts` | fetch `/api/app/about/theme` once → `createTheme` light/dark; Vuetify `variations` (lighten/darken 3) becomes MUI `augmentColor`-style tonal palette | [J] once |
| `plugins/dark-mode.client.ts` | `ColorModeContext` + `useMediaQuery('(prefers-color-scheme: dark)')` default | [J] once |
| `plugins/app-info.client.ts` (`$appInfo`, 4 uses) | `AppInfoContext` filled by one fetch | [S] |
| `plugins/init-auth.client.ts` | effect inside `AuthProvider` on mount | [J] once |
| `plugins/no-autofill.client.ts` | carry the DOM hack over as a root effect | [M] |
| `@vite-pwa/nuxt` | `vite-plugin-pwa`, same manifest | [S] |
| `@nuxt/fonts` | `@fontsource-variable/*` imports | [M] |
| `useRuntimeConfig` / `$config` (1 site) | `import.meta.env` | [M] |

Theme color usage note for §6: Vuetify color strings like `color="primary"` map to MUI `color="primary"` 1:1, but `*-lightenN`/`*-darkenN` variants and `variant="tonal"` have no MUI core equivalent → map to `sx` tonal tokens from the augmented palette **[S]**.

## 3. Routing: Nuxt pages → React Router route table

Decisions: **`createBrowserRouter` with a route table** (not `<Routes>`) so `definePageMeta` becomes data on route objects; layouts become layout routes with `<Outlet/>`; middleware becomes guard wrapper components.

| Vue/Nuxt | React Router | Tag |
|---|---|---|
| `pages/**/*.vue` (66) file-based routes | route objects `{ path, Component, handle: { layout, guards } }`, paths copied 1:1 incl. dynamic `[slug]` → `:slug` | [M] table generation, [J] page bodies |
| `definePageMeta({ layout, middleware })` (47) | `handle: { layout: 'admin', guards: [RequireAdmin] }` | [S] — collect actual key set in Phase B |
| `layouts/{default,admin,basic,blank,error}.vue` | 5 layout components with `<Outlet/>` | [J] 5 files |
| `middleware/*.ts` (9: auth, admin-only, advanced-only, can-manage-only, can-manage-household-only, can-organize-only, group-only, pwa-share-target-redirect.global) | guard components (`<RequireAuth>` etc.) reading auth context → `<Navigate to="/login?redirect=…">`; the one `.global` middleware becomes a root loader | [J] 9 files |
| `useRoute()` (48) | `useParams()` / `useSearchParams()` / `useLocation()` | [M] per-access-pattern |
| `useRouter()` (34) → `.push/.replace/.go` | `useNavigate()` | [M] |
| `navigateTo()` (14) | `navigate()` / `<Navigate>` | [M] |
| `<NuxtLink to>` | `<Link to>` / `<Button component={Link}>` | [M] |
| `route.query` reactive reads | `useSearchParams` (note: not reactive refs — rewire dependent `computed`) | [S] |

Baseline quirk to preserve: direct hard-load of `/admin/...` as non-admin renders the shell but every API 403s — the yardstick tests **offered links**, not direct access [from BASELINE.md]. Guards should redirect; do not "improve" this mid-rewrite.

## 4. i18n: vue-i18n → react-i18next

| Item | Rule | Tag |
|---|---|---|
| **D1 interpolation** | configure `i18next.init({ interpolation: { prefix: '{', suffix: '}' } })` → all 126 locale JSONs keep vue-i18n's single-brace `{var}` **unchanged** | decision, then [M] |
| **D2 pipe plurals** | vue-i18n `"a|b|c"` strings → i18next `key_zero`/`key_one`/`key_other` entries; scripted across **all** locales; locales whose plural rules need more categories fall back to `_other` (i18next default) | [S] — verify against the 5 known en-US keys + grep all locales |
| `$t('key')` in templates (1019) | `t('key')` from `useTranslation()` | [M] |
| `useI18n()` (112) → `const { t, d, n, locale }` | `useTranslation()`; `d()`/`n()` (dateTime/number formats) → small `useFormatters()` hook wrapping `date-fns`/`Intl` | [M] for `t`; [S] for `d`/`n` |
| `$tc` / pipe-plural call sites | `t(key, { count })` | [S] |
| `useSeoMeta` (40) / `useHead` (3) | **D16: title-only** — `useDocumentTitle()` hook setting `document.title` with the same template; meta tags dropped (SPA behind login, SEO irrelevant) | [M] |
| `locale` switching, `setLocale` | `i18n.changeLanguage()` + persist cookie as today | [S] |
| locales/index, dateTimeFormats | load as i18next resources; formats move into `useFormatters` | [J] once |

## 5. Reactivity: Composition API → hooks

| Vue | React | Tag | Sites |
|---|---|---|---|
| `ref(primitive)` + `.value` | `useState`; codemod rewrites `.value` reads → var, `.value =` → setter; template auto-unwrap → direct var | [M] | 337 |
| `computed(getter)` pure | `useMemo` (or plain expression when cheap) | [M] | most of 358 |
| `computed({ get, set })` writable | derive in event handler or `useState`+effect | [J] | grep in Phase B |
| `reactive(obj)` (73) | `useState(obj)` + immutable updates (or `useReducer`) | [J] | 73 |
| `watch(src, cb, opts)` (79) | `useEffect`; **immediate/deep/flush semantics differ — never auto-convert** | [J] | 79 |
| `watchEffect` (1) | `useEffect` | [J] | 1 |
| `onMounted` (46) / `onUnmounted` (8) | `useEffect(fn, [])` / cleanup | [M] | 54 |
| `nextTick` (36) | usually removable; else `queueMicrotask`/layout effect | [J] | 36 |
| `toRef` (1) | case by case | [J] | 1 |
| composables `use-*.ts` (124) | custom hooks `useX.ts`; same internal rules; **tests must keep their `expect(` count** (measure.sh guards) — `@vue/test-utils` → `@testing-library/react` `renderHook` | [J] with test anchor | 124 |
| `provide`/`inject` | React Context | [J] | grep in Phase B |

## 6. Vuetify → MUI component mapping (all 84, by measured usage)

General prop rules: `color` 1:1 (minus lighten/darken variants, §2); `density="compact"` → `size="small"`; `variant="outlined|text|elevated|tonal"` → MUI `variant` where it exists else `sx`; `class` → `className`/`sx`; `v-model` on inputs → `value`+`onChange` (§7).

| Uses | Vuetify | MUI | Tag | Notes |
|---:|---|---|---|---|
| 200 | v-icon | `SvgIcon` + `@mdi/js` path | [M] | `$globals.icons` map reused; `icon` prop on other components → `startIcon`/`endIcon` |
| 165 | v-card-text | `CardContent` | [M] | |
| 147 | v-btn | `Button` / `IconButton` (icon-only) | [M] | `:loading` → `disabled`+spinner **[S]** |
| 103 | v-col | `Grid` (v2 API `size={{xs,md}}`) | [M] | |
| 96 | v-card | `Card` | [M] | |
| 95 | v-divider | `Divider` | [M] | |
| 92 | v-container | `Container` | [M] | `fluid` → `maxWidth={false}` |
| 84 | v-text-field | `TextField` | [M] | rules/error-messages → `error`+`helperText` **[S]** |
| 78 | v-row | `Grid container` | [M] | |
| 77 | v-list-item | `ListItem`/`ListItemButton` | [M] | `@click` → `ListItemButton` |
| 76 | v-card-title | `CardHeader title` or `Typography` | [M] | pick one pattern in Phase B sample |
| 58 | v-checkbox | `Checkbox`+`FormControlLabel` | [M] | label slot → `label` prop |
| 52 | v-card-actions | `CardActions` | [M] | |
| 44 | v-list-item-title | `ListItemText primary` | [M] | |
| 34 | v-spacer | `Box sx={{flexGrow:1}}` | [M] | |
| 34 | v-list | `List` | [M] | |
| 33 | v-menu | `Menu` + anchor state | [J] | activator slot → `anchorEl` pattern |
| 32 | v-form | `<form onSubmit>` + `useForm` hook | [J] | Vuetify `ref.validate()` semantics — see D5 |
| 30 | v-img | `CardMedia`/`Box component="img"` + `loading="lazy"` | [M] | `cover` → `objectFit:'cover'` |
| 26 | v-select | `Select`+`MenuItem` (or `TextField select`) | [S] | `item-title/item-value` → render map; `items` API differs |
| 21 | v-autocomplete | `Autocomplete` | [S] | `items`/`item-title` → `options`/`getOptionLabel` |
| 20 | v-tooltip | `Tooltip` | [M] | plain text only; `activator` slot variants → [J] |
| 20 | v-list-item-subtitle | `ListItemText secondary` | [M] | |
| 20 | v-alert | `Alert` | [M] | `type` → `severity` |
| 19 | v-chip | `Chip` | [M] | |
| 16 | v-number-input | **no core equivalent** → custom `NumberField` (TextField type=number + steppers) | [J] | build once, reuse 16× |
| 15 | v-textarea | `TextField multiline` | [M] | |
| 14 | v-switch | `Switch`+`FormControlLabel` | [M] | |
| 11 | v-toolbar | `Toolbar` | [M] | |
| 11 | v-avatar | `Avatar` | [M] | |
| 10 | v-data-table | **D3: `@mui/x-data-grid` (community)** | [J] | headers/slots → `columns`/`renderCell`; check each of 10 |
| 8 | v-toolbar-title | `Typography variant="h6"` | [M] | |
| 8 | v-sheet | `Paper` | [M] | |
| 6 | v-virtual-scroll | `@tanstack/react-virtual` | [J] | |
| 6 | v-progress-linear | `LinearProgress` | [M] | |
| 6 | v-expansion-panels | `Accordion` | [M] | |
| 6 | v-expansion-panel(-title/-text) | `AccordionSummary`/`AccordionDetails` | [M] | |
| 6 | v-expand-transition | `Collapse` | [M] | |
| 6 | v-stepper(-item/-actions/-window*) (19 total) | `Stepper`/`Step`/`StepLabel` + custom panels | [J] | one wizard pattern, convert by hand once |
| 6 | v-card-subtitle | `CardHeader subheader`/`Typography` | [M] | |
| 5 | v-scroll-x-transition | `Slide` | [M] | |
| 5 | v-app | app shell, §2 | [J] once | |
| 4 | v-main | app shell, §2 | [J] once | |
| 4 | v-list-item-action | `ListItemSecondaryAction` | [M] | |
| 4 | v-lazy | `IntersectionObserver` hook | [J] | |
| 4 | v-date-picker | **D4: `@mui/x-date-pickers` DatePicker** | [S] | value format = ISO strings, verify |
| 4 | v-checkbox-btn | `Checkbox` (no label) | [M] | |
| 4 | v-btn-toggle | `ToggleButtonGroup` | [M] | |
| 4 | v-badge | `Badge` | [M] | |
| 3 | v-fade-transition | `Fade` | [M] | |
| 3 | v-dialog | `Dialog` | [M] | `v-model` → `open`+`onClose` |
| 2 | v-snackbar | `Snackbar` | [M] | toast system already central in `use-toast` |
| 2 | v-progress-circular | `CircularProgress` | [M] | |
| 2 | v-navigation-drawer | `Drawer` | [J] | app-shell level |
| 2 | v-list-group | `List` + `Collapse` | [S] | |
| 2 | v-hover | CSS `:hover` / state hook | [J] | |
| 2 | v-bottom-sheet | `SwipeableDrawer`/`Drawer anchor="bottom"` | [J] | |
| 1 | v-treeview | `@mui/x-tree-view` `SimpleTreeView` | [J] | |
| 1 | v-timeline(-item) | `@mui/lab/Timeline` or custom | [J] | |
| 1 | v-stepper-window/-header | part of stepper pattern | [J] | |
| 1 | v-slide-x-transition | `Slide` | [M] | |
| 1 | v-skeleton-loader | `Skeleton` | [M] | |
| 1 | v-responsive | `Box` + `aspectRatio` | [M] | |
| 1 | v-rating | `Rating` | [M] | |
| 1 | v-radio-group + v-radio | `RadioGroup`+`Radio` | [M] | |
| 1 | v-list-item-icon | `ListItemIcon` | [M] | |
| 1 | v-list-item-group / v-item-group | selection state by hand | [J] | |
| 1 | v-footer | layout-level `Box component="footer"` | [J] once | |
| 1 | v-file-input | custom upload `Button` + hidden input | [J] | |
| 1 | v-fab | `Fab` | [M] | |
| 1 | v-empty-state | custom `EmptyState` component | [J] once | |
| 1 | v-combobox | `Autocomplete freeSolo` | [S] | |
| 1 | v-color-picker | **D9: `react-colorful`** | [J] | |
| 1 | v-banner | custom/`Alert` full-width | [J] | |
| 1 | v-app-bar | `AppBar` | [J] once | |

**Tally: ~60 components [M], ~10 [S], ~24 [J]** — but [J] components are mostly 1–6-use cases; by **usage sites** the mechanical share is much higher (see §11).

## 7. Template directives → JSX

| Vue | JSX | Tag | Sites |
|---|---|---|---|
| `v-if` / `v-else-if` / `v-else` (547/44/106) | ternary / `&&` chains (keep else-if order) | [M] | 697 |
| `v-for="x in xs"` (194) | `xs.map(x => …)` + `key` (from `:key`) | [M] | 194 |
| `v-model` on Vuetify inputs (bulk of 495) | `value` + `onChange` per §6 component rule | [M] | ~most |
| `v-model` on custom components | two props (`value`, `onChange`) or renamed prop pair — inspect the child | [S] | remainder |
| `v-model:arg` (e.g. `v-model:dialog`) | paired props as above | [S] | grep in Phase B |
| `v-show` (6) | `sx={{ display: cond ? undefined : 'none' }}` | [M] | 6 |
| `v-html` (17) | **D14: `<SafeHtml>`** — `dangerouslySetInnerHTML` through existing `lib/sanitize` (DOMPurify); never raw | [M] with security note | 17 |
| `@event` / `@event.stop.prevent` (284 @click) | `onX` props; modifiers → explicit `e.stopPropagation()` etc. | [M] | |
| `:prop` bindings | JSX expressions; `:class` object/array syntax → `clsx` | [M] | |
| `v-slot` / scoped slots (2+slot-props) | `children` / render props | [S] | rare |
| template refs (`ref="el"`) | `useRef` | [M] | |
| `{{ expr }}` interpolation | `{expr}` | [M] | |

## 8. Vue-only third-party libs → substitutes

| Vue lib | React substitute | Tag |
|---|---|---|
| vue-draggable-plus | **D7: `@dnd-kit/core` + `@dnd-kit/sortable`** | [J] (shopping list, meal plan) |
| vue-advanced-cropper | **D8: `react-easy-crop`** | [J] (recipe image crop) |
| json-editor-vue | read-only `pre` + optional textarea editor | [J] (admin debug pages) |
| @vueuse/core & shared | hand-rolled hooks (`useLocalStorage`, `useMediaQuery`…) — inventory usages in Phase B | [J] |
| vuetify-nuxt-module, @nuxtjs/i18n, @nuxt/fonts, @vite-pwa/nuxt, unplugin-auto-import | **gone** — all imports explicit in React | n/a |

## 9. Data fetching

`useAsyncData`/`useFetch` (21 sites) are SSR-shaped; the React app is a pure SPA.
**D6: plain `useEffect` + `useState` hooks per domain** (no new data library — course stack is fixed).
The existing `lib/api` clients already return promises; wrap as `useRecipesQuery`-style hooks. **[J]** — but only 21 sites.
SSR-loading conventions (skeletons) are preserved per page, not dropped.

## 10. Judgement register (complete [J] list for planning)

1. `watch` 79 sites — effect semantics
2. `reactive` 73 sites — immutable state restructure
3. `nextTick` 36 sites
4. `v-form` validation 32 sites (D5)
5. `v-menu` 33 sites — anchor pattern
6. composable store (`composables/store/`) → Context providers
7. `useAsyncData` 21 sites (D6)
8. `v-data-table` 10 sites (D3)
9. layouts 5 + middleware 9 + app shell/providers (§2)
10. dnd, cropper, color-picker, json-editor (§8)
11. v-stepper wizard, v-virtual-scroll 6, v-lazy 4, v-hover 2, v-bottom-sheet 2, v-treeview, v-timeline
12. writable computed, `provide/inject`, `v-model:arg` — count in Phase B, expected small

## 11. Mechanical coverage estimate (for H1 scoring)

By usage **sites** (not distinct components): directives ~1230 [M] sites; v-model ≈ 495 (mostly [M]);
top-20 Vuetify components (≥11 uses each, all [M]/[S]) ≈ 1750 of ~2050 total component sites;
`$t` 1019 [M]; `ref`/pure `computed`/lifecycle ≈ 700 [M].
**Estimate: 70–80 % of conversion sites are [M] or [S]** — codemod target.
[J] volume is dominated by watch/reactive/v-form/menu ≈ 250–300 sites + 124 composable bodies.
This estimate is the null hypothesis H1 (≥ 60 %); Phase C measures the real rule-coverage.

## 12. Decisions awaiting human sign-off (gate #1)

| # | Decision | Recommendation |
|---|---|---|
| D1 | i18next `{ }` single-brace interpolation | accept — locales unchanged |
| D2 | pipe plurals → `_zero/_one/_other`, all locales scripted | accept |
| D3 | `v-data-table` → `@mui/x-data-grid` community | accept |
| D4 | `v-date-picker` → `@mui/x-date-pickers` | accept |
| D5 | forms → controlled + small `useForm`, no form lib | accept |
| D6 | data fetching → plain effect hooks, no React Query | accept (revisit if effects sprawl) |
| D7 | drag&drop → `@dnd-kit` | accept |
| D8 | cropper → `react-easy-crop` | accept |
| D9 | color picker → `react-colorful` | accept |
| D10 | keep `@mdi/js` + `SvgIcon` | accept — icons unchanged |
| D11 | MUI Grid v2 API | accept |
| D12 | `createBrowserRouter` route table + guard components | accept |
| D13 | global state → React Context, no store lib | accept |
| D14 | `v-html` → `<SafeHtml>` via existing sanitize lib | accept — security-sensitive |
| D15 | MUI v7 + matching `@mui/x-*` | accept |
| D16 | `useSeoMeta`/`useHead` → title-only | accept |

Reviewer: ______  Date: ______  (sign off in the commit that amends this file, or in the session log)

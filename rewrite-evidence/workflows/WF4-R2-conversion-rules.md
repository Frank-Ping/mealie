# WF4-R2 conversion rules — Gate 1 review draft

Phase A documents design only. No converter or React code has been executed. Source: `4b9ca06b6581f7152e164ea0fd9d4da366975a79`; branch `rewrite/wf4-codemod-rerun`.

Mechanical = exact syntax/data mapping under stated preconditions. Semi-mechanical = deterministic after a reviewed adapter/contract and verified preconditions. Judgement = unresolved semantics requiring a human-approved decision; automatic generation must stop at that node. A component can contain all three categories. Classification is not a promise that a whole file is convertible.

Before examples below are literal excerpts from the frozen source with one-based anchors. After examples are design sketches, sometimes partial or adapter-based, not tested or standalone implementations. Every target adapter is proposed infrastructure, not an existing completed file. An unsupported construct generates a source-span diagnostic and blocks publish; never substitute a TODO, fake data, empty handler or fabricated navigation.

## Rule catalogue

### R01 — SFC parsing and explicit imports

- Source: `frontend/app/components/Domain/Recipe/RecipeChips.vue:26`.
- Classification: **Mechanical**.
- Applies when: Use Vue SFC/compiler AST plus TypeScript AST; resolve every template component and Nuxt auto-import against a captured symbol table. Preserve source spans.

Vue/source before:
```vue
<script setup lang="ts">
import type { RecipeCategory, RecipeTag, RecipeTool } from "~/lib/api/types/recipe";
import { truncateText as truncatePlainText } from "~/lib/sanitize/text";
```

React/target contract after:
```tsx
import { Chip } from "@mui/material";
export function RecipeChips(props: RecipeChipsProps) { /* typed JSX */ }
```

- Unsupported handling: Ambiguous symbols, dynamic component names or unsupported AST nodes produce a blocking diagnostic; never regex-rewrite an entire SFC.
- Verification: Parse generated TSX; check unresolved symbols and deterministic output from identical input; source map spans identify every emitted node.

### R02 — Typed props and defaults

- Source: `frontend/app/components/Domain/Recipe/RecipeChips.vue:41`.
- Classification: **Semi-mechanical**.
- Applies when: Defaults must match actual declarations, including factory-created mutable values. Distinguish optional input from resolved internal props.

Vue/source before:
```vue
const props = withDefaults(defineProps<Props>(), {
  truncate: false,
  items: () => [],
```

React/target contract after:
```tsx
type Item = RecipeCategory | RecipeTag | RecipeTool;
function RecipeChips({ items = [], limit = 999, small = false }: RecipeChipsProps) { /* ... */ }
```

- Unsupported handling: Runtime validators, coercion or mutable default sharing require a reviewed contract. Do not widen to any.
- Verification: Absent/explicit/undefined values, independent instances and strict type checks; preserve every source prop in a prop manifest.

### R03 — Event payload contracts

- Source: `frontend/app/components/Domain/Recipe/RecipeChips.vue:51`.
- Classification: **Semi-mechanical**.
- Applies when: Derive argument order and optional listener behavior from all emit sites and callers, not the event name alone.

Vue/source before:
```vue
defineEmits(["item-selected"]);
function truncateText(text: string, length = 20, clamp = "...") {
  if (!props.truncate) return text;
```

React/target contract after:
```tsx
onItemSelected?: (item: Item, urlPrefix: string) => void;
onItemSelected?.(category, urlPrefix);
```

- Unsupported handling: Conflicting payloads or dynamically named events block emission until a typed contract is approved.
- Verification: Cross-file caller checks and behavior assertions for payload identity, order and exactly one invocation.

### R04 — Conditional rendering

- Source: `frontend/app/components/Domain/Recipe/RecipeChips.vue:2`.
- Classification: **Mechanical**.
- Applies when: Boolean conditions and v-if/else chains with no special transition/keep-alive lifetime. Boolean conversion prevents rendering numeric 0.

Vue/source before:
```vue
  <div v-if="items.length > 0">
    <h2
      v-if="title"
```

React/target contract after:
```tsx
{items.length > 0 ? <section>{/* children */}</section> : null}
```

- Unsupported handling: v-show or transition-dependent lifetime routes to separate rules; do not merge distinct branches.
- Verification: Render empty/nonempty, true/false and zero values; assert mounted child behavior and branch exclusivity.

### R05 — Lists and identity

- Source: `frontend/app/components/Domain/Recipe/RecipeChips.vue:10`.
- Classification: **Semi-mechanical**.
- Applies when: Preserve current domain key and ordering; verify key uniqueness in actual data assumptions.

Vue/source before:
```vue
      v-for="category in items.slice(0, limit)"
      :key="category.name"
      label
```

React/target contract after:
```tsx
{items.slice(0, limit).map(category => <Chip key={category.name} label={truncateText(category.name)} />)}
```

- Unsupported handling: Duplicate/absent keys or object iteration must be reported; do not invent array-index identity.
- Verification: Reorder/insert/delete tests retain component state with the correct item; validate source and target list membership.

### R06 — DOM event modifiers

- Source: `frontend/app/components/Domain/Recipe/RecipeChips.vue:19`.
- Classification: **Semi-mechanical**.
- Applies when: Only supported modifiers with explicit order and DOM event contract. .stop means stopPropagation; .self compares target/currentTarget.

Vue/source before:
```vue
      @click.prevent="() => $emit('item-selected', category, urlPrefix)"
    >
      {{ truncateText(category.name) }}
```

React/target contract after:
```tsx
onClick={event => { event.preventDefault(); onItemSelected?.(category, urlPrefix); }}
```

- Unsupported handling: Unknown modifiers and custom events without DOM events block conversion. Keyboard modifiers require an explicit key map.
- Verification: Prevented defaults, bubbling and child-click cases; RecipeCard .self must not fire for descendants.

### R07 — Vuetify leaf and presentation props

- Source: `frontend/app/components/Domain/Recipe/RecipeChips.vue:9`.
- Classification: **Semi-mechanical**.
- Applies when: Use per-prop mapping and approved theme palette. Source color="accent", label/flat/dark are not blindly passed to MUI.

Vue/source before:
```vue
    <v-chip
      v-for="category in items.slice(0, limit)"
      :key="category.name"
```

React/target contract after:
```tsx
<Chip label={truncateText(category.name)} size={small ? "small" : "medium"} sx={{ mr: 1, mt: 1 }} />
```

- Unsupported handling: Unmapped prop/class becomes a diagnostic; use the complete tag inventory below. Theme-dependent appearance requires an adapter or review.
- Verification: DOM semantics, accessible text and state tested; visual comparison on desktop/mobile. Record dropped/reinterpreted props explicitly.

### R08 — Button variants, attributes and slots

- Source: `frontend/app/components/global/BaseButton.vue:2`.
- Classification: **Semi-mechanical**.
- Applies when: Resolve variant/size/disabled/loading precedence from source; forward only supported props with correct override order. Approved adapter must define RouterLink and download behavior.

Vue/source before:
```vue
  <v-btn
    :color="color || btnAttrs.color"
    :size="small ? 'small' : 'default'"
```

React/target contract after:
```tsx
<Button component={to ? RouterLink : "button"} {...approvedButtonProps}>{iconSlot ?? defaultIcon}{children ?? text}</Button>
```

- Unsupported handling: Conflicting to/download/action semantics and unknown $attrs must be reviewed; never spread Vue-specific attributes onto the DOM.
- Verification: Click/download count, href/keyboard behavior, all variant precedence branches, named slot fallback and disabled/loading behavior.

### R09 — Real link navigation

- Source: `frontend/app/components/Domain/Recipe/RecipeCard.vue:13`.
- Classification: **Semi-mechanical**.
- Applies when: Render an actual href-bearing link for nonempty destinations; retain router basename/query/hash and nested controls. Nonempty routing cannot be replaced by onClick navigation.

Vue/source before:
```vue
        :to="recipeRoute"
        :min-height="imageHeight + 75"
        @click.self="$emit('click')"
```

React/target contract after:
```tsx
return recipeRoute ? <Card component={RouterLink} to={recipeRoute}>{content}</Card> : <Card>{content}</Card>;
```

- Unsupported handling: Empty destinations, nested anchors or competing actions require explicit structural review.
- Verification: Inspect actual anchor href; Enter/Ctrl-click/middle-click/new tab; descendant actions do not accidentally navigate; disabled state removes actionable link if source does.

### R10 — Hover scoped slot

- Source: `frontend/app/components/Domain/Recipe/RecipeCard.vue:2`.
- Classification: **Semi-mechanical**.
- Applies when: Approved handwritten HoverCard owns pointer/focus state, delayed-open timer and cleanup; render callback preserves scoped slot arguments.

Vue/source before:
```vue
  <!-- Wrap v-hover with a div to provide a proper DOM element for the transition -->
  <div>
    <v-hover
```

React/target contract after:
```tsx
<HoverCard openDelay={50} render={({ isHovering, bind }) => <Card {...bind} elevation={isHovering ? 12 : 2} />} />
```

- Unsupported handling: Unsupported slot properties or timer/keyboard differences require review. No hooks inside render callbacks.
- Verification: Delay threshold, pointer leave, unmount timer cancellation, keyboard focus and prop forwarding; adapter tested independently.

### R11 — Default and named slots

- Source: `frontend/app/components/global/BaseDialog.vue:3`.
- Classification: **Semi-mechanical**.
- Applies when: Inventory every declared slot and caller, scoped payload and fallback evaluation. Explicit named React props/render functions are typed.

Vue/source before:
```vue
    <slot
      name="activator"
      v-bind="{ open }"
```

React/target contract after:
```tsx
renderActivator?.({ open });
{children}
{cardActions ?? defaultCardActions}
```

- Unsupported handling: Dynamic slots or hooks inside callbacks are blocking; fallbacks must not be silently removed.
- Verification: All slot callers compile; verify present/absent slots, fallback text/actions, payload values and invocation behavior.

### R12 — Two-way component models

- Source: `frontend/app/components/global/BaseDialog.vue:63`.
- Classification: **Semi-mechanical**.
- Applies when: Determine model prop/update event from actual definition and every caller. Preserve source-controlled state and close notification ordering.

Vue/source before:
```vue
  modelValue: boolean;
  color?: string;
  title?: string;
```

React/target contract after:
```tsx
<BaseDialog open={isOpen} onOpenChange={setIsOpen} />
```

- Unsupported handling: Multiple models or get/set transformations need typed adapters; do not infer MUI callback arity from Vue emit names.
- Verification: Open/close from both parent and child, exactly-once events, keepOpen and loading transitions.

### R13 — Dialogs and responsive bottom sheets

- Source: `frontend/app/components/global/BaseDialog.vue:7`.
- Classification: **Judgement**.
- Applies when: Gate-approved dialog adapter must specify mobile presentation, focus trap/return, Escape, backdrop, Enter, fullscreen and pixel width mapping. MUI maxWidth enum is not a pixel width.

Vue/source before:
```vue
    <v-bottom-sheet
      v-if="bottomSheet && $vuetify.display.xs"
      v-model="dialog"
```

React/target contract after:
```tsx
<ResponsiveDialog open={open} onClose={handleClose} fullScreen={isXs} maxWidthPx={maxWidth}>{children}</ResponsiveDialog>
```

- Unsupported handling: Leave blocked with a decision record; never approximate bottom-sheet behavior solely by renaming a tag.
- Verification: Keyboard/scrim/submit/async failure/keepOpen scenarios; focus restoration and mobile viewport; source close/loading watchers mapped to explicit state transitions.

### R14 — Native text and password forms

- Source: `frontend/app/pages/login.vue:60`.
- Classification: **Semi-mechanical**.
- Applies when: Preserve labels, IDs, submit behavior, password toggle, autofill, disabled/loading and validation timing. Callback signatures change explicitly.

Vue/source before:
```vue
        <v-form @submit.prevent="authenticate">
          <v-text-field
            v-if="$appInfo.allowPasswordLogin"
```

React/target contract after:
```tsx
<form onSubmit={event => { event.preventDefault(); void authenticate(); }}><TextField id="email" value={email} onChange={event => setEmail(event.target.value)} /></form>
```

- Unsupported handling: Vuetify rules function protocol needs approved validation adapter; do not substitute browser validity without review.
- Verification: Frozen login flow plus label-role locators, invalid input, Enter submission and one request; password visibility and error announcements.

### R15 — Checkbox/select/autocomplete values

- Source: `frontend/app/pages/login.vue:89`.
- Classification: **Semi-mechanical**.
- Applies when: Boolean checkbox values only; selects/autocomplete require object-vs-ID, multiple, freeSolo, equality and label contracts from each source.

Vue/source before:
```vue
          <v-checkbox
            v-if="$appInfo.allowPasswordLogin"
            v-model="form.remember"
```

React/target contract after:
```tsx
<Checkbox checked={remember} onChange={(_, checked) => setRemember(checked)} />
```

- Unsupported handling: Return-object, custom item slots, async filtering or mixed values block generic mapping. Complete v-autocomplete/v-combobox inventory reviewed.
- Verification: False/true and absent defaults; object identity/equality, clear, keyboard selection, multiple values and preserved request payloads.

### R16 — Nested mutations and numeric input

- Source: `frontend/app/pages/shopping-lists/[id].vue:7`.
- Classification: **Judgement**.
- Applies when: Specify ownership and immutable update path before changing nested v-model assignments. Numeric parsing must preserve empty/null/NaN, step/min/max and source API types.

Vue/source before:
```vue
      v-model="state.checkAllDialog"
      bottom-sheet
      :title="$t('general.confirm')"
```

React/target contract after:
```tsx
setListItems(previous => previous.map(item => item.id === id ? { ...item, checked } : item));
```

- Unsupported handling: No guessed setter or blanket Number(value). Shared objects and optimistic persistence require explicit decisions.
- Verification: Check/uncheck/undo, empty and decimal quantities, boundary limits, payload types, rollback and independent consumer observations.

### R17 — Local refs

- Source: `frontend/app/pages/shopping-lists/[id].vue:424`.
- Classification: **Semi-mechanical**.
- Applies when: Component-local scalar with all reads/writes tracked; distinguish useRef imperative handles from useState render data.

Vue/source before:
```vue
const editingItem = ref<string | undefined>(undefined);
const shoppingListPage = useShoppingListPage(id);
const { store: allLabels } = useLabelStore();
```

React/target contract after:
```tsx
const [editingItem, setEditingItem] = useState<string | undefined>(undefined);
```

- Unsupported handling: Module-scope refs, alias mutation and reactive proxies route to store/ownership rules.
- Verification: Strict compile and state transitions; functional setters for updates based on previous state; no direct render mutation.

### R18 — Computed derived values

- Source: `frontend/app/components/Domain/Recipe/RecipeCard.vue:142`.
- Classification: **Semi-mechanical**.
- Applies when: Pure derivation with current dependencies; useMemo only when identity/performance contract requires it, not for correctness.

Vue/source before:
```vue
const groupSlug = computed(() => route.params.groupSlug || auth.user.value?.groupSlug || "");
const showRecipeContent = computed(() => props.recipeId && props.slug);
const recipeRoute = computed<string>(() => {
```

React/target contract after:
```tsx
const groupSlug = params.groupSlug || user?.groupSlug || "";
```

- Unsupported handling: Writable computed, side effects or conditional use* calls cannot be converted as memo callbacks.
- Verification: Route/user changes immediately update values; no stale captures or unnecessary independent state.

### R19 — Watchers and async effects

- Source: `frontend/app/pages/shopping-lists/[id].vue:497`.
- Classification: **Semi-mechanical**.
- Applies when: Capture immediate/deep/flush semantics and callback timing; only independent effect after lifecycle comparison. StrictMode reruns must remain safe.

Vue/source before:
```vue
watch(isSearching, (searching) => {
  checkedPanel.value = searching ? 0 : undefined;
});
```

React/target contract after:
```tsx
useEffect(() => { setCheckedPanel(isSearching ? 0 : undefined); }, [isSearching]);
```

- Unsupported handling: Feedback loops, deep mutation dependencies or pre-render timing require a state machine/refinement, not guessed dependency arrays.
- Verification: Initial state, repeated changes and teardown; exhaustive dependencies; StrictMode duplicate setup/cleanup does not duplicate persistence.

### R20 — Timers and stale callbacks

- Source: `frontend/app/pages/shopping-lists/[id].vue:431`.
- Classification: **Judgement**.
- Applies when: Specify route/item lifetime, toast ownership and whether delayed notification should survive navigation before implementing cleanup.

Vue/source before:
```vue
  setTimeout(() => {
    alert.info(
      i18n.t("shopping-list.item-checked-off", { item: item.food?.name || item.note || i18n.t("recipe.ingredient") }),
```

React/target contract after:
```tsx
const timer = window.setTimeout(showUndoToast, 500);
// Approved owner clears timer and binds undo to the original item safely.
```

- Unsupported handling: Do not silently remove or retain timers; decision logged with source behavior and desired equivalence.
- Verification: Navigate/unmount before 500ms; undo after list refresh; exactly one persistence action for original item; no stale-item update.

### R21 — Initial asynchronous redirect

- Source: `frontend/app/pages/index.vue:32`.
- Classification: **Judgement**.
- Applies when: Auth-ready boundary, admin setup, user/default/public group and failure branches explicitly reviewed. Target sketch is not a complete implementation.

Vue/source before:
```vue
useAsyncData(useAsyncKey(), async () => {
  if (groupSlug.value) {
    const data = await $axios.get<AppStartupInfo>("/api/app/about/startup-info");
```

React/target contract after:
```tsx
useEffect(() => { let active = true; void decideLanding(authSnapshot).then(path => { if (active) navigate(path); }); return () => { active = false; }; }, [authSnapshot, navigate]);
```

- Unsupported handling: Unawaited Vue helper and race behavior require a decision; never fabricate a destination or ignore errors.
- Verification: Slow auth/startup/about requests, authenticated/anonymous/admin, failure and unmount; one correct redirect with no protected-page flash.

### R22 — Route table and layout nesting

- Source: `frontend/app/layouts/default.vue:2`.
- Classification: **Semi-mechanical**.
- Applies when: Generate explicit manifest for all 66 page files including index, parameters, middleware, layout and query/hash behavior. Example path is schematic; actual routes come from inventory.

Vue/source before:
```vue
  <DefaultLayout />
</template>

```

React/target contract after:
```tsx
<Route element={<DefaultLayout />}><Route path="g/:groupSlug/..." element={<Page />} /></Route>
// DefaultLayout renders Outlet.
```

- Unsupported handling: Unmapped files, optional/catchall naming or metadata block table generation. Never claim route parity from route count alone.
- Verification: Compare exact frozen route set and parameters; direct URL/refresh/back/forward, blank/admin/default layouts and basename matrix.

### R23 — Authentication and permission guards

- Source: `frontend/app/middleware/auth.ts:5`.
- Classification: **Judgement**.
- Applies when: Specify auth-ready state and login redirect preservation; separate authenticated, admin and group-owner checks from server authorization.

Vue/source before:
```vue
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
```

React/target contract after:
```tsx
return !authReady ? <AuthPending /> : !loggedIn ? <Navigate to={loginWithRedirect(location)} replace /> : <Outlet />;
```

- Unsupported handling: No generic truthy-user guard; preserve full pathname/search/hash and safe redirect validator. Unauthorized/admin branches require decision review.
- Verification: Anonymous deep link, auth refresh, admin/nonadmin, group owner/member, logout; no protected render before ready; frozen guard and flows unchanged.

### R24 — Redirect safety and deployment base

- Source: `frontend/app/lib/validators/redirect.ts:3`.
- Classification: **Semi-mechanical**.
- Applies when: Reuse existing internal-path validator without loosening slash/backslash protection. Router and Vite base coordinated with serving environment.

Vue/source before:
```vue
  return !!target && target.startsWith("/") && !/^[/\\]{2}/.test(target);
}
```

React/target contract after:
```tsx
if (isSafeRedirect(redirect)) navigate(redirect);
// Preserve the existing validator; separately apply an approved basename policy.
```

- Unsupported handling: External/protocol-relative or malformed target rejected; unresolved subpath deployment is Gate 1 decision, not guessed.
- Verification: Retain validator assertions including //, backslash variants, query/hash; test root and approved subpath behavior and refresh fallback.

### R25 — Singleton shared food state

- Source: `frontend/app/composables/store/use-food-store.ts:6`.
- Classification: **Judgement**.
- Applies when: Preserve module-wide sharing, loading/initialized flags, public/private scope and clearAllStores reset. Approve store key/tenant lifetime before choosing adapter.

Vue/source before:
```vue
const store: Ref<IngredientFood[]> = ref([]);
const loading = ref(false);
const initialized = ref(false);
```

React/target contract after:
```tsx
const foods = useSyncExternalStore(foodStore.subscribe, foodStore.getSnapshot);
// foodStore is a reviewed singleton with stable snapshots and reset actions.
```

- Unsupported handling: Per-consumer useState is not equivalent. No data fetch while rendering; scope collisions or reset ambiguity remain blocked.
- Verification: Two consumers see same updates; logout/reset clears both; private/public and group switches cannot leak stale data; stable snapshots avoid render loops.

### R26 — Store factories and refresh side effects

- Source: `frontend/app/composables/partials/use-store-factory.ts:37`.
- Classification: **Judgement**.
- Applies when: Separate factory creation from network side effect; define initialized/error/retry/flush concurrency from actual factory source.

Vue/source before:
```vue
    actions.refresh();
  }

```

React/target contract after:
```tsx
useEffect(() => { void store.ensureLoaded(); }, [store]);
// ensureLoaded coalesces concurrent loads; factory construction is pure.
```

- Unsupported handling: Conditional React hooks and synchronous render fetch forbidden. Errors and dedup cannot be silently changed.
- Verification: Concurrent mounts make one load; retries, failure, flush during flight and reset; stale completion cannot repopulate a cleared tenant store.

### R27 — Conditional store selection in layout

- Source: `frontend/app/components/Layout/DefaultLayout.vue:115`.
- Classification: **Judgement**.
- Applies when: Existing Vue computed/store factory branching must become an unconditional hook with approved keyed selection, not hooks called inside useMemo.

Vue/source before:
```vue
const ownCookbookStore = computed(() => isOwnGroup.value ? useCookbookStore(i18n) : null);
const publicCookbookStoreCache = ref<Record<string, ReturnType<typeof usePublicCookbookStore>>>({});

```

React/target contract after:
```tsx
const cookbooks = useCookbooks({ groupSlug, isOwnGroup });
// One top-level hook delegates to a reviewed keyed external store.
```

- Unsupported handling: No automatic renaming of every use* function to React hook; public cache and group ownership need explicit semantics.
- Verification: Own/public group switches, authentication changes, cache invalidation and hook lint; no store from previous tenant appears.

### R28 — Auth initialization and cookie/session lifecycle

- Source: `frontend/app/plugins/init-auth.client.ts:8`.
- Classification: **Judgement**.
- Applies when: Reviewed auth service preserves refresh scheduling, request dedup, cookie removal attributes, session validation and logout resets; exact provider loading UI is explicit.

Vue/source before:
```vue
    auth.initTokenRefresh();
    await auth.getSession();
    console.debug("Auth plugin initialized");
```

React/target contract after:
```tsx
await authService.initialize();
createRoot(root).render(<AuthProvider service={authService}><App /></AuthProvider>);
```

- Unsupported handling: No replacement fake auth or localStorage guess; token claims alone never imply authenticated state.
- Verification: Existing auth/token-cookie/redirect tests mapped assertion by assertion; refresh flight, failed refresh, logout, server-set cookies and both OIDC/password flows.

### R29 — Injected transport and APIs

- Source: `frontend/app/plugins/axios.ts:52`.
- Classification: **Judgement**.
- Applies when: Reuse typed domain clients after dependency closure audit; transport adapter replaces Nuxt injection. Scan found 72 .ts API files and no other file extension, not the historical 90 claim.

Vue/source before:
```vue
    withCredentials: true,
  });

```

React/target contract after:
```tsx
const api = createUserApi(reviewedTransport);
// transport preserves credentials, current token, embedded header and refresh/error contracts.
```

- Unsupported handling: No copied generated type edits. Direct import absence alone does not prove framework independence; inspect transitive dependencies and auto-imports.
- Verification: API contract/type checks and interceptor tests: credentials/header, single retry exclusions, refresh dedup, normalized errors and logout redirect.

### R30 — Global i18n and component translation hook

- Source: `frontend/app/composables/use-global-i18n.ts:7`.
- Classification: **Semi-mechanical**.
- Applies when: Initialize react-i18next before rendering; preserve locale and fallback lifecycle and typed service consumers.

Vue/source before:
```vue
    i18n = useI18n();
  }
  return i18n;
```

React/target contract after:
```tsx
const { t, i18n } = useTranslation();
// Outside React use an injected initialized i18n/formatter service, never call a hook.
```

- Unsupported handling: Composer methods beyond t require explicit formatter adapter; no global useTranslation call.
- Verification: Locale switch affects mounted consumers, singleton consumers and dates/numbers; fallback/missing key behavior preserved.

### R31 — Interpolation, plurals and formatting

- Source: `frontend/app/lang/messages/en-US.json:161`.
- Classification: **Judgement**.
- Applies when: Vue single braces, positional {0}, pipe plurals and datetime/number options differ from i18next defaults. Inventory all locales/format constructs before approving compatibility adapter.

Vue/source before:
```vue
    "copied-items-to-clipboard": "No item copied to clipboard|One item copied to clipboard|Copied {count} items to clipboard",
    "actions": "Actions",
    "selected-count": "Selected: {count}",
```

React/target contract after:
```tsx
formatLegacyMessage("general.copied-items-to-clipboard", { count });
// Reviewed react-i18next integration resolves existing resources without editing locale files.
```

- Unsupported handling: Do not silently change non-English locales or use string replace on arbitrary messages. Unsupported linked/literal/plural cases block exact conversion.
- Verification: 0/1/2 counts, named/positional parameters, escaping, fallback and locale-specific plural/date/number tests; existing locale bytes unchanged.

### R32 — Layout shell and breakpoints

- Source: `frontend/app/components/Layout/DefaultLayout.vue:2`.
- Classification: **Judgement**.
- Applies when: Theme tokens and exact breakpoint thresholds come from current Vuetify configuration, not MUI defaults. Preserve sidebar initial/open behavior, menu and scroll regions.

Vue/source before:
```vue
  <v-app dark>
    <TheSnackbar />

```

React/target contract after:
```tsx
<ThemeProvider theme={theme}><CssBaseline /><AppShell><Outlet /></AppShell></ThemeProvider>
```

- Unsupported handling: Unresolved theme or SSR-only assumptions are documented; do not claim pixel parity from tag names.
- Verification: Mobile/desktop sidebar, resize and initial mount, dark mode, nav hrefs, content scroll and accessible focus; capture comparable screenshots.

### R33 — Scoped and Vuetify-internal CSS

- Source: `frontend/app/components/Domain/Recipe/RecipeCard.vue:150`.
- Classification: **Judgement**.
- Applies when: AST CSS scoping map and descendant/deep/global selectors enumerated. Unit, specificity and Vuetify utility semantics compared.

Vue/source before:
```vue
<style>
.v-card--reveal {
  align-items: center;
```

React/target contract after:
```tsx
/* Rewrite each internal Vuetify selector to an approved MUI slot or owned class; preserve global/scoped intent. */
.recipeCard { /* source-equivalent reviewed declarations */ }
```

- Unsupported handling: Do not copy .v-* selectors that no longer match, or drop :deep rules. Ambiguous cascade remains blocked.
- Verification: Style dependency inventory and screenshots across states/viewports; selector matches expected elements; CSS does not leak to unrelated components.

### R34 — Sanitized HTML and markdown

- Source: `frontend/app/components/global/SafeMarkdown.vue:8`.
- Classification: **Semi-mechanical**.
- Applies when: Reuse sanitizer and allowlist exactly; never feed raw markdown/rendered HTML directly to dangerouslySetInnerHTML.

Vue/source before:
```vue
import { sanitizeMarkdownHtml } from "~/lib/sanitize/markdown";

const props = defineProps({
```

React/target contract after:
```tsx
const safeHtml = sanitizeMarkdownHtml(rawHtml, allowedIframeHosts);
return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
```

- Unsupported handling: Unknown sanitization path or iframe policy blocks conversion; no broadened allowlist.
- Verification: Preserve sanitizer assertions for scripts/events/iframes/URLs; allowed content renders and dangerous content remains removed.

### R35 — Pure utility reuse and hook names

- Source: `frontend/app/composables/use-utils.ts:11`.
- Classification: **Mechanical**.
- Applies when: Copy truly framework-free typed functions byte-for-byte where possible; dependency closure must exclude Vue runtime and Nuxt auto-imports.

Vue/source before:
```vue
export const useAsyncKey = function () {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
```

React/target contract after:
```tsx
const requestKey = useAsyncKey();
// This existing pure UUID helper is not a React hook; document naming/exports explicitly.
```

- Unsupported handling: Mixed files split only through approved export/dependency map; replace Vuetify type imports with equivalent reviewed types, not any.
- Verification: Existing utility assertions retained; compare all exports/import callers; hook lint exceptions narrowly justified or rename with manifest.

## Complete literal Vuetify tag inventory

84 distinct tags across 201 files, from lexical source discovery. M/S/J here is the proposed adapter class (S = Semi-mechanical, J = Judgement), not a per-use semantic verdict. Full AST/prop/slot auditing occurs in Phase B. No mapping is approved merely because it appears here. Each row gives a real source example; occurrence counts are inventory evidence, not coverage evidence.

| Tag | Occurrences / files | Real source example | Proposed target | Class | Required contract |
| --- | ---: | --- | --- | --- | --- |

| `v-alert` | 20 / 16 | `frontend/app/components/Domain/Group/GroupAIProviderDialog.vue` | Alert / owned banner | S | severity/actions and dismissal |

| `v-app` | 5 / 5 | `frontend/app/components/Layout/DefaultLayout.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-app-bar` | 1 / 1 | `frontend/app/components/Layout/LayoutParts/AppHeader.vue` | AppBar / Toolbar / Typography | S | position, height, slots and responsive behavior |

| `v-autocomplete` | 21 / 10 | `frontend/app/components/Domain/Group/GroupAIProviderSettingsEditor.vue` | Select / Autocomplete + reviewed value adapter | J | return-object, multiple, free text, item slots, equality; R15 |

| `v-avatar` | 11 / 9 | `frontend/app/components/Domain/Admin/Setup/EndPageContent.vue` | Avatar / Badge / Chip / Divider / mapped icon / img | S | palette, icon registry, image sizing and alternatives |

| `v-badge` | 4 / 4 | `frontend/app/components/Domain/Recipe/RecipeTimeline.vue` | Avatar / Badge / Chip / Divider / mapped icon / img | S | palette, icon registry, image sizing and alternatives |

| `v-banner` | 1 / 1 | `frontend/app/layouts/blank.vue` | Alert / owned banner | S | severity/actions and dismissal |

| `v-bottom-sheet` | 2 / 2 | `frontend/app/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInstructions.vue` | ResponsiveDialog adapter | J | focus, mobile presentation, close state; R12/R13 |

| `v-btn` | 147 / 90 | `frontend/app/components/Domain/Announcement/AnnouncementDialog.vue` | Button / Fab / ToggleButtonGroup adapter | S | link hrefs, variants, disabled/loading and selection; R08/R09 |

| `v-btn-toggle` | 4 / 4 | `frontend/app/components/Domain/Household/GroupMealPlanEntryDialog.vue` | Button / Fab / ToggleButtonGroup adapter | S | link hrefs, variants, disabled/loading and selection; R08/R09 |

| `v-card` | 96 / 68 | `frontend/app/components/Domain/Admin/Setup/EndPageContent.vue` | Card / CardActions / CardContent / Typography | S | slots, heading hierarchy and routed-card semantics |

| `v-card-actions` | 52 / 40 | `frontend/app/components/Domain/Household/GroupWebhookEditor.vue` | Card / CardActions / CardContent / Typography | S | slots, heading hierarchy and routed-card semantics |

| `v-card-subtitle` | 6 / 4 | `frontend/app/components/Domain/Admin/Setup/EndPageContent.vue` | Card / CardActions / CardContent / Typography | S | slots, heading hierarchy and routed-card semantics |

| `v-card-text` | 165 / 94 | `frontend/app/components/Domain/Announcement/AnnouncementDialog.vue` | Card / CardActions / CardContent / Typography | S | slots, heading hierarchy and routed-card semantics |

| `v-card-title` | 76 / 49 | `frontend/app/components/Domain/Admin/Setup/EndPageContent.vue` | Card / CardActions / CardContent / Typography | S | slots, heading hierarchy and routed-card semantics |

| `v-checkbox` | 58 / 34 | `frontend/app/components/Domain/Group/GroupPreferencesEditor.vue` | Checkbox / Radio / RadioGroup / Switch | S | checked/value callback and group semantics; R15 |

| `v-checkbox-btn` | 4 / 2 | `frontend/app/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInstructions.vue` | Checkbox / Radio / RadioGroup / Switch | S | checked/value callback and group semantics; R15 |

| `v-chip` | 19 / 12 | `frontend/app/components/Domain/Announcement/AnnouncementDialog.vue` | Avatar / Badge / Chip / Divider / mapped icon / img | S | palette, icon registry, image sizing and alternatives |

| `v-col` | 103 / 30 | `frontend/app/components/Domain/Group/GroupAIProviderSettingsEditor.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-color-picker` | 1 / 1 | `frontend/app/components/global/InputColor.vue` | owned color-picker adapter | J | format, alpha, modes, accessibility; no core name substitution |

| `v-combobox` | 1 / 1 | `frontend/app/pages/user/profile/edit.vue` | Select / Autocomplete + reviewed value adapter | J | return-object, multiple, free text, item slots, equality; R15 |

| `v-container` | 92 / 57 | `frontend/app/components/Domain/Admin/Setup/EndPageContent.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-data-table` | 10 / 10 | `frontend/app/components/Domain/Group/GroupExportData.vue` | Core Table + reviewed data controller; optional MUI X decision | J | sorting, pagination, server mode, slots and selection; no tag-only replacement |

| `v-date-picker` | 4 / 4 | `frontend/app/components/Domain/Mealplan/MealPlanDatePicker.vue` | reviewed date adapter; optional MUI X decision | J | calendar, timezone/value type and localization; native date not presumed equivalent |

| `v-dialog` | 3 / 3 | `frontend/app/components/Domain/Recipe/RecipeDialogSearch.vue` | ResponsiveDialog adapter | J | focus, mobile presentation, close state; R12/R13 |

| `v-divider` | 95 / 57 | `frontend/app/components/Domain/Group/GroupAIProviderDialog.vue` | Avatar / Badge / Chip / Divider / mapped icon / img | S | palette, icon registry, image sizing and alternatives |

| `v-empty-state` | 1 / 1 | `frontend/app/components/Domain/Recipe/RecipePage/RecipePageParts/RecipeParseDialog/ParseDialogInfo.vue` | owned empty-state component | S | title/body/icon/actions slots and accessible messages |

| `v-expand-transition` | 6 / 6 | `frontend/app/components/Domain/Recipe/RecipeCard.vue` | Collapse / Fade / Slide + reviewed transition contract | J | mount/unmount, direction, timing and reduced motion |

| `v-expansion-panel` | 6 / 5 | `frontend/app/components/Domain/Group/GroupAIProviderDialog.vue` | Accordion / AccordionSummary / AccordionDetails + group adapter | S | model index/keys, multiple expansion and heading semantics |

| `v-expansion-panel-text` | 6 / 5 | `frontend/app/components/Domain/Group/GroupAIProviderDialog.vue` | Accordion / AccordionSummary / AccordionDetails + group adapter | S | model index/keys, multiple expansion and heading semantics |

| `v-expansion-panel-title` | 6 / 5 | `frontend/app/components/Domain/Group/GroupAIProviderDialog.vue` | Accordion / AccordionSummary / AccordionDetails + group adapter | S | model index/keys, multiple expansion and heading semantics |

| `v-expansion-panels` | 6 / 6 | `frontend/app/components/Domain/Group/GroupAIProviderDialog.vue` | Accordion / AccordionSummary / AccordionDetails + group adapter | S | model index/keys, multiple expansion and heading semantics |

| `v-fab` | 1 / 1 | `frontend/app/components/Domain/Recipe/RecipePage/RecipePage.vue` | Button / Fab / ToggleButtonGroup adapter | S | link hrefs, variants, disabled/loading and selection; R08/R09 |

| `v-fade-transition` | 3 / 3 | `frontend/app/components/Domain/Recipe/RecipeCardSection.vue` | Collapse / Fade / Slide + reviewed transition contract | J | mount/unmount, direction, timing and reduced motion |

| `v-file-input` | 1 / 1 | `frontend/app/pages/g/[groupSlug]/r/create/zip.vue` | owned input type=file adapter | S | accept/multiple, File payload, clear and errors |

| `v-footer` | 1 / 1 | `frontend/app/components/Layout/LayoutParts/AppFooter.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-form` | 32 / 29 | `frontend/app/components/Domain/Group/GroupAIProviderDialog.vue` | native form + reviewed validation adapter | J | rules protocol, validation timing, Enter and submission; R14 |

| `v-hover` | 2 / 2 | `frontend/app/components/Domain/Recipe/RecipeCard.vue` | HoverCard/render-prop adapter | S | delay, focus, event merging and cleanup; R10 |

| `v-icon` | 200 / 106 | `frontend/app/components/Domain/Announcement/AnnouncementDialog.vue` | Avatar / Badge / Chip / Divider / mapped icon / img | S | palette, icon registry, image sizing and alternatives |

| `v-img` | 30 / 28 | `frontend/app/components/Domain/Recipe/RecipeAssets.vue` | Avatar / Badge / Chip / Divider / mapped icon / img | S | palette, icon registry, image sizing and alternatives |

| `v-item-group` | 1 / 1 | `frontend/app/components/global/BaseButtonGroup.vue` | owned selection/disclosure group adapter | J | selection shape, keys, expansion and keyboard |

| `v-lazy` | 4 / 3 | `frontend/app/components/Domain/Recipe/RecipePage/RecipePageParts/RecipeParseDialog/ParseDialogReview.vue` | owned visibility adapter | J | mount lifetime, intersection options and cleanup |

| `v-list` | 34 / 28 | `frontend/app/components/Domain/Announcement/AnnouncementDialog.vue` | List / ListItem / ListItemButton / ListItemIcon / ListItemText | S | click versus true link, selected and nested content |

| `v-list-group` | 2 / 1 | `frontend/app/components/Layout/LayoutParts/AppSidebar.vue` | owned selection/disclosure group adapter | J | selection shape, keys, expansion and keyboard |

| `v-list-item` | 77 / 38 | `frontend/app/components/Domain/Announcement/AnnouncementDialog.vue` | List / ListItem / ListItemButton / ListItemIcon / ListItemText | S | click versus true link, selected and nested content |

| `v-list-item-action` | 4 / 2 | `frontend/app/components/Domain/SearchFilter.vue` | List / ListItem / ListItemButton / ListItemIcon / ListItemText | S | click versus true link, selected and nested content |

| `v-list-item-group` | 1 / 1 | `frontend/app/components/global/ImageCropper.vue` | owned selection/disclosure group adapter | J | selection shape, keys, expansion and keyboard |

| `v-list-item-icon` | 1 / 1 | `frontend/app/components/global/ImageCropper.vue` | List / ListItem / ListItemButton / ListItemIcon / ListItemText | S | click versus true link, selected and nested content |

| `v-list-item-subtitle` | 20 / 14 | `frontend/app/components/Domain/Announcement/AnnouncementDialog.vue` | List / ListItem / ListItemButton / ListItemIcon / ListItemText | S | click versus true link, selected and nested content |

| `v-list-item-title` | 44 / 30 | `frontend/app/components/Domain/Announcement/AnnouncementDialog.vue` | List / ListItem / ListItemButton / ListItemIcon / ListItemText | S | click versus true link, selected and nested content |

| `v-main` | 4 / 4 | `frontend/app/components/Layout/DefaultLayout.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-menu` | 33 / 32 | `frontend/app/components/Domain/Mealplan/MealPlanNoteMenu.vue` | Menu / Tooltip + activator adapter | J | anchor ownership, forwarded handlers/ref and accessibility |

| `v-navigation-drawer` | 2 / 2 | `frontend/app/components/Domain/ShoppingList/ShoppingListAddItemForm.vue` | Drawer adapter | J | persistent/temporary, breakpoints, focus and initial state |

| `v-number-input` | 16 / 11 | `frontend/app/components/Domain/Group/GroupAIProviderDialog.vue` | reviewed numeric field adapter (current MUI API pin pending) | J | empty/null, locale decimals, steps, precision; R16 |

| `v-progress-circular` | 2 / 2 | `frontend/app/components/Domain/Recipe/RecipeSelector.vue` | CircularProgress / LinearProgress / Skeleton | S | determinate values, aria and loading presentation |

| `v-progress-linear` | 6 / 6 | `frontend/app/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageInstructions.vue` | CircularProgress / LinearProgress / Skeleton | S | determinate values, aria and loading presentation |

| `v-radio` | 1 / 1 | `frontend/app/components/Domain/SearchFilter.vue` | Checkbox / Radio / RadioGroup / Switch | S | checked/value callback and group semantics; R15 |

| `v-radio-group` | 1 / 1 | `frontend/app/components/Domain/SearchFilter.vue` | Checkbox / Radio / RadioGroup / Switch | S | checked/value callback and group semantics; R15 |

| `v-rating` | 1 / 1 | `frontend/app/components/Domain/Recipe/RecipeRating.vue` | Rating | S | readOnly, precision, value events and labels |

| `v-responsive` | 1 / 1 | `frontend/app/components/Layout/LayoutParts/AppHeader.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-row` | 78 / 36 | `frontend/app/components/Domain/Group/GroupAIProviderSettingsEditor.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-scroll-x-transition` | 5 / 5 | `frontend/app/components/Layout/DefaultLayout.vue` | Collapse / Fade / Slide + reviewed transition contract | J | mount/unmount, direction, timing and reduced motion |

| `v-select` | 26 / 16 | `frontend/app/components/Domain/Household/GroupMealPlanEntryDialog.vue` | Select / Autocomplete + reviewed value adapter | J | return-object, multiple, free text, item slots, equality; R15 |

| `v-sheet` | 8 / 7 | `frontend/app/components/Domain/Cookbook/CookbookPage.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-skeleton-loader` | 1 / 1 | `frontend/app/components/Domain/Recipe/RecipePage/RecipePageParts/RecipePageIngredientEditor.vue` | CircularProgress / LinearProgress / Skeleton | S | determinate values, aria and loading presentation |

| `v-slide-x-transition` | 1 / 1 | `frontend/app/pages/user/profile/edit.vue` | Collapse / Fade / Slide + reviewed transition contract | J | mount/unmount, direction, timing and reduced motion |

| `v-snackbar` | 2 / 1 | `frontend/app/components/Layout/LayoutParts/TheSnackbar.vue` | Snackbar + notification queue adapter | J | action callbacks, timeout, queue and global store |

| `v-spacer` | 34 / 27 | `frontend/app/components/Domain/QueryFilterBuilder.vue` | Box / Container / Stack / CSS grid | S | theme, layout widths, flex/grid and breakpoints; R32/R33 |

| `v-stepper` | 1 / 1 | `frontend/app/pages/admin/setup.vue` | Stepper / Step / StepLabel + owned content/actions controller | J | active state, navigation, validation and content lifetime |

| `v-stepper-actions` | 6 / 1 | `frontend/app/pages/admin/setup.vue` | Stepper / Step / StepLabel + owned content/actions controller | J | active state, navigation, validation and content lifetime |

| `v-stepper-header` | 1 / 1 | `frontend/app/pages/admin/setup.vue` | Stepper / Step / StepLabel + owned content/actions controller | J | active state, navigation, validation and content lifetime |

| `v-stepper-item` | 6 / 1 | `frontend/app/pages/admin/setup.vue` | Stepper / Step / StepLabel + owned content/actions controller | J | active state, navigation, validation and content lifetime |

| `v-stepper-window` | 1 / 1 | `frontend/app/pages/admin/setup.vue` | Stepper / Step / StepLabel + owned content/actions controller | J | active state, navigation, validation and content lifetime |

| `v-stepper-window-item` | 6 / 1 | `frontend/app/pages/admin/setup.vue` | Stepper / Step / StepLabel + owned content/actions controller | J | active state, navigation, validation and content lifetime |

| `v-switch` | 14 / 9 | `frontend/app/components/Domain/Cookbook/CookbookEditor.vue` | Checkbox / Radio / RadioGroup / Switch | S | checked/value callback and group semantics; R15 |

| `v-text-field` | 84 / 52 | `frontend/app/components/Domain/Cookbook/CookbookEditor.vue` | TextField | S | labels, validation, password/adornments; R14 |

| `v-textarea` | 15 / 15 | `frontend/app/components/Domain/Cookbook/CookbookEditor.vue` | TextField | S | labels, validation, password/adornments; R14 |

| `v-timeline` | 1 / 1 | `frontend/app/components/Domain/Recipe/RecipeTimeline.vue` | owned accessible timeline; optional Lab dependency decision | J | layout, alignment, icons and ordered content |

| `v-timeline-item` | 1 / 1 | `frontend/app/components/Domain/Recipe/RecipeTimelineItem.vue` | owned accessible timeline; optional Lab dependency decision | J | layout, alignment, icons and ordered content |

| `v-toolbar` | 11 / 11 | `frontend/app/components/Domain/Recipe/RecipeActionMenu.vue` | AppBar / Toolbar / Typography | S | position, height, slots and responsive behavior |

| `v-toolbar-title` | 8 / 8 | `frontend/app/components/Domain/Cookbook/CookbookPage.vue` | AppBar / Toolbar / Typography | S | position, height, slots and responsive behavior |

| `v-tooltip` | 20 / 18 | `frontend/app/components/Domain/Group/GroupAIProviderSettingsEditor.vue` | Menu / Tooltip + activator adapter | J | anchor ownership, forwarded handlers/ref and accessibility |

| `v-treeview` | 1 / 1 | `frontend/app/pages/group/migrations.vue` | reviewed tree adapter; optional MUI X decision | J | node keys, expansion, selection and keyboard |

| `v-virtual-scroll` | 6 / 4 | `frontend/app/components/Domain/Group/GroupDataPage.vue` | reviewed virtualization adapter | J | item sizes, keys, scrolling, focus and rendered-window semantics |


## Fixture and rule acceptance contract

Every rule needs declared positive/negative fixtures before conversion. Unsupported examples must prove blocking diagnostics. Fixed fixture manifests declare required input, expected output and semantic checks; missing files fail, never skip. A snapshot is a structural observation, not a semantic pass. Compile, behavioral checks and manual review are distinct evidence columns. Output creation is transactional: validate all expected inputs and diagnostics before replacing a published artifact. A failed refinement cannot partially mutate the only generated tree.

Mandatory representative risk probes beyond the five full-file samples: RecipeCard link semantics; BaseDialog scoped activators/focus/loading-close; DefaultLayout conditional store selection; login form/guards/auth readiness; shopping-list nested mutation/timer/undo; SafeMarkdown sanitizer; existing auth/axios/cookie/redirect tests; single-brace/positional/pipe-plural i18n. These probes cannot dilute the fixed five-file stop-condition denominator.

## Primary API references consulted

- [React state](https://react.dev/reference/react/useState), [effect lifecycle](https://react.dev/reference/react/useEffect), [external stores](https://react.dev/reference/react/useSyncExternalStore), [hook rules](https://react.dev/reference/rules/rules-of-hooks).
- [MUI routing integration](https://mui.com/material-ui/integrations/routing/), [dialogs](https://mui.com/material-ui/react-dialog/), [Autocomplete API](https://mui.com/material-ui/api/autocomplete/).
- [React Router BrowserRouter](https://reactrouter.com/api/declarative-routers/BrowserRouter), [Link](https://reactrouter.com/api/components/Link).
- [react-i18next useTranslation](https://react.i18next.com/latest/usetranslation-hook), [TypeScript strict](https://www.typescriptlang.org/tsconfig/strict.html).

Accessed 2026-10-13. These living docs guide contracts; they do not pin dependencies. The reviewed target must use React 19 with compatible exact versions recorded in its own lockfile at Gate 1/Phase B.

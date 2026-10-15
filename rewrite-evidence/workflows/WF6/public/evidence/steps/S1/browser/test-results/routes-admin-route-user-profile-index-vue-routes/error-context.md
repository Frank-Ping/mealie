# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routes.spec.ts >> admin >> [route] user/profile/index.vue
- Location: tests/routes.spec.ts:37:9

# Error details

```
Error: visible text "Welcome, E2E Admin!"

expect(locator).toBeVisible() failed

Locator: getByText('Welcome, E2E Admin!').visible().first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - visible text "Welcome, E2E Admin!" getByText('Welcome, E2E Admin!').visible().first() with timeout 10000ms
  - waiting for getByText('Welcome, E2E Admin!').visible().first()

```

# Test source

```ts
  1  | /**
  2  |  * Tier 1: selected pages render real content without errors.
  3  |  * The test title starts with the page file so measure.sh can report route pass totals.
  4  |  */
  5  | import { expect, test } from "@playwright/test";
  6  | import { loadFixtures } from "../lib/fixtures";
  7  | import { expectFieldValue, monitorPage, normalizedPath } from "../lib/page-health";
  8  | import { CORE_ROUTES, EXTENDED_ROUTES, type RouteScope, ROUTES, ROUTE_SETS } from "../lib/routes";
  9  | 
  10 | type RouteCheckMode = "smoke" | "strict";
  11 | 
  12 | const routeScope = (process.env.E2E_ROUTE_SCOPE ?? "all") as RouteScope;
  13 | const selectedRoutes = ROUTE_SETS[routeScope];
  14 | const routeCheck = (process.env.E2E_ROUTE_CHECK ?? "strict") as RouteCheckMode;
  15 | 
  16 | if (!selectedRoutes) {
  17 |   throw new Error(`Unknown E2E_ROUTE_SCOPE "${routeScope}". Use all, core, or extended.`);
  18 | }
  19 | if (!["smoke", "strict"].includes(routeCheck)) {
  20 |   throw new Error(`Unknown E2E_ROUTE_CHECK "${routeCheck}". Use smoke or strict.`);
  21 | }
  22 | 
  23 | test("route table has unique entries", () => {
  24 |   expect(ROUTES.length).toBeGreaterThan(0);
  25 |   expect(new Set(ROUTES.map(r => r.file)).size).toBe(ROUTES.length);
  26 |   expect(CORE_ROUTES.length).toBeGreaterThan(0);
  27 |   expect(EXTENDED_ROUTES.length).toBeGreaterThan(0);
  28 |   expect(CORE_ROUTES.length + EXTENDED_ROUTES.length).toBe(ROUTES.length);
  29 | });
  30 | 
  31 | for (const route of selectedRoutes) {
  32 |   test.describe(route.anonymous ? "anonymous" : "admin", () => {
  33 |     if (route.anonymous) {
  34 |       test.use({ storageState: { cookies: [], origins: [] } });
  35 |     }
  36 | 
  37 |     test(`[route] ${route.file}`, async ({ page }) => {
  38 |       const f = loadFixtures();
  39 |       const health = monitorPage(page);
  40 | 
  41 |       await page.goto(route.path(f));
  42 | 
  43 |       if (routeCheck === "strict") {
  44 |         for (const text of route.texts(f)) {
> 45 |           await expect(page.getByText(text, { exact: false }).filter({ visible: true }).first(), `visible text "${text}"`).toBeVisible();
     |                                                                                                                            ^ Error: visible text "Welcome, E2E Admin!"
  46 |         }
  47 |         for (const value of route.values?.(f) ?? []) {
  48 |           await expectFieldValue(page, value);
  49 |         }
  50 |       }
  51 |       else {
  52 |         await expect(page.locator("body")).toBeVisible();
  53 |         await expect.poll(() => page.locator("body").innerText()).not.toBe("");
  54 |       }
  55 | 
  56 |       const expected = route.finalPath?.(f) ?? route.path(f);
  57 |       if (expected instanceof RegExp) {
  58 |         expect(normalizedPath(page)).toMatch(expected);
  59 |       }
  60 |       else {
  61 |         expect(normalizedPath(page)).toBe(expected);
  62 |       }
  63 | 
  64 |       await health.assertHealthy();
  65 |     });
  66 |   });
  67 | }
  68 | 
```
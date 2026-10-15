# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/auth.spec.ts >> auth >> [flow] log out ends the session
- Location: tests/flows/auth.spec.ts:27:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Logout' })

```

# Page snapshot

```yaml
- main [ref=f1e3]:
  - generic [ref=f1e5]:
    - alert [ref=f1e6]:
      - generic [ref=f1e10]: Read-only recipes. Editing and other features remain available through the Vue entry.
    - generic [ref=f1e11]:
      - paragraph [ref=f1e12]: Authenticated as E2E Admin
      - paragraph [ref=f1e13]: "Group: home"
    - generic [ref=f1e14]:
      - heading "Recipes" [level=1] [ref=f1e15]
      - generic [ref=f1e16]:
        - generic: Search...
        - generic [ref=f1e17]:
          - textbox "Search..." [ref=f1e18]
          - group [aria-hidden]:
            - generic: Search...
      - link "E2E Pancakes" [ref=f1e20] [cursor=pointer]:
        - /url: /g/home/r/e2e-pancakes
        - generic [ref=f1e21]:
          - heading "E2E Pancakes" [level=2] [ref=f1e22]
          - paragraph [ref=f1e23]: Fluffy pancakes used by the E2E yardstick.
      - link "E2E Garden Salad" [ref=f1e25] [cursor=pointer]:
        - /url: /g/home/r/e2e-garden-salad
        - heading "E2E Garden Salad" [level=2] [ref=f1e27]
    - link "Open Vue shopping lists" [ref=f1e28] [cursor=pointer]:
      - /url: /shopping-lists?disableRedirect=true
    - link "Use explicit Vue entry" [ref=f1e29] [cursor=pointer]:
      - /url: /g/home?wf6=vue
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { ADMIN, loadFixtures, MEMBER, NAMES } from "../../lib/fixtures";
  3  | import { loginViaUi, visibleText } from "../../lib/ui";
  4  | 
  5  | test.describe("auth", () => {
  6  |   test.use({ storageState: { cookies: [], origins: [] } });
  7  | 
  8  |   test("[flow] log in with valid credentials and land on the recipe list", async ({ page }) => {
  9  |     const f = loadFixtures();
  10 |     await loginViaUi(page, ADMIN.email, ADMIN.password);
  11 |     await expect(page).toHaveURL(new RegExp(`/g/${f.groupSlug}/?$`));
  12 |     await expect(visibleText(page, NAMES.recipe)).toBeVisible();
  13 |     await expect(visibleText(page, ADMIN.fullName)).toBeVisible();
  14 |   });
  15 | 
  16 |   test("[flow] a wrong password is rejected", async ({ page }) => {
  17 |     await page.goto("/login");
  18 |     await page.getByRole("textbox", { name: "Email or Username" }).fill(ADMIN.email);
  19 |     await page.getByRole("textbox", { name: "Password" }).fill("definitely-not-the-password");
  20 |     const answer = page.waitForResponse(r => r.url().includes("/api/auth/token"));
  21 |     await page.getByRole("button", { name: "Login" }).click();
  22 |     expect((await answer).status()).toBe(401);
  23 |     await expect(visibleText(page, /invalid|incorrect/i)).toBeVisible();
  24 |     await expect(page).toHaveURL(/\/login\/?$/);
  25 |   });
  26 | 
  27 |   test("[flow] log out ends the session", async ({ page }) => {
  28 |     const f = loadFixtures();
  29 |     await loginViaUi(page, ADMIN.email, ADMIN.password);
> 30 |     await page.getByRole("button", { name: "Logout" }).click();
     |                                                        ^ Error: locator.click: Test timeout of 45000ms exceeded.
  31 |     await expect(page).toHaveURL(/\/login\/?/);
  32 |     await page.goto(`/g/${f.groupSlug}/r/${f.recipeSlug}`);
  33 |     await expect(page).toHaveURL(/\/login\/?/);
  34 |   });
  35 | 
  36 |   // Admin pages are only reachable through admin navigation. (Note: in the Vue reference, a member who
  37 |   // types an /admin URL directly still gets the page shell with every admin API call answering 403;
  38 |   // the backend is the real guard, so the yardstick checks what the member is offered, not that.)
  39 |   test("[flow] a regular member is not offered admin pages", async ({ page }) => {
  40 |     const f = loadFixtures();
  41 |     await loginViaUi(page, MEMBER.email, MEMBER.password);
  42 |     await page.goto(`/g/${f.groupSlug}`);
  43 |     await expect(visibleText(page, MEMBER.fullName)).toBeVisible();
  44 |     await expect(visibleText(page, NAMES.recipe)).toBeVisible();
  45 |     await page.getByText("Settings", { exact: true }).filter({ visible: true }).first().click();
  46 |     await expect(page.locator('a[href^="/household"]').filter({ visible: true }).first()).toBeVisible();
  47 |     await expect(page.locator('a[href^="/admin"]').filter({ visible: true })).toHaveCount(0);
  48 |   });
  49 | 
  50 |   test("[flow] an admin is offered admin pages", async ({ page }) => {
  51 |     const f = loadFixtures();
  52 |     await loginViaUi(page, ADMIN.email, ADMIN.password);
  53 |     await page.goto(`/g/${f.groupSlug}`);
  54 |     await page.getByText("Settings", { exact: true }).filter({ visible: true }).first().click();
  55 |     await page.locator('a[href="/admin/site-settings"]').filter({ visible: true }).first().click();
  56 |     await expect(page.getByRole("heading", { name: "Site Settings" })).toBeVisible();
  57 |   });
  58 | });
  59 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/auth.spec.ts >> auth >> [flow] a regular member is not offered admin pages
- Location: tests/flows/auth.spec.ts:39:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E Member').visible().first()
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('E2E Member').visible().first() with timeout 10000ms
  - waiting for getByText('E2E Member').visible().first()
  - Test timeout of 45000ms exceeded.

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
  30 |     await page.getByRole("button", { name: "Logout" }).click();
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
> 43 |     await expect(visibleText(page, MEMBER.fullName)).toBeVisible();
     |                                                      ^ Error: expect(locator).toBeVisible() failed
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
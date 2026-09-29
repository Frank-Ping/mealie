import { expect, test } from "@playwright/test";
import { ADMIN, loadFixtures, MEMBER, NAMES } from "../../lib/fixtures";
import { loginViaUi, visibleText } from "../../lib/ui";

test.describe("auth", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("[flow] log in with valid credentials and land on the recipe list", async ({ page }) => {
    const f = loadFixtures();
    await loginViaUi(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(new RegExp(`/g/${f.groupSlug}/?$`));
    await expect(visibleText(page, NAMES.recipe)).toBeVisible();
    await expect(visibleText(page, ADMIN.fullName)).toBeVisible();
  });

  test("[flow] a wrong password is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "Email or Username" }).fill(ADMIN.email);
    await page.getByRole("textbox", { name: "Password" }).fill("definitely-not-the-password");
    const answer = page.waitForResponse(r => r.url().includes("/api/auth/token"));
    await page.getByRole("button", { name: "Login" }).click();
    expect((await answer).status()).toBe(401);
    await expect(visibleText(page, /invalid|incorrect/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login\/?$/);
  });

  test("[flow] log out ends the session", async ({ page }) => {
    const f = loadFixtures();
    await loginViaUi(page, ADMIN.email, ADMIN.password);
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/login\/?/);
    await page.goto(`/g/${f.groupSlug}/r/${f.recipeSlug}`);
    await expect(page).toHaveURL(/\/login\/?/);
  });

  // Admin pages are only reachable through admin navigation. (Note: in the Vue reference, a member who
  // types an /admin URL directly still gets the page shell with every admin API call answering 403;
  // the backend is the real guard, so the yardstick checks what the member is offered, not that.)
  test("[flow] a regular member is not offered admin pages", async ({ page }) => {
    const f = loadFixtures();
    await loginViaUi(page, MEMBER.email, MEMBER.password);
    await page.goto(`/g/${f.groupSlug}`);
    await expect(visibleText(page, MEMBER.fullName)).toBeVisible();
    await expect(visibleText(page, NAMES.recipe)).toBeVisible();
    await page.getByText("Settings", { exact: true }).filter({ visible: true }).first().click();
    await expect(page.locator('a[href^="/household"]').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('a[href^="/admin"]').filter({ visible: true })).toHaveCount(0);
  });

  test("[flow] an admin is offered admin pages", async ({ page }) => {
    const f = loadFixtures();
    await loginViaUi(page, ADMIN.email, ADMIN.password);
    await page.goto(`/g/${f.groupSlug}`);
    await page.getByText("Settings", { exact: true }).filter({ visible: true }).first().click();
    await page.locator('a[href="/admin/site-settings"]').filter({ visible: true }).first().click();
    await expect(page.getByRole("heading", { name: "Site Settings" })).toBeVisible();
  });
});

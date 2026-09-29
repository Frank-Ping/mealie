import { expect, test } from "@playwright/test";
import { selectOption, uniqueName } from "../../lib/ui";

test.describe("admin", () => {
  test("[flow] create a user and find them in user management", async ({ page }) => {
    const suffix = uniqueName("").trim();
    const email = `e2e-flow-${suffix}@example.com`;
    await page.goto("/admin/manage/users/create");
    await page.waitForLoadState("networkidle");

    await selectOption(page, "User Group", "Home");
    await selectOption(page, "User Household", "Family");

    await page.getByRole("textbox", { name: "User Name" }).fill(`e2eflow${suffix}`);
    await page.getByRole("textbox", { name: "Full Name" }).fill(`E2E Flow ${suffix}`);
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await page.getByRole("textbox", { name: "Password" }).fill("E2e-Flow-Pass-123");
    await page.getByRole("main").getByRole("button", { name: "Create", exact: true }).click();

    await expect(page).toHaveURL(/\/admin\/manage\/users\/?$/);
    await expect(page.getByRole("cell", { name: email })).toBeVisible();
  });
});

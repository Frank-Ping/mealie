import { expect, test } from "@playwright/test";
import { NAMES } from "../../lib/fixtures";
import { checkboxRowOf, openDialog, SUBMIT, uniqueName, visibleText } from "../../lib/ui";

test.describe("shopping lists", () => {
  test("[flow] create a shopping list", async ({ page }) => {
    const name = uniqueName("E2E Flow List");
    await page.goto("/shopping-lists");
    await expect(visibleText(page, NAMES.shoppingList)).toBeVisible();
    await page.getByRole("main").getByRole("button", { name: "Create", exact: true }).click();
    const dialog = openDialog(page);
    await dialog.getByRole("textbox", { name: "New List" }).fill(name);
    await dialog.getByRole("button", { name: SUBMIT }).click();
    await expect(page.getByRole("link", { name })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name })).toBeVisible();
  });

  test("[flow] add an item and check it off", async ({ page }) => {
    const item = uniqueName("E2E Hammer");
    await page.goto("/shopping-lists?disableRedirect=true");
    await page.getByRole("link", { name: NAMES.shoppingList2 }).click();
    await expect(page.getByRole("heading", { name: NAMES.shoppingList2 })).toBeVisible();

    await page.waitForLoadState("networkidle");
    await page.getByRole("combobox", { name: "Add item" }).click({ force: true });
    const note = page.getByRole("main").getByRole("textbox", { name: "Note" });
    await note.fill(item);
    const created = page.waitForResponse(r => r.url().includes("/api/households/shopping/items")
      && r.request().method() === "POST" && r.ok());
    await note.press("Enter");
    const row = checkboxRowOf(page, item);
    await expect(row).toBeVisible();
    await created;

    // Checking is saved in the background; wait for the backend to accept it before reloading.
    const saved = page.waitForResponse(r => r.url().includes("/api/households/shopping/items")
      && ["PUT", "PATCH"].includes(r.request().method()) && r.ok());
    await row.getByRole("checkbox").first().check();
    await expect(visibleText(page, "One item checked")).toBeVisible();
    await saved;

    await page.reload();
    await expect(visibleText(page, "One item checked")).toBeVisible();
  });
});

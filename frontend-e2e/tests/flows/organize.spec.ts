import { expect, test } from "@playwright/test";
import { openDialog, SUBMIT, uniqueName } from "../../lib/ui";

test.describe("organizing", () => {
  test("[flow] create a tag in data management", async ({ page }) => {
    const name = uniqueName("E2E Flow Tag");
    await page.goto("/group/data/tags");
    await page.getByRole("main").getByRole("button", { name: "Create", exact: true }).click();
    const dialog = openDialog(page);
    await dialog.getByRole("textbox", { name: "Name" }).fill(name);
    await dialog.getByRole("button", { name: SUBMIT }).click();
    await expect(page.getByRole("cell", { name })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("cell", { name })).toBeVisible();
  });
});

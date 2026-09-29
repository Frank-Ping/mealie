import { expect, test } from "@playwright/test";
import { loadFixtures } from "../../lib/fixtures";
import { clickButton, openDialog, SUBMIT, uniqueName, visibleText } from "../../lib/ui";

function dayLabel(isoDate: string, offsetDays: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

test.describe("meal plan", () => {
  test("[flow] add a note to tomorrow's meal plan", async ({ page }) => {
    const f = loadFixtures();
    const title = uniqueName("E2E Flow Picnic");
    const tomorrow = dayLabel(f.mealplanDate, 1);

    await page.goto("/household/mealplan/planner/edit");
    const day = visibleText(page, tomorrow, true).locator("xpath=ancestor::*[.//button][1]");
    await clickButton(page, day, "New");

    const dialog = openDialog(page);
    await expect(dialog.getByText("Create a New Meal Plan")).toBeVisible();
    await dialog.getByRole("button", { name: "Note", exact: true }).click();
    await dialog.getByRole("textbox", { name: "Meal Title" }).fill(title);
    await dialog.getByRole("button", { name: SUBMIT }).click();
    await expect(visibleText(page, title)).toBeVisible();

    await page.goto("/household/mealplan/planner/view");
    await expect(visibleText(page, title)).toBeVisible();
  });
});

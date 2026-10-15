# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/mealplan.spec.ts >> meal plan >> [flow] add a note to tomorrow's meal plan
- Location: tests/flows/mealplan.spec.ts:12:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: page.goto: Test timeout of 45000ms exceeded.
Call log:
  - navigating to "http://localhost:9006/household/mealplan/planner/view", waiting until "load"

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { loadFixtures } from "../../lib/fixtures";
  3  | import { clickButton, openDialog, SUBMIT, uniqueName, visibleText } from "../../lib/ui";
  4  | 
  5  | function dayLabel(isoDate: string, offsetDays: number): string {
  6  |   const d = new Date(`${isoDate}T00:00:00Z`);
  7  |   d.setUTCDate(d.getUTCDate() + offsetDays);
  8  |   return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  9  | }
  10 | 
  11 | test.describe("meal plan", () => {
  12 |   test("[flow] add a note to tomorrow's meal plan", async ({ page }) => {
  13 |     const f = loadFixtures();
  14 |     const title = uniqueName("E2E Flow Picnic");
  15 |     const tomorrow = dayLabel(f.mealplanDate, 1);
  16 | 
  17 |     await page.goto("/household/mealplan/planner/edit");
  18 |     const day = visibleText(page, tomorrow, true).locator("xpath=ancestor::*[.//button][1]");
  19 |     await clickButton(page, day, "New");
  20 | 
  21 |     const dialog = openDialog(page);
  22 |     await expect(dialog.getByText("Create a New Meal Plan")).toBeVisible();
  23 |     await dialog.getByRole("button", { name: "Note", exact: true }).click();
  24 |     await dialog.getByRole("textbox", { name: "Meal Title" }).fill(title);
  25 |     await dialog.getByRole("button", { name: SUBMIT }).click();
  26 |     await expect(visibleText(page, title)).toBeVisible();
  27 | 
> 28 |     await page.goto("/household/mealplan/planner/view");
     |                ^ Error: page.goto: Test timeout of 45000ms exceeded.
  29 |     await expect(visibleText(page, title)).toBeVisible();
  30 |   });
  31 | });
  32 | 
```
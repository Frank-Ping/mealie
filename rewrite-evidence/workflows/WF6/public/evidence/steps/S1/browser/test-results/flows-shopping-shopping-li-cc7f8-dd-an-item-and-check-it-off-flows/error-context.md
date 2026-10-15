# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/shopping.spec.ts >> shopping lists >> [flow] add an item and check it off
- Location: tests/flows/shopping.spec.ts:19:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('One item checked').visible().first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('One item checked').visible().first() with timeout 10000ms
  - waiting for getByText('One item checked').visible().first()

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { NAMES } from "../../lib/fixtures";
  3  | import { checkboxRowOf, openDialog, SUBMIT, uniqueName, visibleText } from "../../lib/ui";
  4  | 
  5  | test.describe("shopping lists", () => {
  6  |   test("[flow] create a shopping list", async ({ page }) => {
  7  |     const name = uniqueName("E2E Flow List");
  8  |     await page.goto("/shopping-lists");
  9  |     await expect(visibleText(page, NAMES.shoppingList)).toBeVisible();
  10 |     await page.getByRole("main").getByRole("button", { name: "Create", exact: true }).click();
  11 |     const dialog = openDialog(page);
  12 |     await dialog.getByRole("textbox", { name: "New List" }).fill(name);
  13 |     await dialog.getByRole("button", { name: SUBMIT }).click();
  14 |     await expect(page.getByRole("link", { name })).toBeVisible();
  15 |     await page.reload();
  16 |     await expect(page.getByRole("link", { name })).toBeVisible();
  17 |   });
  18 | 
  19 |   test("[flow] add an item and check it off", async ({ page }) => {
  20 |     test.setTimeout(90_000);
  21 |     const item = uniqueName("E2E Hammer");
  22 |     // A list of its own, so "One item checked" holds however often the flow runs on one database.
  23 |     const listName = uniqueName("E2E Flow Checklist");
  24 |     await page.goto("/shopping-lists?disableRedirect=true");
  25 |     await page.getByRole("main").getByRole("button", { name: "Create", exact: true }).click();
  26 |     const dialog = openDialog(page);
  27 |     await dialog.getByRole("textbox", { name: "New List" }).fill(listName);
  28 |     await dialog.getByRole("button", { name: SUBMIT }).click();
  29 |     await page.getByRole("link", { name: listName }).click();
  30 |     await expect(page.getByRole("heading", { name: listName })).toBeVisible();
  31 | 
  32 |     await page.waitForLoadState("networkidle");
  33 |     const created = page.waitForResponse(r => r.url().includes("/api/households/shopping/items")
  34 |       && r.request().method() === "POST" && r.ok());
  35 |     // The Vue reference polls the list every 5 s and queues new items locally before sending them;
  36 |     // now and then a poll lands mid-add and the typed item is lost. A user would simply add it
  37 |     // again, so the flow does the same (bounded), instead of failing on the reference app.
  38 |     await expect(async () => {
  39 |       const note = page.getByRole("main").getByRole("textbox", { name: "Note" });
  40 |       if (!(await note.isVisible())) {
  41 |         await page.getByRole("combobox", { name: "Add item" }).click({ force: true });
  42 |       }
  43 |       await note.fill(item);
  44 |       await expect(note).toHaveValue(item);
  45 |       await note.press("Enter");
  46 |       await expect(checkboxRowOf(page, item)).toBeVisible({ timeout: 7_000 });
  47 |     }).toPass({ timeout: 30_000 });
  48 |     await created;
  49 |     const row = checkboxRowOf(page, item);
  50 | 
  51 |     // Checking is saved in the background; wait for the backend to accept it before reloading.
  52 |     const saved = page.waitForResponse(r => r.url().includes("/api/households/shopping/items")
  53 |       && ["PUT", "PATCH"].includes(r.request().method()) && r.ok());
  54 |     await row.getByRole("checkbox").first().check();
  55 |     await expect(visibleText(page, "One item checked")).toBeVisible();
  56 |     await saved;
  57 | 
  58 |     await page.reload();
> 59 |     await expect(visibleText(page, "One item checked")).toBeVisible();
     |                                                         ^ Error: expect(locator).toBeVisible() failed
  60 |   });
  61 | });
  62 | 
```
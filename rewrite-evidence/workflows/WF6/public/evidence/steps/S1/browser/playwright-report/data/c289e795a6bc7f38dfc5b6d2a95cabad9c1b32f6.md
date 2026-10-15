# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/organize.spec.ts >> organizing >> [flow] create a tag in data management
- Location: tests/flows/organize.spec.ts:5:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: page.reload: Test timeout of 45000ms exceeded.
Call log:
  - waiting for navigation until "load"
    - navigated to "http://localhost:9006/group/data/tags/"

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { openDialog, SUBMIT, uniqueName } from "../../lib/ui";
  3  | 
  4  | test.describe("organizing", () => {
  5  |   test("[flow] create a tag in data management", async ({ page }) => {
  6  |     const name = uniqueName("E2E Flow Tag");
  7  |     await page.goto("/group/data/tags");
  8  |     await page.getByRole("main").getByRole("button", { name: "Create", exact: true }).click();
  9  |     const dialog = openDialog(page);
  10 |     await dialog.getByRole("textbox", { name: "Name" }).fill(name);
  11 |     await dialog.getByRole("button", { name: SUBMIT }).click();
  12 |     await expect(page.getByRole("cell", { name })).toBeVisible();
> 13 |     await page.reload();
     |                ^ Error: page.reload: Test timeout of 45000ms exceeded.
  14 |     await expect(page.getByRole("cell", { name })).toBeVisible();
  15 |   });
  16 | });
  17 | 
```
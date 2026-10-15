# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flows/profile.spec.ts >> profile >> [flow] a member updates their full name
- Location: tests/flows/profile.spec.ts:8:7

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: expect(locator).not.toHaveValue(expected) failed

Locator: getByRole('textbox', { name: 'Full Name' })
Expected: not ""
Error: element(s) not found

Call log:
  - Expect "not toHaveValue" getByRole('textbox', { name: 'Full Name' }) with timeout 10000ms
  - waiting for getByRole('textbox', { name: 'Full Name' })
  - Test timeout of 45000ms exceeded.

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { PROFILE_USER } from "../../lib/fixtures";
  3  | import { loginViaUi, uniqueName } from "../../lib/ui";
  4  | 
  5  | test.describe("profile", () => {
  6  |   test.use({ storageState: { cookies: [], origins: [] } });
  7  | 
  8  |   test("[flow] a member updates their full name", async ({ page }) => {
  9  |     const newName = uniqueName("E2E Renamed Member");
  10 |     await loginViaUi(page, PROFILE_USER.email, PROFILE_USER.password);
  11 |     await page.goto("/user/profile/edit");
  12 |     const fullName = page.getByRole("textbox", { name: "Full Name" });
> 13 |     await expect(fullName).not.toHaveValue("");
     |                                ^ Error: expect(locator).not.toHaveValue(expected) failed
  14 |     await fullName.fill(newName);
  15 |     await page.getByRole("button", { name: "Update" }).click();
  16 | 
  17 |     await page.reload();
  18 |     await expect(page.getByRole("textbox", { name: "Full Name" })).toHaveValue(newName);
  19 |   });
  20 | });
  21 | 
```
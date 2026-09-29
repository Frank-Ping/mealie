import { expect, test } from "@playwright/test";
import { PROFILE_USER } from "../../lib/fixtures";
import { loginViaUi, uniqueName } from "../../lib/ui";

test.describe("profile", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("[flow] a member updates their full name", async ({ page }) => {
    const newName = uniqueName("E2E Renamed Member");
    await loginViaUi(page, PROFILE_USER.email, PROFILE_USER.password);
    await page.goto("/user/profile/edit");
    const fullName = page.getByRole("textbox", { name: "Full Name" });
    await expect(fullName).not.toHaveValue("");
    await fullName.fill(newName);
    await page.getByRole("button", { name: "Update" }).click();

    await page.reload();
    await expect(page.getByRole("textbox", { name: "Full Name" })).toHaveValue(newName);
  });
});

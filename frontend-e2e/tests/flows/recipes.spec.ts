import { expect, test } from "@playwright/test";
import { loadFixtures, NAMES } from "../../lib/fixtures";
import { uniqueName, visibleText } from "../../lib/ui";

test.describe("recipes", () => {
  test("[flow] open a recipe from the recipe list", async ({ page }) => {
    const f = loadFixtures();
    await page.goto(`/g/${f.groupSlug}`);
    await page.getByRole("link", { name: NAMES.recipe }).first().click();
    await expect(page).toHaveURL(new RegExp(`/g/${f.groupSlug}/r/${f.recipeSlug}/?$`));
    await expect(visibleText(page, NAMES.ingredient)).toBeVisible();
    await expect(visibleText(page, NAMES.instruction)).toBeVisible();
  });

  test("[flow] search narrows the recipe list", async ({ page }) => {
    const f = loadFixtures();
    await page.goto(`/g/${f.groupSlug}`);
    await expect(page.getByRole("link", { name: NAMES.recipe })).toBeVisible();
    await page.getByRole("textbox", { name: "Search..." }).fill("Garden Salad");
    await expect(page.getByRole("link", { name: NAMES.recipe2 })).toBeVisible();
    await expect(page.getByRole("link", { name: NAMES.recipe })).toHaveCount(0);
  });

  test("[flow] create a recipe by name", async ({ page }) => {
    const f = loadFixtures();
    const name = uniqueName("E2E Flow Soup");
    await page.goto(`/g/${f.groupSlug}/r/create/new`);
    await page.getByRole("textbox", { name: "Recipe Name" }).fill(name);
    await page.getByRole("main").getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/g/${f.groupSlug}/r/e2e-flow-soup-[a-z0-9-]+`));

    await page.goto(`/g/${f.groupSlug}`);
    await expect(page.getByRole("link", { name })).toBeVisible();
  });

  test("[flow] comment on a recipe and see it after reload", async ({ page }) => {
    const f = loadFixtures();
    const comment = uniqueName("E2E comment");
    await page.goto(`/g/${f.groupSlug}/r/${f.recipe2Slug}`);
    await page.getByRole("textbox", { name: "Join the Conversation" }).fill(comment);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(visibleText(page, comment)).toBeVisible();
    await page.reload();
    await expect(visibleText(page, comment)).toBeVisible();
  });
});

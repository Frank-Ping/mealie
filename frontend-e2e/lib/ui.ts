/**
 * Framework-agnostic UI helpers for the flow tests. Everything here goes through what a user can
 * perceive (roles, accessible names, visible text, tooltips) and never through CSS classes or
 * component names, so the same flows can drive the Vue app and its React rewrite.
 */
import { expect, type Locator, type Page } from "@playwright/test";

/** A name no other test (or earlier run against a reused server) will have used. */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

export function visibleText(scope: Page | Locator, text: string | RegExp, exact = false): Locator {
  return scope.getByText(text, { exact }).filter({ visible: true }).first();
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email or Username" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).not.toHaveURL(/\/login\/?$/);
}

/**
 * Click the button called `name` inside `scope`. Icon-only buttons in the reference app expose their
 * name only as a hover tooltip, so if no button has that accessible name, hover each unnamed button
 * until one shows `name` and click that one. Either way the user-visible contract is the same.
 */
export async function clickButton(page: Page, scope: Locator, name: string) {
  await scope.getByRole("button").filter({ visible: true }).first().waitFor();
  const named = scope.getByRole("button", { name, exact: true }).filter({ visible: true });
  if (await named.count()) {
    await named.first().click();
    return;
  }
  const tooltip = page.getByRole("tooltip").filter({ visible: true })
    .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`) });
  for (const button of await scope.getByRole("button").filter({ visible: true }).all()) {
    const unnamed = await button.evaluate(el => !el.getAttribute("aria-label") && !(el.textContent ?? "").trim());
    if (!unnamed) {
      continue;
    }
    // Make sure a tooltip still fading out from an earlier hover can't be mistaken for this one's.
    await page.mouse.move(0, 0);
    await tooltip.first().waitFor({ state: "hidden", timeout: 2_000 }).catch(() => {});
    await button.hover();
    if (await tooltip.first().waitFor({ state: "visible", timeout: 1_000 }).then(() => true, () => false)) {
      await button.click();
      return;
    }
  }
  throw new Error(`no button named or tooltipped "${name}"`);
}

/**
 * Open a select/autocomplete labelled `label` and pick `option`. Clicks the field at its position
 * (not the inner input) because component libraries often overlay the input with a styled element.
 */
export async function selectOption(page: Page, label: string, option: string) {
  // The options list can be re-rendered (and closed) while the page is still loading its data, so
  // retry opening it until the option can actually be picked.
  await expect(async () => {
    await page.getByRole("combobox", { name: label }).click({ force: true });
    await page.getByRole("option", { name: option, exact: true }).click({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

/** Accepted labels for the button that submits a create/edit dialog. */
export const SUBMIT = /^(Create|Confirm|Save|Submit|Add)$/;

/** The smallest element that contains `text` and a checkbox (a list row / card). */
export function checkboxRowOf(scope: Page | Locator, text: string): Locator {
  return visibleText(scope, text, true)
    .locator("xpath=ancestor::*[.//input[@type='checkbox'] or .//*[@role='checkbox']][1]");
}

/** The dialog that is currently open (the topmost visible one). */
export function openDialog(page: Page): Locator {
  return page.getByRole("dialog").filter({ visible: true }).last();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

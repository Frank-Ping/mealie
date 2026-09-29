/**
 * Tier 1: every page renders real content without errors. One test per page file (66).
 * The test title starts with the page file so measure.sh can report "routes passed / 66".
 */
import { expect, test } from "@playwright/test";
import { loadFixtures } from "../lib/fixtures";
import { expectFieldValue, monitorPage, normalizedPath } from "../lib/page-health";
import { ROUTES } from "../lib/routes";

const EXPECTED_ROUTE_COUNT = 66;

test("route table covers every page", () => {
  expect(ROUTES).toHaveLength(EXPECTED_ROUTE_COUNT);
  expect(new Set(ROUTES.map(r => r.file)).size).toBe(EXPECTED_ROUTE_COUNT);
});

for (const route of ROUTES) {
  test.describe(route.anonymous ? "anonymous" : "admin", () => {
    if (route.anonymous) {
      test.use({ storageState: { cookies: [], origins: [] } });
    }

    test(`[route] ${route.file}`, async ({ page }) => {
      const f = loadFixtures();
      const health = monitorPage(page);

      await page.goto(route.path(f));

      for (const text of route.texts(f)) {
        await expect(page.getByText(text, { exact: false }).filter({ visible: true }).first(), `visible text "${text}"`).toBeVisible();
      }
      for (const value of route.values?.(f) ?? []) {
        await expectFieldValue(page, value);
      }

      const expected = route.finalPath?.(f) ?? route.path(f);
      if (expected instanceof RegExp) {
        expect(normalizedPath(page)).toMatch(expected);
      }
      else {
        expect(normalizedPath(page)).toBe(expected);
      }

      await health.assertHealthy();
    });
  });
}

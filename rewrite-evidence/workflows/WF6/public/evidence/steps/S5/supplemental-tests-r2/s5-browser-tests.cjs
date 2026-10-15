const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require(process.env.WF6_PLAYWRIGHT_MODULE);
const fixtures = () => JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR, 'fixtures.json')));
const save = record => fs.appendFileSync(process.env.WF6_BROWSER_EVIDENCE, JSON.stringify(record) + '\n');
async function login(page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email or Username' }).fill('e2e-admin@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('[REDACTED]');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.locator('[data-wf6-session="authenticated"]')).toBeVisible();
}
test.beforeEach(async ({ context }) => { await context.addInitScript(() => { window.__wf6DocumentId = crypto.randomUUID(); }); });

test('real read-only recipe UI, keyboard link, direct refresh and retained Vue round trip', async ({ page }) => {
  const f = fixtures(); const responses = [];
  page.on('response', r => { const u = new URL(r.url()); if (u.pathname.startsWith('/api/recipes') || u.pathname === '/api/users/self' || r.request().isNavigationRequest()) responses.push({ path: u.pathname,
    query: [...u.searchParams.entries()], method: r.request().method(), status: r.status(), document: r.request().isNavigationRequest(), frontend: r.headers()['x-wf6-frontend'] ?? null }); });
  await login(page); await expect(page.getByRole('link', { name: 'E2E Pancakes', exact: true })).toBeVisible();
  const card = page.getByRole('link', { name: 'E2E Pancakes', exact: true }); expect(await card.getAttribute('href')).toBe(`/g/${f.groupSlug}/r/${f.recipeSlug}`);
  await card.focus(); await expect(card).toBeFocused(); await card.press('Enter');
  await expect(page.getByRole('heading', { name: 'E2E Pancakes', exact: true })).toBeVisible();
  for (const text of ['Ingredients', '2 cups e2e flour', 'Instructions', 'Whisk the e2e batter until smooth.', 'E2E Skillet', 'E2E Breakfast', 'E2E Quick']) await expect(page.getByText(text).filter({ visible: true }).first()).toBeVisible();
  await page.goto(`/g/${f.groupSlug}/r/${f.recipeSlug}?probe=preserved#ingredients`); await page.reload(); await expect(page.getByRole('heading', { name: 'E2E Pancakes', exact: true })).toBeVisible(); expect(page.url()).toContain('?probe=preserved#ingredients');
  const reactDocument = await page.evaluate(() => window.__wf6DocumentId);
  await page.getByRole('link', { name: 'Open Vue shopping lists' }).click(); await expect(page.getByRole('link', { name: 'E2E Groceries' }).first()).toBeVisible();
  const vueDocument = await page.evaluate(() => window.__wf6DocumentId); expect(vueDocument).not.toBe(reactDocument);
  await page.locator(`a[href="/g/${f.groupSlug}"]`).filter({ visible: true }).first().click(); await expect(page.getByRole('link', { name: 'E2E Pancakes', exact: true })).toBeVisible(); expect(await page.evaluate(() => window.__wf6DocumentId)).not.toBe(vueDocument);
  await expect(page.locator('[data-wf6-user-id]')).toHaveAttribute('data-wf6-user-id', f.adminId);
  expect(responses.some(r => r.path === '/api/recipes/' + f.recipeSlug && r.status === 200)).toBe(true);
  expect(responses.filter(r => r.path.startsWith('/api/recipes')).every(r => r.method === 'GET')).toBe(true);
  save({ test: 'real_read_only_keyboard_round_trip', status: 'PASS', userId: f.adminId, groupSlug: f.groupSlug, responses, reactDocument, vueDocument });
});

test('loading, real empty search, clear restoration and real missing-detail error', async ({ page }) => {
  // Delay delivery of a real request; no synthetic success body is supplied.
  await page.route('**/api/recipes?*', async route => { await new Promise(resolve => setTimeout(resolve, 650)); await route.continue(); });
  await login(page); await expect(page.getByRole('status')).toContainText('Loading Recipes');
  await expect(page.getByRole('link', { name: 'E2E Pancakes', exact: true })).toBeVisible();
  const field = page.getByRole('textbox', { name: 'Search...', exact: true });
  const empty = page.waitForResponse(r => new URL(r.url()).searchParams.get('search') === 'wf6-no-such-recipe-20261014' && r.url().includes('/api/recipes'));
  await field.fill('wf6-no-such-recipe-20261014'); const response = await empty; expect(response.status()).toBe(200); expect((await response.json()).items).toEqual([]);
  await expect(page.getByRole('status')).toContainText('No recipes found'); await field.fill('');
  await expect(page.getByRole('link', { name: 'E2E Pancakes', exact: true })).toBeVisible(); await expect(page.getByRole('link', { name: 'E2E Garden Salad', exact: true })).toBeVisible();
  const f = fixtures(); const missing = page.waitForResponse(r => r.url().endsWith('/api/recipes/wf6-s4-missing-recipe-20261014'));
  await page.goto(`/g/${f.groupSlug}/r/wf6-s4-missing-recipe-20261014`); const absent = await missing; expect(absent.status()).toBe(404); await expect(page.getByRole('alert').filter({ hasText: 'Recipe not found' })).toBeVisible();
  expect(await page.locator('[data-wf6-frontend="react"]').count()).toBe(1);
  save({ test: 'states', status: 'PASS', loadingMethod: 'Delay-only interception, actual backend response', emptyStatus: response.status(), emptyItems: [], detailErrorStatus: absent.status(), clearSearchRestored: true });
});

test('business rendering retains explicit Vue/mode/group boundaries', async ({ page, request }) => {
  await login(page); const f = fixtures();
  for (const target of [`/g/${f.groupSlug}/r/${f.recipeSlug}?edit=true`, `/g/${f.groupSlug}/r/${f.recipeSlug}?parse=true`, `/g/${f.groupSlug}/r/${f.recipeSlug}?cook=true`, `/g/${f.groupSlug}/r/create/new`, '/g/e2e-second-group']) {
    const response = await request.get(target, { headers: { accept: 'text/html' } }); expect(response.headers()['x-wf6-frontend']).toBe('vue');
  }
  const explicit = page.waitForResponse(r => r.request().isNavigationRequest()); await page.getByRole('link', { name: 'Use explicit Vue entry' }).click(); expect((await explicit).headers()['x-wf6-frontend']).toBe('vue'); await expect(page.locator('[data-wf6-frontend="react"]')).toHaveCount(0);
  save({ test: 'retained_boundaries', status: 'PASS', checks: 'edit/parse/cook/create/other group and actual explicit Vue document' });
});

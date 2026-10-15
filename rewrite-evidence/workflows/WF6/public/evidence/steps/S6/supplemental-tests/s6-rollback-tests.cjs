const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require(process.env.WF6_PLAYWRIGHT_MODULE);
const fixtures = () => JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR, 'fixtures.json')));
const visible = (page, value) => page.getByText(value).filter({ visible: true }).first();

test('real all-Vue gateway: login, list, detail, shopping list, direct URL and refresh', async ({ page, request, context }) => {
  const evidence = [];
  page.on('response', response => {
    const req = response.request();
    if (req.isNavigationRequest() || response.url().includes('/api/') || response.url().includes('/_nuxt/')) {
      // Request/response bodies and credentials remain in private original trace only.
      const url = new URL(response.url());
      evidence.push({ method: req.method(), path: url.pathname, queryKeys: [...url.searchParams.keys()], status: response.status(),
        type: req.resourceType(), frontend: response.headers()['x-wf6-frontend'] ?? null, build: response.headers()['x-wf6-build'] ?? null,
        origin: url.origin });
    }
  });
  const about = await request.get('/api/app/about'); expect(about.status()).toBe(200);
  const config = await (await request.get('/_wf6/route-map.json')).json();
  expect(config.takeoverEnabled).toBe(false); expect(config.activeReactRoutes).toEqual([]);
  for (const missing of ['/_nuxt/wf6-does-not-exist.js', '/wf6-does-not-exist.css', '/missing-image.png']) {
    const response = await request.get(missing, { headers: { accept: 'text/html' } });
    expect(response.status()).toBe(404); expect(await response.text()).not.toContain('<html');
  }
  const invalid = await request.post('/api/auth/token', { form: { username: 'e2e-admin@example.com', password: '[REDACTED]' } });
  expect(invalid.status()).toBe(401);
  const login = await page.goto('/login'); expect(login.headers()['x-wf6-frontend']).toBe('vue'); expect(login.headers()['x-wf6-build']).toBe(process.env.WF6_BUILD_HASH);
  await page.getByRole('textbox', { name: 'Email or Username' }).fill('e2e-admin@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('[REDACTED]');
  const token = page.waitForResponse(r => r.url().includes('/api/auth/token') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  expect((await token).status()).toBe(200);
  const f = fixtures();
  await expect(page).toHaveURL(new RegExp(`/g/${f.groupSlug}/?$`));
  await expect(page.getByRole('link', { name: 'E2E Pancakes' }).first()).toBeVisible();
  await expect(visible(page, 'E2E Admin')).toBeVisible();
  const self = await page.evaluate(async () => {
    const token = document.cookie.split(';').map(x => x.trim()).find(x => x.startsWith('mealie.access_token='))?.split('=').slice(1).join('=');
    if (!token) return { status: null };
    const response = await fetch('/api/users/self', { headers: { authorization: `Bearer ${decodeURIComponent(token)}` } });
    const data = await response.json(); return { status: response.status, id: data.id, groupSlug: data.groupSlug };
  });
  expect(self.status).toBe(200); expect(self.id).toBe(f.adminId); expect(self.groupSlug).toBe(f.groupSlug);
  await expect(page.locator('#__nuxt')).toBeVisible(); await expect(page.locator('[data-wf6-frontend="react"]')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search...', exact: true }).fill('Garden Salad');
  await expect(page.getByRole('link', { name: 'E2E Garden Salad' })).toBeVisible(); await expect(page.getByRole('link', { name: 'E2E Pancakes' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search...', exact: true }).fill(''); await expect(page.getByRole('link', { name: 'E2E Pancakes' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'E2E Pancakes' }).first().click();
  await expect(page).toHaveURL(new RegExp(`/g/${f.groupSlug}/r/${f.recipeSlug}/?$`));
  for (const text of ['E2E Pancakes', '2 cups e2e flour', 'Whisk the e2e batter until smooth.', 'E2E Skillet', 'E2E Breakfast', 'E2E Quick']) await expect(visible(page, text)).toBeVisible();
  const direct = `/g/${f.groupSlug}/r/${f.recipeSlug}?probe=preserved#ingredients`;
  const document = await page.goto(direct); expect(document.headers()['x-wf6-frontend']).toBe('vue');
  await expect(visible(page, '2 cups e2e flour')).toBeVisible(); expect(page.url()).toContain('probe=preserved'); expect(page.url()).toContain('#ingredients');
  const refreshed = await page.reload(); expect(refreshed.headers()['x-wf6-build']).toBe(process.env.WF6_BUILD_HASH);
  await expect(visible(page, 'Whisk the e2e batter until smooth.')).toBeVisible();
  const shopping = await page.goto('/shopping-lists?disableRedirect=true'); expect(shopping.headers()['x-wf6-frontend']).toBe('vue');
  await expect(page.getByRole('link', { name: 'E2E Groceries' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'E2E Groceries' }).first().click(); await expect(page.getByRole('heading', { name: 'E2E Groceries' })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: 'E2E Groceries' })).toBeVisible();
  await page.goto(`/g/${f.groupSlug}`); await expect(page.getByRole('link', { name: 'E2E Pancakes' }).first()).toBeVisible();
  expect(evidence.filter(x => x.type === 'document').every(x => x.frontend === 'vue' && x.build === process.env.WF6_BUILD_HASH)).toBe(true);
  expect(evidence.some(x => x.path.startsWith('/_nuxt/') && x.status === 200 && x.frontend === 'vue')).toBe(true);
  expect(evidence.every(x => x.origin === process.env.WF6_GATEWAY_ORIGIN)).toBe(true);
  await page.screenshot({path: path.join(process.env.WF6_SHOTS,'rollback-vue-list.png')});
  expect(evidence.filter(x=>x.type==='document').length).toBeLessThan(20);
  fs.writeFileSync(process.env.WF6_BROWSER_EVIDENCE, JSON.stringify({ status: 'PASS', session: self, config, requests: evidence,
    browserContext: 'Fresh context with no inherited storage state; real UI login', secretValuesExported: false,
    provenance: 'Takeover explicitly disabled. Actual Nuxt runtime; every observed document and Vue asset attributes to accepted Vue build; React does not execute.' }, null, 2));
});

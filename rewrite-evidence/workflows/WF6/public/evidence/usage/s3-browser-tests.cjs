const fs = require('node:fs');
const path = require('node:path');
const { test, expect, request: playwrightRequest } = require(process.env.WF6_PLAYWRIGHT_MODULE);
const fixtures = () => JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR, 'fixtures.json')));
const evidenceFile = process.env.WF6_BROWSER_EVIDENCE;
function save(record) { fs.appendFileSync(evidenceFile, JSON.stringify(record) + '\n'); }
const marker = page => page.locator('[data-wf6-session="authenticated"]');
const documentId = page => page.evaluate(() => window.__wf6DocumentId);
test.beforeEach(async ({ context }) => { await context.addInitScript(() => { window.__wf6DocumentId = crypto.randomUUID(); }); });

test('real Vue login and document-boundary round trip with preserved identity', async ({ page }) => {
  const f = fixtures(); const responses = [];
  page.on('response', r => {
    const q = r.request(); const u = new URL(r.url());
    if (q.isNavigationRequest() || u.pathname === '/api/users/self' || u.pathname.startsWith('/_nuxt/') || u.pathname.startsWith('/_wf6/')) responses.push({ method: q.method(), path: u.pathname,
      status: r.status(), type: q.resourceType(), frontend: r.headers()['x-wf6-frontend'] ?? null, build: r.headers()['x-wf6-build'] ?? null, origin: u.origin });
  });
  const login = await page.goto('/login'); expect(login.headers()['x-wf6-frontend']).toBe('vue');
  await page.getByRole('textbox', { name: 'Email or Username' }).fill('e2e-admin@example.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('[REDACTED]');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(marker(page)).toBeVisible(); await expect(marker(page)).toHaveAttribute('data-wf6-user-id', f.adminId); await expect(marker(page)).toHaveAttribute('data-wf6-group', f.groupSlug);
  await expect(page.locator('[data-wf6-react-source]')).toHaveAttribute('data-wf6-react-source', process.env.WF6_REACT_SOURCE_HASH);
  const reactId = await documentId(page);
  await page.getByRole('link', { name: 'Open React detail probe' }).click();
  await expect(page.locator('[data-wf6-probe-route]')).toHaveText('Detail navigation probe'); expect(await documentId(page)).toBe(reactId);
  await page.getByRole('link', { name: 'Open Vue shopping lists' }).click();
  await expect(page.getByRole('link', { name: 'E2E Groceries' }).first()).toBeVisible();
  expect(await page.locator('[data-wf6-frontend="react"]').count()).toBe(0);
  const vueId = await documentId(page); expect(vueId).not.toBe(reactId);
  // Use an actual frozen Vue navigation anchor; goto would not prove Nuxt interception.
  await page.locator(`a[href="/g/${f.groupSlug}"]`).filter({ visible: true }).first().click();
  await expect(marker(page)).toBeVisible(); expect(await documentId(page)).not.toBe(vueId);
  await expect(marker(page)).toHaveAttribute('data-wf6-user-id', f.adminId);
  const target = `/g/${f.groupSlug}/r/${f.recipeSlug}?probe=preserved#ingredients`;
  const direct = await page.goto(target); expect(direct.headers()['x-wf6-frontend']).toBe('react'); expect(direct.headers()['x-wf6-build']).toBe(process.env.WF6_REACT_BUILD_HASH);
  await expect(marker(page)).toBeVisible(); expect(page.url()).toContain('?probe=preserved#ingredients');
  const before = await documentId(page); await page.reload(); await expect(marker(page)).toBeVisible(); expect(await documentId(page)).not.toBe(before); expect(page.url()).toContain('?probe=preserved#ingredients');
  const vueLink = await page.getByRole('link', { name: 'Use explicit Vue entry' }).getAttribute('href'); expect(vueLink).toBe(target.replace('#', '&wf6=vue#'));
  expect(responses.filter(r => r.type === 'document').some(r => r.frontend === 'vue')).toBe(true);
  expect(responses.filter(r => r.type === 'document').some(r => r.frontend === 'react')).toBe(true);
  expect(responses.some(r => r.path.startsWith('/_nuxt/') && r.frontend === 'vue' && r.build === process.env.WF6_BUILD_HASH)).toBe(true);
  expect(responses.some(r => r.path.startsWith('/_wf6/assets/') && r.frontend === 'react' && r.build === process.env.WF6_REACT_BUILD_HASH)).toBe(true);
  expect(responses.some(r => r.path === '/api/users/self' && r.status === 200)).toBe(true);
  expect(responses.every(r => r.origin === process.env.WF6_GATEWAY_ORIGIN)).toBe(true);
  save({ test: 'round_trip', status: 'PASS', userId: f.adminId, groupSlug: f.groupSlug, reactId, vueId, responses, scope: 'Skeleton only; no recipe business API/data completion claimed' });
});

test('gateway boundaries use real builds, including Vue-owned edit/parse/cook and other groups', async ({ request }) => {
  const f = fixtures(); const rows = [];
  const cases = [[`/g/${f.groupSlug}`, 'react'], [`/g/${f.groupSlug}/r/${f.recipeSlug}`, 'react'],
    [`/g/${f.groupSlug}/r/create`, 'vue'], [`/g/${f.groupSlug}/r/create/new`, 'vue'], [`/g/${f.groupSlug}/r/create/url`, 'vue'],
    [`/g/${f.groupSlug}/shared/r/${f.sharedRecipeToken}`, 'vue'], ['/g/e2e-second-group', 'vue'], ['/g/e2e-second-group/r/recipe', 'vue'],
    [`/g/${f.groupSlug}/r/${f.recipeSlug}?edit=true`, 'vue'], [`/g/${f.groupSlug}/r/${f.recipeSlug}?parse=true`, 'vue'], [`/g/${f.groupSlug}/r/${f.recipeSlug}?cook=true`, 'vue'],
    [`/g/${f.groupSlug}?wf6=vue`, 'vue'], ['/shopping-lists', 'vue']];
  for (const [target, expected] of cases) {
    const r = await request.get(target, { headers: { accept: 'text/html' } }); expect(r.status()).toBe(200); expect(r.headers()['x-wf6-frontend']).toBe(expected);
    expect(r.headers()['x-wf6-build']).toBe(expected === 'vue' ? process.env.WF6_BUILD_HASH : process.env.WF6_REACT_BUILD_HASH);
    const body = await r.text(); expect(body.includes('/_wf6/assets/')).toBe(expected === 'react'); rows.push({ target, status: r.status(), frontend: expected });
  }
  for (const target of ['/_wf6/assets/missing.js', '/_nuxt/missing.js']) { const r = await request.get(target, { headers: { accept: 'text/html' } }); expect(r.status()).toBe(404); }
  save({ test: 'gateway_boundaries', status: 'PASS', rows });
});

test('anonymous and expired sessions expose explicit Vue entry without loops or identity data', async ({ browser }) => {
  const f = fixtures();
  for (const expired of [false, true]) {
    const context = await browser.newContext();
    if (expired) await context.addCookies([{ name: 'mealie.access_token', value: '[REDACTED]', url: process.env.WF6_GATEWAY_ORIGIN }]);
    const page = await context.newPage(); let documents = 0; page.on('request', r => { if (r.isNavigationRequest()) documents++; });
    const target = `/g/${f.groupSlug}/r/${f.recipeSlug}?probe=anonymous#ingredients`; await page.goto(target);
    await expect(page.locator('[data-wf6-session="vue-required"]')).toContainText('401'); expect(await marker(page).count()).toBe(0);
    const href = await page.getByRole('link', { name: 'Use explicit Vue entry' }).getAttribute('href'); expect(href).toContain('probe=anonymous'); expect(href).toContain('wf6=vue'); expect(href).toContain('#ingredients');
    const document = page.waitForResponse(r => r.request().isNavigationRequest()); await page.getByRole('link', { name: 'Use explicit Vue entry' }).click(); expect((await document).headers()['x-wf6-frontend']).toBe('vue');
    await expect(page.locator('[data-wf6-frontend="react"]')).toHaveCount(0); expect(documents).toBeLessThanOrEqual(3);
    save({ test: expired ? 'expired_session' : 'anonymous_session', status: 'PASS', documents, explicitVueHref: href }); await context.close();
  }
});

test('a real second-group identity is refused by the React pilot', async ({ browser }) => {
  const baseURL = process.env.WF6_GATEWAY_ORIGIN; const f = fixtures();
  const api = await playwrightRequest.newContext({ baseURL });
  expect((await api.post('/api/auth/token', { form: { username: 'e2e-admin@example.com', password: '[REDACTED]' } })).status()).toBe(200);
  const h = await api.post('/api/admin/households', { data: { name: 'WF6 S3 Different Household', groupId: f.secondGroupId } }); expect(h.ok()).toBe(true);
  const email = 'wf6-s3-other@example.com'; const password = '[REDACTED]';
  const created = await api.post('/api/admin/users', { data: { username: 'wf6s3other', fullName: 'WF6 S3 Different Group', email, password, group: 'E2E Second Group', household: 'WF6 S3 Different Household', admin: false } }); expect(created.ok()).toBe(true);
  const other = await playwrightRequest.newContext({ baseURL }); expect((await other.post('/api/auth/token', { form: { username: email, password } })).status()).toBe(200);
  const self = await other.get('/api/users/self'); expect(self.status()).toBe(200); const user = await self.json(); expect(user.groupSlug).not.toBe(f.groupSlug);
  const context = await browser.newContext({ storageState: await other.storageState() }); const page = await context.newPage();
  await page.goto(`/g/${f.groupSlug}`); await expect(page.locator('[data-wf6-session="vue-required"]')).toContainText('group does not match'); expect(await marker(page).count()).toBe(0);
  expect(await page.getByRole('link', { name: 'Open React detail probe' }).count()).toBe(0);
  const document = page.waitForResponse(r => r.request().isNavigationRequest()); await page.getByRole('link', { name: 'Use explicit Vue entry' }).click(); expect((await document).headers()['x-wf6-frontend']).toBe('vue');
  save({ test: 'different_group', status: 'PASS', realUserId: user.id, groupSlug: user.groupSlug, configuredGroup: f.groupSlug, selfStatus: 200 });
  await context.close(); await api.dispose(); await other.dispose();
});

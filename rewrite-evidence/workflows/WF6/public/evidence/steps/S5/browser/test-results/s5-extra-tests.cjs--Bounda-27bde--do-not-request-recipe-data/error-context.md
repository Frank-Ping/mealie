# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s5-extra-tests.cjs >> [Boundary] anonymous and expired real 401 do not request recipe data
- Location: ../../../../../../../../../../../tmp/wf6-rerun-20261014-01-S5/tests/s5-extra-tests.cjs:29:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: page.waitForResponse: Test timeout of 45000ms exceeded.
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e5]:
    - alert [ref=e6]:
      - generic [ref=e10]: Read-only recipes. Editing and other features remain available through the Vue entry.
    - alert [ref=e11]:
      - generic [ref=e15]: Anonymous or expired session (401)
    - link "Use explicit Vue entry" [ref=e16] [cursor=pointer]:
      - /url: /g/home?probe=auth&wf6=vue#preserve
    - link "Use Vue login" [ref=e17] [cursor=pointer]:
      - /url: /login?redirect=%2Fg%2Fhome%3Fprobe%3Dauth%26wf6%3Dvue%23preserve
```

# Test source

```ts
  1  | const fs = require('node:fs');
  2  | const path = require('node:path');
  3  | const {test, expect} = require(process.env.WF6_PLAYWRIGHT_MODULE);
  4  | const fixtures=()=>JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR,'fixtures.json')));
  5  | const save=r=>fs.appendFileSync(process.env.WF6_BROWSER_EVIDENCE,JSON.stringify(r)+'\n');
  6  | async function login(page) {
  7  |  await page.goto('/login'); await page.getByRole('textbox',{name:'Email or Username'}).fill('e2e-admin@example.com'); await page.getByRole('textbox',{name:'Password'}).fill('[REDACTED]'); await page.getByRole('button',{name:'Login',exact:true}).click(); await expect(page.getByRole('link',{name:'E2E Pancakes',exact:true})).toBeVisible();
  8  | }
  9  | test.beforeEach(async({context})=>context.addInitScript(()=>{window.__wf6DocumentId=crypto.randomUUID();}));
  10 | test('[Mixed] login search detail Vue shopping return and browser history',async({page})=>{
  11 |  const f=fixtures(),responses=[];
  12 |  page.on('response',r=>{const u=new URL(r.url());if(r.request().isNavigationRequest()||u.pathname==='/api/users/self'||u.pathname.startsWith('/api/recipes'))responses.push({path:u.pathname,query:u.search,method:r.request().method(),status:r.status(),document:r.request().isNavigationRequest(),owner:r.headers()['x-wf6-frontend']??null});});
  13 |  await login(page);const doc=await page.evaluate(()=>window.__wf6DocumentId);
  14 |  await page.getByRole('textbox',{name:'Search...',exact:true}).fill('Garden');await expect(page.getByRole('link',{name:'E2E Garden Salad',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'E2E Pancakes',exact:true})).toHaveCount(0);
  15 |  await page.getByRole('link',{name:'E2E Garden Salad',exact:true}).press('Enter');await expect(page.getByRole('heading',{name:'E2E Garden Salad',exact:true})).toBeVisible();
  16 |  await page.goBack();await expect(page.getByRole('textbox',{name:'Search...',exact:true})).toBeVisible();await page.goForward();await expect(page.getByRole('heading',{name:'E2E Garden Salad',exact:true})).toBeVisible();expect(await page.evaluate(()=>window.__wf6DocumentId)).toBe(doc);
  17 |  await page.goto(`/g/${f.groupSlug}/r/${f.recipeSlug}?wf6probe=history#ingredients`);await page.reload();await expect(page.getByRole('heading',{name:'E2E Pancakes',exact:true})).toBeVisible();expect(page.url()).toContain('?wf6probe=history#ingredients');
  18 |  await page.getByRole('link',{name:'Open Vue shopping lists'}).click();await expect(page.getByRole('link',{name:'E2E Groceries'}).first()).toBeVisible();const vueDoc=await page.evaluate(()=>window.__wf6DocumentId);await page.screenshot({path:path.join(process.env.WF6_SHOTS,'vue-shopping.png')});
  19 |  await page.locator(`a[href="/g/${f.groupSlug}"]`).filter({visible:true}).first().click();await expect(page.getByRole('link',{name:'E2E Pancakes',exact:true})).toBeVisible();expect(await page.evaluate(()=>window.__wf6DocumentId)).not.toBe(vueDoc);await expect(page.locator('[data-wf6-user-id]')).toHaveAttribute('data-wf6-user-id',f.adminId);await expect(page.locator('[data-wf6-group]')).toHaveAttribute('data-wf6-group',f.groupSlug);await page.screenshot({path:path.join(process.env.WF6_SHOTS,'react-list.png')});
  20 |  expect(responses.filter(r=>r.path.startsWith('/api/recipes')).every(r=>r.method==='GET')).toBe(true);expect(responses.some(r=>r.document&&r.owner==='vue')).toBe(true);expect(responses.some(r=>r.document&&r.owner==='react')).toBe(true);expect(responses.filter(r=>r.document).length).toBeLessThan(15);save({category:'mixed',test:'complete_journey_history',status:'PASS',user:f.adminId,group:f.groupSlug,responses});
  21 | });
  22 | test('[Boundary] complete route matrix and missing assets are real 404',async({page,request})=>{
  23 |  await login(page);const f=fixtures(),rows=[];
  24 |  const vue=[`/g/${f.groupSlug}/r/create`,`/g/${f.groupSlug}/r/create/new`,`/g/${f.groupSlug}/r/create/url/deeper`,`/g/${f.groupSlug}/r/shared`,`/g/${f.groupSlug}/r/${f.recipeSlug}/edit`,`/g/${f.groupSlug}/r/${f.recipeSlug}?edit=true`,`/g/${f.groupSlug}/r/${f.recipeSlug}?parse=true`,`/g/${f.groupSlug}/r/${f.recipeSlug}?cook=true`,`/g/${f.groupSlug}/r/${f.recipeSlug}?wf6=vue&probe=retained`,'/g/e2e-second-group','/login','/shopping-lists','/admin'];
  25 |  for(const url of vue){const r=await request.get(url,{headers:{accept:'text/html'}});expect(r.headers()['x-wf6-frontend'],url).toBe('vue');rows.push({url,status:r.status(),owner:r.headers()['x-wf6-frontend']});}
  26 |  for(const url of ['/_wf6/assets/s5-does-not-exist.js','/_nuxt/s5-does-not-exist.js','/s5-does-not-exist.png']){const r=await request.get(url,{headers:{accept:'text/html'}});expect(r.status()).toBe(404);expect(r.headers()['content-type']).not.toContain('text/html');rows.push({url,status:r.status()});}
  27 |  await page.goto(`/g/${f.groupSlug}/r/${f.recipeSlug}?probe=retained#ingredients`);await expect(page.getByRole('heading',{name:'E2E Pancakes',exact:true})).toBeVisible();const response=page.waitForResponse(r=>r.request().isNavigationRequest());await page.getByRole('link',{name:'Use explicit Vue entry'}).click();expect((await response).headers()['x-wf6-frontend']).toBe('vue');expect(page.url()).toContain('probe=retained');expect(page.url()).toContain('wf6=vue');expect(page.url()).toContain('#ingredients');await expect(page.locator('[data-wf6-frontend="react"]')).toHaveCount(0);await expect(page.locator('#__nuxt')).toBeVisible();save({category:'boundary',test:'route_matrix_assets_explicit_entry',status:'PASS',rows,url:page.url()});
  28 | });
  29 | test('[Boundary] anonymous and expired real 401 do not request recipe data',async({page,context})=>{
  30 |  const f=fixtures();let recipes=0;page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/recipes'))recipes++;});
> 31 |  for(const expired of [false,true]){await context.clearCookies();if(expired)await context.addCookies([{name:'mealie.access_token',value:'[REDACTED]',url:process.env.WF6_GATEWAY_ORIGIN}]);const self=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/users/self');await page.goto(`/g/${f.groupSlug}?probe=auth#preserve`);expect((await self).status()).toBe(401);await expect(page.locator('[data-wf6-session="vue-required"]')).toContainText('401');await expect(page.locator('[data-wf6-business]')).toHaveCount(0);expect(recipes).toBe(0);await expect(page.getByRole('link',{name:'Use Vue login'})).toBeVisible();}
     |                                                                                                                                                                                                                      ^ Error: page.waitForResponse: Test timeout of 45000ms exceeded.
  32 |  const navigation=page.waitForResponse(r=>r.request().isNavigationRequest());await page.getByRole('link',{name:'Use explicit Vue entry'}).click();expect((await navigation).headers()['x-wf6-frontend']).toBe('vue');expect(page.url()).toContain('probe=auth');expect(page.url()).toContain('#preserve');save({category:'boundary',test:'anonymous_expired_real401',status:'PASS',recipeRequests:recipes});
  33 | });
  34 | test('[Boundary] real second-group user cannot read pilot data',async({page,context})=>{
  35 |  await login(page);const f=fixtures();const token=await page.evaluate(()=>decodeURIComponent(document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('mealie.access_token=')).split('=').slice(1).join('=')));const headers={authorization:`Bearer ${token}`};
  36 |  const household=await page.request.post('/api/admin/households',{headers,data:{name:'WF6 S5 Second Household',groupId:f.secondGroupId}});expect(household.ok()).toBe(true);
  37 |  const user=await page.request.post('/api/admin/users',{headers,data:{email:'wf6-s5-other@example.com',password:'[REDACTED]',fullName:'WF6 S5 Other',username:'wf6s5other',group:'E2E Second Group',household:'WF6 S5 Second Household',admin:false}});expect(user.ok()).toBe(true);
  38 |  const auth=await page.request.post('/api/auth/token',{form:{username:'wf6-s5-other@example.com',password:'[REDACTED]'}});expect(auth.ok()).toBe(true);const credential=(await auth.json()).access_token;await context.clearCookies();await context.addCookies([{name:'mealie.access_token',value:credential,url:process.env.WF6_GATEWAY_ORIGIN}]);
  39 |  let recipes=0;page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/recipes'))recipes++;});const self=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/users/self');await page.goto(`/g/${f.groupSlug}`);const identity=await(await self).json();expect(identity.groupId).toBe(f.secondGroupId);expect(identity.groupSlug).not.toBe(f.groupSlug);await expect(page.locator('[data-wf6-session="vue-required"]')).toContainText('group does not match');await expect(page.locator('[data-wf6-business]')).toHaveCount(0);expect(recipes).toBe(0);save({category:'boundary',test:'real_second_group',status:'PASS',actualGroup:identity.groupSlug,groupId:identity.groupId,recipeRequests:recipes});
  40 | });
  41 | test('[React] injected API 500 stays visible and Retry restores real backend',async({page})=>{
  42 |  await login(page);await page.route('**/api/recipes?*',route=>route.fulfill({status:500,contentType:'application/json',body:'{"detail":"WF6 S5 isolated injected failure"}'}));await page.getByRole('textbox',{name:'Search...',exact:true}).fill('Garden');await expect(page.getByRole('alert').filter({hasText:'Recipe API request failed (500)'})).toBeVisible();await expect(page.locator('[data-wf6-frontend="react"]')).toHaveCount(1);await expect(page.getByRole('link',{name:'E2E Pancakes',exact:true})).toHaveCount(0);await page.unroute('**/api/recipes?*');await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('link',{name:'E2E Garden Salad',exact:true})).toBeVisible();save({category:'react',test:'injected500_retry',status:'PASS',syntheticFailure:true,recovery:'actual backend 200; takeover remains enabled'});
  43 | });
  44 | 
```
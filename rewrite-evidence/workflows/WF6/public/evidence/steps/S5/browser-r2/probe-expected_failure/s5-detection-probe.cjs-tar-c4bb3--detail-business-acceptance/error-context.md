# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s5-detection-probe.cjs >> target real recipe detail business acceptance
- Location: ../../../../../../../../../../../tmp/wf6-rerun-20261014-01-S5-R2/tests/s5-detection-probe.cjs:2:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'E2E Pancakes', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'E2E Pancakes', exact: true }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'E2E Pancakes', exact: true })

```

# Test source

```ts
  1 | const fs=require('node:fs');const path=require('node:path');const {test,expect}=require(process.env.WF6_PLAYWRIGHT_MODULE);
  2 | test('target real recipe detail business acceptance',async({page})=>{
  3 |  const f=JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR,'fixtures.json')));
  4 |  const auth=JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR,'admin.json')));await page.context().addCookies(auth.cookies);
  5 |  // Match the fresh auth state origin; cookies do not cross hostnames.
> 6 |  const response=await page.goto(`${process.env.WF6_GATEWAY_ORIGIN}/g/${f.groupSlug}/r/${f.recipeSlug}`);expect(response.headers()['x-wf6-frontend']).toBe('react');await expect(page.getByRole('heading',{name:'E2E Pancakes',exact:true})).toBeVisible({timeout:5000});await expect(page.getByText('2 cups e2e flour',{exact:true})).toBeVisible();
    |                                                                                                                                                                                                                                             ^ Error: expect(locator).toBeVisible() failed
  7 | });
  8 | 
```
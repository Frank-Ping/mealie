# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: s5-detection-probe.cjs >> target real recipe detail business acceptance
- Location: ../../../../../../../../../../../tmp/wf6-rerun-20261014-01-S5-R1/tests/s5-detection-probe.cjs:2:1

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

```yaml
- main:
  - alert: Read-only recipes. Editing and other features remain available through the Vue entry.
  - alert: Anonymous or expired session (401)
  - link "Use explicit Vue entry":
    - /url: /g/home/r/e2e-pancakes?wf6=vue
  - link "Use Vue login":
    - /url: /login?redirect=%2Fg%2Fhome%2Fr%2Fe2e-pancakes%3Fwf6%3Dvue
```

# Test source

```ts
  1 | const fs=require('node:fs');const path=require('node:path');const {test,expect}=require(process.env.WF6_PLAYWRIGHT_MODULE);
  2 | test('target real recipe detail business acceptance',async({page})=>{
  3 |  const f=JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR,'fixtures.json')));
  4 |  const auth=JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR,'admin.json')));await page.context().addCookies(auth.cookies);
  5 |  // Frozen auth is localhost scoped, so this probe deliberately uses that exact origin.
> 6 |  const response=await page.goto(`http://localhost:9106/g/${f.groupSlug}/r/${f.recipeSlug}`);expect(response.headers()['x-wf6-frontend']).toBe('react');await expect(page.getByRole('heading',{name:'E2E Pancakes',exact:true})).toBeVisible({timeout:5000});await expect(page.getByText('2 cups e2e flour',{exact:true})).toBeVisible();
    |                                                                                                                                                                                                                                 ^ Error: expect(locator).toBeVisible() failed
  7 | });
  8 | 
```
const fs=require('node:fs');const path=require('node:path');const {test,expect}=require(process.env.WF6_PLAYWRIGHT_MODULE);
test('target real recipe detail business acceptance',async({page})=>{
 const f=JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR,'fixtures.json')));
 const auth=JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR,'admin.json')));await page.context().addCookies(auth.cookies);
 // Frozen auth is localhost scoped, so this probe deliberately uses that exact origin.
 const response=await page.goto(`http://localhost:9106/g/${f.groupSlug}/r/${f.recipeSlug}`);expect(response.headers()['x-wf6-frontend']).toBe('react');await expect(page.getByRole('heading',{name:'E2E Pancakes',exact:true})).toBeVisible({timeout:5000});await expect(page.getByText('2 cups e2e flour',{exact:true})).toBeVisible();
});

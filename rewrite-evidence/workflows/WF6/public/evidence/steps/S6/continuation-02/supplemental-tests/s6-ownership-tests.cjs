const fs=require('node:fs');const path=require('node:path');const {test,expect}=require(process.env.WF6_PLAYWRIGHT_MODULE);
const {ROUTES}=require(process.env.WF6_FROZEN_ROUTES);
test('all frozen route ownership and comparable seeded input',async({request})=>{
 const f=JSON.parse(fs.readFileSync(path.join(process.env.WF6_AUTH_DIR,'fixtures.json')));const map=await(await request.get('/_wf6/route-map.json')).json();expect(map.takeoverEnabled).toBe(true);
 const {ownsReact}=await import(process.env.WF6_ROUTE_POLICY);const rows=[];
 for(const route of ROUTES){const url=route.path(f);const r=await request.get(url,{headers:{accept:'text/html'}});const expected=ownsReact(url,map)?'react':'vue';expect(r.headers()['x-wf6-frontend'],route.file).toBe(expected);expect(r.headers()['x-wf6-build']).toBe(expected==='react'?process.env.WF6_REACT_BUILD_HASH:process.env.WF6_BUILD_HASH);rows.push({file:route.file,url,status:r.status(),frontend:expected,build:r.headers()['x-wf6-build'],scope:expected==='react'?'Configured-group read-only pilot':'Vue retained; not React migration',businessAssertion:'Separate frozen strict suite; ownership response alone is not business acceptance'});}
 expect(rows.length).toBe(66);fs.writeFileSync(process.env.WF6_ROUTE_OWNERSHIP,JSON.stringify({rows,fixtureIds:f,disclaimer:'HTTP document ownership inventory supplements unchanged frozen business assertions.'},null,2));
});

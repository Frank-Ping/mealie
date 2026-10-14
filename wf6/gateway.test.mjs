import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createGateway } from './gateway.mjs';

test('all-Vue transport preserves bodies/status/cookies and separates asset misses from history', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wf6-S2-gateway-test-'));
  await writeFile(path.join(root, 'index.html'), '<html>Vue fixture</html>');
  await mkdir(path.join(root, '_nuxt'));
  await writeFile(path.join(root, '_nuxt/app.js'), 'window.fixture=true;');
  const routeMapPath = path.join(root, 'map.json');
  await writeFile(routeMapPath, JSON.stringify({ takeoverEnabled: false, groupSlug: null, defaultFrontend: 'vue', activeReactRoutes: [], explicitVueQuery: { name: 'wf6', value: 'vue' }, backendPrefixes: ['/api', '/media'] }));
  const backend = http.createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    res.writeHead(418, { 'content-type': 'application/json', 'set-cookie': ['a=fixture; HttpOnly; Path=/', 'b=fixture; SameSite=Lax; Path=/'] });
    res.end(JSON.stringify({ method: req.method, url: req.url, body: Buffer.concat(chunks).toString(), cookie: req.headers.cookie }));
  });
  await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
  const gateway = await createGateway({ vueDir: root, backendOrigin: `http://127.0.0.1:${backend.address().port}`, buildHash: 'fixture-only', routeMapPath });
  await new Promise(resolve => gateway.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${gateway.address().port}`;
  try {
    const proxy = await fetch(origin + '/api/echo?q=preserved', { method: 'POST', body: 'original-body', headers: { cookie: 'a=fixture', 'content-type': 'text/plain' } });
    assert.equal(proxy.status, 418); assert.equal(proxy.headers.getSetCookie().length, 2);
    assert.deepEqual(await proxy.json(), { method: 'POST', url: '/api/echo?q=preserved', body: 'original-body', cookie: 'a=fixture' });
    const media = await fetch(origin + '/media/picture'); assert.equal(media.status, 418);
    const document = await fetch(origin + '/g/group/r/recipe?wf6=vue', { headers: { accept: 'text/html' } });
    assert.equal(document.status, 200); assert.equal(document.headers.get('x-wf6-frontend'), 'vue'); assert.equal(await document.text(), '<html>Vue fixture</html>');
    const asset = await fetch(origin + '/_nuxt/app.js'); assert.match(asset.headers.get('content-type'), /javascript/); assert.equal(asset.headers.get('x-wf6-build'), 'fixture-only');
    for (const missing of ['/_nuxt/missing.js', '/missing.css', '/missing.png', '/_nuxt/missing', '/.env']) {
      const response = await fetch(origin + missing, { headers: { accept: 'text/html' } }); assert.equal(response.status, 404); assert.doesNotMatch(await response.text(), /Vue fixture/);
    }
    const head = await fetch(origin + '/login', { method: 'HEAD', headers: { accept: 'text/html' } }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
    const map = await (await fetch(origin + '/_wf6/route-map.json')).json(); assert.equal(map.takeoverEnabled, false); assert.deepEqual(map.activeReactRoutes, []);
    const bad = await fetch(origin + '/%ZZ'); assert.equal(bad.status, 400);
    console.log(JSON.stringify({ mock_transport_checks: 'PASS', scope: 'Local protocol fixture only, separate from real backend/browser acceptance' }));
  } finally {
    await Promise.all([new Promise(resolve => gateway.close(resolve)), new Promise(resolve => backend.close(resolve))]);
  }
});

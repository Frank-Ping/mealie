import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hopHeaders = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade']);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };

function cleanHeaders(headers) {
  const excluded = new Set([...hopHeaders, ...String(headers.connection ?? '').split(',').map(x => x.trim().toLowerCase())]);
  return Object.fromEntries(Object.entries(headers).filter(([key]) => !excluded.has(key.toLowerCase())));
}

export async function createGateway({ vueDir, backendOrigin, routeMapPath = fileURLToPath(new URL('./route-map.json', import.meta.url)), buildHash }) {
  const root = await realpath(vueDir);
  const map = JSON.parse(await readFile(routeMapPath, 'utf8'));
  if (map.takeoverEnabled || map.defaultFrontend !== 'vue' || map.activeReactRoutes.length) throw new Error('S2 supports verified all-Vue mode only. React takeover must remain disabled.');
  const backend = new URL(backendOrigin);
  if (backend.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(backend.hostname)) throw new Error('Backend must be an isolated loopback HTTP origin.');
  if (!buildHash) throw new Error('A verified build hash is required.');
  await stat(path.join(root, 'index.html'));
  const server = http.createServer(async (req, res) => {
    const fail = (code, message) => { if (!res.headersSent) res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }); res.end(message); };
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some(x => x === '..')) return fail(400, 'Invalid path');
      if (map.backendPrefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))) {
        const headers = cleanHeaders(req.headers);
        headers.host = backend.host;
        headers['x-forwarded-host'] = req.headers.host;
        headers['x-forwarded-proto'] = 'http';
        const upstream = http.request(new URL(url.pathname + url.search, backend), { method: req.method, headers }, reply => {
          const responseHeaders = cleanHeaders(reply.headers);
          // Keep each Set-Cookie header separate; do not join or log credentials.
          if (responseHeaders.location?.startsWith(backend.origin)) responseHeaders.location = responseHeaders.location.replace(backend.origin, `http://${req.headers.host}`);
          responseHeaders['x-wf6-backend'] = 'isolated';
          res.writeHead(reply.statusCode, responseHeaders);
          reply.on('error', () => res.destroy());
          reply.pipe(res);
        });
        upstream.setTimeout(30000, () => upstream.destroy(new Error('Upstream timeout')));
        upstream.on('error', () => fail(502, 'Isolated backend unavailable'));
        req.on('aborted', () => upstream.destroy());
        req.pipe(upstream);
        return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) return fail(405, 'Method not allowed');
      if (pathname === '/_wf6/route-map.json') {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
        return res.end(req.method === 'HEAD' ? undefined : JSON.stringify(map));
      }
      if (pathname.split('/').some(part => part.startsWith('.'))) return fail(404, 'Not found');
      let file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) && file !== root) return fail(400, 'Invalid path');
      let info = await stat(file).catch(() => null);
      if (info?.isDirectory()) { file = path.join(file, 'index.html'); info = await stat(file).catch(() => null); }
      if (!info?.isFile()) {
        // Missing assets are real 404s. Only document requests use history fallback.
        const asset = pathname.startsWith('/_nuxt/') || pathname.startsWith('/_wf6/') || Boolean(path.extname(pathname));
        if (asset || !String(req.headers.accept ?? '').includes('text/html')) return fail(404, 'Not found');
        file = path.join(root, 'index.html'); info = await stat(file);
      }
      const resolved = await realpath(file);
      if (!resolved.startsWith(root + path.sep)) return fail(404, 'Not found');
      const type = mime[path.extname(file)] ?? 'application/octet-stream';
      res.writeHead(200, { 'content-type': type, 'content-length': info.size, 'x-wf6-frontend': 'vue', 'x-wf6-build': buildHash,
        'cache-control': type.startsWith('text/html') ? 'no-store' : pathname.startsWith('/_nuxt/') ? 'public, max-age=31536000, immutable' : 'no-cache' });
      if (req.method === 'HEAD') return res.end();
      createReadStream(file).on('error', () => res.destroy()).pipe(res);
    } catch { fail(400, 'Invalid request'); }
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await createGateway({ vueDir: process.env.WF6_VUE_DIR, backendOrigin: process.env.WF6_BACKEND_ORIGIN,
    buildHash: process.env.WF6_BUILD_HASH, routeMapPath: process.env.WF6_ROUTE_MAP });
  server.listen(Number(process.env.WF6_PORT ?? 9106), '127.0.0.1', () => console.log(JSON.stringify({ event: 'gateway_ready', port: server.address().port, takeoverEnabled: false, buildHash: process.env.WF6_BUILD_HASH })));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
}

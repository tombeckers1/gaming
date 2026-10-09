// Rendert index.html headless (SwiftShader) und speichert PNG.
// node render.js [ss=2] [out=out/render.png]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = __dirname;
const SS = parseFloat(process.argv[2] || '2');
const OUT = process.argv[3] || path.join(ROOT, 'out', 'render_raw.png');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const srv = http.createServer((q, r) => {
  const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
});
srv.listen(0, async () => {
  const port = srv.address().port, t0 = Date.now();
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1312, height: 1200 } });
  pg.on('console', m => console.log('[page]', m.text()));
  pg.on('pageerror', e => console.log('[err]', e.message));
  await pg.goto(`http://127.0.0.1:${port}/index.html?ss=${SS}&headless=1${process.argv[4] ? "&" + process.argv[4] : ""}`, { waitUntil: "commit", timeout: 120000 });
  await pg.waitForFunction(() => window.__png || window.__fail, null, { timeout: 420000, polling: 1000 });
  const d = await pg.evaluate(() => window.__png || ('FAIL ' + window.__fail));
  if (d.startsWith('FAIL')) console.log(d); else fs.writeFileSync(OUT, Buffer.from(d.split(',')[1], 'base64'));
  console.log('fertig in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  await b.close(); srv.close();
});

/* Macht aus ../boellerbude.html eine offlinefähige App in ./app/.
   Holt three.js und die beiden Google-Schriften einmalig herunter und
   biegt die Verweise in der HTML auf lokale Dateien um.
   Läuft mit Node 18 oder neuer, braucht beim ersten Mal Internet. */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', 'boellerbude.html');
const APP = path.join(HERE, 'app');
const VENDOR = path.join(HERE, 'vendor');          // Cache, damit nur einmal geladen wird

const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Bungee&family=Barlow+Condensed:wght@500;600;700&display=swap';
/* Mit diesem User-Agent liefert Google woff2 aus. */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

async function cached(name, fetchIt) {
  const file = path.join(VENDOR, name);
  if (await exists(file)) return readFile(file);
  console.log('  lade', name);
  const buf = Buffer.from(await fetchIt());
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
  return buf;
}

const getBuf = async (url, headers = {}) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} bei ${url}`);
  return r.arrayBuffer();
};

async function main() {
  console.log('Böllerladen Simulator: App-Ordner bauen');
  if (!(await exists(SRC))) throw new Error(`nicht gefunden: ${SRC}`);
  let html = await readFile(SRC, 'utf8');

  await mkdir(path.join(APP, 'fonts'), { recursive: true });

  /* three.js */
  const three = await cached('three.min.js', () => getBuf(THREE_URL));
  await writeFile(path.join(APP, 'three.min.js'), three);

  /* Schriften: CSS holen, jede woff2 herunterladen, CSS auf lokale Pfade umbiegen */
  let css = (await cached('fonts.css', () => getBuf(FONT_CSS_URL))).toString('utf8');
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]))];
  console.log(`  ${urls.length} Schriftdateien`);
  let i = 0;
  for (const u of urls) {
    const name = `f${i++}${path.extname(new URL(u).pathname) || '.woff2'}`;
    const buf = await cached(path.join('fonts', name), () => getBuf(u));
    await writeFile(path.join(APP, 'fonts', name), buf);
    css = css.split(u).join(`fonts/${name}`);
  }
  await writeFile(path.join(APP, 'fonts.css'), css, 'utf8');

  /* HTML umbiegen */
  const before = html;
  html = html
    .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/,
             '<link href="fonts.css" rel="stylesheet">')
    .replace(/<script src="https:\/\/cdnjs\.cloudflare\.com[^"]*"><\/script>/,
             '<script src="three.min.js"></script>');

  if (html === before) throw new Error('Die Verweise in der HTML wurden nicht gefunden - bitte prepare.mjs anpassen.');
  if (/https:\/\/(cdnjs|fonts)\./.test(html)) throw new Error('Es sind noch externe Verweise in der HTML.');

  await writeFile(path.join(APP, 'index.html'), html, 'utf8');
  console.log('fertig:', path.relative(HERE, APP));
}

main().catch(e => { console.error('\nFEHLER:', e.message); process.exit(1); });

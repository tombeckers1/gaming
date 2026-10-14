/* Eiswuerfel raus und 1.4G nur auf Feuerwerkskartons (Tom, Gameplay-Vorfuehrung 07.10.):
   1. Eiswuerfel gibt es nirgends mehr: Katalog, Reihenfolge, Lizenzen, Warengruppen, Sparten -
      und ein alter Spielstand mit Eiswuerfeln im Regal, auf dem Boden und im Lager laedt ohne Fehler,
      die Ware ist zur aehnlichsten verbliebenen Sorte geworden.
   2. Das Gefahrgutzeichen (orange Raute 1.4G, UN 0336) steht auf Lieferkartons mit Feuerwerk
      (Kategorie F1/F2) und auf keinem anderen - gemessen an den Pixeln der Kartonbilder.
   3. Die Kartons sind nicht alle gleich (Klebeband, Pappton, Absender, Logo).
   Gegenprobe: Raute auf einen Essenskarton malen - dann schlaegt die Messung an.
   Braucht echtes three.js. Aufruf: node kartonlogik.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p = await b.newPage({viewport:{width:900,height:600}}); p.setDefaultTimeout(1800000);
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.goto('file://' + process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined', null, {timeout:300000});
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined', null, {timeout:300000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')", null, {timeout:300000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show', {state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const mangel = [];
  const pruef = (n, ok, was) => { if (!ok) mangel.push(n + ': ' + was); };

  const r = await p.evaluate(() => { const bb = window.__bb, P = bb.P, o = {};
    o.eis = !!P.eiswuerfel;
    o.inLiz = bb.LIZENZEN.filter(l => l.items.indexOf('eiswuerfel') >= 0).map(l => l.id);
    o.inOrder = bb.ORDER.indexOf('eiswuerfel') >= 0;
    o.inGruppe = Object.keys(bb.GRUPPE).filter(g => bb.GRUPPE[g].indexOf('eiswuerfel') >= 0);
    o.ersatz = bb.SORTE_NEU.eiswuerfel;
    o.ersatzOk = !!P[o.ersatz];
    /* Pixel der Kartonbilder */
    /* seit 14.10. (Karton-Atlas): Motiv je Sorte ueber bb.kartonBild (Zelle im Atlas), sonst wie frueher das Bild der Textur */
    const pix = t => { if (bb.kartonBild) { const b = bb.kartonBild(t); return b ? {d: b.data, W: b.width, H: b.height} : null; } const m = bb.kartonMat[t]; if (!m || !m.map) return null; const im = m.map.image; let d, W, H;
      if (im && im.data) { d = im.data; W = im.width; H = im.height; }
      else if (im && im.getContext) { W = im.width; H = im.height; d = im.getContext('2d').getImageData(0, 0, W, H).data; } else return null;
      return {d, W, H}; };
    /* nur das untere Drittel links (dort sitzt das Zeichen) - der Etikettkopf kann orange sein */
    const raute = x => { let n = 0; for (let i = 0; i < x.d.length; i += 4) if (Math.floor(i / 4 / x.W) > x.H * 0.55 && Math.floor(i / 4 / x.W) < x.H * 0.95 && (i / 4) % x.W < x.W * 0.45 && Math.abs(x.d[i] - 242) <= 6 && Math.abs(x.d[i + 1] - 138) <= 6 && Math.abs(x.d[i + 2] - 28) <= 8) n++; return n; };
    const sig = x => { let h = 0; for (let i = 0; i < x.d.length; i += 97) h = (h * 31 + x.d[i]) | 0; return h; };
    const F = [], N = [], sigs = new Set(); let ohne = 0; o.fehlerF = []; o.fehlerN = [];
    for (const t of bb.ORDER) { const x = pix(t); if (!x) { ohne++; continue; }
      const n = raute(x), fw = bb.P[t].cat === 1 || bb.P[t].cat === 2; sigs.add(sig(x));
      if (fw) { F.push(n); if (n < 800) o.fehlerF.push(t + ':' + n); } else { N.push(n); if (n > 40) o.fehlerN.push(t + ':' + n + ':' + (bb.P[t].sparte || '')); } }
    o.zahlF = F.length; o.zahlN = N.length; o.ohneBild = ohne; o.verschieden = sigs.size; o.gesamt = bb.ORDER.length;
    o.sparten = {}; for (const t of bb.ORDER) { const s = bb.sparteVon(t); o.sparten[s] = (o.sparten[s] || 0) + 1; }
    return o; });
  console.log('KARTON', JSON.stringify(Object.assign({}, r, {fehlerF: r.fehlerF.slice(0, 8), fehlerN: r.fehlerN.slice(0, 8)})));
  pruef('EIS_WEG', !r.eis && !r.inOrder && !r.inLiz.length && !r.inGruppe.length, 'Eiswuerfel noch da: ' + JSON.stringify({eis: r.eis, order: r.inOrder, liz: r.inLiz, gruppe: r.inGruppe}));
  pruef('EIS_ERSATZ', r.ersatzOk, 'kein Ersatz fuer Eiswuerfel in alten Staenden: ' + r.ersatz);
  pruef('RAUTE_FEUERWERK', r.zahlF > 100 && !r.fehlerF.length, 'Feuerwerkskartons ohne Raute: ' + r.fehlerF.slice(0, 8).join(', '));
  pruef('RAUTE_NUR_FEUERWERK', r.zahlN > 50 && !r.fehlerN.length, 'Raute auf Karton ohne Feuerwerk: ' + r.fehlerN.slice(0, 8).join(', '));
  pruef('VARIANTEN', r.verschieden > r.gesamt * 0.5, 'Kartons zu gleichfoermig: ' + r.verschieden + ' verschiedene von ' + r.gesamt);
  pruef('BILDER', r.ohneBild === 0, r.ohneBild + ' Kartons ohne lesbares Bild');

  /* Gegenprobe: Raute auf einen Essenskarton malen */
  const gp = await p.evaluate(() => { const bb = window.__bb, t = bb.ORDER.find(x => bb.P[x].sparte === 'essen'), im = bb.kartonBild ? bb.kartonBild(t) : bb.kartonMat[t].map.image;
    let cv = im; if (im.data) { cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; cv.getContext('2d').putImageData(im, 0, 0); }
    const g = cv.getContext('2d'); g.fillStyle = '#f28a1c'; const f = cv.width / 256; g.fillRect(40 * f, 180 * f, 60 * f, 60 * f);
    const d = g.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.floor(i / 4 / cv.width) > cv.height * 0.55 && Math.abs(d[i] - 242) <= 6 && Math.abs(d[i + 1] - 138) <= 6 && Math.abs(d[i + 2] - 28) <= 8) n++;
    return {t, n}; });
  console.log('GEGENPROBE', JSON.stringify(gp));
  pruef('GEGENPROBE', gp.n > 40, 'die Messung erkennt eine aufgemalte Raute nicht: ' + JSON.stringify(gp));

  /* 4. (14.10., Karton-Atlas) Der gezeichnete Karton zeigt SEINE Zelle: Vorderseite eines Kartons frontal
     (Orthokamera, nur Umgebungslicht) rendern und auf einem 12x8-Raster mit dem Zellbild vergleichen
     (Korrelation der Helligkeit). Gegenprobe: Zellwahl auf die ganze Atlasseite stellen -> Korrelation bricht ein. */
  const at = await p.evaluate(() => { const bb = window.__bb; if (!bb.kartonBild) return {ohne: true};
    const T = window.THREE, R = bb.renderer, sc = new T.Scene(), cam = new T.OrthographicCamera(-0.3, 0.3, 0.2, -0.2, 0.1, 5);
    cam.position.set(0, 0, 1); cam.lookAt(0, 0, 0); sc.add(new T.AmbientLight(0xffffff, 1));
    const rt = new T.WebGLRenderTarget(120, 80), buf = new Uint8Array(120 * 80 * 4);
    const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const raster = (get, W, H) => { const o = []; for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 12; gx++) { let s = 0, n = 0;
      for (let y = Math.floor(gy * H / 8); y < Math.floor((gy + 1) * H / 8); y++) for (let x = Math.floor(gx * W / 12); x < Math.floor((gx + 1) * W / 12); x++) { s += get(x, y); n++; } o.push(s / n); } return o; };
    const korr = (a, b) => { const n = a.length, ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n; let sab = 0, saa = 0, sbb = 0;
      for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb || 1); };
    const zeichne = t => { const m = new T.Mesh(bb.kartonGeo || new T.BoxGeometry(0.6, 0.4, 0.45), bb.kartonMat[t]); sc.add(m);
      const alt = R.getRenderTarget(); R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(); R.render(sc, cam); R.readRenderTargetPixels(rt, 0, 0, 120, 80, buf); R.setRenderTarget(alt); sc.remove(m);
      return raster((x, y) => lum(buf, ((79 - y) * 120 + x) * 4), 120, 80); };
    const T0 = bb.ORDER.filter(t => bb.P[t] && bb.P[t].dims), pick = [0, 17, 41, 77, 123, 200].map(i => T0[i % T0.length]), o = {werte: [], gegen: []};
    for (const t of pick) { const b2 = bb.kartonBild(t); const soll = raster((x, y) => lum(b2.data, (y * b2.width + x) * 4), b2.width, b2.height);
      o.werte.push(+korr(zeichne(t), soll).toFixed(3));
      const z = bb.kartonMat[t].userData.atlasZ.value, alt = z.clone(); z.set(0, 0, 1, 1); o.gegen.push(+korr(zeichne(t), soll).toFixed(3)); z.copy(alt); }
    rt.dispose(); return o; });
  console.log('ATLAS', JSON.stringify(at));
  if (!at.ohne) { pruef('ATLAS_ZELLE', at.werte.every(k => k > 0.85), 'gezeichneter Karton passt nicht zu seiner Zelle: ' + JSON.stringify(at.werte));
    pruef('ATLAS_GEGENPROBE', at.gegen.every(k => k < 0.6), 'Messung erkennt eine falsche Zellwahl nicht: ' + JSON.stringify(at.gegen)); }

  /* alter Spielstand mit Eiswuerfeln */
  const rohAlt = await p.evaluate(() => { const bb = window.__bb, S = bb.S; S.level = 30; S.money = 9e6; S.lic = bb.LIZENZEN.map(l => l.id);
    ['shop_halb', 'lager', 'lager_nord'].forEach(id => bb.testKauf(id));
    for (let i = 0; i < 2; i++) bb.regalStellen('kuehl'); bb.regalStellen('rack');
    const lv = bb.allLevels()[0]; if (lv) bb.addToLevel(lv, 'bier', 1);
    bb.spawnFloorBox('bier', 6, {x: -3, y: 0.2, z: 3, ry: 0}, 1);
    bb.save(); let raw = localStorage.getItem('boellerbude_v3');
    raw = raw.replace(/"bier"/g, '"eiswuerfel"').replace(/"type":"cola"/g, '"type":"eiswuerfel"'); return raw; });
  /* Beim Neuladen schreibt das Spiel seinen Stand (visibilitychange) - der alte Stand wird deshalb vor dem Spielskript eingesetzt */
  await p.addInitScript(a => { try { if (window.name !== a.tok) { window.name = a.tok; localStorage.setItem('boellerbude_v3', a.raw); } } catch (e) {} }, {raw: rohAlt, tok: 'altstand' + Date.now()});
  await p.reload(); await p.waitForFunction('window.__bb!==undefined', null, {timeout:300000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')", null, {timeout:300000});
  await p.click('#startBtns button'); await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const al = await p.evaluate(() => { const bb = window.__bb, S = bb.S, o = {}; bb.run(2, 0.05);
    const typen = new Set(); bb.allLevels().forEach(l => { if (l.type) typen.add(l.type); }); bb.floorBoxes.forEach(f => typen.add(f.type)); bb.racks.forEach(r => r.slots.forEach(s => { if (s.box) typen.add(s.box.type); }));
    o.typen = [...typen]; o.alleDa = o.typen.every(t => !!bb.P[t]); o.eis = typen.has('eiswuerfel'); o.preise = Object.keys(S.prices).filter(t => !bb.P[t]).length;
    return o; });
  console.log('ALTSTAND', JSON.stringify(al));
  pruef('ALTSTAND', al.alleDa && !al.eis && al.preise === 0, 'alter Spielstand mit Eiswuerfeln: ' + JSON.stringify(al));
  pruef('FEHLER', !errs.length, errs.slice(0, 5).join(' | '));
  console.log(mangel.length ? 'MANGEL:\n' + mangel.join('\n') : 'ALLES OK');
  await b.close();
  process.exit(mangel.length ? 1 : 0);
})();

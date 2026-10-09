/* Versandecke an Tor V1 (Tom, 07.10.; neu 09.10., versand-sb-0910.md):
   - die Station steht 1 m weiter Richtung Lager, fest eingebaut; vor dem Rolltor V1 liegt eine
     abgesperrte Ladezone (gelbe Gitter links und rechts, dazwischen die offene Seite der Box)
   - TORSPERRE: weder Spieler noch Wegraster (Mitarbeiter, Kunden) kommen vor V1 - Gegenprobe:
     ohne die Absperrung kaeme man hin
   - 1/2/3 Paletten, hoch gestapelt (1,75 m), unter Greifer, Tor und LKW-Dach
   - DDL NUR AUF ANRUF: ein ganzer Tag ohne Anruf - kein LKW, nichts abgeholt (auch nicht zum
     Tagesende); Gegenprobe: Anruf am Wandtelefon - Pauschale gebucht, LKW kommt, der DDL-Fahrer
     laedt alle Paletten (in jeder Stufe der Fahrer), Tor zu, LKW weg; die Pauschale steht in der
     Tagesabrechnung und in der Onlineshop-Statistik
   - waehrend der LKW steht, ist die Box belegt (der Kran setzt nichts ab)
   - BOX VOLL: alle Paletten voll - das Paket wartet am Bandende, Meldung, Handy-Badge; nach der
     Abholung landet es
   - alter Spielstand: verschobene Station zurueck an ihren Platz, 2/4/6 Paletten werden 1/2/3
   Braucht echtes three.js (real.html). Aufruf: node versandtor.js real.html [bilder-ordner] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async()=>{
  const bilder = process.argv[3] || null; if (bilder) fs.mkdirSync(bilder, {recursive:true});
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p = await b.newPage({viewport:{width:900,height:600}}); p.setDefaultTimeout(1800000);
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 160)); });
  await p.goto('file://' + process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined', null, {timeout:300000});
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined', null, {timeout:300000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')", null, {timeout:300000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show', {state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const mangel = [];
  const pruef = (n, ok, was) => { if (!ok) mangel.push(n + ': ' + was); };
  const bild = async name => { if (!bilder) return; const d = await p.evaluate(() => __bb.shot()); fs.writeFileSync(bilder + '/' + name + '.jpg', Buffer.from(d.split(',')[1], 'base64')); };

  await p.evaluate(() => {
    const bb = window.__bb, S = bb.S;
    S.level = 40; S.money = 9e6; S.day = 5; S.lic = bb.LIZENZEN.map(l => l.id);
    ['shop_halb','lager','lager_nord','lager_gross','lager_sued','lager_sued2','packstation','onlineshop'].forEach(id => bb.testKauf(id)); S.up.onlineshop = true;
    window.__fuell = (n, gr) => { for (let i = 0; i < n; i++) { S.paketGr.push(gr || 1); S.paketP.push(-1); } S.pakete = S.paketGr.length; bb.syncPakete(); };
    window.__hoehe = pal => { const o = bb.vsPalObj[pal.id]; if (!o || !o.pk) return 0; o.pk.geometry.computeBoundingBox(); return o.pk.geometry.boundingBox.max.y; };
    /* Ladezone in der Welt (zwischen Rueckwand und Boxfront, Westzaun bis Ostwand) */
    window.__lz = () => { const g = bb.packTisch, L = bb.LADEZONE, s = Math.sin(g.rotation.y), c = Math.cos(g.rotation.y);
      const P = (x, z) => ({x: g.position.x + x * c + z * s, z: g.position.z - x * s + z * c}); const a = P(L.x0, L.z0), q = P(L.x1, L.z1);
      return {x0: Math.min(a.x, q.x), x1: Math.max(a.x, q.x), z0: Math.min(a.z, q.z), z1: Math.max(a.z, q.z)}; };
    /* Spieler Schritt fuer Schritt mit Kollision auf ein Ziel zu */
    window.__geh = (zx, zz, n) => { for (let i = 0; i < (n || 500); i++) { const q = bb.playerPos(), dx = zx - q.x, dz = zz - q.z, d = Math.hypot(dx, dz); if (d < 0.05) break;
      bb.schiebe(q.x + dx / d * Math.min(0.05, d), q.z + dz / d * Math.min(0.05, d)); } return bb.playerPos(); };
    /* von wo aus kommt man ueber das Wegraster in die Ladezone? Flutung ab der Lagertuer */
    window.__navLz = () => { bb.NAV.dirty = true; bb.navBuild(); const N = bb.NAV, z = window.__lz();
      const start = bb.navIdx(-12.0, -15.0); const W = N.w, H = N.h, seen = new Uint8Array(N.g.length); const Q = [start]; seen[start] = 1; let h = 0, drin = 0;
      while (h < Q.length) { const k = Q[h++], i = k % W, r = (k - i) / W; const x = N.x0 + (i + 0.5) * N.s, zz = N.z0 + (r + 0.5) * N.s;
        if (x > z.x0 + 0.35 && x < z.x1 - 0.35 && zz > z.z0 + 0.35 && zz < z.z1 - 0.35) drin++;
        for (const n of [i > 0 ? k - 1 : -1, i < W - 1 ? k + 1 : -1, r > 0 ? k - W : -1, r < H - 1 ? k + W : -1]) if (n >= 0 && !N.g[n] && !seen[n]) { seen[n] = 1; Q.push(n); } }
      return {start: start >= 0 && !N.g[start], erreicht: Q.length, drin}; };
  });

  /* ---------- 1. Lage der Versandecke ---------- */
  const l = await p.evaluate(() => { const bb = window.__bb, o = {}, g = bb.packTisch;
    o.pos = [g.position.x, g.position.z, g.rotation.y]; o.home = bb.PACK_HOME; o.fest = !!bb.packMov.fest;
    const c = bb.palZentrumWelt(0), f = bb.vfRueck(c.x, c.z); o.cell0 = {lx: +f.lx.toFixed(2), lz: +f.lz.toFixed(2)};
    const cs = bb.packMov.cols || []; o.cols = cs.length; o.aus = cs.filter(c => c.minX < -19.92 || c.maxX > -8.08 || c.minZ < -29.92 || c.maxZ > -22.88).length;
    o.torZu = bb.colliders.some(c => c.minX <= bb.V1.x - 1 && c.maxX >= bb.V1.x + 1 && c.minZ < bb.V1.wz && c.maxZ > bb.V1.wz);
    o.lz = window.__lz(); o.hits = bb.vsPalHits().map(h => h.userData.kind);
    return o; });
  console.log('LAGE', JSON.stringify(l));
  pruef('STATION_FEST', l.fest && Math.abs(l.pos[0] - l.home.x) < 0.01 && Math.abs(l.pos[1] - l.home.z) < 0.01 && l.pos[1] > -27 && l.pos[1] < -25.5, 'Station nicht fest an ihrem Platz: ' + JSON.stringify(l.pos));
  pruef('BOX_AM_TOR', Math.abs(l.cell0.lx - 3.1) < 0.1 && Math.abs(l.cell0.lz - 0.45) < 0.1, 'vorderste Palette nicht vor V1: ' + JSON.stringify(l.cell0));
  pruef('NUR_SUED3', l.aus === 0 && l.cols > 8, l.aus + ' von ' + l.cols + ' Kollisionsflaechen der Station ausserhalb von Sued 3');
  pruef('LADEZONE', l.lz.z0 < -29.8 && l.lz.z1 > -28 && l.lz.x0 < -11.9 + 0.2 && l.lz.x1 > -8.3, 'Ladezone vor V1 fehlt oder zu klein: ' + JSON.stringify(l.lz));
  pruef('TOR_ZU', l.torZu, 'V1 ist zu, aber ohne Kollision');
  pruef('TELEFON', l.hits.length === 1 && l.hits[0] === 'ddltel', 'statt Paletten-Trefferflaechen nur das Wandtelefon erwartet: ' + JSON.stringify(l.hits));

  /* ---------- 2. Torsperre: niemand vor V1 (Spieler und Wegraster), Gegenprobe ohne Absperrung ---------- */
  const ts = await p.evaluate(() => { const bb = window.__bb, o = {}, lz = window.__lz(), mitte = {x: (lz.x0 + lz.x1) / 2, z: (lz.z0 + lz.z1) / 2};
    const drin = q => q.x > lz.x0 + 0.3 && q.x < lz.x1 - 0.3 && q.z > lz.z0 + 0.3 && q.z < lz.z1 - 0.3;
    const starts = [[-14.0, -28.8], [-15.5, -29.4], [-13.0, -25.2], [-9.0, -24.5], [-8.6, -26.5], [-12.6, -29.5], [-11.0, -23.5]];
    const lauf = () => starts.map(([x, z]) => { bb.setView(x, z, 0, 0); bb.schiebe(x, z); const e1 = window.__geh(mitte.x, mitte.z, 600); const e2 = window.__geh(bb.V1.x, bb.V1.wz + 0.3, 400); return drin(e1) || drin(e2); });
    o.spieler = lauf(); o.nav = window.__navLz();
    /* Gegenprobe: Absperrung (Zaeune der Ladezone) heraus */
    const g = bb.packTisch, s = Math.sin(g.rotation.y), c = Math.cos(g.rotation.y);
    const R = bb.ladezoneRechtecke().map(r => { const a = {x: g.position.x + r.x0 * c + r.z0 * s, z: g.position.z - r.x0 * s + r.z0 * c}, q = {x: g.position.x + r.x1 * c + r.z1 * s, z: g.position.z - r.x1 * s + r.z1 * c}; return {minX: Math.min(a.x, q.x), maxX: Math.max(a.x, q.x), minZ: Math.min(a.z, q.z), maxZ: Math.max(a.z, q.z)}; });
    const weg = bb.colliders.filter(cl => cl.ref === bb.packMov && R.some(r => Math.abs(r.minX - cl.minX) < 0.01 && Math.abs(r.minZ - cl.minZ) < 0.01 && Math.abs(r.maxX - cl.maxX) < 0.01));
    o.zaunCols = weg.length; weg.forEach(cl => bb.colliders.splice(bb.colliders.indexOf(cl), 1));
    o.gegenSpieler = lauf(); o.gegenNav = window.__navLz();
    weg.forEach(cl => bb.colliders.push(cl)); bb.NAV.dirty = true;
    o.wieder = window.__navLz();
    return o; });
  console.log('TORSPERRE', JSON.stringify(ts));
  pruef('TORSPERRE_SPIELER', ts.spieler.every(x => !x), 'der Spieler kommt vor das Rolltor V1: ' + JSON.stringify(ts.spieler));
  pruef('TORSPERRE_WEGRASTER', ts.nav.start && ts.nav.erreicht > 200 && ts.nav.drin === 0, 'Mitarbeiter/Kunden kaemen ueber das Wegraster vor V1: ' + JSON.stringify(ts.nav));
  pruef('TORSPERRE_GEGENPROBE', ts.zaunCols >= 3 && ts.gegenSpieler.some(x => x) && ts.gegenNav.drin > 0 && ts.wieder.drin === 0, 'Gegenprobe ohne Absperrung schlaegt nicht an (Test taugt nicht): ' + JSON.stringify({cols: ts.zaunCols, sp: ts.gegenSpieler, nav: ts.gegenNav, wieder: ts.wieder}));

  for (const st of [1, 2, 3]) {
    /* ---------- 3. hoher Stapel je Stufe ---------- */
    const h = await p.evaluate(st => { const bb = window.__bb, S = bb.S, o = {st};
      if (st > 1) bb.testKauf('packstation' + st);
      bb.ddlAbholung();
      o.stufe = bb.packStufe(); o.plaetze = bb.palPlaetze(); o.pal = bb.vsPalZelle().length;
      window.__fuell(96 * o.plaetze, 1);
      const pals = bb.vsPalZelle();
      o.proPal = pals.map(pp => bb.vsPalZahl(pp)); o.hoehen = pals.map(pp => +window.__hoehe(pp).toFixed(3));
      const L = bb.vsStapelLage(); o.max = Math.max(...L.map(e => e.y + 0.14)); o.laderaum = bb.LR.h;
      o.portal = bb.packTeile.portal.bruecke.visible;
      return o; }, st);
    console.log('STAPEL', JSON.stringify(h));
    pruef('PAL_ANZAHL' + st, h.pal === st && h.plaetze === st, 'Paletten in der Box (soll ' + st + '): ' + JSON.stringify({pal: h.pal, plaetze: h.plaetze}));
    pruef('KRAN' + st, h.portal, 'Kran fehlt in Stufe ' + st);
    pruef('STAPEL_HOCH' + st, h.hoehen.every(x => x > 1.5) && h.proPal.every(n => n >= 90), 'Stapel nicht hoch genug: ' + JSON.stringify({hoehen: h.hoehen, n: h.proPal}));
    pruef('STAPEL_PASST' + st, h.hoehen.every(x => x <= 0.144 + 1.75 + 0.005) && h.max < 2.0 && 0.09 + h.max < h.laderaum - 0.5, 'Stapel zu hoch fuer Greifer/LKW: ' + JSON.stringify({max: h.max, hoehen: h.hoehen}));

    /* ---------- 4. DDL nur auf Anruf: ein ganzer Tag ohne Anruf, dann Anruf (Gegenprobe) ---------- */
    const d = await p.evaluate(st => { const bb = window.__bb, S = bb.S, o = {st};
      bb.ddlAbholung(); window.__fuell(40, 1); window.__fuell(4, 3);
      o.vorher = bb.vsGelandet(); S.paketeVortag = 0;
      bb.phase = 'open'; bb.clock = 600; let lkw = 0;
      for (let i = 0; i < 400; i++) { bb.run(1, 0.1); if (bb.VT.state || bb.DDL.warte) lkw++; if (bb.phase === 'after') break; }
      /* Ladenschluss, Kunden weg, Tagesabschluss */
      bb.clock = 1320; bb.phase = 'after'; bb.run(5, 0.1); if (bb.VT.state || bb.DDL.warte) lkw++;
      const rep0 = S.rep; bb.endDay(); o.nachTag = bb.vsGelandet(); o.lkwOhneRuf = lkw; o.rows = document.getElementById('sRows').textContent;
      if (window.__bb.summaryOpen !== false) { const btn = document.getElementById('sBtn'); if (btn && btn.onclick) btn.onclick(); }
      /* zweiter Tag ohne Anruf: Pakete warten seit gestern - das kostet Ruf */
      bb.phase = 'after'; bb.clock = 1320; const rep1 = S.rep; bb.endDay(); o.repStrafe = +(rep1 - S.rep).toFixed(2); { const btn = document.getElementById('sBtn'); if (btn && btn.onclick) btn.onclick(); }
      void rep0;
      /* Gegenprobe: Anruf am Wandtelefon */
      bb.phase = 'open'; bb.clock = 700; bb.newDayStats && 0;
      const geld = S.money, ddl0 = bb.DS.ddl || 0; o.prompt = bb.ddlTelPrompt();
      o.gerufen = bb.tuAktion('ddltel', null) === undefined ? bb.DDL.warte : bb.DDL.warte;
      o.pauschale = +(geld - S.money).toFixed(2); o.dsDdl = +((bb.DS.ddl || 0) - ddl0).toFixed(2); o.soll = bb.DDL_PAUSCHALE;
      let n = 0, fig = false, belegt = false, kranImDock = 0; const z0 = bb.vsGelandet();
      while (!bb.VT.state && n++ < 2000) bb.run(0.1, 0.05);
      o.anfahrtS = +(n * 0.1).toFixed(1);
      /* waehrend der LKW steht: ein Paket aufs Band - der Kran darf es nicht absetzen */
      n = 0; while (bb.VT.state !== 'docked' && n++ < 2000) bb.run(0.1, 0.05);
      o.docked = bb.VT.state;
      n = 0; while ((bb.VT.state || bb.ddlLaeuft()) && n++ < 30000) { bb.run(0.1, 0.05); if (bb.LD.ph !== 'idle') { fig = fig || (bb.LD.fig && bb.LD.fig.visible); }
        if (bb.boxBelegt()) { belegt = true; if (bb.vsPortal.phase !== 'ruhe' && bb.vsPortal.phase !== 'saugen') kranImDock++; } }
      o.fig = fig; o.belegt = belegt; o.kranImDock = kranImDock; o.nachAbholung = bb.vsGelandet(); o.z0 = z0; o.weg = !bb.VT.state; o.tor = bb.vdIstOffen();
      o.paletten = S.paletten.map(q => q.ort).join('');
      bb.clock = 1320; bb.phase = 'after'; bb.endDay(); o.rows2 = document.getElementById('sRows').textContent;
      const L = S.onlineLog || []; o.log = L.length ? L[L.length - 1] : null;
      { const btn = document.getElementById('sBtn'); if (btn && btn.onclick) btn.onclick(); }
      return o; }, st);
    console.log('ANRUF', JSON.stringify(Object.assign({}, d, {rows: undefined, rows2: (d.rows2 || '').slice(0, 400)})));
    pruef('NUR_AUF_ANRUF' + st, d.lkwOhneRuf === 0 && d.nachTag === d.vorher && d.vorher >= 44, 'DDL kam ohne Anruf oder der Tagesabschluss holte ab: ' + JSON.stringify({lkw: d.lkwOhneRuf, vor: d.vorher, nach: d.nachTag}));
    pruef('LIEFERZEIT' + st, d.repStrafe > 0, 'Pakete seit gestern kosten keinen Ruf: ' + d.repStrafe);
    pruef('ANRUF' + st, d.prompt && d.prompt.a && d.gerufen && Math.abs(d.pauschale - d.soll) < 0.01 && Math.abs(d.dsDdl - d.soll) < 0.01, 'Anruf bucht die Pauschale nicht: ' + JSON.stringify({prompt: d.prompt, g: d.gerufen, p: d.pauschale, ds: d.dsDdl}));
    pruef('ANFAHRT' + st, d.anfahrtS >= 10 && d.anfahrtS <= 40 && d.docked === 'docked', 'DDL kommt nicht nach kurzer Zeit: ' + JSON.stringify({s: d.anfahrtS, dock: d.docked}));
    pruef('FAHRER' + st, d.fig, 'der DDL-Fahrer laedt nicht selbst (Stufe ' + st + ')');
    pruef('BOX_BELEGT' + st, d.belegt && d.kranImDock === 0, 'waehrend der LKW steht, arbeitet der Kran: ' + d.kranImDock);
    pruef('ABGEHOLT' + st, d.weg && !d.tor && d.nachAbholung === 0 && /^z+$/.test(d.paletten), 'LKW faehrt nicht ab oder Pakete bleiben: ' + JSON.stringify({weg: d.weg, tor: d.tor, nach: d.nachAbholung, pal: d.paletten}));
    pruef('ABRECHNUNG' + st, /DDL-Abholung \(1×/.test(d.rows2 || '') && d.log && Math.abs(d.log.ddl - d.soll) < 0.01 && d.log.ddlN === 1, 'Pauschale fehlt in Tagesabrechnung oder Statistik: ' + JSON.stringify({log: d.log}));
    await bild('stufe' + st + '-nach-abholung');
  }

  /* ---------- 5. Box voll: Paket wartet am Bandende, Meldung, nach der Abholung landet es ---------- */
  const bv = await p.evaluate(() => { const bb = window.__bb, S = bb.S, o = {};
    bb.ddlAbholung(); window.__fuell(bb.palPlaetze() * 2, 6);  /* riesige Pakete: 8 je Palette */
    while (bb.vsPalZiel(6)) window.__fuell(1, 6);
    o.voll0 = bb.vsGelandet();
    /* ein Paket am Tisch fertig machen und aufs Band */
    const x = bb.vsNeueBestellung(true); x.gr = 6; S.bestellungen.push(x); S.offen = S.bestellungen.length;
    bb.vmStand(0); bb.VM_IDS.forEach(id => { S.vm[0][id] = bb.VM[id].kap; });
    bb.phase = 'open'; bb.clock = 800;
    const m = bb.vsPaketZu(6); bb.packTisch.add(m); S.paketGr.push(6); S.paketP.push(-1); S.pakete = S.paketGr.length; bb.vsBahn.push({m, gr: 6, pp: 0, phase: 'warten', t: 0, x: bb.VS_PP[0].x});
    bb.run(40, 0.05);
    o.band = bb.vsBahn.length; o.voll = bb.DDL.voll; o.toast = bb.toastLast; o.badge = (() => { bb.openHandy(); const t = document.querySelector('#hInhalt [data-app="online"] em'); const r = t && t.textContent; bb.closeHandy(false); return r; })();
    o.stand = bb.ddlStand(); o.schild = bb.ddlTelPrompt().t;
    bb.ddlRufen(); let n = 0; while ((bb.VT.state || bb.ddlLaeuft()) && n++ < 30000) bb.run(0.1, 0.05);
    bb.run(20, 0.05);
    o.bandNach = bb.vsBahn.length; o.gelandetNach = bb.vsGelandet(); o.vollNach = bb.DDL.voll;
    return o; });
  console.log('BOXVOLL', JSON.stringify(bv));
  pruef('BOX_VOLL', bv.band === 1 && bv.voll && /voll/i.test(bv.toast || '') && bv.badge === '!' && bv.stand.voll, 'volle Box wird nicht gemeldet oder das Paket landet trotzdem: ' + JSON.stringify(bv));
  pruef('BOX_VOLL_ABHOLUNG', bv.bandNach === 0 && bv.gelandetNach === 1 && !bv.vollNach, 'nach der Abholung landet das wartende Paket nicht: ' + JSON.stringify({band: bv.bandNach, gel: bv.gelandetNach, voll: bv.vollNach}));

  /* ---------- 6. alter Spielstand: Station woanders, 6 Paletten -> fester Platz, 3 Paletten ---------- */
  const rohAlt = await p.evaluate(() => { const bb = window.__bb, S = bb.S; bb.ddlAbholung(); S.money = 1000;
    bb.save(); const d = JSON.parse(localStorage.getItem('boellerbude_v3'));
    d.pack = {x: -18.0, z: -24.6, ry: 0}; d.paketGr = [1, 1, 3, 1, 1]; d.pakete = 5;
    d.paletten = [0, 1, 2, 3, 4, 5].map(i => ({id: i + 1, ort: 'z', idx: i})); d.paketP = [1, 2, 5, 6, 6]; d.palNr = 6;
    d.versandCfg = {kosten: 4.9, frei: 0}; d.money = 1000;
    return JSON.stringify(d); });
  await p.addInitScript(a => { try { if (window.name !== a.tok) { window.name = a.tok; localStorage.setItem('boellerbude_v3', a.raw); } } catch (e) {} }, {raw: rohAlt, tok: 'alt' + Date.now()});
  await p.reload(); await p.waitForFunction('window.__bb!==undefined', null, {timeout:300000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')", null, {timeout:300000});
  await p.click('#startBtns button'); await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const al = await p.evaluate(() => { const bb = window.__bb, S = bb.S, g = bb.packTisch; bb.run(1, 0.05);
    const c = bb.vsCfg();
    return {pos: [+g.position.x.toFixed(2), +g.position.z.toFixed(2)], home: bb.PACK_HOME, pak: S.paketGr.length, pal: bb.vsPalZelle().length, auf: bb.vsPalZelle().reduce((a, q) => a + bb.vsPalZahl(q), 0), cfg: {nie: c.nie, frei: c.frei}}; });
  console.log('ALT', JSON.stringify(al));
  pruef('ALT_STATION', Math.abs(al.pos[0] - al.home.x) < 0.02 && Math.abs(al.pos[1] - al.home.z) < 0.02, 'alte, verschobene Station steht nicht am festen Platz: ' + JSON.stringify(al.pos));
  pruef('ALT_PALETTEN', al.pal === 3 && al.pak === 5 && al.auf === 5, 'alte 6 Paletten nicht sauber auf 3 umgestellt oder Pakete weg: ' + JSON.stringify(al));
  pruef('ALT_VERSANDFREI', al.cfg.nie === true, 'alter Stand "frei 0" (hiess: nie versandfrei) falsch uebernommen: ' + JSON.stringify(al.cfg));

  await bild('ecke-tag');
  console.log('ERRORS', errs.length ? errs.join('\n') : 'keine');
  pruef('FEHLER', !errs.length, errs.slice(0, 5).join(' | '));
  console.log(mangel.length ? 'MANGEL:\n' + mangel.join('\n') : 'ALLES OK');
  await b.close();
  process.exit(mangel.length || errs.length ? 1 : 0);
})();

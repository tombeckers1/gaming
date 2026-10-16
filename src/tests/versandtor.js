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
   - DDL PER HANDY: Onlineshop-App, Knopf "DDL rufen" bucht dieselbe Pauschale; ist DDL unterwegs,
     ist der Knopf weg (gleiche Regel wie am Telefon)
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
      bb.ddlAbholung(); window.__fuell(40, 1); window.__fuell(4, 3); S.rep = 60;
      o.vorher = bb.vsGelandet(); S.paketeVortag = 0;
      bb.phase = 'open'; bb.clock = 600; let lkw = 0;
      for (let i = 0; i < 400; i++) { bb.run(1, 0.1); if (bb.VT.state || bb.DDL.warte) lkw++; if (bb.phase === 'after') break; }
      /* Ladenschluss, Kunden weg, Tagesabschluss */
      bb.clock = 1320; bb.phase = 'after'; bb.run(5, 0.1); if (bb.VT.state || bb.DDL.warte) lkw++;
      const rep0 = S.rep; bb.endDay(); o.nachTag = bb.vsGelandet(); o.lkwOhneRuf = lkw; o.rows = document.getElementById('sRows').textContent;
      if (window.__bb.summaryOpen !== false) { const btn = document.getElementById('sBtn'); if (btn && btn.onclick) btn.onclick(); }
      /* zweiter Tag ohne Anruf: Pakete warten seit gestern - das kostet Ruf */
      /* Ruf vor der Messung auf 60 (13.10.): die Kunden des Testtages finden leere Regale (rep -0,4 je
         verpasstem Wunsch) und druecken den Ruf je nach Zufall bis auf 0 - am Boden (clamp 0..100) kann die
         Lieferzeit-Strafe nichts mehr abziehen, der Test war dann zufaellig rot. Erwartet wird genau die
         Strafe aus 16-day.js: min(3, 0,06 je wartendem Paket); kein Tagesereignis (Pruefung +3 Ruf) dazwischen. */
      bb.phase = 'after'; bb.clock = 1320; S.rep = 60; S.ev = null; const rep1 = S.rep, wart = Math.min(S.paketeVortag | 0, bb.vsGelandet()); bb.endDay(); o.repStrafe = +(rep1 - S.rep).toFixed(2); o.repSoll = Math.min(3, Math.round(0.06 * wart * 100) / 100); o.wartend = wart; { const btn = document.getElementById('sBtn'); if (btn && btn.onclick) btn.onclick(); }
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
      /* Ablauf des Fahrers (15.10.): Phasenfolge, Auftauchen nur aus der Kabine, Gabel fluchtet, Hub, Tempo, keine Durchdringung */
      const ab = {ph: [], torSichtbar: 0, ersteLage: null, hubMax: 0, fluchtMax: 0, winkelMax: 0, wandMax: 0, ueberMax: 0, vMax: 0, vRueck: 0, last: null};
      const rah = (g) => { const w = new THREE.Vector3(); g.getWorldPosition(w); const f = bb.vfRueck(w.x, w.z), ry = g.rotation.y; return {lx: f.lx, lz: f.lz, y: w.y, ry}; };
      n = 0; while ((bb.VT.state || bb.ddlLaeuft()) && n++ < 30000) { bb.run(0.1, 0.05); if (bb.LD.ph !== 'idle') { fig = fig || (bb.LD.fig && bb.LD.fig.visible); }
        if (bb.boxBelegt()) { belegt = true; if (bb.vsPortal.phase !== 'ruhe' && bb.vsPortal.phase !== 'saugen') kranImDock++; }
        const LD = bb.LD; if (ab.ph[ab.ph.length - 1] !== LD.ph) ab.ph.push(LD.ph);
        if (bb.VT.state === 'torauf' && LD.fig && LD.fig.visible) ab.torSichtbar++;
        if (!ab.ersteLage && LD.fig && LD.fig.visible) ab.ersteLage = {ph: LD.ph, fx: LD.fx, fz: LD.fz};
        if (LD.ph !== 'idle' && ab.last) { const v = Math.hypot(LD.jx - ab.last.jx, LD.jz - ab.last.jz) / 0.1; ab.vMax = Math.max(ab.vMax, v);
          if (LD.ph === 'zieh' || LD.ph === 'leer') ab.vRueck = Math.max(ab.vRueck, v); }
        ab.last = {jx: LD.jx, jz: LD.jz};
        if (LD.pal) { const o2 = bb.vsPalObj[LD.pal.id]; if (o2) { const r = rah(o2.g), d = [Math.cos(LD.psi), Math.sin(LD.psi)], fl = bb.ldBoden ? bb.ldBoden(LD.jx) : 0;
          if (LD.ph === 'rein' || LD.ph === 'zieh' || LD.ph === 'wende2') ab.hubMax = Math.max(ab.hubMax, r.y - fl);
          /* Gabel steckt in der Palette: Mitte 0,575 vor dem Fuss, Palettenlaenge in Gabelrichtung */
          ab.fluchtMax = Math.max(ab.fluchtMax, Math.hypot(r.lx - (LD.jx + d[0] * 0.575), r.lz - (LD.jz + d[1] * 0.575)));
          const ax = [-Math.sin(r.ry), -Math.cos(r.ry)]; ab.winkelMax = Math.max(ab.winkelMax, Math.abs(ax[0] * d[1] - ax[1] * d[0]));
          const cs = []; for (const a of [-0.6, 0.6]) for (const c of [-0.4, 0.4]) cs.push([r.lx + ax[0] * a - ax[1] * c, r.lz + ax[1] * a + ax[0] * c]);
          for (const [x, z] of cs) { if (x < 0 && Math.abs(z) > 1.47) ab.wandMax = Math.max(ab.wandMax, Math.abs(z) - 1.47); if (x > -0.1 && x < 0.3 && Math.abs(z) > 1.6) ab.wandMax = Math.max(ab.wandMax, Math.abs(z) - 1.6); if (x < -9.3) ab.wandMax = Math.max(ab.wandMax, -9.3 - x); }
          for (const q of S.paletten) { if (q.ort !== 'l') continue; const oq = bb.vsPalObj[q.id]; if (!oq) continue; const rq = rah(oq.g);
            const sx = Math.abs(r.lx - rq.lx), sz = Math.abs(r.lz - rq.lz); if (Math.abs(Math.sin(r.ry)) > 0.97 && sx < 1.2 && sz < 0.8) ab.ueberMax = Math.max(ab.ueberMax, Math.min(1.2 - sx, 0.8 - sz)); } } } }
      o.ab = ab; o.fig = fig; o.belegt = belegt; o.kranImDock = kranImDock; o.nachAbholung = bb.vsGelandet(); o.z0 = z0; o.weg = !bb.VT.state; o.tor = bb.vdIstOffen();
      o.paletten = S.paletten.map(q => q.ort).join('');
      bb.clock = 1320; bb.phase = 'after'; bb.endDay(); o.rows2 = document.getElementById('sRows').textContent;
      const L = S.onlineLog || []; o.log = L.length ? L[L.length - 1] : null;
      { const btn = document.getElementById('sBtn'); if (btn && btn.onclick) btn.onclick(); }
      return o; }, st);
    console.log('ANRUF', JSON.stringify(Object.assign({}, d, {rows: undefined, rows2: (d.rows2 || '').slice(0, 400)})));
    pruef('NUR_AUF_ANRUF' + st, d.lkwOhneRuf === 0 && d.nachTag === d.vorher && d.vorher >= 44, 'DDL kam ohne Anruf oder der Tagesabschluss holte ab: ' + JSON.stringify({lkw: d.lkwOhneRuf, vor: d.vorher, nach: d.nachTag}));
    pruef('LIEFERZEIT' + st, d.wartend >= 44 && d.repStrafe >= d.repSoll - 0.005 && d.repSoll > 0, 'Pakete seit gestern kosten keinen (vollen) Ruf: ' + JSON.stringify({strafe: d.repStrafe, soll: d.repSoll, wartend: d.wartend}));
    pruef('ANRUF' + st, d.prompt && d.prompt.a && d.gerufen && Math.abs(d.pauschale - d.soll) < 0.01 && Math.abs(d.dsDdl - d.soll) < 0.01, 'Anruf bucht die Pauschale nicht: ' + JSON.stringify({prompt: d.prompt, g: d.gerufen, p: d.pauschale, ds: d.dsDdl}));
    pruef('ANFAHRT' + st, d.anfahrtS >= 10 && d.anfahrtS <= 40 && d.docked === 'docked', 'DDL kommt nicht nach kurzer Zeit: ' + JSON.stringify({s: d.anfahrtS, dock: d.docked}));
    pruef('FAHRER' + st, d.fig, 'der DDL-Fahrer laedt nicht selbst (Stufe ' + st + ')');
    { const ab = d.ab, reihe = ['tuer', 'aus', 'greif', 'hin', 'pick', 'heben', 'zieh', 'wende2', 'rein', 'senken', 'leer'];
      const pos = reihe.map(x => ab.ph.indexOf(x));
      pruef('ABLAUF' + st, pos.every((x, i) => x >= 0 && (i === 0 || x > pos[i - 1])) && ab.ph.includes('park') && ab.ph.includes('heim'), 'Ablauf Tuer-Hubwagen-schieben-heben-ziehen-wenden-schieben-senken-ziehen-parken fehlt: ' + ab.ph.join(','));
      pruef('FAHRER_AUS_KABINE' + st, ab.torSichtbar === 0 && ab.ersteLage && ab.ersteLage.ph === 'tuer' && ab.ersteLage.fx < -9.4, 'Fahrer taucht auf, statt aus dem Fuehrerhaus zu kommen: ' + JSON.stringify({tor: ab.torSichtbar, erste: ab.ersteLage}));
      pruef('PALETTE_HEBT' + st, ab.hubMax > 0.06 && ab.hubMax < 0.11, 'Palette hebt sich nicht sichtbar um 5-10 cm: ' + ab.hubMax.toFixed(3));
      pruef('GABEL_FLUCHTET' + st, ab.fluchtMax < 0.02 && ab.winkelMax < 0.02, 'Gabel und Palette fluchten nicht: ' + JSON.stringify({mitte: +ab.fluchtMax.toFixed(3), winkel: +ab.winkelMax.toFixed(3)}));
      pruef('KEINE_DURCHDRINGUNG' + st, (ab.wandMax || 0) < 0.03 && ab.ueberMax < 0.03, 'Palette dringt in Wand/LKW/Palette: ' + JSON.stringify({wand: ab.wandMax, ueber: ab.ueberMax}));
      pruef('TEMPO' + st, ab.vMax <= 1.5 && ab.vMax >= 0.7 && ab.vRueck <= 1.3, 'Hubwagen nicht ca. 1 m/s: ' + JSON.stringify({max: +ab.vMax.toFixed(2), rueck: +ab.vRueck.toFixed(2)})); }
    pruef('BOX_BELEGT' + st, d.belegt && d.kranImDock === 0, 'waehrend der LKW steht, arbeitet der Kran: ' + d.kranImDock);
    pruef('ABGEHOLT' + st, d.weg && !d.tor && d.nachAbholung === 0 && /^z+$/.test(d.paletten), 'LKW faehrt nicht ab oder Pakete bleiben: ' + JSON.stringify({weg: d.weg, tor: d.tor, nach: d.nachAbholung, pal: d.paletten}));
    pruef('ABRECHNUNG' + st, /DDL-Abholung \(1×/.test(d.rows2 || '') && d.log && Math.abs(d.log.ddl - d.soll) < 0.01 && d.log.ddlN === 1, 'Pauschale fehlt in Tagesabrechnung oder Statistik: ' + JSON.stringify({log: d.log}));
    await bild('stufe' + st + '-nach-abholung');
  }

  /* ---------- 4b. Ladeboden liegt ueber der Hofplatte, Hofschrift nicht im Bereich des LKW (15.10.) ---------- */
  const lb = await p.evaluate(() => { const bb = window.__bb, o = {};
    bb.ddlAbholung(); window.__fuell(40, 1); bb.ddlRufen(); let n = 0; while (bb.VT.state !== 'docked' && n++ < 4000) bb.run(0.1, 0.05);
    const raum = bb.VT.raum; let boden = null; raum.traverse(m => { if (m.isMesh && m.geometry && m.geometry.parameters && Math.abs(m.geometry.parameters.width - bb.LR.len) < 0.01 && Math.abs(m.geometry.parameters.height - bb.LR.w) < 0.01 && m.position.y < 0.5) boden = m; });  /* Ladeboden, nicht die Decke */
    o.bodenY = boden ? boden.position.y : null; let platte = null, schrift = null;
    bb.VD.g.traverse(m => { if (m.isMesh && m.geometry && m.geometry.parameters) { const q = m.geometry.parameters; if (m.geometry.type === 'PlaneGeometry' && Math.abs(q.width - (bb.V1_HOF.x1 - bb.V1_HOF.x0)) < 0.01) platte = m; if (m.geometry.type === 'PlaneGeometry' && Math.abs(q.width - 4.6) < 0.01 && Math.abs(q.height - 1.3) < 0.01) schrift = m; } });
    o.platteY = platte ? platte.position.y : null; /* Schrift aus bk.bodenmarkierung (Einheit 16.10.): Lage steckt in der Geometrie, nicht in position */ if (schrift) { schrift.geometry.computeBoundingBox(); } o.schriftZ = schrift ? schrift.position.z + (schrift.geometry.boundingBox.min.z + schrift.geometry.boundingBox.max.z) / 2 : null; o.schriftHalb = 0.65; o.lkwEnde = bb.V1.rz - bb.LR.len - 2.7;
    o.tuer = !!(raum.userData && raum.userData.tuer);
    /* Gabel zeigt zum Tor, wenn der Hubwagen steht (Stellung an der Wand): Gabelspitze liegt weiter im LKW als der Fuss? Nein - Gabel zum Tor = +lx */
    { const J = bb.LD.jack.g, v = new THREE.Vector3(0, 0.05, -1.1), w0 = new THREE.Vector3(); J.updateMatrixWorld(true); J.getWorldPosition(w0); const w1 = J.localToWorld(v.clone());
      const f0 = bb.vfRueck(w0.x, w0.z), f1 = bb.vfRueck(w1.x, w1.z); o.gabelDir = +(f1.lx - f0.lx).toFixed(2); o.psi0 = bb.LD.psi; }
    while ((bb.VT.state || bb.ddlLaeuft()) && n++ < 30000) bb.run(0.1, 0.05);
    return o; });
  console.log('LADEBODEN', JSON.stringify(lb));
  pruef('LADEBODEN', lb.bodenY !== null && lb.platteY !== null && lb.bodenY > lb.platteY + 0.01, 'Ladeboden liegt nicht ueber der Hofplatte: ' + JSON.stringify(lb));
  pruef('HOFSCHRIFT', lb.schriftZ !== null && lb.schriftZ + lb.schriftHalb < lb.lkwEnde, 'Hofschrift liegt im Bereich des LKW: ' + JSON.stringify(lb));
  pruef('GABEL_ZUM_TOR', lb.gabelDir > 1.0, 'der Hubwagen an der Wand steht nicht mit der Gabel zum Tor: ' + lb.gabelDir);
  pruef('DURCHSTIEG', lb.tuer, 'kein Durchstieg zum Fuehrerhaus im Laderaum');

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
    /* DDL per Handy (Tom 09.10.): Onlineshop-App, Knopf "DDL rufen" - gleiche Pauschale wie am Wandtelefon */
    { const geld = S.money, d0 = bb.DS.ddl || 0; bb.openHandy('online'); const k = document.querySelector('#hApp [data-a="ddlruf"]');
      o.hKnopf = !!k; if (k) k.click(); o.hWarte = bb.DDL.warte; o.hGeld = +(geld - S.money).toFixed(2); o.hDs = +((bb.DS.ddl || 0) - d0).toFixed(2);
      bb.renderHandy(); o.hKnopfNach = !!document.querySelector('#hApp [data-a="ddlruf"]'); bb.closeHandy(false); }
    let n = 0; while ((bb.VT.state || bb.ddlLaeuft()) && n++ < 30000) bb.run(0.1, 0.05);
    bb.run(20, 0.05);
    o.bandNach = bb.vsBahn.length; o.gelandetNach = bb.vsGelandet(); o.vollNach = bb.DDL.voll;
    return o; });
  console.log('BOXVOLL', JSON.stringify(bv));
  pruef('BOX_VOLL', bv.band === 1 && bv.voll && /voll/i.test(bv.toast || '') && bv.badge === '!' && bv.stand.voll, 'volle Box wird nicht gemeldet oder das Paket landet trotzdem: ' + JSON.stringify(bv));
  pruef('HANDY_RUF', bv.hKnopf && bv.hWarte && Math.abs(bv.hGeld - bv.stand.pauschale) < 0.01 && Math.abs(bv.hDs - bv.stand.pauschale) < 0.01 && !bv.hKnopfNach, 'DDL per Handy nicht rufbar oder Pauschale/Regel falsch: ' + JSON.stringify({k: bv.hKnopf, w: bv.hWarte, g: bv.hGeld, ds: bv.hDs, nach: bv.hKnopfNach}));
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

/* Versandecke an Tor V1 (Tom, 07.10.: "Die Versandecke zieht ans hintere Ende von Lager Sued 3,
   Rolltor V1 mit eigenem Versandhof. Um 22 Uhr kommt der Paketdienst-LKW rueckwaerts an V1, Tor
   hoch, ein Mitarbeiter faehrt die Paletten mit dem Hubwagen in den LKW, Tor zu, LKW weg. Ab 18 Uhr
   darf der Spieler das selbst. Paletten hoeher stapeln."). Je Ausbaustufe gemessen:
   - die Station steht in Sued 3, die Box direkt an der Rueckwand vor V1
   - hoch gestapelte Paletten (>= 1,5 m) liegen unter Greifer, Tor und LKW-Dach
   - Hubwagen von Hand: aufnehmen, rueckwaerts durch das Tor in den LKW, abstellen - mehrfach, mit
     Gegenprobe (Tor zu = Palette kommt nicht durch; vor 18 Uhr = kein Aufnehmen)
   - 22 Uhr: LKW kommt von selbst, Mitarbeiter (Stufe 1) oder Roboter (ab Stufe 2) laedt, LKW faehrt ab
   - Tagesabschluss holt in jedem Fall alles; alter Spielstand zieht um
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

  /* Hilfen in der Seite */
  await p.evaluate(() => {
    const bb = window.__bb, S = bb.S;
    S.level = 40; S.money = 9e6; S.day = 5; S.lic = bb.LIZENZEN.map(l => l.id);
    ['shop_halb','lager','lager_nord','lager_gross','lager_sued','lager_sued2','packstation','onlineshop'].forEach(id => bb.testKauf(id)); S.up.onlineshop = true;
    window.__fuell = (n, gr) => { for (let i = 0; i < n; i++) { S.paketGr.push(gr || 1); S.paketP.push(-1); } S.pakete = S.paketGr.length; bb.syncPakete(); };
    /* Palette: Obergrenze der Pakete (Welt-y) */
    window.__hoehe = pal => { const o = bb.vsPalObj[pal.id]; if (!o || !o.pk) return 0; o.pk.geometry.computeBoundingBox(); return o.pk.geometry.boundingBox.max.y; };
    /* hinstellen: Bediener im Rahmen V1 bei (lx,lz), Blick in die Halle (+z) */
    window.__steh = (lx, lz) => { const w = bb.vf(lx, lz); bb.setView(w.x, w.z, Math.PI, 0); bb.schiebe(w.x, w.z); };
    /* ein Stueck rueckwaerts (zum LKW) fahren, mit Kollision wie im Spiel */
    window.__fahre = (zielLx, zielLz, maxN) => {
      let n = 0;
      while (n++ < (maxN || 600)) {
        const q = bb.playerPos(), f = bb.vfRueck(q.x, q.z);
        const dl = zielLx - f.lx, dz = zielLz - f.lz; if (Math.abs(dl) < 0.03 && Math.abs(dz) < 0.03) break;
        const sl = Math.max(-0.04, Math.min(0.04, dl)), sz = Math.max(-0.03, Math.min(0.03, dz));
        const w = bb.vf(f.lx + sl, f.lz + sz); bb.schiebe(w.x, w.z); bb.hubKollision(); bb.run(0.02, 0.02);
      }
      const q = bb.playerPos(); return bb.vfRueck(q.x, q.z);
    };
  });

  /* ---------- 1. Lage der Versandecke ---------- */
  const l = await p.evaluate(() => { const bb = window.__bb, o = {}, g = bb.packTisch;
    o.pos = [g.position.x, g.position.z, g.rotation.y]; o.home = bb.PACK_HOME;
    const c = bb.palZentrumWelt(0), f = bb.vfRueck(c.x, c.z); o.cell0 = {lx: +f.lx.toFixed(2), lz: +f.lz.toFixed(2)};
    /* alle Kollisionsrechtecke der Station liegen in Sued 3 */
    const cs = bb.packMov.cols || []; o.cols = cs.length; o.aus = cs.filter(c => c.minX < -19.9 || c.maxX > -8.1 || c.minZ < -29.9 || c.maxZ > -22.9).length;
    /* Tor V1: zu = Kollision, Hof da */
    o.torZu = bb.colliders.some(c => c.minX <= bb.V1.x - 1 && c.maxX >= bb.V1.x + 1 && c.minZ < bb.V1.wz && c.maxZ > bb.V1.wz);
    o.hof = bb.V1_HOF; o.hits = bb.vsPalHits().length;
    return o; });
  console.log('LAGE', JSON.stringify(l));
  pruef('STATION_HINTEN', Math.abs(l.pos[0] - l.home.x) < 0.01 && Math.abs(l.pos[1] - l.home.z) < 0.01 && l.pos[1] < -26, 'Station nicht am hinteren Ende von Sued 3: ' + JSON.stringify(l.pos));
  pruef('BOX_AM_TOR', Math.abs(l.cell0.lx - 0.9) < 0.1 && Math.abs(l.cell0.lz - 0.45) < 0.1, 'vorderste Palette nicht direkt vor V1: ' + JSON.stringify(l.cell0));
  pruef('NUR_SUED3', l.aus === 0 && l.cols > 5, l.aus + ' von ' + l.cols + ' Kollisionsflaechen der Station ausserhalb von Sued 3');
  pruef('TOR_ZU', l.torZu, 'V1 ist zu, aber ohne Kollision');

  const STUFEN = [1, 2, 3];
  for (const st of STUFEN) {
    /* ---------- 2. hoher Stapel ---------- */
    const h = await p.evaluate(st => { const bb = window.__bb, S = bb.S, o = {st};
      if (st > 1) bb.testKauf('packstation' + st);
      bb.ddlAbholung(); S.clock = 0;
      o.stufe = bb.packStufe(); o.plaetze = bb.palPlaetze(); o.pal = bb.vsPalZelle().length;
      const N = o.plaetze;
      /* alles voll: klein, gross, riesig gemischt */
      window.__fuell(96 * N, 1);
      const pals = bb.vsPalZelle();
      o.proPal = pals.map(pp => bb.vsPalZahl(pp));
      o.hoehen = pals.map(pp => +window.__hoehe(pp).toFixed(3));
      const L = bb.vsStapelLage(); o.max = Math.max(...L.map(e => e.y + 0.14));
      o.kap = [1, 3, 6].map(g => bb.vsKapazitaet(g));
      o.laderaum = bb.LR.h;
      return o; }, st);
    console.log('STAPEL', JSON.stringify(h));
    pruef('PAL_ANZAHL' + st, h.pal === [0, 2, 4, 6][st] && h.plaetze === h.pal, 'Paletten in der Box: ' + JSON.stringify({pal: h.pal, plaetze: h.plaetze}));
    pruef('STAPEL_HOCH' + st, h.hoehen.every(x => x > 1.5) && h.proPal.every(n => n >= 90), 'Stapel nicht hoch genug: ' + JSON.stringify({hoehen: h.hoehen, n: h.proPal}));
    pruef('STAPEL_PASST' + st, h.hoehen.every(x => x <= 0.144 + 1.75 + 0.005) && h.max < 2.0 && 0.09 + h.max < h.laderaum - 0.5, 'Stapel zu hoch fuer Greifer/LKW: ' + JSON.stringify({max: h.max, hoehen: h.hoehen}));

    /* ---------- 3. Hubwagen von Hand, mehrfach ---------- */
    const hw = await p.evaluate(async st => { const bb = window.__bb, S = bb.S, o = {st, runden: []};
      /* vor 18 Uhr: kein Aufnehmen */
      bb.clock = 1000;
      const p0 = bb.vsPalZelle()[0]; o.vor18 = bb.hubAufnehmenPruefen(p0);
      /* 22 Uhr: LKW kommt - fuer die Hand-Fahrt gerufen und der Fahrer wartet lange */
      bb.clock = 1320; bb.phase = 'after';
      bb.DDL.autoTag = -1; S.ddlTag = 0; bb.DDL.warte = false;
      bb.ddlRufen(); bb.DDL.ruf = true;
      let n = 0; while (bb.VT.state !== 'docked' && n++ < 3000) bb.run(0.2, 0.05);
      o.angedockt = bb.VT.state; o.tor = bb.vdIstOffen();
      bb.DDL.t = -1000;   /* der Fahrer greift nicht ein */
      const runden = Math.min(3, bb.vsPalZelle().length);
      for (let r = 0; r < runden; r++) {
        const R = {r};
        const pal = bb.vsPalZelle()[0]; R.pakete = bb.vsPalZahl(pal); R.hoeheVor = +window.__hoehe(pal).toFixed(2);
        window.__steh(-0.6, 0.45);
        R.pruef = bb.hubAufnehmenPruefen(pal);
        R.ok = bb.hubAktion({kind: 'palette', ref: {idx: pal.idx}});
        R.getragen = !!bb.HUB.pal;
        bb.run(0.8, 0.05);
        /* rueckwaerts durch das Tor, ins Fahrgasse, dann auf den Platz */
        const slot = bb.ddlSlot(S.paletten.filter(q => q.ort === 'l').length);
        const ziel = slot.lx - 1.3;
        const f1 = window.__fahre(-3.0, 0.45); R.amTor = +f1.lx.toFixed(2);
        const f2 = window.__fahre(ziel, slot.lz); R.imLkw = {lx: +f2.lx.toFixed(2), lz: +f2.lz.toFixed(2), ziel: +ziel.toFixed(2)};
        R.platz = bb.hubAbstellPlatz().text;
        R.abgestellt = bb.hubAktion(null);
        bb.run(0.3, 0.05);
        R.nachher = S.paletten.filter(q => q.ort === 'l').map(q => q.idx);
        /* Palette im Laderaum: innen, nicht in der Wand */
        const lp = S.paletten.filter(q => q.ort === 'l').pop(); const o2 = bb.vsPalObj[lp.id];
        const w = {x: o2.g.position.x, z: o2.g.position.z}, ff = bb.vfRueck(w.x, w.z);
        R.pal = {lx: +ff.lx.toFixed(2), lz: +ff.lz.toFixed(2), y: +o2.g.position.y.toFixed(2)};
        /* zurueck zum Tor fuer die naechste Runde (vorwaerts, ohne Palette) */
        window.__fahre(-0.6, 0.45); R.zurueck = !bb.HUB.pal;
        o.runden.push(R);
      }
      o.imLkw = S.paletten.filter(q => q.ort === 'l').length;
      o.kolls = bb.colliders.filter(c => c.ref === 'palette').length;
      return o; }, st);
    console.log('HUB', JSON.stringify(hw));
    pruef('VOR18_' + st, hw.vor18 && /18 Uhr/.test(hw.vor18), 'Aufnehmen vor 18 Uhr nicht gesperrt: ' + hw.vor18);
    pruef('DOCK_' + st, hw.angedockt === 'docked' && hw.tor, 'LKW nicht angedockt / Tor nicht offen: ' + hw.angedockt);
    hw.runden.forEach(R => {
      pruef('AUFNEHMEN_' + st + '_' + R.r, R.ok && R.getragen && !R.pruef, 'Palette nicht aufgenommen: ' + JSON.stringify(R));
      pruef('DURCH_TOR_' + st + '_' + R.r, R.amTor < -2.9, 'Palette kommt nicht durch das Tor in den LKW: lx ' + R.amTor);
      pruef('IM_LKW_' + st + '_' + R.r, Math.abs(R.imLkw.lx - R.imLkw.ziel) < 0.2 && Math.abs(R.imLkw.lz) < 1.1, 'Bediener erreicht den Platz im LKW nicht: ' + JSON.stringify(R.imLkw));
      pruef('ABSTELLEN_' + st + '_' + R.r, R.abgestellt && R.nachher.length === R.r + 1, 'Palette nicht im LKW abgestellt: ' + JSON.stringify(R));
      pruef('PALETTE_INNEN_' + st + '_' + R.r, R.pal.lx < -4 && R.pal.lx > -9.4 && Math.abs(R.pal.lz) < 1.3, 'Palette steht nicht im Laderaum: ' + JSON.stringify(R.pal));
      pruef('ZURUECK_' + st + '_' + R.r, R.zurueck, 'der Bediener kommt nicht zum Tor zurueck');
    });
    pruef('SCHLANGE_' + st, hw.imLkw === Math.min(3, hw.runden.length), 'falsche Zahl Paletten im LKW: ' + hw.imLkw);
    await bild('stufe' + st + '-lkw-beladen');

    /* ---------- 4. Abfahrt: Mitarbeiter/Roboter laedt den Rest, Tor zu, LKW weg ---------- */
    const ab = await p.evaluate(st => { const bb = window.__bb, S = bb.S, o = {st};
      bb.DDL.t = 0; bb.DDL.ruf = false;
      const vorher = S.paketGr.length; o.vorher = vorher; o.palVor = S.paletten.filter(q => q.ort === 'l').length;
      const zust = {}; let n = 0, agv = false, fig = false, torZu = false, weg = false;
      while (n++ < 12000) { bb.run(0.2, 0.05);
        zust[bb.VT.state || 'null'] = (zust[bb.VT.state || 'null'] || 0) + 1;
        if (bb.LD.ph !== 'idle') { agv = agv || bb.LD.agv; fig = fig || (bb.LD.fig && bb.LD.fig.visible); }
        if (!bb.VT.state && !bb.ddlLaeuft()) { weg = true; break; } }
      o.zeit = n * 0.2; o.zust = zust; o.weg = weg; o.agv = agv; o.fig = fig; o.tor = bb.vdIstOffen(); o.torT = +bb.VD.t.toFixed(2);
      o.nachher = S.paketGr.length; o.paletten = S.paletten.map(q => q.ort); o.ddl = S.stat.ddl || 0;
      o.torKoll = bb.colliders.some(c => c.minX <= bb.V1.x - 1 && c.maxX >= bb.V1.x + 1 && c.minZ < bb.V1.wz && c.maxZ > bb.V1.wz);
      return o; }, st);
    console.log('ABFAHRT', JSON.stringify(ab));
    pruef('ABFAHRT_' + st, ab.weg && ab.nachher === 0 && !ab.tor && ab.torKoll, 'LKW faehrt nicht ab oder Pakete bleiben: ' + JSON.stringify({weg: ab.weg, nachher: ab.nachher, tor: ab.tor, kolls: ab.torKoll}));
    pruef('LADER_' + st, st === 1 ? (ab.fig && !ab.agv) : ab.agv, 'Stufe ' + st + ': ' + (st === 1 ? 'Mitarbeiter fehlt' : 'Hubwagen-Roboter fehlt') + ' ' + JSON.stringify({fig: ab.fig, agv: ab.agv}));
    pruef('LKW_ZUSTAENDE_' + st, ['anfahrt', 'torauf', 'docked', 'flap', 'torzu', 'out'].every(z => true), '');
    pruef('PAL_NEU_' + st, ab.paletten.length === [0, 2, 4, 6][st] && ab.paletten.every(o => o === 'z'), 'nach der Abfahrt stehen nicht alle Paletten wieder in der Box: ' + JSON.stringify(ab.paletten));
  }

  /* ---------- 5. 22 Uhr automatisch, ohne Zutun ---------- */
  const au = await p.evaluate(() => { const bb = window.__bb, S = bb.S, o = {};
    bb.ddlAbholung(); S.day = 9; bb.phase = 'open'; bb.clock = 1200; window.__fuell(40, 1); window.__fuell(10, 3);
    o.vorher = S.paketGr.length;
    bb.run(2, 0.05); o.fruehLkw = !!bb.VT.state;
    bb.phase = 'closing'; bb.clock = 1320; bb.run(1, 0.05); o.kommt = !!bb.VT.state || bb.DDL.warte;
    let n = 0; while (bb.VT.state !== 'docked' && n++ < 4000) bb.run(0.2, 0.05); o.docked = bb.VT.state;
    n = 0; while ((bb.VT.state || bb.ddlLaeuft()) && n++ < 20000) bb.run(0.2, 0.05);
    o.nachher = S.paketGr.length; o.weg = !bb.VT.state; o.zeit = n * 0.2;
    return o; });
  console.log('AUTO22', JSON.stringify(au));
  pruef('NICHT_FRUEH', !au.fruehLkw, 'DDL kommt schon vor 22 Uhr von selbst');
  pruef('UM_22', au.kommt && au.docked === 'docked', 'DDL kommt um 22 Uhr nicht: ' + JSON.stringify(au));
  pruef('ALLES_ABGEHOLT', au.weg && au.nachher === 0, 'Pakete bleiben nach der Abfahrt: ' + JSON.stringify(au));

  /* ---------- 6. Tagesabschluss holt in jedem Fall ab ---------- */
  const ta = await p.evaluate(() => { const bb = window.__bb, S = bb.S, o = {};
    S.day = 11; bb.phase = 'open'; bb.clock = 1100; window.__fuell(30, 1);
    const p0 = bb.vsPalZelle()[0]; o.nimmt = bb.hubAufnehmen(p0); o.traegt = !!bb.HUB.pal;
    const n = bb.ddlAbholung(); o.abgeholt = n; o.rest = S.paketGr.length; o.traegtDanach = !!bb.HUB.pal; o.pal = S.paletten.map(q => q.ort).join('');
    return o; });
  console.log('TAGESENDE', JSON.stringify(ta));
  pruef('TAGESENDE', ta.abgeholt >= 30 && ta.rest === 0 && !ta.traegtDanach, 'Tagesabschluss holt nicht alles: ' + JSON.stringify(ta));

  /* ---------- 7. Gegenprobe: Tor zu - die Palette kommt nicht durch; Stapel zu hoch ---------- */
  const gp = await p.evaluate(() => { const bb = window.__bb, S = bb.S, o = {};
    bb.ddlAbholung(); S.day = 12; bb.phase = 'after'; bb.clock = 1320; window.__fuell(40, 1);
    /* Tor zu, kein LKW: Palette aufnehmen und durch die Wand fahren wollen */
    bb.vdOffen(false);
    window.__steh(-0.6, 0.45);
    const p0 = bb.vsPalZelle()[0]; bb.clock = 1200; o.nimmt = bb.hubAufnehmen(p0);
    bb.run(0.8, 0.05);
    /* gegen das geschlossene Tor: rueckwaerts auf lx -3 */
    const f = window.__fahre(-3.0, 0.45, 300); o.lxZu = +f.lx.toFixed(2);
    /* Hof und Tor ohne LKW: Bediener steht draussen im Hof? */
    bb.hubAktion(null); o.zurueck = S.paletten.some(q => q.ort === 'z' && q.idx === 0 && bb.vsPalZahl(q) > 0);
    return o; });
  console.log('GEGENPROBE', JSON.stringify(gp));
  pruef('GEGENPROBE_TOR_ZU', gp.nimmt && gp.lxZu > -1.0, 'bei geschlossenem Tor kam die Palette durch: lx ' + gp.lxZu);
  pruef('GEGENPROBE_ZURUECK', gp.zurueck, 'ohne LKW laesst sich die Palette nicht zurueckstellen');

  /* ---------- 8. alter Spielstand: Station ohne Sued 3 wird erstattet, mit Sued 3 zieht sie um ---------- */
  for (const mitHalle of [false, true]) {
    await p.evaluate(mh => { const bb = window.__bb, S = bb.S; bb.ddlAbholung(); S.money = 1000;
      bb.save(); const d = JSON.parse(localStorage.getItem('boellerbude_v3'));
      d.up.packstation = true; d.up.lager_sued2 = mh; d.staff = Object.assign({}, d.staff, {packer: true});
      d.pack = {x: -18.0, z: -8.6, ry: 0}; d.paketGr = [1, 1, 3]; d.pakete = 3; delete d.paletten; delete d.paketP; d.money = 1000;
      localStorage.setItem('boellerbude_v3', JSON.stringify(d)); }, mitHalle);
    await p.reload(); await p.waitForFunction('window.__bb!==undefined', null, {timeout:300000});
    await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')", null, {timeout:300000});
    await p.click('#startBtns button'); await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
    const al = await p.evaluate(() => { const bb = window.__bb, S = bb.S, g = bb.packTisch;
      bb.run(1, 0.05);
      return {money: Math.round(S.money), packstation: !!S.up.packstation, staffPacker: !!S.staff.packer, pos: [+g.position.x.toFixed(1), +g.position.z.toFixed(1)], rot: +g.rotation.y.toFixed(2),
        pak: S.paketGr.length, pal: S.paletten.length, proPal: S.paletten.map(q => bb.vsPalZahl(q))}; });
    console.log('ALT', mitHalle, JSON.stringify(al));
    if (!mitHalle) pruef('ALT_OHNE_HALLE', !al.packstation && !al.staffPacker && al.money >= 1000 + 6400 + 700 - 1 && al.pak === 0, 'alter Stand ohne Sued 3: nicht erstattet: ' + JSON.stringify(al));
    else pruef('ALT_UMZUG', al.packstation && al.pos[1] < -26 && Math.abs(al.rot - 3.14) < 0.02 && al.pak === 3 && al.proPal.reduce((a, c) => a + c, 0) === 3, 'alter Stand mit Halle: Station nicht am neuen Platz oder Pakete weg: ' + JSON.stringify(al));
  }

  await p.evaluate(() => { const bb = window.__bb, S = bb.S; window.__fuell = (n, gr) => { for (let i = 0; i < n; i++) { S.paketGr.push(gr || 1); S.paketP.push(-1); } S.pakete = S.paketGr.length; bb.syncPakete(); }; bb.ddlAbholung(); window.__fuell(60, 1); bb.clock = 780; bb.phase = 'open'; bb.vdOffen(false); });
  await bild('ecke-tag');
  console.log('ERRORS', errs.length ? errs.join('\n') : 'keine');
  console.log(mangel.length ? 'MANGEL:\n' + mangel.join('\n') : 'ALLES OK');
  pruef('FEHLER', !errs.length, errs.slice(0, 5).join(' | '));
  await b.close();
  process.exit(mangel.length || errs.length ? 1 : 0);
})();

/* Durchgang von Rolltor 1 in die Halle und zur Versandecke (Tom, Gameplay-Vorfuehrung 07.10.:
   "zwischen Packstation und Rolltor 1 kommt man nicht durch"). Vollausbau, alle Lagerregale
   gestellt, Packstation Stufe 3: von Rolltor 1 (Innenseite) muessen Spieler und Mitarbeiter
   - zum Platz vor dem ersten Packtisch kommen,
   - bis hinter in die Halle (Sued 3, Packmaterial-Regal, Box vor V1),
   - und in die Logistikhalle.
   Gelaufen wird wirklich: der Weg aus der Wegfindung, Schritt fuer Schritt mit der Kollision des Spielers.
   Gegenprobe: eine Wand quer durch die Halle - dann muss der Test anschlagen.
   Braucht echtes three.js. Aufruf: node durchgang.js real.html */
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
  await p.evaluate(() => { const bb = window.__bb, S = bb.S;
    S.level = 40; S.money = 9e7; S.lic = bb.LIZENZEN.map(l => l.id);
    ['shop_halb','lager','lager_nord','shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_sued2','lager_west','lager_west2','lager_west3','packstation','onlineshop','packstation2','packstation3'].forEach(id => bb.testKauf(id)); S.up.onlineshop = true;
    /* alle Lagerregale, die gestellt werden duerfen (wie in der Vorfuehrung) */
    for (const id of ['rschwer','rhoch','rack']) for (let i = 0; i < 12; i++) { if (!bb.regalStellen(id)) break; }
    window.__lauf = (von, ziel) => {
      bb.navBuild();
      const rt = bb.route({x: von.x, z: von.z}, {x: ziel.x, z: ziel.z});
      bb.setView(von.x, von.z, 0, 0); bb.schiebe(von.x, von.z);
      let n = 0, erreicht = false;
      for (const w of rt) { let k = 0; while (k++ < 400) { const q = bb.playerPos(), dx = w.x - q.x, dz = w.z - q.z, d = Math.hypot(dx, dz); if (d < 0.2) break; const s = Math.min(0.08, d); bb.schiebe(q.x + dx / d * s, q.z + dz / d * s); n++; } }
      const q = bb.playerPos(); erreicht = Math.hypot(q.x - ziel.x, q.z - ziel.z) < 0.7;
      return {punkte: rt.length, schritte: n, ende: [+q.x.toFixed(2), +q.z.toFixed(2)], erreicht};
    };
  });
  const ZIELE = {
    'Platz vor Packtisch 1': () => { const h = window.__bb.vsHeim({pp: 0}); return {x: h.x, z: h.z}; },
    'Sued 3 vorn': () => ({x: -12.5, z: -22.0}),
    /* 09.10. (Tom): vor V1 ist eine abgesperrte Ladezone - der Spieler kommt selbst bei offenem Tor NICHT in den Hof */
    'Hof vor Tor V1 (Tor auf, gesperrt)': () => { const bb = window.__bb; bb.vdOffen(true); bb.run(5, 0.1); const c = bb.vf(-0.8, 0.45); return {x: c.x, z: c.z}; },
    'Halle Sued 1': () => ({x: -14.0, z: -10.5}),
    'Halle Sued 2': () => ({x: -14.0, z: -19.0}),
    'Logistikhalle': () => ({x: -40.0, z: -21.0})
  };
  const R1 = {x: -19.0, z: -2.0};
  const erg = {};
  for (const name of Object.keys(ZIELE)) {
    const r = await p.evaluate(([n, f]) => { const bb = window.__bb; const z = eval('(' + f + ')')(); return Object.assign({z}, window.__lauf({x: -19.0, z: -2.0}, z)); }, [name, ZIELE[name].toString()]);
    erg[name] = r; console.log('LAUF', name, JSON.stringify(r));
    if (/gesperrt/.test(name)) pruef('SPERRE_V1', !r.erreicht, 'Spieler kommt durch die Ladezone vor V1 in den Hof: ' + JSON.stringify(r));
    else pruef('DURCH_' + name, r.erreicht, 'Spieler kommt von Rolltor 1 nicht bis "' + name + '": ' + JSON.stringify(r));
  }
  /* Mitarbeiter: Wegfindung (route) vom Tor zu den Plaetzen gibt es und endet am Ziel */
  const mit = await p.evaluate(() => { const bb = window.__bb, o = {};
    for (const id of ['packer', 'packer2', 'packer3']) { if (!bb.S.staff[id]) { bb.S.staff[id] = true; bb.hireStaff(id); } }
    for (const id of ['packer', 'packer2', 'packer3', 'auffueller']) { const w = bb.staff[id]; if (!w) continue;
      const h = bb.vsHeim({pp: ['packer','packer2','packer3'].indexOf(id)}); const rt = bb.route({x: -19.0, z: -2.0}, {x: h.x, z: h.z}); const e = rt[rt.length - 1];
      o[id] = {punkte: rt.length, ende: Math.hypot(e.x - h.x, e.z - h.z) < 0.8}; }
    o.rackR1Pack = bb.rackR1Pack(bb.NAV.g);
    return o; });
  console.log('MITARBEITER', JSON.stringify(mit));
  for (const id of ['packer', 'packer2', 'packer3']) pruef('WEG_' + id, mit[id] && mit[id].ende, id + ' findet keinen Weg zum Packplatz: ' + JSON.stringify(mit[id]));
  pruef('RACK_PRUEFUNG', mit.rackR1Pack, 'rackR1Pack meldet keinen Weg von Rolltor 1 zur Versandecke');
  /* Gegenprobe: eine Wand quer durch Sued 1 - jetzt kommt niemand mehr hinein */
  const gp = await p.evaluate(() => { const bb = window.__bb;
    const w = bb.colliders.push({minX: -19.95, maxX: -8.0, minZ: -11.0, maxZ: -10.8, ref: null}); bb.NAV.dirty = true; bb.navBuild();
    const h = bb.vsHeim({pp: 0}); const r = window.__lauf({x: -19.0, z: -2.0}, {x: h.x, z: h.z});
    bb.colliders.pop(); bb.NAV.dirty = true; bb.navBuild();
    return r; });
  console.log('GEGENPROBE', JSON.stringify(gp));
  pruef('GEGENPROBE', !gp.erreicht, 'mit Wand quer durch die Halle erreicht der Spieler die Versandecke trotzdem - der Test taugt nichts');
  pruef('FEHLER', !errs.length, errs.slice(0, 5).join(' | '));
  console.log(mangel.length ? 'MANGEL:\n' + mangel.join('\n') : 'ALLES OK');
  await b.close();
  process.exit(mangel.length ? 1 : 0);
})();

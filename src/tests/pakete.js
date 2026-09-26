/* Einrichtung wird geliefert (Tom, 26.09.): Regale, Kuehlschraenke und
   Kassen kommen als Paket - ohne Lager vor die Tuer -, werden am
   Stellplatz ausgepackt oder als Paket abgestellt (lagerbar). Pakete
   haben normale Kartongroesse. Die SB-Kassen am zweiten Eingang
   kommen nicht mehr mit der Tuer, sondern sind ein eigener Kauf. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=40; S.money=1e7;
    /* 1. Lieferung ohne Lager: Paket vor der Tuer, kein fertiges Regal */
    const vorRegale=bb.shelves.length;
    bb.orderRegal('standard'); bb.pendingListe().forEach(pd=>pd.t=0); bb.run(0.5,0.1);
    o.ohneLager={pakete:bb.einbauPakete.length,regale:bb.shelves.length-vorRegale,
      z:bb.einbauPakete.length?+bb.einbauPakete[0].mesh.position.z.toFixed(1):null};
    /* 2. Groessen */
    o.gross=Math.max(...Object.values(bb.PAKET_MASS).map(m=>Math.max(...m)));
    /* 3. Weit weg abstellen = lagern, am Stellplatz = aufbauen */
    /* ohne Paket vor der Tuer ein eigenes nehmen, damit die weiteren
       Schritte trotzdem gemessen werden */
    if(!bb.einbauPakete.length) bb.spawnPaket({regal:'standard'},{x:-3,z:7.5});
    const basis=bb.shelves.length;
    bb.paketAufheben(bb.einbauPakete[0]);
    o.getragen=JSON.stringify(S.carrying);
    bb.paketAblegen(S.carrying,{x:-15,z:-2});
    o.gelagert={pakete:bb.einbauPakete.length,regale:bb.shelves.length-basis,tragen:!!S.carrying};
    if(!bb.einbauPakete.length) bb.spawnPaket({regal:'standard'},{x:-15,z:-2});
    bb.paketAufheben(bb.einbauPakete[0]);
    const sl=bb.slotsOffen().filter(s=>(s.art||'wand')==='wand'&&!bb.shelves.some(h=>Math.abs(h.g.position.x-s.x)<0.05&&Math.abs(h.g.position.z-s.z)<0.05))[0];
    bb.paketAblegen(S.carrying,{x:sl.x+0.4,z:sl.z+0.6});
    o.aufgebaut={pakete:bb.einbauPakete.length,regale:bb.shelves.length-basis,tragen:!!S.carrying};
    /* 4. Zweiter Eingang ohne Kassen */
    ['shop_halb','lager','lager_nord','shop_gross','shop_ost','eingang2'].forEach(id=>bb.testKauf(id));
    const lanes2=()=>bb.sbLanes.map((l,i)=>l.up==='kasse3'?bb.sbNutzbar(i):null).filter(v=>v!==null);
    o.eingang2={kasse3:!!S.up.kasse3,nutzbar:lanes2().filter(Boolean).length,sichtbar:!!(bb.sb2G&&bb.sb2G.visible)};
    /* 5. Kassen kaufen: erst Paket, dann aufstellen */
    bb.buyUp('kasse3');
    o.bestellt={kasse3:!!S.up.kasse3,unterwegs:bb.pendingListe().filter(pd=>pd.einbau==='kasse3').length};
    S.carrying={einbau:'kasse3'}; const z=bb.EINBAU.kasse3.ziel();
    bb.paketAblegen(S.carrying,{x:z.x+1,z:z.z});
    o.aufgestellt={kasse3:!!S.up.kasse3,nutzbar:lanes2().filter(Boolean).length,sichtbar:!!(bb.sb2G&&bb.sb2G.visible)};
    return o; });
  console.log('PAKETE',JSON.stringify(r));
  pruef('VOR_DIE_TUER',r.ohneLager.pakete===1&&r.ohneLager.regale===0,'ohne Lager: '+JSON.stringify(r.ohneLager));
  pruef('GROESSE',r.gross<=1.3,'Paket bis '+r.gross+' m');
  pruef('LAGERN',r.gelagert.pakete===1&&r.gelagert.regale===0&&!r.gelagert.tragen,'weit weg abgestellt: '+JSON.stringify(r.gelagert));
  pruef('AUSPACKEN',r.aufgebaut.pakete===0&&r.aufgebaut.regale===1&&!r.aufgebaut.tragen,'am Stellplatz: '+JSON.stringify(r.aufgebaut));
  pruef('EINGANG2_OHNE_KASSEN',!r.eingang2.kasse3&&r.eingang2.nutzbar===0&&!r.eingang2.sichtbar,'Kassen kommen mit der Tuer: '+JSON.stringify(r.eingang2));
  pruef('KASSE_ALS_PAKET',!r.bestellt.kasse3&&r.bestellt.unterwegs===1,'Kauf stellt Kassen sofort auf: '+JSON.stringify(r.bestellt));
  pruef('KASSE_AUFSTELLEN',r.aufgestellt.kasse3&&r.aufgestellt.nutzbar===2&&r.aufgestellt.sichtbar,'Aufstellen: '+JSON.stringify(r.aufgestellt));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

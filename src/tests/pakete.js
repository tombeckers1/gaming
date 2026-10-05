/* Einrichtung wird geliefert (Tom, 26.09.): Regale, Kuehlschraenke und
   Kassen kommen als Paket - ohne Lager vor die Tuer -, werden am
   Stellplatz ausgepackt oder als Paket abgestellt (lagerbar). Pakete
   sind so gross wie ihr Inhalt (29.09.) - Pruefung der Groesse und der
   Moebeltaste in moebel.js. Die SB-Kassen kommen als Paket und werden
   an ihrem festen Platz ausgepackt; am zweiten Eingang gibt es seit
   05.10. keine (Tom: "machen keinen Sinn - die muessen weg"). */
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
    o.klein=Math.min(...Object.values(bb.PAKET_MASS).map(m=>Math.max(...m)));
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
    bb.setView(sl.x,sl.z+2.6,0,-0.1); bb.run(0.05,0.05);
    bb.paketAuspacken(); if(bb.grabbed){ bb.updateGrab(); bb.placeGrab(); }
    o.aufgebaut={pakete:bb.einbauPakete.length,regale:bb.shelves.length-basis,tragen:!!S.carrying};
    /* 4. Zweiter Eingang ohne Kassen - und keinen Ausbau mehr dafuer */
    ['shop_halb','lager','lager_nord','shop_gross','shop_ost','eingang2'].forEach(id=>bb.testKauf(id));
    o.eingang2={kasse3:bb.UPGRADES.some(u=>u.id==='kasse3')||!!bb.EINBAU.kasse3,nutzbar:bb.sbOffen(),spuren:bb.sbLanes.length};
    /* 5. SB-Kassen kaufen: erst Paket, dann an ihrem Platz aufstellen */
    bb.buyUp('kasse2');
    o.bestellt={kasse2:!!S.up.kasse2,unterwegs:bb.pendingListe().filter(pd=>pd.einbau==='kasse2').length};
    S.carrying={einbau:'kasse2'}; const z=bb.EINBAU.kasse2.ziel();
    bb.setView(z.x,z.z+1,0,-0.1); bb.run(0.05,0.05);
    bb.paketAuspacken(); if(bb.grabbed){ bb.updateGrab(); bb.placeGrab(); if(bb.grabbed) bb.cancelGrab(); }
    o.aufgestellt={kasse2:!!S.up.kasse2,nutzbar:bb.sbOffen(),tragen:!!S.carrying};
    return o; });
  console.log('PAKETE',JSON.stringify(r));
  pruef('VOR_DIE_TUER',r.ohneLager.pakete===1&&r.ohneLager.regale===0,'ohne Lager: '+JSON.stringify(r.ohneLager));
  pruef('GROESSE',r.gross<=3&&r.klein>=1,'Pakete '+r.klein+' bis '+r.gross+' m');
  pruef('LAGERN',r.gelagert.pakete===1&&r.gelagert.regale===0&&!r.gelagert.tragen,'weit weg abgestellt: '+JSON.stringify(r.gelagert));
  pruef('AUSPACKEN',r.aufgebaut.pakete===0&&r.aufgebaut.regale===1&&!r.aufgebaut.tragen,'am Stellplatz ausgepackt: '+JSON.stringify(r.aufgebaut));
  pruef('EINGANG2_OHNE_KASSEN',!r.eingang2.kasse3&&r.eingang2.nutzbar===0,'Kassen am zweiten Eingang: '+JSON.stringify(r.eingang2));
  pruef('KASSE_ALS_PAKET',!r.bestellt.kasse2&&r.bestellt.unterwegs===1,'Kauf stellt Kassen sofort auf: '+JSON.stringify(r.bestellt));
  pruef('KASSE_AUFSTELLEN',r.aufgestellt.kasse2&&r.aufgestellt.nutzbar===2&&!r.aufgestellt.tragen,'Aufstellen: '+JSON.stringify(r.aufgestellt));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

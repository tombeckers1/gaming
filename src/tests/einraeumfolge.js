/* Einraeumen von hinten, Kunde nimmt vorn (Tom, 02.10.: "wenn man anfaengt,
   das Regal einzuraeumen, dass er immer hinten anfaengt ... und wenn der
   Kunde sich was rausnimmt, dass er vorne was nimmt"):
   - HINTEN: die ersten eingeraeumten Stuecke stehen in der hintersten Reihe
   - VORN: ist das Fach voll, nimmt der Kunde (removeFromLevel) aus der
     vordersten Reihe, so lange dort noch etwas steht
   - NACHFUELLEN: wieder eingeraeumt wird zuerst die Luecke vorn
   Aufruf: node -r ladezeit-preload.js einraeumfolge.js real.html
   (echte Grafik: die Stub-Matrizen kennen keine Positionen)
   Gegenprobe (02.10.): Reihenfolge wie vorher (vorn zuerst) -> HINTEN und
   VORN schlagen an. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, out=[];
    S.level=26; S.money=1e7;
    for(const [kind,t] of [['standard','wunder'],['klein','sekt'],['tisch','knatter']]){
      bb.regalStellen(kind); const sh=bb.shelves[bb.shelves.length-1], lv=sh.levels[0], L=bb.layout(t,sh,lv);
      if(L.rows<2){ out.push({kind,t,fehler:'nur eine Reihe'}); continue; }
      /* Tiefe eines Stuecks im Fach: Abstand zur Vorderkante (lokal, ueber die Weltmatrix zurueckgerechnet) */
      const ry=sh.g.rotation.y, gx=sh.g.position.x, gz=sh.g.position.z;
      const tiefe=h=>{ const m=h.m.elements, dx=m[12]-gx, dz=m[14]-gz, lz=dx*Math.sin(ry)+dz*Math.cos(ry); return +(bb.kindOf(sh).d/2-lz).toFixed(3); };
      const proReihe=L.cols*L.st;
      for(let i=0;i<proReihe;i++) bb.addToLevel(lv,t,1);
      const ersteTiefe=Math.min(...lv.items.map(tiefe));
      while(bb.addToLevel(lv,t,1));
      const alle=lv.items.map(tiefe), hinten=Math.max(...alle), vorn=Math.min(...alle);
      /* Kunde nimmt eine ganze Reihe heraus */
      const genommen=[]; for(let i=0;i<proReihe;i++){ genommen.push(tiefe(lv.items[lv.items.length-1])); bb.removeFromLevel(lv); }
      bb.addToLevel(lv,t,1); const nach=tiefe(lv.items[lv.items.length-1]);
      out.push({kind,t,reihen:L.rows,proReihe,ersteTiefe,hinten,vorn,genommenMax:Math.max(...genommen),nach}); }
    return out; });
  const m=[];
  for(const x of r){ console.log(JSON.stringify(x)); if(x.fehler){ m.push(x.kind+': '+x.fehler); continue; }
    if(x.ersteTiefe<x.hinten-0.001) m.push(`HINTEN ${x.kind}/${x.t}: erste Reihe ${x.ersteTiefe} m hinter der Kante, hinterste Reihe ${x.hinten} m`);
    if(x.genommenMax>x.vorn+0.001) m.push(`VORN ${x.kind}/${x.t}: Kunde nahm aus ${x.genommenMax} m Tiefe, vorderste Reihe ${x.vorn} m`);
    if(x.nach>x.vorn+0.001) m.push(`NACHFUELLEN ${x.kind}/${x.t}: neues Stueck in ${x.nach} m statt vorn`); }
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

/* Dynamische Aufloesung (Tom, 03.10.: "fluessig, hochaufloesend so gut es
   geht"): der Regler in der Automatik
   - RUNTER: bei 30 Bildern/s weniger Pixel
   - HOCH: drei Sekunden mit 60 Bildern/s wieder mehr
   - DECKEL: bringt die Absenkung nichts (Bildrate gedeckelt), geht sie
     zurueck und der Regler haelt still
   - MAX: Stufe Hoch erlaubt bis 2x Pixeldichte
   Aufruf: node aufloesung.js test.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:700,height:450},deviceScaleFactor:3});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  const r=await p.evaluate(()=>{ const bb=window.__bb, m=[], M=bb.gfxMess;
    const sek=(fps,n)=>{ for(let k=0;k<(n||1);k++) for(let i=0;i<fps;i++) bb.resRegeln(1/fps); };
    bb.resSetzen(1); M.sperre=0; M.vorher=0; M.gut=0; M.rt=0; M.rn=0;
    const pr0=bb.renderer.getPixelRatio();
    if(bb.GFX==='hoch'&&Math.abs(pr0-2)>0.01) m.push('MAX: Pixeldichte '+pr0+' statt 2');
    sek(30); const r1=bb.RES; if(!(r1<1)) m.push('RUNTER: RES '+r1);
    if(!(bb.renderer.getPixelRatio()<pr0)) m.push('RUNTER: Pixeldichte unveraendert');
    sek(50); const r2=bb.RES; if(r2!==r1) m.push('nach Besserung veraendert: '+r2);
    sek(60,3); const r3=bb.RES; if(!(r3>r2)) m.push('HOCH: RES '+r3+' nach 3 s mit 60');
    sek(30); const r4=bb.RES; sek(30); const r5=bb.RES;
    if(!(r4<r3&&Math.abs(r5-r3)<0.001&&M.sperre>0)) m.push('DECKEL: '+[r3,r4,r5,M.sperre].join('/'));
    sek(30,5); if(Math.abs(bb.RES-r3)>0.001) m.push('DECKEL: Regler senkt trotz Sperre '+bb.RES);
    return {m,werte:[pr0,r1,r2,r3,r4,r5]}; });
  console.log('Verlauf',r.werte.join(' -> '));
  console.log('ERRORS:',r.m.concat(errs).join(' | ')||'keine'); await b.close();
})();

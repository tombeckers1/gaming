/* Grafikstufen (30.09., Tom: "laggt stark auf meinem alten Laptop und PC"):
   - STUFE: niedrig = 0,75-fache Aufloesung, keine Schatten, keine
     Bildeffekte, 55 % Funken; gemerkt ueber das Neuladen, dann auch ohne
     Kantenglaettung
   - AUTO: 20 Bilder/s ueber 6 s -> eine Stufe tiefer, Hinweis, gemerkt;
     Gegenprobe: bei fester Stufe 'hoch' passiert nichts
   - SCHNELLER: niedrig zeichnet ein Bild deutlich schneller als hoch
   Aufruf: node grafik2.js real.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:800,height:500},deviceScaleFactor:2});
  p.on('crash',()=>errs.push('CRASH'));
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const mangel=[]; const pruef=(n,ok,w)=>{ if(!ok) mangel.push(n+': '+w); };
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const a=await p.evaluate(()=>{ const bb=window.__bb, R=bb.renderer, gl=R.getContext(), px=new Uint8Array(4);
    const zeit=()=>{ bb.run(0.3,0.05); const t=[]; for(let i=0;i<6;i++){ const t0=performance.now(); bb.renderFrame(1/60); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); t.push(performance.now()-t0); } t.sort((x,y)=>x-y); return Math.round(t[3]); };
    const m=bb.testfeldMitte(); bb.setView(m.x,m.z+12,Math.PI,0.1);
    const o={start:{wahl:bb.GFX_WAHL,gfx:bb.GFX,pr:R.getPixelRatio(),schatten:R.shadowMap.enabled,post:bb.postOn,qual:bb.QUAL()}};
    for(let i=0;i<3;i++) zeit(); o.msHoch=zeit();
    bb.gfxWaehlen('niedrig');
    o.niedrig={gfx:bb.GFX,pr:R.getPixelRatio(),schatten:R.shadowMap.enabled,post:bb.postOn,qual:bb.QUAL(),ls:localStorage.getItem('bb_gfx')};
    for(let i=0;i<3;i++) zeit(); o.msNiedrig=zeit();
    /* Gegenprobe Automatik: feste Stufe hoch, 20 Bilder/s - bleibt */
    bb.gfxWaehlen('hoch'); bb.gfxMess.ruhe=0; for(let i=0;i<20*8;i++) bb.gfxMessen(0.05,true); o.festHoch=bb.GFX;
    /* Automatik: 20 Bilder/s ueber 8 s -> mittel; Pause zaehlt nicht */
    bb.gfxWaehlen('auto'); bb.gfxMess.ruhe=0; const tl=bb.toastLast;
    for(let i=0;i<20*8;i++) bb.gfxMessen(0.05,false); o.autoPause=bb.GFX;
    for(let i=0;i<20*8;i++) bb.gfxMessen(0.05,true); o.auto=bb.GFX; o.autoLs=localStorage.getItem('bb_gfx_auto'); o.hinweis=bb.toastLast!==tl?bb.toastLast:'';
    /* fluessig (60 Bilder/s) - keine weitere Stufe */
    bb.gfxMess.ruhe=0; for(let i=0;i<60*10;i++) bb.gfxMessen(1/60,true); o.autoFluessig=bb.GFX;
    bb.gfxWaehlen('niedrig');
    return o; });
  console.log(JSON.stringify(a));
  /* neue Seite im selben Browser (gleicher Speicher) - ein Neuladen der
     schweren Seite brach in der Software-Grafik ab */
  const ctx=p.context(); await p.close(); const p2=await ctx.newPage(); p2.setDefaultTimeout(600000);
  p2.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); p2.on('crash',()=>errs.push('CRASH'));
  await p2.goto('file://'+process.argv[2]); await p2.waitForFunction('window.__bb!==undefined',{timeout:240000});
  const c=await p2.evaluate(()=>{ const bb=window.__bb, R=bb.renderer; return {gfx:bb.GFX,wahl:bb.GFX_WAHL,aa:R.getContext().getContextAttributes().antialias,pr:R.getPixelRatio(),schatten:R.shadowMap.enabled}; });
  console.log(JSON.stringify(c));
  /* Pausenmenue: Seite Grafik, Knopf Mittel */
  await neuesSpiel(p2);
  const d=await p2.evaluate(()=>{ const bb=window.__bb; bb.showPause(); bb.pauseSeite('pGrafik'); document.querySelector('#gfxWahl [data-gfx="mittel"]').click();
    return {gfx:bb.GFX,an:document.querySelector('#gfxWahl .an')&&document.querySelector('#gfxWahl .an').dataset.gfx,info:document.getElementById('gfxInfo').textContent}; });
  console.log(JSON.stringify(d));
  pruef('START',a.start.wahl==='auto'&&a.start.gfx==='hoch'&&a.start.pr>1.5&&a.start.schatten&&a.start.qual===1,'Start nicht auto/hoch: '+JSON.stringify(a.start));
  pruef('STUFE',a.niedrig.gfx==='niedrig'&&a.niedrig.pr===0.75&&!a.niedrig.schatten&&!a.niedrig.post&&a.niedrig.qual===0.55&&a.niedrig.ls==='niedrig','niedrig: '+JSON.stringify(a.niedrig));
  pruef('SCHNELLER',a.msNiedrig<a.msHoch*0.75,'niedrig '+a.msNiedrig+' ms, hoch '+a.msHoch+' ms');
  pruef('AUTO',a.festHoch==='hoch','feste Stufe hoch wurde veraendert: '+a.festHoch);
  pruef('AUTO',a.autoPause==='hoch','in der Pause heruntergeschaltet');
  pruef('AUTO',a.auto==='mittel'&&a.autoLs==='mittel'&&/automatisch/.test(a.hinweis),'Automatik: '+JSON.stringify([a.auto,a.autoLs,a.hinweis]));
  pruef('AUTO',a.autoFluessig==='mittel','bei 60 Bildern/s weiter geschaltet: '+a.autoFluessig);
  pruef('NEULADEN',c.gfx==='niedrig'&&c.wahl==='niedrig'&&c.aa===false&&c.pr===0.75&&!c.schatten,'nach dem Neuladen: '+JSON.stringify(c));
  pruef('MENUE',d.gfx==='mittel'&&d.an==='mittel'&&d.info.length>20,'Pausenmenue: '+JSON.stringify(d));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

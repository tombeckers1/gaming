/* Leistung der Rohr-Batterie (Tom, 01.10. abends: "auch bei 100 Schuss
   fluessig, auf niedriger Grafikstufe weniger Partikel"). Nachts auf dem
   Zuendtisch: Stakkato 100 (rb100) mit Modell, Rauchwoelkchen und
   Nachrauch, einmal auf Grafikstufe hoch, einmal auf niedrig.
   Gemessen je Bild: Spiellogik (step) und Zeichnen, lebende Partikel,
   Rauch-Sprites, neue Shader.
   - RUCKLER: kein Einzelbild ueber dem doppelten Median
   - SHADER: waehrend der Batterie kein Shader neu uebersetzt
   - LOGIK: Spiellogik im Mittel unter 4 ms je Bild
   - NIEDRIG: auf niedrig hoechstens 70 % der Partikel und Rauch-Sprites
   Aufruf: node -r ladezeit-preload.js rohrleistung.js real.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:200,height:125}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const lauf=async st=>p.evaluate(st=>{
    const bb=window.__bb, R=bb.renderer, gl=R.getContext(), px=new Uint8Array(4);
    bb.gfxWaehlen(st); bb.clock=1300; bb.applyTOD();
    bb.clearStations(); for(let i=0;i<80&&(bb.rockets.length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
    const T=bb.STATION_POS.tisch; bb.setView(T.x,T.z+9,0,0.55);
    /* Logik in jedem Bild (15/s), gezeichnet jedes dritte (Software-Grafik im Test ist langsam) */
    let zaehl=0; const bild=()=>{ const t0=performance.now(); bb.step(1/15); const t1=performance.now(); if(zaehl++%3) return [t1-t0,null]; bb.renderFrame(1/15); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); return [t1-t0,performance.now()-t1]; };
    bb.S.carrying={type:'rb100',count:1,q:1}; bb.placeOnStation(bb.stations.tisch); bb.S.carrying=null;
    for(let i=0;i<10;i++) bild();
    const prog0=R.info.programs.length, it=bb.stations.tisch.items[0];
    bb.zuendeKanal(it.kanal);
    const n=Math.ceil((bb.brennDauer('rb100')+0.5)*15), fr=[]; let teile=0, wolken=0;
    for(let i=0;i<n;i++){ fr.push(bild());
      if(i%3===0){ let c=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let k=0;k<ps.max;k++) if(ps.life[k]>0) c++; teile=Math.max(teile,c); wolken=Math.max(wolken,bb.WOLKEN.reduce((a,w)=>a+w.teile.length,0)); } }
    const s=a=>{ const x=a.slice().sort((u,v)=>u-v); return {mittel:+(a.reduce((u,v)=>u+v,0)/a.length).toFixed(2),p50:+x[Math.floor(x.length/2)].toFixed(1),max:+x[x.length-1].toFixed(1)}; };
    return {st,bilder:n,step:s(fr.map(x=>x[0])),render:s(fr.slice(3).map(x=>x[1]).filter(x=>x!==null)),teile,wolken,shaderNeu:R.info.programs.length-prog0};
  },st);
  const hoch=await lauf('hoch'), niedrig=await lauf('niedrig');
  const m=[];
  for(const r of [hoch,niedrig]){ console.log(JSON.stringify(r));
    if(r.render.max>r.render.p50*2) m.push(`RUCKLER ${r.st}: Einzelbild ${r.render.max} ms bei Median ${r.render.p50} ms`);
    if(r.shaderNeu) m.push(`SHADER ${r.st}: ${r.shaderNeu} neu`);
    if(r.step.mittel>4) m.push(`LOGIK ${r.st}: ${r.step.mittel} ms je Bild`); }
  if(niedrig.teile>hoch.teile*0.7||niedrig.wolken>hoch.wolken*0.7) m.push(`NIEDRIG: Partikel ${niedrig.teile}/${hoch.teile}, Rauch ${niedrig.wolken}/${hoch.wolken}`);
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

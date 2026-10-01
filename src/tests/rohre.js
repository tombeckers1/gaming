/* Batterie-Rohre (Tom, 01.10.): so viele Loecher wie Schuss, aus jedem
   Loch genau ein Schuss bzw. Effekt. Fuer jede Batterie im Sortiment:
   - Rohrbild hat genau so viele Rohre wie Schuss + Boden-Effekte
   - beim Abbrennen auf dem Zuendtisch wird jedes Rohr genau einmal
     benutzt, kein Schuss bleibt ohne Rohr (ueberzaehlig = 0)
   - jedes Rohr liegt innerhalb der Grundflaeche des Produkts
   Aufruf: node rohre.js test.html [id,id] */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const nur=(process.argv[3]||'').split(',').filter(Boolean);
  const gegen=process.argv[4]==='gegenprobe';
  const r=await p.evaluate(([nur,gegen])=>{ const bb=window.__bb, P=bb.P, out=[];
    const ids=nur.length?nur:Object.keys(P).filter(t=>(P[t].shape==='battery'||P[t].shape==='fan')&&!P[t].noOrder);
    for(const t of ids){
      const need=bb.rohrBedarf(t), L=bb.rohrLayout(t), d=P[t].dims;
      for(let i=0;i<80&&(bb.rockets.length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
      /* Gegenprobe: ein Rohr weniger - der Test muss anschlagen */
      if(gegen) L.rohre.pop();
      bb.ROHR_LOG=[];
      const o={x:0,y:0.93+d[1],z:-20,ab:0.08,jit:0.06,hx:d[0]/2,hz:d[2]/2,ry:Math.PI};
      bb.igniteType(t,o);
      const dauer=(bb.SHOWS[t]?bb.showLength(t):6)+4;
      for(let s=0;s<dauer;s+=0.25) bb.run(0.25,0.25);
      const log=bb.ROHR_LOG; bb.ROHR_LOG=null;
      const idx=log.map(e=>e.i), dop=idx.length-new Set(idx).size, ueber=idx.filter(i=>i<0).length;
      const aussen=log.filter(e=>e.i>=0&&(Math.abs(e.x-o.x)>d[0]/2+0.001||Math.abs(e.z-o.z)>d[2]/2+0.001)).length;
      out.push({t,schuss:need.schuss,boden:need.boden,rohre:L.rohre.length+(gegen?1:0),B:L.B,raster:L.cols+'x'+L.rows,benutzt:log.length,dop,ueber,aussen,r:+(L.r*2000).toFixed(1)});
    }
    return out; },[nur,gegen]);
  const m=[];
  for(const x of r){ console.log(x.t.padEnd(18),'Schuss',String(x.schuss).padStart(3),'Boden',String(x.boden).padStart(2),'Rohre',String(x.rohre).padStart(3),'Bloecke',x.B,'Raster',x.raster.padEnd(6),'Rohr-Ø mm',x.r,'benutzt',x.benutzt,'doppelt',x.dop,'ohne Rohr',x.ueber,'aussen',x.aussen);
    if(x.rohre!==x.schuss+x.boden) m.push(`ANZAHL ${x.t}: ${x.rohre} Rohre fuer ${x.schuss}+${x.boden}`);
    if(x.benutzt!==x.rohre||x.dop||x.ueber) m.push(`EINMAL ${x.t}: ${x.benutzt}/${x.rohre} benutzt, ${x.dop} doppelt, ${x.ueber} ohne Rohr`);
    if(x.aussen) m.push(`ORT ${x.t}: ${x.aussen} Rohre ausserhalb`); }
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

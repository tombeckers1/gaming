/* Batterie-Rohre (Tom, 01.10. abends: "realistisch"). Fuer jede Batterie
   im Sortiment (oder die Liste in argv[3]), gezuendet am Zuendtisch:
   - genau so viele Rohre wie Schuss auf der Verpackung (rohrBedarf.schuss)
   - jedes Rohr feuert genau einmal, kein Schuss ohne Rohr
   - die Rohre feuern in der festen Folge der Zuendschnur (Layout.folge)
   - zwischen zwei Schuessen liegen 0,2 bis 0,4 s
   - Boden-Effekte kommen aus den Fontaenen-Modulen, jedes genau einmal
   - jedes Rohr liegt innerhalb der Grundflaeche, abgefeuerte Rohre sind
     am Modell verkohlt (dunkel), nach dem letzten Schuss raucht es nach
   Aufruf: node rohre.js test.html [id,id] [gegenprobe|gegenprobe2] */
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
  const gegen=process.argv[4]||'';
  const r=await p.evaluate(([nur,gegen])=>{ const bb=window.__bb, P=bb.P, out=[];
    const ids=nur.length?nur:Object.keys(P).filter(t=>(P[t].shape==='battery'||P[t].shape==='fan')&&!P[t].noOrder&&bb.SHOWS[t]);
    for(const t of ids){
      const need=bb.rohrBedarf(t), L=bb.rohrLayout(t), d=P[t].dims;
      for(let i=0;i<80&&(bb.rockets.length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
      /* Gegenprobe 1: ein Rohr weniger - ANZAHL/EINMAL muessen anschlagen.
         Gegenprobe 2: Zuendfolge vertauscht - FOLGE muss anschlagen */
      if(gegen==='gegenprobe') L.rohre.pop();
      if(gegen==='gegenprobe2'){ const f=L.folge; [f[0],f[1]]=[f[1],f[0]]; }
      bb.ROHR_LOG=[];
      const st=bb.stations.tisch; bb.clearStations();
      const sl={x:bb.STATION_POS.tisch.x,y:0.93,z:bb.STATION_POS.tisch.z,ry:Math.PI};
      const m=bb.batterieModell(t,Math.PI); m.g.position.set(sl.x,sl.y,sl.z); m.g.rotation.y=Math.PI; bb.scene.add(m.g);
      const o={x:sl.x,y:0.93+d[1],z:sl.z,ab:0.08,jit:0.06,hx:d[0]/2,hz:d[2]/2,ry:Math.PI,batt:m};
      const hell0=m.farbe(0);
      bb.igniteType(t,o);
      const Z=bb.zuendPlan(t), dauer=0.8+Z.letzter+1;
      let rauchNach=0;
      for(let s=0;s<dauer;s+=0.05) bb.run(0.05,0.05);
      const w0=bb.WOLKEN.length; for(let s=0;s<2;s+=0.1) bb.run(0.1,0.1); rauchNach=Math.max(w0,bb.WOLKEN.length);
      const log=bb.ROHR_LOG; bb.ROHR_LOG=null;
      const sch=log.filter(e=>e.i!==undefined), mod=log.filter(e=>e.modul!==undefined);
      const idx=sch.map(e=>e.i), dop=idx.length-new Set(idx).size, ueber=idx.filter(i=>i<0).length;
      /* Rohrfuss in der Grundflaeche (die Muendung schraeger Faecherrohre darf ueberstehen) */
      const aussen=sch.filter(e=>e.i>=0&&(Math.abs(e.bx-o.x)>d[0]/2+0.001||Math.abs(e.bz-o.z)>d[2]/2+0.001)).length;
      let folgeFehler=0; sch.forEach((e,k)=>{ if(e.i!==L.folge[k]) folgeFehler++; });
      const gaps=[]; for(let k=1;k<sch.length;k++) gaps.push(sch[k].t-sch[k-1].t);
      const gmin=gaps.length?Math.min(...gaps):0.3, gmax=gaps.length?Math.max(...gaps):0.3;
      /* Plan exakt (die Messung oben ist auf den Rechenschritt 0,05 s genau) */
      const pg=[]; for(let k=1;k<Z.S.length;k++) pg.push(Z.S[k].tt-Z.S[k-1].tt);
      const pmin=pg.length?Math.min(...pg):0.3, pmax=pg.length?Math.max(...pg):0.3;
      const dunkel=[...Array(L.rohre.length).keys()].filter(k=>{ const c=m.farbe(k); return c&&c[0]<hell0[0]*0.3; }).length;
      m.weg();
      out.push({t,schuss:need.schuss,boden:need.boden,rohre:L.rohre.length+(gegen==='gegenprobe'?1:0),B:L.B,raster:L.cols+'x'+L.rows,benutzt:sch.length,dop,ueber,aussen,folgeFehler,
        gmin:+gmin.toFixed(3),gmax:+gmax.toFixed(3),pmin:+pmin.toFixed(4),pmax:+pmax.toFixed(4),module:mod.length,modDop:mod.length-new Set(mod.map(e=>e.modul)).size,dunkel,rauchNach,r:+(L.r*2000).toFixed(1)});
    }
    return out; },[nur,gegen]);
  const m=[];
  for(const x of r){ console.log(x.t.padEnd(18),'Schuss',String(x.schuss).padStart(3),'Rohre',String(x.rohre).padStart(3),'Raster',x.raster.padEnd(6),'Ø mm',x.r,'benutzt',x.benutzt,'Folge-Fehler',x.folgeFehler,'Abstand Plan',x.pmin+'-'+x.pmax,'gemessen',x.gmin+'-'+x.gmax,'s','Module',x.module+'/'+x.boden,'verkohlt',x.dunkel,'Nachrauch',x.rauchNach);
    if(x.rohre!==x.schuss) m.push(`ANZAHL ${x.t}: ${x.rohre} Rohre fuer ${x.schuss} Schuss`);
    if(x.benutzt!==x.rohre||x.dop||x.ueber) m.push(`EINMAL ${x.t}: ${x.benutzt}/${x.rohre} benutzt, ${x.dop} doppelt, ${x.ueber} ohne Rohr`);
    if(x.folgeFehler) m.push(`FOLGE ${x.t}: ${x.folgeFehler} Schuesse nicht in Zuendfolge`);
    if(x.pmin<0.1999||x.pmax>0.4001) m.push(`TAKT ${x.t}: Plan-Abstand ${x.pmin}-${x.pmax} s`);
    if(x.gmin<0.149||x.gmax>0.451) m.push(`TAKT ${x.t}: gemessen ${x.gmin}-${x.gmax} s`);
    if(x.module!==x.boden||x.modDop) m.push(`MODUL ${x.t}: ${x.module}/${x.boden} Boden-Effekte, ${x.modDop} doppelt`);
    if(x.dunkel!==x.rohre-(x.rohre-x.benutzt)) m.push(`KOHLE ${x.t}: ${x.dunkel} von ${x.benutzt} abgefeuerten Rohren dunkel`);
    if(!x.rauchNach) m.push(`RAUCH ${x.t}: kein Nachrauch`);
    if(x.aussen) m.push(`ORT ${x.t}: ${x.aussen} Rohre ausserhalb`); }
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

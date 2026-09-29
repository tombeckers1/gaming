/* Rohrstreuung der Batterien (Tom, 29.09., Foto: "jeder Schuss kommt aus
   einem Rohr - die Explosion ist NIE 1:1 an derselben Stelle"). Gemessen
   wird, wie viele Schuesse innerhalb von 2 s auf 30 cm (seitlich) und
   60 cm (Hoehe) genau dort brechen, wo schon ein anderer bricht. Vorher
   (ohne Streuung) ein Drittel bis ein Siebtel, gerade Salven brachen als
   ein ueberstrahlter Klumpen. Die Gegenprobe schaltet die Streuung ab.
   Dazu: die Muster bleiben erkennbar - V bleibt ein V (Mittelwert der
   Winkel je Seite wie ohne Streuung). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, streu0=bb.rohrStreu;
    const IDS=['donnerwand','profi','hexenkessel','finale','sternenkaiser','kometenwand','batterie100'].filter(t=>bb.P[t]&&bb.SHOWS[t]);
    const miss=(streu)=>{ bb.rohrStreu=streu; let n=0, dopp=0; const v=[];
      for(const t of IDS){ const log=[]; log.brueche=[]; bb.fwLog(log);
        bb.igniteType(t,{x:0,y:0.4,z:-20}); const d=bb.showLength(t)+6; for(let s=0;s<d;s+=1) bb.run(1,0.1); bb.fwLog(null);
        const sch=log.filter(e=>e.art==='schuss'&&!e.tief);
        const pt=sch.map(e=>{ const h=e.hoehe-e.y, r=Math.tan(e.ang)*h; return [e.x+Math.sin(e.dir)*r,e.hoehe,e.z+Math.cos(e.dir)*r]; });
        for(let i=0;i<pt.length;i++){ n++; for(let j=0;j<pt.length;j++){ if(i===j) continue; const a=pt[i],c=pt[j];
          if(Math.abs(sch[i].t-sch[j].t)<2&&Math.hypot(a[0]-c[0],a[2]-c[2])<0.3&&Math.abs(a[1]-c[1])<0.6){ dopp++; break; } } } }
      return {n,dopp,anteil:+(dopp/Math.max(1,n)).toFixed(3)}; };
    const mit=miss(streu0), ohne=miss(0);
    /* Muster: V-Salve, Winkel je Seite im Mittel wie ohne Streuung */
    const vWinkel=(streu)=>{ bb.rohrStreu=streu; const log=[]; log.brueche=[]; bb.fwLog(log);
      bb.playShow({x:0,y:0.4,z:-20},[{n:40,gap:0.05,muster:'v',ang:0.4,eff:'kugel'}]); for(let s=0;s<6;s+=1) bb.run(1,0.1); bb.fwLog(null);
      const sch=log.filter(e=>e.art==='schuss'); const sx=sch.map(e=>Math.sin(e.ang)*Math.sin(e.dir));
      const l=sx.filter(x=>x<0), rr=sx.filter(x=>x>0), m=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
      return {n:sch.length,links:+m(l).toFixed(3),rechts:+m(rr).toFixed(3)}; };
    const vMit=vWinkel(streu0), vOhne=vWinkel(0);
    bb.rohrStreu=streu0;
    return {streu:streu0,mit,ohne,vMit,vOhne}; });
  console.log('STREUUNG',JSON.stringify(r));
  pruef('WIRKT',r.streu>0&&r.mit.anteil<0.09,'zu viele deckungsgleiche Brueche: '+JSON.stringify(r.mit));
  pruef('GEGENPROBE',r.ohne.anteil>2*r.mit.anteil,'ohne Streuung nicht mehr Deckung - Test wirkungslos: '+JSON.stringify(r.ohne));
  pruef('MUSTER',r.vMit.n>=30&&Math.abs(r.vMit.links-r.vOhne.links)<0.03&&Math.abs(r.vMit.rechts-r.vOhne.rechts)<0.03,'V verzogen: '+JSON.stringify([r.vMit,r.vOhne]));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Bruchgroessen (01.10., Tom: Batterie-Brueche zu gross, die Kugelbombe sieht
   dagegen klein aus): je Batterie die Groesse sz aller Schuesse; kein
   Batterie-Bruch darf groesser sein als 85 % der kleinsten Kugelbombe.
   Aufruf: node bruchgroesse.js test.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:30000}); await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, out={}, P=bb.P;
    [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall].forEach(ps=>{ ps.emit=()=>0; ps.update=()=>0; });
    for(const t of Object.keys(bb.SHOWS)){ if(!P[t]) continue; const log=[]; bb.fwLog(log);
      try{ bb.igniteType(t,{x:0,y:0.4,z:-20}); for(let s=0;s<bb.showLength(t)+3;s+=0.5) bb.run(0.5,0.25); }catch(e){}
      bb.fwLog(null); for(let i=0;i<40&&(bb.rockets.length||bb.timersLen()>0);i++) bb.run(0.5,0.5);
      const sz=log.filter(e=>e.art==='schuss').map(e=>e.sz).sort((a,c)=>a-c); if(!sz.length) continue;
      out[t]={lvl:P[t].lvl,n:sz.length,med:+sz[Math.floor(sz.length/2)].toFixed(2),p90:+sz[Math.floor(sz.length*0.9)].toFixed(2),max:+sz[sz.length-1].toFixed(2)}; }
    out.__kugel={}; const KG=window.__fwA.KUGEL; for(const k in KG){ out.__kugel[k]=KG[k].sz; } return out; });
  const L=Object.entries(r).filter(([k])=>k!=='__kugel').sort((a,c)=>a[1].lvl-c[1].lvl);
  for(const [k,v] of L) console.log(k.padEnd(22),JSON.stringify(v));
  const all=L.map(x=>x[1].max).sort((a,c)=>a-c); console.log('MAX gesamt',all[all.length-1],'Median der Maxima',all[Math.floor(all.length/2)]);
  console.log('KUGELN',JSON.stringify(r.__kugel));
  const kMin=Math.min(...Object.values(r.__kugel)), zuGross=L.filter(([k,v])=>v.max>kMin*0.85).map(([k,v])=>k+' '+v.max);
  if(zuGross.length) errs.push('GROESSE: '+zuGross.length+' Batterien brechen so gross wie eine Kugel ('+(kMin*0.85).toFixed(2)+'): '+zuGross.slice(0,8).join(', '));
  console.log('ERRORS',errs.length?errs.slice(0,3).join(' | '):'keine'); await b.close();
})();

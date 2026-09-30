/* Klangbett ohne Startknall (Tom, 30.09.: 2027-Wunderkerzen "genau am
   Anfang so ein komischer Sound"). Gemessen am echten Audioausgang in
   Echtzeit: vorher begann jedes Klangbett mit voller Lautstaerke (25-fach)
   und fiel erst nach 0,3 s ab. Die Spitze nach dem Zuenden darf hoechstens
   doppelt so laut sein wie das ruhige Brennen danach. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const out={};
  for(const t of ['wunder','wunderzahl','zauberbrunnen']){
    out[t]=await p.evaluate(async t=>{ const bb=window.__bb; if(!bb.P[t]) return null; bb.ac(); const AC=bb.master.context; await AC.resume();
      const sp=AC.createScriptProcessor(2048,1,1), rms=[];
      sp.onaudioprocess=ev=>{ const d=ev.inputBuffer.getChannelData(0); let s=0; for(let i=0;i<d.length;i++) s+=d[i]*d[i]; rms.push(Math.sqrt(s/d.length)); };
      bb.master.connect(sp); sp.connect(AC.destination);
      if(!bb.vfAn) bb.vorfuehrungAn(); await new Promise(r=>setTimeout(r,400)); const r0=rms.length;
      bb.vfZuenden(t); await new Promise(r=>setTimeout(r,4500));
      sp.disconnect(); bb.master.disconnect(sp);
      const a=rms.slice(r0), laut=a.findIndex(x=>x>0.002);
      if(laut<0) return {still:true};
      const erst=a.slice(laut,laut+14), ruhig=a.slice(laut+30,laut+80).sort((x,y)=>x-y), med=ruhig[Math.floor(ruhig.length/2)]||0;
      return {spitze:+Math.max(...erst).toFixed(4),ruhig:+med.toFixed(4)}; },t);
    await p.evaluate(()=>{ const bb=window.__bb; [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall].forEach(ps=>ps.life.fill(0)); bb.emittersListe().length=0; bb.timersLeeren(); });
    await p.waitForTimeout(1500);
  }
  console.log('KLANGSTART',JSON.stringify(out));
  for(const [t,v] of Object.entries(out)){ if(!v) continue;
    pruef('HOERBAR',!v.still,t+': still');
    if(!v.still) pruef('KEIN_STARTKNALL',v.spitze<=2*v.ruhig+0.003,t+': Spitze '+v.spitze+' bei ruhigem Brennen '+v.ruhig); }
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Startmaske: Neues Spiel -> Namensmaske -> aufschliessen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message+' | '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined');
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(250);
  const o=await p.evaluate(()=>{
    const bb=window.__bb, out={}; bb.S.level=25;
    const ids=Object.keys(bb.P).filter(t=>bb.P[t].cat);
    out.feuerwerk=ids.length; out.effekte=Object.keys(bb.EFF).length;
    const lens={}; for(const k in bb.SHOWS) lens[k]=bb.showLength(k); out.showLaenge=lens;
    let maxP=0;
    ids.forEach(t=>{ bb.igniteType(t); });
    for(let i=0;i<60*70;i++){ bb.step(1/60);
      let live=0; [bb.psBig,bb.psMid,bb.psSmall].forEach(ps=>{ for(let k=0;k<ps.max;k++) if(ps.life[k]>0) live++; });
      if(i%120===0) maxP=Math.max(maxP,live);
    }
    out.maxPartikel=maxP; out.raketenRest=bb.rockets.length; out.emitterRest=bb.emitters.length;
    // Einzeln: laufen die langen Shows wirklich lange?
    const t0=bb.timersLen();
    bb.igniteType('profi'); out.timersProfi=bb.timersLen()-t0;
    return out;
  });
  console.log(JSON.stringify(o,null,1));
  console.log('ERRORS:',errs.length?errs.slice(0,6):'keine');
  await b.close();
})();

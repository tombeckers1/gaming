/* Last der 15 Muster-Batterien: ueberschriebene lebende Partikel je Pool,
   max. lebende Partikel, Geraeusche je Sekunde (Spitze), Laufzeit je Rechenschritt */
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
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const ids=(process.argv[3]||'').split(',').filter(Boolean);
  const r=await p.evaluate((ids)=>{ const bb=window.__bb, out={};
    const L=ids.length?ids:bb.NEU_TEST.batterien;
    const pools={huge:bb.psHuge,big:bb.psBig,mid:bb.psMid,small:bb.psSmall};
    const ueber={}; for(const k in pools){ const ps=pools[k], em=ps.emit.bind(ps); ueber[k]=0;
      ps.emit=function(){ if(this.life[this.next]>0.05) ueber[k]++; return em.apply(this,arguments); }; }
    let tone=[]; for(const k of Object.keys(bb.sfx)){ const f=bb.sfx[k]; if(typeof f==='function') bb.sfx[k]=function(){ tone.push([+bb.fwUhr||0,k]); return f.apply(this,arguments); }; }
    for(const id of L){ for(const k in ueber) ueber[k]=0; tone=[];
      for(let i=0;i<60&&(bb.rockets.length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
      for(const k in pools) pools[k].life.fill(0);
      bb.igniteType(id,{x:0,y:0.4,z:-20}); const dauer=(bb.SHOWS[id]?bb.showLength(id):6)+8, maxA={}; let tmax=0, n=0;
      for(let s=0;s<dauer;s+=0.1){ const t0=performance.now(); bb.run(0.1,1/30); tmax=Math.max(tmax,performance.now()-t0); n++;
        if(n%3===0) for(const k in pools){ let a=0; const l=pools[k].life; for(let i=0;i<l.length;i++) if(l[i]>0) a++; maxA[k]=Math.max(maxA[k]||0,a); } }
      const zeiten=tone.map(x=>x[0]); let spitze=0; for(const t of zeiten){ spitze=Math.max(spitze,zeiten.filter(u=>u>=t&&u<t+1).length); }
      const arten={}; for(const x of tone) arten[x[1]]=(arten[x[1]]||0)+1;
      out[id]={dauer:+dauer.toFixed(1),ueber:{...ueber},maxA,tmax:+tmax.toFixed(1),tonSpitze:spitze,arten}; }
    return out; },ids);
  for(const k in r) console.log(k,JSON.stringify(r[k]));
  console.log('ERRORS',errs.length?errs.join(' | '):'none'); await b.close();
})();

/* Show-Engine v2 (Tom, 26.09. nachts: "immer von links nach rechts und
   von rechts nach links ... jede Batterie eine Anomalie"). Prueft die
   neuen Bausteine an einem Probe-Drehbuch:
   - MUSTER: mitte (abwechselnd, Winkel waechst), aussen (Winkel
     schrumpft), x (zwei Rohre gleichzeitig, ueber Kreuz, von den
     Seiten), v (Paare gleichzeitig), kreis (Richtung rundum), schlag
     (alle auf einmal), z (hin und her)
   - EBENEN: mit:true startet mit der vorigen Phase, at:s absolut
   - TEMPO: gapEnde macht die Folge schneller, takt:[...] gibt den
     Rhythmus vor
   - BODEN: boden laeuft waehrend der Phase als Emitter mit
   - STEIG: der Aufstieg ist je Phase fest
   - ALT: alte Drehbuecher (fan mit negativem ang) laufen wie vorher
   - LAENGE: showLength zaehlt parallele Phasen nicht doppelt */
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
  const p=await b.newPage({viewport:{width:1000,height:700}}); p.setDefaultTimeout(180000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, o={}, O={x:0,y:1,z:-40}; bb.rohrStreu=0; /* 29.09.: Mustergeometrie ohne Rohrstreuung pruefen (die misst streuung.js) */
    const lauf=(phasen,dauer)=>{ const log=[]; bb.fwLog(log); const e0=bb.emittersListe().length; const t0=bb.fwUhr;
      bb.playShow(O,phasen,'__probe'); const emi=[]; for(let s=0;s<dauer;s+=0.05){ bb.run(0.05,0.05); } bb.fwLog(null);
      return log.filter(x=>x.art==='schuss').map(x=>({t:+(x.t-t0).toFixed(2),ang:x.ang,dir:x.dir,x:x.x,steig:x.steig,eff:x.eff})); };
    const gleich=(a,b)=>Math.abs(a-b)<0.07;
    /* mitte: 7 Schuss */
    { const L=lauf([{n:7,gap:0.2,muster:'mitte',ang:0.6,eff:'kugel'}],3); o.mitte=L.map(x=>x.ang); }
    { const L=lauf([{n:7,gap:0.2,muster:'aussen',ang:0.6,eff:'kugel'}],3); o.aussen=L.map(x=>x.ang); }
    { const L=lauf([{n:6,gap:0.3,muster:'x',ang:0.5,eff:'kugel',rohre:'breit'}],3); o.x=L.map(x=>[x.t,x.ang,x.x]); }
    { const L=lauf([{n:6,gap:0.3,muster:'v',ang:0.4,eff:'kugel'}],3); o.v=L.map(x=>[x.t,x.ang]); }
    { const L=lauf([{n:8,gap:0.1,muster:'kreis',ang:0.4,eff:'kugel'}],2); o.kreis=L.map(x=>x.dir); }
    { const L=lauf([{n:5,gap:0.5,muster:'schlag',ang:0.5,eff:'kugel'}],2); o.schlag=L.map(x=>[x.t,x.ang]); }
    { const L=lauf([{n:9,gap:0.1,muster:'z',seg:2,ang:0.5,eff:'kugel'}],2); o.z=L.map(x=>x.ang); }
    /* Ebenen und Tempo */
    { const L=lauf([{n:4,gap:0.5,eff:'kugel',pause:0.5},{n:3,gap:0.3,eff:'ring',mit:true},{n:2,gap:0.2,eff:'chrys'},{n:1,at:0.25,eff:'palme'}],5);
      o.ebenen=L.map(x=>[x.t,x.eff]); }
    { const L=lauf([{n:6,gap:0.6,gapEnde:0.1,eff:'kugel'}],4); o.accel=L.map(x=>x.t); }
    { const L=lauf([{n:6,takt:[0.1,0.1,0.8],eff:'kugel'}],4); o.takt=L.map(x=>x.t); }
    /* Boden waehrend der Phase */
    { const e0=bb.emittersListe().length; bb.playShow(O,[{n:3,gap:0.5,eff:'kugel',boden:[{k:'fountain',gt:3},{k:'volcano',gt:3,x:0.5}]}],'__probe'); bb.run(0.1,0.05);
      o.boden=bb.emittersListe().filter(e=>e.k==='fountain'||e.k==='volcano').length; bb.run(4,0.1); }
    { const L=lauf([{n:3,gap:0.2,eff:'kugel',steig:'knister'},{n:2,gap:0.2,eff:'kugel',steig:'keiner'}],3); o.steig=L.map(x=>x.steig); }
    /* alt: fan mit negativem ang = rechts nach links, Winkel wie frueher */
    { const L=lauf([{n:5,gap:0.1,eff:'kugel',fan:true,ang:-0.4}],2); o.alt=L.map(x=>x.ang); }
    o.laenge=bb.showDauer([{n:4,gap:0.5,pause:1},{n:10,gap:0.1,mit:true},{n:2,gap:0.5,pause:1}]);
    return o; });
  console.log(JSON.stringify(r));
  const m=r.mitte, abw=m.slice(1).every((a,i)=>i===0||Math.sign(a)!==Math.sign(m[i]));
  pruef('MUSTER',m.length===7&&Math.abs(m[0])<0.01&&abw&&Math.abs(m[5])>Math.abs(m[1])&&Math.abs(Math.abs(m[6])-0.6)<0.02,'mitte: '+JSON.stringify(m));
  const au=r.aussen; pruef('MUSTER',au.length===7&&Math.abs(Math.abs(au[0])-0.6)<0.02&&Math.abs(au[6])<0.01,'aussen: '+JSON.stringify(au));
  const x=r.x; pruef('MUSTER',x.length===6&&Math.abs(x[0][0]-x[1][0])<0.06&&Math.sign(x[0][1])!==Math.sign(x[1][1])&&Math.sign(x[0][2])===-Math.sign(x[0][1])&&Math.abs(x[0][2]-x[1][2])>0.2,'x: '+JSON.stringify(x));
  const v=r.v; pruef('MUSTER',v.length===6&&Math.abs(v[0][0]-v[1][0])<0.06&&Math.abs(v[0][1]+v[1][1])<0.01&&Math.abs(v[2][0]-v[0][0]-0.3)<0.08,'v: '+JSON.stringify(v));
  const kr=new Set(r.kreis.map(d=>Math.round(((d%6.2832)+6.2832)%6.2832*10))); pruef('MUSTER',r.kreis.length===8&&kr.size===8,'kreis: '+JSON.stringify(r.kreis));
  const sc=r.schlag; pruef('MUSTER',sc.length===5&&sc.every(s=>Math.abs(s[0]-sc[0][0])<0.06),'schlag nicht gleichzeitig: '+JSON.stringify(sc));
  const z=r.z; pruef('MUSTER',z.length===9&&z[0]<-0.4&&z[4]>0.4&&z[8]<-0.4,'z: '+JSON.stringify(z));
  const eb=r.ebenen, t1=eb.filter(e=>e[1]==='kugel').map(e=>e[0]), t2=eb.filter(e=>e[1]==='ring').map(e=>e[0]), t3=eb.filter(e=>e[1]==='chrys').map(e=>e[0]), t4=eb.filter(e=>e[1]==='palme').map(e=>e[0]);
  pruef('EBENEN',Math.abs(t1[0]-t2[0])<0.06&&t3[0]>t1[3]+0.4&&t4.length===1&&Math.abs(t4[0]-t1[0]-0.25)<0.08,'mit/at: '+JSON.stringify(eb));
  const ac=r.accel, d0=ac[1]-ac[0], d4=ac[5]-ac[4]; pruef('TEMPO',ac.length===6&&d0>0.45&&d4<0.25,'gapEnde: '+JSON.stringify(ac));
  const tk=r.takt, dd=tk.slice(1).map((t,i)=>+(t-tk[i]).toFixed(2)); pruef('TEMPO',tk.length===6&&dd[0]<0.2&&dd[1]<0.2&&dd[2]>0.6,'takt: '+JSON.stringify(dd));
  pruef('BODEN',r.boden>=2,'Boden-Emitter waehrend der Phase: '+r.boden);
  pruef('STEIG',JSON.stringify(r.steig)==='["knister","knister","knister","keiner","keiner"]','Aufstieg: '+JSON.stringify(r.steig));
  pruef('ALT',r.alt.length===5&&r.alt[0]>0.39&&r.alt[4]<-0.39&&r.alt[0]>r.alt[2]&&r.alt[2]>r.alt[4],'fan mit negativem ang: '+JSON.stringify(r.alt));
  pruef('LAENGE',Math.abs(r.laenge-(2+1+1+1))<0.05,'Laenge mit paralleler Phase: '+r.laenge);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

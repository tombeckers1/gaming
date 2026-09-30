/* Kleinfeuerwerk zuendet am Produkt (Tom, 28.09.: "die Zuendung wirklich
   am Produkt" - Knallteppich knallte 1-3 m vor dem Tisch, Wunderkerzen
   brannten neben dem Karton). Jedes Tisch-Produkt kommt auf Platz 1,
   wird gezuendet; die ersten Funken muessen am Produkt entstehen und
   Tischware darf nicht vom Tisch wandern (ausser Flitzer, Erbsen und
   Boeller mit Luftbild, deren Effekt davonfliegt).
   Aufruf: node amprodukt.js test.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage(); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2],{timeout:240000}); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:240000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, out={};
    S.up.testfeld=true; S.up.shop_halb=true;
    [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall].forEach(ps=>{ const f=ps.emit.bind(ps); ps.emit=function(x,y,z){ if(window.__pk) window.__pk.push([x,y,z]); return f.apply(null,arguments); }; });
    const ids=Object.keys(window.__klein.KLEIN).filter(t=>bb.stationOf(t)==='tisch');
    for(const t of ids){
      for(let i=0;i<60&&(bb.emittersListe().length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
      const st=bb.stations.tisch; st.items.forEach(x=>{ if(x.mesh) bb.scene.remove(x.mesh); }); st.items.length=0;
      S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st); S.carrying=null;
      const it=st.items[st.items.length-1]; if(!it){ out[t]={fehler:'nicht platziert'}; continue; }
      const P0={x:bb.STATION_POS.tisch.x+bb.TISCH_X[it.slot%3],z:bb.STATION_POS.tisch.z};
      window.__pk=[]; bb.zuendeAlle();
      for(let s=0;s<12;s+=0.1) bb.run(0.1,0.05);
      const pk=window.__pk; window.__pk=null;
      if(!pk.length){ out[t]={leer:true}; continue; }
      const d=q=>Math.hypot(q[0]-P0.x,q[2]-P0.z);
      const erste=pk.slice(0,8).map(d).sort((a,b)=>a-b), alle=pk.map(d).sort((a,b)=>a-b);
      /* start = naechster der ersten acht Funken: wo es anfaengt (geworfene
         Erbsen sind beim zweiten Funken schon unterwegs) */
      out[t]={start:+erste[0].toFixed(2),median:+alle[Math.floor(alle.length/2)].toFixed(2)};
      st.items.forEach(x=>{ if(x.mesh) bb.scene.remove(x.mesh); }); st.items.length=0;
    }
    return out; });
  const mangel=[];
  /* Effekte, die absichtlich weit gehen: Flitzer rasen ueber den Boden,
     Erbsen werden geworfen, Luftbilder (Goldstaub, Atompilz), Tischfeuerwerk-
     Schirm und Luftschlangen fliegen hoch/weit */
  const WEIT=['schwaermer','knallerbsen','goldstaubboeller','atomboeller','tisch','luftschlangentisch','blitzknaller'];
  for(const [t,v] of Object.entries(r)){
    if(v.fehler||v.leer){ mangel.push(t+': '+(v.fehler||'keine Funken')); continue; }
    if(v.start>0.4) mangel.push(`${t}: erste Funken ${v.start} m vom Produkt`);
    if(!WEIT.includes(t)&&v.median>0.6) mangel.push(`${t}: Effekt liegt im Mittel ${v.median} m neben dem Produkt`);
  }
  console.log(JSON.stringify(r));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

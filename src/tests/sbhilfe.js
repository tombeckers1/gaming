/* SB-Kassen mit Betreuer (Tom, 29.09.): an SB-Kassen kassiert niemand.
   Kunden zahlen selbst; etwa jeder dritte bis fuenfte kommt nicht weiter
   und wartet auf Hilfe (Lampe rot). Ein SB-Betreuer geht zu dem, der
   haengt - einer betreut mehrere Kassen. Ohne Betreuer hilft der
   Spieler (E am Terminal), sonst fummelt sich der Kunde nach einer
   halben Minute veraergert selbst durch. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=99; S.money=9e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    ['shop_halb','shop_gross','kasse2'].forEach(id=>bb.testKauf(id));
    for(let i=0;i<4;i++) bb.regalStellen('standard');
    bb.allLevels().forEach(l=>{ for(let k=0;k<8;k++) bb.addToLevel(l,'boeller',1); });
    S.staff.kassierer=true; bb.hireStaff('kassierer');
    bb.openShop();
    /* Kunden sammeln, die Boeller wollen */
    const kunden=()=>bb.customers.filter(x=>x.state!=='leave'&&x.state!=='enter');
    for(let t=0;t<300&&kunden().length<2;t++){ bb.customers.forEach(x=>{ if(x.state==='enter') x.wishes=[{type:'boeller',qty:1}]; }); bb.run(0.5,0.05); }
    const ks=kunden(); if(ks.length<2){ o.fehler='zu wenig Kunden: '+ks.length; return o; }
    const korb=n=>Array.from({length:n},()=>({type:'boeller',price:4.49}));
    /* Kunde an eine SB-Kasse schicken und dort mit Problem anfangen lassen */
    const anSB=(c,n,problem)=>{ c.sb=null; c.items=korb(n); c.state='shop'; c.path=[];
      bb.queue.splice(0,bb.queue.length,...bb.queue.filter(q=>q!==c));
      const i=bb.sbFreiNah(c.pos); if(i<0) return -1;
      c.sb=i; bb.sbLanes[i].busy=c; const q=bb.sbPos(i); c.pos.x=q.x; c.pos.z=q.z; c.patience=999;
      c.sbStart(); if(problem!==undefined){ c.sbProblem=problem; c.sbProbBei=c.sbT-0.05; } return i; };
    /* 1. Problemquote: jeder dritte bis fuenfte */
    let n=0; const N=3000; const c0=ks[0];
    for(let k=0;k<N;k++){ c0.items=korb(1+(k%6)); c0.sbStart(); if(c0.sbProblem) n++; }
    o.quote=+(n/N).toFixed(3);
    /* 2. ohne Betreuer: Problem -> wartet, Lampe rot; der Spieler hilft mit E */
    const c=ks[0], i=anSB(c,2,true);
    bb.run(0.3,0.05);
    const l=bb.sbLanes[i];
    o.problem={state:c.state,hilfe:!!l.hilfe,lampe:'#'+l.lampM.emissive.getHexString()};
    bb.run(5,0.1);
    o.wartet=c.state;
    bb.tuAktion('sbterm',l);
    o.spielerHilft={state:c.state,hilfe:!!l.hilfe};
    /* 3. ohne jede Hilfe: nach SB_SELBST Sekunden allein weiter, veraergert */
    c.sbT=50; c.sbProblem=true; c.sbProbBei=49.9; bb.run(0.3,0.05);
    const t0=c.state; bb.run(bb.SB_SELBST+1,0.1);
    o.allein={vorher:t0,nachher:c.state,missed:!!c.missed};
    c.missed=false; c.sbFree(); c.state='shop'; c.sb=null;
    /* 4. mit Betreuer: er geht hin und hilft */
    S.staff.kassierer2=true; bb.hireStaff('kassierer2');
    const w=bb.staff.kassierer2; const H=bb.sbHeimPlatz('kassierer2');
    /* echte Kunden koennen zwischendurch Hilfe brauchen: gemessen wird,
       ob er ohne Auftrag an seinem Platz ankommt */
    let heim=99; for(let t=0;t<20&&heim>0.3;t+=0.1){ bb.run(0.1,0.05); if(!w.job) heim=Math.hypot(w.pos.x-H.p.x,w.pos.z-H.p.z); }
    o.heim=+heim.toFixed(2);
    /* Warte- und Helferplatz liegen im Laden und sind begehbar (vor der
       ersten Zeile ist gleich die Fensterfront) */
    const hp=bb.sbHelferPlatz(0).p;
    o.plaetze={heim:[+H.p.x.toFixed(2),+H.p.z.toFixed(2),bb.navFrei(bb.navIdx(H.p.x,H.p.z))],helfer:[+hp.x.toFixed(2),+hp.z.toFixed(2),bb.navFrei(bb.navIdx(hp.x,hp.z))]};
    const vorHilfe=bb.DS.sbHilfe||0;
    const i2=anSB(c,3,true); bb.run(0.3,0.05);
    const zuerst=c.state; let dauer=0, amPlatz=99;
    while(c.state==='sbHilfe'&&dauer<25){ bb.run(0.1,0.05); dauer+=0.1;
      const q=bb.sbHelferPlatz(i2).p; amPlatz=Math.min(amPlatz,Math.hypot(w.pos.x-q.x,w.pos.z-q.z)); }
    o.betreuer={zuerst,danach:c.state,dauer:+dauer.toFixed(1),amPlatz:+amPlatz.toFixed(2),geholfen:(bb.DS.sbHilfe||0)-vorHilfe};
    c.sbFree(); c.state='shop'; c.sb=null;
    /* 5. ein Betreuer, zwei Kassen mit Problem: beide werden geloest */
    let d=null;
    for(let t=0;t<300&&!d;t++){ d=bb.customers.find(x=>x!==c&&x.state!=='leave'&&x.state!=='enter'&&x.sb==null)||null;
      if(!d){ bb.customers.forEach(x=>{ if(x.state==='enter') x.wishes=[{type:'boeller',qty:1}]; }); bb.run(0.5,0.05); } }
    if(!d){ o.fehler='kein zweiter Kunde'; return o; }
    /* echte Kunden duerfen die Kassen nicht belegt halten (02.10.: nach
       dem Regalumbau waren beim Test oft alle SB-Kassen von laufenden
       Kunden belegt - dann fand der zweite Testkunde keinen Platz) */
    bb.sbLanes.forEach(l=>{ const x=l.busy; if(x&&x!==c&&x!==d){ if(x.sbFree) x.sbFree(); x.state='shop'; x.sb=null; l.busy=null; } });
    const a1=anSB(c,2,true), a2=anSB(d,2,true); bb.run(0.3,0.05);
    o.zweiStart=[c.state,d.state,a1,a2];
    let t2=0; while((c.state==='sbHilfe'||d.state==='sbHilfe')&&t2<40){ bb.run(0.2,0.05); t2+=0.2; }
    o.zwei={c:c.state,d:d.state,dauer:+t2.toFixed(1)};
    c.sbFree(); d.sbFree(); c.state='shop'; d.state='shop'; c.sb=null; d.sb=null;
    /* 6. Kassenwahl: mit Betreuer nimmt auch ein 6er-Korb die SB-Kasse, ohne nicht */
    bb.fireStaff('kassierer'); S.staff.kassierer=false;
    c.items=korb(6); c.state='shop'; c.joinQueue(); o.mitBetreuer=c.state; c.leave&&null;
    if(c.sb!==null&&c.sb!==undefined){ c.sbFree(); } c.state='shop'; c.sb=null;
    const qi=bb.queue.indexOf(c); if(qi>=0) bb.queue.splice(qi,1);
    bb.fireStaff('kassierer2'); S.staff.kassierer2=false;
    c.items=korb(6); c.state='shop'; c.joinQueue(); o.ohneBetreuer=c.state;
    /* 7. Team-Liste: keine "Kassierer an SB-Kasse" mehr */
    o.namen=['kassierer2','kassierer3','kassierer4','kassierer5'].map(id=>bb.STAFF.find(s=>s.id===id).name);
    return o; });
  console.log('SB',JSON.stringify(r));
  if(r.fehler){ console.log('ERRORS: '+r.fehler); await b.close(); return; }
  pruef('QUOTE',r.quote>=0.2&&r.quote<=0.34,'Problemquote '+r.quote+' (soll jeder 3. bis 5.)');
  pruef('PROBLEM',r.problem.state==='sbHilfe'&&r.problem.hilfe,'kein Hilferuf: '+JSON.stringify(r.problem));
  pruef('WARTET',r.wartet==='sbHilfe','ohne Betreuer loest es sich sofort: '+r.wartet);
  pruef('SPIELER_HILFT',r.spielerHilft.state==='sbPay'&&!r.spielerHilft.hilfe,'E am Terminal hilft nicht: '+JSON.stringify(r.spielerHilft));
  pruef('ALLEIN',r.allein.vorher==='sbHilfe'&&r.allein.nachher!=='sbHilfe'&&r.allein.missed,'ohne Hilfe: '+JSON.stringify(r.allein));
  pruef('IM_LADEN',r.plaetze.heim[1]<5.6&&r.plaetze.heim[2]&&r.plaetze.helfer[1]<5.7,'Platz ausserhalb: '+JSON.stringify(r.plaetze));
  pruef('HEIMPLATZ',r.heim<0.6,'Betreuer steht nicht an den SB-Kassen: '+r.heim+' m');
  pruef('BETREUER_HILFT',r.betreuer.zuerst==='sbHilfe'&&r.betreuer.danach!=='sbHilfe'&&r.betreuer.geholfen>=1&&r.betreuer.amPlatz<0.4&&r.betreuer.dauer<15,'Betreuer: '+JSON.stringify(r.betreuer));
  pruef('EINER_FUER_ZWEI',r.zweiStart[0]==='sbHilfe'&&r.zweiStart[1]==='sbHilfe'&&r.zwei.c!=='sbHilfe'&&r.zwei.d!=='sbHilfe','zwei Probleme: '+JSON.stringify(r.zweiStart)+' '+JSON.stringify(r.zwei));
  pruef('KORB_MIT_BETREUER',r.mitBetreuer==='sbGo','6er-Korb mit Betreuer: '+r.mitBetreuer);
  pruef('KORB_OHNE_BETREUER',r.ohneBetreuer==='queue','6er-Korb ohne Betreuer: '+r.ohneBetreuer);
  pruef('NAMEN',r.namen.every(n=>/Betreuer/.test(n)),'Team: '+r.namen.join(', '));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

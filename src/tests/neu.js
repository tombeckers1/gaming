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

  console.log('START:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S;
    return {geld:S.money,regale:bb.shelves.length,lagerregale:bb.racks.length,kartons:bb.floorBoxes.length,
      datum:bb.dateStr(S.day),fixkosten:bb.fixedCosts(),tipp:document.getElementById('tip').textContent.slice(0,60)}; })));

  console.log('KALENDER:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,o={tage:[]};
    [0,30,60,91,92,95,100,200,364,365,366].forEach(n=>o.tage.push(`${n}:${bb.dateStr(n)} x${Math.round(bb.dayMult(n)*100)/100}`));
    o.jahr2=bb.dateInfo(365).y; o.sonntage=[0,1,2,3,4,5,6,7].filter(n=>bb.isSunday(n));
    return o; })));

  console.log('REGALE:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    S.money=99999; S.level=20;
    ['shelf_klein','shelf_standard','shelf_hoch','shelf_kuehl'].forEach(id=>bb.buyUp(id));
    o.arten=bb.shelves.map(s=>s.kind);
    o.faecher=bb.shelves.map(s=>s.levels.length);
    o.kapaKnallerbsen=bb.shelves.map(s=>bb.layout('knallerbsen',s).cap);
    const kuehl=bb.shelves.find(s=>s.kind==='kuehl');
    o.kuehlNimmtSekt=bb.shelfAccepts(kuehl,'sekt');
    o.kuehlNimmtBoeller=bb.shelfAccepts(kuehl,'boeller');
    // Sekt landet bevorzugt nicht im Kühlschrank? Beide möglich
    o.zielFuerSekt=bb.emptyLevel('sekt')?bb.emptyLevel('sekt').sh.kind:null;
    o.groesstesFach=bb.shelfCapOf('knallerbsen');
    return o; })));

  console.log('LOHN:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    S.staff.auffueller=true; bb.hireStaff('auffueller');
    S.staff.kassierer=true; bb.hireStaff('kassierer');
    o.normal={lohn:bb.dailyWages(),tempo:Math.round(bb.staff.auffueller.speed*100)/100,freundlich:bb.friendliness()};
    bb.setWage('auffueller',1.65); bb.setWage('kassierer',1.65);
    o.top={lohn:bb.dailyWages(),tempo:Math.round(bb.staff.auffueller.speed*100)/100,freundlich:Math.round(bb.friendliness()*100)/100};
    bb.setWage('auffueller',0.75); bb.setWage('kassierer',0.75);
    o.billig={lohn:bb.dailyWages(),tempo:Math.round(bb.staff.auffueller.speed*100)/100,freundlich:Math.round(bb.friendliness()*100)/100};
    bb.setWage('auffueller',1.0); bb.setWage('kassierer',1.0);
    return o; })));

  console.log('FENSTER:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,o={};
    o.start=bb.windowGrime(); bb.addGrime(0.8); o.dreckig=Math.round(bb.windowGrime()*100);
    o.ambienteDreckig=bb.ambienteScore();
    for(let i=0;i<40;i++) bb.cleanWindowTick(false);
    o.nachPutzen=Math.round(bb.windowGrime()*100); o.ambienteSauber=bb.ambienteScore();
    return o; })));

  console.log('BILDER:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    S.money=99999; o.vorher=bb.bildBoost();
    ['bild_raketen','bild_stadt','bild_sortiment','bild_meister'].forEach(id=>bb.buyDeko(id));
    o.nachher=Math.round(bb.bildBoost()*100)/100; o.dekos=bb.dekos.length;
    o.anDerWand=bb.dekos.filter(d=>d.id.indexOf('bild_')===0).map(d=>`${Math.round(d.g.position.x)}/${Math.round(d.g.position.z)}`);
    return o; })));

  console.log('ZAHLUNG:',JSON.stringify(await p.evaluate(()=>{ let k=0,bar=0;
    for(let i=0;i<4000;i++){ if(Math.random()<0.6) k++; else bar++; }
    return {karteSoll:'60%',probe:Math.round(k/40)+'% Karte, '+Math.round(bar/40)+'% bar'}; })));

  // ---- Früher Spielverlauf: ganz von vorn ----
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(200);
  console.log('ANFANG:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={start:S.money};
    bb.buyUp('shelf_klein'); o.nachRegal=S.money; o.regale=bb.shelves.length; o.tutRegal=!!S.tut.shelf;
    bb.orderBox('knallerbsen',1,'mertens'); bb.orderBox('wunder',1,'mertens');
    o.nachWare=Math.round(S.money*100)/100; o.bestellt=bb.pending.length;
    const drain=()=>{ for(let k=0;k<30;k++){ if(!bb.truck||bb.truck.state!=='docked'||!bb.truck.cargo.length) break;
      S.carrying=null; bb.takeFromTruck(); if(S.carrying){ const c=S.carrying;
        const lv=bb.emptyLevel(c.type); if(lv){ for(let j=0;j<c.count;j++) bb.addToLevel(lv,c.type,c.q); }
        S.carrying=null; } } };
    for(let r=0;r<6;r++){ bb.run(20,0.05); drain(); }
    bb.updateCarry();
    o.imRegal=bb.allLevels().reduce((a,l)=>a+l.count,0);
    bb.openShop(); o.phase=bb.phase;
    // Spieler kassiert selbst
    for(let i=0;i<6000;i++){ bb.step(0.05);
      if(bb.belt.length) bb.scanBelt(bb.belt[0]);
      const reg=bb.regCustomer();
      if(reg&&reg.state==='pay'){ if(reg.method==='card') reg.finishCard(); else reg.finishCash(Math.round((reg.given-reg.total)*100)/100); } }
    o.imLaden=bb.customers.length;
    o.kunden=bb.DS.customers; o.umsatz=Math.round(bb.DS.revenue*100)/100; o.verkauft=bb.DS.sold;
    o.geld=Math.round(S.money*100)/100; o.level=S.level; o.xp=S.xp;
    return o;
  })));

  console.log('PDA:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    S.level=20; S.money=50000;
    o.aus=bb.pdaOn; bb.togglePDA(); o.an=bb.pdaOn;
    const t='knallerbsen'; const alt=S.prices[t];
    bb.openPDA(t); o.offen=document.getElementById('pda').classList.contains('show');
    o.titel=document.getElementById('pdaTitle').textContent;
    const btns=[...document.querySelectorAll('#pdaBody button')].map(b=>b.dataset.a);
    o.knoepfe=[...new Set(btns)];
    document.querySelector('#pdaBody button[data-a="pp"][data-d="0.5"]').click();
    o.preisPlus=Math.round((S.prices[t]-alt)*100)/100;
    document.querySelector('#pdaBody button[data-a="pm"]').click();
    o.marktpreis=S.prices[t]===bb.P[t].market;
    const vor=bb.pending.length;
    document.querySelector('#pdaBody button[data-a="po"]').click();
    o.bestellt=bb.pending.length-vor;
    bb.closePDA(); o.zu=!document.getElementById('pda').classList.contains('show');
    o.post={aktiv:bb.postOn};
    return o;
  })));

  console.log('ERRORS:',errs.length?errs.slice(0,5):'keine');
  await b.close();
})();

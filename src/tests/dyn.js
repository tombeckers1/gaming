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
  await neuesSpiel(p); await p.waitForTimeout(200);

  console.log('EREIGNISSE:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    o.anzahl=bb.EVENTS.length;
    S.day=20; const seen={}; let leer=0;
    for(let i=0;i<400;i++){ bb.rollEvent(); const e=bb.todayEvent(); if(e) seen[e.id]=(seen[e.id]||0)+1; else leer++; }
    o.verschieden=Object.keys(seen).length; o.ruhigeTage=Math.round(leer/4)+'%';
    S.ev='engpass'; o.ekTeuer=Math.round(bb.ekFactor()*100);
    S.ev='schnaeppchen'; o.ekGuenstig=Math.round(bb.ekFactor()*100);
    S.ev='sperrung'; o.kundenSperrung=bb.evv('cust');
    S.ev=null; return o; })));

  console.log('KUNDENTYPEN:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    S.level=20; const c={}; for(let i=0;i<3000;i++){ const t=bb.rollCustType(); c[t.id]=(c[t.id]||0)+1; }
    o.verteilung=Object.keys(c).map(k=>k+':'+Math.round(c[k]/30)+'%').join(' ');
    const spar=bb.CUSTTYPES.find(x=>x.id==='spar'), ang=bb.CUSTTYPES.find(x=>x.id==='angeber');
    const t='raketen', pr=bb.P[t].market*1.15;
    o.sparKauft=Math.round(bb.buyChance(t,pr,1,false,spar)*100)+'%';
    o.angeberKauft=Math.round(bb.buyChance(t,pr,1,false,ang)*100)+'%';
    const fam=bb.CUSTTYPES.find(x=>x.id==='familie');
    let n1=0,n2=0; for(let i=0;i<300;i++){ n1+=bb.makeWishes(null).length; n2+=bb.makeWishes(fam).length; }
    o.warenkorbNormal=Math.round(n1/300*10)/10; o.warenkorbFamilie=Math.round(n2/300*10)/10;
    return o; })));

  console.log('ZIELE:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    S.level=10; bb.newGoal(); o.ziel=S.goal.name; o.brauch=S.goal.need; o.praemie=S.goal.pay;
    const geld=S.money;
    S.goal.kind='rev'; S.goal.have=0; S.goal.need=100;
    bb.goalAdd('rev',60); o.halb=S.goal.have;
    bb.goalAdd('rev',60); o.fertig=!!S.goal.done; o.gutschrift=Math.round(S.money-geld);
    return o; })));

  console.log('XP-KURVE:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,o={stufen:[],gesamt:0};
    for(let l=1;l<=30;l++){ const n=bb.xpFor(l); o.gesamt+=n; if([1,5,10,15,20,25,30].includes(l)) o.stufen.push(l+':'+n); }
    return o; })));

  console.log('FIXKOSTEN:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    S.level=1; o.lvl1=bb.fixedCosts(); S.level=10; o.lvl10=bb.fixedCosts(); S.level=25; o.lvl25=bb.fixedCosts();
    S.level=1; return o; })));

  console.log('ERRORS:',errs.length?errs.slice(0,5):'keine');
  await b.close();
})();

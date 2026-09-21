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

  const A=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.level=25; S.money=200000;
    o.lagerplaetze=bb.racks.length*9;
    bb.orderBox('wunder',3,'mertens'); bb.orderBox('boeller',4,'mertens');
    bb.run(12,0.05);
    o.lkwDa=!!bb.truck; o.zustand=bb.truck&&bb.truck.state;
    bb.run(20,0.05);
    o.zustand2=bb.truck&&bb.truck.state; o.ladung=bb.truck?bb.truck.cargo.length:-1;
    o.kartonsImLaden=bb.floorBoxes.length;
    // Spieler lädt selbst aus
    bb.takeFromTruck(); o.traegt=S.carrying&&S.carrying.type; o.ladungDanach=bb.truck.cargo.length;
    return o;
  });
  console.log('LIEFERUNG:',JSON.stringify(A));

  const B=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.carrying=null; bb.updateCarry();
    S.staff.auffueller=true; bb.hireStaff('auffueller');
    S.staff.auffueller2=true; bb.hireStaff('auffueller2');
    S.prio={auffueller:'lkw',auffueller2:'regal'};
    o.prio=[bb.prioOf('auffueller'),bb.prioOf('auffueller2')];
    bb.run(140,0.05);
    o.lkwWeg=!bb.truck; o.restLadung=bb.truck?bb.truck.cargo.length:0; o.zustaende=Object.keys(bb.staff).filter(k=>bb.staff[k]).map(k=>k+":"+bb.staff[k].state);
    let inRacks=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box) inRacks++; }));
    o.imLagerregal=inRacks;
    let imRegal=0; bb.allLevels().forEach(l=>imRegal+=l.count);
    o.imVerkaufsregal=imRegal;
    o.aufDemBoden=bb.floorBoxes.length;
    return o;
  });
  console.log('PERSONAL:',JSON.stringify(B));

  const C=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    // Großauftrag: Ware muss im Lager liegen
    bb.openShop(); S.up.grosskunden=true;
    let call=null; for(let i=0;i<40&&!call;i++) call=bb.makeCall();
    o.auftrag=!!call;
    bb.phone.call=call; bb.phone.state='ringing'; bb.answerPhone(); bb.acceptDeal();
    o.offen=bb.orderLeft(); o.name=bb.order.name;
    // passende Ware ins Lager legen
    bb.order.items.forEach(it=>{ for(let k=0;k<it.cartons;k++){ const sl=bb.racks[0].slots.find(s=>!s.box)||null;
      if(sl) bb.putInSlot(sl,it.type,bb.P[it.type].box,1); else bb.spawnFloorBox(it.type,bb.P[it.type].box,{x:-18,y:0.2,z:-3},1); } });
    o.bereit=bb.orderReady();
    bb.run(120,0.05);
    o.auftragWeg=!bb.order; o.restOffen=bb.orderLeft(); o.arrive=bb.order?Math.round(bb.order.arrive):0; o.geld=Math.round(S.money);
    return o;
  });
  console.log('GROSSAUFTRAG:',JSON.stringify(C));
  console.log('ERRORS:',errs.length?errs.slice(0,6):'keine');
  await b.close();
})();

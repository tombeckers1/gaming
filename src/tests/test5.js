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
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message+' | '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined');
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(250);

  // ---- Großhändler ----
  const A=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.level=20; S.money=300000;
    ['shelf_klein','shelf_standard','shelf_standard','shelf_hoch','shelf_kuehl'].forEach(id=>bb.buyUp(id));
    o.regale=bb.shelves.map(x=>x.kind);
    bb.orderBox('wunder',1,'mertens'); bb.orderBox('boeller',5,'kowalski'); bb.orderBox('raketen',20,'import');
    o.pending=bb.pending.length;
    o.qualities=[...new Set(bb.pending.map(x=>x.q))].map(x=>Math.round(x*100)/100);
    bb.buyPack('kiste');
    o.pendingNachPack=bb.pending.length;
    // LKWs entladen (Lieferungen kommen an der Rampe an)
    const drain=()=>{ for(let k=0;k<30;k++){ if(!bb.truck||bb.truck.state!=='docked'||!bb.truck.cargo.length) break;
      S.carrying=null; bb.takeFromTruck(); if(S.carrying){ const c=S.carrying; bb.spawnFloorBox(c.type,c.count,null,c.q); S.carrying=null; } } };
    for(let r=0;r<8;r++){ bb.run(30,0.05); drain(); }
    bb.updateCarry();
    o.kartons=bb.floorBoxes.length;
    o.billigVorhanden=bb.floorBoxes.some(x=>x.q<0.8);
    return o;
  });
  console.log('HANDEL:',JSON.stringify(A));

  // ---- Testfeld ----
  const B=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const billig=bb.floorBoxes.find(x=>x.q<0.8)||bb.floorBoxes[0];
    bb.pickUp(billig);
    const st=bb.stations[ (function(){ const t=bb.S.carrying.type; return t; })() ];
    // richtige Station finden
    const want=Object.keys(bb.stations).find(k=>bb.stations[k].items.length>=0);
    o.carry=bb.S.carrying.type;
    // gezielt auf die passende Station legen
    const ziel=Object.keys(bb.stations).find(k=>{ const before=bb.stations[k].items.length; bb.placeOnStation(bb.stations[k]); return bb.stations[k].items.length>before; });
    o.station=ziel||null;
    o.aufgebaut=ziel?bb.stations[ziel].items.length:0;
    // falsche Station
    const falsch=Object.keys(bb.stations).find(k=>k!==ziel);
    const vor=bb.stations[falsch].items.length; bb.placeOnStation(bb.stations[falsch]);
    o.falscheStationBlockiert=bb.stations[falsch].items.length===vor;
    bb.firePult();
    o.nachZuendung=Object.keys(bb.stations).reduce((a,k)=>a+bb.stations[k].items.length,0);
    bb.run(12,0.05);
    o.hype=Math.round(bb.S.xp>=0?1:0);
    return o;
  });
  console.log('TESTFELD:',JSON.stringify(B));

  // ---- Gravur ----
  const C=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    bb.buyUp('gravur'); o.automat=!!document.querySelector('canvas')&&true;
    bb.orderBox('blanko',1,'mertens');
    for(let r=0;r<6;r++){ bb.run(12,0.05);
      for(let k=0;k<30;k++){ if(!bb.truck||bb.truck.state!=='docked'||!bb.truck.cargo.length) break;
        bb.S.carrying=null; bb.takeFromTruck(); if(bb.S.carrying){ const c=bb.S.carrying; bb.spawnFloorBox(c.type,c.count,null,c.q); bb.S.carrying=null; } } }
    bb.S.carrying=null; bb.updateCarry();
    const kar=bb.floorBoxes.find(x=>x.type==='blanko');
    o.blankoKarton=!!kar;
    if(kar){ bb.pickUp(kar); for(let i=0;i<20;i++) bb.refillGrav(true); }
    o.rohlinge=bb.gravBlanks;
    // Spieler graviert
    S.carrying=null;
    bb.openGravInput();
    document.getElementById('gravIn').value='Tom war hier';
    bb.closeGravInput(true);
    o.eigene=S.carrying?S.carrying.text:null;
    // auf Rampe stellen und zünden
    bb.placeOnStation(bb.stations.rampe);
    o.aufRampe=bb.stations.rampe.items.length;
    bb.firePult(); bb.run(8,0.05);
    return o;
  });
  console.log('GRAVUR:',JSON.stringify(C));

  // ---- Kunde graviert + kauft ----
  const D=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.staff.kassierer=true; bb.hireStaff('kassierer');
    const lvs=bb.allLevels(); ['wunder','boeller','tisch'].forEach((t,i)=>{ for(let k=0;k<20;k++) bb.addToLevel(lvs[i],t,1); });
    bb.openShop(); bb.run(420,0.05);
    o.gravurVerkauft=bb.DS.gravur||0; o.umsatz=Math.round(bb.DS.revenue); o.kunden=bb.DS.customers;
    o.rohlingeRest=bb.gravBlanks;
    return o;
  });
  console.log('KUNDEN:',JSON.stringify(D));

  // ---- Großauftrag ----
  const E=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    bb.buyUp('grosskunden');
    bb.phase='open'; bb.clock=600;
    bb.phone.cd=0.01; bb.run(1,0.05);
    o.klingelt=bb.phone.state;
    bb.answerPhone();
    o.dialogOffen=document.getElementById('deal').classList.contains('show');
    o.titel=document.getElementById('dTitle').textContent;
    bb.haggle(0.05); bb.haggle(0.05);
    bb.acceptDeal();
    o.auftrag=bb.order?{name:bb.order.name,pay:Math.round(bb.order.pay),kartons:bb.order.items.reduce((a,i)=>a+i.cartons,0)}:null;
    bb.run(70,0.05);
    o.wagenDa=!!bb.order&&bb.order.arrive<=0;
    // Ware besorgen und laden
    if(bb.order){
      bb.order.items.forEach(it=>{ for(let i=0;i<it.cartons;i++) bb.pending.push({type:it.type,t:0.1,q:1}); });
      bb.run(6,0.05);
      let geladen=0;
      for(let n=0;n<40&&bb.order;n++){
        const need=bb.order.items.find(x=>x.loaded<x.cartons); if(!need) break;
        const kar=bb.floorBoxes.find(x=>x.type===need.type&&x.count>=Math.ceil(bb.S.prices?0:0));
        if(!kar) break;
        bb.pickUp(kar); bb.loadVan(); geladen++;
      }
      o.geladen=geladen;
    }
    o.auftragOffen=!!bb.order;
    o.geld=Math.round(S.money);
    return o;
  });
  console.log('AUFTRAG:',JSON.stringify(E));

  // ---- Speichern / Laden ----
  await p.evaluate(()=>{ window.__bb.save(); });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(250);
  const F=await p.evaluate(()=>({level:window.__bb.S.level,blanks:window.__bb.gravBlanks,gravAutomat:!!window.__bb.S.up.gravur,
    stamm:JSON.stringify(window.__bb.S.stamm||{}),kartons:window.__bb.floorBoxes.length,
    qGespeichert:[...new Set(window.__bb.floorBoxes.map(x=>Math.round((x.q||1)*100)/100))]}));
  console.log('LADEN:',JSON.stringify(F));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

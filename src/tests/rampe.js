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
  await neuesSpiel(p); await p.waitForTimeout(200);

  console.log('TOR-START:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb;
    return {stand:Math.round(bb.door.t*100)/100, geschlossen:bb.door.t===0, panele:bb.door.panels.length,
      sperrt:!!bb.door.col, ampelRot:bb.door.lampR.emissiveIntensity>0, ampelGruen:bb.door.lampG.emissiveIntensity>0,
      panelHoehen:bb.door.panels.map(x=>Math.round(x.position.y*100)/100)}; })));

  console.log('TOR-OFFEN:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb;
    bb.doorOpen(true); for(let i=0;i<300;i++) bb.updateTruck(0.05);
    return {stand:Math.round(bb.door.t*100)/100, offen:bb.doorIsOpen(), sperrt:!!bb.door.col,
      ampelGruen:bb.door.lampG.emissiveIntensity>0,
      panelHoehen:bb.door.panels.map(x=>Math.round(x.position.y*100)/100),
      panelX:bb.door.panels.map(x=>Math.round(x.position.x*100)/100),
      kippung:bb.door.panels.map(x=>Math.round(x.rotation.z*100)/100)}; })));

  console.log('LIEFERUNG:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    bb.doorOpen(false); for(let i=0;i<300;i++) bb.updateTruck(0.05);
    S.level=20; S.money=50000;
    bb.spawnTruck([{type:'wunder',q:1},{type:'boeller',q:1},{type:'raketen',q:1}],'mertens','Pyro Mertens');
    o.startX=Math.round(bb.truck.g.position.x*10)/10; o.zustand1=bb.truck.state;
    for(let i=0;i<40;i++) bb.updateTruck(0.05);
    o.faehrtRueckwaerts=bb.truck.g.position.x>o.startX;
    for(let i=0;i<400;i++) bb.updateTruck(0.05);
    o.zustand2=bb.truck.state; o.angedockt=Math.round(bb.truck.g.position.x*100)/100;
    o.torOffen=bb.doorIsOpen(); o.laderaum=!!bb.truck.raum; o.pakete=bb.truck.boxes.length;
    o.paketArten=bb.truck.boxes.map(m=>m.userData.kind);
    o.laderaumVon=Math.round(bb.lrFront()*10)/10; o.laderaumBis=bb.LR.rear;
    return o; })));

  console.log('AUSLADEN:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    // Spieler steht im Laderaum
    bb.setView(-22.5,-2,0,0);
    o.drinnen=bb.trailerOccupied();
    while(bb.truck.cargo.length){ S.carrying=null; bb.takeBox(bb.truck.cargo[0]); }
    S.carrying=null; bb.updateCarry();
    o.leer=bb.truck.cargo.length===0; o.paketeWeg=bb.truck.boxes.length;
    for(let i=0;i<80;i++) bb.updateTruck(0.05);
    o.bleibtStehen=bb.truck&&bb.truck.state==='docked';   // weil Spieler noch drin steht
    bb.setView(-14,-2,0,0);                                // Spieler geht raus
    o.draussen=!bb.trailerOccupied();
    for(let i=0;i<60;i++) bb.updateTruck(0.05);
    o.zustand=bb.truck?bb.truck.state:'weg'; o.torFaehrtZu=bb.door.target===0;
    for(let i=0;i<400;i++) bb.updateTruck(0.05);
    o.torZu=bb.door.t<0.02; o.sperrtWieder=!!bb.door.col;
    for(let i=0;i<600;i++) bb.updateTruck(0.05);
    o.lkwWeg=!bb.truck;
    return o; })));

  console.log('ERRORS:',errs.length?errs.slice(0,5):'keine');
  await b.close();
})();

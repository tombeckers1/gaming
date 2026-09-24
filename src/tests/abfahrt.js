/* Startmaske: Neues Spiel -> Namensmaske -> aufschliessen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  /* Seit den Kapiteln ist das Lager am Anfang gesperrt; dieser Test
     braucht den LKW an der Rampe */
  await p.evaluate(()=>{ const bb=window.__bb; if(bb&&bb.S&&!bb.S.up.lager){ bb.S.up.lager=true; bb.oeffneZone('lager',true); } });
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  await p.waitForTimeout(400);
  console.log('ABFAHRT:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.doorOpen(false); for(let i=0;i<300;i++) bb.updateTruck(0.05);
    bb.spawnTruck([{type:'boeller',q:1},{type:'wunder',q:1}],'mertens','Mertens');
    for(let i=0;i<600;i++) bb.updateTruck(0.05);
    o.angedockt=bb.truck.state;
    o.klappeFlach=+bb.truck.bruecke.rotation.z.toFixed(2);
    bb.setView(-22.5,-2,0,0);
    while(bb.truck.cargo.length){ bb.S.carrying=null; bb.takeBox(bb.truck.cargo[0]); }
    bb.S.carrying=null; bb.updateCarry();
    for(let i=0;i<40;i++) bb.updateTruck(0.05);
    o.drinBleibtStehen=bb.truck.state;          // Spieler noch im Laderaum
    bb.setView(-14,-2,0,0);
    /* Phase 1: Klappe hoch, Tor muss dabei oben bleiben */
    let torWaehrendKlappe=[], g0=0;
    while(bb.truck&&bb.truck.state==='docked'&&g0++<200) bb.updateTruck(0.05);
    o.ersterZustand=bb.truck.state;
    while(bb.truck&&bb.truck.state==='flap'&&g0++<400){ bb.updateTruck(0.05); torWaehrendKlappe.push(+bb.door.t.toFixed(2)); }
    o.schritteKlappe=torWaehrendKlappe.length;
    o.nachKlappe={zustand:bb.truck?bb.truck.state:'weg',klappe:bb.truck?+bb.truck.flap.toFixed(2):null,winkel:bb.truck&&bb.truck.bruecke?+bb.truck.bruecke.rotation.z.toFixed(2):null};
    o.torBliebOben=torWaehrendKlappe.every(t=>t>2.9);
    /* Phase 2: Erst faehrt das Tor zu, dann erst der LKW weg. Er
       darf sich keinen Zentimeter bewegen, solange das Tor noch
       offen ist - sonst sieht man ihn durch die Oeffnung fahren. */
    let fehler=null, guard=0;
    const xZu=bb.truck?bb.truck.g.position.x:0;
    while(bb.truck&&bb.truck.state==='torzu'&&guard++<3000){ bb.updateTruck(0.05);
      if(!bb.truck) break;
      if(Math.abs(bb.truck.g.position.x-xZu)>0.02) fehler='LKW faehrt, waehrend das Tor noch zufaehrt';
      if(bb.truck.flap<0.99) fehler=fehler||'Klappe faellt wieder herunter'; }
    o.fehler=fehler;
    o.torWarZuVorAbfahrt=bb.truck?bb.door.t<=0.05:null;
    o.nachTor=bb.truck?{zustand:bb.truck.state,tor:+bb.door.t.toFixed(2),raum:!!bb.truck.raum,aussen:bb.truck.g.visible}:'weg';
    /* Phase 3: LKW faehrt weg */
    for(let i=0;i<2000&&bb.truck;i++) bb.updateTruck(0.05);
    o.amEnde=bb.truck?'noch da':'weg';
    return o;
  })));
  console.log('ZUENDPULT:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const a=bb.STATION_POS?bb.STATION_POS:null;
    /* Spieler ans Pult stellen und zuenden */
    bb.S.level=20; bb.S.money=9000;
    bb.setView(5.9,-7.4,0,0);
    const vorher=+bb.camYaw().toFixed(3);
    bb.S.carrying={type:'raketen',count:3,q:1};
    bb.placeOnStation(bb.stations.rampe);
    bb.firePult();
    for(let i=0;i<60;i++) bb.step(0.05);
    const nach=bb.camYaw();
    /* Soll: Blick auf die Mitte zwischen den beiden Plaetzen */
    const m=bb.testfeldMitte(), pos=bb.playerPos();
    const soll=Math.atan2(-(m.x-pos.x),-(m.z-pos.z));
    let d=nach-soll; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
    o.vorher=vorher; o.nachher=+nach.toFixed(3); o.soll=+soll.toFixed(3);
    o.abweichungGrad=+(Math.abs(d)*180/Math.PI).toFixed(1);
    o.pultDrehung=+bb.pultYaw().toFixed(3);
    return o;
  })));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

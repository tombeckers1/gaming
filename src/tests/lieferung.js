/* Reihenfolge an der Rampe: Der LKW faehrt an, dann geht das Tor
   hoch. Nach dem Ausladen geht erst das Tor zu und dann faehrt der
   LKW weg - nicht umgekehrt. Vorher ging das Tor zuerst auf und
   man sah eine graue Wand auf sich zurollen. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});

  let bad=0;
  const sag=(t,ok,n)=>{ console.log(`${t}: ${ok?'ok':'FEHLER'}${n!==undefined?' ('+n+')':''}`); if(!ok) bad++; };

  const o=await p.evaluate(()=>{
    const bb=window.__bb, r={};
    /* Der Spieler steht im Lager, nicht im Weg */
    bb.setView(-14,-2,0,0);
    bb.spawnTruck(['tbox','tbox','tbox'],'mertens','Mertens');
    r.startZustand=bb.truck.state;
    r.torAmStart=+bb.door.t.toFixed(2);
    /* Phase 1: anfahren. Das Tor darf sich dabei nicht ruehren. */
    let torWaehrendAnfahrt=[], x0=bb.truck.g.position.x, gefahren=false, g=0;
    while(bb.truck&&bb.truck.state==='anfahrt'&&g++<2000){
      bb.updateTruck(0.05);
      if(!bb.truck) break;
      torWaehrendAnfahrt.push(+bb.door.t.toFixed(2));
      if(bb.truck.g.position.x>x0+0.1) gefahren=true;
    }
    r.istGefahren=gefahren;
    r.torBliebZuBeimAnfahren=torWaehrendAnfahrt.every(t=>t<=0.05);
    r.nachAnfahrt=bb.truck.state;
    r.stehtAnDerRampe=Math.abs(bb.truck.g.position.x-bb.LR.rear)<0.05;
    /* Phase 2: Tor hoch, dann andocken */
    g=0; while(bb.truck&&bb.truck.state==='torauf'&&g++<2000) bb.updateTruck(0.05);
    r.nachTorauf=bb.truck.state;
    r.torOffen=bb.doorIsOpen();
    r.laderaum=!!bb.truck.raum;
    /* Phase 3: ausladen */
    bb.truck.cargo.length=0;
    g=0; while(bb.truck&&bb.truck.state==='docked'&&g++<400) bb.updateTruck(0.05);
    r.nachDocked=bb.truck.state;
    g=0; while(bb.truck&&bb.truck.state==='flap'&&g++<600) bb.updateTruck(0.05);
    r.nachKlappe=bb.truck?bb.truck.state:'weg';
    /* Phase 4: Tor zu - der LKW darf sich dabei nicht bewegen */
    const xZu=bb.truck?bb.truck.g.position.x:0;
    let bewegt=false;
    g=0; while(bb.truck&&bb.truck.state==='torzu'&&g++<3000){
      bb.updateTruck(0.05);
      if(bb.truck&&Math.abs(bb.truck.g.position.x-xZu)>0.02) bewegt=true;
    }
    r.stehtStillBisTorZu=!bewegt;
    r.torZuVorAbfahrt=bb.truck?bb.door.t<=0.05:null;
    r.nachTorzu=bb.truck?bb.truck.state:'weg';
    /* Phase 5: wegfahren */
    g=0; while(bb.truck&&g++<3000) bb.updateTruck(0.05);
    r.amEnde=bb.truck?'noch da':'weg';
    r.torAmEnde=+bb.door.t.toFixed(2);
    return r;
  });

  sag(`beim Spawn faehrt er an (${o.startZustand})`,o.startZustand==='anfahrt');
  sag(`Tor ist beim Spawn zu (${o.torAmStart})`,o.torAmStart<=0.05);
  sag('er faehrt wirklich rueckwaerts',o.istGefahren===true);
  sag('das Tor bleibt beim Anfahren zu',o.torBliebZuBeimAnfahren===true);
  sag(`danach wartet er aufs Tor (${o.nachAnfahrt})`,o.nachAnfahrt==='torauf');
  sag('er steht an der Rampe',o.stehtAnDerRampe===true);
  sag(`Tor offen, dann angedockt (${o.nachTorauf})`,o.nachTorauf==='docked'&&o.torOffen===true);
  sag('Laderaum ist begehbar',o.laderaum===true);
  sag(`nach dem Ausladen geht die Klappe hoch (${o.nachDocked})`,o.nachDocked==='flap');
  sag(`danach faehrt erst das Tor zu (${o.nachKlappe})`,o.nachKlappe==='torzu');
  sag('der LKW steht still, bis das Tor zu ist',o.stehtStillBisTorZu===true);
  sag('das Tor ist zu, bevor er losfaehrt',o.torZuVorAbfahrt===true);
  sag(`dann faehrt er weg (${o.nachTorzu})`,o.nachTorzu==='out');
  sag('am Ende ist er weg',o.amEnde==='weg');
  sag(`das Tor ist am Ende zu (${o.torAmEnde})`,o.torAmEnde<=0.05);

  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):(bad?`ERRORS: ${bad} Punkte`:'ERRORS: keine'));
  await b.close();
})();

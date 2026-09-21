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
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const bb=window.__bb,out={};
    const inScene=o=>{ let n=o; while(n){ if(n===bb.scene) return true; n=n.parent; } return false; };
    let zone=null; bb.scene.traverse(o=>{ if(o.material&&o.material.map&&o.rotation&&Math.abs(o.rotation.x+Math.PI/2)<0.01&&Math.abs(o.position.y-0.022)<0.001) zone=o; });
    out.zoneX=zone?+zone.position.x.toFixed(2):null;
    out.brueckeVorher=!!(bb.truck&&bb.truck.bruecke);
    bb.S.money=50000;
    bb.doorOpen(false); for(let i=0;i<300;i++) bb.updateTruck(0.05);
    bb.spawnTruck([{type:'knallerbsen',q:1},{type:'boeller',q:1}],'mertens','Mertens');
    for(let i=0;i<450;i++) bb.updateTruck(0.05);
    out.zustand=bb.truck&&bb.truck.state;
    out.aussenSichtbar=bb.truck.g.visible;
    out.brueckeAngedockt=!!(bb.truck&&bb.truck.bruecke&&inScene(bb.truck.bruecke));
    out.brueckeKinder=bb.truck.bruecke.children.length;
    out.brueckeObj=!!(bb.truck&&bb.truck.bruecke);
    // ausladen und rausgehen
    bb.setView(-22.5,-2,0,0);
    while(bb.truck&&bb.truck.cargo.length){ bb.S.carrying=null; bb.takeBox(bb.truck.cargo[0]); }
    bb.S.carrying=null; bb.updateCarry();
    bb.setView(-14,-2,0,0);
    for(let i=0;i<1200;i++) bb.updateTruck(0.05);
    out.zustandEnde=bb.truck?bb.truck.state:'weg';
    out.aussenNachher=bb.truck?bb.truck.g.visible:'lkw weg';
    out.brueckeDanach=bb.truck?!!bb.truck.bruecke:'lkw weg';
    return out;
  });
  console.log('BRUECKE',JSON.stringify(r));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

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
  await neuesSpiel(p); await p.waitForTimeout(200);
  const o=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.level=10; S.money=25000; ['REGAL:klein','REGAL:standard','REGAL:standard'].forEach(id=>bb.testKauf(id)); S.money=5000; bb.openShop(); bb.run(60,0.05);
    let c=bb.customers[0];
    if(!c){ bb.run(60,0.05); c=bb.customers[0]; }
    if(!c) return {noCustomer:true};
    c.items=[{type:'wunder',price:1.49}]; c.thief=true; c.startSteal();
    bb.pl.x=c.pos.x+0.2; bb.pl.z=c.pos.z+1.6;
    const dx=c.pos.x-bb.pl.x, dz=c.pos.z-bb.pl.z;
    bb.setView(bb.pl.x,bb.pl.z,Math.atan2(-dx,-dz),0);
    const before=bb.DS.caught;
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyG',bubbles:true}));
    o.sprayLabel=document.getElementById('tool').textContent;
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));
    o.caught=bb.DS.caught-before; o.state=c.state; o.items=c.items.length;
    // Umbau
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF',bubbles:true}));
    o.modeTxt=document.getElementById('mode').textContent.slice(0,12);
    const m=bb.movables.find(x=>x.kind==='shelf');
    const old={x:m.g.position.x,z:m.g.position.z};
    // greifen wie im Spiel: Ziel setzen und Aktion
    bb.pl.x=m.g.position.x; bb.pl.z=m.g.position.z+2.2;
    bb.setView(bb.pl.x,bb.pl.z,Math.PI,0);
    bb.step(0.05);
    o.targetKind=(function(){ return document.getElementById('prompt').textContent; })();
    return o;
  });
  console.log('R:',JSON.stringify(o));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

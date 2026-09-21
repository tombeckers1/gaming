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

  console.log('TUER:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,o={};
    bb.setView(0,0,0,0);                              // Spieler in der Ladenmitte, weit weg
    for(let i=0;i<120;i++) bb.updateSchiebetuer(0.05);
    o.zuWennWegE=Math.round(bb.tuer.t*100)/100; o.sperrt=!!bb.tuer.col;
    o.fluegelZu=bb.tuer.leaves.map(l=>Math.round(l.position.x*100)/100);
    bb.setView(0,4.6,0,0);                            // Spieler laeuft auf die Tuer zu
    o.erkannt=bb.tuerNah();
    for(let i=0;i<30;i++) bb.updateSchiebetuer(0.05);
    o.nach1_5s=Math.round(bb.tuer.t*100)/100;
    for(let i=0;i<40;i++) bb.updateSchiebetuer(0.05);
    o.offen=Math.round(bb.tuer.t*100)/100; o.sperrtOffen=!!bb.tuer.col;
    o.fluegelOffen=bb.tuer.leaves.map(l=>Math.round(l.position.x*100)/100);
    bb.setView(0,0,0,0);                              // wieder weg
    for(let i=0;i<120;i++) bb.updateSchiebetuer(0.05);
    o.wiederZu=Math.round(bb.tuer.t*100)/100; o.sperrtWieder=!!bb.tuer.col;
    return o; })));

  console.log('KUNDE:',JSON.stringify(await p.evaluate(()=>{ const bb=window.__bb,S=bb.S,o={};
    bb.setView(0,-4,0,0);                             // Spieler hinten im Laden
    for(let i=0;i<120;i++) bb.updateSchiebetuer(0.05);
    o.zu=Math.round(bb.tuer.t*100)/100;
    S.level=8; bb.openShop();
    let maxT=0, kamRein=false;
    for(let i=0;i<4000;i++){ bb.step(0.05);
      if(bb.tuer.t>maxT) maxT=bb.tuer.t;
      if(bb.customers.some(c=>c.pos.z<5.5)) kamRein=true;
      if(kamRein&&maxT>0.9) break; }
    o.kundenDa=bb.customers.length; o.tuerGingAuf=Math.round(maxT*100)/100; o.kundeDrin=kamRein;
    return o; })));

  console.log('ERRORS:',errs.length?errs.slice(0,5):'keine');
  await b.close();
})();

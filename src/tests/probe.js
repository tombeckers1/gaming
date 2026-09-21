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
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined');
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(200);
  console.log(JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.money=5000; S.level=4;
    ['shelf_klein','shelf_klein','shelf_standard'].forEach(id=>bb.buyUp(id));
    o.regale=bb.shelves.map(s=>s.kind);
    o.faecher=bb.allLevels().length;
    o.freigeschaltet=Object.keys(bb.P).filter(t=>S.level>=bb.P[t].lvl&&!bb.P[t].noShelf).length;
    // Alles randvoll stopfen
    const types=Object.keys(bb.P).filter(t=>S.level>=bb.P[t].lvl&&!bb.P[t].noShelf);
    bb.allLevels().forEach((lv,i)=>{ const t=types[i%types.length];
      for(let k=0;k<200;k++) if(!bb.addToLevel(lv,t,1)) break; });
    o.imRegal=bb.allLevels().reduce((a,l)=>a+l.count,0);
    o.sorten=[...new Set(bb.allLevels().map(l=>l.type).filter(Boolean))].length;
    o.intervall=Math.round(bb.spawnInterval()*10)/10;
    let gespawnt=0; const orig=bb.customers.length;
    bb.openShop();
    for(let i=0;i<7200;i++){ bb.step(0.05);
      if(bb.belt.length) bb.scanBelt(bb.belt[0]);
      const r=bb.regCustomer();
      if(r&&r.state==='pay'){ if(r.method==='card') r.finishCard(); else r.finishCash(Math.round((r.given-r.total)*100)/100); }
      if(bb.phase==='after') break; }
    o.bedient=bb.DS.customers; o.verkauft=bb.DS.sold; o.umsatz=Math.round(bb.DS.revenue);
    o.verpasst=bb.DS.missed; o.genervt=bb.DS.angry;
    o.restImRegal=bb.allLevels().reduce((a,l)=>a+l.count,0);
    o.proKunde=Math.round(bb.DS.revenue/Math.max(1,bb.DS.customers)*100)/100;
    o.fixkosten=bb.fixedCosts();
    return o;
  })));
  console.log('ERRORS:',errs.length?errs:'keine');
  await b.close();
})();

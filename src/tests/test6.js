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
  const p=await b.newPage({viewport:{width:1180,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined');
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(200);
  // Gier-Test: platzt der Deal?
  const G=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.level=20; bb.S.money=99999; bb.buyUp('grosskunden');
    bb.phase='open'; bb.clock=600; bb.phone.cd=0.01; bb.run(1,0.05); bb.answerPhone();
    for(let i=0;i<8;i++) bb.haggle(0.2);
    o.geplatztAngezeigt=document.getElementById('dLine').textContent;
    o.knoepfeAus=document.querySelector('#dHaggle button').disabled;
    return o;
  });
  await p.waitForTimeout(1800);
  const G2=await p.evaluate(()=>({dialogZu:!document.getElementById('deal').classList.contains('show'),auftrag:!!window.__bb.order}));
  console.log('GIER:',JSON.stringify(G),JSON.stringify(G2));
  // Blindgänger bei Billigware
  const D=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    let duds=0;
    for(let r=0;r<40;r++){
      bb.S.carrying={type:'boeller',count:1,q:0.7};
      bb.placeOnStation(bb.stations.tisch);
    }
    const alt=[]; bb.run(0.1,0.05);
    o.aufgebaut=bb.stations.tisch.items.length;
    bb.firePult(); bb.run(20,0.05);
    o.leerDanach=bb.stations.tisch.items.length===0;
    return o;
  });
  console.log('BLINDGAENGER-LAUF:',JSON.stringify(D));
  // Screenshots der neuen Fenster
  await p.evaluate(()=>{ const bb=window.__bb; bb.phase='open'; bb.phone.cd=0.01; bb.phone.state=null; bb.order=null; bb.run(1,0.05); bb.answerPhone(); });
  await p.waitForTimeout(120); await p.screenshot({path:'/tmp/n_deal.png'});
  await p.evaluate(()=>{ window.__bb.declineDeal(); window.__bb.S.carrying=null; window.__bb.gravBlanks=5; window.__bb.openGravInput(); document.getElementById('gravIn').value='Frohes Neues, Mama'; });
  await p.waitForTimeout(120); await p.screenshot({path:'/tmp/n_grav.png'});
  await p.evaluate(()=>{ window.__bb.closeGravInput(false); window.__bb.openLaptop(); });
  await p.waitForTimeout(150); await p.screenshot({path:'/tmp/n_order.png'});
  console.log('ERRORS:',errs.length?errs.join('|'):'keine');
  await b.close();
})();

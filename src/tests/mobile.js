/* Startmaske: Neues Spiel -> Namensmaske -> aufschliessen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium, devices } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined');
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await p.screenshot({path:'/tmp/m_start.png'});
  await neuesSpiel(p); await p.waitForTimeout(250);
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.money=1480; bb.S.level=7; bb.S.xp=240; bb.S.loan={amount:1000,remaining:820,term:10,rate:0.012,paid:0};
    bb.S.staff.reinigung=true; bb.hireStaff('reinigung'); bb.addDirt(1,1); bb.addDirt(2,0); bb.step(0.05); });
  await p.screenshot({path:'/tmp/m_hud.png'});
  await p.evaluate(()=>window.__bb.openLaptop()); await p.waitForTimeout(120);
  await p.screenshot({path:'/tmp/m_laptop.png'});
  console.log('compact?',await p.evaluate(()=>document.body.classList.contains('compact')),'coarse?',await p.evaluate(()=>document.body.classList.contains('coarse')));
  console.log('errors:',errs.length?errs.join('|'):'keine');
  await b.close();
})();

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
  const p=await b.newPage({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined');
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(200);
  const before=await p.evaluate(()=>{ const bb=window.__bb; bb.addXP(150); return {lvl:bb.S.level,xp:bb.S.xp,money:Math.round(bb.S.money)}; });
  await p.evaluate(()=>window.__bb.openLaptop());
  await p.evaluate(()=>document.querySelector('#ltabs button[data-tab="shop"]').click()); await p.waitForTimeout(80);
  await p.evaluate(()=>document.querySelector('#lbody button[data-a="test"]').click()); await p.waitForTimeout(100);
  await p.screenshot({path:'/tmp/t_on.png'});
  const on=await p.evaluate(()=>{ const bb=window.__bb; return {lvl:bb.S.level,money:Math.round(bb.S.money),test:!!bb.S.test,
    unlocked:Object.keys(bb.S.prices).filter(t=>bb.S.level>=0).length}; });
  await p.evaluate(()=>document.querySelector('#ltabs button[data-tab="order"]').click()); await p.waitForTimeout(80);
  const rows=await p.evaluate(()=>({total:document.querySelectorAll('#lbody .row').length,locked:document.querySelectorAll('#lbody .row.locked').length}));
  await p.screenshot({path:'/tmp/t_order.png'});
  // speichern + neu laden
  await p.evaluate(()=>{ window.__bb.closeLaptop(false); window.__bb.save(); });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(200);
  const afterReload=await p.evaluate(()=>({lvl:window.__bb.S.level,test:!!window.__bb.S.test,money:Math.round(window.__bb.S.money)}));
  // wieder ausschalten
  await p.evaluate(()=>window.__bb.openLaptop());
  await p.evaluate(()=>document.querySelector('#ltabs button[data-tab="shop"]').click()); await p.waitForTimeout(80);
  await p.evaluate(()=>document.querySelector('#lbody button[data-a="test"]').click()); await p.waitForTimeout(100);
  const off=await p.evaluate(()=>({lvl:window.__bb.S.level,xp:window.__bb.S.xp,money:Math.round(window.__bb.S.money),test:!!window.__bb.S.test}));
  await p.evaluate(()=>document.querySelector('#ltabs button[data-tab="order"]').click()); await p.waitForTimeout(80);
  const rows2=await p.evaluate(()=>({total:document.querySelectorAll('#lbody .row').length,locked:document.querySelectorAll('#lbody .row.locked').length}));
  console.log('vorher   ',JSON.stringify(before));
  console.log('test an  ',JSON.stringify(on),'Bestellliste',JSON.stringify(rows));
  console.log('neu laden',JSON.stringify(afterReload));
  console.log('test aus ',JSON.stringify(off),'Bestellliste',JSON.stringify(rows2));
  console.log('errors:',errs.length?errs.join('|'):'keine');
  await b.close();
})();

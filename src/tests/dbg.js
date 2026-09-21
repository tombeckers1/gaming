const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage();
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined');
  await p.click('#startBtns button'); await p.waitForTimeout(150);
  await p.evaluate(()=>{ window.__bb.S.money=77777; window.__bb.save(); });
  console.log('nach save, keys:',await p.evaluate(()=>Object.keys(localStorage)));
  await p.evaluate(()=>localStorage.clear());
  console.log('nach clear, keys:',await p.evaluate(()=>Object.keys(localStorage)));
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  console.log('buttons:',await p.evaluate(()=>[...document.querySelectorAll('#startBtns button')].map(b=>b.textContent)));
  await p.click('#startBtns button'); await p.waitForTimeout(150);
  console.log('geld:',await p.evaluate(()=>window.__bb.S.money), 'regale:',await p.evaluate(()=>window.__bb.shelves.length));
  await b.close();
})();

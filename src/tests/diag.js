const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage();
  p.on('pageerror',e=>console.log('PAGEERROR:',e.message));
  p.on('console',m=>console.log('CONSOLE['+m.type()+']:',m.text()));
  p.on('requestfailed',r=>console.log('REQFAIL:',r.url().slice(0,70)));
  await p.goto('file://'+process.argv[2]);
  await p.waitForTimeout(6000);
  console.log('THREE?',await p.evaluate(()=>typeof window.THREE));
  console.log('__bb?',await p.evaluate(()=>typeof window.__bb));
  await b.close();
})();

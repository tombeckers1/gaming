const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage();
  p.on('pageerror',e=>console.log('PAGEERROR:',e.message,'\n',(e.stack||'').split('\n').slice(0,4).join('\n')));
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_CERT')<0) console.log('CONSOLE:',m.text()); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForTimeout(4000);
  console.log('__bb da?', await p.evaluate(()=>typeof window.__bb));
  await b.close();
})();

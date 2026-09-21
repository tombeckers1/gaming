const { chromium } = require('/opt/node22/lib/node_modules/playwright');
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:960,height:600}});
  const errs=[],warns=[];
  p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ const t=m.text(); if(m.type()==='error'&&t.indexOf('ERR_CERT')<0) errs.push('CONSOLE: '+t.slice(0,200)); if(m.type()==='warning'&&/post|shader|webgl|GL_/i.test(t)) warns.push(t.slice(0,160)); });
  await p.goto('file://'+process.argv[2]+'#test');
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  await p.waitForTimeout(600);
  console.log('ENGINE:',JSON.stringify(await p.evaluate(()=>({
    three:THREE.REVISION, pp:typeof PP.EffectComposer, n8ao:typeof N8AOPostPass,
    postOK:window.__bb.postOK, postOn:window.__bb.postOn,
    composer:!!window.__bb.composer, env:!!window.__bb.scene.environment,
    stufe:window.__bb.gfx().id
  }))));
  for(const i of [0,1,2]){
    const r=await p.evaluate(async(i)=>{
      const bb=window.__bb; bb.setGfx(i);
      await new Promise(r2=>setTimeout(r2,80));
      const q=bb.gfx();
      return {stufe:q.name, postOK:bb.postOK, ao:!!bb.n8Pass, bloom:!!bb.bloomFx, smaa:!!bb.smaaFx,
        env:!!bb.scene.environment, schatten:bb.scene.children.length>0&&q.schatten,
        strahlenSichtbar:bb.strahlen.filter(m=>m.visible).length};
    },i);
    console.log('STUFE '+i+':',JSON.stringify(r));
  }
  console.log('GRADING:',JSON.stringify(await p.evaluate(async()=>{
    const bb=window.__bb;
    bb.setGfx(2);
    bb.setView(0,0,0,0); for(let k=0;k<25;k++) bb.renderFrame(0.05);
    const innen={drinnen:bb.drinnen(),tint:bb.gradeTint};
    bb.setView(0,14,0,0); for(let k=0;k<25;k++) bb.renderFrame(0.05);
    const aussen={drinnen:bb.drinnen(),tint:bb.gradeTint};
    return {innen,aussen,warmerInnen:innen.tint[0]>aussen.tint[0],kuehlerAussen:aussen.tint[2]>innen.tint[2]};
  })));
  /* Bild kommt wirklich raus? */
  console.log('BILD:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb; const d=bb.shot();
    return {laenge:d.length, istBild:d.startsWith('data:image/jpeg')};
  })));
  console.log('ERRORS:',errs.length?errs.slice(0,5).join('\n'):'keine');
  console.log('WARNS:',warns.length?warns.slice(0,4).join('\n'):'keine');
  await b.close();
})();

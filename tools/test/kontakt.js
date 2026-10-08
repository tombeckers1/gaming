const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SP=process.env.SP+'/m11';
async function neuesSpiel(p){
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:30000});
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:560}}); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://'+process.argv[2]);
  await neuesSpiel(p);
  const bild=async(n)=>{ await p.waitForTimeout(250); await p.screenshot({path:SP+'/k_'+n+'.png'}); };
  /* Ansicht auf ein Ziel: Abstand d, Hoehe ab Augen, von Richtung (dx,dz) */
  const blick=(ziel,d,wink,pitch)=>p.evaluate(([ziel,d,wink,pitch])=>{ const bb=__bb; const x=ziel.x+Math.sin(wink)*d, z=ziel.z+Math.cos(wink)*d;
    const yaw=Math.atan2(-(ziel.x-x),-(ziel.z-z)); bb.setView(x,z,yaw,pitch); bb.shot(); },[ziel,d,wink,pitch]);
  /* Laden vorbereiten */
  await p.evaluate(()=>{ const bb=__bb,S=bb.S; S.level=30; S.money=9e5; 
    ['kassierer','auffueller','security','packer'].forEach(id=>{ S.staff[id]=true; bb.hireStaff(id); }); bb.openShop(); });
  await p.evaluate(()=>{ const bb=__bb; for(let i=0;i<24&&bb.customers.length<2;i++) bb.run(5,0.05); });
  const info=await p.evaluate(()=>{ const bb=__bb; return {kunden:bb.customers.length,personal:Object.keys(bb.staff).filter(k=>bb.staff[k]),kpos:bb.customers.map(c=>[c.g.position.x,c.g.position.z,c.state])}; });
  console.log('LAGE',JSON.stringify(info));
  /* 1/2 Kunden nah */
  const pos=await p.evaluate(()=>__bb.customers.map(c=>({x:c.g.position.x,z:c.g.position.z})));
  const pk=await p.evaluate(()=>{ const bb=__bb; return Object.fromEntries(Object.keys(bb.staff).filter(k=>bb.staff[k]).map(k=>[k,{x:bb.staff[k].g.position.x,z:bb.staff[k].g.position.z}])); });
  console.log('PERSONAL',JSON.stringify(pk));
  if(pos[0]){ await blick({x:pos[0].x,z:pos[0].z,y:1.2},2.0,0.6,-0.05); await bild('kunde1'); }
  if(pos[1]){ await blick({x:pos[1].x,z:pos[1].z},3.2,-0.7,-0.1); await bild('kunde2'); }
  /* Kasse mit Kassierer */
  if(pk.kassierer){ await blick(pk.kassierer,4.5,0.5,-0.2); await bild('kasse_weit'); await blick(pk.kassierer,1.9,0.0,-0.1); await bild('kassierer'); }
  if(pk.packer){ await blick(pk.packer,2.3,0.4,-0.1); await bild('packer'); }
  if(pk.auffueller){ await blick(pk.auffueller,2.3,-0.5,-0.1); await bild('auffueller'); }
  else if(pk.security){ await blick(pk.security,2.3,-0.5,-0.1); await bild('security'); }
  /* Kunde mit Korb / Tasche (erzwungen) */
  if(pos[2]||pos[0]){ const i=pos[2]?2:0;
    await p.evaluate(i=>{ const c=__bb.customers[i]; __bb.personTraegt(c.g,'korb'); },i); const q=await p.evaluate(i=>({x:__bb.customers[i].g.position.x,z:__bb.customers[i].g.position.z}),i);
    await blick(q,2.4,0.9,-0.12); await bild('korb'); }
  if(pos[3]||pos[1]){ const i=pos[3]?3:1;
    await p.evaluate(i=>{ const c=__bb.customers[i]; __bb.personTraegt(c.g,'tuete'); },i); const q=await p.evaluate(i=>({x:__bb.customers[i].g.position.x,z:__bb.customers[i].g.position.z}),i);
    await blick(q,2.4,-0.9,-0.12); await bild('tuete'); }
  /* Karton in der Hand */
  const T=await p.evaluate(()=>{ const bb=__bb,S=bb.S;
    const ware=bb.ORDER.filter(t=>bb.P[t]&&!bb.P[t].noOrder&&!bb.P[t].cold&&bb.P[t].dims&&bb.P[t].box>=8);
    let lv=null,T=null; for(const l of bb.allLevels()){ if(l.type) continue; T=ware.find(t=>bb.shelfAccepts(l.sh,t)&&bb.capOf(l,t)>=2*bb.P[t].box&&!bb.allLevels().some(x=>x.type===t)); if(T){ lv=l; break; } }
    window.__lv=lv; for(const c of bb.customers.slice()){ c.g.visible=false; } for(const k in bb.staff){ if(bb.staff[k]) bb.staff[k].g.visible=false; }
    S.carrying={type:T,count:bb.P[T].box,q:1}; bb.updateCarry(); bb.run(0.3,1/30);
    const sh=lv.sh; const m=sh.g||sh.mesh||sh; return {T,x:sh.pos?sh.pos.x:null}; });
  console.log('KARTON',JSON.stringify(T));
  const vor=await p.evaluate(()=>{ const bb=__bb, pl=bb.playerPos(); return pl; });
  await p.evaluate(()=>{ const bb=__bb; bb.run(0.3,1/30); bb.shot(); }); await bild('karton_zu');
  await p.keyboard.press('KeyC'); await p.evaluate(()=>{ __bb.run(0.8,1/30); __bb.shot(); }); await bild('karton_offen');
  await p.evaluate(()=>{ const bb=__bb, lv=window.__lv, c=bb.S.carrying; const n=Math.floor(c.count*0.6); for(let i=0;i<n&&c.count>0&&lv;i++){ bb.stockOne(lv); } bb.run(1.5,1/30); bb.shot(); }); await bild('karton_halb');
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
  /* Handy */
  const b2=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const h=await b2.newPage({viewport:{width:430,height:900},isMobile:true,hasTouch:true}); h.setDefaultTimeout(600000);
  const e2=[]; h.on('pageerror',e=>e2.push('PAGEERROR: '+e.message));
  await h.goto('file://'+process.argv[2]); await neuesSpiel(h);
  await h.evaluate(()=>{ const bb=__bb,S=bb.S; S.level=30; S.money=9e5; ['kassierer','auffueller'].forEach(id=>{S.staff[id]=true; bb.hireStaff(id);}); bb.clock=12*60; bb.openShop(); for(let i=0;i<8;i++) bb.run(15,0.05);
    const c=bb.customers[0]; if(c){ const x=c.g.position.x+Math.sin(0.5)*2.6,z=c.g.position.z+Math.cos(0.5)*2.6; bb.setView(x,z,Math.atan2(-(c.g.position.x-x),-(c.g.position.z-z)),-0.1);} bb.shot(); });
  await h.waitForTimeout(300); await h.screenshot({path:SP+'/k_handy.png'});
  console.log('ERRORS_HANDY:',e2.length?e2.join('\n'):'keine');
  await b2.close();
})();

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_CERT')<0) errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  console.log('HUD:',JSON.stringify(await p.evaluate(()=>{
    const $=id=>document.getElementById(id),o={};
    o.sterneWeg=!$('hRep');
    o.xpBalken=!!$('hXp')&&$('hXp').closest('.tag')!==null;
    o.xpText=$('hXpTxt').textContent;
    o.meter=[...document.querySelectorAll('.tl .meter')].map(m=>m.id);
    return o;
  })));
  console.log('DEKO:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,$=id=>document.getElementById(id),o={};
    o.wandLevel=bb.WALLS?null:null;
    bb.openLaptop();
    document.querySelector('#ltabs button[data-tab="deko"]').click();
    const t=$('lbody').textContent;
    o.keinAbLevel=!/ab Lvl/.test(t);
    o.keineListe=!/Creme · Reinweiß|Grauer Estrich ·/.test(t);
    o.swatchesAktiv=[...document.querySelectorAll('#lbody .sw')].filter(b=>!b.disabled).length;
    o.swatchesGesamt=document.querySelectorAll('#lbody .sw').length;
    bb.setWall('salbei'); o.wandGesetzt=bb.S.wall;
    bb.setFloor('holz'); o.bodenGesetzt=bb.S.floor;
    o.geldUnveraendert=bb.S.money;
    bb.closeLaptop(false);
    return o;
  })));
  console.log('SCHNEE:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb;
    for(let i=0;i<200;i++) bb.step(0.05);
    let drin=0,gesamt=0;
    const ar=bb.snowPts.geometry.attributes.position.array;
    for(let i=0;i<ar.length;i+=3){ const x=ar[i],y=ar[i+1],z=ar[i+2]; gesamt++;
      if(y<3.6&&((x>-19.8&&x<-8.2&&z>-5.8&&z<1.8)||(x>-7.8&&x<7.8&&z>-5.8&&z<5.8))) drin++; }
    return {flocken:gesamt,imGebaeude:drin};
  })));
  console.log('LKW:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.doorOpen(false); for(let i=0;i<400;i++) bb.updateTruck(0.05);
    o.torVorher=+bb.door.t.toFixed(2);
    bb.spawnTruck([{type:'boeller',q:1}],'mertens','Mertens');
    o.zustand0=bb.truck.state; o.torFaehrtAuf=bb.door.target>0;
    let g=0; while(bb.truck.state==='torauf'&&g++<600) bb.updateTruck(0.05);
    o.torOffenBeiFahrtbeginn=+bb.door.t.toFixed(2); o.zustand1=bb.truck.state;
    const x0=bb.truck.g.position.x;
    while(bb.truck.state==='reverse'&&g++<2000) bb.updateTruck(0.05);
    o.rueckwaerts=bb.truck.g.position.x>x0; o.zustand2=bb.truck.state;
    /* ausladen und rausfahren */
    bb.setView(-22.5,-2,0,0);
    while(bb.truck.cargo.length){ bb.S.carrying=null; bb.takeBox(bb.truck.cargo[0]); }
    bb.S.carrying=null; bb.updateCarry(); bb.setView(-14,-2,0,0);
    while(bb.truck&&bb.truck.state==='docked'&&g++<600) bb.updateTruck(0.05);
    while(bb.truck&&bb.truck.state==='flap'&&g++<900) bb.updateTruck(0.05);
    o.zustand3=bb.truck?bb.truck.state:'weg';
    o.torNochOffen=+bb.door.t.toFixed(2);
    let torZuBei=null, fehler=null;
    while(bb.truck&&g++<6000){
      const vor=bb.door.target;
      bb.updateTruck(0.05);
      if(!bb.truck) break;
      if(vor!==0&&bb.door.target===0) torZuBei=+bb.truck.g.position.x.toFixed(2);
      if(bb.door.target===0&&bb.truck.g.position.x>bb.TOR.x-0.5) fehler='Tor zu obwohl LKW noch im Tor';
    }
    o.torSchliesstBeiX=torZuBei; o.fehler=fehler;
    return o;
  })));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

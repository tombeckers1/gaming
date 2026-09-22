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
  /* Neue Reihenfolge: erst faehrt der LKW an, dann erst geht das Tor
     hoch; am Ende erst das Tor zu, dann faehrt er weg. Die Feinheiten
     prueft lieferung.js, hier nur die Reihenfolge. */
  console.log('LKW:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.doorOpen(false); for(let i=0;i<400;i++) bb.updateTruck(0.05);
    o.torVorher=+bb.door.t.toFixed(2);
    bb.spawnTruck([{type:'boeller',q:1}],'mertens','Mertens');
    o.zustand0=bb.truck.state;
    o.torBleibtZu=bb.door.target===0;
    let g=0; while(bb.truck&&bb.truck.state==='anfahrt'&&g++<4000) bb.updateTruck(0.05);
    o.zustand1=bb.truck?bb.truck.state:'weg';
    o.torFaehrtAufNachAnfahrt=bb.door.target>0;
    while(bb.truck&&bb.truck.state!=='docked'&&g++<6000) bb.updateTruck(0.05);
    o.zustand2=bb.truck?bb.truck.state:'weg';
    o.torOffen=+bb.door.t.toFixed(2);
    bb.setView(-22.5,-2,0,0);
    let s=0; while(bb.truck&&bb.truck.cargo.length&&s++<60){ bb.S.carrying=null; bb.takeBox(bb.truck.cargo[0]); }
    o.laderaumLeer=bb.truck?bb.truck.cargo.length===0:null;
    bb.S.carrying=null; bb.updateCarry(); bb.setView(-14,-2,0,0);
    let torZuVorAbfahrt=null, fehler=null, xZu=null;
    while(bb.truck&&g++<9000){
      const st=bb.truck.state;
      bb.updateTruck(0.05);
      if(!bb.truck) break;
      if(st==='torzu'){ if(xZu===null) xZu=bb.truck.g.position.x;
        else if(Math.abs(bb.truck.g.position.x-xZu)>0.02) fehler='LKW faehrt, waehrend das Tor noch zufaehrt'; }
      if(bb.truck.state==='out'&&torZuVorAbfahrt===null) torZuVorAbfahrt=bb.door.t<=0.05;
    }
    o.torWarZuVorAbfahrt=torZuVorAbfahrt; o.fehler=fehler; o.amEnde=bb.truck?'noch da':'weg';
    return o;
  })));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

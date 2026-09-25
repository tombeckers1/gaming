/* Einraeumer (Tom, 24.09.):
   - am Handy unter Team: je Einraeumer drei Aufgaben, Reihenfolge
     per Pfeil, jede an/aus; bleibt nach dem Neuladen
   - "LKW direkt ins Regal": Karton vom LKW direkt ins Verkaufsregal,
     der Rest ins Lagerregal - nichts landet auf dem Boden
   - der Karton ist in der Hand sichtbar (mit dem Produktaufdruck),
     am Regal klappt er auf, die Stuecke wandern einzeln ins Fach
   - nur "Verkaufsregale" an: er nimmt den Karton im Lager, nicht den LKW
   - alles aus: er steht nur herum
   Aufruf: node einraeumer.js real.html [bild-praefix] */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:640}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const pre=process.argv[3];
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  /* 1. Einstellen am Handy */
  const ui=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=20; S.money=1e6; S.up.lager=true; bb.applyZonen();
    S.staff.auffueller=true; bb.hireStaff('auffueller');
    o.std=bb.einrOf('auffueller').reihe.slice();
    bb.openHandy('staff');
    const k=v=>{ const e=document.querySelector(`#hApp [data-a="einr"][data-t="auffueller"][data-v="${v}"]`); if(e) e.click(); return !!e; };
    o.knoepfe=k('hoch:regal')&&k('hoch:regal')&&k('an:lager');
    o.danach={reihe:bb.einrOf('auffueller').reihe.slice(),aktiv:bb.einrAktiv('auffueller')};
    o.text=document.getElementById('hApp').textContent.indexOf('LKW direkt ins Regal')>=0;
    bb.closeHandy&&bb.closeHandy();
    return o; });
  console.log('HANDY   ',JSON.stringify(ui));
  pruef('HANDY',ui.knoepfe&&ui.text&&ui.danach.reihe.join()==='regal,direkt,lager'&&ui.danach.aktiv.join()==='regal,direkt','Einstellen am Handy: '+JSON.stringify(ui));

  /* 2. Direkt vom LKW ins Regal, Stueck fuer Stueck, Karton sichtbar */
  const d=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={}, w=bb.staff.auffueller;
    const e=bb.einrOf('auffueller'); e.reihe=['direkt','lager','regal']; e.aus={};
    while(bb.racks.length<1&&bb.regalStellen('rack'));
    /* ein Produkt mit leerem Fach suchen */
    /* ein Fach leeren, damit das Produkt Platz im Regal hat */
    const platz=()=>{ if(!bb.shelves.length) bb.regalStellen('standard');
      const lv=bb.allLevels().find(l=>l.type&&!bb.P[l.type].noOrder&&!bb.P[l.type].cold);
      const T=lv?lv.type:bb.ORDER.find(t=>!bb.P[t].noOrder&&!bb.P[t].cold&&bb.emptyLevel(t)&&!bb.floorBoxes.some(x=>x.type===t));
      bb.allLevels().filter(l=>l.type===T).forEach(l=>{ while(l.count>0) bb.removeFromLevel(l); }); return T; };
    const T=platz(); o.T=T; bb.floorBoxes.slice().forEach(x=>bb.removeFloorBox(x));
    const boden0=bb.floorBoxes.length;
    bb.spawnTruck([{type:T,q:1},{type:T,q:1},{type:T,q:1}],'mertens','Mertens');
    for(let i=0;i<400&&!(bb.truck&&bb.truck.state==='docked');i++) bb.run(0.1,0.1);
    o.lkw=bb.truck&&bb.truck.state;
    const regal0=bb.shelfStockOf(T);
    let lagerMax=0; const imLagerT=()=>{ let n=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type===T) n+=s.box.count; })); return n; };
    let sprung=0, sichtbar=false, aufdruck=false, klappeAuf=0, flug=false, vorher=regal0, n=0;
    /* 160 s: seit dem 25.09. geht er durch die Tuer statt quer durch
       die Wand - der echte Weg ist ein paar Sekunden laenger */
    const wand=(x,z)=>bb.colliders.some(c=>x>c.minX+0.05&&x<c.maxX-0.05&&z>c.minZ+0.05&&z<c.maxZ-0.05);
    let inWand=0;
    for(let i=0;i<3200;i++){ bb.run(0.05,0.05); if(wand(w.pos.x,w.pos.z)) inWand++;
      const k=w.kiste;
      if(k&&k.visible&&w.carry&&w.state==='toShelf'){ sichtbar=true; aufdruck=k.userData.koerper.material[0]===bb.kartonMat[T]; }
      if(k&&w.state==='fill') klappeAuf=Math.max(klappeAuf,Math.abs(k.userData.klappen[0].pv.rotation.x));
      if(w.flug) flug=true;
      lagerMax=Math.max(lagerMax,imLagerT());
      const jetzt=bb.shelfStockOf(T); sprung=Math.max(sprung,jetzt-vorher); vorher=jetzt;
      if(i%200===0&&window.__bild) window.__bild(i);
      if(!bb.truck&&w.state==='idle'&&!w.carry) { n=i; break; }
    }
    o.imRegal=bb.shelfStockOf(T)-regal0; o.sprung=sprung; o.sichtbar=sichtbar; o.aufdruck=aufdruck; o.klappe=+klappeAuf.toFixed(2); o.flug=flug;
    let lager=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type===T) lager+=s.box.count; }));
    o.imLager=lager; o.lagerMax=lagerMax; o.boden=bb.floorBoxes.length-boden0; o.gesamt=o.imRegal+lager; o.soll=3*bb.P[T].box; o.lkwWeg=!bb.truck; o.sek=n*0.05; o.inWand=inWand;
    return o; });
  console.log('DIREKT  ',JSON.stringify(d));
  pruef('DIREKT',d.lkw==='docked'&&d.imRegal>0&&d.gesamt===d.soll&&d.boden===0&&d.lagerMax===0,'direkt ins Regal / Rest ins Lager: '+JSON.stringify(d));
  pruef('WAND',d.inWand===0,'der Einraeumer laeuft durch Waende oder Regale ('+d.inWand+' Bilder)');
  pruef('KARTON',d.sichtbar&&d.aufdruck,'Karton nicht sichtbar in der Hand: '+JSON.stringify(d));
  pruef('AUF',d.klappe>1.5,'Karton klappt nicht auf: '+d.klappe);
  pruef('STUECK',d.flug&&d.sprung===1,'nicht Stueck fuer Stueck (Sprung '+d.sprung+', Flug '+d.flug+')');

  /* Bild: Einraeumer am Regal mit offenem Karton */
  if(pre){
    await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, w=bb.staff.auffueller;
      const lv=bb.allLevels().find(l=>l.type&&!bb.P[l.type].cold); const T=lv?lv.type:'wunder'; bb.allLevels().filter(l=>l.type===T).forEach(l=>{ while(l.count>0) bb.removeFromLevel(l); });
      bb.spawnFloorBox(T,bb.P[T].box,{x:-6,y:0.2,z:1.5,ry:0});
      const e=bb.einrOf('auffueller'); e.reihe=['regal','direkt','lager']; e.aus={};
      for(let i=0;i<600&&!(w.state==='fill'&&w.flug&&w.flug.t>0.4);i++) bb.run(0.05,0.05);
      document.querySelectorAll('#hud,.tip,#tip,#zielPfeil').forEach(e=>e.style.display='none');
      const V=w.pos, ry=w.g.rotation.y, cx=V.x+Math.sin(ry+0.9)*1.9, cz=V.z+Math.cos(ry+0.9)*1.9;
      bb.setView(cx,cz,Math.atan2(cx-V.x,cz-V.z),-0.12); bb.renderFrame(1/60); });
    await p.screenshot({path:pre+'_fuellen.png'});
    await p.evaluate(()=>{ const bb=window.__bb, w=bb.staff.auffueller; for(let i=0;i<30&&w.state==='fill';i++) bb.run(0.05,0.05);
      const T=bb.ORDER.find(t=>bb.emptyLevel(t)&&!bb.P[t].noOrder)||'wunder'; });
  }

  /* 3. nur Verkaufsregale an: LKW bleibt stehen, Karton aus dem Lager */
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={}, w=bb.staff.auffueller;
    for(let i=0;i<200&&w.state!=='idle';i++) bb.run(0.05,0.05);
    const e=bb.einrOf('auffueller'); e.reihe=['regal','direkt','lager']; e.aus={direkt:true,lager:true};
    /* ein Fach leeren, damit das Produkt Platz im Regal hat */
    const platz=()=>{ if(!bb.shelves.length) bb.regalStellen('standard');
      const lv=bb.allLevels().find(l=>l.type&&!bb.P[l.type].noOrder&&!bb.P[l.type].cold);
      const T=lv?lv.type:bb.ORDER.find(t=>!bb.P[t].noOrder&&!bb.P[t].cold&&bb.emptyLevel(t)&&!bb.floorBoxes.some(x=>x.type===t));
      bb.allLevels().filter(l=>l.type===T).forEach(l=>{ while(l.count>0) bb.removeFromLevel(l); }); return T; };
    const T=platz();
    const box=bb.spawnFloorBox(T,bb.P[T].box,null,1);
    bb.spawnTruck([{type:'wunder',q:1},{type:'wunder',q:1}],'mertens','Mertens');
    for(let i=0;i<400&&!(bb.truck&&bb.truck.state==='docked');i++) bb.run(0.1,0.1);
    const ladung=bb.truck?bb.truck.cargo.length:-1;
    for(let i=0;i<500;i++) bb.run(0.05,0.05);
    o.lkwUnberuehrt=bb.truck?bb.truck.cargo.length===ladung:false; o.kartonGeholt=bb.floorBoxes.indexOf(box)<0;
    /* 4. alles aus */
    e.aus={regal:true,direkt:true,lager:true};
    for(let i=0;i<200&&w.state!=='idle';i++) bb.run(0.05,0.05);
    const l2=bb.truck?bb.truck.cargo.length:-1;
    for(let i=0;i<400;i++) bb.run(0.05,0.05);
    o.ausRuht=(bb.truck?bb.truck.cargo.length:-1)===l2&&w.state==='idle';
    o.prompt=bb.einrAktiv('auffueller').length;
    bb.save(); return o; });
  console.log('NURREGAL',JSON.stringify(r));
  pruef('NURREGAL',r.lkwUnberuehrt&&r.kartonGeholt,'nur Regale: '+JSON.stringify(r));
  pruef('AUS',r.ausRuht,'alles aus, trotzdem gearbeitet: '+JSON.stringify(r));

  /* 5. Einstellung bleibt nach dem Neuladen */
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:first-child',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const nl=await p.evaluate(()=>window.__bb.einrOf('auffueller'));
  console.log('LADEN   ',JSON.stringify(nl));
  pruef('LADEN',nl.reihe.join()==='regal,direkt,lager'&&nl.aus.regal&&nl.aus.lager,'Einstellung nach dem Neuladen weg: '+JSON.stringify(nl));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

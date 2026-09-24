/* Putzen und Laptops (Tom, 24.09.):
   - Kunden machen weniger Dreck (Flecken je Kunde deutlich unter dem
     alten Wert von rund 0,25)
   - wer wischt, hat einen Bodenwischer in der Hand: der Kopf liegt
     auf dem Fleck, der Stiel reicht bis vor die Kamera, der Fleck
     verblasst
   - die Reinigungskraft traegt den Wischer, beim Arbeiten liegt der
     Kopf auf dem Fleck
   - die Laptops zeigen einen bewegten Bildschirmschoner
   Aufruf: node wischen.js real.html [bild-praefix] */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:560}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const pre=process.argv[3];
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const bild=async n=>{ if(pre) await p.screenshot({path:pre+'_'+n+'.png'}); };

  /* 1. Spieler wischt */
  const sp=await p.evaluate(()=>{ const bb=window.__bb; bb.run(0.3,0.05);
    bb.dirts.slice().forEach(d=>{ d.work=1; bb.cleanTick(d); });
    const d=bb.addDirt(0.5,1.5); bb.setView(0.5,3.1,0,-0.62); bb.run(0.1,0.05);
    const o={}; for(let i=0;i<3;i++){ bb.cleanTick(d); bb.run(0.05,0.05); }
    bb.renderFrame(1/60);
    const w=bb.wischer, u=w.userData, k=new (u.kopf.position.constructor)(); u.kopf.getWorldPosition(k);
    const top=new (k.constructor)(0,0,0); u.aussen.getWorldPosition(top);
    o.sicht=w.visible; o.kopf=[+k.x.toFixed(2),+k.y.toFixed(2),+k.z.toFixed(2)]; o.fleck=[d.m.position.x,d.m.position.z];
    o.abstandFleck=+Math.hypot(k.x-d.m.position.x,k.z-d.m.position.z).toFixed(2);
    const c=bb.camera.position; o.griffZurKamera=+Math.hypot(top.x-c.x,top.y-c.y,top.z-c.z).toFixed(2);
    o.deckkraft=+d.m.material.opacity.toFixed(2); o.anderer=bb.dirts.filter(x=>x!==d).map(x=>x.m.material.opacity);
    return o; });
  await bild('spieler');
  const weg=await p.evaluate(()=>{ const bb=window.__bb; const d=bb.dirts[0]; for(let i=0;i<10;i++) bb.cleanTick(d); bb.run(0.6,0.05); return {rest:bb.dirts.length,sicht:bb.wischer.visible}; });
  console.log('SPIELER ',JSON.stringify(sp),JSON.stringify(weg));
  pruef('SPIELER',sp.sicht&&sp.abstandFleck<0.3&&Math.abs(sp.kopf[1])<0.05,'Wischer liegt nicht auf dem Fleck: '+JSON.stringify(sp));
  pruef('SPIELER',sp.griffZurKamera<0.7,'Stiel endet nicht vor der Kamera ('+sp.griffZurKamera+' m)');
  pruef('SPIELER',sp.deckkraft<0.7,'Fleck verblasst beim Wischen nicht ('+sp.deckkraft+')');
  pruef('SPIELER',weg.rest===0&&!weg.sicht,'nach dem Wischen: '+JSON.stringify(weg));

  /* 2. Reinigungskraft */
  const rk=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; S.level=40; S.money=1e6;
    bb.hireStaff('reinigung'); bb.phase='open'; bb.clock=700; const w=bb.staff.reinigung;
    bb.run(0.2,0.05);
    const o={traegt:!!(w.wischer&&w.wischer.parent===w.g)};
    const d=bb.addDirt(w.pos.x+2,w.pos.z-1.5);
    let arbeit=false; for(let i=0;i<200&&!arbeit;i++){ bb.run(0.05,0.05); if(w.state==='work') arbeit=true; }
    bb.run(0.5,0.05);
    o.arbeitet=arbeit;
    /* gemessen am Fleck, den sie gerade wischt - im offenen Laden kann
       nebenbei ein zweiter entstehen, der naeher liegt */
    if(arbeit){ const k=new (w.pos.constructor)(); w.wischer.userData.kopf.getWorldPosition(k); const z=w.target||d;
      o.abstandFleck=+Math.hypot(k.x-z.m.position.x,k.z-z.m.position.z).toFixed(2); o.deckkraft=+z.m.material.opacity.toFixed(2);
      bb.setView(w.pos.x+2.2,w.pos.z+2.2,Math.atan2(2.2,2.2),-0.35); bb.run(0.05,0.05); bb.renderFrame(1/60); }
    return o; });
  await bild('personal');
  console.log('PERSONAL',JSON.stringify(rk));
  pruef('PERSONAL',rk.traegt,'Reinigungskraft hat keinen Wischer');
  pruef('PERSONAL',rk.arbeitet&&rk.abstandFleck<0.35&&rk.deckkraft<0.85,'wischt nicht auf dem Fleck: '+JSON.stringify(rk));

  /* 3. Bildschirmschoner */
  const sch=await p.evaluate(()=>{ const bb=window.__bb;
    const o=bb.SCHONER[0], m=o.mesh; const wp=new (bb.camera.position.constructor)(); m.getWorldPosition(wp);
    bb.setView(wp.x+0.9,wp.z+0.9,Math.atan2(0.9,0.9),-0.4);
    const px=()=>o.g.getImageData(0,0,o.w,o.h).data;
    bb.run(2,0.05); const a=px(); bb.run(1.5,0.05); const c=px();
    let diff=0, hell=0; for(let i=0;i<a.length;i+=4){ if(Math.abs(a[i]-c[i])+Math.abs(a[i+1]-c[i+1])>30) diff++; if(c[i]+c[i+1]+c[i+2]>500) hell++; }
    bb.renderFrame(1/60);
    return {anzahl:bb.SCHONER.length,bewegt:diff,hell,karte:m.material.map===o.t}; });
  await bild('laptop');
  console.log('SCHONER ',JSON.stringify(sch));
  pruef('SCHONER',sch.anzahl>=1&&sch.karte&&sch.bewegt>200&&sch.hell>20,'Bildschirmschoner steht oder fehlt: '+JSON.stringify(sch));

  /* 4. Dreck: ein Tag mit Kunden */
  const dr=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S;
    bb.fireStaff&&bb.fireStaff('reinigung');
    bb.regalStellen('standard'); bb.regalStellen('standard'); const sorten=['wunder','knallerbsen','tisch','knallfrosch']; bb.allLevels().forEach((l,i)=>{ for(let k=0;k<8;k++) bb.addToLevel(l,sorten[i%4],1); });
    bb.phase='closed'; bb.dirts.slice().forEach(d=>{ d.work=1; bb.cleanTick(d); }); bb.DS.dreck=0; bb.DS.customers=0;
    const gesehen=new Set();
    bb.openShop(); for(let i=0;i<300&&bb.phase==='open';i++){ bb.run(2,0.1); bb.customers.forEach(c=>gesehen.add(c)); if(i%10===0) bb.allLevels().forEach((l,j)=>{ for(let k=0;k<3;k++) bb.addToLevel(l,sorten[j%4],1); }); }
    /* alle Kunden, die hereinkamen - bezahlt hat ohne Kassierer keiner */
    return {kunden:gesehen.size,dreck:bb.DS.dreck||0}; });
  dr.jeKunde=dr.kunden?+(dr.dreck/dr.kunden).toFixed(3):null;
  console.log('DRECK   ',JSON.stringify(dr));
  pruef('DRECK',dr.kunden>=15&&dr.jeKunde<0.2,'zu viel Dreck oder zu wenig Kunden: '+JSON.stringify(dr));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

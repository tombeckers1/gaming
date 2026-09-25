/* Kasse (Toms PDF vom 25.09.): steht links vom Eingang an der
   Trennwand, Blende in Korpusfarbe mit heller Schrift rechts,
   Kunden stehen an und zahlen, alte Spielstaende mit der nie
   verschobenen Kasse ziehen an den neuen Platz um, verschobene
   bleiben, wo sie sind. */
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
  const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const lage=await p.evaluate(()=>{ const bb=window.__bb, g=bb.ckG;
    const r=v=>+v.toFixed(2);
    /* Kundenseite = lokale +z, Schlange und erster Platz */
    const kunde=bb.spotPos(0), schlange=bb.spotPos(3), weg=bb.queueApproach();
    const c=bb.ckMovable.col;
    return {x:r(g.position.x),z:r(g.position.z),ry:r(g.rotation.y),home:bb.CK_HOME,
      kunde:{x:r(kunde.x),z:r(kunde.z)},schlange:{x:r(schlange.x),z:r(schlange.z)},weg:{x:r(weg.x),z:r(weg.z)},
      fuss:c?{x0:r(c.x0!==undefined?c.x0:c.minX),x1:r(c.x1!==undefined?c.x1:c.maxX),z0:r(c.z0!==undefined?c.z0:c.minZ),z1:r(c.z1!==undefined?c.z1:c.maxZ)}:null,
      kassierer:(()=>{ const w=g.localToWorld?null:null; const s=Math.sin(g.rotation.y), co=Math.cos(g.rotation.y);
        return {x:r(g.position.x+(-0.25)*co+(-0.85)*s),z:r(g.position.z-(-0.25)*s+(-0.85)*co)}; })()}; });
  console.log('LAGE    ',JSON.stringify(lage));
  /* links vom Eingang (Tuer bei x 0), vor der Trennwand bei x 2 */
  pruef('LAGE',lage.x>0.3&&lage.x<1.3&&lage.z>0&&lage.z<4,'Kasse nicht links vom Eingang: '+JSON.stringify(lage));
  pruef('LAGE',lage.kunde.x<lage.x-0.5,'Kundenseite zeigt nicht in den Raum');
  pruef('LAGE',lage.kassierer.x>lage.x+0.5&&lage.kassierer.x<1.65,'Kassiererplatz passt nicht zwischen Kasse und Wand: '+JSON.stringify(lage.kassierer));
  pruef('LAGE',lage.schlange.z<lage.kunde.z&&lage.weg.z<lage.schlange.z,'Schlange laeuft nicht von hinten auf die Tuer zu');
  pruef('LAGE',!lage.fuss||lage.fuss.z1<5.0,'Kasse steht in der Tuer: '+JSON.stringify(lage.fuss));

  /* Blende: Grund in Korpusfarbe, helle Schrift in der rechten Haelfte */
  const blende=await p.evaluate(()=>{ const bb=window.__bb, c=bb.ckNameTex.image, g=c.getContext('2d'), W=c.width, H=c.height;
    const d=g.getImageData(0,0,W,H).data; let n=0, sx=0, rechts=0;
    for(let y=0;y<H;y+=2) for(let x=0;x<W;x+=2){ const i=(y*W+x)*4, l=d[i]+d[i+1]+d[i+2]; if(l>600){ n++; sx+=x; rechts=Math.max(rechts,x); } }
    const e=g.getImageData(4,4,1,1).data; return {grund:[e[0],e[1],e[2]],n,mitte:+(sx/Math.max(1,n)/W).toFixed(2),rechts:+(rechts/W).toFixed(3)}; });
  console.log('BLENDE  ',JSON.stringify(blende));
  pruef('BLENDE',blende.grund[0]===0x2b&&blende.grund[1]===0x2e&&blende.grund[2]===0x34,'Grund nicht in Korpusfarbe: '+blende.grund);
  pruef('BLENDE',blende.n>300&&blende.mitte>0.58&&blende.rechts>0.93,'helle Schrift steht nicht rechts: '+JSON.stringify(blende));

  /* Kunden stehen an und zahlen beim Kassierer */
  const tag=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; S.money=50000; S.level=12;
    ['REGAL:standard','REGAL:standard'].forEach(id=>bb.testKauf(id));
    S.staff.kassierer=true; bb.hireStaff('kassierer');
    const types=['wunder','knallerbsen','tisch','knallfrosch'], lvs=bb.allLevels();
    types.forEach((t,i)=>{ const lv=lvs[i]; if(!lv) return; for(let k=0;k<60;k++) if(!bb.addToLevel(lv,t)) break; });
    let maxQ=0; bb.openShop(); for(let i=0;i<240;i++){ bb.run(1,0.05); maxQ=Math.max(maxQ,bb.queue.length); }
    return {kunden:bb.DS.customers,verkauft:bb.DS.sold,umsatz:Math.round(bb.DS.revenue),maxQ,wuetend:bb.DS.angry}; });
  console.log('TAG     ',JSON.stringify(tag));
  pruef('TAG',tag.verkauft>=10&&tag.umsatz>0,'an der neuen Kasse wird kaum bezahlt: '+JSON.stringify(tag));

  /* Alter Stand mit der Kasse am alten Platz -> zieht um; verschoben -> bleibt */
  const KEY='boellerbude_v3';
  const lade=async ck=>{ await p.evaluate(([ck,KEY])=>{ const bb=window.__bb; bb.save(); window.addEventListener('visibilitychange',e=>e.stopImmediatePropagation(),true); const d=JSON.parse(localStorage.getItem(KEY)); d.ck=ck; localStorage.setItem(KEY,JSON.stringify(d)); },[ck,KEY]);
    await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
    await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
    await p.click('#startBtns button'); await p.waitForTimeout(400);
    return p.evaluate(()=>{ const g=window.__bb.ckG; return {x:+g.position.x.toFixed(2),z:+g.position.z.toFixed(2),ry:+g.rotation.y.toFixed(3)}; }); };
  const alt=await lade({x:-5,z:3.2,ry:0});
  const versch=await lade({x:-3,z:-2,ry:0});
  console.log('STAND   ',JSON.stringify({alt,versch}));
  pruef('STAND',Math.abs(alt.x-lage.home.x)<0.01&&Math.abs(alt.z-lage.home.z)<0.01,'alte Kasse zieht nicht um: '+JSON.stringify(alt));
  pruef('STAND',versch.x===-3&&versch.z===-2,'verschobene Kasse springt weg: '+JSON.stringify(versch));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

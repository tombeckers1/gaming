/* Tutorial mit Zielmarkern (Tom, 24.09.):
   - erster Tipp zeigt auf den Laptop, mit Entfernung
   - schaut man weg, zeigt ein Pfeil am Bildrand die Richtung
   - direkt davor verschwindet der Marker
   - der Marker folgt dem Tipp (Kiosk: Warenannahme vor der Tuer)
   - ohne Tutorial gestartet: keine Tipps, keine Marker; im
     Pausenmenue wieder einschaltbar; bleibt nach dem Neuladen
   Aufruf: node tutorial.js real.html [bild-praefix] */
async function neuesSpiel(p,tut){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  if(tut===false) await p.click('#tutInput');
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
  const zustand=()=>p.evaluate(()=>{ const bb=window.__bb; bb.run(0.25,0.05); bb.updateHUD(); bb.updateZiel(0.05); bb.renderFrame(1/60);
    const z=bb.zielAktuell, pf=document.getElementById('zielPfeil');
    let sicht=false; bb.scene.traverse(o=>{ if(o.renderOrder===30&&o.isSprite&&o.visible&&o.parent&&o.parent.visible) sicht=true; });
    return {key:bb.tipKey,ziel:z?[+z.x.toFixed(1),+z.z.toFixed(1)]:null,marker:sicht,rand:pf.style.display==='block',tip:document.getElementById('tip').textContent.slice(0,40)}; });

  /* 1. Start: Tipp Regal -> Laptop, Blick auf den Laptop */
  const lap=await p.evaluate(()=>{ const bb=window.__bb, v=new (bb.camera.position.constructor)(); bb.lapHitPos=null;
    const h=bb.zielFuer('shelf'); bb.setView(h.x+6,h.z+2,Math.atan2(6,2),-0.1); return h; });
  const s1=await zustand();
  if(pre) await p.screenshot({path:pre+'_laptop.png'});
  console.log('START   ',JSON.stringify(s1));
  pruef('START',s1.key==='shelf'&&s1.marker&&!s1.rand&&Math.abs(s1.ziel[0]-lap.x)<0.2,'Marker zeigt nicht auf den Laptop: '+JSON.stringify(s1));

  /* 2. Weggedreht: Randpfeil */
  await p.evaluate(()=>{ const bb=window.__bb, h=bb.zielFuer('shelf'); bb.setView(h.x+6,h.z+2,Math.atan2(6,2)+Math.PI,-0.1); });
  const s2=await zustand();
  if(pre) await p.screenshot({path:pre+'_rand.png'});
  console.log('WEG     ',JSON.stringify(s2));
  pruef('RAND',s2.rand,'kein Randpfeil, wenn das Ziel hinter einem liegt');

  /* 3. Direkt davor: kein Marker */
  await p.evaluate(()=>{ const bb=window.__bb, h=bb.zielFuer('shelf'); bb.setView(h.x+0.9,h.z+0.3,Math.atan2(0.9,0.3),-0.2); });
  const s3=await zustand();
  console.log('NAH     ',JSON.stringify(s3));
  pruef('NAH',!s3.marker&&!s3.rand,'Marker bleibt direkt vor dem Ziel');

  /* 4. Der Marker folgt dem Tipp: Kiosk-Lieferung vor der Tuer */
  const s4=await p.evaluate(()=>{ const bb=window.__bb; bb.S.tut.shelf=true; bb.S.tut.order=true; bb.setView(0,0,0,0); return 1; }).then(zustand);
  console.log('KIOSK   ',JSON.stringify(s4),JSON.stringify(await p.evaluate(()=>window.__bb.WA)));
  const wa=await p.evaluate(()=>window.__bb.WA);
  pruef('FOLGT',s4.key==='lkw'&&s4.ziel&&Math.abs(s4.ziel[0]-wa.x)<0.1&&Math.abs(s4.ziel[1]-wa.z)<0.1,'Marker folgt dem Tipp nicht: '+JSON.stringify(s4));

  /* 5. Pausenmenue: ausblenden */
  await p.evaluate(()=>window.__bb.showPause());
  await p.evaluate(()=>{ document.getElementById('pTut').click(); document.getElementById('pBtn').click(); });
  const s5=await zustand();
  console.log('AUS     ',JSON.stringify(s5));
  pruef('AUS',!s5.marker&&!s5.rand&&s5.tip===''&&!s5.key,'Tutorial laesst sich nicht ausblenden: '+JSON.stringify(s5));

  /* 6. Neues Spiel ohne Tutorial, bleibt nach dem Neuladen aus */
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p,false);
  const s6=await zustand();
  await p.evaluate(()=>window.__bb.save()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:first-child',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const s7=await zustand();
  console.log('OHNE    ',JSON.stringify(s6),JSON.stringify(s7));
  pruef('OHNE',!s6.marker&&s6.tip===''&&!s7.marker&&s7.tip==='','ohne Tutorial trotzdem Tipps: '+JSON.stringify([s6,s7]));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

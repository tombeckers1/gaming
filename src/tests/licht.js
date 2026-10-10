/* Licht im Laden (05p, 10.10., Tom: "sieht alles noch so naja aus"):
   - HOCH: Kontaktschatten (Moebel + Personen), Lichtflecken und Glanzbahnen sind angelegt
   - KONTAKT: am Fuss der Kasse wird der Boden mit Kontaktschatten sichtbar dunkler
   - PERSON: eine Person im Laden bekommt einen runden Schatten
   - AUGE: drinnen weniger Belichtung, draussen (Testfeld, Feuerwerk) unveraendert 1,05,
     die Gradierung der Bildzusammenfuehrung ist draussen aus
   - NIEDRIG: nur die Kontaktschatten (ein Zeichenaufruf), keine Lichtflecken, kein Glanz
   - ULTRALOW: nichts davon in der Szene, Belichtung unveraendert (nicht teurer als vorher)
   Gegenprobe: GEGENPROBE=1 schaltet Kontaktschatten und Augenanpassung ab -> KONTAKT und AUGE melden.
   Aufruf: node licht.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const GP=process.env.GEGENPROBE==='1';
async function laden(b,stufe){
  const p=await b.newPage({viewport:{width:640,height:400}});
  p.setDefaultTimeout(900000); p.errs=[]; p.on('pageerror',e=>p.errs.push('PAGEERROR: '+e.message));
  await p.addInitScript(s=>{ try{ if(!sessionStorage.getItem('x')){ localStorage.clear(); sessionStorage.setItem('x','1'); } localStorage.setItem('bb_gfx',s); }catch(e){} },stufe);
  await p.goto('file://'+process.argv[2],{timeout:900000,waitUntil:'domcontentloaded'});
  await p.waitForFunction("!!window.__bb&&!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000,polling:1000});
  await p.evaluate(()=>{ document.querySelector('#startBtns button:last-child').click(); document.getElementById('nameGo').click(); });
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:900000,polling:1000});
  if(GP) await p.evaluate(()=>{ const LI=__bb.LI; if(LI.schatten) LI.schatten.material.visible=false; LI.bel.innen=LI.bel.aussen; });
  return p;
}
const zustand=()=>{ const bb=__bb, LI=bb.LI, R=bb.renderer, gl=R.getContext(), out={};
  const px=()=>{ const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,a=new Uint8Array(W*H*4); gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,a); return a; };
  const calls=()=>{ R.info.autoReset=false; R.info.reset(); bb.renderFrame(0.016); R.info.autoReset=true; return R.info.render.calls; };
  let licht=0; bb.scene.traverse(o=>{ if(o.userData&&o.userData._licht) licht++; });
  out.an=LI.an; out.fehler=LI.fehler; out.licht=licht; out.flecken=!!LI.flecken; out.glanzMesh=!!LI.glanz;
  /* Kasse von schraeg vorn, Blick auf den Fuss */
  const k=bb.CK_HOME; bb.setView(k.x-2.6,k.z+0.4,-1.5,-0.55); LI.tS=-1e9; bb.shot(); const a=px();
  out.n=JSON.parse(JSON.stringify(LI.n)); out.exp=+R.toneMappingExposure.toFixed(3);
  if(LI.schatten){ const v=LI.schatten.visible; LI.schatten.visible=false; bb.shot(); const b=px(); LI.schatten.visible=v;
    let dunkler=0; for(let i=0;i<a.length;i+=4) if(b[i]+b[i+1]+b[i+2]-(a[i]+a[i+1]+a[i+2])>24) dunkler++; out.dunkler=+(dunkler/(a.length/4)).toFixed(4);
    const c1=calls(); LI.schatten.visible=false; const c0=calls(); LI.schatten.visible=true; out.callsSchatten=c1-c0; }
  /* Person mitten im Laden */
  const g=bb.makePerson({ct:0}); g.position.set(-2,0,-2); bb.scene.add(g); LI.tS=-1e9; bb.setView(-2,1.5,0,-0.4); bb.shot(); out.personen=LI.n.personen; bb.scene.remove(g);
  /* Glanz im Laden, Blick in die Tiefe */
  bb.setView(2.2,4.6,0.35,-0.12); bb.shot(); out.glanz=LI.n.glanz; out.expInnen=+R.toneMappingExposure.toFixed(3);
  /* draussen am Testfeld */
  const m=bb.testfeldMitte(); bb.setView(m.x,m.z+9,0,0.2); bb.shot(); bb.shot(); out.expAussen=+R.toneMappingExposure.toFixed(3); out.innenAussen=LI.innen;
  return out; };
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  let p=await laden(b,'hoch'); const h=await p.evaluate(zustand); console.log('HOCH',JSON.stringify(h));
  pruef('HOCH',h.an&&!h.fehler&&h.licht===3&&h.n.moebel>=2&&h.n.flecken>=20,JSON.stringify(h));
  pruef('KONTAKT',h.dunkler>0.01,'Boden am Kassenfuss nicht dunkler: '+h.dunkler+' der Pixel');
  pruef('PERSON',h.personen>=1,'kein Personenschatten');
  pruef('GLANZ',h.glanz>=3,'nur '+h.glanz+' Glanzbahnen im Laden');
  pruef('AUGE',h.expInnen<0.9&&h.expAussen===1.05&&h.innenAussen===0,'Belichtung drinnen '+h.expInnen+', draussen '+h.expAussen+' (soll 1,05)');
  pruef('EIN_AUFRUF',h.callsSchatten===1,'Kontaktschatten kosten '+h.callsSchatten+' Zeichenaufrufe');
  pruef('FEHLER_HOCH',!p.errs.length,p.errs.slice(0,3).join(' | ')); await p.close();
  p=await laden(b,'niedrig'); const n=await p.evaluate(zustand); console.log('NIEDRIG',JSON.stringify(n));
  pruef('NIEDRIG',n.an&&n.licht===1&&!n.flecken&&!n.glanzMesh&&n.callsSchatten===1&&n.n.moebel>=2,JSON.stringify(n));
  pruef('FEHLER_NIEDRIG',!p.errs.length,p.errs.slice(0,3).join(' | ')); await p.close();
  p=await laden(b,'ultralow'); const u=await p.evaluate(zustand); console.log('ULTRALOW',JSON.stringify(u));
  pruef('ULTRALOW',!u.an&&u.licht===0&&u.expInnen===1.05,JSON.stringify(u));
  pruef('FEHLER_ULTRALOW',!p.errs.length,p.errs.slice(0,3).join(' | ')); await p.close();
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK');
  console.log('ERRORS:',mangel.length?mangel.join(' | '):'keine'); await b.close();
})();

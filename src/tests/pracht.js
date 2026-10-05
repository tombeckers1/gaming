/* Pracht (03d) - Realismus fuer Maximum, Ultra, Ultra Extrem (Tom, 04.10.:
   "wie GTA", Vergleichsbilder Hoch gegen Maximum sahen gleich aus):
   - HOCH: nichts davon wird angelegt - kein Material veraendert, keine
     Verschattung in der Bildzusammenfuehrung, keine Spiegelung, die
     Schattenfilterung wie bisher
   - MAX: Relief auf Hunderten Materialien, Ladenboden und Fahrbahn als
     Spiegelflaeche, das Spiegelbild wird gezeichnet und ist nicht leer,
     die Verschattung laeuft; zur Laufzeit auf Hoch gestellt ist alles aus
   - HANDY: auch mit Ultra Extrem gewaehlt bleibt Pracht aus
   Aufruf: node pracht.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
async function laden(b,stufe,mobil){
  const p=await b.newPage(mobil?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:640,height:400}});
  p.setDefaultTimeout(900000); p.errs=[]; p.on('pageerror',e=>p.errs.push('PAGEERROR: '+e.message));
  p.on('crash',()=>{ console.log('ABSTURZ der Seite ('+stufe+')'); process.exit(3); });
  await p.addInitScript(s=>{ try{ if(!sessionStorage.getItem('x')){ localStorage.clear(); sessionStorage.setItem('x','1'); } localStorage.setItem('bb_gfx',s); }catch(e){} },stufe);
  await p.goto('file://'+process.argv[2],{timeout:900000,waitUntil:'domcontentloaded'});
  await p.waitForFunction("!!window.__bb&&!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000,polling:1000});
  await p.evaluate(()=>{ document.querySelector('#startBtns button:last-child').click(); document.getElementById('nameGo').click(); });
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:900000,polling:1000});
  return p;
}
/* Zustand nach einem Bild mitten im Laden */
const zustand=()=>{ const bb=__bb, PR=bb.PR, c=bb.camera; bb.setView(1.2,4.6,0.9,-0.3); bb.run(0.1,0.05);
  c.position.set(1.2,1.65,4.6); c.rotation.set(-0.3,0.9,0); c.updateMatrixWorld(); bb.renderFrame(0.016);
  let veredelt=0, spiegel=0; const ms=new Set();
  bb.scene.traverse(o=>{ if(!o.material) return; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(!m||ms.has(m)) return; ms.add(m);
    if(m.userData.prU) veredelt++; if(m.userData.prSp) spiegel++; }); });
  const r={stufe:bb.GFX, pracht:bb.PRACHT, an:!!PR.an, fehler:PR.fehler, veredelt, spiegel, boden:!!(bb.floorMat&&bb.floorMat.userData.prSp),
    spRT:!!PR.spRT, spK:PR.sp?PR.sp.k.value:null, ao:!!PR.aoRT, schatten:bb.renderer.shadowMap.type, coarse:document.body.classList.contains('coarse')};
  if(PR.spRT&&PR.sp.k.value>0){ const R=bb.renderer, w=PR.spRT.width, h=PR.spRT.height;
    /* Spiegelbild auslesen: Halbfloat kann readPixels nicht ueberall - dann nur Groesse */
    try{ const px=PR.spRT.texture.type===1016?new Uint16Array(w*h*4):new Uint8Array(w*h*4); R.readRenderTargetPixels(PR.spRT,0,0,w,h,px); let n=0; for(let i=0;i<px.length;i+=4) if(px[i]||px[i+1]||px[i+2]) n++; r.spInhalt=+(n/(w*h)).toFixed(2); }catch(e){ r.spInhalt='?'+e.message; }
    r.spGroesse=[w,h]; }
  return r; };
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  /* Hoch */
  let p=await laden(b,'hoch');
  const h=await p.evaluate(zustand);
  console.log('HOCH',JSON.stringify(h));
  pruef('HOCH_AUS',h.pracht===-1&&!h.an&&h.veredelt===0&&h.spiegel===0&&!h.spRT&&!h.ao,JSON.stringify(h));
  pruef('HOCH_SCHATTEN',h.schatten===1,'Schattenfilter '+h.schatten+' statt PCF (1)');
  pruef('FEHLER_HOCH',!p.errs.length,p.errs.slice(0,3).join(' | ')); await p.close();
  /* Maximum */
  p=await laden(b,'max');
  const m=await p.evaluate(zustand);
  console.log('MAX',JSON.stringify(m));
  pruef('MAX_AN',m.pracht===0&&m.an&&!m.fehler,JSON.stringify(m));
  pruef('MAX_RELIEF',m.veredelt>=100,'nur '+m.veredelt+' Materialien mit Relief');
  pruef('MAX_SPIEGEL',m.boden&&m.spiegel>=3&&m.spK===1,'Spiegelflaechen '+m.spiegel+', Boden '+m.boden+', aktiv '+m.spK);
  pruef('MAX_SPIEGELBILD',typeof m.spInhalt!=='number'||m.spInhalt>0.3,'Spiegelbild fast leer: '+m.spInhalt);
  pruef('MAX_AO',m.ao,'keine Verschattung');
  /* zur Laufzeit auf Hoch: Spiegel, Verschattung, Relief aus */
  const zu=await p.evaluate(()=>{ const bb=__bb; bb.gfxWaehlen('hoch'); bb.renderFrame(0.016); bb.renderFrame(0.016);
    return {spK:bb.PR.sp.k.value, relief:bb.PR.u.an.value, sonde:bb.PR.sonde?bb.PR.sonde.intensity:0}; });
  console.log('MAX->HOCH',JSON.stringify(zu));
  pruef('UMSCHALTEN',zu.spK===0&&zu.relief===0&&zu.sonde===0,JSON.stringify(zu));
  pruef('FEHLER_MAX',!p.errs.length,p.errs.slice(0,3).join(' | ')); await p.close();
  /* Handy mit Ultra Extrem gewaehlt */
  p=await laden(b,'extrem',true);
  const t=await p.evaluate(zustand);
  console.log('HANDY',JSON.stringify(t));
  pruef('HANDY_AUS',t.coarse&&t.pracht===-1&&!t.an&&t.veredelt===0&&t.spiegel===0&&!t.spRT,JSON.stringify(t));
  pruef('FEHLER_HANDY',!p.errs.length,p.errs.slice(0,3).join(' | ')); await p.close();
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK'); await b.close();
})();

/* Licht und Schatten innen (05p, Licht-Paket 15.10., Tom: "immer so dunkel, in eine Richtung wird es hell, Boden glaenzt komisch"):
   - RAUM: Raumlicht im Shader angelegt (Chunks gepatcht, Raeume aus dachBereiche aktiv), keine wandernden Punktlichter, kein Ladenstrahler
   - BELICHTUNG: fest 1,05 drinnen wie draussen (keine Augenanpassung), keine Innen-Abdunklung in der Bildzusammenfuehrung
   - DREHEN: an drei Orten (Laden vorn, Laden hinten, Lager; Grundausbau) einmal ganz umdrehen (8 Blicke, 45 Grad) - die Beleuchtung (Bild in grauem Einheits-
     material, ohne Inhalt) springt zwischen Nachbarbildern (45 Grad) um < 35 Grauwerte (nahe Wand/ferner Raum, nachts der Blick durchs Schaufenster aendern
     das Bild auch im Einheitsmaterial; vorher: Laden nachts 72 vs. 137 je nach Blick), Tag und Nacht
   - GLEICH: nachts liegt auf dem Boden an allen drei Orten gleich viel Licht (Einheitsmaterial, Abweichung < 15 %)
   - HELL: nachts ist der Laden innen hell (Bodenblick > 120 von 255, Licht ueberall > 110), tagsueber nichts ausgebrannt (< 3 % reines Weiss)
   - MATT: Ladenboden matt (Rauheit >= 0,6, Spiegelung <= 0,12) fuer jeden Belag
   - KONTAKT / PERSON: Kontaktschatten unter der Kasse (Boden sichtbar dunkler) und unter einer Person, EIN Zeichenaufruf je Bild
   - NIEDRIG / ULTRALOW: Kontaktschatten (ein Zeichenaufruf), Raumlicht an (gleich hell), kein Deckenlicht
   Gegenprobe: GEGENPROBE=1 schaltet Raumlicht und Kontaktschatten ab (Himmelslicht drinnen voll) -> HELL und KONTAKT melden.
   MESSUNG (16.10., Testflake-Paket): Ausreisser beim Drehtest sind kein Raumlicht-Fehler. (1) Das erste Bild nach einem Ortswechsel kann ein
   Mess-Artefakt sein (Ultra Low, 72 Teleports: 8 mal >6 Grauwerte Abweichung, Maximum 112 - untere Bildhaelfte schwarz), es ist beim 2.-3. Bild weg:
   darum 4 Aufwaermbilder nach dem Ortswechsel und je Blick der Median aus 3 grauen Bildern. (2) Mit abgeschalteter Buendelung (03b-post.js,
   localStorage bb_buendel=0) treten die starken Ausreisser nicht mehr auf (2 statt 8 von 72, Maximum 16): Das Test-Teleport trifft die Takt-Bilder
   von bWaechter/bSammeln. Der Lichttest misst Licht, nicht Buendelung - darum laeuft er ohne Buendelung. (3) Rest: Blick durchs Schaufenster
   (Ort 'laden2' bei Nacht, Ultra Low, Blick 315 Grad: gemessen 189 -> 158-162 in jedem Lauf, Sprung 26,7 / 28,6 / 31,2 je nach Aussenverkehr) -
   das ist Inhalt, kein Raumlicht: Schwelle 35 (echte Raumlicht-Spruenge waren 61-96, der alte Fehler 72 gegen 137).
   Aufruf: node -r ./ladezeit-preload.js licht.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const H=require(require('path').join(__dirname,'../../tools/test/start-hilfe.js'));
const GP=process.env.GEGENPROBE==='1';
async function laden(b,stufe){
  const p=await b.newPage({viewport:{width:480,height:300}});
  p.errs=[]; p.on('pageerror',e=>p.errs.push('PAGEERROR: '+e.message));
  /* Shader-Fehler (three meldet sie nur auf der Konsole, das Objekt bleibt dann unsichtbar) - im Spiel mitzaehlen, nicht per
     p.on('console'): jede Konsolenmeldung haelt in Playwright ihre Argumente fest, der Browserprozess wuchs so auf 6 GB */
  await p.addInitScript(()=>{ window.__shaderFehler=[]; const e=console.error; console.error=function(...a){ try{ const t=a.map(String).join(' '); if(/shader|WebGLProgram|ERROR: 0:/i.test(t)&&window.__shaderFehler.length<5) window.__shaderFehler.push(t.slice(0,300)); }catch(x){} return e.apply(this,a); }; });
  await H.laden(p,process.argv[2]);
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); localStorage.setItem('bb_buendel','0'); },stufe);   /* ohne Buendelung: s. Kopfkommentar MESSUNG */
  await H.neuladen(p); await H.neuesSpiel(p,{stoppen:true});
  /* ohne Ausbauten: mit allen Ausbauten (applyZonen + Spielschritte) wuchs der Browserprozess hier auf > 6 GB (Speichergrenze) */
  await p.evaluate(gp=>{ const bb=window.__bb; bb.run(0.5,0.05);
    if(gp){ const R=bb.RAUM; R.staerke=0; R.hemi=1; R.sig=''; if(bb.LI.schatten) bb.LI.schatten.material.visible=false; } },GP);
  return p;
}
/* in Teilen (je Ort und Tageszeit ein evaluate): ein einziges langes evaluate mit ~200 Bildern liess den Browserprozess auf > 6 GB
   wachsen (Speichergrenze) */
const zustand=(A)=>{ const bb=__bb, LI=bb.LI, R=bb.renderer, gl=R.getContext(), out={};
  const px=()=>{ const W=gl.drawingBufferWidth,H=gl.drawingBufferHeight,a=new Uint8Array(W*H*4); gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,a); return a; };
  const hell=()=>{ const a=px(); let s=0,n=0,w=0; for(let i=0;i<a.length;i+=16){ const l=0.2126*a[i]+0.7152*a[i+1]+0.0722*a[i+2]; s+=l; n++; if(l>=250) w++; } return {m:s/n,w:w/n}; };
  /* zwei Bilder: das Deckenlicht zeichnet seine Schattenkarte nur jedes 2. Bild */
  const calls=()=>{ R.info.autoReset=false; R.info.reset(); bb.renderFrame(0.016); bb.renderFrame(0.016); R.info.autoReset=true; return R.info.render.calls; };
  /* nurLicht: dasselbe Bild in grauem Einheitsmaterial (Albedo 0,5) - Beleuchtung ohne Inhalt/Belag */
  const grau=new THREE.MeshStandardMaterial({color:0x808080,roughness:1,metalness:0});
  /* Messung eingeschwungen (16.10., Messung: 72 Teleports je Stufe): das erste Bild nach einem Ortswechsel ist ein Mess-Artefakt, kein
     Spielfehler - Boden/Teile fehlen oder sind halb eingeblendet (Ultra Low Lager nachts: untere Haelfte 0-37 statt 187; Mittel 55-175
     statt 196), erst nach 2-3 Bildern stabil; dazu wackeln einzelne Bilder durch Bewegtes (Figuren). Darum: nach Ortswechsel (warm>0)
     erst 'warm' Bilder zeichnen, dann das graue Bild dreimal messen und den Median nehmen (ein Ausreisser faellt heraus). */
  const median=a=>[...a].sort((p,q)=>p-q)[a.length>>1];
  const bild=(x,z,yaw,pitch,uhr,warm)=>{ bb.setView(x,z,yaw,pitch); bb.clock=uhr; bb.run(0.05,0.05); bb.clock=uhr; bb.kameraSetzen();
    for(let i=0;i<(warm||0);i++) bb.renderFrame(0.05);
    bb.renderFrame(0.05); const h=hell();
    const L=[]; bb.scene.traverse(o=>{ if(o.userData&&o.userData._licht&&o.visible){ L.push(o); o.visible=false; } });
    bb.scene.overrideMaterial=grau; const ls=[]; for(let i=0;i<3;i++){ bb.renderFrame(0.05); ls.push(hell().m); } h.l=median(ls); bb.scene.overrideMaterial=null; for(const o of L) o.visible=true; return h; };
  if(A.was==='kopf'){
  let licht=0; bb.scene.traverse(o=>{ if(o.userData&&o.userData._licht) licht++; });
  let punkt=0, spot=0; bb.scene.traverse(o=>{ if(o.isPointLight) punkt++; if(o.isSpotLight) spot++; });
  out.an=LI.an; out.fehler=LI.fehler; out.licht=licht; out.punkt=punkt; out.spot=spot; out.raumOk=!!(bb.RAUM&&bb.RAUM.ok); out.raeume=bb.RAUM?bb.RAUM.nAktiv:0; out.raumListe=bb.RAUM?bb.RAUM.nListe:0;
  return out; }
  /* Drehen an drei Orten, Tag und Nacht */
  out.dreh={}; out.boden={};
  /* in 3 Teilen je Ort (Blick 0-3, 4-7, 8 + Boden): ein langes evaluate mit vielen Bildern laesst den Browserprozess wachsen */
  if(A.was==='dreh'){ const [uhr,tz,k,x,z]=A.ort; if(A.teil===0) window.__dr={w:[],wl:[]}; const D=window.__dr;
    const von=A.teil*4, bis=A.teil===2?8:von+3; for(let i=von;i<=bis;i++){ const q=bild(x,z,i*Math.PI/4,-0.1,uhr,i===0?4:0); D.w.push(q.m); D.wl.push(q.l); }
    if(A.teil===2){ const w=D.w, wl=D.wl;
    let mx=0, ml=0; for(let i=1;i<w.length;i++){ mx=Math.max(mx,Math.abs(w[i]-w[i-1])); ml=Math.max(ml,Math.abs(wl[i]-wl[i-1])); }
    out.dreh[k+'-'+tz]={sprungLicht:+ml.toFixed(1),sprungBild:+mx.toFixed(1),minLicht:+Math.min(...wl).toFixed(1),maxLicht:+Math.max(...wl).toFixed(1),wl:wl.map(v=>Math.round(v))};
    const b=bild(x,z,0,-0.75,uhr,0); out.boden[k+'-'+tz]={m:+b.m.toFixed(1),l:+b.l.toFixed(1),weiss:+(b.w*100).toFixed(2)};
    if(tz==='tag'){ const q=bild(x,z,0,-0.05,uhr,0); out.boden[k+'-'+tz].weissBlick=+(q.w*100).toFixed(2); } }
    return out; }
  out.exp=+R.toneMappingExposure.toFixed(3);
  /* draussen am Testfeld: gleiche Belichtung */
  const m=bb.testfeldMitte(); bild(m.x,m.z+9,0,0.2,600); out.expAussen=+R.toneMappingExposure.toFixed(3);
  /* Boden matt fuer jeden Belag */
  const fm=bb.floorMat; let rmin=1, emax=0; const alt=bb.S.floor;
  for(const f of bb.FLOORS){ bb.S.floor=f.id; bb.oberflaechenAnwenden(); if(f.art!=='velours'){ rmin=Math.min(rmin,fm.roughness); emax=Math.max(emax,fm.envMap?fm.envMapIntensity:0); } }
  bb.S.floor=alt; bb.oberflaechenAnwenden(); out.bodenRau=+rmin.toFixed(2); out.bodenEnv=+emax.toFixed(2);
  /* Kasse von schraeg vorn, Blick auf den Fuss */
  if(LI.schatten){ const k=bb.CK_HOME; bb.setView(k.x-2.6,k.z+0.4,-1.5,-0.55); LI.tS=-1e9; bb.clock=600; bb.kameraSetzen(); bb.renderFrame(0.05); const a=px();
    out.n=JSON.parse(JSON.stringify(LI.n));
    const v=LI.schatten.visible; LI.schatten.visible=false; bb.renderFrame(0.05); const c=px(); LI.schatten.visible=v;
    let dunkler=0; for(let i=0;i<a.length;i+=4) if(c[i]+c[i+1]+c[i+2]-(a[i]+a[i+1]+a[i+2])>24) dunkler++; out.dunkler=+(dunkler/(a.length/4)).toFixed(4);
    const c1=calls(); LI.schatten.visible=false; const c0=calls(); LI.schatten.visible=true; out.callsSchatten=c1-c0;
    const g=bb.makePerson({ct:0}); g.position.set(-2,0,-2); bb.scene.add(g); LI.tS=-1e9; bb.setView(-2,1.5,0,-0.4); bb.kameraSetzen(); bb.renderFrame(0.05); out.personen=LI.n.personen; bb.scene.remove(g); }
  out.shader=window.__shaderFehler||[];
  return out; };
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const allgemein=(t,h)=>{
    pruef('RAUM_'+t,h.raumOk&&h.raeume>=5&&h.spot===0,'Raumlicht '+h.raumOk+', aktive Raeume '+h.raeume+'/'+h.raumListe+', Punktlichter '+h.punkt+', Spots '+h.spot);
    pruef('BELICHTUNG_'+t,h.exp===1.05&&h.expAussen===1.05,'drinnen '+h.exp+', draussen '+h.expAussen);
    for(const k in h.dreh) pruef('DREHEN_'+t,h.dreh[k].sprungLicht<35,k+' Licht springt beim Drehen um '+h.dreh[k].sprungLicht);
    const n=['laden','laden2','lager'].map(k=>h.boden[k+'-nacht'].l), mn=Math.min(...n), mx=Math.max(...n);
    pruef('GLEICH_'+t,mx/mn<1.15,'nachts Licht auf dem Boden Laden/Sued/Lager '+n.join(' / '));
    pruef('HELL_'+t,h.boden['laden-nacht'].m>120&&mn>110,'nachts Laden Bodenblick '+h.boden['laden-nacht'].m+', Licht min '+mn);
    for(const k of ['laden','laden2','lager']) pruef('WEISS_'+t,h.boden[k+'-tag'].weiss<3&&h.boden[k+'-tag'].weissBlick<3,k+' tagsueber ausgebrannt: '+JSON.stringify(h.boden[k+'-tag']));
    pruef('MATT_'+t,h.bodenRau>=0.6&&h.bodenEnv<=0.12,'Boden Rauheit min '+h.bodenRau+', Spiegelung max '+h.bodenEnv);
  };
  const ORTE=[]; for(const [uhr,tz] of [[600,'tag'],[1320,'nacht']]) for(const [k,x,z] of [['laden',-2,1],['laden2',5,-3],['lager',-14,-2]]) ORTE.push([uhr,tz,k,x,z]);
  const messen=async p=>{ const h=await p.evaluate(zustand,{was:'kopf'}); h.dreh={}; h.boden={};
    for(const o of ORTE) for(let teil=0;teil<3;teil++){ const r=await p.evaluate(zustand,{was:'dreh',ort:o,teil}); Object.assign(h.dreh,r.dreh); Object.assign(h.boden,r.boden); }
    const r=await p.evaluate(zustand,{was:'rest'}); delete r.dreh; delete r.boden; Object.assign(h,r); return h; };
  let p=await laden(b,'hoch'); const h=await messen(p); console.log('HOCH',JSON.stringify(h));
  allgemein('HOCH',h);
  pruef('HOCH',h.an&&!h.fehler&&h.licht===1&&h.n.moebel>=2,JSON.stringify({an:h.an,fehler:h.fehler,licht:h.licht,n:h.n}));
  pruef('KONTAKT',h.dunkler>0.01,'Boden am Kassenfuss nicht dunkler: '+h.dunkler+' der Pixel');
  pruef('PERSON',h.personen>=1,'kein Personenschatten');
  pruef('EIN_AUFRUF',h.callsSchatten===2,'Kontaktschatten kosten '+h.callsSchatten+' Zeichenaufrufe');
  pruef('FEHLER_HOCH',!p.errs.length&&!h.shader.length,p.errs.concat(h.shader).slice(0,3).join(' | ')); await p.close();
  p=await laden(b,'niedrig'); const n=await messen(p); console.log('NIEDRIG',JSON.stringify(n));
  allgemein('NIEDRIG',n);
  pruef('NIEDRIG',n.an&&n.licht===1&&n.callsSchatten===2&&n.n.moebel>=2,JSON.stringify({an:n.an,licht:n.licht,calls:n.callsSchatten,n:n.n}));
  pruef('FEHLER_NIEDRIG',!p.errs.length&&!n.shader.length,p.errs.concat(n.shader).slice(0,3).join(' | ')); await p.close();
  p=await laden(b,'ultralow'); const u=await messen(p); console.log('ULTRALOW',JSON.stringify(u));
  allgemein('ULTRALOW',u);
  pruef('ULTRALOW',u.an&&u.licht===1&&u.callsSchatten===2&&u.n.moebel>=2,JSON.stringify({an:u.an,licht:u.licht,calls:u.callsSchatten,n:u.n}));
  pruef('KONTAKT_ULTRALOW',u.dunkler>0.01,'Ultra Low: Boden am Kassenfuss nicht dunkler: '+u.dunkler);
  pruef('FEHLER_ULTRALOW',!p.errs.length&&!u.shader.length,p.errs.concat(u.shader).slice(0,3).join(' | ')); await p.close();
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK');
  console.log('ERRORS:',mangel.length?mangel.join(' | '):'keine'); await b.close();
})();

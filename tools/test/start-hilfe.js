/* Gemeinsame Start-/Neulade-/Vorspul-Hilfe fuer die Tests im echten Renderer (real.html, swiftshader).
   Nur Harness - keine Pruefung wird verschaerft oder entschaerft. Zusammen mit ladezeit-preload.js benutzen
   (node -r ./ladezeit-preload.js test.js real.html): dort Fristen, Herzschlag und Renderer-Tod-Erkennung.

   const H=require('../../tools/test/start-hilfe.js');
   await H.laden(p, process.argv[2]);          // goto + warten bis window.__bb und Startknoepfe da sind
   await H.neuesSpiel(p,{stoppen:true});       // letzten Startknopf, Namen bestaetigen, warten bis Startbild zu; stoppen = Spielschleife aus (Test treibt mit bb.run/step/renderFrame)
   await H.neuladen(p);                        // p.reload() + warten wie oben (danach ggf. H.neuesSpiel)
   await H.vorspulen(p,{bis:'bb.S.day>=a.day+1'});  // Spielzeit vorspulen in Stuecken <= 25 s, Fortschrittszeile je Stueck
   await H.stuecke(p,(st,aus)=>{ ... return {fertig:true,info:..}; });  // beliebige lange Arbeit in Stuecken
   Warum Stuecke: ein einziges p.evaluate von 5-20 min gibt keinen Lebenszeichen-Hinweis, haelt die Seite fuer Playwright
   "beschaeftigt" und lief bei Speicherknappheit (Renderer vom OOM-Killer beendet) stumm in das 30-Min-Limit. */
const T0=Date.now(), sek=()=>((Date.now()-T0)/1000).toFixed(0);
const log=(...a)=>console.log(`[start ${sek()}s]`,...a);
const BEREIT="!!window.__bb&&!!document.querySelector('#startBtns button:not([disabled])')";

async function warte(p,expr,was,ms){
  const t=Date.now();
  try{ await p.waitForFunction(expr,null,{timeout:ms||600000,polling:500}); }
  catch(e){ let z='?'; try{ z=JSON.stringify(await p.evaluate(()=>({bb:!!window.__bb,S:!!(window.__bb&&window.__bb.S),startOffen:!!document.getElementById('start')&&document.getElementById('start').classList.contains('show'),
      name:!!document.querySelector('#nameBox.show'),knoepfe:document.querySelectorAll('#startBtns button:not([disabled])').length}))); }catch(e2){ z='Seite antwortet nicht ('+String(e2.message).slice(0,80)+')'; }
    throw new Error(`${was} nach ${Math.round((Date.now()-t)/1000)} s nicht erreicht: ${z} | ${String(e.message).split('\n')[0]}`); }
  log(was,'nach',Math.round((Date.now()-t)/1000),'s');
}
async function laden(p,datei,opt={}){
  await p.goto('file://'+datei,{waitUntil:'domcontentloaded',timeout:opt.timeout||600000});
  await warte(p,BEREIT,'Seite geladen (__bb + Startknoepfe)',opt.timeout||600000);
}
async function neuladen(p,opt={}){
  await p.reload({waitUntil:'domcontentloaded',timeout:opt.timeout||600000});
  await warte(p,BEREIT,'Seite neu geladen',opt.timeout||600000);
}
async function neuesSpiel(p,opt={}){
  await warte(p,BEREIT,'Startknoepfe bereit',opt.timeout||600000);
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:opt.timeout||300000});
  await p.click('#nameGo');
  await warte(p,"!document.getElementById('start').classList.contains('show')",'Spiel gestartet',opt.timeout||600000);
  /* stoppen:true = die Spielschleife (requestAnimationFrame) abschalten; der Test treibt das Spiel dann selbst mit bb.run()/bb.step()/
     bb.renderFrame(). Gemessen 14.10.: laeuft die Schleife im Hintergrund mit, schwankt der Renderer bei Vollausbau + Vorfuehrung
     zwischen 3 und 5 GB (Browserprozess 0,4-1,4 GB), Playwright-Aufrufe warten auf Einzelbilder und ein zweiter Browser im
     Container loest den OOM-Killer aus. */
  if(opt.stoppen) await p.evaluate(()=>window.__bb.stoppSchleife());
}
/* Beliebige lange Arbeit in Stuecken. schritt=(st,aus)=>{...; return {fertig:bool,info:any}} laeuft IM Browser;
   st = Zustand, der zwischen den Stuecken erhalten bleibt (window.__stk); aus() sagt "Zeit fuer dieses Stueck um". */
async function stuecke(p,schritt,opt={}){
  const src=schritt.toString(), ms=(opt.stueckSek||25)*1000, max=opt.max||400, name=opt.name||'Arbeit', t0=Date.now();
  await p.evaluate(()=>{ window.__stk={}; });
  for(let i=1;i<=max;i++){
    const r=await p.evaluate(({src,ms})=>{ const f=(0,eval)('('+src+')'); const t=performance.now(); return f(window.__stk,()=>performance.now()-t>=ms); },{src,ms});
    if(!opt.still) log(`${name}: Stueck ${i}, ${Math.round((Date.now()-t0)/1000)} s`,r&&r.info!==undefined?JSON.stringify(r.info).slice(0,200):'');
    if(!r||r.fertig) return r;
  }
  throw new Error(`${name}: nach ${max} Stuecken (${Math.round((Date.now()-t0)/1000)} s) nicht fertig`);
}
/* Spielzeit vorspulen: bb.run(sek,dt) wiederholen, bis `bis` (Ausdruck mit bb und a={day,clock} vom Beginn) wahr ist
   oder max Durchgaenge erreicht sind. Rueckgabe {k,erreicht,day,clock}. */
async function vorspulen(p,opt={}){
  const o={sek:opt.sek||3,dt:opt.dt||0.1,max:opt.max||3000,bis:opt.bis||'bb.S.day>=a.day+1'};
  const r=await stuecke(p,new Function('return '+`(st,aus)=>{ const bb=window.__bb, o=${JSON.stringify(o)};
      if(!st.a){ st.a={day:bb.S.day,clock:bb.clock}; st.k=0; }
      const a=st.a; const erreicht=()=>!!(new Function('bb','a','return ('+o.bis+')'))(bb,a);
      while(!aus()&&st.k<o.max&&!erreicht()){ bb.run(o.sek,o.dt); st.k++; }
      const e=erreicht(); return {fertig:e||st.k>=o.max,info:{k:st.k,tag:bb.S.day,uhr:Math.round(bb.clock),kunden:bb.customers.length},erreicht:e,k:st.k,day:bb.S.day,clock:bb.clock}; }`)(),
    Object.assign({name:'Vorspulen'},opt));
  return r;
}
/* Texturen in kleinen Haeppchen zur Grafikkarte schicken (renderer.initTexture + gl.finish je Haeppchen). Ohne das laedt das erste
   Bild jeder neuen Ansicht hunderte Canvas-Texturen auf einmal hoch; in swiftshader stauen sich die Kopien (Renderer 6 GB +
   Browser 2,5 GB + GPU 2 GB, 14.10. gemessen) und der Container-OOM-Killer beendet den Renderer. Aendert kein Bild und keinen Wert. */
async function texturenVorladen(p,opt={}){
  return stuecke(p,new Function('return '+`(st,aus)=>{ const bb=window.__bb, R=bb.renderer, gl=R.getContext(), B=${+(opt.batch||12)};
      if(!st.liste){ const seen=new Set(); st.liste=[]; st.i=0; const K=['map','emissiveMap','alphaMap','normalMap','roughnessMap','metalnessMap','bumpMap','aoMap','lightMap'];
        bb.scene.traverse(o=>{ for(const m of (o.material?(Array.isArray(o.material)?o.material:[o.material]):[])) if(m) for(const k of K){ const t=m[k]; if(t&&!seen.has(t)){ seen.add(t); st.liste.push(t); } } }); }
      while(!aus()&&st.i<st.liste.length){ for(let j=0;j<B&&st.i<st.liste.length;j++){ try{ if(R.initTexture) R.initTexture(st.liste[st.i]); }catch(e){} st.i++; } gl.finish(); }
      return {fertig:st.i>=st.liste.length,info:{texturen:st.liste.length,hoch:st.i}}; }`)(),Object.assign({name:'Texturen vorladen'},opt));
}
module.exports={texturenVorladen,laden,neuladen,neuesSpiel,stuecke,vorspulen,warte,BEREIT};

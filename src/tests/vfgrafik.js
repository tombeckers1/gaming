/* Vorfuehrung-Stopp und Grafikstufen (Tom, 03.10.):
   - STOPP: X in der Feuerwerk-Vorfuehrung beendet alles, was brennt -
     keine Sterne, Raketen, Boden-Emitter, geplanten Schuesse mehr, das
     Produkt ist vom Tisch, das Testfeld bleibt (vfAn), danach zuendet
     das naechste normal
   - STUFEN: Maximum, Ultra, Ultra Extrem waehlbar; Pixeldichte,
     Kantenglaettung, Schattenkarte, Leuchteffekt-Aufloesung steigen
   - START: mit Ultra Extrem geladen sind Funkenpuffer und Texturen groesser
   Aufruf: node vfgrafik.js real.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:300000});
  await p.evaluate(()=>document.querySelector('#startBtns button:last-child').click());
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:300000});
  await p.evaluate(()=>document.getElementById('nameGo').click());
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:300000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  await p.goto('file://'+process.argv[2],{timeout:300000,waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:300000});
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('bb_gfx','hoch'); }); await p.reload({timeout:300000,waitUntil:'domcontentloaded'}); await p.waitForFunction('window.__bb!==undefined',null,{timeout:300000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=__bb, o={};
    const lebend=()=>[bb.psHuge,bb.psBig,bb.psMid,bb.psSmall].reduce((a,ps)=>{ let n=0; for(let i=0;i<ps.max;i++) if(ps.life[i]>0) n++; return a+n; },0);
    bb.S.level=99; bb.vorfuehrungAn(); bb.run(0.5,0.05);
    const bat=bb.vfListe.find(t=>bb.istBatterie(t)&&bb.SHOWS[t]), kugel=bb.vfListe.find(t=>bb.P[t].shape==='shell'||/^kugel/.test(t));
    const kinder=bb.scene.children.length;
    bb.vfZuenden(bat); bb.vfZuenden(kugel); bb.run(3,0.05);
    o.vorher={sterne:lebend(),raketen:bb.rockets.length,emitter:bb.emittersListe().length,plaene:bb.timersLen(),tisch:bb.vfAufraeumen.length,kinder:bb.scene.children.length-kinder};
    o.weg=bb.vfStopp(); bb.run(0.2,0.05);
    o.nach={sterne:lebend(),raketen:bb.rockets.length,emitter:bb.emittersListe().length,tisch:bb.vfAufraeumen.length,kinder:bb.scene.children.length-kinder};
    bb.run(6,0.05); o.spaeter={sterne:lebend(),raketen:bb.rockets.length};
    o.an=bb.vfAn;
    bb.vfZuenden(bat); bb.run(4,0.05); o.wieder=lebend();
    return o; });
  console.log('STOPP',JSON.stringify(r));
  pruef('VORHER',r.vorher.sterne>200,'nach 3 s brennt kaum etwas: '+JSON.stringify(r.vorher));
  pruef('STOPP',r.nach.sterne===0&&r.nach.raketen===0&&r.nach.emitter===0&&r.nach.tisch===0,'nach Stopp noch: '+JSON.stringify(r.nach));
  pruef('NICHTS_NACH',r.spaeter.sterne===0&&r.spaeter.raketen===0,'6 s nach Stopp kommt noch etwas: '+JSON.stringify(r.spaeter));
  pruef('TESTFELD',r.an,'Vorfuehrung ist nach Stopp aus');
  pruef('WIEDER',r.wieder>100,'danach zuendet nichts mehr: '+r.wieder);
  /* Taste X */
  const tx=await p.evaluate(()=>{ const bb=__bb; bb.vfZuenden(bb.vfLetzt); bb.run(2,0.05); window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyX'})); bb.run(0.2,0.05);
    return {raketen:bb.rockets.length,emitter:bb.emittersListe().length,toast:String(bb.toastLast&&(bb.toastLast.msg||bb.toastLast))}; });
  console.log('TASTE',JSON.stringify(tx));
  pruef('TASTE_X',tx.raketen===0&&tx.emitter===0&&/gestoppt/.test(tx.toast),JSON.stringify(tx));
  /* Stufen im laufenden Spiel */
  const st=await p.evaluate(()=>{ const bb=__bb, o={}; bb.vorfuehrungAus();
    for(const s of ['hoch','max','ultra','extrem']){ bb.gfxWaehlen(s); bb.renderFrame&&bb.renderFrame(); o[s]={px:bb.renderer.getPixelRatio(),schatten:bb.schattenGr(),ms:bb.gfxSamples(s),blur:bb.postDiv,qual:bb.GFX_PROFIL[s].qual,knopf:!!document.querySelector('#gfxWahl [data-gfx="'+s+'"]')}; }
    bb.gfxWaehlen('hoch'); return o; });
  console.log('STUFEN',JSON.stringify(st));
  const k=['hoch','max','ultra','extrem'];
  for(let i=1;i<k.length;i++){ const a=st[k[i-1]], c=st[k[i]];
    pruef('STUFE_'+k[i],c.knopf&&c.px>=a.px&&c.schatten>=a.schatten&&c.ms>=a.ms&&c.blur<=a.blur&&c.qual>a.qual&&(c.px>a.px||c.schatten>a.schatten||c.ms>a.ms||c.blur<a.blur),JSON.stringify([a,c])); }
  pruef('PIXEL',st.ultra.px>=2&&st.extrem.px>=2.5,'Supersampling fehlt: '+JSON.stringify(st));
  /* Laden mit Ultra Extrem: groessere Puffer und Texturen */
  const groesse=async()=>p.evaluate(()=>{ const bb=__bb, t='batterie49'; const pl=bb.pools[t]; let w=0; bb.scene.traverse(()=>{});
    const parts=bb.buildProduct(t); let mx=0; for(const q of parts){ const m=q.mat||q.material||q[1]; const mp=m&&m.map; if(mp&&mp.image) mx=Math.max(mx,mp.image.width||0); }
    return {psBig:bb.psBig.max,tex:mx,start:bb.GFX_START.tex}; });
  const g1=await groesse();
  await p.evaluate(()=>{ localStorage.setItem('bb_gfx','extrem'); }); await p.reload({timeout:300000,waitUntil:'domcontentloaded'}); await p.waitForFunction('window.__bb!==undefined',null,{timeout:300000});
  const g2=await groesse();
  console.log('LADEN',JSON.stringify({hoch:g1,extrem:g2}));
  pruef('PUFFER',g2.psBig>g1.psBig*1.5,JSON.stringify([g1,g2]));
  pruef('TEXTUR',g2.start===2.5&&(g1.tex===0||g2.tex>g1.tex*1.5),JSON.stringify([g1,g2]));
  await p.evaluate(()=>localStorage.setItem('bb_gfx','hoch'));
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK'); await b.close();
})();

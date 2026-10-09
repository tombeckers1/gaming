/* Keine Bodenfontaenen in Batterien (07.10., Toms Test V117: "ALLE
   Batterien: Bodenfontaenen (2-3 m hoch, am Tisch beginnend, viele kleine
   Funken, random) RAUS. Nicht gemeint: aufsteigende Geschosse/Kometen";
   Ausnahme Vulkanausbruch: "die am Tisch beginnende Fontaene DARF bleiben").
   Jede Batterie der Vorfuehrung wird gezuendet; jeder Boden-Emitter, der
   waehrend des Abbrennens entsteht (alles ausser Zuendschnur und Modell),
   zaehlt. Daneben wird jedes Drehbuch (SHOWS) auf boden/ground gelesen.
   - BODEN: keine Batterie ausser lb_vulkan hat einen Boden-Emitter
   - VULKAN: der Vulkanausbruch hat seinen Krater (Boden-Emitter krater) -
     seit 09.10. gestrichen (Batterie-Runde), die Pruefung greift nur, wenn er da ist
   Aufruf: node bodenfontaene.js real.html ['{"nur":["id"],"gegen":true}']
   gegen:true schaltet das Entfernen ab (dann muss der Test anschlagen). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
/* keine Bodenfontaenen: Zuendschnur, Modell im Rohr, der Hilfsdienst der
   Bruchbilder (dienst2) und die Taktgeber der Bruchbilder am Himmel (gb_*) */
const KEIN_BODEN=new Set(['fuse','vfModell','dienst2']);
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}}); p.setDefaultTimeout(1500000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
  const opt=process.argv[3]?JSON.parse(process.argv[3]):{};
  const ids=await p.evaluate(opt=>{ const bb=window.__bb;
    if(opt.gegen) window.__r3.bodenAus(false);
    bb.vorfuehrungAn();
    for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) if(ps){ ps.emit=()=>0; ps.update=()=>0; }
    const E=bb.emittersListe(), push=E.push; E.push=function(...a){ if(window.__bo) a.forEach(e=>{ if(e&&e.k) window.__bo.push(e.k); }); return push.apply(this,a); };
    return bb.vfListe.filter(t=>bb.istBatterie(t)&&(!opt.nur||opt.nur.includes(t))); },opt);
  const mangel=[], zeilen=[];
  for(const t of ids){
    const r=await p.evaluate(([t,KB])=>{ const bb=window.__bb, P=bb.P;
      try{ bb.vfStopp(); }catch(e){}
      for(let i=0;i<8;i++) bb.run(0.25,0.05);
      window.__bo=[]; bb.vfZuenden(t);
      const D=bb.brennDauer(t);
      for(let s=0;s<D+2;s+=0.25) bb.run(0.25,0.05);
      const k=window.__bo.filter(x=>!KB.includes(x)&&!/^gb_/.test(x)); window.__bo=null;
      const buch=(bb.SHOWS[t]?bb.SHOWS[t]():[]).filter(ph=>ph&&(ph.boden||ph.ground)).length;
      return {lvl:P[t].lvl,k,buch}; },[t,[...KEIN_BODEN]]);
    const anz={}; r.k.forEach(x=>{ anz[x]=(anz[x]||0)+1; });
    zeilen.push(`${t.padEnd(22)} L${String(r.lvl).padStart(2)}  Boden-Emitter ${String(r.k.length).padStart(3)} ${JSON.stringify(anz)}  Drehbuch-Phasen mit Boden ${r.buch}`);
    if(t==='lb_vulkan'){ if(!r.k.includes('krater')) mangel.push(`VULKAN: der Vulkanausbruch hat keinen Krater mehr (${JSON.stringify(anz)})`); }
    else if(r.k.length||r.buch) mangel.push(`BODEN ${t}: ${r.k.length} Boden-Emitter ${JSON.stringify(anz)}, ${r.buch} Drehbuch-Phasen mit Boden`);
  }
  console.log(zeilen.join('\n'));
  console.log(`\n${ids.length} Batterien geprueft${opt.gegen?' (Gegenprobe: Entfernen aus)':''}`);
  if(errs.length) mangel.push(...errs.slice(0,5));
  if(!ids.length) mangel.push('keine Batterie gefunden');
  await b.close();
  if(mangel.length){ console.log('FEHLER ('+mangel.length+'):\n'+mangel.join('\n')); process.exit(1); }
  console.log('OK: keine Bodenfontaene in Batterien (der Vulkanausbruch ist seit 09.10. gestrichen)');
})();

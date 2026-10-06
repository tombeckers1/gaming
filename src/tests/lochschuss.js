/* Ein Loch = ein Schuss (06.10., Toms PDF: "jeder Schuss ist ja
   logischerweise ein Loch ... ausser du hast jetzt eine Fontaene. Aber
   eine Fontaene meine ich diese kleinen Funken, nicht diese grossen
   Fontaenen ... jedes ist ein Schuss").
   Fuer JEDE Batterie der Feuerwerk-Vorfuehrung (Tisch, Rohre) wird sie
   gezuendet und gezaehlt, was sichtbar aus ihr steigt: Schuesse, Kugeln,
   Roemische Lichter, Feuertoepfe, jeder Kometenkopf und jeder Faecher-
   komet (14t LOCH). Kleine Funkenfontaenen (Boden-Emitter) zaehlen nicht.
   - SICHTBAR: sichtbare Starts == Rohre
   - NAME: "N Schuss" im Namen == Rohre
   - ROHR: jedes Rohr feuert genau einmal, kein Schuss ohne Rohr
   Aufruf: node lochschuss.js real.html ['{"nur":["id"],"breitBoden":true}']
   breitBoden:true schaltet den alten automatischen Kometenfaecher aus dem
   Fontaenen-Modul wieder ein (Gegenprobe: dann muss der Test anschlagen). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
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
    if(opt.breitBoden) window.__lochschuss.breitBoden(true);
    bb.vorfuehrungAn();
    /* nur zaehlen, nicht zeichnen: Partikel ohne Rechnung (zehnmal schneller) */
    for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) if(ps){ ps.emit=()=>0; ps.update=()=>0; }
    return bb.vfListe.filter(t=>bb.istBatterie(t)&&(!opt.nur||opt.nur.includes(t))); },opt);
  const mangel=[], zeilen=[];
  for(const t of ids){
    const r=await p.evaluate(t=>{ const bb=window.__bb, P=bb.P;
      try{ bb.vfStopp(); }catch(e){}
      for(let i=0;i<20;i++) bb.run(0.25,0.05);
      const log=[]; log.brueche=[]; bb.fwLog(log); bb.ROHR_LOG=[];
      window.__lochschuss.start(3);
      bb.vfZuenden(t);
      const D=bb.brennDauer(t);
      for(let s=0;s<D+4;s+=0.25) bb.run(0.25,0.05);
      const Z=window.__lochschuss.stop(), RL=bb.ROHR_LOG||[]; bb.ROHR_LOG=null; bb.fwLog(null);
      const art={}; for(const e of log){ const k=e.art==='perle'&&/^licht:/.test(e.eff||'')?'licht':e.art; art[k]=(art[k]||0)+1; }
      const starts=(art.schuss||0)+(art.kugel||0)+(art.topf||0)+(art.perle||0);
      const sichtbar=starts+Z.lichter+Z.kometen+Z.koepfeFrei;
      const ri=RL.filter(e=>e.i!==undefined&&e.i>=0).map(e=>e.i);
      const m=/(\d+)\s*Schuss/.exec(P[t].name||'');
      return {name:P[t].name,lvl:P[t].lvl,rohre:bb.rohrLayout(t).rohre.length,nameN:m?+m[1]:null,sichtbar,art,Z,
        gefeuert:ri.length,einzeln:new Set(ri).size,ohne:RL.filter(e=>e.i===-1).length}; },t);
    zeilen.push(`${t.padEnd(22)} L${String(r.lvl).padStart(2)} Rohre ${String(r.rohre).padStart(3)}  Name ${String(r.nameN).padStart(4)}  sichtbar ${String(r.sichtbar).padStart(4)}  (Starts ${JSON.stringify(r.art)}, Lichter ${r.Z.lichter}, Faecherkometen ${r.Z.kometen}, freie Koepfe ${r.Z.koepfeFrei})  ${r.name}`);
    if(r.sichtbar!==r.rohre) mangel.push(`${t}: SICHTBAR ${r.sichtbar} Starts, aber ${r.rohre} Rohre (Lichter ${JSON.stringify(r.Z.je)}, Faecherkometen ${r.Z.kometen}, freie Koepfe ${r.Z.koepfeFrei})`);
    if(r.nameN!==r.rohre) mangel.push(`${t}: NAME "${r.name}" nennt ${r.nameN} Schuss, die Batterie hat ${r.rohre} Rohre`);
    if(r.gefeuert!==r.rohre||r.einzeln!==r.rohre||r.ohne) mangel.push(`${t}: ROHR ${r.gefeuert} Zuendungen an ${r.einzeln} von ${r.rohre} Rohren, ${r.ohne} ohne Rohr`);
  }
  console.log(zeilen.join('\n'));
  console.log(`\n${ids.length} Batterien geprueft${opt.breitBoden?' (Gegenprobe: BREIT_BODEN an)':''}`);
  if(errs.length) mangel.push(...errs.slice(0,5));
  if(!ids.length) mangel.push('keine Batterie gefunden');
  await b.close();
  if(mangel.length){ console.log('FEHLER ('+mangel.length+'):\n'+mangel.join('\n')); process.exit(1); }
  console.log('OK: jede Batterie - ein Loch, ein Schuss; Name = Rohre = sichtbare Schuesse');
})();

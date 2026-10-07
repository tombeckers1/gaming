/* Abschussklang (07.10., Toms Test V117: "Lichter-Batterien ohne
   Abschussgeraeusch - Gluehwuermchen, Pusteblume, Tautropfen ... generell
   pruefen"; "nie Abschuesse ganz ohne Ton"; "viele verschiedene Sounds").
   Fuer JEDE Batterie der Vorfuehrung (Tisch) wird sie gezuendet und jeder
   Klangbaustein mitgeschnitten (14x KLANG_LOG: Zeit, Lautstaerke und der
   Anteil, der aus einem kleinen Lautsprecher kommt - Bass unter ~300 Hz
   zaehlt kaum). Fuer jedes Rohr, das feuert (ROHR_LOG), wird summiert,
   was in den 0,3 s danach hoerbar klingt.
   - STUMM: kein Abschuss unter HOERBAR (Mittenanteil)
   - VIELFALT: ueber alle Batterien mindestens 6 verschiedene Abschuss-
     Stimmen, keine Stimme in mehr als 45 % der Batterien als Hauptstimme
   Aufruf: node abschussklang.js real.html ['{"nur":["id"],"aus":true}']
   aus:true schaltet den neuen Abschussklang ab (Gegenprobe: dann muss der
   Test bei den Lichter-Batterien anschlagen). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const HOERBAR=0.06;
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
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
    bb.ac(); window.__r3.abschussAus(!!opt.aus);
    bb.vorfuehrungAn();
    for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) if(ps){ ps.emit=()=>0; ps.update=()=>0; }
    return bb.vfListe.filter(t=>bb.istBatterie(t)&&(!opt.nur||opt.nur.includes(t))); },opt);
  const mangel=[], zeilen=[], haupt={};
  for(const t of ids){
    const r=await p.evaluate(([t,H])=>{ const bb=window.__bb, P=bb.P;
      try{ bb.vfStopp(); }catch(e){}
      for(let i=0;i<12;i++) bb.run(0.25,0.05);
      bb.ROHR_LOG=[]; window.__r3.klang(true);
      bb.vfZuenden(t);
      const D=bb.brennDauer(t);
      for(let s=0;s<D+3;s+=0.1) bb.run(0.1,0.05);
      const RL=(bb.ROHR_LOG||[]).filter(e=>e.i>=0&&e.t!==undefined), K=window.__r3.klangLog(), AL=window.__r3.abschussLog();
      bb.ROHR_LOG=null; window.__r3.klang(false);
      const werte=RL.map(e=>{ let w=0; for(const k of K) if(k.t>=e.t-0.02&&k.t<=e.t+0.3) w+=k.w; return +w.toFixed(3); });
      const stimmen={}; AL.forEach(a=>{ stimmen[a.st]=(stimmen[a.st]||0)+1; });
      const leise=werte.filter(w=>w<H).length;
      return {lvl:P[t].lvl,n:RL.length,min:werte.length?Math.min(...werte):0,med:werte.length?werte.slice().sort((a,b)=>a-b)[Math.floor(werte.length/2)]:0,leise,stimmen}; },[t,HOERBAR]);
    const h=Object.entries(r.stimmen).sort((a,b)=>b[1]-a[1])[0]; if(h) haupt[t]=h[0];
    zeilen.push(`${t.padEnd(22)} L${String(r.lvl).padStart(2)} Rohre ${String(r.n).padStart(3)}  hoerbar min ${String(r.min).padStart(6)} med ${String(r.med).padStart(6)}  leise ${r.leise}  ${JSON.stringify(r.stimmen)}`);
    if(!r.n) mangel.push(`${t}: kein Rohr gefeuert`);
    if(r.leise) mangel.push(`${t}: STUMM ${r.leise} von ${r.n} Abschuessen unter ${HOERBAR} (min ${r.min})`);
  }
  console.log(zeilen.join('\n'));
  const hs=Object.values(haupt), anz={}; hs.forEach(s=>{ anz[s]=(anz[s]||0)+1; });
  const alle=new Set(hs);
  console.log('Hauptstimmen:',JSON.stringify(anz));
  if(!opt.nur&&!opt.aus){
    if(alle.size<6) mangel.push(`VIELFALT: nur ${alle.size} verschiedene Hauptstimmen`);
    const max=Math.max(0,...Object.values(anz)); if(max>0.45*hs.length) mangel.push(`VIELFALT: eine Stimme ist bei ${max} von ${hs.length} Batterien die Hauptstimme`);
  }
  console.log(`\n${ids.length} Batterien geprueft${opt.aus?' (Gegenprobe: neuer Abschussklang aus)':''}`);
  if(errs.length) mangel.push(...errs.slice(0,5));
  if(!ids.length) mangel.push('keine Batterie gefunden');
  await b.close();
  if(mangel.length){ console.log('FEHLER ('+mangel.length+'):\n'+mangel.join('\n')); process.exit(1); }
  console.log('OK: jeder Abschuss jeder Batterie ist hoerbar, viele verschiedene Stimmen');
})();

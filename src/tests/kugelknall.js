/* Kugelknall (Tom, 09.10.: "Oft fehlen die Explosionen - jede Kugelbombe
   macht einen lauten Knall beim Zerlegen, je Bombe unterschiedlich, kein
   Einheitssound, der Boom muss da sein"; Granatapfel: "Boom fehlt oft").
   Jede Kugel der Kugelbomben-Vorfuehrung wird gezuendet, jeder
   Klangbaustein mitgeschnitten (14x KLANG_LOG: Lautstaerke mal Anteil, der
   aus einem kleinen Lautsprecher kommt). Summiert wird, was vom Bruch bis
   0,9 s nach dem Eintreffen des Schalls klingt.
   - KNALL: jeder Hauptbruch klingt mit mindestens KNALL_MIN
     (gemessen vorher: 0,02-0,08 bei Herzschlag, Leuchtqualle,
     Granatapfel, Riesenpalme, Blauregen, Goldbrokat)
   - BLITZ: beim Zerlegen ein kurzer, heller Zerlegerblitz am Bruchpunkt
   - VIELFALT: jede Kugel hat ihren eigenen Knall (eigener Klang-Schluessel),
     mindestens 6 Klangarten, keine Art bei mehr als 40 % der Kugeln
   - MONSTER: der Urknall (letzte Koenigsklasse) knallt zweimal, der
     zweite Schlag ist der lauteste aller Kugeln (mind. 1,3-mal jeder Bruchknall)
   Aufruf: node kugelknall.js real.html ['{"aus":true}']
   aus:true = alter Bruchklang ohne Zerlegerblitz (Gegenprobe: KNALL und
   BLITZ muessen anschlagen). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const KNALL_MIN=0.45;
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
    bb.ac(); window.__kg5.aus(!!opt.aus); bb.S.level=99;
    bb.vorfuehrungAn(window.__vf2.vfKugelListe(),'KUGELBOMBEN-VORFÜHRUNG');
    /* keine Partikelrechnung (schnell); grelle Kurzpunkte (Zerlegerblitz) werden notiert */
    window.__punkte=[];
    for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) if(ps){ const gross=ps===bb.psHuge;
      ps.emit=function(x,y,z,vx,vy,vz,r,g,bl,life){ if(gross&&life<=0.11&&Math.min(r,g,bl)>=1.5) window.__punkte.push({t:bb.fwUhr,x,y,z}); return 0; }; ps.update=()=>0; }
    /* Klang-Schluessel je Kugel */
    window.__keys=[]; for(const k of Object.keys(bb.sfx)){ const f=bb.sfx[k]; if(typeof f!=='function') continue; bb.sfx[k]=function(){ if(window.__keys) window.__keys.push(k); return f.apply(this,arguments); }; }
    return bb.vfListe.filter(t=>!opt.nur||opt.nur.includes(t)); },opt);
  const mangel=[], zeilen=[], art={}, knallMax={};
  let monster=null;
  for(const t of ids){
    const r=await p.evaluate(([t])=>{ const bb=window.__bb, P=bb.P;
      try{ bb.vfStopp(); }catch(e){}
      for(let i=0;i<12;i++) bb.run(0.25,0.05);
      const log=[]; log.brueche=[]; bb.fwLog(log); window.__r3.klang(true); window.__kg5.log(true); window.__punkte.length=0; window.__keys=[];
      bb.vfZuenden(t);
      let br=null; for(let s=0;s<14&&!br;s+=0.05){ bb.run(0.05,0.05); br=log.brueche.find(x=>!x.stufe)||null; }
      if(br) for(let s=0;s<7;s+=0.1) bb.run(0.1,0.05);
      const K=window.__r3.klangLog()||[], L=(window.__kg5.logListe||[]).slice(); window.__r3.klang(false); window.__kg5.log(false); bb.fwLog(null);
      if(!br) return {lvl:P[t].lvl,fehlt:true};
      const c=bb.camera.position, dl=Math.hypot(c.x-br.x,c.y-br.y,c.z-br.z)/343;
      let knall=0; for(const k of K) if(k.t>=br.t-0.02&&k.t<=br.t+dl+0.9) knall+=k.w;
      /* zweiter grosser Schlag (Monster): Fenster ab 1 s nach dem Bruch, je 0,9 s */
      let zweit=0; const ms=L.find(x=>x.art==='monster');
      if(ms){ for(const k of K) if(k.t>=ms.t-0.02&&k.t<=ms.t+0.9) zweit+=k.w; }
      const blitz=window.__punkte.filter(q=>q.t>=br.t-0.02&&q.t<=br.t+0.08&&Math.hypot(q.x-br.x,q.y-br.y,q.z-br.z)<1.5).length;
      const keys=[...new Set(window.__keys)].filter(k=>/^kk_/.test(k));
      const a=(L.find(x=>x.art&&x.art!=='monster')||{}).art||null;
      return {lvl:P[t].lvl,knall:+knall.toFixed(3),blitz,keys,art:a,zweit:+zweit.toFixed(3),zweitT:ms?+(ms.t-br.t).toFixed(2):null}; },[t]);
    if(r.fehlt){ mangel.push(`${t}: kein Bruch`); continue; }
    zeilen.push(`${t.padEnd(20)} L${String(r.lvl).padStart(2)}  Knall ${String(r.knall).padStart(6)}  Blitz ${r.blitz}  ${r.art||'-'} ${r.keys.join(',')}${r.zweit?'  MONSTER '+r.zweit+' nach '+r.zweitT+' s':''}`);
    knallMax[t]=r.knall;
    if(r.knall<KNALL_MIN) mangel.push(`KNALL: ${t} nur ${r.knall} (mindestens ${KNALL_MIN})`);
    if(!r.blitz) mangel.push(`BLITZ: ${t} ohne Zerlegerblitz`);
    if(!opt.aus){
      if(r.keys.length!==1||r.keys[0]!=='kk_'+t) mangel.push(`VIELFALT: ${t} hat keinen eigenen Knall (${r.keys.join(',')||'keiner'})`);
      if(r.art) art[r.art]=(art[r.art]||0)+1; }
    if(t==='urknall300') monster=r;
  }
  console.log(zeilen.join('\n'));
  console.log('Klangarten:',JSON.stringify(art));
  if(!opt.aus&&!opt.nur){
    const n=Object.values(art).reduce((a,c)=>a+c,0), max=Math.max(0,...Object.values(art));
    if(Object.keys(art).length<6) mangel.push(`VIELFALT: nur ${Object.keys(art).length} Klangarten`);
    if(max>0.4*n) mangel.push(`VIELFALT: eine Klangart bei ${max} von ${n} Kugeln`);
    if(!monster||!monster.zweit) mangel.push('MONSTER: der Urknall hat keinen zweiten Schlag');
    else { const andere=Math.max(...Object.entries(knallMax).filter(([t])=>t!=='urknall300').map(([t,w])=>w));
      if(!(monster.zweit>=1.3*andere)) mangel.push(`MONSTER: zweiter Schlag ${monster.zweit} nicht 1,3-mal lauter als der lauteste Bruchknall ${andere}`);
      if(!(monster.zweitT>=1)) mangel.push(`MONSTER: zweiter Schlag schon nach ${monster.zweitT} s`); }
  }
  console.log(`\n${ids.length} Kugeln geprueft${opt.aus?' (Gegenprobe: alter Bruchklang, kein Zerlegerblitz)':''}`);
  if(errs.length) mangel.push(...errs.slice(0,5));
  if(!ids.length) mangel.push('keine Kugel gefunden');
  await b.close();
  if(mangel.length){ console.log('FEHLER ('+mangel.length+'):\n'+mangel.join('\n')); console.log('MANGEL: '+mangel.length); process.exit(1); }
  console.log('ALLES OK: jede Kugel knallt laut beim Zerlegen, mit Zerlegerblitz, jede anders; der Urknall hat den lautesten Schlag');
})();

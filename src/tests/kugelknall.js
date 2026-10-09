/* Kugelknall (Tom, 09.10.: "Oft fehlen die Explosionen - jede Kugelbombe
   macht einen lauten Knall beim Zerlegen, je Bombe unterschiedlich, kein
   Einheitssound, der Boom muss da sein"; Granatapfel: "Boom fehlt oft").
   Jede Kugel der Kugelbomben-Vorfuehrung wird gezuendet, jeder
   Klangbaustein mitgeschnitten (14x KLANG_LOG: Lautstaerke mal Anteil, der
   aus einem kleinen Lautsprecher kommt). Gemessen wird das lauteste
   Zehntel vom Bruch bis 0,9 s nach dem Eintreffen des Schalls (der
   Schlag - nicht die Summe vieler Knister-Klicks).
   - KNALL: jeder Hauptbruch klingt mit mindestens KNALL_MIN
     (gemessen vorher: 0,02-0,08 bei Herzschlag, Leuchtqualle,
     Granatapfel, Riesenpalme, Blauregen, Goldbrokat)
   - BLITZ: beim Zerlegen ein kurzer, heller Zerlegerblitz am Bruchpunkt
   - VIELFALT: jede Kugel hat ihren eigenen Knall (eigener Klang-Schluessel),
     mindestens 6 Klangarten, keine Art bei mehr als 40 % der Kugeln
   - MONSTER: der Urknall (letzte Koenigsklasse) knallt zweimal, der
     zweite Schlag ist der lauteste aller Kugeln (mind. 1,3-mal jeder Bruchknall)
   Runde 6 (Tom, 09.10. nachmittags: "klingt wie ein Schalldaempfer-Schuss,
   ich will eine tiefe, echte Explosion, ein richtiges WUMMS/BOOM - so
   wie der Urknall"). Jeder Bruchknall wird zusaetzlich in einem
   OfflineAudioContext gerechnet und ausgewertet (14z2 k6Auswerten):
   - BOOM: der Knall hat seine Energie im hoerbaren Tief-/Mittenband -
     mindestens 60 % der Laptop-Energie (Hochpass 200 Hz) liegen in
     80-700 Hz, die A-gewichtete Laptop-Lautheit erreicht mindestens ein
     Viertel des Urknall-Monster-Schlags, und er rollt mindestens 1,5 s nach
   - ZISCH: hoechstens 20 % der Laptop-Energie ueber 2,5 kHz (das
     "Pfft" des Schalldaempfers)
   - CLIP: kein Ausschlag ueber 0,75 am Ausgang (Vollaussteuerung 1,0)
   - STEIGERUNG: die Lautheit (Mittel je Kaliber) waechst mit dem Kaliber (150 und
     200 mm duerfen um 10 % streuen),
     jede neue Koenigsklasse-Kugel (ab Level 27) hat einen Schlag, der
     lauter ist als jeder Knall bis Level 26; der Urknall-Monster-Schlag ist 1,3-mal so laut wie
     jeder Bruchknall bis Level 26; der Himmelssturz-Schlag ist der
     lauteste Einzelschlag im Spiel (auch lauter als der Urknall)
   Aufruf: node kugelknall.js real.html ['{"aus":true}' | '{"alt5":true}']
   aus:true = alter Bruchklang ohne Zerlegerblitz (Gegenprobe: KNALL und
   BLITZ muessen anschlagen). alt5:true = der Knall der Runde 5
   (Gegenprobe: BOOM und ZISCH muessen anschlagen). */
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
    bb.ac(); window.__kg5.aus(!!opt.aus); if(window.__kg6) window.__kg6.alt5(!!opt.alt5); bb.S.level=99;
    bb.vorfuehrungAn(window.__vf2.vfKugelListe(),'KUGELBOMBEN-VORFÜHRUNG');
    /* keine Partikelrechnung (schnell); grelle Kurzpunkte (Zerlegerblitz) werden notiert */
    window.__punkte=[];
    for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) if(ps){ const gross=ps===bb.psHuge;
      ps.emit=function(x,y,z,vx,vy,vz,r,g,bl,life){ if(gross&&life<=0.11&&Math.min(r,g,bl)>=1.5) window.__punkte.push({t:bb.fwUhr,x,y,z}); return 0; }; ps.update=()=>0; }
    /* Klang-Schluessel je Kugel */
    window.__keys=[]; for(const k of Object.keys(bb.sfx)){ const f=bb.sfx[k]; if(typeof f!=='function') continue; bb.sfx[k]=function(){ if(window.__keys) window.__keys.push(k); return f.apply(this,arguments); }; }
    return bb.vfListe.filter(t=>!opt.nur||opt.nur.includes(t)); },opt);
  const mangel=[], zeilen=[], art={}, knallMax={}, lvlVon={};
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
      /* Spitze: lautestes Zehntel (Knall = Schlag, nicht Summe vieler Knister-Klicks) */
      const spitze=(t0,t1)=>{ const bin={}; for(const k of K) if(k.t>=t0&&k.t<=t1){ const i=Math.floor((k.t-t0)/0.1); bin[i]=(bin[i]||0)+k.w; } return Math.max(0,...Object.values(bin)); };
      let summe=0; for(const k of K) if(k.t>=br.t-0.02&&k.t<=br.t+dl+0.9) summe+=k.w;
      const knall=spitze(br.t-0.02,br.t+dl+0.9);
      /* zweiter grosser Schlag (Monster): Fenster ab 1 s nach dem Bruch, je 0,9 s */
      let zweit=0; const ms=L.find(x=>x.art==='monster');
      if(ms) zweit=spitze(ms.t-0.02,ms.t+0.9);
      const blitz=window.__punkte.filter(q=>q.t>=br.t-0.02&&q.t<=br.t+0.08&&Math.hypot(q.x-br.x,q.y-br.y,q.z-br.z)<1.5).length;
      const keys=[...new Set(window.__keys)].filter(k=>/^kk_/.test(k));
      const a=(L.find(x=>x.art&&x.art!=='monster')||{}).art||null;
      return {lvl:P[t].lvl,knall:+knall.toFixed(3),summe:+summe.toFixed(3),blitz,keys,art:a,zweit:+zweit.toFixed(3),zweitT:ms?+(ms.t-br.t).toFixed(2):null}; },[t]);
    if(r.fehlt){ mangel.push(`${t}: kein Bruch`); continue; }
    zeilen.push(`${t.padEnd(20)} L${String(r.lvl).padStart(2)}  Knall ${String(r.knall).padStart(6)} (Summe ${String(r.summe).padStart(6)})  Blitz ${r.blitz}  ${r.art||'-'} ${r.keys.join(',')}${r.zweit?'  MONSTER '+r.zweit+' nach '+r.zweitT+' s':''}`);
    knallMax[t]=r.knall; lvlVon[t]=r.lvl;
    if(r.knall<KNALL_MIN) mangel.push(`KNALL: ${t} nur ${r.knall} (mindestens ${KNALL_MIN})`);
    if(!r.blitz) mangel.push(`BLITZ: ${t} ohne Zerlegerblitz`);
    if(!opt.aus){
      if(r.keys.length!==1||r.keys[0]!=='kk_'+t) mangel.push(`VIELFALT: ${t} hat keinen eigenen Knall (${r.keys.join(',')||'keiner'})`);
      if(r.art) art[r.art]=(art[r.art]||0)+1; }
    if(t==='urknall300') monster=r;
  }
  /* Runde 6: Klang offline rechnen und auswerten */
  if(!opt.aus){
    const kl=await p.evaluate(async(ids)=>{ const K=window.__kg6, P=window.__bb.P, o={liste:{}};
      /* jeder Knall streut (Rauschen, +-5 % Tonhoehe): Mittel aus n Rechnungen */
      const mittel=async(n,...a)=>{ let m=null; for(let i=0;i<n;i++){ const x=await K.messen(...a); if(!m) m=x; else for(const k of ['lautA','boomAnteil','zischAnteil','dauer']) m[k]+=x[k]; m.spitze=Math.max(m.spitze,x.spitze); }
        for(const k of ['lautA','boomAnteil','zischAnteil','dauer']) m[k]=+(m[k]/n).toFixed(3); return m; };
      o.monster=await mittel(3,'monster');
      for(const t of ids){ o.liste[t]=Object.assign({lvl:P[t].lvl,mm:Math.round(P[t].dims[0]*1000)},await mittel(2,t,0.19,K.istAlt5(),true));
        /* mehrstufige Kugeln: der staerkste ihrer Schlaege */
        const M=K.K6_MONSTER[t]; o.liste[t].staerkst=o.liste[t].lautA;
        if(M&&!K.istAlt5()) for(let k=0;k<M.stufen.length;k++){ const m=await K.messen(t,0.19,false,true,k); o.liste[t].staerkst=Math.max(o.liste[t].staerkst,m.lautA); } }
      const hs=K.K6_MONSTER.himmelssturz300; if(hs&&!K.istAlt5()){ const k=hs.stufen.findIndex(x=>x[2]==='himmelssturz'); o.sturz=await K.messen('himmelssturz300',0.19,false,true,k); }
      return o; },ids);
    const M=kl.monster, kal=mm=>mm<100?75:mm<140?100:mm<180?150:mm<230?200:300, tier={};
    console.log(`\nKLANG (offline, Lautstaerke am Ohr 0,19)            spitze  lautA  boom%  zisch%  dauer\nUrknall-Monster-Schlag (Vorbild, unveraendert)       ${M.spitze}  ${M.lautA}  ${M.boomAnteil}  ${M.zischAnteil}  ${M.dauer}`);
    for(const [t,m] of Object.entries(kl.liste)){
      console.log(`${t.padEnd(22)} L${String(m.lvl).padStart(2)} ${String(m.mm).padStart(3)} mm             ${String(m.spitze).padStart(5)}  ${String(m.lautA).padStart(5)}  ${String(m.boomAnteil).padStart(5)}  ${String(m.zischAnteil).padStart(5)}  ${m.dauer}${m.staerkst>m.lautA?'  staerkster Schlag '+m.staerkst:''}`);
      if(!(m.boomAnteil>=0.6&&m.lautA>=0.25*M.lautA&&m.dauer>=1.5)) mangel.push(`BOOM: ${t} boom ${m.boomAnteil}, lautA ${m.lautA} (mind. ${(0.25*M.lautA).toFixed(2)}), rollt ${m.dauer} s`);
      if(m.zischAnteil>0.2) mangel.push(`ZISCH: ${t} ${Math.round(m.zischAnteil*100)} % ueber 2,5 kHz`);
      if(m.spitze>0.75) mangel.push(`CLIP: ${t} Spitze ${m.spitze}`);
      const g=m.lvl>=27?'neu':kal(m.mm); (tier[g]=tier[g]||[]).push(m.lautA); }
    if(!opt.nur&&!opt.alt5){
      const mit=g=>tier[g]?tier[g].reduce((a,c)=>a+c,0)/tier[g].length:null, reihe=[75,100,150,200,300].map(mit);
      console.log('Lautheit je Kaliber 75/100/150/200/300/neu:',reihe.concat([mit('neu')]).map(x=>x&&x.toFixed(2)).join(' / '));
      const kl75=Math.min(reihe[0],reihe[1]);
      if(!(kl75<reihe[2]&&reihe[2]<=reihe[3]*1.1&&reihe[3]<=reihe[4]*1.1)) mangel.push('STEIGERUNG: Lautheit waechst nicht mit dem Kaliber: '+reihe.map(x=>x.toFixed(2)).join(' / '));
      const bis26=Object.values(kl.liste).filter(m=>m.lvl<=26).map(m=>m.lautA), neu=Object.values(kl.liste).filter(m=>m.lvl>=27).map(m=>m.staerkst),
        neuOhne=Object.entries(kl.liste).filter(([t,m])=>m.lvl>=27&&t!=='himmelssturz300').map(([t,m])=>m.staerkst);
      if(!(Math.min(...neu)>Math.max(...bis26))) mangel.push(`STEIGERUNG: neue Koenigsklasse (staerkster Schlag der leisesten ${Math.min(...neu)}) nicht lauter als jeder Knall bis Level 26 (${Math.max(...bis26)})`);
      if(!(M.lautA>=1.3*Math.max(...bis26))) mangel.push(`MONSTER: Urknall-Schlag ${M.lautA} nicht 1,3-mal so laut wie der lauteste Bruchknall bis Level 26 (${Math.max(...bis26)})`);
      if(!kl.sturz||!(kl.sturz.lautA>Math.max(M.lautA,...neuOhne))) mangel.push(`MONSTER: Himmelssturz-Schlag ${kl.sturz&&kl.sturz.lautA} nicht der lauteste (Urknall ${M.lautA}, andere neue bis ${Math.max(...neuOhne)})`);
      else console.log(`Himmelssturz-Schlag: lautA ${kl.sturz.lautA}, Spitze ${kl.sturz.spitze}, rollt ${kl.sturz.dauer} s`);
    }
  }
  console.log(zeilen.join('\n'));
  console.log('Klangarten:',JSON.stringify(art));
  if(!opt.aus&&!opt.nur&&!opt.alt5){
    const n=Object.values(art).reduce((a,c)=>a+c,0), max=Math.max(0,...Object.values(art));
    if(Object.keys(art).length<6) mangel.push(`VIELFALT: nur ${Object.keys(art).length} Klangarten`);
    if(max>0.4*n) mangel.push(`VIELFALT: eine Klangart bei ${max} von ${n} Kugeln`);
    if(!monster||!monster.zweit) mangel.push('MONSTER: der Urknall hat keinen zweiten Schlag');
    else { const andere=Math.max(...Object.entries(knallMax).filter(([t])=>t!=='urknall300'&&lvlVon[t]<=26).map(([t,w])=>w));
      /* 09.10. nachmittags (Runde 6): die Lautheit vergleicht jetzt die
         Offline-Messung (lautA, oben) - der Mitschnitt hier zaehlt nur
         Bausteine und kennt Kompressor/Begrenzer des neuen Knalls nicht */
      if(opt.aus&&!(monster.zweit>=1.3*andere)) mangel.push(`MONSTER: zweiter Schlag ${monster.zweit} nicht 1,3-mal lauter als der lauteste Bruchknall ${andere}`);
      if(!(monster.zweitT>=1)) mangel.push(`MONSTER: zweiter Schlag schon nach ${monster.zweitT} s`); }
  }
  console.log(`\n${ids.length} Kugeln geprueft${opt.aus?' (Gegenprobe: alter Bruchklang, kein Zerlegerblitz)':opt.alt5?' (Gegenprobe: Knall der Runde 5)':''}`);
  if(errs.length) mangel.push(...errs.slice(0,5));
  if(!ids.length) mangel.push('keine Kugel gefunden');
  await b.close();
  if(mangel.length){ console.log('FEHLER ('+mangel.length+'):\n'+mangel.join('\n')); console.log('MANGEL: '+mangel.length); process.exit(1); }
  console.log('ALLES OK: jede Kugel knallt laut beim Zerlegen (Boom, kein Zischen, keine Uebersteuerung), mit Zerlegerblitz, jede anders; Urknall-Monster lauter als alles bis Level 26, der Himmelssturz am lautesten');
})();

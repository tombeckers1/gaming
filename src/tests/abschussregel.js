/* Waechter Abschussregel (Fundament Etappe 2b, Tom 13.10.2026: "Effekte
   kommen genau aus den Loechern/Rohren, sichtbare Loecher = Schusszahl,
   immer gleiche Art der Zuendung/Darstellung - es kann nicht sein, dass
   einmal aus der Verpackung abgeschossen wird und einmal ein ausgepacktes
   Produkt dasteht"). Regelwerk: docs/fundament/feuerwerk-regeln.md.
   Fuer JEDES Feuerwerksprodukt an JEDEM Zuend-Ort (Testfeld-Station im
   Spiel = auch Teststation und Zuend-Handy; Vorfuehrung = alle drei Listen,
   PC und Handy) und fuer die Vorschau der Werkbank (eigene Batterie, je Groesse):
   - R1 AUSGEPACKT: Darstellung kommt aus dem Abschuss-Baustein (14z4) und
     ist nie die Ladenverpackung (keine Folie, kein Klarsicht-/Acrylteil);
     Verpackungsform nur, wo die Form selbst das Produkt ist (AB_KOERPER)
   - R2 LOCH: sichtbare Starts = sichtbare Oeffnungen (Batterie: Rohre des
     Modells = Rohrraster = "N Schuss"; Rakete/Kugel 1; Roemische Lichter:
     jedes Rohr gleich oft; Fontaene/Kleinfeuerwerk: kein Start ausser dem
     Produkt selbst, wenn es fliegt). Kleine Funkenfontaenen zaehlen nicht.
   - R3 MUENDUNG: jeder Start kommt aus einer Oeffnung (Batterie: jedes
     Rohr genau einmal, keiner ohne Rohr; Rakete/Kugel an der Muendung,
     0-20 cm darueber; Lichter am eigenen Rohr des Buendels)
   - R4 GLEICH: Station und Vorfuehrung zeigen dieselbe Form, denselben
     Abschusspunkt relativ zum Platz (1 mm), dieselbe Zuendschnur, dieselben
     Starts
   - R5 MODELL: Rakete/Kugel stehen vor dem Start sichtbar an der Muendung
     (Kugel schaut oben heraus), fliegen nach dem Start mit, sind nach dem
     Abbrand weg; ein Produkt, das selbst fliegt, verschwindet vom Tisch
   - R6 ANLAGE: Station und Vorfuehranlage haben dieselben Abschussrohre
     und Moerser (abRohrBau/abMoerserBau)
   - R7 EINMAL: im Quelltext stellt nur der Baustein Produkte zum Zuenden
     auf und zuendet sie (raketeModell, kugelModell, batterieModell,
     kfTischAuf, kqPodestAuf, fkGestell, igniteType)
   Offene Fragen an Tom (AB_OFFEN) erscheinen als OFFEN statt als Fehler;
   steht dort etwas, das nicht mehr abweicht, ist das ein Fehler (Liste
   ehrlich halten).
   Aufruf: node abschussregel.js test.html ['["id",...]']
   Gegenprobe: GEGENPROBE=1..5 baut einen Fehler in eine Kopie der Seite
   (bzw. des Quelltexts) und erwartet, dass die passende Regel anschlaegt:
     1 Verpackung statt Produkt (R1)   2 alle Schuesse aus Rohr 0 (R3)
     3 Vorfuehrrohr senkrecht (R4)     4 Kugel tief im Rohr (R5)
     5 zweite Raketen-Darstellung im Quelltext (R7) */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const GP=+(process.env.GEGENPROBE||0);
const GP_REGEL={1:'R1',2:'R3',3:'R4',4:'R5',5:'R7'};
function fehlerSeite(datei){
  let s=fs.readFileSync(datei,'utf8');
  const tausch=(a,b)=>{ if(!s.includes(a)) throw new Error('Gegenprobe: Stelle nicht gefunden: '+a.slice(0,60)); s=s.replace(a,b); };
  if(GP===1) tausch("function abTeile(t){ return AB_KOERPER[t]&&VP_FORM[t]&&typeof VP_AUSGEPACKT==='function'?VP_AUSGEPACKT(t):buildProduct(t,true); }","function abTeile(t){ return buildProduct(t); }");
  if(GP===2) tausch("    ort(k){\n      if(k===undefined","    ort(k){ k=0;\n      if(k===undefined");
  if(GP===3) tausch("{ort:'vorf',neig:ROHR_ACHSE.neig,","{ort:'vorf',neig:0,");
  if(GP===4) tausch("kugel.position.y=rk*0.25;","");
  const neu=datei.replace(/\.html$/,'-gegenprobe'+GP+'.html'); fs.writeFileSync(neu,s); return neu;
}
/* R7: Quelltext der Teile - wer ruft die Darstellungs- und Zuendfunktionen auf */
function einmal(){
  const dir=path.join(__dirname,'..','parts'), out=[];
  /* dieselbe Liste wie der Node-Waechter (tools/fundament/waechter.js, Fundament Etappe 5) - eine Quelle */
  const FN=require(path.join(__dirname,'..','..','tools','fundament','waechter.js')).FW_FN;
  /* Ersatzaufbau, wenn die Engine ohne Platz gerufen wird (Tests, die
     igniteType direkt zuenden): Bengalholz-Halter (14q kqHolzPodest) */
  const ERSATZ=[/^14q-klein-neu\.js:.*kqHolzPodest|^14q-klein-neu\.js:  g=kqPodestAuf\('bengalholz'/];
  for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.js')&&f!=='14z4-abschuss.js')){
    let txt=fs.readFileSync(path.join(dir,f),'utf8');
    if(GP===5&&f==='17b-fwtest.js') txt+='\nfunction vfAltesModell(t){ return raketeModell(t); }\n';
    txt.split('\n').forEach((l,i)=>{ const code=l.replace(/\/\*.*?\*\//g,'').replace(/\/\/.*$/,'');
      for(const fn of FN){ const re=new RegExp('(^|[^a-zA-Z0-9_.])'+fn+'\\(','g'); if(!re.test(code)) continue;
        if(new RegExp('function '+fn+'\\(').test(code)) continue;
        const z=f+':'+l; if(ERSATZ.some(r=>r.test(z))) continue;
        out.push(`${f}:${i+1} ruft ${fn}( auf - Zuenden/Aufstellen nur ueber den Abschuss-Baustein (14z4)`); }
      /* Abschussgeraete: Raketenrohr (0,062 m) und Moerserrohr (MOERSER_R) baut nur der Baustein */
      if(/CylinderGeometry\(0\.062|MOERSER_R\[/.test(code)) out.push(`${f}:${i+1} baut ein eigenes Abschussrohr - nur abRohrBau/abMoerserBau (14z4)`); }); }
  return out;
}
(async()=>{
  const seite=GP&&GP<5?fehlerSeite(process.argv[2]):process.argv[2];
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage(); p.setDefaultTimeout(1800000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+seite,{timeout:240000}); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:240000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const nur=process.argv[3]?JSON.parse(process.argv[3]):(GP===1?['atomboeller','roemisch','bodenfeuer','feuerrad']:GP===2?['goldpalmen','knatter']:GP===3?['raketen','roemisch']:GP===4?['kugel75','kugel300']:GP===5?['raketen']:null);
  const vorab=await p.evaluate(nur=>{ const bb=window.__bb, A=window.__abschuss, S=bb.S;
    S.up.testfeld=true; S.up.shop_halb=true; S.level=99; S.money=9e6;
    /* nur zaehlen, nicht zeichnen: Partikel ohne Rechnung */
    for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) if(ps){ ps.emit=()=>0; ps.update=()=>0; }
    const ids=Object.keys(bb.P).filter(t=>bb.P[t]&&bb.stationOf(t)&&(!nur||nur.includes(t)));
    /* R6: Abschussgeraete */
    bb.vorfuehrungAn(); bb.run(0.2,0.05); const V=A.VF, va=A.vfAnlage;
    const anl={stRohre:bb.stations.rampe.g.userData.abRohre||0,stMoerser:bb.stations.moerser.g.userData.abMoerser||0,vfRohre:va?va.userData.abRohre||0:0,vfMoerser:va?va.userData.abMoerser||0:0,sollVfRohre:V.VF_ROHR.n,sollVfMoerser:3*V.VF_MOERSER.n};
    const rohrGeo=g=>{ const L=[]; g.traverse(q=>{ const pr=q.geometry&&q.geometry.parameters; if(q.geometry&&q.geometry.type==='CylinderGeometry'&&pr.openEnded&&(pr.radiusTop===0.062||pr.radiusTop===0.056)) L.push(pr.radiusTop+'/'+pr.height.toFixed(3)); }); return L.sort().join(','); };
    anl.stRohrArt=[...new Set(rohrGeo(bb.stations.rampe.g).split(','))].join(','); anl.vfRohrArt=va?[...new Set(rohrGeo(va).split(','))].join(','):'';
    bb.vorfuehrungAus();
    /* Werkbank-Vorschau: alle Lizenzen; die Effekte schaltet der Lauf selbst frei */
    S.lic=(bb.LIZENZEN||[]).map(l=>l.id);
    return {ids,anl,offen:A.AB_OFFEN}; },nur);
  const mangel=[], offen=[], zeilen=[];
  const regel=(r,t,txt)=>{ mangel.push(`${r} ${t}: ${txt}`); };
  const A6=vorab.anl;
  if(A6.stRohre!==3||A6.stMoerser!==3||A6.vfRohre!==A6.sollVfRohre||A6.vfMoerser!==A6.sollVfMoerser) regel('R6','Anlage',JSON.stringify(A6));
  if(A6.stRohrArt!==A6.vfRohrArt) regel('R6','Anlage',`Abschussrohre verschieden: Station ${A6.stRohrArt} / Vorfuehrung ${A6.vfRohrArt}`);
  /* je Produkt und Ort ein Aufruf (sonst reisst ein einziger Aufruf das Zeitlimit) */
  const lauf=async(t,ort,proto)=>p.evaluate(([t,ort,proto])=>{ const bb=window.__bb, A=window.__abschuss, P=bb.P, S=bb.S;
    try{ bb.vfStopp(); }catch(e){} if(bb.vfAn) bb.vorfuehrungAus(); bb.clearStations();
    for(let i=0;i<120&&(bb.emittersListe().length||bb.timersLen()>0||bb.rockets.length);i++) bb.run(0.5,0.25);
    bb.rockets.length=0; bb.emittersListe().length=0;
    const log=[]; log.brueche=[]; bb.fwLog(log); bb.ROHR_LOG=[]; window.__lochschuss.start(3);
    const AL=[]; A.log(AL);
    const out={t,ort};
    if(proto){ /* Vorschau der Werkbank (17h) je Groesse: Probestueck auf dem Vorschau-Zuendtisch, Zuendung nach WB_VS.vor */
      bb.BRUCH_IDS.forEach(e=>bb.bruchGesehen(e)); const d=bb.wbEntwurfNeu(+proto); d.name='Probe '+proto;
      out.vorP=Object.keys(P).length; bb.wbVorschauStart(d); bb.run(bb.WB_VS.vor+0.1,0.05); }
    else if(ort==='station'){ const st=bb.stations[bb.stationOf(t)]; S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st); S.carrying=null;
      const it=st.items[st.items.length-1]; if(it) bb.zuendeItem?bb.zuendeItem(st,it,true):bb.zuendeKanal(it.kanal); }
    else { bb.vorfuehrungAn(); bb.vfZuenden(t); }
    const auf=AL.find(x=>x.was==='auf'), zu=AL.find(x=>x.was==='zuend');
    if(!auf||!zu){ A.log(null); bb.fwLog(null); return Object.assign(out,{fehler:'nicht ueber den Abschuss-Baustein aufgestellt/gezuendet ('+AL.map(x=>x.was).join(',')+')'}); }
    if(proto) out.t=t=auf.t;
    const h=auf.h, pl=auf.pl, o=zu.o, form=auf.form;
    out.form=form; out.vor=zu.vor; out.oRel=[o.x-pl.x,o.y-pl.y,o.z-pl.z].map(v=>+v.toFixed(4));
    /* R1: woraus die Darstellung besteht */
    const VM=new Set(A.verpackungsMats());
    let teile=null;
    if(h.h&&h.h.pool) teile=h.h.pool.meshes.map(m=>m.material);
    out.anzeige=h.batt?'batterie':h.modell?'modell':h.gestell?'gestell':h.h?'teile':'nichts';
    out.verpackt=teile?teile.some(m=>VM.has(m)):false;
    if(h.modell){ let v=false; h.modell.traverse(q=>{ if(q.material&&VM.has(q.material)) v=true; }); out.verpackt=out.verpackt||v; }
    out.koerper=!!A.AB_KOERPER[t];
    /* Oeffnungen des gezeigten Modells */
    const L=bb.istBatterie(t)?A.rohrLayout(t):null;
    if(form==='batterie') out.loecher=A.rohrGeometrie(t,Math.PI).rohr.length, out.raster=L.rohre.length;
    else if(form==='rakete'||form==='kugel'||form==='gravur') out.loecher=1;
    else if(form==='buendel'){ const LO=A.abKerzenLoecher(pl,t); out.loecher=LO?LO.length:0; out.lochOrte=LO; }
    else out.loecher=0;
    /* Fontaenen: ihre Duesen sind Oeffnungen - ein Komet zum Schluss kommt aus der Duese */
    { const sh=P[t].shape; out.duesen=sh==='fountainset'?((A.fontDuesenLage(t)||[]).length||3):(sh==='cylinder'||sh==='fountain')?(t==='feuerteufel'?2:1):0; }
    const m=/(\d+)\s*Schuss/.exec(P[t].name||''); out.nameN=m?+m[1]:null;
    /* R5 vor dem Start */
    if(h.modell){ h.modell.updateMatrixWorld(true); const w=h.modell.getWorldPosition(new (h.modell.position.constructor)());
      out.vorher={sicht:h.modell.visible&&!!h.modell.parent,d:+Math.hypot(w.x-o.x,w.z-o.z).toFixed(3),dy:+(w.y-o.y).toFixed(3)};
      if(h.kugel){ const k=h.kugel, r=k.geometry&&k.geometry.parameters?k.geometry.parameters.radius:0.05; out.vorher.kugelOben=+(w.y+k.position.y+r-o.y).toFixed(3); } }
    if(h.h&&A.AB_FLIEGT_T[t]) out.vorher={sicht:h.h.pool.h.indexOf(h.h)>=0};
    /* bis kurz nach dem ersten Start fein, danach grob */
    const D=Math.min(150,zu.dauer+2);
    let s=0, start=null;
    for(;s<zu.vor+3&&!start;s+=0.05){ bb.run(0.05,0.05); start=log.find(e=>e.art==='schuss'||e.art==='kugel'||e.art==='perle'||e.art==='topf'); }
    if(start&&(h.modell||A.AB_FLIEGT_T[t])){ bb.run(0.4,0.05); s+=0.4;
      if(h.modell){ const g=h.modell; out.flug={drin:!!g.parent,y:+(g.position.y-o.y).toFixed(2)}; }
      else out.flug={weg:h.h.pool.h.indexOf(h.h)<0}; }
    for(;s<D;s+=0.25) bb.run(0.25,0.125);
    /* Vorschau: das Probestueck verlaesst den Katalog wieder (nach dem Abbrand) */
    if(proto){ for(let i=0;i<80&&bb.wbVs;i++) bb.run(0.5,0.25); out.protoP=Object.keys(P).length-out.vorP; }
    const Z=window.__lochschuss.stop(), RL=bb.ROHR_LOG||[]; bb.ROHR_LOG=null; bb.fwLog(null); A.log(null);
    out.nachher={modell:h.modell?!!h.modell.parent:null,weg:!!h.weg_,stationLeer:ort==='vorf'||proto?null:bb.stations[bb.stationOf(t)].items.length===0};
    const art={}; for(const e of log){ const k=e.art==='perle'&&/^licht:/.test(e.eff||'')?'licht':e.art; art[k]=(art[k]||0)+1; }
    out.art=art; out.Z={l:Z.lichter,k:Z.kometen,f:Z.koepfeFrei};
    out.starts=(art.schuss||0)+(art.kugel||0)+(art.topf||0)+(art.perle||0)+Z.lichter+Z.kometen+Z.koepfeFrei;
    /* R3: Orte der Starts */
    const st=log.filter(e=>e.x!==undefined&&(e.art==='schuss'||e.art==='kugel'||e.art==='perle'||e.art==='topf'));
    out.dmax=st.length?+Math.max(...st.map(e=>Math.hypot(e.x-o.x,(e.z!==undefined?e.z:o.z)-o.z))).toFixed(3):0;
    out.dy=st.length?[+Math.min(...st.map(e=>(e.y!==undefined?e.y:o.y)-o.y)).toFixed(3),+Math.max(...st.map(e=>(e.y!==undefined?e.y:o.y)-o.y)).toFixed(3)]:null;
    if(form==='buendel'&&out.lochOrte){ const je=out.lochOrte.map(()=>0); let neben=0;
      for(const e of st){ let bi=-1, bd=1e9; out.lochOrte.forEach((q,i)=>{ const d=Math.hypot(e.x-q.x,(e.z!==undefined?e.z:q.z)-q.z); if(d<bd){ bd=d; bi=i; } }); if(bd>out.lochOrte[bi].r+0.006) neben++; else je[bi]++; }
      out.jeRohr=je; out.neben=neben; delete out.lochOrte; }
    if(form==='batterie'){ const ri=RL.filter(e=>e.i!==undefined&&e.i>=0).map(e=>e.i); out.rohr={gefeuert:ri.length,einzeln:new Set(ri).size,ohne:RL.filter(e=>e.i===-1).length}; }
    out.jit=o.jit; out.hx=o.hx;
    return out; },[t,ort,proto||null]);
  const erg={};
  for(const t of vorab.ids){ erg[t]={}; for(const ort of ['station','vorf']){ const r=await lauf(t,ort); erg[t][ort]=r; } }
  /* Werkbank-Vorschau je Groesse (nur im vollen Lauf) */
  const protos=nur&&!process.env.WB?[]:['0','1','2','3','4'];   /* Werkbank-Vorschau, fuenf Groessen (25 ... 500 Schuss) */
  for(const tr of protos){ const r=await lauf(null,'station',tr); erg['proto:'+tr]={station:r}; }
  /* Auswertung */
  for(const [t,v] of Object.entries(erg)){
    for(const [ort,r] of Object.entries(v)){
      if(r.fehler){ regel('R1',t+'@'+ort,r.fehler); continue; }
      const id=r.t;
      zeilen.push(`${t.padEnd(22)} ${ort.padEnd(7)} ${String(r.form).padEnd(9)} Loecher ${String(r.loecher).padStart(3)} Starts ${String(r.starts).padStart(3)} ${JSON.stringify(r.art)}${r.jeRohr?' je Rohr '+r.jeRohr:''}`);
      /* R1 */
      if(r.verpackt) regel('R1',t+'@'+ort,`zeigt Verpackung (Folie/Klarsicht/Acryl) statt des Produkts (${r.form})`);
      if(r.anzeige==='nichts') regel('R1',t+'@'+ort,`kein Produkt am Platz (${r.form})`);
      /* R2 */
      const offenT=window_offen(t);
      let lochFehler=null;
      if(r.form==='batterie'){ if(r.loecher!==r.raster) lochFehler=`Modell ${r.loecher} Rohre, Rohrraster ${r.raster}`;
        else if(r.starts!==r.loecher) lochFehler=`${r.starts} sichtbare Starts aus ${r.loecher} Rohren`;
        else if(r.nameN!==null&&r.nameN!==r.loecher) lochFehler=`Name "${r.nameN} Schuss", ${r.loecher} Rohre`; }
      else if(r.form==='buendel'){ const n=r.jeRohr||[]; if(!n.length||n.some(x=>x!==n[0])||r.neben) lochFehler=`Lichter je Rohr ${n.join('/')} (${r.neben} neben den Rohren) - jedes Rohr gleich oft`; }
      else if(r.form==='rakete'||r.form==='kugel'||r.form==='gravur'){ if(r.starts!==1) lochFehler=`${r.starts} sichtbare Starts aus einem Rohr (${JSON.stringify(r.art)} ${JSON.stringify(r.Z)})`; }
      else { const fliegt=r.vorher&&r.vorher.sicht!==undefined&&r.flug; const erlaubt=fliegt?1:(r.duesen||0);
        if(r.starts>erlaubt) lochFehler=`${r.starts} sichtbare Starts ohne Rohr (${r.form}) ${JSON.stringify(r.art)}`; }
      if(lochFehler){ if(offenT) offen.push(`R2 ${t}@${ort} [${offenT}]: ${lochFehler}`); else regel('R2',t+'@'+ort,lochFehler); }
      else if(offenT&&ort==='station') regel('R2',t,`steht als offene Frage ${offenT} in AB_OFFEN, weicht aber nicht mehr ab - Liste bereinigen`);
      /* R3 */
      if(r.form==='batterie'){ const R=r.rohr; if(R.gefeuert!==r.loecher||R.einzeln!==r.loecher||R.ohne) regel('R3',t+'@'+ort,`${R.gefeuert} Zuendungen an ${R.einzeln} von ${r.loecher} Rohren, ${R.ohne} ohne Rohr`); }
      else if(r.form==='rakete'||r.form==='kugel'||r.form==='gravur'){ if(r.dmax>0.03+(r.jit||0)||!r.dy||r.dy[0]<-0.005||r.dy[1]>0.2) regel('R3',t+'@'+ort,`Start ${r.dmax} m neben der Muendung, Hoehe ${JSON.stringify(r.dy)}`); }
      else if(r.form!=='buendel'&&r.starts&&r.dmax>(r.hx||0.05)+0.03) regel('R3',t+'@'+ort,`Start ${r.dmax} m vom Produkt (Oeffnung ${r.hx})`);
      /* R5 */
      if(r.vorher&&r.vorher.d!==undefined){ if(!r.vorher.sicht||r.vorher.d>0.03) regel('R5',t+'@'+ort,`Modell vor dem Start nicht sichtbar an der Muendung ${JSON.stringify(r.vorher)}`);
        if(r.vorher.kugelOben!==undefined&&r.vorher.kugelOben<0.01) regel('R5',t+'@'+ort,`Kugel liegt im Rohr (Oberkante ${r.vorher.kugelOben} m zur Muendung) - nicht zu sehen`); }
      if(r.vorher&&(r.form==='rakete'||r.form==='kugel'||r.form==='gravur')&&!(r.flug&&r.flug.drin&&r.flug.y>1.5)) regel('R5',t+'@'+ort,`Modell fliegt nach dem Start nicht mit ${JSON.stringify(r.flug)}`);
      if(r.vorher&&r.vorher.sicht!==undefined&&r.vorher.d===undefined&&!(r.flug&&r.flug.weg)) regel('R5',t+'@'+ort,`fliegt selbst, steht nach dem Start aber noch auf dem Tisch`);
      if(r.nachher&&(r.nachher.modell||!r.nachher.weg||r.nachher.stationLeer===false)) regel('R5',t+'@'+ort,`nach dem Abbrand nicht abgeraeumt ${JSON.stringify(r.nachher)}`);
      if(r.protoP) regel('R5',t,`Prototyp bleibt im Katalog (${r.protoP} Eintraege)`);
    }
    /* R4 */
    const s=v.station, f=v.vorf;
    if(s&&f&&!s.fehler&&!f.fehler){
      if(s.form!==f.form) regel('R4',t,`Form Station ${s.form}, Vorfuehrung ${f.form}`);
      if(s.oRel.some((x,i)=>Math.abs(x-f.oRel[i])>0.001)) regel('R4',t,`Abschusspunkt zum Platz: Station ${s.oRel} / Vorfuehrung ${f.oRel}`);
      if(s.vor!==f.vor) regel('R4',t,`Zuendschnur Station ${s.vor} s, Vorfuehrung ${f.vor} s`);
      if(s.starts!==f.starts||JSON.stringify(s.art)!==JSON.stringify(f.art)) regel('R4',t,`Starts Station ${JSON.stringify(s.art)} / Vorfuehrung ${JSON.stringify(f.art)}`);
      if(s.loecher!==f.loecher) regel('R4',t,`Oeffnungen Station ${s.loecher} / Vorfuehrung ${f.loecher}`); }
  }
  function window_offen(t){ return (vorab.offen||{})[t]; }
  /* R7 */
  for(const x of einmal()) regel('R7','Quelltext',x);
  if(errs.length) mangel.push(...errs.slice(0,5));
  console.log(zeilen.join('\n'));
  console.log(`\n${vorab.ids.length} Produkte an 2 Orten${protos.length?', '+protos.length+' Prototypen':''}; Anlage ${JSON.stringify(A6)}`);
  if(offen.length) console.log('OFFEN (Fragen an Tom, AB_OFFEN):\n'+offen.join('\n'));
  await b.close();
  if(GP){ const r=GP_REGEL[GP], an=mangel.some(m=>m.startsWith(r+' '));
    console.log(an?`GEGENPROBE ${GP}: ${r} schlaegt an (${mangel.filter(m=>m.startsWith(r+' ')).length}x) - richtig`:`GEGENPROBE ${GP}: ${r} schlaegt NICHT an - der Waechter ist blind`);
    console.log(mangel.slice(0,6).join('\n')); process.exit(an?0:1); }
  console.log('MANGEL:',mangel.length?mangel.length:'keine');
  console.log('ERRORS:',mangel.length?mangel.join('\n'):'keine');
  if(mangel.length) process.exit(1);
  console.log('ALLES OK: jede Zuendung ueber den Abschuss-Baustein - ausgepackt, Loch = Schuss, aus der Muendung, an jedem Ort gleich');
})();

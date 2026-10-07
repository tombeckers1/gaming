/* =========================================================
   Gameplay-Vorfuehrung (03.10., Tom: "als haette ich das Spiel nahezu
   durchgespielt - grosser Laden mit den Produkten drin, Mitarbeiter,
   alles laeuft. Beobachten: wie ist das wirtschaftlich, wie sind die
   Texturen, wie arbeiten die Mitarbeiter; die einzelnen Bereiche
   anschauen, geht es wirtschaftlich weiter nach oben").
   - Start im Laptop > Laden (nur Entwicklung). Der eigene Spielstand
     wird vorher gesichert und beim Beenden zurueckgeholt; waehrend der
     Vorfuehrung speichert das Spiel nichts.
   - Aufbau ueber die echten Wege des Spiels: alle Lizenzen, jeder
     Ausbau ueber testKauf (mit seinen Nebenwirkungen), alle Mitarbeiter,
     Regale aller Arten im ganzen Laden, gefuellt mit dem Sortiment,
     Lagerregale mit Kartons. Dann oeffnet der Laden.
   - Es laeuft selbst: Laden auf, Feierabend, Tagesabschluss, naechster
     Tag; morgens bestellt ein Disponent nach, was knapp wird (echte
     Bestellung, echter LKW, die Einraeumer raeumen ein).
   - Leiste unten: Kontostand, Umsatz, Kunden, Ruf, Gewinn je Tag,
     Verlauf; Knoepfe/Tasten springen in die Bereiche; Zeitraffer.
   ========================================================= */
const GP_KEY='bb_gp_sicherung';
let gpAn=false, gpEl=null, gpTempo=1, gpTagAlt=-1, gpVerlauf=[], gpUhr=0, gpGestern=null;
/* Sprungpunkte: Name, x, z, Blickrichtung (yaw), Neigung */
const GP_ORTE=[
  ['Verkauf',      14.0, 2.0, Math.PI*0.08, -0.12],
  /* 04.10.: frueher stand der Blick mitten in der Schlange - jetzt schraeg
     von hinten auf die Kasse (CK_HOME 0,7 / 2,2) */
  ['Kassen',        6.0, 5.4, 1.0, -0.2],
  ['Halle Süd',    22.0,-8.0, Math.PI*0.95, -0.10],
  ['Lager',       -10.5, 1.0, Math.PI*0.62, -0.10],
  /* 07.10.: die Versandecke steht am Hallenende hinter Sued 3 (Tor V1) - Blick von vorn in die Ecke */
  ['Versand',     -13.0,-19.0, 0.1, -0.1],
  ['Logistik',    -30.0,-16.0, Math.PI*0.62, -0.05],
  ['Testfeld',      0.3,-8.5, 0, 0.05]
];
/* 03.10. (Tom: "die Gameplay-Vorfuehrung haengt, am Handy geht gar
   nichts - massive Renderprobleme; mach, dass das langsam laedt"):
   frueher entstand alles in einem einzigen Rechenschritt (rund 20
   Ausbauten, 50 Regale, 210 Faecher mit 154 Sorten, 400 Kartons) - der
   Browser stand Sekunden bis Minuten, am iPhone reichte der Canvas-
   Speicher fuer die Druckbilder aller Sorten nicht. Jetzt baut ein
   Generator Stueck fuer Stueck, je Bild nur wenige Millisekunden, mit
   Fortschrittsanzeige; auf Handys (COARSE) kleiner: weniger Regale,
   Lagerregale und Sorten. */
/* 03.10. abends (Tom, iPhone: "alles wird sichtbar, paar Sekunden spaeter
   bricht alles zusammen"): gemessen hielt die Vorfuehrung am Handy 334 MB
   Bildspeicher statt 168 MB beim Spielstart - und jedes Druckbild zusaetzlich
   als Kopie im Arbeitsspeicher. Die App beendet die Seite dann. Am Handy
   deshalb: Druckbilder der Vorfuehrungsware in halber Aufloesung (tex),
   jedes Bild gleich beim Entstehen auf die Grafikkarte laden statt alle auf
   einmal beim ersten Blick in den Laden, und die Kopie danach freigeben. */
const GP_KLEIN=COARSE?{regale:22,lager:4,sorten:40,tex:0.5,regal:0.5,frei:true}:{regale:90,lager:10,sorten:999,tex:0,regal:1,frei:false};
/* Platzhalter fuer freigegebene Druckbilder - wird nie gezeichnet, solange
   niemand das Bild neu hochladen laesst (Ware wird nie neu bemalt) */
let gpLeer=null;
function gpBildFrei(t){ t.onUpdate=null; const im=t.image; if(!im) return; t.__gpPx=im.width*im.height;
  if(im.getContext){ im.width=im.height=1; return; }
  if(im.data){ try{ gpLeer=gpLeer||new ImageData(1,1); t.image=gpLeer; }catch(e){} } }
/* neue Ware: Bilder sofort hochladen (verteilt die Last auf den Aufbau) */
function gpHochladen(pl){
  for(const m of pl.meshes){ for(const mt of [].concat(m.material)){ if(!mt) continue;
    for(const k of ['map','emissiveMap','alphaMap','bumpMap']){ const tx=mt[k]; if(!tx||tx===gpLeer) continue;
      if(GP_KLEIN.frei) tx.onUpdate=gpBildFrei;
      try{ if(renderer&&renderer.initTexture) renderer.initTexture(tx); }catch(e){} } } }
}
let gpBau=null, gpFertig=false, gpBauEl=null, gpWarteDdl=0;
function gpStart(){
  if(gpAn||!S) return;
  try{ save(); localStorage.setItem(GP_KEY,localStorage.getItem(KEY)||''); }catch(e){}
  gpAn=true; gpFertig=false;
  if(laptopOpen) closeLaptop(true);
  if(typeof vfAn!=='undefined'&&vfAn&&typeof vorfuehrungAus==='function') vorfuehrungAus();
  if(typeof vpAn!=='undefined'&&vpAn&&typeof vpAus==='function') vpAus();
  DEMO=false;
  gpBau={gen:gpAufbau(),anteil:0,text:'Vorbereitung'};
  gpBauAnzeige();
  requestAnimationFrame(gpBauLauf);
}
/* ein Stueck Aufbau, hoechstens ms Millisekunden lang */
function gpBauSchritt(ms){
  if(!gpBau) return true;
  const t0=performance.now();
  while(performance.now()-t0<ms){ let r; try{ r=gpBau.gen.next(); }catch(e){ console.warn('GP Aufbau',e); r={done:true}; }
    if(r.done){ gpBau=null; gpBauAnzeige(); return true; }
    if(r.value){ gpBau.anteil=r.value[0]; gpBau.text=r.value[1]; } }
  gpBauAnzeige(); return false;
}
function gpBauLauf(){ if(!gpBau) return; if(!gpBauSchritt(COARSE?6:12)) requestAnimationFrame(gpBauLauf); }
function gpBauAnzeige(){
  if(!gpBau){ if(gpBauEl){ gpBauEl.remove(); gpBauEl=null; } return; }
  if(!gpBauEl){ gpBauEl=document.createElement('div'); gpBauEl.id='gpBau';
    gpBauEl.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:70;width:min(420px,86vw);background:rgba(10,13,28,.92);color:#f2f5ff;border:2px solid #f2c230;border-radius:14px;padding:16px 18px;font:600 16px Barlow,Arial,sans-serif;text-align:center';
    document.body.appendChild(gpBauEl); }
  const p=Math.round(gpBau.anteil*100);
  gpBauEl.innerHTML=`<div style="font:700 20px 'Barlow Condensed',sans-serif;letter-spacing:.04em;color:#f2c230">GAMEPLAY-VORFÜHRUNG WIRD AUFGEBAUT</div>`+
    `<div style="margin:10px 0 8px;height:10px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden"><div style="height:100%;width:${p}%;background:#f2c230"></div></div>`+
    `<div style="opacity:.8">${p} % · ${gpBau.text}</div>`;
}
/* Abteilungen (05.10., Tom: "die Produkte in die Regale, die dafuer
   vorgesehen sind - manchmal stehen in grossen Regalen kleine Produkte und
   darueber ist super viel Platz ... eine Abteilung Essen/Trinken, eine
   kleines Zubehoer, eine Kleinfeuerwerk, eine Grossfeuerwerk"). Frueher
   kamen die Regalarten reihum auf den naechsten freien Platz und jedes
   Fach bekam die naechste Sorte, die hineinpasste: gemessen 72 % der
   Fachhoehe genutzt, im Grossverbund-Regal 48 %, 5 der 6 grossen
   Verbundbatterien fehlten ganz, und nur die Haelfte der Nachbarregale
   gehoerte zur selben Warengruppe.
   Jetzt: die Stellplaetze werden vom Eingang nach hinten durchgegangen
   (Basis, Erweiterung, Ostteil, Halle Sued), jede Abteilung bekommt
   einen zusammenhaengenden Abschnitt, so gross wie ihr Sortiment; die
   Regalart richtet sich nach der Ware (Kuehlpflichtiges in Kuehlschraenke,
   was nicht ins Verkaufsregal passt ins Grossverbund-Regal oder auf den
   grossen Tisch). Beim Einraeumen bekommt jede Sorte das Fach, dessen
   Hoehe sie am besten ausnutzt - die schwierigen (gross, wenige passende
   Faecher) zuerst. */
const GP_ABT=['et','zub','f1','f2'];
const GP_ABT_NAME={kasse:'Kassenregal',et:'Essen & Trinken',zub:'Zubehör',f1:'Kleinfeuerwerk',f2:'Großfeuerwerk'};
const GP_ZONEN=[[null,'shop_halb'],['shop_gross'],['shop_ost'],['shop_sued']];
const GP_FAECHER={hoch:5,standard:4,kuehl:4,gross:2,gondel:8,eck:8,tischgross:1,gitter2:3,kasse:5};
/* Hoehe genutzt: Packungshoehe mal Stapel durch Fachhoehe (0 = passt nicht) */
function gpNutz(t,kind,li){ const K=SHELFKIND[kind], la=layout(t,{kind,levels:[]},{li}); return la.cap?Math.min(1,la.h*la.st/fachHoehe(K,li)):0; }
function gpAbtVon(t){ const s=sparteVon(t); return s==='essen'||s==='getraenke'?'et':s==='zubehoer'?'zub':s==='f1'?'f1':'f2'; }
function gpPasstStd(t){ return layout(t,{kind:'standard',levels:[]},{li:0}).cap>0; }
/* was am Handy auf jeden Fall dabei ist */
function gpMuss(ware){
  const kug=ware.filter(t=>P[t].shape==='shell').sort((a,b)=>P[b].dims[0]-P[a].dims[0]).slice(0,4);
  return ware.filter(t=>P[t].kasse||!gpPasstStd(t)).concat(kug.filter(t=>!P[t].kasse&&gpPasstStd(t)));
}
/* Stellplaetze vom Eingang nach hinten: Zone fuer Zone, vorn vor hinten */
function gpSlotFolge(){
  const zi=sl=>GP_ZONEN.findIndex(z=>z.indexOf(sl.zone||null)>=0);
  return slotsOffen().filter(sl=>sl.art!=='kasse'&&zi(sl)>=0).sort((a,b)=>(zi(a)-zi(b))||(b.z-a.z)||(a.x-b.x));
}
function gpPlan(ware){
  const regale=[];
  const ks=SLOTS.find(sl=>sl.art==='kasse'&&slotFrei(sl));
  if(ks&&ware.some(t=>P[t].kasse)) regale.push({kind:'kasse',slot:ks,abt:'kasse'});
  /* Bedarf je Abteilung: Sorten, davon kuehlpflichtig, davon zu gross fuers Regal */
  /* flach: im Regalfach (52 cm) bliebe viel Luft - besser im niedrigen
     Fach unter der Gitterwanne. Nur dafuer Gitterboxen: in ihnen wird
     nichts verdeckt ausgeblendet (man sieht von oben hinein), jede Box
     mehr kostet gezeichnete Stuecke */
  const B={}; GP_ABT.forEach(a=>B[a]={n:0,kuehl:0,gross:0,flach:0});
  for(const t of ware){ if(P[t].kasse==='nur') continue; const b=B[gpAbtVon(t)]; b.n++;
    if(P[t].kuehlpflicht){ b.kuehl++; continue; } if(!gpPasstStd(t)){ b.gross++; continue; }
    const qr=gpNutz(t,'hoch',0);
    if(qr<0.45&&gpNutz(t,'gitter2',0)>=qr+0.2) b.flach++; }
  const folge=gpSlotFolge().slice(0,Math.max(0,GP_KLEIN.regale-regale.length)), N=GP_ABT.reduce((a,k)=>a+B[k].n,0)||1;
  /* Abschnitte: jede Abteilung bekommt Plaetze, bis ihre Faecher ihren
     Anteil am Sortiment decken. Wie viele Faecher es insgesamt werden,
     haengt an den Regalarten - darum zweimal gerechnet, das zweite Mal
     mit der echten Zahl aus dem ersten. */
  const verteile=gesamt=>{ const out=[]; let ai=0, fa=0, summe=0;
    const wunsch=GP_ABT.map(a=>({kuehl:Math.ceil(B[a].kuehl/4),gross:B[a].gross,flach:B[a].flach}));
    for(const sl of folge){
      while(ai<GP_ABT.length-1&&(B[GP_ABT[ai]].n===0||fa>=B[GP_ABT[ai]].n/N*gesamt)){ ai++; fa=0; }
      const a=GP_ABT[ai], w=wunsch[ai], art=sl.art||'wand';
      let kind;
      if(art==='insel'){ if(w.gross>0){ kind='tischgross'; w.gross--; } else kind='gondel'; }
      else if(art==='ecke') kind='eck';
      else if(w.kuehl>0){ kind='kuehl'; w.kuehl--; }
      else if(w.gross>0){ kind='gross'; w.gross-=2; }
      else if(w.flach>0){ kind='gitter2'; w.flach-=2; }
      else kind='hoch';
      /* passt die Art nicht an diesen Platz (Wand), die naechstkleinere */
      const alt=art==='insel'?[kind,'gondel']:art==='ecke'?['eck']:[kind,'hoch','standard','klein'];
      const k=alt.find(k=>SHELFKIND[k]&&stellPlatz(SHELFKIND[k],sl)); if(!k) continue;
      out.push({kind:k,slot:sl,abt:a}); fa+=GP_FAECHER[k]||4; summe+=GP_FAECHER[k]||4; }
    return {out,summe}; };
  let v=verteile(folge.reduce((a,sl)=>a+((sl.art||'wand')==='wand'?4:8),0));
  for(let n=0;n<2;n++) v=verteile(v.summe);
  regale.push(...v.out);
  return {regale};
}
/* Einraeumen nach Abteilung: Liste {lv,t} fuer die leeren Faecher */
function gpVerteilen(ware){
  const out=[], abtLv={};
  allLevels().forEach(l=>{ if(l.type||!l.sh.gpAbt) return; (abtLv[l.sh.gpAbt]||(abtLv[l.sh.gpAbt]=[])).push(l); });
  const nutz=(t,l)=>{ if(!shelfAccepts(l.sh,t)) return -1; const la=layout(t,l.sh,l); if(!la.cap) return -1;
    return Math.min(1,la.h*la.st/fachHoehe(kindOf(l.sh),l.li)); };
  const zuteilen=(levels,prods)=>{
    const offen=new Set(levels), weg=new Set();
    const passend=new Map(prods.map(t=>[t,levels.filter(l=>nutz(t,l)>0).length]));
    const reihe=prods.filter(t=>passend.get(t)>0).sort((a,b)=>(passend.get(a)-passend.get(b))||(P[b].dims[1]-P[a].dims[1])||(P[b].weight-P[a].weight));
    for(const t of reihe){ let best=null, bq=0; for(const l of offen){ const q=nutz(t,l); if(q>bq){ bq=q; best=l; } }
      if(best){ out.push({lv:best,t}); offen.delete(best); weg.add(t); } }
    /* uebrige Faecher: eine Sorte zum zweiten Mal - die das Fach gut
       ausnutzt und noch am seltensten doppelt steht */
    const oft=new Map();
    for(const l of offen){ let best=null, bw=-1; for(const t of prods){ const q=nutz(t,l); if(q<=0) continue; const w=q-0.12*(oft.get(t)||0);
        if(w>bw+1e-6||(best&&Math.abs(w-bw)<1e-6&&P[t].weight>P[best].weight)){ bw=w; best=t; } }
      if(best){ out.push({lv:l,t:best}); oft.set(best,(oft.get(best)||0)+1); } }
    return weg;
  };
  /* Kassenregal zuerst: was nur dorthin darf, dann Kleinkram */
  const kasse=ware.filter(t=>P[t].kasse==='nur').concat(ware.filter(t=>P[t].kasse==='gern'));
  const imKassenregal=abtLv.kasse?zuteilen(abtLv.kasse,kasse):new Set();
  for(const a of GP_ABT) if(abtLv[a]) zuteilen(abtLv[a],ware.filter(t=>gpAbtVon(t)===a&&P[t].kasse!=='nur'&&!imKassenregal.has(t)));
  return out;
}
/* Der Aufbau als Generator: jedes yield gibt dem Browser ein Bild */
function* gpAufbau(){
  /* Spaete Spielphase */
  S.level=Math.max(S.level,typeof testLevel==='function'?testLevel():30); S.xp=0; S.money=Math.max(S.money,450000); S.rep=Math.max(S.rep,72);
  S.lic=LIZENZEN.map(l=>l.id);
  ORDER.forEach(t=>{ if(P[t]&&!(S.prices[t]>0)) S.prices[t]=r2(marketOf(t)*1.04); });
  yield [0.02,'Lizenzen und Preise'];
  /* Ausbau in Level-Reihenfolge, so oft, bis nichts mehr dazukommt
     (Voraussetzungen). testKauf geht den normalen Kauf samt Aufbau. */
  const ups=UPGRADES.slice().sort((a,b)=>(a.lvl||0)-(b.lvl||0));
  for(let runde=0;runde<8;runde++){ let neu=0;
    for(const u of ups){ if(u.done()||(u.req&&!S.up[u.req])||(u.lvl||0)>S.level) continue;
      S.money=Math.max(S.money,450000);
      try{ testKauf(u.id); }catch(e){ console.warn('GP Ausbau',u.id,e); }
      if(u.done()) neu++;
      yield [0.02+0.23*Math.min(1,ups.filter(x=>x.done()).length/ups.length),'Ausbau: '+(u.name||u.id)]; }
    if(!neu) break; }
  /* Alle Mitarbeiter */
  for(const s of STAFF){ if(S.staff[s.id]||(s.req&&!S.up[s.req])) continue; S.staff[s.id]=true; try{ hireStaff(s.id); }catch(e){} yield [0.27,'Personal: '+s.name]; }
  /* Sortiment der Vorfuehrung: alles Freigeschaltete; am Handy die
     beliebtesten Sorten (jede Sorte kostet ein Druckbild) - dabei immer
     die Ware fuers Kassenregal, die grossen Batterien und die groessten
     Kugelbomben (05.10., Tom: "dass ich die genau im Regal sehe") */
  let ware=ORDER.filter(t=>P[t]&&isUnlocked(t)&&!P[t].noOrder&&!P[t].rezept);
  if(ware.length>GP_KLEIN.sorten){ const muss=gpMuss(ware);
    ware=muss.concat(ware.filter(t=>muss.indexOf(t)<0).sort((a,b)=>P[b].weight-P[a].weight)).slice(0,Math.max(GP_KLEIN.sorten,muss.length)); }
  /* Regale nach Abteilungen aufstellen (gpPlan), dann Lagerregale */
  const plan=gpPlan(ware);
  const altToast=window.toast; window.toast=()=>{}; REGAL_TEX=GP_KLEIN.regal;
  try{
    let n=0;
    for(const e of plan.regale){ const sl=e.slot, K=SHELFKIND[e.kind], q=stellPlatz(K,sl);
      if(!q||!slotPasst(K,sl)) continue;
      const sh=createShelf(shelves.length,{kind:e.kind,x:q.x,z:q.z,ry:q.ry}); sh.gpAbt=e.abt; n++;
      yield [0.28+0.22*n/plan.regale.length,'Regale aufstellen ('+n+') · '+GP_ABT_NAME[e.abt]]; }
    S.tut.shelf=true;
    /* Lagerregale */
    for(const id of ['rschwer','rhoch','rack']) for(let i=0;i<GP_KLEIN.lager;i++){ if(!regalOf(id)||!regalAufbauen(id)) break; yield [0.52,'Lagerregale']; }
  } finally { window.toast=altToast; REGAL_TEX=1; }
  /* Einraeumen: jede Abteilung fuellt ihre Regale (gpVerteilen) */
  const zuteilung=gpVerteilen(ware);
  for(let i=0;i<zuteilung.length;i++){ const {lv,t}=zuteilung[i];
    /* jede neue Sorte malt ihr Druckbild und baut ihre Form - das kostet
       bis zu einige hundert ms: dafuer ein eigenes Bild */
    if(typeof poolDa==='function'&&!poolDa(t)){ let pl; if(GP_KLEIN.tex) TEX_FAKTOR=GP_KLEIN.tex;
      try{ pl=pools[t]; } finally { TEX_FAKTOR=GFX_START.tex; }
      if(!pl) continue; gpHochladen(pl); yield [0.55+0.3*i/zuteilung.length,'Ware einräumen ('+(i+1)+' / '+zuteilung.length+') · '+(P[t].short||t)]; }
    else if(!pools[t]) continue;
    let k=0; while(k++<600&&addToLevel(lv,t,1));
    if(i%6===5) yield [0.55+0.3*i/zuteilung.length,'Ware einräumen ('+(i+1)+' / '+zuteilung.length+')']; }
  /* Lager: Kartons der meistverkauften Ware */
  const gut=ware.slice().sort((a,b)=>P[b].weight-P[a].weight);
  let g=0, rn=0;
  for(const r of racks){ for(const sl of r.slots){ if(sl.box) continue; const t=gut[g++%gut.length]; try{ putInSlot(sl,t,P[t].box,1); }catch(e){} }
    yield [0.86+0.12*(++rn)/Math.max(1,racks.length),'Lager füllen']; }
  /* Packmaterial-Regale voll (Erstausstattung) */
  if(typeof vmStand==='function'){ vmStand(0); for(let i=0;i<3;i++) VM_IDS.forEach(id=>{ S.vm[i][id]=VM[id].kap; }); vmRegalZeichnen(); }
  /* Laden auf, Spieler in den Verkauf */
  gpTagAlt=S.day; gpVerlauf=[{tag:S.day,geld:S.money}]; gpGestern=null;
  if(phase==='closed'){ if(typeof ruhetag==='function'&&ruhetag()) ruhetagBeenden(); else openShop(); }
  gpSpringe(0);
  if(!HIQ) yield* gpStatisch();
  gpFertig=true;
  gpPanel(); gpZeichnen(); requestAnimationFrame(gpFpsLauf);
  toast('Gameplay-Vorführung: alles gebaut, Personal da, der Laden läuft. Tasten 1–7 springen in die Bereiche, T Zeitraffer, B beendet.','money');
}
/* 04.10. (Tom: am Handy "maximal fluessig, 30 fps"): gemessen kostete der
   Blick von den Kassen in den Laden rund 870 Zeichenaufrufe - allein die
   Kassentische bestehen aus je rund 70 Einzelteilen. Am Handy werden nach
   dem Aufbau in jedem Moebel die unbeweglichen Teile mit gleichem Material
   zu einem Teil zusammengefasst. Nicht angefasst: Regale (Ware), Lager-
   regale, Personen, Teile direkt in der Szene (Waende, Zonen), Teile mit
   Kindern, eigenen Daten, Trefferflaechen, Durchsichtiges, Eckfarben,
   Sichtschutz (occluders) und alles mit eigener Zeichenreihenfolge. */
function* gpStatisch(){
  const raus=new Set(); shelves.forEach(x=>raus.add(x.g)); racks.forEach(x=>raus.add(x.g));
  const tops=scene.children.filter(o=>!o.isMesh&&!o.isSprite&&!o.isPoints&&!o.isLight&&!raus.has(o)&&!(o.userData&&o.userData.legs));
  let weg=0, k=0;
  for(const top of tops){
    const gruppen=[]; top.traverse(o=>{ if(o.userData&&o.userData.legs) return; if(!o.isMesh&&o.children&&o.children.length) gruppen.push(o); });
    for(const par of gruppen){ let p=par, person=false; while(p){ if(p.userData&&p.userData.legs){ person=true; break; } p=p.parent; } if(person) continue;
      const nachMat=new Map();
      for(const o of par.children){ const mt=o.material, gg=o.geometry;
        if(!o.isMesh||o.isInstancedMesh||!mt||Array.isArray(mt)||mt.transparent||mt.vertexColors||mt===hitM||!o.visible||o.children.length||o.renderOrder) continue;
        if(Object.keys(o.userData||{}).length||occluders.indexOf(o)>=0||!gg||!gg.attributes||!gg.attributes.position||!gg.attributes.normal||gg.attributes.position.count>6000) continue;
        const l=nachMat.get(mt)||[]; l.push(o); nachMat.set(mt,l); }
      for(const [mt,l] of nachMat){ if(l.length<2) continue; l.forEach(o=>o.updateMatrix());
        const m=new THREE.Mesh(merge(l.map(o=>({geo:o.geometry,m:o.matrix}))),mt); m.castShadow=l.some(o=>o.castShadow); m.receiveShadow=l.some(o=>o.receiveShadow);
        l.forEach(o=>par.remove(o)); par.add(m); weg+=l.length-1; } }
    if(++k%4===0) yield [0.99,'Für das Handy zusammenfassen'];
  }
  gpStatischWeg=weg;
}
let gpStatischWeg=0;
/* Beenden: den alten Spielstand zurueckschreiben und neu laden */
function gpEnde(){
  if(!gpAn) return;
  let alt=''; try{ alt=localStorage.getItem(GP_KEY)||''; }catch(e){}
  /* gpAn bleibt an: beim Neuladen speichert das Spiel sonst den
     Vorfuehrungsstand ueber den eben zurueckgeschriebenen */
  try{ if(alt) localStorage.setItem(KEY,alt); else localStorage.removeItem(KEY); localStorage.removeItem(GP_KEY); }catch(e){}
  location.reload();
}
function gpSpringe(i){
  const o=GP_ORTE[i]; if(!o) return;
  pl.x=o[1]; pl.z=o[2]; yaw=o[3]; pitch=o[4]; aim=null; collide(pl,0.32);
}
/* Bildrate fuer Tom (04.10.: "Hauptsache es laeuft mit 30 fps") - in der
   Leiste, gemessen ueber die echten Bilder des Browsers */
let gpBilder=0, gpFps=0, gpFpsT=0;
function gpFpsLauf(t){ if(!gpAn) return; gpBilder++; if(!gpFpsT) gpFpsT=t; if(t-gpFpsT>=1000){ gpFps=Math.round(gpBilder*1000/(t-gpFpsT)); gpBilder=0; gpFpsT=t; } requestAnimationFrame(gpFpsLauf); }
function gpTempoWechsel(){ gpTempo=gpTempo===1?3:gpTempo===3?6:1; gpZeichnen(); }
/* Laeuft je Spielschritt: Tagesablauf ohne Klicks, Nachbestellen */
function gpTick(dt){
  if(!gpAn||!gpFertig) return;
  /* Aufstieg und Tagesabschluss selbst wegklicken - wie der Spieler */
  if(typeof levelOpen!=='undefined'&&levelOpen){ const b=$('luBtn'); if(b) b.click(); return; }
  if(summaryOpen){
    /* Bilanz des Tages fuer den Verlauf merken, dann "Naechster Tag" */
    if(!gpGestern||gpGestern.tag!==S.day) gpGestern={tag:S.day,umsatz:DS.revenue,kunden:DS.customers};
    const b=$('sBtn'); if(b&&b.onclick) b.onclick(); else closeSummary(); return; }
  /* DDL fuehrt die Abholung zu Ende (LKW, Tor, Mitarbeiter am Hubwagen), dann Tagesabschluss */
  if(phase==='after'){ if(typeof ddlLaeuft==='function'&&ddlLaeuft()&&gpWarteDdl<240){ gpWarteDdl+=dt; return; } gpWarteDdl=0; endDay(); return; }
  if(phase==='closed'){ if(typeof ruhetag==='function'&&ruhetag()) ruhetagBeenden(); else openShop(); }
  if(S.day!==gpTagAlt){ gpTagAlt=S.day; gpVerlauf.push({tag:S.day,geld:S.money}); if(gpVerlauf.length>14) gpVerlauf.shift(); gpBestellen(); }
  gpUhr-=dt; if(gpUhr<=0){ gpUhr=0.5; gpZeichnen(); }
}
/* Disponent: was im Laden und Lager zusammen unter einen Karton faellt,
   wird mit einem Karton nachbestellt - ueber den echten Warenkorb */
function gpBestellen(){
  const ware=ORDER.filter(t=>P[t]&&isUnlocked(t)&&!P[t].noOrder&&!P[t].rezept&&typeof canOrder==='function'&&canOrder(t));
  let n=0;
  for(const t of ware){ if(n>=24) break; if(stockOf(t)<P[t].box*0.6){ try{ cartAdd(t,1,(supplierFor(t)||{}).id); n++; }catch(e){} } }
  if(n){ try{ S.money=Math.max(S.money,0); cartOrder(); }catch(e){ console.warn('GP Bestellung',e); } }
  /* Versandmaterial: was unter die Haelfte faellt, wird aufgefuellt -
     der LKW bringt es, die Einraeumer raeumen es ins Packmaterial-Regal */
  if(typeof vmBestellbar==='function'&&zoneOffen('packstation')){ const alt=window.toast; window.toast=()=>{};
    try{ VM_IDS.forEach(id=>{ const k=vmBestellbar(id); if(k>0&&vmGesamt(id)<vmKapGesamt(id)*0.5) vmBestellen(id,k); }); } finally { window.toast=alt; } }
}
function gpPanel(){
  if(gpEl) return;
  gpEl=document.createElement('div'); gpEl.id='gameplayVf';
  gpEl.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:60;background:rgba(14,18,30,.9);color:#eef2f8;font:14px "Barlow Condensed",Arial,sans-serif;border:1px solid rgba(255,210,63,.6);border-radius:10px;padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;pointer-events:auto';
  gpEl.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; e.stopPropagation();
    if(b.dataset.ort!==undefined) gpSpringe(+b.dataset.ort); else if(b.dataset.gp==='tempo') gpTempoWechsel(); else if(b.dataset.gp==='ende') gpEnde(); });
  document.body.appendChild(gpEl);
}
function gpZeichnen(){
  if(!gpEl) return;
  const v=gpVerlauf, d=v.length>1?v[v.length-1].geld-v[v.length-2].geld:0, h=Math.floor(clock/60), m=Math.floor(clock%60);
  const spark=v.length>1?(()=>{ const mn=Math.min(...v.map(x=>x.geld)), mx=Math.max(...v.map(x=>x.geld)), W=120, H=26;
    const pts=v.map((x,i)=>`${(i/(v.length-1)*W).toFixed(1)},${(H-(mx>mn?(x.geld-mn)/(mx-mn):0.5)*H).toFixed(1)}`).join(' ');
    return `<svg width="${W}" height="${H}" style="vertical-align:middle"><polyline points="${pts}" fill="none" stroke="#6cf2a8" stroke-width="2"/></svg>`; })():'';
  const btn=(txt,attr)=>`<button ${attr} style="font:inherit;padding:3px 9px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#eef2f8;cursor:pointer">${txt}</button>`;
  gpEl.innerHTML=`<b style="color:#ffd23f;letter-spacing:.06em">GAMEPLAY-VORFÜHRUNG</b>`+
    `<span>Tag ${S.day} · ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} · ${phase==='open'?'geöffnet':'geschlossen'}</span>`+
    `<span>Konto <b>${eur(S.money)}</b></span><span>heute ${eur(DS.revenue)} · ${DS.customers} Kunden</span>`+
    `<span>Ruf ${Math.round(S.rep)}</span>`+
    (gpFps?`<span style="color:${gpFps>=28?'#6cf2a8':gpFps>=20?'#ffd23f':'#ff7a7a'}">${gpFps} fps</span>`:'')+
    (v.length>1?`<span style="color:${d>=0?'#6cf2a8':'#ff7a7a'}">seit gestern ${d>=0?'+':''}${eur(d)}</span>`:'')+
    (gpGestern?`<span>gestern ${eur(gpGestern.umsatz)} Umsatz</span>`:'')+spark+
    `<span style="flex-basis:100%;height:0"></span>`+
    GP_ORTE.map((o,i)=>btn(`${i+1} ${o[0]}`,`data-ort="${i}"`)).join('')+
    btn(`T Zeitraffer ${gpTempo}×`,'data-gp="tempo"')+btn('B Beenden','data-gp="ende" style="background:#c0392b"');
}
/* Tasten waehrend der Vorfuehrung */
function gpTaste(e){
  if(!gpAn) return false;
  if(/^Digit[1-7]$/.test(e.code)){ gpSpringe(+e.code.slice(5)-1); return true; }
  if(e.code==='KeyT'){ gpTempoWechsel(); return true; }
  if(e.code==='KeyB'){ gpEnde(); return true; }
  return false;
}


/* =========================================================
   Speichern & Laden
   ========================================================= */
function freshState(){ const prices={}; ORDER.forEach(t=>prices[t]=P[t].market);
  return {v:3,money:WIRT.start.geld,rep:WIRT.start.ruf,level:WIRT.start.level,xp:0,season:1,day:0,loan:null,prices,grime:0,
    up:{lager:false,plakat:false,terminal:false,tag4:false,heizung:false,musik:false,radio:false,cams:false,regallicht:false,alarm:false,shop_halb:false,testfeld:false,shop_gross:false,lager_nord:false,lager_gross:false,packstation:false,kasse2:false,labor:false,labor2:false,labor3:false,labor4:false,labor5:false},
    staff:{},prio:{},wage:{},pause:{},ev:null,goal:null,mkt:1,comp:1,deko:[],wall:'creme',floor:'grau',paint:[],test:null,stamm:{},
    /* Der Laden startet leer: kein Verkaufsregal, kein Lagerregal.
       Beides bestellt man bei Regalbau Stegemann, und der LKW
       bringt es an die Rampe. */
    shelves:[],racks:[],
    boxes:[],regale:[],
    carrying:null,tut:{},fwZaehler:{},seasonRevenue:0,cart:[],offen:0,pakete:0,bestellungen:[],paketGr:[],paketP:[],paletten:[],palNr:0,ddlTag:0,bestNr:0,lic:['start'],stat:{},erf:{},gesehen:[],eigene:[],gutschrift:0,mi:{},me:{},reg:{},mh:{},schock:{},news:[],infl:1,shopName:SHOP_DEFAULT,slogan:SLOGAN_DEFAULT}; }
/* Sorten, die es nicht mehr gibt (Toms PDF vom 25.09.): die alten
   Boeller werden beim Laden zu den neuen, der Heuler zum Furzboeller.
   Preise und Marktdaten der alten Sorten fallen weg - die neuen
   starten mit ihren eigenen. Alles andere, was eine Sorte nennt
   (Regale, Kartons, Warenkorb, Bestellungen, in der Hand), zieht mit. */
const SORTE_NEU={kanonen:'monsterboeller',grossboeller:'monsterboeller',doppelschlag:'monsterboeller',
  sprengmeister:'atomboeller',xxlpolen:'atomboeller',heuler:'boeller'};
/* Feuerwerk-Anomalien (26.09. nachts, Tom: "jedes Produkt eine
   Anomalie"): acht Sorten sind gestrichen, weil ein anderes Produkt
   dasselbe Bild zeigt (kritik.md). Wer sie im Laden, im Lager, im
   Warenkorb oder in einer Bestellung hat, bekommt beim Laden die Sorte,
   die sie ersetzt. bengalduo bleibt (Hafenlichter). */
const ERSETZT_DURCH={goldperlen:'roemisch',salutbatterie:'donnerschlag',kometenfaecher:'kometen',raketen50:'titanraketen',
  sternfontaene:'sternenbrunnen',tischfeuerwerk2:'tisch',knallbonbonxxl:'knallbonbon',konfettiknaller:'partypopper',
  /* 30.09. (Tom): neue Batterien ausser der Legion und neue Kugeln ausser der
     Kanonade wieder raus - Bestand wird zur naechsten neuen Sorte */
  roemerfeuer:'lichterprozession',nachtigall:'lichterprozession',kreuzritter:'lichterprozession',
  katapult:'kometenreigen',piranha:'kometenreigen',kolosseum:'sternentor',
  gluehwurm75:'farbenmeer75',perlenkette100:'kugel100',doppelgaenger150:'kugel150',sirene150:'kugel150',
  goldspinne200:'feuerlilie200',hummelkoenigin200:'feuerlilie200',niagara200:'feuerlilie200',
  /* 01.10.: von den Kugeln des 30.09. bleibt die Feuerlilie */
  rosengarten100:'kugel100',pfauenkrone150:'kugel150',sternschleier200:'feuerlilie200'};
Object.assign(SORTE_NEU,ERSETZT_DURCH,typeof ENTFERNT_ERSATZ!=='undefined'?ENTFERNT_ERSATZ:{});
/* Ketten aufloesen (tischfeuerwerk2 -> tisch -> gestrichen -> Ersatz) */
for(const k in SORTE_NEU){ let v=SORTE_NEU[k], n=0; while(SORTE_NEU[v]&&n++<5) v=SORTE_NEU[v]; SORTE_NEU[k]=v; }
function sortenUmstellen(d){
  for(const m of ['prices','mi','me','reg','mh','schock']) if(d[m]&&typeof d[m]==='object') for(const k in SORTE_NEU) delete d[m][k];
  const geh=(o,tiefe)=>{ if(!o||typeof o!=='object'||tiefe>10) return;
    if(Array.isArray(o)){ o.forEach(x=>geh(x,tiefe+1)); return; }
    for(const k of Object.keys(o)){ const v=o[k];
      if((k==='type'||k==='t')&&typeof v==='string'&&SORTE_NEU[v]) o[k]=SORTE_NEU[v];
      else if(SORTE_NEU[k]){ const n=SORTE_NEU[k];
        if(o[n]===undefined) o[n]=v; else if(typeof v==='number'&&typeof o[n]==='number') o[n]+=v;
        delete o[k]; }
      else geh(v,tiefe+1); } };
  geh(d,0);
}
function loadSave(){
  let r=null;
  try{ r=localStorage.getItem(KEY); if(!r) return null; const d=JSON.parse(r); return d&&d.v===3?d:null; }
  catch(e){
    /* Beschaedigter Stand (17.10.): nicht stillschweigend als "kein Spielstand" behandeln - Kopie sichern und melden */
    try{ if(r) localStorage.setItem(KEY+'_defekt',r); }catch(_){}
    SAVE_STATUS.defekt=String(e&&e.message||e).slice(0,80);
    try{ setTimeout(()=>{ if(typeof toast==='function') toast('Spielstand beschädigt ('+SAVE_STATUS.defekt+') – eine Kopie liegt unter '+KEY+'_defekt.','bad'); },1800); }catch(_){}
    return null; }
}
/* Zahl auf 2 Stellen; kaputter Wert (undefined/NaN) wird zu ersatz statt das Speichern zu kippen (17.10.) */
function r2n(v,ersatz){ return Number.isFinite(v)?+v.toFixed(2):(ersatz||0); }
function mpos(g){ return g?{x:r2n(g.position.x),z:r2n(g.position.z),ry:Number.isFinite(g.rotation.y)?+g.rotation.y.toFixed(3):0}:null; }
/* Der Spielstand als Objekt (ohne Schreiben) - save() und der Test speichern.js benutzen es */
function stateBauen(){
    const d={v:3,money:S.money,rep:S.rep,level:S.level,xp:S.xp,season:S.season,day:S.day,loan:S.loan,prices:S.prices,up:S.up,staff:S.staff,prio:S.prio||{},einr:S.einr||{},wage:S.wage||{},pause:S.pause||{},ev:S.ev||null,goal:S.goal||null,mkt:r2(S.mkt||1),comp:r2(S.comp||1),lic:S.lic||['start'],stat:S.stat||{},erf:S.erf||{},gesehen:S.gesehen||[],eigene:(S.eigene||[]).map(e=>{ const q=Object.assign({},e); delete q._neig; return q; }),eigeneAlt:S.eigeneAlt||[],wbv:1,werkbank:wbG?mpos(wbG):null,gutschrift:r2(S.gutschrift||0),fwZaehler:S.fwZaehler||{},mi:S.mi||{},me:S.me||{},reg:S.reg||{},mh:S.mh||{},schock:S.schock||{},news:S.news||[],infl:S.infl||1,
      wall:S.wall,floor:S.floor,paint:S.paint,test:S.test,stamm:S.stamm,blanks:gravBlanks,grav:gravG?mpos(gravG):null,grime:r2(S.grime||0),tut:S.tut,tutAus:!!S.tutAus,karre:S.karre||null,seasonRevenue:S.seasonRevenue,carrying:S.carrying,kisten:S.kisten|0,kisteHand:!!S.kisteHand,cart:S.cart||[],rest:S.rest||null,ekVor:S.ekVor||{},offen:S.offen|0,pakete:S.pakete|0,bestellungen:(S.bestellungen||[]).map(b=>({id:b.id,pos:b.pos.map(l=>({t:l.t,n:l.n,g:l.g})),gr:b.gr,wert:b.wert,versand:b.versand||0,rabatt:b.rabatt||0,st:b.st,tag:b.tag})),vm:S.vm||null,versandCfg:S.versandCfg||null,aktion:S.aktion||null,onlineLog:(S.onlineLog||[]).slice(-30),ddlUnterwegs:!!S.ddlUnterwegs,boxVoll:!!S.boxVoll,paketeVortag:S.paketeVortag|0,paketGr:(S.paketGr||[]).slice(),paketP:(S.paketP||[]).slice(),paletten:(S.paletten||[]).map(p=>({id:p.id,ort:p.ort,idx:p.idx})),palNr:S.palNr|0,ddlTag:S.ddlTag|0,bestNr:S.bestNr|0,shopName:S.shopName||SHOP_DEFAULT,slogan:S.slogan||'',
      deko:dekos.map(d2=>Object.assign({id:d2.id},mpos(d2.g))),
      ck:mpos(ckG),desk:mpos(deskG),pack:mpos(packTisch),sb2weg:1,
      shelves:shelves.map(s=>Object.assign(mpos(s.g),{kind:s.kind,levels:s.levels.map(l=>({type:l.type,count:l.count,q:l.q||1}))})),
      racks:racks.map(r=>Object.assign(mpos(r.g),{kind:r.kind,slots:r.slots.map(s=>s.box?{type:s.box.type,count:s.box.count,q:s.box.q||1,kiste:s.box.kiste?1:0}:null)})),
      /* Unterwegs bestellte Regale gehen beim Speichern nicht
         verloren: sie stehen als eigene Liste im Spielstand. */
      regale:pending.filter(p=>p.regal).map(p=>p.regal)
        .concat((typeof truck!=='undefined'&&truck?truck.cargo:[]).filter(c=>c.regal).map(c=>c.regal))
        .concat(S.carrying&&S.carrying.regal?[S.carrying.regal]:[]),
      /* Kassenpakete unterwegs, abgestellte Pakete mit Platz */
      einbauUnterwegs:pending.filter(p=>p.einbau).map(p=>p.einbau)
        .concat((typeof truck!=='undefined'&&truck?truck.cargo:[]).filter(c=>c.einbau).map(c=>c.einbau))
        .concat(S.carrying&&S.carrying.einbau?[S.carrying.einbau]:[]),
      /* Versandmaterial unterwegs, im LKW oder in der Hand kommt nach dem
         Laden mit der naechsten Lieferung (wie die Regale) */
      vmUnterwegs:pending.filter(p=>p.vm).map(p=>p.vm)
        .concat((typeof truck!=='undefined'&&truck?truck.cargo:[]).filter(c=>c.vm).map(c=>c.vm))
        .concat(S.carrying&&S.carrying.vm?[S.carrying.vm]:[])
        .concat(Object.values(staff).filter(w=>w&&w.carry&&w.carry.vm).map(w=>w.carry.vm)),
      paketeBoden:einbauPakete.map(b=>Object.assign({regal:b.regal,einbau:b.einbau},mpos(b.mesh))),
      einbauBestellt:S.einbauBestellt||{},
      boxes:floorBoxes.filter(b=>!b.test).map(b=>({type:b.type,count:b.count,q:b.q||1,kiste:b.kiste?1:0,x:r2n(b.mesh.position.x),y:r2n(b.mesh.position.y,0.2),z:r2n(b.mesh.position.z),ry:r2n(b.mesh.rotation.y)})).concat(pending.filter(p=>p.type&&P[p.type]).map(p=>({type:p.type,count:P[p.type].box,q:p.q||1}))).concat((typeof truck!=='undefined'&&truck?truck.cargo:[]).filter(c=>c.type&&P[c.type]).map(c=>({type:c.type,count:P[c.type].box,q:c.q||1})))};
    return d;
}
/* Speichern (Tom 17.10.: "save() schluckt Fehler still - bei der Simulation fiel der Spielstand auf einen aelteren Tag zurueck").
   Jeder Fehler wird sichtbar: Toast "Speichern fehlgeschlagen" mit Grund (Speicher voll / gesperrt / Fehler beim Bauen) und
   in SAVE_STATUS fuer Tests und die Leistungsanzeige. Der alte Stand bleibt dabei unveraendert (setItem schreibt nicht halb).
   Bei vollem Speicher zuerst Platz schaffen: Sicherungskopie der Vorfuehrung (GP_KEY, nur ausserhalb der Vorfuehrung) und der
   letzte Leistungsbericht (LM_KEY) sind ersetzbar - der Spielstand nicht. Danach wird nachgelesen, ob wirklich geschrieben wurde. */
const SAVE_STATUS={ok:0,fehler:0,letzter:null,grund:'',kb:0,toastT:0,platz:0};
function saveGrund(e,kb){
  const n=e&&(e.name||''), m=e&&(e.message||String(e))||'unbekannt';
  if(/quota/i.test(n+m)||(e&&(e.code===22||e.code===1014))) return 'Speicher des Browsers voll ('+kb+' KB Spielstand)';
  if(/security|denied|access/i.test(n+m)) return 'Browser verweigert den Speicher (privates Fenster / gesperrt)';
  return String(m).slice(0,80);
}
function saveMelden(grund,kb){
  SAVE_STATUS.fehler++; SAVE_STATUS.letzter=Date.now(); SAVE_STATUS.grund=grund;
  try{ console.warn('Speichern fehlgeschlagen: '+grund); }catch(_){}
  /* hoechstens alle 20 s melden - das Spiel speichert oft */
  const jetzt=Date.now(); if(jetzt-SAVE_STATUS.toastT<20000) return; SAVE_STATUS.toastT=jetzt;
  try{ if(typeof toast==='function') toast('Speichern fehlgeschlagen: '+grund+'. Der letzte gespeicherte Stand bleibt erhalten.','bad'); }catch(_){}
}
function save(){
  if(!S) return false;
  /* Gameplay-Vorfuehrung (17e): der eigene Spielstand bleibt unangetastet */
  if(typeof gpAn!=='undefined'&&gpAn) return false;
  /* Leistungsbericht (17g): waehrend und nach der Messung im eigenen Spielstand nichts speichern - bis zum Neuladen */
  if(typeof LM!=='undefined'&&LM&&(LM.an||LM.halt)) return false;
  let txt, d;
  try{ d=stateBauen(); }
  catch(e){ saveMelden('Spielstand nicht lesbar ('+saveGrund(e,0)+')',0); return false; }
  try{ txt=JSON.stringify(d); }
  catch(e){
    /* Zirkelbezug (ein Szenenobjekt im Stand): ohne die Bezuege speichern, statt gar nicht - und merken */
    try{ const seen=new WeakSet(); txt=JSON.stringify(d,(k,v)=>{ if(v&&typeof v==='object'){ if(seen.has(v)) return undefined; seen.add(v); } return v; }); SAVE_STATUS.zirkel=(SAVE_STATUS.zirkel|0)+1; console.warn('Spielstand mit Zirkelbezug gespeichert (Bezug weggelassen)'); }
    catch(e2){ saveMelden('Spielstand nicht lesbar ('+saveGrund(e2,0)+')',0); return false; }
  }
  const kb=Math.round(txt.length/1024); SAVE_STATUS.kb=kb;
  const schreibe=()=>{ localStorage.setItem(KEY,txt); const r=localStorage.getItem(KEY); if(!r||r.length!==txt.length) throw new Error('nach dem Schreiben nicht lesbar'); };
  try{ schreibe(); }
  catch(e1){
    /* Platz schaffen: ersetzbare Eintraege weg, dann noch einmal */
    let frei=false;
    try{ if(!(typeof gpAn!=='undefined'&&gpAn)){ if(localStorage.getItem(GP_KEY)!==null){ localStorage.removeItem(GP_KEY); frei=true; } }
      if(typeof LM_KEY!=='undefined'&&localStorage.getItem(LM_KEY)!==null){ localStorage.removeItem(LM_KEY); frei=true; } }catch(_){}
    if(frei){ try{ schreibe(); SAVE_STATUS.platz++; SAVE_STATUS.ok++; return true; }catch(e2){ e1=e2; } }
    /* kompakter: Verlaufsdaten kuerzen (Preisverlauf der Sorten, Online-Tageslog) - der Stand selbst bleibt vollstaendig */
    try{ const k=JSON.parse(txt);
      if(k.mh) for(const t in k.mh) if(Array.isArray(k.mh[t])&&k.mh[t].length>30) k.mh[t]=k.mh[t].slice(-30);
      if(Array.isArray(k.onlineLog)&&k.onlineLog.length>60) k.onlineLog=k.onlineLog.slice(-60);
      if(Array.isArray(k.gesehen)&&k.gesehen.length>200) k.gesehen=k.gesehen.slice(-200);
      txt=JSON.stringify(k); SAVE_STATUS.kb=Math.round(txt.length/1024); schreibe(); SAVE_STATUS.kompakt=(SAVE_STATUS.kompakt|0)+1; SAVE_STATUS.ok++; return true; }
    catch(e3){ e1=e3; }
    saveMelden(saveGrund(e1,kb),kb); return false;
  }
  SAVE_STATUS.ok++; return true;
}
/* =========================================================
   Rueckbau 16.10.2026 (Tom: "Die grosse Halle ist eine Katastrophe ... mach sie KOMPLETT weg"):
   Logistikhalle West (Stufen 1-3), Andockstationen R2-R5, Lagerlogistik (Hochregal, Anbruch,
   Kartonlager 3) und Werk West mit Produktion gibt es nicht mehr. Alte Staende laden sauber:
   - Ausbauten weg, Kaufpreis zurueck (WIRT.historie.erstattung.ausbau = Preis V141)
   - Werker und Mischer entlassen, ohne Kosten
   - Rohstoffe im Lager und bestellte Rohstoffe zum Kaufpreis zurueck (historie.erstattung.rohstoff)
   - Ware aus Hochregal, Anbruch, Fertigung, Trockenkammer und vom Boden der Halle: zuerst in freie
     Lagerfaecher, dann an die Warenannahme (hoechstens RB_BODEN Kartons), der Rest wird zum heutigen
     Einkaufspreis gutgeschrieben (ein Grosshaendler nimmt ihn zurueck) - nichts geht verloren
   - Lagerregale aus der Halle bzw. aus Kartonlager 3 ziehen auf freie Plaetze im Lager; ohne Platz
     nimmt der Regalbauer sie zum Grundpreis zurueck. Die fuenf Anbruch-Regale gab es mit dem Ausbau
     umsonst - sie entfallen ohne Gutschrift, ihre Ware zieht mit um.
   Einmalig: danach steht davon nichts mehr im Spielstand (save schreibt hr/ll/pd nicht mehr).
   ========================================================= */
const RUECKBAU_UP=['lager_west','lager_west2','lager_west3','rampe2','rampe3','rampe4','rampe5','lagerlogistik','fabrik','fabrik2','fabrik3'];
const RUECKBAU_STAFF=['werker1','werker2','werker3','mischer'];
const RB_BODEN=16;          /* Kartons, die hoechstens an der Warenannahme abgestellt werden (zwei Lagen auf den 8 Plaetzen) */
let RUECKBAU=null;          /* Ergebnis der letzten Umstellung (Test rueckbau.js) */
/* Liegt der Punkt dort, wo Halle, Schleuse, Kartonlager 3, Hof 2 oder Werk standen? */
function rbAusserhalb(x,z){ return x<-34.3||(x<LAY.lsued.x0-0.25&&z<LAY.hof.z0+0.2); }
function rbWare(L,t,c,q,k){ if(t&&P[t]&&c>0) L.push({t,c:Math.round(c),q:q||1,k:k?1:0}); }
/* 1. Schritt (Daten, vor dem Aufbau der Welt): Ausbauten, Personal, Rohstoffe, Ware einsammeln */
function rueckbauDaten(d){
  if(!d) return null;
  const up=d.up||{}, ST=d.staff||{};
  const hat=RUECKBAU_UP.some(id=>up[id])||RUECKBAU_STAFF.some(id=>ST[id])||!!(d.hr||d.ll||d.pd)||
    (Array.isArray(d.racks)&&d.racks.some(r=>r&&r.x!==undefined&&rbAusserhalb(r.x,r.z)))||
    (Array.isArray(d.boxes)&&d.boxes.some(b=>b&&b.x!==undefined&&rbAusserhalb(b.x,b.z)));
  if(!hat) return null;
  const E=WIRT.historie.erstattung, R={ausbau:0,roh:0,regalGeld:0,wareGeld:0,up:[],staff:[],ware:[],regale:[],anbruch:0,regalUm:0,regalWeg:0,inRegal:0,amBoden:0,zuGeld:0,kartons:0};
  for(const id of RUECKBAU_UP) if(S.up&&S.up[id]){ R.ausbau+=E.ausbau[id]||0; R.up.push(id); delete S.up[id]; }
  for(const id of RUECKBAU_STAFF){ if(S.staff&&S.staff[id]) R.staff.push(id);
    for(const k of ['staff','wage','pause','prio','einr']) if(S[k]&&typeof S[k]==='object') delete S[k][id]; }
  /* Hochregal: Plaetze und Ladungen unterwegs */
  const hr=d.hr; if(hr){ (Array.isArray(hr.p)?hr.p:[]).forEach(pl=>{ if(Array.isArray(pl)) pl.forEach(b=>b&&rbWare(R.ware,b.t,b.c,b.q)); });
    (Array.isArray(hr.tr)?hr.tr:[]).forEach(l=>{ if(l&&Array.isArray(l.b)) l.b.forEach(b=>b&&rbWare(R.ware,b.t,b.c,b.q)); }); }
  /* Werk: Rohstoffe (Lager + bestellt) zum Kaufpreis, Fertigware auf den Straßen, in der Trockenkammer, auf dem Foerderer */
  const pd=d.pd; if(pd){ const RS=E.rohstoff, pr=(r,pre)=>(RS[r]||0)*(pre?RS.premium:1);
    if(pd.lager) for(const r in pd.lager){ const L=pd.lager[r]||{}; R.roh+=(+L.std||0)*pr(r,false)+(+L.pre||0)*pr(r,true); }
    (Array.isArray(pd.bestellt)?pd.bestellt:[]).forEach(b=>{ if(b) R.roh+=(+b.kg||0)*pr(b.r,b.pre); });
    (Array.isArray(pd.s)?pd.s:[]).forEach(s2=>{ if(!s2) return; (Array.isArray(s2.pal)?s2.pal:[]).forEach(b=>b&&rbWare(R.ware,b.t,b.c,b.q));
      const k=s2.karton; if(k&&k.n>0) rbWare(R.ware,k.t,k.n,k.q?k.q/k.n:1); });
    (Array.isArray(pd.trocken)?pd.trocken:[]).forEach(x=>{ if(x&&Array.isArray(x.b)) x.b.forEach(b=>b&&rbWare(R.ware,b.t,b.c,b.q)); });
    (Array.isArray(pd.aus)?pd.aus:[]).forEach(Q=>{ if(Array.isArray(Q)) Q.forEach(pl=>{ if(Array.isArray(pl)) pl.forEach(b=>b&&rbWare(R.ware,b.t,b.c,b.q)); }); }); }
  R.roh=r2(R.roh);
  delete S.hr; delete S.ll; delete S.pd;
  /* Lagerregale ausserhalb des Lagers: Anbruch (umsonst) faellt weg, die uebrigen ziehen um (2. Schritt) */
  if(Array.isArray(S.racks)) S.racks=S.racks.filter(rd=>{ if(!rd||rd.x===undefined||!rbAusserhalb(rd.x,rd.z)) return true;
    const anbruch=rd.x>-46.2&&rd.x<-41.8&&rd.z>-28&&rd.z<-14;
    if(anbruch){ R.anbruch++; (rd.slots||[]).forEach(sd=>sd&&rbWare(R.ware,sd.type,sd.count,sd.q,sd.kiste)); }
    else R.regale.push({kind:rd.kind,slots:rd.slots||[]});
    return false; });
  /* Kartons am Boden der Halle (Stellplaetze, Wareneingang R2-R5) */
  if(Array.isArray(S.boxes)) S.boxes=S.boxes.filter(b=>{ if(!b||b.x===undefined||!rbAusserhalb(b.x,b.z)) return true; rbWare(R.ware,b.type,b.count,b.q,b.kiste); return false; });
  /* Regal- und Einbaupakete, Deko in der Halle: Pakete kommen mit der naechsten Lieferung, Deko an einen freien Platz */
  if(Array.isArray(S.paketeBoden)) S.paketeBoden=S.paketeBoden.filter(b=>{ if(!b||b.x===undefined||!rbAusserhalb(b.x,b.z)) return true;
    if(b.regal){ S.regale=(Array.isArray(S.regale)?S.regale:[]).concat([b.regal]); } else if(b.einbau){ S.einbauUnterwegs=(Array.isArray(S.einbauUnterwegs)?S.einbauUnterwegs:[]).concat([b.einbau]); } return false; });
  if(Array.isArray(S.deko)) S.deko.forEach(dk=>{ if(dk&&dk.x!==undefined&&rbAusserhalb(dk.x,dk.z)){ delete dk.x; delete dk.z; delete dk.ry; } });
  S.money=r2((+S.money||0)+R.ausbau+R.roh);
  R.kartons=R.ware.length;
  return R;
}
/* 2. Schritt (nach dem Aufbau der Lagerregale): Regale umstellen, Ware einlagern, Rest gutschreiben, Meldung */
function rueckbauEinlagern(R){
  if(!R) return;
  for(const rd of R.regale){ const K=RACKKIND[rd.kind]||RACKKIND.standard;
    if(rackPlatzFrei(K).length){ createRack(racks.length,{kind:K.id,slots:rd.slots}); R.regalUm++; }
    else { R.regalGeld+=K.cost; R.regalWeg++; rd.slots.forEach(sd=>sd&&rbWare(R.ware,sd.type,sd.count,sd.q,sd.kiste)); } }
  const frei=[]; for(const r of racks) for(const sl of r.slots) if(!sl.box) frei.push(sl);
  /* gleiche Sorten nebeneinander, die meistverkaufte zuerst ins Regal */
  R.ware.sort((a,b)=>(P[b.t].weight||0)-(P[a.t].weight||0)||(a.t<b.t?-1:a.t>b.t?1:0));
  for(const w of R.ware){
    const sl=frei.shift(); if(sl){ putInSlot(sl,w.t,w.c,w.q,!!w.k); R.inRegal++; continue; }
    if(R.amBoden<RB_BODEN){ spawnFloorBox(w.t,w.c,null,w.q,!!w.k); R.amBoden++; continue; }
    R.wareGeld+=w.c*ekRoh(w.t); R.zuGeld++; (R.geldListe||(R.geldListe=[])).push({t:w.t,c:w.c}); }
  R.wareGeld=r2(R.wareGeld); R.regalGeld=r2(R.regalGeld);
  S.money=r2(S.money+R.regalGeld+R.wareGeld);
  R.summe=r2(R.ausbau+R.roh+R.regalGeld+R.wareGeld);
  RUECKBAU=R;
  const teile=[R.ausbau?`Ausbauten ${eur(R.ausbau)}`:'',R.roh?`Rohstoffe ${eur(R.roh)}`:'',R.regalGeld?`${R.regalWeg} Lagerregal${R.regalWeg===1?'':'e'} ${eur(R.regalGeld)}`:'',R.wareGeld?`${R.zuGeld} Karton${R.zuGeld===1?'':'s'} zum Einkaufspreis ${eur(R.wareGeld)}`:''].filter(Boolean);
  const lager=R.inRegal+R.amBoden?` ${R.inRegal+R.amBoden} Karton${R.inRegal+R.amBoden===1?'':'s'} aus Halle und Werk stehen jetzt im Lager${R.amBoden?` (${R.amBoden} an der Warenannahme)`:''}.`:'';
  const pers=R.staff.length?` ${R.staff.length===1?'Ein Mitarbeiter':R.staff.length+' Mitarbeiter'} aus dem Werk ${R.staff.length===1?'ist':'sind'} ohne Kosten ausgeschieden.`:'';
  later(2.6,()=>toast(`Rückerstattung: Logistikhalle, Hochregal und Werk sind abgebaut – ${eur(R.summe)} gutgeschrieben${teile.length?` (${teile.join(', ')})`:''}.${lager}${pers}`,'money'));
}
function startGame(fresh){
  if(fresh){ try{ localStorage.removeItem(KEY); }catch(e){} }
  const d=fresh?null:loadSave();
  if(d) sortenUmstellen(d);
  S=Object.assign(freshState(),d||{});
  /* Spielstaende von vor den kleinen Anfangsstufen kennen deren
     Schluessel nicht. Wer damals gespielt hat, hatte das ganze
     Ladenlokal, das ganze Basislager und den Zugang zum Testfeld -
     das wird nachgetragen, sonst stuenden ploetzlich Waende mitten
     im eingerichteten Laden. */
  /* 05.10.: die SB-Kassen am zweiten Eingang sind abgeschafft (Tom: "machen
     keinen Sinn - die muessen weg"). Wer sie hatte - aufgestellt, als Paket
     unterwegs, abgestellt oder in der Hand; bis 26.09. kamen sie mit der
     Tuer -, bekommt den Kaufpreis zurueck, dazu die Einstellung der beiden
     SB-Betreuer, die nur fuer diese Zeile da waren. Einmal: danach steht
     davon nichts mehr im Spielstand. */
  if(d){ let zurueck=0, k3=false;
    /* sb2weg steht in jedem Stand ab heute: ohne die Marke saehe ein neuer
       Stand mit zweiter Tuer (kasse3 fehlt) aus wie einer von vor dem 26.09.
       und bekaeme bei jedem Laden Geld */
    if(!d.sb2weg&&d.up&&(d.up.kasse3||(d.up.eingang2&&d.up.kasse3===undefined))) k3=true;
    if(S.einbauBestellt&&S.einbauBestellt.kasse3){ k3=true; delete S.einbauBestellt.kasse3; }
    if(Array.isArray(S.einbauUnterwegs)&&S.einbauUnterwegs.includes('kasse3')){ k3=true; S.einbauUnterwegs=S.einbauUnterwegs.filter(id=>id!=='kasse3'); }
    if(Array.isArray(S.paketeBoden)&&S.paketeBoden.some(b=>b&&b.einbau==='kasse3')){ k3=true; S.paketeBoden=S.paketeBoden.filter(b=>!(b&&b.einbau==='kasse3')); }
    if(S.carrying&&S.carrying.einbau==='kasse3'){ k3=true; S.carrying=null; }
    if(k3) zurueck+=WIRT.historie.erstattung.kasse3;
    for(const id of ['kassierer4','kassierer5']){
      if(S.staff&&S.staff[id]) zurueck+=WIRT.historie.erstattung.sbBetreuer;
      for(const k of ['staff','wage','pause','prio','einr']) if(S[k]&&typeof S[k]==='object') delete S[k][id]; }
    if(S.up) delete S.up.kasse3;
    if(zurueck>0){ S.money=r2((+S.money||0)+zurueck);
      later(2.5,()=>toast(`Die SB-Kassen am zweiten Eingang sind abgebaut – ${eur(zurueck)} gutgeschrieben.`,'money')); } }
  /* 07.10.: die Packstation steht jetzt am hinteren Ende von Lager Sued 3 (Tom, Ausbauplan) und
     setzt die Halle voraus. Wer sie vorher hatte, ohne die letzte Hallenstufe, bekommt den Kaufpreis
     zurueck und kann sie dort neu bauen; wer die Halle hat, dessen Station zieht an die neue Stelle
     (PACK_HOME beim Laden). */
  if(d&&d.up&&d.up.packstation&&!d.up.lager_sued2){ let z=0;
    for(const [id,k] of [['packstation',WIRT.historie.erstattung.packstation],['packstation2',WIRT.historie.erstattung.packstation2],['packstation3',WIRT.historie.erstattung.packstation3]]) if(S.up[id]){ z+=k; delete S.up[id]; }
    for(const [id,k] of [['packer',WIRT.historie.erstattung.packer],['packer2',WIRT.historie.erstattung.packer2],['packer3',WIRT.historie.erstattung.packer3]]){ if(S.staff&&S.staff[id]) z+=k;
      for(const m of ['staff','wage','pause','prio','einr']) if(S[m]&&typeof S[m]==='object') delete S[m][id]; }
    S.paketGr=[]; S.paketP=[]; S.paletten=[]; S.pakete=0; S.pack=null;
    if(z>0){ S.money=r2((+S.money||0)+z); later(2.5,()=>toast(`Die Packstation zieht ans Hallenende (Lager Süd 4) – ${eur(z)} gutgeschrieben.`,'money')); } }
  /* Staende von vor den Kapiteln hatten das Lager von Anfang an */
  if(d&&d.up&&d.up.lager===undefined) S.up.lager=true;
  /* Vor dem 24.09. gab es die Logistikhalle nur in voller Groesse (alle drei Stufen) - seit dem Rueckbau 16.10.
     wird jede gekaufte Stufe einzeln erstattet, alte Staende ohne Stufe 2/3 bekommen sie mit erstattet */
  if(d&&d.up&&d.up.lager_west&&d.up.lager_west2===undefined){ S.up.lager_west2=true; S.up.lager_west3=true; }
  if(d&&d.up&&d.up.shop_halb===undefined){
    S.up.shop_halb=true; S.up.lager_nord=true; S.up.testfeld=true;
  }
  /* Eigene Batterien (Werkbank) VOR dem Abgleich der Preise ins Sortiment - sonst fielen ihre Preise als "unbekannte Sorte" heraus */
  S.gesehen=(Array.isArray(S.gesehen)?S.gesehen:[]).filter(e=>!!wbEffekt(e));
  /* Labor -> Werkbank (16.10.): alte Rezepturen umwandeln, alte zweite Zuendstufe erstatten (02d wbMigration) */
  if(d&&!d.wbv&&S.up.labor2) S.up.labor2_alt=true;
  if(S.up.labor&&!S.up.lager_nord) S.up.lager_nord=true;   /* die Werkbank steht in Lager Nord */
  const wbm=wbMigration();
  S.eigene=(Array.isArray(S.eigene)?S.eigene:[]).filter(e=>e&&e.id&&Array.isArray(e.abschnitte)&&WIRT.werkbank.stufen[e.stufe]).slice(0,WIRT.werkbank.slots);
  S.eigene.forEach(e=>{ e.serien=Array.isArray(e.serien)?e.serien.filter(x=>x&&x.kartons>0):[];
    e.abschnitte.forEach(x=>{ x.A=wbFarbId(x.A); x.B=wbFarbId(x.B); }); });   /* alte Knallfarben (V142) -> Pastell, 17.10. */
  S.eigeneAlt=(Array.isArray(S.eigeneAlt)?S.eigeneAlt:[]).filter(a=>a&&a.id&&a.dims);
  eigeneAlleEintragen();
  if(wbm) later(3,()=>toast(wbMigrationText(wbm),'money'));
  /* Rueckbau 16.10. NACH der Werkbank-Umstellung: alte Rezeptur-Sorten (Kartons im Hochregal/Werk) sind erst jetzt in P eingetragen -
     vorher fielen sie in rbWare als "unbekannte Sorte" stillschweigend weg (Merge Rueckbau+Werkbank 17.10.) */
  const rueckbau=rueckbauDaten(d);
  const F=freshState();
  S.prices=Object.assign(F.prices,S.prices||{}); for(const t in S.prices) if(!P[t]) delete S.prices[t]; /* aus dem Sortiment genommene Sorten */ S.up=Object.assign(F.up,S.up||{}); S.staff=Object.assign({},S.staff||{}); S.prio=Object.assign({},S.prio||{}); S.grime=clamp(+S.grime||0,0,1); S.mkt=clamp(+S.mkt||1,WIRT.markt.ladeMktMin,WIRT.markt.ladeMktMax); S.comp=clamp(+S.comp||1,WIRT.markt.konkurrenz.ladeMin,WIRT.markt.konkurrenz.ladeMax); if(S.ev&&!eventById(S.ev)) S.ev=null; S.wage=Object.assign({},S.wage||{}); S.pause=Object.assign({},S.pause||{}); S.tut=S.tut||{}; S.paint=S.paint||[]; S.stamm=S.stamm||{};
  S.shopName=(typeof S.shopName==='string'&&S.shopName.trim())?S.shopName.trim().slice(0,22):SHOP_DEFAULT;
  S.slogan=(typeof S.slogan==='string')?S.slogan.trim().slice(0,38):SLOGAN_DEFAULT;
  /* Restposten gibt es seit 26.09. nur noch als Angebot mit Vorrat -
     alte Pakete im Warenkorb fallen heraus */
  S.cart=(Array.isArray(S.cart)?S.cart:[]).filter(l=>l&&!l.pack&&P[l.t]&&l.n>0).slice(0,40);
  S.rest=(S.rest&&Array.isArray(S.rest.angebote))?{angebote:S.rest.angebote.filter(a=>a&&PACKS.some(x=>x.id===a.pack)&&a.vorrat>0&&a.bis>0).slice(0,8),t:+S.rest.t||60,seq:S.rest.seq|0,erst:!!S.rest.erst}:null;
  S.level=Math.max(1,S.level|0); S.xp=Math.max(0,S.xp|0); S.season=Math.max(1,S.season|0); S.day=Math.max(0,S.day|0);
  if(!WALLS.some(w=>w.id===S.wall)) S.wall='creme';
  if(!FLOORS.some(f=>f.id===S.floor)) S.floor='grau';
  if(S.loan&&(!S.loan.remaining||S.loan.remaining<=0)) S.loan=null;
  if(S.test&&typeof S.test.lvl!=='number') S.test=null;
  if(S.carrying&&!P[S.carrying.type]){ if(S.carrying.kiste) S.kisteHand=true; S.carrying=null; }
  S.kisten=Math.max(0,S.kisten|0); S.kisteHand=!!S.kisteHand&&!S.carrying;
  if(S.carrying&&S.carrying.type==='gravur'&&!S.carrying.text) S.carrying=null;
  S.offen=Math.max(0,S.offen|0); S.pakete=Math.max(0,S.pakete|0);
  /* Lizenzen und Marktdaten pruefen */
  S.lic=(Array.isArray(S.lic)?S.lic:[]).filter(id=>LIZENZEN.some(l=>l.id===id));
  if(S.lic.indexOf('start')<0) S.lic.unshift('start');
  S.infl=clamp(+S.infl||1,1,4);
  /* Herausforderungen und eigene Batterien (Werkbank) wiederherstellen */
  statInit();
  S.gutschrift=Math.max(0,r2(+S.gutschrift||0));
  marktInit();
  erfNachziehen();
  ORDER.forEach(t=>{ if(typeof S.prices[t]!=='number'||!isFinite(S.prices[t])||S.prices[t]<=0) S.prices[t]=marketOf(t); });
  S.mkt=r2(clamp(marktSchnitt(),0.7,1.5));
  S.news=Array.isArray(S.news)?S.news.slice(0,4):[];
  repaint();
  applyZonen();
  setSB(!!S.up.kasse2);
  setEingang2(!!S.up.eingang2);
  vsLaden(); drawPackSchild(); syncPakete();
  /* Eine nie verschobene Kasse steht in alten Staenden noch am alten
     Platz rechts vom Eingang - sie zieht an den neuen mit um. */
  { const c=d&&d.ck, alt=c&&Math.abs(c.x-CK_ALT.x)<0.01&&Math.abs(c.z-CK_ALT.z)<0.01&&Math.abs(c.ry-CK_ALT.ry)<0.01;
    const q=c&&!alt?c:CK_HOME; placeMovable(ckMov,q.x,q.z,q.ry); }
  if(d&&d.desk){ const m=movables.find(m=>m.kind==='desk'); if(m) placeMovable(m,Math.abs(d.desk.x+7.35)<0.01?-7.3:d.desk.x,d.desk.z,d.desk.ry); }
  /* 09.10.: die Versandecke ist fest eingebaut und steht immer an ihrem Platz vor Rolltor V1
     (vorher konnte man sie verschieben); was im Versandbereich steht, zieht unten um */
  if(packMov) placeMovable(packMov,PACK_HOME.x,PACK_HOME.z,PACK_HOME.ry);
  (S.shelves||F.shelves).slice(0,SLOTS.length).forEach((sd,i)=>createShelf(i,sd));
  (S.racks||F.racks).slice(0,RACKS.length).forEach((rd,i)=>createRack(i,rd));
  racksEntwirren();
  rueckbauEinlagern(rueckbau);

  (S.deko||[]).forEach(dk=>{ if(DEKO.some(x=>x.id===dk.id)) createDeko(dk.id,dk); });
  (S.boxes||F.boxes).forEach(fb=>{ if(P[fb.type]&&fb.count>0) spawnFloorBox(fb.type,fb.count,fb.x!==undefined?{x:fb.x,y:fb.y,z:fb.z,ry:fb.ry}:null,fb.q||1,!!fb.kiste); });
  /* Bestellte, aber noch nicht aufgebaute Regale wieder auf den Weg
     bringen - sie kommen mit der naechsten Lieferung. */
  (S.regale||[]).forEach(id=>{ if(regalOf(id)) pending.push({regal:id,t:lieferSek(),sup:'fachhandel'}); });
  (S.einbauUnterwegs||[]).forEach(id=>{ if(EINBAU[id]&&!S.up[id]) pending.push({einbau:id,t:lieferSek(),sup:'fachhandel'}); });
  (Array.isArray(S.vmUnterwegs)?S.vmUnterwegs:[]).slice(0,60).forEach(id=>{ if(VM[id]) pending.push({vm:id,t:lieferSek(),sup:'fachhandel'}); });
  (S.paketeBoden||[]).forEach(b=>{ if((b.regal&&regalOf(b.regal))||(b.einbau&&EINBAU[b.einbau]&&!S.up[b.einbau])) spawnPaket(b,{x:b.x,z:b.z,ry:b.ry}); });
  /* alte Spielstaende: Regale, Moebel und Kartons im Versandbereich an einen freien Platz */
  if(packMov&&d){ const n=versandBereichRaeumen(false); if(n) later(3,()=>toast(`${n} Sache${n===1?'':'n'} aus dem Versandbereich der Packstation umgestellt – dort wächst die Versandecke.`)); }
  if(S.up.labor) wbBauen(d&&d.werkbank?d.werkbank:null);
  if(S.up.gravur){ buildGravur(d&&d.grav?d.grav:null); gravBlanks=Math.max(0,Math.min(GRAV_MAX,(d&&d.blanks)|0)); drawGrav(); }
  STAFF.forEach(s=>{ if(S.staff[s.id]&&!inPause(s.id)) hireStaff(s.id); });
  if(S.up.regallicht){ shelfLight.intensity=0.8; shelfStrips.forEach(m=>m.emissiveIntensity=1.5); }
  if(!S.goal) newGoal();
  phase='closed'; clock=OPEN_T; newDayStats(); updateSign(); kartonFluegeAus(); updateCarry(); updateTool(); paused=false;
  /* Shader fuer Laden und Feuerwerk jetzt uebersetzen, nicht beim ersten Schuss */
  if(typeof shaderVorab==="function") shaderVorab();
}

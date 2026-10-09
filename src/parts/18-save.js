
/* =========================================================
   Speichern & Laden
   ========================================================= */
function freshState(){ const prices={}; ORDER.forEach(t=>prices[t]=P[t].market);
  return {v:3,money:500,rep:50,level:1,xp:0,season:1,day:0,loan:null,prices,grime:0,
    up:{lager:false,plakat:false,terminal:false,tag4:false,heizung:false,musik:false,radio:false,cams:false,regallicht:false,alarm:false,shop_halb:false,testfeld:false,shop_gross:false,lager_nord:false,lager_gross:false,packstation:false,kasse2:false,labor:false,labor2:false},
    staff:{},prio:{},wage:{},pause:{},ev:null,goal:null,mkt:1,comp:1,deko:[],wall:'creme',floor:'grau',schildBg:'auto',schildFg:'weiss',paint:[],test:null,stamm:{},
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
function loadSave(){ try{ const r=localStorage.getItem(KEY); if(!r) return null; const d=JSON.parse(r); return d&&d.v===3?d:null; }catch(e){ return null; } }
function mpos(g){ return g?{x:+g.position.x.toFixed(2),z:+g.position.z.toFixed(2),ry:+g.rotation.y.toFixed(3)}:null; }
function save(){
  if(!S) return;
  /* Gameplay-Vorfuehrung (17e): der eigene Spielstand bleibt unangetastet */
  if(typeof gpAn!=='undefined'&&gpAn) return;
  try{
    const d={v:3,money:S.money,rep:S.rep,level:S.level,xp:S.xp,season:S.season,day:S.day,loan:S.loan,prices:S.prices,up:S.up,staff:S.staff,prio:S.prio||{},einr:S.einr||{},wage:S.wage||{},pause:S.pause||{},ev:S.ev||null,goal:S.goal||null,mkt:r2(S.mkt||1),comp:r2(S.comp||1),lic:S.lic||['start'],stat:S.stat||{},erf:S.erf||{},gesehen:S.gesehen||[],eigene:S.eigene||[],gutschrift:r2(S.gutschrift||0),fwZaehler:S.fwZaehler||{},mi:S.mi||{},me:S.me||{},reg:S.reg||{},mh:S.mh||{},schock:S.schock||{},news:S.news||[],infl:S.infl||1,
      wall:S.wall,floor:S.floor,schildBg:S.schildBg||'auto',schildFg:S.schildFg||'weiss',paint:S.paint,test:S.test,stamm:S.stamm,blanks:gravBlanks,grav:gravG?mpos(gravG):null,grime:r2(S.grime||0),tut:S.tut,tutAus:!!S.tutAus,karre:S.karre||null,seasonRevenue:S.seasonRevenue,carrying:S.carrying,kisten:S.kisten|0,kisteHand:!!S.kisteHand,cart:S.cart||[],rest:S.rest||null,ekVor:S.ekVor||{},offen:S.offen|0,pakete:S.pakete|0,bestellungen:(S.bestellungen||[]).map(b=>({id:b.id,pos:b.pos.map(l=>({t:l.t,n:l.n,g:l.g})),gr:b.gr,wert:b.wert,versand:b.versand||0,rabatt:b.rabatt||0,st:b.st,tag:b.tag})),vm:S.vm||null,versandCfg:S.versandCfg||null,aktion:S.aktion||null,onlineLog:(S.onlineLog||[]).slice(-30),ddlUnterwegs:!!S.ddlUnterwegs,boxVoll:!!S.boxVoll,paketeVortag:S.paketeVortag|0,paketGr:(S.paketGr||[]).slice(),paketP:(S.paketP||[]).slice(),paletten:(S.paletten||[]).map(p=>({id:p.id,ort:p.ort,idx:p.idx})),palNr:S.palNr|0,ddlTag:S.ddlTag|0,bestNr:S.bestNr|0,shopName:S.shopName||SHOP_DEFAULT,slogan:S.slogan||'',
      deko:dekos.map(d2=>Object.assign({id:d2.id},mpos(d2.g))),
      ck:mpos(ckG),desk:mpos(deskG),pack:mpos(packTisch),sb2weg:1,
      shelves:shelves.map(s=>Object.assign(mpos(s.g),{kind:s.kind,schild:s.schild||undefined,levels:s.levels.map(l=>({type:l.type,count:l.count,q:l.q||1}))})),
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
      boxes:floorBoxes.filter(b=>!b.test).map(b=>({type:b.type,count:b.count,q:b.q||1,kiste:b.kiste?1:0,x:+b.mesh.position.x.toFixed(2),y:+b.mesh.position.y.toFixed(2),z:+b.mesh.position.z.toFixed(2),ry:+b.mesh.rotation.y.toFixed(2)})).concat(pending.filter(p=>p.type&&P[p.type]).map(p=>({type:p.type,count:P[p.type].box,q:p.q||1}))).concat((typeof truck!=='undefined'&&truck?truck.cargo:[]).filter(c=>c.type&&P[c.type]).map(c=>({type:c.type,count:P[c.type].box,q:c.q||1})))};
    localStorage.setItem(KEY,JSON.stringify(d));
  }catch(e){}
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
    if(k3) zurueck+=3800;
    for(const id of ['kassierer4','kassierer5']){
      if(S.staff&&S.staff[id]) zurueck+=650;
      for(const k of ['staff','wage','pause','prio','einr']) if(S[k]&&typeof S[k]==='object') delete S[k][id]; }
    if(S.up) delete S.up.kasse3;
    if(zurueck>0){ S.money=r2((+S.money||0)+zurueck);
      later(2.5,()=>toast(`Die SB-Kassen am zweiten Eingang sind abgebaut – ${eur(zurueck)} gutgeschrieben.`,'money')); } }
  /* 07.10.: die Packstation steht jetzt am hinteren Ende von Lager Sued 3 (Tom, Ausbauplan) und
     setzt die Halle voraus. Wer sie vorher hatte, ohne die letzte Hallenstufe, bekommt den Kaufpreis
     zurueck und kann sie dort neu bauen; wer die Halle hat, dessen Station zieht an die neue Stelle
     (PACK_HOME beim Laden). */
  if(d&&d.up&&d.up.packstation&&!d.up.lager_sued2){ let z=0;
    for(const [id,k] of [['packstation',6400],['packstation2',14000],['packstation3',26000]]) if(S.up[id]){ z+=k; delete S.up[id]; }
    for(const [id,k] of [['packer',700],['packer2',750],['packer3',800]]){ if(S.staff&&S.staff[id]) z+=k;
      for(const m of ['staff','wage','pause','prio','einr']) if(S[m]&&typeof S[m]==='object') delete S[m][id]; }
    S.paketGr=[]; S.paketP=[]; S.paletten=[]; S.pakete=0; S.pack=null;
    if(z>0){ S.money=r2((+S.money||0)+z); later(2.5,()=>toast(`Die Packstation zieht ans Hallenende (Lager Süd 4) – ${eur(z)} gutgeschrieben.`,'money')); } }
  /* Staende von vor den Kapiteln hatten das Lager von Anfang an */
  if(d&&d.up&&d.up.lager===undefined) S.up.lager=true;
  /* Vor dem 24.09. gab es die Logistikhalle nur in voller Groesse. Wer
     sie hatte, bekommt alle drei Stufen - niemand verliert Flaeche. */
  if(d&&d.up&&d.up.lager_west&&d.up.lager_west2===undefined){ S.up.lager_west2=true; S.up.lager_west3=true; }
  if(d&&d.up&&d.up.shop_halb===undefined){
    S.up.shop_halb=true; S.up.lager_nord=true; S.up.testfeld=true;
  }
  const F=freshState();
  S.prices=Object.assign(F.prices,S.prices||{}); for(const t in S.prices) if(!P[t]) delete S.prices[t]; /* aus dem Sortiment genommene Sorten */ S.up=Object.assign(F.up,S.up||{}); S.staff=Object.assign({},S.staff||{}); S.prio=Object.assign({},S.prio||{}); S.grime=clamp(+S.grime||0,0,1); S.mkt=clamp(+S.mkt||1,0.7,1.4); S.comp=clamp(+S.comp||1,0.85,1.15); if(S.ev&&!eventById(S.ev)) S.ev=null; S.wage=Object.assign({},S.wage||{}); S.pause=Object.assign({},S.pause||{}); S.tut=S.tut||{}; S.paint=S.paint||[]; S.stamm=S.stamm||{};
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
  /* Herausforderungen und eigene Rezepturen wiederherstellen */
  statInit();
  S.gutschrift=Math.max(0,r2(+S.gutschrift||0));
  S.gesehen=S.gesehen.filter(e=>BRUCH[e]);
  S.eigene=(Array.isArray(S.eigene)?S.eigene:[]).filter(e=>e&&e.id&&e.traeger&&e.eff).slice(0,40);
  eigeneAlleEintragen();
  marktInit();
  erfNachziehen();
  ORDER.forEach(t=>{ if(typeof S.prices[t]!=='number'||!isFinite(S.prices[t])||S.prices[t]<=0) S.prices[t]=marketOf(t); });
  S.mkt=r2(clamp(marktSchnitt(),0.7,1.5));
  S.news=Array.isArray(S.news)?S.news.slice(0,4):[];
  repaint();
  applyZonen();
  /* Die Westtore stehen nach dem Laden zu, ganz gleich was beim
     Speichern gerade an ihnen stand. */
  if(typeof wbaysInit==='function') wbaysInit();
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
  if(S.up.gravur){ buildGravur(d&&d.grav?d.grav:null); gravBlanks=Math.max(0,Math.min(GRAV_MAX,(d&&d.blanks)|0)); drawGrav(); }
  STAFF.forEach(s=>{ if(S.staff[s.id]&&!inPause(s.id)) hireStaff(s.id); });
  if(S.up.regallicht){ shelfLight.intensity=0.8; shelfStrips.forEach(m=>m.emissiveIntensity=1.5); }
  if(!S.goal) newGoal();
  phase='closed'; clock=OPEN_T; newDayStats(); updateSign(); kartonFluegeAus(); updateCarry(); updateTool(); paused=false;
  /* Shader fuer Laden und Feuerwerk jetzt uebersetzen, nicht beim ersten Schuss */
  if(typeof shaderVorab==="function") shaderVorab();
}

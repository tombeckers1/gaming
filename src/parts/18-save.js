
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
    carrying:null,tut:{},seasonRevenue:0,cart:[],offen:0,pakete:0,lic:['start'],stat:{},erf:{},gesehen:[],eigene:[],gutschrift:0,mi:{},me:{},reg:{},mh:{},schock:{},news:[],infl:1,shopName:SHOP_DEFAULT,slogan:SLOGAN_DEFAULT}; }
function loadSave(){ try{ const r=localStorage.getItem(KEY); if(!r) return null; const d=JSON.parse(r); return d&&d.v===3?d:null; }catch(e){ return null; } }
function mpos(g){ return g?{x:+g.position.x.toFixed(2),z:+g.position.z.toFixed(2),ry:+g.rotation.y.toFixed(3)}:null; }
function save(){
  if(!S) return;
  try{
    const d={v:3,money:S.money,rep:S.rep,level:S.level,xp:S.xp,season:S.season,day:S.day,loan:S.loan,prices:S.prices,up:S.up,staff:S.staff,prio:S.prio||{},wage:S.wage||{},pause:S.pause||{},ev:S.ev||null,goal:S.goal||null,mkt:r2(S.mkt||1),comp:r2(S.comp||1),lic:S.lic||['start'],stat:S.stat||{},erf:S.erf||{},gesehen:S.gesehen||[],eigene:S.eigene||[],gutschrift:r2(S.gutschrift||0),mi:S.mi||{},me:S.me||{},reg:S.reg||{},mh:S.mh||{},schock:S.schock||{},news:S.news||[],infl:S.infl||1,
      wall:S.wall,floor:S.floor,schildBg:S.schildBg||'auto',schildFg:S.schildFg||'weiss',paint:S.paint,test:S.test,stamm:S.stamm,blanks:gravBlanks,grav:gravG?mpos(gravG):null,grime:r2(S.grime||0),tut:S.tut,tutAus:!!S.tutAus,karre:S.karre||null,seasonRevenue:S.seasonRevenue,carrying:S.carrying,cart:S.cart||[],offen:S.offen|0,pakete:S.pakete|0,shopName:S.shopName||SHOP_DEFAULT,slogan:S.slogan||'',
      deko:dekos.map(d2=>Object.assign({id:d2.id},mpos(d2.g))),
      ck:mpos(ckG),desk:mpos(deskG),sb2:mpos(sb2G),pack:mpos(packTisch),
      shelves:shelves.map(s=>Object.assign(mpos(s.g),{kind:s.kind,levels:s.levels.map(l=>({type:l.type,count:l.count,q:l.q||1}))})),
      racks:racks.map(r=>Object.assign(mpos(r.g),{kind:r.kind,slots:r.slots.map(s=>s.box?{type:s.box.type,count:s.box.count,q:s.box.q||1}:null)})),
      /* Unterwegs bestellte Regale gehen beim Speichern nicht
         verloren: sie stehen als eigene Liste im Spielstand. */
      regale:pending.filter(p=>p.regal).map(p=>p.regal)
        .concat((typeof truck!=='undefined'&&truck?truck.cargo:[]).filter(c=>c.regal).map(c=>c.regal))
        .concat(S.carrying&&S.carrying.regal?[S.carrying.regal]:[]),
      boxes:floorBoxes.map(b=>({type:b.type,count:b.count,q:b.q||1,x:+b.mesh.position.x.toFixed(2),y:+b.mesh.position.y.toFixed(2),z:+b.mesh.position.z.toFixed(2),ry:+b.mesh.rotation.y.toFixed(2)})).concat(pending.filter(p=>!p.regal).map(p=>({type:p.type,count:P[p.type].box,q:p.q||1}))).concat((typeof truck!=='undefined'&&truck?truck.cargo:[]).filter(c=>!c.regal).map(c=>({type:c.type,count:P[c.type].box,q:c.q||1})))};
    localStorage.setItem(KEY,JSON.stringify(d));
  }catch(e){}
}
function startGame(fresh){
  if(fresh){ try{ localStorage.removeItem(KEY); }catch(e){} }
  const d=fresh?null:loadSave();
  S=Object.assign(freshState(),d||{});
  /* Spielstaende von vor den kleinen Anfangsstufen kennen deren
     Schluessel nicht. Wer damals gespielt hat, hatte das ganze
     Ladenlokal, das ganze Basislager und den Zugang zum Testfeld -
     das wird nachgetragen, sonst stuenden ploetzlich Waende mitten
     im eingerichteten Laden. */
  /* Staende von vor den Kapiteln hatten das Lager von Anfang an */
  if(d&&d.up&&d.up.lager===undefined) S.up.lager=true;
  /* Vor dem 24.09. gab es die Logistikhalle nur in voller Groesse. Wer
     sie hatte, bekommt alle drei Stufen - niemand verliert Flaeche. */
  if(d&&d.up&&d.up.lager_west&&d.up.lager_west2===undefined){ S.up.lager_west2=true; S.up.lager_west3=true; }
  if(d&&d.up&&d.up.shop_halb===undefined){
    S.up.shop_halb=true; S.up.lager_nord=true; S.up.testfeld=true;
  }
  const F=freshState();
  S.prices=Object.assign(F.prices,S.prices||{}); S.up=Object.assign(F.up,S.up||{}); S.staff=Object.assign({},S.staff||{}); S.prio=Object.assign({},S.prio||{}); S.grime=clamp(+S.grime||0,0,1); S.mkt=clamp(+S.mkt||1,0.7,1.4); S.comp=clamp(+S.comp||1,0.85,1.15); if(S.ev&&!eventById(S.ev)) S.ev=null; S.wage=Object.assign({},S.wage||{}); S.pause=Object.assign({},S.pause||{}); S.tut=S.tut||{}; S.paint=S.paint||[]; S.stamm=S.stamm||{};
  S.shopName=(typeof S.shopName==='string'&&S.shopName.trim())?S.shopName.trim().slice(0,22):SHOP_DEFAULT;
  S.slogan=(typeof S.slogan==='string')?S.slogan.trim().slice(0,38):SLOGAN_DEFAULT;
  S.cart=(Array.isArray(S.cart)?S.cart:[]).filter(l=>l&&(l.pack?PACKS.some(x=>x.id===l.pack):(P[l.t]&&l.n>0))).slice(0,40);
  S.level=Math.max(1,S.level|0); S.xp=Math.max(0,S.xp|0); S.season=Math.max(1,S.season|0); S.day=Math.max(0,S.day|0);
  if(!WALLS.some(w=>w.id===S.wall)) S.wall='creme';
  if(!FLOORS.some(f=>f.id===S.floor)) S.floor='grau';
  if(S.loan&&(!S.loan.remaining||S.loan.remaining<=0)) S.loan=null;
  if(S.test&&typeof S.test.lvl!=='number') S.test=null;
  if(S.carrying&&!P[S.carrying.type]) S.carrying=null;
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
  drawPackSchild(); syncPakete();
  if(d&&d.ck) placeMovable(ckMov,d.ck.x,d.ck.z,d.ck.ry);
  if(d&&d.desk){ const m=movables.find(m=>m.kind==='desk'); if(m) placeMovable(m,d.desk.x,d.desk.z,d.desk.ry); }
  if(d&&d.sb2&&sb2Mov) placeMovable(sb2Mov,d.sb2.x,d.sb2.z,d.sb2.ry);
  /* Die Versandecke steht, wo man sie hingeschoben hat. Ein neues
     Spiel stellt sie an ihren Platz hinter dem Rolltor zurueck. */
  if(packMov){ const q=d&&d.pack?d.pack:PACK_HOME; placeMovable(packMov,q.x,q.z,q.ry); }
  (S.shelves||F.shelves).slice(0,SLOTS.length).forEach((sd,i)=>createShelf(i,sd));
  (S.racks||F.racks).slice(0,RACKS.length).forEach((rd,i)=>createRack(i,rd));

  (S.deko||[]).forEach(dk=>{ if(DEKO.some(x=>x.id===dk.id)) createDeko(dk.id,dk); });
  (S.boxes||F.boxes).forEach(fb=>{ if(P[fb.type]&&fb.count>0) spawnFloorBox(fb.type,fb.count,fb.x!==undefined?{x:fb.x,y:fb.y,z:fb.z,ry:fb.ry}:null,fb.q||1); });
  /* Bestellte, aber noch nicht aufgebaute Regale wieder auf den Weg
     bringen - sie kommen mit der naechsten Lieferung. */
  (S.regale||[]).forEach(id=>{ if(regalOf(id)) pending.push({regal:id,t:lieferSek(),sup:'mertens'}); });
  if(S.up.gravur){ buildGravur(d&&d.grav?d.grav:null); gravBlanks=Math.max(0,Math.min(GRAV_MAX,(d&&d.blanks)|0)); drawGrav(); }
  STAFF.forEach(s=>{ if(S.staff[s.id]&&!inPause(s.id)) hireStaff(s.id); });
  if(S.up.regallicht){ shelfLight.intensity=0.8; shelfStrips.forEach(m=>m.emissiveIntensity=1.5); }
  if(!S.goal) newGoal();
  phase='closed'; clock=OPEN_T; newDayStats(); updateSign(); updateCarry(); updateTool(); paused=false;
  /* Shader fuer Laden und Feuerwerk jetzt uebersetzen, nicht beim ersten Schuss */
  if(typeof shaderVorab==="function") shaderVorab();
}

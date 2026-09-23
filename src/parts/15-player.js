
/* =========================================================
   Spieler
   ========================================================= */
const pl={x:-2.5,z:1.5}; let yaw=Math.atan2(2.5,-3), pitch=-0.3, bobT=0;
/* Sanfte Blickfuehrung, z.B. beim Zuenden auf das Testfeld.
   Jede eigene Mausbewegung bricht sie sofort ab. */
let aim=null;
function aimAt(x,z,p2){
  const dx=x-pl.x, dz=z-pl.z;
  aim={yaw:Math.atan2(-dx,-dz),pitch:p2===undefined?0.2:p2,t:0.9};
}
function updateAim(dt){
  if(!aim) return;
  let d=aim.yaw-yaw;
  while(d>Math.PI) d-=Math.PI*2;
  while(d<-Math.PI) d+=Math.PI*2;
  const k=Math.min(1,dt*7);
  yaw+=d*k; pitch+=(aim.pitch-pitch)*k;
  aim.t-=dt; if(aim.t<=0||Math.abs(d)<0.004) aim=null;
}
/* Noerdlich vom Gehweg faengt die Strasse an - da hat der Spieler
   nichts zu suchen, deshalb bleibt diese eine Grenze enger als das
   Navgitter. */
const PLZ_MAX=10.8;
const keys={}; const joy={x:0,y:0,id:null,ox:0,oy:0};
let sprayOn=false, sprayCool=0, build=false, grabbed=null, grabRy=0, grabHome=null;
function collide(p,R){
  for(const c of colliders){
    const cx=clamp(p.x,c.minX,c.maxX), cz=clamp(p.z,c.minZ,c.maxZ), dx=p.x-cx, dz=p.z-cz, d2=dx*dx+dz*dz;
    if(d2<R*R){
      if(d2>1e-8){ const d=Math.sqrt(d2); p.x=cx+dx/d*R; p.z=cz+dz/d*R; }
      else { const a=p.x-c.minX, b=c.maxX-p.x, e=p.z-c.minZ, f=c.maxZ-p.z, m=Math.min(a,b,e,f);
        if(m===a) p.x=c.minX-R; else if(m===b) p.x=c.maxX+R; else if(m===e) p.z=c.minZ-R; else p.z=c.maxZ+R; }
    }
  }
  /* Notbremse, falls doch einmal eine Wand fehlt. Die Grenzen standen
     noch auf der alten kleinen Karte: bei x 11,6 war das zweite
     Ladenlokal zu Ende und das Rueckgebaeude, die Suedhalle, die
     Westhalle und das halbe Testfeld waren ueberhaupt nicht zu
     betreten. Jetzt umschliessen sie die ganze bebaute Flaeche -
     dasselbe Rechteck, auf dem auch das Navgitter steht. */
  p.x=clamp(p.x,NAV.x0+0.4,NAV.x1-0.4); p.z=clamp(p.z,NAV.z0+0.4,PLZ_MAX);
}
function look(dx,dy,s){ aim=null; yaw-=dx*s; pitch=clamp(pitch-dy*s,-1.45,1.45); }
function updatePlayer(dt){
  let mx_=0,mz=0;
  if(keys.KeyW||keys.ArrowUp) mz-=1; if(keys.KeyS||keys.ArrowDown) mz+=1;
  if(keys.KeyA||keys.ArrowLeft) mx_-=1; if(keys.KeyD||keys.ArrowRight) mx_+=1;
  mx_+=joy.x; mz+=joy.y;
  const len=Math.hypot(mx_,mz); if(len>1){ mx_/=len; mz/=len; }
  const sp=(keys.ShiftLeft||keys.ShiftRight)?5.2:3.2, s=Math.sin(yaw), c=Math.cos(yaw);
  pl.x+=(mx_*c+mz*s)*sp*dt; pl.z+=(-mx_*s+mz*c)*sp*dt; collide(pl,0.32);
  if(len>0.1) bobT+=dt*sp*2.6;
  const sx=shake>0?rand(-shake,shake)*0.15:0; shake=Math.max(0,shake-dt*1.5);
  camera.position.set(pl.x+sx,1.65+Math.sin(bobT)*0.035+sx,pl.z);
  updateAim(dt);
  camera.rotation.set(pitch,yaw,0);
  if(sprayCool>0) sprayCool-=dt;
}

/* ---------- Umbaumodus ---------- */
function rectOf(m,x,z,ry){ const s=Math.abs(Math.sin(ry))>0.5, w=(s?m.fd:m.fw)/2, d=(s?m.fw:m.fd)/2; return {minX:x-w,maxX:x+w,minZ:z-d,maxZ:z+d}; }
/* Umgebaut werden darf in jedem Raum, der schon freigeschaltet ist.
   Ein Moebel muss ganz in einen Raum passen - so landet nichts in
   einem Durchgang oder halb in der Wand. */
const UMBAU_RAUM=[
  {r:LAY.basis},                        {r:LAY.lbasis},
  {r:LAY.ost1, z:'shop_gross'},         {r:LAY.ost2, z:'shop_ost'},
  {r:LAY.sued, z:'shop_sued'},          {r:LAY.lnord,z:'lager_gross'},
  {r:LAY.lsued,z:'lager_sued'},         {r:LAY.lwest,z:'lager_west'}
];
function imRaum(minX,maxX,minZ,maxZ){
  return UMBAU_RAUM.some(b=>(!b.z||zoneOffen(b.z))&&
    minX>=b.r.x0+0.08&&maxX<=b.r.x1-0.08&&minZ>=b.r.z0+0.08&&maxZ<=b.r.z1-0.08);
}
function spotFree(m,x,z,ry){
  if(!m.fw) return imRaum(x,x,z,z);
  const r=rectOf(m,x,z,ry);
  if(!imRaum(r.minX,r.maxX,r.minZ,r.maxZ)) return false;
  for(const c of colliders){ if(c.ref===m) continue;
    if(r.minX<c.maxX&&r.maxX>c.minX&&r.minZ<c.maxZ&&r.maxZ>c.minZ) return false; }
  return true;
}
function toggleBuild(on){
  build=on===undefined?!build:on;
  if(!build&&grabbed) cancelGrab();
  $('mode').textContent=build?(COARSE?'Umbau: antippen, greifen, absetzen':'Umbaumodus – E greifen, R drehen, F beenden'):'';
  $('btnMove').classList.toggle('on',build);
  S.tut.move=true;
}
function grab(m){
  grabbed=m; grabRy=m.g.rotation.y; grabHome={x:m.g.position.x,z:m.g.position.z,ry:grabRy};
  if(m.col){ dropCol(m.col); m.col=null; }
  sfx.pop();
}
function updateGrab(){
  if(!grabbed) return;
  const d=grabbed.fw>2?2.6:2.0;
  let x=pl.x-Math.sin(yaw)*d, z=pl.z-Math.cos(yaw)*d;
  x=Math.round(x*4)/4; z=Math.round(z*4)/4;
  grabbed.g.position.x=x; grabbed.g.position.z=z; grabbed.g.rotation.y=grabRy;
  if(grabbed.onPlace) grabbed.onPlace();
}
function placeGrab(){
  if(!grabbed) return;
  const m=grabbed;
  if(!spotFree(m,m.g.position.x,m.g.position.z,grabRy)){ toast('Da passt es nicht hin.','bad'); return; }
  applyFootprint(m); if(m.onPlace) m.onPlace();
  grabbed=null; grabHome=null; sfx.pop(); save();
}
function cancelGrab(){
  if(!grabbed) return;
  const m=grabbed; m.g.position.x=grabHome.x; m.g.position.z=grabHome.z; m.g.rotation.y=grabHome.ry;
  applyFootprint(m); if(m.onPlace) m.onPlace();
  grabbed=null; grabHome=null;
}
function rotateGrab(){ if(!grabbed) return; grabRy=(grabRy+Math.PI/2)%(Math.PI*2); updateGrab(); }

/* ---------- Pfefferspray ---------- */
function toggleSpray(){ if(pdaOn){ pdaOn=false; if(pdaG) pdaG.visible=false; }
  if(S.level<4){ toast('Pfefferspray gibt es ab Level 4.'); return; }
  sprayOn=!sprayOn; updateTool();
}
function updateTool(){
  const el=$('tool');
  el.textContent=pdaOn?'Preisgerät in der Hand':sprayOn?'Pfefferspray bereit':(S.level>=4?(COARSE?'Spray: Knopf rechts':'Pfefferspray: G · Preisgerät: T'):(S.level>=2?'Preisgerät: T':''));
  el.classList.toggle('on',sprayOn||pdaOn);
  $('btnTool').classList.toggle('on',sprayOn);
  $('btnPda').classList.toggle('on',pdaOn);
  if(pdaG) pdaG.visible=pdaOn;
}
function doSpray(){
  if(sprayCool>0) return; sprayCool=0.6; sfx.spray();
  for(let i=0;i<26;i++){ const d=randDir(); psSmall.emit(pl.x-Math.sin(yaw)*0.6,1.5,pl.z-Math.cos(yaw)*0.6,-Math.sin(yaw)*6+d[0]*1.6,d[1]*1.2,-Math.cos(yaw)*6+d[2]*1.6,0.9,1,0.5,0.5,1); }
  const c=sprayHit();
  if(c) c.caughtBy('spray'); else toast('Daneben.','bad');
}

/* =========================================================
   Interaktion
   ========================================================= */
const ray=new THREE.Raycaster(), center=new THREE.Vector2(0,0);
let target=null, repeatT=0, touchAct=false, mouseDown=false;
function movableOf(obj){ let o=obj; while(o){ const m=movables.find(m=>m.g===o); if(m) return m; o=o.parent; } return null; }
/* Der Strahl reicht hoechstens sechs Meter weit. Alles, was weiter
   weg steht, muss gar nicht erst geprueft werden - bei ueber fuenfzig
   Regalen und einem Lager voller Stellplaetze ist das der Unterschied
   zwischen tausend Tests pro Bild und ein paar Dutzend. */
function nahDran(p,r){ return Math.abs(p.x-pl.x)<r&&Math.abs(p.z-pl.z)<r; }
function nahBox(a,r){ return pl.x>a.x0-r&&pl.x<a.x1+r&&pl.z>a.z0-r&&pl.z<a.z1+r; }
function updateTarget(){
  ray.setFromCamera(center,camera); ray.far=build?6:3.3;
  target=null;
  if(build){
    if(grabbed){ target={kind:'placing'}; return; }
    const list=movables.filter(m=>nahDran(m.g.position,8)).map(m=>m.g);
    const hits=ray.intersectObjects(list,true);
    if(hits.length){ const m=movableOf(hits[0].object); if(m) target={kind:'movable',ref:m}; }
    return;
  }
  const R=5.5;
  const list=[];
  floorBoxes.forEach(b=>{ if(nahDran(b.mesh.position,R)) list.push(b.mesh); });
  shelves.forEach(sh=>{ if(nahDran(sh.g.position,R)) sh.levels.forEach(l=>list.push(l.hit)); });
  dirts.forEach(d=>{ if(nahDran(d.m.position,R)) list.push(d.hit); });
  racks.forEach(r=>{ if(nahDran(r.g.position,R)) r.slots.forEach(s=>list.push(s.hit)); });
  belt.forEach(b=>list.push(b.hit));
  for(const k in stations) if(nahDran(stations[k].g.position,R)) list.push(stations[k].hit);
  list.push(lapHit,doorSign,posHit,cardHit);
  if(lapHit2&&lapHit2.parent&&lapHit2.parent.visible) list.push(lapHit2);
  if(pultHit) list.push(pultHit);
  if(gravHit) list.push(gravHit);
  if(packHit&&zoneOffen('packstation')) list.push(packHit);
  if(truck&&truck.state==='docked') truck.boxes.forEach(m=>list.push(m));
  list.push(...windowHits);
  for(const o of occluders) if(!o.userData.aabb||nahBox(o.userData.aabb,6.5)) list.push(o);
  const hits=ray.intersectObjects(list,false);
  if(hits.length){ const ud=hits[0].object.userData; if(ud&&ud.kind) target={kind:ud.kind,ref:ud.ref,obj:hits[0].object}; }
}
function promptFor(t){
  if(!t) return null; const c=S.carrying, reg=regCustomer();
  if(pdaOn&&!build){ const pt=pdaTargetType(); if(pt) return {t:`Preisgerät: ${P[pt].short} · ${eur(S.prices[pt])}`,a:true}; }
  switch(t.kind){
    case 'placing': return {t:spotFree(grabbed,grabbed.g.position.x,grabbed.g.position.z,grabRy)?'Absetzen':'Hier ist kein Platz',a:true};
    case 'movable': return {t:`Verschieben: ${t.ref.name}`,a:true};
    case 'box': return c?{t:'Du trägst schon einen Karton',a:false}:{t:`Aufheben: ${P[t.ref.type].name} (${t.ref.count} Stück)`,a:true};
    case 'dirt': return {t:'Sauber machen (halten)',a:true};
    case 'window': { const v=Math.round(windowGrime()*100); return v<3?{t:'Schaufenster ist sauber',a:false}:{t:`Scheiben putzen (halten) · ${v} % blind`,a:true}; }
    case 'level': { const lv=t.ref;
      if(c){ if(lv.type&&lv.type!==c.type) return {t:`Fach mit ${P[lv.type].short}`,a:false};
        const cp=capOf(lv,c.type); if(lv.count>=cp) return {t:'Fach ist voll',a:false};
        return {t:`Einräumen: ${P[c.type].short} ${lv.count}/${cp}`,a:true}; }
      return {t:lv.type?`${P[lv.type].short}: ${lv.count}/${capOf(lv)} für ${eur(S.prices[lv.type])}`:'Leeres Fach',a:false}; }
    case 'rslot': { const sl=t.ref;
      if(c) return sl.box?{t:'Platz ist belegt',a:false}:{t:'Karton einlagern',a:true};
      return sl.box?{t:`Karton nehmen: ${P[sl.box.type].name} (${sl.box.count})`,a:true}:{t:'Freier Lagerplatz',a:false}; }
    case 'belt': return {t:`Scannen: ${P[t.ref.type].short} ${eur(t.ref.price)}`,a:true};
    case 'card': return reg&&reg.state==='pay'&&reg.method==='card'?{t:'Kartenzahlung abschließen',a:true}:{t:'Kartenterminal',a:false};
    case 'pos': if(reg&&reg.state==='pay') return reg.method==='cash'?{t:`Bargeld annehmen: ${eur(reg.given)}`,a:true}:{t:'Kartenzahlung abschließen',a:true}; return {t:'Kasse',a:false};
    case 'tfsperre': return {t:'Zugang zum Testfeld — im Laptop unter Ausbau freischalten',a:false};
    case 'laptop': return {t:'Laptop öffnen',a:true};
    case 'laptop2': return {t:'Lagerterminal öffnen',a:true};
    case 'pack': {
      if(!zoneOffen('packstation')) return {t:'Packstation',a:false};
      if(!S.up.onlineshop) return {t:'Onlineshop muss noch freigeschaltet werden',a:false};
      const o=S.offen|0;
      if(o<=0) return {t:`Packstation: keine offenen Bestellungen · ${S.pakete|0} Pakete auf der Rampe`,a:false};
      if((S.pakete|0)>=PAKET_BAYS) return {t:'Rampe ist voll. DDL holt am Tagesende ab.',a:false};
      return {t:`Paket packen (${o} offen) · +${eur(paketWert())}`,a:true}; }
    case 'station': { const st=t.ref, nm=STATION_POS[st.id].name;
      if(c){ const want=stationOf(c.type);
        if(!want) return {t:`${nm}: damit kann man nichts zünden`,a:false};
        if(want!==st.id) return {t:`${P[c.type].short} gehört auf: ${STATION_POS[want].name}`,a:false};
        if(st.items.length>=st.cap) return {t:`${nm} ist voll`,a:false};
        return {t:`Aufbauen: ${P[c.type].short} (${st.items.length}/${st.cap})`,a:true}; }
      return {t:st.items.length?`${nm}: ${st.items.length} Stück bereit`:`${nm}: leer`,a:false}; }
    case 'pult': { const n=placedCount();
      return n?{t:`Zünden: ${n} Stück`,a:true}:{t:'Zündpult: erst Ware aufbauen',a:false}; }
    case 'gravur': {
      if(c&&c.type==='blanko') return gravBlanks>=GRAV_MAX?{t:'Automat ist voll',a:false}:{t:`Blanko nachfüllen ${gravBlanks}/${GRAV_MAX}`,a:true};
      if(c) return {t:'Gravur-Automat',a:false};
      return gravBlanks>0?{t:'Eigene Rakete beschriften',a:true}:{t:'Automat leer: Blanko nachfüllen',a:false}; }
    case 'tbox': {
      const it=t.ref, n=truckLeft();
      if(c) return {t:`Noch ${n} Karton${n>1?'e':''} im Laderaum`,a:false};
      return {t:`Aufheben: ${P[it.type].name} (${P[it.type].box} Stück)`,a:true}; }
    case 'sign': return phase==='closed'?{t:'Schild umdrehen: Laden öffnen',a:true}:phase==='after'?{t:'Tag beenden',a:true}:{t:phase==='open'?'Geöffnet bis 22 Uhr':'Letzte Kunden im Laden',a:false};
  }
  return null;
}
function doAction(){
  if(paused) return;
  if(sprayOn&&!build){ doSpray(); return; }
  if(!target) return;
  if(pdaOn&&!build){ const t=pdaTargetType(); if(t){ openPDA(t); return; } }
  const k=target.kind, r=target.ref, reg=regCustomer();
  if(k==='placing') placeGrab();
  else if(k==='movable') grab(r);
  else if(k==='box'){ if(S.carrying){ toast('Du trägst schon einen Karton. Erst abstellen.','bad'); return; } pickUp(r); }
  else if(k==='level'){ if(S.carrying) stockOne(r); }
  else if(k==='dirt') cleanTick(r,true);
  else if(k==='window') cleanWindowTick(true);
  else if(k==='rslot'){
    if(S.carrying&&!r.box){ putInSlot(r,S.carrying.type,S.carrying.count); S.carrying=null; S.tut.lager=true; sfx.pop(); updateCarry(); }
    else if(!S.carrying&&r.box){ S.carrying={type:r.box.type,count:r.box.count}; r.rk.g.remove(r.box.mesh); r.box=null; drawRackSchild(r.rk); sfx.pop(); updateCarry(); }
  }
  else if(k==='belt') scanBelt(r);
  else if(k==='card'){ if(reg&&reg.state==='pay'){ if(reg.method==='card') reg.finishCard(); else toast('Der Kunde zahlt bar. Klick die Kasse an.'); } }
  else if(k==='pos'){ if(reg&&reg.state==='pay'){ if(reg.method==='cash') openCash(reg); else reg.finishCard(); } }
  else if(k==='pack'){ if((S.pakete|0)<PAKET_BAYS) packOne(false); }
  else if(k==='laptop') openLaptop();
  else if(k==='laptop2') openLaptop('order');
  else if(k==='station'){ if(S.carrying) placeOnStation(r); }
  else if(k==='pult') firePult();
  else if(k==='gravur'){ if(S.carrying&&S.carrying.type==='blanko') refillGrav(); else if(!S.carrying) openGravInput(); }
  else if(k==='tbox') takeBox(r);
  else if(k==='sign'){ if(phase==='closed') openShop(); else if(phase==='after') endDay(); }
}
function cleanTick(d,first){
  if(dirts.indexOf(d)<0) return;
  d.work+=first?0.12:0.16;
  if(d.work>=1){ removeDirt(d); sfx.pop(); addXP(3); S.tut.clean=true; }
}
function pressAction(){ ac(); doAction(); repeatT=0.3; }
function holdRepeat(dt){
  const holding=mouseDown||keys.KeyE||touchAct; if(!holding||!target) return;
  const k=target.kind;
  const ok=(k==='level'&&canStock(target.ref))||k==='belt'||k==='dirt'||k==='window'||(k==='gravur'&&S.carrying&&S.carrying.type==='blanko'&&gravBlanks<GRAV_MAX)||(k==='station'&&S.carrying&&stationOf(S.carrying.type)===target.ref.id&&target.ref.items.length<target.ref.cap);
  if(!ok) return;
  repeatT-=dt; if(repeatT<=0){
    if(k==='level') stockOne(target.ref,true);
    else if(k==='dirt') cleanTick(target.ref);
    else if(k==='window') cleanWindowTick(false);
    else if(k==='gravur') refillGrav(true);
    else if(k==='station') placeOnStation(target.ref);
    else scanBelt(target.ref);
    repeatT=k==='dirt'?0.16:k==='station'?0.3:0.12; }
}

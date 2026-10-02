
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
  /* Erst fertig, wenn Richtung UND Neigung stimmen. Vorher hoerte es
     auf, sobald die Richtung passte - stand man schon richtig, kippte
     der Blick nie nach oben. */
  aim.t-=dt; if(aim.t<=0||(Math.abs(d)<0.004&&Math.abs(aim.pitch-pitch)<0.004)) aim=null;
}
/* Noerdlich vom Gehweg faengt die Strasse an - da hat der Spieler
   nichts zu suchen, deshalb bleibt diese eine Grenze enger als das
   Navgitter. */
const PLZ_MAX=10.8;
/* gesetzt, solange der Spieler in einem Raum ausserhalb der Karte steht */
let SPIEL_RAUM=null;
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
  /* Verpackungs-Vorfuehrung: eigener Raum ausserhalb der Karte */
  if(SPIEL_RAUM){ p.x=clamp(p.x,SPIEL_RAUM.x0+0.4,SPIEL_RAUM.x1-0.4); p.z=clamp(p.z,SPIEL_RAUM.z0+0.4,SPIEL_RAUM.z1-0.4); return; }
  p.x=clamp(p.x,NAV.x0+0.4,NAV.x1-0.4); p.z=clamp(p.z,NAV.z0+0.4,PLZ_MAX);
}
function look(dx,dy,s){ aim=null; yaw-=dx*s; pitch=clamp(pitch-dy*s,-1.45,1.45); }
function updatePlayer(dt){
  let mx_=0,mz=0;
  if(keys.KeyW||keys.ArrowUp) mz-=1; if(keys.KeyS||keys.ArrowDown) mz+=1;
  if(keys.KeyA||keys.ArrowLeft) mx_-=1; if(keys.KeyD||keys.ArrowRight) mx_+=1;
  mx_+=joy.x; mz+=joy.y;
  const len=Math.hypot(mx_,mz); if(len>1){ mx_/=len; mz/=len; }
  const sp=((keys.ShiftLeft||keys.ShiftRight)?5.2:3.2)*karreTempo(), s=Math.sin(yaw), c=Math.cos(yaw);
  pl.x+=(mx_*c+mz*s)*sp*dt; pl.z+=(-mx_*s+mz*c)*sp*dt; collide(pl,0.32);
  if(len>0.1) bobT+=dt*sp*2.6;
  const sx=shake>0?rand(-shake,shake)*0.15:0; shake=Math.max(0,shake-dt*1.5);
  camera.position.set(pl.x+sx,1.65+Math.sin(bobT)*0.035+sx,pl.z);
  updateAim(dt);
  camera.rotation.set(pitch,yaw,0);
  if(sprayCool>0) sprayCool-=dt;
}

/* ---------- Moebel in der Hand ---------- */
function rectOf(m,x,z,ry){
  if(m.flaeche) return rectWelt(x,z,ry,m.flaeche);
  const s=Math.abs(Math.sin(ry))>0.5, w=(s?m.fd:m.fw)/2, d=(s?m.fw:m.fd)/2; return {minX:x-w,maxX:x+w,minZ:z-d,maxZ:z+d}; }
/* Umgebaut werden darf in jedem Raum, der schon freigeschaltet ist.
   Ein Moebel muss ganz in einen Raum passen - so landet nichts in
   einem Durchgang oder halb in der Wand. Raeume, die durch einen
   Kauf zusammenwachsen, stehen zusaetzlich als ein Ganzes in der
   Liste, damit man auch ueber die alte Trennlinie stellen kann.
   Vorher galt das ganze Ladenlokal von Anfang an - ein Regal liess
   sich durch die Trennwand in die noch gesperrte Haelfte schieben.
   Und der erste Hallenabschnitt zaehlte erst mit dem zweiten. */
const UMBAU_RAUM=[
  {r:{x0:LAY.basis.x0,x1:SHOP_HALB,z0:LAY.basis.z0,z1:LAY.basis.z1}},
  {r:LAY.basis,z:'shop_halb'},
  {r:LAY.ost1, z:'shop_gross'},         {r:LAY.ost2, z:'shop_ost'},
  {r:LAY.sued, z:'shop_sued'},
  {r:LAY.lbasis},
  {r:{x0:LAY.lbasis.x0,x1:LAY.lbasis.x1,z0:LAY.lbasis.z0,z1:LAY.lnord.z1},z:'lager_nord'},
  {r:LAY.ls1,  z:'lager_gross'},
  {r:{x0:LAY.ls1.x0,x1:LAY.ls1.x1,z0:LAY.ls2.z0,z1:LAY.ls1.z1},z:'lager_sued'},
  {r:LAY.lsued,z:'lager_sued2'},
  {r:LAY.lw1,z:'lager_west'},{r:LAY.lw2,z:'lager_west2'},{r:LAY.lwest,z:'lager_west3'}
];
function imRaum(minX,maxX,minZ,maxZ){
  return UMBAU_RAUM.some(b=>(!b.z||zoneOffen(b.z))&&
    minX>=b.r.x0+0.08&&maxX<=b.r.x1-0.08&&minZ>=b.r.z0+0.08&&maxZ<=b.r.z1-0.08);
}
function spotFree(m,x,z,ry){
  if(!m.fw&&!m.flaeche) return imRaum(x,x,z,z);
  const r=rectOf(m,x,z,ry);
  if(!imRaum(r.minX,r.maxX,r.minZ,r.maxZ)) return false;
  for(const c of colliders){ if(c.ref===m) continue;
    if(r.minX<c.maxX&&r.maxX>c.minX&&r.minZ<c.maxZ&&r.maxZ>c.minZ) return false; }
  /* Die Flaeche einer grossen Einheit ist belegt, auch wo man
     darueber laufen kann - kein Regal mitten auf der Paketablage. */
  for(const m2 of movables){ if(m2===m||!m2.flaeche||!m2.g.visible) continue;
    const a=rectOf(m2,m2.g.position.x,m2.g.position.z,m2.g.rotation.y);
    if(r.minX<a.maxX&&r.maxX>a.minX&&r.minZ<a.maxZ&&r.maxZ>a.minZ) return false; }
  return true;
}
/* Den Umbaumodus gibt es nicht mehr (Tom, 29.09.). Moebel nimmt man
   mit F in die Hand, stellt sie mit E ab, dreht sie mit R und packt
   sie mit F wieder ins Paket. Die Funktion bleibt fuer alte Aufrufe. */
function toggleBuild(on){ if(on===false&&grabbed) cancelGrab(); }
function grab(m,neu){
  S.tut.move=true; grabbed=m; grabRy=m.g.rotation.y; grabHome=neu?null:{x:m.g.position.x,z:m.g.position.z,ry:grabRy};
  dropFootprint(m);
  sfx.pop(); moebelKnoepfe();
}
/* Welches Moebel hat der Spieler im Blick (bis 4 m)? */
function moebelImBlick(){
  /* frisch verschobene Moebel: Weltmatrix erst beim naechsten Bild -
     beim Tastendruck lieber gleich nachziehen */
  scene.updateMatrixWorld(); ray.setFromCamera(center,camera); ray.far=4;
  const list=movables.filter(m=>m.g.visible!==false&&nahDran(m.g.position,8)).map(m=>m.g);
  const hits=ray.intersectObjects(list,true); ray.far=3.3;
  for(const h of hits){ const m=movableOf(h.object); if(m) return m; }
  return null;
}
/* Paket, Moebel und Einrichtungsart gehoeren zusammen */
function regalIdVon(m){
  if(m.kind==='shelf'){ const r=REGALWARE.find(x=>x.art==='shelf'&&x.kind===m.ref.kind); return r&&r.id; }
  if(m.kind==='rack'){ const r=REGALWARE.find(x=>x.art==='rack'&&x.kind===m.ref.kind); return r&&r.id; }
  return null;
}
function moebelTaste(){
  if(paused||!S) return;
  if(grabbed){ moebelEinpacken(); return; }
  const c=S.carrying;
  if(c&&(c.regal||c.einbau)){ paketAuspacken(); return; }
  if(c){ toast('Du trägst einen Karton. Erst abstellen.','bad'); return; }
  const m=moebelImBlick();
  if(m){ grab(m); return; }
  toast(COARSE?'Schau ein Möbel an und tippe „Möbel“, um es aufzunehmen.':'Schau ein Möbel an und drück F, um es aufzunehmen.');
}
/* Auspacken: das Paket verschwindet, das Moebel steht vor einem und
   haengt an der Hand, bis man es mit E absetzt */
function paketAuspacken(){
  const c=S.carrying; if(!c) return;
  const d=2.2, x=Math.round((pl.x-Math.sin(yaw)*d)*4)/4, z=Math.round((pl.z-Math.cos(yaw)*d)*4)/4;
  const ry=Math.round(yaw/(Math.PI/2))*(Math.PI/2);
  let m=null;
  if(c.regal){
    const r=regalOf(c.regal); if(!r) return;
    if(r.art==='rack') m=createRack(racks.length,{kind:r.kind,x,z,ry}).mov;
    else m=createShelf(shelves.length,{kind:r.kind,x,z,ry}).mov;
    S.tut.shelf=true;
  } else if(c.einbau==='kasse3'){
    einbauAufstellen('kasse3'); m=typeof sb2Mov!=='undefined'?sb2Mov:null;
  } else if(c.einbau){
    /* die SB-Kassenzeile der Erweiterung hat ihren festen Platz */
    const zl=EINBAU[c.einbau].ziel();
    if(!zl||Math.hypot(zl.x-pl.x,zl.z-pl.z)>EINBAU[c.einbau].weit+1.5){
      toast(`${paketName(c)} haben einen festen Platz: vor der Kassenzeile in der Erweiterung. Dort auspacken.`,'bad'); return; }
    einbauAufstellen(c.einbau); S.carrying=null; updateCarry(); moebelKnoepfe(); return;
  }
  S.carrying=null; updateCarry(); sfx.pop();
  if(m){ m.g.position.x=x; m.g.position.z=z; m.g.rotation.y=ry; grab(m,true); updateGrab(); }
  toast(COARSE?'Ausgepackt. „Aktion“ stellt ab, „Drehen“ dreht, „Einpacken“ packt wieder ein.':'Ausgepackt. E stellt ab, R dreht, F packt wieder ein.');
}
/* Einpacken: nur leere Regale - die Ware muesste sonst irgendwohin */
function moebelEinpacken(){
  const m=grabbed; if(!m) return;
  const id=regalIdVon(m);
  if(m.kind==='shelf'||m.kind==='rack'){
    const voll=m.kind==='shelf'?m.ref.levels.some(l=>l.count>0):m.ref.slots.some(sl=>sl.box);
    if(voll){ toast('Erst ausräumen – mit Ware drin lässt es sich nicht einpacken.','bad'); return; }
    if(!id) return;
    if(m.kind==='shelf') removeShelf(m.ref); else removeRack(m.ref);
    grabbed=null; grabHome=null;
    S.carrying={regal:id}; updateCarry(); sfx.pop(); moebelKnoepfe(); save();
    toast(`${regalName(id)} eingepackt. Paket mit Q abstellen oder woanders mit F auspacken.`);
    return;
  }
  if(m.kind==='sb2'){
    if(sbLanes.some(l=>l.up==='kasse3'&&l.busy)){ toast('An der Kasse zahlt gerade jemand. Gleich noch mal.','bad'); return; }
    grabbed=null; grabHome=null;
    S.up.kasse3=false; setSB2(false); (S.einbauBestellt||(S.einbauBestellt={})).kasse3=true;
    S.carrying={einbau:'kasse3'}; updateCarry(); sfx.pop(); moebelKnoepfe(); save();
    toast('SB-Kassen Eingang 2 eingepackt.'); return;
  }
  toast(`${m.name} lässt sich nur verschieben: mit E abstellen, mit Q zurück.`);
}
function updateGrab(){
  if(!grabbed) return;
  let x,z;
  if(grabbed.flaeche){
    /* Grosse Einheit: die Mitte der Flaeche liegt vor einem, mit
       etwas Abstand zur eigenen Kante - man steht nie mittendrin. */
    const F=grabbed.flaeche, vx=-Math.sin(yaw), vz=-Math.cos(yaw);
    const w=rectWelt(0,0,grabRy,F), hx=(w.maxX-w.minX)/2, hz=(w.maxZ-w.minZ)/2;
    const d=Math.abs(vx)*hx+Math.abs(vz)*hz+1.2;
    const mx=(w.minX+w.maxX)/2, mz=(w.minZ+w.maxZ)/2;
    x=pl.x+vx*d-mx; z=pl.z+vz*d-mz;
  } else {
    const d=grabbed.fw>2?2.6:2.0;
    x=pl.x-Math.sin(yaw)*d; z=pl.z-Math.cos(yaw)*d;
  }
  x=Math.round(x*4)/4; z=Math.round(z*4)/4;
  grabbed.g.position.x=x; grabbed.g.position.z=z; grabbed.g.rotation.y=grabRy;
  if(grabbed.onPlace) grabbed.onPlace();
}
function placeGrab(){
  if(!grabbed) return;
  const m=grabbed;
  if(!spotFree(m,m.g.position.x,m.g.position.z,grabRy)){ toast('Da passt es nicht hin.','bad'); return; }
  applyFootprint(m); if(m.onPlace) m.onPlace();
  grabbed=null; grabHome=null; sfx.pop(); moebelKnoepfe(); save();
}
/* Q: zurueck an den alten Platz - ein frisch ausgepacktes Moebel hat
   keinen, das wandert zurueck ins Paket */
function cancelGrab(){
  if(!grabbed) return;
  const m=grabbed;
  if(!grabHome){ const k=m.kind;
    if(k==='shelf'||k==='rack'||k==='sb2'){ moebelEinpacken(); if(!grabbed) return; }
    return; }
  m.g.position.x=grabHome.x; m.g.position.z=grabHome.z; m.g.rotation.y=grabHome.ry;
  applyFootprint(m); if(m.onPlace) m.onPlace();
  grabbed=null; grabHome=null; moebelKnoepfe();
}
function rotateGrab(){ if(!grabbed) return; grabRy=(grabRy+Math.PI/2)%(Math.PI*2); updateGrab(); }
/* Die Knoepfe am Handy sagen, was die Moebeltaste gerade tut */
let _mkTxt='';
function moebelKnoepfe(){
  if(typeof document==='undefined') return;
  const bm=$('btnMove'), bt=$('btnTool'); if(!bm||!bt) return;
  const c=S&&S.carrying;
  const t=grabbed?(regalIdVon(grabbed)||grabbed.kind==='sb2'?'Einpacken':'Möbel'):(c&&(c.regal||c.einbau))?'Auspacken':'Möbel';
  const k=t+'|'+!!grabbed; if(k===_mkTxt) return; _mkTxt=k;
  bm.textContent=t; bm.classList.toggle('on',!!grabbed);
  bt.textContent=grabbed?'Drehen':'Spray';
  $('mode').textContent=grabbed?'Möbel in der Hand':'';
}

/* ---------- Pfefferspray ---------- */
function toggleSpray(){ if(pdaOn){ pdaOn=false; if(pdaG) pdaG.visible=false; }
  if(S.level<4){ toast('Pfefferspray gibt es ab Level 4.'); return; }
  sprayOn=!sprayOn; updateTool();
}
function updateTool(){
  const el=$('tool');
  /* Unten rechts steht nur noch, was man gerade in der Hand hat.
     Welche Taste was macht, zeigt das Pausenmenue (Esc). */
  el.textContent=pdaOn?'Preisgerät in der Hand':sprayOn?'Pfefferspray bereit':'';
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
/* auch Ebene 1: gebuendelte Originale (03b, BUENDEL) bleiben treffbar */
if(ray.layers) ray.layers.enable(1);
let target=null, repeatT=0, touchAct=false, mouseDown=false;
function movableOf(obj){ let o=obj; while(o){ const m=movables.find(m=>m.g===o); if(m) return m; o=o.parent; } return null; }
/* Der Strahl reicht hoechstens sechs Meter weit. Alles, was weiter
   weg steht, muss gar nicht erst geprueft werden - bei ueber fuenfzig
   Regalen und einem Lager voller Stellplaetze ist das der Unterschied
   zwischen tausend Tests pro Bild und ein paar Dutzend. */
function nahDran(p,r){ return Math.abs(p.x-pl.x)<r&&Math.abs(p.z-pl.z)<r; }
function nahBox(a,r){ return pl.x>a.x0-r&&pl.x<a.x1+r&&pl.z>a.z0-r&&pl.z<a.z1+r; }
function updateTarget(){
  ray.setFromCamera(center,camera); ray.far=3.3;
  target=null;
  if(grabbed){ target={kind:'placing'}; return; }
  const R=5.5;
  const list=[];
  floorBoxes.forEach(b=>{ if(nahDran(b.mesh.position,R)) list.push(b.mesh); });
  einbauPakete.forEach(b=>{ if(nahDran(b.mesh.position,R)) list.push(b.mesh); });
  shelves.forEach(sh=>{ if(nahDran(sh.g.position,R)) sh.levels.forEach(l=>list.push(l.hit)); });
  dirts.forEach(d=>{ if(nahDran(d.m.position,R)) list.push(d.hit); });
  racks.forEach(r=>{ if(nahDran(r.g.position,R)) r.slots.forEach(s=>list.push(s.hit)); });
  belt.forEach(b=>list.push(b.hit));
  sbLanes.forEach((l,i)=>{ if(l.hit&&sbNutzbar(i)&&nahDran(sbPos(i),R)) list.push(l.hit); });
  for(const k in stations) if(nahDran(stations[k].g.position,R)) list.push(stations[k].hit);
  list.push(lapHit,doorSign,posHit,cardHit);
  if(lapHit2&&lapHit2.parent&&lapHit2.parent.visible) list.push(lapHit2);
  if(pultHit) list.push(pultHit);
  if(gravHit) list.push(gravHit);
  if(packHit&&zoneOffen('packstation')) list.push(packHit);
  if(tfHit&&tfHit.visible) list.push(tfHit);
  if(truck&&truck.state==='docked') truck.boxes.forEach(m=>list.push(m));
  list.push(...windowHits);
  for(const o of occluders) if(!o.userData.aabb||nahBox(o.userData.aabb,6.5)) list.push(o);
  const hits=ray.intersectObjects(list,false);
  if(hits.length){ const ud=hits[0].object.userData; if(ud&&ud.kind) target={kind:ud.kind,ref:ud.ref,obj:hits[0].object}; }
}
function promptFor(t){
  if(!t) return null; const c=S.carrying, reg=regCustomer();
  if(pdaOn&&!grabbed){ const pt=pdaTargetType(); if(pt) return {t:`Preisgerät: ${P[pt].short} · ${eur(S.prices[pt])}`,a:true}; }
  switch(t.kind){
    case 'placing': { const frei=spotFree(grabbed,grabbed.g.position.x,grabbed.g.position.z,grabRy), pk=!!(regalIdVon(grabbed)||grabbed.kind==='sb2');
      return {t:(frei?`Absetzen: ${grabbed.name}`:'Hier ist kein Platz')+(COARSE?'':` · R drehen · ${pk?'F einpacken':'Q zurück'}`),a:frei}; }
    case 'movable': return {t:`Verschieben: ${t.ref.name}`,a:true};
    case 'box': if(c&&karreAn()&&!c.regal&&!c.einbau) return karreVoll()?{t:'Die Karre ist voll',a:false}:{t:`Auf die Karre: ${P[t.ref.type].name} (${karreLast()}/${KARREN[karreArt()].cap})`,a:true};
      return c?{t:'Du trägst schon einen Karton',a:false}:{t:`Aufheben: ${P[t.ref.type].name} (${t.ref.count} Stück)`,a:true};
    case 'paket': return c?{t:'Du trägst schon etwas',a:false}:{t:`Paket aufheben: ${paketName(t.ref)}`,a:true};
    case 'dirt': return {t:'Sauber machen (halten)',a:true};
    case 'window': { const v=Math.round(windowGrime()*100); return v<3?{t:'Schaufenster ist sauber',a:false}:{t:`Scheiben putzen (halten) · ${v} % blind`,a:true}; }
    case 'level': { const lv=t.ref;
      if(kannRaus(lv)) return {t:`In die Kiste: ${P[lv.type].short} (${lv.count} im Fach)`,a:true};
      if(!c&&S.kisteHand) return {t:lv.type?`${P[lv.type].short}`:'Leeres Fach',a:false};
      if(c&&c.kiste&&c.raus) return {t:lv.type===c.type?`Kiste ist voll (${c.count})`:`Kiste: ausräumen · ${COARSE?'„Kiste“':'X'} schaltet auf einräumen`,a:false};
      if(c&&(c.regal||c.einbau)) return {t:'Paket: am Boden abstellen oder am Stellplatz auspacken',a:false};
      if(c){ if(lv.type&&lv.type!==c.type) return {t:`Fach mit ${P[lv.type].short}`,a:false};
        const cp=capOf(lv,c.type); if(!cp) return {t:'Produkt passt nicht ins Regal',a:false}; if(lv.count>=cp) return {t:'Fach ist voll',a:false};
        return {t:`Einräumen: ${P[c.type].short} ${lv.count}/${cp}`,a:true}; }
      return {t:lv.type?`${P[lv.type].short}: ${lv.count}/${capOf(lv)} für ${eur(S.prices[lv.type])}`:'Leeres Fach',a:false}; }
    case 'rslot': { const sl=t.ref;
      if(c&&(c.regal||c.einbau)) return {t:'Paket: am Boden abstellen',a:false};
      if(c) return sl.box?(karreAn()&&!c.regal&&!c.einbau&&!karreVoll()?{t:'Auf die Karre laden',a:true}:{t:'Platz ist belegt',a:false}):{t:'Karton einlagern',a:true};
      return sl.box?{t:`Karton nehmen: ${P[sl.box.type].name} (${sl.box.count})`,a:true}:{t:'Freier Lagerplatz',a:false}; }
    case 'belt': return {t:`Scannen: ${P[t.ref.type].short} ${eur(t.ref.price)}`,a:true};
    case 'sbterm': { const l=t.ref, c=l.busy;
      if(c&&c.state==='sbHilfe') return {t:l.helfer?'Kunden helfen (Betreuer ist unterwegs)':'Kunden an der SB-Kasse helfen',a:true};
      return {t:c?'SB-Kasse: Kunde zahlt selbst':'SB-Kasse frei',a:false}; }
    case 'card': return reg&&reg.state==='pay'&&reg.method==='card'?{t:'Kartenzahlung abschließen',a:true}:{t:'Kartenterminal',a:false};
    case 'pos': if(reg&&reg.state==='pay') return reg.method==='cash'?{t:`Bargeld annehmen: ${eur(reg.given)}`,a:true}:{t:'Kartenzahlung abschließen',a:true}; return {t:'Kasse',a:false};
    case 'tfsperre': return {t:'Zugang zum Testfeld — im Laptop unter Ausbau freischalten',a:false};
    case 'laptop': return {t:'Laptop öffnen',a:true};
    case 'laptop2': return {t:'Lagerterminal öffnen',a:true};
    case 'pack': {
      if(!zoneOffen('packstation')) return {t:'Packstation — im Laptop unter Ausbau freischalten',a:false};
      if(!S.up.onlineshop) return {t:'Onlineshop muss noch freigeschaltet werden',a:false};
      vsAbgleich();
      const o=S.offen|0;
      if(o<=0) return {t:`Packstation: keine offenen Bestellungen · ${S.pakete|0} Pakete auf der Ablage`,a:false};
      if(!vsTischFrei()) return {t:'Am Packtisch wird gerade verpackt',a:false};
      const b=vsSpielerBestellung();
      if(!b) return {t:(S.bestellungen||[]).some(x=>x.st==='offen')?`${o} Bestellung${o===1?'':'en'} offen · die Ware fehlt im Lager und im Laden`:'Alle offenen Bestellungen sind beim Versandmitarbeiter',a:false};
      return {t:`Paket packen #${b.id} (${VS_GR[b.gr].name}): ${vsText(b)} · +${eur(b.wert)}`,a:true}; }
    case 'station': { const st=t.ref, nm=STATION_POS[st.id].name;
      if(c){ const want=stationOf(c.type);
        if(!want) return {t:`${nm}: damit kann man nichts zünden`,a:false};
        if(want!==st.id) return {t:`${P[c.type].short} gehört auf: ${STATION_POS[want].name}`,a:false};
        if(st.items.length>=st.cap) return {t:`${nm} ist voll`,a:false};
        return {t:`Aufbauen: ${P[c.type].short} (${st.items.length}/${st.cap})`,a:true}; }
      return {t:st.items.length?`${nm}: ${st.items.length} Stück bereit`:`${nm}: leer`,a:false}; }
    case 'pult': { const n=bereitCount();
      if(zuendOpen) return {t:'Zündpult verlassen',a:true};
      return {t:n?`Zündpult bedienen · ${n} ${n===1?'Kanal':'Kanäle'} scharf`:'Zündpult bedienen',a:true}; }
    case 'gravur': {
      if(c&&c.type==='blanko') return gravBlanks>=GRAV_MAX?{t:'Automat ist voll',a:false}:{t:`Blanko nachfüllen ${gravBlanks}/${GRAV_MAX}`,a:true};
      if(c) return {t:'Gravur-Automat',a:false};
      return gravBlanks>0?{t:'Eigene Rakete beschriften',a:true}:{t:'Automat leer: Blanko nachfüllen',a:false}; }
    case 'tbox': {
      const it=t.ref, n=truckLeft();
      const pk=it.regal||it.einbau;
      if(c&&karreAn()&&!c.regal&&!c.einbau&&!pk) return karreVoll()?{t:'Die Karre ist voll',a:false}:{t:`Auf die Karre: ${P[it.type].name} (${karreLast()}/${KARREN[karreArt()].cap})`,a:true};
      if(c) return {t:`Noch ${n} Karton${n>1?'e':''} im Laderaum`,a:false};
      return pk?{t:`Paket aufheben: ${paketName(it)}`,a:true}:{t:`Aufheben: ${P[it.type].name} (${P[it.type].box} Stück)`,a:true}; }
    case 'sign': return phase==='closed'&&ruhetag()?{t:'Ruhetag: Tag beenden',a:true}:phase==='closed'?{t:'Schild umdrehen: Laden öffnen',a:true}:phase==='after'?{t:'Tag beenden',a:true}:{t:phase==='open'?'Geöffnet bis 22 Uhr':'Letzte Kunden im Laden',a:false};
  }
  return null;
}
function doAction(){
  if(paused) return;
  if(sprayOn&&!grabbed){ doSpray(); return; }
  if(!target) return;
  if(pdaOn&&!grabbed){ const t=pdaTargetType(); if(t){ openPDA(t); return; } }
  const k=target.kind, r=target.ref, reg=regCustomer();
  if(k==='placing') placeGrab();
  else if(k==='movable') grab(r);
  else if(k==='paket') paketAufheben(r);
  else if(S.kisteHand&&!S.carrying&&(k==='box'||k==='rslot'||k==='paket'||k==='tbox')){ toast(`Erst die leere Kiste wegstellen (${COARSE?'Knopf „Kiste“':'X'}).`,'bad'); }
  else if(S.carrying&&(S.carrying.regal||S.carrying.einbau)&&(k==='level'||k==='rslot'||k==='box')){ toast('Ein Paket stellt man auf den Boden: mit „Ablegen“ abstellen oder am Stellplatz auspacken.','bad'); }
  else if(k==='box'){ if(S.carrying&&!karreNimmt()){ toast(karreVoll()?'Die Karre ist voll. Erst etwas abladen.':'Du trägst schon einen Karton. Erst abstellen.','bad'); return; } pickUp(r); }
  /* Kiste: aus dem Fach nehmen, sonst wie gewohnt einraeumen */
  else if(k==='level'){ if(kannRaus(r)) kisteRaus(r); else if(S.carrying&&S.carrying.kiste&&S.carrying.raus) kisteRaus(r); else if(S.carrying) stockOne(r); else if(S.kisteHand) toast('Das Fach ist leer.'); }
  else if(k==='dirt') cleanTick(r,true);
  else if(k==='window') cleanWindowTick(true);
  else if(k==='rslot'){
    /* Qualitaet (Restposten 86 %) geht mit ins Regal und wieder heraus -
       vorher kam jeder Karton als 100 %-Ware zurueck */
    if(S.carrying&&!r.box){ putInSlot(r,S.carrying.type,S.carrying.count,S.carrying.q,S.carrying.kiste); S.carrying=null; S.tut.lager=true; sfx.pop(); updateCarry(); }
    else if(r.box&&(!S.carrying||karreNimmt())){ S.carrying={type:r.box.type,count:r.box.count,q:r.box.q||1}; if(r.box.kiste){ S.carrying.kiste=true; S.carrying.raus=false; } r.rk.g.remove(r.box.mesh); r.box=null; drawRackSchild(r.rk); sfx.pop(); updateCarry(); }
  }
  else if(k==='belt') scanBelt(r);
  else if(k==='sbterm'){ if(r.busy&&r.busy.state==='sbHilfe') sbGeholfen(r,'spieler'); }
  else if(k==='card'){ if(reg&&reg.state==='pay'){ if(reg.method==='card') reg.finishCard(); else toast('Der Kunde zahlt bar. Klick die Kasse an.'); } }
  else if(k==='pos'){ if(reg&&reg.state==='pay'){ if(reg.method==='cash') openCash(reg); else reg.finishCard(); } }
  else if(k==='pack') vsSpielerPacken();
  else if(k==='laptop') openLaptop();
  else if(k==='laptop2') openLaptop('order');
  else if(k==='station'){ if(S.carrying) placeOnStation(r); }
  else if(k==='pult'){ if(zuendOpen) closeZuend(); else openZuend(); }
  else if(k==='gravur'){ if(S.carrying&&S.carrying.type==='blanko') refillGrav(); else if(!S.carrying) openGravInput(); }
  else if(k==='tbox') takeBox(r);
  else if(k==='sign'){ if(phase==='closed'&&ruhetag()) ruhetagBeenden(); else if(phase==='closed') openShop(); else if(phase==='after') endDay(); }
}
function cleanTick(d,first){
  if(dirts.indexOf(d)<0) return;
  d.work+=first?0.12:0.16;
  wischeSpieler(d); dreckAnteil(d,1-d.work);
  if(d.work>=1){ removeDirt(d); sfx.pop(); addXP(3); S.tut.clean=true; }
}
function pressAction(){ ac(); doAction(); repeatT=0.3; }
function holdRepeat(dt){
  const holding=mouseDown||keys.KeyE||touchAct; if(!holding||!target) return;
  const k=target.kind;
  const ok=(k==='level'&&(kannRaus(target.ref)||canStock(target.ref)))||k==='belt'||k==='dirt'||k==='window'||(k==='gravur'&&S.carrying&&S.carrying.type==='blanko'&&gravBlanks<GRAV_MAX)||(k==='station'&&S.carrying&&stationOf(S.carrying.type)===target.ref.id&&target.ref.items.length<target.ref.cap);
  if(!ok) return;
  repeatT-=dt; if(repeatT<=0){
    if(k==='level'){ if(kannRaus(target.ref)) kisteRaus(target.ref,true); else stockOne(target.ref,true); }
    else if(k==='dirt') cleanTick(target.ref);
    else if(k==='window') cleanWindowTick(false);
    else if(k==='gravur') refillGrav(true);
    else if(k==='station') placeOnStation(target.ref);
    else scanBelt(target.ref);
    repeatT=k==='dirt'?0.16:k==='station'?0.3:0.12; }
}

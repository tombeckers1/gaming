
/* =========================================================
   Kartons am Boden & Tragen
   ========================================================= */
const floorBoxes=[], pending=[];
const DSLOTS=[]; for(let r=0;r<2;r++) for(let c=0;c<4;c++) DSLOTS.push({x:-19.3+c*0.95,z:-3.5+r*0.9});
/* Ohne Lager kommen die Kartons auf die Warenannahme vor der Tuer */
function freeSlot(){ const L=(typeof zoneOffen==='function'&&!zoneOffen('lager')&&typeof WA_SLOTS!=='undefined')?WA_SLOTS:DSLOTS; let best=L[0],bn=99; for(const s of L){ const n=floorBoxes.concat(einbauPakete).filter(b=>Math.abs(b.mesh.position.x-s.x)<0.25&&Math.abs(b.mesh.position.z-s.z)<0.25).length; if(n<bn){ bn=n; best=s; } } return {x:best.x,y:0.2+bn*0.41,z:best.z,ry:rand(-0.08,0.08)}; }
function spawnFloorBox(type,count,pos,q){
  pos=pos||freeSlot();
  const m=new THREE.Mesh(kartonGeo,kartonMat[type]); m.position.set(pos.x,pos.y,pos.z); m.rotation.y=pos.ry||0; if(HIQ){ m.castShadow=true; m.receiveShadow=true; } scene.add(m);
  const b={type,count,q:q||1,mesh:m}; m.userData={kind:'box',ref:b}; floorBoxes.push(b); return b;
}
function removeFloorBox(b){ const i=floorBoxes.indexOf(b); if(i<0) return false; floorBoxes.splice(i,1); scene.remove(b.mesh);
  const p=b.mesh.position;
  floorBoxes.forEach(o=>{ const q=o.mesh.position; if(Math.abs(q.x-p.x)<0.3&&Math.abs(q.z-p.z)<0.3&&q.y>p.y) q.y-=0.41; });
  return true; }
const carryMesh=new THREE.Mesh(kartonGeo,std(0xc89b5c));
carryMesh.position.set(0.34,-0.4,-0.82); carryMesh.rotation.set(0.12,-0.28,0); carryMesh.scale.setScalar(0.78); carryMesh.visible=false; camera.add(carryMesh);
let carryGrav=null;
let carryRegal=null;
function updateCarry(){
  const c=S&&S.carrying, uniq=!!(c&&c.type==='gravur'), reg=!!(c&&(c.regal||c.einbau));
  carryMesh.visible=!!c&&!uniq&&!reg&&!karreAn(); if(c&&!uniq&&!reg) carryMesh.material=kartonMat[c.type];
  if(carryGrav){ camera.remove(carryGrav); disposeEngraved(carryGrav); carryGrav=null; }
  if(uniq){ carryGrav=makeEngraved(c.text||''); carryGrav.position.set(0.3,-0.3,-0.65); carryGrav.rotation.set(0.1,-0.5,0.35); camera.add(carryGrav); }
  /* Das Regalpaket ist laenger als ein Karton und wird quer getragen */
  /* Das Paket traegt man vor sich wie einen Umzugskarton - in seiner
     echten Groesse, nicht quer durchs ganze Bild */
  if(carryRegal&&(!reg||carryRegal.userData.von!==paketName(c))){ camera.remove(carryRegal); carryRegal=null; }
  if(reg&&!carryRegal){
    const M=paketMass(c);
    carryRegal=new THREE.Mesh(new THREE.BoxGeometry(M[0],M[1],M[2]),regalPaketMat());
    carryRegal.userData.von=paketName(c);
    carryRegal.position.set(0.28,-0.3-M[1]*0.3,-0.75-M[2]*0.35); carryRegal.rotation.set(0.1,-0.3,0.04);
    carryRegal.scale.setScalar(0.62); camera.add(carryRegal);
  }
  const q=c?qualityLabel(c.q||1):null;
  $('carry').innerHTML=c?(
      reg?`Paket: ${paketName(c)} · ${COARSE?'Ablegen':'<kbd>Q</kbd>'} am Stellplatz auspacken, sonst abstellen`
    : uniq?`Gravur-Rakete: „${c.text}"`
    : `${P[c.type].name}: noch ${c.count} im Karton${q&&q[0]?` <span class="${q[0]}">(${q[1]})</span>`:''}`)
    +(COARSE?'':`<span style="color:var(--muted)">, <kbd>Q</kbd>${reg?'aufbauen':'abstellen'}</span>`)
    +(karreAn()?` <span style="color:var(--muted)">· ${KARREN[karreArt()].name} ${karreLast()}/${KARREN[karreArt()].cap}</span>`:'')
    :(karreAn()?`${KARREN[karreArt()].name}: leer`+(COARSE?'':` <span style="color:var(--muted)">, <kbd>K</kbd> wegstellen</span>`):'');
  updateKarre();
}
function pickUp(b){ if(!removeFloorBox(b)) return; S.carrying={type:b.type,count:b.count,q:b.q||1}; S.tut.pick=true; sfx.pop(); updateCarry(); }
function dropBox(){
  const c=S&&S.carrying; if(!c||paused) return;
  const p={x:pl.x-Math.sin(yaw)*0.9,z:pl.z-Math.cos(yaw)*0.9}; collide(p,0.36);
  /* Ein Regalpaket wird nicht abgestellt, sondern aufgebaut - auf
     dem Stellplatz, der von hier aus am naechsten frei ist. */
  if(c.regal||c.einbau){ paketAblegen(c,p); return; }
  if(c.type==='gravur'){ S.carrying=null; updateCarry(); toast('Die Gravur-Rakete gehört auf die Abschussrampe.'); return; }
  spawnFloorBox(c.type,c.count,{x:p.x,y:0.2,z:p.z,ry:yaw},c.q);
  S.carrying=null; updateCarry(); sfx.pop();
}
function canStock(lv){ const c=S.carrying; return !!c&&canShelf(c.type)&&(!lv.type||lv.type===c.type)&&lv.count<capOf(lv,c.type)&&!pools[c.type].full(); }
function stockOne(lv,quiet){
  const c=S.carrying; if(!c) return;
  if(!canShelf(c.type)){ if(!quiet) toast(`${P[c.type].short} gehört nicht ins Regal.`,'bad'); return; }
  if(lv.type&&lv.type!==c.type){ if(!quiet) toast(`In dem Fach liegen ${P[lv.type].short}.`,'bad'); return; }
  if(lv.count>=capOf(lv,c.type)){ if(!quiet) toast('Das Fach ist voll.'); return; }
  if(!addToLevel(lv,c.type,c.q||1)){ if(!quiet) toast('Kein Platz mehr.'); return; }
  c.count--; S.tut.stock=true; sfx.pop();
  if(c.count<=0){ S.carrying=null; toast('Karton leer und entsorgt.'); }
  updateCarry();
}
function stockOf(t){ let n=0; allLevels().forEach(l=>{ if(l.type===t) n+=l.count; }); floorBoxes.forEach(b=>{ if(b.type===t) n+=b.count; }); racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type===t) n+=s.box.count; })); if(S.carrying&&S.carrying.type===t) n+=S.carrying.count; if(S.karre&&S.karre.stapel) S.karre.stapel.forEach(c=>{ if(c.type===t) n+=c.count; }); pending.forEach(p=>{ if(p.type===t) n+=P[t].box; }); return n; }
function shelfStockOf(t){ let n=0; allLevels().forEach(l=>{ if(l.type===t) n+=l.count; }); return n; }

/* =========================================================
   Regal aufbauen. Das Paket, das man traegt, wird zum Regal auf
   dem naechstgelegenen freien Stellplatz. Ist keiner frei, bleibt
   das Paket auf dem Arm - sonst waere es weg und das Regal auch.
   ========================================================= */
function regalAufbauen(id,x,z){
  const r=regalOf(id); if(!r) return false;
  const K=regalKind(r);
  let liste;
  if(r.art==='rack') liste=rackPlatzFrei(K);
  else { liste=slotsOffen().filter(sl=>slotPasst(K,sl)); }
  if(!liste.length){
    toast(`Für das ${K.name} ist gerade kein Platz frei.`,'bad'); return false;
  }
  /* der naechste Platz, von dort aus wo das Paket abgesetzt wird */
  const ax=x===undefined?pl.x:x, az=z===undefined?pl.z:z;
  let best=liste[0], bd=1e9;
  for(const sl of liste){ const d=(sl.x-ax)**2+(sl.z-az)**2; if(d<bd){ bd=d; best=sl; } }
  if(r.art==='rack') createRack(racks.length,{kind:r.kind,x:best.x,z:best.z,ry:best.ry||0});
  else createShelf(shelves.length,{kind:r.kind,x:best.x,z:best.z,ry:best.ry||0,art:best.art});
  sfx.cash(); S.tut.shelf=true;
  addXP(12,'Regal aufgebaut');
  toast(`${K.name} steht.`,'money'); save();
  return true;
}
/* =========================================================
   Einbau-Pakete (Tom, 26.09.): Regale, Kuehlschraenke und Kassen
   werden geliefert - ohne Lager vor die Ladentuer, mit Lager an die
   Rampe. Man traegt das Paket dorthin, wo es stehen soll, und packt
   es mit "Ablegen" aus. Ist dort kein passender Platz, bleibt es als
   Paket stehen: Pakete lassen sich lagern und spaeter aufbauen.
   Die Pakete sind so gross wie der Inhalt - Umzugskarton bis
   Kuehlschrankkarton, keine Riesenkisten.
   ========================================================= */
const einbauPakete=[];
const PAKET_MASS={klein:[0.95,0.2,0.45],standard:[1.2,0.22,0.55],hoch:[1.2,0.26,0.55],kuehl:[0.75,1.2,0.7],
  gondel:[1.2,0.26,0.6],eck:[1.1,0.24,0.6],gross:[1.25,0.3,0.65],rack:[1.2,0.24,0.5],rhoch:[1.25,0.3,0.55],rschwer:[1.25,0.34,0.6],
  kasse2:[0.8,0.95,0.6],kasse3:[0.8,0.95,0.6]};
const EINBAU={
  kasse2:{name:'SB-Kassen',ziel:()=>typeof sbZiel==='function'?sbZiel():null,weit:5},
  kasse3:{name:'SB-Kassen Eingang 2',ziel:()=>EING2.x!==null?{x:EING2.x,z:3.5}:null,weit:5}
};
function paketName(p){ return p.einbau?EINBAU[p.einbau].name:regalName(p.regal); }
function paketMass(p){ return PAKET_MASS[p.einbau||p.regal]||[1.2,0.25,0.55]; }
function spawnPaket(p,pos){
  const M=paketMass(p), m=new THREE.Mesh(new THREE.BoxGeometry(M[0],M[1],M[2]),regalPaketMat());
  m.position.set(pos.x,M[1]/2+0.005,pos.z); m.rotation.y=pos.ry||0;
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; } scene.add(m);
  const b={regal:p.regal||null,einbau:p.einbau||null,mesh:m}; m.userData={kind:'paket',ref:b};
  einbauPakete.push(b); return b;
}
function removePaket(b){ const i=einbauPakete.indexOf(b); if(i<0) return false; einbauPakete.splice(i,1); scene.remove(b.mesh); return true; }
function paketAufheben(b){
  if(S.carrying){ toast('Du trägst schon etwas. Erst abstellen.','bad'); return; }
  if(!removePaket(b)) return;
  S.carrying=b.einbau?{einbau:b.einbau}:{regal:b.regal}; sfx.pop(); updateCarry();
}
/* Ablegen: nah genug am passenden Platz wird ausgepackt und aufgebaut,
   sonst steht das Paket einfach da */
function paketAblegen(c,p){
  if(c.regal){
    const r=regalOf(c.regal), K=r&&regalKind(r);
    const liste=r?(r.art==='rack'?rackPlatzFrei(K):slotsOffen().filter(sl=>slotPasst(K,sl))):[];
    let bd=1e9; for(const sl of liste) bd=Math.min(bd,Math.hypot(sl.x-p.x,sl.z-p.z));
    if(bd<=3.2&&regalAufbauen(c.regal,p.x,p.z)){ S.carrying=null; updateCarry(); return; }
  } else if(c.einbau){
    const z=EINBAU[c.einbau].ziel();
    if(z&&Math.hypot(z.x-p.x,z.z-p.z)<=EINBAU[c.einbau].weit){ einbauAufstellen(c.einbau); S.carrying=null; updateCarry(); return; }
  }
  spawnPaket(c,{x:p.x,z:p.z,ry:yaw});
  S.carrying=null; updateCarry(); sfx.pop();
  toast(c.einbau?`${paketName(c)}: Paket abgestellt. Zum Aufbauen an den Kassenplatz tragen.`
                :`${paketName(c)}: Paket abgestellt. Zum Aufbauen an einen freien Stellplatz tragen.`);
}
/* Kassen aufstellen: jetzt erst wird der Kauf wirksam */
function einbauAufstellen(id){
  S.up[id]=true; if(S.einbauBestellt) delete S.einbauBestellt[id];
  if(id==='kasse2'){ setSB(true); toast('Die SB-Kassen stehen. Kunden mit wenig Ware bedienen sich jetzt selbst.','money'); }
  if(id==='kasse3'){ setSB2(true); toast('Die SB-Kassen am zweiten Eingang stehen.','money'); }
  sfx.cash(); addXP(20,'Einbau'); save();
}
/* Ein Regal ohne Lieferung aufstellen. Diesen Weg nimmt das Spiel
   selbst nie - er steht fuer die Tests, damit sie einen
   eingerichteten Laden herstellen koennen, ohne jedes Mal den
   ganzen Bestell- und Lieferweg durchzuspielen. */
function regalStellen(id){ return regalAufbauen(id); }
/* Fuer Tests: nimmt Ausbau-Ids wie bisher und zusaetzlich Regale
   in der Form REGAL:<id>. Alles andere reicht es unveraendert an
   buyUp weiter, damit Tests, die Fehlermeldungen pruefen, gleich
   bleiben. */
function testKauf(id){
  if(typeof id==='string'&&id.indexOf('REGAL:')===0) return regalStellen(id.slice(6));
  /* Kassen: wie Regale ohne Lieferweg gleich aufstellen */
  if(EINBAU[id]){ const vor=pending.length; buyUp(id);
    if(pending.length>vor&&pending[pending.length-1].einbau===id){ pending.pop(); einbauAufstellen(id); } return; }
  return buyUp(id);
}

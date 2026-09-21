
/* =========================================================
   Kartons am Boden & Tragen
   ========================================================= */
const floorBoxes=[], pending=[];
const DSLOTS=[]; for(let r=0;r<2;r++) for(let c=0;c<4;c++) DSLOTS.push({x:-19.3+c*0.95,z:-3.5+r*0.9});
function freeSlot(){ let best=DSLOTS[0],bn=99; for(const s of DSLOTS){ const n=floorBoxes.filter(b=>Math.abs(b.mesh.position.x-s.x)<0.25&&Math.abs(b.mesh.position.z-s.z)<0.25).length; if(n<bn){ bn=n; best=s; } } return {x:best.x,y:0.2+bn*0.41,z:best.z,ry:rand(-0.08,0.08)}; }
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
function updateCarry(){
  const c=S&&S.carrying, uniq=!!(c&&c.type==='gravur');
  carryMesh.visible=!!c&&!uniq; if(c&&!uniq) carryMesh.material=kartonMat[c.type];
  if(carryGrav){ camera.remove(carryGrav); disposeEngraved(carryGrav); carryGrav=null; }
  if(uniq){ carryGrav=makeEngraved(c.text||''); carryGrav.position.set(0.3,-0.3,-0.65); carryGrav.rotation.set(0.1,-0.5,0.35); camera.add(carryGrav); }
  const q=c?qualityLabel(c.q||1):null;
  $('carry').innerHTML=c?(uniq?`Gravur-Rakete: „${c.text}"`:`${P[c.type].name}: noch ${c.count} im Karton${q&&q[0]?` <span class="${q[0]}">(${q[1]})</span>`:''}`)+(COARSE?'':'<span style="color:var(--muted)">, <kbd>Q</kbd>abstellen</span>'):'';
}
function pickUp(b){ if(!removeFloorBox(b)) return; S.carrying={type:b.type,count:b.count,q:b.q||1}; S.tut.pick=true; sfx.pop(); updateCarry(); }
function dropBox(){
  const c=S&&S.carrying; if(!c||paused) return;
  const p={x:pl.x-Math.sin(yaw)*0.9,z:pl.z-Math.cos(yaw)*0.9}; collide(p,0.36);
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
function stockOf(t){ let n=0; allLevels().forEach(l=>{ if(l.type===t) n+=l.count; }); floorBoxes.forEach(b=>{ if(b.type===t) n+=b.count; }); racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type===t) n+=s.box.count; })); if(S.carrying&&S.carrying.type===t) n+=S.carrying.count; pending.forEach(p=>{ if(p.type===t) n+=P[t].box; }); return n; }
function shelfStockOf(t){ let n=0; allLevels().forEach(l=>{ if(l.type===t) n+=l.count; }); return n; }

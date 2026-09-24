/* =========================================================
   Einraeumer (Tom, 24.09.): Karton sichtbar vor dem Bauch, am
   Verkaufsregal klappt er auf, und jedes Stueck wandert einzeln
   aus dem Karton ins Fach - wie im Supermarket Simulator. Leer
   wird der Karton zusammengefaltet.
   ========================================================= */
let _kInnen=null, _kUnsichtbar=null;
function einrKiste(){
  _kInnen=_kInnen||std(0x8a6a40,{roughness:0.95,side:THREE.BackSide});
  _kUnsichtbar=_kUnsichtbar||new THREE.MeshBasicMaterial({visible:false});
  const g=new THREE.Group(), u={};
  u.pappe=std(0xc49a60,{roughness:0.92});
  /* Koerper ohne Deckel, innen dunkle Pappe */
  u.koerper=new THREE.Mesh(kartonGeo,[u.pappe,u.pappe,_kUnsichtbar,u.pappe,u.pappe,u.pappe]);
  g.add(u.koerper);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.58,0.38,0.43),_kInnen));
  /* vier Klappen, jede an ihrer Kante drehbar */
  const klappe=(px,pz,w,d,cx,cz,y)=>{ const pv=new THREE.Group(); pv.position.set(px,0.2+y,pz); g.add(pv);
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,0.006,d),u.pappe); m.position.set(cx,0,cz); pv.add(m); return pv; };
  u.klappen=[
    {pv:klappe(0, 0.225,0.6,0.225,0,-0.1125,0.009),ax:'x',s: 1},
    {pv:klappe(0,-0.225,0.6,0.225,0, 0.1125,0.009),ax:'x',s:-1},
    {pv:klappe( 0.3,0,0.2,0.43,-0.1,0,0.003),ax:'z',s:-1},
    {pv:klappe(-0.3,0,0.2,0.43, 0.1,0,0.003),ax:'z',s: 1}];
  g.userData=u; g.scale.setScalar(0.72); g.visible=false;
  return g;
}
function einrKisteTyp(k,t){ const u=k.userData; if(u.typ===t) return; u.typ=t; const m=kartonMat[t];
  u.koerper.material=[m,m,_kUnsichtbar,m,m,m]; }
function einrKlappen(k,f){ /* f 0 = zu, 1 = ganz offen */
  const a=f*2.25;
  for(const kl of k.userData.klappen){ if(kl.ax==='x') kl.pv.rotation.x=kl.s*a; else kl.pv.rotation.z=kl.s*a; }
}
/* Ein Stueck aus dem Karton: dieselben Teile wie im Regal */
function einrStueck(t){
  const g=new THREE.Group(); g.matrixAutoUpdate=false;
  for(const me of pools[t].meshes){ const m=new THREE.Mesh(me.geometry,me.material); m.frustumCulled=false; g.add(m); }
  scene.add(g); return g;
}
const _ep=new THREE.Vector3(), _eq=new THREE.Quaternion(), _es=new THREE.Vector3(), _ez=new THREE.Vector3();
function einrZiel(lv,t){ const m=itemMatrix(lv.sh,{li:lv.li,type:t},lv.count,0); const p=new THREE.Vector3(), q=new THREE.Quaternion(), s=new THREE.Vector3(); m.decompose(p,q,s); return {p,q,s}; }
/* Auftrag suchen - in der Reihenfolge, die der Spieler eingestellt hat */
function einrJob(w){
  const andere=[staff.auffueller,staff.auffueller2].filter(o=>o&&o!==w);
  const belegt=x=>andere.some(o=>o.src&&(o.src.box===x||o.src.slot===x));
  const res=t=>typeof reservedType==='function'&&reservedType(t);
  const lkwDa=typeof truck!=='undefined'&&truck&&truck.state==='docked'&&truck.cargo.some(c=>!c.regal);
  for(const a of einrAktiv(w.id)){
    if(a==='regal'){
      for(const b of floorBoxes){ if(!belegt(b)&&!res(b.type)&&emptyLevel(b.type)) return {box:b,kind:'floor'}; }
      for(const r of racks) for(const s of r.slots){ if(s.box&&!belegt(s)&&!res(s.box.type)&&emptyLevel(s.box.type)) return {slot:s,kind:'rack'}; }
    } else if(a==='direkt'&&lkwDa){
      const c=truck.cargo.find(c=>!c.regal&&emptyLevel(c.type));
      if(c) return {kind:'truck',direkt:true,typ:c.type};
    } else if(a==='lager'&&lkwDa) return {kind:'truck'};
  }
  return null;
}
function pullFromTruckTyp(t){
  if(!truck||truck.state!=='docked') return null;
  const i=truck.cargo.findIndex(c=>!c.regal&&c.type===t); if(i<0) return pullFromTruck();
  const c=truck.cargo.splice(i,1)[0]; fillCargo();
  return {type:c.type,count:P[c.type].box,q:c.q||1};
}
/* Haltung und Karton jedes Bild nach animPerson */
function einrPose(w,dt){
  if(!w.kiste){ w.kiste=einrKiste(); w.kiste.position.set(0,1.0,0.42); w.g.add(w.kiste); }
  const k=w.kiste, u=w.g.userData, c=w.carry;
  const zeigen=!!c&&w.state!=='store';
  k.visible=zeigen||w.state==='falten';
  if(zeigen) einrKisteTyp(k,c.type);
  if(!k.visible) return;
  einrKlappen(k,w.state==='fill'||w.state==='falten'?(w.offen||0):0);
  k.scale.set(0.72,0.72*(w.state==='falten'?Math.max(0.04,w.falt):1),0.72);
  /* beide Arme nach vorn an den Karton, der rechte greift beim Einraeumen ins Fach */
  const greif=w.flug?Math.sin(Math.PI*Math.min(1,w.flug.t)):0;
  /* Greifarm zeigt auf das Fach - oben, Mitte oder ganz unten */
  let reich=-1.57;
  if(w.flug){ w.g.updateMatrixWorld(); _ez.copy(w.flug.ziel.p); w.g.worldToLocal(_ez);
    reich=-Math.atan2(Math.max(0.15,_ez.z),1.45-_ez.y); }
  u.arms[0].rotation.x=-1.02; u.arms[0].rotation.z=0.07;
  u.arms[1].rotation.x=-1.02+(reich+1.02)*greif; u.arms[1].rotation.z=-0.07+0.12*greif;
}
function einrFill(w,dt){
  const c=w.carry;
  if(!c){ w.state='idle'; return; }
  const lv=w.lv;
  /* zum Fach drehen */
  if(lv){ const z=einrZiel(lv,c.type).p; const ty=Math.atan2(z.x-w.pos.x,z.z-w.pos.z);
    let df=ty-w.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2; w.g.rotation.y+=df*Math.min(1,dt*8); }
  /* erst den Karton aufklappen */
  if((w.offen||0)<1){ w.offen=Math.min(1,(w.offen||0)+dt*3.2*(w.wf||1)); return; }
  if(!w.flug){
    if(!lv||(lv.type&&lv.type!==c.type)||lv.count>=capOf(lv,c.type)||pools[c.type].full()){ w.pickShelf(); return; }
    const k=w.kiste; k.updateMatrixWorld(); const von=k.localToWorld(new THREE.Vector3(0,0.2,0));
    w.flug={t:0,von,ziel:einrZiel(lv,c.type),m:einrStueck(c.type)};
  }
  const f=w.flug; f.t+=dt*(w.wf||1)/0.3;
  const t=Math.min(1,f.t), e=t*t*(3-2*t);
  _ep.copy(f.von).lerp(f.ziel.p,e); _ep.y+=Math.sin(Math.PI*t)*0.22;
  f.m.matrix.compose(_ep,f.ziel.q,f.ziel.s); f.m.matrixWorldNeedsUpdate=true;
  if(f.t>=1){
    scene.remove(f.m); w.flug=null;
    if(addToLevel(lv,c.type,c.q||1)){ c.count--; if(Math.random()<0.5) sfx.pop(); }
    if(c.count<=0){ w.carry=null; w.state='falten'; w.falt=1; }
  }
}
function einrFalten(w,dt){
  w.falt-=dt*3.5;
  if(w.falt<=0){ w.falt=0; w.offen=0; w.state='idle'; }
}
function einrAufraeumen(w){ if(w.flug){ scene.remove(w.flug.m); w.flug=null; } }

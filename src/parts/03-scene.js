
/* =========================================================
   Renderer & Szene
   ========================================================= */
const canvas=$('c');
/* Kantenglaettung des Bildschirms laesst sich nur beim Start festlegen:
   in 'niedrig' ohne (Wechsel wirkt nach dem Neuladen) */
const renderer=new THREE.WebGLRenderer({canvas,antialias:GFX!=='niedrig',powerPreference:'high-performance'});
/* Aufloesung je Grafikstufe: hoch bis 1,9-fach (Retina), mittel 1-fach,
   niedrig 0,75-fach - das Bild wird hochgezogen, kostet aber nur gut die
   Haelfte der Pixel */
function gfxPixel(){ const d=window.devicePixelRatio||1; return GFX==='hoch'?Math.min(d,COARSE?1.5:1.9):GFX==='mittel'?Math.min(d,1):0.75; }
renderer.setPixelRatio(gfxPixel());
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=HIQ&&GFX!=='niedrig';
renderer.shadowMap.type=GFX==='hoch'?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0b1030);
/* Die Sichtweite reicht jetzt bis in die Stadt. Der Nebel bleibt, aber
   als Dunst ueber die Distanz statt als Wand bei hundert Metern. */
scene.fog=new THREE.Fog(0xcfe3f3,55,520);
/* Die nahe Ebene lag auf 5 cm. Bei 300 m Sichtweite bleibt dem
   Tiefenpuffer damit so wenig Genauigkeit, dass Flaechen, die nur
   wenige Millimeter uebereinanderliegen - Estrich ueber Fuellplatte
   ueber Gelaende -, in zehn bis zwanzig Meter Entfernung
   gegeneinander flimmern und als heller Streifen im Boden stehen.
   Naeher als 20 cm kommt die Kamera ohnehin an nichts heran: der
   Spieler hat 32 cm Kollisionsradius, und was er traegt, haengt
   35 cm oder weiter vor der Linse. */
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.2,300);
camera.rotation.order='YXZ';
scene.add(camera);
const hemi=new THREE.HemisphereLight(0xdde8ff,0x4a4034,0.72); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0dc,1.6); sun.position.set(-18,30,26); scene.add(sun); scene.add(sun.target);
/* Der Schattenbereich der Sonne ist 68 x 68 Meter gross. Das
   Grundstueck ist inzwischen ueber 180 Meter lang, also kann die
   Box nicht fest stehen: sie endete mitten auf dem Testfeld, und
   dort lief eine harte Kante quer ueber den Boden - links Schatten,
   rechts keiner. updateSonne() zieht sie im Loop dem Spieler nach,
   die Lichtrichtung bleibt dabei dieselbe. */
const SONNE_OFF={x:-18,y:30,z:26};
if(HIQ){ sun.castShadow=GFX!=='niedrig'; sun.shadow.mapSize.set(GFX==='hoch'?2048:1024,GFX==='hoch'?2048:1024); const sc=sun.shadow.camera; sc.left=-34; sc.right=34; sc.top=34; sc.bottom=-34; sc.near=5; sc.far=95; sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.02; }
function updateSonne(x,z){
  sun.target.position.set(x,0,z);
  sun.position.set(x+SONNE_OFF.x,SONNE_OFF.y,z+SONNE_OFF.z);
  sun.target.updateMatrixWorld();
}
const shopSpot=new THREE.SpotLight(0xfff1dc,1.35,24,1.2,0.8,1.1); shopSpot.position.set(-0.5,3.45,-0.3); shopSpot.target.position.set(-0.5,0,-0.3); scene.add(shopSpot); scene.add(shopSpot.target);
if(HIQ){ shopSpot.castShadow=true; shopSpot.shadow.mapSize.set(1024,1024); shopSpot.shadow.camera.near=0.5; shopSpot.shadow.camera.far=9; shopSpot.shadow.bias=-0.0008; shopSpot.shadow.normalBias=0.02; }
const shopFill=new THREE.PointLight(0xffe9cf,0.75,15,1.4); shopFill.position.set(4.5,3.2,2.5); scene.add(shopFill);
const shopFill2=new THREE.PointLight(0xe9f0ff,0.5,14,1.5); shopFill2.position.set(-4.5,3.2,-2.5); scene.add(shopFill2);
const lagerLight=new THREE.PointLight(0xe8f0ff,1.0,13,1.3); lagerLight.position.set(-13.5,3.2,-2); lagerLight.distance=17; scene.add(lagerLight);
const yardLight=new THREE.PointLight(0xffc98a,0,16,1.6); yardLight.position.set(3,3.6,-9.5); scene.add(yardLight);
const shelfLight=new THREE.PointLight(0xfff4e0,0,11,1.6); shelfLight.position.set(-2.5,2.3,-4.6); scene.add(shelfLight);
addEventListener('resize',()=>{ renderer.setPixelRatio(gfxPixel()); renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); setCompact(); if(typeof resizePost==='function') resizePost(); });

function box(w,h,d,m,x,y,z,parent,shadow){ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); if(HIQ&&shadow!==false){ o.castShadow=true; o.receiveShadow=true; } (parent||scene).add(o); return o; }
/* Abgeschrägte Kanten: fängt Licht wie ein echtes Möbelstück */
const _rbCache={};
function roundedBoxGeo(w,h,d,r,seg){
  seg=seg||(HIQ?3:2);
  r=Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4);
  const key=[w,h,d,r,seg].map(v=>Math.round(v*1e4)).join('_');
  if(_rbCache[key]) return _rbCache[key];
  const g=new THREE.BoxGeometry(w,h,d,seg,seg,seg), pos=g.attributes.position;
  const ix=w/2-r, iy=h/2-r, iz=d/2-r;
  for(let i=0;i<pos.count;i++){
    const vx=pos.getX(i), vy=pos.getY(i), vz=pos.getZ(i);
    const cx=clamp(vx,-ix,ix), cy=clamp(vy,-iy,iy), cz=clamp(vz,-iz,iz);
    const dx=vx-cx, dy=vy-cy, dz=vz-cz, l=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(l>1e-6){ const k=r/l; pos.setXYZ(i,cx+dx*k,cy+dy*k,cz+dz*k); }
  }
  g.computeVertexNormals();
  if(Object.keys(_rbCache).length<600) _rbCache[key]=g;
  return g;
}
function rbox(w,h,d,r,m,x,y,z,parent,shadow){
  const o=new THREE.Mesh(roundedBoxGeo(w,h,d,r),m); o.position.set(x,y,z);
  if(HIQ&&shadow!==false){ o.castShadow=true; o.receiveShadow=true; }
  (parent||scene).add(o); return o;
}
/* Wie box(), aber mit gefasten Kanten, wo es sich lohnt.
   Texturierte und unsichtbare Flächen bleiben einfache Boxen. */
function bbox(w,h,d,m,x,y,z,parent,shadow){
  const mn=Math.min(w,h,d);
  if(!m||m.map||m===hitM||m.transparent||mn<0.012) return box(w,h,d,m,x,y,z,parent,shadow);
  return rbox(w,h,d,Math.min(0.02,mn*0.17),m,x,y,z,parent,shadow);
}
function plane(w,h,m,x,y,z,ry,parent){ const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m); o.position.set(x,y,z); o.rotation.y=ry||0; (parent||scene).add(o); return o; }
/* Feste Baugruppen buendeln (30.09., Leistung: im Laden gut 1300
   Zeichenaufrufe je Bild). Alle Blatt-Meshes einer Gruppe mit demselben
   Material (und gleichem Schattenwurf) werden zu einem Mesh zusammengelegt.
   Nur fuer Gruppen, deren Teile danach nicht mehr einzeln angefasst werden
   (vom Aufrufer geprueft). Ausgenommen: Meshes mit userData (Treffer,
   bewegte Tasten), unsichtbare, transparente, mit Vertex-Farben oder
   Mehrfach-Material, und alles in opt.aus. */
function statikBuendeln(root,opt){
  opt=opt||{}; const aus=opt.aus||new Set(); root.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(), topf=new Map();
  const sichtbar=o=>{ for(let x=o;x&&x!==root;x=x.parent) if(!x.visible) return false; return true; };
  root.traverse(o=>{ if(o===root||!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.children.length||aus.has(o)) return;
    const m=o.material; if(!m||Array.isArray(m)||!m.visible||m.transparent||m.vertexColors||Object.keys(o.userData).length||!sichtbar(o)) return;
    const g=o.geometry; if(!g||!g.attributes.position||!g.attributes.normal||g.morphAttributes&&Object.keys(g.morphAttributes).length) return;
    const k=m.uuid+'|'+o.castShadow+'|'+o.receiveShadow+'|'+!!g.attributes.uv;
    (topf.get(k)||topf.set(k,[]).get(k)).push(o); });
  let n=0;
  for(const liste of topf.values()){ if(liste.length<2) continue;
    let total=0; const teile=liste.map(o=>{ const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)); total+=g.attributes.position.count; return g; });
    const mitUV=!!liste[0].geometry.attributes.uv, pos=new Float32Array(total*3), nor=new Float32Array(total*3), uv=mitUV?new Float32Array(total*2):null; let p=0;
    for(const g of teile){ const c=g.attributes.position.count; pos.set(g.attributes.position.array,p*3); nor.set(g.attributes.normal.array,p*3); if(uv) uv.set(g.attributes.uv.array,p*2); p+=c; g.dispose(); }
    const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.BufferAttribute(nor,3)); if(uv) out.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    out.computeBoundingSphere();
    const a=liste[0], mm=new THREE.Mesh(out,a.material); mm.castShadow=a.castShadow; mm.receiveShadow=a.receiveShadow; mm.renderOrder=a.renderOrder; mm.userData.gebuendelt=liste.length;
    root.add(mm); for(const o of liste) o.parent.remove(o); n+=liste.length-1; }
  return n;
}
const hitM=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
/* 30.09. (Leistung): unsichtbare Trefferflaechen (Regalboeden, Lagerplaetze,
   Pult, Laptop ...) wurden trotz Deckkraft 0 jedes Bild gezeichnet - je ein
   Zeichenaufruf. material.visible=false: three zeichnet sie nicht mehr, der
   Raycaster trifft sie weiter (er fragt nur Ebenen ab, nicht Sichtbarkeit);
   object.visible bleibt frei fuer die Spiellogik (tfHit, lapHit2). */
hitM.visible=false;
const colliders=[]; 
function col(a,b,c,d,ref){ const o={minX:a,maxX:b,minZ:c,maxZ:d,ref:ref||null}; colliders.push(o); return o; }
function dropCol(o){ const i=colliders.indexOf(o); if(i>=0) colliders.splice(i,1); }
const occluders=[];

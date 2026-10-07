
/* =========================================================
   Renderer & Szene
   ========================================================= */
const canvas=$('c');
/* Kantenglaettung des Bildschirms laesst sich nur beim Start festlegen:
   in 'niedrig' ohne (Wechsel wirkt nach dem Neuladen) */
const renderer=new THREE.WebGLRenderer({canvas,antialias:!gfxNiedrig(GFX),powerPreference:'high-performance'});
/* Aufloesung je Grafikstufe: hoch bis 1,9-fach (Retina), mittel 1-fach,
   niedrig 0,75-fach - das Bild wird hochgezogen, kostet aber nur gut die
   Haelfte der Pixel */
/* Dynamische Aufloesung (03.10., Tom: "fluessiger, hochaufloesend so gut
   es geht"): die Stufe gibt die hoechste Pixeldichte vor (Hoch jetzt bis 2x,
   auch am Handy), RES (0,55-1) regelt in der Automatik laufend nach - faellt
   die Bildrate, wird intern mit weniger Pixeln gezeichnet, ist Luft, wieder
   mit mehr. So bleibt es fluessig, ohne gleich eine ganze Stufe zu verlieren. */
const RES_MIN=0.55;
let RES=1; try{ const r=+localStorage.getItem('bb_res'); if(r) RES=clamp(r,RES_MIN,1); }catch(e){}
function gfxPixelMax(){ const d=window.devicePixelRatio||1, g=GFX_PROFIL[GFX]||GFX_PROFIL.hoch; return GFX==='ultralow'?0.5:GFX==='niedrig'?0.75:Math.min(g.pxMax,Math.max(d*(g.px>2?1.5:1),g.px)); }
function gfxPixel(){ return Math.max(0.5,gfxPixelMax()*(GFX_WAHL==='auto'?RES:1)); }
renderer.setPixelRatio(gfxPixel());
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
/* Schatten (01.10., Tom: beim Grafikwechsel hing sich der Rechner auf):
   Art und an/aus stehen fest - ein Wechsel daran uebersetzt die Shader
   aller Materialien neu (Hunderte auf einmal). Die Stufen unterscheiden
   sich nur in Werten (schattenWerte): Kartengroesse, Weichheit (radius),
   wie oft neu gerechnet wird; niedrig blendet sie per Versatz aus. */
renderer.shadowMap.enabled=HIQ&&GFX!=='ultralow';
renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0b1030);
/* Die Sichtweite reicht jetzt bis in die Stadt. Der Nebel bleibt, aber
   als Dunst ueber die Distanz statt als Wand bei hundert Metern. */
scene.fog=GFX==='ultralow'?new THREE.Fog(0xcfe3f3,28,95):new THREE.Fog(0xcfe3f3,55,520);
/* Die nahe Ebene lag auf 5 cm. Bei 300 m Sichtweite bleibt dem
   Tiefenpuffer damit so wenig Genauigkeit, dass Flaechen, die nur
   wenige Millimeter uebereinanderliegen - Estrich ueber Fuellplatte
   ueber Gelaende -, in zehn bis zwanzig Meter Entfernung
   gegeneinander flimmern und als heller Streifen im Boden stehen.
   Naeher als 20 cm kommt die Kamera ohnehin an nichts heran: der
   Spieler hat 32 cm Kollisionsradius, und was er traegt, haengt
   35 cm oder weiter vor der Linse. */
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.2,GFX==='ultralow'?100:300);
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
if(HIQ){ sun.castShadow=true; const sc=sun.shadow.camera; sc.left=-34; sc.right=34; sc.top=34; sc.bottom=-34; sc.near=5; sc.far=95; sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.02; }
function updateSonne(x,z){
  sun.target.position.set(x,0,z);
  sun.position.set(x+SONNE_OFF.x,SONNE_OFF.y,z+SONNE_OFF.z);
  sun.target.updateMatrixWorld();
}
const shopSpot=new THREE.SpotLight(0xfff1dc,1.35,24,1.2,0.8,1.1); shopSpot.position.set(-0.5,3.45,-0.3); shopSpot.target.position.set(-0.5,0,-0.3); if(GFX!=='ultralow'){ scene.add(shopSpot); scene.add(shopSpot.target); }
if(HIQ&&GFX!=='ultralow'){ shopSpot.castShadow=true; shopSpot.shadow.mapSize.set(1024,1024); shopSpot.shadow.camera.near=0.5; shopSpot.shadow.camera.far=9; shopSpot.shadow.bias=-0.0008; shopSpot.shadow.normalBias=0.02; }
/* Schattenwerte je Grafikstufe - nur Zahlen, keine Shader-Aenderung.
   niedrig: Versatz -10 laesst jeden Punkt beleuchtet (keine Schatten)
   und die Karte wird nicht mehr neu gezeichnet (schattenTakt). */
function schattenWerte(st){
  if(!HIQ) return;
  const g=GFX_PROFIL[st]||GFX_PROFIL.hoch, gr=Math.min(g.sch,renderer.capabilities.maxTextureSize||4096), aus=gfxNiedrig(st);
  if(sun.shadow.mapSize.x!==gr){ sun.shadow.mapSize.set(gr,gr); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
  sun.shadow.radius=g.rad;
  sun.shadow.bias=aus?-10:-0.0006; shopSpot.shadow.bias=aus?-10:-0.0008;
  renderer.shadowMap.needsUpdate=true;
}
schattenWerte(GFX);
/* Innenlicht (07.10., Tom: "Laden-Erweiterung teils extrem dunkel, obwohl Lampen da"): die drei
   festen Punktlichter standen im Basisladen - schon im Eckhaus, in der Suedhalle und im Lager
   erreichte kein Licht mehr die Raeume, ihre Deckenleuchten waren nur leuchtende Flaechen.
   Jetzt haengt das Licht an den Leuchten: ein kleiner Satz echter Punktlichter (gleich viele wie
   vorher, also keine Shader-Neuuebersetzung, kein Mehrpreis) sitzt unter den Deckenleuchten, die dem
   Spieler am naechsten liegen, und wandert mit ihm. Die Leuchten melden sich in LAMPEN an. */
const LAMPEN=[];
const INNEN_N=GFX==='ultralow'?1:GFX==='niedrig'?2:3;
const innenLichter=[];
for(let i=0;i<INNEN_N;i++){ const l=new THREE.PointLight(0xffe9cf,0,12.5,1.35); l.position.set(0,3,0); scene.add(l); innenLichter.push({l,tx:0,ty:3,tz:0,lampe:-1,an:0}); }
/* Ultra Low: Hof- und Regallicht haengen nicht in der Szene (jedes Licht kostet in jedem Pixel) */
const yardLight=new THREE.PointLight(0xffc98a,0,16,1.6); yardLight.position.set(3,3.6,-9.5); if(GFX!=='ultralow') scene.add(yardLight);
const shelfLight=new THREE.PointLight(0xfff4e0,0,11,1.6); shelfLight.position.set(-2.5,2.3,-4.6); if(GFX!=='ultralow') scene.add(shelfLight);
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

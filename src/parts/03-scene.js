
/* =========================================================
   Renderer & Szene
   ========================================================= */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,COARSE?1.5:1.9));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=HIQ;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0b1030);
/* Die Sichtweite reicht jetzt bis in die Stadt. Der Nebel bleibt, aber
   als Dunst ueber die Distanz statt als Wand bei hundert Metern. */
scene.fog=new THREE.Fog(0xcfe3f3,55,520);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.05,300);
camera.rotation.order='YXZ';
scene.add(camera);
const hemi=new THREE.HemisphereLight(0xdde8ff,0x4a4034,0.72); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0dc,1.6); sun.position.set(-18,30,26); scene.add(sun); scene.add(sun.target);
if(HIQ){ sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); const sc=sun.shadow.camera; sc.left=-26; sc.right=26; sc.top=26; sc.bottom=-26; sc.near=5; sc.far=90; sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.02; }
const shopSpot=new THREE.SpotLight(0xfff1dc,1.35,24,1.2,0.8,1.1); shopSpot.position.set(-0.5,3.45,-0.3); shopSpot.target.position.set(-0.5,0,-0.3); scene.add(shopSpot); scene.add(shopSpot.target);
if(HIQ){ shopSpot.castShadow=true; shopSpot.shadow.mapSize.set(1024,1024); shopSpot.shadow.camera.near=0.5; shopSpot.shadow.camera.far=9; shopSpot.shadow.bias=-0.0008; shopSpot.shadow.normalBias=0.02; }
const shopFill=new THREE.PointLight(0xffe9cf,0.75,15,1.4); shopFill.position.set(4.5,3.2,2.5); scene.add(shopFill);
const shopFill2=new THREE.PointLight(0xe9f0ff,0.5,14,1.5); shopFill2.position.set(-4.5,3.2,-2.5); scene.add(shopFill2);
const lagerLight=new THREE.PointLight(0xe8f0ff,1.0,13,1.3); lagerLight.position.set(-13.5,3.2,-2); lagerLight.distance=17; scene.add(lagerLight);
const yardLight=new THREE.PointLight(0xffc98a,0,16,1.6); yardLight.position.set(3,3.6,-9.5); scene.add(yardLight);
const shelfLight=new THREE.PointLight(0xfff4e0,0,11,1.6); shelfLight.position.set(-2.5,2.3,-4.6); scene.add(shelfLight);
addEventListener('resize',()=>{ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); setCompact(); if(typeof resizePost==='function') resizePost(); });

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
const colliders=[]; 
function col(a,b,c,d,ref){ const o={minX:a,maxX:b,minZ:c,maxZ:d,ref:ref||null}; colliders.push(o); return o; }
function dropCol(o){ const i=colliders.indexOf(o); if(i>=0) colliders.splice(i,1); }
const occluders=[];

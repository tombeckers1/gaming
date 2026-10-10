/* =========================================================
   Licht im Laden (10.10., Tom: "sieht alles noch so naja aus")

   Der Laden war gleichmaessig hell wie ein Foto mit Blitz: Himmelslicht
   ueberall gleich, Regale standen ohne Schatten auf dem Boden, der Boden
   hatte keine Lichtflecken unter den Leuchten und keinen Glanz. Was gute
   Spiele hier machen, ohne teure Echtzeit-Verschattung:

   - KONTAKTSCHATTEN: unter jedem Moebel (Regal, Kasse, Tisch, Lagerregal,
     Packtisch, Karton auf dem Boden) ein weicher dunkler Saum, der nach
     aussen ausläuft - Breite nach Hoehe des Moebels. Unter jeder Person
     ein runder Schatten, der mitlaeuft. Alles in EINEM Zeichenaufruf
     (Instanzen), die Lage wird alle 2 s abgeglichen, die Personen jedes Bild.
   - LICHTFLECKEN: unter jeder Deckenleuchte ein warmer, weich auslaufender
     Lichtkegel auf dem Boden - zwischen den Leuchten bleibt es etwas
     dunkler, der Raum bekommt Tiefe. Ein Zeichenaufruf fuer alle Leuchten.
   - GLANZ (ab Mittel, solange die echte Bodenspiegelung aus Pracht nicht
     laeuft): die naechsten Leuchten spiegeln sich als weiche, zum
     Betrachter gezogene Lichtbahnen im Boden - wie auf versiegeltem Estrich.
     Lage aus der Spiegelgeometrie (Leuchte unter den Boden gespiegelt,
     Sichtstrahl schneidet die Bodenebene), Staerke nach Blickwinkel
     (Fresnel) und Belag. Ein Zeichenaufruf.

   Ultra Low legt nichts davon an (bleibt so schnell wie bisher). Niedrig
   bekommt Kontaktschatten und Lichtflecken (zwei Zeichenaufrufe, keine
   Echtzeit-Schatten - dort sind sie der einzige Schatten ueberhaupt).
   ========================================================= */
const LI={an:false, schatten:null, flecken:null, glanz:null, objs:new Map(), personen:[], tS:0, tP:0, sig:'', n:{moebel:0,personen:0,flecken:0,glanz:0}, fehler:null, raeume:null, innen:0, cx:1e9, cz:1e9};
const LI_BEL={aussen:1.05, innen:0.78}; LI.bel=LI_BEL;
const LI_GEO_VS=`
varying vec2 vUv;
varying vec3 vP;
varying vec2 vS;
void main(){
  vUv=uv;
#ifdef USE_INSTANCING_COLOR
  vP=instanceColor;
#else
  vP=vec3(0.5,0.3,0.0);
#endif
#ifdef USE_INSTANCING
  mat4 im=instanceMatrix;
#else
  mat4 im=mat4(1.0);
#endif
  vS=vec2(length(im[0].xyz),length(im[2].xyz));
  gl_Position=projectionMatrix*viewMatrix*modelMatrix*im*vec4(position,1.0);
}`;
/* Schatten: vP.x Deckkraft, vP.y Saumbreite (m), vP.z 0 Rechteck / 1 rund */
const LI_SCH_FS=`
varying vec2 vUv;
varying vec3 vP;
varying vec2 vS;
void main(){
  vec2 p=(vUv-0.5)*vS;
  float a;
  if(vP.z>0.5){ vec2 q=(vUv-0.5)*2.0; float r=length(q); a=vP.x*exp(-3.2*r*r)*(1.0-smoothstep(0.75,1.0,r)); }
  else { vec2 inner=max(vS*0.5-vP.y,vec2(0.001)); float d=length(max(abs(p)-inner,0.0)); float k=1.0-clamp(d/vP.y,0.0,1.0); a=vP.x*k*sqrt(k); }
  gl_FragColor=vec4(0.0,0.0,0.0,a);
}`;
/* Licht: vP.x Staerke, vP.z 0 Lichtfleck (rund, weich) / 1 Glanzbahn (laenglich, mit Kern) */
const LI_LICHT_FS=`
uniform vec3 farbe;
varying vec2 vUv;
varying vec3 vP;
varying vec2 vS;
void main(){
  vec2 q=(vUv-0.5)*2.0;
  float r2=dot(q,q), i;
  if(vP.z>0.5) i=exp(-(q.x*q.x*9.0+q.y*q.y*4.5))*0.75+exp(-(q.x*q.x*2.6+q.y*q.y*1.6))*0.3;
  else i=exp(-2.6*r2);
  i*=1.0-smoothstep(0.82,1.0,sqrt(r2));
  gl_FragColor=vec4(farbe*i*vP.x,1.0);
}`;
function liMesh(n,fs,add,ro){
  const g=new THREE.PlaneGeometry(1,1); g.rotateX(-Math.PI/2);
  const m=new THREE.ShaderMaterial({uniforms:{farbe:{value:new THREE.Color(1,0.93,0.82)}},vertexShader:LI_GEO_VS,fragmentShader:fs,transparent:true,depthWrite:false,
    blending:add?THREE.AdditiveBlending:THREE.NormalBlending,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,fog:false});
  m.toneMapped=false;
  const o=new THREE.InstancedMesh(g,m,n); o.count=0; o.frustumCulled=false; o.renderOrder=ro; o.castShadow=false; o.receiveShadow=false;
  o.userData._licht=true; o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  o.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3); o.instanceColor.setUsage(THREE.DynamicDrawUsage);
  scene.add(o); return o;
}
function lichtAufbau(){
  try{
    if(GFX_START===GFX_PROFIL.ultralow||GFX==='ultralow') return;
    if(String(THREE.REVISION).indexOf('stub')>=0||!THREE.InstancedMesh||!THREE.InstancedBufferAttribute) return;
    LI.schatten=liMesh(900,LI_SCH_FS,false,2);
    LI.flecken=liMesh(400,LI_LICHT_FS,true,3);
    LI.glanz=liMesh(24,LI_LICHT_FS,true,4);
    LI.an=true; LI.tS=-1e9;
  }catch(e){ LI.fehler=String(e&&e.message||e); LI.an=false; }
}
const _liM=new THREE.Matrix4(), _liQ=new THREE.Quaternion(), _liP=new THREE.Vector3(), _liS=new THREE.Vector3(), _liY=new THREE.Vector3(0,1,0);
function liSetzen(o,i,x,y,z,ry,sx,sz,a,b,c){
  _liQ.setFromAxisAngle(_liY,ry); _liP.set(x,y,z); _liS.set(sx,1,sz); _liM.compose(_liP,_liQ,_liS); o.setMatrixAt(i,_liM);
  o.instanceColor.setXYZ(i,a,b,c);
}
/* ---------- Moebel finden: Grundflaeche und Hoehe je Objekt, gemerkt ---------- */
const _liB=new THREE.Box3(), _liB2=new THREE.Box3(), _liInv=new THREE.Matrix4(), _liRel=new THREE.Matrix4();
function liSichtbar(o){ for(let x=o;x;x=x.parent){ if(!x.visible) return false; if(x===scene) return true; } return false; }
/* Kasten im Koordinatensystem der Gruppe (dreht mit ihr), nur sichtbare, gezeichnete Teile */
function liKasten(g){
  _liInv.copy(g.matrixWorld).invert(); _liB.makeEmpty(); let n=0;
  g.traverse(o=>{ if(!o.isMesh||!o.visible||o.userData._bnd) return; const m=o.material; if(!m||(Array.isArray(m)?!m.some(q=>q&&q.visible):!m.visible)) return;
    if(m.transparent&&!Array.isArray(m)&&m.opacity<0.3) return;
    const ge=o.geometry; if(!ge||!ge.attributes||!ge.attributes.position) return; if(!ge.boundingBox) ge.computeBoundingBox();
    _liRel.multiplyMatrices(_liInv,o.matrixWorld); _liB2.copy(ge.boundingBox).applyMatrix4(_liRel); _liB.union(_liB2); n++; });
  return n?_liB.clone():null;
}
function liRaeume(){
  if(!LI.raeume){ const L=LAY; LI.raeume=[L.shop,{x0:-19.9,x1:-8.1,z0:-29.9,z1:5.9},L.schleuse,L.lw2,L.lwest].filter(Boolean); }
  return LI.raeume;
}
function liRaum(x,z){ const R=liRaeume(); for(let i=0;i<R.length;i++){ const r=R[i]; if(x>r.x0-0.2&&x<r.x1+0.2&&z>r.z0-0.2&&z<r.z1+0.2) return i; } return -1; }
/* Hoehe eines Moebels (einmal je Lage/Bestueckung gemessen) */
function liHoehe(g){
  const e=g.matrixWorld.elements, sig=Math.round(e[12]*20)+','+Math.round(e[14]*20)+','+Math.round(e[0]*20)+','+g.children.length;
  let c=LI.objs.get(g); if(c&&c.sig===sig) return c;
  const k=liKasten(g); c={sig,h:k?k.max.y-k.min.y:1,y0:k?k.min.y:0}; LI.objs.set(g,c); return c;
}
/* Schattenwerfer, ausdruecklich aufgezaehlt (ein allgemeiner Suchlauf ueber die Szene fand
   Boeden, Decken und doppelt liegende Bauteile - die Schatten stapelten sich zu dunklen Flecken):
   alle Moebel mit Stellflaeche (Regale, Lagerregale, Kasse, Tisch, Deko, Automat), die Teile der
   Versandecke (Band, Packtische, Zaun, Wagen) und Kartons auf dem Boden */
function liSammeln(){
  const L=[], seen=new Set();
  const dazu=(x,z,ry,w,d,h,y0)=>L.push({x,z,ry,w,d,h,y0});
  if(typeof movables!=='undefined') for(const m of movables){ const g=m&&m.g; if(!g||!g.parent||!liSichtbar(g)) continue; seen.add(g);
    if(m.fw&&m.fd){ const c=liHoehe(g); dazu(g.position.x,g.position.z,g.rotation.y,m.fw,m.fd,c.h,g.position.y+Math.max(0,c.y0)); }
    else if(m.teile){ let T=[]; try{ T=m.teile(); }catch(e){}
      for(const t of T){ const r=rectWelt(g.position.x,g.position.z,g.rotation.y,t), w=r.x1-r.x0, d=r.z1-r.z0;
        if(w*d<0.03||w*d>12) continue; dazu((r.x0+r.x1)/2,(r.z0+r.z1)/2,0,w,d,1.1,g.position.y); } } }
  if(typeof floorBoxes!=='undefined') for(const b of floorBoxes){ const o=b&&b.mesh; if(!o||o.parent!==scene||!o.visible) continue;
    const ge=o.geometry; if(!ge) continue; if(!ge.boundingBox) ge.computeBoundingBox(); const bb=ge.boundingBox;
    dazu(o.position.x,o.position.z,o.rotation.y,(bb.max.x-bb.min.x)*o.scale.x,(bb.max.z-bb.min.z)*o.scale.z,(bb.max.y-bb.min.y)*o.scale.y,o.position.y+bb.min.y*o.scale.y); }
  for(const o of LI.objs.keys()) if(!seen.has(o)) LI.objs.delete(o);
  return L;
}
function liMoebelSchatten(){
  const L=liSammeln(), S=LI.schatten, frei=new Set(); let n=0;
  for(const e of L){ if(n>=880) break;
    if(e.h<0.2||e.y0>0.35||e.w<0.08||e.d<0.08) continue;
    /* gleiche Stelle, gleiche Groesse: nur einmal (sonst stapelt sich das Dunkel) */
    const key=Math.round(e.x*5)+','+Math.round(e.z*5)+','+Math.round(e.w*5)+','+Math.round(e.d*5); if(frei.has(key)) continue; frei.add(key);
    if(typeof unterDach==='function'&&!unterDach(e.x,1,e.z)) continue;
    /* Saum nach Hoehe: hohe Regale werfen einen breiteren, dunkleren Schatten; der dunkelste
       Rand liegt knapp innerhalb der Stellflaeche (die ist mit etwas Luft bemessen) */
    const f=clamp(0.16+e.h*0.13,0.2,0.5), dichte=clamp(0.42+e.h*0.08,0.45,0.66), ein=Math.min(0.08,e.w*0.2,e.d*0.2);
    liSetzen(S,n++,e.x,Math.max(0,e.y0)+0.04,e.z,e.ry,e.w-2*ein+2*f,e.d-2*ein+2*f,dichte,f,0);
  }
  LI.n.moebel=n; LI.nMoebel=n;
}
function liPersonen(){
  const P=[]; for(const o of scene.children) if(o.userData&&o.userData.legs) P.push(o);
  LI.personen=P;
}
function liPersonenSchatten(){
  const S=LI.schatten; let n=LI.nMoebel||0;
  for(const o of LI.personen){ if(n>=S.instanceMatrix.count) break; if(!o.visible||!o.parent) continue;
    const e=o.matrixWorld.elements, x=e[12], y=e[13], z=e[14];
    if(y>1.2||y<-0.6||(typeof unterDach==='function'&&!unterDach(x,1,z))) continue;
    liSetzen(S,n++,x,Math.max(0,y)+0.041,z,0,0.95,0.95,0.5,0.2,1); }
  LI.n.personen=n-(LI.nMoebel||0);
  S.count=n; S.instanceMatrix.needsUpdate=true; S.instanceColor.needsUpdate=true;
}
/* ---------- Lichtflecken unter den Deckenleuchten ---------- */
function liFlecken(){
  const F=LI.flecken; let n=0;
  for(const L of LAMPEN){ if(n>=F.instanceMatrix.count) break; if(L.id&&typeof zoneOffen==='function'&&!zoneOffen(L.id)) continue;
    const h=L.y, r=clamp(h*0.5,1.7,5), k=clamp(0.2*3.6/h,0.1,0.2);
    liSetzen(F,n++,L.x,0.043,L.z,0,r*2.4,r*1.9,k,0,0); }
  F.count=n; F.instanceMatrix.needsUpdate=true; F.instanceColor.needsUpdate=true; LI.n.flecken=n;
}
/* ---------- Glanzbahnen: Spiegelbild der naechsten Leuchten im Boden ---------- */
function liGlanzStaerke(raum){
  if(raum!==0) return raum===1?0.55:0.45;
  let f=null; try{ f=typeof floorSet==='function'?floorSet():null; }catch(e){}
  if(!f) return 0.8; if(f.art==='velours') return 0;
  return clamp(0.55+(f.glanz||0)*0.5+(0.6-(f.rau!==undefined?f.rau:0.6))*0.6,0.35,1.15);
}
function liGlanz(){
  const G=LI.glanz, cam=camera.position, cy=cam.y;
  const spiegel=typeof PR!=='undefined'&&PR.an&&PR.sp&&PR.sp.k.value>0;
  if(spiegel||gfxNiedrig(GFX)||cy<0.3||cy>6){ G.count=0; LI.n.glanz=0; return; }
  const fx=-Math.sin(yaw), fz=-Math.cos(yaw), kand=[];
  for(const L of LAMPEN){ if(L.id&&typeof zoneOffen==='function'&&!zoneOffen(L.id)) continue;
    const dx=L.x-cam.x, dz=L.z-cam.z, d=Math.hypot(dx,dz); if(d>24||d<0.3) continue;
    if((dx*fx+dz*fz)<-1.5) continue;
    kand.push({L,d}); }
  kand.sort((a,b)=>a.d-b.d);
  const gl=[]; let n=0;
  for(const k of kand){ if(n>=G.instanceMatrix.count) break; const L=k.L, H=L.y-0.05;
    /* Leuchte unter den Boden gespiegelt: (x, -H, z); der Sichtstrahl trifft den Boden bei t */
    const t=cy/(cy+H), px=cam.x+(L.x-cam.x)*t, pz=cam.z+(L.z-cam.z)*t;
    const raum=liRaum(L.x,L.z); if(raum<0||liRaum(px,pz)!==raum) continue;
    if(gl[raum]===undefined) gl[raum]=liGlanzStaerke(raum); const g=gl[raum]; if(g<=0) continue;
    const dh=Math.hypot(px-cam.x,pz-cam.z), sinA=cy/Math.hypot(dh,cy);       /* Neigung des Blicks zum Boden */
    const fres=0.18+0.82*Math.pow(1-sinA,3);
    const ferne=1-clamp((k.d-14)/10,0,1);
    const ry=Math.atan2(px-cam.x,pz-cam.z);
    const lang=0.7+2.6*(1-sinA)+H*0.12, breit=0.75+H*0.05;
    liSetzen(G,n++,px,0.045,pz,ry,breit,lang,0.42*g*fres*ferne,0,1); }
  G.count=n; G.instanceMatrix.needsUpdate=true; G.instanceColor.needsUpdate=true; LI.n.glanz=n;
}
function ladenLichtTakt(dt){
  if(!LI.an) return;
  try{
    const sig=LAMPEN.length+'|'+(typeof S!=='undefined'&&S&&S.up?Object.keys(S.up).filter(k=>S.up[k]).length:0);
    if(sig!==LI.sig){ LI.sig=sig; liFlecken(); }
    /* alle 2 s nach der Uhr (nicht nach dt: Testbilder zeichnen mit festem dt, dazwischen laeuft das Spiel weiter) */
    const jetzt=performance.now();
    if(jetzt-LI.tS>2000){ LI.tS=jetzt; liMoebelSchatten(); liPersonen(); }
    liPersonenSchatten();
    liGlanz();
    /* Augenanpassung: drinnen etwas weniger Belichtung - weisse Regale und heller Boden
       liefen sonst in reines Weiss, die Leuchten (nicht tonwertgemappt) heben sich ab.
       Draussen (Feuerwerk, Strasse) bleibt alles wie gehabt. Ein Sprung der Kamera
       (Teleport, Testbild) passt sofort an. */
    const c=camera.position, drin=typeof unterDach==='function'&&unterDach(c.x,1,c.z)?1:0;
    const sprung=Math.abs(c.x-LI.cx)+Math.abs(c.z-LI.cz)>3; LI.cx=c.x; LI.cz=c.z;
    LI.innen=sprung?drin:LI.innen+(drin-LI.innen)*Math.min(1,(dt||0.016)*2.5);
    renderer.toneMappingExposure=LI_BEL.aussen+(LI_BEL.innen-LI_BEL.aussen)*LI.innen;
  }catch(e){ LI.fehler=String(e&&e.message||e); LI.an=false; for(const o of [LI.schatten,LI.flecken,LI.glanz]) if(o) o.visible=false; }
}

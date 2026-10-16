/* =========================================================
   Licht und Schatten innen (Licht-Paket 15.10., ersetzt die Fassung vom 10.10.)

   Tom, 15.10.: "Wenn man durch die Raeume laeuft, ist es immer so dunkel, und wenn
   man in eine bestimmte Richtung geht, wird es hell - macht keinen Sinn, muss gleich
   ausgeleuchtet sein. Auf der Verkaufsflaeche glaenzt der Boden so komisch."
   Ursachen (gemessen, docs/uebergabe/licht-1510.md):
   - AUGENANPASSUNG: drinnen Belichtung 0,74 statt 1,05, dazu in der Bildzusammenfuehrung
     eine Gamma-Abdunklung (pow 1,2) - je nach Kameraort umgeblendet: Raeume dunkel,
     Helligkeit springt an jeder Tuer und an jeder Stelle, die "unterDach" anders sieht.
   - WANDERNDE LICHTER: das Innenlicht waren 3 Punktlichter, die den Leuchten vor dem
     Blick des Spielers folgten - drehte man sich, wanderte das Licht mit, Ecken ohne
     Licht blieben dunkel; nachts sank das Himmelslicht auf 0,16, dann gab es fast nur sie.
   - GLANZ: Glanzbahnen (Spiegelbild der Leuchten, zum Betrachter gezogen) plus Boden-
     Rauheit 0,3-0,5 mit Umgebungsbild (ab Maximum Rauheit halbiert und Spiegelung >= 1).

   Neu - ein RAUMLICHT im Shader (alle Stufen, kostet keinen Zeichenaufruf):
   - Jede Flaeche weiss, ob sie in einem Raum liegt (Weltlage gegen die Raumliste aus
     dachBereiche(), also dieselben Raeume, Zonen und Ausbaustufen wie Schnee/Kunden).
     Drinnen bekommt sie gleichmaessiges Deckenlicht: von oben voll, seitlich 85 %, von
     unten 70 % - Tag und Nacht gleich, an jedem Ort gleich, egal wohin man schaut.
   - Das Himmelslicht wirkt drinnen nur noch zu RAUM.hemi (Tageslicht durch die Fenster),
     die Sonne nur, wo die Schattenkarte sie durchlaesst (Fenster, Tore: Sonnenflecken mit
     Schatten). Ohne Schattenkarte (Niedrig, Ultra Low, Handy) ist die Sonne drinnen aus -
     sonst schiene sie durchs Dach.
   - Glanz: Flaechen ohne Umgebungsbild spiegeln drinnen einen gleichmaessig hellen Raum
     (RAUM.spec) - Metall bleibt Metall, ohne wandernde Lichtpunkte.
   - Belichtung fest LI_BEL (1,05) drinnen wie draussen; keine Augenanpassung.
   - Ultra Low (Lambert): dieselbe Raum-Entscheidung je Pixel (Lambert-Shader ergaenzt), sonst nichts.
   - Kontaktschatten unter Moebeln und Personen: kraeftiger (Deckkraft 0,66-0,86, Personen 0,72), jetzt auf ALLEN Stufen
     (ein Zeichenaufruf, kleine Flaechen) - auf Niedrig/Ultra Low der einzige Schatten.
   Wegfall: 3 wandernde Punktlichter, Ladenstrahler (mit eigener Schattenkarte),
   Lichtflecken und Glanzbahnen - weniger Licht je Pixel, ein Schattendurchgang weniger.
   ========================================================= */
const LI={an:false, schatten:null, objs:new Map(), personen:[], tS:0, n:{moebel:0,personen:0}, fehler:null, raum:null};
const LI_BEL=1.05; LI.bel=LI_BEL;
/* Raumlicht: Staerke (Deckenlicht von oben), Anteil Himmelslicht drinnen, Glanz des Raums
   (Leuchtdichte der Umgebung je Staerke 1), hoechstens RAUM.n Raeume */
const RAUM={n:24, staerke:0.4, decke:0.65, hemi:0.2, spec:0.32, werte:null, sig:'', liste:[], nAktiv:0, tS:-1e9};
/* DECKENLICHT mit Schatten (ab Mittel): ein Richtungslicht fast senkrecht von oben (17 Grad geneigt, Schatten fallen zur Strassenseite - zum Spieler, der vom Eingang hereinschaut), wirkt nur
   drinnen (der Shader erkennt es an der Richtung) - Regale, Kassen, Personen, Kartons werfen weiche Schatten auf
   den Boden, untere Regalboeden liegen im Schatten der oberen. Die Schattenkarte deckt 32 x 32 m um den Spieler,
   das Licht sitzt 3,3 m hoch: Decken und Daecher liegen darueber und werfen keinen Schatten. Ohne Schattenkarte
   (Niedrig) ist es aus, das Raumlicht uebernimmt seinen Anteil (gleich hell). */
const DECKE={l:null, h:3.3, neig:0.3, halb:16, x:1e9, z:1e9, n:0};
(function raumShader(){
  const C=THREE.ShaderChunk;
  /* Test-Attrappe von three (Node, test.html): keine Shader - nichts zu tun */
  if(!C||typeof C.lights_fragment_begin!=='string'||!THREE.ShaderLib||!THREE.ShaderLib.lambert||typeof THREE.ShaderLib.lambert.fragmentShader!=='string'||!THREE.Vector4) return;
  const N=RAUM.n, V=[]; for(let i=0;i<N*2+1;i++) V.push(new THREE.Vector4());
  RAUM.werte=V;
  /* Werte an alle eingebauten Licht-Materialien: three kopiert die Uniform-Tabelle je Material
     (UniformsUtils.clone), Listen aber flach (slice) - die Vector4 darin bleiben dieselben
     Objekte, ein Setzen hier wirkt also in allen Materialien */
  for(const k of ['standard','physical','lambert','phong','toon']) if(THREE.ShaderLib[k]) THREE.ShaderLib[k].uniforms.raumL={value:V};
  const GLSL=`
#define RAUM_N ${N}
uniform vec4 raumL[ ${N*2+1} ];
/* x: Raumlicht-Staerke (0 = draussen), y: Sonnenanteil drinnen */
vec2 raumAn( vec3 p ){
  for( int i = 0; i < RAUM_N; i ++ ){
    if( float( i ) >= raumL[ 0 ].w ) break;
    vec4 b = raumL[ 1 + i * 2 ]; vec4 q = raumL[ 2 + i * 2 ];
    if( q.z > 0.0 && p.x > b.x && p.x < b.z && p.z > b.y && p.z < b.w && p.y > q.x && p.y < q.y ) return vec2( q.z, q.w );
  }
  return vec2( 0.0, 1.0 );
}
vec3 raumIrr( float st, vec3 nW ){ return st * ( 0.85 + 0.15 * nW.y ) * vec3( 1.0, 0.965, 0.91 ) * PI; }
`;
  C.lights_pars_begin+=GLSL;
  /* Fragment (Standard, Physical, Phong, Toon) */
  let f=C.lights_fragment_begin;
  f=f.replace('IncidentLight directLight;','IncidentLight directLight;\nvec3 raumP = cameraPosition + ( vec4( geometry.position, 0.0 ) * viewMatrix ).xyz;\nvec3 raumN = ( vec4( geometry.normal, 0.0 ) * viewMatrix ).xyz;\nvec2 raumA = raumAn( raumP );\nfloat raumSo = raumA.x > 0.0 ? raumA.y : 1.0;');
  const dir=f.indexOf('#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )'), dirE=f.indexOf('#if ( NUM_RECT_AREA_LIGHTS');
  f=f.slice(0,dir)+f.slice(dir,dirE).replace('RE_Direct( directLight, geometry, material, reflectedLight );','directLight.color *= ( vec4( directLight.direction, 0.0 ) * viewMatrix ).y > 0.95 ? ( raumA.x > 0.0 ? 1.0 : 0.0 ) : raumSo;\n\t\tRE_Direct( directLight, geometry, material, reflectedLight );')+f.slice(dirE);
  f=f.replace(/(#if defined\( RE_IndirectSpecular \)\s*vec3 radiance = vec3\( 0\.0 \);)/,'#if defined( RE_IndirectDiffuse )\n\tif( raumA.x > 0.0 ) irradiance = irradiance * raumL[ 0 ].x + raumIrr( raumA.x, raumN );\n#endif\n$1\n#ifndef USE_ENVMAP\n\tradiance += raumA.x * raumL[ 0 ].y * vec3( 1.0, 0.965, 0.91 );\n#endif');
  /* Lambert (Ultra Low): three rechnet das Licht je Ecke - die Boden- und Hallenplatten sind aber oft EIN Viereck ueber
     mehrere Raeume (Ecken ausserhalb), dann blieb der Boden dunkel. Darum Weltlage und Normale als Varying und die
     Raum-Entscheidung je Pixel: Himmelslicht drinnen auf RAUM.hemi, Raumlicht dazu, Sonne (ohne Schattenkarte) aus.
     Weltlage ueber modelMatrix - three laedt cameraPosition fuer Lambert nicht hoch. */
  const L=THREE.ShaderLib.lambert; let lv=L.vertexShader, lf=L.fragmentShader;
  lv=lv.replace('#include <common>','#include <common>\nvarying vec3 vRaumW;\nvarying vec3 vRaumN;')
       .replace('#include <lights_lambert_vertex>','#include <lights_lambert_vertex>\n{ vec4 raumW = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\n\traumW = instanceMatrix * raumW;\n#endif\n\tvRaumW = ( modelMatrix * raumW ).xyz; vRaumN = ( vec4( geometry.normal, 0.0 ) * viewMatrix ).xyz; }');
  /* raumAn/raumL kommen ueber lights_pars_begin (steht auch im Lambert-Fragment) - hier nur die Varyings */
  /* three r128: cube_uv_reflection_fragment (#define v1 0.276 ...) steht im Lambert-Fragment VOR bsdfs - ein Lambert-Material mit
     PMREM-Umgebungsbild (Ultra Low: glaenzender Boden/Wand ueber innenUmgebung) bricht dann beim Uebersetzen ab ('0.276' syntax
     error in LTC_EdgeVectorFormFactor(v1, v2)) und bleibt unsichtbar. Die Hilfsnamen nach dem Einbinden wieder freigeben. */
  const UNDEF=['r0','v0','m0','r1','v1','m1','r4','v4','m4','r5','v5','m5','r6','v6','m6'].map(n=>'#undef '+n).join('\n');
  lf=lf.replace('#include <cube_uv_reflection_fragment>','#include <cube_uv_reflection_fragment>\n#ifdef ENVMAP_TYPE_CUBE_UV\n'+UNDEF+'\n#endif');
  lf=lf.replace('#include <common>','#include <common>\nvarying vec3 vRaumW;\nvarying vec3 vRaumN;')
       .replace('#include <aomap_fragment>','{ vec2 raumA = raumAn( vRaumW );\n\tif( raumA.x > 0.0 ){ vec3 raumN = normalize( vRaumN );\n#ifdef DOUBLE_SIDED\n\t\tif( !gl_FrontFacing ) raumN = -raumN;\n#endif\n\t\treflectedLight.indirectDiffuse = reflectedLight.indirectDiffuse * raumL[ 0 ].x + raumIrr( raumA.x, raumN ) * BRDF_Diffuse_Lambert( diffuseColor.rgb );\n\t\treflectedLight.directDiffuse *= raumA.y; } }\n#include <aomap_fragment>');
  const lamOk=lv.indexOf('vRaumW = ( modelMatrix')>0&&lf.indexOf('raumIrr( raumA.x, raumN ) * BRDF')>0&&lf.indexOf('#include <lights_pars_begin>')>0&&lf.indexOf('#undef v1')>0;
  RAUM.ok=f.indexOf(': raumSo;\n\t\tRE_Direct')>0&&f.indexOf('raumIrr( raumA.x, raumN )')>0&&lamOk;
  if(RAUM.ok){ C.lights_fragment_begin=f; L.vertexShader=lv; L.fragmentShader=lf; }
})();
/* Raumliste aus den Daechern (dieselben Raeume wie Schnee, Kunden, Personal): Dachbereich ohne
   den Rand von 0,3 m bzw. 0,4 m ueber der Decke, dafuer 6 cm Luft - die Innenseite der Wand gehoert
   zum Raum, die Aussenseite (20 cm weiter) nicht */
function raumListe(){
  if(RAUM.liste.length||typeof dachBereiche!=='function') return RAUM.liste;
  for(const d of dachBereiche()) RAUM.liste.push({d,x0:d.x0+0.24,x1:d.x1-0.24,z0:d.z0+0.24,z1:d.z1-0.24,h:d.h-0.34});
  return RAUM.liste;
}
function raumAktiv(d){ return !d.zone||(typeof zoneOffen==='function'&&zoneOffen(d.zone)); }
/* Werte setzen, wenn sich Zonen, Ausbaustufe oder Grafikstufe aendern (sonst nichts zu tun) */
function raumSchatten(){ return !!(renderer.shadowMap.enabled&&sun.castShadow&&!gfxNiedrig(GFX)&&sun.shadow.bias>-1); }
/* Deckenlicht beim Laden anlegen (vor dem ersten Shader - die Zahl der Lichter steht dann fest), nur ab Mittel:
   Niedrig spart sich das zweite Richtungslicht samt Schattenabfrage je Pixel (gemessen: sonst nicht schneller als
   vorher). Wer auf Niedrig startet und zur Laufzeit hochschaltet, hat bis zum Neuladen nur das Raumlicht (gleich hell,
   raumTakt rechnet den Anteil des Deckenlichts dann ins Raumlicht). Von Mittel nach Niedrig: Licht 0, Karte ruht. */
if(RAUM.werte&&HIQ&&!gfxNiedrig(GFX)&&renderer.shadowMap.enabled){
  const l=new THREE.DirectionalLight(MAT.farbe('lampeWarm'),0); l.castShadow=true; const c=l.shadow.camera;
  c.left=-DECKE.halb; c.right=DECKE.halb; c.top=DECKE.halb; c.bottom=-DECKE.halb; c.near=0.05; c.far=DECKE.h+0.6;
  l.shadow.bias=-0.0008; l.shadow.normalBias=0.03; l.userData.decke=true;
  /* Leistung: die Karte wird nur jedes 2. Bild neu gezeichnet (und sofort nach einem Schritt) - Regale stehen still,
     Personen laufen langsam; das spart die Haelfte der zusaetzlichen Zeichenaufrufe */
  l.shadow.autoUpdate=false; l.shadow.needsUpdate=true;
  scene.add(l); scene.add(l.target); DECKE.l=l;
}
function deckeTakt(){
  const l=DECKE.l; if(!l) return;
  const an=raumSchatten();
  l.intensity=an?RAUM.decke:0; l.shadow.bias=an?-0.0008:-10;
  const g=GFX_PROFIL[GFX]||GFX_PROFIL.hoch, gr=Math.min(2048,g.sch,renderer.capabilities.maxTextureSize||2048);
  if(l.shadow.mapSize.x!==gr){ l.shadow.mapSize.set(gr,gr); if(l.shadow.map){ l.shadow.map.dispose(); l.shadow.map=null; } l.shadow.needsUpdate=true; }
  l.shadow.radius=g.rad*1.6;
  if(an&&(++DECKE.n)%2===0) l.shadow.needsUpdate=true;
  /* dem Spieler in 2-m-Schritten folgen (ganze Texel - die Schatten flimmern beim Gehen nicht) */
  const r=2, tx=Math.round(pl.x/r)*r, tz=Math.round(pl.z/r)*r;
  if(tx===DECKE.x&&tz===DECKE.z) return; DECKE.x=tx; DECKE.z=tz; l.shadow.needsUpdate=true;
  l.target.position.set(tx,0,tz); l.position.set(tx+DECKE.h*DECKE.neig*0.35,DECKE.h,tz-DECKE.h*DECKE.neig*0.94);
  l.target.updateMatrixWorld(); l.updateMatrixWorld();
}
function raumTakt(){
  const V=RAUM.werte, L=raumListe(); if(!V||!L.length) return;
  const schatten=raumSchatten(), st=RAUM.staerke+(schatten&&DECKE.l?0:RAUM.decke*0.85);
  /* Leistung: aktive Raeume vorn und nach Abstand zur Kamera sortiert - der Shader bricht beim ersten Treffer ab
     (die meisten Pixel liegen im Raum des Spielers) und nach dem letzten aktiven Raum (raumL[0].w) */
  const c=camera.position, A=L.filter(r=>raumAktiv(r.d));
  const ab=r=>Math.hypot(Math.max(r.x0-c.x,0,c.x-r.x1),Math.max(r.z0-c.z,0,c.z-r.z1));
  A.sort((p,q)=>ab(p)-ab(q));
  let sig=(schatten?'s':'-')+st+'|'+RAUM.hemi+'|'+RAUM.spec+'|'; for(const r of A) sig+=L.indexOf(r)+',';
  if(sig===RAUM.sig) return; RAUM.sig=sig;
  const n=Math.min(A.length,RAUM.n); V[0].set(RAUM.hemi,RAUM.spec,0,n);
  for(let i=0;i<RAUM.n;i++){ const r=A[i], b=V[1+i*2], q=V[2+i*2];
    if(r){ b.set(r.x0,r.z0,r.x1,r.z1); q.set(-0.6,r.h,st,schatten?1:0); }
    else { b.set(0,0,0,0); q.set(0,0,0,0); } }
  RAUM.nAktiv=n; RAUM.nListe=L.length;
}
/* Liegt ein Punkt im Raumlicht? (fuer Tests und Kontaktschatten, gleiche Regel wie der Shader) */
function raumAn(x,y,z){ const V=RAUM.werte; if(!V) return 0; for(let i=0;i<RAUM.n;i++){ const b=V[1+i*2], q=V[2+i*2];
  if(q.z>0&&x>b.x&&x<b.z&&z>b.y&&z<b.w&&y>q.x&&y<q.y) return q.z; } return 0; }
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
  else { vec2 inner=max(vS*0.5-vP.y,vec2(0.001)); float d=length(max(abs(p)-inner,0.0)); float k=1.0-clamp(d/vP.y,0.0,1.0); a=vP.x*pow(k,0.75); }
  gl_FragColor=vec4(0.0,0.0,0.0,a);
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
  raumTakt();
  try{
    if(String(THREE.REVISION).indexOf('stub')>=0||!THREE.InstancedMesh||!THREE.InstancedBufferAttribute) return;
    LI.schatten=liMesh(900,LI_SCH_FS,false,2);
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
    const f=clamp(0.2+e.h*0.15,0.25,0.6), dichte=clamp(0.66+e.h*0.1,0.66,0.86), ein=Math.min(0.08,e.w*0.2,e.d*0.2);
    liSetzen(S,n++,e.x,Math.max(0,e.y0)+0.04,e.z,e.ry,e.w-2*ein+2*f,e.d-2*ein+2*f,dichte,f,0);
  }
  LI.n.moebel=n; LI.nMoebel=n; LI.voll=true;
}
/* nur den geaenderten Teil zur Grafikkarte schicken (sonst gingen jedes Bild 70 KB fuer
   900 Plaetze hoch, auch wenn nur drei Personen laufen) */
function liHoch(o,von,bis){
  if(bis<=von) return;
  o.instanceMatrix.updateRange.offset=von*16; o.instanceMatrix.updateRange.count=(bis-von)*16; o.instanceMatrix.needsUpdate=true;
  o.instanceColor.updateRange.offset=von*3; o.instanceColor.updateRange.count=(bis-von)*3; o.instanceColor.needsUpdate=true;
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
    liSetzen(S,n++,x,Math.max(0,y)+0.041,z,0,1.05,1.05,0.72,0.2,1); }
  LI.n.personen=n-(LI.nMoebel||0);
  S.count=n;
  if(LI.voll){ LI.voll=false; liHoch(S,0,n); } else liHoch(S,LI.nMoebel||0,n);
}
function ladenLichtTakt(dt){
  /* Belichtung fest - drinnen wie draussen (keine Augenanpassung mehr) */
  renderer.toneMappingExposure=LI_BEL;
  try{ deckeTakt(); }catch(e){ LI.fehler=String(e&&e.message||e); }
  const jetzt=performance.now();
  if(jetzt-RAUM.tS>500){ RAUM.tS=jetzt; try{ raumTakt(); }catch(e){ LI.fehler=String(e&&e.message||e); } }
  if(!LI.an) return;
  try{
    /* alle 2 s nach der Uhr (nicht nach dt: Testbilder zeichnen mit festem dt, dazwischen laeuft das Spiel weiter) */
    if(jetzt-LI.tS>2000){ LI.tS=jetzt; liMoebelSchatten(); liPersonen(); }
    liPersonenSchatten();
  }catch(e){ LI.fehler=String(e&&e.message||e); LI.an=false; if(LI.schatten) LI.schatten.visible=false; }
}

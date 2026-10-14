/* =========================================================
   Katalog-Seite (Fundament, 13.10.2026) - laeuft IM Spiel (Seitenkontext), wird von katalog.js geladen.
   Tom: "Ich will den Unterbau SEHEN, ohne das Spiel zu spielen." Sammelt Materialien, Texturen,
   Bauteile und die heute noch nicht im Baukasten stehenden wiederkehrenden Objekte und rendert
   Musterbilder in einer EIGENEN kleinen Studio-Szene (eigener Renderer, gleiche Belichtung/
   ToneMapping wie das Spiel). Nichts im Spiel wird veraendert (nur gelesen; Bilder aus Klonen).
   Alle Funktionen liefern JSON; Bilder als dataURL (webp), die katalog.js in Dateien schreibt.
   ========================================================= */
(function(){
'use strict';
const bb=window.__bb, MAT=bb.MAT, scene=bb.scene, bk=bb.bk, K=window.__K={};
const TEXSLOTS=['map','emissiveMap','alphaMap','bumpMap','normalMap','roughnessMap','metalnessMap','lightMap','aoMap','displacementMap'];
const rd=(v,n)=>{ const f=Math.pow(10,n===undefined?2:n); return Math.round(v*f)/f; };
const h2=v=>('0'+Math.max(0,Math.min(255,Math.round(v*255))).toString(16)).slice(-2);
const hexStr=c=>{ if(!c||!c.isColor) return null; const x=c.clone().convertLinearToSRGB(); return '#'+h2(x.r)+h2(x.g)+h2(x.b); };       /* Materialfarben sind linear */
const hexRoh=c=>c&&c.isColor?'#'+c.getHexString():null;

/* ---------- Studio ---------- */
let R=null, ENV=null;
function studio(){
  if(R) return R;
  const c=document.createElement('canvas'), g=bb.renderer;
  R=new THREE.WebGLRenderer({canvas:c,antialias:true,preserveDrawingBuffer:true});
  R.toneMapping=g.toneMapping; R.toneMappingExposure=g.toneMappingExposure; R.outputEncoding=g.outputEncoding;
  R.physicallyCorrectLights=g.physicallyCorrectLights; R.setPixelRatio(1);
  R.shadowMap.enabled=true; R.shadowMap.type=THREE.PCFSoftShadowMap;
  return R;
}
const BG=0xdde1e8;
function studioSzene(mitSchatten){
  const s=new THREE.Scene(); s.background=new THREE.Color(BG);
  /* wie das Spiel (Hemisphaere 0,88 + Sonne 1,65), nur neutral weiss */
  s.add(new THREE.HemisphereLight(0xf2f5ff,0x8b909a,0.95));
  const key=new THREE.DirectionalLight(0xfff6ea,1.55); key.name='key'; s.add(key); s.add(key.target);
  if(mitSchatten){ key.castShadow=true; key.shadow.mapSize.set(1024,1024); key.shadow.bias=-0.0006; key.shadow.normalBias=0.02; }
  const fill=new THREE.DirectionalLight(0xdfe8ff,0.45); fill.position.set(-4,2,3); s.add(fill);
  return s;
}
/* auf (w x h) verkleinert als webp-dataURL */
function ausgeben(w,h,q){
  const src=R.domElement, o=document.createElement('canvas'); o.width=w; o.height=h;
  const g=o.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(src,0,0,w,h);
  let u=o.toDataURL('image/webp',q||0.82); if(u.indexOf('image/webp')<0) u=o.toDataURL('image/jpeg',q||0.82);
  return u;
}

/* ---------- Sammeln: ein Durchlauf ueber die Szene ---------- */
function zonenIndex(){
  const m=new Map(); const Z=bb.ZONEN||{};
  for(const id in Z) for(const o of Z[id].obj) o.traverse(c=>{ if(!m.has(c)) m.set(c,id); });
  return m;
}
/* grobe Lage (Ersatz fuer Zonen, die nur gesperrte Bereiche kennen) - Weltkoordinaten des Spiels */
function bereich(x,z){
  if(Math.abs(x)>110||Math.abs(z)>110) return 'Stadt / Fernbereich';
  if(z>=7) return 'Strasse';
  if(x>=38) return 'Logistikzentrum Ost';
  if(z<-34||x<-62) return 'Hof / Aussenlager';
  if(x<=-26) return 'Halle West / Dock';
  if(z<-7&&x<=-8) return 'Lager';
  if(x>=8) return 'Laden Ost';
  return 'Laden';
}
function sammeln(){
  scene.updateMatrixWorld(true);
  const zm=zonenIndex(), L=[];
  scene.traverse(o=>{
    if(!o.isMesh) return;
    if(o.userData&&o.userData._bnd) return;                /* Laufzeit-Buendel: nur Kopie der Originale */
    let vis=true; for(let x=o;x;x=x.parent) if(!x.visible){ vis=false; break; }
    let bauteil=null, name=null;
    for(let x=o;x;x=x.parent){ if(!bauteil&&x.userData&&x.userData.bauteil) bauteil=x.userData.bauteil; if(!name&&x.name&&x.name!=='Wurzel') name=x.name; }
    const p=new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const g=o.geometry; let bx=null, c=p; if(g){ if(!g.boundingBox) g.computeBoundingBox(); if(g.boundingBox&&!g.boundingBox.isEmpty()){ bx=g.boundingBox.clone().applyMatrix4(o.matrixWorld); c=bx.getCenter(new THREE.Vector3()); } }
    L.push({o,vis,ms:Array.isArray(o.material)?o.material:[o.material],bauteil,name,own:o.userData.__own||null,call:o.userData.__call,
      x:c.x,y:c.y,z:c.z,bx,zone:zm.get(o)||null});
  });
  K.meshes=L; return L.length;
}
function label(m){
  if(m.bauteil) return {l:m.bauteil,art:'bauteil'};
  if(m.own) return {l:m.own,art:'baufunktion'};
  if(m.name) return {l:m.name,art:'name'};
  return {l:'(ohne Zuordnung)',art:'sonst'};
}
function zoneVon(m){ return m.zone||bereich(m.x,m.z); }
function trisVon(o){ const g=o.geometry; if(!g) return 0; const c=g.index?g.index.count:(g.attributes.position?g.attributes.position.count:0); return Math.round(c/3*(o.isInstancedMesh?o.count:1)); }
function zaehlen(map,k,n){ map.set(k,(map.get(k)||0)+(n===undefined?1:n)); }
function topN(map,n){ return [...map].sort((a,b)=>b[1]-a[1]).slice(0,n); }

/* ---------- Materialien ---------- */
function optenParsen(s){ const o={}; if(!s) return o; for(const kv of s.split('|')){ const i=kv.indexOf('='); if(i<0) continue; let v=kv.slice(i+1); v=v==='true'?true:v==='false'?false:(isNaN(+v)?v:+v); o[kv.slice(0,i)]=v; } return o; }
function wofuerVon(key,name,liste){
  /* ein anderer Agent ergaenzt 'wofuer' (REZEPT-Feld, Eintrag in liste() oder eigene Tabelle) - robust gegen Fehlen */
  try{ const e=liste&&liste.materialien&&liste.materialien.find(x=>x.name===key); if(e&&e.wofuer) return e.wofuer; }catch(x){}
  try{ const r=MAT.REZEPT&&MAT.REZEPT[name]; if(r&&r.wofuer) return r.wofuer; }catch(x){}
  try{ const w=MAT.WOFUER||MAT.wofuer; if(w&&typeof w==='object'&&w[name||key]) return w[name||key]; if(typeof w==='function'){ const v=w(name||key); if(v) return v; } }catch(x){}
  return null;
}
function matSig(m){
  const c=m.color?hexStr(m.color):'-', e=m.emissive&&m.emissive.getHex?'#'+m.emissive.getHexString():'-';
  const mp=TEXSLOTS.some(s=>m[s]);
  return [m.type,c,m.roughness!==undefined?rd(m.roughness):'-',m.metalness!==undefined?rd(m.metalness):'-',m.vertexColors?'vc':'',
    m.emissiveIntensity&&e!=='#000000'?e+'x'+rd(m.emissiveIntensity):'',m.transparent?'t'+rd(m.opacity):'',mp?'map':'',m.alphaTest?'at':''].join('|');
}
K.materialien=function(){
  sammeln();
  const liste=MAT.liste();                                  /* VOR jedem eigenen Abruf lesen (Zaehler) */
  const lib=new Map(), alle=new Map();                      /* Schluessel -> Material ; uuid -> {m, verw...} */
  const E=m=>{ let e=alle.get(m.uuid); if(!e){ e={m,meshes:0,sichtbar:0,verw:new Map(),zonen:new Map(),tris:0}; alle.set(m.uuid,e); } return e; };
  for(const mm of K.meshes){ const l=label(mm), zn=zoneVon(mm);
    for(const m of mm.ms){ if(!m) continue; const e=E(m); e.meshes++; if(mm.vis) e.sichtbar++; zaehlen(e.verw,l.art+'|'+l.l); zaehlen(e.zonen,zn); e.tris+=trisVon(mm.o)/mm.ms.length;
      if(m.userData&&m.userData.mat) lib.set(m.userData.mat,m); } }
  /* Bibliotheksschluessel ohne Mesh: aus dem Schluessel wieder holen (gleiches geteiltes Objekt) */
  const eintraege=[]; K.matObjs=[];
  const aufloesen=key=>{ const i=key.indexOf(':'), k=key.slice(0,i), r=key.slice(i+1);
    if(k==='get') return MAT.get(r); if(k==='vc') return MAT.vc(r);
    if(k==='std'||k==='basic'){ const p=r.split('|'), o=optenParsen(p.slice(1).join('|')); return k==='std'?MAT.std(parseInt(p[0],16),o):MAT.basic(parseInt(p[0],16),o); }
    if(k==='ober'&&MAT.ober){ const p=r.split('|'), o=optenParsen(p.slice(2).join('|')); return MAT.ober(p[0],p[1],Object.keys(o).length?o:undefined); }
    return null; };
  for(const x of liste.materialien){
    let m=lib.get(x.name); if(!m){ try{ m=aufloesen(x.name); }catch(e){ m=null; } }
    const i=x.name.indexOf(':'), art2=x.name.slice(0,i), name=x.name.slice(i+1);
    /* Felder, die die Bibliothek selbst mitliefert (wofuer, rezept, farbe, klasse ...), unveraendert uebernehmen */
    const extra=Object.assign({},x,{art:'bibliothek',kategorie:art2,schluessel:x.name,name:art2==='get'?name:(x.rezept||null),abrufe:x.abrufe,wofuer:wofuerVon(x.name,name,liste),objId:m?m.uuid:null}); delete extra.typ;
    if(m){ const e=alle.get(m.uuid)||{meshes:0,sichtbar:0,verw:new Map(),zonen:new Map(),tris:0};
      eintraege.push(eintrag(m,e,extra)); K.matObjs.push(m); alle.delete(m.uuid); }
    else { eintraege.push(Object.assign({typ:x.typ||null,hex:null,texturen:[],meshes:0,sichtbar:0,dreiecke:0,verwendung:[],verwendungGruppen:0,zonen:[],ohneObjekt:true},extra)); K.matObjs.push(null); }
  }
  const libAnz=eintraege.length;
  /* ausserhalb der Bibliothek (heute noch eigene Materialien): nach Signatur gruppiert */
  const sig=new Map();
  for(const e of alle.values()){ const m=e.m; if(m.userData&&m.userData.mat) continue; if(!m.isMaterial) continue;
    const s=matSig(m); let g=sig.get(s); if(!g){ g={m,e:{meshes:0,sichtbar:0,verw:new Map(),zonen:new Map(),tris:0},objekte:0,sig:s}; sig.set(s,g); }
    g.objekte++; g.e.meshes+=e.meshes; g.e.sichtbar+=e.sichtbar; g.e.tris+=e.tris; for(const [k,n] of e.verw) zaehlen(g.e.verw,k,n); for(const [k,n] of e.zonen) zaehlen(g.e.zonen,k,n); }
  const fremd=[...sig.values()].sort((a,b)=>b.e.meshes-a.e.meshes);
  for(const g of fremd){ const t=eintrag(g.m,g.e,{art:'fremd',kategorie:'eigen',schluessel:'sig:'+g.sig,name:null,abrufe:g.objekte,wofuer:null,objId:g.m.uuid}); t.signatur=g.sig; t.materialObjekte=g.objekte; eintraege.push(t); K.matObjs.push(g.m); }
  K.matListe=eintraege;
  return {bibliothek:libAnz,fremd:fremd.length,eigeneAbrufe:liste.eigene,geteilt:liste.geteilt,abrufe:liste.abrufe,gespart:liste.gespart,farben:liste.farben,rezepte:liste.rezepte,eintraege};
};
function eintrag(m,e,extra){
  const tex=[]; for(const s of TEXSLOTS) if(m[s]){ const im=m[s].image||{}; tex.push({slot:s,w:im.width||0,h:im.height||0,name:(m[s].userData&&(m[s].userData.mat||m[s].userData.__lab))||null}); }
  const o={typ:m.type,hex:m.color?hexStr(m.color):null,roughness:m.roughness!==undefined?rd(m.roughness):null,metalness:m.metalness!==undefined?rd(m.metalness):null,
    vertexfarben:!!m.vertexColors,transparent:!!m.transparent,opacity:rd(m.opacity),emissiv:m.emissive&&m.emissive.getHex&&m.emissive.getHex()?hexStr(m.emissive):null,
    emissivStaerke:m.emissive&&m.emissive.getHex&&m.emissive.getHex()?rd(m.emissiveIntensity):null,alphaTest:m.alphaTest||0,doppelseitig:m.side===THREE.DoubleSide,
    texturen:tex,meshes:e.meshes,sichtbar:e.sichtbar,dreiecke:Math.round(e.tris),
    verwendung:topN(e.verw,14).map(([k,n])=>{ const i=k.indexOf('|'); return {art:k.slice(0,i),name:k.slice(i+1),meshes:n}; }),
    verwendungGruppen:e.verw.size,zonen:topN(e.zonen,8).map(([k,n])=>({zone:k,meshes:n}))};
  return Object.assign(o,extra);
}
/* Musterbild: Kugel + gefaste Kachel, 160 x 100 */
let MS=null;
function matSzene(){
  if(MS) return MS; const s=studioSzene(false); s.background=new THREE.Color(0xe3e6ec);
  const cam=new THREE.PerspectiveCamera(30,1.6,0.1,20); cam.position.set(0,0.12,3.55); cam.lookAt(0,-0.02,0);
  const f=new THREE.DirectionalLight(0xffffff,0.55); f.position.set(0.2,0.3,3); s.add(f);
  MS={s,cam,a:null,b:null}; return MS;
}
function mitFarbe(geo,v){ const n=geo.attributes.position.count, a=new Float32Array(n*3).fill(v); geo.setAttribute('color',new THREE.BufferAttribute(a,3)); return geo; }
K.matBild=function(i){
  studio(); const M=matSzene(), m=K.matObjs[i]; if(!m) return null;
  const kugel=new THREE.SphereGeometry(0.62,48,32), kachel=bk.kasten(1.0,1.0,0.22,{fase:0.06,anteil:0.3,seg:3});
  /* Kachel: UVs 0..1 je Flaeche haben die Spielkacheln nicht immer - Kasten ohne uv -> planare uv ergaenzen */
  if(!kachel.attributes.uv){ const p=kachel.attributes.position, uv=new Float32Array(p.count*2); for(let k=0;k<p.count;k++){ uv[k*2]=p.getX(k)+0.5; uv[k*2+1]=p.getY(k)+0.5; } kachel.setAttribute('uv',new THREE.BufferAttribute(uv,2)); }
  if(m.vertexColors){ mitFarbe(kugel,0.72); mitFarbe(kachel,0.72); }
  const a=new THREE.Mesh(kugel,m), b=new THREE.Mesh(kachel,m);
  a.position.set(-0.78,0,0); b.position.set(0.82,0,0); b.rotation.set(-0.32,-0.5,0.05);
  /* Unterlage hinter durchsichtigen Teilen */
  const hint=new THREE.Mesh(new THREE.PlaneGeometry(6,3),new THREE.MeshBasicMaterial({color:0xcfd3da})); hint.position.z=-0.9; M.s.add(hint);
  M.s.add(a); M.s.add(b);
  let url=null;
  try{ R.setSize(320,200,false); R.render(M.s,M.cam); url=ausgeben(160,100,0.8); }catch(e){ url=null; }
  M.s.remove(a); M.s.remove(b); M.s.remove(hint); kugel.dispose(); kachel.dispose(); hint.geometry.dispose(); hint.material.dispose();
  return url;
};
K.matBilder=function(von,bis){ const o={}; for(let i=von;i<Math.min(bis,K.matObjs.length);i++) o[i]=K.matBild(i); return o; };

/* ---------- Texturen ---------- */
function pixel(t){
  const im=t.image; if(!im) return null;
  const w=im.width||im.videoWidth||0, h=im.height||im.videoHeight||0; if(!w||!h) return null;
  if(im.data&&im.data.length>=w*h*4&&!(im instanceof HTMLCanvasElement)) return {w,h,data:im.data};
  try{ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d',{willReadFrequently:true}); g.drawImage(im,0,0); return {w,h,data:g.getImageData(0,0,w,h).data}; }catch(e){ return null; }
}
function hash(p){
  const u=new Uint32Array(p.data.buffer,p.data.byteOffset,Math.floor(p.data.byteLength/4)); const n=u.length, step=n>1500000?7:1;
  let h=2166136261^p.w^(p.h<<11);
  for(let i=0;i<n;i+=step){ h^=u[i]; h=Math.imul(h,16777619); }
  return (h>>>0).toString(16)+'-'+p.w+'x'+p.h;
}
function thumb(t,max,q){
  const im=t.image; if(!im) return null; const w=im.width||0, h=im.height||0; if(!w||!h) return null;
  const s=Math.min(1,max/Math.max(w,h)), tw=Math.max(1,Math.round(w*s)), th=Math.max(1,Math.round(h*s));
  const c=document.createElement('canvas'); c.width=tw; c.height=th; const g=c.getContext('2d'); g.imageSmoothingQuality='high';
  /* Schachbrett hinter durchsichtigen Bildern */
  for(let y=0;y<th;y+=8) for(let x=0;x<tw;x+=8){ g.fillStyle=((x+y)/8)%2?'#cfd3da':'#e6e9ee'; g.fillRect(x,y,8,8); }
  try{
    if(im.data&&!(im instanceof HTMLCanvasElement)){ const c2=document.createElement('canvas'); c2.width=w; c2.height=h; c2.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(im.data.buffer?im.data:im.data),w,h),0,0); g.drawImage(c2,0,0,tw,th); }
    else g.drawImage(im,0,0,tw,th);
  }catch(e){ return null; }
  let u=c.toDataURL('image/webp',q||0.8); if(u.indexOf('image/webp')<0) u=c.toDataURL('image/jpeg',q||0.8); return u;
}
K.texturen=function(){
  if(!K.meshes) sammeln();
  const liste=MAT.liste();
  const T=new Map();                                       /* texture.uuid -> {t, mats:Set, verw:Map} */
  const E=t=>{ let e=T.get(t.uuid); if(!e){ e={t,mats:new Set(),slots:new Set(),verw:new Map(),meshes:0}; T.set(t.uuid,e); } return e; };
  const ausMat=(m,l)=>{
    for(const s of TEXSLOTS) if(m[s]&&m[s].isTexture){ const e=E(m[s]); e.mats.add(m.uuid); e.slots.add(s); if(l){ zaehlen(e.verw,l.art+'|'+l.l); e.meshes++; } }
    if(m.uniforms) for(const k in m.uniforms){ const v=m.uniforms[k]&&m.uniforms[k].value; if(v&&v.isTexture){ const e=E(v); e.mats.add(m.uuid); e.slots.add('uniform:'+k); if(l){ zaehlen(e.verw,l.art+'|'+l.l); e.meshes++; } } }
  };
  for(const mm of K.meshes){ const l=label(mm); for(const m of mm.ms) if(m) ausMat(m,l); }
  scene.traverse(o=>{ if((o.isPoints||o.isSprite||o.isLine)&&o.material){ const l={art:'sonst',l:o.isSprite?'Sprites':o.isPoints?'Punkte (Partikel)':'Linien'}; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m&&ausMat(m,l)); } });
  if(scene.background&&scene.background.isTexture){ const e=E(scene.background); e.slots.add('szene.background'); zaehlen(e.verw,'sonst|Himmel'); }
  /* geteilte MAT-Texturen auch ohne Nutzung im Graf */
  const matTex=[]; for(const x of liste.texturen){ let t=null; for(const e of T.values()) if(e.t.userData&&e.t.userData.mat===x.name){ t=e.t; break; } if(!t){ try{ t=MAT.tex(x.name); E(t); }catch(e){} } matTex.push(x.name); }
  const out=[]; K.texObjs=[];
  const gruppen=new Map();                                  /* gleicher Inhalt */
  for(const e of T.values()){ const t=e.t, im=t.image||{}, w=im.width||0, h=im.height||0; const p=pixel(t);
    const hs=p?hash(p):('leer-'+t.uuid); let g=gruppen.get(hs); if(!g){ g={hs,w,h,list:[]}; gruppen.set(hs,g); } g.list.push(e); }
  for(const g of gruppen.values()){
    const first=g.list[0], t=first.t, w=g.w, h=g.h;
    const mips=t.generateMipmaps&&t.minFilter!==THREE.LinearFilter&&t.minFilter!==THREE.NearestFilter;
    const mb=w*h*4/1048576, mbGpu=mb*(mips?1.333:1);
    const verw=new Map(), mats=new Set(), slots=new Set(); let meshes=0, lab=new Map(), mname=null;
    for(const e of g.list){ for(const [k,n] of e.verw) zaehlen(verw,k,n); e.mats.forEach(x=>mats.add(x)); e.slots.forEach(x=>slots.add(x)); meshes+=e.meshes;
      const ud=e.t.userData||{}; if(ud.__lab) zaehlen(lab,ud.__lab); if(ud.mat) mname=ud.mat; }
    const herkunft=mname?('MAT.tex(\''+mname+'\')'):(lab.size?topN(lab,3).map(x=>x[0]).join(', '):null);
    out.push({id:out.length,hash:g.hs,w,h,mb:rd(mb,3),mbGpu:rd(mbGpu,3),mipmaps:!!mips,anisotropie:t.anisotropy||1,farbraum:t.encoding===THREE.sRGBEncoding?'sRGB':'linear',
      wiederholung:t.wrapS===THREE.RepeatWrapping?'kachelt':'klemmt',
      bibliothek:mname,wofuer:(mname&&(liste.texturen.find(x=>x.name===mname)||{}).wofuer)||null,herkunft,herkunftArt:mname?'bibliothek':(lab.size?'baufunktion':'unbekannt'),texturObjekte:g.list.length,
      slots:[...slots],materialien:mats.size,meshes,
      verwendung:topN(verw,12).map(([k,n])=>{ const i=k.indexOf('|'); return {art:k.slice(0,i),name:k.slice(i+1),meshes:n}; }),verwendungGruppen:verw.size,
      typ:t.isCanvasTexture?'Canvas':(t.isDataTexture?'Daten':(t.image&&t.image.data?'ImageData':'Bild'))});
    K.texObjs.push(t);
  }
  /* Gruppen (Herkunft + Groesse), Dubletten */
  const grp=new Map();
  for(const o of out){ const k=(o.herkunft||'unbekannt')+' | '+o.w+'x'+o.h; let g=grp.get(k); if(!g){ g={herkunft:o.herkunft||'unbekannt',w:o.w,h:o.h,anzahl:0,texturObjekte:0,mb:0,mbGpu:0,beispiele:[]}; grp.set(k,g); }
    g.anzahl++; g.texturObjekte+=o.texturObjekte; g.mb+=o.mb; g.mbGpu+=o.mbGpu; if(g.beispiele.length<6) g.beispiele.push(o.id); }
  const gruppenL=[...grp.values()].map(g=>Object.assign(g,{mb:rd(g.mb,2),mbGpu:rd(g.mbGpu,2)})).sort((a,b)=>b.mbGpu-a.mbGpu);
  let objGes=0, gesMb=0, gesGpu=0; for(const o of out){ objGes+=o.texturObjekte; gesMb+=o.mb*o.texturObjekte; gesGpu+=o.mbGpu*o.texturObjekte; }
  K.texListe=out;
  return {einzigartig:out.length,texturObjekte:objGes,dubletten:objGes-out.length,rohMB:rd(gesMb,1),gpuMB:rd(gesGpu,1),matTexturen:matTex,gruppen:gruppenL,eintraege:out};
};
K.texBilder=function(von,bis){ const o={}; for(let i=von;i<Math.min(bis,K.texObjs.length);i++){ try{ o[i]=thumb(K.texObjs[i],128,0.8); }catch(e){ o[i]=null; } } return o; };

/* ---------- Isolierte Bilder von Objekten ---------- */
function effSichtbar(o){ for(let x=o;x;x=x.parent) if(!x.visible) return false; return true; }
function box6(b){ return [new THREE.Plane(new THREE.Vector3(1,0,0),-b.min.x),new THREE.Plane(new THREE.Vector3(-1,0,0),b.max.x),new THREE.Plane(new THREE.Vector3(0,1,0),-b.min.y),new THREE.Plane(new THREE.Vector3(0,-1,0),b.max.y),new THREE.Plane(new THREE.Vector3(0,0,1),-b.min.z),new THREE.Plane(new THREE.Vector3(0,0,-1),b.max.z)]; }
/* meshes: Spiel-Meshes (Quelle); opt: {w,h,blick (Grad um Y, 0 = von +z),hoehe (Grad),clip:Box3,kappe:true} -> dataURL */
K.iso=function(meshes,opt){
  opt=opt||{}; studio(); const W=opt.w||240, H=opt.h||180, S=2;
  const s=studioSzene(true), grp=new THREE.Group(); s.add(grp);
  let n=0;
  for(const o of meshes){
    const ms=Array.isArray(o.material)?o.material:[o.material]; if(ms.every(m=>!m||m.visible===false)) continue;
    const c=o.isInstancedMesh?new THREE.InstancedMesh(o.geometry,o.material,o.count):new THREE.Mesh(o.geometry,o.material);
    if(o.isInstancedMesh){ c.instanceMatrix=o.instanceMatrix; if(o.instanceColor) c.instanceColor=o.instanceColor; }
    o.updateWorldMatrix(true,false); c.matrixAutoUpdate=false; c.matrix.copy(o.matrixWorld); c.frustumCulled=false;
    const tr=ms.some(m=>m&&m.transparent); c.castShadow=!tr; c.receiveShadow=true; grp.add(c); n++;
  }
  if(!n){ return null; }
  grp.updateMatrixWorld(true);
  let box=new THREE.Box3(); grp.traverse(c=>{ if(c.isMesh){ if(!c.geometry.boundingBox) c.geometry.computeBoundingBox(); const b=c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld); box.union(b); } });
  if(opt.clip){ box=opt.clip.clone(); R.clippingPlanes=box6(box); } else R.clippingPlanes=[];
  const ctr=box.getCenter(new THREE.Vector3()), size=box.getSize(new THREE.Vector3()), rad=Math.max(0.4,size.length()/2);
  /* Boden */
  const fl=new THREE.Mesh(new THREE.CircleGeometry(rad*1.55,48),new THREE.MeshStandardMaterial({color:0xc2c7cf,roughness:1}));
  fl.rotation.x=-Math.PI/2; fl.position.set(ctr.x,box.min.y-0.002,ctr.z); fl.receiveShadow=true; s.add(fl);
  /* Kamera: schraeg von vorn, Abstand so, dass alle Ecken im Bild sind */
  const yaw=(opt.blick||0)*Math.PI/180, el=(opt.hoehe===undefined?20:opt.hoehe)*Math.PI/180;
  const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(el)+0.42*Math.cos(yaw)*Math.cos(el),Math.sin(el),Math.cos(yaw)*Math.cos(el)-0.42*Math.sin(yaw)*Math.cos(el)).normalize();
  const cam=new THREE.PerspectiveCamera(opt.fov||28,W/H,0.02,rad*60);
  const corners=[]; for(const x of [box.min.x,box.max.x]) for(const y of [box.min.y,box.max.y]) for(const z of [box.min.z,box.max.z]) corners.push(new THREE.Vector3(x,y,z));
  let lo=rad*0.5, hi=rad*40, d=hi;
  for(let it=0;it<30;it++){ const mid=(lo+hi)/2; cam.position.copy(ctr).addScaledVector(dir,mid); cam.lookAt(ctr); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    let ok=true; for(const c of corners){ const p=c.clone().project(cam); if(Math.abs(p.x)>0.93||Math.abs(p.y)>0.93||p.z>1){ ok=false; break; } }
    if(ok){ hi=mid; d=mid; } else lo=mid; }
  cam.position.copy(ctr).addScaledVector(dir,d); cam.lookAt(ctr); cam.near=Math.max(0.02,d-rad*2); cam.far=d+rad*3; cam.updateProjectionMatrix();
  const key=s.getObjectByName('key'); key.position.copy(ctr).add(new THREE.Vector3(0.7,1.1,0.8).multiplyScalar(rad*3)); key.target.position.copy(ctr);
  const sc=key.shadow.camera; sc.left=-rad*1.6; sc.right=rad*1.6; sc.top=rad*1.6; sc.bottom=-rad*1.6; sc.near=rad*0.5; sc.far=rad*8; sc.updateProjectionMatrix();
  let url=null;
  try{ R.setSize(W*S,H*S,false); R.render(s,cam); url=ausgeben(W,H,opt.q||0.82); }catch(e){ url=null; }
  R.clippingPlanes=[];
  grp.traverse(c=>{ if(c.isInstancedMesh){ c.instanceMatrix=null; } }); fl.geometry.dispose(); fl.material.dispose();
  return url;
};
function bboxVon(meshes){ const b=new THREE.Box3(); for(const o of meshes){ o.updateWorldMatrix(true,false); const g=o.geometry; if(!g) continue; if(!g.boundingBox) g.computeBoundingBox(); b.union(g.boundingBox.clone().applyMatrix4(o.matrixWorld)); } return b; }
function bbInfo(b){ const s=b.getSize(new THREE.Vector3()), c=b.getCenter(new THREE.Vector3()); return {b:rd(s.x),h:rd(s.y),t:rd(s.z),x:rd(c.x),y:rd(c.y),z:rd(c.z)}; }
K.bboxVon=bboxVon;
/* dichtester 8-m-Ausschnitt einer Sammelgeometrie (fuer ganze-Stadt-Meshes): Rasterzelle mit den meisten Ecken */
function dichtesterAusschnitt(meshes,kante){
  const cnt=new Map(); let best=null, bn=0; const v=new THREE.Vector3(), ys=new Map();
  for(const o of meshes){ const g=o.geometry; if(!g||!g.attributes.position) continue; const p=g.attributes.position; const step=Math.max(1,Math.floor(p.count/60000)); o.updateWorldMatrix(true,false);
    for(let i=0;i<p.count;i+=step){ v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld); const k=Math.floor(v.x/kante)+','+Math.floor(v.z/kante); const n=(cnt.get(k)||0)+1; cnt.set(k,n); const y=ys.get(k)||[1e9,-1e9]; if(v.y<y[0]) y[0]=v.y; if(v.y>y[1]) y[1]=v.y; ys.set(k,y); if(n>bn){ bn=n; best=k; } } }
  if(!best) return null; const [ix,iz]=best.split(',').map(Number), y=ys.get(best);
  return new THREE.Box3(new THREE.Vector3(ix*kante,Math.min(y[0],0)-0.05,iz*kante),new THREE.Vector3((ix+1)*kante,Math.max(y[1],0.5)+0.05,(iz+1)*kante));
}
K.dichtester=dichtesterAusschnitt;

/* ---------- Bauteile (userData.bauteil) ---------- */
K.bauteile=function(){
  if(!K.meshes) sammeln();
  const art=new Map();                                     /* bauteil -> {inst: Map(key -> meshes[])} */
  for(const mm of K.meshes){ if(!mm.bauteil) continue;
    /* Instanz = Meshes gleicher Art im selben Elternknoten (Sammler -> ein Mesh je Klasse); an der Szene: je Fundort-Cluster */
    const par=mm.o.parent; const key=(par&&par!==scene?par.uuid:'szene');
    let a=art.get(mm.bauteil); if(!a){ a={name:mm.bauteil,inst:new Map()}; art.set(mm.bauteil,a); }
    let i=a.inst.get(key); if(!i){ i={meshes:[],par:par}; a.inst.set(key,i); } i.meshes.push(mm); }
  const out=[]; K.btObjs=[];
  const liste=MAT.liste();
  for(const a of art.values()){
    const insts=[];
    for(const i of a.inst.values()){
      /* an der Szene haengende Sammler-Meshes: je Klasse ein Mesh, alle zusammen = eine (ggf. ortsuebergreifende) Instanz */
      const ms=i.meshes.map(x=>x.o); const bx=bboxVon(ms); const info=bbInfo(bx);
      const klassen=[...new Set(i.meshes.map(x=>x.o.userData.klasse).filter(Boolean))];
      const mats=new Set(); i.meshes.forEach(x=>x.ms.forEach(m=>m&&mats.add(m.userData&&m.userData.mat?m.userData.mat:matSig(m))));
      const tris=ms.reduce((s,o)=>s+trisVon(o),0);
      insts.push({meshes:ms.length,dreiecke:tris,groesse:info,zone:zoneVon(i.meshes[0]),klassen,materialien:[...mats].slice(0,12),materialAnzahl:mats.size,
        sichtbar:i.meshes.some(x=>x.vis),ms,bx});
    }
    insts.sort((p,q)=>q.dreiecke-p.dreiecke);
    /* Varianten: gleiche Groesse (5 cm gerundet) und gleiche Dreieckszahl */
    const var_=new Map(); insts.forEach((x,ix)=>{ const k=[rd(x.groesse.b,1),rd(x.groesse.h,1),rd(x.groesse.t,1),x.dreiecke].join('x'); let v=var_.get(k); if(!v){ v={schluessel:k,anzahl:0,beispiel:ix,groesse:x.groesse,dreiecke:x.dreiecke,klassen:x.klassen,meshes:x.meshes}; var_.set(k,v); } v.anzahl++; });
    const idx=out.length;
    K.btObjs.push(insts);
    out.push({id:idx,name:a.name,instanzen:insts.length,meshesGesamt:insts.reduce((s,x)=>s+x.meshes,0),dreieckeGesamt:insts.reduce((s,x)=>s+x.dreiecke,0),
      varianten:[...var_.values()].slice(0,12).map(v=>({anzahl:v.anzahl,beispiel:v.beispiel,groesse:v.groesse,dreiecke:v.dreiecke,klassen:v.klassen,meshes:v.meshes})),varianteAnzahl:var_.size,
      fundorte:insts.slice(0,30).map((x,ix)=>({instanz:ix,pos:{x:x.groesse.x,y:x.groesse.y,z:x.groesse.z},groesse:x.groesse,zone:x.zone,meshes:x.meshes,dreiecke:x.dreiecke,klassen:x.klassen,materialien:x.materialien,sichtbar:x.sichtbar}))});
  }
  K.btListe=out; return {arten:out.length,eintraege:out};
};
/* Bild einer Bauteil-Instanz; sehr grosse (ortsuebergreifende) Sammler werden auf den dichtesten Ausschnitt gekappt */
/* unmarkierte Meshes derselben Baufunktion innerhalb der Huelle (z. B. Torblatt neben dem markierten Rahmen) */
function umfeld(ms,tol){
  const set=new Set(ms), owns=new Set(); for(const mm of K.meshes) if(set.has(mm.o)&&mm.own) owns.add(mm.own);
  const b=bboxVon(ms).expandByScalar(tol||0.3);
  for(const mm of K.meshes){ if(set.has(mm.o)||!mm.vis||!mm.bx) continue; if(owns.size&&!owns.has(mm.own)) continue; if(b.containsBox(mm.bx)) set.add(mm.o); }
  return [...set];
}
K.btBild=function(artIx,instIx,opt){
  const x=K.btObjs[artIx][instIx]; if(!x) return null; opt=Object.assign({},opt||{});
  const gr=x.groesse; let ms=x.ms;
  if(Math.max(gr.b,gr.t)>40){ const c=dichtesterAusschnitt(x.ms,10); if(c){ opt.clip=c; ms=x.ms.concat(K.meshes.filter(mm=>mm.vis&&mm.bx&&mm.bx.intersectsBox(c)&&x.ms.indexOf(mm.o)<0&&(mm.own===K.meshes.find(q=>q.o===x.ms[0]).own)).map(mm=>mm.o)); } }
  else ms=umfeld(x.ms,0.3);
  return K.iso(ms,opt);
};

/* ---------- Cluster: zusammenhaengende Meshes (Boxen beruehren sich) einer Baufunktion ---------- */
function cluster(list,tol){
  tol=tol===undefined?0.05:tol; const n=list.length, par=list.map((_,i)=>i);
  const f=i=>{ while(par[i]!==i){ par[i]=par[par[i]]; i=par[i]; } return i; };
  const bx=list.map(m=>m.bx?m.bx.clone().expandByScalar(tol):null);
  for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) if(bx[i]&&bx[j]&&bx[i].intersectsBox(bx[j])){ const a=f(i), b=f(j); if(a!==b) par[a]=b; }
  const g=new Map(); list.forEach((m,i)=>{ const r=f(i); (g.get(r)||g.set(r,[]).get(r)).push(m); });
  return [...g.values()].sort((a,b)=>b.length-a.length);
}
K.cluster=cluster;
function inBox(m,b){ return m.bx&&b.containsPoint(m.bx.getCenter(new THREE.Vector3())); }
K.inBox=inBox;
/* Instanzen einer Baufunktion: je Eltern-Gruppe ein Cluster (Gruppe = ein Objekt); lose Meshes an der Szene werden nach Naehe geclustert */
function instanzen(own,tol,filter){
  if(!K.meshes) sammeln();
  const owns=Array.isArray(own)?own:null, L=K.meshes.filter(m=>(owns?owns.indexOf(m.own)>=0:m.own===own)&&m.vis&&(!filter||filter(m))), grp=new Map(), lose=[];
  if(owns) return cluster(L,tol===undefined?0.3:tol);
  for(const m of L){ const p=m.o.parent; if(p&&p!==scene){ (grp.get(p)||grp.set(p,[]).get(p)).push(m); } else lose.push(m); }
  return [...grp.values()].concat(cluster(lose,tol===undefined?0.05:tol)).sort((a,b)=>b.length-a.length);
}
K.instanzen=instanzen;
K.dbg=function(own,tol,filter,max){
  const C=instanzen(own,tol,filter).slice(0,max||24), o={}, info=[];
  C.forEach((c,i)=>{ const b=new THREE.Box3(); c.forEach(m=>b.union(m.bx)); const z=bbInfo(b); info.push(i+': n='+c.length+' '+[z.b,z.h,z.t].join('x')+' @'+[z.x,z.y,z.z].join(',')); o[i]=K.iso(c.map(m=>m.o),{w:200,h:150}); });
  return {info,bilder:o};
};

/* ---------- Vorher-Katalog: wiederkehrende Objekte, die heute NICHT im Baukasten stehen ----------
   Tom 13.10.: "so sieht ein Rolltor aus, so die Fenster, Schiebetueren, Kassen ..." - zeigt die heutige
   Uneinheitlichkeit (Vorher-Bild fuer die naechsten Schritte). Jede Variante = ein Eintrag mit Auswahl:
     own:'name'      Meshes dieser Baufunktion (__own aus dem Zaehl-Wrapper), je Eltern-Gruppe/Naehe eine Instanz
     box:[x0,y0,z0,x1,y1,z1]  Ausschnitt der Welt (nur Meshes, deren Mitte darin liegt; Bild wird auf die Box beschnitten)
     minN / nth / filter      Instanz nach Groesse waehlen
     erzeuge:()=>meshes       baut ein Beispiel im Spiel nach (Regale: createShelf/createRack)
   Neue Bauteile des Baukastens erscheinen automatisch unter 'Bauteile'; steht ein Objekt hier und spaeter im Baukasten,
   wird sein Eintrag hier entfernt (und im Katalog als 'umgestellt' vermerkt). */
const B3=(a)=>new THREE.Box3(new THREE.Vector3(a[0],a[1],a[2]),new THREE.Vector3(a[3],a[4],a[5]));
const NEUE=[];                                        /* nachgebaute Beispiele */
function neuBauen(fn){ const vor=new Set(); scene.traverse(o=>vor.add(o)); fn(); scene.updateMatrixWorld(true); const L=[]; scene.traverse(o=>{ if(o.isMesh&&!vor.has(o)&&!(o.userData&&o.userData._bnd)) L.push(o); }); return L; }
const V1=bb.V1;
const VORHER=[
  /* ---- Tore und Tueren ---- */
  {kat:'Tore & Türen',id:'tor-r1',titel:'R1 Basisrampe – Sektionaltor',baut:'buildTor',datei:'05g-dock.js',blick:90,sel:{own:'buildTor'}},
  {kat:'Tore & Türen',id:'tor-r25-aussen',titel:'R2–R5 Westhalle – Sektionaltor, Außenseite',baut:'westTor',datei:'05h-ausbau.js',blick:180,sel:{owns:['westTor','westTorInnen']}},
  {kat:'Tore & Türen',id:'tor-r25-innen',titel:'R2–R5 Westhalle – dasselbe Tor, Innenseite',baut:'westTorInnen',datei:'05h-ausbau.js',blick:0,sel:{owns:['westTor','westTorInnen']}},
  {kat:'Tore & Türen',id:'tor-v1',titel:'V1 Versandhof – Rolltor',baut:'buildVersandhof',datei:'11e-palette.js',blick:180,sel:{own:'buildVersandhof',box:[V1.x-V1.w/2-0.7,0,V1.wz-0.9,V1.x+V1.w/2+0.7,4.8,V1.wz+0.5]}},
  {kat:'Tore & Türen',id:'tor-ost',titel:'Logistikzentrum Ost – Doppeltor im Zaun',baut:'buildLogistik',datei:'05h-ausbau.js',blick:-90,sel:{own:'buildLogistik',nth:1}},
  {kat:'Tore & Türen',id:'tor-hof',titel:'Schiebetor Hof (Dock)',baut:'buildDock',datei:'05g-dock.js',blick:-90,sel:{own:'buildDock',box:[-34.5,0,0.8,-33.2,2.6,5.6]}},
  {kat:'Tore & Türen',id:'schiebetuer',titel:'Schiebetür Haupteingang / Eingang 2',baut:'buildSchiebetuer',datei:'05f-facade.js',blick:0,sel:{own:'buildSchiebetuer'}},
  {kat:'Tore & Türen',id:'eingang2',titel:'Eingang 2 – Achse mit Festfeldern',baut:'eingangsAchse',datei:'05l-eingang2.js',blick:0,sel:{own:'eingangsAchse'}},
  {kat:'Tore & Türen',id:'streifenvorhang',titel:'Streifenvorhang',baut:'streifenvorhang',datei:'05h-ausbau.js',blick:90,sel:{own:'streifenvorhang',minN:2}},
  /* ---- Fenster ---- */
  {kat:'Fenster',id:'fenster-schau',titel:'Schaufenster Laden (Front)',baut:'buildWorld / wall',datei:'05c-buildworld.js',blick:0,sel:{owns:['wall','buildWorld','buildFacade'],box:[-7.4,0.5,5.2,-1.8,2.7,6.8],gross:true}},
  {kat:'Fenster',id:'fenster-lager',titel:'Lager-Fensterwand (Doppelfenster)',baut:'lagerFensterWand',datei:'05h-ausbau.js',blick:0,sel:{own:'lagerFensterWand',minN:10}},
  {kat:'Fenster',id:'fenster-nachbar',titel:'Nachbar-Fassade (Fensterfeld)',baut:'nachbarFassade',datei:'05f-facade.js',blick:0,sel:{owns:['wall','nachbarFassade','buildWorld'],box:[9,0.5,5.2,13.6,2.8,6.8],gross:true}},
  {kat:'Fenster',id:'fenster-laeden',titel:'Läden gegenüber (Schaufenster-Innenraum)',baut:'ladenFront',datei:'05e2-laeden-innen.js',blick:180,sel:{own:'ladenFront'}},
  /* ---- Regale (heute nachgebaut, neues Spiel hat keine) ---- */
  {kat:'Regale',id:'shelf',titel:'Ladenregal',baut:'createShelf',datei:'06-fixtures.js',blick:0,erzeugeShelf:true},
  {kat:'Regale',id:'rack',titel:'Lagerregal',baut:'createRack',datei:'06-fixtures.js',blick:0,erzeugeRack:true},
  {kat:'Regale',id:'packwagen',titel:'Packwagen (Rollwagen, Packstation)',baut:'buildPackstation',datei:'11c-versand.js / 11d-packmaterial.js',blick:0,sel:{own:'buildPackstation',nth:1}},
  {kat:'Kassen',id:'packstation',titel:'Packstation komplett (Tisch, Regal, Gitterkäfig)',baut:'buildPackstation',datei:'11c-versand.js',blick:0,sel:{own:'buildPackstation',nth:0}},
  /* ---- Kassen ---- */
  {kat:'Kassen',id:'kasse-platz',titel:'Kassenplatz (Kasse, Band)',baut:'buildCheckout',datei:'06-fixtures.js',blick:0,sel:{own:'buildCheckout'}},
  {kat:'Kassen',id:'kasse-pult',titel:'Schreibtisch (Büro)',baut:'buildDesk',datei:'06-fixtures.js',blick:0,sel:{own:'buildDesk',nth:1}},
  /* ---- Lampen ---- */
  {kat:'Lampen',id:'lampe-decke',titel:'Deckenleuchte Laden',baut:'buildWorld',datei:'05c-buildworld.js',blick:0,hoehe:-30,sel:{own:'buildWorld',box:[-7.1,3.5,-4.2,-5.3,3.75,-3.0]}},
  {kat:'Lampen',id:'lampe-raster',titel:'Leuchtenraster Halle (Zonen)',baut:'leuchtenRaster',datei:'05h-ausbau.js',blick:0,hoehe:-30,sel:{own:'leuchtenRaster',nth:3,ausschnitt:7}},
  {kat:'Lampen',id:'lampe-mast',titel:'Hofmast mit Strahlern',baut:'hofMast',datei:'05h-ausbau.js',blick:0,sel:{own:'hofMast'}},
  {kat:'Lampen',id:'lampe-strasse',titel:'Straßenlampe',baut:'strassenlampe',datei:'05e-street.js',blick:0,sel:{owns:['strassenlampe','lampTeile']}},
  {kat:'Lampen',id:'lampe-strahler',titel:'Wandstrahler (Dock)',baut:'buildDock',datei:'05g-dock.js',blick:0,sel:{own:'buildDock',box:[-21.2,2.6,-5.4,-19.9,3.4,-4.4]}},
  {kat:'Lampen',id:'lampe-fassade',titel:'Fassadenstrahler',baut:'buildFacade',datei:'05f-facade.js',blick:0,sel:{own:'buildFacade',box:[-2.65,6.6,6.2,-2.15,7.1,6.7]}},
  /* Zaeune, Poller: seit 14.10. im Baukasten (bk.zaun, bk.poller, bk.anfahrschutz, bk.absperrung) - erscheinen unter den Bauteilen */
  /* ---- Paletten ---- */
  {kat:'Paletten & Ladung',id:'palette-stapel',titel:'Palettenstapel (Hof, Holz #8e7550)',baut:'palettenStapel',datei:'05h-ausbau.js',blick:0,sel:{own:'palettenStapel'}}
];
K.VORHER=VORHER;
const _v3=new THREE.Vector3();
/* Box-Auswahl: Meshes, deren Mitte in der Box liegt (gross:true = alles, was die Box schneidet, dann wird auf die Box beschnitten) */
function boxAuswahl(s){
  const b=B3(s.box), owns=s.owns||(s.own?[s.own]:null);
  return K.meshes.filter(m=>{ if(!m.vis||!m.bx) return false; if(owns&&owns.indexOf(m.own)<0) return false;
    const sz=m.bx.getSize(_v3); if(sz.length()>200) return false;                      /* Himmel, Gelaende */
    if(!s.boden&&sz.y<0.15&&Math.max(sz.x,sz.z)>3) return false;                        /* Bodenflaechen/Markierungen */
    return s.gross?m.bx.intersectsBox(b):b.containsPoint(m.bx.getCenter(_v3)); });
}
/* liefert [{ms,clip?,anzahl,zone}] Instanzen einer Variante */
function vorherInstanzen(v){
  const s=v.sel||{};
  if(s.box){ const L=boxAuswahl(s); return L.length?[{ms:L.map(m=>m.o),clip:s.gross?B3(s.box):null,anzahl:1}]:[]; }
  let I=instanzen(s.owns||s.own,s.tol);
  if(s.minN) I=I.filter(c=>c.length>=s.minN);
  const n=I.length; if(s.nth!==undefined&&!s.minN) I=I[s.nth]?[I[s.nth]]:[];
  return I.map(c=>({ms:c.map(m=>m.o),anzahl:s.nth!==undefined&&!s.minN?1:n,zone:zoneVon(c[0]),c}));
}
function ausschnittUm(ms,kante){ const b=bboxVon(ms), c=b.getCenter(new THREE.Vector3()); return new THREE.Box3(new THREE.Vector3(c.x-kante/2,b.min.y-0.05,c.z-kante/2),new THREE.Vector3(c.x+kante/2,b.max.y+0.05,c.z+kante/2)); }
K.vorher=function(){
  if(!K.meshes) sammeln();
  const out=[]; K.vObjs=[];
  for(const v of VORHER){
    const e={id:v.id,kat:v.kat,titel:v.titel,baufunktion:v.baut,datei:v.datei,varianten:[]};
    if(v.erzeugeShelf||v.erzeugeRack){
      const KIND=v.erzeugeShelf?bb.SHELFKIND:bb.RACKKIND;
      for(const kind of Object.keys(KIND)){
        let L=[]; try{ L=neuBauen(()=>{ if(v.erzeugeShelf) bb.createShelf(bb.shelves.length,{kind}); else bb.createRack(bb.racks.length,{kind}); }); }catch(x){ L=[]; }
        if(!L.length) continue; const bx=bboxVon(L), z=bbInfo(bx), tris=L.reduce((s,o)=>s+trisVon(o),0);
        let kat=v.kat, titel=(v.erzeugeShelf?'Regal ':'Lagerregal ')+kind;
        if(v.erzeugeShelf&&kind==='kasse'){ kat='Kassen'; titel='Kassenregal (kind=kasse)'; }
        else if(v.erzeugeShelf&&/^gitter/.test(kind)){ kat='Paletten & Ladung'; titel='Gitterbox ('+kind+')'; }
        else if(v.erzeugeShelf&&/^tisch/.test(kind)){ titel='Tisch ('+kind+')'; }
        const ver={kind,titel,groesse:z,meshes:L.length,dreiecke:tris,anzahl:null,nachgebaut:true,zone:null,kat};
        K.vObjs.push({ms:L,blick:v.blick,hoehe:v.hoehe}); ver.bildIx=K.vObjs.length-1; (e.nachKat||(e.nachKat=[])).push(ver); e.varianten.push(ver);
      }
      out.push(e); continue;
    }
    const I=vorherInstanzen(v)||[];
    I.slice(0,1).forEach(x=>{ const bx=bboxVon(x.ms), z=bbInfo(bx), tris=x.ms.reduce((s,o)=>s+trisVon(o),0);
      const mats=new Set(); x.ms.forEach(o=>(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m&&mats.add(m.uuid)));
      const texs=new Set(); x.ms.forEach(o=>(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m&&TEXSLOTS.forEach(sl=>{ if(m[sl]) texs.add(m[sl].uuid); })));
      const ver={titel:v.titel,groesse:z,meshes:x.ms.length,dreiecke:tris,materialien:mats.size,texturen:texs.size,anzahl:x.anzahl,zone:x.zone||bereich(z.x,z.z),nachgebaut:false,kat:v.kat};
      let clip=x.clip; if(!clip&&v.sel&&v.sel.ausschnitt) clip=dichtesterAusschnitt(x.ms,v.sel.ausschnitt); if(!clip&&Math.max(z.b,z.t)>20) clip=dichtesterAusschnitt(x.ms,8);
      K.vObjs.push({ms:x.ms,blick:v.blick,hoehe:v.hoehe,clip}); ver.bildIx=K.vObjs.length-1; e.varianten.push(ver); });
    e.fehlt=I.length===0; out.push(e);
  }
  K.vListe=out; return {eintraege:out};
};
K.vBild=function(i){ const o=K.vObjs[i]; if(!o) return null; return K.iso(o.ms,{blick:o.blick,hoehe:o.hoehe,clip:o.clip}); };
K.vBilder=function(a,b){ const o={}; for(let i=a;i<Math.min(b,K.vObjs.length);i++){ try{ o[i]=K.vBild(i); }catch(e){ o[i]=null; } } return o; };

/* ---------- Verpackungen: Versandkarton je Produkt (kartonMat, 256x256 je Sorte) als Kontaktbogen ---------- */
K.kartons=function(zelle,spalten){
  zelle=zelle||64; spalten=spalten||16; const km=bb.kartonMat||{}, keys=Object.keys(km).filter(k=>km[k]&&km[k].map&&km[k].map.image);
  if(!keys.length) return {anzahl:0,sheet:null,zellen:[]};
  const zeilen=Math.ceil(keys.length/spalten), c=document.createElement('canvas'); c.width=spalten*zelle; c.height=zeilen*zelle; const g=c.getContext('2d'); g.fillStyle='#dde1e8'; g.fillRect(0,0,c.width,c.height);
  const hs=new Map(); const zellen=[];
  keys.forEach((k,i)=>{ const t=km[k].map, im=t.image; try{ g.drawImage(im,(i%spalten)*zelle,Math.floor(i/spalten)*zelle,zelle,zelle); }catch(e){}
    const p=pixel(t), h=p?hash(p):null; hs.set(h,(hs.get(h)||0)+1);
    let name=null; try{ const q=bb.pools&&bb.pools[k]; name=q&&(q.name||q.label)||null; }catch(e){}
    zellen.push({i,key:k,name,w:im.width,h:im.height,hash:h,herkunft:(t.userData&&t.userData.__lab)||null}); });
  let u=c.toDataURL('image/webp',0.8); if(u.indexOf('image/webp')<0) u=c.toDataURL('image/jpeg',0.8);
  const w=keys[0]&&km[keys[0]].map.image.width||256, mb=keys.length*w*w*4/1048576;
  return {anzahl:keys.length,spalten,zelle,sheet:u,zellen,verschiedeneBilder:hs.size,rohMB:rd(mb,1),gpuMB:rd(mb*1.333,1)};
};
})();

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rand=(a,b)=>a+Math.random()*(b-a);
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const eur=v=>(Math.round(v*100)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
const r2=v=>Math.round(v*100)/100;
const $=id=>document.getElementById(id);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const COARSE=!!(window.matchMedia&&matchMedia('(pointer: coarse)').matches);
const HIQ=!COARSE;
/* Grafikstufe (30.09., Tom: "laggt stark auf meinem alten Laptop und PC").
   Bisher lief jeder PC in der hoechsten Stufe. Jetzt: 'hoch' | 'mittel' |
   'niedrig', gewaehlt im Pausenmenue, oder 'auto': startet mit der zuletzt
   automatisch gefundenen Stufe und schaltet herunter, wenn die Bildrate
   laenger unter 28 faellt (20-loop, gfxMessen). */
/* 07.10. (Tom: auf "Niedrig" nur 10-11 Bilder/s am schwachen PC): darunter gibt es "Ultra Low" -
   alles aufs Minimum, nur Zahlen und Verzicht: halbe Aufloesung, keine Schattenkarte (auch nicht im
   Shader), nur ein Innenlicht, einfache Materialien (Lambert statt PBR), kurze Sichtweite, keine
   Stadt, wenig Funken. Schatten und Materialien stehen beim Laden fest - ein Wechsel von und nach
   Ultra Low laedt das Spiel neu. */
const GFX_STUFEN=['ultralow','niedrig','mittel','hoch','max','ultra','extrem'];
/* Rang ohne Ultra Low: niedrig=0, mittel=1, hoch=2, max=3 ... (so zaehlten die Vergleiche vorher) */
function gfxRang(st){ return GFX_STUFEN.indexOf(st)-1; }
const gfxNiedrig=st=>st==='niedrig'||st==='ultralow';
/* 03.10. (Tom: "Maximum, dann noch Ultra und Ultra Extrem - was ist
   moeglich"): drei Stufen ueber Hoch, nur von Hand waehlbar (die
   Automatik bleibt bei hoechstens Hoch). Je Stufe: Pixeldichte (px:
   Mindestwert, pxMax: Obergrenze - ueber 1 heisst Supersampling auf
   normalen Bildschirmen), Kantenglaettung (ms), Schattenkarte (sch, rad),
   Texturschaerfe (tex Faktor, cap Obergrenze je Druckbogen, ani
   Anisotropie), Feuerwerksfunken (qual), Leuchteffekt-Aufloesung (blur).
   Texturen und Funkenpuffer entstehen beim Laden - dafuer zaehlt die
   beim Start gewaehlte Stufe. */
const GFX_PROFIL={
  ultralow:{px:0,pxMax:0.5,ms:0,sch:256,rad:1,tex:0.5,cap:512,ani:1,qual:0.25,blur:4},
  niedrig:{px:0,pxMax:0.75,ms:0,sch:512,rad:1.2,tex:1,cap:1120,ani:4,qual:0.55,blur:4},
  mittel:{px:0,pxMax:1,ms:2,sch:1024,rad:1.2,tex:1,cap:1120,ani:4,qual:0.8,blur:4},
  hoch:{px:0,pxMax:2,ms:4,sch:2048,rad:2.2,tex:1,cap:1120,ani:4,qual:1,blur:4},
  max:{px:1.5,pxMax:2,ms:8,sch:4096,rad:2.6,tex:1.5,cap:1700,ani:8,qual:1.25,blur:3},
  ultra:{px:2,pxMax:2.5,ms:8,sch:4096,rad:3,tex:2,cap:2300,ani:16,qual:1.5,blur:2},
  extrem:{px:2.5,pxMax:3,ms:16,sch:8192,rad:3.2,tex:2.5,cap:3000,ani:16,qual:1.9,blur:2}};
const GFX_NAME={ultralow:'Ultra Low',niedrig:'Niedrig',mittel:'Mittel',hoch:'Hoch',max:'Maximum',ultra:'Ultra',extrem:'Ultra Extrem'};
let GFX_WAHL='auto', GFX='hoch';
try{ GFX_WAHL=localStorage.getItem('bb_gfx')||'auto'; GFX=GFX_WAHL==='auto'?(localStorage.getItem('bb_gfx_auto')||'hoch'):GFX_WAHL; }catch(e){}
if(GFX_WAHL!=='auto'&&GFX_STUFEN.indexOf(GFX_WAHL)<0) GFX_WAHL='auto';
if(GFX_STUFEN.indexOf(GFX)<0) GFX='hoch';
/* Partikelmenge je Stufe (QUAL in 14-fireworks) */
const GFX_QUAL={}; for(const k in GFX_PROFIL) GFX_QUAL[k]=GFX_PROFIL[k].qual;
/* beim Laden festgelegt: Texturschaerfe und Anisotropie der Startstufe */
const GFX_START=GFX_PROFIL[GFX]||GFX_PROFIL.hoch;
if(COARSE) document.body.classList.add('coarse');
const KEY='boellerbude_v3';
/* Ultra Low: einfache Materialien. Lambert statt PBR - ohne Glanz, Relief und Umgebungsbild; Farbe,
   Bild, Leuchtfarbe, Transparenz und Vertexfarben bleiben. */
if(GFX==='ultralow'&&THREE.MeshLambertMaterial&&!THREE.__lambertStd){
  const WEG=['roughness','metalness','roughnessMap','metalnessMap','bumpMap','bumpScale','normalMap','normalScale','envMapIntensity','displacementMap','displacementScale','displacementBias','flatShading','clearcoat','clearcoatRoughness','transmission','thickness','ior','sheen'];
  THREE.__lambertStd=true;
  THREE.MeshStandardMaterial=function(o){ const q=Object.assign({},o||{}); for(const k of WEG) delete q[k]; return new THREE.MeshLambertMaterial(q); };
}
const LIN=h=>new THREE.Color(h).convertSRGBToLinear();
function std(hex,o){ const m=new THREE.MeshStandardMaterial(Object.assign({roughness:0.85,metalness:0},o||{})); m.color=LIN(hex); return m; }
/* Canvas-Speicher (03.10., Tom, iPhone: im Testraum blieben ganze Regale
   schwarz): Safari erlaubt einer Seite nur rund 384 MB Canvas-Speicher -
   gemessen hielt das Spiel schon 300 MB, die Vorfuehrung 431 MB, danach
   bekommt jede neue Canvas kein Bild mehr. Fertig gemalte Texturen behalten
   ihre Pixel deshalb als ImageData (zaehlt nicht zum Canvas-Speicher), die
   Canvas wird sofort freigegeben. Texturen, die spaeter neu bemalt werden
   (leere Malfunktion, redraw), bleiben Canvas. */
/* nur mit WebGL2: WebGL1 muesste Bilder ohne Zweierpotenz-Groesse ueber eine
   Canvas umrechnen - das geht mit ImageData nicht */
function texSpar(c){ try{ if(!renderer.capabilities.isWebGL2) return c; const d=c.getContext('2d').getImageData(0,0,c.width,c.height); c.width=c.height=0; return d; }catch(e){ return c; } }
function tex(w,h,draw,srgb){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(draw.length?texSpar(c):c); t.anisotropy=GFX_START.ani; if(srgb!==false) t.encoding=THREE.sRGBEncoding; return t; }
function texCanvas(t){ let c=t.image; if(c&&c.getContext) return c;
  const n=document.createElement('canvas'); n.width=c.width; n.height=c.height; if(c&&c.data) n.getContext('2d').putImageData(c,0,0); t.image=n; return n; }
function redraw(t,draw){ const c=texCanvas(t); draw(c.getContext('2d'),c.width,c.height); t.needsUpdate=true; }
function tm(x,y,z,rx,ry,rz,sx,sy,sz){ const m=new THREE.Matrix4(); m.compose(V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),V(sx||1,sy||1,sz||1)); return m; }
function merge(parts){
  let total=0;
  const gs=parts.map(p=>{ const g=p.geo.index?p.geo.toNonIndexed():p.geo.clone(); g.applyMatrix4(p.m); total+=g.attributes.position.count; return {g,c:p.color,p}; });
  const pos=new Float32Array(total*3), nor=new Float32Array(total*3), uv=new Float32Array(total*2), col=new Float32Array(total*3); let o=0;
  for(const {g,c,p} of gs){
    const n=g.attributes.position.count; p._o=o; p._n=n;   // Eckbereich je Teil (Rohre verkohlen einzeln)
    pos.set(g.attributes.position.array,o*3); nor.set(g.attributes.normal.array,o*3);
    if(g.attributes.uv) uv.set(g.attributes.uv.array,o*2);
    const cc=LIN(c===undefined?0xffffff:c);
    for(let i=0;i<n;i++){ col[(o+i)*3]=cc.r; col[(o+i)*3+1]=cc.g; col[(o+i)*3+2]=cc.b; }
    o+=n; g.dispose();
  }
  const out=new THREE.BufferGeometry();
  out.setAttribute('position',new THREE.BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  out.setAttribute('uv',new THREE.BufferAttribute(uv,2)); out.setAttribute('color',new THREE.BufferAttribute(col,3));
  out.computeBoundingSphere(); return out;
}
function atlasBox(w,h,d,R){
  const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv, faces=['side','side','top','top','front','front'];
  for(let f=0;f<6;f++){ const r=R[faces[f]]; for(let i=0;i<4;i++){ const k=f*4+i, u=uv.getX(k), v=uv.getY(k); uv.setXY(k,r[0]+u*(r[2]-r[0]),r[1]+v*(r[3]-r[1])); } }
  return g;
}
function fitFont(g,text,maxW,size,fam){ let s=size; do{ g.font=fam(s); if(g.measureText(text).width<=maxW) break; s-=1; }while(s>6); return s; }
const BUN=s=>`${s}px Bungee, Impact, sans-serif`, BAR=s=>`700 ${s}px "Barlow Condensed", sans-serif`;


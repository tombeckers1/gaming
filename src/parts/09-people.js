/* =========================================================
   Menschen (06.10., Tom: "Menschen realistisch statt Minecraft-Figuren",
   Referenzbild Supermarkt-Kunden): echte Figuren mit Haut, Gesicht,
   Haaren und Kleidung aus dem Microsoft-Rocketbox-Satz (MIT-Lizenz,
   Daten und Lizenztext in 09a-figuren.js). Jede Figur ist ein
   Skinned Mesh mit 27 Knochen und EINEM Material (Atlas aus Koerper,
   Kopf und Haar) - ein Zeichenaufruf je Person statt rund zehn.
   Gehen und Stehen kommen aus Bewegungsaufnahmen (Rocketbox), alles
   andere (Karton tragen, Wischen, Wagen schieben) steuert der Spielcode
   wie bisher ueber unsichtbare Gelenkgruppen (legs, arms, Unterarm,
   torso, head); die Arme der Figur folgen dann per Zwei-Knochen-IK der
   Hand der Steuergruppe.
   Vorher (23.09.-05.10.): Low-Poly-Figuren aus Kaesten mit Pixelgesicht.
   Kleidung: jede Figur traegt ihre eigene Kleidung; Oberteil und Hose
   lassen sich im Shader umfaerben (Maske im Alphakanal des Atlas) -
   so gibt es viele Farbvarianten und die Personal-Uniform (rotes Polo,
   schwarze Hose) auf jeder Figur.
   ========================================================= */
const FIG_TINT_ROT=0xb3261e, FIG_TINT_SCHWARZ=0x1d1f24;
/* Farbe als CSS-Text (auch fuer die Strassenschilder in 05e) */
const hexCss=h=>'#'+('000000'+h.toString(16)).slice(-6);
/* Die Figuren. alter: teen | jung | mittel | alt. kleid: Stil (KLEID).
   oben/unten: erlaubte Umfaerbungen (leer = nur Originalfarbe) */
const KOEPFE=[
  {id:'F01', sex:'w',alter:'jung',  kleid:'bluse',  oben:[0xd88ca8,0x7aa0d8,0xe8e2d6,0x9ac08a],unten:[]},
  {id:'F02', sex:'w',alter:'mittel',kleid:'pulli',  oben:[0xe8e2d6,0xc8b89a,0x9ab0c8],unten:[]},
  {id:'F05', sex:'w',alter:'mittel',kleid:'blazer', oben:[],unten:[],schick:1},
  {id:'F08', sex:'w',alter:'jung',  kleid:'shirt',  oben:[0x8a8f96,0x2f5d8a,0x7a1f2a,0x3f6b3a,0xe8e2d6],unten:[]},
  {id:'F09', sex:'w',alter:'alt',   kleid:'pulli',  oben:[0x6a6058,0x5a3a4a,0x3a4a5a],unten:[]},
  {id:'F13', sex:'w',alter:'jung',  kleid:'shirt',  oben:[0x5a5f6a,0x2a2c33,0x6a4a7a],unten:[]},
  {id:'F14', sex:'w',alter:'mittel',kleid:'jacke',  oben:[0xc8b89a,0x3a3228,0x5a4a3a,0x6a2a2a],unten:[]},
  {id:'F15', sex:'w',alter:'mittel',kleid:'bluse',  oben:[0x3a4ab0,0x7a1f2a,0xe8e2d6,0x3a6a5a],unten:[],schick:1},
  {id:'F17', sex:'w',alter:'jung',  kleid:'shirt',  oben:[0x3f8a4a,0xe0a030,0x2f7fd0,0xf2f2ee,0x6a4a7a],unten:[]},
  {id:'BF01',sex:'w',alter:'mittel',kleid:'anzug',  oben:[],unten:[],schick:1},
  {id:'BF03',sex:'w',alter:'alt',   kleid:'kostuem',oben:[],unten:[],schick:1},
  {id:'FC01',sex:'w',alter:'teen',  kleid:'shirt',  oben:[0xd040b0,0x2f7fd0,0xe63b2e,0x3f6b3a],unten:[]},
  {id:'M02', sex:'m',alter:'mittel',kleid:'pulli',  oben:[],unten:[]},
  {id:'M03', sex:'m',alter:'alt',   kleid:'blazer', oben:[],unten:[],schick:1},
  {id:'M04', sex:'m',alter:'jung',  kleid:'hoodie', oben:[0x2a2e38,0x7a1f2a,0x2f5d8a,0x5a3a7a],unten:[]},
  {id:'M05', sex:'m',alter:'alt',   kleid:'jacke',  oben:[],unten:[],arbeit:1},
  {id:'M06', sex:'m',alter:'jung',  kleid:'shirt',  oben:[0xb83a30,0x2f5d8a,0x3f6b3a,0x5a5f6a],unten:[]},
  {id:'M08', sex:'m',alter:'mittel',kleid:'hemd',   oben:[0xa8c4e8,0xe8e2d6,0xd8b0b0],unten:[]},
  {id:'M09', sex:'m',alter:'jung',  kleid:'shirt',  oben:[0x1b2a4a,0x3a3a40,0x6a2a2a],unten:[]},
  {id:'M12', sex:'m',alter:'jung',  kleid:'jacke',  oben:[],unten:[],arbeit:1},
  {id:'M13', sex:'m',alter:'mittel',kleid:'pulli',  oben:[],unten:[]},
  {id:'M14', sex:'m',alter:'alt',   kleid:'hemd',   oben:[0x8a8f96,0xa8c4e8,0xc8b89a],unten:[]},
  {id:'M16', sex:'m',alter:'jung',  kleid:'shirt',  oben:[0x2f7fd0,0x3f6b3a,0x8a8f96,0xe0a030,0x1b1d24],unten:[]},
  {id:'M20', sex:'m',alter:'mittel',kleid:'pulli',  oben:[0x5a3a22,0x2f5d8a,0x3a3a40,0x6a2a2a],unten:[]},
  {id:'BM01',sex:'m',alter:'mittel',kleid:'anzug',  oben:[],unten:[],schick:1},
  {id:'BM04',sex:'m',alter:'alt',   kleid:'weste',  oben:[],unten:[],schick:1},
  {id:'BM06',sex:'m',alter:'jung',  kleid:'hemd',   oben:[0xf2f2ee,0xa8c4e8],unten:[],schick:1},
  {id:'BM07',sex:'m',alter:'mittel',kleid:'krawatte',oben:[],unten:[],schick:1},
  {id:'MC01',sex:'m',alter:'teen',  kleid:'pulli',  oben:[0x2f7fd0,0x3f6b3a,0xb83a30,0x5a5f6a],unten:[]},
  {id:'CM07',sex:'m',alter:'mittel',kleid:'warnweste',oben:[],unten:[],arbeit:1,nurPersonal:1}
];
/* Kleidungsstile (je Figur fest) */
const KLEID=[
  {id:'bluse',schick:1},{id:'pulli'},{id:'blazer',schick:1},{id:'shirt'},{id:'jacke'},{id:'anzug',schick:1},{id:'kostuem',schick:1},
  {id:'hoodie'},{id:'hemd'},{id:'weste',schick:1},{id:'krawatte',schick:1},{id:'warnweste',arbeit:1},{id:'uniform'}];
/* Einheitliche Arbeitskleidung: rotes Oberteil, schwarze Hose, gelbes
   Logo auf der Brust. Jeder Posten hat seine feste Figur, damit man die
   Leute wiedererkennt. */
const UNIFORM={id:'uniform',obenF:FIG_TINT_ROT,untenF:FIG_TINT_SCHWARZ,logo:1};
const STAFFKOPF={kassierer:'F08',auffueller:'M16',auffueller2:'M09',reinigung:'F13',security:'BM06',packer:'M04',
  kassierer2:'F17',kassierer3:'M08',packer2:'MC01',packer3:'BM04'};
/* alte Kopf-Namen (bis 05.10.) auf die neuen Figuren */
const FIG_ALIAS={teen_m:'MC01',teen_w:'FC01',jung_m:'M16',jung_w:'F08',jung_m2:'M04',jung_w2:'F17',mitte_m:'M08',mitte_m2:'CM07',mitte_w:'F13',mitte_m3:'BM06',alt_w:'F09',alt_m:'BM04'};
const kopfVon=id=>KOEPFE.find(k=>k.id===(FIG_ALIAS[id]||id))||KOEPFE[0];
function kopfFuer(ct){
  const kunden=KOEPFE.filter(k=>!k.nurPersonal&&FIG_DATEN[k.id]);
  const teen=kunden.filter(k=>k.alter==='teen'), rest=kunden.filter(k=>k.alter!=='teen');
  const id=ct&&ct.id;
  if(id==='jugend') return pick(teen);
  if(id==='angeber'){ const s=rest.filter(k=>k.schick); if(s.length) return pick(s); }
  if(id==='profi'){ const s=rest.filter(k=>k.arbeit||k.kleid==='jacke'||k.kleid==='hoodie'); if(s.length) return pick(s); }
  if(id==='spar'){ const s=rest.filter(k=>!k.schick); if(s.length) return pick(s); }
  if(id==='profi'||id==='angeber'||id==='stamm') return pick(rest);
  return Math.random()<0.1?pick(teen):pick(rest);
}
/* Kleidung: Stil der Figur, Oberteil in einer ihrer Farben (oder Original) */
function kleidFuer(k,ct){
  const o={id:k.kleid,schick:k.schick,arbeit:k.arbeit};
  if(k.oben.length&&Math.random()<0.75) o.obenF=pick(k.oben);
  if(k.unten.length&&Math.random()<0.6) o.untenF=pick(k.unten);
  return o;
}

/* ---------- Daten entpacken (einmal je Figur, geteilt) ---------- */
const faceCache={};   /* Atlas-Texturen je Figur (Name aus der Zeit der Pixelgesichter) */
const _figGeo={}, _figBind={};
function figB64(s){ const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
/* Kleiner Inflate (DEFLATE ohne Kopf, RFC 1951) fuer die gepackten
   Netze und Aufnahmen - spart gut 1 MB in der Datei; synchron, damit
   makePerson sofort bauen kann */
const FIG_LB=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258], FIG_LE=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
const FIG_DB=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577], FIG_DE=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
function figInflate(src,n){
  const out=new Uint8Array(n); let op=0, pos=0, bit=0;
  const bits=k=>{ let v=0; for(let i=0;i<k;i++){ v|=((src[pos]>>bit)&1)<<i; if(++bit===8){ bit=0; pos++; } } return v; };
  const baue=(lens,m)=>{ const cnt=new Uint16Array(16), off=new Uint16Array(16), sym=new Uint16Array(m);
    for(let i=0;i<m;i++) cnt[lens[i]]++; cnt[0]=0; for(let i=1;i<16;i++) off[i]=off[i-1]+cnt[i-1];
    for(let i=0;i<m;i++) if(lens[i]) sym[off[lens[i]]++]=i; return {cnt,sym}; };
  const lies=h=>{ let code=0, first=0, idx=0; for(let l=1;l<16;l++){ code|=bits(1); const c=h.cnt[l]; if(code-c<first) return h.sym[idx+code-first]; idx+=c; first=(first+c)<<1; code<<=1; } throw new Error('inflate'); };
  let fixL=null, fixD=null, last=0;
  while(!last){ last=bits(1); const typ=bits(2);
    if(typ===0){ if(bit){ bit=0; pos++; } const len=src[pos]|src[pos+1]<<8; pos+=4; out.set(src.subarray(pos,pos+len),op); pos+=len; op+=len; continue; }
    let L, D;
    if(typ===1){ if(!fixL){ const l=new Uint8Array(288); l.fill(8,0,144); l.fill(9,144,256); l.fill(7,256,280); l.fill(8,280,288); fixL=baue(l,288); fixD=baue(new Uint8Array(30).fill(5),30); } L=fixL; D=fixD; }
    else { const nl=bits(5)+257, nd=bits(5)+1, nc=bits(4)+4, ord=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15], cl=new Uint8Array(19);
      for(let i=0;i<nc;i++) cl[ord[i]]=bits(3);
      const C=baue(cl,19), lens=new Uint8Array(nl+nd);
      for(let i=0;i<nl+nd;){ const sy=lies(C);
        if(sy<16) lens[i++]=sy;
        else if(sy===16){ const p=lens[i-1]; for(let r=3+bits(2);r>0;r--) lens[i++]=p; }
        else if(sy===17){ for(let r=3+bits(3);r>0;r--) lens[i++]=0; }
        else { for(let r=11+bits(7);r>0;r--) lens[i++]=0; } }
      L=baue(lens.subarray(0,nl),nl); D=baue(lens.subarray(nl),nd); }
    for(;;){ let sy=lies(L); if(sy<256){ out[op++]=sy; continue; } if(sy===256) break;
      sy-=257; const len=FIG_LB[sy]+bits(FIG_LE[sy]); const ds=lies(D), dist=FIG_DB[ds]+bits(FIG_DE[ds]);
      for(let k=0;k<len;k++,op++) out[op]=out[op-dist]; } }
  return out;
}
function figGeometrie(id){
  if(_figGeo[id]) return _figGeo[id];
  const D=FIG_DATEN[id], u8=figInflate(figB64(D.z),D.n), dv=new DataView(u8.buffer), n=D.nV, st=22;
  const pos=new Float32Array(n*3), nor=new Float32Array(n*3), uv=new Float32Array(n*2), si=new Uint8Array(n*4), sw=new Uint8Array(n*4);
  for(let i=0;i<n;i++){ const o=i*st;
    for(let c=0;c<3;c++){ pos[i*3+c]=D.min[c]+dv.getUint16(o+c*2,true)/65535*(D.max[c]-D.min[c]); nor[i*3+c]=dv.getInt8(o+6+c)/127; }
    uv[i*2]=dv.getUint16(o+10,true)/65535; uv[i*2+1]=dv.getUint16(o+12,true)/65535;
    for(let c=0;c<4;c++){ si[i*4+c]=dv.getUint8(o+14+c); sw[i*4+c]=dv.getUint8(o+18+c); } }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2)); g.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));
  g.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4,true));
  /* Handy: vereinfachtes Netz (dieselben Ecken, weniger Dreiecke) */
  const o0=n*st+(HIQ?0:D.nD*2), ix=new Uint16Array(HIQ?D.nD:D.nH); for(let i=0;i<ix.length;i++) ix[i]=dv.getUint16(o0+i*2,true);
  g.setIndex(new THREE.BufferAttribute(ix,1));
  g.computeBoundingSphere(); g.boundingSphere.radius*=1.25;
  return _figGeo[id]=g;
}
function figAtlas(id){
  if(faceCache[id]) return faceCache[id];
  const t=new THREE.Texture(); const img=new Image();
  img.onload=()=>{ let src=img;
    /* Handy: halbe Aufloesung spart drei Viertel des Grafikspeichers */
    if(!HIQ){ const c=document.createElement('canvas'); c.width=img.width>>1; c.height=img.height>>1; c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      /* als ImageData behalten - Safari zaehlt Canvas-Speicher knapp (siehe texSpar) */
      src=typeof texSpar==='function'?texSpar(c):c; }
    t.image=src; t.needsUpdate=true; };
  img.src=FIG_DATEN[id].atlas;
  t.encoding=THREE.sRGBEncoding; t.anisotropy=Math.min(4,GFX_START.ani); t.flipY=true;
  return faceCache[id]=t;
}
/* Ruhelage der Knochen und ihre inversen Bindungsmatrizen (je Figur) */
function figBindung(id){
  if(_figBind[id]) return _figBind[id];
  const D=FIG_DATEN[id], bones=figKnochen(id), inv=[];
  bones[0].updateMatrixWorld(true);
  for(const b of bones) inv.push(b.matrixWorld.clone().invert());
  const animIdx=FIG_KNOCHEN.map(n=>D.knochen.findIndex(k=>k.n===n));
  const r=D.knochen[0].pos;
  return _figBind[id]={inv,animIdx,wurzel:r.slice(),hand:['R_Hand','L_Hand'].map(n=>D.knochen.findIndex(k=>k.n===n))};
}
function figKnochen(id){
  const D=FIG_DATEN[id], bones=D.knochen.map(k=>{ const b=new THREE.Bone(); b.name=k.n; b.position.fromArray(k.pos); b.quaternion.fromArray(k.q); return b; });
  D.knochen.forEach((k,i)=>{ if(k.p>=0) bones[k.p].add(bones[i]); });
  return bones;
}
/* Bewegungsaufnahmen: Quaternionen je Bild und Knochen */
const _figAnim={};
function figAnim(id){
  if(_figAnim[id]) return _figAnim[id];
  const A=FIG_ANIM[id], u=figInflate(figB64(A.q),A.nq), q16=new Int16Array(u.buffer,u.byteOffset,u.byteLength/2), q=new Float32Array(q16.length);
  for(let i=0;i<q16.length;i++) q[i]=q16[i]/32767;
  /* Wurzelhoehe relativ zum Mittel (Auf und Ab beim Gehen) */
  const n=A.n, w=A.w; let my=0, mx=0, mz=0, z0=1e9, z1=-1e9; for(let f=0;f<n;f++){ mx+=w[f*3]; my+=w[f*3+1]; mz+=w[f*3+2]; z0=Math.min(z0,w[f*3+2]); z1=Math.max(z1,w[f*3+2]); } mx/=n; my/=n; mz/=n;
  /* Gehaufnahmen laufen vorwaerts (z): das ist die Schrittlaenge je Zyklus; die Figur geht auf der Stelle */
  const schritt=(z1-z0)*n/Math.max(1,n-1)/100;
  return _figAnim[id]={n,fps:A.fps,dauer:A.dauer,q,w,mitte:[mx,my,mz],nb:FIG_KNOCHEN.length,schritt,huefte:my};
}

/* ---------- Material: Atlas mit Umfaerbung von Oberteil und Hose ---------- */
function figMaterial(id,O){
  const L=FIG_DATEN[id].lum, lin=h=>new THREE.Color(h).convertSRGBToLinear();
  const m=new THREE.MeshStandardMaterial({map:figAtlas(id),skinning:true,roughness:0.82,metalness:0,alphaTest:0.5,side:THREE.DoubleSide});
  const U={fOben:{value:lin(O.obenF!==undefined?O.obenF:0xffffff)},fUnten:{value:lin(O.untenF!==undefined?O.untenF:0xffffff)},
    fAn:{value:new THREE.Vector2(O.obenF!==undefined&&L.oben>0?1:0,O.untenF!==undefined&&L.unten>0?1:0)},fLum:{value:new THREE.Vector2(Math.max(0.02,L.obenLin||0.2),Math.max(0.02,L.untenLin||0.2))}};
  m.userData.tint=U;
  m.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U);
    sh.fragmentShader='uniform vec3 fOben;\nuniform vec3 fUnten;\nuniform vec2 fAn;\nuniform vec2 fLum;\n'+sh.fragmentShader.replace('#include <map_fragment>',
`vec4 texelColor = texture2D( map, vUv );
texelColor = mapTexelToLinear( texelColor );
if( vUv.x < 0.5 ){
  float a = texelColor.a;
  float to = clamp( ( a - 0.8 ) * 5.0, 0.0, 1.0 ) * fAn.x;
  float tu = clamp( ( 0.8 - a ) * 5.0, 0.0, 1.0 ) * fAn.y;
  float l = dot( texelColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
  texelColor.rgb = mix( texelColor.rgb, fOben * min( pow( l / fLum.x, 0.65 ), 1.8 ), to );
  texelColor.rgb = mix( texelColor.rgb, fUnten * min( pow( l / fLum.y, 0.65 ), 1.8 ), tu );
  texelColor.a = 1.0;
}
diffuseColor *= texelColor;`); };
  m.customProgramCacheKey=()=>'figur1';
  return m;
}
/* Logo auf der Personal-Uniform und Papiertuete: ein Material fuer alle */
let _figLogoM=null, _figLogoG=null, _figTueteM=null, _figTueteG=null, _figBlobM=null, _figBlobG=null;
function figLogo(){
  if(!_figLogoM){ _figLogoM=new THREE.MeshStandardMaterial({map:tex(64,48,(g,W,H)=>{ g.fillStyle='#ffd23f'; g.fillRect(0,0,W,H); g.fillStyle='#b3261e'; g.font='900 26px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('★',W/2,H/2+2); }),roughness:0.7});
    _figLogoG=new THREE.PlaneGeometry(7,5); }
  return new THREE.Mesh(_figLogoG,_figLogoM);
}
/* Papiertuete (Kraftpapier, Henkel aus gedrehtem Papier), in cm wie die Figur */
function figTuete(){
  if(!_figTueteM){
    const t=tex(128,128,(g,W,H)=>{ g.fillStyle='#b98c5a'; g.fillRect(0,0,W,H);
      for(let i=0;i<900;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?90:240},${v<0.5?60:210},${v<0.5?30:170},${Math.random()*0.12})`; g.fillRect(Math.random()*W,Math.random()*H,2,1); }
      g.fillStyle='rgba(60,40,20,.25)'; g.fillRect(0,0,W,6); g.fillRect(W/2-1,0,2,H); });
    _figTueteM=new THREE.MeshStandardMaterial({map:t,roughness:0.92});
    const box=new THREE.BoxGeometry(26,32,13); box.translate(0,-22,0);
    const henkel=new THREE.TorusGeometry(5,0.7,4,10,Math.PI); henkel.translate(0,-6.5,0);
    _figTueteG=merge([{geo:box,m:new THREE.Matrix4()},{geo:henkel,m:new THREE.Matrix4()}]); }
  const m=new THREE.Mesh(_figTueteG,_figTueteM); if(HIQ) m.castShadow=true; return m;
}

/* ---------- Person bauen ---------- */
const FIG_PERSONEN=new Set();
function makePerson(opt){
  opt=opt||{};
  const K=opt.kopf?kopfVon(opt.kopf):opt.uniform?kopfVon(STAFFKOPF[opt.uniform]):kopfFuer(opt.ct);
  const O=opt.uniform?UNIFORM:opt.outfit&&!FIG_DATEN[K.id]?opt.outfit:kleidFuer(K,opt.ct);
  const g=new THREE.Group();
  /* Steuergelenke wie bei den alten Figuren - unsichtbar. Spielcode
     (Einraeumer, Packer, Reinigung) dreht Arme und Unterarme, die
     Figur folgt per IK. */
  const legs=[], arms=[];
  for(const sx of [-1,1]){ const pv=new THREE.Group(); pv.position.set(sx*0.085,0.88,0); g.add(pv); legs.push(pv); }
  const torso=new THREE.Group(); torso.position.y=1.21; g.add(torso);
  for(const sx of [-1,1]){
    const pv=new THREE.Group(); pv.position.set(sx*0.255,1.45,0); g.add(pv);
    const fa=new THREE.Group(); fa.position.y=-0.3; fa.rotation.x=-0.18; pv.add(fa);
    pv.rotation.z=sx*0.05; arms.push(pv);
  }
  const head=new THREE.Group(); head.position.set(0,1.66,0.005); g.add(head);
  /* Figur */
  let fig=null;
  if(FIG_DATEN[K.id]&&THREE.SkinnedMesh&&THREE.Bone){ /* ohne Skinning (Logik-Stub der Tests) nur die Steuergelenke */
    const id=K.id, B=figBindung(id), bones=figKnochen(id);
    const root=new THREE.Group(); root.scale.setScalar(0.01); root.add(bones[0]); g.add(root);
    const mesh=new THREE.SkinnedMesh(figGeometrie(id),figMaterial(id,O));
    mesh.bind(new THREE.Skeleton(bones,B.inv),new THREE.Matrix4());
    if(HIQ) mesh.castShadow=true;
    root.add(mesh);
    fig={id,root,mesh,bones,B,
      arm:[['R_UpperArm','R_Forearm','R_Hand','R_Clavicle'],['L_UpperArm','L_Forearm','L_Hand','L_Clavicle']].map(a=>a.map(n=>bones.find(b=>b.name===n))),
      geh:0,tw:Math.random(),ti:Math.random()*20,ov:[0,0],ovZiel:[0,0]};
    /* Uniform: Logo vorn auf der Brust (am obersten Rueckenknochen) */
    if(O.logo){ const sp=bones.find(b=>b.name==='Spine2'); if(sp){ const l=figLogo(); fig.logo=l; sp.add(l); } }
  }
  /* Schattenfleck (geteilt) */
  if(!_figBlobM){ _figBlobG=new THREE.CircleGeometry(0.33,18); _figBlobM=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.28,depthWrite:false}); }
  const blob=new THREE.Mesh(_figBlobG,_figBlobM); blob.rotation.x=-Math.PI/2; blob.position.y=0.024; g.add(blob);
  /* Groesse: die Rocketbox-Frauen sind alle 1,74 m, die Maenner 1,80 m,
     die Kinder 1,43 m - Jugendliche etwas groesser, Frauen etwas kleiner */
  g.scale.setScalar((K.alter==='teen'?1.1:K.sex==='w'?0.95:0.99)*rand(0.97,1.03));
  g.userData={legs,arms,torso,head,ph:Math.random()*6,sway:Math.random()*6,gang:1,kopf:K.id,kleid:O.id,oben:O.obenF,fig};
  if(fig){ figPose(g.userData,0); FIG_PERSONEN.add(g); if(fig.logo) figLogoSetzen(fig); }
  return g;
}
/* Logo: Lage auf der Brust aus der Ruhelage des Rumpfs */
function figLogoSetzen(fig){
  const sp=fig.logo.parent; fig.root.updateMatrixWorld(true);
  /* vorn = +z der Figur, Brusthoehe etwa 18 cm unter dem Hals */
  const w=new THREE.Vector3(9,128,13.5);
  const nk=fig.bones.find(b=>b.name==='Neck'); if(nk){ const p=new THREE.Vector3(); nk.getWorldPosition(p); fig.root.worldToLocal(p); w.y=p.y-20; }
  const brust=figBrustZ(fig,w.y); w.z=brust+0.6;
  fig.root.localToWorld(w); sp.worldToLocal(w); fig.logo.position.copy(w);
  const q=new THREE.Quaternion(); sp.getWorldQuaternion(q); const qr=new THREE.Quaternion(); fig.root.getWorldQuaternion(qr);
  fig.logo.quaternion.copy(q.invert().multiply(qr));
}
/* vorderste Ecke des Rumpfs auf Hoehe y (Ruhelage, cm) */
function figBrustZ(fig,y){
  const p=fig.mesh.geometry.attributes.position; let z=10;
  for(let i=0;i<p.count;i++){ const x=p.getX(i), yy=p.getY(i); if(Math.abs(yy-y)<3&&x>3&&x<15) z=Math.max(z,p.getZ(i)); }
  return z;
}

/* ---------- Bewegung ---------- */
/* Grundhaltung aus den Aufnahmen: Gehen und Stehen, je nach Tempo
   ueberblendet. Phase aus dem zurueckgelegten Weg - die Fuesse
   rutschen nicht. */
const _fq=new Float32Array(4), _fq2=new Float32Array(4);
function figPose(u,dt,moving,speed){
  const F=u.fig, B=F.B, man=FIG_DATEN[F.id].sex!=='w';
  const AG=figAnim(man?'m_gehen':'w_gehen'), AS=figAnim(man?'m_stehen':'w_stehen');
  F.geh+=((moving?1:0)-F.geh)*Math.min(1,dt*7);
  /* Doppelschritt der Aufnahme, auf die Beinlaenge der Figur umgerechnet */
  if(moving){ const sch=AG.schritt*B.wurzel[1]/AG.huefte*(F.root.parent?F.root.parent.scale.x:1); F.tw=(F.tw+dt*Math.max(0.6,speed||1.3)/sch)%1; }
  F.ti=(F.ti+dt)%AS.dauer;
  for(const k of [0,1]) F.ov[k]+=(F.ovZiel[k]-F.ov[k])*Math.min(1,dt*10);
  if(u.greif){ u.greif.t+=dt; if(u.greif.t>=u.greif.dauer) u.greif=null; }
  const fg=F.tw*AG.n, g0=Math.floor(fg)%AG.n, g1=(g0+1)%AG.n, ag=fg-Math.floor(fg);
  const fs=F.ti*AS.fps, s0=Math.min(AS.n-1,Math.floor(fs)), s1=Math.min(AS.n-1,s0+1), as=fs-Math.floor(fs);
  const nb=AG.nb, w=F.geh;
  for(let a=0;a<nb;a++){ const bi=B.animIdx[a]; if(bi<0) continue;
    THREE.Quaternion.slerpFlat(_fq,0,AG.q,(g0*nb+a)*4,AG.q,(g1*nb+a)*4,ag);
    THREE.Quaternion.slerpFlat(_fq2,0,AS.q,(s0*nb+a)*4,AS.q,(s1*nb+a)*4,as);
    THREE.Quaternion.slerpFlat(_fq,0,_fq2,0,_fq,0,w);
    F.bones[bi].quaternion.fromArray(_fq); }
  /* Wurzel: Auf und Ab und Seitpendeln der Aufnahme, auf die Figur skaliert */
  const r=F.bones[0], k=B.wurzel[1]/AG.mitte[1];
  const wy=(AG.w[g0*3+1]*(1-ag)+AG.w[g1*3+1]*ag-AG.mitte[1])*w+(AS.w[s0*3+1]-AS.mitte[1])*(1-w);
  const wx=(AS.w[s0*3]-AS.mitte[0])*(1-w), wz=(AS.w[s0*3+2]-AS.mitte[2])*(1-w);
  r.position.set(B.wurzel[0]+wx*k,B.wurzel[1]+wy*k,B.wurzel[2]+wz*k);
}
function animPerson(g,moving,dt,speed){
  const u=g.userData; if(moving) u.ph+=dt*speed*5.0; u.sway+=dt;
  const a=moving?Math.sin(u.ph)*0.52:0, k=Math.min(1,dt*12);
  const b=a*(u.gang||1);
  u.legs[0].rotation.x+=(b-u.legs[0].rotation.x)*k; u.legs[1].rotation.x+=(-b-u.legs[1].rotation.x)*k;
  u.arms[0].rotation.x+=(-a*0.8-u.arms[0].rotation.x)*k; u.arms[1].rotation.x+=(a*0.8-u.arms[1].rotation.x)*k;
  const idle=moving?0:Math.sin(u.sway*1.6)*0.02;
  u.torso.rotation.z+=(idle-u.torso.rotation.z)*k;
  if(u.head) u.head.rotation.y+=((moving?0:Math.sin(u.sway*0.7)*0.25)-u.head.rotation.y)*k*0.5;
  if(u.fig){
    /* was animPerson an den Armen gesetzt hat - weicht der Spielcode
       danach davon ab, uebernimmt die IK den Arm */
    u._ax=[u.arms[0].rotation.x,u.arms[1].rotation.x];
    figPose(u,dt,moving,speed); FIG_PERSONEN.add(g);
  }
}

/* ---------- Arme nach den Steuergelenken (vor jedem Bild) ---------- */
const _fv=[0,1,2,3,4,5,6].map(()=>new THREE.Vector3()), _fqa=new THREE.Quaternion(), _fqb=new THREE.Quaternion(), _fqc=new THREE.Quaternion();
/* Knochen so drehen, dass seine Achse (zum Kind) von 'von' nach 'nach' zeigt (Welt) */
function figDrehe(bone,von,nach){
  _fqa.setFromUnitVectors(von,nach);
  bone.getWorldQuaternion(_fqb); _fqb.premultiply(_fqa);
  bone.parent.getWorldQuaternion(_fqc); bone.quaternion.copy(_fqc.invert().multiply(_fqb));
  bone.updateMatrixWorld(true);
}
function figArmIK(g,u,i){
  const F=u.fig, [ob,un,ha]=F.arm[i]; if(!ob||!un||!ha) return;
  const G=u.greif&&u.greif.arm===i?u.greif:null;
  const wg=G?Math.pow(Math.sin(Math.PI*clamp(G.t/G.dauer,0,1)),0.6):0;
  const w=Math.max(F.ov[i],wg); if(w<0.01) return;
  const S=ob.getWorldPosition(_fv[0]), E0=un.getWorldPosition(_fv[1]), H0=ha.getWorldPosition(_fv[2]);
  const L1=S.distanceTo(E0), L2=E0.distanceTo(H0);
  let dl, dn;
  if(wg>F.ov[i]){
    /* Greifen: Hand zum Ziel in der Welt (Fach, Band) */
    const d=_fv[3].subVectors(G.ziel,S); dl=d.length(); dn=d.normalize().clone();
  } else {
    /* Ziel: Hand der Steuergruppe, von deren Schulter aus auf die
       Armlaenge der Figur umgerechnet (die alten Figuren hatten 0,61 m
       lange, weit aussen sitzende Arme) */
    const fa=u.arms[i].children[0]; const T=_fv[3].set(0,-0.31,0.02); fa.localToWorld(T);
    /* erreichbar (Wagenbuegel, Wischerstiel): genau dorthin */
    const dA=_fv[5].subVectors(T,S);
    if(dA.length()<=(L1+L2)*0.93){ dl=dA.length(); dn=dA.normalize().clone(); }
    else { const SA=u.arms[i].getWorldPosition(_fv[4]); const d=T.sub(SA); const sk=g.getWorldScale(_fv[5]).x;
      dl=d.length()/sk*(L1+L2)/0.61; dn=d.normalize().clone(); }
  }
  /* nie ganz gestreckt */
  dl=clamp(dl,Math.abs(L1-L2)+0.01,(L1+L2)*0.93);
  /* Beuge-Richtung: nach unten, hinten und etwas nach aussen */
  const sx=i===0?-1:1; const pol=_fv[5].set(sx*0.35,-1,-0.55).applyQuaternion(g.getWorldQuaternion(_fqa));
  pol.addScaledVector(dn,-pol.dot(dn)).normalize();
  const ca=clamp((L1*L1+dl*dl-L2*L2)/(2*L1*dl),-1,1), sa=Math.sqrt(1-ca*ca);
  const E=_fv[6].copy(S).addScaledVector(dn,L1*ca).addScaledVector(pol,L1*sa);
  const von=new THREE.Vector3().subVectors(E0,S).normalize(), nach=new THREE.Vector3().subVectors(E,S).normalize();
  if(w<1) nach.lerp(von,1-w).normalize();
  figDrehe(ob,von,nach);
  const E1=un.getWorldPosition(new THREE.Vector3()), H1=ha.getWorldPosition(new THREE.Vector3());
  const T2=S.clone().addScaledVector(dn,dl);
  const von2=H1.clone().sub(E1).normalize(), nach2=T2.sub(E1).normalize();
  if(w<1) nach2.lerp(von2,1-w).normalize();
  figDrehe(un,von2,nach2);
}
function figVorBild(){
  for(const g of FIG_PERSONEN){
    if(!g.parent){ FIG_PERSONEN.delete(g); continue; }
    const u=g.userData, F=u.fig; if(!F||!g.visible) continue;
    /* Steuerarme abweichend von animPerson? Dann IK */
    let ik=false;
    for(const i of [0,1]){ const a=u.arms[i], sx=i===0?-1:1, fa=a.children[0];
      /* Seitwaerts bis 0,06 gilt noch als Grundhaltung (Packer setzen nach dem Schieben 0) */
      const ab=(u._ax?Math.abs(a.rotation.x-u._ax[i]):0)>0.03||Math.abs(a.rotation.z)>0.065||(fa&&Math.abs(fa.rotation.x+0.18)>0.03);
      F.ovZiel[i]=ab?1:0; if(F.ov[i]>0.01) ik=true; }
    if(F.tuete||u.greif) ik=true;
    if(!ik) continue;
    F.root.updateMatrixWorld(true);
    for(const i of [0,1]) figArmIK(g,u,i);
    if(F.tuete) figTueteHaengen(F);
  }
}
if(typeof scene!=='undefined'){ const _vor=scene.onBeforeRender; scene.onBeforeRender=function(){ try{ figVorBild(); }catch(e){} if(_vor) _vor.apply(this,arguments); }; }

/* Person endgueltig weg (Kunde gegangen, Personal entlassen): Knochen-
   Textur und Material freigeben - Netz und Atlas sind geteilt und bleiben */
function personWeg(g){
  const F=g&&g.userData&&g.userData.fig; if(!F) return;
  FIG_PERSONEN.delete(g);
  try{ if(F.mesh.skeleton&&F.mesh.skeleton.dispose) F.mesh.skeleton.dispose(); F.mesh.material.dispose(); }catch(e){}
}
/* ---------- Greifen: eine Hand reicht kurz zum Ziel (Fach, Band, Terminal) ---------- */
function personGreif(g,ziel,dauer){
  const u=g&&g.userData; if(!u||!u.fig) return;
  const p=new THREE.Vector3();
  if(ziel&&ziel.isObject3D) ziel.getWorldPosition(p); else if(ziel&&ziel.isVector3) p.copy(ziel); else { p.set(0.12,1.0,0.62); g.localToWorld(p); }
  const l=g.worldToLocal(p.clone());
  /* die Hand auf der Seite des Ziels; die Tuete bleibt in ihrer Hand */
  let arm=l.x<0?0:1; if(u.fig.tuete&&u.fig.arm[arm][2]===u.fig.tuete.parent) arm=1-arm;
  u.greif={t:0,dauer:Math.max(0.35,dauer||0.6),ziel:p,arm};
}
/* Hand der Figur (Handflaeche) in Koordinaten der Person - fuer Wischer und Co. */
const _fh=new THREE.Vector3();
function personHand(g,i){
  const F=g.userData.fig; if(!F) return null; const ha=F.arm[i][2]; if(!ha) return null;
  _fh.set(0,0,0); ha.localToWorld(_fh);
  const f=F.arm[i][1].getWorldPosition(new THREE.Vector3()); _fh.addScaledVector(_fh.clone().sub(f).normalize(),0.06);
  g.worldToLocal(_fh); return _fh;
}
/* ---------- Papiertuete in der Hand (nach dem Bezahlen) ---------- */
function personTuete(g,an){
  const F=g&&g.userData.fig; if(!F) return;
  if(!an){ if(F.tuete){ F.tuete.parent.remove(F.tuete); F.tuete=null; } return; }
  if(F.tuete) return;
  const ha=F.arm[Math.random()<0.5?0:1][2]; if(!ha) return;
  const t=figTuete(); F.tuete=t; ha.add(t); t.userData.hand=ha;
}
/* Die Tuete haengt senkrecht an der Hand, Front in Laufrichtung */
function figTueteHaengen(F){
  const t=F.tuete, ha=t.parent; ha.updateMatrixWorld(true);
  const p=_fv[0].set(0,0,0); ha.localToWorld(p);
  /* etwas unterhalb des Handgelenks (Finger) */
  const q=F.root.getWorldQuaternion(_fqa); const off=_fv[1].set(0,-7,0).multiplyScalar(F.root.getWorldScale(_fv[2]).x); p.add(off);
  ha.worldToLocal(p); t.position.copy(p);
  ha.getWorldQuaternion(_fqb); t.quaternion.copy(_fqb.invert().multiply(q));
  const s=ha.getWorldScale(_fv[3]).x, sr=F.root.getWorldScale(_fv[2]).x; t.scale.setScalar(sr/s);
}

function bubble(text,bad){
  const t=tex(360,84,(g,W,H)=>{ g.fillStyle=bad?'#ffd7cf':'#f2f5ff'; g.beginPath(); if(g.roundRect) g.roundRect(4,4,W-8,H-8,26); else g.rect(4,4,W-8,H-8); g.fill(); g.fillStyle='#0e1226'; fitFont(g,text,W-30,34,BAR); g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,W/2,H/2+2); });
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true,toneMapped:false})); s.scale.set(1.7,0.4,1); s.position.y=2.25; s.renderOrder=10; return s;
}
const alertTex=tex(128,128,(g,W,H)=>{ g.clearRect(0,0,W,H); g.fillStyle='#e63b2e'; g.beginPath(); g.moveTo(64,6); g.lineTo(122,116); g.lineTo(6,116); g.closePath(); g.fill(); g.fillStyle='#fff'; g.fillRect(56,40,16,44); g.fillRect(56,92,16,16); });
function alertSprite(){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:alertTex,depthTest:false,transparent:true,toneMapped:false})); s.scale.set(0.45,0.45,1); s.position.y=2.25; s.renderOrder=11; return s; }
/* Figuren im Hintergrund vorbereiten (Netz entpacken, Atlas dekodieren),
   eine je 80 ms - sonst ruckelt es, wenn eine Figur zum ersten Mal kommt,
   und ihr Atlas fehlt in den ersten Bildern */
(function figVorladen(){ if(!THREE.SkinnedMesh) return; const ids=Object.keys(FIG_DATEN); let i=0;
  const t=()=>{ if(i>=ids.length) return; try{ figGeometrie(ids[i]); figAtlas(ids[i]); figBindung(ids[i]); }catch(e){} i++; setTimeout(t,80); };
  setTimeout(t,300); })();


/* =========================================================
   Bildaufbereitung: Bloom, Vignette, Filmkorn
   ========================================================= */
let postOK=false, postOn=true, rtScene=null, rtA=null, rtB=null;
let quadScene=null, quadCam=null, quadMesh=null, matBright=null, matBlur=null, matComp=null;
let postW=0, postH=0, postDiv=4, postHalf=false;
const QUAD_V='varying vec2 vUv;\nvoid main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
function initPost(){
  try{
    if(localStorage.getItem('bb_post')==='0') postOn=false;
    if(GFX==='niedrig') postOn=false;
  }catch(e){}
  try{
    const opt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,stencilBuffer:false,depthBuffer:true};
    /* Die Szene liegt hier in linearen Farben. Mit 8 Bit reicht das im
       Dunkeln nicht: der Nachthimmel zerfiel in harte Stufen (linear
       1/255 wird nach der Umrechnung zu 13, 2/255 schon zu 22). Mit
       Halbfloat ist der Verlauf glatt - sofern die Karte es kann. */
    let half=false;
    try{ const ex=renderer.extensions; half=!!(ex&&renderer.capabilities.isWebGL2&&(ex.get('EXT_color_buffer_float')||ex.get('EXT_color_buffer_half_float'))); }catch(e){ half=false; }
    if(half&&THREE.HalfFloatType) opt.type=THREE.HalfFloatType;
    postHalf=half;
    const ms=renderer.capabilities&&renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget;
    rtScene=ms?new THREE.WebGLMultisampleRenderTarget(2,2,opt):new THREE.WebGLRenderTarget(2,2,opt);
    if(ms) rtScene.samples=COARSE?2:GFX==='hoch'?4:2;
    const bopt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false};
    rtA=new THREE.WebGLRenderTarget(2,2,bopt); rtB=new THREE.WebGLRenderTarget(2,2,bopt);
    matBright=new THREE.ShaderMaterial({
      uniforms:{tDiffuse:{value:null},threshold:{value:0.68},softness:{value:0.28}},
      vertexShader:QUAD_V,
      fragmentShader:'uniform sampler2D tDiffuse;\nuniform float threshold;\nuniform float softness;\nvarying vec2 vUv;\nvoid main(){\n  vec3 c=texture2D(tDiffuse,vUv).rgb;\n  float l=dot(c,vec3(0.2126,0.7152,0.0722));\n  float k=smoothstep(threshold,threshold+softness,l);\n  gl_FragColor=vec4(c*k,1.0);\n}',
      depthTest:false,depthWrite:false});
    matBlur=new THREE.ShaderMaterial({
      uniforms:{tDiffuse:{value:null},dir:{value:new THREE.Vector2(0,0)}},
      vertexShader:QUAD_V,
      fragmentShader:'uniform sampler2D tDiffuse;\nuniform vec2 dir;\nvarying vec2 vUv;\nvoid main(){\n  vec3 s=texture2D(tDiffuse,vUv).rgb*0.227027;\n  vec2 o1=dir*1.3846154, o2=dir*3.2307692;\n  s+=texture2D(tDiffuse,vUv+o1).rgb*0.3162162;\n  s+=texture2D(tDiffuse,vUv-o1).rgb*0.3162162;\n  s+=texture2D(tDiffuse,vUv+o2).rgb*0.0702703;\n  s+=texture2D(tDiffuse,vUv-o2).rgb*0.0702703;\n  gl_FragColor=vec4(s,1.0);\n}',
      depthTest:false,depthWrite:false});
    matComp=new THREE.ShaderMaterial({
      uniforms:{tDiffuse:{value:null},tBloom:{value:null},bloom:{value:0.62},vig:{value:0.34},
        grain:{value:COARSE?0.0:0.028},aberr:{value:COARSE?0.0:0.0035},sat:{value:1.07},time:{value:0}},
      vertexShader:QUAD_V,
      fragmentShader:'uniform sampler2D tDiffuse;\nuniform sampler2D tBloom;\nuniform float bloom;\nuniform float vig;\nuniform float grain;\nuniform float aberr;\nuniform float sat;\nuniform float time;\nvarying vec2 vUv;\nfloat hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }\nvec3 toSRGB(vec3 v){ return mix(pow(v,vec3(0.41666))*1.055-0.055, v*12.92, vec3(lessThanEqual(v,vec3(0.0031308)))); }\nvoid main(){\n  vec2 uv=vUv;\n  vec2 d=uv-0.5;\n  float r2=dot(d,d);\n  float a=aberr*r2;\n  vec3 col;\n  col.r=texture2D(tDiffuse,uv+d*a).r;\n  col.g=texture2D(tDiffuse,uv).g;\n  col.b=texture2D(tDiffuse,uv-d*a).b;\n  col+=texture2D(tBloom,uv).rgb*bloom;\n  float lum=dot(col,vec3(0.2126,0.7152,0.0722));\n  col=mix(vec3(lum),col,sat);\n  col*=1.0-vig*smoothstep(0.12,0.62,r2);\n  col=toSRGB(max(col,0.0));\n  col+=(hash(uv*1024.0+time)-0.5)*grain;\n  gl_FragColor=vec4(col,1.0);\n}',
      depthTest:false,depthWrite:false});
    quadScene=new THREE.Scene();
    quadCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    quadMesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),matBright);
    quadMesh.frustumCulled=false; quadScene.add(quadMesh);
    resizePost();
    postOK=true;
  }catch(e){ postOK=false; }
}
function resizePost(){
  if(!rtScene) return;
  const s=new THREE.Vector2(); 
  if(renderer.getDrawingBufferSize) renderer.getDrawingBufferSize(s); else s.set(innerWidth,innerHeight);
  postW=Math.max(2,Math.floor(s.x)); postH=Math.max(2,Math.floor(s.y));
  rtScene.setSize(postW,postH);
  const bw=Math.max(2,Math.floor(postW/postDiv)), bh=Math.max(2,Math.floor(postH/postDiv));
  rtA.setSize(bw,bh); rtB.setSize(bw,bh);
}
function setPost(on){
  postOn=!!on&&postOK;
  try{ localStorage.setItem('bb_post',postOn?'1':'0'); }catch(e){}
  toast(postOn?'Bildeffekte an.':'Bildeffekte aus.');
}
/* Grafikstufe zur Laufzeit wechseln (Pausenmenue oder Automatik):
   Aufloesung, Schatten, Kantenglaettung der Nachbearbeitung, Bildeffekte
   und Partikelmenge (QUAL). Nur die Kantenglaettung des Bildschirms
   selbst braucht einen Neustart - sie zaehlt nur ohne Bildeffekte. */
function gfxAnwenden(st){
  if(GFX_STUFEN.indexOf(st)<0) return;
  const alt=GFX; GFX=st;
  renderer.setPixelRatio(gfxPixel()); renderer.setSize(innerWidth,innerHeight,false);
  const sh=HIQ&&st!=='niedrig', gr=st==='hoch'?2048:1024;
  const typ=st==='hoch'?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
  const shAlt=renderer.shadowMap.enabled, typAlt=renderer.shadowMap.type;
  renderer.shadowMap.enabled=sh; renderer.shadowMap.type=typ; sun.castShadow=sh;
  if(sun.shadow.mapSize.x!==gr){ sun.shadow.mapSize.set(gr,gr); if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map=null; } }
  /* Schatten an/aus oder andere Filterung: die Materialien brauchen andere Shader */
  if(shAlt!==sh||typAlt!==typ) scene.traverse(o=>{ const m=o.material; if(!m) return; (Array.isArray(m)?m:[m]).forEach(x=>{ x.needsUpdate=true; }); });
  let wunsch=true; try{ wunsch=localStorage.getItem('bb_post')!=='0'; }catch(e){}
  postOn=postOK&&wunsch&&st!=='niedrig';
  if(rtScene&&rtScene.isWebGLMultisampleRenderTarget){ const n=COARSE?2:st==='hoch'?4:2; if(rtScene.samples!==n){ rtScene.samples=n; rtScene.dispose(); } }
  resizePost();
  if(alt!==st&&typeof shaderVorab==='function') setTimeout(()=>{ try{ shaderVorab(); }catch(e){} },30);
}
/* Wahl im Pausenmenue: 'auto' oder eine feste Stufe */
function gfxWaehlen(w){
  GFX_WAHL=w; try{ localStorage.setItem('bb_gfx',w); }catch(e){}
  if(w==='auto'){ let st='hoch'; try{ st=localStorage.getItem('bb_gfx_auto')||'hoch'; }catch(e){} gfxAnwenden(st); gfxMess.ruhe=4; }
  else gfxAnwenden(w);
}
/* Automatik: Bildrate ueber Fenster von 2 s; liegt sie drei Fenster
   hintereinander unter 28 Bildern/s, eine Stufe tiefer (gemerkt fuer den
   naechsten Start). Nicht in Pause, Laptop oder verstecktem Tab, und
   nicht in den ersten 8 s nach dem Start oder nach einem Wechsel. */
const gfxMess={t:0,n:0,schlecht:0,ruhe:8,fps:0};
function gfxMessen(roh,aktiv){
  const M=gfxMess;
  if(!aktiv||document.hidden||roh>0.5){ M.t=0; M.n=0; return; }
  if(M.ruhe>0){ M.ruhe-=roh; return; }
  M.t+=roh; M.n++;
  if(M.t<2) return;
  M.fps=M.n/M.t; M.t=0; M.n=0;
  if(GFX_WAHL!=='auto'||GFX==='niedrig'){ M.schlecht=0; return; }
  M.schlecht=M.fps<28?M.schlecht+1:0;
  if(M.schlecht>=3){ const st=GFX_STUFEN[GFX_STUFEN.indexOf(GFX)-1]; M.schlecht=0; M.ruhe=6;
    try{ localStorage.setItem('bb_gfx_auto',st); }catch(e){}
    gfxAnwenden(st); if(typeof toast==='function') toast('Grafik automatisch auf „'+st[0].toUpperCase()+st.slice(1)+'“ gestellt ('+Math.round(M.fps)+' Bilder/s). Ändern: Esc → Grafik.'); }
}
let postT=0;
/* Der Schattenwurf der Sonne deckt nur einen Ausschnitt ab. Solange
   der Laden zwei Raeume gross war, reichte ein fester Kasten um den
   Nullpunkt; auf ueber tausend Quadratmetern lag der halbe Laden
   ausserhalb - und was ausserhalb liegt, bekommt volle Sonne, auch
   unter dem Dach. Deshalb laeuft der Kasten jetzt mit dem Spieler mit,
   gerastert, damit die Schattenkanten nicht flimmern. */
let _sunX=1e9, _sunZ=1e9;
function sonneNachfuehren(){
  if(!sun.castShadow) return;
  const r=2, tx=Math.round(pl.x/r)*r, tz=Math.round(pl.z/r)*r;
  if(tx===_sunX&&tz===_sunZ) return;
  _sunX=tx; _sunZ=tz;
  sun.position.set(tx-18,30,tz+26);
  sun.target.position.set(tx,0,tz);
  sun.target.updateMatrixWorld();
  sun.shadow.camera.updateProjectionMatrix();
  renderer.shadowMap.needsUpdate=true;
}
/* Schattenbild: in 'hoch' jedes Bild neu, in 'mittel' jedes dritte (die
   Sonne steht still, nur Figuren und Kartons bewegen sich - drei Bilder
   Verzug sieht man nicht). Der Schattenpass zeichnet jedes Objekt ein
   zweites Mal: im Laden rund 1000 zusaetzliche Zeichenaufrufe. */
/* Mehrfach-Materialien buendeln (30.09., Leistung): Kartons, Koepfe,
   Container haben sechs Materialien - eins je Seite -, meist aber nur zwei
   oder drei verschiedene. Jede Seite war ein eigener Zeichenaufruf (im Laden
   137 Objekte, 777 Aufrufe, im Schattenpass noch einmal). Die Seiten mit
   gleichem Material werden zu einer Gruppe zusammengelegt - gleiches Bild.
   Die Original-Geometrie bleibt gemerkt: setzt das Spiel spaeter ein neues
   Material-Feld (Einraeumer), wird von ihr aus neu gebuendelt. */
const _gbCache=new Map();
function gruppenBuendeln(o){
  const M=o.material; if(!Array.isArray(M)||o.userData._gbM===M) return;
  if(o.userData._gbGeo&&o.geometry!==o.userData._gbGeo) o.geometry=o.userData._gbGeo;
  const g=o.geometry; o.userData._gbM=M;
  if(!g||!g.index||!g.groups||g.groups.length<2) return;
  const uniq=[], map=[];
  for(const gr of g.groups){ const m=M[gr.materialIndex]; let k=uniq.indexOf(m); if(k<0){ k=uniq.length; uniq.push(m); } map.push(k); }
  if(uniq.length===g.groups.length) return;
  const key=g.uuid+'|'+map.join(','); let ng=_gbCache.get(key);
  if(!ng){ ng=g.clone(); const src=g.index.array, out=new src.constructor(src.length); let p=0; ng.clearGroups();
    for(let k=0;k<uniq.length;k++){ const s0=p; g.groups.forEach((gr,i)=>{ if(map[i]!==k) return; out.set(src.subarray(gr.start,gr.start+gr.count),p); p+=gr.count; }); ng.addGroup(s0,p-s0,k); }
    ng.setIndex(new THREE.BufferAttribute(out,1)); _gbCache.set(key,ng); }
  o.userData._gbGeo=g; o.geometry=ng; o.material=uniq; o.userData._gbM=uniq;
}
let gbN=0;
function gruppenTakt(){ if(--gbN>0) return; gbN=20; try{ scene.traverse(o=>{ if(o.isMesh&&Array.isArray(o.material)) gruppenBuendeln(o); }); }catch(e){ gbN=1e9; } }
/* Buendeln mit Waechter (30.09., Leistung): Blatt-Meshes einer Gruppe (und
   die losen Meshes direkt in der Szene, je 24-m-Feld) mit gleichem Material
   werden zu einem Mesh zusammengezeichnet. Die Originale bleiben in der
   Szene - fuer Klicks, Kollision und Spiellogik -, liegen aber auf Ebene 1
   und werden nicht mehr gezeichnet (Kamera und Schatten sehen nur Ebene 0).
   Alle 20 Bilder prueft ein Waechter: hat sich an einem Original etwas
   geaendert (Lage relativ zur Gruppe, Sichtbarkeit, Material, Geometrie,
   Eltern), wird sein Buendel sofort aufgeloest und die Gruppe nicht mehr
   angefasst. So kann nichts falsch stehen bleiben. */
const BUENDEL={liste:[], fertig:new WeakSet(), unruhig:new WeakSet(), vorher:new WeakMap(), n:0, aufgeloest:0, aus:false};
try{ if(localStorage.getItem('bb_buendel')==='0') BUENDEL.aus=true; }catch(e){}
function bKandidat(o,root){
  if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.children.length||o.userData._bnd) return false;
  const m=o.material; if(!m||Array.isArray(m)||!m.visible||m.transparent||m.vertexColors||(m.map&&m.map.isVideoTexture)) return false;
  if(Object.keys(o.userData).length&&!(o.userData._gbM||o.userData._gbGeo)) return false;
  if(o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender) return false;
  const g=o.geometry; if(!g||!g.attributes.position||!g.attributes.normal||(g.morphAttributes&&Object.keys(g.morphAttributes).length)) return false;
  for(let x=o;x&&x!==root;x=x.parent) if(!x.visible) return false;
  /* gespiegelte Teile (negative Skalierung) drehen beim Einbacken die Flaechen um */
  if(o.matrixWorld.determinant()<0) return false;
  if(typeof occluders!=='undefined'&&occluders.indexOf(o)>=0) return false;
  return !!o.parent;
}
function bSicht(o,root){ for(let x=o;x&&x!==root;x=x.parent) if(!x.visible) return false; return true; }
function bBauen(root,liste,feld){
  const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(), topf=new Map();
  for(const o of liste){ const g=o.geometry, m=o.material;
    const k=m.uuid+'|'+o.castShadow+'|'+o.receiveShadow+'|'+!!g.attributes.uv+'|'+o.renderOrder+'|'+o.frustumCulled+(feld?'|'+feld(o):'');
    (topf.get(k)||topf.set(k,[]).get(k)).push(o); }
  for(const L of topf.values()){ if(L.length<2) continue;
    let total=0; const rel=[], teile=L.map(o=>{ const r=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld); rel.push(r); const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(); g.applyMatrix4(r); total+=g.attributes.position.count; return g; });
    const mitUV=!!L[0].geometry.attributes.uv, pos=new Float32Array(total*3), nor=new Float32Array(total*3), uv=mitUV?new Float32Array(total*2):null; let p=0;
    for(const g of teile){ const c=g.attributes.position.count; pos.set(g.attributes.position.array,p*3); nor.set(g.attributes.normal.array,p*3); if(uv&&g.attributes.uv) uv.set(g.attributes.uv.array,p*2); p+=c; g.dispose(); }
    const out=new THREE.BufferGeometry(); out.setAttribute('position',new THREE.BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.BufferAttribute(nor,3)); if(uv) out.setAttribute('uv',new THREE.BufferAttribute(uv,2)); out.computeBoundingSphere();
    const a=L[0], mm=new THREE.Mesh(out,a.material); mm.castShadow=a.castShadow; mm.receiveShadow=a.receiveShadow; mm.renderOrder=a.renderOrder; mm.frustumCulled=a.frustumCulled; mm.userData._bnd=true; mm.matrixAutoUpdate=false;
    const halter=root===scene?BUENDEL.szene:root; if(root===scene) mm.matrix.identity(); halter.add(mm); mm.updateMatrixWorld(true);
    const ver=g=>{ let v=0; for(const k in g.attributes) v+=g.attributes[k].version; return v+(g.index?g.index.version:0); };
    const orig=L.map((o,i)=>({o,rel:rel[i].elements.slice(),mat:o.material,geo:o.geometry,ver:ver(o.geometry),par:o.parent,mask:o.layers.mask}));
    for(const x of orig){ x.o.layers.set(1); }
    BUENDEL.liste.push({root,mm,orig}); BUENDEL.n+=L.length-1; }
}
function bAufloesen(b){ b.mm.parent&&b.mm.parent.remove(b.mm); b.mm.geometry.dispose(); for(const x of b.orig) x.o.layers.mask=x.mask; BUENDEL.aufgeloest++; }
const _bInv=new THREE.Matrix4(), _bRel=new THREE.Matrix4();
function bWaechter(){
  for(let i=BUENDEL.liste.length-1;i>=0;i--){ const b=BUENDEL.liste[i], root=b.root; let kaputt=false;
    if(root!==scene) _bInv.copy(root.matrixWorld).invert(); else _bInv.identity();
    for(const x of b.orig){ const o=x.o;
      if(o.parent!==x.par||o.material!==x.mat||o.geometry!==x.geo||!bSicht(o,root)){ kaputt=true; break; }
      { let v=0; const g=o.geometry; for(const k in g.attributes) v+=g.attributes[k].version; if(g.index) v+=g.index.version; if(v!==x.ver){ kaputt=true; break; } }
      let top=o; while(top.parent&&top.parent!==scene) top=top.parent; if(!top.parent){ kaputt=true; break; }
      _bRel.multiplyMatrices(_bInv,o.matrixWorld); const e=_bRel.elements, r=x.rel;
      for(let k=0;k<16;k++) if(Math.abs(e[k]-r[k])>1e-4){ kaputt=true; break; }
      if(kaputt) break; }
    if(kaputt&&root===scene){ bAufloesen(b); BUENDEL.liste.splice(i,1); for(const x of b.orig) BUENDEL.unruhig.add(x.o); continue; }
    if(kaputt){ bAufloesen(b); BUENDEL.liste.splice(i,1); BUENDEL.unruhig.add(root);
      /* alle Buendel derselben Gruppe mit aufloesen - sie gehoeren zusammen */
      for(let j=BUENDEL.liste.length-1;j>=0;j--) if(BUENDEL.liste[j].root===root){ bAufloesen(BUENDEL.liste[j]); BUENDEL.liste.splice(j,1); } i=Math.min(i,BUENDEL.liste.length); }
  }
}
/* neue Gruppen alle 300 Bilder aufnehmen; Gruppen mit Personen, Fahrzeugen
   und Feuerwerk bewegen sich - sie loest der Waechter beim ersten Mal auf
   und nimmt sie nie wieder */
function bSammeln(){
  if(!BUENDEL.szene){ BUENDEL.szene=new THREE.Group(); BUENDEL.szene.userData._bnd=true; scene.add(BUENDEL.szene); }
  scene.updateMatrixWorld(true);
  /* erst aufnehmen, wenn es beim vorigen Durchgang (5 s) schon genauso da war:
     Raketen, Kunden und alles Fliegende sind dann laengst weg */
  const ruhig=o=>{ const w=o.matrixWorld.elements, h=Math.round(w[12]*100)+','+Math.round(w[13]*100)+','+Math.round(w[14]*100)+','+o.children.length, alt=BUENDEL.vorher.get(o);
    BUENDEL.vorher.set(o,h); return alt===h; };
  const lose=[];
  for(const top of scene.children){ if(top===BUENDEL.szene||top.userData._bnd||BUENDEL.fertig.has(top)||BUENDEL.unruhig.has(top)) continue;
    if(top.isMesh){ if(bKandidat(top,scene)&&ruhig(top)){ lose.push(top); BUENDEL.fertig.add(top); } continue; }
    if(!top.isGroup&&top.type!=='Object3D') continue;
    /* Personen (Kunden, Personal, Parkleute) bewegen Arme und Beine */
    const ud=top.userData; if(ud.legs||ud.arms||ud.torso||ud.sway) { BUENDEL.unruhig.add(top); continue; }
    if(!ruhig(top)) continue;
    BUENDEL.fertig.add(top); const L=[]; top.traverse(o=>{ if(o!==top&&bKandidat(o,top)) L.push(o); });
    if(L.length>=4) bBauen(top,L); }
  if(lose.length>=2) bBauen(scene,lose,o=>{ const w=o.matrixWorld.elements; return Math.floor(w[12]/24)+','+Math.floor(w[14]/24); });
}
let bT=0;
/* ohne echte Ebenen (Test-Stub) bleibt alles, wie es ist */
function buendelTakt(){ if(BUENDEL.aus) return; if(!scene.layers||!THREE.Matrix4.prototype.determinant){ BUENDEL.aus=true; return; }
  bT++; try{ if(bT%20===0) bWaechter(); if(bT%300===1) bSammeln(); }catch(e){ BUENDEL.aus=true; BUENDEL.fehler=String(e&&e.message||e); } }
let schattenN=0;
function schattenTakt(){
  const R=renderer.shadowMap; if(!R.enabled){ return; }
  R.autoUpdate=false; schattenN++;
  if(GFX==='hoch'||schattenN>=3){ R.needsUpdate=true; schattenN=0; }
}
function renderFrame(dt){
  sonneNachfuehren();
  gruppenTakt();
  buendelTakt();
  schattenTakt();
  if(skyMesh){ skyMesh.position.set(camera.position.x,0,camera.position.z); starPts.position.copy(skyMesh.position); }
  if(!postOK||!postOn){ if(renderer.setRenderTarget) renderer.setRenderTarget(null); renderer.render(scene,camera); return; }
  try{
    postT+=dt||0.016;
    renderer.setRenderTarget(rtScene); renderer.render(scene,camera);
    const bw=rtA.width, bh=rtA.height;
    quadMesh.material=matBright; matBright.uniforms.tDiffuse.value=rtScene.texture;
    renderer.setRenderTarget(rtA); renderer.render(quadScene,quadCam);
    quadMesh.material=matBlur;
    matBlur.uniforms.tDiffuse.value=rtA.texture; matBlur.uniforms.dir.value.set(1/bw,0);
    renderer.setRenderTarget(rtB); renderer.render(quadScene,quadCam);
    matBlur.uniforms.tDiffuse.value=rtB.texture; matBlur.uniforms.dir.value.set(0,1/bh);
    renderer.setRenderTarget(rtA); renderer.render(quadScene,quadCam);
    quadMesh.material=matComp;
    matComp.uniforms.tDiffuse.value=rtScene.texture;
    matComp.uniforms.tBloom.value=rtA.texture;
    matComp.uniforms.time.value=postT;
    renderer.setRenderTarget(null); renderer.render(quadScene,quadCam);
  }catch(e){ postOK=false; if(renderer.setRenderTarget) renderer.setRenderTarget(null); renderer.render(scene,camera); }
}

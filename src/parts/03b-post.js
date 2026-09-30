
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
let schattenN=0;
function schattenTakt(){
  const R=renderer.shadowMap; if(!R.enabled){ return; }
  R.autoUpdate=false; schattenN++;
  if(GFX==='hoch'||schattenN>=3){ R.needsUpdate=true; schattenN=0; }
}
function renderFrame(dt){
  sonneNachfuehren();
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

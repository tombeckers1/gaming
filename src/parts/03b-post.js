
/* =========================================================
   Bildaufbereitung: Bloom, Vignette, Filmkorn
   ========================================================= */
let postOK=false, postOn=true, rtScene=null, rtA=null, rtB=null;
let quadScene=null, quadCam=null, quadMesh=null, matBright=null, matBlur=null, matComp=null;
let postW=0, postH=0, postDiv=4;
const QUAD_V='varying vec2 vUv;\nvoid main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
function initPost(){
  try{
    if(localStorage.getItem('bb_post')==='0') postOn=false;
  }catch(e){}
  try{
    const opt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,stencilBuffer:false,depthBuffer:true};
    const ms=renderer.capabilities&&renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget;
    rtScene=ms?new THREE.WebGLMultisampleRenderTarget(2,2,opt):new THREE.WebGLRenderTarget(2,2,opt);
    if(ms) rtScene.samples=COARSE?2:4;
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
}
function renderFrame(dt){
  sonneNachfuehren();
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

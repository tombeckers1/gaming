/* =========================================================
   Pracht: Realismus fuer Maximum, Ultra und Ultra Extrem (03.10.)

   Tom nach dem ersten Test der drei Stufen: "das sieht alles gleich
   aus ... noch mehr Detailsachen ... dass alles einfach noch
   realistischer aussieht". Mehr Pixel und eine groessere Schattenkarte
   allein sieht man kaum. Was ein Bild echt wirken laesst, ist Licht,
   das sich wie Licht benimmt, und Oberflaechen, die nicht glatt wie
   Plastik sind:

   - UMGEBUNG: der Laden wird beim Laden einmal rundum fotografiert
     (Wuerfelbild mit Mipmaps) und dient allen Materialien als Umgebung.
     Boden, Lack, Metall und Glas spiegeln jetzt die echten Regale und
     Leuchten. Aus demselben Bild eine Lichtsonde: indirektes Licht in
     der Farbe des Raums (ersetzt gut die Haelfte des Himmelslichts).
     Draussen ein eigenes Bild von der Strasse. Jeder Boden glaenzt.
   - RELIEF: jede matte Flaeche bekommt ein feines Oberflaechenrelief
     und schwankenden Glanz - Putzkoernung, Betonporen, Holzporen,
     Buerstenstrich auf Metall, Orangenhaut und Wischspuren auf Lack,
     Fasern im Karton. Gemalt wird es einmal auf der Grafikkarte
     (Maximum 512, Ultra 1024, Extrem 2048 Pixel je Kachel) und
     dreiseitig in Weltkoordinaten aufgelegt - so passt der Massstab
     auf jedem Kasten, ohne dass ein einziges Modell neue UVs braucht.
     Dazu ein grossflaechiges Wolkenmuster gegen die Plastik-Gleichheit.
   - SPIEGELUNG (04.10., Tom: "wie GTA"): die Szene wird zusaetzlich an
     der Bodenebene gespiegelt gezeichnet. Ladenboden (je nach Belag),
     nasse Fahrbahn, Pfuetzen und feuchtes Pflaster zeigen Kunden, Regale,
     Autos, Lampen und Funken als echtes Spiegelbild - verzerrt vom Relief,
     unscharf nach Rauheit. Maximum halbe, Ultra 0,7-fache, Extrem volle
     Aufloesung.
   - VERSCHATTUNG (SSAO) ab Maximum (8 Proben, Ultra 12, beide in halber
     Aufloesung; Extrem 16 in zwei Dritteln): Ecken, Fugen, der Spalt unter dem
     Regal und zwischen den Packungen werden dunkel, wie in echt.
   - SCHATTEN: weiche Filterung; der Ladenstrahler bekommt eine grosse
     Karte.
   - Wandbild in Ultra/Extrem in doppelter Aufloesung, Boden- und
     Wandrelief in voller statt halber.

   Alles, was Shader aendert, passiert nur beim Laden (GFX_START). Zur
   Laufzeit schaltet die Stufe nur Zahlen: Verschattung an/aus,
   Relief an/aus, Sonde, Farbsaettigung. Hoch und darunter bleiben unberuehrt - ohne Pracht
   wird hier nichts angelegt.
   ========================================================= */
/* 0 = Maximum, 1 = Ultra, 2 = Ultra Extrem, -1 = aus (Hoch und darunter,
   Handys: dort ist Canvas- und Grafikspeicher knapp) */
const PRACHT=(()=>{ const i=GFX_STUFEN.indexOf(GFX); let aus=false; try{ aus=localStorage.getItem('bb_pracht')==='0'; }catch(e){} return (HIQ&&!aus&&i>=3)?i-3:-1; })();
const PR={an:PRACHT>=0, det:[512,1024,2048][PRACHT]||0, env:null, envAussen:null, mats:new WeakSet(), liste:[], tex:{}, makro:null,
  sondeK:0.4, hemiK:0.55, aoRT:null, aoRT2:null, spRT:null, spCam:null, nSp:0, spGesehen:new WeakSet(), aoMat:null, aoBlur:null, weiss:null, n:0, takt:0, sig:'', envT:-1, fehler:''};
/* weiche Schatten: Filterart nur beim Laden (Shader), Werte je Stufe */
if(PR.an&&renderer.shadowMap){ renderer.shadowMap.type=THREE.PCFSoftShadowMap; if(shopSpot&&shopSpot.shadow) shopSpot.shadow.mapSize.set(2048,2048); }
/* gemeinsame Werte aller veredelten Materialien: Relief an/aus zur Laufzeit */
const PR_U={an:{value:PR.an?1:0}}; PR.u=PR_U;

/* ---------- Reliefkarten, auf der Grafikkarte gemalt ----------
   RG: Steigung (Normale), B: Hoehe (Hohlraeume dunkler), A: Glanzschwankung.
   Alle Muster sind auf der Kachel periodisch (ganzzahlige Frequenzen). */
const PR_ARTEN=['putz','beton','holz','metall','lack','karton'];
const PR_GLSL=`
float prH(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float prV(vec2 p,vec2 per){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  float a=prH(mod(i,per)), b=prH(mod(i+vec2(1.0,0.0),per)), c=prH(mod(i+vec2(0.0,1.0),per)), d=prH(mod(i+vec2(1.0,1.0),per));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
float prF(vec2 uv,vec2 f0,int oct){ float s=0.0, a=0.5, n=0.0; vec2 f=f0; for(int i=0;i<7;i++){ if(i>=oct) break; s+=a*prV(uv*f,f); n+=a; a*=0.5; f*=2.0; } return s/n; }
float prW(vec2 uv,float F){ vec2 p=uv*F, i=floor(p), f=fract(p); float d=9.0; for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 o=vec2(float(x),float(y)), c=mod(i+o,vec2(F)); vec2 r=vec2(prH(c),prH(c+17.31)); d=min(d,length(o+r-f)); } return d; }
/* Hoehe (x) und Glanz (y) je Art */
vec2 prArt(vec2 uv,int art){
  if(art==0){ /* Putz, matte Farbe: Rollenkorn und flache Buckel */
    float h=0.5*prF(uv,vec2(6.0),5)+0.5*prF(uv,vec2(96.0),3);
    return vec2(h,0.5+(prF(uv+0.37,vec2(3.0),4)-0.5)*0.7); }
  if(art==1){ /* Beton, Estrich: Wolken, Zuschlag, Poren */
    float h=0.45*prF(uv,vec2(5.0),5)+0.3*prF(uv,vec2(128.0),3);
    float w=prW(uv,150.0); h-=0.5*(1.0-smoothstep(0.03,0.11,w));
    float w2=prW(uv+0.21,40.0); h-=0.25*(1.0-smoothstep(0.02,0.07,w2));
    return vec2(h,0.5+(prF(uv+0.61,vec2(3.0),5)-0.5)*1.0); }
  if(art==2){ /* Holz: Jahresringe laengs, Poren */
    float war=prF(uv,vec2(2.0,8.0),4);
    float r=uv.y*36.0+war*7.0; float ring=pow(abs(sin(r*3.14159)),4.0);
    float po=prV(uv*vec2(48.0,768.0),vec2(48.0,768.0));
    float h=0.55-0.25*ring-0.25*smoothstep(0.6,0.95,po);
    return vec2(h,0.5+ring*0.25+(prF(uv,vec2(4.0),3)-0.5)*0.3); }
  if(art==3){ /* Metall, gebuerstet: feine Laengsstriche */
    float h=0.6*prV(uv*vec2(6.0,1536.0),vec2(6.0,1536.0))+0.4*prV(uv*vec2(24.0,3072.0),vec2(24.0,3072.0));
    float s=prV(uv*vec2(2.0,256.0),vec2(2.0,256.0));
    return vec2(h,0.5+(s-0.5)*0.8+(prF(uv,vec2(3.0),3)-0.5)*0.5); }
  if(art==4){ /* Lack, Kunststoff: Orangenhaut, Wischspuren, feine Kratzer */
    float h=prF(uv,vec2(40.0),3);
    float k=0.0; for(int i=0;i<3;i++){ vec2 d=i==0?vec2(1.0,2.0):(i==1?vec2(3.0,-1.0):vec2(-2.0,3.0)); vec2 q=vec2(dot(uv,d)*1.0, dot(uv,vec2(-d.y,d.x))*1.0);
      float l=prV(vec2(q.x*7.0,q.y*900.0),vec2(7.0,900.0)); k+=smoothstep(0.93,0.99,l)*smoothstep(0.3,0.7,prV(q*vec2(4.0,6.0),vec2(4.0,6.0))); }
    return vec2(h,0.5+(prF(uv+0.5,vec2(2.0),5)-0.5)*1.1+k*0.6); }
  /* Karton: Fasern kreuz und quer, leichte Dellen */
  float f1=prV(vec2(uv.x*24.0,uv.y*700.0),vec2(24.0,700.0)), f2=prV(vec2(dot(uv,vec2(1.0,1.0))*500.0,dot(uv,vec2(-1.0,1.0))*20.0),vec2(500.0,20.0)), f3=prV(vec2(dot(uv,vec2(1.0,-1.0))*16.0,dot(uv,vec2(1.0,1.0))*600.0),vec2(16.0,600.0));
  float h=0.45*prF(uv,vec2(8.0),4)+0.55*(f1+f2+f3)/3.0;
  return vec2(h,0.5+(prF(uv+0.3,vec2(4.0),4)-0.5)*0.5);
}`;
function prKarten(){
  if(PR.tex.putz) return;
  const N=PR.det, q=new THREE.Scene(), cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const m=new THREE.ShaderMaterial({uniforms:{art:{value:0},px:{value:1/N},k:{value:1}},
    vertexShader:'varying vec2 vUv;\nvoid main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader:'uniform int art;\nuniform float px;\nuniform float k;\nvarying vec2 vUv;\n'+PR_GLSL+`
void main(){ vec2 a=prArt(vUv,art);
  float hx=(prArt(vUv+vec2(px,0.0),art).x-a.x)*2.0, hy=(prArt(vUv+vec2(0.0,px),art).x-a.x)*2.0;
  vec2 g=clamp(vec2(hx,hy)*k*0.5+0.5,0.0,1.0);
  gl_FragColor=vec4(g,clamp(a.x,0.0,1.0),clamp(a.y,0.0,1.0)); }`,depthTest:false,depthWrite:false});
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),m); quad.frustumCulled=false; q.add(quad);
  /* Steigung je Art auf den Wertebereich gestreckt: feine Muster haben
     kleine Hoehenspruenge je Pixel, also mehr Verstaerkung */
  const K={putz:24,beton:16,holz:14,metall:5,lack:30,karton:10};
  const mk=(n)=>{ const rt=new THREE.WebGLRenderTarget(n,n,{minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false,wrapS:THREE.RepeatWrapping,wrapT:THREE.RepeatWrapping});
    rt.texture.generateMipmaps=true; rt.texture.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():8); return rt; };
  const alt=renderer.getRenderTarget();
  PR_ARTEN.forEach((a,i)=>{ const rt=mk(N); m.uniforms.art.value=i; m.uniforms.k.value=K[a]*N/1024; m.uniforms.px.value=1/N;
    renderer.setRenderTarget(rt); renderer.render(q,cam); PR.tex[a]=rt.texture; PR.liste.push(rt); });
  /* Grossflaechige Wolken (Helligkeit, Glanz) */
  { const rt=mk(512); m.fragmentShader='varying vec2 vUv;\n'+PR_GLSL+'\nvoid main(){ gl_FragColor=vec4(prF(vUv,vec2(3.0),6),prF(vUv+0.43,vec2(5.0),6),prF(vUv+0.71,vec2(12.0),4),1.0); }';
    m.needsUpdate=true; renderer.setRenderTarget(rt); renderer.render(q,cam); PR.makro=rt.texture; PR.liste.push(rt); }
  renderer.setRenderTarget(alt); m.dispose(); quad.geometry.dispose();
}

/* ---------- Materialien veredeln ---------- */
/* Je Art: Kachel in m, Relief, Glanzschwankung, Hohlraum-Abdunklung,
   Wolken (Farbe, Glanz), Umgebungs-Spiegelung */
const PR_ART={
  putz:  {t:0.9, n:0.30,r:0.30,c:0.12,mc:0.08,mr:0.25,env:0.30},
  beton: {t:1.8, n:0.40,r:0.55,c:0.22,mc:0.14,mr:0.40,env:0.35},
  holz:  {t:1.1, n:0.25,r:0.35,c:0.14,mc:0.06,mr:0.20,env:0.35},
  metall:{t:0.45,n:0.10,r:0.55,c:0.04,mc:0.05,mr:0.35,env:1.0},
  lack:  {t:0.8, n:0.03,r:0.45,c:0.00,mc:0.04,mr:0.30,env:0.6},
  karton:{t:0.55,n:0.20,r:0.30,c:0.18,mc:0.06,mr:0.20,env:0.25},
  druck: {t:0.35,n:0.10,r:0.30,c:0.06,mc:0.00,mr:0.15,env:0.45, tx:'karton'},
  boden: {t:1.6, n:0.05,r:0.50,c:0.10,mc:0.08,mr:0.45,env:1.0, tx:'beton'},
  wand:  {t:0.9, n:0.22,r:0.20,c:0.08,mc:0.06,mr:0.20,env:0.3, tx:'putz'}
};
/* Art eines Materials: Markierung (userData.pr) geht vor, sonst nach Eigenschaften */
function prArtVon(m,o){
  if(m.userData&&m.userData.pr!==undefined) return m.userData.pr||null;
  if(!(m.isMeshStandardMaterial)) return null;
  if(m===floorMat) return 'boden';
  if(m===shopWall) return 'wand';
  if(m.transparent&&m.opacity<0.95) return null;
  /* eigenes Spiegelbild oder eigenes Relief (Autos, Glas): nicht anfassen */
  if(m.envMap||m.bumpMap||m.isMeshPhysicalMaterial) return null;
  if(m.alphaMap||m.flatShading) return null;
  /* Leuchten, Bildschirme */
  if(m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)*(m.emissiveIntensity||1)>0.6) return null;
  if(m.map){
    if(o&&o.isInstancedMesh) return 'druck';
    if(m.normalMap) return null;
    if(m.metalness>=0.45) return 'metall';
    /* nur wirklich stumpfe Druckbilder sind Karton/Papier; bedrucktes Blech,
       Schilder und Folien sind glatt */
    return m.roughness>=0.85?'karton':(m.roughness<0.7||m.metalness>0.15?'lack':'putz');
  }
  const c=m.color, mx=Math.max(c.r,c.g,c.b), mn=Math.min(c.r,c.g,c.b), sat=mx>0?(mx-mn)/mx:0;
  if(m.metalness>=0.45) return 'metall';
  /* braun (linear: r > g > b, deutlich gesaettigt) */
  if(c.r>c.g&&c.g>c.b&&sat>0.35&&m.roughness>0.3&&mx<0.75) return m.roughness>0.75&&sat<0.6?'karton':'holz';
  /* zusammengefasste Moebel (Regalgestelle, Theken) tragen ihre Farben je
     Ecke: lackiertes Blech und Schichtstoff, glatt */
  if(m.vertexColors&&m.roughness<0.85) return 'lack';
  /* kraeftige Farbe (Regalstaender blau, Traversen orange): lackiertes Blech */
  if(sat>0.45&&m.roughness<0.9) return 'lack';
  if(m.roughness<0.65) return 'lack';
  if(m.roughness>=0.8&&sat<0.15) return 'beton';
  return 'putz';
}
const PR_VS_KOPF='varying vec3 vPrW;\nvarying vec3 vPrN;\n';
const PR_VS=`
  { vec4 prW=vec4(transformed,1.0);
  #ifdef USE_INSTANCING
    prW=instanceMatrix*prW;
  #endif
    prW=modelMatrix*prW; vPrW=prW.xyz; vPrN=inverseTransformDirection(transformedNormal,viewMatrix); }`;
const PR_FS_KOPF='varying vec3 vPrW;\nvarying vec3 vPrN;\n', PR_FS_RELIEF='uniform sampler2D prTex;\nuniform sampler2D prMakro;\nuniform vec4 prA;\nuniform vec4 prB;\nuniform float prAn;\n';
const PR_FS=`
  if(prAn>0.5){
    vec3 prN=normalize(vPrN); vec3 bw=pow(abs(prN),vec3(4.0)); bw/=dot(bw,vec3(1.0));
    vec3 pw=vPrW*prA.x;
    vec4 tx=texture2D(prTex,pw.zy), ty=texture2D(prTex,pw.xz), tz=texture2D(prTex,pw.xy);
    vec4 pd=tx*bw.x+ty*bw.y+tz*bw.z;
    vec2 gx=tx.xy*2.0-1.0, gy=ty.xy*2.0-1.0, gz=tz.xy*2.0-1.0;
    vec3 dW=bw.x*vec3(0.0,gx.y,gx.x)+bw.y*vec3(gy.x,0.0,gy.y)+bw.z*vec3(gz.x,gz.y,0.0);
    normal=normalize(normal+mat3(viewMatrix)*dW*prA.y);
    roughnessFactor=clamp(roughnessFactor*(1.0+(pd.a-0.5)*2.0*prA.z),0.04,1.0);
    diffuseColor.rgb*=1.0-prA.w*(1.0-pd.b)*1.4;
    vec3 pm=vPrW*0.13;
    vec4 mk=texture2D(prMakro,pm.zy)*bw.x+texture2D(prMakro,pm.xz)*bw.y+texture2D(prMakro,pm.xy)*bw.z;
    diffuseColor.rgb*=1.0+(mk.r-0.5)*2.0*prB.x+(mk.b-0.5)*prB.x;
    roughnessFactor=clamp(roughnessFactor*(1.0+(mk.g-0.5)*2.0*prB.y),0.04,1.0);
  }`;
/* ---------- Spiegelung am Boden (ab Maximum) ----------
   Ein Wuerfelbild spiegelt nur ungefaehr - Kunden, Autos, Funken und alles,
   was sich bewegt, fehlen darin, und die Lage stimmt nur am Aufnahmepunkt.
   Darum wird die Szene zusaetzlich von unten gespiegelt gezeichnet
   (Kamera an der Bodenebene gespiegelt, schraege Nahebene schneidet alles
   unter dem Boden weg) - wie GTA es auf nassem Asphalt und poliertem
   Boden macht. Boden, Fahrbahn und Pfuetzen holen ihre Spiegelung dann aus
   diesem Bild statt aus dem Wuerfel: verzerrt durch ihr Relief, unscharf
   nach Rauheit (Mipmaps), gewichtet wie jede Spiegelung in three (Fresnel,
   Rauheit). Maximum in halber, Ultra in 0,7-facher, Extrem in voller
   Aufloesung. */
const PR_SP_H=0.009;             /* Hoehe der Spiegelebene (Ladenboden 0,012, Fahrbahn 0,004) */
const PR_SP={t:{value:null}, m:{value:new THREE.Matrix4()}, k:{value:0}, s:{value:1}}; PR.sp=PR_SP;
const PR_FS_SPIEGEL='uniform sampler2D prSpT;\nuniform mat4 prSpM;\nuniform float prSpK;\nuniform float prSpS;\nuniform vec4 prSpP;\n';
/* prSpP je Material: x Lackschicht (0 = nur die Spiegelung im normalen
   Glanz, 1 = polierter Stein/Pfuetze: das Spiegelbild deckt nach Fresnel
   auch die helle Grundfarbe ab - erst dann sieht man auf hellem Boden die
   dunklen Beine der Kunden), y Unschaerfe (Rauheit der Lackschicht,
   <0: Rauheit des Materials), z Grundreflexion F0 */
const PR_FS_SP=`
  vec3 prSpF=vec3(0.0); float prSpL=0.0;
  if(prSpK>0.0&&vPrW.y<0.05){
    vec3 spN=inverseTransformDirection(normal,viewMatrix);
    float spW=prSpK*smoothstep(0.86,0.97,spN.y);
    if(spW>0.0){
      vec4 spC=prSpM*vec4(vPrW,1.0); vec2 spUv=spC.xy/spC.w;
      /* Relief und Pfuetzenwellen verzerren das Spiegelbild */
      spUv+=spN.xz*vec2(0.035,-0.035);
      spW*=smoothstep(0.0,0.04,spUv.x)*smoothstep(1.0,0.96,spUv.x)*smoothstep(0.0,0.04,spUv.y)*smoothstep(1.0,0.96,spUv.y);
      float spR=(prSpP.y>=0.0?prSpP.y:material.specularRoughness)*prSpS;
      /* Unschaerfe nach Rauheit: Mipmap-Stufe */
      prSpF=texture2D(prSpT,spUv,clamp(spR*spR*14.0+spR*3.0,0.0,9.0)-0.5).rgb;
      radiance=mix(radiance,prSpF,spW);
      float spNV=clamp(dot(geometry.normal,geometry.viewDir),0.0,1.0);
      prSpL=spW*prSpP.x*(prSpP.z+(1.0-prSpP.z)*pow(1.0-spNV,5.0));
    }
  }`;
/* ein und dieselbe Funktion fuer alle: die Werte haengen am Material, der
   Programmschluessel nennt die Bausteine (Relief, Spiegel) */
function prKey(){ return 'pracht|'+(this.userData.prU?'r':'')+(this.userData.prSp?'s':''); }
function prOBC(sh){
  const u=this.userData.prU, sp=this.userData.prSp; if(!u&&!sp) return;
  let kopf=PR_FS_KOPF;
  if(u){ Object.assign(sh.uniforms,u); kopf+=PR_FS_RELIEF; }
  if(sp){ sh.uniforms.prSpT=PR_SP.t; sh.uniforms.prSpM=PR_SP.m; sh.uniforms.prSpK=PR_SP.k; sh.uniforms.prSpS=PR_SP.s; sh.uniforms.prSpP=this.userData.prSpP; kopf+=PR_FS_SPIEGEL; }
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+PR_VS_KOPF).replace('#include <worldpos_vertex>','#include <worldpos_vertex>'+PR_VS);
  let fs=sh.fragmentShader.replace('#include <common>','#include <common>\n'+kopf);
  if(u) fs=fs.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>'+PR_FS);
  if(sp) fs=fs.replace('#include <lights_fragment_end>',PR_FS_SP+'\n#include <lights_fragment_end>').replace('#include <tonemapping_fragment>','gl_FragColor.rgb=mix(gl_FragColor.rgb,prSpF,prSpL);\n#include <tonemapping_fragment>');
  sh.fragmentShader=fs;
}
function prAnbinden(m){ m.onBeforeCompile=prOBC; m.customProgramCacheKey=prKey; m.needsUpdate=true; }
/* fremde Shader-Erweiterung? Dann nicht anfassen */
const prFremd=m=>m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile&&m.onBeforeCompile!==prOBC;
function prVeredeln(m,o){
  if(PR.mats.has(m)) return; PR.mats.add(m);
  const art=prArtVon(m,o); if(!art) return;
  const a=PR_ART[art], tx=PR.tex[a.tx||art]; if(!tx) return;
  if(prFremd(m)) return;
  m.userData.prArt=art;
  m.userData.prU={prTex:{value:tx},prMakro:{value:PR.makro},prA:{value:new THREE.Vector4(1/a.t,a.n,a.r,a.c)},prB:{value:new THREE.Vector4(a.mc,a.mr,0,0)},prAn:PR_U.an};
  if(!m.envMap){ m.envMapIntensity=a.env; m.userData.prEnv=a.env; }
  prAnbinden(m); PR.n++;
}
/* Lackschicht des Ladenbodens nach Belag: Marmor und geschliffener Beton
   spiegeln klar, versiegelter Estrich etwas weicher, Teppich gar nicht (05o ruft das
   beim Verlegen auf) */
function prBodenGlanz(){
  const P=floorMat&&floorMat.userData.prSpP; if(!P) return;
  let f=FLOORS[0]; try{ if(typeof S!=='undefined'&&S) f=floorSet(); }catch(e){}
  const rau=f.rau!==undefined?f.rau:0.6;
  if(f.art==='velours') P.value.set(0,-1,0.04,0);
  else P.value.set(clamp(0.75+(f.glanz||0)*0.6,0.75,1),clamp(rau*0.18,0.03,0.15),0.05+(f.glanz||0)*0.06,0);
}
/* Boden fuer die Spiegelung: flach, waagrecht, auf Hoehe der Ebene */
const _prB=new THREE.Box3(), _prS=new THREE.Vector3();
function prSpiegelPruefen(m,o){
  if(!PR.spRT||m.userData.prSp!==undefined||o.isInstancedMesh||!m.isMeshStandardMaterial||prFremd(m)||PR.spGesehen.has(o)) return;
  PR.spGesehen.add(o);
  const g=o.geometry; if(!g||!g.attributes||!g.attributes.position) return;
  if(!g.boundingBox) g.computeBoundingBox();
  _prB.copy(g.boundingBox).applyMatrix4(o.matrixWorld); _prB.getSize(_prS);
  if(_prS.y<0.03&&_prB.max.y<0.05&&_prB.min.y>-0.03&&_prS.x*_prS.z>0.5){
    m.userData.prSp=1; m.userData.prSpP={value:new THREE.Vector4(0,-1,0.04,0)}; PR.nSp++;
    /* Ladenboden: nach Belag (prBodenGlanz); Fahrbahn: nass vom
       Schmelzwasser; Pfuetzen: Wasser */
    if(m===floorMat) prBodenGlanz();
    else if(typeof _asphN!=='undefined'&&_asphN&&m.normalMap===_asphN) m.userData.prSpP.value.set(0.45,0.3,0.03,0);
    else if(m.alphaMap&&m.roughnessMap&&m.transparent) m.userData.prSpP.value.set(1,-1,0.03,0);
    /* sonstiger rauer Boden draussen (Pflaster am Testfeld, Hof): feucht wie
       die Fahrbahn - nachts spiegeln sich Lampen, Zaun und Funken darin.
       Gras und Laub (gruenlich) bleiben trocken */
    else if(m.roughness>=0.8&&!(m.color.g>m.color.r*1.08&&m.color.g>m.color.b)) m.userData.prSpP.value.set(0.55,0.16,0.03,0);
    prAnbinden(m); }
}
/* Innen oder aussen? Die Gebaeude nach LAY */
function prDrinnen(x,z){
  for(const k of ['shop','lager','lwest','schleuse','lw2']){ const r=LAY[k]; if(r&&x>r.x0-0.3&&x<r.x1+0.3&&z>r.z0-0.3&&z<r.z1+0.3) return true; }
  return false;
}
const _prV=new THREE.Vector3();
function prMaterialien(wurzel){
  const aussen=new Map();
  (wurzel||scene).traverse(o=>{ if(!(o.isMesh||o.isInstancedMesh)||o.isSkinnedMesh) return;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    for(const m of ms){ if(!m) continue; prVeredeln(m,o); prSpiegelPruefen(m,o);
      if(PR.envAussen&&m.userData.prEnv!==undefined&&!m.userData.prOrt){ const g=o.geometry; if(g&&!g.boundingSphere&&g.computeBoundingSphere) g.computeBoundingSphere(); if(g&&g.boundingSphere) _prV.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld); else o.getWorldPosition(_prV); const d=prDrinnen(_prV.x,_prV.z), e=aussen.get(m)||{i:0,a:0}; d?e.i++:e.a++; aussen.set(m,e); } } });
  /* nur draussen benutzt: Spiegelbild der Strasse statt des Ladens */
  for(const [m,e] of aussen){ m.userData.prOrt=e.a>e.i?'aussen':'innen'; if(m.userData.prOrt==='aussen'&&!m.envMap){ m.envMap=PR.envAussen; m.needsUpdate=true; } }
}

/* ---------- Umgebung: der Laden als Spiegelbild ---------- */
/* Wuerfelbild mit Kamera an einem Punkt im Laden, Mipmaps fuer raue
   Flaechen. (PMREM aus three ergab in der Pruefung mit SwiftShader nur
   Schwarz - RGBE-Atlas mit Exponenten bis 2^127; das schlichte Wuerfelbild
   ist robust.) Aufgenommen wird mit den normalen Shadern (gleiches Format
   wie das Szenenbild), es entsteht also kein einziger neuer Shader.
   Zwei Puffer im Wechsel: Materialien lesen den einen, waehrend der
   andere neu belichtet wird - nie dasselbe Bild lesen und beschreiben. */
function prWuerfel(){ const n=PRACHT>=1?256:128;
  return new THREE.WebGLCubeRenderTarget(n,{format:THREE.RGBAFormat,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter}); }
function prFoto(rt,x,y,z,fern){
  const cc=new THREE.CubeCamera(0.1,fern,rt); cc.position.set(x,y,z); scene.add(cc);
  const altSky=skyMesh?skyMesh.position.clone():null; if(skyMesh) skyMesh.position.set(x,0,z);
  renderer.shadowMap.needsUpdate=true;
  const spK=PR_SP.k.value, spT=PR_SP.t.value; PR_SP.k.value=0; PR_SP.t.value=PR.schwarz||null;
  try{ cc.update(renderer,scene); }catch(e){ PR.fehler='env '+e.message; }
  PR_SP.k.value=spK; PR_SP.t.value=spT;
  scene.remove(cc); if(skyMesh&&altSky) skyMesh.position.copy(altSky); renderer.shadowMap.needsUpdate=true;
  return rt.texture;
}
/* Indirektes Licht aus dem Raum: three (r128) nimmt aus einem Wuerfelbild
   nur Spiegelungen, kein diffuses Licht. Das Bild wird darum klein
   ausgerollt (64 x 32), ausgelesen und in eine Lichtsonde (Kugelfunktionen
   2. Grades) umgerechnet - sie hellt jede Flaeche in der Farbe auf, die der
   Raum in ihre Richtung wirft. Kostet im Shader nichts (die Sonde ist
   immer da, nur sonst leer). */
function prLichtsonde(env){
  const W=64, H=32;
  if(!PR.sondeRT){ PR.sondeRT=new THREE.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false});
    PR.sondeMat=new THREE.ShaderMaterial({uniforms:{t:{value:null}},vertexShader:QUAD_V,
      fragmentShader:'uniform samplerCube t;\nvarying vec2 vUv;\nvoid main(){ float ph=vUv.x*6.2831853-3.1415927, th=(1.0-vUv.y)*3.1415927; vec3 d=vec3(sin(th)*sin(ph),cos(th),sin(th)*cos(ph)); gl_FragColor=vec4(textureCube(t,d,3.0).rgb,1.0); }',depthTest:false,depthWrite:false});
    PR.sonde=new THREE.LightProbe(); PR.sonde.intensity=0; scene.add(PR.sonde); }
  PR.sondeMat.uniforms.t.value=env; const altM=quadMesh.material; quadMesh.material=PR.sondeMat;
  renderer.setRenderTarget(PR.sondeRT); renderer.render(quadScene,quadCam); quadMesh.material=altM;
  const px=new Uint8Array(W*H*4); renderer.readRenderTargetPixels(PR.sondeRT,0,0,W,H,px); renderer.setRenderTarget(null);
  const sh=new THREE.SphericalHarmonics3(), b=new Array(9), d=new THREE.Vector3(), c=new THREE.Color(); let wsum=0;
  for(let y=0;y<H;y++){ const v=(y+0.5)/H, th=(1-v)*Math.PI, st=Math.sin(th);
    for(let x=0;x<W;x++){ const ph=(x+0.5)/W*Math.PI*2-Math.PI; d.set(st*Math.sin(ph),Math.cos(th),st*Math.cos(ph));
      const i=(y*W+x)*4; c.setRGB(px[i]/255,px[i+1]/255,px[i+2]/255);
      THREE.SphericalHarmonics3.getBasisAt(d,b); for(let k=0;k<9;k++){ sh.coefficients[k].x+=b[k]*c.r*st; sh.coefficients[k].y+=b[k]*c.g*st; sh.coefficients[k].z+=b[k]*c.b*st; } wsum+=st; } }
  sh.scale(4*Math.PI/wsum); PR.sonde.sh.copy(sh); PR.sondeMittel=[sh.coefficients[0].x,sh.coefficients[0].y,sh.coefficients[0].z].map(v=>+(v*0.282095).toFixed(3));
}
function prUmgebung(){
  if(!PR.an) return;
  const alt=renderer.getRenderTarget();
  /* draussen nur einmal: die Strasse aendert sich kaum */
  if(!PR.envAussen){ PR.wA=prWuerfel(); PR.envAussen=prFoto(PR.wA,4,1.7,11.5,300); }
  if(!PR.wI) PR.wI=[prWuerfel(),prWuerfel()];
  const frei=PR.wI[0].texture===PR.env?PR.wI[1]:PR.wI[0];
  const t=prFoto(frei,2.2,1.75,0.4,90);
  const altEnv=PR.env; PR.env=t; scene.environment=t;
  try{ prLichtsonde(t); }catch(e){ PR.fehler='sonde '+e.message; }
  /* Materialien mit fester Umgebung (Boden, Wand) umhaengen */
  if(altEnv) scene.traverse(o=>{ if(!o.material) return; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m&&m.envMap===altEnv) m.envMap=t; }); });
  renderer.setRenderTarget(alt);
  PR.envT=performance.now();
}
/* nach dem Bau der Welt (22-start) */
function prachtAufbau(){
  if(!PR.an) return;
  try{
    const t0=performance.now();
    const z=[performance.now()]; prKarten(); z.push(performance.now()); prUmgebung(); z.push(performance.now()); prMaterialien(); z.push(performance.now());
    PR.ms=Math.round(z[3]-t0); PR.zeiten={karten:Math.round(z[1]-z[0]),umgebung:Math.round(z[2]-z[1]),materialien:Math.round(z[3]-z[2])};
    if(typeof console!=='undefined') console.log('PRACHT aufgebaut: '+PR.n+' Materialien, '+PR.ms+' ms');
  }catch(e){ PR.fehler=String(e&&e.message||e); PR.an=false; }
}
/* laufend: neue Materialien (Kunden, Ware, Regale) aufnehmen; Spiegelbild
   bei groesseren Umbauten neu (Regale gekauft, Bereiche geoeffnet) */
function prachtTakt(){
  if(!PR.an) return;
  PR_U.an.value=GFX_STUFEN.indexOf(GFX)>=3?1:0;
  if(PR.sonde) PR.sonde.intensity=PR_U.an.value*PR.sondeK;
  /* Die Sonde ersetzt einen Teil des Himmelslichts (applyTOD setzt es neu,
     hier wird jeder neue Wert einmal gedaempft) */
  if(typeof hemi!=='undefined'){ if(hemi.intensity!==PR.hemiGesetzt) PR.hemiRoh=hemi.intensity; hemi.intensity=PR.hemiGesetzt=PR.hemiRoh*(PR_U.an.value?PR.hemiK:1); }
  /* etwas kraeftigere Farben ab Maximum (nur ein Zahlenwert) */
  if(matComp&&matComp.uniforms.sat) matComp.uniforms.sat.value=PR_U.an.value?1.12:1.07;
  if(++PR.takt%90===0){ try{ prMaterialien(); }catch(e){ PR.fehler=String(e&&e.message||e); } }
  if(PR.takt%600===300&&typeof shelves!=='undefined'){ const sig=shelves.length+'|'+(typeof racks!=='undefined'?racks.length:0)+'|'+(typeof S!=='undefined'&&S&&S.up?Object.keys(S.up).length:0);
    if(sig!==PR.sig){ PR.sig=sig; prUmgebung(); } }
  /* Tageslicht im Spiegelbild der Strasse */
  if(PR.envAussen&&typeof sun!=='undefined'){ const f=clamp(sun.intensity/1.65,0.08,1); if(Math.abs(f-(PR.tag||0))>0.02){ PR.tag=f; prAussenHell(f); } }
}
function prAussenHell(f){ scene.traverse(o=>{ if(!o.material) return; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m&&m.userData.prOrt==='aussen'&&m.userData.prEnv!==undefined) m.envMapIntensity=m.userData.prEnv*f; }); }); }

/* ---------- Verschattung (SSAO) ---------- */
/* Tiefe aus dem Szenenbild: three loest beim Mehrfachabtasten auch die
   Tiefe in eine Tiefentextur auf */
function prachtRT(rt){
  if(!PR.an||!rt||!THREE.DepthTexture) return;
  try{ rt.depthTexture=new THREE.DepthTexture(); rt.depthTexture.type=THREE.UnsignedIntType; rt.depthTexture.format=THREE.DepthFormat; }catch(e){ PR.fehler='depth '+e.message; }
}
function prachtPost(){
  if(!PR.an||!rtScene||!rtScene.depthTexture) return;
  const o={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false};
  if(postHalf&&THREE.HalfFloatType) o.type=THREE.HalfFloatType;
  PR.aoRT=new THREE.WebGLRenderTarget(2,2,o); PR.aoRT2=new THREE.WebGLRenderTarget(2,2,o);
  const N=[8,12,16][PRACHT];
  PR.aoMat=new THREE.ShaderMaterial({defines:{N:N},
    uniforms:{tD:{value:rtScene.depthTexture},px:{value:new THREE.Vector2()},pInv:{value:new THREE.Vector2()},near:{value:0.2},far:{value:300},rad:{value:0.55},staerke:{value:1.0},p11:{value:1}},
    vertexShader:QUAD_V,
    fragmentShader:`uniform sampler2D tD; uniform vec2 px; uniform vec2 pInv; uniform float near; uniform float far; uniform float rad; uniform float staerke; uniform float p11;
varying vec2 vUv;
float tiefe(vec2 uv){ float d=texture2D(tD,uv).x; return (2.0*near*far)/((far+near)-(d*2.0-1.0)*(far-near)); }
vec3 lage(vec2 uv){ float z=tiefe(uv); return vec3((uv*2.0-1.0)*pInv*z,-z); }
void main(){
  float d0=texture2D(tD,vUv).x; if(d0>=0.99999){ gl_FragColor=vec4(1.0); return; }
  vec3 p=lage(vUv);
  vec3 r=lage(vUv+vec2(px.x,0.0)), l=lage(vUv-vec2(px.x,0.0)), u=lage(vUv+vec2(0.0,px.y)), d=lage(vUv-vec2(0.0,px.y));
  vec3 dx=abs(r.z-p.z)<abs(p.z-l.z)?r-p:p-l, dy=abs(u.z-p.z)<abs(p.z-d.z)?u-p:p-d;
  vec3 n=normalize(cross(dx,dy));
  float z=-p.z, ruv=rad*p11*0.5/z;
  float rot=6.2831*fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(0.06711056,0.00583715))));
  float ao=0.0;
  for(int i=0;i<N;i++){ float t=(float(i)+0.5)/float(N); float a=rot+t*6.2831*3.0; vec2 off=vec2(cos(a),sin(a))*t*ruv; off.x*=px.x/px.y;
    vec3 q=lage(vUv+off), v=q-p; float vv=dot(v,v), vn=dot(v,n);
    float f=max(rad*rad-vv,0.0)/(rad*rad);
    /* Winkel-Schwelle: Punkte fast in der eigenen Ebene zaehlen nicht - sonst
       verschattet sich eine schraeg gesehene Wand selbst (Streifen) */
    ao+=f*max(vn/(sqrt(vv)+0.0001)-0.2,0.0); }
  ao=pow(clamp(1.0-staerke*ao*1.6/float(N),0.0,1.0),1.3);
  ao=mix(ao,1.0,smoothstep(35.0,70.0,z));
  gl_FragColor=vec4(ao,z/far,0.0,1.0);
}`,depthTest:false,depthWrite:false});
  PR.aoBlur=new THREE.ShaderMaterial({uniforms:{tA:{value:null},dir:{value:new THREE.Vector2()},far:{value:300}},vertexShader:QUAD_V,
    fragmentShader:`uniform sampler2D tA; uniform vec2 dir; uniform float far; varying vec2 vUv;
void main(){ vec2 c=texture2D(tA,vUv).xy; float s=c.x, w=1.0;
  for(int i=-3;i<=3;i++){ if(i==0) continue; vec2 q=texture2D(tA,vUv+dir*float(i)*1.5).xy; float k=exp(-float(i*i)/8.0)*max(0.0,1.0-abs(q.y-c.y)*far/(0.06+c.y*far*0.04)); s+=q.x*k; w+=k; }
  gl_FragColor=vec4(s/w,c.y,0.0,1.0); }`,depthTest:false,depthWrite:false});
  PR.weiss=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat); PR.weiss.needsUpdate=true;
  PR.schwarz=new THREE.DataTexture(new Uint8Array([0,0,0,255]),1,1,THREE.RGBAFormat); PR.schwarz.needsUpdate=true;
  /* Spiegelbild des Bodens (siehe oben, PR_SP) */
  { const so={minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false,generateMipmaps:true};
    if(postHalf&&THREE.HalfFloatType) so.type=THREE.HalfFloatType;
    PR.spRT=new THREE.WebGLRenderTarget(2,2,so); PR.spRT.texture.generateMipmaps=true;
    PR.spCam=new THREE.PerspectiveCamera(); PR_SP.t.value=PR.schwarz; prSpHilfen(); }
  /* das Szenenbild mit Verschattung mischen: nur die Bildzusammenfuehrung
     dieser Stufe bekommt die Zeile, Hoch bleibt Zeichen fuer Zeichen gleich */
  matComp.uniforms.tAO={value:PR.weiss}; matComp.uniforms.aoAn={value:0};
  matComp.fragmentShader=matComp.fragmentShader.replace('uniform float time;','uniform float time;\nuniform sampler2D tAO;\nuniform float aoAn;')
    .replace('col+=texture2D(tBloom,uv).rgb*bloom;','{ float ao=texture2D(tAO,uv).x; float lh=dot(col,vec3(0.2126,0.7152,0.0722)); col*=mix(1.0,ao,aoAn*(1.0-smoothstep(0.9,2.5,lh))); }\n  col+=texture2D(tBloom,uv).rgb*bloom;');
  matComp.needsUpdate=true;
  prachtGroesse();
}
function prachtGroesse(){
  if(!PR.aoRT) return;
  /* Ultra: halbe Aufloesung, Extrem: zwei Drittel */
  const f=PRACHT>=2?0.66:0.5, w=Math.max(2,Math.floor(postW*f)), h=Math.max(2,Math.floor(postH*f));
  PR.aoRT.setSize(w,h); PR.aoRT2.setSize(w,h);
  if(PR.spRT){ const g=[0.5,0.7,1][PRACHT]; PR.spRT.setSize(Math.max(2,Math.floor(postW*g)),Math.max(2,Math.floor(postH*g))); }
}
/* vor dem Szenenbild: die Welt an der Bodenebene gespiegelt zeichnen
   (Vorgehen wie THREE.Reflector: gespiegelte Kamera mit richtig
   herum stehendem Bild, schraege Nahebene an der Spiegelebene) */
/* Hilfswerte erst beim Anlegen (prachtPost): der Logik-Stub der Tests kennt Plane/Vector4 nicht */
let _spV,_spZ,_spL,_spN,_spR,_spE,_spC,_spQ,_spP;
function prSpHilfen(){ _spV=new THREE.Vector3(); _spZ=new THREE.Vector3(); _spL=new THREE.Vector3(); _spN=new THREE.Vector3(0,1,0); _spR=new THREE.Matrix4();
  _spE=new THREE.Plane(); _spC=new THREE.Vector4(); _spQ=new THREE.Vector4(); _spP=new THREE.Vector3(0,PR_SP_H,0); }
function prachtSpiegel(){
  const an=GFX_STUFEN.indexOf(GFX)>=3;
  PR_SP.k.value=0; PR_SP.t.value=PR.schwarz;
  if(!an||camera.position.y<PR_SP_H+0.05) return;
  const C=PR.spCam; camera.updateMatrixWorld();
  /* Augpunkt und Blickziel an y=H spiegeln */
  _spV.setFromMatrixPosition(camera.matrixWorld); _spV.y=2*PR_SP_H-_spV.y;
  _spR.extractRotation(camera.matrixWorld);
  _spL.set(0,0,-1).applyMatrix4(_spR); _spZ.setFromMatrixPosition(camera.matrixWorld).add(_spL); _spZ.y=2*PR_SP_H-_spZ.y;
  C.position.copy(_spV); C.up.set(0,1,0).applyMatrix4(_spR).reflect(_spN); C.lookAt(_spZ);
  C.near=camera.near; C.far=Math.min(camera.far,400); C.updateMatrixWorld();
  C.projectionMatrix.copy(camera.projectionMatrix); C.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  C.layers.mask=camera.layers.mask;
  /* Bildmatrix fuer die Materialien: Welt -> Spiegelbild */
  PR_SP.m.value.set(0.5,0,0,0.5, 0,0.5,0,0.5, 0,0,0.5,0.5, 0,0,0,1).multiply(C.projectionMatrix).multiply(C.matrixWorldInverse);
  /* schraege Nahebene: nichts unter dem Boden gelangt ins Spiegelbild */
  _spE.setFromNormalAndCoplanarPoint(_spN,_spP).applyMatrix4(C.matrixWorldInverse);
  _spC.set(_spE.normal.x,_spE.normal.y,_spE.normal.z,_spE.constant);
  const P=C.projectionMatrix.elements;
  _spQ.set((Math.sign(_spC.x)+P[8])/P[0],(Math.sign(_spC.y)+P[9])/P[5],-1,(1+P[10])/P[14]);
  _spC.multiplyScalar(2/_spC.dot(_spQ));
  P[2]=_spC.x; P[6]=_spC.y; P[10]=_spC.z+1-0.003; P[14]=_spC.w;
  const altSky=skyMesh?skyMesh.position.clone():null;
  if(skyMesh){ skyMesh.position.set(C.position.x,0,C.position.z); }
  try{ renderer.setRenderTarget(PR.spRT); renderer.render(scene,C); }
  catch(e){ PR.fehler='spiegel '+e.message; PR.spRT=null; return; }
  finally{ if(skyMesh&&altSky) skyMesh.position.copy(altSky); }
  PR_SP.t.value=PR.spRT.texture; PR_SP.k.value=1;
  /* je hoeher die Stufe, desto klarer das Spiegelbild (Bild ist dort auch schaerfer) */
  PR_SP.s.value=[1,0.8,0.65][Math.max(0,Math.min(GFX_STUFEN.indexOf(GFX)-3,PRACHT))];
}
/* nach dem Zeichnen der Szene in rtScene: Verschattung rechnen */
function prachtAO(){
  const an=PR.aoRT&&GFX_STUFEN.indexOf(GFX)>=3;
  if(!PR.aoRT){ return; }
  if(!an){ matComp.uniforms.aoAn.value=0; matComp.uniforms.tAO.value=PR.weiss; return; }
  if(PR.aoRT.width!==Math.max(2,Math.floor(postW*(PRACHT>=2?0.66:0.5)))) prachtGroesse();
  const M=PR.aoMat.uniforms, w=PR.aoRT.width, h=PR.aoRT.height, P=camera.projectionMatrix.elements;
  M.px.value.set(1/w,1/h); M.pInv.value.set(1/P[0],1/P[5]); M.p11.value=P[5]; M.near.value=camera.near; M.far.value=camera.far;
  const st=Math.min(GFX_STUFEN.indexOf(GFX)-3,PRACHT); M.rad.value=[0.8,0.9,1.0][st]; M.staerke.value=[4.0,4.4,4.8][st];
  quadMesh.material=PR.aoMat; renderer.setRenderTarget(PR.aoRT); renderer.render(quadScene,quadCam);
  const B=PR.aoBlur.uniforms; B.far.value=camera.far;
  quadMesh.material=PR.aoBlur; B.tA.value=PR.aoRT.texture; B.dir.value.set(1/w,0); renderer.setRenderTarget(PR.aoRT2); renderer.render(quadScene,quadCam);
  B.tA.value=PR.aoRT2.texture; B.dir.value.set(0,1/h); renderer.setRenderTarget(PR.aoRT); renderer.render(quadScene,quadCam);
  matComp.uniforms.tAO.value=PR.aoRT.texture; matComp.uniforms.aoAn.value=1;
}

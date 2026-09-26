/* =========================================================
   Feuerwerk: Partikelsystem
   ========================================================= */
/* Stern: heller Kern, weicher Hof. Das grosse Sprite hat dazu vier
   feine Strahlen, wie ein funkelnder Stern auf einem Foto. */
const dotTex=tex(64,64,(g,W,H)=>{ const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.14,'rgba(255,255,255,.95)'); gr.addColorStop(0.3,'rgba(255,255,255,.4)');
  gr.addColorStop(0.6,'rgba(255,255,255,.1)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H); },false);
const sternTex=tex(128,128,(g,W,H)=>{ const c=W/2;
  const gr=g.createRadialGradient(c,c,0,c,c,c); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.08,'rgba(255,255,255,.95)');
  gr.addColorStop(0.2,'rgba(255,255,255,.35)'); gr.addColorStop(0.5,'rgba(255,255,255,.06)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  for(const [dx,dy] of [[1,0],[0,1]]){ const lg=g.createLinearGradient(c-dx*c,c-dy*c,c+dx*c,c+dy*c);
    lg.addColorStop(0,'rgba(255,255,255,0)'); lg.addColorStop(0.5,'rgba(255,255,255,.85)'); lg.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=lg; if(dx) g.fillRect(0,c-1.5,W,3); else g.fillRect(c-1.5,0,3,H); } },false);
/* Modi: 0 ruhiger Stern · 1 Stroboskop · 2 Farbwechsel · 3 Knistern · 4 Glitzer
   Leuchtspuren: jeder Stern zieht eine Linie hinter sich her. Die
   Spur wird nicht gespeichert, sondern aus der Flugbahn zurueck-
   gerechnet - Luftwiderstand und Schwerkraft sind bekannt. So
   entstehen die Strahlen einer Chrysantheme und die haengenden
   Faeden einer Weide ohne Verlaufsspeicher. */
const SCHWEIF_MODUS=[0.22,0,0.25,0,0.5];
let SCHWEIF=null;
const ZIEH=1.1;
/* Leuchtspur im Shader: Punkt s von S liegt tau=T*s/S zurueck auf der
   Flugbahn. Mit Luftwiderstand k und Schwerkraft g (gk=g/k):
   p(tau) = Kopf - v'*(e^(k*tau)-1)/k + (0, gk*tau, 0), v'=v+(0,gk,0).
   Die Helligkeit faellt zum Ende mit (1-s/S)^1.6. */
function spurMaterial(S){
  return new THREE.ShaderMaterial({
    uniforms:{S:{value:S},Z:{value:ZIEH}},
    vertexShader:'uniform float S;\nuniform float Z;\nattribute vec4 iP;\nattribute vec4 iV;\nattribute vec3 iC;\nvarying vec3 vC;\n'+
      'void main(){\n  float s=position.x, tau=iP.w*s/S, A=(exp(Z*tau)-1.0)/Z;\n  vec3 p=iP.xyz-iV.xyz*A; p.y+=iV.w*tau;\n'+
      '  vC=iC*pow(max(1.0-s/S,0.0),1.6);\n  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);\n}',
    fragmentShader:'varying vec3 vC;\nvoid main(){ gl_FragColor=linearToOutputTexel(vec4(vC,1.0)); }',
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false});
}
/* Die Spur eines Sterns auf dem Prozessor nachgerechnet, genau wie im
   Shader - fuer Tests: Kopf und Ende der Spur Nummer q. */
function spurEnden(ps,q){
  const P=ps.iP, W=ps.iV, o=q*4, T=P[o+3], A=(Math.exp(ZIEH*T)-1)/ZIEH;
  return [[P[o],P[o+1],P[o+2]],[P[o]-W[o]*A,P[o+1]-W[o+1]*A+W[o+3]*T,P[o+2]-W[o+2]*A]];
}
class PS{
  constructor(max,size,seg,map){
    this.max=max; this.pos=new Float32Array(max*3); this.col=new Float32Array(max*3); this.vel=new Float32Array(max*3);
    this.base=new Float32Array(max*3); this.c2=new Float32Array(max*3);
    this.life=new Float32Array(max); this.maxl=new Float32Array(max); this.grav=new Float32Array(max);
    this.md=new Uint8Array(max); this.ph=new Float32Array(max); this.tl=new Float32Array(max);
    this.next=0; this.dirty=false;
    for(let i=0;i<max;i++) this.pos[i*3+1]=-999;
    /* Gezeichnet wird aus eigenen Puffern, in denen nur die lebenden
       Sterne dicht hintereinander stehen. So geht je Bild nur das zur
       Grafikkarte, was auch leuchtet - frueher waren es die vollen
       Puffer, bei einem Finale 3,7 MB je Bild. */
    this.rpos=new Float32Array(max*3); this.rcol=new Float32Array(max*3); this.n=0;
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.rpos,3)); g.setAttribute('color',new THREE.BufferAttribute(this.rcol,3));
    g.setDrawRange(0,0); this.geo=g;
    this.pts=new THREE.Points(g,new THREE.PointsMaterial({size,map:map||dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false}));
    this.pts.frustumCulled=false; scene.add(this.pts);
    this.seg=seg||0;
    if(this.seg){
      /* Die Spur rechnet die Grafikkarte: je Stern gehen nur Kopf,
         Geschwindigkeit, Spurdauer und Farbe hin (11 Zahlen), die
         Punkte entlang der Flugbahn entstehen im Vertex-Shader. Frueher
         rechnete das der Prozessor und schickte bis zu 60 Zahlen je
         Stern und Bild. */
      const S=this.seg, sp=new Float32Array(S*2*3);
      for(let s=1;s<=S;s++){ sp[(s-1)*6]=s-1; sp[(s-1)*6+3]=s; }
      const lg=new THREE.InstancedBufferGeometry(); lg.setAttribute('position',new THREE.BufferAttribute(sp,3));
      this.iP=new Float32Array(max*4); this.iV=new Float32Array(max*4); this.iC=new Float32Array(max*3);
      lg.setAttribute('iP',new THREE.InstancedBufferAttribute(this.iP,4)); lg.setAttribute('iV',new THREE.InstancedBufferAttribute(this.iV,4)); lg.setAttribute('iC',new THREE.InstancedBufferAttribute(this.iC,3));
      lg.instanceCount=0; this.lgeo=lg;
      this.lines=new THREE.LineSegments(lg,spurMaterial(S));
      this.lines.frustumCulled=false; scene.add(this.lines);
    }
  }
  emit(x,y,z,vx,vy,vz,r,g,b,life,grav,mode,r2,g2,b2){
    const i=this.next; this.next=(i+1)%this.max; const j=i*3;
    this.pos[j]=x; this.pos[j+1]=y; this.pos[j+2]=z; this.vel[j]=vx; this.vel[j+1]=vy; this.vel[j+2]=vz;
    this.base[j]=r; this.base[j+1]=g; this.base[j+2]=b;
    this.c2[j]=r2===undefined?r:r2; this.c2[j+1]=g2===undefined?g:g2; this.c2[j+2]=b2===undefined?b:b2;
    this.life[i]=life; this.maxl[i]=life; this.grav[i]=grav; this.md[i]=mode||0; this.ph[i]=Math.random()*9;
    const md=mode||0;
    this.tl[i]=(md===1||md===3)?0:(SCHWEIF!==null?SCHWEIF:SCHWEIF_MODUS[md]);
  }
  update(dt){
    const drag=Math.max(0,1-ZIEH*dt); let nl=0, n=0;
    const S=this.seg, rp=this.rpos, rc=this.rcol, iP=this.iP, iV=this.iV, iC=this.iC;
    for(let i=0;i<this.max;i++){
      if(this.life[i]<=0) continue; const j=i*3;
      this.life[i]-=dt;
      if(this.life[i]<=0){ this.pos[j+1]=-999; this.col[j]=this.col[j+1]=this.col[j+2]=0; continue; }
      this.vel[j]*=drag; this.vel[j+1]=this.vel[j+1]*drag-this.grav[i]*dt; this.vel[j+2]*=drag;
      this.pos[j]+=this.vel[j]*dt; this.pos[j+1]+=this.vel[j+1]*dt; this.pos[j+2]+=this.vel[j+2]*dt;
      const f=this.life[i]/this.maxl[i], m=this.md[i];
      let k=f, r=this.base[j], g=this.base[j+1], b=this.base[j+2];
      if(m===0) k*=f<0.18?0.3+Math.random()*0.9:0.86+Math.random()*0.14;
      else if(m===1){ k*=((this.life[i]*11+this.ph[i])%1)<0.42?1.9:0.05; }
      else if(m===2){ const u=1-f; r+=(this.c2[j]-r)*u; g+=(this.c2[j+1]-g)*u; b+=(this.c2[j+2]-b)*u; k*=0.9+Math.random()*0.1; }
      else if(m===3){ if(Math.random()<0.26){ k=2.4; r=g=b=1; } else k*=0.06; }
      else k*=0.45+Math.random()*1.05;
      /* Die ersten Zehntel seines Lebens glueht ein Stern weiss auf,
         dann setzt die Farbe ein - wie beim echten Zerlegerschlag.
         Strobo und Knister bleiben, wie sie sind. */
      if(f>0.93&&m!==1&&m!==3){ const w=(f-0.93)/0.07; r+=(1-r)*w; g+=(1-g)*w; b+=(1-b)*w; }
      this.col[j]=r*k; this.col[j+1]=g*k; this.col[j+2]=b*k;
      const o3=n*3; rp[o3]=this.pos[j]; rp[o3+1]=this.pos[j+1]; rp[o3+2]=this.pos[j+2]; rc[o3]=this.col[j]; rc[o3+1]=this.col[j+1]; rc[o3+2]=this.col[j+2]; n++;
      /* Leuchtspur aus der zurueckgerechneten Flugbahn */
      if(S&&this.tl[i]>0){
        const T=Math.min(this.tl[i],this.maxl[i]-this.life[i]);
        if(T>0.02){
          const gk=this.grav[i]/ZIEH, hell=f*(m===4?0.75:0.9), o4=nl*4, o3=nl*3;
          iP[o4]=this.pos[j]; iP[o4+1]=this.pos[j+1]; iP[o4+2]=this.pos[j+2]; iP[o4+3]=T;
          iV[o4]=this.vel[j]; iV[o4+1]=this.vel[j+1]+gk; iV[o4+2]=this.vel[j+2]; iV[o4+3]=gk;
          iC[o3]=r*hell; iC[o3+1]=g*hell; iC[o3+2]=b*hell;
          nl++;
        }
      }
    }
    /* nur den belegten Anfang der Puffer hochladen */
    const hoch=(a,cnt)=>{ a.updateRange.offset=0; a.updateRange.count=cnt; a.needsUpdate=true; };
    this.geo.setDrawRange(0,n);
    if(n){ hoch(this.geo.attributes.position,n*3); hoch(this.geo.attributes.color,n*3); }
    this.n=n;
    if(S){ this.lgeo.instanceCount=nl;
      if(nl){ hoch(this.lgeo.attributes.iP,nl*4); hoch(this.lgeo.attributes.iV,nl*4); hoch(this.lgeo.attributes.iC,nl*3); }
      this.lines.visible=nl>0; this.nl=nl; }
  }
}
let psHuge, psBig, psMid, psSmall;
const rockets=[], emitters=[];
const PAD=V(3,0.75,-11);

/* =========================================================
   Farben
   ========================================================= */
const FW={
  rot:[1,.13,.10], scharlach:[1,.30,.09], orange:[1,.48,.06], bernstein:[1,.63,.13],
  gold:[1,.80,.22], zitrone:[1,.97,.34], limette:[.62,1,.20], gruen:[.14,1,.28],
  mint:[.36,1,.70], tuerkis:[.18,.96,1], himmel:[.36,.72,1], blau:[.20,.36,1],
  indigo:[.44,.32,1], violett:[.70,.30,1], magenta:[1,.20,.92], rose:[1,.46,.74],
  weiss:[1,1,1], silber:[.82,.90,1], pfirsich:[1,.72,.55], aqua:[.25,1,.88],
  braun:[.46,.28,.11], kot:[.33,.19,.07], senf:[.62,.48,.13], sumpf:[.40,.52,.16]
};
const K=n=>FW[n];
/* Farbpaare, die zusammen gut aussehen */
const SCHEMES=[
  ['rot','gold'],['rot','weiss'],['scharlach','zitrone'],['orange','tuerkis'],
  ['gold','blau'],['gold','violett'],['bernstein','mint'],['zitrone','magenta'],
  ['gruen','magenta'],['limette','violett'],['mint','rose'],['tuerkis','rot'],
  ['himmel','gold'],['blau','weiss'],['blau','orange'],['indigo','zitrone'],
  ['violett','mint'],['magenta','tuerkis'],['rose','silber'],['weiss','blau'],
  ['silber','rot'],['pfirsich','indigo'],['aqua','magenta'],['gold','silber']
];
/* Farbthemen (Tom, 24.09.: "manches zu durcheinander"). Jedes
   Produkt schiesst in seinem Thema - passend zur Verpackung. Ein
   Thema sind zwei bis vier Farbpaare, die zusammen gut aussehen. */
const THEMEN={
  nacht:[['blau','gold'],['himmel','weiss'],['tuerkis','gold']],
  eis:[['tuerkis','silber'],['weiss','himmel'],['aqua','silber']],
  glut:[['rot','gold'],['orange','zitrone'],['scharlach','weiss']],
  tropen:[['magenta','limette'],['violett','mint'],['rose','gruen']],
  himmel:[['violett','gold'],['magenta','zitrone'],['indigo','rose']],
  blitz:[['silber','tuerkis'],['weiss','blau'],['himmel','silber']],
  gold:[['gold','zitrone'],['bernstein','weiss'],['gold','silber']],
  rotweiss:[['rot','weiss'],['silber','rot'],['scharlach','silber']],
  koenig:[['gold','violett'],['zitrone','indigo'],['gold','rot']],
  wald:[['gruen','gold'],['limette','weiss'],['mint','zitrone']],
  bunt:[['rot','gold'],['gruen','zitrone'],['blau','weiss'],['magenta','tuerkis']],
  herz:[['rose','gold'],['rot','weiss']],
  zorn:[['magenta','gold'],['violett','zitrone']],
  silber:[['silber','gold'],['weiss','tuerkis']]
};
function themaPaar(th,i){ const T=THEMEN[th]||THEMEN.bunt, s=T[((i|0)%T.length+T.length)%T.length]; return [K(s[0]),K(s[1])]; }
function scheme(i){ const s=(typeof i==='number'&&i>=0)?SCHEMES[i%SCHEMES.length]:pick(SCHEMES); return [K(s[0]),K(s[1])]; }
/* Ort eines Sterns nach t Sekunden - dieselbe Physik wie PS.update:
   Luftwiderstand ZIEH, Schwerkraft g */
function bahnOrt(p,v,g,t){ const f=(1-Math.exp(-ZIEH*t))/ZIEH, gk=g/ZIEH; return {x:p.x+v[0]*f,y:p.y+v[1]*f-gk*(t-f),z:p.z+v[2]*f}; }
function bahnTempo(v,g,t){ const e=Math.exp(-ZIEH*t), gk=g/ZIEH; return [v[0]*e,(v[1]+gk)*e-gk,v[2]*e]; }
/* Richtung d um bis zu st (Bogenmass) gestreut */
function streu(d,st){ const e=randDir(), x=d[0]+e[0]*st, y=d[1]+e[1]*st, z=d[2]+e[2]*st, l=Math.hypot(x,y,z)||1; return [x/l,y/l,z/l]; }
/* zwei Einheitsvektoren quer zu d */
function quer(d){ const a=Math.abs(d[1])<0.9?[0,1,0]:[1,0,0];
  let u=[d[1]*a[2]-d[2]*a[1],d[2]*a[0]-d[0]*a[2],d[0]*a[1]-d[1]*a[0]]; const l=Math.hypot(u[0],u[1],u[2])||1; u=[u[0]/l,u[1]/l,u[2]/l];
  return [u,[d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0]]]; }
/* Funkenschweif eines Kometen: Funken loesen sich zu zufaelligen Zeiten
   aus der Bahn und fallen. Vorher kamen sie im festen Takt an denselben
   Punkten heraus - am Himmel standen Perlenketten (Tom, 26.09.). */
function funkenSchweif(p,v,g,dauer,dichte,c){
  const takte=Math.max(3,Math.round(dauer/0.12));
  for(let k=0;k<takte;k++){ const t0=(k+Math.random())*dauer/takte;
    later(t0,()=>{ for(let i=0;i<Math.round(dichte*QUAL());i++){ const t=Math.max(0.02,t0-Math.random()*0.1), q=bahnOrt(p,v,g,t);
      psMid.emit(q.x+rand(-.12,.12),q.y+rand(-.12,.12),q.z+rand(-.12,.12),rand(-.45,.45),rand(-1.4,0.1),rand(-.45,.45),c[0],c[1],c[2],rand(0.5,1.2),3.4,4); } }); }
}
function randDir(){ let x,y,z,d; do{ x=rand(-1,1); y=rand(-1,1); z=rand(-1,1); d=x*x+y*y+z*z; }while(d>1||d<0.01); d=Math.sqrt(d); return [x/d,y/d,z/d]; }
function basis(){
  const n=randDir(), a=Math.abs(n[1])<0.86?[0,1,0]:[1,0,0];
  let u=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]];
  const l=Math.hypot(u[0],u[1],u[2])||1; u=[u[0]/l,u[1]/l,u[2]/l];
  const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
  return [u,v];
}
/* Figuren (Herz, Stern, Ringe ...) liegen in einer Ebene, die zum
   Zuschauer zeigt - hoechstens um 'kipp' geneigt. Mit zufaelliger
   Lage sah man ein Herz von der Kante: ein flaches Oval (Tom). */
function basisBlick(p,kipp){
  const c=camera.position;
  let n=[c.x-p.x,c.y-p.y,c.z-p.z]; const l0=Math.hypot(n[0],n[1],n[2])||1; n=[n[0]/l0,n[1]/l0,n[2]/l0];
  if(kipp){ const r=randDir(), k=Math.random()*kipp; n=[n[0]+r[0]*k,n[1]+r[1]*k,n[2]+r[2]*k];
    const l=Math.hypot(n[0],n[1],n[2])||1; n=[n[0]/l,n[1]/l,n[2]/l]; }
  /* u waagerecht, v nach oben - so steht das Herz aufrecht */
  let u=[-n[2],0,n[0]]; const lu=Math.hypot(u[0],u[2])||1; u=[u[0]/lu,0,u[2]/lu];
  const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
  if(v[1]<0){ v[0]=-v[0]; v[1]=-v[1]; v[2]=-v[2]; u=[-u[0],-u[1],-u[2]]; }
  return [u,v];
}
/* Effektfamilien: was gleichzeitig am Himmel steht, muss zusammen-
   passen. Figuren stehen immer allein - ein Herz mit einer Kugel
   darin oder ein Stern neben einer Knisterwolke sieht nach Unfall aus. */
const EFF_FAMILIE={};
[['figur','ring doppelring ringring herz stern saturn schneeflocke spirale feuerrad kreisel smiley krone regenbogenring'],
 ['kugel','kugel chrys wechsel dahlie pistill mehrring geist regenbogen spektrum farbregen dreifach doppel zehnfach strauss polarstern diadem blumenkranz schmetterling drachenblut weltenbrand himmelsbrecher pfeifsterne'],
 ['haenger','weide glitzerweide kamuro brokat zeitregen kronleuchter goldglitzer palme komet kaskade sternschnuppen titan sternpalme kokosnuss strobeweide rossschweif goldvorhang nishiki'],
 ['knister','knister tausend strobe blink fische spinne crossette blaetter bienen drachenei'],
 ['flamme','flammenregen'],['salut','salut'],['spass','furz']].forEach(([f,l])=>l.split(' ').forEach(e=>{ EFF_FAMILIE[e]=f; }));
/* Welche Familien sich den Himmel teilen duerfen */
function effPassen(a,b){
  const fa=EFF_FAMILIE[a]||'kugel', fb=EFF_FAMILIE[b]||'kugel';
  if(fa==='salut'||fb==='salut') return fa!=='figur'&&fb!=='figur';
  if(fa==='figur'||fb==='figur') return a===b||(fa===fb&&fa==='figur');
  return true;
}
const QUAL=()=>COARSE?0.55:1;
const STEIG=0.8;

/* =========================================================
   Bruchbilder
   ========================================================= */
/* Lichtblitze: jeder Bruch wirft echtes farbiges Licht auf Schnee, Haus und Hof */
const FLASH=[];
/* Blitzlichter: Jedes Licht mehr oder weniger in der Szene aendert die
   Shader aller Materialien - three.js uebersetzt sie dann neu, und das
   Spiel steht. Frueher ging jeder Blitz einzeln an und aus: bei einem
   Finale 39 neue Shader mitten im Feuerwerk. Jetzt gehen alle Blitze
   gemeinsam an, sobald geschossen wird, und erst 8 s nach dem letzten
   wieder aus - es gibt nur zwei Lichtzustaende, und beide werden beim
   Laden vorab uebersetzt. Im Laden ohne Feuerwerk kosten die Blitze so
   auch keine Rechenzeit. */
let flashAn=true, flashRuhe=0;
function flashSchalten(an){ if(flashAn===an) return; flashAn=an; for(const f of FLASH) f.l.visible=an; }
function initFlash(){
  for(let i=0;i<(COARSE?2:4);i++){ const l=new THREE.PointLight(0xffffff,0,95,1); scene.add(l); FLASH.push({l,t:0,d:0.6,max:0}); }
  flashSchalten(false);
}
/* beide Lichtzustaende vorab uebersetzen - in das Ziel, in das auch
   gezeichnet wird (mit Nachbearbeitung ein anderes als der Bildschirm) */
let vorabZiel=null;
function shaderVorab(){
  try{
    const t0=performance.now();
    /* Gezeichnet wird in ein winziges Bild mit demselben Farbformat wie
       das echte Ziel - der Shader haengt am Format, nicht an der Groesse.
       In voller Aufloesung dauerte das Vorzeichnen auf schwachen
       Rechnern viele Sekunden. */
    const post=(typeof postOK!=='undefined'&&postOK&&postOn&&typeof rtScene!=='undefined'&&rtScene);
    /* auch Kantenglaettung wie beim echten Ziel: Treiber stellen den
       Shader je Bildformat und Abtastzahl fertig */
    if(!vorabZiel&&THREE.WebGLRenderTarget){
      const opt={type:post?rtScene.texture.type:THREE.UnsignedByteType};
      const ms=post&&rtScene.isWebGLMultisampleRenderTarget&&THREE.WebGLMultisampleRenderTarget;
      vorabZiel=ms?new THREE.WebGLMultisampleRenderTarget(4,4,opt):new THREE.WebGLRenderTarget(4,4,opt);
      if(ms) vorabZiel.samples=rtScene.samples;
      vorabZiel.texture.encoding=post?rtScene.texture.encoding:renderer.outputEncoding;
    }
    if(renderer.setRenderTarget) renderer.setRenderTarget(vorabZiel);
    const alt=flashAn;
    /* Uebersetzen allein reicht nicht: Browser und Treiber stellen
       einen Shader oft erst beim ersten Zeichnen fertig. Darum wird
       jeder Zustand einmal gezeichnet, ohne Sichtpruefung, damit auch
       Dinge hinter der Kamera drankommen. */
    const aus=[]; scene.traverse(o=>{ if(o.frustumCulled){ o.frustumCulled=false; aus.push(o); } });
    for(const an of [true,false]){ flashSchalten(an); renderer.compile(scene,camera); renderer.render(scene,camera); }
    aus.forEach(o=>{ o.frustumCulled=true; });
    flashSchalten(alt);
    if(renderer.setRenderTarget) renderer.setRenderTarget(null);
    shaderVorab.ms=Math.round(performance.now()-t0);
  }catch(e){ try{ if(renderer.setRenderTarget) renderer.setRenderTarget(null); }catch(e2){} }
}
function flash(p,c,power,dur){
  if(!FLASH.length) return;
  flashSchalten(true); flashRuhe=8;
  let f=FLASH[0]; for(const x of FLASH){ if(x.t<=0){ f=x; break; } if(x.t<f.t) f=x; }
  f.l.position.set(p.x,p.y,p.z);
  f.l.color.setRGB(clamp(c[0]+0.15,0,1),clamp(c[1]+0.15,0,1),clamp(c[2]+0.15,0,1));
  /* Brennen mehrere Blitze zugleich, teilen sie sich die Helligkeit.
     Bei elf gleichzeitigen Zuendungen war der Boden sonst reinweiss. */
  let aktiv=0; for(const x of FLASH) if(x.t>0) aktiv++;
  power*=aktiv>=3?0.45:aktiv>=2?0.62:aktiv>=1?0.8:1;
  f.max=power; f.d=dur||0.6; f.t=f.d; f.l.intensity=power;
}
function updateFlash(dt){
  if(flashAn){ flashRuhe-=dt; if(flashRuhe<=0&&FLASH.every(f=>f.t<=0)) flashSchalten(false); }
  for(const f of FLASH){ if(f.t<=0) continue;
    f.t-=dt; const k=Math.max(0,f.t/f.d);
    f.l.intensity=f.max*k*k*(0.85+Math.random()*0.3);
    if(f.t<=0){ f.t=0; f.l.intensity=0; } }
}
function shellSound(p,s){
  const v=distVol(p);
  /* Schall braucht fuer 40 m gut eine Zehntelsekunde: erst der Blitz,
     dann der Knall */
  const d=camera.position.distanceTo(p)/343;
  later(d,()=>sfx.boom(v*Math.min(1.3,0.55+s*0.45)));
  later(d+0.12,()=>sfx.crack(v*0.9)); later(d+0.26,()=>sfx.crack(v*0.55));
}
const EFF={
  /* runde Farbkugel, sauber und satt */
  kugel(p,A,B,s){
    const n=Math.round(170*s*QUAL());
    for(let i=0;i<n;i++){ const d=randDir(), v=rand(8.5,10.5)*s, c=i%4?A:B;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(1.5,2.1),3.0,0); }
  },
  /* Chrysantheme: dichter Ball mit Glitzerschweif */
  chrys(p,A,B,s){
    const n=Math.round(150*s*QUAL());
    for(let i=0;i<n;i++){ const d=randDir(), v=rand(7,11.5)*s, c=i%3?A:B;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(2.0,2.9),4.0,4);
      if(i%2===0){ const e=streu(d,0.12), w=v*rand(0.45,0.65); psMid.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,c[0],c[1],c[2],rand(1.2,1.9),3.4,4); } }
  },
  /* Farbwechsler: startet in A, endet in B */
  wechsel(p,A,B,s){
    const n=Math.round(165*s*QUAL());
    for(let i=0;i<n;i++){ const d=randDir(), v=rand(8,10)*s;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.8,2.4),3.2,2,B[0],B[1],B[2]); }
  },
  /* Goldweide: lange, tief hängende Schweife */
  weide(p,A,B,s){
    const n=Math.round(130*s*QUAL()), g=FW.gold;
    for(let i=0;i<n;i++){ const d=randDir(), v=rand(4.5,7)*s;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.8+1.5,d[2]*v,g[0],g[1],g[2],rand(3.2,4.4),5.2,4); }
    for(let i=0;i<Math.round(26*s*QUAL());i++){ const d=randDir(), v=rand(2,4)*s;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.2,1.8),3,0); }
  },
  /* Palme: wenige dicke Wedel nach oben, die sich unter der Last
     neigen. Jeder Wedel ist ein grosser Kopf mit einem engen Buendel
     dicht dahinter und fallenden Funken - vorher 15 Sterne auf genau
     einer Linie mit gleichen Abstaenden. */
  palme(p,A,B,s){
    const arms=7+Math.floor(Math.random()*4), dreh=Math.random()*Math.PI*2;
    for(let a=0;a<arms;a++){
      const ang=dreh+a/arms*Math.PI*2+rand(-.35,.35), tilt=rand(0.45,1.2), sp=rand(8.5,11)*s;
      const v=[Math.cos(ang)*Math.cos(tilt)*sp,Math.sin(tilt)*sp+2,Math.sin(ang)*Math.cos(tilt)*sp], vl=Math.hypot(v[0],v[1],v[2]), dn=[v[0]/vl,v[1]/vl,v[2]/vl];
      psHuge.emit(p.x,p.y,p.z,v[0],v[1],v[2],A[0],A[1],A[2],rand(2.6,3.2),4.4,4);
      for(let i=0;i<Math.round(7*QUAL());i++){ const e=streu(dn,0.05), w=vl*rand(0.86,1.0), c=i<2?B:A;
        psBig.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,c[0],c[1],c[2],rand(2.2,3.2),4.4,4); }
      funkenSchweif(p,v,4.4,1.8,3,A);
    }
    for(let i=0;i<Math.round(26*QUAL());i++){ const d=randDir(), v=rand(1,3);
      psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,B[0],B[1],B[2],rand(0.9,1.5),3,0); }
  },
  /* flacher Ring */
  ring(p,A,B,s){
    const [u,v]=basisBlick(p,0.5), n=Math.round(96*QUAL()), sp=rand(8,10)*s;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rand(-.02,.02), w=sp*rand(0.95,1.05);
      const dx=(u[0]*Math.cos(a)+v[0]*Math.sin(a)), dy=(u[1]*Math.cos(a)+v[1]*Math.sin(a)), dz=(u[2]*Math.cos(a)+v[2]*Math.sin(a));
      psBig.emit(p.x,p.y,p.z,dx*w,dy*w,dz*w,A[0],A[1],A[2],rand(1.8,2.3),2.6,0); }
    for(let i=0;i<Math.round(40*QUAL());i++){ const d=randDir(), w=rand(1,3);
      psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(1.4,1.9),2.8,0); }
  },
  /* zwei Ringe über Kreuz, zwei Farben */
  doppelring(p,A,B,s){
    for(let r=0;r<2;r++){
      const [u,v]=basisBlick(p,0.5), n=Math.round(80*QUAL()), sp=rand(7.5,9.5)*s, c=r?B:A;
      for(let i=0;i<n;i++){ const a=i/n*Math.PI*2;
        const dx=(u[0]*Math.cos(a)+v[0]*Math.sin(a)), dy=(u[1]*Math.cos(a)+v[1]*Math.sin(a)), dz=(u[2]*Math.cos(a)+v[2]*Math.sin(a));
        psBig.emit(p.x,p.y,p.z,dx*sp,dy*sp,dz*sp,c[0],c[1],c[2],rand(1.7,2.2),2.6,0); }
    }
  },
  /* Crossette: Kometen, die nochmal vierfach aufplatzen. Jeder Arm ist
     ein Kopf mit kurzem Schweif; er platzt quer zu seiner Flugrichtung
     im Kreuz auf. Vorher: neun Sterne in genau derselben Richtung mit
     gleichen Abstaenden - eine Perlenkette mit Draht zur Mitte. */
  crossette(p,A,B,s){
    const arms=8+Math.floor(Math.random()*5);
    for(let a=0;a<arms;a++){
      const d=randDir(), sp=rand(7.5,9)*s, v=[d[0]*sp,d[1]*sp,d[2]*sp], tz=rand(0.5,0.66);
      psHuge.emit(p.x,p.y,p.z,v[0],v[1],v[2],A[0],A[1],A[2],tz,2.4,4);
      for(let i=0;i<Math.round(3*QUAL());i++){ const e=streu(d,0.03), w=sp*rand(0.94,1.0);
        psBig.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,A[0],A[1],A[2],tz,2.4,4); }
      later(tz,()=>{
        const q=bahnOrt(p,v,2.4,tz), vr=bahnTempo(v,2.4,tz), [u1,u2]=quer(d), roll=Math.random()*Math.PI*2;
        for(let k=0;k<4;k++){ const e=roll+k*Math.PI/2, ce=Math.cos(e), se=Math.sin(e);
          const r=[u1[0]*ce+u2[0]*se,u1[1]*ce+u2[1]*se,u1[2]*ce+u2[2]*se];
          for(let i=0;i<Math.round(6*QUAL());i++){ const st=streu(r,0.14), w=rand(3.2,4.4)*s;
            psBig.emit(q.x,q.y,q.z,vr[0]*0.3+st[0]*w,vr[1]*0.3+st[1]*w,vr[2]*0.3+st[2]*w,B[0],B[1],B[2],rand(0.9,1.4),3.2,0); } }
      });
    }
    later(0.58,()=>sfx.crack(distVol(p)*0.7));
  },
  /* Knisterkugel */
  knister(p,A,B,s){
    const n=Math.round(110*s*QUAL());
    for(let i=0;i<n;i++){ const d=randDir(), v=rand(7.5,9.5)*s;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.3,1.8),3.0,0); }
    for(let i=0;i<Math.round(150*s*QUAL());i++){ const d=randDir(), v=rand(4,9)*s;
      psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,1,.92,.72,rand(1.1,1.9),3.4,3); }
    later(0.2,()=>sfx.crackle(distVol(p)));
  },
  /* Blinksterne, die lange am Himmel hängen */
  blink(p,A,B,s){
    const n=Math.round(90*s*QUAL());
    for(let i=0;i<n;i++){ const d=randDir(), v=rand(4.5,6.5)*s, c=i%2?A:B;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(3.0,4.2),1.5,1); }
  },
  /* Brokat: dichtes Goldnetz mit farbigem Kern */
  brokat(p,A,B,s){
    const g=FW.gold, n=Math.round(190*s*QUAL());
    for(let i=0;i<n;i++){ const d=randDir(), v=rand(6,10.5)*s;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,g[0],g[1],g[2],rand(2.6,3.8),4.6,4); }
    for(let i=0;i<Math.round(60*s*QUAL());i++){ const d=randDir(), v=rand(2.5,4.5)*s;
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.6,2.2),2.8,0); }
  },
  /* Herz */
  herz(p,A,B,s){
    const [u,v]=basisBlick(p,0), n=Math.round(90*QUAL());
    for(let i=0;i<n;i++){
      const t=i/n*Math.PI*2;
      const hx=16*Math.pow(Math.sin(t),3)/16, hy=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16;
      const sp=8.5*s;
      const dx=(u[0]*hx+v[0]*hy)*sp, dy=(u[1]*hx+v[1]*hy)*sp, dz=(u[2]*hx+v[2]*hy)*sp;
      psBig.emit(p.x,p.y,p.z,dx,dy,dz,A[0],A[1],A[2],rand(1.9,2.4),2.4,0);
      psBig.emit(p.x,p.y,p.z,dx*0.86,dy*0.86,dz*0.86,B[0],B[1],B[2],rand(1.7,2.1),2.4,0);
    }
  },
  /* fünfzackiger Stern */
  stern(p,A,B,s){
    const [u,v]=basisBlick(p,0), pts=[];
    for(let i=0;i<10;i++){ const r=i%2?0.42:1, a=i/10*Math.PI*2-Math.PI/2; pts.push([Math.cos(a)*r,Math.sin(a)*r]); }
    const sp=9*s;
    for(let e=0;e<10;e++){
      const a=pts[e], b=pts[(e+1)%10], n=Math.round(11*QUAL());
      for(let i=0;i<n;i++){ const f=i/n, hx=a[0]+(b[0]-a[0])*f, hy=a[1]+(b[1]-a[1])*f;
        /* etwas Streuung wie bei echten Motivbomben - vorher lagen
           alle Punkte einer Kante exakt auf einer Linie */
        const j=sp*rand(0.97,1.03), hx2=hx+rand(-.025,.025), hy2=hy+rand(-.025,.025);
        const dx=(u[0]*hx2+v[0]*hy2)*j, dy=(u[1]*hx2+v[1]*hy2)*j, dz=(u[2]*hx2+v[2]*hy2)*j;
        psBig.emit(p.x,p.y,p.z,dx,dy,dz,A[0],A[1],A[2],rand(1.9,2.4),2.3,0); }
    }
    for(let i=0;i<Math.round(34*QUAL());i++){ const d=randDir(), w=rand(1,2.6);
      psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(1.5,2),2.6,0); }
  },
  /* Kreisel: Ring mit Drall */
  kreisel(p,A,B,s){
    const [u,v]=basisBlick(p,0.5), n=Math.round(84*QUAL()), sp=rand(6.5,8.5)*s;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, tg=a+Math.PI/2.4, c=i%3?A:B;
      const dx=(u[0]*Math.cos(tg)+v[0]*Math.sin(tg))*sp, dy=(u[1]*Math.cos(tg)+v[1]*Math.sin(tg))*sp, dz=(u[2]*Math.cos(tg)+v[2]*Math.sin(tg))*sp;
      psBig.emit(p.x,p.y,p.z,dx,dy,dz,c[0],c[1],c[2],rand(1.6,2.2),2.4,4); }
  },
  /* Fische: viele kleine, zappelnde Funken */
  fische(p,A,B,s){
    const n=Math.round(220*s*QUAL());
    for(let i=0;i<n;i++){ const d=randDir(), v=rand(3,13)*s, c=i%2?A:B;
      psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(0.7,1.5),2.2,4); }
    later(0.1,()=>sfx.crackle(distVol(p)*0.8));
  },
  /* Doppelschlag: zwei Kugeln kurz nacheinander */
  doppel(p,A,B,s){
    EFF.kugel(p,A,B,s*0.8);
    later(0.42,()=>{ const q={x:p.x+rand(-1.5,1.5),y:p.y+rand(-1,1),z:p.z+rand(-1.5,1.5)};
      EFF.kugel(q,B,A,s*0.9); shellSound(q,s*0.8); });
  },
  /* Dreifachbruch in drei Farben */
  dreifach(p,A,B,s){
    const C=K(pick(['zitrone','tuerkis','magenta','weiss','limette']));
    EFF.kugel(p,A,A,s*0.75);
    later(0.35,()=>{ const q={x:p.x+rand(-2,2),y:p.y+rand(-1.5,1.5),z:p.z+rand(-2,2)}; EFF.kugel(q,B,B,s*0.8); shellSound(q,s*0.7); });
    later(0.72,()=>{ const q={x:p.x+rand(-2.5,2.5),y:p.y+rand(-2,1),z:p.z+rand(-2.5,2.5)}; EFF.chrys(q,C,C,s*0.85); shellSound(q,s*0.7); });
  }
};
/* Die Furzwolke: eine breite, langsam aufsteigende Schwade mit Spritzern */
EFF.furz=function(p,A,B,s){
  const n=Math.round(240*s*QUAL());
  for(let i=0;i<n;i++){
    const d=randDir(), v=rand(2.0,6.8)*s;
    const c=i%6===0?FW.sumpf:(i%3?FW.braun:FW.kot);
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.6+rand(0.2,1.6),d[2]*v,c[0],c[1],c[2],rand(3.6,5.6),-0.45);
  }
  /* Spritzer, die wieder herunterkommen */
  for(let i=0;i<Math.round(46*s*QUAL());i++){
    const d=randDir(), v=rand(7,13)*s;
    psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,FW.senf[0],FW.senf[1],FW.senf[2],rand(1.1,2.0),4.2);
  }
  /* Nachschwaden, damit die Wolke noch eine Weile haengt */
  for(let k=1;k<=3;k++) later(k*0.45,()=>{
    for(let i=0;i<Math.round(55*s*QUAL());i++){
      const d=randDir(), v=rand(1.2,3.6)*s;
      const c=i%4?FW.braun:FW.sumpf;
      psBig.emit(p.x+rand(-2,2),p.y+rand(-1,1.6),p.z+rand(-2,2),d[0]*v,d[1]*v*0.5+0.5,d[2]*v,c[0],c[1],c[2],rand(3.0,4.6),-0.4);
    }
  });
  flash({x:p.x,y:p.y,z:p.z},FW.senf,1.6,0.45);
};

/* =========================================================
   Profi-Bruchbilder. Die Namen sind die der Feuerwerkerei:
   Peonie ohne Schweif, Chrysantheme mit, Dahlie wenige grosse
   Sterne, Pistill ein zweiter Ball im Inneren, Kamuro eine
   haengende Goldglocke, Spinne harte flache Strahlen.
   ========================================================= */
/* Dahlie: wenige, grosse Sterne, die weit fliegen und lange stehen */
EFF.dahlie=function(p,A,B,s){
  const n=Math.round(52*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(12,15.5)*s, c=i%5?A:B;
    psHuge.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(2.6,3.6),2.6,0);
    /* jeder Stern zieht einen kurzen Kopf mit */
    { const e=streu(d,0.05), w=v*rand(0.76,0.88); psMid.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,c[0],c[1],c[2],rand(1.0,1.6),2.8,0); } }
};
/* Pistill: aussen ein Ball, innen ein zweiter in der Gegenfarbe */
EFF.pistill=function(p,A,B,s){
  const n=Math.round(160*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(9,11.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.7,2.3),3.0,0); }
  const m=Math.round(58*s*QUAL());
  for(let i=0;i<m;i++){ const d=randDir(), v=rand(3.2,4.8)*s;
    psHuge.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,B[0],B[1],B[2],rand(2.4,3.2),2.2,0); }
};
/* Kamuro: dichte Goldglocke, die am Himmel stehen bleibt */
EFF.kamuro=function(p,A,B,s){
  const g=FW.gold, n=Math.round(250*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(5,8.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.9+1.2,d[2]*v,g[0],g[1],g[2],rand(4.2,6.0),2.1,4); }
  /* farbige Spitzen an den Enden */
  for(let i=0;i<Math.round(48*s*QUAL());i++){ const d=randDir(), v=rand(7.5,9.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.4,2.0),2.6,0); }
  later(0.9,()=>sfx.crackle(distVol(p)*0.6));
};
/* Spinne: harte, flache Strahlen wie Speichen */
EFF.spinne=function(p,A,B,s){
  /* Spinne wie in echt (Tom, 25.09.: "sieht nicht natuerlich aus"):
     schwere Brokatsterne schiessen schnell nach aussen, ziehen dicke
     goldene Spuren und haengen dann durch. Vorher waren die Beine
     gerade Linien aus gleich verteilten Punkten in einer Ebene. */
  const n=Math.round(40*s*QUAL()), g=FW.gold, alt=SCHWEIF;
  SCHWEIF=0.55;
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(14,18)*s, c=i%4?g:A;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(1.4,1.9),3.2,4); }
  SCHWEIF=0.25;
  for(let i=0;i<Math.round(70*s*QUAL());i++){ const d=randDir(), v=rand(9,15)*s;
    psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,g[0],g[1]*0.9,g[2]*0.7,rand(0.9,1.5),2.6,4); }
  SCHWEIF=alt;
  flash({x:p.x,y:p.y,z:p.z},g,3.4,0.3);
};
EFF.strobe=function(p,A,B,s){
  const n=Math.round(120*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(5.5,8)*s, c=i%2?A:B;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(3.6,5.2),1.3,1); }
  for(let i=0;i<Math.round(40*s*QUAL());i++){ const d=randDir(), v=rand(2,4)*s;
    psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,1,1,1,rand(2.4,3.4),1.1,1); }
};
/* Zeitregen: grosse, traege Sterne, die ihren Glitzer nach und nach abwerfen */
EFF.zeitregen=function(p,A,B,s){
  const traeger=[];
  const n=Math.round(40*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(5,7.5)*s;
    traeger.push([d[0]*v,d[1]*v,d[2]*v]);
    psHuge.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(4.0,5.4),2.4,4); }
  /* der Glitzer faellt in Wellen nach, nicht auf einmal */
  for(let w=1;w<=5;w++) later(w*0.42,()=>{
    for(const t of traeger){
      if(Math.random()>0.75) continue;
      /* jeder Traeger zu seiner eigenen Zeit - vorher alle im selben
         Takt, das gab Zwiebelschalen aus Punkten */
      const q=bahnOrt(p,t,2.4,Math.max(0.1,w*0.42+rand(-0.2,0.2)));
      for(let i=0;i<Math.round(5*QUAL());i++){ const d=randDir(), sp=rand(0.4,1.8);
        psMid.emit(q.x,q.y,q.z,d[0]*sp,d[1]*sp,d[2]*sp,1,.92,.62,rand(0.9,1.6),3.2,4); }
    }
    if(w===2) sfx.crackle(distVol(p)*0.5);
  });
};
/* Blaetterfall: wenige grosse Sterne, die flackernd herunterschweben */
EFF.blaetter=function(p,A,B,s){
  const n=Math.round(30*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(3,5.2)*s, c=i%3?A:B;
    psHuge.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.6,d[2]*v,c[0],c[1],c[2],rand(4.4,6.2),0.95,1); }
  for(let i=0;i<Math.round(60*s*QUAL());i++){ const d=randDir(), v=rand(1,3)*s;
    psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,B[0],B[1],B[2],rand(2.6,4.0),1.2,4); }
};
/* Geisterschuss: der ganze Ball laeuft durch drei Farben */
EFF.geist=function(p,A,B,s){
  const C=K(pick(['weiss','zitrone','tuerkis','magenta','limette']));
  const n=Math.round(150*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(8.5,10.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.6,2.1),2.8,2,B[0],B[1],B[2]); }
  later(0.95,()=>{
    for(let i=0;i<Math.round(90*s*QUAL());i++){ const d=randDir(), v=rand(7,9)*s;
      psBig.emit(p.x,p.y+rand(-1.2,0.4),p.z,d[0]*v*0.7,d[1]*v*0.7-1.5,d[2]*v*0.7,B[0],B[1],B[2],rand(1.4,2.0),2.6,2,C[0],C[1],C[2]); }
  });
};
/* Salut: kein Bild, nur ein greller Blitz und ein harter Schlag */
EFF.salut=function(p,A,B,s){
  const n=Math.round(70*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(13,19)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,1,1,1,rand(0.32,0.55),1.2,3); }
  flash({x:p.x,y:p.y,z:p.z},FW.weiss,9*s,0.22);
  const v=distVol(p);
  sfx.boom(Math.min(1.6,v*1.5)); later(0.05,()=>sfx.crack(v));
  shake=Math.max(shake,Math.min(1.4,0.9*v));
};
/* Saturn: flacher Ring mit einem Kern in der Mitte */
EFF.saturn=function(p,A,B,s){
  EFF.ring(p,A,A,s*1.05);
  const n=Math.round(70*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(3,4.6)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,B[0],B[1],B[2],rand(2.0,2.8),2.4,0); }
};

/* =========================================================
   Neue Bruchbilder fuer das ueberarbeitete Sortiment
   ========================================================= */
/* Tausendfach-Knister: ein Ball aus Traegern, die kurz darauf
   jeder fuer sich in einen kleinen Knall zerplatzen */
EFF.tausend=function(p,A,B,s){
  const n=Math.round(64*s*QUAL()), punkte=[];
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(6.5,9.5)*s;
    punkte.push([d[0]*v,d[1]*v,d[2]*v]);
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(0.55,0.75),2.6,0); }
  for(let w=0;w<3;w++) later(0.55+w*0.14,()=>{
    const f=1-Math.exp(-1.1*(0.6+w*0.14));
    for(let i=w;i<punkte.length;i+=3){ const t=punkte[i];
      const q={x:p.x+t[0]*f*0.9,y:p.y+t[1]*f*0.9-0.6,z:p.z+t[2]*f*0.9};
      for(let k=0;k<Math.round(7*QUAL());k++){ const d=randDir(), sp=rand(1.5,3.5);
        psMid.emit(q.x,q.y,q.z,d[0]*sp,d[1]*sp,d[2]*sp,1,.95,.8,rand(0.25,0.5),2,3); } }
    sfx.crackle(distVol(p)*(0.8-w*0.15));
  });
};
/* Mehrfachring-Peonie: drei Kugeln ineinander, drei Farben */
EFF.mehrring=function(p,A,B,s){
  const C=K(pick(['weiss','zitrone','tuerkis','magenta','limette','silber']));
  const lagen=[[A,11.5,150],[B,7.8,110],[C,4.4,70]];
  for(const [c,v0,n0] of lagen){
    const n=Math.round(n0*s*QUAL());
    for(let i=0;i<n;i++){ const d=randDir(), v=v0*s*rand(0.96,1.04);
      psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(1.9,2.5),2.8,0); }
  }
};
/* Regenbogen: bunte Paeonie - Sterne in fuenf Farben, zufaellig
   durchmischt wie bei echten Multicolor-Bomben. Vorher war der Ball in
   sechs harte Farbsektoren geteilt; das sah gemalt aus (Tom, 25.09.). */
EFF.regenbogen=function(p,A,B,s){
  const F=['rot','zitrone','gruen','himmel','violett'].map(K), n=Math.round(200*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), sp=rand(8.2,10.6)*s, c=F[Math.floor(Math.random()*F.length)];
    psBig.emit(p.x,p.y,p.z,d[0]*sp,d[1]*sp,d[2]*sp,c[0],c[1],c[2],rand(1.8,2.5),3.0,0); }
};
/* ---------- Neue Bruchbilder (Tom, 24.09.: "sei kreativ") ---------- */
/* Flammenregen: grosse, langsame Flammen, die flackernd von Orange
   nach Dunkelrot verglimmen und dabei brennende Tropfen verlieren */
EFF.flammenregen=function(p,A,B,s){
  /* Jede Flamme ist ein Buendel: ein ueberheller Kopf (gelb nach rot)
     und ein Kranz groesserer Glutteilchen dicht darum - aus der Ferne
     ein Flammenball, kein Funke */
  const n=Math.round(36*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(3.2,6.2)*s, vx=d[0]*v, vy=d[1]*v*0.55+1.4, vz=d[2]*v;
    psHuge.emit(p.x,p.y,p.z,vx,vy,vz,1.7,1.05,0.35,rand(3.0,4.0),2.0,2,1.1,0.22,0.05);
    for(let k=0;k<Math.round(9*QUAL());k++){ const c=k%3?FW.orange:(i%4?FW.bernstein:A);
      psBig.emit(p.x,p.y,p.z,vx+rand(-.75,.75),vy+rand(-.75,.75),vz+rand(-.75,.75),c[0]*1.3,c[1]*1.2,c[2],rand(2.6,3.6),2.05,2,0.75,0.12,0.03); } }
  /* brennende Tropfen, die aus den Flammen fallen */
  for(let k=1;k<=7;k++) later(k*0.4,()=>{
    for(let i=0;i<Math.round(30*s*QUAL());i++){ const d=randDir(), r=(1.8+k*0.55)*s;
      psMid.emit(p.x+d[0]*r,p.y+d[1]*r*0.5-k*0.45,p.z+d[2]*r,rand(-.35,.35),rand(-2.8,-0.8),rand(-.35,.35),1.3,rand(0.55,0.8),0.12,rand(0.9,1.6),3.4,0); }
    if(k%2) sfx.crackle(distVol(p)*0.35);
  });
  flash(p,FW.orange,8*s,2.0);
};
/* Kronleuchter: goldene Arme, an deren Enden Glitzertropfen haengen.
   Die Arme stehen rundum mit eigener Neigung, jeder ist ein Glitzerkopf
   mit Buendel und fallenden Funken; die Tropfen haengen dort, wo der
   Kopf nach 1,6 s wirklich ist. Vorher: bis zu 20 Arme im gleichen
   Winkelabstand in einer flachen Scheibe, je 16 Sterne auf genau
   einer Linie - von unten ein Drahtrad (Tom, 26.09.). */
EFF.kronleuchter=function(p,A,B,s){
  const g=FW.gold, arme=10+Math.floor(Math.random()*4), dreh=Math.random()*Math.PI*2;
  for(let a=0;a<arme;a++){
    const w=dreh+a/arme*Math.PI*2+rand(-0.25,0.25), hoch=rand(0.25,0.8), ch=Math.cos(hoch);
    const d=[Math.cos(w)*ch,Math.sin(hoch),Math.sin(w)*ch], v0=rand(7,8.8)*s, v=[d[0]*v0,d[1]*v0,d[2]*v0];
    psHuge.emit(p.x,p.y,p.z,v[0],v[1],v[2],g[0],g[1],g[2],rand(2.8,3.4),4.6,4);
    for(let i=0;i<Math.round(8*QUAL());i++){ const e=streu(d,0.06), u=v0*rand(0.84,1.0);
      psBig.emit(p.x,p.y,p.z,e[0]*u,e[1]*u,e[2]*u,g[0],g[1],g[2],rand(2.2,3.2),4.6,4); }
    funkenSchweif(p,v,4.6,1.5,3,g);
    later(1.6,()=>{ const q=bahnOrt(p,v,4.6,1.6), vr=bahnTempo(v,4.6,1.6);
      for(let i=0;i<Math.round(12*QUAL());i++){ const e=randDir(), sp=rand(0.4,1.4);
        psMid.emit(q.x,q.y,q.z,vr[0]*0.3+e[0]*sp,vr[1]*0.3+e[1]*sp-0.6,vr[2]*0.3+e[2]*sp,A[0],A[1],A[2],rand(1.0,1.6),2.6,1); } });
  }
  later(1.7,()=>sfx.crackle(distVol(p)*0.5));
};
/* Feuerrad: der Ring dreht sich beim Aufgehen, die Sterne ziehen
   Spiralarme - zwei Farben im Wechsel */
EFF.feuerrad=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.35), n=Math.round(150*s*QUAL());
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a);
    const r=[u[0]*ca+v[0]*sa,u[1]*ca+v[1]*sa,u[2]*ca+v[2]*sa], t=[-u[0]*sa+v[0]*ca,-u[1]*sa+v[1]*ca,-u[2]*sa+v[2]*ca];
    const sp=rand(8.5,9.5)*s, dreh=rand(4,5)*s, c=Math.floor(i/n*8)%2?A:B;
    psBig.emit(p.x,p.y,p.z,r[0]*sp+t[0]*dreh,r[1]*sp+t[1]*dreh,r[2]*sp+t[2]*dreh,c[0],c[1],c[2],rand(1.9,2.4),2.6,0); }
};
/* Sternschnuppen: wenige helle Koepfe ziehen flach nach aussen und
   unten, dahinter lange Silberschweife */
EFF.sternschnuppen=function(p,A,B,s){
  const n=6+Math.floor(Math.random()*3);
  for(let a=0;a<n;a++){
    const w=a/n*Math.PI*2+rand(-0.2,0.2), sp=rand(11,13)*s, c=a%2?A:FW.weiss;
    /* Neigung mit dem Kaliber: vorher blieb vy klein, bei grossen
       Kalibern lagen alle Schnuppen in einer waagrechten Scheibe */
    const el=rand(-0.3,0.4), vx=Math.cos(w)*Math.cos(el)*sp, vy=Math.sin(el)*sp, vz=Math.sin(w)*Math.cos(el)*sp;
    psHuge.emit(p.x,p.y,p.z,vx,vy,vz,c[0]*1.5,c[1]*1.5,c[2]*1.5,rand(2.4,3.0),2.8,0);
    for(let k=1;k<=22;k++){ const t=Math.max(0.03,k*0.075+rand(-0.035,0.035)); later(t,()=>{ const q=bahnOrt(p,[vx,vy,vz],2.8,t-Math.random()*0.05);
      for(let i=0;i<Math.round(9*QUAL());i++) psBig.emit(q.x+rand(-.1,.1),q.y+rand(-.1,.1),q.z+rand(-.1,.1),rand(-.25,.25),rand(-.7,.1),rand(-.25,.25),1.1,1.15,1.3,rand(0.7,1.3),2.6,4); }); }
  }
};
/* Farbregen: ein Schleier aus kleinen Sternen in beiden Farben, der
   langsam und funkelnd herunterrieselt */
EFF.farbregen=function(p,A,B,s){
  const n=Math.round(260*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(2.5,6.5)*s, c=i%2?A:B;
    psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.7+1.0,d[2]*v,c[0],c[1],c[2],rand(3.0,4.2),2.2,4); }
};
/* ---------- Nur fuer Raketen (Tom, 24.09.: "bei den Raketen was
   Eigenes, damit man sie sich ueberhaupt ansehen will") ---------- */
/* Spektrum: jeder Stern laeuft einmal durch alle Farben des
   Regenbogens - rot, orange, gelb, gruen, blau, violett. Die Sterne
   werden in sechs Etappen entlang ihrer Bahn neu gesetzt, jede Etappe
   in der naechsten Farbe und mit Uebergang zur uebernaechsten. */
EFF.spektrum=function(p,A,B,s){
  const F=['rot','orange','zitrone','gruen','himmel','violett','magenta'].map(K);
  const n=Math.round(130*s*QUAL()), dirs=[];
  for(let i=0;i<n;i++){ const d=randDir(); dirs.push([d,rand(8.5,10)*s]); }
  const ET=6, dt=0.34;
  for(let k=0;k<ET;k++) later(k*dt,()=>{
    const t=k*dt, f=(1-Math.exp(-1.1*t))/1.1, fall=0.5*2.6*t*t;
    for(const [d,v] of dirs){ const a=F[k], b=F[k+1], w=Math.exp(-1.1*t);
      psBig.emit(p.x+d[0]*v*f,p.y+d[1]*v*f-fall,p.z+d[2]*v*f,d[0]*v*w,d[1]*v*w-2.6*t,d[2]*v*w,a[0]*1.3,a[1]*1.3,a[2]*1.3,dt*1.25,2.6,2,b[0]*1.3,b[1]*1.3,b[2]*1.3); }
  });
  later(ET*dt,()=>{ for(const [d,v] of dirs){ if(Math.random()<0.5) continue; const t=ET*dt, f=(1-Math.exp(-1.1*t))/1.1;
    psMid.emit(p.x+d[0]*v*f,p.y+d[1]*v*f-0.5*2.6*t*t,p.z+d[2]*v*f,rand(-.3,.3),rand(-1,0),rand(-.3,.3),1,1,1,rand(0.4,0.8),2,3); } });
};
/* Goldglitzer: Goldsterne, die hinter sich blinkende Vorhaenge aus
   Glitzer zurücklassen - der hängt noch, wenn die Sterne verloschen sind */
EFF.goldglitzer=function(p,A,B,s){
  const g=FW.gold, n=Math.round(60*s*QUAL()), dirs=[];
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(6.5,9)*s; dirs.push([d,v]);
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,g[0]*1.3,g[1]*1.3,g[2]*1.2,rand(1.8,2.3),2.8,4); }
  for(let k=1;k<=12;k++) later(k*0.15,()=>{ const t=k*0.15, f=(1-Math.exp(-1.1*t))/1.1, fall=0.5*2.8*t*t*0.8;
    for(const [d,v] of dirs){ const q={x:p.x+d[0]*v*f,y:p.y+d[1]*v*f-fall,z:p.z+d[2]*v*f};
      for(let i=0;i<Math.round(3*QUAL());i++) psMid.emit(q.x,q.y,q.z,rand(-.2,.2),rand(-.6,0),rand(-.2,.2),1.2,1.05,.6,rand(1.4,2.4),0.9,3); } });
  later(0.9,()=>sfx.crackle(distVol(p)*0.45));
};
/* Glitzerweide: Silberglitzer, der lange und tief herunterhaengt */
EFF.glitzerweide=function(p,A,B,s){
  const n=Math.round(170*s*QUAL()), g=FW.silber;
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(4.2,7.2)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.8+1.8,d[2]*v,g[0],g[1],g[2],rand(4.4,6.0),4.2,4); }
  for(let i=0;i<Math.round(34*s*QUAL());i++){ const d=randDir(), v=rand(6,8)*s;
    psHuge.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.2,1.7),2.4,0); }
  later(1.4,()=>sfx.crackle(distVol(p)*0.5));
};
/* Kometen: wenige helle Koepfe mit langen Glitzerschweifen */
EFF.komet=function(p,A,B,s){
  const n=10+Math.floor(Math.random()*5);
  for(let a=0;a<n;a++){
    const d=randDir(), sp=rand(10,13)*s, c=a%3?A:B;
    const vx=d[0]*sp, vy=d[1]*sp*0.8+2.5, vz=d[2]*sp;
    psHuge.emit(p.x,p.y,p.z,vx,vy,vz,c[0],c[1],c[2],rand(2.2,2.8),3.2,0);
    /* der Schweif: Funken loesen sich zufaellig aus der Bahn */
    funkenSchweif(p,[vx,vy,vz],3.2,1.15,4,[1,.86,.5]);
  }
};
/* Titan: riesiger Silberbrokat, dazu ein Knisterkranz und ein harter Schlag */
EFF.titan=function(p,A,B,s){
  const w=FW.silber, n=Math.round(260*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(9,13.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,w[0],w[1],w[2],rand(2.4,3.4),3.6,4); }
  for(let i=0;i<Math.round(70*s*QUAL());i++){ const d=randDir(), v=rand(12,15)*s;
    psHuge.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,A[0],A[1],A[2],rand(1.6,2.2),2.6,0); }
  later(0.7,()=>{ for(let i=0;i<Math.round(180*s*QUAL());i++){ const d=randDir(), v=rand(3,7)*s;
      psMid.emit(p.x+d[0]*6*s,p.y+d[1]*6*s-0.8,p.z+d[2]*6*s,d[0]*v*0.3,d[1]*v*0.3,d[2]*v*0.3,1,.95,.8,rand(0.4,0.9),2.4,3); }
    sfx.crackle(distVol(p)); });
  flash({x:p.x,y:p.y,z:p.z},FW.weiss,7*s,0.35);
  const v=distVol(p); later(0.04,()=>sfx.boom(Math.min(1.6,v*1.4)));
  shake=Math.max(shake,Math.min(1.2,0.7*v));
};
/* Zehnfachbruch: zehn Kugeln gleichzeitig im Kreis um die Mitte */
EFF.zehnfach=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.4), r=6.5*s, F=[A,B,K('weiss'),K('zitrone'),K('magenta')];
  for(let k=0;k<10;k++){
    const a=k/10*Math.PI*2;
    const q={x:p.x+(u[0]*Math.cos(a)+v[0]*Math.sin(a))*r,y:p.y+(u[1]*Math.cos(a)+v[1]*Math.sin(a))*r*0.7,z:p.z+(u[2]*Math.cos(a)+v[2]*Math.sin(a))*r};
    const c=F[k%F.length];
    const m=Math.round(70*s*QUAL());
    for(let i=0;i<m;i++){ const d=randDir(), w=rand(4.2,5.4)*s;
      psBig.emit(q.x,q.y,q.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(1.5,2.1),2.8,i%5?0:4); }
  }
  flash({x:p.x,y:p.y,z:p.z},FW.weiss,6*s,0.4);
};
/* Kaskade: der Bruch faellt in Stufen nach unten und zuendet jede nochmal */
EFF.kaskade=function(p,A,B,s){
  EFF.kugel(p,A,B,s*0.85);
  for(let k=1;k<=4;k++) later(k*0.32,()=>{
    const q={x:p.x+rand(-1.6,1.6)*s,y:p.y-k*2.2*s*rand(0.8,1.2),z:p.z+rand(-1.6,1.6)*s}, c=k%2?B:A;
    for(let i=0;i<Math.round(60*s*QUAL());i++){ const d=randDir(), w=rand(4,6)*s*(1-k*0.1);
      psBig.emit(q.x,q.y,q.z,d[0]*w,d[1]*w*0.5,d[2]*w,c[0],c[1],c[2],rand(1.2,1.7),3,4); }
    sfx.crack(distVol(q)*0.8);
  });
};

/* =========================================================
   Bruchbilder nach Toms Vorlagen: Schneeflocke, Spirale,
   Ring im Ring, Strauss aus kleinen Kugeln
   ========================================================= */
/* Schneeflocke: sechs Arme in einer Ebene, jeder mit Seitenaesten */
EFF.schneeflocke=function(p,A,B,s){
  const [u,v]=basisBlick(p,0), sp=11*s, c=FW.silber;
  const dir=a=>[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
  for(let k=0;k<6;k++){ const a=k/6*Math.PI*2, d=dir(a);
    const n=Math.round(22*QUAL());
    for(let i=0;i<n;i++){ const f=(0.12+i/n*0.9)*rand(0.97,1.03), e=streu(d,0.02);
      psBig.emit(p.x,p.y,p.z,e[0]*sp*f,e[1]*sp*f,e[2]*sp*f,c[0],c[1],c[2],rand(1.8,2.3),0.9,0); }
    /* Seitenaeste bei 35, 55 und 75 Prozent, nach aussen kuerzer */
    for(const [f0,L] of [[0.35,0.34],[0.55,0.26],[0.75,0.18]]) for(const sg of [-1,1]){
      const d2=dir(a+sg*Math.PI/3);
      for(let i=1;i<=Math.round(7*QUAL());i++){ const w=L*i/7;
        psBig.emit(p.x,p.y,p.z,(d[0]*f0+d2[0]*w)*sp,(d[1]*f0+d2[1]*w)*sp,(d[2]*f0+d2[2]*w)*sp,A[0]*0.5+0.5,A[1]*0.5+0.5,A[2]*0.5+0.5,rand(1.6,2.1),0.9,0); } }
    psHuge.emit(p.x,p.y,p.z,d[0]*sp,d[1]*sp,d[2]*sp,1,1,1,rand(1.9,2.3),0.9,0);
  }
};
/* Spirale: acht gebogene Arme, die sich im Kreis drehen */
EFF.spirale=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.35), sp=10.5*s, arme=8;
  for(let k=0;k<arme;k++){ const a0=k/arme*Math.PI*2;
    const n=Math.round(26*QUAL());
    for(let i=0;i<n;i++){ const f=0.15+i/n*0.85, a=a0+f*1.9, c=i%3?A:B;
      const dx=u[0]*Math.cos(a)+v[0]*Math.sin(a), dy=u[1]*Math.cos(a)+v[1]*Math.sin(a), dz=u[2]*Math.cos(a)+v[2]*Math.sin(a);
      psBig.emit(p.x,p.y,p.z,dx*sp*f,dy*sp*f,dz*sp*f,c[0],c[1],c[2],rand(1.7,2.2),1.4,i%4?0:4); } }
};
/* Ring im Ring: aussen ein Ring, innen ein kleinerer in der Gegenfarbe */
EFF.ringring=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.4);
  for(const [c,sp,n] of [[A,10*s,110],[B,5.4*s,70]]) for(let i=0;i<Math.round(n*QUAL());i++){
    const a=i/n*Math.PI*2, w=sp*rand(0.97,1.03);
    const dx=u[0]*Math.cos(a)+v[0]*Math.sin(a), dy=u[1]*Math.cos(a)+v[1]*Math.sin(a), dz=u[2]*Math.cos(a)+v[2]*Math.sin(a);
    psBig.emit(p.x,p.y,p.z,dx*w,dy*w,dz*w,c[0],c[1],c[2],rand(1.9,2.4),1.8,0); }
};
/* Strauss: sechs kleine Kugeln in sechs Farben um die Mitte */
EFF.strauss=function(p,A,B,s){
  const F=['rot','gold','blau','gruen','violett','orange'].map(K);
  for(let k=0;k<6;k++){ const d=randDir(), r=rand(3.5,5.5)*s, q={x:p.x+d[0]*r,y:p.y+d[1]*r*0.7,z:p.z+d[2]*r}, c=F[k];
    const m=Math.round(80*s*QUAL());
    for(let i=0;i<m;i++){ const e=randDir(), w=rand(4.2,5.4)*s;
      psBig.emit(q.x,q.y,q.z,e[0]*w,e[1]*w,e[2]*w,c[0],c[1],c[2],rand(1.5,2.0),2.4,0); }
    kern(q,c,s*0.6); }
};
/* =========================================================
   Jumbo-Raketen (Tom, 25.09.): zwei Effekte, die es nur dort gibt.
   ========================================================= */
/* Position eines Sterns nach T Sekunden - dieselbe Rechnung wie in
   PS.update: Luftwiderstand ZIEH, Schwerkraft g */
function sternNach(p,vx,vy,vz,g,T){
  const e=(1-Math.exp(-ZIEH*T))/ZIEH;
  return {x:p.x+vx*e,y:p.y+(vy+g/ZIEH)*e-g/ZIEH*T,z:p.z+vz*e};
}
/* Goldene Krone: dicke Goldpalme, jeder Finger endet nach einer
   Sekunde in einem farbigen Sternbuendel - Juwelen auf der Krone */
EFF.sternpalme=function(p,A,B,s){
  const arms=10+Math.floor(Math.random()*3), g=FW.gold, G=4.4, T=1.05;
  const juwel=[B,K('rot'),K('tuerkis'),B,K('magenta')];
  for(let a=0;a<arms;a++){
    const ang=a/arms*Math.PI*2+rand(-.12,.12), tilt=rand(0.35,1.0), sp=rand(8.5,10.5)*s;
    const vx=Math.cos(ang)*Math.cos(tilt)*sp, vy=Math.sin(tilt)*sp+2, vz=Math.sin(ang)*Math.cos(tilt)*sp;
    const n=Math.round(18*QUAL());
    for(let i=0;i<n;i++){ const f=0.35+i/n*0.75;
      psBig.emit(p.x,p.y,p.z,vx*f+rand(-.4,.4),vy*f+rand(-.4,.4),vz*f+rand(-.4,.4),g[0],g[1],g[2],rand(2.4,3.2),G,4); }
    /* die Spitze: dort, wo der schnellste Stern des Fingers gerade ist */
    const q=sternNach(p,vx*1.1,vy*1.1,vz*1.1,G,T), c=juwel[a%juwel.length];
    later(T,()=>{
      for(let i=0;i<Math.round(22*QUAL());i++){ const d=randDir(), w=rand(2.2,3.6)*s;
        psBig.emit(q.x,q.y,q.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(1.1,1.6),2.6,0); }
      psHuge.emit(q.x,q.y,q.z,0,0,0,1,1,1,0.12,0,0);
    });
  }
  later(T,()=>{ sfx.crack(distVol(p)*0.9); flash(p,B,2.6,0.4); });
  for(let i=0;i<Math.round(30*QUAL());i++){ const d=randDir(), v=rand(1,3);
    psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,1,.9,.6,rand(1,1.6),2.5,4); }
};
/* Polarstern (Toms PDF vom 25.09.: Einzelraketen haben genau einen
   Schuss, der dafuer richtig besonders ist). Alles geht im selben
   Augenblick auf: eine riesige Kugel, deren Sterne von tiefblau nach
   silberweiss wechseln, darin ein vierstrahliger Stern, der zum
   Zuschauer zeigt, ein goldener Glitzerguertel und ein flackernder
   weisser Kern. Vorher stieg die Himmelsleiter mit Kometen in drei
   Stufen hoeher - das sah nach mehreren Ladungen aus. */
EFF.polarstern=function(p,A,B,s){
  /* bei gleichem Kaliber so gross wie die Goldene Krone */
  s*=0.6;
  const q=QUAL(), [u,v]=basisBlick(p,0), blau=A||K('blau'), silber=FW.silber;
  /* Kugel mit Farbwechsel */
  for(let i=0;i<Math.round(340*s*q);i++){ const d=randDir(), w=rand(10.5,12)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,blau[0],blau[1],blau[2],rand(2.8,3.4),2.2,2,silber[0],silber[1],silber[2]); }
  /* vier Strahlen in der Bildebene, je Strahl eine dichte Sternkette */
  for(let a=0;a<4;a++){ const ang=a*Math.PI/2, c=Math.cos(ang), sn=Math.sin(ang);
    const dx=u[0]*c+v[0]*sn, dy=u[1]*c+v[1]*sn, dz=u[2]*c+v[2]*sn;
    for(let i=0;i<Math.round(34*q);i++){ const f=0.15+i/34*1.25, w=15*s*f;
      psHuge.emit(p.x,p.y,p.z,dx*w,dy*w,dz*w,1,1,1,rand(2.2,2.8),1.2,0); } }
  /* kurze Diagonalen: der Stern hat acht Zacken, vier lange, vier kurze */
  for(let a=0;a<4;a++){ const ang=a*Math.PI/2+Math.PI/4, c=Math.cos(ang), sn=Math.sin(ang);
    const dx=u[0]*c+v[0]*sn, dy=u[1]*c+v[1]*sn, dz=u[2]*c+v[2]*sn;
    for(let i=0;i<Math.round(14*q);i++){ const w=6.5*s*(0.2+i/14*0.8);
      psBig.emit(p.x,p.y,p.z,dx*w,dy*w,dz*w,B[0],B[1],B[2],rand(1.8,2.3),1.2,0); } }
  /* goldener Glitzerguertel */
  for(let i=0;i<Math.round(90*q);i++){ const a=i/90*Math.PI*2, w=rand(8.2,9)*s;
    const n=[Math.cos(a),0,Math.sin(a)];
    psMid.emit(p.x,p.y,p.z,n[0]*w,rand(-0.3,0.3),n[2]*w,1,.82,.3,rand(2.6,3.4),1.6,4); }
  /* flackernder Kern */
  for(let i=0;i<Math.round(60*q);i++){ const d=randDir(), w=rand(0.5,2.5);
    psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,1,1,rand(1.6,2.4),0.8,1); }
  flash(p,silber,9*s,0.6);
  const vol=distVol(p); later(0.04,()=>sfx.boom(Math.min(1.6,vol*1.4)));
  later(0.9,()=>sfx.crackle(vol*0.6));
  shake=Math.max(shake,Math.min(1.2,0.6*vol));
};
/* =========================================================
   Neue Bruchbilder (Tom, 25.09.: "noch viel mehr verschiedene
   Effekt-Explosions-Arten, farblich passend"). Vorbilder aus den
   Glossaren von Phantom Fireworks, der American Pyrotechnics
   Association und Dynamic Fireworks: Diadem, Rossschweif (Horsetail),
   Drachenei (Dragon's eggs), Bienen, Schmetterling (Farfalle),
   Kokosnuss-Palme, Nishiki-Kamuro, Blumenkranz, Strobe-Weide,
   Musterbrueche (Smiley, Krone, Regenbogenring).
   Jedes Bild gehoert zu genau einem Produkt - daran erkennt man es.
   ========================================================= */
/* Stern in der Bildebene: x nach rechts, y nach oben, Geschwindigkeit sp */
function ebeneEmit(ps,p,u,v,x,y,sp,c,life,g,mode){
  ps.emit(p.x,p.y,p.z,(u[0]*x+v[0]*y)*sp,(u[1]*x+v[1]*y)*sp,(u[2]*x+v[2]*y)*sp,c[0],c[1],c[2],life,g,mode||0);
}
/* Smiley: Gesicht, zwei Augen, ein Laecheln */
EFF.smiley=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.05), q=QUAL(), sp=8*s;
  for(let i=0;i<Math.round(70*q);i++){ const a=i/70*Math.PI*2; ebeneEmit(psBig,p,u,v,Math.cos(a),Math.sin(a),sp,A,rand(2.0,2.4),2.0); }
  for(const ex of [-0.36,0.36]) for(let i=0;i<Math.round(10*q);i++){ const a=i/10*Math.PI*2;
    ebeneEmit(psBig,p,u,v,ex+Math.cos(a)*0.1,0.3+Math.sin(a)*0.12,sp,B,rand(2.0,2.4),2.0); }
  for(let i=0;i<Math.round(26*q);i++){ const a=Math.PI*(1.15+i/25*0.7); ebeneEmit(psBig,p,u,v,Math.cos(a)*0.58,Math.sin(a)*0.58+0.05,sp,B,rand(2.0,2.4),2.0); }
};
/* Bienen: ein Schwarm kleiner Lichter, die im Zickzack davonsummen */
EFF.bienen=function(p,A,B,s){
  const n=Math.round(46*s*QUAL());
  for(let b=0;b<n;b++){ const d=randDir(), q={x:p.x,y:p.y,z:p.z}, c=b%2?A:B; let dir=d;
    for(let k=0;k<8;k++) later(k*0.14,()=>{ const r=randDir(); dir=[dir[0]+r[0]*0.9,dir[1]+r[1]*0.9-0.1,dir[2]+r[2]*0.9];
      const l=Math.hypot(...dir)||1; dir=[dir[0]/l,dir[1]/l,dir[2]/l];
      q.x+=dir[0]*1.2*s; q.y+=dir[1]*1.2*s; q.z+=dir[2]*1.2*s;
      psMid.emit(q.x,q.y,q.z,dir[0]*7*s,dir[1]*7*s,dir[2]*7*s,c[0]*1.2,c[1]*1.2,c[2]*1.2,0.35,0,4);
      psSmall.emit(q.x,q.y,q.z,dir[0]*2,dir[1]*2,dir[2]*2,1,.95,.7,0.3,0,0); }); }
  for(let i=0;i<4;i++) later(i*0.25,()=>sfx.crackle(distVol(p)*0.3));
};
/* Drachenei: Goldsterne fliegen aus und zerplatzen nach einer Sekunde knisternd */
EFF.drachenei=function(p,A,B,s){
  const n=Math.round(70*s*QUAL()), g=FW.gold, T=1.1, G=2.6, eier=[];
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(6.5,8.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,g[0],g[1],g[2],T,G,4); eier.push(sternNach(p,d[0]*w,d[1]*w,d[2]*w,G,T)); }
  later(T,()=>{ for(const e of eier){ const c=Math.random()<0.5?A:FW.weiss;
      for(let k=0;k<Math.round(6*QUAL());k++){ const d=randDir(), w=rand(1,2.4);
        psSmall.emit(e.x,e.y,e.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(0.3,0.6),2,3); } }
    sfx.crackle(distVol(p)); later(0.12,()=>sfx.crackle(distVol(p)*0.8)); });
};
/* Kokosnuss-Palme: wenige schwere Aeste, die tief nach unten biegen,
   in der Mitte eine kleine Farbbluete - die Kokosnuesse */
EFF.kokosnuss=function(p,A,B,s){
  const g=FW.gold, aeste=8+Math.floor(Math.random()*3);
  for(let a=0;a<aeste;a++){ const ang=a/aeste*Math.PI*2+rand(-.1,.1), tilt=rand(0.25,0.7), sp=rand(8.5,10)*s;
    const vx=Math.cos(ang)*Math.cos(tilt)*sp, vy=Math.sin(tilt)*sp, vz=Math.sin(ang)*Math.cos(tilt)*sp;
    for(let i=0;i<Math.round(22*QUAL());i++){ const f=0.3+i/22*0.8;
      psBig.emit(p.x,p.y,p.z,vx*f,vy*f,vz*f,g[0],g[1]*0.9,g[2]*0.8,rand(2.8,3.6),5.6,4); } }
  for(let i=0;i<Math.round(40*QUAL());i++){ const d=randDir(), w=rand(2.2,3)*s, c=i%2?A:B;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(1.2,1.6),2,0); }
};
/* Schmetterlinge: kleine Achten aus zwei Farben, die nach aussen flattern */
EFF.schmetterling=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.3), n=7;
  for(let k=0;k<n;k++){ const a=k/n*Math.PI*2+rand(-.2,.2), cx=Math.cos(a), cy=Math.sin(a), w=6.5*s;
    for(let i=0;i<Math.round(22*QUAL());i++){ const t=i/22*Math.PI*2, lx=Math.sin(t)*0.5, ly=Math.sin(t)*Math.cos(t)*0.45, c=lx<0?A:B;
      psBig.emit(p.x,p.y,p.z,(u[0]*(cx+lx*0.6)+v[0]*(cy+ly*0.6))*w,(u[1]*(cx+lx*0.6)+v[1]*(cy+ly*0.6))*w,(u[2]*(cx+lx*0.6)+v[2]*(cy+ly*0.6))*w,
        c[0],c[1],c[2],rand(1.7,2.2),2.2,0); } }
};
/* Blumenkranz: acht kleine Blueten auf einem Kranz um eine Mitte */
EFF.blumenkranz=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.35), R=6.2*s, T=0.28;
  for(let k=0;k<8;k++){ const a=k/8*Math.PI*2, x=Math.cos(a), y=Math.sin(a), c=k%2?A:B;
    const q={x:p.x+(u[0]*x+v[0]*y)*R,y:p.y+(u[1]*x+v[1]*y)*R,z:p.z+(u[2]*x+v[2]*y)*R};
    psMid.emit(p.x,p.y,p.z,(q.x-p.x)/T,(q.y-p.y)/T,(q.z-p.z)/T,1,.9,.6,T,0,0);
    later(T,()=>{ for(let i=0;i<Math.round(34*QUAL());i++){ const d=randDir(), w=rand(2.6,3.2)*s;
        psBig.emit(q.x,q.y,q.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(1.4,1.9),2.2,0); }
      psHuge.emit(q.x,q.y,q.z,0,0,0,1,1,1,0.18,0,0); }); }
  later(T,()=>sfx.crackle(distVol(p)*0.6));
};
/* Strobe-Weide: Silberweide, deren Spitzen blitzen */
EFF.strobeweide=function(p,A,B,s){
  const n=Math.round(120*s*QUAL()), g=FW.silber;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(4.5,7)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w*0.8+1.5,d[2]*w,g[0],g[1],g[2],rand(3.4,4.4),4.6,4);
    if(i%2===0) psMid.emit(p.x,p.y,p.z,d[0]*w*1.02,d[1]*w*0.82+1.5,d[2]*w*1.02,A[0]*0.6+0.4,A[1]*0.6+0.4,A[2]*0.6+0.4,rand(3.0,3.8),4.6,1); }
};
/* Rossschweif: kurze Wurf nach oben, dann faellt alles als Saeule herab */
EFF.rossschweif=function(p,A,B,s){
  const n=Math.round(140*s*QUAL());
  for(let i=0;i<n;i++){ let d=randDir(); if(d[1]<0.35) d=[d[0]*0.6,0.35+Math.random()*0.65,d[2]*0.6];
    const w=rand(3,6)*s, c=i%5?FW.gold:A;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(3.2,4.2),6.5,4); }
};
/* Diadem: Pfingstrose mit stehendem Kern und goldenem Glitzerreif */
EFF.diadem=function(p,A,B,s){
  const q=QUAL();
  for(let i=0;i<Math.round(160*s*q);i++){ const d=randDir(), w=rand(9,10.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(1.8,2.3),2.8,0); }
  for(let i=0;i<Math.round(50*q);i++){ const d=randDir(), w=rand(0.2,0.8)*s;
    psHuge.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(2.2,2.8),0.6,0); }
  const [u,v]=basisBlick(p,0.8);
  for(let i=0;i<Math.round(70*q);i++){ const a=i/70*Math.PI*2; ebeneEmit(psMid,p,u,v,Math.cos(a),Math.sin(a)*0.3,9.8*s,FW.gold,rand(2.2,2.8),2.4,4); }
};
/* Goldvorhang: eine waagerechte Linie Goldglitzer, die als Vorhang faellt */
EFF.goldvorhang=function(p,A,B,s){
  const [u]=basisBlick(p,0), g=FW.gold, q=QUAL();
  for(let i=0;i<Math.round(110*s*q);i++){ const x=rand(-1,1), w=10*s;
    psBig.emit(p.x,p.y,p.z,u[0]*x*w,rand(0.5,2.5),u[2]*x*w,g[0],g[1],g[2]*0.9,rand(3.4,4.4),3.4,4); }
  for(let i=0;i<Math.round(30*s*q);i++){ const x=rand(-1,1), w=10*s;
    psHuge.emit(p.x,p.y,p.z,u[0]*x*w,rand(1,3),u[2]*x*w,A[0],A[1],A[2],rand(1.4,1.9),2.6,0); }
};
/* Krone: Goldbogen mit Zacken, auf jeder Zacke ein Juwel */
/* Krone: Brokatkrone - dichter Goldbrokat, der nach oben aufgeht und
   wie eine Krone nach aussen und unten faellt, in der Mitte ein
   farbiges Herz. Vorher eine flache Drahtfigur zum Zuschauer: 60
   Punkte als gerade Grundlinie, sieben senkrechte Punktspalten, jeder
   Punkt mit Leuchtspur zur Mitte (Tom, 26.09., Weltuntergang: "sieht
   total unecht aus ... irgendein Fehler im Code"). */
EFF.krone=function(p,A,B,s){
  const g=FW.gold, n=Math.round(150*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), v=rand(7.2,9.4)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v*0.85+1.6*s,d[2]*v,g[0],g[1],g[2],rand(3.0,3.8),4.8,4); }
  for(let i=0;i<Math.round(46*s*QUAL());i++){ const d=randDir(), v=rand(3.0,4.4)*s, c=i%2?A:B;
    psBig.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,c[0],c[1],c[2],rand(1.4,1.9),2.6,0); }
};
/* Regenbogenring: ein Ring, dessen Farbe einmal durch das Spektrum laeuft */
EFF.regenbogenring=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.3), F=['rot','orange','zitrone','gruen','tuerkis','blau','violett','magenta'].map(K), n=Math.round(96*QUAL());
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, c=F[Math.floor(i/n*F.length)];
    ebeneEmit(psBig,p,u,v,Math.cos(a),Math.sin(a),9.2*s,c,rand(2.0,2.5),2.2,0); }
  for(let i=0;i<Math.round(30*QUAL());i++){ const d=randDir(), w=rand(1.5,2.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,1,1,rand(1.2,1.6),2,1); }
};
/* Pfeifsterne: helle Kometen, die pfeifend davonziehen */
EFF.pfeifsterne=function(p,A,B,s){
  const n=22;
  /* farbiger Kern, aus dem die Pfeifer herausschiessen */
  for(let i=0;i<Math.round(80*s*QUAL());i++){ const d=randDir(), w=rand(4.5,6)*s, c=i%3?B:A;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(1.5,2),2.4,0); }
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(10,12.5)*s, c=i%2?A:B;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(1.6,2.1),2.2,0);
    for(let k=0;k<Math.round(6*QUAL());k++){ const f=0.5+k*0.08;
      psMid.emit(p.x,p.y,p.z,d[0]*w*f,d[1]*w*f,d[2]*w*f,1,.9,.7,rand(0.9,1.4),2.2,4); } }
  const v=distVol(p); for(let i=0;i<3;i++) later(i*0.12,()=>sfx.whistle(v*0.9));
};
/* Nishiki-Kamuro: Brokatgold, an jeder Spitze ein farbiger Stern */
EFF.nishiki=function(p,A,B,s){
  const n=Math.round(130*s*QUAL()), g=FW.gold;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(7.5,9)*s, c=i%2?A:B;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,g[0],g[1]*0.85,g[2]*0.6,rand(2.8,3.4),2.8,4);
    psHuge.emit(p.x,p.y,p.z,d[0]*w*1.04,d[1]*w*1.04,d[2]*w*1.04,c[0],c[1],c[2],rand(1.8,2.2),2.8,0); }
  later(1.2,()=>sfx.crackle(distVol(p)*0.5));
};
/* Roemische Kerze: kein Bruch, sondern eine leuchtende Kugel, die aus
   dem Rohr steigt und verglueht */
function perleSchuss(o,A,s){
  const y0=(o.y!==undefined?o.y:0.4)+0.3, alt=SCHWEIF; SCHWEIF=0.35;
  const vy=rand(15,18)*Math.sqrt(s||1), vx=rand(-0.6,0.6), vz=rand(-0.6,0.6);
  const L=rand(1.6,2.0);
  for(let k=0;k<3;k++) psHuge.emit(o.x,y0,o.z,vx,vy,vz,A[0]*1.3,A[1]*1.3,A[2]*1.3,L,6,0);
  psBig.emit(o.x,y0,o.z,vx,vy,vz,1,1,1,L*0.4,6,0);
  /* Funkenschweif hinter der Kugel und ein kurzer Muendungsblitz */
  for(let i=0;i<Math.round(40*QUAL());i++) psMid.emit(o.x,y0,o.z,vx*0.9+rand(-.3,.3),vy*rand(0.45,0.98),vz*0.9+rand(-.3,.3),1,.8,.4,rand(0.8,1.5),6,4);
  muendungsblitz(o,y0,1.2);
  SCHWEIF=alt;
  if(FW_LOG) FW_LOG.push({t:FW_UHR,art:'perle',kal:0,pw:0,sz:s||1,eff:'perle',A,B:A,stufenEff:[],hoehe:0,brueche:1,groesste:s||1});
  if(typeof bruchGesehen==='function') bruchGesehen('perle');
  sfx.thump(distVol(o)*0.8);
}
/* Drachenblut: rote Dahlie, deren Sterne als Blutstropfen abtropfen */
EFF.drachenblut=function(p,A,B,s){
  const n=Math.round(70*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(9.5,11)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(1.9,2.3),3,0);
    for(let k=0;k<3;k++){ const f=0.35+k*0.18;
      psMid.emit(p.x,p.y,p.z,d[0]*w*f,d[1]*w*f,d[2]*w*f,A[0],A[1]*0.6,A[2]*0.4,rand(2.4,3.0),5,2,0.45,0.05,0.02); } }
  for(let i=0;i<Math.round(40*QUAL());i++){ const d=randDir(), w=rand(2,3.2)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(1.3,1.7),2,0); }
};
/* Weltenbrand: Chrysantheme mit Farbwechsel, Glutkern und Feuerreif */
EFF.weltenbrand=function(p,A,B,s){
  const q=QUAL();
  for(let i=0;i<Math.round(170*s*q);i++){ const d=randDir(), w=rand(8.5,10.5)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(2.2,2.8),3.2,2,B[0],B[1],B[2]); }
  for(let i=0;i<Math.round(60*q);i++){ const d=randDir(), w=rand(2.5,4)*s;
    psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.7,.25,rand(1.6,2.2),2.4,4); }
  const [u,v]=basisBlick(p,0.9);
  for(let i=0;i<Math.round(60*q);i++){ const a=i/60*Math.PI*2; ebeneEmit(psBig,p,u,v,Math.cos(a),Math.sin(a)*0.25,11.5*s,FW.orange,rand(1.8,2.3),2.6,0); }
};
/* Himmelsbrecher: riesige Silberkugel in zwei Schalen, die Spitzen
   zerplatzen am Ende knisternd */
EFF.himmelsbrecher=function(p,A,B,s){
  const q=QUAL(), w0=FW.silber, T=1.35, G=2.6, spitzen=[];
  for(let i=0;i<Math.round(230*s*q);i++){ const d=randDir(), w=rand(9.5,11)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,w0[0],w0[1],w0[2],T,G,4);
    if(i%6===0) spitzen.push(sternNach(p,d[0]*w,d[1]*w,d[2]*w,G,T)); }
  for(let i=0;i<Math.round(90*s*q);i++){ const d=randDir(), w=rand(5,6)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(1.8,2.2),2.4,0); }
  later(T,()=>{ for(const e of spitzen) for(let k=0;k<Math.round(4*q);k++){ const d=randDir(), w=rand(1,2.2);
      psSmall.emit(e.x,e.y,e.z,d[0]*w,d[1]*w,d[2]*w,1,1,.9,rand(0.3,0.6),2,3); }
    sfx.crackle(distVol(p)); later(0.1,()=>sfx.crackle(distVol(p))); });
};
/* Wie lang die Leuchtspur je Bruchbild ist (Sekunden Flugbahn) */
const EFF_SCHWEIF={kugel:0.4,chrys:0.75,wechsel:0.35,weide:1.9,palme:1.1,ring:0.3,doppelring:0.3,crossette:0.35,
  knister:0.3,blink:0,brokat:1.3,herz:0.18,stern:0.18,kreisel:0.4,fische:0.25,doppel:0.4,dreifach:0.45,
  dahlie:0.45,pistill:0.4,kamuro:1.8,spinne:0.5,strobe:0,zeitregen:0.9,blaetter:0,geist:0.35,salut:0.08,saturn:0.3,
  tausend:0.25,mehrring:0.35,regenbogen:0.4,glitzerweide:2.0,komet:0.9,titan:0.8,zehnfach:0.35,kaskade:0.5,
  schneeflocke:0.22,spirale:0.3,ringring:0.25,strauss:0.35,furz:0,
  flammenregen:0.7,kronleuchter:0.9,feuerrad:0.55,sternschnuppen:0.9,farbregen:0.5,spektrum:0.2,goldglitzer:0.9,
  sternpalme:1.1,polarstern:0.35,
  smiley:0.15,bienen:0.3,drachenei:0.6,kokosnuss:1.3,schmetterling:0.2,blumenkranz:0.25,strobeweide:1.2,rossschweif:1.4,
  diadem:0.3,goldvorhang:1.3,krone:1.1,regenbogenring:0.2,pfeifsterne:0.9,nishiki:1.1,drachenblut:0.5,weltenbrand:0.6,himmelsbrecher:0.5};
function mitSchweif(eff,fn){ const alt=SCHWEIF; SCHWEIF=EFF_SCHWEIF[eff]!==undefined?EFF_SCHWEIF[eff]:null; try{ fn(); } finally { SCHWEIF=alt; } }
const EFF_ALL=Object.keys(EFF);
/* Was in welcher Groessenklasse geschossen wird */
const EFF_KLEIN=['kugel','ring','knister','fische','kreisel','wechsel','spinne','strobe','tausend','regenbogen','ringring','spirale'];
const EFF_GROSS=['chrys','weide','palme','brokat','doppelring','crossette','dreifach','blink','dahlie','pistill','geist','saturn','blaetter','mehrring','komet','kaskade','glitzerweide','schneeflocke','spirale','ringring','strauss'];
const EFF_PRO=['kamuro','brokat','pistill','zeitregen','dahlie','geist','weide','palme','saturn','chrys','mehrring','komet','glitzerweide','titan','strauss'];

/* =========================================================
   Raketen
   ========================================================= */
/* Mitschnitt fuer Tests: wer FW_LOG auf ein Array setzt, bekommt
   jeden Schuss mit Zeit, Kaliber, Effekt, Farben und Steighoehe */
let FW_LOG=null, FW_UHR=0;
function shot(o,opt){
  opt=opt||{}; o=o||PAD;
  const ang=opt.ang||0, dir=opt.dir===undefined?rand(0,Math.PI*2):opt.dir;
  /* Spielmassstab: die Brueche liegen bei gut 15 m statt 21 m. Vom
     Zuendpult aus - sieben bis zwoelf Meter vor den Stationen - lagen
     sie sonst so steil ueber einem, dass man sie beim Zuenden nicht
     im Bild hatte. */
  /* Kugelbomben steigen ohne Zufall: jedes Kaliber hat seine feste
     Bruchhoehe, damit die groessere Kugel immer hoeher aufgeht */
  /* fest: ohne Zufall in der Hoehe (Kugeln, Einzelraketen) */
  const up=((opt.pw||0)+(opt.kugel||opt.fest?21:rand(19,23)))*STEIG;
  const sc=opt.A?[opt.A,opt.B||opt.A]:scheme(opt.sc);
  /* ab: Hoehe ueber dem Ursprung, jit: seitliche Streuung. Aus einem
     Rohr oder einer Batterie kommt der Schuss genau dort heraus. */
  const jit=o.jit!==undefined?o.jit:0.35, ab=o.ab!==undefined?o.ab:0.4;
  const start=V(o.x+rand(-jit,jit),o.y!==undefined?o.y+ab:1,o.z+rand(-jit,jit));
  /* Muendungsfeuer: kurzer Blitz, ein paar Funken zur Seite */
  muendungsblitz(start,start.y,1+(opt.dick||0));
  const fuse=opt.fuse||rand(1.05,1.35);
  if(FW_LOG) FW_LOG.push({t:FW_UHR,art:opt.kugel?'kugel':'schuss',kal:opt.kugel||0,pw:opt.pw||0,sz:opt.sz||1,eff:opt.eff||'?',A:sc[0],B:sc[1],
    stufenEff:(opt.stufen||[]).map(x=>x.eff),
    hoehe:+(start.y+Math.cos(ang)*up*fuse-3*fuse*fuse).toFixed(2),brueche:1+(opt.stufen?opt.stufen.length:0),
    groesste:Math.max(opt.sz||1,...(opt.stufen||[]).filter(x=>x.eff!=='salut').map(x=>x.sz)),hell:opt.hell||1});
  rockets.push({
    p:start,
    v:V(Math.sin(dir)*Math.sin(ang)*up,Math.cos(ang)*up,Math.cos(dir)*Math.sin(ang)*up),
    fuse,
    A:sc[0],B:sc[1],eff:opt.eff||pick(EFF_GROSS),size:opt.sz||1,
    trail:opt.trail||(Math.random()<0.25?FW.silber:FW.gold),
    /* Nachbrueche: Tochterbomben, die nach dem Hauptbruch aufgehen */
    stufen:opt.stufen||null, dick:opt.dick||0,
    /* pfeif: die Rakete zieht eine Spirale und heult beim Steigen */
    pfeif:!!opt.pfeif, ph:Math.random()*6,
    /* hell: Helligkeit aus der Steigerung einer Show */
    hell:opt.hell||1
  });
  sfx.thump(distVol(o)*(1+(opt.dick||0)*0.5));
  if(opt.pfeif) sfx.whistle(distVol(o));
  else if(Math.random()<0.45) sfx.whistle(distVol(o)*0.7);
}
/* =========================================================
   Kugelbombe: schwerer Aufstieg aus dem Moerser, oben ein
   grosser Hauptbruch und danach die Tochterbrueche.
   kal ist der Kaliber-Faktor: 1 = 75 mm, 2 = 100 mm,
   3 = 150 mm, 4 = 200 mm (zehn Brueche auf einmal).
   ========================================================= */
/* Punkte auf einem Ring um den Hauptbruch, leicht gekippt */
function ringLage(n,r,kipp){
  const [u,v]=basis(), out=[];
  for(let k=0;k<n;k++){ const a=k/n*Math.PI*2+rand(-0.08,0.08);
    out.push([(u[0]*Math.cos(a)+v[0]*Math.sin(a))*r,(u[1]*Math.cos(a)+v[1]*Math.sin(a))*r*(kipp||0.6),(u[2]*Math.cos(a)+v[2]*Math.sin(a))*r]); }
  return out;
}
function kugelbombe(o,kal,opt){
  /* Neu am 25.09. (Toms PDF: "viel groessere Explosionen, von klein
     nach gross, die Effektladungen sollen zueinander passen").
     Jede Kugel ist ein Bild aus einem Guss: ein grosser Hauptbruch,
     dazu Ladungen aus derselben Familie und in den Farben desselben
     Themas - keine Knisterwolke neben einer Blume, kein Salut quer
     durchs Bild. Von Kaliber zu Kaliber waechst alles stetig: Groesse,
     Hoehe, Zahl der Ladungen.
       Hauptbilder seit dem 25.09. je Kaliber einzigartig: Herz,
       Drachenblut, Weltenbrand, Zehnfachbruch, Himmelsbrecher.
       75 mm Herzschlag     : Herz, zwei Herzen darin schlagen nach   (3)
       100 mm Drachenblut   : Dahlie mit Kern und Aussenschale,
                              danach regnet sie als Flammen ab        (4)
       150 mm Weltenbrand   : Farbwechsel-Kugel mit Kern, vier gleiche
                              Toechter im Kranz                       (6)
       200 mm Goetterzorn   : Ringkugel, zehn gleiche Pistillen im
                              Kranz - der Zehnfachbruch               (11)
       300 mm Himmelsbrecher: riesiger Silberbruch mit goldener
                              Hangeweide, zwoelf Dahlien im Kranz     (14) */
  opt=opt||{};
  const K4=Math.max(1,Math.min(5,kal|0));
  const TH=['herz','glut','himmel','zorn','silber'][K4-1];
  const [A,B]=opt.A?[opt.A,opt.B||opt.A]:themaPaar(TH,0);
  /* vorher 1,6 bis 3,4 - jetzt deutlich groesser */
  const groesse=[2.1,2.7,3.3,4.0,4.8][K4-1];
  /* Bruchhoehe etwa 26, 30, 34, 38 und 45 m - ueber jeder Batterie,
     und hoch genug, dass der groessere Bruch nicht den Boden streift */
  const steig=[2,4,6,8,11][K4-1];
  const zuend=[1.7,1.85,2.0,2.15,2.3][K4-1];
  /* Abschussknall und Muendungsfeuer im Rohr */
  const v0=distVol(o);
  sfx.boom(Math.min(1.5,v0*(0.6+0.2*K4)));
  shake=Math.max(shake,Math.min(1.2,0.25*K4)*v0);
  flash({x:o.x,y:o.y+0.4,z:o.z},FW.bernstein,2.8+K4,0.3);
  for(let i=0;i<Math.round(70*K4*QUAL());i++){
    const a=Math.random()*Math.PI*2, w=rand(0.4,2.4);
    psMid.emit(o.x,o.y+(o.ab!==undefined?o.ab:0.3),o.z,Math.cos(a)*w,rand(5,13),Math.sin(a)*w,1,.78,.34,rand(0.5,1.2),7,4);
  }
  /* jede Kugel hat ein Hauptbild, das es sonst nirgends gibt */
  const haupt=opt.eff||['herz','drachenblut','weltenbrand','zehnfach','himmelsbrecher'][K4-1];
  const [C,D]=themaPaar(TH,1);
  /* opt.stufen: eigene Nachbrueche fuer Sorten mit anderem Hauptbild */
  const stufen=opt.stufen?opt.stufen.slice():[];
  if(!opt.stufen&&K4===1){
    /* zwei kleinere Herzen im selben Mittelpunkt - bum-bum */
    stufen.push({t:0.5,eff:'herz',sz:groesse*0.62,streu:0,A:C,B:A});
    stufen.push({t:0.8,eff:'herz',sz:groesse*0.4,streu:0,A,B:C});
  }
  if(!opt.stufen&&K4===2){
    /* Kern und Aussenschale gehen mit dem Hauptbruch auf, dann faellt
       die ganze Blume als Flammenregen in denselben Farben */
    stufen.push({t:0.04,eff:'pistill',sz:groesse*0.45,streu:0,A:B,B:A,leise:true});
    stufen.push({t:0.08,eff:'kugel',sz:groesse*1.12,streu:0,A:C,B:A,leise:true});
    stufen.push({t:1.3,eff:'flammenregen',sz:groesse*0.75,streu:1,A,B});
  }
  if(!opt.stufen&&K4===3){
    /* Kern im Hauptbruch, dann vier gleiche Toechter im Kranz */
    stufen.push({t:0.04,eff:'pistill',sz:groesse*0.42,streu:0,A:C,B:D,leise:true});
    ringLage(4,9).forEach((off,i)=>stufen.push({t:0.55,off,leise:i>0,eff:'kugel',sz:groesse*0.36,A:C,B:D}));
  }
  if(!opt.stufen&&K4===4){
    /* der Zehnfachbruch: zehn gleiche Pistillen im Kranz um die Ringkugel */
    ringLage(10,11).forEach((off,i)=>stufen.push({t:0.5,off,leise:i>0,eff:'pistill',sz:groesse*0.3,A:i%2?C:A,B:i%2?D:B}));
  }
  if(!opt.stufen&&K4===5){
    /* Silberbruch mit goldener Haengeweide im selben Punkt, dann zwoelf
       Dahlien im Kranz. Alles Silber, Weiss und Gold. */
    stufen.push({t:0.06,eff:'kamuro',sz:groesse*0.8,streu:0,A:FW.gold,B:FW.silber,leise:true});
    ringLage(12,14).forEach((off,i)=>stufen.push({t:0.6,off,leise:i>0,eff:'dahlie',sz:groesse*0.28,A:i%2?C:A,B:i%2?D:B}));
  }
  shot(o,{pw:steig,sz:groesse,eff:haupt,fuse:zuend,A,B,kugel:K4,
          trail:K4>=3?FW.weiss:FW.gold,dick:Math.min(3,K4),stufen});
}
/* Bodeneffekt: Mine, die beim Start eine Fontäne wirft */
function mine(o,A,B,s){
  /* Bodenmine wie beim echten Verbund: EIN Stoss aus dem Rohr, helle
     Sterne schiessen in einem engen Kegel nach oben und verloeschen
     nach acht bis zwoelf Metern. Vorher sprühte hier eine lange,
     streifige Fontaene aus der Batterie (Tom: "extrem unrealistisch"). */
  const n=Math.round(40*(s||1)*QUAL()), y0=(o.y!==undefined?o.y:0.3)+(o.ab!==undefined?o.ab:0.05);
  const alt=SCHWEIF; SCHWEIF=0.12;
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, w=rand(0.3,1.7), c=i%3?A:B;
    psBig.emit(o.x,y0,o.z,Math.cos(a)*w,rand(12,17),Math.sin(a)*w,c[0]*1.2,c[1]*1.2,c[2]*1.2,rand(0.65,0.95),6.5,0); }
  SCHWEIF=alt;
  muendungsblitz(o,y0,1.4);
  flash({x:o.x,y:y0+0.6,z:o.z},A,1.6,0.25);
  sfx.thump(distVol(o)*1.2);
}
/* Kurzer, greller Blitz an der Rohrmuendung und ein paar Funken zur
   Seite - statt eines Funkenstrahls, der wie eine Fontaene aussah */
function muendungsblitz(o,y,k){
  for(let i=0;i<2;i++) psHuge.emit(o.x,y+0.05,o.z,0,rand(0.5,1.5),0,1,.92,.7,0.07,0,0);
  for(let i=0;i<Math.round(6*k*QUAL());i++){ const a=Math.random()*Math.PI*2, w=rand(1.2,3);
    psSmall.emit(o.x,y,o.z,Math.cos(a)*w,rand(0.5,2.2),Math.sin(a)*w,1,.75,.35,rand(0.12,0.26),6,0); }
}
/* Leuchthof: der Bruch strahlt die Luft um sich herum kurz in seiner
   Farbe an - zwei weiche, additive Ballen, die aufgehen und verblassen */
function leuchthof(p,c,s,hell){
  if(typeof wolke!=='function') return;
  const sp=[wolkenSprite(true),wolkenSprite(true)], R=5.5*s;
  wolke(1.0,sp,(w,t)=>{ const a=(t<0.08?t/0.08:1)*(1-glatt(0.1,1.0,t))*0.11*hell, r=R*(0.45+0.35*(1-Math.exp(-t*5)));
    wSetz(sp[0],p.x,p.y,p.z,r*2.2,c,a); wSetz(sp[1],p.x,p.y,p.z,r*1.1,[1,1,1],a*0.6); });
}
function fwBurst(r){
  if(r.eff==='atom'){ atompilz(r.p); return; }
  const p=r.p, fn=EFF[r.eff]||EFF.kugel, h=r.hell||1;
  /* Helligkeit: die Farben werden kraeftiger, ohne den Farbton zu aendern */
  if(h!==1){ const k=c=>[c[0]*h,c[1]*h,c[2]*h]; r.A=k(r.A); r.B=k(r.B); }
  mitSchweif(r.eff,()=>fn(p,r.A,r.B,r.size));
  kern(p,r.A,r.size);
  if(r.size>=1.15&&r.eff!=='salut') leuchthof(p,[(r.A[0]+r.B[0])/2,(r.A[1]+r.B[1])/2,(r.A[2]+r.B[2])/2],r.size,h);
  /* Grosse Brueche glitzern kurz nach dem Aufgehen noch einmal nach */
  if(r.size>=1.1&&r.eff!=='salut'&&r.eff!=='furz'&&EFF_FAMILIE[r.eff]!=='figur') later(0.75,()=>nachglitzer(p,r.size));
  /* Wer ein Bruchbild einmal gesehen hat, darf es spaeter selbst verbauen */
  if(typeof bruchGesehen==='function') bruchGesehen(r.eff);
  const mix=[(r.A[0]+r.B[0])/2,(r.A[1]+r.B[1])/2,(r.A[2]+r.B[2])/2];
  const lang=r.eff==='weide'||r.eff==='brokat'||r.eff==='kamuro'||r.eff==='zeitregen';
  flash(p,mix,(2.2+3.4*r.size)*h,lang?1.2:0.6);
  if(r.eff!=='salut') shellSound(p,r.size);
  /* Nachbrueche der Kugelbombe */
  if(r.stufen) for(const st of r.stufen){
    /* off: feste Lage relativ zum Hauptbruch (Ring), sonst gestreut */
    const q=st.off?{x:p.x+st.off[0],y:p.y+st.off[1],z:p.z+st.off[2]}
                  :{x:p.x+rand(-st.streu,st.streu),y:p.y+rand(-st.streu*0.55,st.streu*0.55),z:p.z+rand(-st.streu,st.streu)};
    later(st.t,()=>{
      mitSchweif(st.eff,()=>(EFF[st.eff]||EFF.kugel)(q,st.A||r.A,st.B||r.B,st.sz));
      if(!st.leise) kern(q,st.A||r.A,st.sz);
      if(st.eff!=='salut'&&!st.leise){
        flash(q,st.A||mix,1.6+2.2*st.sz,0.5);
        shellSound(q,st.sz);
      }
    });
  }
}
/* Kern: der grelle Lichtball im Moment des Zerlegens */
function kern(p,A,s){
  for(let i=0;i<3;i++) psHuge.emit(p.x,p.y,p.z,0,0,0,1,1,1,0.10+i*0.05,0,0);
  for(let i=0;i<4;i++) psHuge.emit(p.x,p.y,p.z,rand(-.4,.4),rand(-.4,.4),rand(-.4,.4),
    0.5+A[0]*0.5,0.5+A[1]*0.5,0.5+A[2]*0.5,rand(0.18,0.28),0,0);
}
/* Nachglitzer: feiner Glitzerschleier dort, wo die Sterne gerade stehen */
function nachglitzer(p,s){
  const n=Math.round(90*s*QUAL()), r=6.2*s;
  for(let i=0;i<n;i++){ const d=randDir(), f=rand(0.55,1.05);
    psMid.emit(p.x+d[0]*r*f,p.y+d[1]*r*f-0.9,p.z+d[2]*r*f,rand(-.2,.2),rand(-.8,0),rand(-.2,.2),1,.93,.75,rand(0.5,1.1),1.2,4); }
}
function smallPop(x,y,z,n,s,life,A){
  const c=A||[1,.85,.45];
  for(let i=0;i<n;i++){ const d=randDir(); psSmall.emit(x,y,z,d[0]*s,Math.abs(d[1])*s,d[2]*s,c[0],c[1]*rand(0.8,1.1),c[2]*rand(0.6,1.3),life*rand(0.6,1),6,0); }
}
function padOf(t){
  const st=stationOf(t);
  if(st==='moerser') return V(STATION_POS.moerser.x,1.7,STATION_POS.moerser.z);
  return st==='rampe'?V(STATION_POS.rampe.x,1.3,STATION_POS.rampe.z)
                     :V(STATION_POS.tisch.x,0.95,STATION_POS.tisch.z);
}
/* =========================================================
   Wolken aus Sprites: Atompilz, Monsterknall, Furzwolke
   (Toms PDF vom 25.09.). Die Sterne leuchten additiv und koennen
   darum keinen Rauch zeigen - ein Pilz braucht Ballen, die das
   Licht dahinter verdecken. Jede Wolke ist ein Satz Sprites mit
   einer Funktion, die sie je Bild in Lage, Groesse und Farbe setzt.
   ========================================================= */
let _ballenTex=null;
function ballenTex(){
  if(_ballenTex) return _ballenTex;
  /* weicher Ballen aus vielen kleinen Beulen, fester Zufall */
  let sd=7; const rnd=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; };
  _ballenTex=tex(128,128,(g,W,H)=>{
    for(let i=0;i<22;i++){ const a=rnd()*Math.PI*2, d=rnd()*26, x=W/2+Math.cos(a)*d, y=H/2+Math.sin(a)*d, r=18+rnd()*22;
      const gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(255,255,255,.42)'); gr.addColorStop(0.55,'rgba(255,255,255,.2)'); gr.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
  },false);
  return _ballenTex;
}
const WOLKEN=[];
function wolkenSprite(add){
  const m=new THREE.SpriteMaterial({map:ballenTex(),transparent:true,opacity:0,depthWrite:false,fog:false,toneMapped:false,
    blending:add?THREE.AdditiveBlending:THREE.NormalBlending});
  const sp=new THREE.Sprite(m); sp.visible=false; scene.add(sp); return sp;
}
/* setzt einen Sprite: Lage, Groesse, Farbe (0..1), Deckkraft */
function wSetz(sp,x,y,z,gr,c,a){
  sp.position.set(x,y,z); sp.scale.set(gr,gr,1);
  sp.material.color.setRGB(c[0],c[1],c[2]); sp.material.opacity=clamp(a,0,1); sp.visible=a>0.004;
}
function wolke(dauer,teile,upd){ const w={t:0,dauer,teile,upd}; WOLKEN.push(w); upd(w,0); return w; }
function wolkenUpdate(dt){
  for(let i=WOLKEN.length-1;i>=0;i--){ const w=WOLKEN[i]; w.t+=dt;
    if(w.t>=w.dauer){ for(const sp of w.teile){ scene.remove(sp); sp.material.dispose(); } WOLKEN.splice(i,1); continue; }
    w.upd(w,w.t); }
}
const mischF=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];
const glatt=(a,b,x)=>{ const u=clamp((x-a)/(b-a),0,1); return u*u*(3-2*u); };
/* Farbverlauf ueber Stuetzstellen [[t,[r,g,b]],...] */
function verlauf(st,t){
  if(t<=st[0][0]) return st[0][1];
  for(let i=1;i<st.length;i++) if(t<=st[i][0]) return mischF(st[i-1][1],st[i][1],(t-st[i-1][0])/(st[i][0]-st[i-1][0]));
  return st[st.length-1][1];
}
/* Weissblitz ueber dem ganzen Bild */
let _blitzEl=null;
function bildBlitz(staerke,dauer){
  if(typeof document==='undefined') return;
  if(!_blitzEl){ _blitzEl=document.createElement('div');
    _blitzEl.style.cssText='position:fixed;inset:0;background:#fff8e8;pointer-events:none;z-index:4;opacity:0;transition:opacity 0s';
    document.body.appendChild(_blitzEl); }
  const el=_blitzEl; el.style.transition='opacity 0s'; el.style.opacity=String(clamp(staerke,0,1));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.transition=`opacity ${dauer}s ease-out`; el.style.opacity='0'; }));
}
/* ---------- Atompilz ----------
   Feuerball, der zur Kappe aufrollt, darunter der Stiel aus
   hochgesaugtem Staub, ein Kondensring und eine Druckwelle am Boden.
   Der Pilz steigt weiter, waehrend er waechst; nach zwoelf Sekunden
   ist er verweht. */
const PILZ={dauer:13};
function atompilz(p){
  const v=distVol(p), H0=p.y, q=QUAL();
  const nB=Math.round(22*q)+6, nK=Math.round(54*q)+14, nD=Math.round(14*q)+4, nS=Math.round(22*q)+6, nR=Math.round(64*q)+16, nG=Math.round(36*q)+8;
  const teile=[], ball=[], kappe=[], glut=[], dom=[], stiel=[], ring=[], boden=[];
  for(let i=0;i<nB;i++){ const sp=wolkenSprite(true); teile.push(sp); const d=randDir(); ball.push({sp,d,f:rand(0.35,1)}); }
  for(let i=0;i<nK;i++){ const sp=wolkenSprite(false); teile.push(sp); kappe.push({sp,th:i/nK*Math.PI*2+rand(-0.1,0.1),ph:rand(0,Math.PI*2),gr:rand(0.85,1.2)}); }
  for(let i=0;i<Math.round(nK*0.5);i++){ const sp=wolkenSprite(true); teile.push(sp); glut.push({sp,th:rand(0,Math.PI*2),ph:rand(0,Math.PI*2),gr:rand(0.7,1.1)}); }
  for(let i=0;i<nD;i++){ const sp=wolkenSprite(false); teile.push(sp); const a=rand(0,Math.PI*2); dom.push({sp,a,r:Math.sqrt(Math.random()),gr:rand(0.9,1.25)}); }
  for(let i=0;i<nS;i++){ const sp=wolkenSprite(false); teile.push(sp); stiel.push({sp,u:i/(nS-1),a:rand(0,Math.PI*2),r:rand(0,1),gr:rand(0.8,1.2)}); }
  for(let i=0;i<nR;i++){ const sp=wolkenSprite(false); teile.push(sp); ring.push({sp,a:i/nR*Math.PI*2+rand(-0.06,0.06),gr:rand(0.8,1.2)}); }
  for(let i=0;i<nG;i++){ const sp=wolkenSprite(false); teile.push(sp); boden.push({sp,a:i/nG*Math.PI*2+rand(-0.05,0.05),gr:rand(0.8,1.3)}); }
  const FB=[[0,[1,1,1]],[0.25,[1,.97,.75]],[0.9,[1,.72,.28]],[2.2,[1,.38,.1]],[4,[.7,.16,.04]]];
  const RAUCH=[[0,[1,.78,.42]],[1.2,[.95,.46,.16]],[3,[.62,.26,.11]],[6,[.42,.2,.13]],[10,[.3,.22,.2]]];
  const STAUB=[[0,[.9,.6,.3]],[2,[.55,.34,.18]],[6,[.36,.27,.21]]];
  const w=wolke(PILZ.dauer,teile,(w,t)=>{
    const aus=1-glatt(9.5,PILZ.dauer,t);                 /* langsames Verwehen am Ende */
    const cy=H0+11*(1-Math.exp(-t/3.2));                  /* der Pilz steigt weiter */
    const Rk=2.5+10.5*(1-Math.exp(-t/2.1));               /* Kappe: Ringradius */
    const rk=1.6+3.4*(1-Math.exp(-t/2.4));                /* Kappe: Wulstdicke */
    /* Feuerball: in einer halben Sekunde auf sechs Meter, dann erlischt er in die Kappe */
    const Rb=6.5*(1-Math.exp(-t*5));
    for(const b of ball){ const a=(1-glatt(1.2,3.6,t))*(t<0.05?t/0.05:1);
      wSetz(b.sp,p.x+b.d[0]*Rb*b.f*0.7,cy+b.d[1]*Rb*b.f*0.55,p.z+b.d[2]*Rb*b.f*0.7,3+Rb*1.1*b.f,verlauf(FB,t),a); }
    /* Kappe: Wulst, der von aussen nach unten und innen nach oben rollt */
    const roll=t*0.9, ein=glatt(0.25,1.1,t);
    for(const k of kappe){ const ph=k.ph+roll, rr=Rk+rk*Math.cos(ph);
      const x=p.x+Math.cos(k.th)*rr, z=p.z+Math.sin(k.th)*rr, y=cy+rk*0.75*Math.sin(ph);
      const unten=Math.sin(ph)<0?0.82:1;                  /* Unterseite etwas dunkler */
      const c=verlauf(RAUCH,t+(Math.sin(ph)<0?0.6:0)).map(x2=>x2*unten);
      wSetz(k.sp,x,y,z,rk*2.4*k.gr,c,0.92*ein*aus); }
    /* Glut im Wulst: leuchtet, solange der Feuerball noch brennt */
    for(const g2 of glut){ const ph=g2.ph+roll, rr=Rk+rk*0.55*Math.cos(ph);
      wSetz(g2.sp,p.x+Math.cos(g2.th)*rr,cy+rk*0.45*Math.sin(ph),p.z+Math.sin(g2.th)*rr,rk*1.9*g2.gr,verlauf(FB,t*0.7+0.5),0.8*ein*(1-glatt(2.5,7.5,t))); }
    /* Kuppel ueber dem Ring, damit oben kein Loch bleibt */
    for(const d of dom){ const rr=Rk*0.85*d.r;
      wSetz(d.sp,p.x+Math.cos(d.a)*rr,cy+rk*(0.95-0.35*d.r*d.r),p.z+Math.sin(d.a)*rr,rk*2.5*d.gr,verlauf(RAUCH,t+0.4),0.9*ein*aus); }
    /* Stiel: von unten nach oben hochgesaugt, oben duenner Hals */
    const rs=0.9+2.0*(1-Math.exp(-t/2.5)), top=cy-rk*0.6;
    for(const s2 of stiel){ const y=0.6+s2.u*(top-0.6), da=glatt(0.6+(1-s2.u)*0.2+s2.u*1.6,1.4+s2.u*1.8,t);
      const hals=1-0.45*glatt(0.55,1,s2.u), r=rs*hals;
      const x=p.x+Math.cos(s2.a+t*0.6)*r*s2.r*0.6, z=p.z+Math.sin(s2.a+t*0.6)*r*s2.r*0.6;
      const c=mischF(verlauf(STAUB,t),verlauf(RAUCH,t),s2.u*0.8);
      wSetz(s2.sp,x,y,z,r*2.6*s2.gr,c,0.85*da*aus); }
    /* Kondensring: weisser Kragen um den Stiel, kurz nach der Druckwelle */
    const rR=4+15*(1-Math.exp(-(t-0.4)/1.1)), aR=t<0.4?0:0.3*(1-glatt(1.2,4.2,t));
    for(const r of ring) wSetz(r.sp,p.x+Math.cos(r.a)*rR,cy-6.5+Math.sin(r.a*3)*0.4,p.z+Math.sin(r.a)*rR,(3.6+rR*0.28)*r.gr,[.86,.84,.82],aR);
    /* Druckwelle am Boden: ein Staubring, der nach aussen laeuft */
    /* nur bis 16 m: weiter aussen rollte der Ring am Pult vorbei und
       stand dort als einzelne Ballen in der Luft */
    const rG=16*(1-Math.exp(-t/0.7)), aG=0.8*glatt(0.05,0.3,t)*(1-glatt(1.5,4,t));
    for(const b of boden) wSetz(b.sp,p.x+Math.cos(b.a)*rG,0.9+b.gr*0.5,p.z+Math.sin(b.a)*rG,(2.2+rG*0.12)*b.gr,verlauf(STAUB,t),aG);
  });
  /* Licht, Funken, Knall */
  bildBlitz(0.85*v+0.1,1.6);
  flash(p,FW.weiss,16,1.6);
  for(let i=0;i<5;i++) later(0.5+i*0.55,()=>flash({x:p.x,y:p.y+3,z:p.z},FW.orange,9-i*1.5,0.7));
  for(let i=0;i<Math.round(700*q);i++){ const d=randDir(), sp2=rand(8,26), c=Math.random()<0.5?FW.orange:FW.gold;
    psBig.emit(p.x,p.y,p.z,d[0]*sp2,d[1]*sp2,d[2]*sp2,c[0],c[1],c[2],rand(0.8,1.8),3,4); }
  for(let i=0;i<8;i++) psHuge.emit(p.x,p.y,p.z,rand(-1,1),rand(-1,1),rand(-1,1),1,1,1,0.3+i*0.08,0,0);
  sfx.atom(v);
  shake=Math.max(shake,1.2*v+0.3);
  later(0.35,()=>{ shake=Math.max(shake,2.2*v+0.4); });
  return w;
}
/* ---------- Monsterknall: Feuerball am Boden, Druckring ---------- */
function monsterknall(o){
  const v=distVol(o), y=o.y!==undefined?o.y:0.4, q=QUAL();
  const nF=Math.round(14*q)+6, nR=Math.round(26*q)+8, teile=[], fb=[], ring=[];
  for(let i=0;i<nF;i++){ const sp=wolkenSprite(true); teile.push(sp); fb.push({sp,d:randDir(),f:rand(0.3,1)}); }
  for(let i=0;i<nR;i++){ const sp=wolkenSprite(false); teile.push(sp); ring.push({sp,a:i/nR*Math.PI*2,gr:rand(0.8,1.25)}); }
  const FB=[[0,[1,1,1]],[0.08,[1,.9,.6]],[0.3,[1,.55,.15]],[0.8,[.6,.18,.05]]];
  wolke(3.2,teile,(w,t)=>{
    const R=2.6*(1-Math.exp(-t*14));
    for(const b of fb) wSetz(b.sp,o.x+b.d[0]*R*b.f,y+0.8+Math.abs(b.d[1])*R*b.f*0.8+t*1.2,o.z+b.d[2]*R*b.f,1.6+R*1.3*b.f,verlauf(FB,t),1-glatt(0.25,1.1,t));
    const rr=11*(1-Math.exp(-t/0.35)), a=0.75*(1-glatt(0.5,3,t));
    for(const r of ring) wSetz(r.sp,o.x+Math.cos(r.a)*rr,0.5,o.z+Math.sin(r.a)*rr,(1+rr*0.18)*r.gr,[.62,.55,.48],a);
  });
  bildBlitz(0.45*v,0.5);
  flash({x:o.x,y:y+0.6,z:o.z},FW.weiss,11,0.45);
  for(let i=0;i<6;i++) psHuge.emit(o.x,y+0.5,o.z,rand(-.6,.6),rand(0,.6),rand(-.6,.6),1,1,1,0.18+i*0.05,0,0);
  for(let i=0;i<Math.round(420*q);i++){ const a2=Math.random()*Math.PI*2, sp=rand(4,16), c=Math.random()<0.6?FW.bernstein:FW.weiss;
    psBig.emit(o.x,y+0.3,o.z,Math.cos(a2)*sp,rand(1,11),Math.sin(a2)*sp,c[0],c[1],c[2],rand(0.4,1.2),6,4); }
  sfx.monster(v);
  shake=Math.max(shake,Math.min(2.4,1.9*v+0.2));
}
/* ---------- Furzwolke: gruenbraun, zieht langsam davon ---------- */
function furzwolke(o){
  const y=o.y!==undefined?o.y:0.4, teile=[], b=[], wind=[rand(-.25,.25),rand(-.25,.25)];
  for(let i=0;i<12;i++){ const sp=wolkenSprite(false); teile.push(sp); b.push({sp,d:randDir(),gr:rand(0.8,1.3),c:Math.random()<0.5?[.3,.34,.12]:[.3,.21,.1]}); }
  wolke(4.5,teile,(w,t)=>{ const R=0.4+1.3*(1-Math.exp(-t*2.2));
    for(const k of b) wSetz(k.sp,o.x+k.d[0]*R+wind[0]*t,y+0.5+Math.abs(k.d[1])*R*0.7+t*0.35,o.z+k.d[2]*R+wind[1]*t,(0.6+R*0.9)*k.gr,k.c,0.75*glatt(0,0.15,t)*(1-glatt(2,4.5,t))); });
}
/* Startgeschwindigkeit, mit der ein Stern (Schwerkraft g, Luftwider-
   stand ZIEH) genau h Meter hoch steigt - Gipfel der Flugbahn:
   h(v) = v/k - g/k^2 * ln(1 + k*v/g). Halbierung reicht. */
function vFuerHoehe(h,g){ g=g||6; const k=ZIEH; let a=0, b=200;
  for(let i=0;i<50;i++){ const m=(a+b)/2, hm=m/k-g/(k*k)*Math.log(1+k*m/g); if(hm<h) a=m; else b=m; }
  return (a+b)/2; }
function monsterFontaene(o,hm,dauer,farben,stil){
  /* tA: Steigzeit bis zum Gipfel, t = ln(1+k*v/g)/k */
  const v0=vFuerHoehe(hm);
  emitters.push({t:dauer,k:'monsterfont',o,hm,v0,tA:Math.log(1+ZIEH*v0/6)/ZIEH,farben:farben.map(c=>typeof c==='string'?K(c):c),stil:stil||'puls'});
  const v=distVol(o); sfx.fizz(v); sfx.thump(v*1.2);
}
function updateFireworks(dt){
  FW_UHR+=dt;
  for(let i=rockets.length-1;i>=0;i--){ const r=rockets[i];
    r.v.y-=6*dt; r.p.addScaledVector(r.v,dt); r.fuse-=dt;
    const tc=r.trail, dick=r.dick||0;
    if(r.pfeif){ r.ph+=dt*16; const sx=Math.cos(r.ph)*0.35, sz=Math.sin(r.ph)*0.35;
      for(let k=0;k<3;k++) psMid.emit(r.p.x+sx,r.p.y,r.p.z+sz,sx*2,rand(-1.5,0),sz*2,tc[0],tc[1],tc[2],rand(0.4,0.7),1,4); }
    for(let k=0;k<2+dick*3;k++) psBig.emit(r.p.x,r.p.y,r.p.z,rand(-.5,.5)*(1+dick*0.4),rand(-2,0),rand(-.5,.5)*(1+dick*0.4),tc[0],tc[1]*rand(0.8,1),tc[2]*0.9,0.34+dick*0.16,1,4);
    /* Kugelbomben ziehen zusaetzlich glimmende Schlacke hinter sich her */
    if(dick) for(let k=0;k<dick;k++)
      psMid.emit(r.p.x,r.p.y,r.p.z,rand(-1.2,1.2),rand(-3.5,-0.5),rand(-1.2,1.2),1,.62,.2,rand(0.5,1.1),3.2,4);
    if(r.fuse<=0){ fwBurst(r); rockets.splice(i,1); } }
  for(let i=emitters.length-1;i>=0;i--){ const e=emitters[i]; e.t-=dt; const o=e.o||PAD;
    if(e.k==='fountain'||e.k==='volcano'||e.k==='wasserfall'){
      const big=e.k==='volcano', wf=e.k==='wasserfall', n=big?18:wf?22:10;
      const A=e.A||FW.gold, B=e.B||FW.weiss;
      e.fl=(e.fl||0)-dt; if(e.fl<=0){ e.fl=0.3; flash({x:o.x,y:o.y+1.4,z:o.z},A,big?1.8:1.2,0.34); }
      for(let k=0;k<n;k++){ const a=Math.random()*Math.PI*2, s=rand(0.3,wf?2.6:big?1.9:1.2), c=Math.random()<0.72?A:B;
        psMid.emit(o.x+(wf?rand(-1.6,1.6):0),o.y+0.2,o.z,Math.cos(a)*s,wf?rand(3,6):rand(4.5,big?10.5:6.8),Math.sin(a)*s,c[0],c[1],c[2],rand(0.8,wf?2.4:big?1.9:1.3),wf?7:5,4); } }
    else if(e.k==='riesen'){
      /* Riesenfontaene: ein Goldstrahl von zehn Metern und mehr, oben
         eine knisternde Krone, dazwischen farbige Sterne. Die Menge je
         Sekunde ist fest, nicht je Bild - sonst waere sie auf schnellen
         Rechnern dichter. */
      const H=e.h||1, A=e.A||FW.gold, B=e.B||FW.weiss;
      e.fl=(e.fl||0)-dt; if(e.fl<=0){ e.fl=0.22; flash({x:o.x,y:o.y+4,z:o.z},A,2.6*H,0.3); }
      e.acc=(e.acc||0)+dt*560*H*QUAL();
      /* kurze Spuren und ein Kegel statt Strahl (Tom, 25.09.: "sieht
         aus wie Laserstrahlen") - vorher 0,6 s Spur, 6-8 m lange Striche */
      const alt=SCHWEIF; SCHWEIF=0.1;
      for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, w=rand(0.2,2.6)*H, c=Math.random()<0.8?A:B;
        psMid.emit(o.x,o.y+0.25,o.z,Math.cos(a)*w,rand(17,21)*Math.sqrt(H),Math.sin(a)*w,c[0],c[1],c[2],rand(1.6,2.6),6,4); }
      e.acc2=(e.acc2||0)+dt*16*H;
      SCHWEIF=0.12;
      for(;e.acc2>=1;e.acc2--){ const a=Math.random()*Math.PI*2, w=rand(0.5,2.4)*H, c=e.C||pick(SCHEMES.map(x=>K(x[0])));
        psBig.emit(o.x,o.y+0.25,o.z,Math.cos(a)*w,rand(19,24)*Math.sqrt(H),Math.sin(a)*w,c[0],c[1],c[2],rand(2.0,2.6),6,0); }
      SCHWEIF=alt;
      /* knisternde Krone auf etwa zehn Metern */
      const kr=10.2*H;
      for(let k=0;k<Math.round(dt*220*H);k++){ const a=Math.random()*Math.PI*2, r=rand(0,2.4)*H;
        psSmall.emit(o.x+Math.cos(a)*r,o.y+kr+rand(-1.2,0.6),o.z+Math.sin(a)*r,rand(-.5,.5),rand(-1,0.5),rand(-.5,.5),1,.95,.8,rand(0.2,0.45),2,3); }
      e.kn=(e.kn||0)-dt; if(e.kn<=0){ e.kn=rand(0.35,0.8); sfx.crackle(distVol(o)*0.6); }
      e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=1.2; sfx.fizz(distVol(o)); } }
    else if(e.k==='monsterfont'){
      /* Monsterfontaenen (Tom, 25.09.): keine Laserstrahlen und zwei
         ganz verschiedene Bilder. Vorher stiegen alle Sterne eng
         gebuendelt mit langen Spuren - das addierte sich zu einem bunten
         Strahl, und 30 m sah aus wie 50 m. Jetzt: kurze Spuren, weiter
         Kegel, und jede Fontaene hat ihre eigene Bewegung.
         Die Startgeschwindigkeit kommt aus der Flugbahn mit Luftwider-
         stand, damit die Spitze auf der angegebenen Hoehe liegt. */
      const F=e.farben, hm=e.hm, v0=e.v0, q=QUAL(), alt=SCHWEIF;
      e.alter=(e.alter||0)+dt;
      const an=Math.min(1,e.alter/0.8), ab=Math.min(1,e.t/1.2), kraft=an*ab;
      if(e.stil==='puls'){
        /* 30 m »Himmelsstuermer«: pulsierende Palme. Alle 0,4 s steigt
           eine Salve dicker Glitzersterne im weiten Kegel, zweifarbig
           und jede Salve in den naechsten Farben. Oben zerfallen sie
           knisternd und haengen als goldene Weide herunter. Unten ein
           niedriger Goldsockel. */
        e.ps=(e.ps||0)-dt;
        if(e.ps<=0&&kraft>0.15){ e.ps=0.3; e.nr=(e.nr||0)+1;
          const c1=F[e.nr%F.length], c2=F[(e.nr+2)%F.length], n=Math.round(44*q*kraft);
          SCHWEIF=0.05;
          for(let k=0;k<n;k++){ const a=Math.random()*Math.PI*2, tl=Math.sqrt(Math.random())*0.24, sp=v0*rand(0.9,1.0), c=k%2?c1:c2;
            psBig.emit(o.x,o.y+0.3,o.z,Math.cos(a)*Math.sin(tl)*sp,Math.cos(tl)*sp,Math.sin(a)*Math.sin(tl)*sp,c[0],c[1],c[2],e.tA*rand(1.0,1.2),6,4); }
          SCHWEIF=alt;
          flash({x:o.x,y:o.y+2.5,z:o.z},c1,3.5*kraft,0.25);
          const oben={x:o.x,y:o.y+hm*0.94,z:o.z}, r0=hm*0.16;
          later(e.tA*0.92,()=>{
            for(let k=0;k<Math.round(70*q);k++){ const a=Math.random()*Math.PI*2, r=rand(0,r0);
              psSmall.emit(oben.x+Math.cos(a)*r,oben.y+rand(-2,1.5),oben.z+Math.sin(a)*r,rand(-1,1),rand(-1,0.5),rand(-1,1),1,.95,.8,rand(0.3,0.7),2,3); }
            const s2=SCHWEIF; SCHWEIF=1.2;
            for(let k=0;k<Math.round(26*q);k++){ const a=Math.random()*Math.PI*2, r=rand(0,r0*0.8), w=rand(1,3.5);
              psMid.emit(oben.x+Math.cos(a)*r,oben.y,oben.z+Math.sin(a)*r,Math.cos(a)*w,rand(-0.5,1.5),Math.sin(a)*w,1,.66,.22,rand(3.0,4.2),1.6,0); }
            SCHWEIF=s2;
            sfx.crackle(distVol(o)*0.6); });
        }
        e.acc=(e.acc||0)+dt*150*q*kraft; SCHWEIF=0.1;
        for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, w=rand(0.6,3.4), c=Math.random()<0.8?FW.gold:FW.weiss;
          psMid.emit(o.x,o.y+0.25,o.z,Math.cos(a)*w,rand(9,13),Math.sin(a)*w,c[0],c[1],c[2],rand(1.3,1.9),6,4); }
        /* zwischen den Salven ein lockerer Glitzerschleier im selben Kegel */
        e.acc3=(e.acc3||0)+dt*110*q*kraft; SCHWEIF=0.03;
        for(;e.acc3>=1;e.acc3--){ const a=Math.random()*Math.PI*2, tl=Math.sqrt(Math.random())*0.26, sp=v0*rand(0.75,0.98), c=F[(e.nr||0)%F.length];
          psMid.emit(o.x,o.y+0.3,o.z,Math.cos(a)*Math.sin(tl)*sp,Math.cos(tl)*sp,Math.sin(a)*Math.sin(tl)*sp,c[0]*0.8,c[1]*0.8,c[2]*0.8,e.tA*rand(0.9,1.1),6,4); }
        SCHWEIF=alt;
      } else {
        /* 50 m »Regenbogen-Titan«: drehender Regenbogenfaecher. Je Farbe
           ein eigener Strahl, schraeg nach aussen, alle Strahlen drehen
           sich um die Mitte und oeffnen und schliessen sich langsam - eine
           Tulpe aus Regenbogenfarben. In der Mitte blitzt ein silberner
           Stroboskopkern, oben ein Stroboskopkranz. */
        const J=F.length; e.rot=(e.rot||0)+dt*1.25;
        const kipp=0.2+0.08*Math.sin(e.alter*0.8);
        e.acc=(e.acc||0)+dt*520*q*kraft; SCHWEIF=0.03;
        for(;e.acc>=1;e.acc--){ const j=Math.floor(Math.random()*J), a=e.rot+j/J*Math.PI*2+rand(-0.12,0.12), tl=kipp+rand(-0.05,0.05), sp=v0*rand(0.93,1.0), c=F[j];
          psMid.emit(o.x,o.y+0.3,o.z,Math.cos(a)*Math.sin(tl)*sp,Math.cos(tl)*sp,Math.sin(a)*Math.sin(tl)*sp,c[0]*0.9,c[1]*0.9,c[2]*0.9,e.tA*rand(0.95,1.3),6,4); }
        SCHWEIF=alt;
        e.acc2=(e.acc2||0)+dt*80*q*kraft;
        for(;e.acc2>=1;e.acc2--){ const a=Math.random()*Math.PI*2, w=rand(0,2.2);
          psMid.emit(o.x,o.y+0.3,o.z,Math.cos(a)*w,v0*rand(0.55,0.75),Math.sin(a)*w,1,1,1,rand(1.4,1.9),6,1); }
        e.kr=(e.kr||0)-dt;
        if(e.kr<=0&&kraft>0.3){ e.kr=0.6; const y=o.y+hm*0.93, R=hm*0.2;
          for(let k=0;k<Math.round(48*q);k++){ const a=e.rot+k/48*Math.PI*2, c=F[Math.floor(k/48*J)%J];
            psSmall.emit(o.x+Math.cos(a)*R,y+rand(-1,1),o.z+Math.sin(a)*R,Math.cos(a)*2.5,rand(-2,0),Math.sin(a)*2.5,c[0],c[1],c[2],rand(1.0,1.5),2,1); } }
      }
      e.kn=(e.kn||0)-dt; if(e.kn<=0){ e.kn=rand(0.3,0.6); sfx.crackle(distVol(o)*0.7*kraft); }
      e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=0.9; sfx.fizz(distVol(o)*1.3*kraft); noise(1.0,0.12*distVol(o)*kraft,900); } }
    else if(e.k==='feuerbrunnen'){
      /* Feuerbrunnen: in Stoessen steigen grosse Flammenbaelle sechs
         bis acht Meter hoch und regnen als brennende Tropfen herunter */
      const H=e.h||1;
      e.st=(e.st||0)-dt;
      if(e.st<=0){ e.st=e.t<3?0.2:rand(0.32,0.5);
        const n=Math.round((e.t<3?16:10)*H*QUAL());
        for(let k=0;k<n;k++){ const a=Math.random()*Math.PI*2, w=rand(0.2,1.6)*H, vy=rand(9,12.5)*Math.sqrt(H);
          psHuge.emit(o.x,o.y+0.3,o.z,Math.cos(a)*w,vy,Math.sin(a)*w,1.7,1.0,0.3,rand(2.2,3.0),6.5,2,1.0,0.18,0.04);
          for(let q=0;q<Math.round(5*QUAL());q++){ const c=q%2?FW.orange:FW.bernstein;
            psBig.emit(o.x,o.y+0.3,o.z,Math.cos(a)*w+rand(-.5,.5),vy+rand(-.6,.6),Math.sin(a)*w+rand(-.5,.5),c[0]*1.35,c[1]*1.2,c[2],rand(1.9,2.7),6.5,2,0.7,0.1,0.02); } }
        flash({x:o.x,y:o.y+2.5,z:o.z},FW.orange,2.6*H,0.4);
        if(Math.random()<0.5) sfx.fizz(distVol(o)*0.8); }
      for(let k=0;k<6;k++){ const a=Math.random()*Math.PI*2, w=rand(0.3,1.2);
        psMid.emit(o.x,o.y+0.25,o.z,Math.cos(a)*w,rand(3,6),Math.sin(a)*w,1,rand(0.5,0.75),0.12,rand(0.6,1.1),4,0); } }
    else if(e.k==='furzfont'){
      /* brauner Schweif, waehrend die Rakete steigt */
      for(let k=0;k<9;k++){ const a=Math.random()*Math.PI*2, sp=rand(0.2,1.3);
        const c=k%4?FW.braun:FW.sumpf;
        psMid.emit(o.x,o.y+0.25,o.z,Math.cos(a)*sp,rand(2.5,5.5),Math.sin(a)*sp,c[0],c[1],c[2],rand(1.2,2.2),-0.2); } }
    else if(typeof NEU_EMIT!=='undefined'&&NEU_EMIT[e.k]) NEU_EMIT[e.k](e,dt,o);
    else if(e.k==='spark'){
      for(let k=0;k<7;k++){ const d=randDir(), s=rand(1,2.4);
        psSmall.emit(o.x,o.y+0.3,o.z,d[0]*s,d[1]*s+0.4,d[2]*s,1,rand(0.8,1),rand(0.45,0.85),rand(0.25,0.55),4,3); } }
    else { for(let k=0;k<2;k++){ const d=randDir();
        psSmall.emit(o.x,o.y+0.05,o.z,d[0],d[1]+0.4,d[2],1,0.9,0.5,rand(0.2,0.4),4,0); } }
    if(e.t<=0) emitters.splice(i,1); }
  psHuge.update(dt); psBig.update(dt); psMid.update(dt); psSmall.update(dt); updateFlash(dt); wolkenUpdate(dt);
}

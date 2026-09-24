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
      if(m===0) k*=0.86+Math.random()*0.14;
      else if(m===1){ k*=((this.life[i]*11+this.ph[i])%1)<0.42?1.9:0.05; }
      else if(m===2){ const u=1-f; r+=(this.c2[j]-r)*u; g+=(this.c2[j+1]-g)*u; b+=(this.c2[j+2]-b)*u; k*=0.9+Math.random()*0.1; }
      else if(m===3){ if(Math.random()<0.26){ k=2.4; r=g=b=1; } else k*=0.06; }
      else k*=0.45+Math.random()*1.05;
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
function scheme(i){ const s=(typeof i==='number'&&i>=0)?SCHEMES[i%SCHEMES.length]:pick(SCHEMES); return [K(s[0]),K(s[1])]; }
function randDir(){ let x,y,z,d; do{ x=rand(-1,1); y=rand(-1,1); z=rand(-1,1); d=x*x+y*y+z*z; }while(d>1||d<0.01); d=Math.sqrt(d); return [x/d,y/d,z/d]; }
function basis(){
  const n=randDir(), a=Math.abs(n[1])<0.86?[0,1,0]:[1,0,0];
  let u=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]];
  const l=Math.hypot(u[0],u[1],u[2])||1; u=[u[0]/l,u[1]/l,u[2]/l];
  const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
  return [u,v];
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
function shaderVorab(){
  try{
    const ziel=(typeof postOK!=='undefined'&&postOK&&postOn&&typeof rtScene!=='undefined')?rtScene:null;
    if(renderer.setRenderTarget) renderer.setRenderTarget(ziel);
    const alt=flashAn;
    /* Uebersetzen allein reicht nicht: Browser und Treiber stellen
       einen Shader oft erst beim ersten Zeichnen fertig. Darum wird
       jeder Zustand einmal gezeichnet, ohne Sichtpruefung, damit auch
       Dinge hinter der Kamera drankommen. Das Bild wird danach sofort
       ueberzeichnet. */
    const aus=[]; scene.traverse(o=>{ if(o.frustumCulled){ o.frustumCulled=false; aus.push(o); } });
    for(const an of [true,false]){ flashSchalten(an); renderer.compile(scene,camera); renderer.render(scene,camera); }
    aus.forEach(o=>{ o.frustumCulled=true; });
    flashSchalten(alt);
    if(renderer.setRenderTarget) renderer.setRenderTarget(null);
  }catch(e){}
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
  sfx.boom(v*Math.min(1.3,0.55+s*0.45));
  later(0.12,()=>sfx.crack(v*0.9)); later(0.26,()=>sfx.crack(v*0.55));
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
      if(i%2===0) psMid.emit(p.x,p.y,p.z,d[0]*v*0.55,d[1]*v*0.55,d[2]*v*0.55,c[0],c[1],c[2],rand(1.2,1.9),3.4,4); }
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
  /* Palme: wenige dicke Finger nach oben */
  palme(p,A,B,s){
    const arms=9+Math.floor(Math.random()*4);
    for(let a=0;a<arms;a++){
      const ang=a/arms*Math.PI*2+rand(-.15,.15), tilt=rand(0.55,1.15), sp=rand(8,11)*s;
      const vx=Math.cos(ang)*Math.cos(tilt)*sp, vy=Math.sin(tilt)*sp+2, vz=Math.sin(ang)*Math.cos(tilt)*sp;
      const n=Math.round(15*QUAL());
      for(let i=0;i<n;i++){ const f=0.35+i/n*0.75, c=i<3?B:A;
        psBig.emit(p.x,p.y,p.z,vx*f+rand(-.5,.5),vy*f+rand(-.5,.5),vz*f+rand(-.5,.5),c[0],c[1],c[2],rand(2.2,3.4),4.4,4); }
    }
    for(let i=0;i<Math.round(26*QUAL());i++){ const d=randDir(), v=rand(1,3);
      psMid.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,B[0],B[1],B[2],rand(0.9,1.5),3,0); }
  },
  /* flacher Ring */
  ring(p,A,B,s){
    const [u,v]=basis(), n=Math.round(96*QUAL()), sp=rand(8,10)*s;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rand(-.02,.02), w=sp*rand(0.95,1.05);
      const dx=(u[0]*Math.cos(a)+v[0]*Math.sin(a)), dy=(u[1]*Math.cos(a)+v[1]*Math.sin(a)), dz=(u[2]*Math.cos(a)+v[2]*Math.sin(a));
      psBig.emit(p.x,p.y,p.z,dx*w,dy*w,dz*w,A[0],A[1],A[2],rand(1.8,2.3),2.6,0); }
    for(let i=0;i<Math.round(40*QUAL());i++){ const d=randDir(), w=rand(1,3);
      psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(1.4,1.9),2.8,0); }
  },
  /* zwei Ringe über Kreuz, zwei Farben */
  doppelring(p,A,B,s){
    for(let r=0;r<2;r++){
      const [u,v]=basis(), n=Math.round(80*QUAL()), sp=rand(7.5,9.5)*s, c=r?B:A;
      for(let i=0;i<n;i++){ const a=i/n*Math.PI*2;
        const dx=(u[0]*Math.cos(a)+v[0]*Math.sin(a)), dy=(u[1]*Math.cos(a)+v[1]*Math.sin(a)), dz=(u[2]*Math.cos(a)+v[2]*Math.sin(a));
        psBig.emit(p.x,p.y,p.z,dx*sp,dy*sp,dz*sp,c[0],c[1],c[2],rand(1.7,2.2),2.6,0); }
    }
  },
  /* Crossette: Kometen, die nochmal vierfach aufplatzen */
  crossette(p,A,B,s){
    const arms=8;
    for(let a=0;a<arms;a++){
      const d=randDir(), sp=rand(7,9)*s;
      const vx=d[0]*sp, vy=d[1]*sp, vz=d[2]*sp;
      for(let i=0;i<Math.round(9*QUAL());i++){ const f=0.4+i/9*0.7;
        psBig.emit(p.x,p.y,p.z,vx*f,vy*f,vz*f,A[0],A[1],A[2],0.62,2.4,4); }
      later(0.58,()=>{
        const q={x:p.x+vx*0.42,y:p.y+vy*0.42-0.5,z:p.z+vz*0.42};
        for(let k=0;k<4;k++){ const e=k/4*Math.PI*2;
          for(let i=0;i<Math.round(11*QUAL());i++){ const w=rand(2.5,4.2);
            psBig.emit(q.x,q.y,q.z,Math.cos(e)*w+rand(-.6,.6),rand(-1.4,1.4),Math.sin(e)*w+rand(-.6,.6),B[0],B[1],B[2],rand(0.9,1.4),3.2,0); } }
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
    const [u,v]=basis(), n=Math.round(90*QUAL());
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
    const [u,v]=basis(), pts=[];
    for(let i=0;i<10;i++){ const r=i%2?0.42:1, a=i/10*Math.PI*2-Math.PI/2; pts.push([Math.cos(a)*r,Math.sin(a)*r]); }
    const sp=9*s;
    for(let e=0;e<10;e++){
      const a=pts[e], b=pts[(e+1)%10], n=Math.round(11*QUAL());
      for(let i=0;i<n;i++){ const f=i/n, hx=a[0]+(b[0]-a[0])*f, hy=a[1]+(b[1]-a[1])*f;
        const dx=(u[0]*hx+v[0]*hy)*sp, dy=(u[1]*hx+v[1]*hy)*sp, dz=(u[2]*hx+v[2]*hy)*sp;
        psBig.emit(p.x,p.y,p.z,dx,dy,dz,A[0],A[1],A[2],rand(1.9,2.4),2.3,0); }
    }
    for(let i=0;i<Math.round(34*QUAL());i++){ const d=randDir(), w=rand(1,2.6);
      psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(1.5,2),2.6,0); }
  },
  /* Kreisel: Ring mit Drall */
  kreisel(p,A,B,s){
    const [u,v]=basis(), n=Math.round(84*QUAL()), sp=rand(6.5,8.5)*s;
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
    psMid.emit(p.x,p.y,p.z,d[0]*v*0.82,d[1]*v*0.82,d[2]*v*0.82,c[0],c[1],c[2],rand(1.0,1.6),2.8,0); }
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
  const [u,v]=basis(), beine=Math.round(26*QUAL()), sp=rand(15,18)*s;
  for(let b=0;b<beine;b++){
    const a=b/beine*Math.PI*2+rand(-.04,.04), w=sp*rand(0.9,1.1), c=b%4?A:B;
    const dx=(u[0]*Math.cos(a)+v[0]*Math.sin(a)), dy=(u[1]*Math.cos(a)+v[1]*Math.sin(a)), dz=(u[2]*Math.cos(a)+v[2]*Math.sin(a));
    for(let i=0;i<Math.round(9*QUAL());i++){ const f=0.42+i/9*0.62;
      psBig.emit(p.x,p.y,p.z,dx*w*f,dy*w*f,dz*w*f,c[0],c[1],c[2],rand(0.85,1.25),0.7,0); }
  }
  flash({x:p.x,y:p.y,z:p.z},A,3.4,0.3);
};
/* Stroboskop: Sterne, die minutenlang blinkend haengen */
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
    const f=1-Math.exp(-1.1*w*0.42), fall=0.5*2.4*Math.pow(w*0.42,2);
    for(const t of traeger){
      if(Math.random()>0.75) continue;
      const q={x:p.x+t[0]*f*0.9,y:p.y+t[1]*f*0.9-fall,z:p.z+t[2]*f*0.9};
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
/* Regenbogen: der Ball ist in sechs Farbsegmente geteilt */
EFF.regenbogen=function(p,A,B,s){
  const F=['rot','orange','zitrone','gruen','himmel','violett'].map(K);
  const [u,v]=basis(), n=Math.round(210*s*QUAL());
  for(let i=0;i<n;i++){ const d=randDir(), sp=rand(8.5,10.5)*s;
    const a=Math.atan2(d[0]*v[0]+d[1]*v[1]+d[2]*v[2],d[0]*u[0]+d[1]*u[1]+d[2]*u[2]);
    const c=F[Math.floor((a+Math.PI)/(Math.PI*2)*6)%6];
    psBig.emit(p.x,p.y,p.z,d[0]*sp,d[1]*sp,d[2]*sp,c[0],c[1],c[2],rand(1.8,2.4),2.8,0); }
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
    /* der Schweif: Funken entlang der Bahn, zeitlich versetzt */
    for(let k=1;k<=7;k++) later(k*0.16,()=>{
      const t=k*0.16, f=(1-Math.exp(-1.1*t))/1.1, fall=0.5*3.2*t*t*0.8;
      const q={x:p.x+vx*f,y:p.y+vy*f-fall,z:p.z+vz*f};
      for(let i=0;i<Math.round(6*QUAL());i++)
        psMid.emit(q.x,q.y,q.z,rand(-.5,.5),rand(-1.2,0.2),rand(-.5,.5),1,.86,.5,rand(0.9,1.6),3.4,4);
    });
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
  const [u,v]=basis(), r=6.5*s, F=[A,B,K('weiss'),K('zitrone'),K('magenta')];
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
    const q={x:p.x+rand(-1,1),y:p.y-k*2.2*s,z:p.z+rand(-1,1)}, c=k%2?B:A;
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
  const [u,v]=basis(), sp=11*s, c=FW.silber;
  const dir=a=>[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
  for(let k=0;k<6;k++){ const a=k/6*Math.PI*2, d=dir(a);
    const n=Math.round(22*QUAL());
    for(let i=0;i<n;i++){ const f=0.12+i/n*0.9;
      psBig.emit(p.x,p.y,p.z,d[0]*sp*f,d[1]*sp*f,d[2]*sp*f,c[0],c[1],c[2],rand(1.8,2.3),0.9,0); }
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
  const [u,v]=basis(), sp=10.5*s, arme=8;
  for(let k=0;k<arme;k++){ const a0=k/arme*Math.PI*2;
    const n=Math.round(26*QUAL());
    for(let i=0;i<n;i++){ const f=0.15+i/n*0.85, a=a0+f*1.9, c=i%3?A:B;
      const dx=u[0]*Math.cos(a)+v[0]*Math.sin(a), dy=u[1]*Math.cos(a)+v[1]*Math.sin(a), dz=u[2]*Math.cos(a)+v[2]*Math.sin(a);
      psBig.emit(p.x,p.y,p.z,dx*sp*f,dy*sp*f,dz*sp*f,c[0],c[1],c[2],rand(1.7,2.2),1.4,i%4?0:4); } }
};
/* Ring im Ring: aussen ein Ring, innen ein kleinerer in der Gegenfarbe */
EFF.ringring=function(p,A,B,s){
  const [u,v]=basis();
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
/* Wie lang die Leuchtspur je Bruchbild ist (Sekunden Flugbahn) */
const EFF_SCHWEIF={kugel:0.4,chrys:0.75,wechsel:0.35,weide:1.9,palme:1.1,ring:0.3,doppelring:0.3,crossette:0.35,
  knister:0.3,blink:0,brokat:1.3,herz:0.18,stern:0.18,kreisel:0.4,fische:0.25,doppel:0.4,dreifach:0.45,
  dahlie:0.45,pistill:0.4,kamuro:1.8,spinne:0.5,strobe:0,zeitregen:0.9,blaetter:0,geist:0.35,salut:0.08,saturn:0.3,
  tausend:0.25,mehrring:0.35,regenbogen:0.4,glitzerweide:2.0,komet:0.9,titan:0.8,zehnfach:0.35,kaskade:0.5,
  schneeflocke:0.22,spirale:0.3,ringring:0.25,strauss:0.35,furz:0};
function mitSchweif(eff,fn){ const alt=SCHWEIF; SCHWEIF=EFF_SCHWEIF[eff]!==undefined?EFF_SCHWEIF[eff]:null; try{ fn(); } finally { SCHWEIF=alt; } }
const EFF_ALL=Object.keys(EFF);
/* Was in welcher Groessenklasse geschossen wird */
const EFF_KLEIN=['kugel','ring','knister','fische','kreisel','wechsel','spinne','strobe','tausend','regenbogen','ringring','spirale'];
const EFF_GROSS=['chrys','weide','palme','brokat','doppelring','crossette','dreifach','blink','dahlie','pistill','geist','saturn','blaetter','mehrring','komet','kaskade','glitzerweide','schneeflocke','spirale','ringring','strauss'];
const EFF_PRO=['kamuro','brokat','pistill','zeitregen','dahlie','geist','weide','palme','saturn','chrys','mehrring','komet','glitzerweide','titan','strauss'];

/* =========================================================
   Raketen
   ========================================================= */
function shot(o,opt){
  opt=opt||{}; o=o||PAD;
  const ang=opt.ang||0, dir=opt.dir===undefined?rand(0,Math.PI*2):opt.dir;
  /* Spielmassstab: die Brueche liegen bei gut 15 m statt 21 m. Vom
     Zuendpult aus - sieben bis zwoelf Meter vor den Stationen - lagen
     sie sonst so steil ueber einem, dass man sie beim Zuenden nicht
     im Bild hatte. */
  const up=((opt.pw||0)+rand(19,23))*STEIG;
  const sc=opt.A?[opt.A,opt.B||opt.A]:scheme(opt.sc);
  /* ab: Hoehe ueber dem Ursprung, jit: seitliche Streuung. Aus einem
     Rohr oder einer Batterie kommt der Schuss genau dort heraus. */
  const jit=o.jit!==undefined?o.jit:0.35, ab=o.ab!==undefined?o.ab:0.4;
  const start=V(o.x+rand(-jit,jit),o.y!==undefined?o.y+ab:1,o.z+rand(-jit,jit));
  /* Muendungsfeuer: ein kurzer Funkenstoss aus dem Rohr */
  for(let i=0;i<Math.round((10+(opt.dick||0)*14)*QUAL());i++){
    const a=Math.random()*Math.PI*2, w=rand(0.3,1.6);
    psMid.emit(start.x,start.y,start.z,Math.cos(a)*w,rand(1.5,5),Math.sin(a)*w,1,.72,.3,rand(0.25,0.55),5,4); }
  rockets.push({
    p:start,
    v:V(Math.sin(dir)*Math.sin(ang)*up,Math.cos(ang)*up,Math.cos(dir)*Math.sin(ang)*up),
    fuse:opt.fuse||rand(1.05,1.35),
    A:sc[0],B:sc[1],eff:opt.eff||pick(EFF_GROSS),size:opt.sz||1,
    trail:opt.trail||(Math.random()<0.25?FW.silber:FW.gold),
    /* Nachbrueche: Tochterbomben, die nach dem Hauptbruch aufgehen */
    stufen:opt.stufen||null, dick:opt.dick||0,
    /* pfeif: die Rakete zieht eine Spirale und heult beim Steigen */
    pfeif:!!opt.pfeif, ph:Math.random()*6
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
  opt=opt||{};
  const K4=Math.max(1,Math.min(5,kal|0));
  const [A,B]=opt.A?[opt.A,opt.B||opt.A]:scheme();
  const groesse=[1.4,1.8,2.3,2.7,3.2][K4-1];
  /* Bruchhoehe etwa 20, 24, 27, 30 und 36 m: hoch genug fuer die
     grossen Kugeln, aber vom Zuendpult aus noch im Bild */
  const steig=[1,3,4,5,8][K4-1];
  const zuend=[1.4,1.6,1.8,1.95,2.25][K4-1];
  /* Abschussknall und Muendungsfeuer im Rohr */
  const v0=distVol(o);
  sfx.boom(Math.min(1.5,v0*(0.55+0.2*K4)));
  shake=Math.max(shake,Math.min(1.2,0.22*K4)*v0);
  flash({x:o.x,y:o.y+0.4,z:o.z},FW.bernstein,2.4+K4,0.28);
  for(let i=0;i<Math.round(60*K4*QUAL());i++){
    const a=Math.random()*Math.PI*2, w=rand(0.4,2.4);
    psMid.emit(o.x,o.y+(o.ab!==undefined?o.ab:0.3),o.z,Math.cos(a)*w,rand(5,13),Math.sin(a)*w,1,.78,.34,rand(0.5,1.2),7,4);
  }
  const haupt=opt.eff||pick(K4>=3?['mehrring','pistill','dahlie','geist','kamuro','titan']:EFF_PRO);
  const C=K(pick(['weiss','zitrone','tuerkis','magenta','limette']));
  const stufen=[];
  if(K4===2){
    /* 100 mm: vier Tochterbrueche im Kreis, kurz nacheinander */
    ringLage(4,6.5).forEach((off,i)=>stufen.push({t:0.5+i*0.16,off,
      eff:pick(['kugel','pistill','knister','spinne','regenbogen']),sz:groesse*0.42,A:i%2?B:A,B:i%2?A:B}));
  }
  if(K4===3){
    /* 150 mm: sechs Tochterbrueche auf einmal im Ring, dann eine
       zweite Welle, zum Schluss die grosse Glocke mit Schlag */
    ringLage(6,8).forEach((off,i)=>stufen.push({t:0.55,off,leise:i>0,
      eff:pick(['kugel','pistill','knister','strobe','crossette']),sz:groesse*0.4,A:i%2?B:A,B:i%2?A:B}));
    ringLage(4,5,1).forEach((off,i)=>stufen.push({t:1.05+i*0.08,off,leise:i>0,
      eff:pick(['tausend','fische','spinne']),sz:groesse*0.36,A:C,B:A}));
    stufen.push({t:1.6,eff:pick(['kamuro','brokat','zeitregen','glitzerweide']),sz:groesse*0.9,streu:2,A,B});
    stufen.push({t:1.68,eff:'salut',sz:0.9,streu:5,A:FW.weiss,B:FW.weiss});
  }
  if(K4===4){
    /* 200 mm Goetterzorn: zehn Brueche gleichzeitig im Ring, dann
       zehn weitere versetzt darueber, eine Knisterwolke und zum
       Schluss Goldglocke und Salut */
    const F=[A,B,C,FW.weiss,FW.gold];
    ringLage(10,10).forEach((off,i)=>stufen.push({t:0.5,off,leise:i>0,
      eff:pick(['kugel','pistill','wechsel','regenbogen','strobe']),sz:groesse*0.36,A:F[i%5],B:F[(i+2)%5]}));
    ringLage(10,6,1.2).forEach((off,i)=>stufen.push({t:1.05,off,leise:i>0,
      eff:pick(['knister','tausend','spinne','kreisel']),sz:groesse*0.32,A:F[(i+1)%5],B:F[(i+3)%5]}));
    stufen.push({t:1.7,eff:'tausend',sz:groesse*0.8,streu:1,A:FW.weiss,B:FW.weiss});
    stufen.push({t:2.3,eff:pick(['kamuro','glitzerweide','brokat']),sz:groesse*0.95,streu:2,A,B});
    stufen.push({t:2.36,eff:'salut',sz:1.0,streu:4,A:FW.weiss,B:FW.weiss});
    stufen.push({t:2.5,eff:'salut',sz:0.9,streu:6,A:FW.weiss,B:FW.weiss});
  }
  if(K4===5){
    /* 300 mm Himmelsbrecher: ein Riesenball, dann zwoelf Brueche im
       Ring, ein zweiter Ring quer dazu, eine Crossette-Krone, zum
       Schluss eine silberne Weide ueber den ganzen Himmel und Salut */
    const F=[A,B,C,FW.weiss,FW.gold,FW.tuerkis];
    ringLage(12,13).forEach((off,i)=>stufen.push({t:0.55,off,leise:i>0,
      eff:pick(['pistill','mehrring','ringring','regenbogen','schneeflocke']),sz:groesse*0.3,A:F[i%6],B:F[(i+3)%6]}));
    ringLage(12,9,1.3).forEach((off,i)=>stufen.push({t:1.15,off,leise:i>0,
      eff:pick(['spirale','kugel','strauss','dahlie']),sz:groesse*0.28,A:F[(i+1)%6],B:F[(i+4)%6]}));
    stufen.push({t:1.8,eff:'crossette',sz:groesse*0.55,streu:1,A:FW.gold,B:FW.weiss});
    stufen.push({t:2.2,eff:'tausend',sz:groesse*0.7,streu:2,A:FW.weiss,B:FW.weiss});
    stufen.push({t:2.8,eff:'glitzerweide',sz:groesse*0.8,streu:1,A,B});
    for(let i=0;i<4;i++) stufen.push({t:2.9+i*0.12,eff:'salut',sz:1.0,streu:8,A:FW.weiss,B:FW.weiss});
  }
  shot(o,{pw:steig,sz:groesse,eff:haupt,fuse:zuend,A,B,
          trail:K4>=3?FW.weiss:FW.gold,dick:Math.min(3,K4),stufen});
}
/* Bodeneffekt: Mine, die beim Start eine Fontäne wirft */
function mine(o,A,B,s){
  const n=Math.round(90*(s||1)*QUAL()), y0=o.y!==undefined?o.y:0.3;
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, w=rand(0.5,3.2), c=i%3?A:B;
    psMid.emit(o.x+rand(-.08,.08),y0,o.z+rand(-.08,.08),Math.cos(a)*w,rand(9,16),Math.sin(a)*w,c[0],c[1],c[2],rand(1.1,1.9),6.5,4); }
  flash({x:o.x,y:1.6,z:o.z},A,2.0,0.5);
  sfx.thump(distVol(o)*1.2);
}
function fwBurst(r){
  const p=r.p, fn=EFF[r.eff]||EFF.kugel;
  mitSchweif(r.eff,()=>fn(p,r.A,r.B,r.size));
  kern(p,r.A,r.size);
  /* Grosse Brueche glitzern kurz nach dem Aufgehen noch einmal nach */
  if(r.size>=1.1&&r.eff!=='salut'&&r.eff!=='furz') later(0.75,()=>nachglitzer(p,r.size));
  /* Wer ein Bruchbild einmal gesehen hat, darf es spaeter selbst verbauen */
  if(typeof bruchGesehen==='function') bruchGesehen(r.eff);
  const mix=[(r.A[0]+r.B[0])/2,(r.A[1]+r.B[1])/2,(r.A[2]+r.B[2])/2];
  const lang=r.eff==='weide'||r.eff==='brokat'||r.eff==='kamuro'||r.eff==='zeitregen';
  flash(p,mix,2.2+3.4*r.size,lang?1.2:0.6);
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
function updateFireworks(dt){
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
      const alt=SCHWEIF; SCHWEIF=0.6;
      for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, w=rand(0,1.5)*H, c=Math.random()<0.8?A:B;
        psMid.emit(o.x,o.y+0.25,o.z,Math.cos(a)*w,rand(17,21)*Math.sqrt(H),Math.sin(a)*w,c[0],c[1],c[2],rand(1.6,2.6),6,4); }
      e.acc2=(e.acc2||0)+dt*16*H;
      SCHWEIF=0.45;
      for(;e.acc2>=1;e.acc2--){ const a=Math.random()*Math.PI*2, w=rand(0.5,2.4)*H, c=e.C||pick(SCHEMES.map(x=>K(x[0])));
        psBig.emit(o.x,o.y+0.25,o.z,Math.cos(a)*w,rand(19,24)*Math.sqrt(H),Math.sin(a)*w,c[0],c[1],c[2],rand(2.0,2.6),6,0); }
      SCHWEIF=alt;
      /* knisternde Krone auf etwa zehn Metern */
      const kr=10.2*H;
      for(let k=0;k<Math.round(dt*220*H);k++){ const a=Math.random()*Math.PI*2, r=rand(0,2.4)*H;
        psSmall.emit(o.x+Math.cos(a)*r,o.y+kr+rand(-1.2,0.6),o.z+Math.sin(a)*r,rand(-.5,.5),rand(-1,0.5),rand(-.5,.5),1,.95,.8,rand(0.2,0.45),2,3); }
      e.kn=(e.kn||0)-dt; if(e.kn<=0){ e.kn=rand(0.35,0.8); sfx.crackle(distVol(o)*0.6); }
      e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=1.2; sfx.fizz(distVol(o)); } }
    else if(e.k==='furzfont'){
      /* brauner Schweif, waehrend die Rakete steigt */
      for(let k=0;k<9;k++){ const a=Math.random()*Math.PI*2, sp=rand(0.2,1.3);
        const c=k%4?FW.braun:FW.sumpf;
        psMid.emit(o.x,o.y+0.25,o.z,Math.cos(a)*sp,rand(2.5,5.5),Math.sin(a)*sp,c[0],c[1],c[2],rand(1.2,2.2),-0.2); } }
    else if(e.k==='spark'){
      for(let k=0;k<7;k++){ const d=randDir(), s=rand(1,2.4);
        psSmall.emit(o.x,o.y+0.3,o.z,d[0]*s,d[1]*s+0.4,d[2]*s,1,rand(0.8,1),rand(0.45,0.85),rand(0.25,0.55),4,3); } }
    else { for(let k=0;k<2;k++){ const d=randDir();
        psSmall.emit(o.x,o.y+0.05,o.z,d[0],d[1]+0.4,d[2],1,0.9,0.5,rand(0.2,0.4),4,0); } }
    if(e.t<=0) emitters.splice(i,1); }
  psHuge.update(dt); psBig.update(dt); psMid.update(dt); psSmall.update(dt); updateFlash(dt);
}

/* =========================================================
   Raketen - je Rakete ein eigener Aufstieg und ein eigener Bruch
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Katalog: katalog-raketen.md. Eine Zuendung = eine Rakete = ein Bruch.
   Kein Bruch und kein Aufstieg kommt bei zwei Raketen vor.
   Level 6-9 leise Einzelideen, 10-13 Bewegung und Kontrast, 15-19
   Brueche, in denen nach dem Aufgehen noch etwas passiert, 20-25
   Jumbos, deren Bild sich ueber Sekunden entwickelt.
   ========================================================= */

/* ---------- Hilfen (nur fuer die Raketenbrueche) ---------- */
const RK={n:0,schirme:[],hoefe:[]};
function rkSchweif(sp,fn){ const a=SCHWEIF; SCHWEIF=sp; try{ fn(); } finally { SCHWEIF=a; } }
const rkMal=(c,f)=>[c[0]*f,c[1]*f,c[2]*f];
/* Gefuehrter Stern, der NICHT von selbst verblasst: fn(s,dt) setzt Ort
   (s.p), Tempo (s.v) und Helligkeit (s.hell) je Bild; das lineare
   Verblassen der Partikel ist herausgerechnet. Modus 2 ohne Farbwechsel,
   damit nichts zufaellig flackert, wenn der Bruch es nicht will. */
function rkStern(ps,p,v,c,life,fn,o){
  o=o||{};
  return fuehre(ps,p.x,p.y,p.z,v[0],v[1],v[2],c,life,(s,dt)=>{
    s.hell=1; if(fn(s,dt)===false) return false;
    const f=Math.max(0.03,1-s.alter/s.life), h=s.hell/f, j=s.i*3, P=s.ps;
    s.hell=h; P.c2[j]=s.c[0]*h; P.c2[j+1]=s.c[1]*h; P.c2[j+2]=s.c[2]*h;
  },Object.assign({mode:2},o));
}
/* Flug mit eigenem Luftwiderstand k und Schwerkraft g */
function rkFlug(s,dt,k,g){ const v=s.v, e=Math.exp(-k*dt); v[0]*=e; v[1]=v[1]*e-g*dt; v[2]*=e;
  s.p[0]+=v[0]*dt; s.p[1]+=v[1]*dt; s.p[2]+=v[2]*dt; }
/* Spur hinter einem gefuehrten Stern: rate Funken je Sekunde, verteilt
   auf die Strecke dieses Bildes (keine Perlenkette) */
function rkSpur(s,dt,rate,fn){
  const d=s.d; if(!d.lp){ d.lp=s.p.slice(); return; }
  d.sa=(d.sa||0)+rate*dt*QUAL();
  for(;d.sa>=1;d.sa--){ const f=Math.random(); fn(d.lp[0]+(s.p[0]-d.lp[0])*f,d.lp[1]+(s.p[1]-d.lp[1])*f,d.lp[2]+(s.p[2]-d.lp[2])*f); }
  d.lp[0]=s.p[0]; d.lp[1]=s.p[1]; d.lp[2]=s.p[2];
}
/* Richtung quer zum Blick (waagrecht), Vorzeichen seite */
function rkQuer(p,seite){ const c=camera.position, dx=c.x-p.x, dz=c.z-p.z, l=Math.hypot(dx,dz)||1; return [-dz/l*seite,0,dx/l*seite]; }
/* waagrecht zur Kamera hin */
function rkZuMir(p){ const c=camera.position, dx=c.x-p.x, dz=c.z-p.z, l=Math.hypot(dx,dz)||1; return [dx/l,0,dz/l]; }
/* Bildebene: rechts und oben, wie der Zuschauer sie sieht, dazu zur Kamera */
function rkBild(p){ const c=camera.position; let n=[c.x-p.x,c.y-p.y,c.z-p.z]; const l=Math.hypot(n[0],n[1],n[2])||1; n=[n[0]/l,n[1]/l,n[2]/l];
  let r=[n[2],0,-n[0]]; const lr=Math.hypot(r[0],r[2])||1; r=[r[0]/lr,0,r[2]/lr];
  const o=[n[1]*r[2]-n[2]*r[1],n[2]*r[0]-n[0]*r[2],n[0]*r[1]-n[1]*r[0]]; return [r,o,n]; }
/* Leuchthof als weicher, additiver Sprite (Fallschirm, Mond, Polarstern, Pulsar) */
function rkHof(){
  let h=RK.hoefe.find(x=>!x.an); if(h){ h.an=true; return h; }
  if(RK.hoefe.length>=6) return null;
  const m=new THREE.SpriteMaterial({map:dotTex,transparent:true,opacity:0,depthWrite:false,fog:false,toneMapped:false,blending:THREE.AdditiveBlending});
  const sp=new THREE.Sprite(m); sp.visible=false; scene.add(sp); h={sp,an:true}; RK.hoefe.push(h); return h;
}
function rkHofSetz(h,p,gr,c,a){ if(!h) return; h.sp.position.set(p[0],p[1],p[2]); h.sp.scale.set(gr,gr,1); h.sp.material.color.setRGB(c[0],c[1],c[2]); h.sp.material.opacity=clamp(a,0,1); h.sp.visible=a>0.005; }
function rkHofWeg(h){ if(!h) return; h.sp.visible=false; h.an=false; }
/* eigene Bruchklaenge (knall:'...' im Raketeneintrag statt des Knalls) */
Object.assign(sfx,{
  /* muedes Pff: der Scheinbruch des Spaetzuenders, der Ausstoss der Schnuppe */
  rakPff:v=>rauschF({dur:0.28,vol:0.2*v,typ:'bandpass',f:900,f2:380,q:0.9,an:0.02}),
  /* weicher Puff ohne Zerleger (Garbe) */
  rakPuff:v=>{ rauschF({dur:0.32,vol:0.28*v,f:520,an:0.015}); tone(90,0.12,'sine',0.1*v,55); },
  /* tiefer, langer Knall (Mondfinsternis) */
  rakTief:v=>{ noise(1.6,0.9*v,260); noise(0.2,0.45*v,2400); if(typeof grollen==='function') grollen(2.4,0.55*v,85,0.25); }
});

/* ---------------------------------------------------------
   Brueche (neue-effekte.md 1.3), je Rakete genau einer
   --------------------------------------------------------- */

/* Fallschirm (Schwebelicht, L6): leiser Plopp, dann haengt EIN Licht am
   Schirm, sinkt 8 s pendelnd und faerbt den Boden in seiner Farbe */
function rkSchirm(c){
  let S=RK.schirme.find(x=>!x.an);
  if(!S){ if(RK.schirme.length>=4) return null;
    const g=new THREE.Group();
    const km=new THREE.MeshBasicMaterial({color:0x777777,transparent:true,opacity:0.36,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false});
    const k=new THREE.Mesh(new THREE.SphereGeometry(1,16,5,0,Math.PI*2,0,Math.PI*0.42),km);
    k.scale.set(1.1,0.6,1.1); k.position.y=1.05; g.add(k);
    const pos=[]; for(let i=0;i<8;i++){ const a=i/8*Math.PI*2, rr=1.1*Math.sin(Math.PI*0.42); pos.push(Math.cos(a)*rr,1.05+0.6*Math.cos(Math.PI*0.42),Math.sin(a)*rr,0,0.05,0); }
    const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    const lm=new THREE.LineBasicMaterial({color:0x888888,transparent:true,opacity:0.45,depthWrite:false,fog:false});
    g.add(new THREE.LineSegments(lg,lm)); g.visible=false; scene.add(g);
    S={g,km,lm}; RK.schirme.push(S); }
  S.an=true;
  /* von unten angestrahlt: grau, in der Farbe des Lichts getoent */
  S.km.color.setRGB(0.2+c[0]*0.22,0.2+c[1]*0.22,0.2+c[2]*0.22); S.lm.color.setRGB(0.3+c[0]*0.3,0.3+c[1]*0.3,0.3+c[2]*0.3);
  return S;
}
EFF.fallschirm=function(p,A,B,s,r){
  const c=A, L=8, key='fs'+(++RK.n), S=rkSchirm(c), hof=rkHof();
  const pa=rand(0,Math.PI*2), pen=[Math.cos(pa),Math.sin(pa)], da=rand(0,Math.PI*2), dr=[Math.cos(da)*0.3,Math.sin(da)*0.3];
  const v0=r&&r.v?[r.v.x*0.3,Math.max(0,r.v.y)*0.3+1.2,r.v.z*0.3]:[0,1.8,0];
  /* Ausstoss: zehn kleine Funken, ein kurzer Lichtpunkt */
  for(let i=0;i<10;i++){ const d=randDir(), w=rand(2,4); psSmall.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.85,.5,rand(0.3,0.6),3,0); }
  psHuge.emit(p.x,p.y,p.z,0,0,0,1,.95,.8,0.1,0,0);
  if(S) S.g.rotation.y=rand(0,6);
  rkStern(psHuge,p,[0,0,0],rkMal(c,1.25),L,(st,dt)=>{
    const t=st.alter, e=1-Math.exp(-2.5*t), w=2*Math.PI*0.4, amp=0.5*Math.min(1,t/1.5), sw=amp*Math.sin(w*t);
    const x=p.x+v0[0]*e/2.5+dr[0]*t+pen[0]*sw, y=p.y+(v0[1]+1.2)*e/2.5-1.2*t, z=p.z+v0[2]*e/2.5+dr[1]*t+pen[1]*sw;
    st.p[0]=x; st.p[1]=y; st.p[2]=z; st.v[0]=st.v[1]=st.v[2]=0;
    /* der Leuchtsatz flackert leicht, die letzten 1,5 s stirbt er */
    let h=1.35*(0.88+0.12*Math.random()); const rest=L-t;
    if(t<0.25) h*=t/0.25;
    if(rest<1.5) h*=(rest/1.5)*(0.25+Math.random()*0.95);
    st.hell=h;
    licht(key,{x,y,z},c,2.8*h,{weite:26});
    rkHofSetz(hof,[x,y,z],3.2,c,0.34*h);
    if(S){ S.g.visible=t>0.35; S.g.position.set(x,y,z); S.g.rotation.z=-Math.cos(w*t)*amp*0.25*pen[0]; S.g.rotation.x=Math.cos(w*t)*amp*0.25*pen[1]; }
    /* brennende Tropfen fallen aus dem Leuchtsatz */
    const d=st.d; d.tr=(d.tr||0)+dt*26*QUAL()*Math.min(1,h);
    for(;d.tr>=1;d.tr--) psMid.emit(x+rand(-.06,.06),y-0.1,z+rand(-.06,.06),rand(-.3,.3),rand(-2.4,-1),rand(-.3,.3),0.6+c[0]*0.5,0.6+c[1]*0.5,0.6+c[2]*0.5,rand(0.35,0.75),4,0);
  },{ende:()=>{ if(S){ S.g.visible=false; S.an=false; } rkHofWeg(hof); }});
};

/* Schnuppe (Sternschnuppe, L6): ohne Aufstiegsspur ploppt es oben leise,
   und EINE Sternschnuppe zieht fast waagrecht quer ueber den Himmel */
EFF.schnuppe=function(p,A,B,s){
  /* sie zieht zur Bildmitte hin und etwas vom Zuschauer weg - so quert
     sie den ganzen Himmel, statt nach einer halben Sekunde aus dem Bild
     zu fliegen */
  let seite=Math.random()<0.5?-1:1;
  try{ const rr=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion), c=camera.position, lat=(p.x-c.x)*rr.x+(p.z-c.z)*rr.z; if(Math.abs(lat)>1) seite=lat>0?1:-1; }catch(e){}
  const q0=rkQuer(p,seite), zu=rkZuMir(p), wa=0.5, q=[q0[0]*Math.cos(wa)-zu[0]*Math.sin(wa),0,q0[2]*Math.cos(wa)-zu[2]*Math.sin(wa)];
  const el=-rand(5,15)*Math.PI/180, w=rand(15,17);
  const v=[q[0]*Math.cos(el)*w,Math.sin(el)*w,q[2]*Math.cos(el)*w], T=1.6, kopf=[1.2,1.25,1.35], bl=B||FW.himmel;
  for(let i=0;i<6;i++){ const d=randDir(); psSmall.emit(p.x,p.y,p.z,d[0]*2,d[1]*2,d[2]*2,.9,.95,1,0.25,2,0); }
  rkStern(psHuge,p,[0,0,0],kopf,T,(st,dt)=>{
    const t=st.alter; st.p[0]=p.x+v[0]*t; st.p[1]=p.y+v[1]*t; st.p[2]=p.z+v[2]*t; st.v[0]=st.v[1]=st.v[2]=0;
    let h=Math.min(1,t/0.12)*1.3;
    /* am Ende flackert der Kopf zweimal auf */
    if((t>1.28&&t<1.34)||(t>1.44&&t<1.5)) h=3.2; else if(t>1.34) h*=0.7;
    st.hell=h;
    /* Schweif: duenn, weiss nach himmelblau, die Teilchen stehen */
    const k=Math.min(1.4,h/1.3);
    rkSpur(st,dt,190,(x,y,z)=>psMid.emit(x,y,z,rand(-.05,.05),rand(-.08,0),rand(-.05,.05),1.1*k,1.1*k,1.15*k,rand(0.4,0.55),0,2,bl[0]*0.5,bl[1]*0.5,bl[2]*0.5));
    /* blauer Schimmer um den Schweif - ueber die Strecke verteilt, sonst
       stehen die Lichtpunkte als Perlenkette */
    const d=st.d; if(!d.g2) d.g2={d:{}}; d.g2.p=st.p;
    rkSpur(d.g2,dt,120,(x,y,z)=>psBig.emit(x,y,z,0,0,0,bl[0]*0.2,bl[1]*0.2,bl[2]*0.26,rand(0.6,0.9),0,2,0,0,0));
  },{ende:st=>{ const e=st.p; for(let i=0;i<8;i++){ const d=randDir(); psSmall.emit(e[0],e[1],e[2],v[0]*0.2+d[0]*1.5,v[1]*0.2+d[1]*1.5,v[2]*0.2+d[2]*1.5,1,1,1,rand(0.2,0.35),1,0); } }});
  schall(p,vv=>sfx.zischen(vv*0.35,1.4));
};

/* Garbe (Himmelsgarbe, L8): ohne Zerleger schuettet der Kopf eine Garbe
   Farbsterne nach OBEN aus - sie steigen weiter, faechern auf und fallen
   in Boegen nach allen Seiten wie das Wasser eines Springbrunnens */
EFF.garbe=function(p,A,B,s,r){
  const q=QUAL(), n=Math.round(64*s*q);
  let up=[0,1,0]; if(r&&r.v){ const l=r.v.length()||1; up=[r.v.x/l*0.5,1,r.v.z/l*0.5]; const m=Math.hypot(up[0],up[1],up[2]); up=[up[0]/m,up[1]/m,up[2]/m]; }
  const [u1,u2]=quer(up), cmax=Math.cos(0.75);
  for(let i=0;i<n;i++){
    /* gleichmaessig im Kegel, am Rand etwas dichter (Wasserschleier) */
    const cz=1-Math.pow(Math.random(),0.6)*(1-cmax), sz=Math.sqrt(1-cz*cz), a=rand(0,Math.PI*2);
    const d=[up[0]*cz+(u1[0]*Math.cos(a)+u2[0]*Math.sin(a))*sz,up[1]*cz+(u1[1]*Math.cos(a)+u2[1]*Math.sin(a))*sz,up[2]*cz+(u1[2]*Math.cos(a)+u2[2]*Math.sin(a))*sz];
    const w=rand(9,12)*Math.sqrt(s), c=i%2?A:B, L=rand(2.0,2.6), st=[c[0]*0.85,c[1]*0.85,c[2]*0.85];
    /* wenig Luftwiderstand: der Stern steigt weiter, kippt und faellt in
       einem echten Bogen - wie ein Wasserstrahl */
    rkStern(psBig,p,[d[0]*w,d[1]*w,d[2]*w],rkMal(c,1.3),L,(sp,dt)=>{ rkFlug(sp,dt,0.45,7); const t=sp.alter; sp.hell=t>L-0.5?(L-t)/0.5:1;
      rkSpur(sp,dt,38,(x,y,z)=>psMid.emit(x,y,z,rand(-.1,.1),rand(-.3,0),rand(-.1,.1),st[0],st[1],st[2],rand(0.35,0.55),0.5,2,st[0]*0.3,st[1]*0.3,st[2]*0.3)); });
  }
  for(let i=0;i<3;i++) psHuge.emit(p.x,p.y,p.z,rand(-.3,.3),rand(0,.6),rand(-.3,.3),1,.8,.45,0.14,0,0);
  schall(p,v=>sfx.rieseln(v*0.9,2.2));
};

/* Initiale (Gravur-Rakete, L9): die Goldsterne formen die Initialen der
   Gravur im 5x7-Punktraster, flach zum Zuschauer. Ohne Text: Goldring. */
const RK_SCHRIFT=(()=>{ const z={
  A:'01110 10001 10001 11111 10001 10001 10001',B:'11110 10001 10001 11110 10001 10001 11110',C:'01110 10001 10000 10000 10000 10001 01110',
  D:'11110 10001 10001 10001 10001 10001 11110',E:'11111 10000 10000 11110 10000 10000 11111',F:'11111 10000 10000 11110 10000 10000 10000',
  G:'01110 10001 10000 10111 10001 10001 01111',H:'10001 10001 10001 11111 10001 10001 10001',I:'01110 00100 00100 00100 00100 00100 01110',
  J:'00111 00010 00010 00010 00010 10010 01100',K:'10001 10010 10100 11000 10100 10010 10001',L:'10000 10000 10000 10000 10000 10000 11111',
  M:'10001 11011 10101 10101 10001 10001 10001',N:'10001 10001 11001 10101 10011 10001 10001',O:'01110 10001 10001 10001 10001 10001 01110',
  P:'11110 10001 10001 11110 10000 10000 10000',Q:'01110 10001 10001 10001 10101 10010 01101',R:'11110 10001 10001 11110 10100 10010 10001',
  S:'01111 10000 10000 01110 00001 00001 11110',T:'11111 00100 00100 00100 00100 00100 00100',U:'10001 10001 10001 10001 10001 10001 01110',
  V:'10001 10001 10001 10001 10001 01010 00100',W:'10001 10001 10001 10101 10101 10101 01010',X:'10001 10001 01010 00100 01010 10001 10001',
  Y:'10001 10001 10001 01010 00100 00100 00100',Z:'11111 00001 00010 00100 01000 10000 11111',
  0:'01110 10001 10011 10101 11001 10001 01110',1:'00100 01100 00100 00100 00100 00100 01110',2:'01110 10001 00001 00010 00100 01000 11111',
  3:'11111 00010 00100 00010 00001 10001 01110',4:'00010 00110 01010 10010 11111 00010 00010',5:'11111 10000 11110 00001 00001 10001 01110',
  6:'00110 01000 10000 11110 10001 10001 01110',7:'11111 00001 00010 00100 01000 01000 01000',8:'01110 10001 10001 01110 10001 10001 01110',
  9:'01110 10001 10001 01111 00001 00010 01100','+':'00000 00100 00100 11111 00100 00100 00000','&':'01100 10010 10100 01000 10101 10010 01101'};
  const o={}; for(const k in z) o[k]=z[k].split(' '); return o; })();
/* "Anna & Tom" -> "A+T", ein Wort -> die ersten drei Buchstaben */
function rkInitialen(t){
  if(!t) return '';
  const w=String(t).toUpperCase().replace(/Ä/g,'A').replace(/Ö/g,'O').replace(/Ü/g,'U').replace(/ß/g,'S').replace(/[ÀÁÂ]/g,'A').replace(/[ÈÉÊ]/g,'E')
    .split(/[^A-Z0-9]+/).filter(Boolean);
  if(w.length>=2) return w[0][0]+'+'+w[1][0];
  if(w.length===1) return w[0].slice(0,3);
  return /&/.test(t)?'&':'';
}
EFF.initiale=function(p,A,B,s,r){
  const txt=rkInitialen(r&&(r.text||(r.par&&r.par.text))), [ri,ob]=rkBild(p), H=7*s, d=H/6, pts=[];
  if(txt){ const cols=txt.length*6-1;
    for(let i=0;i<txt.length;i++){ const g=RK_SCHRIFT[txt[i]]; if(!g) continue;
      for(let y=0;y<7;y++) for(let x=0;x<5;x++) if(g[y][x]==='1') pts.push([(i*6+x-(cols-1)/2)*d,(3-y)*d]); } }
  if(!pts.length){ const n=30, R=3.6*s; for(let k=0;k<n;k++){ const a=k/n*Math.PI*2; pts.push([Math.cos(a)*R,Math.sin(a)*R]); } }
  const gold=FW.gold, rose=B||FW.rose, T0=0.35, T1=T0+1.8, T2=T1+0.9, p0=[p.x,p.y,p.z];
  pts.forEach(([x,y])=>{
    const ziel=[p.x+ri[0]*x+ob[0]*y,p.y+ri[1]*x+ob[1]*y,p.z+ri[2]*x+ob[2]*y], ph=rand(0,6.3), fz=rand(-.3,.3);
    rkStern(psHuge,p,[0,0,0],rkMal(gold,1.35),T2,(st,dt)=>{
      const t=st.alter, d0=st.d; st.v[0]=st.v[1]=st.v[2]=0;
      if(t<T0){ const e=1-Math.pow(1-t/T0,3); for(let k=0;k<3;k++) st.p[k]=p0[k]+(ziel[k]-p0[k])*e; st.hell=1.1; return; }
      if(!d0.da){ d0.da=true;
        /* angekommen: rosa Schimmer um den Punkt und ein Funkeln */
        psBig.emit(ziel[0],ziel[1],ziel[2],0,0,0,rose[0]*1.3,rose[1]*1.3,rose[2]*1.3,0.26,0,0);
        for(let k=0;k<3;k++){ const e=randDir(); psSmall.emit(ziel[0],ziel[1],ziel[2],e[0]*1.5,e[1]*1.5,e[2]*1.5,1,.95,.8,0.22,0,0); } }
      if(t<T1){ st.p[0]=ziel[0]; st.p[1]=ziel[1]-(t-T0)*0.12; st.p[2]=ziel[2]; st.hell=1.05+0.2*Math.sin(t*8+ph)+(Math.random()<0.02?0.9:0); return; }
      /* Rieseln: die Buchstaben zerfallen zu Goldglitter */
      const u=t-T1; st.p[0]=ziel[0]+fz*u; st.p[1]=ziel[1]-(T1-T0)*0.12-1.6*u*u; st.p[2]=ziel[2]; st.hell=1.1*(1-u/(T2-T1));
      d0.gl=(d0.gl||0)+dt*22*QUAL(); for(;d0.gl>=1;d0.gl--) psMid.emit(st.p[0],st.p[1],st.p[2],rand(-.35,.35),rand(-1.2,-0.2),rand(-.35,.35),1.2,.95,.45,rand(0.5,0.9),2.5,4);
    });
  });
  later(T1,()=>schall(p,v=>sfx.rieseln(v*0.8,1.2)));
};

/* Hakenschlag (Hasenjagd, L10): ein Dutzend dicke Farbsterne fliegt aus,
   jeder schlaegt zweimal einen harten Haken - Zickzackspuren wie Hasen
   auf der Flucht */
EFF.hakenschlag=function(p,A,B,s){
  const n=12;
  for(let i=0;i<n;i++){
    const c=i%2?A:B, d=randDir(), w=rand(7,9)*s, tk=[0.4+rand(-.05,.05),0.9+rand(-.06,.06)], hell=[0.6+c[0]*0.5,0.6+c[1]*0.5,0.6+c[2]*0.5];
    rkStern(psHuge,p,[d[0]*w,d[1]*w,d[2]*w],rkMal(c,1.3),1.6,(st,dt)=>{
      const t=st.alter, dd=st.d, k=dd.k||0;
      if(k<2&&t>=tk[k]){ dd.k=k+1;
        /* Haken: neue Richtung 60-120 Grad gegen die alte, Funkenstoss nach hinten */
        const v=st.v, sp=Math.hypot(v[0],v[1],v[2])||1, dn=[v[0]/sp,v[1]/sp,v[2]/sp], x=randDir(), pr=x[0]*dn[0]+x[1]*dn[1]+x[2]*dn[2];
        let e=[x[0]-pr*dn[0],x[1]-pr*dn[1],x[2]-pr*dn[2]]; const le=Math.hypot(e[0],e[1],e[2])||1; e=[e[0]/le,e[1]/le,e[2]/le];
        const a=rand(60,120)*Math.PI/180, nd=[dn[0]*Math.cos(a)+e[0]*Math.sin(a),dn[1]*Math.cos(a)+e[1]*Math.sin(a),dn[2]*Math.cos(a)+e[2]*Math.sin(a)], w2=8*s;
        v[0]=nd[0]*w2; v[1]=nd[1]*w2; v[2]=nd[2]*w2;
        for(let j=0;j<Math.round(12*QUAL());j++){ const b=streu([-nd[0],-nd[1],-nd[2]],0.35), bw=rand(4,7); psMid.emit(st.p[0],st.p[1],st.p[2],b[0]*bw,b[1]*bw,b[2]*bw,1.3,1.15,.8,rand(0.18,0.32),2,0); }
        psBig.emit(st.p[0],st.p[1],st.p[2],0,0,0,1.6,1.6,1.5,0.06,0,0);
        const q={x:st.p[0],y:st.p[1],z:st.p[2]}; schall(q,vv=>rauschF({dur:0.05,vol:0.1*vv,typ:'bandpass',f:3400,f2:1600,q:1.4})); }
      rkFlug(st,dt,0.7,1.2);
      st.hell=t>1.3?(1.6-t)/0.3:1;
      /* die Zickzackspur bleibt kurz am Himmel stehen */
      rkSpur(st,dt,110,(x,y,z)=>psMid.emit(x,y,z,rand(-.15,.15),rand(-.3,0),rand(-.15,.15),hell[0],hell[1],hell[2],rand(0.55,0.85),0.6,0));
    });
  }
};

/* Laserstern (Silberpfeil, L10): zwoelf grelle Striche radial in alle
   Raumrichtungen, die in voller Fahrt verloeschen - der kuerzeste Bruch
   im Spiel. Die Richtungen sind die Ecken eines Ikosaeders: gleichmaessig. */
const RK_IKO=(()=>{ const t=(1+Math.sqrt(5))/2, v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
  return v.map(a=>{ const l=Math.hypot(a[0],a[1],a[2]); return [a[0]/l,a[1]/l,a[2]/l]; }); })();
EFF.laserstern=function(p,A,B,s){
  const n=randDir(), [e1,e2]=quer(n), sb=B||FW.silber;
  rkSchweif(0.25,()=>{
    for(const d0 of RK_IKO){
      const d=[n[0]*d0[0]+e1[0]*d0[1]+e2[0]*d0[2],n[1]*d0[0]+e1[1]*d0[1]+e2[1]*d0[2],n[2]*d0[0]+e1[2]*d0[1]+e2[2]*d0[2]], w=rand(22,26)*s, L=rand(0.35,0.45);
      psHuge.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,2.4,2.4,2.5,L,0,2,sb[0]*1.5,sb[1]*1.5,sb[2]*1.6);
      /* zwei Begleiter machen den Strich dicker - leicht gestreut, sonst
         stehen sie als Perlenkette auf dem Strahl (Test perlen.js) */
      for(let k=0;k<2;k++){ const e=streu(d,0.018), f=rand(0.93,0.99); psBig.emit(p.x,p.y,p.z,e[0]*w*f,e[1]*w*f,e[2]*w*f,2,2,2.1,L,0,2,sb[0]*1.2,sb[1]*1.2,sb[2]*1.3); }
    }
  });
  schall(p,v=>sfx.crack(v*1.5));
};

/* Kometenkette (Kometenkette, L11): der Kometenkern zerbricht in eine Kette
   aus sieben Stuecken, die hintereinander weiterziehen, auseinander-
   driften und von vorn nach hinten verloeschen */
EFF.kometenkette=function(p,A,B,s,r){
  const q=rkQuer(p,Math.random()<0.5?-1:1), hb=rand(0.3,0.45);
  let dir=[q[0]*Math.cos(hb),Math.sin(hb),q[2]*Math.cos(hb)];
  /* die Kette setzt den Flug fort: ein wenig von der Raketenrichtung */
  if(r&&r.v){ const l=r.v.length()||1; dir=[dir[0]+r.v.x/l*0.3,dir[1]+r.v.y/l*0.15,dir[2]+r.v.z/l*0.3]; const m=Math.hypot(dir[0],dir[1],dir[2]); dir=[dir[0]/m,dir[1]/m,dir[2]/m]; }
  const [e1,e2]=quer(dir), gold=A||FW.gold, kopf=B||FW.blau;
  psHuge.emit(p.x,p.y,p.z,0,0,0,1.4,1.4,1.5,0.09,0,0);
  schall(p,v=>sfx.crack(v*0.5));
  for(let k=0;k<7;k++){
    /* die vorderen Stuecke sind schneller: die Kette zieht sich sichtbar auseinander */
    const q0={x:p.x-dir[0]*k*0.6,y:p.y-dir[1]*k*0.6,z:p.z-dir[2]*k*0.6}, w=(13-k*0.9)*Math.sqrt(s), a=rand(-0.8,0.8), b=rand(-0.5,0.5);
    const v=[dir[0]*w+e1[0]*a+e2[0]*b,dir[1]*w+e1[1]*a+e2[1]*b,dir[2]*w+e1[2]*a+e2[2]*b], L=1.4+k*0.2;
    rkStern(psHuge,q0,v,[0.45+kopf[0]*0.8,0.45+kopf[1]*0.8,0.5+kopf[2]*0.9],L,(st,dt)=>{
      rkFlug(st,dt,0.25,1.8); const rest=L-st.alter;
      st.hell=rest<0.14?(rest>0.07?2.6:0.6):1.25;
      /* Goldschweif: gluehende Teilchen bleiben hinter dem Kopf zurueck */
      rkSpur(st,dt,110,(x,y,z)=>psMid.emit(x+rand(-.04,.04),y+rand(-.04,.04),z+rand(-.04,.04),rand(-.2,.2),rand(-.4,0),rand(-.2,.2),gold[0]*1.2,gold[1]*1.05,gold[2]*0.8,rand(0.22,0.36),1,2,gold[0]*0.6,gold[1]*0.35,gold[2]*0.1));
      st.d.fk=(st.d.fk||0)+dt*30*QUAL(); for(;st.d.fk>=1;st.d.fk--) psMid.emit(st.p[0],st.p[1],st.p[2],rand(-.8,.8),rand(-1.6,0),rand(-.8,.8),1,.8,.4,rand(0.4,0.8),3,4);
    });
  }
  schall(p,v=>sfx.zischen(v*0.5,2.2));
};

/* Pfeifsterne (Korkenzieher, L11, ueberarbeitet): 22 Pfeifkometen, jeder
   zieht eine kleine Schraube (0,4 m, 5 U/s) und endet mit einem Knack */
EFF.pfeifsterne=function(p,A,B,s){
  for(let i=0;i<Math.round(70*s*QUAL());i++){ const d=randDir(), w=rand(4,5.5)*s, c=i%3?B:A;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(1.3,1.8),2.4,0); }
  for(let i=0;i<22;i++){
    const d=randDir(), w=rand(10,12.5)*s, c=i%2?A:B, [u1,u2]=quer(d), ph=rand(0,6.3), te=rand(1.4,1.8), v0=[d[0]*w,d[1]*w,d[2]*w], sp=[0.7+c[0]*0.4,0.65+c[1]*0.4,0.55+c[2]*0.4];
    rkStern(psBig,p,[0,0,0],rkMal(c,1.4),te,(st,dt)=>{
      const t=st.alter, q=bahnOrt(p,v0,2.2,t), a=ph+t*Math.PI*10, R=0.4*Math.min(1,t*5), ca=Math.cos(a), sa=Math.sin(a);
      st.p[0]=q.x+(u1[0]*ca+u2[0]*sa)*R; st.p[1]=q.y+(u1[1]*ca+u2[1]*sa)*R; st.p[2]=q.z+(u1[2]*ca+u2[2]*sa)*R; st.v[0]=st.v[1]=st.v[2]=0;
      st.hell=te-t<0.25?0.6:1;
      rkSpur(st,dt,85,(x,y,z)=>psMid.emit(x,y,z,rand(-.1,.1),rand(-.4,0),rand(-.1,.1),sp[0],sp[1],sp[2],rand(0.3,0.45),0.6,0));
    },{ende:st=>{ const e=st.p; psHuge.emit(e[0],e[1],e[2],0,0,0,1.8,1.8,1.8,0.07,0,0);
      for(let k=0;k<6;k++){ const x=randDir(); psSmall.emit(e[0],e[1],e[2],x[0]*2.5,x[1]*2.5,x[2]*2.5,1,1,.9,0.15,1,0); }
      schall({x:e[0],y:e[1],z:e[2]},vv=>sfx.crack(vv*0.22)); }});
  }
  const v=distVol(p); for(let i=0;i<3;i++) later(i*0.12,()=>sfx.whistle(v*0.9));
};

/* Halbe-Halbe (Halbe-Halbe, L12): die Kugel ist genau halb A und halb B,
   scharfe Grenze; nach 1,2 s tauschen die Haelften hart die Farben */
EFF.halbhalb=function(p,A,B,s){
  const [ri,ob]=rkBild(p), a=rand(-0.52,0.52), nn=[ri[0]*Math.cos(a)+ob[0]*Math.sin(a),ri[1]*Math.cos(a)+ob[1]*Math.sin(a),ri[2]*Math.cos(a)+ob[2]*Math.sin(a)];
  const n=Math.round(140*s*QUAL()), a1=rkMal(A,1.3), b1=rkMal(B,1.3);
  for(let i=0;i<n;i++){
    const d=randDir(), w=rand(8,9.5)*s, seite=d[0]*nn[0]+d[1]*nn[1]+d[2]*nn[2]>0;
    rkStern(psBig,p,[d[0]*w,d[1]*w,d[2]*w],seite?a1:b1,2.4,(st,dt)=>{
      rkFlug(st,dt,ZIEH,2.3); const t=st.alter;
      st.c=(t<1.2)===seite?a1:b1;
      st.hell=t>1.85?(2.4-t)/0.55:1;
    },{spur:0.3});
  }
  later(1.2,()=>schall(p,v=>rauschF({dur:0.14,vol:0.22*v,typ:'highpass',f:4200,an:0.01})));
};

/* Spaetzuender (Spaetzuender, L13): Scheinbruch wie ein Blindgaenger,
   1,2 s Stille, dann bricht an derselben Stelle eine Knisterwand los */
EFF.spaetzuender=function(p,A,B,s){
  const q=QUAL(), sil=FW.silber;
  for(let i=0;i<15;i++){ const d=randDir(), w=rand(2,3); psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,sil[0],sil[1],sil[2],rand(0.35,0.5),2,0); }
  psBig.emit(p.x,p.y,p.z,0,0,0,.5,.5,.5,0.12,0,0);
  const T0=0.5+1.2, D=1.6, R=6.6*s, N=Math.round(rand(200,260)*q), tint=[A||FW.silber,B||FW.gold,[1,.95,.82]];
  /* die Wand waechst von innen nach aussen */
  for(let i=0;i<N;i++){
    const u=Math.pow(Math.random(),0.8), t=T0+u*D, d=randDir(), rr=R*(0.18+0.82*Math.sqrt(u))*rand(0.8,1.05), c=tint[i%3];
    const x=p.x+d[0]*rr, y=p.y+d[1]*rr*0.9-0.6*u, z=p.z+d[2]*rr, gross=i%3===0;
    imBild(t,()=>{ knisterPop(x,y,z,{c,funken:gross?14:9,tempo:rand(2.8,4.8),laut:0.7});
      if(gross){ const a=SCHWEIF; SCHWEIF=0; psHuge.emit(x,y,z,0,0,0,1.5,1.45,1.3,0.05,0,0); SCHWEIF=a; } });
  }
  /* Koerper der Wand: Knisterfunken (Modus 3: blitzen zufaellig weiss auf),
     Welle fuer Welle weiter aussen - die Wand waechst von innen nach aussen */
  for(let k=0;k<14;k++){ const u=k/13, t=T0+u*D*0.9, rr=R*(0.2+0.8*Math.sqrt(u));
    imBild(t,()=>{ const a=SCHWEIF; SCHWEIF=0;
      for(let i=0;i<Math.round(34*s*q);i++){ const d=randDir(), f=rr*rand(0.7,1.05), c=i%3?[1,.93,.75]:(i%2?tint[0]:tint[1]);
        psMid.emit(p.x+d[0]*f,p.y+d[1]*f*0.9-0.6*u,p.z+d[2]*f,d[0]*rand(0.5,1.5),d[1]*rand(0.5,1.5)-0.3,d[2]*rand(0.5,1.5),c[0],c[1],c[2],rand(0.5,0.9),1.0,3); }
      SCHWEIF=a; }); }
  later(T0,()=>{ flash(p,[1,.92,.75],3.5*s,0.4);
    schall(p,v=>{ sfx.crackle(v*1.3); later(0.4,()=>sfx.crackle(v*0.45)); later(0.9,()=>sfx.crackle(v*0.8)); }); });
};

/* Achtblatt (Smaragd, L15, Happo-zaki): acht Paeckchen fliegen in einer
   Ebene auseinander und oeffnen je ein Strahlenbuendel - eine
   achtblaettrige, facettierte Bluete in drei Gruentoenen */
EFF.achtblatt=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.45), a0=rand(0,Math.PI*2), T=0.35, g=1.2, tone3=[FW.gruen,FW.mint,FW.limette];
  for(let k=0;k<8;k++){
    const a=a0+k*Math.PI/4, d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)], w=6*Math.sqrt(s), v0=[d[0]*w,d[1]*w,d[2]*w];
    psMid.emit(p.x,p.y,p.z,v0[0],v0[1],v0[2],0.1,0.42,0.16,T,g,0);
    imBild(T,()=>{
      const q=bahnOrt(p,v0,g,T), vr=bahnTempo(v0,g,T), c=tone3[k%3];
      psHuge.emit(q.x,q.y,q.z,0,0,0,0.6+c[0]*0.6,0.6+c[1]*0.6,0.6+c[2]*0.6,0.09,0,0);
      rkSchweif(0.32,()=>{
        for(let i=0;i<Math.round(18*QUAL());i++){ const e=streu(d,0.21), sp=rand(5,7)*Math.sqrt(s), cc=i<3?[0.75+c[0]*0.3,0.75+c[1]*0.3,0.75+c[2]*0.3]:c;
          psBig.emit(q.x,q.y,q.z,vr[0]*0.4+e[0]*sp,vr[1]*0.4+e[1]*sp,vr[2]*0.4+e[2]*sp,cc[0]*1.25,cc[1]*1.25,cc[2]*1.25,rand(1.6,2.0),2.2,4); }
        /* Facette: ein Buendel feiner, schnellerer Glitzerfunken an der Blattspitze */
        for(let i=0;i<Math.round(10*QUAL());i++){ const e=streu(d,0.1), sp=rand(7,8.5)*Math.sqrt(s);
          psMid.emit(q.x,q.y,q.z,vr[0]*0.4+e[0]*sp,vr[1]*0.4+e[1]*sp,vr[2]*0.4+e[2]*sp,1,1,.9,rand(1.0,1.5),2.2,4); } });
    });
  }
  later(T,()=>{ const vol=distVol(p); for(let k=0;k<8;k++) later(rand(0,0.06)+camera.position.distanceTo(p)/343,()=>sfx.crack(vol*0.28)); });
};

/* Leuchtturm (Leuchtturm, L16): eine stehende Kugel aus dunklen
   Weissblinkern; ein Lichtkegel dreht sich 2,5-mal durch sie, nur die
   Sterne darin blitzen; roter Kern wie die Laterne */
EFF.leuchtturm=function(p,A,B,s){
  const n=Math.round(210*QUAL()), R=6.2*s*0.72, th0=rand(0,Math.PI*2), W=2*Math.PI*2.5/3, T=3.0, L=3.55, rot=B||FW.rot, key='lt'+(++RK.n);
  const wink=t=>th0+W*Math.min(t,T);
  for(let i=0;i<n;i++){
    const d=randDir(), rr=R*rand(0.82,1.0), phi=Math.atan2(d[2],d[0]), ph=rand(0,1);
    rkStern(psBig,p,[0,0,0],[1,1,1],L,(st,dt)=>{
      const t=st.alter, e=1-Math.exp(-4.5*t);
      st.p[0]=p.x+d[0]*rr*e; st.p[1]=p.y+d[1]*rr*e-0.15*t; st.p[2]=p.z+d[2]*rr*e; st.v[0]=st.v[1]=st.v[2]=0;
      let h;
      if(t<0.35) h=1-t/0.35*0.9;
      else if(t<T){ const dp=Math.abs(((phi-wink(t))%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI); h=dp<0.38?(((t*10+ph)%1)<0.5?2.8:0.45):(dp<0.65?0.3:0.07); }
      else if(t<T+0.4) h=((t*10)%1)<0.5?2.4:0.06;
      else h=0;
      st.hell=h;
    });
  }
  /* die rote Laterne in der Mitte - und der Strahl, den man im Dunst sieht */
  rkStern(psHuge,p,[0,0,0],rkMal(rot,1.4),L,(st,dt)=>{
    const t=st.alter; st.p[0]=p.x; st.p[1]=p.y-0.15*t; st.p[2]=p.z; st.hell=t<T+0.4?1+0.15*Math.sin(t*9):0;
    if(t<T+0.4) licht(key,{x:p.x,y:p.y,z:p.z},rot,1.3,{weite:22});
    if(t>0.3&&t<T){ const a=wink(t), dir=[Math.cos(a),0,Math.sin(a)], dd=st.d; dd.st=(dd.st||0)+dt*700*QUAL();
      for(;dd.st>=1;dd.st--){ const f=Math.pow(Math.random(),0.7)*R, b=rand(-0.25,0.25);
        psMid.emit(p.x+dir[0]*f-dir[2]*b*f*0.35,p.y+rand(-.25,.25)*(0.3+f*0.12),p.z+dir[2]*f+dir[0]*b*f*0.35,0,0,0,0.55,0.55,0.5,0.07,0,0); } }
  });
  schall(p,v=>tonGen({f:190,typ:'triangle',am:W/(2*Math.PI),amTiefe:0.85,dur:T,vol:0.03*v,an:0.3,ab:0.3}));
  later(T,()=>schall(p,v=>sfx.crackle(v*0.35)));
};

/* Regenring (Silberregen, L17): ein waagrechter Ring aus Titansilber
   steht am Himmel, und rundherum faellt senkrechter Regen in Silber-
   schnueren - eine Roehre aus Regen */
EFF.regenring=function(p,A,B,s){
  const zu=rkZuMir(p), qq=rkQuer(p,1), k=Math.tan(10*Math.PI/180);
  let nn=[zu[0]*k,1,zu[2]*k]; const m=Math.hypot(nn[0],nn[1],nn[2]); nn=[nn[0]/m,nn[1]/m,nn[2]/m];
  const u=qq, v=[nn[1]*u[2]-nn[2]*u[1],nn[2]*u[0]-nn[0]*u[2],nn[0]*u[1]-nn[1]*u[0]];
  const n=24, R=5*s, sil=A||FW.silber, w=B||FW.weiss, L=3.3, a0=rand(0,Math.PI*2);
  for(let i=0;i<n;i++){
    const a=a0+i/n*Math.PI*2, d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)], ph=rand(0,6);
    rkStern(psHuge,p,[0,0,0],rkMal(sil,1.3),L,(st,dt)=>{
      const t=st.alter, e=1-Math.exp(-t/0.13), sk=0.4*Math.max(0,t-0.5);
      st.p[0]=p.x+d[0]*R*e; st.p[1]=p.y+d[1]*R*e-sk; st.p[2]=p.z+d[2]*R*e; st.v[0]=st.v[1]=st.v[2]=0;
      st.hell=(t>L-0.35?(L-t)/0.35:1)*(0.9+0.2*Math.sin(t*13+ph));
      /* Silberschnur: alle paar Hundertstel ein Tropfen, senkrecht, kaum Drift */
      if(t>0.5&&t<3.0){ const dd=st.d; dd.tr=(dd.tr||0)+dt*18*QUAL();
        for(;dd.tr>=1;dd.tr--) rkSchweif(0.32,()=>psMid.emit(st.p[0]+rand(-.04,.04),st.p[1]-0.05,st.p[2]+rand(-.04,.04),rand(-.06,.06),-4,rand(-.06,.06),w[0]*1.2,w[1]*1.2,w[2]*1.25,rand(1.3,1.6),4.4,4)); }
    });
  }
  later(0.5,()=>schall(p,vv=>sfx.regen(vv*1.1,2.6)));
};

/* Glasbruch (Glasbruch, L18): eine klare, eisblaue Kristallkugel steht
   still - dann zerspringt jeder Stern klirrend in weisse Splitter */
EFF.glasbruch=function(p,A,B,s){
  const n=Math.round(92*QUAL()), R=5.2*s*0.8, eis=A||FW.himmel, weissl=[0.85,0.95,1];
  for(let i=0;i<n;i++){
    const d=randDir(), rr=R*rand(0.9,1.0), tz=rand(0.7,0.9), c=i%4?[0.45+eis[0]*0.6,0.5+eis[1]*0.55,0.55+eis[2]*0.5]:weissl;
    rkStern(psBig,p,[0,0,0],rkMal(c,1.2),tz,(st,dt)=>{
      const t=st.alter, e=1-Math.exp(-5*t);
      st.p[0]=p.x+d[0]*rr*e; st.p[1]=p.y+d[1]*rr*e-0.1*t; st.p[2]=p.z+d[2]*rr*e; st.v[0]=st.v[1]=st.v[2]=0;
      /* feiner Schimmer, kurz vor dem Bruch ein Zittern */
      st.hell=(0.85+0.25*Math.random())*(tz-t<0.08?1.6:1);
    },{ende:st=>{ const e=st.p, k=4+Math.floor(Math.random()*3);
      for(let j=0;j<k;j++){ const x=randDir(), w=rand(3,6), ph=rand(0,1);
        rkStern(psBig,{x:e[0],y:e[1],z:e[2]},[x[0]*w,x[1]*w,x[2]*w],[1.2,1.25,1.3],0.8,(sp,dt)=>{
          rkFlug(sp,dt,1.4,2.2); sp.hell=(((sp.alter*6+ph)%1)<0.5?1.8:0.1)*(1-sp.alter/0.8*0.5); },{spur:0}); } }});
  }
  later(0.7,()=>schall(p,v=>{ sfx.klirren(v*1.2); later(0.09,()=>sfx.klirren(v)); later(0.18,()=>sfx.klirren(v*0.7)); }));
};

/* Spektralkrone (Regenbogenkrone, L19): 14 dicke Kometen steigen als Krone
   schraeg nach oben und aussen, die Farben rundherum der Reihe nach von
   Rot bis Violett - kein bunter Ball, eine geordnete Krone */
EFF.spektralkrone=function(p,A,B,s){
  const li=rkQuer(p,-1), zu=rkZuMir(p), G=6.5;
  for(let k=0;k<14;k++){
    /* vordere Haelfte links -> rechts, hintere Haelfte gespiegelt: von vorn
       steht links Rot, in der Mitte Gruen, rechts Violett */
    const hinten=k>=7, j=k%7, be=Math.PI*(j+0.5)/7+rand(-.06,.06), sz=hinten?-1:1;
    const dh=[li[0]*Math.cos(be)+zu[0]*Math.sin(be)*sz,0,li[2]*Math.cos(be)+zu[2]*Math.sin(be)*sz], el=rand(55,65)*Math.PI/180;
    const d=[dh[0]*Math.cos(el),Math.sin(el),dh[2]*Math.cos(el)], w=rand(12,14)*Math.sqrt(s), c=K(SPEKTRUM[j]), v0=[d[0]*w,d[1]*w,d[2]*w];
    rkSchweif(0.5,()=>{
      psHuge.emit(p.x,p.y,p.z,v0[0],v0[1],v0[2],c[0]*1.7,c[1]*1.7,c[2]*1.7,2.2,G,2,c[0]*1.4,c[1]*1.4,c[2]*1.4);
      for(let k=0;k<3;k++){ const e=streu(d,0.03), f=rand(0.88,0.98)*w; psBig.emit(p.x,p.y,p.z,e[0]*f,e[1]*f,e[2]*f,c[0]*1.4,c[1]*1.4,c[2]*1.4,2.2,G,2,c[0],c[1],c[2]); }
    });
    funkenSchweif(p,v0,G,1.6,2,[0.55+c[0]*0.45,0.55+c[1]*0.45,0.55+c[2]*0.45]);
    /* die Spitzen glitzern weiss, dann ist alles aus */
    imBild(1.6,()=>{ const q=bahnOrt(p,v0,G,1.6), vr=bahnTempo(v0,G,1.6);
      for(let i=0;i<Math.round(8*QUAL());i++) psBig.emit(q.x+rand(-.2,.2),q.y+rand(-.2,.2),q.z+rand(-.2,.2),vr[0]+rand(-.6,.6),vr[1]+rand(-.6,.6),vr[2]+rand(-.6,.6),1.4,1.4,1.4,0.6,G,4);
      psHuge.emit(q.x,q.y,q.z,vr[0],vr[1],vr[2],1.6,1.6,1.6,0.12,G,0); });
  }
  later(1.6,()=>schall(p,v=>sfx.rieseln(v,0.8)));
};

/* Mondfinsternis (Jumbo »Mondfinsternis«, L22): ein silberner Vollmond
   steht am Himmel, ein runder Schatten schiebt sich von links darueber,
   am letzten Rand blitzt der Diamantring, dann glueht der Blutmond.
   Den Mondkoerper zeichnet eine Scheibe zum Zuschauer (im Shader
   beschattet), die Sterne davor geben ihm Glanz und Kante. */
const RK_MOND_VS='varying vec2 vU; void main(){ vU=uv*2.0-1.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const RK_MOND_FS='uniform float cx,rs,hell,kupfer; uniform vec3 cA,cB; varying vec2 vU;\n'+
  'void main(){ float r=length(vU); if(r>1.0) discard;\n'+
  ' float m=0.78+0.22*sin(vU.x*6.1+1.3)*sin(vU.y*4.7+0.4)+0.08*sin(vU.x*13.0-vU.y*9.0);\n'+
  ' float kante=smoothstep(1.0,0.82,r); float sd=length(vU-vec2(cx,0.0))-rs; float sh=smoothstep(0.05,-0.05,sd);\n'+
  ' vec3 c=mix(cA*m,cB*(0.75+0.25*m)*kupfer,sh); gl_FragColor=vec4(c*kante*hell,1.0); }';
EFF.mondfinsternis=function(p,A,B,s){
  const q=QUAL(), [ri,ob]=rkBild(p), R=4.4*s, n=Math.round(300*q), sil=[0.92,0.95,1], kup=rkMal(B||FW.scharlach,0.6);
  const T1=1.2, TS=2.5, RS=1.1, TE=T1+TS, TB=TE+0.35, L=TB+1.5;
  const cx=t=>-2.3+2.3*clamp((t-T1)/TS,0,1);
  let mesh=null;
  try{ const mat=new THREE.ShaderMaterial({uniforms:{cx:{value:-3},rs:{value:RS},hell:{value:0},kupfer:{value:0},cA:{value:new THREE.Color(0.2,0.21,0.23)},cB:{value:new THREE.Color(kup[0]*0.45,kup[1]*0.45,kup[2]*0.45)}},
      vertexShader:RK_MOND_VS,fragmentShader:RK_MOND_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
    mesh=new THREE.Mesh(new THREE.PlaneGeometry(2*R,2*R),mat); mesh.position.set(p.x,p.y,p.z); mesh.lookAt(camera.position); scene.add(mesh);
    const g=mesh.geometry; later(L+0.3,()=>g.dispose()); }catch(e){ mesh=null; }
  const hof=rkHof();
  wolke(L,mesh?[mesh]:[],(w,t)=>{
    const auf=Math.min(1,t/0.5), aus=Math.max(0,t>TB?1-(t-TB)/1.5:1);
    if(mesh){ const U=mesh.material.uniforms; U.cx.value=cx(t); U.hell.value=auf*aus; U.kupfer.value=clamp((t-T1-0.3)/1.2,0,1); }
    const bed=clamp((t-T1)/TS,0,1), hc=mischF(sil,kup,bed);
    rkHofSetz(hof,[p.x,p.y,p.z],R*3.2,hc,0.16*auf*aus*(1-0.5*bed));
    if(t>=L-0.05) rkHofWeg(hof);
  });
  for(let i=0;i<n;i++){
    const d=randDir(), rr=R*(Math.random()<0.5?rand(0.93,1):Math.cbrt(Math.random())), x=(d[0]*ri[0]+d[1]*ri[1]+d[2]*ri[2])*rr/R, y=(d[0]*ob[0]+d[1]*ob[1]+d[2]*ob[2])*rr/R;
    const mar=0.8+0.2*Math.sin(x*6.1+1.3)*Math.sin(y*4.7+0.4), gr=i%5>=3, ps=gr?psHuge:psBig;
    rkStern(ps,p,[0,0,0],sil,L,(st,dt)=>{
      const t=st.alter, e=1-Math.exp(-5.5*t), dd=st.d;
      st.p[0]=p.x+d[0]*rr*e; st.p[1]=p.y+d[1]*rr*e; st.p[2]=p.z+d[2]*rr*e; st.v[0]=st.v[1]=st.v[2]=0;
      if(!dd.te&&t>T1&&Math.hypot(x-cx(t),y)<RS) dd.te=t;
      let h;
      if(!dd.te){ h=1.15*mar*(0.92+0.08*Math.random()); st.c=sil; }
      else { const u=t-dd.te; st.c=kup; h=u<0.2?0.05:Math.min(1,(u-0.2)/0.5)*(0.85+0.15*Math.sin(t*3+x*5)); }
      if(t>TB) h*=Math.max(0,1-(t-TB)/1.5);
      st.hell=h*(gr?0.75:1);
    });
  }
  flash(p,sil,10,1.0);
  /* Diamantring: am letzten hellen Rand rechts blitzt es auf */
  imBild(TE-0.2,()=>{ const qd={x:p.x+ri[0]*R*0.98,y:p.y+ri[1]*R*0.98,z:p.z+ri[2]*R*0.98};
    for(let i=0;i<3;i++) psHuge.emit(qd.x,qd.y,qd.z,0,0,0,2.2,2.2,2.3,0.15,0,0);
    for(let i=0;i<4;i++){ const a=i*Math.PI/2+0.4, dx=ri[0]*Math.cos(a)+ob[0]*Math.sin(a), dy=ri[1]*Math.cos(a)+ob[1]*Math.sin(a), dz=ri[2]*Math.cos(a)+ob[2]*Math.sin(a);
      rkSchweif(0.12,()=>psBig.emit(qd.x,qd.y,qd.z,dx*9,dy*9,dz*9,1.6,1.6,1.7,0.16,0,2,0.4,0.4,0.5)); }
    flash(qd,[1,1,1],4,0.15); });
};

/* Sternspuren (Jumbo »Polarstern«, L22): ein gleissender Polarstern, um
   ihn kreisen 40 Sterne auf konzentrischen Bahnen und ziehen Lichtboegen
   wie auf einer Langzeitbelichtung */
EFF.sternspuren=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.35), n=40, om=2*Math.PI*0.45, k=s/2.3, key='ss'+(++RK.n), hof=rkHof(), dreh=Math.random()<0.5?1:-1;
  const sil=FW.silber, him=B||FW.himmel;
  rkStern(psHuge,p,[0,0,0],[1.4,1.4,1.45],5,(st,dt)=>{
    const t=st.alter; st.p[0]=p.x; st.p[1]=p.y; st.p[2]=p.z;
    const h=(t<4.5?1:(5-t)/0.5)*(1.1+0.25*Math.sin(t*5.5));
    st.hell=h; licht(key,{x:p.x,y:p.y,z:p.z},[0.85,0.9,1],1.8*h,{weite:30});
    rkHofSetz(hof,[p.x,p.y,p.z],5.5,[0.8,0.85,1],0.32*h);
  },{ende:()=>rkHofWeg(hof)});
  for(let i=0;i<n;i++){
    const rr=(2+7*Math.pow(i/(n-1),0.9))*k*rand(0.97,1.03), a0=rand(0,Math.PI*2), c=i%2?sil:him, ct=[c[0]*0.75,c[1]*0.75,c[2]*0.8], L=4.9;
    rkStern(psBig,p,[0,0,0],rkMal(c,1.35),L,(st,dt)=>{
      const t=st.alter, dd=st.d;
      if(t<4.3){ const a=a0+dreh*om*Math.max(0,t-0.3), e=t<0.3?1-Math.pow(1-t/0.3,2):1, ca=Math.cos(a), sa=Math.sin(a);
        st.p[0]=p.x+(u[0]*ca+v[0]*sa)*rr*e; st.p[1]=p.y+(u[1]*ca+v[1]*sa)*rr*e; st.p[2]=p.z+(u[2]*ca+v[2]*sa)*rr*e;
        const w=dreh*om*rr; dd.vt=[(-u[0]*sa+v[0]*ca)*w,(-u[1]*sa+v[1]*ca)*w,(-u[2]*sa+v[2]*ca)*w]; st.hell=1; }
      else { /* die Sterne loesen sich tangential und verloeschen */
        const vt=dd.vt; for(let j=0;j<3;j++){ vt[j]*=Math.exp(-1.5*dt); st.p[j]+=vt[j]*dt; } st.hell=Math.max(0,1-(t-4.3)/0.6); }
      st.v[0]=st.v[1]=st.v[2]=0;
      /* Lichtbogen: die Spur bleibt ohne Schwerkraft stehen */
      if(t>0.3&&t<4.4) rkSpur(st,dt,12*rr/k,(x,y,z)=>psMid.emit(x,y,z,0,0,0,ct[0],ct[1],ct[2],1.1,0,2,ct[0]*0.3,ct[1]*0.3,ct[2]*0.35));
      else dd.lp=st.p.slice();
    });
  }
  schall(p,vv=>tonGen({f:3520,dur:4.2,vol:0.006*vv,vib:{hz:6,cent:18},an:0.6,ab:1.2}));
};

/* Drachenschwinge (Jumbo »Feuerdrache«, L24): Feuerball, zwei riesige
   Fluegel aus roten Kometen mit Goldschweif, EIN Fluegelschlag, dann
   zerfaellt alles zu glimmender, taumelnder Asche */
EFF.drachenschwinge=function(p,A,B,s){
  const [ri,ob]=rkBild(p), zu=rkZuMir(p), rot=A||FW.rot, gold=B||FW.gold, or=FW.orange, W=Math.sqrt(s)*0.95, q=QUAL();
  /* kurzer Feuerball */
  for(let i=0;i<Math.round(16*q);i++){ const d=randDir(), w=rand(0.5,2.5); psHuge.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,or[0]*1.4,or[1]*1.3,or[2],rand(0.22,0.34),0,0); }
  rauchball(p,{r:2.6*W,n:5,dauer:0.9,quellen:0.25,steigen:0.6,leuchten:true,c:[1,0.45,0.12],a:0.45});
  flash(p,or,7,0.45);
  for(const sd of [-1,1]) for(let k=0;k<24;k++){
    const e=k/23, ang=-0.2+e*0.72+rand(-.04,.04), sp=(9+e*2.4+rand(-.35,.35))*W, dz=rand(-0.14,0.14);
    const d=[ri[0]*sd*Math.cos(ang)+ob[0]*Math.sin(ang)+zu[0]*dz,ri[1]*sd*Math.cos(ang)+ob[1]*Math.sin(ang),ri[2]*sd*Math.cos(ang)+ob[2]*Math.sin(ang)+zu[2]*dz];
    const L=1.3+rand(0,0.15);
    rkStern(psHuge,p,[d[0]*sp,d[1]*sp,d[2]*sp],rkMal(rot,1.5),L,(st,dt)=>{
      const t=st.alter;
      /* der Fluegelschlag: 0,3 s lang zusammen 6 m/s nach unten */
      if(t>=0.7&&t<1.0) st.v[1]-=20*dt;
      rkFlug(st,dt,1.0,1.4);
      st.hell=t<0.12?t/0.12:1;
      rkSpur(st,dt,48,(x,y,z)=>psMid.emit(x,y,z,rand(-.3,.3),rand(-.9,0),rand(-.3,.3),gold[0]*1.2,gold[1]*1.1,gold[2]*0.8,rand(0.45,0.8),2.4,4));
    },{spur:0.3,ende:st=>{ const e=st.p;
      /* Asche: fuenf dunkelrote Funken taumeln langsam herab und flackern */
      for(let j=0;j<5;j++){ const x=randDir();
        haengen(psMid,e[0],e[1],e[2],x[0]*1.2,x[1]*0.8+0.4,x[2]*1.2,[0.85,0.12,0.04],rand(2.6,3.2),{g:2,k:5,sink:rand(0.35,0.6),pendel:{amp:rand(0.25,0.5),hz:rand(0.5,0.9),achse:[Math.random()-0.5,Math.random()-0.5]},flacker:3.2}); } }});
  }
  schall(p,v=>sfx.bruellen(v*1.1));
  later(0.7,()=>schall(p,v=>sfx.wumms(v*0.9)));
};

/* Supernova (Jumbo »Supernova«, L25): ein Sternring stuerzt nach innen,
   der hellste Blitz im Spiel, eine Schockwellen-Schale, dahinter ein
   violett-roter Gasnebel mit pulsierendem Pulsar */
EFF.supernova=function(p,A,B,s){
  const [u,v]=basisBlick(p,0.25), R=3.4*s, vio=A||FW.violett, hb=B||FW.himmel, bw=[0.55+hb[0]*0.45,0.6+hb[1]*0.4,1], q=QUAL(), TI=0.4, key='sn'+(++RK.n);
  /* 1: Implosion */
  for(let i=0;i<40;i++){ const a=i/40*Math.PI*2, d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
    rkStern(psHuge,p,[0,0,0],rkMal(vio,1.5),TI,(st,dt)=>{ const t=st.alter, f=1-Math.pow(Math.min(1,t/TI),1.7);
      st.p[0]=p.x+d[0]*R*f; st.p[1]=p.y+d[1]*R*f; st.p[2]=p.z+d[2]*R*f; st.v[0]=st.v[1]=st.v[2]=0; st.hell=Math.min(1,t/0.08)*(0.8+t);
      rkSpur(st,dt,60,(x,y,z)=>psMid.emit(x,y,z,0,0,0,vio[0]*0.8,vio[1]*0.8,vio[2]*0.9,0.18,0,0)); }); }
  imBild(TI,()=>{
    /* 2: der hellste Blitz im Spiel */
    flash(p,[1,1,1],25,0.5); if(typeof bildBlitz==='function') bildBlitz(0.5*Math.min(1,distVol(p))+0.15,0.7);
    for(let i=0;i<8;i++) psHuge.emit(p.x,p.y,p.z,rand(-.5,.5),rand(-.5,.5),rand(-.5,.5),3,3,3,0.2+i*0.03,0,0);
    schall(p,vv=>{ sfx.boom(Math.min(2.2,vv*2)); sfx.crack(vv*1.3); later(0.25,()=>{ if(typeof grollen==='function') grollen(3.5,0.8*vv,70,0.2); }); shake=Math.max(shake,Math.min(1.2,1.2*vv)); });
    /* 3: Schockwelle - duenne, schnelle Kugelschale */
    rkSchweif(0.1,()=>{ for(let i=0;i<Math.round(250*q);i++){ const d=randDir(), w=rand(18,20)*s/2.5;
      psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,bw[0]*1.6,bw[1]*1.6,bw[2]*1.7,1.0,0.3,2,bw[0]*0.4,bw[1]*0.5,bw[2]*0.7); } });
  });
  /* 4: Gasnebel und Pulsar */
  imBild(0.6,()=>{
    const rotv=[0.9,0.2,0.35];
    for(let i=0;i<Math.round(120*q);i++){ const d=randDir(), w=rand(3,6.5)*s/2.5, c=i%2?vio:rotv;
      psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0]*0.55,c[1]*0.55,c[2]*0.6,rand(4.4,5.0),0.05,2,c[0]*0.12,c[1]*0.1,c[2]*0.15); }
    rauchball(p,{r:6.5*s/2.5,n:10,dauer:5,quellen:4.5,steigen:0.05,wind:[0.05,0],leuchten:true,a:0.32,farbe:t=>mischF([0.7,0.25,0.95],[0.55,0.1,0.25],clamp(t/5,0,1))});
    const hof=rkHof();
    rkStern(psHuge,p,[0,0,0],[1.3,1.35,1.5],4.9,(st,dt)=>{ const t=st.alter+0.6; st.p[0]=p.x; st.p[1]=p.y; st.p[2]=p.z;
      /* vier Pulse, einer je Sekunde */
      const ph=(t-1.4)%1, puls=t>=1.4&&t<5.4&&ph<0.14; st.hell=puls?2.4:0.22;
      rkHofSetz(hof,[p.x,p.y,p.z],puls?7:3,[0.7,0.8,1],puls?0.5:0.08);
      if(puls) licht(key,{x:p.x,y:p.y,z:p.z},[0.75,0.85,1],2.4,{weite:40});
      if(puls&&!st.d.pl){ st.d.pl=true; schall(p,vv=>tone(1800,0.05,'sine',0.05*vv)); } if(!puls) st.d.pl=false;
    },{ende:()=>rkHofWeg(hof)});
  });
};

/* ---------------------------------------------------------
   Die Raketen (katalog-raketen.md). Jede: eigener Aufstieg (steig),
   eigener Bruch (eff), sz und pw steigen mit dem Level.
   dauer: so lange steht die Rakete auf der Rampe (brennDauer).
   --------------------------------------------------------- */
Object.assign(RAKETEN_KL,{
  glueckrakete   :{n:1,gap:0,sz:0.85,pw:-6, fuse:1.2, steig:'gold',     eff:['fallschirm'],farbRotation:['rot','gruen','zitrone','himmel','weiss'],knall:'plopp',bruchOpt:{kern:false,nachglitzer:false,flash:0.2},dauer:10},
  raketenklein   :{n:1,gap:0,sz:0.88,pw:-5, fuse:1.25,steig:'keiner',   A:'silber',B:'himmel',eff:['schnuppe'],knall:'rakPff',bruchOpt:{kern:false,nachglitzer:false,flash:false},dauer:3.6},
  glitzerraketen :{n:1,gap:0,sz:0.92,pw:-4, fuse:1.2, steig:'tremolant',A:'limette',B:'gold',eff:['garbe'],knall:'rakPuff',bruchOpt:{kern:false,nachglitzer:false,flash:0.35},dauer:4.2},
  blanko         :{n:1,gap:0,sz:0.95,pw:-3.5,fuse:1.2,steig:'silber',   th:'gold',eff:['goldglitzer'],dauer:4.5},
  gravur         :{n:1,gap:0,sz:0.98,pw:-3, fuse:1.25,steig:'schleife', A:'gold',B:'rose',eff:['initiale'],bruchOpt:{kern:false,nachglitzer:false,flash:0.5},dauer:4.8},
  raketen        :{n:1,gap:0,sz:1.0, pw:-3, fuse:1.25,steig:'zickzack', th:'tropen',eff:['hakenschlag'],bruchOpt:{nachglitzer:false},dauer:3.6},
  silberpfeil    :{n:1,gap:0,sz:1.02,pw:-2.5,fuse:0.95,steig:'pfeil',   A:'weiss',B:'silber',eff:['laserstern'],bruchOpt:{nachglitzer:false,flash:1.3},dauer:3},
  kometenraketen :{n:1,gap:0,sz:1.05,pw:-2, fuse:1.3, steig:'komet',    A:'gold',B:'blau',eff:['kometenkette'],bruchOpt:{kern:false,nachglitzer:false,flash:0.4},dauer:4.6},
  pfeifraketen   :{n:1,gap:0,sz:1.05,pw:-2, fuse:1.3, steig:'pfeif',    pfeif:true,A:'rot',B:'orange',eff:['pfeifsterne'],dauer:3.8},
  farbenrausch   :{n:1,gap:0,sz:1.1, pw:-1, fuse:1.25,steig:'farbspur', A:'magenta',B:'limette',eff:['halbhalb'],bruchOpt:{nachglitzer:false},dauer:4.4},
  raketengold    :{n:1,gap:0,sz:1.3, pw:0.8,fuse:1.3, steig:'brokat',   th:'koenig',dick:1,eff:['nishiki'],dauer:5},
  knisterstern   :{n:1,gap:0,sz:1.34,pw:1.2,fuse:1.25,steig:'knister',  A:'silber',B:'gold',eff:['spaetzuender'],knall:'rakPff',bruchOpt:{kern:false,nachglitzer:false,flash:0.15},dauer:5.6},
  smaragd        :{n:1,gap:0,sz:1.38,pw:1.6,fuse:1.3, steig:'wirbel',   trail:'gruen',A:'gruen',B:'mint',eff:['achtblatt'],bruchOpt:{nachglitzer:false,flash:0.35},dauer:4.4},
  blinkstern     :{n:1,gap:0,sz:1.42,pw:2.2,fuse:1.3, steig:'blink',    A:'weiss',B:'rot',eff:['leuchtturm'],bruchOpt:{kern:false,nachglitzer:false},dauer:5.8},
  silberregen    :{n:1,gap:0,sz:1.46,pw:3,  fuse:1.3, steig:'rieselschweif',A:'silber',B:'weiss',dick:1,eff:['regenring'],bruchOpt:{kern:false,nachglitzer:false},dauer:6},
  kristall       :{n:1,gap:0,sz:1.5, pw:3.5,fuse:1.3, steig:'glasklang',A:'himmel',B:'weiss',dick:1,eff:['glasbruch'],bruchOpt:{nachglitzer:false},dauer:4.2},
  /* Furzrakete »Donnerbalken«: normaler Raketenweg, der Witz steckt im
     Aufstieg - sie setzt dreimal aus und pupst sich weiter */
  furzrakete     :{n:1,gap:0,sz:1.55,pw:4.2,fuse:1.6, steig:'stotter',  A:'braun',B:'sumpf',eff:['furz'],knall:'furz',bruchOpt:{kern:false,nachglitzer:false}},
  regenbogenkrone:{n:1,gap:0,sz:1.65,pw:4.6,fuse:1.35,steig:'spektralschweif',dick:2,eff:['spektralkrone'],bruchOpt:{kern:false,nachglitzer:false},dauer:4.8},
  titanraketen   :{n:1,gap:0,sz:1.75,pw:5.5,fuse:1.35,steig:'ratter',   th:'eis',dick:1,eff:['titan'],dauer:5},
  jumbogold      :{n:1,gap:0,sz:2.2, pw:8,  fuse:1.4, steig:'glut',     th:'koenig',dick:2,trail:'bernstein',eff:['sternpalme'],dauer:6},
  silbermond     :{n:1,gap:0,sz:2.25,pw:9,  fuse:1.4, steig:'titanspur',A:'silber',B:'scharlach',dick:2,eff:['mondfinsternis'],knall:'rakTief',bruchOpt:{nachglitzer:false},dauer:8.5},
  jumboleiter    :{n:1,gap:0,sz:2.3, pw:10, fuse:1.45,steig:'perlenschnur',A:'weiss',B:'himmel',dick:2,eff:['sternspuren'],bruchOpt:{kern:false,nachglitzer:false},dauer:7.5},
  feuerdrache    :{n:1,gap:0,sz:2.4, pw:11, fuse:1.4, steig:'drachenschweif',A:'rot',B:'gold',dick:2,trail:'orange',eff:['drachenschwinge'],bruchOpt:{nachglitzer:false},dauer:7},
  supernova      :{n:1,gap:0,sz:2.5, pw:12, fuse:1.45,steig:'zweistufe',A:'violett',B:'himmel',dick:2,eff:['supernova'],knall:'ansaugen',bruchOpt:{kern:false,nachglitzer:false,flash:false},dauer:8}
});
/* Schweiflaenge der Bruchsterne, wenn der Bruch sie nicht selbst setzt */
Object.assign(EFF_SCHWEIF,{fallschirm:0,schnuppe:0,garbe:0.2,initiale:0,hakenschlag:0,laserstern:0.25,kometenkette:0,halbhalb:0.3,spaetzuender:0,
  achtblatt:0.3,leuchtturm:0,regenring:0,glasbruch:0,spektralkrone:0.5,mondfinsternis:0,sternspuren:0,drachenschwinge:0.3,supernova:0});

/* Signaturen: Bruch und Aufstieg, beide nur bei dieser Rakete */
Object.assign(SIGNATUR,{
  glueckrakete   :{eff:'fallschirm',steig:'gold',text:'Ein einzelnes Licht haengt am Fallschirm, sinkt acht Sekunden pendelnd und faerbt den Boden.'},
  raketenklein   :{eff:'schnuppe',steig:'keiner',text:'Dunkler Aufstieg, dann zieht eine einzige Sternschnuppe fast waagrecht quer ueber den Himmel.'},
  glitzerraketen :{eff:'garbe',steig:'tremolant',text:'Glitzernder Aufstieg, oben eine Garbe, die weiter steigt und wie ein Springbrunnen in Boegen faellt.'},
  blanko         :{eff:'goldglitzer',steig:'silber',text:'Das unbeschriebene Blatt: schlichter Silberschweif, Goldglitzer mit haengenden Glitzervorhaengen.'},
  gravur         :{eff:'initiale',steig:'schleife',text:'Die Initialen der Gravur stehen in Gold am Himmel, getragen von einem Geschenkband aus zwei Schweifen.'},
  raketen        :{eff:'hakenschlag',steig:'zickzack',text:'Schlaegt schon beim Steigen Haken; oben fluechten dicke Farbsterne mit zwei harten Richtungswechseln.'},
  silberpfeil    :{eff:'laserstern',steig:'pfeil',text:'Startknall, doppelt so schnell, oben zwoelf Laserstriche, die in voller Fahrt verloeschen.'},
  kometenraketen :{eff:'kometenkette',steig:'komet',text:'Der Kometenkern zerbricht in eine Kette aus sieben Stuecken, die hintereinander weiterziehen.'},
  pfeifraketen   :{eff:'pfeifsterne',steig:'pfeif',text:'Pfeift im Steigen und im Bruch: rote Korkenzieher schrauben sich auseinander und knacken zum Schluss.'},
  farbenrausch   :{eff:'halbhalb',steig:'farbspur',text:'Genau halb Magenta, halb Limette mit scharfer Grenze - dann tauschen die Haelften.'},
  raketengold    :{eff:'nishiki',steig:'brokat',text:'Flimmernder Brokat-Aufstieg, Goldkugel mit violetten und roten Spitzen.'},
  knisterstern   :{eff:'spaetzuender',steig:'knister',text:'Scheinbruch wie ein Blindgaenger, Stille - dann eine riesige Knisterwand.'},
  smaragd        :{eff:'achtblatt',steig:'wirbel',text:'Gruener Wirbel, oben acht Strahlenbuendel in drei Gruentoenen - geschliffen wie ein Smaragd.'},
  blinkstern     :{eff:'leuchtturm',steig:'blink',text:'Ein Lichtkegel dreht sich durch eine Kugel aus dunklen Blinkern, in der Mitte die rote Laterne.'},
  silberregen    :{eff:'regenring',steig:'rieselschweif',text:'Ein waagrechter Silberring, von dem senkrechter Regen faellt - eine Roehre aus Silberschnueren.'},
  kristall       :{eff:'glasbruch',steig:'glasklang',text:'Singt wie ein Weinglas; die Kristallkugel steht still und zerspringt klirrend in Splitter.'},
  furzrakete     :{eff:'furz',steig:'stotter',text:'Kommt nur muehsam hoch: dreimal geht ihr die Luft aus, dreimal hilft ein Pups nach.'},
  regenbogenkrone:{eff:'spektralkrone',steig:'spektralschweif',text:'Eine Krone, deren sieben Farben der Reihe nach rundherum stehen; der Aufstieg malt das Spektrum.'},
  titanraketen   :{eff:'titan',steig:'ratter',text:'Kreischend-ratternder Aufstieg, oben ein harter Schlag in eine riesige Silberkugel.'},
  jumbogold      :{eff:'sternpalme',steig:'glut',text:'Ein Glutstamm waechst hoch, oben eine Goldpalme mit einem Juwel an jeder Spitze.'},
  silbermond     :{eff:'mondfinsternis',steig:'titanspur',text:'Ein Vollmond aus Silber, ueber den sich der Schatten schiebt, bis ein kupferroter Blutmond glueht.'},
  jumboleiter    :{eff:'sternspuren',steig:'perlenschnur',text:'Eine Leiter aus Lichtperlen, oben der Polarstern mit kreisenden Sternspuren.'},
  feuerdrache    :{eff:'drachenschwinge',steig:'drachenschweif',text:'Ein Feuerdrache windet sich hoch, breitet zwei Flammenfluegel aus, schlaegt einmal und zerfaellt zu Asche.'},
  supernova      :{eff:'supernova',steig:'zweistufe',text:'Zweistufig; oben stuerzt ein Stern in sich zusammen: Blitz, Schockwelle, Nebel, Pulsar.'}
});

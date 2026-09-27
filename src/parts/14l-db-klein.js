/* =========================================================
   Kleinfeuerwerk und Boeller
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Drehbuecher KLEIN.<id> nach katalog-klein.md, Verteiler
   kleinZuenden(t,o,it) (igniteType fragt ihn vor der neuen Ware).
   Jede Phase ist ein Emitter NEU_EMIT[k] mit allen Phasenfeldern;
   auch einmalige Ablaeufe (Wurf, Krone, Kette) laufen als Emitter,
   damit sie Zustand, Meshes und Klang selbst pflegen.
   Leitlinie: ein Material, eine Bewegung, ein Produkt.
   ========================================================= */
const KLEIN={};
/* ---------------------------------------------------------
   Gemeinsame Helfer
   --------------------------------------------------------- */
const klF=(x,f)=>farbe(x)||f||FW.gold;
const klFarbe3=(r,g,b)=>new THREE.Color().setRGB(r,g,b);
const klMisch=(a,b,u)=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];
/* Grundhelligkeit fuer Dinge, die nicht selbst leuchten (Papier,
   Spielzeug, Rauch): nachts gedaempft, am Tag voll */
function klHell(){ return typeof sun!=='undefined'&&sun?clamp(0.2+0.5*sun.intensity,0.2,1):1; }
/* Zuendtisch: Platte 2,5 x 1,05 m, Oberkante 0,93 m */
const KL_TI={x:STATION_POS.tisch.x,z:STATION_POS.tisch.z,y:0.93,hx:1.25,hz:0.52};
function klGrund(x,z){ return Math.abs(x-KL_TI.x)<=KL_TI.hx&&Math.abs(z-KL_TI.z)<=KL_TI.hz?KL_TI.y:0; }
/* Flaeche, auf der das Produkt steht (o ist seine Oberkante) */
function klFlaeche(o){ const g=klGrund(o.x,o.z); return o.y>=g-0.01?g:(o.y||0); }
/* Bodenstueck vor dem Tisch (zum Pult hin): da laufen Frosch, Flitzer
   und Kette - hinter dem Tisch saehe man vom Pult aus nichts */
function klVorne(o,dz){ const s=klFlaeche(o); return s>0.5?{x:o.x,y:0,z:o.z+(dz||1.1)}:{x:o.x,y:s,z:o.z}; }
function klMesh(e,m){ scene.add(m); (e.meshes=e.meshes||[]).push(m); return m; }
function klWeg(e){
  if(e.meshes) for(const m of e.meshes){ scene.remove(m); if(m.geometry&&!m.userData.geoFest) m.geometry.dispose(); }
  e.meshes=null;
  if(e.toene) for(const h of e.toene) if(h) try{ h.stop(); }catch(x){}
  e.toene=null;
}
function klTon(e,h){ (e.toene=e.toene||[]).push(h); return h; }
/* Materialien einmal anlegen */
const KL_MAT={};
function klMat(k,f){ return KL_MAT[k]||(KL_MAT[k]=f()); }
/* Emitter mit Aufraeumen: fn(e,dt,o,t) laeuft je Bild, t = Alter */
function klEmit(k,fn){
  NEU_EMIT[k]=(e,dt,o)=>{
    if(e.alter===undefined){ e.alter=0; e.nr=e.nr||0;
      /* Sicherheit: auch wenn der Emitter von aussen geloescht wird, verschwinden Meshes und Toene */
      const ee=e; later(Math.max(e.t,1)+60,()=>klWeg(ee)); }
    e.alter+=dt;
    try{ fn(e,dt,o,e.alter); }catch(x){ e.t=0; if(typeof console!=='undefined') console.warn('klein '+k,x); }
    if(e.t<=0) klWeg(e);
  };
}
/* Zuendschnur-Glimmen am Produkt */
function klLunte(o,s){ if(s>0) emitters.push({t:s,k:'fuse',o}); }

/* ---------------------------------------------------------
   Verteiler (katalog-klein.md, Format fuer Kleinfeuerwerk)
   --------------------------------------------------------- */
const KLEIN_ALT={};
function kleinZuenden(t,o,it){
  const K=KLEIN[t]; if(!K) return false;
  const lu=K.lunte||0; klLunte(o,lu);
  K.phasen.forEach((ph,pi)=>{
    const liste=ph.folge?ph.folge.map((f,i)=>Object.assign({},ph,f,{folge:null,nr:i,anzahl:ph.folge.length})):[ph];
    liste.forEach(q=>later(lu+(q.at||0),()=>{
      if(q.k==='alt'){ KLEIN_ALT[q.fn](o,t); return; }
      const e=Object.assign({},q,{k:q.k,o:{x:o.x+(q.x||0),y:o.y,z:o.z+(q.z||0)},t:typeof q.t==='number'?q.t:K.dauer,tt:q.t,prod:t,pi,rest:K.rest});
      /* Farben: Namen -> RGB (A, B), Listen bleiben Namen */
      if(typeof q.A==='string') e.A=klF(q.A); if(typeof q.B==='string') e.B=klF(q.B);
      emitters.push(e);
    }));
  });
  return true;
}
function kleinDauer(t){ const K=KLEIN[t]; return K?K.dauer+(K.lunte||0)+0.5:0; }

/* ---------------------------------------------------------
   Papier im Flug: Konfetti, Fetzen - flache Blaettchen, die taumeln
   (Helligkeit wechselt mit dem Kippwinkel), stark gebremst sinken und
   am Boden als bodenrest liegen bleiben. Ein InstancedMesh fuer alles.
   --------------------------------------------------------- */
const KL_PAP={max:COARSE?500:1400,liste:[],mesh:null};
function klPapierMesh(){
  if(KL_PAP.mesh) return KL_PAP.mesh;
  const g=new THREE.PlaneGeometry(1,1);
  const m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide,toneMapped:false}),KL_PAP.max);
  m.count=0; m.frustumCulled=false; if(m.setColorAt) m.setColorAt(0,klFarbe3(1,1,1)); scene.add(m); KL_PAP.mesh=m;
  return m;
}
/* ein Blatt: p Ort, v Tempo, c Farbe, o = {gr:[b,h], sink, art, dauer, flatter} */
function klPapier(p,v,c,o){
  o=o||{}; if(KL_PAP.liste.length>=KL_PAP.max*QUAL()) return;
  klPapierMesh();
  const ax=randDir(), gr=o.gr||[0.015,0.02];
  KL_PAP.liste.push({x:p.x,y:p.y,z:p.z,vx:v[0],vy:v[1],vz:v[2],c,ax,w:rand(0,6),wd:rand(6,16)*(Math.random()<0.5?-1:1),
    b:gr[0],h:gr[1],sink:o.sink||rand(0.6,0.9),art:o.art||'konfetti',dauer:o.dauer||25,
    fl:o.flatter!==undefined?o.flatter:0.35,ph:rand(0,6),alter:0});
  if(!KL_PAP.e||KL_PAP.e.t<=0){ KL_PAP.e={t:1,k:'papierflug',o:PAD}; emitters.push(KL_PAP.e); }
}
const _klQ=new THREE.Quaternion(), _klM=new THREE.Matrix4(), _klV=new THREE.Vector3(), _klS=new THREE.Vector3(), _klA=new THREE.Vector3(), _klC=new THREE.Color();
NEU_EMIT.papierflug=(e,dt)=>{
  const L=KL_PAP.liste, m=KL_PAP.mesh; if(!m) return;
  const H=klHell(); let n=0, tot=false;
  for(let i=0;i<L.length;i++){ const s=L[i];
    s.alter+=dt; const f=Math.exp(-3.2*dt);
    s.vx*=f; s.vz*=f; s.vy=s.vy>0?s.vy*Math.exp(-2.2*dt)-9.8*dt:Math.max(s.vy-9.8*dt,-s.sink);
    const fl=s.vy<0?s.fl:0;
    s.x+=(s.vx+Math.sin(s.alter*2.3+s.ph)*fl)*dt; s.y+=s.vy*dt; s.z+=(s.vz+Math.cos(s.alter*1.9+s.ph)*fl)*dt; s.w+=s.wd*dt;
    const g=klGrund(s.x,s.z);
    if(s.y<=g){ bodenrest(s.art,s.x,g,s.z,{c:s.c,dauer:s.dauer}); s.tot=tot=true; continue; }
    _klA.set(s.ax[0],s.ax[1],s.ax[2]); _klQ.setFromAxisAngle(_klA,s.w);
    _klM.compose(_klV.set(s.x,s.y,s.z),_klQ,_klS.set(s.b,s.h,1)); m.setMatrixAt(n,_klM);
    /* Folienglanz: je nach Kippwinkel dunkel oder ein kurzes helles Aufblitzen */
    const cw=Math.abs(Math.cos(s.w)), k=H*(0.4+0.8*cw)+1.4*Math.pow(cw,12);
    if(m.setColorAt) m.setColorAt(n,_klC.setRGB(s.c[0]*k,s.c[1]*k,s.c[2]*k)); n++; }
  if(tot) KL_PAP.liste=L.filter(s=>!s.tot);
  m.count=n; m.instanceMatrix.needsUpdate=true; if(m.instanceColor) m.instanceColor.needsUpdate=true; m.visible=n>0;
  e.t=KL_PAP.liste.length?1:0;
};

/* Konfetti-Farben ohne Zufallsbunt: feste Reihe */
const KL_BUNT=['rot','gold','gruen','blau','magenta','tuerkis','zitrone'];

/* ---------------------------------------------------------
   Wunderkerzen: Draht, wandernde Glutfront, Funken je Material
   (eisen = Gold mit Verzweigung, titan = Silberregen, farbspitze =
   Goldfunke mit hart umschlagender Farbspitze)
   --------------------------------------------------------- */
function klDraht(e,pkt){
  /* Linienzug als LineSegments (Punkte doppelt); Farbe je Punkt in
     l.userData.col, Lage in l.userData.pos - klDrahtAuf schreibt beides */
  const n=pkt.length, pos=new Float32Array(n*3), col=new Float32Array(n*3), m=Math.max(1,n-1);
  pkt.forEach((p,i)=>{ pos[i*3]=p[0]; pos[i*3+1]=p[1]; pos[i*3+2]=p[2]; });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(m*6),3)); g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(m*6),3));
  const l=new THREE.LineSegments(g,klMat('draht',()=>new THREE.LineBasicMaterial({vertexColors:true,toneMapped:false,fog:false})));
  l.frustumCulled=false; l.userData.pos=pos; l.userData.col=col; l.userData.n=n; klMesh(e,l); klDrahtAuf(l,true); return l;
}
function klDrahtAuf(l,lage){
  const u=l.userData, n=u.n, a=l.geometry.attributes, C=a.color.array, P=a.position.array;
  for(let i=0;i<n-1;i++){ for(let c=0;c<3;c++){ C[i*6+c]=u.col[i*3+c]; C[i*6+3+c]=u.col[i*3+3+c]; if(lage){ P[i*6+c]=u.pos[i*3+c]; P[i*6+3+c]=u.pos[i*3+3+c]; } } }
  a.color.needsUpdate=true; if(lage) a.position.needsUpdate=true;
}
/* Farbe eines Drahtpunkts: alter = Zeit seit dem Abbrennen (<0: noch nicht) */
function klDrahtFarbe(col,i,alter,glut,nachglut,H,nah){
  let r,g,b;
  if(alter<0){ const k=0.3*H+0.12+0.9*nah; r=0.62*k; g=0.6*k; b=0.56*k; }
  else if(alter<nachglut){ const u=1-alter/nachglut, k=Math.pow(u,1.4); r=glut[0]*k+0.05; g=glut[1]*k+0.045; b=glut[2]*k+0.04; }
  else { r=0.1*H+0.09; g=0.095*H+0.085; b=0.09*H+0.08; }
  col[i*3]=r; col[i*3+1]=g; col[i*3+2]=b;
}
/* Funken an einem Punkt p (Rate je s), Material m; z = Zaehler-Objekt */
function klKerzeFunken(p,dt,z,m,A,B,rate,o){
  o=o||{}; const q=QUAL(), alt=SCHWEIF;
  z.fa=(z.fa||0)+dt*rate*q;
  for(;z.fa>=1;z.fa--){
    const d=randDir(), x=p.x+d[0]*0.006, y=p.y+d[1]*0.006, zz=p.z+d[2]*0.006;
    /* Funken als duenne Striche (psMid mit kurzer Leuchtspur), der Kopf
       gedaempft - sonst wird aus jedem Funken ein Punkt statt eines Strichs */
    if(m==='titan'){
      const s=rand(2.4,4.2)*(o.weite?o.weite/2:1), c=Math.random()<0.7?A:B, l=rand(0.35,0.8), k=0.62;
      SCHWEIF=0.1;
      if(Math.random()<0.08) verzweig(psMid,x,y,zz,d[0]*s,d[1]*s+0.3,d[2]*s,[c[0]*k,c[1]*k,c[2]*k],l,4,{n:[2,3],ps2:psMid,spur:0.06});
      else psMid.emit(x,y,zz,d[0]*s,d[1]*s+0.3,d[2]*s,c[0]*k,c[1]*k,c[2]*k*1.05,l,4,0);
    } else if(m==='farbspitze'){
      /* Goldfunke, der im letzten Teil seines Lebens hart in B umschlaegt (+20 % hell) */
      const s=rand(1.1,2.3), l=rand(0.3,0.55), sp=o.spitze||0.3, t1=l*(1-sp), v=[d[0]*s,d[1]*s+0.3,d[2]*s], P0={x,y,z:zz};
      SCHWEIF=0.07; psMid.emit(x,y,zz,v[0],v[1],v[2],A[0]*0.55,A[1]*0.55,A[2]*0.55,t1,1.5,0);
      imBild(t1,()=>{ const pp=bahnOrt(P0,v,1.5,t1), w=bahnTempo(v,1.5,t1), a=SCHWEIF; SCHWEIF=0.1;
        psMid.emit(pp.x,pp.y,pp.z,w[0],w[1],w[2],B[0]*0.62,B[1]*0.62,B[2]*0.62,l-t1+0.04,1.5,0); SCHWEIF=a; });
    } else {
      const s=rand(1.0,2.4)*(o.tempo||1), c=Math.random()<0.78?A:B, l=rand(0.25,0.55), k=0.6, cc=[c[0]*k,c[1]*k,c[2]*k];
      if(Math.random()<0.45) verzweig(psMid,x,y,zz,d[0]*s,d[1]*s+0.3,d[2]*s,cc,l,1.5,{n:[2,3],tz:rand(0.08,0.15),spur:0.06,ps2:psMid,minTempo:1.0});
      else { SCHWEIF=0.07; psMid.emit(x,y,zz,d[0]*s,d[1]*s+0.3,d[2]*s,cc[0],cc[1],cc[2],l,1.5,0); }
    }
  }
  SCHWEIF=alt;
}
/* Glutpunkt mit Hof */
function klGlutpunkt(p,m,st){
  const alt=SCHWEIF; SCHWEIF=0; st=st||1;
  const c=m==='titan'?[1.8,1.8,1.9]:[1.7,1.45,1.0];
  psMid.emit(p.x,p.y,p.z,0,0,0,c[0]*st,c[1]*st,c[2]*st,0.05,0,0);
  const h=m==='titan'?[0.35,0.38,0.45]:[0.42,0.2,0.05];
  psBig.emit(p.x,p.y,p.z,0,0,0,h[0]*st,h[1]*st,h[2]*st,0.05,0,0);
  SCHWEIF=alt;
}
/* Glutperle: tropft von p, springt huepf-mal flach, spritzt, glimmt */
function klGlutperle(p,A,huepf,spritz,glimm){
  const g=9.8, boden=klGrund(p.x,p.z), v=[rand(-0.05,0.05),0,rand(-0.05,0.05)], alt=SCHWEIF;
  let t=0.02, q=p; for(;t<3;t+=0.02){ q=bahnOrt(p,v,g,t); if(q.y<=boden) break; }
  SCHWEIF=0.04; psMid.emit(p.x,p.y,p.z,v[0],v[1],v[2],A[0]*1.6,A[1]*1.4,A[2]*1.2,t,g,0); SCHWEIF=alt;
  imBild(t,()=>{ const a=SCHWEIF; SCHWEIF=0;
    for(let i=0;i<spritz;i++){ const d=randDir(), s=rand(0.8,1.8); psSmall.emit(q.x,boden+0.01,q.z,d[0]*s,Math.abs(d[1])*s+0.4,d[2]*s,1,0.7,0.25,rand(0.12,0.3),4,0); }
    let tt=0; for(let h=0;h<(huepf||0);h++){ const vy=1.4, dx=rand(-0.25,0.25), dz=rand(-0.25,0.25);
      psMid.emit(q.x,boden+0.01,q.z,dx,vy,dz,A[0]*1.3,A[1]*1.1,A[2],0.29,9.8,0); tt+=0.29; q={x:q.x+dx*0.27,y:boden,z:q.z+dz*0.27}; }
    const qq=q; imBild(tt,()=>{ psMid.emit(qq.x,boden+0.012,qq.z,0,0,0,A[0]*0.9,A[1]*0.5,A[2]*0.2,glimm||1.0,0,0); });
    SCHWEIF=a; if(Math.random()<0.6) schall(q,v2=>sfx.zischen(v2*0.4,0.25)); });
}
/* Eine Wunderkerze als Objekt (auch fuer den Funkenkranz) */
function klKerze(e,basis,o){
  /* basis: Fusspunkt; o: laenge, t, material, A, B, n, nachglut, endperle, glutperle, weite, dichte, spitze */
  const L=o.laenge||0.5, m=o.material||'eisen', N=24, pk=[];
  for(let i=0;i<=N;i++) pk.push([basis.x,basis.y+L*i/N,basis.z]);
  const K={L,m,draht:klDraht(e,pk),alter:0,T:o.t,aus:false,griff:Math.min(0.12,L*0.2),nach:o.nachglut===false?0.4:1.5,
    rate:(o.n||7)*60*(o.dichte||1)*(m==='titan'?0.8:1),glut:m==='titan'?[1,0.55,0.25]:[1,0.24,0.05]};
  /* Glutfront: vom oberen Ende bis zum Griff */
  K.front=()=>{ const u=clamp(K.alter/K.T,0,1), s=1-u*(1-K.griff/L); return {x:basis.x,y:basis.y+L*s,z:basis.z,s}; };
  K.schritt=(dt)=>{
    if(K.aus&&K.alter>K.T+K.nach+0.2) return;
    K.alter+=dt;
    const f=K.front(), brennt=K.alter<K.T, H=klHell();
    if(brennt){
      klGlutpunkt(f,m,m==='titan'?1.2:1);
      klKerzeFunken(f,dt,K,m,o.A,o.B||o.A,K.rate,o);
      if(o.licht!==false) licht('kz'+(o.key||'')+e.prod+(e.nr||0),f,m==='titan'?[0.9,0.92,1]:[1,0.72,0.35],m==='titan'?1.4:0.7,{weite:m==='titan'?7:4});
      if(o.glutperle){ K.gp=(K.gp===undefined?rand(o.glutperle.alle[0],o.glutperle.alle[1]):K.gp)-dt;
        if(K.gp<=0){ K.gp=rand(o.glutperle.alle[0],o.glutperle.alle[1]); klGlutperle({x:f.x,y:f.y-0.008,z:f.z},klF(o.glutperle.A,FW.orange),o.glutperle.huepf||0,o.glutperle.spritz||6); } }
    } else if(!K.aus){ K.aus=true;
      if(o.endperle) klGlutperle({x:f.x,y:f.y-0.005,z:f.z},FW.orange,0,5); }
    /* Draht faerben: grau, an der Front hell, dahinter Glut, dann Asche */
    const col=K.draht.userData.col;
    for(let i=0;i<=N;i++){ const s=i/N, tb=(1-s)/(1-K.griff/L)*K.T, al=s*L<K.griff?-1:K.alter-tb, nah=brennt?Math.exp(-Math.abs(s-f.s)*L/0.12):0;
      klDrahtFarbe(col,i,al,K.glut,K.nach,H,nah*0.5); }
    klDrahtAuf(K.draht);
  };
  return K;
}
/* Wunderkerze (wunder, wunderfarbe, wunderkerzeXXL, Mittelkerze der wunderbox) */
klEmit('wunderkerze',(e,dt,o,t)=>{
  if(!e.K){ e.T0=e.t; e.t=e.t+1.8+(e.endperle?1.2:0)+(e.glutperle?1.5:0);
    const sf=klFlaeche(o);
    e.K=klKerze(e,{x:o.x,y:Math.max(o.y,sf+0.02),z:o.z},{laenge:e.laenge,t:e.T0,material:e.material,A:e.A||FW.gold,B:e.B||e.A||FW.bernstein,n:e.n,
      nachglut:e.nachglut,endperle:e.endperle,glutperle:e.glutperle,weite:e.weite,dichte:e.dichte,spitze:e.spitze,key:'w'});
    if(e.aufflammen){ flash({x:o.x,y:o.y+e.laenge,z:o.z},FW.silber,1.6,0.3); schall(o,v=>sfx.zischen(v*0.8,0.5)); } }
  e.K.schritt(dt);
  if(t<e.T0){ e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=1.25; sfx.fizz(distVol(o)*(e.material==='titan'?0.75:0.3)); }
    if(e.material==='titan'){ e.kn=(e.kn||0)-dt; if(e.kn<=0){ e.kn=rand(0.8,2); sfx.crackle(distVol(o)*0.25); } } }
});

/* Varianten unter eigenem Namen (Material = eigener Effekt, katalog-klein
   "Materialien"): Farbspitze (wunderfarbe), Titan-Mittelkerze (wunderbox) */
NEU_EMIT.farbspitze=NEU_EMIT.wunderkerze; NEU_EMIT.titankerze=NEU_EMIT.wunderkerze;

/* ---------------------------------------------------------
   Formkerze: Draht auf einem 2D-Pfad (Herz, Ziffern), zur Kamera
   (Pult) gedreht. Fronten laufen den Pfad entlang, der abgebrannte
   Draht glueht nach - so steht die Form als Glutbild da.
   --------------------------------------------------------- */
function klBogen(cx,cy,rx,ry,a0,a1,n){ const r=[]; for(let i=0;i<=n;i++){ const a=a0+(a1-a0)*i/n; r.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]); } return r; }
/* Ziffern 0-9 als Linienzuege in Schreibrichtung (Hoehe 1, Breite 0,6) */
const KL_ZIFFER={
  '0':klBogen(0.3,0.5,0.28,0.5,Math.PI/2,Math.PI/2+Math.PI*2,28),
  '1':[[0.12,0.74],[0.36,1],[0.36,0]],
  '2':klBogen(0.3,0.72,0.28,0.27,Math.PI*0.9,-Math.PI*0.22,14).concat([[0.02,0],[0.6,0]]),
  '3':klBogen(0.3,0.75,0.26,0.25,Math.PI*0.85,-Math.PI/2,12).concat(klBogen(0.3,0.26,0.29,0.26,Math.PI/2,-Math.PI*0.85,14)),
  '4':[[0.46,0],[0.46,1],[0.02,0.32],[0.6,0.32]],
  '5':[[0.56,1],[0.1,1],[0.06,0.56]].concat(klBogen(0.3,0.32,0.28,0.32,Math.PI*0.72,-Math.PI*0.85,14)),
  '6':klBogen(0.32,0.62,0.28,0.38,Math.PI*0.3,Math.PI*1.1,10).concat(klBogen(0.3,0.3,0.28,0.3,Math.PI,Math.PI*3,20)),
  '7':[[0.02,1],[0.6,1],[0.2,0]],
  '8':klBogen(0.3,0.75,0.23,0.25,-Math.PI/2,Math.PI*1.5,16).concat(klBogen(0.3,0.26,0.28,0.26,Math.PI/2,-Math.PI*1.5,18)),
  '9':klBogen(0.3,0.7,0.28,0.3,0,Math.PI*2,20).concat(klBogen(0.28,0.38,0.3,0.38,0,-Math.PI*0.7,8))
};
/* Herz: x = 16 sin^3 t, y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t;
   zwei Haelften von der Spitze (t = pi) zur Kerbe (t = 0 bzw. 2 pi) */
function klHerzHaelfte(seite,n){ const r=[]; for(let i=0;i<=n;i++){ const t=Math.PI+seite*Math.PI*i/n;
  r.push([16*Math.pow(Math.sin(t),3)/34,(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t)+17)/34]); } return r; }
/* Pfad mit Bogenlaenge */
function klPfad(pk){ const s=[0]; for(let i=1;i<pk.length;i++) s.push(s[i-1]+Math.hypot(pk[i][0]-pk[i-1][0],pk[i][1]-pk[i-1][1]));
  return {pk,s,L:s[s.length-1]}; }
function klPfadOrt(P,u){ const z=u*P.L; let i=1; while(i<P.s.length-1&&P.s[i]<z) i++;
  const a=P.pk[i-1], b=P.pk[i], f=(z-P.s[i-1])/Math.max(1e-6,P.s[i]-P.s[i-1]); return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]; }
klEmit('formkerze',(e,dt,o,t)=>{
  const H=klHell(), A=e.A||FW.gold, B=e.B||FW.rot, G=klF(e.glut,B), gl=[G[0]*0.9+0.1,G[1]*0.55,G[2]*0.45], NG=e.nachglut||1.8;
  if(!e.teile){
    const sf=klFlaeche(o), gr=e.groesse||0.3, formen=Array.isArray(e.form)?e.form:[e.form], nf=formen.length;
    const pitch=Math.max(e.abstand||0.16,gr*0.72), y0=Math.max(o.y,sf+0.02)+0.1;
    e.teile=formen.map((f,j)=>{
      const cx=o.x+(j-(nf-1)/2)*pitch, herz=f==='herz';
      const pfade=herz?[klHerzHaelfte(-1,40),klHerzHaelfte(1,40)]:[KL_ZIFFER[f]||KL_ZIFFER['0']];
      const P=pfade.map(pk=>{ const q=pk.map(([x,y])=>[cx+(x-(herz?0:0.3))*gr,y0+y*gr,o.z]); const p=klPfad(q.map(p=>[p[0],p[1]])); p.p3=q; return p; });
      P.forEach(p=>{ p.draht=klDraht(e,p.p3); });
      /* Stiel bis auf den Halter */
      const stiel=klDraht(e,[[cx,y0-0.1,o.z],[cx,y0+(herz?0:0.01),o.z]]);
      const sc=stiel.userData.col; for(let i=0;i<6;i++) sc[i]=0.2*H; klDrahtAuf(stiel);
      return {P,start:j*(e.versatz||0),f,fa:[{},{}]};
    });
    e.T0=e.t; e.t=e.t+(e.teile.length-1)*(e.versatz||0)+(e.schluss?e.schluss.funkeln+1:0)+NG+2.5;
  }
  const T=e.T0, alt=SCHWEIF;
  let alleFertig=true;
  e.teile.forEach((tl,j)=>{
    const lt=t-tl.start, u=clamp(lt/T,0,1), brennt=lt>0&&lt<T;
    if(lt<T) alleFertig=false;
    tl.P.forEach((P,pi)=>{
      if(brennt){ const [x,y]=klPfadOrt(P,u), f={x,y,z:o.z};
        klGlutpunkt(f,'eisen');
        klKerzeFunken(f,dt,tl.fa[pi],'eisen',A,B,(e.n||6)*60*(e.fronten===2?0.8:1),{tempo:0.62});
        licht('fk'+e.prod+j+pi,f,[1,0.7,0.4],0.6,{weite:4}); }
      /* Glut: abgebrannte Punkte leuchten in B nach und bleiben als Schrift stehen */
      const col=P.draht.userData.col, n=P.p3.length, fertig=lt-T;
      for(let i=0;i<n;i++){ const tb=P.s[i]/P.L*T, al=lt-tb;
        if(al<0){ const nah=brennt?Math.exp(-Math.abs(P.s[i]-u*P.L)/0.03):0, k=0.22*H+0.8*nah; col[i*3]=0.62*k; col[i*3+1]=0.6*k; col[i*3+2]=0.56*k; continue; }
        let k=al<0.25?1.6-al*2.4:Math.max(0.42,1-al/NG*0.6);
        if(tl.treffen!==undefined){ const a2=t-tl.treffen; if(a2>=0) k=a2<0.35?2.2:Math.max(0,1-(a2-0.35)/NG); }
        else if(fertig>0){ const ende=e.schluss?e.schluss.at+e.schluss.funkeln-T-tl.start:0.5; if(fertig>ende) k*=Math.max(0,1-(fertig-ende)/2.5); }
        col[i*3]=gl[0]*k+0.03; col[i*3+1]=gl[1]*k+0.03; col[i*3+2]=gl[2]*k+0.03; }
      klDrahtAuf(P.draht);
    });
    /* zwei Fronten treffen sich in der Kerbe: Blitz und Funkenball, das Herz leuchtet auf */
    if(e.fronten===2&&lt>=T&&tl.treffen===undefined){ tl.treffen=t;
      const P=tl.P[0], k=P.p3[P.p3.length-1], p={x:k[0],y:k[1],z:k[2]}, C=klF(e.treffen&&e.treffen.flash,FW.weiss);
      flash(p,C,1.4,0.25); SCHWEIF=0.06;
      for(let i=0;i<Math.round((e.treffen?e.treffen.funken:60)*QUAL());i++){ const d=randDir(), s=rand(1.2,2.8), c=i%3?FW.rose:FW.weiss;
        psSmall.emit(p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,c[0]*1.3,c[1]*1.3,c[2]*1.3,rand(0.2,0.35),2,0); }
      psBig.emit(p.x,p.y,p.z,0,0,0,1.6,1.1,1.3,0.12,0,0); SCHWEIF=alt;
      schall(p,v=>{ sfx.plopp(v*0.6,2.2); sfx.crackle(v*0.35); }); }
  });
  /* Schluss: alle Pfade spruehen eine Sekunde ueber ihre ganze Laenge */
  if(e.schluss&&t>=e.schluss.at&&t<e.schluss.at+e.schluss.funkeln){
    e.sf=(e.sf||0)+dt*700*QUAL(); SCHWEIF=0.04;
    for(;e.sf>=1;e.sf--){ const tl=e.teile[Math.floor(Math.random()*e.teile.length)], P=tl.P[0], [x,y]=klPfadOrt(P,Math.random()), d=randDir(), s=rand(0.6,1.6), c=Math.random()<0.6?A:FW.weiss;
      psSmall.emit(x,y,o.z,d[0]*s,d[1]*s+0.3,d[2]*s,c[0]*1.2,c[1]*1.2,c[2]*1.2,rand(0.15,0.35),1.5,0); }
    SCHWEIF=alt;
    if(!e.sfT){ e.sfT=1; sfx.crackle(distVol(o)*0.4); later(0.45,()=>sfx.crackle(distVol(o)*0.35)); } }
  if(!alleFertig){ e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=1.3; sfx.fizz(distVol(o)*0.3); } }
});

/* Herz (zwei Fronten, Treffen) und Glutschrift (Ziffern, Schlussfunkeln)
   als eigene Namen */
NEU_EMIT.herzdraht=NEU_EMIT.formkerze; NEU_EMIT.glutschrift=NEU_EMIT.formkerze;

/* ---------------------------------------------------------
   Funkenkranz: Wunderkerzen auf einem Ring, ringsum gezuendet,
   rueckwaerts verloeschend; ein Goldschein laeuft unter dem Bogen mit
   --------------------------------------------------------- */
klEmit('funkenkranz',(e,dt,o,t)=>{
  const n=e.n||12, gap=e.gap||0.22, R=e.r||0.6, dreh=e.dreh||1, kz=e.kerze||{};
  if(!e.kr){ const sf=klFlaeche(o); e.kr=[]; e.T0=e.t;
    /* der Halter: ein dunkler Drahtring */
    const ring=[]; for(let i=0;i<=48;i++){ const a=i/48*Math.PI*2; ring.push([o.x+Math.cos(a)*R,sf+0.03,o.z+Math.sin(a)*R*0.8]); }
    const rl=klDraht(e,ring), rc=rl.userData.col; for(let i=0;i<rc.length;i++) rc[i]=0.16*klHell(); klDrahtAuf(rl);
    for(let k=0;k<n;k++){ const a=-Math.PI/2+dreh*k/n*Math.PI*2, x=o.x+Math.cos(a)*R, z=o.z+Math.sin(a)*R*0.8;
      /* rueckwaerts aus: Kerze k endet bei T - k*gap*0,8 */
      const dauer=e.aus==='rueckwaerts'?e.T0-k*gap*1.8:e.T0-k*gap;
      e.kr.push({start:k*gap,K:klKerze(e,{x,y:sf+0.03,z},{laenge:kz.laenge||0.4,t:dauer,material:kz.material||'eisen',A:klF(kz.A),B:klF(kz.B,FW.bernstein),n:5,key:'kr'+k,licht:false}),x,z}); }
    e.t=e.T0+1.8; }
  let sx=0,sz=0,sn=0;
  for(const k of e.kr){ if(t<k.start) continue;
    if(!k.an){ k.an=true; const a=SCHWEIF; SCHWEIF=0; psBig.emit(k.x,klFlaeche(o)+0.45,k.z,0,0,0,1.5,1.2,0.7,0.08,0,0); SCHWEIF=a; }
    k.K.schritt(dt); if(k.K.alter<k.K.T){ const f=k.K.front(); sx+=f.x; sz+=f.z; sn++; } }
  /* Goldschein unter dem brennenden Bogen */
  if(sn) licht('kranz'+e.prod,{x:sx/sn,y:klFlaeche(o)+0.5,z:sz/sn},[1,0.72,0.35],0.6+sn*0.12,{weite:6});
  e.fz=(e.fz||0)-dt; if(e.fz<=0&&sn){ e.fz=1.1; sfx.fizz(distVol(o)*(0.2+sn*0.03)); }
});

/* ---------------------------------------------------------
   Bengal- und Lichtprodukte: Flammen ohne Funken, Licht auf dem
   ganzen Platz, jedes mit eigenem Takt
   --------------------------------------------------------- */
/* Flamme: Kern (kern) und Mantel (A), h Hoehe m, r Radius m, st Staerke */
function klFlamme(z,p,dt,A,o){
  o=o||{}; const q=QUAL(), st=o.st===undefined?1:o.st, h=o.h||0.25, r=o.r||0.03, K=o.kern||[1,1,0.95];
  if(st<=0.01) return;
  z.fl=(z.fl||0)+dt*(o.rate||110)*q*Math.min(1,st*0.8+0.2);
  const alt=SCHWEIF; SCHWEIF=0;
  for(;z.fl>=1;z.fl--){ const a=Math.random()*6.283, w=Math.sqrt(Math.random())*r, kern=Math.random()<0.16;
    const l=rand(0.16,0.3)*(kern?0.7:1), vy=h/l*rand(0.55,0.8), c=kern?K:A, k=(kern?0.85:0.72)*st;
    (kern?psSmall:psMid).emit(p.x+Math.cos(a)*w,p.y+rand(0,0.02),p.z+Math.sin(a)*w,Math.cos(a)*w*1.5,vy,Math.sin(a)*w*1.5,c[0]*k,c[1]*k,c[2]*k,l,-0.5,0); }
  psBig.emit(p.x,p.y+h*0.4,p.z,0,0,0,A[0]*0.3*st,A[1]*0.3*st,A[2]*0.3*st,0.05,0,0);
  SCHWEIF=alt;
}
/* Farbe im weichen Kreislauf durch eine Namensliste (Kosinus-Ueberblendung) */
function klKreis(liste,u){ const n=liste.length, x=((u%1)+1)%1*n, i=Math.floor(x), f=x-i, w=0.5-0.5*Math.cos(Math.PI*f);
  return klMisch(klF(liste[i%n]),klF(liste[(i+1)%n]),w); }

/* Magic Light: sechs Staebe im Faecher, Mitte zuerst; alle wechseln
   im selben Augenblick die Farbe (sync), jeder Wechsel mit Puff */
klEmit('wechselflamme',(e,dt,o,t)=>{
  const n=e.n||6, F=(e.farben||['magenta','limette','tuerkis','weiss']).map(c=>klF(c)), W=e.wechselBei||[3,6,9];
  if(!e.st){ const sf=klFlaeche(o); e.st=[]; e.T0=e.t;
    /* Reihenfolge Mitte -> aussen, paarweise */
    const ord=[]; for(let k=0;k<n/2;k++){ ord.push(Math.floor(n/2)-1-k, Math.ceil(n/2)+k); }
    for(let i=0;i<n;i++){ const u=(i-(n-1)/2)/((n-1)/2), ang=u*(e.ang||0.35), x=o.x+u*0.28, z=o.z+Math.abs(u)*0.08;
      const start=ord.indexOf(i)>>1, L=0.5;
      e.st.push({x,z,y0:sf+0.02,ang,L,start:start*(e.gap||0.5),z0:{}});
      const s=e.st[i]; s.draht=klDraht(e,[[x,s.y0,z],[x+Math.sin(ang)*L,s.y0+Math.cos(ang)*L,z]]); }
    e.t=e.T0+0.6; }
  const idx=W.filter(w=>t>=w).length, C=F[Math.min(idx,F.length-1)], H=klHell();
  if(idx>(e.idx||0)){ e.idx=idx;
    /* Puff: alle zugleich, Funkenkranz in der neuen Farbe */
    for(const s of e.st){ if(t<s.start||t>e.T0) continue; const p=s.tip, alt=SCHWEIF; SCHWEIF=0.06;
      for(let k=0;k<20;k++){ const a=k/20*6.283, v=rand(1.4,2); psSmall.emit(p.x,p.y,p.z,Math.cos(a)*v,rand(-0.3,0.9),Math.sin(a)*v,C[0]*1.4,C[1]*1.4,C[2]*1.4,0.2,1,0); }
      psBig.emit(p.x,p.y,p.z,0,0,0,C[0]*1.2,C[1]*1.2,C[2]*1.2,0.12,0,0); SCHWEIF=alt; }
    flash({x:o.x,y:o.y+0.5,z:o.z},C,1.5,0.3); schall(o,v=>{ sfx.plopp(v*0.7,1.6); sfx.zischen(v*0.3,0.3); }); }
  let an=0;
  for(const s of e.st){ const lt=t-s.start, col=s.draht.userData.col;
    const u=clamp(lt/(e.T0-s.start),0,1), L=s.L*(1-0.6*u);
    s.tip={x:s.x+Math.sin(s.ang)*L,y:s.y0+Math.cos(s.ang)*L,z:s.z};
    col[0]=col[1]=col[2]=0.18*H; const b=lt>0&&lt<e.T0-s.start?0.9:0.12*H; col[3]=b*0.9; col[4]=b*0.5; col[5]=b*0.3;
    s.draht.userData.pos[3]=s.tip.x; s.draht.userData.pos[4]=s.tip.y; klDrahtAuf(s.draht,true);
    if(lt<0||lt>e.T0-s.start) continue; an++;
    const auf=Math.min(1,lt/0.25);
    klFlamme(s.z0,{x:s.tip.x,y:s.tip.y,z:s.z},dt,C,{h:0.25*auf,r:0.02,st:auf*(0.92+Math.random()*0.08),rate:80});
    /* leichter Farbrauch ueber dem Stab */
    s.z0.r=(s.z0.r||0)+dt*6; for(;s.z0.r>=1;s.z0.r--) psBig.emit(s.tip.x,s.tip.y+0.3,s.z,rand(-.05,.05),rand(0.2,0.45),rand(-.05,.05),C[0]*0.07,C[1]*0.07,C[2]*0.07,rand(1.5,2.5),-0.05,0); }
  if(an) licht('lst'+e.prod,{x:o.x,y:o.y+0.4,z:o.z},C,1.0+an*0.25,{weite:10});
  e.fz=(e.fz||0)-dt; if(e.fz<=0&&an){ e.fz=1.4; sfx.fauchen(distVol(o)*0.12,1.6); }
});

/* Bengalhoelzer: Ratsch mit weisser Stichflamme, Kugelflamme, Glimmen mit Rauchfaden */
klEmit('zuendholz',(e,dt,o,t)=>{
  const A=e.A||FW.rot, st=e.stich||0.25, T=e.T0||(e.T0=e.t), gl=e.glimm||1;
  if(!e.holz){ const sf=klFlaeche(o); e.kopf={x:o.x,y:Math.max(o.y,sf)+0.1,z:o.z}; e.t=st+T+gl+1.5;
    e.holz=klDraht(e,[[o.x,e.kopf.y-0.1,o.z],[o.x,e.kopf.y,o.z]]); const c=e.holz.userData.col; c[0]=0.25;c[1]=0.16;c[2]=0.08;c[3]=0.35;c[4]=0.2;c[5]=0.1; klDrahtAuf(e.holz);
    const p=e.kopf, alt=SCHWEIF; SCHWEIF=0.08; flash(p,FW.weiss,1.0,0.2);
    for(let k=0;k<15;k++){ const d=streu([rand(-0.4,0.4),1,rand(-0.3,0.3)],0.5), v=rand(1.5,3); psSmall.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,1.5,1.4,1.2,rand(0.15,0.3),3,0); }
    SCHWEIF=alt; schall(p,v=>sfx.ratsch(v*1.2)); }
  const p=e.kopf, alt=SCHWEIF; SCHWEIF=0;
  if(t<st){ const k=1-t/st; psMid.emit(p.x,p.y+0.03,p.z,0,0.6,0,2*k+0.4,2*k+0.4,1.9*k+0.4,0.05,0,0);
    psBig.emit(p.x,p.y+0.04,p.z,0,0,0,0.9*k,0.9*k,0.85*k,0.05,0,0); licht('zh'+e.prod+e.nr,p,[1,1,0.95],2.2*k+0.5,{weite:4}); }
  else if(t<st+T){ const u=t-st, fl=0.9+0.1*Math.sin(u*37)+0.05*Math.random(), auf=Math.min(1,u/0.2), aus=Math.min(1,(st+T-t)/0.3), s=fl*auf*aus;
    /* runde Kugelflamme um den Kopf, ruhig, mit weissem Kern */
    e.fk=(e.fk||0)+dt*110*QUAL();
    for(;e.fk>=1;e.fk--){ const d=randDir(), r=Math.cbrt(Math.random())*0.04, c=r<0.008?[1.1,1.05,1]:A;
      psSmall.emit(p.x+d[0]*r,p.y+0.035+d[1]*r,p.z+d[2]*r,d[0]*0.1,0.12,d[2]*0.1,c[0]*s*0.85,c[1]*s*0.85,c[2]*s*0.85,rand(0.08,0.14),0,0); }
    psMid.emit(p.x,p.y+0.035,p.z,0,0,0,A[0]*0.55*s,A[1]*0.55*s,A[2]*0.55*s,0.05,0,0);
    psBig.emit(p.x,p.y+0.04,p.z,0,0,0,A[0]*0.3*s,A[1]*0.3*s,A[2]*0.3*s,0.05,0,0);
    licht('zh'+e.prod+e.nr,p,A,1.5*s,{weite:5});
    e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=1.3; sfx.fizz(distVol(o)*0.15); } }
  else if(t<st+T+gl+1.2){ const u=(t-st-T)/gl, k=Math.max(0,1-u);
    if(u<1) psSmall.emit(p.x,p.y,p.z,0,0,0,1*k,0.4*k,0.1*k,0.05,0,0);
    /* Rauchfaden: steigt senkrecht, leicht wellig */
    e.rf=(e.rf||0)-dt; if(e.rf<=0&&u<1.1){ e.rf=0.1; psMid.emit(p.x,p.y+0.02,p.z,Math.sin(t*5)*0.03,0.5,0,0.09,0.09,0.1,1.3,-0.05,0); } }
  SCHWEIF=alt;
});

/* Blaue Stunde: Bengaltopf, Farbe fliesst weich durch den Zyklus,
   die Rauchwolke darueber leuchtet von innen in der aktuellen Farbe */
klEmit('farbnebel',(e,dt,o,t)=>{
  const Z=e.farbzyklus||['blau','violett','magenta'], per=e.periode||9, C=klKreis(Z,(t+(e.versatz||0))/per);
  const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.02,z:o.z}, auf=Math.min(1,t/0.6), aus=clamp(e.t/0.8,0,1), s=auf*aus;
  e.C=C;
  klFlamme(e,p,dt,C,{h:0.3,r:0.06,st:s*(0.93+0.07*Math.sin(t*23)),rate:120});
  licht('fn'+e.prod+e.pi,{x:p.x,y:p.y+0.35,z:p.z},C,2.4*s,{weite:14});
  /* Rauch: zur gemeinsamen Mitte (Station) hin, steigt, leuchtet in der Farbe seines Topfes */
  e.rb=(e.rb||0)+dt*3.5*s;
  if(e.rb>=1){ e.rb--; const ee=e, mx=o.x-(e.x||0), mz=o.z-(e.z||0);
    rauchball({x:p.x+rand(-.05,.05),y:p.y+0.4,z:p.z},{r:rand(1.1,1.6),n:1,dauer:7,quellen:4,steigen:0.32,leuchten:true,a:0.42,
      wind:[(mx-p.x)*0.06+0.03,(mz-p.z)*0.06],farbe:tt=>{ const c=ee.C||C, k=0.35*Math.max(0.25,1-tt/7); return [c[0]*k,c[1]*k,c[2]*k]; }}); }
  /* kaum Funken: zwei Glutfunken je Sekunde */
  e.gf=(e.gf||0)+dt*2; if(e.gf>=1){ e.gf--; const a=SCHWEIF; SCHWEIF=0.05; psSmall.emit(p.x,p.y+0.05,p.z,rand(-0.4,0.4),rand(1,1.8),rand(-0.4,0.4),1,0.6,0.25,rand(0.4,0.7),3,0); SCHWEIF=a; }
  e.fz=(e.fz||0)-dt; if(e.fz<=0&&s>0.2){ e.fz=1.8; sfx.zischen(distVol(o)*0.25,2); }
});

/* Stadionfackel: Starklicht auf dem Stab, Flackern, Rauchfahne im
   Wind, Schlacke tropft, am Ende stottert sie dreimal und stirbt */
klEmit('handfackel',(e,dt,o,t)=>{
  const A=e.A||FW.rot, T=e.T0||(e.T0=e.t);
  if(!e.stab){ const sf=klFlaeche(o); e.p={x:o.x,y:Math.max(o.y,sf)+0.5,z:o.z}; e.wind=[0.55,0.18];
    e.stab=klDraht(e,[[o.x,Math.max(o.y,sf),o.z],[o.x,e.p.y,o.z]]); const c=e.stab.userData.col; c[0]=c[1]=c[2]=0.2; c[3]=0.5;c[4]=0.2;c[5]=0.15; klDrahtAuf(e.stab);
    e.t=T+2; flash(e.p,A,2.2,0.3); schall(e.p,v=>{ sfx.zischen(v*0.8,0.6); sfx.fauchen(v*0.4,2.5); }); }
  const p=e.p, S=e.stottern||{at:T-3,n:3};
  /* Flackern 8-12 Hz, +-20 % */
  const fl=1+0.12*Math.sin(t*2*Math.PI*8.3)+0.08*Math.sin(t*2*Math.PI*11.7+1.3)+rand(-0.06,0.06);
  let s=Math.min(1,t/0.3);
  if(t>=S.at){ const k=Math.floor((t-S.at)/0.75), f=(t-S.at)%0.75; if(k<S.n){ if(f<0.15) s*=0.06; } else s*=Math.max(0,1-(t-S.at-S.n*0.75)/0.4); }
  if(t>T) s=0;
  const st=s*fl;
  if(s>0.01){ klFlamme(e,p,dt,A,{h:0.3,r:0.035,st:Math.min(1.3,st),rate:150,kern:[1.2,1.15,1.1]});
    licht('fa'+e.prod,{x:p.x,y:p.y+0.15,z:p.z},A,(e.hell||3.2)*st,{weite:25});
    /* Rauchfahne: vorne rot angestrahlt, weiter weg grau */
    e.rb=(e.rb||0)+dt*3*s;
    if(e.rb>=1){ e.rb--; rauchball({x:p.x,y:p.y+0.35,z:p.z},{r:rand(0.5,0.8),n:1,dauer:6,quellen:3,steigen:0.45,a:0.55,wind:e.wind,
      farbe:tt=>{ const u=Math.min(1,tt/2.5), h=klHell(); return klMisch([Math.min(1,A[0]*0.8+0.2),A[1]*0.5+0.12,A[2]*0.5+0.1],[0.28*h+0.06,0.26*h+0.06,0.26*h+0.07],u); }}); }
    /* Schlacke */
    const sl=e.schlacke||{alle:[0.4,0.9],glimm:1.5};
    e.sl=(e.sl===undefined?rand(sl.alle[0],sl.alle[1]):e.sl)-dt;
    if(e.sl<=0){ e.sl=rand(sl.alle[0],sl.alle[1]); klGlutperle({x:p.x+rand(-0.02,0.02),y:p.y-0.02,z:p.z+rand(-0.02,0.02)},FW.orange,0,3,sl.glimm); }
    e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=2.4; sfx.fauchen(distVol(o)*0.3,3); } }
  else { const alt=SCHWEIF; SCHWEIF=0; if(t<T+1.2) psSmall.emit(p.x,p.y,p.z,0,0,0,0.6*(T+1.2-t),0.15*(T+1.2-t),0.03,0.05,0,0); SCHWEIF=alt; }
});

/* Hafenlichter: Rot und Gruen im Gegentakt (weicher Sinus), ab 20 s
   schneller bis 4 Hz, zum Schluss brennen beide voll */
klEmit('wechselfeuer',(e,dt,o,t)=>{
  const T=e.T0||(e.T0=e.t), tk=e.takt||{hz:0.5,ab:20,bisHz:4}, mn=e.min||0.12, sc=e.schluss||{at:27,t:3};
  if(!e.tp){ const sf=klFlaeche(o); e.tp=[e.links||{x:-0.35,A:'rot'},e.rechts||{x:0.35,A:'gruen'}].map(q=>({p:{x:o.x+q.x,y:Math.max(o.y,sf)+0.03,z:o.z},A:klF(q.A),z:{}}));
    e.phi=0; e.t=T+0.8; }
  const hz=t<tk.ab?tk.hz:tk.hz+(tk.bisHz-tk.hz)*clamp((t-tk.ab)/Math.max(0.1,sc.at-tk.ab),0,1);
  e.phi+=2*Math.PI*hz*dt;
  let hl=mn+(1-mn)*(0.5+0.5*Math.sin(e.phi)), hr=mn+(1-mn)*(0.5-0.5*Math.sin(e.phi));
  if(t>=sc.at){ const u=Math.min(1,(t-sc.at)/0.3); hl+=(1-hl)*u; hr+=(1-hr)*u; }
  const an=Math.min(1,t/0.5), aus=t>T?Math.max(0,1-(t-T)/0.5):1;
  [hl,hr].forEach((h,i)=>{ const q=e.tp[i], s=h*an*aus; if(s<0.01) return;
    klFlamme(q.z,q.p,dt,q.A,{h:0.38,r:0.07,st:s,rate:130});
    licht('wf'+e.prod+i,{x:q.p.x,y:q.p.y+0.4,z:q.p.z},q.A,3.4*s,{weite:20});
    q.z.rb=(q.z.rb||0)+dt*1.5*s;
    if(q.z.rb>=1){ q.z.rb--; const A=q.A; rauchball({x:q.p.x,y:q.p.y+0.45,z:q.p.z},{r:0.9,n:1,dauer:6,quellen:3,steigen:0.35,leuchten:true,a:0.35,wind:[0.1,0.05],
      farbe:tt=>{ const k=0.22*s*Math.max(0.2,1-tt/6); return [A[0]*k,A[1]*k,A[2]*k]; }}); } });
  /* der Klang pendelt mit: leises Fauchen links/rechts */
  e.fz=(e.fz||0)-dt; if(e.fz<=0&&t<T){ e.fz=2.2; sfx.fauchen(distVol(o)*0.2,2.4); }
  if(t>=sc.at&&!e.gleich){ e.gleich=1; schall(o,v=>sfx.zischen(v*0.6,1.2)); }
});

/* Blitztuerme: vier Blinktoepfe im Quadrat, jeder mit eigener Frequenz
   (Polyrhythmus); Endspurt auf 14 Hz, Dauerlicht mit Brummen, Plopp - Nacht */
klEmit('blitzturm',(e,dt,o,t)=>{
  const TP=e.toepfe||[{A:'weiss',hz:9},{A:'rot',hz:3},{A:'gruen',hz:5},{A:'zitrone',hz:2}], a=(e.a||0.4)/2, ES=e.endspurt||{at:10,hz:14,t:2,dauerlicht:1};
  if(!e.tp){ const sf=klFlaeche(o), ecken=[[-a,-a],[a,-a],[a,a],[-a,a]];
    e.tp=TP.map((q,i)=>({p:{x:o.x+ecken[i][0],y:Math.max(o.y,sf)+0.06,z:o.z+ecken[i][1]},A:klF(q.A),hz:q.hz,start:i*(e.gap||0.6),phi:0,an:false,klang:[1.7,0.6,1.0,0.45][i]}));
    e.aus=ES.at+ES.t+ES.dauerlicht; e.t=e.aus+0.8; }
  const alt=SCHWEIF; SCHWEIF=0;
  let klick=false;
  e.tp.forEach((q,i)=>{
    if(t<q.start) return;
    const p=q.p;
    if(t>=e.aus){ const k=Math.max(0,1-(t-e.aus)/0.5); if(k>0) psMid.emit(p.x,p.y,p.z,0,0,0,q.A[0]*0.3*k,q.A[1]*0.3*k,q.A[2]*0.3*k,0.05,0,0); return; }
    let hz=q.hz, dauer=false;
    if(t>=ES.at){ const u=(t-ES.at)/ES.t; if(u<1) hz=q.hz+(ES.hz-q.hz)*u; else dauer=true; }
    q.phi+=hz*dt; const ph=q.phi%1, an=dauer||ph<0.2;
    if(an){ const k=dauer?1.3:1.6;
      psBig.emit(p.x,p.y+0.05,p.z,0,0,0,q.A[0]*k,q.A[1]*k,q.A[2]*k,0.05,0,0);
      psMid.emit(p.x,p.y+0.04,p.z,0,0,0,1.6,1.6,1.6,0.05,0,0);
      licht('bt'+e.prod+i,{x:p.x,y:p.y+0.3,z:p.z},q.A,dauer?3:2.5,{weite:18});
      if(!q.an){ /* Einschalten des Blitzes: kurzer Funkenring, Klick */
        for(let k2=0;k2<12;k2++){ const d=randDir(), v=rand(0.8,1.6); psSmall.emit(p.x,p.y+0.05,p.z,d[0]*v,Math.abs(d[1])*v,d[2]*v,q.A[0]*1.3,q.A[1]*1.3,q.A[2]*1.3,rand(0.12,0.25),1,0); }
        if(!klick&&!dauer){ klick=true; sfx.klick(distVol(o)*0.9,q.klang); } } }
    else psMid.emit(p.x,p.y+0.03,p.z,0,0,0,q.A[0]*0.15,q.A[1]*0.15,q.A[2]*0.15,0.05,0,0);
    /* Dunst ueber dem Topf, in dem das Blitzlicht steht */
    q.dz=(q.dz||0)+dt*5; for(;q.dz>=1;q.dz--) psBig.emit(p.x+rand(-.05,.05),p.y+0.15,p.z+rand(-.05,.05),rand(-.08,.08),rand(0.25,0.45),rand(-.08,.08),q.A[0]*0.05,q.A[1]*0.05,q.A[2]*0.05,rand(1.8,2.6),-0.05,0);
    q.an=an;
  });
  SCHWEIF=alt;
  /* Dauerlicht: Brummen steigt 200 -> 900 Hz, dann hart aus mit Plopp */
  if(t>=ES.at+ES.t&&!e.brumm){ e.brumm=klTon(e,sfx.brummen(distVol(o)*1.2,200,ES.dauerlicht+0.05)); if(e.brumm) e.brumm.f(900,ES.dauerlicht*0.4); }
  if(t>=e.aus&&!e.plopp){ e.plopp=1; if(e.brumm) e.brumm.stop(); schall(o,v=>sfx.plopp(v*1.2,1)); }
});

/* ---------------------------------------------------------
   Bewegung am Boden: Schlangen, Kreisel, Flitzer, Erbsen, Frosch
   --------------------------------------------------------- */
/* Pharaoschlangen: Ketten aus Aschekugeln wachsen 3 cm/s aus vier
   Tabletten im Rhombus, winden sich; die Spitze glimmt und raucht.
   Die zweite (koenig) ist dicker und hebt am Ende den Kopf. */
klEmit('ascheschlange',(e,dt,o,t)=>{
  const n=e.n||4, sp=0.008, W=e.winden||{amp:0.06,wellen:1.5}, KG=e.koenig||{};
  if(!e.sl){ const sf=klFlaeche(o), R=0.07;
    const geo=klMat('kugelgeo',()=>new THREE.SphereGeometry(1,7,5));
    const mat=klMat('asche',()=>new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x1c1a18}));
    e.im=new THREE.InstancedMesh(geo,mat,n*64); e.im.count=0; e.im.frustumCulled=false; e.im.userData.geoFest=true; klMesh(e,e.im);
    if(e.im.setColorAt) e.im.setColorAt(0,klFarbe3(1,1,1));
    const ecke=[[0,-R*1.3],[R,0],[0,R*1.3],[-R,0]];
    e.sl=[];
    for(let i=0;i<n;i++){ const q=ecke[i%4], a=Math.atan2(q[1],q[0])+rand(-0.35,0.35), koenig=KG.nr===i+1;
      const tab=new THREE.Mesh(klMat('tabgeo',()=>new THREE.CylinderGeometry(0.013,0.014,0.007,10)),klMat('tablette',()=>new THREE.MeshStandardMaterial({color:0xe8e2d0,emissive:0x2a2824})));
      tab.userData.geoFest=true; tab.position.set(o.x+q[0],sf+0.0035,o.z+q[1]); klMesh(e,tab);
      const L=Array.isArray(e.laenge)?rand(e.laenge[0],e.laenge[1]):(e.laenge||0.35);
      e.sl.push({x0:o.x+q[0],z0:o.z+q[1],a,krumm:rand(-2.5,2.5),L:koenig?Math.max(L,0.4):L,start:i*(e.versatz||0.8),d:(e.dicke||0.035)*(koenig?(KG.dicke||1.6):1),koenig,ph:rand(0,6),z:{}}); }
    /* die Asche bleibt liegen (die Station raeumt nach dauer, die Schlangen erst 10 s spaeter) */
    e.sf=sf; e.T0=e.t; e.t=e.T0+10; }
  const col=new THREE.Color(), M=new THREE.Matrix4(), Q=new THREE.Quaternion(), V=new THREE.Vector3(), S=new THREE.Vector3(), H=klHell();
  let k=0; const alt=SCHWEIF; SCHWEIF=0;
  for(const s of e.sl){ const lt=t-s.start; if(lt<=0) continue;
    const wachs=Math.min(lt,e.T0-s.start), len=Math.min(s.L,wachs*0.03), nseg=Math.floor(len/sp);
    let px=s.x0, pz=s.z0, a=s.a, tip=null;
    for(let j=0;j<=nseg&&k<n*64;j++){ const u=j*sp;
      /* Richtung: Grundkurve plus Windung; die Phase wandert leicht (Nachwinden) */
      const w=W.amp*2*Math.PI*W.wellen/Math.max(0.1,s.L)*Math.cos(2*Math.PI*W.wellen*u/s.L+s.ph)*0.9+0.25*Math.sin(u*40-t*1.2+s.ph)*0.06;
      a=s.a+s.krumm*u+w; px+=Math.cos(a)*sp; pz+=Math.sin(a)*sp;
      const zur=len-u, spitz=zur<0.02?0.55+zur/0.02*0.45:1, r=s.d/2*spitz*(0.82+0.18*Math.sin(u*310+s.ph)+0.1*Math.sin(u*97));
      let y=e.sf+r*0.8;
      if(s.koenig&&lt>e.T0-s.start-2){ const hb=Math.min(1,(lt-(e.T0-s.start-2))/1.2), f=clamp(1-zur/0.1,0,1); y+=(KG.aufbaeumen||0.1)*hb*f*f; }
      M.compose(V.set(px,y,pz),Q,S.set(r,r*0.85,r)); e.im.setMatrixAt(k,M);
      const g=0.3+0.1*Math.sin(u*170+s.ph), glut=zur<0.012&&wachs<e.T0-s.start?1:0;
      if(e.im.setColorAt) e.im.setColorAt(k,col.setRGB(glut?0.9:g,glut?0.35:g*0.97,glut?0.1:g*0.93));
      k++; if(j===nseg) tip={x:px,y:y+r*0.6,z:pz}; }
    /* glimmende Spitze, Rauchfaeden */
    if(tip&&lt<e.T0-s.start+0.8){ const fl=0.6+0.4*Math.random(), aus=Math.max(0,Math.min(1,(e.T0-s.start+0.8-lt)/0.8));
      psSmall.emit(tip.x,tip.y,tip.z,0,0,0,1.2*fl*aus,0.45*fl*aus,0.08*aus,0.05,0,0);
      psMid.emit(tip.x,tip.y,tip.z,0,0,0,0.25*fl*aus,0.08*fl*aus,0.01,0.05,0,0);
      s.z.r=(s.z.r||0)+dt*3; for(;s.z.r>=1;s.z.r--) psMid.emit(tip.x,tip.y+0.01,tip.z,rand(-0.02,0.02),rand(0.12,0.2),rand(-0.02,0.02),0.07*H+0.03,0.07*H+0.03,0.075*H+0.03,rand(2,3),-0.02,0); } }
  SCHWEIF=alt;
  e.im.count=k; e.im.instanceMatrix.needsUpdate=true; if(e.im.instanceColor) e.im.instanceColor.needsUpdate=true;
  licht('ph'+e.prod,{x:o.x,y:e.sf+0.15,z:o.z},[1,0.45,0.15],0.35,{weite:2});
  e.zi=(e.zi||0)-dt; if(e.zi<=0&&t<e.T0){ e.zi=2.5; sfx.zischen(distVol(o)*0.08,2.2); }
});

/* Brummkreisel: Drehzahl 4 -> 14 U/s, der Brummton haengt an der
   Drehzahl; zweimal harter Farbwechsel, Knisterfinale, Umkippen */
klEmit('brummkreisel',(e,dt,o,t)=>{
  const n=e.n||6, T=e.t0||(e.t0=e.t), U=e.umdreh||[4,14], TH=(e.ton&&e.ton.hz)||[90,320], FF=e.farbFolge||[['rot','gruen']], WB=e.wechselBei||[0.35,0.7], FIN=e.finale||{t:1.2};
  if(!e.kr){ const sf=klFlaeche(o); e.kr=[];
    for(let i=0;i<n;i++){ const a=(i-1)/(n-1)*Math.PI*2, r=i===0?0:1;
      e.kr.push({x0:o.x+Math.cos(a)*0.42*r,z0:o.z+Math.sin(a)*0.3*r,x:0,z:0,dx:0,dz:0,zt:0,w:rand(0,6),start:i*(e.gap||0.4),
        det:e.ton&&e.ton.groesse?rand(0.85,1.15):1,C:FF[i%FF.length].map(c=>klF(c)),z2:{}}); }
    e.sf=sf; e.t=T+(n-1)*(e.gap||0.4)+1.2; }
  const alt=SCHWEIF, q=QUAL();
  let lx=0,lz=0,ln=0,lc=[0,0,0];
  for(const k of e.kr){ const lt=t-k.start; if(lt<0) continue;
    const u=lt/T;
    if(u>=1){ if(!k.ende){ k.ende=1; if(k.ton){ k.ton.stop(); k.ton=null; } } continue; }
    /* Drift: Zufallsweg, glatt, hoechstens drift m */
    k.zt-=dt; if(k.zt<=0){ k.zt=rand(0.4,0.8); k.dx=rand(-1,1)*(e.drift||0.25); k.dz=rand(-1,1)*(e.drift||0.25)*0.7; }
    k.x+=(k.dx-k.x)*Math.min(1,dt*1.2); k.z+=(k.dz-k.z)*Math.min(1,dt*1.2);
    const rev=U[0]+(U[1]-U[0])*u, fin=lt>T-FIN.t, kipp=lt>T-0.3?(lt-(T-0.3))/0.3:0;
    k.w+=2*Math.PI*rev*dt;
    const x=k.x0+k.x, z=k.z0+k.z, y=e.sf+0.03+kipp*0.04;
    /* Farbe: hart gewechselt bei den Anteilen wechselBei */
    const stufe=WB.filter(w=>u>=w).length, C=fin?FW.silber:stufe===1?k.C[1]:k.C[0];
    /* Funkenscheibe: tangential aus dem Rand, 0,6-0,8 m */
    k.z2.f=(k.z2.f||0)+dt*380*q; SCHWEIF=0.07;
    const nk=Math.cos(kipp*1.05), sk=Math.sin(kipp*1.05);
    for(;k.z2.f>=1;k.z2.f--){ const a=k.w+Math.random()*6.283, s=rand(2.2,3.2)*(0.8+0.2*rev/U[1]), cx=Math.cos(a), cz=Math.sin(a);
      const vx=-cz*s, vz=cx*s, vy=rand(0.1,0.5)+vz*sk; 
      psMid.emit(x+cx*0.025,y,z+cz*0.025*nk,vx,vy,vz*nk,C[0],C[1],C[2],rand(0.14,0.22),1,fin?3:0); }
    psMid.emit(x,y+0.01,z,0,0,0,1.6,1.6,1.5,0.05,0,0);
    if(fin&&Math.random()<dt*30){ const a=Math.random()*6.283; knisterPop(x+Math.cos(a)*0.3,y+rand(0,0.1),z+Math.sin(a)*0.25,{c:FW.silber,laut:0.4}); }
    if(lt>T-0.06&&!k.hops){ k.hops=1; psBig.emit(x,y+0.05,z,0,0,0,1.3,1.3,1.4,0.08,0,0); psMid.emit(x,y,z,rand(-.3,.3),1.2,rand(-.3,.3),1,1,1,0.25,9.8,0); }
    lx+=x; lz+=z; ln++; lc=[lc[0]+C[0],lc[1]+C[1],lc[2]+C[2]];
    /* Brummen: Tonhoehe folgt der Drehzahl */
    if(!k.ton&&!k.ende) k.ton=klTon(e,sfx.brummen(distVol(o)*0.55,TH[0]*k.det,T+0.2));
    if(k.ton){ k.tt=(k.tt||0)-dt; if(k.tt<=0){ k.tt=0.1; k.ton.f((TH[0]+(TH[1]-TH[0])*(rev-U[0])/(U[1]-U[0]))*k.det,0.08); } } }
  SCHWEIF=alt;
  if(ln) licht('bk'+e.prod,{x:lx/ln,y:e.sf+0.3,z:lz/ln},[lc[0]/ln,lc[1]/ln,lc[2]/ln],0.8+ln*0.25,{weite:6});
});

/* Flitzer: sechs Treiber rasen kreischend im Zickzack ueber den Boden,
   Goldspur mit Nachleuchten, jeder endet mit einem Knall */
klEmit('bodenflitzer',(e,dt,o,t)=>{
  const n=e.n||6, TK=e.takt||[0.15,0.15,0.6], V=e.v||[5,8], HK=e.haken||[0.18,0.4], WK=e.winkel||[0.45,0.9], TT=Array.isArray(e.tt)?e.tt:[2.2,3.2], HH=e.hoehe||[0.1,0.3];
  if(!e.fl){ const g=klVorne(o,1.0); e.g=g; e.fl=[]; let ts=0;
    for(let i=0;i<n;i++){ const sg=i%2?1:-1, a=Math.PI/2+sg*(e.ang||0.6)*(1+Math.floor(i/2)*0.3);
      e.fl.push({x:g.x+sg*0.05,z:g.z,a,v:rand(V[0],V[1]),hk:rand(HK[0],HK[1]),sg:sg,h:rand(HH[0],HH[1]),start:ts,T:rand(TT[0],TT[1]),kopf:klF((e.kopf||['weiss'])[i%(e.kopf||['weiss']).length]),zz:{}});
      ts+=TK[i%TK.length]; }
    e.t=ts+Math.max(...e.fl.map(f=>f.T))+1; }
  const alt=SCHWEIF, q=QUAL(), S=klF(e.spur,FW.gold), g=e.g, X0=g.x-6, X1=g.x+6, Z0=g.z-0.4, Z1=g.z+5;
  e.fl.forEach((f,i)=>{ const lt=t-f.start; if(lt<0) return;
    if(lt>f.T){ if(!f.aus){ f.aus=1; if(f.ton) f.ton.stop();
      const p={x:f.x,y:g.y+f.h,z:f.z}; SCHWEIF=0; psBig.emit(p.x,p.y,p.z,0,0,0,1.8,1.8,1.7,0.06,0,0);
      for(let k=0;k<12;k++){ const d=randDir(), s=rand(2,4); psSmall.emit(p.x,p.y,p.z,d[0]*s,Math.abs(d[1])*s,d[2]*s,1.3,1.2,1,rand(0.1,0.2),3,0); }
      flash(p,FW.weiss,0.8,0.08); schall(p,v=>sfx.crack(v*0.9)); SCHWEIF=alt; } return; }
    if(!f.ton&&!f.aus){ f.ton=klTon(e,sfx.kreischen(distVol(o)*0.8,f.T,true)); schall(o,v=>sfx.thump(v*0.35)); }
    /* Haken: Richtung springt um +-winkel, meist mit wechselndem Vorzeichen */
    f.hk-=dt; if(f.hk<=0){ f.hk=rand(HK[0],HK[1]); if(Math.random()<0.7) f.sg=-f.sg; f.a+=f.sg*rand(WK[0],WK[1]); }
    const x0=f.x, z0=f.z; f.x+=Math.cos(f.a)*f.v*dt; f.z+=Math.sin(f.a)*f.v*dt;
    /* Rand des Feldes: abprallen */
    if(f.x<X0||f.x>X1){ f.a=Math.PI-f.a; f.x=clamp(f.x,X0,X1); }
    if(f.z<Z0||f.z>Z1){ f.a=-f.a; f.z=clamp(f.z,Z0,Z1); }
    const y=g.y+f.h+0.03*Math.sin(lt*23+i);
    /* Goldspur: liegt und verglueht 0,6 s */
    f.zz.s=(f.zz.s||0)+dt*260*q; SCHWEIF=0;
    for(;f.zz.s>=1;f.zz.s--){ const u=Math.random(); psMid.emit(x0+(f.x-x0)*u,y,z0+(f.z-z0)*u,rand(-.1,.1),rand(0,0.15),rand(-.1,.1),S[0]*0.8,S[1]*0.8,S[2]*0.8,rand(0.45,0.65),0.2,0); }
    f.zz.k=(f.zz.k||0)+dt*90*q; SCHWEIF=0.05;
    for(;f.zz.k>=1;f.zz.k--){ const d=randDir(), s=rand(0.8,2); psSmall.emit(f.x,y,f.z,-Math.cos(f.a)*2+d[0]*s,Math.abs(d[1])*s,-Math.sin(f.a)*2+d[2]*s,1,0.8,0.35,rand(0.1,0.25),3,0); }
    SCHWEIF=0; psBig.emit(f.x,y,f.z,0,0,0,f.kopf[0]*1.2,f.kopf[1]*1.2,f.kopf[2]*1.2,0.05,0,0); psMid.emit(f.x,y,f.z,0,0,0,1.8,1.8,1.8,0.05,0,0);
    licht('bf'+e.prod+i,{x:f.x,y:y+0.2,z:f.z},f.kopf,0.9,{weite:5}); });
  SCHWEIF=alt;
});

/* Knallerbsen: Papierball fliegt im Bogen, Knack erst beim Aufprall;
   einer liegt erst still und knackt als Nachzuegler */
function klKnack(p,leise){
  const alt=SCHWEIF; SCHWEIF=0;
  psBig.emit(p.x,p.y+0.02,p.z,0,0,0,1.8,1.8,1.8,0.034,0,0); psHuge.emit(p.x,p.y+0.05,p.z,0,0,0,0.5,0.48,0.45,0.06,0,0);
  for(let k=0;k<14;k++){ const d=randDir(), s=rand(1.2,2.8); psSmall.emit(p.x,p.y+0.01,p.z,d[0]*s,Math.abs(d[1])*s,d[2]*s,1.5,1.45,1.3,rand(0.06,0.11),2,0); }
  SCHWEIF=alt;
  for(let k=0;k<2;k++) rauchball({x:p.x+rand(-.03,.03),y:p.y+0.05,z:p.z+rand(-.03,.03)},{r:0.12,n:1,dauer:1.3,quellen:0.5,steigen:0.15,c:[0.55*klHell()+0.1,0.55*klHell()+0.1,0.57*klHell()+0.1],a:0.4,wind:[0.05,0]});
  bodenrest('fleck',p.x,p.y,p.z,{dauer:10,gr:0.45});
  flash({x:p.x,y:p.y+0.1,z:p.z},FW.weiss,0.35,0.05);
  schall(p,v=>sfx.snap(v*(leise?0.9:1.3)));
}
klEmit('wurferbse',(e,dt,o,t)=>{
  if(!e.w){ const TK=e.takt||[0.35], W=e.weite||[1.5,3.5], BH=e.bogenH||[0.6,1.4], NZ=e.nachzuegler||{}; e.w=[]; let ts=0;
    const p0={x:o.x,y:o.y+0.05,z:KL_TI.z+KL_TI.hz+0.02};
    for(let i=0;i<(e.n||7);i++){ const a=Math.PI/2+rand(-1,1)*(e.streu||0.5), D=rand(W[0],W[1]), Hh=rand(BH[0],BH[1]);
      const tx=p0.x+Math.cos(a)*D, tz=p0.z+Math.sin(a)*D, ty=klGrund(tx,tz), vy=Math.sqrt(2*9.8*Hh), T=vy/9.8+Math.sqrt(2*(p0.y+Hh-ty)/9.8);
      e.w.push({start:ts,T,vx:(tx-p0.x)/T,vz:(tz-p0.z)/T,vy,p0,ty,nach:NZ.nr===i+1?NZ.verz:0}); ts+=TK[i%TK.length]; }
    e.t=ts+2.5+(NZ.verz||0); }
  const alt=SCHWEIF; SCHWEIF=0;
  e.w.forEach(w=>{ const lt=t-w.start; if(lt<0||w.fertig) return;
    if(!w.los){ w.los=1; }
    if(lt<w.T){ const x=w.p0.x+w.vx*lt, z=w.p0.z+w.vz*lt, y=w.p0.y+w.vy*lt-4.9*lt*lt;
      psSmall.emit(x,y,z,0,0,0,0.75,0.72,0.7,0.05,0,0); return; }
    const p={x:w.p0.x+w.vx*w.T,y:w.ty,z:w.p0.z+w.vz*w.T};
    if(w.nach){ if(!w.still){ w.still=1; psSmall.emit(p.x,p.y+0.01,p.z,0,0,0,0.5,0.5,0.5,w.nach,0,0); }
      if(lt<w.T+w.nach) return; }
    w.fertig=1; klKnack(p); });
  SCHWEIF=alt;
});

/* Knallfrosch: jeder Knall wirft die gefaltete Kette in eine neue
   Richtung; Funkenspur im Flug, Staub bei der Landung, am Schluss
   Doppelknall und Ueberschlag */
klEmit('huepfer',(e,dt,o,t)=>{
  if(!e.fr){ const g=klVorne(o,0.9); e.g=g;
    const grp=new THREE.Group();
    const m1=new THREE.Mesh(klMat('froschgeo',()=>new THREE.BoxGeometry(0.06,0.022,0.035)),klMat('froschrot',()=>new THREE.MeshStandardMaterial({color:0xc41e1e,emissive:0x2a0404})));
    const m2=new THREE.Mesh(klMat('froschband',()=>new THREE.BoxGeometry(0.062,0.008,0.012)),klMat('froschgelb',()=>new THREE.MeshStandardMaterial({color:0xf2c21b,emissive:0x2a2004})));
    m2.position.y=0.012; grp.add(m1); grp.add(m2); m1.userData.geoFest=m2.userData.geoFest=true; grp.userData.geoFest=true;
    grp.position.set(g.x,g.y+0.011,g.z); klMesh(e,grp); e.grp=grp;
    const TK=e.takt||[0.35], zeiten=[0]; for(let i=1;i<(e.knalle||9);i++) zeiten.push(zeiten[i-1]+TK[(i-1)%TK.length]);
    e.fr={x:g.x,z:g.z,a:rand(0,6.28),zeiten,nr:0,flug:null,ry:0}; e.t=zeiten[zeiten.length-1]+2.6; }
  const F=e.fr, g=e.g, alt=SCHWEIF, SP=klF(e.spur,FW.bernstein);
  /* Knall */
  if(F.nr<F.zeiten.length&&t>=F.zeiten[F.nr]){ const letzt=F.nr===F.zeiten.length-1, L=e.letzter||{};
    const p={x:F.x,y:g.y+0.03,z:F.z};
    const knall=()=>{ SCHWEIF=0; psBig.emit(p.x,p.y,p.z,0,0,0,1.6,1.4,1.0,0.05,0,0);
      for(let k=0;k<8;k++){ const d=randDir(), s=rand(1.5,3); psSmall.emit(p.x,p.y,p.z,d[0]*s,Math.abs(d[1])*s,d[2]*s,1.3,1.1,0.6,rand(0.08,0.16),3,0); }
      flash(p,FW.bernstein,0.4,0.06); schall(p,v=>sfx.crack(v*0.8)); SCHWEIF=alt; };
    knall(); if(letzt&&L.doppel) later(0.06,knall);
    rauchball({x:p.x,y:p.y+0.04,z:p.z},{r:0.15,n:1,dauer:1.6,steigen:0.2,c:[0.5*klHell()+0.12,0.5*klHell()+0.12,0.52*klHell()+0.12],a:0.35});
    /* Sprung: Winkel zum vorigen +-60-150 Grad; nicht zu weit vom Start */
    const SPR=e.sprung||[0.4,1.2], HO=e.hoehe||[0.15,0.45];
    let a=F.a+(Math.random()<0.5?-1:1)*rand(1.05,2.6);
    if(Math.hypot(F.x-g.x,F.z-g.z)>1.6) a=Math.atan2(g.z-F.z,g.x-F.x)+rand(-0.6,0.6);
    const D=letzt?0.5:rand(SPR[0],SPR[1]), h=letzt?(L.hoehe||1.1):rand(HO[0],HO[1]), vy=Math.sqrt(2*9.8*h), T=2*vy/9.8;
    F.a=a; F.flug={t0:t,T,x0:F.x,z0:F.z,vx:Math.cos(a)*D/T,vz:Math.sin(a)*D/T,vy,dreh:(letzt?1:rand((e.dreh||[0.8,2.2])[0],(e.dreh||[0.8,2.2])[1]))*2*Math.PI/T,salto:letzt&&L.ueberschlag};
    F.nr++; }
  /* Flug */
  if(F.flug){ const f=F.flug, lt=t-f.t0;
    if(lt<f.T){ const x=f.x0+f.vx*lt, z=f.z0+f.vz*lt, y=g.y+0.011+f.vy*lt-4.9*lt*lt;
      e.grp.position.set(x,y,z); e.grp.rotation.set(f.salto?lt/f.T*Math.PI*2:0,F.ry+f.dreh*lt,0);
      F.z2=(F.z2||0)+dt*120*QUAL(); SCHWEIF=0.04;
      for(;F.z2>=1;F.z2--) psSmall.emit(x,y,z,rand(-.3,.3),rand(-.1,.3),rand(-.3,.3),SP[0],SP[1],SP[2],rand(0.15,0.3),2,0);
      SCHWEIF=alt; F.x=x; F.z=z; }
    else { F.x=f.x0+f.vx*f.T; F.z=f.z0+f.vz*f.T; F.ry+=f.dreh*f.T; e.grp.position.set(F.x,g.y+0.011,F.z); e.grp.rotation.set(0,F.ry,0); F.flug=null;
      rauchball({x:F.x,y:g.y+0.03,z:F.z},{r:0.18,n:2,dauer:1.2,steigen:0.05,c:[0.45*klHell()+0.1,0.42*klHell()+0.1,0.38*klHell()+0.1],a:0.35,form:'ring'});
      schall({x:F.x,y:g.y,z:F.z},v=>sfx.poka(v*0.25)); } }
  /* Zuendschnur glimmt, nach dem letzten Sprung raucht er noch 1 s */
  const p=e.grp.position, fertig=F.nr>=F.zeiten.length&&!F.flug;
  SCHWEIF=0;
  if(!fertig) psSmall.emit(p.x,p.y+0.015,p.z,0,0,0,1.2,0.55,0.12,0.05,0,0);
  else { F.rt=(F.rt||0)+dt; if(F.rt<1.2&&Math.random()<dt*8) psMid.emit(p.x,p.y+0.03,p.z,rand(-.03,.03),rand(0.15,0.3),rand(-.03,.03),0.08,0.08,0.085,rand(1.5,2.2),-0.03,0); }
  SCHWEIF=alt;
});

/* ---------------------------------------------------------
   Party: Konfettistrahl, Papierkrone, Ueberraschung, Luftschlangen,
   Funkenschirm
   --------------------------------------------------------- */
/* Party-Popper: Plopp, ein gerichteter Kegel aus Schnipseln (Neigung
   neig gegen die Senkrechte, Azimut azi: 0 = zum Pult hin) */
klEmit('konfettistrahl',(e,dt,o,t)=>{
  if(e.los) return; e.los=1; e.t=1;
  const p={x:o.x,y:o.y+0.06,z:o.z}, ne=e.neig||0.3, az=e.azi||0, dir=[Math.sin(ne)*Math.sin(az),Math.cos(ne),Math.sin(ne)*Math.cos(az)];
  const F=(e.farben||KL_BUNT).map(c=>klF(c)), n=Math.round((e.n||160)*QUAL()), W=e.weite||3;
  for(let i=0;i<n;i++){ const d=streu(dir,(e.oeffnung||0.45)*Math.sqrt(Math.random())), s=W*rand(2.2,3.6);
    klPapier(p,[d[0]*s,d[1]*s,d[2]*s],F[i%F.length],{gr:[0.016,0.022],art:'konfetti',dauer:(e.rest&&e.rest.t)||25}); }
  const alt=SCHWEIF; SCHWEIF=0; psBig.emit(p.x,p.y,p.z,0,0,0,1.2,1.1,0.9,0.05,0,0);
  for(let k=0;k<10;k++){ const d=streu(dir,0.3), s=rand(1.5,3); psSmall.emit(p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,1.2,1,0.6,0.1,2,0); } SCHWEIF=alt;
  rauchball({x:p.x,y:p.y+0.1,z:p.z},{r:0.15,n:1,dauer:1.2,steigen:0.2,c:[0.6*klHell()+0.1,0.6*klHell()+0.1,0.62*klHell()+0.1],a:0.3});
  schall(p,v=>{ sfx.plopp(v*1.1,1.8); sfx.snap(v*0.6); });
});

/* Knallbonbon: Riss-Knack, Konfettiwoelkchen links und rechts, eine
   Papierkrone fliegt hoch und trudelt wie ein Blatt herab */
function klKroneGeo(){ return klMat('kronegeo',()=>{
  /* Papierkrone zum Aufsetzen: Oe 16 cm (Katalog 12 cm - vom Pult aus nicht zu sehen) */
  const n=8, R=0.08, pos=[], idx=[];
  for(let i=0;i<=n*2;i++){ const a=i/(n*2)*Math.PI*2, oben=i%2===0?0.065:0.028;
    pos.push(Math.cos(a)*R,0,Math.sin(a)*R, Math.cos(a)*R,oben,Math.sin(a)*R); }
  for(let i=0;i<n*2;i++){ const a=i*2; idx.push(a,a+1,a+2, a+1,a+3,a+2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g; }); }
klEmit('papierkrone',(e,dt,o,t)=>{
  const A=e.A||FW.gold, RT=(e.rest&&e.rest.t)||20;
  if(!e.kr){ const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.03,z:o.z};
    /* das Bonbon reisst: zwei Haelften fliegen auseinander */
    const bm=klMat('bonbon'+e.nr,()=>new THREE.MeshStandardMaterial({color:klFarbe3(A[0],A[1],A[2]).multiplyScalar(0.8),emissive:klFarbe3(A[0]*0.15,A[1]*0.15,A[2]*0.15)}));
    e.haelften=[-1,1].map(sg=>{ const m=new THREE.Mesh(klMat('bonbongeo',()=>new THREE.CylinderGeometry(0.018,0.022,0.07,10)),bm); m.userData.geoFest=true; m.rotation.z=Math.PI/2; m.position.set(p.x+sg*0.035,p.y,p.z); klMesh(e,m); return {m,sg}; });
    const km=new THREE.MeshStandardMaterial({color:klFarbe3(A[0],A[1],A[2]),metalness:0.55,roughness:0.3,emissive:klFarbe3(A[0]*0.45,A[1]*0.45,A[2]*0.45),side:THREE.DoubleSide});
    const kr=new THREE.Mesh(klKroneGeo(),km); kr.userData.geoFest=true; kr.position.set(p.x,p.y,p.z); klMesh(e,kr);
    const H=e.hoch||[2,3], h=rand(H[0],H[1]);
    e.kr={m:kr,p0:p,vy:Math.sqrt(2*9.8*h),pend:rand(0,6),ww:rand(1.8,2.6),boden:null};
    /* zwei Konfettiwoelkchen seitlich */
    const F=KL_BUNT.map(c=>klF(c)), nk=Math.round((e.konfettiSeiten||40)*QUAL());
    for(let i=0;i<nk;i++){ const sg=i%2?1:-1, s=rand(1.2,2.4); klPapier({x:p.x+sg*0.06,y:p.y,z:p.z},[sg*s,rand(0.8,2),rand(-0.6,0.6)],F[i%F.length],{art:'konfetti',dauer:RT}); }
    const alt=SCHWEIF; SCHWEIF=0; psBig.emit(p.x,p.y,p.z,0,0,0,1.1,1,0.8,0.04,0,0); SCHWEIF=alt;
    flash({x:p.x,y:p.y+0.2,z:p.z},FW.weiss,0.5,0.06);
    schall(p,v=>{ sfx.crack(v*0.5); sfx.snap(v*0.8); });
    e.t=4.5+RT; }
  const K=e.kr, m=K.m;
  e.haelften.forEach(h=>{ const u=Math.min(1,t/0.25); h.m.position.x=K.p0.x+h.sg*(0.035+0.09*u); h.m.rotation.y=h.sg*0.5*u; });
  if(!K.boden){
    if(K.vy>0||!K.oben){ /* Wurf: senkrecht, dreht 2 U/s */
      K.vy-=9.8*dt; K.vy*=Math.exp(-0.4*dt); m.position.y+=K.vy*dt; if(K.vy<=0){ K.oben=true; K.to=t; K.x0=m.position.x; K.z0=m.position.z; }
      m.rotation.y+=2*2*Math.PI*dt; }
    else { /* Trudeln: sinkt 1,2 m/s, pendelt seitlich, kippt +-25 Grad */
      const lt=t-K.to, sw=Math.sin(lt*K.ww+K.pend), sink=1.2*Math.min(1,lt*2);
      m.position.y-=sink*dt;
      m.position.x=K.x0+(e.pendel||0.6)*sw*Math.min(1,lt*1.5);
      m.position.z=K.z0+0.25*Math.sin(lt*K.ww*0.5+1)*Math.min(1,lt);
      m.rotation.z=0.44*Math.cos(lt*K.ww+K.pend); m.rotation.y+=2*2*Math.PI*dt*0.6;
      const gy=klGrund(m.position.x,m.position.z);
      if(m.position.y<=gy+0.002){ K.boden=t; m.position.y=gy+0.03; m.rotation.set(Math.PI/2*0.92,m.rotation.y,0); schall(m.position,v=>sfx.klick(v*0.3,0.7)); } } }
  if(e.t<1){ const s=Math.max(0.001,e.t); m.scale.setScalar(s); e.haelften.forEach(h=>h.m.scale.setScalar(s)); }
});

/* Tischbombe: dumpfer Plopp, Spielzeug fliegt hoch und huepft
   (Restitution rest), der Kreisel tanzt 2 s auf der Spitze */
const KL_TEILGEO={
  /* 5-7 cm statt 3-5 cm: vom Pult aus sonst nur Punkte */
  wuerfel:()=>new THREE.BoxGeometry(0.05,0.05,0.05),
  ring:()=>new THREE.TorusGeometry(0.03,0.01,6,16),
  kreisel:()=>{ const g=new THREE.ConeGeometry(0.032,0.06,12); g.rotateX(Math.PI); g.translate(0,0.03,0); return g; },
  kugel:()=>new THREE.SphereGeometry(0.028,12,9)
};
klEmit('ueberraschung',(e,dt,o,t)=>{
  const RT=(e.rest&&e.rest.t)||20, R=e.rest||0.45;
  if(!e.tl){ const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.02,z:o.z}, F=(e.farben||['rot','gold','blau','gruen']).map(c=>klF(c));
    const H=e.hoch||[1.2,2.4];
    e.tl=(e.teile||['wuerfel','ring','kreisel','kugel']).map((art,i)=>{
      const C=F[i%F.length], mat=klMat('spiel'+i%F.length+(e.farben||[]).join(''),()=>new THREE.MeshStandardMaterial({color:klFarbe3(C[0],C[1],C[2]),roughness:0.3,metalness:0.1,emissive:klFarbe3(C[0]*0.5,C[1]*0.5,C[2]*0.5)}));
      const m=new THREE.Mesh(klMat('teil'+art,KL_TEILGEO[art]||KL_TEILGEO.kugel),mat); m.userData.geoFest=true; m.position.set(p.x,p.y,p.z); klMesh(e,m);
      const h=rand(H[0],H[1]), vy=Math.sqrt(2*9.8*h), a=rand(0,6.283), vh=vy*Math.tan(rand(0.05,1)*(e.streu||0.35));
      return {m,art,vx:Math.cos(a)*vh,vz:Math.sin(a)*vh,vy,ax:randDir(),w:rand(8,18),hops:0,ruhe:false,rad:art==='ring'?0.011:art==='kreisel'?0:0.026};
    });
    const alt=SCHWEIF; SCHWEIF=0; psBig.emit(p.x,p.y+0.05,p.z,0,0,0,1.2,1,0.7,0.06,0,0); SCHWEIF=alt;
    rauchball({x:p.x,y:p.y+0.15,z:p.z},{r:0.3,n:2,dauer:2,steigen:0.3,c:[0.6*klHell()+0.1,0.6*klHell()+0.1,0.62*klHell()+0.1],a:0.35});
    flash({x:p.x,y:p.y+0.3,z:p.z},FW.gold,0.8,0.12);
    schall(p,v=>sfx.plopp(v*1.5,0.7));
    e.t=5+RT; }
  const q=new THREE.Quaternion(), ax=new THREE.Vector3();
  for(const s of e.tl){ const m=s.m;
    if(!s.ruhe){
      s.vy-=9.8*dt; m.position.x+=s.vx*dt; m.position.y+=s.vy*dt; m.position.z+=s.vz*dt;
      ax.set(s.ax[0],s.ax[1],s.ax[2]); q.setFromAxisAngle(ax,s.w*dt); m.quaternion.premultiply(q);
      const gy=klGrund(m.position.x,m.position.z)+s.rad+0.001;
      if(m.position.y<=gy&&s.vy<0){ m.position.y=gy;
        if(s.hops<(e.huepf||3)&&-s.vy>0.6){ s.hops++; s.vy=-s.vy*R; s.vx*=0.6; s.vz*=0.6; s.w*=0.6; schall(m.position,v=>sfx.klick(v*0.35,0.5+Math.random()*0.4)); }
        else { s.ruhe=t;
          /* Ruhelage: Kreisel auf der Spitze, Ring flach, Wuerfel auf einer Seite */
          if(s.art==='ring') m.rotation.set(Math.PI/2,rand(0,6),0); else m.rotation.set(0,rand(0,6),0);
          if(s.art==='kreisel') m.position.y=klGrund(m.position.x,m.position.z)+0.001; } } }
    else if(s.art==='kreisel'){ const lt=t-s.ruhe;
      if(lt<2){ m.rotation.y+=dt*(30-lt*8); m.rotation.x=0.08*Math.sin(t*9); m.rotation.z=0.08*Math.cos(t*9); }
      else if(lt<2.3) m.rotation.x=Math.min(1.15,(lt-2)/0.3*1.15); }
    if(e.t<1) m.scale.setScalar(Math.max(0.001,e.t)); }
});
/* Konfettisaeule der Tischbombe: eng und senkrecht */
klEmit('konfettisaeule',(e,dt,o,t)=>{
  if(e.los) return; e.los=1; e.t=1;
  const p={x:o.x,y:o.y+0.05,z:o.z}, n=Math.round((e.n||180)*QUAL());
  for(let i=0;i<n;i++){ const d=streu([0,1,0],(e.eng||0.2)*Math.sqrt(Math.random())), s=rand(8,13.5);
    klPapier(p,[d[0]*s,d[1]*s,d[2]*s],klF(KL_BUNT[i%KL_BUNT.length]),{art:'konfetti',dauer:(e.rest&&e.rest.t)||20,flatter:0.45}); }
});

/* Luftschlangen: Baender, die sich im Flug aus einer engen Locke zur
   lockeren Schraube entrollen, schwingend sinken und als Kringel liegen */
klEmit('luftschlange',(e,dt,o,t)=>{
  const RT=(e.rest&&e.rest.t)||20, NP=24, BR=0.015;
  if(!e.bd){ const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.05,z:o.z}, F=(e.farben||KL_BUNT).map(c=>klF(c)), H=klHell();
    const LL=e.laenge||[1.2,2.2], ST=e.steig||[4.5,6.5], LK=e.locken||[3,6];
    e.bd=[];
    for(let i=0;i<(e.n||14);i++){
      const pos=new Float32Array(NP*2*3), idx=[]; for(let j=0;j<NP-1;j++){ const a=j*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx);
      const C=F[i%F.length], m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:klFarbe3(C[0]*H,C[1]*H,C[2]*H),side:THREE.DoubleSide,toneMapped:false}));
      m.frustumCulled=false; klMesh(e,m);
      const a=rand(0,6.283), ne=rand(0.05,0.4), v=rand(ST[0],ST[1])*1.22;
      e.bd.push({m,g,C,L:rand(LL[0],LL[1]),N:rand(LK[0],LK[1]),h:{x:p.x,y:p.y,z:p.z},v:[Math.sin(ne)*Math.cos(a)*v,Math.cos(ne)*v,Math.sin(ne)*Math.sin(a)*v],ph:rand(0,6),dreh:rand(-3,3),start:rand(0,0.12),liegt:null}); }
    /* Knack mit einem kleinen Goldglitzer aus der Roehre */
    const alt=SCHWEIF; SCHWEIF=0.06; psBig.emit(p.x,p.y,p.z,0,0,0,1.2,1.1,0.8,0.05,0,0);
    for(let k=0;k<Math.round(40*QUAL());k++){ const d=streu([0,1,0],0.5), s=rand(2,4.5); glint(psSmall,p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,FW.gold,2,{t0:0.3,t1:0.9,dim:0.6}); }
    SCHWEIF=alt;
    flash({x:p.x,y:p.y+0.3,z:p.z},FW.gold,0.6,0.08); schall(p,v=>{ sfx.crack(v*0.7); sfx.plopp(v*0.8,1.3); });
    e.t=9+RT; }
  const ax=[0,0,0];
  for(const b of e.bd){ const lt=t-b.start; if(lt<0) continue;
    const pos=b.g.attributes.position.array, u=clamp(lt/0.6,0,1), H=b.h;
    if(!b.liegt){
      /* Flug des Kopfes: gebremst, sinkt hoechstens 0,5 m/s */
      b.v[1]=Math.max(b.v[1]-9.8*dt-0.35*b.v[1]*dt,-0.5); b.v[0]*=Math.exp(-0.9*dt); b.v[2]*=Math.exp(-0.9*dt);
      H.x+=b.v[0]*dt; H.y+=b.v[1]*dt; H.z+=b.v[2]*dt;
      const sp=Math.hypot(b.v[0],b.v[1],b.v[2]);
      /* Achse: im Steigen hinter dem Kopf her, im Sinken haengend */
      ax[0]=-b.v[0]*sp*0.3; ax[1]=-b.v[1]*sp*0.3-1.5; ax[2]=-b.v[2]*sp*0.3; const al=Math.hypot(ax[0],ax[1],ax[2]); ax[0]/=al; ax[1]/=al; ax[2]/=al;
      const Rf=b.L*0.785/(2*Math.PI*b.N), R=0.02+(Rf-0.02)*u, E=(0.03+0.62*u)*b.L, N=Math.sqrt(Math.max(0,b.L*b.L-E*E))/(2*Math.PI*R);
      /* e1, e2 senkrecht zur Achse */
      let e1=[ax[1],-ax[0],0]; if(Math.abs(ax[2])<0.9) e1=[-ax[2]*0,ax[2],-ax[1]]; let l1=Math.hypot(e1[0],e1[1],e1[2])||1; e1=[e1[0]/l1,e1[1]/l1,e1[2]/l1];
      const e2=[ax[1]*e1[2]-ax[2]*e1[1],ax[2]*e1[0]-ax[0]*e1[2],ax[0]*e1[1]-ax[1]*e1[0]];
      let tief=H.y;
      for(let j=0;j<NP;j++){ const s=j/(NP-1), th=2*Math.PI*N*s+b.dreh*lt+b.ph, sw=(e.schwing||0.4)*s*Math.sin(lt*2.4+s*4+b.ph)*u;
        const cx=H.x+ax[0]*E*s+(e1[0]*Math.cos(th)+e2[0]*Math.sin(th))*R+sw, cy=H.y+ax[1]*E*s+(e1[1]*Math.cos(th)+e2[1]*Math.sin(th))*R, cz=H.z+ax[2]*E*s+(e1[2]*Math.cos(th)+e2[2]*Math.sin(th))*R;
        const k=j*6; pos[k]=cx-ax[0]*BR/2; pos[k+1]=cy-ax[1]*BR/2; pos[k+2]=cz-ax[2]*BR/2; pos[k+3]=cx+ax[0]*BR/2; pos[k+4]=cy+ax[1]*BR/2; pos[k+5]=cz+ax[2]*BR/2;
        if(cy<tief) tief=cy; }
      if(b.v[1]<0&&tief<=klGrund(H.x,H.z)+0.01){ b.liegt=t; b.von=Float32Array.from(pos); b.gy=klGrund(H.x,H.z); b.cx=H.x; b.cz=H.z; } }
    else { /* legt sich als Kringel flach auf den Boden */
      const w=clamp((t-b.liegt)/0.8,0,1), ww=w*w*(3-2*w);
      for(let j=0;j<NP;j++){ const s=j/(NP-1), ph=2*Math.PI*b.N*0.8*s+b.ph, r=0.05+0.14*s, x=b.cx+Math.cos(ph)*r, z=b.cz+Math.sin(ph)*r, y=b.gy+0.004;
        const dx=Math.cos(ph)*BR/2, dz=Math.sin(ph)*BR/2, k=j*6, Z=[x-dx,y,z-dz,x+dx,y,z+dz];
        for(let c=0;c<6;c++) pos[k+c]=b.von[k+c]+(Z[c]-b.von[k+c])*ww; } }
    b.g.attributes.position.needsUpdate=true;
    if(e.t<1) b.m.visible=e.t>0.02; }
});

/* Tischfeuerwerk: Plopp, ein hohler Schirm aus Kaltfunken in drei
   Farbringen (Ausstosswinkel bestimmt den Ring), fallen nach aussen */
klEmit('funkenschirm',(e,dt,o,t)=>{
  if(e.los) return; e.los=1; e.t=0.1;
  const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.02,z:o.z}, RG=(e.ringe||['gold']).map(c=>klF(c)), n=Math.round((e.n||120)*QUAL()), h=e.h||1.2, g=3;
  const vy=vFuerHoehe(h,g), alt=SCHWEIF;
  /* Winkel gegen die Senkrechte: 40-55 Grad im Katalog; mit dem Luftwiderstand
     der Funken ergab das einen 7 m breiten Teller - 16-30 Grad halten die
     Kuppel bei 1,6 m Hoehe und gut 1,5 m Radius (Probebild) */
  for(let i=0;i<n;i++){ const az=i/n*Math.PI*2*7.3+rand(-0.05,0.05), u=Math.random(), th=(16+14*u)*Math.PI/180;
    const ring=RG[Math.min(RG.length-1,Math.floor(u*RG.length))], vh=vy*Math.tan(th)*rand(0.95,1.05), l=(typeof e.tt==='number'?e.tt:2.4)*rand(0.85,1.05);
    glint(psMid,p.x,p.y,p.z,Math.cos(az)*vh,vy*rand(0.97,1.03),Math.sin(az)*vh,ring,g,{tz:l,dim:0.7,blitz:2.2,spur:0.12}); }
  SCHWEIF=0; psBig.emit(p.x,p.y+0.05,p.z,0,0,0,1,0.95,0.8,0.05,0,0); SCHWEIF=alt;
  flash({x:p.x,y:p.y+0.8,z:p.z},RG[0],0.9,0.3);
  schall(p,v=>{ sfx.plopp(v*1.2,1.2); later(0.2,()=>sfx.fizz(v*0.45)); });
});

/* ---------------------------------------------------------
   Boeller
   --------------------------------------------------------- */
/* Blitzknaller: 2 Bilder Szene weiss, danach ein violett-gruener
   Nachbild-Fleck am Bildschirmort des Blitzes (klebt am Bildschirm) */
function klNachbild(p,nb){
  if(typeof document==='undefined'||typeof camera==='undefined') return;
  const v=new THREE.Vector3(p.x,p.y,p.z).project(camera);
  if(v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1) return;
  const A=klF(nb.A,FW.violett), B=klF(nb.B,FW.gruen), W=innerWidth, H=innerHeight, d=Math.round(H*0.06*2.2);
  const el=document.createElement('div'), cs=c=>`rgba(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)}`;
  el.style.cssText=`position:fixed;left:${Math.round((v.x+1)/2*W-d/2)}px;top:${Math.round((1-v.y)/2*H-d/2)}px;width:${d}px;height:${d}px;border-radius:50%;pointer-events:none;z-index:4;mix-blend-mode:screen;`+
    `background:radial-gradient(circle,${cs(A)},0.75) 0%,${cs(A)},0.5) 35%,${cs(B)},0.35) 60%,${cs(B)},0) 72%);opacity:1;transform:scale(1);transition:opacity ${nb.t||0.8}s ease-in, transform ${nb.t||0.8}s ease-in`;
  document.body.appendChild(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.opacity='0'; el.style.transform='scale(0.45)'; }));
  later((nb.t||0.8)+0.3,()=>el.remove());
}
klEmit('blendung',(e,dt,o,t)=>{
  if(e.los) return; e.los=1; e.t=0.1;
  const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.15,z:o.z}, v=distVol(p), alt=SCHWEIF;
  bildBlitz(Math.min(1,0.25+0.2*(e.hell||4)*v),0.07);
  flash(p,FW.weiss,e.hell||4,0.09);
  SCHWEIF=0; psHuge.emit(p.x,p.y,p.z,0,0,0,3,3,3,0.07,0,0);
  for(let k=0;k<30;k++){ const d=randDir(), s=rand(3,6); psSmall.emit(p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,2,2,2,0.06,0,0); }
  /* glimmende Huellenfetzchen rieseln nach */
  for(let k=0;k<Math.round(40*QUAL());k++){ const d=randDir(), s=rand(0.8,2.5); psSmall.emit(p.x,p.y,p.z,d[0]*s,Math.abs(d[1])*s+0.5,d[2]*s,0.9,0.45,0.12,rand(0.8,1.6),2.5,0); } SCHWEIF=alt;
  if(e.nachbild) later(0.07,()=>klNachbild(p,e.nachbild));
  rauchball({x:p.x,y:p.y,z:p.z},{r:0.2,n:1,dauer:1.5,steigen:0.2,c:[0.6*klHell()+0.1,0.6*klHell()+0.1,0.62*klHell()+0.1],a:0.3});
  /* trocken: Crack mit kurzem Nachhall, lauter als die Erbse, leiser als Monster */
  schall(p,v2=>{ sfx.crack(v2*1.6); sfx.startknall(v2*0.8); later(0.13,()=>sfx.crack(v2*0.35)); });
  shake=Math.max(shake,0.18*v);
});

/* Knallteppich: Chinakette als S-Kurve am Boden, die Zuendung laeuft
   entlang, immer schneller; rote Fetzen fliegen, der Rest peitscht,
   am Ende drei dicke Kracher */
klEmit('knallkette',(e,dt,o,t)=>{
  const NK=e.knalle||60, NG=NK*2;
  if(!e.pf){ const g=klVorne(o,0.85), L=e.laenge||2.6;
    /* S-Kurve: zwei Boegen, vom Tisch zum Pult hin */
    const roh=[]; for(let i=0;i<=80;i++){ const s=i/80; roh.push([g.x+0.42*Math.sin(2*Math.PI*s),g.z+s*1.9]); }
    const P=klPfad(roh), f=L/P.L; e.pf=P; e.g=g; e.sk=f;
    const geo=klMat('gliedgeo',()=>new THREE.BoxGeometry(0.016,0.012,0.028)), H=klHell();
    e.im=new THREE.InstancedMesh(geo,klMat('glied',()=>new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false})),NG); e.im.userData.geoFest=true; e.im.frustumCulled=false; klMesh(e,e.im);
    e.gl=[]; for(let i=0;i<NG;i++){ const u=i/(NG-1), [x,z]=klPfadOrt(P,u), [x2,z2]=klPfadOrt(P,Math.min(1,u+0.01)); e.gl.push({x,z,a:Math.atan2(x2-x,z2-z),u,hop:0});
      if(e.im.setColorAt) e.im.setColorAt(i,klFarbe3(0.75*H+0.08,0.08,0.06)); }
    /* Zuendzeiten: Abstand linear von gap auf gapEnde */
    e.z=[0]; for(let i=1;i<NK;i++) e.z.push(e.z[i-1]+(e.gap||0.12)+((e.gapEnde||0.045)-(e.gap||0.12))*i/(NK-1));
    const S=e.schluss||{knalle:3,gap:0.35}; e.ende=e.z[NK-1]+0.3; e.S=S; e.nr=0; e.sn=0; e.t=e.ende+S.knalle*S.gap+1.5; }
  const P=e.pf, g=e.g, M=new THREE.Matrix4(), Q=new THREE.Quaternion(), V=new THREE.Vector3(), SC=new THREE.Vector3(1,1,1), SC0=new THREE.Vector3(0.0001,0.0001,0.0001), Y=new THREE.Vector3(0,1,0);
  const alt=SCHWEIF, v0=distVol(g);
  while(e.nr<NK&&t>=e.z[e.nr]){ const u=e.nr/(NK-1), [x,z]=klPfadOrt(P,u), p={x,y:g.y+0.02,z};
    SCHWEIF=0; psBig.emit(x,p.y+0.03,z,0,0,0,1.5,1.2,0.7,0.04,0,0);
    for(let k=0;k<6;k++){ const d=randDir(), s=rand(1.5,3); psSmall.emit(x,p.y,z,d[0]*s,Math.abs(d[1])*s,d[2]*s,1.3,1.0,0.5,rand(0.08,0.15),3,0); }
    for(let k=0;k<4;k++){ const d=randDir(), s=rand(0.6,1.5); psSmall.emit(x,p.y,z,d[0]*s,Math.abs(d[1])*s+1,d[2]*s,0.8,0.3,0.08,rand(0.6,1.1),3,0); }
    SCHWEIF=alt; flash({x,y:p.y+0.25,z},FW.bernstein,0.5,0.06);
    const nP=Math.round((e.papierN||14)*QUAL()), PC=klF(e.papier,FW.rot);
    for(let k=0;k<nP;k++){ const a=rand(0,6.283), s=rand(0.5,1.6); klPapier({x,y:p.y+0.02,z},[Math.cos(a)*s,rand(3,5.5),Math.sin(a)*s],[PC[0]*rand(0.8,1),PC[1],PC[2]],{gr:[0.03,0.04],art:'papier',sink:rand(0.9,1.3),dauer:(e.rest&&e.rest.t)||30}); }
    if(e.nr%3===0) rauchball({x,y:p.y+0.1,z},{r:rand(0.35,0.5),n:1,dauer:7,quellen:1.5,steigen:0.04,c:[0.55*klHell()+0.12,0.55*klHell()+0.12,0.57*klHell()+0.12],a:0.32,wind:[0.07,0.03]});
    schall(p,v=>sfx.crack(v*rand(0.55,0.8)));
    /* der Rest der Kette peitscht: die naechsten 0,3 m springen */
    for(const gl of e.gl){ const du=(gl.u-u)*P.L*e.sk; if(du>0&&du<0.3) gl.hop=Math.max(gl.hop,rand((e.peitsche||[0.05,0.15])[0],(e.peitsche||[0.05,0.15])[1])*(1-du/0.3)); }
    e.nr++; }
  /* drei dicke Schlusskracher am Ende der Kette */
  while(e.sn<e.S.knalle&&t>=e.ende+e.sn*e.S.gap){ const [x,z]=klPfadOrt(P,1), p={x,y:g.y+0.03,z};
    SCHWEIF=0; psHuge.emit(x,p.y+0.1,z,0,0,0,1.4,1.1,0.6,0.08,0,0);
    for(let k=0;k<30;k++){ const d=randDir(), s=rand(3,6); psSmall.emit(x,p.y,z,d[0]*s,Math.abs(d[1])*s,d[2]*s,1.4,1.1,0.55,rand(0.12,0.25),4,0); }
    SCHWEIF=alt; flash({x,y:p.y+0.4,z},klF(e.S.flash,FW.bernstein),1.5,0.12);
    rauchball({x,y:p.y+0.2,z},{r:0.7,n:2,dauer:6,quellen:1,steigen:0.15,c:[0.55*klHell()+0.12,0.55*klHell()+0.12,0.57*klHell()+0.12],a:0.38,wind:[0.07,0.03]});
    schall(p,v=>{ sfx.boom(v*0.55); sfx.crack(v); }); shake=Math.max(shake,0.25*v0); e.sn++; }
  /* Glieder zeichnen: abgebrannte weg, springende gehoben */
  const ub=e.nr>0?(e.nr-1)/(NK-1):-1;
  for(let i=0;i<NG;i++){ const gl=e.gl[i];
    if(gl.u<=ub+1e-6){ M.compose(V.set(gl.x,-5,gl.z),Q,SC0); e.im.setMatrixAt(i,M); continue; }
    gl.hop=Math.max(0,gl.hop-dt*0.9);
    Q.setFromAxisAngle(Y,gl.a); M.compose(V.set(gl.x,g.y+0.006+gl.hop*Math.abs(Math.sin(t*25+i)),gl.z),Q,SC); e.im.setMatrixAt(i,M); }
  e.im.instanceMatrix.needsUpdate=true;
  /* Zuendfunke an der Brennstelle */
  if(e.nr<NK){ const [x,z]=klPfadOrt(P,Math.max(0,ub)); SCHWEIF=0; psSmall.emit(x,g.y+0.02,z,rand(-.5,.5),rand(0.3,1),rand(-.5,.5),1.3,0.8,0.3,0.15,3,0); SCHWEIF=alt; }
});

/* Goldstaub: Knall, 400 Koerner stehen als Wolke und glimmen; jedes
   blitzt genau einmal auf, die Welle laeuft von oben nach unten */
klEmit('goldstaub',(e,dt,o,t)=>{
  if(e.los) return; e.los=1; e.t=0.2;
  const sf=klFlaeche(o), p0={x:o.x,y:Math.max(o.y,sf)+0.05,z:o.z}, h=e.h||3, r=e.r||1.2, n=Math.round((e.n||400)*QUAL());
  const G=klF(e.glut,FW.bernstein), A=klF(e.A,FW.gold), B=klF(e.B,FW.zitrone), BL=e.blitz||{von:0.3,bis:1.6,dauer:0.04}, RI=e.riesel||2.5;
  const mitte={x:p0.x,y:p0.y+0.35+h*0.5,z:p0.z}, v=distVol(p0), alt=SCHWEIF;
  /* Knall */
  SCHWEIF=0; psHuge.emit(p0.x,p0.y+0.2,p0.z,0,0,0,1.4,1.1,0.5,0.08,0,0); SCHWEIF=alt;
  smallPop(p0.x,p0.y,p0.z,40,5,0.35,FW.gold);
  flash({x:p0.x,y:p0.y+1,z:p0.z},FW.bernstein,1.6,0.25);
  schall(p0,vv=>{ sfx.boom(vv*0.8); later(0.3,()=>sfx.rieseln(vv*1.4,RI)); }); shake=Math.max(shake,0.3*v);
  for(let i=0;i<n;i++){
    const d=randDir(), f=Math.cbrt(Math.random()), tg={x:mitte.x+d[0]*r*f,y:mitte.y+d[1]*h*0.5*f,z:mitte.z+d[2]*r*f};
    const yr=clamp((tg.y-(mitte.y-h/2))/h,0,1), tb=BL.von+(1-yr)*(BL.bis-BL.von)+rand(-0.08,0.08), C=Math.random()<0.6?A:B;
    fuehre(psSmall,p0.x,p0.y,p0.z,0,0,0,G,tb+RI*rand(0.7,1),(s,dt2)=>{
      const a=s.alter;
      if(a<0.3){ const u=a/0.3, k=1-Math.pow(1-u,3); s.p[0]=p0.x+(tg.x-p0.x)*k; s.p[1]=p0.y+(tg.y-p0.y)*k; s.p[2]=p0.z+(tg.z-p0.z)*k; s.hell=0.5; }
      else if(a<tb){ s.p[1]-=0.15*dt2; s.p[0]+=Math.sin(a*2+i)*0.02*dt2; s.hell=0.3*(0.8+0.4*Math.sin(a*7+i)); }
      else { if(!s.d.bl){ s.d.bl=1; const q=SCHWEIF; SCHWEIF=0;
          psMid.emit(s.p[0],s.p[1],s.p[2],0,-0.1,0,C[0]*1.5,C[1]*1.5,C[2]*1.5,BL.dauer+0.02,0,0);
          psSmall.emit(s.p[0],s.p[1],s.p[2],0,-0.1,0,2,2,1.9,BL.dauer,0,0); SCHWEIF=q; }
        s.p[1]-=0.45*dt2; s.hell=0.12*Math.max(0,1-(a-tb)/RI); }
      s.v[0]=0; s.v[1]=0; s.v[2]=0; s.c=G; },{}); }
});

/* Farbrauch: Schlag mit Farbblitz, eine Pigmentkugel quillt auf,
   rollender Wulst, steigt, haelt 10 s, zieht mit dem Wind ab;
   Farbe je Zuendung der Reihe nach (farbRotation) */
klEmit('farbrauchkugel',(e,dt,o,t)=>{
  if(e.los) return; e.los=1; e.t=0.2;
  const FR=e.farbRotation||['rot'], Z=(typeof S!=='undefined'&&S)?(S.fwZaehler=S.fwZaehler||{}):(KLEIN.zaehler=KLEIN.zaehler||{});
  const z=Z[e.prod]|0; Z[e.prod]=z+1; const C=klF(FR[z%FR.length]);
  const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.1,z:o.z}, v=distVol(p), R0=(e.r||[0.5,4])[0], R1=(e.r||[0.5,4])[1]*0.55, QU=e.quellen||1.5, HA=e.halten||10;
  const wind=e.wind?[rand(0.35,0.6),rand(-0.2,0.2)]:[0,0], dauer=HA+6, alt=SCHWEIF;
  SCHWEIF=0; psHuge.emit(p.x,p.y+0.3,p.z,0,0,0,C[0]*1.5+0.3,C[1]*1.5+0.3,C[2]*1.5+0.3,0.1,0,0); SCHWEIF=alt;
  smallPop(p.x,p.y,p.z,50,6,0.4,C);
  { const a=SCHWEIF; SCHWEIF=0.06; for(let k=0;k<Math.round(70*QUAL());k++){ const d=randDir(), s=rand(2,5); psMid.emit(p.x,p.y+0.2,p.z,d[0]*s,Math.abs(d[1])*s+1,d[2]*s,C[0]*0.8,C[1]*0.8,C[2]*0.8,rand(0.7,1.4),4,0); } SCHWEIF=a; }
  flash({x:p.x,y:p.y+1,z:p.z},C,1.8,0.2);
  schall(p,vv=>{ sfx.boom(vv*0.9); sfx.wumms(vv*0.5); }); shake=Math.max(shake,0.35*v);
  const n=Math.round(30+10*QUAL()), teile=[], b=[];
  for(let i=0;i<n;i++){ const sp=wolkenSprite(false); teile.push(sp); const d=randDir();
    b.push({sp,d,f:0.55+0.45*Math.cbrt(Math.random()),gr:rand(0.7,1.15),rw:rand(0.25,0.5)*(Math.random()<0.5?-1:1),hell:rand(0.82,1.08)}); }
  wolke(dauer,teile,(w,tt)=>{
    const u=Math.min(1,tt/QU), r=R0+(R1-R0)*(1-Math.pow(1-u,2.2)), H=klHell();
    const blitz=tt<0.3?1+2.5*(1-tt/0.3):1, ab=Math.max(0,tt-HA), dx=wind[0]*ab, dz=wind[1]*ab;
    const dicht=clamp(Math.min(1,tt/0.12)*(1-glatt(HA,dauer,tt)),0,1), bleich=glatt(HA,dauer,tt)*0.45;
    for(const k of b){
      /* rollender Wulst: jede Ballung wandert langsam um die waagrechte Achse */
      const a=k.rw*tt, ca=Math.cos(a), sa=Math.sin(a), dy=k.d[1]*ca-k.d[2]*sa, dz2=k.d[1]*sa+k.d[2]*ca;
      const x=p.x+k.d[0]*r*k.f+dx, y=p.y+r*0.95+dy*r*k.f*0.9+(e.steig||0.3)*Math.min(tt,HA)+0.15*ab, zz=p.z+dz2*r*k.f+dz;
      const L=Math.min(1.4,H*k.hell*(0.75+0.25*(0.5+0.5*dy))*blitz), c=klMisch(C,[0.6,0.6,0.62],bleich);
      wSetz(k.sp,x,y,zz,r*0.95*k.gr*(1+0.08*Math.sin(tt*1.3+k.rw*9)),[Math.min(1,c[0]*L),Math.min(1,c[1]*L),Math.min(1,c[2]*L)],0.85*dicht); } });
});

/* Die drei abgenommenen Boeller - Ablauf 1:1 wie vorher (14b) */
KLEIN_ALT.furzboeller=o=>{ const v=distVol(o), yb=o.y!==undefined?o.y:0.4;
  smallPop(o.x,yb,o.z,36,4,0.5,FW.senf);
  flash({x:o.x,y:yb+0.4,z:o.z},FW.sumpf,1.1,0.3);
  /* braune Spritzer, die kurz hochfliegen und zurueckfallen */
  for(let i=0;i<Math.round(60*QUAL());i++){ const a=Math.random()*Math.PI*2, w=rand(0.5,2.2), c=i%3?FW.braun:FW.sumpf;
    psMid.emit(o.x,yb+0.1,o.z,Math.cos(a)*w,rand(2,5),Math.sin(a)*w,c[0],c[1],c[2],rand(0.9,1.6),7,0); }
  sfx.pups(v); furzwolke({x:o.x,y:yb,z:o.z});
  shake=Math.max(shake,0.25*v); };
KLEIN_ALT.monsterknall=o=>monsterknall({x:o.x,y:o.y!==undefined?o.y:0.4,z:o.z});
KLEIN_ALT.atomboeller=o=>shot(o,{pw:2,sz:1,eff:'atom',fuse:2.2,dick:2,trail:FW.orange,A:FW.orange,B:FW.gold,ang:0.36,dir:Math.PI});

/* =========================================================
   Drehbuecher (katalog-klein.md, 26.09., Tom: Anomalie).
   Steigerung: L1-3 handgross und leise, L4-6 Bewegung am Boden,
   L8-9 Flaeche, ab L11 Wolken und Licht ueber dem ganzen Platz.
   ========================================================= */
Object.assign(KLEIN,{
  /* L1 */
  knallerbsen:{stueck:7,lunte:0,dauer:5,
    /* Wurf zum Pult hin statt weg: hinter dem Tisch saehe man die Aufschlaege vom Pult aus nicht */
    phasen:[{k:'wurferbse',at:0,n:7,takt:[0.35,0.2,0.5,0.25,0.4,0.3,0.3],weite:[1.5,3.5],bogenH:[0.6,1.4],streu:0.5,A:'weiss',B:'rose',nachzuegler:{nr:6,verz:1.3}}],
    rest:{k:'bodenrest',art:'fleck',t:10}},
  partypopper:{stueck:3,lunte:0,dauer:6,
    phasen:[{k:'konfettistrahl',folge:[{at:0.3,x:0,neig:0.25,azi:0},{at:1.0,x:-0.25,neig:0.7,azi:-0.6},{at:1.6,x:0.25,neig:0.7,azi:0.6}],
      n:160,oeffnung:0.45,weite:3,farben:['rot','gold','gruen','blau','magenta','tuerkis','zitrone']}],
    rest:{k:'bodenrest',art:'konfetti',t:25}},
  tisch:{stueck:1,lunte:0.6,dauer:5,
    phasen:[{k:'funkenschirm',at:0,h:1.6,n:180,ringe:['gold','magenta','tuerkis'],t:2.4},
            {k:'funkenschirm',at:0.7,h:0.9,n:70,ringe:['zitrone'],t:1.6}]},
  wunder:{stueck:1,lunte:0,dauer:22,
    phasen:[{k:'wunderkerze',at:0,t:20,laenge:0.5,material:'eisen',A:'gold',B:'bernstein',verzweig:1,n:7,nachglut:true,endperle:true}]},
  wunderfarbe:{stueck:4,lunte:0,dauer:20,
    /* x leicht versetzt: die naechste Kerze uebernimmt neben der vorigen */
    phasen:[{k:'farbspitze',material:'farbspitze',laenge:0.35,t:5,A:'gold',spitze:0.3,
      folge:[{at:0,B:'rot',x:-0.09},{at:4.4,B:'gruen',x:-0.03},{at:8.8,B:'blau',x:0.03},{at:13.2,B:'magenta',x:0.09}]}]},
  /* L2 */
  wunderherz:{stueck:1,lunte:0,dauer:10,
    phasen:[{k:'herzdraht',form:'herz',at:0,t:7,groesse:0.35,start:'spitze',fronten:2,A:'rose',B:'gold',glut:'rot',treffen:{flash:'weiss',funken:60},nachglut:1.8}]},
  knallbonbon:{stueck:4,lunte:0,dauer:9,
    phasen:[{k:'papierkrone',hoch:[2,3],pendel:0.6,konfettiSeiten:40,
      folge:[{at:0.4,x:-0.3,A:'gold'},{at:2.2,x:0.3,A:'silber'},{at:4.0,x:-0.1,A:'rot'},{at:5.6,x:0.1,A:'blau'}]}],
    rest:{k:'bodenrest',art:'krone',t:20}},
  knallfrosch:{stueck:1,lunte:1.0,dauer:6,
    phasen:[{k:'huepfer',at:0,knalle:9,takt:[0.35,0.3,0.45,0.25,0.3,0.5,0.28,0.35],sprung:[0.4,1.2],hoehe:[0.15,0.45],dreh:[0.8,2.2],spur:'bernstein',
      letzter:{hoehe:1.1,doppel:true,ueberschlag:true}}]},
  pharao:{stueck:4,lunte:0,dauer:16,
    phasen:[{k:'ascheschlange',at:0,n:4,versatz:0.8,t:14,laenge:[0.25,0.45],dicke:0.035,winden:{amp:0.06,wellen:1.5},glut:'orange',rauch:true,anordnung:'rhombus',
      koenig:{nr:2,dicke:1.6,aufbaeumen:0.1}}]},
  tischbombe:{stueck:1,lunte:1.0,dauer:7,
    phasen:[{k:'ueberraschung',at:0,teile:['wuerfel','ring','kreisel','kugel','wuerfel','ring','kugel','kreisel'],hoch:[1.2,2.4],streu:0.35,huepf:3,rest:0.45,farben:['rot','gold','blau','gruen']},
            /* Katalog: k:'konfetti' - eigener Name, weil konfetti() schon der alte Schwall ist */
            {k:'konfettisaeule',at:0,n:180,h:5.5,eng:0.2}],
    rest:{k:'bodenrest',art:'spielzeug',t:20}},
  bengalholz:{stueck:4,lunte:0,dauer:14,
    phasen:[{k:'zuendholz',t:4,stich:0.25,glimm:1.0,
      folge:[{at:0,x:-0.15,z:-0.08,A:'rot'},{at:3.0,x:0.15,z:0.08,A:'gruen'},{at:6.0,x:-0.05,z:0.08,A:'rot'},{at:9.0,x:0.05,z:-0.08,A:'gruen'}]}]},
  /* L3 */
  wunderzahl:{stueck:4,lunte:0,dauer:12,
    phasen:[{k:'glutschrift',form:['2','0','2','7'],abstand:0.16,groesse:0.25,at:0,t:6.5,versatz:0.4,start:'strich',fronten:1,A:'gold',B:'zitrone',glut:'gold',nachglut:3.0,
      schluss:{at:7.8,funkeln:1.0}}]},
  /* L4 */
  boeller:{stueck:1,lunte:1.2,dauer:5,phasen:[{k:'alt',fn:'furzboeller'}]},
  luftschlangentisch:{stueck:1,lunte:0.8,dauer:9,
    phasen:[{k:'luftschlange',at:0,n:14,laenge:[1.2,2.2],steig:[4.5,6.5],locken:[3,6],schwing:0.4,farben:['rot','gold','gruen','blau','magenta','tuerkis']}],
    rest:{k:'bodenrest',art:'band',t:20}},
  /* L5 */
  blitzknaller:{stueck:1,lunte:1.0,dauer:3,
    phasen:[{k:'blendung',at:0,hell:4.0,schatten:true,nachbild:{t:0.8,A:'violett',B:'gruen'},knall:'trocken'}]},
  bodenkreisel:{stueck:6,lunte:0,dauer:10,
    phasen:[{k:'brummkreisel',at:0,n:6,zuend:'mitte',gap:0.4,t:7,umdreh:[4,14],drift:0.25,ton:{hz:[90,320],groesse:true},
      farbFolge:[['rot','gruen'],['zitrone','blau'],['magenta','limette'],['orange','tuerkis'],['violett','gold'],['rose','mint']],
      wechselBei:[0.35,0.7],finale:{k:'knistern',A:'silber',t:1.2,umfallen:true}}]},
  leuchtstaebe:{stueck:6,lunte:0,dauer:16,
    phasen:[{k:'wechselflamme',at:0,n:6,anordnung:'faecher',ang:0.35,zuend:'mitte',gap:0.5,t:12,farben:['magenta','limette','tuerkis','weiss'],wechselBei:[3,6,9],sync:true,puff:true}]},
  schwaermer:{stueck:6,lunte:0.8,dauer:8,
    phasen:[{k:'bodenflitzer',at:0,n:6,takt:[0.15,0.15,0.6],start:'v',ang:0.6,v:[5,8],haken:[0.18,0.4],winkel:[0.45,0.9],t:[2.2,3.2],hoehe:[0.1,0.3],
      spur:'gold',kopf:['weiss','rot','gruen','weiss','rot','gruen'],ende:'knall'}]},
  stroboblinker:{stueck:4,lunte:0,dauer:15,
    phasen:[{k:'blitzturm',at:0,t:13,pos:'quadrat',a:0.4,gap:0.6,toepfe:[{A:'weiss',hz:9},{A:'rot',hz:3},{A:'gruen',hz:5},{A:'zitrone',hz:2}],
      endspurt:{at:10,hz:14,t:2,dauerlicht:1.0,ende:'ploppaus'}}]},
  /* L6 */
  wunderkerzeXXL:{stueck:1,lunte:0,dauer:32,
    phasen:[{k:'wunderkerze',at:0,t:30,laenge:1.0,material:'titan',A:'weiss',B:'silber',weite:2.0,dichte:2.2,verzweig:0,
      glutperle:{alle:[0.8,1.6],A:'orange',huepf:1,spritz:6}}]},
  /* L8 */
  knallteppich:{stueck:1,lunte:1.2,dauer:9,
    phasen:[{k:'knallkette',at:0,form:'s',laenge:2.6,knalle:60,gap:0.12,gapEnde:0.045,papier:'rot',papierN:14,peitsche:[0.05,0.15],rauch:true,
      schluss:{knalle:3,gross:true,gap:0.35,flash:'bernstein'}}],
    rest:{k:'bodenrest',art:'papier',A:'rot',t:30}},
  wunderbox:{stueck:13,lunte:0,dauer:16,
    phasen:[{k:'funkenkranz',at:0,n:12,r:0.6,zuend:'kreis',dreh:1,gap:0.22,t:9,kerze:{laenge:0.4,material:'eisen',A:'gold',B:'bernstein'},aus:'rueckwaerts'},
            {k:'titankerze',at:2.64,x:0,laenge:0.7,material:'titan',A:'silber',B:'weiss',t:8,aufflammen:true}]},
  bengalflamme:{stueck:3,lunte:0,dauer:15,
    phasen:[{k:'farbnebel',at:0,t:14,x:0.00,z:-0.1,farbzyklus:['blau','violett','magenta'],periode:9,versatz:0},
            {k:'farbnebel',at:0,t:14,x:-0.12,z:0.08,farbzyklus:['blau','violett','magenta'],periode:9,versatz:3},
            {k:'farbnebel',at:0,t:14,x:0.12,z:0.08,farbzyklus:['blau','violett','magenta'],periode:9,versatz:6}]},
  /* L9 */
  monsterboeller:{stueck:1,lunte:1.5,dauer:5,phasen:[{k:'alt',fn:'monsterknall'}]},
  bengalfackel:{stueck:1,lunte:0,dauer:32,
    phasen:[{k:'handfackel',at:0,t:30,A:'rot',kern:'weiss',hell:3.2,flacker:[8,12],rauch:{dichte:1.5,wind:true},schlacke:{alle:[0.4,0.9],glimm:1.5},stottern:{at:27,n:3}}]},
  /* L11 */
  goldstaubboeller:{stueck:1,lunte:1.3,dauer:8,
    phasen:[{k:'goldstaub',at:0,h:3,r:1.2,n:400,glut:'bernstein',A:'gold',B:'zitrone',blitz:{von:0.3,bis:1.6,dauer:0.04,welle:'oben-unten'},riesel:2.5}]},
  /* L13 */
  bengalduo:{stueck:2,lunte:0,dauer:32,
    phasen:[{k:'wechselfeuer',at:0,t:30,links:{x:-0.35,A:'rot'},rechts:{x:0.35,A:'gruen'},takt:{hz:0.5,ab:20,bisHz:4},form:'sinus',min:0.12,schluss:{at:27,beide:true,t:3}}]},
  /* L14 */
  farbrauchboeller:{stueck:1,lunte:1.3,dauer:14,
    phasen:[{k:'farbrauchkugel',at:0,farbRotation:['rot','zitrone','gruen','blau','violett','orange'],r:[0.5,4],quellen:1.5,steig:0.3,halten:10,wind:true,eigenlicht:false}]},
  /* L17 */
  atomboeller:{stueck:1,lunte:1.8,dauer:20,phasen:[{k:'alt',fn:'atomboeller'}]}
});
Object.assign(SIGNATUR,{
  knallerbsen:{idee:'wurf',text:'Knall erst beim Aufprall, ein Nachzügler'},
  partypopper:{idee:'konfettistrahl',text:'gerichteter Schnipselstrahl, Teppich bleibt liegen'},
  tisch:{eff:'funkenschirm',text:'Doppelschirm mit drei Farbringen'},
  wunder:{idee:'glutfront',text:'Glutfront wandert den Draht hinab, Perle tropft ab'},
  wunderfarbe:{eff:'farbspitze',text:'Goldfunken mit farbigem Saum'},
  wunderherz:{idee:'herzdraht',text:'zwei Glutfronten laufen am Herz hoch und treffen sich'},
  knallbonbon:{idee:'papierkrone',text:'Krone segelt trudelnd herab'},
  knallfrosch:{idee:'huepfer',text:'jeder Knall ein Sprung, Überschlag am Schluss'},
  pharao:{idee:'ascheschlange',text:'wachsende, sich windende Ascheschlangen'},
  tischbombe:{idee:'ueberraschung',text:'Spielzeug fliegt und hüpft'},
  bengalholz:{idee:'zuendholz',text:'Stichflamme, Kugelflamme, Rauchfaden'},
  wunderzahl:{idee:'glutschrift',text:'2027 schreibt sich Strich für Strich'},
  boeller:{idee:'pups',text:'Pups mit grünbrauner Wolke am Boden'},
  luftschlangentisch:{idee:'luftschlange',text:'Bänder entrollen sich im Flug'},
  blitzknaller:{eff:'blendung',text:'Weißblitz mit Nachbild'},
  bodenkreisel:{idee:'brummton',text:'Tonhöhe folgt der Drehzahl, Knisterfinale'},
  leuchtstaebe:{idee:'syncwechsel',text:'alle Stäbe wechseln gleichzeitig die Farbe'},
  schwaermer:{eff:'bodenflitzer',text:'Bodenflitzer mit Haken und Kreischen'},
  stroboblinker:{idee:'polyrhythmus',text:'vier Blinker mit vier Frequenzen, Endspurt ins Dauerlicht'},
  wunderkerzeXXL:{eff:'glutperle',text:'Titan-Silberregen mit tropfenden Glutperlen'},
  knallteppich:{idee:'chinakette',text:'S-Kette peitscht, rote Fetzen, drei Schlusskracher'},
  wunderbox:{idee:'kranzlauf',text:'Kranz zündet ringsum, Silberkerze in der Mitte'},
  bengalflamme:{eff:'farbnebel',text:'fließender Farbwechsel, Rauchwolke von innen beleuchtet'},
  monsterboeller:{idee:'druckring',text:'Feuerball, Druckring, zwei Echos'},
  bengalfackel:{idee:'starklicht',text:'Szene rot, Flackern, Schlacke tropft'},
  goldstaubboeller:{eff:'goldstaub',text:'Glitterwelle läuft von oben nach unten'},
  bengalduo:{idee:'gegentakt',text:'Rot und Grün pendeln im Gegentakt, Schluss im Gleichklang'},
  farbrauchboeller:{eff:'farbrauchkugel',text:'quellende Pigmentkugel, sechs Farben der Reihe nach'},
  atomboeller:{idee:'atompilz',text:'Weißblitz, Feuerball, Kappe, Stiel, Druckwelle'}
});

/* Fuer Tests: was ausser Funken zu sehen ist (fliegendes Papier,
   Meshes der laufenden Kleinfeuerwerk-Emitter) */
if(typeof window!=='undefined') window.__klein={KLEIN,papier:()=>KL_PAP.liste.length,
  sichtbar:()=>KL_PAP.liste.length+emitters.reduce((n,e)=>n+(e.meshes?e.meshes.length:0),0)};

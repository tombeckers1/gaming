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
/* Papier, Baender, Kettenglieder: nachts nicht an klHell koppeln - mit
   0,2 waren Konfetti schwarze Quadrate (Art-Director 27.09.); das
   Flutlicht des Testfelds macht Papier hell, Grundwert 0,62 */
function klPapH(){ return Math.max(0.62,klHell()); }
/* Zuendtisch: Platte 3,3 x 1,05 m (TISCH_B), Oberkante 0,93 m */
const KL_TI={x:STATION_POS.tisch.x,z:STATION_POS.tisch.z,y:0.93,hx:TISCH_B/2,hz:0.52};
function klGrund(x,z){
  /* 30.09. (Tom: Kreisel "auf dem Zuendtisch, nicht auf dem Boden"): der
     lange Tisch der Vorfuehranlage zaehlt als Tisch - vorher hielt alles
     Kleinfeuerwerk dort die Tischplatte fuer Boden */
  if(typeof vfAn!=='undefined'&&vfAn&&typeof VF_TISCH!=='undefined'){ const T=VF_TISCH, x0=T.x0-0.36, x1=T.x0+(T.n-1)*T.dx+0.36;
    if(x>=x0&&x<=x1&&Math.abs(z-VF_Z)<=0.45) return T.y; }
  return Math.abs(x-KL_TI.x)<=KL_TI.hx&&Math.abs(z-KL_TI.z)<=KL_TI.hz?KL_TI.y:0; }
/* Flaeche, auf der das Produkt steht (o ist seine Oberkante) */
function klFlaeche(o){ const g=klGrund(o.x,o.z); return o.y>=g-0.01?g:(o.y||0); }
/* Bodenstueck vor dem Tisch (zum Pult hin): da laufen Frosch, Flitzer
   und Kette - hinter dem Tisch saehe man vom Pult aus nichts */
function klVorne(o,dz){ const s=klFlaeche(o); return s>0.5?{x:o.x,y:0,z:o.z+(dz||1.1)}:{x:o.x,y:s,z:o.z}; }
function klMesh(e,m){ scene.add(m); (e.meshes=e.meshes||[]).push(m); return m; }
function klWeg(e){
  /* eigene Materialien (userData.matEigen, z. B. der verkohlende Knallfrosch) gehen mit */
  if(e.meshes) for(const m of e.meshes){ scene.remove(m); if(m.geometry&&!m.userData.geoFest) m.geometry.dispose();
    m.traverse(c=>{ if(c.userData.matEigen&&c.material) c.material.dispose(); }); }
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
  /* 28.09. (Tom: "die Zuendung wirklich am Produkt"): Versatz der Teile
     hoechstens so weit wie das Produkt breit/tief ist - vorher lagen
     Knallbonbons 30 cm, Hafenlichter 35 cm neben dem Karton */
  const D=(P[t]&&P[t].dims)||[0.2,0.1,0.1], HW=Math.max(0.06,D[0]/2+0.03), HD=Math.max(0.05,D[2]/2+0.03);
  const alle=[]; K.phasen.forEach(ph=>(ph.folge||[ph]).forEach(f=>alle.push(f)));
  const mx=Math.max(1e-6,...alle.map(f=>Math.abs(f.x||0))), mz=Math.max(1e-6,...alle.map(f=>Math.abs(f.z||0)));
  const fx=Math.min(1,HW/mx), fz=Math.min(1,HD/mz);
  K.phasen.forEach((ph,pi)=>{
    const liste=ph.folge?ph.folge.map((f,i)=>Object.assign({},ph,f,{folge:null,nr:i,anzahl:ph.folge.length})):[ph];
    liste.forEach(q=>later(lu+(q.at||0),()=>{
      if(q.k==='alt'){ KLEIN_ALT[q.fn](o,t); return; }
      const e=Object.assign({},q,{k:q.k,o:{x:o.x+(q.x||0)*fx,y:o.y,z:o.z+(q.z||0)*fz},t:typeof q.t==='number'?q.t:K.dauer,tt:q.t,prod:t,pi,rest:K.rest});
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
  /* Farbpuffer ZUERST anlegen: setColorAt legt instanceColor mit count*3
     Werten an - nach count=0 war er leer und jedes Blatt schwarz
     (Art-Director 27.09.: "Konfetti sind schwarze Quadrate") */
  if(m.setColorAt) m.setColorAt(0,klFarbe3(1,1,1)); m.count=0; m.frustumCulled=false; scene.add(m); KL_PAP.mesh=m;
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
  const H=klPapH(); let n=0, tot=false;
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
    const cw=Math.abs(Math.cos(s.w)), k=H*(0.8+0.35*cw)+1.2*Math.pow(cw,12);
    if(m.setColorAt) m.setColorAt(n,_klC.setRGB(s.c[0]*k,s.c[1]*k,s.c[2]*k)); n++; }
  if(tot) KL_PAP.liste=L.filter(s=>!s.tot);
  m.count=n; m.instanceMatrix.needsUpdate=true; if(m.instanceColor) m.instanceColor.needsUpdate=true; m.visible=n>0;
  e.t=KL_PAP.liste.length?1:0;
};

/* ---------------------------------------------------------
   Funkenstriche: Wunderkerzen- und Kreiselfunken als feine Striche
   (Bewegungsunschaerfe wie im Video, Laenge = Tempo x 1/35 s), Eisen
   zerspritzt am Ende in 2-4 Aestchen. 29.09., Tom: echt - vorher waren
   es 7-15-cm-Punkte, aus der Naehe weiche Lichtkugeln bzw. eine Wolke.
   Jeder Funke gibt ausserdem einen schwachen Kopfpunkt in psSmall aus
   (gleiche Bahn, gleiche Rechnung wie PS.update) - so sehen ihn auch
   die Tests (ursprung, amprodukt, anomalie).
   --------------------------------------------------------- */
const KL_FK={max:COARSE?1500:3600,n:0,mesh:null};
function klFunkMesh(){
  if(KL_FK.mesh) return KL_FK.mesh;
  const M=KL_FK.max;
  KL_FK.p=new Float32Array(M*3); KL_FK.v=new Float32Array(M*3); KL_FK.c=new Float32Array(M*3);
  KL_FK.l=new Float32Array(M); KL_FK.ml=new Float32Array(M); KL_FK.g=new Float32Array(M); KL_FK.a=new Uint8Array(M);
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(M*6),3)); g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(M*6),3)); g.setDrawRange(0,0);
  const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false}));
  m.frustumCulled=false; m.renderOrder=3; scene.add(m); KL_FK.mesh=m; return m;
}
/* ein Funke: Ort, Tempo, Farbe c, Leben, Schwerkraft, ast = Aestchen am Ende, kopf = Helligkeit des Kopfpunkts */
function klFunke(x,y,z,vx,vy,vz,c,life,g,ast,kopf){
  klFunkMesh(); const K=KL_FK;
  if(kopf!==0){ const k=kopf===undefined?0.3:kopf, alt=SCHWEIF; SCHWEIF=0; psSmall.emit(x,y,z,vx,vy,vz,c[0]*k,c[1]*k,c[2]*k,life,g,0); SCHWEIF=alt; }
  if(K.n>=K.max) return; const i=K.n++, j=i*3;
  K.p[j]=x; K.p[j+1]=y; K.p[j+2]=z; K.v[j]=vx; K.v[j+1]=vy; K.v[j+2]=vz; K.c[j]=c[0]; K.c[j+1]=c[1]; K.c[j+2]=c[2];
  K.l[i]=life; K.ml[i]=life; K.g[i]=g; K.a[i]=ast||0;
  dienst();
}
/* Die Striche rechnet der Hilfsdienst aus 14e mit (dienst2), wie die gefuehrten Funken */
function klFunkTakt(dt){
  const K=KL_FK, m=K.mesh; if(!m) return false;
  const drag=Math.max(0,1-ZIEH*dt), P=K.p, W=K.v, C=K.c, a=m.geometry.attributes, AP=a.position.array, AC=a.color.array, BL=0.028, ast=[];
  let n=0;
  for(let i=0;i<K.n;i++){ const j=i*3;
    K.l[i]-=dt;
    W[j]*=drag; W[j+1]=W[j+1]*drag-K.g[i]*dt; W[j+2]*=drag;
    P[j]+=W[j]*dt; P[j+1]+=W[j+1]*dt; P[j+2]+=W[j+2]*dt;
    if(K.l[i]<=0){ if(K.a[i]) ast.push([P[j],P[j+1],P[j+2],W[j],W[j+1],W[j+2],C[j],C[j+1],C[j+2],K.a[i],K.g[i]]); continue; }
    /* dicht packen */
    if(n!==i){ const o=n*3; for(let c=0;c<3;c++){ P[o+c]=P[j+c]; W[o+c]=W[j+c]; C[o+c]=C[j+c]; } K.l[n]=K.l[i]; K.ml[n]=K.ml[i]; K.g[n]=K.g[i]; K.a[n]=K.a[i]; }
    const o=n*3, f=K.l[n]/K.ml[n], k=(0.8+0.4*Math.random())*(f<0.2?f/0.2:1), s=n*6;
    AP[s]=P[o]; AP[s+1]=P[o+1]; AP[s+2]=P[o+2];
    AP[s+3]=P[o]-W[o]*BL; AP[s+4]=P[o+1]-W[o+1]*BL; AP[s+5]=P[o+2]-W[o+2]*BL;
    AC[s]=C[o]*k; AC[s+1]=C[o+1]*k; AC[s+2]=C[o+2]*k; AC[s+3]=C[o]*k*0.12; AC[s+4]=C[o+1]*k*0.1; AC[s+5]=C[o+2]*k*0.08;
    n++; }
  K.n=n;
  /* Eisen zerspritzt: kurze, hellere Aestchen um die Flugrichtung */
  /* ast: untere 4 Bit = Zahl der Aestchen, obere 4 Bit = Aestchen je
     Aestchen (zweite Verzweigung, Riesen-Wunderkerze: Sternfunken) */
  for(const q of ast){ const sp=Math.hypot(q[3],q[4],q[5]), dn=sp>0.05?[q[3]/sp,q[4]/sp,q[5]/sp]:randDir(), cc=[q[6]*1.15,q[7]*1.15,q[8]*1.15], na=q[9]&15, n2=q[9]>>4;
    for(let b=0;b<na;b++){ const d=streu(dn,1.1), s=Math.max(0.8,sp*rand(0.5,0.9)); klFunke(q[0],q[1],q[2],d[0]*s,d[1]*s,d[2]*s,cc,n2?rand(0.04,0.08):rand(0.05,0.11),q[10],n2&&Math.random()<0.7?n2:0,0); } }
  m.geometry.setDrawRange(0,K.n*2); a.position.needsUpdate=true; a.color.needsUpdate=true; m.visible=K.n>0;
  return K.n>0;
}
const _klDienst2=NEU_EMIT.dienst2;
NEU_EMIT.dienst2=(e,dt)=>{ _klDienst2(e,dt); if(klFunkTakt(dt)) e.t=0.5; };

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
  /* unverbrannter Draht: hell genug, dass man nachts sieht, woran die Funken
     haengen (28.09., Tom: "am Produkt selbst") - vorher 0,18 = unsichtbar */
  if(alter<0){ const k=0.55+0.25*H+0.9*nah; r=0.62*k; g=0.6*k; b=0.56*k; }
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
    /* 29.09., Tom: echt - alle Funken als feine Striche (klFunke), der
       Kopfpunkt nur schwach; vorher psMid/psSmall-Punkte = Lichtkugeln */
    if(m==='titan'){
      /* Titan: silberweisse, schnelle Striche, lang gezogen, selten ein Ast */
      const s=rand(2.4,4.2)*(o.weite?o.weite/2:1), c=Math.random()<0.7?A:B, l=rand(0.2,0.42), k=0.95;
      klFunke(x,y,zz,d[0]*s,d[1]*s+0.3,d[2]*s,[c[0]*k,c[1]*k,c[2]*k*1.05],l,4,Math.random()<0.1?2:0,0.18);
    } else if(m==='farbspitze'){
      /* Goldfunke, der im letzten Teil seines Lebens hart in B umschlaegt (+20 % hell) */
      /* Farbsatz brennt traeger als Eisen: langsamere Funken (1,3-2 m/s), die Farbe traegt die Wirkung */
      const s=rand(1.3,1.95), l=rand(0.22,0.38), sp=o.spitze||0.3, t1=l*(1-sp), v=[d[0]*s,d[1]*s+0.3,d[2]*s], P0={x,y,z:zz};
      /* Farbsatz-Funken sind schwere Schlacketropfen: sie haengen im Bogen durch (g 3,5 statt 1,5) */
      klFunke(x,y,zz,v[0],v[1],v[2],[A[0]*0.95,A[1]*0.95,A[2]*0.95],t1,3.5,0,0.25);
      imBild(t1,()=>{ const pp=bahnOrt(P0,v,3.5,t1), w=bahnTempo(v,3.5,t1);
        klFunke(pp.x,pp.y,pp.z,w[0],w[1],w[2],[B[0]*1.1,B[1]*1.1,B[2]*1.1],l-t1+0.04,3.5,Math.random()<0.4?2:0,0.5); });
    } else if(m==='riesen'){
      /* Riesen-Wunderkerze (03.10., Tom: "deutlich realistischer"): weissgelbe
         Eisenfunken, schnell (3-6 m/s) und kurzlebig, die zweimal
         verzweigen - die dichten Sternfunken einer echten 1-m-Kerze */
      const s=rand(2.8,6.2)*(o.tempo?0.5+0.5*o.tempo:1), c=Math.random()<0.62?A:B, l=rand(0.12,0.3), k=1.15, br=Math.random();
      klFunke(x,y,zz,d[0]*s,d[1]*s+0.4,d[2]*s,[c[0]*k,c[1]*k,c[2]*k],l,1.8,br<0.72?(Math.round(rand(2,4))|(br<0.45?(2+Math.round(Math.random()))<<4:0)):0,0.22);
    } else {
      /* Eisen: schiesst schnell heraus (2-4 m/s), lebt kurz und zerspritzt
         am Ende in 2-4 Aestchen - das typische Wunderkerzen-Sternchen */
      const s=rand(2.0,4.0)*(o.tempo?0.5+0.5*o.tempo:1), c=Math.random()<0.78?A:B, l=rand(0.12,0.26), k=1.1;
      klFunke(x,y,zz,d[0]*s,d[1]*s+0.3,d[2]*s,[c[0]*k,c[1]*k,c[2]*k],l,1.5,Math.random()<0.55?Math.round(rand(2,4)):0,0.25);
    }
  }
  SCHWEIF=alt;
}
/* Glutpunkt mit Hof */
function klGlutpunkt(p,m,st,hf,F){
  const alt=SCHWEIF; SCHWEIF=0; st=st||1; hf=hf===undefined?1:hf;
  /* F: Farbsatz (Farbwunderkerze) - der Kopf brennt in seiner Farbe mit weissem Kern */
  const c=m==='titan'?[1.8,1.8,1.9]:m==='riesen'?[2.0,1.85,1.45]:F?klMisch(klSatt(F),[1,1,1],0.35).map(v=>v*1.6):[1.7,1.45,1.0];
  const h=m==='titan'?[0.35,0.38,0.45]:m==='riesen'?[0.5,0.38,0.17]:F?klSatt(F).map(v=>v*0.45):[0.42,0.2,0.05];
  /* Riesenkerze: weissgelber Kern 15 cm, Hof 42 cm, aber gedaempft - die Funken tragen das Bild */
  if(m==='riesen'){ psMid.emit(p.x,p.y,p.z,0,0,0,c[0]*st,c[1]*st,c[2]*st,0.05,0,0); klFarbig(psMid);
    psSmall.emit(p.x,p.y,p.z,0,0,0,2.2*st,2.1*st,1.9*st,0.05,0,0);
    psBig.emit(p.x,p.y,p.z,0,0,0,h[0]*st*0.6,h[1]*st*0.6,h[2]*st*0.6,0.05,0,0); klFarbig(psBig); SCHWEIF=alt; return; }
  /* kleiner Hof (Formkerzen, und 29.09. alle Eisenkerzen): Kern 7 cm statt 15 cm, Hof 15 statt 42 cm -
     der 42-cm-Hof stand als Leuchtball an der Kerze */
  if(hf<1||m!=='titan'){
    psSmall.emit(p.x,p.y,p.z,0,0,0,c[0]*st,c[1]*st,c[2]*st,0.05,0,0);
    psMid.emit(p.x,p.y,p.z,0,0,0,h[0]*st*1.5,h[1]*st*1.5,h[2]*st*1.5,0.05,0,0); klFarbig(psMid); }
  else { psMid.emit(p.x,p.y,p.z,0,0,0,c[0]*st,c[1]*st,c[2]*st,0.05,0,0);
    psBig.emit(p.x,p.y,p.z,0,0,0,h[0]*st,h[1]*st,h[2]*st,0.05,0,0); klFarbig(psBig); }
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
    const qq=q; imBild(tt,()=>{ psMid.emit(qq.x,boden+0.012,qq.z,0,0,0,A[0]*0.9,A[1]*0.5,A[2]*0.2,glimm||1.0,0,0); klFarbig(psMid); });
    SCHWEIF=a; if(Math.random()<0.6) schall(q,v2=>sfx.zischen(v2*0.4,0.25)); });
}
/* Mantel (grauer Zuendsatz) als Rohr entlang eines Linienzugs pk
   ([x,y,z]); die Abschnitte liegen in Pfadrichtung hintereinander, so
   schneidet klRohrZeig den abgebrannten Teil ueber setDrawRange ab.
   03.10. (Tom: "man sieht nur die Wunderkerzen"): vorher war die Kerze
   ein 1-Pixel-Strich - jetzt ein grauer Stab, an dem die Glut frisst */
function klRohrGeo(pk,r,rad){
  rad=rad||5; const n=pk.length, pos=[], idx=[];
  for(let i=0;i<n;i++){ const a=pk[Math.max(0,i-1)], b=pk[Math.min(n-1,i+1)]; let tx=b[0]-a[0], ty=b[1]-a[1], tz=b[2]-a[2]; const tl=Math.hypot(tx,ty,tz)||1; tx/=tl; ty/=tl; tz/=tl;
    let n1=[ty,-tx,0], l1=Math.hypot(n1[0],n1[1]); if(l1<1e-3){ n1=[1,0,0]; l1=1; } n1=[n1[0]/l1,n1[1]/l1,0];
    const n2=[ty*n1[2]-tz*n1[1],tz*n1[0]-tx*n1[2],tx*n1[1]-ty*n1[0]];
    for(let k=0;k<rad;k++){ const w=k/rad*Math.PI*2, c=Math.cos(w), sn=Math.sin(w); pos.push(pk[i][0]+(n1[0]*c+n2[0]*sn)*r,pk[i][1]+(n1[1]*c+n2[1]*sn)*r,pk[i][2]+(n1[2]*c+n2[2]*sn)*r); } }
  for(let i=0;i<n-1;i++) for(let k=0;k<rad;k++){ const a=i*rad+k, b=i*rad+(k+1)%rad, c=a+rad, d=b+rad; idx.push(a,b,c, b,d,c); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
  g.userData.rad=rad; g.userData.seg=n-1; return g; }
/* nur die Abschnitte von Anteil a bis b (0..1 des Pfads) zeigen */
function klRohrZeig(g,a,b){ const R=g.userData.rad*6, S=g.userData.seg, i0=Math.round(clamp(a,0,1)*S), i1=Math.round(clamp(b,0,1)*S); g.setDrawRange(i0*R,Math.max(0,i1-i0)*R); }
/* Linienzug gleichmaessig neu abtasten (Abstand st m), 2D [x,y] */
function klDicht(pk,st){ const P=klPfad(pk), n=Math.max(2,Math.ceil(P.L/(st||0.006))), r=[]; for(let i=0;i<=n;i++) r.push(klPfadOrt(P,i/n)); return r; }
function klMantelMat(){ return klMat('mantel',()=>new THREE.MeshStandardMaterial({color:LIN(0x86888a),roughness:0.95,metalness:0.05,emissive:LIN(0x262626),side:THREE.DoubleSide})); }
function klZoneMat(){ return klMat('glutzone',()=>new THREE.MeshBasicMaterial({color:new THREE.Color(1.7,0.95,0.45),toneMapped:false,fog:false})); }
function klZone(e,r){ const m=new THREE.Mesh(klMat('glutkugel',()=>new THREE.SphereGeometry(1,8,6)),klZoneMat()); m.userData.geoFest=true; m.scale.setScalar(r); m.visible=false; return klMesh(e,m); }
/* Eine Wunderkerze als Objekt (auch fuer den Funkenkranz) */
function klKerze(e,basis,o){
  /* basis: Fusspunkt; o: laenge, t, material, A, B, n, nachglut, endperle, glutperle, weite, dichte, spitze,
     ang (Neigung in der Bildebene, rad), r (Mantelradius), mantel:false = nur Draht */
  const L=o.laenge||0.5, m=o.material||'eisen', N=24, pk=[], ang=o.ang||0, ex=Math.sin(ang), ey=Math.cos(ang);
  for(let i=0;i<=N;i++) pk.push([basis.x+ex*L*i/N,basis.y+ey*L*i/N,basis.z]);
  const K={L,m,draht:klDraht(e,pk),alter:0,T:o.t,aus:false,griff:Math.min(0.12,L*0.2),nach:o.nachglut===false?0.4:1.5,
    rate:(o.n||7)*60*(o.dichte||1)*(m==='titan'?0.8:1),glut:m==='titan'?[1,0.55,0.25]:m==='riesen'?[1,0.42,0.12]:[1,0.24,0.05]};
  const g0=K.griff/L;
  if(o.mantel!==false){ const r=o.r||0.0042, mp=[]; for(let i=0;i<=32;i++){ const s=g0+(1-g0)*i/32; mp.push([basis.x+ex*L*s,basis.y+ey*L*s,basis.z]); }
    const mg=klRohrGeo(mp,r,6); K.mantel=klMesh(e,new THREE.Mesh(mg,klMantelMat())); K.mantel.frustumCulled=false; K.zone=klZone(e,r*1.45); K.mr=r; }
  /* Glutfront: vom oberen Ende bis zum Griff */
  K.front=()=>{ const u=clamp(K.alter/K.T,0,1), s=1-u*(1-g0); return {x:basis.x+ex*L*s,y:basis.y+ey*L*s,z:basis.z,s}; };
  K.schritt=(dt)=>{
    if(K.aus&&K.alter>K.T+K.nach+0.2) return;
    K.alter+=dt;
    const f=K.front(), brennt=K.alter<K.T, H=klHell();
    if(K.mantel){ klRohrZeig(K.mantel.geometry,0,brennt?(f.s-g0)/(1-g0):0);
      /* die Abbrandzone: ein weissgelb gluehender Ring am Mantelende, flackernd */
      K.zone.visible=brennt; if(brennt){ K.zone.position.set(f.x,f.y,f.z); K.zone.scale.setScalar(K.mr*rand(1.3,1.75)); } }
    if(brennt){
      /* 29.09., Tom: echt - Farbwunderkerze brennt mit farbigem Kopf (wie im Handel), nicht nur mit Farbspitzen */
      klGlutpunkt(f,m,m==='titan'?1.2:1,1,m==='farbspitze'?(o.B||o.A):null);
      if(m==='farbspitze') klFlamme(K.fl||(K.fl={}),f,dt,o.B||o.A,{h:0.04,r:0.006,st:0.45,rate:45,hof:0.1});
      klKerzeFunken(f,dt,K,m,o.A,o.B||o.A,K.rate,o);
      /* grosse Kerzen (XXL 1 m) leuchten mehr: Licht waechst mit der Laenge */
      if(o.licht!==false){ const gl=Math.sqrt(Math.max(1,L/0.5)), LC=m==='titan'?[0.9,0.92,1]:m==='riesen'?[1,0.9,0.68]:[1,0.72,0.35];
        licht('kz'+(o.key||'')+e.prod+(e.nr||0),f,LC,(m==='titan'?1.4:m==='riesen'?1.9:0.7)*gl,{weite:(m==='titan'||m==='riesen'?7:4)*Math.sqrt(gl)}); }
      if(o.glutperle){ K.gp=(K.gp===undefined?rand(o.glutperle.alle[0],o.glutperle.alle[1]):K.gp)-dt;
        if(K.gp<=0){ K.gp=rand(o.glutperle.alle[0],o.glutperle.alle[1]); klGlutperle({x:f.x,y:f.y-0.008,z:f.z},klF(o.glutperle.A,FW.orange),o.glutperle.huepf||0,o.glutperle.spritz||6); } }
    } else if(!K.aus){ K.aus=true;
      if(o.endperle) klGlutperle({x:f.x,y:f.y-0.005,z:f.z},FW.orange,0,5); }
    /* Draht faerben: grau, an der Front hell, dahinter Glut, dann Asche */
    const col=K.draht.userData.col;
    for(let i=0;i<=N;i++){ const s=i/N, tb=(1-s)/(1-g0)*K.T, al=s*L<K.griff?-1:K.alter-tb, nah=brennt?Math.exp(-Math.abs(s-f.s)*L/0.12):0;
      klDrahtFarbe(col,i,al,K.glut,K.nach,H,nah*0.5); }
    klDrahtAuf(K.draht);
  };
  return K;
}
/* Wunderkerze (wunder, wunderkerzeXXL): eine oder mehrere Kerzen stecken
   im Mini-Podest (kqWkLayout/kqPodestNimm in 14q, 03.10., Tom: "die
   Verpackung kommt weg, man sieht nur die Wunderkerzen"). Mehrere
   Kerzen zuenden nacheinander (versatz), jede an der vorigen. */
klEmit('wunderkerze',(e,dt,o,t)=>{
  if(!e.KK){ const sf=klFlaeche(o), lay=typeof kqWkLayout==='function'?kqWkLayout(e.prod):null;
    const pod=typeof kqPodestNimm==='function'?kqPodestNimm(e,o,e.prod):null;
    const y0=pod?pod.y:Math.max(o.y,sf+0.02), KZ=(lay&&lay.kerzen)||[{x:0,ang:0,L:e.laenge}];
    e.T0=e.t; let ende=0;
    e.KK=KZ.map((kz,i)=>{ const st=(e.versatz||0)*i, T=e.T0*(kz.dauer||1); ende=Math.max(ende,st+T);
      return {start:st,K:klKerze(e,{x:o.x+(kz.x||0),y:y0,z:o.z+(kz.z||0)},{laenge:kz.L||e.laenge,ang:kz.ang||0,r:kz.r,t:T,material:e.material,A:e.A||FW.gold,B:e.B||e.A||FW.bernstein,n:e.n,
        nachglut:e.nachglut,endperle:e.endperle,glutperle:e.glutperle,weite:e.weite,dichte:e.dichte,spitze:e.spitze,key:'w'})}; });
    e.t=ende+1.8+(e.endperle?1.2:0)+(e.glutperle?1.5:0);
    if(e.aufflammen){ flash({x:o.x,y:y0+e.laenge,z:o.z},FW.silber,1.6,0.3); schall(o,v=>sfx.zischen(v*0.8,0.5)); } }
  let an=0;
  for(const k of e.KK){ if(t<k.start) continue;
    if(!k.an){ k.an=1; if(k.start>0){ const f=k.K.front(); flash(f,FW.gold,0.35,0.08); schall(f,v=>sfx.zischen(v*0.35,0.3)); } }
    k.K.schritt(dt); if(k.K.alter<k.K.T) an++; }
  if(an){ zischBett(e,'wunderkerze',distVol(o)*(e.material==='titan'||e.material==='riesen'?1.0:0.6)*Math.min(1.4,0.8+0.2*an),dt);
    if(e.material==='titan'||e.material==='riesen'){ e.kn=(e.kn||0)-dt; if(e.kn<=0){ e.kn=rand(0.5,1.4); sfx.crackle(distVol(o)*0.25); } } }
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
/* Formen der Formkerzen (Herz, Ziffern): je Teil die Pfade in Metern,
   x relativ zur Mitte des Produkts, y ab dem Fuss der Form. Auch das
   Mini-Podest (14q) baut daraus die noch nicht gezuendeten Kerzen. */
function klFormTeile(formen,gr,abstand){
  const nf=formen.length, pitch=Math.max(abstand||0.16,gr*0.72);
  return formen.map((f,j)=>{ const herz=f==='herz', dx=(j-(nf-1)/2)*pitch;
    const pf=herz?[klHerzHaelfte(-1,40),klHerzHaelfte(1,40)]:[KL_ZIFFER[f]||KL_ZIFFER['0']];
    return {f,herz,dx,pfade:pf.map(pk=>pk.map(([x,y])=>[dx+(x-(herz?0:0.3))*gr,y*gr]))}; }); }
klEmit('formkerze',(e,dt,o,t)=>{
  /* 28.09. (Tom): die Form brennt am Produkt - vorher 35 cm davor an der Tischkante */
  const Z=o.z;
  const H=klHell(), A=e.A||FW.gold, B=e.B||FW.rot, G=klF(e.glut,B), gl=[G[0]*0.9+0.1,G[1]*0.55,G[2]*0.45], NG=e.nachglut||1.8;
  if(!e.teile){
    const sf=klFlaeche(o), gr=e.groesse||0.3, formen=Array.isArray(e.form)?e.form:[e.form];
    /* 03.10. (Tom): die Form steckt mit ihrem Stiel im Mini-Podest (14q) */
    const pod=typeof kqPodestNimm==='function'?kqPodestNimm(e,o,e.prod):null, stiel=e.stiel||0.1;
    const yp=pod?pod.y:Math.max(o.y,sf+0.02), y0=yp+stiel;
    e.teile=klFormTeile(formen,gr,e.abstand).map((ft,j)=>{
      const cx=o.x+ft.dx, herz=ft.herz;
      const P=ft.pfade.map(pk=>{ const q=pk.map(([x,y])=>[o.x+x,y0+y,Z]); const p=klPfad(q.map(p=>[p[0],p[1]])); p.p3=q;
        /* grauer Mantel ueber dem Draht: brennt von u bis 1 ab */
        const md=klDicht(q.map(p=>[p[0],p[1]]),0.006).map(([x,y])=>[x,y,Z]);
        p.mantel=klMesh(e,new THREE.Mesh(klRohrGeo(md,e.mantelR||0.0042,6),klMantelMat())); p.mantel.frustumCulled=false;
        p.zone=klZone(e,(e.mantelR||0.0042)*1.45); return p; });
      P.forEach(p=>{ p.draht=klDraht(e,p.p3); });
      /* Stiel bis in den Halter: blanker Draht */
      const st=klDraht(e,[[cx,yp-0.01,Z],[cx,y0+(herz?0:0.01),Z]]);
      const sc=st.userData.col; for(let i=0;i<6;i++) sc[i]=0.45+0.2*H; klDrahtAuf(st);
      return {P,start:j*(e.versatz||0),f:ft.f,fa:[{},{}]};
    });
    e.T0=e.t; e.t=e.t+(e.teile.length-1)*(e.versatz||0)+(e.schluss?e.schluss.funkeln+1:0)+NG+2.5;
  }
  const T=e.T0, alt=SCHWEIF;
  let alleFertig=true;
  e.teile.forEach((tl,j)=>{
    const lt=t-tl.start, u=clamp(lt/T,0,1), brennt=lt>0&&lt<T;
    if(lt<T) alleFertig=false;
    tl.P.forEach((P,pi)=>{
      if(P.mantel){ klRohrZeig(P.mantel.geometry,lt>0?u:0,1); if(lt>=T) P.mantel.visible=false;
        P.zone.visible=brennt; if(brennt){ const [zx,zy]=klPfadOrt(P,u); P.zone.position.set(zx,zy,Z); P.zone.scale.setScalar(0.0042*rand(1.3,1.75)); } }
      if(brennt){ const [x,y]=klPfadOrt(P,u), f={x,y,z:Z};
        const MT=e.material||'eisen';
        klGlutpunkt(f,MT,1,0.5); /* halber Hof: der Draht bleibt lesbar */
        klKerzeFunken(f,dt,tl.fa[pi],MT,A,B,(e.n||6)*60*(e.fronten===2?0.8:1),{tempo:e.tempo||0.62,weite:e.weite});
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
      /* 29.09., Tom: echt - Funkenstoss in den Kerzenfarben (vorher Rosa-Punkte und 42-cm-Leuchtball) */
      for(let i=0;i<Math.round((e.treffen?e.treffen.funken:60)*QUAL());i++){ const d=randDir(), s=rand(1.2,2.8), c=i%3?A:B;
        klFunke(p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,[c[0]*1.2,c[1]*1.2,c[2]*1.2],rand(0.15,0.3),2,Math.random()<0.5?3:0,0.3); }
      psMid.emit(p.x,p.y,p.z,0,0,0,1.4,1.1,0.8,0.1,0,0); SCHWEIF=alt;
      schall(p,v=>{ sfx.plopp(v*0.6,2.2); sfx.crackle(v*0.35); }); }
  });
  /* Schluss: alle Pfade spruehen eine Sekunde ueber ihre ganze Laenge */
  if(e.schluss&&t>=e.schluss.at&&t<e.schluss.at+e.schluss.funkeln){
    e.sf=(e.sf||0)+dt*700*QUAL(); SCHWEIF=0.04;
    for(;e.sf>=1;e.sf--){ const tl=e.teile[Math.floor(Math.random()*e.teile.length)], P=tl.P[0], [x,y]=klPfadOrt(P,Math.random()), d=randDir(), s=rand(0.3,0.8), c=Math.random()<0.6?A:FW.weiss; /* 30.09.: dicht an den Ziffern */
      klFunke(x,y,Z,d[0]*s,d[1]*s+0.3,d[2]*s,[c[0]*1.2,c[1]*1.2,c[2]*1.2],rand(0.15,0.35),1.5,0,0.3); }
    SCHWEIF=alt;
    if(!e.sfT){ e.sfT=1; sfx.crackle(distVol(o)*0.4); later(0.45,()=>sfx.crackle(distVol(o)*0.35)); } }
  if(!alleFertig) zischBett(e,'wunderkerze',distVol(o)*0.55,dt);
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
  if(sn) licht('kranz'+e.prod,{x:sx/sn,y:klFlaeche(o)+0.5,z:sz/sn},[1,0.72,0.35],0.6+sn*0.08,{weite:6});
  if(sn) zischBett(e,'wunderkerze',distVol(o)*(0.35+sn*0.05),dt);
});

/* ---------------------------------------------------------
   Bengal- und Lichtprodukte: Flammen ohne Funken, Licht auf dem
   ganzen Platz, jedes mit eigenem Takt
   --------------------------------------------------------- */
/* Flamme: Kern (kern) und Mantel (A), h Hoehe m, r Radius m, st Staerke */
/* gesaettigte Produktfarbe: Nebenkanaele gedrueckt, damit die Summe der
   additiven Flammenzungen nicht zu Weiss uebersteuert (Art-Director
   27.09.: "rot & gruen" zeigten weisse Kugeln) */
/* PS laesst jeden neuen Funken die ersten 7 % seines Lebens weiss
   aufgluehen (Zerlegerschlag). Fuer Flammen falsch: jede Flammenzunge
   und jeder Hof-Sprite startete weiss -> weisse Kugel. Den zuletzt
   ausgegebenen Funken knapp hinter diese Schwelle altern lassen. */
function klFarbig(ps){ const i=(ps.next-1+ps.max)%ps.max; if(ps.life[i]>0) ps.maxl[i]=ps.life[i]/0.92; }
function klSatt(A){ const m=Math.max(A[0],A[1],A[2],0.01); return A.map(c=>Math.pow(c/m,2.2)); }
function klFlamme(z,p,dt,A,o){
  o=o||{}; const q=QUAL(), st=o.st===undefined?1:o.st, h=o.h||0.25, r=o.r||0.03, S=klSatt(A), K=o.kern||klMisch(S,[1,1,1],0.25);
  if(st<=0.01) return;
  z.fl=(z.fl||0)+dt*(o.rate||110)*q*Math.min(1,st*0.8+0.2);
  const alt=SCHWEIF; SCHWEIF=0;
  for(;z.fl>=1;z.fl--){ const a=Math.random()*6.283, w=Math.sqrt(Math.random())*r, kern=Math.random()<0.16;
    /* strahl: Starklicht-Fackel - kurze, schnelle Flammenzungen statt ruhiger Flamme */
    const l=(o.strahl?rand(0.08,0.14):rand(0.16,0.3))*(kern?0.7:1), vy=h/l*(o.strahl?rand(0.9,1.3):rand(0.55,0.8)), c=kern?K:S, k=(kern?0.55:0.6)*st*(o.strahl?1.4:1);
    const ps=kern?psSmall:psMid; ps.emit(p.x+Math.cos(a)*w,p.y+rand(0,0.02),p.z+Math.sin(a)*w,Math.cos(a)*w*1.5,vy,Math.sin(a)*w*1.5,c[0]*k,c[1]*k,c[2]*k,l,-0.5,0); klFarbig(ps); }
  /* Weiss nur als kleiner Punkt am Fuss der Flamme */
  psSmall.emit(p.x,p.y+h*0.12,p.z,0,0,0,0.55*st,0.55*st,0.52*st,0.05,0,0);
  const hf=(o.hof||0.3)*st; psBig.emit(p.x,p.y+h*0.4,p.z,0,0,0,S[0]*hf,S[1]*hf,S[2]*hf,0.05,0,0); klFarbig(psBig);
  /* Starklicht: weiter Lichthof um die Flamme */
  if(o.hofGross) psHuge.emit(p.x,p.y+h*0.5,p.z,0,0,0,S[0]*o.hofGross*st,S[1]*o.hofGross*st,S[2]*o.hofGross*st,0.05,0,0); if(o.hofGross) klFarbig(psHuge);
  SCHWEIF=alt;
}
/* 28.09., Tom: echt - Bengalfeuer flackert unruhig (Zufall, kein Sinus),
   wirft ab und zu ein Schlackekorn und steht in eigenem Rauch, der nur
   nahe der Flamme farbig angestrahlt ist und darueber grau wird
   (vorher: synchroner Farbwechsel, Sinus-Gegentakt, Farbsaeule bis 10 m) */
function klFlacker(z,dt,ruhe){
  z.flz=(z.flz||0)-dt;
  if(z.flz<=0){ z.flz=rand(0.03,0.09); z.fli=rand(ruhe||0.72,1.08); if(Math.random()<0.05) z.fli=rand(0.45,0.62); }
  if(z.flv===undefined) z.flv=1;
  z.flv+=(z.fli-z.flv)*Math.min(1,dt*18); return z.flv;
}
function klBengalRauch(z,p,dt,A,s,o){
  o=o||{}; z.brr=(z.brr||0)+dt*(o.rate||2.2)*s;
  if(z.brr<1) return; z.brr--;
  const H=klHell(), gr=[0.22*H+0.05,0.21*H+0.05,0.22*H+0.06], L=o.licht||0.55;
  rauchball({x:p.x+rand(-0.02,0.02),y:p.y+(o.h||0.12),z:p.z+rand(-0.02,0.02)},{r:rand(0.22,0.4)*(o.gr||1),n:1,dauer:o.dauer||5,quellen:2.5,steigen:o.steigen||0.4,a:o.a||0.38,wind:o.wind||[0.12,0.04],
    farbe:tt=>{ const k=L*Math.exp(-tt/0.8); return [gr[0]+A[0]*k,gr[1]+A[1]*k,gr[2]+A[2]*k]; }});
}
/* Bengalflamme mit Flackern, Schlacke, Rauch und (optional) satt
   farbigem Raumlicht; gibt die aktuelle Staerke zurueck */
/* 29.09., Tom: echt - das Raumlicht richtet sich nach der Groesse des Satzes
   (Zuendholz 2,5 m, Topf 5 m, Hafenfeuer 7 m, Fackel 10 m); vorher faerbte
   schon ein Bengalholz den ganzen Platz wie ein Scheinwerfer */
function klBengal(z,p,dt,A,o){
  o=o||{}; const st=o.st===undefined?1:o.st; if(st<=0.01) return 0;
  const f=klFlacker(z,dt,o.ruhe), s=st*f;
  klFlamme(z,p,dt,A,{h:(o.h||0.12)*(0.8+0.35*f),r:o.r||0.018,st:Math.min(1.3,s),rate:o.rate||140,hof:o.hof||0.14});
  z.bsl=(z.bsl||0)+dt*(o.funken===undefined?3:o.funken)*st;
  for(;z.bsl>=1;z.bsl--){ const alt=SCHWEIF; SCHWEIF=0.05; const d=streu([0,1,0],0.9), v=rand(0.5,1.5);
    psSmall.emit(p.x,p.y+0.01,p.z,d[0]*v,d[1]*v,d[2]*v,1.2,0.72,0.3,rand(0.25,0.55),3,0); SCHWEIF=alt; }
  if(o.rauch!==false) klBengalRauch(z,p,dt,klSatt(A),st,o.rauch);
  if(o.licht) licht(o.licht.key,{x:p.x,y:p.y+(o.licht.h||0.3),z:p.z},klSatt(A),o.licht.st*s,{weite:o.licht.weite||6,rein:true});
  return s;
}

/* Magic Light: sechs Bengalstaebe stecken im Karton, jeder brennt in
   EINER Farbe und wird einzeln angezuendet - kein Gleichtakt, kein
   Farbwechsel; die Flamme frisst sich den Stab hinab */
klEmit('bengalstab',(e,dt,o,t)=>{
  const F=(e.farben||['gruen','weiss']).map(c=>klF(c)), n=e.n||6, ZF=e.zuend||[0,0.9,1.7,2.9,3.4,4.6], FO=e.farbFolge||[0,1,1,0,1,0];
  if(!e.st){ const sf=klFlaeche(o); e.st=[];
    for(let i=0;i<n;i++){ const u=n>1?(i-(n-1)/2)/((n-1)/2):0, ang=u*(e.ang||0.1)+rand(-0.03,0.03), bx=o.x+u*(e.breit||0.035), L=rand(0.19,0.23), y0=Math.max(o.y,sf+0.02)-0.03;
      const s={x:bx,z:o.z+rand(-0.006,0.006),y0,ang,L,start:ZF[i%ZF.length],T:(e.brenn||9)*rand(0.88,1.1),C:F[FO[i%FO.length]%F.length],z0:{}};
      s.draht=klDraht(e,[[bx,y0,s.z],[bx+Math.sin(ang)*L,y0+Math.cos(ang)*L,s.z]]); e.st.push(s); }
    e.t=Math.max(...e.st.map(s=>s.start+s.T))+1.2; }
  const H=klHell(); let an=0; const lc=[0,0,0];
  for(const s of e.st){ const lt=t-s.start, col=s.draht.userData.col, u=clamp(lt/s.T,0,1), L=s.L*(1-0.75*u);
    const tip={x:s.x+Math.sin(s.ang)*L,y:s.y0+Math.cos(s.ang)*L,z:s.z};
    const gl=lt>0?Math.max(0,1-Math.max(0,lt-s.T)/0.8):0;
    col[0]=col[1]=col[2]=0.2*H+0.06; col[3]=0.25*H+0.9*gl; col[4]=0.2*H+0.35*gl; col[5]=0.18*H+0.1*gl;
    s.draht.userData.pos[3]=tip.x; s.draht.userData.pos[4]=tip.y; klDrahtAuf(s.draht,true);
    if(lt<0||lt>s.T) continue;
    if(!s.an){ s.an=1; schall(tip,v=>sfx.zischen(v*0.35,0.4)); }
    const w=klBengal(s.z0,tip,dt,s.C,{st:Math.min(1,lt/0.35)*Math.min(1,(s.T-lt)/0.4),h:0.09,r:0.012,rate:90,funken:1.2,rauch:{rate:1.5,gr:0.6,licht:0.5,h:0.08}});
    /* Bengalstaebe tropfen: gluehende Schlacke faellt ab und spritzt auf */
    s.gp=(s.gp===undefined?rand(1,2.5):s.gp)-dt; if(s.gp<=0){ s.gp=rand(1.4,3); klGlutperle({x:tip.x,y:tip.y-0.01,z:tip.z},FW.orange,0,4,0.8); }
    an++; const S=klSatt(s.C); lc[0]+=S[0]*w; lc[1]+=S[1]*w; lc[2]+=S[2]*w; }
  /* EIN Raumlicht in der Mischfarbe der brennenden Staebe (L5: klein halten) */
  if(an){ const m=Math.max(lc[0],lc[1],lc[2],0.01); licht('bs'+e.prod,{x:o.x,y:o.y+0.35,z:o.z},[lc[0]/m,lc[1]/m,lc[2]/m],0.2+0.06*an,{weite:3,rein:true}); }
  e.fz=(e.fz||0)-dt; if(e.fz<=0&&an){ e.fz=1.4; sfx.fauchen(distVol(o)*0.06*an,1.6); }
});

/* Bengalhoelzer: Ratsch mit weisser Stichflamme, Kugelflamme, Glimmen mit Rauchfaden */
klEmit('zuendholz',(e,dt,o,t)=>{
  const A=e.A||FW.rot, st=e.stich||0.25, T=e.T0||(e.T0=e.t), gl=e.glimm||1;
  if(!e.holz){ const sf=klFlaeche(o); e.kopf={x:o.x,y:Math.max(o.y,sf)+0.1,z:o.z}; e.t=st+T+gl+1.5;
    e.holz=klDraht(e,[[o.x,e.kopf.y-0.1,o.z],[o.x,e.kopf.y,o.z]]); const c=e.holz.userData.col; c[0]=0.25;c[1]=0.16;c[2]=0.08;c[3]=0.35;c[4]=0.2;c[5]=0.1; klDrahtAuf(e.holz);
    const p=e.kopf, alt=SCHWEIF; SCHWEIF=0.08; flash(p,FW.weiss,1.0,0.2);
    for(let k=0;k<15;k++){ const d=streu([rand(-0.4,0.4),1,rand(-0.3,0.3)],0.5), v=rand(1.5,3); psSmall.emit(p.x,p.y,p.z,d[0]*v,d[1]*v,d[2]*v,1.5,1.4,1.2,rand(0.15,0.3),3,0); }
    SCHWEIF=alt; schall(p,v=>{ sfx.ratsch(v*1.2); later(0.06,()=>sfx.zischen(v*0.9,0.35)); }); }
  const p=e.kopf, alt=SCHWEIF; SCHWEIF=0;
  if(t<st){ const k=1-t/st; psMid.emit(p.x,p.y+0.03,p.z,0,0.6,0,2*k+0.4,2*k+0.4,1.9*k+0.4,0.05,0,0);
    psBig.emit(p.x,p.y+0.04,p.z,0,0,0,0.9*k,0.9*k,0.85*k,0.05,0,0); licht('zh'+e.prod+e.nr,p,[1,1,0.95],2.2*k+0.5,{weite:4}); }
  else if(t<st+T){ const u=t-st, s=Math.min(1,u/0.2)*Math.min(1,(st+T-t)/0.3);
    /* 28.09., Tom: echt - flackernde Bengalflamme 7-9 cm mit Rauchfaden,
       faerbt die Umgebung (vorher ein ruhiger 4-cm-Leuchtball) */
    /* 30.09., Tom: "Lichter heller machen, ist so schwach" - Flamme groesser
       und dichter, Leuchthof breiter, Raumlicht 0,3 -> 1,1 und 4 m weit
       (29.09. war es auf 2,5 m gedrosselt, weil es den Platz flutete) */
    SCHWEIF=alt; klBengal(e.bz||(e.bz={}),{x:p.x,y:p.y+0.01,z:p.z},dt,A,{st:s,h:0.095,r:0.013,rate:150,hof:0.28,funken:2.5,
      rauch:{rate:1.2,gr:0.45,licht:0.8,h:0.06,dauer:4},licht:{key:'zh'+e.prod+e.nr,st:1.1,h:0.25,weite:4}}); SCHWEIF=0;
    zischBett(e,'bengal',distVol(o)*0.7*s,dt); }
  else if(t<st+T+gl+1.2){ const u=(t-st-T)/gl, k=Math.max(0,1-u);
    if(u<1) psSmall.emit(p.x,p.y,p.z,0,0,0,1*k,0.4*k,0.1*k,0.05,0,0);
    /* Rauchfaden: steigt senkrecht, leicht wellig */
    e.rf=(e.rf||0)-dt; if(e.rf<=0&&u<1.1){ e.rf=0.1; psMid.emit(p.x,p.y+0.02,p.z,Math.sin(t*5)*0.03,0.5,0,0.09,0.09,0.1,1.3,-0.05,0); klFarbig(psMid); } }
  SCHWEIF=alt;
});

/* Blaue Stunde: drei Bengaltoepfe, EINE Farbe (Blau), nacheinander
   gezuendet; unruhige Flamme, Rauch nur an der Flamme blau angestrahlt */
klEmit('bengaltopf',(e,dt,o,t)=>{
  if(e.T0===undefined){ e.T0=e.t; e.t=e.T0+1.5; e.bz={}; }
  const C=e.A||FW.blau, sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.01,z:o.z}, s=Math.min(1,t/0.5)*clamp((e.T0-t)/0.8,0,1);
  if(!e.an){ e.an=1; flash({x:p.x,y:p.y+0.3,z:p.z},C,0.8,0.2); schall(p,v=>sfx.zischen(v*0.6,0.5)); }
  /* Blau wirkt additiv dunkel: dichtere Flamme (220/s) */
  const w=klBengal(e.bz,p,dt,C,{st:s,h:0.2,r:0.026,rate:220,hof:0.2,funken:2,rauch:{rate:2.8,gr:1.2,licht:0.8,steigen:0.45,dauer:6,h:0.2}});
  if(w>0.01) licht('bt'+e.prod+e.pi,{x:p.x,y:p.y+0.5,z:p.z},klSatt(C),0.6*w,{weite:5,rein:true});
  e.fz=(e.fz||0)-dt; if(e.fz<=0&&s>0.2){ e.fz=1.8; sfx.zischen(distVol(o)*0.22,2); }
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
  if(s>0.01){ klFlamme(e,p,dt,A,{h:0.3,r:0.035,st:Math.min(1.3,st),rate:400,hof:0.8,hofGross:0.35,strahl:true});
    licht('fa'+e.prod,{x:p.x,y:p.y+0.15,z:p.z},A,(e.hell||1.6)*st,{weite:10,rein:true});
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

/* Hafenlichter: ein rotes und ein gruenes Bengalfeuer im selben Topf,
   das gruene zuendet gut eine Sekunde spaeter; beide brennen ruhig
   flackernd durch (kein Takt) und verloeschen nicht ganz gleichzeitig */
klEmit('hafenfeuer',(e,dt,o,t)=>{
  if(!e.tp){ const sf=klFlaeche(o); e.T0=e.t;
    e.tp=[e.links||{x:-0.06,A:'rot'},e.rechts||{x:0.06,A:'gruen',at:1.1,frueher:1.3}].map(q=>({p:{x:o.x+q.x,y:Math.max(o.y,sf)+0.01,z:o.z},A:klF(q.A),start:q.at||0,ende:e.T0-(q.frueher||0),z:{}}));
    e.t=e.T0+1.5; }
  let an=0;
  e.tp.forEach((q,i)=>{ const lt=t-q.start; if(lt<0) return;
    if(!q.an){ q.an=1; flash({x:q.p.x,y:q.p.y+0.3,z:q.p.z},klSatt(q.A),1.2,0.25); schall(q.p,v=>sfx.zischen(v*0.7,0.6)); }
    const s=Math.min(1,lt/0.6)*clamp((q.ende-t)/0.7,0,1); if(s<0.01) return; an++;
    klBengal(q.z,q.p,dt,q.A,{st:s,h:0.26,r:0.03,rate:190,hof:0.2,funken:3.5,rauch:{rate:2.6,gr:1.4,licht:0.75,steigen:0.5,dauer:7,h:0.25},
      licht:{key:'hf'+e.prod+i,st:0.9,h:0.5,weite:7}}); });
  e.fz=(e.fz||0)-dt; if(e.fz<=0&&an){ e.fz=2.2; sfx.regen(distVol(o)*0.18*an,2.6); }
});

/* Blitztuerme: vier Strobe-Toepfe (drei Weiss, einer Rot) im Karton.
   Jeder blitzt in eigenem, unruhigem Takt (jeder Abstand +-35 %), dazwischen
   dunkel; kein Dauerlicht - gegen Ende werden sie langsamer und gehen
   einzeln aus. Ueber jedem Topf ein duenner Rauchfaden (28.09., Tom: echt) */
klEmit('strobotopf',(e,dt,o,t)=>{
  const TP=e.toepfe||[{A:'weiss',hz:6}], a=(e.a||0.05)/2;
  if(!e.tp){ const sf=klFlaeche(o), ecken=[[-a,-a],[a,a],[a,-a],[-a,a]]; e.T0=e.t;
    e.tp=TP.map((q,i)=>({p:{x:o.x+ecken[i%4][0],y:Math.max(o.y,sf)+0.01,z:o.z+ecken[i%4][1]},A:klF(q.A),hz:q.hz,start:q.at!==undefined?q.at:i*(e.gap||0.6),ende:e.T0-(q.frueher||0),nb:0,klang:[1.7,0.6,1.0,0.45][i%4]}));
    e.t=e.T0+1; }
  const alt=SCHWEIF, H=klHell(); let blitz=null;
  e.tp.forEach(q=>{ const lt=t-q.start; if(lt<0||t>q.ende) return;
    /* zwischen den Blitzen glimmt der Satz schwach und wirft Glutkoernchen */
    q.gk=(q.gk||0)+dt*22; SCHWEIF=0.03;
    for(;q.gk>=1;q.gk--){ const d=streu([0,1,0],0.7), v=rand(0.15,0.5); psSmall.emit(q.p.x,q.p.y+0.01,q.p.z,d[0]*v,d[1]*v,d[2]*v,0.32,0.14,0.05,rand(0.3,0.55),1,0); }
    SCHWEIF=alt;
    q.nb-=dt; if(q.nb>0) return;
    const lahm=1+0.9*clamp((t-(q.ende-2.5))/2.5,0,1); q.nb=rand(0.65,1.35)*lahm/q.hz;
    const p=q.p, C=klMisch(q.A,[1,1,1],0.35), k=rand(1.5,2.1); SCHWEIF=0;
    psBig.emit(p.x,p.y+0.03,p.z,0,0,0,C[0]*k,C[1]*k,C[2]*k,0.035,0,0);
    psSmall.emit(p.x,p.y+0.02,p.z,0,0,0,2,2,2,0.03,0,0);
    for(let j=0;j<3;j++){ const d=streu([0,1,0],1), v=rand(0.4,1); psSmall.emit(p.x,p.y+0.02,p.z,d[0]*v,d[1]*v,d[2]*v,C[0]*1.2,C[1]*1.2,C[2]*1.2,rand(0.05,0.1),2,0); }
    if(Math.random()<0.3) rauchball({x:p.x,y:p.y+0.08,z:p.z},{r:0.1,n:1,dauer:2.2,steigen:0.35,c:[0.3*H+0.08,0.3*H+0.08,0.31*H+0.09],a:0.22,wind:[0.1,0.03]});
    if(!blitz||k>blitz.k) blitz={p,C,k,klang:q.klang}; });
  SCHWEIF=alt;
  /* Raumlicht nur im Blitz (hoechstens ein Blitzlicht je Bild), Knistern je Blitz */
  if(blitz){ flash({x:blitz.p.x,y:blitz.p.y+0.25,z:blitz.p.z},blitz.C,0.55*blitz.k,0.05); sfx.klick(distVol(o)*0.7,blitz.klang*rand(0.9,1.1)); }
});
/* ---------------------------------------------------------
   Bewegung am Boden: Schlangen, Kreisel, Flitzer, Erbsen, Frosch
   --------------------------------------------------------- */
/* Pharaoschlangen: Ketten aus Aschekugeln wachsen 3 cm/s aus vier
   Tabletten im Rhombus, winden sich; die Spitze glimmt und raucht.
   Die zweite (koenig) ist dicker und hebt am Ende den Kopf. */
klEmit('ascheschlange',(e,dt,o,t)=>{
  const n=e.n||4, sp=0.008, W=e.winden||{amp:0.06,wellen:1.5}, KG=e.koenig||{};
  if(!e.sl){ const sf=klFlaeche(o), R=0.03; /* 28.09., Tom: am Produkt - Tabletten auf dem Karton-Feld, vorher 7-9 cm daneben */
    const geo=klMat('kugelgeo',()=>new THREE.SphereGeometry(1,7,5));
    const mat=klMat('asche',()=>new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x1c1a18}));
    e.im=new THREE.InstancedMesh(geo,mat,n*64);
    /* Farbpuffer vor count=0 anlegen (sonst leer: Glut und Grau fehlten) */
    if(e.im.setColorAt) e.im.setColorAt(0,klFarbe3(1,1,1)); e.im.count=0; e.im.frustumCulled=false; e.im.userData.geoFest=true; klMesh(e,e.im);
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
    let px=s.x0, pz=s.z0, a=s.a, tip=null, fuss=null;
    for(let j=0;j<=nseg&&k<n*64;j++){ const u=j*sp;
      /* Richtung: Grundkurve plus Windung; die Phase wandert leicht (Nachwinden) */
      const w=W.amp*2*Math.PI*W.wellen/Math.max(0.1,s.L)*Math.cos(2*Math.PI*W.wellen*u/s.L+s.ph)*0.9+0.25*Math.sin(u*40-t*1.2+s.ph)*0.06;
      a=s.a+s.krumm*u+w; px+=Math.cos(a)*sp; pz+=Math.sin(a)*sp;
      const zur=len-u, spitz=zur<0.02?0.55+zur/0.02*0.45:1, r=s.d/2*spitz*(0.82+0.18*Math.sin(u*310+s.ph)+0.1*Math.sin(u*97));
      let y=e.sf+r*0.8;
      if(s.koenig&&lt>e.T0-s.start-2){ const hb=Math.min(1,(lt-(e.T0-s.start-2))/1.2), f=clamp(1-zur/0.1,0,1); y+=(KG.aufbaeumen||0.1)*hb*f*f; }
      M.compose(V.set(px,y,pz),Q,S.set(r,r*0.85,r)); e.im.setMatrixAt(k,M);
      const g=0.3+0.1*Math.sin(u*170+s.ph), glut=u<0.015&&wachs<e.T0-s.start?1:0; /* es brennt an der Tablette, die Asche schiebt sich hinaus */
      if(e.im.setColorAt) e.im.setColorAt(k,col.setRGB(glut?0.9:g,glut?0.35:g*0.97,glut?0.1:g*0.93));
      k++; if(j===0) fuss={x:px,y:y+r*0.6,z:pz}; if(j===nseg) tip=fuss; }
    /* Glut und Rauchfaden an der Tablette (vorher an der Spitze: Asche glueht nicht) */
    if(tip&&lt<e.T0-s.start+0.8){ const fl=0.6+0.4*Math.random(), aus=Math.max(0,Math.min(1,(e.T0-s.start+0.8-lt)/0.8));
      psSmall.emit(tip.x,tip.y,tip.z,0,0,0,1.2*fl*aus,0.45*fl*aus,0.08*aus,0.05,0,0);
      psMid.emit(tip.x,tip.y,tip.z,0,0,0,0.25*fl*aus,0.08*fl*aus,0.01,0.05,0,0); klFarbig(psMid);
      s.z.r=(s.z.r||0)+dt*3; for(;s.z.r>=1;s.z.r--) { psMid.emit(tip.x,tip.y+0.01,tip.z,rand(-0.02,0.02),rand(0.12,0.2),rand(-0.02,0.02),0.07*H+0.03,0.07*H+0.03,0.075*H+0.03,rand(2,3),-0.02,0); klFarbig(psMid); } } }
  SCHWEIF=alt;
  e.im.count=k; e.im.instanceMatrix.needsUpdate=true; if(e.im.instanceColor) e.im.instanceColor.needsUpdate=true;
  licht('ph'+e.prod,{x:o.x,y:e.sf+0.15,z:o.z},[1,0.45,0.15],0.35,{weite:2});
  e.zi=(e.zi||0)-dt; if(e.zi<=0&&t<e.T0){ e.zi=2.5; sfx.zischen(distVol(o)*0.08,2.2); }
});

/* Flitzer: sechs Treiber rasen kreischend im Zickzack ueber den Boden,
   Goldspur mit Nachleuchten, jeder endet mit einem Knall */
klEmit('bodenflitzer',(e,dt,o,t)=>{
  const n=e.n||6, TK=e.takt||[0.15,0.15,0.6], V=e.v||[5,8], HK=e.haken||[0.18,0.4], WK=e.winkel||[0.45,0.9], TT=Array.isArray(e.tt)?e.tt:[2.2,3.2], HH=e.hoehe||[0.1,0.3];
  if(!e.fl){ const g=klVorne(o,1.0); e.g=g; e.fl=[]; let ts=0;
    for(let i=0;i<n;i++){ const sg=i%2?1:-1, a=Math.PI/2+sg*(e.ang||0.6)*(1+Math.floor(i/2)*0.3);
      e.fl.push({x:g.x+sg*0.05,z:g.z,a,v:rand(V[0],V[1]),hk:rand(HK[0],HK[1]),sg:sg,h:rand(HH[0],HH[1]),start:ts,T:rand(TT[0],TT[1]),kopf:klF((e.kopf||['weiss'])[i%(e.kopf||['weiss']).length]),zz:{}});
      ts+=TK[i%TK.length]; }
    /* 28.09. (Tom): sie zuenden am Produkt und springen vom Tisch auf den Boden */
    const sf=klFlaeche(o); e.ab=sf>0.5?0.4:0; e.src={x:o.x,y:sf+0.04,z:o.z};
    e.t=ts+Math.max(...e.fl.map(f=>f.T))+1+e.ab; }
  const alt=SCHWEIF, q=QUAL(), S=klF(e.spur,FW.gold), g=e.g, X0=g.x-4.5, X1=g.x+4.5, Z0=g.z-0.4, Z1=g.z+3.2;  /* Feld vor dem Tisch, gut 3 m Abstand zum Pult */
  e.fl.forEach((f,i)=>{ let lt=t-f.start; if(lt<0) return;
    if(e.ab){ if(f.x0===undefined){ f.x0=f.x; f.z0=f.z; }
      if(lt<e.ab){ const u=lt/e.ab, x=e.src.x+(f.x0-e.src.x)*u, z=e.src.z+(f.z0-e.src.z)*u, y=e.src.y+(g.y+f.h-e.src.y)*u+0.35*Math.sin(Math.PI*u);
        if(!f.zisch){ f.zisch=1; schall(e.src,v=>sfx.zischen(v*0.5,0.3)); }
        SCHWEIF=0.05; psSmall.emit(x,y,z,rand(-.3,.3),rand(0,.3),rand(-.3,.3),S[0],S[1],S[2],rand(0.2,0.4),2,0);
        SCHWEIF=0; psBig.emit(x,y,z,0,0,0,f.kopf[0]*1.2,f.kopf[1]*1.2,f.kopf[2]*1.2,0.05,0,0); SCHWEIF=alt; return; }
      lt-=e.ab; }
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
    /* Funkenspur: Kohlefunken spritzen hinter dem Treiber auf und verloeschen
       nach 0,2-0,35 s (28.09., Tom: echt - vorher lag 0,6 s eine Leuchtlinie) */
    f.zz.s=(f.zz.s||0)+dt*200*q; SCHWEIF=0.05;
    for(;f.zz.s>=1;f.zz.s--){ const u=Math.random(); psSmall.emit(x0+(f.x-x0)*u,y,z0+(f.z-z0)*u,rand(-.5,.5)-Math.cos(f.a)*0.8,rand(0.2,0.9),rand(-.5,.5)-Math.sin(f.a)*0.8,S[0]*1.1,S[1]*1.1,S[2]*1.1,rand(0.18,0.35),3,0); }
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
    const p0={x:o.x,y:o.y+0.05,z:o.z}; /* 28.09. (Tom): Wurf vom Produkt aus, nicht von der Tischkante */
    /* 28.09., Tom: der erste Knack am Karton - eine Erbse faellt beim
       Herausnehmen direkt daneben (erstNah m), die anderen fliegen */
    for(let i=0;i<(e.n||7);i++){ const nah=i===0&&e.erstNah, a=Math.PI/2+rand(-1,1)*(nah?0.2:(e.streu||0.5)), D=nah?e.erstNah:rand(W[0],W[1]), Hh=nah?0.05:rand(BH[0],BH[1]);
      const tx=p0.x+Math.cos(a)*D, tz=p0.z+Math.sin(a)*D, ty=klGrund(tx,tz), vy=Math.sqrt(2*9.8*Hh), T=vy/9.8+Math.sqrt(2*(p0.y+Hh-ty)/9.8);
      e.w.push({start:ts,T,vx:(tx-p0.x)/T,vz:(tz-p0.z)/T,vy,p0,ty,nach:NZ.nr===i+1?NZ.verz:0,farbe:i%3===2?(e.B||FW.rose):(e.A||FW.weiss)}); ts+=TK[i%TK.length]; }
    e.t=ts+2.5+(NZ.verz||0); }
  const alt=SCHWEIF; SCHWEIF=0;
  e.w.forEach(w=>{ const lt=t-w.start; if(lt<0||w.fertig) return;
    if(!w.los){ w.los=1; }
    if(lt<w.T){ const x=w.p0.x+w.vx*lt, z=w.p0.z+w.vz*lt, y=w.p0.y+w.vy*lt-4.9*lt*lt;
      /* Papierkuegelchen: leuchtet nicht, nur vom Platzlicht angestrahlt */
      const c=w.farbe, h=0.3*klPapH(); psSmall.emit(x,y,z,0,0,0,c[0]*h,c[1]*h,c[2]*h,0.05,0,0); return; }
    const p={x:w.p0.x+w.vx*w.T,y:w.ty,z:w.p0.z+w.vz*w.T};
    if(w.nach){ if(!w.still){ w.still=1; psSmall.emit(p.x,p.y+0.01,p.z,0,0,0,0.5,0.5,0.5,w.nach,0,0); }
      if(lt<w.T+w.nach) return; }
    w.fertig=1; klKnack(p); });
  SCHWEIF=alt;
});

/* Knallfrosch (froschsprung), Knallbonbon, Tischbombe und Brummkreisel
   stehen seit dem 03.10. (Tom: "komplett neu, wie echt") in 14q-klein-neu.js */

/* ---------------------------------------------------------
   Party: Konfettistrahl, Luftschlangen, Funkenschirm
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

/* Luftschlangen: Baender, die sich im Flug aus einer engen Locke zur
   lockeren Schraube entrollen, schwingend sinken und als Kringel liegen */
klEmit('luftschlange',(e,dt,o,t)=>{
  const RT=(e.rest&&e.rest.t)||20, NP=24, BR=0.015;
  if(!e.bd){ const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.05,z:o.z}, F=(e.farben||KL_BUNT).map(c=>klF(c)), H=klPapH();
    const LL=e.laenge||[1.2,2.2], ST=e.steig||[4.5,6.5], LK=e.locken||[3,6];
    e.bd=[];
    for(let i=0;i<(e.n||14);i++){
      const pos=new Float32Array(NP*2*3), idx=[]; for(let j=0;j<NP-1;j++){ const a=j*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setIndex(idx);
      /* 29.09., Tom: echt - Papier leuchtet nicht: Farbe gedeckt (vorher satt wie Neonroehren) */
      const C=klMisch(F[i%F.length],[0.45,0.45,0.45],0.3).map(c=>c*0.8), m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:klFarbe3(C[0]*H,C[1]*H,C[2]*H),side:THREE.DoubleSide,toneMapped:false}));
      m.frustumCulled=false; klMesh(e,m);
      /* neig [a,b]: Neigung gegen die Senkrechte (Tischbombe: in alle Richtungen) */
      const NG=e.neig||[0.05,0.4], a=rand(0,6.283), ne=rand(NG[0],NG[1]), v=rand(ST[0],ST[1])*1.22;
      e.bd.push({m,g,C,L:rand(LL[0],LL[1]),N:rand(LK[0],LK[1]),h:{x:p.x,y:p.y,z:p.z},v:[Math.sin(ne)*Math.cos(a)*v,Math.cos(ne)*v,Math.sin(ne)*Math.sin(a)*v],ph:rand(0,6),dreh:rand(-3,3),start:rand(0,0.12),liegt:null}); }
    /* Knack mit einem kleinen Goldglitzer aus der Roehre (still: der Knall kommt vom Traeger, z. B. Tischbombe) */
    if(!e.still){ const alt=SCHWEIF; SCHWEIF=0.06; psBig.emit(p.x,p.y,p.z,0,0,0,1.2,1.1,0.8,0.05,0,0);
    for(let k=0;k<Math.round(40*QUAL());k++){ const d=streu([0,1,0],0.5), s=rand(2,4.5); glint(psSmall,p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,FW.gold,2,{t0:0.3,t1:0.9,dim:0.6}); }
    SCHWEIF=alt;
    flash({x:p.x,y:p.y+0.3,z:p.z},FW.gold,0.6,0.08); schall(p,v=>{ sfx.crack(v*0.7); sfx.plopp(v*0.8,1.3); }); }
    e.t=e.liegen?e.liegen:9+RT; }
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
      for(let j=0;j<NP;j++){ const s=j/(NP-1), ph=2*Math.PI*Math.min(1.7,0.6+b.N*0.2)*s+b.ph, r=(0.04+0.13*s)*clamp(b.L/1.8,0.35,1)*(1+0.22*Math.sin(s*9+b.ph)), /* lockerer, unregelmaessiger Kringel (03.10.: vorher ein glattes Achteck) */ x=b.cx+Math.cos(ph)*r, z=b.cz+Math.sin(ph)*r, y=b.gy+0.004;
        const dx=Math.cos(ph)*BR/2, dz=Math.sin(ph)*BR/2, k=j*6, Z=[x-dx,y,z-dz,x+dx,y,z+dz];
        for(let c=0;c<6;c++) pos[k+c]=b.von[k+c]+(Z[c]-b.von[k+c])*ww; } }
    b.g.attributes.position.needsUpdate=true;
    if(e.t<1) b.m.visible=e.t>0.02; }
});

/* Tischfeuerwerk: Plopp, ein Schirm aus Funken, der nach aussen faellt.
   28.09., Tom: echt - ein Schirm aus Goldfunken (Striche, zum Teil
   verzweigt), dazwischen wenige rote Sternchen ohne Schweif; vorher drei
   Farbringe aus stehenden Blinkpunkten */
klEmit('funkenschirm',(e,dt,o,t)=>{
  if(e.los) return; e.los=1; e.t=0.1;
  const sf=klFlaeche(o), p={x:o.x,y:Math.max(o.y,sf)+0.02,z:o.z}, A=klF(e.A,FW.gold), B=e.B?klF(e.B):null, n=Math.round((e.n||120)*QUAL()), h=e.h||1.2, g=3;
  const vy=vFuerHoehe(h,g), alt=SCHWEIF;
  for(let i=0;i<n;i++){ const az=rand(0,6.283), th=rand(8,30)*Math.PI/180, vh=vy*Math.tan(th)*rand(0.9,1.1), v=vy*rand(0.9,1.05), l=rand(1.1,1.9)*(e.tt||1);
    const vx=Math.cos(az)*vh, vz=Math.sin(az)*vh;
    /* 29.09., Tom: echt - Goldfunken als Striche, die zerspritzen; die roten Sternchen klein (vorher 15-cm-Punkte) */
    if(B&&Math.random()<(e.anteil||0.15)){ SCHWEIF=0; psSmall.emit(p.x,p.y,p.z,vx,v,vz,B[0]*1.2,B[1]*1.2,B[2]*1.2,l*0.75,g,0); }
    else klFunke(p.x,p.y,p.z,vx,v,vz,[A[0]*0.95,A[1]*0.95,A[2]*0.95],l*rand(0.45,0.75),g,Math.random()<0.4?Math.round(rand(2,3)):0,0.2); }
  SCHWEIF=0; psBig.emit(p.x,p.y+0.05,p.z,0,0,0,1,0.9,0.7,0.05,0,0); SCHWEIF=alt;
  flash({x:p.x,y:p.y+0.6,z:p.z},FW.gold,0.45,0.3);
  rauchball({x:p.x,y:p.y+0.2,z:p.z},{r:0.3,n:1,dauer:3,steigen:0.3,c:[0.5*klHell()+0.1,0.5*klHell()+0.1,0.52*klHell()+0.1],a:0.3});
  schall(p,v=>{ sfx.plopp(v*1.2,1.2); later(0.2,()=>sfx.fizz(v*0.45)); });
});

/* ---------------------------------------------------------
   Boeller
   --------------------------------------------------------- */
/* Blitzknaller: ein weisser Blitz wie ein Fotoblitz - er leuchtet die
   Umgebung aus, der Bildschirm wird nicht weiss und es bleibt kein
   Nachbild (28.09., Tom: echt); Huellenfetzchen glimmen nach */
klEmit('weissblitz',(e,dt,o,t)=>{
  if(e.los) return; e.los=1; e.t=0.1;
  const sf=klFlaeche(o), p=e.bz!==undefined?{x:o.x+(e.bx||0),y:0.03,z:o.z+e.bz}:{x:o.x,y:Math.max(o.y,sf)+0.08,z:o.z}, v=distVol(p), alt=SCHWEIF;
  flash(p,FW.weiss,e.hell||4,0.09);
  SCHWEIF=0; psHuge.emit(p.x,p.y,p.z,0,0,0,1.6,1.6,1.55,0.05,0,0); psBig.emit(p.x,p.y,p.z,0,0,0,2,2,2,0.04,0,0);
  for(let k=0;k<30;k++){ const d=randDir(), s=rand(3,6); psSmall.emit(p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,2,2,2,0.06,0,0); }
  for(let k=0;k<Math.round(40*QUAL());k++){ const d=randDir(), s=rand(0.8,2.5); psSmall.emit(p.x,p.y,p.z,d[0]*s,Math.abs(d[1])*s+0.5,d[2]*s,0.9,0.45,0.12,rand(0.8,1.6),2.5,0); } SCHWEIF=alt;
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
  /* 28.09. (Tom): Rauch und kleine Knalle direkt am Produkt - der
     Knallteppich ist eine flache Matte: die Kette liegt in Schlaufen auf
     dem Karton (30 x 25 cm) und brennt dort Glied fuer Glied ab (vorher
     lief sie bis 0,46 m vor dem Karton zur Tischkante) */
  if(!e.pf){ const g={x:o.x,y:Math.max(o.y,klFlaeche(o)),z:o.z}, L=e.laenge||2.6, bx=e.bx||0.14, bz=e.bz||0.11;
    const roh=[]; for(let i=0;i<=80;i++){ const s=i/80; roh.push([g.x+bx*Math.sin(3*Math.PI*s),g.z-bz+s*2*bz]); }
    const P=klPfad(roh), f=L/P.L; e.pf=P; e.g=g; e.sk=f;
    const geo=klMat('gliedgeo',()=>new THREE.BoxGeometry(0.016,0.012,0.028)), H=klPapH();
    e.im=new THREE.InstancedMesh(geo,klMat('glied',()=>new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false})),NG); e.im.userData.geoFest=true; e.im.frustumCulled=false; klMesh(e,e.im);
    e.gl=[]; for(let i=0;i<NG;i++){ const u=i/(NG-1), [x,z]=klPfadOrt(P,u), [x2,z2]=klPfadOrt(P,Math.min(1,u+0.01)); e.gl.push({x,z,a:Math.atan2(x2-x,z2-z),u,hop:0});
      if(e.im.setColorAt) e.im.setColorAt(i,klFarbe3(0.75*H+0.08,0.08,0.06)); }
    /* Zuendzeiten: Abstand linear von gap auf gapEnde */
    e.z=[0]; for(let i=1;i<NK;i++) e.z.push(e.z[i-1]+(e.gap||0.12)+((e.gapEnde||0.045)-(e.gap||0.12))*i/(NK-1));
    const S=e.schluss||{knalle:3,gap:0.35}; e.ende=e.z[NK-1]+0.3; e.S=S; e.nr=0; e.sn=0; e.t=e.ende+S.knalle*S.gap+1.5; }
  const P=e.pf, g=e.g, M=new THREE.Matrix4(), Q=new THREE.Quaternion(), V=new THREE.Vector3(), SC=new THREE.Vector3(1,1,1), SC0=new THREE.Vector3(0.0001,0.0001,0.0001), Y=new THREE.Vector3(0,1,0);
  const alt=SCHWEIF, v0=distVol(g);
  while(e.nr<NK&&t>=e.z[e.nr]){ const u=e.nr/(NK-1), [x,z]=klPfadOrt(P,u), p={x,y:g.y+0.02,z};
    SCHWEIF=0; psBig.emit(x,p.y+0.03,z,0,0,0,1.5,1.2,0.7,0.04,0,0); psHuge.emit(x,p.y+0.06,z,0,0,0,0.8,0.55,0.25,0.05,0,0);
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

/* Goldstaub: Schlag, eine Garbe Goldglitter steigt 2-3 m; jedes Korn
   fliegt ballistisch (schnell raus, gebremst, faellt), blinkt dabei
   unregelmaessig (Flitter, jedes Korn fuer sich) und verlischt im Fallen.
   28.09., Tom: echt - vorher standen 400 Koerner als Wolke in der Luft
   und blitzten als Welle von oben nach unten (Lichtshow) */
klEmit('goldstaub',(e,dt,o,t)=>{
  if(e.los){ const m=e.mitte, st=t<0.25?1.2:1.0*Math.exp(-t/1.4);
    if(st>0.05) licht('gs'+e.prod,{x:m.x,y:m.y-0.4*t,z:m.z},[1,0.74,0.3],st*(0.85+0.3*Math.random()),{weite:8});
    return; }
  e.los=1; e.t=4.5;
  const sf=klFlaeche(o), p0={x:o.x,y:Math.max(o.y,sf)+0.05,z:o.z}, n=Math.round((e.n||260)*QUAL()), h=e.h||2.6;
  const A=klF(e.A,FW.gold), B=klF(e.B,FW.zitrone), v=distVol(p0), alt=SCHWEIF, G=2.2;
  e.mitte={x:p0.x,y:p0.y+h*0.6,z:p0.z};
  SCHWEIF=0; psHuge.emit(p0.x,p0.y+0.15,p0.z,0,0,0,1.3,1.0,0.5,0.07,0,0); SCHWEIF=alt;
  smallPop(p0.x,p0.y,p0.z,40,5,0.35,FW.gold);
  flash({x:p0.x,y:p0.y+0.8,z:p0.z},FW.bernstein,0.9,0.2);
  rauchball({x:p0.x,y:p0.y+0.3,z:p0.z},{r:0.5,n:2,dauer:5,quellen:1,steigen:0.25,c:[0.5*klHell()+0.1,0.5*klHell()+0.1,0.52*klHell()+0.1],a:0.35,wind:[0.1,0.03]});
  schall(p0,vv=>{ sfx.boom(vv*0.8); later(0.4,()=>sfx.rieseln(vv*1.2,2.2)); }); shake=Math.max(shake,0.3*v);
  const vy0=vFuerHoehe(h,G);
  for(let i=0;i<n;i++){
    const d=streu([0,1,0],0.5*Math.sqrt(Math.random())), sp=vy0*rand(0.7,1.05)/Math.max(0.5,d[1]), V=[d[0]*sp,d[1]*sp,d[2]*sp];
    const C=Math.random()<0.65?A:B, L=rand(2.2,3.4), ph=rand(0,1), hz=rand(5,11);
    fuehre(psSmall,p0.x,p0.y,p0.z,V[0],V[1],V[2],C,L,s=>{ /* 29.09.: 7-cm-Flitter statt 15-cm-Kugeln */
      const a=s.alter, q=bahnOrt(p0,V,G,a), w=bahnTempo(V,G,a); s.p[0]=q.x; s.p[1]=q.y; s.p[2]=q.z; s.v[0]=w[0]; s.v[1]=w[1]; s.v[2]=w[2];
      /* Flitter: kurzes Aufblitzen in eigenem, unruhigem Takt, dazwischen fast dunkel; zum Ende schwaecher */
      const aus=Math.max(0,1-Math.pow(a/L,2)), fl=((a*hz+ph)%1)<0.28&&Math.random()<0.8;
      s.hell=(a<0.18?1.1:fl?1.7:0.1)*aus; s.c=C; },{spur:0.04}); }
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
      /* 29.09., Tom: echt - Pigmentrauch ist stumpf, nachts nur angestrahlt (vorher leuchtend rot wie ein Farbscheinwerfer) */
      const L=Math.min(1.1,0.7*H*k.hell*(0.75+0.25*(0.5+0.5*dy))*blitz), c=klMisch(C,[0.6,0.6,0.62],0.35+bleich);
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
  /* 30.09. (Tom): "50 Stueck enthalten, da kommen nur 5, 6 Knalle" - jetzt
     30 Erbsen (Packung: 30 Stueck), geworfen wie echt: handvollweise, drei
     bis fuenf kurz hintereinander, dann eine Pause zum Nachgreifen */
  knallerbsen:{stueck:30,lunte:0,dauer:12,
    /* Wurf zum Pult hin statt weg: hinter dem Tisch saehe man die Aufschlaege vom Pult aus nicht */
    phasen:[{k:'wurferbse',at:0,n:30,takt:[0.12,0.08,0.15,0.7, 0.1,0.14,0.09,0.12,0.8, 0.15,0.1,0.55, 0.08,0.12,0.1,0.9, 0.11,0.09,0.13,0.07,0.6, 0.14,0.1,0.75, 0.09,0.12,0.1,0.65, 0.12,0.1],
      weite:[1.2,3.8],bogenH:[0.5,1.5],streu:0.65,erstNah:0.05,A:'weiss',B:'rose',nachzuegler:{nr:17,verz:1.3}}],
    rest:{k:'bodenrest',art:'fleck',t:10}},
  partypopper:{stueck:3,lunte:0,dauer:6,
    phasen:[{k:'konfettistrahl',folge:[{at:0.3,x:0,neig:0.25,azi:0},{at:1.0,x:-0.25,neig:0.7,azi:-0.6},{at:1.6,x:0.25,neig:0.7,azi:0.6}],
      n:160,oeffnung:0.45,weite:3,farben:['rot','gold','gruen','blau','magenta','tuerkis','zitrone']}],
    rest:{k:'bodenrest',art:'konfetti',t:25}},
  tisch:{stueck:1,lunte:0.6,dauer:5,
    /* 28.09., Tom: echt - Goldschirm mit wenigen roten Sternchen, dann ein kleiner Goldschirm (vorher drei Farbringe) */
    phasen:[{k:'funkenschirm',at:0,h:1.3,n:170,A:'gold',B:'rot',anteil:0.14,t:2.4},
            {k:'funkenschirm',at:0.75,h:0.75,n:70,A:'gold',tt:0.8,t:1.6}]},
  /* 03.10. (Tom: "Podest statt Verpackung, groesser, sichtbarer"): drei
     Goldkerzen stecken gefaechert im Mini-Podest, jede zuendet an der
     vorigen - drei Funkenbaelle statt einem; Funken weiter und dichter */
  wunder:{stueck:1,lunte:0,dauer:23,
    phasen:[{k:'wunderkerze',at:0,t:13,versatz:3.0,laenge:0.5,material:'eisen',A:'gold',B:'bernstein',verzweig:1,n:9,nachglut:true,endperle:true}]},
  wunderfarbe:{stueck:4,lunte:0,dauer:20,
    /* x leicht versetzt: die naechste Kerze uebernimmt neben der vorigen */
    phasen:[{k:'farbspitze',material:'farbspitze',laenge:0.35,t:5,A:'gold',spitze:0.3,
      /* 28.09., Tom: ein Farbthema - Rot und Gruen im Wechsel (vorher vier Farben), am Karton */
      folge:[{at:0,B:'rot',x:-0.05},{at:4.4,B:'gruen',x:-0.017},{at:8.8,B:'rot',x:0.017},{at:13.2,B:'gruen',x:0.05}]}]},
  /* L2 */
  wunderherz:{stueck:1,lunte:0,dauer:13,
    /* 28.09., Tom: Herz 17 cm statt 35 (passt auf den Karton), Goldfunken wie eine echte Wunderkerze, das Herz glueht rot nach */
    /* 29.09., Tom: der Effekt soll sichtbar am Herz entlang laufen - die
       Funkenwolke (40 cm) deckte das 17-cm-Herz zu. Jetzt 24 cm Herz, kurze
       Funken (Reichweite ~15 cm) und weniger davon: man sieht die zwei
       Glutpunkte die Herzlinie hochwandern und das Herz rot nachgluehen. */
    /* 03.10., Tom: "Herz groesser" - 36 cm Herz auf 12-cm-Stiel im Podest, grauer Mantel, der abbrennt */
    phasen:[{k:'herzdraht',form:'herz',at:0,t:8,groesse:0.36,stiel:0.12,start:'spitze',fronten:2,n:4,tempo:0.32,weite:1.0,A:'gold',B:'bernstein',glut:'rot',treffen:{flash:'weiss',funken:70},nachglut:2.6}]},
  /* 03.10. (Tom: "es kommen nur Kronen raus"): vier Bonbons reissen
     nacheinander, aus jedem fliegen Papierkrone, Witzzettel, Spielzeug
     und Konfetti - jedes Bonbon mit anderem Inhalt (14q, bonbonriss) */
  knallbonbon:{stueck:4,lunte:0,dauer:17,
    phasen:[{k:'bonbonriss',at:0,zeiten:[0.5,3.1,5.9,8.4],liegen:16}],
    rest:{k:'bodenrest',art:'konfetti',t:20}},
  /* 03.10. (Tom: "komplett neu, wie echt"): gefaltetes Zickzack-Paeckchen,
     Zuendschnur glimmt, zehn Knalle im unregelmaessigen Takt, jeder wirft
     es in eine neue Richtung, am Ende liegt es verkohlt da (14q) */
  knallfrosch:{stueck:1,lunte:0,dauer:10,
    phasen:[{k:'froschsprung',at:0,lunte:1.4,knalle:10,takt:[0.42,0.31,0.66,0.24,0.5,0.85,0.29,0.38,0.58],sprung:[0.12,0.5],hoehe:[0.05,0.38],
      letzter:{hoehe:0.45,doppel:true}}]},
  pharao:{stueck:4,lunte:0,dauer:16,
    phasen:[{k:'ascheschlange',at:0,n:4,versatz:0.8,t:14,laenge:[0.25,0.45],dicke:0.035,winden:{amp:0.06,wellen:1.5},glut:'orange',rauch:true,anordnung:'rhombus',
      koenig:{nr:2,dicke:1.6,aufbaeumen:0.1}}]},
  /* 03.10. (Tom: "was rauskommt ist irgendwas, landet immer an der
     gleichen Stelle"): Inhalt wie eine echte Tischbombe - Papierhuetchen,
     Luftruessel, Troeten, Masken, Pappnasen, Spielzeug, Konfetti und
     Luftschlangen fliegen in alle Richtungen, verschieden weit und hoch,
     bleiben auf Tisch und Boden liegen (14q, bombenwurf) */
  tischbombe:{stueck:1,lunte:1.2,dauer:17,
    phasen:[{k:'bombenwurf',at:0,liegen:15},
            {k:'luftschlange',at:0.02,still:true,n:9,laenge:[0.7,1.5],steig:[2.4,4.2],neig:[0.3,1.05],locken:[3,5],schwing:0.35,liegen:15,farben:['rot','gold','gruen','blau','magenta','tuerkis']}],
    rest:{k:'bodenrest',art:'konfetti',t:20}},
  bengalholz:{stueck:4,lunte:0,dauer:14,
    phasen:[{k:'zuendholz',t:4,stich:0.25,glimm:1.0,
      /* 28.09., Tom: am Produkt - die Hoelzer stecken im Karton (vorher bis 15 cm daneben) */
      folge:[{at:0,x:-0.03,A:'rot'},{at:3.2,x:0.01,A:'gruen'},{at:6.1,x:-0.01,A:'rot'},{at:9.3,x:0.03,A:'gruen'}]}]},
  /* L3 */
  wunderzahl:{stueck:4,lunte:0,dauer:12,
    /* 28.09., Tom: Ziffern 13 cm hoch dicht an dicht - die Schrift steht ueber dem 32-cm-Karton (vorher 60 cm breit) */
    /* Silberfunken (Titan, kurz gehalten): Silvester-Silber, die Ziffern gluehen golden nach */
    /* 30.09., Tom: "die Funken direkt an der 2027, wie beim Herz" - die
       Titanfunken flogen 30-50 cm weit und machten aus 13-cm-Ziffern vier
       Funkenbaelle. Jetzt kurze Funken (Reichweite ~12 cm) direkt an der
       Glutfront, Ziffern 16 cm: man sieht die 2027 Strich fuer Strich entstehen */
    /* 03.10., Tom: "groesser, sichtbarer" - Ziffern 26 cm im langen Podest */
    phasen:[{k:'glutschrift',form:['2','0','2','7'],abstand:0.19,groesse:0.26,stiel:0.1,at:0,t:6.5,versatz:0.4,start:'strich',fronten:1,material:'titan',weite:0.4,A:'silber',B:'weiss',glut:'gold',nachglut:3.0,n:4, /* weniger Funken: die Ziffern sollen schon beim Brennen lesbar sein */
      schluss:{at:7.8,funkeln:1.0}}]},
  /* L4 */
  boeller:{stueck:1,lunte:1.2,dauer:5,phasen:[{k:'alt',fn:'furzboeller'}]},
  luftschlangentisch:{stueck:1,lunte:0.8,dauer:9,
    phasen:[{k:'luftschlange',at:0,n:14,laenge:[1.2,2.2],steig:[4.5,6.5],locken:[3,6],schwing:0.4,farben:['rot','gold','gruen','blau','magenta','tuerkis']}],
    rest:{k:'bodenrest',art:'band',t:20}},
  /* L5 */
  /* 30.09., Tom: "nur ein einziger - mehrmals am Boden, so fuenf, sechs Mal":
     sechs Knaller, einzeln angezuendet und vor den Tisch geworfen, jeder
     an einer anderen Stelle, in unregelmaessigem Abstand */
  blitzknaller:{stueck:6,lunte:1.0,dauer:6.5,
    /* 28.09., Tom: echt - Blitz wie ein Fotoblitz, kein weisser Bildschirm, kein Nachbild */
    phasen:[{k:'weissblitz',hell:4.0,knall:'trocken',folge:[{at:0,bx:-0.35,bz:1.25},{at:0.85,bx:0.5,bz:1.7},{at:1.9,bx:-0.7,bz:2.1},{at:2.45,bx:0.15,bz:1.45},{at:3.7,bx:0.8,bz:2.3},{at:4.6,bx:-0.2,bz:2.6}]}]},
  /* 03.10. (Tom: "richtige Kreise, die sich drehen - und vom Tisch ein
     bis zwei Meter nach oben"): sechs Feuerkreisel, jeder ein sichtbarer
     Feuerring mit tangentialen Spiralfunken; vier heben surrend ab wie
     ein Flying Saucer, zwei brummen auf dem Tisch aus (14q, feuerkreisel) */
  bodenkreisel:{stueck:6,lunte:0,dauer:11,
    phasen:[{k:'feuerkreisel',at:0,farbFolge:[['gold','rot'],['silber','gruen'],['gold','gruen'],['silber','rot'],['gold','rot'],['silber','gruen']]}]},
  leuchtstaebe:{stueck:6,lunte:0,dauer:16,
    /* 28.09., Tom: echt - Bengalstaebe je EINE Farbe (Gruen, Weiss), einzeln gezuendet, im Karton (vorher Faecher, synchroner Farbwechsel) */
    phasen:[{k:'bengalstab',at:0,n:6,farben:['gruen','weiss'],farbFolge:[0,1,1,0,1,0],zuend:[0,0.9,1.7,2.9,3.4,4.6],brenn:9,ang:0.1,breit:0.035}]},
  schwaermer:{stueck:6,lunte:0.8,dauer:8,
    phasen:[{k:'bodenflitzer',at:0,n:6,takt:[0.15,0.15,0.6],start:'v',ang:0.6,v:[5,8],haken:[0.18,0.4],winkel:[0.45,0.9],t:[2.2,3.2],hoehe:[0.1,0.3],
      spur:'gold',kopf:['weiss','rot','gruen','weiss','rot','gruen'],ende:'knall'}]},
  stroboblinker:{stueck:4,lunte:0,dauer:15,
    /* 28.09., Tom: echt - Strobe-Toepfe im Karton (a 5 cm), eigener unruhiger Takt je Topf, kein Dauerlicht-Endspurt, einzeln aus */
    phasen:[{k:'strobotopf',at:0,t:13,a:0.05,toepfe:[{A:'weiss',hz:6.5,at:0},{A:'weiss',hz:4.1,at:0.7,frueher:1.6},{A:'rot',hz:2.8,at:1.5,frueher:0.6},{A:'weiss',hz:5.3,at:2.1,frueher:2.4}]}]},
  /* L6 */
  /* 03.10. (Tom: "deutlich realistischer"): grauer 1-m-Stab im Podest,
     die weissgelbe Glutzone frisst sich hinab, dichte, zweimal verzweigte
     Sternfunken mit kurzer Lebensdauer, warmweisses Licht, ab und zu
     tropft Schlacke */
  wunderkerzeXXL:{stueck:1,lunte:0,dauer:32,
    phasen:[{k:'wunderkerze',at:0,t:30,laenge:1.0,material:'riesen',A:'weiss',B:'gold',dichte:2.4,n:9,
      glutperle:{alle:[1.4,2.8],A:'orange',huepf:1,spritz:6}}]},
  /* L8 */
  knallteppich:{stueck:1,lunte:1.2,dauer:9,
    phasen:[{k:'knallkette',at:0,form:'s',bx:0.14,bz:0.11,laenge:2.6,knalle:60,gap:0.12,gapEnde:0.045,papier:'rot',papierN:14,peitsche:[0.05,0.15],rauch:true,
      schluss:{knalle:3,gross:true,gap:0.35,flash:'bernstein'}}],
    rest:{k:'bodenrest',art:'papier',A:'rot',t:30}},
  wunderbox:{stueck:13,lunte:0,dauer:16,
    /* r 0,18 statt 0,6 (28.09., Tom): der Kranz steckt im Ringhalter der Box */
    phasen:[{k:'funkenkranz',at:0,n:12,r:0.18,zuend:'kreis',dreh:1,gap:0.22,t:9,kerze:{laenge:0.4,material:'eisen',A:'gold',B:'bernstein'},aus:'rueckwaerts'},
            {k:'titankerze',at:2.64,x:0,laenge:0.7,material:'titan',A:'silber',B:'weiss',t:8,aufflammen:true}]},
  bengalflamme:{stueck:3,lunte:0,dauer:15,
    /* 28.09., Tom: echt - drei blaue Bengaltoepfe (eine Farbe) nacheinander im Karton, Rauch nur an der Flamme blau */
    phasen:[{k:'bengaltopf',at:0,t:13.5,x:0,A:'blau'},
            {k:'bengaltopf',at:0.8,t:12.5,x:-0.065,A:'blau'},
            {k:'bengaltopf',at:1.7,t:11.8,x:0.065,A:'blau'}]},
  /* L9 */
  monsterboeller:{stueck:1,lunte:1.5,dauer:5,phasen:[{k:'alt',fn:'monsterknall'}]},
  bengalfackel:{stueck:1,lunte:0,dauer:32,
    phasen:[{k:'handfackel',at:0,t:30,A:'rot',kern:'weiss',hell:1.6,flacker:[8,12],rauch:{dichte:1.5,wind:true},schlacke:{alle:[0.4,0.9],glimm:1.5},stottern:{at:27,n:3}}]},
  /* L11 */
  goldstaubboeller:{stueck:1,lunte:1.3,dauer:8,
    /* 28.09., Tom: echt - Garbe aus Goldflitter, die steigt und fallend verlischt (vorher stehende Wolke mit Blitzwelle) */
    phasen:[{k:'goldstaub',at:0,h:2.6,n:260,A:'gold',B:'zitrone'}]},
  /* L13 */
  bengalduo:{stueck:2,lunte:0,dauer:32,
    /* 28.09., Tom: echt - zwei Bengalfeuer Rot und Gruen, ruhig flackernd, ohne Takt (vorher Sinus-Gegentakt) */
    phasen:[{k:'hafenfeuer',at:0,t:30,links:{x:-0.06,A:'rot'},rechts:{x:0.06,A:'gruen',at:1.1,frueher:1.3}}]},
  /* L14 */
  farbrauchboeller:{stueck:1,lunte:1.3,dauer:14,
    phasen:[{k:'farbrauchkugel',at:0,farbRotation:['rot','zitrone','gruen','blau','violett','orange'],r:[0.5,4],quellen:1.5,steig:0.3,halten:10,wind:true,eigenlicht:false}]},
  /* L17 */
  atomboeller:{stueck:1,lunte:1.8,dauer:20,phasen:[{k:'alt',fn:'atomboeller'}]}
});
Object.assign(SIGNATUR,{
  knallerbsen:{idee:'wurf',text:'Knall erst beim Aufprall, ein Nachzügler'},
  partypopper:{idee:'konfettistrahl',text:'gerichteter Schnipselstrahl, Teppich bleibt liegen'},
  tisch:{eff:'funkenschirm',text:'Goldschirm mit roten Sternchen, kleiner Nachschirm'},
  wunder:{idee:'glutfront',text:'drei Goldkerzen im Podest, eine zündet die nächste, Perle tropft ab'},
  wunderfarbe:{eff:'farbspitze',text:'Goldfunken mit rotem oder grünem Saum im Wechsel'},
  wunderherz:{idee:'herzdraht',text:'großes Herz: zwei Glutfronten fressen den Mantel hoch und treffen sich'},
  knallbonbon:{idee:'bonbonriss',text:'Bonbon reißt, Krone, Witzzettel und Spielzeug fliegen heraus - jedes Bonbon anders'},
  knallfrosch:{idee:'froschsprung',text:'Zickzack-Päckchen springt bei jedem Knall weiter, liegt verkohlt da'},
  pharao:{idee:'ascheschlange',text:'wachsende, sich windende Ascheschlangen'},
  tischbombe:{idee:'bombenwurf',text:'Hütchen, Rüssel, Tröten, Masken, Nasen und Spielzeug fliegen in alle Richtungen'},
  bengalholz:{idee:'zuendholz',text:'Stichflamme, Kugelflamme, Rauchfaden'},
  wunderzahl:{idee:'glutschrift',text:'2027 schreibt sich Strich für Strich'},
  boeller:{idee:'pups',text:'Pups mit grünbrauner Wolke am Boden'},
  luftschlangentisch:{idee:'luftschlange',text:'Bänder entrollen sich im Flug'},
  blitzknaller:{eff:'weissblitz',text:'Weißblitz wie ein Fotoblitz, trockener Knall'},
  bodenkreisel:{idee:'feuerkreisel',text:'drehende Feuerringe, vier steigen surrend 1-2 m auf, Farbwechsel, Knisterfinale'},
  leuchtstaebe:{idee:'bengalstab',text:'sechs Bengalstäbe grün und weiß, einzeln gezündet'},
  schwaermer:{eff:'bodenflitzer',text:'Bodenflitzer mit Haken und Kreischen'},
  stroboblinker:{idee:'strobotopf',text:'vier Strobe-Töpfe, jeder im eigenen unruhigen Takt, gehen einzeln aus'},
  wunderkerzeXXL:{eff:'sternfunken',text:'1-m-Kerze: Glutzone frisst sich hinab, dichte weißgelbe Sternfunken'},
  knallteppich:{idee:'chinakette',text:'Kette brennt in Schlaufen auf der Matte ab, rote Fetzen, drei Schlusskracher'},
  wunderbox:{idee:'kranzlauf',text:'Kranz zündet ringsum, Silberkerze in der Mitte'},
  bengalflamme:{eff:'bengaltopf',text:'drei blaue Bengaltöpfe nacheinander, blau angestrahlter Rauch'},
  monsterboeller:{idee:'druckring',text:'Feuerball, Druckring, zwei Echos'},
  bengalfackel:{idee:'starklicht',text:'Szene rot, Flackern, Schlacke tropft'},
  goldstaubboeller:{eff:'goldstaub',text:'Garbe aus Goldflitter, die fallend verlischt'},
  bengalduo:{idee:'hafenfeuer',text:'rotes und grünes Bengalfeuer, ruhig flackernd, 30 Sekunden'},
  farbrauchboeller:{eff:'farbrauchkugel',text:'quellende Pigmentkugel, je Böller eine Farbe'},
  atomboeller:{idee:'atompilz',text:'Weißblitz, Feuerball, Kappe, Stiel, Druckwelle'}
});

/* Fuer Tests: was ausser Funken zu sehen ist (fliegendes Papier,
   Meshes der laufenden Kleinfeuerwerk-Emitter) */
if(typeof window!=='undefined') window.__klein={KLEIN,papier:()=>KL_PAP.liste.length,
  sichtbar:()=>KL_PAP.liste.length+emitters.reduce((n,e)=>n+(e.meshes?e.meshes.length:0),0)};

/* Aus dem Sortiment genommene Produkte (02e, ENTFERNT) auch aus allen
   Effekt-Datenbanken streichen - sonst tauchten sie in Listen auf, die
   ueber SHOWS, FONT oder KLEIN laufen (Teststation, Signaturen). */
(function(){ if(typeof ENTFERNT==='undefined') return;
  const tabellen=[SHOWS,SIGNATUR,FONT,RAKETEN_KL,NEU_SHOWS,NEU_KUGEL,NEU_FONT,KLEIN,typeof NEUWARE!=='undefined'?NEUWARE:null,typeof KUGEL!=='undefined'?KUGEL:null];
  ENTFERNT.forEach(t=>tabellen.forEach(T=>{ if(T&&Object.prototype.hasOwnProperty.call(T,t)) delete T[t]; }));
})();

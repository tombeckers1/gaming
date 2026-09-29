/* =========================================================
   Neue Bruchbilder und Aufstiege (EFF.*) fuer die Anomalie-Ueberarbeitung
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   ========================================================= */

/* ---------------------------------------------------------
   Gemeinsame Bausteine (neue-effekte.md Abschnitt 0, 26.09.).
   Einmal gebaut, von vielen Bruechen, Aufstiegen und Emittern
   genutzt. API: /tmp/fw/api-B.md
   --------------------------------------------------------- */
/* Zeitfaecher: was im selben Bild (1/30 s) faellig wird, laeuft ueber
   einen einzigen Zeitgeber. Bei 2000 Glitzertropfen je Bruch waeren es
   sonst 2000 later()-Eintraege. */
const FAECHER=new Map();
function imBild(tz,fn){
  const k=Math.max(Math.floor(FW_UHR*30)+1,Math.round((FW_UHR+Math.max(0,tz))*30));
  let f=FAECHER.get(k);
  if(!f){ f=[]; FAECHER.set(k,f); later(Math.max(0,k/30-FW_UHR),()=>{ FAECHER.delete(k); for(const g of f) g(); }); }
  f.push(fn);
}
/* Hilfsdienst: ein unsichtbarer Emitter, der je Bild die gefuehrten
   Funken, die Dauerlichter und die Bodenreste pflegt. Er lebt nur,
   solange es etwas zu tun gibt. */
const DIENST={e:null};
function dienst(){ if(!DIENST.e||DIENST.e.t<=0){ DIENST.e={t:0.5,k:'dienst2',o:PAD}; emitters.push(DIENST.e); } else DIENST.e.t=0.5; }

/* glint: der Funke fliegt gedaempft (dim, 35 %) und blitzt nach tz
   genau einmal 30-50 ms hell auf; danach aus (glimm 0) oder schwach
   glimmend (glimm 0..1, rest s). tz zufaellig aus [t0,t1] oder fest;
   welle:{p0,d,v,t0} rechnet tz aus dem Ort (Welle entlang d mit v m/s). */
function glint(ps,x,y,z,vx,vy,vz,c,g,o){
  o=o||{};
  let tz=o.tz;
  if(tz===undefined&&o.welle){ const W=o.welle, d=W.d||[0,-1,0]; tz=(W.t0||0)+((x-W.p0.x)*d[0]+(y-W.p0.y)*d[1]+(z-W.p0.z)*d[2])/(W.v||4); }
  if(tz===undefined) tz=rand(o.t0!==undefined?o.t0:0.3,o.t1!==undefined?o.t1:1.2);
  tz=Math.max(0.02,tz);
  const dim=o.dim!==undefined?o.dim:0.35, alt=SCHWEIF;
  SCHWEIF=o.spur!==undefined?o.spur:0;
  ps.emit(x,y,z,vx,vy,vz,c[0]*dim,c[1]*dim,c[2]*dim,tz,g,0);
  SCHWEIF=alt;
  const p={x,y,z}, v=[vx,vy,vz];
  imBild(tz,()=>{ const q=bahnOrt(p,v,g,tz), w=bahnTempo(v,g,tz), b=o.blitz||2.6, B=o.blitzFarbe||[0.5+c[0]*0.5,0.5+c[1]*0.5,0.5+c[2]*0.5], a=SCHWEIF;
    SCHWEIF=0;
    (o.psBlitz||ps).emit(q.x,q.y,q.z,w[0],w[1],w[2],B[0]*b,B[1]*b,B[2]*b,rand(0.03,0.05),g,0);
    if(o.glimm) ps.emit(q.x,q.y,q.z,w[0],w[1],w[2],c[0]*o.glimm,c[1]*o.glimm,c[2]*o.glimm,o.rest||0.6,g,0);
    SCHWEIF=a;
    GLINT.n++; });
}
const GLINT={n:0};

/* knisterPop: ein Knacks - ein Bild Weissblitz, 6-15 Funken fuer 0,1 s,
   ein Klick. Budget: 600 Pops/s im ganzen Spiel (Stoss hoechstens 150),
   bei QUAL < 1 weniger; hoerbar hoechstens 40 Klicks/s.
   Rueckgabe false, wenn das Budget erschoepft ist. */
const POP={tok:150,kt:10,uhr:0,n:0};
function knisterPop(x,y,z,o){
  o=o||{};
  const q=QUAL(), cap=600*q, dt=Math.max(0,FW_UHR-POP.uhr); POP.uhr=FW_UHR;
  POP.tok=Math.min(150*q,POP.tok+dt*cap); POP.kt=Math.min(10,POP.kt+dt*40);
  if(POP.tok<1) return false;
  POP.tok-=1; POP.n++;
  const c=o.c||[1,.95,.82], alt=SCHWEIF; SCHWEIF=0;
  psBig.emit(x,y,z,0,0,0,1.6,1.6,1.5,0.034,0,0);
  const n=o.funken!==undefined?o.funken:6+Math.floor(Math.random()*10), s=o.tempo||rand(2,4.5);
  for(let i=0;i<n;i++){ const d=randDir(); psSmall.emit(x,y,z,d[0]*s,d[1]*s,d[2]*s,c[0],c[1],c[2],rand(0.07,0.12),1,0); }
  SCHWEIF=alt;
  if(o.leise!==true&&POP.kt>=1){ POP.kt-=1; const p={x,y,z}; schall(p,v=>sfx.klick(v*(o.laut||0.6),rand(0.8,1.6))); }
  return true;
}
/* knisterWolke: n Pops mit Poisson-Abstaenden ueber dauer s, verteilt in
   einer Kugel mit Radius r um p. fall m/s: die Wolke sinkt. Rueckgabe:
   Zahl der geplanten Pops. */
function knisterWolke(p,n,dauer,r,o){
  o=o||{}; n=Math.round(n); if(n<=0) return 0;
  let t=o.t0||0; const mittel=dauer/n;
  for(let i=0;i<n;i++){ t+=-Math.log(1-Math.random()*0.999)*mittel; if(t>(o.t0||0)+dauer) t=(o.t0||0)+Math.random()*dauer;
    const d=randDir(), f=Math.cbrt(Math.random())*r, tt=t, x=p.x+d[0]*f, y=p.y+d[1]*f*(o.flach||1)-(o.fall||0)*(tt-(o.t0||0)), z=p.z+d[2]*f;
    imBild(tt,()=>knisterPop(x,y,z,o)); }
  return n;
}

/* verzweig: Funke teilt sich nach tz (0,08-0,25 s) in n (2-6) Toechter
   von 0,1-0,18 s - Tannennadeln (Matsuba). tiefe 2: die Toechter teilen
   sich noch einmal. Toechter in o.ps2 (Standard psSmall), Farbe o.C. */
const VERZWEIG={n:0};
function verzweig(ps,x,y,z,vx,vy,vz,c,life,g,o){
  o=o||{};
  const tz=Math.min(life,o.tz!==undefined?o.tz:rand(0.08,0.25)), alt=SCHWEIF;
  SCHWEIF=o.spur!==undefined?o.spur:0.05;
  ps.emit(x,y,z,vx,vy,vz,c[0],c[1],c[2],tz,g,0);
  SCHWEIF=alt;
  const p={x,y,z}, v=[vx,vy,vz];
  imBild(tz,()=>{
    const q=bahnOrt(p,v,g,tz), w=bahnTempo(v,g,tz), sp=Math.hypot(w[0],w[1],w[2]), dn=sp>0.05?[w[0]/sp,w[1]/sp,w[2]/sp]:randDir();
    const nn=o.n===undefined?[2,6]:o.n, n=Array.isArray(nn)?Math.round(rand(nn[0],nn[1])):nn, tps=o.ps2||psSmall, ct=o.C||c, tiefe=o.tiefe||1;
    VERZWEIG.n+=n;
    for(let k=0;k<n;k++){ const d=streu(dn,o.streu||0.9), s=Math.max(sp*rand(0.55,0.95),o.minTempo||1.6), tl=rand(0.1,0.18);
      if(tiefe>1) verzweig(tps,q.x,q.y,q.z,d[0]*s,d[1]*s,d[2]*s,ct,tl+0.14,g,Object.assign({},o,{tiefe:tiefe-1,tz:tl,n:[2,3]}));
      else { const a=SCHWEIF; SCHWEIF=o.spur!==undefined?o.spur:0.05; tps.emit(q.x,q.y,q.z,d[0]*s,d[1]*s,d[2]*s,ct[0],ct[1],ct[2],tl,g,0); SCHWEIF=a; } }
  });
}

/* Gefuehrte Funken: Ort, Tempo und Helligkeit rechnet je Bild eine
   eigene Funktion fn(s,dt) statt der gemeinsamen Physik (Haengen,
   Pendeln, Schwarm, Kreisen). Der Funke bleibt ein gewoehnliches
   Partikel in ps. fn setzt s.p=[x,y,z], s.v=[vx,vy,vz], s.hell (0..),
   s.c (Farbe); gibt fn false zurueck, fliegt er frei weiter. o.ende(s)
   laeuft, wenn seine Zeit um ist. Hoechstens 1500 zugleich (QUAL). */
const GEFUEHRT=[];
function fuehre(ps,x,y,z,vx,vy,vz,c,life,fn,o){
  o=o||{};
  const i=ps.next, alt=SCHWEIF; SCHWEIF=o.spur!==undefined?o.spur:0;
  ps.emit(x,y,z,vx,vy,vz,c[0],c[1],c[2],life,0,o.mode||0);
  SCHWEIF=alt;
  /* Kennung: maxl leicht verstimmt - wird der Platz neu vergeben, merkt man es */
  ps.maxl[i]=life*(1+Math.random()*1e-4)+1e-5;
  const s={ps,i,mx:ps.maxl[i],p:[x,y,z],v:[vx,vy,vz],c,hell:1,alter:0,life,fn,o,d:{}};
  if(GEFUEHRT.length<Math.round(1500*QUAL())){ GEFUEHRT.push(s); dienst(); } else s.frei=true;
  return s;
}
function fuehrenTakt(dt){
  for(let k=GEFUEHRT.length-1;k>=0;k--){ const s=GEFUEHRT[k], ps=s.ps, i=s.i, j=i*3;
    const weg=ps.maxl[i]!==s.mx||ps.life[i]<=0;
    s.alter+=dt;
    if(weg||s.alter>=s.life){ if(!weg||s.alter>=s.life-0.05){ if(s.o.ende) s.o.ende(s); } GEFUEHRT.splice(k,1); continue; }
    let r;
    try{ r=s.fn(s,dt); }catch(e){ r=false; }
    if(r===false){ GEFUEHRT.splice(k,1); continue; }
    ps.pos[j]=s.p[0]; ps.pos[j+1]=s.p[1]; ps.pos[j+2]=s.p[2];
    ps.vel[j]=s.v[0]; ps.vel[j+1]=s.v[1]; ps.vel[j+2]=s.v[2]; ps.grav[i]=0;
    const h=s.hell; ps.base[j]=s.c[0]*h; ps.base[j+1]=s.c[1]*h; ps.base[j+2]=s.c[2]*h; }
}
/* haengen: fliegt normal bis zum Scheitel, danach Luftwiderstand x k,
   Sinken hoechstens sink m/s, dazu Pendeln {amp m, hz, achse [x,z]},
   Drift [vx,vz] m/s, Pulsieren {hz, tief 0..1} und Flackern in den
   letzten flacker s. g Schwerkraft (Standard 3). */
function haengen(ps,x,y,z,vx,vy,vz,c,life,o){
  o=o||{};
  const g=o.g!==undefined?o.g:3, k=o.k||4, sink=o.sink!==undefined?o.sink:1.0, pen=o.pendel, dr=o.drift||[0,0], pu=o.puls, fl=o.flacker||0;
  return fuehre(ps,x,y,z,vx,vy,vz,c,life,(s,dt)=>{
    const v=s.v, d=s.d;
    if(!d.oben&&v[1]<=0){ d.oben=true; d.t=0; }
    const f=Math.max(0,1-(d.oben?ZIEH*k:ZIEH)*dt);
    v[0]*=f; v[2]*=f; v[1]=v[1]*f-g*dt;
    let px=0, pz=0;
    if(d.oben){ d.t+=dt; if(v[1]<-sink) v[1]=-sink;
      const m=Math.min(1,dt*1.5); v[0]+=(dr[0]-v[0])*m; v[2]+=(dr[1]-v[2])*m;
      if(pen){ const w=2*Math.PI*(pen.hz||0.4), a=(pen.amp||0.5)*w*Math.cos(w*d.t), ax=pen.achse||[1,0]; px=a*ax[0]; pz=a*ax[1]; } }
    s.p[0]+=(v[0]+px)*dt; s.p[1]+=v[1]*dt; s.p[2]+=(v[2]+pz)*dt;
    let h=1;
    if(pu) h*=1-(pu.tief||0.4)*(0.5+0.5*Math.sin(2*Math.PI*(pu.hz||1)*s.alter));
    if(fl&&s.life-s.alter<fl) h*=0.3+Math.random()*0.8;
    s.hell=h;
  },o);
}

/* lichtPool: Dauerlichter (Fallschirm, Fackel, Kessel, Geysir ...)
   teilen sich die Blitzlichter. Wer Licht will, meldet sich JE BILD mit
   licht(schluessel,p,c,staerke) an. Die hellsten und naechsten bekommen
   ein echtes Punktlicht - hoechstens alle Blitzlichter bis auf eins, das
   fuer die Brueche frei bleibt (4 Lichter: 3, schwache Rechner: 1) -,
   alle anderen einen farbigen Lichtfleck auf dem Boden (o.boden = Hoehe).
   o.weite = Reichweite des Lichts in m (Standard 25). */
const LICHT={an:[],alt:[],slot:{},flecken:[],vergeben:0,fleckN:0};
/* 28.09. (echt.md 1.10: Dauerlicht wirkte wie Buehnenscheinwerfer): Feuer
   leuchtet nie in reiner Farbe gleichmaessig - Farbe zu 35 % zur warmen
   Flamme hin, leichtes Flackern. o.rein = Bengalfeuer, bleibt satt. */
function licht(key,p,c,staerke,o){ o=o||{};
  if(!o.rein){ const L=Math.max(c[0],c[1],c[2]); c=[c[0]*0.65+L*0.35,c[1]*0.65+L*0.35*0.72,c[2]*0.65+L*0.35*0.4]; }
  LICHT.an.push({key,p,c,st:(staerke||2)*(0.88+Math.random()*0.18),o}); dienst(); }
let _fleckTex=null;
function fleckMesh(){
  if(!_fleckTex) _fleckTex=tex(64,64,(g,W,H)=>{ const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);
    gr.addColorStop(0,'rgba(255,255,255,.9)'); gr.addColorStop(0.4,'rgba(255,255,255,.35)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H); },false);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:_fleckTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false}));
  m.rotation.x=-Math.PI/2; m.visible=false; m.renderOrder=2; scene.add(m); return m;
}
function lichtTakt(){
  const L=LICHT.an; LICHT.an=[];
  const frei=Math.max(0,FLASH.length-1);
  L.forEach(r=>{ r.prio=r.st*distVol(r.p); });
  L.sort((a,b)=>b.prio-a.prio);
  const neu={}, belegt=new Set();
  /* wer schon ein Licht hatte, behaelt es */
  L.slice(0,frei).forEach(r=>{ const f=LICHT.slot[r.key]; if(f!==undefined&&!belegt.has(f)){ neu[r.key]=f; belegt.add(f); } });
  let fi=0;
  L.forEach((r,n)=>{
    if(n<frei){
      let f=neu[r.key];
      if(f===undefined){ let best=-1, bt=1e9; FLASH.forEach((x,ix)=>{ if(!belegt.has(ix)&&x.t<bt){ bt=x.t; best=ix; } }); f=best; if(f<0) return; neu[r.key]=f; belegt.add(f); }
      const F=FLASH[f]; flashSchalten(true); flashRuhe=8;
      F.l.position.set(r.p.x,r.p.y,r.p.z); F.l.color.setRGB(clamp(r.c[0]+0.1,0,1),clamp(r.c[1]+0.1,0,1),clamp(r.c[2]+0.1,0,1));
      /* Reichweite begrenzt (Standard 25 m): mit den 95 m der Blitze
         faerbte ein Dauerlicht die ganze Stadt (Probebild Kessel) */
      F.l.distance=r.o.weite||25; F.pool=true;
      F.max=r.st; F.d=0.25; F.t=0.25; F.l.intensity=r.st*0.75;
      return; }
    /* ohne Licht: Fleck auf dem Boden */
    let m=LICHT.flecken[fi]; if(!m){ if(LICHT.flecken.length>=12) return; m=fleckMesh(); LICHT.flecken.push(m); } fi++;
    const b=r.o.boden!==undefined?r.o.boden:0.03, h=Math.max(0.5,r.p.y-b), gr=2.2*Math.sqrt(r.st)*(1+h*0.25), a=clamp(0.5*r.st/(1+h*0.35),0,0.9);
    m.position.set(r.p.x,b+0.02,r.p.z); m.scale.set(gr,gr,1); m.material.color.setRGB(r.c[0]*a,r.c[1]*a,r.c[2]*a); m.visible=true;
  });
  for(let k=fi;k<LICHT.flecken.length;k++) LICHT.flecken[k].visible=false;
  /* freigegebene Lichter bekommen die Blitz-Reichweite zurueck */
  /* ... und gehen sofort aus: sonst glimmte das Dauerlicht 0,25 s mit 95 m
     Reichweite nach und hellte das ganze Testfeld auf (27.09., Probebild
     Feuerkreis beim Phasenwechsel) */
  FLASH.forEach((F,ix)=>{ if(F.pool&&!belegt.has(ix)){ F.pool=false; F.l.distance=95; F.t=0; F.l.intensity=0; } });
  LICHT.slot=neu; LICHT.vergeben=belegt.size; LICHT.fleckN=fi;
  return L.length>0;
}

/* rauchball: Rauchballen aus wolkenSprite (wie der Atompilz).
   o = {r Endradius m, quellen s bis zur vollen Groesse, steigen m/s,
   wind [x,z] m/s, leuchten 0/1 (additiv, eigene Farbe), c Farbe,
   farbe(t) Farbe ueber die Zeit, a Deckkraft, n Ballen, dauer s,
   form 'ball'|'ring' (Staubring am Boden)}. Hoechstens 120 Ballen
   im ganzen Spiel (QUAL); Rueckgabe null, wenn keiner frei ist. */
const RAUCH={n:0};
function rauchball(p,o){
  o=o||{};
  const n=Math.min(o.n||6,Math.round(120*QUAL())-RAUCH.n); if(n<=0) return null;
  const dauer=o.dauer||3, R=o.r||1, qu=o.quellen||dauer*0.4, st=o.steigen!==undefined?o.steigen:0.3, wi=o.wind||[0.25,0],
    c=o.c||[0.5,0.5,0.53], a0=o.a!==undefined?o.a:0.5, ring=o.form==='ring';
  const teile=[], ball=[];
  for(let i=0;i<n;i++){ const sp=wolkenSprite(!!o.leuchten); teile.push(sp);
    const d=ring?[Math.cos(i/n*Math.PI*2),0,Math.sin(i/n*Math.PI*2)]:randDir();
    ball.push({sp,d:ring?d:[d[0],Math.abs(d[1])*0.7,d[2]],f:ring?rand(0.85,1.1):rand(0.2,1),gr:rand(0.75,1.15)}); }
  RAUCH.n+=n;
  const w=wolke(dauer,teile,(w,t)=>{
    const u=Math.min(1,t/qu), r=R*(ring?0.2+0.8*(1-Math.pow(1-u,2)):0.3+0.7*(1-Math.pow(1-u,2))), aus=1-glatt(dauer*0.5,dauer,t), an=Math.min(1,t/0.15), cc=o.farbe?o.farbe(t):c;
    for(const b of ball){ const x=p.x+b.d[0]*r*b.f+wi[0]*t, y=p.y+b.d[1]*r*b.f*0.8+st*t, z=p.z+b.d[2]*r*b.f+wi[1]*t;
      wSetz(b.sp,x,y,z,(ring?R*0.9:r*1.4)*b.gr,cc,a0*an*aus); } });
  later(dauer+0.05,()=>{ RAUCH.n-=n; });
  return w;
}

/* bodenrest: was liegen bleibt - konfetti, papier, band, krone,
   spielzeug, fleck. Flache Plaettchen in einem InstancedMesh, 1500
   Plaetze (schwache Rechner 500); die aeltesten gehen zuerst, in den
   letzten 3 s schrumpfen sie weg. o = {c Farbe, dauer s (30), gr Faktor}.
   Vereinfacht: krone und spielzeug sind hier nur flache Stellvertreter -
   eigene Formen baut der Effekt selbst. */
const REST_ART={konfetti:[0.012,0.018,null],papier:[0.035,0.045,[0.72,0.07,0.05]],band:[0.016,0.16,null],
  krone:[0.05,0.12,[0.95,0.72,0.18]],spielzeug:[0.04,0.04,null],fleck:[0.07,0.07,[0.05,0.045,0.04]]};
const REST_BUNT=['rot','gold','gruen','blau','magenta','tuerkis','zitrone'];
const REST={max:COARSE?500:1500,next:0,n:0,t0:null,dauer:null,m:null,mesh:null,welk:0};
(function(){
  try{
    const g=new THREE.PlaneGeometry(1,1); g.rotateX(-Math.PI/2);
    const mesh=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({roughness:0.85,metalness:0,side:THREE.DoubleSide}),REST.max);
    /* die Farbspur je Plaettchen gleich anlegen, sonst uebersetzt three.js
       den Shader beim ersten Rest neu - und VOR count=0: setColorAt legt
       count*3 Werte an, sonst ist der Puffer leer und jeder Rest schwarz
       (27.09., Kleinfeuerwerk: Konfettiteppich schwarz) */
    if(mesh.setColorAt) mesh.setColorAt(0,new THREE.Color(1,1,1));
    mesh.count=0; mesh.frustumCulled=false; mesh.visible=false;
    scene.add(mesh); REST.mesh=mesh;
    REST.t0=new Float32Array(REST.max); REST.dauer=new Float32Array(REST.max); REST.m=new Float32Array(REST.max*6);
  }catch(e){ REST.mesh=null; }
})();
/* Matrix direkt schreiben: Drehung um die Senkrechte, Groesse, Ort */
function restSetz(i,f){ const M=REST.m, o=i*6, a=REST.mesh.instanceMatrix.array, k=i*16, c=Math.cos(M[o+3]), s=Math.sin(M[o+3]), sx=M[o+4]*f, sz=M[o+5]*f;
  a[k]=c*sx; a[k+1]=0; a[k+2]=-s*sx; a[k+3]=0; a[k+4]=0; a[k+5]=1; a[k+6]=0; a[k+7]=0;
  a[k+8]=s*sz; a[k+9]=0; a[k+10]=c*sz; a[k+11]=0; a[k+12]=M[o]; a[k+13]=M[o+1]; a[k+14]=M[o+2]; a[k+15]=1; }
function bodenrest(art,x,y,z,o){
  if(!REST.mesh) return -1;
  o=o||{}; const A=REST_ART[art]||REST_ART.konfetti, gr=o.gr||1, i=REST.next;
  REST.next=(i+1)%REST.max; REST.n=Math.min(REST.max,REST.n+1);
  const M=REST.m, k=i*6; M[k]=x; M[k+1]=y+0.004+Math.random()*0.004; M[k+2]=z; M[k+3]=Math.random()*Math.PI; M[k+4]=A[0]*gr; M[k+5]=A[1]*gr;
  REST.t0[i]=FW_UHR; REST.dauer[i]=o.dauer||30;
  restSetz(i,1);
  const c=o.c||A[2]||K(pick(REST_BUNT)), cc=art==='fleck'?c:[c[0]*0.8,c[1]*0.8,c[2]*0.8];
  if(REST.mesh.setColorAt){ REST.mesh.setColorAt(i,new THREE.Color(cc[0],cc[1],cc[2])); REST.mesh.instanceColor.needsUpdate=true; }
  REST.mesh.count=Math.max(REST.mesh.count,i+1); REST.mesh.visible=true; REST.mesh.instanceMatrix.needsUpdate=true;
  dienst(); return i;
}
/* restLanden: ein Teil fliegt ballistisch (p, v, Schwerkraft g) und
   bleibt dort liegen, wo es die Hoehe boden erreicht */
function restLanden(art,p,v,g,boden,o){
  let t=0.05, q=p;
  for(;t<8;t+=0.05){ q=bahnOrt(p,v,g,t); if(q.y<=boden) break; }
  imBild(t,()=>bodenrest(art,q.x,boden,q.z,o));
  return t;
}
function restTakt(){
  if(!REST.mesh||!REST.n) return false;
  let noch=0, geaendert=false;
  for(let i=0;i<REST.mesh.count;i++){ if(REST.dauer[i]<=0) continue;
    const alter=FW_UHR-REST.t0[i], rest=REST.dauer[i]-alter;
    if(rest<=0){ REST.dauer[i]=0; restSetz(i,0); geaendert=true; REST.n--; continue; }
    noch++;
    if(rest<3){ restSetz(i,rest/3); geaendert=true; } }
  if(geaendert) REST.mesh.instanceMatrix.needsUpdate=true;
  if(!noch){ REST.n=0; REST.mesh.count=0; REST.mesh.visible=false; }
  return noch>0;
}
/* Die Plaettchen und die Lichtflecken gehen in die Shader-Vorbereitung
   mit (sie sind sonst unsichtbar und wuerden erst beim ersten Rest
   uebersetzt - das Spiel stuende kurz). */
shaderVorab=(f=>function(){ const m=REST.mesh, alt=m&&m.visible, fl=LICHT.flecken[0]||(LICHT.flecken[0]=fleckMesh());
  if(m){ m.visible=true; m.count=Math.max(1,m.count); } fl.visible=true;
  try{ return f.apply(this,arguments); } finally { if(m){ m.visible=alt; if(!REST.n) m.count=0; } fl.visible=false; } })(shaderVorab);

/* Der Hilfsdienst selbst */
NEU_EMIT.dienst2=(e,dt)=>{
  fuehrenTakt(dt);
  const l=lichtTakt(), r=restTakt();
  if(GEFUEHRT.length||l||r) e.t=0.5;
};

/* ---------------------------------------------------------
   Feuertoepfe und Tiefbrueche (neue-effekte.md Abschnitt 5).
   mineEff 'farbe'|'blink'|'knister'|'silber'|'gold'|'glut' ist eine
   Feuertopf-Sorte: das Rohr stoesst nur eine Sternsaeule aus, 10-15 m,
   ohne Bombette. Jeder andere mineEff ist ein Bruchbild -> tiefbruch().
   --------------------------------------------------------- */
const FEUERTOPF_SORTEN={farbe:1,blink:1,knister:1,silber:1,gold:1,glut:1};
/* o Abschussort, A/B Farben, s Groesse (mineSz x Rampe, 0,4..1,3 ->
   Saeule 10..15 m), opt {ang, dir} Neigung wie shot() (nurMine), hell */
function feuertopfSorte(o,sorte,A,B,s,opt){
  opt=opt||{}; s=s||0.8; A=A||FW.gold; B=B||A;
  const q=QUAL(), y0=(o.y!==undefined?o.y:0.3)+(o.ab!==undefined?o.ab:0.05), h=10+5*clamp((s-0.4)/0.9,0,1), hl=opt.hell||1;
  const ang=opt.ang||0, dir=opt.dir===undefined?rand(0,Math.PI*2):opt.dir;
  const D=[Math.sin(dir)*Math.sin(ang),Math.cos(ang),Math.cos(dir)*Math.sin(ang)];
  const G={farbe:6.5,blink:5,knister:6.5,silber:7,gold:3.2,glut:6}[sorte]||6.5;
  const hoch=sorte==='glut'?h*0.8:sorte==='silber'?h*0.95:h;
  const v0=vFuerHoehe(hoch,G), tS=Math.log(1+ZIEH*v0/G)/ZIEH;   // Zeit bis zum Scheitel
  const k=(c,f)=>[c[0]*f*hl,c[1]*f*hl,c[2]*f*hl];
  const strahl=(n,fn)=>{ for(let i=0;i<n;i++){ const d=streu(D,0.085), w=v0*rand(0.84,1.0); fn(i,d[0]*w,d[1]*w,d[2]*w,w/v0); } };
  const alt=SCHWEIF;
  if(sorte==='blink'){
    /* Blinksterne 6 Hz, haengen oben kurz */
    strahl(Math.round(26*q*(0.6+s*0.5)),(i,vx,vy,vz,f)=>{ const c=k(i%3?A:B,1.25), ph=Math.random();
      fuehre(psBig,o.x,y0,o.z,vx,vy,vz,c,tS*f+0.7,(st,dt)=>{ const v=st.v, fz=Math.max(0,1-ZIEH*dt); v[0]*=fz; v[2]*=fz; v[1]=v[1]*fz-G*dt;
        st.p[0]+=v[0]*dt; st.p[1]+=v[1]*dt; st.p[2]+=v[2]*dt; st.hell=((st.alter*6+ph)%1)<0.45?1.6:0.06; },{spur:0.06}); });
  } else if(sorte==='knister'){
    /* warmweisse Saeule, oben zerplatzt jeder Stern knisternd */
    SCHWEIF=0.15;
    strahl(Math.round(22*q*(0.6+s*0.5)),(i,vx,vy,vz,f)=>{ const c=k(i%4?[1,.9,.7]:A,1.1), T=tS*f*rand(0.9,1.0);
      psBig.emit(o.x,y0,o.z,vx,vy,vz,c[0],c[1],c[2],T,G,0);
      const q0=bahnOrt({x:o.x,y:y0,z:o.z},[vx,vy,vz],G,T);
      knisterWolke(q0,rand(4,7),0.7,1.1,{t0:T,fall:0.6,laut:0.5}); });
    SCHWEIF=alt;
  } else if(sorte==='silber'){
    /* Titan: viele kleine gleissende Funken, hart und kurz */
    SCHWEIF=0.1;
    strahl(Math.round(70*q*(0.6+s*0.5)),(i,vx,vy,vz,f)=>{ const c=k(i%3?FW.weiss:FW.silber,1.4);
      psMid.emit(o.x,y0,o.z,vx*rand(0.9,1.1),vy,vz*rand(0.9,1.1),c[0],c[1],c[2],tS*f*rand(0.7,0.9),G,4); });
    SCHWEIF=alt;
    flash({x:o.x,y:y0+1,z:o.z},FW.weiss,2.6,0.18); schall(o,v=>sfx.crack(v*0.8));
  } else if(sorte==='gold'){
    /* Brokat: flimmernd, lange Glut, faellt langsam */
    SCHWEIF=0.5;
    strahl(Math.round(30*q*(0.6+s*0.5)),(i,vx,vy,vz,f)=>{ const c=k(i%5?[1,.8,.4]:A,1.1);
      psBig.emit(o.x,y0,o.z,vx,vy,vz,c[0],c[1],c[2],tS*f+rand(0.9,1.5),G,4); });
    SCHWEIF=alt;
  } else if(sorte==='glut'){
    /* Kohle-Rot: dunkel, tief, rauchig */
    SCHWEIF=0.3;
    strahl(Math.round(20*q*(0.6+s*0.5)),(i,vx,vy,vz,f)=>{ const c=k([1,.34,.07],0.85);
      psBig.emit(o.x,y0,o.z,vx,vy,vz,c[0],c[1],c[2],tS*f*rand(0.95,1.1),G,2,0.35,0.05,0.02); });
    SCHWEIF=alt;
    rauchball({x:o.x+D[0]*hoch*0.4,y:y0+hoch*0.35,z:o.z+D[2]*hoch*0.4},{r:1.4,n:4,dauer:3.5,steigen:0.5,c:[0.16,0.1,0.08],a:0.4,farbe:t=>t<0.8?[0.5,0.18,0.06]:[0.16,0.1,0.08]});
  } else {
    /* farbe: Farbsterne A, jeder dritte B */
    SCHWEIF=0.12;
    strahl(Math.round(34*q*(0.6+s*0.5)),(i,vx,vy,vz,f)=>{ const c=k(i%3?A:B,1.2);
      psBig.emit(o.x,y0,o.z,vx,vy,vz,c[0],c[1],c[2],tS*f*rand(0.95,1.08),G,0); });
    SCHWEIF=alt;
  }
  muendungsblitz(o,y0,1.3);
  /* 28.09. (Tom: "Lichtshow"): der Ausstoss erhellt den Platz kurz und
     warm, nicht in reiner Sternfarbe - 20 Farbtoepfe hintereinander
     tauchten Tisch, Wand und Haeuser sonst in Magenta. Nur Batterie-
     Drehbuecher (mineEff) zuenden Feuertoepfe. */
  flash({x:o.x,y:y0+0.8,z:o.z},sorte==='glut'?[1,.35,.08]:mischF(A,[1,.82,.55],0.6),sorte==='glut'?1.0:1.0,0.2);
  sfx.thump(distVol(o)*(sorte==='glut'?1.3:1.1));
  if(FW_LOG) FW_LOG.push({t:FW_UHR,art:'topf',sorte,x:+o.x.toFixed(2),ang:+ang.toFixed(3),hoehe:+hoch.toFixed(2),A,B});
  return hoch;
}
/* Tiefbruch: eine Bombette bricht 4-8 m ueber der Batterie als Bruchbild
   eff, Groesse s (mineSz). Ohne Aufstiegsspur, ohne Kern/Nachglitzern. */
function tiefbruch(o,eff,A,B,s,opt){
  opt=opt||{}; s=s||0.6;
  const h=clamp(4+s*3,4,8), f=0.5, pw=(h+3*f*f)/(f*STEIG)-21;
  shot(o,{eff,A,B,sz:s,pw,fest:true,fuse:f,ang:opt.ang!==undefined?opt.ang:rand(-0.05,0.05),dir:opt.dir,steig:'keiner',hell:opt.hell,tief:true,bruchOpt:{nachglitzer:false,kern:false}});
  return h;
}

/* ---------------------------------------------------------
   Aufstiegsklaenge ueber tonGen (neue-effekte.md 2 und 8, 26.09.).
   STEIG_TON[steig](r,v): r.fuse Steigzeit, r.ton Halbtoene ueber
   1,6 kHz oder 'fallend', r.par.gleit. Die Engine (Teil A) ruft beim
   Start STEIG_KLANG[steig] - diese Eintraege ersetzen dort die
   Vorgaben, sobald es die Tabelle gibt.
   --------------------------------------------------------- */
const STEIG_TON={
  pfeif(r,v){ if(typeof r.ton==='number'||r.ton==='fallend') return sfx.pfeifTon(v,r.ton==='fallend'?7:r.ton,{fallend:r.ton==='fallend',dur:r.fuse+0.1}); sfx.whistle(v); },
  /* Heulbatterie: Ton je Schuss, +2 Halbtoene im Steigen; gleit = Heulboje */
  tonleiter(r,v){ const gl=r.par&&r.par.gleit; return sfx.pfeifTon(v,typeof r.ton==='number'?r.ton:0,{gleit:gl,dur:gl?2.5:r.fuse+0.1}); },
  /* Pfeifkonzert: Grundton -> grosse Terz -> Quinte, harte Spruenge (fallend: umgekehrt) */
  dreiklang(r,v){ const g=typeof r.ton==='number'?r.ton:0, T=(r.fuse||1.2)/3, st=r.ton==='fallend'?[7,4,0]:[0,4,7], f=h=>1600*Math.pow(2,(g+h)/12);
    return tonGen({f:f(st[0]),spruenge:[[T,f(st[1])],[2*T,f(st[2])]],dur:3*T+0.08,vol:0.03*v,rausch:0.06,vib:{hz:5.5,cent:12},an:0.04}); },
  /* Silberpfeil: trockener Startknall, dann hohes Sirren */
  pfeil(r,v){ sfx.startknall(v); return tonGen({f:3200,f2:3700,dur:Math.max(0.3,r.fuse*0.7),vol:0.012*v,rausch:0.3,an:0.03}); },
  glasklang(r,v){ const f=rand(1600,1900); tonGen({f,dur:r.fuse+0.2,vol:0.018*v,an:0.1,ab:0.3}); return tonGen({f:f+3,dur:r.fuse+0.2,vol:0.018*v,an:0.1,ab:0.3}); },
  /* Titanrakete: 1,2 kHz, 14 Hz zerhackt, sehr laut */
  ratter(r,v){ return tonGen({f:1200,am:14,amTiefe:1,rausch:0.5,typ:'sawtooth',lp:2800,dur:r.fuse+0.05,vol:0.03*v}); },
  drachenschweif(r,v){ sfx.fauchen(v*1.1,r.fuse+0.2); },
  silberdrache(r,v){ rauschF({dur:r.fuse+0.2,vol:0.2*v,f:420,an:0.2}); },
  farbspur(r,v){ rauschF({dur:r.fuse,vol:0.12*v,typ:'bandpass',f:700,q:0.7,an:0.15}); },
  brokat(r,v){ rauschF({dur:r.fuse+0.1,vol:0.14*v,typ:'bandpass',f:1800,q:0.5,an:0.05}); },
  rieselschweif(r,v){ sfx.zischen(v*1.2,r.fuse+0.1); },
  titanspur(r,v){ rauschF({dur:r.fuse+0.1,vol:0.16*v,typ:'highpass',f:2200,an:0.05}); later(0.3,()=>sfx.prasseln(v*0.6)); },
  /* Kugel 200: Tick 2 kHz / Tack 1,5 kHz im Takt der Spur (4 Hz) */
  ticktack(r,v){ for(let i=0;i<Math.floor((r.fuse||1)*4);i++) later(i*0.25,()=>tone(i%2?1500:2000,0.015,'square',0.04*v)); },
  /* Furzrakete: drei Aussetzer bei 25/50/75 %, tief - mittel - hoch */
  stotter(r,v){ sfx.zischen(v*0.5,r.fuse); [0.25,0.5,0.75].forEach((a,i)=>later(a*r.fuse,()=>{ tonGen({f:70+i*35,f2:50+i*25,typ:'sawtooth',lp:500,am:28,amTiefe:0.7,dur:0.3,vol:0.06*v}); rauschF({dur:0.25,vol:0.15*v,f:300+i*150}); })); },
  /* Supernova: Stufe zuendet bei 50 % - Schlag und helleres Zischen */
  zweistufe(r,v){ sfx.zischen(v*0.7,r.fuse*0.5); later(r.fuse*0.5,()=>{ sfx.thump(v); rauschF({dur:r.fuse*0.5+0.1,vol:0.13*v,typ:'highpass',f:4500,an:0.03}); }); },
  /* Goldkrone: Blubbern 5 je Sekunde */
  blasen(r,v){ for(let i=0;i<Math.floor((r.fuse||1)*5);i++) later(i*0.2+rand(0,0.05),()=>tone(rand(260,420),0.07,'sine',0.05*v,rand(500,700))); },
  /* Jumboleiter: leises Pling je stehengebliebener Perle (etwa alle 3 m) */
  perlenschnur(r,v){ const n=Math.max(2,Math.round((r.fuse||1.2)*5)); for(let i=1;i<=n;i++) later(i*(r.fuse||1.2)/(n+1),()=>sfx.pling(v*0.8)); }
};
if(typeof STEIG_KLANG!=='undefined') Object.assign(STEIG_KLANG,STEIG_TON);

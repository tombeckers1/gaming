/* =========================================================
   Kugelbomben - je Sorte ein eigenes Hauptbild mit Nachbruechen
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Katalog: katalog-kugeln.md. Leiter (Kaliber, Bild):
     75 mm  ein Bild mit einem Kniff   Herzschlag, Suedsee, Chamaeleon
     100 mm zwei Stufen                Eiskristall, Drachenblut, Haengeweide
     150 mm drei Stufen                Weltenbrand, Milchstrasse, Sternkranz
     200 mm Bewegung im Bild           Uhrwerk, Leuchtqualle
     300 mm Meisterbomben              Himmelsbrecher, Kaiserkrone
   Jede Sorte: eigenes Hauptbild, eigener Aufstieg, feste Farben.
   ========================================================= */

/* ---------- Hilfen ---------- */
/* Stern mit Griff: spaeter Ort lesen, umfaerben oder ausloeschen.
   maxl > life: der Stern ist schon "aelter" (Helligkeit f = life/maxl),
   so setzt ein umgefaerbter Stern ohne Helligkeitssprung fort. */
function kgStern(ps,p,v,c,life,g,mode,spur,maxl){
  const i=ps.next, alt=SCHWEIF; if(spur!==undefined) SCHWEIF=spur;
  ps.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0],c[1],c[2],life,g,mode||0);
  SCHWEIF=alt;
  ps.maxl[i]=(maxl||life)*(1+Math.random()*1e-4)+1e-5;
  return {ps,i,mx:ps.maxl[i]};
}
function kgLebt(h){ return !!h&&h.ps.maxl[h.i]===h.mx&&h.ps.life[h.i]>0; }
function kgOrt(h){ const j=h.i*3, P=h.ps.pos, W=h.ps.vel; return [{x:P[j],y:P[j+1],z:P[j+2]},[W[j],W[j+1],W[j+2]]]; }
function kgAus(h){ if(kgLebt(h)) h.ps.life[h.i]=1e-4; }
function kgFarbe(h,c,k){ if(!kgLebt(h)) return; const j=h.i*3, b=h.ps.base; k=k||1; b[j]=c[0]*k; b[j+1]=c[1]*k; b[j+2]=c[2]*k; }
/* Ablauf je Bild ueber dauer s: fn(t) - false bricht ab. Die Show-Kennung
   (FW_TAG) des Bruchs gilt auch fuer alles, was fn spaeter ausstoesst. */
function kgLauf(dauer,fn){
  const t0=FW_UHR, tag=FW_TAG;
  const schritt=()=>{ const t=FW_UHR-t0, alt=FW_TAG; FW_TAG=tag; let r; try{ r=fn(t); } finally { FW_TAG=alt; }
    if(r===false||t>=dauer) return; imBild(1/30,schritt); };
  imBild(0,schritt);
}
function kgSpaeter(tz,fn){ const tag=FW_TAG; imBild(tz,()=>{ const alt=FW_TAG; FW_TAG=tag; try{ fn(); } finally { FW_TAG=alt; } }); }
/* Bildschirmachsen vom Zuschauer aus: rechts, oben, Blickrichtung */
function kgAchsen(p){
  const c=camera.position; let f=[p.x-c.x,p.y-c.y,p.z-c.z]; const lf=Math.hypot(f[0],f[1],f[2])||1; f=[f[0]/lf,f[1]/lf,f[2]/lf];
  let r=[-f[2],0,f[0]]; const lr=Math.hypot(r[0],r[2])||1; r=[r[0]/lr,0,r[2]/lr];
  return [r,[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]],f];
}
/* Drehung von a um die Einheitsachse k (Rodrigues) */
function kgDreh(a,k,w){ const c=Math.cos(w), s=Math.sin(w), d=(k[0]*a[0]+k[1]*a[1]+k[2]*a[2])*(1-c);
  return [a[0]*c+(k[1]*a[2]-k[2]*a[1])*s+k[0]*d, a[1]*c+(k[2]*a[0]-k[0]*a[2])*s+k[1]*d, a[2]*c+(k[0]*a[1]-k[1]*a[0])*s+k[2]*d]; }
const kgMal=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const kgPunkt=(p,a,k)=>({x:p.x+a[0]*k,y:p.y+a[1]*k,z:p.z+a[2]*k});
const kgKreuz=(a,b)=>{ const c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], l=Math.hypot(c[0],c[1],c[2])||1; return [c[0]/l,c[1]/l,c[2]/l]; };

/* ---------- Neue Hauptbilder (neue-effekte.md 1.4) ---------- */

/* Suedsee (palmenkugel75): goldene Palme ueber einer waagrechten
   tuerkisen Lagune, aus der Krone plumpsen drei Kokosnuesse */
EFF.palmeninsel=function(p,A,B,s,r){
  const q=QUAL(), C=(r&&r.C)||FW.bernstein, dreh=rand(0,Math.PI*2), alt=SCHWEIF;
  /* sieben Wedel: Kometen mit Kohle-Goldschweif, nur nach oben, biegen sich */
  for(let a=0;a<7;a++){
    const az=dreh+a/7*Math.PI*2+rand(-0.2,0.2), el=rand(22,68)*Math.PI/180, sp=rand(9,10)*s;
    const d=[Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el)], v=kgMal(d,sp);
    SCHWEIF=1.1; psHuge.emit(p.x,p.y,p.z,v[0],v[1],v[2],A[0],A[1],A[2],rand(2.1,2.3),5.5,0);
    /* der Wedel: ein schmaler Kegel aus Glitzersternen, vorne dicht, nach innen duenner */
    for(let i=0;i<Math.round(12*q);i++){ const e=streu(d,0.045), w=sp*rand(0.7,0.98);
      psBig.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,A[0],A[1]*0.9,A[2]*0.7,rand(1.9,2.2),5.5,4); }
    SCHWEIF=alt; funkenSchweif(p,v,5.5,1.9,3,A);
  }
  /* Lagune: waagrechter Ring (leicht gekippt), ohne Schweif, dazu Wasserglitzern */
  const ax=[Math.cos(dreh),0,Math.sin(dreh)], U=kgDreh([Math.cos(dreh+1.57),0,Math.sin(dreh+1.57)],ax,0.2), W=ax;
  SCHWEIF=0.05;
  const n=Math.round(42*q), ring=a=>[U[0]*Math.cos(a)+W[0]*Math.sin(a),U[1]*Math.cos(a)+W[1]*Math.sin(a),U[2]*Math.cos(a)+W[2]*Math.sin(a)];
  for(let i=0;i<n;i++){ const d=ring(i/n*Math.PI*2), w=7*s*rand(0.98,1.02);
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(1.35,1.45),0.6,0); }
  for(let i=0;i<Math.round(34*q);i++){ const d=ring(rand(0,Math.PI*2)), w=rand(4.5,6.5)*s;
    psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,0.6+B[0]*0.4,0.6+B[1]*0.4,0.6+B[2]*0.4,rand(1.0,1.4),0.6,4); }
  SCHWEIF=alt;
  schall(p,v=>sfx.fizz(v*0.6));
  /* drei Kokosnuesse fallen aus der Kronenmitte, 6-8 m, dann Plopp */
  for(let k=0;k<3;k++) kgSpaeter(0.9+k*0.12,()=>{
    const o={x:p.x+rand(-1.5,1.5),y:p.y+rand(0.5,1.5),z:p.z+rand(-1.5,1.5)}, v=[rand(-0.6,0.6),rand(-0.5,0.3),rand(-0.6,0.6)], T=rand(1.15,1.35), g=9;
    const a=SCHWEIF; SCHWEIF=0.18; psHuge.emit(o.x,o.y,o.z,v[0],v[1],v[2],C[0],C[1],C[2],T,g,0); SCHWEIF=a;
    kgSpaeter(T,()=>{ const e=bahnOrt(o,v,g,T), a2=SCHWEIF; SCHWEIF=0;
      for(let i=0;i<6;i++){ const d=randDir(), w=rand(1.5,3); psSmall.emit(e.x,e.y,e.z,d[0]*w,Math.abs(d[1])*w,d[2]*w,C[0],C[1],C[2],rand(0.2,0.35),4,0); }
      SCHWEIF=a2; schall(e,v=>sfx.plopp(v*0.8,1)); });
  });
};

/* Chamaeleon (farbenmeer75): Geisterbombe. Die Kugel steht, eine gerade
   Farbgrenze wandert von links nach rechts durch sie (A -> B), danach
   eine zweite von unten nach oben (-> C); jeder Stern blitzt beim
   Umschlagen kurz weiss. Alle verloeschen im selben Augenblick. */
EFF.chamaeleon=function(p,A,B,s,r){
  const q=QUAL(), C=(r&&r.C)||FW.orange, n=Math.round(150*q), [re,ob]=kgAchsen(p), L=6, T=2.2, g=0.8, H=[], hell=c=>kgMal(c,1.5);
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(7.7,8.3)*s;
    H.push({h:kgStern(psBig,p,kgMal(d,w),hell(A),L,g,0,0.1),x:d[0]*re[0]+d[1]*re[1]+d[2]*re[2],y:d[0]*ob[0]+d[1]*ob[1]+d[2]*ob[2]}); }
  const wechsel=(st,c,t)=>{ if(!kgLebt(st.h)) return; const [o,v]=kgOrt(st.h); kgAus(st.h);
    const a=SCHWEIF; SCHWEIF=0; psHuge.emit(o.x,o.y,o.z,v[0],v[1],v[2],1.4,1.4,1.4,0.08,g,0); SCHWEIF=a;
    st.h=kgStern(psBig,o,v,hell(c),L-t,g,0,0.1,L); };
  for(const st of H){ const t1=0.35+(st.x+1)/2*0.6, t2=1.1+(st.y+1)/2*0.6;
    kgSpaeter(t1,()=>wechsel(st,B,t1)); kgSpaeter(t2,()=>wechsel(st,C,t2)); }
  kgSpaeter(T,()=>{ for(const st of H) kgAus(st.h); });
  const fft=v=>rauschF({dur:0.3,vol:0.1*v,typ:'bandpass',f:1600,f2:3800,q:0.8,an:0.05});
  kgSpaeter(0.35,()=>schall(p,fft)); kgSpaeter(1.1,()=>schall(p,fft));
};

/* Eiskristall (kristallkugel100): raeumliches Oktaeder aus leuchtenden
   Kanten und sechs hellen Ecken. Jeder Stern fliegt mit seiner Lage
   auf dem Einheits-Oktaeder - bei gleichem Luftwiderstand blaeht sich
   die Form selbstaehnlich auf und bleibt scharf. Ab 1,3 s zerfallen die
   Kanten zu funkelndem Diamantstaub. par.dreh dreht um die Senkrechte
   (Kristall im Kristall). */
EFF.eiskristall=function(p,A,B,s,r){
  const q=QUAL(), dreh=(r&&r.par&&r.par.dreh)||0, stufe=!!(r&&r.stufe), [re]=kgAchsen(p), az=rand(-Math.PI/4,Math.PI/4)+dreh;
  const k15=15*Math.PI/180, X=kgDreh([Math.cos(az),0,Math.sin(az)],re,k15), Y=kgDreh([0,1,0],re,k15), Z=kgDreh([-Math.sin(az),0,Math.cos(az)],re,k15);
  const E=[X,kgMal(X,-1),Y,kgMal(Y,-1),Z,kgMal(Z,-1)], w=6.5*s, kanten=[], m=Math.max(7,Math.round(14*q));
  for(let a=0;a<6;a++) for(let b=a+1;b<6;b++){ if((a>>1)===(b>>1)) continue;
    for(let i=1;i<=m;i++){ const t=i/(m+1), d=[E[a][0]*(1-t)+E[b][0]*t,E[a][1]*(1-t)+E[b][1]*t,E[a][2]*(1-t)+E[b][2]*t];
      kanten.push(kgStern(psBig,p,kgMal(d,w),kgMal(A,1.3),3.2,0,0,0.03,3.6)); } }
  const ecken=E.map(d=>kgStern(psHuge,p,kgMal(d,w),kgMal(B,1.4),2.6,0,0,0.03));
  /* ab 1,2 s sinkt alles ganz langsam */
  kgSpaeter(1.2,()=>{ for(const h of kanten.concat(ecken)) if(kgLebt(h)) h.ps.grav[h.i]=0.35; });
  kgSpaeter(1.3,()=>{
    const S=FW.silber;
    for(const h of kanten){ if(!kgLebt(h)) continue; const [o]=kgOrt(h); kgAus(h);
      const k=Math.random()<0.5?2:3;
      for(let j=0;j<k;j++){ const ph=rand(0,6.28), hz=rand(3,5), dx=rand(-0.25,0.25), dz=rand(-0.25,0.25), x0=o.x+rand(-0.4,0.4), y0=o.y+rand(-0.4,0.4), z0=o.z+rand(-0.4,0.4);
        fuehre(psMid,x0,y0,z0,0,-0.5,0,S,rand(1.8,2.2),(st,dt)=>{ const t=st.alter;
          st.p=[x0+dx*t,y0-0.5*t,z0+dz*t]; st.v=[dx,-0.5,dz];
          st.hell=(0.35+1.8*Math.pow(Math.max(0,Math.sin(t*hz*6.283+ph)),4))*Math.min(1,(st.life-t)/0.5); }); } }
    schall(p,v=>sfx.eisknistern(v*(stufe?0.4:1)));
  });
};

/* Haengeweide (goldweide100): japanische Yanagi - kein Knall, die Sterne
   werden nur ausgeschuettet und ziehen dunkelgoldene Kohleschweife, die
   zehn Sekunden haengen und fast bis zum Boden sinken. Zum Schluss treibt
   jeder Ast eine gruene Blattspitze. */
EFF.haengeweide=function(p,A,B,s,r){
  const q=QUAL(), n=Math.round(58*q), g=2.75, gk=g/ZIEH, boden=4.5, alt=SCHWEIF;
  /* wie lange ein Stern lebt, bis sein Kopf 4,5 m ueber dem Boden steht */
  const bisBoden=(vy,L)=>{ for(let t=0.5;t<L;t+=0.1){ const f=(1-Math.exp(-ZIEH*t))/ZIEH; if(p.y+vy*f-gk*(t-f)<boden) return t; } return L; };
  const koepfe=[];
  for(let i=0;i<n;i++){ const d0=randDir(), d=[d0[0],d0[1]<0?d0[1]*0.55:d0[1],d0[2]], w=rand(5,6.5)*s;
    const L=bisBoden(d[1]*w,rand(9.5,10.5)), v=kgMal(d,w);
    koepfe.push({h:kgStern(psBig,p,v,[A[0]*0.8,A[1]*0.72,A[2]*0.6],L,g,0,2.8),L});   // maxl = life: sonst rechnet die Spur ab dem ersten Bild 2,8 s zurueck
    /* zwei Begleiter dicht dahinter machen den Ast dicker */
    SCHWEIF=2.6;
    for(const f of [0.95,0.9]){ const e=streu(d,0.02), ww=w*f;
      psBig.emit(p.x,p.y,p.z,e[0]*ww,e[1]*ww,e[2]*ww,A[0]*0.5,A[1]*0.42,A[2]*0.3,Math.max(0.5,L-0.3),g,0); }
    SCHWEIF=alt;
    /* Kohlefunken tropfen in den ersten Sekunden aus dem Ast */
    for(let t=0.4;t<3.6;t+=rand(0.25,0.45)){ const tt=t;
      kgSpaeter(tt,()=>{ const o=bahnOrt(p,v,g,tt), a=SCHWEIF; SCHWEIF=0.25;
        psSmall.emit(o.x,o.y,o.z,rand(-0.3,0.3),rand(-1.2,-0.4),rand(-0.3,0.3),1,.62,.2,rand(0.5,0.9),2.5,4); SCHWEIF=a; }); }
  }
  /* am Ende: je Kopf eine gruene Blattspitze, eine nach der anderen */
  for(const k of koepfe){ const tb=Math.max(1,k.L-rand(0.3,1.6));
    kgSpaeter(tb,()=>{ if(!kgLebt(k.h)) return; const [o]=kgOrt(k.h); kgAus(k.h);
      fuehre(psBig,o.x,o.y,o.z,0,-2.5,0,B,0.5,(st,dt)=>{ st.p=[o.x,o.y-2.5*st.alter,o.z]; st.v=[0,-2.5,0]; st.hell=(Math.floor(st.alter*12)%2)?0.25:1.5; }); }); }
  schall(p,v=>sfx.rieseln(v*0.7,8));
};

/* Milchstrasse (sternenstaub150): flache, schraeg liegende Spiralgalaxie.
   Heller Kern, zwei logarithmische Arme aus schimmernden Punkten, die in
   0,6 s an ihren Platz fliegen, sich drehen (0,12 U/s) und dann von
   aussen nach innen zu Sternenstaub zerfliessen. */
EFF.galaxie=function(p,A,B,s,r){
  const q=QUAL(), C=(r&&r.C)||FW.gold, c=camera.position;
  let n0=[c.x-p.x,c.y-p.y,c.z-p.z]; const l0=Math.hypot(n0[0],n0[1],n0[2])||1; n0=kgMal(n0,1/l0);
  /* Ebene 35-45 Grad zur Kamera geneigt */
  const [q1,q2]=quer(n0), ka=rand(0,Math.PI*2), kw=[q1[0]*Math.cos(ka)+q2[0]*Math.sin(ka),q1[1]*Math.cos(ka)+q2[1]*Math.sin(ka),q1[2]*Math.cos(ka)+q2[2]*Math.sin(ka)];
  const nn=kgDreh(n0,kgKreuz(kw,n0),rand(35,45)*Math.PI/180);
  const [u,v]=quer(nn), R=6.2*s, TW=1.25*Math.PI*2, R0=R/Math.exp(0.3*TW), om=0.12*Math.PI*2, alt=SCHWEIF;
  /* Kern */
  SCHWEIF=0.05;
  /* heller, dichter Kern: in der Scheibe flachgedrueckt, dazu drei Leuchtsterne */
  for(let i=0;i<Math.round(60*q);i++){ const d=randDir(), w=rand(0.3,1.3)*s, k=d[0]*nn[0]+d[1]*nn[1]+d[2]*nn[2], e=[d[0]-nn[0]*k*0.7,d[1]-nn[1]*k*0.7,d[2]-nn[2]*k*0.7];
    psBig.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,(0.5+C[0]*0.5)*1.8,(0.5+C[1]*0.5)*1.8,(0.5+C[2]*0.5)*1.8,rand(3.3,3.7),0.1,0); }
  for(let i=0;i<3;i++) psHuge.emit(p.x,p.y,p.z,rand(-.2,.2),rand(-.2,.2),rand(-.2,.2),0.9,0.85,0.7,3.6,0.05,0);
  SCHWEIF=alt;
  leuchthof(p,C,s*0.4,1.0);
  const punkt=(rr,th,col,ps,hz,dunkel,td)=>{ const ph=rand(0,6.28);
    fuehre(ps,p.x,p.y,p.z,0,0,0,col,td+0.5,(st,dt)=>{ const t=st.alter;
      let rad, ang;
      if(t<0.6){ const e=1-Math.pow(1-t/0.6,3); rad=rr*e; ang=th-(1-e)*0.9; }
      else { rad=rr+(t>td?(t-td)*1.0:0); ang=th+om*(t-0.6); }
      const x=Math.cos(ang)*rad, y=Math.sin(ang)*rad;
      const np=[p.x+u[0]*x+v[0]*y,p.y+u[1]*x+v[1]*y,p.z+u[2]*x+v[2]*y];
      st.v=dt>0?[(np[0]-st.p[0])/dt,(np[1]-st.p[1])/dt,(np[2]-st.p[2])/dt]:[0,0,0]; st.p=np;
      st.hell=dunkel*(0.4+0.6*(0.5+0.5*Math.sin(t*hz*6.283+ph)))*(t>td?Math.max(0,1-(t-td)/0.5):1); },{spur:0.12}); };
  const a0=rand(0,Math.PI*2), m=Math.round(140*q);
  for(let arm=0;arm<2;arm++) for(let i=0;i<m;i++){
    const f=i/m, phi=f*TW, rr=R0*Math.exp(0.3*phi)*rand(0.94,1.06), th=a0+arm*Math.PI+phi+rand(-0.09,0.09);
    punkt(rr,th,f>0.8?B:A,psBig,rand(12,20),1.5-0.4*f,2.6+(1-rr/R)*1.0); }
  /* Sternenstaub zwischen den Armen: der Nebel der Scheibe */
  for(let i=0;i<Math.round(90*q);i++){ const f=Math.pow(Math.random(),0.8), rr=R*f*0.9, th=a0+rand(0,Math.PI*2);
    punkt(rr,th,A,psMid,rand(6,12),0.8*(1.2-f),2.5+(1-f)*1.0); }
  schall(p,v=>sfx.rieseln(v*0.8,2));
};

/* Sternkranz (sternkugel150): 16 rote Kometen fliegen als Ring in einer
   Ebene auseinander, dann ein gemeinsames Krachen - jeder zerspringt in
   ein Kreuz aus vier weissen Sternen: ein Kranz aus 16 kleinen "+". */
EFF.kreuzkranz=function(p,A,B,s,r){
  const [u,v]=basisBlick(p,0.5), a0=rand(0,Math.PI*2), g=1.5, alt=SCHWEIF, S=FW.silber, TE=0.78+0.9;
  for(let k=0;k<16;k++){
    const a=a0+k/16*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a), d=[u[0]*ca+v[0]*sa,u[1]*ca+v[1]*sa,u[2]*ca+v[2]*sa], tg=[-u[0]*sa+v[0]*ca,-u[1]*sa+v[1]*ca,-u[2]*sa+v[2]*ca];
    /* Tempo 8 statt 11 m/s*s: mit 11 lag der Kranz vom Zuendpult aus am Bildrand */
    const w=8*s, vel=kgMal(d,w), ts=0.75+rand(-0.03,0.03);
    SCHWEIF=0; psHuge.emit(p.x,p.y,p.z,vel[0],vel[1],vel[2],A[0]*1.3,A[1]*1.3,A[2]*1.3,ts,g,0);
    for(let i=0;i<3;i++){ const e=streu(d,0.012), ww=w*rand(0.97,1); psBig.emit(p.x,p.y,p.z,e[0]*ww,e[1]*ww,e[2]*ww,A[0]*1.6,A[1]*1.6,A[2]*1.6,ts,g,0); }
    SCHWEIF=0.4; psBig.emit(p.x,p.y,p.z,vel[0],vel[1],vel[2],S[0]*0.9,S[1]*0.9,S[2]*0.9,ts,g,4);
    SCHWEIF=alt; funkenSchweif(p,vel,g,ts,2,S);
    kgSpaeter(ts,()=>{ const o=bahnOrt(p,vel,g,ts), w2=bahnTempo(vel,g,ts), a2=SCHWEIF;
      SCHWEIF=0; psBig.emit(o.x,o.y,o.z,w2[0],w2[1],w2[2],2,2,2,0.034,g,0);
      SCHWEIF=0.08;
      for(const [e,f] of [[tg,1],[tg,-1],[d,1],[d,-1]]){ const x=7*f;
        psBig.emit(o.x,o.y,o.z,w2[0]+e[0]*x,w2[1]+e[1]*x,w2[2]+e[2]*x,B[0]*1.6,B[1]*1.6,B[2]*1.6,TE-ts,g,0);
        psBig.emit(o.x,o.y,o.z,w2[0]+e[0]*x*0.6,w2[1]+e[1]*x*0.6,w2[2]+e[2]*x*0.6,B[0],B[1],B[2],TE-ts,g,0); }
      SCHWEIF=a2; });
  }
  kgSpaeter(0.75,()=>{ flash(p,[1,1,1],2.5+s,0.3);
    schall(p,vl=>{ for(let i=0;i<16;i++) later(Math.random()*0.05,()=>sfx.crack(vl*0.35)); }); });
};

/* Leuchtqualle (goldkrone200): pfirsichfarbener Halbkugel-Schirm mit
   hellem Rand, der einmal langsam pulsiert; darunter wehen acht goldene
   Brokat-Fangarme, durch die eine Welle nach unten laeuft. */
EFF.qualle=function(p,A,B,s,r){
  const q=QUAL(), C=(r&&r.C)||FW.gold, [re]=kgAchsen(p), W=6.4*s, schirm=[], rand8=[], g=0.5, dreh=rand(0,Math.PI*2);
  for(let i=0;i<Math.round(135*q);i++){ const az=rand(0,Math.PI*2), el=Math.asin(rand(Math.sin(5*Math.PI/180),Math.sin(85*Math.PI/180))), w=W*rand(0.95,1.05);
    schirm.push(kgStern(psBig,p,[Math.cos(az)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(az)*Math.cos(el)*w],A,rand(2.3,2.5),g,0,0.08)); }
  const nr=Math.round(40*q), jeder=Math.max(1,Math.floor(nr/8));
  for(let i=0;i<nr;i++){ const az=dreh+i/nr*Math.PI*2, el=rand(0,5)*Math.PI/180, w=W*1.02;
    const h=kgStern(psBig,p,[Math.cos(az)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(az)*Math.cos(el)*w],B,2.6,g,0,0.08);
    if(i%jeder===0&&rand8.length<8) rand8.push({h,az}); }
  /* einmal langsam pulsieren: 70 -> 100 -> 70 % in 1,2 s */
  kgLauf(1.4,t=>{ if(t<0.2) return; const k=0.7+0.3*Math.sin(Math.min(1,(t-0.2)/1.2)*Math.PI);
    for(const h of schirm) kgFarbe(h,A,k/0.85); });
  /* Fangarme: je Arm alle 0,08 s ein Brokatstern am Rand, 1,6 s lang;
     jeder sinkt und schwingt seitlich, die Phase laeuft den Arm hinunter */
  const amp=0.8*s/2.5, sink=1.5*s/2.5, T0=FW_UHR;
  rand8.forEach((ar,k)=>{ let ende=null;
    for(let j=0;j<20;j++){ const tz=0.3+j*0.08;
      kgSpaeter(tz,()=>{ let o;
        if(kgLebt(ar.h)){ o=kgOrt(ar.h)[0]; ende=o; } else o=ende||kgPunkt(p,[Math.cos(ar.az),0,Math.sin(ar.az)],W/ZIEH*0.9);
        const x0=o.x, z0=o.z, ph=rand(-0.2,0.2); let y=o.y, vy=-rand(2,3)*s/2.5;
        fuehre(psBig,x0,y,z0,0,vy,0,C,rand(4,5),(st,dt)=>{ vy+=(-sink-vy)*Math.min(1,dt*1.5); y+=vy*dt;
          const l=amp*Math.sin((FW_UHR-T0)*Math.PI*2/1.5-j*0.45+k*0.8+ph)*Math.min(1,st.alter*2);
          const np=[x0+re[0]*l,y,z0+re[2]*l]; st.v=dt>0?[(np[0]-st.p[0])/dt,vy,(np[2]-st.p[2])/dt]:[0,vy,0]; st.p=np;
          st.hell=Math.min(1,(st.life-st.alter)/1.0)*(0.75+Math.random()*0.5); },{spur:0.35}); }); } });
  schall(p,v=>sfx.zischen(v*0.5,2.5));
};

/* Kaiserkrone (kaiserkrone): Meisterbombe nach japanischem Vorbild.
   Fuenf ineinanderliegende Kugeln (Farben par.kerne, innen -> aussen)
   in einer goldenen Brokatkrone; bei 1,0 und 1,8 s wandern die Farben
   eine Schale nach aussen (innen wird weiss), bei 2,6 s erloeschen alle
   Kernsterne im selben Bild. Die Krone haengt bis 8 s, zum Schluss
   funkeln ihre Spitzen silbern. */
EFF.fuenfkern=function(p,A,B,s,r){
  const q=QUAL(), kerne=(r&&r.kerne)||['weiss','zitrone','rot','violett','indigo'].map(K);
  const V=[2.5,4.5,6.5,8.5,10.5], N=[30,50,70,90,110], schalen=[], krone=[], F=0.8;
  let farben=kerne.slice(0,5);
  for(let k=0;k<5;k++){ const hs=[], n=Math.round(N[k]*q);
    for(let i=0;i<n;i++){ const d=randDir(), w=V[k]*s*F*rand(0.97,1.03); hs.push(kgStern(psBig,p,kgMal(d,w),farben[k],4,0.3,0,0.06)); }
    schalen.push(hs); }
  for(let i=0;i<Math.round(240*q);i++){ const d=randDir(), w=11.5*s*F*rand(0.95,1.02), L=rand(7.6,8.3);
    krone.push(kgStern(psBig,p,kgMal(d,w),A,L,3.3,4,1.6)); }
  /* Verwandlung: jede Schale nimmt die Farbe ihrer inneren Nachbarin */
  const henka=()=>{ farben=[FW.weiss].concat(farben.slice(0,4));
    schalen.forEach((hs,k)=>{ for(const h of hs) kgFarbe(h,farben[k],1.8); });
    kgSpaeter(0.05,()=>schalen.forEach((hs,k)=>{ for(const h of hs) kgFarbe(h,farben[k]); })); };
  kgSpaeter(1.0,henka); kgSpaeter(1.8,henka);
  /* Kiekuchi: alle Kernsterne im selben Bild aus, ohne Geraeusch */
  kgSpaeter(2.6,()=>schalen.forEach(hs=>hs.forEach(kgAus)));
  /* Silberspitzen der Krone */
  kgSpaeter(6.5,()=>{ for(const h of krone) if(kgLebt(h)){ kgFarbe(h,B,2.2); h.ps.md[h.i]=1; } });
  schall(p,v=>sfx.rieseln(v*0.6,6));
};

/* Uhrwerk (kugel200): Zehnfachbruch mit zwei Farben und Drall - zehn
   Blueten auf einem Ring, der Ring dreht sich (jede Bluete erbt
   w*r*DRALL_ERBE). Ersetzt den Buntmix aus fuenf Farben. */
EFF.zehnfach=function(p,A,B,s,r){
  const [u,v]=basisBlick(p,0.4), R=6.5*s, dr=(r&&r.par&&r.par.drall)||0, om=2*Math.PI*dr*DRALL_ERBE, a0=rand(0,Math.PI*2), q=QUAL(), alt=FW_ERBE;
  try{
    for(let k=0;k<10;k++){
      const a=a0+k/10*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a), c=k%2?B:A;
      const Q={x:p.x+(u[0]*ca+v[0]*sa)*R,y:p.y+(u[1]*ca+v[1]*sa)*R,z:p.z+(u[2]*ca+v[2]*sa)*R};
      FW_ERBE=om?[(-u[0]*sa+v[0]*ca)*om*R,(-u[1]*sa+v[1]*ca)*om*R,(-u[2]*sa+v[2]*ca)*om*R]:alt;
      for(let i=0;i<Math.round(70*s*q);i++){ const d=randDir(), w=rand(4.2,5.4)*s;
        psBig.emit(Q.x,Q.y,Q.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(1.5,2.1),2.8,i%5?0:4); }
    }
  } finally { FW_ERBE=alt; }
  flash({x:p.x,y:p.y,z:p.z},FW.weiss,6*s,0.4);
};

/* Spurlaengen und Familien der neuen Bilder (mitSchweif, effPassen) */
Object.assign(EFF_SCHWEIF,{palmeninsel:1.1,chamaeleon:0,eiskristall:0.1,haengeweide:2.8,galaxie:0.12,kreuzkranz:0.35,qualle:0.1,fuenfkern:1.6});
Object.assign(EFF_FAMILIE,{palmeninsel:'haenger',chamaeleon:'kugel',eiskristall:'figur',haengeweide:'haenger',galaxie:'figur',kreuzkranz:'knister',qualle:'haenger',fuenfkern:'kugel'});

/* ---------- Die Sorten (Katalog, verbindlich) ---------- */
Object.assign(KUGEL,{
  /* 75 mm - ein Bild mit einem Kniff */
  kugel75:{kal:1,sz:2.05,pw:2.0,fuse:1.70,th:'herz',haupt:'herz',A:'rose',B:'gold',
    steig:'keiner', bruchOpt:{nachglitzer:false}, ton:'herzton',
    stufen:[{t:0.55,eff:'herz',sz:0.62,A:'rot',B:'rose',leise:true},      // "ba-"
            {t:0.80,eff:'herz',sz:0.40,A:'weiss',B:'rot',leise:true}]},    // "-DUMM"
  palmenkugel75:{kal:1,sz:2.10,pw:2.1,fuse:1.70,th:'wald',haupt:'palmeninsel',A:'gold',B:'tuerkis',C:'bernstein',
    steig:'gold', bruchOpt:{kern:false,nachglitzer:false}, stufen:[]},
  farbenmeer75:{kal:1,sz:2.20,pw:2.4,fuse:1.72,th:'tropen',haupt:'chamaeleon',A:'limette',B:'tuerkis',C:'orange',
    steig:'silber', bruchOpt:{kern:false,nachglitzer:false}, stufen:[]},
  /* 100 mm - zwei Stufen */
  kristallkugel100:{kal:2,sz:2.60,pw:3.8,fuse:1.85,th:'eis',haupt:'eiskristall',A:'tuerkis',B:'weiss',
    steig:'blink', bruchOpt:{kern:false,nachglitzer:false},
    stufen:[{t:0.45,eff:'eiskristall',sz:0.45,A:'weiss',B:'himmel',dreh:0.785,leise:true}]},   // Kristall im Kristall
  kugel100:{kal:2,sz:2.70,pw:4.0,fuse:1.85,th:'glut',haupt:'drachenblut',A:'rot',B:'scharlach',
    steig:'glut',
    stufen:[{t:0.04,eff:'pistill',sz:0.40,A:'gold',B:'orange',leise:true},     // Drachenauge
            {t:1.30,eff:'flammenregen',sz:0.75,A:'orange',B:'rot'}]},           // Tropfen fangen Feuer
  goldweide100:{kal:2,sz:2.80,pw:4.6,fuse:1.90,th:'gold',haupt:'haengeweide',A:'bernstein',B:'limette',
    steig:'komet', bruchOpt:{kern:false,nachglitzer:false,flash:0.3}, ton:'poka',
    stufen:[{t:0.05,eff:'pistill',sz:0.28,A:'limette',B:'gruen',leise:true}]},
  /* 150 mm - drei Stufen */
  kugel150:{kal:3,sz:3.25,pw:5.8,fuse:2.00,th:'himmel',haupt:'weltenbrand',A:'violett',B:'gold',
    steig:'knister',
    stufen:[{t:0.04,eff:'pistill',sz:0.42,A:'rot',B:'gold',leise:true},              // Glutkern
            {t:1.50,eff:'tausend',sz:0.26,A:'orange',B:'gold',n:6,kranz:'reif'}]},  // Glut springt ueber
  sternenstaub150:{kal:3,sz:3.30,pw:6.0,fuse:2.00,th:'nacht',haupt:'galaxie',A:'silber',B:'himmel',C:'gold',
    steig:'wirbel', bruchOpt:{kern:false,nachglitzer:false}, stufen:[]},
  sternkugel150:{kal:3,sz:3.45,pw:6.4,fuse:2.05,th:'rotweiss',haupt:'kreuzkranz',A:'rot',B:'weiss',
    steig:'pfeif', bruchOpt:{kern:false,nachglitzer:false},
    stufen:[{t:0.90,eff:'knister',sz:0.30,A:'silber',B:'weiss'}]},   // Knisterkern in der Kranzmitte
  /* 200 mm - Bewegung im Bild */
  kugel200:{kal:4,sz:3.95,pw:7.8,fuse:2.15,th:'zorn',haupt:'zehnfach',A:'magenta',B:'gold',drall:0.30,
    steig:'ticktack',
    stufen:[{t:0.50,eff:'pistill',sz:0.30,n:10,kranz:0.55,drall:-0.40,A:'zitrone',B:'violett'},   // inneres Rad, gegenlaeufig
            {t:1.60,eff:'wechsel',sz:0.28,A:'gold',B:'weiss'}]},                                    // Nabe
  goldkrone200:{kal:4,sz:4.10,pw:8.3,fuse:2.15,th:'tropen',haupt:'qualle',A:'pfirsich',B:'rose',C:'gold',
    steig:'blasen', bruchOpt:{kern:false,nachglitzer:false}, ton:'wumms',   // weiches "Wumpf" statt Knall (Spezifikation qualle)
    stufen:[{t:0.60,eff:'strobe',sz:0.22,A:'blau',B:'himmel',leise:true,lage:'schirm'}]},   // Leuchtorgan im Schirm
  /* 300 mm - Meisterbomben */
  kugel300:{kal:5,sz:4.75,pw:10.8,fuse:2.30,th:'silber',haupt:'himmelsbrecher',A:'silber',B:'himmel',
    steig:'titanspur', stehen:1,                              // Titanlinie bleibt 1 s als Funkenvorhang
    stufen:[{t:0.06,eff:'glitzerweide',sz:0.80,A:'silber',B:'weiss',leise:true},     // Silberweide
            {t:0.55,eff:'dahlie',sz:0.20,A:'weiss',B:'silber',risse:{strahlen:6,je:4,r:[8,23],dt:0.15,zack:0.10}}]},   // 24 Splitter
  kaiserkrone:{kal:5,sz:5.00,pw:11.5,fuse:2.40,th:'koenig',haupt:'fuenfkern',
    kerne:['weiss','zitrone','rot','violett','indigo'], A:'gold',B:'silber',
    steig:'silberdrache', kobana:3, bruchOpt:{kern:false,nachglitzer:false}, stufen:[]}
});

/* Signaturen: je Kugel genau ein Hauptbild, das es sonst nirgends gibt */
Object.assign(SIGNATUR,{
  kugel75:{eff:'herz',text:'Herz, das zweimal schlägt'},
  palmenkugel75:{eff:'palmeninsel',text:'Palme im Lagunenring, Kokosnüsse fallen'},
  farbenmeer75:{eff:'chamaeleon',text:'Farbe wandert durch die stehende Kugel'},
  kristallkugel100:{eff:'eiskristall',text:'Kristall im Kristall, rieselt als Diamantstaub'},
  kugel100:{eff:'drachenblut',text:'Blutrote Dahlie tropft und fängt Feuer'},
  goldweide100:{eff:'haengeweide',text:'zehn Sekunden Goldweide bis fast zum Boden, grüne Spitzen'},
  kugel150:{eff:'weltenbrand',text:'Farbwechsel-Chrysantheme mit Feuerreif, Glut springt über'},
  sternenstaub150:{eff:'galaxie',text:'drehende Spiralgalaxie aus schimmerndem Staub'},
  sternkugel150:{eff:'kreuzkranz',text:'Ring aus Kometen, die zu 16 Kreuzen zerplatzen'},
  kugel200:{eff:'zehnfach',text:'zwei gegenläufige Räder aus zehn Blüten'},
  goldkrone200:{eff:'qualle',text:'Qualle mit wehenden Fangarmen, Aufstieg aus Luftblasen'},
  kugel300:{eff:'himmelsbrecher',text:'Himmel reißt in sechs Linien, 24 Splitterbrüche, Silberweide'},
  kaiserkrone:{eff:'fuenfkern',text:'fünf Kerne verwandeln sich und erlöschen gleichzeitig in der Goldkrone'}
});

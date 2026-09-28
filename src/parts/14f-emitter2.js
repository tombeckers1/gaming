/* =========================================================
   Neue Boden-Emitter (NEU_EMIT.*) und Kleinfeuerwerk-Effekte fuer die Anomalie-Ueberarbeitung
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   ========================================================= */

/* ---------------------------------------------------------
   Boden-Emitter aus den Show-Katalogen (neue-effekte.md 3.1, 26.09.).
   Aufruf aus Shows: boden:{k:'tornado', gt, gh, A, B, x, t, ...}.
   Jeder Emitter bekommt e = {t Restzeit, k, o Ort, A, B, h (gh), ...
   alle weiteren Felder des boden-Objekts}. o.y ist der Boden.
   --------------------------------------------------------- */
/* Anteil der abgelaufenen Brenndauer 0..1 (e.t zaehlt herunter) */
function emAnteil(e,dt){ e.alter=(e.alter||0)+dt; return clamp(e.alter/Math.max(0.001,e.alter+Math.max(0,e.t)),0,1); }

/* Tornado (Tornado-Box): kreiselt kreischend ueber den Boden und
   schraubt sich dann als Helix mit Leuchtspur A auf 8-12 m. */
NEU_EMIT.tornado=(e,dt,o)=>{
  const A=e.A||FW.tuerkis, S=FW.silber, H=e.h||1, y0=(o.y!==undefined?o.y:0)+0.06, q=QUAL();
  if(e.alter===undefined){ e.T=e.t+dt; e.ab=clamp(e.T-1.2,0.5,2.8); e.w=rand(0,6); e.wb=rand(0,6); e.cx=0; e.cz=0; e.zx=0; e.zz=0; e.zt=0; e.hTop=rand(8,12)*H;
    e.ton=tonGen({f:2100,f2:2700,gl:e.ab,dur:e.ab+1.05,vol:0.02*distVol(o),vib:{hz:9,cent:25},rausch:0.15,an:0.2}); }
  const t=(e.alter=(e.alter||0)+dt);
  const alt=SCHWEIF;
  if(t<e.ab){
    /* Kreiseln: der Mittelpunkt wandert, der Kreisel zieht seine Bahn
       (Radius 0,3-0,6 m) und dreht sich schnell */
    e.zt-=dt; if(e.zt<=0){ e.zt=rand(0.5,0.9); e.zx=rand(-0.35,0.35); e.zz=rand(-0.35,0.35); }
    e.cx+=(e.zx-e.cx)*Math.min(1,dt*1.5); e.cz+=(e.zz-e.cz)*Math.min(1,dt*1.5);
    e.wb+=dt*3.2; e.w+=dt*40;
    /* aus einer Batterie (spielraum) kreiselt er auf ihr, nicht daneben
       (28.09., Tom: echt) - Bahn 0,95 m weit auf die Oeffnung gestaucht */
    const fk=e.spielraum!==undefined?Math.min(1,e.spielraum/0.95):1;
    const r=0.45+0.15*Math.sin(t*1.9), x=o.x+(e.cx+Math.cos(e.wb)*r)*fk, z=o.z+(e.cz+Math.sin(e.wb)*r)*fk;
    e.pos=[x,z];
    e.acc=(e.acc||0)+dt*260*q; SCHWEIF=0.08;
    for(;e.acc>=1;e.acc--){ const a=e.w+Math.random()*Math.PI*2, s=rand(2.5,4.5), c=Math.random()<0.6?S:A;
      psMid.emit(x+Math.cos(a)*0.08,y0,z+Math.sin(a)*0.08,-Math.sin(a)*s,rand(0.2,0.9),Math.cos(a)*s,c[0],c[1],c[2],rand(0.22,0.4),4,4); }
    SCHWEIF=alt;
    e.kp=(e.kp||0)+dt*30; for(;e.kp>=1;e.kp--) psBig.emit(x,y0+0.03,z,0,0,0,1.3,1.3,1.3,0.05,0,0);
  } else if(!e.oben){
    /* Aufstieg: Helix, Durchmesser 0,6 m, in 1 s auf hTop */
    const u=clamp((t-e.ab)/1.0,0,1), [bx,bz]=e.pos||[o.x,o.z], hy=y0+e.hTop*(1-Math.pow(1-u,1.6)), a=(t-e.ab)*18;
    const hr=0.3*(e.spielraum!==undefined?Math.min(1,e.spielraum/0.95):1), x=bx+Math.cos(a)*hr, z=bz+Math.sin(a)*hr;
    /* 28.09. (Tom: echt): der drehende Treibsatz schleudert Silber- und
       Goldfunken tangential weg, die fallen und verloeschen - vorher blieb
       eine senkrechte Saeule farbiger Punkte stehen (wirkte wie ein Laser).
       Farbig ist nur die kleine Flamme am Kopf. */
    e.acc=(e.acc||0)+dt*240*q; SCHWEIF=0.05;
    for(;e.acc>=1;e.acc--){ const f=Math.random(), yy=hy-f*dt*e.hTop*1.4, ta=a+Math.PI/2+rand(-.4,.4), sp=rand(1.5,3.2), c=Math.random()<0.7?S:[1,.78,.42];
      psMid.emit(x,yy,z,Math.cos(ta)*sp,rand(-1.6,0.3),Math.sin(ta)*sp,c[0],c[1],c[2],rand(0.3,0.65),4.5,4); }
    SCHWEIF=alt;
    psBig.emit(x,hy,z,0,0,0,0.5+A[0]*0.9,0.5+A[1]*0.9,0.5+A[2]*0.9,0.05,0,0);
    if(e.ton&&!e.hoch){ e.hoch=true; e.ton.f(3300,0.3); }
    if(u>=1){ e.oben=true;
      /* oben: kleiner Plopp mit acht Funken */
      for(let i=0;i<8;i++){ const d=randDir(), s=rand(2.5,3.5); psBig.emit(x,hy,z,d[0]*s,d[1]*s,d[2]*s,A[0],A[1],A[2],rand(0.5,0.8),2,0); }
      psHuge.emit(x,hy,z,0,0,0,1,1,1,0.08,0,0);
      schall({x,y:hy,z},v=>sfx.plopp(v,1.4)); e.t=Math.min(e.t,0.01); }
  }
};

/* Lauffeuer (Staffel-Sortiment): ein Zuendfunke laeuft zischend am
   Boden von x nach bis (m, quer), zittert, zieht Funken und einen
   Rauchfaden; am Ziel ein Funkenstoss. */
NEU_EMIT.lauffeuer=(e,dt,o)=>{
  const q=QUAL(), y0=(o.y!==undefined?o.y:0)+0.03;
  if(e.alter===undefined){ e.dx=(e.bis!==undefined?e.bis:(e.x||0)+0.4)-(e.x||0); e.T=e.t+dt; e.px=o.x; e.pz=o.z; sfx.zischen(distVol(o)*0.9,e.T+0.1);
    e.kopf=fuehre(psBig,o.x,y0,o.z,0,0,0,[1.5,1.35,0.9],e.T+0.08,st=>{ st.p[0]=e.px; st.p[1]=y0+rand(0,0.015); st.p[2]=e.pz; st.hell=0.85+Math.random()*0.3; }); }
  const u=emAnteil(e,dt), dir=Math.sign(e.dx)||1;
  e.px=o.x+e.dx*u+rand(-0.012,0.012); e.pz=o.z+rand(-0.015,0.015);
  const alt=SCHWEIF;
  /* 20 Funken je Sekunde nach hinten */
  e.acc=(e.acc||0)+dt*20*Math.max(0.5,q); SCHWEIF=0.05;
  for(;e.acc>=1;e.acc--) psSmall.emit(e.px,y0,e.pz,-dir*rand(0.4,1.4),rand(0.3,1.2),rand(-0.4,0.4),1,.78,.38,rand(0.2,0.4),4,0);
  /* duenner Rauchfaden */
  SCHWEIF=0; e.ra=(e.ra||0)+dt*12*q;
  for(;e.ra>=1;e.ra--) psMid.emit(e.px,y0+0.04,e.pz,rand(-0.03,0.03),rand(0.18,0.32),rand(-0.03,0.03),0.1,0.1,0.11,rand(1.4,2.2),-0.05,0);
  SCHWEIF=alt;
  if(e.t<=0&&!e.ende){ e.ende=true;
    for(let i=0;i<Math.round(30*q)+6;i++){ const a=Math.random()*Math.PI*2, s=rand(0.8,2.4); psSmall.emit(e.px,y0,e.pz,Math.cos(a)*s,rand(0.8,2.6),Math.sin(a)*s,1,.85,.5,rand(0.25,0.5),5,0); }
    flash({x:e.px,y:y0+0.3,z:e.pz},FW.bernstein,0.8,0.12); schall(o,v=>sfx.crack(v*0.35)); }
};

/* Flitterbrunnen (Funkenflug): Senko-Hanabi als Fontaene. Eine gluehende
   Perle in der Duese laeuft durch vier Phasen: Tsubomi (glueht, zittert),
   Botan (einzelne kraeftige Funken), Matsuba (verzweigte Funken,
   1-1,5 m), Chiri-giku (duenne fallende Funken) - dann erlischt sie. */
NEU_EMIT.flitterbrunnen=(e,dt,o)=>{
  /* 28.09. (Tom: echt): die Perle glueht in der Duese auf dem Karton -
     vorher schwebte sie 0,4 m darueber als Leuchtpunkt in der Luft */
  const A=e.A||FW.gold, B=e.B||FW.orange, q=QUAL(), H=e.h||1, py=(o.y!==undefined?o.y:0)+0.03;
  if(e.alter===undefined){ e.T=e.t+dt;
    e.perle=fuehre(psBig,o.x,py,o.z,0,0,0,[1,.42,.1],e.T+0.05,st=>{ const u=st.alter/st.life, z=u<0.15?0.012:0.004;
      st.p[0]=o.x+rand(-z,z); st.p[1]=py+rand(-z,z); st.p[2]=o.z+rand(-z,z); st.hell=(u<0.15?0.4+u*5:1.35)*(u>0.96?(1-u)*25:1)*(0.9+Math.random()*0.2); }); }
  const u=emAnteil(e,dt), x=o.x, y=py, z=o.z, alt=SCHWEIF;
  if(u<0.15){ /* Tsubomi: nur die Perle */ }
  else if(u<0.4){
    e.acc=(e.acc||0)+dt*9*H; SCHWEIF=0.08;
    for(;e.acc>=1;e.acc--){ const d=randDir(), s=rand(2.5,4)*H, c=Math.random()<0.7?A:B;
      psMid.emit(x,y,z,d[0]*s,Math.abs(d[1])*s*0.8+0.5,d[2]*s,c[0],c[1],c[2],rand(0.3,0.5),4,0); }
    SCHWEIF=alt;
    e.pr=(e.pr||0)-dt; if(e.pr<=0){ e.pr=0.35; sfx.prasseln(distVol(o)*0.5); }
  } else if(u<0.8){
    e.acc=(e.acc||0)+dt*42*q*H;
    for(;e.acc>=1;e.acc--){ const d=randDir(), s=rand(4,6)*H, c=Math.random()<0.75?A:B;
      verzweig(psMid,x,y,z,d[0]*s*0.8,Math.abs(d[1])*s*0.9+0.8,d[2]*s*0.8,c,0.45,3,{n:[3,6],tiefe:Math.random()<0.4?2:1,C:[1,.88,.55]}); }
    e.pr=(e.pr||0)-dt; if(e.pr<=0){ e.pr=0.18; sfx.prasseln(distVol(o)*0.8); }
  } else {
    e.acc=(e.acc||0)+dt*12*H; SCHWEIF=0.12;
    for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, s=rand(0.5,1.4)*H;
      psSmall.emit(x,y,z,Math.cos(a)*s,rand(-0.4,0.6),Math.sin(a)*s,B[0]*0.8,B[1]*0.8,B[2]*0.8,rand(0.45,0.75),3,0); }
    SCHWEIF=alt;
  }
};

/* Einschlag (Weltuntergang, von meteor ausgeloest): oranges
   Bodenlicht, grauer Staubring, springende Glutfunken, tiefer Wumms.
   Direkt: einschlagAn({x,y:Boden,z},A) */
NEU_EMIT.einschlag=(e,dt,o)=>{
  const A=e.A||FW.orange, H=e.h||1, y0=(o.y!==undefined?o.y:0)+0.05, q=QUAL();
  if(!e.los){ e.los=true;
    flash({x:o.x,y:y0+0.6,z:o.z},A,4.2*H,0.3);
    rauchball({x:o.x,y:y0+0.25,z:o.z},{form:'ring',r:2.5*H,n:10,dauer:3,quellen:1.2,steigen:0.15,wind:[0.15,0],c:[0.3,0.29,0.28],a:0.45});
    const alt=SCHWEIF; SCHWEIF=0.15;
    for(let i=0;i<Math.round(26*q*H)+4;i++){ const a=Math.random()*Math.PI*2, vy=vFuerHoehe(rand(1,3)*H,6), w=rand(0.8,2.6);
      psBig.emit(o.x+rand(-0.3,0.3),y0,o.z+rand(-0.3,0.3),Math.cos(a)*w,vy,Math.sin(a)*w,A[0]*1.2,A[1]*1.1,A[2],rand(1.0,1.6),6,2,0.45,0.05,0.02); }
    SCHWEIF=alt;
    schall(o,v=>sfx.wumms(Math.min(1.4,v*1.3*H)));
    shake=Math.max(shake,0.25*distVol(o)*H);
  }
  /* danach glimmt es am Boden nach */
  e.acc=(e.acc||0)+dt*14*q;
  for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, r=rand(0,0.6);
    psSmall.emit(o.x+Math.cos(a)*r,y0,o.z+Math.sin(a)*r,0,rand(0.1,0.5),0,0.8,0.22,0.04,rand(0.3,0.7),0,0); }
};
function einschlagAn(p,A,gt,h){ const e={t:gt||1.5,k:'einschlag',o:{x:p.x,y:p.y!==undefined?p.y:0,z:p.z},A:A||FW.orange,h:h||1}; emitters.push(e); return e; }

/* Kessel (Hexenkessel): giftgruene Leuchtbasis (1,5 m), darueber eine
   niedrige Knisterfontaene (2 m), 3-5 Blasen je Sekunde steigen in B
   auf und platzen mit Plopp. Brodelt und knistert. */
NEU_EMIT.kessel=(e,dt,o)=>{
  /* Leuchtbasis so weit wie der Platz auf der Batterie (spielraum) (28.09.) */
  const A=e.A||FW.limette, B=e.B||FW.violett, q=QUAL(), H=e.h||1, y0=(o.y!==undefined?o.y:0)+0.05, R=Math.min(0.75*H,e.spielraum!==undefined?e.spielraum:9), v=distVol(o);
  if(e.id===undefined) e.id=Math.random();
  const alt=SCHWEIF; SCHWEIF=0;
  /* Flammenteppich */
  e.acc=(e.acc||0)+dt*90*q*H;
  for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*R;
    psMid.emit(o.x+Math.cos(a)*r,y0,o.z+Math.sin(a)*r,rand(-.1,.1),rand(0.5,1.5),rand(-.1,.1),A[0]*1.2,A[1]*1.2,A[2]*1.2,rand(0.35,0.7),-0.4,0); }
  licht('kessel'+e.id,{x:o.x,y:y0+0.9,z:o.z},A,1.4*H,{boden:y0,weite:12});   /* weite 12: vorher faerbte er das ganze Testfeld gruen (Probebild) */
  /* Knisterfontaene */
  SCHWEIF=0.06; e.acc2=(e.acc2||0)+dt*70*q*H; const vf=vFuerHoehe(2*H,6);
  for(;e.acc2>=1;e.acc2--){ const a=Math.random()*Math.PI*2, w=rand(0.1,0.9), c=Math.random()<0.7?[1,.95,.8]:A;
    psSmall.emit(o.x,y0+0.1,o.z,Math.cos(a)*w,vf*rand(0.85,1.0),Math.sin(a)*w,c[0],c[1],c[2],rand(0.6,0.9),6,4); }
  SCHWEIF=alt;
  e.kn=(e.kn||0)+dt*22*H;
  for(;e.kn>=1;e.kn--){ const a=Math.random()*Math.PI*2, r=rand(0,0.45)*H; knisterPop(o.x+Math.cos(a)*r,y0+rand(1.4,2.1)*H,o.z+Math.sin(a)*r,{funken:5,laut:0.35}); }
  /* Blasen: steigen 1-3 m, platzen mit Plopp und Knisterpuff */
  e.bl=(e.bl||0)-dt;
  if(e.bl<=0){ e.bl=rand(0.2,0.33); const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*R*0.8, bx=o.x+Math.cos(a)*r, bz=o.z+Math.sin(a)*r, hoch=rand(1,3)*H, vy=rand(1.8,2.6), ph=rand(0,6);
    fuehre(psHuge,bx,y0+0.2,bz,0,vy,0,[B[0]*0.9,B[1]*0.9,B[2]*0.9],hoch/vy,(st,dt2)=>{ st.p[1]+=vy*dt2; st.p[0]=bx+Math.sin(st.alter*7+ph)*0.08; st.v[1]=vy; },
      {ende:st=>{ const p={x:st.p[0],y:st.p[1],z:st.p[2]}, a2=SCHWEIF; SCHWEIF=0;
        for(let i=0;i<12;i++){ const d=randDir(), s=rand(1.5,2.5); psBig.emit(p.x,p.y,p.z,d[0]*s,d[1]*s,d[2]*s,B[0],B[1],B[2],rand(0.3,0.5),2,0); }
        SCHWEIF=a2; knisterWolke(p,5,0.25,0.3,{laut:0.4}); schall(p,v2=>sfx.plopp(v2*0.8,rand(0.9,1.3))); }}); }
  e.br=(e.br||0)-dt; if(e.br<=0){ e.br=1.0; sfx.brodeln(v*0.9,1.1); }
};

/* Geysir (Geysirfeld): 0,3 s Zischen und ein Dampfwoelkchen, dann ein
   schmaler Titanstrahl (Kegel 5 Grad) auf 10-15 m (gh), oben
   zerstaeubend; danach steigt eine weisse Dampfwolke auf. Endet abrupt. */
NEU_EMIT.geysir=(e,dt,o)=>{
  const A=e.A||FW.weiss, B=e.B||FW.silber, H=e.h||1, q=QUAL(), y0=(o.y!==undefined?o.y:0)+0.05, hm=12*H, G=5;
  if(e.alter===undefined){ e.T=e.t+dt; e.jet=Math.max(0.5,e.T-0.3); e.v0=vFuerHoehe(hm,G); e.tS=Math.log(1+ZIEH*e.v0/G)/ZIEH;
    const v=distVol(o); sfx.zischen(v*0.9,0.35);
    rauchball({x:o.x,y:y0+0.3,z:o.z},{r:0.5,n:3,dauer:1.3,steigen:0.6,c:[0.7,0.72,0.75],a:0.35});
    later(0.3,()=>sfx.fauchen(v*1.2,e.jet,true)); }
  const t=(e.alter=(e.alter||0)+dt);
  if(t<0.3) return;
  const alt=SCHWEIF, kraft=Math.min(1,(t-0.3)/0.12);
  /* der Strahl */
  e.acc=(e.acc||0)+dt*520*q*kraft; SCHWEIF=0.06;
  for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, tl=Math.sqrt(Math.random())*0.087, w=e.v0*rand(0.9,1.0), c=Math.random()<0.7?A:B;
    psMid.emit(o.x,y0,o.z,Math.cos(a)*Math.sin(tl)*w,Math.cos(tl)*w,Math.sin(a)*Math.sin(tl)*w,c[0]*1.2,c[1]*1.2,c[2]*1.2,e.tS*rand(0.85,1.0),G,4); }
  /* oben zerstaeubt er */
  SCHWEIF=0; e.acc2=(e.acc2||0)+dt*160*q*kraft;
  for(;e.acc2>=1;e.acc2--){ const a=Math.random()*Math.PI*2, s=rand(1,3);
    psSmall.emit(o.x+rand(-0.3,0.3),y0+hm*rand(0.82,1.0),o.z+rand(-0.3,0.3),Math.cos(a)*s,rand(-1,1),Math.sin(a)*s,1,1,1,rand(0.25,0.55),2,4); }
  SCHWEIF=alt;
  licht('geysir'+(e.id||(e.id=Math.random())),{x:o.x,y:y0+hm*0.4,z:o.z},A,0.9*H*kraft,{boden:y0,weite:14});   /* 3,2 machte die Wand am Testfeld reinweiss (Probebild); 28.09.: 0,9 - fuenf Geysire zugleich im Finale tauchten Tisch, Wand und Boden in reines Weiss */
  /* kurz vor Schluss steigt der Rauch - grau, nur schwach angestrahlt
     (28.09., Tom: echt - die hell leuchtenden Dampfballen standen wie
     weisse Wattebaeusche im Bild; nur das Geysirfeld nutzt diesen Emitter) */
  if(!e.dampf&&e.t<=0.4){ e.dampf=true;
    rauchball({x:o.x,y:y0+hm*0.35,z:o.z},{r:1.8*H,n:6,dauer:3.0,quellen:1.2,steigen:1.1,wind:[0.3,0],c:[0.4,0.41,0.44],a:0.2,
      farbe:tt=>tt<0.4?[0.62,0.63,0.66]:[0.4,0.41,0.44]}); }
};

/* Kreisel, jetzt auch als Boden-Ebene in Shows: ohne i stand er (e.i
   NaN), und er spruehte je Bild statt je Sekunde - bei 20 Bildern halb
   so viel wie bei 60 (Test bausteine2.js). Bild wie vorher bei 60 Bildern. */
NEU_EMIT.kreisel=(e,dt,o)=>{ if(!(e.i>=0)) e.i=0;
  e.w=(e.w||0)+dt*(2+e.i*0.4); e.r=(e.r||0.2)+dt*0.12;
  /* aus einer Batterie (spielraum): die Spirale bleibt auf ihr (28.09.) */
  const rr=Math.min(e.r*(1+e.i*0.3),e.spielraum!==undefined?e.spielraum:9);
  const x=o.x+Math.cos(e.w+e.i*2)*rr, z=o.z+Math.sin(e.w+e.i*2)*rr, c=e.A||FW.gold;
  e.acc=(e.acc||0)+dt*360;
  for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, s=rand(1.5,3.2);
    psMid.emit(x,o.y+0.08,z,Math.cos(a)*s,rand(0.3,1.2),Math.sin(a)*s,c[0],c[1],c[2],rand(0.3,0.6),5,4); } };

/* Zugang fuer die Tests (bausteine2.js und die Stufe-2-Tests): die
   Bausteine liegen im Spiel-Gehaeuse und sind von aussen sonst nicht
   erreichbar. Eigenes Objekt, damit window.__bb unberuehrt bleibt. */
if(typeof window!=='undefined') window.__fw2={
  get psHuge(){return psHuge}, get psBig(){return psBig}, get psMid(){return psMid}, get psSmall(){return psSmall}, get FW_UHR(){return FW_UHR},
  set FW_LOG(a){FW_LOG=a}, emitters, NEU_EMIT, FW, K, THEMEN, FLASH, WOLKEN, sfx, ac, tonGen, rauschF, schall, randDir, rand,
  imBild, glint, GLINT, knisterPop, knisterWolke, POP, verzweig, VERZWEIG, fuehre, GEFUEHRT, haengen, licht, LICHT, rauchball, RAUCH,
  bodenrest, restLanden, REST, feuertopfSorte, FEUERTOPF_SORTEN, tiefbruch, STEIG_TON, einschlagAn, emAnteil
};

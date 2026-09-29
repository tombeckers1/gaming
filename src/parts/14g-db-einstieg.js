/* =========================================================
   Drehbuecher der Show-Produkte bis Level 15
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Katalog: katalog-shows-einstieg.md. 21 Produkte, goldperlen ist
   gestrichen (Spielstaende: ERSETZT_DURCH -> roemisch).
   Hier stehen: die neuen Bruchbilder dieser Klasse (neue-effekte.md
   1.1), die Drehbuecher (SHOWS), die Signaturen (SIGNATUR).
   Alles in einer Kapsel, damit die Hilfsnamen nicht mit den anderen
   Katalog-Dateien zusammenstossen.
   28.09., Tom: echt - "sieht aus wie Pyrotechnik plus Lichtshow", "so ein
   Feuerwerk gibt es nicht". Darum: keine stehenden Leuchtpunkte, keine
   Kreisel-/Rad-/Bengalo-Einlagen, jede Sternfarbe brennt als Satz mit
   Schweif oder Funken, Farbwechsel nur mit Dunkelphase (echter Relais-
   stern), je Salve hoechstens zwei Farben plus Gold/Silber/Weiss.
   ========================================================= */
(function(){
/* ---------------------------------------------------------
   Hilfen
   --------------------------------------------------------- */
/* Neue Brueche bringen Kern, Leuchthof und Nachglitzern nicht von
   selbst mit (neue-effekte.md): fwBurst liest bruchOpt erst nach dem
   Bruch, der Bruch darf es darum hier setzen. */
function zutaten(r,o){ if(!r) return; o=Object.assign({},o||{});
  /* 28.09., Tom: echt - Bruchlicht wie alle Batterieschuesse gedaempft (SHOW_BLITZ, 14b) */
  if(typeof o.flash==='number') o.flash*=SHOW_BLITZ;
  r.bruchOpt=Object.assign({},r.bruchOpt||{},{kern:false,nachglitzer:false},o); }
/* eigener Klang statt des Standardknalls */
sfx.e1still=()=>{};
function leise(r){ if(r) r.knall='e1still'; }
/* gefuehrte Sterne verblassen im Partikelsystem mit dem Alter (Farbe x
   Restleben) - das hier gleicht es aus, die Helligkeit steuert der Bruch */
function komp(st){ return 1/Math.max(0.1,1-st.alter/st.life); }
/* Stern mit eigener Physik: Luftwiderstand k (1/s), Schwerkraft g, fester
   Helligkeit hell (oder Funktion hf(st)); o.ende(st) am Lebensende */
function bahn(ps,p,v,c,life,o){
  o=o||{}; const k=o.k!==undefined?o.k:ZIEH, g=o.g!==undefined?o.g:3, hl=o.hell||1;
  return fuehre(ps,p.x,p.y,p.z,v[0],v[1],v[2],c,life,(st,dt)=>{ const w=st.v, f=Math.exp(-k*dt);
    w[0]*=f; w[2]*=f; w[1]=w[1]*f-g*dt;
    st.p[0]+=w[0]*dt; st.p[1]+=w[1]*dt; st.p[2]+=w[2]*dt;
    st.hell=(o.hf?o.hf(st):hl)*komp(st); },{spur:o.spur||0,ende:o.ende,mode:o.mode});
}
/* weicher Lichthof (additiver Wolkenballen), der einem Ort folgt:
   ort(t) -> [x,y,z], gr(t) Groesse m, a(t) Deckkraft */
function hof(dauer,ort,c,gr,a){
  const sp=wolkenSprite(true);
  return wolke(dauer,[sp],(w,t)=>{ const q=ort(t); wSetz(sp,q[0],q[1],q[2],gr(t),c,a(t)); });
}
/* hoechstens ein Plopp je 1/40 s - sonst stapeln sich die Toene */
const PLOPP={uhr:-9};
function plopp(p,v,h){ if(Math.abs(FW_UHR-PLOPP.uhr)<0.025) return; PLOPP.uhr=FW_UHR; schall(p,x=>sfx.plopp(x*v,h)); }
const WEISS=[1,1,1];

/* =========================================================
   Neue Bruchbilder (neue-effekte.md 1.1, 26.09., Tom: Anomalie).
   Jedes gehoert genau einem Produkt (SIGNATUR unten).
   ========================================================= */

/* 28.09., Tom: echt ("Punkte ... das sieht nicht mehr aus wie Feuerwerk").
   Jeder Stern fliegt ballistisch (normaler Luftwiderstand), verglimmt und
   verlischt fuer sich - keine stehenden Punkte, kein gemeinsamer Wind,
   kein Leuchthof (echt.md 1.1/1.9). */

/* Pusteblume (kinderbatterie): kleine Silberpaeonie mit Flitter (echte
   "Silver Firefly"): jeder Stern verliert feine Silberfunken, die hinter
   ihm einzeln aufblitzen und langsam sinken - wie Samen, die davonfliegen.
   Kurzer Goldkern (B) als Bluetenboden. */
EFF.pusteblume=function(p,A,B,s,r){
  zutaten(r,{flash:0.35}); leise(r);
  schall(p,v=>{ sfx.plopp(v*0.45,0.8); later(0.45,()=>sfx.rieseln(v*0.6,1.6)); });
  const q=QUAL(), g=clamp(s,0.25,1.4), n=Math.round(rand(38,50)*q*clamp(0.7+g*0.5,0.8,1.3)), G=2.6, alt=SCHWEIF, spur=[];
  const c0=mischF([0.95,0.97,1],A,0.2);
  SCHWEIF=0.2;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(5.4,6.4)*(0.75+g*0.6), L=rand(1.0,1.35), v=[d[0]*w,d[1]*w,d[2]*w];
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c0[0],c0[1],c0[2],L,G,0);
    spur.push({v,L}); }
  /* Bluetenboden: ein paar Goldsterne, kurz */
  SCHWEIF=0;
  for(let i=0;i<5;i++){ const d=randDir(), w=rand(0.4,0.9); psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(0.3,0.45),1,0); }
  SCHWEIF=alt;
  /* Flitter: alle 0,12 s loest sich hinter gut der Haelfte der Sterne ein
     Funke, faellt langsam (Luftwiderstand) und blitzt einmal auf */
  const fl=[0.92,0.95,1];
  for(let t=0.12;t<1.3;t+=0.12){ const tt=t;
    imBild(tt,()=>{ for(const x of spur){ if(tt>x.L*0.95||Math.random()<0.45) continue; const e=bahnOrt(p,x.v,G,tt), u=bahnTempo(x.v,G,tt);
      glint(psSmall,e.x,e.y,e.z,u[0]*0.08+rand(-.2,.2),u[1]*0.08-0.3,u[2]*0.08+rand(-.2,.2),fl,0.9,{t0:0.2,t1:0.8,dim:0.35,blitz:2.2,glimm:0.25,rest:0.5,psBlitz:psMid}); } }); }
};

/* Brausepulver (kinderparty): kleine Farbpaeonie (Limette, Rosa), deren
   Sterne am Ende knisternd zerplatzen - echte "Crackling Peony". Jeder
   Stern zu seiner Zeit, nicht alle zugleich. */
EFF.brausepulver=function(p,A,B,s,r){
  zutaten(r,{flash:0.4}); leise(r);
  schall(p,v=>sfx.plopp(v*0.5,0.75));
  const q=QUAL(), g=clamp(s,0.3,1.4), n=Math.round(rand(40,52)*q*clamp(0.7+g*0.4,0.8,1.2)), G=2.2, alt=SCHWEIF;
  const cA=mischF(A,WEISS,0.15), cB=mischF(B,WEISS,0.15);
  SCHWEIF=0.2;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(5.2,6.6)*(0.6+g*0.55), c=i%4===3?cB:cA, L=rand(0.75,1.05), v=[d[0]*w,d[1]*w,d[2]*w];
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0],c[1],c[2],L,G,0);
    if(Math.random()<0.7){ const tz=L*rand(0.9,1.0); imBild(tz,()=>{ const e=bahnOrt(p,v,G,tz); knisterPop(e.x,e.y,e.z,{funken:5,c:[1,1,0.94],laut:0.4}); }); } }
  SCHWEIF=alt;
};

/* Glitzerspur (glitzerregen12): Goldchrysantheme, deren Sterne dunkle
   Troepfchen verlieren - jedes blitzt spaeter genau einmal auf. */
EFF.glitterspur=function(p,A,B,s,r){
  zutaten(r,{kern:true,flash:0.8});
  const q=QUAL(), n=Math.round(rand(60,80)*q*clamp(0.6+s*0.4,0.7,1.3)), G=3.2, alt=SCHWEIF, spur=[];
  SCHWEIF=0.3;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(7,9)*s, c=i%4?A:B, L=rand(1.2,1.6), v=[d[0]*w,d[1]*w,d[2]*w];
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0],c[1],c[2],L,G,0);
    if(i%2===0) spur.push({v,L}); }
  SCHWEIF=alt;
  /* alle 0,1 s ein Troepfchen je zweitem Stern; es faellt und blitzt
     0,3-0,8 s spaeter einmal weissgold auf */
  const bern=[1,.5,.1];
  for(let t=0.1;t<1.6;t+=0.1){ const tt=t;
    imBild(tt,()=>{ for(const x of spur){ if(tt>x.L*0.95) continue; const e=bahnOrt(p,x.v,G,tt), w=bahnTempo(x.v,G,tt);
      glint(psMid,e.x,e.y,e.z,w[0]*0.12+rand(-.25,.25),w[1]*0.12-0.4,w[2]*0.12+rand(-.25,.25),bern,2.4,{t0:0.3,t1:0.8,dim:0.3,psBlitz:psBig,blitz:2.0,blitzFarbe:[1,.9,.62]}); } }); }
  schall(p,v=>later(0.35,()=>sfx.rieseln(v*0.9,1.2)));
};

/* Pulverschnee (schneeballschlacht): weisse Paeonie, deren Sterne am Ende
   zu Silberschnee zerfallen (echte "Peony to Glitter"): die Sterne fliegen
   als Kugelschale aus - alle etwa gleich schnell -, brennen weiss, und wo
   jeder verlischt, sinken drei bis fuenf feine Silberflocken langsam
   herab und blitzen einzeln auf. 28.09., Tom: echt - vorher fuellten die
   Sterne die Kugel gleichmaessig und flackerten alle zugleich: eine
   Punktwolke, kein Bruch. */
EFF.pulverschnee=function(p,A,B,s,r){
  zutaten(r,{flash:0.55}); leise(r);
  schall(p,v=>{ rauschF({dur:0.34,vol:0.32*v,typ:'bandpass',f:800,f2:250,q:0.7,an:0.01}); sfx.plopp(v*0.55,0.65); later(0.9,()=>sfx.rieseln(v*0.6,1.6)); });
  const q=QUAL(), n=Math.round(rand(50,62)*q*clamp(0.6+s*0.4,0.75,1.25)), G=2.4, alt=SCHWEIF, vw=6.6*(0.55+s*0.6);
  const fl=[0.9,0.94,1];
  SCHWEIF=0.1;
  for(let i=0;i<n;i++){ const d=randDir(), w=vw*rand(0.9,1.04), c=i%4?WEISS:FW.silber, L=rand(0.85,1.1), v=[d[0]*w,d[1]*w,d[2]*w];
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0],c[1],c[2],L,G,0);
    const tz=L*rand(0.93,0.99);
    imBild(tz,()=>{ const e=bahnOrt(p,v,G,tz), u=bahnTempo(v,G,tz), m=3+Math.floor(Math.random()*3);
      for(let k=0;k<m;k++){ const h=randDir(), w2=rand(0.5,1.3);
        glint(psSmall,e.x,e.y,e.z,u[0]*0.3+h[0]*w2,u[1]*0.3+h[1]*w2-0.2,u[2]*0.3+h[2]*w2,fl,0.7,{t0:0.15,t1:1.3,dim:0.3,blitz:2.4,glimm:0.25,rest:0.7,psBlitz:psMid}); } }); }
  SCHWEIF=alt;
};

/* Zeitsterne (sternstaub20, japanisch Jisa-shiki): der Bruch oeffnet
   dunkel - man sieht nur schwache Glutfaeden der dunkel brennenden
   Sterne -, dann zuenden die Sterne einer nach dem anderen zu Farbe,
   jeder mit kurzem Schweif, und fallen. 28.09., Tom: echt - vorher
   schwebten runde Leuchtpunkte mit Lichtkreuz im Himmel (Lichtshow). */
EFF.zeitsterne=function(p,A,B,s,r){
  zutaten(r,{flash:false}); leise(r);
  schall(p,v=>sfx.plopp(v*0.45,1.1));
  const q=QUAL(), n=Math.round(rand(55,75)*q*clamp(0.7+s*0.4,0.8,1.25)), G=2.4, alt=SCHWEIF, glut=[0.5,0.26,0.08], spur=[];
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(8,10)*s, v=[d[0]*w,d[1]*w,d[2]*w], tz=rand(0.3,1.6), c=i%5===4?B:A, L=rand(0.8,1.2);
    spur.push({v,tz});
    imBild(tz,()=>{ const e=bahnOrt(p,v,G,tz), u=bahnTempo(v,G,tz), a=SCHWEIF;
      /* 28.09., Tom: echt - Farbsterne ohne Schweif, nur die kurze Flamme
         (0,28 s zog im Bild blaue Stecknadeln: Kopf mit geradem Strich) */
      SCHWEIF=0.08; psBig.emit(e.x,e.y,e.z,u[0],u[1],u[2],c[0]*1.6,c[1]*1.6,c[2]*1.6,L,G,0); SCHWEIF=a;
      /* Zuendfunken beim Angehen */
      for(let k=0;k<3;k++){ const h=randDir(); psSmall.emit(e.x,e.y,e.z,u[0]*0.5+h[0]*1.5,u[1]*0.5+h[1]*1.5,u[2]*0.5+h[2]*1.5,1,.85,.6,rand(0.15,0.3),2,0); } }); }
  /* dunkler Flug: bis zum Zuenden ein schwacher Glutfaden je Stern */
  for(let t=0.08;t<1.6;t+=0.08){ const tt=t;
    imBild(tt,()=>{ for(const x of spur){ if(tt>=x.tz||Math.random()<0.5) continue; const e=bahnOrt(p,x.v,G,tt);
      psSmall.emit(e.x,e.y,e.z,rand(-.2,.2),rand(-.3,0),rand(-.2,.2),glut[0],glut[1],glut[2],rand(0.2,0.4),1,0); } }); }
  SCHWEIF=alt;
};

/* Fische (echt.md 1.1: Eigenantrieb, chaotisch, nie im Verband): jeder
   Fisch ist ein kleiner Stern mit Treibsatz. Er fliegt gebremst aus dem
   Bruch, dann schlaegt er alle paar Hundertstel einen neuen Haken in
   eine zufaellige Richtung, sinkt langsam und zieht einen kurzen
   Funkenfaden (halb Fischfarbe, halb Treibsatz). Jeder verlischt fuer
   sich. o: v0, L, tempo, haken, sink,
   aus (Ausstosszeit), funken (je s), funke (Farbe), hell, farbe(i). */
function fischFlug(p,n,o){
  const q=QUAL();
  for(let i=0;i<n;i++){
    const d=randDir(), w=rand(o.v0[0],o.v0[1]), c=o.farbe(i), L=rand(o.L[0],o.L[1]), tp=rand(o.tempo[0],o.tempo[1]), fk=mischF(c,o.funke,0.5);
    let hk=rand(0,o.haken[1]), dir=randDir();
    fuehre(psMid,p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c,L,(st,dt)=>{
      const v=st.v, t=st.alter;
      if(t<o.aus){ const f=Math.exp(-2.4*dt); v[0]*=f; v[1]=v[1]*f-2*dt; v[2]*=f; }
      else { hk-=dt; if(hk<=0){ hk=rand(o.haken[0],o.haken[1]); dir=streu(dir,1.2); }
        const m=Math.min(1,dt*10); v[0]+=(dir[0]*tp-v[0])*m; v[1]+=(dir[1]*tp*0.7-o.sink-v[1])*m; v[2]+=(dir[2]*tp-v[2])*m; }
      st.p[0]+=v[0]*dt; st.p[1]+=v[1]*dt; st.p[2]+=v[2]*dt;
      st.hell=o.hell*(0.78+Math.random()*0.4)*Math.min(1,(st.life-t)/0.2)*komp(st);
      st.d.acc=(st.d.acc||0)+dt*o.funken*q;
      /* Funkenfaden als psMid: psSmall war aus 30-40 m kaum zu sehen (Probebild 28.09.) */
      /* 28.09., Tom: "Punkte" - die Funken entstehen verteilt auf dem Weg
         dieses Bildes (vorher alle am selben Ort: der Faden zerfiel zur
         Perlenkette aus gleich weit stehenden Punkten), streuen staerker
         und verloeschen frueher - ein kurzer, zerrissener Funkenschwanz */
      for(;st.d.acc>=1;st.d.acc--){ const f=Math.random(); psMid.emit(st.p[0]-v[0]*dt*f,st.p[1]-v[1]*dt*f,st.p[2]-v[2]*dt*f,-v[0]*0.15+rand(-.7,.7),-v[1]*0.15+rand(-.9,.2),-v[2]*0.15+rand(-.7,.7),fk[0],fk[1],fk[2],rand(o.funkL?o.funkL[0]:0.15,o.funkL?o.funkL[1]:0.3)*rand(0.45,0.8),1.5,4); }
    },{spur:0.05});
  }
}

/* Irrlichter (zauberwald): gruene Fische - kleine gruene Sterne mit
   Treibsatz, die nach einem leisen Plopp zischend im Zickzack davon-
   schwimmen, dazwischen ein paar goldene. Vorher: grosse weiche
   Leuchtscheiben, die langsam umherschwebten (Lichtshow). */
EFF.irrlicht=function(p,A,B,s,r){
  zutaten(r,{flash:0.35}); leise(r);
  schall(p,v=>{ sfx.plopp(v*0.6,0.7); later(0.25,()=>sfx.zischen(v*0.45,1.4)); });
  const g=clamp(s,0.35,1.3), n=Math.round(rand(14,20)*clamp(0.8+g*0.3,0.9,1.25));
  fischFlug(p,n,{v0:[5*(0.7+g*0.4),7.5*(0.7+g*0.4)],L:[1.3,1.9],tempo:[3,4.5],haken:[0.08,0.16],sink:0.6,aus:0.25,funken:40,funkL:[0.3,0.5],funke:[1,.75,.35],hell:2.0,
    farbe:i=>i%3===2?B:A});
};

/* Heulerstern (heulbatterie): der Heuler endet in einem kleinen Stern-
   bruch. Tiefer Ton: groesser und langsamer, hoher Ton: klein und kurz.
   gleit (Heulboje): eine kleine Goldweide. Vorher blieb eine Leucht-
   kugel stehen und sank 2 s (Lichtshow). */
EFF.klangperle=function(p,A,B,s,r){
  zutaten(r,{flash:0.45}); leise(r);
  const ton=r&&typeof r.ton==='number'?r.ton:0, gl=!!(r&&r.par&&r.par.gleit), u=gl?0:clamp(ton/12,0,1), q=QUAL(), alt=SCHWEIF;
  schall(p,v=>sfx.crack(v*(gl?0.9:0.55)));
  if(gl){ const g=FW.gold;
    SCHWEIF=1.2;
    for(let i=0;i<Math.round(70*q*clamp(s,0.6,1.3));i++){ const d=randDir(), w=rand(3.5,5.5)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w*0.8+1.2,d[2]*w,g[0],g[1],g[2],rand(2.6,3.4),4.8,4); }
    SCHWEIF=0.08;
    for(let i=0;i<14;i++){ const d=randDir(), w=rand(2,3)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(1.0,1.4),2.4,0); }
    SCHWEIF=alt; return; }
  const n=Math.round((34-12*u)*q), sp=(6.4-2.2*u)*clamp(s,0.6,1.4), L=1.3-0.45*u;
  SCHWEIF=0.2;
  for(let i=0;i<n;i++){ const d=randDir(), w=sp*rand(0.85,1.05), c=i%5===4?B:A; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],L*rand(0.9,1.1),2.6,0); }
  SCHWEIF=alt;
};

/* Pfauenfeder (pfauenrad): Goldpalme, an deren Wedelspitzen kleine
   tuerkise Federaugen aufgehen, dazu ein tuerkiser Kern - eine echte
   "Palme mit farbigen Spitzen". Vorher: flache Leuchtscheibe zum
   Zuschauer mit Punktring (Figur). */
EFF.pfauenauge=function(p,A,B,s,r){
  zutaten(r,{kern:true,flash:0.8});
  const q=QUAL(), gold=FW.gold, arme=7+Math.floor(Math.random()*3), dreh=rand(0,6.28), G=4.2, alt=SCHWEIF;
  for(let a=0;a<arme;a++){
    const ang=dreh+a/arme*6.283+rand(-.3,.3), tilt=rand(0.3,1.1), sp=rand(8,10)*s;
    const v=[Math.cos(ang)*Math.cos(tilt)*sp,Math.sin(tilt)*sp+1.5,Math.sin(ang)*Math.cos(tilt)*sp], L=rand(2.2,2.6), vl=Math.hypot(v[0],v[1],v[2]), dn=[v[0]/vl,v[1]/vl,v[2]/vl];
    SCHWEIF=1.0; psHuge.emit(p.x,p.y,p.z,v[0],v[1],v[2],gold[0],gold[1],gold[2],L,G,4);
    for(let i=0;i<Math.round(5*q);i++){ const e=streu(dn,0.05), w=vl*rand(0.86,1); psBig.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,gold[0],gold[1]*0.92,gold[2]*0.8,L*rand(0.85,1),G,4); }
    funkenSchweif(p,v,G,L*0.8,3,gold);
    const tz=L*rand(0.72,0.82);
    imBild(tz,()=>{ const e=bahnOrt(p,v,G,tz), w=bahnTempo(v,G,tz), a2=SCHWEIF; SCHWEIF=0.16;
      for(let k=0;k<Math.round(7*q)+2;k++){ const d=randDir(), u=rand(1.4,2.4); psBig.emit(e.x,e.y,e.z,w[0]*0.3+d[0]*u,w[1]*0.3+d[1]*u,w[2]*0.3+d[2]*u,A[0],A[1],A[2],rand(0.7,1.0),2.2,0); }
      SCHWEIF=a2; }); }
  SCHWEIF=0.06;
  for(let i=0;i<Math.round(16*q);i++){ const d=randDir(), w=rand(2.2,3.2)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(1.2,1.6),2.2,0); }
  SCHWEIF=alt;
  later(1.6,()=>sfx.crackle(distVol(p)*0.4));
};

/* Falter (nachtfalter): Farbpaeonie mit "Falling Leaves" - ein kleiner
   Kranz Farbsterne (A) mit kurzem Schweif, dazu Blaetter: langsam
   brennende Glutstuecke, die taumelnd herabflattern, jedes in seinem
   eigenen Fluegeltakt, mit einem Faden Goldfunken. So brennt es echt
   (28.09., Tom: echt): die Blaetter sind warme Glut, nicht violette
   Leuchtscheiben. Vorher: ein stehender Weisspunkt, um den Falter kreisten. */
EFF.falterlicht=function(p,A,B,s,r){
  zutaten(r,{flash:0.4}); leise(r);
  schall(p,v=>{ sfx.plopp(v*0.6,0.85); later(0.4,()=>sfx.rieseln(v*0.4,2.4)); });
  const q=QUAL(), g=clamp(s,0.45,1.4), alt=SCHWEIF, funke=[1,.72,.3], glut=mischF([1,.62,.22],B,0.15);
  /* Farbkranz */
  SCHWEIF=0.16;
  for(let i=0;i<Math.round(rand(30,38)*q);i++){ const d=randDir(), w=rand(6,7.5)*(0.6+g*0.5); psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0]*1.1,A[1]*1.1,A[2]*1.1,rand(0.9,1.2),2.6,0); }
  SCHWEIF=alt;
  /* Blaetter */
  const n=Math.round(rand(20,26)*Math.max(0.7,q));
  for(let i=0;i<n;i++){
    const d=randDir(), w=rand(3.5,5.5)*(0.7+g*0.4), L=rand(3.2,4.4), sink=rand(0.9,1.5), om=rand(1.1,2.0)*6.283, amp=rand(0.5,0.9), ph=rand(0,6.28), wf=rand(5,9), wph=rand(0,6.28);
    const ax=randDir();
    fuehre(psMid,p.x,p.y,p.z,d[0]*w,d[1]*w*0.6+1,d[2]*w,glut,L,(st,dt)=>{
      const v=st.v, t=st.alter, f=Math.exp(-2.4*dt);
      v[0]*=f; v[2]*=f; v[1]+=(-sink-v[1])*Math.min(1,dt*2.2);
      const sw=Math.cos(t*om+ph)*amp;
      st.p[0]+=(v[0]+ax[0]*sw)*dt; st.p[1]+=(v[1]+Math.abs(sw)*0.25)*dt; st.p[2]+=(v[2]+ax[2]*sw)*dt;
      const flat=0.55+0.45*Math.sin(t*wf*6.283+wph);
      st.hell=(0.6+1.0*flat)*Math.min(1,t/0.2)*Math.min(1,(st.life-t)/0.5)*komp(st);
      /* Funkenfaden: der brennende Satz stoesst feine Goldfunken aus */
      st.d.acc=(st.d.acc||0)+dt*22*q*Math.min(1.2,st.hell);
      for(;st.d.acc>=1;st.d.acc--) psSmall.emit(st.p[0],st.p[1],st.p[2],rand(-.25,.25),rand(-.5,-.1),rand(-.25,.25),funke[0],funke[1],funke[2],rand(0.3,0.6),1.2,0);
    },{spur:0.1});
  }
};

/* Flitterstern (batterie16): Goldsterne, deren Funken sich im Flug
   wie Tannennadeln verzweigen (Matsuba) - ein wanderndes Goldnetz. */
EFF.flitterstern=function(p,A,B,s,r){
  zutaten(r,{kern:true,flash:0.8});
  const q=QUAL(), n=Math.round(rand(40,60)*q*clamp(0.6+s*0.4,0.7,1.3)), G=2.8, alt=SCHWEIF, st=[];
  const gold=mischF(FW.gold,A,0.3);
  SCHWEIF=0.22;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(8,10)*s, L=rand(1.3,1.6), v=[d[0]*w,d[1]*w,d[2]*w];
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],gold[0],gold[1],gold[2],L,G,0);
    /* Spitzen in B */
    if(i%5===0) psMid.emit(p.x,p.y,p.z,v[0]*1.02,v[1]*1.02,v[2]*1.02,B[0],B[1],B[2],L*0.9,G,0);
    st.push({v,L}); }
  SCHWEIF=alt;
  /* alle 0,12 s wirft jeder Stern einen Funken, der sich verzweigt */
  const C=[1,.86,.5];
  for(let t=0.12;t<1.5;t+=0.12){ const tt=t;
    imBild(tt,()=>{ for(let i=0;i<st.length;i+=(QUAL()<1?2:1)){ const x=st[i]; if(tt>x.L*0.9) continue; const e=bahnOrt(p,x.v,G,tt), w=bahnTempo(x.v,G,tt), d=randDir(), u=rand(1.8,3.2);
      verzweig(psMid,e.x,e.y,e.z,w[0]*0.3+d[0]*u,w[1]*0.3+d[1]*u,w[2]*0.3+d[2]*u,gold,0.3,2.5,{n:[3,6],tz:rand(0.1,0.25),C,tiefe:Math.random()<0.25?2:1}); } }); }
  schall(p,v=>{ for(let i=0;i<5;i++) later(0.25+i*0.22,()=>sfx.prasseln(v*0.9)); });
};

/* Vollmond (mondschein): Silberchrysantheme mit blassgelbem Pistill -
   der Mond im Silberhof, ein echter Pistill-Bruch. Vorher: eine
   Punktsichel, die 2 s still stand, mit grauer Nebelscheibe (Lichtshow). */
EFF.vollmond=function(p,A,B,s,r){
  zutaten(r,{flash:0.6});
  const q=QUAL(), alt=SCHWEIF, silber=mischF(FW.silber,A,0.1), mond=mischF(FW.zitrone,WEISS,0.45);
  /* 28.09., Tom: "Laser" - mit 0,55 s Leuchtspur zog jeder Silberstern
     eine glatte gerade Linie mit hellem Kopf (Stecknadel). Echt ist ein
     Kopf mit kurzer Flamme, dahinter ein Faden aus Titanfunken, die
     flackern, fallen und einzeln verloeschen (funkenFaden). */
  const st=[];
  SCHWEIF=0.12;
  for(let i=0;i<Math.round(90*s*q);i++){ const d=randDir(), w=rand(8,9.6)*s, v=[d[0]*w,d[1]*w,d[2]*w], L=rand(2.0,2.6);
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],silber[0],silber[1],silber[2],L,3.4,4); st.push({v,L}); }
  funkenFaden(p,st,3.4,[.85,.88,.95],0.45);
  SCHWEIF=0.06;
  for(let i=0;i<Math.round(34*s*q);i++){ const d=randDir(), w=rand(2.8,3.6)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,mond[0],mond[1],mond[2],rand(2.2,2.8),2.2,0); }
  SCHWEIF=alt;
  later(1.1,()=>sfx.crackle(distVol(p)*0.35));
};

/* Mondregen (Begleiter im Mondschein): leise Silberweide ohne Glitzer -
   lange, ruhige Silberfaeden, die langsam sinken. Die Glitzerweide ist
   ein Profi-Bruchbild (erst ab Level 16), darum hier diese stille Form. */
EFF.mondregen=function(p,A,B,s,r){
  zutaten(r,{flash:0.5});
  const q=QUAL(), n=Math.round(85*s*q), alt=SCHWEIF, c=mischF(FW.silber,A,0.15); SCHWEIF=1.1;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(4.5,6)*s;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w*0.7+1.2,d[2]*w,c[0],c[1],c[2],rand(2.6,3.3),3.2,0); }
  SCHWEIF=alt;
};

/* Silberfische (knisterfaecher): ein Schwarm echter Fische - viele
   kleine Silbersterne mit Treibsatz, jeder zischt fuer sich im Zickzack
   davon (schneller und kuerzer als die Irrlichter). Vorher zog der
   ganze Schwarm als Klumpen gemeinsam und wendete zugleich (Lichtshow). */
EFF.fischschwarm=function(p,A,B,s,r){
  zutaten(r,{flash:0.5}); leise(r);
  const g=clamp(s,0.5,1.4), n=Math.round(rand(26,34)*Math.max(0.7,QUAL())), silber=mischF([0.92,0.95,1],A,0.2);
  schall(p,x=>{ sfx.plopp(x*0.5,1); sfx.zischen(x*0.55,1.3); });
  fischFlug(p,n,{v0:[7*(0.7+g*0.35),10*(0.7+g*0.35)],L:[0.9,1.4],tempo:[5,7],haken:[0.05,0.1],sink:0.3,aus:0.18,funken:60,funkL:[0.25,0.45],funke:[.9,.93,1],hell:1.9,
    farbe:i=>i%5===4?B:silber});
};

/* Lampare (batterie49): Feuerball in der Luft - Glutkugel, grosse
   langsame Flammen (gelb, orange, dunkelrot), Auftrieb, dann Rauch. */
EFF.lampare=function(p,A,B,s,r){
  zutaten(r,{flash:1.3}); leise(r);
  schall(p,v=>{ sfx.wumms(v*1.1); rauschF({dur:0.9,vol:0.3*v,typ:'lowpass',f:260,an:0.03}); });
  const q=QUAL(), g=clamp(s,0.4,1.6), n=Math.round(rand(150,190)*q*clamp(0.6+g*0.4,0.7,1.3)), alt=SCHWEIF;
  /* 28.09., Tom: echt ("Punkte") - im Finale lagen 60-80 grosse, eine
     Sekunde lebende Flammen-Sprites je Ball als rote und gelbe Scheiben
     ueber dem ganzen Bild (Bokeh, kein Feuer). Jetzt viele kleine, kurze
     Flammenzungen (psMid, 0,25-0,55 s), die dicht ueberlappen und als
     eine aufquellende Flammenwolke lesen: innen gelbweiss, aussen orange,
     sie steigen (Auftrieb) und gehen dunkel in Rauch ueber. */
  SCHWEIF=0.06;
  for(let i=0;i<n;i++){ const d=randDir(), f=Math.cbrt(Math.random()), w=rand(3.2,6)*g*f, L=rand(0.35,0.75)*(1.25-0.45*f),
      c=f<0.55?[1,.9,.55]:[1,.6+rand(0,.15),.18], ps=i%5<2?psBig:psMid;
    ps.emit(p.x+d[0]*0.3*g,p.y+d[1]*0.3*g,p.z+d[2]*0.3*g,d[0]*w,d[1]*w+0.8,d[2]*w,c[0],c[1],c[2],L,-1.6,2,.22,.04,.01); }
  /* heisser Kern, nur einen Augenblick */
  SCHWEIF=0;
  for(let i=0;i<4;i++) psHuge.emit(p.x,p.y,p.z,rand(-.4,.4),rand(0,.6),rand(-.4,.4),1,.72,.32,rand(0.15,0.3),-0.5,0);
  SCHWEIF=alt;
  /* Glutkugel: zwei schwache Ballen, 0,5 s (der Koerper der Flamme, kein Licht) */
  for(let k=0;k<2;k++){ const R=(1.4+k*0.7)*g, c=[[1,.7,.28],[1,.42,.1]][k];
    hof(0.5,t=>[p.x,p.y+0.8*t,p.z],c,t=>R*(0.45+0.55*(1-Math.exp(-t*6))),t=>(0.13-k*0.04)*Math.min(1,t/0.05)*(1-glatt(0.1,0.5,t))); }
  flash(p,[1,.52,.16],1.2*g,0.6);   /* 28.09.: 4,5 - sieben zugleich im Finale tauchten den Platz in Weiss; 1,8: ein Feuerball faerbt die Umgebung orange, nicht grell */
  const ort={x:p.x,y:p.y,z:p.z};
  later(0.8,()=>rauchball({x:ort.x,y:ort.y+0.6,z:ort.z},{r:2.4*g,n:6,dauer:2.6,quellen:0.8,steigen:0.6,c:[0.11,0.09,0.08],a:0.45}));
};

/* Tausendblueten (sternenmeer42, japanisch Senrin): dunkler Bruch,
   ein Atemzug Stille, dann platzen alle kleinen Blueten zugleich -
   jede in EINER Farbe. */
EFF.tausendblueten=function(p,A,B,s,r){
  zutaten(r,{flash:0.2}); leise(r);
  schall(p,v=>sfx.plopp(v*0.5,1.1));
  const q=QUAL(), n=Math.round(rand(15,25)*Math.max(0.75,q)*clamp(0.8+s*0.2,0.9,1.15)), G=1.8, tB=rand(0.5,0.7), bw=clamp(s,0.6,1.4);
  const alt=SCHWEIF; SCHWEIF=0; psHuge.emit(p.x,p.y,p.z,0,0,0,0.5,0.45,0.35,0.06,0,0); SCHWEIF=alt;
  /* 28.09., Tom: echt - Blueten ueber die ganze Kugel verteilt (alle gleich schnell
     lagen sie beim Aufgehen als Kranz aus Punkten auf dem Rand) */
  for(let i=0;i<n;i++){ const d=randDir(), w=(2.8+4.2*Math.cbrt(Math.random()))*s, v=[d[0]*w,d[1]*w,d[2]*w], tz=tB+rand(-0.08,0.08), c=i%2?B:A;
    imBild(tz,()=>{ const e=bahnOrt(p,v,G,tz), m=Math.round(rand(10,14)*Math.max(0.75,q)), a=SCHWEIF; SCHWEIF=0.12;
      psBig.emit(e.x,e.y,e.z,0,0,0,c[0]*0.9+0.4,c[1]*0.9+0.4,c[2]*0.9+0.4,0.06,0,0);
      for(let k=0;k<m;k++){ const f=randDir(), u=rand(1.6,2.1)*bw; psBig.emit(e.x,e.y,e.z,f[0]*u,f[1]*u,f[2]*u,c[0],c[1],c[2],rand(0.75,0.9),1.5,0); }
      SCHWEIF=a; }); }
  /* dichtes Prasseln aus lauter Einzelklicks */
  schall(p,v=>later(tB-0.08,()=>{ for(let i=0;i<n;i++) later(rand(0,0.18),()=>sfx.klick(v*1.6,rand(0.6,1.3))); sfx.crack(v*0.5); }));
};

/* Leuchtspuren je Bruchbild (mitSchweif): die Brueche setzen ihre Spur
   selbst, hier nur die Vorgabe fuer alles, was sie nicht setzen */
Object.assign(EFF_SCHWEIF,{pusteblume:0.2,brausepulver:0.2,glitterspur:0.3,pulverschnee:0.1,zeitsterne:0.28,irrlicht:0.05,klangperle:0.2,pfauenauge:1.0,
  falterlicht:0,flitterstern:0.22,vollmond:0.12,fischschwarm:0.05,lampare:0.12,tausendblueten:0.12,mondregen:1.1});
/* Familien fuer effPassen: die Pfauenfeder ist eine Palme, der Vollmond
   ein Pistill - keine Figuren mehr */
EFF_FAMILIE.pfauenauge='haenger'; EFF_FAMILIE.vollmond='kugel';

/* Farbtorte (Boden-Ebene der Sortimente statt Bodenkreisel, 28.09., Tom:
   "Effekte am Produkt rauslassen"): ein Kreisel tanzt auf dem Boden und
   spruehte vom Karton aus 1,5 m breit farbige Funken ueber den Tisch -
   farbige Funken gibt es nicht, und aus einer Schachtel kommt kein
   Kreisel. Jetzt eine kleine Silberfontaene aus der Duese, 0,5-0,9 m
   hoch, in der alle 0,25 s ein paar Farbsterne (A) aufsteigen und
   verloeschen ("micro stars", echt.md 1.7). */
NEU_EMIT.farbtorte=(e,dt,o)=>{ const A=e.A||FW.gold, S=FW.silber, y0=emY(o,0.12), q=QUAL(), alt=SCHWEIF;
  e.acc=(e.acc||0)+dt*230*q; SCHWEIF=0.05;
  for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, w=rand(0.05,0.35);
    psSmall.emit(o.x,y0,o.z,Math.cos(a)*w,rand(2.4,3.8),Math.sin(a)*w,S[0],S[1],S[2],rand(0.35,0.7),5,4); }
  e.st=(e.st||0)-dt; if(e.st<=0){ e.st=rand(0.2,0.3); SCHWEIF=0.08;
    for(let k=0;k<3;k++){ const a=Math.random()*Math.PI*2, w=rand(0.1,0.4);
      psMid.emit(o.x,y0,o.z,Math.cos(a)*w,rand(4,5.5),Math.sin(a)*w,A[0]*1.2,A[1]*1.2,A[2]*1.2,rand(0.5,0.8),5,0); } }
  SCHWEIF=alt;
  e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=1.4; sfx.fizz(distVol(o)*0.5); } };

/* Heuler (heulbatterie): gerader, heller Pfeifschweif mit wenigen
   Funken statt der Silberspirale (echt.md 2.3: "Spirale weg, gerader
   Schweif + Ton"). Der Ton kommt weiter aus STEIG_KLANG/STEIG_TON. Nur
   die Tonleiter nutzt diesen Aufstieg. */
STEIG_ART.tonleiter={spur(r,dt,ort){ const c=r.trail;
  for(let n=jeSek(r,'a',160,dt);n>0;n--){ const q=ort(); psMid.emit(q[0]+rand(-.04,.04),q[1],q[2]+rand(-.04,.04),rand(-.25,.25),rand(-1.2,-0.3),rand(-.25,.25),c[0],c[1],c[2],rand(0.22,0.4),1,0); }
  for(let n=jeSek(r,'b',30,dt);n>0;n--){ const q=ort(); psSmall.emit(q[0],q[1],q[2],rand(-.8,.8),rand(-1.5,0),rand(-.8,.8),1,.85,.55,rand(0.2,0.35),3,0); } }};

/* Palmenstamm (goldpalmen): der Steigschweif einer Palmenbombe ist ein
   dicker Goldschweif aus Funken, die flackern und fallen - vorher blieben
   sie 1-1,4 s fast reglos in der Luft stehen (echt.md 1.9: stehende
   Punkte). Nur der Palmenhain nutzt diesen Aufstieg. */
STEIG_ART.stamm={spur(r,dt,ort){ const c=r.trail;
  /* 28.09.: feine Funken (psMid) - die grossen psBig-Punkte standen am
     Karton als Leuchtwolke (Bodenbild) */
  for(let n=jeSek(r,'a',300,dt);n>0;n--){ const q=ort(); psMid.emit(q[0]+rand(-.1,.1),q[1],q[2]+rand(-.1,.1),rand(-.4,.4),rand(-1.4,-0.2),rand(-.4,.4),c[0],c[1]*rand(.85,1),c[2],rand(0.5,0.9),2.2,4); }
  for(let n=jeSek(r,'b',50,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.8,.8),rand(-2,-.5),rand(-.8,.8),1,.62,.2,rand(0.6,1.1),3,4); } }};

/* Farbthemen dieser Klasse (28.09., Tom: "die Effekte muessen ineinander
   passen, von den Farben her"): je Produkt ein Thema, je Paar eine Farbe
   plus Gold/Silber/Weiss oder zwei Farben, die zusammengehoeren. */
Object.assign(THEMEN,{
  pusteblume:[['silber','gold'],['zitrone','gold']],
  brause:[['limette','weiss'],['rose','weiss'],['limette','rose']],
  falter:[['violett','gold'],['indigo','gold'],['violett','weiss']],
  familie:[['rot','gold'],['gruen','gold'],['blau','silber']],
  kirsch:[['rose','gold'],['rose','weiss'],['pfirsich','gold']],
  kanon:[['rot','weiss'],['gruen','weiss'],['gold','weiss']]
});

/* =========================================================
   Drehbuecher (Katalog katalog-shows-einstieg.md, 26.09.)
   Grundstufe steigt mit dem Level: L4 -11,5/0,40 ... L15 -3/0,92.
   ========================================================= */
const DB={
  /* Pusteblume, L4: zwei gelbe Loewenzahnblueten, dann vier Pusteblumen.
     28.09. (Tom: echt): Silberflitter statt driftender Punktwolke, Thema
     pusteblume - Zitrone/Gold, dann Silber/Gold. Die Loewenzahnblueten
     sind kleine Chrysanthemen (als Mini-Paeonie standen 30 dicke Punkte
     im Kreis - ein Punktkranz, kein Bruch) */
  kinderbatterie:()=>show({basis:{pw:-11.5,sz:0.40,th:'pusteblume'}, rampe:{sz:[0.9,1.15],pw:[-1,1],hell:[0.9,1.15],kurve:'linear'}}, [
    {n:2,gap:1.7,eff:'chrys',kal:'klein',farbe:1,muster:'gerade',steig:'keiner',bruchOpt:{kern:false,nachglitzer:false},pause:0.9},
    {n:2,gap:1.5,eff:'pusteblume',farbe:0,steig:'silber',muster:'zufall',ang:0.12,boden:{k:'torte',gt:4,A:'silber'},pause:1.0},
    {n:2,gap:0,muster:'v',ang:0.22,eff:'pusteblume',farbe:0,kal:'klein',steig:'silber',pause:3.0}
  ]),
  /* Brausepulver, L6: Bodenkreisel, Brauseschuesse, Tortenfontaenen.
     28.09.: nur Limette und Rosa (vorher Gruen, Violett, Magenta, Rosa);
     Tortenfontaenen in Silber - Funken sind nie rosa */
  kinderparty:()=>show({basis:{pw:-10.5,sz:0.44,th:'brause'}, rampe:{sz:[0.85,1.2],pw:[-1,1.5],hell:[0.9,1.2],kurve:'frueh'}}, [
    {n:0,nurBoden:true,boden:[{k:'farbtorte',gt:5,x:-0.1,A:'limette'},{k:'farbtorte',gt:5,x:0,A:'rose',t:0.4},{k:'farbtorte',gt:5,x:0.1,A:'limette',t:0.8}],pause:4.6},
    {n:2,gap:1.4,muster:'mitte',ang:0.18,eff:'brausepulver',farbe:2,steig:'gold',pause:0.9},
    {n:0,nurBoden:true,boden:[{k:'torte',gt:6,x:-0.09,A:'silber'},{k:'torte',gt:6,x:0.09,A:'silber'}]},
    {n:3,mit:true,takt:[0.4,1.4],muster:'w',ang:0.25,eff:['kugel','kugel','brausepulver'],farbe:0,kal:'klein',steig:'gold',pause:1.2},
    {n:2,gap:0,muster:'v',ang:0.28,eff:'brausepulver',farbe:1,kal:'klein',steig:'gold',pause:3.0}
  ]),
  /* Dreisprung, L8: dreimal drei Schuss, jeder Satz eine Stufe hoeher.
     28.09.: die Palme am Schluss golden mit rotem Kern (vorher rote
     Wedel mit roten Funkenschweifen) */
  miniverbund:()=>show({basis:{pw:-9,sz:0.50,th:'glut'}, rampe:{sz:[0.8,1.3],pw:[-2,2],hell:[0.85,1.25],kurve:'spaet'}}, [
    {n:3,muster:'treppe',hSpanne:10,takt:[0.45,0.6],eff:['kugel','kugel','chrys'],kal:'klein',steig:'glut',pause:1.8},
    {n:3,muster:'aussen',ang:0.3,hoehe:'steigend',hSpanne:10,takt:[0.45,0.6],eff:['chrys','chrys','wechsel'],steig:'silber',pause:1.8},
    {n:3,muster:'treppe',hSpanne:12,takt:[0.4,1.5],eff:['wechsel','chrys','palme'],A:['scharlach','scharlach','gold'],B:['weiss','weiss','scharlach'],kal:'mittel',steig:'gold',boden:{k:'fountain',gt:3,t:1.9,A:'gold',B:'zitrone'},pause:3.0}
  ]),
  /* Farbkanon, L8: fuenf Lichter. 28.09.: erst Rot, dann Gruen, zum
     Schluss Rot und Gruen mit Gold in der Mitte - hoechstens zwei Farben
     zugleich (vorher Blau, Gruen und Rot auf einmal) */
  roemisch:()=>show({basis:{pw:-9,sz:0.50,th:'kanon'}, rampe:{sz:[0.9,1.2],pw:[0,0],hell:[0.9,1.25],kurve:'linear'}}, [
    {n:5,perle:true,gap:0.6,muster:'gerade',rohrFolge:[-1,-0.5,0,0.5,1],farbFolge:['rot'],pause:0.7},
    {n:5,perle:true,gap:0.6,muster:'aussen',ang:0.08,rohrFolge:[-1,1,-0.5,0.5,0],farbFolge:['gruen'],pause:1.0},
    {n:5,perle:true,gap:0,muster:'schlag',ang:0.1,rohrFolge:[-1,-0.5,0,0.5,1],farbFolge:['rot','gruen','gold','gruen','rot'],pause:2.5}
  ]),
  /* Glitzerregen, L9: jeder Schuss zieht funkelnden Regen */
  glitzerregen12:()=>show({basis:{pw:-8.2,sz:0.55,th:'gold'}, rampe:{sz:[0.8,1.3],pw:[-2,2],hell:[0.85,1.3],kurve:'spaet'}}, [
    {n:3,gap:1.7,muster:'gerade',eff:'glitterspur',kal:'klein',steig:'gold',pause:1.0},
    {n:4,gap:1.0,muster:'v',ang:0.25,eff:'glitterspur',farbVert:'seite',steig:'gold',pause:1.2},
    {n:5,gap:0.32,gapEnde:0.12,muster:'zufall',ang:0.15,eff:'glitterspur',kal:'mittel',steig:'glut',boden:{k:'fountain',gt:3,A:'gold',B:'zitrone'},pause:3.2}
  ]),
  /* Schneeballschlacht, L10: Kreuzwuerfe - je zwei Schneebaelle fliegen
     aus den aeusseren Rohren uebers Kreuz und zerfallen zu Silberschnee.
     28.09. (Tom: echt): keine stehende Wolke mehr; kein "treffen" - aus
     zwei Rohren, die 6 cm auseinander stehen, trifft sich nichts in der
     Luft, beide brachen am selben Punkt */
  schneeballschlacht:()=>show({basis:{pw:-7.5,sz:0.60,th:'silber'}, rampe:{sz:[0.9,1.2],pw:[-1,1],hell:[0.9,1.2],kurve:'welle'}}, [
    {n:2,gap:1.6,muster:'gerade',eff:'pulverschnee',kal:'klein',steig:'silber',pause:0.8},
    {n:6,gap:1.0,muster:'x',ang:0.38,rohre:'breit',eff:'pulverschnee',steig:'silber',pause:1.2},
    {n:4,gap:0.25,muster:'zufall',ang:0.3,eff:'pulverschnee',kal:'mini',steig:'keiner',boden:{k:'torte',gt:3,A:'weiss'},pause:3.0}
  ]),
  /* Funkelnacht, L10: Zeitsterne gehen einer nach dem anderen an.
     28.09.: je Phase ein Paar (Blau/Gold, Himmel/Weiss); kein Boden-
     Stroboskop mehr (eine Batterie hat keins, wirkte wie Lichtshow) */
  sternstaub20:()=>show({basis:{pw:-7.5,sz:0.60,th:'nacht'}, rampe:{sz:[0.85,1.25],pw:[-1,2],hell:[0.8,1.3],kurve:'linear'}}, [
    {n:4,gap:2.0,muster:'gerade',eff:'zeitsterne',kal:'klein',steig:'keiner',pause:0.5},
    {n:6,gap:0.7,muster:'welle',ang:0.3,wellen:1,eff:'zeitsterne',farbe:1,steig:'blink',pause:1.0},
    {n:5,gap:0.3,muster:'spirale',seg:1,ang:0.2,eff:'zeitsterne',farbe:0,steig:'keiner',pause:1.2},
    {n:5,gap:0,muster:'schlag',ang:0.35,eff:'zeitsterne',kal:'mittel',farbe:0,steig:'keiner',pause:3.5}
  ]),
  /* Zauberwald, L10: gruene Fische (Irrlichter) zischen im Zickzack davon.
     28.09.: ohne gruenes Bengal-Dauerlicht am Boden und ohne schwebende
     Leuchtscheiben; nur Gruen und Gold */
  zauberwald:()=>show({basis:{pw:-7.5,sz:0.58,th:'wald'}, rampe:{sz:[0.9,1.2],pw:[-1,1],hell:[0.9,1.2],kurve:'flach'}}, [
    {n:3,gap:1.8,muster:'zufall',ang:0.2,eff:'irrlicht',kal:'mini',farbe:0,steig:'keiner',pw:-2,pause:1.0},
    {n:4,gap:1.2,muster:'paar',ang:0.3,eff:'irrlicht',farbe:0,steig:'gold',pw:-2,pause:1.0},
    {n:3,gap:0.5,muster:'kreis',ang:0.2,eff:'irrlicht',kal:'klein',farbe:0,steig:'keiner',pw:-1,pause:4.0}
  ]),
  /* Tonleiter, L11: Heuler spielen C-Dur aufwaerts, Lauf abwaerts, Boje.
     28.09.: oben ein kleiner Sternbruch je Ton statt stehender Leuchtkugel,
     gerader Pfeifschweif statt Spirale */
  heulbatterie:()=>show({basis:{pw:-6.8,sz:0.65,th:'wald'}, rampe:{sz:[0.9,1.2],pw:[0,0],hell:[0.9,1.2],kurve:'linear'}}, [
    {n:8,gap:0.9,gapEnde:0.6,muster:'treppe',hSpanne:10,steig:'tonleiter',ton:[0,2,4,5,7,9,11,12],eff:'klangperle',kal:'klein',pause:1.2},
    {n:3,gap:0.22,muster:'mitte',ang:0.25,steig:'tonleiter',ton:[11,9,7],eff:'klangperle',pause:1.6},
    {n:1,gap:0,muster:'gerade',steig:'tonleiter',ton:[-12],gleit:true,eff:'klangperle',kal:'mittel',pw:3,pause:3.5}
  ]),
  /* Pfauenrad, L11: der Pfau schlaegt zweimal sein Rad - Goldpalmen mit
     tuerkisen Federaugen, als Faecher auf Schlag. 28.09.: nur Tuerkis und
     Gold (vorher auch Blau, Gruen, Violett), Kiel als Goldkomet */
  pfauenrad:()=>show({basis:{pw:-6.8,sz:0.66,th:'pfau'}, rampe:{sz:[0.8,1.35],pw:[-1,2],hell:[0.85,1.3],kurve:'spaet'}}, [
    {n:3,gap:1.2,muster:'gerade',eff:'pfauenauge',kal:'klein',farbe:0,steig:'komet',pause:0.8},
    {n:5,gap:0,muster:'schlag',ang:0.45,eff:'pfauenauge',farbe:0,steig:'komet',pause:1.6},
    {n:4,gap:0.18,muster:'wischer',seg:2,ang:0.3,eff:'wechsel',farbe:0,kal:'mini',steig:'keiner',pause:0.8},
    {n:7,gap:0,muster:'schlag',ang:0.6,eff:'pfauenauge',kal:'mittel',farbe:0,steig:'komet',boden:{k:'fountain',gt:4,A:'gold',B:'weiss'},pause:3.5}
  ]),
  /* Tornado-Box, L12: Bodenwirbel, die sich in die Luft schrauben.
     28.09. (Tom: "am Produkt rauslassen"): jeder Wirbel dreht nur kurz auf
     dem Karton und hebt dann ab - die sechs darum etwas gestaffelt.
     28.09.: statt der zweifarbigen Drallringe summende Bienen, Farbwechsel
     und Knister - Tuerkis mit Silber; Knisterfontaene statt des Boden-
     Stroboskops (Blitzlicht im Takt wirkte wie Lichtshow) */
  jugendbox:()=>show({basis:{pw:-6.0,sz:0.70,th:'eis'}, rampe:{sz:[0.85,1.2],pw:[-1,1.5],hell:[0.9,1.2],kurve:'welle'}}, [
    {n:0,nurBoden:true,boden:[{k:'tornado',gt:4,x:-0.11,A:'tuerkis'},{k:'tornado',gt:4,x:0.11,A:'silber',t:0.9},{k:'tornado',gt:4,x:0,A:'tuerkis',t:1.9}],pause:4.8},
    {n:8,gap:0.35,muster:'welle',ang:0.25,wellen:1,eff:'bienen',farbe:0,kal:'mini',steig:'silber',pause:1.0},
    {n:6,gap:0.8,muster:'gerade',eff:'wechsel',farbe:0,kal:'klein',steig:'silber',boden:[{k:'tornado',gt:4,x:-0.13,A:'weiss',t:0.5},{k:'tornado',gt:4,x:0.13,A:'tuerkis',t:2.5}],pause:1.0},
    {n:6,gap:0.6,muster:'v',ang:0.3,eff:'knister',farbe:2,steig:'silber',boden:{k:'knisterbrunnen',gt:4,gh:0.6,A:'silber',B:'weiss'},pause:1.0},
    {n:0,nurBoden:true,boden:[{k:'tornado',gt:4,x:0,A:'tuerkis'}],pause:2.0},
    {n:3,gap:0.12,muster:'mitte',ang:0.35,eff:'bienen',farbe:2,kal:'klein',steig:'silber',pause:3.0}
  ]),
  /* Nachtfalter, L12: aus jedem violetten Farbkranz taumeln glimmende
     Blaetter herab. 28.09.: kurze Goldfontaene statt 38 s Bengal-Laterne;
     Violett mit Gold, Goldweiden statt schwebender Leuchtscheiben */
  nachtfalter:()=>show({basis:{pw:-6.0,sz:0.72,th:'falter'}, rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'frueh'}}, [
    {n:0,nurBoden:true,boden:{k:'torte',gt:3,A:'gold'},pause:1.0},
    {n:6,gap:1.6,muster:'gerade',eff:'falterlicht',kal:'klein',farbe:0,steig:'keiner',pause:1.0},
    {n:8,gap:0.45,muster:'kreis',ang:0.25,eff:'falterlicht',farbe:0,steig:'glut',pause:1.0},
    {n:10,takt:[0.2,0.2,0.9],muster:'zufall',ang:0.35,eff:['falterlicht','weide'],farbe:1,steig:'keiner',pause:1.2},
    {n:12,gap:0.25,gapEnde:0.12,muster:'mitte',ang:0.4,eff:'falterlicht',kal:'mittel',farbe:0,steig:'glut',pause:3.5}
  ]),
  /* Funkenflug, L13: Senko-Hanabi am Boden, verzweigte Goldsterne oben */
  batterie16:()=>show({basis:{pw:-5,sz:0.78,th:'gold'}, rampe:{sz:[0.8,1.3],pw:[-3,2.5],hell:[0.85,1.3],kurve:'linear'}}, [
    {n:0,nurBoden:true,boden:{k:'flitterbrunnen',gt:6},pause:3.5},
    {n:4,gap:1.4,muster:'aussen',ang:0.3,eff:'flitterstern',kal:'klein',steig:'gold',pause:0.8},
    {n:6,gap:0.3,muster:'z',seg:2,ang:0.3,eff:['flitterstern','chrys'],steig:'gold',pause:1.0},
    {n:6,gap:0.9,muster:'paar',ang:0.35,eff:'flitterstern',kal:'mittel',steig:'glut',boden:{k:'flitterbrunnen',gt:5,gh:1.3},pause:3.2}
  ]),
  /* Palmenhain, L13: Goldpalmen mit stehendem Stamm auf zwei Etagen */
  goldpalmen:()=>show({basis:{pw:-5,sz:0.78,th:'gold'}, rampe:{sz:[0.85,1.35],pw:[-1,2],hell:[0.85,1.3],kurve:'spaet'}}, [
    {n:3,gap:2.2,muster:'gerade',eff:'palme',kal:'mittel',steig:'stamm',pause:0.8},
    {n:6,gap:1.2,muster:'v',ang:0.2,eff:'palme',steig:'stamm',hoehe:'wechsel',hSpanne:6,pause:1.0},
    {n:6,mit:true,gap:0.6,muster:'gerade',rohre:'breit',mineEff:'kokosnuss',mineSz:0.7,nurMine:true},
    {n:6,gap:0.35,muster:'welle',wellen:1,ang:0.3,eff:['palme','kokosnuss'],steig:'stamm',hoehe:'zufall',hSpanne:8,boden:{k:'volcano',gt:4,A:'gold',B:'orange'},pause:1.2},
    {n:4,gap:0,muster:'schlag',ang:0.35,eff:'palme',kal:'gross',steig:'stamm',hoehe:'wechsel',hSpanne:8,pause:4.0}
  ]),
  /* Mondschein, L13: Silberchrysanthemen mit blassgelbem Mond im Kern ueber
     einer Silberfontaene. 28.09.: statt stehender Punktsicheln mit
     grauem Nebelhof (Lichtshow) */
  mondschein:()=>show({basis:{pw:-5,sz:0.78,th:'silber'}, rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.8,1.3],kurve:'linear'}}, [
    {n:4,gap:2.0,muster:'gerade',eff:'vollmond',kal:'klein',steig:'silber',pause:1.0},
    {n:8,gap:0.6,muster:'welle',ang:0.3,wellen:1,eff:['farbregen','farbregen','farbregen','vollmond'],steig:'keiner',pause:1.2},
    {n:0,nurBoden:true,boden:{k:'fountain',gt:9,A:'silber',B:'weiss'}}, /* 28.09., Tom: "Effekt zu gross" - Silberfontaene statt Wasserfall: der spruehte 1,5 m breit ueber Tisch und Boden (Bodenbild) */
    {n:10,mit:true,takt:[0.3,0.3,1.2],muster:'aussen',ang:0.35,eff:['mondregen','mondregen','vollmond'],steig:'silber',pause:1.0},
    {n:8,gap:0.2,muster:'zufall',ang:0.25,eff:['farbregen','vollmond'],kal:'mittel',hoehe:'zufall',hSpanne:8,steig:'keiner',pause:4.0}
  ]),
  /* Familienfest, L13: ein Funke laeuft von Teil zu Teil (Staffel).
     Orte der Teile in Metern (x) wie die des Lauffeuers - mit rohrFolge
     (relativ zur 0,4-m-Schachtel) stuende das Roemische Licht 8 cm neben
     der Mitte, das Lauffeuer endete aber 10 cm daneben.
     28.09.: je Teil ein Farbpaar - Rot/Gold, Gruen/Gold, Blau/Silber
     (vorher Rot, Gruen, Gelb, Blau, Magenta durcheinander) */
  sortiment:()=>show({basis:{pw:-5.2,sz:0.76,th:'familie'}, rampe:{sz:[0.8,1.3],pw:[-3.5,3],hell:[0.9,1.25],kurve:'welle'}}, [
    {n:0,nurBoden:true,boden:[{k:'volcano',gt:6,x:-0.4,A:'gold',B:'zitrone'},{k:'lauffeuer',t:5.2,gt:1.0,x:-0.4,bis:-0.1}],pause:6.2},
    {n:4,perle:true,gap:0.8,x:-0.1,farbFolge:['rot','gold','rot','gold'],boden:{k:'lauffeuer',t:3.2,gt:1.0,x:-0.1,bis:0.25},pause:1.2},
    {n:5,gap:0.5,muster:'mitte',ang:0.3,x:0.25,eff:['kugel','wechsel','chrys','kugel','wechsel'],farbe:1,steig:'gold',boden:{k:'lauffeuer',t:2.5,gt:1.0,x:0.25,bis:0.45},pause:1.2},
    {n:0,nurBoden:true,boden:[{k:'farbtorte',gt:5,x:0.45,A:'gruen'},{k:'lauffeuer',t:4.4,gt:1.2,x:0.45,bis:0}]},
    {n:3,mit:true,gap:0.9,x:0.45,mineEff:'kugel',mineSz:0.6,nurMine:true,farbe:2,pause:2.8},
    {n:3,gap:0.3,muster:'aussen',ang:0.35,x:0,eff:'chrys',kal:'mittel',farbe:2,steig:'gold',boden:[{k:'fountain',gt:5,x:-0.25,A:'gold',B:'weiss'},{k:'fountain',gt:5,x:0.25,A:'gold',B:'zitrone'}],pause:4.5}
  ]),
  /* Feuerperlen, L14: Buendel aus vier Lichtern, Verwandlungskugeln mit
     Knall. Alle Phasen aus den vier Rohren des Buendels (Katalog: nur
     die erste - die anderen kaemen sonst aus der Mitte).
     28.09.: kurze Goldfontaene zum Auftakt statt rotem Bengallicht */
  feuerperlen:()=>show({basis:{pw:-4,sz:0.84,th:'glut'}, rampe:{sz:[0.9,1.25],pw:[0,1.5],hell:[0.9,1.3],kurve:'linear'}}, [
    {n:4,perle:true,perleEff:'wandelperle',gap:1.3,muster:'gerade',rohrFolge:[-0.6,-0.2,0.2,0.6],boden:{k:'fountain',gt:4,gh:0.4,A:'gold',B:'weiss'},pause:0.5},
    {n:4,perle:true,perleEff:'wandelperle',gap:0.7,muster:'v',ang:0.25,rohrFolge:[-0.6,0.6,-0.2,0.2],pause:0.6},
    {n:4,perle:true,perleEff:'wandelperle',gap:0.25,muster:'kreis',ang:0.2,rohrFolge:[-0.6,-0.2,0.2,0.6],pause:0.8},
    {n:4,perle:true,perleEff:'wandelperle',gap:0,muster:'schlag',ang:0.3,rohrFolge:[-0.6,-0.2,0.2,0.6],pause:3.0}
  ]),
  /* Knattersturm, L14: Crackling auf zwei Etagen zugleich */
  knatter:()=>show({basis:{pw:-4,sz:0.90,th:'eis'}, rampe:{sz:[0.85,1.3],pw:[-1.5,3],hell:[0.85,1.3],kurve:'spaet'}}, [
    {n:4,gap:1.5,muster:'gerade',eff:'drachenei',kal:'klein',steig:'knister',pause:0.6},
    {n:6,gap:0.8,muster:'paar',ang:0.3,rohre:'breit',mineEff:'knister',mineSz:0.7,nurMine:true},
    {n:6,mit:true,gap:0.4,muster:'mitte',ang:0.3,eff:'tausend',steig:'knister',pause:1.0},
    {n:8,gap:0.15,muster:'wischer',seg:2,ang:0.35,eff:'knister',kal:'klein',steig:'silber',boden:{k:'knisterbrunnen',gt:4,gh:0.8,A:'silber',B:'weiss'},pause:1.2},
    {n:6,gap:0,muster:'schlag',ang:0.4,eff:'tausend',kal:'mittel',pw:2,mineEff:'knister',mineSz:0.8,steig:'knister',pause:3.5}
  ]),
  /* Silberschwarm, L14: Silberfische, der einzige Schwenk der Klasse.
     28.09.: jeder Fisch fuer sich (vorher zog der Schwarm als Klumpen) */
  knisterfaecher:()=>show({basis:{pw:-4,sz:0.85,th:'blitz'}, rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'frueh'}}, [
    {n:4,gap:1.4,muster:'mitte',ang:0.3,eff:'fischschwarm',kal:'klein',steig:'silber',pause:0.6},
    {n:6,gap:0.15,muster:'fan',ang:0.45,eff:['fische','fischschwarm'],kal:'klein',steig:'keiner',pause:0.8},
    {n:6,gap:0.5,muster:'welle',ang:0.35,wellen:1,eff:'fischschwarm',steig:'silber',boden:{k:'fountain',gt:4,A:'silber',B:'weiss'},pause:1.0},
    {n:8,gap:0.35,muster:'x',ang:0.4,rohre:'breit',eff:'fischschwarm',kal:'mittel',steig:'silber',pause:3.5}
  ]),
  /* Feuersturm, L15: Sprint auf drei Ebenen, 3 Schuss je Sekunde.
     28.09.: Vulkane Orange/Gold und Bernstein/Gold - rote Funken gibt es
     nicht (Kohle glueht orange-gold) */
  batterie49:()=>show({basis:{pw:-2.5,sz:0.90,th:'glut'}, rampe:{sz:[0.75,1.25],pw:[-2.8,2],hell:[0.85,1.35],kurve:'linear'}}, [
    /* 28.09., Tom: "Effekt zu gross" - zwei kurze kleine Goldfontaenen zum
       Auftakt (vorher 15 s Vulkane in voller Hoehe: mehr Fontaene als Batterie) */
    {n:0,nurBoden:true,boden:[{k:'fountain',gt:5,x:-0.13,A:'orange',B:'gold'},{k:'fountain',gt:5,x:0.13,A:'bernstein',B:'gold',t:0.3}],pause:0.4},
    {n:6,gap:0.7,muster:'gerade',eff:'lampare',kal:'klein',steig:'glut',pause:0.5},
    {n:10,gap:0.45,muster:'v',ang:0.3,eff:'chrys',steig:'glut',pause:0.5},
    {n:8,mit:true,gap:0.28,muster:'gerade',rohre:'breit',mineEff:'lampare',mineSz:0.6,nurMine:true},
    {n:12,gap:0.2,muster:'z',seg:3,ang:0.4,eff:['palme','lampare'],steig:'gold',pause:0.8},
    {n:6,gap:0.25,muster:'w',ang:0.35,eff:'chrys',kal:'mittel',steig:'knister',pause:0.6},
    /* 27.09.: Schlussfaecher hoeher - schraege Rohre steigen sonst tiefer als der Anfang (steigerung.js) */
    {n:7,gap:0,muster:'schlag',ang:0.45,eff:'lampare',kal:'gross',pw:2.5,steig:'glut',mineEff:'chrys',mineSz:0.7,pause:3.0}
  ]),
  /* Tausendblueten, L15: Senrin - Stille, dann ein Beet aus Blueten.
     28.09.: Kirschbluete - Rosa mit Gold/Weiss (vorher Gruen, Magenta,
     Violett, Rosa); gerader Goldaufstieg statt Wirbel */
  sternenmeer42:()=>show({basis:{pw:-3,sz:0.92,th:'kirsch'}, rampe:{sz:[0.8,1.35],pw:[-2,3],hell:[0.8,1.35],kurve:'linear'}}, [
    {n:4,gap:2.2,muster:'gerade',eff:'tausendblueten',kal:'klein',steig:'silber',pause:0.4},
    {n:8,gap:0.45,muster:'spirale',ang:0.3,seg:1,eff:['wechsel','tausendblueten'],steig:'gold',boden:{k:'sternregen',gt:5,A:'gold',B:'rose'},pause:1.0},
    {n:10,takt:[0.2,0.2,0.2,1.0],muster:'aussen',ang:0.4,eff:'tausendblueten',farbVert:'mitte',steig:'silber',pause:1.0},
    {n:12,gap:0.15,muster:'w',ang:0.35,eff:['chrys','tausendblueten'],hoehe:'wechsel',hSpanne:6,steig:'gold',pause:1.2},
    {n:8,gap:0,muster:'schlag',ang:0.45,eff:'tausendblueten',kal:'mittel',steig:'silber',boden:[{k:'volcano',gt:4,x:-0.11,A:'gold',B:'zitrone'},{k:'volcano',gt:4,x:0.11,A:'gold',B:'zitrone'}],pause:4.0}
  ])
};
Object.keys(DB).forEach(t=>{ SHOWS[t]=DB[t];
  /* Grundstufe auch in SHOW_BASIS (Tests, Anzeige) - die Show selbst traegt sie als basis */
  SHOW_BASIS[t]=Object.assign({},DB[t]().basis); });

/* Signaturen: das eine Bild, das nur dieses Produkt hat */
Object.assign(SIGNATUR,{
  kinderbatterie:{eff:'pusteblume',text:'Silberflitter, der wie Samen davonrieselt'},
  kinderparty:{eff:'brausepulver',text:'Limetten- und Rosasterne, die knisternd zerplatzen'},
  miniverbund:{muster:'treppe',idee:'Dreisprung 3x3',text:'dreimal drei Schuss, jeder Satz eine Stufe hoeher'},
  roemisch:{idee:'Farbkanon',text:'fuenf Lichter, erst rot, dann gruen, zum Schluss im Wechsel'},
  glitzerregen12:{eff:'glitterspur',text:'Goldsterne verlieren Troepfchen, die einzeln aufblitzen'},
  schneeballschlacht:{idee:'kreuzwurf',eff:'pulverschnee',text:'Schneebaelle fliegen uebers Kreuz und zerfallen zu sinkendem Silberschnee'},
  sternstaub20:{eff:'zeitsterne',text:'dunkler Bruch, die Sterne gehen einzeln an'},
  zauberwald:{eff:'irrlicht',text:'gruene Fische schwimmen zischend im Zickzack davon'},
  heulbatterie:{eff:'klangperle',idee:'tonleiter',text:'Heuler spielen eine Tonleiter, oben ein Sternbruch je Ton'},
  pfauenrad:{eff:'pfauenauge',text:'Goldpalmen mit tuerkisen Federaugen, als Rad auf Schlag'},
  jugendbox:{idee:'tornado',text:'Bodenwirbel, die sich spiralfoermig in die Luft schrauben'},
  nachtfalter:{eff:'falterlicht',text:'Farbkranz, aus dem glimmende Blaetter taumelnd herabflattern'},
  batterie16:{eff:'flitterstern',text:'Goldfunken verzweigen sich wie Tannennadeln'},
  goldpalmen:{idee:'Palmenhain/stamm',text:'Goldpalmen mit stehendem Stamm auf zwei Etagen'},
  mondschein:{eff:'vollmond',text:'Silberchrysantheme mit blassgelbem Mond im Kern'},
  sortiment:{idee:'lauffeuer',text:'ein Zuendfunke laeuft sichtbar von Teil zu Teil'},
  feuerperlen:{eff:'wandelperle',text:'Leuchtkugel rot, gold, weiss mit Dunkelpause - und oben ein Knall'},
  knatter:{idee:'Doppeldeck-Knistern',text:'Knistern auf zwei Hoehen zugleich'},
  knisterfaecher:{eff:'fischschwarm',text:'Silberfische zischen im Zickzack auseinander'},
  batterie49:{idee:'Sprint drei Ebenen',eff:'lampare',text:'49 Schuss in 16 s, Feuerbaelle auf drei Ebenen'},
  sternenmeer42:{eff:'tausendblueten',text:'Stille, dann platzen Dutzende kleiner Blueten zugleich'}
});
})();

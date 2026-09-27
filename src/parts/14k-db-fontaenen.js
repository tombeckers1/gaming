/* =========================================================
   Fontaenen und Bodeneffekte - je Produkt eigene Funkenart und Phasen
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Katalog: katalog-fontaenen.md. Fontaene ist Fontaene (Tom, 25.09.):
   keine Ladung, kein Bruch am Himmel - alles bleibt in Fontaenenhoehe.
   1. Grundlagen   2. Materialien (Feld funke)   3. Emitter (NEU_EMIT)
   4. Ereignisse (FONT_EREIGNIS)   5. Drehbuecher (FONT) und SIGNATUR
   ========================================================= */

/* ---------- 1. Grundlagen ---------- */
/* Boden unter einem Punkt: Platte des Zuendtischs (0,93 m) oder Hof */
function fkBoden(x,z){ const T=STATION_POS&&STATION_POS.tisch;
  return T&&Math.abs(x-T.x)<1.25&&Math.abs(z-T.z)<0.52?0.94:0.02; }
/* Starttempo fuer h Meter (mit Luftwiderstand), zwischengespeichert */
const FK_V0={};
function fkV0(h,g){ const k=Math.round(h*20)+'|'+g; return FK_V0[k]||(FK_V0[k]=vFuerHoehe(Math.max(0.05,h),g)); }
/* Steigzeit bis zum Gipfel */
function fkTA(v0,g){ return Math.log(1+ZIEH*v0/g)/ZIEH; }
/* Zufallsrichtung im Kegel (halber Winkel kg, rad) um d */
function fkKegel(d,kg){ const t=Math.sqrt(Math.random())*kg, a=Math.random()*Math.PI*2, [u,w]=quer(d), s=Math.sin(t), c=Math.cos(t), ca=Math.cos(a)*s, sa=Math.sin(a)*s;
  return [d[0]*c+u[0]*ca+w[0]*sa,d[1]*c+u[1]*ca+w[1]*sa,d[2]*c+u[2]*ca+w[2]*sa]; }
/* Zustand je Zuendung ueber alle Phasen: Winkel, Drehzahl, Deko */
const FK_Z=new Map();
function fkZ(e){ const k=e.tag||0; let z=FK_Z.get(k); if(!z){ z={}; FK_Z.set(k,z); if(FK_Z.size>40) FK_Z.delete(FK_Z.keys().next().value); } return z; }
/* Menge je Sekunde (nicht je Bild) */
function fkJe(e,k,rate,dt){ e[k]=(e[k]||0)+dt*Math.max(0,rate); const n=Math.floor(e[k]); e[k]-=n; return n; }
/* Dauerklang je Phase (Feld ton); Lautstaerke folgt staerke und
   lautKurve. Nur die erste Duese klingt, sonst waere ein Set viermal so laut. */
function fkKlang(e,o,dt,faktor){
  const t=e.ph&&e.ph.ton; if(!t||t==='still'||e.nr) return;
  const st=(e.staerke===undefined?1:e.staerke)*(e.lautAkt||1)*(faktor===undefined?1:faktor); if(st<0.05) return;
  e.kl=(e.kl||0)-dt; if(e.kl>0) return; const v=distVol(o)*st;
  if(t==='rauschen'){ e.kl=1.3; sfx.fizz(v*0.85); }
  else if(t==='zischen'){ e.kl=1.1; sfx.zischen(v*0.8,1.25); }
  else if(t==='fauchen'){ e.kl=0.95; sfx.fauchen(v*0.8,1.1); }
  else if(t==='knistern'){ e.kl=rand(0.25,0.5); sfx.crackle(v*0.55); }
  else if(t==='knistern_laut'){ e.kl=0.1; sfx.crackle(v); }
  else if(t==='blubb'){ e.kl=rand(0.6,1.1); sfx.plopp(v*0.35,0.7); }
  else if(t==='grollen'){ e.kl=0.8; sfx.thump(v*0.35); }
  else if(t==='brummen'){ e.kl=1.2; sfx.brodeln(v*0.6,1.3); }
}
/* Den Standard-Zischer beim Phasenstart ersetzt der Dauerklang */
['rauschen','zischen','fauchen','knistern','knistern_laut','blubb','grollen','brummen'].forEach(k=>{ FONT_TON[k]=()=>{}; });
const fkId=e=>e.id||(e.id=Math.random());

/* ---------- 2. Materialien (Funkenarten, Feld funke) ----------
   g = Schwerkraft (Endtempo g/ZIEH), Leuchtspur, Lebensdauer relativ zur
   Steigzeit tA, eigenes Leuchtverhalten. */
const FUNKE={
  /* Kohle-Gold / Tigerschweif: weich, dunkelorange, lange Boegen, dunkelt
     ab und funkelt nicht (e.kohleB: Farbe, zu der er abdunkelt) */
  kohle:{g:6,emit(x,y,z,vx,vy,vz,c,tA,e){ SCHWEIF=0.3; const b=e&&e.kohleB||null;
    psMid.emit(x,y,z,vx,vy,vz,c[0],c[1]*0.92,c[2]*0.8,tA*rand(1.25,1.9),6,2,b?b[0]*0.8:c[0]*0.6,b?b[1]*0.5:c[1]*0.22,b?b[2]*0.4:c[2]*0.05); }},
  /* Brokat: helles Gold, flimmert, feine Spur */
  brokat:{g:6,emit(x,y,z,vx,vy,vz,c,tA){ SCHWEIF=0.2;
    psMid.emit(x,y,z,vx,vy,vz,c[0]*0.8+0.2,c[1]*0.8+0.16,c[2]*0.8+0.1,tA*rand(1.2,1.8),6,4); }},
  /* Titan: grellweiss-blaeulich, hart, schnell, kurze Striche, verloescht oben */
  titan:{g:6,emit(x,y,z,vx,vy,vz,c,tA){ SCHWEIF=0.07;
    psMid.emit(x,y,z,vx,vy,vz,c[0]*0.6+0.45,c[1]*0.6+0.47,c[2]*0.6+0.5,tA*rand(0.85,1.08),6,0); }},
  /* Glitter: fliegt gedaempft, blitzt einmal hell auf (glint) */
  glitter:{g:6,emit(x,y,z,vx,vy,vz,c,tA,e){ const ph=e&&e.ph||{}, an=ph.glitterAnteil===undefined?0.7:ph.glitterAnteil;
    if(Math.random()<an) glint(psMid,x,y,z,vx,vy,vz,c,6,{t0:tA*0.55,t1:tA*1.6,dim:0.32,blitz:2.8,blitzFarbe:farbe(ph.glitterFarbe)||[1,0.95,0.75],glimm:0.12,rest:0.5});
    else { SCHWEIF=0; psMid.emit(x,y,z,vx,vy,vz,c[0]*0.32,c[1]*0.32,c[2]*0.32,tA*rand(1.2,1.6),6,0); } }},
  /* Kamuro: dunkelgoldene Faeden, sinken langsam (g 1,65 = 1,5 m/s), lange
     Spur; wer unten ankommt, glimmt dort 1 s */
  kamuro:{g:1.65,emit(x,y,z,vx,vy,vz,c,tA,e){ const ph=e&&e.ph||{}; SCHWEIF=(ph.fadenLaenge||1.1)/1.2;
    const yb=fkBoden(x,z), life=tA+Math.max(0.5,(y+(e&&e.hAkt||4)-yb)/1.5)+rand(-0.3,0.4);
    psMid.emit(x,y,z,vx,vy,vz,c[0]*0.95,c[1]*0.72,c[2]*0.3,life,1.65,2,c[0]*0.45,c[1]*0.26,c[2]*0.06);
    const q=bahnOrt({x,y,z},[vx,vy,vz],1.65,life);
    if(q.y<yb+0.6) imBild(life-0.02,()=>{ const a=SCHWEIF; SCHWEIF=0; psMid.emit(q.x,yb+0.02,q.z,0,0,0,0.55,0.3,0.06,1.0,0,0); SCHWEIF=a; }); }},
  /* Knister: Mikrosterne, die zufaellig weiss aufplatzen */
  knister:{g:6,emit(x,y,z,vx,vy,vz,c,tA){ SCHWEIF=0;
    psMid.emit(x,y,z,vx,vy,vz,c[0],c[1],c[2],tA*rand(0.95,1.35),6,3); }}
};
/* Ein Funkenstrahl aus Duese p in Richtung d: Hoehe h (senkrecht),
   Kegel kg (rad), rate je s, Material, Farben A/B mit Anteil mb.
   schl: eigener Zaehler je Strahl. Rueckgabe: Steigzeit. */
function fkStrahl(e,dt,p,d,h,kg,rate,mat,A,B,mb,schl){
  const M=FUNKE[mat]||FUNKE.kohle, dy=Math.max(0.35,d[1]), v0=fkV0(h,M.g)/dy, tA=fkTA(v0*dy,M.g), alt=SCHWEIF;
  for(let n=fkJe(e,schl||'aS',rate,dt);n>0;n--){ const r=fkKegel(d,kg), w=v0*rand(0.86,1.0), c=mb&&Math.random()<mb?B:A;
    M.emit(p.x,p.y,p.z,r[0]*w,r[1]*w,r[2]*w,c,tA,e); }
  SCHWEIF=alt; return tA;
}

/* ---------- 3. Emitter ---------- */
/* gerb: die parametrische Zylinderfontaene. Felder: hm/hKurve/hStufen,
   kegel (Grad, Std. 10), dichte (je s), funke, A/B/mischB, sterne:'B'
   (3-5 Farbsterne/s ohne Schweif), krone:{funke,A} (zweite Ebene oben),
   basis:'<farbe>' (Leuchtbasis), kernB, knisterLeise, dunkel (s ohne
   Funken am Anfang, nach einem Zauberpuff) */
NEU_EMIT.gerb=(e,dt,o)=>{
  const ph=e.ph, q=QUAL(), h=Math.max(0.2,e.hAkt||2), st=e.staerke, mat=ph.funke||'kohle';
  if(ph.basis) fkBasis(e,dt,o,farbe(ph.basis)||FW.rot,1);
  fkKlang(e,o,dt);
  if(ph.dunkel&&e.alter<ph.dunkel) return;
  const kg=((e.kegelAkt!==undefined?e.kegelAkt:ph.kegel)||10)*Math.PI/180, d=e.dir||[0,1,0];
  const rate=(e.dichteAkt||Math.min(620,170+42*h))*q*st, p={x:o.x,y:o.y+0.05,z:o.z};
  fkStrahl(e,dt,p,d,h,kg,ph.kernB?rate*0.75:rate,mat,e.A,e.B,ph.mischB||0,'aS');
  /* Kern in B: enger, etwas hoeher */
  if(ph.kernB) fkStrahl(e,dt,p,d,h*1.05,kg*0.3,rate*0.3,'titan',e.B,e.B,0,'aK');
  /* Farbsterne ohne Schweif, die in Fontaenenhoehe verloeschen */
  if(ph.sterne==='B'){ const alt=SCHWEIF; SCHWEIF=0;
    for(let n=fkJe(e,'aSt',rand(3,5)*st,dt);n>0;n--){ const r=fkKegel(d,kg*0.8), w=fkV0(h*rand(0.6,0.95),6);
      psBig.emit(p.x,p.y,p.z,r[0]*w,r[1]*w,r[2]*w,e.B[0]*1.2,e.B[1]*1.2,e.B[2]*1.2,fkTA(w,6)*rand(0.95,1.1),6,0); }
    SCHWEIF=alt; }
  /* Krone: zweite Ebene an der Spitze in eigenem Material */
  if(ph.krone&&ph.krone.funke){ const K2=FUNKE[ph.krone.funke]||FUNKE.brokat, c=farbe(ph.krone.A)||FW.gold, alt=SCHWEIF;
    for(let n=fkJe(e,'aKr',150*q*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, w=rand(1.5,3.2);
      K2.emit(o.x+rand(-0.15,0.15),o.y+h*rand(0.86,0.98),o.z+rand(-0.15,0.15),Math.cos(a)*w,rand(0.5,2.2),Math.sin(a)*w,c,0.6,e); }
    SCHWEIF=alt; }
  /* Titan knackt ab und zu leise; knisterLeise knistert dauernd leise */
  const kn=(mat==='titan'?0.7:0)+(ph.knisterLeise?5*ph.knisterLeise:0);
  for(let n=fkJe(e,'aKn',kn*st,dt);n>0;n--) knisterPop(o.x+rand(-0.4,0.4)*h*0.08,o.y+h*rand(0.55,0.98),o.z+rand(-0.4,0.4)*h*0.08,{laut:0.25,funken:6});
  if(mat==='knister') for(let n=fkJe(e,'aKw',28*q*st,dt);n>0;n--) knisterPop(o.x+rand(-0.5,0.5),o.y+h*rand(0.6,1.0),o.z+rand(-0.5,0.5),{laut:0.35});
};
/* Leuchtbasis: farbige Flammenkugel (0,4 m) direkt ueber der Duese,
   flackert 6-10 Hz und faerbt den Boden (Dauerlicht aus dem lichtPool) */
function fkBasis(e,dt,o,c,gross){
  const st=e.staerke, y=o.y+0.18*gross, alt=SCHWEIF; SCHWEIF=0;
  e.fb=(e.fb||0)+dt*rand(6,10)*Math.PI*2; const fl=0.75+0.25*Math.sin(e.fb);
  for(let n=fkJe(e,'aB',16*gross*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, r=rand(0,0.12)*gross;
    psHuge.emit(o.x+Math.cos(a)*r,y,o.z+Math.sin(a)*r,Math.cos(a)*0.15,rand(0.2,0.5),Math.sin(a)*0.15,c[0]*1.25*fl,c[1]*1.25*fl,c[2]*1.25*fl,rand(0.35,0.6),-0.4,0); }
  for(let n=fkJe(e,'aB2',40*gross*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, r=rand(0,0.18)*gross;
    psBig.emit(o.x+Math.cos(a)*r,y+rand(-0.08,0.1),o.z+Math.sin(a)*r,0,rand(0.1,0.4),0,c[0]*fl,c[1]*fl,c[2]*fl,rand(0.2,0.4),-0.3,4); }
  SCHWEIF=alt;
  licht('fkB'+fkId(e),{x:o.x,y:y+0.1,z:o.z},c,2.5*st*fl*gross,{boden:fkBoden(o.x,o.z),weite:8});
}

/* torte mit kalt/diamant (Eissterne): Kaltfunken, die auf halber
   Fallhoehe verloeschen - unten kommt nichts an; im Zeitfenster diamant
   blitzen 30 % im Scheitel einmal weiss auf. Ohne die Optionen bleibt
   torte wie bisher (Shows, Nebenrolle). */
const FK_TORTE=NEU_EMIT.torte;
NEU_EMIT.torte=(e,dt,o)=>{
  if(!e.font||!e.ph||!e.ph.kalt) return FK_TORTE(e,dt,o);
  const ph=e.ph, h=Math.max(0.1,e.hAkt||0.5), st=e.staerke, v0=fkV0(h,6), tA=fkTA(v0,6), alt=SCHWEIF;
  const tf=Math.sqrt(h/6), life=tA+tf*0.9, dm=ph.diamant&&e.u>=ph.diamant[0]&&e.u<=ph.diamant[1];
  SCHWEIF=0.05;
  for(let n=fkJe(e,'aT',240*QUAL()*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, s=rand(0.05,0.32)*Math.sqrt(h/0.5), c=Math.random()<0.5?e.A:e.B;
    const vx=Math.cos(a)*s, vz=Math.sin(a)*s, vy=v0*rand(0.85,1);
    if(dm&&Math.random()<0.3) glint(psSmall,o.x,o.y+0.05,o.z,vx,vy,vz,c,6,{tz:tA*rand(0.85,1.05),dim:0.8,blitz:3.2,blitzFarbe:[1,1,1],glimm:0.5,rest:tf*0.5});
    else psSmall.emit(o.x,o.y+0.05,o.z,vx,vy,vz,c[0]*1.1,c[1]*1.1,c[2]*1.15,life*rand(0.85,1),6,0); }
  SCHWEIF=alt;
  /* ganz leises Zischen, kein Rauch */
  e.kl=(e.kl||0)-dt; if(e.kl<=0&&!e.nr){ e.kl=rand(0.6,1.0); sfx.zischen(distVol(o)*0.3*st,0.7); }
};

/* hoerner (Feuerteufel): zwei Strahlen aus einer Duese, +/- spreiz Grad
   quer zum Blick; Kohlefunken, die zur Spitze rot werden, und je Horn
   eine rote Flammenzunge auf 90 % Hoehe. Der Winkel dreht sich weich. */
NEU_EMIT.hoerner=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), q=QUAL(), st=e.staerke, h=Math.max(0.2,e.hAkt||1.5);
  const ziel=(ph.spreiz||0)*Math.PI/180; if(Z.sp===undefined) Z.sp=ziel; Z.sp+=(ziel-Z.sp)*Math.min(1,dt*5.5);
  fkKlang(e,o,dt);
  e.kohleB=e.B; const p={x:o.x,y:o.y+0.04,z:o.z};
  Z.spitzen=Z.spitzen||[];
  for(const s of [-1,1]){ const a=Z.sp*s, d=[Math.sin(a),Math.cos(a),0];
    fkStrahl(e,dt,p,d,h,0.06,190*q*st,ph.funke||'kohle',e.A,e.B,ph.mischB||0,s<0?'hL':'hR');
    const tx=o.x+Math.sin(a)*h*0.62, ty=o.y+h*0.9; Z.spitzen[s<0?0:1]={x:tx,y:ty,z:o.z};
    /* Flammenzunge an der Spitze */
    if(h>0.5){ const alt=SCHWEIF, B=e.B; SCHWEIF=0;
      for(let n=fkJe(e,s<0?'fL':'fR',14*st,dt);n>0;n--) psHuge.emit(tx+rand(-0.06,0.06),ty,o.z,Math.sin(a)*0.4,rand(0.3,0.8),0,B[0]*1.3,B[1]*0.9,B[2]*0.6,rand(0.2,0.38),-0.8,0);
      SCHWEIF=alt; } }
  licht('fkH'+fkId(e),{x:o.x,y:o.y+h*0.5,z:o.z},FW.orange,1.2*st*Math.min(1,h/1.5),{boden:fkBoden(o.x,o.z),weite:7});
  /* Teufelslachen: ha - ha - ha, drei Knisterstoesse an beiden Spitzen */
  if(e.lachen&&!e.gelacht){ e.gelacht=true; const v=distVol(o);
    for(let i=0;i<3;i++) later(0.1+i*0.35,()=>{
      for(const t of Z.spitzen) if(t){ knisterWolke(t,20+i*4,0.14,0.28,{laut:0.5+i*0.25}); flash(t,FW.rot,1.2+i*0.6,0.12); }
      sfx.crackle(v*(0.7+i*0.35)); }); }
};

/* gummiperlen (Gummibaerchen): niedrige Silberfontaene und weiche
   Neon-Kleckse, die einen Bogen fliegen, auf dem Boden EINMAL huepfen,
   kurz aufleuchten und ausgluehen */
function fkKlecks(o,c,h,seitlich){
  const a=Math.random()*Math.PI*2, w=rand(0.3,1.2)*(seitlich||1), v0=fkV0(h*rand(0.8,1.05),6)*0.78, cc=[Math.min(1.6,c[0]*1.35),Math.min(1.6,c[1]*1.35),Math.min(1.6,c[2]*1.35)];
  fuehre(psHuge,o.x,o.y+0.1,o.z,Math.cos(a)*w,v0,Math.sin(a)*w,cc,4,(s,dt)=>{
    const v=s.v, d=s.d;
    if(d.liegt!==undefined){ s.hell=Math.max(0,1-(s.alter-d.liegt)/0.5)*2.2; if(s.alter-d.liegt>0.5) return false; return; }
    v[1]-=6*dt; s.p[0]+=v[0]*dt; s.p[1]+=v[1]*dt; s.p[2]+=v[2]*dt;
    s.hell=Math.min(2.5,1/Math.max(0.3,1-s.alter/s.life));
    const yb=fkBoden(s.p[0],s.p[2])+0.05;
    if(s.p[1]<=yb&&v[1]<0){ s.p[1]=yb;
      if(!d.hops){ d.hops=1; v[1]=-v[1]*0.35; v[0]*=0.7; v[2]*=0.7;
        /* platt: zwei Seitenpunkte fuer 0,1 s, dazu ein leises Blubb */
        const alt=SCHWEIF; SCHWEIF=0;
        for(const k of [-1,1]) psBig.emit(s.p[0]+k*0.06,yb,s.p[2],k*0.6,0,0,cc[0],cc[1],cc[2],0.1,0,0);
        SCHWEIF=alt; const q={x:s.p[0],y:yb,z:s.p[2]}; schall(q,vv=>sfx.plopp(vv*0.3,0.8)); }
      else { d.liegt=s.alter; v[0]=v[1]=v[2]=0; } }
  },{spur:0});
}
NEU_EMIT.gummiperlen=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||1.6;
  fkKlang(e,o,dt);
  fkStrahl(e,dt,{x:o.x,y:o.y+0.03,z:o.z},[0,1,0],0.6,0.18,80*q*st,'titan',FW.silber,FW.weiss,0.3,'gU');
  for(let n=fkJe(e,'gK',(ph.rate||4)*st,dt);n>0;n--) fkKlecks(o,e.A,h);
  licht('fkG'+fkId(e),{x:o.x,y:o.y+0.4,z:o.z},e.A,1.0*st,{boden:fkBoden(o.x,o.z),weite:5});
};

/* bodenring (Feuerkreis): spruehet 360 Grad flach; der Funkenring hat den
   Radius radius ([von,bis] ueber die Phase) und atmet mit atmen Hz;
   huepfer: am Rand springen Funken kurz flach auf */
NEU_EMIT.bodenring=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), alt=SCHWEIF;
  fkKlang(e,o,dt);
  let R=bereich(ph.radius||1.5,e.u); if(ph.atmen) R*=1+0.18*Math.sin(e.alter*Math.PI*2*ph.atmen);
  /* Zeit bis zum Rand ~0,55 s: R = w*cos(hb)/k*(1-e^-kT) */
  const hb=(ph.hebung||6)*Math.PI/180, T=0.55, f=(1-Math.exp(-ZIEH*T))/ZIEH, w=R/(Math.cos(hb)*f), y=o.y+0.05;
  SCHWEIF=0.3;
  for(let n=fkJe(e,'rS',320*q*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, ww=w*rand(0.92,1.04), c=Math.random()<0.35?e.B:e.A;
    psMid.emit(o.x,y,o.z,Math.cos(a)*Math.cos(hb)*ww,Math.sin(hb)*ww,Math.sin(a)*Math.cos(hb)*ww,c[0],c[1]*0.92,c[2]*0.8,T*rand(0.95,1.1),3,2,c[0]*0.7,c[1]*0.25,c[2]*0.05); }
  /* Glutsaum am Rand und Huepfer */
  SCHWEIF=0;
  for(let n=fkJe(e,'rR',(ph.huepfer?90:40)*q*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, r=R*rand(0.93,1.05);
    psMid.emit(o.x+Math.cos(a)*r,y-0.03,o.z+Math.sin(a)*r,Math.cos(a)*0.4,ph.huepfer?rand(0.8,1.6):0.1,Math.sin(a)*0.4,1,0.62,0.18,rand(0.2,0.4),5,4); }
  for(let n=fkJe(e,'rM',10*st,dt);n>0;n--) psHuge.emit(o.x,y,o.z,0,0.1,0,0.9,0.35,0.05,0.4,0,0);
  SCHWEIF=alt;
  licht('fkR'+fkId(e),{x:o.x,y:y+0.3,z:o.z},FW.orange,1.6*st,{boden:fkBoden(o.x,o.z),weite:Math.max(4,R*3)});
};

/* lava (Feuerberg): grollen = Kraterglut, Rauch, Wummern; auswurf =
   schwere Lavabrocken, die aufschlagen und als Pfuetzen 3 s von Orange
   nach Dunkelrot abkuehlen und dampfen; ausbruch = stoss Brocken auf einmal.
   Hoechstens 30 Pfuetzen zugleich. */
const FK_LAVA={n:0};
function fkBrocken(o,A,B,hSpanne,weite){
  const h=Array.isArray(hSpanne)?rand(hSpanne[0],hSpanne[1]):hSpanne, a=Math.random()*Math.PI*2, w=rand(0.4,1.1)*(weite||1)*Math.sqrt(h/3), c=Math.random()<0.6?A:B;
  const cc=[c[0]*1.3,c[1]*1.05,c[2]*0.8], v0=fkV0(h,6)*0.8;
  fuehre(psHuge,o.x,o.y+0.1,o.z,Math.cos(a)*w,v0,Math.sin(a)*w,cc,5,(s,dt)=>{
    const v=s.v; v[1]-=7*dt; s.p[0]+=v[0]*dt; s.p[1]+=v[1]*dt; s.p[2]+=v[2]*dt;
    s.hell=Math.min(2,1/Math.max(0.3,1-s.alter/s.life));
    const yb=fkBoden(s.p[0],s.p[2]);
    if(s.p[1]<=yb+0.03&&v[1]<0){ const x=s.p[0], z=s.p[2], y=yb+0.03;
      s.ps.life[s.i]=0.01;
      if(FK_LAVA.n<30){ FK_LAVA.n++; later(3.2,()=>{ FK_LAVA.n--; });
        const alt=SCHWEIF; SCHWEIF=0;
        psHuge.emit(x,y,z,0,0,0,1.3,0.55,0.08,3.2,0,2,0.45,0.03,0.0);
        for(let k=0;k<4;k++){ const b=Math.random()*Math.PI*2, r=rand(0.08,0.2); psBig.emit(x+Math.cos(b)*r,y,z+Math.sin(b)*r,0,0,0,1,0.4,0.05,rand(2.2,3),0,2,0.3,0.02,0); }
        SCHWEIF=alt;
        rauchball({x,y:y+0.2,z},{r:0.2,n:1,dauer:1.6,steigen:0.5,c:[0.55,0.52,0.5],a:0.28});
        schall({x,y,z},vv=>{ sfx.plopp(vv*0.35,0.55); sfx.zischen(vv*0.25,0.35); }); }
      return false; }
  },{spur:0.12});
}
NEU_EMIT.lava=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), m=ph.modus||'auswurf', A=e.A, B=e.B, alt=SCHWEIF;
  if(!e.font) e.alter=(e.alter||0)+dt;
  fkKlang(e,o,dt);
  /* Kraterglut pulsiert mit 1 Hz */
  const puls=0.7+0.3*Math.sin(e.alter*Math.PI*2);
  licht('fkL'+fkId(e),{x:o.x,y:o.y+0.3,z:o.z},FW.rot,(m==='grollen'?1.5:2.2)*puls*st,{boden:fkBoden(o.x,o.z),weite:9});
  SCHWEIF=0;
  for(let n=fkJe(e,'lG',12*st,dt);n>0;n--) psHuge.emit(o.x+rand(-0.08,0.08),o.y+0.06,o.z+rand(-0.08,0.08),0,rand(0.05,0.2),0,0.95*puls,0.22*puls,0.03,rand(0.4,0.7),0,0);
  if(m==='grollen'){
    for(let n=fkJe(e,'lF',2.5*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2; psMid.emit(o.x,o.y+0.1,o.z,Math.cos(a)*0.6,rand(2,3.5),Math.sin(a)*0.6,1,0.45,0.08,rand(0.8,1.2),6,2,0.5,0.05,0); }
    if(e.font){ e.rb=(e.rb||0)-dt; if(e.rb<=0){ e.rb=1.1; rauchball({x:o.x,y:o.y+0.4,z:o.z},{r:0.35,n:2,dauer:2.6,steigen:0.45,c:[0.3,0.26,0.25],a:0.35}); } }
  } else {
    if(ph.unterbau){ const u=ph.unterbau; e.kohleB=FW.rot; fkStrahl(e,dt,{x:o.x,y:o.y+0.05,z:o.z},[0,1,0],u.hm||1.5,0.2,160*q*st,u.funke||'kohle',FW.orange,FW.gold,0.3,'lU'); }
    if(m==='ausbruch'&&!e.stoss){ e.stoss=true; const v=distVol(o), hm=typeof ph.hm==='number'?ph.hm:4.5;
      for(let i=0;i<(ph.stoss||12);i++) fkBrocken(o,A,B,[hm*0.6,hm],1.4);
      flash({x:o.x,y:o.y+1,z:o.z},FW.orange,3,0.35); sfx.boom(v*0.5); sfx.fauchen(v,1.2,true); }
    const r=bereich(ph.rate||(m==='ausbruch'?2:4),e.u);
    for(let n=fkJe(e,'lB',r*st,dt);n>0;n--) fkBrocken(o,A,B,ph.hm||[2,4],1);
  }
  SCHWEIF=alt;
};

/* bluetenwerfer (Bluetenbrunnen): Unterbau-Fontaene, dazu Sterne, die in
   60-90 % der Hoehe leise zu Mini-Chrysanthemen aufplatzen (nie darueber) */
NEU_EMIT.bluetenwerfer=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||2.5, bl=ph.bluete||{}, c=farbe(bl.farbe)||e.B, alt=SCHWEIF;
  fkKlang(e,o,dt);
  fkStrahl(e,dt,{x:o.x,y:o.y+0.05,z:o.z},[0,1,0],h,0.16,250*q*st,ph.funke||'titan',e.A,e.A,0,'bU');
  for(let n=fkJe(e,'bS',bereich(bl.rate||3,e.u)*st,dt);n>0;n--){
    const hb=h*rand(0.6,0.9), d=fkKegel([0,1,0],0.26), w=fkV0(hb,6)/Math.max(0.5,d[1]), tA=fkTA(w*d[1],6), p={x:o.x,y:o.y+0.05,z:o.z}, v=[d[0]*w,d[1]*w,d[2]*w];
    SCHWEIF=0.12;
    if(bl.art==='perle'){ psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*1.2,c[1]*1.2,c[2]*1.2,tA*rand(1.1,1.35),6,0); continue; }
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0],c[1],c[2],tA,6,0);
    imBild(tA,()=>{ const b=bahnOrt(p,v,6,tA), reis=bl.art==='reis', n2=Math.round((bl.funken||15)*q), gr=reis?1.2:2.1, a2=SCHWEIF;
      SCHWEIF=reis?0:0.14;
      for(let k=0;k<n2;k++){ const dd=randDir(), s=gr*rand(0.8,1.1);
        (reis?psSmall:psMid).emit(b.x,b.y,b.z,dd[0]*s,dd[1]*s,dd[2]*s,c[0],c[1],c[2],reis?rand(0.2,0.35):rand(0.5,0.7),2.5,reis?0:4); }
      psBig.emit(b.x,b.y,b.z,0,0,0,1.2,1.2,1.2,0.05,0,0); SCHWEIF=a2;
      if(!reis||Math.random()<0.25) schall(b,vv=>sfx.plopp(vv*0.18,2.2)); }); }
  SCHWEIF=alt;
};

/* popcorn (Popcorn): kleiner Kohlekegel je Duese, Knallsterne nach
   knallKurve (Zeit -> Knall/s, auf die Duesen verteilt); jeder Knall
   laesst ein weisses Woelkchen stehen */
function fkKorn(o,hk,wk){
  const h=Array.isArray(hk)?rand(hk[0],hk[1]):(hk||2), w=fkV0(h,6), tA=fkTA(w,6), p={x:o.x,y:o.y+0.05,z:o.z}, a=Math.random()*Math.PI*2, s=rand(0,0.5), v=[Math.cos(a)*s,w,Math.sin(a)*s], alt=SCHWEIF;
  SCHWEIF=0.08; psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],1.2,1.1,0.8,tA,6,0); SCHWEIF=alt;
  imBild(tA,()=>{ const b=bahnOrt(p,v,6,tA), a2=SCHWEIF; SCHWEIF=0;
    psHuge.emit(b.x,b.y,b.z,0,0,0,2,2,2,0.05,0,0);
    for(let k=0;k<6;k++){ const d=randDir(); psMid.emit(b.x,b.y,b.z,d[0]*3,d[1]*3,d[2]*3,1,0.9,0.6,rand(0.2,0.35),3,0); }
    SCHWEIF=a2;
    rauchball({x:b.x,y:b.y,z:b.z},{r:0.18,n:2,dauer:(wk||0.8)+0.6,quellen:0.15,steigen:0.05,wind:[0.05,0],c:[0.95,0.95,0.93],a:0.7,leuchten:true,farbe:t=>t<0.12?[1.4,1.4,1.3]:[0.5,0.5,0.52]});
    schall(b,vv=>sfx.crack(vv*rand(0.5,0.8))); });
}
NEU_EMIT.popcorn=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), n=DUESEN_STD.reihe3.length;
  if(ph.nachzuegler){ if(!e.los){ e.los=true; fkKorn(o,2.4,1.2); } return; }
  fkStrahl(e,dt,{x:o.x,y:o.y+0.04,z:o.z},[0,1,0],(e.hAkt||1.5)*(0.9+0.12*Math.sin(e.alter*2+e.nr)),0.3,150*q*st,'kohle',e.A,FW.orange,0.25,'pU');
  fkKlang(e,o,dt);
  /* Knall-Rate aus der Kurve (Stuetzpunkte [t, Knall/s]) */
  const K=ph.knallKurve||[[0,2]], t=e.alter; let r=K[K.length-1][1];
  for(let i=1;i<K.length;i++) if(t<K[i][0]){ const [t0,r0]=K[i-1], [t1,r1]=K[i]; r=r0+(r1-r0)*clamp((t-t0)/Math.max(0.001,t1-t0),0,1); break; }
  for(let k=fkJe(e,'pK',r/n,dt);k>0;k--) fkKorn(o,ph.knallHoehe||[1.5,3],ph.woelkchen);
};

/* saxon (Drehsonne): Radscheibe 0,4 m auf 1 m Hoehe mit zwei Treibern und
   farbiger Nabe; Drehrichtung dreh, Drehzahl ups (Rampe); stottern: Rad
   steht, Funken setzen aus; beide: beide Treiber; rand:'knister' */
const FK_MAT={};
function fkMat(c,em){ const k=c+'|'+(em||0); return FK_MAT[k]||(FK_MAT[k]=new THREE.MeshStandardMaterial({color:c,roughness:0.8,emissive:em||0})); }
function fkRadDeko(Z,o,dauer){
  if(Z.rad) return; const g=new THREE.Group();
  const stab=new THREE.Mesh(new THREE.BoxGeometry(0.04,1.0,0.04),fkMat(0x6b4a2a)); stab.position.set(0,-0.5,-0.03); g.add(stab);
  const scheibe=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.03,20),fkMat(0x2a2320,0x140800)); scheibe.rotation.x=Math.PI/2; g.add(scheibe);
  for(const s of [-1,1]){ const h=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.16,8),fkMat(0xb03020)); h.position.set(s*0.2,0,0.02); g.add(h); }
  g.position.set(o.x,o.y+1.0,o.z+0.05); scene.add(g); Z.rad=g;
  later(dauer+1.5,()=>{ scene.remove(g); Z.rad=null; });
}
NEU_EMIT.saxon=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), c0={x:o.x,y:o.y+1.0,z:o.z+0.08};
  if(!Z.rad&&FONT[e.prod]) fkRadDeko(Z,o,fontDauer(FONT[e.prod])-e.alter);
  const ziel=(ph.dreh||0)*bereich(ph.ups===undefined?3:ph.ups,e.u)*Math.PI*2;
  Z.om=Z.om===undefined?ziel:Z.om+(ziel-Z.om)*Math.min(1,dt*(ph.stottern?7:1.6));
  Z.w=(Z.w||0)+Z.om*dt; if(Z.rad) Z.rad.rotation.z=Z.w;
  fkKlang(e,o,dt,Math.min(1,0.4+Math.abs(Z.om)/30));
  /* Nabe: farbige Flammenkugel */
  const nb=farbe(ph.nabe)||FW.rot, alt=SCHWEIF; SCHWEIF=0;
  for(let n=fkJe(e,'sN',14*st,dt);n>0;n--) psHuge.emit(c0.x+rand(-0.04,0.04),c0.y+rand(-0.04,0.04),c0.z+0.03,0,rand(0.05,0.2),0,nb[0]*1.2,nb[1]*1.2,nb[2]*1.2,rand(0.25,0.4),-0.2,0);
  SCHWEIF=alt;
  licht('fkS'+fkId(e),c0,nb,1.8*st,{boden:fkBoden(o.x,o.z),weite:7});
  /* Stottern: Aussetzer und zwei kurze Zischer */
  if(ph.stottern){ if(!e.zz){ e.zz=true; const v=distVol(o); sfx.zischen(v*0.6,0.12); later(0.3,()=>sfx.zischen(v*0.6,0.15)); }
    if(e.alter<0.3||(e.alter>0.42&&e.alter<0.5)) return; }
  const R=0.2, dreh=Math.sign(Z.om)||ph.dreh||1, M=FUNKE[ph.funke||'kohle'], treiber=ph.beide?[0,Math.PI]:[0], tan=Math.abs(Z.om)*R;
  for(const off of treiber){ const a=Z.w+off, px=c0.x+Math.cos(a)*R, py=c0.y+Math.sin(a)*R;
    /* Tangente in Drehrichtung; die Funken treten nach hinten aus */
    const tx=-Math.sin(a)*dreh, ty=Math.cos(a)*dreh;
    for(let n=fkJe(e,'sT'+off,(ph.beide?210:260)*q*st,dt);n>0;n--){ const s=rand(4,6.5), c=ph.B&&Math.random()<0.4?e.B:e.A, sx=rand(-0.5,0.5);
      M.emit(px,py,c0.z,-tx*s+tx*tan+sx*0.3,-ty*s+ty*tan+sx*0.3,rand(-0.3,0.3),c,0.55,e); } }
  if(ph.rand==='knister') for(let n=fkJe(e,'sK',40*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2; knisterPop(c0.x+Math.cos(a)*1.5,c0.y+Math.sin(a)*1.5,c0.z,{laut:0.3,funken:5}); }
};

/* farbstrahl (Farbmischer): enger, dichter Strahl in reiner Farbe; Duese
   um neig Grad Richtung azi geneigt; farbiges Licht am Fuss. Additiv: wo
   sich Rot und Gruen kreuzen, wird es gelb, mit Blau weiss. */
NEU_EMIT.farbstrahl=(e,dt,o)=>{
  const st=e.staerke, q=QUAL(), h=e.hAkt||4, d=e.dir||[0,1,0], A=e.A, alt=SCHWEIF;
  fkKlang(e,o,dt);
  const v0=fkV0(h,6)/Math.max(0.5,d[1]), tA=fkTA(v0*d[1],6);
  SCHWEIF=0.1;
  for(let n=fkJe(e,'fS',400*q*st,dt);n>0;n--){ const r=fkKegel(d,0.09), w=v0*rand(0.9,1.0);
    psMid.emit(o.x,o.y+0.05,o.z,r[0]*w,r[1]*w,r[2]*w,A[0],A[1],A[2],tA*rand(1.2,1.6),6,0); }
  SCHWEIF=alt;
  licht('fkF'+fkId(e),{x:o.x,y:o.y+0.5,z:o.z},A,1.8*st,{boden:fkBoden(o.x,o.z),weite:7});
};

/* wasserorgel (Wasserorgel): steuert alle Duesen des Produkts; die Hoehe
   je Duese ist eine Funktion der Zeit (figur). Nachschub folgt mit 0,15 s
   Reaktionszeit, Perlen in B. Kein Links-rechts-Schwenk. */
function fkOrgelSoll(ph,t,i,n,dx,T){
  const [lo,hi]=Array.isArray(ph.hm)?ph.hm:[1,ph.hm||4], f=ph.figur, rang=Math.abs(dx)>0.3?1:0;
  if(f==='atmen') return lo+(hi-lo)*(0.5+0.5*Math.sin(t*Math.PI*2*(ph.hz||0.6)-Math.PI/2));
  if(f==='welle'){ const k=ph.von==='mitte'?rang:1-rang; return lo+(hi-lo)*(0.5+0.5*Math.sin((t/T)*Math.PI*2*(ph.wellen||2)-k*1.6-Math.PI/2)); }
  if(f==='kolben') return Math.floor(t/(ph.wechselAlle||0.7))%2===rang?hi:lo;
  if(f==='kanon'){ const folge=[0,n-1,1,n-2], pos=folge.indexOf(i), ab=ph.abstand||0.5, per=ab*n, tt=((t-pos*ab)%per+per)%per;
    return t<pos*ab?lo:tt<0.55?lo+(hi-lo)*Math.sin(tt/0.55*Math.PI/2):lo+(hi-lo)*Math.max(0,1-(tt-0.55)/0.6); }
  if(f==='alle'){ if(T-t<0.4) return 0; return lo+(hi-lo)*bereich(ph.hKurve||[0,1],t/T); }
  return hi;
}
NEU_EMIT.wasserorgel=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), D=e.duesen||[-0.45,-0.15,0.15,0.45], n=D.length;
  Z.h=Z.h||D.map(()=>0.5);
  let summe=0;
  D.forEach((dx,i)=>{ const soll=fkOrgelSoll(ph,e.alter,i,n,dx,e.dauer);
    Z.h[i]=soll<=0?0:Z.h[i]+(soll-Z.h[i])*Math.min(1,dt/0.15); summe+=Z.h[i];
    if(Z.h[i]<0.15) return;
    const p=versetzt(o,dx,0);
    fkStrahl(e,dt,p,[0,1,0],Z.h[i],0.07,(110+28*Z.h[i])*q*st,ph.funke||'titan',e.A,FW.weiss,0.2,'w'+i);
    /* tuerkise Perlen, 2/s je Duese */
    for(let k=fkJe(e,'wp'+i,2*st,dt);k>0;k--){ const w=fkV0(Z.h[i]*rand(0.8,1),6), c=e.B, a=SCHWEIF; SCHWEIF=0.15;
      psBig.emit(p.x,p.y+0.05,p.z,rand(-0.2,0.2),w,rand(-0.2,0.2),c[0]*1.2,c[1]*1.2,c[2]*1.2,fkTA(w,6)*1.5,6,0); SCHWEIF=a; } });
  e.lautAkt=clamp(summe/(n*3.5),0.2,1.4); fkKlang(e,o,dt);
  licht('fkO'+fkId(e),{x:o.x,y:o.y+1.2,z:o.z},e.B,1.2*st*clamp(summe/(n*3),0.3,1.2),{boden:fkBoden(o.x,o.z),weite:9});
};

/* niagara (Niagara): zwei Pfosten und ein Draht (Deko); an duesen Punkten
   des Drahts spruehet Silber nach unten, der Vorhang faellt bis auf den
   Tisch und spritzt dort leicht auf. Breite 2,4 m statt 4 m: so breit ist
   der Zuendtisch - der Vorhang deckt keine Nachbarstation zu. */
function fkLeine(Z,o,hoch,breite,dauer){
  if(Z.leine) return; const g=new THREE.Group(), m=fkMat(0x7a7f86), top=o.y+hoch;
  for(const s of [-1,1]){ const x=o.x+s*breite/2, yb=fkBoden(x,o.z), L=top+0.2-yb;
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.025,L,6),m); p.position.set(x,yb+L/2,o.z); g.add(p); }
  const d=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,breite,4),fkMat(0x9aa0a8)); d.rotation.z=Math.PI/2; d.position.set(o.x,top,o.z); g.add(d);
  scene.add(g); Z.leine=g;
  later(dauer+2,()=>{ scene.remove(g); Z.leine=null; });
}
NEU_EMIT.niagara=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), H=ph.hoehe||3, Bt=ph.breite||2.4, N=ph.duesen||12, alt=SCHWEIF;
  if(!Z.leine&&FONT[e.prod]) fkLeine(Z,o,H,Bt,fontDauer(FONT[e.prod])-e.alter);
  fkKlang(e,o,dt);
  const dk=ph.dichteKurve?bereich(ph.dichteKurve,e.u):1, wind=ph.wind||0;
  SCHWEIF=0.13;
  for(let i=0;i<N;i++){
    /* ausduennen: von aussen nach innen gehen die Duesen aus */
    if(ph.ausduennen&&Math.min(i,N-1-i)/((N-1)/2)<e.u*1.05) continue;
    const x=o.x+(i/(N-1)-0.5)*Bt, y=o.y+H, fall=y-fkBoden(x,o.z);
    for(let n=fkJe(e,'n'+i,62*dk*q*st,dt);n>0;n--){ const vy=-rand(1,2), life=Math.max(0.3,(Math.sqrt(vy*vy+12*fall)+vy)/6)*1.08, c=Math.random()<0.4?e.B:e.A;
      psMid.emit(x+rand(-0.04,0.04),y,o.z+rand(-0.03,0.03),rand(-0.3,0.3)+wind,vy,rand(-0.3,0.3),c[0]*1.1,c[1]*1.1,c[2]*1.1,life,6,0); } }
  /* Spritzer am Boden */
  if(ph.spritzer){ SCHWEIF=0.05; const brt=ph.ausduennen?Bt*(1-e.u):Bt;
    for(let n=fkJe(e,'nS',140*q*st*(brt/Bt),dt);n>0;n--){ const x=o.x+rand(-0.5,0.5)*brt, yb=fkBoden(x,o.z);
      psSmall.emit(x,yb+0.02,o.z+rand(-0.1,0.1),rand(-0.6,0.6),rand(1.6,2.8),rand(-0.4,0.4),0.9,0.95,1,rand(0.2,0.35),8,0); } }
  SCHWEIF=alt;
  licht('fkN'+fkId(e),{x:o.x,y:o.y+H*0.5,z:o.z},FW.silber,1.4*st*dk,{boden:fkBoden(o.x,o.z),weite:10});
};

/* wendel (Wendeltreppe): geneigte Duese, die mit ups Umdrehungen/s
   kreist - die Funken behalten ihre Richtung, die Saeule steigt als
   Schraube; zweite: gegenlaeufige Duese in eigener Farbe (Doppelhelix);
   neigKurve: die Schraube oeffnet sich zum Trichter */
NEU_EMIT.wendel=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), h=e.hAkt||10, ng=e.neigAkt||0;
  fkKlang(e,o,dt);
  const ups=bereich(ph.ups===undefined?2:ph.ups,e.u); Z.phi=(Z.phi||0)+ups*Math.PI*2*dt;
  const D=[[Z.phi,e.A,e.B]]; if(ph.zweite){ const c=farbe(ph.zweite.A)||FW.tuerkis; D.push([-Z.phi+Math.PI,c,c]); }
  const p={x:o.x,y:o.y+0.05,z:o.z};
  D.forEach(([phi,A,B],i)=>{ const d=[Math.sin(ng)*Math.cos(phi),Math.cos(ng),Math.sin(ng)*Math.sin(phi)];
    fkStrahl(e,dt,p,d,h,0.035,(ph.zweite?300:480)*q*st,ph.funke||'titan',A,B,0.25,'wd'+i); });
};

/* lametta (Lametta): weiter Kegel aus Kamuro-Faeden, die oben haengen und
   langsam bis auf den Boden sinken; blaue Sterne sterneB/s dazwischen */
NEU_EMIT.lametta=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||6, kg=(e.kegelAkt||ph.kegel||40)*Math.PI/180, alt=SCHWEIF, p={x:o.x,y:o.y+0.05,z:o.z}, M=FUNKE.kamuro;
  fkKlang(e,o,dt);
  for(let n=fkJe(e,'lm',180*(ph.dichte||1)*q*st,dt);n>0;n--){
    /* flache Faeden fliegen weiter, nicht hoeher */
    const r=fkKegel([0,1,0],kg), hh=h*rand(0.8,1.0)*(0.55+0.45*r[1]), w=fkV0(hh,M.g)/Math.max(0.45,r[1]), tA=fkTA(w*r[1],M.g);
    M.emit(p.x,p.y,p.z,r[0]*w,r[1]*w,r[2]*w,e.A,tA,e); }
  if(ph.sterneB){ SCHWEIF=0; const c=e.B;
    for(let n=fkJe(e,'lS',ph.sterneB*st,dt);n>0;n--){ const r=fkKegel([0,1,0],kg*0.6), w=fkV0(h*rand(0.6,0.9),6);
      psBig.emit(p.x,p.y,p.z,r[0]*w,r[1]*w,r[2]*w,c[0]*1.3,c[1]*1.3,c[2]*1.3,fkTA(w*r[1],6)*rand(0.95,1.05),6,0); } }
  SCHWEIF=alt;
  licht('fkM'+fkId(e),{x:o.x,y:o.y+1,z:o.z},FW.gold,1.3*st,{boden:fkBoden(o.x,o.z),weite:9});
};

/* farbschichten (Feuersaeule): Riesen-Saeule; die Farbe an der Duese
   wechselt alle schub s zur naechsten aus folge (0,5 s weich); die Funken
   behalten ihre Startfarbe, die Schichten wandern nach oben. Gluehfarben
   von heissem Eisen, keine Zufallssterne. abkuehlen: dunkelt auf 30 %. */
NEU_EMIT.farbschichten=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||15, F=(ph.folge||['weiss']).map(c=>farbe(c)||FW.gold), sb=ph.schub||4;
  const j=Math.floor(e.alter/sb), a=F[Math.min(F.length-1,j)], b=F[Math.min(F.length-1,Math.max(0,j-1))], w=j>0?clamp((e.alter-j*sb)/0.5,0,1):1;
  let c=[b[0]+(a[0]-b[0])*w,b[1]+(a[1]-b[1])*w,b[2]+(a[2]-b[2])*w];
  if(ph.abkuehlen){ const k=1-0.7*e.u; c=[c[0]*k,c[1]*k,c[2]*k]; }
  fkKlang(e,o,dt);
  const v0=fkV0(h,6), tA=fkTA(v0,6), kg=7*Math.PI/180, alt=SCHWEIF, p={x:o.x,y:o.y+0.05,z:o.z};
  SCHWEIF=0.1;
  for(let n=fkJe(e,'fs',520*q*st,dt);n>0;n--){ const r=fkKegel([0,1,0],kg), vv=v0*rand(0.9,1.0);
    psMid.emit(p.x,p.y,p.z,r[0]*vv,r[1]*vv,r[2]*vv,c[0],c[1],c[2],tA+rand(1.0,1.5),6,4); }
  SCHWEIF=alt;
  licht('fkC'+fkId(e),{x:o.x,y:o.y+3,z:o.z},c,2.2*st,{boden:fkBoden(o.x,o.z),weite:14});
};

/* faecherwand (Feuerwand): fuenf Duesen, jede mit eigenem Winkel quer zum
   Blick; winkelKurve blendet zwischen zwei Winkelsaetzen, fluegel schlaegt
   zwischen zu und auf. Symmetrisch zur Mitte, kein Schwenk. */
NEU_EMIT.faecherwand=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), h=e.hAkt||6, D=e.duesen||DUESEN_STD.alle5, n=D.length;
  let W;
  if(ph.fluegel){ const F=ph.fluegel, per=1.3, t=e.alter, k=Math.floor(t/per), s=(t%per)/per;
    /* 0,65 s zu, 0,65 s auf, weich (Kosinus) */
    const u=k>=(F.schlaege||3)?1:0.5+0.5*Math.cos(s*Math.PI*2);
    W=F.auf.map((a,i)=>F.zu[i]+(a-F.zu[i])*u);
    if(k!==Z.schlag&&k<(F.schlaege||3)){ Z.schlag=k; later(0.65,()=>schall(o,v=>sfx.thump(v*0.45))); } }
  else if(ph.winkelKurve){ const [a,b]=ph.winkelKurve; W=a.map((x,i)=>x+(b[i]-x)*e.u); }
  else W=ph.winkel||D.map(()=>0);
  Z.w=Z.w||W.slice(); for(let i=0;i<n;i++) Z.w[i]+=(W[i]-Z.w[i])*Math.min(1,dt*9);
  fkKlang(e,o,dt);
  e.kohleB=e.B;
  for(let i=0;i<n;i++){ const a=Z.w[i]*Math.PI/180, d=[Math.sin(a),Math.cos(a),0], p=versetzt(o,D[i],0);
    fkStrahl(e,dt,p,d,h,0.05,170*q*st,ph.funke||'kohle',e.A,e.B,0.35,'fw'+i); }
  licht('fkW'+fkId(e),{x:o.x,y:o.y+2,z:o.z},FW.orange,2*st,{boden:fkBoden(o.x,o.z),weite:12});
};

/* ausbruch (Silberausbruch): Knister-Riesenfontaene mit breitem Kegel und
   einer Knisterwolke im Hoehenband wolke; rote und gruene Sterne darin.
   Start mit Druckstoss; knisterWellen: die Rate schwillt n-mal; abklingen. */
NEU_EMIT.ausbruch=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||22, kg=(ph.kegel||18)*Math.PI/180;
  if(!e.los&&!ph.abklingen){ e.los=true; const v=distVol(o); flash({x:o.x,y:o.y+6,z:o.z},FW.weiss,4,0.25); sfx.boom(v*0.45); if(typeof bildBlitz==='function') bildBlitz(0.25,0.2); }
  let k=1; if(ph.knisterWellen) k=0.55+0.45*Math.cos(e.u*Math.PI*2*ph.knisterWellen); if(ph.abklingen) k*=1-e.u;
  fkKlang(e,o,dt,k);
  const p={x:o.x,y:o.y+0.05,z:o.z}, alt=SCHWEIF;
  /* Saeule: Titan-Silber, darin Knister-Mikrosterne */
  fkStrahl(e,dt,p,[0,1,0],h,kg*0.5,340*q*st*(ph.abklingen?1-e.u:1),'titan',FW.silber,FW.weiss,0.3,'aT');
  fkStrahl(e,dt,p,[0,1,0],h*0.95,kg,420*q*st*k,'knister',FW.weiss,FW.weiss,0,'aK');
  /* Knisterwolke im Band, oben breiter (Blumenkohl) */
  const [w0,w1]=ph.wolke||[8,20], R=3.2;
  for(let n=fkJe(e,'aW',560*q*st*k,dt);n>0;n--){ const a=Math.random()*Math.PI*2, yy=rand(w0,w1), rr=R*Math.sqrt(Math.random())*(0.5+0.5*(yy-w0)/(w1-w0));
    knisterPop(o.x+Math.cos(a)*rr,o.y+yy,o.z+Math.sin(a)*rr,{laut:0.5,leise:Math.random()<0.6}); }
  /* rote und gruene Sterne ohne Schweif */
  const S=(ph.sterne||[]).map(c=>farbe(c)).filter(Boolean);
  if(S.length){ SCHWEIF=0;
    for(let n=fkJe(e,'aS',8*st*k,dt);n>0;n--){ const c=S[Math.floor(Math.random()*S.length)], rr=fkKegel([0,1,0],kg*0.8), w=fkV0(rand(w0,w1*0.95),6);
      psBig.emit(p.x,p.y,p.z,rr[0]*w,rr[1]*w,rr[2]*w,c[0]*1.3,c[1]*1.3,c[2]*1.3,fkTA(w*rr[1],6)+rand(0,0.5),6,0); } }
  SCHWEIF=alt;
  licht('fkA'+fkId(e),{x:o.x,y:o.y+8,z:o.z},FW.weiss,2.8*st*k,{boden:fkBoden(o.x,o.z),weite:25});
};

/* zerfall (Feuerkaskade): an jeder Duese reisst der Strahl ab; im oberen
   Drittel der Saeule entstehen brocken gluehende Brocken, die 3-8 m
   auseinanderfliegen und jeder fuer sich knistern (5-12 Pops ueber 1,5 s).
   Hoechstens 120 Brocken (3 x 40). */
NEU_EMIT.zerfall=(e,dt,o)=>{
  const ph=e.ph, q=QUAL();
  if(e.los) return; e.los=true;
  const n=Math.round((ph.brocken||40)*q), hs=ph.hm||12, [w0,w1]=ph.weite||[3,8], A=e.A, B=e.B, v=distVol(o), alt=SCHWEIF;
  if(!e.nr){ sfx.boom(v*0.8); flash({x:o.x,y:o.y+hs*0.8,z:o.z},FW.gold,4,0.3); shake=Math.max(shake,0.15*v); }
  const neig=(Array.isArray(ph.neig)?ph.neig[e.nr]:[-15,0,15][e.nr])||0;
  for(let i=0;i<n;i++){
    const f=rand(0.66,1.0), p={x:o.x+Math.sin(neig*Math.PI/180)*hs*f*0.6,y:o.y+hs*f*0.92,z:o.z+rand(-0.2,0.2)};
    const d=randDir(), w=rand(w0,w1)*0.9, vv=[d[0]*w,d[1]*w*0.8+1,d[2]*w*0.6], c=Math.random()<0.6?A:B, life=rand(2.2,3.2);
    SCHWEIF=0.5; psHuge.emit(p.x,p.y,p.z,vv[0],vv[1],vv[2],c[0]*1.2,c[1]*1.1,c[2]*0.9,life,4,0);
    SCHWEIF=0.25; for(let k=0;k<3;k++) psMid.emit(p.x,p.y,p.z,vv[0]*rand(0.9,1.05),vv[1]*rand(0.9,1.05),vv[2]*rand(0.9,1.05),c[0],c[1],c[2],life*0.8,4,2,0.6,0.2,0.02);
    const pops=Math.floor(rand(5,13));
    for(let k=0;k<pops;k++){ const tz=0.25+Math.random()*1.5; imBild(tz,()=>{ const b=bahnOrt(p,vv,4,tz); knisterPop(b.x,b.y,b.z,{laut:0.45,leise:Math.random()<0.5,funken:7}); }); } }
  SCHWEIF=alt;
  /* Bodenknistern, wenn die Brocken unten ankommen */
  if(!e.nr) later(2.2,()=>knisterWolke({x:o.x,y:fkBoden(o.x,o.z)+0.3,z:o.z},Math.round(110*q),1.6,3.5,{flach:0.1,laut:0.35}));
};

/* geysirkrone (Goldgeysir): die Knisterkrone des riesen waechst (Rate und
   Radius, krone/kroneKurve) - laeuft als eigene Ebene mit dem riesen */
NEU_EMIT.geysirkrone=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), kr=ph.kroneKurve?bereich(ph.kroneKurve,e.u):(ph.krone||1), h=e.hAkt||10, R=1.9*Math.sqrt(kr);
  for(let n=fkJe(e,'gk',70*kr*q*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, r=R*Math.sqrt(Math.random());
    knisterPop(o.x+Math.cos(a)*r,o.y+h+rand(-1.2,0.8),o.z+Math.sin(a)*r,{laut:0.3+0.15*kr,leise:Math.random()<0.5,c:[1,0.85,0.45]}); }
  e.kl=(e.kl||0)-dt; if(e.kl<=0){ e.kl=rand(0.25,0.45)/kr; sfx.crackle(distVol(o)*0.35*kr); }
};

/* ---------- 4. Ereignisse am Phasenende ---------- */
Object.assign(FONT_EREIGNIS,{
  /* kurzer Knisterstoss an der Spitze */
  knister(e,o){ const h=e.hAkt||3; knisterWolke({x:o.x,y:o.y+h*0.85,z:o.z},Math.round(70*QUAL()),0.8,0.4+h*0.12,{laut:0.5}); sfx.crackle(distVol(o)*0.8); },
  /* Zauberpuff: weisser Blitz, Rauchball 1 m, dumpfes Fump */
  zauberpuff(e,o){ const v=distVol(o), p={x:o.x,y:o.y+0.5,z:o.z};
    flash(p,FW.weiss,3,0.1); psHuge.emit(p.x,p.y,p.z,0,0,0,2.5,2.5,2.5,0.08,0,0);
    rauchball(p,{r:0.55,n:8,dauer:1.5,quellen:0.25,steigen:0.25,c:[0.85,0.85,0.9],a:0.55,leuchten:true,farbe:t=>t<0.15?[1.5,1.5,1.6]:[0.45,0.45,0.5]});
    sfx.thump(v*1.1); rauschF({dur:0.25,vol:0.2*v,f:500,hart:true}); },
  zauberpuff_tadaa(e,o){ FONT_EREIGNIS.zauberpuff(e,o); const p={x:o.x,y:o.y+1,z:o.z};
    later(0.35,()=>{ for(let i=0;i<Math.round(60*QUAL());i++){ const d=randDir(), s=rand(2.5,4.5);
        glint(psMid,p.x,p.y,p.z,d[0]*s,Math.abs(d[1])*s+1,d[2]*s,[1,1,1],3,{t0:0.1,t1:0.8,dim:0.6,glimm:0.4,rest:0.3}); }
      sfx.pling(distVol(o)); later(0.12,()=>sfx.pling(distVol(o)*0.8)); }); },
  /* Etagenschlag: Wumm und ein weisser Blitzring an der Duese */
  etagenschlag(e,o){ const v=distVol(o), alt=SCHWEIF; SCHWEIF=0.15;
    for(let i=0;i<24;i++){ const a=i/24*Math.PI*2; psBig.emit(o.x,o.y+0.1,o.z,Math.cos(a)*3.2,0.2,Math.sin(a)*3.2,1.3,1.3,1.3,0.45,0.5,0); }
    SCHWEIF=alt; flash({x:o.x,y:o.y+0.3,z:o.z},FW.weiss,2.4,0.12); sfx.wumms(v*0.7); sfx.thump(v); },
  dreischlag(e,o){ for(let i=0;i<3;i++) later(i*0.3,()=>FONT_EREIGNIS.etagenschlag(e,o)); },
  /* Leuchtbasis flammt auf 0,9 m auf und verlischt */
  aufflammen(e,o,ph){ const c=farbe(ph.basis)||FW.blau, alt=SCHWEIF; SCHWEIF=0;
    for(let i=0;i<40;i++){ const d=randDir(), s=rand(0.6,1.4); psHuge.emit(o.x,o.y+0.3,o.z,d[0]*s,Math.abs(d[1])*s+0.4,d[2]*s,c[0]*1.3,c[1]*1.3,c[2]*1.3,rand(0.3,0.5),-0.5,0); }
    SCHWEIF=alt; flash({x:o.x,y:o.y+0.5,z:o.z},c,3.2,0.35); sfx.fauchen(distVol(o)*0.9,0.4,true); },
  /* Teufelslachen: die Hoerner brennen 1,15 s nach, dabei dreimal Knistern */
  teufelslachen(e){ emitters.push(Object.assign({},e,{t:1.15,dauer:1.15,alter:0,blendeIn:0,blendeAus:0.9,lachen:true,gelacht:false,id:0})); },
  /* Tuete ausgekippt: 20 Kleckse in allen vier Farben gleichzeitig */
  tuete(e,o,ph){ const F=(ph.farben||['magenta','limette','zitrone','aqua']).map(farbe);
    for(let i=0;i<20;i++) fkKlecks(o,F[i%F.length],rand(1.8,2.8),1.6); sfx.plopp(distVol(o)*0.7,0.9); },
  /* Knisterkrone: 80 Pops steigen in 0,6 s in der Mitte auf 1,5 m */
  knisterkrone(e,o){ const n=Math.round(80*QUAL()), alt=SCHWEIF;
    for(let i=0;i<n;i++){ const tz=Math.random()*0.6; imBild(tz,()=>{ const a=Math.random()*Math.PI*2, r=rand(0,0.35); knisterPop(o.x+Math.cos(a)*r,o.y+0.15+1.35*(tz/0.6)+rand(-0.1,0.1),o.z+Math.sin(a)*r,{laut:0.5}); }); }
    SCHWEIF=0.2; for(let i=0;i<60;i++){ const a=Math.random()*Math.PI*2, w=rand(0,0.6); psMid.emit(o.x,o.y+0.05,o.z,Math.cos(a)*w,rand(4,5.5),Math.sin(a)*w,1,0.75,0.3,rand(0.6,0.9),6,4); }
    SCHWEIF=alt; sfx.crackle(distVol(o)); later(0.3,()=>sfx.crackle(distVol(o))); },
  /* Wasserorgel: alle Duesen fallen zusammen, Gischtschleier aus 200 Funken */
  zusammenfall_gischt(e,o){ const n=Math.round(200*QUAL()), alt=SCHWEIF; SCHWEIF=0;
    for(let i=0;i<n;i++){ const c=Math.random()<0.7?FW.silber:FW.tuerkis;
      psSmall.emit(o.x+rand(-0.9,0.9),o.y+rand(1,3),o.z+rand(-0.4,0.4),rand(-0.3,0.3),rand(-0.2,0.3),rand(-0.3,0.3),c[0],c[1],c[2],rand(2,3.4),0.5,4); }
    SCHWEIF=alt; sfx.rieseln(distVol(o)*1.2,3); },
  /* Farbmischer: weisser Blitz an der Kreuzung */
  weissblitz(e,o){ const p={x:o.x,y:o.y+3,z:o.z}; flash(p,FW.weiss,3,0.3); psHuge.emit(p.x,p.y,p.z,0,0,0,3,3,3,0.12,0,0); sfx.thump(distVol(o)*0.8); },
  /* Feuerberg: der Krater glueht 3 s nach */
  nachgluehen(e,o){ emitters.push({t:3,k:'lava',o,A:FW.rot,B:FW.rot,ph:{modus:'grollen'},staerke:0.6,u:0,tag:e.tag}); },
  /* Feuersaeule, Goldgeysir: die letzten Funken kuehlen oben ab */
  ausklingen(e,o){ const alt=SCHWEIF, h=e.hAkt||10; SCHWEIF=0.2;
    for(let i=0;i<Math.round(80*QUAL());i++){ const a=Math.random()*Math.PI*2, r=rand(0,1.5); psMid.emit(o.x+Math.cos(a)*r,o.y+h*rand(0.5,1),o.z+Math.sin(a)*r,rand(-0.5,0.5),rand(-1,0),rand(-0.5,0.5),0.8,0.25,0.05,rand(1,2),2,2,0.3,0.03,0); }
    SCHWEIF=alt; },
  nachglitzern(){},
  /* Niagara: die mittleren Duesen tropfen noch 1 s */
  tropfen(e,o){ for(let i=0;i<30;i++){ const tz=Math.random(); imBild(tz,()=>{ const x=o.x+rand(-0.25,0.25), y=o.y+3, alt=SCHWEIF; SCHWEIF=0.1;
      psMid.emit(x,y,o.z,0,-rand(0.5,1),0,0.9,0.95,1,Math.sqrt(2*(y-fkBoden(x,o.z))/6)*1.05,6,0); SCHWEIF=alt; }); } },
  nachregen(){},
  /* Silberausbruch: die Knisterwolke sinkt als letztes Glimmen */
  nachgluehen_silber(e,o){ knisterWolke({x:o.x,y:o.y+12,z:o.z},Math.round(60*QUAL()),1.5,4,{fall:2,laut:0.3}); },
  bodenknistern(e,o){ if(!e.nr) knisterWolke({x:o.x,y:fkBoden(o.x,o.z)+0.2,z:o.z},Math.round(40*QUAL()),1,2.5,{flach:0.1,laut:0.3}); }
});

/* ---------- 5. Drehbuecher (Katalog fontaenen, 26.09., Tom: Anomalie) ----------
   Abweichungen vom Katalog stehen je Produkt dabei. nach = Nachlauf in s
   (Nachgluehen, Nachregen), den die Station stehen bleibt. */
Object.assign(FONT,{
  /* Eissterne: vier Kaltfunken-Tortenfontaenen im Gleichklang */
  tortenfontaene:{phasen:[
    {k:'torte',at:0,t:1.0,x:-0.21,hm:0.2,hKurve:[0.3,1],A:'silber',B:'weiss',kalt:true},
    {k:'torte',mit:true,t:1.0,x:-0.07,hm:0.2,hKurve:[0.3,1],A:'weiss',B:'silber',kalt:true},
    {k:'torte',mit:true,t:1.0,x:0.07,hm:0.2,hKurve:[0.3,1],A:'silber',B:'weiss',kalt:true},
    {k:'torte',mit:true,t:1.0,x:0.21,hm:0.2,hKurve:[0.3,1],A:'weiss',B:'silber',kalt:true},
    {k:'torte',at:1.0,t:7.0,x:'alle4',hm:0.7,A:'silber',B:'weiss',kalt:true,diamant:[0.66,1],ende:'pff'}]},
  /* Feuerteufel: zwei gespreizte Hoerner, zum Schluss lacht er */
  feuerteufel:{phasen:[
    {k:'hoerner',t:1.5,hm:0.3,spreiz:0,funke:'kohle',A:'rot',B:'rot',ton:'zischen'},
    {k:'hoerner',t:5.0,hm:1.5,spreiz:25,funke:'kohle',A:'gold',B:'rot',mischB:0.3,ton:'fauchen'},
    {k:'hoerner',t:2.0,hm:1.8,spreiz:40,funke:'kohle',A:'orange',B:'rot',mischB:0.4,ton:'fauchen'},
    {k:'hoerner',t:0.5,hm:1.8,spreiz:40,funke:'kohle',A:'orange',B:'rot',mischB:0.4,ende:'teufelslachen'}]},
  /* Gummibaerchen: Neon-Kleckse huepfen einmal, zum Schluss die Tuete */
  leuchtfontaene:{phasen:[
    {k:'gummiperlen',at:0.0,t:5,x:0.0,hm:1.6,A:'magenta',B:'silber',rate:4,ton:'blubb'},
    {k:'gummiperlen',at:4.2,t:5,x:-0.12,hm:1.8,A:'limette',B:'silber',rate:5,ton:'blubb'},
    {k:'gummiperlen',at:8.4,t:5,x:0.12,hm:2.0,A:'zitrone',B:'silber',rate:6,ton:'blubb'},
    {k:'gummiperlen',at:12.6,t:5.5,x:0.24,hm:2.2,A:'aqua',B:'silber',rate:7,ton:'blubb',ende:'tuete',farben:['magenta','limette','zitrone','aqua']}],nach:2},
  /* Feuerquelle: drei Funkenarten nacheinander */
  fontaene:{phasen:[
    {k:'gerb',at:0,t:6,x:0.00,hm:2.5,kegel:12,funke:'kohle',A:'orange',ton:'rauschen',blende:1},
    {k:'gerb',at:5,t:6,x:-0.25,hm:3.0,kegel:10,funke:'brokat',A:'gold',ton:'rauschen',blende:1},
    {k:'gerb',at:10,t:6.5,x:0.25,hm:3.5,kegel:8,funke:'titan',A:'weiss',B:'silber',mischB:0.4,ton:'zischen',ende:'knister'}]},
  /* Feuerkreis: waagerechter Ring, atmet, Krone */
  bodenfeuer:{phasen:[
    {k:'bodenring',t:2.0,radius:[0.3,1.8],hebung:5,funke:'kohle',A:'orange',B:'gold',ton:'zischen'},
    {k:'bodenring',t:5.0,radius:[1.4,2.0],atmen:0.8,hebung:6,funke:'kohle',A:'gold',B:'orange',huepfer:true,ton:'rauschen'},
    {k:'bodenring',t:3.0,radius:[1.8,0.2],hebung:8,funke:'kohle',A:'gold',B:'orange',ton:'zischen',ende:'knisterkrone'}]},
  /* Farbenspiel: Farbflamme an der Duese, neutraler Strahl darueber */
  farbfontaenen:{phasen:[
    {k:'gerb',at:0,t:6,x:-0.25,hm:3.0,funke:'titan',A:'silber',basis:'magenta',ton:'zischen'},
    {k:'gerb',at:6,t:6,x:0.25,hm:3.0,funke:'brokat',A:'gold',basis:'gruen',ton:'rauschen'},
    {k:'gerb',at:12,t:6,x:0.00,hm:3.2,funke:'brokat',A:'gold',B:'silber',kernB:true,basis:'blau',ton:'rauschen',ende:'aufflammen'}]},
  /* Zauberbrunnen: Verwandlung mit Blitz, Rauchball und 0,4 s Dunkelheit */
  zauberbrunnen:{phasen:[
    {k:'gerb',t:5.5,hm:3.0,funke:'titan',A:'silber',B:'tuerkis',sterne:'B',ton:'zischen',ende:'zauberpuff'},
    {k:'gerb',t:5.5,hm:3.5,funke:'brokat',A:'gold',B:'violett',sterne:'B',ton:'rauschen',dunkel:0.4,ende:'zauberpuff'},
    {k:'gerb',t:6.0,hm:4.0,funke:'knister',A:'weiss',B:'gruen',sterne:'B',ton:'knistern',dunkel:0.4,ende:'zauberpuff_tadaa'}]},
  /* Zuckerhut: eine Phase, der Kegel waechst stetig von 1,5 auf 5 m */
  vulkan:{phasen:[
    {k:'gerb',t:20,hm:5,hKurve:[0.3,1.0],kegel:[14,22],dichte:[200,520],funke:'brokat',A:'gold',B:'rot',mischB:0.12,ton:'rauschen',lautKurve:[0.5,1.2],ende:'aus'}]},
  /* Feuerberg: Krater grollt, Lava bleibt gluehend liegen */
  feuerberg:{phasen:[
    {k:'lava',t:4,modus:'grollen',A:'rot',B:'rot',rauch:true,ton:'grollen'},
    {k:'lava',t:8,modus:'auswurf',rate:[3,6],hm:[2,4],A:'orange',B:'rot',unterbau:{funke:'kohle',hm:1.5},ton:'blubb'},
    {k:'lava',t:3,modus:'ausbruch',stoss:12,hm:4.5,A:'orange',B:'zitrone',ton:'grollen',ende:'nachgluehen'}],nach:3},
  /* Bluetenbrunnen: vier Bluetenwechsel in Fontaenenhoehe */
  sternenbrunnen:{phasen:[
    {k:'bluetenwerfer',t:4.5,hm:2.5,funke:'titan',A:'silber',bluete:{art:'chrys',farbe:'silber',rate:3,funken:15},ton:'zischen'},
    {k:'bluetenwerfer',t:4.5,hm:2.8,funke:'kohle',A:'gold',bluete:{art:'perle',farbe:'blau',rate:5},ton:'rauschen'},
    {k:'bluetenwerfer',t:4.0,hm:2.8,funke:'titan',A:'weiss',bluete:{art:'reis',farbe:'weiss',rate:9,funken:5},ton:'zischen'},
    {k:'bluetenwerfer',t:5.0,hm:3.2,funke:'brokat',A:'gold',bluete:{art:'chrys',farbe:'gold',rate:[4,9],funken:22},ton:'rauschen',ende:'aus'}]},
  /* Popcorn: Knallsterne im Popcorn-Rhythmus, dann der Nachzuegler */
  vulkanfeld:{phasen:[
    {k:'popcorn',at:0,t:12,x:'reihe3',hm:1.5,funke:'kohle',A:'gold',ton:'rauschen',
     knallKurve:[[0,0],[3,0],[3.1,1],[5,1.5],[7,12],[9,12],[10.5,1],[12,0]],knallHoehe:[1.5,3],woelkchen:0.8},
    {k:'popcorn',at:13.2,t:0.3,x:0.3,nachzuegler:true}]},
  /* Funkenturm: drei Etagen mit dumpfem Schlag */
  funkenturm:{phasen:[
    {k:'gerb',t:4,hm:2,kegel:6,funke:'titan',A:'weiss',ton:'zischen',ende:'etagenschlag'},
    {k:'gerb',t:4,hm:4,kegel:7,funke:'titan',A:'weiss',B:'gold',mischB:0.3,ton:'zischen',ende:'etagenschlag'},
    {k:'gerb',t:5,hm:6,kegel:8,funke:'titan',A:'weiss',B:'gold',mischB:0.5,krone:{funke:'brokat',A:'gold'},ton:'rauschen'},
    {k:'gerb',t:1,hm:6,kegel:8,funke:'titan',A:'weiss',B:'gold',mischB:0.5,krone:{funke:'brokat',A:'gold'},ton:'rauschen',ende:'dreischlag'}]},
  /* Drehsonne: rechtsherum Gold, stockt, linksherum Silber */
  feuerrad:{phasen:[
    {k:'saxon',t:6.0,dreh:1,ups:[1,5],funke:'kohle',A:'gold',nabe:'rot',ton:'fauchen'},
    {k:'saxon',t:0.6,dreh:0,stottern:true,funke:'kohle',A:'gold',nabe:'rot'},
    {k:'saxon',t:6.0,dreh:-1,ups:[3,7],funke:'titan',A:'silber',nabe:'gruen',ton:'zischen'},
    {k:'saxon',t:1.4,dreh:-1,ups:8,beide:true,funke:'titan',A:'silber',B:'gold',nabe:'gruen',rand:'knister',ton:'zischen',ende:'aus'}]},
  /* Goldgeysir: reine Goldsaeule, die Knisterkrone waechst.
     Die Krone laeuft als eigene Ebene (geysirkrone) mit dem riesen. */
  goldgeysir:{phasen:[
    {k:'riesen',at:0,t:2,hm:10,hKurve:[0.4,1],A:'gold',B:'weiss',C:'gold'},
    {k:'riesen',at:2,t:10,hm:10,A:'gold',B:'weiss',C:'gold'},
    {k:'geysirkrone',at:2,t:10,hm:10,krone:1.0},
    {k:'riesen',at:12,t:6,hm:10,A:'gold',B:'weiss',C:'gold'},
    {k:'geysirkrone',at:12,t:6,hm:10,kroneKurve:[1.0,2.0]},
    {k:'riesen',at:18,t:2,hm:11,A:'gold',B:'zitrone',C:'gold',ende:'ausklingen'},
    {k:'geysirkrone',at:18,t:2,hm:11,krone:2.0}]},
  /* Farbmischer: Rot, Gruen, Blau kreuzen sich zu Gelb und Weiss.
     Neigung 7 statt 18 Grad: bei 18 Grad kreuzten sich die Strahlen schon
     auf 1 m, der Katalog will die Kreuzung bei etwa 3 m. */
  dreiklang:{duesen:[-0.35,0,0.35],phasen:[
    {k:'farbstrahl',at:0,t:13,x:-0.35,neig:7,azi:'innen',hm:4,A:'rot',ton:'rauschen'},
    {k:'farbstrahl',at:3.5,t:9.5,x:0.00,neig:0,hm:4.5,A:'gruen'},
    {k:'farbstrahl',at:7.5,t:5.5,x:0.35,neig:7,azi:'innen',hm:4,A:'blau'},
    {k:'farbstrahl',at:13,t:2,x:'alle3',neigKurve:[7,0],azi:'innen',hm:5,A:['rot','gruen','blau'],ton:'rauschen',ende:'weissblitz'}]},
  /* Feuerbrunnen: Flammenbaelle in Stoessen, Dauerfeuer, drei Schlussstoesse */
  feuerbrunnen:{phasen:[
    {k:'feuerbrunnen',t:3,h:0.4,stossAlle:[0.5,0.9],ton:'fauchen'},
    {k:'feuerbrunnen',t:8,h:1.0,stossAlle:[0.35,0.5]},
    {k:'feuerbrunnen',t:3,h:1.1,stossAlle:0.2},
    {k:'feuerbrunnen',t:2,h:1.4,stoesse:3,stossAlle:0.6,ende:'aus'}]},
  /* Wasserorgel: vier Fontaenen tanzen eine Choreografie */
  wasserspiel:{duesen:[-0.45,-0.15,0.15,0.45],funke:'titan',A:'silber',B:'tuerkis',perlen:'B',ton:'rauschen',phasen:[
    {k:'wasserorgel',t:3,figur:'atmen',hm:[0.8,1.6],hz:0.6},
    {k:'wasserorgel',t:4,figur:'welle',hm:[1,5],von:'mitte',wellen:2},
    {k:'wasserorgel',t:3,figur:'kolben',hm:[1,5],wechselAlle:0.7},
    {k:'wasserorgel',t:3,figur:'kanon',hm:[1,6],von:'aussen',abstand:0.5},
    {k:'wasserorgel',t:6,figur:'alle',hm:[2,6],hKurve:[0.3,1],ende:'zusammenfall_gischt'}]},
  /* Funkelsaeule: dunkle Saeule, die oben in Einzelblitzen zerstaeubt */
  glitzerkaskade:{phasen:[
    {k:'gerb',t:5,hm:8,hKurve:[0.6,1],funke:'glitter',A:'bernstein',glitterAnteil:0.3,ton:'rauschen',blende:1},
    {k:'gerb',t:10,hm:8,funke:'glitter',A:'bernstein',B:'gold',mischB:0.4,glitterAnteil:0.8,ton:'rauschen',blende:1.5},
    {k:'gerb',t:4,hm:9,funke:'glitter',A:'silber',glitterFarbe:'weiss',glitterAnteil:1.0,ton:'zischen'},
    {k:'gerb',t:1,hm:9,hKurve:[1,0.2],funke:'glitter',A:'silber',glitterFarbe:'weiss',glitterAnteil:1.0,ende:'nachglitzern'}],nach:1.5},
  /* Niagara: Silbervorhang faellt von der Leine */
  wasserfall:{phasen:[
    {k:'niagara',t:2,hoehe:3,breite:2.4,duesen:12,dichteKurve:[0.2,1],funke:'titan',A:'silber',B:'weiss',ton:'rauschen'},
    {k:'niagara',t:24,hoehe:3,breite:2.4,duesen:12,funke:'titan',A:'silber',B:'weiss',wind:0.3,spritzer:true,ton:'rauschen'},
    {k:'niagara',t:4,hoehe:3,breite:2.4,duesen:12,funke:'titan',A:'silber',B:'weiss',ausduennen:'aussen_nach_innen',spritzer:true,ende:'tropfen'}],nach:1},
  /* Wendeltreppe: Schraube, Doppelhelix, Trichter */
  eisblume:{phasen:[
    {k:'wendel',t:4,hm:8,neig:0,ups:[0,1],funke:'titan',A:'silber',ton:'zischen'},
    {k:'wendel',t:10,hm:12,neig:12,ups:[1,3],funke:'titan',A:'silber',B:'weiss',ton:'rauschen'},
    {k:'wendel',t:4,hm:12,neig:12,ups:3,zweite:{dreh:-1,A:'tuerkis'},funke:'titan',A:'silber',ton:'rauschen'},
    {k:'wendel',t:4,hm:11,neigKurve:[12,32],ups:3,zweite:{dreh:-1,A:'tuerkis'},funke:'titan',A:'silber',ton:'zischen',ende:'knister'}]},
  /* Lametta: Kamuro-Faeden sinken bis zum Boden, Nachregen */
  goldvulkan:{phasen:[
    {k:'lametta',t:6,hm:4,kegel:20,funke:'kamuro',A:'gold',ton:'rauschen'},
    {k:'lametta',t:18,hm:7,kegel:50,funke:'kamuro',A:'gold',B:'blau',sterneB:1.5,ton:'rauschen'},
    {k:'lametta',t:6,hm:7,kegel:55,funke:'kamuro',A:'gold',fadenLaenge:1.6,dichte:1.5,ton:'rauschen',ende:'nachregen'}],nach:3.5},
  /* Feuersaeule: Gluehfarben steigen als Schichten durch die Saeule */
  feuersaeule:{phasen:[
    {k:'farbschichten',t:24,hm:15,schub:4,folge:['weiss','zitrone','gold','orange','rot','scharlach'],funke:'brokat',ton:'rauschen'},
    {k:'farbschichten',t:4,hm:15,hKurve:[1,0.4],folge:['scharlach'],abkuehlen:true,ton:'rauschen',ende:'ausklingen'}]},
  /* Feuerwand: Faecher oeffnet sich, schlaegt, kreuzt sich, wird Wand */
  feuerwand:{duesen:[-0.4,-0.2,0,0.2,0.4],funke:'kohle',A:'orange',B:'rot',ton:'fauchen',phasen:[
    {k:'faecherwand',t:3,hm:4,winkel:[0,0,0,0,0]},
    {k:'faecherwand',t:3,hm:6,winkelKurve:[[0,0,0,0,0],[-40,-20,0,20,40]]},
    {k:'faecherwand',t:4,hm:6,fluegel:{schlaege:3,zu:[-8,-4,0,4,8],auf:[-40,-20,0,20,40]}},
    {k:'faecherwand',t:3,hm:6,winkel:[30,15,0,-15,-30],A:'gold'},
    {k:'faecherwand',t:2,hm:8,winkel:[0,0,0,0,0],A:'gold',B:'weiss',ende:'knister'}]},
  /* Himmelsstuermer und Regenbogen-Titan: von Tom abgenommen, Bild unveraendert */
  fontaene30:{phasen:[{k:'monsterfont',t:12,hm:30,stil:'puls',farben:['rot','gold','gruen','tuerkis','violett']}]},
  fontaene50:{phasen:[{k:'monsterfont',t:14,hm:50,stil:'dreh',farben:['rot','orange','zitrone','gruen','tuerkis','blau','violett','magenta']}]},
  /* Silberausbruch: edles Silber, Luft anhalten, Ausbruch ins Knistermeer */
  silberkaskade:{phasen:[
    {k:'gerb',t:10,hm:20,kegel:9,funke:'titan',A:'silber',B:'weiss',mischB:0.3,knisterLeise:1,ton:'rauschen'},
    {k:'gerb',t:0.8,hm:6,kegel:6,dichte:140,funke:'titan',A:'silber',blende:0,ton:'still'},
    {k:'ausbruch',t:9,hm:22,kegel:18,funke:'knister',A:'weiss',sterne:['rot','gruen'],wolke:[8,20],ton:'knistern_laut'},
    {k:'ausbruch',t:3.2,hm:22,kegel:18,knisterWellen:3,abklingen:true,sterne:['rot','gruen'],wolke:[8,20],ton:'knistern_laut',ende:'nachgluehen_silber'}],nach:1.5},
  /* Feuerkaskade: Dreizack, dann zerspringen alle drei Saeulen */
  feuerkaskade:{duesen:[-0.5,0,0.5],phasen:[
    {k:'gerb',at:0,t:16,x:0.0,hm:10,funke:'brokat',A:'gold',ton:'rauschen'},
    {k:'gerb',at:4,t:12,x:-0.5,hm:12,funke:'titan',A:'silber',ton:'zischen'},
    {k:'gerb',at:4.6,t:11.4,x:0.5,hm:12,funke:'titan',A:'silber',ton:'zischen'},
    {k:'gerb',at:10,t:6,x:'alle3',neig:[-15,0,15],hm:12,funke:'kohle',A:'gold',B:'orange',mischB:0.4,ton:'fauchen'},
    {k:'zerfall',at:16,t:7,x:'alle3',hm:12,brocken:40,weite:[3,8],knister:'einzeln',A:'gold',B:'weiss',ende:'bodenknistern'}]}
});

/* Signaturen (Test anomalie.js prueft die Eindeutigkeit ueber alle Kategorien) */
Object.assign(SIGNATUR,{
  tortenfontaene:{idee:'gleichklang',text:'vier Kaltfunken-Tortenfontänen wachsen und verlöschen gemeinsam'},
  feuerteufel:{eff:'hoerner',text:'zwei gespreizte Feuerhörner, zum Schluss dreifaches Knisterlachen'},
  leuchtfontaene:{eff:'gummiperlen',text:'Neon-Kleckse, die auf dem Boden einmal hüpfen'},
  fontaene:{idee:'funkenarten',text:'drei Fontänen aus Kohle, Brokat und Titan nacheinander'},
  bodenfeuer:{eff:'bodenring',text:'waagerechter 360-Grad-Funkenring, der atmet und sich zur Krone zusammenzieht'},
  farbfontaenen:{eff:'leuchtbasis',text:'farbige Flamme an der Düse, neutraler Funkenstrahl darüber'},
  zauberbrunnen:{eff:'zauberpuff',text:'Verwandlung mit Blitz, Rauchball und Dunkelpause'},
  vulkan:{idee:'kegelwachstum',text:'eine Phase, Höhe wächst stetig von 1,5 auf 5 m'},
  feuerberg:{eff:'lava',text:'Lavabrocken schlagen auf und glühen als Pfützen weiter'},
  sternenbrunnen:{eff:'bluetenwerfer',text:'Sterne platzen in Fontänenhöhe zu Mini-Chrysanthemen'},
  vulkanfeld:{eff:'popcorn',text:'Knallsterne im Popcorn-Rhythmus mit Nachzügler'},
  funkenturm:{idee:'etagen',text:'Höhe springt in drei Stufen mit dumpfem Schlag'},
  feuerrad:{eff:'saxon',text:'Rad stockt und dreht mit neuer Farbe in Gegenrichtung weiter'},
  goldgeysir:{eff:'riesen',text:'reine Goldsäule, Knisterkrone wächst'},
  dreiklang:{idee:'farbmischung',text:'drei Farbstrahlen mischen sich additiv zu Gelb und Weiß'},
  feuerbrunnen:{eff:'feuerbrunnen',text:'Flammenbälle in Stößen, Dauerfeuer, drei Schlussstöße'},
  wasserspiel:{eff:'wasserorgel',text:'vier Fontänen tanzen eine Höhen-Choreografie'},
  glitzerkaskade:{eff:'glitter',text:'dunkle Säule, die oben in Einzelblitzen zerstäubt'},
  wasserfall:{eff:'niagara',text:'Silbervorhang fällt von einer Leine in 3 m Höhe'},
  eisblume:{eff:'wendel',text:'Funken steigen als Schraube, dann Doppelhelix, dann Trichter'},
  goldvulkan:{eff:'lametta',text:'Kamuro-Fäden sinken bis zum Boden, Nachregen nach dem Ende'},
  feuersaeule:{eff:'farbschichten',text:'Farben steigen als Schichten durch die Säule, Glühfarben von Eisen'},
  feuerwand:{eff:'faecherwand',text:'Fontänenfächer öffnet sich, schlägt wie Flügel, kreuzt sich, wird Wand'},
  fontaene30:{eff:'monsterfont-puls',text:'30 m pulsierende Palme: Salven aus Glitzersternen, oben goldene Weide'},
  silberkaskade:{eff:'ausbruch',text:'Luft anhalten, dann Ausbruch in ein Titan-Knistermeer'},
  feuerkaskade:{eff:'zerfall',text:'drei Säulen zerspringen in einzeln knisternde Brocken'},
  fontaene50:{eff:'monsterfont-dreh',text:'50 m drehender Regenbogenfächer wie eine Tulpe, silberner Stroboskopkern'}
});

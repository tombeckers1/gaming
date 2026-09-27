/* =========================================================
   Wie die neue Ware abbrennt (Sortiment mal drei, Tom 26.09.).
   Die Daten stehen in 02e-neuware.js.

   Grundsaetze wie beim bisherigen Sortiment:
   - Batterien, Faecher, Roemische Lichter und Sortimente laufen als
     Show (SHOWS). Die Grundstufe (Steighoehe, Kaliber) kommt aus dem
     Level: je spaeter, desto hoeher und groesser. Innerhalb der Show
     steigert sich jeder Schuss (showRampe).
   - Bis Level 15 keine Profi-Bruchbilder (Dahlie, Kamuro, Brokat ...).
   - Jede Show hat ihr eigenes Drehbuch: eigene Folge von Bruchbildern
     in eigenem Farbthema - kein Produkt ist die Kopie eines anderen.
   - Raketen: eine Rakete je Zuendung, ein Bruch.
   - Fontaenen werfen keine Ladung.
   ========================================================= */

/* Grundstufe aus dem Level, angelehnt an die bisherigen Batterien
   (Level 13: pw -5, sz 0,78 - Level 24: pw 3,5, sz 1,30) */
/* Eingeklemmt zwischen die bisherigen Produkte: nie kleiner als eins
   mit niedrigerem Level, nie groesser als eins mit hoeherem - sonst
   waere eine neue Level-21-Batterie kleiner als die Donnerwand (20). */
const ALT_BASIS=Object.keys(SHOW_BASIS).filter(t=>P[t]).map(t=>({lvl:P[t].lvl,pw:SHOW_BASIS[t].pw,sz:SHOW_BASIS[t].sz}));
function neuBasis(lvl,th){
  const f={pw:-5+(lvl-13)*0.77, sz:0.78+(lvl-13)*0.047};
  for(const k of ['pw','sz']){
    const unter=ALT_BASIS.filter(b=>b.lvl<lvl).map(b=>b[k]), ueber=ALT_BASIS.filter(b=>b.lvl>lvl).map(b=>b[k]);
    if(unter.length) f[k]=Math.max(f[k],Math.max(...unter));
    if(ueber.length) f[k]=Math.min(f[k],Math.min(...ueber)); }
  return {pw:Math.round(f.pw*100)/100, sz:Math.round(f.sz*100)/100, th};
}

/* Drehbuch aus einer knappen Beschreibung. n Schuss werden auf die
   Akte verteilt (Gewicht w), frueh ruhiger, spaeter dichter.
   s: 'einzel' | 'fan' | 'vfan' | 'salve' | 'perle' | 'bomb'
   Der erste Akt kann mit einer Bodenmine beginnen (mine:true). */
function showAus(spec){
  const A=spec.akte, k=A.length, N=spec.n;
  const W=A.reduce((a,x)=>a+(x.w||1),0);
  const cnt=A.map(x=>x.s==='bomb'?(x.n||1):Math.max(1,Math.floor(N*(x.w||1)/W)));
  /* Rest auf die Akte verteilen, bis die Summe genau stimmt */
  let rest=N-cnt.reduce((a,b)=>a+b,0), i=k-1;
  if(!A.some(x=>x.s!=='bomb')) rest=0;
  while(rest!==0){ if(A[i].s!=='bomb'){ const d=rest>0?1:-1; if(cnt[i]+d>=1){ cnt[i]+=d; rest-=d; } } i=(i-1+k)%k; }
  const basis=clamp(1.15-N/320,0.32,1.0);
  const phasen=[];
  if(spec.auftakt) phasen.push(Object.assign({n:0,pause:spec.auftakt.gt-0.6},spec.auftakt));
  A.forEach((a,j)=>{
    const u=k>1?j/(k-1):1, gap=a.s==='salve'?0.09:a.s==='bomb'?0.5:a.s==='perle'?(a.gap||0.8):basis*(1.25-0.55*u);
    const ph={n:cnt[j],gap:Math.round(gap*100)/100,pause:j===k-1?(spec.schluss||3.2):(a.s==='salve'?2.2:1.2+0.6*(1-u))};
    if(a.s==='bomb'){ ph.bomb=a.kal||1; }
    else if(a.s==='perle'){ ph.perle=true; ph.wechsel=true; }
    else ph.eff=a.e;
    if(a.s==='fan'||a.s==='salve'&&a.fan){ ph.fan=true; ph.ang=a.ang||0.45*(j%2?-1:1); }
    if(a.s==='vfan'){ ph.vfan=true; ph.ang=a.ang||0.45; }
    if(a.mine){ ph.mine=true; ph.mineSz=a.mineSz||0.6; }
    if(a.wechsel) ph.wechsel=true;
    if(a.pfeif) ph.pfeif=true;
    if(a.th) ph.th=a.th;
    if(a.sz) ph.sz=a.sz;
    if(a.pw) ph.pw=a.pw;
    phasen.push(ph);
  });
  return phasen;
}
/* Die Drehbuecher. Bruchbilder bis Level 15 nur aus dem Grundvorrat,
   danach auch die grossen. Die Bruchbilder, die ein bisheriges Produkt
   als einziges zeigt (Bienen, Smiley, Schmetterling ...), bleiben bei
   ihm. */
const NEU_SHOWS={

};
Object.keys(NEU_SHOWS).forEach(t=>{ const s=NEU_SHOWS[t];
  if(!SHOW_BASIS[t]) SHOW_BASIS[t]=neuBasis(P[t]?P[t].lvl:s.lvl,s.th);
  if(!SHOWS[t]) SHOWS[t]=()=>showAus(s); });

/* Raketen: die Eintraege stehen seit dem 26.09. in 14i-db-raketen.js */

/* Kugelbomben-Sorten: seit dem 26.09. (Tom: "jedes Produkt eine
   Anomalie") in KUGEL (14j-db-kugeln.js) - je Sorte eigenes Hauptbild,
   eigener Aufstieg, eigene Nachbrueche. igniteType fragt KUGEL zuerst;
   die Tabelle hier bleibt nur fuer alte Aufrufe leer stehen. */
const NEU_KUGEL={};
function neuKugel(t,o){
  const k=NEU_KUGEL[t]; if(!k) return false;
  const [A,B]=themaPaar(k.th,0), gr=[2.1,2.7,3.3,4.0,4.8][k.kal-1];
  kugelbombe(o,k.kal,{A,B,eff:k.eff,stufen:(k.nach||[]).map(x=>Object.assign({},x,{sz:x.sz*gr,A,B}))});
  return true;
}

/* Fontaenen: Art, Dauer, Hoehe, Farben. set: mehrere nacheinander
   (versetzt), reihe: nebeneinander auf einmal. Keine Ladung. */
const NEU_FONT={
  tortenfontaene:{k:'torte',t:8,reihe:['silber','weiss','silber','weiss']},
  feuerteufel   :{k:'knisterbrunnen',t:8,A:'gold',B:'orange',h:0.6},
  leuchtfontaene:{k:'fountain',t:4.5,set:['limette','zitrone','rose','tuerkis']},
  farbfontaenen :{k:'fountain',t:6,set:['magenta','gruen','blau']},
  bodenfeuer    :{k:'knisterbrunnen',t:10,A:'orange',B:'gold',h:0.45},
  zauberbrunnen :{k:'knisterbrunnen',t:20,A:'silber',B:'tuerkis',h:1},
  feuerberg     :{k:'volcano',t:15,A:'gold',B:'rot'},
  vulkanfeld    :{k:'volcano',t:8,reihe:['rot','orange','gold']},
  funkenturm    :{k:'riesen',t:15,A:'weiss',B:'gold',h:0.6},
  dreiklang     :{k:'volcano',t:7,set:['gold','magenta','tuerkis']},
  wasserspiel   :{k:'wasserfall',t:6,set:['silber','himmel','silber','tuerkis']},
  glitzerkaskade:{k:'riesen',t:20,A:'silber',B:'gold',h:0.8},
  sternfontaene :{k:'sternregen',t:25,A:'gold',B:'violett'},
  eisblume      :{k:'riesen',t:22,A:'silber',B:'weiss',h:1.2},
  goldvulkan    :{k:'volcano',t:30,A:'gold',B:'zitrone'},
  feuerwand     :{k:'volcano',t:14,reihe:['rot','orange','gold','orange','rot']},
  silberkaskade :{k:'riesen',t:22,A:'silber',B:'weiss',h:1.9},
  feuerkaskade  :{k:'riesen',t:10,set:['gold','orange','gold'],h:1.4},
  feuerrad      :{k:'rad',t:12,A:'gold',B:'rot'}
};
function neuFontaene(t,o){
  const f=NEU_FONT[t]; if(!f) return false;
  const v=distVol(o), H=f.h||1;
  const eins=(dt,col,dx)=>later(dt,()=>{ const o2=dx?{x:o.x+dx,y:o.y,z:o.z}:o;
    const A=K(col||f.A||'gold'), B=K(f.B||'weiss');
    emitters.push({t:f.t,k:f.k,o:o2,A,B,h:H,klein:f.klein}); sfx.fizz(v); });
  if(f.set) f.set.forEach((c,i)=>eins(i*f.t*0.92,c,0));
  else if(f.reihe) f.reihe.forEach((c,i)=>eins(i*0.35,c,(i-(f.reihe.length-1)/2)*0.28));
  else eins(0,null,0);
  /* Zischen, solange es brennt */
  const ges=(f.set?f.set.length*f.t*0.92:f.t);
  for(let s=1.6;s<ges;s+=2.2) later(s,()=>sfx.fizz(v*0.8));
  return true;
}

/* Eigene Bodenbilder der neuen Ware */
const NEU_EMIT={
  /* Tortenfontaene: kleine, dichte Silberfontaene, 30 bis 70 cm hoch */
  torte(e,dt,o){ const A=e.A||FW.silber; e.acc=(e.acc||0)+dt*260;
    for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, s=rand(0.05,0.35);
      psSmall.emit(o.x,o.y+0.12,o.z,Math.cos(a)*s,rand(1.8,3.0),Math.sin(a)*s,A[0],A[1],A[2],rand(0.35,0.7),5,4); } },
  /* Stroboskop-Blinker: glimmt und blitzt in unregelmaessigem Takt */
  blinker(e,dt,o){ const A=e.A||FW.weiss; e.acc=(e.acc||0)+dt*70;
    for(;e.acc>=1;e.acc--){ const a=Math.random()*Math.PI*2, s=rand(0.05,0.3);
      psMid.emit(o.x,o.y+0.25,o.z,Math.cos(a)*s,rand(0.3,0.9),Math.sin(a)*s,A[0]*0.35,A[1]*0.35,A[2]*0.35,rand(0.5,0.9),-0.2,0); }
    e.bl=(e.bl||0)-dt; if(e.bl<=0){ e.bl=rand(0.1,0.25); flash({x:o.x,y:o.y+0.4,z:o.z},A,2.2,0.05);
      for(let k=0;k<10;k++){ const d=randDir(); psSmall.emit(o.x,o.y+0.35,o.z,d[0]*0.6,d[1]*0.6,d[2]*0.6,A[0],A[1],A[2],0.07,0,0); } } },
  /* Fontaene mit knisternder Krone */
  knisterbrunnen(e,dt,o){ const H=e.h||1, A=e.A, B=e.B;
    for(let k=0;k<Math.round(9*H);k++){ const a=Math.random()*Math.PI*2, s=rand(0.3,1.2)*H, c=Math.random()<0.7?A:B;
      psMid.emit(o.x,o.y+0.2,o.z,Math.cos(a)*s,rand(4,6.5)*Math.sqrt(H),Math.sin(a)*s,c[0],c[1],c[2],rand(0.8,1.3),5,4); }
    const kr=2.2*H+0.4;
    for(let k=0;k<Math.round(dt*160*H);k++){ const a=Math.random()*Math.PI*2, r=rand(0,0.8)*H;
      psSmall.emit(o.x+Math.cos(a)*r,o.y+kr+rand(-0.4,0.3),o.z+Math.sin(a)*r,rand(-.4,.4),rand(-.6,.4),rand(-.4,.4),1,.95,.8,rand(0.15,0.35),2,3); }
    e.kn=(e.kn||0)-dt; if(e.kn<=0){ e.kn=rand(0.3,0.7); sfx.crackle(distVol(o)*0.4); } },
  /* Bengalfeuer: tiefes, farbiges Leuchten mit Glut und Rauch */
  bengal(e,dt,o){ const A=e.A, kl=e.klein?0.5:1;
    e.fl=(e.fl||0)-dt; if(e.fl<=0){ e.fl=0.12; flash({x:o.x,y:o.y+0.6*kl,z:o.z},A,2.4*kl,0.2); }
    for(let k=0;k<Math.round(6*kl);k++){ const a=Math.random()*Math.PI*2, s=rand(0.1,0.6);
      psMid.emit(o.x,o.y+0.35*kl,o.z,Math.cos(a)*s,rand(0.6,1.8),Math.sin(a)*s,A[0]*1.2,A[1]*1.2,A[2]*1.2,rand(0.4,0.8),-0.3,0); }
    if(Math.random()<dt*14*kl){ const a=Math.random()*Math.PI*2;
      psBig.emit(o.x,o.y+0.5*kl,o.z,Math.cos(a)*0.2,rand(0.4,0.9),Math.sin(a)*0.2,0.25,0.24,0.26,rand(2.5,3.5),-0.15,0); } },
  /* Feuerrad: Funken wirbeln tangential von einem drehenden Rad */
  rad(e,dt,o){ e.w=(e.w||0)+dt*9; const R=0.32, y=o.y+0.8;
    for(let k=0;k<3;k++){ const a=e.w+k*Math.PI*2/3, cx=Math.cos(a)*R, cy=Math.sin(a)*R, c=k%2?e.A:e.B;
      for(let q=0;q<4;q++){ const s=rand(2.5,4.5);
        psMid.emit(o.x+cx,y+cy,o.z,-Math.sin(a)*s,Math.cos(a)*s,rand(-0.3,0.3),c[0],c[1],c[2],rand(0.4,0.8),4,4); } }
    e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=0.8; sfx.fizz(distVol(o)*0.6); } },
  /* Sternregen: Goldfontaene, in der farbige Sterne langsam steigen */
  sternregen(e,dt,o){ const A=e.A, B=e.B;
    for(let k=0;k<10;k++){ const a=Math.random()*Math.PI*2, s=rand(0.3,1.4);
      psMid.emit(o.x,o.y+0.2,o.z,Math.cos(a)*s,rand(5,8),Math.sin(a)*s,A[0],A[1],A[2],rand(0.9,1.4),5,4); }
    e.st=(e.st||0)-dt; if(e.st<=0){ e.st=0.35; const c=Math.random()<0.5?B:FW.weiss;
      for(let k=0;k<Math.round(8*QUAL());k++){ const a=Math.random()*Math.PI*2, w=rand(0.3,1.2);
        psBig.emit(o.x,o.y+0.3,o.z,Math.cos(a)*w,rand(9,12),Math.sin(a)*w,c[0],c[1],c[2],rand(1.3,1.8),6,0); } } },
  /* Farbige Wunderkerze: e.A die Funkenfarbe */
  funken(e,dt,o){ const A=e.A||FW.gold;
    /* je Sekunde, nicht je Bild - sonst waeren es bei 30 Bildern halb so viele */
    e.acc=(e.acc||0)+dt*(e.n||7)*60;
    for(;e.acc>=1;e.acc--){ const d=randDir(), s=rand(1,2.4), dx=e.reihe?(Math.floor(Math.random()*e.reihe)-(e.reihe-1)/2)*0.12:0;
      psSmall.emit(o.x+dx,o.y+0.3,o.z,d[0]*s,d[1]*s+0.4,d[2]*s,A[0],A[1],A[2],rand(0.25,0.55),4,3); } },
  /* Pharaoschlange: graue Asche waechst langsam in die Hoehe */
  asche(e,dt,o){ e.h=(e.h||0)+dt*0.07;
    for(let k=0;k<3;k++){ const a=Math.random()*Math.PI*2, r=0.05;
      psMid.emit(o.x+Math.cos(a)*r+(e.dx||0),o.y+0.05+e.h,o.z+Math.sin(a)*r,0,rand(0.02,0.05),0,0.18,0.17,0.16,rand(3,5),0,0); }
    if(Math.random()<dt*6) psSmall.emit(o.x+(e.dx||0),o.y+0.1+e.h,o.z,0,0.1,0,1,0.55,0.2,0.3,0,0); },
  /* Bodenkreisel: tanzt im Kreis und spruehet bunte Funken */
  kreisel(e,dt,o){ e.w=(e.w||0)+dt*(2+e.i*0.4); e.r=(e.r||0.2)+dt*0.12;
    const x=o.x+Math.cos(e.w+e.i*2)*e.r*(1+e.i*0.3), z=o.z+Math.sin(e.w+e.i*2)*e.r*(1+e.i*0.3), c=e.A;
    for(let k=0;k<6;k++){ const a=Math.random()*Math.PI*2, s=rand(1.5,3.2);
      psMid.emit(x,o.y+0.08,z,Math.cos(a)*s,rand(0.3,1.2),Math.sin(a)*s,c[0],c[1],c[2],rand(0.3,0.6),5,4); } }
};

/* Ein Schwall Konfetti: bunte Blaettchen, die langsam fallen */
function konfetti(o,n,h){
  const C=['rot','gold','gruen','blau','magenta','tuerkis','zitrone'].map(K);
  /* ohne Leuchtspur: Blaettchen, keine Funken */
  const alt=SCHWEIF; SCHWEIF=0;
  for(let i=0;i<Math.round(n*QUAL());i++){ const a=Math.random()*Math.PI*2, w=rand(0.3,2.2), c=C[i%C.length];
    psMid.emit(o.x,o.y+0.2,o.z,Math.cos(a)*w,rand(2.5,h||6),Math.sin(a)*w,c[0]*0.8,c[1]*0.8,c[2]*0.8,rand(2.5,4.0),1.2,1); }
  SCHWEIF=alt;
}
/* Boeller und Kleinfeuerwerk der neuen Ware: seit dem 26.09. (Tom:
   Anomalie) alle ueber die Drehbuecher KLEIN in 14l-db-klein.js -
   igniteType fragt kleinZuenden vorher. Hier bleibt nichts mehr. */
function neuKnall(t,o){ return false; }
/* Einstieg aus igniteType: true, wenn die Ware hier abgebrannt wurde */
function neuZuenden(t,o){
  if(!NEUWARE[t]) return false;
  return neuKugel(t,o)||neuFontaene(t,o)||neuKnall(t,o);
}
/* Brenndauer fuer die Station: so lange bleibt die Ware stehen */
function neuDauer(t){
  if(typeof kleinDauer==='function'){ const d=kleinDauer(t); if(d) return d; }
  const f=NEU_FONT[t];
  if(f) return (f.set?f.set.length*f.t*0.92:f.t)+(f.reihe?f.reihe.length*0.35:0)+1.5;
  if(NEU_KUGEL[t]) return [3.5,3.5,4.5,5,6.5][NEU_KUGEL[t].kal-1];
  return 0;
}

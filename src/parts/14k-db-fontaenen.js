/* =========================================================
   Fontaenen und Bodeneffekte - je Produkt eigene Funkenart und Phasen
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Fontaene ist Fontaene (Tom, 25.09.): keine Ladung, kein Bruch am
   Himmel - alles bleibt in Fontaenenhoehe.
   28.09., Tom: echt ("sieht aus wie Lichttechnik, nicht wie Pyro"; Regeln
   /tmp/fw/echt.md 1.7): Funken bleiben Gold oder Silber, Farbe gibt es nur
   als Flammenfuss an der Duese oder als eingestreute Farbsterne, je
   Produkt ein Farbthema (hoechstens 2 Farben zugleich). Jede Fontaene
   brennt an ihrer Duese mit kleiner, heller Flamme und raucht; nichts
   entsteht frei in der Luft oder neben dem Produkt; kein Leuchtball,
   kein Farbscheinwerfer, keine Figur aus gleichen Abstaenden.
   1. Grundlagen   2. Materialien (Feld funke)   3. Bausteine
   4. Emitter (NEU_EMIT)   5. Ereignisse (FONT_EREIGNIS)
   6. Gestelle (Drehsonne, Niagara)   7. Drehbuecher (FONT) und SIGNATUR
   ========================================================= */

/* ---------- 1. Grundlagen ---------- */
/* Boden unter einem Punkt: Platte des Zuendtischs (0,93 m) oder Hof */
function fkBoden(x,z){ const T=STATION_POS&&STATION_POS.tisch;
  return T&&Math.abs(x-T.x)<TISCH_B/2&&Math.abs(z-T.z)<0.52?0.94:0.02; }
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
/* Lichtschluessel je Zuendung und Duese: bleibt ueber die Phasen gleich,
   sonst springt das Licht bei jedem Phasenwechsel in einen neuen Platz */
const fkId=e=>e.id||(e.id=(e.tag||Math.random())+'/'+(e.nr||0));

/* ---------- 2. Materialien (Funkenarten, Feld funke) ----------
   g = Schwerkraft (Endtempo g/ZIEH), Leuchtspur, Lebensdauer relativ zur
   Steigzeit tA, eigenes Leuchtverhalten. Funken sind Gold oder Silber
   (Kohle, Brokat/Eisen, Titan, Glitter) - nie farbig (echt.md 1.7).
   28.09., Tom: echt - Leuchtspuren kuerzer (Kohle 0,3 -> 0,14 s, Brokat
   0,2 -> 0,12 s): ein Funke im Video ist ein kurzer Strich, keine Linie. */
/* Spurlaenge begrenzen (28.09., Tom: echt - "Laser"): SCHWEIF ist eine
   Zeit; ein schneller Funke zog damit 1-2 m lange gerade Striche. Ein
   Funke im Video ist ein kurzer Strich: hoechstens L Meter. */
const fkSpur=(t,vx,vy,vz,L)=>Math.min(t,L/Math.max(0.5,Math.hypot(vx,vy,vz)));
const FUNKE={
  /* Kohle-Gold / Tigerschweif: weich, dunkelorange, lange Boegen, dunkelt
     ab und funkelt nicht (e.kohleB: Farbe, zu der er abdunkelt) */
  kohle:{g:4,emit(x,y,z,vx,vy,vz,c,tA,e){ SCHWEIF=fkSpur(0.14,vx,vy,vz,0.6); const b=e&&e.kohleB||null;
    /* g 4 statt 6: Endtempo 3,6 m/s - die Kohlefunken sinken weich in
       Boegen, wie mit starkem Luftwiderstand (Katalog: ZIEH x 1,5) */
    psMid.emit(x,y,z,vx,vy,vz,c[0],c[1]*0.92,c[2]*0.8,tA*rand(1.25,1.9),4,2,b?b[0]*0.8:c[0]*0.6,b?b[1]*0.5:c[1]*0.22,b?b[2]*0.4:c[2]*0.05); }},
  /* Brokat: helles Gold, flimmert, feine Spur */
  brokat:{g:6,emit(x,y,z,vx,vy,vz,c,tA){ SCHWEIF=fkSpur(0.12,vx,vy,vz,0.45);
    psMid.emit(x,y,z,vx,vy,vz,c[0]*0.8+0.2,c[1]*0.8+0.16,c[2]*0.8+0.1,tA*rand(1.2,1.8),6,4); }},
  /* Eisen/Stahl: hellgold, jeder dritte Funke veraestelt sich am Ende in
     2-4 Nadeln (Wunderkerze, Brokat-Aeste; PMC 2022: Kohlenstoff im Eisen) */
  eisen:{g:6,emit(x,y,z,vx,vy,vz,c,tA){ const l=tA*rand(0.75,1.1), cc=[c[0]*0.85+0.18,c[1]*0.85+0.14,c[2]*0.7+0.08];
    if(Math.random()<0.33) verzweig(psMid,x,y,z,vx,vy,vz,cc,l+0.2,6,{tz:l,n:[2,4],streu:1.2,spur:0.06,minTempo:1.2,C:[1,0.9,0.62]});
    else { SCHWEIF=fkSpur(0.08,vx,vy,vz,0.4); psMid.emit(x,y,z,vx,vy,vz,cc[0],cc[1],cc[2],l*rand(1,1.3),6,0); } }},
  /* Titan: grellweiss-blaeulich, hart, schnell, kurze Striche, verloescht oben */
  titan:{g:6,emit(x,y,z,vx,vy,vz,c,tA){ SCHWEIF=fkSpur(0.07,vx,vy,vz,0.4);
    psMid.emit(x,y,z,vx,vy,vz,c[0]*0.6+0.45,c[1]*0.6+0.47,c[2]*0.6+0.5,tA*rand(0.85,1.08),6,0); }},
  /* Glitter: fliegt gedaempft, blitzt einmal hell auf (glint) */
  /* Art-Director 28.09.: dunkel steigen (dim 0,2, kurze Spur), geblitzt
     wird erst ab 80 % der Steigzeit, also oben und im Fall; jeder zweite
     Blitz ist ein weisser Glanzstern. 28.09., Tom: echt - Blitze kleiner
     (meist psBig, 2,6 statt 3,6): vorher standen oben weiche Leuchtkugeln. */
  glitter:{g:6,emit(x,y,z,vx,vy,vz,c,tA,e){ const ph=e&&e.ph||{}, an=ph.glitterAnteil===undefined?0.7:ph.glitterAnteil;
    if(Math.random()<an) glint(psMid,x,y,z,vx,vy,vz,c,6,{t0:tA*0.8,t1:tA*1.55,dim:0.2,spur:0.06,psBlitz:Math.random()<0.25?psHuge:psBig,blitz:2.6,blitzFarbe:farbe(ph.glitterFarbe)||[1,0.95,0.8],glimm:0.35,rest:0.3});
    else { SCHWEIF=0.06; psMid.emit(x,y,z,vx,vy,vz,c[0]*0.18,c[1]*0.18,c[2]*0.18,tA*rand(1.0,1.3),6,0); } }},
  /* Kamuro: dunkelgoldene Faeden, steigen fast unsichtbar und leuchten erst
     ab dem Scheitel auf - dort haengen sie und sinken langsam (g 1,65);
     wer unten ankommt, glimmt dort 1 s. 28.09., Tom: echt - ab dem Scheitel
     bremst die Luft die Faeden quer (x0,3): vorher trieben sie 10 m weit
     und regneten ueber den ganzen Platz statt als Glocke um die Fontaene. */
  kamuro:{g:1.65,emit(x,y,z,vx,vy,vz,c,tA,e){ const ph=e&&e.ph||{}, fl=(ph.fadenLaenge||0.55)/1.2;
    const yb=fkBoden(x,z), life=tA+Math.max(0.5,(y+(e&&e.hAkt||4)-yb)/1.5)+rand(-0.3,0.4), p={x,y,z}, v=[vx,vy,vz];
    SCHWEIF=0.03; psMid.emit(x,y,z,vx,vy,vz,c[0]*0.14,c[1]*0.1,c[2]*0.04,tA,1.65,0);
    imBild(tA,()=>{ const q=bahnOrt(p,v,1.65,tA), w=bahnTempo(v,1.65,tA), a=SCHWEIF, rest=life-tA; w[0]*=0.3; w[2]*=0.3;
      SCHWEIF=fl; psMid.emit(q.x,q.y,q.z,w[0],w[1],w[2],c[0]*0.95,c[1]*0.72,c[2]*0.3,rest,1.65,2,c[0]*0.45,c[1]*0.26,c[2]*0.06); SCHWEIF=a;
      const u=bahnOrt(q,w,1.65,rest);
      if(u.y<yb+0.6) imBild(rest-0.02,()=>{ const a2=SCHWEIF; SCHWEIF=0; psMid.emit(u.x,yb+0.02,u.z,0,0,0,0.55,0.3,0.06,1.0,0,0); SCHWEIF=a2; }); }); }},
  /* Knister: Mikrosterne, die dunkel steigen und oben einmal weiss aufplatzen */
  knister:{g:6,emit(x,y,z,vx,vy,vz,c,tA){ SCHWEIF=0;
    psMid.emit(x,y,z,vx,vy,vz,c[0],c[1],c[2],tA*rand(0.95,1.35),6,3); }}
};

/* ---------- 3. Bausteine ---------- */
/* Ein Funkenstrahl aus Duese p in Richtung d: Hoehe h (senkrecht),
   Kegel kg (rad), rate je s, Material, Farben A/B mit Anteil mb.
   schl: eigener Zaehler je Strahl. Tempo gestreut (sv, Std. 0,25): die
   langsamen Funken bleiben unten - dicht an der Duese, locker oben wie
   eine echte Garbe. Rueckgabe: Steigzeit. */
function fkStrahl(e,dt,p,d,h,kg,rate,mat,A,B,mb,schl,sv){
  const M=FUNKE[mat]||FUNKE.kohle, dy=Math.max(0.35,d[1]), v0=fkV0(h,M.g)/dy, tA=fkTA(v0*dy,M.g), alt=SCHWEIF, s=sv===undefined?0.25:sv;
  for(let n=fkJe(e,schl||'aS',rate,dt);n>0;n--){ const r=fkKegel(d,kg), w=v0*(1-s*Math.random()), c=mb&&Math.random()<mb?B:A;
    M.emit(p.x,p.y,p.z,r[0]*w,r[1]*w,r[2]*w,c,tA*(0.75+0.25*w/v0),e); }
  SCHWEIF=alt; return tA;
}
/* Duesenflamme (28.09., Tom: echt): der Satz brennt an der Duese mit einer
   kleinen, hellen, flackernden Flamme - weissgelber Kern, warmer Rand; bei
   Farbfontaenen traegt nur sie die Farbe (theatrefx, echt.md 1.7). Aus
   vielen kleinen Flammenzungen, nie ein Leuchtball; hoechstens so breit
   wie der Platz bis zum Rand des Produkts (e.spielraum). gr 1 = ~20 cm hoch. */
function fkFlamme(e,dt,o,c,gr,key){
  const st=e.staerke===undefined?1:e.staerke, k=key||'fl', R=Math.max(0.006,Math.min(0.035*gr,(e.spielraum!==undefined?e.spielraum:0.05)*0.8)), alt=SCHWEIF;
  /* in der Tiefe hoechstens bis zur Kartonwand */
  const dd=P[e.prod]&&P[e.prod].dims, Rz=dd?Math.max(0.005,Math.min(R,dd[2]/2-0.015)):R;
  const f=e[k+'F']=clamp((e[k+'F']||1)+rand(-0.3,0.3),0.5,1.4), yy=o.y+0.015;
  SCHWEIF=0.04;
  for(let n=fkJe(e,k,80*gr*st*f,dt);n>0;n--){ const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random()), kern=Math.random()<0.5, w=rand(1.3,2.6)*Math.sqrt(gr), ox=Math.cos(a)*r*R, oz=Math.sin(a)*r*Rz;
    const cc=kern?[1.3,1.12,0.78]:c?[c[0]*1.35+0.08,c[1]*1.35+0.08,c[2]*1.35+0.08]:[1.25,0.6,0.14];
    (kern?psSmall:psMid).emit(o.x+ox,yy,o.z+oz,-ox*2,w,-oz*2,cc[0],cc[1],cc[2],rand(0.05,0.12)*(kern?0.8:1.25)*Math.sqrt(gr),-3,0); }
  SCHWEIF=alt;
}
/* Licht der Fontaene: warm flackernd, schwach (echt.md 1.10: kein
   Buehnenscheinwerfer); Silber kuehl-weiss, Gold warm */
function fkLicht(e,o,y,c,st,weite){ if(st<0.03) return; licht('fk'+fkId(e),{x:o.x,y,z:o.z},c||FW.bernstein,st*rand(0.75,1.1),{boden:fkBoden(o.x,o.z),weite:weite||8}); }
/* Rauch: jede echte Fontaene raucht - graue Schwaden steigen ueber der
   Duese auf und ziehen mit dem Wind. Nur die erste Duese eines Sets
   raucht (dichte gilt fuers ganze Set). */
function fkRauch(e,dt,o,h,dichte){
  if(e.nr||(e.staerke!==undefined&&e.staerke<0.3)) return;
  e.rT=(e.rT===undefined?rand(0.1,0.4):e.rT)-dt; if(e.rT>0) return;
  const H=Math.max(0.3,h||1); e.rT=rand(0.55,0.95)/(dichte||1);
  const r=Math.min(2.2,0.28+H*0.12), y=o.y+rand(0.15,0.3)+Math.min(H*0.3,4)*Math.random();
  rauchball({x:o.x+rand(-0.08,0.08),y,z:o.z+rand(-0.08,0.08)},{r,n:2,dauer:rand(3.2,4.6),quellen:1.4,steigen:rand(0.35,0.6),wind:[rand(0.25,0.45),rand(-0.05,0.1)],c:[0.5,0.46,0.42],a:0.13});
}
/* Farbsterne ("micro stars", HEX): kleine Farbsterne ohne Spur steigen im
   Strahl mit und verloeschen um den Scheitel - so ist eine Fontaene
   farbig, ohne dass ihre Funken farbig sind. F: Liste der Farben (<= 2) */
function fkSterne(e,dt,p,d,h,kg,rate,F,key,o){
  o=o||{}; const alt=SCHWEIF, ps=o.ps||psMid, hl=o.hell||1.35; SCHWEIF=o.spur||0;
  for(let n=fkJe(e,key||'aP',rate,dt);n>0;n--){ const r=fkKegel(d,kg), hh=h*rand(o.hMin||0.55,1.0), w=fkV0(hh,6)/Math.max(0.4,r[1]), tA=fkTA(w*r[1],6), c=F[Math.floor(Math.random()*F.length)];
    SCHWEIF=o.spur?fkSpur(o.spur,r[0]*w,r[1]*w,r[2]*w,0.12):0;
    ps.emit(p.x,p.y,p.z,r[0]*w,r[1]*w,r[2]*w,c[0]*hl,c[1]*hl,c[2]*hl,tA*rand(0.95,1.3),6,0); }
  SCHWEIF=alt;
}
/* Komet (Glutbrocken, Brokatkomet): schwerer Stern, der auf seiner Bahn
   Funken verliert und im Flug verlischt; trifft er vorher Tisch oder
   Boden, zerspringt er dort in ein paar huepfende Funken. Alles nach dem
   Start laeuft ueber imBild auf der Bahn (Folge-Funken, kein Ursprung). */
function fkKomet(p,v,g,life,c,o){
  o=o||{}; const ps=o.ps||psBig, alt=SCHWEIF, i=ps.next; SCHWEIF=o.spur!==undefined?o.spur:0.05;
  ps.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0],c[1],c[2],life,g,o.mode||0);
  SCHWEIF=alt; const mx=ps.maxl[i]=life*(1+Math.random()*1e-4)+1e-5;
  /* Aufschlag: erster Zeitpunkt unter Tisch- oder Bodenhoehe */
  let tl=null;
  for(let t=0.1;t<life;t+=0.05){ const q=bahnOrt(p,v,g,t); if(q.y<fkBoden(q.x,q.z)+0.04&&bahnTempo(v,g,t)[1]<0){ tl=t; break; } }
  const ende=tl===null?life:tl, takte=Math.max(2,Math.round(ende/0.06)), n=o.funken===undefined?3:o.funken, fc=o.funkenFarbe||[1,0.72,0.3];
  for(let k=1;k<takte;k++){ const t=k*ende/takte;
    imBild(t,()=>{ const q=bahnOrt(p,v,g,t), w=bahnTempo(v,g,t), a=SCHWEIF; SCHWEIF=0.05;
      for(let j=0;j<n;j++) psMid.emit(q.x,q.y,q.z,w[0]*0.25+rand(-0.5,0.5),w[1]*0.25+rand(-0.7,0.3),w[2]*0.25+rand(-0.5,0.5),fc[0],fc[1],fc[2],rand(0.25,0.6),4,4);
      SCHWEIF=a; }); }
  if(tl!==null) imBild(tl,()=>{ if(ps.maxl[i]!==mx||ps.life[i]<=0) return; ps.life[i]=0.01;
    const q=bahnOrt(p,v,g,tl), yb=fkBoden(q.x,q.z)+0.03, a=SCHWEIF; SCHWEIF=0.04;
    for(let j=0;j<(o.zerspringt||5);j++){ const b=Math.random()*Math.PI*2, s=rand(0.6,2.2);
      psMid.emit(q.x,yb,q.z,Math.cos(b)*s,rand(0.8,2.4),Math.sin(b)*s,fc[0],fc[1]*0.85,fc[2]*0.6,rand(0.25,0.55),7,0); }
    SCHWEIF=a; if(o.klang!==false&&Math.random()<0.3) schall(q,vv=>sfx.klick(vv*0.35,rand(0.6,1))); });
}

/* ---------- 4. Emitter ---------- */
/* gerb: die parametrische Zylinderfontaene. Felder: hm/hKurve/hStufen,
   kegel (Grad, Std. 10), dichte (je s), funke, A/B/mischB, sv (Tempostreuung),
   flamme:'<farbe>'|[farbe,farbe] (Flammenfuss; Liste = Farbwechsel alle
   wechsel s mit Dunkelphase), flammeGross, sterne:'B'|[farben]
   (Farbsterne), sterneRate, krone:{funke,A} (zweite Funkenart: langsamer,
   weiter, faellt als Krone), kernB, knisterLeise, knister (je s), dunkel
   (s ohne Funken am Anfang, nach einem Zauberpuff), rauch (Faktor, 0 = aus) */
function fkFlammenFarbe(e,ph){
  const F=ph.flamme; if(!F) return null; if(!Array.isArray(F)||typeof F[0]==='number') return farbe(F);
  /* Farbwechsel im Satz: A ... 0,15 s dunkel ... B (dark relay) */
  const w=ph.wechsel||1.6, j=Math.floor(e.alter/w), rest=e.alter-j*w;
  return rest<0.15&&j>0?'aus':farbe(F[j%F.length]);
}
NEU_EMIT.gerb=(e,dt,o)=>{
  const ph=e.ph, q=QUAL(), st=e.staerke, mat=ph.funke||'kohle';
  let h=Math.max(0.2,e.hAkt||2);
  /* Zauberbrunnen: 0,4 s vor dem Puff saugt der Brunnen sich ein - die
     Saeule schrumpft, ein Ansaugen, dann der Puff */
  if(ph.ende&&ph.ende.startsWith('zauberpuff')){ const rest=e.dauer-e.alter;
    if(rest<0.4){ h=Math.max(0.2,h*rest/0.4); if(!e.saug&&!e.nr){ e.saug=true; sfx.ansaugen(distVol(o)*0.8); } } }
  fkKlang(e,o,dt);
  if(ph.dunkel&&e.alter<ph.dunkel) return;
  const fc=fkFlammenFarbe(e,ph), gross=ph.flammeGross||Math.min(2.2,0.7+h*0.12);
  if(fc!=='aus') fkFlamme(e,dt,o,fc,gross);
  const kg=((e.kegelAkt!==undefined?e.kegelAkt:ph.kegel)||10)*Math.PI/180, d=e.dir||[0,1,0];
  const rate=(e.dichteAkt||Math.min(620,170+42*h))*q*st, p={x:o.x,y:o.y+0.03,z:o.z};
  fkStrahl(e,dt,p,d,h,kg,ph.kernB?rate*0.75:rate,mat,e.A,e.B,ph.mischB||0,'aS',ph.sv);
  /* Kern in B: enger, etwas hoeher */
  if(ph.kernB) fkStrahl(e,dt,p,d,h*1.05,kg*0.3,rate*0.3,'titan',e.B,e.B,0,'aK');
  /* Farbsterne im Strahl (hoechstens zwei Farben) */
  if(ph.sterne){ const F=ph.sterne==='B'?[e.B]:ph.sterne.map(farbe).filter(Boolean);
    fkSterne(e,dt,p,d,h,kg*0.8,(ph.sterneRate||4)*st,F,'aSt',{ps:h>6?psBig:psMid,hell:h>6?1.1:1.4}); }
  /* Krone: eine zweite, schwerere Funkenart aus derselben Duese - weiter
     gestreut und laenger brennend, sie faellt oben als Krone auseinander */
  if(ph.krone&&ph.krone.funke){ const c=farbe(ph.krone.A)||FW.gold;
    fkStrahl(e,dt,p,d,h*1.02,kg*1.9,120*q*st,ph.krone.funke,c,c,0,'aKr',0.15); }
  /* Knister: Mikrosterne aus der Duese, die oben einzeln aufknacken;
     Titan knackt ab und zu leise mit */
  const kn=(ph.knister||0)+(mat==='titan'?0.7:0)+(ph.knisterLeise?5*ph.knisterLeise:0)+(mat==='knister'?28:0);
  if(kn>0){ fkStrahl(e,dt,p,d,h*0.98,kg*1.1,kn*2.5*q*st,'knister',[0.9,0.85,0.7],null,0,'aKm');
    for(let n=fkJe(e,'aKn',kn*st,dt);n>0;n--){ const r=fkKegel(d,kg), yy=h*rand(0.6,1.0);
      knisterPop(o.x+r[0]/Math.max(0.3,r[1])*yy,o.y+yy,o.z+r[2]/Math.max(0.3,r[1])*yy,{laut:0.3,leise:Math.random()<0.4,funken:7}); } }
  if(ph.rauch!==0) fkRauch(e,dt,o,h,ph.rauch||1);
  if(!e.nr) fkLicht(e,o,o.y+Math.min(h*0.35,3),mat==='titan'||mat==='glitter'&&ph.A==='silber'?[0.85,0.88,1]:FW.bernstein,Math.min(1.6,0.9+h*0.06)*st,Math.min(16,6+h)); /* 28.09., Tom: echt - vorher bis 2,4: der Platz wurde taghell wie unter Scheinwerfern */
};

/* torte mit kalt/diamant (Eissterne): Kaltfunken, die auf halber
   Fallhoehe verloeschen - unten kommt nichts an; im Zeitfenster diamant
   blitzen 30 % im Scheitel einmal weiss auf. Ohne die Optionen bleibt
   torte wie bisher (Shows, Nebenrolle). */
const FK_TORTE=NEU_EMIT.torte;
NEU_EMIT.torte=(e,dt,o)=>{
  if(!e.font||!e.ph||!e.ph.kalt) return FK_TORTE(e,dt,o);
  const ph=e.ph, h=Math.max(0.1,e.hAkt||0.5), st=e.staerke, v0=fkV0(h,6), tA=fkTA(v0,6), alt=SCHWEIF;
  const tf=Math.sqrt(h/6), life=tA+tf*0.9, dm=ph.diamant&&e.u>=ph.diamant[0]&&e.u<=ph.diamant[1];
  /* feine Striche im offenen Faecher statt dichter Punktsaeule (Probebild) */
  SCHWEIF=0.12;
  for(let n=fkJe(e,'aT',170*QUAL()*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, s=rand(0.2,0.95)*Math.sqrt(h/0.5), c=Math.random()<0.5?e.A:e.B;
    const vx=Math.cos(a)*s, vz=Math.sin(a)*s, vy=v0*rand(0.85,1);
    if(dm&&Math.random()<0.3) glint(psSmall,o.x,o.y+0.02,o.z,vx,vy,vz,c,6,{tz:tA*rand(0.85,1.05),dim:0.8,blitz:3.2,blitzFarbe:[1,1,1],glimm:0.5,rest:tf*0.5});
    else psSmall.emit(o.x,o.y+0.02,o.z,vx,vy,vz,c[0]*0.85,c[1]*0.85,c[2]*0.9,life*rand(0.85,1),6,0); }
  SCHWEIF=alt;
  /* ganz leises Zischen, kein Rauch */
  e.kl=(e.kl||0)-dt; if(e.kl<=0&&!e.nr){ e.kl=rand(0.6,1.0); sfx.zischen(distVol(o)*0.3*st,0.7); }
};

/* hoerner (Feuerteufel): zwei Strahlen aus einer Duese, +/- spreiz Grad
   quer zum Blick; Kohlefunken, die zur Spitze rot abkuehlen.
   28.09., Tom: echt - die roten Flammenzungen an den Hornspitzen (Leucht-
   baelle in der Luft) sind weg; die Flamme brennt an der Duese. */
NEU_EMIT.hoerner=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), q=QUAL(), st=e.staerke, h=Math.max(0.2,e.hAkt||1.5);
  const ziel=(ph.spreiz||0)*Math.PI/180; if(Z.sp===undefined) Z.sp=ziel; Z.sp+=(ziel-Z.sp)*Math.min(1,dt*5.5);
  fkKlang(e,o,dt);
  e.kohleB=e.B; const p={x:o.x,y:o.y+0.03,z:o.z};
  Z.spitzen=Z.spitzen||[];
  fkFlamme(e,dt,o,null,0.9);
  const tAh=fkTA(fkV0(h,6),6); if(Z.hg===undefined) Z.hg=h; Z.hg+=(h-Z.hg)*Math.min(1,dt/Math.max(0.2,tAh));
  for(const s of [-1,1]){ const a=Z.sp*s, d=[Math.sin(a),Math.cos(a),0];
    fkStrahl(e,dt,p,d,h,0.06,190*q*st,ph.funke||'kohle',e.A,e.B,ph.mischB||0,s<0?'hL':'hR',0.3);
    /* Spitze = Gipfel der Bahn eines mittleren Funkens (fuers Lachen) */
    const w=fkV0(Z.hg,6)/Math.max(0.35,d[1])*0.93, tA=fkTA(w*d[1],6), sp=bahnOrt(p,[d[0]*w,d[1]*w,0],6,tA); Z.spitzen[s<0?0:1]={x:sp.x,y:sp.y,z:o.z}; }
  fkRauch(e,dt,o,h,0.8);
  fkLicht(e,o,o.y+h*0.4,FW.orange,1.1*st*Math.min(1,h/1.5),7);
  /* Teufelslachen: ha - ha - ha, drei Knisterstoesse an beiden Spitzen -
     Knistersterne, die mit den Funken dort oben ankommen */
  if(e.lachen&&!e.gelacht){ e.gelacht=true; const v=distVol(o);
    for(let i=0;i<3;i++) later(0.1+i*0.35,()=>{
      for(const t of Z.spitzen) if(t){ knisterWolke(t,18+i*4,0.14,0.3,{laut:0.5+i*0.25}); flash(t,FW.orange,0.8+i*0.4,0.1); }
      sfx.crackle(v*(0.7+i*0.35)); }); }
};

/* perlen (Gummibaerchen): kleine Silberfontaene, in der farbige Perlen
   (Mikrosterne) mitsteigen und oben verloeschen. 28.09., Tom: echt -
   vorher Neon-Kleckse, die auf dem Boden huepften, und ein Platz, der sich
   magenta und gruen faerbte (echt.md: Lichtshow). Farben Rot und Gruen. */
NEU_EMIT.perlen=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||1.6, p={x:o.x,y:o.y+0.02,z:o.z};
  fkKlang(e,o,dt);
  fkFlamme(e,dt,o,null,0.6);
  fkStrahl(e,dt,p,[0,1,0],h*0.8,0.15,150*q*st,'titan',FW.silber,FW.weiss,0.3,'gU',0.45);
  const F=(ph.perlen||[e.A]).map(farbe).filter(Boolean);
  fkSterne(e,dt,p,[0,1,0],h,0.22,(ph.rate||6)*st,F,'gS',{hMin:0.6,hell:1.5,spur:0.03});
  fkRauch(e,dt,o,h,0.6);
  if(!e.nr) fkLicht(e,o,o.y+0.5,[0.9,0.92,1],0.8*st,5);
};

/* bodenring (Feuerkreis): der Karton spruehet aus seinem Rand ringsum
   flach nach aussen; die Funken fliegen niedrige Boegen und landen im
   Abstand radius ([von,bis] ueber die Phase). Wo sie aufschlagen, springen
   sie kurz auf und glimmen - so entsteht der Glutring. 28.09., Tom: echt -
   vorher entstanden Glutsaum und Huepfer direkt am Ring (bis 2,2 m neben
   dem Karton) und der Ring "atmete". */
NEU_EMIT.bodenring=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), alt=SCHWEIF, R=bereich(ph.radius||1.5,e.u);
  fkKlang(e,o,dt);
  /* Duesen im Rand des Kartons */
  const rd=Math.max(0.01,Math.min(0.06,(e.spielraum!==undefined?e.spielraum:0.06))), y0=o.y-0.02;
  const hb=Math.min(40,(ph.hebung||6)*3.5)*Math.PI/180, T=0.6, f=(1-Math.exp(-ZIEH*T))/ZIEH, hp=ph.huepfer?0.4:0.22;
  for(let n=fkJe(e,'rS',380*q*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, RR=Math.max(0.1,R*rand(0.8,1.08)), w=RR/(Math.cos(hb)*f), c=Math.random()<0.35?e.B:e.A;
    const P0={x:o.x+Math.cos(a)*rd,y:y0,z:o.z+Math.sin(a)*rd}, V0=[Math.cos(a)*Math.cos(hb)*w,Math.sin(hb)*w,Math.sin(a)*Math.cos(hb)*w], gg=Math.max(1,V0[1]*f*ZIEH/(T-f));
    /* wo und wann er landet (Tisch oder, hinter der Tischkante, Boden) */
    let tl=T*2.2; for(let t=T*0.5;t<T*2.2;t+=0.03){ const qq=bahnOrt(P0,V0,gg,t); if(qq.y<fkBoden(qq.x,qq.z)+0.02){ tl=t; break; } }
    SCHWEIF=0.12;
    psMid.emit(P0.x,P0.y,P0.z,V0[0],V0[1],V0[2],c[0],c[1]*0.92,c[2]*0.8,tl,gg,2,c[0]*0.7,c[1]*0.25,c[2]*0.05);
    /* ein Teil springt beim Aufschlag noch einmal flach auf */
    if(Math.random()<hp) imBild(tl,()=>{ const u=bahnOrt(P0,V0,gg,tl), w2=bahnTempo(V0,gg,tl), yb=fkBoden(u.x,u.z)+0.02, a2=SCHWEIF; SCHWEIF=0.05;
      psMid.emit(u.x,yb,u.z,w2[0]*0.45,rand(0.6,1.5),w2[2]*0.45,1,0.62,0.18,rand(0.25,0.45),6,2,0.6,0.15,0.02); SCHWEIF=a2; }); }
  SCHWEIF=alt;
  fkFlamme(e,dt,o,null,0.7);
  fkRauch(e,dt,o,0.6,0.7);
  fkLicht(e,o,o.y+0.3,FW.orange,1.3*st,Math.max(4,R*3));
};

/* lava (Feuerberg): grollen = der Krater schwelt: Rauch, tiefes Wummern,
   niedrige Glutfunken; auswurf = schwere Glutbrocken (Kometen aus Kohle),
   die in Boegen fliegen, Funken verlieren und im Flug verloeschen - wer
   aufschlaegt, zerspringt in Funken; ausbruch = stoss Brocken auf einmal.
   28.09., Tom: echt - keine Lavapfuetzen, kein pulsierendes Kraterlicht. */
function fkBrocken(o,A,B,hSpanne,weite){
  const h=Array.isArray(hSpanne)?rand(hSpanne[0],hSpanne[1]):hSpanne, a=Math.random()*Math.PI*2, c=Math.random()<0.6?A:B, v0=fkV0(h,5)*rand(0.85,1);
  const w=rand(0.6,1.6)*(weite||1)*Math.sqrt(h/3);
  fkKomet({x:o.x+rand(-0.02,0.02),y:o.y+0.05,z:o.z+rand(-0.02,0.02)},[Math.cos(a)*w,v0,Math.sin(a)*w],5,fkTA(v0,5)*rand(1.4,2.1),[c[0]*1.05,c[1]*0.55+0.05,c[2]*0.2],{funken:3,funkenFarbe:[1,0.55,0.15],zerspringt:6});
}
NEU_EMIT.lava=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), m=ph.modus||'auswurf', A=e.A, B=e.B;
  if(!e.font) e.alter=(e.alter||0)+dt;
  fkKlang(e,o,dt);
  if(m==='grollen'){
    /* Schwelen: rote Glut an der Duese, ab und zu ein paar Funken */
    fkFlamme(e,dt,o,FW.rot,0.5);
    fkStrahl(e,dt,{x:o.x,y:o.y+0.03,z:o.z},[0,1,0],0.9,0.3,26*q*st,'kohle',FW.orange,FW.rot,0.4,'lF',0.6);
    fkRauch(e,dt,o,1.5,1.6);
  } else {
    fkFlamme(e,dt,o,null,1.3);
    if(ph.unterbau){ const u=ph.unterbau; e.kohleB=FW.rot; fkStrahl(e,dt,{x:o.x,y:o.y+0.03,z:o.z},[0,1,0],u.hm||1.5,0.2,170*q*st,u.funke||'kohle',FW.orange,FW.gold,0.3,'lU',0.4); }
    if(m==='ausbruch'&&!e.stoss){ e.stoss=true; const v=distVol(o), hm=typeof ph.hm==='number'?ph.hm:4.5;
      for(let i=0;i<(ph.stoss||12);i++) fkBrocken(o,A,B,[hm*0.6,hm],1.4);
      flash({x:o.x,y:o.y+0.8,z:o.z},FW.orange,2.4,0.25); sfx.boom(v*0.45); sfx.fauchen(v,1.2,true); }
    const r=bereich(ph.rate||(m==='ausbruch'?2:4),e.u);
    for(let n=fkJe(e,'lB',r*st,dt);n>0;n--) fkBrocken(o,A,B,ph.hm||[2,4],1);
    fkRauch(e,dt,o,3,1.3);
  }
  fkLicht(e,o,o.y+0.6,FW.orange,(m==='grollen'?0.8:1.6)*st,9);
};

/* bluetenwerfer (Bluetenbrunnen): Unterbau-Fontaene, dazu Sterne, die in
   60-90 % der Hoehe leise zu Mini-Chrysanthemen aufplatzen (nie darueber).
   Bluete in der Farbe des Produkts (Rot), Stempel Silber oder Gold.
   28.09., Tom: echt - Bluetensterne als kleine Sterne (psMid) statt
   grosser Leuchtpunkte, die zu roten Nebelbaellen verschwammen. */
NEU_EMIT.bluetenwerfer=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||2.5, bl=ph.bluete||{}, c=farbe(bl.farbe)||e.B, alt=SCHWEIF;
  fkKlang(e,o,dt);
  fkFlamme(e,dt,o,null,1);
  fkStrahl(e,dt,{x:o.x,y:o.y+0.03,z:o.z},[0,1,0],h,0.16,250*q*st,ph.funke||'titan',e.A,e.A,0,'bU',0.35);
  for(let n=fkJe(e,'bS',bereich(bl.rate||3,e.u)*st,dt);n>0;n--){
    const perle=bl.art==='perle', hb=h*(perle?rand(0.8,1.0):rand(0.55,0.8)), d=fkKegel([0,1,0],perle?0.45:0.26), w=fkV0(hb,6)/Math.max(0.5,d[1]), tA=fkTA(w*d[1],6), p={x:o.x,y:o.y+0.03,z:o.z}, v=[d[0]*w,d[1]*w,d[2]*w];
    /* Perlen: helle Sterne mit kurzer Spur, breit gefaechert */
    if(perle){ SCHWEIF=fkSpur(0.08,v[0],v[1],v[2],0.15); psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*1.3+0.1,c[1]*1.3+0.1,c[2]*1.3+0.1,tA*rand(1.05,1.3),6,0); continue; }
    SCHWEIF=0.06; psMid.emit(p.x,p.y,p.z,v[0]*0.97,v[1]*0.97,v[2]*0.97,c[0]*0.5,c[1]*0.5,c[2]*0.5,tA,6,0);
    imBild(tA,()=>{ const b=bahnOrt(p,v,6,tA), reis=bl.art==='reis', n2=Math.round((bl.funken||34)*q), gr=reis?1.5:2.1, a2=SCHWEIF, st2=farbe(bl.stempel)||[1,1,1];
      SCHWEIF=reis?0:0.08;
      for(let k=0;k<n2;k++){ const dd=randDir(), s=gr*rand(0.7,1.05);
        psMid.emit(b.x,b.y,b.z,dd[0]*s,dd[1]*s,dd[2]*s,c[0]*1.2+0.1,c[1]*1.2+0.1,c[2]*1.2+0.1,reis?rand(0.3,0.45):rand(0.6,0.95),2.5,reis?0:2,c[0]*0.5,c[1]*0.5,c[2]*0.5); }
      /* Stempel: kleiner heller Kern in Gold/Silber */
      SCHWEIF=0;
      for(let k=0;k<(reis?0:8);k++){ const dd=randDir(), s=rand(0.6,1.1); psMid.emit(b.x,b.y,b.z,dd[0]*s,dd[1]*s,dd[2]*s,st2[0],st2[1],st2[2],rand(0.4,0.6),2.5,0); }
      SCHWEIF=a2;
      if(!reis||Math.random()<0.25) schall(b,vv=>sfx.plopp(vv*0.18,2.2)); }); }
  SCHWEIF=alt;
  fkRauch(e,dt,o,h,1);
  fkLicht(e,o,o.y+1,ph.funke==='titan'?[0.85,0.88,1]:FW.bernstein,1.3*st,9);
};

/* popcorn (Popcorn): kleiner Kohlekegel je Duese, Knallsterne nach
   knallKurve (Zeit -> Knall/s, auf die Duesen verteilt); jeder Knall
   laesst ein kleines Rauchwoelkchen stehen */
function fkKorn(o,hk,wk){
  const h=Array.isArray(hk)?rand(hk[0],hk[1]):(hk||2), w=fkV0(h,6), tA=fkTA(w,6), p={x:o.x,y:o.y+0.03,z:o.z}, a=Math.random()*Math.PI*2, s=rand(0,0.5), v=[Math.cos(a)*s,w,Math.sin(a)*s], alt=SCHWEIF;
  SCHWEIF=0.06; psMid.emit(p.x,p.y,p.z,v[0],v[1],v[2],1.2,1.0,0.7,tA,6,0); SCHWEIF=alt;
  imBild(tA,()=>{ const b=bahnOrt(p,v,6,tA), a2=SCHWEIF; SCHWEIF=0;
    psBig.emit(b.x,b.y,b.z,0,0,0,2,1.9,1.7,0.04,0,0);
    for(let k=0;k<9;k++){ const d=randDir(), s2=rand(2,4); psSmall.emit(b.x,b.y,b.z,d[0]*s2,d[1]*s2,d[2]*s2,1,0.85,0.55,rand(0.12,0.28),3,0); }
    SCHWEIF=a2;
    rauchball({x:b.x,y:b.y,z:b.z},{r:0.2,n:2,dauer:(wk||0.8)+1.2,quellen:0.3,steigen:0.1,wind:[0.2,0],c:[0.62,0.61,0.6],a:0.32});
    schall(b,vv=>sfx.crack(vv*rand(0.5,0.8))); });
}
NEU_EMIT.popcorn=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), n=DUESEN_STD.reihe3.length;
  if(ph.nachzuegler){ if(!e.los){ e.los=true; fkKorn(o,2.4,1.2); } return; }
  fkFlamme(e,dt,o,null,0.7);
  fkStrahl(e,dt,{x:o.x,y:o.y+0.03,z:o.z},[0,1,0],(e.hAkt||1.5)*(0.92+0.1*Math.sin(e.alter*2.3+e.nr*1.7)),0.3,150*q*st,'kohle',e.A,FW.orange,0.25,'pU',0.4);
  fkKlang(e,o,dt);
  /* Knall-Rate aus der Kurve (Stuetzpunkte [t, Knall/s]) */
  const K=ph.knallKurve||[[0,2]], t=e.alter; let r=K[K.length-1][1];
  for(let i=1;i<K.length;i++) if(t<K[i][0]){ const [t0,r0]=K[i-1], [t1,r1]=K[i]; r=r0+(r1-r0)*clamp((t-t0)/Math.max(0.001,t1-t0),0,1); break; }
  for(let k=fkJe(e,'pK',r/n,dt);k>0;k--) fkKorn(o,ph.knallHoehe||[1.5,3],ph.woelkchen);
  fkRauch(e,dt,o,1.5,0.6);
  if(!e.nr) fkLicht(e,o,o.y+0.6,FW.bernstein,1.2*st,8);
};

/* saxon (Drehsonne): das Rad mit zwei Treibern sitzt auf seinem Gestell
   am Tischplatz (Abschnitt 6); Drehrichtung dreh, Drehzahl ups (Rampe);
   stottern: Rad stockt, Funken setzen aus; beide: beide Treiber; knister:
   Knistersatz in den Treibern. 28.09., Tom: echt - vorher erschien beim
   Zuenden ein 2-m-Pfahl mit Rad ueber dem Karton, die Nabe war ein
   farbiger Leuchtball. */
const FK_MAT={};
const FK_RAD=0.27, FK_NABE=0.12; /* Radius; Nabe 12 cm ueber der Oberkante des Kartons */
function fkMat(c,em){ const k=c+'|'+(em||0); return FK_MAT[k]||(FK_MAT[k]=new THREE.MeshStandardMaterial({color:c,roughness:0.8,emissive:em||0})); }
NEU_EMIT.saxon=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), c0={x:o.x,y:o.y+FK_NABE,z:o.z};
  if(!Z.g){ Z.g=fkGestellBei(o,e.prod)||fkGestellLose(o,e.prod,FONT[e.prod]?fontDauer(FONT[e.prod])-e.alter+1:8); }
  const rad=Z.g&&Z.g.userData.rad;
  const ziel=(ph.dreh||0)*bereich(ph.ups===undefined?3:ph.ups,e.u)*Math.PI*2;
  Z.om=Z.om===undefined?ziel:Z.om+(ziel-Z.om)*Math.min(1,dt*(ph.stottern?7:1.6));
  Z.w=(Z.w||0)+Z.om*dt; if(rad) rad.rotation.z=Z.w;
  fkKlang(e,o,dt,Math.min(1,0.4+Math.abs(Z.om)/30));
  fkLicht(e,c0,c0.y,ph.funke==='titan'?[0.85,0.88,1]:FW.bernstein,1.4*st,7);
  /* Stottern: Aussetzer und zwei kurze Zischer */
  if(ph.stottern){ if(!e.zz){ e.zz=true; const v=distVol(o); sfx.zischen(v*0.6,0.12); later(0.3,()=>sfx.zischen(v*0.6,0.15)); }
    if(e.alter<0.3||(e.alter>0.42&&e.alter<0.5)) return; }
  /* jeder Funke bekommt seinen eigenen Zeitpunkt im Bild: Winkel
     zurueckgerechnet, und er ist um genau diese Zeit schon geflogen - so
     entsteht die durchgehende Spirale statt Speichen */
  const R=FK_RAD, dreh=Math.sign(Z.om)||ph.dreh||1, M=FUNKE[ph.funke||'kohle'], treiber=ph.beide?[0,Math.PI]:[0], tan=Math.abs(Z.om)*R, sp=ph.funke==='titan'?1.25:1;
  for(const off of treiber)
    for(let n=fkJe(e,'sT'+off,(ph.beide?240:320)*q*st,dt);n>0;n--){ const f=Math.random()*dt, a=Z.w+off-Z.om*f, px=c0.x+Math.cos(a)*R, py=c0.y+Math.sin(a)*R;
      /* Tangente in Drehrichtung; die Funken treten nach hinten aus */
      const tx=-Math.sin(a)*dreh, ty=Math.cos(a)*dreh, s=rand(5.5,8)*sp, c=ph.B&&Math.random()<0.4?e.B:e.A, sx=rand(-0.5,0.5);
      const vx=-tx*s+tx*tan+sx*0.3, vy=-ty*s+ty*tan+sx*0.3, vz=rand(-0.3,0.3), i=psMid.next;
      /* er verlaesst den Treiber am Rad und ist seit f Sekunden unterwegs */
      M.emit(px,py,c0.z,vx,vy,vz,c,0.7,e); psMid.pos[i*3]+=vx*f; psMid.pos[i*3+1]+=vy*f; psMid.pos[i*3+2]+=vz*f;
      if(ph.knister&&Math.random()<0.12) FUNKE.knister.emit(px,py,c0.z,vx*0.8,vy*0.8,rand(-0.3,0.3),[0.9,0.85,0.7],0.35); }
  if(ph.knister) for(let n=fkJe(e,'sK',ph.knister*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, r=rand(0.9,2.0);
    imBild(r/7,()=>knisterPop(c0.x+Math.cos(a)*r,c0.y+Math.sin(a)*r,c0.z+rand(-0.3,0.3),{laut:0.3,funken:5})); }
  fkRauch(e,dt,c0,1.2,0.8);
};

/* kreuz (Dreiklang): drei Fontaenen, die aeusseren zur Mitte geneigt -
   sie kreuzen sich ueber der mittleren. Silberfunken, blauer Flammenfuss
   (Farbe nur an der Duese). 28.09., Tom: echt - vorher drei reine Rot-,
   Gruen- und Blaustrahlen, die sich "additiv" zu Weiss mischten und den
   Platz einfaerbten (echt.md: Lichtshow). */
NEU_EMIT.kreuz=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||4, d=e.dir||[0,1,0];
  fkKlang(e,o,dt);
  const fc=fkFlammenFarbe(e,ph); if(fc!=='aus') fkFlamme(e,dt,o,fc,1.1);
  fkStrahl(e,dt,{x:o.x,y:o.y+0.03,z:o.z},d,h,(ph.kegel||6)*Math.PI/180,(ph.dichte||300)*q*st,ph.funke||'titan',e.A,e.B,ph.mischB||0,'kS',0.3);
  if(ph.knister) for(let n=fkJe(e,'kK',ph.knister*st,dt);n>0;n--){ const yy=h*rand(0.6,1); knisterPop(o.x+d[0]/Math.max(0.3,d[1])*yy,o.y+yy,o.z,{laut:0.3,leise:Math.random()<0.5,funken:6}); }
  fkRauch(e,dt,o,h,0.5);
  if(!e.nr) fkLicht(e,o,o.y+1.2,[0.85,0.88,1],1.4*st,9);
};

/* flammen (Feuerbrunnen): Kometenfontaene - eine grosse Flamme an der
   Duese, darueber ein Kohlestrahl, und in Stoessen schwere Brokatkometen,
   die 6-8 m steigen, Funken verlieren und im Fallen verloeschen.
   28.09., Tom: echt - vorher Flammenbaelle (grosse Leuchtsterne mit
   Blendenkreuz), die 3 s in der Luft standen. */
NEU_EMIT.flammen=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), SA=ph.stossAlle, H=ph.h||1;
  fkKlang(e,o,dt);
  fkFlamme(e,dt,o,null,1.6+H);
  e.kohleB=FW.rot;
  fkStrahl(e,dt,{x:o.x,y:o.y+0.03,z:o.z},[0,1,0],1.6+H*1.6,0.22,(150+100*H)*q*st,'kohle',FW.orange,FW.gold,0.3,'fU',0.45);
  e.st=(e.st===undefined?0.2:e.st)-dt;
  if(e.st<=0&&(!ph.stoesse||(e.nS||0)<ph.stoesse)){ e.nS=(e.nS||0)+1;
    e.st=SA===undefined?0.45:Array.isArray(SA)?rand(SA[0],SA[1]):SA;
    const n=Math.round((SA!==undefined&&(SA<0.25||SA[1]<0.25)?5:9)*Math.min(1.4,H)*q), v=distVol(o);
    for(let k=0;k<n;k++){ const a=Math.random()*Math.PI*2, hh=rand(4.5,7.5)*Math.min(1.25,0.75+H*0.3), vy=fkV0(hh,5), w=rand(0.3,1.5);
      fkKomet({x:o.x+rand(-0.02,0.02),y:o.y+0.05,z:o.z+rand(-0.02,0.02)},[Math.cos(a)*w,vy,Math.sin(a)*w],5,fkTA(vy,5)*rand(1.5,1.9),[1.25,0.62,0.16],{funken:4,funkenFarbe:[1,0.66,0.2],zerspringt:4,klang:false}); }
    flash({x:o.x,y:o.y+0.6,z:o.z},FW.orange,1.6*H,0.2);
    if(Math.random()<0.6) sfx.fauchen(v*0.7,0.5,true); }
  fkRauch(e,dt,o,3+H*2,1.4);
  fkLicht(e,o,o.y+1.2,FW.orange,(1.6+H*0.6)*st,11);
};

/* orgel (Wasserorgel): vier Silberfontaenen, jede ein eigener Satz, die
   in einer Zuendfolge einsetzen (wie eine Zuendschnurkette): einzeln von
   aussen nach innen, im Wechsel paarweise, als Welle, zum Schluss alle.
   Jeder Einsatz brennt voll hoch und verlischt natuerlich (0,25 s an,
   0,4 s aus). 28.09., Tom: echt - vorher hob und senkte sich jede Duese
   wie ein Wasserspiel (Hoehe als Sinus), die Perlen faerbten den Platz. */
function fkOrgelPlan(ph,n,T){
  const f=ph.figur, P=[];
  if(f==='einzeln'){ const folge=[0,n-1,1,n-2], s=T/folge.length; folge.forEach((i,k)=>P.push([i,k*s,s*1.35])); }
  else if(f==='paare'){ const s=ph.takt||0.8; for(let k=0,t=0;t<T-0.2;k++,t+=s) (k%2?[1,2]:[0,n-1]).forEach(i=>P.push([i,t,s*1.1])); }
  else if(f==='welle'){ const ab=ph.abstand||0.35, lang=ph.lang||1.4; for(let t=0,w=0;t<T-0.3;t+=ab*n+0.4,w++) for(let i=0;i<n;i++) P.push([w%2?n-1-i:i,t+i*ab,lang]); }
  else for(let i=0;i<n;i++) P.push([i,i*0.12,T-i*0.12]);
  return P;
}
NEU_EMIT.orgel=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), D=e.duesen||[-0.3,-0.1,0.1,0.3], n=D.length;
  if(!e.plan) e.plan=fkOrgelPlan(ph,n,e.dauer);
  const H=Array.isArray(ph.hm)?ph.hm:[ph.hm||4,ph.hm||4];
  let summe=0;
  for(const [i,t0,lang] of e.plan){ const t=e.alter-t0; if(t<0||t>lang) continue;
    const an=Math.min(1,t/0.25), aus=Math.min(1,(lang-t)/0.4), k=an*aus, h=(i===0||i===n-1?H[1]:H[0])*(0.35+0.65*an);
    const p=versetzt(o,D[i],0), key='w'+i;
    summe+=k;
    Z.fl=Z.fl||{}; const E=Z.fl[i]||(Z.fl[i]={spielraum:e.spielraum,staerke:1,prod:e.prod});
    E.staerke=k*st; fkFlamme(E,dt,p,null,0.9);
    fkStrahl(e,dt,{x:p.x,y:p.y+0.03,z:p.z},[0,1,0],h,0.08,(170+30*h)*q*st*k,ph.funke||'titan',e.A,FW.weiss,0.25,key,0.3);
    if(ph.perlen) fkSterne(e,dt,{x:p.x,y:p.y+0.03,z:p.z},[0,1,0],h,0.12,2*st*k,[e.B],key+'p',{hMin:0.7,hell:1.3}); }
  e.lautAkt=clamp(summe/2,0.2,1.3); fkKlang(e,o,dt);
  fkRauch(e,dt,o,Math.max(H[0],H[1]),0.6+summe*0.3);
  fkLicht(e,o,o.y+1.2,[0.85,0.9,1],1.2*st*clamp(summe/2,0.2,1.2),9);
};

/* niagara (Niagara): die Leine haengt zwischen den zwei Pfosten des
   Gestells (Abschnitt 6) ueber dem Tischplatz; an ihr haengen duesen
   kleine Silberfontaenen, die nach unten spruehen. Gezuendet wird unten
   am linken Pfosten: die Zuendschnur laeuft in 0,35 s hinauf und in 0,6 s
   die Leine entlang - der Vorhang oeffnet sich von links nach rechts; am
   Ende verloeschen die Duesen einzeln. Wo der Vorhang auf den Tisch
   trifft, spritzt es auf. 28.09., Tom: echt - vorher hing eine 2,4 m
   breite Leine 3 m ueber einem 16-cm-Zylinder, die Funken kamen bis 1,1 m
   neben dem Produkt heraus. */
NEU_EMIT.niagara=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), N=ph.duesen||9, alt=SCHWEIF;
  if(!Z.g){ Z.g=fkGestellBei(o,e.prod)||fkGestellLose(o,e.prod,FONT[e.prod]?fontDauer(FONT[e.prod])-e.alter+1:30); Z.t0=FW_UHR;
    Z.aus=[]; for(let i=0;i<N;i++) Z.aus.push(rand(0,1.6)); }
  const G=Z.g.userData, H=G.leineY, Bt=G.breite*0.94, dk=ph.dichteKurve?bereich(ph.dichteKurve,e.u):1, wind=ph.wind||0;
  fkKlang(e,o,dt);
  const hoch=(FW_UHR-Z.t0)/0.35, lauf=(FW_UHR-Z.t0-0.35)/0.6, xL=G.x-G.breite/2;
  /* Zuendschnur: unten am Pfosten angezuendet, hinauf und die Leine entlang */
  if(hoch<1){ const y=G.fussY+hoch*(H-G.fussY); psSmall.emit(xL,y,G.z,rand(-0.5,0.5),rand(-0.2,0.8),rand(-0.3,0.3),1.25,1,0.7,0.2,3,0); }
  else if(lauf<1){ const x=xL+lauf*G.breite; psSmall.emit(x,H,G.z,rand(-0.5,0.5),rand(-0.2,0.6),rand(-0.3,0.3),1.25,1,0.7,0.2,3,0); }
  SCHWEIF=0.09;
  for(let i=0;i<N;i++){
    const u=i/(N-1); if(u>lauf) continue;
    /* am Ende verloeschen die Duesen einzeln (jede ihr eigener Satz) */
    if(ph.ausduennen&&e.alter>e.dauer-Z.aus[i]) continue;
    const x=G.x+(u-0.5)*Bt, y=H-0.07, yb=fkBoden(x,G.z), fall=y-yb;
    for(let n=fkJe(e,'n'+i,70*dk*q*st,dt);n>0;n--){ const vy=-rand(0.8,2.6), vx=rand(-0.35,0.35)+wind, vz=rand(-0.2,0.2), c=Math.random()<0.4?e.B:e.A;
      const tl=(Math.sqrt(vy*vy+12*fall)+vy)/6, life=Math.max(0.3,tl*rand(0.95,1.1));
      psMid.emit(x+rand(-0.015,0.015),y,G.z+rand(-0.015,0.015),vx,vy,vz,c[0]*1.1,c[1]*1.1,c[2]*1.1,life,6,0);
      /* Aufschlag: ein Teil spritzt vom Tisch hoch */
      if(ph.spritzer&&Math.random()<0.35&&life>=tl*0.99){ const P0={x,y,z:G.z}, V0=[vx,vy,vz];
        imBild(tl,()=>{ const b=bahnOrt(P0,V0,6,tl), a2=SCHWEIF; SCHWEIF=0.04;
          psSmall.emit(b.x,yb+0.02,b.z,rand(-0.6,0.6),rand(1.4,2.6),rand(-0.4,0.4),0.9,0.95,1,rand(0.18,0.32),8,0); SCHWEIF=a2; }); } }
    /* Flaemmchen an jeder Duese: sie brennen nach unten */
    if(Math.random()<dt*30){ const a2=SCHWEIF; SCHWEIF=0.03; psSmall.emit(x,y,G.z,rand(-0.1,0.1),-rand(0.8,1.6),rand(-0.1,0.1),1.25,1.15,0.9,rand(0.05,0.1),0,0); SCHWEIF=a2; } }
  SCHWEIF=alt;
  if(lauf>0) fkRauch(e,dt,{x:G.x,y:H-0.3,z:G.z},0.5,0.9);
  fkLicht(e,{x:G.x,z:G.z},H-0.8,[0.85,0.9,1],1.4*st*dk*clamp(lauf,0,1),10);
};

/* wendel (Wendeltreppe): geneigte Duese, die mit ups Umdrehungen/s
   kreist - die Funken behalten ihre Richtung, die Saeule steigt als
   Schraube; zweite: gegenlaeufige Duese (Doppelhelix, Silber);
   neigKurve: die Schraube oeffnet sich zum Trichter. Tuerkise Sterne
   (sterne) als einzige Farbe. */
NEU_EMIT.wendel=(e,dt,o)=>{
  const ph=e.ph, Z=fkZ(e), st=e.staerke, q=QUAL(), h=e.hAkt||10, ng=e.neigAkt||0;
  fkKlang(e,o,dt);
  const ups=bereich(ph.ups===undefined?2:ph.ups,e.u); Z.phi=(Z.phi||0)+ups*Math.PI*2*dt;
  /* die Drehduese surrt, Tonhoehe mit der Drehzahl */
  if(!e.nr&&ups>0.3){ if(!Z.surr||Z.surrT<FW_UHR){ Z.surr=sfx.brummen(distVol(o)*0.35*st,120+60*ups,Math.min(4,e.dauer-e.alter)); Z.surrT=FW_UHR+Math.min(4,e.dauer-e.alter)-0.05; }
    else if(Z.surr&&Z.surr.f) Z.surr.f(120+60*ups*(ph.zweite?1.4:1)); }
  const D=[[Z.phi,e.A,e.B]]; if(ph.zweite){ const c=farbe(ph.zweite.A)||FW.silber; D.push([-Z.phi+Math.PI,c,c]); }
  const p={x:o.x,y:o.y+0.03,z:o.z};
  fkFlamme(e,dt,o,null,1.4);
  D.forEach(([phi,A,B],i)=>{ const d=[Math.sin(ng)*Math.cos(phi),Math.cos(ng),Math.sin(ng)*Math.sin(phi)];
    fkStrahl(e,dt,p,d,h,0.035,(ph.zweite?300:480)*q*st,ph.funke||'titan',A,B,0.25,'wd'+i,0.2);
    if(ph.sterne) fkSterne(e,dt,p,d,h,0.05,(ph.sterneRate||3)*st,ph.sterne.map(farbe),'wS'+i,{ps:psBig,hell:1.1,hMin:0.7}); });
  fkRauch(e,dt,o,h,1);
  fkLicht(e,o,o.y+2,[0.85,0.9,1],1.8*st,14);
};

/* lametta (Lametta): weiter Kegel aus Kamuro-Faeden, die oben haengen und
   langsam bis auf den Boden sinken; blaue Sterne sterneB/s dazwischen */
NEU_EMIT.lametta=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||6, kg=(e.kegelAkt||ph.kegel||40)*Math.PI/180, alt=SCHWEIF, p={x:o.x,y:o.y+0.03,z:o.z}, M=FUNKE.kamuro;
  fkKlang(e,o,dt);
  fkFlamme(e,dt,o,null,1.3);
  for(let n=fkJe(e,'lm',180*(ph.dichte||1)*q*st,dt);n>0;n--){
    /* flache Faeden fliegen weiter, nicht hoeher */
    const r=fkKegel([0,1,0],kg), hh=h*rand(0.8,1.0)*(0.55+0.45*r[1]), w=fkV0(hh,M.g)/Math.max(0.45,r[1]), tA=fkTA(w*r[1],M.g);
    M.emit(p.x,p.y,p.z,r[0]*w,r[1]*w,r[2]*w,e.A,tA,e); }
  if(ph.sterneB) fkSterne(e,dt,p,[0,1,0],h,kg*0.6,ph.sterneB*st,[e.B],'lS',{ps:psBig,hell:1.2,hMin:0.6});
  SCHWEIF=alt;
  fkRauch(e,dt,o,h,1);
  fkLicht(e,o,o.y+1,FW.bernstein,1.3*st,9);
};

/* saeule (Feuersaeule): 15-m-Saeule, die wie Eisen abkuehlt - erst
   weissgluehendes Titan, dann goldenes Eisen, das sich veraestelt, dann
   tiefe Kohleglut; die Funkenart wechselt ueber die Phasen (blende), die
   Farbe kommt aus der Funkenart selbst. 28.09., Tom: echt - vorher sechs
   Gluehfarben (Weiss bis Scharlach) als Farbschichten (echt.md: 2 Farben). */
NEU_EMIT.saeule=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||15, kg=(ph.kegel||7)*Math.PI/180, p={x:o.x,y:o.y+0.03,z:o.z};
  fkKlang(e,o,dt);
  fkFlamme(e,dt,o,null,2.2);
  e.kohleB=FW.rot;
  fkStrahl(e,dt,p,[0,1,0],h,kg,(ph.dichte||520)*q*st,ph.funke||'titan',e.A,e.B,ph.mischB||0,'sS',0.3);
  if(ph.knister) for(let n=fkJe(e,'sKn',ph.knister*st,dt);n>0;n--){ const r=fkKegel([0,1,0],kg), yy=h*rand(0.55,1.0);
    knisterPop(o.x+r[0]/Math.max(0.3,r[1])*yy,o.y+yy,o.z+r[2]/Math.max(0.3,r[1])*yy,{laut:0.3,leise:Math.random()<0.5,funken:7}); }
  fkRauch(e,dt,o,h,1.3);
  if(!e.nr) fkLicht(e,o,o.y+3,ph.funke==='titan'?[0.9,0.92,1]:ph.funke==='kohle'?FW.orange:FW.bernstein,2.2*st,16);
};

/* faecher (Feuerwand): fuenf Duesen je Satz, jede mit festem Winkel quer
   zum Blick. Ein Produkt hat mehrere Saetze (senkrecht, Faecher, Kreuz,
   Wand), die nacheinander brennen - die Rohre bewegen sich nicht.
   28.09., Tom: echt - vorher schwenkten die Duesen wie Fluegel. */
NEU_EMIT.faecher=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||6, D=e.duesen||DUESEN_STD.alle5, n=D.length, W=ph.winkel||D.map(()=>0);
  fkKlang(e,o,dt);
  e.kohleB=e.B;
  for(let i=0;i<n;i++){ const a=W[i]*Math.PI/180, d=[Math.sin(a),Math.cos(a),0], p=versetzt(o,D[i],0);
    const E=e['fl'+i]||(e['fl'+i]={spielraum:0.03,prod:e.prod}); E.staerke=st; fkFlamme(E,dt,p,null,1);
    fkStrahl(e,dt,{x:p.x,y:p.y+0.03,z:p.z},d,h,0.06,170*q*st,ph.funke||'kohle',e.A,e.B,ph.mischB===undefined?0.35:ph.mischB,'fw'+i,0.3); }
  if(ph.knister) for(let n2=fkJe(e,'fwK',ph.knister*st,dt);n2>0;n2--){ const i=Math.floor(Math.random()*n), a=W[i]*Math.PI/180, yy=h*rand(0.6,1), pp=versetzt(o,D[i],0);
    knisterPop(pp.x+Math.tan(a)*yy,o.y+yy,pp.z,{laut:0.3,leise:Math.random()<0.5,funken:6}); }
  fkRauch(e,dt,o,h,1.3);
  fkLicht(e,o,o.y+2,FW.orange,1.8*st,12);
};

/* ausbruch (Silberausbruch): Knister-Riesenfontaene mit breitem Kegel und
   einer Knisterwolke im Hoehenband wolke; rote Sterne darin (eine Farbe).
   Start mit Druckstoss; knisterWellen: die Rate schwillt n-mal; abklingen.
   28.09., Tom: echt - kein Weissblitz ueber den ganzen Bildschirm mehr,
   Sterne nur noch Rot (vorher Rot und Gruen, grosse Glanzsterne). */
NEU_EMIT.ausbruch=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||22, kg=(ph.kegel||18)*Math.PI/180;
  if(!e.los&&!ph.abklingen){ e.los=true; const v=distVol(o); flash({x:o.x,y:o.y+2,z:o.z},FW.weiss,4,0.25); sfx.boom(v*0.45); }
  let k=1; if(ph.knisterWellen) k=0.55+0.45*Math.cos(e.u*Math.PI*2*ph.knisterWellen); if(ph.abklingen) k*=1-e.u;
  fkKlang(e,o,dt,k);
  const p={x:o.x,y:o.y+0.03,z:o.z}, alt=SCHWEIF;
  fkFlamme(e,dt,o,null,2.4);
  /* Saeule: Titan-Silber, darin Knister-Mikrosterne */
  fkStrahl(e,dt,p,[0,1,0],h,kg*0.5,340*q*st*(ph.abklingen?1-e.u:1),'titan',FW.silber,FW.weiss,0.3,'aT',0.3);
  fkStrahl(e,dt,p,[0,1,0],h*0.95,kg,420*q*st*k,'knister',FW.weiss,FW.weiss,0,'aK',0.35);
  /* Knisterwolke im Band, oben breiter (Blumenkohl): die Mikrosterne
     platzen dort, wohin der Strahl sie getragen hat */
  const [w0,w1]=ph.wolke||[8,20], R=ph.breite||7;
  for(let n=fkJe(e,'aW',560*q*st*k,dt);n>0;n--){ const a=Math.random()*Math.PI*2, yy=rand(w0,w1), rr=R*Math.sqrt(Math.random())*(0.5+0.5*(yy-w0)/(w1-w0));
    knisterPop(o.x+Math.cos(a)*rr,o.y+yy,o.z+Math.sin(a)*rr,{laut:0.5,leise:Math.random()<0.6}); }
  /* Knistermeer: Silber-Mikrosterne treiben kaum sichtbar im Wolkenband
     und blitzen je einmal auf - ein dichtes, flirrendes Meer */
  for(let n=fkJe(e,'aM',2400*q*st*k,dt);n>0;n--){ const a=Math.random()*Math.PI*2, yy=rand(w0,w1), rr=R*1.25*Math.sqrt(Math.random())*(0.45+0.55*(yy-w0)/(w1-w0)), s=rand(0.3,1.4);
    glint(psMid,o.x+Math.cos(a)*rr,o.y+yy,o.z+Math.sin(a)*rr,Math.cos(a)*s,rand(-0.4,0.8),Math.sin(a)*s,FW.silber,1.2,{t0:0.08,t1:0.9,dim:0.16,psBlitz:psBig,blitz:3.0,blitzFarbe:[1,1,0.95],glimm:0.22,rest:0.12}); }
  /* rote Sterne aus der Duese, breit gefaechert */
  const S=(ph.sterne||[]).map(c=>farbe(c)).filter(Boolean);
  if(S.length) fkSterne(e,dt,p,[0,1,0],w1*0.95,kg*1.3,26*st*k,S,'aS2',{ps:psBig,hell:1.25,hMin:w0/w1,spur:0.06});
  SCHWEIF=alt;
  fkRauch(e,dt,o,h*0.5,2);
  fkLicht(e,o,o.y+8,[0.92,0.94,1],2.6*st*k,25);
};

/* zerfall (Feuerkaskade): zum Schluss stoesst jede Duese einen Schwall
   knisternder Goldkometen aus - sie steigen aus der Duese 8-12 m, fallen
   auseinander und knacken jeder fuer sich. 28.09., Tom: echt - vorher
   entstanden 40 Brocken frei oben in der Saeule ("zerspringt"). */
NEU_EMIT.zerfall=(e,dt,o)=>{
  const ph=e.ph, q=QUAL();
  if(e.los) return; e.los=true;
  const n=Math.round((ph.brocken||30)*q), hs=ph.hm||12, A=e.A, B=e.B, v=distVol(o);
  if(!e.nr){ sfx.boom(v*0.6); flash({x:o.x,y:o.y+1,z:o.z},FW.gold,3,0.25); shake=Math.max(shake,0.12*v); }
  const neig=(Array.isArray(ph.neig)?ph.neig[e.nr]:[-15,0,15][e.nr])||0, d0=[Math.sin(neig*Math.PI/180),Math.cos(neig*Math.PI/180),0];
  for(let i=0;i<n;i++){ const r=fkKegel(d0,0.45), hh=hs*rand(0.6,1.0), w=fkV0(hh,4)/Math.max(0.5,r[1]), vv=[r[0]*w,r[1]*w,r[2]*w], c=Math.random()<0.6?A:B, life=fkTA(w*r[1],4)*rand(1.6,2.2);
    const p={x:o.x+rand(-0.02,0.02),y:o.y+0.05,z:o.z+rand(-0.02,0.02)};
    fkKomet(p,vv,4,life,[c[0]*1.15,c[1]*1.05,c[2]*0.85],{funken:2,funkenFarbe:[1,0.8,0.4],zerspringt:3,klang:false});
    const pops=Math.floor(rand(4,9));
    for(let k=0;k<pops;k++){ const tz=life*rand(0.45,0.95); imBild(tz,()=>{ const b=bahnOrt(p,vv,4,tz); knisterPop(b.x,b.y,b.z,{laut:0.45,leise:Math.random()<0.5,funken:7}); }); } }
  /* Bodenknistern, wenn die Kometen unten ankommen */
  if(!e.nr) later(2.6,()=>knisterWolke({x:o.x,y:fkBoden(o.x,o.z)+0.3,z:o.z},Math.round(90*q),1.6,3.2,{flach:0.1,laut:0.35}));
};

/* knistersaeule (Goldgeysir): reine Goldsaeule aus Brokat; Knister-
   Mikrosterne steigen mit und platzen oben - die Krone waechst mit krone
   (Rate). 28.09., Tom: echt - vorher die Riesenfontaene der Shows mit
   eingestreuten Zufallsfarbsternen und einer Krone, die frei oben entstand. */
NEU_EMIT.knistersaeule=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), h=e.hAkt||10, kr=ph.kroneKurve?bereich(ph.kroneKurve,e.u):(ph.krone||0), kg=(ph.kegel||8)*Math.PI/180, p={x:o.x,y:o.y+0.03,z:o.z};
  fkKlang(e,o,dt);
  fkFlamme(e,dt,o,null,1.9);
  fkStrahl(e,dt,p,[0,1,0],h,kg,520*q*st,'brokat',e.A,e.B,0.12,'gS',0.35);
  fkStrahl(e,dt,p,[0,1,0],h*0.9,kg*0.8,160*q*st,'eisen',e.A,e.A,0,'gE',0.2);
  if(kr>0){ fkStrahl(e,dt,p,[0,1,0],h*1.03,kg*1.4,90*kr*q*st,'knister',[0.95,0.85,0.6],null,0,'gKm',0.15);
    const R=1.2*Math.sqrt(kr);
    for(let n=fkJe(e,'gk',60*kr*q*st,dt);n>0;n--){ const a=Math.random()*Math.PI*2, r=R*Math.sqrt(Math.random());
      knisterPop(o.x+Math.cos(a)*r,o.y+h*rand(0.82,1.04),o.z+Math.sin(a)*r,{laut:0.3+0.15*kr,leise:Math.random()<0.5,c:[1,0.85,0.45]}); }
    e.kk=(e.kk||0)-dt; if(e.kk<=0){ e.kk=rand(0.25,0.45)/kr; sfx.crackle(distVol(o)*0.35*kr); } }
  fkRauch(e,dt,o,h,1.4);
  fkLicht(e,o,o.y+3,FW.bernstein,2.4*st,18);
};

/* riesenpuls (Himmelsstuermer, 30 m): pulsierende Riesenfontaene -
   ein Goldsockel brennt dauernd, alle 0,3 s stoesst die Duese eine Salve
   Glitzersterne in weitem Kegel bis 30 m, jede zweite Salve mit roten
   Sternen; oben zerfallen sie knisternd und sinken als Goldweide.
   28.09., Tom: echt - vorher fuenf Farben (Rot, Gold, Gruen, Tuerkis,
   Violett), je Salve zwei davon (echt.md: Gold + Rot). */
NEU_EMIT.riesenpuls=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), hm=e.hAkt||30, v0=fkV0(hm,6), tA=fkTA(v0,6), alt=SCHWEIF, kraft=Math.min(1,e.alter/0.8)*Math.min(1,(e.dauer-e.alter)/1.2), p={x:o.x,y:o.y+0.03,z:o.z};
  fkKlang(e,o,dt,kraft);
  fkFlamme(e,dt,o,null,2.6);
  const rot=farbe(ph.farbe)||FW.rot;
  e.ps=(e.ps||0)-dt;
  if(e.ps<=0&&kraft>0.15){ e.ps=0.3; e.nS=(e.nS||0)+1;
    const mitRot=e.nS%2===0, n=Math.round(44*q*kraft);
    SCHWEIF=fkSpur(0.05,0,v0,0,0.25);
    for(let k=0;k<n;k++){ const a=Math.random()*Math.PI*2, tl=Math.sqrt(Math.random())*0.24, sp=v0*rand(0.88,1.0), c=mitRot&&k%3===0?rot:FW.gold;
      psBig.emit(p.x,p.y,p.z,Math.cos(a)*Math.sin(tl)*sp,Math.cos(tl)*sp,Math.sin(a)*Math.sin(tl)*sp,c[0],c[1]*(c===FW.gold?0.95:1),c[2],tA*rand(1.0,1.2),6,c===FW.gold?4:0); }
    SCHWEIF=alt;
    flash({x:o.x,y:o.y+2,z:o.z},FW.bernstein,2.4*kraft,0.2);
    /* oben: die Salve zerfaellt knisternd, Goldfaeden sinken */
    const oben={x:o.x,y:o.y+hm*0.94,z:o.z}, r0=hm*0.16;
    imBild(tA*0.95,()=>{
      for(let k=0;k<Math.round(50*q);k++){ const a=Math.random()*Math.PI*2, r=rand(0,r0);
        if(k%3===0) knisterPop(oben.x+Math.cos(a)*r,oben.y+rand(-2,1.5),oben.z+Math.sin(a)*r,{laut:0.3,leise:true,funken:5});
        else { const s3=SCHWEIF; SCHWEIF=0; psSmall.emit(oben.x+Math.cos(a)*r,oben.y+rand(-2,1.5),oben.z+Math.sin(a)*r,rand(-1,1),rand(-1,0.5),rand(-1,1),1,.9,.7,rand(0.3,0.7),2,3); SCHWEIF=s3; } }
      const s2=SCHWEIF; SCHWEIF=0.5;
      for(let k=0;k<Math.round(26*q);k++){ const a=Math.random()*Math.PI*2, r=rand(0,r0*0.8), w=rand(1,3.5);
        psMid.emit(oben.x+Math.cos(a)*r,oben.y,oben.z+Math.sin(a)*r,Math.cos(a)*w,rand(-0.5,1.5),Math.sin(a)*w,1,.66,.22,rand(3.0,4.2),1.6,2,0.5,0.2,0.04); }
      SCHWEIF=s2; sfx.crackle(distVol(o)*0.6); }); }
  /* Goldsockel und lockerer Glitzerschleier zwischen den Salven */
  fkStrahl(e,dt,p,[0,1,0],7,0.3,150*q*kraft,'brokat',FW.gold,FW.weiss,0.2,'rpS',0.4);
  SCHWEIF=0.03;
  for(let n=fkJe(e,'rpG',110*q*kraft,dt);n>0;n--){ const a=Math.random()*Math.PI*2, tl=Math.sqrt(Math.random())*0.26, sp=v0*rand(0.72,0.98);
    glint(psMid,p.x,p.y,p.z,Math.cos(a)*Math.sin(tl)*sp,Math.cos(tl)*sp,Math.sin(a)*Math.sin(tl)*sp,FW.gold,6,{t0:tA*0.5,t1:tA*1.1,dim:0.3,spur:0.03,blitz:2.6,glimm:0.3,rest:0.25}); }
  SCHWEIF=alt;
  fkRauch(e,dt,o,12,2);
  fkLicht(e,o,o.y+3,FW.bernstein,2.6*kraft,25);
  e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=0.9; noise(1.0,0.12*distVol(o)*kraft,900); }
};

/* titan50 (Silbertitan, 50 m): die groesste Fontaene - ein breiter,
   gleichmaessiger Titanstrahl bis 50 m, der oben als Silberkrone
   auseinanderfaellt und knistert; blaue Sterne steigen mit (eine Farbe).
   Die Duese dreht langsam: der Strahl steht leicht schraeg und wandert im
   Kreis (Drehduese) - ruhig, nicht pulsierend wie der Himmelsstuermer.
   28.09., Tom: echt - vorher ein drehender 8-Farben-Regenbogenfaecher mit
   Stroboskopkern (echt.md: Lichtshow). */
NEU_EMIT.titan50=(e,dt,o)=>{
  const ph=e.ph, st=e.staerke, q=QUAL(), hm=e.hAkt||50, Z=fkZ(e), kraft=Math.min(1,e.alter/1.0)*Math.min(1,(e.dauer-e.alter)/1.4), p={x:o.x,y:o.y+0.03,z:o.z};
  fkKlang(e,o,dt,kraft);
  fkFlamme(e,dt,o,null,3);
  Z.phi=(Z.phi||0)+dt*0.9; const ng=0.07, d=[Math.sin(ng)*Math.cos(Z.phi),Math.cos(ng),Math.sin(ng)*Math.sin(Z.phi)];
  /* Kern: Titan bis ganz oben, Mantel: Titan tiefer und breiter */
  fkStrahl(e,dt,p,d,hm,0.07,420*q*kraft,'titan',FW.silber,FW.weiss,0.35,'tK',0.2);
  fkStrahl(e,dt,p,d,hm*0.6,0.16,300*q*kraft,'titan',FW.silber,FW.weiss,0.2,'tM',0.5);
  /* Krone: Eisenfunken bis oben, die sich dort veraesteln und fallen */
  fkStrahl(e,dt,p,d,hm*1.02,0.11,90*q*kraft,'eisen',FW.silber,FW.silber,0,'tE',0.15);
  const F=[farbe(ph.farbe)||FW.blau];
  fkSterne(e,dt,p,d,hm,0.13,14*kraft,F,'tS',{ps:psBig,hell:1.2,hMin:0.45,spur:0.05});
  /* oben knistert es */
  for(let n=fkJe(e,'tKn',70*q*kraft,dt);n>0;n--){ const a=Math.random()*Math.PI*2, r=rand(0,hm*0.12), y=hm*rand(0.82,1.0);
    knisterPop(o.x+d[0]/d[1]*y+Math.cos(a)*r,o.y+y,o.z+d[2]/d[1]*y+Math.sin(a)*r,{laut:0.35,leise:Math.random()<0.5,funken:6}); }
  fkRauch(e,dt,o,16,2.2);
  fkLicht(e,o,o.y+4,[0.88,0.92,1],3*kraft,30);
  e.fz=(e.fz||0)-dt; if(e.fz<=0){ e.fz=0.9; noise(1.0,0.14*distVol(o)*kraft,1200); }
};

/* ---------- 5. Ereignisse am Phasenende ---------- */
Object.assign(FONT_EREIGNIS,{
  /* kurzer Knisterstoss an der Spitze: die letzten Knistersterne */
  knister(e,o){ const h=e.hAkt||3; knisterWolke({x:o.x,y:o.y+h*0.85,z:o.z},Math.round(70*QUAL()),0.8,0.4+h*0.12,{laut:0.5}); sfx.crackle(distVol(o)*0.8); },
  /* Zauberpuff: Zwischenschlag zwischen zwei Saetzen - kurzer Blitz an der
     Duese, ein paar weisse Funken, eine kleine Rauchwolke, dumpfes Fump */
  zauberpuff(e,o){ const v=distVol(o), p={x:o.x,y:o.y+0.25,z:o.z};
    flash(p,FW.weiss,2,0.08);
    const alt=SCHWEIF; SCHWEIF=0.06; for(let i=0;i<Math.round(40*QUAL());i++){ const d=randDir(), s=rand(2,4.5); psMid.emit(o.x,o.y+0.03,o.z,d[0]*s,Math.abs(d[1])*s+1,d[2]*s,1.3,1.25,1.2,rand(0.15,0.35),4,0); } SCHWEIF=alt;
    rauchball(p,{r:0.45,n:4,dauer:2.2,quellen:0.4,steigen:0.35,c:[0.62,0.62,0.66],a:0.4});
    sfx.thump(v*1.1); rauschF({dur:0.25,vol:0.2*v,f:500,hart:true}); },
  zauberpuff_tadaa(e,o){ FONT_EREIGNIS.zauberpuff(e,o);
    /* zum Schluss sinkt ein Schleier aus Glitzersternen */
    later(0.2,()=>{ for(let i=0;i<Math.round(60*QUAL());i++){ const a=Math.random()*Math.PI*2, s=rand(0.5,2.2);
        glint(psMid,o.x,o.y+0.03,o.z,Math.cos(a)*s,rand(5,8),Math.sin(a)*s,[1,0.95,0.85],6,{t0:0.6,t1:1.5,dim:0.4,glimm:0.4,rest:0.3}); }
      sfx.crackle(distVol(o)*0.7); }); },
  /* Etagenschlag: Zwischenschlag - Knall, kurzer Blitz an der Duese, ein
     Stoss Funken nach oben, Rauch (vorher ein Ring aus 24 Punkten). 28.09.,
     Tom: echt - Rauch duenner, beim Dreischlag stand sonst ein heller Nebelball */
  etagenschlag(e,o){ const v=distVol(o), alt=SCHWEIF; SCHWEIF=0.08;
    for(let i=0;i<Math.round(40*QUAL());i++){ const r=fkKegel([0,1,0],0.6), s=rand(4,9); psMid.emit(o.x,o.y+0.03,o.z,r[0]*s,r[1]*s,r[2]*s,1.3,1.25,1.15,rand(0.25,0.5),6,0); }
    SCHWEIF=alt; flash({x:o.x,y:o.y+0.3,z:o.z},FW.weiss,2,0.1);
    rauchball({x:o.x,y:o.y+0.5,z:o.z},{r:0.5,n:3,dauer:2.5,quellen:0.4,steigen:0.4,c:[0.5,0.5,0.52],a:e.dreifach?0.1:0.2});
    sfx.wumms(v*0.7); sfx.thump(v); },
  dreischlag(e,o){ const E=Object.assign({},e,{dreifach:true}); for(let i=0;i<3;i++) later(i*0.3,()=>FONT_EREIGNIS.etagenschlag(E,o)); },
  /* Endaufflammen: der Flammenfuss flammt kurz hoch auf und verlischt */
  aufflammen(e,o,ph){ const c=farbe(Array.isArray(ph.flamme)?ph.flamme[ph.flamme.length-1]:ph.flamme)||FW.gruen, E={spielraum:e.spielraum,staerke:1,prod:e.prod};
    for(let i=0;i<8;i++) later(i*0.05,()=>{ E.staerke=1-i/8; fkFlamme(E,0.05,o,c,4.5); fkFlamme(E,0.05,o,c,4.5,'fl2'); });
    flash({x:o.x,y:o.y+0.4,z:o.z},c,1.6,0.3); sfx.fauchen(distVol(o)*0.9,0.4,true); },
  /* Teufelslachen: die Hoerner brennen 1,15 s nach, dabei dreimal Knistern */
  teufelslachen(e){ emitters.push(Object.assign({},e,{t:1.15,dauer:1.15,alter:0,blendeIn:0,blendeAus:0.9,lachen:true,gelacht:false})); },
  /* Perlenschauer: zum Schluss stoesst jede der vier Duesen einen Schwall
     roter und gruener Perlen aus (vorher die "Tuete" mit Neon-Klecksen) */
  perlenschauer(e,o,ph){ const F=(ph.perlen||['rot','gruen']).map(farbe), alt=SCHWEIF; SCHWEIF=0.03;
    for(let i=0;i<Math.round(14*QUAL());i++){ const r=fkKegel([0,1,0],0.35), w=fkV0(rand(1.6,2.6),6)/Math.max(0.5,r[1]), c=F[i%F.length];
      psMid.emit(o.x,o.y+0.03,o.z,r[0]*w,r[1]*w,r[2]*w,c[0]*1.5,c[1]*1.5,c[2]*1.5,fkTA(w*r[1],6)*rand(1,1.25),6,0); }
    SCHWEIF=alt; if(!e.nr) sfx.plopp(distVol(o)*0.6,0.9); },
  /* Knisterkrone: Knistersterne steigen in 0,6 s aus dem Karton auf 1,5 m */
  knisterkrone(e,o){ const n=Math.round(70*QUAL()), alt=SCHWEIF;
    for(let i=0;i<n;i++){ const tz=Math.random()*0.6; imBild(tz,()=>{ const a=Math.random()*Math.PI*2, r=rand(0,0.3)*tz/0.6; knisterPop(o.x+Math.cos(a)*r,o.y+0.15+1.35*(tz/0.6)+rand(-0.1,0.1),o.z+Math.sin(a)*r,{laut:0.5}); }); }
    SCHWEIF=0.12; for(let i=0;i<60;i++){ const a=Math.random()*Math.PI*2, w=rand(0,0.6); psMid.emit(o.x,o.y+0.03,o.z,Math.cos(a)*w,rand(4,5.5),Math.sin(a)*w,1,0.75,0.3,rand(0.6,0.9),6,4); }
    SCHWEIF=alt; sfx.crackle(distVol(o)); later(0.3,()=>sfx.crackle(distVol(o))); },
  /* Wasserorgel: alle vier verloeschen, die letzten Funken rieseln */
  zusammenfall_gischt(e,o){ sfx.rieseln(distVol(o)*1.0,2.5); },
  /* Feuerberg: der Krater glueht und schwelt 3 s nach */
  nachgluehen(e,o){ emitters.push({t:3,k:'lava',o,A:FW.rot,B:FW.rot,ph:{modus:'grollen'},staerke:0.6,u:0,tag:e.tag,spielraum:e.spielraum}); },
  /* Feuersaeule, Goldgeysir: die letzten Funken kuehlen oben ab */
  ausklingen(e,o){ const alt=SCHWEIF, h=e.hAkt||10; SCHWEIF=0.1;
    for(let i=0;i<Math.round(80*QUAL());i++){ const r=fkKegel([0,1,0],0.12), w=fkV0(h*rand(0.6,1),4); SCHWEIF=fkSpur(0.1,0,w,0,0.5); psMid.emit(o.x,o.y+0.03,o.z,r[0]*w,r[1]*w,r[2]*w,0.9,0.35,0.06,fkTA(w,4)*rand(1.4,2),4,2,0.3,0.04,0); }
    SCHWEIF=alt; },
  nachglitzern(){},
  /* Niagara: die letzten Tropfen fallen */
  tropfen(e,o){ sfx.rieseln(distVol(o)*0.6,1.2); },
  nachregen(){},
  /* Silberausbruch: die Knisterwolke sinkt als letztes Glimmen */
  nachgluehen_silber(e,o){ knisterWolke({x:o.x,y:o.y+12,z:o.z},Math.round(60*QUAL()),1.5,4,{fall:2,laut:0.3}); },
  bodenknistern(e,o){ if(!e.nr) knisterWolke({x:o.x,y:fkBoden(o.x,o.z)+0.2,z:o.z},Math.round(40*QUAL()),1,2.5,{flach:0.1,laut:0.3}); }
});

/* ---------- 6. Gestelle (Drehsonne, Niagara) ----------
   28.09., Tom: "wenn da eine Oeffnung ist, dann soll es am Produkt
   rausgehen". Rad und Leine erschienen erst beim Zuenden in der Luft ueber
   dem Karton. Jetzt steht das aufgebaute Gestell auf dem Tischplatz,
   sobald das Produkt dort steht (Aufruf aus stationsModell), und die Funken
   kommen aus seinen Duesen. Im Regal bleibt es ein Karton (dims). */
const FK_GESTELL=[];
function fkGestellBau(t,x,y,z){
  const p=P[t]; if(!p||!p.gestell) return null;
  const g=new THREE.Group(), holz=fkMat(0x6b4a2a), stahl=fkMat(0x7a7f86), d=p.dims;
  g.position.set(x,y,z);
  if(p.gestell==='rad'){
    /* Fuss, Pfosten bis zur Nabe, Radscheibe mit zwei Treibern */
    const nab=d[1]+FK_NABE;
    const fuss=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.03,0.12),holz); fuss.position.set(0,0.015,0); g.add(fuss);
    const pf=new THREE.Mesh(new THREE.BoxGeometry(0.04,nab,0.04),holz); pf.position.set(0,nab/2,-0.035); g.add(pf);
    const rad=new THREE.Group(); rad.position.set(0,nab,0.0); g.add(rad);
    const sch=new THREE.Mesh(new THREE.CylinderGeometry(FK_RAD*0.82,FK_RAD*0.82,0.012,24),fkMat(0x2a2320,0x0a0400)); sch.rotation.x=Math.PI/2; rad.add(sch);
    const nabe=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.05,12),stahl); nabe.rotation.x=Math.PI/2; rad.add(nabe);
    for(const s of [-1,1]){ const h=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.2,8),fkMat(0xb03020)); h.position.set(s*FK_RAD,0,0.012); rad.add(h);
      const k=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.02,0.03,8),fkMat(0x3b3b3b)); k.position.set(s*FK_RAD,s*0.11,0.012); rad.add(k); }
    g.userData.rad=rad;
  } else if(p.gestell==='leine'){
    /* zwei Pfosten mit Fuss, Leine oben, daran die Duesen (kleine Huelsen) */
    const B=d[0]*0.96, H=p.leineH||2.2;
    for(const s of [-1,1]){ const px=s*B/2;
      const f=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.025,0.12),holz); f.position.set(px,0.0125,0); g.add(f);
      const po=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.02,H+0.06,8),stahl); po.position.set(px,(H+0.06)/2,0); g.add(po); }
    const le=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,B,4),fkMat(0x9aa0a8)); le.rotation.z=Math.PI/2; le.position.set(0,H,0); g.add(le);
    const N=9, hm=fkMat(0xd8d2c0);
    for(let i=0;i<N;i++){ const hx=(i/(N-1)-0.5)*B*0.94; const h=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.09,8),hm); h.position.set(hx,H-0.05,0); g.add(h); }
    g.userData.leineY=y+H; g.userData.breite=B; g.userData.fussY=y+0.03;
  }
  g.userData.x=x; g.userData.z=z; g.userData.t=t;
  return g;
}
/* Aufruf aus stationsModell (05d-yard.js): nur auf dem Zuendtisch */
function fkGestell(t,sl){ const g=fkGestellBau(t,sl.x,sl.y,sl.z); if(!g) return null;
  for(let i=FK_GESTELL.length-1;i>=0;i--) if(!FK_GESTELL[i].parent) FK_GESTELL.splice(i,1);
  FK_GESTELL.push(g); return g; }
function fkGestellBei(o,t){ return FK_GESTELL.find(g=>g.parent&&g.userData.t===t&&Math.hypot(g.userData.x-o.x,g.userData.z-o.z)<0.3)||null; }
/* Ohne Tischplatz (Vorfuehrung, Test mit freiem Ort): Gestell auf die
   Oberkante stellen und nach dem Abbrand wieder abbauen */
function fkGestellLose(o,t,dauer){ const d=P[t]&&P[t].dims||[0.2,0.2,0.2], g=fkGestellBau(t,o.x,o.y-d[1],o.z); if(!g) return null;
  scene.add(g); later(dauer+1.5,()=>scene.remove(g)); return g; }

/* ---------- 7. Drehbuecher (Katalog fontaenen, 26.09.; 28.09., Tom: echt) ----------
   Je Produkt ein Farbthema (Farbe nur als Flammenfuss oder Farbstern,
   hoechstens zwei zugleich); Vielfalt ueber Funkenart, Ablauf, Hoehe,
   Rhythmus und Aufbau. nach = Nachlauf in s (Nachgluehen, Nachregen), den
   die Station stehen bleibt. */
Object.assign(FONT,{
  /* Eissterne (L3): vier Kaltfunken-Tortenfontaenen im Gleichklang, Silber */
  tortenfontaene:{phasen:[
    {k:'torte',at:0,t:1.0,x:-0.21,hm:0.2,hKurve:[0.3,1],A:'silber',B:'weiss',kalt:true},
    {k:'torte',mit:true,t:1.0,x:-0.07,hm:0.2,hKurve:[0.3,1],A:'weiss',B:'silber',kalt:true},
    {k:'torte',mit:true,t:1.0,x:0.07,hm:0.2,hKurve:[0.3,1],A:'silber',B:'weiss',kalt:true},
    {k:'torte',mit:true,t:1.0,x:0.21,hm:0.2,hKurve:[0.3,1],A:'weiss',B:'silber',kalt:true},
    {k:'torte',at:1.0,t:7.0,x:'alle4',hm:0.7,A:'silber',B:'weiss',kalt:true,diamant:[0.66,1],ende:'pff'}]},
  /* Feuerteufel (L4): zwei gespreizte Hoerner aus Kohlefunken, die zur
     Spitze rot abkuehlen; zum Schluss lacht er (Glut: Orange/Rot). 28.09.,
     Tom: echt - kaum reinrote Funken (mischB 0,3-0,4 -> 0,1): sie standen
     als rote Punkte um die Hoerner; rot wird ein Funke erst beim Abkuehlen */
  feuerteufel:{phasen:[
    {k:'hoerner',t:1.5,hm:0.3,spreiz:0,funke:'kohle',A:'orange',B:'rot',ton:'zischen'},
    {k:'hoerner',t:5.0,hm:1.5,spreiz:25,funke:'kohle',A:'gold',B:'rot',mischB:0.08,ton:'fauchen'},
    {k:'hoerner',t:2.0,hm:1.8,spreiz:40,funke:'kohle',A:'orange',B:'rot',mischB:0.12,ton:'fauchen'},
    {k:'hoerner',t:0.5,hm:1.8,spreiz:40,funke:'kohle',A:'orange',B:'rot',mischB:0.12,ende:'teufelslachen'}]},
  /* Gummibaerchen (L4): vier kleine Silberfontaenen, eine nach der anderen,
     mit roten bzw. gruenen Perlen; zum Schluss alle vier und ein Schauer */
  leuchtfontaene:{phasen:[
    {k:'perlen',at:0.0,t:4.6,x:-0.18,hm:1.6,A:'rot',ton:'zischen'},
    {k:'perlen',at:3.8,t:4.6,x:0.18,hm:1.8,A:'gruen',ton:'zischen'},
    {k:'perlen',at:7.6,t:4.6,x:-0.06,hm:2.0,A:'rot',rate:8,ton:'zischen'},
    {k:'perlen',at:11.4,t:4.6,x:0.06,hm:2.2,A:'gruen',rate:8,ton:'zischen'},
    {k:'perlen',at:15.4,t:2.6,x:'alle4',hm:2.2,perlen:['rot','gruen'],A:['rot','gruen','rot','gruen'],rate:7,ton:'zischen',ende:'perlenschauer'}],nach:2},
  /* Feuerquelle (L8): drei Fontaenen, drei Funkenarten nacheinander -
     Kohle (dunkelorange), Brokat (Gold), Titan (Silber) */
  fontaene:{phasen:[
    {k:'gerb',at:0,t:6,x:0.00,hm:2.5,kegel:12,funke:'kohle',A:'orange',ton:'rauschen',blende:1},
    {k:'gerb',at:5,t:6,x:-0.25,hm:3.0,kegel:10,funke:'brokat',A:'gold',ton:'rauschen',blende:1},
    {k:'gerb',at:10,t:6.5,x:0.25,hm:3.5,kegel:8,funke:'titan',A:'weiss',B:'silber',mischB:0.4,ton:'zischen',ende:'knister'}]},
  /* Feuerkreis (L8): der Karton spruehet ringsum flach, die Funken landen
     als Glutring und springen auf; der Ring waechst, steht, zieht sich
     zusammen, zum Schluss steigt eine Knisterkrone */
  bodenfeuer:{phasen:[
    {k:'bodenring',t:2.0,radius:[0.3,1.6],hebung:5,A:'orange',B:'gold',ton:'zischen'},
    {k:'bodenring',t:5.0,radius:[1.6,1.9],hebung:6,A:'gold',B:'orange',huepfer:true,ton:'rauschen'},
    {k:'bodenring',t:3.0,radius:[1.8,0.2],hebung:8,A:'gold',B:'orange',ton:'zischen',ende:'knisterkrone'}]},
  /* Farbenspiel (L8): drei Fontaenen mit Farbflamme an der Duese -
     Rot, dann Gruen, dann eine mit Farbwechsel Rot/Gruen (Dunkelphase);
     die Funken bleiben Gold und Silber */
  farbfontaenen:{phasen:[
    {k:'gerb',at:0,t:6,x:-0.25,hm:3.0,funke:'brokat',A:'gold',flamme:'rot',flammeGross:1.6,ton:'rauschen'},
    {k:'gerb',at:6,t:6,x:0.25,hm:3.0,funke:'titan',A:'silber',flamme:'gruen',flammeGross:1.6,ton:'zischen'},
    {k:'gerb',at:12,t:6,x:0.00,hm:3.2,funke:'brokat',A:'gold',B:'silber',kernB:true,flamme:['rot','gruen'],wechsel:1.5,flammeGross:1.8,ton:'rauschen',ende:'aufflammen'}]},
  /* Zauberbrunnen (L10): Verwandlung in drei Saetzen mit Zwischenschlag und
     0,4 s Dunkelheit - Silber mit gruenen Sternen, Gold mit violetten,
     zum Schluss Knister mit beiden Farben */
  zauberbrunnen:{phasen:[
    {k:'gerb',t:5.5,hm:3.0,funke:'titan',A:'silber',B:'gruen',sterne:'B',sterneRate:12,ton:'zischen',ende:'zauberpuff'},
    {k:'gerb',t:5.5,hm:3.5,funke:'brokat',A:'gold',B:'violett',sterne:'B',sterneRate:12,ton:'rauschen',dunkel:0.4,ende:'zauberpuff'},
    {k:'gerb',t:6.0,hm:4.0,funke:'knister',A:'weiss',B:'gruen',sterne:['gruen','violett'],sterneRate:12,ton:'knistern',dunkel:0.4,ende:'zauberpuff_tadaa'}]},
  /* Zuckerhut (L12): eine Phase, der Kegel baut seine Hoehe stetig von
     1,5 auf 5 m auf (Kegelvulkan, echt.md 1.7); Brokat mit Eisen-Aesten */
  vulkan:{phasen:[
    {k:'gerb',t:20,hm:5,hKurve:[0.3,1.0],kegel:[14,22],dichte:[200,520],funke:'brokat',A:'gold',B:'zitrone',mischB:0.15,krone:{funke:'eisen',A:'gold'},ton:'rauschen',lautKurve:[0.5,1.2],ende:'aus'}]},
  /* Feuerberg (L12): der Krater schwelt und grollt, dann wirft er
     Glutbrocken, zum Schluss der Ausbruch; danach schwelt er nach */
  feuerberg:{phasen:[
    {k:'lava',t:4,modus:'grollen',A:'rot',B:'rot',ton:'grollen'},
    {k:'lava',t:8,modus:'auswurf',rate:[3,6],hm:[2,4],A:'orange',B:'rot',unterbau:{funke:'kohle',hm:1.5},ton:'blubb'},
    {k:'lava',t:3,modus:'ausbruch',stoss:12,hm:4.5,A:'orange',B:'bernstein',unterbau:{funke:'kohle',hm:2.4},ton:'grollen',ende:'nachgluehen'}],nach:3},
  /* Bluetenbrunnen (L12): Sterne platzen in Fontaenenhoehe zu kleinen
     Chrysanthemen - Rot auf Silber, Goldperlen, rote Reiskoerner, zum
     Schluss rote Blueten mit Goldstempel */
  sternenbrunnen:{phasen:[
    {k:'bluetenwerfer',t:4.5,hm:3.2,funke:'titan',A:'silber',bluete:{art:'chrys',farbe:'rot',stempel:'silber',rate:4.5,funken:34},ton:'zischen'},
    {k:'bluetenwerfer',t:4.5,hm:3.4,funke:'kohle',A:'gold',bluete:{art:'perle',farbe:'gold',rate:12},ton:'rauschen'},
    {k:'bluetenwerfer',t:4.0,hm:3.4,funke:'titan',A:'weiss',bluete:{art:'reis',farbe:'rot',rate:12,funken:16},ton:'zischen'},
    {k:'bluetenwerfer',t:5.0,hm:3.8,funke:'brokat',A:'gold',bluete:{art:'chrys',farbe:'rot',stempel:'gold',rate:[5,9],funken:40},ton:'rauschen',ende:'aus'}]},
  /* Popcorn (L12): drei kleine Kohlevulkane, Knallsterne im Popcorn-
     Rhythmus (erst vereinzelt, dann dicht, dann versiegend), Nachzuegler */
  vulkanfeld:{phasen:[
    {k:'popcorn',at:0,t:12,x:'reihe3',hm:1.5,funke:'kohle',A:'gold',ton:'rauschen',
     knallKurve:[[0,0],[3,0],[3.1,1],[5,1.5],[7,12],[9,12],[10.5,1],[12,0]],knallHoehe:[1.5,3],woelkchen:0.8},
    {k:'popcorn',at:13.2,t:0.3,x:0.3,nachzuegler:true}]},
  /* Funkenturm (L13): Titan in drei Etagen 2 - 4 - 6 m, jede Stufe mit
     einem Zwischenschlag; oben faellt eine Goldkrone auseinander */
  funkenturm:{phasen:[
    {k:'gerb',t:4,hm:2,kegel:6,funke:'titan',A:'weiss',ton:'zischen',ende:'etagenschlag'},
    {k:'gerb',t:4,hm:4,kegel:7,funke:'titan',A:'weiss',B:'gold',mischB:0.3,ton:'zischen',ende:'etagenschlag'},
    {k:'gerb',t:5,hm:6,kegel:8,funke:'titan',A:'weiss',B:'gold',mischB:0.5,krone:{funke:'brokat',A:'gold'},ton:'rauschen'},
    {k:'gerb',t:1,hm:6,kegel:8,funke:'titan',A:'weiss',B:'gold',mischB:0.5,krone:{funke:'brokat',A:'gold'},ton:'rauschen',ende:'dreischlag'}]},
  /* Drehsonne (L14): Saxon auf seinem Gestell - rechtsherum Gold, stockt,
     linksherum Silber, zum Schluss beide Treiber mit Knistersatz */
  feuerrad:{phasen:[
    {k:'saxon',t:6.0,dreh:1,ups:[1,5],funke:'kohle',A:'gold',ton:'fauchen'},
    {k:'saxon',t:0.6,dreh:0,stottern:true,funke:'kohle',A:'gold'},
    {k:'saxon',t:6.0,dreh:-1,ups:[3,7],funke:'titan',A:'silber',ton:'zischen'},
    {k:'saxon',t:1.4,dreh:-1,ups:8,beide:true,funke:'titan',A:'silber',B:'gold',knister:30,ton:'zischen',ende:'aus'}]},
  /* Goldgeysir (L14): reine Goldsaeule 10 m, die Knisterkrone waechst */
  goldgeysir:{phasen:[
    {k:'knistersaeule',at:0,t:2,hm:10,hKurve:[0.4,1],A:'gold',B:'zitrone',krone:0},
    {k:'knistersaeule',at:2,t:10,hm:10,A:'gold',B:'zitrone',krone:1.0,ton:'rauschen'},
    {k:'knistersaeule',at:12,t:6,hm:10,A:'gold',B:'zitrone',kroneKurve:[1.0,2.0],ton:'knistern'},
    {k:'knistersaeule',at:18,t:2,hm:11,A:'gold',B:'zitrone',krone:2.0,ton:'knistern',ende:'ausklingen'}]},
  /* Dreiklang (L15): drei Fontaenen, die aeusseren zur Mitte geneigt,
     kreuzen sich ueber der mittleren; Silber mit blauem Flammenfuss, die
     Mitte Gold; zum Schluss richten sich alle auf und knistern */
  dreiklang:{duesen:[-0.35,0,0.35],phasen:[
    {k:'kreuz',at:0,t:13,x:-0.35,neig:9,azi:'innen',hm:4,funke:'titan',A:'silber',flamme:'blau',ton:'zischen'},
    {k:'kreuz',at:3.5,t:9.5,x:0.35,neig:9,azi:'innen',hm:4,funke:'titan',A:'silber',flamme:'blau'},
    {k:'kreuz',at:7.5,t:5.5,x:0.00,neig:0,hm:4.5,funke:'brokat',A:'gold',flamme:'blau',dichte:260},
    {k:'kreuz',at:13,t:2,x:'alle3',neigKurve:[9,0],azi:'innen',hm:5,funke:'titan',A:'silber',B:'gold',mischB:0.4,flamme:'blau',knister:25,ton:'knistern',ende:'knister'}]},
  /* Feuerbrunnen (L15): Kometenfontaene - grosse Flamme, Kohlestrahl und
     Stoesse von Brokatkometen, Dauerfeuer, drei Schlussstoesse */
  feuerbrunnen:{phasen:[
    {k:'flammen',t:3,h:0.4,stossAlle:[0.5,0.9],ton:'fauchen'},
    {k:'flammen',t:8,h:1.0,stossAlle:[0.35,0.5],ton:'fauchen'},
    {k:'flammen',t:3,h:1.1,stossAlle:0.2,ton:'fauchen'},
    {k:'flammen',t:2,h:1.4,stoesse:3,stossAlle:0.6,ton:'fauchen',ende:'aus'}]},
  /* Wasserorgel (L16): vier Silberfontaenen in Zuendfolgen - einzeln von
     aussen nach innen, im Wechsel paarweise, als Welle, zum Schluss alle;
     tuerkise Perlen als einzige Farbe */
  wasserspiel:{duesen:[-0.3,-0.1,0.1,0.3],funke:'titan',A:'silber',B:'tuerkis',perlen:true,ton:'rauschen',phasen:[
    {k:'orgel',t:4,figur:'einzeln',hm:[3,4]},
    {k:'orgel',t:4,figur:'paare',hm:[4,5],takt:0.8},
    {k:'orgel',t:5,figur:'welle',hm:[4,5],abstand:0.3,lang:1.3},
    {k:'orgel',t:6,figur:'alle',hm:[5,6],ende:'zusammenfall_gischt'}]},
  /* Funkelsaeule (L17): dunkle Saeule, die oben in Einzelblitzen zerstaeubt;
     erst Bernstein-Glitter, dann Silber */
  glitzerkaskade:{phasen:[
    {k:'gerb',t:4,hm:11,hKurve:[0.5,1],funke:'glitter',A:'bernstein',glitterAnteil:0.6,ton:'rauschen',blende:1},
    {k:'gerb',t:7,hm:11,funke:'glitter',A:'bernstein',B:'gold',mischB:0.4,glitterAnteil:0.9,ton:'rauschen',blende:1.5},
    {k:'gerb',t:8,hm:12,funke:'glitter',A:'silber',glitterFarbe:'weiss',glitterAnteil:1.0,ton:'zischen'},
    {k:'gerb',t:1,hm:12,hKurve:[1,0.2],funke:'glitter',A:'silber',glitterFarbe:'weiss',glitterAnteil:1.0,ende:'nachglitzern'}],nach:1.5},
  /* Niagara (L18): Silbervorhang faellt von der Leine des Gestells */
  wasserfall:{phasen:[
    {k:'niagara',t:2,duesen:9,dichteKurve:[0.3,1],A:'silber',B:'weiss',ton:'rauschen'},
    {k:'niagara',t:24,duesen:9,A:'silber',B:'weiss',wind:0.15,spritzer:true,ton:'rauschen'},
    {k:'niagara',t:4,duesen:9,A:'silber',B:'weiss',ausduennen:true,spritzer:true,ton:'rauschen',ende:'tropfen'}],nach:1},
  /* Wendeltreppe (L19): Schraube, Doppelhelix, Trichter - Silber mit
     tuerkisen Sternen */
  eisblume:{phasen:[
    {k:'wendel',t:4,hm:8,neig:0,ups:[0,1],funke:'titan',A:'silber',ton:'zischen'},
    {k:'wendel',t:10,hm:12,neig:12,ups:[1,3],funke:'titan',A:'silber',B:'weiss',sterne:['tuerkis'],ton:'rauschen'},
    {k:'wendel',t:4,hm:12,neig:12,ups:3,zweite:{dreh:-1,A:'weiss'},funke:'titan',A:'silber',sterne:['tuerkis'],sterneRate:4,ton:'rauschen'},
    {k:'wendel',t:4,hm:11,neigKurve:[12,32],ups:3,zweite:{dreh:-1,A:'weiss'},funke:'titan',A:'silber',sterne:['tuerkis'],sterneRate:5,ton:'zischen',ende:'knister'}]},
  /* Lametta (L20): Kamuro-Faeden sinken bis zum Boden, blaue Sterne */
  goldvulkan:{phasen:[
    {k:'lametta',t:6,hm:4,kegel:14,funke:'kamuro',A:'gold',ton:'rauschen'},
    {k:'lametta',t:18,hm:7,kegel:20,funke:'kamuro',A:'gold',B:'blau',sterneB:1.5,ton:'rauschen'},
    {k:'lametta',t:6,hm:7,kegel:22,funke:'kamuro',A:'gold',fadenLaenge:0.9,dichte:1.5,ton:'rauschen',ende:'nachregen'}],nach:3.5},
  /* Feuersaeule (L20): 15-m-Saeule, die wie Eisen abkuehlt - Weissglut
     (Titan), Gelbglut (Eisen mit Aesten), Rotglut (Kohle), verglimmt */
  feuersaeule:{phasen:[
    {k:'saeule',t:9,hm:15,hKurve:[0.6,1],funke:'titan',A:'weiss',B:'silber',mischB:0.3,ton:'zischen',blende:1.5},
    {k:'saeule',t:9.5,hm:15,funke:'eisen',A:'gold',B:'zitrone',mischB:0.3,knister:8,ton:'rauschen',blende:1.5},
    {k:'saeule',t:9,hm:14,funke:'kohle',A:'orange',B:'gold',mischB:0.3,ton:'rauschen',blende:1},
    {k:'saeule',t:3,hm:12,hKurve:[1,0.35],dichte:300,funke:'kohle',A:'orange',B:'rot',mischB:0.5,ton:'rauschen',ende:'ausklingen'}]},
  /* Feuerwand (L21): fuenf Rohre je Satz - senkrecht, Faecher, geschlossen
     und offen im Wechsel, Kreuz, zum Schluss die Wand in Gold mit Knistern */
  feuerwand:{duesen:[-0.28,-0.14,0,0.14,0.28],funke:'kohle',A:'orange',B:'rot',ton:'fauchen',phasen:[
    {k:'faecher',t:3,hm:4,winkel:[0,0,0,0,0],blende:0.3},
    {k:'faecher',t:3,hm:6,winkel:[-40,-20,0,20,40],blende:0.3},
    {k:'faecher',t:1.4,hm:6,winkel:[-8,-4,0,4,8],blende:0.25},
    {k:'faecher',t:1.4,hm:6,winkel:[-40,-20,0,20,40],blende:0.25},
    {k:'faecher',t:1.4,hm:6,winkel:[-8,-4,0,4,8],blende:0.3},
    {k:'faecher',t:3,hm:6,winkel:[30,15,0,-15,-30],A:'gold',blende:0.3},
    {k:'faecher',t:2.2,hm:8,winkel:[-6,-3,0,3,6],A:'gold',B:'weiss',knister:30,ende:'knister'}]},
  /* Himmelsstuermer (L23): 30 m pulsierende Riesenfontaene, Gold und Rot */
  fontaene30:{phasen:[{k:'riesenpuls',t:12,hm:30,farbe:'rot',ton:'rauschen'}]},
  /* Silbertitan (L26): 50 m ruhiger Titanstrahl aus der Drehduese, oben
     Silberkrone mit Knistern, blaue Sterne */
  fontaene50:{phasen:[{k:'titan50',t:14,hm:50,farbe:'blau',ton:'zischen'}]},
  /* Silberausbruch (L24): edles Silber, Luft anhalten, Ausbruch ins
     Knistermeer mit roten Sternen */
  silberkaskade:{phasen:[
    {k:'gerb',t:10,hm:20,kegel:9,funke:'titan',A:'silber',B:'weiss',mischB:0.3,knisterLeise:1,ton:'rauschen'},
    {k:'gerb',t:0.8,hm:6,kegel:6,dichte:140,funke:'titan',A:'silber',blende:0,ton:'still'},
    {k:'ausbruch',t:9,hm:28,kegel:24,funke:'knister',A:'weiss',sterne:['rot'],wolke:[9,27],breite:7.5,ton:'knistern_laut'},
    {k:'ausbruch',t:3.2,hm:28,kegel:24,knisterWellen:3,abklingen:true,sterne:['rot'],wolke:[9,27],breite:7.5,ton:'knistern_laut',ende:'nachgluehen_silber'}],nach:1.5},
  /* Feuerkaskade (L26): Dreizack - Gold in der Mitte, Silber aussen, dann
     neigen sich alle drei; zum Schluss stoesst jede Duese knisternde
     Goldkometen aus */
  feuerkaskade:{duesen:[-0.3,0,0.3],phasen:[
    {k:'gerb',at:0,t:16,x:0.0,hm:10,funke:'brokat',A:'gold',ton:'rauschen'},
    {k:'gerb',at:4,t:12,x:-0.3,hm:12,funke:'titan',A:'silber',ton:'zischen'},
    {k:'gerb',at:4.6,t:11.4,x:0.3,hm:12,funke:'titan',A:'silber',ton:'zischen'},
    {k:'gerb',at:10,t:6,x:'alle3',neig:[-15,0,15],hm:12,funke:'kohle',A:'gold',B:'orange',mischB:0.4,ton:'fauchen'},
    {k:'zerfall',at:16,t:7,x:'alle3',hm:12,brocken:30,neig:[-15,0,15],A:'gold',B:'weiss',ende:'bodenknistern'}]}
});

/* Signaturen (Test anomalie.js prueft die Eindeutigkeit ueber alle Kategorien) */
Object.assign(SIGNATUR,{
  tortenfontaene:{idee:'gleichklang',text:'vier Kaltfunken-Tortenfontänen wachsen und verlöschen gemeinsam'},
  feuerteufel:{eff:'hoerner',text:'zwei gespreizte Hörner aus Kohlefunken, die rot abkühlen, zum Schluss dreifaches Knisterlachen'},
  leuchtfontaene:{eff:'perlenfontaene',text:'vier kleine Silberfontänen nacheinander mit roten und grünen Perlen, zum Schluss ein Perlenschauer'},
  fontaene:{idee:'funkenarten',text:'drei Fontänen aus Kohle, Brokat und Titan nacheinander'},
  bodenfeuer:{eff:'bodenring',text:'flacher Funkenkranz ringsum, die Funken landen als Glutring und springen auf'},
  farbfontaenen:{eff:'flammenfuss',text:'Gold- und Silberfontänen mit roter und grüner Flamme an der Düse, zuletzt Farbwechsel'},
  zauberbrunnen:{eff:'zauberpuff',text:'Verwandlung in drei Sätzen mit Zwischenschlag und Dunkelpause, Grün und Violett'},
  vulkan:{idee:'kegelwachstum',text:'eine Phase, Höhe wächst stetig von 1,5 auf 5 m, Brokat mit Eisen-Ästen'},
  feuerberg:{eff:'glutbrocken',text:'schwelender Krater, dann Glutbrocken, die im Flug verglühen, zum Schluss der Ausbruch'},
  sternenbrunnen:{eff:'bluetenwerfer',text:'Sterne platzen in Fontänenhöhe zu roten Mini-Chrysanthemen'},
  vulkanfeld:{eff:'popcorn',text:'Knallsterne im Popcorn-Rhythmus mit Nachzügler'},
  funkenturm:{idee:'etagen',text:'Höhe springt in drei Stufen mit Zwischenschlag'},
  feuerrad:{eff:'saxon',text:'Rad auf dem Gestell stockt und dreht mit Silber in Gegenrichtung weiter'},
  goldgeysir:{eff:'knistersaeule',text:'reine Goldsäule, die Knisterkrone wächst'},
  dreiklang:{idee:'kreuzung',text:'zwei geneigte Silberfontänen kreuzen sich über der goldenen, blauer Flammenfuß'},
  feuerbrunnen:{eff:'kometenfontaene',text:'große Flamme und Stöße von Brokatkometen, Dauerfeuer, drei Schlussstöße'},
  wasserspiel:{eff:'zuendfolge',text:'vier Silberfontänen in Zündfolgen: einzeln, paarweise, als Welle, alle'},
  glitzerkaskade:{eff:'glitter',text:'dunkle Säule, die oben in Einzelblitzen zerstäubt'},
  wasserfall:{eff:'niagara',text:'Silbervorhang fällt von der Leine des Gestells, die Zündschnur öffnet ihn'},
  eisblume:{eff:'wendel',text:'Funken steigen als Schraube, dann Doppelhelix, dann Trichter'},
  goldvulkan:{eff:'lametta',text:'Kamuro-Fäden sinken bis zum Boden, Nachregen nach dem Ende'},
  feuersaeule:{eff:'abkuehlen',text:'15-m-Säule kühlt ab wie Eisen: Weißglut, Gelbglut mit Ästen, Rotglut'},
  feuerwand:{eff:'faechersaetze',text:'fünf Rohre je Satz: senkrecht, Fächer, auf und zu, Kreuz, Wand'},
  fontaene30:{eff:'monsterfont-puls',text:'30 m pulsierende Riesenfontäne: Salven aus Gold- und Rotsternen, oben knisternde Goldweide'},
  silberkaskade:{eff:'ausbruch',text:'Luft anhalten, dann Ausbruch in ein Titan-Knistermeer mit roten Sternen'},
  feuerkaskade:{eff:'zerfall',text:'Dreizack aus Gold und Silber, zum Schluss knisternde Goldkometen aus allen drei Düsen'},
  fontaene50:{eff:'titan-drehduese',text:'50 m ruhiger Titanstrahl aus der Drehdüse, Silberkrone mit Knistern und blauen Sternen'}
});

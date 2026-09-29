/* =========================================================
   Kugelbomben - je Sorte ein eigenes Hauptbild mit Nachbruechen
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   28.09., Tom: echt - "keine Laser, keine Punkte, keine Lichtshow; die
   Effekte muessen ineinander passen, auch von den Farben her". Seitdem
   ist jedes Hauptbild eine echte Bombe aus dem Feuerwerkskatalog (Herz-
   Musterbombe, Palme, Geisterbombe, Paeonie mit Blink-Pistill, Dahlie,
   Yanagi, Chrysantheme mit Farbwechsel und Saturnring, Zeitregen,
   Crossette-Kranz, Zehnfachbruch, Brokat-Qualle, Silberbruch, Yaeshin
   mit Kiekuchi), jeder Stern fliegt ballistisch, und jede Sorte hat
   eine Farbe plus Gold/Silber/Weiss - ihre Stufen bleiben im Paar.
   Katalog: katalog-kugeln.md, Regeln: /tmp/fw/echt.md. Leiter:
     75 mm  ein Bild mit einem Kniff   Herzschlag, Suedsee, Chamaeleon
     100 mm zwei Stufen                Eiskristall, Drachenblut, Haengeweide
     150 mm drei Stufen                Weltenbrand, Sternenstaub, Sternkranz
     200 mm Bewegung im Bild           Bluetenkranz, Leuchtqualle
     300 mm Meisterbomben              Himmelsbrecher, Kaiserkrone
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
function kgSpaeter(tz,fn){ const tag=FW_TAG; imBild(tz,()=>{ const alt=FW_TAG; FW_TAG=tag; try{ fn(); } finally { FW_TAG=alt; } }); }
/* Bildschirmachsen vom Zuschauer aus: rechts, oben, Blickrichtung */
function kgAchsen(p){
  const c=camera.position; let f=[p.x-c.x,p.y-c.y,p.z-c.z]; const lf=Math.hypot(f[0],f[1],f[2])||1; f=[f[0]/lf,f[1]/lf,f[2]/lf];
  let r=[-f[2],0,f[0]]; const lr=Math.hypot(r[0],r[2])||1; r=[r[0]/lr,0,r[2]/lr];
  return [r,[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]],f];
}
const kgMal=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
/* Farbwechsel mit Dunkelphase (echt.md 1.4): der Stern h brennt aus, nach
   dunkel s brennt er an derselben Bahnstelle in Farbe c weiter (life s,
   Schwere g). Kein Weissblitz: der neue Stern gilt als schon angebrannt. */
function kgWechsel(h,c,dunkel,life,g,mode,spur){
  if(!kgLebt(h)) return null; const [o,v]=kgOrt(h); kgAus(h); const r={h:null};
  kgSpaeter(dunkel,()=>{ const e=bahnOrt(o,v,g,dunkel), w=bahnTempo(v,g,dunkel); r.h=kgStern(psBig,e,w,c,life,g,mode||0,spur,life/0.9); });
  return r;
}

/* ---------- Hauptbilder ---------- */

/* Herzschlag (kugel75): Herz-Musterbombe, wie sie im Handel ist - rund
   50 rote Sterne, von Hand ins Herz gelegt, also ungleich verteilt und
   nicht ganz in der Form; die Bombe liegt nie genau zum Zuschauer (bis
   25 Grad gekippt und verdreht). Die Sterne bremsen, sinken und verloeschen
   einzeln. Der zweite Schlag ist die kleine Stufe (Tempo x Groesse).
   28.09., Tom: echt - Nachpruefung: vorher 90 gleich weit verteilte
   Doppelpunkte als perfekte Kurve, drei Herzen in vier Farben und ein
   Leuchtball im Zerlegerpunkt */
EFF.herzschlag=function(p,A,B,s){
  const q=QUAL(), [u0,v0]=basisBlick(p,0.45), dr=rand(-0.3,0.3), cd=Math.cos(dr), sd=Math.sin(dr), n=Math.round(52*q), G=2.6;
  const u=[u0[0]*cd+v0[0]*sd,u0[1]*cd+v0[1]*sd,u0[2]*cd+v0[2]*sd], v=[v0[0]*cd-u0[0]*sd,v0[1]*cd-u0[1]*sd,v0[2]*cd-u0[2]*sd];
  for(let i=0;i<n;i++){
    const t=rand(0,Math.PI*2), hx=Math.pow(Math.sin(t),3)+rand(-.07,.07), hy=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16+rand(-.07,.07);
    const sp=8.5*s*rand(0.93,1.05), c=i%4?A:B, x=rand(-.06,.06);
    const w=[(u[0]*hx+v[0]*hy)*sp+x,(u[1]*hx+v[1]*hy)*sp,(u[2]*hx+v[2]*hy)*sp-x];
    psBig.emit(p.x,p.y,p.z,w[0],w[1],w[2],c[0]*1.25,c[1]*1.25,c[2]*1.25,rand(1.6,2.3),G,0); }
  /* ein paar Sterne gehen immer daneben */
  for(let i=0;i<Math.round(5*q);i++){ const d=randDir(), w=rand(3,7)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(1.2,1.8),G,0); }
};

/* Suedsee (palmenkugel75): goldene Palme - sieben dicke Kometen mit
   Kohle-Goldschweif steigen als Wedel auf und biegen sich -, in der Mitte
   ein tuerkiser Kern, und aus der Krone plumpsen drei schwere Kokosnuss-
   Sterne, die unten mit einem Plopp zerplatzen. Gold und Tuerkis.
   (28.09., Tom: echt - vorher lag ein waagrechter Ring als Lagune in der Luft) */
EFF.palmeninsel=function(p,A,B,s,r){
  const q=QUAL(), gold=A||FW.gold, tk=B||FW.tuerkis, C=(r&&r.C)||FW.bernstein, dreh=rand(0,Math.PI*2), G=5.5, fu=[1,.66,.28];
  for(let a=0;a<7;a++){
    const az=dreh+a/7*Math.PI*2+rand(-0.25,0.25), el=rand(25,70)*Math.PI/180, sp=rand(9,10.5)*s;
    const d=[Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el)], v=kgMal(d,sp), T=rand(2.0,2.3);
    kgStern(psHuge,p,v,kgMal(gold,1.2),T,G,4,0.12);
    for(let i=0;i<Math.round(8*q);i++){ const e=streu(d,0.05), w=sp*rand(0.8,0.98); kgStern(psBig,p,kgMal(e,w),[gold[0],gold[1]*0.9,gold[2]*0.7],T*rand(0.85,1),G,4,0.3); }
    rkFunken(p,v,G,0.04,T,70,fu,{life:[0.5,1.0],g:3.2,streu:0.3,mit:0.08});
  }
  /* tuerkiser Kern - die Lagune */
  for(let i=0;i<Math.round(40*s*q);i++){ const d=randDir(), w=rand(2.2,3.4)*s; kgStern(psBig,p,kgMal(d,w),kgMal(tk,1.3),rand(1.6,2.1),2.4,0,0.05); }
  schall(p,v=>sfx.fizz(v*0.6));
  /* drei Kokosnuesse: schwere Sterne mit wenig Tempo, fallen schnell */
  for(let k=0;k<3;k++){ const v=[rand(-1.2,1.2),rand(-0.5,1.5),rand(-1.2,1.2)], T=rand(1.6,1.9), g=9;
    kgStern(psHuge,p,v,kgMal(C,1.1),T,g,0,0.15);
    kgSpaeter(T,()=>{ const e=bahnOrt(p,v,g,T), a2=SCHWEIF; SCHWEIF=0;
      for(let i=0;i<8;i++){ const d=randDir(), w=rand(1.5,3); psSmall.emit(e.x,e.y,e.z,d[0]*w,Math.abs(d[1])*w,d[2]*w,C[0],C[1],C[2],rand(0.2,0.35),4,0); }
      SCHWEIF=a2; schall(e,v2=>sfx.plopp(v2*0.8,1)); }); }
};

/* Chamaeleon (farbenmeer75): Geisterbombe (Rhein in Flammen 2022,
   "Ghost"). Die gruene Kugel geht auf; eine Farbgrenze wandert von links
   nach rechts hindurch - jeder Stern setzt, wenn sie ihn erreicht, 0,1 s
   aus und brennt orange weiter -, und alle verloeschen im selben
   Augenblick. Die Sterne fliegen und fallen wie jede Paeonie. Gruen und
   Orange. (28.09., Tom: echt - vorher drei Farben, ein Weissblitz je
   Stern und eine Kugel, die 6 s in der Luft stand) */
EFF.chamaeleon=function(p,A,B,s,r){
  const q=QUAL(), n=Math.round(150*q), [re]=kgAchsen(p), L=2.9, T=2.6, g=2.6, H=[], a1=kgMal(A,1.4), b1=kgMal(B,1.4);
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(7.4,8.6)*s;
    H.push({h:kgStern(psBig,p,kgMal(d,w),a1,L,g,0,0.06),x:d[0]*re[0]+d[1]*re[1]+d[2]*re[2]}); }
  for(const st of H){ const t1=0.8+(st.x+1)/2*0.7+rand(-0.04,0.04);
    kgSpaeter(t1,()=>{ const w=kgWechsel(st.h,b1,0.1,L-t1-0.1,g,0,0.06); st.w=w; }); }
  /* Kiekuchi: alle im selben Bild aus */
  kgSpaeter(T,()=>{ for(const st of H){ kgAus(st.h); if(st.w&&st.w.h) kgAus(st.w.h); } });
  const fft=v=>rauschF({dur:0.3,vol:0.1*v,typ:'bandpass',f:1600,f2:3800,q:0.8,an:0.05});
  kgSpaeter(0.8,()=>schall(p,fft));
};

/* Eiskristall (kristallkugel100): tuerkise Paeonie mit weissem Blink-
   Pistill, jeder Blinker im eigenen Takt; nach gut einer Sekunde enden
   die tuerkisen Sterne in feinem weissem Glitzer - Diamantstaub - und es
   knistert leise. Tuerkis und Weiss. (28.09., Tom: echt - vorher ein
   Oktaeder aus Punktkanten in einer Nebelscheibe, darin ein zweites) */
EFF.eiskristall=function(p,A,B,s,r){
  const q=QUAL(), tk=A||FW.tuerkis, w0=B||FW.weiss, G=2.8, n=Math.round(64*s*q);
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(8.2,9.8)*s, v=kgMal(d,w), T=rand(1.15,1.45);
    kgStern(psBig,p,v,kgMal(tk,1.3),T,G,0,0.06);
    kgSpaeter(T,()=>{ const e=bahnOrt(p,v,G,T), vr=bahnTempo(v,G,T), a=SCHWEIF; SCHWEIF=0.03;
      for(let k=0;k<Math.round(4*q);k++){ const x=randDir(), sw=rand(0.6,1.6); psMid.emit(e.x,e.y,e.z,vr[0]*0.5+x[0]*sw,vr[1]*0.5+x[1]*sw,vr[2]*0.5+x[2]*sw,w0[0]*1.3,w0[1]*1.3,w0[2]*1.35,rand(0.6,1.1),2.2,4); }
      SCHWEIF=a; }); }
  for(let i=0;i<Math.round(30*q);i++){ const d=randDir(), w=rand(2.2,3.4)*s, hz=rand(3,7), ph=rand(0,1);
    rkStern(psBig,p,kgMal(d,w),kgMal(w0,1.3),rand(2.0,2.6),(st,dt)=>{ rkFlug(st,dt,ZIEH,2.2); st.hell=((st.alter*hz+ph)%1)<0.35?1.8:0.04; }); }
  kgSpaeter(1.3,()=>schall(p,v=>sfx.eisknistern(v*0.8)));
};

/* Haengeweide (goldweide100): japanische Yanagi - kein Knall, die Sterne
   werden nur ausgeschuettet und ziehen dunkelgoldene Kohleschweife, die
   zehn Sekunden haengen und fast bis zum Boden sinken. Zum Schluss wird
   jeder Ast an der Spitze gruen und faellt weiter (farbige Spitze der
   Weide, fireworksland). */
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
  /* am Ende: je Ast eine gruene Spitze, eine nach der anderen - der Stern
     wechselt die Farbe und faellt weiter (28.09.: vorher blinkte sie auf
     einer gefuehrten Geraden) */
  for(const k of koepfe){ const tb=Math.max(1,k.L-rand(0.4,1.4));
    kgSpaeter(tb,()=>{ if(!kgLebt(k.h)) return; const [o,v]=kgOrt(k.h); kgAus(k.h);
      kgStern(psBig,o,v,kgMal(B,1.3),rand(0.6,0.9),g,0,0.1,rand(0.7,1.0)); }); }
  schall(p,v=>sfx.rieseln(v*0.7,8));
};

/* Feuertropfen (kugel100 »Drachenblut«, Stufe bei KG_TROPF_T): wo die
   roten Dahliensterne gerade fliegen, faengt ein Teil der Tropfen Feuer -
   orange Glut mit kurzem Goldschweif, die im Fallen dunkelrot verglimmt.
   Die Orte folgen derselben Flugbahn wie die Dahlie (Tempo 9,5-11 x
   Groesse, Schwere 3). Ersetzt den Flammenregen mit seinen Flammen-
   baellen, die 3-4 s in der Luft standen (echt.md 2.1). */
const KG_TROPF_T=1.3;
EFF.feuertropfen=function(p,A,B,s,r){
  const q=QUAL(), n=Math.round(34*s*q), or=A||FW.orange, fu=[1,.66,.26], T=KG_TROPF_T, alt=SCHWEIF;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(9.5,11)*s, v0=kgMal(d,w), o=bahnOrt(p,v0,3,T), vt=bahnTempo(v0,3,T), v=[vt[0]+rand(-.5,.5),vt[1]+rand(-.8,0),vt[2]+rand(-.5,.5)], L=rand(1.3,1.8);
    SCHWEIF=0.25; psBig.emit(o.x,o.y,o.z,v[0],v[1],v[2],or[0]*1.5,or[1]*1.4,or[2]*1.2,L,3.6,2,0.5,0.06,0.02); SCHWEIF=alt;
    if(i%2===0) rkFunken(o,v,3.6,0.05,L*0.8,20,fu,{life:[0.4,0.8],g:2.6,streu:0.25,mit:0.08}); }
  kgSpaeter(0.2,()=>schall(p,v=>sfx.crackle(v*0.35)));
};

/* Feuerreif (kugel150 »Weltenbrand«): rote Chrysantheme, deren Sterne
   nach gut einer Sekunde kurz aussetzen und golden glitzernd weiter-
   brennen (Farbwechsel mit Dunkelphase), um die Kugel ein leicht
   gekippter Saturnring aus orangem Feuer. Die sechs Glutnester auf dem
   Ring sind eine Stufe (kranz:'reif', dieselbe Ebene und Bahn). Rot,
   Orange, Gold. (28.09., Tom: echt - vorher Violett nach Gold ohne
   Dunkelphase und ein perfekter Reif) */
EFF.feuerreif=function(p,A,B,s,r){
  const q=QUAL(), rot=kgMal(A||FW.rot,1.25), gold=kgMal(B||FW.gold,1.15), or=kgMal(FW.orange,1.2), G=3.2;
  for(let i=0;i<Math.round(150*s*q);i++){ const d=randDir(), w=rand(8.5,10.5)*s, T=rand(1.05,1.25);
    const h=kgStern(psBig,p,kgMal(d,w),rot,T+0.02,G,0,0.1);
    kgSpaeter(T,()=>kgWechsel(h,gold,0.1,rand(1.0,1.4),G,4,0.3)); }
  /* Saturnring: flache Ellipse in der Ebene, auf der die Glutnester liegen */
  const [u,v]=basisBlick(p,0.9), a0=rand(0,Math.PI*2), m=Math.round(64*q);
  for(let i=0;i<m;i++){ const a=a0+i/m*Math.PI*2+rand(-0.04,0.04), x=Math.cos(a), y=Math.sin(a)*0.25+rand(-0.02,0.02), w=11.5*s*rand(0.96,1.04);
    kgStern(psBig,p,[(u[0]*x+v[0]*y)*w,(u[1]*x+v[1]*y)*w,(u[2]*x+v[2]*y)*w],or,rand(1.8,2.3),2.6,0,0.25); }
};

/* Sternenstaub (sternenstaub150): silberner Zeitregen (Jisa, "Time
   Rain") - fuenfzig grosse, langsam brennende Silbersterne treiben
   auseinander und sinken fuenf Sekunden lang, jeder rieselt zischend
   Glitzer ab; dazu ein kurzer weisser Kern. Silber und Weiss.
   (28.09., Tom: echt - vorher eine drehende Spiralgalaxie aus Punkten
   in einer Nebelscheibe) */
EFF.sternenstaub=function(p,A,B,s,r){
  const q=QUAL(), sil=A||FW.silber, w0=B||FW.weiss, n=Math.round(15*s*q), G=2.0, fu=[1.05,1.08,1.15];
  /* 28.09. nach dem Rendern: die Koepfe waren ruhige Punkte wie die
     Himmelssterne - jetzt funkeln sie (Glitzersatz) und ziehen einen
     dichten, kurzen Glitzerschweif hinter sich her */
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(5.5,7.5)*s, v=kgMal(d,w), L=rand(4.6,5.6);
    kgStern(psHuge,p,v,kgMal(sil,1.3),L,G,4,0.12);
    rkFunken(p,v,G,0.25,L-0.2,44,fu,{life:[0.35,0.75],g:2.2,streu:0.22,mit:0.04}); }
  for(let i=0;i<Math.round(40*q);i++){ const d=randDir(), w=rand(2.5,4)*s; kgStern(psBig,p,kgMal(d,w),kgMal(w0,1.2),rand(1.2,1.6),2.4,0,0.05); }
  schall(p,v=>sfx.rieseln(v*0.8,5));
  kgSpaeter(1.5,()=>schall(p,v=>sfx.crackle(v*0.25)));
};

/* Sternkranz (sternkugel150): 16 rote Kometen fliegen als Ring in einer
   Ebene auseinander, dann ein gemeinsames Krachen - jeder zerspringt als
   Crossette in ein Kreuz aus vier weissen Sternen, jedes Kreuz anders
   gedreht: ein Kranz aus 16 kleinen "+". Rot und Weiss. */
EFF.kreuzkranz=function(p,A,B,s,r){
  const [u,v]=basisBlick(p,0.5), a0=rand(0,Math.PI*2), g=1.5, alt=SCHWEIF, TE=0.78+0.9, fu=[1,.94,.84];
  for(let k=0;k<16;k++){
    const a=a0+k/16*Math.PI*2+rand(-0.05,0.05), ca=Math.cos(a), sa=Math.sin(a), d=[u[0]*ca+v[0]*sa,u[1]*ca+v[1]*sa,u[2]*ca+v[2]*sa], tg=[-u[0]*sa+v[0]*ca,-u[1]*sa+v[1]*ca,-u[2]*sa+v[2]*ca];
    /* Tempo 8 statt 11 m/s*s: mit 11 lag der Kranz vom Zuendpult aus am Bildrand */
    const w=8*s*rand(0.97,1.03), vel=kgMal(d,w), ts=0.75+rand(-0.03,0.03);
    SCHWEIF=0.05; psHuge.emit(p.x,p.y,p.z,vel[0],vel[1],vel[2],A[0]*1.3,A[1]*1.3,A[2]*1.3,ts,g,0);
    for(let i=0;i<3;i++){ const e=streu(d,0.012), ww=w*rand(0.97,1); psBig.emit(p.x,p.y,p.z,e[0]*ww,e[1]*ww,e[2]*ww,A[0]*1.6,A[1]*1.6,A[2]*1.6,ts,g,0); }
    SCHWEIF=alt;
    /* Kometenschweif aus fallenden, streuenden Funken - 28.09. nach dem
       Rendern: der Glitzerstern mit 0,4 s Spur zog 16 duenne Speichen
       vom Zerlegerpunkt aus (Laser) */
    rkFunken(p,vel,g,0.03,ts,90,fu,{life:[0.18,0.42],g:3,streu:0.9,mit:0.12});
    kgSpaeter(ts,()=>{ const o=bahnOrt(p,vel,g,ts), w2=bahnTempo(vel,g,ts), a2=SCHWEIF, ro=rand(0,Math.PI*2), cr=Math.cos(ro), sr=Math.sin(ro);
      const e1=[tg[0]*cr+d[0]*sr,tg[1]*cr+d[1]*sr,tg[2]*cr+d[2]*sr], e2=[-tg[0]*sr+d[0]*cr,-tg[1]*sr+d[1]*cr,-tg[2]*sr+d[2]*cr];
      SCHWEIF=0; psBig.emit(o.x,o.y,o.z,w2[0],w2[1],w2[2],2,2,2,0.034,g,0);
      /* vier Arme als kleine Kometen: kurze Spur plus Funken - so steht ein "+" */
      for(const [e0,f] of [[e1,1],[e1,-1],[e2,1],[e2,-1]]){ const e=streu(e0,0.08), x=9*f*rand(0.9,1.1), va=[w2[0]+e[0]*x,w2[1]+e[1]*x,w2[2]+e[2]*x];
        SCHWEIF=0.18; psBig.emit(o.x,o.y,o.z,va[0],va[1],va[2],B[0]*1.7,B[1]*1.7,B[2]*1.7,TE-ts,g,0);
        SCHWEIF=0.1; psBig.emit(o.x,o.y,o.z,va[0]*0.97,va[1]*0.97,va[2]*0.97,B[0],B[1],B[2],TE-ts,g,0);
        rkFunken(o,va,g,0.02,TE-ts-0.05,34,fu,{life:[0.15,0.35],g:3,streu:0.6,mit:0.1}); }
      SCHWEIF=a2; });
  }
  kgSpaeter(0.75,()=>{ flash(p,[1,1,1],2.5+s,0.3);
    schall(p,vl=>{ for(let i=0;i<16;i++) later(Math.random()*0.05,()=>sfx.crack(vl*0.35)); }); });
};

/* Leuchtqualle (goldkrone200): echte "Jellyfish"-Bombe - eine goldene
   Brokatglocke (dichter Glitzer, der nach oben aufgeht und nach aussen
   und unten durchhaengt), darunter Fangarme: schwere Glitzersterne, nach
   unten ausgestossen, die langsam mit langen Schweifen sinken. Im Schirm
   leuchtet ein blauer Pistill (Stufe). Gold und Blau. (28.09., Tom: echt -
   vorher ein pulsierender Pfirsich-Schirm mit gefuehrten, wehenden
   Armen, einer Leuchtscheibe und einem Blasen-Aufstieg) */
EFF.qualle=function(p,A,B,s,r){
  const q=QUAL(), gold=A||FW.gold, G=3.4, fu=[1,.8,.42];
  for(let i=0;i<Math.round(110*s*q);i++){ const d0=randDir(), d=[d0[0],Math.abs(d0[1])*0.9+0.1,d0[2]], l=Math.hypot(d[0],d[1],d[2]), w=rand(6,8)*s;
    kgStern(psBig,p,[d[0]/l*w,d[1]/l*w+1,d[2]/l*w],gold,rand(3.0,3.8),G,4,0.7); }   // 28.09.: Spur 0,7 statt 1,1 s - sonst gerade Goldspeichen aus der Mitte
  for(let i=0;i<Math.round(16*q);i++){ const a=rand(0,Math.PI*2), el=-rand(0.9,1.4), w=rand(2.5,4)*s, v=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w], L=rand(4.2,5.0);
    kgStern(psHuge,p,v,kgMal(gold,1.1),L,1.6,4,1.8);
    rkFunken(p,v,1.6,0.3,L-0.2,18,fu,{life:[0.9,1.5],g:2.2,streu:0.1,mit:0.02}); }
  schall(p,v=>sfx.zischen(v*0.5,3));
};

/* Kaiserkrone (kaiserkrone): Meisterbombe nach japanischem Vorbild
   (Yaeshin). Fuenf ineinanderliegende Kugeln (Farben par.kerne, innen ->
   aussen) in einer goldenen Brokatkrone; bei 1,0 und 1,8 s wandern die
   Farben eine Schale nach aussen (innen wird weiss), bei 2,6 s erloeschen
   alle Kernsterne im selben Bild (Kiekuchi). Die Krone haengt bis 8 s,
   zum Schluss funkeln ihre Spitzen silbern. */
EFF.fuenfkern=function(p,A,B,s,r){
  const q=QUAL(), kerne=(r&&r.kerne)||['weiss','violett','weiss','violett','weiss'].map(K);
  const V=[2.5,4.5,6.5,8.5,10.5], N=[30,50,70,90,110], schalen=[], krone=[], F=0.8, HK=1.6;   // HK: Kerne heller als die Goldkrone - sonst gingen sie darin unter (Render 28.09.)
  let farben=kerne.slice(0,5);
  for(let k=0;k<5;k++){ const hs=[], n=Math.round(N[k]*q);
    /* Schwere 2,4 wie jeder Stern - mit 0,3 standen die Kerne in der Luft (28.09.) */
    for(let i=0;i<n;i++){ const d=randDir(), w=V[k]*s*F*rand(0.97,1.03); hs.push(kgStern(psBig,p,kgMal(d,w),kgMal(farben[k],HK),4,2.4,0,0.08)); }
    schalen.push(hs); }
  /* Spur 0,5 s: mit 1,6 s (und noch mit 0,8 s, Nachpruefung 28.09.) liefen
     gleich helle gerade Speichen bis in die Mitte (Laser); die Koernung
     machen die Kohlefunken */
  for(let i=0;i<Math.round(190*q);i++){ const d=randDir(), w=11.5*s*F*rand(0.92,1.03), L=rand(7.6,8.3), v=kgMal(d,w);
    krone.push(kgStern(psBig,p,v,A,L,3.3,4,0.5));
    if(i%4===0) rkFunken(p,v,3.3,0.1,2.4,14,[1,.66,.26],{life:[0.5,1.0],g:2.6,streu:0.25,mit:0.05}); }
  /* Verwandlung: jede Schale nimmt die Farbe ihrer inneren Nachbarin */
  const henka=()=>{ farben=[FW.weiss].concat(farben.slice(0,4));
    schalen.forEach((hs,k)=>{ for(const h of hs) kgFarbe(h,farben[k],HK); }); };   // ohne Aufblitzen, wie ein echter Wechselstern
  kgSpaeter(1.0,henka); kgSpaeter(1.8,henka);
  /* Kiekuchi: alle Kernsterne im selben Bild aus, ohne Geraeusch */
  kgSpaeter(2.6,()=>schalen.forEach(hs=>hs.forEach(kgAus)));
  /* Silberspitzen der Krone */
  kgSpaeter(6.5,()=>{ for(const h of krone) if(kgLebt(h)){ kgFarbe(h,B,2.2); h.ps.md[h.i]=1; } });
  schall(p,v=>sfx.rieseln(v*0.6,6));
};

/* Bluetenkranz (kugel200): Zehnfachbruch mit zwei Farben - zehn Blueten
   auf einem Ring (Drall nur noch, wenn par.drall gesetzt ist - die Sorte
   setzt ihn seit 28.09. nicht mehr). Ersetzt den Buntmix aus fuenf Farben. */
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

/* Spurlaengen und Familien der Hauptbilder (mitSchweif, effPassen) */
/* drachenblut (Bibliothek) zeigt nur kugel100: die roten Dahliensterne
   zogen 0,3 s lange rote Striche (Laser) - eine Dahlie hat kurze Spuren */
Object.assign(EFF_SCHWEIF,{drachenblut:0.12,herzschlag:0.05,palmeninsel:0.12,chamaeleon:0.06,eiskristall:0.06,haengeweide:2.8,feuertropfen:0.25,feuerreif:0.1,sternenstaub:0.1,kreuzkranz:0.35,qualle:0.7,fuenfkern:0.5,himmelsbrecher:0.3});
Object.assign(EFF_FAMILIE,{herzschlag:'figur',palmeninsel:'haenger',chamaeleon:'kugel',eiskristall:'kugel',haengeweide:'haenger',feuertropfen:'flamme',feuerreif:'kugel',sternenstaub:'haenger',kreuzkranz:'knister',qualle:'haenger',fuenfkern:'kugel'});

/* ---------- Die Sorten (Katalog, verbindlich) ---------- */
Object.assign(KUGEL,{
  /* 75 mm - ein Bild mit einem Kniff */
  /* 28.09., Tom: echt - ein Farbthema (Rot, Rosa), zwei Schlaege, kein Leuchtball */
  kugel75:{kal:1,sz:2.05,pw:2.0,fuse:1.70,th:'herz',haupt:'herzschlag',A:'rot',B:'rose',
    steig:'keiner', bruchOpt:{kern:false,nachglitzer:false}, ton:'herzton',
    stufen:[{t:0.55,eff:'herzschlag',sz:0.55,A:'rose',B:'rot',leise:true}]},      // "ba-DUMM"
  palmenkugel75:{kal:1,sz:2.10,pw:2.1,fuse:1.70,th:'wald',haupt:'palmeninsel',A:'gold',B:'tuerkis',C:'bernstein',
    steig:'gold', bruchOpt:{kern:false,nachglitzer:false}, stufen:[]},
  farbenmeer75:{kal:1,sz:2.20,pw:2.4,fuse:1.72,th:'tropen',haupt:'chamaeleon',A:'gruen',B:'orange',
    steig:'silber', bruchOpt:{kern:false,nachglitzer:false}, stufen:[]},
  /* 100 mm - zwei Stufen */
  kristallkugel100:{kal:2,sz:2.60,pw:3.8,fuse:1.85,th:'eis',haupt:'eiskristall',A:'tuerkis',B:'weiss',
    steig:'blink', bruchOpt:{kern:false,nachglitzer:false}, stufen:[]},
  kugel100:{kal:2,sz:2.70,pw:4.0,fuse:1.85,th:'glut',haupt:'drachenblut',A:'rot',B:'scharlach',
    steig:'glut', bruchOpt:{kern:false,nachglitzer:false},   // 28.09., Tom: echt - ohne Leuchtball (im Bild eine 15 m grosse orange Scheibe)
    stufen:[{t:0.04,eff:'pistill',sz:0.40,A:'gold',B:'orange',leise:true},            // Drachenauge
            {t:KG_TROPF_T,eff:'feuertropfen',sz:1.0,A:'orange',B:'rot',leise:true}]},  // Tropfen fangen Feuer
  goldweide100:{kal:2,sz:2.80,pw:4.6,fuse:1.90,th:'gold',haupt:'haengeweide',A:'bernstein',B:'limette',
    steig:'komet', bruchOpt:{kern:false,nachglitzer:false,flash:0.3}, ton:'poka',
    stufen:[{t:0.05,eff:'pistill',sz:0.28,A:'limette',B:'gruen',leise:true}]},
  /* 150 mm - drei Stufen */
  kugel150:{kal:3,sz:3.25,pw:5.8,fuse:2.00,th:'glut',haupt:'feuerreif',A:'rot',B:'gold',
    steig:'knister', bruchOpt:{kern:false,nachglitzer:false},   // 28.09.: ohne Leuchtball
    stufen:[{t:0.04,eff:'pistill',sz:0.42,A:'gold',B:'rot',leise:true},              // Glutkern
            {t:1.50,eff:'tausend',sz:0.26,A:'orange',B:'gold',n:6,kranz:'reif'}]},  // Glut springt ueber
  sternenstaub150:{kal:3,sz:3.30,pw:6.0,fuse:2.00,th:'silber',haupt:'sternenstaub',A:'silber',B:'weiss',
    steig:'silber', bruchOpt:{kern:false,nachglitzer:false}, stufen:[]},
  sternkugel150:{kal:3,sz:3.45,pw:6.4,fuse:2.05,th:'rotweiss',haupt:'kreuzkranz',A:'rot',B:'weiss',
    steig:'pfeif', bruchOpt:{kern:false,nachglitzer:false},
    stufen:[{t:0.90,eff:'knister',sz:0.30,A:'silber',B:'weiss'}]},   // Knisterkern in der Kranzmitte
  /* 200 mm - Bewegung im Bild */
  /* 28.09., Tom: echt - Nachpruefung: ohne Drall. Die zwei gegenlaeufig
     kreisenden Raeder waren gelenkte Bewegung (echt.md 1.9 Nr. 4); ein
     echter Mehrfachbruch legt seine Blueten als Kranz, und die fliegen
     gerade auseinander. Jetzt »Bluetenkranz« statt »Uhrwerk«. */
  kugel200:{kal:4,sz:3.95,pw:7.8,fuse:2.15,th:'zorn',haupt:'zehnfach',A:'magenta',B:'gold',
    steig:'brokat', bruchOpt:{kern:false,nachglitzer:false},   // 28.09.: ohne Leuchtball in der leeren Mitte
    stufen:[{t:0.50,eff:'pistill',sz:0.30,n:10,kranz:0.55,A:'gold',B:'magenta',bruchOpt:{kern:false}},   // innerer Kranz (ohne Kern: sonst zehn Leuchtkugeln)
            {t:1.60,eff:'wechsel',sz:0.28,A:'gold',B:'weiss',bruchOpt:{kern:false}}]},          // Mitte
  goldkrone200:{kal:4,sz:4.10,pw:8.3,fuse:2.15,th:'gold',haupt:'qualle',A:'gold',B:'blau',
    steig:'glut', bruchOpt:{kern:false,nachglitzer:false}, ton:'wumms',   // weiches "Wumpf" statt Knall
    stufen:[{t:0.04,eff:'pistill',sz:0.30,A:'blau',B:'blau',leise:true}]},   // Leuchtorgan: blauer Pistill in der Glocke (28.09.: vorher blaue Blinker ueber dem Schirm - Punkte)
  /* 300 mm - Meisterbomben */
  kugel300:{kal:5,sz:4.75,pw:10.8,fuse:2.30,th:'silber',haupt:'himmelsbrecher',A:'silber',B:'himmel',
    steig:'titanspur', stehen:1, bruchOpt:{kern:false},       // Titanlinie bleibt 1 s als Funkenvorhang; 28.09.: ohne Leuchtball (im Bild eine weisse Scheibe von 20 m)
    stufen:[{t:0.06,eff:'glitzerweide',sz:0.80,A:'silber',B:'weiss',leise:true},     // Silberweide
            {t:0.55,eff:'dahlie',sz:0.20,A:'weiss',B:'silber',risse:{strahlen:6,je:4,r:[8,23],dt:0.15,zack:0.10},bruchOpt:{kern:false}}]},   // 24 Splitter, ohne Leuchtkugeln
  kaiserkrone:{kal:5,sz:5.00,pw:11.5,fuse:2.40,th:'koenig',haupt:'fuenfkern',
    kerne:['weiss','violett','weiss','violett','weiss'], A:'gold',B:'silber',
    steig:'gold', kobana:3, bruchOpt:{kern:false,nachglitzer:false}, stufen:[]}   // 28.09.: gerader Goldschweif statt Schlangenlinie
});

/* Signaturen: je Kugel genau ein Hauptbild, das es sonst nirgends gibt */
Object.assign(SIGNATUR,{
  kugel75:{eff:'herzschlag',text:'Rotes Herz, das zweimal schlägt'},
  palmenkugel75:{eff:'palmeninsel',text:'Goldpalme mit türkisem Kern, Kokosnüsse fallen'},
  farbenmeer75:{eff:'chamaeleon',text:'Geisterbombe: Grün wird Stern für Stern Orange'},
  kristallkugel100:{eff:'eiskristall',text:'Türkise Kugel mit weißem Blinkkern, zerfällt zu Diamantstaub'},
  kugel100:{eff:'drachenblut',text:'Blutrote Dahlie tropft und fängt Feuer'},
  goldweide100:{eff:'haengeweide',text:'zehn Sekunden Goldweide bis fast zum Boden, grüne Spitzen'},
  kugel150:{eff:'feuerreif',text:'Rot wird Gold mit Dunkelphase, Saturnring, Glut springt über'},
  sternenstaub150:{eff:'sternenstaub',text:'silberner Zeitregen, fünf Sekunden Sternenstaub'},
  sternkugel150:{eff:'kreuzkranz',text:'Ring aus Kometen, die zu 16 Kreuzen zerplatzen'},
  kugel200:{eff:'zehnfach',text:'zwei Kränze aus zehn Blüten, Magenta und Gold'},
  goldkrone200:{eff:'qualle',text:'Brokatglocke mit sinkenden Fangarmen, blaues Leuchtorgan'},
  kugel300:{eff:'himmelsbrecher',text:'Himmel reißt in sechs Linien, 24 Splitterbrüche, Silberweide'},
  kaiserkrone:{eff:'fuenfkern',text:'fünf Kerne verwandeln sich und erlöschen gleichzeitig in der Goldkrone'}
});

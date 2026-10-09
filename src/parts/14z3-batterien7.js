/* =========================================================
   Batterie-Runde (Tom, 09.10.2026, docs/uebergabe/batterien-0910.md).
   Daten 02j, Verpackung 04l.
   Toms haeufigster Mangel: "Punkte am Himmel". Jeder Stern dieser Runde
   hat darum Textur wie die Kugeln der Runde 5/6: weissheisser Kern mit
   farbigem Hof (k5Stern), Leuchtspur, Glitzerschleier, der abkuehlt
   (k5Schleier/rkFunken), Brokat-Gold mit flackerndem Kopf (k5Brokat),
   Blinker (Modus 1), Knister (Modus 3). Keine einzelnen runden Pixel.
   1. Werkzeuge und Bruchbilder (b7*), dazu Klang (Abschuss/Bruch mit den
      Bausteinen der Runde 6: k6Knall)
   2. Bearbeitet: Kornblumen, Tautropfen, Bienenweide, Ozean, Rosenherz,
      Meteorschauer
   3. Elf neue Batterien nach echten Vorbildern (Quellen in
      batterien-0910.md); die Reihenfolge und Effekte folgen den
      Effektlisten der Hersteller, Whistles/Pfeifer sind durch Silberwirbel
      ersetzt (Tom: "keine Pfeif-Sachen")
   4. Lizenztexte ohne die gestrichenen Produkte
   ========================================================= */

/* ---------- 1. Werkzeuge ---------- */
const b7Hell=(c,k)=>kgMal(c,k||1.6);
/* Kopf mit Kern und Hof wie k5Stern, aber satter: weniger Weiss im Kern
   (gerendert 09.10.: Kornblumen und Meer wirkten mit 38 % Weiss blass) */
const b7Kopf=(p,v,c,T,G,o)=>k5Stern(p,v,c,T,G,Object.assign({weiss:0.18,hof:1.15},o||{}));
/* Glitzerschleier entlang einer Bahn (fein, kuehlt ab) mit einigen Glanzpunkten */
function b7Glanz(p,v,G,t0,t1,c,rate,o){ o=o||{};
  rkFunken(p,v,G,t0,t1,rate,c,{ps:psMid,life:o.life||[0.5,1.0],g:o.g!==undefined?o.g:0.8,streu:o.streu||0.18,mit:0.04,mode:4,spur:0.05});
  if(o.glanz) rkFunken(p,v,G,t0,t1,o.glanz,mischF(c,[1.6,1.5,1.3],0.4),{ps:psBig,life:[0.25,0.5],g:1,streu:o.streu||0.2,mit:0.04,mode:4,spur:0}); }
/* Blinker (Strobe) an einer Stelle: eigener Takt je Stern (Modus 1) */
function b7Blink(e,w,c,L,G){ psBig.emit(e.x,e.y,e.z,w[0]*0.35,w[1]*0.35,w[2]*0.35,c[0]*1.8,c[1]*1.8,c[2]*1.8,L||1,G===undefined?1.6:G,1); }
/* "Spitze" (lace): viele winzige Knisterblueten um einen Punkt */
function b7Spitze(e,w,c,n){ const a=SCHWEIF; SCHWEIF=0; n=Math.round((n||8)*QUAL())+2;
  for(let i=0;i<n;i++){ const d=randDir(), sp=rand(1.4,3.4);
    (i%3?psBig:psSmall).emit(e.x,e.y,e.z,w[0]*0.2+d[0]*sp,w[1]*0.2+d[1]*sp,w[2]*0.2+d[2]*sp,c[0]*1.7,c[1]*1.7,c[2]*1.7,rand(0.35,0.75),1.2,3); }
  SCHWEIF=a; }
/* Stern spaeter weiterfuehren: Ort/Tempo eines Sterns nach t */
const b7Nach=(p,v,G,t)=>[sternNach(p,v[0],v[1],v[2],G,t),bahnTempo(v,G,t)];
const B7_WEISS=[1.15,1.15,1.2];
let B7_ZAEHL=0;

/* ---------- Klang ----------
   Brueche der grossen Batterien und Titanschlaege mit dem Knall der
   Runde 6 (Druckstoss, Tiefton, Raum) - klein geschaltet: kuerzere
   Periode, weniger Pegel als jede Kugel (Batteriebruch 35-60 m) */
Object.assign(sfx,{
  b7Schlag:(v,s)=>{ if(typeof k6Knall!=='function'||!AC) return sfx.bkSalut(v,s); k6Knall(Object.assign({},K6_ART.peitsche,{f:1.3,laut:0.42,P:5,roll:[0.16,1.2,3,260],hall:0.5}),v); },
  b7Donner:(v,s)=>{ if(typeof k6Knall!=='function'||!AC) return sfx.bkDonnerhall(v,s); k6Knall(Object.assign({},K6_ART.donner,{f:1.35,laut:0.36,P:8,roll:[0.3,2.6,5,190]}),v); },
  b7Krone:(v,s)=>{ if(typeof k6Knall!=='function'||!AC) return sfx.bkBrokat(v,s); k6Knall(Object.assign({},K6_ART.zisch,{f:1.4,laut:0.3,P:6,zisch:[0.06,2.2],roll:[0.18,1.6,4,220]}),v); }
});

/* ---------- Bruchbilder ---------- */
/* Gold-Titanweide: flackernde Brokatkoepfe mit Glitzerschleier, die
   langsam haengen; dazwischen farbige Sterne (B) */
EFF.b7weide=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(24*s*q)+8, T=rand(3.0,3.5);
  k5Brokat(p,n,7.6*s,T,1.4,{glanz:4,staub:11,kopf:[1.9,1.4,0.6]});
  const m=Math.round(9*s*q)+3; nKugel(m,6.2*s,v=>b7Kopf(p,v,b7Hell(B,1.55),rand(1.5,1.9),2.2,{spur:0.15}));
  schall(p,x=>later(0.25,()=>sfx.rieseln(x*0.45,2.6))); };
/* Nishiki-Kamuro: dichter, langer Goldschleier bis tief hinab */
EFF.b7nishiki=function(p,A,B,s,r){ grOhneZutaten(r,0.4);
  const q=QUAL(), n=Math.round(34*s*q)+10;
  k5Brokat(p,n,7.2*s,rand(3.8,4.3),1.15,{glanz:8,staub:22,kopf:[1.9,1.35,0.55]});
  schall(p,x=>later(0.3,()=>{ sfx.rieseln(x*0.5,3.5); later(1.2,()=>sfx.crackle(x*0.25)); })); };
/* Nishiki-Weide mit roten und blauen Perlen (A, B), die darin haengen */
EFF.b7nishikiperlen=function(p,A,B,s,r){ EFF.b7nishiki(p,A,B,s,r);
  const q=QUAL(), m=Math.round(12*s*q)+4;
  nKugel(m,5.4*s,(v,i)=>b7Kopf(p,v,b7Hell(i%2?B:A,1.6),rand(2.4,2.9),1.6,{hof:1.25,spur:0.1})); };
/* Titan-Goldweide (riesig): weissgoldene Koepfe, Titanblitz in der Mitte */
EFF.b7titanweide=function(p,A,B,s,r){ grOhneZutaten(r,0.7);
  const q=QUAL(), n=Math.round(28*s*q)+10;
  k5Punkt(p,[2,1.95,1.85],18,12,1.4);
  k5Brokat(p,n,8.8*s,rand(3.6,4.0),1.3,{glanz:6,staub:12,kopf:[1.95,1.75,1.25]});
  if(r) r.knall='b7Donner'; };
/* Brokatkrone: Goldbrokat-Krone, deren Spitzen am Ende blinken (B und
   Weiss im Wechsel); bunt: Rot, Gruen, Gold */
function b7Krone(p,A,B,s,r,bunt){ grOhneZutaten(r,0.55);
  const q=QUAL(), n=Math.round(22*s*q)+8, T=rand(2.2,2.5), BU=[FW.rot,FW.gruen,FW.gold];
  const hs=k5Brokat(p,n,9.2*s,T,2.0,{glanz:4,staub:11});
  hs.forEach(([h,v,L],i)=>{ if(!B&&!bunt) return; if(i%3===2) return;
    kgSpaeter(L*0.8,()=>{ if(!kgLebt(h)) return; const [e,w]=kgOrt(h); b7Blink(e,w,bunt?BU[i%3]:(i%2?B7_WEISS:B),rand(0.8,1.2),1.6); }); });
  if(r&&!r.knall) r.knall='b7Krone'; }
EFF.b7brokatkrone=function(p,A,B,s,r){ b7Krone(p,A,B,s,r,false); };
EFF.b7brokatbunt=function(p,A,B,s,r){ b7Krone(p,A,B,s,r,true); };
/* Brokatkrone mit orangen und gruenen Dahlien (schwere, grosse Sterne) */
EFF.b7kronedahlie=function(p,A,B,s,r){ b7Krone(p,A,null,s,r,false);
  const q=QUAL(), m=Math.round(10*s*q)+4;
  nKugel(m,6.8*s,(v,i)=>b7Kopf(p,v,b7Hell(i%2?B:FW.orange,1.6),rand(1.8,2.2),2.4,{hof:1.3,spur:0.28})); };
/* Corolla: flacher Kranz aus Goldschweifen, am Ende rote Blinker */
EFF.b7corolla=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(14*s*q)+6, [R,U,F]=kgAchsen(p), a0=rand(0,6.3), T=rand(1.5,1.7);
  for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, c=Math.cos(a), sn=Math.sin(a), w=rand(9.5,10.5)*s;
    const d=[R[0]*c+(F[0]*0.8+U[0]*0.35)*sn,R[1]*c+(F[1]*0.8+U[1]*0.35)*sn+0.12,R[2]*c+(F[2]*0.8+U[2]*0.35)*sn], v=kgMal(d,w);
    const h=k5Tiger(p,v,b7Hell(A,1.2),T,2.0,{glanz:5,staub:16});
    kgSpaeter(T*0.9,()=>{ const [e,ww]=b7Nach(p,v,2.0,T*0.9); b7Blink(e,ww,B,rand(0.9,1.2),1.4); }); }
  schall(p,x=>later(T*0.9,()=>sfx.crackle(x*0.35))); };
/* Crossette: Sterne fliegen aus und zerspringen nach gut einer halben
   Sekunde ueber Kreuz in vier, deren Enden in Spitze (B) aufbluehen */
EFF.b7crossetteklar=function(p,A,B,s,r){ EFF.b7crossette(p,A,null,s,r); };
EFF.b7crossette=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(8*s*q)+5, G=2.6;
  for(let i=0;i<n;i++){ const d=randDir(), v=kgMal(d,rand(9.5,11)*s), T1=rand(0.5,0.65);
    b7Kopf(p,v,b7Hell(A,1.5),T1,G,{spur:0.22}); b7Glanz(p,v,G,0.04,T1,kgMal(A,0.9),14,{life:[0.4,0.7]});
    kgSpaeter(T1,()=>{ const [o,w]=b7Nach(p,v,G,T1), l=Math.hypot(w[0],w[1],w[2])||1, [u1,u2]=quer([w[0]/l,w[1]/l,w[2]/l]), ro=rand(0,6.3);
      k5Punkt(o,[1.6,1.55,1.4],4,4,0.6);
      for(let k=0;k<4;k++){ const e=ro+k*Math.PI/2, ce=Math.cos(e), se=Math.sin(e), sp=rand(5.5,6.8)*s, L=rand(0.7,0.9);
        const dv=[w[0]*0.35+(u1[0]*ce+u2[0]*se)*sp,w[1]*0.35+(u1[1]*ce+u2[1]*se)*sp,w[2]*0.35+(u1[2]*ce+u2[2]*se)*sp];
        b7Kopf(o,dv,b7Hell(A,1.5),L,2.4,{spur:0.42}); b7Glanz(o,dv,2.4,0.03,L,mischF(A,[1.2,.9,.4],0.3),26,{glanz:6,life:[0.35,0.7]});
        if(B) kgSpaeter(L,()=>{ const [e2,w2]=b7Nach(o,dv,2.4,L); b7Spitze(e2,w2,B,7); }); } }); }
  schall(p,x=>{ later(0.58,()=>sfx.crack(x*0.5)); if(B) later(1.4,()=>sfx.crackle(x*0.45)); }); };
/* Schleierkraut: Farbstern-Paeonie, jeder Stern zerstaeubt am Ende zu einer
   Wolke winziger weisser Glitzerblueten; bunt: Rot/Blau/Gruen/Gelb */
function b7Schleier(p,A,B,s,r,bunt){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(26*s*q)+8, G=2.2, BU=[FW.rot,FW.blau,FW.gruen,FW.zitrone];
  nKugel(n,9.4*s,(v,i)=>{ const T=rand(0.95,1.15), c=bunt?BU[i%4]:A;
    b7Kopf(p,v,b7Hell(c,1.55),T,G,{spur:0.14}); b7Glanz(p,v,G,0.05,T,kgMal(c,0.8),8,{life:[0.3,0.6]});
    kgSpaeter(T,()=>{ const [e,w]=b7Nach(p,v,G,T), a=SCHWEIF; SCHWEIF=0;
      for(let k=0;k<Math.round(7*q)+3;k++){ const d=randDir(), sp=rand(1.2,2.8);
        psBig.emit(e.x,e.y,e.z,w[0]*0.25+d[0]*sp,w[1]*0.25+d[1]*sp,w[2]*0.25+d[2]*sp,1.7,1.7,1.75,rand(0.4,0.9),0.9,k%2?3:4); }
      SCHWEIF=a; }); });
  schall(p,x=>later(1.05,()=>{ sfx.crackle(x*0.35); later(0.3,()=>sfx.rieseln(x*0.3,1.2)); })); }
EFF.b7schleier=function(p,A,B,s,r){ b7Schleier(p,A,B,s,r,false); };
EFF.b7schleierbunt=function(p,A,B,s,r){ b7Schleier(p,A,B,s,r,true); };
/* Glitzerweide: Silber- oder Rot-Glitzerkoepfe, die als Weide sinken und
   einen dichten Glitzerfaden ziehen, dazwischen blaue Sterne (B) */
EFF.b7glitzerweide=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(18*s*q)+6, G=2.0;
  nKugel(n,7.6*s,v=>{ const T=rand(2.5,2.9); b7Kopf(p,v,b7Hell(A,1.2),T,G,{spur:0.2,hof:0.9});
    b7Glanz(p,v,G,0.05,T*0.95,mischF(A,[1.3,1.25,1.2],0.35),20,{glanz:5,life:[0.6,1.1],g:0.7}); });
  if(B){ const m=Math.round(8*s*q)+3; nKugel(m,6*s,v=>b7Kopf(p,v,b7Hell(B,1.6),rand(1.5,1.8),2.3,{spur:0.14})); }
  schall(p,x=>later(0.2,()=>sfx.rieseln(x*0.5,2.5))); };
/* Goldweide zu Farbe: die Spitzen werden Rot, Weiss blinkend oder Blau */
EFF.b7weidefarbe=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(20*s*q)+7, T=rand(2.5,2.8), z=(B7_ZAEHL++)%3;
  const hs=k5Brokat(p,n,8.2*s,T,1.7,{glanz:4,staub:10});
  hs.forEach(([h,v,L],i)=>kgSpaeter(L*0.72,()=>{ if(!kgLebt(h)) return; const [e,w]=kgOrt(h);
    if(z===1) b7Blink(e,w,B7_WEISS,rand(0.9,1.2),1.5); else b7Kopf(e,kgMal(w,0.4),b7Hell(z?FW.blau:B,1.6),rand(0.8,1.0),1.8,{spur:0.12}); }));
  schall(p,x=>later(0.3,()=>sfx.rieseln(x*0.45,2.2))); };
/* Spinne: sehr schnelle, kurze Silber- (oder Gold-)Streifen, die sofort
   abbremsen; an den Enden Blinker in B (rot/gruen im Wechsel) */
function b7Spinne(p,A,B,s,r,gold){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(32*s*q)+10, kopf=gold?[1.8,1.25,0.5]:[1.55,1.58,1.7], gl=gold?[1.2,.8,.3]:[.95,.98,1.05];
  nKugel(n,rand(15,17.5)*s,(v,i)=>{ const T=rand(0.5,0.65); kgStern(psBig,p,v,kopf,T,2,4,0.5);
    rkFunken(p,v,2,0.02,T,34,gl,{ps:psMid,life:[0.4,0.85],g:1.2,streu:0.25,mit:0.05,mode:4,spur:0.04});
    if(B&&i%2===0) kgSpaeter(T,()=>{ const [e,w]=b7Nach(p,v,2,T); b7Blink(e,w,i%4?B:FW.gruen,rand(0.7,1.0),1.6); }); });
  schall(p,x=>{ sfx.zischen(x*0.4,0.6); later(0.6,()=>sfx.crackle(x*0.3)); }); }
EFF.b7spinne=function(p,A,B,s,r){ b7Spinne(p,A,B,s,r,false); };
EFF.b7goldspinne=function(p,A,B,s,r){ b7Spinne(p,A,null,s,r,true); };
/* Tuerkis-Paeonie mit rotem Dahlien-Pistill */
EFF.b7cyanpistill=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(26*s*q)+8;
  nKugel(n,10*s,v=>{ const T=rand(1.4,1.6); b7Kopf(p,v,b7Hell(A,1.5),T,2.2,{spur:0.12}); b7Glanz(p,v,2.2,0.05,T,kgMal(A,0.7),6,{life:[0.3,0.6]}); });
  const m=Math.round(10*s*q)+4; nKugel(m,4.4*s,v=>b7Kopf(p,v,b7Hell(B,1.6),rand(1.8,2.1),2.4,{hof:1.3,spur:0.3}));
  schall(p,x=>later(0.2,()=>sfx.rieseln(x*0.3,1.4))); };
/* Paeonie zu Blinker: Farbsterne, die am Ende weiss (B) zu blinken beginnen */
EFF.b7blinkpaeonie=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(26*s*q)+8, G=2.2;
  nKugel(n,9.6*s,v=>{ const T=rand(0.95,1.1); b7Kopf(p,v,b7Hell(A,1.55),T,G,{spur:0.13}); b7Glanz(p,v,G,0.05,T,kgMal(A,0.75),6,{life:[0.3,0.6]});
    kgSpaeter(T,()=>{ const [e,w]=b7Nach(p,v,G,T); b7Blink(e,w,B||B7_WEISS,rand(1.0,1.4),1.8); }); });
  schall(p,x=>later(1.1,()=>sfx.crackle(x*0.25))); };
/* Paeonie mit bunten Blinkern im Kern (Gold, Gruen, Rot) */
EFF.b7paeoniestrobe=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(24*s*q)+8, BU=[FW.gold,FW.gruen,FW.rot];
  nKugel(n,10*s,v=>{ const T=rand(1.3,1.5); b7Kopf(p,v,b7Hell(A,1.5),T,2.2,{spur:0.13}); b7Glanz(p,v,2.2,0.05,T,kgMal(A,0.7),6); });
  const m=Math.round(12*s*q)+4; nKugel(m,4.6*s,(v,i)=>{ psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],BU[i%3][0]*1.8,BU[i%3][1]*1.8,BU[i%3][2]*1.8,rand(1.4,1.8),1.8,1); }); };
/* Goldstern mit roten Blinkern und blauen Sternen (Wuestengold) */
EFF.b7goldstrobe=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(16*s*q)+6;
  k5Brokat(p,n,8.6*s,rand(1.9,2.2),2.2,{glanz:4,staub:10});
  const m=Math.round(10*s*q)+4; nKugel(m,7*s,(v,i)=>{ if(i%2) b7Blink(p,kgMal(v,1/0.35),FW.rot,rand(1.2,1.6),2); else b7Kopf(p,v,b7Hell(B,1.6),rand(1.3,1.6),2.2,{spur:0.14}); });
  if(r&&!r.knall) r.knall='bkBrokat'; };
/* Goldpalme: dicke Kometenarme, die sich biegen; Spitzen in B (blau) oder
   Spitze (lace, weiss) */
function b7Palme(p,A,B,s,r,spitze){ grOhneZutaten(r,0.55);
  const n=Math.round(7*QUAL())+5, G=2.6, a0=rand(0,6.3);
  for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2+rand(-0.2,0.2), el=rand(0.1,0.75), w=rand(10.5,12)*s, v=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w], T=rand(1.5,1.8);
    k5Tiger(p,v,b7Hell(A,1.25),T,G,{glanz:8,staub:26});
    kgSpaeter(T,()=>{ const [e,ww]=b7Nach(p,v,G,T); if(spitze) b7Spitze(e,ww,B7_WEISS,10); else b7Kopf(e,kgMal(ww,0.5),b7Hell(B,1.6),rand(0.8,1.1),2,{spur:0.15}); }); }
  schall(p,x=>{ sfx.fauchen(x*0.4,1.2); if(spitze) later(1.7,()=>sfx.crackle(x*0.45)); }); }
EFF.b7palme=function(p,A,B,s,r){ b7Palme(p,A,B,s,r,false); };
EFF.b7palmespitze=function(p,A,B,s,r){ b7Palme(p,A,B,s,r,true); };
/* Goldweide zu Spitze: Brokatweide, jeder zweite Stern endet in roter
   oder goldener Spitze (B) */
EFF.b7weidespitze=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(28*s*q)+9;
  const hs=k5Brokat(p,n,8.8*s,rand(2.6,2.9),1.6,{glanz:6,staub:16});
  hs.forEach(([h,v,L],i)=>{ if(i%2) return; kgSpaeter(L*0.7,()=>{ if(!kgLebt(h)) return; const [e,w]=kgOrt(h); b7Spitze(e,w,B,6); }); });
  schall(p,x=>later(2,()=>sfx.crackle(x*0.4))); };
/* Je Bild bewegte Sterne: Schwimmer, Nattern, Wirbel. Koepfe sind
   Sterne mit Spur, die bewegt werden; dazu ein Glitzerfaden */
function b7Bewegt(p,koepfe,dauer,fn){ thJeBild(dauer,t=>{ for(const k of koepfe){ const h=k.h; if(!kgLebt(h)) continue; const j=h.i*3, V=h.ps.vel, P_=h.ps.pos; fn(k,V,j,t);
  if(Math.random()<0.75) psMid.emit(P_[j],P_[j+1],P_[j+2],rand(-.15,.15),rand(-.4,-.1),rand(-.15,.15),k.c[0]*0.8,k.c[1]*0.75,k.c[2]*0.7,rand(0.5,0.9),0.6,4); } }); }
/* Schwimmer: Goldsterne, die ruckartig und zufaellig davonschwimmen;
   dazwischen Blinker (B) */
EFF.b7schwimmer=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(14*s*q)+6, T=rand(2.0,2.4), K=[], c=b7Hell(A,1.45);
  nKugel(n,5.5*s,v=>K.push({h:kgStern(psBig,p,v,c,T,0.7,0,0.22),c,dx:0,dz:0,t0:rand(0,0.3)}));
  b7Bewegt(p,K,T,(k,V,j,t)=>{ if(t>k.t0){ k.t0=t+rand(0.12,0.3); k.dx=rand(-7,7)*s; k.dz=rand(-7,7)*s; V[j+1]+=rand(-1.5,2.5); }
    V[j]+=(k.dx-V[j])*0.25; V[j+2]+=(k.dz-V[j+2])*0.25; });
  if(B){ const m=Math.round(8*s*q)+3; nKugel(m,6*s,(v,i)=>b7Blink(p,kgMal(v,1/0.35),i%2?B:FW.gold,rand(1.4,1.8),1.4)); }
  schall(p,x=>{ sfx.zischen(x*0.35,1.6); later(0.4,()=>sfx.rieseln(x*0.25,1.6)); }); };
/* Nattern: schwere Goldkoepfe winden sich in Schlangenlinien davon und
   verloeschen knisternd */
EFF.b7natter=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(9*s*q)+5, T=rand(2.4,2.8), K=[], c=b7Hell(A,1.3);
  nKugel(n,8*s,(v,i,d)=>{ const [u1]=quer(d); K.push({h:kgStern(psHuge,p,v,c,T,0.9,0,0.45),c,u:u1,ph:rand(0,6.3),om:rand(7,10),amp:rand(9,13)*s}); });
  b7Bewegt(p,K,T,(k,V,j,t)=>{ const f=Math.cos(k.ph+t*k.om)*k.amp/30; V[j]+=k.u[0]*f*k.om; V[j+1]+=k.u[1]*f*k.om*0.5; V[j+2]+=k.u[2]*f*k.om; });
  kgSpaeter(T*0.97,()=>{ for(const k of K){ if(!kgLebt(k.h)) continue; const [e]=kgOrt(k.h); k5Knister(e,8,3.5,[1.6,1.3,0.7]); } });
  schall(p,x=>{ sfx.fauchen(x*0.45,T); later(T,()=>sfx.crackle(x*0.6)); }); };
/* Goldwirbel: Koepfe, die in Spiralen kreisen (wirbelnde Goldschweife) */
EFF.b7wirbelgold=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(10*s*q)+5, T=rand(1.8,2.1), K=[], c=[1.8,1.3,0.55];
  nKugel(n,7.5*s,v=>K.push({h:kgStern(psBig,p,v,c,T,1.2,0,0.4),c,om:rand(9,13)*(Math.random()<0.5?-1:1)}));
  b7Bewegt(p,K,T,(k,V,j)=>{ const a=k.om/30, ca=Math.cos(a), sa=Math.sin(a), x=V[j], z=V[j+2]; V[j]=x*ca-z*sa; V[j+2]=x*sa+z*ca; });
  schall(p,x=>sfx.fauchen(x*0.4,T)); };
/* Neon-Paeonie: grelle Farbe mit weissem Kern und Blink-Pistill (B) */
EFF.b7neon=function(p,A,B,s,r){ grOhneZutaten(r,0.55);
  const q=QUAL(), n=Math.round(28*s*q)+8, c=[Math.min(2.2,A[0]*1.9+0.05),Math.min(2.2,A[1]*1.9+0.05),Math.min(2.2,A[2]*1.9+0.05)];
  nKugel(n,10.4*s,v=>{ const T=rand(1.3,1.5); b7Kopf(p,v,c,T,2.2,{spur:0.16,hof:1.2}); b7Glanz(p,v,2.2,0.05,T,kgMal(A,0.9),7,{life:[0.3,0.6]}); });
  const m=Math.round(10*s*q)+4; nKugel(m,4*s,v=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],B[0]*1.8,B[1]*1.8,B[2]*1.8,rand(1.3,1.7),1.8,1));
  schall(p,x=>later(0.2,()=>sfx.rieseln(x*0.3,1.2))); };
/* Silberwelle zu Farbe: Silberglitzer, der nach einem Atemzug in B weiterbrennt */
EFF.b7silberwelle=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(22*s*q)+8, G=2.2;
  nKugel(n,9.4*s,v=>{ const T=rand(0.85,1.0); const h=kgStern(psBig,p,v,[1.5,1.55,1.65],T,G,4,0.25);
    b7Glanz(p,v,G,0.04,T,[0.9,0.95,1.05],16,{life:[0.4,0.8]});
    kgSpaeter(T*0.98,()=>{ const [e,w]=b7Nach(p,v,G,T*0.98); kgSpaeter(0.1,()=>{ const w2=kgMal(w,0.9), L=rand(0.9,1.1); b7Kopf(e,w2,b7Hell(B,1.6),L,3.4,{spur:0.42}); b7Glanz(e,w2,3.4,0.03,L,kgMal(B,0.85),18,{life:[0.4,0.8]}); }); }); });
  schall(p,x=>sfx.rieseln(x*0.4,1.6)); };
/* Grosse Dahlie: wenige, grosse, langsame Sterne mit dicker Spur */
EFF.b7dahlie=function(p,A,B,s,r){ grOhneZutaten(r,0.55);
  const q=QUAL(), n=Math.round(16*s*q)+6;
  nKugel(n,8.4*s,v=>{ const T=rand(2.0,2.4); b7Kopf(p,v,b7Hell(A,1.55),T,2.4,{hof:1.35,spur:0.32}); b7Glanz(p,v,2.4,0.05,T,mischF(A,[1.2,.7,.3],0.3),9,{life:[0.4,0.8]}); });
  if(r&&!r.knall) r.knall='bkDoppel'; };
/* Komet: der Kopf fliegt nach dem Ausstoss noch weiter und zerstiebt in
   Glitzer (A); knister: knisternd */
function b7Komet(p,A,B,s,r,knister){ grOhneZutaten(r,0.35);
  const v=[rand(-1.5,1.5),rand(6,8)*s,rand(-1.5,1.5)], T=rand(0.7,0.9);
  b7Kopf(p,v,b7Hell(A,1.6),T,4,{spur:0.5,hof:1.3}); b7Glanz(p,v,4,0.02,T,kgMal(A,0.95),64,{glanz:14,life:[0.5,0.9],g:1.4});
  kgSpaeter(T,()=>{ const [e,w]=b7Nach(p,v,4,T); if(knister) k5Knister(e,Math.round(16*QUAL())+6,4,[1.6,1.3,0.7]);
    else for(let k=0;k<Math.round(10*QUAL())+4;k++){ const d=randDir(), sp=rand(2,4); psMid.emit(e.x,e.y,e.z,w[0]*0.3+d[0]*sp,w[1]*0.3+d[1]*sp,w[2]*0.3+d[2]*sp,A[0]*1.4,A[1]*1.4,A[2]*1.4,rand(0.5,0.9),1.6,4); } });
  if(r) r.knall=knister?'bkKnisterhall':'bkZisch'; }
EFF.b7komet=function(p,A,B,s,r){ b7Komet(p,A,B,s,r,false); };
EFF.b7knisterkomet=function(p,A,B,s,r){ b7Komet(p,A,B,s,r,true); };
/* Blinkstern-Bukett: drei bis fuenf kleine Kugeln aus Blinksternen (A, B) */
EFF.b7blinkbukett=function(p,A,B,s,r){ grOhneZutaten(r,0.4);
  const q=QUAL(), k=3+Math.floor(Math.random()*3), [R,U]=kgAchsen(p);
  for(let j=0;j<k;j++){ const a=j/k*Math.PI*2+rand(-0.3,0.3), rr=rand(2.5,4)*s, e={x:p.x+(R[0]*Math.cos(a)+U[0]*Math.sin(a))*rr,y:p.y+U[1]*Math.sin(a)*rr,z:p.z+(R[2]*Math.cos(a)+U[2]*Math.sin(a))*rr}, c=j%2?B:A;
    /* jeder Stern fliegt erst 0,4 s mit Farbschweif, dann blinkt er (mit Hof) */
    kgSpaeter(0.05*j,()=>{ for(let i=0;i<Math.round(14*s*q)+5;i++){ const d=randDir(), w=rand(4.4,5.4)*s, v=[d[0]*w,d[1]*w,d[2]*w], T0=0.4;
        b7Kopf(e,v,b7Hell(c,1.5),T0,1.6,{spur:0.25});
        kgSpaeter(T0,()=>{ const [e2,w2]=b7Nach(e,v,1.6,T0), L=rand(1.4,1.8); b7Blink(e2,kgMal(w2,1/0.35*0.5),c,L,1.6); if(i%2===0) psHuge.emit(e2.x,e2.y,e2.z,w2[0]*0.5,w2[1]*0.5,w2[2]*0.5,c[0]*0.9,c[1]*0.9,c[2]*0.9,L,1.6,1); }); }
      b7Kopf(e,[0,0.5,0],b7Hell(c,1.2),0.35,0,{spur:0}); }); }
  schall(p,x=>{ for(let i=0;i<k;i++) later(0.05*i,()=>sfx.plopp(x*0.45,1)); later(0.4,()=>sfx.crackle(x*0.2)); }); };
/* Zeitregen: Goldsterne haengen am Himmel und knistern einer nach dem
   anderen weg */
EFF.b7zeitregen=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(24*s*q)+8, G=1.3;
  nKugel(n,7.6*s,v=>{ const T=rand(1.6,3.2), h=kgStern(psBig,p,v,[1.85,1.4,0.6],T+0.2,G,4,0.15); b7Glanz(p,v,G,0.05,T,[1.2,.8,.32],12,{life:[0.6,1.1],g:0.5});
    kgSpaeter(T,()=>{ if(!kgLebt(h)) return; const [e]=kgOrt(h); kgAus(h); k5Knister(e,9,3.2,[1.7,1.5,1.0]); }); });
  schall(p,x=>{ later(1.6,()=>sfx.crackle(x*0.5)); later(2.3,()=>sfx.crackle(x*0.45)); later(2.9,()=>sfx.crackle(x*0.35)); }); };
/* Knisterkrone: Goldkrone, deren Sterne knackend zerplatzen */
EFF.b7knisterkrone=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(18*s*q)+6;
  const hs=k5Brokat(p,n,9*s,rand(1.3,1.6),2.2,{glanz:3,staub:9});
  hs.forEach(([h,v,L])=>kgSpaeter(L*0.95,()=>{ if(!kgLebt(h)) return; const [e]=kgOrt(h); k5Knister(e,7,3.5,[1.7,1.55,1.2]); }));
  if(r&&!r.knall) r.knall='bkKnisterhall'; };
/* Titanschlag: weisser Blitz, Silberfunkenball, harter Knall (Runde-6-Bausteine) */
EFF.b7titan=function(p,A,B,s,r){ grOhneZutaten(r,1.2);
  const q=QUAL(), a=SCHWEIF; SCHWEIF=0.06;
  k5Punkt(p,[2.2,2.15,2.05],26,16,1.8);
  for(let i=0;i<Math.round(46*q)+12;i++){ const d=randDir(), w=rand(10,17)*Math.min(1.3,s); psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1.6,1.55,1.45,rand(0.12,0.3),1,4); }
  SCHWEIF=a; if(r) r.knall='b7Schlag';
  { const v=distVol(p); shake=Math.max(shake,Math.min(0.8,0.25+v*1.2)); } };
/* Rose: Bluetenblaetter in Schalen - aussen rosa (A), innen rot (B),
   ein weisser Kern; die aeussere Schale haengt */
EFF.b7rose=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), [R,U,F]=kgAchsen(p), n=Math.round(16*s*q)+8;
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, c=Math.cos(a), sn=Math.sin(a), d=[R[0]*c+U[0]*sn+F[0]*rand(-.3,.3),R[1]*c+U[1]*sn,R[2]*c+U[2]*sn+F[2]*rand(-.3,.3)];
    const v=kgMal(d,rand(9,10)*s), T=rand(1.8,2.1); b7Kopf(p,v,b7Hell(A,1.5),T,2.4,{spur:0.32,hof:1.2}); b7Glanz(p,v,2.4,0.05,T,kgMal(A,0.8),8,{life:[0.4,0.7]}); }
  nKugel(Math.round(14*s*q)+5,5.6*s,v=>b7Kopf(p,v,b7Hell(B,1.6),rand(1.4,1.6),2.2,{spur:0.2}));
  nKugel(Math.round(6*q)+3,2.4*s,v=>b7Kopf(p,v,[1.7,1.65,1.6],rand(0.9,1.1),2,{spur:0.08}));
  schall(p,x=>later(0.1,()=>sfx.rieseln(x*0.35,1.6))); };
/* Lilie: sechs weisse Kometen-Bluetenblaetter, die sich nach aussen und
   unten biegen, in der Mitte gelbe Staubgefaesse */
EFF.b7lilie=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const a0=rand(0,6.3); for(let i=0;i<6;i++){ const a=a0+i/6*Math.PI*2, v=[Math.cos(a)*10*s,rand(5,7)*s,Math.sin(a)*10*s], T=rand(1.9,2.2);
    k5Tiger(p,v,b7Hell(A,1.1),T,3.0,{gold:0.05,glanz:8,staub:24}); }
  nKugel(Math.round(10*QUAL())+5,3.4*s,v=>b7Kopf(p,v,b7Hell(B,1.6),rand(1.0,1.3),2.2,{spur:0.15}));
  schall(p,x=>sfx.fauchen(x*0.4,1.4)); };
/* Sonnenblume: dunkelgoldene Scheibe aus Knistersternen, ringsum ein
   Kranz goldgelber Bluetenblaetter (zum Zuschauer gedreht) */
EFF.b7sonnenblume=function(p,A,B,s,r){ grOhneZutaten(r,0.55);
  const q=QUAL(), [R,U]=kgAchsen(p), n=Math.round(20*s*q)+10;
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, d=[R[0]*Math.cos(a)+U[0]*Math.sin(a),R[1]*Math.cos(a)+U[1]*Math.sin(a),R[2]*Math.cos(a)+U[2]*Math.sin(a)], v=kgMal(d,rand(10,10.8)*s), T=rand(1.6,1.8);
    b7Kopf(p,v,b7Hell(A,1.45),T,2.2,{spur:0.35}); b7Glanz(p,v,2.2,0.05,T,[1.2,.85,.3],10,{life:[0.4,0.8]}); }
  nKugel(Math.round(22*s*q)+8,3.2*s,v=>kgStern(psBig,p,v,b7Hell(B,1.1),rand(0.9,1.3),1.6,3,0));
  schall(p,x=>later(0.9,()=>sfx.crackle(x*0.4))); };
/* Meer (Ozean): blaue Chrysantheme mit Silberglitzer, die tuerkis
   weiterleuchtet */
EFF.b7meer=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(26*s*q)+8, G=2.2;
  nKugel(n,10*s,v=>{ const T=rand(1.4,1.6), h=b7Kopf(p,v,b7Hell(A,1.5),T,G,{spur:0.26});
    b7Glanz(p,v,G,0.05,T,[0.85,0.92,1.05],14,{life:[0.5,0.9]}); kgSpaeter(T*0.6,()=>kgFarbe(h,b7Hell(B,1.5))); });
  schall(p,x=>sfx.rieseln(x*0.45,2)); };
/* Gischt: weisse Knistersterne spritzen, darunter Silberglitzer */
EFF.b7gischt=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(22*s*q)+8;
  nKugel(n,8.6*s,v=>{ const T=rand(0.8,1.0); b7Kopf(p,v,[1.5,1.6,1.7],T,2.6,{spur:0.22}); b7Glanz(p,v,2.6,0.03,T,[0.95,1,1.1],18,{glanz:6,life:[0.3,0.7]});
    kgSpaeter(T,()=>{ const [e,w]=b7Nach(p,v,2.6,T); b7Spitze(e,w,B||B7_WEISS,5); }); });
  if(r) r.knall='bkKnisterhall'; };
/* Violette Fontaene am Himmel (Rosenherz): aus dem Bruchpunkt schiesst
   ein breiter Faecher aus violetten Glitzerkoepfen nach oben und
   faellt wie eine Fontaene - kein Bodenwerk */
EFF.b7fontaene=function(p,A,B,s,r){ grOhneZutaten(r,0.4);
  const q=QUAL(), n=Math.round(22*s*q)+10, [R,U,F]=kgAchsen(p);
  for(let i=0;i<n;i++){ const u=(i/(n-1))*2-1, a=u*1.05, w=rand(10,13)*s, tiefe=rand(-0.25,0.25);
    const d=[R[0]*Math.sin(a)+U[0]*Math.cos(a)+F[0]*tiefe,R[1]*Math.sin(a)+U[1]*Math.cos(a),R[2]*Math.sin(a)+U[2]*Math.cos(a)+F[2]*tiefe], v=kgMal(d,w), T=rand(2.0,2.4);
    b7Kopf(p,v,b7Hell(i%3?A:B,1.45),T,4.2,{spur:0.35}); b7Glanz(p,v,4.2,0.03,T,kgMal(i%3?A:B,0.9),22,{glanz:5,life:[0.5,0.9],g:1.6}); }
  schall(p,x=>{ sfx.fauchen(x*0.55,1.8); later(0.8,()=>sfx.rieseln(x*0.4,1.8)); }); };
/* Kornblume (neu): blaue Paeonie, jeder Stern mit weissheissem Kern,
   blau-silbernem Glitzerschweif; am Ende franst er in drei feine
   Glitzerspitzen aus; goldene Staubbeutel in der Mitte */
EFF.kornblume=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(30*s*q)+10, G=2.4, T=1.25;
  nKugel(n,10.6*s,v=>{ b7Kopf(p,v,mischF(b7Hell(A,1.6),[.25,.4,1.9],0.4),T,G,{spur:0.32,weiss:0.12,hof:1.3}); b7Glanz(p,v,G,0.04,T,[0.55,0.7,1.15],12,{life:[0.4,0.7]});
    kgSpaeter(T*0.97,()=>{ const [e,w]=b7Nach(p,v,G,T*0.97); for(let k=0;k<3;k++){ const d=randDir(), dv=[w[0]*0.3+d[0]*2.2,w[1]*0.3+d[1]*2.2,w[2]*0.3+d[2]*2.2];
      kgStern(psBig,e,dv,b7Hell(A,1.5),rand(0.4,0.6),1.5,4,0.25); } }); });
  nKugel(Math.round(10*q)+4,3*s,v=>{ b7Kopf(p,v,b7Hell(B,1.3),rand(0.9,1.2),2,{spur:0.1}); b7Glanz(p,v,2,0.05,1,[1.2,.85,.3],8,{life:[0.3,0.6]}); });
  schall(p,x=>later(T,()=>sfx.prasseln(x*0.45))); };
/* Aehre (Kornblumen): kleine Goldbrokat-Rispe, nach oben gestreckt */
EFF.b7aehre=function(p,A,B,s,r){ grOhneZutaten(r,0.4);
  const q=QUAL(), n=Math.round(14*s*q)+6;
  k5Brokat(p,n,6.4*s,rand(1.8,2.1),2.0,{glanz:3,staub:9,vert:(m,w,fn)=>{ for(let i=0;i<m;i++){ const d=randDir(); d[1]=Math.abs(d[1])*1.4+0.2; const l=Math.hypot(d[0],d[1],d[2]); fn(kgMal([d[0]/l,d[1]/l,d[2]/l],w*rand(0.85,1.05)),i,d); } }});
  schall(p,x=>later(0.2,()=>sfx.rieseln(x*0.35,1.5))); };
/* Kleebluete (neu, Bienenweide): ein dichtes Koepfchen aus vielen kurzen
   violetten Glitzerfaeden mit weissen Spitzen, aus dem Pollen rieselt */
EFF.kleebluete=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const q=QUAL(), n=Math.round(46*s*q)+14, G=1.8;
  nKugel(n,7.6*s,(v,i)=>{ const T=rand(1.3,1.6); const h=b7Kopf(p,v,b7Hell(i%4?A:B,1.45),T,G,{spur:0.24});
    b7Glanz(p,v,G,0.05,T*0.8,kgMal(A,0.75),6,{life:[0.3,0.5]}); kgSpaeter(T*0.65,()=>kgFarbe(h,b7Hell(B,1.4))); });
  kgSpaeter(0.5,()=>{ for(let i=0;i<Math.round(30*q)+8;i++){ const d=randDir(), w=rand(1,2.6)*s; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w-0.4,d[2]*w,1.3,.95,.35,rand(1.0,1.8),1.4,4); } });
  schall(p,x=>later(0.3,()=>sfx.rieseln(x*0.3,1.4))); };
/* Meteor (Meteorschauer, neu): schwere weissgruene Koepfe ziehen lange
   Glitzerbahnen und verloeschen in ihrer Spur - keine Glutpunkte danach */
EFF.b7meteor=function(p,A,B,s,r){ grOhneZutaten(r,0.45);
  const k=Math.round(5+QUAL()*3), a0=rand(0,6.3);
  for(let j=0;j<k;j++){ const a=a0+j/k*Math.PI*2+rand(-0.3,0.3), el=rand(-0.45,0.3), w=rand(12,15)*s, v=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w], T=rand(1.2,1.5);
    b7Kopf(p,v,b7Hell(A,1.5),T,2.4,{spur:0.5,hof:1.2}); b7Glanz(p,v,2.4,0.03,T,mischF(A,[1,1,1],0.4),70,{glanz:10,life:[0.35,0.7],g:1.6}); }
  if(r) r.knall='bkZisch'; };
Object.assign(EFF_SCHWEIF,{b7weide:0.12,b7nishiki:0.1,b7nishikiperlen:0.1,b7titanweide:0.12,b7brokatkrone:0.12,b7brokatbunt:0.12,b7kronedahlie:0.2,b7corolla:0.2,b7crossette:0.25,b7crossetteklar:0.25,
  b7schleier:0.14,b7schleierbunt:0.14,b7glitzerweide:0.2,b7weidefarbe:0.12,b7spinne:0.5,b7goldspinne:0.5,b7cyanpistill:0.15,b7blinkpaeonie:0.13,b7paeoniestrobe:0.13,b7goldstrobe:0.14,
  b7palme:0.3,b7palmespitze:0.3,b7weidespitze:0.12,b7schwimmer:0.22,b7natter:0.45,b7wirbelgold:0.4,b7neon:0.16,b7silberwelle:0.25,b7dahlie:0.32,b7komet:0.4,b7knisterkomet:0.4,
  b7blinkbukett:0,b7zeitregen:0.15,b7knisterkrone:0.12,b7titan:0.06,b7rose:0.32,b7lilie:0.3,b7sonnenblume:0.35,b7meer:0.26,b7gischt:0.22,b7fontaene:0.35,b7aehre:0.12,b7meteor:0.5,
  kornblume:0.24,kleebluete:0.2});
Object.assign(EFF_FAMILIE,{b7weide:'haenger',b7nishiki:'haenger',b7nishikiperlen:'haenger',b7titanweide:'haenger',b7brokatkrone:'haenger',b7brokatbunt:'haenger',b7kronedahlie:'haenger',
  b7corolla:'komet',b7crossette:'komet',b7crossetteklar:'komet',b7schleier:'glitzer',b7schleierbunt:'glitzer',b7glitzerweide:'haenger',b7weidefarbe:'haenger',b7spinne:'knister',b7goldspinne:'knister',
  b7cyanpistill:'kugel',b7blinkpaeonie:'kugel',b7paeoniestrobe:'kugel',b7goldstrobe:'haenger',b7palme:'haenger',b7palmespitze:'haenger',b7weidespitze:'haenger',b7schwimmer:'knister',
  b7natter:'komet',b7wirbelgold:'komet',b7neon:'kugel',b7silberwelle:'kugel',b7dahlie:'kugel',b7komet:'komet',b7knisterkomet:'komet',b7blinkbukett:'knister',b7zeitregen:'haenger',
  b7knisterkrone:'knister',b7titan:'salut',b7rose:'kugel',b7lilie:'haenger',b7sonnenblume:'kugel',b7meer:'kugel',b7gischt:'glitzer',b7fontaene:'haenger',b7aehre:'haenger',b7meteor:'komet'});
if(typeof BRUCH_ART!=='undefined') Object.assign(BRUCH_ART,{b7weide:'weide',b7nishiki:'weide',b7nishikiperlen:'weide',b7titanweide:'weide',b7brokatkrone:'weide',b7brokatbunt:'weide',b7kronedahlie:'weide',
  b7corolla:'komet',b7crossette:'komet',b7crossetteklar:'komet',b7schleier:'glitzer',b7schleierbunt:'glitzer',b7glitzerweide:'weide',b7weidefarbe:'weide',b7spinne:'knister',b7goldspinne:'knister',
  b7cyanpistill:'kern',b7blinkpaeonie:'kugel',b7paeoniestrobe:'kern',b7goldstrobe:'weide',b7palme:'palme',b7palmespitze:'palme',b7weidespitze:'weide',b7schwimmer:'knister',
  b7natter:'komet',b7wirbelgold:'komet',b7neon:'kern',b7silberwelle:'kugel',b7dahlie:'kugel',b7komet:'komet',b7knisterkomet:'komet',b7blinkbukett:'knister',b7zeitregen:'weide',
  b7knisterkrone:'knister',b7titan:'salut',b7rose:'kern',b7lilie:'palme',b7sonnenblume:'figur',b7meer:'kugel',b7gischt:'glitzer',b7fontaene:'palme',b7aehre:'weide',b7meteor:'komet'});

/* ---------- 2. Bearbeitet ---------- */
/* Tautropfen (Tom: "an sich geil, Grafik deutlich aufwerten - die Tropfen,
   die in der Luft stehen, wirken wie Punkte"). Ein stehender Stern hat
   keine Spur - darum steht jetzt jede Perle als kleine Fontaene in der
   Luft: ein Kopf mit weissheissem Kern und Hof, aus dem ein Glitzerfaden
   nach unten rieselt, solange er haengt; dann tropft er mit langer Spur
   und mintfarbenem Ende ab. Die Krone ist groesser und dichter. */
LICHTYP.tauperle=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(23*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,lHell(A,1.2),T,G,0,0.3); lFunken(m,v,G,0.03,T,70,mischF(lHell(A,1),[1,1,1],0.4),{ps:psMid,life:[0.35,0.7],g:2,streu:0.15,mit:0.1,mode:4}); lStart(m,0.7,0.3);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), n=Math.round(20*QUAL())+8;
    k5Punkt(e,[1.4,1.6,1.6],6,4,0.5);
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+rand(-0.15,0.15), w=rand(3.2,4.0)*Math.sqrt(s), dv=[Math.cos(a)*w,rand(1.0,2.2),Math.sin(a)*w], hang=rand(0.7,1.3), L=hang+rand(1.7,2.2);
      const h=b7Kopf(e,dv,lHell(i%3?A:[1,1,1],1.35),L,0.8,{spur:0.28,hof:1.2,mode:4});
      /* waehrend die Perle haengt: ein feiner Glitzerfaden rieselt aus ihr heraus */
      rkFunken(e,dv,0.8,0.05,hang,44,mischF(lHell(A,1),[1,1,1],0.3),{ps:psMid,life:[0.5,0.95],g:2.2,streu:0.35,mit:0.05,mode:4,spur:0.08});
      kgSpaeter(hang,()=>{ thFallen(h,4.5,lHell(B,1.2),0.6); if(!kgLebt(h)) return; const [q,w2]=kgOrt(h);
        rkFunken(q,w2,4.5,0.02,L-hang-0.2,40,mischF(lHell(A,1),lHell(B,1),0.5),{ps:psMid,life:[0.45,0.85],g:0.9,streu:0.08,mit:0.1,mode:4,spur:0.06});
        if(i%4===0) schall(q,x=>sfx.tropf(x*0.7)); }); }
    schall(e,x=>sfx.rieseln(x*0.32,2)); });
};
/* Tropfenkette: der Komet laesst auf dem letzten Stueck Tropfen haengen;
   jeder Tropfen ist ein Kopf mit Hof, der ein Glitzerfaedchen abgibt,
   dann faellt er von unten nach oben mit langer Spur ab */
LICHTYP.tropfenkette=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G)+0.15;
  lKopf(m,v,lHell(A,1.25),T,G,0,0.3); lFunken(m,v,G,0.03,T,60,lHell(A,0.9),{ps:psMid,life:[0.4,0.8],g:1.5,streu:0.08,mit:0.05,mode:4}); lStart(m,0.8,0.3);
  let k=0; for(let t=T*0.3;t<T;t+=0.08){ const tt=t, nr=k++; kgSpaeter(tt,()=>{ const q=sternNach(m,v[0],v[1],v[2],G,tt), u=bahnTempo(v,G,tt), dv=[u[0]*0.08,0.15,u[2]*0.08], hang=0.8+nr*0.08+(T-tt)*0.3;
    const h=b7Kopf(q,dv,lHell(nr%3?A:[1,1,1],1.4),hang+1.9,0.25,{spur:0.05,hof:1.2,mode:4});
    rkFunken(q,dv,0.25,0.05,hang,30,mischF(lHell(A,1),[1,1,1],0.3),{ps:psMid,life:[0.4,0.8],g:2.4,streu:0.25,mit:0.05,mode:4,spur:0.06});
    kgSpaeter(hang,()=>{ thFallen(h,4.5,lHell(B,1.2),0.6); if(!kgLebt(h)) return; const [q2,w2]=kgOrt(h);
      rkFunken(q2,w2,4.5,0.02,1.6,36,mischF(lHell(A,1),lHell(B,1),0.5),{ps:psMid,life:[0.4,0.75],g:0.9,streu:0.05,mit:0.1,mode:4,spur:0.06});
      if(nr%3===1) schall(q2,x=>sfx.tropf(x*0.6)); }); }); }
};
/* Kornblumen (Tom: "am Anfang nur blaue Punkte"): Kornblumen mit
   Glitzerschweif und Fransen, goldene Aehren aus Brokat */
r4Show('kornblumen',[['kornblau','gold'],['gold','zitrone'],['kornblau','weiss']],{sz:[0.9,1.25],pw:[0,2],hell:[0.9,1.25],kurve:'linear'},[
  {n:3,gap:1.4,muster:'mitte',ang:0.16,eff:'kornblume',kal:'klein',farbe:0,steig:'silber',knall:'bkPuff',pause:0.8},
  {n:4,gap:0.9,muster:'paar',ang:0.3,eff:'b7aehre',kal:'klein',farbe:1,steig:'gold',knall:'bkRieseln',pause:1.0},
  {n:2,gap:0.25,muster:'v',ang:0.24,eff:'kornblume',kal:'mittel',farbe:2,steig:'silber',knall:'bkPlopp',pause:3}]);
/* Bienenweide (Tom: "am Anfang nur Punkte -> neu/besser"): Kleekoepfchen
   aus Glitzerfaeden, Bienen als bernsteinfarbene Schwimmer */
r4Show('bienenweide',[['lavendel','weiss'],['bernstein','zitrone'],['violett','rose']],{sz:[0.9,1.28],pw:[0,2],hell:[0.9,1.25],kurve:'linear'},[
  {n:2,gap:1.5,muster:'aussen',ang:0.3,eff:'kleebluete',kal:'mittel',farbe:0,steig:'glut',knall:'bkPuff',pause:1.0},
  {n:4,gap:0.32,muster:'wischer',ang:0.32,eff:'b7schwimmer',kal:'klein',farbe:1,steig:'gold',knall:'bkZisch',pause:1.2},
  {n:3,gap:0.8,muster:'zufall',ang:0.26,eff:'kleebluete',kal:'mittel',farbe:2,steig:'glut',knall:'bkKlack',pause:0.9},
  {n:3,gap:0.22,muster:'mitte',ang:0.22,eff:['b7schwimmer','kleebluete','b7schwimmer'],kal:'mittel',farbe:1,steig:'gold',knall:'bkZisch',pause:3}]);
SIGNATUR.bienenweide={idee:'Bienenweide',eff:'kleebluete',text:'violette Kleekoepfchen aus Glitzerfaeden und bernsteinfarbene Bienenschwaerme'};
/* Ozean (Tom: "an sich geil, aber Punkte -> grafisch krasser"): Silber-
   wellen mit Glitzer, die tuerkis weiterbrennen, blaue Chrysanthemen mit
   Silberschweif, Glitzerweiden mit blauen Sternen als Meeresleuchten,
   knisternde Gischt, Brandung zu weissen Blinkern; das Finale bleibt */
r3Show('lb_saphirfaecher',[['silber','tuerkis'],['blau','tuerkis'],['silber','blau'],['weiss','himmel'],['blau','weiss']],{sz:[0.95,1.25],pw:[0,1.5],hell:[0.9,1.25],kurve:'linear'},[
  {n:3,gap:2.0,muster:'aussen',ang:0.32,eff:'b7silberwelle',kal:'gross',farbe:0,steig:'silber',knall:'bkRieseln'},
  {n:6,gap:0.8,muster:'welle',ang:0.28,hoehe:'welle',hSpanne:5,eff:'b7meer',kal:'gross',farbe:1,steig:'silber',pause:1.0},
  {n:5,gap:1.3,muster:'zufall',ang:0.24,eff:'b7glitzerweide',kal:'gross',farbe:2,steig:'brokat',knall:'bkRieseln',pause:0.8},
  {n:6,gap:0.16,muster:'wischer',ang:0.36,eff:'b7gischt',kal:'mittel',pw:2,farbe:3,steig:'silber',knall:'bkKnisterhall',pause:1.0},
  {n:4,gap:0.6,muster:'paar',ang:0.26,eff:'b7blinkpaeonie',kal:'gross',farbe:4,steig:'silber',pause:1.0},
  {n:6,gap:0.35,muster:'mitte',ang:0.2,eff:['qualle','spritzkrone','wasserring'],A:['blau','himmel','silber'],B:['silber','weiss','blau'],kal:'gross',pw:6,steig:'silber',knall:'bkDonnerhall',pause:6}],{basis:{pw:-5,sz:0.78,th:'lb_saphirfaecher'}});
lochName('lb_saphirfaecher',{desc:'Blau, Türkis und Silber: drei Silberwellen aus Glitzer, die türkis weiterbrennen, blaue Chrysanthemen mit Silberschweif im Wellengang, Glitzerweiden mit blauen Sternen als Meeresleuchten, knisternde weiße Gischt, eine Brandung, die weiß zu blinken beginnt – und zum Schluss sechs hohe Knalle: Quallen, Gischtkronen und Silberwellen.'});
SIGNATUR.lb_saphirfaecher={idee:'Ozean',eff:'b7silberwelle',text:'Silberwellen aus Glitzer, blaue Chrysanthemen mit Silberschweif, Glitzerweiden, Gischt, Brandung zu Blinkern, Quallen'};
/* Rosenherz (Tom: "Herzen schoen, aber mehr verschiedene Effekte, z. B. lila
   grosse breite Fontaenen nach oben; insgesamt bearbeiten"): Rosen in
   Schalen, violette Himmelsfontaenen, die Herzen, rosa Blinkpaeonien,
   Schleierkraut, zum Schluss Ringe mit Fontaenen und Rosen */
r3Show('hochzeitsfaecher',[['rose','rot'],['violett','lavendel'],['rose','weiss'],['magenta','violett'],['rose','rot']],{sz:[0.95,1.18],pw:[0,1.5],hell:[0.9,1.25],kurve:'flach'},[
  {n:6,gap:0.8,muster:'paar',ang:0.25,eff:'b7rose',kal:'mittel',farbe:0,steig:'glut',knall:'bkPuff',pause:1.0},
  {n:4,gap:0.55,muster:'aussen',ang:0.42,eff:'b7fontaene',kal:'gross',farbe:1,steig:'silber',knall:'bkRieseln',pause:1.0},
  {n:4,gap:1.6,muster:'v',ang:0.18,eff:'herz',kal:'gross',A:'rose',B:'rot',steig:'silber',bruchOpt:{nachglitzer:false},pause:1.2},
  {n:6,gap:0.3,muster:'w',ang:0.35,eff:'b7blinkpaeonie',farbe:2,steig:'glut',knall:'bkKnisterhall',pause:1.0},
  {n:4,gap:0.12,muster:'mitte',ang:0.3,eff:'b7fontaene',kal:'gross',farbe:3,steig:'silber',knall:'bkRieseln',pause:1.2},
  {n:2,gap:0,muster:'v',ang:0.2,eff:'ring',kal:'gross',A:'rose',B:'weiss',steig:'silber'},
  {mit:true,n:4,gap:0.18,muster:'aussen',ang:0.5,kal:'gross',eff:'b7fontaene',farbe:1,steig:'silber',knall:'bkRieseln'},
  {mit:true,n:6,gap:0.2,muster:'zufall',ang:0.4,kal:'mittel',pw:-1,eff:['b7rose','b7schleier'],farbe:4,steig:'silber',knall:'bkPuff',pause:4.5}],{basis:{pw:2.0,sz:1.16,th:'hochzeitsfaecher'}});
lochName('hochzeitsfaecher',{desc:'Rosen, Herzen und violette Fontänen: Rosen in Schalen aus Rosa und Rot, breite violette Fontänen, die am Himmel aufsteigen und herabrieseln, vier Herzbomben, rosa Päonien, die weiß zu blinken beginnen – und zum Schluss zwei Ringe zwischen violetten Fontänen, Rosen und Schleierkraut.'});
SIGNATUR.hochzeitsfaecher={idee:'Rosenherz',eff:'b7rose',text:'Rosen in Schalen, violette Himmelsfontaenen, Herzen, rosa Blinkpaeonien, Ringe'};
/* Meteorschauer (Tom: "Knalle mittendrin ohne Sinn weg; nach dem Sterneffekt
   kommen ein paar Lichter/Punkte - weg; Ende extremer"): die Einschlaege
   (Salute) und die Sternspritzer sind weg, die Feuerkugeln zerbrechen in
   Splitter mit Spur statt in knackende Punkte (b7meteor statt meteor),
   Crossetten mit Glitzerspur statt Kreuzsternen und Sternspritzern (die
   hinterliessen Punktwolken); das Finale ist ein Sturm aus 53 Schuss
   riesig im Kreis, darunter Titanschlaege erst ganz am Ende */
EFF.feuerkugel=function(p,A,B,s,r){ grOhneZutaten(r,0.5);
  const G=2.6, T=0.8, k=Math.round(4+QUAL()*3), a0=rand(0,Math.PI*2);
  for(let j=0;j<k;j++){ const a=a0+j/k*Math.PI*2+rand(-0.35,0.35), el=rand(-0.35,0.45), w=rand(11,14)*s, vv=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w];
    b7Kopf(p,vv,b7Hell(A,1.5),T,G,{spur:0.45,hof:1.2}); rkFunken(p,vv,G,0.03,T,120,kgMal(A,1.1),{ps:psMid,life:[0.45,0.9],g:2,streu:0.25,mit:0.08,mode:4});
    kgSpaeter(T,()=>{ const e=sternNach(p,vv[0],vv[1],vv[2],G,T), w=bahnTempo(vv,G,T);
      for(let i=0;i<Math.round(14*QUAL())+5;i++){ const d=randDir(), dv=[w[0]*0.8+d[0]*4.5,w[1]*0.8+d[1]*4.5,w[2]*0.8+d[2]*4.5], L=rand(0.45,0.75);
        kgStern(psBig,e,dv,kgMal(B,1.3),L,2.4,0,0.35); } }); }
  schall(p,x=>{ sfx.zischen(x*0.5,0.8); later(T,()=>sfx.crack(x*0.5)); }); };
r4Show('meteorschauer',[['limette','weiss'],['weiss','limette'],['silber','gruen'],['weiss','silber']],{sz:[0.92,1.36],pw:[0,3.2],hell:[0.88,1.32],kurve:'spaet'},[
  {n:5,gap:1.1,muster:'zufall',ang:0.4,eff:'feuerkugel',kal:'gross',farbe:0,steig:'keiner',knall:'bkZisch',pause:1.0},
  {n:20,gap:0.2,muster:'wischer',ang:0.38,eff:'b7crossetteklar',kal:'mittel',farbe:1,steig:'silber',knall:'bkKaskade',pause:1.0},
  {n:12,gap:0.45,muster:'x',ang:0.3,eff:'b7meteor',kal:'gross',farbe:2,steig:'keiner',pause:1.0},
  {n:16,gap:0.22,muster:'spirale',ang:0.32,eff:'feuerkugel',kal:'gross',farbe:0,steig:'keiner',knall:'bkZisch',pause:1.2},
  {n:24,gap:0.15,muster:'z',ang:0.34,eff:['b7crossetteklar','b7crossetteklar'],kal:'gross',farbe:1,steig:'silber',knall:'bkKaskade',pause:1.2},
  {n:20,gap:0.25,muster:'welle',ang:0.34,eff:'rossschweif',kal:'gross',farbe:2,steig:'silber',knall:'bkBrokat',pause:1.4},
  {n:10,gap:0.4,muster:'paar',ang:0.3,eff:'b7meteor',kal:'riesig',farbe:0,steig:'keiner',pause:1.0},
  {n:40,gap:0.06,muster:'kreis',ang:0.4,eff:['feuerkugel','b7meteor','b7crossetteklar','b7meteor','feuerkugel','b7crossetteklar'],kal:'riesig',farbe:0,steig:'silber',knall:'bkDonnerhall'},
  {mit:true,n:13,gap:0.3,muster:'aussen',ang:0.3,eff:['b7meteor','b7meteor','b7titan'],kal:'riesig',pw:3,farbe:3,steig:'keiner',pause:8}]);
SIGNATUR.meteorschauer={idee:'Meteorschauer',eff:'feuerkugel',text:'gruene Feuerkugeln, die in weisse Splitter mit Spur zerbrechen, Meteore mit langen Glitzerbahnen, Crossetten, ein Sturm als Finale'};
lochName('meteorschauer',{desc:'Feuerkugeln ziehen grün leuchtend über den Himmel und zerbrechen in weiße Splitter, Meteore ziehen lange Glitzerbahnen, Crossetten zerspringen, silberne Pferdeschweife fallen – das Finale ein Meteorsturm aus 53 Schuss mit Titanschlägen ganz am Ende.'});

/* ---------- 3. Die elf neuen Batterien ----------
   Grundstufe wie Runde 4 (r4Basis: Mitte zwischen den Nachbarn nach
   Level), eigene Rohrfolge (TH_FOLGE), Abschussklang P.abschuss */
const B7_ABSCHUSS={b7_goldlaube:'pff',b7_eisbecher:'tock',b7_maerchen:'doppel',b7_wolfsnacht:'pock',b7_wuestengold:'fump',b7_neonkueste:'pock',b7_goldnatter:'doppel',
  b7_paukenschlag:'klatsch',b7_sternparade:'pock',b7_blumenmeer:'fump',b7_ragnaroek:'fump'};
/* dehn: Dauer wie beim Vorbild - ruhige Abstaende (ab 0,2 s) und Pausen
   werden gestreckt, Salven bleiben Salven */
function b7Show(id,th,rampe,ph,dehn){ const f=dehn||1, D=x=>x>=0.2?+(x*f).toFixed(3):x;
  if(f!==1) ph=ph.map((x,i)=>Object.assign({},x,x.gap!==undefined?{gap:D(x.gap)}:{},x.takt?{takt:x.takt.map(D)}:{},x.pause!==undefined&&i<ph.length-1?{pause:D(x.pause)}:{}));
  r3Show(id,th,rampe,ph,{basis:r4Basis(id,P[id]?P[id].lvl:10)}); r3OhneKern(id); if(P[id]) P[id].abschuss=B7_ABSCHUSS[id]; }

/* GOLDLAUBE (L7, 25) - Vorbild Iskra "Pluc" (25 Schuss 18 mm, 21 s):
   1.+3. Gold-Titanschweif zu Gold-Titanweide mit blauen Sternen,
   2.+4. Brokatschweif zu Brokatkrone mit gruenen Blinkern,
   5. Corolla-Schweif zu Corolla mit roten Blinkern */
b7Show('b7_goldlaube',[['gold','blau'],['gold','gruen'],['gold','rot']],{sz:[0.9,1.2],pw:[0,1.5],hell:[0.9,1.2],kurve:'linear'},[
  {n:5,gap:0.9,muster:'mitte',ang:0.18,eff:'b7weide',kal:'mittel',farbe:0,steig:'titanspur',knall:'bkRieseln',pause:0.6},
  {n:5,gap:0.8,muster:'v',ang:0.25,eff:'b7brokatkrone',kal:'mittel',farbe:1,steig:'brokat',pause:0.6},
  {n:5,gap:0.75,muster:'aussen',ang:0.3,eff:'b7weide',kal:'mittel',farbe:0,steig:'titanspur',knall:'bkRieseln',pause:0.6},
  {n:5,gap:0.55,muster:'zufall',ang:0.3,eff:'b7brokatkrone',kal:'mittel',farbe:1,steig:'brokat',pause:0.8},
  {n:5,gap:0.3,muster:'w',ang:0.3,eff:'b7corolla',kal:'gross',farbe:2,steig:'komet',knall:'bkBrokat',pause:4}]);
SIGNATUR.b7_goldlaube={idee:'Goldlaube',eff:'b7weide',text:'Gold-Titanweiden mit blauen Sternen, Brokatkronen mit gruenen Blinkern, ein Corolla-Kranz mit roten Blinkern'};

/* EISBECHER (L10, 36) - Vorbild Winda "Banana Split" (39 s): Zitronen-
   Crossette mit Silber-/Rot-Spitze, violette Crossette mit Silber-/Gold-
   Spitze, doppeltes Finale aus Nishiki-Weiden mit roten und blauen Perlen */
b7Show('b7_eisbecher',[['zitrone','silber'],['zitrone','rot'],['violett','silber'],['violett','gold'],['rot','blau']],{sz:[0.9,1.25],pw:[0,2],hell:[0.9,1.25],kurve:'linear'},[
  {n:8,gap:0.7,muster:'x',ang:0.32,eff:'b7crossette',kal:'mittel',farbe:0,steig:'gold',pause:0.8},
  {n:6,gap:0.55,muster:'w',ang:0.3,eff:'b7crossette',kal:'mittel',farbe:1,steig:'gold',pause:0.8},
  {n:6,gap:0.55,muster:'z',ang:0.3,eff:'b7crossette',kal:'mittel',farbe:2,steig:'silber',pause:0.8},
  {n:6,gap:0.45,muster:'v',ang:0.28,eff:'b7crossette',kal:'gross',farbe:3,steig:'silber',pause:1.0},
  {n:5,gap:0.1,muster:'aussen',ang:0.3,eff:'b7nishikiperlen',kal:'gross',farbe:4,steig:'brokat',knall:'bkBrokat',pause:3.0},
  {n:5,gap:0.1,muster:'mitte',ang:0.24,eff:'b7nishikiperlen',kal:'gross',farbe:4,steig:'brokat',knall:'bkDonnerhall',pause:5}],1.5);
SIGNATUR.b7_eisbecher={idee:'Eisbecher',eff:'b7crossette',text:'Zitronen- und violette Crossetten mit Spitze, doppeltes Finale aus Nishiki-Weiden mit roten und blauen Perlen'};

/* MAERCHENSTUNDE (L12, 66) - Vorbild Iskra "Bajka" (66 Schuss, 68 s):
   1. Brokatkronen mit roten und weissen Blinkern / gruenen und roten,
   2. V: Gruen und Violett zu Schleierkraut, 3. Silber- und Rot-Glitzerweide
   mit blauen Sternen, 4. W: Goldweide zu Rot / Weiss blinkend / Blau,
   5. Silberspinne mit roten und gruenen Blinkern, 6. Faecher: Tuerkis mit
   roten Dahlien-Pistillen, 7. Salve: Brokatkrone mit orangen und gruenen
   Dahlien, 8. Salve: Rot, Blau, Gruen, Gelb zu Schleierkraut */
b7Show('b7_maerchen',[['gold','rot'],['gold','gruen'],['gruen','weiss'],['violett','weiss'],['silber','blau'],['rot','blau'],['gold','rot'],['tuerkis','rot'],['gold','gruen']],{sz:[0.9,1.3],pw:[0,2.4],hell:[0.9,1.28],kurve:'linear'},[
  {n:6,gap:1.0,muster:'paar',ang:0.28,eff:'b7brokatkrone',kal:'mittel',farbe:0,steig:'brokat',pause:0.8},
  {n:4,gap:1.0,muster:'aussen',ang:0.3,eff:'b7brokatkrone',kal:'mittel',farbe:1,steig:'brokat',pause:1.0},
  {n:4,gap:0.8,muster:'v',ang:0.26,eff:'b7schleier',kal:'mittel',farbe:2,steig:'silber',pause:0.6},
  {n:4,gap:0.8,muster:'mitte',ang:0.22,eff:'b7schleier',kal:'mittel',farbe:3,steig:'silber',pause:1.0},
  {n:6,gap:0.9,muster:'paar',ang:0.3,eff:'b7glitzerweide',kal:'mittel',farbe:4,steig:'silber',pause:0.6},
  {n:6,gap:0.9,muster:'zufall',ang:0.3,eff:'b7glitzerweide',kal:'mittel',farbe:5,steig:'glut',pause:1.0},
  {n:9,gap:0.7,muster:'w',ang:0.32,eff:'b7weidefarbe',kal:'mittel',farbe:6,steig:'gold',pause:1.0},
  {n:5,gap:0.35,muster:'mitte',ang:0.2,eff:'b7spinne',kal:'mittel',farbe:6,steig:'silber',knall:'bkZisch',pause:0.8},
  {n:8,gap:0.4,muster:'fan',ang:0.36,eff:'b7cyanpistill',kal:'mittel',farbe:7,steig:'silber',pause:1.2},
  {n:7,gap:0.1,muster:'mitte',ang:0.26,eff:'b7kronedahlie',kal:'gross',farbe:8,steig:'brokat',knall:'bkDonnerhall',pause:2.0},
  {mit:true,n:7,gap:0.08,muster:'aussen',ang:0.34,eff:'b7schleierbunt',kal:'gross',farbe:2,steig:'silber',knall:'bkKnisterhall',pause:5}],1.8);
SIGNATUR.b7_maerchen={idee:'Maerchenstunde',eff:'b7schleier',text:'Brokatkronen mit Blinkern, Farbsterne zu Schleierkraut, Glitzerweiden, Goldweiden zu Farbe, Silberspinne, Tuerkis mit Dahlien-Pistill'};

/* WOLFSNACHT (L15, 99) - Vorbild Iskra "Wilk" (99 Schuss 20 mm, 42 s):
   1. Brokatschweif zu blauer Paeonie, die weiss blinkt, 2. zwei Salven
   Silberwirbel (im Vorbild Pfeifer) zu Blau-Weissblinker, 3. W: Brokat-
   schweif zu blauer Paeonie mit Gold-, Gruen-, Rotblinkern, 4. Brokatkrone
   zu weissen Blinkspitzen, 5. zwei Salven Silberwirbel zu Brokatkrone,
   6. Z: Brokatkrone mit roten, gruenen, goldenen Blinkern, 7. Finale:
   Brokat-Buketts und Titanschlaege */
b7Show('b7_wolfsnacht',[['blau','weiss'],['blau','gold'],['gold','weiss'],['gold','rot']],{sz:[0.92,1.3],pw:[0,2.6],hell:[0.9,1.3],kurve:'spaet'},[
  {n:12,gap:0.42,muster:'mitte',ang:0.2,eff:'b7blinkpaeonie',kal:'mittel',farbe:0,steig:'brokat',pause:0.8},
  {n:12,takt:[0.06,0.06,0.06,0.06,0.06,1.3],muster:'aussen',ang:0.34,eff:'b7blinkpaeonie',kal:'mittel',farbe:0,steig:'wirbel',knall:'bkZisch',pause:0.8},
  {n:15,gap:0.26,muster:'w',ang:0.32,eff:'b7paeoniestrobe',kal:'mittel',farbe:1,steig:'brokat',pause:0.8},
  {n:15,gap:0.3,muster:'zufall',ang:0.3,eff:'b7brokatkrone',kal:'mittel',farbe:2,steig:'brokat',pause:0.8},
  {n:12,takt:[0.06,0.06,0.06,0.06,0.06,1.2],muster:'v',ang:0.3,eff:'b7brokatkrone',kal:'gross',farbe:2,steig:'wirbel',pause:0.8},
  {n:18,gap:0.18,muster:'z',ang:0.34,eff:'b7brokatbunt',kal:'gross',farbe:3,steig:'brokat',pause:1.0},
  {n:10,gap:0.08,muster:'kreis',ang:0.36,eff:'b7brokatkrone',kal:'gross',farbe:2,steig:'brokat',knall:'bkDonnerhall'},
  {mit:true,n:5,gap:0.22,muster:'mitte',ang:0.15,eff:'b7titan',kal:'gross',pw:2,farbe:2,steig:'silber',pause:4.5}]);
SIGNATUR.b7_wolfsnacht={idee:'Wolfsnacht',eff:'b7blinkpaeonie',text:'blaue Paeonien zu Weissblinkern, Silberwirbel, Brokatkronen mit bunten Blinkern, Titanschlaege'};

/* WUESTENGOLD (L17, 84) - Vorbild Riakeo "Dubai" (84 Schuss 30 mm,
   1,99 kg, 55 s): Z mit Gold, roten Blinkern und blauen Sternen,
   Goldschweife zu grossen Nishiki-Goldweiden, W-Salven, Brokat mit blauen
   Sternen zu Goldpalmen mit blauen Spitzen. Ohne Feuertoepfe am Boden. */
b7Show('b7_wuestengold',[['gold','blau'],['gold','rot'],['gold','blau']],{sz:[0.95,1.32],pw:[0,2.8],hell:[0.9,1.3],kurve:'linear'},[
  {n:14,gap:0.38,muster:'z',ang:0.34,eff:'b7goldstrobe',kal:'mittel',farbe:0,steig:'gold',pause:1.0},
  {n:12,gap:1.0,muster:'mitte',ang:0.18,eff:'b7nishiki',kal:'gross',farbe:1,steig:'gold',knall:'bkBrokat',pause:1.2},
  {n:18,gap:0.2,muster:'w',ang:0.34,eff:['b7goldstrobe','b7nishiki'],kal:'gross',farbe:0,steig:'gold',knall:'bkBrokat',pause:1.0},
  {n:16,gap:0.45,muster:'aussen',ang:0.3,eff:'b7palme',kal:'gross',farbe:2,steig:'brokat',pause:1.2},
  {n:16,gap:0.1,muster:'x',ang:0.34,eff:['b7nishiki','b7palme'],kal:'riesig',farbe:2,steig:'brokat',knall:'bkDonnerhall'},
  {mit:true,n:8,gap:0.2,muster:'mitte',ang:0.15,eff:'b7nishiki',kal:'riesig',pw:3,farbe:1,steig:'gold',knall:'b7Donner',pause:7}],1.6);
SIGNATUR.b7_wuestengold={idee:'Wuestengold',eff:'b7nishiki',text:'Nishiki-Goldweiden, Gold mit roten Blinkern und blauen Sternen, Goldpalmen mit blauen Spitzen'};

/* NEONKUESTE (L19, 128) - Vorbild Riakeo "Miami" (128 Schuss 25 mm,
   1,84 kg, 50 s): Neon-Paeonien mit roten oder weissen Blinkern,
   Goldweiden mit wirbelnden Goldschweifen, Finale: goldene Wirbelschweife
   zu riesigen Titan-Goldweiden */
b7Show('b7_neonkueste',[['magenta','rot'],['limette','weiss'],['gold','gold'],['tuerkis','weiss'],['gold','weiss']],{sz:[0.95,1.34],pw:[0,3],hell:[0.9,1.32],kurve:'spaet'},[
  {n:24,gap:0.2,muster:'wischer',ang:0.36,eff:'b7neon',kal:'mittel',farbe:0,steig:'farbspur',knall:'bkPuff',pause:1.0},
  {n:20,gap:0.26,muster:'zufall',ang:0.32,eff:'b7neon',kal:'gross',farbe:1,steig:'farbspur',knall:'bkPuff',pause:1.0},
  {n:24,gap:0.24,muster:'welle',ang:0.34,eff:'b7weide',kal:'gross',farbe:2,steig:'wirbel',knall:'bkRieseln',pause:1.0},
  {n:12,gap:0.5,muster:'x',ang:0.32,eff:['b7neon','b7wirbelgold'],kal:'gross',farbe:3,steig:'farbspur'},
  {mit:true,n:8,gap:0.8,muster:'aussen',ang:0.3,eff:'b7wirbelgold',kal:'gross',farbe:4,steig:'wirbel',pause:1.2},
  {n:40,gap:0.08,muster:'kreis',ang:0.38,eff:'b7titanweide',kal:'riesig',farbe:4,steig:'wirbel',knall:'bkBrokat',pause:8}],1.15);
SIGNATUR.b7_neonkueste={idee:'Neonkueste',eff:'b7neon',text:'Neon-Paeonien mit Blinkern, Goldweiden mit Wirbelschweifen, Finale aus riesigen Titan-Goldweiden'};

/* GOLDNATTER (L21, 72) - Vorbild Winda "Mafia Boss" (66 s): Goldweide zu
   roter / goldener Spitze, goldene Schwimmer mit roten / goldenen
   Blinkern, Goldpalme zu weisser Spitze, violette und orange Crossetten,
   Finale: goldene Schlangen */
b7Show('b7_goldnatter',[['gold','rot'],['gold','gold'],['gold','rot'],['violett','gold'],['orange','gold'],['gold','rot']],{sz:[0.95,1.34],pw:[0,3],hell:[0.9,1.3],kurve:'linear'},[
  {n:10,gap:1.3,muster:'mitte',ang:0.2,eff:'b7weidespitze',kal:'gross',farbe:0,steig:'gold',knall:'bkBrokat',pause:1.0},
  {n:12,gap:0.55,muster:'zufall',ang:0.32,eff:'b7schwimmer',kal:'gross',farbe:2,steig:'gold',knall:'bkZisch',pause:1.0},
  {n:10,gap:0.75,muster:'v',ang:0.28,eff:'b7palmespitze',kal:'gross',farbe:1,steig:'brokat',pause:1.0},
  {n:8,gap:0.32,muster:'x',ang:0.32,eff:'b7crossette',kal:'gross',farbe:3,steig:'silber',pause:0.6},
  {n:8,gap:0.32,muster:'w',ang:0.32,eff:'b7crossette',kal:'gross',farbe:4,steig:'silber',pause:1.2},
  {n:16,gap:0.12,muster:'kreis',ang:0.36,eff:'b7natter',kal:'riesig',farbe:5,steig:'gold',knall:'bkKnisterhall'},
  {mit:true,n:8,gap:0.35,muster:'aussen',ang:0.3,eff:['b7weidespitze','b7natter'],kal:'riesig',pw:3,farbe:0,steig:'gold',knall:'b7Donner',pause:7}],1.6);
SIGNATUR.b7_goldnatter={idee:'Goldnatter',eff:'b7natter',text:'Goldweiden zu Spitze, goldene Schwimmer mit Blinkern, Goldpalmen zu weisser Spitze, Crossetten, goldene Nattern'};

/* PAUKENSCHLAG (L22, 295) - Vorbild Black Cat "Out With A Bang" (295
   Schuss): Z-Reihen Silberwelle zu blauen Sternen, Goldkometen,
   Knisterkometen (die Pfeifer-Reihen sind Silberglitzer-Kometen), dann der
   BANG: fuenf Brokatkronen auf einen Schlag, Finale: fuenf Rohre
   knisternder Zeitregen. Kleines Kaliber, viele Reihen. */
b7Show('b7_paukenschlag',[['silber','blau'],['gold','gold'],['bernstein','gold'],['silber','weiss'],['gold','weiss']],{sz:[0.9,1.35],pw:[0,3],hell:[0.88,1.32],kurve:'spaet'},[
  {n:60,gap:0.1,muster:'z',seg:6,ang:0.34,eff:'b7silberwelle',kal:'mittel',farbe:0,steig:'silber',knall:'bkPlopp',pause:0.8},
  {n:60,gap:0.18,muster:'wischer',seg:5,ang:0.34,eff:'b7komet',kal:'mittel',farbe:1,steig:'komet',pause:0.8},
  {n:60,gap:0.1,muster:'welle',ang:0.34,eff:'b7knisterkomet',kal:'mittel',farbe:2,steig:'knister',pause:0.8},
  {n:50,gap:0.09,muster:'z',seg:5,ang:0.36,eff:['b7silberwelle','b7komet','b7knisterkomet'],kal:'mittel',farbe:0,steig:'silber',pause:0.8},
  {n:45,gap:0.08,muster:'zufall',ang:0.36,eff:'b7komet',kal:'mittel',farbe:3,steig:'rieselschweif'},
  {mit:true,n:10,gap:0.6,muster:'aussen',ang:0.3,eff:'b7knisterkomet',kal:'mittel',pw:2,farbe:2,steig:'knister',pause:1.5},
  {n:5,gap:0.02,muster:'mitte',ang:0.22,eff:'b7brokatkrone',kal:'riesig',pw:2,farbe:4,steig:'brokat',knall:'b7Donner',pause:3.0},
  {n:5,gap:0.05,muster:'aussen',ang:0.3,eff:'b7zeitregen',kal:'riesig',pw:3,farbe:4,steig:'brokat',knall:'bkKnisterhall',pause:6}]);
SIGNATUR.b7_paukenschlag={idee:'Paukenschlag',eff:'b7silberwelle',text:'Reihe um Reihe im Z: Silberwellen zu Blau, Gold- und Knisterkometen, der Paukenschlag aus fuenf Brokatkronen, knisternder Zeitregen'};

/* STERNPARADE (L24, 152) - Vorbild Weco "Star Attraction" (152 Schuss,
   vier Batterien, 90 m, ueber zwei Minuten): Blinkstern-Buketts Violett und
   Zitrone, Rot und Blinkweiss, Brokatkronen, Goldkometen, Violett und Gruen
   blinkend, Goldspinnen, gruene Feuertoepfe (hier: ein gruener Sternenteppich
   in der Luft, keine Bodenfontaene) */
b7Show('b7_sternparade',[['violett','zitrone'],['rot','weiss'],['gold','weiss'],['gold','gold'],['violett','gruen'],['gold','gruen'],['gruen','weiss']],{sz:[0.95,1.36],pw:[0,3.2],hell:[0.88,1.32],kurve:'spaet'},[
  {n:24,gap:0.85,muster:'paar',ang:0.3,eff:'b7blinkbukett',kal:'gross',farbe:0,steig:'silber',pause:1.2},
  {n:20,gap:0.7,muster:'v',ang:0.28,eff:'b7blinkbukett',kal:'gross',farbe:1,steig:'glut',pause:1.2},
  {n:20,gap:0.8,muster:'aussen',ang:0.3,eff:'b7brokatkrone',kal:'gross',farbe:2,steig:'brokat',pause:1.2},
  {n:24,gap:0.36,muster:'wischer',ang:0.36,eff:'b7komet',kal:'gross',farbe:3,steig:'komet',pause:1.0},
  {n:20,gap:0.6,muster:'zufall',ang:0.32,eff:'b7blinkbukett',kal:'gross',farbe:4,steig:'silber',pause:1.0},
  {n:20,gap:0.45,muster:'x',ang:0.32,eff:'b7goldspinne',kal:'gross',farbe:5,steig:'gold',knall:'bkZisch'},
  {mit:true,n:4,gap:1.6,muster:'mitte',ang:0.15,eff:'b7titan',kal:'gross',pw:3,farbe:2,steig:'silber',pause:1.2},
  {n:20,gap:0.12,muster:'kreis',ang:0.4,eff:['b7schleier','b7blinkbukett'],kal:'riesig',farbe:6,steig:'farbspur',knall:'bkKnisterhall',pause:8}],1.9);
SIGNATUR.b7_sternparade={idee:'Sternparade',eff:'b7blinkbukett',text:'Blinkstern-Buketts in Violett/Zitrone, Rot/Weiss, Violett/Gruen, Brokatkronen, Goldkometen, Goldspinnen, gruener Sternenteppich'};

/* BLUMENMEER (L27, 368) - Vorbild Lesli "Rio Grande" (368 Schuss, zwei
   Verbunde 180 + 188, sechs grosse Flowerbeds mit wechselnden Effekten und
   Schussrichtungen, ueber drei Minuten): sechs Beete, jedes mit eigenem
   Bild und eigener Richtung, nach dem dritten Beet eine Atempause (der
   zweite Verbund) */
b7Show('b7_blumenmeer',[['rose','rot'],['gold','gold'],['kornblau','gold'],['weiss','zitrone'],['magenta','zitrone'],['sonnengelb','bernstein'],['gold','weiss']],{sz:[0.95,1.4],pw:[0,3.5],hell:[0.88,1.34],kurve:'spaet'},[
  {n:60,gap:0.42,muster:'v',ang:0.32,eff:'b7rose',kal:'gross',farbe:0,steig:'glut',knall:'bkPuff',pause:1.0},
  {n:60,gap:0.42,muster:'mitte',ang:0.24,eff:'b7nishiki',kal:'gross',farbe:1,steig:'gold',knall:'bkBrokat',pause:1.0},
  {n:60,gap:0.38,muster:'z',ang:0.34,eff:'kornblume',kal:'gross',farbe:2,steig:'silber',knall:'bkPuff',pause:3.5},
  {n:62,gap:0.38,muster:'aussen',ang:0.34,eff:'b7lilie',kal:'gross',farbe:3,steig:'silber',knall:'bkRieseln',pause:1.0},
  {n:62,gap:0.25,muster:'wischer',ang:0.38,eff:'b7blinkbukett',kal:'gross',farbe:4,steig:'farbspur',pause:1.0},
  {n:44,gap:0.3,muster:'kreis',ang:0.38,eff:'b7sonnenblume',kal:'riesig',farbe:5,steig:'brokat',knall:'bkKnisterhall'},
  {mit:true,n:20,gap:0.1,muster:'zufall',ang:0.4,eff:['b7sonnenblume','b7titanweide'],kal:'riesig',pw:3,farbe:6,steig:'brokat',knall:'b7Donner',pause:9}],1.45);
SIGNATUR.b7_blumenmeer={idee:'Blumenmeer',eff:'b7sonnenblume',text:'sechs Blumenbeete: Rosen, Goldregen, Kornblumen, Lilien, Blinksternfeld, Sonnenblumen'};

/* RAGNAROEK (L28, 409) - Vorbild Riakeo "The Apocalypse 1+2" (409 Schuss,
   vier Verbunde, 120 s, 7,9 kg): goldene Brokatkronen, rote Dahlien, blaue
   Paeonien, gruene Kometen, Knister und Blinker, Faecher, Salven, Z; von
   ruhiger Eleganz bis zum rasenden Finale mit brachialen Zerlegern */
b7Show('b7_ragnaroek',[['gold','weiss'],['blau','tuerkis'],['rot','orange'],['gruen','gruen'],['gold','gold'],['violett','weiss'],['gold','rot'],['gold','weiss']],{sz:[0.95,1.42],pw:[0,3.8],hell:[0.88,1.36],kurve:'spaet'},[
  {n:16,gap:1.5,muster:'mitte',ang:0.18,eff:'b7brokatkrone',kal:'gross',farbe:0,steig:'brokat',knall:'b7Krone',pause:1.5},
  {n:24,gap:0.8,muster:'aussen',ang:0.3,eff:'b7meer',kal:'gross',farbe:1,steig:'silber',knall:'bkRieseln',pause:1.0},
  {n:30,gap:0.5,muster:'v',ang:0.3,eff:'b7dahlie',kal:'gross',farbe:2,steig:'glut',pause:1.0},
  {n:40,gap:0.15,muster:'fan',ang:0.42,eff:'b7komet',kal:'gross',farbe:3,steig:'farbspur',pause:1.0},
  {n:50,gap:0.12,muster:'wischer',ang:0.4,eff:'b7knisterkrone',kal:'gross',farbe:4,steig:'knister',pause:0.8},
  {n:40,gap:0.12,muster:'zufall',ang:0.38,eff:'b7blinkbukett',kal:'gross',farbe:5,steig:'silber',pause:0.8},
  {n:60,gap:0.08,muster:'z',ang:0.38,eff:['b7brokatkrone','b7dahlie','b7meer'],kal:'riesig',farbe:6,steig:'brokat',knall:'bkDonnerhall'},
  {mit:true,n:20,gap:0.25,muster:'x',ang:0.34,eff:'b7titan',kal:'riesig',pw:3,farbe:7,steig:'silber',pause:1.0},
  {n:105,gap:0.04,muster:'kreis',ang:0.42,eff:['b7brokatkrone','b7dahlie','b7knisterkrone','b7titan','b7nishiki'],kal:'riesig',farbe:6,steig:'brokat',knall:'bkDonnerhall'},
  {n:24,gap:0.05,muster:'mitte',ang:0.2,eff:'b7nishiki',kal:'riesig',pw:4,farbe:7,steig:'gold',knall:'b7Donner',pause:10}]);
SIGNATUR.b7_ragnaroek={idee:'Ragnaroek',eff:'b7knisterkrone',text:'ruhige Brokatkronen, blaue Paeonien, rote Dahlien, gruene Kometen, Knisterfaecher, Blinker, Z-Salven, Titanschlaege, rasendes Finale'};

/* Eigene Rohrfolge je Batterie (nie bloss links -> rechts) */
const b7Saat=(t,fn)=>rohrSaat(saatZahl(t+':b7'),fn);
const b7Idx=L=>L.rohre.map((x,i)=>i);
Object.assign(TH_FOLGE,{
  /* Laube: aus der Mitte nach aussen, links und rechts im Wechsel */
  b7_goldlaube:L=>{ const R=L.rohre; return b7Idx(L).sort((a,b)=>Math.abs(R[a].x)-Math.abs(R[b].x)||R[a].x-R[b].x||R[a].z-R[b].z); },
  /* Eisbecher: diagonal, Kugel fuer Kugel aus der Waffel */
  b7_eisbecher:L=>{ const R=L.rohre; return b7Idx(L).sort((a,b)=>(R[a].x+R[a].z)-(R[b].x+R[b].z)||R[a].x-R[b].x); },
  /* Maerchen: Spirale von aussen nach innen */
  b7_maerchen:L=>{ const R=L.rohre, w=x=>-Math.round(Math.hypot(x.x,x.z*1.6)*14)+(Math.atan2(x.z,x.x)+Math.PI)/(2*Math.PI); return b7Idx(L).sort((a,b)=>w(R[a])-w(R[b])); },
  /* Wolfsnacht: das Rudel - in Gruppen zu drei, die irgendwo zuschlagen */
  b7_wolfsnacht:(L,t)=>b7Saat(t,()=>{ const R=L.rohre, frei=new Set(b7Idx(L)), out=[];
    while(frei.size){ const a=[...frei], s0=a[Math.floor(Math.random()*a.length)]; a.sort((x,y)=>thAbst(R[x],R[s0])-thAbst(R[y],R[s0])).slice(0,3).forEach(k=>{ frei.delete(k); out.push(k); }); } return out; }),
  /* Wueste: Duenenwellen quer ueber den Block */
  b7_wuestengold:L=>{ const R=L.rohre, w=x=>x.z+Math.sin(x.x*14)*0.06; return b7Idx(L).sort((a,b)=>w(R[b])-w(R[a])); },
  /* Kueste: von rechts nach links, vorn und hinten im Wechsel wie Wellen */
  b7_neonkueste:L=>{ const R=L.rohre; return b7Idx(L).sort((a,b)=>(R[b].x-R[a].x)||(R[a].row%2?R[a].z-R[b].z:R[b].z-R[a].z)); },
  /* Natter: Schlangenlinie Spalte fuer Spalte */
  b7_goldnatter:L=>{ const R=L.rohre, xs=[...new Set(R.map(x=>+x.x.toFixed(3)))].sort((a,b)=>a-b);
    return b7Idx(L).sort((a,b)=>{ const ia=xs.indexOf(+R[a].x.toFixed(3)), ib=xs.indexOf(+R[b].x.toFixed(3)); return ia-ib||(ia%2?R[b].z-R[a].z:R[a].z-R[b].z); }); },
  /* Paukenschlag: Reihe fuer Reihe von hinten nach vorn im Z */
  b7_paukenschlag:L=>{ const R=L.rohre; return b7Idx(L).sort((a,b)=>R[b].row-R[a].row||(R[a].row%2?R[b].x-R[a].x:R[a].x-R[b].x)); },
  /* Sternparade: vier Batterien nacheinander (Viertel), darin zufaellig */
  b7_sternparade:(L,t)=>b7Saat(t,()=>{ const R=L.rohre, q=x=>(x.x<0?0:1)+(x.z<0?0:2), w=R.map(x=>[1,0,3,2][q(x)]*10+Math.random()); return b7Idx(L).sort((a,b)=>w[a]-w[b]); }),
  /* Blumenmeer: sechs Beete (Streifen), jedes Beet in eigener Richtung */
  b7_blumenmeer:L=>{ const R=L.rohre, xs=R.map(x=>x.x), x0=Math.min(...xs), x1=Math.max(...xs)+1e-6, beet=x=>Math.min(5,Math.floor((x.x-x0)/(x1-x0)*6));
    return b7Idx(L).sort((a,b)=>{ const ba=beet(R[a]), bb=beet(R[b]); return ba-bb||(ba%2?R[b].z-R[a].z:R[a].z-R[b].z)||(ba%3?R[a].x-R[b].x:R[b].x-R[a].x); }); },
  /* Ragnaroek: aus der Mitte nach aussen, je Ring durcheinander */
  b7_ragnaroek:(L,t)=>b7Saat(t,()=>{ const R=L.rohre, w=R.map(x=>Math.round(Math.hypot(x.x,x.z*1.3)*9)+Math.random()*0.95); return b7Idx(L).sort((a,b)=>w[a]-w[b]); })
});
Object.keys(B7_ABSCHUSS).concat(['kornblumen','bienenweide','meteorschauer','lb_saphirfaecher','hochzeitsfaecher','lb_tautropfen']).forEach(t=>{ if(typeof lochFrisch==='function') lochFrisch(t); });

/* ---------- 4. Lizenztexte ohne Gestrichenes ---------- */
{ const d=(id,txt)=>{ const L=LIZENZEN.find(l=>l.id===id); if(L) L.desc=txt; };
  d('profi','Der Paukenschlag mit 295 Schuss und die Sternparade aus vier Batterien, der Hexenkessel mit 180 Schuss, der Meteorschauer und die Jumbo-Raketen »Polarstern« und »Feuerdrache«; dazu die großen Kugelbomben: Himmelsbrecher, Ringnebel, Kanonade, Sternensturm und Riesenpalme.');
  d('meister','Das Ende der Leiter: der Weltuntergang mit 300 Schuss, der Urwald mit hundert, die Jumbo-Rakete »Supernova«, die 300-mm-Kugeln Kometensturm und Urknall – erst ein Boom, dann ein Monster-Schlag.');
  d('grossfeuer','Die Jumbo-Rakete »Juwelenpalme«, der Farbtiger, die Farbsäulen, der Weidenhain, die Goldnatter und die 200-mm-Kugelbomben.');
  d('grossfeuerwerk','Was sonst nur Profis zünden: das Blumenmeer mit sechs Blumenbeeten aus 368 Schuss, Ragnarök mit 409 Schuss aus vier Verbunden – und die Kugelbomben Herbststurm, Eiszeit, Titanenfaust und Lavastrom.'); }
/* Drehbuecher der gestrichenen Batterien (r3Show/r4Show legten sie ohne
   Katalogeintrag an) - sonst liefen Tests und Suchen ueber SHOWS ins Leere */
for(const t of B7_WEG) if(!P[t]){ delete SHOWS[t]; if(typeof THEMEN!=='undefined') delete THEMEN[t]; }
try{ window.__b7={NEU:B7_NEU.map(x=>x[0]),WEG:B7_WEG,BEARB:['kornblumen','lb_tautropfen','bienenweide','lb_saphirfaecher','hochzeitsfaecher','meteorschauer']}; }catch(e){}

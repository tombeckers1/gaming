/* =========================================================
   Zehn intensive Kugelbomben (02.10., Tom: "so ein Schuss und das ist
   alles zu lame - richtig geil, ein Wow-Effekt; breite Fontaenen auch
   ruhig beim Abschuss, mit Roemischen Lichtern; nimm dir ein Beispiel an
   allem, was ich gesagt habe, das gefaellt mir").
   Gebaut nur aus dem, was gefallen hat:
   - Kugeln: Crossettennetz, Tigerkrone, Weidenkoenig, Sternensturm,
     Feuerlilie, Kanonade
   - Batterie-Effekte: Tigerschweif, Kiefernkohle (Kiefernkrone),
     Lavaregen, Sternspritzer; die Mix-Batterien mit Fontaene,
     Roemischen Lichtern und Knallen
   - Lichter: Blitzweide, Bluetenkranz, Bluetenglitzer, Dreiklang,
     Goldwasserfall, Kometenkrone, Zwillingskomet, Farbcrossette,
     Weidenfaecher; Goldader, Kreuzfeuer, Glutstrom; die breiten
     Einzelfontaenen
   Jede Kugel: ein Abschuss, der schon etwas zeigt (KUGEL.abschuss, am
   Moerser), ein Aufstieg und ein Bruch in mehreren Stufen, aus dem ein
   kleines Feuerwerk entsteht. Battery-Effekte laufen hier mit halber
   Kugelgroesse (s*0.5), damit sie zur Kugel passen.
   ========================================================= */
function wKnister(e,n,s){ for(let j=0;j<n;j++){ const d=randDir(), w=rand(1.2,3.2)*Math.sqrt(s); psSmall.emit(e.x,e.y,e.z,d[0]*w,d[1]*w,d[2]*w,1.5,1.45,1.3,rand(0.4,0.9),1,3); } }
function wKrone(e,c,s,n,L){ for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2), w=rand(2.5,4.5)*Math.sqrt(s); kgStern(psBig,e,[Math.cos(a)*w,rand(0,1.5),Math.sin(a)*w],c(i),rand(L*0.85,L),1.6,4,0.3); } }
function wBlitz(q,c,L){ kgStern(psHuge,q,[rand(-.3,.3),rand(-.6,0),rand(-.3,.3)],c||[1.9,1.9,2],L||rand(0.3,0.6),0.6,1,0); }
/* Farbcrossette im Bruch: Komet in A, zerspringt in vier, die nach 0,6 s zu B wechseln */
function wFarbCross(p,v,G,t,cA,cB,s){ nKomet(p,v,cA,t,G,[1,.8,.42],45);
  kgSpaeter(t,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,t), w=bahnTempo(v,G,t), a0=rand(0,Math.PI*2);
    for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=5*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.3,1+w[1]*0.3,Math.sin(a)*sp+w[2]*0.3];
      const h=nKomet(e,dv,cA,1.4,3.2,[1,.8,.42],26); kgSpaeter(0.6,()=>kgFarbe(h,cB)); }
    psHuge.emit(e.x,e.y,e.z,0,0,0,1.3,1.2,1,0.05,0,0); }); }

/* ---------- Abschuss am Moerser (kugelSorte, 14b) ---------- */
const KUGEL_ABSCHUSS={
  /* breite Goldfontaene aus dem Moerser, brennt nach dem Abschuss weiter */
  goldfontaene(o,A,B,k){ lBreit(o,A,B,0.9+0.15*k,{},{D:2.8+0.35*k,H:9,weit:0.8,n:32,md:4,c:(u,j)=>j%6?GOLDF:kgMal(A,1.3)}); },
  /* Glutvulkan: breit und niedrig, schwere Glut */
  glutfontaene(o,A,B,k){ lBreit(o,A,B,0.9+0.15*k,{},{D:3.0+0.35*k,H:7,G:5,weit:0.9,n:26,md:2,c:()=>[1.3,.62,.16],c2:[.35,.08,.02],life:[1.0,1.6]});
    for(let i=0;i<6;i++) later(0.5+i*0.45,()=>sfx.prasseln(distVol(o)*0.8)); },
  /* Blitzfontaene: weisse Blinkfunken */
  blitzfontaene(o,A,B,k){ lBreit(o,A,B,0.95+0.15*k,{},{D:2.8+0.35*k,H:9,weit:0.75,n:30,md:1,life:[0.7,1.2],c:(u,j)=>j%3?[1.7,1.7,1.75]:GOLDF}); },
  /* Roemische Lichter: ein Faecher Leuchtkugeln aus dem Moerser, kurz
     nacheinander, abwechselnd A, B, Gold */
  perlenfaecher(o,A,B,k){ const m=lMund(o), n=5+k, F=[A,B,FW.gold];
    for(let i=0;i<n;i++) kgSpaeter(0.12*i,()=>{ const a=-0.55+1.1*(i%2?n-1-i:i)/(n-1), v=lAbschuss(rand(15,21),2.2,{ang:a,dir:FANDIR},0.3), T=lScheitel(v[1],2.2)+0.5;
      nPerle(m,v,kgMal(F[i%3],1.6),T,2.2); lStart(m,0.8,0.5); }); },
  /* zwei Goldkometen steigen links und rechts mit der Kugel auf */
  kometen(o,A,B,k){ LICHTYP.goldkomet(o,A,B,1.2,{ang:-0.2,dir:FANDIR}); kgSpaeter(0.15,()=>LICHTYP.goldkomet(o,A,B,1.2,{ang:0.2,dir:FANDIR})); },
  /* Weidenfaecher: fuenf Weidenkometen zur Goldfontaene */
  weiden(o,A,B,k){ KUGEL_ABSCHUSS.goldfontaene(o,A,B,k); kgSpaeter(0.3,()=>LICHTYP.weidenfaecher(o,A,B,1.3,{ang:0,dir:FANDIR})); },
  /* Mix wie die Mix-Batterien: Fontaene, Roemische Lichter und zwei Knalle */
  mix(o,A,B,k){ KUGEL_ABSCHUSS.goldfontaene(o,A,B,k); KUGEL_ABSCHUSS.perlenfaecher(o,A,B,k);
    [0.7,1.15].forEach((t,i)=>kgSpaeter(t,()=>{ const m=lMund(o), q={x:m.x+(i?2.5:-2.5),y:m.y+rand(11,14),z:m.z}; flash(q,[1,1,1],3,0.15);
      for(let j=0;j<Math.round(40*QUAL());j++){ const d=randDir(), w=rand(3,7); psSmall.emit(q.x,q.y,q.z,d[0]*w,d[1]*w,d[2]*w,1.8,1.75,1.6,rand(0.08,0.2),1,0); }
      for(let j=0;j<3;j++) psHuge.emit(q.x,q.y,q.z,0,0,0,2,2,1.9,0.08,0,0); schall(q,x=>sfx.crack(x*1.2)); })); }
};
/* dunkler Aufstieg (Blitzweide): nur ein schwaches Glimmen */
STEIG_ART.dunkel={spur(r,dt,ort){ for(let n=jeSek(r,'a',18,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.1,.1),rand(-.4,0),rand(-.1,.1),.45,.22,.1,rand(0.3,0.5),1,0); } }};

/* ---------- Die zehn Bruchbilder ---------- */
/* Goldsturm (150): Tigerschweif-Kometen in Gold um einen Kern aus
   Goldglitzer, an ihren Enden knistert es, zum Schluss sinkt eine Goldweide */
EFF.goldsturm=function(p,A,B,s){
  EFF.tigerschweif(p,A,B,s*0.62); EFF.tigerschweif(p,FW.orange,A,s*0.45);
  nKugel(Math.round(80*KQ(s)),5.5*s,v=>kgStern(psBig,p,v,[1.3,1.0,.45],rand(1.6,2.2),2.4,4,0.2));
  kgSpaeter(1.9,()=>{ nKugel(Math.round(10*KQ(s)),7*s,v=>{ const e={x:p.x+v[0]*0.9,y:p.y+v[1]*0.7-2,z:p.z+v[2]*0.9}; wKnister(e,Math.round(9*QUAL()),s); });
    schall(p,x=>{ sfx.crackle(x*1.0); later(0.2,()=>sfx.crackle(x*0.8)); }); });
  kgSpaeter(2.3,()=>{ nKugel(Math.round(36*KQ(s)),3.6*s,v=>kgStern(psBig,p,v,[1.1,.7,.28],rand(3.6,4.4),1.0,0,0.9)); schall(p,x=>sfx.rieseln(x*0.7,4)); });
  schall(p,x=>{ sfx.boom(x*1.1); sfx.fauchen(x*0.5,2.2); }); };
/* Roemerfeuer (150): Leuchtkugeln wie Roemische Lichter in vier Farben,
   jede zerspringt nach gut einer Sekunde in eine kleine Goldcrossette */
EFF.roemerfeuer=function(p,A,B,s){ const F=[A,B,FW.gold,FW.weiss].map(c=>kgMal(c,1.6));
  nKugel(Math.round(22*KQ(s)),8.5*s,(v,i)=>{ const t=rand(1.1,1.4); nPerle(p,v,F[i%4],t,2.2);
    kgSpaeter(t,()=>{ const e=sternNach(p,v[0],v[1],v[2],2.2,t), w=bahnTempo(v,2.2,t), a0=rand(0,Math.PI*2);
      for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=3.2*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.3,0.8+w[1]*0.3,Math.sin(a)*sp+w[2]*0.3]; nKomet(e,dv,kgMal(FW.gold,1.4),1.0,3,[1,.8,.42],20); } }); });
  kgSpaeter(1.2,()=>schall(p,x=>{ sfx.crack(x*0.9); later(0.1,()=>sfx.crack(x*0.7)); later(0.2,()=>sfx.crackle(x*0.6)); }));
  schall(p,x=>sfx.boom(x*1.0)); };
/* Funkenbluete (150): Sternspritzer-Kugel, darum ein Bluetenkranz, der
   von B nach Gold wechselt, innen ein Dreiklang A - B - Weiss */
EFF.funkenbluete=function(p,A,B,s){
  EFF.sternspritzer(p,A,B,s*0.62); EFF.sternspritzer(p,B,FW.gold,s*0.45);
  nRing(p,Math.round(26*KQ(s))+14,9.5*s,v=>{ const h=kgStern(psBig,p,v,kgMal(B,1.6),3.4,2.0,0,0.15); nFolge(h,[kgMal(FW.gold,1.7)],[1.5]); },0.5);
  nKugel(Math.round(44*KQ(s)),4.2*s,v=>{ const h=kgStern(psBig,p,v,kgMal(A,1.6),3.4,1.8,0,0.08); nFolge(h,[kgMal(B,1.6),[1.7,1.7,1.75]],[1.0,2.2]); });
  kgSpaeter(1.2,()=>{ nKugel(Math.round(10*KQ(s))+6,5*s,v=>{ const e={x:p.x+v[0]*0.6,y:p.y+v[1]*0.6,z:p.z+v[2]*0.6}; nKugel(9,2.2*s,w=>kgStern(psBig,e,w,kgMal(A,1.6),2.2,1.8,0,0.1)); });
    schall(p,x=>{ sfx.crack(x*0.8); later(0.12,()=>sfx.crack(x*0.6)); }); });
  schall(p,x=>sfx.boom(x*1.0)); };
/* Farbkreuz (100): zwei Wellen Farbcrossetten, die zweite kleiner und
   in den getauschten Farben */
EFF.farbkreuz=function(p,A,B,s){
  nKugel(Math.round(14*KQ(s))+10,8*s,v=>wFarbCross(p,v,2.6,0.7,kgMal(A,1.5),kgMal(B,1.65),s*0.8));
  EFF.tigerschweif(p,A,FW.gold,s*0.5);
  kgSpaeter(0.55,()=>{ nKugel(Math.round(8*KQ(s))+6,5.5*s,v=>wFarbCross(p,v,2.6,0.6,kgMal(B,1.5),kgMal(A,1.65),s*0.65)); });
  kgSpaeter(1.3,()=>{ nRing(p,Math.round(8*KQ(s))+10,6*s,v=>wFarbCross(p,v,2.4,0.5,kgMal(FW.gold,1.6),kgMal(A,1.6),s*0.5),0.3); });
  schall(p,x=>{ sfx.boom(x*0.9); later(0.7,()=>{ sfx.crack(x*0.8); later(0.1,()=>sfx.crack(x*0.6)); }); later(1.2,()=>sfx.crack(x*0.6)); later(1.9,()=>{ sfx.crack(x*0.7); later(0.08,()=>sfx.crack(x*0.6)); }); }); };
/* Kronenkranz (200): ein Ring Goldkometen, an jedem Ende haengt eine
   Glitzerkrone (Kometenkrone); in der Mitte eine Kugel B, die zu A wechselt */
EFF.kronenkranz=function(p,A,B,s){ const G=2.4, T=1.5;
  nRing(p,Math.round(4*KQ(s))+8,9*s,v=>{ nKomet(p,v,kgMal(A,1.6),T,G,[1,.74,.32],110);
    kgSpaeter(T,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T); wKrone(e,i=>i%3?[1.6,1.2,.55]:kgMal(B,1.8),s*1.6,Math.round(30*QUAL())+10,3.4); flash(e,[1,.85,.5],1.5,0.2); }); },0.35);
  nKugel(Math.round(40*KQ(s)),5.5*s,v=>{ const h=kgStern(psBig,p,v,kgMal(B,1.5),2.4,2.2,0,0.1); nFolge(h,[kgMal(A,1.6)],[1.1]); });
  kgSpaeter(T,()=>schall(p,x=>sfx.rieseln(x*0.8,3.5)));
  schall(p,x=>{ sfx.boom(x*1.2); sfx.zischen(x*0.4,1.5); }); };
/* Lavaglut (200): Lavabrocken und Tigerkometen in Glutfarben, darunter
   oeffnet sich ein Bluetenkranz Rot -> Gold, am Ende knistert es */
EFF.lavaglut=function(p,A,B,s){
  EFF.lavaregen(p,A,B,s*0.62); EFF.lavaregen(p,FW.gold,B,s*0.45); EFF.tigerschweif(p,FW.orange,FW.gold,s*0.55);
  kgSpaeter(0.9,()=>{ const e={x:p.x,y:p.y-4,z:p.z}; nKranz(Math.round(10*KQ(s))+10,6*s,v=>{ const h=kgStern(psBig,e,v,kgMal(B,1.5),2.6,2,0,0.15); nFolge(h,[kgMal(FW.gold,1.6)],[1.3]); },0.1); schall(e,x=>sfx.boom(x*0.7)); });
  kgSpaeter(2.2,()=>{ nKugel(Math.round(8*KQ(s)),6*s,v=>{ const e={x:p.x+v[0]*0.8,y:p.y+v[1]*0.5-4,z:p.z+v[2]*0.8}; wKnister(e,Math.round(8*QUAL()),s); }); schall(p,x=>{ sfx.crackle(x*0.9); later(0.3,()=>sfx.crackle(x*0.7)); }); });
  schall(p,x=>{ sfx.wumms(x*1.1); sfx.boom(x*0.8); }); };
/* Zwillingssonne (200): zwei Sonnen zugleich nebeneinander - links
   goldene Tigerkometen, rechts farbige Sternspritzer -, dann fliegen
   Zwillingskometen ueberkreuz von einer zur anderen, in der Mitte
   knistert eine Kiefernkrone */
EFF.zwillingssonne=function(p,A,B,s){ const [u]=basisBlick(p,0.2), d=3.2*s, L={x:p.x-u[0]*d,y:p.y,z:p.z-u[2]*d}, R={x:p.x+u[0]*d,y:p.y,z:p.z+u[2]*d};
  EFF.tigerschweif(L,FW.gold,FW.orange,s*0.66); EFF.lavaregen(L,FW.gold,FW.orange,s*0.4); EFF.sternspritzer(R,A,B,s*0.66); EFF.sternspritzer(R,B,FW.gold,s*0.45); flash(L,[1,.8,.4],4,0.25); flash(R,kgMal(A,1),4,0.25);
  kgSpaeter(0.9,()=>{ for(const [von,zu,c] of [[L,R,A],[R,L,B]]) for(let k=0;k<5;k++){ const dx=zu.x-von.x, dz=zu.z-von.z, l=Math.hypot(dx,dz)||1, w=5.5*Math.sqrt(s)*(0.8+0.2*k), v=[dx/l*w,1.5+k*1.2,dz/l*w];
      nKomet(von,v,kgMal(c,1.6),2.4,2.0,[1,.8,.42],60); } schall(p,x=>sfx.zischen(x*0.5,1.6)); });
  kgSpaeter(1.9,()=>{ EFF.kiefernkrone({x:p.x,y:p.y-1,z:p.z},FW.gold,A,s*0.5); });
  schall(p,x=>{ sfx.boom(x*1.2); later(0.05,()=>sfx.boom(x*0.9)); }); };
/* Weidendom (300): riesige Goldweide mit farbigen Spitzen, vom Rand
   fallen zwoelf Goldvorhaenge (Goldwasserfall), innen Bluetenglitzer */
EFF.weidendom=function(p,A,B,s){
  nKugel(Math.round(54*KQ(s)),7.5*s,(v,i)=>kgStern(psBig,p,v,i%6?[1.1,.72,.28]:kgMal(A,1.6),rand(4.2,5.0),1.0,i%6?4:0,0.9));
  nKranz(Math.round(4*KQ(s))+8,8*s,v=>{ kgStern(psHuge,p,v,[1.5,1.1,.5],3.2,1.5,0,0.2); nVorhang(p,v,1.5,3.2,GOLDF,24,4); },0.12);
  nKugel(Math.round(14*KQ(s)),3.5*s,(v,i)=>{ kgStern(psBig,p,v,kgMal(i%2?A:B,1.5),2.4,2.2,0,0.1); rkFunken(p,v,2.2,0.15,2.4,10,[1.2,1.1,.9],{ps:psMid,life:[0.5,0.9],g:2,streu:0.2,mit:0.05,mode:4}); });
  schall(p,x=>{ sfx.boom(x*1.3); later(0.6,()=>sfx.regen(x*0.6,4)); later(1.0,()=>sfx.rieseln(x*0.7,5)); }); };
/* Blitzkoenig (300): dunkler Aufstieg, dann eine goldene Weide, in der
   es ueberall weiss aufblitzt, zwei Blitzkronen in verschiedenen
   Neigungen, zum Schluss sinkt ein Regen aus Blinksternen */
EFF.blitzkoenig=function(p,A,B,s){ const arme=[];
  nKugel(Math.round(54*KQ(s)),7*s,v=>{ kgStern(psBig,p,v,[1.3,.9,.32],rand(3.8,4.6),1.6,0,0.45); rkFunken(p,v,1.6,0.1,4,14,[.95,.6,.22],{ps:psMid,life:[1.4,2.2],g:0.6,streu:0.08,mit:0.02,mode:0,spur:0.2}); arme.push(v); });
  for(let t=0.3;t<3.8;t+=0.03){ const tt=t; kgSpaeter(tt,()=>{ for(let j=0;j<3;j++){ const v=arme[Math.floor(Math.random()*arme.length)], q=sternNach(p,v[0],v[1],v[2],1.6,tt); wBlitz(q,[2,2,2.1],rand(0.4,0.8)); } }); }
  flash(p,[1,1,1],6,0.3);
  [0.5,-0.4].forEach((kipp,j)=>nRing(p,Math.round(10*KQ(s))+10,(5+j*1.5)*s,v=>{ const L=rand(2.8,3.4); kgStern(psBig,p,v,kgMal(j?B:A,1.4),L,1.6,4,0.3);
    kgSpaeter(L*0.7,()=>{ const q=sternNach(p,v[0],v[1],v[2],1.6,L*0.7); wBlitz(q,null,rand(0.5,0.9)); }); },kipp));
  kgSpaeter(2.6,()=>{ nKugel(Math.round(30*KQ(s)),2.2*s,v=>kgStern(psBig,p,[v[0],-Math.abs(v[1])*0.5,v[2]],[1.8,1.8,1.85],rand(2.0,2.8),1.2,1,0)); schall(p,x=>sfx.rieseln(x*0.6,3)); });
  schall(p,x=>{ sfx.plopp(x*0.8,0.8); later(0.3,()=>sfx.rieseln(x*0.6,4)); }); };
/* Finalfuerst (300): alles, was gefallen hat, in einer Kugel - Gold-
   Tigerkometen und ein Ring Roemischer Lichter, dann acht Farbcrossetten,
   dann ein Weidenvorhang mit Kiefernknistern, zum Schluss drei Knalle */
EFF.finalfuerst=function(p,A,B,s){
  EFF.tigerschweif(p,FW.gold,FW.orange,s*0.6);
  nRing(p,Math.round(16*KQ(s))+10,8.5*s,(v,i)=>nPerle(p,v,kgMal(i%2?A:B,1.6),2.6,2.2),0.45);
  kgSpaeter(0.9,()=>{ nKugel(8,6*s,v=>wFarbCross(p,v,2.6,0.6,kgMal(A,1.45),kgMal(B,1.6),s*0.6)); schall(p,x=>{ sfx.boom(x*0.8); later(0.6,()=>{ sfx.crack(x*0.9); later(0.1,()=>sfx.crack(x*0.7)); }); }); });
  kgSpaeter(1.9,()=>{ nKugel(Math.round(40*KQ(s)),4*s,v=>kgStern(psBig,p,v,[1.1,.7,.28],rand(3.6,4.4),1.0,4,0.9)); EFF.kiefernkrone({x:p.x,y:p.y+2,z:p.z},FW.gold,A,s*0.3); schall(p,x=>sfx.rieseln(x*0.7,4)); });
  [3.2,3.45,3.7].forEach((t,k)=>kgSpaeter(t,()=>{ const [u]=basisBlick(p,0.2), q={x:p.x+u[0]*(k-1)*6,y:p.y+3-k,z:p.z+u[2]*(k-1)*6};
    for(let i=0;i<Math.round(60*QUAL());i++){ const d=randDir(), w=Math.cbrt(Math.random())*rand(6,10); psMid.emit(q.x,q.y,q.z,d[0]*w,d[1]*w,d[2]*w,1.7,1.7,1.65,rand(0.06,0.2),0,4); }
    for(let i=0;i<3;i++) psHuge.emit(q.x,q.y,q.z,0,0,0,2,2,1.9,0.1,0,0); flash(q,[1,1,1],5,0.3); schall(q,x=>{ sfx.boom(x*1.2); sfx.crack(x*1.1); }); }));
  schall(p,x=>sfx.boom(x*1.3)); };

const WOW=['goldsturm','roemerfeuer','funkenbluete','farbkreuz','kronenkranz','lavaglut','zwillingssonne','weidendom','blitzkoenig','finalfuerst'];
WOW.forEach(n=>{ const f=EFF[n]; EFF[n]=function(){ const alt=STERN_LEBEN; STERN_LEBEN=1.5; try{ return f.apply(this,arguments); } finally{ STERN_LEBEN=alt; } }; });
Object.assign(EFF_FAMILIE,{goldsturm:'komet',roemerfeuer:'kugel',funkenbluete:'glitzer',farbkreuz:'komet',kronenkranz:'komet',lavaglut:'flamme',zwillingssonne:'komet',weidendom:'haenger',blitzkoenig:'glitzer',finalfuerst:'knall'});
/* Produkte (02e): id, Bruch, Kaliber, Farben, Aufstieg, Abschuss, Text */
const WOW_KUGELN=[
  ['kn_farbkreuz100','farbkreuz',2,'rot','gruen','blitzspur','perlenfaecher','Römische Lichter beim Abschuss, oben zwei Wellen Farbcrossetten'],
  ['kn_goldsturm150','goldsturm',3,'gold','orange','kometenkopf','goldfontaene','Breite Goldfontäne, Tigerkometen, Knistern und eine Goldweide'],
  ['kn_roemerfeuer150','roemerfeuer',3,'rot','blau','perlenschnur','perlenfaecher','Römische Lichter unten und oben, jede Kugel zerspringt in eine Crossette'],
  ['kn_funkenbluete150','funkenbluete',3,'magenta','tuerkis','glitzerspur','perlenfaecher','Sternspritzer, Blütenkranz und Dreiklang in einer Kugel'],
  ['kn_kronenkranz200','kronenkranz',4,'gold','blau','kometenkopf','kometen','Goldkometen steigen mit, oben ein Kranz aus Kometenkronen'],
  ['kn_lavaglut200','lavaglut',4,'orange','rot','glut','glutfontaene','Glutvulkan, Lavabrocken, Tigerkometen und ein Blütenkranz'],
  ['kn_zwillingssonne200','zwillingssonne',4,'tuerkis','gold','kometenkopf','kometen','Zwei Sonnen nebeneinander, Kometen fliegen über Kreuz'],
  ['kn_weidendom300','weidendom',5,'rot','gold','weidenspur','weiden','Weidenfächer beim Abschuss, oben eine Goldweide mit zwölf Vorhängen'],
  ['kn_blitzkoenig300','blitzkoenig',5,'silber','gold','dunkel','blitzfontaene','Blitzfontäne, dunkler Aufstieg, eine Weide voller Blitze'],
  ['kn_finalfuerst300','finalfuerst',5,'rot','gold','titanspur','mix','Fontäne, Römische Lichter und Knalle – oben alles in vier Stufen']
];
WOW_KUGELN.forEach(([id,eff,kal,A,B,steig,abschuss,txt])=>{
  KUGEL[id]=Object.assign({kal,th:'silber',haupt:eff,A,B,steig,abschuss,bruchOpt:{kern:false,nachglitzer:false,flash:0.8},stufen:[]},KAL_WERTE[kal]);
  SIGNATUR[id]={eff,text:txt}; });

/* =========================================================
   Kugelbomben aus dem, was gefallen hat.
   02.10.: zehn intensive Muster-Kugeln zum Testen.
   03.10. (Tom): "Kugel 200 Kronenkranz finde ich gut, Zwillingssonne
   auch gut, den Rest kannst du rausnehmen ... Bodenfontaenen mit Kugeln
   machen keinen Sinn - eine grosse Fontaene oder zwei, drei, die hoch-
   schiessen, ist okay ... gib mir fuenf neue, du weisst, was ich mag".
   Beide und fuenf neue kommen direkt ins Sortiment:
   Farbcrossette 150, Blitzpalme 200, Goldweidenkreuz 200, Kronenregen
   300, Dreifachkrone 300 - gebaut aus Farbcrossette, Blitzpalme,
   Weidencrossette, Farbkrone, Goldregen und Dreifachtor. Kein Krachen,
   ein Plopp beim Bruch, dann einfach nur schoen.
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
  /* eine breite Goldfontaene, die hoch aus dem Moerser steigt */
  goldfontaene(o,A,B,k){ lBreit(o,A,B,0.9+0.15*k,{},{D:2.8+0.35*k,H:9.5,weit:0.5,n:30,md:4,c:(u,j)=>j%6?GOLDF:kgMal(A,1.3)}); },
  /* zwei Goldkometen steigen links und rechts mit der Kugel auf */
  kometen(o,A,B,k){ LICHTYP.goldkomet(o,A,B,1.2,{ang:-0.2,dir:FANDIR}); kgSpaeter(0.15,()=>LICHTYP.goldkomet(o,A,B,1.2,{ang:0.2,dir:FANDIR})); },
  /* drei Farbkometen im Faecher: A links, Gold in der Mitte, B rechts */
  farbkometen(o,A,B,k){ [[-0.22,A],[0,FW.gold],[0.22,B]].forEach(([a,c],i)=>kgSpaeter(i*0.12,()=>LICHTYP.farbkomet(o,c,B,1.2,{ang:a,dir:FANDIR}))); }
};
/* dunkler Aufstieg (Blitzweide): nur ein schwaches Glimmen */
STEIG_ART.dunkel={spur(r,dt,ort){ for(let n=jeSek(r,'a',18,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.1,.1),rand(-.4,0),rand(-.1,.1),.45,.22,.1,rand(0.3,0.5),1,0); } }};

/* ---------- Bruchbilder ---------- */
/* Kronenkranz (200): ein Ring Goldkometen, an jedem Ende haengt eine
   Glitzerkrone (Kometenkrone); in der Mitte eine Kugel B, die zu A wechselt */
EFF.kronenkranz=function(p,A,B,s){ const G=2.4, T=1.5;
  nRing(p,Math.round(4*KQ(s))+8,9*s,v=>{ nKomet(p,v,kgMal(A,1.6),T,G,[1,.74,.32],110);
    kgSpaeter(T,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T); wKrone(e,i=>i%3?[1.6,1.2,.55]:kgMal(B,1.8),s*1.6,Math.round(30*QUAL())+10,3.4); flash(e,[1,.85,.5],1.5,0.2); }); },0.35);
  nKugel(Math.round(40*KQ(s)),5.5*s,v=>{ const h=kgStern(psBig,p,v,kgMal(B,1.5),2.4,2.2,0,0.1); nFolge(h,[kgMal(A,1.6)],[1.1]); });
  kgSpaeter(T,()=>schall(p,x=>sfx.rieseln(x*0.8,3.5)));
  schall(p,x=>{ sfx.boom(x*1.2); sfx.zischen(x*0.4,1.5); }); };
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
/* Farbcrossette (150): ein Ring Farbcrossetten zum Zuschauer, jeder
   Arm wechselt im Flug die Farbe; innen eine zweite Welle in den
   getauschten Farben */
EFF.farbcrossette=function(p,A,B,s){
  nRing(p,Math.round(6*KQ(s))+8,8*s,v=>wFarbCross(p,v,2.6,0.75,kgMal(A,1.4),kgMal(B,1.6),s*0.8),0.35);
  kgSpaeter(0.5,()=>{ nKugel(Math.round(6*KQ(s))+6,5*s,v=>wFarbCross(p,v,2.6,0.6,kgMal(B,1.4),kgMal(A,1.6),s*0.6)); });
  schall(p,x=>{ sfx.plopp(x*0.7,0.7); later(0.75,()=>sfx.crackle(x*0.35)); }); };
/* Blitzpalme (200): dunkler Aufstieg, zehn schwere Goldwedel sinken wie
   eine Palme, an ihren Enden zerstieben Blitze in B; in der Mitte
   oeffnet sich eine kleine Farbkrone A */
EFF.blitzpalme=function(p,A,B,s){ const z=s*0.55;
  lPalme(p,z,{n:10,w:8.5,hoch:3.4,L:3.2,G:2.8,rate:70,kopf:()=>[1.5,1.05,.45],schweif:()=>GOLDF,ende:(q,k)=>kgSpaeter(k*0.05,()=>lZerstieb(q,k%2?[1.9,1.9,2]:kgMal(B,1.9),6,2.0))});
  wKrone(p,i=>i%3?kgMal(A,1.5):[1.5,1.15,.5],z*1.2,Math.round(26*QUAL())+8,2.8);
  schall(p,x=>{ sfx.plopp(x*0.9,0.75); later(2.4,()=>sfx.crackle(x*0.45)); }); };
/* Goldweidenkreuz (200): ein Kranz aus acht Crossetten - jede teilt sich
   in vier Goldweiden, die lange herabsinken; innen ein Farbkern A */
EFF.goldweidenkreuz=function(p,A,B,s){ const G=2.6, t=0.8;
  nKranz(8,8*s,v=>{ nKomet(p,v,kgMal(A,1.4),t,G,[1,.8,.42],40);
    kgSpaeter(t,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,t), w=bahnTempo(v,G,t), a0=rand(0,Math.PI*2);
      for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=4.2*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.3,1.2+w[1]*0.3,Math.sin(a)*sp+w[2]*0.3], L=3.6;
        kgStern(psBig,e,dv,[1.3,.85,.4],L,1.6,0,0.45); rkFunken(e,dv,1.6,0.05,L,30,kgMal(B,0.95),{ps:psMid,life:[1.8,2.8],g:0.75,streu:0.12,mit:0.03,mode:0,spur:0.25}); }
      psHuge.emit(e.x,e.y,e.z,0,0,0,1.3,1.2,1,0.05,0,0); }); },0.15);
  nKugel(Math.round(20*KQ(s)),3*s,v=>kgStern(psBig,p,v,kgMal(A,1.4),1.8,2.2,0,0.1));
  schall(p,x=>{ sfx.plopp(x*0.85,0.8); later(0.8,()=>sfx.crack(x*0.4)); later(1.3,()=>sfx.rieseln(x*0.7,4.5)); }); };
/* Kronenregen (300): eine grosse Krone aus Farbsternen haengt waagerecht
   und blinkt leise, dann rieselt aus ihr ein langer goldener Regen */
EFF.kronenregen=function(p,A,B,s){
  const hs=[]; nKranz(Math.round(18*KQ(s))+16,6.5*s,(v,i)=>{ hs.push([kgStern(psBig,p,[v[0],v[1]+1.6,v[2]],kgMal(i%2?A:B,1.45),3.0,1.4,0,0.25),v]); },0.2);
  kgSpaeter(1.2,()=>{ hs.forEach(([h,v])=>{ if(!kgLebt(h)) return; const [q,w]=kgOrt(h); kgStern(psBig,q,[w[0]*0.4,w[1]*0.3,w[2]*0.4],[1.25,.85,.38],rand(3.6,4.4),0.9,4,0.9); }); schall(p,x=>sfx.rieseln(x*0.75,5)); });
  nKugel(Math.round(30*KQ(s)),2.4*s,v=>kgStern(psBig,p,v,[1.35,1.0,.45],rand(2.6,3.2),1.6,4,0.3));
  schall(p,x=>sfx.plopp(x*0.9,0.7)); };
/* Dreifachkrone (300): drei Farbkronen nebeneinander, links A, in der
   Mitte hoeher Gold, rechts B - kurz nacheinander, wie ein Tor am Himmel */
EFF.dreifachkrone=function(p,A,B,s){ const [u]=basisBlick(p,0.2), d=4.2*s;
  [[-1,A,0],[0,FW.gold,0.3],[1,B,0.6]].forEach(([sd,c,t])=>kgSpaeter(t,()=>{ const e={x:p.x+u[0]*d*sd,y:p.y+(sd?0:2.5),z:p.z+u[2]*d*sd};
    for(let i=0;i<Math.round(40*QUAL())+10;i++){ const a=rand(0,Math.PI*2), w=rand(3,5.2)*Math.sqrt(s); kgStern(psBig,e,[Math.cos(a)*w,rand(0.2,1.8),Math.sin(a)*w],i%4?kgMal(c,1.45):[1.5,1.15,.5],rand(3.0,3.6),1.5,i%4?0:4,0.35); }
    flash(e,c,1.6,0.2); schall(e,x=>{ sfx.plopp(x*0.7,0.8); later(0.3,()=>sfx.rieseln(x*0.5,3)); }); })); };

/* Crossettenweide (300, 03.10., Tom: "aus den Raketen, die gut sind,
   eine Kugelbombe, die nochmal extremer ist"): ein Faecher aus Kometen
   steigt mit (Abschuss), oben zerspringen sechzehn Crossetten im Kranz,
   jeder Arm wechselt die Farbe und sinkt dann als Goldweide - darunter
   oeffnet sich noch einmal ein Kometenfaecher. Kein Knall. */
EFF.crossettenweide=function(p,A,B,s){ const G=2.4;
  nKranz(16,9.5*s,v=>{ nKomet(p,v,kgMal(A,1.6),0.8,G,[1,.8,.42],80);
    kgSpaeter(0.8,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,0.8), w=bahnTempo(v,G,0.8), a0=rand(0,Math.PI*2);
      for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=5*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.3,1.4+w[1]*0.3,Math.sin(a)*sp+w[2]*0.3], L=4.2;
        const h=kgStern(psHuge,e,dv,kgMal(A,1.6),L,1.3,0,0.4); kgSpaeter(0.6,()=>kgFarbe(h,kgMal(B,1.6)));
        rkFunken(e,dv,1.3,0.05,L,26,[.95,.55,.2],{ps:psMid,life:[1.8,2.8],g:0.7,streu:0.1,mit:0.02,mode:0,spur:0.25}); }
      psHuge.emit(e.x,e.y,e.z,0,0,0,1.3,1.2,1,0.06,0,0); }); },0.1);
  kgSpaeter(0.5,()=>{ const q={x:p.x,y:p.y-3,z:p.z}; for(let k=0;k<13;k++){ const a=-1.2+k*0.2, d=[Math.sin(a),Math.cos(a)*0.9+0.2,rand(-0.15,0.15)], l=Math.hypot(...d);
    nKomet(q,kgMal(d,9*s*0.5/l),kgMal(k%2?A:B,1.5),1.8,2.4,[1,.78,.38],45); } });
  schall(p,x=>{ sfx.plopp(x*1.0,0.65); later(0.8,()=>{ sfx.crack(x*0.8); later(0.1,()=>sfx.crack(x*0.6)); later(0.25,()=>sfx.crackle(x*0.5)); }); later(1.5,()=>sfx.rieseln(x*0.8,5.5)); }); };
const WOW=['crossettenweide','kronenkranz','zwillingssonne','farbcrossette','blitzpalme','goldweidenkreuz','kronenregen','dreifachkrone'];
WOW.forEach(n=>{ const f=EFF[n]; EFF[n]=function(){ const alt=STERN_LEBEN; STERN_LEBEN=1.5; try{ return f.apply(this,arguments); } finally{ STERN_LEBEN=alt; } }; });
Object.assign(EFF_FAMILIE,{crossettenweide:'haenger',kronenkranz:'komet',zwillingssonne:'komet',farbcrossette:'komet',blitzpalme:'haenger',goldweidenkreuz:'haenger',kronenregen:'haenger',dreifachkrone:'glitzer'});
/* Produkte (02e): id, Bruch, Kaliber, Farben, Aufstieg, Abschuss, Text */
const WOW_KUGELN=[
  ['farbcrossette150','farbcrossette',3,'rot','tuerkis','kometenkopf',null,'Ein Ring Farbcrossetten, jeder Arm wechselt im Flug die Farbe'],
  ['kronenkranz200','kronenkranz',4,'gold','blau','kometenkopf','kometen','Goldkometen steigen mit, oben ein Kranz aus Kometenkronen'],
  ['zwillingssonne200','zwillingssonne',4,'tuerkis','gold','kometenkopf','kometen','Zwei Sonnen nebeneinander, Kometen fliegen über Kreuz'],
  ['blitzpalme200','blitzpalme',4,'magenta','weiss','dunkel',null,'Dunkler Aufstieg, eine riesige Goldpalme, an den Enden blitzt es'],
  ['goldweidenkreuz200','goldweidenkreuz',4,'gruen','gold','kometenkopf','farbkometen','Acht Crossetten im Kranz, jede sinkt als Goldweide'],
  ['kronenregen300','kronenregen',5,'violett','rose','kometenkopf','goldfontaene','Eine Krone aus Farbsternen, aus der ein goldener Regen rieselt'],
  ['dreifachkrone300','dreifachkrone',5,'rot','blau','kometenkopf','farbkometen','Drei Kronen nebeneinander - Farbe, Gold, Farbe'],
  ['crossettenweide300','crossettenweide',5,'rot','gold','kometenkopf','kometen','Sechzehn Crossetten, die als Goldweide sinken, darunter ein Kometenfächer']
];
WOW_KUGELN.forEach(([id,eff,kal,A,B,steig,abschuss,txt])=>{
  KUGEL[id]=Object.assign({kal,th:'silber',haupt:eff,A,B,steig,abschuss:abschuss||undefined,bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},KAL_WERTE[kal]);
  SIGNATUR[id]={eff,text:txt}; });

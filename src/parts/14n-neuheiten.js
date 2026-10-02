/* =========================================================
   Neuheiten Kugeln und Raketen (01.10., Tom): "orientiere dich an den
   Effekten, die ich gut fand ... die Kugelbombe wird eine Explosion, aber
   daraus entsteht ein Feuerwerk aus den verschiedenen Effekten -
   realistisch, gross, ein Wow-Moment. Raketen eher schoen, muessen nicht
   laut sein." Vorbilder: Goldkomet, Geisterkomet, Crossette, Weide,
   Kometenfaecher, Wetterleuchten, Glitzer- und Bluetenmine, Wasserfall,
   Tigerschweif, Kiefernkrone, Lavaregen, Sternspritzer, Roemische Lichter.
   Gleiche Bausteine fuer beide: s ist bei Raketen 1-2,5, bei Kugeln
   2-5 (Kaliber) - die Sterngeschwindigkeit waechst mit s.
   ========================================================= */
/* Bausteine */
function nKopf(p,v,c,T,G,mode,spur){ kgStern(psHuge,p,v,c,T,G,mode||0,spur||0); return kgStern(psBig,p,v,[1.5,1.45,1.35],T*0.9,G,mode||0,0); }
function nKomet(p,v,c,T,G,tail,rate,o){ const h=kgStern(psHuge,p,v,c,T,G,0,0.3); kgStern(psBig,p,v,[1.5,1.45,1.35],T*0.9,G,0,0);
  rkFunken(p,v,G,0.04,T,rate||40,tail||[1,.75,.32],Object.assign({ps:psMid,life:[0.5,0.9],g:2,streu:0.2,mit:0.08,mode:4},o||{})); return h; }
/* Roemische-Licht-Kugel: runde Leuchtkugel ohne Strich, zarter Glitzerhauch */
function nPerle(p,v,c,T,G){ const h=kgStern(psHuge,p,v,c,T,G,0,0.03); kgStern(psHuge,p,v,kgMal(c,0.6),T*0.95,G,0,0.03);
  rkFunken(p,v,G,0.05,T,10,kgMal(c,0.8),{ps:psMid,life:[0.3,0.5],g:1.5,streu:0.15,mit:0.1,mode:4}); return h; }
/* Verteilungen: Kugel, Ring zum Zuschauer gekippt, waagerechter Kranz */
function nKugel(n,w,fn){ for(let i=0;i<n;i++){ const d=randDir(); fn(kgMal(d,w*rand(0.92,1.04)),i,d); } }
function nRing(p,n,w,fn,kipp){ const [u,v]=basisBlick(p,kipp===undefined?0.45:kipp), a0=rand(0,Math.PI*2);
  for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a), d=[u[0]*ca+v[0]*sa,u[1]*ca+v[1]*sa,u[2]*ca+v[2]*sa]; fn(kgMal(d,w*rand(0.97,1.03)),i,d); } }
function nKranz(n,w,fn,el){ const a0=rand(0,Math.PI*2); for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, e=(el||0)+rand(-0.05,0.05), d=[Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e)]; fn(kgMal(d,w*rand(0.97,1.03)),i,d); } }
function nFolge(h,farben,zeiten){ zeiten.forEach((t,k)=>kgSpaeter(t,()=>kgFarbe(h,farben[k]))); }
/* Crossette im Bruch: Stern, der nach t in vier Kometen zerspringt */
function nCross(p,v,G,t,cA,cB,s){ nKomet(p,v,cA,t,G,[1,.8,.42],50);
  kgSpaeter(t,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,t), w=bahnTempo(v,G,t), a0=rand(0,Math.PI*2);
    for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=5.5*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.3,1+w[1]*0.3,Math.sin(a)*sp+w[2]*0.3]; nKomet(e,dv,cB,1.2,3.2,[1,.8,.42],30); }
    psHuge.emit(e.x,e.y,e.z,0,0,0,1.3,1.2,1,0.05,0,0); }); }
/* Vorhang: Funken fallen ohne Eigenbewegung aus der Bahn (Wasserfall) */
function nVorhang(p,v,G,T,c,rate,md){ rkFunken(p,v,G,0.1,T,rate||40,c,{ps:psMid,life:[1.4,2.2],g:2.4,streu:0.05,mit:0,mode:md||0}); }

/* ---------------- Raketenbrueche (eher schoen als laut) ---------------- */
EFF.kometenstern=function(p,A,B,s){ nKugel(Math.round(9*QUAL()+3),9*s,(v,i)=>nKomet(p,v,i%3?kgMal(A,1.5):[1.6,1.5,1.2],rand(1.6,1.9),2.6,[1,.74,.32],55)); schall(p,v=>sfx.rieseln(v*0.5,2.5)); };
EFF.geisterkrone=function(p,A,B,s){ const dunkel=[0.03,0.03,0.03];
  nRing(p,Math.round(36*QUAL()),9*s,v=>{ const h=nKopf(p,v,kgMal(A,1.5),2.4,2,0,0.25); const h2=kgStern(psHuge,p,v,kgMal(A,1.5),2.4,2,0,0.25); nFolge(h2,[dunkel,kgMal(B,1.6)],[0.9,1.05]); });
  schall(p,v=>sfx.plopp(v*0.6,1.2)); };
EFF.crossettenstern=function(p,A,B,s){ nKugel(6,8*s,v=>nCross(p,v,3,0.65,kgMal(A,1.4),kgMal(B,1.5),s)); schall(p,v=>{ sfx.plopp(v*0.5,1); later(0.65,()=>sfx.crack(v*0.6)); }); };
EFF.weidenregen=function(p,A,B,s){ nKugel(Math.round(60*s*QUAL()),8.5*s,v=>{ kgStern(psBig,p,v,[1.1,.7,.28],rand(3.6,4.4),1.1,0,0.9); });
  schall(p,v=>later(0.5,()=>sfx.rieseln(v*0.6,4))); };
EFF.faecherstern=function(p,A,B,s){ for(let k=0;k<13;k++){ const a=-1.2+k*0.2, d=[Math.sin(a),Math.cos(a)*0.9+0.2,rand(-0.15,0.15)], l=Math.hypot(...d);
    nKomet(p,kgMal(d,11*s/l),kgMal(k%2?A:B,1.5),1.9,2.4,[1,.78,.38],50); } schall(p,v=>sfx.zischen(v*0.4,1.5)); };
EFF.wetterwolke=function(p,A,B,s){ for(let i=0;i<Math.round(30*QUAL());i++){ const d=randDir(), w=rand(1.5,3)*s; kgStern(psBig,p,kgMal(d,w),[.5,.5,.6],rand(0.4,0.7),0.5,0,0); }
  const t=lGewitter(p,A,s*0.8,null); schall(p,v=>later(t*0.6,()=>sfx.donner(v*0.2,true))); };
EFF.glitzerbukett=function(p,A,B,s){ for(let i=0;i<Math.round(70*s*QUAL());i++){ const d=randDir(); d[1]=Math.abs(d[1])*0.8+0.3; const l=Math.hypot(...d), w=rand(6,9)*s/l;
    kgStern(psBig,p,kgMal(d,w),i%6?[1.4,1.4,1.45]:kgMal(A,1.5),rand(2.0,2.6),3,4,0.15); } schall(p,v=>sfx.rieseln(v*0.6,3)); };
EFF.bluetenstern=function(p,A,B,s){ nKugel(Math.round(50*s*QUAL()),8.8*s,v=>{ const h=kgStern(psBig,p,v,kgMal(A,1.5),2.4,2.2,0,0.08); nFolge(h,[kgMal(B,1.55),[1.6,1.6,1.65]],[0.9,1.7]); }); schall(p,v=>sfx.plopp(v*0.5,1.1)); };
EFF.wasserring=function(p,A,B,s){ nKranz(Math.round(18*QUAL()),8*s,v=>{ kgStern(psHuge,p,v,[1.5,1.5,1.55],2.6,1.6,0,0.2); nVorhang(p,v,1.6,2.6,[1.25,1.25,1.3],38); });
  schall(p,v=>later(0.3,()=>sfx.regen(v*0.6,3))); };
EFF.blitzweide=function(p,A,B,s){ nKugel(Math.round(28*QUAL()),8*s,v=>{ kgStern(psHuge,p,v,[1.9,1.9,1.95],3.2,1.3,1,0); rkFunken(p,v,1.3,0.2,3.2,22,[1.6,1.6,1.7],{ps:psMid,life:[0.9,1.5],g:0.9,streu:0.1,mit:0.02,mode:1}); });
  schall(p,v=>later(0.4,()=>sfx.rieseln(v*0.5,3.5))); };
EFF.tigerstern=function(p,A,B,s){ nKugel(Math.round(10*QUAL())+2,10*s,v=>{ kgStern(psHuge,p,v,kgMal(A,1.4),1.8,3,0,0.25); rkFunken(p,v,3,0.03,1.8,70,mischF(A,[1,.8,.4],0.5),{ps:psMid,life:[0.9,1.5],g:1.1,streu:0.5,mit:0.06,mode:4}); });
  schall(p,v=>{ sfx.boom(v*0.4); sfx.fauchen(v*0.35,1.6); }); };
EFF.kiefernstern=function(p,A,B,s){ nKugel(Math.round(40*s*QUAL()),10*s,v=>verzweig(psBig,p.x,p.y,p.z,v[0],v[1],v[2],kgMal(A,1.35),1.9,2.2,{tz:rand(1.15,1.35),n:[3,5],tiefe:2,streu:1.1,spur:0.3,minTempo:2.5,C:kgMal(B,1.5),ps2:psMid}));
  schall(p,v=>later(1.25,()=>{ sfx.crackle(v*0.6); later(0.12,()=>sfx.crackle(v*0.4)); })); };
EFF.lavastern=function(p,A,B,s){ nKugel(Math.round(26*QUAL()),7.5*s,v=>{ const h=kgStern(psHuge,p,v,[1.7,1.4,.7],2.6,4.5,0,0.2); nFolge(h,[[1.4,.6,.12],[.9,.15,.04]],[0.5,1.3]);
    rkFunken(p,v,4.5,0.3,2.6,14,[.8,.22,.05],{ps:psMid,life:[0.7,1.2],g:1.2,streu:0.15,mit:0.02,mode:0}); }); schall(p,v=>sfx.wumms(v*0.7)); };
EFF.spritzkrone=function(p,A,B,s){ nKugel(Math.round(30*s*QUAL()),9.5*s,v=>{ kgStern(psBig,p,v,kgMal(A,1.6),2.2,2.4,0,0.1); rkFunken(p,v,2.4,0.05,2.2,24,[1.5,1.4,1.2],{ps:psMid,life:[0.18,0.38],g:1,streu:2.2,mit:0.2,mode:4}); });
  schall(p,v=>{ sfx.zischen(v*0.4,2.2); for(let i=0;i<3;i++) later(0.3+i*0.5,()=>sfx.prasseln(v*0.5)); }); };
EFF.perlenring=function(p,A,B,s){ nRing(p,Math.round(24*QUAL()),8.5*s,(v,i)=>nPerle(p,v,kgMal(i%2?A:B,1.6),2.4,2.2)); schall(p,v=>sfx.plopp(v*0.6,1)); };
EFF.zwillingsring=function(p,A,B,s){ nRing(p,Math.round(28*QUAL()),9*s,v=>kgStern(psBig,p,v,kgMal(A,1.5),2.2,2.2,0,0.15),0.45); nRing(p,Math.round(28*QUAL()),9*s,v=>kgStern(psBig,p,v,kgMal(B,1.5),2.2,2.2,0,0.15),-0.6);
  schall(p,v=>sfx.boom(v*0.4)); };
EFF.goldkaskade=function(p,A,B,s){ [0,0.6,1.2].forEach((t,k)=>kgSpaeter(t,()=>{ const e={x:p.x,y:p.y-k*3*s,z:p.z};
    nKugel(Math.round(26*s*QUAL()),(7-k*1.5)*s,v=>kgStern(psBig,e,v,[1.15,.75,.3],rand(2.4,3.0),1.4,4,0.6)); schall(e,v=>sfx.plopp(v*0.4,1+k*0.2)); })); };
EFF.farbglitzerregen=function(p,A,B,s){ const F=SPEKTRUM.map(n=>kgMal(K(n),1.4)); nKugel(Math.round(60*s*QUAL()),8*s,(v,i)=>{ kgStern(psBig,p,v,F[i%F.length],rand(2.8,3.4),1.8,4,0.35); }); schall(p,v=>sfx.rieseln(v*0.55,3.5)); };
EFF.mondtau=function(p,A,B,s){ nKugel(Math.round(34*s*QUAL()),6.5*s,v=>{ kgStern(psBig,p,v,[1.35,1.4,1.5],3.4,0.9,0,0.4); rkFunken(p,v,0.9,0.6,3.4,5,[1.7,1.7,1.8],{ps:psMid,life:[0.8,1.2],g:1.5,streu:0.1,mit:0,mode:1}); });
  schall(p,v=>sfx.rieseln(v*0.4,4)); };
EFF.sternenkrone=function(p,A,B,s){ nKugel(Math.round(44*s*QUAL()),9.5*s,v=>kgStern(psBig,p,v,[1.6,1.6,1.65],2.0,2.4,0,0.25));
  nKugel(Math.round(22*QUAL()),3.2*s,v=>kgStern(psBig,p,v,[1.3,.95,.4],1.6,2,4,0.05)); schall(p,v=>sfx.boom(v*0.35)); };

/* Dichte der Kugelbruche: echte Kugeln tragen viele Sterne, und je
   groesser das Kaliber, desto voller der Bruch (75 mm x2.3 ... 300 mm x3.6) */
function KQ(s){ return QUAL()*(1.2+0.5*s); }
/* ---------------- Kugelbomben: Bruch, aus dem ein Feuerwerk entsteht ---------------- */
EFF.crossettennetz=function(p,A,B,s){ nKugel(Math.round(10*KQ(s))+2,7.5*s,v=>nCross(p,v,2.8,0.75,kgMal(A,1.4),kgMal(B,1.5),s*0.7)); schall(p,v=>{ sfx.boom(v*0.8); later(0.75,()=>{ sfx.crack(v*0.8); later(0.08,()=>sfx.crack(v*0.6)); }); }); };
EFF.tigerkrone=function(p,A,B,s){ nKugel(Math.round(14*KQ(s))+2,9.5*s,v=>{ kgStern(psHuge,p,v,kgMal(A,1.4),2.2,3,0,0.25); kgStern(psHuge,p,v,kgMal(A,1.4),2.2,3,0,0.15);
    rkFunken(p,v,3,0.03,2.2,36,mischF(A,[1,.8,.4],0.5),{ps:psMid,life:[1.0,1.7],g:1.1,streu:0.5,mit:0.06,mode:4}); }); schall(p,v=>{ sfx.boom(v*0.9); sfx.fauchen(v*0.4,2); }); };
EFF.weidenkoenig=function(p,A,B,s){ nKugel(Math.round(70*KQ(s)),8.5*s,(v,i)=>{ const h=kgStern(psBig,p,v,i%5?[1.1,.72,.28]:kgMal(A,1.6),rand(4.0,4.8),1.0,i%5?4:0,0.9); }); schall(p,v=>{ sfx.boom(v*1.0); later(0.8,()=>sfx.rieseln(v*0.7,5)); }); };
EFF.sternensturm=function(p,A,B,s){ nKugel(Math.round(12*KQ(s))+2,8*s,v=>nCross(p,v,2.6,0.7,kgMal(A,1.4),kgMal(B,1.5),s*0.7));
  nKugel(Math.round(30*KQ(s)),6*s,v=>{ kgStern(psHuge,p,v,[1.9,1.9,1.95],3.0,1.2,1,0); });
  kgSpaeter(2.6,()=>{ for(let i=0;i<Math.round(150*KQ(s));i++){ const d=randDir(), w=Math.cbrt(Math.random())*rand(8,14)*s*0.5; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1.7,1.7,1.65,rand(0.06,0.2),0,4); }
    for(let i=0;i<4;i++) psHuge.emit(p.x,p.y,p.z,0,0,0,2,2,1.9,0.12,0,0); flash(p,[1,1,1],6,0.4); schall(p,v=>{ sfx.boom(v*1.4); sfx.crack(v*1.2); }); });
  schall(p,v=>{ sfx.boom(v*1.0); later(0.7,()=>sfx.crack(v*0.8)); }); };
/* Alle neuen Raketen: Hauptsterne brennen 25 % laenger */
['kometenstern','geisterkrone','crossettenstern','weidenregen','faecherstern','wetterwolke','glitzerbukett','bluetenstern','wasserring','blitzweide','tigerstern','kiefernstern','lavastern','spritzkrone','perlenring','zwillingsring','goldkaskade','farbglitzerregen','mondtau','sternenkrone'].forEach(n=>{ const f=EFF[n]; EFF[n]=function(){ const alt=STERN_LEBEN; STERN_LEBEN=1.25; try{ return f.apply(this,arguments); } finally{ STERN_LEBEN=alt; } }; });
/* Alle neuen Kugeln: Hauptsterne brennen 35 % laenger */
['crossettennetz','tigerkrone','weidenkoenig','sternensturm'].forEach(n=>{ const f=EFF[n]; EFF[n]=function(){ const alt=STERN_LEBEN; STERN_LEBEN=1.35; try{ return f.apply(this,arguments); } finally{ STERN_LEBEN=alt; } }; });
Object.assign(EFF_FAMILIE,{kometenstern:'komet',geisterkrone:'kugel',crossettenstern:'komet',weidenregen:'haenger',faecherstern:'komet',wetterwolke:'figur',glitzerbukett:'glitzer',bluetenstern:'kugel',wasserring:'haenger',blitzweide:'glitzer',
  tigerstern:'komet',kiefernstern:'knister',lavastern:'flamme',spritzkrone:'glitzer',perlenring:'kugel',zwillingsring:'kugel',goldkaskade:'haenger',farbglitzerregen:'glitzer',mondtau:'haenger',sternenkrone:'kugel',
  crossettennetz:'komet',tigerkrone:'komet',weidenkoenig:'haenger',sternensturm:'knall'});

/* ---------------- Neue Aufstiege fuer die Raketen ---------------- */
Object.assign(STEIG_ART,{
  /* Kometenkopf: dicker Goldglitzerschweif wie der Goldkomet */
  kometenkopf:{spur(r,dt,ort){ for(let n=jeSek(r,'a',150,dt);n>0;n--){ const q=ort(); (n%3?psMid:psBig).emit(q[0],q[1],q[2],rand(-.4,.4),rand(-1.5,0),rand(-.4,.4),1,.74,.32,rand(0.6,1.0),2.4,4); } }},
  /* Geisterspur: weicher Farbschweif, wechselt nach der halben Steigzeit A -> B */
  geisterspur:{spur(r,dt,ort){ const c=r.alter<r.fuse0*0.5?r.A:r.B; for(let n=jeSek(r,'a',90,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.15,.15),rand(-.6,0),rand(-.15,.15),c[0],c[1],c[2],rand(0.35,0.55),1.5,0); } }},
  /* Weidenspur: Goldfunken, die lange stehen und langsam sinken */
  weidenspur:{spur(r,dt,ort){ for(let n=jeSek(r,'a',80,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.05,.05),rand(-.3,0),rand(-.05,.05),.95,.55,.2,rand(1.8,2.6),0.7,0); } }},
  /* Glitzerspur: Silberglitzer, breit gestreut */
  glitzerspur:{spur(r,dt,ort){ for(let n=jeSek(r,'a',120,dt);n>0;n--){ const q=ort(); psBig.emit(q[0],q[1],q[2],rand(-.7,.7),rand(-1.5,0),rand(-.7,.7),1.3,1.3,1.35,rand(0.6,1.0),2.5,4); } }},
  /* Blitzspur: weisse Blinkfunken entlang der Bahn */
  blitzspur:{spur(r,dt,ort){ for(let n=jeSek(r,'a',70,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.2,.2),rand(-.8,0),rand(-.2,.2),1.7,1.7,1.75,rand(0.8,1.3),1,1); } }}
});

/* ---------------- Die 20 Raketen und 20 Kugeln (Produkte in 02e) ---------------- */
const NEU_RAKETEN=[
  ['rn_kometenstern','kometenstern','kometenkopf','gold','weiss',1.0,'Neun Goldkometen mit Glitzerschweif als Stern'],
  ['rn_geisterkrone','geisterkrone','geisterspur','magenta','tuerkis',1.05,'Ring, der kurz erlischt und in neuer Farbe weiterbrennt'],
  ['rn_crossettenstern','crossettenstern','zickzack','gold','rot',1.1,'Sechs Crossetten zerspringen zu vierundzwanzig Kometen'],
  ['rn_weidenregen','weidenregen','weidenspur','gold','bernstein',1.1,'Goldene Trauerweide, die lange hängt'],
  ['rn_faecherstern','faecherstern','stamm','gold','gruen',1.15,'Neun Kometen als Fächer nach oben'],
  ['rn_wetterwolke','wetterwolke','glasklang','violett','weiss',1.2,'Kein Knall – oben leuchtet eine Gewitterwolke auf'],
  ['rn_glitzerbukett','glitzerbukett','glitzerspur','silber','himmel',1.2,'Ein Strauß Silberglitzer, der nach oben aufblüht'],
  ['rn_bluetenstern','bluetenstern','farbspur','rot','blau',1.25,'Blüte in drei Farben nacheinander'],
  ['rn_wasserring','wasserring','perlenschnur','silber','weiss',1.3,'Waagerechter Ring, aus dem silberne Vorhänge fallen'],
  ['rn_blitzweide','blitzweide','blitzspur','weiss','silber',1.3,'Weide aus weiß blitzenden Fäden'],
  ['rn_tigerstern','tigerstern','drachenschweif','orange','gold',1.35,'Tigerkometen mit breitem Goldband'],
  ['rn_kiefernstern','kiefernstern','ratter','gold','bernstein',1.4,'Goldsterne zerspringen knisternd zu Tannennadeln'],
  ['rn_lavastern','lavastern','silberdrache','orange','rot',1.45,'Glühende Tropfen kühlen im Fallen zu Dunkelrot ab'],
  ['rn_spritzkrone','spritzkrone','ticktack','gold','weiss',1.5,'Sterne, die wie Wunderkerzen sprühen'],
  ['rn_perlenring','perlenring','blasen','violett','gruen',1.55,'Ring aus runden Leuchtperlen in zwei Farben'],
  ['rn_zwillingsring','zwillingsring','schleife','blau','gold',1.6,'Zwei Ringe über Kreuz in zwei Farben'],
  ['rn_goldkaskade','goldkaskade','tonleiter','gold','zitrone',1.7,'Drei Goldbrüche übereinander, jeder kleiner'],
  ['rn_farbglitzerregen','farbglitzerregen','spektralschweif','rot','violett',1.8,'Glitzerregen in allen Farben des Regenbogens'],
  ['rn_mondtau','mondtau','wirbel','silber','himmel',1.9,'Langsame Silbersterne, von denen Tautropfen blitzen'],
  ['rn_sternenkrone','sternenkrone','dreiklang','weiss','gold',2.0,'Weiße Sternkrone mit goldenem Glitzerkern']
];
NEU_RAKETEN.forEach(([id,eff,steig,A,B,sz,txt],k)=>{
  RAKETEN_KL[id]={n:1,gap:0,sz,pw:-2+k*0.5,fuse:1.3,steig,A,B,eff:[eff],knall:k%3===0?'plopp':'rakPff',bruchOpt:{kern:false,nachglitzer:false,flash:0.35},dauer:5};
  SIGNATUR[id]={eff,text:txt}; });
/* Groesse und Steighoehe der Test-Raketen aus der Level-Leiter des
   Sortiments: jede liegt zwischen dem groessten Produkt darunter und dem
   kleinsten darueber - so faellt keine aus der Steigerung */
(function(){ const Q=t=>P[t]||NEUWARE[t], neu=new Set(NEU_RAKETEN.map(x=>x[0])),
    alt=Object.keys(RAKETEN_KL).filter(t=>!neu.has(t)&&Q(t)&&Q(t).shape==='rocketset'&&!['gravur','blanko','furzrakete','pfeifraketen'].includes(t));
  for(const id of neu){ const L=Q(id)&&Q(id).lvl; if(!L) continue;
    for(const f of ['sz','pw']){ const lo=Math.max(...alt.filter(t=>Q(t).lvl<L).map(t=>RAKETEN_KL[t][f])), hi=Math.min(...alt.filter(t=>Q(t).lvl>L).map(t=>RAKETEN_KL[t][f]));
      if(isFinite(lo)&&isFinite(hi)&&hi>=lo) RAKETEN_KL[id][f]=+((lo+hi)/2).toFixed(3); } } })();
/* 02.10. (Tom): Crossettennetz, Tigerkrone, Weidenkoenig und Sternensturm
   kommen ins Sortiment (eigene Ids ohne kn_), die anderen 16 sind raus.
   Die zehn neuen intensiven Kugeln stehen in 14p-kugeln-wow.js. */
const NEU_KUGELN=[
  ['crossettennetz150','crossettennetz',3,'gold','gruen','gold','Zwölf Crossetten zerspringen zu einem Netz'],
  ['tigerkrone150','tigerkrone',3,'orange','gold','glut','Tigerkometen mit breiten Goldbändern'],
  ['weidenkoenig200','weidenkoenig',4,'rot','gold','glut','Riesige Goldweide mit roten Spitzen'],
  ['sternensturm300','sternensturm',5,'gold','rot','titanspur','Crossetten, Blinker und ein Schlussschlag']
];
const KAL_WERTE={1:{sz:2.1,pw:2.1,fuse:1.7},2:{sz:2.75,pw:4.2,fuse:1.88},3:{sz:3.35,pw:6.1,fuse:2.02},4:{sz:3.95,pw:7.8,fuse:2.15},5:{sz:4.8,pw:10.9,fuse:2.3}};
NEU_KUGELN.forEach(([id,eff,kal,A,B,steig,txt])=>{
  KUGEL[id]=Object.assign({kal,th:'silber',haupt:eff,A,B,steig,bruchOpt:{kern:false,nachglitzer:false,flash:0.6},stufen:[]},KAL_WERTE[kal]);
  SIGNATUR[id]={eff,text:txt}; });

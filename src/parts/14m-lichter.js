/* =========================================================
   Lichter-Muster (01.10., Tom: "ganz viele verschiedene Lichtertypen -
   Fontaenen, Roemische Lichter, aber auch Blitze am Himmel ohne
   Explosion ... 20, 30, 40 Batterien, jeweils nur 2, 3 Schuss").
   Jeder Lichtertyp startet direkt aus dem Rohr (Phase licht:'name' in
   show), ohne Bombette und ohne Zerleger. Vorbilder aus den Lexika der
   Fachhaendler (pyroland, voigt-pyrotechnik, feuerwerk.info): Komet,
   Schweifkomet, Knisterkomet, Blinker, Crossette, Minen, Fontaenen,
   Wasserfall. Nach Toms Auswahl (01.10.) geblieben: Goldkomet, Geister-
   komet, Crossette, Weidenkomet, Kometenfaecher, Wetterleuchten,
   Glitzer- und Bluetenmine, Wasserfall - dazu Runde 3 unten.
   Signatur: LICHTYP[name](o, A, B, s, opt) - o Rohr, A/B Farben, s Groesse,
   opt.ang/opt.dir Rohrneigung (wie perleSchuss).
   ========================================================= */
const LICHTYP={};
/* Muendung: oben an der Rohroeffnung (ab der Station), wie perleSchuss */
function lMund(o){ return {x:o.x,y:(o.y!==undefined?o.y:0.4)+(o.ab!==undefined?o.ab:0.3),z:o.z}; }
function lRicht(opt){ const a=opt.ang||0, d=opt.dir===undefined?FANDIR:opt.dir; return [Math.sin(d)*Math.sin(a),Math.cos(a),Math.cos(d)*Math.sin(a)]; }
/* Abschuss auf Hoehe H (m) bei Schwere G, entlang der Rohrneigung */
function lAbschuss(H,G,opt,streu){ const v0=vFuerHoehe(H,G), r=lRicht(opt), e=streu||0;
  return [r[0]*v0+rand(-e,e),r[1]*v0,r[2]*v0+rand(-e,e)]; }
function lScheitel(vy,G){ return Math.log(1+ZIEH*Math.max(0.1,vy)/G)/ZIEH; }
/* fortlaufender Ausstoss (Fontaene, Rad): fn(t) je Bild bis dauer */
function lLaufend(dauer,fn,spur){ for(let t=0;t<dauer;t+=1/30){ const tt=t; kgSpaeter(tt,()=>{ const a=SCHWEIF; SCHWEIF=spur===undefined?0.06:spur; try{ fn(tt); } finally { SCHWEIF=a; } }); } }
function lStart(m,k,laut){ muendungsblitz(m,m.y,k||1); if(laut) sfx.thump(distVol(m)*laut); }
/* Seitenachse der Batterie (quer zum Zuschauer) */
function lQuer(opt){ const d=opt.dir===undefined?FANDIR:opt.dir; return [Math.sin(d),0,Math.cos(d)]; }
/* Kopf eines Kometen: zwei Leuchtsterne und ein heller Kern - aus 15 m
   Abstand sonst nur ein Punkt (01.10., Sichtpruefung) */
function lKopf(m,v,c,T,G,mode,spur){
  kgStern(psHuge,m,v,kgMal(c,1.25),T,G,mode||0,spur||0); kgStern(psHuge,m,v,kgMal(c,1.25),T,G,mode||0,(spur||0)*0.6);
  kgStern(psBig,m,v,[1.6,1.55,1.45],T*0.92,G,mode||0,0); }
/* Schweif: feine Funken (psMid) und ein Drittel groebere Glitzerflocken
   (psBig) - nur feine Funken lasen sich aus 15 m als duenner Strich */
function lFunken(p,v,g,t0,t1,rate,c,o){ o=o||{}; rkFunken(p,v,g,t0,t1,rate,c,o);
  if(!o.ps||o.ps===psMid){ const L=o.life||[0.4,0.8]; rkFunken(p,v,g,t0,t1,rate*0.32,kgMal(c,1.1),Object.assign({},o,{ps:psBig,life:[L[0]*0.8,L[1]*0.9]})); } }
function lichtSchuss(o,name,A,B,s,opt){
  const m=lMund(o);
  if(FW_LOG) FW_LOG.push({t:FW_UHR,art:'perle',kal:0,pw:0,sz:s||1,eff:'licht:'+name,A,B,stufenEff:[],hoehe:0,brueche:0,groesste:s||1,ang:+(opt.ang||0).toFixed(3),x:+m.x.toFixed(2),y:+m.y.toFixed(2),z:+m.z.toFixed(2),tag:FW_TAG});
  LICHTYP[name](o,A,B,Math.max(0.6,Math.min(1.8,s||1)),opt||{});
}

/* ---------- Die Favoriten ---------- */
/* Goldkomet: Schweifkomet - goldene Spitze, langer Goldglitzerschweif */
LICHTYP.goldkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(26*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.35;
  lKopf(m,v,kgMal(A,1.5),T,G,0,0.35); kgStern(psBig,m,v,[1.3,1.1,.7],T,G,0,0.6);
  lFunken(m,v,G,0.03,T,160,[1,.74,.32],{ps:psMid,life:[0.7,1.3],g:2.4,streu:0.25,mit:0.1,mode:4});
  lStart(m,1.3,0.8); sfx.zischen(distVol(m)*0.35,T);
};
/* Crossette: der Komet teilt sich vor dem Scheitel mit leisem Knacken in
   vier Kometen, die als Kreuz auseinanderfliegen */
LICHTYP.crossette=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.72;
  lKopf(m,v,kgMal(A,1.4),tS,G,0,0.25);
  lFunken(m,v,G,0.03,tS,90,[1,.8,.42],{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4});
  lStart(m,1,0.8);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), w=bahnTempo(v,G,tS), a0=rand(0,Math.PI*2);
    for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=7.5*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.4,1.2+w[1]*0.4,Math.sin(a)*sp+w[2]*0.4];
      lKopf(e,dv,kgMal(B,1.45),1.5,3.5,0,0.3);
      lFunken(e,dv,3.5,0.02,1.5,70,[1,.8,.42],{ps:psMid,life:[0.4,0.8],g:2,streu:0.2,mit:0.1,mode:4}); }
    for(let i=0;i<3;i++) psHuge.emit(e.x,e.y,e.z,0,0,0,1.3,1.2,1,0.05,0,0);
    schall(e,x=>sfx.crack(x*0.55)); });
};
/* Weidenkomet: Goldkomet, dessen Schweif lange stehen bleibt und als
   Trauerweide herabsinkt - der Stern faellt nach dem Scheitel noch weiter */
LICHTYP.weidenkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=5, v=lAbschuss(25*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+1.3;
  lKopf(m,v,[1.3,.85,.4],T,G,0,0.4);
  lFunken(m,v,G,0.05,T,75,[.95,.55,.2],{ps:psMid,life:[2.0,3.0],g:0.75,streu:0.12,mit:0.03,mode:0,spur:0.25});
  lStart(m,1.1,0.8); sfx.zischen(distVol(m)*0.3,T); later(1.2,()=>sfx.rieseln(distVol(m)*0.4,3));
};
/* Kometenfaecher: ein Rohr, fuenf kleine Farbkometen als Faecher */
LICHTYP.kometenfaecher=function(o,A,B,s,opt){
  const m=lMund(o), G=6;
  for(let k=0;k<5;k++){ const a=(opt.ang||0)+(-0.5+k*0.25), H=(20-Math.abs(k-2)*2)*Math.sqrt(s), v=lAbschuss(H,G,{ang:a,dir:opt.dir},0.2), T=lScheitel(v[1],G)+0.2;
    lKopf(m,v,kgMal(k%2?B:A,1.45),T,G,0,0.3);
    lFunken(m,v,G,0.03,T,45,[1,.78,.38],{ps:psMid,life:[0.35,0.7],g:2,streu:0.15,mit:0.1,mode:4}); }
  lStart(m,1.5,1.0); sfx.fizz(distVol(m)*0.7);
};
/* Glitzermine: eine Saeule aus Silberglitzer-Sternen aus dem Rohr */
LICHTYP.glitzermine=function(o,A,B,s,opt){
  const m=lMund(o), G=5, rr=lRicht(opt);
  for(let i=0;i<Math.round(55*s*QUAL());i++){ const H=rand(9,16)*Math.sqrt(s), v0=vFuerHoehe(H,G), d=[rr[0]+rand(-.12,.12),rr[1],rr[2]+rand(-.12,.12)], v=kgMal(d,v0);
    kgStern(psBig,m,v,i%5?[1.4,1.4,1.45]:kgMal(A,1.4),lScheitel(v[1],G)+rand(0.2,0.6),G,4,0.12); }
  lStart(m,1.6,1.0); sfx.rieseln(distVol(m)*0.6,2.5);
};
/* Bluetenmine: ein Strauss Farbsterne, die oben die Farbe wechseln */
LICHTYP.bluetenmine=function(o,A,B,s,opt){
  const m=lMund(o), G=5, rr=lRicht(opt);
  for(let i=0;i<Math.round(40*s*QUAL());i++){ const H=rand(10,15)*Math.sqrt(s), v0=vFuerHoehe(H,G), d=[rr[0]+rand(-.3,.3),rr[1],rr[2]+rand(-.3,.3)], v=kgMal(d,v0), T=lScheitel(v[1],G);
    psBig.emit(m.x,m.y,m.z,v[0],v[1],v[2],A[0]*1.4,A[1]*1.4,A[2]*1.4,T+0.6,G,2,B[0]*1.5,B[1]*1.5,B[2]*1.5); }
  lStart(m,1.6,1.0);
};
/* =========================================================
   02.10. (Tom): "Blitzweide - ich mag, wie der hochkommt, aber nicht den
   Effekt bei der Explosion": derselbe dunkle Aufstieg, neuer Bruch.
   Weiter unten die 30 neuen Effekte - Varianten der Favoriten und
   breite Einzelfontaenen.
   ========================================================= */
/* Dunkler Aufstieg (Blitzweide und Verwandte): nur ein schwaches Glimmen
   steigt, oben am Scheitel geht das Licht an - fn(e, w) am Scheitel */
function lDunkel(o,s,opt,H,fn){
  const m=lMund(o), G=6, v=lAbschuss((H||27)*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,[.5,.25,.12],T,G,0,0.2); lStart(m,0.8,0.7);
  kgSpaeter(T,()=>fn(sternNach(m,v[0],v[1],v[2],G,T),bahnTempo(v,G,T)));
}
/* ein kurzer weisser Blitz an einem Punkt */
function lBlitz(q,c,L){ kgStern(psHuge,q,[rand(-.3,.3),rand(-.6,0),rand(-.3,.3)],c||[1.9,1.9,2],L||rand(0.3,0.6),0.6,1,0); }
/* Blitzweide (neuer Bruch): eine goldene Weide oeffnet sich lautlos und
   sinkt; in ihren Faeden zucken immer wieder weisse Blitze auf */
LICHTYP.blitzregen=function(o,A,B,s,opt){
  lDunkel(o,s,opt,27,e=>{ const n=Math.round(34*QUAL()), arme=[], gold=kgMal(B,1.25);
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(6,7.5)*Math.sqrt(s), dv=[d[0]*w,d[1]*w*0.5+1.2,d[2]*w], L=rand(3.8,4.6);
      kgStern(psBig,e,dv,gold,L,1.8,0,0.45);
      lFunken(e,dv,1.8,0.1,L,20,[.95,.6,.22],{ps:psMid,life:[1.4,2.2],g:0.6,streu:0.08,mit:0.02,mode:0,spur:0.2});
      arme.push(dv); }
    for(let t=0.45;t<3.4;t+=0.09){ const tt=t; kgSpaeter(tt,()=>{ const dv=arme[Math.floor(Math.random()*arme.length)], q=sternNach(e,dv[0],dv[1],dv[2],1.8,tt);
      lBlitz(q,kgMal(A,1.9)); }); }
    schall(e,x=>{ sfx.plopp(x*0.4,1.1); later(0.4,()=>sfx.rieseln(x*0.5,4)); }); });
};
function lBlitzfaden(q,c,s){
  let p={x:q.x,y:q.y,z:q.z}; const n=Math.round(rand(6,10));
  for(let k=0;k<n;k++){ const d=randDir(), l=rand(0.8,1.7)*Math.sqrt(s), z=[p.x+d[0]*l,p.y-Math.abs(d[1])*l*0.9-0.3,p.z+d[2]*l];
    for(let u=0;u<=1;u+=0.2) psHuge.emit(p.x+(z[0]-p.x)*u,p.y+(z[1]-p.y)*u,p.z+(z[2]-p.z)*u,0,0,0,c[0],c[1],c[2],rand(0.14,0.26),0,0);
    if(Math.random()<0.25){ const ab={x:p.x,y:p.y,z:p.z}; for(let j=0;j<3;j++){ const dd=randDir(); psBig.emit(ab.x+dd[0]*0.6*j,ab.y-0.5*j,ab.z+dd[2]*0.6*j,0,0,0,c[0]*0.8,c[1]*0.8,c[2]*0.8,0.08,0,0); } }
    p={x:z[0],y:z[1],z:z[2]}; }
}
function lWolke(e,c,s,n){
  /* weicher Leuchthof: ein paar grosse, schwache Lichtflecken - die Wolke selbst leuchtet auf */
  for(let j=0;j<Math.max(4,Math.round(n/5));j++){ const a=rand(0,Math.PI*2), r=Math.sqrt(Math.random())*5*Math.sqrt(s); psHuge.emit(e.x+Math.cos(a)*r,e.y+rand(-0.8,0.8),e.z+Math.sin(a)*r,0,0,0,c[0]*0.45,c[1]*0.45,c[2]*0.5,rand(0.3,0.6),0,0); }
  for(let j=0;j<n;j++){ const a=rand(0,Math.PI*2), r=Math.sqrt(Math.random())*7*Math.sqrt(s); psBig.emit(e.x+Math.cos(a)*r,e.y+rand(-1.2,1.2),e.z+Math.sin(a)*r,0,0,0,c[0]*0.75,c[1]*0.75,c[2]*0.8,rand(0.25,0.55),0,0); }
}
function lGewitter(e,A,s,bunt){
  let t=0; for(let k=0;k<12;k++){ t+=rand(0.12,0.4); const tt=t;
    kgSpaeter(tt,()=>{ const d=randDir(), r=rand(1,6)*Math.sqrt(s), q={x:e.x+d[0]*r,y:e.y+d[1]*r*0.3,z:e.z+d[2]*r}, c=bunt?kgMal(k%2?A:bunt,1.5):k%3?[1.6,1.6,1.8]:kgMal(A,1.4);
      flash(q,c,1.8,0.16); lWolke(q,c,s,Math.round(36*QUAL())); if(k%2===0) lBlitzfaden(q,c,s); }); }
  return t;
}
/* ---------- Glitzerminen ---------- */
/* Gemeinsamer Bau: n Sterne aus dem Rohr, Kegel kegel (rad), Hoehe H,
   Farbe c (Funktion i->Farbe), Modus md, dazu Extras */
function lMine(o,s,opt,p){
  const m=lMund(o), G=p.G||5, rr=lRicht(opt), n=Math.round((p.n||55)*s*QUAL()), out=[];
  for(let i=0;i<n;i++){ const H=rand(p.H[0],p.H[1])*Math.sqrt(s), v0=vFuerHoehe(H,G), a=rand(0,Math.PI*2), k=p.ring?p.kegel:Math.sqrt(Math.random())*p.kegel;
    const d=[rr[0]+Math.cos(a)*k,rr[1],rr[2]+Math.sin(a)*k], v=kgMal(d,v0), T=lScheitel(v[1],G)+rand(p.nach?p.nach[0]:0.2,p.nach?p.nach[1]:0.6);
    const md=typeof p.md==='function'?p.md(i):p.md;
    out.push({v,T,h:kgStern(psBig,m,v,p.c(i),T,G,md,p.spur!==undefined?p.spur:0.12)}); }
  lStart(m,1.6,1.0); return {m,G,out};
}
const SILBER=[1.4,1.4,1.45], GOLD=[1.35,1.0,0.45];
/* Goldglitzermine: dieselbe Saeule in warmem Gold, etwas hoeher */
LICHTYP.glitzergold=function(o,A,B,s,opt){ lMine(o,s,opt,{H:[10,17],kegel:0.12,md:4,c:i=>i%6?GOLD:kgMal(A,1.4)}); sfx.rieseln(distVol(o)*0.6,3); };
/* Glitzer mit Farbspitzen: Silberglitzer, oben gluehen die Sterne kurz in
/* ---------- Bluetenminen ---------- */
/* Bluetenkranz: die Sterne fliegen auf einem Kegelmantel - eine hohle
   Tulpe statt eines Strausses */
LICHTYP.bluetenkranz=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:46,H:[11,13],kegel:0.34,ring:true,md:0,nach:[0.3,0.5],spur:0.15,c:()=>kgMal(A,1.45)});
  r.out.forEach(({h},i)=>kgSpaeter(r.out[i].T*0.6,()=>kgFarbe(h,kgMal(B,1.5))));
};
/* Bluetenglitzer: Farbsterne mit feinem Glitzerschweif */
LICHTYP.bluetenglitzer=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:34,H:[10,15],kegel:0.28,md:0,spur:0.1,c:i=>kgMal(i%2?A:B,1.45)});
  r.out.forEach(({v,T},i)=>{ if(i%2===0) lFunken(r.m,v,r.G,0.15,T,14,[1.2,1.1,.9],{ps:psMid,life:[0.5,0.9],g:2,streu:0.2,mit:0.05,mode:4}); });
  sfx.rieseln(distVol(o)*0.5,2.5);
};
/* Bluetendreiklang: drei Farben nacheinander (A, B, Weiss) */
LICHTYP.bluetendreiklang=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:42,H:[10,15],kegel:0.3,md:0,nach:[0.6,0.9],spur:0.08,c:()=>kgMal(A,1.45)});
  r.out.forEach(({h,T})=>{ kgSpaeter(T*0.4,()=>kgFarbe(h,kgMal(B,1.5))); kgSpaeter(T*0.8,()=>kgFarbe(h,[1.6,1.6,1.65])); });
};

/* ---------- Wasserfaelle ---------- */
/* Gemeinsamer Bau: Komet im flachen Bogen, aus dem Bogen faellt der
   Vorhang. Die Seite sagt das Rohr: ein nach links geneigtes Rohr wirft
   seinen Bogen nach links (02.10., "genau aus den Loechern") - ohne
   Neigung abwechselnd. p.seite erzwingt eine Seite. */
function lFall(o,s,opt,p){
  const m=lMund(o), G=4, q=Math.sin(opt.ang||0)*Math.cos((opt.dir===undefined?FANDIR:opt.dir)-FANDIR);
  const sd=p.seite!==undefined?p.seite:Math.abs(q)>0.03?Math.sign(q):((opt.i||0)%2?1:-1);
  const v=lAbschuss((p.H||15)*Math.sqrt(s),G,{ang:sd*(p.ang||0.62),dir:FANDIR},0.2), T=lScheitel(v[1],G)*(p.lang||1.7);
  lKopf(m,v,p.kopf||[1.4,1.4,1.45],T,G,0,0.2);
  lFunken(m,v,G,0.08,T,p.rate||120,p.c,{ps:psMid,life:p.life||[1.8,2.6],g:p.g||2.6,streu:0.06,mit:0,mode:p.md||0,spur:p.spur||0.12});
  lStart(m,1,0.7); sfx.regen(distVol(m)*0.7,T+2);
  return {m,v,T,G};
}
LICHTYP.goldwasserfall=function(o,A,B,s,opt){ lFall(o,s,opt,{kopf:[1.5,1.1,.5],c:[1.2,.85,.36],md:4}); };
/* Wassertor: zwei Boegen zugleich von links und rechts - ein Tor aus Licht */
LICHTYP.wassertor=function(o,A,B,s,opt){ lFall(o,s,opt,{seite:-1,ang:0.5,H:17,c:[1.25,1.25,1.3]}); lFall(o,s,opt,{seite:1,ang:0.5,H:17,c:kgMal(A,1.15),kopf:kgMal(A,1.4)}); };
/* ---------- Neue Lichter aus den Favoriten ---------- */
/* Kometenkrone: Goldkomet, oben breitet sich lautlos eine haengende
   Glitzerkrone aus (die Sterne loesen sich, kein Zerleger) */
LICHTYP.kometenkrone=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(25*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  lKopf(m,v,kgMal(A,1.5),T,G,0,0.35); lFunken(m,v,G,0.03,T,140,[1,.74,.32],{ps:psMid,life:[0.7,1.2],g:2.4,streu:0.25,mit:0.1,mode:4});
  lStart(m,1.3,0.8); sfx.zischen(distVol(m)*0.3,T);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T); for(let i=0;i<Math.round(46*QUAL());i++){ const a=rand(0,Math.PI*2), w=rand(2.5,4.5)*Math.sqrt(s);
      kgStern(psBig,e,[Math.cos(a)*w,rand(0,1.5),Math.sin(a)*w],i%5?GOLD:kgMal(A,1.4),rand(2.6,3.4),1.6,4,0.35); }
    schall(e,x=>sfx.rieseln(x*0.5,3.5)); });
};
/* Farbkomet: Farbkopf mit farbigem Glitzerschweif */
LICHTYP.farbkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(26*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.35;
  lKopf(m,v,kgMal(A,1.6),T,G,0,0.35); lFunken(m,v,G,0.03,T,140,mischF(A,[1,.8,.4],0.35),{ps:psMid,life:[0.7,1.2],g:2.4,streu:0.25,mit:0.1,mode:4});
  lStart(m,1.3,0.8);
};
/* Zwillingskomet: zwei Kometen aus einem Rohr, die auseinanderstreben */
LICHTYP.zwillingskomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6;
  [-1,1].forEach((sd,k)=>{ const v=lAbschuss(25*Math.sqrt(s),G,{ang:(opt.ang||0)+sd*0.17,dir:opt.dir},0.15), T=lScheitel(v[1],G)+0.3, c=k?B:A;
    lKopf(m,v,kgMal(c,1.5),T,G,0,0.35); lFunken(m,v,G,0.03,T,110,mischF(c,[1,.8,.4],0.5),{ps:psMid,life:[0.6,1.1],g:2.4,streu:0.2,mit:0.1,mode:4}); });
  lStart(m,1.5,0.9);
};
/* Farbcrossette: das Kreuz aus vier Kometen wechselt im Flug die Farbe */
LICHTYP.farbcrossette=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.72;
  lKopf(m,v,kgMal(A,1.4),tS,G,0,0.25); lFunken(m,v,G,0.03,tS,80,[1,.8,.42],{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4}); lStart(m,1,0.8);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), w=bahnTempo(v,G,tS), a0=rand(0,Math.PI*2);
    for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=7.5*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.4,1.2+w[1]*0.4,Math.sin(a)*sp+w[2]*0.4];
      const h=kgStern(psHuge,e,dv,kgMal(A,1.6),1.6,3.5,0,0.3); kgSpaeter(0.7,()=>kgFarbe(h,kgMal(B,1.7)));
      lFunken(e,dv,3.5,0.02,1.6,60,[1,.8,.42],{ps:psMid,life:[0.4,0.8],g:2,streu:0.2,mit:0.1,mode:4}); }
    schall(e,x=>sfx.crack(x*0.55)); });
};
/* Dreifachcrossette: teilt sich in drei, jeder Ast noch einmal in zwei */
LICHTYP.dreifachcrossette=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(23*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.7;
  lKopf(m,v,kgMal(A,1.4),tS,G,0,0.25); lFunken(m,v,G,0.03,tS,80,[1,.8,.42],{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4}); lStart(m,1,0.8);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), a0=rand(0,Math.PI*2);
    for(let k=0;k<3;k++){ const a=a0+k*2.094, sp=6.5*Math.sqrt(s), dv=[Math.cos(a)*sp,1.5,Math.sin(a)*sp], t2=0.65;
      lKopf(e,dv,kgMal(A,1.45),t2,3.5,0,0.25); lFunken(e,dv,3.5,0.02,t2,60,[1,.8,.42],{ps:psMid,life:[0.4,0.7],g:2,streu:0.2,mit:0.1,mode:4});
      kgSpaeter(t2,()=>{ const e2=sternNach(e,dv[0],dv[1],dv[2],3.5,t2); for(const sd of [-0.5,0.5]){ const b=a+sd, d2=[Math.cos(b)*5,0.8,Math.sin(b)*5];
          lKopf(e2,d2,kgMal(B,1.5),1.2,3.5,0,0.25); lFunken(e2,d2,3.5,0.02,1.2,45,[1,.8,.42],{ps:psMid,life:[0.4,0.7],g:2,streu:0.2,mit:0.1,mode:4}); }
        schall(e2,x=>sfx.crack(x*0.35)); }); }
    schall(e,x=>sfx.crack(x*0.55)); });
};
/* Weidenfaecher: fuenf Weidenkometen als Faecher - ein Vorhang aus Gold */
LICHTYP.weidenfaecher=function(o,A,B,s,opt){
  const m=lMund(o), G=5;
  for(let k=0;k<5;k++){ const a=(opt.ang||0)+(-0.44+k*0.22), v=lAbschuss((22-Math.abs(k-2)*2)*Math.sqrt(s),G,{ang:a,dir:opt.dir},0.15), T=lScheitel(v[1],G)+1.0;
    lKopf(m,v,[1.3,.85,.4],T,G,0,0.35); lFunken(m,v,G,0.05,T,40,[.95,.55,.2],{ps:psMid,life:[1.8,2.8],g:0.75,streu:0.12,mit:0.03,mode:0,spur:0.25}); }
  lStart(m,1.6,1.0); later(1.2,()=>sfx.rieseln(distVol(m)*0.5,3.5));
};
/* Goldfaecher: sieben Goldglitzerkometen als breiter Faecher */
LICHTYP.goldfaecher=function(o,A,B,s,opt){
  const m=lMund(o), G=6;
  for(let k=0;k<7;k++){ const a=(opt.ang||0)+(-0.6+k*0.2), v=lAbschuss((21-Math.abs(k-3)*1.5)*Math.sqrt(s),G,{ang:a,dir:opt.dir},0.15), T=lScheitel(v[1],G)+0.3;
    lKopf(m,v,kgMal(A,1.45),T,G,0,0.3); lFunken(m,v,G,0.03,T,60,[1,.74,.32],{ps:psMid,life:[0.6,1.1],g:2.4,streu:0.2,mit:0.1,mode:4}); }
  lStart(m,1.8,1.1); sfx.zischen(distVol(m)*0.4,1.5);
};

/* =========================================================
   30 neue Effekte (02.10., Tom: "neue Effekte, die ich gut finde ...
   viele verschiedene Variationen, wo ich gesagt habe, das gefaellt mir").
   Varianten von Blitzweide, Bluetenkranz, Bluetenglitzer, Bluetendrei-
   klang, Goldwasserfall, Wassertor, Kometenkrone, Zwillingskomet,
   Farbcrossette und Weidenfaecher - dazu acht breite Einzelfontaenen.
   ========================================================= */
const GOLDF=[1.2,.85,.36];
/* --- Blitzweide-Familie: derselbe dunkle Aufstieg --- */
/* Blitzkrone: eine silberne Krone haengt waagerecht, ihre Spitzen blitzen */
LICHTYP.blitzkrone=function(o,A,B,s,opt){
  lDunkel(o,s,opt,26,e=>{ const n=Math.round(40*QUAL()), a0=rand(0,Math.PI*2);
    for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, w=rand(5,5.8)*Math.sqrt(s), dv=[Math.cos(a)*w,rand(1.8,2.8),Math.sin(a)*w], L=rand(3.0,3.6);
      kgStern(psBig,e,dv,kgMal(A,1.4),L,1.6,4,0.35);
      const tb=L*rand(0.6,0.8); kgSpaeter(tb,()=>{ const q=sternNach(e,dv[0],dv[1],dv[2],1.6,tb); lBlitz(q,i%3?null:kgMal(B,1.9),rand(0.5,0.9)); }); }
    schall(e,x=>{ sfx.plopp(x*0.35,1.4); later(0.2,()=>sfx.rieseln(x*0.55,3.2)); }); });
};
/* Blitzpalme: acht schwere Goldarme sinken wie Palmwedel, an ihren
   Enden zerstieben weisse Blitze */
LICHTYP.blitzpalme=function(o,A,B,s,opt){
  lDunkel(o,s,opt,25,e=>{ const a0=rand(0,Math.PI*2);
    for(let k=0;k<8;k++){ const a=a0+k*Math.PI/4, w=8*Math.sqrt(s), dv=[Math.cos(a)*w,3.2,Math.sin(a)*w], L=2.8;
      lKopf(e,dv,kgMal(A,1.3),L,3.0,0,0.5);
      lFunken(e,dv,3.0,0.05,L,55,GOLDF,{ps:psMid,life:[0.9,1.5],g:1.4,streu:0.12,mit:0.05,mode:4});
      kgSpaeter(L-0.7,()=>{ const q=sternNach(e,dv[0],dv[1],dv[2],3.0,L-0.7); for(let j=0;j<5;j++){ const d=randDir(); kgStern(psHuge,q,[d[0]*1.6,d[1]*1.6,d[2]*1.6],kgMal(B,1.9),rand(0.5,0.9),1.2,1,0); } }); }
    schall(e,x=>{ sfx.plopp(x*0.5,0.9); later(1.8,()=>sfx.crackle(x*0.35)); }); });
};
/* Blitzbluete: eine Farbbluete oeffnet sich leise und zerfaellt nach
   einer Sekunde in lauter blitzende weisse Sterne */
LICHTYP.blitzbluete=function(o,A,B,s,opt){
  lDunkel(o,s,opt,26,e=>{ const n=Math.round(52*QUAL()), hs=[];
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(6.5,7.5)*Math.sqrt(s); hs.push(kgStern(psBig,e,[d[0]*w,d[1]*w,d[2]*w],kgMal(A,1.45),2.6,2.2,0,0.12)); }
    kgSpaeter(1.1,()=>hs.forEach(h=>{ if(!kgLebt(h)) return; const [q,w]=kgOrt(h); kgAus(h); kgStern(psBig,q,[w[0]*0.5,w[1]*0.5,w[2]*0.5],kgMal(B,1.9),rand(1.3,1.8),1.4,1,0); }));
    schall(e,x=>{ sfx.plopp(x*0.45,1.2); later(1.1,()=>sfx.rieseln(x*0.5,2)); }); });
};
/* --- Bluetenkranz, Bluetenglitzer, Bluetendreiklang --- */
/* Doppelkranz: zwei Tulpen ineinander, die Farben tauschen gegenlaeufig */
LICHTYP.doppelkranz=function(o,A,B,s,opt){
  const r1=lMine(o,s,opt,{n:30,H:[10,12],kegel:0.18,ring:true,md:0,nach:[0.3,0.5],spur:0.15,c:()=>kgMal(A,1.45)});
  const r2=lMine(o,s,opt,{n:40,H:[12,14],kegel:0.42,ring:true,md:0,nach:[0.3,0.5],spur:0.15,c:()=>kgMal(B,1.45)});
  r1.out.forEach(({h,T})=>kgSpaeter(T*0.62,()=>kgFarbe(h,kgMal(B,1.5))));
  r2.out.forEach(({h,T})=>kgSpaeter(T*0.62,()=>kgFarbe(h,kgMal(A,1.5))));
};
/* Kranzwelle: drei Kraenze kurz nacheinander, jeder hoeher und weiter */
LICHTYP.kranzwelle=function(o,A,B,s,opt){
  [[A,B,[10,11.5],0.24],[B,A,[12,13.5],0.33],[[1,1,1],B,[14,15.5],0.42]].forEach(([c1,c2,H,k],j)=>kgSpaeter(j*0.4,()=>{
    const r=lMine(o,s,opt,{n:30,H,kegel:k,ring:true,md:0,nach:[0.3,0.5],spur:0.15,c:()=>kgMal(c1,1.45)});
    r.out.forEach(({h,T})=>kgSpaeter(T*0.65,()=>kgFarbe(h,kgMal(c2,1.5)))); }));
};
/* Funkelkranz: hohler Kranz, jeder Stern zieht einen Goldglitzerschweif */
LICHTYP.funkelkranz=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:36,H:[11,13.5],kegel:0.36,ring:true,md:0,nach:[0.4,0.6],spur:0.12,c:()=>kgMal(A,1.45)});
  r.out.forEach(({v,T})=>lFunken(r.m,v,r.G,0.12,T,14,kgMal(B,1.15),{ps:psMid,life:[0.6,1.0],g:2,streu:0.15,mit:0.05,mode:4}));
  sfx.rieseln(distVol(o)*0.55,3);
};
/* Goldschweif-Bluete: breiter Strauss, jeder Farbstern mit langem Goldglitzer */
LICHTYP.goldschweifbluete=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:30,H:[12,16],kegel:0.42,md:0,spur:0.1,c:i=>kgMal(i%2?A:B,1.45)});
  r.out.forEach(({v,T})=>lFunken(r.m,v,r.G,0.1,T,22,GOLDF,{ps:psMid,life:[0.8,1.4],g:1.8,streu:0.12,mit:0.04,mode:4}));
  sfx.rieseln(distVol(o)*0.6,3.2);
};
/* Vierfarb-Bluete: A, B und zwei gedrehte Toene davon, jeder zweite
   Stern mit Silberglitzer */
LICHTYP.vierfarbbluete=function(o,A,B,s,opt){
  const F=[A,B,[A[2],A[0],A[1]],[B[1],B[2],B[0]]];
  const r=lMine(o,s,opt,{n:40,H:[10,15],kegel:0.32,md:0,spur:0.1,c:i=>kgMal(F[i%4],1.45)});
  r.out.forEach(({v,T},i)=>{ if(i%2===0) lFunken(r.m,v,r.G,0.15,T,12,SILBER,{ps:psMid,life:[0.5,0.9],g:2,streu:0.2,mit:0.05,mode:4}); });
  sfx.rieseln(distVol(o)*0.5,2.5);
};
/* Wechselbluete: innen ein Strauss A, aussen ein Kranz B - beide
   tauschen zweimal gegenlaeufig die Farbe */
LICHTYP.wechselbluete=function(o,A,B,s,opt){
  const innen=lMine(o,s,opt,{n:22,H:[10,13],kegel:0.12,md:0,nach:[0.6,0.9],spur:0.08,c:()=>kgMal(A,1.45)});
  const aussen=lMine(o,s,opt,{n:32,H:[11,14],kegel:0.38,ring:true,md:0,nach:[0.6,0.9],spur:0.08,c:()=>kgMal(B,1.45)});
  innen.out.forEach(({h,T})=>{ kgSpaeter(T*0.35,()=>kgFarbe(h,kgMal(B,1.5))); kgSpaeter(T*0.75,()=>kgFarbe(h,kgMal(A,1.5))); });
  aussen.out.forEach(({h,T})=>{ kgSpaeter(T*0.35,()=>kgFarbe(h,kgMal(A,1.5))); kgSpaeter(T*0.75,()=>kgFarbe(h,kgMal(B,1.5))); });
};
/* Glutbluete: Rot, dann Gold, dann glimmt jeder Stern langsam als Glut
   aus und sinkt (Modus 2: Farbe kuehlt ab) */
LICHTYP.glutbluete=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:40,H:[10,14],kegel:0.3,md:0,nach:[0.15,0.25],spur:0.08,c:()=>kgMal(A,1.45)});
  r.out.forEach(({h,T})=>{ kgSpaeter(T*0.5,()=>kgFarbe(h,kgMal(B,1.5)));
    kgSpaeter(T-0.1,()=>{ if(!kgLebt(h)) return; const [q,w]=kgOrt(h); kgAus(h);
      psBig.emit(q.x,q.y,q.z,w[0]*0.3,w[1]*0.3,w[2]*0.3,1.25,.66,.2,rand(1.8,2.6),0.9,2,.35,.08,.02); }); });
  later(1.6,()=>sfx.rieseln(distVol(o)*0.4,2.5));
};
/* --- Goldwasserfall und Wassertor --- */
/* Doppelter Goldfall: zwei Boegen uebereinander zur selben Seite */
LICHTYP.doppelfall=function(o,A,B,s,opt){
  lFall(o,s,opt,{H:12,ang:0.7,kopf:[1.5,1.1,.5],c:GOLDF,md:4});
  kgSpaeter(0.3,()=>lFall(o,s,opt,{H:20,ang:0.55,kopf:kgMal(B,1.5),c:mischF(GOLDF,kgMal(B,1.2),0.4),md:4}));
};
/* Weidenfall: der Vorhang haengt lange wie eine Trauerweide */
LICHTYP.weidenfall=function(o,A,B,s,opt){ lFall(o,s,opt,{H:16,ang:0.58,kopf:[1.3,.85,.4],c:kgMal(A,0.95),md:0,rate:90,life:[3.0,4.2],g:0.8,spur:0.3}); later(1,()=>sfx.rieseln(distVol(o)*0.5,4)); };
/* Goldkaskade: der Kopf springt dreimal weiter zur Seite, jeder Sprung
   zieht seinen eigenen Vorhang - wie Wasser ueber Stufen */
LICHTYP.kaskadenfall=function(o,A,B,s,opt){
  const m=lMund(o), G=4, qq=Math.sin(opt.ang||0)*Math.cos((opt.dir===undefined?FANDIR:opt.dir)-FANDIR), sd=Math.abs(qq)>0.03?Math.sign(qq):((opt.i||0)%2?1:-1), Q=lQuer({dir:FANDIR});
  const sprung=(p,k)=>{ const f=Math.sqrt(s), H=[13,7,5][k]*f, h=[6,5,4.5][k]*f*sd, w=[Q[0]*h,vFuerHoehe(H,G),Q[2]*h], T=lScheitel(w[1],G)*1.6, letzt=k===2;
    lKopf(p,w,letzt?kgMal(B,1.5):[1.5,1.1,.5],T,G,0,0.2);
    lFunken(p,w,G,0.06,T,110,letzt?kgMal(B,1.1):GOLDF,{ps:psMid,life:[1.6,2.4],g:2.6,streu:0.06,mit:0,mode:4,spur:0.12});
    if(!letzt) kgSpaeter(T,()=>{ const e=sternNach(p,w[0],w[1],w[2],G,T); for(let j=0;j<8;j++){ const d=randDir(); psBig.emit(e.x,e.y,e.z,d[0]*1.5,d[1]*1.5,d[2]*1.5,1.4,1.1,.5,rand(0.3,0.5),2,4); }
      schall(e,x=>sfx.plopp(x*0.3,1.6)); sprung(e,k+1); }); };
  sprung(m,0); lStart(m,1,0.7); sfx.regen(distVol(m)*0.7,7);
};
/* Torbogen: zwei hohe Boegen, oben spannt sich ein glitzernder
   Querbalken zwischen ihnen - links Silber, rechts Gold */
LICHTYP.torbogen=function(o,A,B,s,opt){
  const l=lFall(o,s,opt,{seite:-1,ang:0.32,H:21,lang:1.5,kopf:kgMal(A,1.4),c:A,life:[1.8,2.4]});
  const r=lFall(o,s,opt,{seite:1,ang:0.32,H:21,lang:1.5,kopf:[1.5,1.1,.5],c:GOLDF,md:4,life:[1.8,2.4]});
  const tq=l.T*0.62;
  kgSpaeter(tq,()=>{ const a=sternNach(l.m,l.v[0],l.v[1],l.v[2],l.G,tq), b=sternNach(r.m,r.v[0],r.v[1],r.v[2],r.G,tq), n=Math.round(26*QUAL());
    for(let i=0;i<=n;i++){ const u=i/n; kgStern(psBig,{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u+Math.sin(u*Math.PI)*0.8,z:a.z+(b.z-a.z)*u},[0,rand(-0.2,0.1),0],u<0.5?kgMal(A,1.3):[1.3,1,.45],rand(2.2,3),0.5,4,0.1); }
    schall(a,x=>sfx.rieseln(x*0.5,3)); });
};
/* Dreifachtor: links und rechts flach, in der Mitte ein hoher Bogen */
LICHTYP.dreifachtor=function(o,A,B,s,opt){
  lFall(o,s,opt,{seite:-1,ang:0.6,H:14,kopf:[1.5,1.1,.5],c:GOLDF,md:4});
  lFall(o,s,opt,{seite:1,ang:0.6,H:14,kopf:[1.5,1.1,.5],c:GOLDF,md:4});
  lFall(o,s,opt,{seite:1,ang:0.12,H:24,lang:1.4,kopf:kgMal(B,1.5),c:kgMal(B,1.05)});
};
/* --- Kometenkrone --- */
/* Farbkrone: Goldkomet, oben haengt eine Krone aus Farbsternen */
LICHTYP.farbkrone=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(25*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  lKopf(m,v,[1.5,1.1,.5],T,G,0,0.35); lFunken(m,v,G,0.03,T,120,[1,.74,.32],{ps:psMid,life:[0.7,1.2],g:2.4,streu:0.25,mit:0.1,mode:4});
  lStart(m,1.3,0.8); sfx.zischen(distVol(m)*0.3,T);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), n=Math.round(40*QUAL());
    for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2), w=rand(3.5,5.5)*Math.sqrt(s); kgStern(psBig,e,[Math.cos(a)*w,rand(0,1.5),Math.sin(a)*w],kgMal(i%2?A:B,1.5),rand(2.4,3.2),1.6,0,0.3); }
    schall(e,x=>sfx.plopp(x*0.3,1.5)); });
};
/* Doppelkrone: unterwegs eine kleine Krone in B, oben die grosse goldene */
LICHTYP.doppelkrone=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(27*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  lKopf(m,v,kgMal(A,1.5),T,G,0,0.35); lFunken(m,v,G,0.03,T,130,[1,.74,.32],{ps:psMid,life:[0.7,1.2],g:2.4,streu:0.25,mit:0.1,mode:4});
  lStart(m,1.3,0.8); sfx.zischen(distVol(m)*0.3,T);
  const krone=(t,n,w0,c,L)=>kgSpaeter(t,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,t), u=bahnTempo(v,G,t);
    for(let i=0;i<Math.round(n*QUAL());i++){ const a=rand(0,Math.PI*2), w=rand(w0*0.6,w0)*Math.sqrt(s); kgStern(psBig,e,[Math.cos(a)*w+u[0]*0.3,rand(0,1.2)+u[1]*0.3,Math.sin(a)*w+u[2]*0.3],c(i),rand(L*0.85,L),1.6,4,0.3); }
    schall(e,x=>sfx.rieseln(x*0.4,L)); });
  krone(T*0.55,24,3.4,()=>kgMal(B,1.5),2.0);
  krone(T,52,5.6,i=>i%5?GOLD:kgMal(A,1.4),3.2);
};
/* --- Zwillingskomet --- */
/* Drillingskomet: drei Kometen aus einem Rohr, aussen farbig, Mitte Gold */
LICHTYP.drillingskomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6;
  [[-0.22,A,24],[0,FW.gold,27],[0.22,A,24]].forEach(([da,c,H])=>{ const v=lAbschuss(H*Math.sqrt(s),G,{ang:(opt.ang||0)+da,dir:opt.dir},0.15), T=lScheitel(v[1],G)+0.3;
    lKopf(m,v,kgMal(c,1.5),T,G,0,0.35); lFunken(m,v,G,0.03,T,90,mischF(c,[1,.8,.4],0.5),{ps:psMid,life:[0.6,1.1],g:2.4,streu:0.2,mit:0.1,mode:4}); });
  lStart(m,1.7,1.0);
};
/* Zwillingsspirale: zwei Kometen winden sich umeinander nach oben (die
   Achse ist die Bahn aus dem Rohr, sie kreisen quer dazu) */
LICHTYP.zwillingsspirale=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(25*Math.sqrt(s),G,opt,0.2), T=lScheitel(v[1],G)+0.25, Q=lQuer({dir:FANDIR}), Z=[-Q[2],0,Q[0]], R=1.2*Math.sqrt(s), om=7, ph0=rand(0,Math.PI*2);
  lStart(m,1.4,0.9); sfx.zischen(distVol(m)*0.35,T);
  lLaufend(T,t=>{ const p=sternNach(m,v[0],v[1],v[2],G,t), w=bahnTempo(v,G,t), r=R*Math.min(1,t/0.35);
    [0,Math.PI].forEach((d,k)=>{ const a=ph0+om*t+d, ca=Math.cos(a), sa=Math.sin(a), c=k?B:A;
      const q={x:p.x+(Q[0]*ca+Z[0]*sa)*r,y:p.y,z:p.z+(Q[2]*ca+Z[2]*sa)*r}, tv=[w[0]+(-Q[0]*sa+Z[0]*ca)*r*om,w[1],w[2]+(-Q[2]*sa+Z[2]*ca)*r*om];
      psHuge.emit(q.x,q.y,q.z,tv[0],tv[1],tv[2],c[0]*1.9,c[1]*1.9,c[2]*1.9,0.06,0,0); psBig.emit(q.x,q.y,q.z,tv[0],tv[1],tv[2],1.6,1.5,1.3,0.05,0,0);
      for(let j=0;j<Math.round(6*QUAL());j++) (j%3?psMid:psBig).emit(q.x,q.y,q.z,w[0]*0.1+rand(-.3,.3),w[1]*0.1+rand(-.3,.3)-0.25,w[2]*0.1+rand(-.3,.3),c[0]*1.1+0.25,c[1]*1.1+0.2,c[2]*1.1+0.1,rand(0.8,1.3),2.2,4); }); },0.08);
};
/* --- Farbcrossette --- */
/* Weidencrossette: das Kreuz aus vier Kometen sinkt als Goldweide herab */
LICHTYP.weidencrossette=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.75;
  lKopf(m,v,kgMal(A,1.4),tS,G,0,0.25); lFunken(m,v,G,0.03,tS,80,[1,.8,.42],{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4}); lStart(m,1,0.8);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), w=bahnTempo(v,G,tS), a0=rand(0,Math.PI*2);
    for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=6.5*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.4,1.5+w[1]*0.4,Math.sin(a)*sp+w[2]*0.4], L=3.2;
      lKopf(e,dv,[1.3,.85,.4],L,2.2,0,0.45);
      lFunken(e,dv,2.2,0.05,L,60,kgMal(B,0.95),{ps:psMid,life:[1.8,2.8],g:0.75,streu:0.12,mit:0.03,mode:0,spur:0.25}); }
    schall(e,x=>{ sfx.crack(x*0.5); later(1,()=>sfx.rieseln(x*0.5,3.5)); }); });
};
/* Kreuzbluete: Crossette, an jedem der vier Enden oeffnet sich ein
   kleiner Bluetenkranz (zum Zuschauer gewandt), der die Farbe wechselt */
LICHTYP.kreuzbluete=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(23*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.72, Q=lQuer({dir:FANDIR});
  lKopf(m,v,kgMal(A,1.4),tS,G,0,0.25); lFunken(m,v,G,0.03,tS,80,[1,.8,.42],{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4}); lStart(m,1,0.8);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), a0=rand(0,Math.PI*2);
    for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=7*Math.sqrt(s), dv=[Math.cos(a)*sp,1.2,Math.sin(a)*sp], L=0.9;
      lKopf(e,dv,kgMal(A,1.45),L,3.5,0,0.25); lFunken(e,dv,3.5,0.02,L,50,[1,.8,.42],{ps:psMid,life:[0.4,0.7],g:2,streu:0.2,mit:0.1,mode:4});
      kgSpaeter(L,()=>{ const e2=sternNach(e,dv[0],dv[1],dv[2],3.5,L), n=Math.round(16*QUAL());
        for(let j=0;j<n;j++){ const b=j/n*Math.PI*2, w2=2.4*Math.sqrt(s), h=kgStern(psBig,e2,[Q[0]*Math.cos(b)*w2,Math.sin(b)*w2+0.4,Q[2]*Math.cos(b)*w2],kgMal(B,1.5),1.7,1.8,0,0.12);
          kgSpaeter(0.9,()=>kgFarbe(h,kgMal(A,1.5))); }
        schall(e2,x=>sfx.plopp(x*0.25,1.8)); }); }
    schall(e,x=>sfx.crack(x*0.5)); });
};
/* --- Weidenfaecher --- */
/* Farbweidenfaecher: fuenf Weiden mit farbigen Koepfen, goldene Schweife */
LICHTYP.farbweidenfaecher=function(o,A,B,s,opt){
  const m=lMund(o), G=5;
  for(let k=0;k<5;k++){ const a=(opt.ang||0)+(-0.44+k*0.22), v=lAbschuss((22-Math.abs(k-2)*2)*Math.sqrt(s),G,{ang:a,dir:opt.dir},0.15), T=lScheitel(v[1],G)+1.0;
    lKopf(m,v,kgMal(k%2?B:A,1.45),T,G,0,0.35); lFunken(m,v,G,0.05,T,40,[.95,.55,.2],{ps:psMid,life:[1.8,2.8],g:0.75,streu:0.12,mit:0.03,mode:0,spur:0.25}); }
  lStart(m,1.6,1.0); later(1.2,()=>sfx.rieseln(distVol(m)*0.5,3.5));
};

/* --- Breite Einzelfontaenen (Tom: "breitere Fontaenen, wo einfach nur
   eine Fontaene ist - das kann dann am Himmel noch einen Effekt
   ergeben") --- */
/* Gemeinsamer Bau: EIN Rohr, ein weiter Faecher aus Funken quer zum
   Zuschauer (bis +-weit rad), H Meter hoch, D Sekunden. c(u,j) Farbe
   (u = 0..1 ueber die Brenndauer), md Modus (4 Glitzer, 1 Blinker,
   2 Glut), extra(t,m) je Bild, ende(): was am Schluss aus demselben Rohr
   in den Himmel steigt (vorEnde s vor Schluss) */
function lBreit(o,A,B,s,opt,p){
  const m=lMund(o), D=p.D||6, G=p.G||4, H=(p.H||9)*Math.sqrt(s), v0=vFuerHoehe(H,G), Q=lQuer({dir:FANDIR}), Z=[-Q[2],0,Q[0]], W=p.weit||0.6, n=p.n||14, L=p.life||[0.8,1.3], md=p.md===undefined?4:p.md, c2=p.c2||[];
  lStart(m,1.2,0.5); sfx.fauchen(distVol(m)*0.7,D,true); sfx.zischen(distVol(m)*0.35,D);
  lLaufend(D,t=>{ const k=Math.min(1,t/0.5)*Math.min(1,(D-t)/0.5), u=t/D;
    for(let j=0;j<Math.round(n*k*QUAL());j++){ const a=W*Math.sqrt(Math.random()), az=rand(0,Math.PI*2), w=v0*rand(0.6,1)*(1-a*0.2), c=p.c(u,j);
      /* ein weiter Kegel, quer zur Batterie noch etwas breiter als in
         die Tiefe - von jeder Seite eine grosse Fontaene */
      const sx=Math.sin(a)*Math.cos(az), sz=Math.sin(a)*Math.sin(az)*0.75, d=[Q[0]*sx+Z[0]*sz,Math.cos(a),Q[2]*sx+Z[2]*sz];
      (j%3?psMid:psBig).emit(m.x,m.y,m.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(L[0],L[1]),G,md,c2[0],c2[1],c2[2]); }
    /* die Flamme im Rohr */
    if(Math.round(t*30)%3===0) psBig.emit(m.x,m.y+0.05,m.z,0,0.6,0,1.5,1.2,.7,0.12,0,0);
    if(p.extra) p.extra(t,m,Q); },0.05);
  if(p.ende) kgSpaeter(D-(p.vorEnde||0.5),()=>p.ende(m));
}
const lHoch=a=>({ang:a||0,dir:FANDIR});
/* Brenndauer am Rohr (s ab Zuendung bis der Himmelseffekt verloschen
   ist): so lange steht die Batterie auf dem Tisch (04c zuendFolge) */
const LICHT_BRENN={breitgold:12,breitsilber:11,breitbluete:11,breitfall:10.5,breitkomet:11,breitblitz:11.5,breitwechsel:10,breitglut:10.5};
/* Goldene Wand: breite Goldfontaene, am Ende ein Goldkomet mit Krone */
LICHTYP.breitgold=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{D:6,H:9.8,weit:0.71,n:26,c:(u,j)=>j%7?GOLDF:kgMal(A,1.3),md:4,ende:()=>LICHTYP.kometenkrone(o,A,B,s*1.05,lHoch())}); };
/* Silberfaecher: weite Silberfontaene, zum Schluss drei Weidenkometen */
LICHTYP.breitsilber=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{D:5.5,H:8.5,weit:0.83,n:26,c:()=>[1.3,1.32,1.4],md:0,life:[0.6,1.1],
  ende:()=>[-0.25,0,0.25].forEach((a,k)=>kgSpaeter(k*0.25,()=>LICHTYP.weidenkomet(o,A,B,s,lHoch(a))))}); };
/* Bluetenfontaene: aus der Goldfontaene steigen einzelne Farbsterne,
   oben am Schluss ein Bluetenkranz */
LICHTYP.breitbluete=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{D:6,H:8.5,weit:0.63,n:22,c:()=>GOLDF,md:4,
  extra:(t,m,Q)=>{ if(Math.random()<0.08){ const c=Math.random()<0.5?A:B, a=rand(-0.4,0.4), w=vFuerHoehe(rand(9,13)*Math.sqrt(s),3.5), v=[Q[0]*Math.sin(a)*w,Math.cos(a)*w,Q[2]*Math.sin(a)*w];
    kgStern(psHuge,m,v,kgMal(c,1.5),lScheitel(v[1],3.5)+rand(0.3,0.6),3.5,0,0.05); } },
  ende:()=>LICHTYP.bluetenkranz(o,A,B,s*1.15,lHoch())}); };
/* Fontaene mit Wasserfall: waehrend sie brennt, ziehen zwei Kometen
   links und rechts einen Goldvorhang darueber */
LICHTYP.breitfall=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{D:6.5,H:9.1,weit:0.69,n:24,c:(u,j)=>j%2?GOLDF:[1.25,1.28,1.35],md:4,vorEnde:3.8,
  ende:()=>{ LICHTYP.goldwasserfall(o,A,B,s*1.1,{ang:0,dir:FANDIR,i:0}); kgSpaeter(1.4,()=>LICHTYP.goldwasserfall(o,A,B,s*1.1,{ang:0,dir:FANDIR,i:1})); }}); };
/* Kometenfontaene: aus der Fontaene steigen abwechselnd links und
   rechts Farbkometen, am Ende ein Zwillingskomet */
LICHTYP.breitkomet=function(o,A,B,s,opt){
  lBreit(o,A,B,s,opt,{D:6.5,H:8.5,weit:0.63,n:22,c:()=>[1.15,.8,.34],md:4,ende:()=>LICHTYP.zwillingskomet(o,A,B,s*1.1,lHoch())});
  for(let k=0;k<6;k++) kgSpaeter(0.7+k*0.85,()=>LICHTYP.farbkomet(o,k%2?B:A,B,s*0.85,lHoch((k%2?1:-1)*0.32)));
};
/* Blitzfontaene: breite Fontaene aus Blinkfunken, am Ende eine Blitzweide */
LICHTYP.breitblitz=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{D:5.5,H:9.1,weit:0.69,n:24,c:(u,j)=>j%3?[1.7,1.7,1.75]:GOLDF,md:1,life:[0.7,1.2],ende:()=>LICHTYP.blitzregen(o,A,B,s*1.1,lHoch())}); };
/* Farbwechsel-Fontaene: A, dann B, dann Gold - am Ende eine Farbcrossette */
LICHTYP.breitwechsel=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{D:6,H:9.1,weit:0.67,n:24,md:0,life:[0.7,1.2],
  c:u=>u<0.33?kgMal(A,1.35):u<0.66?kgMal(B,1.35):GOLDF,ende:()=>LICHTYP.farbcrossette(o,A,B,s*1.1,lHoch())}); };
/* Glutvulkan: sehr breit und niedrig, schwere Glut, die abkuehlt, und
   Knistern darin - danach zwei Crossetten */
LICHTYP.breitglut=function(o,A,B,s,opt){
  lBreit(o,A,B,s,opt,{D:6,H:6.5,G:5,weit:0.85,n:19,md:2,c:()=>[1.3,.62,.16],c2:[.35,.08,.02],life:[1.0,1.6],
    extra:(t,m,Q)=>{ if(Math.random()<0.5){ const a=rand(-0.6,0.6), h=rand(1.5,4.5), d=randDir(); psSmall.emit(m.x+Q[0]*Math.sin(a)*h,m.y+Math.cos(a)*h,m.z+Q[2]*Math.sin(a)*h,d[0]*1.5,d[1]*1.5,d[2]*1.5,1.5,1.4,1.2,rand(0.05,0.12),1,3); } },
    ende:()=>{ LICHTYP.crossette(o,A,B,s,lHoch(-0.2)); kgSpaeter(0.4,()=>LICHTYP.crossette(o,B,A,s,lHoch(0.2))); }});
  for(let k=0;k<8;k++) later(0.8+k*0.6,()=>sfx.prasseln(distVol(o)*0.8));
};

/* Muster (Liste in 02e): drei Schuss je Muster - zwei links und rechts,
   der dritte groesser in der Mitte. Minen stehen nebeneinander auf der
   Batterie. Breite Fontaenen (02.10.): EIN Rohr, eine grosse Fontaene. */
const L_LANG=['blitzregen','blitzkrone','blitzpalme','blitzbluete','kometenkrone','farbkrone','doppelkrone','weidencrossette','farbweidenfaecher','weidenfaecher','weidenfall','torbogen','kaskadenfall'];
LICHT_MUSTER.forEach(([e,nm,form,F,txt])=>{ const id='lm_'+e;
  THEMEN[id]=[[F[0],F[1]],[F[1],F[0]]];
  const P0=L_LANG.includes(e)?6.5:4.5;
  SHOWS[id]=()=>form==='fontaene'?show({},[
      {n:1,licht:e,kal:'gross',th:id,farbe:0,pause:12}])
    :form==='mine'?show({},[
      {n:2,gap:1.4,x:[-0.3,0.3],muster:'v',ang:0.12,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,x:[0],licht:e,kal:'gross',th:id,farbe:1,pause:4.5}])
    :form==='quer'?show({},[
      {n:2,gap:1.6,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,licht:e,kal:'gross',th:id,farbe:1,pause:P0}])
    :show({},[
      {n:2,gap:1.5,muster:'v',ang:0.22,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,licht:e,kal:'gross',th:id,farbe:1,pause:P0}]);
  SIGNATUR[id]={eff:'licht:'+e,text:txt};
});

/* =========================================================
   Lichter-Batterien (01.10., Tom: "bau mir aus den guten Effekten acht
   Batterien, ruhig auch Mix, ruhig groessere").
   02.10. (Tom): Geisterstunde, Silberkaskade, Gewitterfront, Grande
   Lumiere raus. Goldader bleibt (jetzt mit wechselnder Zuendschnur:
   links, rechts, nach innen - und ohne Fontaene am Anfang), Kreuzfeuer
   geht als Grosses Kreuzfeuer ins Sortiment, Bluetenzauber nur noch mit
   den Bluetenformen, die gefallen. Fuenf neue aus den Favoriten - keine
   faengt mit einer Fontaene an, jede hat ihre eigene Verkabelung (02e,
   zuendung) und ihren eigenen Ablauf, Farben je Batterie aus einer
   Familie.
   ========================================================= */
const RF6=[-1,-0.6,-0.2,0.2,0.6,1], RF4=[-1,1,-0.4,0.4];
const lbShow=(id,th,rampe,ph)=>{ THEMEN[id]=th; SHOWS[id]=()=>show({rampe},ph.map(p=>Object.assign({th:id},p))); };
lbShow('lb_goldader',[['gold','orange'],['bernstein','gold'],['zitrone','gold']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:6,gap:0.9,muster:'aussen',ang:0.3,licht:'goldkomet',kal:'mittel',farbe:0},
  {n:10,gap:0.3,muster:'z',ang:0.35,licht:'goldkomet',farbe:1},
  {mit:true,n:4,gap:1.2,rohrFolge:RF4,licht:'glitzermine',farbe:0,pause:1},
  {n:8,takt:[0.15,0.15,0.7],muster:'welle',ang:0.35,licht:'weidenkomet',farbe:0,pause:0.8},
  {n:12,gap:0.12,muster:'wischer',ang:0.45,licht:'goldkomet',farbe:2},
  {mit:true,n:6,gap:0.5,rohrFolge:RF6,licht:'glitzermine',farbe:1,pause:1},
  {n:14,gap:0.2,muster:'w',ang:0.4,licht:'kometenfaecher',farbe:0,pause:0.6},
  {n:16,gap:0.06,muster:'schlag',ang:0.4,licht:'goldkomet',kal:'gross',farbe:1,boden:{k:'volcano',gt:4,A:'gold',B:'bernstein'}},
  {mit:true,n:8,gap:0.15,muster:'mitte',ang:0.15,licht:'weidenkomet',kal:'gross',farbe:0,pause:6}]);
lbShow('kreuzfeuer90',[['gold','rot'],['silber','gruen'],['orange','weiss']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:6,gap:1.0,muster:'aussen',ang:0.3,licht:'crossette',farbe:0},
  {n:10,gap:0.35,muster:'x',ang:0.35,licht:'farbcrossette',farbe:1},
  {mit:true,n:4,gap:0.9,muster:'mitte',ang:0.12,licht:'crossette',kal:'gross',farbe:2,pause:1,boden:{k:'volcano',gt:5,A:'gold',B:'rot'}},
  {n:8,gap:0.6,muster:'v',ang:0.3,licht:'farbkomet',farbe:0},
  {n:12,takt:[0.15,0.15,0.15,0.55],muster:'kreis',ang:0.35,licht:'crossette',farbe:1,pause:0.8},
  {n:16,gap:0.1,muster:'wischer',ang:0.45,licht:'zwillingskomet',farbe:2},
  {mit:true,n:8,gap:0.25,muster:'paar',ang:0.3,licht:'crossette',farbe:0,pause:1},
  {n:12,gap:0.08,muster:'schlag',ang:0.4,licht:'dreifachcrossette',kal:'gross',farbe:1},
  {mit:true,n:8,gap:0.08,muster:'w',ang:0.35,licht:'farbcrossette',kal:'gross',farbe:2},
  {mit:true,n:6,gap:0.2,muster:'mitte',ang:0.15,licht:'crossette',kal:'gross',farbe:2,pause:6}]);
lbShow('lb_bluetenzauber',[['rose','gold'],['gruen','violett'],['tuerkis','magenta']],{sz:[0.9,1.3],pw:[0,2.5],hell:[0.85,1.3],kurve:'linear'},[
  {n:6,gap:0.9,rohrFolge:RF6,licht:'bluetenkranz',farbe:0},
  {n:8,gap:0.5,muster:'paar',ang:0.3,licht:'vierfarbbluete',farbe:1},
  {mit:true,n:4,gap:1,muster:'mitte',ang:0.12,licht:'kranzwelle',farbe:2,pause:1},
  {n:12,takt:[0.15,0.15,0.6],muster:'welle',ang:0.35,licht:'doppelkranz',farbe:1},
  {n:10,gap:0.35,muster:'spirale',ang:0.35,licht:'goldschweifbluete',farbe:0,pause:0.8,boden:{k:'volcano',gt:5,A:'rose',B:'gold'}},
  {n:14,gap:0.1,muster:'wischer',ang:0.4,licht:'bluetenglitzer',farbe:2},
  {mit:true,n:6,gap:0.4,muster:'v',ang:0.3,licht:'bluetendreiklang',farbe:0,pause:1},
  {n:12,gap:0.06,muster:'schlag',ang:0.4,licht:'funkelkranz',kal:'gross',farbe:1},
  {mit:true,n:6,gap:0.25,muster:'mitte',ang:0.15,licht:'wechselbluete',kal:'gross',farbe:2,pause:6}]);
/* Kronjuwelen: eine einzelne Krone eroeffnet in der Stille, dann Rubin
   (rot), Smaragd (gruen) und Saphir (blau) um das Gold - Zuendschnur
   aus der Mitte nach aussen */
lbShow('lb_kronjuwelen',[['gold','rot'],['rot','gruen'],['gruen','gold'],['gold','blau']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:1,licht:'kometenkrone',kal:'gross',farbe:0,pause:1.2},
  {n:6,gap:0.7,muster:'v',ang:0.25,licht:'farbkrone',farbe:1},
  {n:8,gap:0.3,muster:'aussen',ang:0.3,licht:'zwillingskomet',farbe:2},
  {mit:true,n:4,gap:0.9,muster:'mitte',ang:0.15,licht:'doppelkrone',farbe:3,pause:1},
  {n:10,takt:[0.12,0.12,0.5],muster:'welle',ang:0.3,licht:'farbkrone',farbe:2},
  {n:8,gap:0.45,muster:'x',ang:0.3,licht:'kometenkrone',farbe:0,boden:{k:'volcano',gt:5,A:'gold',B:'rot'}},
  {n:12,gap:0.1,muster:'wischer',ang:0.35,licht:'drillingskomet',farbe:1,pause:0.6},
  {n:9,gap:0.08,muster:'schlag',ang:0.35,licht:'farbkrone',kal:'gross',farbe:3},
  {mit:true,n:6,gap:0.2,muster:'kreis',ang:0.3,licht:'doppelkrone',kal:'gross',farbe:0,pause:6}]);
/* Wasserspiele: nur Wasserfaelle in Gold und Silber - Spalte fuer
   Spalte verkabelt, so faellt ein Vorhang nach dem anderen zur selben
   Seite, dann zur anderen */
lbShow('lb_wasserspiele',[['gold','orange'],['silber','gold'],['gold','rot'],['bernstein','gold']],{sz:[0.9,1.25],pw:[0,2],hell:[0.85,1.3],kurve:'spaet'},[
  {n:2,gap:1.2,licht:'goldwasserfall',farbe:0},
  {n:4,gap:0.8,licht:'doppelfall',farbe:0},
  {mit:true,n:2,gap:1.5,licht:'torbogen',kal:'gross',farbe:1,pause:1},
  {n:6,takt:[0.2,0.2,0.9],licht:'wassertor',farbe:2},
  {n:8,gap:0.35,muster:'paar',ang:0.25,licht:'weidenfall',farbe:3},
  {n:6,gap:0.12,licht:'kaskadenfall',farbe:0,pause:0.8,boden:{k:'volcano',gt:6,A:'gold',B:'silber'}},
  {n:10,gap:0.5,muster:'v',ang:0.2,licht:'goldwasserfall',farbe:1},
  {n:6,gap:0.1,muster:'mitte',ang:0.15,licht:'doppelfall',kal:'gross',farbe:0},
  {mit:true,n:4,gap:0.3,licht:'dreifachtor',kal:'gross',farbe:2,pause:7}]);
/* Zwillingsreigen: alles kommt doppelt - Blau, Tuerkis, Violett und Rot
   je mit Gold; Reihe fuer Reihe ueber beide Bloecke */
lbShow('lb_zwillingsreigen',[['blau','gold'],['tuerkis','gold'],['violett','silber'],['rot','gold']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'linear'},[
  {n:2,gap:1.0,muster:'v',ang:0.2,licht:'zwillingsspirale',farbe:1},
  {n:8,gap:0.5,muster:'paar',ang:0.3,licht:'zwillingskomet',farbe:0},
  {n:10,takt:[0.12,0.6],muster:'x',ang:0.35,licht:'drillingskomet',farbe:2},
  {mit:true,n:4,gap:0.8,muster:'mitte',ang:0.15,licht:'kreuzbluete',farbe:3,pause:0.8},
  {n:12,gap:0.25,muster:'aussen',ang:0.35,licht:'zwillingsspirale',farbe:0},
  {n:12,gap:0.1,muster:'w',ang:0.35,licht:'zwillingskomet',farbe:1,boden:{k:'volcano',gt:5,A:'blau',B:'gold'}},
  {n:8,gap:0.45,muster:'kreis',ang:0.3,licht:'farbcrossette',farbe:3,pause:0.6},
  {n:14,gap:0.06,muster:'schlag',ang:0.4,licht:'drillingskomet',kal:'gross',farbe:2},
  {mit:true,n:10,gap:0.15,muster:'v',ang:0.3,licht:'kreuzbluete',kal:'gross',farbe:0,pause:6}]);
/* Blitznacht: die Aufstiege sieht man kaum, erst oben geht das Licht
   an - Weiss, Silber und Gold, eine Spur Magenta; kreuz und quer
   verdrahtet */
lbShow('lb_blitznacht',[['weiss','gold'],['silber','himmel'],['magenta','weiss'],['gold','weiss']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:3,gap:1.4,licht:'blitzregen',kal:'gross',farbe:0},
  {n:6,gap:0.6,muster:'aussen',ang:0.25,licht:'blitzkrone',farbe:1},
  {n:8,takt:[0.1,0.1,0.8],muster:'z',ang:0.3,licht:'blitzbluete',farbe:2},
  {mit:true,n:4,gap:1.0,muster:'mitte',ang:0.12,licht:'blitzpalme',kal:'gross',farbe:3,pause:1},
  {n:10,gap:0.3,muster:'welle',ang:0.3,licht:'blitzregen',farbe:3,boden:{k:'volcano',gt:5,A:'silber',B:'weiss'}},
  {n:8,gap:0.45,muster:'x',ang:0.3,licht:'weidencrossette',farbe:0},
  {n:12,gap:0.08,muster:'wischer',ang:0.35,licht:'blitzkrone',farbe:1,pause:0.6},
  {mit:true,n:9,gap:0.15,muster:'kreis',ang:0.3,licht:'blitzpalme',kal:'gross',farbe:3,pause:6.5}]);
lbShow('lb_glutstrom',[['gold','orange'],['orange','scharlach'],['bernstein','gold'],['scharlach','gold']],{sz:[0.85,1.35],pw:[-1,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:6,gap:0.9,muster:'aussen',ang:0.3,licht:'goldkomet',farbe:0,boden:{k:'volcano',gt:6,A:'gold',B:'orange'}},
  {n:8,gap:0.5,muster:'x',ang:0.35,licht:'goldfaecher',farbe:1},
  {mit:true,n:4,gap:1.1,muster:'mitte',ang:0.12,licht:'weidenkomet',farbe:0,pause:1},
  {n:10,takt:[0.15,0.15,0.6],muster:'welle',ang:0.35,eff:'lavaregen',kal:'mittel',farbe:3},
  {n:14,gap:0.12,muster:'wischer',ang:0.45,licht:'goldkomet',farbe:2,pause:0.6},
  {n:8,gap:0.3,muster:'paar',ang:0.3,licht:'goldwasserfall',kal:'gross',farbe:2},
  {mit:true,n:6,gap:0.4,rohrFolge:RF6,licht:'glitzergold',farbe:0,pause:1},
  {n:8,gap:0.06,muster:'schlag',ang:0.4,eff:'tigerschweif',kal:'gross',farbe:1},
  {mit:true,n:6,gap:0.2,muster:'mitte',ang:0.15,licht:'weidenfaecher',kal:'gross',farbe:0,pause:6}]);
/* Weidenhain: Gold und Bernstein mit einer Spur Rot; eine einzelne Weide
   eroeffnet, das Finale ist kein Knall, sondern ein Vorhang aus Weiden,
   der lange haengt */
lbShow('lb_weidenhain',[['gold','bernstein'],['rot','gold'],['bernstein','gold'],['orange','gold']],{sz:[0.9,1.3],pw:[0,2.5],hell:[0.85,1.3],kurve:'linear'},[
  {n:1,licht:'weidenfaecher',kal:'gross',farbe:0,pause:1.5},
  {n:6,gap:0.9,muster:'v',ang:0.25,licht:'farbweidenfaecher',farbe:1},
  {n:8,gap:0.35,muster:'aussen',ang:0.3,licht:'weidencrossette',farbe:0},
  {mit:true,n:4,gap:1.2,licht:'weidenfall',farbe:2,pause:1},
  {n:10,takt:[0.12,0.12,0.7],muster:'welle',ang:0.3,licht:'weidenfaecher',farbe:2},
  {n:8,gap:0.5,muster:'x',ang:0.3,licht:'farbweidenfaecher',farbe:3,boden:{k:'volcano',gt:6,A:'gold',B:'bernstein'}},
  {n:10,gap:0.1,muster:'mitte',ang:0.25,licht:'weidencrossette',kal:'gross',farbe:1},
  {mit:true,n:9,gap:0.3,licht:'weidenfall',kal:'gross',farbe:0,pause:8}]);
Object.assign(SIGNATUR,{
  lb_goldader:{eff:'licht:goldkomet',text:'Goldkometen, Glitzerminen und Weidenkometen – alles in Gold, mal links, mal rechts'},
  kreuzfeuer90:{eff:'licht:crossette',text:'Crossetten im Kreuz, farbige Zwillingskometen und Dreifach-Crossetten'},
  lb_bluetenzauber:{eff:'licht:bluetenkranz',text:'Blütenminen: Kranz, Doppelkranz, Kranzwelle, Glitzer, Dreiklang'},
  lb_kronjuwelen:{eff:'licht:farbkrone',text:'Kronen aus Gold, Rubin, Smaragd und Saphir'},
  lb_wasserspiele:{eff:'licht:doppelfall',text:'Wasserfälle, Torbögen und Kaskaden in Gold und Silber'},
  lb_zwillingsreigen:{eff:'licht:zwillingsspirale',text:'Alles doppelt: Zwillinge, Drillinge, Spiralen und Kreuzblüten'},
  lb_blitznacht:{eff:'licht:blitzregen',text:'Unsichtbare Aufstiege, oben Blitzweiden, Blitzkronen und Blitzpalmen'},
  lb_glutstrom:{eff:'licht:weidenkomet',text:'Goldkometen, Goldfächer und Goldwasserfall zwischen Tigerkometen und Lavabrocken'},
  lb_weidenhain:{eff:'licht:weidencrossette',text:'Weiden in Gold und Bernstein, das Finale ein hängender Vorhang'}
});

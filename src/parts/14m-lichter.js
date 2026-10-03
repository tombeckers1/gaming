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
  /* 03.10. (Tom: "die Lichter nicht so hell am Himmel"): Sterne mit
     0,85 statt 1,45 - satte Farbe statt weisser Lampen */
  const r1=lMine(o,s,opt,{n:30,H:[10,12],kegel:0.18,ring:true,md:0,nach:[0.3,0.5],spur:0.15,c:()=>kgMal(A,0.85)});
  const r2=lMine(o,s,opt,{n:40,H:[12,14],kegel:0.42,ring:true,md:0,nach:[0.3,0.5],spur:0.15,c:()=>kgMal(B,0.85)});
  r1.out.forEach(({h,T})=>kgSpaeter(T*0.62,()=>kgFarbe(h,kgMal(B,0.9))));
  r2.out.forEach(({h,T})=>kgSpaeter(T*0.62,()=>kgFarbe(h,kgMal(A,0.9))));
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
  if(p.schuss) return lKometenFaecher(o,A,B,s,p);
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
/* Faecherkometen (03.10., Tom mit Festival-Fotos: "diese ganz hellen
   ... breiten Fontaenen" - im Fachhandel Kometen-Faecher): aus EINEM
   Rohr steigen dicke, sehr helle Kometen 15-45 m hoch, jeder zieht
   einen dichten Funkenschweif (Gold: Brokat-Glitzer, Silber: Titan),
   der stehen bleibt und langsam absinkt; farbige Koepfe (rot, blau ...)
   tragen trotzdem den Goldschweif wie auf dem Festivalbild. Abfolge je
   Batterie verschieden (muster): faecher = ganze Faecher im Takt,
   wisch = einzeln hin und her schwenkend, v = Paare von innen nach
   aussen, stufen = jede Salve breiter, kreuz = abwechselnd schraeg von
   links/rechts. Farben aus c(u,j), Hoehe aus H, am Schluss ende(). */
const KF_MUSTER=['faecher','wisch','v','stufen','kreuz'];
/* Schweifart je Abfolge - jede Batterie sieht anders aus (Anomalie):
   faecher Gold-Brokat, wisch kurzer Silber-Titan, v Blinker, stufen
   schwere Glut, die lange haengt, kreuz knisternd. L: Brenndauer der
   Linie, b: Begleitfunken {life,g,streu,mode,ps}, kn: Knisteranteil */
const KF_ART={
  faecher:{L:[0.55,1.15],b:{life:[0.8,1.5],g:1.1,streu:0.4,mode:4},kn:0.05,ton:'rieseln'},
  wisch:{L:[0.25,0.5],b:{life:[0.25,0.5],g:3.2,streu:1.2,mode:0},kn:0.02,ton:'zischen'},
  v:{L:[0.45,0.8],b:{life:[0.5,0.9],g:0.4,streu:0.25,mode:1},kn:0.03,ton:'pfeif'},
  stufen:{L:[1.3,2.2],b:{life:[1.6,2.6],g:0.3,streu:0.15,mode:2},kn:0.02,ton:'thump'},
  kreuz:{L:[0.6,1.0],b:{life:[0.15,0.35],g:5,streu:2.5,mode:4,ps:'klein'},kn:0.22,ton:'crackle'}};
function kfKomet(m,Q,a,c,Hk,G,md,dx,art){ art=art||KF_ART.faecher;
  const v0=vFuerHoehe(Hk*rand(0.9,1.04)*(1-Math.abs(a)*0.3),G), e=dx?{x:m.x+Q[0]*dx,y:m.y,z:m.z+Q[2]*dx}:m, tf=rand(-0.06,0.06);
  const v=[Q[0]*Math.sin(a)*v0-Q[2]*tf*v0,Math.cos(a)*v0,Q[2]*Math.sin(a)*v0+Q[0]*tf*v0], T=lScheitel(v[1],G)*rand(0.82,0.95);
  const gold=c[0]>0.9&&c[1]>0.45&&c[2]<0.45, silber=c[0]+c[1]+c[2]>3.4&&!gold, sch=silber?[1.3,1.3,1.38]:GOLDF, mode=silber?0:(md===undefined?4:md);
  const q=Math.min(1,0.5+0.5*QUAL());
  lKopf(e,v,silber||gold?kgMal(c,1.3):lHell(c,1.7),T,G,0,0.5);
  /* der Schweif (03.10., Tom mit dem Defqon-Foto): der Kopf zieht eine
     helle, zackige Linie, die stehen bleibt und knisternd verglueht -
     die Zacken entstehen, weil der brennende Satz im Flug unruhig
     schlingert (Zufallsweg quer zur Flugbahn) */
  kfZackSchweif(e,v,G,T,kgMal(sch,1.35),q,art);
  /* darum der Brokat: langlebige Glitzerfunken, die absinken */
  const bb=art.b; rkFunken(e,v,G,0.05,T,Math.round(28*q),sch,{ps:bb.ps==='klein'?psSmall:psMid,life:bb.life,g:bb.g,streu:bb.streu,mit:0.03,mode:silber?0:(md===undefined?bb.mode:md)});
  muendungsblitz(e,e.y,0.55);
}
function kfZackSchweif(e,v,G,T,c,q,art){ art=art||KF_ART.faecher; const LL=art.L, kn=art.kn;
  const [R,O]=rkBild(e), tag=FW_TAG, DT=1/30, A=rand(0.35,0.7), n=q>0.9?2:1;
  let off=[0,0], vo=[0,0], alt=null;
  for(let t=DT;t<T;t+=DT){ const tt=t;
    vo=[vo[0]*0.6+rand(-1,1)*A*0.5,vo[1]*0.6+rand(-1,1)*A*0.5]; off=[clamp(off[0]+vo[0]*0.35,-A,A),clamp(off[1]+vo[1]*0.35,-A,A)];
    const o0=off.slice();
    imBild(tt,()=>{ const at=FW_TAG, sa=SCHWEIF; FW_TAG=tag; SCHWEIF=0.42;
      /* jeder Punkt zieht eine kurze Spur in Flugrichtung - die Punkte
         ueberlappen zu einer durchgehenden Linie statt einer Perlenkette */
      const w=bahnTempo(v,G,tt), b=bahnOrt(e,v,G,tt), k=Math.min(1,tt/0.25), p={x:b.x+(R[0]*o0[0]+O[0]*o0[1])*k,y:b.y+(R[1]*o0[0]+O[1]*o0[1])*k,z:b.z+(R[2]*o0[0]+O[2]*o0[1])*k};
      const von=alt||p;
      for(let i=0;i<n;i++){ const f=(i+Math.random())/n, x=von.x+(p.x-von.x)*f, y=von.y+(p.y-von.y)*f, z=von.z+(p.z-von.z)*f, L=rand(LL[0],LL[1]);
        psBig.emit(x,y,z,w[0]*0.12+rand(-.06,.06),w[1]*0.12+rand(-.12,.04),w[2]*0.12+rand(-.06,.06),c[0],c[1],c[2],L,0.35,0);
        /* Knistern: einzelne Punkte im stehenden Schweif blitzen spaeter auf */
        if(Math.random()<kn*q) kgSpaeter(rand(0.25,0.8),()=>psSmall.emit(x,y-0.2,z,rand(-.5,.5),rand(-.5,.3),rand(-.5,.5),1.6,1.5,1.3,rand(0.06,0.14),1,1)); }
      alt=p; SCHWEIF=sa; FW_TAG=at; }); }
}
function lKometenFaecher(o,A,B,s,p){
  const m=lMund(o), D=p.D||6, G=7.5, Hk=Math.max(13,Math.min(44,(p.H||9)*3.3*Math.sqrt(s))), Q=lQuer({dir:FANDIR}),
    W=Math.min(0.8,(p.weit||0.6)*1.1), mu=p.muster||KF_MUSTER[(p.saat||0)%KF_MUSTER.length], plan=[], E=D-0.4;
  if(mu==='faecher'){ const nS=p.n>20?7:5; for(let t=0,k=0;t<E;t+=0.75,k++) for(let j=0;j<nS;j++) plan.push({t:t+j*0.025,a:((j+0.5)/nS-0.5)*2*W,j:j+k*nS}); }
  else if(mu==='wisch'){ const P=1.5; for(let t=0,k=0;t<E;t+=0.12,k++){ const f=(t/P)%1; plan.push({t,a:W*(1-4*Math.abs(f-0.5)),j:k}); } }
  else if(mu==='v'){ for(let t=0,k=0;t<E;t+=0.2,k++){ const a=W*((k%5)+0.6)/5.2; plan.push({t,a,j:2*k},{t,a:-a,j:2*k+1}); } }
  else if(mu==='stufen'){ const K=Math.max(3,Math.floor(E/0.8)); for(let k=0;k<K;k++){ const nS=3+Math.min(5,k), w=W*(0.3+0.7*k/(K-1)); for(let j=0;j<nS;j++) plan.push({t:k*0.8,a:((j+0.5)/nS-0.5)*2*w,j:j+k*8}); } }
  else { for(let t=0,k=0;t<E;t+=0.24,k++){ const r=k%2?1:-1; plan.push({t,a:-r*rand(0.25,W),dx:r*0.35,j:k}); } }
  const max=Math.round(28*Math.min(1,0.5+0.5*QUAL())), schritt=plan.length>max?plan.length/max:1;
  lStart(m,1.0,0.3);
  for(let i=0;i<plan.length;i+=schritt){ const z=plan[Math.floor(i)], u=z.t/D;
    kgSpaeter(z.t,()=>{ kfKomet(m,Q,z.a,p.c(u,z.j),Hk,G,p.md,z.dx,KF_ART[mu]); const v=distVol(m); if(Math.random()<0.6) (sfx.rakPff?sfx.rakPff(v*0.5):sfx.thump(v*0.2)); }); }
  later(0.4,()=>sfx.fauchen(distVol(m)*0.35,Math.min(4,D)));
  { const ton=(KF_ART[mu]||KF_ART.faecher).ton; for(let k=0;k<Math.floor(D/0.6);k++) later(0.9+k*0.6,()=>{ const v=distVol(m)*0.35, f=sfx[ton];
      if(ton==='zischen'||ton==='rieseln') f&&f(v,0.5); else if(ton==='pfeif') (sfx.pfeif||sfx.zischen)(v*0.6,0.4); else f&&f(v); }); }
  /* Rauch, den die Kometen von innen anleuchten (Defqon-Foto): ein
     Schein in Kopffarbe, darunter grauer Pulverrauch, der aufsteigt */
  if(typeof wolke==='function'){ const sp=[wolkenSprite(true),wolkenSprite(true),wolkenSprite(false)], cc=mischF(p.c(0.3,1),[1,.45,.15],0.5);
    wolke(D+3,sp,(w,t)=>{ const an=Math.min(1,t/1.2)*(1-glatt(D,D+3,t)), fl=0.8+0.2*Math.sin(t*9);
      wSetz(sp[0],m.x,m.y+Hk*0.22,m.z,Hk*0.55,cc,0.032*an*fl); wSetz(sp[1],m.x,m.y+Hk*0.45,m.z,Hk*0.75,cc,0.016*an*fl);
      wSetz(sp[2],m.x,m.y+3+t*0.7,m.z,8+t*1.6,[.3,.27,.26],0.16*an); }); }
  if(p.ende) kgSpaeter(D-(p.vorEnde||0.5),()=>p.ende(m));
}
/* Breite Bodenfontaene der Batterien (03.10., Tom: "die kleine Funken-
   fontaene am Anfang, die 1-3 m hoch geht, ersetzen durch grosse breite
   Fontaenen ... auch in anderen Farben, nicht nur Gold"). Ersetzt in
   playShow (14b bodenAn) die alten Boden-Emitter fountain, volcano,
   torte, farbtorte und knisterbrunnen. Hoehe waechst mit dem Level
   (Kinderbatterie ~5 m, Profi ~9 m), die Farbe kommt aus dem Thema der
   Batterie - jede Batterie hat ihre eigene Fontaene (stil nach Saat):
   0 Goldglitzer, 1 Farbsterne im Gold, 2 zwei Farben links/rechts,
   3 Silber mit Farbspitzen; Knisterbrunnen knistert, Farbtorte farbig. */
const BREIT_BODEN={fountain:1,volcano:1,torte:1,farbtorte:1,knisterbrunnen:1};
const lHell=(c,k)=>kgMal(c,k/Math.max(0.6,Math.max(c[0],c[1],c[2])));
function breitBoden(o,A,B,p){
  const lvl=p.lvl||10, gross=p.k==='volcano', klein=p.k==='torte'||p.k==='farbtorte';
  const H=Math.max(4.5,Math.min(9.6,3.6+lvl*0.23+(gross?1:0)-(klein?0.6:0))), D=Math.max(4,Math.min(9,p.D||5));
  /* Goldfamilie (Gold, Orange, Bernstein, Zitrone) und Neutrales (Weiss, Silber) */
  const gold=c=>!c||(c[0]>0.9&&c[1]>0.45&&c[2]<0.4), neutral=c=>c[0]+c[1]+c[2]>2.6, bunt=c=>c&&!gold(c)&&!neutral(c), silb=[1.3,1.32,1.4];
  /* Farben: die Themenfarben der Batterie, wenn der Boden nur Gold/Weiss sagt */
  const T=p.T||[A,B], L=[A,B,T[0],T[1]].filter(bunt), F1=L[0]||A, F2=L.find(c=>c!==F1)||F1;
  const stil=p.k==='knisterbrunnen'?'knister':p.k==='farbtorte'?'farbe':p.k==='torte'?'silber':['gold','farbe','zwei','silber'][(p.saat||0)%4];
  const fk=!L.length&&stil!=='knister'?(stil==='silber'?'silber':'gold'):stil;
  const q={D,H,weit:gross?0.7:0.62,n:gross?24:20,md:4,life:[0.8,1.3]};
  if(fk==='gold') q.c=(u,j)=>GOLDF;
  else if(fk==='farbe'){ q.md=0; q.c=(u,j)=>j%3?lHell(F1,1.45):GOLDF; }
  else if(fk==='zwei'){ q.md=0; q.c=(u,j)=>j%4===3?GOLDF:lHell(j%2?F1:F2,1.45); }
  else if(fk==='silber'){ q.md=0; q.c=(u,j)=>j%4||!L.length?silb:lHell(F1,1.5); }
  else { q.md=0; q.c=()=>silb; q.life=[0.6,1.0];
    q.extra=(t,m,Q)=>{ if(Math.random()<0.6){ const a=rand(-0.5,0.5), h=rand(0.4,0.9)*H, d=randDir(); psSmall.emit(m.x+Q[0]*Math.sin(a)*h,m.y+Math.cos(a)*h,m.z+Q[2]*Math.sin(a)*h,d[0]*1.5,d[1]*1.5,d[2]*1.5,1.5,1.45,1.3,rand(0.05,0.12),1,3); } };
    for(let k=0;k<Math.floor(D/0.7);k++) later(0.5+k*0.7,()=>sfx.prasseln(distVol(o)*0.6)); }
  q.schuss=true; q.saat=p.saat; lBreit(o,A,B,1,{},q);
}
/* Brenndauer am Rohr (s ab Zuendung bis der Himmelseffekt verloschen
   ist): so lange steht die Batterie auf dem Tisch (04c zuendFolge) */
const LICHT_BRENN={breitfarbew:11,breitfarbef:11,breitsilber:11,breitbluete:11,breitkomet:11,breitblitz:11.5,breitwechsel:10,breitglut:10.5,breitfarbe:11,breitregen:11.5,breitcross:11,breittor:11.5,breitklein:6,breitglitzer:6.5};
/* Silberfaecher: weite Silberfontaene, zum Schluss drei Weidenkometen */
LICHTYP.breitsilber=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'wisch',D:5.5,H:8.5,weit:0.83,n:26,c:()=>[1.3,1.32,1.4],md:0,life:[0.6,1.1],
  ende:()=>[-0.25,0,0.25].forEach((a,k)=>kgSpaeter(k*0.25,()=>LICHTYP.weidenkomet(o,A,B,s,lHoch(a))))}); };
/* Bluetenfontaene: aus der Goldfontaene steigen einzelne Farbsterne,
   oben am Schluss ein Bluetenkranz */
LICHTYP.breitbluete=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'faecher',D:6,H:8.5,weit:0.63,n:22,c:()=>GOLDF,md:4,
  extra:(t,m,Q)=>{ if(Math.random()<0.08){ const c=Math.random()<0.5?A:B, a=rand(-0.4,0.4), w=vFuerHoehe(rand(9,13)*Math.sqrt(s),3.5), v=[Q[0]*Math.sin(a)*w,Math.cos(a)*w,Q[2]*Math.sin(a)*w];
    kgStern(psHuge,m,v,kgMal(c,1.5),lScheitel(v[1],3.5)+rand(0.3,0.6),3.5,0,0.05); } },
  ende:()=>LICHTYP.bluetenkranz(o,A,B,s*1.15,lHoch())}); };
/* Kometenfontaene: aus der Fontaene steigen abwechselnd links und
   rechts Farbkometen, am Ende ein Zwillingskomet */
LICHTYP.breitkomet=function(o,A,B,s,opt){
  lBreit(o,A,B,s,opt,{schuss:true,muster:'kreuz',D:6.5,H:8.5,weit:0.63,n:22,c:()=>[1.15,.8,.34],md:4,ende:()=>LICHTYP.zwillingskomet(o,A,B,s*1.1,lHoch())});
  for(let k=0;k<6;k++) kgSpaeter(0.7+k*0.85,()=>LICHTYP.farbkomet(o,k%2?B:A,B,s*0.85,lHoch((k%2?1:-1)*0.32)));
};
/* Blitzfontaene: breite Fontaene aus Blinkfunken, am Ende eine Blitzweide */
LICHTYP.breitblitz=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'v',D:5.5,H:9.1,weit:0.69,n:24,c:(u,j)=>j%3?[1.7,1.7,1.75]:GOLDF,md:1,life:[0.7,1.2],ende:()=>LICHTYP.blitzregen(o,A,B,s*1.1,lHoch())}); };
/* Farbwechsel-Fontaene: A, dann B, dann Gold - am Ende eine Farbcrossette */
LICHTYP.breitwechsel=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'stufen',D:6,H:9.1,weit:0.67,n:24,md:0,life:[0.7,1.2],
  c:u=>u<0.33?kgMal(A,1.35):u<0.66?kgMal(B,1.35):GOLDF,ende:()=>LICHTYP.farbcrossette(o,A,B,s*1.1,lHoch())}); };
/* Glutvulkan (03.10., Tom: "nur die breiten Fontaenen, die hochgehen,
   sind schoen - nicht das unten am Boden"): eine hohe Fontaene aus
   Glut, die oben abkuehlt; das Knistern sitzt in der Krone, nichts
   liegt mehr breit am Boden - danach zwei Crossetten */
LICHTYP.breitglut=function(o,A,B,s,opt){
  lBreit(o,A,B,s,opt,{schuss:true,muster:'faecher',D:6,H:9.4,G:4,weit:0.5,n:22,md:2,c:()=>[1.3,.62,.16],c2:[.35,.08,.02],life:[1.0,1.5],
    extra:(t,m,Q)=>{ if(Math.random()<0.45){ const a=rand(-0.45,0.45), h=rand(6.5,9)*Math.sqrt(s), d=randDir(); psSmall.emit(m.x+Q[0]*Math.sin(a)*h,m.y+Math.cos(a)*h,m.z+Q[2]*Math.sin(a)*h,d[0]*1.5,d[1]*1.5,d[2]*1.5,1.5,1.4,1.2,rand(0.05,0.12),1,3); } },
    ende:()=>{ LICHTYP.crossette(o,A,B,s,lHoch(-0.2)); kgSpaeter(0.4,()=>LICHTYP.crossette(o,B,A,s,lHoch(0.2))); }});
  for(let k=0;k<8;k++) later(0.8+k*0.6,()=>sfx.prasseln(distVol(o)*0.6));
};

/* =========================================================
   03.10. (Tom): "Blitzpalme finde ich geil - gerne mehrere Effekte
   davon", "Blitzweide als Effekt gut", farbige breite Fontaenen,
   Kinderfontaenen. Neue Lichter fuer die Sortiments-Batterien unten.
   ========================================================= */
/* Palme aus dem dunklen Aufstieg: n Arme, Kopf(k), Schweif(k), am Ende
   ende(q,k,dv) kurz vor dem Verloeschen */
function lPalme(e,s,p){
  const a0=rand(0,Math.PI*2), n=p.n||8, G=p.G||3.0, L=p.L||2.8;
  for(let k=0;k<n;k++){ const a=a0+k*2*Math.PI/n+(p.dreh||0), w=(p.w||8)*Math.sqrt(s)*(p.wk?p.wk(k):1), dv=[Math.cos(a)*w,p.hoch||3.2,Math.sin(a)*w];
    lKopf(e,dv,p.kopf(k),L,G,0,p.spur||0.5);
    lFunken(e,dv,G,0.05,L,p.rate||55,p.schweif(k),{ps:psMid,life:p.life||[0.9,1.5],g:p.g||1.4,streu:0.12,mit:0.05,mode:p.md===undefined?4:p.md,spur:p.fspur});
    if(p.ende) kgSpaeter(L-0.7,()=>p.ende(sternNach(e,dv[0],dv[1],dv[2],G,L-0.7),k,dv)); }
}
const lZerstieb=(q,c,n,w)=>{ for(let j=0;j<n;j++){ const d=randDir(); kgStern(psHuge,q,[d[0]*w,d[1]*w,d[2]*w],c,rand(0.5,0.9),1.2,1,0); } };
/* Farbpalme mit Blitzen: Farbkoepfe A an goldenen Wedeln, die Enden
   zerstieben in B und Weiss */
LICHTYP.farbblitzpalme=function(o,A,B,s,opt){
  lDunkel(o,s,opt,25,e=>{ lPalme(e,s,{kopf:()=>kgMal(A,1.45),schweif:()=>GOLDF,ende:(q,k)=>lZerstieb(q,k%2?[1.9,1.9,2]:kgMal(B,1.9),5,1.6)});
    schall(e,x=>{ sfx.plopp(x*0.5,0.9); later(1.8,()=>sfx.crackle(x*0.3)); }); });
};
/* Koenigspalme: zwoelf Wedel, in der Mitte haengt eine kleine Silber-
   krone, die Enden blitzen nacheinander rundherum */
LICHTYP.koenigspalme=function(o,A,B,s,opt){
  lDunkel(o,s,opt,27,e=>{ lPalme(e,s,{n:12,w:8.6,L:3.0,kopf:()=>kgMal(A,1.3),schweif:()=>GOLDF,rate:45,
      ende:(q,k)=>kgSpaeter(k*0.06,()=>lZerstieb(q,kgMal(B,1.9),4,1.5))});
    for(let i=0;i<Math.round(24*QUAL());i++){ const a=rand(0,Math.PI*2), w=rand(1.8,2.8)*Math.sqrt(s); kgStern(psBig,e,[Math.cos(a)*w,rand(0.5,1.5),Math.sin(a)*w],[1.4,1.4,1.45],rand(2.4,3),1.6,4,0.3); }
    schall(e,x=>{ sfx.plopp(x*0.55,0.85); later(0.3,()=>sfx.rieseln(x*0.45,3)); later(2.2,()=>sfx.crackle(x*0.35)); }); });
};
/* Palmenweide: die Wedel haengen lang wie eine Weide, an ihnen entlang
   zucken Blitze (Blitzweide und Blitzpalme in einem) */
LICHTYP.palmenweide=function(o,A,B,s,opt){
  lDunkel(o,s,opt,26,e=>{ const arme=[];
    lPalme(e,s,{n:9,w:7.2,hoch:3.6,L:4.2,G:1.9,g:0.7,md:0,fspur:0.22,life:[1.6,2.4],rate:40,kopf:()=>[1.3,.85,.4],schweif:()=>kgMal(A,0.95),ende:(q)=>lZerstieb(q,[1.9,1.9,2],3,1.2)});
    const a0=rand(0,Math.PI*2); for(let k=0;k<9;k++){ const a=a0+k*2*Math.PI/9; arme.push([Math.cos(a)*7.2*Math.sqrt(s),3.6,Math.sin(a)*7.2*Math.sqrt(s)]); }
    for(let t=0.6;t<3.8;t+=0.12){ const tt=t; kgSpaeter(tt,()=>{ const dv=arme[Math.floor(Math.random()*arme.length)], q=sternNach(e,dv[0],dv[1],dv[2],1.9,tt*rand(0.4,0.95)); lBlitz(q,kgMal(B,1.9)); }); }
    schall(e,x=>{ sfx.plopp(x*0.45,1.0); later(0.5,()=>sfx.rieseln(x*0.5,4)); }); });
};
/* Stufenpalme: jeder Wedel teilt sich am Ende in drei Blinksterne, die
   langsam fallen - eine Palme, die zweimal aufgeht */
LICHTYP.stufenpalme=function(o,A,B,s,opt){
  lDunkel(o,s,opt,25,e=>{ lPalme(e,s,{n:7,w:7.6,L:2.2,kopf:()=>kgMal(A,1.35),schweif:()=>GOLDF,
      ende:(q,k,dv)=>kgSpaeter(0.5,()=>{ const b0=Math.atan2(dv[2],dv[0]); for(const d of [-0.5,0,0.5]){ const b=b0+d; kgStern(psBig,q,[Math.cos(b)*3,1.4,Math.sin(b)*3],kgMal(B,1.7),rand(1.6,2.1),1.4,1,0.2); } schall(q,x=>sfx.crack(x*0.25)); })});
    schall(e,x=>sfx.plopp(x*0.5,0.95)); });
};
/* Doppelpalme: innen eine kleine Goldpalme, eine halbe Sekunde spaeter
   aussen eine grosse in A, versetzt - die Enden blitzen */
LICHTYP.doppelpalme=function(o,A,B,s,opt){
  lDunkel(o,s,opt,26,e=>{ lPalme(e,s,{n:6,w:5,L:2.4,kopf:()=>[1.4,1.0,.45],schweif:()=>GOLDF,ende:q=>lZerstieb(q,[1.9,1.9,2],3,1.3)});
    kgSpaeter(0.45,()=>{ const e2={x:e.x,y:e.y+0.8,z:e.z}; lPalme(e2,s,{n:10,w:9,L:3.0,dreh:0.3,kopf:()=>kgMal(A,1.45),schweif:()=>mischF(A,GOLDF,0.6),ende:q=>lZerstieb(q,kgMal(B,1.9),5,1.7)}); schall(e2,x=>sfx.plopp(x*0.45,0.8)); });
    schall(e,x=>{ sfx.plopp(x*0.4,1.1); later(2.4,()=>sfx.crackle(x*0.4)); }); });
};
/* Blitzweide-Varianten fuer die Blitzweiden-Batterien */
function lBlitzweide(e,s,gold,funk,blitz,n,dauer){
  const arme=[], N=Math.round((n||34)*QUAL());
  for(let i=0;i<N;i++){ const d=randDir(), w=rand(6,7.5)*Math.sqrt(s), dv=[d[0]*w,d[1]*w*0.5+1.2,d[2]*w], L=rand(3.8,4.6);
    kgStern(psBig,e,dv,gold,L,1.8,0,0.45);
    lFunken(e,dv,1.8,0.1,L,20,funk,{ps:psMid,life:[1.4,2.2],g:0.6,streu:0.08,mit:0.02,mode:0,spur:0.2}); arme.push(dv); }
  for(let t=0.45;t<(dauer||3.4);t+=0.09){ const tt=t; kgSpaeter(tt,()=>{ const dv=arme[Math.floor(Math.random()*arme.length)], q=sternNach(e,dv[0],dv[1],dv[2],1.8,tt); lBlitz(q,typeof blitz==='function'?blitz():blitz); }); }
  schall(e,x=>{ sfx.plopp(x*0.4,1.1); later(0.4,()=>sfx.rieseln(x*0.5,4)); });
}
/* Farbblitzweide: die Weide haengt in Farbe A, Blitze weiss und B */
LICHTYP.farbblitzweide=function(o,A,B,s,opt){ lDunkel(o,s,opt,27,e=>lBlitzweide(e,s,kgMal(A,1.15),mischF(A,[.95,.6,.22],0.5),()=>Math.random()<0.6?[1.9,1.9,2]:kgMal(B,1.9))); };
/* Silberblitzweide: eine silberne Weide, in der farbige Blitze zucken */
LICHTYP.silberblitzweide=function(o,A,B,s,opt){ lDunkel(o,s,opt,28,e=>lBlitzweide(e,s,[1.15,1.18,1.25],[.7,.72,.8],()=>kgMal(Math.random()<0.5?A:B,1.9),38,3.8)); };

/* --- Breite Fontaenen in Farbe (03.10., Tom: "die Fontaenen sind meistens
   Gold - mach die auch in anderen Farben") --- */
/* Farbfontaene: Farbsterne A im Goldglitzer, am Ende eine Farbkrone */
LICHTYP.breitfarbe=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'v',D:6,H:9,weit:0.64,n:24,md:0,life:[0.8,1.3],c:(u,j)=>j%3?lHell(A,1.45):GOLDF,ende:()=>LICHTYP.farbkrone(o,A,B,s*1.05,lHoch())}); };
/* Goldregenfontaene: Goldglitzer, am Ende sinkt ein goldener Regen
   (Weidenfaecher) */
/* 03.10. (Anomalie): Farbkometen in anderen Abfolgen - Palast: einzeln
   schwenkende Titan-Kometen mit Farbkopf; Farbenpracht: ganze Faecher
   mit Gold-Brokat und Farbkopf */
LICHTYP.breitfarbew=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'wisch',D:6,H:10,weit:0.7,n:24,md:0,c:(u,j)=>j%2?lHell(A,1.5):lHell(B,1.5),ende:()=>LICHTYP.farbkrone(o,A,B,s,lHoch())}); };
LICHTYP.breitfarbef=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'faecher',D:6,H:9.5,weit:0.75,n:24,md:4,c:(u,j)=>j%3===1?GOLDF:lHell(j%3?A:B,1.5),ende:()=>LICHTYP.farbcrossette(o,A,B,s,lHoch())}); };
LICHTYP.breitregen=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'faecher',D:6.5,H:9.2,weit:0.6,n:24,md:4,c:()=>GOLDF,ende:()=>LICHTYP.weidenfaecher(o,A,B,s*1.05,lHoch())}); };
/* Kreuzfontaene: Silber mit Farbspitzen, am Ende zwei Weidencrossetten */
LICHTYP.breitcross=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'kreuz',D:6,H:8.8,weit:0.66,n:24,md:0,life:[0.7,1.2],c:(u,j)=>j%4?[1.3,1.32,1.4]:lHell(A,1.5),
  ende:()=>{ LICHTYP.weidencrossette(o,A,B,s,lHoch(-0.18)); kgSpaeter(0.35,()=>LICHTYP.weidencrossette(o,A,B,s,lHoch(0.18))); }}); };
/* Torfontaene: zwei Farben links und rechts im Faecher, am Ende ein
   Dreifachtor */
LICHTYP.breittor=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'stufen',D:6.5,H:9.2,weit:0.7,n:26,md:0,life:[0.8,1.3],vorEnde:1.5,c:(u,j)=>j%4===3?GOLDF:lHell(j%2?A:B,1.45),ende:()=>LICHTYP.dreifachtor(o,A,B,s,{ang:0,dir:FANDIR,i:0})}); };
/* Kinderfontaenen: niedrig, weich, ohne Himmelseffekt - zwei Farben im
   Wechsel bzw. Goldglitzer mit Farbspitzen */
LICHTYP.breitklein=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'wisch',D:5,H:4.6,G:4,weit:0.56,n:16,md:0,life:[0.7,1.1],c:(u,j)=>j%5===4?GOLDF:lHell(u<0.5===!(j%2)?A:B,1.4)}); };
LICHTYP.breitglitzer=function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,{schuss:true,muster:'faecher',D:5.5,H:5.2,G:4,weit:0.6,n:18,md:4,life:[0.8,1.2],c:(u,j)=>j%4?GOLDF:lHell(A,1.4)}); };

/* =========================================================
   Lichter-Batterien im Sortiment (03.10., Tom).
   Geblieben: Goldader, Weidenhain (jetzt im Sortiment), Grosses
   Kreuzfeuer. Raus: Bluetenzauber, Kronjuwelen, Wasserspiele,
   Zwillingsreigen, Blitznacht, Glutstrom und die Lichter-Muster.
   Neu, in drei Stufen ("nicht alles immer peng, peng, peng, sondern
   auch einfach nur schoen"):
   - Kinder: Regenbogenbrunnen, Glitzergarten - nur kleine Fontaenen
     und leise Glitzerminen
   - Mittel: Fontaenenballett, Goldregen
   - High-End: Fontaenenpalast, Farbenpracht
   - dazu zwei Blitzweiden-Batterien (Blitzweiden, Silbergewitter) und
     eine Blitzpalmen-Batterie
   Jede hat ihre eigene Verkabelung (02e zuendung), ihre eigene Folge
   und ihre Farbfamilie.
   ========================================================= */
const RF6=[-1,-0.6,-0.2,0.2,0.6,1], RF4=[-1,1,-0.4,0.4], RF3=[-1,0,1], RF7=[-1,1,-0.66,0.66,-0.33,0.33,0];
const lbShow=(id,th,rampe,ph)=>{ THEMEN[id]=th; SHOWS[id]=()=>show({rampe},ph.map(p=>Object.assign({th:id},p))); };
lbShow('lb_goldader',[['gold','orange'],['bernstein','gold'],['zitrone','gold']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:6,gap:0.9,muster:'aussen',ang:0.3,licht:'goldkomet',kal:'mittel',farbe:0},
  {n:10,gap:0.3,muster:'z',ang:0.35,licht:'goldkomet',farbe:1},
  {mit:true,n:4,gap:1.2,rohrFolge:RF4,licht:'glitzermine',farbe:0,pause:1},
  {n:8,takt:[0.15,0.15,0.7],muster:'welle',ang:0.35,licht:'weidenkomet',farbe:0,pause:0.8},
  {n:2,gap:0.6,rohrFolge:[-1,1],licht:'breitregen',kal:'mittel',farbe:0,pause:1.5},
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

/* --- Kinder: nur kleine breite Fontaenen und leises Glitzern --- */
/* Regenbogenbrunnen: sieben kleine Fontaenen, jede in ihrer Regenbogen-
   farbe, von links nach rechts - zum Schluss drei zugleich */
lbShow('lb_regenbogenbrunnen',[['rot','orange'],['orange','zitrone'],['zitrone','limette'],['gruen','tuerkis'],['tuerkis','blau'],['blau','violett'],['violett','rose'],['rose','zitrone']],{sz:[0.9,1.1],pw:[0,0],hell:[0.9,1.15],kurve:'linear'},[
  {n:1,rohrFolge:[-1],licht:'breitklein',kal:'mittel',farbe:0,pause:0.5},
  {n:1,rohrFolge:[-0.66],licht:'breitklein',kal:'mittel',farbe:1,pause:0.5},
  {n:1,rohrFolge:[-0.33],licht:'breitklein',kal:'mittel',farbe:2,pause:0.5},
  {n:1,rohrFolge:[0],licht:'breitklein',kal:'mittel',farbe:3,pause:0.5},
  {n:1,rohrFolge:[0.33],licht:'breitklein',kal:'mittel',farbe:4,pause:0.5},
  {n:1,rohrFolge:[0.66],licht:'breitklein',kal:'mittel',farbe:5,pause:0.5},
  {n:1,rohrFolge:[1],licht:'breitklein',kal:'mittel',farbe:6,pause:1.2},
  {n:3,gap:0.15,rohrFolge:[-1,1,0],licht:'breitklein',kal:'gross',farbe:7,pause:5}]);
/* Glitzergarten: Goldglitzer-Fontaenen mit Farbspitzen, darueber leise
   Bluetenglitzer-Minen in Pastell */
lbShow('lb_glitzergarten',[['rose','gold'],['aqua','gold'],['limette','rose'],['himmel','rose']],{sz:[0.75,0.95],pw:[0,0],hell:[0.85,1.1],kurve:'linear'},[
  {n:2,gap:1.2,rohrFolge:[-1,1],licht:'breitglitzer',kal:'mittel',farbe:0,pause:1},
  {mit:true,n:3,gap:1.4,rohrFolge:RF3,licht:'bluetenglitzer',kal:'klein',farbe:1,pause:1.5},
  {n:2,gap:0.8,rohrFolge:[-0.5,0.5],licht:'breitklein',kal:'mittel',farbe:2,pause:1},
  {mit:true,n:4,gap:0.9,rohrFolge:RF4,licht:'bluetenkranz',kal:'klein',farbe:3,pause:1.5},
  {n:3,gap:0.3,rohrFolge:RF3,licht:'breitglitzer',kal:'gross',farbe:1},
  {mit:true,n:3,gap:0.6,rohrFolge:RF3,licht:'bluetenglitzer',kal:'klein',farbe:0,pause:5}]);

/* --- Mittel --- */
/* Fontaenenballett: farbige breite Fontaenen tanzen links, rechts, in
   der Mitte; ueber jeder oeffnet sich eine Farbkrone, dazwischen
   Farbcrossetten - Finale: drei Fontaenen zugleich */
lbShow('lb_fontaenenballett',[['rot','gold'],['tuerkis','gold'],['violett','silber'],['gruen','gold']],{sz:[0.9,1.2],pw:[0,2],hell:[0.9,1.25],kurve:'linear'},[
  {n:2,gap:2.2,rohrFolge:[-1,1],licht:'breitfarbe',kal:'mittel',farbe:0},
  {mit:true,n:4,gap:1.0,muster:'v',ang:0.25,licht:'farbcrossette',farbe:1,pause:1.5},
  {n:1,rohrFolge:[0],licht:'breitwechsel',kal:'gross',farbe:2},
  {mit:true,n:6,gap:0.7,muster:'aussen',ang:0.3,licht:'farbkrone',farbe:3,pause:1.5},
  {n:2,gap:0.5,rohrFolge:[-0.5,0.5],licht:'breitfarbe',kal:'mittel',farbe:1},
  {mit:true,n:6,gap:0.5,muster:'x',ang:0.3,licht:'farbcrossette',farbe:0,pause:1.5},
  {n:3,gap:0.2,rohrFolge:RF3,licht:'breitfarbe',kal:'gross',farbe:2,pause:9}]);
/* Goldregen: Goldglitzer-Fontaenen, aus denen goldene Regen sinken,
   Weidencrossetten und ein Weidenfall - ganz in Gold und Bernstein */
lbShow('lb_goldregen',[['gold','bernstein'],['bernstein','gold'],['zitrone','gold']],{sz:[0.9,1.2],pw:[0,2],hell:[0.85,1.25],kurve:'spaet'},[
  {n:1,rohrFolge:[0],licht:'breitregen',kal:'mittel',farbe:0,pause:1.5},
  {n:6,gap:0.8,muster:'aussen',ang:0.3,licht:'goldfaecher',farbe:1},
  {n:2,gap:0.4,rohrFolge:[-1,1],licht:'breitregen',kal:'mittel',farbe:2,pause:1},
  {mit:true,n:6,gap:0.6,muster:'welle',ang:0.3,licht:'weidenfaecher',farbe:0,pause:1.5},
  {n:4,gap:0.9,licht:'goldwasserfall',farbe:1},
  {n:3,gap:0.25,rohrFolge:RF3,licht:'breitregen',kal:'gross',farbe:0,pause:9}]);

/* --- Blitzweiden und Blitzpalmen --- */
/* Blitzweiden: zwei Blitzfontaenen eroeffnen, dann Blitzweiden in Gold,
   in Farbe und Blitzkronen, zum Schluss fuenf Weiden zugleich */
lbShow('lb_blitzweiden',[['weiss','gold'],['magenta','weiss'],['silber','himmel'],['gold','weiss']],{sz:[0.9,1.25],pw:[0,3],hell:[0.85,1.25],kurve:'spaet'},[
  {n:2,gap:0.8,rohrFolge:[-1,1],licht:'breitblitz',kal:'mittel',farbe:0,pause:1},
  {n:3,gap:1.6,muster:'v',ang:0.2,licht:'blitzregen',farbe:0},
  {n:4,gap:1.1,muster:'aussen',ang:0.3,licht:'farbblitzweide',farbe:1,pause:1},
  {mit:true,n:6,gap:0.6,muster:'welle',ang:0.3,licht:'blitzkrone',farbe:2,pause:1},
  {n:5,gap:0.15,muster:'mitte',ang:0.25,licht:'blitzregen',kal:'gross',farbe:3,pause:7}]);
/* Silbergewitter: eine Silberfontaene, dann silberne Blitzweiden mit
   farbigen Blitzen, Blitzblueten, und ein Finale aus Weiden in Silber
   und Farbe */
lbShow('lb_silbergewitter',[['tuerkis','silber'],['violett','weiss'],['blau','silber'],['silber','gold']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:1,rohrFolge:[0],licht:'breitsilber',kal:'gross',farbe:3,pause:1},
  {n:4,gap:1.3,muster:'x',ang:0.3,licht:'silberblitzweide',farbe:0},
  {n:6,gap:0.7,muster:'z',ang:0.3,licht:'blitzbluete',farbe:1,pause:1},
  {n:6,takt:[0.2,0.2,0.9],muster:'paar',ang:0.3,licht:'silberblitzweide',farbe:2},
  {n:2,gap:0.4,rohrFolge:[-1,1],licht:'breitblitz',kal:'mittel',farbe:3,pause:1},
  {n:6,gap:0.25,muster:'kreis',ang:0.3,licht:'farbblitzweide',kal:'gross',farbe:1},
  {mit:true,n:3,gap:0.3,muster:'mitte',ang:0.15,licht:'silberblitzweide',kal:'gross',farbe:0,pause:7}]);
/* Blitzpalmen: jede Palme anders - Gold, Farbe, Koenigspalme, Palmen-
   weide, Stufenpalme -, zum Schluss Doppelpalmen. Eroeffnet von zwei
   breiten Goldfontaenen */
lbShow('lb_blitzpalmen',[['gold','weiss'],['rot','gold'],['tuerkis','weiss'],['magenta','gold'],['gruen','weiss']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:2,gap:0.6,rohrFolge:[-1,1],licht:'breitregen',kal:'mittel',farbe:0,pause:0.5},
  {n:3,gap:1.4,muster:'v',ang:0.2,licht:'blitzpalme',farbe:0},
  {n:4,gap:1.0,muster:'aussen',ang:0.3,licht:'farbblitzpalme',farbe:1,pause:1},
  {mit:true,n:1,rohrFolge:[0],licht:'koenigspalme',kal:'gross',farbe:2,pause:1.2},
  {n:4,gap:1.0,muster:'x',ang:0.3,licht:'palmenweide',farbe:3,pause:1},
  {n:6,gap:0.45,muster:'welle',ang:0.3,licht:'stufenpalme',farbe:4,pause:1},
  {n:5,gap:0.2,muster:'mitte',ang:0.25,licht:'doppelpalme',kal:'gross',farbe:1,pause:7}]);

/* --- High-End --- */
/* Fontaenenpalast: zuerst zwei grosse Farbfontaenen aussen, dann ein
   Dreifachtor ueber der Torfontaene, Weidencrossetten aus der Mitte,
   eine Fontaenenreihe von links nach rechts in zwei Farben - Finale:
   sechs breite Fontaenen zugleich, darueber Farbkronen und ein
   Weidenvorhang */
lbShow('lb_fontaenenpalast',[['rot','gold'],['blau','silber'],['gruen','gold'],['violett','gold'],['tuerkis','rose']],{sz:[0.95,1.3],pw:[0,3],hell:[0.9,1.3],kurve:'spaet'},[
  {n:2,gap:0.4,rohrFolge:[-1,1],licht:'breitfarbew',kal:'gross',farbe:0,pause:2},
  {n:1,rohrFolge:[0],licht:'breittor',kal:'gross',farbe:1,pause:1.5},
  {n:6,gap:0.6,muster:'mitte',ang:0.3,licht:'weidencrossette',farbe:2},
  {n:5,gap:0.9,rohrFolge:[-1,-0.5,0,0.5,1],licht:'breitcross',kal:'mittel',farbe:3,pause:1.5},
  {mit:true,n:8,gap:0.5,muster:'w',ang:0.35,licht:'farbcrossette',farbe:4},
  {n:2,gap:0.3,rohrFolge:[-0.5,0.5],licht:'breitglut',kal:'gross',farbe:0,pause:1},
  {n:6,gap:0.12,rohrFolge:RF6,licht:'breitfarbew',kal:'gross',farbe:1},
  {mit:true,n:6,gap:0.6,muster:'aussen',ang:0.3,licht:'farbkrone',kal:'gross',farbe:2},
  {mit:true,n:5,gap:0.4,licht:'weidenfall',kal:'gross',farbe:0,pause:9}]);
/* Farbenpracht: jede Farbe einmal als breite Fontaene, darueber ihre
   Farbcrossette; ein Dreifachtor in der Mitte, Weidencrossetten aussen,
   Farbkronen - Finale: sieben Fontaenen von aussen nach innen und ein
   Kranz aus Weidencrossetten */
lbShow('lb_farbenpracht',[['rot','gold'],['orange','tuerkis'],['zitrone','violett'],['gruen','rose'],['blau','gold'],['violett','zitrone'],['magenta','gruen']],{sz:[0.95,1.35],pw:[0,3],hell:[0.9,1.3],kurve:'spaet'},[
  {n:1,rohrFolge:[-1],licht:'breitfarbef',kal:'mittel',farbe:0},
  {n:1,rohrFolge:[1],licht:'breitfarbef',kal:'mittel',farbe:4,pause:1},
  {mit:true,n:4,gap:1.0,muster:'paar',ang:0.3,licht:'farbcrossette',farbe:1},
  {n:1,rohrFolge:[0],licht:'breitblitz',kal:'gross',farbe:3,pause:1},
  {n:6,gap:0.5,muster:'aussen',ang:0.35,licht:'weidencrossette',farbe:2},
  {n:3,gap:0.5,rohrFolge:RF3,licht:'breitwechsel',kal:'mittel',farbe:5},
  {mit:true,n:6,gap:0.6,muster:'v',ang:0.3,licht:'farbkrone',farbe:6,pause:1.5},
  {n:7,gap:0.12,rohrFolge:RF7,licht:'breitfarbef',kal:'gross',farbe:2},
  {mit:true,n:8,gap:0.3,muster:'kreis',ang:0.35,licht:'weidencrossette',kal:'gross',farbe:3,pause:9}]);
Object.assign(SIGNATUR,{
  lb_goldader:{eff:'licht:goldkomet',text:'Goldkometen, Glitzerminen und Weidenkometen – alles in Gold, mal links, mal rechts'},
  kreuzfeuer90:{eff:'licht:crossette',text:'Crossetten im Kreuz, farbige Zwillingskometen und Dreifach-Crossetten'},
  lb_weidenhain:{eff:'licht:weidencrossette',text:'Weiden in Gold und Bernstein, das Finale ein hängender Vorhang'},
  lb_regenbogenbrunnen:{eff:'licht:breitklein',text:'Sieben kleine Fontänen in den Regenbogenfarben, eine nach der anderen'},
  lb_glitzergarten:{eff:'licht:breitglitzer',text:'Glitzerfontänen mit Farbspitzen und leise Blütenglitzer in Pastell'},
  lb_fontaenenballett:{eff:'licht:breitfarbe',text:'Farbkometen paarweise im V, Wechselfächer in Stufen, darüber Farbkronen und Farbcrossetten'},
  lb_goldregen:{eff:'licht:breitregen',text:'Goldkometen-Fächer mit Brokatschweif, Goldfächer und Goldwasserfall'},
  lb_blitzweiden:{eff:'licht:farbblitzweide',text:'Blitzweiden in Gold und Farbe, Blitzkronen, dazu zwei Blitzfontänen'},
  lb_silbergewitter:{eff:'licht:silberblitzweide',text:'Silberne Weiden mit farbigen Blitzen und Blitzblüten'},
  lb_blitzpalmen:{eff:'licht:koenigspalme',text:'Blitzpalmen: Gold, Farbe, Königspalme, Palmenweide, Stufen- und Doppelpalme'},
  lb_fontaenenpalast:{eff:'licht:breitfarbew',text:'Schwenkende Titan-Kometen mit Farbkopf, Dreifachtor, Weidencrossetten, Finale aus sechs Kometenfächern'},
  lb_farbenpracht:{eff:'licht:breitfarbef',text:'Jede Farbe ein Kometenfächer mit Gold-Brokat, Blitzfächer, Farbkronen'}
});

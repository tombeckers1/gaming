/* =========================================================
   Lichter-Muster (01.10., Tom: "ganz viele verschiedene Lichtertypen -
   Fontaenen, Roemische Lichter, aber auch Blitze am Himmel ohne
   Explosion ... 20, 30, 40 Batterien, jeweils nur 2, 3 Schuss").
   Jeder Lichtertyp startet direkt aus dem Rohr (Phase licht:'name' in
   show), ohne Bombette und ohne Zerleger. Vorbilder aus den Lexika der
   Fachhaendler (pyroland, voigt-pyrotechnik, feuerwerk.info): Komet,
   Schweifkomet, Knisterkomet, Blinker, Crossette, Minen, Fontaenen,
   Wasserfall, Sonnenrad, Tourbillon, Fische, Pfeifer, Bengalfeuer.
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
/* Bahn mit eigenem Antrieb (Fisch, Biene, Blatt): Stuecke von dt, je Stueck
   ein kurzer Stern mit Schweif - die Richtung aendert sich zwischen den
   Stuecken (Treibsatz bzw. Flattern), im Stueck fliegt er ballistisch */
function lBahn(ps,p,v,schritte,dt,c,G,dreh,spur,mode,folge){
  let q={x:p.x,y:p.y,z:p.z}, w=v.slice(), t=0;
  for(let k=0;k<schritte;k++){ const qq=q, ww=w.slice(), tt=t;
    kgSpaeter(tt,()=>{ kgStern(ps,qq,ww,c,dt*1.15,G,mode||0,spur); if(folge) folge(qq,ww,k); });
    q=sternNach(q,w[0],w[1],w[2],G,dt); w=bahnTempo(w,G,dt); w=dreh(w,k); t+=dt; }
  return t;
}
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

/* ---------- Kometen ---------- */
/* 1 Goldkomet: Schweifkomet - goldene Spitze, langer Goldglitzerschweif */
LICHTYP.goldkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(26*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.35;
  lKopf(m,v,kgMal(A,1.5),T,G,0,0.35); kgStern(psBig,m,v,[1.3,1.1,.7],T,G,0,0.6);
  lFunken(m,v,G,0.03,T,160,[1,.74,.32],{ps:psMid,life:[0.7,1.3],g:2.4,streu:0.25,mit:0.1,mode:4});
  lStart(m,1.3,0.8); sfx.zischen(distVol(m)*0.35,T);
};
/* 2 Knisterkomet: Silberkomet, dessen Schweif knistert (Crackling) */
LICHTYP.knisterkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.3;
  lKopf(m,v,[1.4,1.4,1.35],T,G,0,0.2);
  lFunken(m,v,G,0.15,T,55,[1.3,1.25,1.1],{ps:psSmall,life:[0.12,0.3],g:0.8,streu:1.4,mit:0.05,mode:3});
  lFunken(m,v,G,0.03,T,40,[1,1,1],{ps:psMid,life:[0.3,0.6],g:2,streu:0.2,mit:0.1,mode:0});
  lStart(m,1,0.8); const p0=m; for(let i=0;i<Math.round(T/0.35);i++) later(0.3+i*0.35,()=>sfx.prasseln(distVol(p0)*0.8));
};
/* 3 Geisterkomet: steigt in Farbe A, wird nach einer kurzen Dunkelphase
   zu Farbe B - farbiger, weicher Schweif ohne Glitzer */
LICHTYP.geisterkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(25*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.5, tW=T*0.5;
  lKopf(m,v,kgMal(A,1.5),tW-0.06,G,0,0.6);
  lFunken(m,v,G,0.03,tW-0.08,70,kgMal(A,0.9),{ps:psMid,life:[0.35,0.6],g:1.5,streu:0.2,mit:0.15,mode:0});
  kgSpaeter(tW,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tW), w=bahnTempo(v,G,tW);
    lKopf(e,w,kgMal(B,1.6),T-tW,G,0,0.6);
    lFunken(e,w,G,0.02,T-tW,70,kgMal(B,0.9),{ps:psMid,life:[0.35,0.6],g:1.5,streu:0.2,mit:0.15,mode:0}); });
  lStart(m,1,0.75); sfx.fizz(distVol(m)*0.6);
};
/* 4 Blinkkomet: steigt blinkend, sein Schweif blitzt silbern */
LICHTYP.blinkkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(25*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.6;
  lKopf(m,v,[1.5,1.5,1.5],T,G,1,0);
  lFunken(m,v,G,0.05,T,45,[1.4,1.4,1.4],{ps:psMid,life:[0.8,1.5],g:1.2,streu:0.35,mit:0.05,mode:1});
  lStart(m,1,0.8); sfx.fizz(distVol(m)*0.5);
};
/* 5 Crossette: der Komet teilt sich vor dem Scheitel mit leisem Knacken in
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
/* 6 Weidenkomet: Goldkomet, dessen Schweif lange stehen bleibt und als
   Trauerweide herabsinkt - der Stern faellt nach dem Scheitel noch weiter */
LICHTYP.weidenkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=5, v=lAbschuss(25*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+1.3;
  lKopf(m,v,[1.3,.85,.4],T,G,0,0.4);
  lFunken(m,v,G,0.05,T,75,[.95,.55,.2],{ps:psMid,life:[2.0,3.0],g:0.75,streu:0.12,mit:0.03,mode:0,spur:0.25});
  lStart(m,1.1,0.8); sfx.zischen(distVol(m)*0.3,T); later(1.2,()=>sfx.rieseln(distVol(m)*0.4,3));
};
/* 7 Pfeifkomet: silberner Komet mit Pfeifsatz - der Ton steigt mit */
LICHTYP.pfeifkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.25;
  lKopf(m,v,[1.4,1.4,1.4],T,G,0,0.15);
  lFunken(m,v,G,0.03,T,90,[1.15,1.15,1.2],{ps:psMid,life:[0.25,0.5],g:1.5,streu:0.25,mit:0.12,mode:0});
  lStart(m,1,0.7); sfx.pfeifTon(distVol(m)*1.4,(opt.i||0)*4,{dur:T});
};
/* 8 Titankomet: weissgleissender Titanschweif, sehr hell, lautes Zischen */
LICHTYP.titankomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(27*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G)+0.2;
  for(let k=0;k<3;k++) lKopf(m,v,[1.7,1.7,1.7],T,G,0,0.12);
  lFunken(m,v,G,0.02,T,230,[1.5,1.5,1.55],{ps:psMid,life:[0.18,0.45],g:1,streu:0.9,mit:0.18,mode:4});
  lStart(m,1.6,1.0); sfx.fauchen(distVol(m)*0.35,T,true); sfx.zischen(distVol(m)*0.5,T);
  for(let k=1;k<4;k++){ const t=T*k/4; kgSpaeter(t,()=>flash(sternNach(m,v[0],v[1],v[2],G,t),[1,1,1],0.9,0.12)); }
};
/* 9 Brokatkomet: dicker Goldkomet, der grosse Glitzerflocken abwirft -
   eine breite, funkelnde Bahn statt eines duennen Schweifs */
LICHTYP.brokatkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=5, v=lAbschuss(23*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.8;
  for(let k=0;k<2;k++) lKopf(m,v,[1.35,.8,.35],T,G,0,0.3);
  lFunken(m,v,G,0.08,T,55,[1.15,.78,.36],{ps:psBig,life:[1.2,2.0],g:1.3,streu:0.7,mit:0.05,mode:4,spur:0.08});
  lStart(m,1.2,0.85); sfx.zischen(distVol(m)*0.3,T); later(0.6,()=>sfx.rieseln(distVol(m)*0.5,2.5));
};
/* 10 Kometenfaecher: ein Rohr, fuenf kleine Farbkometen als Faecher */
LICHTYP.kometenfaecher=function(o,A,B,s,opt){
  const m=lMund(o), G=6;
  for(let k=0;k<5;k++){ const a=(opt.ang||0)+(-0.5+k*0.25), H=(20-Math.abs(k-2)*2)*Math.sqrt(s), v=lAbschuss(H,G,{ang:a,dir:opt.dir},0.2), T=lScheitel(v[1],G)+0.2;
    lKopf(m,v,kgMal(k%2?B:A,1.45),T,G,0,0.3);
    lFunken(m,v,G,0.03,T,45,[1,.78,.38],{ps:psMid,life:[0.35,0.7],g:2,streu:0.15,mit:0.1,mode:4}); }
  lStart(m,1.5,1.0); sfx.fizz(distVol(m)*0.7);
};
/* 11 Sternschnuppen: flach geschossene Kometen, die mit langem, kuehl
   weissblauem Schweif quer ueber den Himmel ziehen */
LICHTYP.sternschnuppe=function(o,A,B,s,opt){
  const m=lMund(o), G=3, sd=(opt.i||0)%2?1:-1, a=sd*0.78, v=lAbschuss(20*Math.sqrt(s),G,{ang:a,dir:opt.dir},0.3), T=2.4;
  const w=kgMal(v,1.15);
  lKopf(m,w,[1.3,1.4,1.6],T,G,0,0.5);
  lFunken(m,w,G,0.05,T,85,[.8,.9,1.2],{ps:psMid,life:[1.0,1.6],g:0.35,streu:0.08,mit:0,mode:0,spur:0.2});
  lStart(m,1,0.7); sfx.zischen(distVol(m)*0.3,T);
};

/* ---------- Am Himmel, ohne Zerleger ---------- */
/* 12 Blitzregen: ein dunkler Aufstieg, oben loesen sich mit leisem Plopp
   viele Blinksterne und sinken langsam blitzend herab */
LICHTYP.blitzregen=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(26*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,[.5,.25,.12],T,G,0,0.2); lStart(m,0.8,0.7);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T);
    for(let i=0;i<Math.round(150*s*QUAL());i++){ const d=randDir(), w=rand(2,6)*Math.sqrt(s);
      kgStern(i%5?psBig:psHuge,e,[d[0]*w,d[1]*w*0.6,d[2]*w],i%4?[1.9,1.9,1.9]:kgMal(A,1.7),rand(3.2,4.4),1.1,1,0); }
    schall(e,x=>{ sfx.plopp(x*0.6,1.2); sfx.rieseln(x*0.35,3.5); }); });
};
/* 13 Wetterleuchten: kein Knall - hoch oben flackern Blitze in einer
   unsichtbaren Wolke wie ein fernes Gewitter, dann leises Grollen */
LICHTYP.wetterleuchten=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(30*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,[.4,.4,.55],T,G,0,0.15); lStart(m,0.7,0.6);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T);
    let t=0; for(let k=0;k<11;k++){ t+=rand(0.12,0.38); const tt=t;
      kgSpaeter(tt,()=>{ const d=randDir(), r=rand(1,7)*Math.sqrt(s), q={x:e.x+d[0]*r,y:e.y+d[1]*r*0.4,z:e.z+d[2]*r}, c=k%3?[1.5,1.5,1.7]:kgMal(A,1.4);
        flash(q,c,1.6,0.16);
        for(let j=0;j<6;j++) psHuge.emit(q.x+rand(-1.5,1.5),q.y+rand(-0.6,0.6),q.z+rand(-1.5,1.5),0,0,0,c[0],c[1],c[2],rand(0.04,0.1),0,0);
        for(let j=0;j<Math.round(18*QUAL());j++){ const dd=randDir(), w=rand(0.5,2); psMid.emit(q.x,q.y,q.z,dd[0]*w,dd[1]*w,dd[2]*w,c[0],c[1],c[2],rand(0.08,0.2),0,0); } }); }
    schall(e,x=>later(t*0.6,()=>sfx.donner(x*0.22,true))); });
};
/* 14 Schwebestern: eine grosse, sehr helle Leuchtkugel steigt und sinkt
   dann ganz langsam wie eine Fallschirmleuchte, sie taucht alles in Licht */
LICHTYP.schwebestern=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(24*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  lKopf(m,v,kgMal(A,1.4),T,G,0,0.3);
  lFunken(m,v,G,0.03,T,40,[1,.8,.45],{ps:psMid,life:[0.3,0.6],g:2,streu:0.2,mit:0.1,mode:0});
  lStart(m,1,0.75);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), D=5.5, dv=[rand(-0.4,0.4),-0.9,rand(-0.4,0.4)];
    for(let k=0;k<7;k++) kgStern(psHuge,e,dv,kgMal(A,1.9),D,0,0,0.05); for(let k=0;k<3;k++) kgStern(psBig,e,dv,[1.8,1.7,1.5],D*0.95,0,0,0);
    for(let t=0;t<D;t+=0.3){ const tt=t; kgSpaeter(tt,()=>{ const q={x:e.x+dv[0]*tt,y:e.y+dv[1]*tt,z:e.z+dv[2]*tt};
      flash(q,A,2.2,0.35); for(let j=0;j<4;j++) psBig.emit(q.x,q.y,q.z,rand(-.3,.3),-rand(0.5,1.5),rand(-.3,.3),A[0],A[1],A[2],rand(0.6,1.1),1.5,4); }); }
    schall(e,x=>sfx.zischen(x*0.25,D)); });
};
/* 15 Fischschwarm: oben schwaermen mit leisem Puffen zwanzig Fische aus,
   jeder zappelt mit eigenem Treibsatz kreuz und quer */
LICHTYP.fischschwarm=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(23*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,[1,.8,.5],T,G,0,0.3); lStart(m,0.9,0.75);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T);
    for(let f=0;f<Math.round(28*QUAL());f++){ const d=randDir(), sp=rand(5.5,8)*Math.sqrt(s), c=f%3?[1.8,1.6,1.3]:kgMal(A,1.7);
      lBahn(psHuge,e,[d[0]*sp,d[1]*sp*0.6+1,d[2]*sp],Math.round(rand(10,15)),0.11,c,1.2,w=>{ const l=Math.hypot(w[0],w[1],w[2])||1, r=randDir(), k=sp*0.9;
        const n=[w[0]/l+r[0]*0.9,w[1]/l+r[1]*0.9,w[2]/l+r[2]*0.9], nl=Math.hypot(n[0],n[1],n[2])||1; return [n[0]/nl*k,n[1]/nl*k,n[2]/nl*k]; },0.16,0,(q,w)=>{ for(let j=0;j<3;j++) psMid.emit(q.x,q.y,q.z,-w[0]*0.1+rand(-.4,.4),-w[1]*0.1+rand(-.4,.4),-w[2]*0.1+rand(-.4,.4),1.2,1,.6,rand(0.3,0.6),1.5,4); }); }
    schall(e,x=>{ sfx.plopp(x*0.4,1.5); later(0.1,()=>sfx.fizz(x*0.6)); later(0.6,()=>sfx.fizz(x*0.4)); }); });
};
/* 16 Fallende Blaetter: oben loesen sich goldene Blaetter, die flatternd
   und funkelnd hin und her schaukelnd zu Boden segeln */
LICHTYP.fallendeblaetter=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(28*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,[.7,.45,.2],T,G,0,0.2); lStart(m,0.8,0.7);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T);
    for(let f=0;f<Math.round(40*QUAL());f++){ const d=randDir(), p={x:e.x+d[0]*rand(1.5,6),y:e.y+d[1]*3,z:e.z+d[2]*rand(1.5,6)}, c=f%3?kgMal(A,1.7):kgMal(B,1.7), ph=rand(0,6), q=lQuer(opt);
      lBahn(psHuge,p,[0,-0.6,0],34,0.13,c,0,(w,k)=>{ const sw=Math.sin(ph+k*0.9)*1.8; return [q[0]*sw+rand(-.3,.3),-rand(0.9,1.4)+Math.abs(Math.sin(ph+k*0.9))*0.5,q[2]*sw+rand(-.3,.3)]; },0.12,4); }
    schall(e,x=>{ sfx.plopp(x*0.45,1); sfx.rieseln(x*0.3,4); }); });
};
/* 17 Doppelhelix: zwei Farbkometen, die sich beim Steigen umeinander
   winden - der Treibsatz sitzt schraeg, beide drehen um die Achse */
LICHTYP.doppelhelix=function(o,A,B,s,opt){
  const m=lMund(o), H=24*Math.sqrt(s), D=2.4, r=0.95, om=Math.PI*2*2.2, rr=lRicht(opt), q=lQuer(opt), z=[q[2],0,-q[0]];
  lStart(m,1.2,0.8); sfx.zischen(distVol(m)*0.4,D);
  lLaufend(D,t=>{ const f=t/D, hh=H*(1-Math.pow(1-f,2)), c={x:m.x+rr[0]*hh,y:m.y+rr[1]*hh,z:m.z+rr[2]*hh};
    for(let k=0;k<2;k++){ const a=om*t+k*Math.PI, pp={x:c.x+(q[0]*Math.cos(a)+z[0]*Math.sin(a))*r,y:c.y,z:c.z+(q[2]*Math.cos(a)+z[2]*Math.sin(a))*r}, col=k?B:A;
      for(let j=0;j<2;j++) psHuge.emit(pp.x,pp.y,pp.z,0,0,0,col[0]*1.8,col[1]*1.8,col[2]*1.8,0.06,0,0);
      for(let j=0;j<4;j++) (j%2?psMid:psBig).emit(pp.x,pp.y,pp.z,rand(-.25,.25),rand(-.6,0),rand(-.25,.25),col[0]*1.1,col[1]*1.1,col[2]*1.1,rand(0.5,0.9),1.2,0); } });
};
/* 18 Tourbillon: ein waagerechtes Rad, das sich in die Hoehe schraubt und
   dabei Funken tangential wegschleudert - eine steigende Funkenspirale */
LICHTYP.tourbillon=function(o,A,B,s,opt){
  const m=lMund(o), H=19*Math.sqrt(s), D=2.6, r=1.0, om=Math.PI*2*3.2, rr=lRicht(opt);
  lStart(m,1.2,0.8); sfx.fauchen(distVol(m)*0.3,D,true); sfx.pfeifTon(distVol(m)*0.8,-3,{dur:D});
  lLaufend(D,t=>{ const f=t/D, hh=H*(1-Math.pow(1-f,1.8)), cx=m.x+rr[0]*hh, cy=m.y+rr[1]*hh, cz=m.z+rr[2]*hh;
    for(let k=0;k<2;k++){ const a=om*t+k*Math.PI, px=cx+Math.cos(a)*r, pz=cz+Math.sin(a)*r, tx=-Math.sin(a), tz=Math.cos(a);
      psHuge.emit(px,cy,pz,0,0,0,1.4,1.3,1.1,0.05,0,0);
      for(let j=0;j<5;j++){ const w=rand(4,7); psMid.emit(px,cy,pz,tx*w+rand(-.4,.4),rand(-.5,.8),tz*w+rand(-.4,.4),1.15,1.05,.85,rand(0.35,0.7),2.5,4); } } });
};
/* 19 Ufo-Kreisel: eine Scheibe steigt senkrecht und schleudert aus drei
   Duesen einen waagerechten Funkenring - wie ein fliegender Rasensprenger */
LICHTYP.ufokreisel=function(o,A,B,s,opt){
  const m=lMund(o), H=15*Math.sqrt(s), D=3.0, om=Math.PI*2*2.6;
  lStart(m,1,0.7); sfx.brummen(distVol(m)*1.2,140,D); sfx.zischen(distVol(m)*0.3,D);
  lLaufend(D,t=>{ const f=t/D, cy=m.y+H*(1-Math.pow(1-f,2.2));
    psHuge.emit(m.x,cy,m.z,0,0,0,A[0]*1.4,A[1]*1.4,A[2]*1.4,0.05,0,0);
    for(let k=0;k<3;k++){ const a=om*t+k*Math.PI*2/3, tx=-Math.sin(a), tz=Math.cos(a), px=m.x+Math.cos(a)*0.35, pz=m.z+Math.sin(a)*0.35;
      for(let j=0;j<4;j++){ const w=rand(6,9); psMid.emit(px,cy,pz,tx*w,rand(-.2,.3),tz*w,k?B[0]:1.2,k?B[1]:1.1,k?B[2]:.8,rand(0.4,0.75),2.2,k?0:4); } } });
  later(D,()=>{ const e={x:m.x,y:m.y+H,z:m.z}; for(let j=0;j<Math.round(30*QUAL());j++){ const d=randDir(); psSmall.emit(e.x,e.y,e.z,d[0]*3,d[1]*3,d[2]*3,1.4,1.4,1.3,rand(0.06,0.15),1,3); } schall(e,x=>sfx.prasseln(x)); });
};
/* 20 Bienenschwarm: aus dem Rohr schwirren summend Dutzende kleine Bienen,
   jede kreiselt im Zickzack nach oben und verlischt */
LICHTYP.bienenschwarm=function(o,A,B,s,opt){
  const m=lMund(o);
  for(let f=0;f<Math.round(30*QUAL());f++){ const a=rand(0,Math.PI*2), el=rand(0.7,1.4), sp=rand(9,12), c=f%2?kgMal(A,1.7):[1.8,1.4,.6];
    later(rand(0,0.6),()=>lBahn(psBig,m,[Math.cos(a)*Math.cos(el)*sp,Math.sin(el)*sp,Math.sin(a)*Math.cos(el)*sp],Math.round(rand(9,14)),0.08,c,3,w=>{ const r=randDir(), k=rand(7,10);
      const n=[r[0],Math.abs(r[1])*0.8+0.4,r[2]], l=Math.hypot(n[0],n[1],n[2]); return [n[0]/l*k,n[1]/l*k,n[2]/l*k]; },0.18,4,(q,w)=>{ for(let j=0;j<2;j++) psMid.emit(q.x,q.y,q.z,rand(-1,1),rand(-1,1),rand(-1,1),1.3,1.1,.5,rand(0.2,0.4),2,4); })); }
  lStart(m,1.2,0.6); sfx.brummen(distVol(m)*1.6,210,1.6); later(0.3,()=>sfx.brummen(distVol(m)*1.2,260,1.2));
};

/* ---------- Am Boden: Minen, Fontaenen, Raeder, Licht ---------- */
/* 21 Glitzermine: eine Saeule aus Silberglitzer-Sternen aus dem Rohr */
LICHTYP.glitzermine=function(o,A,B,s,opt){
  const m=lMund(o), G=5, rr=lRicht(opt);
  for(let i=0;i<Math.round(55*s*QUAL());i++){ const H=rand(9,16)*Math.sqrt(s), v0=vFuerHoehe(H,G), d=[rr[0]+rand(-.12,.12),rr[1],rr[2]+rand(-.12,.12)], v=kgMal(d,v0);
    kgStern(psBig,m,v,i%5?[1.4,1.4,1.45]:kgMal(A,1.4),lScheitel(v[1],G)+rand(0.2,0.6),G,4,0.12); }
  lStart(m,1.6,1.0); sfx.rieseln(distVol(m)*0.6,2.5);
};
/* 22 Bluetenmine: ein Strauss Farbsterne, die oben die Farbe wechseln */
LICHTYP.bluetenmine=function(o,A,B,s,opt){
  const m=lMund(o), G=5, rr=lRicht(opt);
  for(let i=0;i<Math.round(40*s*QUAL());i++){ const H=rand(10,15)*Math.sqrt(s), v0=vFuerHoehe(H,G), d=[rr[0]+rand(-.3,.3),rr[1],rr[2]+rand(-.3,.3)], v=kgMal(d,v0), T=lScheitel(v[1],G);
    psBig.emit(m.x,m.y,m.z,v[0],v[1],v[2],A[0]*1.4,A[1]*1.4,A[2]*1.4,T+0.6,G,2,B[0]*1.5,B[1]*1.5,B[2]*1.5); }
  lStart(m,1.6,1.0);
};
/* 23 Dracheneier: langsame Goldkugeln steigen auf und zerplatzen oben eine
   nach der anderen in knisternde Funkenballen */
LICHTYP.dracheneier=function(o,A,B,s,opt){
  const m=lMund(o), G=5, rr=lRicht(opt);
  for(let i=0;i<Math.round(26*QUAL());i++){ const H=rand(8,13)*Math.sqrt(s), v0=vFuerHoehe(H,G), d=[rr[0]+rand(-.25,.25),rr[1],rr[2]+rand(-.25,.25)], v=kgMal(d,v0), T=lScheitel(v[1],G)*rand(0.85,1.05);
    kgStern(psBig,m,v,[1.2,.8,.35],T,G,0,0.15);
    kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T); for(let j=0;j<Math.round(9*QUAL());j++){ const dd=randDir(), w=rand(1.5,3.2); psSmall.emit(e.x,e.y,e.z,dd[0]*w,dd[1]*w,dd[2]*w,1.5,1.35,1.1,rand(0.06,0.16),1,3); } }); }
  lStart(m,1.4,0.9); for(let k=0;k<5;k++) later(1.0+k*0.22,()=>sfx.prasseln(distVol(m)*1.1));
};
/* 24 Goldfontaene: klassische Fontaene, fuenf Sekunden Goldglitzer */
LICHTYP.goldfontaene=function(o,A,B,s,opt){
  const m=lMund(o), G=4, D=5.5, H=9*Math.sqrt(s), v0=vFuerHoehe(H,G), rr=lRicht(opt);
  lStart(m,0.8,0.4); sfx.fauchen(distVol(m)*0.35,D); sfx.rieseln(distVol(m)*0.35,D);
  lLaufend(D,t=>{ const k=Math.min(1,t/0.4)*Math.min(1,(D-t)/0.6);
    for(let j=0;j<Math.round(11*k*QUAL());j++){ const w=v0*rand(0.7,1.05), ps=j%3?psMid:psBig; ps.emit(m.x,m.y,m.z,(rr[0]+rand(-.15,.15))*w,rr[1]*w,(rr[2]+rand(-.15,.15))*w,1.2,.82,.36,rand(1.0,1.6),G,4); } });
};
/* 25 Knisterfontaene: Silberfontaene, oben knistert es ununterbrochen */
LICHTYP.knisterfontaene=function(o,A,B,s,opt){
  const m=lMund(o), G=4, D=5.5, H=8*Math.sqrt(s), v0=vFuerHoehe(H,G), T=lScheitel(v0,G), rr=lRicht(opt);
  lStart(m,0.8,0.4); sfx.zischen(distVol(m)*0.45,D);
  for(let k=0;k<Math.round(D/0.3);k++) later(0.6+k*0.3,()=>sfx.prasseln(distVol(m)*0.9));
  lLaufend(D,t=>{ for(let j=0;j<Math.round(8*QUAL());j++){ const w=v0*rand(0.7,1.05), v=[(rr[0]+rand(-.12,.12))*w,rr[1]*w,(rr[2]+rand(-.12,.12))*w];
      (j%3?psMid:psBig).emit(m.x,m.y,m.z,v[0],v[1],v[2],1.2,1.2,1.25,rand(0.7,1.0)*T,G,0); }
    if(Math.random()<0.6){ const w=v0*rand(0.85,1), v=[(rr[0]+rand(-.1,.1))*w,rr[1]*w,(rr[2]+rand(-.1,.1))*w], tt=T*rand(0.8,1);
      kgSpaeter(tt,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tt); for(let j=0;j<Math.round(5*QUAL());j++){ const d=randDir(); psSmall.emit(e.x,e.y,e.z,d[0]*2,d[1]*2,d[2]*2,1.5,1.45,1.3,rand(0.05,0.12),1,3); } }); } });
};
/* 26 Perlfontaene: eine Goldfontaene, aus der farbige Perlen springen */
LICHTYP.perlfontaene=function(o,A,B,s,opt){
  const m=lMund(o), G=4, D=5.5, H=7.5*Math.sqrt(s), v0=vFuerHoehe(H,G), rr=lRicht(opt);
  lStart(m,0.8,0.4); sfx.fizz(distVol(m)*0.8); sfx.zischen(distVol(m)*0.35,D);
  lLaufend(D,t=>{ for(let j=0;j<Math.round(6*QUAL());j++){ const w=v0*rand(0.6,0.95); (j%3?psMid:psBig).emit(m.x,m.y,m.z,(rr[0]+rand(-.15,.15))*w,rr[1]*w,(rr[2]+rand(-.15,.15))*w,1,.72,.3,rand(0.6,1.0),G,4); }
    if(Math.random()<0.4){ const P=vFuerHoehe(rand(11,16)*Math.sqrt(s),5), c=Math.random()<0.5?A:B, v=[(rr[0]+rand(-.2,.2))*P,rr[1]*P,(rr[2]+rand(-.2,.2))*P];
      kgStern(psBig,m,v,kgMal(c,1.45),lScheitel(v[1],5)+0.3,5,0,0.25); } });
};
/* 27 Blinkfontaene: eine Fontaene aus Blinksatz - eine flirrende, weiss
   blitzende Saeule statt Funken */
LICHTYP.blinkfontaene=function(o,A,B,s,opt){
  const m=lMund(o), G=2.2, D=5.5, H=9*Math.sqrt(s), v0=vFuerHoehe(H,G), rr=lRicht(opt);
  lStart(m,0.8,0.4); sfx.zischen(distVol(m)*0.3,D); sfx.fizz(distVol(m)*0.6);
  lLaufend(D,t=>{ for(let j=0;j<Math.round(6*QUAL());j++){ const w=v0*rand(0.5,1); (j%2?psMid:psBig).emit(m.x,m.y,m.z,(rr[0]+rand(-.12,.12))*w,rr[1]*w,(rr[2]+rand(-.12,.12))*w,1.5,1.5,1.5,rand(1.4,2.2),G,1); } });
};
/* 28 Silberwasserfall: Kometen im flachen Bogen ueber die Batterie - aus
   dem Bogen faellt ein Vorhang silberner Funken senkrecht herab */
LICHTYP.wasserfall=function(o,A,B,s,opt){
  const m=lMund(o), G=4, sd=(opt.i||0)%2?1:-1, v=lAbschuss(15*Math.sqrt(s),G,{ang:sd*0.62,dir:opt.dir},0.2), T=lScheitel(v[1],G)*1.7;
  lKopf(m,v,[1.4,1.4,1.45],T,G,0,0.2);
  lFunken(m,v,G,0.08,T,120,[1.25,1.25,1.3],{ps:psMid,life:[1.8,2.6],g:2.6,streu:0.06,mit:0,mode:0,spur:0.12});
  lStart(m,1,0.7); sfx.regen(distVol(m)*0.7,T+2);
};
/* 29 Sonnenrad: ein senkrechtes Feuerrad ueber der Batterie, vier Duesen,
   es dreht sich immer schneller und spruehrt einen goldenen Kreis */
LICHTYP.sonnenrad=function(o,A,B,s,opt){
  const m=lMund(o), D=5.5, r=1.1*Math.sqrt(s), q=lQuer(opt), c={x:m.x,y:m.y+2.4,z:m.z};
  lStart(m,0.6,0.3); sfx.fauchen(distVol(m)*0.4,D);
  let th=0;
  lLaufend(D,t=>{ th+=(1.5+t*0.7)*Math.PI*2/30;
    for(let k=0;k<4;k++){ const a=th+k*Math.PI/2, ca=Math.cos(a), sa=Math.sin(a), px=c.x+q[0]*ca*r, py=c.y+sa*r, pz=c.z+q[2]*ca*r, tx=q[0]*sa, ty=-ca, tz=q[2]*sa;
      psHuge.emit(px,py,pz,0,0,0,1.3,1.1,.7,0.05,0,0);
      for(let j=0;j<Math.round(6*QUAL());j++){ const w=rand(5,8); (j%3?psMid:psBig).emit(px,py,pz,tx*w+rand(-.3,.3),ty*w+rand(-.3,.3),tz*w+rand(-.3,.3),k%2?A[0]*1.2:1.2,k%2?A[1]*1.2:.85,k%2?A[2]*1.2:.4,rand(0.35,0.6),2.5,4); } } });
};
/* 30 Bengalglut: bengalisches Feuer auf der Batterie - ruhiges, tiefes
   Farblicht, das Rauch und Umgebung farbig ausleuchtet */
LICHTYP.bengalglut=function(o,A,B,s,opt){
  const m=lMund(o), D=6, c=(opt.i||0)%2?B:A;
  lStart(m,0.5,0); sfx.fizz(distVol(m)*0.5); sfx.brodeln(distVol(m)*0.6,D);
  lLaufend(D,t=>{ const k=Math.min(1,t/0.5)*Math.min(1,(D-t)/0.8);
    for(let j=0;j<Math.round(6*QUAL());j++) psHuge.emit(m.x+rand(-.2,.2),m.y+0.15,m.z+rand(-.2,.2),rand(-.35,.35),rand(0.8,2.2),rand(-.35,.35),c[0]*1.6*k,c[1]*1.6*k,c[2]*1.6*k,rand(0.5,1.0),-0.5,0);
    for(let j=0;j<Math.round(3*QUAL());j++) psBig.emit(m.x,m.y+0.2,m.z,rand(-.6,.6),rand(1.5,3.5),rand(-.6,.6),c[0]*1.3*k+.2,c[1]*1.3*k+.2,c[2]*1.3*k+.2,rand(0.3,0.6),-0.3,0);
    if(Math.round(t*30)%4===0) flash({x:m.x,y:m.y+1.5,z:m.z},c,3.2*k,0.3); });
};

/* Die 30 Muster (Liste in 02e): drei Schuss je Muster - zwei links und
   rechts, der dritte groesser in der Mitte. Fontaenen, Raeder und Minen
   stehen nebeneinander auf der Batterie. */
LICHT_MUSTER.forEach(([e,nm,form,F,txt])=>{ const id='lm_'+e;
  THEMEN[id]=[[F[0],F[1]],[F[1],F[0]]];
  const P0=e==='fallendeblaetter'||e==='schwebestern'?6.5:e==='blitzregen'||e==='weidenkomet'||e==='wetterleuchten'?5.5:4.5;
  SHOWS[id]=()=>form==='boden'?show({},[
      {n:2,gap:2.8,x:[-0.22,0.22],licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,x:[0],licht:e,kal:'gross',th:id,farbe:1,pause:6.5}])
    :form==='mine'?show({},[
      {n:2,gap:1.4,x:[-0.22,0.22],muster:'v',ang:0.12,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,x:[0],licht:e,kal:'gross',th:id,farbe:1,pause:4}])
    :form==='quer'?show({},[
      {n:2,gap:1.6,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,licht:e,kal:'gross',th:id,farbe:1,pause:P0}])
    :show({},[
      {n:2,gap:1.5,muster:'v',ang:0.22,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,licht:e,kal:'gross',th:id,farbe:1,pause:P0}]);
  SIGNATUR[id]={eff:'licht:'+e,text:txt};
});

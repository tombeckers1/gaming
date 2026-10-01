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
/* Geisterkomet: steigt in Farbe A, wird nach einer kurzen Dunkelphase
   zu Farbe B - farbiger, weicher Schweif ohne Glitzer */
LICHTYP.geisterkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(25*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.5, tW=T*0.5;
  lKopf(m,v,kgMal(A,1.5),tW-0.06,G,0,0.6);
  lFunken(m,v,G,0.03,tW-0.08,70,kgMal(A,0.9),{ps:psMid,life:[0.35,0.6],g:1.5,streu:0.2,mit:0.15,mode:0});
  kgSpaeter(tW,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tW), w=bahnTempo(v,G,tW);
    lKopf(e,w,kgMal(B,1.6),T-tW,G,0,0.6);
    lFunken(e,w,G,0.02,T-tW,70,kgMal(B,0.9),{ps:psMid,life:[0.35,0.6],g:1.5,streu:0.2,mit:0.15,mode:0}); });
  lStart(m,1,0.75);   /* 01.10. (Tom): nur der Abschuss, kein Zischen */
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
/* Silberwasserfall: Kometen im flachen Bogen ueber die Batterie - aus
   dem Bogen faellt ein Vorhang silberner Funken senkrecht herab */
LICHTYP.wasserfall=function(o,A,B,s,opt){
  const m=lMund(o), G=4, sd=(opt.i||0)%2?1:-1, v=lAbschuss(15*Math.sqrt(s),G,{ang:sd*0.62,dir:opt.dir},0.2), T=lScheitel(v[1],G)*1.7;
  lKopf(m,v,[1.4,1.4,1.45],T,G,0,0.2);
  lFunken(m,v,G,0.08,T,120,[1.25,1.25,1.3],{ps:psMid,life:[1.8,2.6],g:2.6,streu:0.06,mit:0,mode:0,spur:0.12});
  lStart(m,1,0.7); sfx.regen(distVol(m)*0.7,T+2);
};

/* =========================================================
   Runde 3 (01.10., Tom): Blitzregen, Wetterleuchten und Perlfontaene
   neu; Varianten von Glitzermine, Bluetenmine und Wasserfall ("gerne
   mehrere Versionen in verschiedenen Formen, Farben und Effekten");
   neue Lichter aus den Favoriten (Goldkomet, Crossette, Weidenkomet,
   Kometenfaecher, Wetterleuchten).
   ========================================================= */

/* Blitzregen (neu): der dunkle Aufstieg bleibt; oben oeffnet sich leise
   eine Blitzweide - weisse Blinksterne fliegen waagerecht aus und ziehen
   beim Sinken lange, blitzende Faeden hinter sich her */
LICHTYP.blitzregen=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(27*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,[.5,.25,.12],T,G,0,0.2); lStart(m,0.8,0.7);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), n=Math.round(30*QUAL()), a0=rand(0,Math.PI*2);
    for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2+rand(-0.08,0.08), w=rand(6,7.5)*Math.sqrt(s), dv=[Math.cos(a)*w,rand(0.5,1.5),Math.sin(a)*w], L=rand(3.0,3.6);
      kgStern(psHuge,e,dv,i%5?[1.9,1.9,1.95]:kgMal(A,1.7),L,1.4,1,0);
      lFunken(e,dv,1.4,0.15,L,26,[1.6,1.6,1.7],{ps:psMid,life:[0.9,1.5],g:0.9,streu:0.1,mit:0.02,mode:1}); }
    schall(e,x=>{ sfx.plopp(x*0.5,1.3); later(0.3,()=>sfx.rieseln(x*0.45,3.5)); }); });
};
/* Wetterleuchten (neu): statt kleiner Funkenkugeln leuchtet die Wolke
   flaechig auf, und in ihr zucken verzweigte Blitzfaeden - wie ein fernes
   Gewitter. Danach leises Grollen. */
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
LICHTYP.wetterleuchten=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(30*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,[.4,.4,.55],T,G,0,0.15); lFunken(m,v,G,0.05,T,35,[.35,.35,.5],{life:[0.4,0.8],g:1,streu:0.2,mit:0.1,mode:0}); lStart(m,0.7,0.6);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), t=lGewitter(e,A,s,null); schall(e,x=>later(t*0.6,()=>sfx.donner(x*0.22,true))); });
};
/* Farbleuchten: dasselbe Gewitter in zwei Farben (A und B im Wechsel),
   tiefer und laenger grollend */
LICHTYP.farbleuchten=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(31*Math.sqrt(s),G,opt,0.3), T=lScheitel(v[1],G);
  kgStern(psBig,m,v,kgMal(A,0.5),T,G,0,0.15); lFunken(m,v,G,0.05,T,30,kgMal(A,0.4),{life:[0.4,0.8],g:1,streu:0.2,mit:0.1,mode:0}); lStart(m,0.7,0.6);
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T), t=lGewitter(e,A,s,B); schall(e,x=>{ later(t*0.5,()=>sfx.donner(x*0.3,true)); later(t*0.5+0.8,()=>sfx.donner(x*0.18,true)); }); });
};
/* Perlfontaene (neu): weniger "Laser" - die Perlen sind runde Leuchtkugeln
   ohne Strich, fliegen in weiten Boegen aus einer vollen Goldfontaene und
   zergehen oben in einem Hauch Glitzer */
LICHTYP.perlfontaene=function(o,A,B,s,opt){
  const m=lMund(o), G=4, D=5.5, H=7.5*Math.sqrt(s), v0=vFuerHoehe(H,G), rr=lRicht(opt);
  lStart(m,0.8,0.4); sfx.zischen(distVol(m)*0.3,D);
  lLaufend(D,t=>{ const k=Math.min(1,t/0.4)*Math.min(1,(D-t)/0.6);
    for(let j=0;j<Math.round(8*k*QUAL());j++){ const w=v0*rand(0.55,0.95); (j%3?psMid:psBig).emit(m.x,m.y,m.z,(rr[0]+rand(-.2,.2))*w,rr[1]*w,(rr[2]+rand(-.2,.2))*w,1.1,.76,.32,rand(0.7,1.1),G,4); }
    if(Math.random()<0.45*k){ const P=vFuerHoehe(rand(9,14)*Math.sqrt(s),3.5), c=Math.random()<0.5?A:B, a=rand(0,Math.PI*2), sp=rand(0.15,0.45), v=[(rr[0]+Math.cos(a)*sp)*P,rr[1]*P,(rr[2]+Math.sin(a)*sp)*P], L=lScheitel(v[1],3.5)+rand(0.4,0.8);
      kgStern(psHuge,m,v,kgMal(c,1.5),L,3.5,0,0.03);
      kgSpaeter(L,()=>{ const e=sternNach(m,v[0],v[1],v[2],3.5,L); for(let j=0;j<5;j++){ const d=randDir(); psMid.emit(e.x,e.y,e.z,d[0]*1.5,d[1]*1.5,d[2]*1.5,c[0]*1.3,c[1]*1.3,c[2]*1.3,rand(0.4,0.8),1.5,4); } }); } },0.03);
};

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
   Farbe nach */
LICHTYP.glitzerbunt=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{H:[9,15],kegel:0.14,md:4,c:()=>SILBER,nach:[0.05,0.15]});
  r.out.forEach(({v,T},i)=>kgSpaeter(T,()=>{ const e=sternNach(r.m,v[0],v[1],v[2],r.G,T), w=bahnTempo(v,r.G,T); kgStern(psBig,e,w,kgMal(i%2?A:B,1.6),rand(0.6,1.0),r.G,0,0.05); }));
  sfx.rieseln(distVol(o)*0.6,2.8);
};
/* Glitzerfaecher: fuenf schmale Glitzersaeulen aus einem Rohr als Faecher */
LICHTYP.glitzerfaecher=function(o,A,B,s,opt){
  for(let k=0;k<5;k++){ const a=(opt.ang||0)+(-0.42+k*0.21); lMine(o,s*0.55,{ang:a,dir:opt.dir},{n:40,H:[10,15],kegel:0.04,md:4,c:i=>i%5?SILBER:kgMal(k%2?A:B,1.4)}); }
  sfx.rieseln(distVol(o)*0.7,3);
};
/* Glitzerkrone: weiter Kegel, langsame Sterne - die Saeule oeffnet sich oben
   zur haengenden Krone */
LICHTYP.glitzerkrone=function(o,A,B,s,opt){ lMine(o,s,opt,{n:70,G:3.2,H:[8,13],kegel:0.5,ring:true,md:4,nach:[0.9,1.6],spur:0.25,c:i=>i%4?SILBER:kgMal(A,1.4)}); sfx.rieseln(distVol(o)*0.6,3.5); };
/* Glitzer und Blinker: halb Glitzer, halb weisse Blinksterne */
LICHTYP.glitzerblinker=function(o,A,B,s,opt){ lMine(o,s,opt,{n:60,H:[9,16],kegel:0.16,md:i=>i%2?4:1,nach:[0.4,1.0],c:i=>i%2?SILBER:[1.7,1.7,1.7]}); sfx.rieseln(distVol(o)*0.6,3); };
/* Glitzerturm: eine schmale Saeule, oben loesen sich aus jedem dritten
   Stern drei kleine Glitzersterne - der Turm waechst ein zweites Mal */
LICHTYP.glitzerturm=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:45,H:[9,12],kegel:0.06,md:4,c:()=>GOLD,nach:[0,0.05]});
  r.out.forEach(({v,T},i)=>{ if(i%3) return; kgSpaeter(T,()=>{ const e=sternNach(r.m,v[0],v[1],v[2],r.G,T);
    for(let j=0;j<3;j++){ const d=[rand(-.35,.35),1,rand(-.35,.35)], w=vFuerHoehe(rand(4,7),4); kgStern(psBig,e,kgMal(d,w),j?SILBER:kgMal(A,1.5),lScheitel(w,4)+0.4,4,4,0.1); } }); });
  sfx.rieseln(distVol(o)*0.6,3.5);
};

/* ---------- Bluetenminen ---------- */
/* Pastellblueten: zarte Farben, langsam und lange */
LICHTYP.bluetenpastell=function(o,A,B,s,opt){
  const P=mischF(A,[1,1,1],0.45), Q=mischF(B,[1,1,1],0.45);
  const r=lMine(o,s,opt,{n:42,G:3.6,H:[10,14],kegel:0.3,md:0,nach:[0.7,1.1],spur:0.05,c:i=>kgMal(i%2?P:Q,1.35)});
  r.out.forEach(({h,T},i)=>kgSpaeter(T*0.7,()=>kgFarbe(h,kgMal(i%2?Q:P,1.4))));
};
/* Bluetenkranz: die Sterne fliegen auf einem Kegelmantel - eine hohle
   Tulpe statt eines Strausses */
LICHTYP.bluetenkranz=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:46,H:[11,13],kegel:0.34,ring:true,md:0,nach:[0.3,0.5],spur:0.15,c:()=>kgMal(A,1.45)});
  r.out.forEach(({h},i)=>kgSpaeter(r.out[i].T*0.6,()=>kgFarbe(h,kgMal(B,1.5))));
};
/* Bluetenfaecher: fuenf kleine Straeusse als Faecher */
LICHTYP.bluetenfaecher=function(o,A,B,s,opt){
  for(let k=0;k<5;k++){ const a=(opt.ang||0)+(-0.44+k*0.22); const r=lMine(o,s*0.5,{ang:a,dir:opt.dir},{n:30,H:[10,14],kegel:0.08,md:0,spur:0.08,c:()=>kgMal(k%2?A:B,1.45)});
    r.out.forEach(({h,T})=>kgSpaeter(T*0.65,()=>kgFarbe(h,kgMal(k%2?B:A,1.5)))); }
};
/* Bluetenbukett: jeder Stern teilt sich oben leise in drei kleinere Sterne */
LICHTYP.bluetenbukett=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:28,H:[9,12],kegel:0.25,md:0,nach:[0,0.05],spur:0.1,c:()=>kgMal(A,1.45)});
  r.out.forEach(({v,T})=>kgSpaeter(T,()=>{ const e=sternNach(r.m,v[0],v[1],v[2],r.G,T), a0=rand(0,Math.PI*2);
    for(let j=0;j<3;j++){ const a=a0+j*2.094, dv=[Math.cos(a)*2.4,1.2,Math.sin(a)*2.4]; kgStern(psBig,e,dv,kgMal(B,1.5),rand(1.0,1.4),3,0,0.1); } }));
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
/* Gemeinsamer Bau: Komet im flachen Bogen, aus dem Bogen faellt der Vorhang */
function lFall(o,s,opt,p){
  const m=lMund(o), G=4, sd=p.seite!==undefined?p.seite:((opt.i||0)%2?1:-1), v=lAbschuss((p.H||15)*Math.sqrt(s),G,{ang:sd*(p.ang||0.62),dir:opt.dir},0.2), T=lScheitel(v[1],G)*1.7;
  lKopf(m,v,p.kopf||[1.4,1.4,1.45],T,G,0,0.2);
  if(p.baender){ const nb=p.baender.length; for(let k=0;k<nb;k++) lFunken(m,v,G,0.08+k*(T-0.08)/nb,0.08+(k+1)*(T-0.08)/nb,p.rate||120,p.baender[k],{ps:psMid,life:[1.8,2.6],g:2.6,streu:0.06,mit:0,mode:p.md||0,spur:0.12}); }
  else lFunken(m,v,G,0.08,T,p.rate||120,p.c,{ps:psMid,life:p.life||[1.8,2.6],g:p.g||2.6,streu:0.06,mit:0,mode:p.md||0,spur:0.12});
  if(p.knister) for(let t=0.4;t<T;t+=0.12){ const tt=t; kgSpaeter(tt+rand(0.6,1.6),()=>{ const q=sternNach(m,v[0],v[1],v[2],G,tt); q.y-=rand(1,4); for(let j=0;j<4;j++){ const d=randDir(); psSmall.emit(q.x,q.y,q.z,d[0]*1.8,d[1]*1.8,d[2]*1.8,1.5,1.45,1.3,rand(0.05,0.12),1,3); } }); }
  lStart(m,1,0.7); sfx.regen(distVol(m)*0.7,T+2);
  if(p.knister) for(let k=0;k<6;k++) later(1+k*0.4,()=>sfx.prasseln(distVol(m)*0.9));
  return T;
}
LICHTYP.goldwasserfall=function(o,A,B,s,opt){ lFall(o,s,opt,{kopf:[1.5,1.1,.5],c:[1.2,.85,.36],md:4}); };
/* Farbwasserfall: der Vorhang faellt silbern und wird im Fallen farbig */
LICHTYP.farbwasserfall=function(o,A,B,s,opt){
  const m=lMund(o), G=4, sd=(opt.i||0)%2?1:-1, v=lAbschuss(15*Math.sqrt(s),G,{ang:sd*0.62,dir:opt.dir},0.2), T=lScheitel(v[1],G)*1.7, c=kgMal(A,1.3);
  lKopf(m,v,[1.4,1.4,1.45],T,G,0,0.2);
  for(let t=0.08;t<T;t+=1/15){ const tt=t; kgSpaeter(tt,()=>{ const q=sternNach(m,v[0],v[1],v[2],G,tt); for(let j=0;j<Math.round(8*QUAL());j++) psMid.emit(q.x+rand(-.15,.15),q.y,q.z+rand(-.15,.15),rand(-.1,.1),-0.25,rand(-.1,.1),1.3,1.3,1.35,rand(1.8,2.6),2.6,2,c[0],c[1],c[2]); }); }
  lStart(m,1,0.7); sfx.regen(distVol(m)*0.7,T+2);
};
LICHTYP.knisterwasserfall=function(o,A,B,s,opt){ lFall(o,s,opt,{c:[1.25,1.25,1.3],knister:true}); };
LICHTYP.blinkwasserfall=function(o,A,B,s,opt){ lFall(o,s,opt,{c:[1.6,1.6,1.65],md:1,rate:170,life:[2.2,3.0],g:2}); };
/* Wassertor: zwei Boegen zugleich von links und rechts - ein Tor aus Licht */
LICHTYP.wassertor=function(o,A,B,s,opt){ lFall(o,s,opt,{seite:-1,ang:0.5,H:17,c:[1.25,1.25,1.3]}); lFall(o,s,opt,{seite:1,ang:0.5,H:17,c:kgMal(A,1.15),kopf:kgMal(A,1.4)}); };
/* Regenbogenfall: der Vorhang in Farbbaendern entlang des Bogens */
LICHTYP.regenbogenfall=function(o,A,B,s,opt){ lFall(o,s,opt,{rate:110,baender:[FW.rot,FW.orange,FW.gold,FW.gruen,FW.blau,FW.violett].map(c=>kgMal(c,1.3))}); };

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

/* Muster (Liste in 02e): drei Schuss je Muster - zwei links und rechts,
   der dritte groesser in der Mitte. Minen und Fontaenen stehen
   nebeneinander auf der Batterie. */
LICHT_MUSTER.forEach(([e,nm,form,F,txt])=>{ const id='lm_'+e;
  THEMEN[id]=[[F[0],F[1]],[F[1],F[0]]];
  const P0=e==='blitzregen'||e==='kometenkrone'||e==='wetterleuchten'||e==='farbleuchten'?6:4.5;
  SHOWS[id]=()=>form==='boden'?show({},[
      {n:2,gap:2.8,x:[-0.3,0.3],licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,x:[0],licht:e,kal:'gross',th:id,farbe:1,pause:6.5}])
    :form==='mine'?show({},[
      {n:2,gap:1.4,x:[-0.3,0.3],muster:'v',ang:0.12,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,x:[0],licht:e,kal:'gross',th:id,farbe:1,pause:4.5}])
    :form==='quer'?show({},[
      {n:2,gap:1.6,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,licht:e,kal:'gross',th:id,farbe:1,pause:5}])
    :show({},[
      {n:2,gap:1.5,muster:'v',ang:0.22,licht:e,kal:'mittel',th:id,farbe:0},
      {n:1,licht:e,kal:'gross',th:id,farbe:1,pause:P0}]);
  SIGNATUR[id]={eff:'licht:'+e,text:txt};
});

/* =========================================================
   Lichter-Batterien (01.10., Tom: "bau mir aus den guten Effekten acht
   Batterien, ruhig auch Mix, ruhig groessere") - nur Goldkomet,
   Geisterkomet, Crossette, Weidenkomet, Kometenfaecher, Wetterleuchten,
   Glitzermine, Bluetenmine, Wasserfall und die Glut-Effekte.
   ========================================================= */
const RF6=[-1,-0.6,-0.2,0.2,0.6,1], RF4=[-1,1,-0.4,0.4];
const lbShow=(id,th,rampe,ph)=>{ THEMEN[id]=th; SHOWS[id]=()=>show({rampe},ph.map(p=>Object.assign({th:id},p))); };
lbShow('lb_goldader',[['gold','orange'],['bernstein','gold'],['zitrone','gold']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:6,gap:0.9,muster:'aussen',ang:0.3,licht:'goldkomet',kal:'mittel',farbe:0,boden:{k:'volcano',gt:6,A:'gold',B:'orange'}},
  {n:10,gap:0.3,muster:'z',ang:0.35,licht:'goldkomet',farbe:1},
  {mit:true,n:4,gap:1.2,rohrFolge:RF4,licht:'glitzermine',farbe:0,pause:1},
  {n:8,takt:[0.15,0.15,0.7],muster:'welle',ang:0.35,licht:'weidenkomet',farbe:0,pause:0.8},
  {n:12,gap:0.12,muster:'wischer',ang:0.45,licht:'goldkomet',farbe:2},
  {mit:true,n:6,gap:0.5,rohrFolge:RF6,licht:'glitzermine',farbe:1,pause:1},
  {n:14,gap:0.2,muster:'w',ang:0.4,licht:'kometenfaecher',farbe:0,pause:0.6},
  {n:16,gap:0.06,muster:'schlag',ang:0.4,licht:'goldkomet',kal:'gross',farbe:1,boden:{k:'volcano',gt:4,A:'gold',B:'bernstein'}},
  {mit:true,n:8,gap:0.15,muster:'mitte',ang:0.15,licht:'weidenkomet',kal:'gross',farbe:0,pause:6}]);
lbShow('lb_geisterstunde',[['magenta','tuerkis'],['violett','limette'],['blau','gold']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'linear'},[
  {n:5,gap:1.2,muster:'mitte',ang:0.2,licht:'geisterkomet',farbe:0},
  {n:8,gap:0.45,muster:'paar',ang:0.35,licht:'geisterkomet',farbe:1},
  {mit:true,n:2,gap:2.5,licht:'wetterleuchten',kal:'gross',farbe:0,pause:2.5},
  {n:6,gap:0.8,rohrFolge:RF6,licht:'bluetenmine',farbe:2,boden:{k:'volcano',gt:6,A:'violett',B:'tuerkis'}},
  {n:12,takt:[0.12,0.12,0.12,0.6],muster:'kreis',ang:0.35,licht:'geisterkomet',farbe:0},
  {mit:true,n:6,gap:0.6,rohrFolge:RF6,licht:'bluetenmine',farbe:1,pause:1},
  {n:16,gap:0.1,muster:'x',ang:0.4,licht:'geisterkomet',farbe:2,pause:0.5},
  {n:3,gap:0.7,licht:'wetterleuchten',kal:'gross',farbe:1},
  {mit:true,n:14,gap:0.08,muster:'schlag',ang:0.4,licht:'geisterkomet',kal:'gross',farbe:0,pause:6}]);
lbShow('lb_kreuzfeuer',[['gold','rot'],['silber','gruen'],['orange','weiss']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
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
lbShow('lb_silberkaskade',[['silber','weiss'],['himmel','silber'],['weiss','gold']],{sz:[0.9,1.3],pw:[0,2],hell:[0.85,1.3],kurve:'spaet'},[
  {n:4,gap:1.6,licht:'wasserfall',farbe:0},
  {mit:true,n:4,gap:1.6,rohrFolge:RF4,licht:'glitzermine',farbe:1,pause:1,boden:{k:'volcano',gt:6,A:'silber',B:'weiss'}},
  {n:8,gap:0.5,muster:'v',ang:0.3,licht:'weidenkomet',farbe:0},
  {n:10,takt:[0.2,0.2,0.8],licht:'wasserfall',farbe:1,pause:1},
  {n:12,gap:0.12,muster:'wischer',ang:0.4,licht:'glitzermine',farbe:0},
  {mit:true,n:6,gap:0.4,licht:'wasserfall',farbe:1,pause:1.2},
  {n:12,gap:0.06,muster:'schlag',ang:0.35,licht:'glitzermine',kal:'gross',farbe:0},
  {mit:true,n:8,gap:0.15,licht:'wasserfall',kal:'gross',farbe:2,pause:6}]);
lbShow('lb_bluetenzauber',[['rose','gold'],['gruen','violett'],['tuerkis','magenta']],{sz:[0.9,1.3],pw:[0,2.5],hell:[0.85,1.3],kurve:'linear'},[
  {n:6,gap:0.9,rohrFolge:RF6,licht:'bluetenmine',farbe:0,boden:{k:'volcano',gt:5,A:'rose',B:'gold'}},
  {n:8,gap:0.5,muster:'paar',ang:0.3,licht:'bluetenpastell',farbe:1},
  {mit:true,n:4,gap:1,muster:'mitte',ang:0.12,licht:'bluetenbukett',farbe:2,pause:1},
  {n:12,takt:[0.15,0.15,0.6],muster:'welle',ang:0.35,licht:'bluetenkranz',farbe:1},
  {n:10,gap:0.35,muster:'spirale',ang:0.35,licht:'bluetenfaecher',farbe:0,pause:0.8},
  {n:14,gap:0.1,muster:'wischer',ang:0.4,licht:'bluetenglitzer',farbe:2},
  {mit:true,n:6,gap:0.4,muster:'v',ang:0.3,licht:'bluetendreiklang',farbe:0,pause:1},
  {n:12,gap:0.06,muster:'schlag',ang:0.4,licht:'bluetenmine',kal:'gross',farbe:1},
  {mit:true,n:6,gap:0.25,muster:'mitte',ang:0.15,licht:'bluetenbukett',kal:'gross',farbe:2,pause:6}]);
lbShow('lb_gewitterfront',[['weiss','violett'],['himmel','weiss'],['violett','gold']],{sz:[0.9,1.3],pw:[0,3],hell:[0.85,1.3],kurve:'spaet'},[
  {n:3,gap:1.8,licht:'wetterleuchten',farbe:0,boden:{k:'volcano',gt:5,A:'silber',B:'weiss'}},
  {n:8,gap:0.45,muster:'aussen',ang:0.3,licht:'crossette',farbe:1},
  {mit:true,n:2,gap:1.5,licht:'wetterleuchten',kal:'gross',farbe:1,pause:2},
  {n:10,takt:[0.12,0.12,0.7],muster:'zufall',ang:0.35,licht:'glitzermine',farbe:0},
  {n:12,gap:0.15,muster:'x',ang:0.4,licht:'goldkomet',farbe:2,pause:0.8},
  {n:4,gap:0.6,muster:'mitte',ang:0.15,licht:'wetterleuchten',kal:'gross',farbe:0},
  {mit:true,n:10,gap:0.08,muster:'schlag',ang:0.4,licht:'crossette',kal:'gross',farbe:1},
  {mit:true,n:7,gap:0.2,muster:'kreis',ang:0.3,licht:'glitzermine',kal:'gross',farbe:0,pause:6}]);
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
lbShow('lb_grandelumiere',[['gold','silber'],['rose','gold'],['gold','rot'],['magenta','tuerkis']],{sz:[0.9,1.35],pw:[0,3.5],hell:[0.85,1.35],kurve:'spaet'},[
  {n:4,gap:1.4,licht:'wasserfall',farbe:0,boden:{k:'volcano',gt:6,A:'gold',B:'silber'}},
  {mit:true,n:4,gap:1.4,rohrFolge:RF4,licht:'bluetenmine',farbe:1,pause:0.8},
  {n:10,gap:0.4,muster:'v',ang:0.3,licht:'goldkomet',farbe:0},
  {n:8,gap:0.5,muster:'aussen',ang:0.35,licht:'crossette',farbe:2},
  {mit:true,n:2,gap:2,licht:'wetterleuchten',kal:'gross',farbe:1,pause:1.5},
  {n:12,takt:[0.12,0.12,0.12,0.6],muster:'kreis',ang:0.35,licht:'geisterkomet',farbe:3},
  {n:16,gap:0.1,muster:'wischer',ang:0.45,licht:'glitzermine',farbe:0},
  {mit:true,n:8,gap:0.25,muster:'paar',ang:0.3,licht:'weidenkomet',farbe:0,pause:1},
  {n:12,gap:0.3,muster:'spirale',ang:0.35,licht:'kometenfaecher',farbe:1},
  {n:20,gap:0.08,muster:'x',ang:0.4,licht:'goldkomet',farbe:2,pause:0.6},
  {n:8,gap:0.35,licht:'wasserfall',farbe:0},
  {mit:true,n:10,gap:0.15,muster:'w',ang:0.35,licht:'bluetenmine',farbe:1,pause:1.2},
  {n:16,gap:0.05,muster:'schlag',ang:0.4,licht:'crossette',kal:'gross',farbe:2},
  {mit:true,n:12,gap:0.1,muster:'mitte',ang:0.15,licht:'weidenkomet',kal:'riesig',farbe:0},
  {mit:true,n:8,gap:0.2,licht:'wasserfall',kal:'gross',farbe:1,pause:7}]);
Object.assign(SIGNATUR,{
  lb_goldader:{eff:'licht:goldkomet',text:'Goldkometen, Glitzerminen und Weidenkometen – alles in Gold'},
  lb_geisterstunde:{eff:'licht:geisterkomet',text:'Farbwechselnde Geisterkometen, Wetterleuchten und Blütenminen'},
  lb_kreuzfeuer:{eff:'licht:crossette',text:'Crossetten im Kreuz, farbige Zwillingskometen und Dreifach-Crossetten'},
  lb_silberkaskade:{eff:'licht:wasserfall',text:'Silberne Wasserfälle über Glitzerminen'},
  lb_bluetenzauber:{eff:'licht:bluetenmine',text:'Blütenminen in allen Formen: Kranz, Fächer, Bukett, Pastell, Glitzer'},
  lb_gewitterfront:{eff:'licht:wetterleuchten',text:'Wetterleuchten über Crossetten und Glitzerminen'},
  lb_glutstrom:{eff:'licht:weidenkomet',text:'Goldkometen, Goldfächer und Goldwasserfall zwischen Tigerkometen und Lavabrocken'},
  lb_grandelumiere:{eff:'licht:kometenfaecher',text:'Das große Lichter-Finale: alle Favoriten in einer Show'}
});

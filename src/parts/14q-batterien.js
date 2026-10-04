/* =========================================================
   Neue Lichter-Batterien (03.10. abends, Tom: "Goldader finde ich echt
   schoen, aber du nimmst immer die Farbe Gold - mach auch andere Farben
   mit diesen Effekten, und Explosionen, die keinen grossen Knall ergeben,
   sondern leichtere Geschosse mit kleinem Sound ... nicht nur Goldader-
   Effekte in anderen Farben, sondern auch Sachen, die komplett anders
   aussehen, aber in die Richtung gehen. Auch bunt gemischt. Es muss eine
   passende Show sein"; dazu: "farbige Faecherkometen - eine schoene
   gruene (gruene Kometenfaecher nach oben, ganz weit oben gruene Mini-
   Explosionen), eine schoene blaue, auch Gold kombiniert mit Farbe").
   Vorbilder, die Tom gefallen: Goldader, Blitzweide, Blitzpalme,
   Silbergewitter (Hoehe!), Faecherkometen mit zackigem Knisterschweif,
   Crossettenkrone, Glutschmiede, Kronenkranz.
   Jede Batterie hat ihre eigenen Lichter, ihre eigene Folge und ihre
   Farbfamilie (Anomalie). Alles bricht mindestens so hoch wie
   Silbergewitter; nichts bleibt am Himmel stehen.
   ========================================================= */

/* Mini-Explosion ganz oben: ein Dutzend kleiner Farbsterne mit kurzem
   Glitzer und ein leises Knistern - kein Knall */
function qMini(e,c,s,n,laut){ const q=QUAL(), m=Math.round((n||12)*Math.max(0.6,q));
  for(let i=0;i<m;i++){ const d=randDir(), w=rand(3.6,5.4)*Math.sqrt(s||1), v=[d[0]*w,d[1]*w+0.6,d[2]*w];
    kgStern(psBig,e,v,lHell(c,1.5),rand(0.8,1.2),2.2,0,0.18);
    /* jeder Stern zieht einen kurzen Funkenschweif - sonst stehen die
       Mini-Explosionen aus 30 m als Punkthaufen da (Tom: keine Punkte) */
    rkFunken(e,v,2.2,0.05,1.0,i%2?8:12,mischF(lHell(c,1.2),[1,.85,.5],0.4),{ps:psMid,life:[0.3,0.55],g:1.6,streu:0.25,mit:0.05,mode:4}); }
  for(let i=0;i<Math.round(8*q);i++){ const d=randDir(), w=rand(1.5,3); psSmall.emit(e.x,e.y,e.z,d[0]*w,d[1]*w,d[2]*w,1.5,1.45,1.3,rand(0.08,0.2),1,1); }
  schall(e,v=>{ if(laut==='plopp') sfx.plopp(v*0.35,1.4); else sfx.prasseln(v*0.55); }); }

/* Zackenkomet: ein einzelner Faecherkomet (zackige, knisternde Linie wie
   auf dem Festivalbild) in Farbe A - oben zerstiebt er leise in B */
LICHTYP.zackkomet=function(o,A,B,s,opt){ const m=lMund(o), Q=lQuer({dir:FANDIR}), a=Math.sin(opt.ang||0)*Math.sign(Math.cos((opt.dir===undefined?FANDIR:opt.dir)-FANDIR)||1);
  const k=kfKomet(m,Q,a,lHell(A,1.4),30*Math.sqrt(s),7.5,0,0,KF_ART.tor); lStart(m,1.1,0.5); sfx.zischen(distVol(m)*0.3,1.2);
  if(k) kgSpaeter(k.T,()=>qMini(sternNach(k.e,k.v[0],k.v[1],k.v[2],7.5,k.T),B,s,11)); };
/* Farbweidenkomet: wie der Weidenkomet, aber der Schweif haengt in der
   Farbe A (mit etwas Glut) und sinkt lange */
LICHTYP.farbweidenkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=5, v=lAbschuss(27*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+1.3;
  lKopf(m,v,lHell(A,1.45),T,G,0,0.4);
  lFunken(m,v,G,0.05,T,75,mischF(lHell(A,1.0),[.95,.55,.2],0.35),{ps:psMid,life:[2.0,3.0],g:0.75,streu:0.12,mit:0.03,mode:0,spur:0.25});
  lStart(m,1.1,0.6); sfx.zischen(distVol(m)*0.3,T); later(1.2,()=>sfx.rieseln(distVol(m)*0.4,3));
};
/* Farbglitzermine: eine Saeule aus Glitzersternen in Farbe A, oben ein
   paar weisse Funkler */
LICHTYP.farbglitzermine=function(o,A,B,s,opt){ lMine(o,s,opt,{H:[13,20],kegel:0.13,md:4,c:i=>i%6?lHell(A,1.35):[1.5,1.5,1.55]}); sfx.rieseln(distVol(o)*0.6,3); };
/* Zweigkomet: der Komet teilt sich zweimal in zwei (wie ein Zweig) -
   A, dann B, zuletzt weisse Spitzen; trockenes leises Knacken */
LICHTYP.zweigkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(26*Math.sqrt(s),G,opt,0.3), t1=lScheitel(v[1],G)*0.62, Q=lQuer({dir:FANDIR});
  lKopf(m,v,lHell(A,1.45),t1,G,0,0.25); lFunken(m,v,G,0.03,t1,70,mischF(lHell(A,1.1),[1,.85,.5],0.4),{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4}); lStart(m,1,0.6);
  const zweig=(p,w,t,c,stufe)=>kgSpaeter(t,()=>{ const e=sternNach(p,w[0],w[1],w[2],G,t), u=bahnTempo(w,G,t);
    for(const sd of [-1,1]){ const sp=(stufe?4:5.5)*Math.sqrt(s), dv=[u[0]*0.5+Q[0]*sd*sp,u[1]*0.5+2.2,u[2]*0.5+Q[2]*sd*sp], L=stufe?1.3:0.75;
      lKopf(e,dv,lHell(c,1.5),L,3.2,0,0.25); lFunken(e,dv,3.2,0.02,L,40,mischF(lHell(c,1.1),[1,.85,.5],0.4),{ps:psMid,life:[0.4,0.7],g:2,streu:0.2,mit:0.1,mode:4});
      if(!stufe) zweig(e,dv,L,B,1); else kgSpaeter(L,()=>qMini(sternNach(e,dv[0],dv[1],dv[2],3.2,L),[1,1,1],s*0.5,5)); }
    schall(e,x=>sfx.crack(x*(stufe?0.25:0.4))); });
  zweig(m,v,t1,A,0);
};
/* Palme aus dem dunklen Aufstieg in Farbe: Koepfe A, der Schweif in A
   mit Gold gemischt, die Enden zerstieben in kleine Mini-Explosionen B */
LICHTYP.farbpalme=function(o,A,B,s,opt){
  lDunkel(o,s,opt,29,e=>{ lPalme(e,s,{n:9,w:8.2,L:2.9,kopf:()=>lHell(A,1.5),schweif:()=>mischF(lHell(A,1.1),GOLDF,0.45),rate:50,
      ende:(q,k)=>kgSpaeter(k*0.04,()=>qMini(q,B,s*0.5,6))});
    schall(e,x=>{ sfx.plopp(x*0.45,0.9); later(2.3,()=>sfx.prasseln(x*0.5)); }); });
};
/* Glutpalme: die Wedel gluehen orange und kuehlen im Fallen zu dunklem
   Rot ab (Glut), an den Enden knistert es */
LICHTYP.glutpalme=function(o,A,B,s,opt){
  lDunkel(o,s,opt,28,e=>{ lPalme(e,s,{n:8,w:7.6,L:3.2,G:2.6,kopf:()=>[1.5,.7,.18],schweif:()=>[1.25,.55,.14],md:2,rate:55,life:[1.1,1.8],
      ende:(q,k)=>kgSpaeter(0.1+k*0.05,()=>{ for(let j=0;j<Math.round(7*QUAL());j++){ const d=randDir(); psSmall.emit(q.x,q.y,q.z,d[0]*2.2,d[1]*2.2,d[2]*2.2,1.5,1.2,.7,rand(0.1,0.25),1,1); } })});
    schall(e,x=>{ sfx.wumms(x*0.3); later(2.5,()=>sfx.crackle(x*0.4)); }); });
};
/* Polarweide: dunkler Aufstieg, eine Weide in A, deren Faeden im Sinken
   zu B werden; ab und zu zuckt ein weisser Blitz darin */
LICHTYP.polarweide=function(o,A,B,s,opt){
  lDunkel(o,s,opt,29,e=>{ const n=Math.round(32*QUAL())+6, arme=[];
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(6,7.4)*Math.sqrt(s), dv=[d[0]*w,d[1]*w*0.5+1.4,d[2]*w], L=rand(3.8,4.6);
      const h=kgStern(psBig,e,dv,lHell(A,1.2),L,1.8,0,0.45); kgSpaeter(L*rand(0.35,0.5),()=>kgFarbe(h,lHell(B,1.25)));
      lFunken(e,dv,1.8,0.1,L,16,mischF(lHell(A,0.8),lHell(B,0.8),0.5),{ps:psMid,life:[1.3,2.0],g:0.6,streu:0.08,mit:0.02,mode:0,spur:0.2}); arme.push(dv); }
    for(let t=0.6;t<3.6;t+=0.22){ const tt=t; kgSpaeter(tt,()=>{ const dv=arme[Math.floor(Math.random()*arme.length)]; lBlitz(sternNach(e,dv[0],dv[1],dv[2],1.8,tt),[1.9,1.9,2]); }); }
    schall(e,x=>{ sfx.plopp(x*0.35,1.0); later(0.4,()=>sfx.rieseln(x*0.5,4)); }); });
};
/* Kirschkranz: hohle Tulpe aus Farbsternen, jeder zieht einen hellen
   Glitzerschweif; oben werden die Spitzen weiss */
LICHTYP.kirschkranz=function(o,A,B,s,opt){
  const r=lMine(o,s,opt,{n:30,H:[15,18],kegel:0.36,ring:true,md:0,nach:[0.4,0.6],spur:0.15,c:()=>lHell(A,1.4)});
  r.out.forEach(({v,T,h})=>{ lFunken(r.m,v,r.G,0.12,T,14,mischF(lHell(B,1.1),[1.2,1.1,1],0.4),{ps:psMid,life:[0.6,1.0],g:2,streu:0.15,mit:0.05,mode:4}); kgSpaeter(T*0.72,()=>kgFarbe(h,[1.6,1.55,1.6])); });
  sfx.rieseln(distVol(o)*0.5,3);
};
/* Farbtiger: dunkler Aufstieg, dann neun schwere Kometen in A mit so
   dichtem Glitzerschweif, dass sie als breite Baender stehen und
   herabrieseln; die Enden funkeln in B */
LICHTYP.farbtiger=function(o,A,B,s,opt){
  lDunkel(o,s,opt,30,e=>{ const q=QUAL(), n=8+Math.round(2*q), G=3;
    for(let i=0;i<n;i++){ const d=randDir(); d[1]=d[1]*0.6+0.3; const l=Math.hypot(d[0],d[1],d[2]), w=rand(10,12)*Math.sqrt(s)/l, v=[d[0]*w,d[1]*w,d[2]*w], T=rand(1.6,2.0);
      kgStern(psHuge,e,v,lHell(A,1.4),T,G,0,0.25);
      rkFunken(e,v,G,0.03,T,70,mischF(lHell(A,1.1),[1,.8,.4],0.35),{life:[0.9,1.5],g:1.1,streu:0.45,mit:0.06,mode:4});
      kgSpaeter(T,()=>qMini(sternNach(e,v[0],v[1],v[2],G,T),B,s*0.4,5)); }
    schall(e,x=>{ sfx.plopp(x*0.5,0.8); sfx.fauchen(x*0.35,1.4); later(1.2,()=>sfx.rieseln(x*0.45,3)); }); });
};
/* Knistercrossette: Komet in A, der sich in vier teilt - jeder Arm
   endet in einer kleinen knisternden Explosion in B */
LICHTYP.knistercrossette=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(28*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.72;
  lKopf(m,v,lHell(A,1.4),tS,G,0,0.25); lFunken(m,v,G,0.03,tS,80,[1,.8,.42],{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4}); lStart(m,1,0.6);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), w=bahnTempo(v,G,tS), a0=rand(0,Math.PI*2);
    for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, sp=7*Math.sqrt(s), dv=[Math.cos(a)*sp+w[0]*0.4,1.4+w[1]*0.4,Math.sin(a)*sp+w[2]*0.4], L=1.1;
      lKopf(e,dv,lHell(A,1.45),L,3.5,0,0.3); lFunken(e,dv,3.5,0.02,L,55,[1,.8,.42],{ps:psMid,life:[0.4,0.8],g:2,streu:0.2,mit:0.1,mode:4});
      kgSpaeter(L,()=>qMini(sternNach(e,dv[0],dv[1],dv[2],3.5,L),B,s*0.6,8)); }
    schall(e,x=>sfx.crack(x*0.4)); });
};
/* Kronenkomet (nach der Crossettenkrone, Tom: "schoener Effekt, merk's
   dir"): sechs Arme wechseln im Flug von A zu B, an jedem Ende haengt
   eine kleine Glitzerkrone */
LICHTYP.kronenkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(29*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.75;
  lKopf(m,v,lHell(A,1.4),tS,G,0,0.25); lFunken(m,v,G,0.03,tS,80,[1,.8,.42],{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4}); lStart(m,1,0.6);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), a0=rand(0,Math.PI*2);
    for(let k=0;k<6;k++){ const a=a0+k*Math.PI/3, sp=6.5*Math.sqrt(s), dv=[Math.cos(a)*sp,1.6,Math.sin(a)*sp], L=1.3;
      const h=kgStern(psHuge,e,dv,lHell(A,1.5),L,3.2,0,0.3); kgSpaeter(0.55,()=>kgFarbe(h,lHell(B,1.6)));
      lFunken(e,dv,3.2,0.02,L,45,[1,.8,.42],{ps:psMid,life:[0.4,0.8],g:2,streu:0.2,mit:0.1,mode:4});
      kgSpaeter(L,()=>{ const q=sternNach(e,dv[0],dv[1],dv[2],3.2,L); for(let i=0;i<Math.round(7*QUAL())+3;i++){ const b=rand(0,Math.PI*2), w=rand(1.2,2.2)*Math.sqrt(s); kgStern(psBig,q,[Math.cos(b)*w,rand(0,0.8),Math.sin(b)*w],i%3?[1.5,1.15,.5]:lHell(B,1.5),rand(1.6,2.1),1.4,4,0.3); } }); }
    schall(e,x=>{ sfx.crack(x*0.4); later(1.3,()=>sfx.rieseln(x*0.45,2.4)); }); });
};
/* Fallkomet (Sternschnuppe): schraeg geschossen, zieht oben einen
   Bogen und faellt mit langem Silberschweif wieder herab; erlischt
   hoch in der Luft */
LICHTYP.fallkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=7, a=opt.ang||0, v=lAbschuss(27*Math.sqrt(s),G,{ang:a*1.4+(a>=0?0.12:-0.12),dir:opt.dir},0.3), T=lScheitel(v[1],G)+0.9;
  lKopf(m,v,lHell(A,1.5),T,G,0,0.4);
  lFunken(m,v,G,0.05,T,110,mischF(lHell(A,1),[1.25,1.27,1.35],0.6),{ps:psMid,life:[0.9,1.5],g:0.9,streu:0.12,mit:0.03,mode:4,spur:0.15});
  lStart(m,1,0.6); sfx.zischen(distVol(m)*0.35,T);
};
/* Farbschirm: dunkler Aufstieg, oben spannt sich ein Schirm aus
   Glitzersternen in A, der wie eine Kamuro-Weide herabhaengt; am Ende
   knistern die Spitzen in B */
LICHTYP.farbschirm=function(o,A,B,s,opt){
  lDunkel(o,s,opt,30,e=>{ const n=Math.round(44*QUAL())+8;
    for(let i=0;i<n;i++){ const d=randDir(); d[1]=Math.abs(d[1])*0.5+0.15; const l=Math.hypot(d[0],d[1],d[2]), w=rand(6.5,7.5)*Math.sqrt(s)/l, dv=[d[0]*w,d[1]*w,d[2]*w], L=rand(3.4,4.0);
      kgStern(psBig,e,dv,lHell(A,1.3),L,1.5,4,0.6);
      if(i%3===0) kgSpaeter(L-0.25,()=>{ const q=sternNach(e,dv[0],dv[1],dv[2],1.5,L-0.25); for(let j=0;j<3;j++){ const dd=randDir(); psSmall.emit(q.x,q.y,q.z,dd[0]*1.5,dd[1]*1.5,dd[2]*1.5,...lHell(B,1.6),rand(0.1,0.22),1,1); } }); }
    schall(e,x=>{ sfx.plopp(x*0.4,1.1); later(0.3,()=>sfx.rieseln(x*0.55,3.6)); later(3.2,()=>sfx.crackle(x*0.35)); }); });
};
/* Lilienkomet: der Komet oeffnet sich oben in sechs Kometen, die sich
   wie Lilienblaetter nach aussen und unten biegen - Koepfe A, Spitzen B */
LICHTYP.lilienkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(28*Math.sqrt(s),G,opt,0.3), tS=lScheitel(v[1],G)*0.85;
  lKopf(m,v,[1.3,1.3,1.35],tS,G,0,0.2); lFunken(m,v,G,0.03,tS,60,[1.2,1.2,1.25],{ps:psMid,life:[0.4,0.8],g:2.2,streu:0.2,mit:0.1,mode:0}); lStart(m,1,0.6);
  kgSpaeter(tS,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,tS), a0=rand(0,Math.PI*2);
    for(let k=0;k<6;k++){ const a=a0+k*Math.PI/3, sp=5.8*Math.sqrt(s), dv=[Math.cos(a)*sp,3.6,Math.sin(a)*sp], L=1.9;
      const h=kgStern(psHuge,e,dv,lHell(A,1.5),L,4.2,0,0.3); kgSpaeter(1.0,()=>kgFarbe(h,lHell(B,1.6)));
      lFunken(e,dv,4.2,0.03,L,50,mischF(lHell(A,1.1),[1,.85,.5],0.45),{ps:psMid,life:[0.6,1.0],g:1.8,streu:0.15,mit:0.06,mode:4}); }
    schall(e,x=>{ sfx.plopp(x*0.4,1.2); later(0.5,()=>sfx.rieseln(x*0.4,2)); }); });
};
/* Helixkomet: zwei Koepfe A und B umkreisen einander auf dem Weg nach
   oben und ziehen einen gedrehten Doppelschweif; oben trennen sie sich
   und verloeschen in zwei kleinen Explosionen */
LICHTYP.helixkomet=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(28*Math.sqrt(s),G,opt,0.25), T=lScheitel(v[1],G)*0.92, R=0.55*Math.sqrt(s), [r1,r2]=rkBild(m), tag=FW_TAG, w0=rand(0,6.3);
  lStart(m,1,0.6); sfx.zischen(distVol(m)*0.35,T);
  for(let t=1/30;t<T;t+=1/30){ const tt=t; imBild(tt,()=>{ const at=FW_TAG, sa=SCHWEIF; FW_TAG=tag; SCHWEIF=0.25; const b=bahnOrt(m,v,G,tt), u=bahnTempo(v,G,tt), ph=w0+tt*9, k=Math.min(1,tt/0.3);
      [[A,0],[B,Math.PI]].forEach(([c,d])=>{ const x=Math.cos(ph+d)*R*k, y=Math.sin(ph+d)*R*k, q={x:b.x+r1[0]*x+r2[0]*y,y:b.y+r1[1]*x+r2[1]*y,z:b.z+r1[2]*x+r2[2]*y};
        psHuge.emit(q.x,q.y,q.z,u[0]*0.1,u[1]*0.1,u[2]*0.1,...lHell(c,1.5),0.07,0,0);
        for(let i=0;i<Math.round(2*QUAL());i++) psMid.emit(q.x,q.y,q.z,rand(-.3,.3),rand(-.6,0),rand(-.3,.3),...mischF(lHell(c,1.1),[1,.85,.5],0.4),rand(0.5,0.9),1.4,4); });
      SCHWEIF=sa; FW_TAG=at; }); }
  kgSpaeter(T,()=>{ const e=sternNach(m,v[0],v[1],v[2],G,T); qMini({x:e.x-r1[0]*R*1.5,y:e.y,z:e.z-r1[2]*R*1.5},A,s*0.7,9); qMini({x:e.x+r1[0]*R*1.5,y:e.y,z:e.z+r1[2]*R*1.5},B,s*0.7,9); });
};
/* Gluehwurm: kleiner, leiser Komet in A mit feinem Glitzer, oben
   zerstiebt er in eine Handvoll kleiner Funken - die Kinder-Variante */
LICHTYP.gluehwurm=function(o,A,B,s,opt){
  const m=lMund(o), G=6, v=lAbschuss(23*Math.sqrt(s),G,opt,0.4), T=lScheitel(v[1],G)+0.1;
  lKopf(m,v,lHell(A,1.4),T,G,0,0.3); lFunken(m,v,G,0.03,T,70,mischF(lHell(A,1.1),[1,.9,.6],0.5),{ps:psMid,life:[0.5,0.9],g:2.2,streu:0.2,mit:0.1,mode:4});
  lStart(m,0.9,0.4); kgSpaeter(T,()=>qMini(sternNach(m,v[0],v[1],v[2],G,T),B,s*0.7,8,'plopp'));
};

/* Schweifarten fuer die neuen Faecher-Abfolgen (14m lKometenFaecher):
   puls - ganze Faecher auf Schlag, Silberglitzer; tor - von aussen nach
   innen, knisternd in Kopffarbe; welle - schwingend, lange haengend */
Object.assign(KF_ART,{
  puls:{L:[0.5,0.95],b:{life:[0.7,1.2],g:1.4,streu:0.5,mode:4},kn:0.08,ton:'rieseln'},
  tor:{L:[0.4,0.75],b:{life:[0.2,0.4],g:4,streu:2,mode:4,ps:'klein'},kn:0.18,ton:'prasseln'},
  welle:{L:[0.9,1.6],b:{life:[1.2,2.0],g:0.5,streu:0.2,mode:4},kn:0.04,ton:'rieseln'}});
/* Farbfaecher mit Mini-Explosionen oben (Tom: die gruene, die blaue, Gold mit Farbe) */
const qFaecher=(muster,D,H,c,mini,extra)=>function(o,A,B,s,opt){ lBreit(o,A,B,s,opt,Object.assign({schuss:true,muster,D,H,weit:0.72,n:24,md:0,c:(u,j)=>c(u,j,A,B),
  mini:mini?(e,u,j)=>{ if(j%mini.jeder===0) qMini(e,mini.c(u,j,A,B),0.8,mini.n||9); }:null},extra||{})); };
LICHTYP.breitjade=qFaecher('puls',6,10,(u,j,A)=>j%5===4?[1.3,1.32,1.4]:lHell(A,1.5),{jeder:1,n:8,c:(u,j,A)=>A});
LICHTYP.breitsaphir=qFaecher('welle',6.5,10,(u,j,A,B)=>j%4===3?lHell(B,1.5):lHell(A,1.5),{jeder:2,n:9,c:(u,j,A,B)=>j%4?A:B});
LICHTYP.breitgoldsaphir=qFaecher('tor',6,10.4,(u,j,A)=>j%2?GOLDF:lHell(A,1.5),{jeder:2,n:10,c:(u,j,A)=>A});
LICHTYP.breitbunt=qFaecher('faecher',6,10.2,(u,j,A,B)=>{ const F=[A,B,[A[2],A[0],A[1]],[B[1],B[2],B[0]]]; return lHell(F[j%4],1.5); },{jeder:3,n:9,c:(u,j,A,B)=>j%2?A:B});
LICHTYP.breitrubin=qFaecher('stufen',6.5,10.6,(u,j,A)=>j%3===2?GOLDF:lHell(A,1.45),{jeder:2,n:8,c:()=>[1,.8,.3]});
LICHTYP.breitamethyst=qFaecher('kreuz',6,10,(u,j,A,B)=>j%3?lHell(A,1.5):[1.35,1.36,1.45],{jeder:3,n:8,c:(u,j,A,B)=>B});
Object.assign(LICHT_BRENN,{breitjade:11,breitsaphir:11.5,breitgoldsaphir:11,breitbunt:11,breitrubin:11.5,breitamethyst:11});

/* ---------- Die Batterien ---------- */
/* Dramaturgie (Tom: "das muss im Gesamten schoen aussehen - die Anordnung,
   wann was kommt, wie viel kommt"): jedes Licht braucht 4-5 s am Himmel.
   Bis zum Finale stehen die Schuesse anderthalbmal so weit auseinander wie
   notiert, und zwischen zwei Abschnitten bleibt mindestens 1,5 s Luft -
   erst das Finale verdichtet. */
const nbShow=(id,th,rampe,ph)=>lbShow(id,th,rampe,ph.map((p,i)=>i===ph.length-1||(i===ph.length-2&&ph[i+1].mit)?p:
  Object.assign({},p,{gap:p.gap!==undefined?+(p.gap*1.5).toFixed(3):p.gap,pause:p.mit||(ph[i+1]&&ph[i+1].mit)?p.pause:Math.max(p.pause||0,1.5)})),{verzoegerung:true});
nbShow('lb_gluehwuermchen',[['limette','gold'],['mint','zitrone'],['gruen','gold']],{sz:[0.8,1.05],pw:[0,0],hell:[0.9,1.15],kurve:'linear'},[
  {n:4,gap:1.2,rohrFolge:[-1,1,-0.4,0.4],licht:'gluehwurm',farbe:0},
  {n:4,gap:0.5,muster:'v',ang:0.25,licht:'gluehwurm',farbe:1,pause:0.8},
  {n:4,gap:0.25,muster:'mitte',ang:0.3,licht:'gluehwurm',kal:'gross',farbe:2,pause:4}]);
nbShow('lb_sternschnuppen',[['silber','himmel'],['weiss','gold'],['himmel','silber']],{sz:[0.85,1.1],pw:[0,1],hell:[0.9,1.2],kurve:'linear'},[
  {n:3,gap:1.4,muster:'aussen',ang:0.35,licht:'fallkomet',farbe:0},
  {n:6,gap:0.35,muster:'wischer',ang:0.4,licht:'fallkomet',farbe:1,pause:0.6},
  {n:2,gap:0.7,rohrFolge:[-1,1],licht:'farbglitzermine',farbe:2,pause:0.6},
  {n:3,gap:0.12,muster:'x',ang:0.4,licht:'fallkomet',kal:'gross',farbe:0,pause:4}]);
nbShow('lb_kirschbluete',[['rose','weiss'],['pfirsich','gold'],['rose','gold']],{sz:[0.85,1.1],pw:[0,1],hell:[0.9,1.2],kurve:'linear'},[
  {n:3,gap:1.3,rohrFolge:[0,-1,1],licht:'kirschkranz',farbe:0},
  {n:4,gap:0.6,muster:'paar',ang:0.3,licht:'lilienkomet',farbe:1,pause:0.8},
  {n:4,gap:0.3,muster:'kreis',ang:0.25,licht:'kirschkranz',farbe:2},
  {n:4,gap:0.1,muster:'mitte',ang:0.25,licht:'lilienkomet',kal:'gross',farbe:0,pause:4.5}]);
nbShow('lb_jadeader',[['gruen','gold'],['limette','gold'],['mint','silber']],{sz:[0.85,1.15],pw:[0,1],hell:[0.9,1.2],kurve:'spaet'},[
  {n:4,gap:1.0,muster:'aussen',ang:0.3,licht:'farbweidenkomet',farbe:0},
  {n:6,gap:0.3,muster:'z',ang:0.35,licht:'zackkomet',farbe:1},
  {mit:true,n:2,gap:1.2,rohrFolge:[-1,1],licht:'farbglitzermine',farbe:2,pause:0.8},
  {n:8,gap:0.12,muster:'welle',ang:0.4,licht:'zackkomet',kal:'gross',farbe:0,pause:4}]);
nbShow('lb_eisvogel',[['tuerkis','blau'],['himmel','weiss'],['blau','tuerkis']],{sz:[0.85,1.15],pw:[0,1],hell:[0.9,1.2],kurve:'linear'},[
  {n:4,gap:1.1,muster:'mitte',ang:0.25,licht:'zweigkomet',farbe:0},
  {n:6,gap:0.4,muster:'x',ang:0.35,licht:'fallkomet',farbe:1},
  {mit:true,n:4,gap:0.6,rohrFolge:RF4,licht:'farbglitzermine',farbe:2,pause:0.6},
  {n:8,gap:0.14,muster:'w',ang:0.4,licht:'zweigkomet',kal:'gross',farbe:2,pause:4.5}]);
nbShow('lb_glutpalmen',[['orange','gold'],['scharlach','bernstein'],['bernstein','rot']],{sz:[0.85,1.2],pw:[0,1],hell:[0.9,1.25],kurve:'spaet'},[
  {n:3,gap:1.6,muster:'gerade',licht:'glutpalme',farbe:0},
  {n:6,gap:0.45,muster:'v',ang:0.3,licht:'knistercrossette',farbe:1},
  {mit:true,n:4,gap:0.7,rohrFolge:RF4,licht:'farbweidenkomet',farbe:2,pause:0.8},
  {n:7,gap:0.13,muster:'aussen',ang:0.35,licht:'glutpalme',kal:'gross',farbe:0,pause:5}]);
nbShow('lb_saphirfaecher',[['blau','himmel'],['himmel','weiss'],['indigo','tuerkis']],{sz:[0.9,1.2],pw:[0,1],hell:[0.9,1.25],kurve:'linear'},[
  {n:2,gap:1.0,rohrFolge:[-1,1],licht:'breitsaphir',kal:'mittel',farbe:0,pause:5.6},
  {n:6,gap:0.5,muster:'w',ang:0.3,licht:'zackkomet',farbe:1},
  {n:1,rohrFolge:[0],licht:'breitsaphir',kal:'gross',farbe:2,pause:5.8},
  {n:4,gap:0.3,muster:'aussen',ang:0.35,licht:'wechselbluete',farbe:1,pause:1.0},
  {n:3,gap:0.12,rohrFolge:RF3,licht:'breitsaphir',kal:'gross',farbe:0,pause:6}]);
nbShow('lb_smaragdfaecher',[['gruen','limette'],['mint','gruen'],['limette','gold']],{sz:[0.9,1.2],pw:[0,1],hell:[0.9,1.25],kurve:'linear'},[
  {n:1,rohrFolge:[0],licht:'breitjade',kal:'mittel',farbe:0,pause:5.6},
  {n:6,gap:0.35,muster:'v',ang:0.3,licht:'drillingskomet',farbe:1},
  {mit:true,n:6,gap:0.35,muster:'zufall',ang:0.3,licht:'gluehwurm',kal:'gross',farbe:0,pause:1.0},
  {n:2,gap:1.0,rohrFolge:[-1,1],licht:'breitjade',kal:'gross',farbe:2,pause:5.5},
  {n:3,gap:0.1,rohrFolge:RF3,licht:'breitjade',kal:'gross',farbe:0,pause:6}]);
nbShow('lb_rubinpalmen',[['rot','gold'],['scharlach','weiss'],['rose','gold']],{sz:[0.9,1.25],pw:[0,2],hell:[0.9,1.25],kurve:'spaet'},[
  {n:1,rohrFolge:[0],licht:'breitrubin',kal:'mittel',farbe:0,pause:5.6},
  {n:4,gap:1.2,muster:'aussen',ang:0.25,licht:'farbpalme',farbe:0},
  {n:6,gap:0.3,muster:'paar',ang:0.35,licht:'knistercrossette',farbe:1},
  {mit:true,n:4,gap:0.8,muster:'gerade',licht:'farbweidenkomet',farbe:2,pause:0.8},
  {n:7,gap:0.12,muster:'mitte',ang:0.3,licht:'farbpalme',kal:'gross',farbe:1,pause:5.5}]);
nbShow('lb_polarweiden',[['tuerkis','violett'],['mint','himmel'],['aqua','magenta']],{sz:[0.9,1.25],pw:[0,2],hell:[0.85,1.25],kurve:'spaet'},[
  {n:3,gap:1.6,muster:'v',ang:0.2,licht:'polarweide',farbe:0},
  {n:6,gap:0.35,muster:'wischer',ang:0.4,licht:'fallkomet',farbe:1},
  {mit:true,n:3,gap:1.0,rohrFolge:RF3,licht:'farbschirm',farbe:2,pause:1},
  {n:8,gap:0.13,muster:'kreis',ang:0.3,licht:'polarweide',kal:'gross',farbe:2,pause:6}]);
nbShow('lb_lilienfeld',[['magenta','gold'],['rose','weiss'],['violett','gold'],['pfirsich','rose']],{sz:[0.9,1.25],pw:[0,2],hell:[0.9,1.25],kurve:'spaet'},[
  {n:2,gap:0.5,rohrFolge:[-1,1],licht:'breitbluete',kal:'mittel',farbe:1,pause:5.6},
  {n:4,gap:1.0,muster:'mitte',ang:0.25,licht:'lilienkomet',farbe:0},
  {n:6,gap:0.35,muster:'z',ang:0.35,licht:'helixkomet',farbe:1},
  {mit:true,n:4,gap:0.8,rohrFolge:RF4,licht:'kirschkranz',farbe:2,pause:1},
  {n:8,gap:0.12,muster:'aussen',ang:0.35,licht:'lilienkomet',kal:'gross',farbe:3,pause:5.5}]);
nbShow('lb_goldsaphir',[['blau','gold'],['himmel','gold'],['gold','blau']],{sz:[0.9,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:2,gap:0.4,rohrFolge:[-1,1],licht:'breitgoldsaphir',kal:'mittel',farbe:0,pause:5.5},
  {n:6,gap:0.9,muster:'v',ang:0.25,licht:'kronenkomet',farbe:0},
  {n:8,gap:0.25,muster:'welle',ang:0.4,licht:'zackkomet',farbe:1},
  {mit:true,n:4,gap:0.8,muster:'gerade',licht:'farbweidenkomet',farbe:2,pause:1},
  {n:3,gap:0.12,rohrFolge:RF3,licht:'breitgoldsaphir',kal:'gross',farbe:0,pause:5.5},
  {n:3,gap:0.3,muster:'mitte',ang:0.2,licht:'kronenkomet',kal:'gross',farbe:2,pause:6}]);
nbShow('lb_amethystregen',[['violett','silber'],['indigo','weiss'],['magenta','violett']],{sz:[0.9,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:1,rohrFolge:[0],licht:'breitamethyst',kal:'mittel',farbe:0,pause:5.6},
  {n:4,gap:1.3,muster:'aussen',ang:0.3,licht:'farbschirm',farbe:0},
  {n:8,gap:0.3,muster:'x',ang:0.35,licht:'kaskadenfall',farbe:1},
  {mit:true,n:4,gap:0.6,muster:'gerade',licht:'polarweide',farbe:2,pause:0.8},
  {n:2,gap:0.5,rohrFolge:[-1,1],licht:'breitamethyst',kal:'gross',farbe:1,pause:5.5},
  {n:9,gap:0.12,muster:'mitte',ang:0.3,licht:'farbschirm',kal:'gross',farbe:2,pause:6}]);
nbShow('lb_doppelhelix',[['gold','tuerkis'],['rot','weiss'],['magenta','limette'],['blau','gold']],{sz:[0.9,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'linear'},[
  {n:4,gap:1.1,muster:'gerade',licht:'helixkomet',farbe:0},
  {n:2,gap:0.5,rohrFolge:[-1,1],licht:'breitbunt',kal:'mittel',farbe:1,pause:5.5},
  {n:8,gap:0.3,muster:'spirale',ang:0.35,licht:'helixkomet',farbe:2},
  {mit:true,n:6,gap:0.6,muster:'aussen',ang:0.35,licht:'zweigkomet',farbe:3,pause:0.8},
  {n:10,gap:0.1,muster:'paar',ang:0.35,licht:'helixkomet',kal:'gross',farbe:1,pause:6}]);
nbShow('lb_farbtiger',[['gruen','gold'],['blau','silber'],['magenta','gold'],['tuerkis','gold']],{sz:[0.9,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:2,gap:0.4,rohrFolge:[-1,1],licht:'breitjade',kal:'mittel',farbe:0,pause:5.6},
  {n:4,gap:1.4,muster:'v',ang:0.2,licht:'farbtiger',farbe:0},
  {n:6,gap:0.35,muster:'w',ang:0.35,licht:'knistercrossette',farbe:1},
  {mit:true,n:4,gap:0.9,muster:'gerade',licht:'farbtiger',farbe:2,pause:1},
  {n:6,gap:0.6,muster:'z',ang:0.35,licht:'farbweidenkomet',farbe:3},
  {n:8,gap:0.12,muster:'mitte',ang:0.3,licht:'farbtiger',kal:'gross',farbe:2,pause:6}]);
nbShow('lb_kronenfeuer',[['rot','gold'],['blau','gold'],['gruen','gold'],['violett','gold']],{sz:[0.9,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:1,rohrFolge:[0],licht:'breitrubin',kal:'gross',farbe:0,pause:6},
  {n:6,gap:1.0,muster:'aussen',ang:0.3,licht:'kronenkomet',farbe:0},
  {n:6,gap:0.35,muster:'x',ang:0.35,licht:'farbkrone',farbe:1},
  {mit:true,n:4,gap:0.9,rohrFolge:RF4,licht:'doppelkrone',farbe:2,pause:1},
  {n:6,gap:0.5,muster:'welle',ang:0.35,licht:'kronenkomet',farbe:3},
  {n:9,gap:0.12,muster:'mitte',ang:0.3,licht:'kronenkomet',kal:'gross',farbe:1,pause:6}]);
nbShow('lb_jadekoenig',[['gruen','gold'],['limette','gold'],['mint','silber'],['gold','gruen']],{sz:[0.95,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:2,gap:0.5,rohrFolge:[-1,1],licht:'breitjade',kal:'gross',farbe:0,pause:5.6},
  {n:4,gap:1.2,muster:'mitte',ang:0.25,licht:'kreuzbluete',farbe:0},
  {n:8,gap:0.3,muster:'z',ang:0.4,licht:'zackkomet',farbe:1},
  {mit:true,n:4,gap:0.8,rohrFolge:RF4,licht:'farbglitzermine',farbe:2,pause:0.8},
  {n:6,gap:0.6,muster:'v',ang:0.3,licht:'farbweidenkomet',farbe:3},
  {n:10,gap:0.1,muster:'w',ang:0.35,licht:'farbpalme',kal:'gross',farbe:1,pause:6}]);
nbShow('lb_paradiesvogel',[['magenta','limette'],['tuerkis','gold'],['orange','violett'],['rot','gruen'],['blau','zitrone']],{sz:[0.95,1.3],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:2,gap:0.4,rohrFolge:[-1,1],licht:'breitbunt',kal:'mittel',farbe:0,pause:5.6},
  {n:6,gap:0.9,muster:'aussen',ang:0.3,licht:'vierfarbbluete',farbe:1},
  {n:8,gap:0.3,muster:'kreis',ang:0.3,licht:'farbpalme',farbe:2},
  {mit:true,n:6,gap:0.5,muster:'zufall',ang:0.3,licht:'helixkomet',farbe:3,pause:0.8},
  {n:3,gap:0.25,rohrFolge:RF3,licht:'breitbunt',kal:'gross',farbe:4,pause:5.5},
  {n:11,gap:0.1,muster:'mitte',ang:0.35,licht:'farbtiger',kal:'gross',farbe:0,pause:6}]);
nbShow('lb_sternenfeuer',[['silber','blau'],['weiss','violett'],['himmel','gold'],['silber','tuerkis']],{sz:[0.95,1.35],pw:[0,2],hell:[0.9,1.3],kurve:'spaet'},[
  {n:2,gap:0.4,rohrFolge:[-1,1],licht:'breitsaphir',kal:'gross',farbe:0,pause:6},
  {n:4,gap:1.3,muster:'v',ang:0.2,licht:'polarweide',farbe:0},
  {n:8,gap:0.35,muster:'wischer',ang:0.4,licht:'fallkomet',farbe:1},
  {mit:true,n:4,gap:0.9,muster:'gerade',licht:'silberblitzweide',farbe:2,pause:1},
  {n:8,gap:0.5,muster:'x',ang:0.35,licht:'zweigkomet',farbe:3},
  {n:14,gap:0.1,muster:'aussen',ang:0.35,licht:'polarweide',kal:'gross',farbe:1,pause:6}]);
nbShow('lb_himmelsfeuer',[['blau','gold'],['rot','gold'],['gruen','gold'],['violett','silber'],['magenta','limette']],{sz:[0.95,1.35],pw:[0,3],hell:[0.9,1.35],kurve:'spaet'},[
  {n:3,gap:0.3,rohrFolge:[-1,0,1],licht:'breitgoldsaphir',kal:'gross',farbe:0,pause:5.5},
  {n:4,gap:1.2,muster:'mitte',ang:0.25,licht:'kronenkomet',farbe:1},
  {n:6,gap:0.35,muster:'z',ang:0.35,licht:'farbpalme',farbe:2},
  {mit:true,n:4,gap:0.9,rohrFolge:RF4,licht:'farbschirm',farbe:3,pause:1},
  {n:6,gap:0.5,muster:'welle',ang:0.35,licht:'lilienkomet',farbe:4},
  {n:6,gap:0.25,muster:'x',ang:0.35,licht:'farbtiger',farbe:0},
  {n:3,gap:0.2,rohrFolge:RF3,licht:'breitbunt',kal:'gross',farbe:2,pause:5.5},
  {n:16,gap:0.08,muster:'kreis',ang:0.35,licht:'polarweide',kal:'gross',farbe:1,pause:7}]);
Object.assign(SIGNATUR,{
  lb_gluehwuermchen:{eff:'licht:gluehwurm',text:'Kleine grüne Kometen, die oben leise in Funken zerstieben'},
  lb_sternschnuppen:{eff:'licht:fallkomet',text:'Silberkometen ziehen einen Bogen und fallen als Sternschnuppen'},
  lb_kirschbluete:{eff:'licht:kirschkranz',text:'Rosa Blütenkränze mit weißen Spitzen und Lilienkometen'},
  lb_jadeader:{eff:'licht:farbweidenkomet',text:'Die Goldader in Grün: Jadeweiden und Zackenkometen'},
  lb_eisvogel:{eff:'licht:zweigkomet',text:'Türkise Kometen teilen sich zweimal wie ein Zweig'},
  lb_glutpalmen:{eff:'licht:glutpalme',text:'Glühende Palmen, die im Fallen abkühlen'},
  lb_saphirfaecher:{idee:'Ozean',eff:'licht:breitsaphir',text:'Kometenfächer wie Wellen, oben zerplatzt die Gischt'},
  lb_smaragdfaecher:{eff:'licht:breitjade',text:'Grüne Kometenfächer auf Schlag, ganz oben grüne Mini-Explosionen'},
  lb_rubinpalmen:{eff:'licht:farbpalme',text:'Rote Palmen, deren Enden in kleinen Explosionen zerstieben'},
  lb_polarweiden:{eff:'licht:polarweide',text:'Türkise Weiden werden im Sinken violett, weiße Blitze darin'},
  lb_lilienfeld:{eff:'licht:lilienkomet',text:'Lilienkometen öffnen sich wie Blüten, Helixkometen dazwischen'},
  lb_goldsaphir:{eff:'licht:breitgoldsaphir',text:'Gold-Blau-Kometenfächer von außen nach innen, Kronenkometen'},
  lb_amethystregen:{eff:'licht:farbschirm',text:'Violette Glitzerschirme hängen wie Weiden, dazwischen Kaskaden'},
  lb_doppelhelix:{eff:'licht:helixkomet',text:'Zwei Farbköpfe winden sich umeinander nach oben'},
  lb_farbtiger:{eff:'licht:farbtiger',text:'Schwere Tigerkometen in Grün, Blau und Magenta'},
  lb_kronenfeuer:{eff:'licht:kronenkomet',text:'Kronenkometen: sechs Arme wechseln die Farbe, an jedem Ende eine Krone'},
  lb_jadekoenig:{idee:'Urwald',eff:'licht:breitjade',text:'Blütenkreuze, schwirrende Kometen, Lianen-Weiden und zum Schluss Urwaldpalmen in Grün'},
  lb_paradiesvogel:{idee:'bunt gemischt',eff:'licht:breitbunt',text:'Bunte Fächer, Vierfarbblüten, Farbpalmen und Tiger in allen Farben'},
  lb_sternenfeuer:{idee:'Sternenhimmel',eff:'licht:silberblitzweide',text:'Polarweiden, Sternschnuppen und Silberblitzweiden'},
  lb_himmelsfeuer:{idee:'Meisterwerk der Lichter',eff:'licht:kronenkomet',text:'Alle neuen Lichter in einer Show, Finale aus sechzehn Polarweiden'}
});

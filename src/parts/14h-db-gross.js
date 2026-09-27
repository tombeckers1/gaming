/* =========================================================
   Drehbuecher der Show-Produkte ab Level 16 und Spektakel-Batterien
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Katalog: katalog-shows-gross.md. Hier stehen
   - die neuen Bruchbilder dieser Kategorie (farfalle, silberwelle,
     blitzast, kreuzkomet, knallring, lauflicht, polarlicht, meteor,
     gamboge, weltenblitz, glutasche, kaleidoskop, glockenschlag,
     hagel, rohrkomet) und der Silber-Rossschweif
   - die 30 Drehbuecher (26 alte Produkte neu, 4 Spektakel-Batterien)
   - SIGNATUR je Produkt
   ========================================================= */

/* ---------------------------------------------------------
   Werkzeug
   --------------------------------------------------------- */
/* Stern mit Kennung: spaeter laesst sich seine Farbe (Helligkeit)
   aendern. maxl leicht verstimmt - wird der Platz im Ringpuffer neu
   vergeben, merkt grLebt() es. */
function grStern(ps,x,y,z,vx,vy,vz,c,life,g,mode,spur){
  const i=ps.next, a=SCHWEIF; if(spur!==undefined) SCHWEIF=spur;
  ps.emit(x,y,z,vx,vy,vz,c[0],c[1],c[2],life,g,mode||0); SCHWEIF=a;
  const mx=life*(1+Math.random()*1e-4)+1e-5; ps.maxl[i]=mx; return {ps,i,mx,c};
}
function grLebt(s){ return s.ps.maxl[s.i]===s.mx&&s.ps.life[s.i]>0; }
function grFarbe(s,c,h){ const j=s.i*3, b=s.ps.base; b[j]=c[0]*h; b[j+1]=c[1]*h; b[j+2]=c[2]*h; }
function grSpur(t,fn){ const a=SCHWEIF; SCHWEIF=t; try{ fn(); } finally { SCHWEIF=a; } }
/* Takt: eine Funktion je Bild, solange sie nicht false liefert (Obergrenze
   dauer+2 s). Jede Effektart bekommt ihren eigenen Emitter-Namen. Der
   Takt traegt die Show-Kennung (weltenblitz loescht ihn mit). */
function grTaktLauf(e,dt){ e.alter+=dt; let w; try{ w=e.fn(e,dt); }catch(err){ w=false; }
  if(w===false||e.alter>e.dauer+2) e.t=0; else e.t=Math.max(e.t,0.05); }
function grTakt(name,dauer,fn,o){ const k='gb_'+name; if(!NEU_EMIT[k]) NEU_EMIT[k]=grTaktLauf;
  const e={k,t:dauer,dauer,fn,alter:0,o:o||PAD,tag:FW_TAG}; emitters.push(e); return e; }
/* Sterne halten: die Helligkeit bleibt voll (statt linear zu verblassen)
   bis kurz vor dem gemeinsamen Verloeschen. flimmer ab s: leichtes
   Flimmern wie Licht durch Glas. */
function grHalten(name,liste,dauer,flimmer){
  grTakt(name,dauer,e=>{ let n=0;
    for(const s of liste){ if(!grLebt(s)) continue; n++; const f=s.ps.life[s.i]/s.ps.maxl[s.i];
      let h=1/Math.max(f,0.2); if(flimmer!==undefined&&e.alter>flimmer) h*=0.78+Math.random()*0.34; grFarbe(s,s.c,h); }
    return n>0; });
}
/* Blickebene: u waagrecht quer, v nach oben, n zur Kamera */
function grNormale(u,v){ return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]; }
const grWeiss=(c,w)=>[c[0]+(1-c[0])*w,c[1]+(1-c[1])*w,c[2]+(1-c[2])*w];
/* eigene Bruchklaenge (r.knall): leise statt Knall */
Object.assign(sfx,{
  still:()=>{},
  dumpf:v=>{ noise(0.35,0.3*v,260); tone(70,0.2,'sine',0.08*v,40); },
  polarRauschen:v=>rauschF({dur:3.5,vol:0.05*v,typ:'bandpass',f:900,q:0.5,rosa:true,an:1.2}),
  weltdonner:v=>{ v=Math.max(v,0.9); noise(0.3,1.2*v,5200); noise(2.2,1.4*v,240); tone(36,3.2,'sine',0.42*v,17);
    later(0.05,()=>grollen(3.6,1.3*v,150,0.3));
    /* Echo von den Haeusern */
    later(0.85,()=>noise(1.3,0.42*v,300)); later(1.7,()=>noise(1.1,0.24*v,240)); }
});
/* Show-Bruch ohne die Standard-Zutaten (Kern, Leuchthof, Nachglitzern) */
function grOhneZutaten(r,flash){ if(r) r.bruchOpt=Object.assign({},r.bruchOpt||{},{kern:false,nachglitzer:false},flash!==undefined?{flash}:{}); }

/* ---------------------------------------------------------
   Neue Bruchbilder (neue-effekte.md 1.2), 26.09., Tom: Anomalie
   --------------------------------------------------------- */
/* Farfalle (Silberwirbel): 8-12 kleine Silberraeder fliegen langsam
   aus, jedes dreht 4-6-mal je Sekunde und spruht tangential Titan-
   funken - so zieht es eine Spirale, schraubt sich zischend nach
   unten und erlischt einzeln. Nabe in Farbe B. */
const FARF={n:0};
EFF.farfalle=function(p,A,B,s,r){
  grOhneZutaten(r);
  const q=QUAL(), n=Math.round(rand(8,12)*Math.min(1.25,Math.max(0.8,s))), R=[];
  for(let k=0;k<n;k++){ const d=randDir(), w=rand(6,9)*Math.sqrt(s), [u,v]=basisBlick(p,0.7);
    R.push({p:[p.x,p.y,p.z],v:[d[0]*w,d[1]*w*0.7+1.2,d[2]*w],u,w:v,ph:rand(0,6.3),om:2*Math.PI*rand(4,6)*(k%2?1:-1),
      rad:rand(0.3,0.5)*Math.sqrt(s),aus:rand(2.0,2.8),acc:0}); }
  /* kleiner Zerlegerknall: nur ein Puff Silber */
  grSpur(0.05,()=>{ for(let i=0;i<Math.round(24*q);i++){ const d=randDir(), w=rand(2,4); psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,.9,.93,1,rand(0.15,0.3),1,0); } });
  const silber=[.95,.97,1.05];
  FARF.n+=n; later(2.8,()=>{ FARF.n=Math.max(0,FARF.n-n); });
  grTakt('farfalle',3,(e,dt)=>{ let da=0; const last=Math.min(1,40/Math.max(1,FARF.n));
    for(const w of R){ if(e.alter>w.aus) continue; da++;
      const f=Math.max(0,1-3.0*dt); w.v[0]*=f; w.v[1]=w.v[1]*f-2.6*dt; w.v[2]*=f;
      w.p[0]+=w.v[0]*dt; w.p[1]+=w.v[1]*dt; w.p[2]+=w.v[2]*dt; w.ph+=w.om*dt;
      const c=Math.cos(w.ph), sn=Math.sin(w.ph), sg=w.om>0?1:-1, rest=w.aus-e.alter, ab=rest<0.35?rest/0.35:1;
      const rx=w.p[0]+(w.u[0]*c+w.w[0]*sn)*w.rad, ry=w.p[1]+(w.u[1]*c+w.w[1]*sn)*w.rad, rz=w.p[2]+(w.u[2]*c+w.w[2]*sn)*w.rad;
      const tx=(-w.u[0]*sn+w.w[0]*c)*sg, ty=(-w.u[1]*sn+w.w[1]*c)*sg, tz=(-w.u[2]*sn+w.w[2]*c)*sg;
      w.acc+=dt*95*q*last*ab;
      grSpur(0.09,()=>{ for(;w.acc>=1;w.acc--){ const sp=rand(4.5,6.5), j=rand(-.4,.4);
        psMid.emit(rx,ry,rz,tx*sp+w.v[0]*0.4+j,ty*sp+w.v[1]*0.4+j,tz*sp+w.v[2]*0.4+j,silber[0],silber[1],silber[2],rand(0.22,0.34),1.5,0); } });
      /* Nabe: kleiner Farbkern, dazu der helle Radkopf */
      grSpur(0,()=>{ psBig.emit(w.p[0],w.p[1],w.p[2],0,0,0,B[0]*1.3*ab,B[1]*1.3*ab,B[2]*1.3*ab,0.05,0,0);
        psMid.emit(rx,ry,rz,0,0,0,1.4*ab,1.4*ab,1.4*ab,0.04,0,0); }); }
    return da>0; });
  schall(p,v=>{ if(typeof tonGen==='function') tonGen({f:320,typ:'sawtooth',am:5,amTiefe:0.7,rausch:0.8,lp:3200,dur:2.4,vol:0.028*v,an:0.1}); });
};

/* Silberwelle (Silberbrandung): 70-90 Sterne ziehen 0,7 s silberne
   Glitzergischt, dann harter gleichzeitiger Schnitt - jeder Stern
   brennt als tuerkise Perle ohne Schweif weiter, sinkt und alle
   verloeschen zusammen. Am Schnitt ein weisser Schimmer. */
EFF.silberwelle=function(p,A,B,s,r){
  grOhneZutaten(r);
  const q=QUAL(), n=Math.round(rand(70,90)*s*q), T=0.7, g=2.4, st=[], perlen=[];
  const gl=[.9,.94,1], perle=grWeiss(A,0.1);
  grSpur(0.32,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(8.5,10.5)*s, v=[d[0]*w,d[1]*w,d[2]*w];
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],gl[0]*1.15,gl[1]*1.15,gl[2]*1.15,T,g,0); st.push(v);
    /* Gischt: Glitzer, der hinter dem Stern zurueckbleibt und verzoegert aufblitzt */
    for(let k=0;k<2;k++){ const tk=rand(0.06,0.62);
      imBild(tk,()=>{ const o=bahnOrt(p,v,g,tk); glint(psMid,o.x,o.y,o.z,rand(-.3,.3),rand(-.9,-.2),rand(-.3,.3),gl,1.6,{t0:0.18,t1:0.5,dim:0.45,blitz:2.2}); }); } } });
  const tag=FW_TAG;
  imBild(T,()=>{ const alt=FW_TAG; FW_TAG=tag;
    grSpur(0,()=>{ for(const v of st){ const o=bahnOrt(p,v,g,T), w=bahnTempo(v,g,T);
      perlen.push(grStern(psBig,o.x,o.y,o.z,w[0]*0.55,w[1]*0.55,w[2]*0.55,[perle[0]*1.35,perle[1]*1.35,perle[2]*1.35],rand(1.2,1.25),1.3,0,0));
      psMid.emit(o.x,o.y,o.z,0,0,0,1.8,1.8,1.8,0.07,0,0); } });
    grHalten('silberwelle',perlen,1.3); FW_TAG=alt; });
  schall(p,v=>later(0.2,()=>sfx.zischen(v*0.8,1.0)));
};

/* Blitzast (Blitzgewitter): 5-7 gezackte Blitzbahnen. Erst kriecht der
   Leitblitz (Kopf weiss-blau, 25-40 m/s, alle 0,06-0,12 s ein harter
   Knick), jede fuenfte Bahn verzweigt einmal - dann leuchtet der ganze
   Kanal auf einen Schlag gleissend auf (Hauptentladung) und bleibt
   0,25 s als violettes Nachbild stehen. Fotoblitz, Knacken, Donner. */
const BLITZ={n:0};
EFF.blitzast=function(p,A,B,s,r){
  grOhneZutaten(r,false); if(r) r.knall='still';
  const [u,v]=basisBlick(p,0.25), nn=grNormale(u,v), K=Math.round(rand(5,7)), D=rand(0.5,0.7), tag=FW_TAG;
  BLITZ.n++; later(D+0.4,()=>{ BLITZ.n=Math.max(0,BLITZ.n-1); });
  const last=Math.min(1,3/Math.max(1,BLITZ.n)), segs=[];
  /* um die Blickachse drehen */
  const drehe=(d,a)=>{ const c=Math.cos(a), sn=Math.sin(a), x=d[0]*u[0]+d[1]*u[1]+d[2]*u[2], y=d[0]*v[0]+d[1]*v[1]+d[2]*v[2], z=d[0]*nn[0]+d[1]*nn[1]+d[2]*nn[2];
    const x2=x*c-y*sn, y2=x*sn+y*c; return [u[0]*x2+v[0]*y2+nn[0]*z,u[1]*x2+v[1]*y2+nn[1]*z,u[2]*x2+v[2]*y2+nn[2]*z]; };
  const bahn=(a0,d0,t0,tEnd,ast)=>{ let a=a0, d=d0, t=t0, sg=Math.random()<0.5?1:-1; const sp=rand(25,40)*Math.min(1.3,s);
    while(t<tEnd){ const dt=rand(0.06,0.12), b=[a[0]+d[0]*sp*dt,a[1]+d[1]*sp*dt,a[2]+d[2]*sp*dt];
      segs.push({a,b,t0:t,t1:t+dt}); a=b; t+=dt;
      d=drehe(d,sg*rand(25,50)*Math.PI/180); sg=-sg;
      if(ast&&Math.random()<0.2){ ast=false; bahn(a,drehe(d,-sg*rand(30,55)*Math.PI/180),t,Math.min(tEnd,t+rand(0.15,0.3)),false); } } };
  for(let k=0;k<K;k++){ const a=(k/K)*Math.PI*2+rand(-.4,.4), d0=[u[0]*Math.cos(a)+v[0]*Math.sin(a)+nn[0]*rand(-.25,.25),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)+nn[2]*rand(-.25,.25)];
    const l=Math.hypot(d0[0],d0[1],d0[2]); bahn([p.x,p.y,p.z],[d0[0]/l,d0[1]/l,d0[2]/l],0,D*rand(0.8,1),true); }
  const kopf=[.8,.88,1], nach=grWeiss(B,0.45), lg=seg=>Math.hypot(seg.b[0]-seg.a[0],seg.b[1]-seg.a[1],seg.b[2]-seg.a[2]);
  const punkte=(seg,f0,f1,abst,fn)=>{ const L=lg(seg)*(f1-f0), m=Math.max(1,Math.round(L/abst));
    for(let i=0;i<m;i++){ const f=f0+(f1-f0)*(i+Math.random())/m; fn(seg.a[0]+(seg.b[0]-seg.a[0])*f,seg.a[1]+(seg.b[1]-seg.a[1])*f,seg.a[2]+(seg.b[2]-seg.a[2])*f); } };
  /* Leitblitz: kriecht Knick fuer Knick, schwach */
  grTakt('blitzast',D+0.05,e=>{ const t1=e.alter, t0=e.t0||0; e.t0=t1;
    grSpur(0,()=>{ for(const sg of segs){ if(sg.t1<=t0||sg.t0>t1) continue;
      const f0=clamp((t0-sg.t0)/(sg.t1-sg.t0),0,1), f1=clamp((t1-sg.t0)/(sg.t1-sg.t0),0,1);
      punkte(sg,f0,f1,0.45/last,(x,y,z)=>psMid.emit(x,y,z,0,0,0,kopf[0]*0.7,kopf[1]*0.7,kopf[2]*0.75,rand(0.12,0.2),0,0)); } });
    return t1<D; });
  /* Hauptentladung: der ganze Kanal auf einmal, dann violettes Nachbild.
     27.09.: wie ein echter Blitz flackert der Kanal zweimal nach
     (Folgeentladungen nach 0,13 und 0,28 s) - vorher war er nach 0,1 s
     weg und vom Zuendpult kaum zu sehen; Nachbild 0,6 s statt 0,35 s */
  [[0,1],[0.13,0.75],[0.28,0.55]].forEach(([dt0,h],j)=>later(D+dt0,()=>{ const alt=FW_TAG; FW_TAG=tag;
    grSpur(0,()=>{ for(const sg of segs){ punkte(sg,0,1,0.24/last,(x,y,z)=>psMid.emit(x,y,z,0,0,0,1.9*h,1.95*h,2.1*h,rand(0.08,0.12),0,0));
      if(j===0) punkte(sg,0,1,0.28/last,(x,y,z)=>psMid.emit(x,y,z,0,0,0,nach[0]*1.5,nach[1]*1.5,nach[2]*1.6,0.6,0,2,nach[0]*0.3,nach[1]*0.2,nach[2]*0.5));
      punkte(sg,0,1,1.1/last,(x,y,z)=>psBig.emit(x,y,z,0,0,0,kopf[0]*0.6*h,kopf[1]*0.65*h,kopf[2]*0.8*h,0.14,0,0)); } });
    flash(p,[.7,.78,1],(4+5*s)*h,0.2); if(typeof bildBlitz==='function') bildBlitz(0.18*h*distVol(p),0.16);
    if(j===0) schall(p,v2=>sfx.donner(v2*0.9)); FW_TAG=alt; }));
};

/* Kreuzkomet (Kreuzfeuer): kein Bombettenbruch - ein Komet aus dem Rohr
   (Kopf A, Silberschweif ab der Muendung). Im Scheitel Knall und
   Weissblitz, er teilt sich in genau vier Stuecke im 90-Grad-Kreuz,
   jedes mit Schweif B. split:2 - jedes Stueck teilt sich nach 0,5 s
   noch einmal in zwei. */
SCHUSS_EFF.kreuzkomet=function(r){
  const A=r.A, B=r.B, s=r.size||1, q=QUAL(), T=Math.min(r.fuse,1.4), P0={x:r.p.x,y:r.p.y,z:r.p.z}, V0=[r.v.x,r.v.y,r.v.z];
  const st={p:[P0.x,P0.y,P0.z],v:V0.slice()}, split=(r.par&&r.par.split)||1, kopf=grWeiss(A,0.35);
  grTakt('kreuzkomet',T+0.1,(e,dt)=>{
    if(e.alter>=T){ kreuzSplit({x:st.p[0],y:st.p[1],z:st.p[2]},st.v,A,B,s,split); return false; }
    st.v[1]-=6*dt; for(let k=0;k<3;k++) st.p[k]+=st.v[k]*dt;
    const [x,y,z]=st.p, v=st.v;
    grSpur(0,()=>{ psHuge.emit(x,y,z,0,0,0,kopf[0]*1.4,kopf[1]*1.4,kopf[2]*1.4,0.05,0,0); });
    e.acc=(e.acc||0)+dt*230*q;
    grSpur(0.12,()=>{ for(;e.acc>=1;e.acc--){ const f=Math.random();
      psMid.emit(x-v[0]*dt*f+rand(-.08,.08),y-v[1]*dt*f,z-v[2]*dt*f+rand(-.08,.08),-v[0]*0.08+rand(-.6,.6),-v[1]*0.08+rand(-.8,.2),-v[2]*0.08+rand(-.6,.6),.92,.95,1.05,rand(0.3,0.6),2.5,0); } });
    return true; });
  schall(P0,v=>sfx.zischen(v*0.7,T));
};
function kreuzSplit(p,vk,A,B,s,split){
  const q=QUAL(), [u,v]=basisBlick(p,0.35), roll=rand(0,Math.PI*2), stB=grWeiss(B,0.15);
  grSpur(0,()=>{ for(let k=0;k<2;k++) psHuge.emit(p.x,p.y,p.z,0,0,0,1.6,1.6,1.6,0.07,0,0);
    for(let i=0;i<Math.round(14*q);i++){ const d=randDir(); psSmall.emit(p.x,p.y,p.z,d[0]*6,d[1]*6,d[2]*6,1,1,1,0.12,1,0); } });
  flash(p,[1,1,1],2.5+1.5*s,0.18);
  schall(p,v2=>{ sfx.crack(v2*1.3); later(0.03,()=>sfx.crack(v2*0.8)); });
  for(let k=0;k<4;k++){ const a=roll+k*Math.PI/2, d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
    const w=rand(10,14)*Math.sqrt(s), vel=[d[0]*w+vk[0]*0.25,d[1]*w+vk[1]*0.25,d[2]*w+vk[2]*0.25];
    grSpur(0.3,()=>{ psHuge.emit(p.x,p.y,p.z,vel[0],vel[1],vel[2],stB[0]*1.3,stB[1]*1.3,stB[2]*1.3,split>1?0.52:0.9,3,0);
      for(let i=0;i<3;i++){ const e=streu(d,0.03), ww=w*rand(0.93,1); psBig.emit(p.x,p.y,p.z,e[0]*ww+vk[0]*0.25,e[1]*ww+vk[1]*0.25,e[2]*ww+vk[2]*0.25,stB[0],stB[1],stB[2],split>1?0.52:rand(0.8,0.9),3,0); } });
    funkenSchweif(p,vel,3,split>1?0.5:0.85,2,B);
    if(split>1) later(0.5,()=>{ const o=bahnOrt(p,vel,3,0.5), w2=bahnTempo(vel,3,0.5), l=Math.hypot(w2[0],w2[1],w2[2])||1, dn=[w2[0]/l,w2[1]/l,w2[2]/l];
      const [a1]=quer(dn); schall(o,v2=>sfx.crack(v2*0.6));
      grSpur(0.22,()=>{ for(const sg of [-1,1]){ const vv=[w2[0]*0.5+a1[0]*6*sg,w2[1]*0.5+a1[1]*6*sg,w2[2]*0.5+a1[2]*6*sg];
        psHuge.emit(o.x,o.y,o.z,vv[0],vv[1],vv[2],A[0]*1.2,A[1]*1.2,A[2]*1.2,0.6,3,0);
        for(let i=0;i<2;i++) psBig.emit(o.x,o.y,o.z,vv[0]*rand(.9,1),vv[1]*rand(.9,1),vv[2]*rand(.9,1),A[0],A[1],A[2],0.55,3,0); } }); });
  }
}

/* Knallring (Donnerschlag): Weissblitz, dann 8-12 Knallkoerper auf
   einem geneigten Ring (6-10 m). Sie detonieren nacheinander rundherum,
   alle 0,07 s einer - Blitz, Silberfunken, scharfer Knall -, nach dem
   Umlauf eine Pause und der grosse Mittelschlag: ta-ta-ta-ta-BUMM. */
EFF.knallring=function(p,A,B,s,r){
  grOhneZutaten(r); if(r) r.knall='still';
  const q=QUAL(), [u,v]=basisBlick(p,1.0), n=Math.round(rand(8,12)), R=rand(6,10)*Math.min(1.25,s/1.1), a0=rand(0,Math.PI*2), dr=Math.random()<0.5?1:-1, T0=0.28, tag=FW_TAG;
  /* die Knallkoerper fliegen als gluehende Punkte auf ihren Platz */
  const vz=R*ZIEH/(1-Math.exp(-ZIEH*T0)), orte=[];
  grSpur(0.16,()=>{ for(let k=0;k<n;k++){ const a=a0+dr*k/n*Math.PI*2, d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
    orte.push({x:p.x+d[0]*R,y:p.y+d[1]*R,z:p.z+d[2]*R});
    psBig.emit(p.x,p.y,p.z,d[0]*vz,d[1]*vz,d[2]*vz,1,.55,.2,T0+k*0.07,0,0); } });
  orte.forEach((o,k)=>later(T0+k*0.07,()=>{ const alt=FW_TAG; FW_TAG=tag;
    grSpur(0.07,()=>{ psHuge.emit(o.x,o.y,o.z,0,0,0,1.8,1.8,1.8,0.05,0,0);
      for(let i=0;i<Math.round(15*q);i++){ const d=randDir(), w=rand(6,9), c=i%3?[.92,.95,1]:A; psMid.emit(o.x,o.y,o.z,d[0]*w,d[1]*w,d[2]*w,c[0]*1.2,c[1]*1.2,c[2]*1.2,rand(0.2,0.4),2,0); }
      /* 27.09.: an jeder Stelle bleibt ein Silberwoelkchen 0,8 s stehen - der Ring
         fuellt sich sichtbar Schlag fuer Schlag und steht, wenn die Mitte knallt */
      for(let i=0;i<Math.round(6*q);i++){ const d=randDir(), w=rand(0.6,1.6); psBig.emit(o.x,o.y,o.z,d[0]*w,d[1]*w,d[2]*w,.95,.97,1.05,rand(0.7,1.0),0.6,0); } });
    if(k%2===0) flash(o,[1,1,1],2.4,0.07);
    schall(o,v2=>{ sfx.crack(v2*1.25); tone(rand(140,180),0.05,'sine',0.1*v2,60); });
    FW_TAG=alt; }));
  /* Mittelschlag */
  later(T0+n*0.07+0.2,()=>{ const alt=FW_TAG; FW_TAG=tag;
    grSpur(0.1,()=>{ for(let k=0;k<4;k++) psHuge.emit(p.x,p.y,p.z,rand(-.3,.3),rand(-.3,.3),rand(-.3,.3),1.9,1.9,1.9,0.12+k*0.03,0,0);
      for(let i=0;i<Math.round(150*q*s);i++){ const d=randDir(), w=rand(4,11)*s; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.97,.9,rand(0.4,0.9),1.5,4); } });
    flash(p,[1,1,1],(6+3*s),0.35); shake=Math.max(shake,0.35*distVol(p));
    schall(p,v2=>{ sfx.boom(v2*1.35); sfx.crack(v2*1.1); });
    FW_TAG=alt; });
};

/* Lauflicht (Lauflicht): 120-180 Blinksterne stehen 3 s als Wolke. Sie
   blinken nicht wild, sondern alle im Gleichtakt (6 Hz, Tastgrad 25 %),
   und ein helles Band laeuft durch die Wolke: quer hin und zurueck
   (12 m/s), als Ring von innen nach aussen (radial) oder die ganze
   Wolke pulst (puls). sync: das Band liegt in Weltkoordinaten - viele
   Brueche bilden EIN durchgehendes Band ueber den Himmel. */
const LAUF={x0:null,t:-9};
EFF.lauflicht=function(p,A,B,s,r){
  grOhneZutaten(r);
  const q=QUAL(), par=(r&&r.par)||{}, modus=par.modus||'quer', sync=!!par.sync, n=Math.round(rand(120,180)*Math.min(1.25,s)*q), L=3.2, st=[];
  const [u]=basisBlick(p,0), Rw=6.2*s;
  grSpur(0,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(5.8,7)*s;
    st.push(grStern(psBig,p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A,L+rand(0,0.15),0.6,0,0)); } });
  if(sync&&(LAUF.x0===null||FW_UHR-LAUF.t>6)) LAUF.x0=p.x; if(sync) LAUF.t=FW_UHR;
  const weiss=grWeiss(A,0.65), X0=sync?LAUF.x0:0;
  const tri=x=>{ const f=x-Math.floor(x); return f<0.5?f*2:2-f*2; };
  grTakt('lauflicht',L+0.2,e=>{ const t=e.alter, an=((FW_UHR*6)%1)<0.25;
    /* Bandlage: quer hin und zurueck, radial nach aussen */
    const span=sync?18:Rw, xb=sync?X0+span*(2*tri(FW_UHR*12/(4*span))-1):span*(2*tri(t*12/(4*span)+0.25)-1), rb=(t*7.5)%(Rw*1.2);
    let da=0;
    for(const x of st){ if(!grLebt(x)) continue; da++; const j=x.i*3, P=x.ps.pos, f=x.ps.life[x.i]/x.ps.maxl[x.i];
      const dx=P[j]-p.x, dy=P[j+1]-p.y, dz=P[j+2]-p.z;
      let band;
      if(modus==='radial'){ const rr=Math.hypot(dx,dy,dz); band=Math.exp(-Math.pow((rr-rb)/1.1,2)); }
      else if(modus==='puls') band=0.6;
      else { const xq=sync?P[j]:dx*u[0]+dz*u[2]; band=Math.exp(-Math.pow((xq-xb)/1.3,2)); }
      const h=an?(0.3+1.9*band):0.035, c=an&&band>0.4?weiss:A;
      grFarbe(x,c,h/Math.max(f,0.25)); }
    return da>0; });
  schall(p,v=>{ for(let i=0;i<6;i++) later(0.3+i*0.45,()=>tone(4200,0.03,'sine',0.012*v)); });
};

/* Polarlicht (Nordlicht): kein Radialbruch. Eine waagrechte, leicht
   gewellte Linie aus 50-70 Saeulen (20-30 m lang, quer zum Blick). Jede
   Saeule sinkt langsam und zieht weiche senkrechte Streifen - unten
   gruen (A), zur Spitze violett (B). Die ganze Linie weht: seitliche
   Welle, 1,5 m, 3 s, die Phase laeuft den Vorhang entlang. Einblenden
   1 s, Standzeit 6-8 s, Ausblenden 2 s. Kein Knall, leises Rauschen.
   Der Streifen ist die Leuchtspur des Sterns: er sinkt mit
   Endgeschwindigkeit (g = sink x Luftwiderstand), dann liegt seine
   zurueckgerechnete Bahn genau senkrecht ueber ihm. */
EFF.polarlicht=function(p,A,B,s,r){
  grOhneZutaten(r,0.2); if(r) r.knall='polarRauschen';
  const [u,v]=basisBlick(p,0), nn=grNormale(u,v), q=QUAL(), N=Math.round(rand(50,70)*q), Lm=rand(20,30)*Math.min(1.3,s/1.2);
  const stand=rand(6,8), T=1+stand+2, sink=rand(1.0,1.4), g=sink*ZIEH, ph1=rand(0,6), ph2=rand(0,6), st=[];
  const cA=grWeiss(A,0.05), cB=B;
  for(let k=0;k<N;k++){ const x=(k/(N-1)-0.5)*Lm, yo=0.9*Math.sin(x*0.28+ph1), zo=2.2*Math.sin(x*0.19+ph2), phase=x*0.35;
    const bx=p.x+u[0]*x+nn[0]*zo, by=p.y+yo, bz=p.z+u[2]*x+nn[2]*zo;
    for(let m=0;m<2;m++){ const jx=rand(-.18,.18), sp=rand(3.2,4.4);
      st.push(Object.assign(grStern(psMid,bx+u[0]*jx,by+rand(-.3,.3),bz+u[2]*jx,0,-sink,0,cA,T,g,0,sp),{ph:phase,k:0.55,dx:0})); }
    const hB=sink*rand(3.0,3.6);
    st.push(Object.assign(grStern(psMid,bx+u[0]*rand(-.15,.15),by+hB,bz+u[2]*rand(-.15,.15),0,-sink,0,cB,T,g,0,rand(3,4.5)),{ph:phase,k:0.42,dx:0}));
  }
  grTakt('polarlicht',T,e=>{ const t=e.alter, env=t<1?t:t>1+stand?Math.max(0,1-(t-1-stand)/2):1; let da=0;
    for(const x of st){ if(!grLebt(x)) continue; da++; const j=x.i*3, P=x.ps.pos, f=x.ps.life[x.i]/x.ps.maxl[x.i];
      const w=1.5*Math.sin(2*Math.PI*t/3-x.ph), d=w-x.dx; x.dx=w; P[j]+=u[0]*d; P[j+2]+=u[2]*d;
      grFarbe(x,x.c,x.k*env*(0.85+0.15*Math.sin(t*1.7+x.ph*3))/Math.max(f,0.05)); }
    return da>0; });
};

/* Meteor (Weltuntergang): dumpfer Schlag, 5-9 grosse Feuerkoepfe (Kern
   weiss, Rand A) stuerzen gemeinsam schraeg nach unten (30-50 Grad unter
   der Waagrechten), dicker Glutschweif, unterwegs zerfallen sie in
   Brocken. Sie verloeschen 3-8 m ueber dem Boden, manche schlagen ein
   (Emitter einschlag). Als Kugelbombe 12-16 Koepfe. */
const METEOR={koepfe:0,seite:1,einschlag:-9};
EFF.meteor=function(p,A,B,s,r){
  grOhneZutaten(r,0.6); if(r) r.knall='wumms';
  const q=QUAL(), bomb=!!(r&&r.kugel), n=Math.round(bomb?rand(12,16):rand(5,9)*Math.min(1.2,s));
  /* Seite aus der Flugrichtung des Schusses, sonst im Wechsel */
  const vx=r&&r.v?r.v.x:0, sd=Math.abs(vx)>1.2?Math.sign(vx):(METEOR.seite=-METEOR.seite);
  const hElev=rand(30,50)*Math.PI/180, kopfC=grWeiss(B,0.6), dunkel=[.32,.05,.02], K=[];
  const neuKopf=(o,d,w,gr)=>K.push({p:[o[0],o[1],o[2]],v:[d[0]*w,d[1]*w,d[2]*w],gr,zerf:rand(0.35,1.0),aus:rand(3,8),acc:0,tot:false});
  for(let k=0;k<n;k++){ const el=hElev+rand(-.26,.26), az=rand(-.3,.3);
    neuKopf([p.x+rand(-1,1),p.y+rand(-1,1),p.z+rand(-1,1)],[sd*Math.cos(el)*Math.cos(az),-Math.sin(el),Math.cos(el)*Math.sin(az)],rand(18,25)*(bomb?1.1:1),rand(0.8,1.2)*Math.min(1.4,s)); }
  METEOR.koepfe+=K.length;
  grSpur(0.1,()=>{ for(let i=0;i<Math.round(30*q);i++){ const d=randDir(), w=rand(2,5); psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.5,.15,rand(0.3,0.6),2,0); } });
  grTakt('meteor',6,(e,dt)=>{ let da=0; const last=Math.min(1,26/Math.max(1,METEOR.koepfe));
    for(let i=0;i<K.length;i++){ const h=K[i]; if(h.tot) continue;
      h.v[1]-=4*dt; const f=Math.max(0,1-0.12*dt); h.v[0]*=f; h.v[2]*=f;
      for(let k=0;k<3;k++) h.p[k]+=h.v[k]*dt;
      const [x,y,z]=h.p;
      if(y<h.aus){ h.tot=true; METEOR.koepfe=Math.max(0,METEOR.koepfe-1);
        grSpur(0.1,()=>{ for(let j=0;j<Math.round(10*q);j++){ const d=randDir(); psBig.emit(x,y,z,d[0]*3+h.v[0]*0.2,d[1]*3,d[2]*3+h.v[2]*0.2,A[0],A[1],A[2],rand(0.3,0.6),5,2,dunkel[0],dunkel[1],dunkel[2]); } });
        /* Einschlag: nicht jeder, und nicht alle auf einmal */
        if(Math.random()<0.35&&FW_UHR-METEOR.einschlag>0.35&&typeof einschlagAn==='function'){ METEOR.einschlag=FW_UHR;
          const tt=y/Math.max(3,-h.v[1]), e2=einschlagAn({x:x+h.v[0]*tt,y:0,z:z+h.v[2]*tt},A,rand(1,2),h.gr); if(e2) e2.tag=FW_TAG; }
        continue; }
      da++;
      /* Zerfall in 2-3 Brocken */
      if(h.gr>0.6&&e.alter>h.zerf){ h.zerf=99; const m=Math.random()<0.5?2:3, sp=Math.hypot(h.v[0],h.v[1],h.v[2])||1; h.gr*=0.6;
        for(let j=1;j<m;j++){ neuKopf(h.p,streu([h.v[0]/sp,h.v[1]/sp,h.v[2]/sp],0.18),sp*rand(0.9,1.05),h.gr*rand(0.8,1)); METEOR.koepfe++; }
        grSpur(0.08,()=>{ for(let j=0;j<Math.round(12*q);j++){ const d=randDir(); psMid.emit(x,y,z,d[0]*4,d[1]*4,d[2]*4,1,.7,.3,0.35,3,0); } }); }
      /* Kopf: weisser Kern, oranger Rand */
      grSpur(0,()=>{ psHuge.emit(x,y,z,0,0,0,kopfC[0]*1.5*h.gr,kopfC[1]*1.4*h.gr,kopfC[2]*1.2*h.gr,0.05,0,0);
        psHuge.emit(x+rand(-.15,.15),y+rand(-.15,.15),z+rand(-.15,.15),0,0,0,A[0]*1.2,A[1],A[2]*0.8,0.05,0,0); });
      /* Glutschweif: orange, wird dunkelrot, steht 1-1,6 s */
      h.acc+=dt*120*q*last*Math.max(0.5,h.gr);
      grSpur(0.08,()=>{ for(;h.acc>=1;h.acc--){ const fr=Math.random();
        psBig.emit(x-h.v[0]*dt*fr+rand(-.2,.2),y-h.v[1]*dt*fr+rand(-.2,.2),z-h.v[2]*dt*fr+rand(-.2,.2),h.v[0]*0.06+rand(-.5,.5),h.v[1]*0.06+rand(-.3,.6),h.v[2]*0.06+rand(-.5,.5),
          A[0]*1.2,A[1]*1.1,A[2],rand(1.0,1.6),0.5,2,dunkel[0],dunkel[1],dunkel[2]); } }); }
    return da>0; });
  schall(p,v=>rauschF({dur:1.6,vol:0.22*v,typ:'bandpass',f:900,f2:220,q:0.8,an:0.15}));
};

/* Gamboge (Weltuntergang, Akt 1): gedaempfter Bruch, 0,6-0,9 s nur
   dunkelrote Glimmspuren - dann steht die ganze Bluete schlagartig da,
   0,8 s, und alles verlischt zugleich. Kein Knall beim Erscheinen. */
EFF.gamboge=function(p,A,B,s,r){
  grOhneZutaten(r,0.12); if(r) r.knall='dumpf';
  const q=QUAL(), n=Math.round(rand(60,80)*s*q), Tz=rand(0.6,0.9), g=2.2, st=[], hell=[], tag=FW_TAG;
  grSpur(0.35,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(9.5,11.5)*s, v=[d[0]*w,d[1]*w,d[2]*w]; st.push(v);
    psMid.emit(p.x,p.y,p.z,v[0],v[1],v[2],.16,.025,.01,Tz,g,0); } });
  imBild(Tz,()=>{ const alt=FW_TAG; FW_TAG=tag;
    grSpur(0.14,()=>{ st.forEach((v,i)=>{ const o=bahnOrt(p,v,g,Tz), w=bahnTempo(v,g,Tz), c=i%6?A:grWeiss(A,0.5);
      hell.push(grStern(i%4?psBig:psHuge,o.x,o.y,o.z,w[0],w[1],w[2],[c[0]*1.4,c[1]*1.4,c[2]*1.4],0.85,g,0)); }); });
    grHalten('gamboge',hell,0.9); flash(p,A,3+3*s,0.5); FW_TAG=alt; });
};

/* Weltenblitz (Weltuntergang): kein Sternbild. Gewaltiger Fotoblitz -
   das Bild wird 0,4 s weiss, klingt roetlich ab; im selben Moment gehen
   alle Sterne, Raketen und Boden-Emitter dieser Show aus (Stromausfall,
   auch der rote Horizont). Tiefer Schlag, Grollen mit Echo, Wackeln.
   Ohne Schockwellen-Schale (die gehoert der Supernova). */
let _weltEl=null;
function weltUeberblende(){
  if(typeof document==='undefined'||!document.body) return;
  if(!_weltEl){ _weltEl=document.createElement('div'); _weltEl.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;background:#fffaf0'; document.body.appendChild(_weltEl); }
  const el=_weltEl; el.style.transition='none'; el.style.background='#fffaf0'; el.style.opacity='0.97';
  later(0.4,()=>{ el.style.transition='background 0.5s ease-out, opacity 1.6s ease-in'; el.style.background='#ff5a2a'; el.style.opacity='0'; });
}
EFF.weltenblitz=function(p,A,B,s,r){
  grOhneZutaten(r,false); if(r) r.knall='weltdonner';
  const tag=r&&r.tag, alt=FW_TAG; FW_TAG=0;
  /* Stromausfall im naechsten Bild - die Raketenschleife laeuft gerade */
  later(0.001,()=>{ if(tag) showLoeschen(tag); });
  grSpur(0,()=>{ for(let k=0;k<6;k++) psHuge.emit(p.x+rand(-.5,.5),p.y+rand(-.5,.5),p.z+rand(-.5,.5),0,0,0,2,2,2,0.25+k*0.05,0,0);
    for(let k=0;k<4;k++) psHuge.emit(p.x,p.y,p.z,rand(-1,1),rand(-1,1),rand(-1,1),1.2,.45,.2,1.2+k*0.2,0,0); });
  flash(p,[1,1,1],40,0.5); later(0.4,()=>flash(p,[1,.4,.18],18,1.5));
  weltUeberblende();
  shake=Math.max(shake,1.1*Math.max(0.6,distVol(p)));
  FW_TAG=alt;
};

/* Glutasche (Weltuntergang, Nachspiel): kein Blitz. 40-60 kleine
   Glutflocken taumeln langsam herab, flackern wie Glut im Wind und
   verloeschen einzeln ueber 5-7 s. Nur leises Knistern. */
EFF.glutasche=function(p,A,B,s,r){
  grOhneZutaten(r,false); if(r) r.knall='prasseln';
  const q=QUAL(), n=Math.round(rand(40,60)*q);
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(1.5,3.5), c=mischF([1,.42,.1],[.45,.4,.38],Math.random()*0.6), life=rand(4.5,7), sink=rand(1,2), om=rand(1.2,2.6), amp=rand(0.25,0.5), ph=rand(0,6);
    fuehre(psBig,p.x+rand(-.5,.5),p.y+rand(-.5,.5),p.z+rand(-.5,.5),d[0]*w,d[1]*w,d[2]*w,c,life,(st,dt)=>{
      const v=st.v, D=st.d, f=Math.max(0,1-2.5*dt); v[0]*=f; v[2]*=f; v[1]+=(-sink-v[1])*Math.min(1,dt*2.5);
      const tw=Math.cos(st.alter*om+ph)*amp*om;
      st.p[0]+=(v[0]+tw)*dt; st.p[1]+=v[1]*dt; st.p[2]+=v[2]*dt;
      /* Glut im Wind: Helligkeit wandert, manchmal glueht sie auf */
      D.h=clamp((D.h===undefined?0.3:D.h)+(Math.random()-0.5)*dt*3,0.12,0.45);
      if(Math.random()<dt*0.5) D.auf=0.25;
      D.auf=Math.max(0,(D.auf||0)-dt);
      const rest=st.life-st.alter;
      st.hell=(D.h+(D.auf>0?0.9:0))*Math.min(1,rest/1.2)*Math.min(1,st.alter/0.3)/Math.max(0.05,rest/st.life);
    }); }
};

/* Kaleidoskop (Kaleidoskop): Buntglas - zwoelf klar getrennte,
   einfarbige Farbinseln auf den Ecken eines Ikosaeders, jede ein
   kompaktes Buendel aus 12-16 Sternen, dazwischen dunkle "Bleistege".
   Die Farben liegen spiegelgleich (links = rechts). Kein Kern, kein
   Schweif, 1,8 s, ab 1,2 s leichtes Flimmern, alle verloeschen
   zugleich. Als Kugelbombe 20 Inseln (Dodekaeder). */
const IKOSA=(()=>{ const f=(1+Math.sqrt(5))/2, o=[]; for(const a of [-1,1]) for(const b of [-1,1]) o.push([0,a,b*f],[a,b*f,0],[a*f,0,b]); return o; })();
const DODEKA=(()=>{ const f=(1+Math.sqrt(5))/2, g=1/f, o=[]; for(const a of [-1,1]) for(const b of [-1,1]){ for(const c of [-1,1]) o.push([a,b,c]); o.push([0,a*g,b*f],[a*g,b*f,0],[a*f,0,b*g]); } return o; })();
EFF.kaleidoskop=function(p,A,B,s,r){
  grOhneZutaten(r);
  const q=QUAL(), bomb=!!(r&&r.kugel), E=bomb?DODEKA:IKOSA, [u,v]=basisBlick(p,0), nn=grNormale(u,v), st=[];
  /* vier Glasfarben: A, B und die naechsten aus dem Buntglas-Thema */
  const gleich=(x,y)=>Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1])+Math.abs(x[2]-y[2])<0.05;
  const alle=[A,B]; for(const pr of THEMEN.buntglas) for(const nm of pr){ const c=K(nm); if(alle.length<4&&!alle.some(x=>gleich(x,c))) alle.push(c); }
  const klasse={}, farbeVon=key=>{ if(klasse[key]===undefined) klasse[key]=Object.keys(klasse).length%alle.length; return alle[klasse[key]]; };
  const w0=rand(7,9)*s*(bomb?0.75:1), m0=bomb?10:14;
  grSpur(0.06,()=>{ for(const e of E){ const l=Math.hypot(e[0],e[1],e[2]), a=e[0]/l, b=e[1]/l, c=e[2]/l;
    /* Farbe nur aus |a| (quer), b, c - so ist links gleich rechts */
    const key=Math.abs(a).toFixed(2)+'|'+b.toFixed(2)+'|'+c.toFixed(2), col=farbeVon(key), cc=[col[0]*1.35,col[1]*1.35,col[2]*1.35];
    const d=[u[0]*a+v[0]*b+nn[0]*c,u[1]*a+v[1]*b+nn[1]*c,u[2]*a+v[2]*b+nn[2]*c], m=Math.round(rand(m0-2,m0+2)*q);
    for(let i=0;i<m;i++){ const dd=streu(d,0.16), w=w0*rand(0.95,1.05);
      st.push(grStern(i%5?psBig:psHuge,p.x,p.y,p.z,dd[0]*w,dd[1]*w,dd[2]*w,i%5?cc:[cc[0]*0.8,cc[1]*0.8,cc[2]*0.8],1.8+rand(0,0.04),2.4,0)); } } });
  grHalten('kaleidoskop',st,2,1.2);
};

/* Glockenschlag (Silvesternacht): Titansalut - Weissblitz, eine kurze
   dichte Silberwolke und ein weicher silberner Ring in Blickebene, der
   sich wie ein Schallring von 20 auf 35 m weitet und verblasst. Dazu
   der tiefe Glockenschlag statt des Knalls. */
EFF.glockenschlag=function(p,A,B,s,r){
  if(r){ r.bruchOpt=Object.assign({},r.bruchOpt||{},{nachglitzer:false}); r.knall='dong'; }
  const q=QUAL(), [u,v]=basisBlick(p,0), N=Math.round(150*q), vR=38*Math.min(1.1,s/1.25);
  grSpur(0.05,()=>{ for(let k=0;k<3;k++) psHuge.emit(p.x,p.y,p.z,0,0,0,1.9,1.9,1.9,0.1+k*0.04,0,0);
    for(let i=0;i<Math.round(40*q);i++){ const d=randDir(), w=rand(2.5,6.5); psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,.95,.97,1.05,rand(0.4,0.8),1.2,4); } });
  grSpur(0.3,()=>{ for(let i=0;i<N;i++){ const a=i/N*Math.PI*2+rand(-.01,.01), w=vR*rand(0.985,1.015), d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,.36,.38,.44,2.5,0,0); } });
  flash(p,[.9,.93,1],5+3*s,0.4);
};

/* Hagel (Hagelsturm, Mini-Kaliber): 6-10 weisse und eisblaue Koerner
   fliegen kurz heraus, jedes endet nach 0,25-0,4 s mit einem Tick -
   ein Bild Mini-Blitz und drei Funken. Kein Kern, kein Leuchthof, kein
   Knall. Billig genug fuer 10 Schuss je Sekunde. */
EFF.hagel=function(p,A,B,s,r){
  grOhneZutaten(r,false); if(r) r.knall='still';
  /* 27.09.: Koerner groesser und schneller, Tick mit 5 Funken statt 3 -
     vom Zuendpult aus war ein Schuss vorher nur ein Pixel */
  const n=Math.round(rand(8,12)*Math.max(0.6,QUAL())), g=3;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(5.5,8), v=[d[0]*w,d[1]*w,d[2]*w], t=rand(0.25,0.4), c=i%2?[1,1,1]:[.72,.88,1];
    grSpur(0.14,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*1.2,c[1]*1.2,c[2]*1.25,t,g,0));
    imBild(t,()=>{ const o=bahnOrt(p,v,g,t); grSpur(0,()=>{ psHuge.emit(o.x,o.y,o.z,0,0,0,1.5,1.6,1.7,0.04,0,0);
      for(let k=0;k<5;k++){ const e=randDir(); psMid.emit(o.x,o.y,o.z,e[0]*3,e[1]*3,e[2]*3,1,1,1,rand(0.07,0.12),1,0); } });
      if(i%2===0) schall(o,v2=>sfx.tick(v2*1.2)); }); }
};

/* Rohrkomet (Sonnenaufgang, Lichtgitter): ein grosser gepresster Stern,
   sichtbar ab der Muendung, fliegt fast gerade und brennt im Scheitel
   aus - kein Bruch.
     gold    dicker Kohle-Goldschweif, der lange nachglueht
     glitter der Schweif blitzt verzoegert auf
     silber  harte Titanfunken
     farbe   Farbkopf A mit Goldschweif
     laser   60-80 m/s, duenne gleissende Linie in A, kaum Funken,
             verlischt in voller Fahrt nach 0,6-0,8 s, die Linie
             bleibt 0,3 s als Nachbild stehen */
const LASER={n:0};
SCHUSS_EFF.rohrkomet=function(r){
  const art=(r.par&&r.par.art)||'gold', q=QUAL(), A=r.A, P0={x:r.p.x,y:r.p.y,z:r.p.z};
  if(art==='laser') return laserStrahl(r);
  const T=r.fuse, st={p:[P0.x,P0.y,P0.z],v:[r.v.x,r.v.y,r.v.z]}, s=r.size||1;
  const kopf=art==='farbe'?grWeiss(A,0.2):art==='silber'?[1,1,1]:[1,.86,.55], gold=[1,.66,.24];
  grTakt('rohrkomet',T+0.05,(e,dt)=>{
    if(e.alter>=T){ const [x,y,z]=st.p; grSpur(0.05,()=>{ for(let i=0;i<Math.round(12*q);i++){ const d=randDir(); psMid.emit(x,y,z,d[0]*2+st.v[0]*0.2,d[1]*2+st.v[1]*0.2,d[2]*2+st.v[2]*0.2,kopf[0],kopf[1],kopf[2],rand(0.2,0.4),2,0); } }); return false; }
    st.v[1]-=6*dt; for(let k=0;k<3;k++) st.p[k]+=st.v[k]*dt;
    const [x,y,z]=st.p, v=st.v, lf=e.alter/T, hk=1.5*(1-0.45*lf)*Math.min(1.3,Math.sqrt(s));
    grSpur(0,()=>{ psHuge.emit(x,y,z,0,0,0,kopf[0]*hk,kopf[1]*hk,kopf[2]*hk,0.05,0,0); });
    const ort=()=>{ const f=Math.random(); return [x-v[0]*dt*f,y-v[1]*dt*f,z-v[2]*dt*f]; };
    if(art==='gold'||art==='farbe'){
      e.acc=(e.acc||0)+dt*(art==='gold'?260:170)*q;
      grSpur(0.1,()=>{ for(;e.acc>=1;e.acc--){ const o=ort(); psBig.emit(o[0]+rand(-.1,.1),o[1]+rand(-.1,.1),o[2]+rand(-.1,.1),v[0]*0.04+rand(-.35,.35),v[1]*0.04+rand(-.5,.15),v[2]*0.04+rand(-.35,.35),gold[0],gold[1],gold[2],rand(0.9,1.7),0.9,4); } });
      e.acc2=(e.acc2||0)+dt*60*q;
      grSpur(0.15,()=>{ for(;e.acc2>=1;e.acc2--){ const o=ort(); psMid.emit(o[0],o[1],o[2],rand(-1,1),rand(-2,0),rand(-1,1),1,.72,.3,rand(0.5,1.0),4,0); } }); }
    else if(art==='glitter'){
      e.acc=(e.acc||0)+dt*140*q;
      for(;e.acc>=1;e.acc--){ const o=ort(); glint(psMid,o[0],o[1],o[2],rand(-.4,.4),rand(-1.2,-.2),rand(-.4,.4),[1,.8,.4],1.4,{t0:0.25,t1:0.9,glimm:0.18,rest:0.5,spur:0.05}); }
      e.acc2=(e.acc2||0)+dt*90*q;
      grSpur(0.1,()=>{ for(;e.acc2>=1;e.acc2--){ const o=ort(); psBig.emit(o[0],o[1],o[2],rand(-.2,.2),rand(-.4,0),rand(-.2,.2),.9,.6,.22,rand(0.5,0.9),1,0); } }); }
    else { e.acc=(e.acc||0)+dt*300*q; const l=Math.hypot(v[0],v[1],v[2])||1, dn=[-v[0]/l,-v[1]/l,-v[2]/l];
      grSpur(0.06,()=>{ for(;e.acc>=1;e.acc--){ const o=ort(), d=streu(dn,0.45), w=rand(5,9); psMid.emit(o[0],o[1],o[2],d[0]*w,d[1]*w,d[2]*w,1.2,1.25,1.35,rand(0.3,0.6),4,0); } }); }
    return true; });
  schall(P0,v=>sfx.zischen(v*0.8,T));
};
function laserStrahl(r){
  const A=r.A, q=QUAL(), l=Math.hypot(r.v.x,r.v.y,r.v.z)||1, d=[r.v.x/l,r.v.y/l,r.v.z/l], sp=rand(60,80), D=rand(0.6,0.8);
  LASER.n++; later(D+0.35,()=>{ LASER.n=Math.max(0,LASER.n-1); });
  const last=Math.min(1,6/Math.max(1,LASER.n)), abst=0.32/last, kern=grWeiss(A,0.45), st={p:[r.p.x,r.p.y,r.p.z],w:0};
  grTakt('laser',D+0.05,(e,dt)=>{ const t=e.alter;
    if(t>=D){ const [x,y,z]=st.p; grSpur(0,()=>{ for(let k=0;k<2;k++) psHuge.emit(x,y,z,0,0,0,kern[0]*1.3,kern[1]*1.3,kern[2]*1.3,0.08,0,0); }); return false; }
    const neu=[st.p[0]+d[0]*sp*dt,st.p[1]+d[1]*sp*dt,st.p[2]+d[2]*sp*dt];
    st.w+=sp*dt;
    grSpur(0,()=>{ for(;st.w>=abst;st.w-=abst){ const f=1-st.w/(sp*dt), x=st.p[0]+(neu[0]-st.p[0])*f, y=st.p[1]+(neu[1]-st.p[1])*f, z=st.p[2]+(neu[2]-st.p[2])*f, rest=D-t+0.3;
        psMid.emit(x,y,z,0,0,0,kern[0]*1.7,kern[1]*1.7,kern[2]*1.7,rest,0,0);
        if(Math.random()<0.3) psBig.emit(x,y,z,0,0,0,A[0]*0.45,A[1]*0.45,A[2]*0.45,rest*0.8,0,0);
        if(Math.random()<0.04*q) psSmall.emit(x,y,z,rand(-1,1),rand(-1,0),rand(-1,1),kern[0],kern[1],kern[2],0.3,2,0); }
      psHuge.emit(neu[0],neu[1],neu[2],0,0,0,kern[0]*1.5,kern[1]*1.5,kern[2]*1.5,0.04,0,0); });
    st.p=neu; return true; });
  schall(r.p,v=>rauschF({dur:0.14,vol:0.3*v,typ:'bandpass',f:3200,f2:1100,q:1.2}));
}

/* Rossschweif (Schimmelreiter), Anpassung laut Katalog: Farbe aus A/B
   statt fest Gold, 60-80 dicke Sterne, sie steigen nach dem Ausstoss
   noch ein Stueck weiter (der Bruch kommt kurz vor dem Gipfel) und
   fallen als schmaler, schimmernder Pferdeschweif ~3 s zurueck. */
EFF.rossschweif=function(p,A,B,s,r){
  const q=QUAL(), n=Math.round(rand(60,80)*s*q), vk=r&&r.v?[r.v.x*0.6,Math.max(2,r.v.y*0.8),r.v.z*0.6]:[0,3,0];
  grSpur(0.9,()=>{ for(let i=0;i<n;i++){ let d=randDir(); d=[d[0]*0.35,0.55+Math.abs(d[1])*0.45,d[2]*0.35];
    const w=rand(3,6.5)*s, c=i%4?A:B;
    psBig.emit(p.x,p.y,p.z,d[0]*w+vk[0],d[1]*w+vk[1],d[2]*w+vk[2],c[0]*1.15,c[1]*1.15,c[2]*1.15,rand(3.0,3.4),4.2,4);
    if(i%3===0) psMid.emit(p.x,p.y,p.z,d[0]*w*0.9+vk[0],d[1]*w*0.9+vk[1],d[2]*w*0.9+vk[2],1,1,1,rand(2.4,3.0),4.2,4); } });
};

/* ---------------------------------------------------------
   Drehbuecher (katalog-shows-gross.md), 26.09., Tom: Anomalie.
   Schreibweise show(kopf,[phasen]) - ein Array mit basis/rampe, wie es
   der Test anomalie.js erwartet.
   Abweichung vom Katalog: kranz der Kugelbomben-Nachbrueche ist in der
   Engine relativ (r x 5,2 x Bruchgroesse); der Katalog meinte Meter
   (8 m bzw. 6 m) - umgerechnet auf 0,47 bzw. 0,29.
   --------------------------------------------------------- */
/* Level 16: Sonnenaufgang */
SHOWS.faecher=()=>show({basis:{pw:0.00,sz:1.000,th:'sonne'},rampe:{sz:[0.85,1.30],pw:[-3,2],hell:[0.70,1.35],kurve:'spaet'}},[
  /* Morgenroete - tief, langsam, dunkelrot, der Horizont glueht */
  {n:4,gap:1.8,muster:'gerade',eff:'dahlie',kal:'klein',pw:-5,farbe:2,steig:'glut',boden:{k:'bengal',gt:14,gh:0.4,A:'scharlach'},pause:1.0},
  /* erste Strahlen, von der Mitte nach aussen */
  {n:9,gap:0.4,muster:'halbkreis',von:'mitte',ang:1.30,eff:'rohrkomet',art:'gold',pause:1.0},
  /* der Tag bricht an - ruhige Goldbuketts im V, Fontaene mitten drin */
  {n:6,gap:1.0,muster:'v',ang:0.30,eff:['chrys','kamuro'],farbe:0,boden:{k:'fountain',gt:6,gh:0.8,A:'gold',B:'zitrone'},pause:1.2},
  /* Hitzeflimmern - kurze Brokat-Stoesse, gestreut */
  {n:7,gap:0.15,muster:'zufall',ang:0.20,eff:'brokat',kal:'klein',pw:-2,pause:1.4},
  /* FINALE Sonnenkranz: neun Strahlen auf Schlag, in der Mitte geht die Sonne auf */
  {n:9,gap:0,muster:'halbkreis',ang:1.45,eff:'rohrkomet',art:'glitter',farbe:1},
  {mit:true,n:1,muster:'gerade',eff:'diadem',kal:'riesig',pw:3,bruchOpt:{nachglitzer:false},boden:{k:'fountain',gt:4,gh:1.2,A:'zitrone'},pause:4}
]);
SIGNATUR.faecher={muster:'halbkreis',text:'Strahlenkranz bis zum Horizont'};

/* Level 16: Silberwirbel */
SHOWS.silberwirbel=()=>show({basis:{pw:0.05,sz:1.005,th:'silber'},rampe:{sz:[0.90,1.15],pw:[-1,2],hell:[0.90,1.20],kurve:'flach'}},[
  {n:4,gap:1.8,muster:'gerade',eff:'farfalle',kal:'klein',steig:'wirbel',boden:{k:'torte',gt:9,A:'silber'},pause:1.0},
  {n:6,gap:0.6,muster:'welle',ang:0.35,wellen:1,eff:['farfalle','spirale'],pause:1.2},
  /* Ruhepunkt: stehende Silberweide, darunter dreht sich ein Feuerrad */
  {n:8,gap:0.3,muster:'mitte',ang:0.40,eff:'glitzerweide',farbe:1,steig:'silber'},
  {mit:true,n:0,boden:{k:'rad',gt:8,A:'silber',B:'tuerkis'},pause:1.0},
  /* FINALE Wirbelsturm: 12 Farfalle im W */
  {n:12,gap:0.10,muster:'w',ang:0.40,eff:'farfalle',kal:'mittel',pause:3.5}
]);
SIGNATUR.silberwirbel={eff:'farfalle',text:'drehende Silberräder am Himmel'};

/* Level 16: Silberbrandung */
SHOWS.sternenmeer80=()=>show({basis:{pw:0.10,sz:1.010,th:'eis'},rampe:{sz:[0.80,1.30],pw:[-2,3],hell:[0.85,1.30],kurve:'welle'}},[
  /* Ebbe */
  {n:6,gap:1.6,muster:'gerade',eff:'silberwelle',kal:'klein',steig:'silber',boden:{k:'torte',gt:12,A:'silber'},pause:1.0},
  /* erste Wellen (Hoehenwelle nur im Finale - die Hoehenkurve ist Achterbahn-Signatur) */
  {n:14,gap:0.45,muster:'welle',ang:0.40,wellen:2,eff:['silberwelle','dahlie'],pause:1.4},
  /* Tiefsee: oben stehende Silberweiden, ganz unten schwimmen Fische */
  {n:10,gap:1.4,muster:'gerade',eff:'glitzerweide',farbe:1},
  {mit:true,n:10,gap:1.4,muster:'v',ang:0.50,kal:'mini',pw:-6,eff:'fische',farbe:2,pause:0.8},
  /* Gischt - schnell, eine kurze Zickzack-Phase */
  {n:16,gap:0.18,muster:'z',seg:3,ang:0.35,eff:'silberwelle',kal:'mittel',pause:1.6},
  /* FINALE Sturmflut: drei Wellenberge, Silber-Feuertoepfe, Riesenfontaene */
  {n:24,gap:0.10,muster:'welle',ang:0.50,wellen:3,hoehe:'welle',hSpanne:10,eff:'silberwelle',kal:'gross',
   mine:true,mineEff:'silber',boden:{k:'riesen',gt:4,gh:0.8,A:'silber',B:'weiss'},pause:3.5}
]);
SIGNATUR.sternenmeer80={eff:'silberwelle',text:'Gischt wird mitten im Flug zu Wasser'};

/* Level 17: Rummelplatz */
SHOWS.familienmix=()=>show({basis:{pw:0.50,sz:1.040,th:'pastell'},rampe:{sz:[0.90,1.10],pw:[-1,1],hell:[0.95,1.15],kurve:'flach'}},[
  /* Einlass: Riesenrad und Kreisel am Boden */
  {n:0,boden:[{k:'rad',gt:16,A:'rose',B:'aqua',x:-2},{k:'kreisel',gt:6,A:'zitrone',x:2}],pause:2.0},
  /* Karussell, gemaechlich */
  {n:8,gap:0.9,muster:'spirale',ang:0.35,kal:'klein',pw:-4,eff:'kreisel',steig:'blink',pause:1.2},
  /* Zuckerwatte: weiche Farbschleier, Fontaene dazu */
  {n:4,gap:1.6,muster:'gerade',eff:'farbregen',kal:'mittel',farbe:1,boden:{k:'fountain',gt:6,A:'rose',B:'weiss'},pause:0.8},
  /* Schiessbude: kleine Knister-Pops, schnell */
  {n:6,gap:0.15,muster:'zufall',ang:0.30,kal:'mini',pw:-6,eff:'knister',pause:1.2},
  /* FINALE Karussell auf Hochtouren und neue Kreisel */
  {n:6,gap:0.12,muster:'spirale',ang:0.50,kal:'mittel',eff:'kreisel',mine:true,mineEff:'farbe',boden:{k:'kreisel',gt:4,A:'aqua'},pause:3.0}
]);
SIGNATUR.familienmix={muster:'spirale',text:'Karussell aus Zuckerwatte-Farben'};

/* Level 17: Hagelsturm (neu) */
SHOWS.hagelsturm=()=>show({basis:{pw:0.55,sz:1.045,th:'eis'},rampe:{sz:[0.90,1.20],pw:[0,2],hell:[0.90,1.30],kurve:'frueh'}},[
  /* Aufzug der Wolke: lockeres Prasseln, zwei Knisterfontaenen laufen die ganze Show */
  /* 27.09.: pw -10 brach bei 7-8 m (hinter der Mauer), Katalog will 15-20 m */
  {n:40,gap:0.25,muster:'zufall',ang:0.30,kal:'mini',pw:-2,eff:'hagel',steig:'keiner',
   boden:[{k:'knisterbrunnen',gt:38,A:'silber',B:'weiss',x:-2},{k:'knisterbrunnen',gt:38,A:'silber',B:'weiss',x:2}]},
  {mit:true,n:2,gap:5,muster:'gerade',kal:'gross',pw:2,eff:'spinne',th:'silber'},
  /* Prasseln: dicht, als Welle ueber die Breite; oben grosse Schlaege */
  {n:100,gap:0.10,muster:'welle',ang:0.40,wellen:3,kal:'mini',pw:-1,eff:'hagel'},
  {mit:true,n:4,takt:[2.5],muster:'v',ang:0.30,kal:'gross',eff:['spinne','glitzerweide'],th:'silber'},
  /* Auge des Sturms: drei ruhige grosse Silberweiden */
  {n:3,gap:1.2,muster:'gerade',kal:'gross',pw:3,eff:'glitzerweide',pause:0.5},
  /* Hagelschlag: 16 je Sekunde im Zickzack, oben Kreuzschlaege, dazwischen Silber-Feuertoepfe */
  {n:145,gap:0.06,muster:'z',seg:4,ang:0.45,kal:'mini',pw:0,eff:'hagel'},
  {mit:true,n:6,takt:[1.6],muster:'x',ang:0.40,kal:'riesig',eff:'spinne',th:'silber'},
  {mit:true,n:12,gap:0.8,nurMine:true,mineEff:'silber',muster:'zufall',ang:0.30},
  /* FINALE: der Hagel hoert schlagartig auf, acht Silberweiden haengen nach */
  {n:8,gap:0,muster:'schlag',ang:0.50,kal:'gross',eff:'glitzerweide',pause:5}
]);
SIGNATUR.hagelsturm={eff:'hagel',text:'Prasseln aus 300 Mini-Kalibern'};

/* Level 17: Regenbogenbruecke */
SHOWS.regenbogenfaecher=()=>show({basis:{pw:0.60,sz:1.050,th:'spektrum'},rampe:{sz:[0.95,1.20],pw:[0,1],hell:[0.80,1.30],kurve:'linear'}},[
  /* Regenschauer: Silberregen am Boden, traege Glitzertropfen */
  {n:7,gap:1.3,muster:'zufall',ang:0.30,eff:'zeitregen',kal:'klein',th:'eis',boden:{k:'wasserfall',gt:14,A:'silber',B:'himmel'},pause:0.6},
  /* Farbtropfen: sieben einzelne Dahlien, jede eine Spektralfarbe */
  {n:7,gap:0.45,muster:'mitte',ang:0.50,eff:'dahlie',farbVert:'spektrum',bruchOpt:{kern:false},pause:2.0},
  /* FINALE Regenbogenbruecke: 7 Boegen a 7, aussen nach innen, stehen gemeinsam */
  {n:49,je:7,gap:0,bogenGap:0.28,muster:'bogen',r:[1.0,0.70],farbVert:'spektrum',eff:'dahlie',kal:'gross',steig:'keiner',
   bruchOpt:{kern:false,nachglitzer:false},boden:{k:'fountain',gt:3,gh:0.6,A:'weiss'},pause:4.5}
]);
SIGNATUR.regenbogenfaecher={muster:'bogen',text:'sieben einfarbige Bögen, Rot außen, Violett innen'};

/* Level 17: Blitzgewitter */
SHOWS.zfaecher=()=>show({basis:{pw:0.65,sz:1.055,th:'blitz'},rampe:{sz:[0.90,1.30],pw:[-1,3],hell:[0.70,1.40],kurve:'spaet'}},[
  /* Wetterleuchten: ferne, schwache Schlaege hoch oben */
  {n:6,gap:2.0,muster:'zufall',ang:0.35,pw:5,kal:'klein',eff:'salut',steig:'keiner',pause:0.5},
  /* erste Blitze, von aussen nach innen */
  {n:8,gap:0.9,muster:'aussen',ang:0.45,eff:'blitzast',steig:'silber',pause:1.2},
  /* Regen setzt ein: Silberregen am Boden, Blinkweiden als Regenschleier, dazwischen Blitze */
  {n:10,gap:0.4,muster:'gerade',eff:'strobeweide',farbe:1,boden:{k:'wasserfall',gt:8,A:'silber'}},
  {mit:true,n:6,gap:0.7,muster:'zufall',ang:0.40,pw:4,eff:'blitzast',kal:'mittel',pause:0.5},
  /* Sturmboee - der alte Z-Faecher als eine kurze Phase */
  {n:12,gap:0.12,muster:'z',seg:2,ang:0.45,eff:['spinne','blitzast'],pause:1.5},
  /* FINALE Entladung: sechs Blitze auf einen Schlag, Boden-Strobo */
  {n:6,gap:0,muster:'schlag',ang:0.50,eff:'blitzast',kal:'gross',pw:3,boden:{k:'blinker',gt:3,A:'weiss'},pause:4}
]);
SIGNATUR.zfaecher={eff:'blitzast',text:'gezackte Blitze mit Donner'};

/* Level 17: Achterbahn */
SHOWS.batterie100=()=>show({basis:{pw:0.70,sz:1.060,th:'himmel'},rampe:{sz:[0.90,1.20],pw:[0,0],hell:[0.90,1.25],kurve:'linear'}},[
  /* Kettenaufzug: jeder Schuss 2,5 m hoeher, Warnblinker am Boden */
  /* 27.09.: Hoehenspannen kleiner (Aufzug 16, Drop 18, Buckel 14 statt 30/35/20) -
     der Drop brach bei 39 m, hoeher als die Kugelbomben bis Level 18 (Toms Regel:
     Kugeln sind das Groesste und Hoechste bis zu ihrem Level, steigerung.js) und
     vom Zuendpult aus ueber dem Bildrand */
  {n:12,gap:0.9,muster:'treppe',hoehe:'steigend',hSpanne:16,kal:'klein',eff:'pistill',steig:'blink',farbe:0,boden:{k:'blinker',gt:11,A:'weiss'},pause:0.2},
  /* oben: kurzer Stillstand, ein grosser Kamuro als Aussicht */
  {n:1,muster:'gerade',eff:'kamuro',kal:'gross',pw:6,pause:1.8},
  /* erster Drop: fallend, immer schneller, kreischende Aufstiege */
  {n:16,gap:0.35,gapEnde:0.07,muster:'v',ang:0.15,hoehe:'fallend',hSpanne:18,eff:['chrys','spinne'],steig:'pfeif',pause:1.2},
  /* Kamelbuckel: Hoehen als Welle, Fontaene am Boden */
  {n:18,gap:0.30,muster:'welle',ang:0.30,wellen:3,hoehe:'welle',hSpanne:14,eff:['dahlie','palme'],farbe:1},
  {mit:true,n:0,boden:{k:'fountain',gt:6,gh:0.9,A:'violett',B:'gold'},pause:1.0},
  /* Steilkurve: Paare, Winkel waechst */
  {n:14,gap:0.20,muster:'paar',ang:0.50,eff:'komet',farbe:2,pause:1.0},
  /* Tunnel: dunkel, tief, rumpelndes Knistern */
  {n:10,gap:0.25,muster:'zufall',ang:0.25,kal:'mini',pw:-8,eff:'tausend',pause:0.8},
  /* Schlussfahrt: Kreuzfeuer mit wechselnden Hoehen */
  {n:24,gap:0.12,muster:'x',ang:0.45,hoehe:'wechsel',hSpanne:15,eff:['kamuro','geist'],kal:'gross'},
  /* FINALE Schlussbremse: fuenf tiefe Strobe-Blitze auf Schlag - das Achterbahn-Foto */
  {n:5,gap:0,muster:'schlag',ang:0.50,eff:'strobe',kal:'mittel',pw:-4,pause:3.5}
]);
SIGNATUR.batterie100={idee:'hoehenkurve',text:'Aufzug, Drop, Buckel, Bremse'};

/* Level 18: Kreuzfeuer */
SHOWS.kreuzfeuer=()=>show({basis:{pw:1.00,sz:1.080,th:'rotweiss'},rampe:{sz:[0.90,1.20],pw:[-1,2],hell:[0.90,1.25],kurve:'frueh'}},[
  {n:4,gap:1.6,muster:'gerade',eff:'kreuzkomet',kal:'mittel',boden:{k:'knisterbrunnen',gt:8,A:'weiss',B:'rot'},pause:0.8},
  /* Kreuzfeuer: linkes Rohr nach rechts, rechtes nach links; links rot, rechts weiss */
  {n:12,gap:0.5,muster:'x',ang:0.45,rohre:'breit',eff:'kreuzkomet',farbVert:'seite',pause:1.2},
  /* Stellungswechsel: ruhiges V, Knister-Feuertoepfe darunter */
  {n:8,gap:1.0,muster:'v',ang:0.30,eff:['pistill','kreuzkomet'],farbe:1,mine:true,mineEff:'knister',pause:1.0},
  /* FINALE Gitter: 18 Kreuzkometen im Kreuzfeuer, Splitter doppelt */
  {n:18,gap:0.10,muster:'x',ang:0.50,rohre:'breit',eff:'kreuzkomet',split:2,kal:'gross'},
  {mit:true,n:0,boden:{k:'knisterbrunnen',gt:3,gh:1.2,A:'weiss'},pause:3.5}
]);
SIGNATUR.kreuzfeuer={eff:'kreuzkomet',text:'gekreuzte Kometen, die sich vierfach teilen'};

/* Level 19: Lichterkette */
SHOWS.lichterkugeln=()=>show({basis:{pw:1.50,sz:1.120,th:'bunt'},rampe:{sz:[0.95,1.15],pw:[0,1],hell:[0.90,1.20],kurve:'flach'}},[
  /* einzelne Kugeln, dazwischen die kleine Goldfontaene aus dem Rohr */
  {n:6,gap:1.2,muster:'gerade',perle:true,perleEff:'schwebeperle',boden:{k:'fountain',gt:8,gh:0.4,A:'gold'},pause:1.5},
  /* die Kette: einmal quer gelegt (der einzige fan im Katalog) */
  {n:6,gap:0.18,muster:'fan',ang:0.60,hoehe:'gleich',perle:true,perleEff:'schwebeperle',pause:3.5},
  /* zweite Kette in anderer Farbe, von aussen zur Mitte */
  {n:6,gap:0.25,muster:'aussen',ang:0.60,perle:true,perleEff:'schwebeperle',farbe:1,boden:{k:'fountain',gt:5,gh:0.4,A:'gold'},pause:3.5},
  /* FINALE Doppelkette: sechs auf Schlag, Hoehen im Wechsel - Zickzack-Girlande */
  {n:6,gap:0,muster:'schlag',ang:0.60,hoehe:'wechsel',hSpanne:6,perle:true,perleEff:'schwebeperle',farbe:2,pause:4.5}
]);
SIGNATUR.lichterkugeln={eff:'schwebeperle',text:'Kette aus schwebenden Leuchtkugeln'};

/* Level 19: Donnerschlag */
SHOWS.donnerschlag=()=>show({basis:{pw:1.55,sz:1.125,th:'rotweiss'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.90,1.30],kurve:'linear'}},[
  /* Vorwarnung: drei einzelne Kanonenschlaege, Silberknister am Boden */
  {n:3,gap:2.2,muster:'mitte',ang:0.20,eff:'salut',kal:'gross',steig:'silber',boden:{k:'knisterbrunnen',gt:10,A:'silber',B:'weiss'},pause:1.0},
  /* Knallringe im V */
  {n:6,gap:1.1,muster:'v',ang:0.30,eff:'knallring',kal:'mittel',pause:1.2},
  /* Zwischenschauer: knisternde Traeger, Boden-Strobo */
  {n:5,gap:0.35,muster:'mitte',ang:0.40,eff:'tausend',farbe:1},
  {mit:true,n:0,boden:{k:'blinker',gt:3,A:'weiss'},pause:1.0},
  /* FINALE Donnerwalze: sechs Knallringe auf einen Schlag */
  {n:6,gap:0,muster:'schlag',ang:0.45,eff:'knallring',kal:'gross',pw:2,pause:4}
]);
SIGNATUR.donnerschlag={eff:'knallring',text:'Blitzschläge laufen im Kreis'};

/* Level 19: Vorhang auf! */
SHOWS.goldenerregen=()=>show({basis:{pw:1.60,sz:1.130,th:'gold'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.85,1.30],kurve:'welle'}},[
  /* drei Klingelzeichen; das Rampenlicht am Boden laeuft die ganze Show */
  {n:3,gap:1.2,muster:'gerade',eff:'salut',kal:'mini',pw:-6,boden:{k:'torte',gt:42,A:'gold'},pause:1.0},
  /* der Vorhang faellt: neun Goldvorhaenge auf Schlag ueber die volle Breite */
  {n:9,gap:0,muster:'schlag',ang:0.55,eff:'goldvorhang',kal:'gross',pause:2.0},
  /* Vorhang auf: von der Mitte nach aussen */
  {n:8,gap:0.3,muster:'mitte',ang:0.55,eff:'goldvorhang',pause:1.0},
  /* 1. Akt: Brokatkronen, ruhig */
  {n:8,gap:1.1,muster:'gerade',eff:'brokat',farbe:1,pause:1.2},
  /* 2. Akt: Tanz in Paaren, darunter Applaus (knisternde Goldsterne) */
  {n:12,gap:0.35,muster:'paar',ang:0.40,eff:['kronleuchter','zeitregen'],farbe:2},
  {mit:true,n:6,gap:0.7,muster:'zufall',ang:0.30,kal:'klein',pw:-5,eff:'drachenei',pause:1.4},
  /* 3. Akt: Kamuro-Solo, sehr langsam */
  {n:4,gap:2.4,muster:'gerade',eff:'kamuro',kal:'riesig',pw:3,pause:1.0},
  /* FINALE Vorhang zu: von aussen zur Mitte, Schlussapplaus, Goldgeysir */
  {n:14,gap:0.12,muster:'aussen',ang:0.60,eff:'goldvorhang',kal:'gross'},
  {mit:true,n:6,gap:0.3,muster:'zufall',ang:0.35,kal:'klein',pw:-4,eff:'drachenei',boden:{k:'riesen',gt:4,gh:0.9,A:'gold',B:'weiss'},pause:4.5}
]);
SIGNATUR.goldenerregen={idee:'vorhang',text:'Vorhang fällt, öffnet sich, schließt sich'};

/* Level 19: Schimmelreiter. Galopp und Finale bekommen Silber fest
   (A silber, B blau/himmel als Spitzen) - aus dem Thema kaeme dort
   Tuerkis/Gold, und die Signatur ist der SILBERNE Pferdeschweif */
SHOWS.kometen=()=>show({basis:{pw:1.65,sz:1.135,th:'nacht'},rampe:{sz:[0.90,1.25],pw:[-1,2],hell:[0.90,1.25],kurve:'frueh'}},[
  /* Anritt: einzelne Pferdeschweife, Silbersaeule am Boden */
  {n:6,gap:1.5,muster:'gerade',eff:'rossschweif',steig:'komet',kal:'mittel',A:'silber',B:'blau',boden:{k:'riesen',gt:9,gh:0.7,A:'silber',B:'weiss'},pause:0.8},
  /* Trab: W, im Wechsel mit Zeitregen */
  {n:12,gap:0.6,muster:'w',ang:0.40,eff:['rossschweif','zeitregen'],farbe:1,pause:1.2},
  /* Galopp: da-da-DUMM, Scheibenwischer zweimal hin und zurueck */
  {n:16,takt:[0.15,0.15,0.45],muster:'wischer',seg:2,ang:0.45,eff:'rossschweif',kal:'klein',A:'silber',B:'himmel',pause:1.4},
  /* Maehne: grosse Blinkweiden oben, kleine Kometen unten im V */
  {n:10,gap:0.9,muster:'gerade',eff:'strobeweide',kal:'gross'},
  {mit:true,n:10,gap:0.9,muster:'v',ang:0.50,kal:'mini',pw:-6,eff:'komet',pause:0.8},
  /* FINALE Durchgehen: zehn Riesen-Pferdeschweife von der Mitte nach aussen, Silber-Feuertoepfe */
  {n:10,gap:0.08,muster:'mitte',ang:0.50,eff:'rossschweif',kal:'riesig',A:'silber',B:'blau',mine:true,mineEff:'silber',pause:4.5}
]);
SIGNATUR.kometen={eff:'rossschweif',text:'Silberne Pferdeschweife im Galopp'};

/* Level 20: Rosenherz */
SHOWS.hochzeitsfaecher=()=>show({basis:{pw:2.00,sz:1.160,th:'herz'},rampe:{sz:[0.95,1.15],pw:[0,1],hell:[0.90,1.25],kurve:'flach'}},[
  /* Rosen werfen: Paare, Winkel waechst, rosa Leuchten am Boden */
  {n:8,gap:0.7,muster:'paar',ang:0.25,eff:'pistill',kal:'klein',steig:'glut',boden:{k:'bengal',gt:10,A:'rose'},pause:1.0},
  /* Rosenblaetter schweben */
  {n:6,gap:1.2,muster:'mitte',ang:0.40,eff:'blaetter',farbe:0,pause:1.0},
  /* DAS HERZ: 7 Paare auf der Herzkontur, von der Spitze aufwaerts, alle stehen am Ende zugleich */
  /* 27.09.: kal mini, Takt 0,25 s, 20 m breit und Mitte 19 m statt mittel/0,5 s/
     24 m/~25 m - vorher verliefen die grossen Dahlien ineinander, die Spitze war
     erloschen, bevor oben die Boegen standen, und die Boegen lagen vom
     Zuendpult aus ueber dem Bildrand: kein Herz zu erkennen */
  {n:14,je:2,takt:[0.25],muster:'bild',form:'herz',breite:20,mitteH:19,eff:'dahlie',kal:'mini',bruchOpt:{nachglitzer:false},boden:{k:'fountain',gt:9,A:'rose',B:'gold'},pause:3.0},
  /* FINALE Ringtausch: zwei goldene Doppelringe, darunter weisser "Reis" */
  {n:2,gap:0,muster:'v',ang:0.20,eff:'doppelring',kal:'gross',th:'gold'},
  {mit:true,n:6,gap:0.15,muster:'zufall',ang:0.40,kal:'klein',pw:-3,eff:'farbregen',th:'silber',pause:4.5}
]);
SIGNATUR.hochzeitsfaecher={muster:'bild',text:'Herz aus 14 Blüten am Himmel'};

/* Level 20: Trommelfeuer */
SHOWS.donnerwand=()=>show({basis:{pw:2.05,sz:1.165,th:'glut'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.90,1.30],kurve:'linear'}},[
  /* Viertel: 4 Salven, Flammenfontaene */
  {n:24,je:6,takt:[1.8],muster:'schlag',ang:0.35,eff:'palme',kal:'mittel',boden:{k:'feuerbrunnen',gt:7,A:'rot',B:'gold'},pause:1.0},
  /* Synkope: kurz-kurz-lang, V-Salven */
  {n:24,je:6,takt:[0.5,0.5,1.4],muster:'v',ang:0.40,eff:'kokosnuss',farbe:1,pause:1.2},
  /* Paukenschlag: eine senkrechte Sechser-Salve, danach Stille */
  {n:6,je:6,muster:'gerade',eff:'weide',kal:'gross',pause:2.5},
  /* Triolen: W-Salven, Mitte andere Farbe, Fontaenen flackern */
  {n:36,je:6,takt:[0.28,0.28,0.9],muster:'w',ang:0.45,farbVert:'mitte',eff:['spinne','flammenregen','spinne']},
  {mit:true,n:0,boden:[{k:'feuerbrunnen',gt:4,x:-3},{k:'feuerbrunnen',gt:4,x:3}],pause:1.2},
  /* Wirbel: 4 Salven in 0,36 s */
  {n:24,je:6,takt:[0.12],muster:'schlag',ang:0.55,eff:'brokat',kal:'gross',pw:2},
  /* FINALE Tusch: eine senkrechte Riesen-Salve */
  {n:6,je:6,muster:'gerade',eff:'kamuro',kal:'riesig',pw:3,pause:4.5}
]);
SIGNATUR.donnerwand={idee:'trommel',text:'20 Salven im Takt eines Trommelsolos'};

/* Level 20: Neonsaeulen */
SHOWS.feuerpfau=()=>show({basis:{pw:2.10,sz:1.170,th:'tropen'},rampe:{sz:[0.90,1.25],pw:[-1,2],hell:[0.95,1.35],kurve:'frueh'}},[
  {n:4,gap:1.8,muster:'gerade',mine:true,mineEff:'farbe',steig:'farbspur',eff:'dahlie',kal:'mittel',boden:{k:'fountain',gt:8,A:'magenta',B:'weiss'},pause:1.0},
  /* Saeulengang: aussen nach innen, ueber die Breite verteilt, Farben im Wechsel */
  {n:14,gap:0.55,muster:'aussen',ang:0.50,rohre:'breit',mine:true,mineEff:'farbe',steig:'farbspur',eff:'pistill',farbVert:'wechsel',pause:1.2},
  /* Komplementaer: oben V in Farbe B, unten Blinker-Feuertoepfe in Farbe A */
  {n:12,gap:0.9,muster:'v',ang:0.35,steig:'farbspur',eff:'chrys',farbe:1},
  {mit:true,n:12,gap:0.9,nurMine:true,mineEff:'blink',muster:'gerade',farbe:2,pause:0.6},
  /* Neon-Paare */
  {n:20,gap:0.30,muster:'paar',ang:0.45,mine:true,mineEff:'farbe',steig:'farbspur',eff:'wechsel',pause:1.2},
  /* Saeulenwand: Mitte nach aussen, schnell */
  {n:18,gap:0.12,muster:'mitte',ang:0.55,rohre:'breit',mine:true,mineEff:'farbe',steig:'farbspur',eff:'chrys',kal:'gross',pause:1.0},
  /* FINALE: zwei Zehner-Salven, jede Saeule in ihrer Farbe, Mitte anders */
  {n:20,je:10,takt:[0.6],muster:'schlag',ang:0.60,mine:true,mineEff:'farbe',steig:'farbspur',eff:'dahlie',kal:'riesig',farbVert:'mitte',
   boden:{k:'fountain',gt:3,gh:1.2,A:'limette'},pause:4.5}
]);
SIGNATUR.feuerpfau={idee:'farbsaeule',text:'Farbe steigt vom Feuertopf bis zum Bruch'};

/* Level 20: Hexenkessel (neu) */
SHOWS.hexenkessel=()=>show({basis:{pw:2.15,sz:1.175,th:'hexe'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'spaet'}},[
  /* der Kessel heizt: knisternde Blasen, der Kessel laeuft die ganze Show */
  {n:28,gap:0.30,muster:'zufall',ang:0.20,kal:'klein',pw:-7,eff:'knister',boden:{k:'kessel',gt:34,A:'limette',B:'violett'}},
  {mit:true,n:4,takt:[2.0],muster:'v',ang:0.40,kal:'mittel',eff:'geist',pause:0.4},
  /* Hexenringe: 6 Ringe a 8, schraeg nach aussen, Farben im Wechsel */
  {n:48,je:8,takt:[0.9,0.9,0.5],muster:'kreis',ang:0.40,eff:['wechsel','spinne'],kal:'mittel',farbVert:'wechsel'},
  /* darunter Irrlichter im Scheibenwischer */
  {mit:true,n:30,gap:0.15,muster:'wischer',seg:3,ang:0.50,kal:'mini',pw:-8,eff:'fische',farbe:1,pause:0.6},
  /* Beschwoerung: sechs grosse violette Pistillen, senkrecht */
  {n:6,gap:1.0,muster:'gerade',kal:'riesig',pw:3,eff:'pistill',farbe:2,pause:0.4},
  /* FINALE Walpurgisnacht: 8 Ringe in 2,4 s, Feuertoepfe gruen */
  {n:64,je:8,takt:[0.3],muster:'kreis',ang:0.50,rohre:'breit',kal:'gross',eff:['palme','geist','tausend','wechsel'],mine:true,mineEff:'farbe',pause:4.5}
]);
SIGNATUR.hexenkessel={muster:'kreis',text:'Hexenringe aus acht Rohren um einen brodelnden Kessel'};

/* Level 21: Lauflicht */
SHOWS.blitzgewitter60=()=>show({basis:{pw:2.50,sz:1.200,th:'blitz'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.30],kurve:'linear'}},[
  /* Kontrast: gewoehnliche, wild flackernde Blinker */
  {n:6,gap:1.4,muster:'gerade',eff:'strobe',kal:'mittel',boden:{k:'blinker',gt:9,A:'weiss'},pause:1.0},
  /* Gleichtakt: die ganze Wolke pulsiert */
  {n:10,gap:0.8,muster:'v',ang:0.35,eff:'lauflicht',modus:'puls',farbe:1,pause:1.2},
  /* Lauflicht quer */
  {n:8,gap:0.35,muster:'zufall',ang:0.30,eff:'lauflicht',modus:'quer',pause:1.2},
  /* zwei Ebenen: oben Ringe nach aussen, unten kleine Blinker von aussen nach innen */
  {n:10,gap:0.7,muster:'gerade',eff:'lauflicht',modus:'radial',kal:'gross'},
  {mit:true,n:10,gap:0.7,muster:'aussen',ang:0.50,kal:'mini',pw:-6,eff:'strobe',farbe:2,boden:{k:'blinker',gt:7,A:'himmel'},pause:0.8},
  /* FINALE Lichtband ueber den ganzen Himmel: alle Brueche teilen eine Phase */
  {n:16,gap:0.06,muster:'w',ang:0.50,eff:'lauflicht',modus:'quer',sync:true,kal:'gross',pause:4.5}
]);
SIGNATUR.blitzgewitter60={eff:'lauflicht',text:'Lichtband läuft durch eine Blinkerwolke'};

/* Level 21: Nordlicht */
SHOWS.nordlicht=()=>show({basis:{pw:2.55,sz:1.205,th:'aurora'},rampe:{sz:[1.00,1.20],pw:[2,3],hell:[0.75,1.10],kurve:'flach'}},[
  /* Akt 1 Daemmerung: Vorhaenge steigen dunkel auf, Schneeglitzern am Boden */
  {n:10,gap:2.2,muster:'gerade',eff:'polarlicht',kal:'mittel',pw:4,steig:'keiner',boden:{k:'torte',gt:24,A:'weiss'},pause:1.0},
  /* Akt 2 Sternklare Nacht: winzige Blinksterne hoch oben, dazwischen grosse Vorhaenge */
  {n:18,gap:0.9,muster:'zufall',ang:0.40,pw:6,kal:'klein',eff:'blink',th:'eis'},
  {mit:true,n:6,gap:2.7,muster:'welle',ang:0.40,eff:'polarlicht',kal:'gross',pw:4,pause:0.5},
  /* Akt 3 Vorhaenge wehen: paarweise, im Wechsel mit Farbwechsel-Kugeln */
  {n:20,gap:0.6,muster:'paar',ang:0.40,eff:['polarlicht','geist'],pause:1.2},
  /* Akt 4 Eisbrunnen: Silberfontaene mitten in der Show, Silberweiden darueber */
  {n:12,gap:1.0,muster:'mitte',ang:0.40,eff:'glitzerweide',th:'eis',boden:{k:'riesen',gt:12,gh:1.0,A:'silber',B:'tuerkis'},pause:1.2},
  /* Akt 5 Sonnensturm (laut): Kreuzfeuer, gruene Feuertoepfe, Knisterfontaene */
  {n:30,gap:0.18,muster:'x',ang:0.45,eff:['kamuro','polarlicht','spinne'],kal:'gross',mine:true,mineEff:'farbe',boden:{k:'knisterbrunnen',gt:5,A:'gruen',B:'weiss'},pause:1.4},
  /* Akt 6 Koronaschlag: zwei Sechser-Salven Vorhaenge - ein himmelweiter Vorhang */
  {n:12,je:6,takt:[0.7],muster:'schlag',ang:0.50,eff:'polarlicht',kal:'riesig',pw:5,pause:2.5},
  /* Akt 7 STILLES FINALE Morgengrauen: zischender Zeitregen, dazwischen die letzten Vorhaenge */
  {n:36,gap:0.35,muster:'gerade',eff:'zeitregen',kal:'mittel',pw:3,steig:'keiner',bruchOpt:{kern:false}},
  {mit:true,n:6,gap:2.0,muster:'v',ang:0.30,eff:'polarlicht',kal:'riesig',pause:7}
]);
SIGNATUR.nordlicht={eff:'polarlicht',text:'wehende grün-violette Lichtvorhänge'};

/* Level 22: Goldene Zwillinge */
SHOWS.goldregen22=()=>show({basis:{pw:3.00,sz:1.240,th:'gold'},rampe:{sz:[0.95,1.20],pw:[0,2],hell:[0.90,1.25],kurve:'linear'}},[
  {n:6,gap:1.4,muster:'gerade',perle:true,perleEff:'zwilling',boden:{k:'fountain',gt:9,gh:0.4,A:'gold'},pause:0.8},
  {n:8,gap:0.5,muster:'welle',ang:0.25,perle:true,perleEff:'zwilling',splitDreh:0.785,farbe:1,pause:1.0},
  /* FINALE Zwillingsschauer: schnell, Split-Enden in Farbe, Fontaene wieder an */
  {n:8,gap:0.2,muster:'zufall',ang:0.15,perle:true,perleEff:'zwilling',splitDreh:0.785,farbe:2,boden:{k:'fountain',gt:3,gh:0.5,A:'zitrone'},pause:3.5}
]);
SIGNATUR.goldregen22={eff:'zwilling',text:'Leuchtkugel teilt sich in zwei'};

/* Level 22: Pfeifkonzert */
SHOWS.pfeifkonzert=()=>show({basis:{pw:3.05,sz:1.245,th:'wald'},rampe:{sz:[0.90,1.20],pw:[0,2],hell:[0.90,1.25],kurve:'welle'}},[
  /* Einstimmen: acht Heuler, jeder in einem anderen schiefen Ton */
  {n:8,gap:0.9,muster:'aussen',ang:0.35,steig:'pfeif',ton:'stimmen',eff:'dahlie',kal:'klein',boden:{k:'fountain',gt:8,A:'gruen',B:'gold'},pause:1.0},
  /* Piccolo: kurze, hohe Pfiffe, flache Sternschnuppen */
  {n:16,gap:0.15,muster:'zufall',ang:0.35,kal:'mini',pw:-5,steig:'pfeif',ton:'hoch',eff:'sternschnuppen',pause:1.2},
  /* Duett: oben Dreiklang-Heuler im V, unten brummende Bienen */
  {n:12,gap:1.2,muster:'v',ang:0.40,steig:'dreiklang',eff:'palme',kal:'mittel',farbe:1},
  {mit:true,n:12,gap:1.2,muster:'gerade',kal:'mini',pw:-7,steig:'pfeif',ton:'tief',eff:'bienen',pause:0.8},
  /* Kreischwirbel und Feuerrad am Boden */
  {n:12,gap:0.35,muster:'w',ang:0.45,steig:'wirbel',pfeif:true,eff:'spirale',boden:{k:'rad',gt:5,A:'gruen',B:'zitrone'},pause:1.2},
  /* FINALE Dreiklang: zehn Heuler auf Schlag (Akkord), dann Ausklang mit fallendem Ton */
  {n:10,gap:0,muster:'schlag',ang:0.50,steig:'dreiklang',ton:'akkord',eff:'kamuro',kal:'gross',pw:4,pause:0.6},
  {n:10,gap:0.08,muster:'mitte',ang:0.40,steig:'pfeif',ton:'fallend',eff:'chrys',pause:4.5}
]);
SIGNATUR.pfeifkonzert={eff:'dreiklang',text:'gestimmte Heuler mit dreifachem Tonwechsel'};

/* Level 22: Goetterfunken - "Ode an die Freude" in Bruchhoehen
   (Tonschritte ueber C, Dauer in Vierteln) */
const ODE_A={ton:[2,2,3,4, 4,3,2,1, 0,0,1,2, 2,1,1],dauer:[1,1,1,1, 1,1,1,1, 1,1,1,1, 1.5,0.5,2]};
const ODE_A2={ton:[2,2,3,4, 4,3,2,1, 0,0,1,2, 1,0,0],dauer:[1,1,1,1, 1,1,1,1, 1,1,1,1, 1.5,0.5,2]};
const ODE={ton:[...ODE_A.ton,...ODE_A2.ton],dauer:[...ODE_A.dauer,...ODE_A2.dauer]};
const ODE_BASS={ton:[0,0,-3,-3,0,0,-3,-3, 0,0,-3,-3,0,0,-3,0],dauer:Array(16).fill(2)};
SHOWS.profi=()=>show({basis:{pw:3.10,sz:1.250,th:'koenig'},rampe:{sz:[0.90,1.30],pw:[0,2],hell:[0.85,1.35],kurve:'linear'}},[
  /* Strophe 1 SOLO: eine Stimme, senkrecht, Hoehe = Ton, Kerzenlicht-Fontaene.
     27.09.: 2,5 m je Tonschritt statt 4 m, Schlussakkord 1,1 m je Halbton ohne pw -
     vorher brach der Akkord bei 53 m, hoeher als Kugel 200/300 (steigerung.js) */
  {n:30,muster:'gerade',hoehe:'melodie',noten:ODE,viertel:0.6,hStufe:2.5,eff:'pistill',kal:'mittel',steig:'gold',boden:{k:'fountain',gt:20,gh:0.5,A:'gold'},pause:2.0},
  /* Zwischenspiel "Goetterfunken": knisternde Goldsterne im Scheibenwischer */
  {n:14,gap:0.2,muster:'wischer',seg:2,ang:0.40,eff:'drachenei',kal:'klein',pause:1.2},
  /* Strophe 2 DUETT: Melodie oben senkrecht, Bass in Halben tiefer im V */
  {n:30,muster:'gerade',hoehe:'melodie',noten:ODE,viertel:0.5,hStufe:2.5,eff:'dahlie',farbe:1},
  {mit:true,n:16,muster:'v',ang:0.45,hoehe:'melodie',noten:ODE_BASS,viertel:0.5,hStufe:2.5,pw:-6,kal:'klein',eff:'palme',farbe:2,pause:1.0},
  /* Zwischenspiel: Wasserfall der Freude - Fontaenen mitten in der Show, grosse Kronleuchter */
  {n:12,gap:1.3,muster:'aussen',ang:0.50,eff:'kronleuchter',kal:'gross',boden:[{k:'wasserfall',gt:16,A:'gold'},{k:'feuerbrunnen',gt:8,x:-3},{k:'feuerbrunnen',gt:8,x:3}],pause:1.5},
  /* KANON: linkes Modul (senkrecht) beginnt, rechtes (zur Mitte geneigt) setzt zwei Viertel spaeter ein */
  {n:15,muster:'gerade',x:-8,hoehe:'melodie',noten:ODE_A,viertel:0.5,hStufe:2.5,eff:'brokat',farbe:0},
  {mit:1.0,n:15,muster:'x',ang:0.15,x:8,hoehe:'melodie',noten:ODE_A,viertel:0.5,hStufe:2.5,eff:'brokat',farbe:1,pause:1.0},
  /* Strophe 3 TUTTI: schneller, Melodie + Bass + Pauken + Feuertoepfe */
  {n:30,muster:'gerade',hoehe:'melodie',noten:ODE,viertel:0.38,hStufe:2.5,eff:'brokat',kal:'gross',mine:true,mineEff:'gold'},
  {mit:true,n:16,muster:'x',ang:0.50,hoehe:'melodie',noten:ODE_BASS,viertel:0.38,hStufe:2.5,pw:-5,eff:'kamuro',kal:'mittel'},
  {mit:true,n:8,je:2,takt:[3.04],muster:'schlag',ang:0.50,eff:'kokosnuss',kal:'gross',pause:0.4},
  /* SCHLUSSAKKORD: neun Rohre im W, Hoehen C-E-G-C'-E'-C'-G-E-C, Riesenfontaene */
  {n:9,gap:0,muster:'w',ang:0.50,hoehe:'akkord',noten:{ton:[0,2,4,7,9,7,4,2,0]},eff:['brokat','dahlie','kamuro'],farbVert:'mitte',kal:'riesig',hStufe:1.1,
   boden:{k:'riesen',gt:5,gh:1.3,A:'gold',B:'violett'},pause:1.5},
  /* Nachhall: fuenf langsame goldene Zeitregen */
  {n:5,gap:0.9,muster:'zufall',ang:0.30,eff:'zeitregen',kal:'gross',pw:3,pause:6}
]);
SIGNATUR.profi={muster:'melodie',text:'Ode an die Freude in Bruchhöhen'};

/* Level 23: Weidenwand */
SHOWS.kometenwand=()=>show({basis:{pw:3.50,sz:1.280,th:'gold'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.85,1.30],kurve:'spaet'}},[
  /* Mitte allein: grosse Weiden, Goldfontaene */
  {n:6,gap:2.0,x:0,muster:'gerade',eff:'weide',kal:'gross',boden:{k:'fountain',x:0,gt:12,A:'gold'},pause:0.6},
  /* links fragt ... */
  {n:8,gap:0.3,x:-8,muster:'v',ang:0.35,eff:'strobeweide',farbe:1,pause:0.8},
  /* ... rechts antwortet */
  {n:8,gap:0.3,x:8,muster:'w',ang:0.35,eff:'strobeweide',farbe:1,pause:1.0},
  /* Mitte, dazu beide Seitenfontaenen */
  {n:10,gap:0.9,x:0,muster:'gerade',eff:['glitzerweide','weide'],kal:'gross',boden:[{k:'riesen',x:-8,gt:9,gh:0.8},{k:'riesen',x:8,gt:9,gh:0.8}],pause:1.2},
  /* Schlagabtausch: links/rechts im Wechsel, sehr schnell */
  {n:24,gap:0.15,x:[-8,8],muster:'zufall',ang:0.25,eff:'zeitregen',kal:'klein',pause:1.4},
  /* FINALE die Wand: Mitte Riesenweiden, beide Fluegel Blinkweiden, drei Riesenfontaenen */
  {n:14,gap:0.12,x:0,muster:'mitte',ang:0.35,eff:'weide',kal:'riesig'},
  {mit:true,n:20,gap:0.085,x:[-8,8],muster:'aussen',ang:0.40,eff:'strobeweide',kal:'gross',boden:[{k:'riesen',x:-8,gt:4},{k:'riesen',x:0,gt:4},{k:'riesen',x:8,gt:4}],pause:6.5}
]);
SIGNATUR.kometenwand={idee:'dreimodul',text:'drei Batterien im Dialog, Finale als Weidenwand'};

/* Level 23: Kaleidoskop */
SHOWS.sternenkaiser=()=>show({basis:{pw:3.55,sz:1.285,th:'buntglas'},rampe:{sz:[0.90,1.30],pw:[-1,3],hell:[0.90,1.35],kurve:'welle'}},[
  /* Akt 1 Drehung: einzelne Kaleidoskope, am Boden dreht das "Rohr" (Feuerrad) */
  {n:8,gap:1.8,muster:'gerade',eff:'kaleidoskop',kal:'mittel',boden:{k:'rad',gt:15,A:'violett',B:'zitrone'},pause:1.0},
  /* Akt 2 Spiegel: V-Paare, links Farbe A, rechts Farbe B */
  {n:34,gap:0.55,muster:'v',ang:0.40,eff:['kaleidoskop','pistill'],farbVert:'seite',pause:1.2},
  /* Akt 3 Facetten: oben W (Mitte andere Farbe), unten kleine Knister, zwei symmetrische Fontaenen */
  {n:20,gap:0.8,muster:'w',ang:0.45,farbVert:'mitte',eff:'dahlie'},
  {mit:true,n:20,gap:0.8,muster:'gerade',kal:'mini',pw:-8,eff:'knister',boden:[{k:'fountain',gt:16,x:-3,A:'tuerkis'},{k:'fountain',gt:16,x:3,A:'tuerkis'}],pause:0.6},
  /* Akt 4 Glassplitter: harte gerade Linien, aussen nach innen, sehr schnell */
  {n:44,gap:0.12,muster:'aussen',ang:0.55,eff:'spinne',farbVert:'wechsel',pause:1.4},
  /* Akt 5 Rosette: riesige Einzel-Kaleidoskope, dazu zwei Kugelbomben mit eigenem Bild */
  {n:10,gap:2.2,muster:'mitte',ang:0.35,eff:'kaleidoskop',kal:'riesig',pw:5,bruchOpt:{nachglitzer:false}},
  {mit:true,n:2,gap:11,bomb:3,bombEff:'kaleidoskop',bombStufen:[{t:1.0,eff:'pistill',n:8,kranz:0.47}],pause:1.0},
  /* Akt 6 Doppelspiegel: Kreuzfeuer aus der ganzen Breite, Feuertoepfe, Knisterfontaenen symmetrisch */
  {n:48,gap:0.25,muster:'x',ang:0.50,rohre:'breit',eff:['kaleidoskop','brokat'],farbVert:'seite',mine:true,mineEff:'farbe',
   boden:[{k:'knisterbrunnen',gt:8,x:-4},{k:'knisterbrunnen',gt:8,x:4}],pause:1.5},
  /* FINALE Das grosse Fenster: 5 Achter-Salven Kaleidoskope, darunter Silberweiden im W, zwei Riesenfontaenen */
  {n:40,je:8,takt:[0.5],muster:'schlag',ang:0.60,eff:'kaleidoskop',kal:'gross',farbVert:'mitte'},
  {mit:true,n:24,gap:0.1,muster:'w',ang:0.55,kal:'klein',pw:-4,eff:'glitzerweide',boden:[{k:'riesen',gt:5,x:-4},{k:'riesen',gt:5,x:4}],pause:5}
]);
SIGNATUR.sternenkaiser={eff:'kaleidoskop',text:'zwölf Buntglas-Farbinseln, alles spiegelgleich'};

/* Level 23: Geysirfeld (neu) - je:5 = eine Saeule, orte = x je Saeule,
   kal-Array je Schuss in der Saeule, boden.je = Geysir am Saeulenort */
const GEYSIR_SAEULE=['knister','pistill','chrys','dahlie','brokat'], GEYSIR_KAL=['mini','klein','mittel','gross','riesig'];
SHOWS.geysirfeld=()=>show({basis:{pw:3.60,sz:1.290,th:'eis'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'frueh'}},[
  /* erstes Blubbern: drei Ausbrueche, Saeulen gerade */
  {n:15,je:5,gap:0.08,takt:[2.4],orte:[0,-6,6],muster:'treppe',hoehe:'steigend',hSpanne:20,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,boden:{k:'geysir',je:true,gt:2.0,gh:1.0,A:'weiss',B:'aqua'}},
  /* Dampf: Ruhe, zwei grosse Silberfontaenen aussen, Silberweiden im V */
  {n:6,gap:1.1,muster:'v',ang:0.40,eff:'glitzerweide',kal:'gross',boden:[{k:'riesen',x:-12,gt:6,A:'silber'},{k:'riesen',x:12,gt:6,A:'silber'}],pause:0.4},
  /* aktiv: 8 Ausbrueche, Saeulen faechern sich leicht auf, unten knistert der Boden */
  {n:40,je:5,gap:0.08,takt:[1.0,0.6,1.2],orte:[-12,6,-6,12,0,6,-12,-6],muster:'mitte',ang:0.25,hoehe:'steigend',hSpanne:22,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,th:'gold',
   boden:{k:'geysir',je:true,gt:1.6,A:'weiss'}},
  {mit:true,n:30,gap:0.22,muster:'zufall',ang:0.30,kal:'mini',pw:-9,eff:'tausend'},
  /* Kettenreaktion: 12 Ausbrueche in 5,4 s, ueberlappend */
  {n:60,je:5,gap:0.08,takt:[0.45],orte:[6,-12,0,12,-6,6,-12,0,12,-6,0,6],muster:'treppe',hoehe:'steigend',hSpanne:25,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,
   boden:{k:'geysir',je:true,gt:1.4,A:'weiss',B:'tuerkis'}},
  {mit:true,n:24,gap:0.2,muster:'x',ang:0.50,rohre:'breit',kal:'klein',eff:'spinne',farbe:1},
  /* FINALE Grosser Ausbruch: alle fuenf Saeulen gleichzeitig, fuenf Geysire.
     Muster 'mitte' mit kleinem Winkel statt 'treppe' (Katalog): die Saeulen
     oeffnen sich zum Schluss wie Kelche, und die Kettenreaktion davor ist
     schon 'treppe' - kein Muster zweimal hintereinander */
  {n:25,je:5,gap:0.08,takt:[0],orte:[-12,-6,0,6,12],muster:'mitte',ang:0.12,hoehe:'steigend',hSpanne:30,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,
   boden:{k:'geysir',je:true,gt:3,gh:1.4,A:'weiss',B:'aqua'},pause:5}
]);
SIGNATUR.geysirfeld={idee:'geysir',text:'Ausbruch am Boden, darüber eine Säule aus fünf Schüssen'};

/* Level 24: Weltuntergang */
SHOWS.finale=()=>show({basis:{pw:4.00,sz:1.320,th:'meteor'},rampe:{sz:[0.85,1.35],pw:[-2,4],hell:[0.60,1.45],kurve:'spaet'}},[
  /* Akt 1 Vorzeichen: dunkle Blueten, die erst glimmen und ploetzlich aufgehen; roter Horizont bis Akt 6 */
  /* 27.09.: gap 1,4 statt 2,4 und pw 5 statt 8 - vorher 30 s fast leerer Himmel
     zum Auftakt des groessten Produkts, und die Blueten lagen am oberen Bildrand */
  {n:12,gap:1.4,muster:'zufall',ang:0.40,pw:5,eff:'gamboge',th:'nacht',steig:'keiner',boden:{k:'bengal',gt:85,gh:0.25,A:'rot'},pause:1.0},
  /* Akt 2 Sternfall: Meteore, immer dichter */
  {n:30,gap:1.2,gapEnde:0.25,muster:'welle',ang:0.50,pw:5,eff:'meteor',kal:'klein',pause:1.2},
  /* Akt 2b Kometenhagel: harte Linien und Meteore im Zickzack */
  {n:40,gap:0.12,muster:'z',seg:3,ang:0.50,eff:['spinne','meteor'],kal:'mittel',steig:'komet',pause:1.5},
  /* Akt 3 Erdbeben: tief rumpelnd, Glut-Feuertoepfe, Flammen- und Vulkanfontaenen, oben fallen weiter Meteore */
  {n:36,gap:0.3,muster:'gerade',kal:'mini',pw:-10,eff:'tausend',mine:true,mineEff:'glut',
   boden:[{k:'feuerbrunnen',gt:11,x:-4},{k:'feuerbrunnen',gt:11,x:4},{k:'volcano',gt:11,A:'rot',B:'orange'}]},
  {mit:true,n:8,gap:1.35,muster:'aussen',ang:0.50,eff:'meteor',kal:'mittel',pause:0.3},
  /* Akt 4 Feuersturm: Kreuzfeuer ueber die ganze Breite, unten stuerzen Truemmer */
  {n:48,gap:0.2,muster:'x',ang:0.50,rohre:'breit',eff:['flammenregen','meteor','kamuro'],kal:'gross'},
  {mit:true,n:24,gap:0.4,muster:'v',ang:0.60,kal:'klein',pw:-4,eff:'kaskade',pause:1.0},
  /* Akt 5 Die grossen Brocken: vier Kugelbomben mit Meteor-Hauptbild und Flammen-Nachbruechen */
  {n:4,gap:2.5,muster:'gerade',bomb:4,bombEff:'meteor',bombStufen:[{t:1.2,eff:'flammenregen',n:4,kranz:0.29}],pause:1.5},
  /* Akt 6 Stille: nichts, nur der rote Horizont */
  {n:0,pause:3.0},
  /* Akt 7 Einschlag: 72 Meteore in 3,6 s von der Mitte nach aussen, weisse Feuertoepfe - dann der Weltenblitz */
  {n:72,gap:0.05,muster:'mitte',ang:0.60,eff:'meteor',kal:'gross',mine:true,mineEff:'silber'},
  {at:'ende',n:1,muster:'gerade',eff:'weltenblitz',kal:'riesig',pw:4,pause:1.0},
  /* Akt 8 Asche: glimmende Flocken sinken langsam, kein Knall */
  {n:25,gap:0.35,muster:'zufall',ang:0.60,pw:5,eff:'glutasche',kal:'mittel',steig:'keiner',pause:8}
]);
SIGNATUR.finale={eff:'meteor',text:'Meteore stürzen herab und schlagen ein'};

/* Level 25: Silvesternacht */
SHOWS.silvesternacht=()=>show({basis:{pw:4.50,sz:1.360,th:'gold'},rampe:{sz:[0.90,1.30],pw:[0,3],hell:[0.90,1.40],kurve:'spaet'}},[
  /* Vorabend: Goldfontaene und Tortenfontaene, dazu ein Roemisches Licht */
  {n:6,gap:1.2,muster:'zufall',ang:0.25,perle:true,th:'bunt',boden:[{k:'fountain',gt:10,A:'gold',x:-3},{k:'torte',gt:10,A:'silber',x:3}],pause:1.0},
  /* Raketen: vier hohe Einzelschuesse mit langem Goldschweif */
  {n:4,gap:1.6,muster:'mitte',ang:0.35,steig:'gold',fuse:2.2,eff:'chrys',kal:'mittel',pause:1.0},
  /* Tanz ins neue Jahr: kleine Batterie im V */
  {n:6,gap:0.4,muster:'v',ang:0.35,eff:'palme',farbe:1,pause:1.5},
  /* ZWOELF SCHLAEGE: senkrecht, im Glockentakt, weisses Leuchten am Boden */
  {n:12,gap:1.7,muster:'gerade',eff:'glockenschlag',kal:'gross',pw:4,steig:'keiner',boden:{k:'bengal',gt:20,A:'weiss'}},
  /* FINALE Mitternacht: beim 12. Schlag alles auf einmal, drei Riesenfontaenen */
  {at:'ende',n:12,gap:0.05,muster:'w',ang:0.60,eff:['kamuro','dahlie','brokat'],kal:'riesig',mine:true,mineEff:'gold',
   boden:[{k:'riesen',gt:5,x:-4},{k:'riesen',gt:5,x:0},{k:'riesen',gt:5,x:4}],pause:5.5}
]);
SIGNATUR.silvesternacht={eff:'glockenschlag',text:'zwölf Glockenschläge bis Mitternacht'};

/* Level 25: Lichtgitter */
SHOWS.himmelsfaecher=()=>show({basis:{pw:4.55,sz:1.365,th:'laser'},rampe:{sz:[0.90,1.30],pw:[0,3],hell:[0.95,1.40],kurve:'linear'}},[
  /* erster Strahl, gruenes Leuchten am Boden */
  {n:6,gap:2.0,x:0,muster:'gerade',eff:'rohrkomet',art:'laser',boden:{k:'bengal',gt:12,A:'gruen'},pause:1.0},
  /* Rauten: Kreuzfeuer aus der ganzen Breite, Farbe je Seite */
  {n:24,gap:0.4,muster:'x',ang:0.50,rohre:'breit',eff:'rohrkomet',art:'laser',farbVert:'seite',pause:1.2},
  /* Knoten: Laser kreuzen sich, an den Kreuzungen Spinnen, zwei Fontaenen */
  {n:20,gap:0.7,muster:'w',ang:0.45,eff:'spinne',farbe:1},
  {mit:true,n:20,gap:0.7,muster:'x',ang:0.50,rohre:'breit',eff:'rohrkomet',art:'laser',boden:[{k:'fountain',x:-10,gt:14,A:'tuerkis'},{k:'fountain',x:10,gt:14,A:'tuerkis'}],pause:1.0},
  /* Gitter: drei Module, je Modul ein V, fuenf Sechser-Salven */
  {n:30,je:6,takt:[0.9],x:[-10,0,10],muster:'v',ang:0.45,eff:'rohrkomet',art:'laser',pause:1.4},
  /* Ruhe im Netz: Wasserfall mitten in der Show, oben Kronleuchter, unten kleine Blinker */
  {n:12,gap:1.5,muster:'gerade',eff:'kronleuchter',kal:'gross',boden:{k:'wasserfall',gt:20,A:'silber'}},
  {mit:true,n:12,gap:1.5,muster:'zufall',ang:0.35,kal:'mini',pw:-7,eff:'strobe',pause:0.8},
  /* Gangwechsel: das Netz verdichtet sich, Feuertoepfe */
  {n:30,gap:0.1,muster:'x',ang:0.55,rohre:'breit',eff:['rohrkomet','spinne'],art:'laser',mine:true,mineEff:'farbe',pause:1.4},
  /* FINALE Netz zieht sich zu: zwei Zwoelfer-Salven Laser von beiden Seiten, Riesen-Dahlien im Kreuzungspunkt */
  {n:24,je:12,takt:[0.8],x:[-10,10],muster:'schlag',ang:0.65,eff:'rohrkomet',art:'laser',kal:'gross'},
  {mit:0.6,n:2,gap:0.8,muster:'gerade',eff:'dahlie',kal:'riesig',pw:4,boden:[{k:'riesen',x:-10,gt:4},{k:'riesen',x:0,gt:4},{k:'riesen',x:10,gt:4}],pause:5}
]);
SIGNATUR.himmelsfaecher={idee:'gitter',text:'Laserkometen aus drei Positionen spannen ein Netz'};

/* Level 26: Finale Grande */
SHOWS.kugelfinale=()=>show({basis:{pw:5.00,sz:1.400,th:'tricolore'},rampe:{sz:[0.95,1.30],pw:[0,3],hell:[0.90,1.40],kurve:'linear'}},[
  {n:0,boden:[{k:'bengal',gt:48,A:'gruen',x:-3},{k:'bengal',gt:48,A:'weiss',x:0},{k:'bengal',gt:48,A:'rot',x:3}],pause:1.5},
  /* Salutini (0,7 s: dritte Tempoklasse) */
  {n:3,gap:0.7,muster:'v',ang:0.30,kal:'mini',pw:-6,eff:'salut',pause:0.6},
  {n:1,muster:'gerade',bomb:3,bombEff:'mehrschlag',steig:'gold',schlaege:1,bombStufen:['dahlie'],pause:4},
  {n:4,gap:0.3,muster:'w',ang:0.35,kal:'mini',pw:-6,eff:'salut',pause:0.5},
  {n:1,muster:'gerade',bomb:3,bombEff:'mehrschlag',steig:'gold',schlaege:2,bombStufen:['chrys','weide'],pause:5},
  {n:5,gap:0.15,muster:'mitte',ang:0.35,kal:'mini',pw:-6,eff:'salut',pause:0.5},
  {n:1,muster:'gerade',bomb:4,bombEff:'mehrschlag',steig:'gold',schlaege:3,bombStufen:['pistill','brokat','strobe'],pause:6},
  {n:6,gap:0.12,muster:'aussen',ang:0.40,kal:'mini',pw:-6,eff:'salut',pause:0.5},
  {n:1,muster:'gerade',bomb:4,bombEff:'mehrschlag',steig:'gold',schlaege:4,bombStufen:['kamuro','dahlie','spinne','zeitregen'],pause:7},
  {n:8,gap:0.1,muster:'zufall',ang:0.40,kal:'mini',pw:-6,eff:'salut',pause:0.6},
  /* FINALE: fuenf Schlaege, der letzte ist der Schlussschlag */
  {n:1,muster:'gerade',bomb:5,bombEff:'mehrschlag',steig:'gold',schlaege:5,bombStufen:['dahlie','kronleuchter','brokat','glitzerweide','schlussschlag'],pause:8}
]);
SIGNATUR.kugelfinale={eff:'mehrschlag',text:'eins, zwei, drei, vier, fünf Schläge übereinander'};

/* Level 26: Wolkenkratzer (neu) - farbe 0..3 = Etage im Thema stadt */
SHOWS.wolkenkratzer=()=>show({basis:{pw:5.05,sz:1.405,th:'stadt'},rampe:{sz:[0.95,1.30],pw:[0,2],hell:[0.90,1.40],kurve:'frueh'}},[
  /* Fundament: vier goldene Fontaenen laufen die ganze Show */
  {n:0,boden:[{k:'fountain',x:-6,gt:36,A:'gold'},{k:'fountain',x:-2,gt:36,A:'gold'},{k:'fountain',x:2,gt:36,A:'gold'},{k:'fountain',x:6,gt:36,A:'gold'}],pause:1.5},
  /* 1. Etage: rote Feuertoepfe im Scheibenwischer */
  {n:24,gap:0.25,nurMine:true,mineEff:'farbe',muster:'wischer',seg:2,ang:0.40,farbe:1},
  /* 2. Etage kommt dazu (1. laeuft weiter) */
  {n:30,gap:0.3,muster:'w',ang:0.35,kal:'mittel',pw:-2,eff:['dahlie','chrys'],farbe:2},
  {mit:true,n:30,gap:0.2,nurMine:true,mineEff:'farbe',muster:'zufall',ang:0.30,farbe:1},
  /* Dach: blaue Kronleuchter im Penthouse, darunter beide Etagen dicht */
  {n:8,gap:1.1,muster:'gerade',kal:'riesig',pw:6,eff:'kronleuchter',farbe:3},
  {mit:true,n:40,gap:0.22,muster:'v',ang:0.35,kal:'mittel',pw:-2,eff:['palme','spinne'],farbe:2},
  {mit:true,n:40,gap:0.22,nurMine:true,mineEff:'farbe',muster:'x',ang:0.35,farbe:1},
  /* FINALE Alle Lichter an: alle Etagen maximal */
  {n:12,gap:0.25,muster:'mitte',ang:0.40,kal:'riesig',pw:6,eff:'dahlie',farbe:3},
  {mit:true,n:24,gap:0.12,muster:'z',seg:2,ang:0.40,kal:'mittel',eff:'brokat',farbe:2},
  {mit:true,n:24,gap:0.12,nurMine:true,mineEff:'farbe',muster:'welle',ang:0.40,farbe:1,boden:[{k:'riesen',x:-6,gt:3},{k:'riesen',x:6,gt:3}]},
  /* Flugwarnlicht: ganz oben, rot blinkend, ueber allem */
  {n:8,gap:0.4,muster:'gerade',kal:'klein',pw:14,eff:'strobe',th:'rotweiss',farbe:0,pause:5}
]);
SIGNATUR.wolkenkratzer={idee:'etagen',text:'vier Etagen, vier Farben, gleichzeitig'};

/* Tabelle SHOW_BASIS an die Drehbuecher angleichen: die Grundstufe steht
   jetzt im Drehbuch (basis) und steigt mit dem Level. 14c hat seine
   Werte (neuBasis) vorher schon aus der alten Tabelle gerechnet. */
['faecher','silberwirbel','sternenmeer80','familienmix','hagelsturm','regenbogenfaecher','zfaecher','batterie100','kreuzfeuer','lichterkugeln',
 'donnerschlag','goldenerregen','kometen','hochzeitsfaecher','donnerwand','feuerpfau','hexenkessel','blitzgewitter60','nordlicht','goldregen22',
 'pfeifkonzert','profi','kometenwand','sternenkaiser','geysirfeld','finale','silvesternacht','himmelsfaecher','kugelfinale','wolkenkratzer'].forEach(t=>{
  const b=SHOWS[t]&&SHOWS[t]().basis; if(b) SHOW_BASIS[t]={pw:b.pw,sz:b.sz,th:b.th}; });

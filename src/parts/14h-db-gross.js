/* =========================================================
   Drehbuecher der Show-Produkte ab Level 16 und Spektakel-Batterien
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Katalog: katalog-shows-gross.md. Hier stehen
   - die Bruchbilder dieser Kategorie (farfalle, silberwelle,
     donnerblitz, kreuzkomet, donnerkette, blinkchrys, polarlicht,
     meteor, gamboge, weltenblitz, glutasche, kaleidoskop, glockenschlag,
     hagel, rohrkomet, vorhang, blinkkugel) und der Silber-Rossschweif
   - die 30 Drehbuecher (26 alte Produkte neu, 4 Spektakel-Batterien)
   - SIGNATUR je Produkt
   28.09. (Tom: "sieht aus wie Lichttechnik, nicht wie Pyro - Laser,
   Punkte, Farben zu durcheinander"; Regeln /tmp/fw/echt.md): jeder
   Bruch ist ein echter Feuerwerkseffekt - Sterne fliegen ballistisch,
   verglimmen und verloeschen einzeln; keine stehenden Punkte, Linien,
   Lichtbaender, Nebelscheiben, Bildschirmblitze. Je Produkt ein
   Farbthema, je Phase ein Paar. Weg: blitzast, lauflicht, knallring,
   rohrkomet laser, Vollbild-Weltenblitz, Meteor-Einschlaege.
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
/* 28.09., Tom: echt - Bruchlicht gedaempft wie alle Batterieschuesse (SHOW_BLITZ, 14b) */
function grOhneZutaten(r,flash){ if(r) r.bruchOpt=Object.assign({},r.bruchOpt||{},{kern:false,nachglitzer:false},flash!==undefined?{flash:typeof flash==='number'?flash*SHOW_BLITZ:flash}:{}); }

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

/* Silberwelle (Silberbrandung): Silberchrysantheme, deren Sterne nach
   0,7 s kurz dunkel werden und tuerkis weiterbrennen - echte
   "Chrysantheme zu Farbe" mit Dunkelphase. Die Sterne fliegen dabei
   weiter und verloeschen einzeln (28.09., Tom: echt). Vorher hielten alle
   an, standen 1,2 s als Perlen und gingen zugleich aus (Lichtshow). */
EFF.silberwelle=function(p,A,B,s,r){
  grOhneZutaten(r);
  const q=QUAL(), n=Math.round(rand(70,90)*s*q), T=0.7, g=2.4, st=[], tag=FW_TAG;
  const gl=[.9,.94,1], perle=grWeiss(A,0.08);
  /* 28.09., Tom: "Laser" - kurze Flamme plus Silberfunken (funkenFaden) statt 0,32 s Strich */
  grSpur(0.12,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(8.5,10.5)*s, v=[d[0]*w,d[1]*w,d[2]*w], tz=T*rand(0.9,1.1);
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],gl[0]*1.15,gl[1]*1.15,gl[2]*1.15,tz,g,4); st.push([v,tz]); } });
  funkenFaden(p,st.map(([v,L])=>({v,L})),g,[.85,.88,.95],0.35);
  /* nach der Dunkelphase (0,06-0,12 s) brennt jeder Stern tuerkis weiter */
  for(const [v,tz] of st){ const td=tz+rand(0.06,0.12);
    imBild(td,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(p,v,g,td), w=bahnTempo(v,g,td);
      grSpur(0.22,()=>psBig.emit(o.x,o.y,o.z,w[0],w[1],w[2],perle[0]*1.3,perle[1]*1.3,perle[2]*1.3,rand(0.9,1.4),g,0)); FW_TAG=alt; }); }
  schall(p,v=>later(0.2,()=>sfx.zischen(v*0.8,1.0)));
};

/* Donnerblitz (Blitzgewitter): Titan-Salut mit Blinksternen - ein
   greller Weissblitz, harte Silberfunken fliegen weit, dann flackern
   weisse Blinksterne einzeln nach und sinken; Knall und Donner. So sieht
   ein echter "Thunder Strobe" aus (28.09., Tom: echt). Vorher: gezackte
   Blitzlinien aus stehenden Punkten mit violettem Nachbild (Lichtshow). */
EFF.donnerblitz=function(p,A,B,s,r){
  grOhneZutaten(r,false); if(r) r.knall='still';
  const q=QUAL(), k=clamp(s,0.6,1.4);
  grSpur(0,()=>{ for(let j=0;j<2;j++) psHuge.emit(p.x,p.y,p.z,0,0,0,2,2,2,0.06+j*0.03,0,0); });
  /* Titanfunken: schnell, kurz, koernig */
  grSpur(0.16,()=>{ for(let i=0;i<Math.round(110*q*k);i++){ const d=randDir(), w=rand(9,16)*s; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1.25,1.25,1.3,rand(0.45,0.9),3,4); } });
  /* Blinksterne: jeder in seinem Takt (Modus 1) mit kurzem Schweif, sie
     fallen (28.09.: vorher hingen sie 2 s als Punkte ohne Schweif) */
  grSpur(0.16,()=>{ for(let i=0;i<Math.round(26*q*k);i++){ const d=randDir(), w=rand(4.5,7.5)*s, c=i%4?WEISS:grWeiss(A,0.4); psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0]*1.3,c[1]*1.3,c[2]*1.3,rand(0.9,1.4),2.6,1); } });
  flash(p,[.85,.9,1],5+4*s,0.2);
  schall(p,v=>{ sfx.boom(Math.min(1.6,v*1.4)); sfx.crack(v); later(0.25,()=>sfx.donner(v*0.8)); });
  shake=Math.max(shake,Math.min(1,0.6*distVol(p)));
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
    /* 28.09.: Kopf psBig - als psHuge stand er am Zuendtisch als weisser Leuchtball ueber dem Karton */
    grSpur(0,()=>{ psBig.emit(x,y,z,0,0,0,kopf[0]*1.6,kopf[1]*1.6,kopf[2]*1.6,0.05,0,0); });
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
  flash(p,[1,1,1],(2.5+1.5*s)*0.5,0.18);   /* 28.09.: Kreuzteilung ist ein kleiner Knall, kein Salut */
  schall(p,v2=>{ sfx.crack(v2*1.3); later(0.03,()=>sfx.crack(v2*0.8)); });
  for(let k=0;k<4;k++){ const a=roll+k*Math.PI/2, d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
    const w=rand(10,14)*Math.sqrt(s), vel=[d[0]*w+vk[0]*0.25,d[1]*w+vk[1]*0.25,d[2]*w+vk[2]*0.25];
    /* 28.09., Tom: "Laser" - die Leuchtspur nur als kurze Flamme, den
       Schweif tragen die Funken (funkenSchweif); mit 0,3 s zog jedes
       Stueck einen geraden weissen Strich */
    grSpur(0.14,()=>{ psBig.emit(p.x,p.y,p.z,vel[0],vel[1],vel[2],stB[0]*1.5,stB[1]*1.5,stB[2]*1.5,split>1?0.52:0.9,3,0);
      for(let i=0;i<3;i++){ const e=streu(d,0.03), ww=w*rand(0.93,1); psBig.emit(p.x,p.y,p.z,e[0]*ww+vk[0]*0.25,e[1]*ww+vk[1]*0.25,e[2]*ww+vk[2]*0.25,stB[0],stB[1],stB[2],split>1?0.52:rand(0.8,0.9),3,0); } });
    funkenSchweif(p,vel,3,split>1?0.5:0.85,2,B);
    if(split>1) later(0.5,()=>{ const o=bahnOrt(p,vel,3,0.5), w2=bahnTempo(vel,3,0.5), l=Math.hypot(w2[0],w2[1],w2[2])||1, dn=[w2[0]/l,w2[1]/l,w2[2]/l];
      const [a1]=quer(dn); schall(o,v2=>sfx.crack(v2*0.6));
      grSpur(0.22,()=>{ for(const sg of [-1,1]){ const vv=[w2[0]*0.5+a1[0]*6*sg,w2[1]*0.5+a1[1]*6*sg,w2[2]*0.5+a1[2]*6*sg];
        psBig.emit(o.x,o.y,o.z,vv[0],vv[1],vv[2],A[0]*1.4,A[1]*1.4,A[2]*1.4,0.6,3,0);
        for(let i=0;i<2;i++) psBig.emit(o.x,o.y,o.z,vv[0]*rand(.9,1),vv[1]*rand(.9,1),vv[2]*rand(.9,1),A[0],A[1],A[2],0.55,3,0); } }); });
  }
}

/* Kreuzstern (Crossette der Batterien, 28.09., Tom: echt): 8-12 Kometen
   mit Goldschweif fliegen aus, nach 0,45-0,6 s knackt jeder und teilt
   sich in vier Stuecke, die mit Schwung weiterfliegen (6-8 m/s) und
   einen koernigen Schweif ziehen - ein Gitter aus Kreuzen. Die Crossette
   der Bibliothek warf die Stuecke nur 3-4 m/s weit: kleine Kleeblaetter
   mit Lichthof um den Kometenkopf (Bild pfeifkonzert). Kopf A, Stuecke B. */
EFF.kreuzstern=function(p,A,B,s,r){
  grOhneZutaten(r,0.5);
  const q=QUAL(), arme=8+Math.floor(Math.random()*5), G=3, kopf=grWeiss(A,0.2), stB=grWeiss(B,0.1);
  for(let a=0;a<arme;a++){
    const d=randDir(), sp=rand(8,9.5)*s, v=[d[0]*sp,d[1]*sp,d[2]*sp], tz=rand(0.45,0.6);
    grSpur(0.12,()=>{ for(let i=0;i<2;i++) psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],kopf[0]*1.3,kopf[1]*1.3,kopf[2]*1.3,tz,G,0); });
    funkenSchweif(p,v,G,tz,3,[1,.72,.3]);
    later(tz,()=>{ const o=bahnOrt(p,v,G,tz), vr=bahnTempo(v,G,tz), [u1,u2]=quer(d), roll=Math.random()*Math.PI*2, st=[];
      grSpur(0,()=>psMid.emit(o.x,o.y,o.z,0,0,0,1.3,1.3,1.3,0.05,0,0));
      grSpur(0.1,()=>{ for(let k=0;k<4;k++){ const e=roll+k*Math.PI/2, ce=Math.cos(e), se=Math.sin(e), w=rand(6,8)*s;
        const vv=[vr[0]*0.5+(u1[0]*ce+u2[0]*se)*w,vr[1]*0.5+(u1[1]*ce+u2[1]*se)*w,vr[2]*0.5+(u1[2]*ce+u2[2]*se)*w], L=rand(0.8,1.1);
        psBig.emit(o.x,o.y,o.z,vv[0],vv[1],vv[2],stB[0]*1.2,stB[1]*1.2,stB[2]*1.2,L,G,0); st.push({v:vv,L}); } });
      funkenFaden(o,st,G,[1,.75,.35],0.6,[0.25,0.5]); }); }
  later(0.5,()=>sfx.crackle(distVol(p)*0.7));
};

/* Donnerkette (Donnerschlag): Knallbombe - der Zerleger wirft 8-12
   Knallkoerper in alle Richtungen, sie detonieren kurz nacheinander an
   zufaelligen Orten (Blitz, Silberfunken, scharfer Knall), zum Schluss
   der grosse Schlag in der Mitte: ta-ta-ta-ta-BUMM (28.09., Tom: echt).
   Vorher lagen die Knaller auf einem Kreis und flogen als gluehende
   Punkte dorthin. */
EFF.donnerkette=function(p,A,B,s,r){
  grOhneZutaten(r); if(r) r.knall='still';
  const q=QUAL(), n=Math.round(rand(8,12)), R=rand(5,8)*Math.min(1.25,s/1.1), tag=FW_TAG, orte=[];
  let t=0.22;
  for(let k=0;k<n;k++){ const d=randDir(), f=R*Math.cbrt(rand(0.2,1)); t+=rand(0.04,0.12); orte.push([{x:p.x+d[0]*f,y:p.y+d[1]*f*0.8,z:p.z+d[2]*f},t]); }
  orte.forEach(([o,tk],k)=>later(tk,()=>{ const alt=FW_TAG; FW_TAG=tag;
    grSpur(0.06,()=>{ psHuge.emit(o.x,o.y,o.z,0,0,0,1.8,1.8,1.8,0.045,0,0);
      for(let i=0;i<Math.round(14*q);i++){ const d=randDir(), w=rand(5,9), c=i%4?[.92,.95,1]:A; psMid.emit(o.x,o.y,o.z,d[0]*w,d[1]*w,d[2]*w,c[0]*1.2,c[1]*1.2,c[2]*1.2,rand(0.2,0.4),2,4); } });
    if(k%2===0) flash(o,[1,1,1],2.4,0.07);
    schall(o,v2=>{ sfx.crack(v2*1.25); tone(rand(140,180),0.05,'sine',0.1*v2,60); });
    FW_TAG=alt; }));
  /* Mittelschlag */
  later(t+0.25,()=>{ const alt=FW_TAG; FW_TAG=tag;
    grSpur(0.1,()=>{ for(let k=0;k<3;k++) psHuge.emit(p.x,p.y,p.z,rand(-.3,.3),rand(-.3,.3),rand(-.3,.3),1.9,1.9,1.9,0.1+k*0.03,0,0);
      for(let i=0;i<Math.round(150*q*s);i++){ const d=randDir(), w=rand(4,11)*s; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.97,.9,rand(0.4,0.9),1.5,4); } });
    flash(p,[1,1,1],(6+3*s),0.35); shake=Math.max(shake,0.35*distVol(p));
    schall(p,v2=>{ sfx.boom(v2*1.35); sfx.crack(v2*1.1); });
    FW_TAG=alt; });
};

/* Blinkchrysantheme (Sternblinken): Silberchrysantheme, deren Sterne
   nach kurzer Dunkelphase zu Blinksternen werden - jeder blinkt in
   seinem eigenen Takt, sinkt langsam und verlischt fuer sich (echte
   "Chrysanthemum to Strobe", 28.09., Tom: echt). modus 'farbe': die
   Blinker in Farbe A. Vorher: eine stehende Punktwolke, durch die ein
   Lichtband lief (Lauflicht). */
EFF.blinkchrys=function(p,A,B,s,r){
  grOhneZutaten(r);
  const q=QUAL(), par=(r&&r.par)||{}, n=Math.round(rand(90,120)*Math.min(1.25,s)*q), T=rand(0.65,0.85), g=2.6, tag=FW_TAG;
  const sil=[.9,.94,1], bl=par.modus==='farbe'?grWeiss(A,0.25):WEISS, st=[];
  /* 28.09., Tom: "Laser" - kurze Flamme plus Titanfunken (funkenFaden) statt 0,35 s Strich */
  grSpur(0.12,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(7.5,9.5)*s, v=[d[0]*w,d[1]*w,d[2]*w], tz=T*rand(0.9,1.1);
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],sil[0],sil[1],sil[2],tz,g,4); st.push([v,tz]); } });
  funkenFaden(p,st.map(([v,L])=>({v,L})),g,[.85,.88,.95],0.35);
  for(const [v,tz] of st){ const td=tz+rand(0.06,0.12);
    imBild(td,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(p,v,g,td), w=bahnTempo(v,g,td);
      grSpur(0.18,()=>psMid.emit(o.x,o.y,o.z,w[0],w[1],w[2],bl[0]*1.5,bl[1]*1.5,bl[2]*1.5,rand(1.1,1.7),2.4,1)); FW_TAG=alt; }); }   /* 28.09.: psMid - als psBig blinkten weiche Leuchtbaelle (Bild), echte Blinker sind Lichtpunkte */
  later(T,()=>sfx.crackle(distVol(p)*0.35));
};

/* Polarlicht (Nordlicht): Silberweide mit gruenen Spitzen, die nach
   einer Dunkelphase violett werden - lange, langsam fallende Silber-
   faeden mit farbigen Koepfen, ein Vorhang wie Nordlicht, aber aus echten
   Funken (Weide mit Farbwechselspitzen, 28.09., Tom: echt). Vorher: ein
   Kamm aus senkrechten Strichen, die 8 s standen und wehten (Lichtshow). */
EFF.polarlicht=function(p,A,B,s,r){
  grOhneZutaten(r,0.5);
  const q=QUAL(), n=Math.round(rand(80,105)*Math.min(1.3,s)*q), G=4.4, tag=FW_TAG, sil=[.82,.88,.95];
  const cA=grWeiss(A,0.05), cB=grWeiss(B,0.1);
  /* 28.09., Tom: "Laser" - die Weidenfaeden aus Funken, die haengen und
     einzeln verloeschen (funkenFaden), statt 1,5 s langer glatter Striche */
  const fd=[];
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(4.5,6.8)*s, v=[d[0]*w,d[1]*w*0.8+1.4,d[2]*w], L=rand(3.4,4.4), tw=rand(1.4,1.9);
    grSpur(0.3,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],sil[0],sil[1],sil[2],L,G,4)); fd.push({v,L});
    if(i%2) continue;
    /* farbige Spitze auf derselben Bahn: gruen, kurz dunkel, dann violett */
    const v2=[v[0]*1.01,v[1]*1.01,v[2]*1.01], tv=tw+rand(0.08,0.14);
    grSpur(0,()=>psBig.emit(p.x,p.y,p.z,v2[0],v2[1],v2[2],cA[0]*1.2,cA[1]*1.2,cA[2]*1.2,tw,G,0));
    imBild(tv,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(p,v2,G,tv), w2=bahnTempo(v2,G,tv);
      grSpur(0,()=>psBig.emit(o.x,o.y,o.z,w2[0],w2[1],w2[2],cB[0]*1.2,cB[1]*1.2,cB[2]*1.2,rand(1.0,1.6),G,0)); FW_TAG=alt; }); }
  funkenFaden(p,fd,G,[.72,.76,.82],0.12,[0.8,1.4]);
};

/* Meteor (Weltuntergang): Kometenbombe - der Zerleger wirft 5-9 schwere
   Kometen seitlich und schraeg nach unten; jeder zieht einen dicken
   Glutschweif aus Kohlefunken, zerbricht manchmal in zwei Brocken und
   verlischt hoch ueber dem Boden. Als Kugelbombe 12-16 Kometen
   (28.09., Tom: echt). Vorher schlugen sie im Feld ein - der Einschlag-
   Emitter lag bis 17 m neben dem Produkt am Boden. */
const METEOR={koepfe:0};
EFF.meteor=function(p,A,B,s,r){
  grOhneZutaten(r,0.6); if(r) r.knall='wumms';
  const q=QUAL(), bomb=!!(r&&r.kugel), n=Math.round(bomb?rand(12,16):rand(5,9)*Math.min(1.2,s));
  const kopfC=grWeiss(B,0.55), glut=[1,.62,.2], dunkel=[.32,.05,.02], K=[];
  const neuKopf=(o,v,gr)=>K.push({p:[o[0],o[1],o[2]],v,gr,zerf:rand(0.5,1.2),aus:rand(1.8,2.8),acc:0,tot:false,t:0});
  for(let k=0;k<n;k++){ const az=rand(0,Math.PI*2), el=rand(-0.5,0.35), w=rand(9,14)*Math.min(1.3,Math.sqrt(s))*(bomb?1.15:1);
    neuKopf([p.x,p.y,p.z],[Math.cos(az)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(az)*Math.cos(el)*w],rand(0.8,1.2)*Math.min(1.4,s)); }
  METEOR.koepfe+=K.length;
  grSpur(0.1,()=>{ for(let i=0;i<Math.round(30*q);i++){ const d=randDir(), w=rand(2,5); psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.5,.15,rand(0.3,0.6),2,0); } });
  grTakt('meteor',4,(e,dt)=>{ let da=0; const last=Math.min(1,26/Math.max(1,METEOR.koepfe));
    for(let i=0;i<K.length;i++){ const h=K[i]; if(h.tot) continue; h.t+=dt;
      /* ballistisch wie ein schwerer Stern: Luftwiderstand und Schwere */
      const f=Math.exp(-0.55*dt); h.v[0]*=f; h.v[2]*=f; h.v[1]=h.v[1]*f-5.5*dt;
      for(let k=0;k<3;k++) h.p[k]+=h.v[k]*dt;
      const [x,y,z]=h.p;
      /* 30.09.: unter 5 m verglueht der Kopf - vorher schlug er vor dem
         Zuendpult auf und zog seine Glut durch die Spielfigur (bodenabstand.js) */
      if(h.t>h.aus||(y<5&&h.v[1]<0)){ h.tot=true; METEOR.koepfe=Math.max(0,METEOR.koepfe-1);
        grSpur(0.05,()=>{ for(let j=0;j<Math.round(8*q);j++){ const d=randDir(); psMid.emit(x,y,z,d[0]*2+h.v[0]*0.2,d[1]*2,d[2]*2+h.v[2]*0.2,glut[0],glut[1],glut[2],rand(0.2,0.4),3,0); } });
        continue; }
      da++;
      /* Zerfall: manchmal bricht ein Brocken ab und fliegt eigene Bahn */
      if(h.gr>0.7&&h.t>h.zerf){ h.zerf=99; h.gr*=0.7;
        neuKopf(h.p,[h.v[0]+rand(-2,2),h.v[1]+rand(-1.5,1),h.v[2]+rand(-2,2)],h.gr*rand(0.8,1)); METEOR.koepfe++;
        schall({x,y,z},v=>sfx.crack(v*0.5)); }
      const fade=Math.min(1,(h.aus-h.t)/0.4);
      /* Kopf: kompakt (psBig) - als psHuge mit Lichtkreuz wirkte er wie ein Scheinwerfer (28.09.) */
      grSpur(0,()=>{ psBig.emit(x,y,z,0,0,0,kopfC[0]*1.6*h.gr*fade,kopfC[1]*1.5*h.gr*fade,kopfC[2]*1.3*h.gr*fade,0.05,0,0); });
      /* Glutschweif: feine Kohlefunken, die von Orange nach Dunkelrot verglimmen
         (28.09.: psMid statt psBig - grosse Glutscheiben wirkten nah wie Bokeh) */
      h.acc+=dt*170*q*last*Math.max(0.5,h.gr)*fade;
      grSpur(0.08,()=>{ for(;h.acc>=1;h.acc--){ const fr=Math.random(), c=Math.random()<0.6?A:glut;
        psMid.emit(x-h.v[0]*dt*fr+rand(-.12,.12),y-h.v[1]*dt*fr+rand(-.12,.12),z-h.v[2]*dt*fr+rand(-.12,.12),h.v[0]*0.05+rand(-.5,.5),h.v[1]*0.05+rand(-.6,.3),h.v[2]*0.05+rand(-.5,.5),
          c[0]*1.3,c[1]*1.2,c[2]*1.1,rand(0.6,1.1),1.2,2,dunkel[0],dunkel[1],dunkel[2]); } }); }
    return da>0; });
  schall(p,v=>rauschF({dur:1.6,vol:0.22*v,typ:'bandpass',f:900,f2:220,q:0.8,an:0.15}));
};

/* Gamboge (Weltuntergang, Akt 1): gedaempfter Bruch, 0,6-0,9 s nur
   dunkelrote Glimmspuren - dann steht die ganze Bluete schlagartig da,
   0,8 s, und alles verlischt zugleich. Kein Knall beim Erscheinen. */
EFF.gamboge=function(p,A,B,s,r){
  grOhneZutaten(r,0.12); if(r) r.knall='dumpf';
  /* 28.09., Tom: echt - die dunklen Sterne ziehen sichtbare Kohlefaeden
     (vorher unsichtbar: 15 s leerer Himmel zum Auftakt), sie zuenden
     innerhalb von 0,25 s nacheinander und verloeschen jeder fuer sich
     (vorher alle im selben Bild an und aus - synchron wie Licht) */
  const q=QUAL(), n=Math.round(rand(60,80)*s*q), Tz=rand(0.6,0.9), g=2.2, st=[], hell=[], tag=FW_TAG;
  grSpur(0.1,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(9.5,11.5)*s, v=[d[0]*w,d[1]*w,d[2]*w], t1=Tz+rand(-0.1,0.15); st.push([v,t1]);
    psMid.emit(p.x,p.y,p.z,v[0],v[1],v[2],.5,.16,.04,t1,g,0); } });
  funkenFaden(p,st.map(([v,L])=>({v,L})),g,[.55,.2,.05],0.3,[0.3,0.6]);
  st.forEach(([v,t1],i)=>imBild(t1,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(p,v,g,t1), w=bahnTempo(v,g,t1), c=i%6?A:grWeiss(A,0.5);
    hell.push(grStern(psBig,o.x,o.y,o.z,w[0],w[1],w[2],[c[0]*1.4,c[1]*1.4,c[2]*1.4],rand(0.55,1.1),g,0,0.14)); FW_TAG=alt; }));
  /* 28.09.: alle Sterne psBig (vorher jeder vierte psHuge mit Lichtkreuz -
     grosse Leuchtpunkte), Blitz halb so stark (faerbte die Haeuser rot) */
  imBild(Tz+0.16,()=>{ const alt=FW_TAG; FW_TAG=tag; grHalten('gamboge',hell,0.9); flash(p,A,(1.5+1.5*s)*SHOW_BLITZ,0.4); FW_TAG=alt; });
};

/* Weltenblitz (Weltuntergang, Schlussschlag): eine Traube aus Titan-
   Saluten - fuenf bis sieben grelle Schlaege in einer halben Sekunde, eine
   weisse Titanfunkenwolke, tiefer Schlag mit Echo, Wackeln. Danach ist es
   einfach vorbei (28.09., Tom: echt). Vorher: Vollbild-Weiss und alle
   Sterne der Show geloescht ("Stromausfall", Lichtshow). */
EFF.weltenblitz=function(p,A,B,s,r){
  grOhneZutaten(r,false); if(r) r.knall='weltdonner';
  const q=QUAL(), tag=FW_TAG, m=5+Math.floor(Math.random()*3);
  let t=0;
  for(let k=0;k<m;k++){ later(t,()=>{ const alt=FW_TAG; FW_TAG=tag; const d=randDir(), f=rand(0,4)*s, o={x:p.x+d[0]*f,y:p.y+d[1]*f*0.6,z:p.z+d[2]*f};
      grSpur(0,()=>{ psHuge.emit(o.x,o.y,o.z,0,0,0,2,2,2,0.07,0,0); });
      grSpur(0.1,()=>{ for(let i=0;i<Math.round(60*q);i++){ const e=randDir(), w=rand(10,17)*s; psMid.emit(o.x,o.y,o.z,e[0]*w,e[1]*w,e[2]*w,1.25,1.25,1.3,rand(0.35,0.7),3,4); } });
      flash(o,[1,1,1],6+3*s,0.2); FW_TAG=alt; });
    t+=rand(0.06,0.11); }
  shake=Math.max(shake,1.1*Math.max(0.6,distVol(p)));
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

/* Kaleidoskop (Kaleidoskop): Wechselpistill - aussen eine Kugel in A,
   innen ein Pistill in B; nach einer Dunkelphase tauschen beide die
   Farbe (aussen B, innen A), wie ein Kaleidoskop, das sich dreht. Zwei
   Farben, echte Farbwechselsterne; als Kugelbombe groesser und dichter
   (28.09., Tom: echt). Vorher: zwoelf Farbinseln in vier Farben auf den
   Ecken eines Ikosaeders. */
EFF.kaleidoskop=function(p,A,B,s,r){
  grOhneZutaten(r,0.9);
  const q=QUAL(), bomb=!!(r&&r.kugel), g=2.4, tag=FW_TAG, T=rand(0.95,1.1);
  const lagen=[[A,B,bomb?140:100,9.5,11],[B,A,bomb?60:42,3.4,4.4]];
  for(const [c1,c2,n0,v0,v1] of lagen){ const n=Math.round(n0*s*q);
    for(let i=0;i<n;i++){ const d=randDir(), w=rand(v0,v1)*s, v=[d[0]*w,d[1]*w,d[2]*w], t1=T*rand(0.92,1.06), t2=t1+rand(0.07,0.12);
      grSpur(0.14,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c1[0]*1.15,c1[1]*1.15,c1[2]*1.15,t1,g,0));
      imBild(t2,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(p,v,g,t2), w2=bahnTempo(v,g,t2);
        grSpur(0.2,()=>psBig.emit(o.x,o.y,o.z,w2[0],w2[1],w2[2],c2[0]*1.15,c2[1]*1.15,c2[2]*1.15,rand(0.8,1.2),g,0)); FW_TAG=alt; }); } }
};

/* Glockenschlag (Silvesternacht): Titansalut - Weissblitz, eine kurze
   dichte Silberwolke und harte Titanfunken ringsum, dazu der tiefe
   Glockenschlag statt des Knalls. 28.09. (Tom: echt): ohne den flachen
   Silberring, der sich wie ein Schallring weitete. */
EFF.glockenschlag=function(p,A,B,s,r){
  if(r){ r.bruchOpt=Object.assign({},r.bruchOpt||{},{nachglitzer:false}); r.knall='dong'; }
  const q=QUAL();
  grSpur(0.05,()=>{ for(let k=0;k<3;k++) psHuge.emit(p.x,p.y,p.z,0,0,0,1.9,1.9,1.9,0.1+k*0.04,0,0);
    for(let i=0;i<Math.round(40*q);i++){ const d=randDir(), w=rand(2.5,6.5); psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,.95,.97,1.05,rand(0.4,0.8),1.2,4); } });
  grSpur(0.12,()=>{ for(let i=0;i<Math.round(110*q*clamp(s,0.7,1.4));i++){ const d=randDir(), w=rand(9,14)*s; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1.15,1.15,1.2,rand(0.35,0.6),2.5,4); } });
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
   28.09. (Tom: "Laser"): die Art laser - eine gerade, gleissende Linie
   in A, die als Nachbild stehen blieb - ist gestrichen; Lichtgitter
   schiesst Titan- und Glitzerkometen. */
SCHUSS_EFF.rohrkomet=function(r){
  const art=(r.par&&r.par.art)||'gold', q=QUAL(), A=r.A, P0={x:r.p.x,y:r.p.y,z:r.p.z};
  const T=r.fuse, st={p:[P0.x,P0.y,P0.z],v:[r.v.x,r.v.y,r.v.z]}, s=r.size||1;
  const kopf=art==='farbe'?grWeiss(A,0.2):art==='silber'?[1,1,1]:[1,.86,.55], gold=[1,.66,.24];
  grTakt('rohrkomet',T+0.05,(e,dt)=>{
    if(e.alter>=T){ const [x,y,z]=st.p; grSpur(0.05,()=>{ for(let i=0;i<Math.round(12*q);i++){ const d=randDir(); psMid.emit(x,y,z,d[0]*2+st.v[0]*0.2,d[1]*2+st.v[1]*0.2,d[2]*2+st.v[2]*0.2,kopf[0],kopf[1],kopf[2],rand(0.2,0.4),2,0); } }); return false; }
    st.v[1]-=6*dt; for(let k=0;k<3;k++) st.p[k]+=st.v[k]*dt;
    const [x,y,z]=st.p, v=st.v, lf=e.alter/T, hk=1.5*(1-0.45*lf)*Math.min(1.3,Math.sqrt(s));
    grSpur(0,()=>{ psBig.emit(x,y,z,0,0,0,kopf[0]*hk*1.2,kopf[1]*hk*1.2,kopf[2]*hk*1.2,0.05,0,0); });   /* 28.09.: psBig statt Leuchtball (Bodenbild) */
    const ort=()=>{ const f=Math.random(); return [x-v[0]*dt*f,y-v[1]*dt*f,z-v[2]*dt*f]; };
    if(art==='gold'||art==='farbe'){
      e.acc=(e.acc||0)+dt*(art==='gold'?260:170)*q;
      /* 28.09.: zwei Drittel der Glut als feine Funken (psMid) - nur psBig
         lag am Zuendtisch als Kette grosser Goldkugeln ueber dem Karton */
      grSpur(0.1,()=>{ for(;e.acc>=1;e.acc--){ const o=ort(), fein=Math.random()<0.67, ps=fein?psMid:psBig, h=fein?1.3:1; ps.emit(o[0]+rand(-.1,.1),o[1]+rand(-.1,.1),o[2]+rand(-.1,.1),v[0]*0.04+rand(-.35,.35),v[1]*0.04+rand(-.5,.15),v[2]*0.04+rand(-.35,.35),gold[0]*h,gold[1]*h,gold[2]*h,rand(0.9,1.7),0.9,4); } });
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
/* Rossschweif (Schimmelreiter), Anpassung laut Katalog: Farbe aus A/B
   statt fest Gold, 60-80 dicke Sterne, sie steigen nach dem Ausstoss
   noch ein Stueck weiter (der Bruch kommt kurz vor dem Gipfel) und
   fallen als schmaler, schimmernder Pferdeschweif ~3 s zurueck. */
EFF.rossschweif=function(p,A,B,s,r){
  const q=QUAL(), n=Math.round(rand(60,80)*s*q), vk=r&&r.v?[r.v.x*0.6,Math.max(2,r.v.y*0.8),r.v.z*0.6]:[0,3,0];
  /* 28.09., Tom: "Laser" - mit 0,9 s Leuchtspur zog jeder Stern einen
     glatten Strich; aus der Naehe ein weisser Pinsel aus geraden Linien.
     Jetzt kurze Flamme und ein koerniger Funkenfaden (funkenFaden, 14b),
     der beim Zurueckfallen als schimmernder Schweif haengt. */
  const st=[];
  grSpur(0.2,()=>{ for(let i=0;i<n;i++){ let d=randDir(); d=[d[0]*0.35,0.55+Math.abs(d[1])*0.45,d[2]*0.35];
    const w=rand(3,6.5)*s, c=i%4?A:B, v=[d[0]*w+vk[0],d[1]*w+vk[1],d[2]*w+vk[2]], L=rand(3.0,3.4);
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*1.15,c[1]*1.15,c[2]*1.15,L,4.2,4);
    if(i%2===0) st.push({v,L}); } });
  funkenFaden(p,st,4.2,[.9,.92,.98],0.5);
};

/* Goldvorhang (Vorhang auf!): schwerer Goldregen - dicke Glitzersterne
   werden flach zur Seite geworfen und fallen in langen, dunkelgoldenen
   Schweifen (Rossschweif/Weide). Im Faecher nebeneinander auf Schlag
   ergibt das den Vorhang, wie bei echten Vorhangfaechern (28.09., Tom:
   echt). Vorher: eine waagrechte Glitzerlinie in der Bildebene, die fiel. */
EFF.vorhang=function(p,A,B,s,r){
  const q=QUAL(), g=FW.gold, [u]=basisBlick(p,0), n=Math.round(rand(55,70)*s*q);
  grSpur(1.4,()=>{ for(let i=0;i<n;i++){ const x=rand(-1,1), d=randDir(), w=rand(2.5,5)*s;
    psBig.emit(p.x,p.y,p.z,u[0]*x*w*1.3+d[0]*w*0.35,rand(0.5,2.8),u[2]*x*w*1.3+d[2]*w*0.35,g[0],g[1]*0.95,g[2]*0.8,rand(3.0,3.8),4.8,4); } });
  grSpur(0.06,()=>{ for(let i=0;i<Math.round(18*q);i++){ const d=randDir(), w=rand(1.5,3)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(1.0,1.4),2.2,0); } });
  later(1.2,()=>sfx.crackle(distVol(p)*0.4));
};

/* Blinkregen (Strobe): echte Blinksterne - jeder Stern brennt als kleiner
   Satz mit kurzem Schweif, blinkt in seinem eigenen Takt (Modus 1) und
   faellt nach 2 s aus dem Bild; dazu ein Kern aus Silberglitter und
   leises Knistern. 28.09., Tom: "Punkte" - die Bibliotheks-Strobe
   (EFF.strobe) haengt 4-5 s als stehende Punktwolke ohne Schweif; sie
   bleibt fuer die anderen Kategorien, die Batterien nehmen diese. */
EFF.blinkregen=function(p,A,B,s,r){
  grOhneZutaten(r);
  const q=QUAL(), n=Math.round(rand(70,90)*Math.min(1.3,s)*q);
  grSpur(0.2,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(6.5,9)*s, c=i%3?A:B; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0]*1.6,c[1]*1.6,c[2]*1.6,rand(1.6,2.4),2.4,1); } });   /* 28.09.: psMid statt weicher Leuchtbaelle */
  grSpur(0.3,()=>{ for(let i=0;i<Math.round(36*Math.min(1.3,s)*q);i++){ const d=randDir(), w=rand(3,6)*s; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,1,1.05,rand(0.8,1.3),2,4); } });
  later(0.35,()=>sfx.crackle(distVol(p)*0.3));
};

/* Blinkkugel (Lichterkette): Roemisches Licht - eine kompakte Farbkugel
   steigt aus dem Rohr und zieht einen Schweif aus Goldglitter; im Scheitel
   zerlegt sie sich nach kurzer Dunkelphase in ein Dutzend funkelnder
   Silbersterne mit Schweif, die knisternd herabrieseln ("Farbkugel mit
   Glitterzerleger"). Mehrere Rohre auf Schlag im Faecher: eine Lichter-
   kette (28.09., Tom: echt). Vorher standen die Kugeln 3-4 s still in der
   Luft, mit einer Girlande aus Punkten dazwischen; danach blinkten weisse
   Punkte mit Lichthof (sah immer noch nach Lichtshow aus). */
SCHUSS_EFF.blinkkugel=function(r){
  const A=r.A, q=QUAL(), P0={x:r.p.x,y:r.p.y,z:r.p.z}, v=[r.v.x,r.v.y,r.v.z], G=6, tag=r.tag||FW_TAG;
  const tS=Math.log(1+ZIEH*Math.max(0.1,v[1])/G)/ZIEH, t1=tS*rand(0.93,0.98), t2=t1+rand(0.07,0.1), c=grWeiss(A,0.1), fu=[1,.75,.35];
  grSpur(0.35,()=>{ for(let k=0;k<2;k++) psBig.emit(P0.x,P0.y,P0.z,v[0],v[1],v[2],c[0]*1.6,c[1]*1.6,c[2]*1.6,t1,G,0); });
  grSpur(0.3,()=>{ for(let i=0;i<Math.round(30*q);i++) psMid.emit(P0.x,P0.y,P0.z,v[0]*0.9+rand(-.3,.3),v[1]*rand(0.45,0.95),v[2]*0.9+rand(-.3,.3),1,.8,.4,rand(0.6,1.2),6,4); });
  /* Goldglitter-Schweif der steigenden Kugel */
  for(let t=0.05;t<t1;t+=0.05){ const tt=t;
    imBild(tt,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(P0,v,G,tt), w=bahnTempo(v,G,tt);
      for(let k=0;k<Math.round(4*q);k++) psMid.emit(o.x,o.y,o.z,w[0]*0.15+rand(-.3,.3),w[1]*0.15+rand(-.5,0),w[2]*0.15+rand(-.3,.3),fu[0],fu[1],fu[2],rand(0.35,0.6),3,4); FW_TAG=alt; }); }
  /* Scheitel: Glitterzerleger, jeder Stern funkelt fuer sich und rieselt */
  /* 28.09. (Probebild vom Zuendpult): 12-16 Sterne mit 3-4,5 m/s waren
     aus 40 m kaum zu sehen - jetzt ein voller kleiner Glitterzerleger */
  imBild(t2,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(P0,v,G,t2), w=bahnTempo(v,G,t2), n=Math.round(rand(26,34)*q);
    grSpur(0.22,()=>{ for(let i=0;i<n;i++){ const d=randDir(), u=rand(4.5,6.5); psBig.emit(o.x,o.y,o.z,w[0]+d[0]*u,w[1]+d[1]*u,w[2]+d[2]*u,1.3,1.32,1.4,rand(1.4,2.1),1.8,4); } });
    later(camera.position.distanceTo(o)/343,()=>{ sfx.klick(distVol(o)*1.4,rand(0.8,1.1)); later(0.25,()=>sfx.crackle(distVol(o)*0.5)); });
    FW_TAG=alt; });
};

/* Dreiklang-Heuler (Pfeifkonzert): gerader heller Pfeifschweif mit
   wenigen Funken; der Dreiklang ist nur zu hoeren (STEIG_KLANG). Vorher
   eine Spirale, die an jedem Tonsprung weiter wurde und einen Funkenring
   warf (echt.md 2.3). Nur das Pfeifkonzert nutzt diesen Aufstieg. */
STEIG_ART.dreiklang={spur(r,dt,ort){ const c=r.trail;
  /* laengere, schwerere Funken als bei der Tonleiter: der Schweif haengt etwas nach */
  for(let n=jeSek(r,'a',170,dt);n>0;n--){ const q=ort(); psMid.emit(q[0]+rand(-.05,.05),q[1],q[2]+rand(-.05,.05),rand(-.35,.35),rand(-2,-0.8),rand(-.35,.35),c[0],c[1],c[2],rand(0.5,0.8),2,0); }
  for(let n=jeSek(r,'b',35,dt);n>0;n--){ const q=ort(); psSmall.emit(q[0],q[1],q[2],rand(-.8,.8),rand(-1.5,0),rand(-.8,.8),1,.85,.55,rand(0.2,0.35),3,0); } }};

/* Heuler aus der Batterie (Pfeifkonzert, Achterbahn): gerader, heller
   Pfeifschweif mit wenigen Funken wie bei echten Pfeifsaetzen, Klang wie
   'pfeif'. Die Bibliothek zeichnet 'pfeif' als Schraube (echt.md 2.3:
   "Spirale weg"); die bleibt den anderen Kategorien (28.09., Tom: echt). */
STEIG_FARBE.heuler=[1,.88,.62];
STEIG_ART.heuler={spur(r,dt,ort){ const c=r.trail;
  for(let n=jeSek(r,'a',150,dt);n>0;n--){ const q=ort(); psMid.emit(q[0]+rand(-.04,.04),q[1],q[2]+rand(-.04,.04),rand(-.3,.3),rand(-1.4,-0.3),rand(-.3,.3),c[0],c[1],c[2],rand(0.25,0.45),1.5,0); }
  for(let n=jeSek(r,'b',25,dt);n>0;n--){ const q=ort(); psSmall.emit(q[0],q[1],q[2],rand(-.8,.8),rand(-1.5,0),rand(-.8,.8),1,.85,.55,rand(0.2,0.35),3,0); } }};
STEIG_KLANG.heuler=STEIG_KLANG.pfeif;

/* Farbkomet (Farbsaeulen): der Stern steigt mit farbiger Flamme am Kopf,
   dahinter ein kurzer Schweif aus Kohle-Goldfunken, die fallen. Wie
   'farbspur', aber ohne das Licht alle 0,3 s - bei 20 Saeulen hinter-
   einander tauchte es Tisch, Wand und Haeuser abwechselnd in reines
   Magenta und Limette (Bodenbild, 28.09., Tom: "Lichtshow"). Nur die
   Farbsaeulen nutzen diesen Aufstieg. */
STEIG_SPUR_AB.farbkomet=0;
STEIG_ART.farbkomet={spur(r,dt,ort){ const c=r.trail, v=r.v, k=0.8+0.2*Math.random();
  for(let n=jeSek(r,'a',40,dt);n>0;n--){ const q=ort(); psBig.emit(q[0]+rand(-.06,.06),q[1],q[2]+rand(-.06,.06),-v.x*0.05+rand(-.2,.2),-v.y*0.05,-v.z*0.05+rand(-.2,.2),c[0]*k*1.2,c[1]*k*1.2,c[2]*k*1.2,rand(0.1,0.16),0,0); }
  for(let n=jeSek(r,'b',150,dt);n>0;n--){ const q=ort(); psMid.emit(q[0]+rand(-.08,.08),q[1]-rand(0,0.4),q[2]+rand(-.08,.08),rand(-.5,.5),rand(-1.6,-0.2),rand(-.5,.5),1,.62,.24,rand(0.25,0.5),2,4); } }};

/* Familien und Schweife der neuen Brueche (effPassen, mitSchweif) */
Object.assign(EFF_FAMILIE,{kreuzstern:'knister',blinkregen:'knister',vorhang:'haenger',polarlicht:'haenger',meteor:'haenger',blinkchrys:'knister',donnerblitz:'salut',donnerkette:'salut',kaleidoskop:'kugel',silberwelle:'kugel'});
Object.assign(EFF_SCHWEIF,{kreuzstern:0.12,rossschweif:0.2,blinkregen:0.2,vorhang:1.4,polarlicht:0.3,blinkchrys:0.12,donnerblitz:0.1,donnerkette:0.06,kaleidoskop:0.14,silberwelle:0.12});

/* Farbthemen dieser Klasse (28.09., Tom: "die Effekte muessen ineinander
   passen, von den Farben her ... viel zu durcheinander"): je Produkt ein
   Thema, je Phase ein Paar. */
Object.assign(THEMEN,{
  /* Sonnenaufgang: die Paare von sonne, dazu die Sonne selbst (Gold mit orangem Kern) */
  morgen:[['gold','bernstein'],['orange','zitrone'],['scharlach','gold'],['gold','orange']],
  rummel:[['rose','aqua'],['rose','weiss'],['aqua','weiss']],
  achterbahn:[['violett','gold'],['violett','weiss'],['gold','weiss']],
  lichter:[['gold','weiss'],['rot','weiss'],['gruen','weiss']],
  saeulen:[['magenta','gold'],['limette','gold'],['magenta','limette']],
  hexenring:[['limette','violett'],['limette','gold'],['violett','gold']],
  polar:[['gruen','silber'],['gruen','violett'],['silber','violett']],
  goetter:[['gold','rot'],['gold','weiss'],['rot','weiss']],
  kaiser:[['rot','tuerkis'],['tuerkis','gold'],['rot','gold']],
  gitter:[['tuerkis','silber'],['weiss','silber'],['tuerkis','weiss']],
  hochhaus:[['gold','weiss'],['rot','gold'],['weiss','silber'],['rot','weiss']]
});

/* Level 16: Sonnenaufgang. 28.09. (Tom: echt): ohne rotes Bengal-
   Dauerlicht am Boden; zum Schluss geht die Sonne als goldenes Pistill
   mit orangem Kern auf (vorher ein perfekter Goldreif um eine Kugel) */
SHOWS.faecher=()=>show({basis:{pw:0.00,sz:1.000,th:'morgen'},rampe:{sz:[0.85,1.30],pw:[-3,2],hell:[0.70,1.35],kurve:'spaet'}},[
  /* Morgenroete - tief, langsam: Scharlach, das zu Gold wird (28.09.: statt
     tiefer Dahlien, deren grosse Sterne nah am Zuendpult wie Lampen wirkten) */
  {n:4,gap:1.8,muster:'gerade',eff:'wechsel',kal:'klein',pw:-5,farbe:2,steig:'glut',pause:1.0},
  /* erste Strahlen, von der Mitte nach aussen */
  /* 27.09.: pw +2/+3 in den spaeteren Phasen - die mittlere Bruchhoehe lag unter
     der von Feuersturm (L15), steigerung.js verlangt die Hoehenleiter */
  {n:9,gap:0.4,muster:'halbkreis',von:'mitte',ang:1.30,pw:2,eff:'rohrkomet',art:'gold',pause:1.0},
  /* der Tag bricht an - ruhige Goldbuketts im V, Fontaene mitten drin */
  {n:6,gap:1.0,muster:'v',ang:0.30,pw:3,eff:['chrys','kamuro'],farbe:0,boden:{k:'fountain',gt:6,gh:0.8,A:'gold',B:'zitrone'},pause:1.2},
  /* Hitzeflimmern - kurze Brokat-Stoesse, gestreut */
  {n:7,gap:0.15,muster:'zufall',ang:0.20,eff:'brokat',kal:'klein',pw:2,pause:1.4},
  /* FINALE Sonnenkranz: neun Strahlen auf Schlag, in der Mitte geht die Sonne auf */
  {n:9,gap:0,muster:'halbkreis',ang:1.45,pw:3,eff:'rohrkomet',art:'glitter',farbe:1},
  {mit:true,n:1,muster:'gerade',eff:'pistill',farbe:3,kal:'riesig',pw:3,bruchOpt:{nachglitzer:false},boden:{k:'fountain',gt:4,gh:1.2,A:'gold',B:'zitrone'},pause:4}
]);
SIGNATUR.faecher={muster:'halbkreis',text:'Strahlenkranz bis zum Horizont'};

/* Level 16: Silberwirbel. 28.09. (Tom: echt): Crossetten statt der
   gebogenen Punktspirale, Knisterfontaene statt des Feuerrads, das ohne
   Pfahl ueber der Batterie in der Luft drehte */
SHOWS.silberwirbel=()=>show({basis:{pw:0.05,sz:1.005,th:'silber'},rampe:{sz:[0.90,1.15],pw:[-1,2],hell:[0.90,1.20],kurve:'flach'}},[
  {n:4,gap:1.8,muster:'gerade',eff:'farfalle',kal:'klein',steig:'silber',boden:{k:'torte',gt:9,A:'silber'},pause:1.0},
  {n:6,gap:0.6,muster:'welle',ang:0.35,wellen:1,eff:['farfalle','kreuzstern'],farbe:0,pause:1.2},
  /* Ruhepunkt: stehende Silberweide, darunter knistert eine Silberfontaene */
  {n:8,gap:0.3,muster:'mitte',ang:0.40,eff:'glitzerweide',farbe:1,steig:'silber'},
  {mit:true,n:0,boden:{k:'knisterbrunnen',gt:8,A:'silber',B:'weiss'},pause:1.0},
  /* FINALE Wirbelsturm: 12 Farfalle im W */
  {n:12,gap:0.10,muster:'w',ang:0.40,eff:'farfalle',kal:'mittel',pause:3.5}
]);
SIGNATUR.silberwirbel={eff:'farfalle',text:'drehende Silberräder am Himmel'};

/* Level 16: Silberbrandung. 28.09. (Tom: echt): die Silbergischt wird
   nach einer Dunkelphase tuerkis und fliegt weiter (vorher blieb sie als
   Perlen stehen) */
SHOWS.sternenmeer80=()=>show({basis:{pw:0.10,sz:1.010,th:'eis'},rampe:{sz:[0.80,1.30],pw:[-2,3],hell:[0.85,1.30],kurve:'welle'}},[
  /* Ebbe */
  {n:6,gap:1.6,muster:'gerade',eff:'silberwelle',kal:'klein',steig:'silber',boden:{k:'torte',gt:12,A:'silber'},pause:1.0},
  /* erste Wellen (Hoehenwelle nur im Finale - die Hoehenkurve ist Achterbahn-Signatur) */
  {n:14,gap:0.45,muster:'welle',ang:0.40,wellen:2,eff:['silberwelle','dahlie'],farbe:0,pause:1.4},
  /* Tiefsee: oben stehende Silberweiden, ganz unten schwimmen Fische */
  {n:10,gap:1.4,muster:'gerade',eff:'glitzerweide',farbe:0},
  {mit:true,n:10,gap:1.4,muster:'v',ang:0.50,kal:'mini',pw:-6,eff:'fische',farbe:2,pause:0.8},
  /* Gischt - schnell, eine kurze Zickzack-Phase */
  {n:16,gap:0.18,muster:'z',seg:3,ang:0.35,eff:'silberwelle',kal:'mittel',farbe:0,pause:1.6},
  /* FINALE Sturmflut: drei Wellenberge, Silber-Feuertoepfe, Riesenfontaene */
  {n:24,gap:0.10,muster:'welle',ang:0.50,wellen:3,hoehe:'welle',hSpanne:10,eff:'silberwelle',kal:'gross',farbe:2,
   mine:true,mineEff:'silber',boden:{k:'riesen',gt:4,gh:0.8,A:'silber',B:'weiss',C:FW.weiss},pause:3.5}
]);
SIGNATUR.sternenmeer80={eff:'silberwelle',text:'Silbergischt wird mitten im Flug zu türkisem Wasser'};

/* Level 17: Rummelplatz. 28.09. (Tom: echt): nur Rosa und Aqua
   (Zuckerwatte), summende Bienen im Karussell statt zweifarbiger
   Drallringe, zwei Bodenkreisel statt des Feuerrads in der Luft */
SHOWS.familienmix=()=>show({basis:{pw:0.50,sz:1.040,th:'rummel'},rampe:{sz:[0.90,1.10],pw:[-1,1],hell:[0.95,1.15],kurve:'flach'}},[
  /* Einlass: zwei kleine Brunnen */
  /* 28.09., Tom: "am Produkt rauslassen" - zwei kleine Fontaenen mit Farbsternen
     statt Bodenkreiseln, die vom Karton aus farbige Funken ueber den Tisch spruehten */
  {n:0,boden:[{k:'farbtorte',gt:8,A:'rose',x:-0.2},{k:'farbtorte',gt:6,A:'aqua',x:0.2,t:0.5}],pause:2.0},
  /* Karussell, gemaechlich: Bienen rundum */
  {n:8,gap:0.9,muster:'spirale',ang:0.35,kal:'klein',pw:-4,eff:'bienen',farbe:0,steig:'gold',pause:1.2},
  /* Zuckerwatte: weiche Farbschleier, Goldfontaene dazu */
  {n:4,gap:1.6,muster:'gerade',eff:'farbregen',kal:'mittel',farbe:1,boden:{k:'fountain',gt:6,A:'gold',B:'weiss'},pause:0.8},
  /* Schiessbude: kleine Knister-Pops, schnell */
  {n:6,gap:0.15,muster:'zufall',ang:0.30,kal:'mini',pw:-6,eff:'knister',farbe:2,pause:1.2},
  /* FINALE Karussell auf Hochtouren, noch ein Brunnen */
  {n:6,gap:0.12,muster:'spirale',ang:0.50,kal:'mittel',eff:['wechsel','bienen'],farbe:0,mine:true,mineEff:'farbe',boden:{k:'farbtorte',gt:4,A:'aqua'},pause:3.0}
]);
SIGNATUR.familienmix={muster:'spirale',text:'Karussell aus Zuckerwatte-Farben'};

/* Level 17: Hagelsturm (neu) */
SHOWS.hagelsturm=()=>show({basis:{pw:0.55,sz:1.045,th:'eis'},rampe:{sz:[0.90,1.20],pw:[0,2],hell:[0.90,1.30],kurve:'frueh'}},[
  /* Aufzug der Wolke: lockeres Prasseln, eine Knisterfontaene zum Auftakt
     (28.09., Tom: echt - vorher zwei bei x +-2 m, auf den Karton gestaucht
     standen sie 28 cm auseinander und wirkten wie eine) */
  /* 27.09.: pw -10 brach bei 7-8 m (hinter der Mauer), Katalog will 15-20 m */
  {n:40,gap:0.25,muster:'zufall',ang:0.30,kal:'mini',pw:-2,eff:'hagel',steig:'keiner',
   boden:{k:'knisterbrunnen',gt:8,gh:0.7,A:'silber',B:'weiss'}},   /* 28.09., Tom: "Effekt zu gross" - nur zum Aufzug, vorher 38 s: die Fontaene uebertoente die Batterie */
  /* 28.09., Tom: "Laser" - Titanschlaege statt grosser Spinnen: deren 15-30 m/s
     schnelle Sterne zogen vom Zuendpult aus Striche quer ueber das ganze Bild */
  {mit:true,n:2,gap:5,muster:'gerade',kal:'mittel',pw:2,eff:'salut',th:'silber'},
  /* Prasseln: dicht, als Welle ueber die Breite; oben grosse Schlaege */
  {n:100,gap:0.10,muster:'welle',ang:0.40,wellen:3,kal:'mini',pw:-1,eff:'hagel'},
  {mit:true,n:4,takt:[2.5],muster:'v',ang:0.30,kal:'gross',eff:['salut','glitzerweide'],th:'silber'},
  /* Auge des Sturms: drei ruhige grosse Silberweiden */
  {n:3,gap:1.2,muster:'gerade',kal:'gross',pw:3,eff:'glitzerweide',pause:0.5},
  /* Hagelschlag: 16 je Sekunde im Zickzack, oben Kreuzschlaege, dazwischen Silber-Feuertoepfe */
  {n:145,gap:0.06,muster:'z',seg:4,ang:0.45,kal:'mini',pw:0,eff:'hagel'},
  {mit:true,n:6,takt:[1.6],muster:'x',ang:0.40,kal:'gross',eff:'chrys',th:'silber'},
  {mit:true,n:12,gap:0.8,nurMine:true,mineEff:'silber',muster:'zufall',ang:0.30},
  /* FINALE: der Hagel hoert schlagartig auf, acht Silberweiden haengen nach */
  {n:8,gap:0,muster:'schlag',ang:0.50,kal:'gross',eff:'glitzerweide',pause:5}
]);
SIGNATUR.hagelsturm={eff:'hagel',text:'Prasseln aus 300 Mini-Kalibern'};

/* Level 17: Regenbogenbruecke. 28.09. (Tom: "Farben zu durcheinander"):
   der Regenbogen laeuft als Folge ueber die Zeit - jeder Bogen eine Farbe,
   Rot aussen zuerst, Violett innen zuletzt, der naechste erst, wenn der
   vorige verglimmt (hoechstens zwei Farben zugleich). Vorher standen alle
   sieben Boegen in 2 s gleichzeitig am Himmel. */
SHOWS.regenbogenfaecher=()=>show({basis:{pw:0.60,sz:1.050,th:'spektrum'},rampe:{sz:[0.95,1.20],pw:[0,1],hell:[0.80,1.30],kurve:'linear'}},[
  /* Regenschauer: Silberregen am Boden, traege Glitzertropfen */
  {n:7,gap:0.8,muster:'zufall',ang:0.30,eff:'zeitregen',kal:'klein',th:'eis',boden:{k:'fountain',gt:10,A:'silber',B:'weiss'},pause:1.0}, /* 28.09., Tom: "Effekt zu gross" - Silberfontaene statt Wasserfall: der spruehte 1,5 m breit ueber Tisch und Boden (Bodenbild) */
  /* Farbtropfen: sieben einzelne Paeonien, jede eine Spektralfarbe, eine nach der anderen
     (28.09.: statt Dahlien - ihre grossen Sterne standen als Leuchtscheiben am Himmel) */
  {n:7,gap:1.8,muster:'mitte',ang:0.50,eff:'kugel',farbVert:'spektrum',bruchOpt:{kern:false},pause:1.2},
  /* FINALE Regenbogenbruecke: 7 Boegen a 7, aussen nach innen, einer nach dem anderen */
  {n:49,je:7,gap:0,bogenGap:1.6,muster:'bogen',r:[1.0,0.70],farbVert:'spektrum',eff:'kugel',kal:'gross',steig:'keiner',
   bruchOpt:{kern:false,nachglitzer:false},boden:{k:'fountain',gt:3,gh:0.6,A:'silber',B:'weiss'},pause:3.5}
]);
SIGNATUR.regenbogenfaecher={muster:'bogen',text:'sieben einfarbige Bögen nacheinander, Rot außen, Violett innen'};

/* Level 17: Blitzgewitter. 28.09. (Tom: "Laser"): Titanblitze mit
   nachflackernden Blinksternen statt gezackter Punktlinien */
SHOWS.zfaecher=()=>show({basis:{pw:0.65,sz:1.055,th:'blitz'},rampe:{sz:[0.90,1.30],pw:[-2.5,2.5],hell:[0.70,1.40],kurve:'spaet'}},[
  /* Wetterleuchten: ferne, schwache Schlaege hoch oben */
  {n:6,gap:2.0,muster:'zufall',ang:0.35,pw:5,kal:'klein',eff:'salut',steig:'keiner',pause:0.5},
  /* erste Blitze, von aussen nach innen */
  {n:8,gap:0.9,muster:'aussen',ang:0.45,eff:'donnerblitz',steig:'silber',pause:1.2},
  /* Regen setzt ein: Silberregen am Boden, Blinkweiden als Regenschleier, dazwischen Blitze */
  {n:10,gap:0.4,muster:'gerade',eff:'strobeweide',farbe:1,boden:{k:'fountain',gt:8,A:'silber',B:'weiss'}}, /* 28.09., Tom: "Effekt zu gross" - Silberfontaene statt Wasserfall: der spruehte 1,5 m breit ueber Tisch und Boden (Bodenbild) */
  {mit:true,n:6,gap:0.7,muster:'zufall',ang:0.40,pw:4,eff:'donnerblitz',kal:'mittel',pause:0.5},
  /* Sturmboee - der alte Z-Faecher als eine kurze Phase */
  {n:12,gap:0.12,muster:'z',seg:2,ang:0.45,eff:['chrys','donnerblitz'],farbe:0,pause:1.5}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  /* FINALE Entladung: sechs Blitze auf einen Schlag (28.09.: ohne Boden-
     Stroboskop - eine Batterie hat keins) */
  {n:6,gap:0,muster:'schlag',ang:0.50,eff:'donnerblitz',kal:'gross',pw:3,pause:4}
]);
SIGNATUR.zfaecher={eff:'donnerblitz',text:'Titanblitze mit Donner und nachflackernden Blinksternen'};

/* Level 17: Achterbahn. 28.09. (Tom: "Farben zu durcheinander"): nur
   Violett und Gold (vorher Blau, Rosa, Violett, Magenta, Gelb), Farbwechsel
   statt Geisterkugeln mit dritter Zufallsfarbe, Palmen golden */
SHOWS.batterie100=()=>show({basis:{pw:0.70,sz:1.060,th:'achterbahn'},rampe:{sz:[0.90,1.20],pw:[0,0],hell:[0.90,1.25],kurve:'linear'}},[
  /* Kettenaufzug: jeder Schuss 2,5 m hoeher (28.09.: ohne Warnblinker
     am Boden - eine Batterie hat kein Stroboskop) */
  /* 27.09.: Hoehenspannen kleiner (Aufzug 16, Drop 18, Buckel 14 statt 30/35/20) -
     der Drop brach bei 39 m, hoeher als die Kugelbomben bis Level 18 (Toms Regel:
     Kugeln sind das Groesste und Hoechste bis zu ihrem Level, steigerung.js) und
     vom Zuendpult aus ueber dem Bildrand */
  /* Einsteigen: kurze Fontaene am Bahnhof, bevor der Zug anfaehrt (Auftakt, steigerung.js) */
  {n:0,ground:'fountain',gt:2.5,gh:0.6,gA:'gold',gB:'weiss',pause:2.0},
  {n:12,gap:0.9,muster:'treppe',hoehe:'steigend',hSpanne:16,pw:-3,kal:'klein',eff:'pistill',steig:'blink',farbe:0,pause:0.2},
  /* oben: kurzer Stillstand, ein grosser Kamuro als Aussicht */
  {n:1,muster:'gerade',eff:'kamuro',kal:'gross',pw:2,farbe:0,pause:1.8},
  /* erster Drop: fallend, immer schneller, kreischende Aufstiege */
  {n:16,gap:0.35,gapEnde:0.07,muster:'v',ang:0.15,hoehe:'fallend',hSpanne:18,eff:['chrys','kugel'],farbe:0,steig:'heuler',pause:1.2}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  /* Kamelbuckel: Hoehen als Welle, Fontaene am Boden */
  {n:18,gap:0.30,muster:'welle',ang:0.30,wellen:3,hoehe:'welle',hSpanne:14,eff:['kugel','palme'],A:['violett','gold'],B:['gold','violett']},
  {mit:true,n:0,boden:{k:'fountain',gt:6,gh:0.9,A:'gold',B:'weiss'},pause:1.0},
  /* Steilkurve: Paare, Winkel waechst */
  {n:14,gap:0.20,muster:'paar',ang:0.50,eff:'komet',farbe:1,pause:1.0},
  /* Tunnel: dunkel, tief, rumpelndes Knistern */
  {n:10,gap:0.25,muster:'zufall',ang:0.25,kal:'mini',pw:-3,eff:'tausend',farbe:2,pause:0.8},
  /* Schlussfahrt: Kreuzfeuer mit wechselnden Hoehen */
  {n:24,gap:0.2,muster:'x',ang:0.45,hoehe:'wechsel',hSpanne:3,pw:2.5,eff:['kamuro','wechsel'],farbe:0,kal:'gross'} /* 29.09.: gap 0,12->0,2 - mit dem Blinkregen-Schlag 21 Schuss/s, dichter als Donnerwand (L20) und Goetterfunken (L22); bis L22 hoechstens 18 */ /* 27.09.: pw 5->4 - die Kugelbomben sind die Koenigsklasse und steigen hoeher als die Spitze jedes Verbunds bis Level 17 (steigerung.js KUGEL) */,
  /* FINALE Schlussbremse: fuenf tiefe Blinkregen auf Schlag - das Achterbahn-Foto */
  {n:5,gap:0,muster:'schlag',ang:0.50,eff:'blinkregen',kal:'mittel',pw:3,farbe:1,pause:3.5}
]);
SIGNATUR.batterie100={idee:'hoehenkurve',text:'Aufzug, Drop, Buckel, Bremse'};

/* Level 18: Kreuzfeuer */
SHOWS.kreuzfeuer=()=>show({basis:{pw:1.00,sz:1.080,th:'rotweiss'},rampe:{sz:[0.90,1.20],pw:[-1,2],hell:[0.90,1.25],kurve:'frueh'}},[
  {n:4,gap:1.6,muster:'gerade',eff:'kreuzkomet',kal:'mittel',boden:{k:'knisterbrunnen',gt:8,A:'silber',B:'weiss'},pause:0.8},
  /* Kreuzfeuer: linkes Rohr nach rechts, rechtes nach links; links rot, rechts weiss */
  {n:12,gap:0.5,muster:'x',ang:0.45,rohre:'breit',eff:'kreuzkomet',farbVert:'seite',pause:1.2},
  /* Stellungswechsel: ruhiges V, Knister-Feuertoepfe darunter */
  {n:8,gap:1.0,muster:'v',ang:0.30,eff:['pistill','kreuzkomet'],farbe:1,mine:true,mineEff:'knister',pause:1.0},
  /* FINALE Gitter: 18 Kreuzkometen im Kreuzfeuer, Splitter doppelt */
  {n:18,gap:0.10,muster:'x',ang:0.50,rohre:'breit',eff:'kreuzkomet',split:2,kal:'gross'},
  {mit:true,n:0,boden:{k:'knisterbrunnen',gt:3,gh:1.2,A:'silber',B:'weiss'},pause:3.5}
]);
SIGNATUR.kreuzfeuer={eff:'kreuzkomet',text:'gekreuzte Kometen, die sich vierfach teilen'};

/* Level 19: Lichterkette. 28.09. (Tom: "Punkte"): Leuchtkugeln, die
   steigen, kurz ausgehen und blinkend verloeschen - im Faecher auf Schlag
   eine Kette aus Lichtern. Vorher standen die Kugeln 3-4 s still in der
   Luft, mit Punktgirlanden dazwischen. Je Kette eine Farbe. */
SHOWS.lichterkugeln=()=>show({basis:{pw:1.50,sz:1.120,th:'lichter'},rampe:{sz:[0.95,1.15],pw:[0,1],hell:[0.90,1.20],kurve:'flach'}},[
  /* einzelne Kugeln, dazwischen die kleine Goldfontaene aus dem Rohr */
  {n:6,gap:1.2,muster:'gerade',eff:'blinkkugel',farbe:0,steig:'keiner',boden:{k:'fountain',gt:8,gh:0.4,A:'gold',B:'weiss'},pause:1.5},
  /* die Kette: einmal quer gelegt (der einzige fan im Katalog) */
  {n:6,gap:0.18,muster:'fan',ang:0.60,hoehe:'gleich',eff:'blinkkugel',farbe:1,steig:'keiner',pause:2.5},
  /* zweite Kette in anderer Farbe, von aussen zur Mitte */
  {n:6,gap:0.25,muster:'aussen',ang:0.60,eff:'blinkkugel',farbe:2,steig:'keiner',boden:{k:'fountain',gt:5,gh:0.4,A:'gold',B:'weiss'},pause:2.5},
  /* FINALE Doppelkette: sechs auf Schlag, Hoehen im Wechsel */
  {n:6,gap:0,muster:'schlag',ang:0.60,hoehe:'wechsel',hSpanne:6,eff:'blinkkugel',farbe:0,steig:'keiner',pause:3.5}
]);
SIGNATUR.lichterkugeln={eff:'blinkkugel',text:'Kette aus Leuchtkugeln, die oben in funkelnden Glitter zerfallen'};

/* Level 19: Donnerschlag. 28.09. (Tom: echt): Knallbomben - die Knaller
   detonieren an zufaelligen Orten nacheinander (vorher auf einem Kreis) */
SHOWS.donnerschlag=()=>show({basis:{pw:1.55,sz:1.125,th:'rotweiss'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.90,1.30],kurve:'linear'}},[
  /* Vorwarnung: drei einzelne Kanonenschlaege, Silberknister am Boden */
  {n:3,gap:2.2,muster:'mitte',ang:0.20,eff:'salut',kal:'gross',steig:'silber',boden:{k:'knisterbrunnen',gt:10,A:'silber',B:'weiss'},pause:1.0},
  /* Donnerketten im V */
  {n:6,gap:1.1,muster:'v',ang:0.30,eff:'donnerkette',kal:'mittel',pause:1.2},
  /* Zwischenschauer: knisternde Traeger (28.09.: ohne Boden-Stroboskop) */
  {n:5,gap:0.35,muster:'mitte',ang:0.40,eff:'tausend',farbe:1,pause:1.0},
  /* FINALE Donnerwalze: sechs Donnerketten auf einen Schlag */
  {n:6,gap:0,muster:'schlag',ang:0.45,eff:'donnerkette',kal:'gross',pw:2,pause:4}
]);
SIGNATUR.donnerschlag={eff:'donnerkette',text:'Knaller detonieren nacheinander, dann der Mittelschlag'};

/* Level 19: Vorhang auf! 28.09. (Tom: echt): der Vorhang ist ein Faecher
   aus schweren Goldregen-Schuessen nebeneinander (vorher eine waagrechte
   Glitzerlinie in der Bildebene); die Rampenfontaene brennt nur zum
   Auftakt, nicht die ganze Show */
SHOWS.goldenerregen=()=>show({basis:{pw:1.60,sz:1.130,th:'gold'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.85,1.30],kurve:'welle'}},[
  /* drei Klingelzeichen; das Rampenlicht am Boden */
  {n:3,gap:1.2,muster:'gerade',eff:'salut',kal:'mini',pw:-6,boden:{k:'torte',gt:12,A:'gold'},pause:1.0},
  /* der Vorhang faellt: neun Goldregen auf Schlag ueber die volle Breite */
  {n:9,gap:0,muster:'schlag',ang:0.55,eff:'vorhang',kal:'gross',pause:2.0},
  /* Vorhang auf: von der Mitte nach aussen */
  {n:8,gap:0.3,muster:'mitte',ang:0.55,eff:'vorhang',pause:1.0},
  /* 1. Akt: Brokatkronen, ruhig */
  {n:8,gap:1.1,muster:'gerade',eff:'brokat',farbe:1,pause:1.2},
  /* 2. Akt: Tanz in Paaren, darunter Applaus (knisternde Goldsterne) */
  {n:12,gap:0.35,muster:'paar',ang:0.40,eff:['kronleuchter','zeitregen'],farbe:2},
  {mit:true,n:6,gap:0.7,muster:'zufall',ang:0.30,kal:'klein',pw:-5,eff:'drachenei',pause:1.4},
  /* 3. Akt: Kamuro-Solo, sehr langsam */
  {n:4,gap:2.4,muster:'gerade',eff:'kamuro',kal:'riesig',pw:3,pause:1.0},
  /* FINALE Vorhang zu: von aussen zur Mitte, Schlussapplaus, Goldgeysir */
  {n:14,gap:0.12,muster:'aussen',ang:0.60,eff:'vorhang',kal:'gross'},
  {mit:true,n:6,gap:0.3,muster:'zufall',ang:0.35,kal:'klein',pw:-4,eff:'drachenei',boden:{k:'riesen',gt:4,gh:0.9,A:'gold',B:'weiss',C:FW.gold},pause:4.5}
]);
SIGNATUR.goldenerregen={idee:'vorhang',text:'Vorhang fällt, öffnet sich, schließt sich'};

/* Level 19: Schimmelreiter. Galopp und Finale bekommen Silber fest
   (A silber, B blau/himmel als Spitzen) - aus dem Thema kaeme dort
   Tuerkis/Gold, und die Signatur ist der SILBERNE Pferdeschweif */
SHOWS.kometen=()=>show({basis:{pw:1.65,sz:1.135,th:'nacht'},rampe:{sz:[0.90,1.25],pw:[0,3],hell:[0.85,1.30],kurve:'frueh'}},[
  /* 27.09.: Stallfeuer - kurze Silberfontaene vorweg (Auftakt), Farben aus dem
     Thema eis (weiss/himmel) statt silber/blau (steigerung.js: kein Zufallsbunt),
     Maehne und Finale hoeher (Steigerung im Ablauf, Hoehenleiter) */
  {n:0,ground:'fountain',gt:2.5,gh:0.6,gA:'silber',gB:'weiss',pause:2.0},
  /* Anritt: einzelne Pferdeschweife, Silbersaeule am Boden (28.09.: ohne bunte Zufallssterne) */
  {n:6,gap:1.5,muster:'gerade',eff:'rossschweif',steig:'komet',kal:'mittel',pw:-2,A:'weiss',B:'himmel',boden:{k:'riesen',gt:9,gh:0.7,A:'silber',B:'weiss',C:FW.weiss},pause:0.8},
  /* Trab: W, im Wechsel mit kleinen Kometen (27.09.: vorher Zeitregen - der gehoert der Weidenwand) */
  {n:10,gap:0.6,muster:'w',ang:0.40,pw:-1,eff:['rossschweif','komet'],farbe:1,pause:1.2},
  /* Galopp: da-da-DUMM, Scheibenwischer zweimal hin und zurueck */
  {n:16,takt:[0.15,0.15,0.45],muster:'wischer',seg:2,ang:0.45,eff:'rossschweif',kal:'klein',pw:1,A:'weiss',B:'himmel',pause:1.4},
  /* Maehne: grosse Silberpalmen oben (wehendes Haar), kleine Kometen unten im V
     (27.09.: vorher Blinkweiden - die tragen die Weidenwand) */
  {n:8,gap:0.9,muster:'gerade',eff:'palme',A:'weiss',B:'himmel',kal:'gross',pw:2},
  {mit:true,n:8,gap:0.9,muster:'v',ang:0.50,kal:'mini',pw:0,eff:'komet',farbe:1,pause:0.8},
  /* FINALE Durchgehen: die Herde bricht aus - 16 Riesen-Pferdeschweife in
     einer Sekunde von der Mitte nach aussen, Silber-Feuertoepfe (29.09.:
     vorher 10 in 0,8 s - duenner als die Achterbahn auf L17; Trab und
     Maehne geben dafuer Rohre ab, es bleiben 64 Schuss) */
  {n:16,gap:0.06,muster:'mitte',ang:0.50,eff:'rossschweif',kal:'riesig',pw:4,A:'weiss',B:'himmel',mine:true,mineEff:'silber',pause:4.5}
]);
SIGNATUR.kometen={eff:'rossschweif',text:'Silberne Pferdeschweife im Galopp'};

/* Level 20: Rosenherz. 28.09. (Tom: echt): echte Herzbomben (Musterbomben)
   statt eines Herzbilds aus 14 Einzelbluten, einfarbige Goldringe statt
   zweier Kreise in zwei Farben, ohne rosa Bengallicht am Boden */
SHOWS.hochzeitsfaecher=()=>show({basis:{pw:2.00,sz:1.160,th:'herz'},rampe:{sz:[0.95,1.15],pw:[0,1],hell:[0.90,1.25],kurve:'flach'}},[
  /* Rosen werfen: Paare, Winkel waechst, Goldfontaene am Boden */
  {n:8,gap:0.7,muster:'paar',ang:0.25,eff:'pistill',kal:'klein',farbe:0,steig:'glut',boden:{k:'fountain',gt:6,A:'gold',B:'weiss'},pause:1.0},
  /* Schleier: Goldweiden mit rosa Kern (28.09.: statt 5 s schwebender,
     blinkender Leuchtscheiben - Blaetterfall wirkte wie Lichtshow) */
  {n:6,gap:1.2,muster:'mitte',ang:0.40,eff:'weide',farbe:0,pause:1.0},
  /* DIE HERZEN: vier Herzbomben nacheinander, jede steht allein am Himmel */
  {n:4,gap:1.8,muster:'v',ang:0.18,eff:'herz',kal:'gross',farbe:0,steig:'gold',bruchOpt:{nachglitzer:false},pause:1.2},
  /* Rosenstrauss: rote und goldene Blueten im W */
  {n:10,gap:0.3,muster:'w',ang:0.35,eff:['pistill','kugel'],farbe:1,pause:1.2},
  /* FINALE Ringtausch: zwei goldene Ringe, darunter weisser "Reis" */
  {n:2,gap:0,muster:'v',ang:0.20,eff:'ring',kal:'gross',A:'gold',B:'rose'},
  {mit:true,n:6,gap:0.15,muster:'zufall',ang:0.40,kal:'klein',pw:-3,eff:'farbregen',th:'silber',farbe:0,pause:4.5}
]);
SIGNATUR.hochzeitsfaecher={eff:'herz',idee:'herzbomben',text:'vier Herzbomben, zum Schluss zwei goldene Ringe'};

/* Level 20: Trommelfeuer. 28.09. (Tom: echt): Goldfontaene statt roter
   Funken zum Auftakt, Chrysanthemen statt 4 s stehender Flammenbaelle,
   je Salve ein Farbpaar */
SHOWS.donnerwand=()=>show({basis:{pw:2.05,sz:1.165,th:'glut'},rampe:{sz:[0.95,1.25],pw:[1.5,3.5],hell:[0.90,1.30],kurve:'linear'}},[
  /* 27.09.: Trommler zaehlt ein - kurze Flammenfontaene vorweg (Auftakt, steigerung.js) */
  {n:0,ground:'fountain',gt:2.5,gh:0.6,gA:'gold',gB:'bernstein',pause:2.0},
  /* Viertel: 4 Salven, Flammenfontaene */
  {n:24,je:6,takt:[1.8],muster:'schlag',ang:0.35,eff:'palme',kal:'mittel',pw:-1,A:'gold',B:'rot',boden:{k:'volcano',gt:7,A:'orange',B:'gold'},pause:1.0},
  /* Synkope: kurz-kurz-lang, V-Salven */
  {n:24,je:6,takt:[0.5,0.5,1.4],muster:'v',ang:0.40,eff:'kokosnuss',farbe:1,pause:1.2},
  /* Paukenschlag: eine senkrechte Sechser-Salve, danach Stille */
  {n:6,je:6,muster:'gerade',eff:'weide',kal:'gross',farbe:0,pause:2.5},
  /* Triolen: W-Salven, Fontaenen flackern */
  {n:36,je:6,takt:[0.28,0.28,0.9],muster:'w',ang:0.45,eff:['kugel','chrys','kugel'],farbe:0}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  /* 28.09., Tom: echt - Vulkane (Funken) statt Flammenfontaenen: die
     Flammenbaelle standen als orange Leuchtwolke ueber dem Karton */
  {mit:true,n:0,boden:[{k:'volcano',gt:4,x:-0.28,A:'gold',B:'bernstein'},{k:'volcano',gt:4,x:0.28,A:'gold',B:'bernstein'}],pause:1.2},
  /* Wirbel: 4 Salven in 0,36 s */
  /* 27.09.: Takt 0,4 statt 0,12 s (29.09.: 0,34 lag auf der Kante - 4 Salven in gut 1 s zaehlten je nach Startzeit im 0,1-s-Raster als 24) und Pause vor dem Tusch - hoechstens 18 Schuss je
     Sekunde, die Dichte-Leiter (steigerung.js) laesst Goetterfunken und Weltuntergang
     sonst nicht mehr drueber; hoeher fuer die Steigerung im Ablauf */
  {n:24,je:6,takt:[0.4],muster:'schlag',ang:0.55,eff:'brokat',kal:'gross',pw:3,farbe:2,pause:0.7},
  /* FINALE Tusch: eine senkrechte Riesen-Salve */
  {n:6,je:6,muster:'gerade',eff:'kamuro',kal:'riesig',pw:4,farbe:0,pause:4.5}
]);
SIGNATUR.donnerwand={idee:'trommel',text:'20 Salven im Takt eines Trommelsolos'};

/* Level 20: Farbsaeulen. 28.09. (Tom: "Lichtshow", "Farben zu
   durcheinander"): nur Magenta und Limette mit Gold (vorher Gruen,
   Violett, Rosa, Magenta, Mint), Name ohne "Neon". Die Farbe steigt als
   Farbkomet vom Feuertopf bis zum Bruch in derselben Farbe - echt. */
SHOWS.feuerpfau=()=>show({basis:{pw:2.10,sz:1.170,th:'saeulen'},rampe:{sz:[0.90,1.25],pw:[-1,2],hell:[0.95,1.35],kurve:'frueh'}},[
  /* Auftakt: Farbsaeule bis zur Paeonie (28.09.: Paeonie statt tiefer Dahlie,
     deren grosse Sterne wie Leuchtscheiben standen) */
  {n:4,gap:1.8,muster:'gerade',mine:true,mineEff:'farbe',steig:'farbkomet',eff:'kugel',kal:'mittel',farbe:0,boden:{k:'fountain',gt:8,A:'gold',B:'weiss'},pause:1.0},
  /* Saeulengang: aussen nach innen, ueber die Breite verteilt, Farben im Wechsel */
  {n:14,gap:0.55,muster:'aussen',ang:0.50,rohre:'breit',mine:true,mineEff:'farbe',steig:'farbkomet',eff:'pistill',farbVert:'wechsel',pause:1.2},
  /* Komplementaer: oben V in Limette, unten Blinker-Feuertoepfe in Magenta */
  {n:12,gap:0.9,muster:'v',ang:0.35,steig:'farbkomet',eff:'chrys',farbe:1},
  {mit:true,n:12,gap:0.9,nurMine:true,mineEff:'blink',muster:'gerade',farbe:0,pause:0.6},
  /* Paare: Farbwechsel Magenta zu Gold */
  {n:20,gap:0.30,muster:'paar',ang:0.45,mine:true,mineEff:'farbe',steig:'farbkomet',eff:'wechsel',farbe:0,pause:1.2},
  /* Saeulenwand: Mitte nach aussen, schnell */
  {n:18,gap:0.12,muster:'mitte',ang:0.55,rohre:'breit',mine:true,mineEff:'farbe',steig:'farbkomet',eff:'chrys',kal:'gross',farbe:2,pause:1.0},
  /* FINALE: zwei Zehner-Salven, jede Saeule in ihrer Farbe, Mitte anders */
  {n:20,je:10,takt:[0.6],muster:'schlag',ang:0.60,mine:true,mineEff:'farbe',steig:'farbkomet',eff:'dahlie',kal:'riesig',farbe:2,farbVert:'mitte',
   boden:{k:'fountain',gt:3,gh:1.2,A:'gold',B:'weiss'},pause:4.5}
]);
SIGNATUR.feuerpfau={idee:'farbsaeule',text:'Farbe steigt vom Feuertopf bis zum Bruch'};

/* Level 20: Hexenkessel. 28.09. (Tom: echt): der Kessel ist eine Gold-
   fontaene mit aufsteigenden limettengruenen Sternen (vorher gruenes
   Dauerlicht mit Leuchtblasen), Farbwechsel statt Geisterkugeln mit
   Zufallsfarbe; nur Limette und Violett mit Gold */
SHOWS.hexenkessel=()=>show({basis:{pw:2.15,sz:1.175,th:'hexenring'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'spaet'}},[
  /* der Kessel heizt: knisternde Blasen, der Kessel brodelt zum Auftakt
     (28.09., Tom: "Effekt zu gross" - vorher 34 s: eine Goldfontaene von
     5 m stand die ganze Show ueber der Batterie, Bodenbild) */
  {n:28,gap:0.30,muster:'zufall',ang:0.20,kal:'klein',pw:-7,eff:'knister',farbe:1,boden:{k:'sternregen',gt:9,A:'gold',B:'limette'}},
  {mit:true,n:4,takt:[2.0],muster:'v',ang:0.40,kal:'mittel',eff:'wechsel',farbe:0,pause:0.4},
  /* Hexenringe: 6 Ringe a 8, schraeg nach aussen, Farben im Wechsel */
  {n:48,je:8,takt:[0.9,0.9,0.5],muster:'kreis',ang:0.40,eff:['wechsel','kugel'],kal:'mittel',farbVert:'wechsel'}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  /* darunter Fische im Scheibenwischer */
  {mit:true,n:30,gap:0.15,muster:'wischer',seg:3,ang:0.50,kal:'mini',pw:-8,eff:'fische',farbe:1,pause:0.6},
  /* Beschwoerung: sechs grosse violette Pistillen, senkrecht */
  {n:6,gap:1.0,muster:'gerade',kal:'riesig',pw:3,eff:'pistill',farbe:2,pause:0.4},
  /* FINALE Walpurgisnacht: 8 Ringe in 2,4 s, Feuertoepfe */
  {n:64,je:8,takt:[0.3],muster:'kreis',ang:0.50,rohre:'breit',kal:'gross',eff:['palme','wechsel','tausend','wechsel'],farbe:0,mine:true,mineEff:'farbe',pause:4.5}
]);
SIGNATUR.hexenkessel={muster:'kreis',text:'Hexenringe aus acht Rohren um einen brodelnden Kessel'};

/* Level 21: Sternblinken. 28.09. (Tom: "Punkte", "Lichtshow"): Silber-
   chrysanthemen, die zu Blinksternen werden - jeder blinkt fuer sich.
   Vorher: eine stehende Punktwolke, alle im Gleichtakt, mit Lichtband
   (Lauflicht) und ein Boden-Stroboskop, das eine Batterie nicht hat. */
SHOWS.blitzgewitter60=()=>show({basis:{pw:2.50,sz:1.200,th:'blitz'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.30],kurve:'linear'}},[
  /* Auftakt: Blinkregen, darunter eine Silberfontaene (28.09.: statt des
     Boden-Stroboskops) */
  {n:6,gap:1.4,muster:'gerade',eff:'blinkregen',kal:'mittel',farbe:1,boden:{k:'fountain',gt:9,gh:0.6,A:'silber',B:'weiss'},pause:1.0},
  /* Silber wird zu Blinkern, im V */
  {n:10,gap:0.8,muster:'v',ang:0.35,eff:'blinkchrys',farbe:1,pause:1.2},
  /* gestreut, Blinker in Tuerkis */
  {n:8,gap:0.35,muster:'zufall',ang:0.30,eff:'blinkchrys',modus:'farbe',farbe:0,pause:1.2},
  /* zwei Ebenen: oben grosse Blinkchrysanthemen, unten kleine Blinker von aussen nach innen */
  {n:10,gap:0.7,muster:'gerade',eff:'blinkchrys',kal:'gross',farbe:1},
  {mit:true,n:10,gap:0.7,muster:'aussen',ang:0.50,kal:'mini',pw:-6,eff:'blinkregen',farbe:1,pause:0.8},
  /* FINALE: sechzehn auf engem Takt im W */
  {n:16,gap:0.06,muster:'w',ang:0.50,eff:'blinkchrys',kal:'gross',farbe:1,pause:4.5}
]);
SIGNATUR.blitzgewitter60={eff:'blinkchrys',text:'Silberchrysanthemen werden zu Blinksternen'};

/* Level 21: Nordlicht. 28.09. (Tom: "Laser"): Silberweiden mit gruenen
   Spitzen, die violett werden, statt eines Kamms aus stehenden Strichen;
   Farbwechsel statt Geisterkugeln; Gruen und Violett mit Silber */
SHOWS.nordlicht=()=>show({basis:{pw:2.55,sz:1.205,th:'polar'},rampe:{sz:[1.00,1.20],pw:[2,3],hell:[0.75,1.10],kurve:'flach'}},[
  /* Akt 1 Daemmerung: erste Nordlichtweiden, Schneeglitzern am Boden */
  {n:10,gap:2.2,muster:'gerade',eff:'polarlicht',kal:'mittel',pw:4,farbe:1,steig:'keiner',boden:{k:'torte',gt:24,A:'weiss'},pause:1.0},
  /* Akt 2 Sternklare Nacht: kleine Blinksterne hoch oben, dazwischen grosse Weiden
     (28.09.: Blinkregen mit Schweif statt 4 s haengender Blinkpunkte) */
  {n:18,gap:0.9,muster:'zufall',ang:0.40,pw:6,kal:'klein',eff:'blinkregen',farbe:0},
  {mit:true,n:6,gap:2.7,muster:'welle',ang:0.40,eff:'polarlicht',kal:'gross',pw:4,farbe:1,pause:0.5},
  /* Akt 3 Vorhaenge wehen: paarweise, im Wechsel mit Farbwechsel-Kugeln */
  {n:20,gap:0.6,muster:'paar',ang:0.40,eff:['polarlicht','wechsel'],farbe:1,pause:1.2},
  /* Akt 4 Eisbrunnen: Silberfontaene mitten in der Show, Silberweiden darueber */
  {n:12,gap:1.0,muster:'mitte',ang:0.40,eff:'glitzerweide',farbe:0,boden:{k:'riesen',gt:7,gh:1.0,A:'silber',B:'weiss',C:FW.gruen},pause:1.2},   /* 28.09.: 7 s statt 12 s */
  /* Akt 5 Sonnensturm (laut): Kreuzfeuer, gruene Feuertoepfe, Knisterfontaene */
  {n:30,gap:0.18,muster:'x',ang:0.45,eff:['kamuro','polarlicht','glitzerweide'],kal:'gross',farbe:1,mine:true,mineEff:'farbe',boden:{k:'knisterbrunnen',gt:5,A:'silber',B:'weiss'},pause:1.4}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  /* Akt 6 Koronaschlag: zwei Sechser-Salven Nordlichtweiden */
  {n:12,je:6,takt:[0.7],muster:'schlag',ang:0.50,eff:'polarlicht',kal:'riesig',pw:5,farbe:1,pause:2.5},
  /* Akt 7 STILLES FINALE Morgengrauen: zischender Zeitregen, dazwischen die letzten Weiden */
  {n:36,gap:0.35,muster:'gerade',eff:'zeitregen',kal:'mittel',pw:3,farbe:0,steig:'keiner',bruchOpt:{kern:false}},
  {mit:true,n:6,gap:2.0,muster:'v',ang:0.30,eff:'polarlicht',kal:'riesig',farbe:1,pause:7}
]);
SIGNATUR.nordlicht={eff:'polarlicht',text:'Silberweiden mit grünen Spitzen, die violett werden'};

/* Level 22: Goldene Zwillinge */
SHOWS.goldregen22=()=>show({basis:{pw:3.00,sz:1.240,th:'gold'},rampe:{sz:[0.95,1.20],pw:[0,2],hell:[0.90,1.25],kurve:'linear'}},[
  {n:6,gap:1.4,muster:'gerade',perle:true,perleEff:'zwilling',boden:{k:'fountain',gt:9,gh:0.4,A:'gold'},pause:0.8},
  {n:8,gap:0.5,muster:'welle',ang:0.25,perle:true,perleEff:'zwilling',splitDreh:0.785,farbe:1,pause:1.0},
  /* FINALE Zwillingsschauer: schnell, Split-Enden in Farbe, Fontaene wieder an */
  {n:8,gap:0.2,muster:'zufall',ang:0.15,perle:true,perleEff:'zwilling',splitDreh:0.785,farbe:2,boden:{k:'fountain',gt:3,gh:0.5,A:'zitrone'},pause:3.5}
]);
SIGNATUR.goldregen22={eff:'zwilling',text:'Leuchtkugel teilt sich in zwei'};

/* Level 22: Pfeifkonzert. 28.09. (Tom: echt): gerade Heulerschweife
   statt Spiralen, Crossetten statt der Punktspirale, Goldfontaene statt
   des Feuerrads in der Luft; Palmen golden mit gruenem Kern */
SHOWS.pfeifkonzert=()=>show({basis:{pw:3.05,sz:1.245,th:'wald'},rampe:{sz:[0.90,1.20],pw:[0,2],hell:[0.90,1.25],kurve:'welle'}},[
  /* Einstimmen: acht Heuler, jeder in einem anderen schiefen Ton */
  {n:8,gap:0.9,muster:'aussen',ang:0.35,steig:'heuler',ton:'stimmen',eff:'kugel',kal:'klein',farbe:0,boden:{k:'fountain',gt:8,A:'gold',B:'weiss'},pause:1.0},
  /* Piccolo: kurze, hohe Pfiffe, oben kleine Paeonien mit Pistill
     (28.09., Tom: echt - die Sternschnuppen standen als dicke weisse
     Sternfiguren mit geraden Strahlen am Himmel) */
  {n:16,gap:0.15,muster:'zufall',ang:0.35,kal:'mini',pw:-5,steig:'heuler',ton:'hoch',eff:'pistill',farbe:1,pause:1.2},
  /* Duett: oben Dreiklang-Heuler im V, unten brummende Bienen */
  {n:12,gap:1.2,muster:'v',ang:0.40,steig:'dreiklang',eff:'palme',A:'gold',B:'gruen',kal:'mittel'},
  {mit:true,n:12,gap:1.2,muster:'gerade',kal:'mini',pw:-7,steig:'heuler',ton:'tief',eff:'bienen',farbe:0,pause:0.8},
  /* Kreischwirbel: pfeifende Crossetten, Goldfontaene am Boden */
  {n:12,gap:0.35,muster:'w',ang:0.45,steig:'heuler',eff:'kreuzstern',A:'gold',B:'gruen',boden:{k:'fountain',gt:5,A:'gold',B:'zitrone'},pause:1.2},
  /* FINALE Dreiklang: zehn Heuler auf Schlag (Akkord), dann Ausklang mit fallendem Ton */
  {n:10,gap:0,muster:'schlag',ang:0.50,steig:'dreiklang',ton:'akkord',eff:'kamuro',kal:'gross',pw:4,farbe:0,pause:0.6},
  {n:10,gap:0.08,muster:'mitte',ang:0.40,steig:'heuler',ton:'fallend',eff:'chrys',farbe:0,pause:4.5}
]);
SIGNATUR.pfeifkonzert={eff:'dreiklang',text:'gestimmte Heuler mit dreifachem Tonwechsel'};

/* Level 22: Goetterfunken - "Ode an die Freude" in Bruchhoehen
   (Tonschritte ueber C, Dauer in Vierteln) */
const ODE_A={ton:[2,2,3,4, 4,3,2,1, 0,0,1,2, 2,1,1],dauer:[1,1,1,1, 1,1,1,1, 1,1,1,1, 1.5,0.5,2]};
const ODE_A2={ton:[2,2,3,4, 4,3,2,1, 0,0,1,2, 1,0,0],dauer:[1,1,1,1, 1,1,1,1, 1,1,1,1, 1.5,0.5,2]};
const ODE={ton:[...ODE_A.ton,...ODE_A2.ton],dauer:[...ODE_A.dauer,...ODE_A2.dauer]};
const ODE_BASS={ton:[0,0,-3,-3,0,0,-3,-3, 0,0,-3,-3,0,0,-3,0],dauer:Array(16).fill(2)};
SHOWS.profi=()=>show({basis:{pw:3.10,sz:1.250,th:'goetter'},rampe:{sz:[0.90,1.30],pw:[0,2],hell:[0.85,1.35],kurve:'linear'}},[
  /* Strophe 1 SOLO: eine Stimme, senkrecht, Hoehe = Ton, Kerzenlicht-Fontaene.
     27.09.: 2,5 m je Tonschritt statt 4 m, Schlussakkord 1,1 m je Halbton ohne pw -
     vorher brach der Akkord bei 53 m, hoeher als Kugel 200/300 (steigerung.js)
     28.09. (Tom: "Farben zu durcheinander"): Gold und Rot mit Weiss (Thema
     goetter) statt Gold, Rot, Blau, Violett */
  {n:0,ground:'fountain',gt:2.5,gh:0.5,gA:'gold',gB:'zitrone',pause:2.0},
  {n:30,muster:'gerade',hoehe:'melodie',noten:ODE,viertel:0.6,hStufe:2.5,pw:-3,eff:'pistill',kal:'klein',farbe:0,steig:'gold',boden:{k:'fountain',gt:8,gh:0.5,A:'gold',B:'weiss'},pause:2.0},   /* 28.09., Tom: "Effekt zu gross" - 8 s statt 20 s Fontaene ueber der Batterie */
  /* Zwischenspiel "Goetterfunken": knisternde Goldsterne im Scheibenwischer */
  {n:14,gap:0.2,muster:'wischer',seg:2,ang:0.40,eff:'drachenei',kal:'klein',pw:-2,farbe:1,pause:1.2},
  /* Strophe 2 DUETT: Melodie oben senkrecht, Bass in Halben tiefer im V */
  /* 28.09., Tom: echt - Chrysanthemen statt Dahlien: deren grosse
     Einzelsterne standen tief vor dem Zuendpult als gelbe Leuchtscheiben */
  {n:30,muster:'gerade',hoehe:'melodie',noten:ODE,viertel:0.5,hStufe:2.5,pw:-1,eff:'chrys',farbe:1},
  {mit:true,n:16,muster:'v',ang:0.45,hoehe:'melodie',noten:ODE_BASS,viertel:0.5,hStufe:2.5,pw:-6,kal:'klein',eff:'palme',farbe:0,pause:1.0},
  /* Zwischenspiel: Fontaene der Freude mitten in der Show, grosse Kronleuchter */
  {n:12,gap:1.3,muster:'aussen',ang:0.50,eff:'kronleuchter',kal:'gross',farbe:0,boden:{k:'fountain',gt:8,A:'gold',B:'weiss'},pause:1.5}, /* 28.09., Tom: "Effekt zu gross" - Silberfontaene statt Wasserfall: der spruehte 1,5 m breit ueber Tisch und Boden (Bodenbild) */
  /* KANON: linkes Modul beginnt, rechtes setzt zwei Viertel spaeter ein.
     28.09. (Tom: echt): die Module sind die zwei Kartonhaelften (x +-0,3 m,
     vorher +-8 m neben dem Karton); am Himmel trennt sie der Rohrwinkel */
  {n:15,muster:'gerade',x:-0.3,angOff:-0.28,hoehe:'melodie',noten:ODE_A,viertel:0.5,hStufe:2.5,eff:'brokat',farbe:0},
  {mit:1.0,n:15,muster:'x',ang:0.1,x:0.3,angOff:0.28,hoehe:'melodie',noten:ODE_A,viertel:0.5,hStufe:2.5,eff:'brokat',farbe:2,pause:1.0},
  /* Strophe 3 TUTTI: schneller, Melodie + Bass + Pauken + Feuertoepfe */
  {n:30,muster:'gerade',hoehe:'melodie',noten:ODE,viertel:0.38,hStufe:2.5,eff:'brokat',kal:'gross',farbe:0,mine:true,mineEff:'gold'},
  {mit:true,n:16,muster:'x',ang:0.50,hoehe:'melodie',noten:ODE_BASS,viertel:0.38,hStufe:2.5,pw:-2,eff:'kamuro',kal:'mittel',farbe:0},
  {n:0,pause:0.4},
  /* SCHLUSSAKKORD: neun Rohre im W, Hoehen C-E-G-C'-E'-C'-G-E-C, Riesenfontaene */
  {n:9,gap:0,muster:'w',ang:0.50,hoehe:'akkord',noten:{ton:[0,2,4,7,9,7,4,2,0]},eff:['brokat','dahlie','kamuro'],farbe:0,kal:'riesig',hStufe:1.1,pw:1,
   boden:{k:'riesen',gt:5,gh:1.3,A:'gold',B:'weiss',C:FW.rot},pause:1.5},
  /* Pauken zum Akkord: neun Kokosnuesse auf den Schlag (27.09.: vorher in der Tutti
     verteilt - so steht der Schlussakkord mit 18 Rohren, Dichte-Leiter steigerung.js) */
  {mit:true,n:9,gap:0,muster:'schlag',ang:0.50,eff:'kokosnuss',kal:'gross',pw:1,farbe:0,pause:0.6},
  /* Nachhall: vier langsame goldene Zeitregen */
  {n:4,gap:0.9,muster:'zufall',ang:0.30,eff:'zeitregen',kal:'gross',pw:4,farbe:1,pause:6}
]);
SIGNATUR.profi={muster:'melodie',text:'Ode an die Freude in Bruchhöhen'};

/* Level 23: Weidenwand */
SHOWS.kometenwand=()=>show({basis:{pw:3.50,sz:1.280,th:'gold'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[0.85,1.30],kurve:'spaet'}},[
  /* Mitte allein: grosse Weiden, Goldfontaene */
  {n:6,gap:2.0,x:0,muster:'gerade',eff:'weide',kal:'gross',boden:{k:'fountain',x:0,gt:12,A:'gold',B:'zitrone'},pause:0.6},
  /* links fragt ... */
  {n:8,gap:0.3,x:-0.26,angOff:-0.3,muster:'v',ang:0.28,eff:'strobeweide',farbe:1,pause:0.8},
  /* ... rechts antwortet */
  {n:8,gap:0.3,x:0.26,angOff:0.3,muster:'w',ang:0.28,eff:'strobeweide',farbe:1,pause:1.0},
  /* Mitte, dazu beide Seitenfontaenen (28.09.: ohne bunte Zufallssterne) */
  {n:10,gap:0.9,x:0,muster:'gerade',eff:['glitzerweide','weide'],kal:'gross',boden:[{k:'riesen',x:-0.26,gt:9,gh:0.8,C:FW.gold},{k:'riesen',x:0.26,gt:9,gh:0.8,C:FW.gold}],pause:1.2},
  /* Schlagabtausch: links/rechts im Wechsel, sehr schnell */
  {n:24,gap:0.15,x:[-0.26,0.26],angOff:[-0.3,0.3],muster:'zufall',ang:0.18,eff:'zeitregen',kal:'klein',pause:1.4},
  /* FINALE die Wand: Mitte Riesenweiden, beide Fluegel Blinkweiden, zwei Riesenfontaenen
     (28.09., Tom: echt - Module auf dem Karton, x +-0,26 m statt +-8 m; die
     Fluegel liegen am Himmel ueber den Rohrwinkel aussen) */
  {n:14,gap:0.12,x:0,muster:'mitte',ang:0.35,eff:'weide',kal:'riesig'},
  {mit:true,n:20,gap:0.085,x:[-0.26,0.26],angOff:[-0.32,0.32],muster:'aussen',ang:0.22,eff:'strobeweide',kal:'gross',boden:[{k:'riesen',x:-0.26,gt:4,C:FW.gold},{k:'riesen',x:0.26,gt:4,C:FW.gold}],pause:6.5}
]);
SIGNATUR.kometenwand={idee:'dreimodul',text:'drei Batterien im Dialog, Finale als Weidenwand'};

/* Level 23: Kaleidoskop. 28.09. (Tom: "Farben zu durcheinander"): je
   Phase ein Glaspaar - Rot/Tuerkis, Tuerkis/Gold, Rot/Gold (vorher acht
   Farben, bis sieben in 1,5 s); das Kaleidoskop ist ein Wechselpistill
   (zwei Farben tauschen die Plaetze) statt zwoelf Farbinseln; Gold-
   fontaenen statt des Feuerrads in der Luft */
SHOWS.sternenkaiser=()=>show({basis:{pw:3.55,sz:1.285,th:'kaiser'},rampe:{sz:[0.90,1.30],pw:[-1,3],hell:[0.90,1.35],kurve:'welle'}},[
  /* Akt 1 Drehung: einzelne Kaleidoskope, Goldfontaene am Boden */
  {n:8,gap:1.8,muster:'gerade',eff:'kaleidoskop',kal:'mittel',farbe:0,boden:{k:'fountain',gt:8,A:'gold',B:'weiss'},pause:1.0},   /* 28.09., Tom: "Effekt zu gross" - Fontaenen hoechstens 8 s (vorher 15-16 s ueber dem Verbund) */
  /* Akt 2 Spiegel: V-Paare, links Farbe A, rechts Farbe B */
  {n:34,gap:0.55,muster:'v',ang:0.40,eff:['kaleidoskop','pistill'],farbe:1,farbVert:'seite',pause:1.2},
  /* Akt 3 Facetten: oben W (Mitte andere Farbe), unten kleine Knister, zwei symmetrische Fontaenen */
  {n:20,gap:0.8,muster:'w',ang:0.45,farbVert:'mitte',eff:'dahlie',farbe:2},
  {mit:true,n:20,gap:0.8,muster:'gerade',kal:'mini',pw:-8,eff:'knister',farbe:2,boden:[{k:'fountain',gt:8,x:-0.33,A:'gold',B:'weiss'},{k:'fountain',gt:8,x:0.33,A:'gold',B:'weiss',t:5}],pause:0.6},
  /* Akt 4 Glassplitter: harte Goldspinnen, aussen nach innen, sehr schnell */
  /* 28.09., Tom: "Laser" - Chrysanthemen statt 44 Spinnen (Striche quer durchs Bild) */
  {n:44,gap:0.12,muster:'aussen',ang:0.55,eff:'chrys',farbe:0,pause:1.4},
  /* Akt 5 Rosette: riesige Einzel-Kaleidoskope */
  /* 28.09., Tom: echt - ohne die zwei Kugelbomben aus dem Karton: ihr
     Aufstieg stand als gleissend weisse Saeule neben dem Verbund */
  {n:12,gap:1.9,muster:'mitte',ang:0.35,eff:'kaleidoskop',kal:'riesig',pw:5,farbe:1,bruchOpt:{nachglitzer:false},pause:1.0},
  /* Akt 6 Doppelspiegel: Kreuzfeuer aus der ganzen Breite, Feuertoepfe, Knisterfontaenen symmetrisch */
  {n:48,gap:0.25,muster:'x',ang:0.50,rohre:'breit',eff:['kaleidoskop','brokat'],farbe:0,farbVert:'seite',mine:true,mineEff:'farbe',
   boden:[{k:'knisterbrunnen',gt:8,x:-0.33,A:'silber',B:'weiss'},{k:'knisterbrunnen',gt:8,x:0.33,A:'silber',B:'weiss'}],pause:1.5},
  /* FINALE Das grosse Fenster: 5 Achter-Salven Kaleidoskope, darunter Silberweiden im W, zwei Riesenfontaenen */
  {n:40,je:8,takt:[0.5],muster:'schlag',ang:0.60,eff:'kaleidoskop',kal:'gross',farbe:0,farbVert:'mitte'},
  {mit:true,n:24,gap:0.1,muster:'w',ang:0.55,kal:'klein',pw:-4,eff:'glitzerweide',farbe:0,boden:[{k:'riesen',gt:5,x:-0.33,C:FW.gold},{k:'riesen',gt:5,x:0.33,C:FW.gold}],pause:5}
]);
SIGNATUR.sternenkaiser={eff:'kaleidoskop',text:'zwei Farben tauschen die Plätze, alles spiegelgleich'};

/* Level 23: Geysirfeld (neu) - je:5 = eine Saeule, orte = x je Saeule,
   kal-Array je Schuss in der Saeule, boden.je = Geysir am Saeulenort.
   28.09. (Tom: echt): die Orte in echten Metern auf dem Karton (vorher
   +-12 m, auf die Oeffnung gestaucht standen alle Saeulen am selben
   Punkt); das Feld entsteht am Himmel aus dem Rohrwinkel (angOff) -
   die Saeulen faechern sich aus dem Karton bis +-20 Grad auf */
const GEYSIR_SAEULE=['knister','pistill','chrys','dahlie','brokat'], GEYSIR_KAL=['mini','klein','mittel','gross','riesig'];
SHOWS.geysirfeld=()=>show({basis:{pw:3.60,sz:1.290,th:'eis'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'frueh'}},[
  /* erstes Blubbern: drei Ausbrueche, Saeulen gerade */
  {n:15,je:5,gap:0.08,takt:[2.4],orte:[0,-0.15,0.15],angOff:[0,-0.2,0.2],muster:'treppe',hoehe:'steigend',hSpanne:20,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,farbe:0,boden:{k:'geysir',je:true,gt:2.0,gh:1.0,A:'weiss',B:'aqua'}},
  /* Dampf: Ruhe, zwei grosse Silberfontaenen aussen, Silberweiden im V (28.09.: ohne bunte Zufallssterne) */
  {n:6,gap:1.1,muster:'v',ang:0.40,eff:'glitzerweide',kal:'gross',farbe:0,boden:[{k:'riesen',x:-0.3,gt:6,A:'silber',C:FW.weiss},{k:'riesen',x:0.3,gt:6,A:'silber',C:FW.weiss}],pause:0.4},
  /* aktiv: 8 Ausbrueche, Saeulen faechern sich leicht auf, unten knistert der Boden */
  {n:40,je:5,gap:0.08,takt:[1.0,0.6,1.2],orte:[-0.3,0.15,-0.15,0.3,0,0.15,-0.3,-0.15],angOff:[-0.36,0.18,-0.18,0.36,0,0.18,-0.36,-0.18],muster:'mitte',ang:0.25,hoehe:'steigend',hSpanne:22,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,th:'gold',farbe:2,
   boden:{k:'geysir',je:true,gt:1.6,A:'weiss'}},
  {mit:true,n:30,gap:0.22,muster:'zufall',ang:0.30,kal:'mini',pw:-9,eff:'tausend',farbe:0},
  /* Kettenreaktion: 12 Ausbrueche in 5,4 s, ueberlappend */
  {n:60,je:5,gap:0.08,takt:[0.45],orte:[0.15,-0.3,0,0.3,-0.15,0.15,-0.3,0,0.3,-0.15,0,0.15],angOff:[0.18,-0.36,0,0.36,-0.18,0.18,-0.36,0,0.36,-0.18,0,0.18],muster:'treppe',hoehe:'steigend',hSpanne:25,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,farbe:1,
   boden:{k:'geysir',je:true,gt:1.4,A:'weiss',B:'tuerkis'}},
  {mit:true,n:24,gap:0.2,muster:'x',ang:0.50,rohre:'breit',kal:'klein',eff:'spinne',farbe:1},
  /* FINALE Grosser Ausbruch: alle fuenf Saeulen gleichzeitig, fuenf Geysire.
     Muster 'mitte' mit kleinem Winkel statt 'treppe' (Katalog): die Saeulen
     oeffnen sich zum Schluss wie Kelche, und die Kettenreaktion davor ist
     schon 'treppe' - kein Muster zweimal hintereinander */
  {n:25,je:5,gap:0.08,takt:[0],orte:[-0.3,-0.15,0,0.15,0.3],angOff:[-0.36,-0.18,0,0.18,0.36],muster:'mitte',ang:0.12,hoehe:'steigend',hSpanne:30,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,farbe:0,
   boden:{k:'geysir',je:true,gt:3,gh:1.4,A:'weiss',B:'aqua'},pause:5}
]);
SIGNATUR.geysirfeld={idee:'geysir',text:'Ausbruch am Boden, darüber eine Säule aus fünf Schüssen'};

/* Level 24: Weltuntergang. 28.09. (Tom: "Weltuntergang nur Schuesse",
   "Lichtshow"): ohne rotes Bengallicht, Flammen- und Vulkanfontaenen am
   Boden; die Meteore sind Kometen aus einer Kometenbombe und verloeschen in
   der Luft (vorher Einschlaege im Feld, bis 17 m neben dem Produkt); der
   Schluss ist eine Traube aus Titanschlaegen (vorher Vollbild-Weiss und
   alle Sterne geloescht); Chrysanthemen statt stehender Flammenbaelle */
SHOWS.finale=()=>show({basis:{pw:4.00,sz:1.320,th:'meteor'},rampe:{sz:[0.85,1.35],pw:[0,4],hell:[0.60,1.45],kurve:'spaet'}},[
  /* Akt 1 Vorzeichen: dunkle Blueten, die erst glimmen und ploetzlich aufgehen */
  /* 27.09.: gap 1,4 statt 2,4 und pw 5 statt 8 - vorher 30 s fast leerer Himmel
     zum Auftakt des groessten Produkts, und die Blueten lagen am oberen Bildrand */
  /* 28.09., Tom: echt - dichter (vorher 17 s mit je einem Bruch alle 1,4 s),
     dazwischen tiefe Glut-Chrysanthemen */
  {n:12,gap:0.9,muster:'zufall',ang:0.40,pw:3,eff:'gamboge',farbe:1,steig:'keiner'},
  {mit:0.45,n:8,gap:1.3,muster:'v',ang:0.35,pw:-2,eff:'chrys',kal:'klein',farbe:1,pause:0.6},
  /* Akt 2 Sternfall: Meteore, immer dichter */
  /* 28.09. (Probebild): Meteore im Wechsel mit Glut-Chrysanthemen und
     mittelgross - kleine Meteore allein liessen den Himmel fast leer */
  {n:30,gap:0.75,gapEnde:0.25,muster:'welle',ang:0.50,pw:4,eff:['meteor','chrys'],kal:'mittel',farbe:0,pause:1.0},
  /* Akt 2b Kometenhagel: harte Goldspinnen und Meteore im Zickzack */
  {n:40,gap:0.12,muster:'z',seg:3,ang:0.50,eff:['brokat','meteor'],kal:'mittel',farbe:0,steig:'komet',pause:1.5}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  /* Akt 3 Erdbeben: tief rumpelnd, Glut-Feuertoepfe, oben fallen weiter Meteore */
  {n:36,gap:0.3,muster:'gerade',kal:'klein',pw:-3,eff:'tausend',farbe:1,mine:true,mineEff:'glut'},
  {mit:true,n:8,gap:1.35,muster:'aussen',ang:0.50,eff:'meteor',kal:'mittel',farbe:0,pause:0.3},
  /* Akt 4 Feuersturm: Kreuzfeuer ueber die ganze Breite, unten stuerzen Truemmer */
  {n:48,gap:0.2,muster:'x',ang:0.50,rohre:'breit',pw:2,eff:['chrys','meteor','kamuro'],kal:'gross',farbe:1},
  {mit:true,n:24,gap:0.4,muster:'v',ang:0.60,kal:'klein',pw:-1,eff:'kaskade',farbe:2,pause:1.0},
  /* Akt 5 Die grossen Brocken: vier grosse Meteore */
  /* 28.09., Tom: echt - grosse Kometenbomben aus dem Karton statt
     Kugelbomben: deren dicker Aufstieg stand als gleissend weisse Saeule
     neben dem Verbund (Bodenbild) */
  /* 28.09., Tom: echt - die Brocken fallen durch haengende Goldweiden
     (vorher 13 s mit vier Bruechen und 3 s Stille: ein Loch in der Show) */
  {n:4,gap:1.2,muster:'gerade',eff:'meteor',kal:'riesig',pw:4,farbe:0},
  {mit:true,n:12,gap:0.4,muster:'aussen',ang:0.45,eff:'kamuro',kal:'gross',pw:1,farbe:0,pause:0.8},
  /* Akt 6 Stille - ein Atemzug */
  {n:0,pause:1.5},
  /* Akt 7 Einschlag: 72 Meteore in 3,6 s von der Mitte nach aussen, weisse Feuertoepfe - dann der Weltenblitz */
  /* 27.09.: gap 0,04 und pw 4 - dichtester und hoechster Moment der Show
     (Dichte- und Hoehenleiter, Steigerung im Ablauf: steigerung.js) */
  {n:72,gap:0.04,muster:'mitte',ang:0.60,pw:6,eff:'meteor',kal:'gross',farbe:0,mine:true,mineEff:'silber'},
  {at:'ende',n:1,muster:'gerade',eff:'weltenblitz',kal:'riesig',pw:4,pause:1.0},
  /* Akt 8 Asche: glimmende Flocken sinken langsam, kein Knall */
  /* 28.09., Tom: echt - fuenf Aschebrueche zugleich statt 25 ueber 9 s
     (15 s schwebende Glutpunkte nach dem Schluss wirkten wie Lichtshow) */
  {n:5,gap:0.2,muster:'zufall',ang:0.60,pw:8,eff:'glutasche',kal:'gross',steig:'keiner',pause:6}
]);
SIGNATUR.finale={eff:'meteor',text:'Kometenbomben: Meteore mit Glutschweif stürzen schräg herab'};

/* Level 25: Silvesternacht. 28.09. (Tom: echt): Roemisches Licht in Gold
   statt bunt, ohne weisses Bengal-Dauerlicht, Glockenschlag ohne Ring */
SHOWS.silvesternacht=()=>show({basis:{pw:4.50,sz:1.360,th:'gold'},rampe:{sz:[0.90,1.30],pw:[0,3],hell:[0.90,1.40],kurve:'spaet'}},[
  /* Vorabend: Goldfontaene und Tortenfontaene, dazu ein Roemisches Licht */
  {n:6,gap:1.2,muster:'zufall',ang:0.25,perle:true,farbe:0,boden:[{k:'fountain',gt:10,A:'gold',B:'zitrone',x:-0.17},{k:'torte',gt:10,A:'silber',x:0.17}],pause:1.0},
  /* Raketen: vier hohe Einzelschuesse mit langem Goldschweif */
  {n:4,gap:1.6,muster:'mitte',ang:0.35,steig:'gold',fuse:2.2,eff:'chrys',kal:'mittel',farbe:0,pause:1.0},
  /* Tanz ins neue Jahr: kleine Batterie im V */
  {n:6,gap:0.4,muster:'v',ang:0.35,eff:'palme',farbe:1,pause:1.5},
  /* ZWOELF SCHLAEGE: senkrecht, im Glockentakt */
  {n:12,gap:1.7,muster:'gerade',eff:'glockenschlag',kal:'gross',pw:4,steig:'keiner'},
  /* FINALE Mitternacht: beim 12. Schlag alles auf einmal, zwei Riesenfontaenen
     (28.09.: auf dem Karton, vorher drei bei x -4/0/4 m) */
  {at:'ende',n:12,gap:0.05,muster:'w',ang:0.60,eff:['kamuro','dahlie','brokat'],kal:'riesig',farbe:2,mine:true,mineEff:'gold',
   boden:[{k:'riesen',gt:5,x:-0.17,C:FW.gold},{k:'riesen',gt:5,x:0.17,C:FW.gold}],pause:5.5}
]);
SIGNATUR.silvesternacht={eff:'glockenschlag',text:'zwölf Glockenschläge bis Mitternacht'};

/* Level 25: Kometengitter. 28.09. (Tom: "Laser"): Titan- und Glitzer-
   kometen mit echten Funkenschweifen statt gerader Laserlinien, Tuerkis
   und Silber (vorher Tuerkis, Magenta, Gruen, Violett), ohne gruenes
   Bengallicht; der Name ohne "Licht" und "Laser" */
SHOWS.himmelsfaecher=()=>show({basis:{pw:4.55,sz:1.365,th:'gitter'},rampe:{sz:[0.90,1.30],pw:[0,3],hell:[0.95,1.40],kurve:'linear'}},[
  /* erster Komet */
  {n:6,gap:2.0,x:0,muster:'gerade',eff:'rohrkomet',art:'silber',farbe:1,boden:{k:'fountain',gt:6,A:'silber',B:'weiss'},pause:1.0},
  /* Rauten: Kreuzfeuer aus der ganzen Breite, links tuerkise Koepfe, rechts Silber */
  {n:24,gap:0.4,muster:'x',ang:0.50,rohre:'breit',eff:'rohrkomet',art:'farbe',farbe:0,pause:1.2},
  /* Knoten: Kometen kreuzen sich, an den Kreuzungen Spinnen, zwei Fontaenen */
  {n:20,gap:0.7,muster:'w',ang:0.45,eff:'kreuzstern',farbe:1}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  {mit:true,n:20,gap:0.7,muster:'x',ang:0.50,rohre:'breit',eff:'rohrkomet',art:'glitter',boden:[{k:'fountain',x:-0.32,gt:7,A:'gold',B:'weiss'},{k:'fountain',x:0.32,gt:7,A:'gold',B:'weiss',t:4}],pause:1.0},   /* 28.09., Tom: "Effekt zu gross" - 7 s versetzt statt 14 s zugleich */
  /* Gitter: drei Module, je Modul ein V, fuenf Sechser-Salven (28.09.: die
     Module sind Kartondrittel, x -0,3/0/0,3 m statt -10/0/10 m; am Himmel
     liegen ihre V ueber den Rohrwinkel nebeneinander) */
  {n:30,je:6,takt:[0.9],x:[-0.3,0,0.3],angOff:[-0.42,0,0.42],muster:'v',ang:0.3,eff:'rohrkomet',art:'silber',pause:1.4},
  /* Ruhe im Netz: Silberfontaene mitten in der Show, oben Kronleuchter, unten kleine Blinker */
  {n:12,gap:1.5,muster:'gerade',eff:'kronleuchter',kal:'gross',farbe:0,boden:{k:'fountain',gt:8,A:'silber',B:'weiss'}}, /* 28.09., Tom: "Effekt zu gross" - Silberfontaene statt Wasserfall: der spruehte 1,5 m breit ueber Tisch und Boden (Bodenbild) */
  {mit:true,n:12,gap:1.5,muster:'zufall',ang:0.35,kal:'mini',pw:-7,eff:'blinkregen',farbe:1,pause:0.8},
  /* Gangwechsel: das Netz verdichtet sich, Feuertoepfe */
  {n:30,gap:0.1,muster:'x',ang:0.55,rohre:'breit',eff:['rohrkomet','kreuzstern'],art:'silber',farbe:2,mine:true,mineEff:'farbe',pause:1.4}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  /* FINALE Netz zieht sich zu: zwei Zwoelfer-Salven Glitzerkometen von beiden Seiten, Riesen-Dahlien im Kreuzungspunkt */
  {n:24,je:12,takt:[0.8],x:[-0.3,0.3],angOff:[-0.15,0.15],muster:'schlag',ang:0.55,eff:'rohrkomet',art:'glitter',kal:'gross'},
  {mit:0.6,n:2,gap:0.8,muster:'gerade',eff:'dahlie',kal:'riesig',pw:4,farbe:0,boden:[{k:'riesen',x:-0.32,gt:4,C:FW.tuerkis},{k:'riesen',x:0.32,gt:4,C:FW.tuerkis}],pause:5}
]);
SIGNATUR.himmelsfaecher={idee:'gitter',text:'Titankometen aus drei Positionen spannen ein Netz'};

/* Level 26: Finale Grande - komplett neu (29.09., Tom: "teils keine
   Lichteffekte, keine Abschuesse, viel schoener und einzigartiger").
   Fuenf italienische Zylinderbomben, uno bis cinque: jede steigt mit
   dickem Goldschweif sichtbar auf, bricht in Sichthoehe (vorher 32 m,
   oben aus dem Bild), jeder Schlag in einer eigenen Farbe der Tricolore
   und leicht seitlich versetzt, sodass die Schlaege nebeneinander stehen
   statt uebereinander aus dem Bild zu wandern. Zwischen den Bomben keine
   Dunkelpausen, sondern kurze Kometenfaecher in Gruen-Weiss-Rot. */
const FG_BOMBE=(k,o)=>Object.assign({n:1,muster:'gerade',bomb:k<3?3:k<5?4:5,bombEff:'mehrschlag',schlaege:k,dick:3,trail:'gold',
  bruchOpt:{flash:1.8}},o);
SHOWS.kugelfinale=()=>show({basis:{pw:4.0,sz:1.34,th:'tricolore'},rampe:{sz:[0.95,1.25],pw:[0,2],hell:[1.0,1.4],kurve:'linear'}},[
  /* Auftakt: drei Kometen in den Landesfarben faechern auf */
  {n:3,gap:0.18,muster:'v',ang:0.32,eff:'rohrkomet',art:'farbe',farbe:0,pause:0.6},
  /* UNO - gruene Dahlie mit weissem Kern */
  FG_BOMBE(1,{bombPw:-2.5,bombSz:2.6,bombStufen:['dahlie'],schlag:{farben:[['gruen','weiss']]},pause:2.2}),
  {n:5,gap:0.14,muster:'w',ang:0.40,eff:'rohrkomet',art:'glitter',pause:0.8},
  /* DUE - rote Chrysantheme, dann goldene Glitzerweide */
  FG_BOMBE(2,{bombPw:-2,bombSz:2.8,bombStufen:['chrys','glitzerweide'],schlag:{dy:[3,4],dx:1.6,dt:[0.7,0.8],farben:[['rot','weiss'],['gold','gold']]},pause:2.4}),
  {n:6,gap:0.12,muster:'x',ang:0.45,eff:'kreuzstern',farbe:1,pause:0.8},
  /* TRE - weisser Pistill, gruene Dahlie, roter Blinkregen */
  FG_BOMBE(3,{bombPw:-2,bombSz:3.0,bombStufen:['pistill','dahlie','blinkregen'],schlag:{dy:[3,4],dx:2,dt:[0.65,0.8],farben:[['weiss','weiss'],['gruen','weiss'],['rot','rot']]},pause:2.6}),
  {n:8,gap:0.1,muster:'zufall',ang:0.45,eff:'rohrkomet',art:'silber',pause:0.8},
  /* QUATTRO - Goldkamuro, gruene Dahlie, roter Pistill, weisser Zeitregen */
  FG_BOMBE(4,{bombPw:-2.2,bombSz:3.2,bombStufen:['kamuro','dahlie','pistill','zeitregen'],schlag:{dy:[3,4],dx:2.5,dt:[0.6,0.75],farben:[['gold','gold'],['gruen','weiss'],['rot','weiss'],['weiss','weiss']]},pause:2.8}),
  /* Vorfinale: zwei Zwoelfersalven Kometen in den Landesfarben */
  {n:24,je:12,takt:[0.9],x:[-0.2,0.2],angOff:[-0.25,0.25],muster:'schlag',ang:0.5,eff:'rohrkomet',art:'farbe',farbe:2,pause:1.2},
  /* CINQUE - fuenf wachsende Schlaege, der letzte ist der Donnerschlag;
     darunter brennen drei Bengalfeuer in Gruen, Weiss, Rot (zweite Ebene:
     der Boden leuchtet in der Tricolore, der Rauch steht im Licht) */
  FG_BOMBE(5,{boden:[{k:'bengal',x:-0.3,gt:12,A:'gruen'},{k:'bengal',x:0,gt:12,A:'weiss'},{k:'bengal',x:0.3,gt:12,A:'rot'}],bombPw:-2.6,bombSz:3.4,bombStufen:['dahlie','kronleuchter','brokat','glitzerweide','schlussschlag'],schlag:{dy:[3,4],dx:2.5,dt:[0.6,0.7],wachsen:true,farben:[['gruen','weiss'],['weiss','weiss'],['gold','gold'],['rot','gold'],['weiss','weiss']]},pause:8})
]);
SIGNATUR.kugelfinale={eff:'mehrschlag',text:'eins, zwei, drei, vier, fünf Schläge übereinander'};

/* Level 26: Wolkenkratzer (neu) - farbe 0..3 = Etage im Thema hochhaus.
   28.09. (Tom: "Farben zu durcheinander"): Etagen ueber die Hoehe, nicht
   ueber vier Farben - Rot, Weiss/Silber und Gold (vorher Gold, Rot, Weiss,
   Blau und Violett zugleich) */
SHOWS.wolkenkratzer=()=>show({basis:{pw:5.05,sz:1.405,th:'hochhaus'},rampe:{sz:[0.95,1.30],pw:[0,2],hell:[0.90,1.40],kurve:'frueh'}},[
  /* Fundament: zwei goldene Fontaenen an den Kartonecken laufen die ganze Show
     (28.09., Tom: echt - vorher vier bei x -6..6 m, gestaucht 10 cm auseinander) */
  /* 28.09., Tom: "Effekt zu gross" - 10 s zum Auftakt statt 36 s: zwei
     Goldfontaenen die ganze Show ueber dem Karton ueberstrahlten die Etagen */
  {n:0,boden:[{k:'fountain',x:-0.3,gt:10,A:'gold',B:'zitrone'},{k:'fountain',x:0.3,gt:10,A:'gold',B:'zitrone'}],pause:1.5},
  /* 1. Etage: rote Feuertoepfe im Scheibenwischer */
  {n:24,gap:0.25,nurMine:true,mineEff:'farbe',muster:'wischer',seg:2,ang:0.40,farbe:1},
  /* 2. Etage kommt dazu (1. laeuft weiter) */
  /* 28.09., Tom: echt - Pistill statt Dahlie: die grossen Dahliensterne
     fielen aus der tiefen Etage bis vor das Zuendpult (Leuchtscheiben) */
  {n:30,gap:0.3,muster:'w',ang:0.35,kal:'mittel',pw:-2,eff:['pistill','chrys'],farbe:2},
  {mit:true,n:30,gap:0.2,nurMine:true,mineEff:'farbe',muster:'zufall',ang:0.30,farbe:1},
  /* Dach: goldene Kronleuchter im Penthouse, darunter beide Etagen dicht */
  {n:8,gap:1.1,muster:'gerade',kal:'riesig',pw:6,eff:'kronleuchter',farbe:3},
  {mit:true,n:40,gap:0.22,muster:'v',ang:0.35,kal:'mittel',pw:-2,eff:['palme','chrys'],farbe:0}, /* 28.09., Tom: "Laser" - keine Spinne (Striche quer durchs Bild) */
  {mit:true,n:40,gap:0.22,nurMine:true,mineEff:'farbe',muster:'x',ang:0.35,farbe:1},
  /* FINALE Alle Lichter an: alle Etagen maximal */
  {n:12,gap:0.25,muster:'mitte',ang:0.40,kal:'riesig',pw:6,eff:'dahlie',farbe:2},
  {mit:true,n:24,gap:0.12,muster:'z',seg:2,ang:0.40,kal:'mittel',eff:'brokat',farbe:3},
  {mit:true,n:24,gap:0.12,nurMine:true,mineEff:'farbe',muster:'welle',ang:0.40,farbe:1,boden:[{k:'riesen',x:-0.3,gt:3,C:FW.rot},{k:'riesen',x:0.3,gt:3,C:FW.rot}]},
  /* Turmspitze: ganz oben acht kleine rot-weisse Pistille, ueber allem
     (28.09.: statt eines rot blinkenden Flugwarnlichts - das war Licht-
     show, kein Feuerwerk) */
  {n:8,gap:0.4,muster:'gerade',kal:'klein',pw:14,eff:'pistill',th:'rotweiss',farbe:0,pause:5}
]);
SIGNATUR.wolkenkratzer={idee:'etagen',text:'vier Etagen übereinander, gleichzeitig'};

/* Tabelle SHOW_BASIS an die Drehbuecher angleichen: die Grundstufe steht
   jetzt im Drehbuch (basis) und steigt mit dem Level. 14c hat seine
   Werte (neuBasis) vorher schon aus der alten Tabelle gerechnet. */
['faecher','silberwirbel','sternenmeer80','familienmix','hagelsturm','regenbogenfaecher','zfaecher','batterie100','kreuzfeuer','lichterkugeln',
 'donnerschlag','goldenerregen','kometen','hochzeitsfaecher','donnerwand','feuerpfau','hexenkessel','blitzgewitter60','nordlicht','goldregen22',
 'pfeifkonzert','profi','kometenwand','sternenkaiser','geysirfeld','finale','silvesternacht','himmelsfaecher','kugelfinale','wolkenkratzer'].forEach(t=>{
  const b=SHOWS[t]&&SHOWS[t]().basis; if(b) SHOW_BASIS[t]={pw:b.pw,sz:b.sz,th:b.th}; });

/* =========================================================
   Kerzen-Batterien (30.09., Tom): die Legion - alle Kerzenarten als Heer -
   und drei reine Shows aus grossen Roemischen Lichtern OHNE Knall ("eine
   schoene Show aus roemischen Lichtern, ohne Knalle"). Jede hat ihre
   eigenen Kerzenarten (perleSchuss): Lichterprozession grosse Kugeln und
   schwebende Perlen, Kometenreigen Kometen- und Weidenkerzen, Sternentor
   Farbwechsel- und Sternkerzen. Grundstufe passend zum Level.
   ========================================================= */
Object.assign(THEMEN,{
  legion:[['gold','rot'],['silber','weiss'],['gold','weiss'],['rot','gold']],
  prozession:[['gold','rose'],['tuerkis','gold'],['rose','weiss']],
  reigen:[['gold','bernstein'],['silber','gold'],['bernstein','rot'],['gold','weiss']],
  sternentor:[['himmel','violett'],['gold','tuerkis'],['magenta','gold'],['weiss','himmel']]
});
/* Level 26: Legion. Das Extrem: alle Kerzenarten als Heer - Weidenkerzen
   zwischen zwei Riesenfontaenen, ein Wischer aus Blinkkerzen, Riesen-
   Kamuros, ein Kreis aus Kreuzkerzen ueber dem Vulkan, Bombetten im W,
   Pfeifkerzen darunter, Fischkerzen im V mit Titanschlaegen - und ein
   Finale aus 48 Weidenkerzen, 36 Knallkerzen und zwoelf Riesen-Kamuros. */
SHOWS.legion=()=>show({basis:{pw:4.2,sz:1.36,th:'legion'},rampe:{sz:[0.95,1.35],pw:[0,3],hell:[0.9,1.45],kurve:'spaet'}},[
  {n:12,perle:true,perleEff:'weidenperle',gap:0.45,muster:'aussen',ang:0.18,farbe:0,
    boden:[{k:'riesen',x:-0.35,gt:7,gh:0.8,A:'gold',B:'weiss',C:FW.gold},{k:'riesen',x:0.35,gt:7,gh:0.8,A:'gold',B:'weiss',C:FW.gold,t:0.5}]},
  {n:24,perle:true,perleEff:'blinkperle',gap:0.12,muster:'wischer',ang:0.35,farbe:1},
  {mit:true,n:6,gap:0.8,muster:'gerade',eff:'kamuro',kal:'riesig',pw:3,farbe:2,pause:0.8},
  {n:30,takt:[0.1,0.1,0.1,0.5],perle:true,perleEff:'kometperle',muster:'kreis',ang:0.3,farbe:3,boden:{k:'volcano',gt:6,A:'rot',B:'gold'}},
  {n:20,perle:true,perleEff:'bombette',gap:0.2,muster:'w',ang:0.35,farbe:0,wechsel:true},
  {mit:true,n:20,perle:true,perleEff:'pfeifperle',gap:0.2,muster:'zufall',ang:0.2,farbe:1,pause:0.6},
  {n:24,perle:true,perleEff:'fischperle',gap:0.15,muster:'v',ang:0.35,farbe:1},
  {mit:true,n:8,gap:0.45,muster:'paar',ang:0.35,eff:'titanschlag',kal:'gross',pw:3,farbe:2,pause:1.5},
  {n:48,perle:true,perleEff:'weidenperle',gap:0.05,muster:'schlag',ang:0.4,farbe:2,
    boden:[{k:'riesen',x:-0.35,gt:5,gh:1.0,A:'gold',B:'weiss',C:FW.gold},{k:'riesen',x:0.35,gt:5,gh:1.0,A:'gold',B:'weiss',C:FW.gold}]},
  {mit:true,n:36,perle:true,perleEff:'knallperle',gap:0.07,muster:'x',ang:0.35,farbe:0},
  {mit:true,n:12,gap:0.25,muster:'mitte',ang:0.3,eff:'kamuro',kal:'riesig',pw:4,farbe:2,pause:6}
]);
SIGNATUR.legion={eff:'weidenperle',text:'Ein Heer aus Kerzen: Weiden-, Blink-, Kreuz-, Bombetten-, Pfeif- und Fischkerzen'};

/* Level 17: Lichterprozession. Grosse Leuchtkugeln steigen in Reihen,
   Treppen und Wellen, schwebende Perlen haengen als Girlanden; Finale:
   sechzehn Grosskerzen auf Schlag ueber zwei Goldfontaenen, darueber acht
   aus der Mitte. Klang: nur das dumpfe Ploppen der Rohre und die Fontaenen. */
SHOWS.lichterprozession=()=>show({basis:{pw:0.6,sz:1.05,th:'prozession'},rampe:{sz:[0.9,1.2],pw:[0,1.5],hell:[0.85,1.25],kurve:'spaet'}},[
  {n:8,perle:true,perleEff:'grossperle',gap:0.7,muster:'gerade',rohrFolge:[-1,1,-0.5,0.5,-0.2,0.2,-0.8,0.8],farbe:0,boden:{k:'fountain',gt:6,gh:0.7,A:'gold',B:'weiss'}},
  {n:6,perle:true,perleEff:'schwebeperle',gap:0.9,muster:'aussen',ang:0.25,farbe:2},
  {n:14,perle:true,perleEff:'grossperle',gap:0.2,muster:'treppe',ang:0.3,farbe:1},
  {mit:true,n:12,perle:true,perleEff:'schwebeperle',gap:0.35,muster:'welle',ang:0.3,farbe:0,pause:1.0},
  {n:16,perle:true,perleEff:'grossperle',gap:0.08,muster:'schlag',ang:0.35,farbe:2,
    boden:[{k:'fountain',gt:4,gh:1.0,x:-0.2,A:'gold',B:'rose'},{k:'fountain',gt:4,gh:1.0,x:0.2,A:'gold',B:'rose'}]},
  {mit:true,n:8,perle:true,perleEff:'grossperle',gap:0.25,muster:'mitte',ang:0.2,farbe:1,pause:4}
]);
SIGNATUR.lichterprozession={eff:'grossperle',text:'Große Leuchtkugeln in Reihen und schwebende Perlen-Girlanden – ohne Knall'};

/* Level 21: Kometenreigen. Brokat-Kometenkerzen mit langem Glitzer-
   schweif kreuzen sich, Weidenkerzen fallen als kleine Trauerweiden
   auseinander, ein Kometenkreis ueber dem Vulkan; Finale: 24 Kometen
   in der Spirale, dazu acht Weiden aus der Mitte. Klang: Rauschen, Rieseln. */
SHOWS.kometenreigen=()=>show({basis:{pw:2.4,sz:1.19,th:'reigen'},rampe:{sz:[0.9,1.3],pw:[0,2],hell:[0.85,1.35],kurve:'spaet'}},[
  {n:10,perle:true,perleEff:'schweifperle',gap:0.6,muster:'aussen',ang:0.22,farbe:0,boden:{k:'fountain',gt:6,gh:0.8,A:'gold',B:'weiss'}},
  {n:16,perle:true,perleEff:'schweifperle',gap:0.18,muster:'x',ang:0.38,farbe:1},
  {mit:true,n:8,perle:true,perleEff:'weidenperle',gap:0.6,muster:'gerade',farbe:2,pause:0.8},
  {n:18,takt:[0.12,0.12,0.5],perle:true,perleEff:'schweifperle',muster:'kreis',ang:0.3,farbe:3,boden:{k:'volcano',gt:5,A:'gold',B:'rot'}},
  {n:12,perle:true,perleEff:'weidenperle',gap:0.5,muster:'v',ang:0.3,farbe:1},
  {n:24,perle:true,perleEff:'schweifperle',gap:0.06,muster:'spirale',ang:0.4,farbe:0},
  {mit:true,n:8,perle:true,perleEff:'weidenperle',gap:0.2,muster:'mitte',ang:0.15,farbe:2,pause:5}
]);
SIGNATUR.kometenreigen={eff:'schweifperle',text:'Kometenkerzen mit Glitzerschweif und kleine Trauerweiden – ohne Knall'};

/* Level 24: Sternentor. Farbwechsel-Kerzen wischen ueber den Himmel,
   Sternkerzen oeffnen sich oben zu fuenfzackigen Sternen, zwei Riesen-
   fontaenen bilden das Tor; Finale: 36 Farbwechsel-Kerzen auf Schlag,
   sechzehn Sternkerzen im X und acht aus der Mitte. */
SHOWS.sternentor=()=>show({basis:{pw:3.8,sz:1.31,th:'sternentor'},rampe:{sz:[0.95,1.35],pw:[0,2.5],hell:[0.9,1.4],kurve:'spaet'}},[
  {n:12,perle:true,perleEff:'farbperle',gap:0.5,muster:'mitte',ang:0.25,farbe:0,
    boden:[{k:'riesen',x:-0.35,gt:7,gh:0.8,A:'weiss',B:'himmel',C:FW.silber},{k:'riesen',x:0.35,gt:7,gh:0.8,A:'weiss',B:'himmel',C:FW.silber,t:0.5}]},
  {n:24,perle:true,perleEff:'farbperle',gap:0.12,muster:'wischer',ang:0.35,farbe:1},
  {mit:true,n:10,perle:true,perleEff:'sternperle',gap:0.7,muster:'w',ang:0.3,farbe:2,pause:0.8},
  {n:20,perle:true,perleEff:'sternperle',gap:0.25,muster:'paar',ang:0.35,farbe:3},
  {mit:true,n:10,perle:true,perleEff:'farbperle',gap:0.5,muster:'gerade',farbe:0,boden:{k:'volcano',gt:5,A:'gold',B:'violett'}},
  {n:24,takt:[0.1,0.1,0.1,0.45],perle:true,perleEff:'sternperle',muster:'kreis',ang:0.3,farbe:1},
  {n:36,perle:true,perleEff:'farbperle',gap:0.05,muster:'schlag',ang:0.4,farbe:2,
    boden:[{k:'riesen',x:-0.35,gt:5,gh:1.0,A:'weiss',B:'himmel',C:FW.silber},{k:'riesen',x:0.35,gt:5,gh:1.0,A:'weiss',B:'himmel',C:FW.silber}]},
  {mit:true,n:16,perle:true,perleEff:'sternperle',gap:0.12,muster:'x',ang:0.35,farbe:0},
  {mit:true,n:8,perle:true,perleEff:'farbperle',gap:0.3,muster:'mitte',ang:0.15,farbe:3,pause:6}
]);
SIGNATUR.sternentor={eff:'farbperle',text:'Farbwechsel- und Sternkerzen zwischen zwei Riesenfontänen – ohne Knall'};

/* =========================================================
   15 Muster-Batterien (30.09., Tom: "15 neue Batterien mit ganz neuen
   Effekten, ueberrasch mich, extrem schoen - jede Batterie komplett andere
   Effekte, in jeder Batterie jeweils der gleiche Effekt-Typ; ich sag dir
   am Ende, welche am schoensten sind"). Jede zeigt genau ein neues
   Bruchbild in verschiedenen Mustern und Takten. Nur fuer die Testsektion
   (nicht bestellbar). Alles echte Physik: Sterne fliegen ballistisch mit
   Luftwiderstand (sternNach), keine gelenkte Bewegung.
   ========================================================= */

/* 1 Funkelregen: langsame Silbersterne, die unregelmaessig aufblitzen -
   jeder Stern funkelt fuer sich, wie Glitzer im Licht (japanisch kirakira) */
EFF.funkelregen=function(p,A,B,s,r){
  grOhneZutaten(r,0.5);
  const q=QUAL(), G=1.6, n=Math.round(150*s*q);
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(8,10.5)*s, v=[d[0]*w,d[1]*w,d[2]*w], T=rand(3.6,4.6), c=i%4?A:B;
    grSpur(0.22,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*0.95,c[1]*0.95,c[2]*1.0,T,G,4));
    const blitze=Math.round(rand(3,5)*q);
    for(let k=0;k<blitze;k++){ const t=rand(0.5,T-0.2); kgSpaeter(t,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,t);
      grSpur(0,()=>{ psHuge.emit(e.x,e.y,e.z,0,-0.2,0,1.8,1.8,1.9,0.08,0,0);
        for(let j=0;j<3;j++){ const dd=randDir(); psSmall.emit(e.x,e.y,e.z,dd[0]*1.6,dd[1]*1.6,dd[2]*1.6,1.3,1.3,1.4,0.1,0,0); } }); }); } }
  schall(p,v=>{ sfx.rieseln(v*0.5,4); later(0.8,()=>sfx.crackle(v*0.12)); });
};

/* 2 Tigerschweif: zehn schwere Goldkometen mit so dichtem Glitzerschweif,
   dass jeder als breites, gestreiftes Funkenband am Himmel stehen bleibt
   und langsam herabrieselt */
EFF.tigerschweif=function(p,A,B,s,r){
  grOhneZutaten(r,0.7);
  const q=QUAL(), G=3, n=Math.round(rand(9,12));
  for(let i=0;i<n;i++){ const d=randDir(); d[1]=d[1]*0.7+0.25; const l=Math.hypot(d[0],d[1],d[2]), w=rand(13,15.5)*s/l, v=[d[0]*w,d[1]*w,d[2]*w], T=rand(1.7,2.1);
    for(let k=0;k<2;k++) kgStern(psHuge,p,v,kgMal(A,1.35),T,G,0,0.25);
    rkFunken(p,v,G,0.03,T,85,mischF(A,[1,.8,.4],0.5),{life:[0.9,1.6],g:1.1,streu:0.5,mit:0.06,mode:4});
    kgSpaeter(T,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T); for(let j=0;j<Math.round(10*q);j++){ const dd=randDir(), ww=rand(1,2.5); psMid.emit(e.x,e.y,e.z,dd[0]*ww,dd[1]*ww,dd[2]*ww,B[0],B[1],B[2],rand(0.5,0.9),2,4); } }); }
  schall(p,v=>{ sfx.boom(v*0.45); sfx.fauchen(v*0.45,1.6); later(1.2,()=>sfx.rieseln(v*0.5,3)); });
};

/* 3 Seerose: ein flacher Ringbruch waagerecht - von unten gesehen eine
   sich oeffnende Blume -, darin ein kleinerer weisser Kranz; aus der Mitte
   steigt ein goldgruener Stempel nach oben */
EFF.seerose=function(p,A,B,s,r){
  grOhneZutaten(r,0.6);
  const q=QUAL(), a0=rand(0,Math.PI*2), G=2.2;
  const ring=(n,w0,c,L)=>{ for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2+rand(-0.03,0.03), w=w0*rand(0.97,1.03);
    kgStern(psBig,p,[Math.cos(a)*w,rand(-0.3,0.3),Math.sin(a)*w],kgMal(c,1.35),L*rand(0.92,1.05),G,0,0.35); } };
  ring(Math.round(120*q),12*s,A,3.0); ring(Math.round(80*q),7.5*s,[1,1,1],2.6);
  for(let i=0;i<Math.round(36*q);i++){ const a=rand(0,Math.PI*2), el=rand(0.8,1.0), w=rand(6,8)*s;
    kgStern(psHuge,p,[Math.cos(a)*Math.cos(el)*w*0.35,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w*0.35],kgMal(B,1.2),rand(1.5,1.9),G,0,0.3); }
  schall(p,v=>sfx.boom(v*0.6));
};

/* 4 Galaxie: ein Musterbruch mit drei Spiralarmen - die Sterne liegen in
   der Kugel so gepackt, dass schnellere weiter gedreht sind; beim
   Auseinanderfliegen bleibt die Spirale stehen und waechst. Weisser Kern,
   die Arme werden nach aussen farbig */
EFF.galaxie=function(p,A,B,s,r){
  grOhneZutaten(r,0.6);
  const [u,v]=basisBlick(p,0.35), a0=rand(0,Math.PI*2), q=QUAL(), G=1.8, dreh=Math.random()<0.5?1:-1;
  for(let k=0;k<3;k++) for(let i=0;i<Math.round(64*q);i++){ const f=i/(64*q), a=a0+k*Math.PI*2/3+dreh*f*2.2+rand(-0.07,0.07), w=(2.5+12*f)*s*rand(0.96,1.04);
    const d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
    const c=f<0.25?[1,1,1]:f<0.65?A:B; kgStern(psBig,p,kgMal(d,w),kgMal(c,1.35),rand(2.9,3.5),G,0,0.3); }
  for(let i=0;i<Math.round(40*q);i++){ const d=randDir(), w=rand(1,2.5)*s; kgStern(psHuge,p,kgMal(d,w),[1.4,1.4,1.3],rand(1.6,2.2),G,4,0.1); }
  schall(p,v=>{ sfx.boom(v*0.5); later(1.0,()=>sfx.rieseln(v*0.35,2)); });
};

/* 5 Diamantstaub: eine Wolke aus Hunderten feinster weisser Funken, die
   funkeln und ganz langsam sinken - wie Staub im Sonnenlicht */
EFF.diamantstaub=function(p,A,B,s,r){
  grOhneZutaten(r,0.4);
  const q=QUAL();
  grSpur(0,()=>{ for(let i=0;i<Math.round(260*s*q);i++){ const d=randDir(), w=Math.cbrt(Math.random())*rand(6,9.5)*s, c=i%5?[1.5,1.5,1.6]:kgMal(A,1.4);
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0],c[1],c[2],rand(3.0,4.2),0.6,4); } });
  grSpur(0.05,()=>{ for(let i=0;i<Math.round(60*s*q);i++){ const d=randDir(), w=rand(4,8)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1.3,1.3,1.4,rand(2.0,3.0),0.7,1); } });
  schall(p,v=>{ sfx.boom(v*0.45); later(0.15,()=>sfx.rieseln(v*0.55,3.5)); });
};

/* 6 Smaragdregen: farbiger Glitzer - gruene Sterne ziehen einen Schweif
   aus gruen-weissem Glitzer, der stehen bleibt und rieselt (sonst gibt es
   Glitzer nur in Gold und Silber) */
EFF.smaragdregen=function(p,A,B,s,r){
  grOhneZutaten(r,0.6);
  const q=QUAL(), G=2.4;
  for(let i=0;i<Math.round(60*s*q);i++){ const d=randDir(), w=rand(11,13)*s, v=kgMal(d,w), T=rand(2.2,2.7);
    kgStern(psBig,p,v,kgMal(A,1.4),T,G,0,0.2);
    rkFunken(p,v,G,0.1,T,10,mischF(A,[1,1,1],0.35),{life:[0.7,1.2],g:1.8,streu:0.3,mit:0.05,mode:4}); }
  schall(p,v=>{ sfx.boom(v*0.6); later(1.1,()=>sfx.rieseln(v*0.45,2.5)); });
};

/* 7 Kiefernkrone (Matsuba): Goldsterne fliegen aus und zerspringen nach
   einer Sekunde in feine, sich verzweigende Nadeln - ein Kranz aus
   Tannenzweigen, der trocken knistert */
EFF.kiefernkrone=function(p,A,B,s,r){
  grOhneZutaten(r,0.6);
  const q=QUAL(), n=Math.round(60*s*q), g=kgMal(A,1.35);
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(11.5,13.5)*s;
    const v=[d[0]*w,d[1]*w,d[2]*w];
    verzweig(psBig,p.x,p.y,p.z,v[0],v[1],v[2],g,1.9,2.2,{tz:rand(1.25,1.45),n:[3,5],tiefe:2,streu:1.1,spur:0.3,minTempo:2.5,C:kgMal(B,1.5),ps2:psMid});
    rkFunken(p,v,2.2,0.05,1.3,12,[1,.85,.5],{life:[0.6,1.1],g:1.6,streu:0.3,mit:0.05,mode:4}); }
  schall(p,v=>{ sfx.boom(v*0.5); later(1.05,()=>{ sfx.crackle(v*0.6); later(0.12,()=>sfx.crackle(v*0.4)); }); });
};

/* 8 Lavaregen: schwere, gluehende Lavabrocken fliegen im Bogen auf und
   stuerzen wieder ab, ziehen dunkelrote Glut und Rauchfaeden hinter sich
   und zerspritzen am Ende */
EFF.lavaregen=function(p,A,B,s,r){
  grOhneZutaten(r,0.9);
  const q=QUAL(), G=5.2, n=Math.round(rand(20,26)*q), dunkel=[.35,.05,.02];
  for(let i=0;i<n;i++){ const a=rand(0,Math.PI*2), el=rand(0.1,1.2), w=rand(8,11.5)*s, v=[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w,Math.sin(a)*Math.cos(el)*w], T=rand(2.0,2.6);
    for(let k=0;k<2;k++) kgStern(psHuge,p,v,kgMal(A,1.3),T,G,0,0.15);
    rkFunken(p,v,G,0.05,T,40,B,{life:[0.6,1.1],g:0.6,streu:0.4,mit:0.04,mode:2});
    kgSpaeter(T,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T); for(let j=0;j<Math.round(9*q);j++){ const dd=randDir(), ww=rand(1.5,3.5); psMid.emit(e.x,e.y,e.z,dd[0]*ww,Math.abs(dd[1])*ww,dd[2]*ww,A[0],A[1],A[2],rand(0.4,0.8),5,2,dunkel[0],dunkel[1],dunkel[2]); } }); }
  schall(p,v=>{ sfx.wumms?sfx.wumms(v*0.9):sfx.boom(v*0.8); rauschF({dur:1.8,vol:0.16*v,typ:'lowpass',f:500,an:0.1}); });
};

/* 9 Echoringe: drei Ringe aus demselben Punkt, einer nach dem anderen im
   Abstand von 0,3 s - jeder langsamer, so liegen sie ineinander; jeder mit
   einem dumpfen Schlag wie ein Echo */
EFF.echoringe=function(p,A,B,s,r){
  grOhneZutaten(r,0.5);
  const [u,v]=basisBlick(p,0.25), q=QUAL(), G=2.2, farben=[A,B,[1,1,1]];
  [12,9,6].forEach((w0,k)=>kgSpaeter(k*0.32,()=>{ const a0=rand(0,Math.PI*2), n=Math.round((100-k*20)*q);
    for(let i=0;i<n;i++){ const a=a0+i/n*Math.PI*2, d=[u[0]*Math.cos(a)+v[0]*Math.sin(a),u[1]*Math.cos(a)+v[1]*Math.sin(a),u[2]*Math.cos(a)+v[2]*Math.sin(a)];
      kgStern(psBig,p,kgMal(d,w0*s*rand(0.98,1.02)),kgMal(farben[k],1.4),rand(2.6,3.0)-k*0.25,G,0,0.3); }
    grSpur(0,()=>psHuge.emit(p.x,p.y,p.z,0,0,0,1.4,1.4,1.4,0.06,0,0));
    schall(p,x=>sfx.boom(x*(0.55-k*0.12))); }));
};

/* 10 Kirschbluete: eine rosa Paeonie; nach gut einer Sekunde loest sich
   jeder Stern in drei, vier blasse Bluetenblaetter auf, die kaum sinken und
   seitlich davontreiben */
EFF.kirschbluete=function(p,A,B,s,r){
  grOhneZutaten(r,0.5);
  const q=QUAL(), G=2.3, T=1.15, wind=[rand(-0.6,0.6),0,rand(-0.6,0.6)];
  for(let i=0;i<Math.round(90*s*q);i++){ const d=randDir(), w=rand(10,11.5)*s, v=kgMal(d,w), T2=T*rand(0.95,1.1);
    kgStern(psBig,p,v,kgMal(A,1.35),T2,G,0,0.2);
    kgSpaeter(T2,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,T2); grSpur(0.02,()=>{ for(let j=0;j<Math.round(rand(3,4)*q);j++){ const c=j%2?B:A;
      psBig.emit(e.x,e.y,e.z,wind[0]+rand(-0.9,0.9),rand(-0.3,0.4),wind[2]+rand(-0.9,0.9),c[0]*1.05,c[1]*1.05,c[2]*1.1,rand(2.6,3.6),0.35,0); } }); }); }
  schall(p,v=>{ sfx.boom(v*0.5); later(1.2,()=>sfx.rieseln(v*0.3,3)); });
};

/* 11 Seidenweide: eine Weide aus Hunderten feinster Silbersterne mit
   langen, haarfeinen Spuren - viel zarter als die Goldweide, sechs
   Sekunden lang */
EFF.seidenweide=function(p,A,B,s,r){
  grOhneZutaten(r,0.4);
  const q=QUAL();
  grSpur(1.7,()=>{ for(let i=0;i<Math.round(300*s*q);i++){ const d=randDir(), w=rand(5,7)*s;
    psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w*0.85+1,d[2]*w,A[0]*1.05,A[1]*1.05,A[2]*1.1,rand(5,6.2),1.25,4); } });
  grSpur(0.6,()=>{ for(let i=0;i<Math.round(16*s*q);i++){ const d=randDir(), w=rand(6,7)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(4,5),1.3,4); } });
  schall(p,v=>{ sfx.boom(v*0.45); later(0.3,()=>sfx.rieseln(v*0.6,6)); });
};

/* 12 Honigtau: schwere Goldsterne, von denen waehrend des Flugs immer
   wieder kleine bernsteinfarbene Tropfen abreissen und nach unten fallen */
EFF.honigtau=function(p,A,B,s,r){
  grOhneZutaten(r,0.6);
  const q=QUAL(), G=2.4, n=Math.round(55*s*q);
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(9,11)*s, v=kgMal(d,w), T=rand(2.9,3.5);
    kgStern(psHuge,p,v,kgMal(A,1.25),T,G,0,0.15);
    for(let t=0.55;t<T-0.2;t+=rand(0.22,0.34)) kgSpaeter(t,()=>{ const e=sternNach(p,v[0],v[1],v[2],G,t), wv=bahnTempo(v,G,t);
      grSpur(0.12,()=>psMid.emit(e.x,e.y-0.05,e.z,wv[0]*0.1,-0.6,wv[2]*0.1,B[0],B[1],B[2],rand(0.5,0.75),6.5,0)); }); }
  schall(p,v=>{ sfx.boom(v*0.55); later(1.0,()=>sfx.rieseln(v*0.35,2.5)); });
};

/* 13 Glockenblume: die Sterne fliegen als nach unten offene Glocke aus,
   violett mit weissem Rand, und haengen durch; aus der Mitte faellt ein
   goldener Stempel */
EFF.glockenblume=function(p,A,B,s,r){
  grOhneZutaten(r,0.5);
  const q=QUAL(), G=1.7;
  for(let i=0;i<Math.round(150*q);i++){ const a=rand(0,Math.PI*2), el=rand(-0.95,-0.2), w=rand(8.5,9.8)*s;
    kgStern(psBig,p,[Math.cos(a)*Math.cos(el)*w,Math.sin(el)*w*0.7+3,Math.sin(a)*Math.cos(el)*w],kgMal(A,1.45),rand(2.5,2.9),G,0,0.3); }
  for(let i=0;i<Math.round(64*q);i++){ const a=i/(64*q)*Math.PI*2, w=10*s, v=[Math.cos(a)*w,-0.8,Math.sin(a)*w];
    kgStern(psBig,p,v,kgMal(B,1.5),rand(2.6,2.9),G,0,0.2);
    if(i%3===0) rkFunken(p,v,G,0.3,2.5,14,kgMal(B,1.1),{ps:psMid,life:[0.5,0.9],g:1.2,streu:0.15,mit:0.02,mode:4}); }
  for(let i=0;i<Math.round(8*q);i++) kgStern(psHuge,p,[rand(-.3,.3),-rand(2,5)*s,rand(-.3,.3)],kgMal(FW.gold,1.2),rand(1.6,2.0),G,0,0.3);
  schall(p,v=>sfx.boom(v*0.5));
};

/* 14 Seifenblase: eine hauchduenne, vollkommen runde Kugel aus winzigen
   Sternen, die in allen Regenbogenfarben schillert, langsam waechst - und
   dann zerplatzt sie in einen Hauch weisser Funken */
EFF.seifenblase=function(p,A,B,s,r){
  grOhneZutaten(r,0.3);
  const q=QUAL(), G=0.4, T=2.1, n=Math.round(260*q), sch=[FW.magenta,FW.tuerkis,FW.gold,FW.violett,FW.mint];
  const blase=[];
  for(let i=0;i<n;i++){ const y=1-2*(i+0.5)/n, rr=Math.sqrt(1-y*y), a=i*2.39996, d=[Math.cos(a)*rr,y,Math.sin(a)*rr], w=8*s;
    const h=(Math.atan2(d[2],d[0])/(Math.PI*2)+0.5+y*0.3)*sch.length, L=sch.length, fl=Math.floor(h), k=((fl%L)+L)%L, f=h-fl, c=mischF(sch[k],sch[(k+1)%L],f);
    kgStern(psBig,p,kgMal(d,w),kgMal(c,1.6),T,G,0,0.16); blase.push(kgMal(d,w)); }
  kgSpaeter(T,()=>{ for(const v of blase){ const e=sternNach(p,v[0],v[1],v[2],G,T); for(let j=0;j<3;j++){ const dd=randDir(); psMid.emit(e.x,e.y,e.z,v[0]*0.3+dd[0]*2.2,v[1]*0.3+dd[1]*2.2,v[2]*0.3+dd[2]*2.2,1.5,1.5,1.6,rand(0.6,1.0),1.2,4); } }
    schall(p,x=>{ sfx.plopp(x*0.7,1.6); sfx.rieseln(x*0.4,1); }); });
  schall(p,v=>sfx.boom(v*0.35));
};

/* 15 Sternspritzer: jeder Stern brennt wie eine Wunderkerze - er spruehet
   ringsum feine, weisse, sich verzweigende Funken, waehrend er fliegt */
EFF.sternspritzer=function(p,A,B,s,r){
  grOhneZutaten(r,0.6);
  const q=QUAL(), G=2.4;
  for(let i=0;i<Math.round(45*s*q);i++){ const d=randDir(), w=rand(10.5,12.5)*s, v=kgMal(d,w), T=rand(2.1,2.6);
    kgStern(psBig,p,v,kgMal(A,1.7),T,G,0,0.12);
    rkFunken(p,v,G,0.05,T,34,[1.5,1.4,1.2],{ps:psMid,life:[0.18,0.38],g:1,streu:2.4,mit:0.2,mode:4,spur:0.05}); }
  schall(p,v=>{ sfx.boom(v*0.4); sfx.zischen(v*0.4,2.3); for(let i=0;i<4;i++) later(0.25+i*0.5,()=>sfx.prasseln(v*0.5)); });
};

Object.assign(EFF_SCHWEIF,{funkelregen:0.08,tigerschweif:0.25,seerose:0.12,galaxie:0.1,diamantstaub:0,smaragdregen:0.1,kiefernkrone:0.12,lavaregen:0.15,echoringe:0.12,kirschbluete:0.08,seidenweide:1.7,honigtau:0.15,glockenblume:0.14,seifenblase:0.05,sternspritzer:0.05});
Object.assign(EFF_FAMILIE,{funkelregen:'glitzer',tigerschweif:'komet',seerose:'kugel',galaxie:'figur',diamantstaub:'glitzer',smaragdregen:'glitzer',kiefernkrone:'knister',lavaregen:'flamme',echoringe:'kugel',kirschbluete:'kugel',seidenweide:'haenger',honigtau:'haenger',glockenblume:'kugel',seifenblase:'kugel',sternspritzer:'glitzer'});

/* Die Batterien: je ein Effekt, verschiedene Muster, Takte und Farben.
   Aufbau: Auftakt, Antwort, zweite Ebene, Rhythmus, Finale mit Schluss. */
Object.assign(THEMEN,{
  mb_funkeln:[['silber','weiss'],['himmel','silber'],['weiss','zitrone']],
  mb_tiger:[['orange','gold'],['bernstein','rot'],['gold','orange']],
  mb_seerose:[['rose','gold'],['magenta','limette'],['weiss','rose']],
  mb_galaxie:[['himmel','violett'],['tuerkis','magenta'],['violett','blau']],
  mb_diamant:[['himmel','weiss'],['silber','tuerkis'],['weiss','himmel']],
  mb_smaragd:[['gruen','weiss'],['mint','gold'],['limette','gruen']],
  mb_kiefer:[['gold','bernstein'],['zitrone','gold'],['bernstein','orange']],
  mb_lava:[['orange','scharlach'],['rot','orange'],['scharlach','gold']],
  mb_echo:[['blau','weiss'],['magenta','gold'],['tuerkis','violett']],
  mb_kirsch:[['rose','weiss'],['pfirsich','rose'],['magenta','rose']],
  mb_seide:[['silber','weiss'],['silber','himmel'],['weiss','silber']],
  mb_honig:[['gold','bernstein'],['bernstein','orange'],['zitrone','bernstein']],
  mb_glocke:[['violett','weiss'],['indigo','silber'],['magenta','weiss']],
  mb_blase:[['weiss','silber'],['weiss','silber'],['weiss','silber']],
  mb_spritzer:[['gold','weiss'],['zitrone','weiss'],['bernstein','weiss']]
});
const MUSTERBATT=[
  /* id, Effekt, Thema, Muster Auftakt/Antwort/Rhythmus/Finale */
  ['mb_funkelregen','funkelregen','mb_funkeln',['gerade','v','kreis','schlag']],
  ['mb_tigerschweif','tigerschweif','mb_tiger',['aussen','x','paar','w']],
  ['mb_seerose','seerose','mb_seerose',['mitte','welle','treppe','schlag']],
  ['mb_galaxie','galaxie','mb_galaxie',['gerade','paar','spirale','mitte']],
  ['mb_diamantstaub','diamantstaub','mb_diamant',['v','gerade','zufall','schlag']],
  ['mb_smaragdregen','smaragdregen','mb_smaragd',['z','mitte','welle','x']],
  ['mb_kiefernkrone','kiefernkrone','mb_kiefer',['aussen','zufall','kreis','schlag']],
  ['mb_lavaregen','lavaregen','mb_lava',['paar','v','w','mitte']],
  ['mb_echoringe','echoringe','mb_echo',['gerade','aussen','treppe','schlag']],
  ['mb_kirschbluete','kirschbluete','mb_kirsch',['welle','paar','zufall','mitte']],
  ['mb_seidenweide','seidenweide','mb_seide',['mitte','gerade','v','schlag']],
  ['mb_honigtau','honigtau','mb_honig',['x','mitte','paar','w']],
  ['mb_glockenblume','glockenblume','mb_glocke',['treppe','v','mitte','schlag']],
  ['mb_seifenblase','seifenblase','mb_blase',['zufall','gerade','kreis','aussen']],
  ['mb_sternspritzer','sternspritzer','mb_spritzer',['w','aussen','spirale','schlag']]
];
MUSTERBATT.forEach(([id,E,th,M],k)=>{
  SHOWS[id]=()=>show({rampe:{sz:[0.9,1.25],pw:[0,2],hell:[0.85,1.3],kurve:'spaet'}},[
    {n:5,gap:0.9,muster:M[0],ang:0.25,eff:E,kal:'mittel',pw:2,th,farbe:0},
    {n:8,gap:0.35,muster:M[1],ang:0.35,eff:E,kal:'mittel',pw:3,th,farbe:1},
    {mit:true,n:3,gap:1.1,muster:'gerade',eff:E,kal:'gross',pw:5,th,farbe:2,pause:1.0},
    {n:10,takt:[0.15,0.15,0.6],muster:M[2],ang:0.35,eff:E,kal:'gross',pw:4,th,farbe:0,pause:0.8},
    {n:8,gap:0.1,muster:M[3],ang:0.35,eff:E,kal:'gross',pw:4,th,farbe:1},
    {mit:true,n:3,gap:0.35,muster:'mitte',ang:0.15,eff:E,kal:'riesig',pw:6,th,farbe:2,pause:5}
  ]);
});
Object.assign(SIGNATUR,{
  mb_funkelregen:{eff:'funkelregen',text:'Silbersterne, die einzeln aufblitzen – Funkeln wie Glitzer im Licht'},
  mb_tigerschweif:{eff:'tigerschweif',text:'Goldkometen mit breitem, stehendem Funkenband'},
  mb_seerose:{eff:'seerose',text:'Waagerechter Ringbruch – eine Seerose, die sich öffnet'},
  mb_galaxie:{eff:'galaxie',text:'Drei Spiralarme um einen weißen Kern'},
  mb_diamantstaub:{eff:'diamantstaub',text:'Hunderte feinste funkelnde Funken, die langsam sinken'},
  mb_smaragdregen:{eff:'smaragdregen',text:'Grüne Sterne mit grünem Glitzerschweif'},
  mb_kiefernkrone:{eff:'kiefernkrone',text:'Goldsterne zerspringen in verzweigte Tannennadeln'},
  mb_lavaregen:{eff:'lavaregen',text:'Glühende Lavabrocken im Bogen mit Glutfäden'},
  mb_echoringe:{eff:'echoringe',text:'Drei Ringe nacheinander aus einem Punkt – wie ein Echo'},
  mb_kirschbluete:{eff:'kirschbluete',text:'Rosa Päonie, die in treibende Blütenblätter zerfällt'},
  mb_seidenweide:{eff:'seidenweide',text:'Haarfeine Silberweide, sechs Sekunden lang'},
  mb_honigtau:{eff:'honigtau',text:'Goldsterne, von denen Honigtropfen abreißen'},
  mb_glockenblume:{eff:'glockenblume',text:'Violette Glocke mit weißem Rand und goldenem Stempel'},
  mb_seifenblase:{eff:'seifenblase',text:'Schillernde Kugel, die zerplatzt'},
  mb_sternspritzer:{eff:'sternspritzer',text:'Sterne, die wie Wunderkerzen sprühen'}
});

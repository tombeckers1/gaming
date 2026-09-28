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

/* Silberwelle (Silberbrandung): Silberchrysantheme, deren Sterne nach
   0,7 s kurz dunkel werden und tuerkis weiterbrennen - echte
   "Chrysantheme zu Farbe" mit Dunkelphase. Die Sterne fliegen dabei
   weiter und verloeschen einzeln (28.09., Tom: echt). Vorher hielten alle
   an, standen 1,2 s als Perlen und gingen zugleich aus (Lichtshow). */
EFF.silberwelle=function(p,A,B,s,r){
  grOhneZutaten(r);
  const q=QUAL(), n=Math.round(rand(70,90)*s*q), T=0.7, g=2.4, st=[], tag=FW_TAG;
  const gl=[.9,.94,1], perle=grWeiss(A,0.08);
  grSpur(0.32,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(8.5,10.5)*s, v=[d[0]*w,d[1]*w,d[2]*w], tz=T*rand(0.9,1.1);
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],gl[0]*1.15,gl[1]*1.15,gl[2]*1.15,tz,g,4); st.push([v,tz]); } });
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
  grSpur(0.35,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(7.5,9.5)*s, v=[d[0]*w,d[1]*w,d[2]*w], tz=T*rand(0.9,1.1);
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],sil[0],sil[1],sil[2],tz,g,4); st.push([v,tz]); } });
  for(const [v,tz] of st){ const td=tz+rand(0.06,0.12);
    imBild(td,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(p,v,g,td), w=bahnTempo(v,g,td);
      grSpur(0.18,()=>psBig.emit(o.x,o.y,o.z,w[0],w[1],w[2],bl[0],bl[1],bl[2],rand(1.1,1.7),2.4,1)); FW_TAG=alt; }); }
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
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(4.5,6.8)*s, v=[d[0]*w,d[1]*w*0.8+1.4,d[2]*w], L=rand(3.4,4.4), tw=rand(1.4,1.9);
    grSpur(1.5,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],sil[0],sil[1],sil[2],L,G,4));
    if(i%2) continue;
    /* farbige Spitze auf derselben Bahn: gruen, kurz dunkel, dann violett */
    const v2=[v[0]*1.01,v[1]*1.01,v[2]*1.01], tv=tw+rand(0.08,0.14);
    grSpur(0,()=>psBig.emit(p.x,p.y,p.z,v2[0],v2[1],v2[2],cA[0]*1.2,cA[1]*1.2,cA[2]*1.2,tw,G,0));
    imBild(tv,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(p,v2,G,tv), w2=bahnTempo(v2,G,tv);
      grSpur(0,()=>psBig.emit(o.x,o.y,o.z,w2[0],w2[1],w2[2],cB[0]*1.2,cB[1]*1.2,cB[2]*1.2,rand(1.0,1.6),G,0)); FW_TAG=alt; }); }
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
      if(h.t>h.aus){ h.tot=true; METEOR.koepfe=Math.max(0,METEOR.koepfe-1);
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
  const q=QUAL(), n=Math.round(rand(60,80)*s*q), Tz=rand(0.6,0.9), g=2.2, st=[], hell=[], tag=FW_TAG;
  grSpur(0.35,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(9.5,11.5)*s, v=[d[0]*w,d[1]*w,d[2]*w]; st.push(v);
    psMid.emit(p.x,p.y,p.z,v[0],v[1],v[2],.16,.025,.01,Tz,g,0); } });
  imBild(Tz,()=>{ const alt=FW_TAG; FW_TAG=tag;
    grSpur(0.14,()=>{ st.forEach((v,i)=>{ const o=bahnOrt(p,v,g,Tz), w=bahnTempo(v,g,Tz), c=i%6?A:grWeiss(A,0.5);
      hell.push(grStern(psBig,o.x,o.y,o.z,w[0],w[1],w[2],[c[0]*1.4,c[1]*1.4,c[2]*1.4],0.85,g,0)); }); });
    /* 28.09.: alle Sterne psBig (vorher jeder vierte psHuge mit Lichtkreuz -
       grosse Leuchtpunkte), Blitz halb so stark (faerbte die Haeuser rot) */
    grHalten('gamboge',hell,0.9); flash(p,A,1.5+1.5*s,0.4); FW_TAG=alt; });
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
  grSpur(0.2,()=>{ for(let i=0;i<n;i++){ const d=randDir(), w=rand(6.5,9)*s, c=i%3?A:B; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c[0]*1.2,c[1]*1.2,c[2]*1.2,rand(1.6,2.4),2.4,1); } });
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
  imBild(t2,()=>{ const alt=FW_TAG; FW_TAG=tag; const o=bahnOrt(P0,v,G,t2), w=bahnTempo(v,G,t2), n=Math.round(rand(12,16)*q);
    grSpur(0.22,()=>{ for(let i=0;i<n;i++){ const d=randDir(), u=rand(3,4.5); psBig.emit(o.x,o.y,o.z,w[0]+d[0]*u,w[1]+d[1]*u,w[2]+d[2]*u,1.3,1.32,1.4,rand(1.2,1.8),1.8,4); } });
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

/* Familien und Schweife der neuen Brueche (effPassen, mitSchweif) */
Object.assign(EFF_FAMILIE,{blinkregen:'knister',vorhang:'haenger',polarlicht:'haenger',meteor:'haenger',blinkchrys:'knister',donnerblitz:'salut',donnerkette:'salut',kaleidoskop:'kugel',silberwelle:'kugel'});
Object.assign(EFF_SCHWEIF,{blinkregen:0.2,vorhang:1.4,polarlicht:1.5,blinkchrys:0.35,donnerblitz:0.1,donnerkette:0.06,kaleidoskop:0.14,silberwelle:0.32});

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
  {n:6,gap:0.6,muster:'welle',ang:0.35,wellen:1,eff:['farfalle','crossette'],farbe:0,pause:1.2},
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
  /* Einlass: zwei Bodenkreisel */
  {n:0,boden:[{k:'kreisel',gt:8,A:'rose',x:-0.2,i:0},{k:'kreisel',gt:6,A:'aqua',x:0.2,i:1,t:0.5}],pause:2.0},
  /* Karussell, gemaechlich: Bienen rundum */
  {n:8,gap:0.9,muster:'spirale',ang:0.35,kal:'klein',pw:-4,eff:'bienen',farbe:0,steig:'gold',pause:1.2},
  /* Zuckerwatte: weiche Farbschleier, Goldfontaene dazu */
  {n:4,gap:1.6,muster:'gerade',eff:'farbregen',kal:'mittel',farbe:1,boden:{k:'fountain',gt:6,A:'gold',B:'weiss'},pause:0.8},
  /* Schiessbude: kleine Knister-Pops, schnell */
  {n:6,gap:0.15,muster:'zufall',ang:0.30,kal:'mini',pw:-6,eff:'knister',farbe:2,pause:1.2},
  /* FINALE Karussell auf Hochtouren und neue Kreisel */
  {n:6,gap:0.12,muster:'spirale',ang:0.50,kal:'mittel',eff:['wechsel','bienen'],farbe:0,mine:true,mineEff:'farbe',boden:{k:'kreisel',gt:4,A:'aqua'},pause:3.0}
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

/* Level 17: Regenbogenbruecke. 28.09. (Tom: "Farben zu durcheinander"):
   der Regenbogen laeuft als Folge ueber die Zeit - jeder Bogen eine Farbe,
   Rot aussen zuerst, Violett innen zuletzt, der naechste erst, wenn der
   vorige verglimmt (hoechstens zwei Farben zugleich). Vorher standen alle
   sieben Boegen in 2 s gleichzeitig am Himmel. */
SHOWS.regenbogenfaecher=()=>show({basis:{pw:0.60,sz:1.050,th:'spektrum'},rampe:{sz:[0.95,1.20],pw:[0,1],hell:[0.80,1.30],kurve:'linear'}},[
  /* Regenschauer: Silberregen am Boden, traege Glitzertropfen */
  {n:7,gap:0.8,muster:'zufall',ang:0.30,eff:'zeitregen',kal:'klein',th:'eis',boden:{k:'wasserfall',gt:10,A:'silber',B:'weiss'},pause:1.0},
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
  {n:10,gap:0.4,muster:'gerade',eff:'strobeweide',farbe:1,boden:{k:'wasserfall',gt:8,A:'silber',B:'weiss'}},
  {mit:true,n:6,gap:0.7,muster:'zufall',ang:0.40,pw:4,eff:'donnerblitz',kal:'mittel',pause:0.5},
  /* Sturmboee - der alte Z-Faecher als eine kurze Phase */
  {n:12,gap:0.12,muster:'z',seg:2,ang:0.45,eff:['spinne','donnerblitz'],farbe:0,pause:1.5},
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
  {n:16,gap:0.35,gapEnde:0.07,muster:'v',ang:0.15,hoehe:'fallend',hSpanne:18,eff:['chrys','spinne'],farbe:0,steig:'pfeif',pause:1.2},
  /* Kamelbuckel: Hoehen als Welle, Fontaene am Boden */
  {n:18,gap:0.30,muster:'welle',ang:0.30,wellen:3,hoehe:'welle',hSpanne:14,eff:['kugel','palme'],A:['violett','gold'],B:['gold','violett']},
  {mit:true,n:0,boden:{k:'fountain',gt:6,gh:0.9,A:'gold',B:'weiss'},pause:1.0},
  /* Steilkurve: Paare, Winkel waechst */
  {n:14,gap:0.20,muster:'paar',ang:0.50,eff:'komet',farbe:1,pause:1.0},
  /* Tunnel: dunkel, tief, rumpelndes Knistern */
  {n:10,gap:0.25,muster:'zufall',ang:0.25,kal:'mini',pw:-3,eff:'tausend',farbe:2,pause:0.8},
  /* Schlussfahrt: Kreuzfeuer mit wechselnden Hoehen */
  {n:24,gap:0.12,muster:'x',ang:0.45,hoehe:'wechsel',hSpanne:3,pw:2.5,eff:['kamuro','wechsel'],farbe:0,kal:'gross'} /* 27.09.: pw 5->4 - die Kugelbomben sind die Koenigsklasse und steigen hoeher als die Spitze jedes Verbunds bis Level 17 (steigerung.js KUGEL) */,
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
  {n:12,gap:0.6,muster:'w',ang:0.40,pw:-1,eff:['rossschweif','komet'],farbe:1,pause:1.2},
  /* Galopp: da-da-DUMM, Scheibenwischer zweimal hin und zurueck */
  {n:16,takt:[0.15,0.15,0.45],muster:'wischer',seg:2,ang:0.45,eff:'rossschweif',kal:'klein',pw:1,A:'weiss',B:'himmel',pause:1.4},
  /* Maehne: grosse Silberpalmen oben (wehendes Haar), kleine Kometen unten im V
     (27.09.: vorher Blinkweiden - die tragen die Weidenwand) */
  {n:10,gap:0.9,muster:'gerade',eff:'palme',A:'weiss',B:'himmel',kal:'gross',pw:2},
  {mit:true,n:10,gap:0.9,muster:'v',ang:0.50,kal:'mini',pw:0,eff:'komet',farbe:1,pause:0.8},
  /* FINALE Durchgehen: zehn Riesen-Pferdeschweife von der Mitte nach aussen, Silber-Feuertoepfe */
  {n:10,gap:0.08,muster:'mitte',ang:0.50,eff:'rossschweif',kal:'riesig',pw:5,A:'weiss',B:'himmel',mine:true,mineEff:'silber',pause:4.5}
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
  {n:24,je:6,takt:[1.8],muster:'schlag',ang:0.35,eff:'palme',kal:'mittel',pw:-1,A:'gold',B:'rot',boden:{k:'feuerbrunnen',gt:7,A:'rot',B:'gold'},pause:1.0},
  /* Synkope: kurz-kurz-lang, V-Salven */
  {n:24,je:6,takt:[0.5,0.5,1.4],muster:'v',ang:0.40,eff:'kokosnuss',farbe:1,pause:1.2},
  /* Paukenschlag: eine senkrechte Sechser-Salve, danach Stille */
  {n:6,je:6,muster:'gerade',eff:'weide',kal:'gross',farbe:0,pause:2.5},
  /* Triolen: W-Salven, Fontaenen flackern */
  {n:36,je:6,takt:[0.28,0.28,0.9],muster:'w',ang:0.45,eff:['spinne','chrys','spinne'],farbe:0},
  {mit:true,n:0,boden:[{k:'feuerbrunnen',gt:4,x:-3},{k:'feuerbrunnen',gt:4,x:3}],pause:1.2},
  /* Wirbel: 4 Salven in 0,36 s */
  /* 27.09.: Takt 0,34 statt 0,12 s und Pause vor dem Tusch - hoechstens 18 Schuss je
     Sekunde, die Dichte-Leiter (steigerung.js) laesst Goetterfunken und Weltuntergang
     sonst nicht mehr drueber; hoeher fuer die Steigerung im Ablauf */
  {n:24,je:6,takt:[0.34],muster:'schlag',ang:0.55,eff:'brokat',kal:'gross',pw:3,farbe:2,pause:0.7},
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
  {n:4,gap:1.8,muster:'gerade',mine:true,mineEff:'farbe',steig:'farbspur',eff:'kugel',kal:'mittel',farbe:0,boden:{k:'fountain',gt:8,A:'gold',B:'weiss'},pause:1.0},
  /* Saeulengang: aussen nach innen, ueber die Breite verteilt, Farben im Wechsel */
  {n:14,gap:0.55,muster:'aussen',ang:0.50,rohre:'breit',mine:true,mineEff:'farbe',steig:'farbspur',eff:'pistill',farbVert:'wechsel',pause:1.2},
  /* Komplementaer: oben V in Limette, unten Blinker-Feuertoepfe in Magenta */
  {n:12,gap:0.9,muster:'v',ang:0.35,steig:'farbspur',eff:'chrys',farbe:1},
  {mit:true,n:12,gap:0.9,nurMine:true,mineEff:'blink',muster:'gerade',farbe:0,pause:0.6},
  /* Paare: Farbwechsel Magenta zu Gold */
  {n:20,gap:0.30,muster:'paar',ang:0.45,mine:true,mineEff:'farbe',steig:'farbspur',eff:'wechsel',farbe:0,pause:1.2},
  /* Saeulenwand: Mitte nach aussen, schnell */
  {n:18,gap:0.12,muster:'mitte',ang:0.55,rohre:'breit',mine:true,mineEff:'farbe',steig:'farbspur',eff:'chrys',kal:'gross',farbe:2,pause:1.0},
  /* FINALE: zwei Zehner-Salven, jede Saeule in ihrer Farbe, Mitte anders */
  {n:20,je:10,takt:[0.6],muster:'schlag',ang:0.60,mine:true,mineEff:'farbe',steig:'farbspur',eff:'dahlie',kal:'riesig',farbe:2,farbVert:'mitte',
   boden:{k:'fountain',gt:3,gh:1.2,A:'gold',B:'weiss'},pause:4.5}
]);
SIGNATUR.feuerpfau={idee:'farbsaeule',text:'Farbe steigt vom Feuertopf bis zum Bruch'};

/* Level 20: Hexenkessel. 28.09. (Tom: echt): der Kessel ist eine Gold-
   fontaene mit aufsteigenden limettengruenen Sternen (vorher gruenes
   Dauerlicht mit Leuchtblasen), Farbwechsel statt Geisterkugeln mit
   Zufallsfarbe; nur Limette und Violett mit Gold */
SHOWS.hexenkessel=()=>show({basis:{pw:2.15,sz:1.175,th:'hexenring'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'spaet'}},[
  /* der Kessel heizt: knisternde Blasen, der Kessel laeuft die ganze Show */
  {n:28,gap:0.30,muster:'zufall',ang:0.20,kal:'klein',pw:-7,eff:'knister',farbe:1,boden:{k:'sternregen',gt:34,A:'gold',B:'limette'}},
  {mit:true,n:4,takt:[2.0],muster:'v',ang:0.40,kal:'mittel',eff:'wechsel',farbe:0,pause:0.4},
  /* Hexenringe: 6 Ringe a 8, schraeg nach aussen, Farben im Wechsel */
  {n:48,je:8,takt:[0.9,0.9,0.5],muster:'kreis',ang:0.40,eff:['wechsel','spinne'],kal:'mittel',farbVert:'wechsel'},
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
  {n:12,gap:1.0,muster:'mitte',ang:0.40,eff:'glitzerweide',farbe:0,boden:{k:'riesen',gt:12,gh:1.0,A:'silber',B:'weiss',C:FW.gruen},pause:1.2},
  /* Akt 5 Sonnensturm (laut): Kreuzfeuer, gruene Feuertoepfe, Knisterfontaene */
  {n:30,gap:0.18,muster:'x',ang:0.45,eff:['kamuro','polarlicht','spinne'],kal:'gross',farbe:1,mine:true,mineEff:'farbe',boden:{k:'knisterbrunnen',gt:5,A:'silber',B:'weiss'},pause:1.4},
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
  {n:8,gap:0.9,muster:'aussen',ang:0.35,steig:'pfeif',ton:'stimmen',eff:'kugel',kal:'klein',farbe:0,boden:{k:'fountain',gt:8,A:'gold',B:'weiss'},pause:1.0},
  /* Piccolo: kurze, hohe Pfiffe, flache Sternschnuppen */
  {n:16,gap:0.15,muster:'zufall',ang:0.35,kal:'mini',pw:-5,steig:'pfeif',ton:'hoch',eff:'sternschnuppen',farbe:1,pause:1.2},
  /* Duett: oben Dreiklang-Heuler im V, unten brummende Bienen */
  {n:12,gap:1.2,muster:'v',ang:0.40,steig:'dreiklang',eff:'palme',A:'gold',B:'gruen',kal:'mittel'},
  {mit:true,n:12,gap:1.2,muster:'gerade',kal:'mini',pw:-7,steig:'pfeif',ton:'tief',eff:'bienen',farbe:0,pause:0.8},
  /* Kreischwirbel: pfeifende Crossetten, Goldfontaene am Boden */
  {n:12,gap:0.35,muster:'w',ang:0.45,steig:'pfeif',eff:'crossette',A:'gold',B:'gruen',boden:{k:'fountain',gt:5,A:'gold',B:'zitrone'},pause:1.2},
  /* FINALE Dreiklang: zehn Heuler auf Schlag (Akkord), dann Ausklang mit fallendem Ton */
  {n:10,gap:0,muster:'schlag',ang:0.50,steig:'dreiklang',ton:'akkord',eff:'kamuro',kal:'gross',pw:4,farbe:0,pause:0.6},
  {n:10,gap:0.08,muster:'mitte',ang:0.40,steig:'pfeif',ton:'fallend',eff:'chrys',farbe:0,pause:4.5}
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
  {n:30,muster:'gerade',hoehe:'melodie',noten:ODE,viertel:0.6,hStufe:2.5,pw:-3,eff:'pistill',kal:'klein',farbe:0,steig:'gold',boden:{k:'fountain',gt:20,gh:0.5,A:'gold',B:'weiss'},pause:2.0},
  /* Zwischenspiel "Goetterfunken": knisternde Goldsterne im Scheibenwischer */
  {n:14,gap:0.2,muster:'wischer',seg:2,ang:0.40,eff:'drachenei',kal:'klein',pw:-2,farbe:1,pause:1.2},
  /* Strophe 2 DUETT: Melodie oben senkrecht, Bass in Halben tiefer im V */
  {n:30,muster:'gerade',hoehe:'melodie',noten:ODE,viertel:0.5,hStufe:2.5,pw:-1,eff:'dahlie',farbe:1},
  {mit:true,n:16,muster:'v',ang:0.45,hoehe:'melodie',noten:ODE_BASS,viertel:0.5,hStufe:2.5,pw:-6,kal:'klein',eff:'palme',farbe:0,pause:1.0},
  /* Zwischenspiel: Wasserfall der Freude - Fontaenen mitten in der Show, grosse Kronleuchter */
  {n:12,gap:1.3,muster:'aussen',ang:0.50,eff:'kronleuchter',kal:'gross',farbe:0,boden:[{k:'wasserfall',gt:16,A:'gold',B:'weiss'},{k:'feuerbrunnen',gt:8,x:-3},{k:'feuerbrunnen',gt:8,x:3}],pause:1.5},
  /* KANON: linkes Modul (senkrecht) beginnt, rechtes (zur Mitte geneigt) setzt zwei Viertel spaeter ein */
  {n:15,muster:'gerade',x:-8,hoehe:'melodie',noten:ODE_A,viertel:0.5,hStufe:2.5,eff:'brokat',farbe:0},
  {mit:1.0,n:15,muster:'x',ang:0.15,x:8,hoehe:'melodie',noten:ODE_A,viertel:0.5,hStufe:2.5,eff:'brokat',farbe:2,pause:1.0},
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
  {n:8,gap:0.3,x:-8,muster:'v',ang:0.35,eff:'strobeweide',farbe:1,pause:0.8},
  /* ... rechts antwortet */
  {n:8,gap:0.3,x:8,muster:'w',ang:0.35,eff:'strobeweide',farbe:1,pause:1.0},
  /* Mitte, dazu beide Seitenfontaenen (28.09.: ohne bunte Zufallssterne) */
  {n:10,gap:0.9,x:0,muster:'gerade',eff:['glitzerweide','weide'],kal:'gross',boden:[{k:'riesen',x:-8,gt:9,gh:0.8,C:FW.gold},{k:'riesen',x:8,gt:9,gh:0.8,C:FW.gold}],pause:1.2},
  /* Schlagabtausch: links/rechts im Wechsel, sehr schnell */
  {n:24,gap:0.15,x:[-8,8],muster:'zufall',ang:0.25,eff:'zeitregen',kal:'klein',pause:1.4},
  /* FINALE die Wand: Mitte Riesenweiden, beide Fluegel Blinkweiden, drei Riesenfontaenen */
  {n:14,gap:0.12,x:0,muster:'mitte',ang:0.35,eff:'weide',kal:'riesig'},
  {mit:true,n:20,gap:0.085,x:[-8,8],muster:'aussen',ang:0.40,eff:'strobeweide',kal:'gross',boden:[{k:'riesen',x:-8,gt:4,C:FW.gold},{k:'riesen',x:0,gt:4,C:FW.gold},{k:'riesen',x:8,gt:4,C:FW.gold}],pause:6.5}
]);
SIGNATUR.kometenwand={idee:'dreimodul',text:'drei Batterien im Dialog, Finale als Weidenwand'};

/* Level 23: Kaleidoskop. 28.09. (Tom: "Farben zu durcheinander"): je
   Phase ein Glaspaar - Rot/Tuerkis, Tuerkis/Gold, Rot/Gold (vorher acht
   Farben, bis sieben in 1,5 s); das Kaleidoskop ist ein Wechselpistill
   (zwei Farben tauschen die Plaetze) statt zwoelf Farbinseln; Gold-
   fontaenen statt des Feuerrads in der Luft */
SHOWS.sternenkaiser=()=>show({basis:{pw:3.55,sz:1.285,th:'kaiser'},rampe:{sz:[0.90,1.30],pw:[-1,3],hell:[0.90,1.35],kurve:'welle'}},[
  /* Akt 1 Drehung: einzelne Kaleidoskope, Goldfontaene am Boden */
  {n:8,gap:1.8,muster:'gerade',eff:'kaleidoskop',kal:'mittel',farbe:0,boden:{k:'fountain',gt:15,A:'gold',B:'weiss'},pause:1.0},
  /* Akt 2 Spiegel: V-Paare, links Farbe A, rechts Farbe B */
  {n:34,gap:0.55,muster:'v',ang:0.40,eff:['kaleidoskop','pistill'],farbe:1,farbVert:'seite',pause:1.2},
  /* Akt 3 Facetten: oben W (Mitte andere Farbe), unten kleine Knister, zwei symmetrische Fontaenen */
  {n:20,gap:0.8,muster:'w',ang:0.45,farbVert:'mitte',eff:'dahlie',farbe:2},
  {mit:true,n:20,gap:0.8,muster:'gerade',kal:'mini',pw:-8,eff:'knister',farbe:2,boden:[{k:'fountain',gt:16,x:-3,A:'gold',B:'weiss'},{k:'fountain',gt:16,x:3,A:'gold',B:'weiss'}],pause:0.6},
  /* Akt 4 Glassplitter: harte Goldspinnen, aussen nach innen, sehr schnell */
  {n:44,gap:0.12,muster:'aussen',ang:0.55,eff:'spinne',farbe:0,pause:1.4},
  /* Akt 5 Rosette: riesige Einzel-Kaleidoskope, dazu zwei Kugelbomben mit eigenem Bild */
  {n:10,gap:2.2,muster:'mitte',ang:0.35,eff:'kaleidoskop',kal:'riesig',pw:5,farbe:1,bruchOpt:{nachglitzer:false}},
  {mit:true,n:2,gap:11,bomb:3,bombEff:'kaleidoskop',farbe:1,bombStufen:[{t:1.0,eff:'pistill',n:8,kranz:0.47}],pause:1.0},
  /* Akt 6 Doppelspiegel: Kreuzfeuer aus der ganzen Breite, Feuertoepfe, Knisterfontaenen symmetrisch */
  {n:48,gap:0.25,muster:'x',ang:0.50,rohre:'breit',eff:['kaleidoskop','brokat'],farbe:0,farbVert:'seite',mine:true,mineEff:'farbe',
   boden:[{k:'knisterbrunnen',gt:8,x:-4,A:'silber',B:'weiss'},{k:'knisterbrunnen',gt:8,x:4,A:'silber',B:'weiss'}],pause:1.5},
  /* FINALE Das grosse Fenster: 5 Achter-Salven Kaleidoskope, darunter Silberweiden im W, zwei Riesenfontaenen */
  {n:40,je:8,takt:[0.5],muster:'schlag',ang:0.60,eff:'kaleidoskop',kal:'gross',farbe:0,farbVert:'mitte'},
  {mit:true,n:24,gap:0.1,muster:'w',ang:0.55,kal:'klein',pw:-4,eff:'glitzerweide',farbe:0,boden:[{k:'riesen',gt:5,x:-4,C:FW.gold},{k:'riesen',gt:5,x:4,C:FW.gold}],pause:5}
]);
SIGNATUR.sternenkaiser={eff:'kaleidoskop',text:'zwei Farben tauschen die Plätze, alles spiegelgleich'};

/* Level 23: Geysirfeld (neu) - je:5 = eine Saeule, orte = x je Saeule,
   kal-Array je Schuss in der Saeule, boden.je = Geysir am Saeulenort */
const GEYSIR_SAEULE=['knister','pistill','chrys','dahlie','brokat'], GEYSIR_KAL=['mini','klein','mittel','gross','riesig'];
SHOWS.geysirfeld=()=>show({basis:{pw:3.60,sz:1.290,th:'eis'},rampe:{sz:[0.90,1.25],pw:[0,2],hell:[0.90,1.35],kurve:'frueh'}},[
  /* erstes Blubbern: drei Ausbrueche, Saeulen gerade */
  {n:15,je:5,gap:0.08,takt:[2.4],orte:[0,-6,6],muster:'treppe',hoehe:'steigend',hSpanne:20,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,farbe:0,boden:{k:'geysir',je:true,gt:2.0,gh:1.0,A:'weiss',B:'aqua'}},
  /* Dampf: Ruhe, zwei grosse Silberfontaenen aussen, Silberweiden im V (28.09.: ohne bunte Zufallssterne) */
  {n:6,gap:1.1,muster:'v',ang:0.40,eff:'glitzerweide',kal:'gross',farbe:0,boden:[{k:'riesen',x:-12,gt:6,A:'silber',C:FW.weiss},{k:'riesen',x:12,gt:6,A:'silber',C:FW.weiss}],pause:0.4},
  /* aktiv: 8 Ausbrueche, Saeulen faechern sich leicht auf, unten knistert der Boden */
  {n:40,je:5,gap:0.08,takt:[1.0,0.6,1.2],orte:[-12,6,-6,12,0,6,-12,-6],muster:'mitte',ang:0.25,hoehe:'steigend',hSpanne:22,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,th:'gold',farbe:2,
   boden:{k:'geysir',je:true,gt:1.6,A:'weiss'}},
  {mit:true,n:30,gap:0.22,muster:'zufall',ang:0.30,kal:'mini',pw:-9,eff:'tausend',farbe:0},
  /* Kettenreaktion: 12 Ausbrueche in 5,4 s, ueberlappend */
  {n:60,je:5,gap:0.08,takt:[0.45],orte:[6,-12,0,12,-6,6,-12,0,12,-6,0,6],muster:'treppe',hoehe:'steigend',hSpanne:25,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,farbe:1,
   boden:{k:'geysir',je:true,gt:1.4,A:'weiss',B:'tuerkis'}},
  {mit:true,n:24,gap:0.2,muster:'x',ang:0.50,rohre:'breit',kal:'klein',eff:'spinne',farbe:1},
  /* FINALE Grosser Ausbruch: alle fuenf Saeulen gleichzeitig, fuenf Geysire.
     Muster 'mitte' mit kleinem Winkel statt 'treppe' (Katalog): die Saeulen
     oeffnen sich zum Schluss wie Kelche, und die Kettenreaktion davor ist
     schon 'treppe' - kein Muster zweimal hintereinander */
  {n:25,je:5,gap:0.08,takt:[0],orte:[-12,-6,0,6,12],muster:'mitte',ang:0.12,hoehe:'steigend',hSpanne:30,eff:GEYSIR_SAEULE,kal:GEYSIR_KAL,farbe:0,
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
  {n:12,gap:1.4,muster:'zufall',ang:0.40,pw:3,eff:'gamboge',farbe:1,steig:'keiner',pause:1.0},
  /* Akt 2 Sternfall: Meteore, immer dichter */
  {n:30,gap:1.2,gapEnde:0.25,muster:'welle',ang:0.50,pw:4,eff:'meteor',kal:'klein',farbe:0,pause:1.2},
  /* Akt 2b Kometenhagel: harte Goldspinnen und Meteore im Zickzack */
  {n:40,gap:0.12,muster:'z',seg:3,ang:0.50,eff:['spinne','meteor'],kal:'mittel',farbe:0,steig:'komet',pause:1.5},
  /* Akt 3 Erdbeben: tief rumpelnd, Glut-Feuertoepfe, oben fallen weiter Meteore */
  {n:36,gap:0.3,muster:'gerade',kal:'klein',pw:-3,eff:'tausend',farbe:1,mine:true,mineEff:'glut'},
  {mit:true,n:8,gap:1.35,muster:'aussen',ang:0.50,eff:'meteor',kal:'mittel',farbe:0,pause:0.3},
  /* Akt 4 Feuersturm: Kreuzfeuer ueber die ganze Breite, unten stuerzen Truemmer */
  {n:48,gap:0.2,muster:'x',ang:0.50,rohre:'breit',pw:2,eff:['chrys','meteor','kamuro'],kal:'gross',farbe:1},
  {mit:true,n:24,gap:0.4,muster:'v',ang:0.60,kal:'klein',pw:-1,eff:'kaskade',farbe:2,pause:1.0},
  /* Akt 5 Die grossen Brocken: vier Kugelbomben mit Meteor-Hauptbild und Brokat-Nachbruechen */
  {n:4,gap:2.5,muster:'gerade',bomb:4,bombEff:'meteor',farbe:0,bombStufen:[{t:1.2,eff:'brokat',n:4,kranz:0.29}],pause:1.5},
  /* Akt 6 Stille */
  {n:0,pause:3.0},
  /* Akt 7 Einschlag: 72 Meteore in 3,6 s von der Mitte nach aussen, weisse Feuertoepfe - dann der Weltenblitz */
  /* 27.09.: gap 0,04 und pw 4 - dichtester und hoechster Moment der Show
     (Dichte- und Hoehenleiter, Steigerung im Ablauf: steigerung.js) */
  {n:72,gap:0.04,muster:'mitte',ang:0.60,pw:6,eff:'meteor',kal:'gross',farbe:0,mine:true,mineEff:'silber'},
  {at:'ende',n:1,muster:'gerade',eff:'weltenblitz',kal:'riesig',pw:4,pause:1.0},
  /* Akt 8 Asche: glimmende Flocken sinken langsam, kein Knall */
  {n:25,gap:0.35,muster:'zufall',ang:0.60,pw:8,eff:'glutasche',kal:'gross',steig:'keiner',pause:8}
]);
SIGNATUR.finale={eff:'meteor',text:'Kometenbomben: Meteore mit Glutschweif stürzen schräg herab'};

/* Level 25: Silvesternacht. 28.09. (Tom: echt): Roemisches Licht in Gold
   statt bunt, ohne weisses Bengal-Dauerlicht, Glockenschlag ohne Ring */
SHOWS.silvesternacht=()=>show({basis:{pw:4.50,sz:1.360,th:'gold'},rampe:{sz:[0.90,1.30],pw:[0,3],hell:[0.90,1.40],kurve:'spaet'}},[
  /* Vorabend: Goldfontaene und Tortenfontaene, dazu ein Roemisches Licht */
  {n:6,gap:1.2,muster:'zufall',ang:0.25,perle:true,farbe:0,boden:[{k:'fountain',gt:10,A:'gold',B:'zitrone',x:-3},{k:'torte',gt:10,A:'silber',x:3}],pause:1.0},
  /* Raketen: vier hohe Einzelschuesse mit langem Goldschweif */
  {n:4,gap:1.6,muster:'mitte',ang:0.35,steig:'gold',fuse:2.2,eff:'chrys',kal:'mittel',farbe:0,pause:1.0},
  /* Tanz ins neue Jahr: kleine Batterie im V */
  {n:6,gap:0.4,muster:'v',ang:0.35,eff:'palme',farbe:1,pause:1.5},
  /* ZWOELF SCHLAEGE: senkrecht, im Glockentakt */
  {n:12,gap:1.7,muster:'gerade',eff:'glockenschlag',kal:'gross',pw:4,steig:'keiner'},
  /* FINALE Mitternacht: beim 12. Schlag alles auf einmal, drei Riesenfontaenen */
  {at:'ende',n:12,gap:0.05,muster:'w',ang:0.60,eff:['kamuro','dahlie','brokat'],kal:'riesig',farbe:2,mine:true,mineEff:'gold',
   boden:[{k:'riesen',gt:5,x:-4,C:FW.gold},{k:'riesen',gt:5,x:0,C:FW.gold},{k:'riesen',gt:5,x:4,C:FW.gold}],pause:5.5}
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
  {n:20,gap:0.7,muster:'w',ang:0.45,eff:'spinne',farbe:1},
  {mit:true,n:20,gap:0.7,muster:'x',ang:0.50,rohre:'breit',eff:'rohrkomet',art:'glitter',boden:[{k:'fountain',x:-10,gt:14,A:'gold',B:'weiss'},{k:'fountain',x:10,gt:14,A:'gold',B:'weiss'}],pause:1.0},
  /* Gitter: drei Module, je Modul ein V, fuenf Sechser-Salven */
  {n:30,je:6,takt:[0.9],x:[-10,0,10],muster:'v',ang:0.45,eff:'rohrkomet',art:'silber',pause:1.4},
  /* Ruhe im Netz: Wasserfall mitten in der Show, oben Kronleuchter, unten kleine Blinker */
  {n:12,gap:1.5,muster:'gerade',eff:'kronleuchter',kal:'gross',farbe:0,boden:{k:'wasserfall',gt:20,A:'silber',B:'weiss'}},
  {mit:true,n:12,gap:1.5,muster:'zufall',ang:0.35,kal:'mini',pw:-7,eff:'blinkregen',farbe:1,pause:0.8},
  /* Gangwechsel: das Netz verdichtet sich, Feuertoepfe */
  {n:30,gap:0.1,muster:'x',ang:0.55,rohre:'breit',eff:['rohrkomet','spinne'],art:'silber',farbe:2,mine:true,mineEff:'farbe',pause:1.4},
  /* FINALE Netz zieht sich zu: zwei Zwoelfer-Salven Glitzerkometen von beiden Seiten, Riesen-Dahlien im Kreuzungspunkt */
  {n:24,je:12,takt:[0.8],x:[-10,10],muster:'schlag',ang:0.65,eff:'rohrkomet',art:'glitter',kal:'gross'},
  {mit:0.6,n:2,gap:0.8,muster:'gerade',eff:'dahlie',kal:'riesig',pw:4,farbe:0,boden:[{k:'riesen',x:-10,gt:4,C:FW.tuerkis},{k:'riesen',x:0,gt:4,C:FW.tuerkis},{k:'riesen',x:10,gt:4,C:FW.tuerkis}],pause:5}
]);
SIGNATUR.himmelsfaecher={idee:'gitter',text:'Titankometen aus drei Positionen spannen ein Netz'};

/* Level 26: Finale Grande. 28.09. (Tom: echt): kurze Goldfontaene als
   Eroeffnung statt 48 s gruen-weiss-rotem Bengallicht */
SHOWS.kugelfinale=()=>show({basis:{pw:5.00,sz:1.400,th:'tricolore'},rampe:{sz:[0.95,1.30],pw:[0,3],hell:[0.90,1.40],kurve:'linear'}},[
  {n:0,boden:{k:'fountain',gt:4,gh:0.8,A:'gold',B:'weiss'},pause:1.5},
  /* Salutini (0,7 s: dritte Tempoklasse) */
  {n:3,gap:0.7,muster:'v',ang:0.30,kal:'mini',pw:-6,eff:'salut',pause:0.6},
  {n:1,muster:'gerade',bomb:3,bombEff:'mehrschlag',steig:'gold',schlaege:1,bombStufen:['dahlie'],pause:4},
  {n:4,gap:0.3,muster:'w',ang:0.35,kal:'mini',pw:-6,eff:'salut',pause:0.5},
  {n:1,muster:'gerade',bomb:3,bombEff:'mehrschlag',steig:'gold',schlaege:2,bombStufen:['chrys','weide'],pause:5},
  {n:5,gap:0.15,muster:'mitte',ang:0.35,kal:'mini',pw:-6,eff:'salut',pause:0.5},
  {n:1,muster:'gerade',bomb:4,bombEff:'mehrschlag',steig:'gold',schlaege:3,bombStufen:['pistill','brokat','blinkregen'],pause:6},
  {n:6,gap:0.12,muster:'aussen',ang:0.40,kal:'mini',pw:-6,eff:'salut',pause:0.5},
  {n:1,muster:'gerade',bomb:4,bombEff:'mehrschlag',steig:'gold',schlaege:4,bombStufen:['kamuro','dahlie','spinne','zeitregen'],pause:7},
  {n:8,gap:0.1,muster:'zufall',ang:0.40,kal:'mini',pw:-6,eff:'salut',pause:0.6},
  /* FINALE: fuenf Schlaege, der letzte ist der Schlussschlag */
  {n:1,muster:'gerade',bomb:5,bombEff:'mehrschlag',steig:'gold',schlaege:5,bombStufen:['dahlie','kronleuchter','brokat','glitzerweide','schlussschlag'],pause:8}
]);
SIGNATUR.kugelfinale={eff:'mehrschlag',text:'eins, zwei, drei, vier, fünf Schläge übereinander'};

/* Level 26: Wolkenkratzer (neu) - farbe 0..3 = Etage im Thema hochhaus.
   28.09. (Tom: "Farben zu durcheinander"): Etagen ueber die Hoehe, nicht
   ueber vier Farben - Rot, Weiss/Silber und Gold (vorher Gold, Rot, Weiss,
   Blau und Violett zugleich) */
SHOWS.wolkenkratzer=()=>show({basis:{pw:5.05,sz:1.405,th:'hochhaus'},rampe:{sz:[0.95,1.30],pw:[0,2],hell:[0.90,1.40],kurve:'frueh'}},[
  /* Fundament: vier goldene Fontaenen laufen die ganze Show */
  {n:0,boden:[{k:'fountain',x:-6,gt:36,A:'gold',B:'zitrone'},{k:'fountain',x:-2,gt:36,A:'gold',B:'zitrone'},{k:'fountain',x:2,gt:36,A:'gold',B:'zitrone'},{k:'fountain',x:6,gt:36,A:'gold',B:'zitrone'}],pause:1.5},
  /* 1. Etage: rote Feuertoepfe im Scheibenwischer */
  {n:24,gap:0.25,nurMine:true,mineEff:'farbe',muster:'wischer',seg:2,ang:0.40,farbe:1},
  /* 2. Etage kommt dazu (1. laeuft weiter) */
  {n:30,gap:0.3,muster:'w',ang:0.35,kal:'mittel',pw:-2,eff:['dahlie','chrys'],farbe:2},
  {mit:true,n:30,gap:0.2,nurMine:true,mineEff:'farbe',muster:'zufall',ang:0.30,farbe:1},
  /* Dach: goldene Kronleuchter im Penthouse, darunter beide Etagen dicht */
  {n:8,gap:1.1,muster:'gerade',kal:'riesig',pw:6,eff:'kronleuchter',farbe:3},
  {mit:true,n:40,gap:0.22,muster:'v',ang:0.35,kal:'mittel',pw:-2,eff:['palme','spinne'],farbe:0},
  {mit:true,n:40,gap:0.22,nurMine:true,mineEff:'farbe',muster:'x',ang:0.35,farbe:1},
  /* FINALE Alle Lichter an: alle Etagen maximal */
  {n:12,gap:0.25,muster:'mitte',ang:0.40,kal:'riesig',pw:6,eff:'dahlie',farbe:2},
  {mit:true,n:24,gap:0.12,muster:'z',seg:2,ang:0.40,kal:'mittel',eff:'brokat',farbe:3},
  {mit:true,n:24,gap:0.12,nurMine:true,mineEff:'farbe',muster:'welle',ang:0.40,farbe:1,boden:[{k:'riesen',x:-6,gt:3,C:FW.rot},{k:'riesen',x:6,gt:3,C:FW.rot}]},
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

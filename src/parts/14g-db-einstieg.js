/* =========================================================
   Drehbuecher der Show-Produkte bis Level 15
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   Katalog: katalog-shows-einstieg.md. 21 Produkte, goldperlen ist
   gestrichen (Spielstaende: ERSETZT_DURCH -> roemisch).
   Hier stehen: die neuen Bruchbilder dieser Klasse (neue-effekte.md
   1.1), die Drehbuecher (SHOWS), die Signaturen (SIGNATUR).
   Alles in einer Kapsel, damit die Hilfsnamen nicht mit den anderen
   Katalog-Dateien zusammenstossen.
   ========================================================= */
(function(){
/* ---------------------------------------------------------
   Hilfen
   --------------------------------------------------------- */
/* Neue Brueche bringen Kern, Leuchthof und Nachglitzern nicht von
   selbst mit (neue-effekte.md): fwBurst liest bruchOpt erst nach dem
   Bruch, der Bruch darf es darum hier setzen. */
function zutaten(r,o){ if(r) r.bruchOpt=Object.assign({},r.bruchOpt||{},{kern:false,nachglitzer:false},o||{}); }
/* eigener Klang statt des Standardknalls */
sfx.e1still=()=>{};
function leise(r){ if(r) r.knall='e1still'; }
/* gefuehrte Sterne verblassen im Partikelsystem mit dem Alter (Farbe x
   Restleben) - das hier gleicht es aus, die Helligkeit steuert der Bruch */
function komp(st){ return 1/Math.max(0.1,1-st.alter/st.life); }
/* Stern mit eigener Physik: Luftwiderstand k (1/s), Schwerkraft g, fester
   Helligkeit hell (oder Funktion hf(st)); o.ende(st) am Lebensende */
function bahn(ps,p,v,c,life,o){
  o=o||{}; const k=o.k!==undefined?o.k:ZIEH, g=o.g!==undefined?o.g:3, hl=o.hell||1;
  return fuehre(ps,p.x,p.y,p.z,v[0],v[1],v[2],c,life,(st,dt)=>{ const w=st.v, f=Math.exp(-k*dt);
    w[0]*=f; w[2]*=f; w[1]=w[1]*f-g*dt;
    st.p[0]+=w[0]*dt; st.p[1]+=w[1]*dt; st.p[2]+=w[2]*dt;
    st.hell=(o.hf?o.hf(st):hl)*komp(st); },{spur:o.spur||0,ende:o.ende,mode:o.mode});
}
/* weicher Lichthof (additiver Wolkenballen), der einem Ort folgt:
   ort(t) -> [x,y,z], gr(t) Groesse m, a(t) Deckkraft */
function hof(dauer,ort,c,gr,a){
  const sp=wolkenSprite(true);
  return wolke(dauer,[sp],(w,t)=>{ const q=ort(t); wSetz(sp,q[0],q[1],q[2],gr(t),c,a(t)); });
}
/* hoechstens ein Plopp je 1/40 s - sonst stapeln sich die Toene */
const PLOPP={uhr:-9};
function plopp(p,v,h){ if(Math.abs(FW_UHR-PLOPP.uhr)<0.025) return; PLOPP.uhr=FW_UHR; schall(p,x=>sfx.plopp(x*v,h)); }
const WEISS=[1,1,1];

/* =========================================================
   Neue Bruchbilder (neue-effekte.md 1.1, 26.09., Tom: Anomalie).
   Jedes gehoert genau einem Produkt (SIGNATUR unten).
   ========================================================= */

/* Pusteblume (kinderbatterie): ein Samenstand aus silberweissen
   Samen mit kurzem Stiel steht still wie ein Loewenzahn, dann nimmt
   der Wind alle Samen gemeinsam mit - sie taumeln und glitzern. */
EFF.pusteblume=function(p,A,B,s,r){
  zutaten(r,{flash:0.35}); leise(r);
  schall(p,v=>{ rauschF({dur:0.22,vol:0.22*v,typ:'lowpass',f:520,an:0.01}); sfx.plopp(v*0.4,0.8); });
  const q=QUAL(), g=clamp(s,0.25,1.4), n=Math.round(rand(40,60)*q*clamp(0.7+g*0.5,0.8,1.3));
  const R=rand(1.4,1.7)*(0.75+g*0.8), tW=0.8+rand(0,0.15);
  /* Wind quer zum Blick, je Schuss eigene Richtung */
  const sd=Math.random()<0.5?-1:1, W=[sd*rand(1.5,2.5)*(0.8+g*0.3),0.3,rand(-0.5,0.5)];
  schall(p,v=>later(tW,()=>sfx.rieseln(v*0.7,2.2)));
  const c0=mischF([0.94,0.96,1],A,0.2), flaum=mischF([0.7,0.74,0.8],A,0.2);
  for(let i=0;i<n;i++){
    const d=randDir(), rr=R*rand(0.88,1.04), ph=rand(0,6.28), hz=rand(1,2), wk=rand(0.8,1.2), life=tW+rand(1.2,2.7);
    /* Ort analytisch: aufgehen (e^-7t), dann Wind weich einsetzend
       (0,7 s) plus Taumeln - Same und Flaum lesen denselben Ort */
    const ort=(t,o)=>{ const a=1-Math.exp(-t*7), va=7*rr*Math.exp(-t*7), u=t-tW;
      let w=0, m=0, tb=0; if(u>0){ m=Math.min(1,u/0.7)*wk; w=(u<0.7?u*u/1.4:0.35+(u-0.7))*wk; tb=0.2*Math.min(1,u/0.5)*Math.sin(u*hz*6.283+ph); }
      o.p[0]=p.x+d[0]*rr*a+W[0]*w; o.p[1]=p.y+d[1]*rr*a+W[1]*w+tb; o.p[2]=p.z+d[2]*rr*a+W[2]*w+tb*0.4;
      o.v[0]=d[0]*va+W[0]*m; o.v[1]=d[1]*va+W[1]*m; o.v[2]=d[2]*va+W[2]*m; return u; };
    /* Same mit Stiel (Spur zur Mitte), im Wind nur noch ein kurzer Strich */
    fuehre(psMid,p.x,p.y,p.z,d[0]*7*rr,d[1]*7*rr,d[2]*7*rr,c0,life,(st,dt)=>{ const u=ort(st.alter,st);
      if(u>0&&!st.d.kurz){ st.d.kurz=true; st.ps.tl[st.i]=0.06; }
      /* steht: ruhiges Silber; im Wind: weiches Glitzern, 3 Hz */
      st.hell=(u>0?0.8+0.45*Math.sin(u*3*6.283+ph):1.15)*komp(st); },{spur:0.3});
    /* Flaum: weicher Schirm um jeden Samen */
    fuehre(psBig,p.x,p.y,p.z,0,0,0,flaum,life,(st,dt)=>{ const u=ort(st.alter,st); st.hell=(u>0?0.42:0.5)*Math.min(1,st.alter/0.25)*komp(st); });
  }
  /* kurzer Kern in B */
  const alt=SCHWEIF; SCHWEIF=0;
  for(let i=0;i<5;i++) psBig.emit(p.x,p.y,p.z,rand(-.3,.3),rand(-.3,.3),rand(-.3,.3),B[0],B[1],B[2],rand(0.25,0.4),0,0);
  SCHWEIF=alt;
};

/* Brausepulver (kinderparty): Pastellperlen ohne Schweif, die einzeln
   und in zufaelliger Reihenfolge mit hohem Plopp zerplatzen. */
EFF.brausepulver=function(p,A,B,s,r){
  zutaten(r,{flash:0.25}); leise(r);
  schall(p,v=>sfx.plopp(v*0.5,0.75));
  const q=QUAL(), g=clamp(s,0.3,1.4), n=Math.round(rand(25,35)*q*clamp(0.7+g*0.4,0.8,1.2));
  const farben=[A,B,WEISS].map(c=>mischF(c,WEISS,0.32));
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(5,6)*(0.6+g*0.55), c=farben[i%3], tP=rand(0.5,1.8);
    bahn(psBig,p,[d[0]*w,d[1]*w,d[2]*w],c,tP,{g:1.6,hell:1.05,ende:st=>{
      const x=st.p[0], y=st.p[1], z=st.p[2], alt=SCHWEIF; SCHWEIF=0;
      psBig.emit(x,y,z,0,0,0,1.5,1.5,1.5,0.05,0,0);
      for(let k=0;k<8+Math.floor(Math.random()*5);k++){ const e=randDir(), u=rand(2,3.5); psSmall.emit(x,y,z,e[0]*u,e[1]*u,e[2]*u,1.3,1.3,1.25,0.15,1,0); }
      SCHWEIF=alt;
      plopp({x,y,z},0.35,1.5*rand(0.8,1.2)); }});
  }
};

/* Glitzerspur (glitzerregen12): Goldchrysantheme, deren Sterne dunkle
   Troepfchen verlieren - jedes blitzt spaeter genau einmal auf. */
EFF.glitterspur=function(p,A,B,s,r){
  zutaten(r,{kern:true,flash:0.8});
  const q=QUAL(), n=Math.round(rand(60,80)*q*clamp(0.6+s*0.4,0.7,1.3)), G=3.2, alt=SCHWEIF, spur=[];
  SCHWEIF=0.3;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(7,9)*s, c=i%4?A:B, L=rand(1.2,1.6), v=[d[0]*w,d[1]*w,d[2]*w];
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0],c[1],c[2],L,G,0);
    if(i%2===0) spur.push({v,L}); }
  SCHWEIF=alt;
  /* alle 0,1 s ein Troepfchen je zweitem Stern; es faellt und blitzt
     0,3-0,8 s spaeter einmal weissgold auf */
  const bern=[1,.5,.1];
  for(let t=0.1;t<1.6;t+=0.1){ const tt=t;
    imBild(tt,()=>{ for(const x of spur){ if(tt>x.L*0.95) continue; const e=bahnOrt(p,x.v,G,tt), w=bahnTempo(x.v,G,tt);
      glint(psMid,e.x,e.y,e.z,w[0]*0.12+rand(-.25,.25),w[1]*0.12-0.4,w[2]*0.12+rand(-.25,.25),bern,2.4,{t0:0.3,t1:0.8,dim:0.3,psBlitz:psBig,blitz:2.0,blitzFarbe:[1,.9,.62]}); } }); }
  schall(p,v=>later(0.35,()=>sfx.rieseln(v*0.9,1.2)));
};

/* Pulverschnee (schneeballschlacht): kompakte weisse Wolke, die sofort
   zerstaeubt und langsam herunterrieselt. Mit treffen brechen zwei
   Schneebaelle am selben Punkt - zwei Plopps, 30 ms versetzt. */
EFF.pulverschnee=function(p,A,B,s,r){
  zutaten(r,{flash:0.55}); leise(r);
  const vers=r&&r.par&&r.par.treffen?0.03*((r.par.q|0)%2):0;
  schall(p,v=>later(vers,()=>{ rauschF({dur:0.34,vol:0.32*v,typ:'bandpass',f:800,f2:250,q:0.7,an:0.01}); sfx.plopp(v*0.55,0.65); }));
  const q=QUAL(), n=Math.round(rand(100,140)*q*clamp(0.5+s*0.5,0.7,1.3)), k=3.2, vmax=5.5*(0.5+s*0.8), alt=SCHWEIF;
  SCHWEIF=0; psHuge.emit(p.x,p.y,p.z,0,0,0,1.25,1.25,1.3,0.07,0,0); SCHWEIF=alt;
  const sink=rand(0.6,1.0);
  const flug=(ps,c,L,hs,w)=>{ const d=randDir();
    fuehre(ps,p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c,L,(st,dt)=>{ const v=st.v, f=Math.exp(-k*dt);
      v[0]*=f; v[2]*=f; v[1]=v[1]*f-sink*(1-f);
      st.p[0]+=v[0]*dt; st.p[1]+=v[1]*dt; st.p[2]+=v[2]*dt;
      st.hell=hs*(0.78+Math.random()*0.35)*komp(st)*(1-glatt(L*0.6,L,st.alter)); }); };
  for(let i=0;i<n;i++) flug(psMid,i%3?WEISS:FW.silber,rand(2.5,3.0),rand(0.8,1.1),vmax*Math.sqrt(rand(0.1,1)));
  /* ein paar weiche Flocken machen die Wolke dicht */
  for(let i=0;i<Math.round(16*q);i++) flug(psBig,[0.75,0.78,0.85],rand(1.6,2.4),0.45,vmax*rand(0.2,0.7));
};

/* Zeitsterne (sternstaub20, japanisch Jisa-shiki): der Bruch oeffnet
   dunkel, dann gehen die Sterne einer nach dem anderen an. */
EFF.zeitsterne=function(p,A,B,s,r){
  zutaten(r,{flash:false}); leise(r);
  schall(p,v=>sfx.plopp(v*0.45,1.1));
  const q=QUAL(), n=Math.round(rand(40,60)*q*clamp(0.7+s*0.4,0.8,1.25)), G=1.2;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(8,10)*s, v=[d[0]*w,d[1]*w,d[2]*w], tz=rand(0.3,1.8), c=i%5===4?B:A, L=rand(1.0,1.4);
    /* jeder Stern geht genau einmal an, funkelt ruhig und verlischt */
    const fz=rand(5,9), fp=rand(0,6.28), hf=h=>st=>h*Math.min(1,st.alter/0.1)*(0.82+0.18*Math.sin(st.alter*fz+fp))*(1-glatt(L*0.6,L,st.alter));
    imBild(tz,()=>{ const e=bahnOrt(p,v,G,tz), u=bahnTempo(v,G,tz);
      bahn(psHuge,e,u,c,L,{g:G,hf:hf(0.75)}); bahn(psBig,e,u,c,L,{g:G,hf:hf(1.3)}); }); }
};

/* Irrlicht (zauberwald): wenige grosse, weiche Lichter schweben nach
   einem leisen Plopp und irren auf eigenen Bahnen umher. */
EFF.irrlicht=function(p,A,B,s,r){
  zutaten(r,{flash:0.3}); leise(r);
  schall(p,v=>{ sfx.plopp(v*0.7,0.55); rauschF({dur:0.25,vol:0.1*v,typ:'lowpass',f:300}); });
  const q=QUAL(), g=clamp(s,0.35,1.3), n=Math.round(rand(5,8)), id=Math.random();
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(1,2)*(0.8+g*0.6), c=i%3===2?B:A, L=rand(3,4), ph=rand(0,6.28), hz=rand(1,1.5);
    let kurs=rand(0,6.28), tempo=rand(0.5,1), neu=0;
    const lp=fuehre(psBig,p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c,L,(st,dt)=>{
      const v=st.v, t=st.alter; neu-=dt;
      if(neu<=0){ neu=rand(0.6,1.0); kurs+=rand(-1.7,1.7); tempo=rand(0.5,1.0)*(0.8+g*0.4); }
      const m=Math.min(1,dt*1.6);
      v[0]+=(Math.cos(kurs)*tempo-v[0])*m; v[2]+=(Math.sin(kurs)*tempo*0.6-v[2])*m; v[1]+=(-0.3-v[1])*m;
      st.p[0]+=v[0]*dt; st.p[1]+=v[1]*dt; st.p[2]+=v[2]*dt;
      const h=(0.6+0.4*(0.5+0.5*Math.sin(t*hz*6.283+ph)))*Math.min(1,t/0.3)*(t>L-0.7?Math.max(0,(L-t)/0.7):1);
      st.d.h=h; st.hell=1.35*h*komp(st);
      /* Zauberstaub hinter dem Licht */
      st.d.acc=(st.d.acc||0)+dt*16*q*h;
      for(;st.d.acc>=1;st.d.acc--) psSmall.emit(st.p[0]+rand(-.12,.12),st.p[1]+rand(-.1,.1),st.p[2]+rand(-.12,.12),rand(-.15,.15),rand(-.4,0),rand(-.15,.15),c[0]*1.2,c[1]*1.2,c[2]*1.2,rand(0.5,0.9),0.2,0);
      if(i===0) licht('irr'+id,{x:st.p[0],y:st.p[1],z:st.p[2]},A,0.9*h,{weite:14});
    });
    hof(L,()=>lp.p,c,()=>(1.4+0.5*(lp.d.h||0))*(0.7+g*0.4),()=>0.3*(lp.d.h||0));
  }
};

/* Klangperle (heulbatterie): am Ende des Heuleraufstiegs bleibt eine
   Leuchtkugel stehen, solange der Ton ausklingt. Tiefer Ton: gross und
   bernstein; hoher Ton: klein und weissgruen. gleit: Heulboje, schaukelt. */
EFF.klangperle=function(p,A,B,s,r){
  zutaten(r,{flash:0.3}); leise(r);
  const ton=r&&typeof r.ton==='number'?r.ton:0, gl=!!(r&&r.par&&r.par.gleit), u=gl?0:clamp(ton/12,0,1);
  const c=mischF(mischF(FW.bernstein,[0.78,1,0.78],u),A,0.22), gr=(gl?1.7:1.3-0.55*u)*clamp(0.7+s*0.4,0.8,1.3), L=gl?rand(2.6,3.0):rand(1.8,2.2), ph=rand(0,6.28);
  const ort=t=>[p.x+(gl?0.6*Math.sin(t*Math.PI+ph):0),p.y-(gl?0.6:1)*t,p.z];
  const hell=t=>Math.min(1,t/0.15)*(1-glatt(L*0.4,L,t));
  const kugel=(ps,cc,h0)=>fuehre(ps,p.x,p.y,p.z,0,0,0,cc,L,(st,dt)=>{ const t=st.alter, q=ort(t);
    st.p[0]=q[0]; st.p[1]=q[1]; st.p[2]=q[2]; st.v[0]=gl?0.6*Math.PI*Math.cos(t*Math.PI+ph):0; st.v[1]=gl?-0.6:-1; st.v[2]=0;
    st.hell=h0*hell(t)*komp(st); });
  kugel(psHuge,c,1.1); kugel(psBig,mischF(c,WEISS,0.45),1.3);
  hof(L,ort,c,()=>2.3*gr,t=>0.42*hell(t));
  /* Kranz aus 8-10 Silberfunken */
  const [bu,bv]=basisBlick(p,0.3), m=8+Math.floor(Math.random()*3), alt=SCHWEIF; SCHWEIF=0.18;
  for(let i=0;i<m;i++){ const a=i/m*6.283+rand(-.1,.1), w=3.4*gr, x=Math.cos(a), y=Math.sin(a);
    psMid.emit(p.x,p.y,p.z,(bu[0]*x+bv[0]*y)*w,(bu[1]*x+bv[1]*y)*w,(bu[2]*x+bv[2]*y)*w,.9,.93,1,rand(0.5,0.7),1,0); }
  SCHWEIF=alt;
  /* die Perle klingt in der Tonhoehe des Heulers nach, leise wie eine Glocke */
  schall(p,v=>{ const f=gl?1600*Math.pow(2,(ton-12-5)/12):1600*Math.pow(2,(ton+2)/12);
    tonGen({f,dur:L*0.9,vol:0.011*v,an:0.03,ab:L*0.7,vib:gl?{hz:0.5,cent:25}:null}); });
};

/* Pfauenauge (pfauenrad): flache Feder zum Zuschauer - tuerkiser
   Aussenring mit goldenen Federaesten, blauer Innenring, goldenes Auge. */
EFF.pfauenauge=function(p,A,B,s,r){
  zutaten(r,{kern:true,flash:0.8});
  const q=QUAL(), [u,v]=basisBlick(p,0.2), rot=rand(-0.44,0.44), cr=Math.cos(rot), sr=Math.sin(rot), gold=FW.gold, alt=SCHWEIF, oval=1.28;
  const E=(x,y)=>{ const X=x*cr-y*sr, Y=x*sr+y*cr; return [u[0]*X+v[0]*Y,u[1]*X+v[1]*Y,u[2]*X+v[2]*Y]; };
  const sp=8.6*s, G=1.4;
  const no=Math.round(rand(28,36)*Math.max(0.75,q));
  for(let i=0;i<no;i++){ const a=i/no*6.283+rand(-.03,.03), d=E(Math.cos(a),Math.sin(a)*oval), w=sp*rand(0.97,1.03);
    SCHWEIF=0.1; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,A[0],A[1],A[2],rand(1.8,2.1),G,0);
    /* Federaeste: goldene Funkenfahnen innen am Aussenring */
    SCHWEIF=0.5; for(let k=0;k<Math.round(3*q+0.4);k++){ const f=rand(0.6,0.88), j=rand(-0.06,0.06), e=E(Math.cos(a+j),Math.sin(a+j)*oval);
      psMid.emit(p.x,p.y,p.z,e[0]*w*f,e[1]*w*f,e[2]*w*f,gold[0],gold[1]*0.88,gold[2]*0.55,rand(1.4,1.8),G,4); } }
  SCHWEIF=0.06;
  for(let i=0;i<16;i++){ const a=i/16*6.283, d=E(Math.cos(a),Math.sin(a)*oval*0.95), w=sp*0.42;
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,B[0],B[1],B[2],rand(1.7,2.0),G,0); }
  SCHWEIF=0;
  for(let i=0;i<7;i++){ const a=rand(0,6.283), d=E(Math.cos(a),Math.sin(a)*oval), w=sp*rand(0.03,0.14);
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,gold[0]*1.2,gold[1]*1.1,gold[2],rand(1.6,1.9),G*0.6,0); }
  psHuge.emit(p.x,p.y,p.z,0,-0.3,0,gold[0]*0.6,gold[1]*0.55,gold[2]*0.3,1.4,0,0);
  SCHWEIF=alt;
};

/* Falterlicht (nachtfalter): ein heller Lichtpunkt, um den violette und
   goldene Falter flatternd kreisen, naeher kommen und darin verglühen. */
EFF.falterlicht=function(p,A,B,s,r){
  zutaten(r,{flash:0.4}); leise(r);
  const q=QUAL(), g=clamp(s,0.45,1.4), n=Math.round(rand(16,24)*Math.max(0.7,q)), id=Math.random(), L=3, sink=0.5;
  schall(p,v=>{ sfx.plopp(v*0.5,0.9); tonGen({f:170,am:rand(10,13),amTiefe:0.7,rausch:0.7,typ:'sawtooth',lp:700,dur:2.6,vol:0.008*v,an:0.3,ab:1}); });
  const mitte=t=>[p.x,p.y-sink*t,p.z];
  const lampe=(ps,c,h0,lt)=>fuehre(ps,p.x,p.y,p.z,0,0,0,c,L,(st,dt)=>{ const m=mitte(st.alter); st.p[0]=m[0]; st.p[1]=m[1]; st.p[2]=m[2]; st.v[1]=-sink;
    const h=Math.min(1,st.alter/0.1)*(1-glatt(L*0.8,L,st.alter)); st.hell=h0*h*komp(st);
    if(lt) licht('falter'+id,{x:m[0],y:m[1],z:m[2]},[1,0.97,0.9],1.4*h,{weite:16}); });
  lampe(psHuge,[1,1,0.96],1.35,true); lampe(psBig,WEISS,1.4,false);
  for(let i=0;i<n;i++){
    const c=i%3===2?B:A, e=randDir(), [e1,e2]=quer(e), om=rand(2,4)*(Math.random()<0.5?-1:1), T=rand(1.3,2.9), r0=rand(2,4)*(0.7+g*0.35);
    let phi=rand(0,6.28), dr=0, zick=0; const wf=rand(8,12), wph=rand(0,6.28);
    fuehre(psBig,p.x,p.y,p.z,0,0,0,c,T,(st,dt)=>{ const t=st.alter, m=mitte(t);
      zick-=dt; if(zick<=0){ zick=rand(0.1,0.3); dr=rand(-0.45,0.45)*(0.7+g*0.3); phi+=rand(-0.5,0.5); }
      phi+=om*dt;
      /* ausfliegen, dann Kreise, die enger werden, bis der Falter im Licht ist */
      const aus=1-Math.exp(-t*9), rad=Math.max(0,(r0+dr)*aus*(1-Math.pow(t/T,1.4)));
      const x=Math.cos(phi)*rad, y=Math.sin(phi)*rad, id2=1/Math.max(dt,1e-3);
      const nx=m[0]+e1[0]*x+e2[0]*y, ny=m[1]+e1[1]*x+e2[1]*y, nz=m[2]+e1[2]*x+e2[2]*y;
      st.v[0]=(nx-st.p[0])*id2; st.v[1]=(ny-st.p[1])*id2; st.v[2]=(nz-st.p[2])*id2;
      st.p[0]=nx; st.p[1]=ny; st.p[2]=nz;
      /* Fluegelschlag 8-12 Hz, gedimmt */
      st.hell=(Math.sin(t*wf*6.283+wph)>0?0.75:0.2)*komp(st);
    },{spur:0.06,ende:st=>{ const x=st.p[0], y=st.p[1], z=st.p[2], a=SCHWEIF; SCHWEIF=0;
      psBig.emit(x,y,z,0,0,0,1.4,1.1,0.6,0.08,0,0);
      for(let k=0;k<6;k++){ const d=randDir(), w=rand(1,2.2); psSmall.emit(x,y,z,d[0]*w,d[1]*w,d[2]*w,1,.7,.3,rand(0.15,0.3),2,0); }
      SCHWEIF=a; }});
  }
};

/* Flitterstern (batterie16): Goldsterne, deren Funken sich im Flug
   wie Tannennadeln verzweigen (Matsuba) - ein wanderndes Goldnetz. */
EFF.flitterstern=function(p,A,B,s,r){
  zutaten(r,{kern:true,flash:0.8});
  const q=QUAL(), n=Math.round(rand(40,60)*q*clamp(0.6+s*0.4,0.7,1.3)), G=2.8, alt=SCHWEIF, st=[];
  const gold=mischF(FW.gold,A,0.3);
  SCHWEIF=0.22;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(8,10)*s, L=rand(1.3,1.6), v=[d[0]*w,d[1]*w,d[2]*w];
    psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],gold[0],gold[1],gold[2],L,G,0);
    /* Spitzen in B */
    if(i%5===0) psMid.emit(p.x,p.y,p.z,v[0]*1.02,v[1]*1.02,v[2]*1.02,B[0],B[1],B[2],L*0.9,G,0);
    st.push({v,L}); }
  SCHWEIF=alt;
  /* alle 0,12 s wirft jeder Stern einen Funken, der sich verzweigt */
  const C=[1,.86,.5];
  for(let t=0.12;t<1.5;t+=0.12){ const tt=t;
    imBild(tt,()=>{ for(let i=0;i<st.length;i+=(QUAL()<1?2:1)){ const x=st[i]; if(tt>x.L*0.9) continue; const e=bahnOrt(p,x.v,G,tt), w=bahnTempo(x.v,G,tt), d=randDir(), u=rand(1.8,3.2);
      verzweig(psMid,e.x,e.y,e.z,w[0]*0.3+d[0]*u,w[1]*0.3+d[1]*u,w[2]*0.3+d[2]*u,gold,0.3,2.5,{n:[3,6],tz:rand(0.1,0.25),C,tiefe:Math.random()<0.25?2:1}); } }); }
  schall(p,v=>{ for(let i=0;i<5;i++) later(0.25+i*0.22,()=>sfx.prasseln(v*0.9)); });
};

/* Mondsichel (mondschein): blasssilberne Sichel mit weichem Mondhof,
   steht still und rieselt dann als Silberstaub herab. */
EFF.mondsichel=function(p,A,B,s,r){
  zutaten(r,{flash:0.45}); leise(r);
  schall(p,v=>{ tone(68,0.45,'sine',0.2*v,38); rauschF({dur:0.35,vol:0.22*v,typ:'lowpass',f:320}); });
  const q=QUAL(), [u,v]=basisBlick(p,0.2), rot=rand(-0.7,0.7), cr=Math.cos(rot), sr=Math.sin(rot), R=6.2*clamp(s,0.4,1.5);
  const E=(x,y)=>{ const X=(x*cr-y*sr)*R, Y=(x*sr+y*cr)*R; return [u[0]*X+v[0]*Y,u[1]*X+v[1]*Y,u[2]*X+v[2]*Y]; };
  /* Aussenbogen 200 Grad um die Mitte, Innenbogen: Kreis durch die
     Spitzen, Mitte -0,64 R, Radius 1,09 R (Sichel 0,55 R dick) */
  const pkt=[], na=Math.round(24*Math.max(0.75,q)), ni=Math.round(15*Math.max(0.75,q));
  for(let i=0;i<na;i++){ const a=(-100+200*i/(na-1))*Math.PI/180; pkt.push([Math.cos(a),Math.sin(a)]); }
  for(let i=1;i<=ni;i++){ const a=(-64.7+129.4*i/(ni+1))*Math.PI/180; pkt.push([-0.639+1.089*Math.cos(a),1.089*Math.sin(a)]); }
  for(let i=0;i<5;i++){ const a=rand(-0.9,0.9), f=rand(0.62,0.9); pkt.push([Math.cos(a)*f+0.05,Math.sin(a)*f*0.9]); }
  const c=mischF([1,0.96,0.74],A,0.15), stand=2.0;
  for(const [x,y] of pkt){ const z=E(x+rand(-.02,.02),y+rand(-.02,.02)), L=stand+rand(0.35,0.6), hs=rand(0.95,1.2);
    fuehre(psBig,p.x,p.y,p.z,z[0]*9,z[1]*9,z[2]*9,c,L,(st,dt)=>{ const t=st.alter, a=1-Math.exp(-t*9), fall=0.15*t;
      st.p[0]=p.x+z[0]*a; st.p[1]=p.y+z[1]*a-fall; st.p[2]=p.z+z[2]*a;
      st.v[0]=z[0]*9*Math.exp(-t*9); st.v[1]=z[1]*9*Math.exp(-t*9)-0.15; st.v[2]=z[2]*9*Math.exp(-t*9);
      /* nach der Standzeit zerfaellt der Stern in Silberstaub */
      if(t>stand&&!st.d.staub){ st.d.staub=true; const al=SCHWEIF; SCHWEIF=0.2;
        for(let k=0;k<3+Math.floor(Math.random()*3*q);k++) psMid.emit(st.p[0],st.p[1],st.p[2],rand(-.35,.35),rand(-0.9,-0.2),rand(-.35,.35),.85,.9,1,rand(1.5,2.4),1.2,4);
        SCHWEIF=al; }
      st.hell=hs*(t>stand?Math.max(0,1-(t-stand)/(L-stand)):1)*komp(st); },{spur:0.08});
  }
  /* Mondhof um die Sichel */
  const m=E(0.25,0), hm=[p.x+m[0],p.y+m[1],p.z+m[2]];
  hof(stand+0.4,t=>[hm[0],hm[1]-0.15*t,hm[2]],[0.55,0.6,0.78],()=>R*2.9,t=>0.2*Math.min(1,t/0.15)*(1-glatt(0.6,stand+0.4,t)));
};

/* Fischschwarm (knisterfaecher): Silberfische schwimmen nach dem Bruch
   gemeinsam in eine Richtung, wenden zusammen und stieben auseinander.
   Vereinfacht (neue-effekte.md 9): ein gemeinsamer Schwarmvektor. */
EFF.fischschwarm=function(p,A,B,s,r){
  zutaten(r,{flash:0.5}); leise(r);
  const q=QUAL(), g=clamp(s,0.5,1.4), n=Math.round(rand(30,40)*Math.max(0.7,q)), [u,v]=basisBlick(p,0), T=1.8, L=2.5;
  schall(p,x=>{ sfx.plopp(x*0.5,1); sfx.zischen(x*0.5,1.6); later(T,()=>rauschF({dur:0.6,vol:0.12*x,typ:'highpass',f:2500,an:0.05})); });
  /* Schwarm: Richtung a in der Blickebene, Mitte c */
  const S={a:rand(0,6.28),ziel:0,c:[p.x,p.y,p.z],uhr:-1,t0:FW_UHR};
  S.ziel=S.a;
  const wenden=Math.random()<0.5?1:2;
  for(let k=0;k<wenden;k++) imBild(0.7+k*0.55+rand(0,0.12),()=>{ S.ziel=S.a+(Math.random()<0.5?-1:1)*rand(1.57,2.6); });
  const tempo=4.2*(0.7+g*0.4);
  const dirS=()=>{ const ca=Math.cos(S.a), sa=Math.sin(S.a)*0.55; return [u[0]*ca+v[0]*sa,u[1]*ca+v[1]*sa,u[2]*ca+v[2]*sa]; };
  const schritt=dt=>{ if(S.uhr===FW_UHR) return; S.uhr=FW_UHR; const t=FW_UHR-S.t0;
    /* Wende in etwa 0,3 s */
    S.a+=(S.ziel-S.a)*Math.min(1,dt/0.1);
    if(t>0.4&&t<T){ const D=dirS(); for(let k=0;k<3;k++) S.c[k]+=D[k]*tempo*dt; } };
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(6,8)*(0.7+g*0.35), c=i%4?A:mischF(A,B,0.6), ph=rand(0,6.28), f0=rand(-1,1)*0.9;
    fuehre(psMid,p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,c,L+rand(-0.3,0.2),(st,dt)=>{ schritt(dt); const t=st.alter, V=st.v;
      if(t<0.4){ const f=Math.exp(-2.5*dt); V[0]*=f; V[1]*=f; V[2]*=f; }
      else if(t<T){ const D=dirS(), m=Math.min(1,dt*4), qs=Math.sin(t*9+ph)*1.3;
        /* Ausrichtung + Zusammenhalt zur Schwarmmitte + Schwanzschlag quer */
        for(let k=0;k<3;k++){ const zu=(S.c[k]-st.p[k])*1.1; V[k]+=((D[k]*tempo)+zu+(k===1?qs*0.3:0)-V[k])*m; }
        V[0]+=v[0]*qs*dt*6; V[2]+=v[2]*qs*dt*6; }
      else { if(!st.d.frei){ st.d.frei=true; const e=randDir(); for(let k=0;k<3;k++) V[k]+=e[k]*rand(4,7); } const f=Math.exp(-1.2*dt); V[0]*=f; V[1]=V[1]*f-1.5*dt; V[2]*=f; }
      st.p[0]+=V[0]*dt; st.p[1]+=V[1]*dt; st.p[2]+=V[2]*dt;
      st.hell=1.5*(t<T?1:Math.max(0,1-(t-T)/(st.life-T)))*komp(st)*(0.85+0.15*Math.sin(t*14+f0*9)); },{spur:0.14});
  }
};

/* Lampare (batterie49): Feuerball in der Luft - Glutkugel, grosse
   langsame Flammen (gelb, orange, dunkelrot), Auftrieb, dann Rauch. */
EFF.lampare=function(p,A,B,s,r){
  zutaten(r,{flash:1.3}); leise(r);
  schall(p,v=>{ sfx.wumms(v*1.1); rauschF({dur:0.9,vol:0.3*v,typ:'lowpass',f:260,an:0.03}); });
  const q=QUAL(), g=clamp(s,0.4,1.6), n=Math.round(rand(60,80)*q*clamp(0.6+g*0.4,0.7,1.3)), alt=SCHWEIF;
  SCHWEIF=0.12;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(3,5)*g*rand(0.6,1), L=rand(0.8,1.2);
    psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w+0.6,d[2]*w,1,.82,.32,L,-1,2,.55,.06,.01); }
  SCHWEIF=0;
  for(let i=0;i<6;i++) psHuge.emit(p.x,p.y,p.z,rand(-.4,.4),rand(0,.6),rand(-.4,.4),1,.7,.3,rand(0.3,0.55),-0.5,0);
  SCHWEIF=alt;
  /* Glutkugel: drei Ballen, die aufquellen und verloeschen */
  for(let k=0;k<3;k++){ const R=(2.2+k*0.9)*g, c=[[1,.75,.3],[1,.45,.1],[.8,.2,.04]][k];
    hof(1.3,t=>[p.x,p.y+0.8*t,p.z],c,t=>R*(0.45+0.55*(1-Math.exp(-t*5))),t=>(0.55-k*0.12)*Math.min(1,t/0.06)*(1-glatt(0.25+k*0.1,1.25,t))); }
  flash(p,[1,.52,.16],4.5*g,1.0);
  const ort={x:p.x,y:p.y,z:p.z};
  later(0.8,()=>rauchball({x:ort.x,y:ort.y+0.6,z:ort.z},{r:2.4*g,n:6,dauer:2.6,quellen:0.8,steigen:0.6,c:[0.11,0.09,0.08],a:0.45}));
};

/* Tausendblueten (sternenmeer42, japanisch Senrin): dunkler Bruch,
   ein Atemzug Stille, dann platzen alle kleinen Blueten zugleich -
   jede in EINER Farbe. */
EFF.tausendblueten=function(p,A,B,s,r){
  zutaten(r,{flash:0.2}); leise(r);
  schall(p,v=>sfx.plopp(v*0.5,1.1));
  const q=QUAL(), n=Math.round(rand(15,25)*Math.max(0.75,q)*clamp(0.8+s*0.2,0.9,1.15)), G=1.8, tB=rand(0.5,0.7), bw=clamp(s,0.6,1.4);
  const alt=SCHWEIF; SCHWEIF=0; psHuge.emit(p.x,p.y,p.z,0,0,0,0.5,0.45,0.35,0.06,0,0); SCHWEIF=alt;
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(5,7)*s, v=[d[0]*w,d[1]*w,d[2]*w], tz=tB+rand(-0.08,0.08), c=i%2?B:A;
    imBild(tz,()=>{ const e=bahnOrt(p,v,G,tz), m=Math.round(rand(10,14)*Math.max(0.75,q)), a=SCHWEIF; SCHWEIF=0.12;
      psHuge.emit(e.x,e.y,e.z,0,0,0,c[0]*0.9+0.3,c[1]*0.9+0.3,c[2]*0.9+0.3,0.07,0,0);
      for(let k=0;k<m;k++){ const f=randDir(), u=rand(1.6,2.1)*bw; psBig.emit(e.x,e.y,e.z,f[0]*u,f[1]*u,f[2]*u,c[0],c[1],c[2],rand(0.75,0.9),1.5,0); }
      SCHWEIF=a; }); }
  /* dichtes Prasseln aus lauter Einzelklicks */
  schall(p,v=>later(tB-0.08,()=>{ for(let i=0;i<n;i++) later(rand(0,0.18),()=>sfx.klick(v*1.6,rand(0.6,1.3))); sfx.crack(v*0.5); }));
};

/* Leuchtspuren je Bruchbild (mitSchweif): die Brueche setzen ihre Spur
   selbst, hier nur die Vorgabe fuer alles, was sie nicht setzen */
Object.assign(EFF_SCHWEIF,{pusteblume:0,brausepulver:0,glitterspur:0.3,pulverschnee:0,zeitsterne:0,irrlicht:0,klangperle:0,pfauenauge:0.1,
  falterlicht:0,flitterstern:0.22,mondsichel:0,fischschwarm:0.14,lampare:0.12,tausendblueten:0.12});
/* Figuren stehen allein (effPassen) */
EFF_FAMILIE.pfauenauge='figur'; EFF_FAMILIE.mondsichel='figur';

/* =========================================================
   Drehbuecher (Katalog katalog-shows-einstieg.md, 26.09.)
   Grundstufe steigt mit dem Level: L4 -11,5/0,40 ... L15 -3/0,92.
   ========================================================= */
const DB={
  /* Pusteblume, L4: zwei Loewenzahnblueten, dann vier Pusteblumen */
  kinderbatterie:()=>show({basis:{pw:-11.5,sz:0.40,th:'silber'}, rampe:{sz:[0.9,1.15],pw:[-1,1],hell:[0.9,1.15],kurve:'linear'}}, [
    {n:2,gap:1.7,eff:'kugel',kal:'mini',th:'gold',muster:'gerade',steig:'keiner',bruchOpt:{kern:false,nachglitzer:false},pause:0.9},
    {n:2,gap:1.5,eff:'pusteblume',steig:'silber',muster:'zufall',ang:0.12,boden:{k:'torte',gt:4,A:'silber'},pause:1.0},
    {n:2,gap:0,muster:'v',ang:0.22,eff:'pusteblume',kal:'klein',steig:'silber',pause:3.0}
  ]),
  /* Brausepulver, L6: Bodenkreisel, Brauseschuesse, Tortenfontaenen */
  kinderparty:()=>show({basis:{pw:-10.5,sz:0.44,th:'tropen'}, rampe:{sz:[0.85,1.2],pw:[-1,1.5],hell:[0.9,1.2],kurve:'frueh'}}, [
    {n:0,nurBoden:true,boden:[{k:'kreisel',gt:5,x:-0.35,A:'magenta',i:0},{k:'kreisel',gt:5,x:0,A:'limette',i:1,t:0.4},{k:'kreisel',gt:5,x:0.35,A:'mint',i:2,t:0.8}],pause:4.6},
    {n:2,gap:1.4,muster:'mitte',ang:0.18,eff:'brausepulver',steig:'gold',pause:0.9},
    {n:0,nurBoden:true,boden:[{k:'torte',gt:6,x:-0.3,A:'rose'},{k:'torte',gt:6,x:0.3,A:'mint'}]},
    {n:3,mit:true,takt:[0.4,1.4],muster:'w',ang:0.25,eff:['kugel','kugel','brausepulver'],kal:'mini',steig:'blink',pause:1.2},
    {n:2,gap:0,muster:'v',ang:0.28,eff:'brausepulver',kal:'klein',steig:'gold',pause:3.0}
  ]),
  /* Dreisprung, L8: dreimal drei Schuss, jeder Satz eine Stufe hoeher */
  miniverbund:()=>show({basis:{pw:-9,sz:0.50,th:'glut'}, rampe:{sz:[0.8,1.3],pw:[-2,2],hell:[0.85,1.25],kurve:'spaet'}}, [
    {n:3,muster:'treppe',hSpanne:10,takt:[0.45,0.6],eff:['kugel','kugel','chrys'],kal:'klein',steig:'glut',pause:1.8},
    {n:3,muster:'aussen',ang:0.3,hoehe:'steigend',hSpanne:10,takt:[0.45,0.6],eff:['chrys','chrys','wechsel'],steig:'silber',pause:1.8},
    {n:3,muster:'treppe',hSpanne:12,takt:[0.4,1.5],eff:['wechsel','chrys','palme'],kal:'mittel',steig:'gold',boden:{k:'fountain',gt:3,t:1.9,A:'gold',B:'orange'},pause:3.0}
  ]),
  /* Farbkanon, L8: fuenf Lichter, die Farbe wandert als Welle */
  roemisch:()=>show({basis:{pw:-9,sz:0.50,th:'bunt'}, rampe:{sz:[0.9,1.2],pw:[0,0],hell:[0.9,1.25],kurve:'linear'}}, [
    {n:5,perle:true,gap:0.6,muster:'gerade',rohrFolge:[-1,-0.5,0,0.5,1],farbFolge:['violett'],pause:0.7},
    {n:5,perle:true,gap:0.6,muster:'aussen',ang:0.08,rohrFolge:[-1,1,-0.5,0.5,0],farbFolge:['zitrone'],pause:1.0},
    {n:5,perle:true,gap:0,muster:'schlag',ang:0.1,rohrFolge:[-1,-0.5,0,0.5,1],farbFolge:['blau','gruen','rot','gruen','blau'],pause:2.5}
  ]),
  /* Glitzerregen, L9: jeder Schuss zieht funkelnden Regen */
  glitzerregen12:()=>show({basis:{pw:-8.2,sz:0.55,th:'gold'}, rampe:{sz:[0.8,1.3],pw:[-2,2],hell:[0.85,1.3],kurve:'spaet'}}, [
    {n:3,gap:1.7,muster:'gerade',eff:'glitterspur',kal:'klein',steig:'gold',pause:1.0},
    {n:4,gap:1.0,muster:'v',ang:0.25,eff:'glitterspur',farbVert:'seite',steig:'gold',pause:1.2},
    {n:5,gap:0.32,gapEnde:0.12,muster:'zufall',ang:0.15,eff:'glitterspur',kal:'mittel',steig:'glut',boden:{k:'fountain',gt:3,A:'gold',B:'zitrone'},pause:3.2}
  ]),
  /* Schneeballschlacht, L10: Kreuzwuerfe treffen sich in der Luft */
  schneeballschlacht:()=>show({basis:{pw:-7.5,sz:0.60,th:'silber'}, rampe:{sz:[0.9,1.2],pw:[-1,1],hell:[0.9,1.2],kurve:'welle'}}, [
    {n:2,gap:1.6,muster:'gerade',eff:'pulverschnee',kal:'klein',steig:'silber',pause:0.8},
    {n:6,gap:1.0,muster:'x',ang:0.35,rohre:'breit',treffen:true,eff:'pulverschnee',steig:'silber',pause:1.2},
    {n:4,gap:0.25,muster:'zufall',ang:0.3,eff:'pulverschnee',kal:'mini',steig:'keiner',boden:{k:'torte',gt:3,A:'weiss'},pause:3.0}
  ]),
  /* Funkelnacht, L10: Zeitsterne gehen einer nach dem anderen an */
  sternstaub20:()=>show({basis:{pw:-7.5,sz:0.60,th:'nacht'}, rampe:{sz:[0.85,1.25],pw:[-1,2],hell:[0.8,1.3],kurve:'linear'}}, [
    {n:4,gap:2.0,muster:'gerade',eff:'zeitsterne',kal:'klein',steig:'keiner',pause:0.5},
    {n:6,gap:0.7,muster:'welle',ang:0.3,wellen:1,eff:'zeitsterne',farbVert:'wechsel',steig:'blink',pause:1.0},
    {n:5,gap:0.3,muster:'spirale',seg:1,ang:0.2,eff:'zeitsterne',steig:'keiner',boden:{k:'blinker',gt:3,A:'himmel'},pause:1.2},
    {n:5,gap:0,muster:'schlag',ang:0.35,eff:'zeitsterne',kal:'mittel',steig:'keiner',pause:3.5}
  ]),
  /* Zauberwald, L10: Irrlichter ueber gruenem Waldlicht */
  zauberwald:()=>show({basis:{pw:-7.5,sz:0.58,th:'wald'}, rampe:{sz:[0.9,1.2],pw:[-1,1],hell:[0.9,1.2],kurve:'flach'}}, [
    {n:0,nurBoden:true,boden:{k:'bengal',gt:16,A:'gruen',klein:true},pause:1.5},
    {n:3,gap:1.8,muster:'zufall',ang:0.2,eff:'irrlicht',kal:'mini',steig:'keiner',pw:-2,pause:1.0},
    {n:4,gap:1.2,muster:'paar',ang:0.3,eff:'irrlicht',steig:'blink',pw:-2,pause:1.0},
    {n:3,gap:0.5,muster:'kreis',ang:0.2,eff:'irrlicht',kal:'klein',steig:'keiner',pw:-1,pause:4.0}
  ]),
  /* Tonleiter, L11: Heuler spielen C-Dur aufwaerts, Lauf abwaerts, Boje */
  heulbatterie:()=>show({basis:{pw:-6.8,sz:0.65,th:'wald'}, rampe:{sz:[0.9,1.2],pw:[0,0],hell:[0.9,1.2],kurve:'linear'}}, [
    {n:8,gap:0.9,gapEnde:0.6,muster:'treppe',hSpanne:10,steig:'tonleiter',ton:[0,2,4,5,7,9,11,12],eff:'klangperle',kal:'klein',pause:1.2},
    {n:3,gap:0.22,muster:'mitte',ang:0.25,steig:'tonleiter',ton:[11,9,7],eff:'klangperle',pause:1.6},
    {n:1,gap:0,muster:'gerade',steig:'tonleiter',ton:[-12],gleit:true,eff:'klangperle',kal:'mittel',pw:3,pause:3.5}
  ]),
  /* Pfauenrad, L11: der Pfau schlaegt zweimal sein Rad (Kiel = gruene Kometenspur) */
  pfauenrad:()=>show({basis:{pw:-6.8,sz:0.66,th:'pfau'}, rampe:{sz:[0.8,1.35],pw:[-1,2],hell:[0.85,1.3],kurve:'spaet'}}, [
    {n:3,gap:1.2,muster:'gerade',eff:'pfauenauge',kal:'klein',steig:'komet',spurFarbe:'A',pause:0.8},
    {n:5,gap:0,muster:'schlag',ang:0.45,eff:'pfauenauge',steig:'komet',spurFarbe:'A',pause:1.6},
    {n:4,gap:0.18,muster:'wischer',seg:2,ang:0.3,eff:'wechsel',kal:'mini',steig:'keiner',pause:0.8},
    {n:7,gap:0,muster:'schlag',ang:0.6,eff:'pfauenauge',kal:'mittel',steig:'komet',spurFarbe:'A',boden:{k:'fountain',gt:4,A:'tuerkis',B:'gold'},pause:3.5}
  ]),
  /* Tornado-Box, L12: Bodenwirbel, die sich in die Luft schrauben */
  jugendbox:()=>show({basis:{pw:-6.0,sz:0.70,th:'eis'}, rampe:{sz:[0.85,1.2],pw:[-1,1.5],hell:[0.9,1.2],kurve:'welle'}}, [
    {n:0,nurBoden:true,boden:[{k:'tornado',gt:4,x:-0.3,A:'aqua'},{k:'tornado',gt:4,x:0.3,A:'tuerkis',t:0.7}],pause:4.8},
    {n:8,gap:0.35,muster:'welle',ang:0.25,wellen:1,eff:'kreisel',kal:'mini',steig:'wirbel',pause:1.0},   // Kritik: nicht spirale (Rummelplatz-Signatur)
    {n:6,gap:0.8,muster:'gerade',eff:'wechsel',kal:'klein',steig:'silber',boden:[{k:'tornado',gt:4,x:-0.35,A:'weiss',t:0.5},{k:'tornado',gt:4,x:0.35,A:'aqua',t:2.5}],pause:1.0},
    {n:6,gap:0.6,muster:'v',ang:0.3,eff:'kreisel',steig:'silber',boden:{k:'blinker',gt:4,A:'weiss'},pause:1.0},
    {n:0,nurBoden:true,boden:[{k:'tornado',gt:4,x:-0.2,A:'tuerkis'},{k:'tornado',gt:4,x:0.2,A:'silber'}],pause:2.8},
    {n:3,gap:0.12,muster:'mitte',ang:0.35,eff:'kreisel',kal:'klein',steig:'wirbel',pause:3.0}
  ]),
  /* Nachtfalter, L12: Laterne am Boden, Falter um jedes Licht */
  nachtfalter:()=>show({basis:{pw:-6.0,sz:0.72,th:'himmel'}, rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'frueh'}}, [
    {n:0,nurBoden:true,boden:{k:'bengal',gt:38,A:'weiss',klein:true},pause:1.0},
    {n:6,gap:1.6,muster:'gerade',eff:'falterlicht',kal:'klein',steig:'keiner',pause:1.0},
    {n:8,gap:0.45,muster:'kreis',ang:0.25,eff:'falterlicht',steig:'glut',pause:1.0},
    {n:10,takt:[0.2,0.2,0.9],muster:'zufall',ang:0.35,eff:['falterlicht','blaetter'],steig:'keiner',pause:1.2},
    {n:12,gap:0.25,gapEnde:0.12,muster:'mitte',ang:0.4,eff:'falterlicht',kal:'mittel',steig:'glut',pause:3.5}
  ]),
  /* Funkenflug, L13: Senko-Hanabi am Boden, verzweigte Goldsterne oben */
  batterie16:()=>show({basis:{pw:-5,sz:0.78,th:'gold'}, rampe:{sz:[0.8,1.3],pw:[-2,2],hell:[0.85,1.3],kurve:'linear'}}, [
    {n:0,nurBoden:true,boden:{k:'flitterbrunnen',gt:6},pause:3.5},
    {n:4,gap:1.4,muster:'aussen',ang:0.3,eff:'flitterstern',kal:'klein',steig:'gold',pause:0.8},
    {n:6,gap:0.3,muster:'z',seg:2,ang:0.3,eff:['flitterstern','chrys'],steig:'gold',pause:1.0},
    {n:6,gap:0.9,muster:'paar',ang:0.35,eff:'flitterstern',kal:'mittel',steig:'glut',boden:[{k:'flitterbrunnen',gt:5,x:-0.3},{k:'flitterbrunnen',gt:5,x:0.3}],pause:3.2}
  ]),
  /* Palmenhain, L13: Goldpalmen mit stehendem Stamm auf zwei Etagen */
  goldpalmen:()=>show({basis:{pw:-5,sz:0.78,th:'gold'}, rampe:{sz:[0.85,1.35],pw:[-1,2],hell:[0.85,1.3],kurve:'spaet'}}, [
    {n:3,gap:2.2,muster:'gerade',eff:'palme',kal:'mittel',steig:'stamm',pause:0.8},
    {n:6,gap:1.2,muster:'v',ang:0.2,eff:'palme',steig:'stamm',hoehe:'wechsel',hSpanne:6,pause:1.0},
    {n:6,mit:true,gap:0.6,muster:'gerade',rohre:'breit',mineEff:'kokosnuss',mineSz:0.7,nurMine:true},
    {n:6,gap:0.35,muster:'welle',wellen:1,ang:0.3,eff:['palme','kokosnuss'],steig:'stamm',hoehe:'zufall',hSpanne:8,boden:{k:'volcano',gt:4,A:'gold',B:'orange'},pause:1.2},
    {n:4,gap:0,muster:'schlag',ang:0.35,eff:'palme',kal:'gross',steig:'stamm',hoehe:'wechsel',hSpanne:8,pause:4.0}
  ]),
  /* Mondschein, L13: Mondsicheln ueber einem Wasserfall aus Mondlicht */
  mondschein:()=>show({basis:{pw:-5,sz:0.78,th:'silber'}, rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.8,1.3],kurve:'linear'}}, [
    {n:4,gap:2.0,muster:'gerade',eff:'mondsichel',kal:'klein',steig:'silber',pause:1.0},
    {n:8,gap:0.6,muster:'welle',ang:0.3,wellen:1,eff:['farbregen','farbregen','farbregen','mondsichel'],steig:'keiner',pause:1.2},
    {n:0,nurBoden:true,boden:{k:'wasserfall',gt:9,A:'silber',B:'weiss'}},
    {n:10,mit:true,takt:[0.3,0.3,1.2],muster:'aussen',ang:0.35,eff:['glitzerweide','glitzerweide','mondsichel'],steig:'silber',pause:1.0},
    {n:8,gap:0.2,muster:'zufall',ang:0.25,eff:['farbregen','mondsichel'],kal:'mittel',hoehe:'zufall',hSpanne:8,steig:'keiner',pause:4.0}
  ]),
  /* Familienfest, L13: ein Funke laeuft von Teil zu Teil (Staffel).
     Orte der Teile in Metern (x) wie die des Lauffeuers - mit rohrFolge
     (relativ zur 0,4-m-Schachtel) stuende das Roemische Licht 8 cm neben
     der Mitte, das Lauffeuer endete aber 10 cm daneben. */
  sortiment:()=>show({basis:{pw:-5.2,sz:0.76,th:'bunt'}, rampe:{sz:[0.85,1.25],pw:[-1,1.5],hell:[0.9,1.25],kurve:'welle'}}, [
    {n:0,nurBoden:true,boden:[{k:'volcano',gt:6,x:-0.4,A:'gold',B:'rot'},{k:'lauffeuer',t:5.2,gt:1.0,x:-0.4,bis:-0.1}],pause:6.2},
    {n:4,perle:true,gap:0.8,x:-0.1,farbFolge:['rot','gruen','zitrone','blau'],boden:{k:'lauffeuer',t:3.2,gt:1.0,x:-0.1,bis:0.25},pause:1.2},
    {n:5,gap:0.5,muster:'mitte',ang:0.3,x:0.25,eff:['kugel','wechsel','chrys','kugel','wechsel'],steig:'gold',boden:{k:'lauffeuer',t:2.5,gt:1.0,x:0.25,bis:0.45},pause:1.2},
    {n:0,nurBoden:true,boden:[{k:'kreisel',gt:5,x:0.45,A:'magenta',i:0},{k:'kreisel',gt:5,x:0.45,A:'gruen',i:1,t:0.3},{k:'kreisel',gt:5,x:0.45,A:'zitrone',i:2,t:0.6},{k:'lauffeuer',t:4.4,gt:1.2,x:0.45,bis:0}]},
    {n:3,mit:true,gap:0.9,x:0.45,mineEff:'kugel',mineSz:0.6,nurMine:true,pause:2.8},
    {n:3,gap:0.3,muster:'aussen',ang:0.35,x:0,eff:'chrys',kal:'mittel',steig:'gold',boden:[{k:'fountain',gt:5,x:-0.25,A:'gold',B:'rot'},{k:'fountain',gt:5,x:0.25,A:'gold',B:'blau'}],pause:4.5}
  ]),
  /* Feuerperlen, L14: Buendel aus vier Lichtern, Verwandlungskugeln mit
     Knall. Alle Phasen aus den vier Rohren des Buendels (Katalog: nur
     die erste - die anderen kaemen sonst aus der Mitte). */
  feuerperlen:()=>show({basis:{pw:-4,sz:0.84,th:'glut'}, rampe:{sz:[0.9,1.25],pw:[0,1.5],hell:[0.9,1.3],kurve:'linear'}}, [
    {n:4,perle:true,perleEff:'wandelperle',gap:1.3,muster:'gerade',rohrFolge:[-0.6,-0.2,0.2,0.6],pause:0.5},
    {n:4,perle:true,perleEff:'wandelperle',gap:0.7,muster:'v',ang:0.25,rohrFolge:[-0.6,0.6,-0.2,0.2],boden:{k:'bengal',gt:7,A:'rot',klein:true},pause:0.6},
    {n:4,perle:true,perleEff:'wandelperle',gap:0.25,muster:'kreis',ang:0.2,rohrFolge:[-0.6,-0.2,0.2,0.6],pause:0.8},
    {n:4,perle:true,perleEff:'wandelperle',gap:0,muster:'schlag',ang:0.3,rohrFolge:[-0.6,-0.2,0.2,0.6],pause:3.0}
  ]),
  /* Knattersturm, L14: Crackling auf zwei Etagen zugleich */
  knatter:()=>show({basis:{pw:-4,sz:0.84,th:'eis'}, rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'spaet'}}, [
    {n:4,gap:1.5,muster:'gerade',eff:'drachenei',kal:'klein',steig:'knister',pause:0.6},
    {n:6,gap:0.8,muster:'paar',ang:0.3,rohre:'breit',mineEff:'knister',mineSz:0.7,nurMine:true},
    {n:6,mit:true,gap:0.4,muster:'mitte',ang:0.3,eff:'tausend',steig:'knister',pause:1.0},
    {n:8,gap:0.15,muster:'wischer',seg:2,ang:0.35,eff:'knister',kal:'klein',steig:'silber',boden:{k:'knisterbrunnen',gt:4,gh:0.8,A:'silber',B:'tuerkis'},pause:1.2},
    {n:6,gap:0,muster:'schlag',ang:0.4,eff:'tausend',kal:'mittel',mineEff:'knister',mineSz:0.8,steig:'knister',pause:3.5}
  ]),
  /* Silberschwarm, L14: Fischschwaerme, der einzige Schwenk der Klasse */
  knisterfaecher:()=>show({basis:{pw:-4,sz:0.85,th:'blitz'}, rampe:{sz:[0.85,1.3],pw:[-1,2],hell:[0.85,1.3],kurve:'frueh'}}, [
    {n:4,gap:1.4,muster:'mitte',ang:0.3,eff:'fischschwarm',kal:'klein',steig:'silber',pause:0.6},
    {n:6,gap:0.15,muster:'fan',ang:0.45,eff:['fische','fischschwarm'],kal:'klein',steig:'keiner',pause:0.8},
    {n:6,gap:0.5,muster:'welle',ang:0.35,wellen:1,eff:'fischschwarm',steig:'silber',boden:{k:'fountain',gt:4,A:'silber',B:'tuerkis'},pause:1.0},
    {n:8,gap:0.35,muster:'x',ang:0.4,rohre:'breit',eff:'fischschwarm',kal:'mittel',steig:'silber',pause:3.5}
  ]),
  /* Feuersturm, L15: Sprint auf drei Ebenen, 3 Schuss je Sekunde */
  batterie49:()=>show({basis:{pw:-3,sz:0.90,th:'glut'}, rampe:{sz:[0.8,1.35],pw:[-2,2.5],hell:[0.85,1.35],kurve:'frueh'}}, [
    {n:0,nurBoden:true,boden:[{k:'volcano',gt:15,x:-0.45,A:'orange',B:'gold'},{k:'volcano',gt:15,x:0.45,A:'rot',B:'gold'}],pause:0.4},
    {n:6,gap:0.7,muster:'gerade',eff:'lampare',kal:'klein',steig:'glut',pause:0.5},
    {n:10,gap:0.45,muster:'v',ang:0.3,eff:'chrys',steig:'glut',pause:0.5},
    {n:8,mit:true,gap:0.28,muster:'gerade',rohre:'breit',mineEff:'lampare',mineSz:0.6,nurMine:true},
    {n:12,gap:0.2,muster:'z',seg:3,ang:0.4,eff:['palme','lampare'],steig:'gold',pause:0.8},
    {n:6,gap:0.25,muster:'w',ang:0.35,eff:'chrys',kal:'mittel',steig:'knister',pause:0.6},
    {n:7,gap:0,muster:'schlag',ang:0.45,eff:'lampare',kal:'gross',steig:'glut',mineEff:'chrys',mineSz:0.7,pause:3.0}
  ]),
  /* Tausendblueten, L15: Senrin - Stille, dann ein Beet aus Blueten */
  sternenmeer42:()=>show({basis:{pw:-3,sz:0.92,th:'tropen'}, rampe:{sz:[0.8,1.35],pw:[-2,3],hell:[0.8,1.35],kurve:'linear'}}, [
    {n:4,gap:2.2,muster:'gerade',eff:'tausendblueten',kal:'klein',steig:'silber',pause:0.4},
    {n:8,gap:0.45,muster:'spirale',ang:0.3,seg:1,eff:['wechsel','tausendblueten'],steig:'wirbel',boden:{k:'sternregen',gt:5,A:'gold',B:'rose'},pause:1.0},
    {n:10,takt:[0.2,0.2,0.2,1.0],muster:'aussen',ang:0.4,eff:'tausendblueten',farbVert:'mitte',steig:'silber',pause:1.0},
    {n:12,gap:0.15,muster:'w',ang:0.35,eff:['chrys','tausendblueten'],hoehe:'wechsel',hSpanne:6,steig:'gold',pause:1.2},
    {n:8,gap:0,muster:'schlag',ang:0.45,eff:'tausendblueten',kal:'mittel',steig:'silber',boden:[{k:'volcano',gt:4,x:-0.35,A:'rose',B:'gold'},{k:'volcano',gt:4,x:0.35,A:'mint',B:'gold'}],pause:4.0}
  ])
};
Object.keys(DB).forEach(t=>{ SHOWS[t]=DB[t];
  /* Grundstufe auch in SHOW_BASIS (Tests, Anzeige) - die Show selbst traegt sie als basis */
  SHOW_BASIS[t]=Object.assign({},DB[t]().basis); });

/* Signaturen: das eine Bild, das nur dieses Produkt hat */
Object.assign(SIGNATUR,{
  kinderbatterie:{eff:'pusteblume',text:'Samenstand, den der Wind glitzernd davontraegt'},
  kinderparty:{eff:'brausepulver',text:'Pastellperlen, die einzeln mit Plopp zerplatzen'},
  miniverbund:{muster:'treppe',idee:'Dreisprung 3x3',text:'dreimal drei Schuss, jeder Satz eine Stufe hoeher'},
  roemisch:{idee:'Farbkanon',text:'fuenf Lichter, die Farbe laeuft als Welle ueber die Reihe'},
  glitzerregen12:{eff:'glitterspur',text:'Goldsterne verlieren Troepfchen, die einzeln aufblitzen'},
  schneeballschlacht:{idee:'treffen',eff:'pulverschnee',text:'zwei Wuerfe treffen sich und zerstaeuben zu Pulverschnee'},
  sternstaub20:{eff:'zeitsterne',text:'dunkler Bruch, die Sterne gehen einzeln an'},
  zauberwald:{eff:'irrlicht',text:'grosse weiche Lichter irren schwebend umher'},
  heulbatterie:{eff:'klangperle',idee:'tonleiter',text:'Heuler spielen eine Tonleiter, oben bleibt eine Klangperle'},
  pfauenrad:{eff:'pfauenauge',text:'Pfauenfeder-Augen auf gruenem Kiel, als Rad auf Schlag'},
  jugendbox:{idee:'tornado',text:'Bodenwirbel, die sich spiralfoermig in die Luft schrauben'},
  nachtfalter:{eff:'falterlicht',text:'Falter umkreisen ein helles Licht und verglühen darin'},
  batterie16:{eff:'flitterstern',text:'Goldfunken verzweigen sich wie Tannennadeln'},
  goldpalmen:{idee:'Palmenhain/stamm',text:'Goldpalmen mit stehendem Stamm auf zwei Etagen'},
  mondschein:{eff:'mondsichel',text:'silberne Mondsichel mit Hof, die als Staub herabrieselt'},
  sortiment:{idee:'lauffeuer',text:'ein Zuendfunke laeuft sichtbar von Teil zu Teil'},
  feuerperlen:{eff:'wandelperle',text:'Leuchtkugel rot, gold, weiss - und oben ein Knall'},
  knatter:{idee:'Doppeldeck-Knistern',text:'Knistern auf zwei Hoehen zugleich'},
  knisterfaecher:{eff:'fischschwarm',text:'Silberfische schwimmen als Schwarm und wenden gemeinsam'},
  batterie49:{idee:'Sprint drei Ebenen',eff:'lampare',text:'49 Schuss in 16 s, Feuerbaelle auf drei Ebenen'},
  sternenmeer42:{eff:'tausendblueten',text:'Stille, dann platzen Dutzende kleiner Blueten zugleich'}
});
})();

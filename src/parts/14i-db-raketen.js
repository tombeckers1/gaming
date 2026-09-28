/* =========================================================
   Raketen - je Rakete ein eigener Aufstieg und ein eigener Bruch
   (Tom, 26.09. nachts: "jedes Produkt eine Anomalie - komplett
   einzigartig, eigener Effekt, eigene Abfolge, Name passt")
   28.09., Tom: echt - "keine Laser, keine Punkte, das sieht aus wie
   Lichttechnik, nicht wie Feuerwerk; die Farben muessen zusammen-
   passen". Regeln und Quellen: /tmp/fw/echt.md. Seitdem ist jeder
   Bruch ein echter Raketeneffekt - Fallschirm, Komet, Musterbombe,
   Go-Getter, Spinne, Split-Komet, Pfeifer, Halbe-Halbe, Brokat,
   Knister, Happo-zaki, Blinker, Kamuro, Chrysantheme, Palme, Salut -
   und jeder Stern fliegt ballistisch: schnell raus, stark gebremst,
   dann fallend, am Ende flackernd aus. Schweife sind Funken (Gold aus
   Kohle, Silber aus Titan), keine Linien in Sternfarbe. Keine
   stehenden Punkte, keine Striche, keine Figuren aus Licht, kein
   Kreisen. Die Einzigartigkeit kommt aus Ablauf, Tempo, Groesse und
   Farbpaar. Farben: je Rakete eine Farbe plus Gold/Silber/Weiss
   (Halbe-Halbe zwei - das ist der Effekt; Schwebelicht je Rakete eine
   andere). Eine Zuendung = eine Rakete = ein Bruch; kein Bruch und
   kein Aufstieg kommt bei zwei Raketen vor (Test anomalie.js).
   Level 6-9 kleine Einzelideen, 10-13 Bewegung und Kontrast, 15-19
   Brueche mit einer zweiten Phase, 20-25 Jumbos mit drei Phasen.
   ========================================================= */

/* ---------- Hilfen (nur fuer die Raketenbrueche) ---------- */
const RK={n:0,schirme:[],hoefe:[]};
function rkSchweif(sp,fn){ const a=SCHWEIF; SCHWEIF=sp; try{ fn(); } finally { SCHWEIF=a; } }
const rkMal=(c,f)=>[c[0]*f,c[1]*f,c[2]*f];
/* Gefuehrter Stern, der NICHT linear verblasst: fn(s,dt) setzt Ort
   (s.p), Tempo (s.v) und Helligkeit (s.hell) je Bild; das lineare
   Verblassen der Partikel ist herausgerechnet. Modus 0: leichtes
   Flackern und am Ende das Ausbrennen wie jeder Stern. (28.09.: vorher
   Modus 2 - mit dem Wechsler mit Dunkelphase haette jeder gefuehrte
   Stern mitten im Flug kurz ausgesetzt.) */
function rkStern(ps,p,v,c,life,fn,o){
  o=o||{};
  return fuehre(ps,p.x,p.y,p.z,v[0],v[1],v[2],c,life,(s,dt)=>{
    s.hell=1; if(fn(s,dt)===false) return false;
    s.hell/=Math.max(0.03,1-s.alter/s.life);
  },Object.assign({mode:0},o));
}
/* Flug mit eigenem Luftwiderstand k und Schwerkraft g */
function rkFlug(s,dt,k,g){ const v=s.v, e=Math.exp(-k*dt); v[0]*=e; v[1]=v[1]*e-g*dt; v[2]*=e;
  s.p[0]+=v[0]*dt; s.p[1]+=v[1]*dt; s.p[2]+=v[2]*dt; }
/* Spur hinter einem gefuehrten Stern: rate Funken je Sekunde, verteilt
   auf die Strecke dieses Bildes (keine Perlenkette) */
function rkSpur(s,dt,rate,fn){
  const d=s.d; if(!d.lp){ d.lp=s.p.slice(); return; }
  d.sa=(d.sa||0)+rate*dt*QUAL();
  for(;d.sa>=1;d.sa--){ const f=Math.random(); fn(d.lp[0]+(s.p[0]-d.lp[0])*f,d.lp[1]+(s.p[1]-d.lp[1])*f,d.lp[2]+(s.p[2]-d.lp[2])*f); }
  d.lp[0]=s.p[0]; d.lp[1]=s.p[1]; d.lp[2]=s.p[2];
}
/* Funkenschweif entlang einer Flugbahn mit der Physik der Partikel
   (Luftwiderstand ZIEH, Schwerkraft g): zwischen t0 und t1 rate Funken
   je Sekunde, jeder an seinem eigenen Bahnpunkt - ein koerniger Schweif
   aus Kohle- oder Titanfunken, keine Linie (echt.md 1.2).
   o = {ps, life:[a,b], g, mode (4 Glitzer), streu m/s, mit (Anteil des
   Sterntempos, den der Funke mitnimmt), spur} */
function rkFunken(p,v,g,t0,t1,rate,c,o){
  o=o||{}; const ps=o.ps||psMid, L=o.life||[0.4,0.8], gs=o.g!==undefined?o.g:2.6, md=o.mode!==undefined?o.mode:4,
    st=o.streu!==undefined?o.streu:0.35, mit=o.mit!==undefined?o.mit:0.1, tag=FW_TAG, DT=1/15;
  for(let t=Math.max(0.02,t0);t<t1;t+=DT){ const ta=t, tb=Math.min(t1,t+DT);
    imBild(tb,()=>{ const n=Math.floor(rate*(tb-ta)*QUAL()+Math.random()); if(!n) return;
      const a=SCHWEIF, at=FW_TAG; SCHWEIF=o.spur!==undefined?o.spur:0.04; FW_TAG=tag;
      for(let i=0;i<n;i++){ const tt=rand(ta,tb), q=bahnOrt(p,v,g,tt), w=bahnTempo(v,g,tt);
        ps.emit(q.x,q.y,q.z,w[0]*mit+rand(-st,st),w[1]*mit+rand(-st,st)-0.25,w[2]*mit+rand(-st,st),c[0],c[1],c[2],rand(L[0],L[1]),gs,md); }
      SCHWEIF=a; FW_TAG=at; }); }
}
/* Bildebene: rechts und oben, wie der Zuschauer sie sieht, dazu zur Kamera */
function rkBild(p){ const c=camera.position; let n=[c.x-p.x,c.y-p.y,c.z-p.z]; const l=Math.hypot(n[0],n[1],n[2])||1; n=[n[0]/l,n[1]/l,n[2]/l];
  let r=[n[2],0,-n[0]]; const lr=Math.hypot(r[0],r[2])||1; r=[r[0]/lr,0,r[2]/lr];
  const o=[n[1]*r[2]-n[2]*r[1],n[2]*r[0]-n[0]*r[2],n[0]*r[1]-n[1]*r[0]]; return [r,o,n]; }
/* schwacher Schein um den Fallschirm-Leuchtsatz (sein Rauch leuchtet mit) */
function rkHof(){
  let h=RK.hoefe.find(x=>!x.an); if(h){ h.an=true; return h; }
  if(RK.hoefe.length>=6) return null;
  const m=new THREE.SpriteMaterial({map:dotTex,transparent:true,opacity:0,depthWrite:false,fog:false,toneMapped:false,blending:THREE.AdditiveBlending});
  const sp=new THREE.Sprite(m); sp.visible=false; scene.add(sp); h={sp,an:true}; RK.hoefe.push(h); return h;
}
function rkHofSetz(h,p,gr,c,a){ if(!h) return; h.sp.position.set(p[0],p[1],p[2]); h.sp.scale.set(gr,gr,1); h.sp.material.color.setRGB(c[0],c[1],c[2]); h.sp.material.opacity=clamp(a,0,1); h.sp.visible=a>0.005; }
function rkHofWeg(h){ if(!h) return; h.sp.visible=false; h.an=false; }
/* eigene Bruchklaenge (knall:'...' im Raketeneintrag statt des Knalls) */
Object.assign(sfx,{
  /* muedes Pff: der Scheinbruch des Spaetzuenders, der kleine Zerleger der Schnuppe */
  rakPff:v=>rauschF({dur:0.28,vol:0.2*v,typ:'bandpass',f:900,f2:380,q:0.9,an:0.02}),
  /* weicher Puff ohne Zerleger (Garbe) */
  rakPuff:v=>{ rauschF({dur:0.32,vol:0.28*v,f:520,an:0.015}); tone(90,0.12,'sine',0.1*v,55); },
  /* tiefer, langer Knall (Mondfinsternis) */
  rakTief:v=>{ noise(1.6,0.9*v,260); noise(0.2,0.45*v,2400); if(typeof grollen==='function') grollen(2.4,0.55*v,85,0.25); },
  /* Titansalut der Supernova: harter Schlag, Krachen, Grollen */
  rakSalut:v=>{ sfx.boom(Math.min(2,v*1.8)); later(0.03,()=>sfx.crack(v*1.3)); if(typeof grollen==='function') later(0.2,()=>grollen(2.6,0.6*v,80,0.2)); }
});

/* ---------------------------------------------------------
   Brueche, je Rakete genau einer
   --------------------------------------------------------- */

/* Fallschirm (Schwebelicht, L6): leiser Plopp, dann haengt EIN Leucht-
   satz am Schirm, sinkt 8 s pendelnd, tropft und faerbt den Boden in
   seiner Farbe - die echte Fallschirmrakete. Je Rakete eine Farbe. */
function rkSchirm(c){
  let S=RK.schirme.find(x=>!x.an);
  if(!S){ if(RK.schirme.length>=4) return null;
    const g=new THREE.Group();
    const km=new THREE.MeshBasicMaterial({color:0x777777,transparent:true,opacity:0.26,side:THREE.DoubleSide,depthWrite:false,fog:false,toneMapped:false});
    const k=new THREE.Mesh(new THREE.SphereGeometry(1,16,5,0,Math.PI*2,0,Math.PI*0.42),km);
    k.scale.set(1.1,0.6,1.1); k.position.y=1.05; g.add(k);
    const pos=[]; for(let i=0;i<8;i++){ const a=i/8*Math.PI*2, rr=1.1*Math.sin(Math.PI*0.42); pos.push(Math.cos(a)*rr,1.05+0.6*Math.cos(Math.PI*0.42),Math.sin(a)*rr,0,0.05,0); }
    const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    const lm=new THREE.LineBasicMaterial({color:0x888888,transparent:true,opacity:0.45,depthWrite:false,fog:false});
    g.add(new THREE.LineSegments(lg,lm)); g.visible=false; scene.add(g);
    S={g,km,lm}; RK.schirme.push(S); }
  S.an=true;
  /* von unten angestrahlt: dunkles Grau, nur leicht in der Farbe des
     Lichts getoent - nachts sieht man den Schirm kaum (28.09.: vorher
     leuchtete er als rosa Scheibe) */
  S.km.color.setRGB(0.05+c[0]*0.09,0.05+c[1]*0.09,0.05+c[2]*0.09); S.lm.color.setRGB(0.08+c[0]*0.12,0.08+c[1]*0.12,0.08+c[2]*0.12);
  return S;
}
EFF.fallschirm=function(p,A,B,s,r){
  const c=A||FW.rot, L=8, key='fs'+(++RK.n), S=rkSchirm(c), hof=rkHof();
  const pa=rand(0,Math.PI*2), pen=[Math.cos(pa),Math.sin(pa)], da=rand(0,Math.PI*2), dr=[Math.cos(da)*0.3,Math.sin(da)*0.3];
  const v0=r&&r.v?[r.v.x*0.3,Math.max(0,r.v.y)*0.3+1.2,r.v.z*0.3]:[0,1.8,0];
  /* Ausstoss: zehn kleine Funken, ein kurzer Lichtpunkt */
  rkSchweif(0,()=>{ for(let i=0;i<10;i++){ const d=randDir(), w=rand(2,4); psSmall.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.85,.5,rand(0.3,0.6),3,0); }
    psHuge.emit(p.x,p.y,p.z,0,0,0,1,.95,.8,0.1,0,0); });
  if(S) S.g.rotation.y=rand(0,6);
  rkStern(psHuge,p,[0,0,0],rkMal(c,1.25),L,(st,dt)=>{
    const t=st.alter, e=1-Math.exp(-2.5*t), w=2*Math.PI*0.4, amp=0.5*Math.min(1,t/1.5), sw=amp*Math.sin(w*t);
    const x=p.x+v0[0]*e/2.5+dr[0]*t+pen[0]*sw, y=p.y+(v0[1]+1.2)*e/2.5-1.2*t, z=p.z+v0[2]*e/2.5+dr[1]*t+pen[1]*sw;
    st.p[0]=x; st.p[1]=y; st.p[2]=z; st.v[0]=st.v[1]=st.v[2]=0;
    /* der Leuchtsatz flackert, die letzten 1,5 s stirbt er */
    let h=1.3*(0.82+0.18*Math.random()); const rest=L-t;
    if(t<0.25) h*=t/0.25;
    if(rest<1.5) h*=(rest/1.5)*(0.25+Math.random()*0.95);
    st.hell=h;
    licht(key,{x,y,z},c,2.4*h,{weite:26});
    /* nur ein schwacher Schein im eigenen Rauch (28.09.: vorher eine
       Leuchtscheibe mit 0,34 Deckkraft - Scheinwerfer statt Leuchtsatz) */
    rkHofSetz(hof,[x,y,z],2.4,c,0.09*h);
    if(S){ S.g.visible=t>0.35; S.g.position.set(x,y,z); S.g.rotation.z=-Math.cos(w*t)*amp*0.25*pen[0]; S.g.rotation.x=Math.cos(w*t)*amp*0.25*pen[1]; }
    /* der weissgluehende Kern des Leuchtsatzes */
    const d0=st.d; d0.k=(d0.k||0)+dt*30; for(;d0.k>=1;d0.k--) psBig.emit(x,y,z,0,0,0,(0.7+c[0]*0.5)*h,(0.7+c[1]*0.5)*h,(0.7+c[2]*0.5)*h,0.05,0,0);
    /* brennende Tropfen fallen aus dem Leuchtsatz */
    const d=st.d; d.tr=(d.tr||0)+dt*26*QUAL()*Math.min(1,h);
    for(;d.tr>=1;d.tr--) psMid.emit(x+rand(-.06,.06),y-0.1,z+rand(-.06,.06),rand(-.3,.3),rand(-2.4,-1),rand(-.3,.3),0.6+c[0]*0.5,0.6+c[1]*0.5,0.6+c[2]*0.5,rand(0.35,0.75),4,0);
  },{ende:()=>{ if(S){ S.g.visible=false; S.an=false; } rkHofWeg(hof); }});
};

/* Sternschnuppe (raketenklein, L6): ein kleiner Zerleger, dann ziehen
   vier bis sechs Kometen in flachen Boegen nach aussen und unten, jeder
   mit einem langen, rieselnden Silberglitzer - wie Sternschnuppen.
   Koepfe silber und himmelblau. (28.09., Tom: echt - vorher zog EINE
   Schnuppe auf einer gefuehrten Geraden waagrecht quer ueber den Himmel) */
EFF.schnuppe=function(p,A,B,s){
  const n=4+Math.floor(Math.random()*3), dreh=rand(0,Math.PI*2), G=3.4, sil=A||FW.silber, blau=B||FW.himmel, fu=[.95,.97,1.05];
  for(let k=0;k<n;k++){
    const az=dreh+k/n*Math.PI*2+rand(-0.4,0.4), el=rand(-0.3,0.5), w=rand(10,12)*s, c=k%2?blau:sil, L=rand(1.5,1.9);
    const v=[Math.cos(az)*Math.cos(el)*w,Math.sin(el)*w+1.5,Math.sin(az)*Math.cos(el)*w];
    rkSchweif(0.06,()=>psHuge.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*1.25,c[1]*1.25,c[2]*1.3,L,G,0));
    rkFunken(p,v,G,0.03,L-0.1,110,fu,{life:[0.45,0.9],g:2.2,streu:0.3,mit:0.12});
  }
  rkSchweif(0,()=>{ for(let i=0;i<10;i++){ const d=randDir(), w=rand(1.5,3); psSmall.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.95,.85,rand(0.15,0.3),2,0); }
    psHuge.emit(p.x,p.y,p.z,0,0,0,1,1,1,0.07,0,0); });
  schall(p,v=>sfx.zischen(v*0.4,1.6));
};

/* Himmelsgarbe (glitzerraketen, L8): ohne Zerleger schuettet der Kopf
   schwere Sterne nach oben aus - wie beim Rossschweif steigen sie noch
   ein Stueck, faechern auf und fallen in weiten Boegen, hinter jedem
   zweiten ein feiner Goldglitzer. Limette und Gold. */
EFF.garbe=function(p,A,B,s,r){
  const q=QUAL(), n=Math.round(44*s*q), G=6.2, lim=A||FW.limette, gold=B||FW.gold, gl=[1,.82,.45];
  let up=[0,1,0]; if(r&&r.v){ const l=r.v.length()||1; up=[r.v.x/l*0.5,1,r.v.z/l*0.5]; const m=Math.hypot(up[0],up[1],up[2]); up=[up[0]/m,up[1]/m,up[2]/m]; }
  const [u1,u2]=quer(up), cmax=Math.cos(0.72);
  for(let i=0;i<n;i++){
    /* gleichmaessig im Kegel, am Rand etwas dichter */
    const cz=1-Math.pow(Math.random(),0.6)*(1-cmax), sz=Math.sqrt(1-cz*cz), a=rand(0,Math.PI*2);
    const d=[up[0]*cz+(u1[0]*Math.cos(a)+u2[0]*Math.sin(a))*sz,up[1]*cz+(u1[1]*Math.cos(a)+u2[1]*Math.sin(a))*sz,up[2]*cz+(u1[2]*Math.cos(a)+u2[2]*Math.sin(a))*sz];
    const w=rand(11,14)*Math.sqrt(s), c=i%2?lim:gold, L=rand(2.2,2.8), v=[d[0]*w,d[1]*w,d[2]*w];
    rkSchweif(0.08,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*1.2,c[1]*1.2,c[2]*1.2,L,G,0));
    if(i%2===0) rkFunken(p,v,G,0.1,L*0.9,26,gl,{life:[0.4,0.75],g:2.4,streu:0.25});
  }
  rkSchweif(0,()=>{ for(let i=0;i<3;i++) psHuge.emit(p.x,p.y,p.z,rand(-.3,.3),rand(0,.6),rand(-.3,.3),1,.8,.45,0.12,0,0); });
  schall(p,v=>sfx.rieseln(v*0.9,2.4));
};

/* Initiale (Gravur-Rakete, L9): eine Musterbombe. Die Goldsterne sind in
   der Form der Initialen gepackt und fliegen als diese Form auseinander -
   Tempo proportional zur Lage im Muster: die Schrift waechst, bremst,
   sinkt und rieselt glitzernd aus, wie Herz- und Smiley-Bomben. Kein
   Stern steht still (28.09., Tom: echt - vorher flogen die Punkte an
   feste Plaetze und standen 1,8 s als Raster). Ohne Gravur: Goldring. */
const RK_SCHRIFT=(()=>{ const z={
  A:'01110 10001 10001 11111 10001 10001 10001',B:'11110 10001 10001 11110 10001 10001 11110',C:'01110 10001 10000 10000 10000 10001 01110',
  D:'11110 10001 10001 10001 10001 10001 11110',E:'11111 10000 10000 11110 10000 10000 11111',F:'11111 10000 10000 11110 10000 10000 10000',
  G:'01110 10001 10000 10111 10001 10001 01111',H:'10001 10001 10001 11111 10001 10001 10001',I:'01110 00100 00100 00100 00100 00100 01110',
  J:'00111 00010 00010 00010 00010 10010 01100',K:'10001 10010 10100 11000 10100 10010 10001',L:'10000 10000 10000 10000 10000 10000 11111',
  M:'10001 11011 10101 10101 10001 10001 10001',N:'10001 10001 11001 10101 10011 10001 10001',O:'01110 10001 10001 10001 10001 10001 01110',
  P:'11110 10001 10001 11110 10000 10000 10000',Q:'01110 10001 10001 10001 10101 10010 01101',R:'11110 10001 10001 11110 10100 10010 10001',
  S:'01111 10000 10000 01110 00001 00001 11110',T:'11111 00100 00100 00100 00100 00100 00100',U:'10001 10001 10001 10001 10001 10001 01110',
  V:'10001 10001 10001 10001 10001 01010 00100',W:'10001 10001 10001 10101 10101 10101 01010',X:'10001 10001 01010 00100 01010 10001 10001',
  Y:'10001 10001 10001 01010 00100 00100 00100',Z:'11111 00001 00010 00100 01000 10000 11111',
  0:'01110 10001 10011 10101 11001 10001 01110',1:'00100 01100 00100 00100 00100 00100 01110',2:'01110 10001 00001 00010 00100 01000 11111',
  3:'11111 00010 00100 00010 00001 10001 01110',4:'00010 00110 01010 10010 11111 00010 00010',5:'11111 10000 11110 00001 00001 10001 01110',
  6:'00110 01000 10000 11110 10001 10001 01110',7:'11111 00001 00010 00100 01000 01000 01000',8:'01110 10001 10001 01110 10001 10001 01110',
  9:'01110 10001 10001 01111 00001 00010 01100','+':'00000 00100 00100 11111 00100 00100 00000','&':'01100 10010 10100 01000 10101 10010 01101'};
  const o={}; for(const k in z) o[k]=z[k].split(' '); return o; })();
/* "Anna & Tom" -> "A+T", ein Wort -> die ersten drei Buchstaben */
function rkInitialen(t){
  if(!t) return '';
  const w=String(t).toUpperCase().replace(/Ä/g,'A').replace(/Ö/g,'O').replace(/Ü/g,'U').replace(/ß/g,'S').replace(/[ÀÁÂ]/g,'A').replace(/[ÈÉÊ]/g,'E')
    .split(/[^A-Z0-9]+/).filter(Boolean);
  if(w.length>=2) return w[0][0]+'+'+w[1][0];
  if(w.length===1) return w[0].slice(0,3);
  return /&/.test(t)?'&':'';
}
EFF.initiale=function(p,A,B,s,r){
  const txt=rkInitialen(r&&(r.text||(r.par&&r.par.text))), [ri0,ob0,nn]=rkBild(p), gold=A||FW.gold, rose=B||FW.rose, pts=[];
  /* leicht gekippt wie jede echte Musterbombe - nie genau zum Zuschauer */
  const kw=rand(-0.25,0.25), ri=[ri0[0]*Math.cos(kw)+nn[0]*Math.sin(kw),ri0[1]*Math.cos(kw)+nn[1]*Math.sin(kw),ri0[2]*Math.cos(kw)+nn[2]*Math.sin(kw)], ob=ob0;
  const H=6.5*s, d=H/6;
  if(txt){ const cols=txt.length*6-1;
    for(let i=0;i<txt.length;i++){ const g=RK_SCHRIFT[txt[i]]; if(!g) continue; const c=(txt[i]==='+'||txt[i]==='&')?rose:gold;
      for(let y=0;y<7;y++) for(let x=0;x<5;x++) if(g[y][x]==='1') pts.push([(i*6+x-(cols-1)/2)*d,(3-y)*d,c]); } }
  /* ohne Gravur ein Ring - gestreut wie ein echter Ringbruch, kein Punktkreis */
  if(!pts.length){ const n=34, R=3.6*s; for(let k=0;k<n;k++){ const a=k/n*Math.PI*2+rand(-0.07,0.07), rr=R*rand(0.93,1.07); pts.push([Math.cos(a)*rr,Math.sin(a)*rr,gold]); } }
  /* Tempo = Lage x K: nach rund zwei Sekunden hat die Form ihre Endgroesse */
  const G=2.2, K=ZIEH*1.05;
  pts.forEach(([x,y,c])=>{
    const f=rand(0.97,1.03), x1=x+rand(-0.07,0.07)*d, y1=y+rand(-0.07,0.07)*d;
    const v=[(ri[0]*x1+ob[0]*y1)*K*f,(ri[1]*x1+ob[1]*y1)*K*f+0.6,(ri[2]*x1+ob[2]*y1)*K*f], L=rand(2.0,2.4);
    rkSchweif(0.06,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*1.3,c[1]*1.3,c[2]*1.2,L,G,0));
    rkFunken(p,v,G,0.5,L-0.1,10,[1.1,.9,.5],{life:[0.5,0.9],g:1.6,streu:0.2,mit:0.05});
  });
  rkSchweif(0,()=>psHuge.emit(p.x,p.y,p.z,0,0,0,1,.95,.8,0.1,0,0));
  later(0.9,()=>schall(p,v=>sfx.rieseln(v*0.8,1.4)));
};

/* Hasenjagd (raketen, L10): Go-Getter - Sterne mit eigenem Antrieb
   (Phantom-Glossar "Go-getter"; WF Boom: "like a school of fish when
   startled"). Jeder schlaegt zwei bis vier Haken, jeder zu seiner Zeit
   und in seine Richtung, und zieht einen Goldschweif; keiner fliegt im
   Takt mit einem anderen (28.09., Tom: echt - vorher schlugen alle
   zwoelf Sterne ihre zwei Haken im selben Augenblick). Tuerkis, Gold. */
EFF.hakenschlag=function(p,A,B,s){
  const n=Math.max(12,Math.round(20*QUAL())), kopf=rkMal(A||FW.tuerkis,1.35), gold=[1,.78,.38];
  for(let i=0;i<n;i++){
    const d=randDir(), w=rand(6,8.5)*s, L=rand(1.4,2.0), nh=2+Math.floor(Math.random()*3), tk=[], schub=rand(5,7)*s;
    for(let k=0;k<nh;k++) tk.push(rand(0.2,L-0.25)); tk.sort((a,b)=>a-b);
    rkStern(psBig,p,[d[0]*w,d[1]*w,d[2]*w],kopf,L,(st,dt)=>{
      const t=st.alter, dd=st.d, k=dd.k||0, v=st.v;
      if(k<tk.length&&t>=tk[k]){ dd.k=k+1;
        /* Haken: neue Richtung 45-120 Grad gegen die alte, ein Stoss Funken nach hinten */
        const sp=Math.hypot(v[0],v[1],v[2])||1, dn=[v[0]/sp,v[1]/sp,v[2]/sp], x=randDir(), pr=x[0]*dn[0]+x[1]*dn[1]+x[2]*dn[2];
        let e=[x[0]-pr*dn[0],x[1]-pr*dn[1],x[2]-pr*dn[2]]; const le=Math.hypot(e[0],e[1],e[2])||1; e=[e[0]/le,e[1]/le,e[2]/le];
        const a=rand(45,120)*Math.PI/180, nd=[dn[0]*Math.cos(a)+e[0]*Math.sin(a),dn[1]*Math.cos(a)+e[1]*Math.sin(a),dn[2]*Math.cos(a)+e[2]*Math.sin(a)];
        v[0]=nd[0]*sp; v[1]=nd[1]*sp; v[2]=nd[2]*sp;
        rkSchweif(0,()=>{ for(let j=0;j<Math.round(6*QUAL());j++){ const b=streu([-nd[0],-nd[1],-nd[2]],0.4), bw=rand(2,4); psSmall.emit(st.p[0],st.p[1],st.p[2],b[0]*bw,b[1]*bw,b[2]*bw,1.2,1,.6,rand(0.15,0.3),2,0); } }); }
      /* Eigenantrieb: der Satz schiebt in Flugrichtung, die Luft bremst */
      const sp=Math.hypot(v[0],v[1],v[2])||1; v[0]+=v[0]/sp*schub*dt; v[1]+=v[1]/sp*schub*dt; v[2]+=v[2]/sp*schub*dt;
      rkFlug(st,dt,0.9,1.4);
      rkSpur(st,dt,55,(x,y,z)=>psMid.emit(x,y,z,rand(-.2,.2),rand(-.5,0),rand(-.2,.2),gold[0],gold[1],gold[2],rand(0.3,0.55),2.2,4));
    },{spur:0.05});
  }
  schall(p,v=>{ sfx.zischen(v*0.5,1.6); later(0.3,()=>sfx.crackle(v*0.25)); });
};

/* Silberspinne (Silberpfeil, L10): Titan-Spinne - schnelle, kurz
   brennende Silbersterne schiessen hart nach aussen, bremsen stark,
   ziehen duenne Glitzerspuren und verloeschen nach einer knappen
   Sekunde, die Spitzen sinken zuletzt durch. Weiss und Silber.
   (28.09., Tom: echt - vorher zwoelf gerade Laserstriche auf den Ecken
   eines Ikosaeders) */
EFF.silberspinne=function(p,A,B,s){
  const n=Math.round(48*s*QUAL()), w0=A||FW.weiss, sil=B||FW.silber, fu=[.9,.93,1];
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(15,19.5)*s, L=rand(0.75,1.05), v=[d[0]*w,d[1]*w,d[2]*w], c=i%3?w0:sil;
    rkSchweif(0.1,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c[0]*1.3,c[1]*1.3,c[2]*1.35,L,3.4,4));
    rkFunken(p,v,3.4,0.02,L*0.9,48,fu,{life:[0.18,0.35],g:3,streu:0.25,mit:0.06}); }
  flash(p,[1,1,1],3.2*s,0.18);
  schall(p,v=>sfx.crack(v*1.3));
};

/* Kometenkette (kometenraketen, L11): Split-Kometen - sechs bis acht
   Goldkometen fliegen auseinander, jeder spaltet sich nach einer halben
   Sekunde in zwei, jede Haelfte noch einmal: eine Kette aus immer
   kleineren Kometen, deren letzte Enden blau verglimmen. Gold, Blau.
   (28.09., Tom: echt - vorher zog eine Kette aus sieben Stuecken als
   Formation in eine Richtung) */
EFF.kometenkette=function(p,A,B,s){
  const gold=A||FW.gold, blau=B||FW.blau, fu=[1,.72,.3], G=3, n=6+Math.floor(Math.random()*3);
  const komet=(q,v,T,stufe)=>{
    const c=stufe<2?gold:blau, k=stufe===0?1.3:stufe===1?1.15:1.35;
    rkSchweif(0.08,()=>(stufe<2?psHuge:psBig).emit(q.x,q.y,q.z,v[0],v[1],v[2],c[0]*k,c[1]*k,c[2]*k,stufe<2?T+0.03:T,G,stufe<2?4:0));
    rkFunken(q,v,G,0.02,T,stufe?45:70,fu,{life:[0.35,0.7],g:2.6,streu:0.3,mit:0.1});
    if(stufe>=2) return;
    imBild(T,()=>{ const e=bahnOrt(q,v,G,T), w=bahnTempo(v,G,T), sp=Math.hypot(w[0],w[1],w[2])||1, dn=[w[0]/sp,w[1]/sp,w[2]/sp], [u1,u2]=quer(dn), ro=rand(0,Math.PI*2);
      const u=[u1[0]*Math.cos(ro)+u2[0]*Math.sin(ro),u1[1]*Math.cos(ro)+u2[1]*Math.sin(ro),u1[2]*Math.cos(ro)+u2[2]*Math.sin(ro)], a=rand(0.4,0.65), ns=sp*0.8+2.5;
      rkSchweif(0,()=>psBig.emit(e.x,e.y,e.z,w[0]*0.5,w[1]*0.5,w[2]*0.5,1.5,1.35,1.1,0.05,0,0));
      for(const sg of [-1,1]){ const nd=[dn[0]*Math.cos(a)+u[0]*Math.sin(a)*sg,dn[1]*Math.cos(a)+u[1]*Math.sin(a)*sg,dn[2]*Math.cos(a)+u[2]*Math.sin(a)*sg];
        komet(e,[nd[0]*ns,nd[1]*ns,nd[2]*ns],stufe===0?rand(0.45,0.6):rand(0.55,0.8),stufe+1); } });
  };
  for(let k=0;k<n;k++){ const d=randDir(), w=rand(10,12)*s; komet(p,[d[0]*w,d[1]*w+1,d[2]*w],rand(0.5,0.68),0); }
  schall(p,v=>{ later(0.58,()=>sfx.crack(v*0.45)); later(1.1,()=>sfx.crack(v*0.35)); sfx.zischen(v*0.5,2.2); });
};

/* Pfeifsterne (Korkenzieher, L11): aus einem kleinen roten Kern
   schiessen zwanzig Pfeifsterne. Ein Pfeifsatz brennt unruhig - jeder
   Stern flattert unregelmaessig um seine Bahn (zwei Schwingungen mit
   eigenem Takt, keine gleichmaessige Schraube), zieht einen kurzen,
   feinen Funkenfaden und endet mit einem Knack. Rot und Weiss.
   (28.09., Tom: echt - vorher 22 gleiche Schrauben mit festem Takt, die
   als gewundene Punktketten am Himmel standen) */
EFF.pfeifsterne=function(p,A,B,s){
  const rot=A||FW.rot, weiss=B||FW.weiss, q=QUAL();
  rkSchweif(0.06,()=>{ for(let i=0;i<Math.round(60*s*q);i++){ const d=randDir(), w=rand(4.5,6)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,rot[0]*1.2,rot[1]*1.2,rot[2]*1.2,rand(1.3,1.8),2.4,0); } });
  for(let i=0;i<20;i++){
    const d=randDir(), w=rand(10,12.5)*s, [u1,u2]=quer(d), te=rand(1.2,1.7), v0=[d[0]*w,d[1]*w,d[2]*w];
    const f1=rand(1.3,2.6), f2=rand(3.1,4.7), a1=rand(0.18,0.35), a2=rand(0.08,0.16), p1=rand(0,6.3), p2=rand(0,6.3);
    rkStern(psBig,p,[0,0,0],rkMal(weiss,1.25),te,(st,dt)=>{
      const t=st.alter, bq=bahnOrt(p,v0,2.2,t), k=Math.min(1,t*3);
      const x=(a1*Math.sin(t*f1*6.28+p1)+a2*Math.sin(t*f2*6.28+p2))*k, y=(a1*Math.cos(t*f1*5.1+p2)+a2*Math.sin(t*f2*5.9+p1))*k;
      st.p[0]=bq.x+u1[0]*x+u2[0]*y; st.p[1]=bq.y+u1[1]*x+u2[1]*y; st.p[2]=bq.z+u1[2]*x+u2[2]*y; st.v[0]=st.v[1]=st.v[2]=0;
      rkSpur(st,dt,130,(x2,y2,z2)=>psSmall.emit(x2,y2,z2,rand(-.12,.12),rand(-.4,0),rand(-.12,.12),1.1,1.05,.95,rand(0.16,0.32),1.5,4));
    },{ende:st=>{ const e=st.p; rkSchweif(0,()=>{ psBig.emit(e[0],e[1],e[2],0,0,0,1.6,1.6,1.5,0.05,0,0);
      for(let k=0;k<6;k++){ const x=randDir(); psSmall.emit(e[0],e[1],e[2],x[0]*2.5,x[1]*2.5,x[2]*2.5,1,1,.9,0.15,1,0); } });
      schall({x:e[0],y:e[1],z:e[2]},vv=>sfx.crack(vv*0.2)); }});
  }
  const v=distVol(p); for(let i=0;i<3;i++) later(i*0.12,()=>sfx.whistle(v*0.9));
};

/* Halbe-Halbe (Halbe-Halbe, L12): die Kugel ist halb A und halb B
   (echte Half-and-Half-Bombe); nach 1,2 s setzen alle Sterne kurz aus
   und brennen in der anderen Farbe weiter - Farbwechsel mit Dunkel-
   phase wie im Stern geschichtet (echt.md 1.4). Magenta und Limette. */
EFF.halbhalb=function(p,A,B,s){
  const [ri,ob]=rkBild(p), a=rand(-0.52,0.52), nn=[ri[0]*Math.cos(a)+ob[0]*Math.sin(a),ri[1]*Math.cos(a)+ob[1]*Math.sin(a),ri[2]*Math.cos(a)+ob[2]*Math.sin(a)];
  const n=Math.round(140*s*QUAL()), a1=rkMal(A,1.3), b1=rkMal(B,1.3);
  for(let i=0;i<n;i++){
    const d=randDir(), w=rand(8,9.5)*s, seite=d[0]*nn[0]+d[1]*nn[1]+d[2]*nn[2]>0, tw=1.2+rand(-0.05,0.05);
    rkStern(psBig,p,[d[0]*w,d[1]*w,d[2]*w],seite?a1:b1,2.4,(st,dt)=>{
      rkFlug(st,dt,ZIEH,2.3); const t=st.alter;
      st.c=(t<tw)===seite?a1:b1;
      st.hell=(t>=tw&&t<tw+0.1)?0.05:(t>1.9?(2.4-t)/0.5:1);
    },{spur:0.06});
  }
  later(1.2,()=>schall(p,v=>rauschF({dur:0.14,vol:0.22*v,typ:'highpass',f:4200,an:0.01})));
};

/* Spaetzuender (Spaetzuender, L13): Scheinbruch wie ein Blindgaenger,
   1,2 s Stille, dann bricht an derselben Stelle eine Knisterwand los
   (Delayed Crackle: die dunklen Sterne sind schon unterwegs, sichtbar
   wird erst ihr Knacken). Silber und Gold. */
EFF.spaetzuender=function(p,A,B,s){
  const q=QUAL(), sil=FW.silber;
  rkSchweif(0.05,()=>{ for(let i=0;i<15;i++){ const d=randDir(), w=rand(2,3); psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,sil[0],sil[1],sil[2],rand(0.35,0.5),2,0); }
    psBig.emit(p.x,p.y,p.z,0,0,0,.5,.5,.5,0.12,0,0); });
  const T0=0.5+1.2, D=1.6, R=6.6*s, N=Math.round(rand(340,420)*q), tint=[A||FW.silber,B||FW.gold,[1,.95,.82]];
  /* die Wand waechst von innen nach aussen */
  for(let i=0;i<N;i++){
    const u=Math.pow(Math.random(),0.8), t=T0+u*D, d=randDir(), rr=R*(0.18+0.82*Math.sqrt(u))*rand(0.8,1.05), c=tint[i%3];
    const x=p.x+d[0]*rr, y=p.y+d[1]*rr*0.9-0.6*u, z=p.z+d[2]*rr, gross=i%2===0;
    imBild(t,()=>{ knisterPop(x,y,z,{c,funken:gross?14:9,tempo:rand(2.8,4.8),laut:0.7});
      /* ein harter, kleiner Knack - kein Leuchtball (Probebild 28.09.: die
         grossen Sprites standen nahe am Pult als weiche Kugeln) */
      if(gross){ const a=SCHWEIF; SCHWEIF=0; psBig.emit(x,y,z,0,0,0,2.0,1.95,1.8,0.06,0,0); SCHWEIF=a; } });
  }
  /* Koerper der Wand: Knisterfunken, Welle fuer Welle weiter aussen */
  for(let k=0;k<14;k++){ const u=k/13, t=T0+u*D*0.9, rr=R*(0.2+0.8*Math.sqrt(u));
    imBild(t,()=>{ const a=SCHWEIF; SCHWEIF=0;
      /* hell und golden, sonst verschwinden die Funken zwischen den Sternen
         des Nachthimmels (Probebild 27.09.) */
      for(let i=0;i<Math.round(70*s*q);i++){ const d=randDir(), f=rr*rand(0.7,1.05), c=i%3?[1.7,1.35,.8]:(i%2?rkMal(tint[0],1.6):rkMal(tint[1],1.6));
        /* nur kleine Funken: grosse Sprites knackten nahe am Pult als weiche Lichtbaelle */
        /* 28.09. nach dem Rendern: als reine Knisterfunken war die Wand im
           Standbild kaum zu sehen - zwei Drittel glitzern jetzt durchgehend */
        psMid.emit(p.x+d[0]*f,p.y+d[1]*f*0.9-0.6*u,p.z+d[2]*f,d[0]*rand(0.5,1.5),d[1]*rand(0.5,1.5)-0.3,d[2]*rand(0.5,1.5),c[0],c[1],c[2],rand(0.6,1.0),1.0,i%3?4:3); }
      SCHWEIF=a; }); }
  later(T0,()=>{ flash(p,[1,.92,.75],3.5*s,0.4);
    schall(p,v=>{ sfx.crackle(v*1.3); later(0.4,()=>sfx.crackle(v*0.45)); later(0.9,()=>sfx.crackle(v*0.8)); }); });
};

/* Achtblatt (Smaragd, L15, Happo-zaki): acht Paeckchen fliegen in die
   acht Richtungen eines Wuerfels auseinander (raeumlich, zufaellig
   gedreht) und oeffnen sich jedes zu seiner Zeit zu einem kleinen Buendel
   gruener Sterne in drei Gruentoenen, dazwischen Goldglitzer. Die gruenen
   Sterne ohne Farbspur (echt.md 1.2). (28.09., Tom: echt - vorher standen
   die acht Paeckchen als Kreis aus weissen Lichtern zum Zuschauer und
   oeffneten sich mit weissen Strichen im selben Augenblick) */
EFF.achtblatt=function(p,A,B,s){
  const g=1.2, tone3=[FW.gruen,FW.mint,FW.limette], ro=randDir(), [e1,e2]=quer(ro), q0=QUAL();
  rkSchweif(0,()=>psBig.emit(p.x,p.y,p.z,0,0,0,1.3,1.35,1.2,0.07,0,0));
  for(let k=0;k<8;k++){
    const c0=[(k&1)?1:-1,(k&2)?1:-1,(k&4)?1:-1], x=c0[0]+rand(-.25,.25), y=c0[1]+rand(-.25,.25), z=c0[2]+rand(-.25,.25);
    let d=[ro[0]*x+e1[0]*y+e2[0]*z,ro[1]*x+e1[1]*y+e2[1]*z,ro[2]*x+e1[2]*y+e2[2]*z]; const l=Math.hypot(d[0],d[1],d[2])||1; d=[d[0]/l,d[1]/l,d[2]/l];
    const w=6*Math.sqrt(s)*rand(0.9,1.1), v0=[d[0]*w,d[1]*w,d[2]*w], T=rand(0.3,0.45);
    rkSchweif(0.06,()=>psMid.emit(p.x,p.y,p.z,v0[0],v0[1],v0[2],0.1,0.42,0.16,T,g,0));
    imBild(T,()=>{
      const q=bahnOrt(p,v0,g,T), vr=bahnTempo(v0,g,T), c=tone3[k%3];
      rkSchweif(0,()=>psBig.emit(q.x,q.y,q.z,0,0,0,0.5+c[0]*0.6,0.5+c[1]*0.6,0.5+c[2]*0.6,0.05,0,0));
      rkSchweif(0.07,()=>{ for(let i=0;i<Math.round(18*q0);i++){ const e=streu(d,0.35), sp=rand(4,6.5)*Math.sqrt(s), cc=i<3?[0.75+c[0]*0.3,0.75+c[1]*0.3,0.75+c[2]*0.3]:c;
        psBig.emit(q.x,q.y,q.z,vr[0]*0.4+e[0]*sp,vr[1]*0.4+e[1]*sp,vr[2]*0.4+e[2]*sp,cc[0]*1.25,cc[1]*1.25,cc[2]*1.25,rand(1.5,2.0),2.2,0); } });
      /* Goldglitzer zwischen den Blaettern */
      rkSchweif(0.05,()=>{ for(let i=0;i<Math.round(8*q0);i++){ const e=streu(d,0.5), sp=rand(3,5)*Math.sqrt(s);
        psMid.emit(q.x,q.y,q.z,vr[0]*0.4+e[0]*sp,vr[1]*0.4+e[1]*sp,vr[2]*0.4+e[2]*sp,1,.82,.42,rand(0.9,1.4),2.2,4); } });
      schall(q,vv=>sfx.crack(vv*0.28));
    });
  }
};

/* Leuchtfeuer (Leuchtturm, L16): weisse Blinksterne gehen als Kugel auf
   und haengen lange am Himmel, jeder blinkt in seinem eigenen Takt
   (3-8 Hz, echt.md 1.3); in der Mitte gluehen goldene Pistill-Sterne
   wie die Laterne. Weiss und Gold. (28.09., Tom: echt - vorher drehte
   ein Lichtkegel durch eine stehende Punktkugel um einen roten Punkt) */
EFF.blinkfeuer=function(p,A,B,s){
  const q=QUAL(), w0=rkMal(A||FW.weiss,1.15), gold=B||FW.gold;
  for(let i=0;i<Math.round(110*s*q);i++){ const d=randDir(), w=rand(6.5,8.5)*s, hz=rand(3,8), ph=rand(0,1), L=rand(3.0,4.2);
    rkStern(psBig,p,[d[0]*w,d[1]*w,d[2]*w],w0,L,(st,dt)=>{ rkFlug(st,dt,ZIEH,1.8); st.hell=((st.alter*hz+ph)%1)<0.35?1.5:0.03; }); }
  rkSchweif(0.06,()=>{ for(let i=0;i<Math.round(46*s*q);i++){ const d=randDir(), w=rand(2.4,3.6)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,gold[0]*1.2,gold[1]*1.2,gold[2]*1.2,rand(2.2,2.8),2.2,0); } });
  later(0.5,()=>schall(p,v=>sfx.crackle(v*0.3)));
};

/* Silberregen (Silberregen, L17): Silber-Kamuro - dichte Titanglitzer-
   sterne gehen auf, bremsen und haengen als Glocke, aus der ein feiner
   Silberregen rieselt; zuletzt funkeln die Spitzen weiss. Silber, Weiss.
   (28.09., Tom: echt - vorher stand ein waagrechter Ring am Himmel, aus
   dem Regen in geraden Schnueren fiel) */
EFF.silberregen=function(p,A,B,s){
  const q=QUAL(), sil=A||FW.silber, w0=B||FW.weiss, n=Math.round(150*s*q), G=3.6, fu=[.85,.9,1];
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(5.5,8)*s, v=[d[0]*w,d[1]*w*0.85+1.2,d[2]*w], L=rand(3.4,4.4);
    rkSchweif(1.2,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],sil[0],sil[1],sil[2],L,G,4));
    if(i%3===0) rkFunken(p,v,G,0.5,L-0.2,14,fu,{life:[0.7,1.2],g:3.2,streu:0.15,mit:0.02});
    if(i%4===0){ const tz=L-rand(0.35,0.8); imBild(tz,()=>{ const e=bahnOrt(p,v,G,tz), vr=bahnTempo(v,G,tz);
      rkSchweif(0,()=>{ for(let k=0;k<3;k++) psSmall.emit(e.x,e.y,e.z,vr[0]+rand(-.6,.6),vr[1]+rand(-.6,.6),vr[2]+rand(-.6,.6),w0[0]*1.4,w0[1]*1.4,w0[2]*1.4,rand(0.2,0.4),2,4); }); }); }
  }
  later(0.8,()=>schall(p,v=>sfx.regen(v*1.1,3)));
};

/* Glasbruch (Glasbruch, L18): eine eisblaue Kugel geht auf, und nach
   einer knappen Sekunde zerspringt jeder Stern in vier bis sechs weisse
   Glitzersplitter - Farbsterne mit Splitterende (Senrin-Art), dazu
   Klirren. Eisblau und Weiss. (28.09., Tom: echt - vorher stand eine
   Punktkugel still und zerfiel) */
EFF.glasbruch=function(p,A,B,s){
  const q=QUAL(), eis=A||FW.himmel, w0=B||FW.weiss, n=Math.round(90*s*q), G=2.6, c1=[0.25+eis[0]*0.8,0.3+eis[1]*0.8,0.4+eis[2]*0.75];
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(8,9.5)*s, T=rand(0.85,1.05), v=[d[0]*w,d[1]*w,d[2]*w];
    rkSchweif(0.06,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],c1[0]*1.3,c1[1]*1.3,c1[2]*1.3,T,G,0));
    imBild(T,()=>{ const e=bahnOrt(p,v,G,T), vr=bahnTempo(v,G,T), k=5+Math.floor(Math.random()*3);
      rkSchweif(0.04,()=>{ for(let j=0;j<Math.round(k*q);j++){ const x=randDir(), sw=rand(2.5,4.5);
        psMid.emit(e.x,e.y,e.z,vr[0]*0.4+x[0]*sw,vr[1]*0.4+x[1]*sw,vr[2]*0.4+x[2]*sw,w0[0]*1.4,w0[1]*1.4,w0[2]*1.45,rand(0.45,0.85),3,4); } }); });
  }
  later(0.9,()=>schall(p,v=>{ sfx.klirren(v*1.2); later(0.09,()=>sfx.klirren(v)); later(0.18,()=>sfx.klirren(v*0.7)); }));
};

/* Saphirkrone (Jumbo »Saphirkrone«, L19): Chrysanthemenkrone - saphir-
   blaue Sterne mit goldenem Kohleschweif gehen als dichte Kugel auf,
   die Schweife haengen durch und formen die Krone, in der Mitte
   glitzert Gold. Blau und Gold. (28.09., Tom: echt - vorher 14 Kometen
   in den sieben Regenbogenfarben rundherum, dazu ein Regenbogen-
   Aufstieg; eine Rakete bekommt eine Farbe) */
EFF.saphirkrone=function(p,A,B,s){
  const q=QUAL(), blau=A||FW.blau, gold=B||FW.gold, n=Math.round(110*s*q), G=3.6, fu=[1,.62,.25];
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(8,10)*s, v=[d[0]*w,d[1]*w+1,d[2]*w], L=rand(2.4,2.9);
    rkSchweif(0.1,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],blau[0]*1.3,blau[1]*1.3,blau[2]*1.3,L,G,0));
    rkFunken(p,v,G,0.04,L-0.15,i%2?12:7,fu,{life:[0.5,1.0],g:2.4,streu:0.2,mit:0.06});
  }
  rkSchweif(0.4,()=>{ for(let i=0;i<Math.round(60*s*q);i++){ const d=randDir(), w=rand(2.5,4)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,gold[0],gold[1]*0.9,gold[2]*0.7,rand(1.8,2.4),2.6,4); } });
  later(1.1,()=>schall(p,v=>sfx.rieseln(v,1.6)));
};

/* Juwelenpalme (Jumbo »Juwelenpalme«, L21): eine Goldpalme - zehn bis
   zwoelf dicke Goldkometen mit schweren Funkenschweifen steigen als
   Wedel auf und biegen sich; nach gut einer Sekunde bricht jeder
   Wedelkopf in ein kleines Buendel violetter Sterne auf - das Juwel an
   der Spitze -, die Schweife rieseln weiter. Gold und Violett.
   (28.09., Tom: echt - vorher 18 Sterne je Wedel auf einer Linie, die
   als gerade Goldstrahlen standen, und Juwelen in fuenf Farben) */
EFF.juwelenpalme=function(p,A,B,s){
  const q=QUAL(), gold=A||FW.gold, juwel=B||FW.violett, G=4.4, fu=[1,.7,.28], arme=10+Math.floor(Math.random()*3), dreh=rand(0,Math.PI*2);
  rkSchweif(0,()=>{ for(let i=0;i<2;i++) psHuge.emit(p.x,p.y,p.z,0,0,0,1.2,1.1,0.9,0.08+i*0.04,0,0); });
  for(let a=0;a<arme;a++){
    const ang=dreh+a/arme*Math.PI*2+rand(-.2,.2), tilt=rand(0.35,1.0), sp=rand(8.5,10.5)*s;
    const v=[Math.cos(ang)*Math.cos(tilt)*sp,Math.sin(tilt)*sp+2,Math.sin(ang)*Math.cos(tilt)*sp], vl=Math.hypot(v[0],v[1],v[2]), dn=[v[0]/vl,v[1]/vl,v[2]/vl], T=rand(1.0,1.2);
    rkSchweif(0.12,()=>psHuge.emit(p.x,p.y,p.z,v[0],v[1],v[2],gold[0]*1.3,gold[1]*1.25,gold[2]*1.1,T+0.02,G,4));
    rkSchweif(0.3,()=>{ for(let i=0;i<Math.round(9*q);i++){ const e=streu(dn,0.06), w=vl*rand(0.82,0.98); psBig.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,gold[0],gold[1]*0.9,gold[2]*0.7,T*rand(0.8,1),G,4); } });
    rkFunken(p,v,G,0.03,T+0.3,150,fu,{life:[0.6,1.2],g:3,streu:0.35,mit:0.08});
    imBild(T,()=>{ const e=bahnOrt(p,v,G,T), w=bahnTempo(v,G,T);
      rkSchweif(0.06,()=>{ for(let i=0;i<Math.round(18*q);i++){ const d=randDir(), sw=rand(2.2,3.4)*Math.sqrt(s); psBig.emit(e.x,e.y,e.z,w[0]*0.4+d[0]*sw,w[1]*0.4+d[1]*sw,w[2]*0.4+d[2]*sw,juwel[0]*1.3,juwel[1]*1.3,juwel[2]*1.3,rand(1.1,1.6),2.6,0); }
        psBig.emit(e.x,e.y,e.z,w[0]*0.4,w[1]*0.4,w[2]*0.4,1.5,1.5,1.5,0.05,0,0); }); });
  }
  rkSchweif(0.3,()=>{ for(let i=0;i<Math.round(30*q);i++){ const d=randDir(), w=rand(1,3); psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,.9,.6,rand(1,1.6),2.5,4); } });
  later(1.1,()=>{ schall(p,v=>sfx.crack(v*0.9)); flash(p,juwel,2.6,0.4); });
};

/* Blutmond (Jumbo »Mondfinsternis«, L22): eine dichte silberne
   Brokatkugel, rund wie ein Vollmond; in ihrer Mitte ein kupferroter
   Pistill aus langsamen, lange brennenden Sternen. Das Silber verglimmt
   nach knapp drei Sekunden, der rote Kern bleibt als Blutmond, sinkt
   und verlischt als letzter. Silber und Kupferrot. (28.09., Tom: echt -
   vorher eine Mondscheibe als Flaeche, ueber die ein Schatten zog) */
EFF.blutmond=function(p,A,B,s){
  const q=QUAL(), sil=A||FW.silber, rot=B||FW.scharlach, G=3.2, fu=[.9,.93,1];
  for(let i=0;i<Math.round(170*s*q);i++){ const d=randDir(), w=rand(8.8,10.2)*s, v=[d[0]*w,d[1]*w,d[2]*w], L=rand(2.4,3.0);
    rkSchweif(0.4,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],sil[0]*1.1,sil[1]*1.1,sil[2]*1.15,L,G,4));
    if(i%4===0) rkFunken(p,v,G,0.3,L-0.2,10,fu,{life:[0.5,0.9],g:2.6,streu:0.15,mit:0.04}); }
  /* der Blutmond: dichter, kleiner Pistill (28.09. nach dem Rendern: mit
     3-4,2 m/s x Groesse lagen die Sterne als lose rote Punkte im Himmel) */
  rkSchweif(0.12,()=>{ for(let i=0;i<Math.round(52*s*q);i++){ const d=randDir(), w=rand(1.5,2.3)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,rot[0]*1.4,rot[1]*1.3,rot[2]*1.2,rand(3.6,4.2),2.6,0); } });
  later(2.6,()=>schall(p,v=>sfx.rieseln(v*0.6,2)));
};

/* Nordstern (Jumbo »Polarstern«, L22): Blinkweide - silberne Weiden-
   sterne gehen langsam auf und haengen mit langen Schweifen durch; nach
   gut der Haelfte ihres Wegs beginnen ihre Spitzen weiss zu blinken,
   jede in ihrem eigenen Takt, wie ein funkelnder Sternhimmel. In der
   Mitte ein blauer Pistill. Silber und Blau. (28.09., Tom: echt - vorher
   kreisten 40 Sterne auf Kreisbahnen um einen stehenden Leuchtball) */
EFF.nordstern=function(p,A,B,s){
  const q=QUAL(), sil=A||FW.silber, blau=B||FW.blau, G=4.2, fu=[.88,.92,1];
  for(let i=0;i<Math.round(110*s*q);i++){ const d=randDir(), w=rand(5.5,7.5)*s, v=[d[0]*w,d[1]*w*0.85+1.6,d[2]*w], L=rand(3.6,4.4);
    rkSchweif(1.3,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],sil[0]*0.95,sil[1]*0.95,sil[2],L,G,4));
    if(i%3===0) rkFunken(p,v,G,0.3,L-0.3,10,fu,{life:[0.6,1.1],g:3,streu:0.12,mit:0.03});
    /* die Spitze blinkt ab gut der Haelfte des Wegs */
    if(i%2===0){ const ts=L*rand(0.5,0.62), hz=rand(3,8), ph=rand(0,1);
      imBild(ts,()=>{ const e=bahnOrt(p,v,G,ts), w2=bahnTempo(v,G,ts);
        rkStern(psBig,e,w2,[1.3,1.3,1.35],L-ts,(st,dt)=>{ rkFlug(st,dt,ZIEH,G); st.hell=((st.alter*hz+ph)%1)<0.35?1.5:0.04; }); }); } }
  rkSchweif(0.06,()=>{ for(let i=0;i<Math.round(46*s*q);i++){ const d=randDir(), w=rand(3.0,4.2)*s; psBig.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,blau[0]*1.35,blau[1]*1.35,blau[2]*1.35,rand(2.6,3.2),2.2,0); } });
  later(1.4,()=>schall(p,v=>sfx.rieseln(v*0.8,3)));
  later(2.2,()=>schall(p,v=>sfx.crackle(v*0.25)));
};

/* Drachenpalme (Jumbo »Feuerdrache«, L24): ein kurzer Feuerball, dann
   breitet eine Palme aus zehn dicken roten Kometen ihre Wedel aus, jeder
   mit schwerem Goldschweif; am Ende tropft von jedem Wedel Feuer herab -
   orange Glut, die im Fallen dunkelrot verglimmt. Rot und Gold.
   (28.09., Tom: echt - vorher zwei Fluegel-Figuren, die einmal schlugen) */
EFF.drachenpalme=function(p,A,B,s){
  const q=QUAL(), rot=A||FW.rot, gold=B||FW.gold, or=FW.orange, G=4.4, fu=[1,.66,.26];
  rkSchweif(0,()=>{ for(let i=0;i<Math.round(16*q);i++){ const d=randDir(), w=rand(0.5,2.5); psHuge.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,or[0]*1.4,or[1]*1.2,or[2],rand(0.22,0.34),0,0); } });
  /* der Feuerball nur als kurzes Aufgluehen im eigenen Rauch (28.09.: bei 0,3 Deckkraft stand er als orange Wolke) */
  rauchball(p,{r:1.8*Math.sqrt(s),n:4,dauer:0.45,quellen:0.2,steigen:0.6,leuchten:true,c:[0.9,0.38,0.1],a:0.12});
  flash(p,or,7,0.45);
  const arme=12+Math.floor(Math.random()*3), dreh=rand(0,Math.PI*2);
  for(let a=0;a<arme;a++){
    const ang=dreh+a/arme*Math.PI*2+rand(-.25,.25), tilt=rand(0.25,1.15), sp=rand(8,10)*s;
    const v=[Math.cos(ang)*Math.cos(tilt)*sp,Math.sin(tilt)*sp+2,Math.sin(ang)*Math.cos(tilt)*sp], vl=Math.hypot(v[0],v[1],v[2]), dn=[v[0]/vl,v[1]/vl,v[2]/vl], T=rand(1.8,2.2);
    rkSchweif(0.1,()=>psHuge.emit(p.x,p.y,p.z,v[0],v[1],v[2],rot[0]*1.4,rot[1]*1.3,rot[2]*1.2,T,G,0));
    rkSchweif(0.35,()=>{ for(let i=0;i<Math.round(6*q);i++){ const e=streu(dn,0.05), w=vl*rand(0.86,0.99); psBig.emit(p.x,p.y,p.z,e[0]*w,e[1]*w,e[2]*w,gold[0],gold[1]*0.85,gold[2]*0.6,T*rand(0.8,1),G,4); } });
    rkFunken(p,v,G,0.04,T,120,fu,{life:[0.5,1.1],g:3,streu:0.3,mit:0.08});
    /* Feuertropfen am Ende des Wedels: Glut, die abkuehlt */
    imBild(T,()=>{ const e=bahnOrt(p,v,G,T), w=bahnTempo(v,G,T);
      rkSchweif(0.12,()=>{ for(let k=0;k<Math.round(12*q);k++){ const d=randDir(), sw=rand(0.8,2.4); psBig.emit(e.x,e.y,e.z,w[0]*0.3+d[0]*sw,w[1]*0.3+d[1]*sw-0.5,w[2]*0.3+d[2]*sw,1.7,0.8,0.18,rand(1.3,1.9),3.2,2,0.5,0.06,0.02); } }); });
  }
  schall(p,v=>sfx.bruellen(v*1.1));
  later(2.0,()=>schall(p,v=>sfx.crackle(v*0.4)));
};

/* Supernova (Jumbo »Supernova«, L25): nach der zweiten Stufe oben ein
   Titansalut - greller Blitz, harter Schlag, knisternde Silberwolke -
   und im selben Augenblick die groesste Chrysantheme im Laden:
   violette Sterne mit Silberschweifen. Nach gut zwei Sekunden zerfaellt
   jeder zweite Kopf zu weissem Glitzer, der noch lange rieselt.
   Violett und Silber. (28.09., Tom: echt - vorher ein Punktring, der
   einstuerzte, ein Vollbild-Blitz, ein Nebelball und ein Pulsar) */
EFF.supernova=function(p,A,B,s){
  const q=QUAL(), vio=A||FW.violett, fu=[.9,.93,1], G=3.2;
  rkSchweif(0,()=>{ for(let i=0;i<Math.round(110*q);i++){ const d=randDir(), w=rand(7,10)*s; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1.3,1.3,1.3,rand(0.25,0.45),1.2,3); } });
  flash(p,[1,1,1],12*s,0.3);
  shake=Math.max(shake,Math.min(1.1,distVol(p)));
  const n=Math.round(150*s*q);
  for(let i=0;i<n;i++){ const d=randDir(), w=rand(9.5,11.5)*s, v=[d[0]*w,d[1]*w,d[2]*w], L=rand(2.0,2.4);
    rkSchweif(0.1,()=>psBig.emit(p.x,p.y,p.z,v[0],v[1],v[2],vio[0]*1.3,vio[1]*1.3,vio[2]*1.3,L,G,0));
    if(i%2===0) rkFunken(p,v,G,0.05,L-0.1,14,fu,{life:[0.4,0.8],g:2.4,streu:0.2,mit:0.06});
    else imBild(L,()=>{ const e=bahnOrt(p,v,G,L), w2=bahnTempo(v,G,L);
      rkSchweif(0,()=>{ for(let k=0;k<3;k++){ const x=randDir(), sw=rand(0.5,1.5); psMid.emit(e.x,e.y,e.z,w2[0]*0.3+x[0]*sw,w2[1]*0.3+x[1]*sw,w2[2]*0.3+x[2]*sw,1.2,1.2,1.25,rand(1.2,2.0),1.6,4); } }); });
  }
  later(2.3,()=>schall(p,v=>sfx.rieseln(v*0.9,2.5)));
};

/* ---------------------------------------------------------
   Aufstiege (28.09., Tom: echt). Ein Raketenschweif sind Funken aus dem
   Treibsatz: Kohle (Gold bis Orange), Titan/Alu (Silber), Glitter (blitzt
   spaet auf), Knister. Jede Rakete hat ihren eigenen (Test anomalie.js),
   aber keine Baender, Perlen, Striche oder Regenbogen mehr (echt.md 2.3).
   Die Funken entstehen auf der Bahn (ort()), nie daneben - der Schuss
   kommt aus dem Rohr (Test ursprung.js).
   --------------------------------------------------------- */
Object.assign(STEIG_ART,{
  /* Goldregen (Gravur): lange, schwer fallende Goldfunken - unter der
     Rakete haengt ein Goldschleier */
  goldregen:{spur(r,dt,ort){ const c=r.trail;
    for(let n=jeSek(r,'a',160,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.45,.45),rand(-1.4,-0.2),rand(-.45,.45),c[0],c[1]*rand(.85,1),c[2],rand(0.9,1.5),2.6,4); } }},
  /* Hummel (Hasenjagd): Goldschweif, aus dem kleine Funken mit eigenem
     Satz seitlich davonschiessen und nach einem Haken verloeschen */
  hummel:{spur(r,dt,ort){ const c=r.trail;
    for(let n=jeSek(r,'a',130,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.35,.35),rand(-1.2,0),rand(-.35,.35),c[0],c[1],c[2],rand(0.3,0.5),2,4); }
    for(let n=jeSek(r,'b',7,dt);n>0;n--){ const q=ort(), d=randDir(), w=rand(3,5), th=rand(0.12,0.25);
      rkStern(psMid,{x:q[0],y:q[1],z:q[2]},[d[0]*w,d[1]*w*0.5,d[2]*w],[1.2,1,.55],rand(0.35,0.55),(st,dt2)=>{
        if(!st.d.h&&st.alter>th){ st.d.h=1; const x=randDir(); st.v[0]=x[0]*w; st.v[1]=x[1]*w*0.5; st.v[2]=x[2]*w; }
        rkFlug(st,dt2,1.5,1); },{spur:0.08}); } }},
  /* Silberpfeil: gleissender Titanschweif, kurz und hart - die Rakete
     fliegt 1,6-mal so schnell (shot). Vorher ein stehender weisser Strich. */
  pfeil:{spur(r,dt,ort){ for(let n=jeSek(r,'a',320,dt);n>0;n--){ const q=ort(), c=Math.random()<0.5?[1.3,1.3,1.3]:[1.1,1.17,1.3];
    psMid.emit(q[0],q[1],q[2],rand(-.9,.9),rand(-2,-0.4),rand(-.9,.9),c[0],c[1],c[2],rand(0.14,0.3),3,4); } }},
  /* Farbkomet (Smaragd): der Kopf brennt gruen wie ein Farbstern, hinter
     ihm Kohlefunken */
  farbkomet:{spur(r,dt,ort){ const k=r.A, c=r.trail;
    for(let n=jeSek(r,'k',40,dt);n>0;n--){ const q=ort(); psBig.emit(q[0],q[1],q[2],r.v.x*0.05,r.v.y*0.05,r.v.z*0.05,k[0]*1.3,k[1]*1.3,k[2]*1.3,rand(0.08,0.14),0,0); }
    for(let n=jeSek(r,'a',120,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.4,.4),rand(-1.5,-0.2),rand(-.4,.4),c[0],c[1],c[2],rand(0.35,0.6),2.2,4); } }},
  /* Flitter (Glasbruch): feiner Alu-Flitter - silberne Funken, die einzeln
     aufblitzen und kurz in der Luft haengen */
  flitter:{spur(r,dt,ort){ const c=r.trail;
    for(let n=jeSek(r,'a',170,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.3,.3),rand(-.8,0),rand(-.3,.3),c[0],c[1],c[2],rand(0.5,0.9),1.4,4); } }},
  /* Titanknister (Titan): weisser Titanschweif mit harten Funken zur
     Seite, dazwischen knackt es - der Ratterklang bleibt */
  titanknister:{spur(r,dt,ort){ const l=r.v.length()||1, dn=[-r.v.x/l,-r.v.y/l,-r.v.z/l];
    for(let n=jeSek(r,'a',260,dt);n>0;n--){ const q=ort(), e=streu(dn,0.5), w=rand(3,6); psMid.emit(q[0],q[1],q[2],e[0]*w,e[1]*w,e[2]*w,1.3,1.3,1.3,rand(0.25,0.5),3.5,4); }
    for(let n=jeSek(r,'b',18,dt);n>0;n--){ const q=ort(); knisterPop(q[0],q[1],q[2],{funken:5,tempo:rand(2,3.5),laut:0.3,leise:Math.random()<0.5}); } }},
  /* Kobana (Polarstern): Silberschweif, an vier Stellen der Steigbahn
     oeffnet sich eine kleine Silberbluete (japanisch Kobana) - die
     Sprossen der Himmelsleiter. Vorher blieben Perlen alle 3 m stehen. */
  kobana:{vor(r){ const k=r.kbn||0, F=[0.3,0.48,0.66,0.84]; if(k>=F.length||r.alter<r.fuse0*F[k]) return; r.kbn=k+1;
      const p=r.p, c=r.B||FW.blau;
      rkSchweif(0.05,()=>{ for(let i=0;i<Math.round(16*QUAL());i++){ const d=randDir(), w=rand(2.2,3.2), cc=i%3?[.9,.93,1]:c;
        psBig.emit(p.x,p.y,p.z,r.v.x*0.3+d[0]*w,r.v.y*0.3+d[1]*w,r.v.z*0.3+d[2]*w,cc[0]*1.2,cc[1]*1.2,cc[2]*1.2,rand(0.6,0.9),2.4,0); }
        psHuge.emit(p.x,p.y,p.z,0,0,0,1,1,1,0.06,0,0); });
      schall({x:p.x,y:p.y,z:p.z},v=>sfx.crack(v*0.25)); },
    spur(r,dt,ort){ const c=r.trail; for(let n=jeSek(r,'a',200,dt);n>0;n--){ const q=ort(); psMid.emit(q[0],q[1],q[2],rand(-.4,.4),rand(-1.6,-0.2),rand(-.4,.4),c[0],c[1],c[2],rand(0.3,0.55),2.5,4); } }}
});
/* Eng am Rohr (28.09., Tom: "schau, dass du die Effekte an dem Produkt
   rauslaesst"): die Bibliotheks-Aufstiege farbspur und stamm streuen ihre
   Funken schon im Rohr 10-15 cm um den Kopf - am Start lagen so bis zu 14 cm
   neben der Rohroeffnung (Messung ursprung.js ohne Ausnahme fuer
   Steigschweife). Die eigenen Fassungen fuer Farbenrausch und Saphirkrone
   streuen erst, wenn die Rakete das Rohr verlassen hat (voll ab 1,2 m). */
const rkEng=(r,q)=>Math.min(1,Math.max(0,(q[1]-r.y0)/1.2));
Object.assign(STEIG_ART,{
  farbflamme:{spur(r,dt,ort){ const c=r.trail, k=0.75*(1+0.2*Math.sin(r.alter*Math.PI*24)), v=r.v;
    for(let n=jeSek(r,'a',45,dt);n>0;n--){ const q=ort(), f=rkEng(r,q); psHuge.emit(q[0]+rand(-.1,.1)*f,q[1],q[2]+rand(-.1,.1)*f,-v.x*0.06+rand(-.3,.3)*f,-v.y*0.06,-v.z*0.06+rand(-.3,.3)*f,c[0]*k,c[1]*k,c[2]*k,rand(0.12,0.2),0,0); }
    for(let n=jeSek(r,'b',200,dt);n>0;n--){ const q=ort(), f=rkEng(r,q); psBig.emit(q[0]+rand(-.15,.15)*f,q[1]-rand(0,1.2)*f,q[2]+rand(-.15,.15)*f,rand(-.4,.4)*f,rand(-1,0),rand(-.4,.4)*f,c[0]*k,c[1]*k,c[2]*k,rand(0.1,0.15),0,0); }
    if(FW_UHR-(STEIG_ART.farbflamme.licht||-9)>0.3){ STEIG_ART.farbflamme.licht=FW_UHR; flash(r.p,c,0.9,0.35); } }},
  goldsaeule:{spur(r,dt,ort){ const c=r.trail;
    for(let n=jeSek(r,'a',240,dt);n>0;n--){ const q=ort(), f=rkEng(r,q); psBig.emit(q[0]+rand(-.12,.12)*f,q[1],q[2]+rand(-.12,.12)*f,rand(-.15,.15)*f,rand(-.35,0),rand(-.15,.15)*f,c[0],c[1]*rand(.85,1),c[2],rand(1.0,1.4),0.3,0); }
    for(let n=jeSek(r,'b',50,dt);n>0;n--){ const q=ort(), f=rkEng(r,q); psMid.emit(q[0],q[1],q[2],rand(-.8,.8)*f,rand(-2,-.5),rand(-.8,.8)*f,1,.62,.2,rand(0.6,1.1),3,4); } }}
});
/* Drachenfeuer (Feuerdrache): fauchende Flammen und Bernsteinfunken wie
   der Drachenschweif der Bibliothek, aber gerade - der schlug 0,6 m zur
   Seite aus (Schlangenlinie, sah nach Lichtshow aus) */
Object.assign(STEIG_ART,{
  drachenfeuer:{spur(r,dt,ort){ const c=r.trail, v=r.v, b=FW.bernstein;
    for(let n=jeSek(r,'a',100,dt);n>0;n--){ const q=ort(), f=rkEng(r,q); psHuge.emit(q[0],q[1],q[2],-v.x*0.15+rand(-.4,.4)*f,-v.y*0.15,-v.z*0.15+rand(-.4,.4)*f,c[0]*1.4,c[1]*1.4,c[2]*1.4,rand(0.2,0.3),-0.5,0); }
    for(let n=jeSek(r,'b',15,dt);n>0;n--){ const q=ort(), f=rkEng(r,q); psBig.emit(q[0],q[1],q[2],rand(-1,1)*f,rand(-1,0.5),rand(-1,1)*f,b[0],b[1],b[2],1.2,3,4); } }}
});
Object.assign(STEIG_SPUR_AB,{farbflamme:0});
Object.assign(STEIG_FARBE,{goldregen:[1,.72,.3],hummel:[1,.74,.34],farbkomet:[1,.62,.25],flitter:[.9,.94,1],titanknister:[1,1,1],kobana:[.86,.9,1],goldsaeule:[1,.7,.26],drachenfeuer:[1,.35,.08]});
Object.assign(STEIG_KLANG,{
  goldregen(r,v){ sfx.zischen(v*0.4,r.fuse+0.1); },
  hummel(r,v){ if(typeof tonGen==='function') tonGen({f:170,typ:'sawtooth',lp:900,am:23,amTiefe:0.6,dur:r.fuse+0.1,vol:0.02*v,an:0.1}); sfx.zischen(v*0.3,r.fuse); },
  farbkomet:STEIG_TON.farbspur, flitter:STEIG_TON.glasklang, titanknister:STEIG_TON.ratter,
  kobana(r,v){ sfx.fizz(v*0.8); },
  farbflamme:STEIG_TON.farbspur, drachenfeuer:STEIG_TON.drachenschweif
});

/* ---------------------------------------------------------
   Die Raketen (katalog-raketen.md). Jede: eigener Aufstieg (steig),
   eigener Bruch (eff), sz und pw steigen mit dem Level.
   dauer: so lange steht die Rakete auf der Rampe (brennDauer).
   --------------------------------------------------------- */
Object.assign(RAKETEN_KL,{
  glueckrakete   :{n:1,gap:0,sz:0.85,pw:-6, fuse:1.2, steig:'gold',     eff:['fallschirm'],farbRotation:['rot','gruen','zitrone','himmel','weiss'],knall:'plopp',bruchOpt:{kern:false,nachglitzer:false,flash:0.2},dauer:10},
  raketenklein   :{n:1,gap:0,sz:0.88,pw:-5, fuse:1.25,steig:'keiner',   A:'silber',B:'himmel',eff:['schnuppe'],knall:'rakPff',bruchOpt:{kern:false,nachglitzer:false,flash:0.3},dauer:3.8},
  glitzerraketen :{n:1,gap:0,sz:0.92,pw:-4, fuse:1.2, steig:'tremolant',A:'limette',B:'gold',eff:['garbe'],knall:'rakPuff',bruchOpt:{kern:false,nachglitzer:false,flash:0.35},dauer:4.4},
  blanko         :{n:1,gap:0,sz:0.95,pw:-3.5,fuse:1.2,steig:'silber',   th:'gold',eff:['goldglitzer'],dauer:4.5},
  gravur         :{n:1,gap:0,sz:0.98,pw:-3, fuse:1.25,steig:'goldregen',A:'gold',B:'rose',eff:['initiale'],bruchOpt:{kern:false,nachglitzer:false,flash:0.5},dauer:4.8},
  raketen        :{n:1,gap:0,sz:1.0, pw:-3, fuse:1.25,steig:'hummel',   A:'tuerkis',B:'gold',eff:['hakenschlag'],bruchOpt:{nachglitzer:false},dauer:4},
  silberpfeil    :{n:1,gap:0,sz:1.02,pw:-2.5,fuse:0.95,steig:'pfeil',   A:'weiss',B:'silber',eff:['silberspinne'],bruchOpt:{nachglitzer:false,flash:1.1},dauer:3},
  kometenraketen :{n:1,gap:0,sz:1.05,pw:-2, fuse:1.3, steig:'komet',    A:'gold',B:'blau',eff:['kometenkette'],bruchOpt:{kern:false,nachglitzer:false,flash:0.4},dauer:4.8},
  pfeifraketen   :{n:1,gap:0,sz:1.05,pw:-2, fuse:1.3, steig:'pfeif',    pfeif:true,A:'rot',B:'weiss',eff:['pfeifsterne'],bruchOpt:{nachglitzer:false},dauer:3.8},
  farbenrausch   :{n:1,gap:0,sz:1.1, pw:-1, fuse:1.25,steig:'farbflamme',A:'magenta',B:'limette',eff:['halbhalb'],bruchOpt:{nachglitzer:false},dauer:4.4},
  raketengold    :{n:1,gap:0,sz:1.3, pw:0.8,fuse:1.3, steig:'brokat',   th:'koenig',dick:1,eff:['nishiki'],bruchOpt:{kern:false},dauer:5},
  knisterstern   :{n:1,gap:0,sz:1.34,pw:1.2,fuse:1.25,steig:'knister',  A:'silber',B:'gold',eff:['spaetzuender'],knall:'rakPff',bruchOpt:{kern:false,nachglitzer:false,flash:0.15},dauer:5.6},
  smaragd        :{n:1,gap:0,sz:1.38,pw:1.6,fuse:1.3, steig:'farbkomet',A:'gruen',B:'mint',eff:['achtblatt'],bruchOpt:{kern:false,nachglitzer:false,flash:0.35},dauer:4.4},
  blinkstern     :{n:1,gap:0,sz:1.42,pw:2.2,fuse:1.3, steig:'blink',    A:'weiss',B:'gold',eff:['blinkfeuer'],bruchOpt:{kern:false,nachglitzer:false},dauer:6},
  silberregen    :{n:1,gap:0,sz:1.46,pw:3,  fuse:1.3, steig:'rieselschweif',A:'silber',B:'weiss',dick:1,eff:['silberregen'],bruchOpt:{kern:false,nachglitzer:false},dauer:6},
  kristall       :{n:1,gap:0,sz:1.5, pw:3.5,fuse:1.3, steig:'flitter',  A:'himmel',B:'weiss',dick:1,eff:['glasbruch'],bruchOpt:{kern:false,nachglitzer:false,flash:0.35},dauer:4.4},
  /* Furzrakete »Donnerbalken«: normaler Raketenweg, der Witz steckt im
     Aufstieg - sie setzt dreimal aus und pupst sich weiter */
  furzrakete     :{n:1,gap:0,sz:1.55,pw:4.2,fuse:1.6, steig:'stotter',  A:'braun',B:'sumpf',eff:['furz'],knall:'furz',bruchOpt:{kern:false,nachglitzer:false}},
  regenbogenkrone:{n:1,gap:0,sz:1.65,pw:4.6,fuse:1.35,steig:'goldsaeule',A:'blau',B:'gold',dick:2,eff:['saphirkrone'],bruchOpt:{kern:false,nachglitzer:false},dauer:5.4},
  titanraketen   :{n:1,gap:0,sz:1.75,pw:5.5,fuse:1.35,steig:'titanknister',th:'eis',dick:1,eff:['titan'],bruchOpt:{kern:false},dauer:5},
  jumbogold      :{n:1,gap:0,sz:2.2, pw:8,  fuse:1.4, steig:'glut',     th:'koenig',dick:2,trail:'bernstein',eff:['juwelenpalme'],bruchOpt:{kern:false},dauer:6},
  silbermond     :{n:1,gap:0,sz:2.25,pw:9,  fuse:1.4, steig:'titanspur',A:'silber',B:'scharlach',dick:2,eff:['blutmond'],knall:'rakTief',bruchOpt:{kern:false,nachglitzer:false,flash:0.6},dauer:7.5},
  jumboleiter    :{n:1,gap:0,sz:2.3, pw:10, fuse:1.45,steig:'kobana',   A:'silber',B:'blau',dick:2,eff:['nordstern'],bruchOpt:{kern:false,nachglitzer:false},dauer:7.5},
  feuerdrache    :{n:1,gap:0,sz:2.4, pw:11, fuse:1.4, steig:'drachenfeuer',A:'rot',B:'gold',dick:2,trail:'orange',eff:['drachenpalme'],bruchOpt:{kern:false,nachglitzer:false},dauer:7},
  supernova      :{n:1,gap:0,sz:2.5, pw:12, fuse:1.45,steig:'zweistufe',A:'violett',B:'silber',dick:2,eff:['supernova'],knall:'rakSalut',bruchOpt:{kern:false,nachglitzer:false,flash:false},dauer:7.5}
});
/* Wie die Rakete im Rohr aussieht (raketeModell in 05d-yard.js): bisher
   hatten nur neun Sorten ein eigenes Aussehen, die anderen - auch die
   vier Jumbos Saphirkrone, Mondfinsternis, Feuerdrache und Supernova -
   standen als gleiche kleine Rakete im Rohr (28.09., Tom: "die Produkte
   sehen alle gleich aus"). Groesse nach Klasse, Farben wie die Packung. */
if(typeof RAKETEN_LOOK!=='undefined') Object.assign(RAKETEN_LOOK,{
  glueckrakete   :{r:0.021,L:0.14,body:'#1f5d2a',kopf:'#c8ff5c',band:'#ffd23f'},
  glitzerraketen :{r:0.023,L:0.16,body:'#12406b',kopf:'#ffd23f',band:'#f2f5ff',rillen:true},
  silberpfeil    :{r:0.025,L:0.24,body:'#c9ced8',kopf:'#e8eef8',band:'#5ce1ff',metall:true,flossen:true},
  kometenraketen :{r:0.028,L:0.2, body:'#0c3d7a',kopf:'#ffd23f',band:'#5ce1ff'},
  farbenrausch   :{r:0.028,L:0.2, body:'#6a24c9',kopf:'#5cff9e',band:'#ff4fa3'},
  knisterstern   :{r:0.03, L:0.22,body:'#12406b',kopf:'#5ce1ff',band:'#ffd23f',rillen:true},
  smaragd        :{r:0.031,L:0.23,body:'#0d4a2a',kopf:'#5cff9e',band:'#ffd23f',flossen:true},
  blinkstern     :{r:0.032,L:0.24,body:'#0f2a4a',kopf:'#f2f5ff',band:'#ffd23f',flossen:true},
  silberregen    :{r:0.034,L:0.25,body:'#8a93a3',kopf:'#f2f5ff',band:'#d1e5ff',metall:true,flossen:true},
  kristall       :{r:0.036,L:0.26,body:'#0f2a4a',kopf:'#d1e5ff',band:'#f2f5ff',metall:true,flossen:true},
  regenbogenkrone:{r:0.048,L:0.5, body:'#12275e',kopf:'#ffd23f',band:'#5c8dff',flossen:true,gross:true,jumbo:true},
  silbermond     :{r:0.05, L:0.54,body:'#26292f',kopf:'#f2f5ff',band:'#e63b2e',metall:true,flossen:true,gross:true,jumbo:true},
  feuerdrache    :{r:0.05, L:0.56,body:'#7a1010',kopf:'#ff7a1c',band:'#ffd23f',flossen:true,gross:true,jumbo:true},
  supernova      :{r:0.05, L:0.6, body:'#12204a',kopf:'#f2f5ff',band:'#ff4fd8',metall:true,flossen:true,gross:true,jumbo:true}
});
/* Schweiflaenge der Bruchsterne, wenn der Bruch sie nicht selbst setzt:
   Farbsterne nur mit kurzer Flamme (echt.md 1.2) */
Object.assign(EFF_SCHWEIF,{fallschirm:0,schnuppe:0.06,garbe:0.08,initiale:0.06,hakenschlag:0.05,silberspinne:0.1,kometenkette:0.08,halbhalb:0.06,spaetzuender:0,
  achtblatt:0.08,blinkfeuer:0,silberregen:1.2,glasbruch:0.06,saphirkrone:0.1,juwelenpalme:0.12,blutmond:0.4,nordstern:0.7,drachenpalme:0.1,supernova:0.1});
/* Titan (titanraketen, nur Raketen - Liste EXKL in steigerung.js): die
   Silberspur 0,4 statt 0,8 s - mit 0,8 s standen 10 m lange gerade
   Silberstriche am Himmel (Probebild 28.09.) */
EFF_SCHWEIF.titan=0.4;
/* Familien fuer effPassen: Glitzer- und Haengebilder, Knister */
Object.assign(EFF_FAMILIE,{schnuppe:'haenger',garbe:'haenger',silberspinne:'knister',kometenkette:'haenger',hakenschlag:'knister',silberregen:'haenger',
  glasbruch:'knister',saphirkrone:'kugel',juwelenpalme:'haenger',blutmond:'kugel',nordstern:'haenger',drachenpalme:'haenger',supernova:'kugel',blinkfeuer:'knister'});

/* Signaturen: Bruch und Aufstieg, beide nur bei dieser Rakete */
Object.assign(SIGNATUR,{
  glueckrakete   :{eff:'fallschirm',steig:'gold',text:'Ein Leuchtsatz haengt am Fallschirm, sinkt acht Sekunden pendelnd, tropft und faerbt den Boden.'},
  raketenklein   :{eff:'schnuppe',steig:'keiner',text:'Dunkler Aufstieg, oben ziehen fuenf Silberkometen mit langem Glitzerschweif wie Sternschnuppen nach aussen.'},
  glitzerraketen :{eff:'garbe',steig:'tremolant',text:'Glitzernder Aufstieg, oben eine Garbe aus Limette und Gold, die weiter steigt und in Boegen faellt.'},
  blanko         :{eff:'goldglitzer',steig:'silber',text:'Das unbeschriebene Blatt: schlichter Silberschweif, Goldglitzer mit haengenden Glitzervorhaengen.'},
  gravur         :{eff:'initiale',steig:'goldregen',text:'Ein Goldschleier traegt sie hoch, oben gehen die Initialen als Musterbombe in Gold auf.'},
  raketen        :{eff:'hakenschlag',steig:'hummel',text:'Summender Goldschweif, oben fluechten Go-Getter mit tuerkisem Kopf, jeder mit eigenen Haken.'},
  silberpfeil    :{eff:'silberspinne',steig:'pfeil',text:'Startknall, doppelt so schnell, gleissender Titanschweif, oben eine harte Silberspinne.'},
  kometenraketen :{eff:'kometenkette',steig:'komet',text:'Goldkometen spalten sich zweimal - eine Kette aus immer kleineren Kometen, die blau verglimmen.'},
  pfeifraketen   :{eff:'pfeifsterne',steig:'pfeif',text:'Pfeift im Steigen und im Bruch: aus einem roten Kern schrauben sich Pfeifsterne davon und knacken.'},
  farbenrausch   :{eff:'halbhalb',steig:'farbflamme',text:'Halb Magenta, halb Limette - kurz dunkel, dann tauschen die Haelften.'},
  raketengold    :{eff:'nishiki',steig:'brokat',text:'Flimmernder Brokat-Aufstieg, Goldkugel mit violetten Spitzen.'},
  knisterstern   :{eff:'spaetzuender',steig:'knister',text:'Scheinbruch wie ein Blindgaenger, Stille - dann eine riesige Knisterwand.'},
  smaragd        :{eff:'achtblatt',steig:'farbkomet',text:'Gruener Kometenkopf im Aufstieg, oben acht Buendel in drei Gruentoenen - geschliffen wie ein Smaragd.'},
  blinkstern     :{eff:'blinkfeuer',steig:'blink',text:'Weisse Blinksterne, jeder im eigenen Takt, um eine goldene Laterne.'},
  silberregen    :{eff:'silberregen',steig:'rieselschweif',text:'Silberne Kamuro-Glocke, aus der ein feiner Silberregen rieselt.'},
  kristall       :{eff:'glasbruch',steig:'flitter',text:'Singt wie ein Weinglas; oben zerspringt jeder eisblaue Stern klirrend in weisse Splitter.'},
  furzrakete     :{eff:'furz',steig:'stotter',text:'Kommt nur muehsam hoch: dreimal geht ihr die Luft aus, dreimal hilft ein Pups nach.'},
  regenbogenkrone:{eff:'saphirkrone',steig:'goldsaeule',text:'Ein Goldstamm waechst hoch, oben eine Krone aus saphirblauen Sternen mit goldenen Funkenschweifen.'},
  titanraketen   :{eff:'titan',steig:'titanknister',text:'Kreischend-knisternder Titanschweif, oben ein harter Schlag in eine riesige Silberkugel.'},
  jumbogold      :{eff:'juwelenpalme',steig:'glut',text:'Ein Glutstamm waechst hoch, oben eine Goldpalme mit einem violetten Juwel an jeder Spitze.'},
  silbermond     :{eff:'blutmond',steig:'titanspur',text:'Ein silberner Vollmond verglimmt, sein kupferroter Kern bleibt als Blutmond stehen.'},
  jumboleiter    :{eff:'nordstern',steig:'kobana',text:'Vier Silberblueten im Aufstieg, oben eine silberne Brokatkrone mit blauem Kern und Blinkern.'},
  feuerdrache    :{eff:'drachenpalme',steig:'drachenfeuer',text:'Fauchender Flammenschweif, oben Feuerball und rote Palme, deren Wedel als Glut abtropfen.'},
  supernova      :{eff:'supernova',steig:'zweistufe',text:'Zweistufig; oben ein Titansalut und die groesste violette Chrysantheme, die zu Glitzer zerfaellt.'}
});

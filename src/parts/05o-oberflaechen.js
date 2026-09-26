/* =========================================================
   Wände und Böden (Tom, 26.09.: "das sieht teilweise echt kacke aus
   ... ich habe gar keinen Anreiz, das zu verbessern ... geile
   Parkettböden, richtig gute Tapeten ... guck dir an, wie hochmoderne
   Kaufhäuser aussehen").

   Vorbilder (recherchiert und gegengeprüft, 26.09.): Breuninger
   Hamburg und Apple Battersea (Terrazzo), KaDeWe (Nussbaumfurnier,
   Marmorbänder, rosa Teppich), Hackett London und Boygar's Tiflis
   (Versailles-Parkett), Printemps New York (Moiré-Tapete), Harrods
   (Samtwände, Marmor), Jacquemus London (Kalkputz, Travertin), Globus
   Basel (Beton), Kith Paris (Fischgrät, Nussbaum, Venezianer Putz).

   Was vorher billig wirkte (Analyse vom 26.09.):
   - zehn der vierzehn Wandfarben waren fast dasselbe Weiß, immer mit
     demselben dunklen 1,1-m-Band und einer Zierleiste
   - alle Muster um ein Drittel gestaucht (Leinwand nicht im Wandmass)
   - jeder Boden, auch Holz und Teppich, bekam ein 1-m-Kachelraster
   - Holz ohne Maserung, Dielen in strengem Streifenwechsel
   - alle Böden gleich matt, nichts spiegelt
   - die Reliefkarte passte nicht zum Bild (zweiter Zufallswurf)

   Jetzt:
   - Leinwand im echten Massstab: Wand 2,6 × 3,6 m, Boden 4 × 4 m, jede
     Kachel nahtlos, die Masse der Muster nach echten Vorlagen
     (Fischgrät 67 × 471 mm, Rippenpaneel 27/13 mm, Metro 15 × 7,5 cm,
     Zellige 10 × 10 cm, Ziegel 24 × 7 cm, Tapetenrapport 65 cm)
   - jedes Brett, jede Fliese, jeder Stein hat seinen eigenen Ton,
     Holz seine eigene Maserung
   - Relief aus demselben Zufall wie das Bild: Fugen sind Fugen
   - Glanz je Material: Marmor und geschliffener Beton spiegeln,
     Teppich und Putz sind matt
   - die Sockelleiste nimmt den Ton der Wand auf
   ========================================================= */

/* ---------- Werkzeug ---------- */
/* Zufall mit Saat: Bild und Relief muessen dieselben Bretter sehen */
function saat(s){ let a=s>>>0||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const hx=s=>{ const n=parseInt(s.slice(1),16); return [n>>16&255,n>>8&255,n&255]; };
const rgbS=(c,a)=>a===undefined?`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`:`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
/* Farbe heller/dunkler (f>1 heller) und leicht verschoben */
function ton(c,f,dr,dg,db){ return [clamp(c[0]*f+(dr||0),0,255),clamp(c[1]*f+(dg||0),0,255),clamp(c[2]*f+(db||0),0,255)]; }
function mischen(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; }
/* Zeichnen mit Umlauf: was ueber den Rand ragt, kommt auf der anderen
   Seite wieder herein - so wird jede Kachel nahtlos */
function umlauf(W,H,x,y,r,fn){
  const xs=[0], ys=[0];
  if(x-r<0) xs.push(W); if(x+r>W) xs.push(-W);
  if(y-r<0) ys.push(H); if(y+r>H) ys.push(-H);
  for(const dx of xs) for(const dy of ys) fn(x+dx,y+dy);
}
/* Maler-Kontext: im Farbmodus die Farbe, im Hoehenmodus ein Grauwert.
   Beide Durchgaenge laufen mit derselben Saat, deshalb liegen die
   Fugen im Relief genau auf den Fugen im Bild. */
function malKontext(g,W,H,hoehe,seed,pxm){
  /* R: Anordnung (Bretter, Fliesen, Toene) - in beiden Durchgaengen
     gleich viele Zuege. Z: Zierwerk (Maserung, Koernung, Wolken) - darf
     im Farb- und im Reliefdurchgang verschieden oft gezogen werden. */
  const R=saat(seed), Z=saat(seed^0x5bd1e995);
  return {g,W,H,hoehe,R,Z,pxm,m2:(W/pxm)*(H/pxm),
    r:(a,b)=>a+(b-a)*R(), z:(a,b)=>a+(b-a)*Z(),
    fill(c,hv,a){ g.fillStyle=hoehe?rgbS([hv,hv,hv],a):rgbS(c,a); },
    stroke(c,hv,a){ g.strokeStyle=hoehe?rgbS([hv,hv,hv],a):rgbS(c,a); }};
}
/* Ortsfester Zufall: ein Brett oder eine Fliese, die ueber die
   Kachelkante ragt, wird zweimal gezeichnet (links und rechts) - beide
   Male muss derselbe Ton, dieselbe Maserung herauskommen. Vorher zog
   jede Kopie neu, und an der Kante sprang die Farbe mitten im Brett. */
function mitSaat(M,seed,fn){
  const alt=[M.R,M.Z,M.r,M.z], R=saat(seed), Z=saat(seed^0x2c1b3c6d);
  M.R=R; M.Z=Z; M.r=(a,b)=>a+(b-a)*R(); M.z=(a,b)=>a+(b-a)*Z();
  try{ fn(); } finally { [M.R,M.Z,M.r,M.z]=alt; }
}
/* Saat aus der Lage auf der Kachel (Weltlage modulo Kachel) */
function ortSaat(M,x,y,extra){
  const X=((Math.round(x*2)%Math.round(M.W*2))+Math.round(M.W*2))%Math.round(M.W*2), Y=((Math.round(y*2)%Math.round(M.H*2))+Math.round(M.H*2))%Math.round(M.H*2);
  return (Math.imul(X+1,73856093)^Math.imul(Y+1,19349663)^Math.imul((extra|0)+1,83492791))>>>0;
}
/* Ausschnitt (eine Fliese, ein Brett) mit eigener Flaeche */
function ausschnitt(M,A,B){ return Object.assign({},M,{W:A,H:B,m2:A*B/(M.pxm*M.pxm)}); }
/* Weiche Wolken in einem Ton: Grundlage fuer Putz, Beton, Stein */
function wolken(M,c,n,rmin,rmax,amin,amax,hv){
  const {g,W,H}=M;
  for(let i=0;i<n;i++){ const x=M.Z()*W, y=M.Z()*H, r=M.z(rmin,rmax), a=M.z(amin,amax), hell=M.Z()<0.5;
    const col=hell?ton(c,1.12):ton(c,0.86), h=hv===undefined?128:(hell?hv+8:hv-8);
    umlauf(W,H,x,y,r,(xx,yy)=>{ const gr=g.createRadialGradient(xx,yy,0,xx,yy,r);
      gr.addColorStop(0,M.hoehe?rgbS([h,h,h],a):rgbS(col,a)); gr.addColorStop(1,M.hoehe?rgbS([h,h,h],0):rgbS(col,0));
      g.fillStyle=gr; g.fillRect(xx-r,yy-r,r*2,r*2); }); }
}
/* Feine Koernung: Staub, Pigment, Zuschlag - dichte je Quadratmeter,
   Korngroesse in Pixeln bei 512 px/m */
function koernung(M,cols,dichte,s0,s1,alpha,hv){
  const {g,W,H}=M, n=Math.round(dichte*M.m2), f=M.pxm/512;
  for(let i=0;i<n;i++){ const c=cols[(M.Z()*cols.length)|0], s=Math.max(0.5,M.z(s0,s1)*f);
    M.fill(c,hv===undefined?128:hv+(M.Z()-0.5)*20,alpha); g.fillRect(M.Z()*W,M.Z()*H,s,s); }
}

/* ---------- Holz ---------- */
/* Ein Brett im eigenen Koordinatensystem (x laengs, y quer), px.
   Eigener Ton, eigene Maserung, gelegentlich ein Ast, dunkle Fuge. */
function brett(M,l,w,base,o){
  const T=M.g.getTransform?M.g.getTransform():null;
  if(T&&!M._imBrett){ const cx=T.a*l/2+T.c*w/2+T.e, cy=T.b*l/2+T.d*w/2+T.f;
    M._imBrett=true; try{ mitSaat(M,ortSaat(M,cx,cy,Math.round(l)*7+Math.round(w)),()=>brett(M,l,w,base,o)); } finally { M._imBrett=false; } return; }
  const {g,R}=M; o=o||{};
  const f=0.84+R()*0.3, c=ton(base,f,M.r(-6,6),M.r(-4,4),M.r(-5,5));
  M.fill(c,120+R()*18); g.fillRect(0,0,l,w);
  if(!M.hoehe){
    /* Maserung: feine Linien laengs, leicht gewellt */
    const Z=M.Z, n=Math.max(3,Math.round(w/(o.fein||2.2))), ph=Z()*6, amp=w*M.z(0.02,0.08);
    for(let k=0;k<n;k++){ const y0=(k+Z()*0.8)/n*w, d=Z()<0.5;
      g.strokeStyle=rgbS(d?ton(c,0.7):ton(c,1.15),M.z(0.05,0.2)); g.lineWidth=M.z(0.5,1.4);
      g.beginPath(); for(let s=0;s<=10;s++){ const x=s/10*l, y=y0+Math.sin(ph+s*0.9+k)*amp+Math.sin(s*2.7+k*1.3)*amp*0.4;
        s?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
    /* Fladerung: ein paar gestreckte Boegen */
    if(o.fladern!==false&&Z()<0.6){ const cx=M.z(0.2,0.8)*l, cy=w*M.z(0.3,0.7);
      for(let k=1;k<5;k++){ g.strokeStyle=rgbS(ton(c,0.72),0.12); g.lineWidth=0.8;
        g.beginPath(); g.ellipse(cx,cy,l*0.08*k,w*0.12*k,0,0,Math.PI*2); g.stroke(); } }
    /* Ast */
    if(Z()<(o.aeste||0.12)){ const ax=M.z(0.1,0.9)*l, ay=M.z(0.3,0.7)*w, ar=Math.min(w*0.22,M.z(2,5));
      g.fillStyle=rgbS(ton(c,0.45),0.8); g.beginPath(); g.ellipse(ax,ay,ar*1.4,ar,0,0,Math.PI*2); g.fill();
      g.strokeStyle=rgbS(ton(c,0.6),0.35); g.lineWidth=0.8; for(let k=1;k<4;k++){ g.beginPath(); g.ellipse(ax,ay,ar*1.4+k*2.5,ar+k*1.6,0,0,Math.PI*2); g.stroke(); } }
    /* Licht und Schatten an den Kanten: Mikrofase */
    g.fillStyle=rgbS(ton(c,1.2),0.25); g.fillRect(0,0,l,Math.max(0.6,w*0.03));
    g.fillStyle=rgbS(ton(c,0.5),0.35); g.fillRect(0,w-Math.max(0.6,w*0.03),l,Math.max(0.6,w*0.03));
  }
  /* Fuge */
  M.stroke(ton(base,0.32),40,M.hoehe?1:0.55); g.lineWidth=Math.max(0.8,(o.fuge||1)); g.strokeRect(0,0,l,w);
}
/* Dielenboden: Reihen quer, Laengen gemischt, nahtlos */
function dielen(M,pxm,breite,lmin,lmax,base,o){
  const {g,W,H,R}=M, pw=breite*pxm, reihen=Math.round(H/pw), ph=H/reihen;
  for(let r=0;r<reihen;r++){
    let x=R()*W; const start=x; let rest=W;
    while(rest>0.01){ let l=M.r(lmin,lmax)*pxm; if(rest-l<lmin*pxm*0.6) l=rest; rest-=l;
      const x0=x; umlauf(W,H,x0+l/2,r*ph+ph/2,l/2+2,(xx,yy)=>{ g.save(); g.translate(xx-l/2,yy-ph/2); brett(M,l,ph,base,o); g.restore(); });
      x+=l; if(x>start+W) break; }
  }
}
/* Fischgrät, 45° zu den Waenden: Bloecke k:1, Rapport 2L auf der
   Bretteinheit, auf der Kachel 2·L·√2. L=0,4714 m ergibt genau drei
   Rapporte auf vier Metern - nahtlos. */
function fischgraet(M,pxm,L,k,base,o){
  const {g,W,H}=M, Lp=L*pxm, Wp=Lp/k, D=Math.hypot(W,H)/2+Lp*2;
  g.save(); g.translate(W/2,H/2); g.rotate(Math.PI/4);
  /* Bandversatz: Nachrechnung vom 26.09. - fuer jedes ganzzahlige k:1
     schliessen die Baender mit (-2L, 0) lueckenlos an */
  const t2=[-2*Lp,0];
  const n=Math.ceil(D/Wp)+2, m=Math.ceil(D/Math.abs(t2[0]))+3;
  for(let b=-m;b<=m;b++) for(let i=-n;i<=n;i++){
    const x=i*Wp+b*t2[0], y=i*Wp+b*t2[1];
    if(Math.abs(x)>D+Lp||Math.abs(y)>D+Lp) continue;
    /* waagrechter und senkrechter Block; die Nachbarn leicht verschieden
       hell, so wie echtes Fischgrät das Licht je Richtung anders nimmt */
    g.save(); g.translate(x,y); brett(M,Lp,Wp,ton(base,1.04),o); g.restore();
    g.save(); g.translate(x+Wp,y+Wp); g.rotate(Math.PI/2); brett(M,Lp,Wp,ton(base,0.95),o); g.restore();
  }
  g.restore();
}
/* Chevron: Spalten mit V-Stoss in der Mitte, 45° geschnitten */
function chevron(M,pxm,halb,pitch,base,o){
  const {g,W,H,R}=M, hc=halb*pxm, p=pitch*pxm, sp=Math.round(W/(2*hc)), zeilen=Math.round(H/p);
  for(let s=0;s<sp;s++) for(let z=-2;z<zeilen+2;z++) for(const seite of [0,1]){
    const x0=s*2*hc+seite*hc, y=z*p;
    const zr=((z%zeilen)+zeilen)%zeilen, q=saat(ortSaat(M,s*97,zr*31,seite+3)), c=ton(base,0.84+q()*0.3,q()*10-5,q()*8-4,q()*10-5), hv0=120+q()*16;
    const pts=seite?[[x0,y],[x0+hc,y+hc],[x0+hc,y+hc+p],[x0,y+p]]:[[x0,y+hc],[x0+hc,y],[x0+hc,y+p],[x0,y+hc+p]];
    for(const dy of [0,H,-H]){ g.beginPath(); pts.forEach(([x,yy],i)=>i?g.lineTo(x,yy+dy):g.moveTo(x,yy+dy)); g.closePath();
      M.fill(c,hv0); g.fill();
      if(!M.hoehe){ g.save(); g.clip(); g.strokeStyle=rgbS(ton(c,0.72),0.14); g.lineWidth=0.9;
        for(let k=0;k<7;k++){ const off=(k+M.Z())/7*p; g.beginPath(); g.moveTo(x0,(seite?y:y+hc)+off+dy); g.lineTo(x0+hc,(seite?y+hc:y)+off+dy+M.z(-1,1)); g.stroke(); }
        g.restore(); }
      M.stroke(ton(base,0.3),40,M.hoehe?1:0.5); g.lineWidth=1; g.stroke(); }
  }
}
/* Versailles: Tafeln mit Rahmen und diagonalem Flechtwerk */
function versailles(M,pxm,s,base,o){
  const {g,W,H}=M, S=s*pxm, n=Math.round(W/S), b=S*0.09;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const x=i*S, y=j*S;
    g.save(); g.translate(x,y);
    /* Innenfeld: kleine Quadrate im 45°-Gitter */
    g.save(); g.beginPath(); g.rect(b,b,S-2*b,S-2*b); g.clip();
    g.translate(S/2,S/2); g.rotate(Math.PI/4); const q=(S-2*b)/4;
    for(let a=-4;a<4;a++) for(let c=-4;c<4;c++){ g.save(); g.translate(a*q,c*q); if((a+c)&1){ g.rotate(Math.PI/2); g.translate(0,-q); } brett(M,q,q,ton(base,0.97),{fein:1.6,aeste:0,fladern:false}); g.restore(); }
    /* Flechtbaender */
    const bb=q*0.18;
    for(let a=-4;a<=4;a++){ g.save(); g.translate(-3*q*1.5,a*q-bb/2); brett(M,q*9,bb,ton(base,1.08),{fein:1.4,aeste:0,fladern:false}); g.restore();
      g.save(); g.translate(a*q-bb/2,3*q*1.5); g.rotate(-Math.PI/2); brett(M,q*9,bb,ton(base,1.08),{fein:1.4,aeste:0,fladern:false}); g.restore(); }
    g.restore();
    /* Rahmen: vier Friese */
    brett(M,S,b,ton(base,0.92),o); g.save(); g.translate(0,S-b); brett(M,S,b,ton(base,0.92),o); g.restore();
    g.save(); g.translate(b,b); g.rotate(Math.PI/2); brett(M,S-2*b,b,ton(base,0.9),o); g.restore();
    g.save(); g.translate(S,b); g.rotate(Math.PI/2); brett(M,S-2*b,b,ton(base,0.9),o); g.restore();
    g.restore(); }
}

/* ---------- Stein ---------- */
/* Adern: lange, ruhig geschwungene Linien mit weichem Hof (Marmor).
   ri: Hauptrichtung (Carrara laeuft fast parallel), sonst frei.
   Vorher knickten sie bei jedem Schritt um bis zu 30 Grad und sahen
   aus wie Haare. */
function adern(M,c,n,breite,alpha,laenge,ri,zitter){
  /* breite in Pixeln bei 256 px/m - so bleibt die Ader in jeder
     Aufloesung gleich breit (vorher bei 2048 px nur ein Haar) */
  const {g,W,H,R}=M, fk=M.pxm/256;
  for(let i=0;i<n;i++){ let x=R()*W, y=R()*H, a=ri===undefined?R()*Math.PI*2:ri+M.r(-0.3,0.3); const w0=M.r(0.45,1)*breite*fk, seg=Math.round(M.r(12,18));
    const pts=[[x,y]]; const zt=zitter||0.32; for(let s=0;s<seg;s++){ a+=M.r(-zt,zt); const st=M.r(0.6,1)*laenge/seg; x+=Math.cos(a)*st; y+=Math.sin(a)*st; pts.push([x,y]); }
    /* ein Nebenarm, der sich sanft abspaltet */
    let arm=null; if(R()<0.45){ const k0=1+((R()*(pts.length-2))|0); let bx=pts[k0][0], by=pts[k0][1], ba=a+(R()<0.5?-1:1)*M.r(0.35,0.8); arm=[[bx,by]];
      for(let s=0;s<6;s++){ ba+=M.r(-0.15,0.15); bx+=Math.cos(ba)*laenge/16; by+=Math.sin(ba)*laenge/16; arm.push([bx,by]); } }
    const zug=(P,dx,dy)=>{ g.beginPath(); g.moveTo(P[0][0]+dx,P[0][1]+dy);
      for(let k=1;k<P.length-1;k++){ const mx=(P[k][0]+P[k+1][0])/2, my=(P[k][1]+P[k+1][1])/2; g.quadraticCurveTo(P[k][0]+dx,P[k][1]+dy,mx+dx,my+dy); }
      g.lineTo(P[P.length-1][0]+dx,P[P.length-1][1]+dy); };
    /* nur die Kopien zeichnen, die die Kachel beruehren */
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const [px,py] of arm?pts.concat(arm):pts){ x0=Math.min(x0,px); x1=Math.max(x1,px); y0=Math.min(y0,py); y1=Math.max(y1,py); }
    const rr=w0*3;
    for(const [dx,dy] of [[0,0],[W,0],[-W,0],[0,H],[0,-H],[W,H],[-W,-H],[W,-H],[-W,H]]){
      if(x1+dx<-rr||x0+dx>W+rr||y1+dy<-rr||y0+dy>H+rr) continue;
      g.lineCap='round'; g.lineJoin='round';
      /* weicher Hof aus drei breiten, blassen Strichen, dann der Kern */
      for(const [bw,al] of [[6,0.16],[3.6,0.24],[2,0.34]]){ M.stroke(c,114,alpha*al); g.lineWidth=w0*bw; zug(pts,dx,dy); g.stroke(); if(arm){ g.lineWidth=w0*bw*0.6; zug(arm,dx,dy); g.stroke(); } }
      M.stroke(c,118,alpha*0.8); g.lineWidth=w0*0.55; zug(pts,dx,dy); g.stroke();
      if(arm){ g.lineWidth=w0*0.4; zug(arm,dx,dy); g.stroke(); } } }
}
/* Platten mit Fuge in einem Raster (Fliesen, Stein) */
function platten(M,pxm,pw,ph,versatz,fuge,fugenFarbe,fn){
  const {g,W,H}=M, a=pw*pxm, b=ph*pxm, nx=Math.round(W/a), ny=Math.round(H/b), A=W/nx, B=H/ny, fu=Math.max(1,fuge*pxm);
  for(let j=0;j<ny;j++){ const off=((j*versatz)%1)*A;
    for(let i=-1;i<nx;i++){ const x=i*A+off;
      g.save(); g.beginPath(); g.rect(x,j*B,A,B); g.rect(x+W,j*B,A,B); g.clip();
      const sd=ortSaat(M,x+A/2,j*B+B/2,7);
      for(const dx of [0,W]){ g.save(); g.translate(x+dx,j*B); mitSaat(M,sd,()=>fn(A,B,i,j)); g.restore(); }
      g.restore();
      M.fill(fugenFarbe,70); for(const dx of [0,W]){ g.fillRect(x+dx,j*B,fu,B); g.fillRect(x+dx,j*B,A,fu); } } }
}

/* ---------- Die Böden ---------- */
const BODEN_MALER={
  estrich(M,f){ const c=hx(f.a); M.fill(c,128); M.g.fillRect(0,0,M.W,M.H);
    wolken(M,c,90,M.W*0.05,M.W*0.2,0.05,0.14); koernung(M,[ton(c,0.8),ton(c,1.15)],1900,1,2,0.12);
    /* Kellenbogen */
    if(!M.hoehe) for(let i=0;i<Math.round(4*M.m2);i++){ const x=M.Z()*M.W, y=M.Z()*M.H, r=M.z(0.08,0.3)*M.pxm; M.g.strokeStyle=rgbS(ton(c,M.Z()<0.5?0.9:1.1),0.06); M.g.lineWidth=M.z(0.012,0.035)*M.pxm;
      M.g.beginPath(); M.g.arc(x,y,r,M.z(0,6),M.z(0,6)+M.z(0.6,1.6)); M.g.stroke(); } },
  beton(M,f,pxm){ const c=hx(f.a); M.fill(c,128); M.g.fillRect(0,0,M.W,M.H);
    wolken(M,c,120,M.W*0.03,M.W*0.16,0.06,0.16);
    /* Salz und Pfeffer: angeschliffener feiner Zuschlag */
    koernung(M,[[235,232,226],[60,58,56],[150,140,128],[110,104,98]],3800,0.8,2.6,0.55,134);
    /* Schnittfugen alle zwei Meter */
    M.fill(ton(c,0.55),60,0.6); for(let k=0;k<M.W;k+=2*pxm){ M.g.fillRect(k,0,1.2,M.H); M.g.fillRect(0,k,M.W,1.2); } },
  mikrozement(M,f){ const c=hx(f.a); M.fill(c,128); M.g.fillRect(0,0,M.W,M.H);
    wolken(M,c,160,M.W*0.02,M.W*0.12,0.05,0.13);
    if(!M.hoehe) for(let i=0;i<Math.round(14*M.m2);i++){ const x=M.Z()*M.W, y=M.Z()*M.H, r=M.z(0.06,0.24)*M.pxm; M.g.strokeStyle=rgbS(ton(c,M.Z()<0.5?0.93:1.07),0.08); M.g.lineWidth=M.z(0.015,0.05)*M.pxm;
      M.g.beginPath(); M.g.arc(x,y,r,M.z(0,6),M.z(0,6)+M.z(0.4,1.2)); M.g.stroke(); } },
  dielen(M,f,pxm){ dielen(M,pxm,f.breite||0.2,f.lmin||0.9,f.lmax||2.1,hx(f.a),{aeste:f.aeste,fein:f.fein}); },
  fischgraet(M,f,pxm){ const c=hx(f.a); M.fill(ton(c,0.4),40); M.g.fillRect(0,0,M.W,M.H); fischgraet(M,pxm,0.4714,7,c,{aeste:f.aeste||0.06}); },
  chevron(M,f,pxm){ const c=hx(f.a); M.fill(ton(c,0.4),40); M.g.fillRect(0,0,M.W,M.H); chevron(M,pxm,0.4,0.125,c,{}); },
  versailles(M,f,pxm){ const c=hx(f.a); M.fill(ton(c,0.4),40); M.g.fillRect(0,0,M.W,M.H); versailles(M,pxm,0.8,c,{aeste:0.02}); },
  fliese(M,f,pxm){ const c=hx(f.a);
    platten(M,pxm,4/3,2/3,1/3,0.003,ton(c,0.82),(A,B)=>{ const k=ton(c,M.r(0.95,1.05)); M.fill(k,128); M.g.fillRect(0,0,A,B);
      const sub=ausschnitt(M,A,B); wolken(sub,k,10,A*0.08,A*0.4,0.04,0.1); koernung(sub,[ton(k,0.9),ton(k,1.08)],1000,1,2,0.2); }); },
  schach(M,f,pxm){ const hell=hx(f.a), dunkel=hx(f.b);
    platten(M,pxm,0.5,0.5,0,0.002,[200,198,194],(A,B,i,j)=>{ const d=(i+j)&1, k=d?dunkel:hell; M.fill(k,128); M.g.fillRect(0,0,A,B);
      const sub=ausschnitt(M,A,B); wolken(sub,k,6,A*0.1,A*0.5,0.04,0.1);
      adern(sub,d?[200,196,190]:[160,160,166],d?2:3,d?1.8:1.6,d?0.3:0.28,A*1.3,M.r(0,Math.PI)); }); },
  marmor(M,f,pxm){ const c=hx(f.a);
    platten(M,pxm,1,1,0,0.0015,ton(c,0.9),(A,B)=>{ M.fill(c,128); M.g.fillRect(0,0,A,B);
      const sub=ausschnitt(M,A,B); wolken(sub,c,14,A*0.08,A*0.4,0.03,0.08);
      const ri=M.r(-0.5,0.5)+0.6;
      adern(sub,[146,148,156],5,2.2,0.3,A*1.4,ri); adern(sub,[118,120,128],2,3,0.34,A*1.6,ri); }); },
  travertin(M,f,pxm){ const c=hx(f.a);
    platten(M,pxm,1,0.5,1/3,0.002,ton(c,0.88),(A,B)=>{ const k=ton(c,M.r(0.93,1.06),M.r(-6,6),0,M.r(-6,4)); M.fill(k,128); M.g.fillRect(0,0,A,B);
      /* Schnitt entlang der Ader: feine Baender laengs */
      for(let y=0;y<B;y+=M.z(0.003,0.01)*M.pxm){ M.fill(ton(k,M.z(0.88,1.1)),128+M.z(-6,6),M.z(0.15,0.4)); M.g.fillRect(0,y,A,Math.max(0.5,M.z(0.0015,0.006)*M.pxm)); }
      /* Poren */
      wolken(ausschnitt(M,A,B),k,6,A*0.1,A*0.4,0.05,0.12);
      for(let p=0;p<Math.round(140*A*B/(M.pxm*M.pxm));p++){ M.fill(ton(k,0.7),92,0.5); M.g.beginPath(); M.g.ellipse(M.R()*A,M.R()*B,Math.max(0.6,M.r(0.002,0.012)*M.pxm),Math.max(0.4,M.r(0.0008,0.0025)*M.pxm),0,0,Math.PI*2); M.g.fill(); } }); },
  terrazzo(M,f,pxm){ const c=hx(f.a); M.fill(c,128); M.g.fillRect(0,0,M.W,M.H);
    wolken(M,c,60,M.W*0.02,M.W*0.08,0.03,0.08);
    const K=(f.koerner||['#f4f1ea','#c9c3b8','#8d8a86','#d9a38f','#b7865a','#2f2f33','#7e8f7a']).map(hx);
    /* Venezianer Koernung: viele kleine, einige grosse Steine */
    const gr=f.gross||1;
    for(let i=0;i<Math.round(1870*M.m2/(gr*gr*0.8));i++){ const g0=M.R()<0.08*gr, s=(g0?M.r(0.012,0.028):M.r(0.003,0.011))*gr*pxm, col=K[(M.R()*K.length)|0];
      const x=M.R()*M.W, y=M.R()*M.H, n=5+((M.R()*3)|0), rot=M.R()*6, rr=[]; for(let q=0;q<n;q++) rr.push(s*M.r(0.6,1));
      const tc=ton(col,M.r(0.9,1.08)), th=150+M.r(-10,10);
      umlauf(M.W,M.H,x,y,s,(xx,yy)=>{ M.g.beginPath(); for(let q=0;q<n;q++){ const a=rot+q/n*Math.PI*2, r=rr[q]; q?M.g.lineTo(xx+Math.cos(a)*r,yy+Math.sin(a)*r):M.g.moveTo(xx+Math.cos(a)*r,yy+Math.sin(a)*r); }
        M.g.closePath(); M.fill(tc,th); M.g.fill(); }); }
    /* Messingschienen alle zwei Meter */
    for(let k=0;k<M.W;k+=2*pxm){ M.fill([196,160,86],160); M.g.fillRect(k,0,2.4,M.H); M.g.fillRect(0,k,M.W,2.4);
      if(!M.hoehe){ M.g.fillStyle='rgba(255,236,180,.6)'; M.g.fillRect(k,0,0.8,M.H); M.g.fillRect(0,k,M.W,0.8); } } },
  marmorband(M,f,pxm){ const B=(f.baender||['#ede7dc','#b7a48e','#ede7dc','#3a4a41']).map(hx); let x=0, i=0;
    /* Baender quer zur Laufrichtung, Breiten 12-40 cm, genau auf 4 m */
    const roh=[0.4,0.12,0.3,0.12,0.4,0.2,0.3,0.12,0.4,0.12,0.3,0.2,0.4,0.12,0.4,0.18], sum=roh.reduce((a,b)=>a+b,0);
    /* genau auf die Kachel: vorher 3,4 von 4 m, der Rest zeigte den alten Boden */
    const breiten=roh.map(b=>b/sum*BODEN_KACHEL);
    breiten.forEach((b,k)=>{ const w=b*pxm, c=B[k%4]; M.fill(c,128); M.g.fillRect(x,0,w+1,M.H);
      const sub=ausschnitt(M,w,M.H); M.g.save(); M.g.translate(x,0); M.g.beginPath(); M.g.rect(0,0,w,M.H); M.g.clip();
      wolken(sub,c,8,w*0.2,w*0.8,0.05,0.12); koernung(sub,[ton(c,0.88),ton(c,1.1)],3000,0.8,2,0.3);
      adern(sub,ton(c,c[0]>150?0.72:1.5),2,1.2,0.3,M.H*0.4,Math.PI/2+M.r(-0.2,0.2)); M.g.restore();
      M.fill([60,60,60],70,0.6); M.g.fillRect(x,0,1,M.H); x+=w; }); },
  kautschuk(M,f){ const c=hx(f.a); M.fill(c,128); M.g.fillRect(0,0,M.W,M.H);
    wolken(M,c,50,M.W*0.03,M.W*0.12,0.03,0.07);
    /* Granulat ohne Richtung, wie noraplan stone */
    koernung(M,[[210,208,202],[150,148,144],[96,98,102],[62,64,68]],5200,1.2,3.4,0.8,132);
    koernung(M,[[228,226,220]],900,2,4,0.9,140); },
  velours(M,f){ const c=hx(f.a); M.fill(c,128); M.g.fillRect(0,0,M.W,M.H);
    /* Flor: weiche, grosse Strichflecken - wo er anders liegt, ist er heller */
    wolken(M,c,70,M.W*0.04,M.W*0.14,0.08,0.18,128);
    koernung(M,[ton(c,0.82),ton(c,1.14)],7500,1,1.6,0.3); }
};
/* ---------- Die Wände ---------- */
const WAND_MALER={
  farbe(M,w){ const c=hx(w.a); M.fill(c,128); M.g.fillRect(0,0,M.W,M.H);
    /* Rollenstruktur: kaum sichtbar, bricht aber die Plastikflaeche */
    koernung(M,[ton(c,0.94),ton(c,1.05)],5300,1,2,0.35); wolken(M,c,40,M.W*0.05,M.W*0.2,0.02,0.05); },
  putz(M,w){ const c=hx(w.a); M.fill(c,128); M.g.fillRect(0,0,M.W,M.H);
    wolken(M,c,160,M.W*0.02,M.W*0.12,0.06,0.16);
    if(!M.hoehe) for(let i=0;i<Math.round(28*M.m2);i++){ const x=M.Z()*M.W, y=M.Z()*M.H, r=M.z(0.05,0.23)*M.pxm; M.g.strokeStyle=rgbS(ton(c,M.Z()<0.5?0.94:1.05),0.05); M.g.lineWidth=M.z(0.03,0.08)*M.pxm;
      M.g.beginPath(); M.g.arc(x,y,r,M.z(0,6),M.z(0,6)+M.z(0.3,0.9)); M.g.stroke(); }
    koernung(M,[ton(c,0.85),ton(c,1.1)],3200,1,2,0.25); },
  streifen(M,w,pxm){ const a=hx(w.a), b=hx(w.b), br=2.6/8*pxm; M.fill(a,128); M.g.fillRect(0,0,M.W,M.H);
    for(let x=0;x<M.W;x+=br){ M.fill(b,132); M.g.fillRect(x,0,br*0.42,M.H); M.fill(ton(b,0.9),126,0.8); M.g.fillRect(x+br*0.5,0,br*0.04,M.H); M.g.fillRect(x+br*0.58,0,br*0.04,M.H); }
    koernung(M,[ton(a,0.95),ton(a,1.05)],3200,1,2,0.3); },
  harlekin(M,w,pxm){ const a=hx(w.a), b=hx(w.b), g=hx(w.c||'#c9a24a'), s=2.6/6*pxm, h=s*1.5;
    M.fill(a,128); M.g.fillRect(0,0,M.W,M.H);
    for(let y=-h;y<M.H+h;y+=h/2) for(let x=((Math.round(y/(h/2))&1)?s/2:0)-s;x<M.W+s;x+=s){
      M.g.beginPath(); M.g.moveTo(x,y+h/2); M.g.lineTo(x+s/2,y); M.g.lineTo(x+s,y+h/2); M.g.lineTo(x+s/2,y+h); M.g.closePath();
      /* floor statt round: bei x/s = k+0,5 kippte die Faerbung je nach Rundungsfehler */
      if((Math.floor(x/s+0.25)+Math.round(y/(h/2)))&1){ M.fill(b,130); M.g.fill(); } M.stroke(g,140,0.9); M.g.lineWidth=1.4; M.g.stroke(); }
    koernung(M,[ton(a,0.95),ton(a,1.05)],2700,1,2,0.25); },
  ziegel(M,w,pxm){ const c=hx(w.a), bw=2.6/11*pxm, bh=0.075*pxm, fu=0.011*pxm;
    M.fill(hx('#b9b0a2'),70); M.g.fillRect(0,0,M.W,M.H);
    for(let r=0;r*bh<M.H;r++){ const off=(r&1)*bw/2; for(let x=-bw;x<M.W+bw;x+=bw){ const k=ton(c,M.r(0.72,1.12),M.r(-10,10),M.r(-6,6),0);
      const xx=((x+off)%M.W+M.W)%M.W;
      for(const dx of [0,-M.W]){ M.fill(k,140+M.r(-8,8)); M.g.fillRect(xx+dx+fu/2,r*bh+fu/2,bw-fu,bh-fu);
        if(!M.hoehe){ for(let q=0;q<12;q++){ M.g.fillStyle=rgbS(ton(k,M.z(0.7,1.2)),0.3); M.g.fillRect(xx+dx+fu/2+M.Z()*(bw-fu),r*bh+fu/2+M.Z()*(bh-fu),M.z(1,3),M.z(1,2)); } } } } } },
  rippen(M,w,pxm){ const c=hx(w.a), rib=(w.rib||0.027)*pxm, gap=(w.gap||0.013)*pxm, P=2.6/Math.round(2.6/((w.rib||0.027)+(w.gap||0.013)))*pxm;
    M.fill([22,20,18],40); M.g.fillRect(0,0,M.W,M.H);
    for(let x=0;x<M.W-1;x+=P){ M.g.save(); M.g.translate(x+gap/2+rib,0); M.g.rotate(Math.PI/2);
      brett(M,M.H,rib,c,{fein:1.8,aeste:0.03,fuge:0.6}); M.g.restore();
      if(!M.hoehe){ M.g.fillStyle='rgba(255,240,215,.16)'; M.g.fillRect(x+gap/2,0,rib*0.14,M.H); M.g.fillStyle='rgba(0,0,0,.28)'; M.g.fillRect(x+gap/2+rib*0.84,0,rib*0.16,M.H); } } },
  fliesen(M,w,pxm){ const c=hx(w.a), glanz=w.glanz!==false;
    platten(M,pxm,w.fw||0.1,w.fh||0.1,w.versatz||0,0.002,ton(c,w.fuge||0.85),(A,B)=>{ const st=w.streu?[0.78,1.15]:[0.975,1.02], k=ton(c,M.r(st[0],st[1]),M.r(-4,4)*(w.streu?1.5:0.3),M.r(-3,3)*(w.streu?1.5:0.3),M.r(-4,4)*(w.streu?1.5:0.3));
      /* leicht gewoelbte Glasur: zur Mitte hoeher, am Rand abfallend */
      const gr=M.g.createRadialGradient(A*0.45,B*0.4,0,A*0.5,B*0.5,Math.max(A,B)*0.75);
      gr.addColorStop(0,M.hoehe?rgbS([150,150,150]):rgbS(ton(k,1.03))); gr.addColorStop(1,M.hoehe?rgbS([118,118,118]):rgbS(ton(k,0.95)));
      M.g.fillStyle=gr; M.g.fillRect(0,0,A,B);
      if(w.streu&&!M.hoehe){ wolken(ausschnitt(M,A,B),k,4,A*0.2,A*0.6,0.06,0.16); }
      if(glanz&&!M.hoehe){ const e=Math.max(0.8,A*0.04); M.g.fillStyle='rgba(255,255,255,.28)'; M.g.fillRect(0,0,A,e); M.g.fillRect(0,0,e,B);
        M.g.fillStyle='rgba(0,0,0,.12)'; M.g.fillRect(0,B-e,A,e); M.g.fillRect(A-e,0,e,B); } }); },
  moire(M,w){ const a=hx(w.a), {g,W,H}=M; M.fill(a,128); g.fillRect(0,0,W,H);
    /* Moiré (gewaessertes Seidenpapier): fliessende Konturbaender eines
       ruhigen Feldes, wie Jahresringe - pro Pixel, damit sie auch aus
       der Entfernung als helle und dunkle Wellen stehen bleiben.
       Feinere Linienscharen mittelten sich im Raum zu glattem Rosa. */
    if(!M.hoehe){ let id; try{ id=g.getImageData(0,0,W,H); }catch(e){ return; } const d=id.data, lam=0.055*M.pxm;
      for(let y=0;y<H;y++){ const v=y/H*Math.PI*2;
        for(let x=0;x<W;x++){ const u=x/W*Math.PI*2;
          const F=Math.sin(u*2+v+1.3)*0.9+Math.sin(u-v*2+0.4)*0.7+Math.sin(u*3+v*2+2.2)*0.35+Math.sin(u+v*3+4.1)*0.3;
          const k=1+0.075*Math.sin((y/lam+F*9)*Math.PI*2)*(0.6+0.4*Math.sin(u*2-v+0.7)), i=(y*W+x)*4;
          d[i]=Math.min(255,a[0]*k); d[i+1]=Math.min(255,a[1]*k); d[i+2]=Math.min(255,a[2]*k); } }
      g.putImageData(id,0,0); }
    koernung(M,[ton(a,0.96),ton(a,1.04)],1600,1,2,0.25); },
  blumen(M,w,pxm){ const a=hx(w.a), b=hx(w.b), c=hx(w.c), rp=2.6/4*pxm, g=M.g;
    M.fill(a,128); g.fillRect(0,0,M.W,M.H);
    /* Blatt: spitz, mit Mittelrippe, zwei Gruentoene */
    const blatt=(x,y,an,s,t)=>{ g.save(); g.translate(x,y); g.rotate(an);
      M.fill(ton(b,t),132); g.beginPath(); g.moveTo(0,0); g.bezierCurveTo(s*0.3,-s*0.34,s*0.75,-s*0.26,s,0); g.bezierCurveTo(s*0.75,s*0.24,s*0.3,s*0.3,0,0); g.fill();
      M.stroke(ton(b,t*0.72),124,0.7); g.lineWidth=Math.max(0.6,s*0.035); g.beginPath(); g.moveTo(s*0.05,0); g.quadraticCurveTo(s*0.5,-s*0.04,s*0.92,0); g.stroke(); g.restore(); };
    const bluete=(x,y,r,t)=>{ for(let p=0;p<5;p++){ const an=p/5*Math.PI*2-0.3; M.fill(ton(c,t*(p&1?1:0.9)),142);
        g.beginPath(); g.ellipse(x+Math.cos(an)*r*0.55,y+Math.sin(an)*r*0.55,r*0.62,r*0.42,an,0,Math.PI*2); g.fill(); }
      M.fill(ton(c,0.62),150); g.beginPath(); g.arc(x,y,r*0.26,0,Math.PI*2); g.fill();
      M.fill([236,206,120],152,0.9); for(let q=0;q<6;q++){ const an=q/6*Math.PI*2; g.beginPath(); g.arc(x+Math.cos(an)*r*0.16,y+Math.sin(an)*r*0.16,r*0.05,0,Math.PI*2); g.fill(); } };
    /* ein Zweig: geschwungener Stiel, Blaetter beidseits, Bluete am Ende */
    const zweig=(sk)=>{ const P=[[-0.46,0.44],[-0.2,0.2],[0.05,0.1],[0.22,-0.18],[0.42,-0.4]].map(([x,y])=>[x*rp*sk,y*rp*sk]);
      M.stroke(ton(b,0.8),126,0.95); g.lineWidth=rp*0.014*sk; g.lineCap='round';
      g.beginPath(); g.moveTo(P[0][0],P[0][1]); g.bezierCurveTo(P[1][0],P[1][1],P[2][0],P[2][1],P[3][0],P[3][1]); g.quadraticCurveTo(P[4][0]*0.9,P[4][1]*1.05,P[4][0],P[4][1]); g.stroke();
      for(let k=0;k<9;k++){ const t=(k+0.5)/9, x=P[0][0]+(P[4][0]-P[0][0])*t+Math.sin(t*3.1)*rp*0.05*sk, y=P[0][1]+(P[4][1]-P[0][1])*t, s=rp*sk*(0.2-0.07*t);
        blatt(x,y,(k&1?-1:1)*1.05-0.75+Math.sin(k*1.7)*0.2,s,k&1?1.06:0.94); }
      bluete(P[4][0],P[4][1],rp*0.075*sk,1); bluete(P[1][0]+rp*0.12*sk,P[1][1]-rp*0.02*sk,rp*0.045*sk,0.92); };
    for(let y=-rp;y<M.H+rp;y+=rp) for(let x=0;x<M.W;x+=rp){ const ox=x+((Math.round(y/rp)&1)?rp/2:0);
      const sp=(Math.round(y/rp)&1)?-1:1;
      umlauf(M.W,M.H,ox+rp/2,y+rp/2,rp*0.7,(X,Y)=>{ g.save(); g.translate(X,Y); g.scale(sp,1); zweig(1); g.restore(); });
      /* Gegenzweig, gedreht und kleiner, fuellt die Luecke */
      umlauf(M.W,M.H,ox,y,rp*0.5,(X,Y)=>{ g.save(); g.translate(X,Y); g.scale(sp,1); g.rotate(Math.PI*0.9); zweig(0.62); g.restore(); }); }
    koernung(M,[ton(a,0.94),ton(a,1.04)],2100,1,2,0.3); },
  artdeco(M,w,pxm){ const a=hx(w.a), g1=hx(w.b), s=2.6/8*pxm, h=s*0.5;
    M.fill(a,120); M.g.fillRect(0,0,M.W,M.H);
    /* Faecher/Schuppen in feinen Goldlinien */
    for(let r=-1;r*h<M.H+s;r++) for(let x=-s;x<M.W+s;x+=s){ const cx=x+((r&1)?s/2:0), cy=r*h;
      for(let k=1;k<=5;k++){ M.stroke(ton(g1,k===5?1:0.85),150,k===5?0.95:0.55); M.g.lineWidth=k===5?1.8:0.9;
        M.g.beginPath(); M.g.arc(cx,cy+s*0.5,s*0.5*k/5,Math.PI,0); M.g.stroke(); }
      M.stroke(g1,150,0.5); M.g.lineWidth=0.8; for(let q=-3;q<=3;q++){ M.g.beginPath(); M.g.moveTo(cx,cy+s*0.5); M.g.lineTo(cx+Math.sin(q*0.4)*s*0.5,cy+s*0.5-Math.cos(q*0.4)*s*0.5); M.g.stroke(); } } },
  damast(M,w,pxm){ const a=hx(w.a), m=ton(a,1.13), g=M.g, rp=2.6/4*pxm, h=rp*0.92;
    M.fill(a,120); g.fillRect(0,0,M.W,M.H);
    koernung(M,[ton(a,0.93),ton(a,1.05)],3200,1,2,0.35);
    /* Umriss aus Buckeln: Spitze, Knospe, Taille, grosser Bauch, Fuss */
    const bu=(t,c0,s0)=>Math.exp(-((t-c0)/s0)*((t-c0)/s0));
    const breite=t=>rp*(0.035*bu(t,0.04,0.05)+0.13*bu(t,0.2,0.08)+0.05*bu(t,0.34,0.05)+0.27*bu(t,0.6,0.15)+0.07*bu(t,0.86,0.06)+0.006);
    const medaillon=()=>{ M.fill(m,146,0.9); g.beginPath();
        for(let i=0;i<=60;i++){ const t=i/60; g.lineTo(breite(t),(t-0.5)*h); }
        for(let i=60;i>=0;i--){ const t=i/60; g.lineTo(-breite(t),(t-0.5)*h); } g.closePath(); g.fill();
      /* Aussparungen: Blattformen im Grundton, gespiegelt */
      M.fill(a,122); for(const sx of [1,-1]){
        g.beginPath(); g.ellipse(sx*rp*0.1,h*0.1,rp*0.035,rp*0.12,sx*0.5,0,Math.PI*2); g.fill();
        g.beginPath(); g.ellipse(sx*rp*0.16,h*0.3,rp*0.03,rp*0.08,-sx*0.7,0,Math.PI*2); g.fill();
        g.beginPath(); g.ellipse(sx*rp*0.045,-h*0.3,rp*0.02,rp*0.05,sx*0.3,0,Math.PI*2); g.fill(); }
      g.beginPath(); g.ellipse(0,h*0.14,rp*0.022,rp*0.1,0,0,Math.PI*2); g.fill();
      /* Voluten links und rechts am Bauch */
      M.stroke(m,146,0.85); g.lineWidth=Math.max(1,rp*0.012);
      for(const sx of [1,-1]){ g.beginPath(); for(let q=0;q<=40;q++){ const an=q/40*Math.PI*3.2, r=rp*0.07*(1-q/48);
          const x=sx*(rp*0.34+Math.cos(an)*r), y=h*0.08+Math.sin(an)*r; q?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); } };
    const rosette=()=>{ M.fill(m,140,0.8); for(let p=0;p<4;p++){ g.save(); g.rotate(p*Math.PI/2); g.beginPath(); g.ellipse(0,-rp*0.05,rp*0.018,rp*0.05,0,0,Math.PI*2); g.fill(); g.restore(); }
      g.beginPath(); g.arc(0,0,rp*0.018,0,Math.PI*2); g.fill(); };
    const dy=rp*1.05;
    for(let y=-dy;y<M.H+dy;y+=dy) for(let x=0;x<M.W;x+=rp){ const ox=x+((Math.round(y/dy)&1)?rp/2:0);
      umlauf(M.W,M.H,ox,y,rp*0.6,(X,Y)=>{ g.save(); g.translate(X,Y); medaillon(); g.restore(); });
      umlauf(M.W,M.H,ox+rp/2,y,rp*0.1,(X,Y)=>{ g.save(); g.translate(X,Y); rosette(); g.restore(); }); } },
  samt(M,w,pxm){ const a=hx(w.a), P=2.6/Math.round(2.6/0.16)*pxm;
    /* gewellter Samt: in den Falten dunkel, auf den Kaemmen hell */
    for(let x=0;x<M.W;x+=1){ const t=Math.sin(x/P*Math.PI*2), f=0.72+0.36*(t*0.5+0.5), hv=128+t*40;
      M.fill(ton(a,f),hv); M.g.fillRect(x,0,1.2,M.H); }
    koernung(M,[ton(a,0.8),ton(a,1.2)],6400,1,1.5,0.25); },
  marmorwand(M,w,pxm){ const c=hx(w.a);
    platten(M,pxm,1.3,1.2,0,0.0015,ton(c,0.9),(A,B)=>{ M.fill(c,128); M.g.fillRect(0,0,A,B);
      const sub=ausschnitt(M,A,B); wolken(sub,c,14,A*0.08,A*0.4,0.03,0.08);
      /* Calacatta: wenige, kraeftige Adern in Grau und Gold, weit auseinander */
      const ri=M.r(0.7,1.2);
      adern(sub,[128,126,132],2,6,0.36,A*1.7,ri,0.12); adern(sub,[172,142,94],1,4,0.42,A*1.5,ri,0.12); }); },
  gras(M,w,pxm){ const a=hx(w.a), bahn=2.6/3*pxm;
    for(let b=0;b<3;b++){ const k=ton(a,M.r(0.93,1.07),M.r(-4,4),0,M.r(-4,4)); M.fill(k,128); M.g.fillRect(b*bahn,0,bahn,M.H);
      /* waagrechte Fasern */
      for(let y=0;y<M.H;y+=M.z(0.0025,0.0075)*M.pxm){ M.fill(ton(k,M.z(0.8,1.18)),128+M.z(-14,14),M.z(0.25,0.6)); M.g.fillRect(b*bahn+M.z(-4,0),y,bahn*M.z(0.2,1)+4,Math.max(0.6,M.z(0.002,0.005)*M.pxm)); }
      M.fill(ton(k,0.7),100,0.7); M.g.fillRect(b*bahn,0,1.2,M.H); } }
};

/* ---------- Leinwände, Relief, Glanz ---------- */
const BODEN_KACHEL=4;                 /* Meter je Bodenkachel */
const WAND_B=2.6, WAND_H=3.6;         /* Meter je Wandkachel (Hoehe = Raumhoehe) */
function bodenPx(){ return HIQ?2048:1024; }
function wandPx(){ return HIQ?[1024,1418]:[512,709]; }
function bodenMalen(g,W,H,f,hoehe){
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H); g.fillStyle='#808080'; g.fillRect(0,0,W,H);
  const pxm=W/BODEN_KACHEL, M=malKontext(g,W,H,hoehe,f.saat||(f.id.length*977+f.id.charCodeAt(0)*31),pxm);
  (BODEN_MALER[f.art]||BODEN_MALER.estrich)(M,f,pxm);
}
function wandMalen(g,W,H,w,hoehe){
  g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H); g.fillStyle='#808080'; g.fillRect(0,0,W,H);
  const pxm=W/WAND_B, M=malKontext(g,W,H,hoehe,w.saat||(w.id.length*733+w.id.charCodeAt(0)*17),pxm);
  (WAND_MALER[w.art]||WAND_MALER.farbe)(M,w,pxm);
}
/* Relief: Hoehenzeichnung aus demselben Maler, halbe Aufloesung,
   Sobel aus 05i (normalMapFrom) */
function reliefAus(w,h,zeichnen,staerke){
  const t=normalMapFrom(w,h,zeichnen,staerke); if(t){ t.anisotropy=8; t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t;
}
/* Innenraum zum Spiegeln: helle Decke mit Leuchtenreihen, Waende im
   Wandton, dunkler Boden. Ohne sie spiegeln Marmor und Beton nichts. */
let _innenEnv=null, _innenTon='';
function innenUmgebung(wand){
  const key=wand||'';
  if(_innenEnv!==null&&_innenTon===key) return _innenEnv||null;
  try{
    if(!THREE.PMREMGenerator||typeof renderer==='undefined') return null;
    const c=wand?hx(wand):[220,214,204];
    const t=tex(512,256,(g,W,H)=>{
      const gr=g.createLinearGradient(0,0,0,H);
      gr.addColorStop(0,'#aeaba5'); gr.addColorStop(0.36,'#9d9a94'); gr.addColorStop(0.42,rgbS(ton(c,0.72)));
      gr.addColorStop(0.5,rgbS(ton(c,0.55))); gr.addColorStop(0.53,'#34312d'); gr.addColorStop(1,'#1a1815');
      g.fillStyle=gr; g.fillRect(0,0,W,H);
      /* Leuchten an der Decke */
      g.fillStyle='rgba(255,252,240,.95)'; for(let r=0;r<3;r++) for(let x=0;x<W;x+=W/12) g.fillRect(x+(r&1)*W/24,H*(0.06+r*0.1),W/34,H*0.018);
      /* Regale und Schaufenster am Horizont */
      for(let x=0;x<W;){ const w=10+(x*7%23), h=H*(0.04+(x*13%9)/100); g.fillStyle=`rgba(40,38,34,${0.25+(x%5)/20})`; g.fillRect(x,H*0.5-h,w,h); x+=w+6; }
    });
    t.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(renderer);
    if(_innenEnv) _innenEnv.dispose();
    _innenEnv=pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose(); _innenTon=key;
  }catch(e){ _innenEnv=false; _innenTon=key; }
  return _innenEnv||null;
}
let _bodenRelief=null, _wandRelief=null;
/* Neu streichen und neu verlegen */
function oberflaechenAnwenden(){
  const w=wallSet(), f=floorSet();
  if(wallTex){ redraw(wallTex,(g,W,H)=>wandMalen(g,W,H,w,false)); wallTex.anisotropy=8; }
  if(floorTexRef){ redraw(floorTexRef,(g,W,H)=>bodenMalen(g,W,H,f,false)); floorTexRef.anisotropy=8; }
  if(shopWall){
    const [pw,ph]=wandPx(), n=reliefAus(pw>>1,ph>>1,(g,W,H)=>wandMalen(g,W,H,w,true),w.relief||2.2);
    if(_wandRelief) _wandRelief.dispose(); _wandRelief=n;
    if(n){ n.wrapT=THREE.ClampToEdgeWrapping; shopWall.normalMap=n; shopWall.normalScale=new THREE.Vector2(0.7,0.7); }
    shopWall.roughness=w.rau!==undefined?w.rau:0.9; shopWall.metalness=w.metall||0;
    const env=w.glanz?innenUmgebung(w.a):null;
    shopWall.envMap=env; shopWall.envMapIntensity=(w.glanz||0)*0.6; shopWall.needsUpdate=true; }
  if(floorMat){
    const P0=bodenPx(), n=reliefAus(P0>>1,P0>>1,(g,W,H)=>bodenMalen(g,W,H,f,true),f.relief||2.4);
    if(_bodenRelief) _bodenRelief.dispose(); _bodenRelief=n;
    if(n){ floorMat.normalMap=n; floorMat.normalScale=new THREE.Vector2(0.6,0.6); }
    floorMat.roughness=f.rau!==undefined?f.rau:0.6; floorMat.metalness=0;
    /* Die Deckenleuchten heben helle Boeden bis an Weiss (Marmor: Textur
       213, im Bild 235 von 255) - dann verschwindet die Zeichnung. Die
       Albedo daempfen, je heller der Belag, desto mehr. */
    const hl=f.hell||0.86; floorMat.color.setRGB(hl,hl,hl);
    const env=f.glanz?innenUmgebung(w.a):null;
    floorMat.envMap=env; floorMat.envMapIntensity=(f.glanz||0)*0.6; floorMat.needsUpdate=true; }
  /* Sockelleiste im dunklen Ton der Wand */
  if(typeof sockelM==='function'){ const c=hx(w.sockel||w.a), s=w.sockel?c:ton(c,0.7); sockelM().color.setRGB(s[0]/255,s[1]/255,s[2]/255).convertSRGBToLinear(); }
}
/* Musterkarte fuer den Laptop: das echte Material im Kleinen */
const _musterCache={};
function oberflaechenMuster(kind,o,nurCache){
  const key=kind+':'+o.id; if(_musterCache[key]||nurCache) return _musterCache[key]||null;
  const c=document.createElement('canvas'); c.width=160; c.height=120; const g=c.getContext('2d');
  /* ein Ausschnitt in echtem Massstab: Boden 1,3 m, Wand 1,2 m breit */
  const s=kind==='wall'?160/1.2*WAND_B:160/1.3*BODEN_KACHEL, big=document.createElement('canvas');
  big.width=Math.round(s); big.height=Math.round(kind==='wall'?s*WAND_H/WAND_B:s); const bg=big.getContext('2d');
  if(kind==='wall') wandMalen(bg,big.width,big.height,o,false); else bodenMalen(bg,big.width,big.height,o,false);
  g.drawImage(big,0,kind==='wall'?Math.round(big.height*0.3):0,160,120,0,0,160,120);
  return _musterCache[key]=c.toDataURL('image/jpeg',0.85);
}

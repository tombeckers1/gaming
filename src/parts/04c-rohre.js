/* =========================================================
   Batterien: Rohre, ausgepackte Batterie, Verpackung
   (Tom, 01.10.): Im Regal steht die Batterie in ihrer Verpackung.
   Auf dem Zuendtisch steht sie ausgepackt - man sieht die Rohre, und
   es gibt genau so viele Rohre wie Schuss. Aus jedem Rohr kommt genau
   ein Schuss (bzw. ein Effekt); kein Rohr feuert zweimal.
   ========================================================= */

/* Wie viele Rohre braucht die Batterie? Genau so viele wie Schuss
   (01.10. abends, Tom: "Anzahl entspricht exakt der Schusszahl auf der
   Verpackung"). Gezaehlt wie playShow sie abfeuert. Boden-Effekte
   (Feuertopf-Fontaenen, Vulkan ...) kommen nicht aus den Schussrohren,
   sondern aus eigenen Fontaenen-Modulen vorn an der Batterie - so wie
   echte Verbunde ihre Bodenfontaenen angeklebt haben. */
const _rohrBedarf={};
function rohrBedarf(t){
  if(_rohrBedarf[t]) return _rohrBedarf[t];
  let s=0, b=0;
  if(typeof SHOWS!=='undefined'&&SHOWS[t]){
    const phases=showNorm(SHOWS[t]()), plaene=phases.map(phPlan);
    phases.forEach((ph0,pi)=>{ const ph=phNorm(ph0), pl=plaene[pi]; s+=pl.schuesse.length;
      if(ph.ground) b++;
      const bo=ph.boden?(Array.isArray(ph.boden)?ph.boden:[ph.boden]):[];
      b+=bo.filter(x=>!x.je).length;
      b+=bo.filter(x=>x.je).length*pl.schuesse.filter(x=>x.q===0).length; });
  }
  else if(P[t]&&P[t].rezept&&typeof traegerVon==='function'){ const tr=traegerVon(P[t].rezept.traeger); if(tr.shape==='battery') s=tr.schuss; }
  const r={schuss:s,boden:b,n:s}; if(typeof SHOWS!=='undefined') _rohrBedarf[t]=r; return r;
}
function istBatterie(t){ const sh=P[t]&&P[t].shape; return (sh==='battery'||sh==='fan')&&rohrBedarf(t).schuss>0; }

/* Rohrbild: genau ein Rohr je Schuss in einem Raster, das die
   Grundflaeche fuellt. p.raster [Spalten, Reihen] gibt es fest vor
   (5x5, 7x7, 10x10). Ab 80 Schuss besteht die Batterie aus mehreren
   Bloecken (Verbund) mit einer Fuge dazwischen. Koordinaten im Produkt
   (x Breite, z Tiefe); row 0 ist die vordere Reihe. */
const _rohrLayout={};
function rohrLayout(t){
  if(_rohrLayout[t]) return _rohrLayout[t];
  const p=P[t], N=rohrBedarf(t).schuss; if(!N) return null;
  const w=p.dims[0], d=p.dims[2], m=Math.min(0.014,w*0.04), fan=p.shape==='fan';
  const B=fan||p.raster?1:N>=150&&w>=0.6?3:N>=80&&w>=0.45?2:1, fuge=B>1?0.014:0;
  const iw=w-2*m-(B-1)*fuge, id=d-2*m;
  let cols, rows;
  if(p.raster&&p.raster[0]*p.raster[1]===N){ cols=p.raster[0]; rows=p.raster[1]; }
  else {
    /* Spalten je Block gleich: Gesamtspalten ein Vielfaches von B */
    cols=Math.max(B,Math.round(Math.sqrt(N*iw/id)/B)*B); rows=Math.ceil(N/cols);
    while(cols*rows<N) cols+=B;
    while(cols>B&&(cols-B)*rows>=N) cols-=B;
    rows=Math.ceil(N/cols);
  }
  const cpb=cols/B, cw=iw/cols, ch=id/rows, r=Math.min(cw,ch)*0.45;
  const bloecke=[], rohre=[];
  const bw=iw/B;
  for(let k=0;k<B;k++) bloecke.push({x0:k?-w/2+m+k*(bw+fuge)-fuge/2:-w/2, x1:k<B-1?-w/2+m+(k+1)*bw+k*fuge+fuge/2:w/2});
  /* letzte (hinterste) Reihe evtl. kuerzer, mittig */
  let rest=N;
  for(let rI=0;rI<rows;rI++){
    const inReihe=Math.min(cols,rest); rest-=inReihe;
    const start=Math.floor((cols-inReihe)/2);
    for(let c=start;c<start+inReihe;c++){
      const blk=Math.floor(c/cpb);
      const x=-w/2+m+blk*fuge+(c+0.5)*cw, z=d/2-m-(rI+0.5)*ch;
      rohre.push({x,z,r,blk,row:rI,col:c});
    }
  }
  /* Zuendfolge: die Zuendschnur laeuft fest durch die Rohre - Block fuer
     Block, darin Reihe fuer Reihe in Schlangenlinie (vorn links nach
     rechts, naechste Reihe zurueck ...) wie bei echten Batterien */
  const folge=rohre.map((x,i)=>i).sort((a,b)=>{ const A=rohre[a], Bb=rohre[b];
    if(A.blk!==Bb.blk) return A.blk-Bb.blk; if(A.row!==Bb.row) return A.row-Bb.row;
    return A.row%2?Bb.col-A.col:A.col-Bb.col; });
  /* Fontaenen-Module fuer die Boden-Effekte: eine Leiste vorn vor der
     Batterie, so viele wie Boden-Effekte */
  const nb=rohrBedarf(t).boden, module=[];
  if(nb){ const rm=Math.min(0.022,w/(2*nb)*0.42), hm=Math.min(0.12,p.dims[1]*0.45);
    for(let i=0;i<nb;i++) module.push({x:-w/2+w*(i+0.5)/nb,z:d/2+rm+0.004,r:rm,h:hm}); }
  return (_rohrLayout[t]={rohre,bloecke,cols,rows,B,r,N,m,folge,module});
}

/* Gleichverteilter Zufall mit fester Saat: eine Batterie feuert jedes
   Mal gleich - dieselben Rohrwinkel, dieselbe Folge (wie das echte
   Produkt). */
function saatZahl(s){ let h=2166136261; for(let i=0;i<s.length;i++) h=Math.imul(h^s.charCodeAt(i),16777619); return h>>>0; }
function saatZufall(seed){ let a=seed||1; return ()=>{ a=a+0x6D2B79F5|0; let x=Math.imul(a^a>>>15,1|a); x=x+Math.imul(x^x>>>7,61|x)^x; return ((x^x>>>14)>>>0)/4294967296; }; }
function rohrSaat(seed,fn){ const alt=Math.random; Math.random=saatZufall(seed); try{ return fn(); } finally { Math.random=alt; } }

/* Abstand zweier Schuesse aus dem Rohr (Tom, 01.10.: "0,2 bis 0,4
   Sekunden"): aus dem Abstand im Drehbuch wird 0,2 s (Salve, Takt 0)
   bis 0,4 s (ab 0,6 s Pause). Das Tempo des Drehbuchs bleibt als
   schnell/langsam erhalten, jeder Schuss hat seinen eigenen Takt. */
const ZUEND_MIN=0.2, ZUEND_MAX=0.4;
function zuendAbstand(d){ return ZUEND_MIN+(ZUEND_MAX-ZUEND_MIN)*clamp(d/0.6,0,1); }
/* Zeitachse der Zuendfolge: alte Schusszeiten -> neue (0,2-0,4 s Takt) */
function zeitAchse(zeiten){ const alt=zeiten.slice().sort((a,b)=>a-b), neu=[]; let T=alt.length?alt[0]:0;
  alt.forEach((t,i)=>{ if(i) T+=zuendAbstand(t-alt[i-1]); neu.push(T); });
  const map=t=>{ if(!alt.length||t<=alt[0]) return t;
    for(let i=1;i<alt.length;i++) if(t<=alt[i]){ const u=alt[i]-alt[i-1]; return neu[i-1]+(u>0?(t-alt[i-1])/u:1)*(neu[i]-neu[i-1]); }
    return neu[neu.length-1]+Math.min(t-alt[alt.length-1],2.5); };
  return {map,start:neu.length?neu[0]:0,ende:neu.length?neu[neu.length-1]:0}; }
/* Zuendfolge einer Batterie aus den geplanten Ereignissen von playShow:
   Schuss i (nach Zeit) kommt aus Rohr folge[i], neue Zeiten im Takt
   0,2-0,4 s. Boden-Ereignisse rutschen mit (Zeitachse stueckweise). */
function zuendFolge(EV,prod,dauerAlt){
  const L=rohrLayout(prod), F=L.folge;
  const S=EV.filter(e=>e.art==='s'); S.forEach((e,i)=>e.nr=i); S.sort((a,b)=>a.tt-b.tt||a.nr-b.nr);
  const alt=S.map(e=>e.tt), neu=[]; let T=alt.length?alt[0]:0;
  S.forEach((e,i)=>{ if(i) T+=zuendAbstand(alt[i]-alt[i-1]); e.tt=T; neu.push(T); e.k=F[i%F.length]; e.zw=i; });
  const map=t=>{ if(!alt.length||t<=alt[0]) return t;
    for(let i=1;i<alt.length;i++) if(t<=alt[i]){ const u=alt[i]-alt[i-1]; return neu[i-1]+(u>0?(t-alt[i-1])/u:1)*(neu[i]-neu[i-1]); }
    return neu[neu.length-1]+Math.min(t-alt[alt.length-1],2.5); };
  EV.forEach(e=>{ if(e.art!=='s') e.tt=map(e.tt); });
  const letzter=neu.length?neu[neu.length-1]:0;
  return {S,letzter,dauer:Math.max(letzter+0.6,map(dauerAlt||0)),ueber:Math.max(0,S.length-F.length),map};
}
/* Der Plan einer Batterie (ohne etwas zu zuenden): je Rohr die Richtung
   (Welt, Einheitsvektor), je Schuss Zeit und Rohr. playShow rechnet mit
   derselben Saat genauso - das Modell auf dem Tisch zeigt die Rohre in
   genau dem Winkel, in dem sie gleich schiessen. */
const _zplan={};
function zuendPlan(t){
  if(_zplan[t]) return _zplan[t];
  const p=P[t], L=rohrLayout(t); if(!L) return null;
  let Z;
  if(SHOWS[t]){ const o={x:0,y:0,z:0,ab:0.005,jit:0.002,hx:p.dims[0]/2,hz:p.dims[2]/2,ry:Math.PI};
    Z=playShow(o,SHOWS[t](),t,1,{plan:true}); }
  else { /* eigene Rezeptur: gleichmaessig im Takt 0,32 s, leicht schraeg */
    const EV=[]; rohrSaat(saatZahl(t),()=>{ for(let i=0;i<L.N;i++){ const a=rand(-0.08,0.08), dr=rand(0,Math.PI*2); EV.push({art:'s',tt:0.32*i,ang:a,dir:dr}); } });
    Z=zuendFolge(EV,t,0.32*L.N); }
  /* Neigung der Rohre (01.10. abends, Tom: "sieht nicht gut aus" - die
     Rohre standen im Winkel ihres Drehbuch-Schusses kreuz und quer und
     steckten ineinander). Jetzt wie bei echten Batterien: die Rohre
     stehen geordnet, Spalte fuer Spalte gleichmaessig nach aussen
     geneigt, nur quer zur Batterie. Wie weit, sagt das Drehbuch (die
     weitesten Schuesse quer), begrenzt: Batterie 0,1-0,3 rad, Faecher
     0,3-0,6 rad. Jeder Schuss fliegt in Richtung seines Rohrs. */
  const quer=[]; for(const e of Z.S){ if(e.rv) continue; const a=e.ang||0, dr=e.dir===undefined?FANDIR:e.dir; quer.push(Math.abs(Math.atan2(Math.sin(dr)*Math.sin(a),Math.cos(a)))); }
  quer.sort((a,b)=>a-b); const q9=quer.length?quer[Math.floor(quer.length*0.9)]:0.1, fan=p.shape==='fan';
  const neig=fan?clamp(q9,0.3,0.6):clamp(q9,0.1,0.3);
  return (_zplan[t]={S:Z.S,neig,letzter:Z.letzter,dauer:Z.dauer,ueber:Z.ueber});
}
/* Neigung von Rohr k (rad, um die Tiefenachse, + = nach lokal +x) */
function rohrNeigung(t,k){ const L=rohrLayout(t), r=L.rohre[k], h=(L.cols-1)/2; return h>0?(r.col-h)/h*zuendPlan(t).neig:0; }
/* Muendung von Rohr k im Produkt (lokal, y ab Tischplatte) */
function rohrHoehe(t){ const p=P[t], h=p.dims[1], fan=p.shape==='fan'; return {bh:fan?h*0.72:h*0.94,lp:fan?h*0.26:Math.max(0.012,h*0.06)}; }
function rohrMund(t,k){ const L=rohrLayout(t), r=L.rohre[k], H=rohrHoehe(t), n=rohrNeigung(t,k), u=[Math.sin(n),Math.cos(n),0];
  return {x:r.x+u[0]*H.lp,y:H.bh+u[1]*H.lp,z:r.z+u[2]*H.lp,u}; }

/* Rohrsatz beim Zuenden: Rohr k nach Plan, Fontaenen-Module fuer die
   Boden-Effekte (das freie, das dem Wunschort am naechsten liegt).
   Jedes Rohr genau einmal - feuert eins zweimal, faellt es in ROHR_LOG
   als doppelt auf. feuer(k): Muendungsblitz, Rauchwoelkchen, das Rohr
   verkohlt am Modell (o.batt). */
let ROHR_LOG=null;
function rohrSatz(o,prod){
  if(!o||!istBatterie(prod)) return null;
  const L=rohrLayout(prod); if(!L) return null;
  const ry=o.ry!==undefined?o.ry:Math.PI, c=Math.cos(ry), s=Math.sin(ry), h=P[prod].dims[1];
  const welt=(x,y,z)=>V(o.x+x*c+z*s,o.y-h+y,o.z-x*s+z*c);
  const mfrei=L.module.map((m,i)=>({i,off:m.x*c+m.z*s}));
  const rs={benutzt:0,ueber:0,gefeuert:new Set(),
    ort(k){
      if(k===undefined||k<0||k>=L.rohre.length){ rs.ueber++; if(ROHR_LOG) ROHR_LOG.push({prod,i:-1}); return versetzt(o,0); }
      const m=rohrMund(prod,k), q=welt(m.x,m.y,m.z); q.jit=0.002; q.ab=0.004; q.rohr=k; rs.benutzt++;
      if(ROHR_LOG){ const r=L.rohre[k], b=welt(r.x,0,r.z); ROHR_LOG.push({prod,i:k,x:q.x,z:q.z,y:q.y,bx:b.x,bz:b.z,t:typeof FW_UHR!=='undefined'?FW_UHR:0}); }
      return q; },
    modul(wunsch){
      if(!mfrei.length){ if(ROHR_LOG) ROHR_LOG.push({prod,modul:-1}); return versetzt(o,wunsch||0); }
      let bi=0, bd=1e9; for(let k=0;k<mfrei.length;k++){ const dd=Math.abs(mfrei[k].off-(wunsch||0)); if(dd<bd){ bd=dd; bi=k; } }
      const f=mfrei.splice(bi,1)[0], M=L.module[f.i], q=welt(M.x,M.h,M.z); q.jit=0.004; q.ab=0.01; q.modul=f.i;
      if(o.batt) o.batt.modul(f.i);
      if(ROHR_LOG) ROHR_LOG.push({prod,modul:f.i});
      return q; },
    /* Richtung, in der Rohr k schiesst (Welt), mit ROHR_STREU Streuung */
    richtung(k){ const n=rohrNeigung(prod,k), ux=Math.sin(n), uy=Math.cos(n);
      const r=(typeof ROHR_STREU!=='undefined'?ROHR_STREU:0.05)*Math.sqrt(Math.random()), az=Math.random()*Math.PI*2;
      const vx=ux*c+Math.sin(az)*r, vz=-ux*s+Math.cos(az)*r;
      return {ang:Math.atan2(Math.hypot(vx,vz),uy),dir:Math.atan2(vx,vz)}; },
    feuer(k,os){
      rs.gefeuert.add(k);
      muendungsblitz(os,os.y,0.7);
      rohrRauch(os.x,os.y,os.z,0.8,2.2);
      if(o.batt) o.batt.feuer(k); },
    /* nach dem letzten Schuss raucht die Batterie noch ein paar Sekunden */
    nachrauch(dauer){ const q=QUAL(), n=Math.round(dauer/0.3);
      for(let i=0;i<n;i++) later(i*0.3,()=>{ const k=Math.floor(Math.random()*L.rohre.length), m=rohrMund(prod,k), p0=welt(m.x,m.y,m.z), a=1-i/n;
        rohrRauch(p0.x,p0.y,p0.z,0.55+0.6*a,2.6);
        for(let j=0;j<Math.round(3*q*a);j++) psSmall.emit(p0.x,p0.y,p0.z,rand(-.1,.1),rand(0.2,0.6),rand(-.1,.1),0.32,0.32,0.34,rand(1.2,2),-0.2,0); }); }};
  return rs;
}
/* Rauchwoelkchen ueber einer Muendung: grau, waechst und steigt, weht
   etwas zur Seite. Niedrige Grafikstufe: ein Ballen statt zwei. */
function rohrRauch(x,y,z,s,dauer){
  if(typeof wolke!=='function'||typeof wolkenSprite!=='function') return;
  /* niedrige Grafikstufe: nur jedes zweite Woelkchen, ein Ballen statt zwei */
  const q=QUAL(); if(q<0.6&&Math.random()<0.5) return;
  const sp=[wolkenSprite(false)]; if(q>0.7) sp.push(wolkenSprite(false));
  const wx=rand(0.05,0.22), wz=rand(-0.1,0.1);
  wolke(dauer,sp,(w,t)=>{ const u=t/dauer;
    sp.forEach((p,i)=>{ const r=(0.1+0.55*s*(1-Math.exp(-t*1.8)))*(1+i*0.35), a=(t<0.06?t/0.06:1)*(1-u)*(1-u)*0.34*s;
      wSetz(p,x+wx*t+i*0.04,y+0.06+t*(0.32+i*0.08),z+wz*t,r,[0.36,0.36,0.38],a); }); });
}

/* ---------------- ausgepackte Batterie (Zuendtisch) ---------------- */
function kraftTop(g,W,H){ g.fillStyle='#b8925f'; g.fillRect(0,0,W,H);
  for(let i=0;i<600;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'90,60,30':'230,200,150'},${0.05+Math.random()*0.08})`; g.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*3,1); } }
/* Koerper der ausgepackten Batterie: bedruckte Bloecke, Kartonkante,
   Sockel, Zuendschnur, Warnetikett - ohne Rohre */
function buildKorpus(t){
  const p=P[t], a=p.art, w=p.dims[0], d=p.dims[2], L=rohrLayout(t), parts=[], vc=[];
  const bh=rohrHoehe(t).bh;
  L.bloecke.forEach((b,k)=>{ const bw=b.x1-b.x0-(L.B>1?0.006:0), cx=(b.x0+b.x1)/2;
    /* Verbund: jede Batterie traegt ihr Stueck des durchgehenden
       Frontbilds - nebeneinander ergeben sie das ganze Motiv */
    const o2={top:kraftTop};
    if(L.B>1) o2.front=(g,W,H)=>{ g.save(); g.translate(-k*W,0); drawFront(g,W*L.B,H,a,p.cat); g.restore(); };
    const A=atlas(bw,bh,d,a,p.cat,o2);
    parts.push({geo:merge([{geo:atlasBox(bw,bh,d,A.R),m:tm(cx,bh/2,0)}]),mat:A.mat});
    vc.push({geo:new THREE.BoxGeometry(bw*1.01,0.012,d*1.01),m:tm(cx,bh-0.004,0),color:0x9c7a4c});
    vc.push({geo:new THREE.BoxGeometry(bw*1.02,Math.min(0.03,p.dims[1]*0.08),d*1.02),m:tm(cx,Math.min(0.015,p.dims[1]*0.04),0),color:0x7d6440});
  });
  if(L.B>1){ vc.push({geo:new THREE.BoxGeometry(w*1.02,0.012,d*1.02),m:tm(0,0.006,0),color:0x6b5536});
    for(let k=1;k<L.B;k++){ const x=L.bloecke[k].x0; vc.push({geo:new THREE.CylinderGeometry(0.003,0.003,0.06,5),m:tm(x,bh*0.55,d/2+0.008,0,0,Math.PI/2),color:0x2e8b3a}); } }
  /* Zuendschnur rechts an der Seite, Schutzkappe ist ab */
  vc.push({geo:new THREE.CylinderGeometry(0.0035,0.0035,0.09,6),m:tm(w/2+0.035,bh*0.18,d*0.3,0,0,Math.PI/2.4),color:0x2e8b3a});
  vc.push({geo:new THREE.BoxGeometry(0.004,bh*0.16,d*0.34),m:tm(w/2+0.003,bh*0.3,-d*0.1),color:0xf2f0e6});
  parts.push({geo:merge(vc),mat:vcMat});
  return parts;
}
const _korpus={};
function korpusTeile(t){ return _korpus[t]||(_korpus[t]=buildKorpus(t)); }
/* Rohre und Module als eine Geometrie; je Rohr der Bereich der Ecken,
   damit ein abgefeuertes Rohr einzeln verkohlen kann. Rohr: Wand aus
   Pappe (offen), heller Pappring oben, dunkle Muendung - steht im
   Winkel, in dem es schiesst. */
const ROHR_FARBE={wand:0xc9a46a,ring:0xdcc495,loch:0x140e0a,kohle:0x2a211b,kohleRing:0x3b2f26,fanWand:0x9a7448,fanRing:0xe0cfa8,modul:0xb83a2a,modulRing:0xe9dcc0};
const _rohrGeo={};
function rohrGeometrie(t,ry){
  const key=t; if(_rohrGeo[key]) return _rohrGeo[key];
  const p=P[t], L=rohrLayout(t), H=rohrHoehe(t), fan=p.shape==='fan', parts=[], rohr=[], modul=[];
  const wand=new THREE.CylinderGeometry(1,1,1,12), scheibe=new THREE.CylinderGeometry(1,1,1,12);
  const tief=Math.min(0.02,H.bh*0.3);
  L.rohre.forEach((r,k)=>{ const m=rohrMund(t,k), q=new THREE.Quaternion().setFromUnitVectors(V(0,1,0),V(m.u[0],m.u[1],m.u[2]));
    const M=(sx,sy,sz,along)=>{ const mm=new THREE.Matrix4(); mm.compose(V(r.x+m.u[0]*along,H.bh+m.u[1]*along,r.z+m.u[2]*along),q,V(sx,sy,sz)); return mm; };
    const len=H.lp+tief, mitte=(H.lp-tief)/2, i0=parts.length;
    parts.push({geo:wand,m:M(r.r,len,r.r,mitte),color:fan?ROHR_FARBE.fanWand:ROHR_FARBE.wand,rolle:'wand'});
    parts.push({geo:scheibe,m:M(r.r*0.97,0.002,r.r*0.97,H.lp+0.0008),color:fan?ROHR_FARBE.fanRing:ROHR_FARBE.ring,rolle:'ring'});
    parts.push({geo:scheibe,m:M(r.r*0.74,0.002,r.r*0.74,H.lp+0.0019),color:ROHR_FARBE.loch,rolle:'loch'});
    rohr.push([i0,parts.length]); });
  L.module.forEach(M0=>{ const i0=parts.length;
    parts.push({geo:new THREE.CylinderGeometry(M0.r,M0.r*1.08,M0.h,10),m:tm(M0.x,M0.h/2,M0.z),color:ROHR_FARBE.modul,rolle:'wand'});
    parts.push({geo:scheibe,m:tm(M0.x,M0.h+0.001,M0.z,0,0,0,M0.r,0.002,M0.r),color:ROHR_FARBE.modulRing,rolle:'ring'});
    parts.push({geo:scheibe,m:tm(M0.x,M0.h+0.0026,M0.z,0,0,0,M0.r*0.5,0.002,M0.r*0.5),color:ROHR_FARBE.loch,rolle:'loch'});
    modul.push([i0,parts.length]); });
  const geo=merge(parts);
  const bereich=([a,b])=>({von:parts[a]._o,bis:parts[b-1]._o+parts[b-1]._n,teile:parts.slice(a,b).map(x=>({von:x._o,n:x._n,rolle:x.rolle}))});
  return (_rohrGeo[key]={geo,rohr:rohr.map(bereich),modul:modul.map(bereich)});
}
/* Die Batterie, die auf dem Zuendtisch steht: Koerper (geteilt) und
   eigene Rohrgeometrie mit eigenen Farben - feuer(k) laesst Rohr k
   verkohlen, modul(i) das Fontaenen-Modul. */
function batterieModell(t,ry){
  ry=ry===undefined?Math.PI:ry;
  const g=new THREE.Group();
  for(const q of korpusTeile(t)){ const m=new THREE.Mesh(q.geo,q.mat); if(HIQ){ m.castShadow=true; m.receiveShadow=true; } g.add(m); }
  const R=rohrGeometrie(t,ry), geo=new THREE.BufferGeometry();
  for(const k of ['position','normal','uv']) geo.setAttribute(k,R.geo.attributes[k]);
  const col=new THREE.BufferAttribute(R.geo.attributes.color.array.slice(),3); geo.setAttribute('color',col);
  if(R.geo.boundingSphere) geo.boundingSphere=R.geo.boundingSphere; else geo.computeBoundingSphere();
  const rm=new THREE.Mesh(geo,vcMat); if(HIQ) rm.castShadow=true; g.add(rm);
  const faerben=(B,wand,ring)=>{ for(const x of B.teile){ if(x.rolle==='loch') continue; const c=LIN(x.rolle==='wand'?wand:ring);
      for(let i=x.von;i<x.von+x.n;i++){ col.array[i*3]=c.r; col.array[i*3+1]=c.g; col.array[i*3+2]=c.b; } }
    col.needsUpdate=true; };
  const h={g,ry,typ:t,verkohlt:new Set(),
    feuer(k){ const B=R.rohr[k]; if(!B||h.verkohlt.has(k)) return; h.verkohlt.add(k); faerben(B,ROHR_FARBE.kohle,ROHR_FARBE.kohleRing); },
    modul(i){ const B=R.modul[i]; if(B) faerben(B,ROHR_FARBE.kohle,ROHR_FARBE.kohleRing); },
    farbe(k){ const B=R.rohr[k]; if(!B) return null; const x=B.teile[1]; return [col.array[x.von*3],col.array[x.von*3+1],col.array[x.von*3+2]]; },
    weg(){ if(g.parent) g.parent.remove(g); geo.dispose&&geo.dispose(); }};
  g.userData.batt=h;
  return h;
}
/* fuer ItemPool (Laptopbild, alte Aufrufe): Koerper und Rohre ohne Verkohlen */
function buildAusgepackt(t){ const R=rohrGeometrie(t,Math.PI); return korpusTeile(t).concat([{geo:R.geo,mat:vcMat}]); }
const _poolsAus={};
const poolsAus=new Proxy(_poolsAus,{get(o,k){
  if(typeof k==='string'&&!(k in o)&&typeof P!=='undefined'&&P[k]&&P[k].dims) o[k]=new ItemPool(istBatterie(k)?buildAusgepackt(k):buildProduct(k,true),12);
  return o[k]; }});
/* Was steht auf dem Zuendtisch: Batterien ausgepackt, alles andere wie im Regal */
function stationsPool(t){ return istBatterie(t)||(P[t]&&P[t].shape==='fountainset')?poolsAus[t]:pools[t]; }

/* ---------------- Verpackung im Laden ---------------- */
/* Grosse Verbunde kommen im braunen Wellpappkarton mit Etikett,
   Gefahrgutraute 1.4G, Pfeilen "oben" und Grifflöchern - drin liegen
   die Einzelbatterien, die man vor dem Zuenden aufbaut. Kleinere
   Batterien stehen als bedruckter Block in Schrumpffolie im Regal. */
function istVerbundKarton(t){ const p=P[t]; return p.shape==='battery'&&(rohrBedarf(t).n>=120||p.dims[0]>=0.75); }
function gefahrRaute(g,x,y,s,txt){ g.save(); g.translate(x,y); g.rotate(Math.PI/4); g.fillStyle='#f28c1b'; g.fillRect(-s/2,-s/2,s,s); g.strokeStyle='#1b1b1b'; g.lineWidth=Math.max(1,s*0.04); g.strokeRect(-s*0.44,-s*0.44,s*0.88,s*0.88); g.restore();
  g.fillStyle='#1b1b1b'; g.textAlign='center'; g.textBaseline='middle'; g.font=`700 ${Math.round(s*0.32)}px "Barlow Condensed", Arial, sans-serif`; g.fillText(txt,x,y+s*0.05); g.font=`700 ${Math.round(s*0.16)}px Arial`; g.fillText('1',x,y+s*0.42); }
function wellpappe(g,W,H){ g.fillStyle='#b48a58'; g.fillRect(0,0,W,H);
  for(let x=0;x<W;x+=4){ g.fillStyle=`rgba(80,52,24,${0.04+0.04*Math.sin(x*0.7)})`; g.fillRect(x,0,2,H); }
  for(let i=0;i<500;i++){ g.fillStyle=`rgba(60,40,20,${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,1); } }
function verbundFront(t){ const p=P[t], a=p.art, n=rohrBedarf(t).schuss;
  return (g,W,H)=>{ wellpappe(g,W,H);
    /* aufgeklebtes Farbetikett mit dem Produktbild */
    const lx=W*0.07, ly=H*0.1, lw=W*0.62, lh=H*0.62;
    g.save(); g.translate(lx,ly); g.beginPath(); g.rect(0,0,lw,lh); g.clip(); drawFront(g,lw,lh,a,p.cat); g.restore();
    g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=Math.max(2,W*0.006); g.strokeRect(lx,ly,lw,lh);
    /* Stempeldruck in Schwarz auf der Pappe */
    g.fillStyle='#1d1a16'; g.textAlign='left'; g.textBaseline='alphabetic';
    const F=s=>`700 ${Math.round(s)}px "Barlow Condensed", Arial, sans-serif`;
    g.font=F(H*0.07); g.fillText('VERBUNDFEUERWERK',W*0.07,H*0.82);
    g.font=F(H*0.05); g.fillText(`${n} SCHUSS · KATEGORIE F${p.cat||2} · ${rohrLayout(t).B>1?rohrLayout(t).B+' BATTERIEN ZUM AUFBAUEN':'1 BATTERIE'}`,W*0.07,H*0.9);
    g.font=F(H*0.042); g.fillStyle='#3a332a'; g.fillText('UN 0336 · 1.4G · NUR IM FREIEN VERWENDEN',W*0.07,H*0.96);
    gefahrRaute(g,W*0.84,H*0.32,Math.min(W,H)*0.22,'1.4G');
    /* Pfeile "oben" */
    g.fillStyle='#1d1a16'; for(const dx of [0,1]){ const x=W*(0.78+dx*0.1), y=H*0.66; g.beginPath(); g.moveTo(x,y-H*0.09); g.lineTo(x-W*0.025,y-H*0.04); g.lineTo(x+W*0.025,y-H*0.04); g.closePath(); g.fill(); g.fillRect(x-W*0.008,y-H*0.045,W*0.016,H*0.08); }
  }; }
function verbundSeite(t){ const p=P[t], a=p.art;
  return (g,W,H)=>{ wellpappe(g,W,H);
    /* Griffloch */
    g.fillStyle='#2a2016'; const gw=W*0.36, gh=H*0.06; g.beginPath(); g.ellipse(W/2,H*0.16,gw/2,gh/2,0,0,Math.PI*2); g.fill();
    g.save(); g.translate(W*0.5,H*0.58); g.rotate(-Math.PI/2); g.fillStyle='#1d1a16'; g.textAlign='center'; g.textBaseline='middle';
    fitFont(g,a.title,H*0.6,Math.round(W*0.32),BUN); g.fillText(a.title,0,0); g.restore();
    gefahrRaute(g,W*0.5,H*0.88,Math.min(W,H*0.3)*0.6,'1.4G'); }; }
function verbundTop(g,W,H){ wellpappe(g,W,H);
  /* Klebeband ueber die Klappen */
  g.fillStyle='rgba(196,160,104,.9)'; g.fillRect(0,H*0.42,W,H*0.16); g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(0,H*0.44,W,H*0.03);
  g.strokeStyle='rgba(60,40,20,.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,H/2); g.lineTo(W,H/2); g.stroke(); }
/* Seite eines Batterieblocks im Schrumpffilm: Sicherheitshinweise,
   Piktogramme, CE, Barcode */
function blockSeite(a,cat,n){ return (g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,.92)'; g.fillRect(W*0.08,H*0.06,W*0.84,H*0.52);
  g.fillStyle='#1b1b1b'; g.textAlign='left'; g.textBaseline='top'; const F=s=>`600 ${Math.max(6,Math.round(s))}px Arial, sans-serif`;
  g.font=`700 ${Math.max(7,Math.round(W*0.09))}px Arial`; g.fillText(`${n} Schuss`,W*0.12,H*0.08);
  g.font=F(W*0.055); for(let i=0;i<7;i++){ g.fillStyle='rgba(30,30,30,.55)'; g.fillRect(W*0.12,H*(0.17+i*0.05),W*(0.55+0.2*((i*37)%5)/5),Math.max(1,H*0.012)); }
  g.fillStyle='#1b1b1b'; g.font=`700 ${Math.max(7,Math.round(W*0.12))}px Arial`; g.fillText('CE',W*0.12,H*0.5);
  g.font=`700 ${Math.max(6,Math.round(W*0.07))}px Arial`; g.fillText('F'+(cat||2),W*0.42,H*0.51);
  /* Barcode */
  g.fillStyle='#fff'; g.fillRect(W*0.1,H*0.66,W*0.8,H*0.14); g.fillStyle='#111'; for(let x=W*0.13;x<W*0.87;x+=W*0.02*(1+((x*13)|0)%2)) g.fillRect(x,H*0.68,Math.max(1,W*0.01),H*0.1);
  g.fillStyle=a.ac2; g.fillRect(0,H*0.88,W,H*0.12); }; }
function blockTop(a,cat){ return (g,W,H)=>{ drawTop(g,W,H,a,cat); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(0,0,W,H*0.06); }; }
/* Verpackungsmodell einer Batterie (Regal, Lager, Laptopbild) */
function buildBatterieVerpackung(t){
  const p=P[t], a=p.art, w=p.dims[0], h=p.dims[1], d=p.dims[2], parts=[], vc=[], n=rohrBedarf(t).schuss||0;
  if(istVerbundKarton(t)){
    /* Verkaufsverpackung des Verbunds: vollflaechig bedruckter Karton mit
       Tragegriff oben (der braune Wellpappkarton ist der Aussenkarton) */
    const A=atlas(w,h,d,a,p.cat,{rough:0.6});
    parts.push({geo:merge([{geo:atlasBox(w,h,d,A.R),m:tm(0,h/2,0)}]),mat:A.mat});
    const gw=Math.min(0.28,w*0.32);
    vc.push({geo:new THREE.BoxGeometry(gw,0.022,0.03),m:tm(0,h+0.05,0),color:0x26282e});
    for(const sx of [-1,1]) vc.push({geo:new THREE.BoxGeometry(0.02,0.055,0.03),m:tm(sx*gw/2,h+0.022,0),color:0x26282e});
    vc.push({geo:new THREE.BoxGeometry(gw+0.06,0.006,0.06),m:tm(0,h+0.003,0),color:0x26282e});
  } else {
    const A=atlas(w,h,d,a,p.cat,{side:blockSeite(a,p.cat,n),top:blockTop(a,p.cat)});
    parts.push({geo:merge([{geo:atlasBox(w,h,d,A.R),m:tm(0,h/2,0)}]),mat:A.mat});
    /* Zuendschnur unter roter Schutzkappe, Kantenschutz */
    vc.push({geo:new THREE.CylinderGeometry(0.009,0.009,0.016,10),m:tm(w*0.38,h*0.16,d/2+0.008,Math.PI/2),color:0xd8352a});
    for(const sx of [-1,1]) for(const sz of [-1,1]) vc.push({geo:new THREE.BoxGeometry(0.012,h*0.98,0.012),m:tm(sx*(w/2-0.002),h/2,sz*(d/2-0.002)),color:0xe8e4d8});
    /* Schrumpffolie: glaenzende Huelle */
    parts.push({geo:merge([{geo:new THREE.BoxGeometry(w*1.012,h*1.006,d*1.012),m:tm(0,h/2,0)}]),mat:folieMat});
  }
  if(vc.length) parts.push({geo:merge(vc),mat:vcMat});
  return parts;
}
const folieMat=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.1,roughness:0.08,metalness:0.0,depthWrite:false});

/* ---------------- Verpackungen der uebrigen Feuerwerksarten ----------------
   Nach echten Vorbildern (Recherche 01.10.): Wunderkerzen in der flachen
   10er-Schachtel mit Sichtfenster, Raketen in der langen Schachtel mit
   Fenster ueber den Raketen samt Stab, Kugelbomben einzeln im Karton mit
   rundem Fenster, Fontaenen-Sets im Karton mit Fenster, Boeller als
   "Schinken" in Schrumpffolie, Roemische Lichter im Folienbuendel mit
   Kopfkarte, Sonnenraeder als Blisterkarte. */
const folieKlar=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.16,roughness:0.06,metalness:0,depthWrite:false});
/* Atlas mit Fenster: o.loch(W,H) liefert die Ausschnitte (Rechtecke oder
   Kreise) der Vorderseite bzw. Oberseite, die durchsichtig bleiben. */
function lochAtlas(w,h,d,a,cat,o){
  const wrap=(fn,loch)=>(g,W,H)=>{ fn(g,W,H); if(!loch) return; const L=loch(W,H);
    g.save(); g.globalCompositeOperation='destination-out';
    for(const q of L){ g.beginPath(); if(q.r) g.arc(q.x,q.y,q.r,0,Math.PI*2); else g.rect(q.x,q.y,q.w,q.h); g.fill(); }
    g.restore(); g.save(); g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=Math.max(2,Math.min(W,H)*0.012);
    for(const q of L){ g.beginPath(); if(q.r) g.arc(q.x,q.y,q.r,0,Math.PI*2); else g.rect(q.x,q.y,q.w,q.h); g.stroke(); } g.restore(); };
  const A=atlas(w,h,d,a,cat,{front:wrap(o.front||((g,W,H)=>drawFront(g,W,H,a,cat)),o.lochFront),side:o.side,top:wrap(o.top||((g,W,H)=>drawTop(g,W,H,a,cat)),o.lochTop)});
  A.mat.alphaTest=0.5; A.mat.side=THREE.FrontSide; return A;
}
function boxPart(parts,w,h,d,A,m){ parts.push({geo:merge([{geo:atlasBox(w,h,d,A.R),m}]),mat:A.mat}); }
function buildVerpackung(t){
  const p=P[t], a=p.art, sh=p.shape, w=p.dims[0], h=p.dims[1], d=p.dims[2], parts=[], vc=[];
  if(!p.cat||!a) return null;
  const roh=()=>buildProduct(t,true);
  if(sh==='sparkler'){
    /* flache Schachtel, unten ein Sichtfenster auf die grauen Staebe */
    const front=(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
      /* Sternfunken oben */
      const lin=typeof linieVon==='function'?linieVon(t):'funkenkind'; g.fillStyle=lin==='funkenkind'?'#e0287a':'#d8322a'; g.fillRect(0,0,W,H*0.035); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,LINIE_NAME[lin]||'',W*0.9,Math.round(H*0.026),BAR); g.fillText(LINIE_NAME[lin]||'',W/2,H*0.018);
      const cx=W*0.5, cy=H*0.18, R=W*0.34; g.strokeStyle='#fff3c4'; g.lineCap='round';
      for(let i=0;i<22;i++){ const an=i/22*Math.PI*2, r1=R*(0.55+0.45*((i*7)%5)/5); g.lineWidth=Math.max(1,W*0.012); g.beginPath(); g.moveTo(cx+Math.cos(an)*R*0.12,cy+Math.sin(an)*R*0.12); g.lineTo(cx+Math.cos(an)*r1,cy+Math.sin(an)*r1); g.stroke(); }
      g.fillStyle='#fffbe8'; g.beginPath(); g.arc(cx,cy,R*0.12,0,Math.PI*2); g.fill();
      g.save(); g.translate(W*0.5,H*0.42); g.rotate(-Math.PI/2); g.textAlign='center'; g.textBaseline='middle'; fitFont(g,a.title,H*0.3,Math.round(W*0.24),BUN);
      g.lineWidth=Math.max(2,W*0.03); g.strokeStyle='rgba(0,0,0,.55)'; g.strokeText(a.title,0,0); g.fillStyle=a.ac; g.fillText(a.title,0,0); g.restore();
      /* Fensterhintergrund: die Staebe */
      const y0=H*0.56, y1=H*0.88; g.fillStyle='#ece8de'; g.fillRect(W*0.12,y0,W*0.76,y1-y0);
      const n=7; for(let i=0;i<n;i++){ const x=W*(0.18+i*0.64/(n-1)); g.fillStyle='#5f6268'; g.fillRect(x-W*0.018,y0-2,W*0.036,(y1-y0)*0.78); g.fillStyle='#9aa0a8'; g.fillRect(x-W*0.006,y0+(y1-y0)*0.78,W*0.012,(y1-y0)*0.24); }
      g.fillStyle='rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(W*0.12,y1); g.lineTo(W*0.36,y0); g.lineTo(W*0.46,y0); g.lineTo(W*0.22,y1); g.fill();
      g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=Math.max(2,W*0.015); g.strokeRect(W*0.12,y0,W*0.76,y1-y0);
      g.fillStyle=a.ac2; g.fillRect(0,H*0.91,W,H*0.09); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'10 STÜCK',W*0.8,Math.round(H*0.05),BAR); g.fillText('10 STÜCK',W/2,H*0.955);
      g.fillStyle='#fff'; g.beginPath(); g.arc(W*0.84,H*0.05,W*0.1,0,Math.PI*2); g.fill(); g.fillStyle='#0e1226'; g.font=BUN(Math.round(W*0.09)); g.fillText('F'+p.cat,W*0.84,H*0.055); };
    const A=atlas(w,h,d,a,p.cat,{front}); boxPart(parts,w,h,d,A,tm(0,h/2,0));
    /* Aufhaengelasche (Euroloch) oben */
    vc.push({geo:new THREE.BoxGeometry(w*0.5,h*0.06,0.003),m:tm(0,h*1.03,-d*0.3),color:parseInt(a.bg2.slice(1),16)});
  }
  else if(sh==='rocketset'){
    /* lange Schachtel, oben ein Fenster: darunter liegen die Raketen mit Stab */
    const n=p.stueck||clamp(Math.round(d/0.026),3,9), cols=[0xd8352a,0x2f7fd0,0xffc93a,0x2f9e57,0x9b3bd6,0xf2f5ff,0xff7a3d,0x39c4d8,0xe35aa8];
    const A=lochAtlas(w,h,d,a,p.cat,{top:(g,W,H)=>drawFront(g,W,H,a,p.cat),lochTop:(W,H)=>[{x:W*0.34,y:H*0.12,w:W*0.62,h:H*0.76}]});
    boxPart(parts,w,h,d,A,tm(0,h/2,0));
    vc.push({geo:new THREE.BoxGeometry(w*0.98,0.004,d*0.96),m:tm(0,0.006,0),color:0x1d2130});
    const step=d*0.8/n, rr=p.stueck?Math.min(h*0.34,step*0.42):Math.min(h*0.3,0.0115,step*0.44);
    for(let i=0;i<n;i++){ const z=-d*0.4+step*(i+0.5), y=0.008+rr, c=cols[i%cols.length];
      vc.push({geo:new THREE.CylinderGeometry(rr,rr,w*0.3,10),m:tm(w*0.2,y,z,0,0,Math.PI/2),color:c});
      vc.push({geo:new THREE.ConeGeometry(rr,w*0.07,10),m:tm(w*0.385,y,z,0,0,-Math.PI/2),color:c});
      vc.push({geo:new THREE.CylinderGeometry(rr*1.02,rr*1.02,0.012,10),m:tm(w*0.07,y,z,0,0,Math.PI/2),color:0xf2f2f2});
      vc.push({geo:new THREE.CylinderGeometry(Math.max(0.0025,rr*0.22),Math.max(0.0025,rr*0.22),w*0.52,4),m:tm(-w*0.2,0.012,z+rr*0.4,0,0,Math.PI/2),color:0xc9a46a}); }
    parts.push({geo:merge([{geo:new THREE.BoxGeometry(w*0.62,0.002,d*0.76),m:tm(w*0.15,h-0.003,0)}]),mat:folieKlar});
  }
  else if(sh==='shell'){
    /* Kugelbomben: kleine Kaliber in der Klarsichtkuppel auf bedruckter
       Karte (die Kugel mit Etikett sichtbar), grosse in der bedruckten
       Bombendose mit Metalldeckel - so werden einzelne Kugeln verkauft */
    if(w<0.15){
      const kh=0.014, A=atlas(w,kh,d,a,p.cat,{}); boxPart(parts,w,kh,d,A,tm(0,kh/2,0));
      roh().forEach(q=>{ q.geo.applyMatrix4(tm(0,kh,0,0,0,0,0.86,0.86,0.86)); parts.push(q); });
      const R=Math.min(w,d)*0.49, dome=new THREE.SphereGeometry(R,22,12,0,Math.PI*2,0,Math.PI/2);
      parts.push({geo:merge([{geo:dome,m:tm(0,kh,0,0,0,0,1,(h-kh)/R,1)}]),mat:folieKlar});
      vc.push({geo:new THREE.CylinderGeometry(R*1.04,R*1.04,0.004,22),m:tm(0,kh+0.002,0),color:0xe9e9ee});
    } else {
      const R=w*0.49, HH=h*0.94, C=2*Math.PI*R;
      const wt=wrapTex(C,HH,a,(g,W,Hh)=>{ for(let k=0;k<2;k++){ g.save(); g.translate(k*W/2,0); g.beginPath(); g.rect(0,0,W/2,Hh); g.clip(); drawFront(g,W/2,Hh,a,p.cat); g.restore(); } });
      parts.push({geo:merge([{geo:new THREE.CylinderGeometry(R,R,HH,28,1,true,-Math.PI/2),m:tm(0,HH/2,0)}]),mat:new THREE.MeshStandardMaterial({map:wt,roughness:0.45,side:THREE.DoubleSide})});
      vc.push({geo:new THREE.CylinderGeometry(R*1.02,R*1.02,h*0.07,28),m:tm(0,HH+h*0.03,0),color:0xb9bec6});
      vc.push({geo:new THREE.CylinderGeometry(R*1.02,R*1.02,h*0.03,28),m:tm(0,h*0.015,0),color:0x8f949c});
      vc.push({geo:new THREE.CylinderGeometry(R*0.98,R*0.98,0.004,28),m:tm(0,h*0.998,0),color:0xd7dbe0});
    }
  }
  else if(sh==='fountainset'){
    /* Karton mit Fenster vorn, darin die Fontaenen auf ihrem Brett */
    const front=(g,W,H)=>{ drawFront(g,W,H,a,p.cat); };
    const A=lochAtlas(w,h,d,a,p.cat,{front,lochFront:(W,H)=>[{x:W*0.05,y:H*0.06,w:W*0.68,h:H*0.6}]});
    boxPart(parts,w,h,d,A,tm(0,h/2,0));
    vc.push({geo:new THREE.BoxGeometry(w*0.98,h*0.98,0.004),m:tm(0,h/2,-d*0.47),color:0x1b2238});
    roh().forEach(q=>{ q.geo.applyMatrix4(tm(0,0,0,0,0,0,0.92,0.92,0.7)); parts.push(q); });
    parts.push({geo:merge([{geo:new THREE.BoxGeometry(w*0.7,h*0.62,0.002),m:tm(-w*0.11,h*0.64,d/2-0.002)}]),mat:folieKlar});
  }
  else if(sh==='tubepack'){
    /* "Schinken": die Boeller in Schrumpffolie */
    roh().forEach(q=>parts.push(q));
    parts.push({geo:merge([{geo:new THREE.BoxGeometry(w*1.02,h*1.04,d*1.04),m:tm(0,h*0.52,0)}]),mat:folieKlar});
  }
  else if(sh==='candle'){
    /* Buendel in Folie, oben eine gefaltete Kopfkarte mit dem Namen */
    roh().forEach(q=>parts.push(q));
    parts.push({geo:merge([{geo:new THREE.CylinderGeometry(w*0.56,w*0.56,h*0.86,16,1,true),m:tm(0,h*0.45,0)}]),mat:folieKlar});
    const A=atlas(w*1.1,h*0.2,0.006,a,p.cat,{});
    boxPart(parts,w*1.1,h*0.2,0.006,A,tm(0,h*0.86,d*0.58));
  }
  else if(sh==='cylinder'&&p.cat){
    /* Fontaene: Kunststofffuss und Folie */
    roh().forEach(q=>parts.push(q));
    vc.push({geo:new THREE.CylinderGeometry(w*0.62,w*0.68,h*0.04,20),m:tm(0,h*0.02,0),color:0x1d1f24});
    parts.push({geo:merge([{geo:new THREE.CylinderGeometry(w*0.52,w*0.52,h*0.88,20,1,true),m:tm(0,h*0.44,0)}]),mat:folieKlar});
  }
  else if(sh==='boxA'&&t==='feuerrad'){
    /* Blisterkarte: bedruckte Karte, davor die Klarsichtblase mit dem Rad */
    const kd=d*0.14, A=atlas(w,h,kd,a,p.cat,{}); boxPart(parts,w,h,kd,A,tm(0,h/2,-d/2+kd/2));
    const R=Math.min(w,h)*0.3, cz=-d/2+kd+R*0.32;
    vc.push({geo:new THREE.TorusGeometry(R,R*0.1,8,28),m:tm(0,h*0.46,cz),color:0x2f3a8c});
    for(let i=0;i<8;i++){ const an=i/8*Math.PI*2; vc.push({geo:new THREE.CylinderGeometry(R*0.08,R*0.08,R*0.5,8),m:tm(Math.cos(an)*R,h*0.46+Math.sin(an)*R,cz,0,0,an),color:[0xd8352a,0xffc93a,0x2f9e57,0x2f7fd0][i%4]}); }
    vc.push({geo:new THREE.CylinderGeometry(R*0.18,R*0.18,R*0.3,12),m:tm(0,h*0.46,cz,Math.PI/2),color:0xd9cbb0});
    parts.push({geo:merge([{geo:new THREE.BoxGeometry(R*2.7,R*2.7,R*0.75),m:tm(0,h*0.46,-d/2+kd+R*0.38)}]),mat:folieKlar});
  }
  else return null;
  if(vc.length) parts.push({geo:merge(vc),mat:vcMat});
  return parts;
}

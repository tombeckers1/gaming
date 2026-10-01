/* =========================================================
   Batterien: Rohre, ausgepackte Batterie, Verpackung
   (Tom, 01.10.): Im Regal steht die Batterie in ihrer Verpackung.
   Auf dem Zuendtisch steht sie ausgepackt - man sieht die Rohre, und
   es gibt genau so viele Rohre wie Schuss. Aus jedem Rohr kommt genau
   ein Schuss (bzw. ein Effekt); kein Rohr feuert zweimal.
   ========================================================= */

/* Wie viele Rohre braucht die Batterie? Jeder Schuss des Drehbuchs und
   jeder Boden-Effekt (Feuertopf, Vulkan ...) hat sein eigenes Rohr -
   gezaehlt genau so, wie playShow sie abfeuert. */
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
  const r={schuss:s,boden:b,n:s+b}; if(typeof SHOWS!=='undefined') _rohrBedarf[t]=r; return r;
}
function istBatterie(t){ const sh=P[t]&&P[t].shape; return (sh==='battery'||sh==='fan')&&rohrBedarf(t).n>0; }

/* Rohrbild: so viele Rohre wie noetig in einem Raster, das die
   Grundflaeche fuellt. Ab 80 Schuss besteht die Batterie aus mehreren
   Bloecken (Verbund) mit einer Fuge dazwischen, wie echte Verbunde, die
   aus einzelnen Batterien zusammengesetzt sind. Faecher: die Rohre
   stehen je Spalte schraeg. Koordinaten im Produkt (x Breite, z Tiefe). */
const _rohrLayout={};
function rohrLayout(t){
  if(_rohrLayout[t]) return _rohrLayout[t];
  const p=P[t], N=rohrBedarf(t).n; if(!N) return null;
  const w=p.dims[0], d=p.dims[2], m=Math.min(0.014,w*0.04), fan=p.shape==='fan';
  const B=fan?1:N>=150&&w>=0.6?3:N>=80&&w>=0.45?2:1, fuge=B>1?0.014:0;
  const iw=w-2*m-(B-1)*fuge, id=d-2*m;
  /* Spalten je Block gleich: Gesamtspalten ein Vielfaches von B */
  let cols=Math.max(B,Math.round(Math.sqrt(N*iw/id)/B)*B), rows=Math.ceil(N/cols);
  while(cols*rows<N) cols+=B;
  /* zu viele leere Plaetze? Reihen zuerst passend machen */
  while(cols>B&&(cols-B)*rows>=N) cols-=B;
  rows=Math.ceil(N/cols);
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
      const tilt=fan?((cols>1?c/(cols-1):0.5)-0.5)*0.7:0;
      rohre.push({x,z,r,tilt,blk});
    }
  }
  return (_rohrLayout[t]={rohre,bloecke,cols,rows,B,r,N,m});
}

/* Rohrsatz beim Zuenden: jeder Schuss nimmt das freie Rohr, das seinem
   Wunschort (Versatz aus dem Drehbuch) am naechsten liegt. Jedes Rohr
   genau einmal - wenn eine Batterie mehr Schuesse haette als Rohre,
   faellt das hier auf (ueberzaehlig). */
let ROHR_LOG=null;
function rohrSatz(o,prod){
  if(!o||!istBatterie(prod)) return null;
  const L=rohrLayout(prod); if(!L) return null;
  const ry=o.ry!==undefined?o.ry:Math.PI, c=Math.cos(ry), s=Math.sin(ry);
  const frei=L.rohre.map((r,i)=>({i,off:r.x*c+r.z*s,dz:-r.x*s+r.z*c,tilt:r.tilt}));
  const rs={frei,benutzt:0,ueber:0,
    nimm(wunsch){
      if(!frei.length){ rs.ueber++; if(ROHR_LOG) ROHR_LOG.push({prod,i:-1}); return versetzt(o,wunsch||0); }
      let bi=0, bd=1e9;
      for(let k=0;k<frei.length;k++){ const f=frei[k], dd=Math.abs(f.off-(wunsch||0))+Math.abs(f.dz)*0.05+Math.random()*0.002; if(dd<bd){ bd=dd; bi=k; } }
      const f=frei.splice(bi,1)[0]; rs.benutzt++;
      const q=V(o.x+f.off,o.y,o.z+f.dz); q.jit=0.002; q.ab=0.015; q.rohr=f.i;
      if(ROHR_LOG) ROHR_LOG.push({prod,i:f.i,x:q.x,z:q.z,y:q.y});
      return q; }};
  return rs;
}

/* ---------------- ausgepackte Batterie (Zuendtisch) ---------------- */
function kraftTop(g,W,H){ g.fillStyle='#b8925f'; g.fillRect(0,0,W,H);
  for(let i=0;i<600;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'90,60,30':'230,200,150'},${0.05+Math.random()*0.08})`; g.fillRect(Math.random()*W,Math.random()*H,1+Math.random()*3,1); } }
function buildAusgepackt(t){
  const p=P[t], a=p.art, w=p.dims[0], h=p.dims[1], d=p.dims[2], L=rohrLayout(t), parts=[], vc=[];
  const fan=p.shape==='fan', bh=fan?h*0.62:h*0.94;
  /* Bloecke: bedrucktes Papier rundum (Produktbild), oben Karton */
  L.bloecke.forEach((b,k)=>{ const bw=b.x1-b.x0-(L.B>1?0.006:0), cx=(b.x0+b.x1)/2;
    /* Verbund: jede Batterie traegt ihr Stueck des durchgehenden
       Frontbilds - nebeneinander ergeben sie das ganze Motiv */
    const o2={top:kraftTop};
    if(L.B>1) o2.front=(g,W,H)=>{ g.save(); g.translate(-k*W,0); drawFront(g,W*L.B,H,a,p.cat); g.restore(); };
    const A=atlas(bw,bh,d,a,p.cat,o2);
    parts.push({geo:merge([{geo:atlasBox(bw,bh,d,A.R),m:tm(cx,bh/2,0)}]),mat:A.mat});
    /* Kartonkante oben und Sockelkragen je Block */
    vc.push({geo:new THREE.BoxGeometry(bw*1.01,0.012,d*1.01),m:tm(cx,bh-0.004,0),color:0x9c7a4c});
    vc.push({geo:new THREE.BoxGeometry(bw*1.02,Math.min(0.03,h*0.08),d*1.02),m:tm(cx,Math.min(0.015,h*0.04),0),color:0x7d6440});
  });
  /* Verbund: Grundplatte und Verbindungs-Zuendschnur ueber die Fugen */
  if(L.B>1){ vc.push({geo:new THREE.BoxGeometry(w*1.02,0.012,d*1.02),m:tm(0,0.006,0),color:0x6b5536});
    for(let k=1;k<L.B;k++){ const x=L.bloecke[k].x0; vc.push({geo:new THREE.CylinderGeometry(0.003,0.003,0.06,5),m:tm(x,bh*0.55,d/2+0.008,0,0,Math.PI/2),color:0x2e8b3a}); } }
  /* Rohre: Rohrrand aus Pappe, dunkle Muendung, Abschlussring */
  const top=bh;
  const rim=new THREE.CylinderGeometry(1,1,1,12,1,true), loch=new THREE.CylinderGeometry(1,1,1,10), ring=new THREE.CylinderGeometry(1,1,1,12);
  for(const r of L.rohre){
    const ro=fan?0.03:0.008, y=top+(fan?h*0.16:ro/2);
    const M=(sx,sy,sz,dy)=>{ const mm=new THREE.Matrix4(); const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,-r.tilt));
      const off=new THREE.Vector3(0,dy,0).applyQuaternion(q); mm.compose(V(r.x+off.x,y+off.y,r.z+off.z),q,V(sx,sy,sz)); return mm; };
    if(fan){ vc.push({geo:rim,m:M(r.r,h*0.38,r.r,0),color:0x2f3038}); }
    else vc.push({geo:rim,m:M(r.r,ro,r.r,0),color:0xc9a46a});
    const yTop=fan?h*0.19:ro/2;
    /* Rohrende: heller Pappring, darin die dunkle Muendung */
    vc.push({geo:ring,m:M(r.r,0.002,r.r,yTop-0.001),color:fan?0xd9cbb0:0xdcc495});
    vc.push({geo:loch,m:M(r.r*0.74,0.002,r.r*0.74,yTop+0.0006),color:0x140e0a});
  }
  /* Zuendschnur vorn rechts, Schutzkappe ist ab */
  vc.push({geo:new THREE.CylinderGeometry(0.0035,0.0035,0.09,6),m:tm(w*0.42,bh*0.18,d/2+0.035,Math.PI/2.4),color:0x2e8b3a});
  /* Warnetikett an der Seite */
  vc.push({geo:new THREE.BoxGeometry(0.004,bh*0.16,d*0.34),m:tm(w/2+0.003,bh*0.3,0),color:0xf2f0e6});
  parts.push({geo:merge(vc),mat:vcMat});
  return parts;
}
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
      roh().forEach(q=>{ q.geo.applyMatrix4(new THREE.Matrix4().makeScale(0.86,0.86,0.86)); q.geo.applyMatrix4(new THREE.Matrix4().makeTranslation(0,kh,0)); parts.push(q); });
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
    roh().forEach(q=>{ q.geo.applyMatrix4(new THREE.Matrix4().makeScale(0.92,0.92,0.7)); parts.push(q); });
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

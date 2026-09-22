/* =========================================================
   Vorschau: Was hinter der Bauwand einmal stehen wird.

   Eine Zeile im Laptop macht niemandem Lust auf 38.000 Euro.
   Darum ist jeder gesperrte Bereich eine echte Baustelle:
   ein Bauzaun mit bedrucktem Sockel und einem Gitterfeld auf
   Augenhoehe, dahinter der Rohbau mit Baustrahler - und darin
   als blaue Umrisse genau die Regale, die nach dem Kauf dort
   stehen werden. Wer davorsteht, sieht die Halle, bevor er sie
   besitzt. Beim Kauf faellt alles davon weg.
   ========================================================= */
const VORSCHAU={
  shop_gross : {art:'shop',  nr:1, r:()=>LAY.ost1,  strahler:[[12.0,2.6],[19.0,-4.2]]},
  shop_ost   : {art:'shop',  nr:2, r:()=>LAY.ost2,  strahler:[[24.0,2.6],[35.0,-4.2]]},
  shop_sued  : {art:'shop',  nr:3, r:()=>LAY.sued,  strahler:[[12.0,-11.5],[34.0,-19.0]]},
  lager_gross: {art:'lager', nr:4, r:()=>LAY.lnord, strahler:[[-10.4,4.0]]},
  lager_sued : {art:'lager', nr:5, r:()=>LAY.lsued, strahler:[[-13.9,-9.5],[-13.9,-22.0]]},
  lager_west : {art:'lager', nr:6, r:()=>LAY.lwest, strahler:[[-28.0,-11.0],[-28.0,-27.0]]}
};
const VORSCHAU_N=6;

/* --------------------------------------------------------
   Bauzaun
   -------------------------------------------------------- */
/* Verzinktes Gitterfeld. Die Maschen sitzen in der Alphakante,
   damit das Feld in den undurchsichtigen Durchgang rendert und
   nicht mit den Geisterregalen dahinter um die Sortierung
   streitet. */
function gitterMat(wdh,hoch){
  const t=tex(128,128,(c,W,H)=>{
    c.clearRect(0,0,W,H);
    c.strokeStyle='#aab2bd'; c.lineWidth=5; c.lineCap='square';
    for(let i=-6;i<12;i++){
      c.beginPath(); c.moveTo(i*26,0);   c.lineTo(i*26+H,H); c.stroke();
      c.beginPath(); c.moveTo(i*26,H);   c.lineTo(i*26+H,0); c.stroke();
    }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8;
  t.repeat.set(Math.max(1,Math.round(wdh*1.2)),Math.max(1,Math.round(hoch*1.2)));
  return new THREE.MeshStandardMaterial({map:t,alphaMap:t,alphaTest:0.45,
    side:THREE.DoubleSide,roughness:0.5,metalness:0.35});
}
const ZAUNBANNER=[];
/* Der bedruckte Sockel. Er laeuft ueber die ganze Breite der
   Oeffnung und wiederholt den Ausbaunamen, so wie eine echte
   Bauplane am Gitter. */
function zaunZeichnen(g,W,H,u,nr,len){
  const frei=S&&S.level>=u.lvl, fehlt=u.req&&S&&!S.up[u.req];
  g.fillStyle='#141a2c'; g.fillRect(0,0,W,H);
  /* Warnstreifen oben und unten */
  const streif=(y0,hh)=>{
    g.save(); g.beginPath(); g.rect(0,y0,W,hh); g.clip();
    for(let x=-hh*2;x<W+hh*2;x+=hh*1.8){
      g.fillStyle='#ffd23f'; g.beginPath();
      g.moveTo(x,y0+hh); g.lineTo(x+hh,y0); g.lineTo(x+hh*0.9,y0); g.lineTo(x-hh*0.1,y0+hh);
      g.closePath(); g.fill();
    }
    g.restore();
  };
  streif(0,18); streif(H-18,18);
  /* Plattenstoesse alle 2,4 m */
  g.strokeStyle='rgba(255,255,255,.07)'; g.lineWidth=3;
  const stoss=Math.max(1,Math.round(len/2.4));
  for(let i=1;i<stoss;i++){ const x=W*i/stoss; g.beginPath(); g.moveTo(x,20); g.lineTo(x,H-20); g.stroke(); }
  /* Schriftzug, so oft wie er hinpasst */
  const blk=Math.max(1,Math.round(len/4.2)), bw=W/blk;
  const status=fehlt?'ERST NACH DEM VORHERIGEN ABSCHNITT':frei?'JETZT FREISCHALTBAR':`AB LEVEL ${u.lvl}`;
  for(let i=0;i<blk;i++){
    const cx=bw*(i+0.5);
    g.textAlign='center'; g.textBaseline='middle';
    g.fillStyle='#ffd23f'; g.font=BUN(21);
    g.fillText(`BAUABSCHNITT ${nr} VON ${VORSCHAU_N}`,cx,48);
    g.fillStyle='#ffffff'; fitFont(g,u.name.toUpperCase(),bw-40,46,BUN);
    g.fillText(u.name.toUpperCase(),cx,86);
    g.fillStyle=fehlt?'#8892a6':frei?'#6ee29a':'#ff8f7a'; g.font=BAR(24);
    g.fillText(status,cx,120);
  }
}
function zaunBanner(u,nr,len){
  const W=Math.min(2048,Math.max(512,Math.round(len*150)));
  const t=tex(W,144,()=>{});
  ZAUNBANNER.push({tex:t,u,nr,len});
  zaunZeichnen(t.image.getContext('2d'),W,144,u,nr,len);
  t.needsUpdate=true;
  return new THREE.MeshStandardMaterial({map:t,roughness:0.72});
}
function drawZaunbanner(){
  ZAUNBANNER.forEach(b=>redraw(b.tex,(g,W,H)=>zaunZeichnen(g,W,H,b.u,b.nr,b.len)));
}
let _zaunM=null, _zaunRahmen=null;
function zaunM(){ if(!_zaunM) _zaunM=std(0xd2d7df,{roughness:0.74}); return _zaunM; }
function zaunRahmen(){ if(!_zaunRahmen) _zaunRahmen=std(0x8e959f,{metalness:0.55,roughness:0.42}); return _zaunRahmen; }
/* Fuellung einer gesperrten Oeffnung als Bauzaun statt als Wand.
   Gleiche Aufrufform wie trennwand(), damit sie dort einfach
   eintreten kann. */
function bauwand(zid,laengs,fest,a0,a1,h,face){
  const V=VORSCHAU[zid], u=UPGRADES.find(q=>q.id===zid);
  const len=a1-a0, mitte=(a0+a1)/2;
  const f=face||(laengs?'-z':'-x');
  const sgn=(f==='-x'||f==='-z')?-1:1;
  const ry=laengs?(sgn<0?Math.PI:0):(sgn<0?-Math.PI/2:Math.PI/2);
  const setz=(w,hh,x,y)=>laengs
    ? bbox(w,hh,LW,zaunM(),x,y,fest,null,false)
    : bbox(LW,hh,w,zaunM(),fest,y,x,null,false);
  const px=(off)=>laengs?mitte:fest+off, pz=(off)=>laengs?fest+off:mitte;
  /* Sockel bis 1,06 m, darueber Gitter bis knapp unter den Sturz */
  const ys=Math.min(1.06,h*0.5);
  const yb1=Math.min(h-0.24,2.42);
  const gitter=yb1>ys+0.5;
  zWand(zid,setz(len,ys,mitte,ys/2));
  /* Die Plane liegt auf beiden Seiten: welche davon der Spieler
     sieht, haengt am Bereich und nicht zuverlaessig an face. */
  if(u&&V) for(const sg of [-1,1]){
    const off=sg*(LW/2+0.008);
    const r2=laengs?(sg<0?Math.PI:0):(sg<0?-Math.PI/2:Math.PI/2);
    zWand(zid,plane(len,ys-0.02,zaunBanner(u,V.nr,len),px(off),ys/2,pz(off),r2,null));
  }
  if(gitter){
    const bh=yb1-ys;
    zWand(zid,plane(len-0.1,bh-0.1,gitterMat(len,bh),px(0),(ys+yb1)/2,pz(0),ry,null));
    /* Rahmen aus Rundrohr: zwei Riegel und Pfosten alle 2,5 m */
    for(const y of [ys+0.035,yb1-0.035]) zWand(zid,laengs
      ? bbox(len,0.07,0.07,zaunRahmen(),mitte,y,fest,null,false)
      : bbox(0.07,0.07,len,zaunRahmen(),fest,y,mitte,null,false));
    const np=Math.max(0,Math.round(len/2.5)-1);
    for(let i=1;i<=np;i++){
      const a=a0+len*i/(np+1);
      zWand(zid,bbox(laengs?0.07:0.07,bh,0.07,zaunRahmen(),laengs?a:fest,(ys+yb1)/2,laengs?fest:a,null,false));
    }
    if(h>yb1+0.02) zWand(zid,setz(len,h-yb1,mitte,(yb1+h)/2));
  } else if(h>ys+0.02) zWand(zid,setz(len,h-ys,mitte,(ys+h)/2));
  zWandCol(zid,laengs?col(a0,a1,fest-LW/2,fest+LW/2):col(fest-LW/2,fest+LW/2,a0,a1));
}

/* --------------------------------------------------------
   Rohbau hinter dem Zaun
   -------------------------------------------------------- */
let _rohM=null;
function rohbauMat(){
  if(_rohM){ return _rohM; }
  const t=concreteTex(); t.repeat.set(14,14);
  _rohM=new THREE.MeshStandardMaterial({map:t,roughness:0.95});
  _rohM.color=LIN(0x6f747c);
  return _rohM;
}
function rohbauBoden(zid,r){
  const b=new THREE.Mesh(new THREE.PlaneGeometry(r.x1-r.x0,r.z1-r.z0),rohbauMat());
  b.rotation.x=-Math.PI/2; b.position.set((r.x0+r.x1)/2,0.011,(r.z0+r.z1)/2);
  b.userData.vorschau=true; scene.add(b); zWand(zid,b);
}
/* Gelber Baustrahler auf Stativ. Er leuchtet nicht wirklich -
   die Leuchtflaeche ist ein Basic-Material und traegt den
   Rohbau auch ohne Lampe im Raum. */
function baustrahler(zid,x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); g.userData.vorschau=true; scene.add(g); zWand(zid,g);
  const st=std(0x2b2f38,{metalness:0.45,roughness:0.5}), ge=std(0xe8b21c,{roughness:0.55});
  for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3;
    const bx=bbox(0.045,1.12,0.045,st,Math.sin(a)*0.17,0.56,Math.cos(a)*0.17,g,false);
    bx.rotation.x=-Math.cos(a)*0.28; bx.rotation.z=Math.sin(a)*0.28;
  }
  bbox(0.06,1.26,0.06,st,0,0.63,0,g,false);
  bbox(0.42,0.24,0.17,ge,0,1.3,0,g,false);
  bbox(0.46,0.05,0.2,st,0,1.44,0,g,false);
  plane(0.36,0.17,new THREE.MeshBasicMaterial({color:0xfff1c2,toneMapped:false}),0,1.3,0.09,0,g);
  plane(0.36,0.17,new THREE.MeshBasicMaterial({color:0xfff1c2,toneMapped:false}),0,1.3,-0.09,Math.PI,g);
  return g;
}

/* --------------------------------------------------------
   Geisterregale: der Umriss dessen, was hier stehen wird
   -------------------------------------------------------- */
let _geistKorpus=null,_geistKante=null;
function geistMats(){
  if(!_geistKorpus){
    _geistKorpus=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.2,
      depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
    _geistKante=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.9,
      depthWrite:false,toneMapped:false});
  }
}
const GEIST_FARBE=0x37c8ff;
/* Ein Quader im Raster des Stellplatzes: Koerper plus vier
   Eckstiele und ein Deckelrahmen, damit der Umriss auch aus der
   Entfernung als Regal lesbar bleibt. */
function geistBox(kor,kan,geo,w,h,d,cx,cz,ry){
  const c=Math.cos(ry||0), s=Math.sin(ry||0);
  const w2p=(lx,lz)=>[cx+lx*c+lz*s, cz-lx*s+lz*c];
  kor.push({geo:geo(w,h,d),m:tm(cx,h/2,cz,0,ry||0,0),color:GEIST_FARBE});
  const K=0.05;
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const [ex,ez]=w2p(sx*(w/2-K/2), sz*(d/2-K/2));
    kan.push({geo:geo(K,h,K),m:tm(ex,h/2,ez,0,ry||0,0),color:GEIST_FARBE});
  }
  for(const y of [h-K/2,K/2]){
    for(const sz of [-1,1]){
      const [ex,ez]=w2p(0, sz*(d/2-K/2));
      kan.push({geo:geo(w,K,K),m:tm(ex,y,ez,0,ry||0,0),color:GEIST_FARBE});
    }
    for(const sx of [-1,1]){
      const [ex,ez]=w2p(sx*(w/2-K/2), 0);
      kan.push({geo:geo(K,K,d),m:tm(ex,y,ez,0,ry||0,0),color:GEIST_FARBE});
    }
  }
}
function geistSlot(sl,kor,kan,geo){
  const art=sl.art||'wand', ry=sl.ry||0, c=Math.cos(ry), si=Math.sin(ry);
  if(art==='insel'){
    const K=SHELFKIND.gondel;
    geistBox(kor,kan,geo,K.fw,K.lv[K.lv.length-1]+0.48,K.fd,sl.x,sl.z,ry);
  } else if(art==='ecke'){
    /* Das Eckregal steht ueber Eck: zwei Schenkel, jeder mit
       eigener Drehung im Rasterpunkt des Stellplatzes. */
    const K=SHELFKIND.eck, h=K.lv[K.lv.length-1]+0.48;
    K.seiten.forEach(f=>geistBox(kor,kan,geo,K.w,h,K.d,
      sl.x+f.ox*c+f.oz*si, sl.z-f.ox*si+f.oz*c, ry+f.ry));
  } else {
    const K=SHELFKIND.standard;
    geistBox(kor,kan,geo,K.w,K.lv[K.lv.length-1]+0.48,K.d,sl.x,sl.z,ry);
  }
}
function geistRack(sl,kor,kan,geo){
  /* Das groesste Regal, das unter diese Decke passt - genau das,
     was der Spieler hier spaeter hinstellen darf. */
  const K=rackPasst(RACKKIND.hoch,sl)?RACKKIND.hoch:RACKKIND.standard;
  geistBox(kor,kan,geo,K.w,K.hoch,2*K.zo,sl.x,sl.z,sl.ry||0,0,0);
}
function buildVorschau(){
  geistMats();
  const GB={};
  const geo=(w,h,d)=>GB[w+'|'+h+'|'+d]||(GB[w+'|'+h+'|'+d]=new THREE.BoxGeometry(w,h,d));
  for(const zid in VORSCHAU){
    const V=VORSCHAU[zid];
    rohbauBoden(zid,V.r());
    (V.strahler||[]).forEach(p=>baustrahler(zid,p[0],p[1]));
    const kor=[], kan=[];
    if(V.art==='shop') SLOTS.forEach(sl=>{ if(sl.zone===zid) geistSlot(sl,kor,kan,geo); });
    else RACKS.forEach(sl=>{ if(sl.zone===zid) geistRack(sl,kor,kan,geo); });
    if(!kor.length) continue;
    const mk=new THREE.Mesh(merge(kor),_geistKorpus); mk.renderOrder=-1;
    mk.userData.vorschau=true; scene.add(mk); zWand(zid,mk);
    const mn=new THREE.Mesh(merge(kan),_geistKante); mn.renderOrder=-1;
    mn.userData.vorschau=true; scene.add(mn); zWand(zid,mn);
  }
  for(const k in GB) GB[k].dispose();
}

/* --------------------------------------------------------
   Andockstationen: jedes noch nicht gekaufte Tor ist von innen
   abgesperrt und traegt ein kleines Schild. So sieht man in der
   Halle, wie viele Rampen noch dazukommen koennen.
   -------------------------------------------------------- */
const RAMPENSCHILD=[];
function rampenSchildZeichnen(g,W,H,nr,id){
  const u=UPGRADES.find(q=>q.id===id);
  const frei=u&&S&&S.level>=u.lvl&&(!u.req||S.up[u.req]);
  g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
  g.strokeStyle='#ffd23f'; g.lineWidth=6; g.strokeRect(6,6,W-12,H-12);
  g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#ffd23f'; g.font=BUN(36); g.fillText(`TOR ${nr}`,W/2,44);
  g.fillStyle='#ffffff'; g.font=BAR(26); g.fillText('noch nicht in Betrieb',W/2,84);
  g.fillStyle=frei?'#6ee29a':'#ff9d92'; g.font=BUN(26);
  g.fillText(frei?'JETZT FREISCHALTBAR':(u?`AB LEVEL ${u.lvl}`:''),W/2,122);
  if(u){ g.fillStyle='#bcd0ea'; g.font=BAR(24); g.fillText(eur(u.cost()),W/2,158); }
}
function drawRampenschilder(){
  RAMPENSCHILD.forEach(b=>redraw(b.tex,(g,W,H)=>rampenSchildZeichnen(g,W,H,b.nr,b.id)));
}
function buildRampenVorschau(){
  const X=LAY.lwest.x0+0.55;
  for(let i=0;i<WRAMPEN.length;i++){
    const id=WBAY_UP[i], cz=WRAMPEN[i], nr=i+1;
    absperrband(id,false,X,cz-WTOR.w/2+0.1,cz+WTOR.w/2-0.1,1.1);
    const t=tex(340,190,()=>{});
    RAMPENSCHILD.push({tex:t,nr,id});
    rampenSchildZeichnen(t.image.getContext('2d'),340,190,nr,id); t.needsUpdate=true;
    const g=new THREE.Group(); g.position.set(X+0.35,0,cz); g.rotation.y=Math.PI/2;
    g.userData.vorschau=true; scene.add(g); zWand(id,g);
    bbox(0.08,1.9,0.08,std(0x59606b,{metalness:0.6,roughness:0.42}),0,0.95,-0.02,g,false);
    bbox(0.34,0.05,0.34,std(0x2a2e38,{roughness:0.8}),0,0.025,-0.02,g,false);
    plane(1.02,0.57,new THREE.MeshStandardMaterial({map:t,roughness:0.62}),0,1.62,0.01,0,g);
    bbox(1.08,0.63,0.03,std(0x2f343d,{metalness:0.4,roughness:0.55}),0,1.62,-0.01,g,false);
  }
}

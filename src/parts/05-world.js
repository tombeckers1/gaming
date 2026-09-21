
/* =========================================================
   Wände, Böden, Welt
   ========================================================= */
let lapHit, padHit, doorSign, doorSignTex, starsMat, posHit, cardHit, posTex, beltTex, skyGeo, lampMats=[], houseMats=[], snowPts;
let grimeMats=[], windowHits=[], winWork=0;
let uhrStd=null, uhrMin=null, uhrSek=null;
let wallTex=null, floorTexRef=null, shopWall=null, shopUpper=null, shopLower=null, floorMat=null;
const WH=3.6;
/* =========================================================
   Grundriss. Die ganze Flaeche steht von Anfang an, aber nur
   der Kern ist begehbar - der Rest liegt hinter Bauwaenden und
   waechst Stueck fuer Stueck hinzu.

        Strasse z 13..20 / Gehweg z 8.5
   +--------+------------------+--------------------------+
   | Lager  | Lager Basis      |  Verkauf Basis  | shop_  |
   | Nord   | x -19.9..-8.1    |  x -7.9..8      | gross  |
   +--------+ z -5.9..1.9      |  z -5.9..5.9    | +ost   |
   | Lager West | Lager Sued   +-----------------+--------+
   | x -41.9..  | x -19.9..    |    Testfeld     | shop_  |
   |   -19.9    |   -8.1       |  x -7.9..8      | sued   |
   | z -29.9..-7| z -29.9..-5.9|  z -28..-6      |        |
   +------------+--------------+-----------------+--------+
   ========================================================= */
const LAY={
  /* Verkaufsflaeche, zusammen 1018 m2 */
  shop  :{x0:-7.9, x1:37.9, z0:-21.9, z1:5.9},
  basis :{x0:-7.9, x1:8.0,  z0:-5.9,  z1:5.9},   /* 186 m2, von Anfang an */
  ost1  :{x0:8.0,  x1:20.0, z0:-5.9,  z1:5.9},   /* 142 m2 */
  ost2  :{x0:20.0, x1:37.9, z0:-5.9,  z1:5.9},   /* 212 m2 */
  sued  :{x0:8.0,  x1:37.9, z0:-21.9, z1:-5.9},  /* 478 m2 */
  /* Lager, zusammen 927 m2 */
  lager :{x0:-41.9,x1:-8.1, z0:-29.9, z1:5.9},
  lbasis:{x0:-19.9,x1:-8.1, z0:-5.9,  z1:1.9},   /*  92 m2, von Anfang an */
  lnord :{x0:-19.9,x1:-8.1, z0:1.9,   z1:5.9},   /*  47 m2 */
  lsued :{x0:-19.9,x1:-8.1, z0:-29.9, z1:-5.9},  /* 283 m2 */
  lwest :{x0:-41.9,x1:-19.9,z0:-29.9, z1:-7.0},  /* 505 m2 */
  /* Testfeld hinter dem Basisladen, durch die Hintertuer erreichbar */
  test  :{x0:-7.9, x1:8.0,  z0:-28.0, z1:-6.0},
  /* Hoefe: der kleine an der Basisrampe, der grosse an der Westrampe */
  hof   :{x0:-34.0,x1:-20.0,z0:-6.5,  z1:2.5},
  hof2  :{x0:-64.0,x1:-42.0,z0:-30.0, z1:-7.0},
  /* Logistikzentrum, vorerst nur von aussen */
  logi  :{x0:44.0, x1:90.0, z0:-16.0, z1:14.0}
};
const LW=0.2;                      /* Wandstaerke                      */
function flaeche(r){ return Math.round((r.x1-r.x0)*(r.z1-r.z0)); }
/* Hintertuer aus dem Basisladen aufs Testfeld */
const HINTERTUER={x0:4.4, x1:6.1};
/* Lichte Hoehe des Anbaus hinter dem Lager (spaetere Lagererweiterung) */
const ANBAU_H=2.9;
/* Lichte Hoehe der grossen Lagerhallen Sued und West */
const HALLE_H=6.4;
function paintWall(g,W,H,c){
  g.fillStyle=c.up; g.fillRect(0,0,W,H);
  const band=Math.round(H*(1-1.1/WH));
  if(c.pat==='streifen'){ g.fillStyle=c.pat2; for(let x=0;x<W;x+=W/6) g.fillRect(x,0,W/14,band);
    g.fillStyle='rgba(0,0,0,.05)'; for(let x=W/12;x<W;x+=W/6) g.fillRect(x,0,W/40,band); }
  else if(c.pat==='raute'){ g.strokeStyle=c.pat2; g.lineWidth=Math.max(1.5,W/90);
    const s2=W/5; for(let y=-s2;y<band+s2;y+=s2){ for(let x=-s2;x<W+s2;x+=s2){
      g.beginPath(); g.moveTo(x,y+s2/2); g.lineTo(x+s2/2,y); g.lineTo(x+s2,y+s2/2); g.lineTo(x+s2/2,y+s2); g.closePath(); g.stroke(); } } }
  else if(c.pat==='ziegel'){ const bh=band/14;
    for(let r=0;r<14;r++){ const off=(r%2)*(W/6);
      for(let x=-W/6;x<W;x+=W/3){ g.fillStyle=c.pat2; g.fillRect(x+off+2,r*bh+2,W/3-4,bh-4); } }
    g.fillStyle='rgba(255,255,255,.08)'; for(let r=0;r<14;r++) g.fillRect(0,r*bh,W,1.5); }
  else if(c.pat==='blume'){ const s2=W/4;
    for(let y=s2/2;y<band;y+=s2) for(let x=((y/s2)%2)*s2/2;x<W;x+=s2){
      g.fillStyle=c.pat2; for(let k=0;k<5;k++){ const a2=k/5*Math.PI*2;
        g.beginPath(); g.ellipse(x+Math.cos(a2)*s2*0.13,y+Math.sin(a2)*s2*0.13,s2*0.09,s2*0.05,a2,0,Math.PI*2); g.fill(); }
      g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(x,y,s2*0.045,0,Math.PI*2); g.fill(); } }
  else if(c.pat==='holz'){ const pw=W/5;
    for(let x=0;x<W;x+=pw){ g.fillStyle=c.pat2; g.fillRect(x+2,0,pw-4,band);
      g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x,0,2,band);
      g.strokeStyle='rgba(60,40,20,.18)'; g.lineWidth=1;
      for(let k=0;k<5;k++){ g.beginPath(); g.moveTo(x+4+k*(pw/6),0); g.bezierCurveTo(x+8+k*(pw/6),band*0.3,x+2+k*(pw/6),band*0.7,x+6+k*(pw/6),band); g.stroke(); } } }
  else if(c.pat==='ornament'){ const s2=W/4;
    for(let y=s2/2;y<band;y+=s2) for(let x=((y/s2)%2)*s2/2;x<W;x+=s2){
      g.strokeStyle=c.pat2; g.lineWidth=Math.max(1.5,W/120);
      g.beginPath(); g.arc(x,y,s2*0.22,0,Math.PI*2); g.stroke();
      g.beginPath(); g.moveTo(x-s2*0.3,y); g.quadraticCurveTo(x,y-s2*0.32,x+s2*0.3,y); g.stroke();
      g.beginPath(); g.moveTo(x-s2*0.3,y); g.quadraticCurveTo(x,y+s2*0.32,x+s2*0.3,y); g.stroke(); } }
  g.fillStyle=c.low; g.fillRect(0,band,W,H-band);
  g.fillStyle=c.rail; g.fillRect(0,band-6,W,8); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(0,band-6,W,2);
}
function paintFloor(g,W,H,f){
  g.setTransform(1,0,0,1,0,0); g.scale(W/256,H/256); W=256; H=256;
  g.fillStyle=f.b; g.fillRect(0,0,W,H);
  if(f.big){ for(let i=0;i<2;i++) for(let j=0;j<2;j++){ g.fillStyle=(i+j)%2?f.a:f.b; g.fillRect(i*128+2,j*128+2,124,124);
      for(let k=0;k<40;k++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.03})`; g.fillRect(i*128+Math.random()*124,j*128+Math.random()*124,6,4); } } }
  else if(f.plate){ g.fillStyle=f.a; g.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=32) for(let x=0;x<W;x+=32){ g.fillStyle=f.b; g.save(); g.translate(x+16,y+16); g.rotate((x/32+y/32)%2?0.7:-0.7);
      g.fillRect(-11,-3,22,6); g.restore(); }
    g.fillStyle='rgba(255,255,255,.08)'; for(let y=0;y<H;y+=32) g.fillRect(0,y,W,1); }
  else if(f.carpet){ g.fillStyle=f.a; g.fillRect(0,0,W,H);
    for(let i=0;i<9000;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.10})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } }
  else if(f.marble){ g.fillStyle=f.a; g.fillRect(0,0,W,H);
    for(let i=0;i<26;i++){ g.strokeStyle=`rgba(120,120,130,${rand(0.06,0.24)})`; g.lineWidth=rand(1,4);
      let x=Math.random()*W, y=Math.random()*H; g.beginPath(); g.moveTo(x,y);
      for(let k=0;k<7;k++){ x+=rand(-50,50); y+=rand(-40,40); g.lineTo(x,y); } g.stroke(); }
    g.strokeStyle='rgba(0,0,0,.14)'; g.lineWidth=2; g.strokeRect(0,0,128,128); g.strokeRect(128,0,128,128); g.strokeRect(0,128,128,128); g.strokeRect(128,128,128,128); }
  else if(f.check){ for(let i=0;i<2;i++) for(let j=0;j<2;j++){ g.fillStyle=(i+j)%2?f.a:f.b; g.fillRect(i*128,j*128,128,128); } }
  else if(f.wood){ for(let r=0;r<8;r++){ const off=(r%2)*40; for(let x=-80;x<W;x+=120){ g.fillStyle=r%2?f.a:f.b; g.fillRect(x+off,r*32,116,30); g.fillStyle='rgba(0,0,0,.14)'; g.fillRect(x+off,r*32+29,116,2); } } }
  else if(f.terra){ g.fillStyle=f.a; g.fillRect(0,0,W,H); for(let i=0;i<420;i++){ g.fillStyle=pick(['#8a8175','#c2452f','#3d5a6c','#d9cdb4','#6b7a52']); g.globalAlpha=0.75; g.save(); g.translate(Math.random()*W,Math.random()*H); g.rotate(Math.random()*3); g.fillRect(-4,-3,8+Math.random()*6,5); g.restore(); } g.globalAlpha=1; }
  else { for(let i=0;i<2;i++) for(let j=0;j<2;j++){ g.fillStyle=f.a; g.fillRect(i*128+1,j*128+1,126,126); for(let k=0;k<70;k++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.045})`; g.fillRect(i*128+Math.random()*124,j*128+Math.random()*124,3,3); } } }
  g.strokeStyle='rgba(0,0,0,.2)'; g.lineWidth=2; g.strokeRect(0,0,128,128); g.strokeRect(128,0,128,128); g.strokeRect(0,128,128,128); g.strokeRect(128,128,128,128);
}
function wallSet(){ return WALLS.find(w=>w.id===S.wall)||WALLS[0]; }
function floorSet(){ return FLOORS.find(f=>f.id===S.floor)||FLOORS[0]; }
function repaint(){
  const w=wallSet(), f=floorSet();
  if(wallTex) redraw(wallTex,(g,W,H)=>paintWall(g,W,H,w));
  if(shopUpper) shopUpper.color=LIN(parseInt(w.up.slice(1),16));
  if(shopLower) shopLower.color=LIN(parseInt(w.low.slice(1),16));
  if(floorTexRef) redraw(floorTexRef,(g,W,H)=>paintFloor(g,W,H,f));
  if(typeof applyReliefs==='function') applyReliefs();
}
function brickMat(len,h){
  const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#6d3a2c'; g.fillRect(0,0,W,H); const rows=8, bh=H/rows;
    for(let r=0;r<rows;r++){ const off=(r%2)*32; for(let x=-64;x<W;x+=64){ g.fillStyle=pick(['#9a4b36','#a4533c','#8e4431','#a85a41']); g.fillRect(x+off+3,r*bh+3,58,bh-6); } } });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(len/1.3,h/0.65);
  return new THREE.MeshStandardMaterial({map:t,roughness:0.95});
}
const trimMat=std(0xd2d5db,{roughness:0.95});
const lagerWallTex=tex(32,512,(g,W,H)=>{ g.fillStyle='#a3a8b0'; g.fillRect(0,0,W,H); const b=Math.round(H*(1-0.35/WH)); for(let y=b;y<H;y+=16){ g.fillStyle=((y-b)/16)%2<1?'#f2c230':'#1f1f24'; g.fillRect(0,y,W,16);} });
lagerWallTex.wrapS=THREE.RepeatWrapping; lagerWallTex.wrapT=THREE.ClampToEdgeWrapping; lagerWallTex.repeat.set(1/2.6,1/WH);
const lagerWall=new THREE.MeshStandardMaterial({map:lagerWallTex,roughness:0.95});
const lagerUpper=std(0xa3a8b0,{roughness:0.95});
let wallBrick=null;
function wallBrickMat(){ if(!wallBrick){ wallBrick=brickMat(1.3,0.65); wallBrick.map.repeat.set(1/1.3,1/0.65); } return wallBrick; }
/* Wand-UVs in Metern: dadurch ist die Tapete auf jedem Wandstueck gleich
   gross, die Scheuerleiste laeuft durch und Teilstuecke ueber Tuer oder
   Fenster zeigen genau den passenden Ausschnitt - keine Naehte mehr. */
function meterUV(m){
  const g=m.geometry, p=g.attributes.position, n=g.attributes.normal, uv=g.attributes.uv;
  if(!p||!n||!uv||uv.count!==p.count) return;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i)+m.position.x, y=p.getY(i)+m.position.y, z=p.getZ(i)+m.position.z;
    const ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i));
    if(ay>ax&&ay>az) uv.setXY(i,x,z);
    else if(ax>az)   uv.setXY(i,z,y);
    else             uv.setXY(i,x,y);
  }
  uv.needsUpdate=true;
}
const FACE={'+x':0,'-x':1,'+z':4,'-z':5}, OPP={'+x':'-x','-x':'+x','+z':'-z','-z':'+z'};
function wall(x0,x1,z0,z1,y0,y1,inFace,inMat,exMat){
  if(x1-x0>z1-z0){ x0-=0.006; x1+=0.006; } else { z0-=0.006; z1+=0.006; }
  const w=x1-x0,h=y1-y0,d=z1-z0; const mats=[trimMat,trimMat,trimMat,trimMat,trimMat,trimMat];
  mats[FACE[inFace]]=inMat; mats[FACE[OPP[inFace]]]=exMat||wallBrickMat();
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats); m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
  meterUV(m);
  m.userData.aabb={x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1)};
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; } scene.add(m); occluders.push(m); return m;
}

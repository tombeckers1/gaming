/* =========================================================
   Doppelstabmatte ums Testfeld und Strassenleuchten
   ========================================================= */
function gitterMat(rx,ry2){
  const t=tex(256,256,(g,W,H)=>{
    g.clearRect(0,0,W,H);
    g.strokeStyle='#6f7783'; g.lineCap='round';
    /* senkrechte Einzelstaebe */
    g.lineWidth=7;
    for(let x=16;x<W;x+=51){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
    /* waagerechte Doppelstaebe */
    g.lineWidth=6;
    for(let y=22;y<H;y+=51){
      g.strokeStyle='#848c98'; g.beginPath(); g.moveTo(0,y-5); g.lineTo(W,y-5); g.stroke();
      g.strokeStyle='#5f6672'; g.beginPath(); g.moveTo(0,y+5); g.lineTo(W,y+5); g.stroke();
    }
    /* Lichtkante oben auf den Staeben */
    g.strokeStyle='rgba(255,255,255,.3)'; g.lineWidth=2;
    for(let x=16;x<W;x+=51){ g.beginPath(); g.moveTo(x-2,0); g.lineTo(x-2,H); g.stroke(); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; t.repeat.set(rx,ry2);
  return new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:0.35,side:THREE.DoubleSide,metalness:0.55,roughness:0.45});
}
/* Ein Zaunlauf von (x0,z0) nach (x1,z1) */
function zaunLauf(x0,z0,x1,z1,h){
  const dx=x1-x0, dz=z1-z0, len=Math.hypot(dx,dz), ry=Math.atan2(dx,dz);
  const post=std(0x59606b,{metalness:0.6,roughness:0.42});
  const kappe=std(0x3c424d,{metalness:0.5,roughness:0.5});
  /* Sockelschiene */
  const sock=bbox(0.12,0.16,len,std(0x9a9ea6,{roughness:0.95}),(x0+x1)/2,0.08,(z0+z1)/2,null,false);
  sock.rotation.y=ry;
  /* Matte */
  const m=gitterMat(len,h-0.16);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(len,h-0.16),m);
  panel.position.set((x0+x1)/2,0.16+(h-0.16)/2,(z0+z1)/2);
  panel.rotation.y=ry+Math.PI/2;
  scene.add(panel);
  /* Pfosten alle 2,5 m */
  const n=Math.max(2,Math.round(len/2.5));
  for(let i=0;i<=n;i++){
    const t2=i/n, x=x0+dx*t2, z=z0+dz*t2;
    const p2=bbox(0.07,h+0.06,0.07,post,x,(h+0.06)/2,z,null,false); p2.rotation.y=ry; p2.userData.zaunPfosten=true;
    bbox(0.1,0.025,0.1,kappe,x,h+0.09,z,null,false);
    for(const y of [0.42,h-0.3]){
      const sch=bbox(0.1,0.05,0.05,kappe,x,y,z,null,false); sch.rotation.y=ry;
    }
  }
}
/* Das Testfeld reicht jetzt von der Lagerwand bis an die Suedhalle.
   Im Norden steht die Ladenrueckwand, im Westen die Lagerwand, im
   Osten die Westwand des Rueckgebaeudes - eingezaeunt wird nur, was
   sonst offen waere. */
let _warnTex=null;
function warnTex(){
  if(!_warnTex) _warnTex=tex(320,180,(g,W,Hh)=>{
    g.fillStyle='#f2c230'; g.fillRect(0,0,W,Hh);
    g.strokeStyle='#1f1f24'; g.lineWidth=8; g.strokeRect(6,6,W-12,Hh-12);
    g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#1f1f24';
    g.font=BUN(34); g.fillText('TESTFELD',W/2,48);
    g.font=BAR(26); g.fillText('Zutritt nur für Personal',W/2,92);
    g.fillText('Schutzbrille tragen',W/2,126);
  });
  return _warnTex;
}
function warnSchild(x,z,ry){
  plane(1.6,0.9,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,map:warnTex()}),x,1.2,z,ry,null);
}
/* Das Testfeld reicht jetzt von der Lagerwand bis an die Suedhalle.
   Im Norden steht der Lagergang, im Westen die Lagerwand, im Osten
   die Westwand des Rueckgebaeudes - eingezaeunt wird nur, was sonst
   offen waere. Auf der gewachsenen Flaeche haengt nicht mehr nur ein
   einziges Schild in der Mitte: alle acht Meter eines, damit man von
   ueberall sieht, wo man steht. */
function buildZaun(){
  const H=2.0, T=LAY.test;
  zaunLauf(T.x0,T.z0,T.x1,T.z0,H);            /* Sueden        */
  /* endet an der Aussenseite der Suedhallenwand - bei LAY.sued.z0
     stand der letzte Pfosten genau in der Innenecke der Verkaufsflaeche
     und ragte dort als dunkler Strich in den Laden (Tom, 26.09.) */
  zaunLauf(T.x1,T.z0,T.x1,LAY.sued.z0-0.2,H);     /* Osten, unten  */
  col(T.x0,T.x1,T.z0-0.1,T.z0+0.1);
  col(T.x1-0.1,T.x1+0.1,T.z0,LAY.sued.z0);
  /* Warnschilder laengs der Zaunlaeufe */
  const nS=Math.max(2,Math.round((T.x1-T.x0)/8));
  for(let i=0;i<nS;i++) warnSchild(T.x0+(i+0.5)*(T.x1-T.x0)/nS,T.z0+0.12,0);
  const lo=LAY.sued.z0, nO=Math.max(1,Math.round((lo-T.z0)/8));
  for(let i=0;i<nO;i++) warnSchild(T.x1-0.12,T.z0+(i+0.5)*(lo-T.z0)/nO,-Math.PI/2);
}
/* =========================================================
   Straße: Häuserzeile, Autos, Bäume, Stadtmöbel
   ========================================================= */
const LADENNAMEN=['BÄCKEREI','KIOSK','APOTHEKE','FRISEUR','PIZZERIA','BLUMEN','GETRÄNKE','REISEBÜRO','SCHREIBWAREN','METZGEREI','OPTIKER','WASCHSALON'];
const HAUSFARBEN=[[0xb99a7e,'#c9ad93'],[0x8f9aa6,'#a3adb8'],[0xa8846a,'#bb9a82'],[0x7f8b7a,'#96a091'],[0xc2ab84,'#d2be9c'],[0x96707a,'#ab8892'],[0x6f7c8c,'#87939f'],[0xb0705c,'#c18573'],[0xa9a294,'#bcb6aa'],[0x7a6f86,'#93899c']];
/* =========================================================
   Haustuer der Wohnhaeuser gegenueber (Tom, 24.09.: die gemalten
   Tueren sahen schlecht aus). Kassettentuer mit Glaseinsatz und
   Ziergitter, Oberlicht, Messingdruecker, Briefschlitz und
   Stossblech; daneben Klingeltableau und Hausnummer, darueber eine
   Wandleuchte, die nachts brennt.
   ========================================================= */
const TUERFARBEN=['#1f4d3a','#1e3553','#6b2430','#5a3b26','#2d3035','#3f5a6b'];
const _tuerTex={};
function tuerTex(farbe){
  if(_tuerTex[farbe]) return _tuerTex[farbe];
  const t=tex(256,512,(g,W,H)=>{
    g.fillStyle=farbe; g.fillRect(0,0,W,H);
    /* feine Maserung im Lack */
    for(let i=0;i<500;i++){ g.fillStyle=`rgba(${Math.random()<0.5?0:255},${Math.random()<0.5?0:255},${Math.random()<0.5?0:255},${Math.random()*0.035})`; g.fillRect(Math.random()*W,Math.random()*H,1,rand(6,30)); }
    const kass=(x,y,w,h)=>{ /* erhabene Fuellung: Licht oben links, Schatten unten rechts */
      g.fillStyle='rgba(255,255,255,.13)'; g.fillRect(x,y,w,5); g.fillRect(x,y,5,h);
      g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x,y+h-5,w,5); g.fillRect(x+w-5,y,5,h);
      g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(x+14,y+14,w-28,h-28);
      g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(x+14,y+14,w-28,3); };
    /* Glaseinsatz oben mit Ziergitter */
    const gx=40,gy=42,gw=W-80,gh=150;
    g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(gx-6,gy-6,gw+12,gh+12);
    const gl=g.createLinearGradient(gx,gy,gx+gw,gy+gh); gl.addColorStop(0,'#3d4c62'); gl.addColorStop(0.45,'#1b2433'); gl.addColorStop(1,'#2e3a4d');
    g.fillStyle=gl; g.fillRect(gx,gy,gw,gh);
    g.fillStyle='rgba(200,220,245,.22)'; g.beginPath(); g.moveTo(gx,gy+gh*0.2); g.lineTo(gx+gw*0.45,gy); g.lineTo(gx+gw*0.6,gy); g.lineTo(gx,gy+gh*0.55); g.closePath(); g.fill();
    g.strokeStyle='#15171b'; g.lineWidth=4;
    for(let k=1;k<4;k++){ g.beginPath(); g.moveTo(gx+gw*k/4,gy); g.lineTo(gx+gw*k/4,gy+gh); g.stroke(); }
    g.beginPath(); g.arc(gx+gw/2,gy+gh/2,34,0,Math.PI*2); g.stroke();
    /* zwei Kassetten unten */
    kass(40,232,W-80,110); kass(40,356,W-80,110);
    /* Briefschlitz und Stossblech in Messing */
    g.fillStyle='#b8913e'; g.fillRect(W/2-44,210,88,12); g.fillStyle='#2a2216'; g.fillRect(W/2-36,214,72,4);
    const ms=g.createLinearGradient(0,H-34,0,H); ms.addColorStop(0,'#d3b066'); ms.addColorStop(1,'#8a6a2a');
    g.fillStyle=ms; g.fillRect(0,H-34,W,34);
  });
  t.anisotropy=8; _tuerTex[farbe]=t; return t;
}
function hausTuer(g,tb,th,zf){
  const farbe=pick(TUERFARBEN);
  const leaf=new THREE.MeshStandardMaterial({map:tuerTex(farbe),roughness:0.45,metalness:0.05});
  const kante=std(parseInt(farbe.slice(1),16),{roughness:0.5});
  const messing=std(0xc9a14e,{metalness:0.85,roughness:0.28});
  const rahmen=std(0xd8d2c6,{roughness:0.9});
  const y0=0.57, oh=0.34, lh=th-y0-oh-0.04, lw=tb-0.06, z=zf+0.035;
  /* Tuerblatt: vorn die Textur, Kanten im Lack */
  const blatt=new THREE.Mesh(new THREE.BoxGeometry(lw,lh,0.05),[kante,kante,kante,kante,leaf,kante]);
  blatt.position.set(0,y0+lh/2,z); g.add(blatt);
  /* Oberlicht mit Kaempfer */
  bbox(tb+0.02,0.06,0.09,rahmen,0,y0+lh+0.03,zf+0.05,g,false);
  const ol=new THREE.MeshStandardMaterial({color:LIN(0x2a3548),roughness:0.08,metalness:0.4});
  bbox(lw,oh-0.06,0.02,ol,0,y0+lh+0.06+(oh-0.06)/2,zf+0.02,g,false);
  bbox(0.03,oh-0.06,0.03,rahmen,0,y0+lh+0.06+(oh-0.06)/2,zf+0.04,g,false);
  /* Druecker mit Rosette, rechts auf Hueft-/Handhoehe */
  const dx=lw/2-0.1, dy=y0+1.02;
  const ros=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.012,14),messing); ros.rotation.x=Math.PI/2; ros.position.set(dx,dy,z+0.03); g.add(ros);
  bbox(0.13,0.022,0.022,messing,dx-0.055,dy,z+0.055,g,false);
  const kn=new THREE.Mesh(new THREE.SphereGeometry(0.018,10,8),messing); kn.position.set(dx,dy-0.12,z+0.035); g.add(kn);
  /* Klingeltableau und Hausnummer rechts neben der Tuer */
  const px=tb/2+0.26;
  bbox(0.11,0.26,0.02,std(0xc7ccd4,{metalness:0.7,roughness:0.3}),px,1.55,zf+0.02,g,false);
  for(let k=0;k<3;k++){ const kb=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.012,10),std(0x9aa1ab,{metalness:0.8,roughness:0.25}));
    kb.rotation.x=Math.PI/2; kb.position.set(px+0.02,1.62-k*0.07,zf+0.035); g.add(kb);
    bbox(0.045,0.02,0.004,std(0xf2efe6),px-0.02,1.62-k*0.07,zf+0.032,g,false); }
  const nr=String(1+Math.floor(Math.random()*48));
  plane(0.2,0.15,new THREE.MeshStandardMaterial({map:tex(128,96,(c,W,H)=>{ c.fillStyle='#1d3f86'; c.fillRect(0,0,W,H);
    c.strokeStyle='#f2f5ff'; c.lineWidth=5; c.strokeRect(6,6,W-12,H-12); c.fillStyle='#f2f5ff'; c.font=BUN(52); c.textAlign='center'; c.textBaseline='middle'; c.fillText(nr,W/2,H/2+3); }),roughness:0.35}),
    px,2.05,zf+0.025,0,g);
  /* Wandleuchte ueber der Tuer */
  /* Milchglas: tags hell, nachts leuchtet es ueber lampMats */
  const lm=new THREE.MeshStandardMaterial({color:LIN(0xe9e3d4),emissive:LIN(0xffd9a0),emissiveIntensity:0,roughness:0.3}); lampMats.push(lm);
  bbox(0.07,0.07,0.1,std(0x1e2126,{metalness:0.5}),0,th+0.36,zf+0.05,g,false);
  /* Kappe und Boden aus Metall, dazwischen der Glaskoerper */
  bbox(0.18,0.03,0.16,std(0x1e2126,{metalness:0.5,roughness:0.4}),0,th+0.395,zf+0.14,g,false);
  bbox(0.14,0.16,0.12,lm,0,th+0.3,zf+0.14,g,false);
  bbox(0.16,0.025,0.14,std(0x1e2126,{metalness:0.5,roughness:0.4}),0,th+0.21,zf+0.14,g,false);
}
function drawFassade(g,W,H,o,lit){
  const rows=o.rows, cols=o.cols, base=o.hex;
  if(lit){ g.fillStyle='#000'; g.fillRect(0,0,W,H); } else {
    g.fillStyle=base; g.fillRect(0,0,W,H);
    // Putz-Körnung und Schmutz
    for(let i=0;i<2600;i++){ g.fillStyle=`rgba(${Math.random()<0.5?0:255},${Math.random()<0.5?0:255},${Math.random()<0.5?0:255},${Math.random()*0.05})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
    for(let i=0;i<24;i++){ const x=Math.random()*W, w=rand(6,26);
      const gr=g.createLinearGradient(x,0,x,H); gr.addColorStop(0,'rgba(50,42,34,.16)'); gr.addColorStop(1,'rgba(50,42,34,0)');
      g.fillStyle=gr; g.fillRect(x,rand(0,H*0.5),w,H); }
    // Gesims oben, Sockel unten
    g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(0,10,W,16);
    g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(0,26,W,5);
  }
  const gfH=H*0.3;                      // Erdgeschoss
  const upH=H-gfH-40;                   // Obergeschosse
  const cw=W/cols, rh=upH/rows;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const idx=r*cols+c, on=o.lit[idx%o.lit.length];
    const ww=cw*0.46, wh=rh*0.58, x=cw*(c+0.5)-ww/2, y=44+rh*r+rh*0.2;
    if(lit){
      if(!on) continue;
      const warm=o.warm[idx%o.warm.length];
      g.fillStyle=warm; g.fillRect(x,y,ww,wh);
      g.fillStyle='rgba(0,0,0,.55)'; // Möbel-Silhouetten im Fenster
      if(idx%3===0) g.fillRect(x+ww*0.1,y+wh*0.55,ww*0.35,wh*0.45);
      if(idx%4===1) g.fillRect(x+ww*0.55,y+wh*0.3,ww*0.3,wh*0.7);
      continue;
    }
    g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x-3,y-3,ww+6,wh+6);      // Leibung
    g.fillStyle='#e9e4da'; g.fillRect(x-2,y-2,ww+4,wh+4);              // Rahmen
    g.fillStyle=on?'#2c3646':'#1d242f'; g.fillRect(x,y,ww,wh);          // Glas
    const gr=g.createLinearGradient(x,y,x+ww,y+wh); gr.addColorStop(0,'rgba(190,215,240,.35)'); gr.addColorStop(0.5,'rgba(190,215,240,.05)'); gr.addColorStop(1,'rgba(190,215,240,.18)');
    g.fillStyle=gr; g.fillRect(x,y,ww,wh);
    if(idx%5===2){ g.fillStyle='rgba(225,225,230,.75)'; g.fillRect(x,y,ww,wh*rand(0.25,0.55)); }  // Rollladen
    if(idx%7===3){ g.fillStyle='rgba(200,80,80,.5)'; g.fillRect(x,y,ww*0.2,wh); g.fillRect(x+ww*0.8,y,ww*0.2,wh); } // Vorhänge
    g.fillStyle='#e9e4da'; g.fillRect(x+ww/2-1.5,y,3,wh); g.fillRect(x,y+wh*0.45,ww,3);           // Sprossen
    g.fillStyle='#d8d2c6'; g.fillRect(x-6,y+wh+2,ww+12,7);                                        // Sims
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x-6,y+wh+9,ww+12,4);
    const dg=g.createLinearGradient(x,y+wh+13,x,y+wh+13+rh*0.35); dg.addColorStop(0,'rgba(60,52,44,.2)'); dg.addColorStop(1,'rgba(60,52,44,0)');
    g.fillStyle=dg; g.fillRect(x-4,y+wh+13,ww+8,rh*0.35);
  }
  // Erdgeschoss: Laden oder Haustür
  const gy=H-gfH;
  /* Beim Laden malt die Textur nur den dunklen Grund hinter dem
     Glas. Schild, Schrift, Sprossen und Scheiben sind echte Teile
     davor (buildHaus). Vorher stand beides da: der Ladenname
     einmal als Leuchtkasten und ein zweites Mal gemalt hinter der
     Scheibe, und die gemalten Sprossen passten nicht zu den echten. */
  if(lit){
    if(o.shop){ g.fillStyle=o.shopWarm; g.fillRect(W*0.12,gy+30,W*0.76,gfH-52); }
    return;
  }
  g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,gy-6,W,6);
  if(o.shop){
    /* Schaufenster und Ladentuer sind ausgespart: dahinter steht ein
       echter Laden in 3D (ladenInnen). Vorher war hier eine dunkle,
       gemalte Flaeche hinter getoenter Scheibe (Tom, 26.09.). */
    const hh=o.h, ww=o.w, U=x=>(x/ww+0.5)*W, Vy=y=>H*(1-y/hh), bw=ww*0.78, gf=hh*0.3;
    g.clearRect(U(-bw/2),Vy(gf-0.06),U(bw/2)-U(-bw/2),Vy(0.7)-Vy(gf-0.06));
    g.clearRect(U(ww*0.34-0.4),Vy(gf-0.2),U(ww*0.34+0.4)-U(ww*0.34-0.4),Vy(0.12)-Vy(gf-0.2));
  } else {
    /* Die Haustuer ist ein echtes Bauteil davor (hausTuer) - die
       gemalte Tuer sah von nahem aus wie ein Aufkleber. */
  }
  // Fallrohr
  g.fillStyle='rgba(40,36,32,.7)'; g.fillRect(W-16,34,9,H-34);
  for(let y=60;y<H;y+=90){ g.fillStyle='rgba(30,26,22,.8)'; g.fillRect(W-19,y,15,5); }
  // Sockel
  g.fillStyle='rgba(60,56,50,.55)'; g.fillRect(0,H-16,W,16);
}
/* =========================================================
   Laeden gegenueber mit echtem Innenraum (Tom, 26.09.: "es soll
   wirklich so aussehen, als sind da Laeden drin, gerne 3D").
   Hinter dem ausgesparten Schaufenster: Boden, Decke mit Leuchten,
   Waende und je Ladenart eine eigene Einrichtung. Alles zu zwei
   Meshes verschmolzen (Einrichtung und Leuchten), damit die Zeile
   nicht zu vielen Zeichenaufrufen wird.
   ========================================================= */
let _innenM=null,_lichtM=null;
function ladenInnen(g,typ,w,gfH,zf,farbe){
  if(!_innenM){ _innenM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.7,emissive:LIN(0x40362a),emissiveIntensity:0});
    houseMats.push(_innenM);
    _lichtM=new THREE.MeshBasicMaterial({color:0xfff6e2,toneMapped:false}); }
  const T=[], L=[], D=2.6, x0=-w/2+0.2, x1=w/2-0.2, iw=x1-x0, z1=zf-0.08, z0=z1-D, yb=0.62, yt=gfH-0.02;
  const B=(bw,bh,bd,x,y,z,c)=>T.push({geo:new THREE.BoxGeometry(bw,bh,bd),m:tm(x,y,z),color:c});
  const C=(r1,r2,h,x,y,z,c,seg)=>T.push({geo:new THREE.CylinderGeometry(r1,r2,h,seg||10),m:tm(x,y,z),color:c});
  const K=(r,x,y,z,c,sy)=>T.push({geo:new THREE.SphereGeometry(r,8,6),m:tm(x,y,z,0,0,0,1,sy||1,1),color:c});
  const wand=parseInt(farbe.slice(1),16), hell=new THREE.Color(wand).lerp(new THREE.Color(0xffffff),0.72).getHex();
  /* Raum */
  B(iw,0.04,D,0,yb-0.02,(z0+z1)/2,0xd9d6cf);
  B(iw,0.04,D,0,yt,(z0+z1)/2,0xf2f0ea);
  B(iw,yt-yb,0.05,0,(yb+yt)/2,z0,hell);
  for(const sx of [-1,1]) B(0.05,yt-yb,D,sx*iw/2,(yb+yt)/2,(z0+z1)/2,0xe6e2da);
  /* Deckenleuchten */
  for(let i=0;i<Math.max(2,Math.round(iw/2));i++) L.push({geo:new THREE.BoxGeometry(0.9,0.03,0.25),m:tm(x0+iw*(i+0.5)/Math.max(2,Math.round(iw/2)),yt-0.03,(z0+z1)/2)});
  const regal=(x,bw,faecher,fill)=>{ const hR=yt-yb-0.35;
    B(bw,hR,0.4,x,yb+hR/2,z0+0.22,0xf4f2ee);
    for(let k=0;k<faecher;k++){ const y=yb+0.25+k*(hR-0.3)/Math.max(1,faecher-1);
      B(bw-0.04,0.03,0.38,x,y,z0+0.25,0xdad6ce);
      if(fill) for(let j=0;j<Math.floor(bw/0.16);j++) fill(x-bw/2+0.1+j*0.16,y+0.015,z0+0.3,j+k*7); } };
  const R=[0xc8322a,0x2f5d9e,0xd9a52f,0x3f8a4a,0x8a3a7a,0xe8e4d8,0x2a2e36];
  const theke=(x,bw,c)=>{ B(bw,0.95,0.6,x,yb+0.475,z0+1.35,c); B(bw+0.06,0.04,0.66,x,yb+0.97,z0+1.35,0x3a3f48); };
  const t=typ.toUpperCase();
  if(t.startsWith('BÄCK')){
    regal(x0+iw*0.35,iw*0.6,4,(x,y,z,j)=>K(0.07,x,y+0.05,z,j%3?0xb07a3e:0xd9a45a,0.6));
    theke(x0+iw*0.35,iw*0.6,0xe8e2d4);
    for(let j=0;j<Math.floor(iw*0.55/0.2);j++) K(0.07,x0+iw*0.08+j*0.2,yb+1.02,z0+1.35,j%2?0xc98a45:0x9a5a2a,0.55);
  } else if(t.startsWith('APOTH')){
    regal(x0+iw*0.3,iw*0.5,5,(x,y,z,j)=>B(0.1,0.12,0.12,x,y+0.06,z,j%4?0xf2f2ee:0x3f8a4a));
    regal(x0+iw*0.78,iw*0.35,5,(x,y,z,j)=>B(0.1,0.1,0.1,x,y+0.05,z,j%3?0xe8ecf2:0x2f5d9e));
    theke(x0+iw*0.5,iw*0.5,0xf4f2ee);
    L.push({geo:new THREE.BoxGeometry(0.1,0.34,0.02),m:tm(0,yt-0.35,z0+0.04)}); L.push({geo:new THREE.BoxGeometry(0.34,0.1,0.02),m:tm(0,yt-0.35,z0+0.04)});
  } else if(t.startsWith('BLUM')){
    for(let r=0;r<2;r++) for(let j=0;j<Math.floor(iw/0.5);j++){ const x=x0+0.3+j*0.5, z=z1-0.45-r*0.6;
      C(0.16,0.12,0.36,x,yb+0.18,z,0x5a6068); for(let k=0;k<5;k++) K(0.07,x+rand(-0.1,0.1),yb+0.5+rand(0,0.2),z+rand(-0.1,0.1),R[(j+k+r)%5]); }
    for(let j=0;j<3;j++){ C(0.2,0.16,0.4,x0+0.5+j*iw*0.35,yb+0.2,z0+0.4,0x7a5a3a); K(0.38,x0+0.5+j*iw*0.35,yb+0.8,z0+0.4,0x3f7a3a,1.3); }
  } else if(t.startsWith('WASCH')){
    for(let j=0;j<Math.floor(iw/0.72);j++){ const x=x0+0.4+j*0.72;
      B(0.62,0.88,0.62,x,yb+0.44,z0+0.4,0xf2f2ee); C(0.2,0.2,0.04,x,yb+0.5,z0+0.72,0x2a3a4a,16);
      T[T.length-1].m=tm(x,yb+0.5,z0+0.72,Math.PI/2,0,0); B(0.5,0.08,0.02,x,yb+0.8,z0+0.72,0xb8bec8); }
    B(iw*0.5,0.45,0.4,0,yb+0.22,z1-0.6,0x3a4a6a);
  } else if(t.startsWith('GETR')){
    for(let j=0;j<Math.floor(iw/0.5);j++) for(let k=0;k<4;k++){ const c=R[(j*3+k)%5];
      B(0.4,0.28,0.32,x0+0.3+j*0.5,yb+0.14+k*0.29,z0+0.35,c); B(0.36,0.02,0.28,x0+0.3+j*0.5,yb+0.29+k*0.29,z0+0.35,0x2a2e36); }
    for(let j=0;j<Math.floor(iw/0.7);j++) for(let k=0;k<2;k++) B(0.4,0.28,0.32,x0+0.4+j*0.7,yb+0.14+k*0.29,z0+1.3,R[(j+k)%4]);
  } else if(t.startsWith('PIZZ')){
    theke(x0+iw*0.3,iw*0.45,0x7a3a2a);
    B(0.9,0.9,0.7,x0+iw*0.75,yb+0.7,z0+0.4,0x3a3a3a); L.push({geo:new THREE.BoxGeometry(0.5,0.2,0.02),m:tm(x0+iw*0.75,yb+0.7,z0+0.76)});
    for(let j=0;j<2;j++){ const x=x0+iw*(0.3+j*0.4), z=z1-0.7; C(0.35,0.35,0.04,x,yb+0.74,z,0xe8e2d4,14); C(0.04,0.04,0.72,x,yb+0.36,z,0x3a3f48);
      for(const sx of [-1,1]){ B(0.36,0.04,0.36,x+sx*0.55,yb+0.45,z,0x6a4a2a); B(0.36,0.4,0.04,x+sx*0.55,yb+0.66,z+sx*0,0x6a4a2a); } }
  } else if(t.startsWith('METZ')){
    B(iw*0.8,0.85,0.7,0,yb+0.425,z0+1.4,0xf2f2ee);
    for(let j=0;j<Math.floor(iw*0.75/0.22);j++) K(0.08,-iw*0.37+j*0.22,yb+0.9,z0+1.4,j%3?0xb8403a:0xd88a80,0.5);
    regal(0,iw*0.7,3,(x,y,z,j)=>C(0.04,0.04,0.2,x,y+0.1,z,j%2?0x9a3a2a:0xc9a07a));
  } else if(t.startsWith('FRIS')){
    for(let j=0;j<Math.floor(iw/1.1);j++){ const x=x0+0.6+j*1.1;
      B(0.5,0.12,0.5,x,yb+0.5,z0+0.7,0x1e2228); B(0.5,0.5,0.1,x,yb+0.8,z0+0.47,0x1e2228); C(0.05,0.05,0.4,x,yb+0.22,z0+0.7,0x9aa1ac);
      B(0.7,0.9,0.03,x,yb+1.2,z0+0.05,0xcfe2f2); L.push({geo:new THREE.BoxGeometry(0.7,0.04,0.02),m:tm(x,yb+1.68,z0+0.07)}); }
  } else if(t.startsWith('OPTIK')){
    regal(x0+iw*0.5,iw*0.8,5,(x,y,z,j)=>B(0.12,0.03,0.05,x,y+0.03,z+0.1,j%3?0x2a2e36:0x8a5a3a));
    theke(x0+iw*0.5,iw*0.35,0xf4f2ee); C(0.3,0.3,0.02,x1-0.3,yb+1.3,z0+0.06,0xcfe2f2,20); T[T.length-1].m=tm(x1-0.3,yb+1.3,z0+0.06,Math.PI/2,0,0);
  } else if(t.startsWith('REISE')){
    for(let j=0;j<Math.floor(iw/1.4);j++){ const x=x0+0.8+j*1.4;
      B(1.1,0.05,0.6,x,yb+0.74,z0+1.0,0xe8e2d4); B(0.05,0.72,0.5,x-0.5,yb+0.36,z0+1.0,0x3a3f48); B(0.05,0.72,0.5,x+0.5,yb+0.36,z0+1.0,0x3a3f48);
      B(0.45,0.3,0.03,x,yb+0.95,z0+0.85,0x1e2228); }
    for(let j=0;j<Math.floor(iw/0.9);j++) B(0.7,0.5,0.02,x0+0.5+j*0.9,yb+1.35,z0+0.04,R[j%5]);
  } else {
    /* Kiosk und Schreibwaren: Zeitschriftenstaender und volle Regale */
    regal(x0+iw*0.3,iw*0.5,5,(x,y,z,j)=>B(0.12,0.16,0.08,x,y+0.08,z,R[j%7]));
    for(let k=0;k<4;k++) for(let j=0;j<Math.floor(iw*0.4/0.22);j++){ const pa={geo:new THREE.BoxGeometry(0.2,0.28,0.01),m:tm(x0+iw*0.62+j*0.22,yb+0.4+k*0.32,z0+0.35+k*0.06,-0.3,0,0),color:R[(j+k)%7]}; T.push(pa); }
    theke(x0+iw*0.7,iw*0.4,0x3a4a6a);
  }
  const mm=new THREE.Mesh(merge(T),_innenM); g.add(mm);
  if(L.length) g.add(new THREE.Mesh(merge(L.map(l=>Object.assign(l,{color:0xffffff}))),_lichtM));
}
function buildHaus(x,z,w,d,h,o){
  const g=new THREE.Group(); g.position.set(x,0,z);
  /* Die texturierte Front liegt auf +z. Die Zeile steht aber jenseits der
     Strasse, also muss sie sich zum Laden drehen. */
  g.rotation.y=Math.PI; scene.add(g);
  const q=COARSE?0.5:1, px=Math.round(clamp(w*46,192,512)*q), py=Math.round(clamp(h*46,256,640)*q);
  o.w=w; o.h=h;
  const m=new THREE.MeshStandardMaterial({color:LIN(0xffffff),roughness:0.94,alphaTest:o.shop?0.5:0,
    map:tex(px,py,(c,W,H)=>drawFassade(c,W,H,o,false)),
    emissive:LIN(0xffffff),emissiveMap:tex(px,py,(c,W,H)=>drawFassade(c,W,H,o,true)),emissiveIntensity:0});
  houseMats.push(m);
  const side=new THREE.MeshStandardMaterial({color:LIN(o.hexN),roughness:0.96});
  const mats=[side,side,std(0x6a6258,{roughness:1}),side,m,side];
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats); b.position.y=h/2;
  if(HIQ){ b.castShadow=true; b.receiveShadow=true; } g.add(b);
  // Attika und Gesims
  bbox(w+0.34,0.3,d+0.34,std(0x5f584e,{roughness:1}),0,h+0.14,0,g);
  bbox(w+0.42,0.16,d+0.42,std(0x7a7266,{roughness:1}),0,h-0.16,0,g);
  bbox(w+0.1,0.1,d+0.1,std(0xe8ecf2,{roughness:1}),0,h+0.34,0,g,false);   // Schnee auf der Attika
  // Schornsteine, Antennen, Satellitenschüsseln
  const nch=1+Math.floor(Math.random()*2);
  for(let i=0;i<nch;i++){ const cx=rand(-w*0.3,w*0.3), cz=rand(-d*0.25,d*0.25), ch=rand(0.7,1.4);
    bbox(0.5,ch,0.5,std(0x7a4a3c,{roughness:1}),cx,h+ch/2,cz,g);
    bbox(0.62,0.1,0.62,std(0x4a4640),cx,h+ch+0.05,cz,g,false);
    bbox(0.5,0.06,0.5,std(0xe8ecf2),cx,h+ch+0.12,cz,g,false); }
  if(Math.random()<0.6){ const px2=rand(-w*0.35,w*0.35);
    bbox(0.05,rand(0.8,1.6),0.05,std(0x3a3f48),px2,h+0.8,-d*0.2,g,false);
    const dish=new THREE.Mesh(new THREE.SphereGeometry(0.28,10,6,0,Math.PI*2,0,Math.PI*0.42),std(0xd8d8d2));
    dish.position.set(px2+0.1,h+1.2,-d*0.2); dish.rotation.x=1.1; g.add(dish); }
  /* --- Plastische Fassade: Sockel, Fensterbaenke, Schaufensterfront,
     Regenrinne und Fallrohr. Nimmt der Front das Kulissenhafte. --- */
  const zf=d/2;
  const stein=std(0x6f6a62,{roughness:0.96});
  
  /* Sockel */
  bbox(w+0.12,0.55,d+0.12,stein,0,0.275,0,g);
  bbox(w+0.16,0.07,d+0.16,std(0x8a857c,{roughness:0.9}),0,0.58,0,g,false);
  /* Wohnhaus ohne Laden: echte Haustuer statt Schaufenster. Vorher
     bekam jedes Haus die Glasfront, und hinter der Scheibe sah man
     die aufgemalte Haustuer. Rahmen, Sturz und Stufen sitzen genau
     um die gemalte Tuer (Textur: 38 bis 62 % der Breite). */
  if(!o.shop){
    /* Tuer in echter Groesse: 1,20 m breit, Sturz auf 2,85 m (Blatt
       ab der Schwelle rund 1,90 m plus Oberlicht). Vorher w*0.24 breit
       - bei breiten Haeusern ein 2,30 m breites Scheunentor. */
    const tb=1.2, th=2.85, stein2=std(0x8a857c,{roughness:0.9});
    const rahmen=std(0xd8d2c6,{roughness:0.9});
    for(const sx of [-1,1]) bbox(0.12,th-0.55,0.1,rahmen,sx*(tb/2+0.06),0.55+(th-0.55)/2,zf+0.05,g,false);
    bbox(tb+0.36,0.14,0.14,rahmen,0,th+0.07,zf+0.07,g,false);
    /* Stufen bis zur Schwelle ueber dem Sockel */
    for(let k=0;k<3;k++) bbox(tb+0.3,0.19,0.32*(3-k),stein2,0,0.095+k*0.19,zf+0.06+0.16*(3-k),g,false);
    hausTuer(g,tb,th,zf);
  }
  /* Erdgeschoss als echte Schaufensterfront */
  if(o.shop){
    const gfH=h*0.3, rahmen=std(0x2f3540,{metalness:0.3,roughness:0.5});
    const scheibe=new THREE.MeshStandardMaterial({color:LIN(0xcfe2f2),roughness:0.05,metalness:0.3,transparent:true,opacity:0.18,depthWrite:false});
    ladenInnen(g,o.shopName||'LADEN',w,gfH,zf,o.shopSign||'#2b3a5e');
    const bw=w*0.78;
    bbox(bw+0.16,0.22,0.22,rahmen,0,gfH+0.05,zf+0.1,g,false);          // Sturz
    bbox(bw+0.16,0.16,0.22,rahmen,0,0.62,zf+0.1,g,false);              // Brueste
    const np=Math.max(2,Math.round(bw/1.5));
    for(let i=0;i<=np;i++) bbox(0.1,gfH-0.5,0.2,rahmen,-bw/2+i*(bw/np),0.68+(gfH-0.5)/2,zf+0.1,g,false);
    const sc=bbox(bw,gfH-0.56,0.05,scheibe,0,0.7+(gfH-0.56)/2,zf+0.06,g,false);
    /* Eingangstuer seitlich */
    /* Glastuer: Rahmen aus Profilen statt eines massiven Blocks - man
       sieht durch die Tuer in den Laden */
    { const tx=w*0.34, th2=gfH-0.1;
      for(const sx of [-1,1]) bbox(0.08,th2,0.1,rahmen,tx+sx*0.435,th2/2,zf+0.12,g,false);
      bbox(0.95,0.08,0.1,rahmen,tx,th2-0.04,zf+0.12,g,false);
      bbox(0.95,0.14,0.1,rahmen,tx,0.07,zf+0.12,g,false);
      bbox(0.8,th2-0.22,0.02,scheibe,tx,(th2-0.22)/2+0.14,zf+0.12,g,false);
      bbox(0.03,0.5,0.05,std(0xb8bec8,{metalness:0.8,roughness:0.3}),tx-0.3,1.1,zf+0.18,g,false); }
    /* Leuchtkasten mit Ladenname */
    if(o.shop){
      const sm=new THREE.MeshStandardMaterial({color:LIN(0xf2efe6),roughness:0.7,
        emissive:LIN(0xffffff),emissiveIntensity:0,
        map:tex(512,96,(c,W2,H2)=>{ c.fillStyle=o.shopSign||'#2b3a5e'; c.fillRect(0,0,W2,H2);
          c.fillStyle='#f6f3ea'; c.textAlign='center'; c.textBaseline='middle';
          fitFont(c,o.shopName||'LADEN',W2-40,58,BUN); c.fillText(o.shopName||'LADEN',W2/2,H2/2+3); }),
        emissiveMap:tex(512,96,(c,W2,H2)=>{ c.fillStyle='#000'; c.fillRect(0,0,W2,H2);
          c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle';
          fitFont(c,o.shopName||'LADEN',W2-40,58,BUN); c.fillText(o.shopName||'LADEN',W2/2,H2/2+3); })});
      houseMats.push(sm);
      bbox(bw*0.92,0.42,0.14,sm,0,gfH+0.36,zf+0.14,g,false);
      bbox(bw*0.96,0.06,0.2,std(0x3a3f48),0,gfH+0.6,zf+0.15,g,false);
    }
  }
  /* Fensterbaenke und Leibungen passend zum Texturraster */
  {
    const gfH=h*0.3, upH=h-gfH-0.9, cw=w/o.cols, rh=upH/o.rows;
    const bank=std(0xd8d4cc,{roughness:0.9});
    for(let r=0;r<o.rows;r++) for(let c=0;c<o.cols;c++){
      const ww=cw*0.46;
      const x=-w/2+cw*(c+0.5);
      const y=h-0.9-rh*r-rh*0.2-rh*0.58;
      bbox(ww+0.16,0.07,0.16,bank,x,y-0.04,zf+0.06,g,false);
      bbox(ww+0.16,0.04,0.1,std(0xe8ecf2),x,y+0.01,zf+0.08,g,false);
      for(const sx of [-1,1]) bbox(0.07,rh*0.58,0.09,std(0xdad5cb,{roughness:0.95}),x+sx*(ww/2+0.05),y+rh*0.29,zf+0.04,g,false);
    }
  }
  /* Regenrinne und Fallrohr */
  {
    const zn=std(0x8f959e,{metalness:0.45,roughness:0.55});
    bbox(w+0.3,0.12,0.16,zn,0,h-0.3,zf+0.2,g,false);
    const fx=w/2-0.2;
    bbox(0.11,h-0.4,0.11,zn,fx,(h-0.4)/2,zf+0.16,g,false);
    bbox(0.15,0.13,0.15,zn,fx,h-0.38,zf+0.16,g,false);
    bbox(0.15,0.13,0.15,zn,fx,0.25,zf+0.16,g,false);
  }
  // Balkone
  if(o.balkon){ for(let i=0;i<o.balkonN;i++){ const by=h*0.42+i*h*0.22, bx=rand(-w*0.25,w*0.25);
    bbox(1.9,0.12,0.85,std(0xb9b2a6,{roughness:1}),bx,by,d/2+0.42,g);
    bbox(1.9,0.06,0.85,std(0xe8ecf2),bx,by+0.09,d/2+0.42,g,false);
    for(let k=0;k<7;k++) bbox(0.04,0.5,0.04,std(0x45505e,{metalness:0.4}),bx-0.85+k*0.28,by+0.31,d/2+0.83,g,false);
    bbox(1.9,0.05,0.05,std(0x45505e,{metalness:0.4}),bx,by+0.56,d/2+0.83,g,false); } }
  /* Markise ueber dem Schaufenster. Sie haengt unter dem Leuchtkasten
     und faellt nach vorn ab. Vorher sass sie auf Hoehe des Schilds,
     stieg nach vorn an und verdeckte den Ladennamen. */
  if(o.shop&&Math.random()<0.7){
    const gfH=h*0.3, T=1.2, neig=0.24;
    const mt=tex(128,64,(c,W,H)=>{ for(let i=0;i<8;i++){ c.fillStyle=i%2?o.shopSign:'#f2efe6'; c.fillRect(i*W/8,0,W/8,H); } });
    const ag=new THREE.Group();
    /* Innenkante direkt unter dem Schild, vor Sturz und Schildkasten */
    ag.position.set(0,gfH+0.08,zf+0.24); ag.rotation.x=neig; g.add(ag);
    const aw=new THREE.Mesh(new THREE.BoxGeometry(w*0.8,0.06,T),new THREE.MeshStandardMaterial({map:mt,roughness:0.9}));
    aw.position.set(0,0,T/2); if(HIQ) aw.castShadow=true; ag.add(aw);
    /* Volant vorn und Schnee obendrauf, beide in der Neigung */
    bbox(w*0.8,0.2,0.03,new THREE.MeshStandardMaterial({map:mt,roughness:0.9}),0,-0.1,T,ag,false);
    bbox(w*0.8-0.06,0.035,T-0.1,std(0xe8ecf2,{roughness:1}),0,0.048,T/2,ag,false);
    /* Halter an der Wand */
    for(const sx of [-1,1]) bbox(0.05,0.05,0.26,std(0x3a3f48,{metalness:0.5}),sx*w*0.38,gfH+0.05,zf+0.13,g,false);
  }
  return g;
}
/* =========================================================
   Autos am Bordstein.
   Die Masse sind echte Fahrzeugmasse, keine geschaetzten: eine
   Limousine ist 4,62 m lang und 1,45 m hoch, nicht 1,84 m, und der
   Radstand betraegt 2,76 m. Vorher stand da ein zu hoher Kasten mit
   zu kurzem Radstand - das liest sich sofort als Spielzeug.
   Entscheidend ist ausserdem das Rad: eine Felge ist innen offen und
   dunkel, mit hellen Speichen und hellem Horn davor. Eine massive
   helle Scheibe, wie sie hier vorher steckte, gibt es an keinem Auto.
   ========================================================= */
const AUTOFORM={
  /* L/B/H und Radstand nach gaengigen Fahrzeugen der Klasse.
     vu/hu sind die Ueberhaenge - der Kombi hat hinten deutlich mehr,
     der Kleinwagen vorn und hinten wenig. */
  limo : {L:4.62,B:1.80,H:1.45,rad:0.330,kabL:2.26,kabZ:-0.30,vu:0.86,hu:0.98,stufe:true },
  kombi: {L:4.76,B:1.81,H:1.49,rad:0.330,kabL:2.78,kabZ:-0.46,vu:0.88,hu:1.18,stufe:false},
  suv  : {L:4.58,B:1.87,H:1.68,rad:0.365,kabL:2.52,kabZ:-0.34,vu:0.90,hu:0.98,stufe:false},
  van  : {L:4.55,B:1.83,H:1.70,rad:0.330,kabL:2.70,kabZ:-0.22,vu:0.87,hu:0.96,stufe:false},
  klein: {L:4.05,B:1.74,H:1.46,rad:0.305,kabL:2.06,kabZ:-0.34,vu:0.72,hu:0.78,stufe:false}
};
let _lackM=null,_gummiM=null,_glasM=null,_chromM=null,_autoEnv=null;
/* Umgebung zum Spiegeln (Tom, 26.09.: "Autos deutlich schoener und
   echter"). Ohne Umgebung spiegelt Lack nichts, und Lack und Scheiben
   verschwimmen zu einer dunklen Masse. Ein kleines Panorama - Himmel,
   helle Horizontkante, Haeuserzeile, Strasse - reicht, damit Lack,
   Glas und Chrom lesbar werden. Nachts wird die Spiegelung gedimmt. */
function autoUmgebung(){
  if(_autoEnv!==null) return _autoEnv||null;
  _autoEnv=false;
  try{
    if(!THREE.PMREMGenerator) return null;
    const t=tex(512,256,(g,W,H)=>{
      const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#7f9cbc'); gr.addColorStop(0.44,'#dfe8f1'); gr.addColorStop(0.5,'#f6f8fa');
      gr.addColorStop(0.52,'#4a4e55'); gr.addColorStop(1,'#1c1e22'); g.fillStyle=gr; g.fillRect(0,0,W,H);
      /* Haeuserkante am Horizont bricht die Spiegelung wie in einer Strasse */
      for(let x=0;x<W;){ const w=8+Math.random()*30, h=10+Math.random()*48; g.fillStyle=`rgb(${60+Math.random()*50|0},${64+Math.random()*50|0},${72+Math.random()*50|0})`;
        g.fillRect(x,H*0.5-h,w,h); x+=w+Math.random()*6; }
      g.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<5;i++) g.fillRect(Math.random()*W,H*0.08+Math.random()*H*0.2,40,6);
    });
    t.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(renderer);
    _autoEnv=pm.fromEquirectangular(t).texture; pm.dispose();
  }catch(e){ _autoEnv=false; }
  return _autoEnv||null;
}
function autoMats(){
  if(!_lackM){
    const env=autoUmgebung();
    const Phys=THREE.MeshPhysicalMaterial||THREE.MeshStandardMaterial;
    /* Metalliclack mit Klarlack, Glas spiegelt stark, Chrom ganz */
    _lackM=new Phys({vertexColors:true,roughness:0.42,metalness:0.45,envMap:env,envMapIntensity:1});
    if('clearcoat' in _lackM){ _lackM.clearcoat=1; _lackM.clearcoatRoughness=0.07; }
    _glasM=new Phys({vertexColors:true,roughness:0.04,metalness:0.35,envMap:env,envMapIntensity:1.2});
    if('clearcoat' in _glasM){ _glasM.clearcoat=1; _glasM.clearcoatRoughness=0.02; }
    _chromM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.16,metalness:1,envMap:env,envMapIntensity:1.1});
    _gummiM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.92,metalness:0.02});
  }
}
/* nachts spiegelt der Himmel nicht mehr hell */
function autoNacht(f){ const k=1-0.85*f; if(typeof _wasserM!=='undefined'&&_wasserM) _wasserM.envMapIntensity=0.9*k; if(!_lackM) return; _lackM.envMapIntensity=k; _glasM.envMapIntensity=1.2*k; _chromM.envMapIntensity=1.1*k; }
/* Seitenprofil als Form, ueber die Breite extrudiert und gerundet.
   Profilkoordinaten: x = Laenge (vorn positiv), y = Hoehe. */
function autoExtrude(shape,breite,bev,form){
  /* genug Querschnitte, damit sich die Breite verformen laesst */
  const geo=new THREE.ExtrudeGeometry(shape,{depth:Math.max(0.02,breite-2*bev),bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:HIQ?4:2,curveSegments:HIQ?16:8,steps:HIQ?6:3});
  geo.rotateY(-Math.PI/2);
  geo.computeBoundingBox(); const bb=geo.boundingBox; geo.translate(-(bb.min.x+bb.max.x)/2,0,0);
  /* form(x,y,z) -> Faktor auf die Breite: runde Ecken im Grundriss,
     eingezogene Flanke, schraege Kanzel */
  if(form){ const pa=geo.attributes.position; for(let i=0;i<pa.count;i++) pa.setX(i,pa.getX(i)*form(pa.getY(i),pa.getZ(i))); }
  glatteNormalen(geo,50);
  return geo;
}
/* Weiche Normalen fuer nicht indizierte Geometrie: Ecken an derselben
   Stelle mitteln ihre Flaechennormalen, solange der Knick unter der
   Grenze bleibt - runde Flaechen werden glatt, Kanten bleiben Kanten.
   Ohne das sah die Karosserie facettiert aus wie ein Low-Poly-Modell. */
function glatteNormalen(geo,grad){
  const pa=geo.attributes.position, n=pa.count, fn=new Float32Array(n*3), cg=Math.cos(grad*Math.PI/180);
  const a=new THREE.Vector3(), b=new THREE.Vector3(), c=new THREE.Vector3();
  for(let i=0;i+2<n;i+=3){ a.fromBufferAttribute(pa,i); b.fromBufferAttribute(pa,i+1); c.fromBufferAttribute(pa,i+2);
    b.sub(a); c.sub(a); b.cross(c); const l=b.length()||1; b.divideScalar(l);
    for(let k=0;k<3;k++){ fn[(i+k)*3]=b.x; fn[(i+k)*3+1]=b.y; fn[(i+k)*3+2]=b.z; } }
  const gruppen=new Map();
  for(let i=0;i<n;i++){ const key=Math.round(pa.getX(i)*2000)+'|'+Math.round(pa.getY(i)*2000)+'|'+Math.round(pa.getZ(i)*2000);
    let g=gruppen.get(key); if(!g) gruppen.set(key,g=[]); g.push(i); }
  const out=new Float32Array(n*3);
  for(const g of gruppen.values()) for(const i of g){ let x=0,y=0,z=0;
    for(const j of g){ const d=fn[i*3]*fn[j*3]+fn[i*3+1]*fn[j*3+1]+fn[i*3+2]*fn[j*3+2]; if(d>=cg){ x+=fn[j*3]; y+=fn[j*3+1]; z+=fn[j*3+2]; } }
    const l=Math.hypot(x,y,z)||1; out[i*3]=x/l; out[i*3+1]=y/l; out[i*3+2]=z/l; }
  geo.setAttribute('normal',new THREE.BufferAttribute(out,3));
}
const glatt01=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
function makeAuto(col,form){
  form=AUTOFORM[form]?form:pick(['limo','kombi','suv','van','klein']);
  autoMats();
  const F=AUTOFORM[form];
  const L=F.L, B=F.B, rad=F.rad, kabL=F.kabL;
  let kabZ=F.kabZ;
  const schwelle=rad*0.92;                  /* Unterkante Tuer        */
  const gurt=F.H*(F.stufe?0.655:0.640);     /* Unterkante Seitenfenster */
  const dach=F.H;                           /* Dachhaut               */
  const gh=dach-gurt;                       /* Hoehe der Fahrgastzelle */
  const vA= L/2-F.vu, hA=-(L/2-F.hu);       /* Radmitten */
  const RX=B/2-0.125;                       /* Rad buendig unter der Flanke */

  const lack=[], gummi=[], glasT=[], chromT=[];
  const dunkel=0x15171d, glas=0x10161e, chrome=0xd6dae0, alu=0xb4bac4;
  const SEG=HIQ?4:2;
  const RB=(w,h,d,r)=>roundedBoxGeo(w,h,d,r,SEG);
  const CY=(r1,r2,h,sg)=>new THREE.CylinderGeometry(r1,r2,h,sg||(HIQ?18:10));
  const P=(a,geo,x,y,z,rx,ry,rz,c)=>a.push({geo,m:tm(x,y,z,rx||0,ry||0,rz||0),color:c});
  /* Farbe entscheidet, welches Material ein Teil bekommt */
  const K=(geo,x,y,z,rx,ry,rz,c)=>P(c===glas||c===0xcfdae8?glasT:(c===chrome||c===alu||c===0xf6f4ea)?chromT:lack,geo,x,y,z,rx,ry,rz,c);
  const G=(geo,x,y,z,rx,ry,rz,c)=>P(gummi,geo,x,y,z,rx,ry,rz,c);

  /* ---------- Karosserie ----------
     Ein Seitenprofil statt gestapelter Kaesten: Nase, fallende Haube,
     Guertellinie, Heck und echte Radausschnitte, rundum gerundet. */
  const y0=schwelle-0.08, lampY0=gurt-(gurt-schwelle)*0.30, nase=L/2, heck=-L/2;
  const aF=0.60, aH=F.stufe?0.52:0.20;
  const wsZ=gh*Math.tan(aF), rwZ=gh*Math.tan(aH);
  /* Kombi, SUV, Van, Kleinwagen: die Kabine reicht bis ans Heck */
  let zF=kabZ+kabL/2, zH=kabZ-kabL/2;
  if(!F.stufe){ zH=heck+0.10+rwZ*0.35; }
  /* Die Rundungskante legt bv rundum auf das Profil - deshalb liegt
     die Kontur um bv innen, sonst verschwinden Scheinwerfer in der Nase
     und die Radlaeufe werden zu eng */
  const bv=0.09, nI=nase-bv, hI=heck+bv, yb=y0+bv;
  const unten=new THREE.Shape();
  const bogen=(z)=>{ const r=rad+0.075+bv; unten.lineTo(z-r,yb); unten.absarc(z,rad+0.01,r,Math.PI,0,true); };
  unten.moveTo(hI+0.12,yb);
  bogen(hA); bogen(vA);
  unten.lineTo(nI-0.12,yb);
  unten.quadraticCurveTo(nI,yb,nI,yb+0.12);
  unten.lineTo(nI,lampY0+0.04);
  const nasenH=gurt-bv-(form==='van'?0.06:0.13);
  unten.quadraticCurveTo(nI,nasenH-0.02,nI-0.16,nasenH);
  unten.quadraticCurveTo(zF+0.35,gurt+0.02-bv,zF,gurt+0.02-bv);
  unten.lineTo(zH,gurt+0.02-bv);
  if(F.stufe){ unten.quadraticCurveTo(hI+0.3,gurt+0.02-bv,hI+0.06,gurt-0.03-bv); }
  else unten.lineTo(hI+0.06,gurt+0.02-bv);
  unten.quadraticCurveTo(hI,gurt-0.05-bv,hI,lampY0);
  unten.lineTo(hI,yb+0.12);
  unten.quadraticCurveTo(hI,yb,hI+0.12,yb);
  /* im Grundriss runde Front und Heck, oberhalb der Schulter eingezogen */
  const rundZ=(z,r)=>1-r*Math.pow(glatt01(L/2-0.55,L/2,Math.abs(z)),2);
  const flanke=(y,z)=>rundZ(z,0.07)*(1-0.05*glatt01(gurt-0.22,gurt+0.02,y))*(1-0.03*glatt01(schwelle+0.1,y0,y));
  P(lack,autoExtrude(unten,B,0.09,flanke),0,0,0,0,0,0,col);
  /* Glaskanzel: schmaler als die Flanke (Tumblehome), Dach gewoelbt */
  const kz=new THREE.Shape(), dy=dach-0.035;
  kz.moveTo(zF,gurt);
  kz.lineTo(zF-wsZ,dy-0.03);
  kz.quadraticCurveTo((zF-wsZ+zH+rwZ)/2,dy+0.05,zH+rwZ,dy-0.03);
  kz.lineTo(zH,gurt);
  kz.lineTo(zF,gurt);
  /* Kanzel neigt sich nach innen (Tumblehome) */
  const kanzel=(y,z)=>1-0.14*glatt01(gurt,dach,y);
  P(glasT,autoExtrude(kz,B-0.2,0.07,kanzel),0,0,0,0,0,0,glas);
  /* Dachhaut: die obere Kante der Kanzel, etwas breiter, in Wagenfarbe */
  { const d0=new THREE.Shape(), a0=zF-wsZ-0.05, a1=zH+rwZ+0.05, m=(a0+a1)/2;
    d0.moveTo(a0+0.02,dy-0.05); d0.quadraticCurveTo(m,dy+0.03,a1-0.02,dy-0.05);
    d0.lineTo(a1,dy); d0.quadraticCurveTo(m,dy+0.09,a0,dy); d0.lineTo(a0+0.02,dy-0.05);
    P(lack,autoExtrude(d0,(B-0.2)*0.87+0.05,0.05),0,0,0,0,0,0,col); }
  const dachL=Math.max(0.42,(zF-wsZ)-(zH+rwZ)), dachZ=(zF-wsZ+zH+rwZ)/2;
  const mY=(gurt+dach)/2;
  /* A-, B- und C-Saeulen auf der Kanzel */
  for(const s of [-1,1]){
    const xs=(B/2-0.12)*0.93, neig=-s*0.14;
    K(RB(0.07,gh/Math.cos(aF)+0.02,0.07,0.03), s*xs, mY, zF-wsZ/2, -aF,0,neig, col);
    K(RB(0.07,gh/Math.cos(aH)+0.02,0.12,0.03), s*xs, mY, zH+rwZ/2,  aH,0,neig, col);
    K(RB(0.05,gh*0.94,0.09,0.02), s*(xs+0.01), gurt+gh*0.49, kabZ+kabL*0.02, 0,0,neig, 0x15181e);
    if(!F.stufe) K(RB(0.05,gh*0.9,0.09,0.02), s*(xs+0.01), gurt+gh*0.47, (zH+rwZ*0.5+kabZ-kabL*0.3)/2, 0,0,neig, 0x15181e);
    /* Fensterbruestung und Dachreling in Chrom */
    K(RB(0.03,0.028,(zF-wsZ*0.3)-(zH+rwZ*0.3),0.01), s*(B/2-0.095), gurt+0.03, (zF-wsZ*0.3+zH+rwZ*0.3)/2, 0,0,0, chrome);
    if(form==='kombi'||form==='suv') K(RB(0.035,0.035,dachL*0.9,0.012), s*(B/2-0.2), dach+0.05, dachZ, 0,0,0, alu);
  }
  const kh=gurt-schwelle;
  /* Schweller matt */
  G(RB(B-0.02,0.08,Math.abs(vA-hA)-2*rad-0.15,0.03), 0, y0+0.03, (vA+hA)/2, 0,0,0, 0x1b1e24);

  /* ---------- Raeder ----------
     Reifen mit Flanke, Felge innen dunkel und offen, davor Speichen
     und Felgenhorn. Radlauf als halber Ring in Wagenfarbe. */
  for(const sx of [-1,1]) for(const z of [vA,hA]){
    const x=sx*RX;
    /* Radlauf: der Bogen selbst und eine schmale, leicht ausgestellte
       Kante davor - ohne die sitzt das Rad wie in einem Loch. */
    /* dunkler Radkasten hinter dem Rad */
    G(CY(rad+0.07,rad+0.07,0.05,HIQ?20:10), x-sx*0.2, rad+0.01, z, 0,0,Math.PI/2, 0x0c0d10);
    G(CY(rad,rad,0.205),                 x, rad, z, 0,0,Math.PI/2, 0x16181c);
    G(CY(rad*0.995,rad*0.995,0.215,HIQ?24:12), x, rad, z, 0,0,Math.PI/2, 0x1d2027);
    /* dunkle Felgenschuessel - das Loch, durch das man die Bremse sieht */
    G(CY(rad*0.63,rad*0.63,0.225),       x*1.004, rad, z, 0,0,Math.PI/2, 0x2a2e35);
    K(new THREE.TorusGeometry(rad*0.615,0.026,6,HIQ?18:10),
      x*1.018, rad, z, 0,Math.PI/2,0, alu);
    for(let k=0;k<5;k++){ const a=k/5*Math.PI*2;
      K(RB(0.045,rad*0.56,0.038,0.015),
        x*1.016, rad+Math.cos(a)*rad*0.30, z+Math.sin(a)*rad*0.30, 0,0,a, alu); }
    K(CY(rad*0.15,rad*0.15,0.235,10),    x*1.02, rad, z, 0,0,Math.PI/2, 0x8d939d);
    K(CY(rad*0.055,rad*0.055,0.245,8),   x*1.03, rad, z, 0,0,Math.PI/2, chrome);
  }

  /* ---------- Front und Heck ---------- */
  const lampY=gurt-kh*0.30;
  /* Stossfaenger sind lackiert und schliessen buendig ab; dunkel
     bleibt nur die Schuerze darunter. Vorher standen vorn und hinten
     zwei schwarze Kloetze ueber die Karosserie hinaus. */
  /* Stossfaenger sind Teil des Profils; darunter nur die dunkle Schuerze */
  G(RB(B*0.82,0.11,0.12,0.05), 0, y0+0.05,  L/2-0.07, 0,0,0, 0x24282f);
  G(RB(B*0.82,0.11,0.12,0.05), 0, y0+0.05, -L/2+0.07, 0,0,0, 0x24282f);
  G(RB(B-0.42,0.06,0.10,0.02), 0, schwelle-0.03,  L/2-0.06, 0,0,0, 0x6f757e);
  /* Kuehlergrill */
  K(RB(B*0.52,0.17,0.08,0.03), 0, lampY+0.02, L/2-0.02, 0,0,0, 0x101319);
  for(let k=0;k<3;k++) K(RB(B*0.50,0.018,0.05,0.008), 0, lampY-0.04+k*0.05, L/2+0.005, 0,0,0, chrome);
  for(const s of [-1,1]){
    /* Scheinwerfer: dunkles Gehaeuse, Glas, zwei Reflektoren */
    K(RB(0.42,0.15,0.13,0.05), s*(B/2-0.33), lampY+0.02, L/2-0.07, 0,0,0, 0x191c22);
    K(RB(0.39,0.12,0.06,0.03), s*(B/2-0.33), lampY+0.02, L/2-0.015, 0,0,0, 0xcfdae8);
    for(const dx of [-0.085,0.085])
      K(CY(0.048,0.048,0.05,10), s*(B/2-0.33)+dx, lampY+0.02, L/2+0.0, Math.PI/2,0,0, 0xf6f4ea);
    /* Rueckleuchten */
    K(RB(0.36,0.20,0.11,0.04), s*(B/2-0.27), lampY+0.06, -L/2+0.05, 0,0,0, 0x2a1214);
    K(RB(0.32,0.16,0.05,0.02), s*(B/2-0.27), lampY+0.06, -L/2+0.005,0,0,0, 0x9a2a24);
    K(RB(0.09,0.08,0.04,0.015),s*(B/2-0.42), lampY+0.06, -L/2-0.005,0,0,0, 0xe8b060);
    K(RB(0.08,0.07,0.04,0.015),s*(B/2-0.13), lampY+0.06, -L/2-0.005,0,0,0, 0xf2f2ee);
    /* Spiegel am Fuss der A-Saeule */
    K(RB(0.07,0.04,0.07,0.02), s*(B/2-0.02), gurt+gh*0.20, kabZ+kabL/2-0.10, 0,0,0, col);
    K(RB(0.17,0.10,0.07,0.03), s*(B/2+0.07), gurt+gh*0.22, kabZ+kabL/2-0.14, 0,0,0.10, col);
    K(RB(0.13,0.075,0.02,0.008),s*(B/2+0.11),gurt+gh*0.22, kabZ+kabL/2-0.14, 0,0,0.10, 0x4e545e);
    /* Tuergriffe und Fugen */
    for(const dz of [kabZ+kabL*0.20, kabZ-kabL*0.24])
      K(RB(0.035,0.038,0.17,0.014), s*(B/2+0.002), gurt-0.10, dz, 0,0,0, chrome);
    K(RB(0.01,kh*0.80,0.016,0.004), s*(B/2+0.006), schwelle+kh*0.52, kabZ+kabL/2-0.16, 0,0,0, 0x0d0f14);
    K(RB(0.01,kh*0.62,0.016,0.004), s*(B/2+0.006), schwelle+kh*0.52, kabZ-kabL*0.30, 0,0,0, 0x0d0f14);
  }
  /* Kennzeichen */
  for(const sz of [1,-1]) K(RB(0.50,0.11,0.025,0.01), 0, schwelle+0.20, sz*(L/2+0.02), 0,0,0, 0xf2f2ee);
  /* Tankklappe, Scheibenwischer, Auspuff, Antenne */
  K(RB(0.012,0.16,0.16,0.015), B/2+0.006, gurt-kh*0.30, hA-0.22, 0,0,0, 0x0d0f14);
  for(const s of [-1,1])
    K(RB(0.38,0.018,0.018,0.007), s*0.28, gurt+0.03, kabZ+kabL/2+0.12, 0,0,s*0.22, 0x1b1e25);
  G(CY(0.04,0.045,0.13,10), 0.40, schwelle-0.02, -L/2-0.02, Math.PI/2,0,0, 0x9aa1ac);
  K(CY(0.009,0.014,0.24,6), 0, dach+0.09, kabZ-kabL/2+0.16, 0.22,0,0, 0x23272f);

  const g=new THREE.Group();
  const m1=new THREE.Mesh(merge(lack),_lackM);
  const m2=new THREE.Mesh(merge(gummi),_gummiM);
  const m3=new THREE.Mesh(merge(glasT),_glasM);
  const m4=new THREE.Mesh(merge(chromT),_chromM);
  if(HIQ){ m1.castShadow=true; m1.receiveShadow=true; m2.castShadow=true; m3.castShadow=true; }
  g.add(m1); g.add(m2); g.add(m3); g.add(m4);
  return g;
}
/* =========================================================
   Strassenbaum im Winter (Tom, 24.09.: "sieht immer noch nicht gut
   aus"). Vorher gestapelte Zylinder mit wechselnder Farbe - jeder
   Abschnitt ein sichtbarer Ring, die Aeste gerade Stangen mit
   weissen Kloetzen als Schnee.

   Jetzt nach dem Prinzip von EZ-Tree (Dan Greenheck): jeder Ast ist
   EIN durchgehendes Rohr aus vielen Ringen, das sich verjuengt und
   leicht krumm waechst. Kinderaeste setzen entlang des Elternastes
   an, nicht nur am Ende. Rinde als Textur mit Laengsrissen, der
   Stamm laeuft unten in Wurzelanlaeufe aus. Schnee liegt per Shader
   auf den nach oben zeigenden Flaechen - keine Extrateile.
   ========================================================= */
let _baumMat=null;
function baumMat(){
  if(_baumMat) return _baumMat;
  const t=tex(256,512,(g,W,H)=>{
    g.fillStyle='#6b5c4c'; g.fillRect(0,0,W,H);
    /* Borke: breite helle Platten, dazwischen tiefe Laengsrisse */
    for(let i=0;i<60;i++){ const x=Math.random()*W, w=rand(3,9); let xx=x;
      g.strokeStyle=`rgba(22,16,11,${rand(0.45,0.8)})`; g.lineWidth=w; g.beginPath(); g.moveTo(xx,-10);
      for(let y=0;y<=H+20;y+=24){ xx+=rand(-5,5); g.lineTo(xx,y); } g.stroke();
      /* Kante neben dem Riss faengt Licht */
      g.strokeStyle=`rgba(150,132,112,${rand(0.08,0.2)})`; g.lineWidth=2; g.beginPath(); g.moveTo(x+w*0.7,-10);
      xx=x+w*0.7; for(let y=0;y<=H+20;y+=24){ xx+=rand(-5,5); g.lineTo(xx,y); } g.stroke(); }
    /* Querrisse, Flechten und Koernung */
    for(let i=0;i<140;i++){ g.fillStyle=`rgba(20,14,10,${rand(0.2,0.5)})`; g.fillRect(Math.random()*W,Math.random()*H,rand(6,22),rand(1,3)); }
    for(let i=0;i<40;i++){ g.fillStyle=`rgba(${120+Math.random()*30|0},${130+Math.random()*30|0},${100+Math.random()*20|0},${rand(0.08,0.18)})`;
      g.beginPath(); g.ellipse(Math.random()*W,Math.random()*H,rand(4,14),rand(3,10),0,0,Math.PI*2); g.fill(); }
    for(let i=0;i<9000;i++){ const v=Math.random()<0.5?0:255; g.fillStyle=`rgba(${v},${v},${v},${Math.random()*0.07})`; g.fillRect(Math.random()*W,Math.random()*H,1,2); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8;
  _baumMat=new THREE.MeshStandardMaterial({map:t,roughness:0.95,metalness:0});
  _baumMat.onBeforeCompile=sh=>{
    sh.vertexShader='attribute float schnee;\nvarying float vSchnee;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  vSchnee=schnee;');
    sh.fragmentShader='varying float vSchnee;\n'+sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.80,0.84,0.90),vSchnee);');
  };
  return _baumMat;
}
function makeBaum(){
  const V3=THREE.Vector3, Q=THREE.Quaternion, UP=new V3(0,1,0);
  /* Parameter je Astordnung: 0 Stamm, 1 Hauptaeste, 2 Seitenaeste,
     3 Zweige, 4 Feinreisig (nur HIQ) */
  const L=HIQ?4:3;
  const P={
    kinder:[7,4,4,3], winkel:[52,42,38,34], start:[0.40,0.25,0.2,0.25],
    laenge:[4.2,3.0,1.4,0.62,0.3], radius:[0.25,0.5,0.5,0.52,0.55],
    ringe:[12,8,5,3,2], seg:[HIQ?14:9,HIQ?9:6,6,4,3], verj:[0.72,0.8,0.82,0.88,0.92],
    krumm:[0.035,0.13,0.2,0.26,0.3], auf:[0,0.018,0.014,0.01,0.006]
  };
  const pos=[], nor=[], uv=[], sch=[], idx=[];
  const ast=(o,q,len,r0,lv)=>{
    const R=P.ringe[lv], S=P.seg[lv], verj=P.verj[lv];
    const p=o.clone(), qq=q.clone(), rahmen=[];
    const basis=pos.length/3; let v=0;
    const umfang=Math.max(1,Math.round(2*Math.PI*r0/0.45));
    for(let i=0;i<=R;i++){
      const f=i/R;
      let r=r0*(1-verj*f);
      /* Wurzelanlauf: unten breiter, mit fuenf Rippen */
      const flare=lv===0?Math.exp(-p.y*5.5):0;
      for(let j=0;j<=S;j++){
        const a=j/S*Math.PI*2;
        const rr=r*(1+flare*(0.55+0.35*Math.sin(a*5+1.3)));
        const d=new V3(Math.cos(a),0,Math.sin(a)).applyQuaternion(qq);
        pos.push(p.x+d.x*rr,p.y+d.y*rr,p.z+d.z*rr); nor.push(d.x,d.y,d.z);
        uv.push(j/S*umfang,v);
        /* Schnee auf Oberseiten, nicht am Stamm unten */
        const oben=Math.max(0,(d.y-0.35)/0.5);
        sch.push(lv===0?0:Math.min(0.92,oben*oben*(lv>=3?0.6:0.95)*(p.y>1.8?1:0)));
      }
      rahmen.push({p:p.clone(),q:qq.clone(),r});
      if(i<R){
        const seglen=len/R;
        p.add(new V3(0,seglen,0).applyQuaternion(qq)); v+=seglen/(2*Math.PI*Math.max(r0,0.04)*1.3);
        /* krumm wachsen, etwas nach oben ziehen */
        const k=P.krumm[lv]/Math.sqrt(Math.max(r,0.02)/0.2);
        qq.multiply(new Q().setFromEuler(new THREE.Euler(rand(-k,k),rand(-k,k),rand(-k,k))));
        const dir=new V3(0,1,0).applyQuaternion(qq);
        const zu=new Q().setFromUnitVectors(dir,dir.clone().lerp(UP,P.auf[lv]).normalize());
        qq.premultiply(zu);
      }
    }
    for(let i=0;i<R;i++) for(let j=0;j<S;j++){
      const a=basis+i*(S+1)+j, b=a+S+1;
      idx.push(a,b,a+1, b,b+1,a+1);
    }
    if(lv>=L) return;
    const n=P.kinder[lv]+(lv>0&&Math.random()<0.4?1:0);
    const off=Math.random()*Math.PI*2;
    for(let k=0;k<n;k++){
      const t=P.start[lv]+(1-P.start[lv])*(n===1?0.5:k/(n-1))*rand(0.85,1);
      const fi=Math.min(R-1,Math.floor(t*R)), fr=t*R-fi, A=rahmen[fi], B=rahmen[fi+1];
      const o2=A.p.clone().lerp(B.p,fr), r2=A.r+(B.r-A.r)*fr;
      const qp=A.q.clone().slerp(B.q,fr);
      const um=off+k*2.39996+rand(-0.3,0.3);      /* goldener Winkel */
      const w=(P.winkel[lv]+rand(-8,8))*Math.PI/180;
      const qc=qp.clone().multiply(new Q().setFromEuler(new THREE.Euler(0,um,0))).multiply(new Q().setFromEuler(new THREE.Euler(0,0,w)));
      const lk=P.laenge[lv+1]*(lv===0?(1.15-0.55*t):(1.2-0.6*t))*rand(0.85,1.15);
      ast(o2,qc,lk,Math.min(r2*0.92,r2*P.radius[lv+1]*rand(0.9,1.1)),lv+1);
    }
    /* Stamm und Hauptaeste laufen oben in einen Leittrieb aus */
    if(lv<=1){ const E=rahmen[R]; ast(E.p.clone().sub(new V3(0,1,0).applyQuaternion(E.q).multiplyScalar(0.02)),E.q.clone(),P.laenge[lv+1]*0.8,E.r*1.05,lv+1); }
  };
  ast(new V3(0,-0.05,0),new Q().setFromEuler(new THREE.Euler(rand(-0.03,0.03),0,rand(-0.03,0.03))),P.laenge[0],P.radius[0],0);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setAttribute('schnee',new THREE.Float32BufferAttribute(sch,1));
  geo.setIndex(idx);
  const m=new THREE.Mesh(geo,baumMat()); if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
  m.userData.dreiecke=idx.length/3;
  return m;
}
/* =========================================================
   Nachbargrundstueck rechts vom Laden: gleiche Fassade wie der
   eigene Laden, mit Verkaufsschild. Hier waechst der Laden spaeter
   hinein.
   ========================================================= */
function buildNachbar(){
  /* Die Ladenzeile laeuft bis ans Ende des Blocks. Jeder Abschnitt
     gehoert zu einer Ausbaustufe und steht bis dahin leer. */
  /* Die Nachbarzeile setzt genau dort an, wo die Fassade des
     Basisladens endet (die wall() um ihre 6 mm Ueberstand
     verlaengert hat). Vorher begann sie bei 8,10 - dazwischen
     stand nichts, und man sah durch einen neun Zentimeter
     breiten Schlitz vom Laden auf die Strasse. */
  nachbarFassade(8.006,20.0,'shop_gross','ca. 142 m² · direkt nebenan');
  /* Die mittlere Achse des Eckhauses ist bis zum Boden offen - dort
     sitzt spaeter der zweite Eingang. */
  nachbarFassade(20.0,37.9,'shop_ost','ca. 212 m² · Eckhaus der Zeile',1);
}
function nachbarFassade(x0,x1,zid,unterzeile,eingang){
  const zf=6.1, H=WH+0.6;
  const g=new THREE.Group(); scene.add(g);
  /* Die Ladenzeile ist ein Gebaeude, also traegt sie dieselbe
     Fassade wie der eigene Laden - vorher sass hier eine zweite,
     noch groebere Ziegeltextur daneben. */
  const zm=wallBrickMat();
  const w=x1-x0, cx=(x0+x1)/2;
  /* Die Fassade hat echte Oeffnungen. Solange nebenan nicht gekauft ist,
     sind sie zugemauert; nach dem Kauf sitzen dort Schaufenster.
     Die Achsen werden ueber die Laenge verteilt: die erste als hohes
     Schaufenster, die uebrigen als Fenster ueber Brueckungshoehe. */
  /* Schaufenster wie im Basisladen: eine durchgehende Reihe, alle
     auf derselben Hoehe, Bruestung 0,9 und Sturz 2,4. Vorher wechselte
     jede dritte Achse auf ein bodentiefes Fenster und die uebrigen
     sassen hoeher - dadurch standen sie versetzt, waren zu kurz und
     unter den kleinen Fenstern blieb eine graue Wandflaeche stehen. */
  const BR=0.9, ST=2.4, PF=1.0;
  const nB=Math.max(1,Math.round((w-PF)/5.6));
  const bw=(w-(nB+1)*PF)/nB;
  const OEFF=[];
  for(let i=0;i<nB;i++){ const a2=x0+PF+i*(bw+PF); OEFF.push([a2,a2+bw]); }
  /* Die Nachbarfassade war 40 cm dick und stand damit zehn
     Zentimeter weiter im Laden als die Fassade des Basisladens -
     an der Stossstelle sprang die Fensterwand. Jetzt liegt sie in
     derselben Flucht: innen 5,90, aussen 6,10. */
  const F=(a2,b2,y0,y1)=>{ if(b2>a2+0.01) wall(a2,b2,zf-0.2,zf,y0,y1,'-z',shopWall,zm,0); };
  let px=x0;
  OEFF.forEach(([a2,b2],i)=>{
    F(px,a2,0,H);                        /* Pfeiler          */
    if(i!==eingang) F(a2,b2,0,BR);       /* Bruestung        */
    F(a2,b2,ST,H);                       /* Sturz            */
    px=b2;
  });
  F(px,x1,0,H);
  /* Attika, Gesims und Sockel. Die Farben gehen mit der Fassade:
     anthrazit wie der Sockel in der Textur, nicht mehr das
     Sandsteinbeige von der Ziegelwand. */
  bbox(w+0.2,0.28,0.4,std(0x2f343d,{roughness:0.9}),cx,H+0.12,zf+0.02,g);
  bbox(w+0.1,0.1,0.36,std(0xe8ecf2,{roughness:1}),cx,H+0.3,zf+0.04,g,false);
  /* Der Sockel war 50 cm tief und mittig auf der Wand - damit stand
     er zur Haelfte IM Laden und zog dort ein schwarzes Band unter
     der ganzen Fensterfront entlang. Er gehoert nach draussen. */
  /* An der Eingangsachse hat der Sockel eine Luecke fuer die Tuer, wie
     am Haupteingang. Vorher lief er durch und stand 62 cm hoch quer in
     der offenen Schiebetuer. Das Stueck in der Luecke steht nur, bis
     der zweite Eingang gekauft ist. */
  { const sm=std(0x3b4049,{roughness:0.9}), sx0=x0-0.06, sx1=x1+0.06;
    const sockel=(a2,b2,par)=>bbox(b2-a2,0.62,0.26,sm,(a2+b2)/2,0.31,zf+0.06,par);
    if(eingang!==undefined){
      const [ea,eb]=OEFF[eingang], ec=(ea+eb)/2, l0=ec-1.3, l1=ec+1.3;
      sockel(sx0,l0,g); sockel(l1,sx1,g);
      zWand('eingang2',sockel(l0,l1,g));
    } else sockel(sx0,sx1,g);
  }

  /* ---------- Zustand „steht zum Verkauf“ ---------- */
  const gs=new THREE.Group(); g.add(gs); zWand(zid,gs);
  const brett=std(0x6d5a44,{roughness:0.95});
  const zugemauert=std(0x5a4a3e,{roughness:0.95});
  /* Die Oeffnungen sind jetzt eine durchgehende Fensterreihe und
     tragen nur noch ihre x-Grenzen; Bruestung und Sturz stehen fuer
     alle gleich in BR und ST. Vorher stand die Hoehe in jedem
     Eintrag und wurde hier mit ausgelesen - nach der Umstellung kam
     dabei NaN heraus und die Bretter landeten im Nirgendwo. */
  OEFF.forEach(([a,b],i)=>{
    const y0=i===eingang?0:BR, y1=ST;
    const bw=b-a, bh=y1-y0, bxc=(a+b)/2, byc=(y0+y1)/2;
    bbox(bw,bh,0.18,zugemauert,bxc,byc,zf-0.1,gs,false);
    const n=Math.max(3,Math.round(bh/0.55));
    for(let k=0;k<n;k++) bbox(bw+0.14,0.16,0.06,brett,bxc,y0+0.22+k*(bh-0.4)/(n-1),zf+0.03,gs,false);
    /* zwei schraege Bretter ueber Kreuz */
    for(const sgn of [1,-1]){ const d=bbox(Math.hypot(bw,bh)+0.1,0.14,0.05,brett,bxc,byc,zf+0.05,gs,false);
      d.rotation.z=sgn*Math.atan2(bh,bw); }
  });
  /* Frueher standen hier ein Makler-Schild und ein Bauzaun. Beides
     ist raus: wer spielt, will einen schicken Laden sehen und keine
     Baustelle. Dass man das Lokal kaufen kann, steht im Laptop. */

  /* ---------- Zustand „gehoert dir“: Schaufenster ---------- */
  const go=new THREE.Group(); g.add(go); zAdd(zid,go);
  const glas=new THREE.MeshStandardMaterial({color:LIN(0xbfe0ff),transparent:true,opacity:0.16,roughness:0.05,metalness:0.2,depthWrite:false});
  const prof=std(0x2b3040,{metalness:0.5,roughness:0.4});
  const bank=std(0xd7dae0,{roughness:0.5});
  OEFF.forEach(([a,b],i)=>{
    if(i===eingang){ eingangsAchse(go,a,b,zf,ST,glas,prof); return; }
    const y0=BR, y1=ST;
    const bw=b-a, bh=y1-y0, bxc=(a+b)/2, byc=(y0+y1)/2;
    /* Wie das Schaufenster im Basisladen (Tom, 26.09.): Glas buendig in
       der Laibung, nur eine schmale Leiste oben und unten und eine
       Mittelsprosse - kein umlaufender schwarzer Rahmen innen und aussen */
    bbox(bw,bh,0.03,glas,bxc,byc,zf-0.1,go,false);
    bbox(bw,0.06,0.12,prof,bxc,y0+0.03,zf-0.1,go,false);
    bbox(bw,0.06,0.12,prof,bxc,y1-0.03,zf-0.1,go,false);
    bbox(0.06,bh,0.1,prof,bxc,byc,zf-0.1,go,false);
    /* Fensterbank nur aussen. Sie ragte 13 cm in den Laden hinein und
       warf dort einen dunklen Schatten unter die ganze Fensterfront -
       im Basisladen sitzt unter dem Fenster direkt die Sockelfarbe. */
    if(y0>0.2) bbox(bw+0.16,0.06,0.26,bank,bxc,y0-0.02,zf+0.06,go,false);
  });
  if(eingang!==undefined&&EING2.x!==null){
    col(x0,EING2.x-1.28,zf-0.25,zf+0.05);
    col(EING2.x+1.28,x1,zf-0.25,zf+0.05);
    /* Solange der Eingang nicht gekauft ist, steht dort eine feste
       Scheibe - die sperrt wie jedes andere Schaufenster. */
    zWandCol('eingang2',col(EING2.x-1.28,EING2.x+1.28,zf-0.25,zf+0.05));
  } else col(x0,x1,zf-0.25,zf+0.05);
  return g;
}
/* =========================================================
   Muelleimer vor dem Laden
   ========================================================= */
function buildMuelleimer(x,z,ry){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g);
  const stahl=std(0x50575f,{metalness:0.62,roughness:0.42});
  const dunkel=std(0x2b3038,{metalness:0.5,roughness:0.5});
  /* Pfosten mit Fussplatte */
  bbox(0.22,0.025,0.22,stahl,0,0.012,0,g,false);
  for(let k=0;k<4;k++){ const a=k/4*Math.PI*2;
    bbox(0.03,0.02,0.03,std(0x8f959e,{metalness:0.7}),Math.cos(a)*0.07,0.03,Math.sin(a)*0.07,g,false); }
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.055,0.92,12),stahl);
  post.position.y=0.46; if(HIQ) post.castShadow=true; g.add(post);
  /* Korpus: konischer Behaelter mit Lochblech */
  const loch=tex(256,256,(c,W,H)=>{
    c.fillStyle='#4b525a'; c.fillRect(0,0,W,H);
    for(let y=10;y<H;y+=22) for(let x=((y/22)%2)*11+10;x<W;x+=22){
      c.fillStyle='#14171c'; c.beginPath(); c.arc(x,y,6,0,Math.PI*2); c.fill();
      c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.arc(x-1.4,y-1.6,6,Math.PI*0.9,Math.PI*1.7); c.stroke?0:0; c.fill(); }
    for(let i=0;i<700;i++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.06})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
  });
  loch.wrapS=loch.wrapT=THREE.RepeatWrapping; loch.repeat.set(3,2); loch.anisotropy=8;
  const korb=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.165,0.5,HIQ?22:14,1,true),
    new THREE.MeshStandardMaterial({map:loch,metalness:0.5,roughness:0.5,side:THREE.DoubleSide}));
  korb.position.y=1.06; if(HIQ) korb.castShadow=true; g.add(korb);
  /* Boden, obere und untere Ringe */
  const bo=new THREE.Mesh(new THREE.CylinderGeometry(0.165,0.165,0.02,16),dunkel); bo.position.y=0.82; g.add(bo);
  for(const [y,r] of [[1.31,0.205],[0.83,0.17]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.016,8,HIQ?22:12),stahl);
    ring.rotation.x=Math.PI/2; ring.position.y=y; g.add(ring);
  }
  /* Deckel mit Einwurf und Ascher */
  const deck=new THREE.Mesh(new THREE.CylinderGeometry(0.225,0.205,0.06,HIQ?22:14),stahl);
  deck.position.y=1.35; g.add(deck);
  const kegel=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.21,0.1,HIQ?22:14),dunkel);
  kegel.position.y=1.42; g.add(kegel);
  bbox(0.19,0.055,0.13,std(0x14171c,{roughness:0.9}),0.07,1.43,0,g,false);
  const asch=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.05,0.07,12),dunkel);
  asch.position.set(-0.12,1.47,0); g.add(asch);
  /* Halterung am Pfosten und Piktogramm */
  bbox(0.09,0.22,0.06,stahl,-0.2,1.06,0,g,false);
  plane(0.16,0.2,new THREE.MeshStandardMaterial({transparent:true,roughness:0.6,map:tex(160,200,(c,W,H)=>{
    c.clearRect(0,0,W,H);
    c.fillStyle='#e8ecf2'; c.beginPath();
    c.moveTo(38,58); c.lineTo(122,58); c.lineTo(112,178); c.lineTo(48,178); c.closePath(); c.fill();
    c.fillRect(30,44,100,12); c.fillRect(66,32,28,10);
    c.fillStyle='#4b525a'; c.fillRect(58,74,8,88); c.fillRect(76,74,8,88); c.fillRect(94,74,8,88);
  })}),0,1.1,0.202,0,g);
  /* Schnee auf dem Deckel */
  const sn=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.21,0.04,HIQ?20:12),std(0xe8ecf2,{roughness:1}));
  sn.position.y=1.47; g.add(sn);
  col(x-0.26,x+0.26,z-0.26,z+0.26);
  return g;
}
/* =========================================================
   Strassenraum (Tom, 26.09.: "Laeden gegenueber, Hochhaeuser und
   alles drum herum nochmal deutlich schoener und hochwertiger in
   der 3D"). Vorher: schwarze Kritzel-Risse im Asphalt, ein grauer
   Balken als Bordstein, zwei Mittellinien (eine lief unter den
   parkenden Autos durch), nur auf unserer Seite Laternen und nachts
   eine pechschwarze Strasse.
   Jetzt: Asphalt mit Splittkorn, Flickstellen und vergossenen Fugen,
   Granitbord mit Fase und Rinne, Plattengehweg, Markierungen nach
   StVO, Moeblierung gegenueber und Lichtpfuetzen unter den Laternen.
   Alles Kleinteilige wird je Material zu EINEM Mesh verschmolzen -
   die ganze Moeblierung kostet so nur eine Handvoll Draw-Calls.
   ========================================================= */
/* Bordkanten (Fahrbahnseite), Parkstreifen, Leitlinie, Zebrastreifen */
const STR={zN:11.1, zS:17.3, park:14.9, mitte:13.0, zebra:33, X:100};
/* ---------- Sammler: Teile je Material, am Ende verschmolzen ---------- */
let _stS={}, _stM=new THREE.Matrix4(), _strMats=null;
function stOrt(x,z,ry){ _stM=tm(x,0,z,0,ry||0,0); }
function stM(k,geo,m,farbe){ (_stS[k]=_stS[k]||[]).push({geo,m:_stM.clone().multiply(m),color:farbe}); }
function mT(k,geo,x,y,z,rx,ry,rz,farbe){ stM(k,geo,tm(x,y,z,rx,ry,rz),farbe); }
/* Rohr von a nach b (lokale Koordinaten des aktuellen Orts) */
const _yAchse=new THREE.Vector3(0,1,0);
function stRohr(k,a,b,r,farbe,seg){
  const d=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]), l=d.length();
  const q=new THREE.Quaternion().setFromUnitVectors(_yAchse,d.normalize());
  stM(k,new THREE.CylinderGeometry(r,r,l,seg||8,1,true),new THREE.Matrix4().compose(V((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),q,V(1,1,1)),farbe);
}
/* UV einer Geometrie in ein Rechteck des Schildatlas legen (Pixel, 1024er Atlas) */
function atlasUV(geo,x0,y0,x1,y1){
  const uv=geo.attributes.uv;
  for(let i=0;i<uv.count;i++) uv.setXY(i,(x0+uv.getX(i)*(x1-x0))/1024,1-(y1-uv.getY(i)*(y1-y0))/1024);
  return geo;
}
function strMats(){
  if(_strMats) return _strMats;
  const at=schildAtlas();
  const lampe=new THREE.MeshStandardMaterial({color:LIN(0x23262e),emissive:LIN(0xffe9c0),emissiveIntensity:0}); lampMats.push(lampe);
  /* Werbevitrine der Haltestelle: nachts von innen beleuchtet */
  const leucht=new THREE.MeshStandardMaterial({map:at,emissiveMap:at,emissive:LIN(0x9a9a9a),emissiveIntensity:0,roughness:0.3}); lampMats.push(leucht);
  _strMats={
    lack:lichtMat(std(0xffffff,{vertexColors:true,metalness:0.5,roughness:0.42})),
    matt:lichtMat(std(0xffffff,{vertexColors:true,roughness:0.88})),
    schild:lichtMat(new THREE.MeshStandardMaterial({map:at,roughness:0.45,metalness:0.1})),
    glas:new THREE.MeshStandardMaterial({color:LIN(0xcfdde8),transparent:true,opacity:0.2,roughness:0.06,metalness:0.3,depthWrite:false}),
    lampe, leucht
  };
  return _strMats;
}
function stFertig(){
  const M=strMats();
  for(const k in _stS){ const t=_stS[k]; if(!t.length) continue;
    const geo=merge(t);
    const o=new THREE.Mesh(lichtUV2(geo),M[k]); o.userData.strasse=k;
    if(HIQ&&k!=='glas'){ o.castShadow=true; o.receiveShadow=true; }
    scene.add(o); }
  _stS={};
}
/* Flaechen aus Dreiecken mit Farbe je Ecke. Die Dreiecke werden nach
   der Richtung h gedreht, damit die Normale stimmt. */
function bauer(){
  const P=[],U=[],C=[];
  const o={
    tri(a,b,c,h){
      const ux=b.p[0]-a.p[0],uy=b.p[1]-a.p[1],uz=b.p[2]-a.p[2], vx=c.p[0]-a.p[0],vy=c.p[1]-a.p[1],vz=c.p[2]-a.p[2];
      const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
      if(nx*h[0]+ny*h[1]+nz*h[2]<0){ const t=b; b=c; c=t; }
      for(const q of [a,b,c]){ P.push(q.p[0],q.p[1],q.p[2]); U.push(q.u[0],q.u[1]); C.push(q.c[0],q.c[1],q.c[2]); }
    },
    quad(a,b,c,d,h){ o.tri(a,b,c,h||[0,1,0]); o.tri(a,c,d,h||[0,1,0]); },
    leer:()=>!P.length,
    geo(){ const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
      g.setAttribute('color',new THREE.Float32BufferAttribute(C,3)); g.computeVertexNormals(); g.computeBoundingSphere(); return g; }
  };
  return o;
}
const ecke=(x,y,z,u,v,c)=>({p:[x,y,z],u:[u,v],c:c||[1,1,1]});
const grau=f=>[f,f,f];
/* Streifen laengs einer Linie in der Ebene y: pts [[x,z],...] */
function streifen(B,pts,w,y,c,uvf){
  for(let i=0;i<pts.length-1;i++){
    const [x0,z0]=pts[i], [x1,z1]=pts[i+1], l=Math.hypot(x1-x0,z1-z0)||1, nx=-(z1-z0)/l*w/2, nz=(x1-x0)/l*w/2;
    const e=(x,z)=>{ const [u,v]=uvf(x,z); return ecke(x,y,z,u,v,c); };
    B.quad(e(x0+nx,z0+nz),e(x1+nx,z1+nz),e(x1-nx,z1-nz),e(x0-nx,z0-nz));
  }
}
/* ---------- Texturen ---------- */
/* Asphalt: 4 x 4 m, feines Splittkorn statt Kritzel-Rissen. Dieselben
   Koerner liefern die Hoehe fuer die Normal-Map - bei tief stehender
   Sonne glitzert die Decke leicht. */
let _asphT=null, _asphN=null;
function asphaltTex(){
  if(_asphT) return _asphT;
  const korn=(g,W,H,hoehe)=>{ const R=saat(4711);
    for(let i=0;i<52000;i++){ const x=R()*W|0, y=R()*H|0, t=R(), a=R(), s=R()<0.82?1:2;
      if(hoehe) g.fillStyle=t<0.45?`rgba(0,0,0,${0.3+a*0.4})`:`rgba(255,255,255,${0.3+a*0.5})`;
      else g.fillStyle=t<0.45?`rgba(16,17,20,${0.2+a*0.35})`:t<0.9?`rgba(158,158,156,${0.12+a*0.3})`:`rgba(196,176,154,${0.15+a*0.3})`;
      g.fillRect(x,y,s,s); } };
  const t=tex(512,512,(g,W,H)=>{
    g.fillStyle='#4f5258'; g.fillRect(0,0,W,H);
    /* flaue Wolken: Alterung und Walzspuren, nahtlos gekachelt */
    const R=saat(99);
    for(let i=0;i<44;i++){ const x=R()*W, y=R()*H, r=30+R()*110, hell=R()<0.45, a=0.035+R()*0.05;
      for(const ox of [-W,0,W]) for(const oy of [-H,0,H]){
        const gr=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,r);
        gr.addColorStop(0,hell?`rgba(150,152,150,${a})`:`rgba(18,20,24,${a*1.3})`); gr.addColorStop(1,'rgba(0,0,0,0)');
        g.fillStyle=gr; g.fillRect(x+ox-r,y+oy-r,r*2,r*2); } }
    korn(g,W,H,false);
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8;
  const n=normalMapFrom(512,512,(g,W,H)=>{ g.fillStyle='#808080'; g.fillRect(0,0,W,H); korn(g,W,H,true); },1.6);
  if(n) n.wrapS=n.wrapT=THREE.RepeatWrapping;
  _asphN=n;
  _asphT=t; return t;
}
/* Gehwegplatten 30 x 30 cm, Kachel 2,4 m */
function gehwegTex(){
  const t=tex(512,512,(g,W,H)=>{ const R=saat(31), P=64;
    g.fillStyle='#5d5f63'; g.fillRect(0,0,W,H);
    for(let j=0;j<8;j++) for(let i=0;i<8;i++){
      const b=142+R()*24|0, w=R()<0.15?6:0;
      g.fillStyle=`rgb(${b+w},${b+1},${b+3})`; g.fillRect(i*P+1.5,j*P+1.5,P-3,P-3);
      /* leichte Schattenkante unten rechts, abgeplatzte Ecke ab und zu */
      g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(i*P+1.5,j*P+P-4,P-3,2.5); g.fillRect(i*P+P-4,j*P+1.5,2.5,P-3);
      if(R()<0.18){ g.fillStyle='#6a6c70'; g.beginPath(); const cx=i*P+(R()<0.5?2:P-2), cy=j*P+(R()<0.5?2:P-2); g.arc(cx,cy,3+R()*4,0,Math.PI*2); g.fill(); }
    }
    for(let k=0;k<16000;k++){ const a=R(); g.fillStyle=R()<0.5?`rgba(0,0,0,${a*0.12})`:`rgba(255,255,255,${a*0.12})`; g.fillRect(R()*W,R()*H,1.5,1.5); }
    /* Kaugummiflecken, Salzraender, Schmutz */
    for(let k=0;k<26;k++){ g.fillStyle=`rgba(38,38,40,${0.25+R()*0.3})`; g.beginPath(); g.arc(R()*W,R()*H,1.5+R()*2.5,0,Math.PI*2); g.fill(); }
    for(let k=0;k<10;k++){ const x=R()*W,y=R()*H,r=20+R()*50, gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,R()<0.5?'rgba(235,238,240,.10)':'rgba(40,38,34,.08)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
/* Eine Reihe Steine, nahtlos ueber den Kachelrand: der letzte Stein
   schliesst genau an den ersten an, was rechts uebersteht, kommt links wieder */
function steinReihe(R,W,y,h,wmin,wmax,mal){
  const o=R()*wmin; let x=o;
  while(x<o+W-1){ let w=wmin+R()*(wmax-wmin); if(o+W-x<w+wmin*0.8) w=o+W-x;
    mal(x,y,w,h); if(x+w>W) mal(x-W,y,w,h); x+=w; }
}
/* Kleinpflaster aus Granit (Baumstreifen), Kachel 1,6 m */
function pflasterTex(){
  const t=tex(512,512,(g,W,H)=>{ const R=saat(57);
    g.fillStyle='#3f4144'; g.fillRect(0,0,W,H);
    for(let r=0;r<16;r++) steinReihe(R,W,r*32,32,26,36,(x,y,w,h)=>{
      const b=110+R()*50|0, blau=R()<0.3?8:0, warm=R()<0.25?10:0;
      g.fillStyle=`rgb(${b+warm},${b},${b+blau})`; g.fillRect(x+1.5,y+1.5,w-3,h-3);
      const gr=g.createLinearGradient(x,y,x+w,y+h); gr.addColorStop(0,'rgba(255,255,255,.12)'); gr.addColorStop(1,'rgba(0,0,0,.14)');
      g.fillStyle=gr; g.fillRect(x+1.5,y+1.5,w-3,h-3); });
    for(let k=0;k<9000;k++){ g.fillStyle=R()<0.5?'rgba(0,0,0,.15)':'rgba(255,255,255,.14)'; g.fillRect(R()*W,R()*H,1.5,1.5); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
/* Granit: oben der Bordstein (1 m Stein, Profil abgewickelt),
   unten die Rinne aus drei Reihen Grosspflaster */
function granitTex(){
  const t=tex(512,512,(g,W,H)=>{ const R=saat(13);
    const speck=(y0,y1,n)=>{ for(let k=0;k<n;k++){ const t2=R(); g.fillStyle=t2<0.4?`rgba(25,25,28,${0.3+R()*0.4})`:t2<0.8?`rgba(235,235,232,${0.2+R()*0.4})`:`rgba(170,140,130,${0.3+R()*0.3})`; g.fillRect(R()*W,y0+R()*(y1-y0),1.5+R(),1.5+R()); } };
    g.fillStyle='#9c9d9b'; g.fillRect(0,0,W,256);
    /* Ansichtsflaeche zur Fahrbahn: Spritzwasser und Streusalz */
    const gr=g.createLinearGradient(0,0,0,70); gr.addColorStop(0,'rgba(40,42,46,.55)'); gr.addColorStop(1,'rgba(40,42,46,0)');
    g.fillStyle=gr; g.fillRect(0,0,W,70);
    g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(0,78,W,70);          // abgelaufene Oberseite
    speck(0,256,9000);
    g.fillStyle='rgba(30,30,32,.75)'; g.fillRect(0,0,2,256); g.fillRect(W-2,0,2,256);   // Stossfuge
    /* Rinne */
    g.fillStyle='#34363a'; g.fillRect(0,256,W,256);
    for(let r=0;r<3;r++) steinReihe(R,W,256+r*85,85,48,76,(x,y,w,h)=>{ const b=95+R()*45|0;
      g.fillStyle=`rgb(${b},${b},${b+4})`; g.fillRect(x+2.5,y+2.5,w-5,h-5);
      const q=g.createLinearGradient(0,y,0,y+h); q.addColorStop(0,'rgba(255,255,255,.10)'); q.addColorStop(1,'rgba(0,0,0,.18)'); g.fillStyle=q; g.fillRect(x+2.5,y+2.5,w-5,h-5); });
    speck(256,512,6000);
  });
  t.wrapS=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
/* Guss: links Schachtdeckel, rechts Rost des Strassenablaufs */
function gussTex(){
  return tex(512,256,(g,W,H)=>{ const R=saat(3);
    g.fillStyle='#2e3034'; g.fillRect(0,0,W,H);
    const cx=128, cy=128;
    g.fillStyle='#3a3c40'; g.beginPath(); g.arc(cx,cy,126,0,Math.PI*2); g.fill();
    g.strokeStyle='#1c1d20'; g.lineWidth=5; g.beginPath(); g.arc(cx,cy,112,0,Math.PI*2); g.stroke();
    /* Rautenmuster */
    g.save(); g.beginPath(); g.arc(cx,cy,104,0,Math.PI*2); g.clip();
    for(let y=-120;y<130;y+=14) for(let x=-120;x<130;x+=14){ g.fillStyle=((x+y)/14)%2?'#46484d':'#26282b'; g.fillRect(cx+x+2,cy+y+2,9,9); }
    g.restore();
    g.fillStyle='#2a2c30'; g.beginPath(); g.arc(cx,cy,34,0,Math.PI*2); g.fill();
    g.fillStyle='#9a9ca0'; g.font='bold 22px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('KANAL',cx,cy);
    for(let k=0;k<2500;k++){ g.fillStyle=R()<0.5?`rgba(120,80,50,${R()*0.18})`:`rgba(255,255,255,${R()*0.08})`; g.fillRect(R()*256,R()*256,2,2); }
    /* Rost */
    g.fillStyle='#3b3d41'; g.fillRect(262,40,244,176);
    for(let i=0;i<11;i++){ g.fillStyle='#08090a'; g.fillRect(278+i*20.5,58,12,140); }
    g.strokeStyle='#55575c'; g.lineWidth=4; g.strokeRect(264,42,240,172);
  });
}
/* Pfuetzenformen, 4 x 2 im Atlas: ueberlagerte weiche Flecken, dann
   auf eine Schwelle gezogen - Wasser hat eine klare, unregelmaessige
   Kante. Mit dem weichen Rand wirkten sie wie ein Farbschleier. */
function pfuetzenTex(){
  return tex(1024,512,(g,W,H)=>{ const R=saat(1231);
    g.fillStyle='#000'; g.fillRect(0,0,W,H); g.globalCompositeOperation='lighter';
    for(let k=0;k<8;k++){ const x0=(k%4)*256, y0=Math.floor(k/4)*256;
      g.save(); g.beginPath(); g.rect(x0,y0,256,256); g.clip();
      for(let i=0;i<11;i++){ const cx=x0+60+R()*136, cy=y0+84+R()*88, r=18+R()*46;
        g.save(); g.translate(cx,cy); g.scale(1,0.5+R()*0.45);
        const gr=g.createRadialGradient(0,0,0,0,0,r); gr.addColorStop(0,'rgba(255,255,255,.6)'); gr.addColorStop(1,'rgba(255,255,255,0)');
        g.fillStyle=gr; g.fillRect(-r,-r,r*2,r*2); g.restore(); }
      g.restore(); }
    g.globalCompositeOperation='source-over';
    const d=g.getImageData(0,0,W,H), a=d.data;
    for(let i=0;i<a.length;i+=4){ const v=clamp((a[i+1]-120)/26,0,1)*255; a[i]=a[i+1]=a[i+2]=v; }
    g.putImageData(d,0,0);
  },false);
}
/* Schneerand an der Hauswand: 4 m Kachel, oben (Wand) dicht, zur
   Strasse hin ausgefranst, mit Tauloechern */
function schneeRandTex(){
  const t=tex(512,64,(g,W,H)=>{ const R=saat(88);
    g.fillStyle='#000'; g.fillRect(0,0,W,H);
    const tief=[]; let d=0.5;
    for(let x=0;x<W;x++){ d+=(R()-0.5)*0.08; d=clamp(d,0.15,0.9); tief.push(d); }
    /* nahtlos: Enden aufeinander zu ziehen */
    for(let x=0;x<32;x++){ const k=x/32; tief[W-32+x]=tief[W-32+x]*(1-k)+tief[0]*k; }
    for(let x=0;x<W;x++){ const y0=H*(1-tief[x]);
      const gr=g.createLinearGradient(0,y0-3,0,y0+3); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(255,255,255,1)');
      g.fillStyle=gr; g.fillRect(x,y0-3,1,H-y0+3); }
    g.fillStyle='#000'; for(let k=0;k<60;k++){ g.beginPath(); g.arc(R()*W,H*(0.3+R()*0.5),1+R()*2.5,0,Math.PI*2); g.fill(); }
  },false);
  t.wrapS=THREE.RepeatWrapping; return t;
}
/* Abnutzung der Markierungsfarbe (Alpha, 1,5-m-Kachel) */
function abriebTex(){
  const t=tex(256,256,(g,W,H)=>{ const R=saat(77);
    g.fillStyle='#fff'; g.fillRect(0,0,W,H);
    for(let k=0;k<320;k++){ g.fillStyle=`rgba(0,0,0,${0.5+R()*0.5})`; g.beginPath(); g.arc(R()*W,R()*H,0.6+R()*1.4,0,Math.PI*2); g.fill(); }
    for(let k=0;k<7;k++){ const x=R()*W,y=R()*H,r=10+R()*22, gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,'rgba(0,0,0,.75)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
  },false);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
/* Schildatlas 1024 x 1024: Plakate, Verkehrszeichen, Automat, Kasten */
let _atlasT=null;
function schildAtlas(){
  if(_atlasT) return _atlasT;
  _atlasT=tex(1024,1024,(g,W,H)=>{ const R=saat(21);
    g.fillStyle='#d8d4ca'; g.fillRect(0,0,W,H);
    /* Schrift passt sich der Breite an (maxW), sonst lief sie ueber den Plakatrand */
    const txt=(s,x,y,px,farbe,font,al,maxW)=>{ g.fillStyle=farbe; const f=n=>`${font||'bold'} ${n}px "Barlow Condensed", Arial, sans-serif`;
      if(maxW) px=fitFont(g,s,maxW,px,f); g.font=f(px); g.textAlign=al||'center'; g.textBaseline='middle'; g.fillText(s,x,y); };
    /* --- Litfasssaeule: Plakatwand, 1024 x 512 --- */
    const pl=[['#10254d','SILVESTER','GALA','31.12. · STADTHALLE','#f2c14e'],['#f4efe2','NEUJAHRS','KONZERT','1. Januar · 17 Uhr','#8c1c24'],
      ['#c8322a','ZIRKUS','ROMANI','bis 6. Januar','#fff3c4'],['#1f6b4a','FLOHMARKT','am Hafen','jeden Sonntag','#f5f1e6'],
      ['#f2c230','KNALLER','PREISE!','Feuerwerk ab 28.12.','#1a1a1a'],['#2c2f36','KINO','DIE NACHT','ab Donnerstag','#e8e2d0']];
    let x=0;
    for(const [bg,a,b,c,fg] of pl){ const w=W/pl.length;
      g.fillStyle=bg; g.fillRect(x,0,w,512);
      txt(a,x+w/2,120,54,fg,0,0,w-22); txt(b,x+w/2,190,46,fg,0,0,w-22); txt(c,x+w/2,300,24,fg,'600',0,w-16);
      g.fillStyle=fg; g.globalAlpha=0.35; g.fillRect(x+18,230,w-36,4); g.globalAlpha=1;
      /* Knitter und Kleisterkanten */
      for(let k=0;k<5;k++){ g.fillStyle=`rgba(255,255,255,${R()*0.06})`; g.fillRect(x+R()*w,0,2+R()*4,512); }
      g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x+w-3,0,3,512);
      x+=w; }
    g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(0,400,W,112);
    txt('Stadtwerke · Kulturamt · Plakatierung verboten',W/2,470,20,'#e8e4da','600');
    /* --- Verkehrszeichen, je 128 px, Zeile y 512 --- */
    const blau='#1d5fae';
    const rr=(x,y,w,h,r,f)=>{ g.fillStyle=f; g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.fill(); };
    /* Z 350 Fussgaengerueberweg */
    rr(0,512,128,128,12,'#fff'); rr(5,517,118,118,9,blau);
    g.fillStyle='#fff'; g.beginPath(); g.moveTo(64,530); g.lineTo(116,622); g.lineTo(12,622); g.closePath(); g.fill();
    g.fillStyle='#111'; for(let i=0;i<4;i++) g.fillRect(30+i*18,606,11,10);
    g.beginPath(); g.arc(66,561,6,0,Math.PI*2); g.fill();
    g.strokeStyle='#111'; g.lineWidth=6; g.lineCap='round'; g.beginPath(); g.moveTo(64,569); g.lineTo(60,588); g.lineTo(52,602); g.moveTo(60,588); g.lineTo(70,601);
    g.moveTo(63,574); g.lineTo(52,584); g.moveTo(63,574); g.lineTo(74,582); g.stroke();
    /* Z 314 Parken */
    rr(128,512,128,128,12,'#fff'); rr(133,517,118,118,9,blau); txt('P',192,578,104,'#fff','900');
    /* Z 224 Haltestelle */
    g.fillStyle='#1a7a3a'; g.beginPath(); g.arc(320,576,62,0,Math.PI*2); g.fill();
    g.fillStyle='#f5c800'; g.beginPath(); g.arc(320,576,54,0,Math.PI*2); g.fill(); txt('H',320,580,80,'#1a7a3a','900');
    /* Z 274.1 Tempo-30-Zone */
    rr(384,512,128,128,8,'#f6f6f2'); g.strokeStyle='#222'; g.lineWidth=2; g.strokeRect(388,516,120,120);
    g.fillStyle='#c8102e'; g.beginPath(); g.arc(448,564,38,0,Math.PI*2); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(448,564,29,0,Math.PI*2); g.fill();
    txt('30',448,566,36,'#111','900'); txt('ZONE',448,620,26,'#111','800');
    /* Zusatzzeichen */
    rr(512,512,128,62,5,'#222'); rr(514,514,124,58,4,'#fff'); txt('mit Parkschein',576,543,21,'#111','700');
    rr(512,578,128,62,5,'#222'); rr(514,580,124,58,4,'#fff'); txt('Mo–Sa 8–20 h',576,609,22,'#111','700');
    /* Haltestellenname */
    rr(640,512,256,64,6,'#1a7a3a'); txt('Marktstraße',768,545,38,'#fff','700');
    /* Leerfeld fuer Blechrueckseiten */
    g.fillStyle='#8f959c'; g.fillRect(896,512,128,128);
    /* --- City-Light-Plakat 256 x 384 (y 640) --- */
    const cg=g.createLinearGradient(0,640,0,1024); cg.addColorStop(0,'#1d3f96'); cg.addColorStop(1,'#5b2a8e'); g.fillStyle=cg; g.fillRect(0,640,256,384);
    for(let k=0;k<5;k++){ const bx=40+R()*176, by=690+R()*150, br=20+R()*34, f=['#ffd35a','#ff5a6e','#6ee7ff','#b388ff','#8dff9a'][k];
      g.strokeStyle=f; g.lineWidth=2;
      for(let a=0;a<24;a++){ const w=a/24*Math.PI*2; g.globalAlpha=0.9; g.beginPath(); g.moveTo(bx+Math.cos(w)*br*0.25,by+Math.sin(w)*br*0.25); g.lineTo(bx+Math.cos(w)*br,by+Math.sin(w)*br); g.stroke(); }
      g.globalAlpha=1; }
    txt('SILVESTER',128,900,40,'#ffd35a','900'); txt('PARTY',128,944,40,'#fff','900'); txt('31.12. · ab 21 Uhr',128,990,20,'#cfd6ff','600');
    /* --- Fahrplan 128 x 160 (x 256, y 640) --- */
    g.fillStyle='#fbfbf6'; g.fillRect(256,640,128,160); g.fillStyle='#1a7a3a'; g.fillRect(256,640,128,24); txt('Linie 42',320,652,16,'#fff','700');
    g.fillStyle='#555'; for(let k=0;k<11;k++) g.fillRect(264,672+k*11,40+R()*70,4);
    /* --- Parkscheinautomat, Front 128 x 256 (x 384, y 640) --- */
    g.fillStyle='#9aa1a8'; g.fillRect(384,640,128,256);
    rr(396,650,104,50,6,blau); txt('P',424,676,38,'#fff','900'); txt('Parkschein',470,676,14,'#fff','700');
    g.fillStyle='#1b2a22'; g.fillRect(404,712,88,38); txt('0,50 €',448,731,20,'#9fe8a8','700');
    for(let r=0;r<3;r++) for(let c=0;c<3;c++){ g.fillStyle='#e6e8ea'; g.fillRect(410+c*28,762+r*22,20,15); }
    g.fillStyle='#111'; g.fillRect(420,836,56,6); g.fillRect(430,856,36,5);
    g.fillStyle='#f2c230'; g.fillRect(396,876,104,12);
    /* --- Kabelverteiler, Tuer 256 x 256 (x 512, y 640) --- */
    g.fillStyle='#c7c4b6'; g.fillRect(512,640,256,256);
    g.strokeStyle='rgba(0,0,0,.35)'; g.lineWidth=3; g.strokeRect(522,650,110,236); g.strokeRect(646,650,112,236);
    g.fillStyle='#555'; g.fillRect(622,760,6,20); g.fillRect(650,760,6,20);
    g.fillStyle='#f2c230'; g.beginPath(); g.moveTo(690,700); g.lineTo(716,746); g.lineTo(664,746); g.closePath(); g.fill(); txt('⚡',690,730,22,'#111');
    g.save(); g.translate(560,820); g.rotate(-0.12); txt('RKZ',0,0,40,'#2d4f9e','900'); g.restore();
    g.fillStyle='#e8e2d2'; g.fillRect(540,690,50,34); g.fillStyle='#c8322a'; g.fillRect(544,694,42,8);
    for(let k=0;k<3000;k++){ g.fillStyle=`rgba(60,50,40,${R()*0.08})`; g.fillRect(512+R()*256,640+R()*256,2,2); }
    const sm=g.createLinearGradient(0,840,0,896); sm.addColorStop(0,'rgba(60,55,45,0)'); sm.addColorStop(1,'rgba(60,55,45,.35)'); g.fillStyle=sm; g.fillRect(512,840,256,56);
    /* --- Sitzbank Holz 128 x 64 (x 768, y 640) --- */
    g.fillStyle='#8a5a36'; g.fillRect(768,640,256,64); for(let k=0;k<6;k++){ g.fillStyle='rgba(0,0,0,.15)'; g.fillRect(768,650+k*10,256,2); }
  });
  _atlasT.anisotropy=8; return _atlasT;
}
/* Strassenschrift "30" und "BUS" mit Alpha */
function strSchrift(){
  const t=tex(512,256,(g,W,H)=>{ g.clearRect(0,0,W,H);
    g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
    g.font='bold 230px "Barlow Condensed", Arial, sans-serif'; g.fillText('30',128,134);
    g.font='bold 150px "Barlow Condensed", Arial, sans-serif'; g.fillText('BUS',384,134);
    /* Abrieb */
    const R=saat(8); g.globalCompositeOperation='destination-out';
    for(let k=0;k<700;k++){ g.fillStyle=`rgba(0,0,0,${0.5+R()*0.5})`; g.beginPath(); g.arc(R()*W,R()*H,0.8+R()*2.4,0,Math.PI*2); g.fill(); }
    g.globalCompositeOperation='source-over';
  });
  return t;
}

/* ---------- Leuchte ---------- */
/* Die Teile einer Leuchte in lokalen Koordinaten; add(k,geo,matrix,farbe) */
function lampTeile(add){
  const D=0x2a2e38, MA=0x4b515c, C=(a,b,h,s)=>new THREE.CylinderGeometry(a,b,h,s);
  add('lack',C(0.15,0.19,0.34,14),tm(0,0.17,0),D);
  add('lack',new THREE.BoxGeometry(0.1,0.16,0.02),tm(0,0.2,0.185),0x6a7078);
  add('lack',C(0.16,0.16,0.03,14),tm(0,0.35,0),D);
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2; add('lack',new THREE.BoxGeometry(0.035,0.03,0.035),tm(Math.cos(a)*0.13,0.37,Math.sin(a)*0.13),0x7d838c); }
  add('mast',C(0.075,0.11,4.4,14),tm(0,2.57,0),MA);
  /* Bogen als kurze Segmente */
  const R=0.9, seg=7;
  for(let i=0;i<seg;i++){
    const a0=i/seg*(Math.PI/2), a1=(i+1)/seg*(Math.PI/2);
    const x0=Math.sin(a0)*R, y0=R-Math.cos(a0)*R, x1=Math.sin(a1)*R, y1=R-Math.cos(a1)*R;
    add('lack',C(0.062,0.066,Math.hypot(x1-x0,y1-y0)*1.08,10),tm(0,4.77+(y0+y1)/2,(x0+x1)/2,Math.atan2(x1-x0,y1-y0),0,0),MA);
  }
  /* Leuchtenkopf mit Wanne, Halterung und Deckel */
  const K=tm(0,5.63,0.9,0.06,0,0), k=(geo,x,y,z,c,key)=>add(key||'lack',geo,K.clone().multiply(tm(x,y,z)),c);
  k(roundedBoxGeo(0.3,0.11,0.82,0.04),0,0.06,0,0x3b414c);
  k(new THREE.BoxGeometry(0.26,0.03,0.74),0,0.005,0,0x71787f);
  k(new THREE.BoxGeometry(0.24,0.045,0.7),0,-0.02,0,0xffffff,'lampe');
  k(new THREE.BoxGeometry(0.16,0.09,0.16),0,0.06,-0.44,0x2f343e);
  k(new THREE.BoxGeometry(0.24,0.02,0.6),0,0.125,0.02,0x4d535d);
}
/* Nachtlicht der Leuchten (Tom, 26.09.: "alles drum herum deutlich
   hochwertiger"). Zuerst lagen additive Flaechen ueber dem Boden: sie
   faerbten den Asphalt sandfarben, und wo Flicken und Markierungen per
   polygonOffset nach vorn gezogen waren, fehlten sie ganz (schwarze
   Balken im Zebrastreifen). Jetzt traegt eine Lichtkarte (20 cm je
   Pixel) das Licht aller Strassenleuchten; die Bodenmaterialien lesen
   sie als lightMap ueber uv2 aus der Weltlage. Das Licht wird so mit
   der Bodenfarbe multipliziert - weisse Streifen leuchten, Asphalt
   bleibt dunkelgrau - und kostet keinen Draw-Call. Nur Leuchten
   ausserhalb der Karte (Hof) bekommen noch eine Flaeche. */
const LICHTER=[], LICHT_MATS=[];
const LK={x0:-102.4,z0:2.6,w:204.8,d:25.6,px:5};      /* 1024 x 128 Pixel */
let _lichtK=null, _strLichtM=null, _lichtFertig=false;
function lichtKarte(){
  if(_lichtK) return _lichtK;
  _lichtK=tex(1024,128,(g,W,H)=>{ g.fillStyle='#000'; g.fillRect(0,0,W,H); },false);
  _lichtK.wrapS=_lichtK.wrapT=THREE.ClampToEdgeWrapping;
  /* die Tageszeit setzt an lampMats emissiveIntensity = f*3 */
  /* 1,7 war zu zaghaft: nachts lag die Strasse gleichmaessig dunkel, die
     Lichtpfuetzen waren kaum zu sehen (26.09., Tom: "nachts ist die
     Strasse dunkel") */
  /* 3,8 war zu viel: lightMap wird noch mit PI multipliziert, auch der
     Rand der Pfuetzen lief ueber, und unser Gehweg lag nachts so hell
     und gleichmaessig wie am Tag (27.09.). Jetzt 2,6 und ein steilerer
     Abfall - zwischen den Leuchten wird es wieder dunkler. */
  lampMats.push({set emissiveIntensity(v){ const k=v/3*2.6; for(const m of LICHT_MATS) m.lightMapIntensity=k; }});
  return _lichtK;
}
const imLicht=p=>p.x>LK.x0+9&&p.x<LK.x0+LK.w-9&&p.z>LK.z0+6&&p.z<LK.z0+LK.d-6;
function lichtKarteMalen(){
  redraw(lichtKarte(),(g,W,H)=>{
    g.globalCompositeOperation='source-over'; g.fillStyle='#000'; g.fillRect(0,0,W,H);
    g.globalCompositeOperation='lighter';
    for(const p of LICHTER){ if(!imLicht(p)) continue;
      /* breit laengs der Strasse, schmaler quer; Mitte etwas zur Fahrbahn */
      /* enger als zuerst (8 m): bei 7 m Abstand flossen die Pfuetzen zu
         einer gleichmaessig grauen Flaeche zusammen */
      g.save(); g.translate((p.x-LK.x0)*LK.px,(p.z+p.s*0.6-LK.z0)*LK.px); g.scale(1,0.7);
      const r=7*LK.px, gr=g.createRadialGradient(0,0,0,0,0,r);
      gr.addColorStop(0,'rgba(255,224,182,1)'); gr.addColorStop(0.1,'rgba(255,222,179,.93)'); gr.addColorStop(0.28,'rgba(255,216,170,.55)');
      gr.addColorStop(0.48,'rgba(255,211,163,.2)'); gr.addColorStop(0.72,'rgba(255,207,158,.05)'); gr.addColorStop(1,'rgba(255,205,155,0)');
      g.fillStyle=gr; g.fillRect(-r,-r,r*2,r*2); g.restore(); }
    g.globalCompositeOperation='source-over';
    /* Rand schwarz: ausserhalb liest ClampToEdge den Rand */
    g.strokeStyle='#000'; g.lineWidth=2; g.strokeRect(0,0,W,H);
  });
}
function lichtMat(m){ m.lightMap=lichtKarte(); m.lightMapIntensity=0; LICHT_MATS.push(m); return m; }
/* uv2 fuer die Lichtkarte aus der Weltlage (mx: Lage des Meshes; von
   Hand gerechnet, der Logik-Stub der Tests kennt kein applyMatrix4) */
function lichtUV2(geo,mx){
  const p=geo.attributes.position, a=new Float32Array(p.count*2), e=mx&&mx.elements;
  for(let i=0;i<p.count;i++){ let x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    if(e){ const wx=e[0]*x+e[4]*y+e[8]*z+e[12], wz=e[2]*x+e[6]*y+e[10]*z+e[14]; x=wx; z=wz; }
    a[i*2]=(x-LK.x0)/LK.w; a[i*2+1]=1-(z-LK.z0)/LK.d; }
  geo.setAttribute('uv2',new THREE.BufferAttribute(a,2)); return geo;
}
function nachtMat(m,maxOp){
  Object.defineProperty(m,'emissiveIntensity',{configurable:true,get(){ return m.opacity*3/maxOp; },set(v){ m.opacity=maxOp*v/3; m.visible=v>0.01; }});
  m.visible=false; lampMats.push(m); return m;
}
/* Lichtkegel im Schneetreiben: nur ein Hauch, zum Rand hin (Kegel von
   der Seite gesehen) ausgeblendet - mit harter Kontur standen sie wie
   Suchscheinwerfer im Nachthimmel */
function kegelMat(){
  const m=new THREE.ShaderMaterial({uniforms:{st:{value:0},fa:{value:new THREE.Color(1,0.8,0.58)}},
    vertexShader:'varying float vK,vH; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vK=abs(dot(normalize(normalMatrix*normal),normalize(-mv.xyz))); vH=uv.y; gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform float st; uniform vec3 fa; varying float vK,vH; void main(){ gl_FragColor=vec4(fa*st*vK*vK*vK*(0.15+0.85*vH*vH),1.0); }',
    transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  Object.defineProperty(m,'emissiveIntensity',{set(v){ m.uniforms.st.value=v/3*0.07; m.visible=v>0.01; }});
  m.visible=false; lampMats.push(m); return m;
}
function lichtMats(){
  if(_strLichtM) return _strLichtM;
  const pf=tex(256,256,(g,W,H)=>{ const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2);
    gr.addColorStop(0,'rgba(255,232,196,1)'); gr.addColorStop(0.3,'rgba(255,226,186,.72)'); gr.addColorStop(0.58,'rgba(255,218,172,.3)'); gr.addColorStop(0.82,'rgba(255,210,160,.08)'); gr.addColorStop(1,'rgba(255,205,155,0)');
    g.fillStyle='#000'; g.fillRect(0,0,W,H); g.fillStyle=gr; g.fillRect(0,0,W,H); });
  _strLichtM={
    pf:nachtMat(new THREE.MeshBasicMaterial({map:pf,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),0.45),
    ke:kegelMat()
  };
  return _strLichtM;
}
/* Kegel fuer alle, Flaeche nur fuer Leuchten ausserhalb der Lichtkarte */
function lichtBauen(L){
  if(!L.length) return;
  const M=lichtMats(), pg=[], kg=[];
  const PG=new THREE.PlaneGeometry(13,9.5), KG=new THREE.CylinderGeometry(0.18,2.3,5.5,18,1,true);
  for(const p of L){
    if(!imLicht(p)) pg.push({geo:PG,m:tm(p.x,0.03,p.z,-Math.PI/2,0,0)});
    kg.push({geo:KG,m:tm(p.x,p.y-2.78,p.z)});
  }
  if(pg.length){ const a=new THREE.Mesh(merge(pg),M.pf); a.renderOrder=3; scene.add(a); }
  const b=new THREE.Mesh(merge(kg),M.ke); b.renderOrder=4; scene.add(b);
}
/* Strassenleuchte: Sockel, konischer Mast, Ausleger, echter Leuchtenkopf.
   Einzeln gebaut kostet sie drei Draw-Calls (Mast, Rest, Wanne) statt
   gut zwanzig; mit sammeln=true landet sie ganz im Sammler. Der Mast
   bleibt einzeln ein Zylinder - daran erkennt der Baumtest die Laterne. */
function strassenlampe(x,z,dir,sammeln){
  const a=dir||0, p={x:x+Math.sin(a)*0.9, z:z+Math.cos(a)*0.9, y:5.6, s:Math.cos(a)};
  LICHTER.push(p);
  if(_lichtFertig){ lichtBauen([p]); if(imLicht(p)) lichtKarteMalen(); }
  col(x-0.22,x+0.22,z-0.22,z+0.22);
  if(sammeln){ stOrt(x,z,a); lampTeile((k,geo,m,c)=>stM(k==='mast'?'lack':k,geo,m,c)); return null; }
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=a; scene.add(g);
  const T={}, M=strMats(), W=tm(x,0,z,0,a,0);
  lampTeile((k,geo,m,c)=>{
    if(k==='mast'){ const o=new THREE.Mesh(geo.applyMatrix4(m),std(c,{metalness:0.62,roughness:0.38})); if(HIQ) o.castShadow=true; g.add(o); }
    else (T[k]=T[k]||[]).push({geo,m,color:c}); });
  for(const k in T){ const o=new THREE.Mesh(lichtUV2(merge(T[k]),W),M[k]); if(HIQ&&k==='lack') o.castShadow=true; g.add(o); }
  return g;
}

/* ---------- Fahrbahn ---------- */
const uvWelt=(x,z)=>[0.5+x/200,0.5-z/200];      /* wie die grosse Bodenflaeche */
/* Hoehe des Bordsteins: 1 = Hochbord, 0 = abgesenkt (Zufahrt, Ueberweg) */
function bordHoch(x,abs){ let k=1; for(const [a,b] of abs){ if(x>a-1&&x<b+1) k=Math.min(k,x<a?a-x:x>b?x-b:0); } return k; }
/* Profil quer zur Kante: Ansicht, Fase, 15 cm Oberseite, dann steil
   hinunter auf den Gehweg. Die Rueckseite lief erst 25 cm flach aus -
   von oben sah der Bord wie ein 45 cm breites helles Band aus. Auch
   10 cm Schraege lagen noch als dunkle Fuge im Eigenschatten zwischen
   Pflaster und Bord (27.09., Tom: "alles drum herum deutlich schoener"):
   jetzt faellt der Ruecken auf 2 cm, das Pflaster laeuft bis heran. */
const BORD_B=0.2;
function bordProfil(k){ const h=0.02+0.1*k;
  return [[0,0],[0,h-0.02],[0.025,h+0.01],[0.175,h+0.008],[0.19,h-0.012],[BORD_B,0.012]]; }
/* Bordstein von x0 bis x1, Fahrbahnkante bei zR, Gehweg in Richtung s */
function bordstein(B,x0,x1,zR,s,abs){
  /* Die Richtung je Profilabschnitt ist seine Aussennormale. Vorher
     galt fuer alle [0,1,-s] - der Ruecken zum Gehweg wurde dadurch zur
     Fahrbahn gewendet und stand von der Strasse aus als dunkle Fuge
     zwischen Pflaster und Bord (27.09.). */
  const R=saat(Math.round(zR*10));
  const xs=[x0]; for(let x=Math.floor(x0)+1;x<x1;x++) xs.push(x); xs.push(x1);
  for(let i=0;i<xs.length-1;i++){
    const xa=xs[i], xb=xs[i+1], pa=bordProfil(bordHoch(xa,abs)), pb=bordProfil(bordHoch(xb,abs));
    const f=0.82+R()*0.14, c=[f,f,f*0.99], ua=xa, ub=xb;
    let L=0;
    for(let j=0;j<pa.length-1;j++){
      const l=Math.hypot(pa[j+1][0]-pa[j][0],pa[j+1][1]-pa[j][1]), v0=1-L/0.6*0.5, v1=1-(L+l)/0.6*0.5; L+=l;
      B.quad(ecke(xa,pa[j][1],zR+s*pa[j][0],ua,v0,c),ecke(xb,pb[j][1],zR+s*pb[j][0],ub,v0,c),
             ecke(xb,pb[j+1][1],zR+s*pb[j+1][0],ub,v1,c),ecke(xa,pa[j+1][1],zR+s*pa[j+1][0],ua,v1,c),
             [0,pa[j+1][0]-pa[j][0],-s*(pa[j+1][1]-pa[j][1])]);
    }
    /* Rinne: drei Reihen Grosspflaster vor dem Bord */
    const g=0.9+R()*0.12, cr=[g*0.92,g*0.92,g*0.95];
    B.quad(ecke(xa,0.005,zR,ua,0.5,cr),ecke(xb,0.005,zR,ub,0.5,cr),ecke(xb,0.005,zR-s*0.3,ub,0.02,cr),ecke(xa,0.005,zR-s*0.3,ua,0.02,cr));
  }
  /* Stirnseiten */
  for(const [x,sx] of [[x0,-1],[x1,1]]){ const p=bordProfil(bordHoch(x,abs));
    for(let j=1;j<p.length-1;j++) B.tri(ecke(x,p[0][1],zR,0,0.6),ecke(x,p[j][1],zR+s*p[j][0],0.2,0.7),ecke(x,p[j+1][1],zR+s*p[j+1][0],0.3,0.8),[sx,0,0]);
    B.tri(ecke(x,0,zR,0,0.6),ecke(x,p[p.length-1][1],zR+s*p[p.length-1][0],0.3,0.8),ecke(x,0,zR+s*BORD_B,0.1,0.9),[sx,0,0]); }
}
/* Flaeche in Weltkoordinaten (Gehweg, Pflaster): UV nach Kachelgroesse */
function bodenRechteck(B,x0,x1,z0,z1,y,kachel,c){
  const e=(x,z)=>ecke(x,y,z,x/kachel,-z/kachel,c);
  B.quad(e(x0,z0),e(x1,z0),e(x1,z1),e(x0,z1));
}
function buildFahrbahn(){
  const X=STR.X, zN=STR.zN, zS=STR.zS, Z=STR.zebra, R=saat(2612);
  const asph=asphaltTex();
  /* --- Deckschicht: Flickstellen, vergossene Fugen, nasse Rinne.
     Dieselbe Textur in denselben Weltkoordinaten wie der Boden, nur
     ueber die Eckfarben abgedunkelt: das Korn laeuft ungebrochen durch. */
  const D=bauer(), uv=(x,z)=>uvWelt(x,z);
  const flaeche=(x0,x1,z0,z1,y,c0,c1,quer)=>{ const e=(x,z,c)=>{ const [u,v]=uv(x,z); return ecke(x,y,z,u,v,c); };
    if(quer) D.quad(e(x0,z0,c0),e(x1,z0,c0),e(x1,z1,c1),e(x0,z1,c1)); else D.quad(e(x0,z0,c0),e(x1,z0,c1),e(x1,z1,c1),e(x0,z1,c0)); };
  /* feuchte Rinne und Streusalzschleier an beiden Borden */
  flaeche(-X,X,zN+0.3,zN+0.95,0.004,grau(0.62),grau(1),true);
  flaeche(-X,X,zS-0.3,zS-0.95,0.004,grau(0.62),grau(1),true);
  /* Flickstellen: Aufgrabungen quer ueber eine Spur und kleine Flicken */
  const flicken=[];
  for(let x=-X+6;x<X-6;x+=9+R()*16){
    if(Math.abs(x-Z)<5) continue;
    const quer=R()<0.4, w=quer?0.8+R()*0.5:0.9+R()*1.4, z0=quer?(R()<0.5?zN+1.0:STR.mitte+0.15):zN+1.1+R()*(zS-zN-3.2), d=quer?1.8+R()*0.9:0.7+R()*1.2;
    const z1=Math.min(z0+d,zS-1.05), f=0.84+R()*0.1, c=[f*0.97,f*0.98,f], n=0.03;
    flicken.push([x-n,x+w+n]);
    flaeche(x,x+w,z0,z1,0.004,c,c,true);
    const fu=grau(0.5);
    flaeche(x-n,x+w+n,z0-n,z0,0.004,fu,fu,true); flaeche(x-n,x+w+n,z1,z1+n,0.004,fu,fu,true);
    flaeche(x-n,x,z0,z1,0.004,fu,fu,true); flaeche(x+w,x+w+n,z0,z1,0.004,fu,fu,true);
  }
  const frei=x=>!flicken.some(([a,b])=>x>a-0.3&&x<b+0.3);
  /* Laengsfuge der Einbaubahnen neben der Leitlinie */
  { let pts=[]; const zf=STR.mitte+0.3;
    for(let x=-X;x<=X;x+=0.8){ if(!frei(x)||Math.abs(x-Z)<2){ if(pts.length>1) streifen(D,pts,0.05,0.0055,grau(0.45),uv); pts=[]; continue; }
      pts.push([x,zf+Math.sin(x*0.37)*0.03+(R()-0.5)*0.02]); }
    if(pts.length>1) streifen(D,pts,0.05,0.0055,grau(0.45),uv); }
  /* Fahrspuren: wo die Reifen rollen, ist die Decke dunkler und glatter */
  for(const zc of [zN+1.35,STR.mitte+0.95]){ let a=null;
    for(let x=-X;x<=X;x+=0.5){ const ok=frei(x)&&frei(x+0.5)&&Math.abs(x-Z)>2;
      if(ok&&a===null) a=x; if((!ok||x+0.5>X)&&a!==null){ if(x>a){ flaeche(a,x,zc-0.35,zc,0.004,grau(1),grau(0.86),true); flaeche(a,x,zc,zc+0.35,0.004,grau(0.86),grau(1),true); } a=null; } } }
  /* Querrisse, mit Bitumen vergossen */
  for(let x=-X+4;x<X-4;x+=6+R()*11){
    if(!frei(x)||Math.abs(x-Z)<3) continue;
    const pts=[]; let z=zN+0.35+R()*0.4, xx=x; const bis=R()<0.5?STR.mitte+R()*0.6:zS-0.4-R()*0.8;
    while(z<bis){ pts.push([xx,z]); xx+=(R()-0.5)*0.22; z+=0.3+R()*0.25; }
    if(pts.length>1) streifen(D,pts,0.035+R()*0.025,0.0055,grau(0.3),uv);
  }
  /* Kein polygonOffset auf den Bodenschichten: bei flachem Blick zog er
     sie um Dezimeter nach vorn - vor Reifen, Bordkanten und Licht. Die
     Millimeter Hoehe reichen bei near 0,2 m bis weit hinten. */
  const dm=lichtMat(new THREE.MeshStandardMaterial({map:asph,normalMap:_asphN,vertexColors:true,roughness:0.8}));
  if(dm.normalMap) dm.normalScale=new THREE.Vector2(0.7,0.7);
  const dk=new THREE.Mesh(lichtUV2(D.geo()),dm); if(HIQ) dk.receiveShadow=true; scene.add(dk);
  /* --- Pfuetzen (Tom, 26.09.: nasse Silvesterstimmung): Schmelzwasser
     in der Rinne und in den Fahrspuren. Sie spiegeln den Himmel wie der
     Autolack; nachts dunkeln sie mit ihm ab. Nicht unter den parkenden
     Autos - dort spiegelte sonst der helle Himmel. */
  { const Pf=bauer(), pf=(cx,cz,l,b,k)=>{ const u0=(k%4)/4, v0=Math.floor(k/4)/2, e=(x,z,u,v)=>ecke(cx+x,0.0065,cz+z,u0+u/4,v0+v/2);
      Pf.quad(e(-l/2,-b/2,0,0),e(l/2,-b/2,1,0),e(l/2,b/2,1,1),e(-l/2,b/2,0,1)); };
    for(let x=-X+3;x<X-3;x+=5+R()*11){
      if(Math.abs(x-Z)<3.5) continue;
      const gegen=R()<0.5&&(x<-26||x>22);
      pf(x,gegen?zS-0.4-R()*0.15:zN+0.4+R()*0.15,1.0+R()*1.8,0.45+R()*0.35,R()*8|0);
      if(R()<0.2&&frei(x+3)) pf(x+3+R()*2,R()<0.5?zN+1.35:STR.mitte+0.95,0.8+R()*1.0,0.35+R()*0.25,R()*8|0); }
    const env=autoUmgebung();
    const pm=lichtMat(new THREE.MeshStandardMaterial({color:LIN(0x141618),roughness:0.14,metalness:0.1,envMap:env||null,envMapIntensity:2.2,
      alphaMap:pfuetzenTex(),transparent:true,depthWrite:false}));
    /* 0,5 war zu wenig: bei Tag lagen die Pfuetzen als dunkle, gruenliche
       Flecken wie Oel auf der Decke statt den Himmel zu spiegeln. Der
       echte Himmel ist vielfach heller als der Asphalt - das holt die
       Staerke nach (27.09.). */
    lampMats.push({set emissiveIntensity(v){ pm.envMapIntensity=2.2*(1-0.3*v); }});
    const po=new THREE.Mesh(lichtUV2(Pf.geo()),pm); po.renderOrder=1; if(HIQ) po.receiveShadow=true; scene.add(po); }

  /* --- Markierungen nach StVO: Leitlinie 3 m Strich, 6 m Luecke, 12 cm
     breit; Parkstreifen mit T-Marken zwischen den Buchten; Zebrastreifen;
     Zickzack an der Haltestelle. Abrieb per Alpha-Maske. */
  const Mk=bauer(), uvM=(x,z)=>[x/1.5,z/1.5], mk=(x0,x1,z0,z1)=>{ const e=(x,z)=>ecke(x,0.009,z,x/1.5,z/1.5); Mk.quad(e(x0,z0),e(x1,z0),e(x1,z1),e(x0,z1)); };
  for(let x=-X+2;x<X-3;x+=9) if(x+3<Z-2.5||x>Z+2.5) mk(x,x+3,STR.mitte-0.06,STR.mitte+0.06);
  const P0=-25.3, P1=20.9;
  mk(P0,P1,STR.park-0.06,STR.park+0.06);
  for(let x=P0;x<=P1+0.01;x+=6.6) mk(x-0.06,x+0.06,STR.park,STR.park+0.6);
  /* Zebrastreifen: Balken in Fahrtrichtung, 50 cm breit, 50 cm Abstand */
  for(let z=zN+0.35;z+0.5<zS-0.3;z+=1.0) mk(Z-1.5,Z+1.5,z,z+0.5);
  /* Grenzmarkierung (Z 299) an der Bushaltestelle */
  { const a=-45, b=-30, n=10, pts=[[a,STR.park+0.2]];
    for(let i=1;i<n;i++) pts.push([a+(b-a)*i/n,i%2?zS-0.45:STR.park+0.2]);
    pts.push([b,STR.park+0.2]); streifen(Mk,pts,0.12,0.009,grau(1),uvM); }
  const ab=abriebTex();
  const mm=lichtMat(new THREE.MeshStandardMaterial({color:LIN(0xe9e7df),roughness:0.62,alphaMap:ab,alphaTest:0.5}));
  const mkm=new THREE.Mesh(lichtUV2(Mk.geo()),mm); if(HIQ) mkm.receiveShadow=true; scene.add(mkm);
  /* Schrift "30" (je Spur, in Fahrtrichtung lesbar) und "BUS" */
  { const Sb=bauer(), sch=(cx,cz,ux,uz,w,h,u0,u1)=>{ const rx=-uz, rz=ux, e=(a,b,u,v)=>ecke(cx+ux*b+rx*a,0.01,cz+uz*b+rz*a,u,v);
      Sb.quad(e(-w/2,-h/2,u0,0),e(w/2,-h/2,u1,0),e(w/2,h/2,u1,1),e(-w/2,h/2,u0,1)); };
    sch(-60,(zN+STR.mitte)/2,-1,0,1.3,2.6,0,0.5); sch(60,(STR.mitte+STR.park)/2,1,0,1.3,2.6,0,0.5);
    sch(-37.5,(STR.park+zS)/2+0.05,1,0,1.3,2.2,0.5,1);
    const sm=new THREE.Mesh(lichtUV2(Sb.geo()),lichtMat(new THREE.MeshStandardMaterial({color:LIN(0xe9e7df),map:strSchrift(),alphaTest:0.5,roughness:0.62}))); if(HIQ) sm.receiveShadow=true; scene.add(sm); }

  /* --- Schachtdeckel in der Fahrbahn, Strassenablaeufe in der Rinne --- */
  { const G=[], sd=new THREE.CircleGeometry(0.31,28), ro=new THREE.PlaneGeometry(0.34,0.52);
    sd.attributes.uv.array.forEach((v,i,a)=>{ if(i%2===0) a[i]=v*0.5; });
    ro.attributes.uv.array.forEach((v,i,a)=>{ if(i%2===0) a[i]=0.5+v*0.5; });
    for(let x=-88;x<90;x+=21+R()*6){ if(Math.abs(x-Z)<3) continue; G.push({geo:sd,m:tm(x,0.008,R()<0.5?12.1:14.0,-Math.PI/2,0,0)}); }
    for(let x=-90;x<90;x+=18+R()*5){ if(Math.abs(x-Z)<3) continue;
      if(x<37) G.push({geo:ro,m:tm(x,0.0085,zN+0.17,-Math.PI/2,0,Math.PI/2)}); G.push({geo:ro,m:tm(x+7,0.0085,zS-0.17,-Math.PI/2,0,Math.PI/2)}); }
    const gm=new THREE.Mesh(lichtUV2(merge(G)),lichtMat(new THREE.MeshStandardMaterial({map:gussTex(),metalness:0.55,roughness:0.5}))); if(HIQ) gm.receiveShadow=true; scene.add(gm); }

  /* --- Bordsteine, Rinnen, Gehwege --- */
  const Bs=bauer(), Z0=Z-1.6, Z1=Z+1.6;
  /* unsere Seite: an der Hofzufahrt (x -30..-20) und am Ueberweg abgesenkt */
  bordstein(Bs,-X,38,zN,-1,[[-30.2,-19.8],[Z0,Z1]]);
  bordstein(Bs,-X,X,zS,1,[[Z0,Z1]]);
  const gt=granitTex(), bm=new THREE.Mesh(lichtUV2(Bs.geo()),lichtMat(new THREE.MeshStandardMaterial({map:gt,vertexColors:true,roughness:0.78})));
  if(HIQ){ bm.receiveShadow=true; bm.castShadow=true; } scene.add(bm);
  /* Gehwegplatten, zur Bordseite ein Streifen Kleinpflaster (Baum- und
     Laternenstreifen). Unsere Seite laesst die Hofzufahrt frei - dort
     liegt der Beton der Zufahrt. */
  const Gp=bauer(), Kp=bauer(), zNg=zN-BORD_B, zSg=zS+BORD_B;
  for(const [a,b] of [[-X,-30.2],[-19.8,38]]){
    bodenRechteck(Gp,a,b,6.0,9.7,0.012,2.4); bodenRechteck(Kp,a,b,9.7,zNg,0.012,1.6); }
  bodenRechteck(Kp,-X,X,zSg,18.3,0.012,1.6); bodenRechteck(Gp,-X,X,18.3,23.4,0.012,2.4);
  const gm2=lichtMat(new THREE.MeshStandardMaterial({map:gehwegTex(),vertexColors:true,roughness:0.86}));
  const km=lichtMat(new THREE.MeshStandardMaterial({map:pflasterTex(),vertexColors:true,roughness:0.84}));
  for(const [B,m] of [[Gp,gm2],[Kp,km]]){ const o=new THREE.Mesh(lichtUV2(B.geo()),m); if(HIQ) o.receiveShadow=true; scene.add(o); }
  /* Liegengebliebener Schnee an den Hauswaenden gegenueber: dort wird
     nicht gelaufen und nicht geraeumt. Ausgefranster Rand ueber Alpha. */
  { const Sr=bauer(), e=(x,z,u,v)=>ecke(x,0.015,z,u,v);
    for(let x=-44;x<44;x+=4) Sr.quad(e(x,22.5,x/4,0),e(x+4,22.5,x/4+1,0),e(x+4,23.1,x/4+1,1),e(x,23.1,x/4,1));
    const sr=lichtMat(new THREE.MeshStandardMaterial({color:LIN(0xe6ebf2),roughness:0.95,alphaMap:schneeRandTex(),transparent:true,depthWrite:false}));
    const o=new THREE.Mesh(lichtUV2(Sr.geo()),sr); o.renderOrder=1; if(HIQ) o.receiveShadow=true; scene.add(o); }
}

/* ---------- Stadtmoebel (alles in den Sammler) ---------- */
function stPoller(x,z){ stOrt(x,z,0);
  mT('lack',new THREE.CylinderGeometry(0.075,0.075,0.02,14),0,0.01,0,0,0,0,0x33373e);
  mT('lack',new THREE.CylinderGeometry(0.05,0.05,0.86,14),0,0.44,0,0,0,0,0x3a3f47);
  mT('lack',new THREE.SphereGeometry(0.05,14,6,0,Math.PI*2,0,Math.PI/2),0,0.87,0,0,0,0,0x3a3f47);
  mT('matt',new THREE.CylinderGeometry(0.052,0.052,0.07,14,1,true),0,0.74,0,0,0,0,0xf2f2ee);
}
function stSchild(x,z,ry,felder,h){   /* felder: [[x0,y0,x1,y1,breite,hoehe,rund]] von oben nach unten */
  stOrt(x,z,ry); h=h||2.35;
  mT('lack',new THREE.CylinderGeometry(0.032,0.032,h,10),0,h/2,0,0,0,0,0x9aa0a6);
  mT('lack',new THREE.CylinderGeometry(0.036,0.036,0.03,10),0,h+0.015,0,0,0,0,0x7d838c);
  let y=h-0.02;
  for(const [x0,y0,x1,y1,w,hh,rund] of felder){
    y-=hh/2;
    const rueck=rund?new THREE.CylinderGeometry(w/2,w/2,0.015,28):new THREE.BoxGeometry(w,hh,0.015);
    mT('lack',rueck,0,y,0.045,rund?Math.PI/2:0,0,0,0x8f959c);
    const vorn=rund?new THREE.CircleGeometry(w/2,28):new THREE.PlaneGeometry(w,hh);
    mT('schild',atlasUV(vorn,x0,y0,x1,y1),0,y,0.054,0,0,0);
    mT('lack',new THREE.BoxGeometry(0.1,0.035,0.05),0,y+hh*0.3,0.025,0,0,0,0x7d838c);
    mT('lack',new THREE.BoxGeometry(0.1,0.035,0.05),0,y-hh*0.3,0.025,0,0,0,0x7d838c);
    y-=hh/2+0.03;
  }
}
function stFahrradbuegel(x,z){ stOrt(x,z,0);
  for(const s of [-1,1]) mT('lack',new THREE.CylinderGeometry(0.024,0.024,0.62,10),0,0.31,s*0.35,0,0,0,0x5a6068);
  mT('lack',new THREE.TorusGeometry(0.35,0.024,8,16,Math.PI),0,0.62,0,0,Math.PI/2,0,0x5a6068);
}
function stFahrrad(x,z,ry,lack){ stOrt(x,z,ry);
  const Rr=0.33, F=[0,Rr,0.53], B=[0,Rr,-0.5], T=[0,0.3,0], S=[0,0.84,-0.14], H=[0,0.88,0.36], Hu=[0,0.7,0.41];
  for(const w of [F,B]){
    mT('matt',new THREE.TorusGeometry(Rr,0.02,6,28),w[0],w[1],w[2],0,Math.PI/2,0,0x17181b);
    mT('lack',new THREE.TorusGeometry(Rr-0.03,0.008,4,24),w[0],w[1],w[2],0,Math.PI/2,0,0xb8bcc2);
    mT('lack',new THREE.CylinderGeometry(0.022,0.022,0.1,8),w[0],w[1],w[2],0,0,Math.PI/2,0x9aa0a6);
    for(let i=0;i<6;i++){ const a=i/6*Math.PI; stRohr('lack',[0,w[1]+Math.cos(a)*(Rr-0.03),w[2]+Math.sin(a)*(Rr-0.03)],[0,w[1]-Math.cos(a)*(Rr-0.03),w[2]-Math.sin(a)*(Rr-0.03)],0.003,0xc8ccd2,3); }
  }
  for(const [a,b] of [[T,S],[S,Hu],[T,Hu],[T,B],[S,B],[Hu,F],[Hu,H]]) stRohr('lack',a,b,0.018,lack,8);
  stRohr('lack',[0.24,H[1]+0.04,H[2]-0.06],[-0.24,H[1]+0.04,H[2]-0.06],0.012,0x2b2e33,6);
  for(const s of [-1,1]) stRohr('matt',[s*0.2,H[1]+0.04,H[2]-0.06],[s*0.27,H[1]+0.04,H[2]-0.06],0.018,0x17181b,6);
  stRohr('lack',[0,S[1],S[2]],[0,S[1]+0.08,S[2]-0.02],0.013,0x9aa0a6,6);
  mT('matt',new THREE.BoxGeometry(0.13,0.05,0.25),0,S[1]+0.1,S[2]-0.02,0,0,0,0x1b1c1f);
  mT('matt',new THREE.BoxGeometry(0.16,0.012,0.14),0,S[1]+0.13,S[2]-0.02,0,0,0,0xeef1f5);  // Schnee auf dem Sattel
  mT('lack',new THREE.CylinderGeometry(0.07,0.07,0.02,14),0.04,T[1],T[2],0,0,Math.PI/2,0x6b7078);
  stRohr('lack',[0.06,T[1],T[2]],[0.06,T[1]-0.14,T[2]+0.06],0.012,0x6b7078,6);
  mT('matt',new THREE.BoxGeometry(0.1,0.025,0.05),0.1,T[1]-0.15,T[2]+0.06,0,0,0,0x202225);
  /* Schutzbleche und Gepaecktraeger */
  mT('lack',new THREE.TorusGeometry(Rr+0.04,0.03,3,14,Math.PI*0.55),0,B[1],B[2],0,Math.PI/2,Math.PI*0.3,lack);
  stRohr('lack',[0,0.74,-0.2],[0,0.74,-0.72],0.01,0x2b2e33,5); stRohr('lack',[0,0.74,-0.72],[0,Rr,-0.5],0.01,0x2b2e33,5);
}
function stHydrant(x,z){ stOrt(x,z,0.4); const rot=0xb3261e;
  mT('lack',new THREE.CylinderGeometry(0.16,0.17,0.06,16),0,0.03,0,0,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.105,0.115,0.6,16),0,0.36,0,0,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.135,0.135,0.05,16),0,0.12,0,0,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.13,0.12,0.06,16),0,0.69,0,0,0,0,rot);
  mT('lack',new THREE.SphereGeometry(0.12,16,8,0,Math.PI*2,0,Math.PI/2),0,0.72,0,0,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.03,0.035,0.06,5),0,0.85,0,0,0,0,0x9aa0a6);
  for(const s of [-1,1]){ mT('lack',new THREE.CylinderGeometry(0.045,0.045,0.12,12),s*0.15,0.5,0,0,0,Math.PI/2,rot);
    mT('lack',new THREE.CylinderGeometry(0.052,0.052,0.035,12),s*0.22,0.5,0,0,0,Math.PI/2,0xa8adb3); }
  mT('lack',new THREE.CylinderGeometry(0.06,0.06,0.1,12),0,0.44,0.14,Math.PI/2,0,0,rot);
  mT('lack',new THREE.CylinderGeometry(0.068,0.068,0.035,12),0,0.44,0.2,Math.PI/2,0,0,0xa8adb3);
  mT('matt',new THREE.CylinderGeometry(0.08,0.12,0.03,14),0,0.815,0,0,0,0,0xeef1f5);
}
function stAutomat(x,z,ry){ stOrt(x,z,ry);
  mT('lack',new THREE.BoxGeometry(0.46,0.05,0.36),0,0.025,0,0,0,0,0x3a3f47);
  mT('lack',new THREE.BoxGeometry(0.4,1.42,0.3),0,0.76,0,0,0,0,0x8e959c);
  mT('schild',atlasUV(new THREE.PlaneGeometry(0.36,0.72),384,640,512,896),0,1.02,0.152,0,0,0);
  mT('lack',new THREE.BoxGeometry(0.44,0.06,0.34),0,1.5,0,0,0,0,0x6b7178);
  mT('lack',new THREE.BoxGeometry(0.4,0.02,0.3),0,1.56,-0.02,-0.35,0,0,0x1c2c52);   // Solarmodul
  mT('matt',new THREE.BoxGeometry(0.42,0.03,0.3),0,1.595,-0.03,-0.35,0,0,0xeef1f5);
}
/* Briefkasten: gelber Kasten mit runder Haube auf dem Pfosten, ohne
   Firmenzeichen. Einwurf zum Gehweg. */
function stBriefkasten(x,z,ry){ stOrt(x,z,ry); const gelb=0xf0bf12;
  mT('lack',new THREE.CylinderGeometry(0.035,0.042,0.88,10),0,0.44,0,0,0,0,0x4a5058);
  mT('lack',new THREE.BoxGeometry(0.42,0.53,0.3),0,1.135,0,0,0,0,gelb);
  mT('lack',new THREE.CylinderGeometry(0.21,0.21,0.3,16,1,false,-Math.PI/2,Math.PI),0,1.4,0,-Math.PI/2,0,0,gelb);
  mT('lack',new THREE.BoxGeometry(0.25,0.03,0.02),0,1.3,0.152,0,0,0,0x1b1c1e);
  mT('matt',new THREE.BoxGeometry(0.15,0.1,0.006),0,1.04,0.152,0,0,0,0xf2f1ea);
  mT('matt',new THREE.CylinderGeometry(0.218,0.218,0.31,12,1,false,-Math.PI/4,Math.PI/2),0,1.4,0,-Math.PI/2,0,0,0xeef1f5);
}
function stKasten(x,z,ry){ stOrt(x,z,ry);
  mT('matt',new THREE.BoxGeometry(0.98,0.12,0.36),0,0.06,0,0,0,0,0x6c6e70);
  mT('matt',new THREE.BoxGeometry(0.94,1.1,0.32),0,0.67,0,0,0,0,0xc4c1b3);
  mT('schild',atlasUV(new THREE.PlaneGeometry(0.92,1.08),512,640,768,896),0,0.67,0.162,0,0,0);
  mT('matt',new THREE.BoxGeometry(1.0,0.05,0.4),0,1.245,0,0,0,0,0xb4b1a4);
  mT('matt',new THREE.BoxGeometry(0.96,0.035,0.36),0,1.285,0,0,0,0,0xeef1f5);
}
function stLitfass(x,z){ stOrt(x,z,0); const gruen=0x2f4a3a;
  mT('lack',new THREE.CylinderGeometry(0.68,0.7,0.32,32),0,0.16,0,0,0,0,gruen);
  mT('lack',new THREE.CylinderGeometry(0.64,0.68,0.06,32),0,0.35,0,0,0,0,gruen);
  mT('schild',atlasUV(new THREE.CylinderGeometry(0.6,0.6,2.3,40,1,true),0,0,1024,512),0,1.53,0,0,0,0);
  mT('lack',new THREE.CylinderGeometry(0.7,0.62,0.14,32),0,2.75,0,0,0,0,gruen);
  mT('lack',new THREE.CylinderGeometry(0.66,0.66,0.08,32),0,2.86,0,0,0,0,gruen);
  mT('lack',new THREE.CylinderGeometry(0.2,0.62,0.5,32),0,3.15,0,0,0,0,gruen);
  mT('matt',new THREE.CylinderGeometry(0.28,0.64,0.2,32),0,3.02,0,0,0,0,0xe8ecf2);         // Schnee auf der Haube
  mT('lack',new THREE.SphereGeometry(0.12,14,8),0,3.44,0,0,0,0,gruen);
  mT('lack',new THREE.CylinderGeometry(0.03,0.03,0.2,8),0,3.6,0,0,0,0,gruen);
}
function stHaltestelle(x,z){ stOrt(x,z,0);
  const W2=1.9, T=1.5, H=2.35, an=0x3a3f47;
  for(const sx of [-1,1]) for(const sz of [-1,1]) mT('lack',new THREE.BoxGeometry(0.07,H,0.07),sx*W2,H/2,sz*T/2,0,0,0,an);
  mT('lack',new THREE.BoxGeometry(W2*2+0.4,0.1,T+0.35),0,H+0.05,0.05,0,0,0,an);
  mT('matt',new THREE.BoxGeometry(W2*2+0.34,0.05,T+0.28),0,H+0.125,0.05,0,0,0,0xeef1f5);   // Schnee auf dem Dach
  mT('schild',atlasUV(new THREE.PlaneGeometry(1.6,0.4),640,512,896,576),0,H+0.05,-(T+0.35)/2+0.05-0.002,0,Math.PI,0);
  /* Glas: Rueckwand und Seiten */
  mT('glas',new THREE.PlaneGeometry(W2*2-0.07,H-0.2),0,H/2+0.05,T/2,0,0,0);
  mT('glas',new THREE.PlaneGeometry(T-0.07,H-0.2),-W2,H/2+0.05,0,0,Math.PI/2,0);
  for(const y of [0.08,H-0.05]){ mT('lack',new THREE.BoxGeometry(W2*2,0.05,0.05),0,y,T/2,0,0,0,an); mT('lack',new THREE.BoxGeometry(0.05,0.05,T),-W2,y,0,0,0,0,an); }
  /* Werbevitrine an der Ostseite: nachts beleuchtet */
  mT('lack',new THREE.BoxGeometry(0.14,2.0,1.36),W2,1.12,0,0,0,0,an);
  for(const s of [-1,1]) mT('leucht',atlasUV(new THREE.PlaneGeometry(1.18,1.77),0,640,256,1024),W2+s*0.071,1.12,0,0,s*Math.PI/2,0);
  /* Bank: Stahlgestell, Holzlatten */
  for(const s of [-1,1]) mT('lack',new THREE.BoxGeometry(0.05,0.45,0.4),s*0.8,0.225,T/2-0.3,0,0,0,an);
  mT('schild',atlasUV(new THREE.BoxGeometry(1.8,0.05,0.4),768,640,1024,704),0,0.47,T/2-0.3,0,0,0);
  mT('schild',atlasUV(new THREE.BoxGeometry(1.8,0.3,0.04),768,640,1024,704),0,0.72,T/2-0.08,-0.12,0,0);
  /* Fahrplan in der Rueckwand */
  mT('schild',atlasUV(new THREE.PlaneGeometry(0.45,0.56),256,640,384,800),1.2,1.45,T/2-0.02,0,Math.PI,0);
}
/* Schneehaufen (Tom, 26.09.: Silvesterstimmung): zusammengeschobener
   Altschnee in der Rinne, gebuckelt, oben weiss, unten grau vom
   Spritzwasser und mit Splitt gesprenkelt, weich schattiert. Vorher
   waren es facettierte, gleichmaessig weisse Klumpen. Die Beulen haengen
   nur an der Ausgangslage der Ecken - doppelte Ecken bleiben dicht. */
function schneeGeo(x){
  const g=new THREE.SphereGeometry(1,18,10).toNonIndexed(), p=g.attributes.position, n=p.count, c=new Float32Array(n*3), ph=x*1.7;
  for(let i=0;i<n;i++){ const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);
    const k=1+0.17*Math.sin(px*4.3+pz*3.1+ph)+0.11*Math.sin(py*7.9+px*5.3+ph*2)+0.07*Math.sin(pz*11+px*9+py*3)+0.04*Math.sin(px*23+pz*19+ph);
    const y=Math.max(py>0?py*0.85:py,-0.1);
    p.setXYZ(i,px*k,y*k,pz*k);
    const t=clamp((y+0.1)*1.25,0,1), sp=0.9+0.1*Math.sin(px*37+pz*29+py*17), f=(0.19+0.53*t)*sp;
    c[i*3]=f*(1.03-0.06*t); c[i*3+1]=f*0.99; c[i*3+2]=f*(0.93+0.1*t); }
  g.setAttribute('color',new THREE.BufferAttribute(c,3));
  glatteNormalen(g,75); return g;
}
/* Nach den Autos gebaut: in den Parkbuchten liegen die Haufen nur in
   den Luecken zwischen den tatsaechlich stehenden Wagen */
function buildSchneehaufen(){
  const Z=STR.zebra, zS=STR.zS, R=saat(404), H=[];
  const haufen=(x,z,l,h)=>{ const g=schneeGeo(x); g.applyMatrix4(tm(x,-0.02,z,0,Math.sin(x*7)*0.1,0,l/2,h,0.3)); H.push(g); };
  for(let x=-95;x<95;x+=3+R()*9){
    if(Math.abs(x-Z)<3.5||(x>-47&&x<-28)||(x>-26&&x<22)) continue;
    if(R()<(COARSE?0.35:0.7)) haufen(x,zS-0.24,0.9+R()*1.4,0.24+R()*0.18); }
  /* Autos: Laenge aus den Huellquadern der Teile, sie stehen laengs x */
  const autos=[];
  for(const o of scene.children) if(o.isGroup&&o.children[0]&&o.children[0].material===_lackM){ let h=0;
    for(const m of o.children){ m.geometry.computeBoundingBox(); const b=m.geometry.boundingBox; h=Math.max(h,b.max.x-b.min.x,b.max.z-b.min.z); }
    autos.push({min:{x:o.position.x-h/2},max:{x:o.position.x+h/2}}); }
  autos.sort((a,b)=>a.min.x-b.min.x);
  let x0=-25.3;
  for(const b of autos.concat([{min:{x:21.5},max:{x:99}}])){
    const w=b.min.x-x0-0.5;
    if(w>0.6&&R()<0.85) haufen((x0+b.min.x)/2,zS-0.22,Math.min(w,1.5),0.2+R()*0.14);
    x0=b.max.x; }
  /* auf unserer Seite nur fern vom Laden (Laufwege der Kunden) */
  for(let x=-95;x<-34;x+=4+R()*9) if(R()<(COARSE?0.3:0.6)) haufen(x,STR.zN+0.24,0.8+R()*1.2,0.22+R()*0.16);
  for(let x=42;x<95;x+=4+R()*9) if(R()<(COARSE?0.3:0.6)) haufen(x,STR.zN+0.24,0.8+R()*1.2,0.22+R()*0.16);
  if(!H.length) return;
  let n=0; for(const g of H) n+=g.attributes.position.count;
  const P=new Float32Array(n*3), N=new Float32Array(n*3), C=new Float32Array(n*3); let o=0;
  for(const g of H){ P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3); C.set(g.attributes.color.array,o*3); o+=g.attributes.position.count; g.dispose(); }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(P,3)); geo.setAttribute('normal',new THREE.BufferAttribute(N,3)); geo.setAttribute('color',new THREE.BufferAttribute(C,3));
  geo.computeBoundingSphere();
  const m=new THREE.Mesh(lichtUV2(geo),lichtMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9})));
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; } scene.add(m);
}
function buildStadtmoebel(){
  const zS=STR.zS, zG=zS+0.45, Z=STR.zebra;
  /* Laternen gegenueber: dasselbe Modell wie unsere, Ausleger zur Fahrbahn */
  /* Auf dem Handy nur die naeheren - die fernen verschwinden ohnehin im Dunst */
  for(const x of [-84.5,-71.5,-58.5,-45.5,-32.5,-19.5,-6.5,6.5,19.5,Z+2.6,48.5,61.5,74.5,87.5])
    if(!COARSE||Math.abs(x)<50) strassenlampe(x,zS+0.5,Math.PI,true);
  /* Fahrradbuegel mit zwei Raedern, genau gegenueber vom Laden in der
     Luecke zwischen zwei Parkbuchten - sonst verdecken sie die Autos */
  for(const x of [0.2,1.1,2.0]) stFahrradbuegel(x,zG+0.55);
  stFahrrad(0.35,zG+0.62,0.03,0x1f4a8a); stFahrrad(1.85,zG+0.6,-0.04,0x7a1d24);
  stAutomat(-3.6,zS+0.5,Math.PI);
  stHydrant(10.6,zS+0.55);
  stBriefkasten(-10.4,zS+0.62,0);
  stKasten(14.6,22.55,Math.PI);
  stLitfass(-26.2,20.2);
  stHaltestelle(-37.5,21.3);
  /* Schilder: Parken mit Parkschein, Haltestelle, Ueberweg, Tempo-30-Zone.
     Sie stehen quer zur Fahrbahn und zeigen dem Verkehr entgegen, leicht
     zur Fahrbahn gedreht - Rechtsverkehr: gegenueber faehrt man nach +x.
     Vorher zeigten alle zum Gehweg, fuer Autofahrer unsichtbar. */
  const GEG=-Math.PI/2-0.26;
  const PARK=[[128,512,256,640,0.42,0.42],[512,512,640,574,0.42,0.2],[512,578,640,640,0.42,0.2]];
  stSchild(-25.9,zG,GEG,PARK); stSchild(21.4,zG,GEG,PARK);
  stSchild(-41.3,zG,GEG,[[256,512,384,640,0.45,0.45,true],[640,512,896,576,0.6,0.15]],2.6);
  /* Fahrplan am Haltestellenmast zeigt zu den Wartenden */
  stOrt(-41.3,zG,0);
  mT('lack',new THREE.BoxGeometry(0.5,0.62,0.06),0,1.45,0.066,0,0,0,0x3a3f47);
  mT('schild',atlasUV(new THREE.PlaneGeometry(0.45,0.56),256,640,384,800),0,1.45,0.098,0,0,0);
  /* Z 350 beidseitig, quer zur Fahrbahn */
  stSchild(Z-1.95,zG,-Math.PI/2,[[0,512,128,640,0.6,0.6]]); mT('schild',atlasUV(new THREE.PlaneGeometry(0.6,0.6),0,512,128,640),0,2.03,0.036,0,Math.PI,0);
  stSchild(Z+2.0,STR.zN-0.35,Math.PI/2,[[0,512,128,640,0.6,0.6]]); mT('schild',atlasUV(new THREE.PlaneGeometry(0.6,0.6),0,512,128,640),0,2.03,0.036,0,Math.PI,0);
  col(Z+1.95,Z+2.05,STR.zN-0.4,STR.zN-0.3);
  stSchild(-52,zG,GEG,[[384,512,512,640,0.6,0.6]]);
  for(const x of [Z-1.35,Z+1.35]) stPoller(x,zG);
  /* Blindenleitstreifen (Rippenplatten) an beiden Seiten des Ueberwegs */
  for(const [z0,z1] of [[STR.zN-1.0,STR.zN-0.45],[zS+0.45,zS+1.0]]){ stOrt(0,0,0);
    for(let x=Z-1.5;x<Z+1.49;x+=0.3) mT('matt',new THREE.BoxGeometry(0.28,0.012,z1-z0),x+0.15,0.018,(z0+z1)/2,0,0,0,0xaeaca4); }
  stFertig();
}
function buildStreet(){
  /* Fahrbahn, Borde, Gehwege und Moeblierung: siehe Strassenraum oben */
  buildFahrbahn();
  buildStadtmoebel();
  // Häuserzeile gegenüber, jetzt ueber die ganze sichtbare Breite
  let x=-44;
  const NH=COARSE?9:15;
  for(let i=0;i<NH&&x<44;i++){
    const w=rand(5.5,9.5), h=rand(9,15.5), d=rand(7,9), pair=pick(HAUSFARBEN);
    const cols=Math.max(2,Math.round(w/2.6)), rows=Math.max(2,Math.round((h-4)/2.9));
    const lit=[], warm=[];
    for(let k=0;k<cols*rows;k++){ lit.push(Math.random()<0.5); warm.push(pick(['#ffd79a','#ffc478','#f7e6c4','#ffb96b','#e8d7ff'])); }
    buildHaus(x+w/2,22.9+d/2+rand(0,0.5),w,d,h,{
      hex:pair[1],hexN:pair[0],rows,cols,lit,warm,
      shop:Math.random()<0.62,shopName:pick(LADENNAMEN),shopSign:pick(['#c8322a','#1f6b6b','#2f5d9e','#d08a2f','#4a7a3a','#7a3a6a']),shopWarm:'#ffe0a8',
      balkon:Math.random()<0.45,balkonN:1+Math.floor(Math.random()*2)});
    x+=w+rand(0.25,0.7);
  }
  // Zweite Reihe als Tiefenstaffelung hinter der Haeuserzeile
  for(let i=0;i<(COARSE?8:16);i++){ const w=rand(7,12), h=rand(13,22);
    bbox(w,h,8,std(pick([0x5a5f6b,0x6b6258,0x4f5560,0x6a5f55]),{roughness:1}),-72+i*(COARSE?19:9.6),h/2,40,null,false); }
  // Autos am gegenüberliegenden Bordstein
  /* echte Lackfarben: viel Silber, Weiss, Schwarz und Grau, dazu Blau, Rot, Gruen */
  const carCols=[0xc9ccd2,0xeeeeec,0x17191d,0x5b6068,0x1f4a8a,0x9c1e1e,0x2c4a3c,0xa9a39a,0x7d8794];
  for(let i=0;i<(COARSE?4:7);i++){ const c=makeAuto(pick(carCols),pick(['kombi','limo','van','suv','klein','limo'])); c.position.set(-22+i*6.6+rand(-0.6,0.6),0,16.0+rand(-0.12,0.12)); c.rotation.y=Math.PI/2+rand(-0.035,0.035); scene.add(c); }
  buildNachbar();
  /* Die Poller vor dem Schaufenster stehen bei x = -5,4 und 5,4. Der
     rechte Muelleimer stand 20 cm daneben und steckte mit Korb und
     Halter im Poller. */
  buildMuelleimer(-3.1,7.55,0.4); buildMuelleimer(6.7,7.55,-0.3);
  // Bäume und Stadtmöbel auf unserer Seite
  /* Der mittlere Baum stand bei x -11 genau in der Laterne - der
     Mast lief durch die Krone. Jetzt zwischen zwei Laternen. */
  for(const bx of (COARSE?[-16.5,13]:[-16.5,-7.5,13])){ const b=makeBaum(); b.position.set(bx,0,10.4); b.scale.setScalar(rand(0.9,1.2)); scene.add(b);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.75,0.06,6,18),std(0x3a3d44)); ring.rotation.x=Math.PI/2; ring.position.set(bx,0.06,10.4); scene.add(ring);
    col(bx-0.42,bx+0.42,9.98,10.82); b.userData.baum=true; }
  /* Hier stand noch ein Kasten als Platzhalter-Muelleimer neben der
     Laterne - die echten Muelleimer stehen am Laden. Weg damit. */
  /* Lichtpfuetzen aller bis hierher gebauten Leuchten in einem Rutsch;
     spaeter gebaute (Hof) bekommen ihre eigenen */
  buildSchneehaufen();
  lichtBauen(LICHTER); lichtKarteMalen(); _lichtFertig=true;
}

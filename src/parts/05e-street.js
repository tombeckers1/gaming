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
/* Strassenleuchte: Sockel, konischer Mast, Ausleger, echter Leuchtenkopf */
function strassenlampe(x,z,dir){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=dir||0; scene.add(g);
  const mast=std(0x4b515c,{metalness:0.62,roughness:0.38});
  const dunkel=std(0x2a2e38,{metalness:0.5,roughness:0.5});
  /* Fundamentsockel mit Revisionsklappe */
  const so=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.19,0.34,14),dunkel);
  so.position.y=0.17; if(HIQ) so.castShadow=true; g.add(so);
  bbox(0.1,0.16,0.02,std(0x6a7078,{metalness:0.6}),0,0.2,0.185,g,false);
  const flansch=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.03,14),dunkel);
  flansch.position.y=0.35; g.add(flansch);
  for(let i=0;i<4;i++){ const a=i/4*Math.PI*2;
    bbox(0.035,0.03,0.035,std(0x7d838c,{metalness:0.7}),Math.cos(a)*0.13,0.37,Math.sin(a)*0.13,g,false); }
  /* konischer Mast */
  const m1=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.11,4.4,14),mast);
  m1.position.y=2.57; if(HIQ) m1.castShadow=true; g.add(m1);
  /* Bogen als kurze Segmente */
  const R=0.9, seg=7;
  for(let i=0;i<seg;i++){
    const a0=i/seg*(Math.PI/2), a1=(i+1)/seg*(Math.PI/2);
    const x0=Math.sin(a0)*R, y0=R-Math.cos(a0)*R, x1=Math.sin(a1)*R, y1=R-Math.cos(a1)*R;
    const len=Math.hypot(x1-x0,y1-y0);
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.062,0.066,len*1.08,10),mast);
    b.position.set(0,4.77+ (y0+y1)/2, (x0+x1)/2);
    b.rotation.x=Math.atan2(x1-x0,y1-y0);
    g.add(b);
  }
  /* Leuchtenkopf mit Wanne */
  const kopf=new THREE.Group(); kopf.position.set(0,5.63,0.9); kopf.rotation.x=0.06; g.add(kopf);
  const geh=rbox(0.3,0.11,0.82,0.04,std(0x3b414c,{metalness:0.55,roughness:0.4}),0,0.06,0,kopf);
  bbox(0.26,0.03,0.74,std(0x71787f,{metalness:0.6}),0,0.005,0,kopf,false);
  const lm=new THREE.MeshStandardMaterial({color:LIN(0x23262e),emissive:LIN(0xffe9c0),emissiveIntensity:0});
  lampMats.push(lm);
  const wanne=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.045,0.7),lm);
  wanne.position.set(0,-0.02,0); kopf.add(wanne);
  /* Halterung und Deckel */
  bbox(0.16,0.09,0.16,std(0x2f343e,{metalness:0.5}),0,0.06,-0.44,kopf,false);
  bbox(0.24,0.02,0.6,std(0x4d535d,{metalness:0.6}),0,0.125,0.02,kopf,false);
  col(x-0.22,x+0.22,z-0.22,z+0.22);
  return g;
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
function buildStreet(){
  // Bordstein und Gehweg gegenüber
  bbox(60,0.16,0.26,std(0x9aa0a8,{roughness:0.95}),0,0.08,17.4,null,false);
  const gw=concreteTex(); gw.repeat.set(30,3);
  flat(60,5,new THREE.MeshStandardMaterial({map:gw,roughness:0.92}),0,0.015,19.9);
  for(let i=-7;i<=7;i++){ if(Math.random()<0.6) bbox(rand(1.0,2.4),0.18,0.5,std(0xe8ecf2,{roughness:1}),i*4,0.14,17.1,null,false); }
  // Fahrbahnmarkierung und Gullys
  for(let i=-12;i<=12;i++) flat(2.2,0.16,std(0xd9d4c2),i*4,0.014,13.2);
  for(const x of [-16,12]){ const gu=new THREE.Mesh(new THREE.CircleGeometry(0.42,14),std(0x3a3d44,{metalness:0.4,roughness:0.7})); gu.rotation.x=-Math.PI/2; gu.position.set(x,0.016,15.6); scene.add(gu); }
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
}

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
    const p2=bbox(0.07,h+0.06,0.07,post,x,(h+0.06)/2,z,null,false); p2.rotation.y=ry;
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
function buildZaun(){
  const H=2.0, T=LAY.test;
  zaunLauf(T.x0,T.z0,T.x1,T.z0,H);            /* Sueden        */
  zaunLauf(T.x1,T.z0,T.x1,LAY.sued.z0,H);     /* Osten, unten  */
  col(T.x0,T.x1,T.z0-0.1,T.z0+0.1);
  col(T.x1-0.1,T.x1+0.1,T.z0,LAY.sued.z0);
  /* Warnschild am Zaun */
  plane(1.6,0.9,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,map:tex(320,180,(g,W,Hh)=>{
    g.fillStyle='#f2c230'; g.fillRect(0,0,W,Hh);
    g.strokeStyle='#1f1f24'; g.lineWidth=8; g.strokeRect(6,6,W-12,Hh-12);
    g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#1f1f24';
    g.font=BUN(34); g.fillText('TESTFELD',W/2,48);
    g.font=BAR(26); g.fillText('Zutritt nur für Personal',W/2,92);
    g.fillText('Schutzbrille tragen',W/2,126); })}),
    (T.x0+T.x1)/2,1.2,T.z0+0.12,0,null);
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
  if(lit){
    if(o.shop){ g.fillStyle=o.shopWarm; g.fillRect(W*0.08,gy+34,W*0.84,gfH-60);
      g.fillStyle=o.shopSign; g.fillRect(W*0.06,gy+6,W*0.88,26); }
    return;
  }
  g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,gy-6,W,6);
  if(o.shop){
    g.fillStyle='#2a2f3a'; g.fillRect(W*0.04,gy,W*0.92,gfH);
    g.fillStyle=o.shopSign; g.fillRect(W*0.06,gy+6,W*0.88,26);
    g.fillStyle='#10131a'; g.font=`${Math.round(W*0.075)}px Bungee, Impact, sans-serif`; g.textAlign='center'; g.textBaseline='middle';
    fitFont(g,o.shopName,W*0.8,Math.round(W*0.075),BUN); g.fillText(o.shopName,W/2,gy+20);
    g.fillStyle='#1b2430'; g.fillRect(W*0.08,gy+34,W*0.84,gfH-60);
    const sg=g.createLinearGradient(W*0.08,gy+34,W*0.92,gy+gfH-26); sg.addColorStop(0,'rgba(200,220,245,.3)'); sg.addColorStop(0.45,'rgba(200,220,245,.05)'); sg.addColorStop(1,'rgba(200,220,245,.22)');
    g.fillStyle=sg; g.fillRect(W*0.08,gy+34,W*0.84,gfH-60);
    g.fillStyle='#e9e4da'; g.fillRect(W*0.5-2,gy+34,4,gfH-60);
    g.fillStyle='#3a4150'; g.fillRect(W*0.08,gy+gfH-26,W*0.84,26);
  } else {
    g.fillStyle='#6b4a34'; g.fillRect(W*0.38,gy+gfH*0.25,W*0.24,gfH*0.75);
    g.fillStyle='#8a6448'; g.fillRect(W*0.39,gy+gfH*0.27,W*0.22,gfH*0.7);
    g.fillStyle='#1d242f'; g.fillRect(W*0.44,gy+gfH*0.33,W*0.12,gfH*0.2);
    g.fillStyle='#d8d2c6'; g.fillRect(W*0.355,gy+gfH*0.2,W*0.29,10);
    g.fillStyle='#c9c2b4'; g.fillRect(W*0.34,gy+gfH*0.92,W*0.32,gfH*0.08);
    for(let i=0;i<3;i++){ g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(W*0.4+i*W*0.07,gy+gfH*0.42,W*0.04,W*0.03); }
  }
  // Fallrohr
  g.fillStyle='rgba(40,36,32,.7)'; g.fillRect(W-16,34,9,H-34);
  for(let y=60;y<H;y+=90){ g.fillStyle='rgba(30,26,22,.8)'; g.fillRect(W-19,y,15,5); }
  // Sockel
  g.fillStyle='rgba(60,56,50,.55)'; g.fillRect(0,H-16,W,16);
}
function buildHaus(x,z,w,d,h,o){
  const g=new THREE.Group(); g.position.set(x,0,z);
  /* Die texturierte Front liegt auf +z. Die Zeile steht aber jenseits der
     Strasse, also muss sie sich zum Laden drehen. */
  g.rotation.y=Math.PI; scene.add(g);
  const q=COARSE?0.5:1, px=Math.round(clamp(w*46,192,512)*q), py=Math.round(clamp(h*46,256,640)*q);
  const m=new THREE.MeshStandardMaterial({color:LIN(0xffffff),roughness:0.94,
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
  /* Erdgeschoss als echte Schaufensterfront */
  {
    const gfH=h*0.3, rahmen=std(0x2f3540,{metalness:0.3,roughness:0.5});
    const scheibe=new THREE.MeshStandardMaterial({color:LIN(0x2a3646),roughness:0.12,metalness:0.25,transparent:true,opacity:0.72});
    const bw=w*0.78;
    bbox(bw+0.16,0.22,0.22,rahmen,0,gfH+0.05,zf+0.1,g,false);          // Sturz
    bbox(bw+0.16,0.16,0.22,rahmen,0,0.62,zf+0.1,g,false);              // Brueste
    const np=Math.max(2,Math.round(bw/1.5));
    for(let i=0;i<=np;i++) bbox(0.1,gfH-0.5,0.2,rahmen,-bw/2+i*(bw/np),0.68+(gfH-0.5)/2,zf+0.1,g,false);
    const sc=bbox(bw,gfH-0.56,0.05,scheibe,0,0.7+(gfH-0.56)/2,zf+0.06,g,false);
    /* Eingangstuer seitlich */
    bbox(0.95,gfH-0.1,0.12,rahmen,w*0.34,(gfH-0.1)/2,zf+0.12,g,false);
    bbox(0.72,gfH-0.34,0.06,scheibe,w*0.34,(gfH-0.34)/2+0.1,zf+0.16,g,false);
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
  // Markise über dem Laden
  if(o.shop&&Math.random()<0.7){
    const mt=tex(128,64,(c,W,H)=>{ for(let i=0;i<8;i++){ c.fillStyle=i%2?o.shopSign:'#f2efe6'; c.fillRect(i*W/8,0,W/8,H); } });
    const aw=new THREE.Mesh(new THREE.BoxGeometry(w*0.8,0.08,1.2),new THREE.MeshStandardMaterial({map:mt,roughness:0.9}));
    aw.position.set(0,h*0.3+0.5,d/2+0.6); aw.rotation.x=-0.22; if(HIQ) aw.castShadow=true; g.add(aw);
    bbox(w*0.8,0.1,0.5,std(0xe8ecf2),0,h*0.3+0.62,d/2+0.35,g,false);
  }
  return g;
}
function makeAuto(col,form){
  /* Karosserie aus vielen weich abgerundeten Volumen statt aus Kisten:
     Motorhaube, geneigte Scheiben, Dachbogen, Radlaeufe, Schweller,
     Leuchten mit Glas, Spiegel, Griffe, Kennzeichen, Auspuff. */
  form=form||pick(['kombi','limo','van','suv']);
  const parts=[], dark=0x14161c, glas=0x1d2836, chrome=0xb9bec8, gummi=0x0f1116;
  const SEG=HIQ?4:2;
  const RB=(w,h,d,r)=>roundedBoxGeo(w,h,d,r,SEG);
  const CY=(r1,r2,h,sg)=>new THREE.CylinderGeometry(r1,r2,h,sg||(HIQ?20:12));
  const P=(geo,x,y,z,rx,ry,rz,c)=>parts.push({geo,m:tm(x,y,z,rx||0,ry||0,rz||0),color:c});

  const L = form==='van'?4.75 : form==='suv'?4.5 : form==='kombi'?4.45 : 4.25;
  const B = form==='van'?1.92 : form==='suv'?1.9 : 1.8;
  const bodenY = form==='suv'?0.36 : form==='van'?0.34 : 0.28;
  const kabH = form==='van'?1.22 : form==='suv'?0.82 : 0.66;
  const kabL = form==='kombi'?2.6 : form==='van'?3.2 : form==='suv'?2.4 : 2.05;
  const kabZ = form==='kombi'?-0.08 : form==='van'?0.06 : -0.22;
  const gY = bodenY+0.58;                       // Guerteillinie

  /* Bodengruppe und Schweller */
  P(RB(B-0.1,0.3,L-0.3,0.1),0,bodenY+0.12,0,0,0,0,dark);
  for(const s2 of [-1,1]) P(RB(0.1,0.17,L-1.6,0.05),s2*(B/2-0.04),bodenY+0.12,0,0,0,0,gummi);

  /* Hauptvolumen: drei ueberlappende Koerper geben eine weiche Flanke */
  P(RB(B,0.62,L,0.26),0,gY-0.1,0,0,0,0,col);
  P(RB(B-0.06,0.3,L-0.5,0.14),0,gY+0.2,0,0,0,0,col);
  /* Motorhaube faellt nach vorn ab */
  P(RB(B-0.12,0.22,1.35,0.16),0,gY+0.28,L/2-0.78,-0.05,0,0,col);
  P(RB(B-0.2,0.12,0.7,0.1),0,gY+0.3,L/2-0.3,-0.14,0,0,col);
  /* Heck */
  if(form==='kombi'||form==='van') P(RB(B-0.08,kabH*0.9,0.5,0.16),0,gY+0.2+kabH*0.45,-L/2+0.3,0,0,0,col);
  else P(RB(B-0.16,0.2,0.85,0.12),0,gY+0.28,-L/2+0.5,0.07,0,0,col);

  /* Fahrgastzelle: Dachbogen aus drei Lagen */
  P(RB(B-0.14,kabH,kabL,0.24),0,gY+0.2+kabH/2,kabZ,0,0,0,col);
  P(RB(B-0.3,0.16,kabL-0.5,0.1),0,gY+0.2+kabH+0.04,kabZ,0,0,0,col);
  /* Seitenscheiben und Heckscheibe als eigene, leicht eingelassene Flaechen */
  P(RB(B-0.06,kabH*0.6,kabL-0.34,0.12),0,gY+0.26+kabH*0.52,kabZ,0,0,0,glas);
  /* Frontscheibe geneigt */
  P(RB(B-0.22,0.62,0.16,0.05),0,gY+0.2+kabH*0.55,kabZ+kabL/2+0.03,-0.44,0,0,glas);
  /* Heckscheibe */
  P(RB(B-0.26,0.5,0.14,0.05),0,gY+0.2+kabH*0.58,kabZ-kabL/2-0.02,form==='kombi'?-0.12:0.42,0,0,glas);
  /* Fensterrahmen in Chrom */
  for(const s2 of [-1,1]) P(RB(0.035,0.04,kabL-0.32,0.015),s2*(B/2-0.04),gY+0.24+kabH*0.82,kabZ,0,0,0,chrome);
  /* B-Saeule */
  for(const s2 of [-1,1]) P(RB(0.05,kabH*0.62,0.11,0.02),s2*(B/2-0.045),gY+0.26+kabH*0.52,kabZ-0.1,0,0,0,0x23272f);
  /* Dach mit Schnee */
  P(RB(B-0.36,0.06,kabL-0.6,0.03),0,gY+0.28+kabH+0.04,kabZ,0,0,0,0xe8ecf2);

  /* Radlaeufe und Raeder */
  const rad = form==='suv'?0.38 : form==='van'?0.36 : 0.33;
  const RX=B/2-0.03, RZ=L/2-1.12;
  for(const [sx,sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){
    const x=sx*RX, z=sz*RZ;
    /* Kotfluegelbogen */
    P(new THREE.TorusGeometry(rad+0.08,0.075,HIQ?8:5,HIQ?18:10,Math.PI),x-sx*0.03,rad+0.02,z,0,Math.PI/2,0,col);
    /* Reifen mit Flanke und Profil */
    P(CY(rad,rad,0.23),x,rad,z,0,0,Math.PI/2,gummi);
    P(CY(rad*0.99,rad*0.99,0.245,HIQ?24:12),x,rad,z,0,0,Math.PI/2,0x191c22);
    /* Felge, Speichen, Nabe */
    P(CY(rad*0.66,rad*0.66,0.255),x*1.005,rad,z,0,0,Math.PI/2,0x9aa1ac);
    for(let k=0;k<5;k++){ const a=k/5*Math.PI*2;
      P(RB(0.055,rad*0.9,0.05,0.02),x*1.02,rad+Math.cos(a)*rad*0.3,z+Math.sin(a)*rad*0.3,0,0,a,0x7d838c); }
    P(CY(rad*0.2,rad*0.2,0.27,10),x*1.02,rad,z,0,0,Math.PI/2,0x5a6068);
    P(CY(rad*0.08,rad*0.08,0.28,8),x*1.03,rad,z,0,0,Math.PI/2,chrome);
  }

  /* Stossfaenger mit Unterfahrschutz */
  P(RB(B+0.02,0.26,0.34,0.1),0,gY-0.3,L/2+0.02,0,0,0,0x2b2f38);
  P(RB(B+0.02,0.26,0.34,0.1),0,gY-0.3,-L/2-0.02,0,0,0,0x2b2f38);
  P(RB(B-0.3,0.09,0.2,0.04),0,gY-0.44,L/2+0.06,0,0,0,0x8f959e);
  /* Grill mit Lamellen */
  P(RB(B*0.55,0.2,0.1,0.03),0,gY-0.06,L/2+0.09,0,0,0,0x11141a);
  for(let k=0;k<4;k++) P(RB(B*0.52,0.02,0.06,0.01),0,gY-0.12+k*0.045,L/2+0.11,0,0,0,chrome);
  /* Scheinwerfer: Gehaeuse, Glas, zwei Reflektoren */
  for(const s2 of [-1,1]){
    P(RB(0.46,0.19,0.16,0.06),s2*(B/2-0.3),gY,L/2+0.02,0,0,0,0x1b1e25);
    P(RB(0.42,0.15,0.09,0.04),s2*(B/2-0.3),gY,L/2+0.07,0,0,0,0xdfe8f4);
    for(const dx of [-0.09,0.09]) P(CY(0.055,0.055,0.06,10),s2*(B/2-0.3)+dx,gY,L/2+0.1,Math.PI/2,0,0,0xf6f4ea);
    /* Rueckleuchten */
    P(RB(0.4,0.24,0.14,0.05),s2*(B/2-0.28),gY+0.03,-L/2-0.02,0,0,0,0x2a1214);
    P(RB(0.34,0.18,0.07,0.03),s2*(B/2-0.28),gY+0.03,-L/2-0.07,0,0,0,0x9a2a24);
    P(RB(0.1,0.1,0.06,0.02),s2*(B/2-0.44),gY+0.03,-L/2-0.08,0,0,0,0xe8b060);
    P(RB(0.09,0.09,0.06,0.02),s2*(B/2-0.14),gY+0.03,-L/2-0.08,0,0,0,0xf2f2ee);
  }
  /* Kennzeichen */
  for(const sz of [1,-1]) P(RB(0.52,0.12,0.03,0.01),0,gY-0.34,sz*(L/2+0.19),0,0,0,0xf2f2ee);
  /* Spiegel mit Arm */
  for(const s2 of [-1,1]){
    P(RB(0.09,0.05,0.09,0.02),s2*(B/2+0.02),gY+0.42,kabZ+kabL/2-0.12,0,0,0,col);
    P(RB(0.2,0.12,0.08,0.03),s2*(B/2+0.1),gY+0.44,kabZ+kabL/2-0.17,0,0,0.12,col);
    P(RB(0.16,0.09,0.02,0.01),s2*(B/2+0.14),gY+0.44,kabZ+kabL/2-0.17,0,0,0.12,0x59606b);
  }
  /* Tuergriffe, Fuge, Tankklappe */
  for(const s2 of [-1,1]){
    for(const dz of [kabZ+0.35,kabZ-0.55]) P(RB(0.045,0.05,0.2,0.018),s2*(B/2+0.005),gY+0.16,dz,0,0,0,chrome);
    P(RB(0.012,0.62,0.02,0.005),s2*(B/2+0.008),gY,kabZ+kabL/2-0.18,0,0,0,0x0f1116);
    P(RB(0.012,0.44,0.02,0.005),s2*(B/2+0.008),gY,kabZ-kabL/2+0.22,0,0,0,0x0f1116);
  }
  P(RB(0.02,0.18,0.18,0.02),B/2+0.005,gY+0.02,-L/2+0.95,0,0,0,0x0f1116);
  /* Scheibenwischer */
  for(const s2 of [-1,1]) P(RB(0.42,0.02,0.02,0.008),s2*0.3,gY+0.24,kabZ+kabL/2+0.16,0,0,s2*0.25,0x1b1e25);
  /* Auspuff */
  P(CY(0.045,0.05,0.16,10),0.42,gY-0.46,-L/2-0.06,Math.PI/2,0,0,chrome);
  /* Antenne */
  P(CY(0.012,0.018,0.28,6),0,gY+0.3+kabH,kabZ-kabL/2+0.1,0.25,0,0,0x23272f);

  const mesh=new THREE.Mesh(merge(parts),vcMat);
  if(HIQ){ mesh.castShadow=true; mesh.receiveShadow=true; }
  return mesh;
}
function makeBaum(){
  /* Echter Winterbaum: Wurzelanlauf, sich verjuengender Stamm mit
     Neigung, drei Astordnungen mit abnehmendem Radius und Laenge,
     feine Zweige an den Enden, Schnee auf den Oberseiten. */
  const parts=[];
  const RINDE=[0x4a3a2c,0x53422f,0x5c4a35,0x463728], SCHNEE=0xe8ecf2;
  const tiefe=HIQ?3:2, SEG=HIQ?8:5;
  let aeste=0;
  /* Ein Segment von p in Richtung (dir) mit Laenge l und Radien r0/r1 */
  const seg=(p,dir,l,r0,r1,col)=>{
    const e={x:p.x+dir.x*l,y:p.y+dir.y*l,z:p.z+dir.z*l};
    const m={x:(p.x+e.x)/2,y:(p.y+e.y)/2,z:(p.z+e.z)/2};
    const len=Math.hypot(dir.x,dir.y,dir.z)*l;
    /* Ausrichtung: Zylinder zeigt in +y, also um x und z kippen */
    const rz=Math.atan2(dir.x,dir.y), rx=-Math.atan2(dir.z,Math.hypot(dir.x,dir.y));
    parts.push({geo:new THREE.CylinderGeometry(r1,r0,len,Math.max(4,SEG-(r0<0.05?3:0))),
      m:tm(m.x,m.y,m.z,rx,0,rz),color:col});
    /* Knoten an der Gabelung, damit keine Kante klafft */
    if(r1>0.03) parts.push({geo:new THREE.SphereGeometry(r1*1.12,6,4),m:tm(e.x,e.y,e.z),color:col});
    return e;
  };
  const norm=v=>{ const n=Math.hypot(v.x,v.y,v.z)||1; return {x:v.x/n,y:v.y/n,z:v.z/n}; };
  const ast=(p,dir,l,r,d)=>{
    aeste++;
    const col=pick(RINDE);
    /* Leichter Bogen: der Ast wird in zwei Teilen gesetzt */
    const d1=norm({x:dir.x,y:dir.y,z:dir.z});
    const e1=seg(p,d1,l*0.55,r,r*0.74,col);
    const droop=d>0?-0.12:-0.03;
    const d2=norm({x:d1.x*1.12+rand(-0.12,0.12),y:d1.y+droop,z:d1.z*1.12+rand(-0.12,0.12)});
    const e2=seg(e1,d2,l*0.45,r*0.74,r*0.5,col);
    /* Schneeauflage auf der Oberseite des Astes */
    if(r>0.035) parts.push({geo:new THREE.CylinderGeometry(r*0.42,r*0.62,l*0.5,4),
      m:tm((p.x+e1.x)/2,(p.y+e1.y)/2+r*0.7,(p.z+e1.z)/2,
           -Math.atan2(d1.z,Math.hypot(d1.x,d1.y)),0,Math.atan2(d1.x,d1.y)),color:SCHNEE});
    if(d<=0){
      /* Feine Endzweige */
      for(let k=0;k<3;k++){
        const dz=norm({x:d2.x+rand(-0.55,0.55),y:d2.y+rand(-0.1,0.35),z:d2.z+rand(-0.55,0.55)});
        seg(e2,dz,l*rand(0.2,0.36),r*0.5,r*0.16,col);
      }
      return;
    }
    const n=2+(Math.random()<0.45?1:0);
    for(let k=0;k<n;k++){
      const dz=norm({x:d2.x+rand(-0.75,0.75),y:d2.y+rand(0.05,0.45),z:d2.z+rand(-0.75,0.75)});
      ast(e2,dz,l*rand(0.52,0.68),r*rand(0.46,0.6),d-1);
    }
  };
  /* Wurzelanlauf */
  for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+rand(-0.18,0.18);
    parts.push({geo:new THREE.CylinderGeometry(0.045,0.15,0.62,6),
      m:tm(Math.cos(a)*0.17,0.24,Math.sin(a)*0.17,0.42*Math.sin(a+Math.PI/2),0,-0.42*Math.cos(a+Math.PI/2)),color:RINDE[3]}); }
  /* Stamm in vier Abschnitten, jeder etwas schlanker und leicht versetzt */
  let p={x:0,y:0,z:0}, r=0.23;
  const gabeln=[];
  for(let i=0;i<4;i++){
    const h=rand(0.7,0.95), nr=r*rand(0.76,0.85);
    const d=norm({x:rand(-0.09,0.09),y:1,z:rand(-0.09,0.09)});
    p=seg(p,d,h,r,nr,RINDE[i%2]);
    r=nr;
    if(i>=1) gabeln.push({p:{x:p.x,y:p.y,z:p.z},r});
  }
  /* Krone: Hauptaeste aus den oberen Gabelungen */
  const n=HIQ?6:4;
  for(let i=0;i<n;i++){
    const gsel=gabeln[Math.min(gabeln.length-1,Math.floor(i/n*gabeln.length))];
    const a=i/n*Math.PI*2+rand(-0.4,0.4), auf=rand(0.55,1.05);
    ast(gsel.p,norm({x:Math.cos(a),y:auf,z:Math.sin(a)}),rand(1.0,1.5),gsel.r*rand(0.5,0.68),tiefe-1);
  }
  /* Spitze */
  ast(p,norm({x:rand(-0.15,0.15),y:1,z:rand(-0.15,0.15)}),rand(0.8,1.1),r*0.8,tiefe-1);
  const m=new THREE.Mesh(merge(parts),vcMat); if(HIQ) m.castShadow=true; return m;
}
/* =========================================================
   Nachbargrundstueck rechts vom Laden: Backsteinfassade mit
   Verkaufsschild. Hier waechst der Laden spaeter hinein.
   ========================================================= */
function buildNachbar(){
  /* Die Ladenzeile laeuft bis ans Ende des Blocks. Jeder Abschnitt
     gehoert zu einer Ausbaustufe und steht bis dahin leer. */
  nachbarFassade(8.1,20.0,'shop_gross','ca. 142 m² · direkt nebenan');
  nachbarFassade(20.0,37.9,'shop_ost','ca. 212 m² · Eckhaus der Zeile');
}
function nachbarFassade(x0,x1,zid,unterzeile){
  const zf=6.1, H=WH+0.6;
  const g=new THREE.Group(); scene.add(g);
  /* Backsteinwand mit Verband, Fugen und Ausblühungen */
  const zieg=tex(512,512,(c,W,Hh)=>{
    c.fillStyle='#6a5348'; c.fillRect(0,0,W,Hh);
    const rows=16, bh=Hh/rows;
    for(let r=0;r<rows;r++){ const off=(r%2)*40;
      for(let x=-80;x<W;x+=80){
        c.fillStyle=pick(['#8a4f3c','#7e4735','#93573f','#74402f','#8a5a44','#6d4132']);
        c.fillRect(x+off+3,r*bh+3,74,bh-6);
        c.fillStyle='rgba(255,255,255,.06)'; c.fillRect(x+off+3,r*bh+3,74,2);
        c.fillStyle='rgba(0,0,0,.16)'; c.fillRect(x+off+3,r*bh+bh-5,74,2);
      } }
    for(let i=0;i<9;i++){ const x=Math.random()*W;
      const gr=c.createLinearGradient(x,0,x,Hh); gr.addColorStop(0,'rgba(230,226,214,.20)'); gr.addColorStop(1,'rgba(230,226,214,0)');
      c.fillStyle=gr; c.fillRect(x,rand(0,Hh*0.4),rand(20,70),Hh); }
    for(let i=0;i<2200;i++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.05})`; c.fillRect(Math.random()*W,Math.random()*Hh,2,2); }
  });
  /* UV in Metern: dadurch passt der Verband ueber alle Wandstuecke hinweg */
  zieg.wrapS=zieg.wrapT=THREE.RepeatWrapping; zieg.repeat.set(1/1.6,1/1.6); zieg.anisotropy=8;
  const zm=new THREE.MeshStandardMaterial({map:zieg,roughness:0.95});
  const w=x1-x0, cx=(x0+x1)/2;
  /* Die Fassade hat echte Oeffnungen. Solange nebenan nicht gekauft ist,
     sind sie zugemauert; nach dem Kauf sitzen dort Schaufenster.
     Die Achsen werden ueber die Laenge verteilt: die erste als hohes
     Schaufenster, die uebrigen als Fenster ueber Brueckungshoehe. */
  const OEFF=[]; const n=Math.max(2,Math.floor((w-0.8)/2.6));
  for(let i=0;i<n;i++){ const a=x0+0.9+i*2.6;
    OEFF.push(i%3===0?[a,a+1.6,0,2.3]:[a,a+1.6,0.9,2.5]); }
  const F=(a,b,y0,y1)=>{ if(b>a+0.01) wall(a,b,zf-0.3,zf+0.1,y0,y1,'-z',shopWall,zm); };
  let px=x0;
  for(const [a,b,y0,y1] of OEFF){
    F(px,a,0,H); F(a,b,y1,H); if(y0>0) F(a,b,0,y0); px=b;
  }
  F(px,x1,0,H);
  /* Attika, Gesims und Sockel */
  bbox(w+0.2,0.28,0.56,std(0x5f584e,{roughness:1}),cx,H+0.12,zf-0.1,g);
  bbox(w+0.1,0.1,0.5,std(0xe8ecf2,{roughness:1}),cx,H+0.3,zf-0.1,g,false);
  bbox(w+0.12,0.5,0.5,std(0x6f6a62,{roughness:0.96}),cx,0.25,zf-0.06,g);

  /* ---------- Zustand „steht zum Verkauf“ ---------- */
  const gs=new THREE.Group(); g.add(gs); zWand(zid,gs);
  const brett=std(0x6d5a44,{roughness:0.95});
  const zugemauert=std(0x5a4a3e,{roughness:0.95});
  OEFF.forEach(([a,b,y0,y1],i)=>{
    const bw=b-a, bh=y1-y0, bxc=(a+b)/2, byc=(y0+y1)/2;
    bbox(bw,bh,0.34,zugemauert,bxc,byc,zf-0.1,gs,false);
    const n=Math.max(3,Math.round(bh/0.55));
    for(let k=0;k<n;k++) bbox(bw+0.14,0.16,0.06,brett,bxc,y0+0.22+k*(bh-0.4)/(n-1),zf+0.13,gs,false);
    /* zwei schraege Bretter ueber Kreuz */
    for(const sgn of [1,-1]){ const d=bbox(Math.hypot(bw,bh)+0.1,0.14,0.05,brett,bxc,byc,zf+0.15,gs,false);
      d.rotation.z=sgn*Math.atan2(bh,bw); }
  });
  /* Bauschild: Verkaufsflaeche wird verkauft */
  const schildT=tex(1024,512,(c,W,Hh)=>{
    c.fillStyle='#f4f2ea'; c.fillRect(0,0,W,Hh);
    c.fillStyle='#1b2340'; c.fillRect(0,0,W,96);
    c.fillStyle='#ffd23f'; c.textAlign='center'; c.textBaseline='middle';
    c.font=BUN(52); c.fillText('ZU VERKAUFEN',W/2,50);
    c.fillStyle='#1b2340'; c.font=BUN(66);
    c.fillText('VERKAUFSFLÄCHE',W/2,180);
    c.font=BAR(44); c.fillStyle='#3d4658';
    c.fillText(unterzeile,W/2,250);
    c.fillText('ideal zur Erweiterung',W/2,300);
    c.strokeStyle='#c8322a'; c.lineWidth=8; c.strokeRect(70,340,W-140,120);
    c.fillStyle='#c8322a'; c.font=BUN(46);
    c.fillText('ANFRAGE ÜBER DEN LAPTOP',W/2,402);
    c.strokeStyle='#1b2340'; c.lineWidth=10; c.strokeRect(5,5,W-10,Hh-10);
  });
  const rahmen=std(0x4a4f5a,{metalness:0.4,roughness:0.55});
  for(const sx of [-1.15,1.15]){
    const p2=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,2.6,10),rahmen);
    p2.position.set(cx+sx,1.3,zf+0.6); gs.add(p2);
    bbox(0.14,0.03,0.14,rahmen,cx+sx,0.016,zf+0.6,gs,false);
  }
  bbox(2.7,1.36,0.05,std(0x3a3f48,{roughness:0.7}),cx,1.85,zf+0.6,gs,false);
  plane(2.6,1.28,new THREE.MeshStandardMaterial({map:schildT,roughness:0.62}),cx,1.85,zf+0.635,0,gs);
  /* Bauzaunelement davor */
  for(let i=0,nz=Math.max(2,Math.floor((w-0.4)/2.2));i<nz;i++){
    const bx=x0+0.9+i*2.2;
    bbox(2.0,1.8,0.05,std(0x8a9099,{metalness:0.4,roughness:0.6}),bx,0.92,zf+1.25,gs,false);
    for(const sx of [-0.95,0.95]) bbox(0.07,1.85,0.07,std(0x6a7078,{metalness:0.5}),bx+sx,0.93,zf+1.25,gs,false);
    bbox(0.5,0.1,0.34,std(0x2f343c,{roughness:0.9}),bx-0.95,0.05,zf+1.25,gs,false);
    bbox(0.5,0.1,0.34,std(0x2f343c,{roughness:0.9}),bx+0.95,0.05,zf+1.25,gs,false);
  }
  zWandCol(zid,col(x0,x1,zf+1.1,zf+1.4));

  /* ---------- Zustand „gehoert dir“: Schaufenster ---------- */
  const go=new THREE.Group(); g.add(go); zAdd(zid,go);
  const glas=new THREE.MeshStandardMaterial({color:LIN(0xbfe0ff),transparent:true,opacity:0.16,roughness:0.05,metalness:0.2,depthWrite:false});
  const prof=std(0x2b3040,{metalness:0.5,roughness:0.4});
  const bank=std(0xd7dae0,{roughness:0.5});
  OEFF.forEach(([a,b,y0,y1],i)=>{
    const bw=b-a, bh=y1-y0, bxc=(a+b)/2, byc=(y0+y1)/2;
    bbox(bw-0.12,bh-0.12,0.04,glas,bxc,byc,zf-0.1,go,false);
    /* umlaufendes Profil aussen und innen */
    for(const zz of [zf+0.09,zf-0.29]){
      bbox(bw,0.1,0.06,prof,bxc,y1-0.05,zz,go,false);
      bbox(bw,0.1,0.06,prof,bxc,y0+0.05,zz,go,false);
      bbox(0.1,bh,0.06,prof,a+0.05,byc,zz,go,false);
      bbox(0.1,bh,0.06,prof,b-0.05,byc,zz,go,false);
    }
    /* Mittelsprosse */
    bbox(0.07,bh-0.1,0.05,prof,bxc,byc,zf-0.1,go,false);
    /* Fensterbank aussen */
    if(y0>0.2) bbox(bw+0.16,0.06,0.5,bank,bxc,y0-0.02,zf-0.02,go,false);
  });
  col(x0,x1,zf-0.35,zf+0.15);
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
  const carCols=[0xb8bcc4,0x2a3442,0x8a2f28,0x2f5d9e,0x3c4a3a,0xd8d4cc,0x6a5f55];
  for(let i=0;i<(COARSE?4:7);i++){ const c=makeAuto(pick(carCols),pick(['kombi','limo','van','suv','limo'])); c.position.set(-22+i*6.6+rand(-0.5,0.5),0,16.1); c.rotation.y=Math.PI/2+rand(-0.03,0.03); scene.add(c); }
  buildNachbar();
  buildMuelleimer(-3.1,7.55,0.4); buildMuelleimer(5.6,7.55,-0.3);
  // Bäume und Stadtmöbel auf unserer Seite
  for(const bx of (COARSE?[-16.5,13]:[-16.5,-11,13])){ const b=makeBaum(); b.position.set(bx,0,10.4); b.scale.setScalar(rand(0.9,1.2)); scene.add(b);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.06,6,14),std(0x3a3d44)); ring.rotation.x=Math.PI/2; ring.position.set(bx,0.06,10.4); scene.add(ring);
    col(bx-0.3,bx+0.3,10.1,10.7); }
  { const x2=-12.2;   // ein Mülleimer, abseits vom Eingang
    bbox(0.42,0.75,0.42,std(0x3b4050,{roughness:0.7}),x2,0.38,10.0,null,false);
    bbox(0.5,0.06,0.5,std(0x8a8f99),x2,0.78,10.0,null,false); col(x2-0.28,x2+0.28,9.75,10.25); }
}

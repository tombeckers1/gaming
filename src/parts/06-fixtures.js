
/* =========================================================
   Verschiebbare Einrichtung
   ========================================================= */
const movables=[];
/* Ein Rechteck in Gruppenkoordinaten, als achsenparalleles Rechteck
   in der Welt - fuer eine Gruppe an (x,z) mit Drehung ry. */
function rectWelt(x,z,ry,r){
  const s=Math.sin(ry), c=Math.cos(ry);
  let a=1e9,b=-1e9,e=1e9,f=-1e9;
  for(const lx of [r.x0,r.x1]) for(const lz of [r.z0,r.z1]){
    const wx=x+lx*c+lz*s, wz=z-lx*s+lz*c;
    a=Math.min(a,wx); b=Math.max(b,wx); e=Math.min(e,wz); f=Math.max(f,wz);
  }
  return {minX:a,maxX:b,minZ:e,maxZ:f};
}
function dropFootprint(m){
  if(m.col){ dropCol(m.col); m.col=null; }
  if(m.cols){ m.cols.forEach(dropCol); m.cols=null; }
}
function applyFootprint(m){
  if(typeof navDirty==='function') navDirty();
  dropFootprint(m);
  /* Grosse Einheiten wie die Packstation sind kein Klotz: sie
     blockieren nur dort, wo wirklich etwas steht. Auf der
     bemalten Flaeche dazwischen kann man laufen. */
  if(m.teile){
    m.cols=m.teile().map(t=>{ const w=rectWelt(m.g.position.x,m.g.position.z,m.g.rotation.y,t);
      return col(w.minX,w.maxX,w.minZ,w.maxZ,m); });
    return;
  }
  if(!m.fw) return;
  const s=Math.abs(Math.sin(m.g.rotation.y))>0.5, w=(s?m.fd:m.fw)/2, d=(s?m.fw:m.fd)/2;
  m.col=col(m.g.position.x-w,m.g.position.x+w,m.g.position.z-d,m.g.position.z+d,m);
}
function addMovable(m){ movables.push(m); applyFootprint(m); return m; }
function placeMovable(m,x,z,ry){ m.g.position.x=x; m.g.position.z=z; m.g.rotation.y=ry; applyFootprint(m); if(m.onPlace) m.onPlace(); }
function localToWorld(g,x,z){ const s=Math.sin(g.rotation.y), c=Math.cos(g.rotation.y); return V(g.position.x+x*c+z*s,0,g.position.z-x*s+z*c); }

/* =========================================================
   Kasse mit Laufband (als Gruppe, verschiebbar)
   ========================================================= */
const BELT_A=1.45, BELT_B=0.12, BELT_Y=0.972;
let ckG=null, ckMov=null, ckNameTex=null;
/* Die Blende hat dieselbe Farbe wie der Korpus, die Schrift ist hell
   und steht rechts (Tom, 25.09.). Vorher hellgraue Blende mit
   Anthrazit-Schrift in Bungee, mittig. */
const CK_BLENDE='#2b2e34';
const CK_SCHRIFT=s=>`700 ${s}px Cinzel, Georgia, "Times New Roman", serif`;
function drawCkName(g,W,H){
  g.fillStyle=CK_BLENDE; g.fillRect(0,0,W,H);
  const t=shopName().toUpperCase(), rechts=W-34;
  g.textAlign='right'; g.textBaseline='middle';
  if('letterSpacing' in g) g.letterSpacing='6px';
  fitFont(g,t,W-150,74,CK_SCHRIFT);
  const bw=g.measureText(t).width;
  g.fillStyle='#eef0f4'; g.fillText(t,rechts,H/2+4);
  /* feine Edelstahllinie links vom Namen */
  g.fillStyle='#9aa1ac'; g.fillRect(Math.max(20,rechts-bw-120),H/2+2,90,3);
  if('letterSpacing' in g) g.letterSpacing='0px';
}
/* Nach einer Umbenennung Schild und Kassenblende neu zeichnen */
function applyShopName(){
  if(ckNameTex) redraw(ckNameTex,(g,W,H)=>drawCkName(g,W,H));
  if(signTex) redraw(signTex,(g,W,H)=>drawSignFace(g,W,H));
}
/* Die Kasse steht links vom Eingang, laengs an der Trennwand (Tom,
   25.09.): die Kundenseite zeigt in den Raum, die Schlange laeuft
   von hinten auf die Tuer zu, bezahlt wird vorn am Eingang. Vorher
   stand sie rechts vom Eingang unter dem Schaufenster. */
const CK_HOME={x:0.7,z:2.2,ry:-Math.PI/2}, CK_ALT={x:-5,z:3.2,ry:0};
function ck(x,z){ return localToWorld(ckG,x,z); }
function ckYaw(){ return ckG.rotation.y; }
function buildCheckout(){
  ckG=new THREE.Group(); ckG.position.set(CK_HOME.x,0,CK_HOME.z); ckG.rotation.y=CK_HOME.ry; scene.add(ckG);
  /* Aussen neutral: Korpus und Blende Anthrazit, Zierleiste
     Edelstahl. Vorher Marineblau mit roter Leiste und gelber Schrift. */
  const corpus=std(0x2b2e34,{roughness:0.48,metalness:0.12}),
        panel=std(parseInt(CK_BLENDE.slice(1),16),{roughness:0.34,metalness:0.03}),
        laminat=std(0xd6dae2,{roughness:0.38,metalness:0.05}),
        steel=std(0xb8bec8,{metalness:0.72,roughness:0.28}),
        dark=std(0x14171f,{roughness:0.5}),
        rubber=std(0x1c1d22,{roughness:0.95}),
        accent=std(0xc9ced6,{metalness:0.85,roughness:0.22});
  /* Korpus mit Sockelrücksprung */
  const c=rbox(3.2,0.74,0.8,0.02,corpus,0,0.5,0,ckG); occluders.push(c);
  bbox(3.08,0.14,0.68,dark,0,0.07,0,ckG);
  bbox(3.22,0.04,0.82,steel,0,0.15,0,ckG,false);
  /* Frontblende zum Kunden */
  bbox(3.12,0.5,0.03,panel,0,0.56,0.405,ckG,false);
  bbox(3.14,0.045,0.035,accent,0,0.82,0.408,ckG,false);
  ckNameTex=tex(1000,136,(g,W,H)=>drawCkName(g,W,H));
  plane(1.5,0.2,new THREE.MeshStandardMaterial({roughness:0.34,metalness:0.03,map:ckNameTex}),0.74,0.6,0.423,0,ckG);
  /* Arbeitsplatte mit gerundeter Vorderkante */
  bbox(3.34,0.05,0.86,laminat,0,0.925,0,ckG);
  const edge=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,3.34,12),laminat);
  edge.rotation.z=Math.PI/2; edge.position.set(0,0.925,0.43); ckG.add(edge);
  /* Laufband mit Rollen und Seitenführung */
  beltTex=tex(512,256,(g,W,H)=>{
    g.fillStyle='#17181d'; g.fillRect(0,0,W,H);
    for(let x=0;x<W;x+=26){
      g.fillStyle='#252830'; g.fillRect(x,0,11,H);
      g.fillStyle='rgba(255,255,255,.07)'; g.fillRect(x+11,0,2,H);
      g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+24,0,2,H);
    }
    for(let i=0;i<5200;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.05})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
    for(let i=0;i<22;i++){ g.fillStyle=`rgba(0,0,0,${rand(0.05,0.14)})`; g.beginPath();
      g.ellipse(Math.random()*W,Math.random()*H,rand(6,22),rand(4,12),Math.random()*3,0,Math.PI*2); g.fill(); } });
  beltTex.wrapS=beltTex.wrapT=THREE.RepeatWrapping; beltTex.repeat.set(6,1);
  const BL=BELT_A-BELT_B+0.12, BX=(BELT_A+BELT_B)/2;
  bbox(BL,0.03,0.46,new THREE.MeshStandardMaterial({map:beltTex,roughness:0.85}),BX,0.956,0,ckG,false);
  for(const s2 of [-1,1]){
    bbox(BL+0.06,0.05,0.03,steel,BX,0.965,s2*0.245,ckG);
    bbox(BL+0.06,0.012,0.012,std(0xf2c230),BX,0.992,s2*0.245,ckG,false);
  }
  for(const ex of [BELT_B-0.04,BELT_A+0.06]){
    const rl=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.47,14),steel);
    rl.rotation.x=Math.PI/2; rl.position.set(ex,0.956,0); ckG.add(rl);
  }
  bbox(0.07,0.1,0.5,std(0x2a2e38,{metalness:0.4}),BELT_A+0.12,0.94,0,ckG);
  /* Warentrenner */
  { const t=new THREE.Group(); t.position.set(BELT_A-0.25,0.985,0); t.rotation.y=0.08; ckG.add(t);
    bbox(0.035,0.055,0.42,std(0x2f3a5e),0,0,0,t,false);
    plane(0.4,0.05,new THREE.MeshStandardMaterial({map:tex(600,78,(g,W,H)=>{ g.fillStyle='#2f3a5e'; g.fillRect(0,0,W,H); g.fillStyle='#ffd23f'; g.font=BAR(51); g.textAlign='center'; g.textBaseline='middle'; g.fillText('NÄCHSTER KUNDE',W/2,H/2+3); })}),0.019,0,0,Math.PI/2,t); }
  /* Scanner: eine in die Platte eingelassene Glasscheibe, sonst nichts */
  {
    const bezel=std(0xaeb4bd,{metalness:0.18,roughness:0.5});
    const frameIn=std(0x30353d,{metalness:0.1,roughness:0.62});
    const scanGlass=new THREE.MeshStandardMaterial({
      color:LIN(0x121620),roughness:0.07,metalness:0.25,
      map:tex(512,512,(g,W,H)=>{
        g.fillStyle='#10141c'; g.fillRect(0,0,W,H);
        const gl=g.createLinearGradient(0,0,W*0.7,H);
        gl.addColorStop(0,'rgba(210,226,244,.24)'); gl.addColorStop(0.35,'rgba(210,226,244,.05)');
        gl.addColorStop(0.62,'rgba(210,226,244,.14)'); gl.addColorStop(1,'rgba(210,226,244,.03)');
        g.fillStyle=gl; g.fillRect(0,0,W,H);
        for(let i=0;i<70;i++){ g.strokeStyle=`rgba(230,238,250,${rand(0.02,0.07)})`; g.lineWidth=rand(0.6,1.6);
          const x=Math.random()*W, y=Math.random()*H;
          g.beginPath(); g.moveTo(x,y); g.lineTo(x+rand(-70,70),y+rand(-18,18)); g.stroke(); }
        for(let i=0;i<900;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.035})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
      })});
    rbox(0.5,0.05,0.44,0.012,bezel,-0.22,0.938,0,ckG);
    bbox(0.42,0.035,0.36,frameIn,-0.22,0.958,0,ckG,false);
    const pane=plane(0.38,0.32,scanGlass,-0.22,0.9765,0,0,ckG);
    pane.rotation.x=-Math.PI/2;
    const led=new THREE.MeshBasicMaterial({color:0x4dff92,toneMapped:false});
    bbox(0.026,0.026,0.01,led,-0.42,0.9775,0.16,ckG,false);
  }
  /* Kassenmonitor auf Schwenkarm */
  bbox(0.16,0.03,0.16,std(0x2c3140,{metalness:0.3}),-0.8,0.96,-0.06,ckG,false);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.028,0.34,12),steel); post.position.set(-0.8,1.12,-0.06); ckG.add(post);
  const arm=bbox(0.04,0.04,0.16,steel,-0.8,1.29,-0.01,ckG,false); arm.rotation.x=0.5;
  const scrBody=rbox(0.44,0.32,0.035,0.01,dark,-0.8,1.4,-0.06,ckG); scrBody.rotation.x=0.16;
  posTex=tex(1024,720,()=>{});
  const scr=plane(0.4,0.275,new THREE.MeshBasicMaterial({map:posTex,toneMapped:false}),0,0,-0.02,Math.PI,scrBody);
  bbox(0.46,0.02,0.05,dark,-0.8,1.23,-0.056,ckG,false);
  /* Tastatur und Kassenlade: die Tastatur liegt auf der Bedienerseite
     vor dem Monitor, nicht dahinter beim Kunden. */
  /* Kassentastatur: Wanne mit Rand, beschriftete Tasten, farbige
     Funktionsblöcke und Summentaste. */
  {
    const kbT=tex(768,384,(g,W,H)=>{
      g.fillStyle='#1b1f28'; g.fillRect(0,0,W,H);
      const cols=8, rows=4, mx=26, my=22;
      const cw=(W-mx*2)/cols, ch=(H-my*2)/rows;
      const label=['7','8','9','STORNO','4','5','6','KARTE','1','2','3','BAR','0','00',',','SUMME'];
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
        const i=r*cols+c;
        const x=mx+c*cw+3, y=my+r*ch+3, w=cw-6, h=ch-6;
        const isFn=c>=6, isSum=(r===3&&c>=6);
        /* Tastenschatten und Kappe */
        g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(x+2,y+3,w,h);
        const base=isSum?'#2f7a48':isFn?'#3d4658':'#e8e9ec';
        const top =isSum?'#3f9a5c':isFn?'#4e596e':'#f7f8fa';
        const gr=g.createLinearGradient(0,y,0,y+h);
        gr.addColorStop(0,top); gr.addColorStop(1,base);
        g.fillStyle=gr; g.fillRect(x,y,w,h);
        g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(x,y,w,2);
        g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x,y+h-2,w,2);
        /* Beschriftung */
        const t=label[(r*4+(c%4))%label.length];
        g.fillStyle=isFn||isSum?'#eef2f8':'#1b1f28';
        g.textAlign='center'; g.textBaseline='middle';
        g.font=BAR(t.length>3?15:26);
        g.fillText(t,x+w/2,y+h/2+1);
      }
      /* Rand der Wanne */
      g.strokeStyle='#0f1218'; g.lineWidth=10; g.strokeRect(5,5,W-10,H-10);
      for(let i=0;i<500;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.03})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
    });
    kbT.anisotropy=8;
    const wanne=std(0x141820,{roughness:0.55,metalness:0.1});
    const kb=rbox(0.44,0.026,0.175,0.006,wanne,-0.8,0.954,-0.32,ckG); kb.rotation.x=-0.06;
    const face=plane(0.4,0.15,new THREE.MeshStandardMaterial({map:kbT,roughness:0.42}),-0.8,0.9685,-0.32,0,ckG);
    face.rotation.set(-Math.PI/2-0.06,0,0);
    /* Kabel zur Kasse */
    const kab=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.13,6),std(0x20242c,{roughness:0.9}));
    kab.position.set(-0.8,0.952,-0.4); kab.rotation.x=1.35; ckG.add(kab);
  }
  posHit=bbox(0.66,0.72,0.6,hitM,-0.8,1.2,-0.1,ckG,false); posHit.userData={kind:'pos'};
  cardHit=bbox(0.34,0.3,0.34,hitM,0.58,1.06,0.26,ckG,false); cardHit.userData={kind:'card'};
  ckMov=addMovable({kind:'ck',name:'Kasse',g:ckG,fw:3.4,fd:0.95,onPlace:()=>{ belt.forEach(b=>syncBeltItem(b)); syncBag(); }});
  drawPOS();
}
/* =========================================================
   SB-Kassen: zwei Selbstbedienungsterminals in der neuen
   Verkaufsflaeche. Kunden mit wenig Ware zahlen dort selbst.
   ========================================================= */
let sbG=null; const sbLanes=[], sbCols=[];
function sbScreenTex(){
  return tex(512,384,(g,W,H)=>{
    g.fillStyle='#0f1726'; g.fillRect(0,0,W,H);
    g.fillStyle='#16233a'; g.fillRect(0,0,W,68);
    g.fillStyle='#ffd23f'; g.font=BUN(34); g.textAlign='left'; g.textBaseline='middle';
    g.fillText('SB-KASSE', 20, 34);
    g.fillStyle='#6cf2a8'; g.font=BAR(24); g.textAlign='right';
    g.fillText('BEREIT', W-20, 34);
    g.textAlign='left';
    const zeilen=[['Batteriebox 100 Schuss','24,90'],['Raketensortiment','12,50'],['Wunderkerzen','2,40']];
    zeilen.forEach((z,i)=>{
      g.fillStyle=i%2?'#132034':'#101b2d'; g.fillRect(16,92+i*46,W-32,42);
      g.fillStyle='#cfe0f5'; g.font=BAR(22); g.fillText(z[0],28,113+i*46);
      g.textAlign='right'; g.fillStyle='#ffffff'; g.fillText(z[1]+' €',W-28,113+i*46); g.textAlign='left';
    });
    g.fillStyle='#1d2c47'; g.fillRect(16,246,W-32,52);
    g.fillStyle='#ffffff'; g.font=BUN(30); g.fillText('Summe',30,272);
    g.textAlign='right'; g.fillText('39,80 €',W-30,272); g.textAlign='left';
    g.fillStyle='#2f9e57'; g.fillRect(16,310,(W-40)/2,56);
    g.fillStyle='#3a4560'; g.fillRect(24+(W-40)/2,310,(W-40)/2,56);
    g.fillStyle='#ffffff'; g.font=BUN(26); g.textAlign='center';
    g.fillText('BEZAHLEN',16+(W-40)/4,340);
    g.fillText('HILFE',24+(W-40)*0.75,340);
  });
}
function sbTerminal(parent,x,z){
  const korpus=std(0x2b2e34,{roughness:0.48,metalness:0.12}),
        blende=std(0xe4e8ef,{roughness:0.42,metalness:0.06}),
        stahl=std(0xb4bac4,{metalness:0.7,roughness:0.3}),
        dunkel=std(0x14171f,{roughness:0.5}),
        akzent=std(0xc9ced6,{metalness:0.85,roughness:0.22});
  const g=new THREE.Group(); g.position.set(x,0,z); parent.add(g);
  /* Sockel und Korpus */
  bbox(0.72,0.1,0.62,dunkel,0,0.05,0,g,false);
  const c=rbox(0.78,0.86,0.68,0.02,korpus,0,0.53,0,g); occluders.push(c);
  bbox(0.8,0.04,0.7,stahl,0,0.98,0,g,false);
  bbox(0.8,0.035,0.03,akzent,0,0.74,0.345,g,false);
  /* Abstellflaechen links und rechts */
  for(const s of [-1,1]){
    rbox(0.42,0.05,0.5,0.014,blende,s*0.6,0.97,0,g);
    bbox(0.05,0.9,0.05,stahl,s*0.6,0.47,-0.2,g,false);
    bbox(0.05,0.9,0.05,stahl,s*0.6,0.47,0.2,g,false);
  }
  /* Scannerfenster in der Arbeitsplatte */
  bbox(0.3,0.012,0.24,dunkel,0,1.005,0.12,g,false);
  const scan=plane(0.26,0.2,new THREE.MeshBasicMaterial({toneMapped:false,
    color:LIN(0x8f2a22)}),0,1.014,0.12,0,g);
  scan.rotation.x=-Math.PI/2; scan.renderOrder=2;
  /* Saeule mit Touchscreen */
  const saeule=rbox(0.24,0.62,0.18,0.02,korpus,0,1.3,-0.16,g);
  const rahmen=rbox(0.56,0.42,0.045,0.012,dunkel,0,1.62,-0.1,g); rahmen.rotation.x=0.22;
  const scr=plane(0.5,0.36,new THREE.MeshBasicMaterial({map:sbScreenTex(),toneMapped:false}),0,1.627,-0.075,0,g);
  scr.rotation.x=0.22;
  /* Kartenleser auf kurzem Arm */
  bbox(0.05,0.05,0.14,stahl,0.2,1.16,0.02,g,false);
  const leser=rbox(0.13,0.2,0.05,0.012,dunkel,0.27,1.22,0.02,g); leser.rotation.x=-0.35;
  plane(0.09,0.06,new THREE.MeshBasicMaterial({toneMapped:false,color:LIN(0x2f9e57)}),0.27,1.28,0.0,0,g).rotation.x=-0.35;
  /* Statusleuchte auf einer Stange */
  const st=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.86,10),stahl);
  st.position.set(-0.3,1.42,-0.2); g.add(st);
  const lampM=new THREE.MeshStandardMaterial({color:LIN(0x1d5f36),emissive:LIN(0x37d977),emissiveIntensity:1.6});
  const lamp=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.11,12),lampM);
  lamp.position.set(-0.3,1.9,-0.2); g.add(lamp);
  /* Tuete am Buegel */
  bbox(0.02,0.3,0.24,stahl,0.6,1.14,0,g,false);
  /* unsichtbare Trefferflaeche: der Spieler kann selbst helfen */
  const hit=bbox(0.9,1.9,0.8,hitM,0,0.95,0.05,g,false);
  const l={g,lamp,lampM,busy:null,t:0,hit,helfer:null,hilfe:false};
  hit.userData={kind:'sbterm',ref:l};
  return l;
}
function buildSBKasse(){
  if(sbG) return sbG;
  sbG=new THREE.Group(); sbG.position.set(0,0,0); scene.add(sbG);
  /* Rueckwand mit Beschilderung hinter den Terminals */
  const w=std(0x1b2340,{roughness:0.7});
  bbox(3.6,0.34,0.12,w,10.6,2.35,3.75,sbG,false);
  const schild=tex(1024,140,(g,W,H)=>{
    g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
    g.fillStyle='#ffd23f'; g.font=BUN(64); g.textAlign='center'; g.textBaseline='middle';
    g.fillText('SB-KASSEN',W/2,H/2+4);
    g.strokeStyle='#2f3a5e'; g.lineWidth=6; g.strokeRect(3,3,W-6,H-6);
  });
  plane(3.4,0.3,new THREE.MeshBasicMaterial({map:schild,toneMapped:false}),10.6,2.35,3.82,0,sbG);
  for(const sx of [9.0,12.2]) bbox(0.07,2.2,0.07,std(0x8d939d,{metalness:0.6,roughness:0.4}),sx,1.15,3.75,sbG,false);
  for(const x of [9.7,11.5]) sbLanes.push(sbTerminal(sbG,x,4.4));
  sbCols.push(col(9.0,10.4,4.05,4.75),col(10.8,12.2,4.05,4.75));
  return sbG;
}
function sbLampe(l,frei){
  l.lampM.color.copy(LIN(frei?0x1d5f36:0x5f3a1d));
  l.lampM.emissive.copy(LIN(frei?0x37d977:0xf2a23a));
  l.lampM.emissiveIntensity=1.6; l.hilfe=false;
}
/* Rot blinkend: hier kommt ein Kunde nicht weiter */
function sbLampeHilfe(l,an){
  if(!an){ sbLampe(l,!l.busy); return; }
  l.hilfe=true; l.lampM.color.copy(LIN(0x5f1d1d)); l.lampM.emissive.copy(LIN(0xff3a2e));
}
function sbLampeBlink(l,t){ l.lampM.emissiveIntensity=(t*2.4)%1<0.55?2.2:0.25; }
/* Nach der Hilfe (Betreuer, Spieler oder der Kunde selbst) scannt er weiter */
const SB_SELBST=30;
function sbGeholfen(l,wer){
  if(!l) return; const c=l.busy; l.helfer=null;
  sbLampe(l,false);
  if(!c||c.state!=='sbHilfe') return;
  c.state='sbPay';
  if(wer){ c.say(pick(['Danke!','Ah, so geht das.','Super, danke!'])); DS.sbHilfe=(DS.sbHilfe||0)+1; rep(0.1); sfx.beep(); }
  if(wer==='spieler'){ addXP(4,'SB-Hilfe'); }
}
let sbHinweisZeit=-1e9;
function sbHinweisOk(){ const t=performance.now(); if(t-sbHinweisZeit<45000) return false; sbHinweisZeit=t; return true; }
/* Der Kunde nimmt die freie SB-Kasse, die ihm am naechsten ist -
   nicht einfach die erste in der Liste am anderen Ende des Ladens */
function sbFreiNah(pos){
  let best=-1, bd=1e9;
  for(let i=0;i<sbLanes.length;i++){ if(sbLanes[i].busy||!sbNutzbar(i)) continue;
    const q=sbPos(i), d=Math.hypot(q.x-pos.x,q.z-pos.z); if(d<bd){ bd=d; best=i; } }
  return best;
}
/* Beim Laden eines anderen Spielstands muessen die Terminals wieder weg */
function setSB(an){
  if(an){ buildSBKasse(); sbG.visible=true;
    sbCols.forEach(c=>{ if(colliders.indexOf(c)<0) colliders.push(c); }); }
  else if(sbG){ sbG.visible=false; sbCols.forEach(c=>dropCol(c)); }
  sbLanes.forEach(l=>{ if(!l.up){ l.busy=null; sbLampe(l,true); } });
}
/* Wohin das SB-Kassenpaket getragen wird: vor die Kassenzeile */
function sbZiel(){ return {x:10.6,z:2.8}; }
/* Anlaufpunkt vor einem SB-Terminal. Die Zeile am zweiten Eingang
   haengt in einer verschobenen und drehbaren Gruppe - die lokale
   Position des Terminals ist dort nicht die Weltposition. */
function sbPos(i){
  const g=sbLanes[i].g, p=g.parent;
  if(p&&p!==scene) return localToWorld(p,g.position.x,g.position.z+0.95);
  return V(g.position.x,0,g.position.z+0.95);
}
/* Seit dem zweiten Eingang gibt es zwei Kassenzeilen. Eine Spur
   zaehlt nur, wenn ihr Ausbau auch gekauft ist. */
function sbFrei(){ for(let i=0;i<sbLanes.length;i++) if(!sbLanes[i].busy&&sbNutzbar(i)) return i; return -1; }
function sbOffen(){ let n=0; for(let i=0;i<sbLanes.length;i++) if(sbNutzbar(i)) n++; return n; }
let deskG=null;
function buildDesk(){
  /* Die Bueroecke mit dem Laptop haengt an der Westwand, gleich
     neben der Lagertuer. Vorher stand sie an der Ostwand - die
     liegt jetzt hinter der Trennwand. */
  deskG=new THREE.Group(); deskG.position.set(-7.35,0,0.9); deskG.rotation.y=Math.PI; scene.add(deskG);
  /* Hochwertiger Schreibtisch: Nussbaum-Furnier auf Stahlwangen */
  const furnierT=(()=>{ const t=tex(768,768,(g,W,H)=>{
        const base=g.createLinearGradient(0,0,W,H);
        base.addColorStop(0,'#5d4630'); base.addColorStop(0.5,'#6b5138'); base.addColorStop(1,'#573f2b');
        g.fillStyle=base; g.fillRect(0,0,W,H);
        /* lange, ruhige Maserung statt Kratzern */
        for(let i=0;i<220;i++){
          const y=Math.random()*H, amp=rand(4,16), tone=rand(0.05,0.16);
          g.strokeStyle=`rgba(${Math.random()<0.5?42:120},${Math.random()<0.5?28:92},${Math.random()<0.5?16:62},${tone})`;
          g.lineWidth=rand(0.7,2.6); g.beginPath(); g.moveTo(-10,y);
          for(let x=0;x<=W+10;x+=48) g.lineTo(x,y+Math.sin(x*0.011+i)*amp*0.35+rand(-1.2,1.2));
          g.stroke();
        }
        /* Spiegelfurnier: weiche helle Baender */
        for(let i=0;i<7;i++){ const y=rand(0,H);
          const gr=g.createLinearGradient(0,y-30,0,y+30);
          gr.addColorStop(0,'rgba(196,160,112,0)'); gr.addColorStop(0.5,'rgba(196,160,112,.12)'); gr.addColorStop(1,'rgba(196,160,112,0)');
          g.fillStyle=gr; g.fillRect(0,y-30,W,60); }
        /* seidenmatter Lack */
        const gl=g.createLinearGradient(0,0,W*0.6,H);
        gl.addColorStop(0,'rgba(255,245,225,.10)'); gl.addColorStop(0.6,'rgba(255,245,225,0)');
        g.fillStyle=gl; g.fillRect(0,0,W,H);
      }); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; })();
  const woodT=new THREE.MeshStandardMaterial({map:furnierT,roughness:0.34,metalness:0.04}),
        kante=std(0x3c2c1c,{roughness:0.4}),
        metal=std(0x9aa1ac,{metalness:0.75,roughness:0.26}),
        metalD=std(0x2f3540,{metalness:0.55,roughness:0.38}),
        dark=std(0x1c1f29,{roughness:0.5});
  /* Platte mit umlaufender Massivholzkante */
  bbox(1.12,0.038,1.56,woodT,0,0.762,0,deskG);
  for(const [w,d,x,z] of [[1.14,0.022,0,0.782],[1.14,0.022,0,-0.782]])
    bbox(w,0.052,0.024,kante,x,0.757,z,deskG,false);
  for(const sx of [-0.572,0.572]) bbox(0.024,0.052,1.61,kante,sx,0.757,0,deskG,false);
  /* Stahlwangen statt duenner Beine */
  for(const sz of [-0.62,0.62]){
    bbox(0.9,0.028,0.07,metal,0,0.735,sz,deskG,false);
    bbox(0.06,0.7,0.055,metal,-0.42,0.385,sz,deskG);
    bbox(0.06,0.7,0.055,metal, 0.42,0.385,sz,deskG);
    bbox(0.92,0.035,0.09,metal,0,0.028,sz,deskG,false);
    for(const sx of [-0.42,0.42]){
      const gl2=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.022,0.014,10),metalD);
      gl2.position.set(sx,0.007,sz); deskG.add(gl2);
    }
  }
  /* Traverse und Kabelwanne */
  bbox(0.05,0.05,1.2,metal,-0.42,0.18,0,deskG,false);
  bbox(0.05,0.05,1.2,metal, 0.42,0.18,0,deskG,false);
  bbox(0.62,0.02,0.16,metalD,0,0.66,-0.52,deskG,false);
  for(const sx of [-0.2,0.2]) bbox(0.03,0.09,0.03,metalD,sx,0.71,-0.52,deskG,false);
  /* Rollcontainer unter der Platte */
  { const c2=new THREE.Group(); c2.position.set(0.28,0,0.28); deskG.add(c2);
    rbox(0.42,0.58,0.52,0.014,std(0x2b303c,{metalness:0.2,roughness:0.5}),0,0.32,0,c2);
    for(let i=0;i<3;i++){
      bbox(0.4,0.16,0.012,std(0x353b47,{roughness:0.45}),0,0.16+i*0.18,0.262,c2,false);
      bbox(0.16,0.014,0.016,metal,0,0.16+i*0.18,0.272,c2,false);
    }
    for(const sx of [-0.15,0.15]) for(const sz of [-0.18,0.18]){
      const w2=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.018,8),dark);
      w2.rotation.z=Math.PI/2; w2.position.set(sx,0.024,sz); c2.add(w2);
    }
  }
  /* Laptop */
  const lap=new THREE.Group(); lap.position.set(-0.05,0.78,-0.16); lap.rotation.y=-Math.PI/2; deskG.add(lap);
  rbox(0.44,0.018,0.32,0.006,std(0x2b303c,{metalness:0.45,roughness:0.35}),0,0.009,0.08,lap);
  bbox(0.36,0.004,0.2,std(0x1c1f29),0,0.019,0.11,lap,false);
  for(let r=0;r<4;r++) for(let c2=0;c2<12;c2++)
    bbox(0.024,0.004,0.018,std(0x3f4654),-0.15+c2*0.0275,0.022,0.05+r*0.023,lap,false);
  bbox(0.12,0.004,0.06,std(0x353b47),0,0.021,0.17,lap,false);
  const lid=rbox(0.45,0.3,0.014,0.006,std(0x2b303c,{metalness:0.45,roughness:0.35}),0,0.16,-0.08,lap);
  lid.rotation.x=-0.22;
  /* Bildschirmschoner statt Menueattrappe - das echte Menue oeffnet sich beim Anklicken */
  const sch=neuerSchoner(512,320);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(0.41,0.26),new THREE.MeshBasicMaterial({toneMapped:false,map:sch.t}));
  sch.mesh=scr;
  scr.position.set(0,0.16,-0.072); scr.rotation.x=-0.22; lap.add(scr);
  const led=new THREE.MeshStandardMaterial({color:LIN(0x0a2a12),emissive:LIN(0x3dff7a),emissiveIntensity:1.4});
  bbox(0.012,0.006,0.004,led,0.18,0.02,0.19,lap,false);
  lapHit=bbox(0.7,0.5,0.7,hitM,-0.05,0.95,-0.1,deskG,false); lapHit.userData={kind:'laptop'};
  /* Bürostuhl */
  { const ch=new THREE.Group(); ch.position.set(-0.85,0,0.05); ch.rotation.y=1.5; deskG.add(ch);
    rbox(0.46,0.09,0.44,0.03,std(0x2c3140,{roughness:0.75}),0,0.46,0,ch);
    const bk=rbox(0.44,0.5,0.08,0.03,std(0x2c3140,{roughness:0.75}),0,0.76,-0.21,ch); bk.rotation.x=0.14;
    bbox(0.06,0.14,0.06,metal,0,0.56,-0.2,ch,false);
    const col2=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.045,0.38,10),metal); col2.position.y=0.23; ch.add(col2);
    for(let i=0;i<5;i++){ const a2=i/5*Math.PI*2;
      bbox(0.05,0.03,0.26,metal,Math.cos(a2)*0.11,0.06,Math.sin(a2)*0.11,ch,false).rotation.y=-a2;
      const w=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.022,8),dark);
      w.rotation.z=Math.PI/2; w.position.set(Math.cos(a2)*0.24,0.035,Math.sin(a2)*0.24); ch.add(w); }
    for(const sx of [-1,1]) bbox(0.05,0.18,0.28,std(0x1f2430),sx*0.25,0.6,0,ch,false); }
  addMovable({kind:'desk',name:'Büro-Tisch',g:deskG,fw:1.2,fd:1.6});
}

/* =========================================================
   Verkaufsregale
   ========================================================= */
const shelves=[];
const shUp=std(0x4a5266,{metalness:0.5,roughness:0.45}), shBoard=std(0xd9dde4,{roughness:0.6}), shRail=std(0xc8322a,{roughness:0.5});
const shSide=std(0xe4e7ec,{roughness:0.7}); const shelfStrips=[];
let _gestell=null;
function gestellMat(){ if(!_gestell) _gestell=new THREE.MeshStandardMaterial({vertexColors:true,metalness:0,roughness:0.72}); return _gestell; }
const coldFrame=std(0xc8ccd4,{metalness:0.6,roughness:0.3});
const coldGlass=new THREE.MeshStandardMaterial({color:LIN(0xd8ecff),transparent:true,opacity:0.2,roughness:0.05,metalness:0.2,depthWrite:false});
/* Rueckwand: pulverbeschichtetes Lochblech. Die Textur ist neutral hell,
   die Farbe kommt ueber material.color aus der Regalpalette - so passt
   sie zu jeder Wand. Loecher mit Schattenkante statt aufgemalter Punkte. */
const pegMat=new THREE.MeshStandardMaterial({roughness:0.62,metalness:0.12,map:(()=>{ const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#f4f5f6'; g.fillRect(0,0,W,H);
  for(let i=0;i<1400;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'120,124,130'},${0.03+Math.random()*0.04})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
  for(let x=16;x<W;x+=32) for(let y=16;y<H;y+=32){ g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(x-3,y-4,7,9); g.fillStyle='#3a3d43'; g.fillRect(x-3,y-5,6,9); g.fillStyle='#6a6e76'; g.fillRect(x-3,y-5,6,2); } });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(5,5); return t; })()});
function kindOf(sh){ return SHELFKIND[sh&&sh.kind]||SHELFKIND.standard; }
function shelfCount(k){ return shelves.filter(s=>s.kind===k).length; }
/* Fassungsvermögen richtet sich nach Regalbreite und -tiefe */
/* Freie Hoehe ueber einem Fach: bis zum naechsten Boden; das oberste
   Fach hat mehr Luft bis zur Deckplatte - dort stehen die grossen Verbundbatterien
   (Tom, 25.09.: "die wirklich krassen viel, viel groesser"). Vorher
   stand hohe Ware einfach im Boden darueber. */
function fachHoehe(K,li){ return li<K.lv.length-1?K.lv[li+1]-K.lv[li]-0.04:(K.oben!==undefined?K.oben:(K.cold?0.44:0.58)); }
/* Fach-Module (02.10., Tom, Foto Wunderkerzen: "da ist nur eine Reihe
   vorne - und im Karton sind 36 Stueck, ins Fach passen 39"):
   - Die Ware fuellt das Fach jetzt auch in die Tiefe, Reihe hinter Reihe
     wie im Supermarkt (vorher begrenzte das Gitter im Produkt die Tiefe
     auf eine bis drei Reihen).
   - Jedes Moebel besteht aus gleichen Modulen (SHELFKIND, 02-data):
     gerechnet wird, was in EIN Modul passt, mal die Zahl der Module -
     das Verkaufsregal fasst genau doppelt so viel wie das kleine.
   - Ein Fach fasst immer ganze Kartons: wo die Menge nicht aufgeht,
     bleibt eine Reihe oder Lage frei. Die Kartongroesse jedes Produkts
     ist so gewaehlt, dass ein Modul ganze Kartons fasst (kartonWahl).
   Zu breit, zu tief oder zu hoch fuer das Fach heisst "passt nicht". */
const MODUL={B:0.9,T:0.44,H:0.52};
const _lay=new Map();
/* groesste Menge a*b*c <= Grenzen, die ein Vielfaches von box ist -
   bei Gleichstand die breiteste, dann die tiefste Anordnung */
function ganzeKartons(c,r,s,box){
  if(box<=1) return [c,r,s];
  /* zuerst die volle Breite halten (Tom, 25.09.: das Fach von links bis
     rechts fuellen) - dann eher eine Reihe hinten oder eine Lage weniger */
  for(let a=c;a>=1;a--){ let best=null, bn=0;
    for(let b=r;b>=1;b--) for(let d=s;d>=1;d--){ const n=a*b*d; if(n%box||n<bn) continue; if(n>bn||b>best[1]){ bn=n; best=[a,b,d]; } }
    if(best&&(bn>=0.6*c*r*s||a===1)) return best; }
  return [0,0,0];
}
/* Modulraster eines Moebels: Grundflaeche B x T je Modul, MX x MZ Module */
function modRaster(K){ return K.frei?{B:MODUL.B,T:MODUL.T,MX:K.modX||1,MZ:K.modZ||1}:{B:K.modB||MODUL.B,T:K.tiefe||MODUL.T,MX:K.mod||Math.max(1,Math.round(K.w)),MZ:1}; }
function layoutRoh(t,K,lvH){
  const p=P[t], G=p.grid, g=0.012, dw=p.dims[0], dh=p.dims[1], dd=p.dims[2], R=modRaster(K);
  const pro=(L,d)=>Math.floor((L+g)/(d+g)), auf=(d,m)=>Math.ceil(d/m-1e-6);
  /* Tische und Gitterboxen: stapeln, so hoch es geht (hoechstens 4);
     Regale: so hoch, wie das Produkt stapelbar ist (grid[2]) */
  const st=dh>lvH+0.001?0:K.frei?Math.min(4,Math.floor(lvH/dh)):Math.max(1,Math.min(G[2],Math.floor(lvH/dh)));
  if(dw<=R.B&&dd<=R.T) return {cm:pro(R.B,dw),rm:pro(R.T,dd),st,mx:R.MX,mz:R.MZ};
  return {cols:dw<=R.B?R.MX*pro(R.B,dw):Math.floor(R.MX/auf(dw,R.B)),rows:dd<=R.T?R.MZ*pro(R.T,dd):Math.floor(R.MZ/auf(dd,R.T)),st};
}
function layout(t,sh,lv){
  const p=P[t], K=kindOf(sh), g=0.012;
  /* ohne Fach: das hoechste, das dieses Regal hat */
  const lvH=lv?fachHoehe(K,lv.li):Math.max(...K.lv.map((_,i)=>fachHoehe(K,i)));
  const box=Math.max(1,p.box|0), key=t+'|'+K.id+'|'+lvH.toFixed(3)+'|'+box+'|'+p.dims.join(',');
  let L=_lay.get(key);
  if(!L){ const R=layoutRoh(t,K,lvH); let cols, rows, st, modCm=0, modN=0;
    if(R.cm!==undefined){
      /* je Modul ganze Kartons; reicht ein Modul nicht fuer einen Karton,
         dann ueber das ganze Fach */
      let [a,b,c]=ganzeKartons(R.cm,R.rm,R.st,box);
      if(a*b*c){ cols=a*R.mx; rows=b*R.mz; st=c; if(!K.frei&&R.mx>1){ modCm=a; modN=R.mx; } }
      /* Tisch und Gitterbox: passt kein Karton in ein Modul, dann in eine
         Modulspalte (1 x 2) - so bleibt der grosse Tisch genau doppelt so
         voll wie der kleine */
      else if(K.frei&&R.mz>=2&&(([a,b,c]=ganzeKartons(R.cm,R.rm*2,R.st,box)),a*b*c)){ cols=a*R.mx; rows=b*Math.floor(R.mz/2); st=c; }
      /* ... sonst in die ganze Breite, zwei Module tief */
      else if(K.frei&&R.mz>=2&&(([a,b,c]=ganzeKartons(R.cm*R.mx,R.rm*2,R.st,box)),a*b*c)){ cols=a; rows=b*Math.floor(R.mz/2); st=c; }
      else [cols,rows,st]=ganzeKartons(R.cm*R.mx,R.rm*R.mz,R.st,box);
    } else [cols,rows,st]=ganzeKartons(R.cols,R.rows,R.st,box);
    if(!(R.st>0)) cols=rows=st=0;
    L={cols:Math.max(1,cols),rows:Math.max(1,rows),st,cap:cols*rows*st,w:p.dims[0],h:p.dims[1],d:p.dims[2],g,K,modCm,modN};
    _lay.set(key,L); }
  return L;
}
/* Kartongroesse (02.10., Tom: "dann musst du die Stueckzahl im Karton
   veraendern"): je Produkt eine handelsuebliche Stueckzahl nahe der
   bisherigen, die ein Fach-Modul seines Heimatmoebels (Regal, sonst
   Grossverbund-Regal, sonst Tisch) mit ganzen Kartons fuellt - moeglichst
   ganz breit und tief. Der Preis je Stueck bleibt, der Karton kostet
   entsprechend mehr oder weniger. */
const KARTON_ZAHLEN=[1,2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,32,36,40,45,48,50,60,64,72,80,90,96,100,120,144];
function kartonWahl(t){
  const p=P[t]; if(!p||!p.dims||!p.grid) return;
  if(p.box0===undefined) p.box0=p.box;
  const b0=Math.max(1,p.box0|0);
  const heim=p.kuehlpflicht?['kuehl','tisch']:['standard','gross','tisch'];
  for(const kid of heim){ const K=SHELFKIND[kid], H=Math.max(...K.lv.map((_,i)=>fachHoehe(K,i))), R=layoutRoh(t,K,H);
    const [c,r,s]=R.cm!==undefined?[R.cm,R.rm,R.st]:[R.cols,R.rows,R.st];
    if(!(c*r*s)) continue;
    const V0=c*r*s; let best=null;
    for(let a=c;a>=Math.max(1,Math.ceil(c*0.75));a--) for(let b=r;b>=Math.max(1,Math.ceil(r*0.6));b--) for(let d=s;d>=Math.max(1,Math.ceil(s*0.5));d--){
      const V=a*b*d;
      /* nahe an der alten Stueckzahl, das Modul voll, die Breite voll
         (eine Spalte weniger wiegt schwer), runde Zahlen bevorzugt */
      for(let k=1;k<=Math.min(V,200);k++){ if(V%k) continue;
        const w=Math.abs(Math.log(k/b0))+2*(1-V/V0)+6*(1-a/c)+(KARTON_ZAHLEN.includes(k)?0:0.15);
        if(!best||w<best.w) best={w,k}; } }
    if(best){ p.box=best.k; return; }
  }
}
/* Massraster (02.10., Tom, Verpackungs-Vorfuehrung: "dass das Regal
   befuellt ist und nicht irgendwelche Luecken ... notfalls die
   Produktgroesse veraendern"): eine Packung von 53 cm Breite stand
   einzeln im 90-cm-Fach, daneben 37 cm Luft. Jede Packung bekommt jetzt
   Breite und Tiefe so, dass eine ganze Zahl davon das Fach-Modul (90 x 44,
   Grossverbund 98 x 62) fuellt - die naechstliegende solche Groesse.
   Runde Ware (Dosen, Flaschen, Kerzen, Kugelbomben) waechst oder
   schrumpft gleichmaessig, Kugelbomben nur wenig (sie muessen in ihr
   Moerserrohr). Flache Packungen werden so hoch gestapelt, wie das Fach
   es hergibt (eine Handbreit Luft nach oben). Was schon voll ist, bleibt. */
const RASTER_STAPEL=new Set(['boxA','rocketset','tubepack','fountainset','assort','battery','fan','sparkler']);
const RASTER_RUND=new Set(['cylinder','bottle','candle','shell','atombombe','fass','lighter']);
function rasterFuell(x,L){ const g=0.012, n=Math.floor((L+g)/(x+g)); return n*(x+g)/L; }
/* n Packungen je Modul; zwei Module nebeneinander (Tisch, Gitterbox) brauchen
   dazwischen noch eine Fuge, darum (L+g/2)/n */
function rasterKandidaten(x,L,lo,hi){ const g=0.012, out=[];
  for(let n=1;n<=60;n++){ const v=Math.floor(((L+g/2)/n-g-0.001)*1000)/1000, q=v/x; if(q>=lo&&q<=hi) out.push(q); }
  return out; }
function massRaster(t){
  const p=P[t]; if(!p||!p.dims||!p.grid||p.noOrder||p.rezept||p.dims0) return;
  p.dims0=p.dims.slice();
  /* die Raketenzahl im Set haengt sonst an der Tiefe der Packung */
  if(p.shape==='rocketset'&&p.stueck===undefined) p.stueck=Math.max(3,Math.round(p.dims[2]/0.026));
  const [w,h,d]=p.dims, Hs=fachHoehe(SHELFKIND.standard,0);
  const M=h<=Hs?{B:MODUL.B,T:MODUL.T,H:Hs}:{B:SHELFKIND.gross.modB,T:SHELFKIND.gross.tiefe,H:fachHoehe(SHELFKIND.gross,0)};
  if(RASTER_RUND.has(p.shape)){
    /* gleichmaessig: die Groesse, bei der Breite mal Tiefe am vollsten ist */
    const lo=p.shape==='shell'?0.92:0.65, hi=p.shape==='shell'?1.08:1.3;
    let best={q:1,f:rasterFuell(w,M.B)*rasterFuell(d,M.T)};
    for(const q of rasterKandidaten(w,M.B,lo,hi).concat(rasterKandidaten(d,M.T,lo,hi))){
      if(w*q>M.B||d*q>M.T||(q>1&&h*q>M.H-0.01)) continue;
      const f=rasterFuell(w*q,M.B)*rasterFuell(d*q,M.T)-0.25*Math.abs(Math.log(q));
      if(f>best.f+0.02) best={q,f}; }
    if(best.q!==1) p.dims=[w*best.q,h*best.q,d*best.q].map(v=>Math.round(v*1000)/1000);
  } else {
    /* keine Packung waechst ueber eine Paketgrenze des Versands (86 cm
       im grossen Paket) - sonst brauchte das Raketen-Set ploetzlich das riesige */
    const VSG=0.86;
    const achse=(x,L)=>{ if(x<=L&&rasterFuell(x,L)>=0.92) return x;
      const ok=q=>x>VSG||x*q<=VSG;
      /* naechstliegende Groesse; erst wenn keine im Rahmen liegt, auch weiter weg
         (60 cm im 90-cm-Fach: 44 oder 89 cm, beides weit) */
      let b=null; for(const q of rasterKandidaten(x,L,0.75,1.4)) if(ok(q)&&(!b||Math.abs(Math.log(q))<Math.abs(Math.log(b)))) b=q;
      if(!b) for(const q of rasterKandidaten(x,L,0.6,1.6)) if(ok(q)&&(!b||Math.abs(Math.log(q))<Math.abs(Math.log(b)))) b=q;
      return b?Math.round(x*b*1000)/1000:x; };
    p.dims=[achse(w,M.B),h,achse(d,M.T)];
  }
  /* Kugelbomben und kleine Dosen stehen in Papphuelsen - die stapelt man auch */
  if(RASTER_STAPEL.has(p.shape)||p.shape==='shell'||(p.shape==='cylinder'&&p.dims[1]<=0.22)){ const hh=p.dims[1]; p.grid=[p.grid[0],p.grid[1],Math.max(p.grid[2]|0,Math.min(6,Math.floor((M.H-0.06)/hh)))]; }
}
Object.keys(P).forEach(massRaster);
/* alle Produkte bekommen ihre Kartongroesse (P ist hier vollstaendig) */
Object.keys(P).forEach(kartonWahl);
/* Breite eines Regalmoduls zwischen den Stehern (Mittelsteher 3 cm) */
const STEHER=0.03;
function modBreite(K){ const n=K.mod||1; return (K.w-0.1-(n-1)*STEHER)/n; }
function slotLocal(t,idx,sh,lv){
  /* 02.10. (Tom): eingeraeumt wird von hinten nach vorn - die erste Reihe
     steht ganz hinten, die vorderste kommt zuletzt. Dann sieht man, wie
     viel noch passt, und der Kunde nimmt vorn (removeFromLevel nimmt das
     zuletzt eingeraeumte Stueck, also aus der vordersten Reihe). */
  const L=layout(t,sh,lv), c=idx%L.cols, rest=Math.floor(idx/L.cols), layer=rest%L.st, row=L.rows-1-Math.floor(rest/L.st);
  const z=L.K.d/2-0.03-L.d/2-row*(L.d+L.g);
  /* Regal aus mehreren Modulen: je Modul mittig zwischen den Stehern */
  if(L.modCm){ const m=Math.floor(c/L.modCm), cc=c%L.modCm, mb=modBreite(L.K), iw=L.K.w-0.1, tw=L.modCm*(L.w+L.g)-L.g;
    return {x:-iw/2+m*(mb+STEHER)+mb/2-tw/2+L.w/2+cc*(L.w+L.g), y:layer*L.h, z}; }
  const tw=L.cols*(L.w+L.g)-L.g;
  return {x:-tw/2+L.w/2+c*(L.w+L.g), y:layer*L.h, z};
}
function slotFrei(sl){ return !sl.zone||zoneOffen(sl.zone); }
/* Mittelgondeln und Eckregale brauchen den passenden Stellplatz */
/* 02.10.: breite Moebel (Gitterbox XL, grosser Tisch) brauchen auch
   Platz neben dem Stellplatz - kein Platz, an dem sie in ein Nachbarmoebel
   ragen wuerden. Grundflaeche als achsparalleles Rechteck (Drehung in
   Vierteln). */
function moebelRect(K,x,z,ry){ const w=(K.fw||K.w)/2, d=(K.fd||K.d)/2, q=Math.abs(Math.round(Math.sin(ry||0)));
  return q?{x0:x-d,x1:x+d,z0:z-w,z1:z+w}:{x0:x-w,x1:x+w,z0:z-d,z1:z+d}; }
function slotPasst(K,sl){
  const art=K.art||'wand';
  if((sl.art||'wand')!==art) return false;
  if(shelves.some(s=>Math.abs(s.g.position.x-sl.x)<0.05&&Math.abs(s.g.position.z-sl.z)<0.05)) return false;
  const a=moebelRect(K,sl.x,sl.z,sl.ry);
  return !shelves.some(s=>{ const b=moebelRect(kindOf(s),s.g.position.x,s.g.position.z,s.g.rotation.y);
    return a.x0<b.x1-0.02&&a.x1>b.x0+0.02&&a.z0<b.z1-0.02&&a.z1>b.z0+0.02; });
}
function slotsOffen(){ return SLOTS.filter(slotFrei); }
/* Gibt es noch einen freien Stellplatz fuer diesen Regaltyp? */
function freiFuer(kindId){ const K=SHELFKIND[kindId]; return K?slotsOffen().some(sl=>slotPasst(K,sl)):false; }
/* Fertig ist ein Regaltyp erst, wenn es Plaetze dafuer gibt und alle
   belegt sind. Solange der passende Raum noch gar nicht gekauft ist,
   ist er gesperrt - nicht erledigt. */
function alleBelegt(kindId){
  const K=SHELFKIND[kindId]; if(!K) return true;
  const art=K.art||'wand';
  const offen=slotsOffen().filter(sl=>(sl.art||'wand')===art);
  return offen.length>0&&!offen.some(sl=>slotPasst(K,sl));
}
/* Ein Regal kann mehrere Warenseiten haben: das normale Regal eine,
   die Mittelgondel zwei (Ware rundum) und das Eckregal zwei ueber Eck.
   Jede Seite ist eine eigene Gruppe mit eigenen Faechern. */
const FACE1=[{ry:0,ox:0,oz:0}];
function seitenVon(K){ return K.seiten||FACE1; }
function faceOf(sh,lv){ return seitenVon(kindOf(sh))[lv.face||0]; }
/* Punkt in der Seitenebene -> Weltkoordinate */
function faceWorld(sh,f,x,z){
  const si=Math.sin(f.ry), c=Math.cos(f.ry);
  return localToWorld(sh.g,f.ox+x*c+z*si,f.oz-x*si+z*c);
}
/* Regalpalette aus der Wandfarbe: auf heller Wand ein anthrazitfarbenes
   Gestell mit hellen, leicht in den Wandton gebrochenen Seiten und
   Rueckwand, auf dunkler Wand ein helles Alu-Gestell. Boeden und Preis-
   leiste bleiben neutral grau wie im echten Ladenbau. */
function regalFarben(K){
  let w=null; try{ w=wallSet(); }catch(e){} w=w||{a:'#e9e1d1'};
  const hx=h=>parseInt(String(h).slice(1),16), ch=(c,k)=>(c>>k)&255, lum=c=>(0.2126*ch(c,16)+0.7152*ch(c,8)+0.0722*ch(c,0))/255;
  const mix=(a,b,t)=>(Math.round(ch(a,16)*(1-t)+ch(b,16)*t)<<16)|(Math.round(ch(a,8)*(1-t)+ch(b,8)*t)<<8)|Math.round(ch(a,0)*(1-t)+ch(b,0)*t);
  const wa=hx(w.a), hell=lum(wa)>0.42;
  /* Verkaufstische (02.10., Tom: "nicht gelb, sondern weiss und so"):
     weisse Schichtstoffplatte, Gestell in Alu bzw. Anthrazit zur Wand */
  if(K&&K.bau==='tisch') return {rahmen:hell?0x3b3f47:0xc4c8ce, seite:0xc4c8ce, blende:0xc4c8ce, fuss:0x24272d, boden:0xd6d9de, preis:0xe9ebee, lippe:0xb4b9c1, kopf:hell?0x2b2f36:0x1d2026, platte:0xf1f0ec, rueck:0xe8e8e6};
  if(K&&K.cold) return {rahmen:0xc8ccd4,seite:0xc8ccd4,blende:0xc8ccd4,fuss:0x2a2e38,boden:0xd9dde4,preis:0xc8ccd4,lippe:0xe8ecf2,kopf:0x1b2340,platte:0xbf9a6c,rueck:0xeef4fa};
  return {rahmen:hell?0x3b3f47:0xb9bec6, seite:hell?mix(wa,0xf6f6f4,0.78):mix(wa,0x9da2aa,0.45), blende:hell?0x3b3f47:0xb9bec6, fuss:0x24272d,
    boden:0xd6d9de, preis:0xe9ebee, lippe:0xb4b9c1, kopf:hell?0x2b2f36:0x1d2026, platte:hell?0xbf9a6c:0x9c7a52, rueck:hell?mix(wa,0xf4f4f2,0.82):mix(wa,0xb4b8be,0.5)};
}
function regaleFaerben(){
  pegMat.color.copy(LIN(regalFarben(null).rueck));
  shelves.forEach(sh=>{ (sh.gestelle||[]).forEach(m=>{ const RF=regalFarben(m.userData.regalK), ca=m.geometry.attributes.color; let o=0;
      for(const [r,n] of m.userData.rollen){ const c=LIN(RF[r]); for(let i=0;i<n;i++) ca.setXYZ(o+i,c.r,c.g,c.b); o+=n; } ca.needsUpdate=true; });
    if(sh.gitterM) sh.gitterM.color.copy(LIN(regalFarben(kindOf(sh)).rahmen));
    if(sh.blind){ const RF=regalFarben(kindOf(sh)); sh.blind[0].material.color.copy(LIN(RF.seite)); sh.blind[1].material.color.copy(LIN(RF.rahmen)); } });
}
/* Drahtgitter fuer die Gitterbox: Stahldraht 4 mm im 5-cm-Raster, als
   Alpha-Textur - man sieht die Ware durch das Gitter */
let _gitterT=null;
function gitterTex(){ if(_gitterT) return _gitterT;
  _gitterT=tex(128,128,(g,W,H)=>{ g.clearRect(0,0,W,H); g.fillStyle='#ffffff';
    for(let x=0;x<W;x+=32){ g.fillRect(x,0,5,H); } for(let y=0;y<H;y+=32){ g.fillRect(0,y,W,5); }
    g.fillStyle='rgba(0,0,0,.35)'; for(let x=0;x<W;x+=32) g.fillRect(x+4,0,1,H); });
  _gitterT.wrapS=_gitterT.wrapT=THREE.RepeatWrapping; return _gitterT; }
/* Verkaufstisch und Gitterbox: eigene Bauform, aber dieselben Faecher
   (Level), Preisschilder, Kopfschild und Treffer wie ein Regal - Kunden,
   Einraeumer und Speicherstand behandeln sie wie jedes andere Regal. */
function bauMoebel(K,sh,g,RF){
  const W=K.w, D=K.d, nL=K.lv.length, y=K.lv[nL-1], fh=K.oben, iw=W-0.1, st=[], kopf=[];
  const GB={}; const box=(w,h,d)=>GB[w+'|'+h+'|'+d]||(GB[w+'|'+h+'|'+d]=new THREE.BoxGeometry(w,h,d));
  const fg=new THREE.Group(); g.add(fg);
  let preisY, headY;
  if(K.bau==='tisch'){
    /* Ladenbau-Tisch: weisse Platte mit Kantenumleimer, vier Vierkant-
       beine, Zarge und eine Ablage darunter fuer Nachschub */
    st.push({geo:box(W,0.04,D),m:tm(0,y-0.02,0),rolle:'platte'});
    st.push({geo:box(W+0.01,0.02,D+0.01),m:tm(0,y-0.045,0),rolle:'rahmen'});
    for(const sx of [-1,1]) for(const sz of [-1,1]) st.push({geo:box(0.05,y-0.06,0.05),m:tm(sx*(W/2-0.06),(y-0.06)/2,sz*(D/2-0.06)),rolle:'rahmen'});
    for(const sz of [-1,1]) st.push({geo:box(W-0.12,0.08,0.025),m:tm(0,y-0.1,sz*(D/2-0.06)),rolle:'rahmen'});
    for(const sx of [-1,1]) st.push({geo:box(0.025,0.08,D-0.12),m:tm(sx*(W/2-0.06),y-0.1,0),rolle:'rahmen'});
    st.push({geo:box(W-0.14,0.02,D-0.14),m:tm(0,0.16,0),rolle:'platte'});
    for(const sx of [-1,1]) for(const sz of [-1,1]) st.push({geo:box(0.06,0.015,0.06),m:tm(sx*(W/2-0.06),0.008,sz*(D/2-0.06)),rolle:'fuss'});
    st.push({geo:box(iw,0.05,0.014),m:tm(0,y-0.1,D/2-0.04),rolle:'preis'});
    preisY=[y-0.1];
    /* Aktionsschild auf einem Steckpfosten hinten in der Mitte - eigenes
       Teil, es verschwindet, solange der Tisch leer ist */
    kopf.push({geo:box(0.03,0.62,0.03),m:tm(0,y+fh+0.05,-D/2+0.08),rolle:'rahmen'});
    headY=y+fh+0.42;
    kopf.push({geo:box(1.0,0.2,0.03),m:tm(0,headY,-D/2+0.08),rolle:'kopf'});
  } else {
    /* Gitterbox: die Wanne steht auf einem Unterbau mit offenen Faechern
       fuer Kleinartikel (Tom, 02.10.). Unterbau: Seitenwangen, Rueckwand,
       Boeden mit Preisleiste. Wanne: Bodenblech, Eckpfosten, Drahtgitter
       rundum, oben ein Rohrrahmen; vorn niedriger zum Hineingreifen. */
    const hw=Math.min(0.62,fh+0.06), hv=Math.min(hw-0.1,fh-0.08);
    for(const sx of [-1,1]) st.push({geo:box(0.03,y,D),m:tm(sx*(W/2-0.015),y/2,0),rolle:'seite'});
    st.push({geo:box(W-0.06,y,0.02),m:tm(0,y/2,-D/2+0.01),rolle:'rueck'});
    st.push({geo:box(W,0.08,D),m:tm(0,0.04,0),rolle:'rahmen'});
    preisY=[];
    for(let li=0;li<nL-1;li++){ const yl=K.lv[li];
      st.push({geo:box(W-0.06,0.025,D-0.03),m:tm(0,yl-0.012,0),rolle:'boden'});
      st.push({geo:box(iw,0.05,0.014),m:tm(0,yl-0.02,D/2-0.013),rolle:'preis'}); preisY.push(yl-0.02); }
    st.push({geo:box(W,0.04,D),m:tm(0,y-0.02,0),rolle:'boden'});
    for(const sx of [-1,1]) for(const sz of [-1,1]) st.push({geo:box(0.035,hw+0.02,0.035),m:tm(sx*(W/2-0.018),y+hw/2,sz*(D/2-0.018)),rolle:'rahmen'});
    st.push({geo:box(W,0.025,0.025),m:tm(0,y+hw,-D/2+0.012),rolle:'rahmen'});
    st.push({geo:box(W,0.025,0.025),m:tm(0,y+hv,D/2-0.012),rolle:'rahmen'});
    for(const sx of [-1,1]) st.push({geo:box(0.025,0.025,D),m:tm(sx*(W/2-0.012),y+hw,0),rolle:'rahmen'});
    for(const sx of [-1,1]) for(const sz of [-1,1]) st.push({geo:box(0.08,0.02,0.08),m:tm(sx*(W/2-0.08),0.01,sz*(D/2-0.08)),rolle:'fuss'});
    const gm=new THREE.MeshStandardMaterial({map:gitterTex(),color:LIN(RF.rahmen),alphaTest:0.4,transparent:false,side:THREE.DoubleSide,metalness:0.5,roughness:0.45});
    sh.gitterM=gm;
    const wand=(w,h,x,yy,z,ry)=>{ const m=plane(w,h,gm,x,yy,z,ry,fg); const uv=m.geometry.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*w/0.2,uv.getY(i)*h/0.2); uv.needsUpdate=true; return m; };
    wand(W-0.04,hw,0,y+hw/2,-D/2+0.012,0); wand(W-0.04,hv,0,y+hv/2,D/2-0.012,0);
    for(const sx of [-1,1]) wand(D-0.04,hw,sx*(W/2-0.012),y+hw/2,0,Math.PI/2);
    preisY.push(y+hv-0.04); headY=y+hv+0.13;
    /* Klappschild vorn am Rohrrahmen */
    kopf.push({geo:box(0.9,0.2,0.02),m:tm(0,headY,D/2-0.004),rolle:'kopf'});
  }
  st.forEach(x=>{ x.color=RF[x.rolle]; }); kopf.forEach(x=>{ x.color=RF[x.rolle]; });
  const gest=new THREE.Mesh(merge(st),gestellMat());
  gest.userData.rollen=st.map(x=>[x.rolle,x._n]); gest.userData.regalK=K;
  const kg=new THREE.Group(); fg.add(kg); sh.kopfG=kg;
  const km=new THREE.Mesh(merge(kopf),gestellMat()); km.userData.rollen=kopf.map(x=>[x.rolle,x._n]); km.userData.regalK=K; kg.add(km);
  sh.gestelle=[gest,km];
  if(HIQ){ gest.castShadow=true; gest.receiveShadow=true; } fg.add(gest);
  for(const k in GB) GB[k].dispose();
  /* je Ebene Preisschild und Trefferflaeche (Unterbau-Faecher, Wanne bzw. Platte) */
  K.lv.forEach((yl,li)=>{
    const lt=tex(Math.round(700*REGAL_TEX),Math.round(80*REGAL_TEX),()=>{}); lt.anisotropy=8;
    plane(Math.min(0.46,iw*0.46),0.052,new THREE.MeshBasicMaterial({map:lt,toneMapped:false}),0,preisY[li],D/2+(K.bau==='tisch'?-0.032:0.003),0,fg);
    const h=fachHoehe(K,li), hit=bbox(iw,h,D,hitM,0,yl+h/2,0.01,fg,false);
    const lv={sh,li,face:0,type:null,count:0,q:1,items:[],tex:lt,hit}; hit.userData={kind:'level',ref:lv}; sh.levels.push(lv); });
  sh.headTex=tex(Math.round(1024*REGAL_TEX),Math.round(160*REGAL_TEX),()=>{});
  const hz=K.bau==='tisch'?-D/2+0.08+0.016:D/2+0.008, hwid=K.bau==='tisch'?0.96:0.86;
  plane(hwid,0.17,new THREE.MeshBasicMaterial({map:sh.headTex,toneMapped:false,side:THREE.DoubleSide}),0,headY,hz,0,kg);
  sh.headY=headY;
}
function createShelf(i,data){
  const kind=(data&&data.kind&&SHELFKIND[data.kind])?data.kind:'standard';
  const K=SHELFKIND[kind];
  pegMat.color.copy(LIN(regalFarben(null).rueck));
  const g=new THREE.Group(); const frei=slotsOffen().filter(sl=>slotPasst(K,sl));
  const s=data&&data.x!==undefined?data:(frei[0]||slotsOffen()[0]||SLOTS[0]);
  g.position.set(s.x,0,s.z); g.rotation.y=s.ry||0; scene.add(g);
  const W=K.w, D=K.d, top=K.lv[K.lv.length-1]+fachHoehe(K,K.lv.length-1)+0.04, hw=W/2, iw=W-0.1;
  const sh={i,g,kind,levels:[],W,D};
  /* Das Gestell ist reine Kulisse und wird je Warenseite zu einem
     Mesh verschmolzen - bei fuenfzig Regalen im Endausbau zaehlt das. */
  const GB={}; const box=(w,h,d)=>GB[w+'|'+h+'|'+d]||(GB[w+'|'+h+'|'+d]=new THREE.BoxGeometry(w,h,d));
  /* Farben nach Rolle: sie folgen der Wandfarbe (regalFarben) und werden
     beim Umstreichen nachgefaerbt (regaleFaerben) */
  const RF=regalFarben(K);
  if(K.bau){ bauMoebel(K,sh,g,RF); } else
  seitenVon(K).forEach((f,fi)=>{
    const fg=new THREE.Group(); fg.position.set(f.ox,0,f.oz); fg.rotation.y=f.ry; g.add(fg);
    const st=[];   /* Gestell */
    const li0=[];  /* Lichtleisten */
    st.push({geo:box(0.05,top,D),m:tm(-hw+0.025,top/2,0),rolle:'rahmen'});
    st.push({geo:box(0.05,top,D),m:tm( hw-0.025,top/2,0),rolle:'rahmen'});
    st.push({geo:box(W,0.06,D),  m:tm(0,top+0.03,0),rolle:'rahmen'});
    st.push({geo:box(iw,0.08,D-0.02),m:tm(0,0.04,0),rolle:'rahmen'});
    for(const sx of [-1,1]) st.push({geo:box(0.022,top-0.08,D),m:tm(sx*(hw+0.005),top/2,0),rolle:'seite'});
    /* Mittelsteher zwischen den Regalmodulen (02.10.: jedes Modul fasst
       ganze Kartons, das Verkaufsregal sind zwei Module) */
    for(let k=1;k<(K.mod||1);k++) st.push({geo:box(STEHER,top-0.1,D-0.06),m:tm(-iw/2+k*(modBreite(K)+STEHER)-STEHER/2,top/2,-0.02),rolle:'rahmen'});
    st.push({geo:box(W-0.06,0.14,0.03),m:tm(0,0.11,D/2-0.005),rolle:'blende'});
    for(const sx of [-1,1]) for(const sz of [-1,1])
      st.push({geo:box(0.09,0.04,0.09),m:tm(sx*(hw-0.1),0.02,sz*(D/2-0.1)),rolle:'fuss'});
    /* Rueckwand bleibt eigenes Mesh: Lochblech beziehungsweise Kuehlschrankwand */
    bbox(iw,top-0.1,0.02,K.cold?std(0xeef4fa,{roughness:0.5}):pegMat,0,top/2,-D/2+0.03,fg);
    K.lv.forEach((y,li)=>{
      st.push({geo:box(iw,0.03,D-0.04),m:tm(0,y-0.015,0),rolle:'boden'});
      st.push({geo:box(iw,0.05,0.014),m:tm(0,y-0.02,D/2-0.013),rolle:'preis'});
      st.push({geo:box(iw,0.012,0.02),m:tm(0,y-0.045,D/2-0.011),rolle:'lippe'});
      st.push({geo:box(iw-0.04,0.018,0.05),m:tm(0,y-0.055,-D/2+0.06),rolle:'rahmen'});
      if(li>0||K.cold) li0.push({geo:box(iw-0.06,0.016,0.04),m:tm(0,y-0.048,D/2-0.07)});
      const lt=tex(Math.round(700*REGAL_TEX),Math.round(80*REGAL_TEX),()=>{}); lt.anisotropy=8;
      plane(Math.min(0.46,iw*0.46),0.052,new THREE.MeshBasicMaterial({map:lt,toneMapped:false}),0,y-0.02,D/2-0.004,0,fg);
      const fh=fachHoehe(K,li), hit=bbox(iw,fh,D,hitM,0,y+fh/2,0.01,fg,false);
      const lv={sh,li,face:fi,type:null,count:0,q:1,items:[],tex:lt,hit}; hit.userData={kind:'level',ref:lv}; sh.levels.push(lv);
    });
    /* Kopfschild ueber jeder Warenseite */
    if(fi===0) sh.headTex=tex(Math.round(1024*REGAL_TEX),Math.round(160*REGAL_TEX),()=>{});
    const hy=top+(K.cold?0.34:0.18);
    st.push({geo:box(W-0.04,0.28,0.05),m:tm(0,hy,0.02),rolle:'kopf'});
    plane(W-0.1,0.24,new THREE.MeshBasicMaterial({map:sh.headTex,toneMapped:false}),0,hy,0.051,0,fg);
    st.forEach(x=>{ x.color=RF[x.rolle]; });
    const gest=new THREE.Mesh(merge(st),gestellMat());
    gest.userData.rollen=st.map(x=>[x.rolle,x.geo.index?x.geo.index.count:x.geo.attributes.position.count]); gest.userData.regalK=K; sh.gestelle=(sh.gestelle||[]).concat([gest]);
    if(HIQ){ gest.castShadow=true; gest.receiveShadow=true; } fg.add(gest);
    if(li0.length){
      const strip=new THREE.MeshStandardMaterial({color:LIN(0xf5f7fb),emissive:LIN(K.cold?0xcfe8ff:0xfff2dc),emissiveIntensity:K.cold?1.1:0});
      if(!K.cold) shelfStrips.push(strip);
      fg.add(new THREE.Mesh(merge(li0),strip));
    }
    if(K.cold){
      for(const sx of [-1,1]){
        bbox(W/2-0.02,top-0.14,0.03,coldGlass,sx*W/4,top/2,D/2-0.002,fg,false);
        bbox(0.03,top-0.14,0.04,coldFrame,sx*(W/2-0.03),top/2,D/2,fg,false);
        bbox(0.035,0.5,0.05,std(0xdfe3ea,{metalness:0.6}),sx*0.06,top*0.55,D/2+0.03,fg,false);
      }
      bbox(W,0.16,D,coldFrame,0,top+0.12,0,fg);
      plane(W*0.8,0.11,new THREE.MeshBasicMaterial({toneMapped:false,map:tex(256,36,(c,Wc,Hc)=>{ c.fillStyle='#0e2a44'; c.fillRect(0,0,Wc,Hc); c.fillStyle='#8fd6ff'; c.font=BUN(22); c.textAlign='center'; c.textBaseline='middle'; c.fillText('GEKÜHLT  4 °C',Wc/2,Hc/2+1); })}),0,top+0.12,D/2+0.005,0,fg);
    }
  });
  /* Beim Eckregal bleibt zwischen den beiden Schenkeln eine tote Ecke.
     Im Supermarkt steht dort ein Blindfeld - sonst schaut man durch
     den Spalt auf die Wand. */
  if(K.art==='ecke'){
    const RF=regalFarben(K); sh.blind=[bbox(0.52,top,0.52,std(RF.seite,{roughness:0.8}),-0.6,top/2,-0.6,g),bbox(0.56,0.06,0.56,std(RF.rahmen,{roughness:0.7}),-0.6,top+0.03,-0.6,g,false)];
  }
  for(const k in GB) GB[k].dispose();
  if(!K.bau) sh.headY=top+(K.cold?0.34:0.18);
  sh.mov=addMovable({kind:'shelf',name:K.name,g,fw:(K.fw||W)+0.06,fd:(K.fd||D)+0.04,ref:sh,onPlace:()=>syncShelf(sh)});
  shelves.push(sh);
  if(data&&data.levels) data.levels.forEach((ld,li)=>{ if(ld&&ld.type&&P[ld.type]&&sh.levels[li]){ const n=Math.min(ld.count|0,layout(ld.type,sh,sh.levels[li]).cap); for(let k=0;k<n;k++) addToLevel(sh.levels[li],ld.type,ld.q||1); } });
  sh.levels.forEach(updateLabel); updateHead(sh);
  return sh;
}
function shelfStand(sh,lv){ const K=kindOf(sh); return faceWorld(sh,lv?faceOf(sh,lv):seitenVon(K)[0],0,K.d/2+0.65); }
function itemMatrix(sh,lv,idx,jit){ const f=faceOf(sh,lv), p=slotLocal(lv.type,idx,sh,lv), w=faceWorld(sh,f,p.x,p.z);
  return mx(w.x,kindOf(sh).lv[lv.li]+p.y,w.z,sh.g.rotation.y+f.ry+jit); }
function syncShelf(sh){ sh.levels.forEach(lv=>{ lv.items.forEach((h,k)=>{ if(lv.type) h.pool.set(h,itemMatrix(sh,lv,k,h.jit||0)); }); }); }
/* nach Sparte: Essen und Getraenke haben seit 26.09. ihr eigenes Schild */
const HEADNAME={zubehoer:['SILVESTER-ZUBEHÖR','#2f7fd0'],f1:['KLEINFEUERWERK F1','#2f9e57'],f2:['FEUERWERK F2 · AB 18','#c8322a'],essen:['ESSEN & SNACKS','#d0782f'],getraenke:['GETRÄNKE','#1f8fb8']};
/* Welche Sparte ueberwiegt im Regal - daraus das Kopfschild */
function headArt(sh){
  const cnt={}; sh.levels.forEach(l=>{ if(l.type){ const c=sparteVon(l.type); cnt[c]=(cnt[c]||0)+l.count; } });
  let best=null,bn=0; for(const k in cnt) if(cnt[k]>bn){ bn=cnt[k]; best=k; }
  return best; }
function updateHead(sh){
  if(!sh.headTex) return;
  const best=headArt(sh);
  /* 02.10. (Tom): kein "REGAL FREI" mehr - dass es leer ist, sieht man.
     Tisch und Gitterbox zeigen leer gar kein Schild, Regale einen
     schlichten Kopf ohne Schrift. */
  if(sh.kopfG) sh.kopfG.visible=best!==null;
  const H=best!==null?HEADNAME[best]:['','#39405a'];
  const bg=schildBg().c||H[1], fg=schildFg().c;
  redraw(sh.headTex,(g,W,Hh)=>{
    g.setTransform(1,0,0,1,0,0); g.scale(W/512,Hh/80); W=512; Hh=80;
    g.fillStyle=bg; g.fillRect(0,0,W,Hh);
    g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(0,0,W,10);
    g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(0,Hh-8,W,8);
    g.fillStyle=fg; g.textAlign='center'; g.textBaseline='middle';
    if(H[0]){ fitFont(g,H[0],W-40,44,BUN); g.fillText(H[0],W/2,Hh/2+2); }
  });
}
/* Alle Kopfschilder neu drucken, nachdem die Farbe gewechselt wurde */
function repaintSchilder(){ shelves.forEach(updateHead); }
function updateLabel(lv){
  redraw(lv.tex,(g,W,H)=>{ g.setTransform(1,0,0,1,0,0); g.scale(W/300,H/34); W=300; H=34;
    g.fillStyle=lv.type?'#ffd23f':'#39405a'; g.fillRect(0,0,W,H); g.textBaseline='middle';
    if(lv.type){ g.fillStyle='#0e1226'; g.font=BAR(26); g.textAlign='left'; g.fillText(P[lv.type].short,8,H/2+1); g.font=BUN(22); g.textAlign='right'; g.fillText((S.prices[lv.type]||marketOf(lv.type)).toFixed(2).replace('.',',')+' €',W-8,H/2+2); }
    else { g.fillStyle='rgba(242,245,255,.75)'; g.font=BAR(24); g.textAlign='center'; g.fillText('leer',W/2,H/2+1); } });
}
function capOf(lv,t){ return layout(t||lv.type,lv.sh,lv).cap; }
/* Schildaufloesung (1 = Laden). Die Verpackungs-Vorfuehrung stellt 50
   Moebel auf einmal auf - mit halber Aufloesung brauchen ihre rund 250
   Schilder ein Viertel des Grafikspeichers (02.10., iPhone stuerzte ab). */
let REGAL_TEX=1;
/* Viele Stuecke auf einmal: Preis- und Kopfschild erst am Ende zeichnen.
   Vorher wurde fuer jedes einzelne Stueck neu gemalt und hochgeladen -
   bei 10 000 Stueck zwanzigtausendmal (Verpackungs-Vorfuehrung, 6 s). */
let _ohneSchild=false;
function addViele(lv,t,n){ _ohneSchild=true; let k=0; try{ while(k<n&&addToLevel(lv,t,1)) k++; } finally{ _ohneSchild=false; } updateLabel(lv); updateHead(lv.sh); return k; }
function leereFach(lv){ _ohneSchild=true; try{ while(lv.count>0) removeFromLevel(lv); } finally{ _ohneSchild=false; } }
function addToLevel(lv,t,q){
  if(lv.sh&&lv.sh.weg) return false;
  /* jedes eingeraeumte Stueck zaehlt fuer die Herausforderung */
  if(lv.type&&lv.type!==t) return false;
  if(!shelfAccepts(lv.sh,t)) return false;
  const L=layout(t,lv.sh,lv); if(lv.count>=L.cap) return false; if(pools[t].full()) return false;
  if(q===undefined) q=1;
  lv.q=lv.count?((lv.q||1)*lv.count+q)/(lv.count+1):q;
  lv.type=t; const jit=rand(-0.04,0.04);
  /* face mitgeben: sonst landete die Ware der zweiten Gondel- und
     Eckregalseite auf der ersten (02.10., Verpackungs-Vorfuehrung) */
  const h=pools[t].add(itemMatrix(lv.sh,{li:lv.li,type:t,face:lv.face},lv.count,jit)); h.jit=jit;
  lv.items.push(h); lv.count++; if(!_ohneSchild){ updateLabel(lv); updateHead(lv.sh); } return true;
}
/* der Kunde nimmt vorn: das zuletzt eingeraeumte Stueck steht am weitesten vorn */
function removeFromLevel(lv){ const h=lv.items.pop(); if(h) h.pool.remove(h); lv.count--; if(lv.count<=0){ lv.count=0; lv.type=null; lv.q=1; } if(!_ohneSchild){ updateLabel(lv); updateHead(lv.sh); } }
function allLevels(){ const a=[]; shelves.forEach(s=>s.levels.forEach(l=>a.push(l))); return a; }
function findLevel(t,from){ let best=null,bd=1e9; for(const l of allLevels()){ if(l.type===t&&l.count>0){ const d=from?from.distanceTo(shelfStand(l.sh,l)):0; if(d<bd){ bd=d; best=l; } } } return best; }
/* Größtes Fach, das dieses Produkt überhaupt aufnehmen kann */
function shelfCapOf(t){ let m=0; shelves.forEach(sh=>{ if(shelfAccepts(sh,t)) m=Math.max(m,layout(t,sh).cap); }); return m; }
/* Ins Kuehlregal kommt nur Gekuehltes; frische Lebensmittel (Fondue-
   und Raclette-Platten) nur ins Kuehlregal */
function shelfAccepts(sh,t){ const K=kindOf(sh); return K.cold?!!P[t].cold:!P[t].kuehlpflicht; }
function emptyLevel(t){ if(!canShelf(t)) return null;
  const pool=allLevels().filter(l=>shelfAccepts(l.sh,t));
  /* Kühlware kommt bevorzugt in den Kühlschrank */
  const pref=P[t].cold?pool.filter(l=>kindOf(l.sh).cold):[];
  for(const list of [pref,pool]){
    for(const l of list) if(l.type===t&&l.count<capOf(l,t)) return l;
    /* nur Faecher, in die die Ware auch passt - sonst lief der Einraeumer
       immer wieder ein zu niedriges Fach an */
    for(const l of list) if(!l.type&&capOf(l,t)>0) return l;
  }
  return null; }

/* =========================================================
   Lager
   ========================================================= */
const racks=[], RLV=[0.14,0.94,1.74];
/* Regaltypen im Lager. Alles bleibt in Reichweite: das oberste Fach
   liegt so hoch, dass man es von unten noch anvisieren kann. */
const RACKKIND={
  standard:{id:'standard',name:'Lagerregal',     w:2.44,zo:0.30,lv:RLV,                          sp:[-0.8,0,0.8],          cost:0,  step:0,  lvl:1, hoch:2.34},
  hoch:    {id:'hoch',    name:'Hochregal',      w:2.44,zo:0.30,lv:[0.14,1.02,1.90,2.78,3.66],   sp:[-0.8,0,0.8],          cost:520,step:150,lvl:12,hoch:4.26},
  schwer:  {id:'schwer',  name:'Schwerlastregal',w:3.30,zo:0.42,lv:[0.16,1.26,2.36,3.46],        sp:[-1.2,-0.4,0.4,1.2],   cost:880,step:240,lvl:18,hoch:4.20}
};
const RACKORDER=['standard','hoch','schwer'];
function rackKindOf(rk){ return RACKKIND[rk&&rk.kind]||RACKKIND.standard; }
function rackCount(k){ return racks.filter(r=>r.kind===k).length; }
/* Ein Stellplatz nimmt nur Regale, die unter die Decke passen */
function rackPasst(K,sl){ return K.hoch+0.5<=(sl.h||WH); }
function racksOffen(){ return RACKS.filter(x=>!x.zone||zoneOffen(x.zone)); }
function rackPlatzFrei(K){ return racksOffen().filter(sl=>rackPasst(K,sl)&&!racks.some(r=>Math.abs(r.g.position.x-sl.x)<0.05&&Math.abs(r.g.position.z-sl.z)<0.05)); }
function rackFreiFuer(kindId){ const K=RACKKIND[kindId]; return K?rackPlatzFrei(K).length>0:false; }
function rackAlleBelegt(kindId){
  const K=RACKKIND[kindId]; if(!K) return true;
  const passend=racksOffen().filter(sl=>rackPasst(K,sl));
  return passend.length>0&&rackPlatzFrei(K).length===0;
}
/* Was liegt gerade drin? Die drei haeufigsten Sorten auf das Schild. */
function drawRackSchild(rk){
  if(!rk||!rk.schildTex) return;
  const cnt={};
  rk.slots.forEach(sl=>{ if(sl.box&&P[sl.box.type]) cnt[sl.box.type]=(cnt[sl.box.type]||0)+sl.box.count; });
  const list=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]);
  redraw(rk.schildTex,(c,W,H)=>{
    c.fillStyle='#f4f2ea'; c.fillRect(0,0,W,H);
    c.fillStyle='#1b2340'; c.fillRect(0,0,W,54);
    c.textAlign='left'; c.textBaseline='middle';
    c.fillStyle='#ffd23f'; c.font=BUN(30); c.fillText('LAGERPLATZ '+((rk.nr||0)+1),16,29);
    if(!list.length){
      c.fillStyle='#8a9099'; c.font=BAR(40); c.textAlign='center';
      c.fillText('leer',W/2,150);
    } else {
      c.font=BAR(34);
      list.slice(0,3).forEach((t,k)=>{
        const y=96+k*52;
        c.fillStyle='#1b2340'; c.fillText(P[t].name,18,y);
        c.textAlign='right'; c.fillStyle='#3d7a52'; c.fillText(cnt[t]+' St.',W-18,y); c.textAlign='left';
        c.fillStyle='rgba(27,35,64,.14)'; c.fillRect(16,y+22,W-32,2);
      });
      if(list.length>3){ c.fillStyle='#8a9099'; c.font=BAR(26); c.fillText('+ '+(list.length-3)+' weitere',18,242); }
    }
    c.strokeStyle='#c9c4b8'; c.lineWidth=4; c.strokeRect(2,2,W-4,H-4);
  });
}
function refreshRackSchilder(){ racks.forEach(r=>{ if(r) drawRackSchild(r); }); }
const rackBlue=std(0x2f5d9e,{metalness:0.4,roughness:0.5}), rackOrange=std(0xe06a1f,{metalness:0.3,roughness:0.5}), deck=std(0x8d939d,{metalness:0.5,roughness:0.5});
/* Stuetzenprofil und Blechauflage einmal erzeugen und teilen -
   bei ueber dreissig Regalen sonst dreissig Texturen im Speicher. */
let _postM=null,_deckM=null,_rahmenM=null;
function rackMats(){
  if(_postM) return;
  const holeT=tex(64,512,(c,W,H)=>{
    c.fillStyle='#2f5d9e'; c.fillRect(0,0,W,H);
    c.fillStyle='rgba(255,255,255,.16)'; c.fillRect(0,0,6,H);
    c.fillStyle='rgba(0,0,0,.24)'; c.fillRect(W-7,0,7,H);
    for(let y=10;y<H-8;y+=22){
      c.fillStyle='#16335c'; c.fillRect(W/2-7,y,14,11);
      c.fillStyle='rgba(0,0,0,.45)'; c.fillRect(W/2-7,y+9,14,2);
    }
    for(let i2=0;i2<700;i2++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.07})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
  });
  _postM=new THREE.MeshStandardMaterial({map:holeT,metalness:0.35,roughness:0.5});
  /* Glatte, lackierte Stahlblechauflage statt Spanplattenoptik */
  const boardT=tex(256,256,(c,W,H)=>{
    const g0=c.createLinearGradient(0,0,0,H);
    g0.addColorStop(0,'#9aa1ac'); g0.addColorStop(0.45,'#aeb5c0'); g0.addColorStop(1,'#8f959f');
    c.fillStyle=g0; c.fillRect(0,0,W,H);
    for(let x=0;x<W;x+=64){ c.fillStyle='rgba(255,255,255,.08)'; c.fillRect(x,0,2,H);
      c.fillStyle='rgba(0,0,0,.08)'; c.fillRect(x+2,0,2,H); }
    for(let i2=0;i2<600;i2++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.035})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
    c.fillStyle='rgba(40,46,56,.22)'; c.fillRect(0,0,W,4); c.fillRect(0,H-4,W,4);
  });
  boardT.wrapS=boardT.wrapT=THREE.RepeatWrapping; boardT.repeat.set(3,1); boardT.anisotropy=8;
  _deckM=new THREE.MeshStandardMaterial({map:boardT,roughness:0.38,metalness:0.45});
  _rahmenM=new THREE.MeshStandardMaterial({vertexColors:true,metalness:0.38,roughness:0.46});
}
function createRack(i,data){
  const kind=(data&&data.kind&&RACKKIND[data.kind])?data.kind:'standard';
  const K=RACKKIND[kind];
  /* Stellplatz: gespeicherte Koordinate, sonst der erste freie, in den
     dieser Regaltyp auch hineinpasst. */
  let slot=null;
  if(!(data&&data.x!==undefined)){ const frei=rackPlatzFrei(K); slot=frei[0]||racksOffen().filter(sl=>rackPasst(K,sl))[0]||RACKS[0]; }
  const r=data&&data.x!==undefined?data:slot, g=new THREE.Group();
  g.position.set(r.x,0,r.z); g.rotation.y=r.ry||0; scene.add(g);
  const HT=K.hoch, XO=K.w/2, ZO=K.zo, BW=K.w;
  rackMats();
  const GB={}; const box=(w,h,d)=>GB[w+'|'+h+'|'+d]||(GB[w+'|'+h+'|'+d]=new THREE.BoxGeometry(w,h,d));
  const fr=[];                                 /* alles Starre in einem Mesh */
  /* Rahmen: Stuetzen, Fussplatten, Diagonalverband */
  for(const x of [-XO,XO]){
    for(const z of [-ZO,ZO]){
      const po=bbox(0.085,HT,0.075,_postM,x,HT/2,z,g);
      fr.push({geo:box(0.2,0.022,0.17),m:tm(x,0.011,z),color:0x1f2a3a});
      for(const bx of [-0.06,0.06]) fr.push({geo:box(0.022,0.03,0.022),m:tm(x+bx,0.03,z),color:0x8d939d});
    }
    /* Waagerechte Riegel und Diagonalen ueber die ganze Rahmenhoehe */
    const nR=Math.max(3,Math.round(HT/0.7));
    for(let k=0;k<nR;k++) fr.push({geo:box(0.04,0.04,2*ZO),m:tm(x,0.42+k*0.7,0),color:0x2a538c});
    for(let k=0;k<nR-1;k++)
      fr.push({geo:box(0.035,0.035,2*ZO*1.3+0.06),m:tm(x,0.77+k*0.7,0,(k%2?1:-1)*Math.atan2(0.7,2*ZO),0,0),color:0x2a538c});
  }
  const rk={i,g,kind,slot:slot||null,slots:[]};
  const sw=(K.sp.length>1?K.sp[1]-K.sp[0]:0.8)-0.02;
  K.lv.forEach((y,li)=>{
    for(const z of [-ZO+0.03,ZO-0.03]){
      /* Traverse als Kastenprofil mit Auflagelippe */
      fr.push({geo:box(BW,0.095,0.05),m:tm(0,y-0.05,z),color:0xe06a1f});
      fr.push({geo:box(BW,0.022,0.062),m:tm(0,y-0.005,z),color:0xf08a3a});
      fr.push({geo:box(BW,0.018,0.05),m:tm(0,y-0.098,z),color:0xb4520f});
      for(const x of [-BW/2,BW/2]){
        fr.push({geo:box(0.05,0.14,0.07),m:tm(x,y-0.045,z),color:0x1f2a3a});
        fr.push({geo:box(0.022,0.035,0.022),m:tm(x*0.94,y+0.02,z),color:0xd8d8d2});
      }
    }
    bbox(BW-0.08,0.022,2*ZO-0.09,_deckM,0,y-0.005,0,g);
    K.sp.forEach((x,si)=>{
      const hit=bbox(sw,0.74,2*ZO,hitM,x,y+0.37,0,g,false);
      const sl={rk,li,si,x,y,box:null,hit}; hit.userData={kind:'rslot',ref:sl}; rk.slots.push(sl);
    });
  });
  const fm=new THREE.Mesh(merge(fr),_rahmenM);
  if(HIQ){ fm.castShadow=true; fm.receiveShadow=true; } g.add(fm);
  for(const k in GB) GB[k].dispose();
  /* Inhaltsschild: zeigt, was gerade im Regal liegt */
  rk.schildTex=tex(512,256,()=>{});
  plane(0.52,0.26,new THREE.MeshStandardMaterial({roughness:0.6,map:rk.schildTex}),
    -XO+0.34,1.6,ZO+0.012,0,g);
  bbox(0.56,0.3,0.012,std(0x8d939d,{metalness:0.4,roughness:0.55}),-XO+0.34,1.6,ZO+0.004,g,false);
  rk.mov=addMovable({kind:'rack',name:K.name,g,fw:BW+0.16,fd:2*ZO+0.14,ref:rk});
  rk.nr=racks.length; racks.push(rk); drawRackSchild(rk);
  if(data&&data.slots) data.slots.forEach((sd,k)=>{ if(sd&&P[sd.type]&&rk.slots[k]) putInSlot(rk.slots[k],sd.type,sd.count,sd.q,sd.kiste); });
  drawRackSchild(rk);
  return rk;
}
/* Einpacken (Tom, 29.09.): ein leeres Regal verschwindet wieder ins
   Paket. Alles, was noch darauf verweist (Einraeumer unterwegs,
   Kunden auf dem Weg), sieht es an sh.weg und laesst es links liegen. */
function moebelWeg(m){
  dropFootprint(m); const i=movables.indexOf(m); if(i>=0) movables.splice(i,1);
  scene.remove(m.g); if(typeof navDirty==='function') navDirty();
}
function removeShelf(sh){
  const i=shelves.indexOf(sh); if(i<0) return false;
  sh.weg=true; moebelWeg(sh.mov); shelves.splice(i,1);
  shelves.forEach((x,k)=>{ x.i=k; });
  return true;
}
function removeRack(rk){
  const i=racks.indexOf(rk); if(i<0) return false;
  rk.weg=true; moebelWeg(rk.mov); racks.splice(i,1);
  racks.forEach((x,k)=>{ x.nr=k; drawRackSchild(x); });
  return true;
}
function putInSlot(sl,type,count,q,kiste){ const m=new THREE.Mesh(kartonGeo,kiste?kisteMat():kartonMat[type]); m.position.set(sl.x,sl.y+0.2,0); m.rotation.y=rand(-0.05,0.05); if(HIQ){ m.castShadow=true; m.receiveShadow=true; } sl.rk.g.add(m); sl.box={type,count,q:q||1,mesh:m}; if(kiste) sl.box.kiste=true; drawRackSchild(sl.rk); }
function findStoredBox(type){ for(const r of racks) for(const s of r.slots) if(s.box&&(!type||s.box.type===type)) return s; return null; }


/* =========================================================
   Lieferung: LKW setzt rückwärts an die Rampe, Tor fährt hoch,
   der Laderaum ist begehbar.
   ========================================================= */
let truck=null, truckDriver=null;
const TRUCKCOL={mertens:0x2f6bb8,kowalski:0xc8322a,ratzke:0x6f7684,import:0x3f8a5a,premium:0x1b2340,direkt:0x8a6ab8,pack:0xd08a2f,ddl:0xffcc00};
/* Laderaum: Heck bündig an der Wand, Innenmaße begehbar */
const LR={rear:-20.05,len:9.4,w:3.0,h:2.88,z:-2};
function lrFront(){ return LR.rear-LR.len; }
/* Scharnier der Ladebordwand und ihr Ausschlag beim Hochklappen */
const BRUECKE_X=-20.1, FLAP_MAX=1.5, FLAP_T=1.1;
/* Oberkante des Ladebodens am Rolltor V1 = Oberkante der heruntergeklappten Bruecke (makeBruecke: y 0,035 + halbe Platte 0,025) */
const LADEBODEN_V1=0.06;
/* Durchstieg vom Fuehrerhaus in den Laderaum (nur DDL an V1): Breite, Hoehe, Mitte quer */
const DURCHSTIEG={b:0.8,h:1.95,lz:0,tiefe:1.3,kabB:1.5};

function liveryTex(name,col,innen){
  const hex='#'+new THREE.Color(col).getHexString();
  /* DDL (Paketdienst, 07.10.): gelber Kasten, roter Streifen, wie man es von Paketautos kennt */
  if(name==='DDL') return tex(512,256,(g,W,H)=>{
    g.fillStyle=innen?'#e9e3cc':'#ffcc00'; g.fillRect(0,0,W,H);
    for(let x=0;x<W;x+=14){ g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(x,0,3,H); g.fillStyle='rgba(255,255,255,.28)'; g.fillRect(x+4,0,3,H); }
    g.fillStyle='#d40511'; g.fillRect(0,H*0.62,W,H*0.14); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,H*0.76,W,5);
    g.textAlign='center'; g.textBaseline='middle';
    g.fillStyle='#d40511'; fitFont(g,'DDL',W*0.5,innen?64:112,BUN); g.fillText('DDL',W/2,H*0.32);
    g.fillStyle='#ffffff'; g.font=BAR(innen?24:30); g.fillText('PAKETDIENST · EXPRESS',W/2,H*0.69);
    g.fillStyle='rgba(60,50,20,.25)'; for(let i=0;i<160;i++) g.fillRect(Math.random()*W,H*0.8+Math.random()*H*0.2,4,3);
  });
  return tex(512,256,(g,W,H)=>{
    if(innen){
      g.fillStyle='#d8d4c8'; g.fillRect(0,0,W,H);
      for(let x=0;x<W;x+=18){ g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(x,0,4,H); g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(x+5,0,3,H); }
      g.fillStyle=hex; g.fillRect(0,H*0.3,W,H*0.26);
      g.textAlign='center'; g.textBaseline='middle';
      fitFont(g,name.toUpperCase(),W*0.76,54,BUN);
      g.fillStyle='rgba(0,0,0,.28)'; g.fillText(name.toUpperCase(),W/2+3,H*0.43+3);
      g.fillStyle='#ffffff'; g.fillText(name.toUpperCase(),W/2,H*0.43);
      g.font=BAR(24); g.fillStyle=hex; g.fillText('PYROTECHNIK · GROSSHANDEL',W/2,H*0.68);
      g.font=BAR(19); g.fillStyle='#6a6458';
      g.fillText('Ladung sichern · Rauchen verboten',W/2,H*0.83);
      return;
    }
    g.fillStyle='#eef1f5'; g.fillRect(0,0,W,H);
    for(let x=0;x<W;x+=14){ g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(x,0,3,H); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(x+4,0,3,H); }
    g.fillStyle=hex; g.fillRect(0,H*0.28,W,H*0.30);
    g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,H*0.56,W,6);
    g.textAlign='center'; g.textBaseline='middle';
    fitFont(g,name.toUpperCase(),W*0.72,58,BUN);
    g.fillStyle='rgba(0,0,0,.35)'; g.fillText(name.toUpperCase(),W/2+3,H*0.43+3);
    g.fillStyle='#ffffff'; g.fillText(name.toUpperCase(),W/2,H*0.43);
    g.font=BAR(26); g.fillStyle=hex; g.fillText('PYROTECHNIK · GROSSHANDEL',W/2,H*0.70);
    g.save(); g.translate(W*0.87,H*0.83); g.rotate(Math.PI/4);
    g.fillStyle=MAT.css('signalorange'); g.fillRect(-26,-26,52,52); g.strokeStyle='#1f1f24'; g.lineWidth=3; g.strokeRect(-26,-26,52,52);
    g.restore();
    g.fillStyle='#1f1f24'; g.font=BUN(20); g.fillText('1.4G',W*0.87,H*0.89);
    g.fillStyle='rgba(60,60,70,.25)'; for(let i=0;i<160;i++) g.fillRect(Math.random()*W,H*0.8+Math.random()*H*0.2,4,3);
  });
}
/* --- Aufbau: Aussenhülle, Fahrerhaus, begehbarer Innenraum --- */
function makeTruck(name,col){
  const g=new THREE.Group();
  const dark=MAT.farbe('gummischwarz'), chrome=MAT.farbe('aluminium'), amber=MAT.farbe('signalorange'), redl=0x9a2a24;
  const vc=[];
  const B=(w,h,d,c,x,y,z,rx,ry,rz)=>vc.push({geo:roundedBoxGeo(w,h,d,Math.min(0.03,Math.min(w,h,d)*0.2),2),m:tm(x,y,z,rx,ry,rz),color:c});
  const Cy=(r1,r2,h,c,x,y,z,rx,ry,rz,seg)=>vc.push({geo:new THREE.CylinderGeometry(r1,r2,h,seg||12),m:tm(x,y,z,rx,ry,rz),color:c});
  const L=LR.len, W=LR.w, HH=LR.h;
  const cx=-L/2;                              // Mitte des Kastens, Heck bei x=0
  /* Fahrgestell unter dem Kasten */
  B(L+0.3,0.16,W-0.2,MAT.farbe('anthrazit'),cx,-0.1,0);
  Cy(0.26,0.26,0.9,chrome,cx+0.4,-0.16,0,0,0,Math.PI/2);
  Cy(0.05,0.05,1.2,MAT.farbe('graphit'),cx-0.2,-0.22,0.5,0,0,Math.PI/2);
  const wheel=(x,z)=>{ Cy(0.46,0.46,0.28,dark,x,-0.44,z,0,0,Math.PI/2,16);
    Cy(0.25,0.25,0.3,chrome,x,-0.44,z,0,0,Math.PI/2,12);
    Cy(0.1,0.1,0.32,MAT.farbe('silbergrau'),x,-0.44,z,0,0,Math.PI/2,10); };
  for(const wx of [-1.5,-2.5]) for(const wz of [-1.0,-1.28,1.0,1.28]) wheel(wx,wz);
  B(0.06,0.5,0.4,MAT.farbe('gummischwarz'),-0.5,-0.55,-1.3); B(0.06,0.5,0.4,MAT.farbe('gummischwarz'),-0.5,-0.55,1.3);
  /* Heckpartie: Rahmen, Leuchten, Unterfahrschutz */
  B(0.12,HH+0.2,W+0.16,MAT.farbe('graphit'),0.02,HH/2-0.1,0);
  B(0.16,0.16,W+0.2,MAT.farbe('graphit'),0.04,-0.5,0);
  for(const s of [-1,1]){
    B(0.08,0.16,0.3,redl,0.06,-0.28,s*0.9);
    B(0.08,0.16,0.16,amber,0.06,-0.28,s*0.66);
    B(0.08,0.16,0.16,MAT.farbe('weiss'),0.06,-0.28,s*1.1);
  }
  B(0.05,0.12,0.34,MAT.farbe('cremeweiss'),0.07,-0.5,0);
  /* Türflügel, weit aufgeschlagen an die Kastenseiten geklappt */
  for(const s of [-1,1]){
    vc.push({geo:roundedBoxGeo(1.2,HH-0.1,0.07,0.02,2),m:tm(-0.62,HH/2-0.05,s*(W/2+0.06),0,Math.PI/2,0),color:col});
    vc.push({geo:new THREE.BoxGeometry(0.05,0.5,0.04),m:tm(-0.14,HH/2-0.05,s*(W/2+0.1)),color:chrome});
  }
  /* Fahrerhaus vorn */
  const fx=cx-L/2-1.15;
  B(2.32,1.75,2.2,col,fx,0.78,0);
  B(2.34,0.14,2.24,col,fx,1.69,0);
  B(2.36,0.5,0.1,col,fx-1.07,0.06,0);
  B(1.6,0.34,0.06,MAT.farbe('anthrazit'),fx-1.11,0.42,0);
  B(2.45,0.34,0.26,MAT.farbe('graphit'),fx-1.11,-0.26,0);
  for(const s of [-1,1]){
    B(0.42,0.22,0.06,MAT.farbe('cremeweiss'),fx-1.13,0.04,s*0.86);
    B(0.16,0.14,0.06,amber,fx-1.11,0.04,s*1.12);
    B(0.06,0.5,0.06,MAT.farbe('anthrazit'),fx-0.5,1.16,s*1.22);
    B(0.1,0.34,0.14,MAT.farbe('anthrazit'),fx-0.5,1.3,s*1.34);
    B(0.5,0.08,0.34,MAT.farbe('graphit'),fx,-0.44,s*1.12);
  }
  B(2.3,0.12,0.4,col,fx-0.9,1.78,0);
  for(let i=0;i<5;i++) B(0.12,0.07,0.07,amber,fx-0.95,1.82,-0.5+i*0.25);
  B(0.34,0.12,0.03,MAT.farbe('cremeweiss'),fx-1.24,-0.36,0);
  Cy(0.06,0.06,1.9,MAT.farbe('anthrazit'),cx+L/2-0.1,0.96,-1.18);
  /* Stützwinde */
  for(const s of [-1,1]){ B(0.1,0.55,0.1,0x4a5058,cx-L/2+0.5,-0.42,s*0.8); B(0.2,0.06,0.2,MAT.farbe('graphit'),cx-L/2+0.5,-0.68,s*0.8); }
  const body=new THREE.Mesh(merge(vc),vcMat);
  if(HIQ){ body.castShadow=true; body.receiveShadow=true; } g.add(body);
  /* Kastenhülle aussen, innen dunkel */
  const bm=new THREE.MeshStandardMaterial({map:liveryTex(name,col,false),roughness:0.62,metalness:0.1});
  const side=MAT.get('kunststoffAnthrazit');
  const kof=new THREE.Mesh(new THREE.BoxGeometry(L,HH,W+0.1),[side,side,MAT.ober('lichtgrau','matt'),side,bm,bm]);
  kof.position.set(cx,HH/2,0); if(HIQ) kof.castShadow=true; g.add(kof);
  /* Scheiben */
  const gl=new THREE.MeshStandardMaterial({color:LIN(MAT.farbe('anthrazit')),transparent:true,opacity:0.62,roughness:0.08,metalness:0.4});
  const ws=new THREE.Mesh(new THREE.BoxGeometry(0.06,1.0,2.06),gl); ws.position.set(fx-1.03,1.22,0); ws.rotation.z=-0.13; g.add(ws);
  for(const s of [-1,1]){ const sw=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.78,0.06),gl); sw.position.set(fx-0.2,1.2,s*1.15); g.add(sw); }
  return g;
}
/* --- Begehbarer Innenraum --- */
/* Laderaumlampen stehen fest in der Szene, nur ihre Helligkeit
   wechselt. Kam frueher mit jedem LKW ein neues Licht dazu, musste
   three.js alle Shader neu uebersetzen - das Bild stand beim Andocken
   jedes Mal (15 Shader). Es gibt nur einen begehbaren Laderaum. */
const LR_LAMPE=[new THREE.PointLight(0xffeccf,0,11,1.4),new THREE.PointLight(0xffeccf,0,9,1.4)];
if(GFX!=='ultralow') LR_LAMPE.forEach(l=>scene.add(l));
function makeLaderaum(name,col,rahmen){
  /* rahmen: ein anderer Anlegeplatz (DDL an V1) - Koordinaten wie an der Basisrampe, nur in der Gruppe */
  const g=new THREE.Group();
  if(rahmen) rahmen.add(g); else { g.position.set(LR.rear,0,LR.z); scene.add(g); }
  const L=LR.len, W=LR.w, HH=LR.h;
  /* Boden: Siebdruckplatte mit zwei Laufspuren */
  const plank=tex(512,256,(c,Wc,Hc)=>{
    c.fillStyle='#9a8058'; c.fillRect(0,0,Wc,Hc);
    for(let i=0;i<5;i++){ c.fillStyle=i%2?'#8e7550':'#a3885e'; c.fillRect(0,i*Hc/5,Wc,Hc/5-2);
      c.strokeStyle='rgba(40,26,12,.16)'; c.lineWidth=1;
      for(let k=0;k<9;k++){ c.beginPath(); c.moveTo(rand(0,Wc),i*Hc/5); c.bezierCurveTo(rand(0,Wc),i*Hc/5+14,rand(0,Wc),i*Hc/5+34,rand(0,Wc),i*Hc/5+Hc/5); c.stroke(); } }
    for(const y of [Hc*0.24,Hc*0.76]){ const gr=c.createLinearGradient(0,y-26,0,y+26);
      gr.addColorStop(0,'rgba(60,44,24,0)'); gr.addColorStop(0.5,'rgba(60,44,24,.22)'); gr.addColorStop(1,'rgba(60,44,24,0)');
      c.fillStyle=gr; c.fillRect(0,y-26,Wc,52); }
    for(let i=0;i<1400;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.04})`; c.fillRect(Math.random()*Wc,Math.random()*Hc,2,2); } });
  plank.wrapS=plank.wrapT=THREE.RepeatWrapping; plank.repeat.set(3,1);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(L,W),new THREE.MeshStandardMaterial({map:plank,roughness:0.88}));
  /* An V1 (rahmen) liegt der Ladeboden buendig mit der Ueberladebruecke (Oberkante 0,06) - und damit ueber der Betonplatte des
     Versandhofs (0,036) samt Hofschrift und Fahrspurmarkierung (0,04-0,045), die sonst durch den Boden im Laderaum scheinen (15.10.) */
  fl.rotation.x=-Math.PI/2; fl.position.set(-L/2,rahmen?LADEBODEN_V1:0.025,0);
  if(HIQ) fl.receiveShadow=true; g.add(fl);
  /* Seitenwaende: helle Sperrholzverkleidung mit feinen Stossfugen */
  const wallTexI=tex(512,256,(c,Wc,Hc)=>{
    c.fillStyle='#e2ddd0'; c.fillRect(0,0,Wc,Hc);
    for(let x=0;x<Wc;x+=64){ c.fillStyle='rgba(120,110,92,.16)'; c.fillRect(x,0,2,Hc);
      c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(x+2,0,2,Hc); }
    const gr=c.createLinearGradient(0,0,0,Hc);
    gr.addColorStop(0,'rgba(255,255,255,.14)'); gr.addColorStop(0.75,'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(90,80,64,.18)');
    c.fillStyle=gr; c.fillRect(0,0,Wc,Hc);
    for(let i=0;i<20;i++){ c.fillStyle=`rgba(110,100,82,${rand(0.03,0.1)})`; c.beginPath();
      c.ellipse(Math.random()*Wc,Hc*0.62+Math.random()*Hc*0.38,rand(8,30),rand(4,11),0,0,Math.PI*2); c.fill(); } });
  wallTexI.wrapS=wallTexI.wrapT=THREE.RepeatWrapping; wallTexI.repeat.set(3.2,1);
  const wm=new THREE.MeshStandardMaterial({map:wallTexI,roughness:0.82,side:THREE.DoubleSide});
  const alu=MAT.get('stahlHell');
  for(const s of [-1,1]){
    const wl=new THREE.Mesh(new THREE.PlaneGeometry(L,HH),wm);
    wl.rotation.y=s>0?Math.PI:0; wl.position.set(-L/2,HH/2,s*W/2); g.add(wl);
    /* Zwei buendige Zurrschienen statt drei Gestaengen */
    for(const yy of [0.52,1.46]){
      bbox(L-0.12,0.05,0.026,alu,-L/2,yy,s*(W/2-0.02),g,false);
      for(let k=0;k<Math.floor((L-0.8)/1.1);k++)
        bbox(0.09,0.028,0.014,MAT.ober('silbergrau','blank'),-0.55-k*1.1,yy,s*(W/2-0.036),g,false);
    }
    /* Scheuerleiste unten */
    bbox(L-0.1,0.18,0.04,MAT.std(0x8a7f6a,{roughness:0.9}),-L/2,0.1,s*(W/2-0.03),g,false);
    /* Dachkante */
    bbox(L-0.1,0.07,0.05,alu,-L/2,HH-0.05,s*(W/2-0.03),g,false);
  }
  /* Decke mit lichtdurchlaessigem Dachband */
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(L,W),MAT.ober('cremeweiss','matt',{side:THREE.DoubleSide}));
  ceil.rotation.x=Math.PI/2; ceil.position.set(-L/2,HH,0); g.add(ceil);
  const dach=new THREE.Mesh(new THREE.PlaneGeometry(L-0.4,W*0.5),
    new THREE.MeshBasicMaterial({color:MAT.farbe('cremeweiss'),toneMapped:false}));
  dach.rotation.x=Math.PI/2; dach.position.set(-L/2,HH-0.012,0); g.add(dach);
  const led=new THREE.MeshBasicMaterial({color:0xfff6e2,toneMapped:false});
  for(const s of [-1,1]) bbox(L-0.8,0.03,0.07,led,-L/2,HH-0.07,s*(W/2-0.22),g,false);
  if(rahmen){ rahmen.updateMatrixWorld(true);
    const l0=rahmen.localToWorld(new THREE.Vector3(-L*0.45,HH-0.3,0)), l1=rahmen.localToWorld(new THREE.Vector3(-L*0.85,HH-0.3,0));
    LR_LAMPE[0].position.copy(l0); LR_LAMPE[0].intensity=0.85; LR_LAMPE[1].position.copy(l1); LR_LAMPE[1].intensity=0.6; }
  else {
  LR_LAMPE[0].position.set(g.position.x-L*0.45,HH-0.3,g.position.z); LR_LAMPE[0].intensity=0.85;
  LR_LAMPE[1].position.set(g.position.x-L*0.85,HH-0.3,g.position.z); LR_LAMPE[1].intensity=0.6; }
  /* Stirnwand mit Lieferantenschrift */
  const fm=new THREE.MeshStandardMaterial({map:liveryTex(name,col,true),roughness:0.78});
  if(!rahmen){
    const front=new THREE.Mesh(new THREE.PlaneGeometry(W,HH),fm);
    front.rotation.y=Math.PI/2; front.position.set(-L+0.02,HH/2,0); g.add(front);
  } else {
    /* DDL: Stirnwand mit Durchstieg zum Fuehrerhaus - der Fahrer kommt aus dem Fahrzeug, nicht aus dem Nichts (15.10.).
       Vier Stuecke um die Oeffnung, UV wie bei der ganzen Wand (u laeuft in Richtung -z der Gruppe). */
    const D=DURCHSTIEG, z0=D.lz-D.b/2, z1=D.lz+D.b/2;
    const stueck=(a0,a1,y0,y1)=>{ const geo=new THREE.PlaneGeometry(a1-a0,y1-y0), pos=geo.attributes.position, uv=geo.attributes.uv, c=(a0+a1)/2, cy=(y0+y1)/2;
      for(let i=0;i<uv.count;i++){ uv.setXY(i,(W/2-(c-pos.getX(i)))/W,(cy+pos.getY(i))/HH); }
      const m=new THREE.Mesh(geo,fm); m.rotation.y=Math.PI/2; m.position.set(-L+0.02,cy,c); g.add(m); };
    stueck(-W/2,z0,0,HH); stueck(z1,W/2,0,HH); stueck(z0,z1,D.h,HH);
    /* Fuehrerhaus hinter der Wand: dunkle Kabine, die Figur steht darin, bis die Tuer aufgeht */
    const km=MAT.ober('anthrazit','matt',{side:THREE.DoubleSide}), kb=D.kabB, kt=D.tiefe, kx=-L-kt/2+0.02;
    const kp=(w,h,x,y,z,ry,rx)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),km); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,0); g.add(m); };
    kp(kt,kb,kx,0.05,D.lz,0,-Math.PI/2);                       /* Boden */
    kp(kt,kb,kx,2.1,D.lz,0,Math.PI/2);                          /* Decke */
    kp(kt,2.1,kx,1.05,D.lz-kb/2,0,0); kp(kt,2.1,kx,1.05,D.lz+kb/2,0,0);   /* Seiten */
    kp(kb,2.1,-L-kt+0.02,1.05,D.lz,Math.PI/2);                  /* Rueckwand */
    /* Tuerblatt: angeschlagen an der +z-Kante, schwenkt in den Laderaum (g.userData.tuer.rotation.y: 0 zu, -1,75 offen) */
    const tuer=new THREE.Group(); tuer.position.set(-L+0.045,0,z1); g.add(tuer);
    const blatt=new THREE.Mesh(new THREE.BoxGeometry(0.04,D.h,D.b-0.01),MAT.ober('lichtgrau','matt')); blatt.position.set(0,D.h/2,-D.b/2); tuer.add(blatt);
    const klinke=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.03,0.12),MAT.ober('aluminium','blank')); klinke.position.set(0.03,1.0,-D.b+0.14); tuer.add(klinke);
    g.userData.tuer=tuer;
  }
  for(const s of [-1,1]) bbox(0.05,HH,0.07,alu,-L+0.05,HH/2,s*(W/2-0.07),g,false);
  /* Heck: Kantenschutz innen, Rahmen aussen gegen die Torlaibung */
  for(const s of [-1,1]) bbox(0.09,HH,0.09,alu,-0.05,HH/2,s*(W/2-0.05),g,false);
  const rah=MAT.get('anthrazitMatt');
  for(const s of [-1,1]) bbox(0.14,HH+0.34,0.28,rah,-0.07,HH/2,s*(W/2+0.13),g,false);
  bbox(0.14,0.28,W+0.54,rah,-0.07,HH+0.14,0,g,false);
  bbox(0.14,0.09,W,MAT.get('stahlMittel'),-0.04,0.05,0,g,false);
  bbox(0.1,0.1,W,alu,-0.05,HH-0.05,0,g,false);
  return g;
}
/* --- Ladung als einzeln aufhebbare Pakete --- */
function cargoSlot(i){
  const col2=i%2, row=Math.floor(i/2)%8, lev=Math.floor(i/16);
  return {x:LR.rear-0.95-row*0.72,y:0.21+lev*0.42,z:LR.z+(col2?1.05:-1.05)};
}
function fillCargo(){
  if(!truck) return;
  truck.boxes.forEach(m=>scene.remove(m));
  truck.boxes=[];
  truck.cargo.forEach((c,i)=>{
    if(i>=32) return;
    const s=cargoSlot(i);
    /* Ein Regal kommt flach verpackt: ein langes schmales Paket,
       kein Karton. So sieht man im Laderaum sofort, was drin ist. */
    const pk=c.regal||c.einbau, M=pk?paketMass(c):null;
    /* Versandmaterial (11d): Kartonbuendel, Folienrolle, Klebeband */
    const m=c.vm?vmLadungMesh(c.vm):pk
      ? new THREE.Mesh(new THREE.BoxGeometry(M[0],M[1],M[2]),regalPaketMat())
      : bk.karton(c.type);
    m.position.set(s.x,c.vm?m.userData.h/2+0.02+Math.floor(i/16)*0.42:pk?M[1]/2+0.02+Math.floor(i/16)*0.42:s.y,s.z);
    m.rotation.y=rand(-0.07,0.07);
    if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
    Object.assign(m.userData,{kind:'tbox',ref:c});
    scene.add(m); truck.boxes.push(m);
  });
}
function spawnTruck(cargo,supId,supName){
  const colr=TRUCKCOL[supId]||TRUCKCOL.mertens;
  const g=makeTruck(supName||'Lieferung',colr);
  g.position.set(LR.rear-9.5,0,LR.z); scene.add(g);
  /* Erst faehrt der LKW an, dann geht das Tor hoch. Vorher lief es
     andersherum: das Tor ging auf und man sah durch die offene
     Oeffnung eine graue Wand auf sich zurollen. */
  truck={g,cargo,boxes:[],raum:null,bruecke:null,flap:0,flapCol:null,state:'anfahrt',t:0,name:supName,col:colr,cols:[]};
  toast(`${supName} rollt an die Rampe.`);
}
/* Ueberladebruecke = die heruntergeklappte Klappe des LKW.
   Existiert nur, solange der LKW an der Rampe steht. */
function makeBruecke(rahmen){
  /* Scharnier sitzt an der Heckkante des LKW, die Platte reicht ins
     Lager hinein. Ein Drehen um z klappt sie hoch wie eine echte
     Ladebordwand. */
  const g=new THREE.Group(); if(rahmen) g.position.set(BRUECKE_X-LR.rear,0.035,0); else g.position.set(BRUECKE_X,0.035,LR.z);
  const plate=tex(128,128,(c,W,H)=>{ c.fillStyle='#8f959e'; c.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=22) for(let x=0;x<W;x+=22){ c.save(); c.translate(x+11,y+11); c.rotate((x/22+y/22)%2?0.7:-0.7);
      c.fillStyle='#a8aeb8'; c.fillRect(-8,-2.5,16,5); c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(-8,2.5,16,1.5); c.restore(); }
    for(let i=0;i<400;i++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.07})`; c.fillRect(Math.random()*W,Math.random()*H,3,3); } });
  const pl=new THREE.MeshStandardMaterial({map:plate,metalness:0.6,roughness:0.45});
  bbox(1.5,0.05,3.1,pl,0.8,0,0,g,false);
  const lip=bbox(0.34,0.04,3.1,pl,-0.02,0,0,g,false); lip.rotation.z=0.05;
  for(const dz of [-1.5,1.5]) bbox(1.5,0.02,0.1,MAT.get('markierungGelb'),0.8,0.035,dz,g,false);
  /* Scharniere zum Laderaum hin */
  const hg=MAT.get('stahlMittel');
  for(const dz of [-1.1,0,1.1]) bbox(0.12,0.08,0.34,hg,0.08,0.015,dz,g,false);
  (rahmen||scene).add(g);
  return g;
}
/* Klappenstellung: 0 liegt flach als Bruecke, 1 steht senkrecht am Heck */
function setFlap(){
  if(truck&&truck.bruecke) truck.bruecke.rotation.z=truck.flap*FLAP_MAX;
}
/* Aussenmodell gegen den begehbaren Laderaum tauschen. Das
   passiert, sobald das Tor anfaengt hochzufahren - sonst schaut
   man durch das oeffnende Tor auf die geschlossene Rueckwand des
   Kastens, eine graue Flaeche, die auf einen zukommt. */
function oeffneLaderaum(){
  if(!truck||truck.raum) return;
  truck.g.position.x=LR.rear;
  truck.g.visible=false;
  truck.raum=makeLaderaum(truck.name||'Lieferung',truck.col);
  truck.flap=0; truck.bruecke=makeBruecke(); setFlap();
  fillCargo();
  /* Der Laderaum wird begehbar: Seitenwände und Stirnwand begrenzen */
  truck.cols=[
    col(lrFront()-0.3,LR.rear+0.2,LR.z-LR.w/2-0.2,LR.z-LR.w/2+0.02),
    col(lrFront()-0.3,LR.rear+0.2,LR.z+LR.w/2-0.02,LR.z+LR.w/2+0.2),
    col(lrFront()-0.25,lrFront()-0.02,LR.z-LR.w/2,LR.z+LR.w/2)
  ];
  if(!truckDriver){
    /* 06.10.: Fahrer in Warnweste (Rocketbox-Figur Bauarbeiter) */
    truckDriver=makePerson({kopf:'CM07'});
    truckDriver.position.set(lrFront()-2.2,0,LR.z+2.2);
    truckDriver.rotation.y=-1.1; scene.add(truckDriver);
  }
}
function dockTruck(){
  oeffneLaderaum();
  truck.state='docked';
  statAdd('lkw',1);          /* eine Lieferung ist angekommen */
  S.tut.lkw=true;
  toast('Der Laderaum ist offen. Hol die Kartons heraus.',COARSE?'':'xp');
}
/* Steht noch jemand im Laderaum? */
function trailerOccupied(){
  const inside=(x,z)=>x<LR.rear-0.1&&x>lrFront()-0.4&&Math.abs(z-LR.z)<LR.w/2+0.3;
  if(inside(pl.x,pl.z)) return true;
  for(const k in staff){ const w=staff[k]; if(w&&inside(w.pos.x,w.pos.z)) return true; }
  return false;
}
function clearRaum(){
  if(!truck) return;
  truck.boxes.forEach(m=>scene.remove(m)); truck.boxes=[];
  if(truck.raum){ scene.remove(truck.raum); truck.raum=null; LR_LAMPE.forEach(l=>{ l.intensity=0; }); }
  if(truck.bruecke){ scene.remove(truck.bruecke); truck.bruecke=null; }
  if(truck.flapCol){ dropCol(truck.flapCol); truck.flapCol=null; }
  truck.cols.forEach(c=>dropCol(c)); truck.cols=[];
}
function leaveTruck(){
  if(!truck||truck.state!=='docked') return;
  /* Reihenfolge: Ladebordwand hoch, dann geht das Tor zu, und erst
     dann faehrt der LKW weg. */
  truck.state='flap'; truck.t=0;
  if(truckDriver){ scene.remove(truckDriver); truckDriver=null; }
}
function removeTruck(){
  if(!truck) return;
  clearRaum();
  scene.remove(truck.g); truck=null;
  if(truckDriver){ scene.remove(truckDriver); truckDriver=null; }
}
function truckLeft(){ return truck&&truck.state==='docked'?truck.cargo.length:0; }
/* Jeder vom LKW genommene Karton zaehlt als Lieferungsteil */
/* Flaches Paket fuer ein Regal: Bretter und Profile, in Folie - Material aus der Bibliothek (MAT 'regalPaket', Einheit 15.10.) */
function regalPaketMat(){ return MAT.get('regalPaket'); }
function takeBox(item){ statAdd('kartons',1);

  if(!truck||truck.state!=='docked') return;
  if(item.vm){ vmTakeBox(item); return; }
  if(S.carrying&&!karreNimmt(!!(item.regal||item.einbau))){ toast(karreVoll()?'Die Karre ist voll. Erst abladen.':'Du hast schon etwas auf dem Arm.'); return; }
  const i=truck.cargo.indexOf(item); if(i<0) return;
  truck.cargo.splice(i,1);
  S.carrying=item.regal?{regal:item.regal}:item.einbau?{einbau:item.einbau}:{type:item.type,count:P[item.type].box,q:item.q||1};
  S.tut.pick=true; sfx.pop(); fillCargo(); updateCarry();
  if(!truck.cargo.length) toast('Laderaum leer. Geh raus, dann fährt er los.');
}
function takeFromTruck(){ if(truck&&truck.cargo.length) takeBox(truck.cargo[0]); }
/* Ein Regalpaket ist kein Karton: der Mitarbeiter stellt es gleich
   an der Rampe auf. Ist kein Stellplatz frei, geht es zurueck an den
   Lieferanten - sonst stuende der LKW bis in alle Ewigkeit da. */
function regalAusladen(c){
  /* Pakete werden an der Rampe abgestellt, nicht aufgebaut - das macht
     man selbst dort, wo das Regal stehen soll (Tom, 26.09.) */
  spawnPaket(c,{x:DOCK.stand.x+rand(-0.8,0.8),z:DOCK.stand.z+rand(-0.8,0.8),ry:rand(-0.4,0.4)});
}
function pullFromTruck(){
  if(!truck||truck.state!=='docked'||!truck.cargo.length) return null;
  for(let k=0;k<truck.cargo.length;k++) if(truck.cargo[k].regal||truck.cargo[k].einbau){ regalAusladen(truck.cargo.splice(k,1)[0]); k--; fillCargo(); }
  /* Versandmaterial bleibt fuer die Aufgabe "Versandmaterial einraeumen" liegen */
  const i=truck.cargo.findIndex(c=>!c.vm&&!c.regal&&!c.einbau); if(i<0) return null;
  const c=truck.cargo.splice(i,1)[0]; fillCargo();
  return {type:c.type,count:P[c.type].box,q:c.q||1};
}
function dumpTruck(){
  if(!truck) return;
  const n=truck.cargo.length;
  truck.cargo.forEach(c=>{ if(c.vm) vmEinlagern(-1,c.vm); else if(c.regal||c.einbau) regalAusladen(c); else spawnFloorBox(c.type,P[c.type].box,null,c.q||1); });
  truck.cargo.length=0;
  if(n) toast(`Der Fahrer hat ${n} Karton${n>1?'s':''} im Lager abgestellt.`);
  if(truck.state==='docked') leaveTruck(); else removeTruck();
}
function updateTruck(dt){
  updateDoor(dt);
  /* 06.10.: der Fahrer ist jetzt eine echte Figur - steht und atmet */
  if(truckDriver&&dt) animPerson(truckDriver,false,dt,1);
  if(!truck) return;
  const g=truck.g;
  if(truck.state==='anfahrt'){
    /* Rueckwaerts an die Rampe, das Tor bleibt dabei zu. */
    const d=LR.rear-g.position.x, sp=clamp(d*0.9,0.5,2.6);
    g.position.x+=sp*dt;
    if(d<=0.03){
      g.position.x=LR.rear; truck.state='torauf';
      doorOpen(true); oeffneLaderaum();
      toast('Der Fahrer steht an der Rampe. Das Tor fährt hoch.');
    }
  } else if(truck.state==='torauf'){
    /* Der LKW steht schon; sobald das Tor oben ist, geht die
       Bordwand herunter und der Laderaum wird begehbar. */
    if(doorIsOpen()) dockTruck();
  } else if(truck.state==='docked'){
    if(!truck.cargo.length&&!trailerOccupied()){ truck.t+=dt; if(truck.t>1.2) leaveTruck(); }
    else truck.t=0;
  } else if(truck.state==='flap'){
    /* Steht doch wieder jemand im Laderaum, klappt sie zurueck herunter. */
    if(trailerOccupied()){
      truck.flap=Math.max(0,truck.flap-dt/FLAP_T); setFlap();
      if(truck.flapCol&&truck.flap<0.6){ dropCol(truck.flapCol); truck.flapCol=null; }
      if(truck.flap<=0) truck.state='docked';
      return;
    }
    truck.flap=Math.min(1,truck.flap+dt/FLAP_T); setFlap();
    if(truck.flap>=0.6&&!truck.flapCol) truck.flapCol=col(-20.26,-20.0,LR.z-1.6,LR.z+1.6);
    if(truck.flap>=1){
      /* Erst faehrt das Tor zu, dann der LKW weg. Der Laderaum
         bleibt so lange stehen: wird er schon jetzt gegen das
         Aussenmodell getauscht, steht im zufahrenden Tor wieder
         die graue Rueckwand des Kastens. */
      truck.state='torzu'; truck.t=0; doorOpen(false);
    }
  } else if(truck.state==='torzu'){
    if(!door||door.t<=0.05){
      clearRaum(); g.visible=true;
      truck.state='out'; truck.t=0;
    }
  } else if(truck.state==='out'){
    truck.t+=dt;
    g.position.x-=Math.min(7,truck.t*5)*dt;
    if(g.position.x<lrFront()-14) removeTruck();
  }
}

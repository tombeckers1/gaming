
/* =========================================================
   Lieferung: LKW setzt rückwärts an die Rampe, Tor fährt hoch,
   der Laderaum ist begehbar.
   ========================================================= */
let truck=null, truckDriver=null;
const TRUCKCOL={mertens:0x2f6bb8,kowalski:0xc8322a,ratzke:0x6f7684,import:0x3f8a5a,premium:0x1b2340,direkt:0x8a6ab8,pack:0xd08a2f};
/* Laderaum: Heck bündig an der Wand, Innenmaße begehbar */
const LR={rear:-20.05,len:9.4,w:3.0,h:2.88,z:-2};
function lrFront(){ return LR.rear-LR.len; }
/* Scharnier der Ladebordwand und ihr Ausschlag beim Hochklappen */
const BRUECKE_X=-20.1, FLAP_MAX=1.5, FLAP_T=1.1;

function liveryTex(name,col,innen){
  const hex='#'+new THREE.Color(col).getHexString();
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
    g.fillStyle='#f2a01c'; g.fillRect(-26,-26,52,52); g.strokeStyle='#1f1f24'; g.lineWidth=3; g.strokeRect(-26,-26,52,52);
    g.restore();
    g.fillStyle='#1f1f24'; g.font=BUN(20); g.fillText('1.4G',W*0.87,H*0.89);
    g.fillStyle='rgba(60,60,70,.25)'; for(let i=0;i<160;i++) g.fillRect(Math.random()*W,H*0.8+Math.random()*H*0.2,4,3);
  });
}
/* --- Aufbau: Aussenhülle, Fahrerhaus, begehbarer Innenraum --- */
function makeTruck(name,col){
  const g=new THREE.Group();
  const dark=0x14161c, chrome=0xb9bec8, amber=0xf2a01c, redl=0x9a2a24;
  const vc=[];
  const B=(w,h,d,c,x,y,z,rx,ry,rz)=>vc.push({geo:roundedBoxGeo(w,h,d,Math.min(0.03,Math.min(w,h,d)*0.2),2),m:tm(x,y,z,rx,ry,rz),color:c});
  const Cy=(r1,r2,h,c,x,y,z,rx,ry,rz,seg)=>vc.push({geo:new THREE.CylinderGeometry(r1,r2,h,seg||12),m:tm(x,y,z,rx,ry,rz),color:c});
  const L=LR.len, W=LR.w, HH=LR.h;
  const cx=-L/2;                              // Mitte des Kastens, Heck bei x=0
  /* Fahrgestell unter dem Kasten */
  B(L+0.3,0.16,W-0.2,0x2a2e36,cx,-0.1,0);
  Cy(0.26,0.26,0.9,chrome,cx+0.4,-0.16,0,0,0,Math.PI/2);
  Cy(0.05,0.05,1.2,0x3a3f48,cx-0.2,-0.22,0.5,0,0,Math.PI/2);
  const wheel=(x,z)=>{ Cy(0.46,0.46,0.28,dark,x,-0.44,z,0,0,Math.PI/2,16);
    Cy(0.25,0.25,0.3,chrome,x,-0.44,z,0,0,Math.PI/2,12);
    Cy(0.1,0.1,0.32,0x8a8f99,x,-0.44,z,0,0,Math.PI/2,10); };
  for(const wx of [-1.5,-2.5]) for(const wz of [-1.0,-1.28,1.0,1.28]) wheel(wx,wz);
  B(0.06,0.5,0.4,0x1a1c22,-0.5,-0.55,-1.3); B(0.06,0.5,0.4,0x1a1c22,-0.5,-0.55,1.3);
  /* Heckpartie: Rahmen, Leuchten, Unterfahrschutz */
  B(0.12,HH+0.2,W+0.16,0x3a4150,0.02,HH/2-0.1,0);
  B(0.16,0.16,W+0.2,0x3a4150,0.04,-0.5,0);
  for(const s of [-1,1]){
    B(0.08,0.16,0.3,redl,0.06,-0.28,s*0.9);
    B(0.08,0.16,0.16,amber,0.06,-0.28,s*0.66);
    B(0.08,0.16,0.16,0xe8ecf2,0.06,-0.28,s*1.1);
  }
  B(0.05,0.12,0.34,0xf2f2ee,0.07,-0.5,0);
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
  B(1.6,0.34,0.06,0x2a2e36,fx-1.11,0.42,0);
  B(2.45,0.34,0.26,0x33383f,fx-1.11,-0.26,0);
  for(const s of [-1,1]){
    B(0.42,0.22,0.06,0xf2f0e4,fx-1.13,0.04,s*0.86);
    B(0.16,0.14,0.06,amber,fx-1.11,0.04,s*1.12);
    B(0.06,0.5,0.06,0x2a2e36,fx-0.5,1.16,s*1.22);
    B(0.1,0.34,0.14,0x2a2e36,fx-0.5,1.3,s*1.34);
    B(0.5,0.08,0.34,0x3a3f48,fx,-0.44,s*1.12);
  }
  B(2.3,0.12,0.4,col,fx-0.9,1.78,0);
  for(let i=0;i<5;i++) B(0.12,0.07,0.07,amber,fx-0.95,1.82,-0.5+i*0.25);
  B(0.34,0.12,0.03,0xf2f2ee,fx-1.24,-0.36,0);
  Cy(0.06,0.06,1.9,0x2a2e36,cx+L/2-0.1,0.96,-1.18);
  /* Stützwinde */
  for(const s of [-1,1]){ B(0.1,0.55,0.1,0x4a5058,cx-L/2+0.5,-0.42,s*0.8); B(0.2,0.06,0.2,0x3a4150,cx-L/2+0.5,-0.68,s*0.8); }
  const body=new THREE.Mesh(merge(vc),vcMat);
  if(HIQ){ body.castShadow=true; body.receiveShadow=true; } g.add(body);
  /* Kastenhülle aussen, innen dunkel */
  const bm=new THREE.MeshStandardMaterial({map:liveryTex(name,col,false),roughness:0.62,metalness:0.1});
  const side=std(0x2a2e36,{roughness:0.7});
  const kof=new THREE.Mesh(new THREE.BoxGeometry(L,HH,W+0.1),[side,side,std(0xdfe3ea),side,bm,bm]);
  kof.position.set(cx,HH/2,0); if(HIQ) kof.castShadow=true; g.add(kof);
  /* Scheiben */
  const gl=new THREE.MeshStandardMaterial({color:LIN(0x1d2632),transparent:true,opacity:0.62,roughness:0.08,metalness:0.4});
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
LR_LAMPE.forEach(l=>scene.add(l));
function makeLaderaum(name,col){
  const g=new THREE.Group(); g.position.set(LR.rear,0,LR.z); scene.add(g);
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
  fl.rotation.x=-Math.PI/2; fl.position.set(-L/2,0.025,0);
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
  const alu=std(0xb6bcc4,{metalness:0.55,roughness:0.42});
  for(const s of [-1,1]){
    const wl=new THREE.Mesh(new THREE.PlaneGeometry(L,HH),wm);
    wl.rotation.y=s>0?Math.PI:0; wl.position.set(-L/2,HH/2,s*W/2); g.add(wl);
    /* Zwei buendige Zurrschienen statt drei Gestaengen */
    for(const yy of [0.52,1.46]){
      bbox(L-0.12,0.05,0.026,alu,-L/2,yy,s*(W/2-0.02),g,false);
      for(let k=0;k<Math.floor((L-0.8)/1.1);k++)
        bbox(0.09,0.028,0.014,std(0x7d838c,{metalness:0.7,roughness:0.35}),-0.55-k*1.1,yy,s*(W/2-0.036),g,false);
    }
    /* Scheuerleiste unten */
    bbox(L-0.1,0.18,0.04,std(0x8a7f6a,{roughness:0.9}),-L/2,0.1,s*(W/2-0.03),g,false);
    /* Dachkante */
    bbox(L-0.1,0.07,0.05,alu,-L/2,HH-0.05,s*(W/2-0.03),g,false);
  }
  /* Decke mit lichtdurchlaessigem Dachband */
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(L,W),std(0xf0ece2,{roughness:0.9,side:THREE.DoubleSide}));
  ceil.rotation.x=Math.PI/2; ceil.position.set(-L/2,HH,0); g.add(ceil);
  const dach=new THREE.Mesh(new THREE.PlaneGeometry(L-0.4,W*0.5),
    new THREE.MeshBasicMaterial({color:0xfbf7ec,toneMapped:false}));
  dach.rotation.x=Math.PI/2; dach.position.set(-L/2,HH-0.012,0); g.add(dach);
  const led=new THREE.MeshBasicMaterial({color:0xfff6e2,toneMapped:false});
  for(const s of [-1,1]) bbox(L-0.8,0.03,0.07,led,-L/2,HH-0.07,s*(W/2-0.22),g,false);
  LR_LAMPE[0].position.set(g.position.x-L*0.45,HH-0.3,g.position.z); LR_LAMPE[0].intensity=0.85;
  LR_LAMPE[1].position.set(g.position.x-L*0.85,HH-0.3,g.position.z); LR_LAMPE[1].intensity=0.6;
  /* Stirnwand mit Lieferantenschrift */
  const fm=new THREE.MeshStandardMaterial({map:liveryTex(name,col,true),roughness:0.78});
  const front=new THREE.Mesh(new THREE.PlaneGeometry(W,HH),fm);
  front.rotation.y=Math.PI/2; front.position.set(-L+0.02,HH/2,0); g.add(front);
  for(const s of [-1,1]) bbox(0.05,HH,0.07,alu,-L+0.05,HH/2,s*(W/2-0.07),g,false);
  /* Heck: Kantenschutz innen, Rahmen aussen gegen die Torlaibung */
  for(const s of [-1,1]) bbox(0.09,HH,0.09,alu,-0.05,HH/2,s*(W/2-0.05),g,false);
  const rah=std(0x2f343c,{roughness:0.8});
  for(const s of [-1,1]) bbox(0.14,HH+0.34,0.28,rah,-0.07,HH/2,s*(W/2+0.13),g,false);
  bbox(0.14,0.28,W+0.54,rah,-0.07,HH+0.14,0,g,false);
  bbox(0.14,0.09,W,std(0x6a7078,{metalness:0.5}),-0.04,0.05,0,g,false);
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
    const m=pk
      ? new THREE.Mesh(new THREE.BoxGeometry(M[0],M[1],M[2]),regalPaketMat())
      : new THREE.Mesh(kartonGeo,kartonMat[c.type]);
    m.position.set(s.x,pk?M[1]/2+0.02+Math.floor(i/16)*0.42:s.y,s.z);
    m.rotation.y=rand(-0.07,0.07);
    if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
    m.userData={kind:'tbox',ref:c};
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
function makeBruecke(){
  /* Scharnier sitzt an der Heckkante des LKW, die Platte reicht ins
     Lager hinein. Ein Drehen um z klappt sie hoch wie eine echte
     Ladebordwand. */
  const g=new THREE.Group(); g.position.set(BRUECKE_X,0.035,LR.z);
  const plate=tex(128,128,(c,W,H)=>{ c.fillStyle='#8f959e'; c.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=22) for(let x=0;x<W;x+=22){ c.save(); c.translate(x+11,y+11); c.rotate((x/22+y/22)%2?0.7:-0.7);
      c.fillStyle='#a8aeb8'; c.fillRect(-8,-2.5,16,5); c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(-8,2.5,16,1.5); c.restore(); }
    for(let i=0;i<400;i++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.07})`; c.fillRect(Math.random()*W,Math.random()*H,3,3); } });
  const pl=new THREE.MeshStandardMaterial({map:plate,metalness:0.6,roughness:0.45});
  bbox(1.5,0.05,3.1,pl,0.8,0,0,g,false);
  const lip=bbox(0.34,0.04,3.1,pl,-0.02,0,0,g,false); lip.rotation.z=0.05;
  for(const dz of [-1.5,1.5]) bbox(1.5,0.02,0.1,std(0xf2c230),0.8,0.035,dz,g,false);
  /* Scharniere zum Laderaum hin */
  const hg=std(0x6f757e,{metalness:0.7,roughness:0.4});
  for(const dz of [-1.1,0,1.1]) bbox(0.12,0.08,0.34,hg,0.08,0.015,dz,g,false);
  scene.add(g);
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
    truckDriver=makePerson({kopf:'mitte_m2',outfit:{id:'fahrer',oben:'warnweste',unten:'cargo',schuh:'boot',obenF:0xf28a1c,untenF:0x2a3048,schuhF:0x2a2420}});
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
/* Flaches Paket fuer ein Regal: Bretter und Profile, in Folie */
let _rpGeo=null,_rpMat=null;
function regalPaketGeo(){ if(!_rpGeo) _rpGeo=new THREE.BoxGeometry(0.34,0.24,1.18); return _rpGeo; }
function regalPaketMat(){
  if(_rpMat) return _rpMat;
  const t=tex(256,128,(c,W,H)=>{
    c.fillStyle='#b9bec6'; c.fillRect(0,0,W,H);
    for(let i=0;i<900;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.16})`;
      c.fillRect(Math.random()*W,Math.random()*H,rand(4,22),1); }
    /* Umreifungsbaender */
    c.fillStyle='#2b3040'; c.fillRect(W*0.22,0,8,H); c.fillRect(W*0.72,0,8,H);
    /* Etikett */
    c.fillStyle='#f4f2ea'; c.fillRect(W*0.34,H*0.28,W*0.32,H*0.44);
    c.strokeStyle='#8f959e'; c.lineWidth=2; c.strokeRect(W*0.34,H*0.28,W*0.32,H*0.44);
    c.fillStyle='#1b2340'; c.font=BUN(15); c.textAlign='center'; c.textBaseline='middle';
    c.fillText('REGALBAU',W*0.5,H*0.42);
    c.fillStyle='#5a6070'; c.font=BAR(13); c.fillText('Stegemann',W*0.5,H*0.58);
  });
  _rpMat=new THREE.MeshStandardMaterial({map:t,roughness:0.62});
  return _rpMat;
}
function takeBox(item){ statAdd('kartons',1);

  if(!truck||truck.state!=='docked') return;
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
  while(truck.cargo.length&&(truck.cargo[0].regal||truck.cargo[0].einbau)){ regalAusladen(truck.cargo.shift()); fillCargo(); }
  if(!truck.cargo.length) return null;
  const c=truck.cargo.shift(); fillCargo();
  return {type:c.type,count:P[c.type].box,q:c.q||1};
}
function dumpTruck(){
  if(!truck) return;
  const n=truck.cargo.length;
  truck.cargo.forEach(c=>{ if(c.regal||c.einbau) regalAusladen(c); else spawnFloorBox(c.type,P[c.type].box,null,c.q||1); });
  truck.cargo.length=0;
  if(n) toast(`Der Fahrer hat ${n} Karton${n>1?'s':''} im Lager abgestellt.`);
  if(truck.state==='docked') leaveTruck(); else removeTruck();
}
function updateTruck(dt){
  updateDoor(dt);
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

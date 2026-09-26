/* =========================================================
   Park hinter dem Testfeld (Tom, 26.09.: "diese graue Flaeche - ein
   paar Baeume, ein kleiner See, dass da ein bisschen Natur und Leben
   reinkommt. Dann sieht das Feuerwerk auch noch mal geiler aus").
   Zwischen Testfeldzaun und Stadt lag nur Asphalt. Jetzt: Winterwiese
   mit Kieswegen, ein See mit Steg, Schilf und Enten, kahle Laubbaeume
   und verschneite Tannen, Bueschen, Baenke, Laternen und ein paar
   Spaziergaenger auf dem Rundweg.
   Betreten kann man den Park nicht - er liegt hinter dem Zaun und ist
   Kulisse fuer das Testfeld.
   ========================================================= */
const PARK={x0:-19, x1:40, z0:-53, z1:-30.5};
const SEE={x:13, z:-42, rx:8.5, rz:4.6};
/* Rundweg: Ellipse um den See */
const RUNDWEG={x:13, z:-42, rx:13.5, rz:8.2};
let _wasserM=null, PARK_TANNEN=0;
const parkEnten=[], parkLeute=[];
function parkRauschen(i){ const x=Math.sin(i*12.9898)*43758.5453; return x-Math.floor(x); }
function seeRand(a){ return 1+0.1*Math.sin(a*3+0.7)+0.06*Math.sin(a*5+2.1); }
function buildPark(){
  const P0=PARK, W=2048, H=Math.round(2048*(P0.z1-P0.z0)/(P0.x1-P0.x0));
  const X=x=>(x-P0.x0)/(P0.x1-P0.x0)*W, Z=z=>(z-P0.z0)/(P0.z1-P0.z0)*H, M=W/(P0.x1-P0.x0);
  /* --- Boden: Winterwiese, Kieswege, Schneereste --- */
  const t=tex(W,H,(g)=>{
    g.fillStyle='#56663f'; g.fillRect(0,0,W,H);
    for(let i=0;i<26000;i++){ const v=Math.random();
      g.fillStyle=v<0.5?`rgba(40,52,28,${Math.random()*0.35})`:`rgba(150,160,110,${Math.random()*0.18})`;
      g.fillRect(Math.random()*W,Math.random()*H,rand(1,3),rand(2,5)); }
    /* Kiesweg rund um den See und ein Querweg */
    g.lineCap='round'; g.strokeStyle='#b8ab92'; g.lineWidth=2.2*M;
    g.beginPath(); g.ellipse(X(RUNDWEG.x),Z(RUNDWEG.z),RUNDWEG.rx*M,RUNDWEG.rz*M,0,0,Math.PI*2); g.stroke();
    g.beginPath(); g.moveTo(X(P0.x0),Z(-33)); g.quadraticCurveTo(X(-4),Z(-36),X(RUNDWEG.x-RUNDWEG.rx),Z(RUNDWEG.z)); g.stroke();
    g.beginPath(); g.moveTo(X(RUNDWEG.x+RUNDWEG.rx),Z(RUNDWEG.z)); g.quadraticCurveTo(X(34),Z(-47),X(P0.x1),Z(-51)); g.stroke();
    for(let i=0;i<9000;i++){ const a=Math.random()*Math.PI*2, rr=1+rand(-0.07,0.07);
      g.fillStyle=`rgba(${Math.random()<0.5?90:230},${Math.random()<0.5?80:220},${Math.random()<0.5?60:200},.35)`;
      g.fillRect(X(RUNDWEG.x)+Math.cos(a)*RUNDWEG.rx*M*rr,Z(RUNDWEG.z)+Math.sin(a)*RUNDWEG.rz*M*rr,2,2); }
    /* Schneereste im Schatten und am Wegrand */
    for(let i=0;i<60;i++){ const x=Math.random()*W, y=Math.random()*H, r=rand(0.6,2.8)*M;
      const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(236,240,246,.75)'); gr.addColorStop(1,'rgba(236,240,246,0)');
      g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,r,r*rand(0.5,0.9),Math.random()*3,0,Math.PI*2); g.fill(); }
    /* Uferstreifen: feuchte dunkle Erde */
    g.fillStyle='#3a3a2a'; g.beginPath();
    for(let k=0;k<=64;k++){ const a=k/64*Math.PI*2, f=seeRand(a)*1.12;
      const x=X(SEE.x+Math.cos(a)*SEE.rx*f), y=Z(SEE.z+Math.sin(a)*SEE.rz*f); k?g.lineTo(x,y):g.moveTo(x,y); } g.fill();
  });
  t.anisotropy=8;
  const boden=flat(P0.x1-P0.x0,P0.z1-P0.z0,new THREE.MeshStandardMaterial({map:t,roughness:0.95}),(P0.x0+P0.x1)/2,0.03,(P0.z0+P0.z1)/2);
  boden.receiveShadow=true;
  /* --- See: unregelmaessige Wasserflaeche, spiegelt den Himmel --- */
  { const sh=new THREE.Shape();
    for(let k=0;k<=72;k++){ const a=k/72*Math.PI*2, f=seeRand(a), x=Math.cos(a)*SEE.rx*f, z=Math.sin(a)*SEE.rz*f;
      k?sh.lineTo(x,-z):sh.moveTo(x,-z); }
    const env=typeof autoUmgebung==='function'?autoUmgebung():null;
    _wasserM=new THREE.MeshStandardMaterial({color:LIN(0x2c4650),roughness:0.06,metalness:0.55,envMap:env,envMapIntensity:0.9});
    const w=new THREE.Mesh(new THREE.ShapeGeometry(sh,48),_wasserM);
    w.rotation.x=-Math.PI/2; w.position.set(SEE.x,0.06,SEE.z); scene.add(w);
    /* Ufersteine, Schilf, Steg */
    const T=[];
    for(let k=0;k<70;k++){ const a=k/70*Math.PI*2+rand(-0.03,0.03), f=seeRand(a)*rand(1.0,1.06), r=rand(0.12,0.3);
      T.push({geo:new THREE.DodecahedronGeometry(r,0),m:tm(SEE.x+Math.cos(a)*SEE.rx*f,0.05,SEE.z+Math.sin(a)*SEE.rz*f,rand(0,3),rand(0,3),0,1,0.6,1),color:pick([0x6b6a66,0x7d7a72,0x57585a])}); }
    for(const a0 of [0.4,2.2,3.6,5.1]) for(let k=0;k<26;k++){ const a=a0+rand(-0.25,0.25), f=seeRand(a)*rand(0.94,1.02);
      const h=rand(0.7,1.5), x=SEE.x+Math.cos(a)*SEE.rx*f, z=SEE.z+Math.sin(a)*SEE.rz*f;
      T.push({geo:new THREE.CylinderGeometry(0.008,0.014,h,4),m:tm(x,h/2,z,rand(-0.15,0.15),0,rand(-0.15,0.15)),color:pick([0x8a7a52,0x9c8a5c,0x6e6a40])});
      if(k%4===0) T.push({geo:new THREE.CylinderGeometry(0.03,0.03,0.14,6),m:tm(x,h,z),color:0x4a3624}); }
    /* Steg aus Holz am Nordufer */
    const sx=SEE.x-2, sz=SEE.z-SEE.rz*0.95;
    for(let k=0;k<9;k++) T.push({geo:new THREE.BoxGeometry(1.4,0.06,0.28),m:tm(sx,0.32,sz+0.5-k*0.32),color:k%2?0x7a5c3e:0x6e5236});
    for(const dx of [-0.62,0.62]) for(const dz of [0.4,-1.2,-2.2]) T.push({geo:new THREE.CylinderGeometry(0.06,0.06,0.6,6),m:tm(sx+dx,0.1,sz+dz),color:0x4a3a2a});
    for(let k=0;k<9;k++) T.push({geo:new THREE.BoxGeometry(1.4,0.03,0.28),m:tm(sx,0.36,sz+0.5-k*0.32),color:0xe8ecf2});
    stadtAddPark(new THREE.Mesh(merge(T),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9})));
  }
  /* --- Baeume: kahle Laubbaeume und verschneite Tannen --- */
  const laub=[[-14,-34],[-9,-49],[1,-33],[4,-51],[27,-33],[31,-50],[37,-38],[-3,-44],[22,-52]];
  laub.forEach(([x,z],i)=>{ if(typeof makeBaum!=='function') return; const b=makeBaum(); b.position.set(x,0,z); b.scale.setScalar(1.1+parkRauschen(i)*0.5); b.rotation.y=parkRauschen(i+7)*6; b.userData.baum=true; b.userData.park=true; scene.add(b); });
  const T=[];
  const tanne=(x,z,h)=>{ T.push({geo:new THREE.CylinderGeometry(0.12,0.18,h*0.25,6),m:tm(x,h*0.125,z),color:0x4a3624});
    for(let k=0;k<4;k++){ const r=h*(0.36-k*0.075), y=h*(0.2+k*0.19), hh=h*0.34;
      T.push({geo:new THREE.ConeGeometry(r,hh,9),m:tm(x,y+hh/2,z),color:k%2?0x2c4a33:0x264230});
      T.push({geo:new THREE.ConeGeometry(r*0.82,hh*0.3,9),m:tm(x,y+hh*0.82,z),color:0xe6ebf2}); } };
  [[-17,-40],[-16,-51],[-11,-38],[-6,-52],[6,-36],[19,-31.5],[33,-44],[38,-52],[39,-32],[-1,-50],[25,-49],[-18,-46]]
    .forEach(([x,z],i)=>{ tanne(x,z,4+parkRauschen(i+3)*3.5); PARK_TANNEN++; });
  /* Buesche mit Schneehauben */
  [[-8,-40],[0,-39],[26,-44],[29,-36],[5,-47],[20,-49],[-13,-45],[35,-47]].forEach(([x,z],i)=>{
    for(let k=0;k<3;k++){ const r=rand(0.5,0.8), dx=rand(-0.6,0.6), dz=rand(-0.5,0.5);
      T.push({geo:new THREE.SphereGeometry(r,9,7),m:tm(x+dx,r*0.7,z+dz,0,0,0,1,0.8,1),color:pick([0x33502f,0x3c5a36])});
      T.push({geo:new THREE.SphereGeometry(r*0.8,9,5,0,Math.PI*2,0,Math.PI*0.35),m:tm(x+dx,r*0.9,z+dz),color:0xe8edf3}); } });
  /* Baenke am Weg, mit Blick auf den See */
  [[0.6,1],[2.3,1],[4.1,1]].forEach(([a])=>{ const x=RUNDWEG.x+Math.cos(a)*(RUNDWEG.rx-1.6), z=RUNDWEG.z+Math.sin(a)*(RUNDWEG.rz-1.6), ry=Math.atan2(SEE.x-x,SEE.z-z);
    const B=(w,h,d,lx,ly,lz,c)=>{ const m=new THREE.Matrix4().makeRotationY(ry); m.setPosition(x,0,z); const o=tm(lx,ly,lz); T.push({geo:new THREE.BoxGeometry(w,h,d),m:m.multiply(o),color:c}); };
    for(let k=0;k<3;k++) B(1.6,0.05,0.12,0,0.45,-0.15+k*0.15,0x7a5a3a);
    for(let k=0;k<2;k++) B(1.6,0.1,0.04,0,0.62+k*0.14,-0.24,0x7a5a3a);
    for(const s of [-0.7,0.7]){ B(0.06,0.45,0.5,s,0.22,-0.05,0x2a2e36); B(0.06,0.4,0.06,s,0.62,-0.25,0x2a2e36); }
    B(1.55,0.03,0.4,0,0.49,-0.02,0xe8ecf2); });
  /* Schneemann */
  { const x=-4, z=-38;
    for(const [r,y] of [[0.5,0.45],[0.36,1.1],[0.25,1.55]]) T.push({geo:new THREE.SphereGeometry(r,12,9),m:tm(x,y,z),color:0xf2f5f8});
    T.push({geo:new THREE.ConeGeometry(0.05,0.25,8),m:tm(x,1.55,z+0.3,Math.PI/2,0,0),color:0xe07a2a});
    T.push({geo:new THREE.CylinderGeometry(0.2,0.2,0.28,12),m:tm(x,1.9,z),color:0x1e2228});
    T.push({geo:new THREE.CylinderGeometry(0.3,0.3,0.03,12),m:tm(x,1.77,z),color:0x1e2228});
    T.push({geo:new THREE.TorusGeometry(0.27,0.05,6,14),m:tm(x,1.33,z,Math.PI/2,0,0),color:0xc8322a}); }
  stadtAddPark(new THREE.Mesh(merge(T),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85})));
  /* --- Laternen: warmes Licht am Abend --- */
  { const L=[], G=[];
    for(let k=0;k<6;k++){ const a=k/6*Math.PI*2+0.3, x=RUNDWEG.x+Math.cos(a)*(RUNDWEG.rx+1.4), z=RUNDWEG.z+Math.sin(a)*(RUNDWEG.rz+1.4);
      G.push({geo:new THREE.CylinderGeometry(0.05,0.08,3.2,8),m:tm(x,1.6,z),color:0x23272e});
      G.push({geo:new THREE.CylinderGeometry(0.2,0.14,0.08,8),m:tm(x,3.62,z),color:0x23272e});
      G.push({geo:new THREE.CylinderGeometry(0.03,0.2,0.2,8),m:tm(x,3.74,z),color:0x23272e});
      L.push({geo:new THREE.CylinderGeometry(0.15,0.11,0.36,8),m:tm(x,3.4,z)}); }
    stadtAddPark(new THREE.Mesh(merge(G),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.5,metalness:0.5})));
    const lm=new THREE.MeshStandardMaterial({color:LIN(0xf2e6c8),emissive:LIN(0xffcf8a),emissiveIntensity:0,roughness:0.3}); lampMats.push(lm);
    stadtAddPark(new THREE.Mesh(merge(L.map(l=>Object.assign(l,{color:0xffffff}))),lm)); }
  /* --- Leben: Enten auf dem See, Spaziergaenger auf dem Rundweg --- */
  for(let i=0;i<6;i++){ const g=new THREE.Group(), erpel=i%2===0;
    const E=[];
    E.push({geo:new THREE.SphereGeometry(0.16,10,8),m:tm(0,0.1,0,0,0,0,1,0.7,1.5),color:erpel?0x8a8680:0x7a5a3a});
    E.push({geo:new THREE.SphereGeometry(0.08,10,8),m:tm(0,0.26,0.2),color:erpel?0x1f6b3a:0x6a4a2a});
    E.push({geo:new THREE.ConeGeometry(0.03,0.1,6),m:tm(0,0.25,0.3,Math.PI/2,0,0),color:0xe0a030});
    E.push({geo:new THREE.SphereGeometry(0.1,8,6),m:tm(0,0.14,-0.18,0,0,0,1,0.6,1),color:erpel?0x3a3a3a:0x5a4230});
    g.add(new THREE.Mesh(merge(E),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.7})));
    g.position.set(SEE.x,0.06,SEE.z); scene.add(g);
    parkEnten.push({g,a:rand(0,Math.PI*2),r:rand(0.25,0.8),sp:rand(0.05,0.12)*(i%3?1:-1),ph:rand(0,6)}); }
  if(typeof makePerson==='function') for(let i=0;i<(COARSE?2:4);i++){
    const g=makePerson({}); scene.add(g);
    parkLeute.push({g,a:i/4*Math.PI*2+rand(-0.3,0.3),sp:rand(0.08,0.12)*(i%2?1:-1)}); }
  updatePark(0);
}
/* Parkteile sind Kulisse, keine Stadt: eigener Marker */
function stadtAddPark(m){ m.userData.park=true; if(HIQ){ m.castShadow=true; m.receiveShadow=true; } scene.add(m); return m; }
function updatePark(dt){
  for(const e of parkEnten){ e.a+=e.sp*dt; e.ph+=dt;
    const f=seeRand(e.a)*e.r, x=SEE.x+Math.cos(e.a)*SEE.rx*f, z=SEE.z+Math.sin(e.a)*SEE.rz*f;
    e.g.position.set(x,0.06+Math.sin(e.ph*2)*0.01,z);
    e.g.rotation.y=Math.atan2(-Math.sin(e.a)*Math.sign(e.sp)*SEE.rx,Math.cos(e.a)*Math.sign(e.sp)*SEE.rz); }
  for(const p of parkLeute){ p.a+=p.sp*dt;
    const x=RUNDWEG.x+Math.cos(p.a)*RUNDWEG.rx, z=RUNDWEG.z+Math.sin(p.a)*RUNDWEG.rz;
    const vx=-Math.sin(p.a)*RUNDWEG.rx*p.sp, vz=Math.cos(p.a)*RUNDWEG.rz*p.sp;
    p.g.position.set(x,0.03,z); p.g.rotation.y=Math.atan2(vx,vz);
    if(dt&&typeof animPerson==='function') animPerson(p.g,true,dt,1.0); }
}

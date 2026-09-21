
/* =========================================================
   Testfeld: Metalltisch und Abschussröhren, dazu das Zündpult
   ========================================================= */
const PULT_RY=1.121+Math.PI;
const stations={}; let pultHit=null, pultTex=null, pultLamp=null;
/* Hinweisschild auf zwei Rohrpfosten, damit es nicht in der Luft haengt */
function schild(x,y,z,w,h,mat,steelM){
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  const px=w/2-0.06;
  for(const sx of [-px,px]){
    const p2=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,y+h/2,10),steelM);
    p2.position.set(sx,(y+h/2)/2,0); if(HIQ) p2.castShadow=true; g.add(p2);
    bbox(0.11,0.02,0.11,steelM,sx,0.012,0,g,false);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),steelM);
    cap.position.set(sx,y+h/2,0); g.add(cap);
  }
  /* Rueckblech, damit das Schild Tiefe hat */
  bbox(w+0.05,h+0.05,0.025,std(0x4a515c,{metalness:0.5,roughness:0.5}),0,y,-0.016,g,false);
  plane(w,h,mat,0,y,0.002,0,g);
  plane(w,h,mat,0,y,-0.032,Math.PI,g);
  return g;
}

const STATION_POS={
  tisch :{x:-0.3,z:-9.6, ry:0,name:'Zündtisch',cap:6},
  rampe :{x:-0.3,z:-12.8,ry:0,name:'Abschussröhren',cap:6},
  moerser:{x:4.6,z:-12.8,ry:0,name:'Mörserbatterie',cap:3}
};
function stationOf(t){
  const p=P[t]; if(!p||!p.cat) return null;
  const sh=p.shape;
  if(sh==='shell') return 'moerser';
  return (sh==='rocketset'||sh==='candle')?'rampe':'tisch';
}
/* Hochauflösender Hofbelag */
function yardGroundTex(){
  const t=tex(1024,1024,(g,W,H)=>{
    g.fillStyle='#8e9198'; g.fillRect(0,0,W,H);
    // Zuschlagkörner
    for(let i=0;i<52000;i++){
      const v=Math.random();
      g.fillStyle=`rgba(${v<0.5?20:240},${v<0.5?20:240},${v<0.5?24:236},${Math.random()*0.10})`;
      g.fillRect(Math.random()*W,Math.random()*H,rand(1,3),rand(1,3));
    }
    for(let i=0;i<900;i++){
      g.fillStyle=`rgba(${60+Math.random()*90|0},${58+Math.random()*88|0},${56+Math.random()*84|0},${rand(0.15,0.5)})`;
      g.save(); g.translate(Math.random()*W,Math.random()*H); g.rotate(Math.random()*3);
      g.fillRect(0,0,rand(3,9),rand(2,6)); g.restore();
    }
    // Plattenfugen
    g.strokeStyle='rgba(30,32,36,.5)'; g.lineWidth=5;
    for(let k=0;k<=2;k++){ g.beginPath(); g.moveTo(k*W/2,0); g.lineTo(k*W/2,H); g.stroke();
      g.beginPath(); g.moveTo(0,k*H/2); g.lineTo(W,k*H/2); g.stroke(); }
    g.strokeStyle='rgba(215,218,224,.3)'; g.lineWidth=2;
    for(let k=0;k<=2;k++){ g.beginPath(); g.moveTo(k*W/2+4,0); g.lineTo(k*W/2+4,H); g.stroke();
      g.beginPath(); g.moveTo(0,k*H/2+4); g.lineTo(W,k*H/2+4); g.stroke(); }
    // Risse und Flecken
    g.strokeStyle='rgba(26,28,32,.42)';
    for(let i=0;i<16;i++){ g.lineWidth=rand(1,3.5);
      let x=Math.random()*W, y=Math.random()*H; g.beginPath(); g.moveTo(x,y);
      for(let k=0;k<8;k++){ x+=rand(-90,90); y+=rand(-90,90); g.lineTo(x,y); } g.stroke(); }
    for(let i=0;i<26;i++){ g.fillStyle=`rgba(40,40,44,${rand(0.04,0.13)})`; g.beginPath();
      g.ellipse(Math.random()*W,Math.random()*H,rand(30,130),rand(24,100),Math.random()*3,0,Math.PI*2); g.fill(); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2.2,2);
  t.anisotropy=8;
  return t;
}
function buildYard(){
  const steel=std(0x9aa1ab,{metalness:0.72,roughness:0.3});
  const steelDark=std(0x5d646e,{metalness:0.65,roughness:0.42});
  const rubber=std(0x1c1f26,{roughness:0.95});
  /* Perforiertes Tischblech */
  const perf=tex(512,512,(g,W,H)=>{
    g.fillStyle='#aab0b9'; g.fillRect(0,0,W,H);
    for(let i=0;i<9000;i++){ const v=Math.random();
      g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.06})`;
      g.fillRect(Math.random()*W,Math.random()*H,2,2); }
    for(let y=14;y<H-8;y+=26) for(let x=14+((y/26|0)%2)*13;x<W-8;x+=26){
      g.fillStyle='#2f343c'; g.beginPath(); g.arc(x,y,6.5,0,Math.PI*2); g.fill();
      g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.arc(x-1.6,y-1.8,6.5,Math.PI*0.9,Math.PI*1.7); g.fill();
    }
    for(let i=0;i<24;i++){ g.fillStyle=`rgba(24,20,16,${rand(0.1,0.4)})`; g.beginPath();
      g.ellipse(Math.random()*W,Math.random()*H,rand(10,44),rand(8,30),Math.random()*3,0,Math.PI*2); g.fill(); }
    for(let i=0;i<70;i++){ g.strokeStyle=`rgba(255,255,255,${rand(0.05,0.2)})`; g.lineWidth=rand(0.6,1.8);
      const x=Math.random()*W, y=Math.random()*H; g.beginPath(); g.moveTo(x,y); g.lineTo(x+rand(-40,40),y+rand(-8,8)); g.stroke(); }
  });
  perf.wrapS=perf.wrapT=THREE.RepeatWrapping; perf.repeat.set(3,1.4); perf.anisotropy=8;
  const perfM=new THREE.MeshStandardMaterial({map:perf,metalness:0.66,roughness:0.42});

  /* --- Zündtisch aus Metall --- */
  {
    const s=STATION_POS.tisch, g=new THREE.Group(); g.position.set(s.x,0,s.z); scene.add(g);
    bbox(2.5,0.04,1.05,perfM,0,0.9,0,g);
    bbox(2.56,0.05,0.05,steelDark,0,0.925,0.52,g); bbox(2.56,0.05,0.05,steelDark,0,0.925,-0.52,g);
    bbox(0.05,0.05,1.07,steelDark,1.27,0.925,0,g); bbox(0.05,0.05,1.07,steelDark,-1.27,0.925,0,g);
    for(const [x,z] of [[-1.14,-0.42],[1.14,-0.42],[-1.14,0.42],[1.14,0.42]]){
      bbox(0.07,0.88,0.07,steelDark,x,0.44,z,g);
      bbox(0.12,0.025,0.12,rubber,x,0.012,z,g,false);
    }
    bbox(2.3,0.03,0.16,steelDark,0,0.3,0.42,g,false);
    bbox(2.3,0.03,0.16,steelDark,0,0.3,-0.42,g,false);
    bbox(0.06,0.06,0.9,steelDark,1.1,0.3,0,g,false);
    bbox(0.06,0.06,0.9,steelDark,-1.1,0.3,0,g,false);
    const hit=bbox(2.6,0.95,1.15,hitM,0,0.62,0,g,false);
    stations.tisch={id:'tisch',g,items:[],cap:s.cap,hit};
    hit.userData={kind:'station',ref:stations.tisch};
    col(s.x-1.3,s.x+1.3,s.z-0.58,s.z+0.58);
    schild(s.x,1.34,s.z-0.72,0.9,0.2,new THREE.MeshStandardMaterial({map:tex(540,120,(g2,W,H)=>{
      g2.fillStyle='#ffd23f'; g2.fillRect(0,0,W,H);
      g2.fillStyle='#0e1226'; g2.lineWidth=6; g2.strokeStyle='#0e1226'; g2.strokeRect(4,4,W-8,H-8);
      g2.font=BUN(62); g2.textAlign='center'; g2.textBaseline='middle';
      g2.fillText('ZÜNDTISCH',W/2,H/2+3); })}),steelDark);
  }
  /* --- Abschussröhren --- */
  {
    const s=STATION_POS.rampe, g=new THREE.Group(); g.position.set(s.x,0,s.z); scene.add(g);
    bbox(2.5,0.09,0.75,steelDark,0,0.045,0,g);
    for(const x of [-1.15,1.15]){ bbox(0.08,0.06,0.8,steelDark,x,0.1,0,g,false); }
    bbox(2.4,0.06,0.06,steelDark,0,1.05,-0.26,g,false);
    bbox(2.4,0.06,0.06,steelDark,0,0.62,0.26,g,false);
    for(const x of [-1.2,1.2]){
      bbox(0.07,1.1,0.07,steelDark,x,0.6,-0.26,g);
      const d=bbox(0.06,0.78,0.06,steelDark,x,0.42,0.02,g,false); d.rotation.x=-0.62;
    }
    const tubeM=std(0x3e4652,{metalness:0.72,roughness:0.34});
    for(let i=0;i<6;i++){
      const x=-1.0+i*0.4;
      const t=new THREE.Mesh(new THREE.CylinderGeometry(0.062,0.062,1.25,20,1,true),tubeM);
      t.material.side=THREE.DoubleSide; t.position.set(x,0.72,-0.02); t.rotation.x=-0.1;
      if(HIQ) t.castShadow=true; g.add(t);
      const inner=new THREE.Mesh(new THREE.CylinderGeometry(0.056,0.056,1.2,16,1,true),std(0x14161b,{roughness:0.9,side:THREE.DoubleSide}));
      inner.position.copy(t.position); inner.rotation.copy(t.rotation); g.add(inner);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(0.064,0.013,8,18),steel);
      ring.rotation.x=Math.PI/2-0.1; ring.position.set(x,1.33,-0.08); g.add(ring);
      const ring2=new THREE.Mesh(new THREE.TorusGeometry(0.066,0.015,8,18),steelDark);
      ring2.rotation.x=Math.PI/2-0.1; ring2.position.set(x,0.86,0.01); g.add(ring2);
      bbox(0.17,0.025,0.17,steelDark,x,0.105,0.04,g,false);
    }
    const hit=bbox(2.6,1.5,0.95,hitM,0,0.78,0,g,false);
    stations.rampe={id:'rampe',g,items:[],cap:s.cap,hit};
    hit.userData={kind:'station',ref:stations.rampe};
    col(s.x-1.3,s.x+1.3,s.z-0.46,s.z+0.46);
    schild(s.x,1.62,s.z-0.62,1.15,0.2,new THREE.MeshStandardMaterial({map:tex(690,120,(g2,W,H)=>{
      g2.fillStyle='#e63b2e'; g2.fillRect(0,0,W,H);
      g2.lineWidth=6; g2.strokeStyle='#ffffff'; g2.strokeRect(4,4,W-8,H-8);
      g2.fillStyle='#fff'; g2.font=BUN(56); g2.textAlign='center'; g2.textBaseline='middle';
      g2.fillText('ABSCHUSSRÖHREN',W/2,H/2+3); })}),steelDark);
  }
  /* --- Moerserbatterie fuer Kugelbomben ---
     Drei schwere Stahlrohre in einem Holzrahmen, mit Sandsaecken
     beschwert. Hier kommen die Kugelbomben hinein. */
  {
    const s=STATION_POS.moerser, g=new THREE.Group(); g.position.set(s.x,0,s.z); scene.add(g);
    const holz=(()=>{ const t=tex(256,256,(c,W,H)=>{
      c.fillStyle='#6b4f32'; c.fillRect(0,0,W,H);
      for(let i=0;i<40;i++){ c.strokeStyle=`rgba(${40+Math.random()*60|0},${28+Math.random()*40|0},16,${rand(0.12,0.4)})`;
        c.lineWidth=rand(0.6,2.4); c.beginPath(); c.moveTo(0,Math.random()*H); c.bezierCurveTo(W*0.3,Math.random()*H,W*0.6,Math.random()*H,W,Math.random()*H); c.stroke(); }
      for(let i=0;i<1600;i++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.06})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
      for(let y=0;y<H;y+=64){ c.fillStyle='rgba(30,20,10,.35)'; c.fillRect(0,y,W,3); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,1);
      return new THREE.MeshStandardMaterial({map:t,roughness:0.94}); })();
    const rohrM=std(0x2f353f,{metalness:0.78,roughness:0.3});
    const sand=std(0x9a8f74,{roughness:0.98});
    /* Holzrahmen als Gestell */
    bbox(2.3,0.18,1.0,holz,0,0.09,0,g);
    for(const sx of [-1.02,1.02]) bbox(0.16,0.5,0.96,holz,sx,0.34,0,g);
    for(const sz of [-0.44,0.44]) bbox(2.0,0.14,0.14,holz,0,0.5,sz,g,false);
    /* drei Rohre in aufsteigendem Kaliber */
    const kal=[[-0.72,0.115,1.30],[0,0.145,1.55],[0.78,0.185,1.85]];
    kal.forEach(([x,r,hh],i)=>{
      const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,hh,22,1,true),rohrM);
      t.material.side=THREE.DoubleSide; t.position.set(x,0.18+hh/2,0);
      if(HIQ) t.castShadow=true; g.add(t);
      const innen=new THREE.Mesh(new THREE.CylinderGeometry(r*0.9,r*0.9,hh-0.04,16,1,true),std(0x0b0c10,{roughness:1,side:THREE.DoubleSide}));
      innen.position.copy(t.position); g.add(innen);
      /* Boden im Rohr, damit man nicht hindurchsieht */
      const bo=new THREE.Mesh(new THREE.CircleGeometry(r*0.9,16),std(0x15171c,{roughness:1}));
      bo.rotation.x=-Math.PI/2; bo.position.set(x,0.2,0); g.add(bo);
      /* Muendungswulst und Verstaerkungsringe */
      const wulst=new THREE.Mesh(new THREE.TorusGeometry(r*1.03,r*0.17,8,20),std(0x454d59,{metalness:0.7,roughness:0.35}));
      wulst.rotation.x=Math.PI/2; wulst.position.set(x,0.18+hh,0); g.add(wulst);
      for(const f of [0.3,0.62]){ const rg=new THREE.Mesh(new THREE.TorusGeometry(r*1.02,r*0.1,6,18),rohrM);
        rg.rotation.x=Math.PI/2; rg.position.set(x,0.18+hh*f,0); g.add(rg); }
      /* Zuendkabel am Rohrfuss */
      const kab=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.5,6),std(0xb8322a,{roughness:0.8}));
      kab.rotation.z=1.2; kab.position.set(x+0.16,0.26,0.28); g.add(kab);
      /* Kaliberschild */
      const mm=[75,100,150][i];
      plane(0.2,0.09,new THREE.MeshStandardMaterial({roughness:0.6,map:tex(200,90,(c,W,H)=>{
        c.fillStyle='#ffd23f'; c.fillRect(0,0,W,H);
        c.fillStyle='#0e1226'; c.font=BUN(52); c.textAlign='center'; c.textBaseline='middle';
        c.fillText(mm+' mm',W/2,H/2+2); })}),x,0.62,0.5,0,g);
    });
    /* Sandsaecke rundherum */
    for(let i=0;i<7;i++){
      const a=(i/7)*Math.PI*2, r=rand(1.15,1.35);
      const sx=Math.cos(a)*r*1.05, sz=Math.sin(a)*r*0.72;
      const sb=rbox(0.42,0.16,0.26,0.07,sand,sx,0.08,sz,g);
      sb.rotation.y=a+rand(-0.3,0.3);
      if(i<4){ const sb2=rbox(0.4,0.15,0.25,0.07,sand,sx+rand(-.05,.05),0.23,sz,g); sb2.rotation.y=a+rand(-0.4,0.4); }
    }
    const hit=bbox(2.4,1.8,1.1,hitM,0,0.9,0,g,false);
    stations.moerser={id:'moerser',g,items:[],cap:s.cap,hit};
    hit.userData={kind:'station',ref:stations.moerser};
    col(s.x-1.25,s.x+1.25,s.z-0.55,s.z+0.55);
    schild(s.x,1.9,s.z-0.78,1.05,0.2,new THREE.MeshStandardMaterial({map:tex(630,120,(g2,W,H)=>{
      g2.fillStyle='#1b2340'; g2.fillRect(0,0,W,H);
      g2.lineWidth=6; g2.strokeStyle='#ffd23f'; g2.strokeRect(4,4,W-8,H-8);
      g2.fillStyle='#ffd23f'; g2.font=BUN(52); g2.textAlign='center'; g2.textBaseline='middle';
      g2.fillText('MÖRSERBATTERIE',W/2,H/2+3); })}),steelDark);
  }
  /* --- Zündpult: Stahlgehaeuse auf Rahmengestell --- */
  {
    /* Um 180 Grad gedreht gegenueber vorher: der Bediener steht auf der
       Rueckseite und blickt ueber das Pult aufs Testfeld. */
    const g=new THREE.Group(); g.position.set(5.9,0,-8.2); g.rotation.y=PULT_RY; scene.add(g);
    const korpus=std(0x2b3240,{metalness:0.42,roughness:0.44});
    const kante=std(0x9aa1ac,{metalness:0.7,roughness:0.3});
    const pulver=std(0xf2c230,{roughness:0.55});

    /* Gestell: vier Rohre, Quertraversen, Fussplatten */
    for(const sx of [-0.34,0.34]) for(const sz of [-0.2,0.2]){
      const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.92,12),steelDark);
      leg.position.set(sx,0.46,sz); if(HIQ) leg.castShadow=true; g.add(leg);
      bbox(0.13,0.022,0.13,kante,sx,0.011,sz,g,false);
      bbox(0.09,0.03,0.09,rubber,sx,0.034,sz,g,false);
    }
    for(const sz of [-0.2,0.2]) bbox(0.7,0.035,0.035,steelDark,0,0.26,sz,g,false);
    bbox(0.035,0.035,0.44,steelDark,-0.34,0.26,0,g,false);
    bbox(0.035,0.035,0.44,steelDark, 0.34,0.26,0,g,false);
    /* Diagonalen */
    for(const sz of [-0.2,0.2]){ const d=bbox(0.78,0.026,0.026,steelDark,0,0.56,sz,g,false); d.rotation.z=0.72; }
    /* Kabelkanal nach unten */
    const kab=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.5,8),std(0x1c1f26,{roughness:0.9}));
    kab.position.set(0.24,0.25,-0.18); kab.rotation.x=0.25; g.add(kab);

    /* Korpus mit abgeschraegter Bedienplatte */
    const body=rbox(0.86,0.26,0.52,0.03,korpus,0,1.02,0,g);
    bbox(0.88,0.02,0.54,kante,0,1.16,0,g,false);
    const top=rbox(0.84,0.05,0.46,0.02,korpus,0,1.16,0.01,g); top.rotation.x=-0.3;
    /* Seitengriffe */
    for(const sx of [-0.45,0.45]){
      const h1=new THREE.Mesh(new THREE.TorusGeometry(0.065,0.012,8,14,Math.PI),kante);
      h1.rotation.y=Math.PI/2; h1.rotation.z=sx>0?0:Math.PI; h1.position.set(sx,1.04,0); g.add(h1);
    }
    /* Typenschild und Warnstreifen */
    plane(0.3,0.055,new THREE.MeshStandardMaterial({map:tex(600,110,(g2,W,H)=>{
      g2.fillStyle='#161a22'; g2.fillRect(0,0,W,H);
      g2.strokeStyle='#6f7684'; g2.lineWidth=4; g2.strokeRect(5,5,W-10,H-10);
      g2.fillStyle='#c9cfd8'; g2.font=BAR(44); g2.textAlign='center'; g2.textBaseline='middle';
      g2.fillText('ZÜNDANLAGE ZA-6',W/2,H/2+2); })}),-0.24,0.98,0.262,0,g);
    for(const sx of [-0.31,0.31]) bbox(0.16,0.045,0.006,pulver,sx,0.9,0.262,g,false);

    /* Anzeige */
    pultTex=tex(960,480,()=>{});
    const rahmen=rbox(0.4,0.22,0.02,0.01,std(0x11141b,{roughness:0.5}),-0.18,1.185,0.055,g);
    rahmen.rotation.x=-0.3;
    const scr=plane(0.36,0.185,new THREE.MeshBasicMaterial({map:pultTex,toneMapped:false}),-0.18,1.2,0.065,0,g);
    scr.rotation.x=-0.3;

    /* Schlagtaster unter Bügel */
    /* Schlagtaster: Metallsockel, gewoelbte Pilzkappe mit Aufdruck */
    const sockel=new THREE.Mesh(new THREE.CylinderGeometry(0.078,0.088,0.026,HIQ?28:16),kante);
    sockel.position.set(0.22,1.172,0.044); sockel.rotation.x=-0.3; g.add(sockel);
    const kragen=new THREE.Mesh(new THREE.TorusGeometry(0.074,0.009,8,HIQ?26:14),std(0x6f757e,{metalness:0.7,roughness:0.32}));
    kragen.position.set(0.22,1.186,0.048); kragen.rotation.x=Math.PI/2-0.3; g.add(kragen);
    const btn=new THREE.Mesh(new THREE.CylinderGeometry(0.069,0.062,0.034,HIQ?30:18),std(0xb4261d,{roughness:0.34}));
    btn.position.set(0.22,1.2,0.053); btn.rotation.x=-0.3; if(HIQ) btn.castShadow=true; g.add(btn);
    /* Gewoelbte Kappe: halbe Kugel, flachgedrueckt - keine harte Scheibe mehr */
    const kappe=new THREE.Mesh(new THREE.SphereGeometry(0.069,HIQ?30:18,HIQ?14:8,0,Math.PI*2,0,Math.PI*0.5),
      new THREE.MeshStandardMaterial({roughness:0.24,metalness:0.06,
        map:tex(256,256,(c,W,H)=>{
          const gr=c.createRadialGradient(W*0.38,H*0.34,10,W/2,H/2,W*0.52);
          gr.addColorStop(0,'#ff6a5c'); gr.addColorStop(0.45,'#e0392c'); gr.addColorStop(1,'#a81f18');
          c.fillStyle=gr; c.beginPath(); c.arc(W/2,H/2,W*0.5,0,Math.PI*2); c.fill();
          c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=6;
          c.beginPath(); c.arc(W/2,H/2,W*0.44,Math.PI*0.95,Math.PI*1.75); c.stroke();
          c.fillStyle='rgba(255,255,255,.9)'; c.textAlign='center'; c.textBaseline='middle';
          c.font=BUN(36); c.fillText('ZÜNDEN',W/2,H/2+4);
          c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.arc(W/2,H*0.72,W*0.3,0,Math.PI*2); c.fill();
        })}));
    kappe.position.set(0.22,1.218,0.061); kappe.rotation.x=-0.3; kappe.scale.y=0.42; g.add(kappe);
    for(const a2 of [0.6,2.7,4.3]){
      const b2=new THREE.Mesh(new THREE.TorusGeometry(0.105,0.011,8,10,1.1),kante);
      b2.position.set(0.22,1.24,0.05); b2.rotation.set(-0.3,0,a2); g.add(b2);
    }

    /* Schluesselschalter und Meldeleuchten */
    const zyl=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.022,14),kante);
    zyl.position.set(-0.4,1.185,0.04); zyl.rotation.x=1.27; g.add(zyl);
    const key=new THREE.Mesh(new THREE.BoxGeometry(0.008,0.052,0.014),std(0xb9a05a,{metalness:0.8,roughness:0.3}));
    key.position.set(-0.4,1.2,0.055); key.rotation.x=-0.3; g.add(key);
    pultLamp=new THREE.MeshStandardMaterial({color:0x331111,emissive:LIN(0xff3b2e),emissiveIntensity:0});
    for(const [dx,m] of [[0.0,pultLamp],[0.07,std(0x1e2a1e)]]){
      const l=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.014,12),m);
      l.position.set(0.36+dx*0,1.18,0.03); l.rotation.x=1.27; g.add(l);
      break;
    }
    const lr=new THREE.Mesh(new THREE.TorusGeometry(0.024,0.005,6,14),kante);
    lr.position.set(0.36,1.183,0.032); lr.rotation.x=1.27; g.add(lr);

    const hit=bbox(0.98,1.35,0.66,hitM,0,0.75,0,g,false); hit.userData={kind:'pult'};
    pultHit=hit; col(5.42,6.38,-8.68,-7.72);
    drawPult();
  }
  /* Flutlicht */
  for(const [x,z] of [[-1.4,-7.2],[7.3,-13.6]]){
    bbox(0.12,3.4,0.12,std(0x4a4f5a,{metalness:0.5}),x,1.7,z);
    const head=bbox(0.55,0.3,0.25,std(0x2a2e38),x,3.45,z); head.rotation.x=0.4;
    const lm=new THREE.MeshStandardMaterial({color:0x222222,emissive:LIN(0xfff0d0),emissiveIntensity:0}); lampMats.push(lm);
    bbox(0.45,0.03,0.2,lm,x,3.33,z+(z<-10?0.1:-0.12),null,false);
  }
}
function drawPult(){
  if(!pultTex) return;
  const n=placedCount();
  redraw(pultTex,(g,W,H)=>{
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H); g.scale(W/320,H/160); W=320; H=160;
    g.fillStyle='#0a1420'; g.fillRect(0,0,W,H);
    g.fillStyle=n?'#8ef0a8':'#5a6472'; g.font=BUN(30); g.textAlign='left'; g.textBaseline='middle';
    g.fillText(n?'BEREIT':'LEER',14,30);
    g.font=BAR(26); g.fillStyle='#e8eef8';
    g.fillText(`${n} Stück aufgebaut`,14,72);
    const names=[]; for(const k in stations) stations[k].items.forEach(it=>{ if(names.indexOf(P[it.type].short)<0) names.push(P[it.type].short); });
    g.font=BAR(22); g.fillStyle='#8fb4e0'; fitFont(g,names.join(', ')||'Ware auf Tisch oder Röhren stellen',W-28,22,BAR);
    g.fillText(names.join(', ')||'Ware auf Tisch oder Röhren stellen',14,110);
    g.fillStyle=n?'#ffd23f':'#39405a'; g.fillRect(0,H-22,W,22);
  });
  if(pultLamp) pultLamp.emissiveIntensity=n?1.4:0;
}
function placedCount(){ let n=0; for(const k in stations) n+=stations[k].items.length; return n; }
function stationSlot(st,i){
  const p=STATION_POS[st.id];
  if(st.id==='tisch'){ const x=-0.95+i*0.38; return {x:p.x+x,y:0.93,z:p.z,ry:Math.PI}; }
  if(st.id==='moerser'){ const x=[-0.72,0,0.78][i%3]; return {x:p.x+x,y:[1.36,1.62,1.92][i%3],z:p.z,ry:rand(0,Math.PI*2)}; }
  const x=-1.0+i*0.4; return {x:p.x+x,y:1.18,z:p.z-0.08,ry:0};
}
function placeOnStation(st){
  const c=S.carrying; if(!c) return;
  const want=stationOf(c.type);
  if(!want){ toast('Damit kann man nichts zünden.','bad'); return; }
  if(want!==st.id){ toast(`${P[c.type].short} gehört auf: ${STATION_POS[want].name}.`,'bad'); return; }
  if(st.items.length>=st.cap){ toast('Die Station ist voll. Erst zünden.','bad'); return; }
  const sl=stationSlot(st,st.items.length);
  if(c.type==='gravur'){
    const m=makeEngraved(c.text||''); m.position.set(sl.x,sl.y+0.06,sl.z); m.rotation.y=sl.ry; scene.add(m);
    st.items.push({type:c.type,q:1,mesh:m,text:c.text});
  } else {
    const h=pools[c.type].add(mx(sl.x,sl.y,sl.z,sl.ry));
    st.items.push({type:c.type,q:c.q||1,h});
  }
  c.count--; S.tut.build=true; sfx.pop();
  if(c.count<=0){ S.carrying=null; toast('Karton leer.'); }
  updateCarry(); drawPult();
}
function clearStations(){ for(const k in stations){ stations[k].items.forEach(it=>{ if(it.h) it.h.pool.remove(it.h); if(it.mesh) disposeEngraved(it.mesh); }); stations[k].items.length=0; } drawPult(); }
/* Mitte zwischen Zuendtisch und Abschussroehren - dahin schaut man beim Zuenden */
function testfeldMitte(){
  const a=STATION_POS.tisch, b=STATION_POS.rampe, c=STATION_POS.moerser;
  return {x:(a.x+b.x+c.x)/3,z:(a.z+b.z+c.z)/3};
}
function firePult(){
  const n=placedCount();
  if(!n){ toast('Erst Ware auf Tisch oder Röhren stellen.'); return; }
  const m=testfeldMitte(); aimAt(m.x,m.z,0.24);
  const all=[]; for(const k in stations) stations[k].items.forEach(it=>all.push(it));
  all.sort((a,b)=>P[a.type].hype-P[b.type].hype);
  let t=0, duds=0;
  all.forEach(it=>{
    const dudChance=clamp((1-(it.q||1))*0.65,0,0.45);
    const dud=Math.random()<dudChance;
    if(dud) duds++;
    later(t,()=>{ if(dud) fizzle(it.type); else igniteType(it.type); });
    t+=Math.max(0.6,Math.min(2.4,P[it.type].hype*0.09));
  });
  const own=all.filter(x=>x.text);
  if(own.length) later(0.9,()=>toast(`„${own[0].text}" steigt auf.`,'money'));
  later(t+0.3,()=>{ if(duds) toast(duds===1?'Ein Blindgänger war dabei.':`${duds} Blindgänger. Billige Ware rächt sich.`,'bad'); });
  clearStations(); S.tut.launch=true; sfx.pop();
}
function fizzle(t){
  const v=distVol(PAD); noise(0.5,0.18*v,900);
  for(let i=0;i<22;i++){ const d=randDir(); psSmall.emit(PAD.x+rand(-1,1),0.3,PAD.z+rand(-1,1),d[0]*0.6,Math.abs(d[1])*1.2,d[2]*0.6,0.5,0.5,0.55,rand(0.8,1.6),0.5); }
}

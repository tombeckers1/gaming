
/* =========================================================
   Testfeld: Metalltisch und Abschussröhren, dazu das Zündpult
   ========================================================= */
/* Die Front des Pults zeigt nach Norden. Wer davorsteht, schaut
   ueber das Pult hinweg genau auf Zuendtisch, Roehren und Moerser -
   vorher stand es schraeg in der Gegend. */
const PULT_RY=0;
/* Modell und Kollision des Zuendpults haengen an derselben Zahl -
   beim Verschieben ist die Kollision sonst stehen geblieben und
   sperrte als unsichtbare Wand den Lagergang. */
const PULT_POS={x:1.0,z:-11.5};
const stations={}; let pultHit=null, pultTex=null, pultLamp=null;
const pultLamps=[];
/* x der Kanal-Leuchte i auf der Pultplatte: drei Gruppen mit Luecke */
const PULT_LAMP_X=i=>-0.357+i*0.046+(i<6?0:i<12?1:2)*0.035;
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

/* Die ganze Testfeldausstattung ist um 2,8 m nach Sueden gerueckt.
   Davor stand der Zuendtisch bei z -9,6 und das Pult bei z -8,2 -
   beide liegen jetzt im Lagergang, der dicht hinter der Rueckwand
   des Ladens quer ueber das Testfeld laeuft. Platz ist genug: das
   Testfeld reicht bis z -28. */
const STATION_POS={
  tisch :{x:-1.5,z:-19.0,ry:0,name:'Zündtisch',cap:6},
  rampe :{x:-1.5,z:-23.0,ry:0,name:'Abschussröhren',cap:6},
  moerser:{x:5.0,z:-23.0,ry:0,name:'Mörserbatterie',cap:3}
};
function stationOf(t){
  const p=P[t]; if(!p||!p.cat) return null;
  const sh=p.shape;
  if(sh==='shell') return 'moerser';
  return (sh==='rocketset'||sh==='candle')?'rampe':'tisch';
}
/* Kanalschild: gelbe Plakette mit der Nummer des Platzes */
const _kanalMat={};
function kanalMat(n,sub){
  const k=n+'|'+(sub||'');
  if(!_kanalMat[k]) _kanalMat[k]=new THREE.MeshStandardMaterial({roughness:0.55,map:tex(sub?220:120,90,(c,W,H)=>{
    c.fillStyle='#ffd23f'; c.fillRect(0,0,W,H);
    c.strokeStyle='#0e1226'; c.lineWidth=5; c.strokeRect(3,3,W-6,H-6);
    c.fillStyle='#0e1226'; c.textBaseline='middle';
    if(sub){ c.textAlign='left'; c.font=BUN(54); c.fillText(String(n),14,H/2+3);
      c.textAlign='right'; c.font=BAR(30); c.fillText(sub,W-12,H/2+2); }
    else { c.textAlign='center'; c.font=BUN(60); c.fillText(String(n),W/2,H/2+3); } })});
  return _kanalMat[k];
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
    /* Kanalnummern an der Vorderkante, je Platz eine */
    for(let i=0;i<s.cap;i++) plane(0.1,0.064,kanalMat(KANAL_START.tisch+i),-0.95+i*0.38,0.915,0.549,0,g);
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
    for(let i=0;i<s.cap;i++) plane(0.1,0.064,kanalMat(KANAL_START.rampe+i),-1.0+i*0.4,0.62,0.292,0,g);
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
    /* Gestell aus Stahl. Vorher stand hier ein Holzkasten mit
       Sandsaecken davor - fuer ein Geraet, aus dem Kugelbomben
       steigen, das falsche Material. */
    const riffel=(()=>{ const t=tex(256,256,(c,W,H)=>{
      c.fillStyle='#7b828d'; c.fillRect(0,0,W,H);
      for(let y=0;y<H;y+=32) for(let x=0;x<W;x+=32){
        c.save(); c.translate(x+16,y+16); c.rotate((x/32+y/32)%2?0.7:-0.7);
        c.fillStyle='#949ba6'; c.fillRect(-11,-3.5,22,7);
        c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(-11,3.5,22,2); c.restore(); }
      for(let i=0;i<900;i++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.07})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,1.5);
      return new THREE.MeshStandardMaterial({map:t,metalness:0.62,roughness:0.44}); })();
    const stahl=std(0x767d88,{metalness:0.72,roughness:0.36});
    const lack =std(0xf2c230,{metalness:0.25,roughness:0.55});
    const rohrM=std(0x2f353f,{metalness:0.78,roughness:0.3});
    /* Bodenplatte aus Riffelblech auf vier Fuessen */
    bbox(2.4,0.05,1.16,riffel,0,0.055,0,g);
    for(const sx of [-1.06,1.06]) for(const sz of [-0.46,0.46])
      bbox(0.14,0.08,0.14,stahl,sx,0.04,sz,g,false);
    /* Vierkantrahmen: Pfosten, oberer Umlauf, Diagonalen */
    for(const sx of [-1.12,1.12]){
      for(const sz of [-0.5,0.5]) bbox(0.08,0.62,0.08,stahl,sx,0.39,sz,g);
      bbox(0.07,0.07,1.0,stahl,sx,0.68,0,g,false);
      const dia=bbox(0.05,0.05,0.82,stahl,sx,0.39,0,g,false); dia.rotation.x=0.88;
    }
    for(const sz of [-0.5,0.5]) bbox(2.24,0.07,0.07,stahl,0,0.68,sz,g,false);
    /* Rohrschellen: je zwei Halbschalen mit Schraube */
    const kalX=[-0.72,0,0.78], kalR=[0.115,0.145,0.185];
    kalX.forEach((x,i)=>{ for(const y of [0.42,0.66]){
      const sch=new THREE.Mesh(new THREE.TorusGeometry(kalR[i]+0.03,0.026,6,18),stahl);
      sch.rotation.x=Math.PI/2; sch.position.set(x,y,0); g.add(sch);
      bbox(0.05,0.05,0.09,stahl,x+kalR[i]+0.05,y,0,g,false); } });
    /* Anfahrschutz aus Stahlrohr statt Sandsaecken */
    for(const sz of [-0.78,0.78]){
      bbox(2.5,0.09,0.09,lack,0,0.5,sz,g,false);
      for(const sx of [-1.2,1.2]){
        bbox(0.09,0.5,0.09,lack,sx,0.25,sz,g,false);
        bbox(0.2,0.04,0.2,stahl,sx,0.02,sz,g,false); }
    }
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
      /* Frueher hing hier ein rotes Zuendkabel je Rohr. Die drei
         Striche sahen aus wie vergessene Faeden. */
      /* Kaliberschild */
      /* Kanalnummer und Kaliber des Rohrs */
      plane(0.22,0.09,kanalMat(KANAL_START.moerser+i,[75,100,150][i]+' mm'),x,0.62,0.5,0,g);
    });
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
    const g=new THREE.Group(); g.position.set(PULT_POS.x,0,PULT_POS.z); g.rotation.y=PULT_RY; scene.add(g);
    const korpus=std(0x2b3240,{metalness:0.42,roughness:0.44});
    const kante=std(0x9aa1ac,{metalness:0.7,roughness:0.3});
    const pulver=std(0xf2c230,{roughness:0.55});

    /* Unterbau als geschlossener Schaltschrank. Vorher stand das
       Pult auf vier duennen Rohren und wirkte wie ein Campingtisch -
       fuer ein Geraet, das Feuerwerk zuendet, zu wenig. */
    const blech=std(0x353c4a,{metalness:0.5,roughness:0.44});
    const rippe=std(0x232936,{metalness:0.45,roughness:0.5});
    /* Sockel mit Fussleiste */
    bbox(1.02,0.09,0.62,rippe,0,0.045,0,g);
    bbox(1.06,0.02,0.66,kante,0,0.10,0,g,false);
    /* Schrankkorpus */
    const schrank=rbox(0.98,0.80,0.58,0.025,blech,0,0.50,0,g);
    if(HIQ) schrank.castShadow=true;
    /* Tuer mit Rahmenfuge, Griff und Schloss */
    bbox(0.78,0.66,0.012,rippe,0,0.50,0.296,g,false);
    bbox(0.74,0.62,0.012,blech,0,0.50,0.302,g,false);
    { const gr=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.17,8),kante);
      gr.position.set(0.30,0.50,0.325); g.add(gr);
      for(const dy of [-0.085,0.085]) bbox(0.03,0.03,0.05,kante,0.30,0.50+dy,0.312,g,false);
      const sl=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.012,10),kante);
      sl.rotation.x=Math.PI/2; sl.position.set(-0.28,0.50,0.308); g.add(sl); }
    /* Lueftungsschlitze an beiden Seiten */
    for(const sx of [-0.492,0.492]) for(let i=0;i<7;i++)
      bbox(0.006,0.014,0.30,rippe,sx,0.30+i*0.055,0,g,false);
    /* Kabeleinfuehrung nach unten, in einem Schutzrohr */
    { const kr=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.16,10),std(0x1c1f26,{roughness:0.9}));
      kr.position.set(0.30,0.08,-0.24); g.add(kr);
      const kb=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.5,8),std(0x14161c,{roughness:0.95}));
      kb.rotation.x=1.4; kb.position.set(0.30,0.03,-0.45); g.add(kb); }
    /* Warnstreifen ueber dem Sockel */
    plane(0.98,0.07,new THREE.MeshStandardMaterial({map:tex(420,32,(c,W,H)=>{
      for(let x=-H;x<W;x+=H*1.6){ c.save(); c.translate(x,0); c.rotate(0);
        c.fillStyle='#f2c230'; c.fillRect(0,0,H*0.8,H);
        c.fillStyle='#1b1e26'; c.fillRect(H*0.8,0,H*0.8,H); c.restore(); }
    })}),0,0.145,0.292,0,g);
    /* --- Bedienpult ---
       Der Zuendmeister steht hinter dem Pult und blickt ueber die
       Platte aufs Feld. Die Platte faellt deshalb zu ihm hin ab,
       nach +z. Vorher war die Neigung andersherum: man schaute von
       oben auf eine wegkippende Flaeche und sah von den Bedien-
       elementen fast nichts.
       Alles Bedienbare haengt in einer geneigten Gruppe, damit die
       Lage der Teile nicht von Hand durchgerechnet werden muss. --- */
    const body=rbox(0.92,0.30,0.56,0.03,korpus,0,1.03,0,g);
    if(HIQ) body.castShadow=true;
    bbox(0.96,0.025,0.60,kante,0,1.19,0,g,false);
    const NEIG=0.30;
    const pult=new THREE.Group(); pult.position.set(0,1.215,0); pult.rotation.x=NEIG; g.add(pult);
    /* Die Pultplatte ist bedruckt: Beschriftungsfelder, Kanalreihe,
       Warnhinweis. Eine nackte graue Platte sah aus wie ein Brett. */
    const platteTex=tex(1024,560,(c,W,H)=>{
      const gr=c.createLinearGradient(0,0,0,H);
      gr.addColorStop(0,'#3a4152'); gr.addColorStop(0.55,'#2d3342'); gr.addColorStop(1,'#242938');
      c.fillStyle=gr; c.fillRect(0,0,W,H);
      /* gebuerstetes Blech */
      for(let i=0;i<2600;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.035})`;
        c.fillRect(Math.random()*W,Math.random()*H,rand(8,40),1); }
      /* Umlaufende Fase */
      c.strokeStyle='rgba(255,255,255,.14)'; c.lineWidth=5; c.strokeRect(9,9,W-18,H-18);
      /* Feld links: Schluesselschalter */
      /* Die Beschriftung steht unter dem jeweiligen Bedienteil, zum
         Bediener hin - darueber sitzt Taster, Schloss oder Display
         und wuerde sie verdecken. */
      const feld=(x,y,w,h,titel,farbe)=>{
        c.fillStyle='rgba(12,15,22,.58)'; c.fillRect(x,y,w,h);
        c.strokeStyle=farbe||'#6f7684'; c.lineWidth=3; c.strokeRect(x,y,w,h);
        c.fillStyle=farbe||'#aab2c0'; c.font=BAR(27); c.textAlign='center'; c.textBaseline='bottom';
        c.fillText(titel,x+w/2,y+h-12);
      };
      feld(40,250,196,270,'SCHLÜSSEL · SCHARF');
      feld(276,250,290,270,'ANZEIGE');
      feld(606,250,378,270,'ZÜNDUNG','#e0574a');
      /* Kanalreihe oben: 15 Leuchten in drei Gruppen, darunter die
         Kanalnummer und der Name der Station */
      c.fillStyle='rgba(12,15,22,.5)'; c.fillRect(40,44,944,176);
      c.strokeStyle='#6f7684'; c.lineWidth=3; c.strokeRect(40,44,944,176);
      const tx=x=>(x+0.45)/0.9*W;
      for(let i=0;i<15;i++){
        c.fillStyle='#e2e7ef'; c.font=BUN(26); c.textAlign='center'; c.textBaseline='middle';
        c.fillText(String(i+1),tx(PULT_LAMP_X(i)),150);
      }
      [['TISCH',0,5],['RÖHREN',6,11],['MÖRSER',12,14]].forEach(([n,a,b2])=>{
        const x0=tx(PULT_LAMP_X(a))-24, x1=tx(PULT_LAMP_X(b2))+24;
        c.strokeStyle='#8f97a6'; c.lineWidth=2; c.beginPath(); c.moveTo(x0,176); c.lineTo(x1,176); c.stroke();
        c.fillStyle='#aab2c0'; c.font=BAR(24); c.textAlign='center'; c.textBaseline='middle';
        c.fillText(n,(x0+x1)/2,198); });
      /* Warnzeile unten */
      c.fillStyle='#f2c230'; c.fillRect(40,524,944,22);
      c.fillStyle='#1b1e26'; c.font=BUN(20); c.textAlign='center'; c.textBaseline='middle';
      c.fillText('ZÜNDANLAGE ZA-15 · NUR MIT SCHLÜSSEL SCHARFSCHALTEN · SICHERHEITSABSTAND BEACHTEN',W/2,536);
    });
    const platte=new THREE.Mesh(new THREE.BoxGeometry(0.90,0.022,0.50),
      [kante,kante,new THREE.MeshStandardMaterial({map:platteTex,roughness:0.45,metalness:0.18}),kante,kante,kante]);
    pult.add(platte);
    /* Handballenauflage an der Vorderkante */
    { const auf=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.90,HIQ?16:8),kante);
      auf.rotation.z=Math.PI/2; auf.position.set(0,0.012,0.248); pult.add(auf); }

    /* Anzeige im Rahmen, mittig auf der Platte */
    pultTex=tex(960,480,()=>{});
    rbox(0.32,0.02,0.19,0.008,std(0x11141b,{roughness:0.5}),-0.030,0.02,-0.042,pult);
    const scr=plane(0.285,0.155,new THREE.MeshBasicMaterial({map:pultTex,toneMapped:false}),-0.030,0.031,-0.042,0,pult);
    scr.rotation.x=-Math.PI/2;

    /* Schlagtaster rechts. Keine Textur auf der Kuppel: eine
       Kugel bekommt ihre UV um den Aequator gewickelt, ein
       aufgemalter Schriftzug wird dort zu einem schwarzen Fleck
       am Pol. Der Taster ist darum aus Volumen gebaut -
       Einbauring, Raendelmutter, Schaft, Teller, Kuppel - und die
       Beschriftung steht auf der Pultplatte daneben. */
    const TX=0.295, TZ=-0.02;
    const rotDunkel=std(0x8e1a11,{roughness:0.42,metalness:0.02});
    const rotKorpus=std(0xbe2418,{roughness:0.3,metalness:0.03});
    const rotHell=std(0xd93b2c,{roughness:0.24,metalness:0.03});
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.086,0.092,0.020,HIQ?32:16),kante);
    ring.position.set(TX,0.020,TZ); pult.add(ring);
    const raend=new THREE.Mesh(new THREE.CylinderGeometry(0.079,0.079,0.015,HIQ?24:12),
      std(0x7a8089,{metalness:0.75,roughness:0.28}));
    raend.position.set(TX,0.036,TZ); pult.add(raend);
    const schaft=new THREE.Mesh(new THREE.CylinderGeometry(0.050,0.050,0.022,HIQ?24:12),rotDunkel);
    schaft.position.set(TX,0.051,TZ); pult.add(schaft);
    const teller=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.057,0.028,HIQ?32:16),rotKorpus);
    teller.position.set(TX,0.073,TZ); if(HIQ) teller.castShadow=true; pult.add(teller);
    const kuppe=new THREE.Mesh(new THREE.SphereGeometry(0.075,HIQ?32:16,HIQ?12:6,0,Math.PI*2,0,Math.PI*0.5),rotHell);
    kuppe.position.set(TX,0.086,TZ); kuppe.scale.y=0.26; pult.add(kuppe);
    /* Fase am Tellerrand, damit die Kante nicht hart abbricht */
    const fase=new THREE.Mesh(new THREE.TorusGeometry(0.0735,0.006,6,HIQ?28:14),rotDunkel);
    fase.position.set(TX,0.0865,TZ); fase.rotation.x=Math.PI/2; pult.add(fase);
    /* Schutzbuegel: zwei Stuetzen und ein Halbbogen darueber. Der
       Torus liegt von Haus aus in der xy-Ebene - genau so, wie ein
       Buegel ueber dem Taster stehen muss. Eine Drehung braucht er
       nicht, vorher stand er quer. */
    for(const sx of [-1,1]) bbox(0.016,0.10,0.016,pulver,TX+sx*0.103,0.072,TZ,pult,false);
    { const bo=new THREE.Mesh(new THREE.TorusGeometry(0.103,0.010,8,HIQ?22:12,Math.PI),pulver);
      bo.position.set(TX,0.122,TZ); pult.add(bo); }

    /* Schluesselschalter links mit Stellungsmarke */
    const zylR=new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.030,0.020,HIQ?18:10),kante);
    zylR.position.set(-0.328,0.022,-0.018); pult.add(zylR);
    const key=new THREE.Mesh(new THREE.BoxGeometry(0.009,0.014,0.055),std(0xb9a05a,{metalness:0.8,roughness:0.3}));
    key.position.set(-0.328,0.036,0.009); key.rotation.x=-0.5; pult.add(key);
    /* Meldeleuchten: eine je Kanal. Aus = leer, gruen = scharf,
       rot = brennt (pultLampen) */
    for(let i=0;i<15;i++){
      const lx=PULT_LAMP_X(i);
      const lm=new THREE.MeshStandardMaterial({color:LIN(0x1e232e),roughness:0.4,emissive:LIN(0x39ff7a),emissiveIntensity:0});
      pultLamps.push(lm);
      const l=new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,0.012,HIQ?14:8),lm);
      l.position.set(lx,0.019,-0.193); pult.add(l);
      const r2=new THREE.Mesh(new THREE.TorusGeometry(0.019,0.004,6,HIQ?14:8),kante);
      r2.position.set(lx,0.021,-0.193); r2.rotation.x=Math.PI/2; pult.add(r2);
    }
    /* Seitengriffe am Korpus */
    for(const sx of [-0.48,0.48]){
      const h1=new THREE.Mesh(new THREE.TorusGeometry(0.065,0.012,8,HIQ?16:8,Math.PI),kante);
      h1.rotation.y=Math.PI/2; h1.rotation.z=sx>0?0:Math.PI; h1.position.set(sx,1.05,0); g.add(h1);
    }
    /* Typenschild an der Zarge unter der Platte */
    plane(0.3,0.05,new THREE.MeshStandardMaterial({map:tex(600,100,(g2,W,H)=>{
      g2.fillStyle='#161a22'; g2.fillRect(0,0,W,H);
      g2.strokeStyle='#6f7684'; g2.lineWidth=4; g2.strokeRect(5,5,W-10,H-10);
      g2.fillStyle='#c9cfd8'; g2.font=BAR(42); g2.textAlign='center'; g2.textBaseline='middle';
      g2.fillText('ZÜNDANLAGE ZA-15',W/2,H/2+2); })}),-0.26,1.00,0.282,0,g);
    for(const sx of [-0.33,0.33]) bbox(0.16,0.04,0.006,pulver,sx,0.93,0.282,g,false);

    const hit=bbox(0.98,1.35,0.66,hitM,0,0.75,0,g,false); hit.userData={kind:'pult'};
    pultHit=hit; col(PULT_POS.x-0.48,PULT_POS.x+0.48,PULT_POS.z-0.48,PULT_POS.z+0.48);
    drawPult();
  }
  /* Flutlicht */
  /* Der erste Mast stand bei z -7,2 und ragte durch die Decke des
     Lagergangs. Beide sind mit den Stationen nach Sueden gerueckt. */
  for(const [x,z] of [[-5.6,-13.0],[6.6,-21.0]]){
    bbox(0.12,3.4,0.12,std(0x4a4f5a,{metalness:0.5}),x,1.7,z);
    const head=bbox(0.55,0.3,0.25,std(0x2a2e38),x,3.45,z); head.rotation.x=0.4;
    const lm=new THREE.MeshStandardMaterial({color:0x222222,emissive:LIN(0xfff0d0),emissiveIntensity:0}); lampMats.push(lm);
    bbox(0.45,0.03,0.2,lm,x,3.33,z+(z<-17?0.1:-0.12),null,false);
  }
}
/* =========================================================
   Kanaele. Jeder Platz auf den Stationen hat eine feste Nummer:
   Zuendtisch 1 bis 6, Abschussroehren 7 bis 12, Moerser 13 bis 15.
   Am Pult zuendet man einen Kanal einzeln oder alle zusammen. Die
   Ware bleibt stehen, bis sie abgebrannt ist, und jeder Effekt
   startet genau dort, wo sein Produkt steht.
   ========================================================= */
const KANAL_START={tisch:1,rampe:7,moerser:13};
const KANAL_REIHE=['tisch','rampe','moerser'];
function kanalVon(st,slot){ return KANAL_START[st.id]+slot; }
function kanalAnzahl(){ let n=0; for(const id of KANAL_REIHE) if(stations[id]) n+=stations[id].cap; return n; }
function itemAufPlatz(st,slot){ return st.items.find(x=>x.slot===slot)||null; }
function freierPlatz(st){ for(let i=0;i<st.cap;i++) if(!itemAufPlatz(st,i)) return i; return -1; }
/* Alle Kanaele in Reihenfolge, belegt oder nicht */
function alleKanaele(){
  const out=[];
  for(const id of KANAL_REIHE){ const st=stations[id]; if(!st) continue;
    for(let i=0;i<st.cap;i++) out.push({kanal:kanalVon(st,i),st,slot:i,it:itemAufPlatz(st,i)}); }
  return out;
}
function kanalItem(k){ const e=alleKanaele().find(x=>x.kanal===k); return e?e.it:null; }
/* Wo der Effekt eines Platzes startet: Oberkante des Produkts auf
   dem Tisch, Muendung des Rohrs, Muendung des Moerserrohrs. jit ist
   der seitliche Versatz eines Schusses - aus einem Rohr kommt er
   gerade heraus, nicht irgendwo aus der Naehe. */
const MOERSER_MUND=[1.48,1.73,2.03];
function muendung(st,slot,t){
  const p=STATION_POS[st.id];
  if(st.id==='tisch'){ const h=P[t]&&P[t].dims?P[t].dims[1]:0.2;
    return {x:p.x-0.95+slot*0.38,y:0.93+h,z:p.z,ab:0.08,jit:0.06}; }
  if(st.id==='moerser') return {x:p.x+[-0.72,0,0.78][slot%3],y:MOERSER_MUND[slot%3],z:p.z,ab:0.05,jit:0.02};
  return {x:p.x-1.0+slot*0.4,y:1.34,z:p.z-0.08,ab:0.05,jit:0.02};
}
function placedCount(){ let n=0; for(const k in stations) n+=stations[k].items.length; return n; }
function bereitCount(){ let n=0; for(const k in stations) n+=stations[k].items.filter(it=>it.state==='bereit').length; return n; }
function drawPult(){
  if(!pultTex) return;
  const n=bereitCount(), b=placedCount()-n;
  redraw(pultTex,(g,W,H)=>{
    g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H); g.scale(W/320,H/160); W=320; H=160;
    g.fillStyle='#0a1420'; g.fillRect(0,0,W,H);
    g.fillStyle=b?'#ff8a5a':n?'#8ef0a8':'#5a6472'; g.font=BUN(30); g.textAlign='left'; g.textBaseline='middle';
    g.fillText(b?'ZÜNDUNG':n?'BEREIT':'LEER',14,30);
    g.font=BAR(26); g.fillStyle='#e8eef8';
    g.fillText(`${n} von ${kanalAnzahl()} Kanälen scharf`,14,72);
    const names=[]; for(const k in stations) stations[k].items.forEach(it=>{ if(it.state==='bereit'&&names.indexOf(P[it.type].short)<0) names.push(P[it.type].short); });
    const txt=names.join(', ')||'Ware auf Tisch, Röhren oder Mörser stellen';
    g.fillStyle='#8fb4e0'; fitFont(g,txt,W-28,22,BAR); g.fillText(txt,14,110);
    g.fillStyle=b?'#ff6a3d':n?'#ffd23f':'#39405a'; g.fillRect(0,H-22,W,22);
  });
  pultLampen();
  if(typeof renderZuend==='function') renderZuend();
}
/* Meldeleuchten je Kanal: aus = leer, gruen = scharf, rot = brennt */
function pultLampen(){
  if(!pultLamps.length) return;
  const ks=alleKanaele();
  pultLamps.forEach((m,i)=>{ const e=ks[i], it=e&&e.it;
    if(!it){ m.emissiveIntensity=0; return; }
    if(it.state==='brennt'){ m.emissive.copy(LIN(0xff3b2e)); m.emissiveIntensity=1.6; }
    else { m.emissive.copy(LIN(0x39ff7a)); m.emissiveIntensity=1.3; } });
}
function stationSlot(st,i){
  const p=STATION_POS[st.id];
  if(st.id==='tisch'){ const x=-0.95+i*0.38; return {x:p.x+x,y:0.93,z:p.z,ry:Math.PI}; }
  if(st.id==='moerser'){ const x=[-0.72,0,0.78][i%3]; return {x:p.x+x,y:[1.36,1.62,1.92][i%3],z:p.z,ry:rand(0,Math.PI*2)}; }
  const x=-1.0+i*0.4; return {x:p.x+x,y:1.18,z:p.z-0.08,ry:0};
}
/* =========================================================
   Was auf der Station sichtbar steht. Raketen stecken mit dem Stab
   im Rohr und schauen oben heraus, jede Sorte mit eigenem Aussehen.
   Kugelbomben liegen im Moerserrohr, ueber den Rand haengt die
   gruene Zuendschnur. Vorher lag der Karton oben auf dem Rohr.
   ========================================================= */
const RAKETEN_LOOK={
  raketenklein:{r:0.024,L:0.15,body:'#35157a',kopf:'#ffd23f',band:'#ff4fa3'},
  raketen:     {r:0.030,L:0.21,body:'#1f3f8a',kopf:'#ff4fa3',band:'#ffd23f',flossen:true},
  raketengold: {r:0.034,L:0.25,body:'#c9a23a',kopf:'#fff3c4',band:'#4a3308',metall:true,flossen:true},
  furzrakete:  {r:0.046,L:0.19,body:'#6b4a1c',kopf:'#c8e04a',band:'#ffd23f'},
  blanko:      {r:0.022,L:0.16,body:'#7a808c',kopf:'#f2f5ff',band:'#ffd23f'},
  pfeifraketen:{r:0.026,L:0.2,body:'#c8201c',kopf:'#f2f5ff',band:'#1b1b1b',rillen:true},
  titanraketen:{r:0.05,L:0.34,body:'#15181f',kopf:'#e63b2e',band:'#ffd23f',metall:true,flossen:true,gross:true}
};
function raketeModell(t){
  const p=P[t]||{}, a=p.art||{};
  const L0=RAKETEN_LOOK[t]||{r:0.028,L:0.2,body:a.bg1||'#35157a',kopf:a.ac||'#ffd23f',band:a.ac2||'#ffffff'};
  const g=new THREE.Group();
  const mat=h=>std(parseInt(h.slice(1),16),L0.metall?{metalness:0.55,roughness:0.3}:{roughness:0.5});
  /* Stab steckt im Rohr */
  const stab=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.95,6),std(0xc9a46a,{roughness:0.8}));
  stab.position.y=-0.46; g.add(stab);
  /* Treibsatz, Band, Kopf */
  const body=new THREE.Mesh(new THREE.CylinderGeometry(L0.r,L0.r,L0.L,HIQ?16:10),mat(L0.body));
  body.position.y=L0.L/2; g.add(body);
  for(const f of (L0.rillen?[0.25,0.5,0.75]:[0.62])){
    const b=new THREE.Mesh(new THREE.CylinderGeometry(L0.r*1.04,L0.r*1.04,L0.L*0.09,HIQ?16:10),mat(L0.band));
    b.position.y=L0.L*f; g.add(b); }
  const kopf=new THREE.Mesh(new THREE.ConeGeometry(L0.r*1.12,L0.r*(L0.gross?3.4:2.6),HIQ?16:10),mat(L0.kopf));
  kopf.position.y=L0.L+L0.r*(L0.gross?1.7:1.3); g.add(kopf);
  /* Duese mit Zuendschnur */
  const d=new THREE.Mesh(new THREE.CylinderGeometry(L0.r*0.7,L0.r*0.9,0.02,10),std(0x2a2e36));
  d.position.y=-0.01; g.add(d);
  if(L0.flossen) for(let k=0;k<3;k++){
    const fl=bbox(0.004,L0.L*0.32,L0.r*1.3,mat(L0.band),0,L0.L*0.16,0,g,false);
    fl.position.set(Math.cos(k*2.09)*L0.r*1.4,L0.L*0.16,Math.sin(k*2.09)*L0.r*1.4); fl.rotation.y=-k*2.09; }
  if(HIQ) g.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return g;
}
/* Kugelbombe im Rohr mit Zuendschnur ueber den Rand */
const KUGEL_R={kugel75:0.042,kugel100:0.058,kugel150:0.08,kugel200:0.1,kugel300:0.15};
const MOERSER_R=[0.115,0.145,0.185];
function kugelModell(t,slot){
  /* passt nicht jede Kugel in jedes Rohr - dann eben knapp unter die Innenweite */
  const g=new THREE.Group(), rr=MOERSER_R[slot%3]*0.9, rk=Math.min(KUGEL_R[t]||0.06,rr*0.92);
  const papier=std(0xb58a55,{roughness:0.95});
  const kugel=new THREE.Mesh(new THREE.SphereGeometry(rk,HIQ?16:10,HIQ?12:8),papier);
  kugel.position.y=-0.14-rk; g.add(kugel);
  /* Schnur: aus der Kugel hoch, ueber den Rand und aussen herab */
  const top=-0.14;
  const pts=[V(0,top,0),V(0,0.0,0),V(rr*0.45,0.07,0),V(rr+0.03,0.05,0),V(rr+0.05,-0.1,0),V(rr+0.045,-0.34,0)];
  /* aus kurzen Zylinderstuecken, alle in der x-y-Ebene: die Neigung
     ist dann ein Winkel um z (wie bei strebe). Keine Kurvengeometrie -
     die kennt das Testdoppel von three.js nicht. */
  const schnurM=std(0x3fbf4f,{roughness:0.55,emissive:LIN(0x0c3a12),emissiveIntensity:0.6});
  for(let k=0;k<pts.length-1;k++){
    const a=pts[k], b=pts[k+1], dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy);
    const sg=new THREE.Mesh(new THREE.CylinderGeometry(0.009,0.009,L+0.012,6),schnurM);
    sg.position.set((a.x+b.x)/2,(a.y+b.y)/2,0); sg.rotation.z=Math.atan2(-dx,dy); g.add(sg);
  }
  const spitze=new THREE.Mesh(new THREE.SphereGeometry(0.016,8,6),std(0xd8352a,{roughness:0.6}));
  spitze.position.copy(pts[pts.length-1]); g.add(spitze);
  g.userData.lunte=pts[pts.length-1].clone();
  return g;
}
function stationsModell(st,it,sl){
  const t=it.type, p=P[t]; if(!p) return false;
  if(st.id==='rampe'&&(p.shape==='rocketset')&&t!=='gravur'){
    const o=muendung(st,it.slot,t);
    const g=raketeModell(t); g.position.set(o.x,o.y-0.01,o.z); g.rotation.x=-0.1;
    scene.add(g); it.modell=g; return true;
  }
  if(st.id==='rampe'&&t==='gravur'){
    const o=muendung(st,it.slot,t);
    const m=makeEngraved(it.text||(S.carrying&&S.carrying.text)||'');
    m.rotation.z=Math.PI/2; m.position.set(o.x,o.y+0.07,o.z); scene.add(m);
    it.mesh=m; it.text=S.carrying&&S.carrying.text; return true;
  }
  if(st.id==='moerser'&&p.shape==='shell'){
    const o=muendung(st,it.slot,t);
    const g=kugelModell(t,it.slot); g.position.set(o.x,o.y,o.z); g.rotation.y=-Math.PI*0.5;
    scene.add(g); it.modell=g; return true;
  }
  return false;
}
function placeOnStation(st){
  const c=S.carrying; if(!c) return;
  const want=stationOf(c.type);
  if(!want){ toast('Damit kann man nichts zünden.','bad'); return; }
  if(want!==st.id){ toast(`${P[c.type].short} gehört auf: ${STATION_POS[want].name}.`,'bad'); return; }
  const slot=freierPlatz(st);
  if(slot<0){ toast('Die Station ist voll. Erst zünden.','bad'); return; }
  const sl=stationSlot(st,slot);
  const it={type:c.type,q:c.q||1,slot,kanal:kanalVon(st,slot),state:'bereit'};
  if(stationsModell(st,it,sl)){
    /* eigenes Modell: Rakete im Rohr, Kugelbombe mit Zuendschnur */
  } else if(c.type==='gravur'){
    const m=makeEngraved(c.text||''); m.position.set(sl.x,sl.y+0.06,sl.z); m.rotation.y=sl.ry; scene.add(m);
    it.mesh=m; it.text=c.text;
  } else {
    it.h=pools[c.type].add(mx(sl.x,sl.y,sl.z,sl.ry));
  }
  st.items.push(it);
  c.count--; S.tut.build=true; sfx.pop();
  if(c.count<=0){ S.carrying=null; toast('Karton leer.'); }
  updateCarry(); drawPult();
  toast(`Kanal ${it.kanal}: ${P[it.type].short}`);
}
function itemEntfernen(st,it){
  if(it.h) it.h.pool.remove(it.h);
  if(it.mesh) disposeEngraved(it.mesh);
  if(it.modell&&it.modell.parent) it.modell.parent.remove(it.modell);
  const i=st.items.indexOf(it); if(i>=0) st.items.splice(i,1);
}
function clearStations(){ for(const k in stations){ stations[k].items.slice().forEach(it=>itemEntfernen(stations[k],it)); } drawPult(); }
/* Mitte zwischen Zuendtisch und Abschussroehren - dahin schaut man beim Zuenden */
function testfeldMitte(){
  const a=STATION_POS.tisch, b=STATION_POS.rampe, c=STATION_POS.moerser;
  return {x:(a.x+b.x+c.x)/3,z:(a.z+b.z+c.z)/3};
}
/* Wie lange ein Produkt brennt - so lange bleibt es auf seinem Platz
   stehen, danach ist es verbraucht und verschwindet. */
function brennDauer(t){
  const p=P[t]; if(!p) return 3;
  if(typeof SHOWS!=='undefined'&&SHOWS[t]) return 0.8+showLength(t)+1.5;
  const fest={wunder:5,knallerbsen:2.2,knallfrosch:2.8,tisch:3,schwaermer:3.8,vulkan:14,wasserfall:23,
    sternenbrunnen:6,fontaene:12,goldgeysir:22,feuersaeule:30,furzrakete:6,heuler:5};
  if(fest[t]) return fest[t];
  if(p.rezept) return 7;
  const sh=p.shape;
  if(sh==='shell') return {kugel150:4.5,kugel200:5,kugel300:6.5}[t]||3.5;
  if(sh==='tubepack') return 2.6;
  if(sh==='rocketset'){ const k=typeof RAKETEN_KL!=='undefined'&&RAKETEN_KL[t]; return k?Math.max(3,(k.n-1)*k.gap+2):3; }
  if(sh==='battery'||sh==='fan') return 9;
  return 4;
}
/* Einen Platz zuenden. Liefert true, wenn etwas gezuendet wurde. */
function zuendeItem(st,it,leise){
  if(!it||it.state!=='bereit') return false;
  it.state='brennt';
  const o=muendung(st,it.slot,it.type);
  const dud=Math.random()<clamp((1-(it.q||1))*0.65,0,0.45);
  /* Raketen und Kugelbomben brennen erst die Zuendschnur herunter,
     dann verlassen sie Rohr oder Moerser - und sind weg. */
  const imRohr=it.modell||(st.id==='rampe'&&it.mesh);
  const vor=imRohr?(st.id==='moerser'?0.75:0.4):0;
  if(vor){
    let lo=o;
    if(it.modell&&it.modell.userData.lunte){ it.modell.updateMatrixWorld(true);
      const w=it.modell.localToWorld(it.modell.userData.lunte.clone()); lo={x:w.x,y:w.y-0.05,z:w.z}; }
    emitters.push({t:vor,k:'fuse',o:lo}); sfx.fizz(distVol(o)*0.5);
  }
  later(vor,()=>{
    if(dud){ fizzle(it.type,o); return; }
    if(it.modell) it.modell.visible=false;
    if(st.id==='rampe'&&it.mesh) it.mesh.visible=false;
    igniteType(it.type,o,it);
    if(it.text) later(0.9,()=>toast(`„${it.text}" steigt auf.`,'money'));
  });
  const dauer=vor+(dud?2.2:brennDauer(it.type));
  later(dauer,()=>{
    /* abgebrannt: ein Rest Rauch, dann ist der Platz wieder frei */
    for(let k=0;k<14;k++){ const d=randDir();
      psSmall.emit(o.x+rand(-.08,.08),o.y,o.z+rand(-.08,.08),d[0]*0.25,Math.abs(d[1])*0.6+0.3,d[2]*0.25,0.34,0.34,0.36,rand(1.2,2.2),-0.25,0); }
    itemEntfernen(st,it); drawPult();
  });
  if(!leise) sfx.pop();
  S.tut.launch=true;
  drawPult();
  return dud?'dud':true;
}
function zuendeKanal(k){
  const e=alleKanaele().find(x=>x.kanal===k);
  if(!e||!e.it){ toast(`Kanal ${k} ist leer.`); return false; }
  if(e.it.state!=='bereit'){ toast(`Kanal ${k} brennt schon.`); return false; }
  const r=zuendeItem(e.st,e.it);
  if(r==='dud') later(1.2,()=>toast(`Kanal ${k}: Blindgänger. Billige Ware rächt sich.`,'bad'));
  return !!r;
}
/* Alle scharfen Kanaele: gleichzeitig oder als kleine Show
   nacheinander, die leisen zuerst. */
function zuendeAlle(gleichzeitig){
  const ks=alleKanaele().filter(e=>e.it&&e.it.state==='bereit');
  if(!ks.length){ toast('Erst Ware auf Tisch, Röhren oder Mörser stellen.'); return false; }
  const m=testfeldMitte(); aimAt(m.x,m.z,0.24);
  if(!gleichzeitig) ks.sort((a,b)=>P[a.it.type].hype-P[b.it.type].hype);
  let t=0, duds=0;
  ks.forEach(e=>{
    later(t,()=>{ if(zuendeItem(e.st,e.it,true)==='dud') duds++; });
    t+=gleichzeitig?rand(0.02,0.12):Math.max(0.6,Math.min(2.4,P[e.it.type].hype*0.09));
  });
  later(t+0.4,()=>{ if(duds) toast(duds===1?'Ein Blindgänger war dabei.':`${duds} Blindgänger. Billige Ware rächt sich.`,'bad'); });
  sfx.pop();
  return true;
}
/* Frueher: alles auf einmal und die Stationen sofort leer. Heute
   bedeutet es "alle nacheinander" - Tests und Tastatur nutzen es. */
function firePult(){ return zuendeAlle(false); }
function fizzle(t,o){
  o=o||PAD; const v=distVol(o); noise(0.5,0.18*v,900);
  for(let i=0;i<22;i++){ const d=randDir(); psSmall.emit(o.x+rand(-.15,.15),(o.y||0.3),o.z+rand(-.15,.15),d[0]*0.6,Math.abs(d[1])*1.2,d[2]*0.6,0.5,0.5,0.55,rand(0.8,1.6),0.5); }
}

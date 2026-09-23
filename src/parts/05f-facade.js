
/* =========================================================
   Ladenfassade: Leuchtschild, Tuer, Sockel
   ========================================================= */
let neonOpen=null, signTex=null;
function drawSignFace(g,W,H){
    const bg=g.createLinearGradient(0,0,0,H); bg.addColorStop(0,'#1b2a52'); bg.addColorStop(0.55,'#101a36'); bg.addColorStop(1,'#0a1128');
    g.fillStyle=bg; g.fillRect(0,0,W,H);
    for(let i=0;i<900;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.04})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
    burst(g,90,70,54,'#ffd23f',14); burst(g,W-86,74,44,'#e63b2e',12); burst(g,W-150,178,30,'#8fd6ff',10);
    g.strokeStyle='#f2c230'; g.lineWidth=7; g.strokeRect(14,14,W-28,H-28);
    g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=2; g.strokeRect(22,22,W-44,H-44);
    g.textAlign='center'; g.textBaseline='middle';
    const t=shopName().toUpperCase(); fitFont(g,t,W-190,116,BUN);
    g.fillStyle='rgba(0,0,0,.5)'; g.fillText(t,W/2+9,H/2-13);
    g.fillStyle='#e63b2e'; g.fillText(t,W/2+5,H/2-17);
    g.fillStyle='#ffd23f'; g.fillText(t,W/2,H/2-20);
    const sh=g.createLinearGradient(0,H/2-58,0,H/2+6); sh.addColorStop(0,'rgba(255,255,255,.4)'); sh.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=sh; g.font=BUN(116); g.fillText(t,W/2,H/2-20);
    const sl=shopSlogan();
  if(sl){ g.fillStyle='#bcd0ea'; fitFont(g,sl,W-220,34,BAR); g.fillText(sl,W/2,H-52); }
}
function signFaceTex(){ return tex(1024,256,(g,W,H)=>drawSignFace(g,W,H)); }
function buildFacade(){
  const H=WH, zf=6.1;
  const steel=std(0x9ba2ad,{metalness:0.75,roughness:0.35});
  const dark=std(0x161c30,{roughness:0.6});
  const snow=std(0xeef2f8,{roughness:1});
  // --- Traufkasten über der Front
  bbox(16.5,0.36,0.34,std(0x2a3042,{roughness:0.8}),0,H+0.32,6.22,null,false);
  bbox(16.6,0.1,0.4,snow,0,H+0.54,6.22,null,false);
  // --- Leuchtschild
  const sg=new THREE.Group(); sg.position.set(0,H+1.35,6.16); scene.add(sg);
  bbox(8.4,2.1,0.3,dark,0,0,0,sg);
  /* Rahmen 1 cm vor dem Traufkasten: mit 0,42 m Tiefe lag die untere
     Leiste genau in dessen Vorderflaeche und flimmerte als Balken. */
  for(const [w,h,y,x] of [[8.6,0.14,1.05,0],[8.6,0.14,-1.05,0],[0.14,2.2,0,-4.25],[0.14,2.2,0,4.25]]) bbox(w,h,0.44,steel,x,y,0.02,sg,false);
  signTex=signFaceTex();
  const face=new THREE.MeshBasicMaterial({map:signTex,toneMapped:false});
  plane(7.9,1.78,face,0,0,0.17,0,sg);
  // Neonröhren rundum (nachts)
  for(const [w,h,y,x] of [[8.0,0.07,0.96,0],[8.0,0.07,-0.96,0],[0.07,1.95,0,-3.96],[0.07,1.95,0,3.96]]){
    const nm=new THREE.MeshStandardMaterial({color:LIN(0x40242c),emissive:LIN(0xff5a4a),emissiveIntensity:0}); lampMats.push(nm);
    bbox(w,h,0.1,nm,x,y,0.2,sg,false);
  }
  bbox(8.5,0.12,0.36,snow,0,1.13,0.02,sg,false);
  // Haltearme zur Wand
  for(const x of [-3.3,3.3]){ bbox(0.1,0.1,0.55,steel,x,0.7,-0.32,sg,false);
    const br=bbox(0.08,1.2,0.08,steel,x,0.05,-0.14,sg,false); br.rotation.x=-0.62; }
  // Strahler über dem Schild
  for(const x of [-2.4,2.4]){
    bbox(0.06,0.5,0.06,steel,x,H+2.7,6.2,null,false);
    bbox(0.06,0.06,0.38,steel,x,H+2.93,6.36,null,false);
    const sm=new THREE.MeshStandardMaterial({color:LIN(0x23262e),emissive:LIN(0xfff0cc),emissiveIntensity:0}); lampMats.push(sm);
    const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.09,0.2,10),sm); sh.position.set(x,H+2.84,6.53); sh.rotation.x=2.5; scene.add(sh);
  }
  // --- Schaufenster: Sohlbank, Warenauslage, Sicherheitsgitterhalter
  for(const [a,b] of [[-7.2,-2.0],[2.0,7.2]]){
    const cx=(a+b)/2, w=b-a;
    bbox(w+0.2,0.1,0.34,std(0xbcb6a8,{roughness:0.95}),cx,0.9,zf+0.1,null,false);
    bbox(w+0.24,0.06,0.36,snow,cx,0.96,zf+0.12,null,false);
  }
  // --- Eingang
  {
    tuer=buildSchiebetuer(0);
    /* Fussmatte: Gummirahmen mit eingefasster Buerstenflaeche */
    {
      const mt=tex(1024,540,(g,W,Hh)=>{
        g.fillStyle='#1e2128'; g.fillRect(0,0,W,Hh);
        /* Buerstenflor als feines Rauschen mit Laufrichtung */
        for(let i=0;i<26000;i++){
          const x=rand(46,W-46), y=rand(46,Hh-46), v=rand(0.04,0.16);
          g.fillStyle=`rgba(${190+Math.random()*50|0},${196+Math.random()*50|0},${206+Math.random()*50|0},${v})`;
          g.fillRect(x,y,2,rand(2,5));
        }
        for(let x=52;x<W-46;x+=9){ g.fillStyle='rgba(0,0,0,.14)'; g.fillRect(x,46,3,Hh-92); }
        /* eingelassene Schrift, nicht aufgemalt */
        g.textAlign='center'; g.textBaseline='middle';
        const t='WILLKOMMEN';
        fitFont(g,t,W-300,118,BUN);
        g.fillStyle='rgba(0,0,0,.55)'; g.fillText(t,W/2,Hh/2+5);
        g.fillStyle='#c9d2de'; g.fillText(t,W/2,Hh/2);
        g.fillStyle='rgba(255,255,255,.18)'; g.fillText(t,W/2,Hh/2-3);
        /* Gummirahmen mit Profil */
        g.fillStyle='#14161c'; g.fillRect(0,0,W,46); g.fillRect(0,Hh-46,W,46);
        g.fillRect(0,0,46,Hh); g.fillRect(W-46,0,46,Hh);
        g.strokeStyle='rgba(255,255,255,.12)'; g.lineWidth=3; g.strokeRect(46,46,W-92,Hh-92);
        for(let x=10;x<W;x+=26){ g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(x,10,12,26); g.fillRect(x,Hh-36,12,26); }
        for(let y=10;y<Hh;y+=26){ g.fillStyle='rgba(255,255,255,.05)'; g.fillRect(10,y,26,12); g.fillRect(W-36,y,26,12); }
        /* Gebrauchsspuren */
        for(let i=0;i<14;i++){ g.fillStyle=`rgba(90,84,72,${rand(0.05,0.14)})`; g.beginPath();
          g.ellipse(rand(120,W-120),rand(110,Hh-110),rand(30,90),rand(20,55),Math.random()*3,0,Math.PI*2); g.fill(); }
      });
      mt.anisotropy=8;
      const mat=new THREE.MeshStandardMaterial({map:mt,roughness:0.95});
      const matte=bbox(1.9,0.022,1.02,mat,0,0.023,6.85,null,false);
      /* angeschraegte Gummikante ringsum, damit sie nicht aufgeklebt wirkt */
      const gum=std(0x14161c,{roughness:0.95});
      for(const dz of [-0.525,0.525]) bbox(2.0,0.012,0.06,gum,0,0.014,6.85+dz,null,false);
      for(const dx of [-0.98,0.98]) bbox(0.06,0.012,1.13,gum,dx,0.014,6.85,null,false);
    }
    // Neon "GEÖFFNET" im Oberlicht
    const nm=new THREE.MeshStandardMaterial({color:LIN(0x2a1f10),emissive:LIN(0xffd23f),emissiveIntensity:0,transparent:true,opacity:0.95,
      map:tex(256,64,(g,W,Hh)=>{ g.fillStyle='#000'; g.fillRect(0,0,W,Hh); g.fillStyle='#ffd23f'; g.font=BUN(34); g.textAlign='center'; g.textBaseline='middle'; g.fillText('GEÖFFNET',W/2,Hh/2+2); }),
      emissiveMap:tex(256,64,(g,W,Hh)=>{ g.fillStyle='#000'; g.fillRect(0,0,W,Hh); g.fillStyle='#fff'; g.font=BUN(34); g.textAlign='center'; g.textBaseline='middle'; g.fillText('GEÖFFNET',W/2,Hh/2+2); })});
    neonOpen=nm;
    bbox(1.5,0.36,0.05,nm,0,2.75,5.86,null,false);
  }
  // --- Sockel, Poller, Gitter, Kamera
  const plinth=tex(256,64,(g,W,Hh)=>{ g.fillStyle='#4e5560'; g.fillRect(0,0,W,Hh); for(let r=0;r<2;r++) for(let c=0;c<8;c++){ g.fillStyle=pick(['#5c646f','#545c67','#646c78']); g.fillRect(c*32+2+(r%2?16:0),r*32+2,28,28);} });
  plinth.wrapS=THREE.RepeatWrapping; plinth.repeat.set(8,1);
  const plinthM=new THREE.MeshStandardMaterial({map:plinth,roughness:0.9});
  bbox(6.85,0.5,0.1,plinthM,-4.72,0.25,zf+0.06,null,false);
  bbox(6.85,0.5,0.1,plinthM, 4.72,0.25,zf+0.06,null,false);
  for(const x of [-5.4,5.4]){
    bbox(0.16,0.85,0.16,std(0x2f3542,{metalness:0.5,roughness:0.5}),x,0.42,7.5,null,false);
    bbox(0.2,0.06,0.2,std(0xd9c07a,{metalness:0.7}),x,0.87,7.5,null,false);
    col(x-0.2,x+0.2,7.3,7.7);
  }
  // Hausnummer
  plane(0.34,0.34,new THREE.MeshStandardMaterial({map:tex(96,96,(g,W,Hh)=>{ g.fillStyle='#f2f5ff'; g.fillRect(0,0,W,Hh); g.strokeStyle='#0e1226'; g.lineWidth=5; g.strokeRect(5,5,W-10,Hh-10); g.fillStyle='#0e1226'; g.font=BUN(48); g.textAlign='center'; g.textBaseline='middle'; g.fillText('13',W/2,Hh/2+3); })}),1.55,2.28,6.13,0);
  // Schneewall an der Fassade
  for(const x of [-7.4,-4.2,4.2,7.4]) bbox(rand(1.3,2.2),0.14,0.4,snow,x,0.07,zf+0.4,null,false);
}

/* =========================================================
   Schaufenster verschmutzen mit der Zeit
   ========================================================= */
function grimeTex(){
  return tex(256,128,(g,W,H)=>{
    g.clearRect(0,0,W,H);
    g.fillStyle='rgba(176,168,150,.5)'; g.fillRect(0,0,W,H);
    for(let i=0;i<900;i++){ g.fillStyle=`rgba(120,110,92,${Math.random()*0.35})`; g.fillRect(Math.random()*W,Math.random()*H,rand(1,4),rand(1,4)); }
    // Regenschlieren
    for(let i=0;i<26;i++){ const x=Math.random()*W, w=rand(2,9);
      const gr=g.createLinearGradient(x,0,x,H); gr.addColorStop(0,'rgba(90,84,70,.34)'); gr.addColorStop(1,'rgba(90,84,70,0)');
      g.fillStyle=gr; g.fillRect(x,0,w,H); }
    // Wischspuren und Fingerabdrücke
    g.strokeStyle='rgba(210,205,190,.3)'; g.lineWidth=7;
    for(let i=0;i<7;i++){ g.beginPath(); const y=rand(10,H-10);
      g.moveTo(0,y); g.bezierCurveTo(W*0.3,y+rand(-14,14),W*0.7,y+rand(-14,14),W,y+rand(-10,10)); g.stroke(); }
    for(let i=0;i<14;i++){ g.fillStyle='rgba(150,142,120,.26)';
      g.beginPath(); g.ellipse(Math.random()*W,Math.random()*H,rand(3,6),rand(4,8),Math.random(),0,Math.PI*2); g.fill(); }
    // Staubränder
    const eg=g.createLinearGradient(0,H,0,H-26); eg.addColorStop(0,'rgba(90,82,66,.45)'); eg.addColorStop(1,'rgba(90,82,66,0)');
    g.fillStyle=eg; g.fillRect(0,H-26,W,26);
  });
}
function buildWindowGrime(){
  const t=grimeTex(); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,1);
  for(const [a,b] of [[-7.2,-2.0],[2.0,7.2]]){
    const m=new THREE.MeshStandardMaterial({map:t,transparent:true,opacity:0,roughness:0.95,depthWrite:false});
    grimeMats.push(m);
    const pane=bbox(b-a-0.05,1.46,0.015,m,(a+b)/2,1.65,5.93,null,false);
    pane.userData={kind:'window'}; pane.renderOrder=3; windowHits.push(pane);
  }
  applyGrime();
}
function windowGrime(){ return S?clamp(S.grime||0,0,1):0; }
function applyGrime(){ const v=windowGrime(); grimeMats.forEach(m=>{ m.opacity=v*0.82; m.visible=v>0.02; }); }
function addGrime(v){ if(!S) return; S.grime=clamp((S.grime||0)+v,0,1); applyGrime(); }
function cleanWindowTick(first){
  if(windowGrime()<=0.01){ toast('Die Scheiben sind sauber.'); return; }
  winWork+=first?0.1:0.14;
  if(winWork>=1){ winWork=0; S.grime=clamp(S.grime-0.34,0,1); applyGrime(); sfx.spray(); addXP(4);
    S.tut.fenster=true;
    toast(windowGrime()<=0.01?'Scheiben blitzen wieder.':'Schon besser. Weiter putzen.'); }
}

/* =========================================================
   Automatische Schiebetür zum Ladenlokal
   ========================================================= */
const TUER={z:6.14,y:2.44,w:1.24,hub:1.30, r:3.1};
let tuer=null;
const TUEREN=[];
/* Schiebetuer an der Stelle cx der Fassade. hb ist die Breite des
   Antriebskastens - der zweite Eingang sitzt in einer Fensterachse
   des Nachbarhauses und hat dort weniger Platz als der Haupteingang.
   Alles haengt in einer Gruppe, damit eine zweite Tuer nur eine
   zweite Gruppe ist und nicht eine Kopie des ganzen Codes. */
function buildSchiebetuer(cx,hb){
  const HB=hb||5.4;
  const g=new THREE.Group(); g.position.x=cx||0; scene.add(g);
  const alu=std(0xc4cad3,{metalness:0,roughness:0.5});
  const aluD=std(0x8f959e,{metalness:0,roughness:0.55});
  const dark=std(0x23272f,{metalness:0,roughness:0.6});
  const glass=new THREE.MeshStandardMaterial({color:LIN(0xd6ecff),transparent:true,opacity:0.17,roughness:0.05,metalness:0.1,depthWrite:false});
  const W=TUER.w, HH=TUER.y, Z=TUER.z;
  /* Antriebskasten über der Öffnung, reicht über beide Parktaschen */
  bbox(HB,0.24,0.26,alu,0,HH+0.14,Z,g,false);
  bbox(HB+0.04,0.05,0.3,aluD,0,HH+0.27,Z,g,false);
  bbox(HB-0.1,0.05,0.2,dark,0,HH+0.005,Z,g,false);
  /* Laufschiene */
  bbox(HB-0.2,0.045,0.06,aluD,0,HH+0.05,Z-0.06,g,false);
  /* Bewegungsmelder innen und außen */
  for(const s of [-1,1]){
    const sIn=bbox(0.26,0.075,0.05,dark,s*0.78,HH+0.05,Z-0.15,g,false); sIn.rotation.x=0.42;
    const sOut=bbox(0.26,0.075,0.05,dark,s*0.78,HH+0.05,Z+0.15,g,false); sOut.rotation.x=-0.42;
  }
  /* Bodenführung */
  bbox(2.6,0.012,0.045,aluD,0,0.008,Z-0.02,g,false);
  /* Seitliche Festfelder als Rahmen der Öffnung */
  for(const s of [-1,1]) bbox(0.07,HH,0.09,alu,s*1.29,HH/2,Z,g,false);
  /* Zwei Flügel */
  const leaves=[];
  for(const s of [-1,1]){
    const lf=new THREE.Group(); g.add(lf); leaves.push(lf);
    bbox(W,0.09,0.055,alu,0,HH-0.05,0,lf,false);
    bbox(W,0.11,0.055,alu,0,0.055,0,lf,false);
    bbox(0.055,HH-0.12,0.055,alu,-W/2+0.028,HH/2,0,lf,false);
    bbox(0.055,HH-0.12,0.055,alu,W/2-0.028,HH/2,0,lf,false);
    bbox(W-0.09,HH-0.2,0.022,glass,0,HH/2,0,lf,false);
    /* Sicherheitsmarkierung auf Griffhöhe */
    bbox(W-0.1,0.055,0.026,new THREE.MeshStandardMaterial({color:LIN(0xe8eef6),transparent:true,opacity:0.65,roughness:0.6}),0,1.32,0,lf,false);
    /* Laufwagen oben */
    for(const dx of [-0.34,0.34]){
      bbox(0.09,0.05,0.05,aluD,dx,HH+0.02,-0.06,lf,false);
      const rl=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.03,10),dark);
      rl.rotation.z=Math.PI/2; rl.position.set(dx,HH+0.045,-0.06); lf.add(rl);
    }
  }
  const d={g,cx:cx||0,leaves,t:0,target:0,moving:false,col:null,snd:0};
  TUEREN.push(d);
  tuerSetD(d,0);
  return d;
}
/* Eine bestimmte Tuer auf den Oeffnungsgrad t stellen */
function tuerSetD(d,t){
  if(!d) return;
  d.t=clamp(t,0,1);
  const off=d.t*TUER.hub;
  d.leaves[0].position.set(-TUER.w/2-off+0.01,0,TUER.z);
  d.leaves[1].position.set( TUER.w/2+off-0.01,0,TUER.z);
  if(d.t>0.3){ if(d.col){ dropCol(d.col); d.col=null; } }
  else if(!d.col) d.col=col(d.cx-1.28,d.cx+1.28,TUER.z-0.09,TUER.z+0.09);
}
function tuerSet(t){ tuerSetD(tuer,t); }
/* Öffnet, sobald jemand in die Nähe kommt: Spieler oder Kundschaft */
function tuerNahD(d){
  const cx=d?d.cx:0;
  const nah=(x,z)=>Math.abs(x-cx)<2.5&&Math.abs(z-TUER.z)<TUER.r;
  if(typeof pl!=='undefined'&&nah(pl.x,pl.z)) return true;
  if(typeof customers!=='undefined')
    for(const c of customers){ if(c.pos&&nah(c.pos.x,c.pos.z)) return true; }
  return false;
}
function tuerNah(){ return tuerNahD(tuer); }
function updateSchiebetuer(dt){
  for(const t of TUEREN){
    /* Eine noch nicht gekaufte Tuer haengt in einer unsichtbaren
       Gruppe - sie darf nicht aufgehen. Die eigene visible-Flagge
       reicht dafuer nicht, sichtbar ist erst, wer keinen
       unsichtbaren Vorfahren hat. */
    let sicht=true; for(let o=t.g;o;o=o.parent) if(!o.visible) sicht=false;
    if(!sicht) continue;
    t.target=tuerNahD(t)?1:0;
    const d=t.target-t.t;
    if(Math.abs(d)<0.004){ if(t.t!==t.target) tuerSetD(t,t.target); t.moving=false; continue; }
    t.moving=true;
    tuerSetD(t,t.t+(d>0?1:-1)*Math.min(Math.abs(d),1.45*dt));
  }
}

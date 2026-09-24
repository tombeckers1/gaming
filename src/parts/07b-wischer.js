/* =========================================================
   Bodenwischer (Tom, 24.09.: "ein grafisch schoen gemachter Putz-
   lappen, damit wischt man den Dreck weg, und die Reinigungskraft hat
   ihn auch in der Hand - wie im Supermarkt-Simulator")
   Ein Mikrofaserlappen auf einer Wischplatte am Teleskopstiel: im
   Stehen kommt man mit einem Handlappen nicht an den Boden.
   Der Wischer wird im Koordinatensystem seines Elternteils gestellt:
   Kopf auf den Boden, Stiel zur Hand. Der Stiel ist ausziehbar, damit
   er auch bei Flecken etwas weiter weg bis in die Hand reicht.
   ========================================================= */
const mikrofaserTex=tex(256,96,(g,W,H)=>{
  /* Grundton petrolblau, darauf feine Faserschlingen */
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#3f8fb0'); gr.addColorStop(0.5,'#4aa3c4'); gr.addColorStop(1,'#3a86a6');
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  for(let i=0;i<2600;i++){ const x=Math.random()*W, y=Math.random()*H, l=1+Math.random()*3;
    g.strokeStyle=Math.random()<0.5?'rgba(255,255,255,.16)':'rgba(10,40,60,.22)'; g.lineWidth=0.8;
    g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+l*0.5,y-l,x+l,y); g.stroke(); }
  /* Steppnaht rundum und aufgenaehtes Etikett */
  g.strokeStyle='rgba(20,60,85,.7)'; g.setLineDash([5,4]); g.lineWidth=2; g.strokeRect(7,7,W-14,H-14); g.setLineDash([]);
  g.fillStyle='#f2c230'; g.fillRect(W-46,H/2-9,34,18); g.fillStyle='#1c2430'; g.font='bold 11px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('PRO',W-29,H/2+1);
},false);
const fransenTex=tex(128,32,(g,W,H)=>{ g.clearRect(0,0,W,H);
  for(let x=0;x<W;x+=2){ const l=H*(0.55+Math.random()*0.45); g.strokeStyle=Math.random()<0.5?'#5cb3d2':'#3b88a8'; g.lineWidth=1.6;
    g.beginPath(); g.moveTo(x+1,0); g.lineTo(x+1+(Math.random()-0.5)*3,l); g.stroke(); } },false);
function makeWischer(){
  const g=new THREE.Group();
  const alu=std(0xc9ced6,{metalness:0.85,roughness:0.28}), alu2=std(0xaeb4bd,{metalness:0.85,roughness:0.34});
  const blau=std(0x1f5fa8,{roughness:0.55}), grau=std(0x3a3f48,{roughness:0.6}), gelb=std(0xf2c230,{roughness:0.5});
  /* Kopf: Kunststoffplatte, darunter der Lappen, an den Enden Fransen */
  const kopf=new THREE.Group(); g.add(kopf);
  const tuch=new THREE.MeshStandardMaterial({map:mikrofaserTex,roughness:0.95});
  rbox(0.44,0.022,0.14,0.008,tuch,0,0.011,0,kopf);
  rbox(0.4,0.016,0.11,0.006,grau,0,0.03,0,kopf);
  rbox(0.36,0.006,0.05,0.003,blau,0,0.041,0,kopf);
  const fr=new THREE.MeshBasicMaterial({map:fransenTex,transparent:true,side:THREE.DoubleSide,alphaTest:0.3});
  for(const sx of [-1,1]){ const f=new THREE.Mesh(new THREE.PlaneGeometry(0.14,0.03),fr); f.rotation.set(-1.3,sx>0?Math.PI/2:-Math.PI/2,0); f.position.set(sx*0.226,0.008,0); kopf.add(f); }
  /* Gelenk mit Kugelkopf */
  bbox(0.05,0.026,0.04,grau,0,0.052,0,kopf,false);
  const kugel=new THREE.Mesh(new THREE.SphereGeometry(0.02,12,8),grau); kugel.position.y=0.07; kopf.add(kugel);
  /* Stiel: dreht sich um das Gelenk. Unten das duenne Innenrohr, oben
     das dicke Aussenrohr mit Klemme, Griff und Aufhaengeoese */
  const stiel=new THREE.Group(); g.add(stiel);
  const innen=new THREE.Mesh(new THREE.CylinderGeometry(0.0105,0.0105,1,10),alu2); stiel.add(innen);
  const aussen=new THREE.Group(); stiel.add(aussen);
  { const r=new THREE.Mesh(new THREE.CylinderGeometry(0.0135,0.0135,0.82,10),alu); r.position.y=-0.41; aussen.add(r);
    const kl=new THREE.Mesh(new THREE.CylinderGeometry(0.019,0.019,0.05,12),gelb); kl.position.y=-0.8; aussen.add(kl);
    const gr=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.2,12),blau); gr.position.y=-0.1; aussen.add(gr);
    for(let i=0;i<4;i++){ const rl=new THREE.Mesh(new THREE.TorusGeometry(0.0185,0.0035,6,14),grau); rl.rotation.x=Math.PI/2; rl.position.y=-0.03-i*0.045; aussen.add(rl); }
    const oese=new THREE.Mesh(new THREE.TorusGeometry(0.014,0.004,6,12),grau); oese.position.y=0.01; aussen.add(oese); }
  g.userData={kopf,stiel,innen,aussen,ph:Math.random()*6};
  return g;
}
/* Kopf auf k (Boden, y wird 0), Blickrichtung ry, Stielende bei h -
   beides im Koordinatensystem des Elternteils */
const _wd=new THREE.Vector3(), _wy=new THREE.Vector3(0,1,0);
function stelleWischer(w,k,ry,h){
  const u=w.userData;
  u.kopf.position.set(k.x,0,k.z); u.kopf.rotation.set(0,ry,0);
  u.stiel.position.set(k.x,0.07,k.z);
  _wd.set(h.x-k.x,h.y-0.07,h.z-k.z); const L=clamp(_wd.length(),0.9,2.3); _wd.normalize();
  u.stiel.quaternion.setFromUnitVectors(_wy,_wd);
  /* Innenrohr vom Gelenk bis ins Aussenrohr, Aussenrohr endet in der Hand */
  u.innen.scale.y=Math.max(0.1,L-0.7); u.innen.position.y=u.innen.scale.y/2;
  u.aussen.position.y=L;
}
/* Dreck verblasst beim Wischen */
function dreckAnteil(d,rest){ if(d&&d.m&&d.m.material) d.m.material.opacity=0.85*clamp(rest,0.15,1); }

/* ---------- Spieler: der Wischer erscheint, solange man wischt ---------- */
let wischer=null, wischT=0, wischZiel=null, wischPh=0;
function wischerBauen(){ if(wischer) return; wischer=makeWischer(); wischer.visible=false; scene.add(wischer); }
function wischeSpieler(d){ wischerBauen(); wischZiel=d; wischT=0.4; }
function updateWischen(dt){
  if(!wischer) return;
  if(wischT<=0||!wischZiel||dirts.indexOf(wischZiel)<0){ wischer.visible=false; wischT=0; return; }
  wischT-=dt; wischPh+=dt*9.5; wischer.visible=true;
  const fx=-Math.sin(yaw), fz=-Math.cos(yaw), rx=Math.cos(yaw), rz=-Math.sin(yaw), q=wischZiel.m.position;
  /* Achterschleife ueber dem Fleck */
  const a=Math.sin(wischPh)*0.17, b=Math.sin(wischPh*2)*0.05;
  const k={x:q.x+rx*a+fx*b,z:q.z+rz*a+fz*b};
  const c=camera.position;
  const h={x:c.x+rx*0.3+fx*0.16,y:c.y-0.5,z:c.z+rz*0.3+fz*0.16};
  stelleWischer(wischer,k,yaw+Math.sin(wischPh)*0.25,h);
}

/* ---------- Reinigungskraft: traegt den Wischer immer bei sich ---------- */
/* Der Stiel endet dort, wo die rechte Hand des Modells gerade ist -
   aus Schulter, Unterarm und Handkasten ausgerechnet, nicht geraten */
const _wl=new THREE.Vector3(), _wh=new THREE.Vector3();
function handVon(w,arm){
  const fa=arm.children.find(c=>c.isGroup)||arm;
  _wh.set(0,-0.33,0.02); w.g.updateMatrixWorld(); fa.localToWorld(_wh); w.g.worldToLocal(_wh);
  return {x:_wh.x,y:_wh.y,z:_wh.z};
}
function wischerPersonal(w,dt){
  if(!w.wischer){ w.wischer=makeWischer(); w.g.add(w.wischer); }
  const W=w.wischer, u=W.userData, arm=w.g.userData.arms[0];
  if(w.state==='work'&&w.target&&dirts.indexOf(w.target)>=0){
    /* zum Fleck drehen, dann in Schleifen wischen */
    const q=w.target.m.position, ty=Math.atan2(q.x-w.pos.x,q.z-w.pos.z);
    let df=ty-w.g.rotation.y; while(df>Math.PI) df-=Math.PI*2; while(df<-Math.PI) df+=Math.PI*2; w.g.rotation.y+=df*Math.min(1,dt*8);
    u.ph+=dt*8*(w.wf||1);
    arm.rotation.x=-0.5+Math.sin(u.ph)*0.12; arm.rotation.z=-0.05+Math.sin(u.ph)*0.08;
    w.g.updateMatrixWorld(); _wl.copy(q); w.g.worldToLocal(_wl);
    const k={x:_wl.x+Math.sin(u.ph)*0.16,z:_wl.z+Math.sin(u.ph*2)*0.05};
    stelleWischer(W,k,Math.sin(u.ph)*0.25,handVon(w,arm));
    dreckAnteil(w.target,w.t/2.2);
  } else {
    /* beim Gehen: Stiel in der Hand, der Kopf gleitet vorn neben dem rechten Fuss */
    arm.rotation.x=-0.22; arm.rotation.z=-0.05;
    stelleWischer(W,{x:-0.3,z:0.62},0.3,handVon(w,arm));
  }
}

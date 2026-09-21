
/* =========================================================
   Dekoration
   ========================================================= */
const dekos=[];
const leafM=std(0x2f7a3f,{roughness:0.85}), potM=std(0xb45a38,{roughness:0.8}), metalM=std(0x9aa1ad,{metalness:0.6,roughness:0.35});
function makeDekoMesh(id,g){
  if(id==='pflanze'){
    bbox(0.3,0.3,0.3,potM,0,0.15,0,g); bbox(0.34,0.06,0.34,std(0x8a4328),0,0.32,0,g);
    for(let i=0;i<9;i++){ const a=i/9*Math.PI*2, l=new THREE.Mesh(new THREE.SphereGeometry(0.14,10,7),leafM);
      l.position.set(Math.cos(a)*0.16,0.52+Math.sin(i*2)*0.14,Math.sin(a)*0.16); l.scale.set(0.5,1.5,0.5); l.rotation.z=Math.cos(a)*0.5; l.rotation.x=Math.sin(a)*0.5; if(HIQ) l.castShadow=true; g.add(l); }
    return {fw:0.5,fd:0.5};
  }
  if(id==='stehtisch'){ bbox(0.06,1.05,0.06,metalM,0,0.52,0,g); bbox(0.5,0.05,0.5,std(0x2b3040),0,1.07,0,g); bbox(0.42,0.03,0.42,metalM,0,0.02,0,g); return {fw:0.6,fd:0.6}; }
  if(id==='muell'){ const m=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.15,0.62,14),std(0x3b4050,{roughness:0.6})); m.position.y=0.31; if(HIQ) m.castShadow=true; g.add(m);
    const l=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.05,14),std(0x8a8f99)); l.position.y=0.64; g.add(l); return {fw:0.45,fd:0.45}; }
  if(id==='teppich'){ const t=tex(256,128,(gg,W,H)=>{ gg.fillStyle='#7a2230'; gg.fillRect(0,0,W,H); gg.fillStyle='#c9a24a'; gg.fillRect(8,8,W-16,H-16); gg.fillStyle='#7a2230'; gg.fillRect(20,20,W-40,H-40); gg.fillStyle='#f2e6c8'; for(let i=0;i<8;i++){ gg.fillRect(34+i*24,H/2-8,14,16); } });
    const m=new THREE.Mesh(new THREE.PlaneGeometry(3.0,1.5),new THREE.MeshStandardMaterial({map:t,roughness:0.95})); m.rotation.x=-Math.PI/2; m.position.y=0.025; if(HIQ) m.receiveShadow=true; g.add(m); return {fw:0,fd:0}; }
  if(id==='lichter'){ const bulbs=[];
    for(let i=0;i<16;i++){ const x=-1.5+i*0.2, y=2.5-Math.sin(i/15*Math.PI)*0.22;
      const b=new THREE.Mesh(new THREE.SphereGeometry(0.045,8,6),new THREE.MeshStandardMaterial({color:LIN(pick([0xff5a4a,0xffd23f,0x5ce1ff,0x8ef0a8])),emissive:LIN(0xffffff),emissiveIntensity:0.6}));
      b.position.set(x,y,0); g.add(b); bulbs.push(b.material); }
    bbox(3.2,0.012,0.012,std(0x2a2e38),0,2.56,0,g,false); g.userData.bulbs=bulbs; return {fw:0,fd:0};
  }
  if(id==='ventilator'){ const rot=new THREE.Group(); rot.position.y=3.1; g.add(rot);
    bbox(0.06,0.45,0.06,metalM,0,0.25,0,g,false);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.12,0.08,12),std(0x2b3040)); rot.add(hub);
    for(let i=0;i<4;i++){ const b=bbox(0.9,0.02,0.16,std(0x6d4c35),0.5,0,0,rot,false); b.rotation.y=i*Math.PI/2; b.position.set(Math.cos(i*Math.PI/2)*0.5,0,Math.sin(i*Math.PI/2)*0.5); }
    g.userData.rot=rot; return {fw:0,fd:0};
  }
  if(id==='baum'){ bbox(0.16,0.35,0.16,std(0x5a3a22),0,0.17,0,g);
    for(let i=0;i<4;i++){ const c=new THREE.Mesh(new THREE.ConeGeometry(0.72-i*0.15,0.6,12),std(0x1f5c33,{roughness:0.9})); c.position.y=0.55+i*0.42; if(HIQ) c.castShadow=true; g.add(c); }
    for(let i=0;i<18;i++){ const a=Math.random()*Math.PI*2, r=rand(0.12,0.6), y=rand(0.5,1.9);
      const b=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,6),new THREE.MeshStandardMaterial({color:LIN(pick([0xe63b2e,0xffd23f,0x7fd1ff])),metalness:0.6,roughness:0.25,emissive:LIN(0x331100),emissiveIntensity:0.3}));
      b.position.set(Math.cos(a)*r,y,Math.sin(a)*r); g.add(b); }
    const st=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6),new THREE.MeshStandardMaterial({color:0xffd23f,emissive:LIN(0xffd23f),emissiveIntensity:0.8})); st.position.y=2.25; g.add(st);
    return {fw:1.3,fd:1.3};
  }
  if(id==='neon'){ const t=tex(512,160,(gg,W,H)=>{ gg.fillStyle='#0b0f22'; gg.fillRect(0,0,W,H); gg.font=BUN(62); gg.textAlign='center'; gg.textBaseline='middle'; gg.fillStyle='#ff4fa3'; gg.fillText('FROHES NEUES',W/2+4,H/2+4); gg.fillStyle='#5ce1ff'; gg.fillText('FROHES NEUES',W/2,H/2); });
    plane(1.9,0.6,new THREE.MeshBasicMaterial({map:t,toneMapped:false,transparent:true}),0,2.3,0,0,g); return {fw:0,fd:0}; }
  if(id==='automat'){ bbox(0.9,1.9,0.7,std(0x1f3f8a,{roughness:0.5}),0,0.95,0,g);
    plane(0.62,1.2,new THREE.MeshStandardMaterial({map:tex(180,340,(gg,W,H)=>{ gg.fillStyle='#0d1a2b'; gg.fillRect(0,0,W,H); for(let r=0;r<5;r++) for(let c=0;c<4;c++){ gg.fillStyle=pick(['#e63b2e','#2f9e57','#ffd23f','#5ce1ff','#f2f5ff']); gg.fillRect(8+c*43,10+r*66,34,54); } })}),0,1.1,0.36,0,g);
    bbox(0.28,0.5,0.06,std(0x16181f),0.28,0.6,0.37,g); return {fw:1.0,fd:0.8}; }
  if(id.indexOf('bild_')===0){
    const M={
      bild_raketen:{w:1.2,h:0.9,frame:0x6b4a2c,draw:(c,W,H)=>{
        const gr=c.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#0a1030'); gr.addColorStop(1,'#1d2a55');
        c.fillStyle=gr; c.fillRect(0,0,W,H);
        for(let i=0;i<120;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.7})`; c.fillRect(Math.random()*W,Math.random()*H*0.7,1.6,1.6); }
        burst(c,W*0.32,H*0.34,W*0.18,'#ffd23f',18); burst(c,W*0.68,H*0.26,W*0.13,'#ff4fa3',14); burst(c,W*0.52,H*0.5,W*0.09,'#5ce1ff',12);
        c.fillStyle='#070a18'; c.fillRect(0,H*0.78,W,H*0.22);
        for(let i=0;i<9;i++){ c.fillStyle='#0d1225'; c.fillRect(i*W/9+4,H*0.62+Math.random()*30,W/9-8,H*0.4); } }},
      bild_stadt:{w:1.5,h:0.95,frame:0x2a2e38,draw:(c,W,H)=>{
        const gr=c.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#101a3a'); gr.addColorStop(0.6,'#3a2a5a'); gr.addColorStop(1,'#120c1e');
        c.fillStyle=gr; c.fillRect(0,0,W,H);
        burst(c,W*0.24,H*0.28,W*0.14,'#ff5a4a',16); burst(c,W*0.5,H*0.2,W*0.17,'#ffd23f',20); burst(c,W*0.76,H*0.32,W*0.12,'#8ef0a8',14);
        c.fillStyle='#0a0c18';
        for(let i=0;i<16;i++){ const w=W/16, h=rand(H*0.18,H*0.42); c.fillRect(i*w,H-h,w-3,h);
          for(let k=0;k<10;k++){ c.fillStyle=Math.random()<0.6?'#ffcf7a':'#0a0c18'; c.fillRect(i*w+4+(k%3)*8,H-h+6+Math.floor(k/3)*12,5,8); c.fillStyle='#0a0c18'; } }
        c.fillStyle='rgba(255,210,63,.12)'; c.fillRect(0,H*0.6,W,H*0.4); }},
      bild_sortiment:{w:1.1,h:1.4,frame:0xc9a24a,draw:(c,W,H)=>{
        c.fillStyle='#f4efe2'; c.fillRect(0,0,W,H);
        c.fillStyle='#c8322a'; c.fillRect(0,0,W,H*0.14);
        c.fillStyle='#fff'; c.font=BUN(Math.round(W*0.11)); c.textAlign='center'; c.textBaseline='middle';
        c.fillText('SORTIMENT',W/2,H*0.07);
        const rows=['Raketen','Batterien','Böller','Fontänen','Zubehör','Sekt'];
        rows.forEach((t,i)=>{ const y=H*0.2+i*H*0.125;
          c.fillStyle=i%2?'#e8e2d2':'#f4efe2'; c.fillRect(0,y,W,H*0.12);
          c.fillStyle='#1b2340'; c.font=BAR(Math.round(W*0.085)); c.textAlign='left'; c.fillText(t,W*0.08,y+H*0.062);
          c.fillStyle='#c8322a'; c.textAlign='right'; c.fillText('★'.repeat(1+(i%4)),W*0.92,y+H*0.062); }); }},
      bild_meister:{w:1.3,h:1.6,frame:0xd8b45a,draw:(c,W,H)=>{
        const gr=c.createRadialGradient(W/2,H*0.4,10,W/2,H*0.5,W*0.8);
        gr.addColorStop(0,'#3a3020'); gr.addColorStop(1,'#0e0c08'); c.fillStyle=gr; c.fillRect(0,0,W,H);
        c.fillStyle='#2a2118'; c.beginPath(); c.ellipse(W/2,H*0.78,W*0.34,H*0.24,0,0,Math.PI*2); c.fill();
        c.fillStyle='#d9a878'; c.beginPath(); c.ellipse(W/2,H*0.42,W*0.17,H*0.13,0,0,Math.PI*2); c.fill();
        c.fillStyle='#1c1a16'; c.beginPath(); c.ellipse(W/2,H*0.34,W*0.19,H*0.08,0,0,Math.PI*2); c.fill();
        c.fillStyle='#6b5a44'; c.beginPath(); c.ellipse(W/2,H*0.5,W*0.13,H*0.05,0,0,Math.PI*2); c.fill();
        c.fillStyle='#2a2118'; c.beginPath(); c.arc(W*0.44,H*0.41,W*0.018,0,Math.PI*2); c.arc(W*0.56,H*0.41,W*0.018,0,Math.PI*2); c.fill();
        burst(c,W*0.2,H*0.18,W*0.1,'#ffd23f',14); burst(c,W*0.8,H*0.2,W*0.08,'#ff7a3d',12);
        c.fillStyle='#e0c07a'; c.font=BUN(Math.round(W*0.09)); c.textAlign='center'; c.fillText('DER MEISTER',W/2,H*0.94); }}
    }[id];
    const t=tex(Math.round(M.w*300),Math.round(M.h*300),M.draw);
    const fr=std(M.frame,{metalness:0.35,roughness:0.5});
    bbox(M.w+0.1,M.h+0.1,0.05,fr,0,1.75,0,g,false);
    bbox(M.w+0.02,M.h+0.02,0.02,std(0x1a1a1a),0,1.75,0.026,g,false);
    plane(M.w,M.h,new THREE.MeshStandardMaterial({map:t,roughness:0.55}),0,1.75,0.037,0,g);
    bbox(M.w*0.55,0.05,0.14,fr,0,1.75+M.h/2+0.14,0.06,g,false);
    const lm=new THREE.MeshStandardMaterial({color:LIN(0xf5f2e8),emissive:LIN(0xfff0cc),emissiveIntensity:0.5});
    bbox(M.w*0.5,0.03,0.08,lm,0,1.75+M.h/2+0.1,0.1,g,false);
    return {fw:0,fd:0,wall:true};
  }
  return {fw:0.5,fd:0.5};
}
/* Nur Plaetze in Raeumen, die schon freigeschaltet sind */
function spotsOffen(a){ const f=a.filter(s=>!s.zone||zoneOffen(s.zone)); return f.length?f:a; }
function wallSpot(i){ const a=spotsOffen(WALLSPOTS), s=a[i%a.length]; return {x:s.x,z:s.z,ry:s.ry}; }
function dekoSpot(i){ const a=spotsOffen(DEKOSPOTS), s=a[i%a.length]; return {x:s.x,z:s.z,ry:0}; }
function createDeko(id,pos){
  const D0=DEKO.find(x=>x.id===id)||{};
  const g=new THREE.Group();
  const p=pos||(D0.wall?wallSpot(dekos.filter(d=>{ const X=DEKO.find(y=>y.id===d.id); return X&&X.wall; }).length):dekoSpot(dekos.length));
  g.position.set(p.x,0,p.z); g.rotation.y=p.ry||0; scene.add(g);
  const f=makeDekoMesh(id,g);
  const D=DEKO.find(x=>x.id===id)||{name:id};
  const d={id,g,mov:null};
  d.mov=addMovable({kind:'deko',name:D.name,g,fw:f.fw,fd:f.fd,ref:d});
  dekos.push(d); return d;
}
function hasDeko(id){ return dekos.some(d=>d.id===id); }

/* =========================================================
   Dreck
   ========================================================= */
const dirts=[];
const dirtTex=tex(64,64,(g,W,H)=>{ g.clearRect(0,0,W,H); for(let i=0;i<14;i++){ g.fillStyle=`rgba(${60+Math.random()*40},${50+Math.random()*30},${40+Math.random()*25},${0.35+Math.random()*0.35})`; g.beginPath(); g.ellipse(rand(14,50),rand(14,50),rand(4,13),rand(4,11),Math.random()*3,0,Math.PI*2); g.fill(); } });
const dirtMat=new THREE.MeshBasicMaterial({map:dirtTex,transparent:true,depthWrite:false,opacity:0.85});
/* Dreck faellt dort an, wo gelaufen wird - also in dem Raum, in dem
   der Kunde gerade steht, nicht immer im Basisladen. */
function dreckRaum(x,z){
  const R=[LAY.basis];
  if(zoneOffen('shop_gross')) R.push(LAY.ost1);
  if(zoneOffen('shop_ost'))   R.push(LAY.ost2);
  if(zoneOffen('shop_sued'))  R.push(LAY.sued);
  let best=R[0],bd=1e9;
  for(const r of R){ const dx=Math.max(r.x0-x,0,x-r.x1), dz=Math.max(r.z0-z,0,z-r.z1), d=dx*dx+dz*dz;
    if(d<bd){ bd=d; best=r; } }
  return best;
}
function addDirt(x,z){
  if(dirts.length>13) return;
  const r=dreckRaum(x,z);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.55),dirtMat); m.rotation.x=-Math.PI/2; m.rotation.z=Math.random()*3;
  m.position.set(clamp(x,r.x0+0.5,r.x1-0.5),0.028,clamp(z,r.z0+0.5,r.z1-0.5)); m.renderOrder=3; scene.add(m);
  const hit=bbox(0.6,0.5,0.6,hitM,m.position.x,0.25,m.position.z,null,false);
  const d={m,hit,work:0}; hit.userData={kind:'dirt',ref:d}; dirts.push(d); return d;
}
function removeDirt(d){ const i=dirts.indexOf(d); if(i<0) return; dirts.splice(i,1); scene.remove(d.m); scene.remove(d.hit); }
function nearestDirt(p,maxD){ let b=null,bd=maxD||99; for(const d of dirts){ const dist=Math.hypot(d.m.position.x-p.x,d.m.position.z-p.z); if(dist<bd){ bd=dist; b=d; } } return b; }

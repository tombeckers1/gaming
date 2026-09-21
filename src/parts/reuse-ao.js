const aoTex=tex(8,64,(g,W,H)=>{ const gr=g.createLinearGradient(0,H,0,0); gr.addColorStop(0,'#fff'); gr.addColorStop(0.35,'#777'); gr.addColorStop(1,'#000'); g.fillStyle=gr; g.fillRect(0,0,W,H); },false);
const aoMatF=new THREE.MeshBasicMaterial({color:0x000000,alphaMap:aoTex,transparent:true,opacity:0.42,depthWrite:false});
const aoMatW=new THREE.MeshBasicMaterial({color:0x000000,alphaMap:aoTex,transparent:true,opacity:0.3,depthWrite:false});
function aoFloor(cx,cz,len,depth,dir,y,ceil){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(len,depth),aoMatF);
  const th=ceil?{'-z':0,'+z':Math.PI,'+x':Math.PI/2,'-x':-Math.PI/2}[dir]:{'+z':0,'-z':Math.PI,'-x':-Math.PI/2,'+x':Math.PI/2}[dir];
  m.rotation.set(ceil?Math.PI/2:-Math.PI/2,0,th); m.position.set(cx,y,cz); m.renderOrder=1; scene.add(m);
}
function aoCorner(cx,cz,nx,nz,ax,az,h){ // Ecke (cx,cz), Wand-Normale n, Richtung weg von der Ecke a
  const w=0.45, m=new THREE.Mesh(new THREE.PlaneGeometry(h,w),aoMatW), ry=Math.atan2(nx,nz);
  const lx=Math.cos(ry), lz=-Math.sin(ry), dot=lx*(-ax)+lz*(-az);
  m.rotation.set(0,ry,dot>0?Math.PI/2:-Math.PI/2);
  m.position.set(cx+ax*w/2+nx*0.012,h/2,cz+az*w/2+nz*0.012); m.renderOrder=1; scene.add(m);
}
function roomAO(x0,x1,z0,z1){
  const d=0.4, y=0.021, yc=WH-0.02;
  aoFloor((x0+x1)/2,z0+d/2,x1-x0,d,'-z',y); aoFloor((x0+x1)/2,z1-d/2,x1-x0,d,'+z',y);
  aoFloor(x0+d/2,(z0+z1)/2,z1-z0,d,'-x',y); aoFloor(x1-d/2,(z0+z1)/2,z1-z0,d,'+x',y);
  aoFloor((x0+x1)/2,z0+d/2,x1-x0,d,'-z',yc,true); aoFloor((x0+x1)/2,z1-d/2,x1-x0,d,'+z',yc,true);
  aoFloor(x0+d/2,(z0+z1)/2,z1-z0,d,'-x',yc,true); aoFloor(x1-d/2,(z0+z1)/2,z1-z0,d,'+x',yc,true);
  const c=[[x0,z0],[x1,z0],[x0,z1],[x1,z1]];
  for(const [cx,cz] of c){ const sx=cx===x0?1:-1, sz=cz===z0?1:-1;
    aoCorner(cx,cz,0,sz,sx,0,WH); aoCorner(cx,cz,sx,0,0,sz,WH); }
}
function floorTex(){ const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#9a9690'; g.fillRect(0,0,W,H);
  for(let i=0;i<2;i++) for(let j=0;j<2;j++){ const v=186+Math.floor(Math.random()*10); g.fillStyle=`rgb(${v},${v-5},${v-14})`; g.fillRect(i*128+1,j*128+1,126,126);
    for(let k=0;k<60;k++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.04})`; g.fillRect(i*128+Math.random()*124,j*128+Math.random()*124,3,3); } } });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
function concreteTex(){ const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#8a8e94'; g.fillRect(0,0,W,H); for(let i=0;i<2500;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=2; g.strokeRect(0,0,W,H); });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
function flat(w,d,m,x,y,z){ const o=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m); o.rotation.x=-Math.PI/2; o.position.set(x,y,z); if(HIQ) o.receiveShadow=true; scene.add(o); return o; }


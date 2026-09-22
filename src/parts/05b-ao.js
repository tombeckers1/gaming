const aoTex=tex(8,64,(g,W,H)=>{ const gr=g.createLinearGradient(0,H,0,0); gr.addColorStop(0,'#fff'); gr.addColorStop(0.35,'#777'); gr.addColorStop(1,'#000'); g.fillStyle=gr; g.fillRect(0,0,W,H); },false);
const aoMatF=new THREE.MeshBasicMaterial({color:0x000000,alphaMap:aoTex,transparent:true,opacity:0.42,depthWrite:false});
const aoMatW=new THREE.MeshBasicMaterial({color:0x000000,alphaMap:aoTex,transparent:true,opacity:0.3,depthWrite:false});
function aoFloor(cx,cz,len,depth,dir,y,ceil){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(len,depth),aoMatF);
  const th=ceil?{'-z':0,'+z':Math.PI,'+x':Math.PI/2,'-x':-Math.PI/2}[dir]:{'+z':0,'-z':Math.PI,'-x':-Math.PI/2,'+x':Math.PI/2}[dir];
  m.rotation.set(ceil?Math.PI/2:-Math.PI/2,0,th); m.position.set(cx,y,cz); m.renderOrder=1; scene.add(m);
  return m;
}
function aoCorner(cx,cz,nx,nz,ax,az,h){ // Ecke (cx,cz), Wand-Normale n, Richtung weg von der Ecke a
  const w=0.45, m=new THREE.Mesh(new THREE.PlaneGeometry(h,w),aoMatW), ry=Math.atan2(nx,nz);
  const lx=Math.cos(ry), lz=-Math.sin(ry), dot=lx*(-ax)+lz*(-az);
  m.rotation.set(0,ry,dot>0?Math.PI/2:-Math.PI/2);
  m.position.set(cx+ax*w/2+nx*0.012,h/2,cz+az*w/2+nz*0.012); m.renderOrder=1; scene.add(m);
}
/* seiten sagt, an welchen Kanten wirklich dauerhaft eine Wand
   steht. Ohne das lag der Bodenschatten auch an einer Kante, die
   beim Kauf faellt - im fertigen Laden standen dann zwei dunkle
   Baender mit einem hellen Spalt dazwischen quer im Raum, genau
   dort, wo frueher die Wand war. Ohne Angabe bleibt es wie bisher
   bei allen vier Seiten. */
function roomAO(x0,x1,z0,z1,zoneId,seiten){
  const d=0.4, y=0.021;
  const S2=seiten||{n:true,s:true,w:true,e:true};
  const reg=m=>{ if(zoneId) zAdd(zoneId,m); return m; };
  if(S2.s) reg(aoFloor((x0+x1)/2,z0+d/2,x1-x0,d,'-z',y));
  if(S2.n) reg(aoFloor((x0+x1)/2,z1-d/2,x1-x0,d,'+z',y));
  if(S2.w) reg(aoFloor(x0+d/2,(z0+z1)/2,z1-z0,d,'-x',y));
  if(S2.e) reg(aoFloor(x1-d/2,(z0+z1)/2,z1-z0,d,'+x',y));
  /* Keine Baender an der Decke und keine Streifen in den Wandecken:
     die gaben harte Kanten, die wie ein Balken an der Wand aussahen. */
}
function concreteTex(){ const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#8a8e94'; g.fillRect(0,0,W,H); for(let i=0;i<2500;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=2; g.strokeRect(0,0,W,H); });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }
function flat(w,d,m,x,y,z){ const o=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m); o.rotation.x=-Math.PI/2; o.position.set(x,y,z); if(HIQ) o.receiveShadow=true; scene.add(o); return o; }

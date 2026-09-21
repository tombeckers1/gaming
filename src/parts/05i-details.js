
/* =========================================================
   Oberflächenrelief und Ladendetails
   ========================================================= */
/* Normal-Map aus einer Höhenzeichnung (Sobel) */
function normalMapFrom(w,h,draw,strength){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d'); draw(g,w,h);
  let src;
  try{ src=g.getImageData(0,0,w,h).data; }catch(e){ return null; }
  const out=g.createImageData(w,h), d=out.data, st=strength===undefined?2:strength;
  const at=(x,y)=>{ x=(x+w)%w; y=(y+h)%h; const i=(y*w+x)*4; return (src[i]+src[i+1]+src[i+2])/765; };
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const dx=(at(x+1,y)-at(x-1,y))*st, dy=(at(x,y+1)-at(x,y-1))*st;
    const nx=-dx, ny=-dy, nz=1, l=Math.sqrt(nx*nx+ny*ny+1);
    const i=(y*w+x)*4;
    d[i]=(nx/l*0.5+0.5)*255; d[i+1]=(ny/l*0.5+0.5)*255; d[i+2]=(nz/l*0.5+0.5)*255; d[i+3]=255;
  }
  g.putImageData(out,0,0);
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t;
}
function noiseHeight(scale,lines){
  return (g,W,H)=>{
    g.fillStyle='#808080'; g.fillRect(0,0,W,H);
    for(let i=0;i<W*H*0.5;i++){ const v=128+(Math.random()-0.5)*scale;
      g.fillStyle=`rgb(${v|0},${v|0},${v|0})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
    for(let i=0;i<24;i++){ g.strokeStyle=`rgba(${Math.random()<0.5?90:180},${Math.random()<0.5?90:180},${Math.random()<0.5?90:180},.5)`;
      g.lineWidth=rand(1,3); let x=Math.random()*W, y=Math.random()*H;
      g.beginPath(); g.moveTo(x,y);
      for(let k=0;k<5;k++){ x+=rand(-40,40); y+=rand(-40,40); g.lineTo(x,y); } g.stroke(); }
    if(lines){ for(let y=0;y<H;y+=H/lines){ g.fillStyle='#5a5a5a'; g.fillRect(0,y,W,2); g.fillStyle='#a0a0a0'; g.fillRect(0,y+2,W,1); } }
  };
}
let floorNormal=null, wallNormal=null;
function applyReliefs(){
  if(S&&floorMat){
    floorNormal=normalMapFrom(256,256,(g,W,H)=>paintFloor(g,W,H,floorSet()),1.6);
    if(floorNormal){ floorNormal.wrapS=floorNormal.wrapT=THREE.RepeatWrapping;
      floorNormal.repeat.copy(floorTexRef.repeat);
      floorMat.normalMap=floorNormal; floorMat.normalScale=new THREE.Vector2(0.55,0.55); floorMat.needsUpdate=true; }
  }
  if(shopWall&&!wallNormal){
    wallNormal=normalMapFrom(256,256,noiseHeight(26),1.1);
    if(wallNormal){ wallNormal.wrapS=wallNormal.wrapT=THREE.RepeatWrapping; wallNormal.repeat.set(1.25,1.25);
      shopWall.normalMap=wallNormal; shopWall.normalScale=new THREE.Vector2(0.4,0.4); shopWall.needsUpdate=true;
      if(shopUpper){ shopUpper.normalMap=wallNormal; shopUpper.normalScale=new THREE.Vector2(0.35,0.35); shopUpper.needsUpdate=true; }
      if(shopLower){ shopLower.normalMap=wallNormal; shopLower.normalScale=new THREE.Vector2(0.35,0.35); shopLower.needsUpdate=true; } }
  }
}

function buildDetails(){ applyReliefs(); }

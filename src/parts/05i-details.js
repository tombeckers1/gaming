
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


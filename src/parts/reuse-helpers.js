const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rand=(a,b)=>a+Math.random()*(b-a);
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const eur=v=>(Math.round(v*100)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
const r2=v=>Math.round(v*100)/100;
const $=id=>document.getElementById(id);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const COARSE=!!(window.matchMedia&&matchMedia('(pointer: coarse)').matches);
const HIQ=!COARSE;
if(COARSE) document.body.classList.add('coarse');
const KEY='boellerbude_v3';
const LIN=h=>new THREE.Color(h).convertSRGBToLinear();
function std(hex,o){ const m=new THREE.MeshStandardMaterial(Object.assign({roughness:0.85,metalness:0},o||{})); m.color=LIN(hex); return m; }
function tex(w,h,draw,srgb){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.anisotropy=4; if(srgb!==false) t.encoding=THREE.sRGBEncoding; return t; }
function redraw(t,draw){ const c=t.image; draw(c.getContext('2d'),c.width,c.height); t.needsUpdate=true; }
function tm(x,y,z,rx,ry,rz,sx,sy,sz){ const m=new THREE.Matrix4(); m.compose(V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),V(sx||1,sy||1,sz||1)); return m; }
function merge(parts){
  let total=0;
  const gs=parts.map(p=>{ const g=p.geo.index?p.geo.toNonIndexed():p.geo.clone(); g.applyMatrix4(p.m); total+=g.attributes.position.count; return {g,c:p.color}; });
  const pos=new Float32Array(total*3), nor=new Float32Array(total*3), uv=new Float32Array(total*2), col=new Float32Array(total*3); let o=0;
  for(const {g,c} of gs){
    const n=g.attributes.position.count;
    pos.set(g.attributes.position.array,o*3); nor.set(g.attributes.normal.array,o*3);
    if(g.attributes.uv) uv.set(g.attributes.uv.array,o*2);
    const cc=LIN(c===undefined?0xffffff:c);
    for(let i=0;i<n;i++){ col[(o+i)*3]=cc.r; col[(o+i)*3+1]=cc.g; col[(o+i)*3+2]=cc.b; }
    o+=n; g.dispose();
  }
  const out=new THREE.BufferGeometry();
  out.setAttribute('position',new THREE.BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  out.setAttribute('uv',new THREE.BufferAttribute(uv,2)); out.setAttribute('color',new THREE.BufferAttribute(col,3));
  out.computeBoundingSphere(); return out;
}
function atlasBox(w,h,d,R){
  const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv, faces=['side','side','top','top','front','front'];
  for(let f=0;f<6;f++){ const r=R[faces[f]]; for(let i=0;i<4;i++){ const k=f*4+i, u=uv.getX(k), v=uv.getY(k); uv.setXY(k,r[0]+u*(r[2]-r[0]),r[1]+v*(r[3]-r[1])); } }
  return g;
}
function fitFont(g,text,maxW,size,fam){ let s=size; do{ g.font=fam(s); if(g.measureText(text).width<=maxW) break; s-=1; }while(s>6); return s; }
const BUN=s=>`${s}px Bungee, Impact, sans-serif`, BAR=s=>`700 ${s}px "Barlow Condensed", sans-serif`;


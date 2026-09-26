class ItemPool{
  constructor(parts,cap){
    this.cap=cap; this.h=[];
    this.meshes=parts.map(p=>{ const m=new THREE.InstancedMesh(p.geo,p.mat,cap); m.count=0; m.frustumCulled=false; m.castShadow=HIQ&&!p.mat.transparent; m.receiveShadow=HIQ; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); return m; });
  }
  full(){ return this.h.length>=this.cap; }
  add(mx){ const h={i:this.h.length,m:mx.clone(),pool:this}; this.h.push(h); for(const me of this.meshes){ me.setMatrixAt(h.i,mx); me.count=this.h.length; me.instanceMatrix.needsUpdate=true; } return h; }
  remove(h){ if(!h||this.h[h.i]!==h) return; const last=this.h.pop(); if(last!==h){ this.h[h.i]=last; last.i=h.i; for(const me of this.meshes) me.setMatrixAt(h.i,last.m); } for(const me of this.meshes){ me.count=this.h.length; me.instanceMatrix.needsUpdate=true; } }
  set(h,mx){ if(this.h[h.i]!==h) return; h.m.copy(mx); for(const me of this.meshes){ me.setMatrixAt(h.i,mx); me.instanceMatrix.needsUpdate=true; } }
}
/* Pools entstehen erst, wenn die Ware zum ersten Mal gebraucht wird
   (Tom, 26.09.: Sortiment mal drei). Vorher baute der Start fuer jedes
   Produkt Modell und Verpackung - bei 228 Produkten ueber 200 Megapixel
   Texturen, auch fuer Ware, die erst zwanzig Level spaeter kommt. */
const _pools={};
const pools=new Proxy(_pools,{get(o,k){
  if(typeof k==='string'&&!(k in o)&&typeof P!=='undefined'&&P[k]&&P[k].dims) o[k]=new ItemPool(buildProduct(k),poolCap(k));
  return o[k]; }});
function poolDa(t){ return t in _pools; }
const _q=new THREE.Quaternion(), _e=new THREE.Euler(), _one=V(1,1,1);
function mx(x,y,z,ry){ _e.set(0,ry||0,0); _q.setFromEuler(_e); return new THREE.Matrix4().compose(V(x,y,z),_q,_one); }

/* So viele Stueck, wie ein volles Fach im breitesten Regal fasst - je
   Stellplatz einmal. Seit die Ware das Fach ganz fuellt, rechnet das
   mit der vollen Regalbreite statt mit dem Gitter im Produkt. */
function poolCap(t){ const p=P[t], g=p.grid, gap=0.012;
  const cols=Math.max(1,Math.floor((2.0-0.1+gap)/(p.dims[0]+gap)));
  return Math.min(1600,cols*g[1]*g[2]*SLOTS.length+60); }

/* Kartons */
const kartonGeo=new THREE.BoxGeometry(0.6,0.4,0.45);
const kartonMat={};
function buildKartons(){
  ORDER.forEach(t=>{ const p=P[t];
    kartonMat[t]=new THREE.MeshStandardMaterial({roughness:0.9,map:tex(256,256,(g,W,H)=>{
      g.fillStyle='#c89b5c'; g.fillRect(0,0,W,H);
      for(let i=0;i<500;i++){ g.fillStyle=`rgba(90,60,20,${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
      g.fillStyle='rgba(120,80,30,.25)'; g.fillRect(0,0,W,6); g.fillRect(0,H-6,W,6); g.fillRect(0,0,6,H); g.fillRect(W-6,0,6,H);
      g.fillStyle='#b58a4f'; g.fillRect(W*0.44,0,W*0.12,H);
      g.fillStyle='#f7f3ea'; g.fillRect(W*0.08,H*0.14,W*0.84,H*0.34);
      g.fillStyle=p.art.bg1; g.fillRect(W*0.08,H*0.14,W*0.84,H*0.07);
      g.fillStyle='#16181f'; g.textAlign='center'; g.textBaseline='middle';
      fitFont(g,p.name,W*0.78,34,BAR); g.fillText(p.name,W/2,H*0.3);
      g.font=BAR(20); g.fillText(`${p.box} Stück, ${p.cat?'Kategorie F'+p.cat:SPARTE_NAME[p.sparte||'zubehoer']}`,W/2,H*0.42);
      if(p.cat){ g.save(); g.translate(W*0.24,H*0.72); g.rotate(Math.PI/4); g.fillStyle='#f28a1c'; g.fillRect(-26,-26,52,52); g.strokeStyle='#16181f'; g.lineWidth=3; g.strokeRect(-22,-22,44,44); g.restore();
        g.fillStyle='#16181f'; g.font=BUN(16); g.fillText('1.4G',W*0.24,H*0.73);
        g.font=BAR(20); g.textAlign='left'; g.fillText('Vorsicht,',W*0.42,H*0.68); g.fillText('explosiv',W*0.42,H*0.77); }
      else { g.fillStyle='#16181f'; g.font=BAR(22); g.textAlign='left'; g.fillText(p.cold?'Kühl lagern':p.sparte==='essen'?'Lebensmittel · trocken lagern':'Bitte trocken lagern',W*0.16,H*0.73); }
    })});
  });
}

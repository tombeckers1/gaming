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
const pools={};
const _q=new THREE.Quaternion(), _e=new THREE.Euler(), _one=V(1,1,1);
function mx(x,y,z,ry){ _e.set(0,ry||0,0); _q.setFromEuler(_e); return new THREE.Matrix4().compose(V(x,y,z),_q,_one); }


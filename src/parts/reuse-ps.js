const dotTex=tex(64,64,(g,W,H)=>{ const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.35,'rgba(255,255,255,.7)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H); },false);
class PS{
  constructor(max,size){
    this.max=max; this.pos=new Float32Array(max*3); this.col=new Float32Array(max*3); this.vel=new Float32Array(max*3); this.base=new Float32Array(max*3);
    this.life=new Float32Array(max); this.maxl=new Float32Array(max); this.grav=new Float32Array(max); this.next=0; this.dirty=false;
    for(let i=0;i<max;i++) this.pos[i*3+1]=-999;
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.pos,3)); g.setAttribute('color',new THREE.BufferAttribute(this.col,3)); this.geo=g;
    this.pts=new THREE.Points(g,new THREE.PointsMaterial({size,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false}));
    this.pts.frustumCulled=false; scene.add(this.pts);
  }
  emit(x,y,z,vx,vy,vz,r,g,b,life,grav){ const i=this.next; this.next=(i+1)%this.max; const j=i*3;
    this.pos[j]=x; this.pos[j+1]=y; this.pos[j+2]=z; this.vel[j]=vx; this.vel[j+1]=vy; this.vel[j+2]=vz;
    this.base[j]=r; this.base[j+1]=g; this.base[j+2]=b; this.life[i]=life; this.maxl[i]=life; this.grav[i]=grav; }
  update(dt){
    const drag=Math.max(0,1-1.1*dt); let any=false;
    for(let i=0;i<this.max;i++){
      if(this.life[i]<=0) continue; any=true; const j=i*3;
      this.life[i]-=dt;
      if(this.life[i]<=0){ this.pos[j+1]=-999; this.col[j]=this.col[j+1]=this.col[j+2]=0; continue; }
      this.vel[j]*=drag; this.vel[j+1]=this.vel[j+1]*drag-this.grav[i]*dt; this.vel[j+2]*=drag;
      this.pos[j]+=this.vel[j]*dt; this.pos[j+1]+=this.vel[j+1]*dt; this.pos[j+2]+=this.vel[j+2]*dt;
      const k=(this.life[i]/this.maxl[i])*(0.7+Math.random()*0.3);
      this.col[j]=this.base[j]*k; this.col[j+1]=this.base[j+1]*k; this.col[j+2]=this.base[j+2]*k;
    }
    if(any||this.dirty){ this.geo.attributes.position.needsUpdate=true; this.geo.attributes.color.needsUpdate=true; }
    this.dirty=any;
  }
}

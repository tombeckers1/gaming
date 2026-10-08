/* Minimal THREE-Stub nur fuer den Logik-Smoketest (kein Rendering) */
(function(){
const T={};
class Vector3{ project(){ this.x=0; this.y=0; this.z=0.5; return this; } lerpVectors(a,b,t){this.x=a.x+(b.x-a.x)*t;this.y=a.y+(b.y-a.y)*t;this.z=a.z+(b.z-a.z)*t;return this;} toArray(){return [this.x,this.y,this.z];}

  constructor(x,y,z){this.x=x||0;this.y=y||0;this.z=z||0;}
  subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;}
  addVectors(a,b){this.x=a.x+b.x;this.y=a.y+b.y;this.z=a.z+b.z;return this;}
  crossVectors(a,b){const x=a.y*b.z-a.z*b.y,y=a.z*b.x-a.x*b.z,z=a.x*b.y-a.y*b.x;this.x=x;this.y=y;this.z=z;return this;}
  fromArray(a,o){o=o||0;this.x=a[o];this.y=a[o+1];this.z=a[o+2];return this;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
  clone(){return new Vector3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  length(){return Math.hypot(this.x,this.y,this.z);}
  normalize(){const l=this.length()||1;this.x/=l;this.y/=l;this.z/=l;return this;}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  setScalar(s){this.x=this.y=this.z=s;return this;}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  applyQuaternion(){return this;}
  lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this;}
  fromBufferAttribute(a,i){this.x=a.getX(i);this.y=a.getY(i);this.z=a.getZ?a.getZ(i):0;return this;}
  cross(v){const x=this.y*v.z-this.z*v.y,y=this.z*v.x-this.x*v.z,z=this.x*v.y-this.y*v.x;this.x=x;this.y=y;this.z=z;return this;}
  divideScalar(s){return this.multiplyScalar(1/(s||1));}
}
class Vector2{constructor(x,y){this.x=x||0;this.y=y||0;}
  set(x,y){this.x=x;this.y=y;return this;}
  copy(v){this.x=v.x;this.y=v.y;return this;}
  clone(){return new Vector2(this.x,this.y);}}
class Euler{constructor(x,y,z){this.x=x||0;this.y=y||0;this.z=z||0;this.order='XYZ';}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  copy(e){this.x=e.x;this.y=e.y;this.z=e.z;return this;}
  clone(){return new Euler(this.x,this.y,this.z);}}
class Quaternion{constructor(){this.x=this.y=this.z=0;this.w=1;} setFromEuler(e){this._e=e;return this;} setFromUnitVectors(a,b){this._von=a;this._nach=b.clone?b.clone():b;return this;}
  clone(){const q=new Quaternion();Object.assign(q,this);return q;} multiply(){return this;} premultiply(){return this;} slerp(){return this;}
  copy(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;return this;}
  setFromAxisAngle(a,t){const s=Math.sin(t/2);this.x=a.x*s;this.y=a.y*s;this.z=a.z*s;this.w=Math.cos(t/2);return this;}}
class Matrix4{constructor(){this.elements=new Array(16).fill(0);}
  compose(p,q,s){this.p=p.clone?p.clone():p;this.s=s;return this;}
  clone(){const m=new Matrix4();m.p=this.p;m.s=this.s;return m;}
  copy(o){this.p=o.p;this.s=o.s;return this;}
  decompose(p,q,s){if(this.p)p.copy(this.p);if(this.s&&s.copy)s.copy(this.s);return this;}
  makeRotationX(){return this;} makeRotationY(){return this;} makeRotationZ(){return this;} makeScale(x,y,z){this.s=new Vector3(x,y,z);return this;} makeTranslation(x,y,z){this.p=new Vector3(x,y,z);return this;}
  setPosition(x,y,z){this.p=x&&x.isVector3?x.clone():new Vector3(x,y,z);return this;} multiply(){return this;} multiplyMatrices(){return this;} invert(){return this;} premultiply(){return this;} identity(){return this;}}
class Color{
  constructor(c){this.r=1;this.g=1;this.b=1;if(c!==undefined)this.set(c);}
  set(c){if(typeof c==='number'){this.r=((c>>16)&255)/255;this.g=((c>>8)&255)/255;this.b=(c&255)/255;}
    else if(typeof c==='string'&&c[0]==='#'){const h=parseInt(c.slice(1),16);this.r=((h>>16)&255)/255;this.g=((h>>8)&255)/255;this.b=(h&255)/255;}return this;}
  setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this;}
  setHex(h){return this.set(h);}
  copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this;}
  clone(){const c=new Color();return c.copy(this);}
  lerp(c,a){this.r+=(c.r-this.r)*a;this.g+=(c.g-this.g)*a;this.b+=(c.b-this.b)*a;return this;}
  multiplyScalar(s){this.r*=s;this.g*=s;this.b*=s;return this;}
  convertSRGBToLinear(){return this;}
  getHexString(){const f=v=>('0'+Math.round(Math.max(0,Math.min(1,v))*255).toString(16)).slice(-2);return f(this.r)+f(this.g)+f(this.b);}
  getHex(){return Math.round(this.r*255)*65536+Math.round(this.g*255)*256+Math.round(this.b*255);}
}
class Uniform{constructor(v){this.value=v;}}
class BufferAttribute{
  constructor(arr,item){this.array=arr;this.itemSize=item;this.count=arr.length/item;this.needsUpdate=false;this.updateRange={offset:0,count:-1};}
  getX(i){return this.array[i*this.itemSize];}
  getY(i){return this.array[i*this.itemSize+1];}
  getZ(i){return this.array[i*this.itemSize+2];}
  setXY(i,x,y){this.array[i*this.itemSize]=x;this.array[i*this.itemSize+1]=y;}
  setX(i,v){this.array[i*this.itemSize]=v;} setY(i,v){this.array[i*this.itemSize+1]=v;} setZ(i,v){this.array[i*this.itemSize+2]=v;}
  setXYZ(i,x,y,z){const o=i*this.itemSize;this.array[o]=x;this.array[o+1]=y;this.array[o+2]=z;}
  setUsage(){return this;}
}
class Float32BufferAttribute extends BufferAttribute{constructor(a,i){super(a instanceof Float32Array?a:new Float32Array(a),i);}}
class BufferGeometry{
  constructor(n){this.attributes={};this.index=null;this._n=n||24;this.userData={};}
  deleteAttribute(k){delete this.attributes[k];return this;}
  setAttribute(k,a){this.attributes[k]=a;return this;}
  getAttribute(k){return this.attributes[k];}
  toNonIndexed(){return this.clone();}
  clone(){const g=new BufferGeometry(this._n);for(const k in this.attributes){const a=this.attributes[k];if(!a||!a.array)continue;g.attributes[k]=new BufferAttribute(a.array.slice(),a.itemSize);}return g;}
  applyMatrix4(){return this;}
  computeBoundingSphere(){this.boundingSphere={radius:1};}
  computeVertexNormals(){const p=this.attributes.position;if(p&&!this.attributes.normal)this.attributes.normal=new BufferAttribute(new Float32Array(p.count*3),3);return this;}
  setIndex(){return this;}
  setDrawRange(a,b){this.drawRange={start:a,count:b};return this;}
  rotateX(){return this;} rotateY(){return this;} rotateZ(){return this;} translate(){return this;} scale(){return this;}
  computeBoundingBox(){this.boundingBox={min:new Vector3(),max:new Vector3()};}
  dispose(){}
}
function mkGeo(n){
  const g=new BufferGeometry(n);
  g.setAttribute('position',new BufferAttribute(new Float32Array(n*3),3));
  g.setAttribute('normal',new BufferAttribute(new Float32Array(n*3),3));
  g.setAttribute('uv',new BufferAttribute(new Float32Array(n*2),2));
  return g;
}
class BoxGeometry extends BufferGeometry{constructor(w,h,d,a,b,c){const n=36*Math.max(1,(a||1)*(b||1));super(n);const g=mkGeo(n);this.attributes=g.attributes;this.parameters={width:w||1,height:h||1,depth:d||1};}}
class PlaneGeometry extends BufferGeometry{constructor(w,h){super(6);const g=mkGeo(6);this.attributes=g.attributes;this.parameters={width:w||1,height:h||1};}}
class CylinderGeometry extends BufferGeometry{constructor(){super(48);const g=mkGeo(48);this.attributes=g.attributes;}}
class SphereGeometry extends BufferGeometry{constructor(r,w,h){super(64);const n=64;const g=mkGeo(n);this.attributes=g.attributes;}}
class ConeGeometry extends CylinderGeometry{}
class TorusGeometry extends CylinderGeometry{}
class CircleGeometry extends PlaneGeometry{}
class DodecahedronGeometry extends SphereGeometry{}
/* Shape und Freiform-Geometrien: nur die Schnittstelle, keine Triangulierung */
class Shape{constructor(pts){this.curves=[];this.holes=[];this.pts=(pts||[]).slice();}
  moveTo(x,y){this.pts.push(new Vector2(x,y));return this;} lineTo(x,y){this.pts.push(new Vector2(x,y));return this;}
  quadraticCurveTo(a,b,x,y){this.pts.push(new Vector2(x,y));return this;} bezierCurveTo(a,b,c,d,x,y){this.pts.push(new Vector2(x,y));return this;}
  absarc(){return this;} arc(){return this;} absellipse(){return this;} closePath(){return this;} getPoints(){return this.pts.slice();}}
class ShapeGeometry extends BufferGeometry{constructor(){super(36);const g=mkGeo(36);this.attributes=g.attributes;}}
class CatmullRomCurve3{constructor(p){this.points=(p||[]).slice();} getPoints(n){const P=this.points,o=[];if(!P.length)return o;for(let i=0;i<=n;i++){o.push(this.getPoint(i/n));}return o;} getSpacedPoints(n){return this.getPoints(n);} getPoint(t,v){const P=this.points,f=Math.max(0,Math.min(1,t))*(P.length-1),i=Math.min(P.length-2,Math.floor(f)),k=f-Math.max(0,i);const a=P[Math.max(0,i)],b=P[Math.min(P.length-1,i+1)];return (v||new Vector3()).set(a.x+(b.x-a.x)*k,a.y+(b.y-a.y)*k,a.z+(b.z-a.z)*k);} getPointAt(t,v){return this.getPoint(t,v);} getTangent(){return new Vector3(0,0,1);} getTangentAt(){return new Vector3(0,0,1);} getLength(){let l=0;const P=this.points;for(let i=1;i<P.length;i++)l+=P[i].distanceTo(P[i-1]);return l;}}
class TubeGeometry extends BufferGeometry{constructor(){super(48);const g=mkGeo(48);this.attributes=g.attributes;}}
class ExtrudeGeometry extends BufferGeometry{constructor(){super(36);const g=mkGeo(36);this.attributes=g.attributes;}}
class Object3D{
  constructor(){this.position=new Vector3();this.rotation=new Euler();this.quaternion=new Quaternion();this.scale=new Vector3(1,1,1);this.children=[];this.parent=null;this.userData={};this.visible=true;this.renderOrder=0;this.matrix=new Matrix4();this.matrixWorld=new Matrix4();}
  rotateX(a){this.rotation&&(this.rotation.x+=a||0);return this;}
  rotateY(a){this.rotation&&(this.rotation.y+=a||0);return this;}
  rotateZ(a){this.rotation&&(this.rotation.z+=a||0);return this;}
  translateX(a){this.position.x+=a||0;return this;}
  translateY(a){this.position.y+=a||0;return this;}
  translateZ(a){this.position.z+=a||0;return this;}
  rotateOnAxis(a){return this;}
  get layers(){ return this._layers||(this._layers={mask:1,set(n){this.mask=1<<n;},enable(){},disable(){},test(){return true;}}); }
  updateMatrix(){ if(!this.matrix) this.matrix=new Matrix4(); return this; }
  add(o){if(o){this.children.push(o);o.parent=this;}return this;}
  remove(o){const i=this.children.indexOf(o);if(i>=0){this.children.splice(i,1);o.parent=null;}return this;}
  updateMatrixWorld(){}
  /* Stub: Weltlage nur aus den Positionen der Kette, ohne Drehung */
  getWorldQuaternion(q){ let a=0,o=this; while(o){ if(o.rotation) a+=o.rotation.y||0; o=o.parent; } q.x=0;q.y=Math.sin(a/2);q.z=0;q.w=Math.cos(a/2); return q; }
  getWorldPosition(v){ v.set(0,0,0); let o=this; while(o){ v.x+=o.position.x; v.y+=o.position.y; v.z+=o.position.z; o=o.parent; } return v; }
  localToWorld(v){ let o=this; while(o){ v.x+=o.position.x; v.y+=o.position.y; v.z+=o.position.z; o=o.parent; } return v; }
  worldToLocal(v){ let o=this; while(o){ v.x-=o.position.x; v.y-=o.position.y; v.z-=o.position.z; o=o.parent; } return v; }
  traverse(cb){ cb(this); for(const c of this.children.slice()) c.traverse(cb); }
}
class Group extends Object3D{}
class Scene extends Object3D{}
class Mesh extends Object3D{constructor(g,m){super();this.geometry=g;this.material=m;this.isMesh=true;}}
class Points extends Object3D{constructor(g,m){super();this.geometry=g;this.material=m;}}
class LineSegments extends Object3D{constructor(g,m){super();this.geometry=g;this.material=m;}}
class InstancedBufferGeometry extends BufferGeometry{constructor(){super();this.instanceCount=Infinity;}}
class InstancedBufferAttribute extends BufferAttribute{constructor(a,i){super(a,i);this.meshPerAttribute=1;}}
class Sprite extends Object3D{constructor(m){super();this.material=m;}}
class InstancedMesh extends Mesh{constructor(g,m,c){super(g,m);this.count=0;this.instanceMatrix=new BufferAttribute(new Float32Array(16*c),16);}
  setMatrixAt(i,m){this._last=m;}}
class Material{clone(){ const m=Object.create(Object.getPrototypeOf(this)); Object.assign(m,this); return m; } constructor(o){Object.assign(this,o||{});if(this.color===undefined)this.color=new Color(0xffffff);else if(typeof this.color==='number')this.color=new Color(this.color);}
  dispose(){}}
class MeshStandardMaterial extends Material{}
class MeshPhysicalMaterial extends MeshStandardMaterial{}
class PMREMGenerator{constructor(){} compileEquirectangularShader(){} fromEquirectangular(t){return {texture:t||{},dispose(){}};} fromScene(){return {texture:{},dispose(){}};} dispose(){}}
class MeshBasicMaterial extends Material{}
class PointsMaterial extends Material{}
class LineBasicMaterial extends Material{}
class ShaderMaterial extends Material{constructor(o){super(o);this.uniforms=(o&&o.uniforms)||{};this.vertexShader=(o&&o.vertexShader)||'';this.fragmentShader=(o&&o.fragmentShader)||'';}}
class WebGLRenderTarget{constructor(w,h,o){this.width=w||1;this.height=h||1;this.texture={encoding:0,image:{width:w,height:h}};this.samples=0;Object.assign(this,o||{});}
  setSize(w,h){this.width=w;this.height=h;this.texture.image={width:w,height:h};return this;}
  dispose(){}}
class WebGLMultisampleRenderTarget extends WebGLRenderTarget{}
class OrthographicCamera extends Object3D{constructor(l,r,t,b,n,f){super();this.isCamera=true;this.left=l;this.right=r;this.top=t;this.bottom=b;this.near=n;this.far=f;this.projectionMatrix=new Matrix4();}
  updateProjectionMatrix(){}}
class SpriteMaterial extends Material{}
class Light extends Object3D{constructor(c,i){super();this.color=new Color(c);this.intensity=i===undefined?1:i;this.target=new Object3D();this.shadow={mapSize:{set(){}},camera:{updateProjectionMatrix(){}},bias:0,normalBias:0,radius:1};this.castShadow=false;}}
class HemisphereLight extends Light{}
class DirectionalLight extends Light{}
class PointLight extends Light{constructor(c,i,d,de){super(c,i);this.distance=d||0;this.decay=de===undefined?1:de;}}
class SpotLight extends Light{}
class PerspectiveCamera extends Object3D{constructor(f,a,n,fa){super();this.fov=f;this.aspect=a;}updateProjectionMatrix(){}}
class Fog{constructor(c,n,f){this.color=new Color(c);this.near=n;this.far=f;}}
class CanvasTexture{clone(){ const t=Object.create(Object.getPrototypeOf(this)); Object.assign(t,this); return t; } dispose(){} constructor(c){this.image=c;this.needsUpdate=false;this.repeat=new Vector2(1,1);this.offset=new Vector2(0,0);this.anisotropy=1;}}
class Raycaster{
  constructor(){this.far=10;this.ray={origin:new Vector3(),direction:new Vector3()};}
  setFromCamera(){}
  intersectObjects(){return [];}
}
class WebGLRenderer{
  constructor(o){this.domElement=o.canvas;this.shadowMap={enabled:false,type:0};this.capabilities={isWebGL2:true};this._rt=null;}
  setPixelRatio(){} setSize(){} render(){} compile(){}
  setRenderTarget(t){this._rt=t;} getRenderTarget(){return this._rt;} clear(){}
  getDrawingBufferSize(v){ if(v){v.x=1280;v.y=760;} return {x:1280,y:760}; }
  readRenderTargetPixels(){}
}
class Frustum{ setFromProjectionMatrix(){ return this; } intersectsSphere(){ return true; } intersectsObject(){ return true; } intersectsBox(){ return true; } containsPoint(){ return true; } }
class Sphere{ constructor(c,r){ this.center=c||new Vector3(); this.radius=r||0; } set(c,r){ this.center.copy(c); this.radius=r; return this; } clone(){ return new Sphere(this.center.clone(),this.radius); } applyMatrix4(){ return this; } }
class Box3{ constructor(a,b){ this.min=a||new Vector3(); this.max=b||new Vector3(); } setFromObject(){ return this; } getCenter(v){ return (v||new Vector3()).set(0,0,0); } getSize(v){ return (v||new Vector3()).set(1,1,1); } expandByPoint(){ return this; } containsPoint(){ return false; } }
class LatheGeometry extends BufferGeometry{constructor(){super(48);const g=mkGeo(48);this.attributes=g.attributes;}}
class RingGeometry extends BufferGeometry{constructor(){super(36);const g=mkGeo(36);this.attributes=g.attributes;}}
class IcosahedronGeometry extends BufferGeometry{constructor(){super(60);const g=mkGeo(60);this.attributes=g.attributes;}}
class OctahedronGeometry extends BufferGeometry{constructor(){super(24);const g=mkGeo(24);this.attributes=g.attributes;}}
Object.assign(T,{Texture:CanvasTexture,Sphere,Box3,LatheGeometry,RingGeometry,IcosahedronGeometry,OctahedronGeometry,Path:Shape,PCFShadowMap:1,Frustum,CatmullRomCurve3,TubeGeometry,Shape,ShapeGeometry,ExtrudeGeometry,DodecahedronGeometry,MeshPhysicalMaterial,PMREMGenerator,EquirectangularReflectionMapping:303,FrontSide:0,NormalBlending:1,Uniform,ShaderMaterial,WebGLRenderTarget,WebGLMultisampleRenderTarget,OrthographicCamera,LinearFilter:1006,NearestFilter:1003,RGBAFormat:1023,RGBFormat:1022,UnsignedByteType:1009,HalfFloatType:1016,Vector3,Vector2,Euler,Quaternion,Matrix4,Color,BufferAttribute,Float32BufferAttribute,BufferGeometry,BoxGeometry,PlaneGeometry,CylinderGeometry,SphereGeometry,ConeGeometry,TorusGeometry,CircleGeometry,Object3D,Group,Scene,Mesh,Points,LineSegments,LineBasicMaterial,InstancedBufferGeometry,InstancedBufferAttribute,Sprite,InstancedMesh,Material,MeshStandardMaterial,MeshBasicMaterial,PointsMaterial,SpriteMaterial,HemisphereLight,DirectionalLight,PointLight,SpotLight,PerspectiveCamera,Fog,CanvasTexture,Raycaster,WebGLRenderer,
  RepeatWrapping:1000,ClampToEdgeWrapping:1001,SRGBColorSpace:'srgb',LinearSRGBColorSpace:'srgb-linear',NoToneMapping:0,HalfFloatType:1016,FloatType:1015,REVISION:'161-stub',sRGBEncoding:3001,DoubleSide:2,BackSide:1,AdditiveBlending:2,ACESFilmicToneMapping:4,PCFSoftShadowMap:2,DynamicDrawUsage:35048});
window.THREE=T;
})();

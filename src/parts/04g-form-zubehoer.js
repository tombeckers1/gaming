/* Verpackungsformen (zubehoer) - siehe 04-models.js VP_FORM */
/* 03.10. (Tom: "Vieles ist einfach nur ein Karton, wo was draufsteht ...
   jede Verpackung soll so etwas Einzigartiges haben"): jedes Zubehoerteil
   liegt jetzt so im Regal, wie es im Handel verkauft wird - Klappschachtel,
   Netzbeutel, Haengekarte, Dose, Koecher, Blister, Kissenbeutel, Display,
   Holzkiste, Geschenkkarton ... Keine zwei gleich. Das Druckbild (wareFront,
   Motive 04f) bleibt und ist von vorn lesbar. Alles bleibt in p.dims. */
(function(){
if(typeof VP_FORM==='undefined') return;
const T=THREE, PI=Math.PI, TAU=2*PI;
const hx=s=>parseInt(String(s||'#888888').slice(1),16);
/* gemeinsame Materialien: Glanz (Metall, Folie, Lack - Vertexfarben),
   Leuchten (Knicklichter, Lichterkette) */
const GLANZ=new T.MeshStandardMaterial({vertexColors:true,roughness:0.2,metalness:0.35});
const LEUCHT=new T.MeshBasicMaterial({vertexColors:true});
const BUNT=['#ff4d6d','#ffd23f','#3ec1ff','#7cff6b','#c77dff','#ff8c42'];

/* ---------- Grundgeruest ---------- */
function S(t){ const p=P[t]; return {t,p,a:p.art,w:p.dims[0],h:p.dims[1],d:p.dims[2],parts:[],vc:[],gl:[],le:[],R:zufallAus(hashStr(t+'vp'))}; }
function fertig(k){
  if(k.vc.length) k.parts.push({geo:merge(k.vc),mat:vcMat});
  if(k.gl.length) k.parts.push({geo:merge(k.gl),mat:GLANZ});
  if(k.le.length) k.parts.push({geo:merge(k.le),mat:LEUCHT});
  return k.parts; }
const v=(k,geo,m,c)=>{ k.vc.push({geo,m,color:c}); };
const gl=(k,geo,m,c)=>{ k.gl.push({geo,m,color:c}); };
const le=(k,geo,m,c)=>{ k.le.push({geo,m,color:c}); };
function teil(k,list,mat){ k.parts.push({geo:merge(Array.isArray(list)?list:[list]),mat}); }
const Bx=(w,h,d)=>new T.BoxGeometry(w,h,d);
const Cy=(a,b,h,s,o)=>new T.CylinderGeometry(a,b,h,s||12,1,!!o);
const Sp=(r,a,b)=>new T.SphereGeometry(r,a||10,b||8);
const M0=()=>tm(0,0,0);

/* Druckbogen: mehrere Flaechen (Meter) untereinander auf einer Textur;
   R[i] = [u0,v0,u1,v1] je Flaeche */
function bogen(liste,o){
  const cap=HIQ?1024:640, sw=Math.max(...liste.map(q=>q.w)), sh=liste.reduce((s,q)=>s+q.h,0);
  const sc=Math.min(cap/sw,cap*1.4/sh,2600)*TEX_FAKTOR;
  const D=liste.map(q=>[Math.max(8,Math.round(q.w*sc)),Math.max(8,Math.round(q.h*sc))]);
  const W=Math.max(...D.map(x=>x[0])), H=D.reduce((s,x)=>s+x[1],0);
  const tx=tex(W,H,g=>{ let y=0; liste.forEach((q,i)=>{ const [ww,hh]=D[i]; g.save(); g.beginPath(); g.rect(0,y,ww,hh); g.clip(); g.translate(0,y); q.draw(g,ww,hh); g.restore(); y+=hh; }); });
  const R=[]; let y=0; D.forEach(([ww,hh])=>{ R.push([0,1-(y+hh)/H,ww/W,1-y/H]); y+=hh; });
  return {mat:new T.MeshStandardMaterial(Object.assign({map:tx,roughness:0.55},o||{})),R};
}
const AUS={alphaTest:0.5,side:T.DoubleSide};
function reg(g,r){ const uv=g.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,r[0]+uv.getX(i)*(r[2]-r[0]),r[1]+uv.getY(i)*(r[3]-r[1])); return g; }
/* Quader mit Flaechen: f vorn, b hinten, s Seiten, t oben, u unten */
function kbox(w,h,d,R){ const g=Bx(w,h,d), uv=g.attributes.uv, F=[R.s||R.f,R.s||R.f,R.t||R.s||R.f,R.u||R.t||R.s||R.f,R.f,R.b||R.f];
  for(let f=0;f<6;f++){ const r=F[f]; for(let i=0;i<4;i++){ const q=f*4+i; uv.setXY(q,r[0]+uv.getX(q)*(r[2]-r[0]),r[1]+uv.getY(q)*(r[3]-r[1])); } }
  return g; }
/* senkrechte Huelle um ein Profil (x,z), u laeuft hinten-Mitte -> links -> vorn -> rechts */
function rohr(pts,y0,y1,R){
  const n=pts.length, L=[0]; for(let i=1;i<=n;i++){ const a=pts[i-1], b=pts[i%n]; L.push(L[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1])); }
  const pos=[],nor=[],uv=[],idx=[];
  for(let i=0;i<=n;i++){ const p=pts[i%n], pa=pts[(i-1+n)%n], pb=pts[(i+1)%n], tx=pb[0]-pa[0], tz=pb[1]-pa[1], l=Math.hypot(tx,tz)||1, u=L[i]/L[n];
    pos.push(p[0],y0,p[1],p[0],y1,p[1]); nor.push(-tz/l,0,tx/l,-tz/l,0,tx/l); uv.push(u,0,u,1); }
  for(let i=0;i<n;i++){ const b=2*i; idx.push(b,b+2,b+3,b,b+3,b+1); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new T.Float32BufferAttribute(nor,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); g.setIndex(idx);
  return R?reg(g,R):g; }
function stadion(wx,dz,n){ n=sparN(n||8,3); const r=dz/2, f=Math.max(0,wx/2-r), P2=[];
  const add=(x,z)=>{ const l=P2[P2.length-1]; if(!l||Math.hypot(l[0]-x,l[1]-z)>1e-7) P2.push([x,z]); };
  add(0,-r); for(let i=0;i<=n;i++){ const th=-PI+i/n*PI; add(-f+r*Math.sin(th),r*Math.cos(th)); }
  for(let i=0;i<=n;i++){ const th=i/n*PI; add(f+r*Math.sin(th),r*Math.cos(th)); }
  const l=P2[P2.length-1]; if(Math.hypot(l[0]-P2[0][0],l[1]-P2[0][1])<1e-7) P2.pop(); return P2; }
const kreis=(r,n)=>stadion(2*r,2*r,Math.round((n||24)/2));
/* Deckel/Boden aus einem Profil (Flaeche nach oben) */
function profilDeckel(pts,unten){ const s=new T.Shape(pts.map(p=>new T.Vector2(p[0],-p[1]))); const g=new T.ShapeGeometry(s); g.rotateX(unten?PI/2:-PI/2); return g; }
/* Druck rundum: vorn (Mitte der Huelle) einmal, hinten einmal */
const rundum=(vf,hf)=>(g,W,H)=>{ hf=hf||vf;
  g.save(); g.beginPath(); g.rect(W/4,0,W/2,H); g.clip(); g.translate(W/4,0); vf(g,W/2,H); g.restore();
  for(const x0 of [-W/4,3*W/4]){ g.save(); g.beginPath(); g.rect(Math.max(0,x0),0,W/4,H); g.clip(); g.translate(x0,0); hf(g,W/2,H); g.restore(); } };
/* Kissenbeutel: Vorder- und Rueckseite gewoelbt, Siegelnaehte oben/unten
   flach; o.boden: Standbodenbeutel (unten offen, volle Woelbung) */
function kissen(w,h,dz,o){ o=o||{}; const nx=sparN(o.nx||10,4), ny=sparN(o.ny||14,5), so=o.oben||0, su=o.unten||0, ein=o.ein===undefined?0.06:o.ein, ex=o.ex||0.5;
  const fy=y=>{ if(o.boden){ const t=y/(h-so); return t>=1?0:Math.pow(Math.max(0,1-t*t*t),0.5); } const t=(y-su)/(h-su-so); return t<=0||t>=1?0:Math.pow(Math.sin(PI*t),o.py||0.45); };
  const fx=x=>Math.pow(Math.max(0,1-Math.pow(2*x/w,2)),ex);
  /* 03.10. (Tom, Foto: hintereinander stehende Beutel zeigten oben
     gestreckte Schrift- und Streifenreste): die Zeilen liegen jetzt genau
     auf den Siegelkanten und dicht an der Schulter, und der Druck folgt
     der Bogenlaenge der Woelbung - vorher lief ein einziges steiles
     Viereck von der Naht in den Bauch und zog den Aufdruck lang. */
  const yb0=o.boden?0:su, yb1=h-so, nb=Math.max(4,ny-(su&&!o.boden?1:0)-(so?1:0)), Y=[];
  if(su&&!o.boden) Y.push(0);
  for(let k=0;k<=nb;k++){ const q=k/nb; Y.push(yb0+(yb1-yb0)*(o.boden?Math.sin(PI/2*q):(1-Math.cos(PI*q))/2)); }
  if(so) Y.push(h);
  const NY=Y.length-1, pos=[],uv=[],idx=[];
  for(const s of [1,-1]){ const base=pos.length/3, Rr=s>0?o.Rf:(o.Rb||o.Rf), P3=[];
    for(let j=0;j<=NY;j++) for(let i=0;i<=nx;i++){ const u=i/nx, x0=(u-0.5)*w, y=Y[j], b=fy(y); P3.push([x0*(1-ein*b),y,s*((o.off||0.0004)+dz*fx(x0)*b)]); }
    for(let i=0;i<=nx;i++){ /* Bogenlaenge je Spalte im Bauch */
      let L=0; const Ls=[0]; for(let j=1;j<=NY;j++){ const a=P3[(j-1)*(nx+1)+i], c=P3[j*(nx+1)+i]; const inB=Y[j-1]>=yb0-1e-9&&Y[j]<=yb1+1e-9; L+=inB?Math.hypot(c[0]-a[0],c[1]-a[1],c[2]-a[2]):0; Ls.push(L); }
      for(let j=0;j<=NY;j++){ const y=Y[j]; let v=y/h; if(L>0&&y>=yb0-1e-9&&y<=yb1+1e-9) v=(yb0+Ls[j]/L*(yb1-yb0))/h; P3[j*(nx+1)+i].v=v; } }
    for(let j=0;j<=NY;j++) for(let i=0;i<=nx;i++){ const p=P3[j*(nx+1)+i], u=i/nx; pos.push(p[0],p[1],p[2]);
      let uu=s>0?u:1-u, vv=p.v; if(Rr){ uu=Rr[0]+uu*(Rr[2]-Rr[0]); vv=Rr[1]+vv*(Rr[3]-Rr[1]); } uv.push(uu,vv); }
    for(let j=0;j<NY;j++) for(let i=0;i<nx;i++){ const a=base+j*(nx+1)+i, b=a+1, c=a+nx+2, e=a+nx+1; if(s>0) idx.push(a,b,c,a,c,e); else idx.push(a,c,b,a,e,c); } }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
/* Stern als Flaeche/Koerper */
function sternForm(r,ri,z,loch){ const s=new T.Shape(); for(let i=0;i<10;i++){ const an=PI/2+i*PI/5, rr=i%2?ri:r; const x=Math.cos(an)*rr, y=Math.sin(an)*rr; i?s.lineTo(x,y):s.moveTo(x,y); } s.closePath();
  if(loch){ const p=new T.Path(); for(let i=9;i>=0;i--){ const an=PI/2+i*PI/5, rr=(i%2?ri:r)*loch; const x=Math.cos(an)*rr, y=Math.sin(an)*rr; i===9?p.moveTo(x,y):p.lineTo(x,y); } p.closePath(); s.holes.push(p); }
  return new T.ExtrudeGeometry(s,{depth:z,bevelEnabled:false,curveSegments:1}); }
/* Dreieck (Wimpel), Spitze nach unten */
function dreieck(b,hh){ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute([-b/2,0,0, 0,-hh,0, b/2,0,0],3)); g.setAttribute('normal',new T.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3)); g.setAttribute('uv',new T.Float32BufferAttribute([0,1,0.5,0,1,1],2)); return g; }

/* ---------- Druck-Helfer ---------- */
function grund(g,x,y,W,H,k,dunkel){ const a=k.a, gr=g.createLinearGradient(x,y,x+W,y+H); gr.addColorStop(0,dunkel?a.bg2:a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(x,y,W,H); }
const titelS=k=>k.a.title||k.p.short;
function titel(g,cx,cy,mw,sz,k,f){ return WZ.txt(g,titelS(k),cx,cy,mw,sz,WFNT.rund,f||k.a.ac,'center','rgba(0,0,0,.55)'); }
function unter(g,cx,cy,mw,sz,k,f){ if(k.a.sub) WZ.txt(g,k.a.sub,cx,cy,mw,sz,WFNT.kond,f||'#fff','center','rgba(0,0,0,.45)'); }
function marke(g,x,y,W,H,k){ wareMarkeZeichnen(g,x,y,W,H,k.t,k.a); }
/* Namensblock: Marke, Name, Zusatz */
function kopf(g,x,y,W,H,k,o){ o=o||{}; if(!o.ohneGrund) grund(g,x,y,W,H,k);
  let yy=y; if(o.marke!==false){ const mh=Math.min(H*0.22,W*0.16); marke(g,x,yy,W,mh,k); yy+=mh; }
  const R=y+H-yy; titel(g,x+W/2,yy+R*(k.a.sub?0.4:0.5),W*0.9,Math.min(R*0.44,W*0.24),k); unter(g,x+W/2,yy+R*0.78,W*0.88,Math.min(R*0.22,W*0.11),k); }
const vorne=k=>(g,W,H)=>wareFront(g,W,H,k.t,k.a);
const bild=(g,x,y,W,H,k,ohne)=>wareBild(g,x,y,W,H,k.t,k.a,zufallAus(hashStr(k.t+'vpb')),ohne);
function konfettiDruck(g,x,y,W,H,k,n){ const r=zufallAus(hashStr(k.t+'kf')); WZ.konfetti(g,x,y,W,H,n||30,[k.a.ac,k.a.ac2,'#ffffff','#ff5a8a','#5ce1ff','#ffd23f'],Math.min(W,H)*0.018,r); }
function loch(g,fn){ g.save(); g.globalCompositeOperation='destination-out'; g.fillStyle='#000'; g.beginPath(); fn(); g.fill(); g.restore(); }
/* Euroloch (Sombrero-Form) ausstanzen */
function euroloch(g,cx,cy,r){ loch(g,()=>{ g.arc(cx,cy,r,0,TAU); WZ.rr(g,cx-r*2.6,cy+r*0.1,r*5.2,r*0.95,r*0.45); }); }
/* Siegelnaht: feine Riffel */
/* 03.10. (Tom, Foto: Streifenreste oben auf den Beuteln): die Riffelung
   war 1 Pixel breit im 2-Pixel-Raster - verkleinert im Regal ergab das
   Moiré-Streifen. Jetzt breite, weiche Praegerillen und eine Kante. */
function riffel(g,x,y,W,H,f){ const st=Math.max(6,Math.round(W/48)); g.save(); g.beginPath(); g.rect(x,y,W,H); g.clip();
  for(let i=x;i<x+W;i+=st){ const gr=g.createLinearGradient(i,0,i+st,0); gr.addColorStop(0,'rgba(255,255,255,.07)'); gr.addColorStop(0.5,f||'rgba(0,0,0,.12)'); gr.addColorStop(1,'rgba(255,255,255,.07)'); g.fillStyle=gr; g.fillRect(i,y,st,H); }
  g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x,y+H-Math.max(1,H*0.06),W,Math.max(1,H*0.06)); g.restore(); }
function holz(g,x,y,W,H,r,hell){ g.fillStyle=hell?'#d9b07a':'#b98a52'; g.fillRect(x,y,W,H);
  for(let i=0;i<Math.max(8,H/3);i++){ g.fillStyle=`rgba(${90+r()*40|0},${55+r()*25|0},${20+r()*15|0},${0.12+r()*0.18})`; const yy=y+r()*H; g.fillRect(x,yy,W,Math.max(1,H*0.008+r()*H*0.01)); }
  for(let i=0;i<3;i++){ g.strokeStyle='rgba(90,55,25,.35)'; g.lineWidth=Math.max(1,H*0.01); g.beginPath(); g.ellipse(x+r()*W,y+r()*H,W*0.02+r()*W*0.03,H*0.05,0,0,TAU); g.stroke(); } }
function kraft(g,W,H){ g.fillStyle='#b8925f'; g.fillRect(0,0,W,H); g.fillStyle='rgba(90,60,25,.12)'; for(let i=0;i<W;i+=Math.max(3,W*0.012)) g.fillRect(i,0,Math.max(1,W*0.004),H); }

/* ================= 1 Feuerzeug: Geschenk-Klappschachtel, Deckel offen,
   darin steckt das Chrom-Sturmfeuerzeug ================= */
VP_FORM.feuerzeug=t=>{ const k=S(t), {w,h,d,a}=k, hb=h*0.5;
  const B=bogen([
    {w,h:hb,draw:(g,W,H)=>{ kopf(g,0,0,W,H,k); g.strokeStyle='rgba(255,255,255,.55)'; g.lineWidth=Math.max(1,W*0.025); g.strokeRect(W*0.06,H*0.05,W*0.88,H*0.9); }},
    {w:d,h:hb,draw:(g,W,H)=>{ grund(g,0,0,W,H,k,true); g.fillStyle=a.ac2||a.ac; g.fillRect(0,H*0.85,W,H*0.15); }},
    {w,h:d,draw:(g,W,H)=>{ g.fillStyle='#2a1f30'; g.fillRect(0,0,W,H); g.fillStyle='#120c16'; WZ.rr(g,W*0.09,H*0.26,W*0.82,H*0.5,H*0.08); g.fill(); }}]);
  teil(k,{geo:kbox(w,hb,d,{f:B.R[0],s:B.R[1],t:B.R[2],u:B.R[1]}),m:tm(0,hb/2,0)},B.mat);
  /* Deckel hochgeklappt hinten: Innenseite Samt, Rand nach vorn */
  const lh=d*0.97, zl=-d/2+0.0012;
  v(k,Bx(w,lh,0.0022),tm(0,hb+lh/2,zl),hx(a.bg2));
  v(k,Bx(w*0.9,lh*0.88,0.0006),tm(0,hb+lh/2,zl+0.0014),0x3a2440);
  v(k,Bx(w,0.0022,0.007),tm(0,hb+lh-0.0011,zl+0.0035),hx(a.bg2));
  for(const s of [-1,1]) v(k,Bx(0.0022,lh,0.007),tm(s*(w/2-0.0011),hb+lh/2,zl+0.0035),hx(a.bg2));
  /* Sturmfeuerzeug: Chromkoerper, Spalt, Deckel, Scharnier, Emblem */
  const wl=w*0.78, dl=d*0.42, z0=0.003, yb=hb-0.022, kh=h*0.4, dh=h*0.15;
  gl(k,Bx(wl,kh,dl),tm(0,yb+kh/2,z0),0x9ea6b0);
  v(k,Bx(wl*1.004,0.0012,dl*1.004),tm(0,yb+kh,z0),0x3a3d42);
  gl(k,Bx(wl,dh,dl),tm(0,yb+kh+0.0006+dh/2,z0),0xb4bbc4);
  gl(k,Cy(0.0021,0.0021,0.012,6),tm(wl/2-0.001,yb+kh,z0-dl/2),0xb9bec6);
  v(k,Cy(0.0062,0.0062,0.0008,16),tm(0,yb+kh*0.62,z0+dl/2+0.0003,PI/2),0x8a1c1c);
  gl(k,sternForm(0.0042,0.0018,0.0006),tm(0,yb+kh*0.62,z0+dl/2+0.0007),0xffd23f);
  /* Glanzkante */
  v(k,Bx(wl*0.08,kh*0.86,0.0004),tm(-wl*0.34,yb+kh*0.53,z0+dl/2+0.0002),0xf4f6f8);
  return fertig(k); };

/* ================= 2 Luftschlangen: Netzbeutel mit Clip-Etikett ================= */
VP_FORM.luftschlangen=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, lh=h*0.27, hn=h*0.8, bw=w*0.9, dz=d*0.44;
  const netz=tex(128,128,g=>{ g.clearRect(0,0,128,128); g.strokeStyle=a.ac2&&a.ac2!==a.bg2?a.ac2:'#e63b2e'; g.lineWidth=9; g.beginPath(); g.moveTo(-8,-8); g.lineTo(136,136); g.moveTo(136,-8); g.lineTo(-8,136); g.stroke(); });
  netz.wrapS=netz.wrapT=T.RepeatWrapping; netz.repeat.set(7,10);
  teil(k,{geo:kissen(bw,hn,dz,{py:0.6,ex:0.6,ein:0.14,nx:12,ny:12}),m:M0()},new T.MeshStandardMaterial({map:netz,alphaTest:0.4,side:T.DoubleSide,roughness:0.7}));
  /* Inhalt: Luftschlangen-Roellchen und zwei Troeten */
  const F=BUNT; let i=0;
  for(const y of [0.03,0.062,0.094,0.122]) for(const x of [-0.042,0,0.042]){ if(y>0.12&&x!==0) continue;
    const zz=(i%2?-1:1)*0.006, rr=0.0105+R()*0.002, steh=i%4===3;
    v(k,Cy(rr,rr,0.009,12),tm(x+(R()-0.5)*0.008,hn*y/0.16,zz,steh?0:PI/2,0,(R()-0.5)*0.6),hx(F[i%F.length]));
    if(!WARE_SPAR_AN) v(k,Cy(rr*0.35,rr*0.35,0.0095,8),tm(x,hn*y/0.16,zz,steh?0:PI/2),0xffffff); i++; }
  for(const s of [-1,1]){ const an=s*0.55, cx=s*0.022, cy=hn*0.5;
    v(k,Cy(0.0035,0.0035,0.07,6),tm(cx,cy,0.012*s,0,0,an),0xe8c35a);
    v(k,Cy(0.009,0.0035,0.016,8),tm(cx+Math.sin(-an)*0.043,cy+Math.cos(an)*0.043,0.012*s,0,0,an),hx(s>0?'#ff4d6d':'#3ec1ff')); }
  /* Clip-Etikett ueber dem gerafften Hals */
  const B=bogen([{w:w*0.92,h:lh,draw:vorne(k)},{w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}]);
  const L={f:B.R[0],s:B.R[1],t:B.R[1]};
  teil(k,[{geo:kbox(w*0.92,lh,0.0015,L),m:tm(0,h-lh/2,0.0045)},{geo:kbox(w*0.92,lh,0.0015,L),m:tm(0,h-lh/2,-0.0045,0,PI,0)},{geo:kbox(w*0.92,0.0015,0.0105,L),m:tm(0,h-0.00075,0)}],B.mat);
  for(const s of [-1,1]) gl(k,Bx(0.009,0.0013,0.0008),tm(s*w*0.3,h-lh+0.007,0.0056),0xc9ccd2);
  return fertig(k); };

/* ================= 3 Partybrille: Haengekarte mit Euroloch und
   Aufstellfuss, die Sternenbrille aufgesteckt ================= */
VP_FORM.brille=t=>{ const k=S(t), {w,h,d,a}=k, ch=h*0.98, zc=d/2-0.024;
  const B=bogen([{w,h:ch,draw:(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2a1d4a'); gr.addColorStop(1,'#0e0a1c'); g.fillStyle=gr; g.fillRect(0,0,W,H); konfettiDruck(g,0,H*0.12,W,H*0.55,k,40);
      g.fillStyle=rgba(a.bg2,0.9); g.fillRect(0,H*0.7,W,H*0.3); titel(g,W/2,H*0.8,W*0.9,H*0.17,k,'#ffd23f'); unter(g,W/2,H*0.93,W*0.8,H*0.08,k);
      marke(g,W*0.02,H*0.03,W*0.24,H*0.12,k); euroloch(g,W/2,H*0.075,H*0.035); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}],AUS);
  const C={f:B.R[0],s:B.R[1],t:B.R[1],u:B.R[1]};
  teil(k,[{geo:kbox(w,ch,0.0015,C),m:tm(0,ch/2,zc)}],B.mat);
  /* Aufstellfuss nach hinten */
  const fy=ch*0.9, dz=zc-(-d/2+0.002), L=Math.hypot(fy,dz);
  v(k,Bx(w*0.6,L,0.0015),tm(0,fy/2,zc-dz/2,Math.atan2(dz,fy)),hx(a.bg2));
  /* Brille: zwei Sternrahmen, Steg, eingeklappte Buegel */
  const gy=ch*0.575, sr=Math.min(0.0165,w*0.105), sx=sr*1.95, zf=zc+0.0015, gold=0xf2c230;
  for(const s of [-1,1]){ gl(k,sternForm(sr,sr*0.55,0.0028,0.62),tm(s*sx,gy,zf+0.003,0,0,s*0.12),gold);
    v(k,Bx(0.0026,0.0024,0.004),tm(s*(sx+sr*0.95),gy+sr*0.25,zf+0.003),0xb8860b);
    gl(k,Bx(sx*1.05,0.0022,0.0018),tm(s*sx*0.6,gy+sr*0.28,zf+0.0012),0xd4a017); }
  gl(k,Cy(0.0016,0.0016,sx*0.75,6),tm(0,gy+sr*0.15,zf+0.0045,0,0,PI/2),gold);
  /* Gummibaender ueber die Buegel */
  for(const s of [-1,1]) v(k,Bx(0.0022,ch*0.4,0.0004),tm(s*(sx+sr*0.6),gy+sr*0.1,zf+0.0058),0xf4f4f4);
  return fertig(k); };

/* ================= 4 Konfettikanone: das Papprohr selbst, Drehgriff
   unten, Goldfolienkappe oben ================= */
VP_FORM.konfetti=t=>{ const k=S(t), {w,h,d,a}=k, R=w/2*0.86, yg=h*0.15, yt=h-0.024;
  const B=bogen([{w:TAU*R,h:yt-yg,draw:rundum(vorne(k))}],{roughness:0.45});
  teil(k,{geo:rohr(kreis(R,28),yg,yt,B.R[0]),m:M0()},B.mat);
  const gc=hx(a.ac2&&wareLum(a.ac2)<0.6?a.ac2:wareLum(a.bg2)<0.6?a.bg2:'#ff4d6d');
  v(k,Cy(R*1.1,R*1.12,yg,24),tm(0,yg/2,0),gc);
  for(let i=0;i<16;i++){ const an=i/16*TAU; v(k,Bx(0.004,yg*0.8,0.004),tm(Math.sin(an)*R*1.08,yg*0.48,Math.cos(an)*R*1.08,0,an,0),0xffffff); }
  v(k,Cy(R*0.6,R*0.6,0.002,16),tm(0,0.0005,0),0x222222);
  for(const y of [yg+0.003,yt-0.003]) gl(k,Cy(R*1.03,R*1.03,0.006,24),tm(0,y,0),0xe8c35a);
  gl(k,Cy(R*1.02,R*1.04,0.014,24),tm(0,yt+0.007,0),0xe6cf86);
  gl(k,new T.SphereGeometry(R*1.02,20,5,0,TAU,0,PI/2),tm(0,yt+0.014,0,0,0,0,1,0.22,1),0xf0dc96);
  return fertig(k); };

/* ================= 5 Wachsgiessen: runde Weissblechdose, bedruckter
   Deckel ================= */
VP_FORM.bleigiessen=t=>{ const k=S(t), {w,h,d,a}=k, R=Math.min(w,d)/2-0.0022, yl=h-0.013;
  const B=bogen([{w:TAU*R,h:yl-0.004,draw:rundum(vorne(k))},
    {w:2*R,h:2*R,draw:(g,W,H)=>{ grund(g,0,0,W,H,k); bild(g,W*0.12,H*0.06,W*0.76,H*0.6,k); g.save(); g.globalCompositeOperation='destination-in'; g.beginPath(); g.arc(W/2,H/2,W/2,0,TAU); g.fill(); g.restore();
      g.fillStyle=rgba(a.bg2,0.92); g.fillRect(0,H*0.66,W,H*0.2); titel(g,W/2,H*0.76,W*0.7,H*0.14,k); g.strokeStyle=a.ac; g.lineWidth=W*0.02; g.beginPath(); g.arc(W/2,H/2,W*0.47,0,TAU); g.stroke(); }}],{roughness:0.35,metalness:0.15});
  teil(k,[{geo:rohr(kreis(R,32),0.004,yl,B.R[0]),m:M0()},{geo:reg(new T.CircleGeometry(R,32),B.R[1]),m:tm(0,h-0.0006,0,-PI/2)}],B.mat);
  gl(k,Cy(R+0.0008,R+0.0008,0.0045,32),tm(0,0.00225,0),0xc9ccd2);
  gl(k,Cy(R+0.0012,R+0.0012,0.0128,32,true),tm(0,h-0.0064-0.0004,0),hx(a.bg2));
  gl(k,new T.TorusGeometry(R+0.0004,0.0013,4,32),tm(0,h-0.0014,0,PI/2),0xd6d9de);
  return fertig(k); };

/* ================= 6 Knicklichter: Klarsicht-Koecher mit Kappen und
   Banderole, die Staebe leuchten ================= */
VP_FORM.knicklichter=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, kap=0.016;
  const pr=stadion(w*0.97,d*0.97,8), pk=stadion(w,d,8);
  teil(k,{geo:rohr(pr,kap*0.6,h-kap*0.6),m:M0()},folieKlar);
  const kc=hx(a.ac2&&a.ac2!==a.bg2?a.ac2:'#3ec1ff');
  for(const [y0,y1] of [[0,kap],[h-kap,h]]){ v(k,rohr(pk,y0,y1),M0(),kc); if(y0===0) v(k,profilDeckel(pk,true),tm(0,0.0003,0),kc); }
  v(k,rohr(stadion(w*0.985,d*0.985,8),kap,kap+0.0025),M0(),0xffffff); v(k,rohr(stadion(w*0.985,d*0.985,8),h-kap-0.0025,h-kap),M0(),0xffffff);
  /* Staebe im Koecher */
  const F=['#39ff6a','#ff3df2','#3dd8ff','#fff23d','#ff8a3d','#b46cff'], f=(w*0.97-d*0.97)/2, rr=d*0.97/2-0.004; let n=0;
  const st=WARE_SPAR_AN?0.0125:0.0082; for(let x=-w*0.44;x<=w*0.44;x+=st) for(let z=-rr;z<=rr;z+=st){ const dx=Math.max(0,Math.abs(x)-f); if(Math.hypot(dx,z)>rr-0.001) continue;
    le(k,Cy(0.0029,0.0029,h-kap*2-0.004,5,true),tm(x+(R()-0.5)*0.002,h/2,z,(R()-0.5)*0.03,0,(R()-0.5)*0.03),hx(F[n++%F.length])); }
  /* Banderole mit dem Druck */
  const pb=stadion(w*0.99,d*0.99,8), bh=h*0.38, by=h*0.33;
  let L=0; for(let i=0;i<pb.length;i++){ const a2=pb[i], b2=pb[(i+1)%pb.length]; L+=Math.hypot(b2[0]-a2[0],b2[1]-a2[1]); }
  /* 03.10.: Deckel bedruckt (vorher einfarbig) - Leuchtstaebe-Motiv und Name */
  const B=bogen([{w:L,h:bh,draw:rundum(vorne(k))},{w,h:d,draw:(g,W,H)=>{ g.fillStyle=a.ac2&&a.ac2!==a.bg2?a.ac2:'#3ec1ff'; g.fillRect(0,0,W,H); g.fillStyle='rgba(0,0,0,.35)'; WZ.rr(g,W*0.08,H*0.12,W*0.84,H*0.76,H*0.36); g.fill();
    for(let i=0;i<9;i++){ const x=W*(0.2+i*0.075), c=F[i%F.length]; WZ.leucht(g,x,H/2,H*0.3,c,0.6); g.strokeStyle=c; g.lineWidth=Math.max(2,H*0.07); g.lineCap='round'; g.beginPath(); g.moveTo(x-H*0.12,H*0.72); g.lineTo(x+H*0.12,H*0.28); g.stroke(); }
    titel(g,W/2,H*0.5,W*0.6,H*0.32,k,'#ffffff'); }}]);
  const dk=profilDeckel(pk,false), du=dk.attributes.uv, dp=dk.attributes.position, Rt=B.R[1];
  for(let i=0;i<du.count;i++) du.setXY(i,Rt[0]+(dp.getX(i)/w+0.5)*(Rt[2]-Rt[0]),Rt[1]+(0.5-dp.getZ(i)/d)*(Rt[3]-Rt[1]));
  teil(k,[{geo:rohr(pb,by,by+bh,B.R[0]),m:M0()},{geo:dk,m:tm(0,h-0.0003,0)}],B.mat);
  return fertig(k); };

/* ================= 7 Stabfeuerzeug: langer Clamshell-Blister auf
   Karte mit Euroloch ================= */
VP_FORM.stabfeuerzeug=t=>{ const k=S(t), {w,h,d,a}=k, zc=-d/2+0.004;
  const B=bogen([{w,h,draw:(g,W,H)=>{ grund(g,0,0,W,H,k); wareUntergrund(g,W*0.04,H*0.13,W*0.92,H*0.6,t,a,zufallAus(9));
      g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=Math.max(1,W*0.012); g.strokeRect(W*0.04,H*0.13,W*0.92,H*0.6);
      marke(g,0,H*0.07,W,H*0.05,k); g.fillStyle=a.bg2; g.fillRect(0,H*0.74,W,H*0.26); titel(g,W/2,H*0.81,W*0.92,H*0.07,k); unter(g,W/2,H*0.9,W*0.88,H*0.045,k);
      WZ.txt(g,'KINDERSICHER',W/2,H*0.965,W*0.8,H*0.025,WFNT.kond,'#ffd23f'); euroloch(g,W/2,H*0.03,W*0.06); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}],AUS);
  teil(k,{geo:kbox(w,h,0.0015,{f:B.R[0],s:B.R[1],t:B.R[1],u:B.R[1]}),m:tm(0,h/2,zc)},B.mat);
  /* Feuerzeug: Griff, Abzug, Sicherung, Stab mit Duese */
  const zl=zc+0.011, y0=h*0.3, gh=h*0.27, gc=hx(a.ac&&a.ac!=='#ffffff'?a.ac:'#ff6a1c');
  v(k,Bx(0.024,gh,0.015),tm(0,y0+gh/2,zl),gc);
  v(k,Cy(0.012,0.012,0.015,10),tm(0,y0,zl,PI/2),gc);
  v(k,Bx(0.01,gh*0.22,0.006),tm(0,y0+gh*0.62,zl+0.008),0x1e1e22);
  v(k,Bx(0.008,0.006,0.004),tm(0,y0+gh*0.86,zl+0.0075),0xd8322a);
  v(k,Bx(0.026,0.008,0.016),tm(0,y0+gh,zl),0x2a2a30);
  gl(k,Cy(0.0042,0.0042,h*0.33,8),tm(0,y0+gh+h*0.165,zl),0xc9ccd2);
  gl(k,Cy(0.0055,0.0045,0.014,8),tm(0,y0+gh+h*0.33+0.004,zl),0x9aa0a8);
  /* Anzuendlunte als Spirale daneben */
  for(let i=0;i<3;i++) v(k,new T.TorusGeometry(0.009-i*0.002,0.0016,4,12),tm(w*0.29,y0+0.012+i*0.004,zl-0.002,PI/2),0x2e8b3a);
  /* Klarsichtschale + Rand */
  teil(k,[{geo:Bx(w*0.62,h*0.62,0.022),m:tm(0,y0+h*0.24,zc+0.012)},{geo:Bx(w*0.94,h*0.68,0.0008),m:tm(0,y0+h*0.24,zc+0.0012)}],folieKlar);
  return fertig(k); };

/* ================= 8 Luftballons: bedruckter Kissenbeutel mit
   Sichtfenster, Siegelnaehten und Euroloch ================= */
VP_FORM.ballons=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, so=0.04, su=0.018;
  const fen=[0.1,0.24,0.8,0.36];
  const B=bogen([{w,h,draw:(g,W,H)=>{ grund(g,0,0,W,H,k); konfettiDruck(g,0,H*0.1,W,H*0.5,k,50);
      g.fillStyle=rgba(a.bg2,0.9); g.fillRect(0,0,W,H*so/h); g.fillRect(0,H*(1-su/h),W,H*su/h); riffel(g,0,0,W,H*so/h); riffel(g,0,H*(1-su/h),W,H*su/h);
      marke(g,0,H*0.115,W,H*0.07,k);
      g.save(); WZ.rr(g,W*fen[0],H*fen[1],W*fen[2],H*fen[3],W*0.06); g.strokeStyle='#fff'; g.lineWidth=W*0.012; g.stroke(); g.restore();
      loch(g,()=>WZ.rr(g,W*fen[0],H*fen[1],W*fen[2],H*fen[3],W*0.06));
      g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(0,H*0.63,W,H*0.3); titel(g,W/2,H*0.71,W*0.92,H*0.12,k); unter(g,W/2,H*0.85,W*0.9,H*0.07,k);
      euroloch(g,W/2,H*0.045,W*0.035); }},
    {w,h,draw:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle='rgba(255,255,255,.35)'; for(let i=0;i<7;i++) g.fillRect(W*0.15,H*(0.55+i*0.045),W*(0.4+(i%3)*0.15),H*0.012); euroloch(g,W/2,H*0.045,W*0.035); }}],Object.assign({roughness:0.32},AUS));
  const K={nx:10,ny:14,oben:so,unten:su,ein:0.05,Rf:B.R[0],Rb:B.R[1]};
  teil(k,{geo:kissen(w,h,d*0.42,K),m:M0()},B.mat);
  /* Folie 0,8 mm vor dem Druck - vorher lag sie an den Naehten genau auf ihm (Z-Fighting: dunkle Schraegmuster oben auf den Beuteln) */
  teil(k,{geo:kissen(w,h,d*0.43,{nx:6,ny:8,oben:so,unten:su,ein:0.05,off:0.0012}),m:M0()},folieKlar);
  /* lose Luftballons hinter dem Fenster */
  const F=['#ffd23f','#d9dde3','#ff4d6d','#3ec1ff','#c77dff','#e8c35a','#7cff6b'];
  for(let i=0;i<13;i++){ const x=(i%5-2)*w*0.15+(R()-0.5)*0.02, y=h*(1-fen[1]-fen[3]*(0.2+0.6*((i*7)%13)/12)), an=(R()-0.5)*2.4, z=(R()-0.5)*0.016;
    v(k,Sp(1,8,6),tm(x,y,z,0,0,an,0.016,0.034,0.006),hx(F[i%F.length]));
    v(k,Cy(0.0025,0.004,0.01,5),tm(x-Math.sin(an)*-0.036,y-Math.cos(an)*0.036,z,0,0,an),hx(F[i%F.length])); }
  return fertig(k); };

/* ================= 9 Partyhuete: zwei gestapelte Hut-Tuerme in
   Schrumpffolie, Papierbanderole ================= */
VP_FORM.partyhuete=t=>{ const k=S(t), {w,h,d,a}=k, rb=Math.min(w/4,d/2)*0.94, Hh=h*0.53, st=h*0.09, xs=w/4;
  const muster=tex(64,64,g=>{ g.fillStyle='#bfbfbf'; g.fillRect(0,0,64,64); g.fillStyle='#ffffff'; for(let i=0;i<4;i++) for(let j=0;j<4;j++) WZ.kreis(g,i*16+8+(j%2)*8,j*16+8,4.5,'#ffffff'); });
  muster.wrapS=muster.wrapT=T.RepeatWrapping; muster.repeat.set(4,3);
  const F=[a.ac,'#3ec1ff','#ff4d6d','#ffd23f','#7cff6b',a.ac2,'#c77dff'], hut=[];
  for(const s of [-1,1]) for(let i=0;i<5;i++){ const y=i*st, c=hx(F[(i+(s>0?2:0))%F.length]);
    hut.push({geo:new T.ConeGeometry(rb,Hh,16,1,true),m:tm(s*xs,y+Hh/2,0,0,s*0.4,0),color:c});
    v(k,Cy(rb*1.015,rb*1.015,0.006,16,true),tm(s*xs,y+0.003,0),0xe8c35a); }
  k.parts.push({geo:merge(hut),mat:new T.MeshStandardMaterial({map:muster,vertexColors:true,roughness:0.6,side:T.DoubleSide})});
  for(const s of [-1,1]){ const y=4*st+Hh; v(k,Sp(0.013,8,6),tm(s*xs,y+0.004,0),0xffffff); v(k,Cy(0.0008,0.0008,Hh*0.9,4),tm(s*(xs+rb*0.6),2*st+Hh*0.4,rb*0.55,0.4,0,s*0.3),0xf0f0f0); }
  /* Troeten vorn im Spalt */
  for(const [x,c] of [[-0.006,'#e8c35a'],[0.007,'#ff4d6d']]){ v(k,Cy(0.0045,0.0045,h*0.42,6),tm(x,h*0.36,d*0.4),hx(c)); v(k,Cy(0.011,0.0045,0.02,8),tm(x,h*0.36+h*0.21+0.01,d*0.4),hx(c)); }
  /* Folie je Turm, Banderole um beide */
  teil(k,[-1,1].map(s=>({geo:new T.ConeGeometry(rb*1.06,h*0.97,16,1,true),m:tm(s*xs,h*0.485,0)})),folieKlar);
  const pb=stadion(w*0.995,d*0.995,8), bh=h*0.28; let L=0; for(let i=0;i<pb.length;i++){ const p1=pb[i], p2=pb[(i+1)%pb.length]; L+=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]); }
  const B=bogen([{w:L,h:bh,draw:rundum(vorne(k))}]);
  teil(k,{geo:rohr(pb,h*0.05,h*0.05+bh,B.R[0]),m:M0()},B.mat);
  return fertig(k); };

/* ================= 10 Luftruessel: Thekendisplay mit Ausreissfront,
   12 Ruessel stehen darin ================= */
VP_FORM.luftruessel=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, fl=h*0.3;
  const B=bogen([
    {w,h:fl,draw:(g,W,H)=>{ grund(g,0,0,W,H,k,true); titel(g,W/2,H*0.5,W*0.9,H*0.36,k); unter(g,W/2,H*0.8,W*0.85,H*0.17,k);
      g.fillStyle='#f4efe4'; for(let x=0;x<W;x+=W/24){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+W/48,H*0.07); g.lineTo(x+W/24,0); g.fill(); } }},
    {w,h,draw:(g,W,H)=>{ grund(g,0,0,W,H,k); bild(g,0,H*0.1,W,H*0.5,k); marke(g,0,0,W,H*0.1,k); g.fillStyle=a.bg2; g.fillRect(0,H*0.6,W,H*0.4); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}]);
  const Sd={f:B.R[2]};
  teil(k,[{geo:kbox(w,fl,0.003,{f:B.R[0],b:B.R[2],s:B.R[2]}),m:tm(0,fl/2,d/2-0.0015)},
          {geo:kbox(w,h,0.003,{f:B.R[1],b:B.R[2],s:B.R[2]}),m:tm(0,h/2,-d/2+0.0015)},
          {geo:kbox(w,0.003,d,Sd),m:tm(0,0.0015,0)}],B.mat);
  /* Seitenwaende: schraeg abgerissen */
  const sh=new T.Shape([new T.Vector2(-d/2,0),new T.Vector2(d/2,0),new T.Vector2(d/2,fl),new T.Vector2(-d/2,h*0.62)]);
  for(const s of [-1,1]){ const g=new T.ShapeGeometry(sh); v(k,g,tm(s*(w/2-0.0015),0,0,0,s*-PI/2,0),hx(a.bg2)); v(k,new T.ShapeGeometry(sh),tm(s*(w/2-0.0035),0,0,0,s*PI/2,0),0xd8cbb0); }
  /* 12 Luftruessel: gerollte Spirale, Mundstueck, Feder */
  const F=BUNT;
  for(let r=0;r<2;r++) for(let i=0;i<6;i++){ const x=-w*0.415+i*w*0.166, z=r?-d*0.2:d*0.18, y=r?h*0.4:h*0.32, c=F[(i+r*3)%F.length], c2=F[(i+r*3+2)%F.length], rr=w*0.068;
    v(k,Cy(rr,rr,0.008,10),tm(x,y,z,PI/2),hx(c));
    v(k,new T.CircleGeometry(rr*0.66,10),tm(x,y,z+0.0042),hx(c2));
    v(k,new T.CircleGeometry(rr*0.3,8),tm(x,y,z+0.0044),hx(c));
    v(k,Cy(0.0032,0.0042,h*0.13,6,true),tm(x,y+rr+h*0.06,z),r?0xffffff:0xffd23f);
    v(k,Cy(0.004,0.0015,0.012,5),tm(x+0.002,y+rr+h*0.13+0.006,z,0,0,-0.3),hx(c2)); }
  return fertig(k); };

/* ================= 11 Girlanden: Wickelkarte mit aufgewickelten
   Wimpelketten, eng in Klarsichtfolie ================= */
VP_FORM.girlanden=t=>{ const k=S(t), {w,h,d,a}=k, cw=w*0.97, ch=h*0.97;
  const B=bogen([{w:cw,h:ch,draw:(g,W,H)=>{ grund(g,0,0,W,H,k); marke(g,0,0,W,H*0.08,k); titel(g,W/2,H*0.19,W*0.9,H*0.12,k); unter(g,W/2,H*0.3,W*0.85,H*0.06,k);
      const gr=g.createLinearGradient(0,H*0.36,0,H); gr.addColorStop(0,'#1d1a24'); gr.addColorStop(1,'#08070b'); g.fillStyle=gr; g.fillRect(0,H*0.36,W,H*0.64);
      for(let i=0;i<40;i++) WZ.kreis(g,(i*53%97)/97*W,H*0.38+(i*31%89)/89*H*0.6,W*0.004,'rgba(255,230,150,.5)');
      g.fillStyle='#e8c35a'; g.fillRect(0,H*0.355,W,H*0.01); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}]);
  teil(k,{geo:kbox(cw,ch,0.002,{f:B.R[0],s:B.R[1]}),m:tm(0,ch/2,0)},B.mat);
  /* drei Wimpelketten quer, an den Kanten herumgewickelt */
  const F=[0xe8c35a,0xd8dde6,0xc9a227,0xf2f2f2], n=8;
  [0.56,0.37,0.18].forEach((fy,j)=>{ const y0=ch*fy, sag=0.01;
    for(let i=0;i<n;i++){ const x=-cw/2+cw*(i+0.5)/n, yy=y0-sag*Math.sin(PI*(i+0.5)/n); gl(k,dreieck(cw/n*0.82,ch*0.11),tm(x,yy,0.0045+j*0.0006,0,0,(i-n/2+0.5)*0.03),F[(i+j)%F.length]); }
    for(let i=0;i<4;i++){ const x0=-cw/2+cw*i/4, yy=y0-sag*Math.sin(PI*(i+0.5)/4)*0.9; v(k,Bx(cw/4,0.0014,0.0012),tm(x0+cw/8,yy,0.0042+j*0.0006,0,0,(i<2?-1:1)*0.04),0xf2f2f2); }
    for(const s of [-1,1]) v(k,Bx(0.0012,0.0014,0.0045),tm(s*cw/2,y0,0.0022),0xf2f2f2); });
  /* Huelle mit Siegelnaht oben */
  teil(k,[{geo:Bx(w,h*0.985,0.016),m:tm(0,h*0.985/2,0.001)},{geo:Bx(w,h*0.02,0.0025),m:tm(0,h*0.99,0)}],folieKlar);
  return fertig(k); };

/* ================= 12 Folienvorhang: Klarsichtbeutel mit gefalteter
   Kopfkarte, darin glaenzende Metallfransen ================= */
VP_FORM.folienvorhang=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, lh=h*0.23, hb=h-lh+0.012;
  const B=bogen([{w,h:lh,draw:(g,W,H)=>{ g.fillStyle='#ffffff'; g.fillRect(0,0,W,H*0.24); g.save(); g.translate(0,H*0.24); wareFront(g,W,H*0.76,t,a); g.restore(); euroloch(g,W/2,H*0.1,H*0.055); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>{ g.fillStyle='#ffffff'; g.fillRect(0,0,W,H); }}],AUS);
  const L={f:B.R[0],s:B.R[1],t:B.R[1],u:B.R[1]};
  teil(k,[{geo:kbox(w,lh,0.0015,L),m:tm(0,h-lh/2,0.0062)},{geo:kbox(w,lh,0.0015,L),m:tm(0,h-lh/2,-0.0062,0,PI,0)},{geo:kbox(w,0.0015,0.014,L),m:tm(0,h-0.00075,0)}],B.mat);
  for(const s of [-1,1]) gl(k,Bx(0.012,0.0015,0.0008),tm(s*w*0.36,h-lh+0.008,0.0074),0xc9ccd2);
  teil(k,{geo:kissen(w*0.96,hb,0.012,{nx:6,ny:8,oben:0.006,unten:0.008,ein:0.02}),m:M0()},folieKlar);
  /* Fransenbuendel: schmale Metallstreifen, leicht gewellt */
  const gold=0xd4a017, silber=0xaab3bf, top=hb-0.03, len=top-0.02;
  /* Handy: zwei Lagen mit breiteren Streifen, ungewellt in einem Stueck */
  const ST=WARE_SPAR_AN?0.0124:0.0062;
  for(const [zz,off] of (WARE_SPAR_AN?[[0.0065,0],[-0.002,0.006]]:[[0.0065,0],[0.0015,0.003],[-0.004,0.0015]])) for(let x=-w*0.43+off;x<=w*0.43;x+=ST){
    const g=new T.PlaneGeometry(ST*0.9,len,1,WARE_SPAR_AN?1:4), p=g.attributes.position, ph=R()*TAU;
    for(let i=0;i<p.count;i++) p.setZ(i,Math.sin(p.getY(i)/len*TAU*1.3+ph)*0.0018);
    g.computeVertexNormals(); gl(k,g,tm(x,0.02+len/2,zz,0,(R()-0.5)*1.4,(R()-0.5)*0.03),Math.floor(x/ST)%2?gold:silber); }
  v(k,Bx(w*0.88,0.012,0.012),tm(0,top+0.004,0),0x2a2a30);
  return fertig(k); };

/* ================= 13 Tischdeko-Set: Geschenkset mit Rueckwand,
   Schale und Klarsichthaube ================= */
VP_FORM.tischdeko=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, th=h*0.17;
  const B=bogen([
    {w,h,draw:(g,W,H)=>{ grund(g,0,0,W,H,k); marke(g,0,0,W,H*0.11,k); titel(g,W/2,H*0.22,W*0.85,H*0.14,k); unter(g,W/2,H*0.34,W*0.8,H*0.07,k);
      const gr=g.createLinearGradient(0,H*0.4,0,H); gr.addColorStop(0,rgba(a.bg2,0.9)); gr.addColorStop(1,'#120e10'); g.fillStyle=gr; g.fillRect(0,H*0.4,W,H*0.6);
      for(let i=0;i<26;i++) WZ.stern(g,(i*53%97)/97*W,H*0.42+(i*37%89)/89*H*0.5,W*0.008+(i%3)*W*0.004,'rgba(255,214,110,.55)'); }},
    {w,h:th,draw:(g,W,H)=>{ grund(g,0,0,W,H,k,true); g.fillStyle='#e8c35a'; g.fillRect(0,0,W,H*0.08); WZ.txt(g,'SET · KERZEN · SERVIETTEN · KONFETTI',W/2,H*0.55,W*0.9,H*0.38,WFNT.kond,'#fff'); }},
    {w,h:d,draw:(g,W,H)=>{ g.fillStyle='#1c1a22'; g.fillRect(0,0,W,H); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}]);
  teil(k,[{geo:kbox(w,h,0.004,{f:B.R[0],b:B.R[3],s:B.R[3]}),m:tm(0,h/2,-d/2+0.002)},{geo:kbox(w,th,d-0.004,{f:B.R[1],t:B.R[2],s:B.R[3]}),m:tm(0,th/2,0.002)}],B.mat);
  /* Kerzen auf Goldhaltern */
  for(const x of [-w*0.38,-w*0.25]){ gl(k,Cy(0.016,0.02,0.008,14),tm(x,th+0.004,0),0xd4af37); v(k,Cy(0.0095,0.0095,h*0.45,12),tm(x,th+0.008+h*0.225,0),hx(a.ac2&&a.ac2!==a.bg2?a.ac2:'#c0392b')); v(k,Cy(0.0009,0.0009,0.008,4),tm(x,th+0.008+h*0.45+0.004,0),0x1b1b1b); }
  /* Servietten-Stapel mit Goldband */
  const sx=w*0.0; for(let i=0;i<6;i++) v(k,Bx(w*0.25,0.0045,d*0.62),tm(sx,th+0.0025+i*0.0046,0,0,(i-3)*0.02,0),i%2?0xffffff:0xf2ece0);
  gl(k,Bx(0.014,0.03,d*0.64),tm(sx,th+0.014,0),0xd4af37);
  /* Konfettischale */
  const kx=w*0.32; gl(k,Cy(0.045,0.03,0.018,16),tm(kx,th+0.009,0),0xd4af37); v(k,Cy(0.04,0.04,0.002,16),tm(kx,th+0.017,0),0x2a2228);
  for(let i=0;i<34;i++){ const an=R()*TAU, rr=R()*0.036; v(k,new T.TetrahedronGeometry(0.0045),tm(kx+Math.cos(an)*rr,th+0.02+R()*0.008,Math.sin(an)*rr,R()*3,R()*3,R()*3,1,0.3,1),hx(BUNT[i%6])); }
  /* Haube */
  teil(k,{geo:Bx(w*0.985,h*0.92-th,d*0.9),m:tm(0,th+(h*0.92-th)/2,0.004)},folieKlar);
  return fertig(k); };

/* ================= 14 Partygeschirr: Kartontray, Teller hochkant,
   Becherstapel, Besteck - alles in Schrumpffolie ================= */
VP_FORM.geschirr=t=>{ const k=S(t), {w,h,d,a}=k, tl=h*0.2, pr=Math.min(h*0.42,w*0.36);
  const B=bogen([
    {w,h:tl,draw:(g,W,H)=>{ g.fillStyle='#1f2533'; g.fillRect(0,0,W,H); g.fillStyle=a.ac; g.fillRect(0,0,W,H*0.07); titel(g,W/2,H*0.42,W*0.9,H*0.48,k,'#ffffff'); unter(g,W/2,H*0.82,W*0.88,H*0.24,k,'#ffd23f'); }},
    {w:pr*2,h:pr*2,draw:(g,W,H)=>{ g.fillStyle='#ffffff'; g.fillRect(0,0,W,H); g.fillStyle=a.ac; g.beginPath(); g.arc(W/2,H/2,W*0.5,0,TAU); g.arc(W/2,H/2,W*0.42,0,TAU,true); g.fill();
      for(let i=0;i<24;i++){ const an=i/24*TAU; WZ.stern(g,W/2+Math.cos(an)*W*0.46,H/2+Math.sin(an)*W*0.46,W*0.018,'#e8c35a'); }
      g.save(); g.beginPath(); g.arc(W/2,H/2,W*0.33,0,TAU); g.clip(); bild(g,W*0.17,H*0.17,W*0.66,H*0.66,k); g.restore(); g.strokeStyle='#e8c35a'; g.lineWidth=W*0.012; g.beginPath(); g.arc(W/2,H/2,W*0.33,0,TAU); g.stroke(); }},
    {w:0.2,h:0.04,draw:(g,W,H)=>{ for(let i=0;i<H;i+=2){ g.fillStyle=i%4?'#f4f4f4':'#d6d6d6'; g.fillRect(0,i,W,2); } }},
    {w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)},
    {w:0.2,h:0.2,draw:(g,W,H)=>{ g.fillStyle='#ffffff'; g.fillRect(0,0,W,H); g.fillStyle=a.ac; g.fillRect(0,H*0.06,W,H*0.08); g.fillStyle='#e8c35a'; g.fillRect(0,H*0.14,W,H*0.02);
      const rn=zufallAus(77); for(let i=0;i<40;i++) WZ.stern(g,rn()*W,H*0.25+rn()*H*0.65,W*(0.01+rn()*0.012),i%3?'#e8c35a':a.ac);
      for(const cx of [W*0.25,W*0.75]) WZ.txt(g,'2027',cx,H*0.5,W*0.3,H*0.16,WFNT.rund,a.ac,'center','rgba(0,0,0,.25)'); }}]);
  const td=d-0.004, zt=0, Sd=B.R[3], bx=w/2-0.04, cups=[];
  /* 03.10.: bedruckte Partybecher (vorher nackt weiss) */
  for(const bz of [d*0.22,-d*0.18]) cups.push({geo:reg(new T.CylinderGeometry(0.034,0.026,h*0.8,14,1,true),B.R[4]),m:tm(bx,h*0.4+0.003,bz)});
  teil(k,[{geo:kbox(w,tl,0.003,{f:B.R[0],s:Sd}),m:tm(0,tl/2,d/2-0.0015)},{geo:kbox(w,tl*0.6,0.003,{f:Sd}),m:tm(0,tl*0.3,-d/2+0.0015)},
          {geo:kbox(0.003,tl*0.6,td,{f:Sd}),m:tm(-w/2+0.0015,tl*0.3,0)},{geo:kbox(0.003,tl*0.6,td,{f:Sd}),m:tm(w/2-0.0015,tl*0.3,0)},{geo:kbox(w,0.003,d,{f:Sd}),m:tm(0,0.0015,0)},
          /* Tellerstapel hochkant, oberster Teller zeigt das Dekor */
          {geo:reg(new T.CircleGeometry(pr,28),B.R[1]),m:tm(-w/2+pr+0.004,pr+0.004,-d/2+0.05)},
          {geo:reg(new T.CylinderGeometry(pr,pr,0.04,28,1,true),B.R[2]),m:tm(-w/2+pr+0.004,pr+0.004,-d/2+0.03,PI/2)},...cups],B.mat);
  /* Becherstapel */
  for(const bz of [d*0.22,-d*0.18]){
    for(let i=0;i<8;i++) v(k,Cy(0.0352,0.0352,0.003,14,true),tm(bx,h*0.8-i*0.012,bz),i?0xf0f0f0:hx(a.ac));
    v(k,Cy(0.034,0.034,0.004,14),tm(bx,h*0.8+0.003,bz),hx(a.bg2)); }
  /* Besteckbuendel mit Papierband */
  for(let i=0;i<6;i++) v(k,Bx(0.011,h*0.6,0.0025),tm(-w*0.02+i*0.0035,h*0.31,d*0.22+(i%2)*0.004,0,0,(i-3)*0.025),i%3?0xf4f4f4:0xd8dde3);
  v(k,Bx(0.03,0.02,0.012),tm(-w*0.012,h*0.33,d*0.222),hx(a.ac));
  teil(k,{geo:Bx(w,h*0.99,d),m:tm(0,h*0.495,0)},folieKlar);
  return fertig(k); };

/* ================= 15 Partyspiel: Spielkarton mit Stuelpdeckel in
   Folie ================= */
VP_FORM.partyspiel=t=>{ const k=S(t), {w,h,d,a}=k, ld=d*0.56;
  const A=atlas(w,h,ld,a,0,{front:(g,W,H)=>{ wareFront(g,W,H,t,a); const S2=Math.min(W,H), x=W-S2*0.15, y=S2*0.27;
      g.fillStyle='#ffd23f'; stern(g,x,y,S2*0.12,14,0.78); g.fill(); WZ.txt(g,'NEU!',x,y,S2*0.17,S2*0.07,WFNT.rund,'#d8322a'); },
    side:(g,W,H)=>{ grund(g,0,0,W,H,k,true); g.save(); g.translate(W/2,H/2); g.rotate(-PI/2); WZ.txt(g,titelS(k),0,0,H*0.8,W*0.55,WFNT.rund,a.ac); g.restore(); },
    top:(g,W,H)=>{ grund(g,0,0,W,H,k,true); WZ.txt(g,titelS(k),W/2,H/2,W*0.8,H*0.6,WFNT.rund,a.ac); },rough:0.4});
  teil(k,{geo:atlasBox(w,h,ld,A.R),m:tm(0,h/2,d/2-ld/2)},A.mat);
  v(k,Bx(w*0.985,h*0.985,d-ld+0.004),tm(0,h/2,-d/2+(d-ld+0.004)/2),hx(a.bg2));
  v(k,Bx(w*0.99,0.003,d-ld),tm(0,h*0.985,-d/2+(d-ld)/2),0x1b1b22);
  teil(k,{geo:Bx(w,h,d),m:tm(0,h/2,0)},folieMat);
  return fertig(k); };

/* ================= 16 Fondue-Geraet: Elektrogeraete-Karton mit
   Kunststoff-Tragegriff ================= */
VP_FORM.fonduegeraet=t=>{ const k=S(t), {w,h,d,a}=k, hb=h-0.04;
  const A=atlas(w,hb,d,a,0,{front:(g,W,H)=>{ wareFront(g,W,H,t,a); const S2=Math.min(W,H);
      g.fillStyle='#d8322a'; g.beginPath(); g.arc(W-S2*0.12,S2*0.28,S2*0.085,0,TAU); g.fill(); WZ.txt(g,'1000 W',W-S2*0.12,S2*0.28,S2*0.14,S2*0.05,WFNT.rund,'#fff');
      g.fillStyle='rgba(255,255,255,.9)'; WZ.rr(g,W*0.03,H*0.9-S2*0.08,S2*0.2,S2*0.07,S2*0.015); g.fill(); WZ.txt(g,'8 PERSONEN',W*0.03+S2*0.1,H*0.9-S2*0.045,S2*0.18,S2*0.04,WFNT.kond,'#222'); },
    side:(g,W,H)=>{ g.fillStyle='#f6f3ee'; g.fillRect(0,0,W,H); bild(g,W*0.06,H*0.08,W*0.88,H*0.45,k); g.strokeStyle='#999'; g.strokeRect(W*0.06,H*0.08,W*0.88,H*0.45);
      WZ.txt(g,titelS(k),W/2,H*0.6,W*0.85,H*0.07,WFNT.rund,'#222'); ['✓ Edelstahltopf 1,5 l','✓ 8 Gabeln, farbig','✓ Temperaturregler','✓ Spritzschutz'].forEach((s,i)=>WZ.txt(g,s,W*0.1,H*(0.7+i*0.065),W*0.8,H*0.05,WFNT.kond,'#333','left'));
      g.fillStyle=a.bg2; g.fillRect(0,H*0.95,W,H*0.05); },
    top:(g,W,H)=>{ grund(g,0,0,W,H,k,true); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,H*0.495,W,H*0.01); WZ.txt(g,'▲ OBEN ▲',W/2,H*0.25,W*0.4,H*0.08,WFNT.kond,'#fff'); }});
  teil(k,{geo:atlasBox(w,hb,d,A.R),m:tm(0,hb/2,0)},A.mat);
  /* Klebeband ueber die Deckelnaht */
  v(k,Bx(0.05,0.0012,d*0.9),tm(w*0.3,hb+0.0006,0),0xc9b48a);
  /* Tragegriff */
  const gw=Math.min(0.2,w*0.42);
  for(const s of [-1,1]) v(k,Bx(0.028,0.008,0.05),tm(s*gw/2,hb+0.004,0),0x26282e);
  v(k,new T.TorusGeometry(gw/2,0.006,5,14,PI),tm(0,hb+0.006,0,0,0,0,1,(h-hb-0.012)/(gw/2),1),0x26282e);
  return fertig(k); };

/* ================= 17 Raclette-Grill: brauner Wellpappkarton mit
   Grifflöchern, darum eine bedruckte Schiebe-Banderole ================= */
VP_FORM.raclettegeraet=t=>{ const k=S(t), {w,h,d,a}=k, sw=w*0.56;
  const A=atlas(w-0.006,h-0.004,d-0.006,a,0,{front:(g,W,H)=>{ kraft(g,W,H); WZ.txt(g,'RACLETTE',W*0.86,H*0.35,W*0.24,H*0.12,WFNT.rund,'#2b2015');
      WZ.txt(g,'↑↑',W*0.9,H*0.75,W*0.12,H*0.18,WFNT.klar,'#2b2015'); WZ.txt(g,'⚡ 230 V',W*0.12,H*0.85,W*0.16,H*0.08,WFNT.kond,'#2b2015'); },
    side:(g,W,H)=>{ kraft(g,W,H); g.fillStyle='#2a1d10'; WZ.rr(g,W*0.35,H*0.12,W*0.3,H*0.13,H*0.06); g.fill(); g.fillStyle='#4a3520'; WZ.rr(g,W*0.36,H*0.13,W*0.28,H*0.06,H*0.03); g.fill();
      WZ.txt(g,'GRILL FÜR 8 PERSONEN',W/2,H*0.55,W*0.8,H*0.09,WFNT.kond,'#2b2015'); WZ.txt(g,'♻',W/2,H*0.78,W*0.2,H*0.14,WFNT.klar,'#2b2015'); },
    top:(g,W,H)=>{ kraft(g,W,H); g.fillStyle='rgba(150,110,60,.85)'; g.fillRect(W*0.44,0,W*0.12,H); }});
  teil(k,{geo:atlasBox(w-0.006,h-0.004,d-0.006,A.R),m:tm(0,(h-0.004)/2,0)},A.mat);
  const B=atlas(sw,h,d,a,0,{front:(g,W,H)=>{ wareFront(g,W,H,t,a); },top:(g,W,H)=>{ grund(g,0,0,W,H,k,true); bild(g,W*0.05,H*0.1,W*0.9,H*0.8,k); }});
  teil(k,{geo:atlasBox(sw,h,d,B.R),m:tm(-w*0.12,h/2,0)},B.mat);
  return fertig(k); };

/* ================= 18 Streichhoelzer: 10 Schachteln hochkant im
   Folienbuendel, Aufkleber oben ================= */
VP_FORM.streichhoelzer=t=>{ const k=S(t), {w,h,d,a}=k, bw=w*0.485, bh=h*0.94, bd=(d-0.006)/5;
  const B=bogen([
    {w:bw,h:bh,draw:(g,W,H)=>{ g.fillStyle='#1c1410'; g.fillRect(0,0,W,H); g.fillStyle=a.bg1; g.fillRect(W*0.04,H*0.06,W*0.92,H*0.88);
      bild(g,W*0.04,H*0.06,W*0.4,H*0.88,k); WZ.txt(g,titelS(k),W*0.7,H*0.42,W*0.5,H*0.24,WFNT.rund,a.ac,'center','rgba(0,0,0,.5)'); WZ.txt(g,'windfest',W*0.7,H*0.72,W*0.45,H*0.16,WFNT.kond,'#fff'); }},
    {w:bd,h:bh,draw:(g,W,H)=>{ g.fillStyle='#5a3a26'; g.fillRect(0,0,W,H); const r=zufallAus(5); for(let i=0;i<60;i++){ g.fillStyle=r()<0.5?'#3d271a':'#7a5238'; g.fillRect(r()*W,r()*H,2,2); } }},
    {w:bw,h:bd,draw:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); WZ.txt(g,titelS(k),W/2,H/2,W*0.8,H*0.6,WFNT.kond,'#fff'); }},
    {w:0.08,h:0.04,draw:(g,W,H)=>{ g.fillStyle='#d8322a'; g.fillRect(0,0,W,H); g.strokeStyle='#fff'; g.lineWidth=H*0.05; g.strokeRect(H*0.08,H*0.08,W-H*0.16,H*0.84); WZ.txt(g,'10 SCHACHTELN',W/2,H*0.36,W*0.85,H*0.3,WFNT.kond,'#fff'); WZ.txt(g,titelS(k),W/2,H*0.7,W*0.8,H*0.26,WFNT.rund,'#ffd23f'); }}]);
  const geo=[];
  for(const s of [-1,1]) for(let i=0;i<5;i++) geo.push({geo:kbox(bw-0.001,bh,bd-0.001,{f:B.R[0],s:B.R[1],t:B.R[2]}),m:tm(s*bw/2,bh/2+0.001,-d/2+0.003+bd*(i+0.5))});
  geo.push({geo:reg(new T.PlaneGeometry(0.08,0.04),B.R[3]),m:tm(0,bh+0.0015,0,-PI/2)});
  teil(k,geo,B.mat);
  teil(k,{geo:Bx(w,h,d),m:tm(0,h/2,0)},folieKlar);
  return fertig(k); };

/* ================= 19 Gehoerschutz: Spenderbox mit runder
   Entnahmeoeffnung, die Stoepsel liegen sichtbar darin ================= */
VP_FORM.gehoerschutz=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, ly=0.8, lr=0.18;
  const A=lochAtlas(w,h,d,a,0,{front:(g,W,H)=>{ grund(g,0,0,W,H,k); marke(g,0,0,W,H*0.08,k); bild(g,W*0.06,H*0.1,W*0.88,H*0.38,k);
      titel(g,W/2,H*0.55,W*0.9,H*0.1,k); unter(g,W/2,H*0.635,W*0.85,H*0.045,k);
      g.save(); g.setLineDash([W*0.02,W*0.015]); g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=W*0.01; g.beginPath(); g.arc(W/2,H*ly,W*lr*1.25,0,TAU); g.stroke(); g.restore();
      WZ.txt(g,'HIER ENTNEHMEN',W/2,H*0.69,W*0.6,H*0.025,WFNT.kond,'#fff'); },
    lochFront:(W,H)=>[{x:W/2,y:H*ly,r:W*lr}]});
  teil(k,{geo:atlasBox(w,h,d,A.R),m:tm(0,h/2,0)},A.mat);
  v(k,Bx(w*0.97,h*0.4,0.002),tm(0,h*0.2,-d/2+0.003),hx(a.bg2)); v(k,Bx(w*0.97,0.002,d*0.95),tm(0,0.002,0),hx(a.bg2));
  for(const s of [-1,1]) v(k,Bx(0.002,h*0.4,d*0.95),tm(s*(w/2-0.002),h*0.2,0),hx(a.bg2));
  v(k,Bx(w*0.97,0.002,d*0.95),tm(0,h*0.38,0),hx(a.bg2));
  const F=['#ffd23f','#ff8a3d','#b6ff4a','#ff6fa8'];
  for(let i=0;i<24;i++){ const x=(R()-0.5)*w*0.75, y=0.012+R()*h*0.22, z=(R()-0.5)*d*0.6;
    v(k,Cy(0.0055,0.006,0.02,7),tm(x,y,z,R()*3,R()*3,R()*3),hx(F[i%4])); }
  return fertig(k); };

/* ================= 20 Schutzbrille: Klarsicht-Faltschachtel (PET)
   mit Karton-Einleger ================= */
VP_FORM.schutzbrille=t=>{ const k=S(t), {w,h,d,a}=k, fl=h*0.3;
  const B=bogen([
    {w,h,draw:(g,W,H)=>{ grund(g,0,0,W,H,k); marke(g,0,0,W*0.4,H*0.16,k); g.fillStyle='rgba(255,255,255,.18)'; for(let i=0;i<W;i+=W*0.06) g.fillRect(i,0,W*0.025,H); WZ.txt(g,'EN 166 · KRATZFEST',W*0.78,H*0.08,W*0.4,H*0.08,WFNT.kond,'#fff'); }},
    {w,h:fl,draw:(g,W,H)=>{ grund(g,0,0,W,H,k,true); titel(g,W/2,H*0.42,W*0.9,H*0.5,k); unter(g,W/2,H*0.83,W*0.85,H*0.24,k); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}]);
  const Sd=B.R[2];
  teil(k,[{geo:kbox(w*0.98,h*0.97,0.003,{f:B.R[0],s:Sd}),m:tm(0,h*0.485,-d/2+0.003)},{geo:kbox(w*0.98,fl,0.003,{f:B.R[1],s:Sd}),m:tm(0,fl/2,d/2-0.004)},{geo:kbox(w*0.98,0.003,d*0.96,{f:Sd}),m:tm(0,0.002,0)}],B.mat);
  /* Brille: gebogene Scheibe, Rahmen oben/unten, Seitenteile, Band */
  const Rl=w*0.47, L=1.8, zl=d/2-0.012, cz=zl-Rl, ly=h*0.56, lh=h*0.42, yl=0x2a2d33, fc=hx(a.ac&&a.ac!=='#ffffff'?a.ac:'#ffd23f');
  teil(k,{geo:new T.CylinderGeometry(Rl,Rl,lh,14,1,true,-L/2,L),m:tm(0,ly,cz)},glassMat);
  for(const y of [ly+lh/2,ly-lh/2]) v(k,new T.TorusGeometry(Rl,0.0035,4,14,L),tm(0,y,cz,PI/2,0,PI/2-L/2),y>ly?yl:fc);
  for(const s of [-1,1]){ const x=s*Rl*Math.sin(L/2), z=cz+Rl*Math.cos(L/2); v(k,Bx(0.008,lh*1.05,0.012),tm(x,ly,z,0,s*L/2,0),yl);
    v(k,Bx(0.004,lh*0.5,Math.abs(z-(-d/2+0.012))),tm(x*0.97,ly,(z+(-d/2+0.012))/2),fc); }
  v(k,Bx(2*Rl*Math.sin(L/2)*0.97,lh*0.5,0.003),tm(0,ly,-d/2+0.012),fc);
  v(k,Bx(0.022,0.012,0.006),tm(0,ly-lh/2+0.004,zl+0.001),yl);
  /* Klarsichtschachtel mit Kanten */
  teil(k,{geo:Bx(w*0.995,h*0.995,d*0.995),m:tm(0,h/2,0)},folieKlar);
  const e=0.0012, ec=0xe6ecf2;
  for(const sy of [-1,1]) for(const sz of [-1,1]) v(k,Bx(w,e,e),tm(0,h/2+sy*(h/2-e/2),sz*(d/2-e/2)),ec);
  for(const sx of [-1,1]) for(const sz of [-1,1]) v(k,Bx(e,h,e),tm(sx*(w/2-e/2),h/2,sz*(d/2-e/2)),ec);
  for(const sx of [-1,1]) for(const sy of [-1,1]) v(k,Bx(e,e,d),tm(sx*(w/2-e/2),h/2+sy*(h/2-e/2),0),ec);
  return fertig(k); };

/* ================= 21 Feuerloescher: Loeschspray-Dose mit Abzug,
   Sicherungsclip und Gebrauchsanweisung ================= */
VP_FORM.feuerloescher=t=>{ const k=S(t), {w,h,d,a}=k, R=w/2*0.9, hb=h*0.69;
  const rot='#c62828';
  const B=bogen([{w:TAU*R,h:hb-0.006,draw:rundum((g,W,H)=>{ g.fillStyle=rot; g.fillRect(0,0,W,H); g.fillStyle='#ffffff'; g.fillRect(W*0.08,H*0.08,W*0.84,H*0.66); g.save(); g.translate(W*0.1,H*0.09); wareFront(g,W*0.8,H*0.64,t,a); g.restore();
      ['A','B','F'].forEach((c,i)=>{ const x=W*(0.24+i*0.26); g.fillStyle='#fff'; g.fillRect(x-W*0.1,H*0.78,W*0.2,H*0.14); WZ.txt(g,c,x,H*0.85,W*0.15,H*0.11,WFNT.rund,rot); }); },
    (g,W,H)=>{ g.fillStyle=rot; g.fillRect(0,0,W,H); g.fillStyle='#fff'; g.fillRect(W*0.1,H*0.1,W*0.8,H*0.8);
      ['1  Clip abziehen','2  Auf Brandherd richten','3  Abzug drücken','Abstand 1–2 m'].forEach((s,i)=>WZ.txt(g,s,W*0.15,H*(0.2+i*0.12),W*0.7,H*0.07,WFNT.kond,'#222','left'));
      for(let i=0;i<8;i++){ g.fillStyle='#bbb'; g.fillRect(W*0.15,H*(0.7+i*0.022),W*(0.5+(i%3)*0.1),H*0.008); } })}],{roughness:0.35});
  teil(k,{geo:rohr(kreis(R,28),0.006,hb,B.R[0]),m:M0()},B.mat);
  gl(k,Cy(R*0.98,R,0.006,28),tm(0,0.003,0),0xb9bec6);
  gl(k,new T.SphereGeometry(R,24,6,0,TAU,0,PI/2),tm(0,hb,0,0,0,0,1,0.42,1),hx(rot));
  gl(k,Cy(R*0.36,R*0.4,0.008,16),tm(0,hb+R*0.42+0.003,0),0xd6d9de);
  /* Spruehkopf mit Abzug und Duese, gelber Sicherungsclip */
  const yk=hb+R*0.42+0.007;
  v(k,Cy(R*0.34,R*0.36,0.034,14),tm(0,yk+0.017,0),0x1e1e22);
  v(k,Bx(R*0.5,0.008,R*1.0),tm(0,yk+0.039,-R*0.1,-0.18),0x1e1e22);
  v(k,Cy(0.0045,0.0045,R*0.7,8),tm(0,yk+0.024,R*0.35+0.008,PI/2),0x2a2a30);
  v(k,Bx(R*0.42,0.006,0.004),tm(0,yk+0.03,R*0.36),0xffd23f);
  v(k,new T.TorusGeometry(0.008,0.0015,4,10),tm(R*0.32,yk+0.034,R*0.2,0,PI/2,0),0xffd23f);
  return fertig(k); };

/* ================= 22 Luftschlangen-Spray: 3 Dosen im Kartontraeger
   mit Kragen und Griffloch ================= */
VP_FORM.luftschlangenspray=t=>{ const k=S(t), {w,h,d,a}=k, r=Math.min(d/2*0.92,w/6.4), hb=h*0.7, ys=h*0.38;
  const C=['#ff4d6d','#7cff6b','#3ec1ff'];
  const dose=c=>(g,W,H)=>{ g.fillStyle=c; g.fillRect(0,0,W,H); g.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<6;i++){ g.save(); g.translate(W*(i+0.5)/6,H*0.3); g.rotate(0.5); g.fillRect(-W*0.02,-H*0.2,W*0.04,H*0.4); g.restore(); }
    /* 03.10.: Schrift mittig vorn (u 0,5) und hinten - vorher sass sie auf der Seite und war vorn abgeschnitten ("SP") */
    for(const cx of [W*0.5,0,W]){ WZ.txt(g,'SPRAY',cx,H*0.6,W*0.42,H*0.2,WFNT.rund,'#ffffff','center','rgba(0,0,0,.35)'); WZ.txt(g,'Luftschlangen',cx,H*0.8,W*0.4,H*0.1,WFNT.kond,'#ffffff','center','rgba(0,0,0,.35)'); } };
  const pb=stadion(w*0.995,2*r+0.004,8); let L=0; for(let i=0;i<pb.length;i++){ const p1=pb[i], p2=pb[(i+1)%pb.length]; L+=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]); }
  const B=bogen([{w:L,h:ys,draw:rundum(vorne(k))},...C.map(c=>({w:TAU*r,h:hb-ys,draw:dose(c)}))],{roughness:0.4});
  const geo=[{geo:rohr(pb,0,ys,B.R[0]),m:M0()}];
  [-1,0,1].forEach((s,i)=>{ const x=s*(2*r+0.003);
    geo.push({geo:rohr(kreis(r,20),ys,hb,B.R[i+1]),m:tm(x,0,0)});
    gl(k,Cy(r*0.62,r,0.014,20),tm(x,hb+0.007,0),0xd6d9de);
    v(k,Cy(r*0.85,r*0.9,h*0.16,16),tm(x,hb+0.014+h*0.08,0),hx(C[i]));
    v(k,Bx(r*0.4,0.012,r*0.5),tm(x,hb+0.014+h*0.16+0.006,r*0.25),0xf4f4f4);
    v(k,Cy(0.003,0.003,r*0.6,6),tm(x,hb+0.014+h*0.16+0.006,r*0.6,PI/2),0x222222); });
  teil(k,geo,B.mat);
  /* Kragen mit Griffloch hinten */
  v(k,profilDeckel(pb,false),tm(0,ys+0.0005,0),hx(a.bg2));
  const gh=new T.Shape([new T.Vector2(-0.03,0),new T.Vector2(0.03,0),new T.Vector2(0.025,0.045),new T.Vector2(-0.025,0.045)]);
  const lo=new T.Path(); lo.absellipse(0,0.03,0.016,0.007,0,TAU,true); gh.holes.push(lo);
  v(k,new T.ExtrudeGeometry(gh,{depth:0.002,bevelEnabled:false,curveSegments:6}),tm(0,ys,-r-0.003),hx(a.bg2));
  return fertig(k); };

/* ================= 23 Wandkalender: Deckblatt, Graupappe,
   Wire-O-Bindung mit Aufhaenger, in Folie ================= */
VP_FORM.kalender=t=>{ const k=S(t), {w,h,d,a}=k, cw=w*0.97, chh=h*0.9, cd=Math.min(0.008,d*0.3);
  const B=bogen([{w:cw,h:chh,draw:vorne(k)},{w:0.04,h:0.01,draw:(g,W,H)=>{ g.fillStyle='#fafafa'; g.fillRect(0,0,W,H); g.fillStyle='#d8d8d8'; for(let i=0;i<H;i+=2) g.fillRect(0,i,W,1); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>{ g.fillStyle='#8f8a82'; g.fillRect(0,0,W,H); }}]);
  teil(k,[{geo:kbox(cw,chh,cd,{f:B.R[0],s:B.R[1],t:B.R[1],u:B.R[1],b:B.R[2]}),m:tm(0,0.004+chh/2,0)},{geo:kbox(w*0.985,h*0.92,0.0025,{f:B.R[2]}),m:tm(0,0.003+h*0.46,-cd/2-0.0013)}],B.mat);
  /* Ringbindung */
  const yt=0.004+chh, rr=0.0048, n=26;
  for(let i=0;i<n;i++){ const x=-cw*0.47+i*cw*0.94/(n-1); if(Math.abs(x)<0.025) continue; gl(k,new T.TorusGeometry(rr,0.00075,3,8),tm(x,yt-0.001,0,0,PI/2,0),0xc9ccd2); }
  for(const s of [-1,1]) gl(k,Cy(0.0008,0.0008,0.03,4),tm(s*0.011,yt+0.009,0,0,0,s*0.75),0xc9ccd2);
  gl(k,new T.TorusGeometry(0.005,0.0008,3,8,PI),tm(0,h-0.0075,0),0xc9ccd2);
  teil(k,{geo:Bx(w,h,Math.min(d,cd+0.012)),m:tm(0,h/2,0)},folieKlar);
  return fertig(k); };

/* ================= 24 Sektglaeser: Fensterkarton mit Steg-Einsaetzen,
   die 12 Glaeser stehen sichtbar darin ================= */
VP_FORM.sektglaeser=t=>{ const k=S(t), {w,h,d,a}=k, fw=[0.07,0.12,0.86,0.58];
  const A=lochAtlas(w,h,d,a,0,{front:(g,W,H)=>{ grund(g,0,0,W,H,k); marke(g,0,0,W,H*0.1,k); const gr=g.createLinearGradient(0,H*0.1,0,H*0.72); gr.addColorStop(0,'#14181f'); gr.addColorStop(1,'#2b3240'); g.fillStyle=gr; g.fillRect(W*0.05,H*0.1,W*0.9,H*0.62);
      titel(g,W/2,H*0.8,W*0.9,H*0.12,k); unter(g,W/2,H*0.92,W*0.85,H*0.07,k); },
    lochFront:(W,H)=>[{x:W*fw[0],y:H*fw[1],w:W*fw[2],h:H*fw[3]}],
    top:(g,W,H)=>{ grund(g,0,0,W,H,k,true); }, lochTop:(W,H)=>[{x:W*0.08,y:H*0.12,w:W*0.84,h:H*0.76}]});
  teil(k,{geo:atlasBox(w,h,d,A.R),m:tm(0,h/2,0)},A.mat);
  const ic=0x1c2430;
  v(k,Bx(w*0.98,h*0.98,0.002),tm(0,h/2,-d/2+0.002),ic); for(const s of [-1,1]) v(k,Bx(0.002,h*0.98,d*0.98),tm(s*(w/2-0.002),h/2,0),ic);
  /* Stege */
  const sh=h*0.3; for(let i=1;i<4;i++) v(k,Bx(0.0025,sh,d*0.96),tm(-w/2+w*i/4,sh/2,0),0xc9a46a); for(let j=1;j<3;j++) v(k,Bx(w*0.97,sh,0.0025),tm(0,sh/2,-d/2+d*j/3),0xc9a46a);
  v(k,Bx(w*0.97,0.003,d*0.96),tm(0,0.0015,0),0xb8925f);
  /* Sektfloeten (Kunststoff) */
  const gh=h*0.84, pts=[[0.024,0],[0.024,0.003],[0.004,0.007],[0.0028,0.4],[0.016,0.55],[0.021,0.75],[0.023,1]].map(p=>new T.Vector2(p[0]*Math.min(1,w/0.29),p[1]*gh));
  const geo=[]; for(let i=0;i<4;i++) for(let j=0;j<3;j++) geo.push({geo:new T.LatheGeometry(pts,7),m:tm(-w/2+w*(i+0.5)/4,0.003,-d/2+d*(j+0.5)/3)});
  teil(k,geo,glassMat);
  for(let i=0;i<4;i++) for(let j=0;j<3;j++){ const x=-w/2+w*(i+0.5)/4, z=-d/2+d*(j+0.5)/3, sc=Math.min(1,w/0.29);
    v(k,new T.CircleGeometry(0.024*sc,8),tm(x,0.0062,z,-PI/2),0xf2f4f6); v(k,Cy(0.0028*sc,0.0028*sc,gh*0.39,5,true),tm(x,0.003+gh*0.2,z),0xf2f4f6); v(k,new T.TorusGeometry(0.023*sc,0.0009,3,8),tm(x,0.003+gh,z,PI/2),0xffffff); }
  teil(k,[{geo:new T.PlaneGeometry(w*fw[2],h*fw[3]),m:tm(0,h*(1-fw[1]-fw[3]/2),d/2-0.002)},{geo:new T.PlaneGeometry(w*0.84,d*0.76),m:tm(0,h-0.002,0,-PI/2)}],folieKlar);
  return fertig(k); };

/* ================= 25 Kerzen: 10 Goldkerzen in einer Reihe, Folie,
   breite Papierbanderole ================= */
VP_FORM.kerzen=t=>{ const k=S(t), {w,h,d,a}=k, n=10, r=w/n/2*0.93, ch=h*0.86;
  for(let i=0;i<n;i++){ const x=-w/2+w*(i+0.5)/n;
    gl(k,Cy(r,r,ch,8,true),tm(x,0.004+ch/2,0),0xd4af37); gl(k,Cy(r*0.55,r,0.012,8,true),tm(x,0.004+ch+0.006,0),0xe2c060);
    v(k,Cy(0.0008,0.0008,0.009,4),tm(x,0.004+ch+0.016,0),0x1b1b1b); }
  const pb=stadion(w*0.998,2*r+0.004,6); let L=0; for(let i=0;i<pb.length;i++){ const p1=pb[i], p2=pb[(i+1)%pb.length]; L+=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]); }
  const bh=h*0.32, B=bogen([{w:L,h:bh,draw:rundum(vorne(k))}]);
  teil(k,{geo:rohr(pb,h*0.22,h*0.22+bh,B.R[0]),m:M0()},B.mat);
  const pf=stadion(w,2*r+0.008,6);
  teil(k,[{geo:rohr(pf,0,h*0.955),m:M0()},{geo:profilDeckel(pf,false),m:tm(0,h*0.955,0)}],folieKlar);
  return fertig(k); };

/* ================= 26 Servietten: Folienpack mit Schweissenden,
   Muster obenauf, Aufkleber vorn ================= */
VP_FORM.servietten=t=>{ const k=S(t), {w,h,d,a}=k, sw=w*0.9, sh=h*0.86, sd=d*0.92;
  const lage=(g,W,H)=>{ g.fillStyle='#f6f2ea'; g.fillRect(0,0,W,H); for(let i=0;i<H;i+=3){ g.fillStyle=i%6?'rgba(0,0,0,.06)':rgba(a.bg2,0.35); g.fillRect(0,i,W,1); } };
  const B=bogen([{w:sw,h:sh,draw:lage},{w:sd,h:sh,draw:lage},
    {w:sw,h:sd,draw:(g,W,H)=>{ g.fillStyle='#fffaf0'; g.fillRect(0,0,W,H); g.strokeStyle=a.bg2; g.lineWidth=W*0.03; g.strokeRect(W*0.04,H*0.05,W*0.92,H*0.9); g.strokeStyle='#e8c35a'; g.lineWidth=W*0.008; g.strokeRect(W*0.08,H*0.1,W*0.84,H*0.8);
      bild(g,W*0.12,H*0.13,W*0.76,H*0.5,k); WZ.txt(g,'Prosit Neujahr',W/2,H*0.76,W*0.7,H*0.13,WFNT.schreib,a.bg2); }},
    {w:w*0.56,h:h*0.5,draw:vorne(k)}]);
  teil(k,[{geo:kbox(sw,sh,sd,{f:B.R[0],s:B.R[1],t:B.R[2]}),m:tm(0,0.003+sh/2,0)},{geo:kbox(w*0.56,h*0.5,0.0008,{f:B.R[3],s:B.R[3]}),m:tm(0,h*0.45,d*0.475)}],B.mat);
  teil(k,[{geo:Bx(sw*1.02,h*0.94,d*0.95),m:tm(0,h*0.47,0)},...[-1,1].map(s=>({geo:Bx(w*0.04,h*0.15,d*0.9),m:tm(s*(sw*0.51+w*0.02),h*0.47,0)}))],folieKlar);
  for(const s of [-1,1]) for(let i=0;i<5;i++) v(k,Bx(w*0.038,0.0012,d*0.9),tm(s*(sw*0.51+w*0.02),h*0.42+i*0.0025,0),0xeef2f6);
  return fertig(k); };

/* ================= 27 Haarreifen: ausgestanzte Bogenkarte auf
   bedrucktem Sockel, Haarreif mit Kroenchen aufgesteckt ================= */
VP_FORM.haarreifen=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, sh=h*0.2, cw=w*0.96, chh=h-sh+0.02, zc=-d*0.12;
  const B=bogen([
    {w,h:sh,draw:(g,W,H)=>{ grund(g,0,0,W,H,k,true); titel(g,W/2,H*0.42,W*0.9,H*0.5,k); unter(g,W/2,H*0.82,W*0.85,H*0.24,k); g.fillStyle='#e8c35a'; g.fillRect(0,0,W,H*0.06); }},
    {w:cw,h:chh,draw:(g,W,H)=>{ const rr=W/2; g.save(); g.beginPath(); g.moveTo(0,H); g.lineTo(0,rr); g.arc(W/2,rr,rr,PI,0); g.lineTo(W,H); g.closePath(); g.clip();
      const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2a1840'); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
      for(let i=0;i<40;i++) WZ.stern(g,(i*53%97)/97*W,(i*31%89)/89*H,W*(0.006+(i%3)*0.004),'rgba(255,220,120,.6)');
      marke(g,W*0.3,H*0.86,W*0.4,H*0.07,k); g.restore();
      g.strokeStyle='#e8c35a'; g.lineWidth=W*0.012; g.beginPath(); g.moveTo(W*0.006,H); g.lineTo(W*0.006,rr); g.arc(W/2,rr,rr-W*0.006,PI,0); g.lineTo(W*0.994,H); g.stroke(); }},
    {w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}],AUS);
  teil(k,[{geo:kbox(w,sh,d*0.7,{f:B.R[0],s:B.R[2]}),m:tm(0,sh/2,d*0.15)},{geo:kbox(cw,chh,0.002,{f:B.R[1],s:B.R[2]}),m:tm(0,sh-0.02+chh/2,zc)}],B.mat);
  /* Haarreif im Bogen, Kroenchen oben, zwei Sterne an Federn */
  const rH=cw*0.4, cy=h-cw/2-0.03, zf=zc+0.006;
  v(k,new T.TorusGeometry(rH,0.0042,5,22,PI),tm(0,cy,zf),0x1b1b22);
  gl(k,new T.TorusGeometry(rH+0.0042,0.0012,3,22,PI),tm(0,cy,zf+0.002),0xe8c35a);
  const ky=cy+rH+0.002; gl(k,Cy(0.03,0.026,0.016,12,true),tm(0,ky+0.008,zf),0xf2c230);
  for(let i=0;i<5;i++){ const an=-PI*0.4+i*PI*0.2; gl(k,new T.ConeGeometry(0.006,0.018,4),tm(Math.sin(an)*0.028,ky+0.024,zf+Math.cos(an)*0.012),0xf2c230); v(k,Sp(0.0035,6,4),tm(Math.sin(an)*0.028,ky+0.034,zf+Math.cos(an)*0.012),hx(BUNT[i])); }
  for(const s of [-1,1]){ const an=s*0.75, bx=Math.sin(an)*rH, by=cy+Math.cos(an)*rH; v(k,Cy(0.0012,0.0012,0.04,4),tm(bx+s*0.008,by+0.018,zf,0,0,-s*0.4),0x888888); gl(k,sternForm(0.014,0.006,0.003),tm(bx+s*0.016,by+0.04,zf),0xf2c230); }
  return fertig(k); };

/* ================= 28 Fotobox: Polaroid-Rahmen-Karton mit Ausschnitt,
   die Requisiten am Stab stecken darin ================= */
VP_FORM.fotobox=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, fw=[0.07,0.07,0.86,0.63];
  const A=lochAtlas(w,h,d,a,0,{front:(g,W,H)=>{ g.fillStyle='#fbf8f2'; g.fillRect(0,0,W,H); g.fillStyle=a.bg2; g.fillRect(0,0,W,H*0.02); g.fillRect(0,H*0.98,W,H*0.02);
      titel(g,W/2,H*0.81,W*0.8,H*0.14,k,a.bg2); unter(g,W/2,H*0.92,W*0.8,H*0.06,k,'#444'); WZ.txt(g,'PARTYZEIT',W*0.88,H*0.72,W*0.18,H*0.035,WFNT.rund,a.bg2); },
    lochFront:(W,H)=>[{x:W*fw[0],y:H*fw[1],w:W*fw[2],h:H*fw[3]}]});
  teil(k,{geo:atlasBox(w,h,d,A.R),m:tm(0,h/2,0)},A.mat);
  /* Requisiten-Bogen: Fotowand + Ausstanzteile */
  const prop=[
    (g,W,H)=>{ g.fillStyle='#1b1b1b'; g.beginPath(); g.moveTo(W/2,H*0.45); g.bezierCurveTo(W*0.3,H*0.1,W*0.05,H*0.3,W*0.02,H*0.6); g.bezierCurveTo(W*0.15,H*0.45,W*0.3,H*0.85,W/2,H*0.6); g.bezierCurveTo(W*0.7,H*0.85,W*0.85,H*0.45,W*0.98,H*0.6); g.bezierCurveTo(W*0.95,H*0.3,W*0.7,H*0.1,W/2,H*0.45); g.fill(); },
    (g,W,H)=>{ g.fillStyle='#e0203a'; g.beginPath(); g.moveTo(W*0.05,H/2); g.quadraticCurveTo(W*0.3,H*0.05,W/2,H*0.3); g.quadraticCurveTo(W*0.7,H*0.05,W*0.95,H/2); g.quadraticCurveTo(W/2,H*1.05,W*0.05,H/2); g.fill(); g.fillStyle='#9a0f22'; g.fillRect(W*0.12,H*0.48,W*0.76,H*0.04); },
    (g,W,H)=>{ g.fillStyle='#1b1b1b'; g.fillRect(W*0.25,H*0.05,W*0.5,H*0.7); g.fillRect(W*0.05,H*0.72,W*0.9,H*0.14); g.fillStyle=a.ac2||'#d8322a'; g.fillRect(W*0.25,H*0.55,W*0.5,H*0.1); },
    (g,W,H)=>{ g.fillStyle='#ffffff'; WZ.rr(g,W*0.03,H*0.05,W*0.94,H*0.7,H*0.25); g.fill(); g.beginPath(); g.moveTo(W*0.25,H*0.7); g.lineTo(W*0.18,H*0.98); g.lineTo(W*0.45,H*0.7); g.fill(); g.strokeStyle='#1b1b1b'; g.lineWidth=W*0.03; WZ.rr(g,W*0.03,H*0.05,W*0.94,H*0.7,H*0.25); g.stroke(); WZ.txt(g,'PROSIT!',W/2,H*0.4,W*0.8,H*0.36,WFNT.rund,a.bg2||'#d8322a'); },
    (g,W,H)=>{ mzBrille(g,W,H); }];
  function mzBrille(g,W,H){ g.strokeStyle='#f2c230'; g.lineWidth=H*0.12; for(const x of [0.27,0.73]){ g.beginPath(); stern(g,W*x,H/2,H*0.42,5,0.5); g.stroke(); } g.beginPath(); g.moveTo(W*0.42,H*0.45); g.lineTo(W*0.58,H*0.45); g.stroke(); }
  const B=bogen([{w:w*0.95,h:h*0.95,draw:(g,W,H)=>{ const gr=g.createRadialGradient(W/2,H*0.35,0,W/2,H*0.4,W*0.7); gr.addColorStop(0,heller(a.bg1,0.3)); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H); konfettiDruck(g,0,0,W,H*0.7,k,70);
      WZ.txt(g,'2027',W/2,H*0.32,W*0.6,H*0.3,WFNT.rund,'rgba(255,214,90,.55)'); }},...prop.map(fn=>({w:0.09,h:0.06,draw:fn}))],{alphaTest:0.5,side:T.DoubleSide,roughness:0.6});
  const lst=[{geo:reg(new T.PlaneGeometry(w*0.95,h*0.95),B.R[0]),m:tm(0,h/2,-d/2+0.004)}];
  const pos=[[-0.29,0.62,0.004,0.2],[0.27,0.66,-0.004,-0.15],[-0.05,0.78,0.0,0.05],[0.3,0.37,0.008,-0.1],[-0.25,0.35,0.012,0.15]];
  pos.forEach(([px,py,pz,rz],i)=>{ const sx=w*0.22, sy=sx*0.66, x=px*w, y=py*h; lst.push({geo:reg(new T.PlaneGeometry(sx,sy),B.R[i+1]),m:tm(x,y,pz,0,0,rz)});
    const sl=y-sy/2-h*0.08; v(k,Cy(0.0016,0.0016,sl,5),tm(x,h*0.08+sl/2,pz-0.001),0xc9a46a); });
  teil(k,lst,B.mat);
  teil(k,{geo:new T.PlaneGeometry(w*fw[2],h*fw[3]),m:tm(0,h*(1-fw[1]-fw[3]/2),d/2-0.0015)},folieKlar);
  return fertig(k); };

/* ================= 29 Streukonfetti: Standbodenbeutel mit Zipper und
   Sichtfenster, unten liegt das Konfetti ================= */
VP_FORM.streukonfetti=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, so=0.024, dz=d*0.48, fen=[0.12,0.46,0.76,0.38];
  const B=bogen([{w,h,draw:(g,W,H)=>{ grund(g,0,0,W,H,k); g.fillStyle=rgba('#ffffff',0.25); g.fillRect(0,0,W,H*so/h); riffel(g,0,0,W,H*so/h*0.6); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,H*(so/h+0.02),W,H*0.008);
      WZ.txt(g,'◀ HIER AUFREISSEN',W*0.3,H*0.075,W*0.5,H*0.022,WFNT.kond,'#fff','left');
      marke(g,0,H*0.13,W,H*0.07,k); titel(g,W/2,H*0.28,W*0.9,H*0.1,k); unter(g,W/2,H*0.38,W*0.85,H*0.045,k);
      g.save(); g.beginPath(); g.ellipse(W/2,H*(fen[1]+fen[3]/2),W*fen[2]/2,H*fen[3]/2,0,0,TAU); g.strokeStyle='#fff'; g.lineWidth=W*0.015; g.stroke(); g.restore();
      loch(g,()=>g.ellipse(W/2,H*(fen[1]+fen[3]/2),W*fen[2]/2,H*fen[3]/2,0,0,TAU)); }},
    {w,h,draw:(g,W,H)=>{ grund(g,0,0,W,H,k,true); g.fillStyle='rgba(255,255,255,.4)'; for(let i=0;i<6;i++) g.fillRect(W*0.15,H*(0.5+i*0.05),W*0.6,H*0.01); }}],Object.assign({roughness:0.3},AUS));
  teil(k,{geo:kissen(w,h,dz,{boden:true,oben:so,ein:0.04,ex:0.45,Rf:B.R[0],Rb:B.R[1],nx:10,ny:12}),m:M0()},B.mat);
  teil(k,{geo:kissen(w,h,dz+0.0006,{off:0.0012,boden:true,oben:so,ein:0.04,ex:0.45,nx:6,ny:8}),m:M0()},folieKlar);
  v(k,new T.CircleGeometry(1,16),tm(0,0.0006,0,PI/2,0,0,w/2*0.96,dz,1),hx(a.bg2));
  const F=['#e8c35a','#dfe4ea','#ff4d6d','#3ec1ff','#ffd23f','#c77dff'];
  for(let i=0;i<110;i++){ const yy=0.004+Math.pow(R(),1.4)*h*0.5, b=Math.sqrt(Math.max(0,1-Math.pow(yy/(h-so),3))), x=(R()-0.5)*w*0.82*b, z=(R()-0.5)*1.5*dz*b*Math.sqrt(Math.max(0,1-Math.pow(2*x/w,2)));
    gl(k,new T.TetrahedronGeometry(0.0042),tm(x,yy,z,R()*3,R()*3,R()*3,1,0.25,1),hx(F[i%F.length])); }
  return fertig(k); };

/* ================= 30 Lichterkette: Steckkarton - die Lampen stecken
   leuchtend durch die bedruckte Front ================= */
VP_FORM.lichterkette=t=>{ const k=S(t), {w,h,d,a}=k, bd=d-0.014, n=9;
  const lamp=i=>{ const u=(i+0.5)/n; return [u, 0.36+Math.sin(u*PI)*0.09-Math.cos(u*TAU*1.5)*0.04]; };
  const A=atlas(w,h,bd,a,0,{front:(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#0d1430'); gr.addColorStop(1,'#04060f'); g.fillStyle=gr; g.fillRect(0,0,W,H);
      for(let i=0;i<50;i++) WZ.kreis(g,(i*53%97)/97*W,(i*31%89)/89*H*0.6,W*0.002,'rgba(255,255,255,.6)');
      marke(g,0,0,W,H*0.1,k);
      g.strokeStyle='#123d24'; g.lineWidth=W*0.006; g.beginPath(); for(let i=0;i<=40;i++){ const u=i/40, y=0.36+Math.sin(u*PI)*0.09-Math.cos(u*TAU*1.5)*0.04; i?g.lineTo(u*W,y*H-H*0.03):g.moveTo(u*W,y*H-H*0.03); } g.stroke();
      for(let i=0;i<n;i++){ const [u,vv]=lamp(i); WZ.leucht(g,u*W,vv*H,W*0.07,'#ffd88a',0.55); }
      titel(g,W/2,H*0.74,W*0.9,H*0.14,k,'#ffd88a'); unter(g,W/2,H*0.88,W*0.85,H*0.07,k); }});
  teil(k,{geo:atlasBox(w,h,bd,A.R),m:tm(0,h/2,-d/2+bd/2)},A.mat);
  const zf=-d/2+bd;
  for(let i=0;i<n;i++){ const [u,vv]=lamp(i), x=(u-0.5)*w, y=h*(1-vv);
    v(k,Cy(0.0055,0.0055,0.006,8),tm(x,y,zf+0.003,PI/2),0x1f5a33);
    le(k,Sp(1,8,6),tm(x,y,zf+0.0065,0,0,0,0.0065,0.0065,0.0075),0xfff0c8); }
  return fertig(k); };

/* ================= 31 Gluecksbringer: kleine Holzkiste mit Holzwolle,
   Schornsteinfeger, Kleeblatt und Gluecksschwein ================= */
VP_FORM.glueckssymbole=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, hk=h*0.44, bt=0.008;
  const B=bogen([{w,h:hk,draw:(g,W,H)=>{ holz(g,0,0,W,H,zufallAus(3),true); g.fillStyle='rgba(60,35,15,.5)'; g.fillRect(0,H*0.48,W,H*0.03);
      WZ.txt(g,titelS(k),W/2,H*0.3,W*0.86,H*0.34,WFNT.rund,'#4a2a12'); WZ.txt(g,k.a.sub||'',W/2,H*0.66,W*0.8,H*0.15,WFNT.kond,'#5a3518'); WZ.txt(g,'PARTYZEIT',W/2,H*0.86,W*0.3,H*0.1,WFNT.rund,'#7a4a22'); }},
    {w:d,h:hk,draw:(g,W,H)=>holz(g,0,0,W,H,zufallAus(4),true)}]);
  const F={f:B.R[0],s:B.R[1],t:B.R[1],u:B.R[1],b:B.R[1]}, Sd={f:B.R[1],s:B.R[1],t:B.R[1],u:B.R[1],b:B.R[1]};
  teil(k,[{geo:kbox(w,hk,bt,F),m:tm(0,hk/2,d/2-bt/2)},{geo:kbox(w,hk,bt,Sd),m:tm(0,hk/2,-d/2+bt/2)},{geo:kbox(bt,hk,d-2*bt,Sd),m:tm(-w/2+bt/2,hk/2,0)},{geo:kbox(bt,hk,d-2*bt,Sd),m:tm(w/2-bt/2,hk/2,0)},{geo:kbox(w,0.006,d,Sd),m:tm(0,0.003,0)}],B.mat);
  for(const sx of [-1,1]) for(const sz of [-1,1]) v(k,Bx(0.012,hk*0.98,0.012),tm(sx*(w/2-bt-0.006),hk*0.49,sz*(d/2-bt-0.006)),0x8a5a2e);
  /* Holzwolle */
  for(let i=0;i<(WARE_SPAR_AN?12:46);i++) v(k,Bx(0.03+R()*0.02,0.0016,0.0022),tm((R()-0.5)*(w-0.07),hk-0.012+R()*0.012,(R()-0.5)*(d-0.05),R()*0.4,R()*PI,(R()-0.5)*0.4),R()<0.5?0xd8b77a:0xc9a15a);
  const yb=hk-0.01;
  /* Schornsteinfeger mit Leiter */
  const sx=-w*0.3; v(k,Cy(0.013,0.016,0.06,10),tm(sx,yb+0.03,0),0x1b1b1f); v(k,Sp(0.012,10,8),tm(sx,yb+0.072,0),0xf1c9a5);
  v(k,Cy(0.012,0.012,0.022,10),tm(sx,yb+0.094,0),0x1b1b1f); v(k,Cy(0.019,0.019,0.003,12),tm(sx,yb+0.084,0),0x1b1b1f);
  for(let i=0;i<3;i++) gl(k,Sp(0.0022,6,4),tm(sx,yb+0.045-i*0.012,0.014),0xe8c35a);
  for(const s of [-1,1]) v(k,Bx(0.003,0.1,0.003),tm(sx+0.028+s*0.009,yb+0.05,-0.004,0,0,-0.15),0xc9a46a);
  for(let i=0;i<5;i++) v(k,Bx(0.02,0.0025,0.0025),tm(sx+0.028+0.007-i*0.003,yb+0.012+i*0.019,-0.004,0,0,-0.15),0xc9a46a);
  /* Kleeblatt */
  v(k,Cy(0.0022,0.0022,0.07,5),tm(0,yb+0.035,0),0x2e7d32);
  for(let i=0;i<4;i++){ const an=i*PI/2+PI/4; for(const s of [-1,1]) v(k,Sp(1,8,6),tm(Math.cos(an)*0.016+Math.cos(an+s*PI/2)*0.006,yb+0.085+Math.sin(an)*0.016+Math.sin(an+s*PI/2)*0.006,0.002,0,0,0,0.01,0.01,0.003),0x3bb54a); }
  /* Gluecksschwein mit Goldmuenze */
  const px=w*0.3, py=yb+0.03; v(k,Sp(1,10,8),tm(px,py,0,0,0,0,0.032,0.025,0.024),0xf5a3b5); v(k,Sp(0.018,10,8),tm(px,py+0.012,0.022),0xf5a3b5);
  v(k,Cy(0.008,0.008,0.008,8),tm(px,py+0.008,0.04,PI/2),0xe88aa0); for(const s of [-1,1]){ v(k,new T.ConeGeometry(0.006,0.012,4),tm(px+s*0.01,py+0.03,0.02,0,0,s*0.3),0xf5a3b5); v(k,Sp(0.0025,5,4),tm(px+s*0.007,py+0.018,0.036),0x1b1b1b); }
  for(const sx2 of [-1,1]) for(const sz of [-1,1]) v(k,Cy(0.005,0.005,0.012,6),tm(px+sx2*0.018,py-0.022,sz*0.012),0xf5a3b5);
  gl(k,Cy(0.012,0.012,0.003,14),tm(px,py+0.034,0.012,0.3),0xe8c35a);
  return fertig(k); };

/* ================= 32 Gluecksklee: Tontopf mit Banderole, in
   Zellophan mit Schleife, Steckschild ================= */
VP_FORM.gluecksklee=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, rt=w*0.32, ru=w*0.25, ph=h*0.42;
  v(k,Cy(rt,ru,ph,18),tm(0,ph/2,0),0xc4683a); v(k,Cy(rt*1.08,rt*1.04,ph*0.18,18),tm(0,ph*0.91,0),0xb85c30); v(k,Cy(rt*0.95,rt*0.95,0.003,16),tm(0,ph-0.002,0),0x3b2a1e);
  const bh=ph*0.5, rb=(rt+ru)/2+0.0012;
  const B=bogen([{w:TAU*rb,h:bh,draw:rundum(vorne(k))},{w:0.06,h:0.045,draw:(g,W,H)=>{ g.fillStyle='#fffaf0'; g.fillRect(0,0,W,H); g.strokeStyle='#2e7d32'; g.lineWidth=W*0.04; g.strokeRect(0,0,W,H); WZ.txt(g,'Viel Glück',W/2,H*0.36,W*0.85,H*0.3,WFNT.schreib,'#2e7d32'); WZ.txt(g,'2027',W/2,H*0.72,W*0.6,H*0.3,WFNT.rund,'#d8322a'); }}]);
  const rY=y=>ru+(rt-ru)*y/ph+0.0012;
  teil(k,[{geo:reg(new T.CylinderGeometry(rY(ph*0.38+bh/2),rY(ph*0.38-bh/2),bh,22,1,true,PI,TAU),B.R[0]),m:tm(0,ph*0.38,0)},{geo:reg(Bx(0.05,0.035,0.0015),B.R[1]),m:tm(w*0.12,ph+h*0.2,rt*0.7,-0.2,0.25,0)}],B.mat);
  v(k,Cy(0.0012,0.0012,h*0.2,4),tm(w*0.12,ph+h*0.08,rt*0.68,-0.2,0,0),0xc9a46a);
  /* Klee: Stiele und vierblaettrige Blaetter */
  for(let i=0;i<9;i++){ const an=R()*TAU, rr=R()*rt*0.7, x=Math.cos(an)*rr, z=Math.sin(an)*rr, y=ph+0.03+R()*h*0.2;
    v(k,Cy(0.0012,0.0012,y-ph,4),tm(x,ph+(y-ph)/2,z),0x2e7d32);
    for(let j=0;j<4;j++){ const b=j*PI/2+R(); v(k,Sp(1,6,4),tm(x+Math.cos(b)*0.008,y,z+Math.sin(b)*0.008,0,-b,0,0.009,0.0018,0.007),j===0&&i===3?0x46c45a:0x3bb54a); } }
  /* Zellophan: unten eng am Topf, oben gerafft, Krone gekraeuselt */
  const P2=[[ru*1.06,0.001],[rt*1.14,ph],[w*0.47,ph+h*0.16],[w*0.2,h*0.82],[0.008,h*0.86],[w*0.18,h*0.94],[w*0.3,h*0.995]].map(p=>new T.Vector2(p[0],p[1]));
  teil(k,{geo:new T.LatheGeometry(P2,16),m:M0()},folieKlar);
  /* Schleife */
  const sy=h*0.86, rot=0xd8322a;
  v(k,new T.TorusGeometry(0.009,0.0022,4,12),tm(0,sy,0,PI/2),rot);
  for(const s of [-1,1]){ gl(k,new T.TorusGeometry(0.008,0.0025,4,10),tm(s*0.011,sy+0.003,0.009,0,0,s*0.4,1.3,0.7,1),rot); v(k,Bx(0.005,0.022,0.0015),tm(s*0.007,sy-0.012,0.011,0,0,s*0.35),rot); }
  return fertig(k); };

/* ================= 33 Raclette-Pfaennchen: zwei Pfannenstapel in einer
   Kartonbanderole, Griffe und Schieber sichtbar ================= */
VP_FORM.raclettezubehoer=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, pw=w*0.46, pd=d*0.5, ph=h*0.16, st=h*0.13, zc=d*0.08, sh=h*0.72;
  const B=bogen([{w,h:sh,draw:vorne(k)},{w,h:pd*1.25,draw:(g,W,H)=>{ grund(g,0,0,W,H,k,true); bild(g,W*0.03,H*0.08,W*0.4,H*0.84,k); titel(g,W*0.72,H*0.42,W*0.5,H*0.3,k); unter(g,W*0.72,H*0.72,W*0.5,H*0.16,k); }},{w:0.02,h:0.02,draw:(g,W,H)=>grund(g,0,0,W,H,k,true)}]);
  const sd=pd*1.25, Sd=B.R[2];
  teil(k,[{geo:kbox(w,sh,0.002,{f:B.R[0],s:Sd}),m:tm(0,sh/2,zc+sd/2)},{geo:kbox(w,0.002,sd,{f:Sd,t:B.R[1]}),m:tm(0,sh,zc)},{geo:kbox(w,sh,0.002,{f:Sd}),m:tm(0,sh/2,zc-sd/2)},{geo:kbox(w,0.002,sd,{f:Sd}),m:tm(0,0.001,zc)}],B.mat);
  for(const s of [-1,1]) for(let i=0;i<4;i++){ const x=s*w*0.245, y=0.003+i*st;
    v(k,Bx(pw,ph,pd),tm(x,y+ph/2,zc),0x2a2a2e); if(!WARE_SPAR_AN) v(k,Bx(pw*0.9,0.001,pd*0.88),tm(x,y+ph+0.0002,zc),0x16161a);
    v(k,Bx(0.012,0.008,d/2-zc+pd/2-pd-0.016),tm(x,y+ph*0.7,(-d/2+0.016+zc-pd/2)/2),0x1e1e22); if(!WARE_SPAR_AN) v(k,Cy(0.008,0.008,0.03,8),tm(x,y+ph*0.7,-d/2+0.016,PI/2),0x6b4a2e); }
  for(let i=0;i<4;i++) v(k,Bx(0.022,0.003,0.12),tm(-w*0.3+i*w*0.2,sh+0.003+i*0.0004,zc,0,(i-1.5)*0.12,0),0xd9b07a);
  return fertig(k); };

/* ================= 34 Karaoke-Mikrofon: Karton mit Fenster in
   Mikrofonform, das Mikro liegt im schwarzen Inlay ================= */
VP_FORM.karaoke=t=>{ const k=S(t), {w,h,d,a}=k, hy=0.29, hr=0.3;
  const A=lochAtlas(w,h,d,a,0,{front:(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,a.bg1); gr.addColorStop(1,'#0b0614'); g.fillStyle=gr; g.fillRect(0,0,W,H);
      g.save(); g.globalCompositeOperation='lighter'; for(const [x,c] of [[0.1,'#ff3df2'],[0.9,'#3dd8ff']]){ g.fillStyle=rgba(c,0.18); g.beginPath(); g.moveTo(W*x,0); g.lineTo(W*0.5-W*0.3,H*0.7); g.lineTo(W*0.5+W*0.3,H*0.7); g.fill(); } g.restore();
      marke(g,0,0,W,H*0.07,k); titel(g,W/2,H*0.78,W*0.9,H*0.08,k); unter(g,W/2,H*0.86,W*0.85,H*0.035,k);
      WZ.txt(g,'ᛒ BLUETOOTH · LED',W/2,H*0.93,W*0.8,H*0.03,WFNT.kond,'#5ce1ff'); g.strokeStyle='#fff'; g.lineWidth=W*0.012; g.beginPath(); g.arc(W/2,H*hy,W*hr,0,TAU); g.stroke(); g.strokeRect(W*0.38,H*hy,W*0.24,H*0.38); },
    lochFront:(W,H)=>[{x:W/2,y:H*hy,r:W*hr},{x:W*0.38,y:H*hy,w:W*0.24,h:H*0.38}]});
  teil(k,{geo:atlasBox(w,h,d,A.R),m:tm(0,h/2,0)},A.mat);
  v(k,Bx(w*0.96,h*0.96,0.004),tm(0,h/2,-d/2+0.004),0x111114); for(const s of [-1,1]) v(k,Bx(0.002,h*0.96,d*0.9),tm(s*(w/2-0.002),h/2,0),0x111114);
  /* Mikrofon */
  const mx=0, my=h*(1-hy), mr=w*hr*0.82, z=-0.005;
  gl(k,Sp(mr,14,10),tm(mx,my,z),0xc9ccd2); gl(k,Cy(mr*1.02,mr*1.02,mr*0.28,14,true),tm(mx,my-mr*0.25,z),0xd6d9de);
  v(k,Cy(mr*0.9,mr*0.95,0.01,14),tm(mx,my-mr*0.55,z),hx(a.ac2&&a.ac2!==a.bg2?a.ac2:'#ff3df2'));
  v(k,Cy(mr*0.55,mr*0.38,h*0.34,12),tm(mx,my-mr*0.6-h*0.17,z),hx(a.ac&&a.ac!=='#ffffff'?a.ac:'#ff6fa8'));
  for(let i=0;i<3;i++) v(k,Bx(0.006,0.006,0.003),tm(mx,my-mr-0.02-i*0.012,z+mr*0.5),i?0x1b1b1b:0x3dd8ff);
  teil(k,[{geo:new T.CircleGeometry(w*hr,20),m:tm(0,h*(1-hy),d/2-0.0015)},{geo:new T.PlaneGeometry(w*0.24,h*0.38),m:tm(0,h*(1-hy-0.19),d/2-0.0015)}],folieKlar);
  return fertig(k); };

/* ================= 35 Discokugel: Wuerfelkarton mit Klarsichtkuppel
   vorn, darin die facettierte Spiegelkugel ================= */
VP_FORM.discokugel=t=>{ const k=S(t), {w,h,d,a}=k, R=k.R, kr=Math.min(h*0.33,w*0.3), dk=Math.min(0.05,d*0.25), bd=d-dk, cy=0.47;
  const A=lochAtlas(w,h,bd,a,0,{front:(g,W,H)=>{ bild(g,0,0,W,H,k); g.fillStyle='rgba(8,6,16,.55)'; g.fillRect(0,0,W,H); marke(g,0,0,W,H*0.1,k);
      g.fillStyle='rgba(0,0,0,.6)'; g.fillRect(0,H*0.8,W,H*0.2); titel(g,W/2,H*0.865,W*0.9,H*0.11,k); unter(g,W/2,H*0.95,W*0.85,H*0.05,k); },
    lochFront:(W,H)=>[{x:W/2,y:H*cy,r:H*0.34}]});
  teil(k,{geo:atlasBox(w,h,bd,A.R),m:tm(0,h/2,-d/2+bd/2)},A.mat);
  const zf=d/2-dk, by=h*(1-cy);
  v(k,Bx(w*0.96,h*0.96,0.002),tm(0,h/2,-d/2+0.003),0x0c0a14);
  /* Spiegelkugel: Facetten einzeln getoent und flach schattiert */
  const ball={geo:new T.SphereGeometry(kr,18,12),m:tm(0,by,zf-kr*0.5),color:0xffffff}; v(k,ball.geo,ball.m,0xffffff); const ref=k.vc[k.vc.length-1];
  v(k,Cy(0.0015,0.0015,h-by-kr,4),tm(0,by+kr+(h-by-kr)/2-0.002,zf-kr*0.5),0x9aa0a8);
  const kd=(n,r)=>[0.75+r*0.25,0.75+r*0.25,0.78+r*0.22];
  const parts=fertig(k), g=parts.find(p=>p.mat===vcMat).geo, col=g.attributes.color, pos=g.attributes.position, nor=g.attributes.normal;
  const TI=[[1,0.55,0.85],[0.55,0.8,1],[1,0.9,0.5]];
  for(let i=ref._o;i<ref._o+ref._n;i+=3){ const r=R(); let c=kd(0,r); if(R()<0.16) c=TI[Math.floor(R()*3)]; if(R()<0.12) c=[0.35,0.36,0.4];
    const A3=new T.Vector3().fromBufferAttribute(pos,i), B3=new T.Vector3().fromBufferAttribute(pos,i+1), C3=new T.Vector3().fromBufferAttribute(pos,i+2), n=new T.Vector3().subVectors(C3,B3).cross(new T.Vector3().subVectors(A3,B3)).normalize();
    for(let j=0;j<3;j++){ col.setXYZ(i+j,c[0],c[1],c[2]); nor.setXYZ(i+j,n.x,n.y,n.z); } }
  /* Kuppel */
  parts.push({geo:merge([{geo:new T.SphereGeometry(h*0.34*0.98,20,8,0,TAU,0,PI/2),m:tm(0,by,zf,PI/2,0,0,1,dk/(h*0.34*0.98),1)}]),mat:folieKlar});
  return parts; };

/* ================= 36 Champagnerturm-Set: grosser Geschenkkarton mit
   Stuelpdeckel, Satinband und Schleife ================= */
VP_FORM.champagnerturm=t=>{ const k=S(t), {w,h,d,a}=k, lh=h*0.14, bh=h*0.86-0.03, rx=w*0.3;
  const A=atlas(w*0.985,bh,d*0.985,a,0,{front:(g,W,H)=>{ grund(g,0,0,W,H,k); const L=W*0.64; marke(g,0,H*0.02,L,H*0.1,k); bild(g,W*0.04,H*0.14,L-W*0.08,H*0.54,k); g.strokeStyle='#e8c35a'; g.lineWidth=W*0.006; g.strokeRect(W*0.04,H*0.14,L-W*0.08,H*0.54);
      titel(g,L/2,H*0.78,L*0.92,H*0.13,k); unter(g,L/2,H*0.9,L*0.9,H*0.07,k);
      for(let i=0;i<14;i++) WZ.stern(g,L+(i*37%23)/23*(W-L),(i*53%97)/97*H,W*0.012,'rgba(232,195,90,.6)'); },
    top:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); }});
  teil(k,{geo:atlasBox(w*0.985,bh,d*0.985,A.R),m:tm(0,bh/2,0)},A.mat);
  const D=atlas(w,lh,d,a,0,{front:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle='#e8c35a'; g.fillRect(0,H*0.12,W,H*0.06); g.fillRect(0,H*0.82,W,H*0.06); WZ.txt(g,'✦ PROSIT 2027 ✦',W*0.32,H/2,W*0.5,H*0.42,WFNT.serif,'#e8c35a'); },
    side:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle='#e8c35a'; g.fillRect(0,H*0.12,W,H*0.06); g.fillRect(0,H*0.82,W,H*0.06); },
    top:(g,W,H)=>{ grund(g,0,0,W,H,k,true); for(let i=0;i<30;i++) WZ.stern(g,(i*53%97)/97*W,(i*31%89)/89*H,W*0.01,'rgba(232,195,90,.5)'); }});
  teil(k,{geo:atlasBox(w,lh,d,D.R),m:tm(0,bh-lh*0.4+lh/2,0)},D.mat);
  const top=bh+lh*0.6, gold=0xe8c35a, bw=0.04;
  /* Satinband: senkrecht rechts ueber Front, Deckel, Rueckseite; quer ueber den Deckel */
  gl(k,Bx(bw,top,0.002),tm(rx,top/2,d/2+0.0005-0.0015),gold); gl(k,Bx(bw,top,0.002),tm(rx,top/2,-d/2+0.0005),gold);
  gl(k,Bx(bw,0.002,d),tm(rx,top+0.001,0),gold); gl(k,Bx(w,0.002,bw),tm(0,top+0.001,0),gold);
  for(const s of [-1,1]) gl(k,Bx(0.002,lh,bw),tm(s*(w/2-0.0005),bh-lh*0.4+lh/2,0),gold);
  /* Schleife */
  const sy=top+0.004, hl=h-sy;
  for(const s of [-1,1]){ gl(k,new T.TorusGeometry(hl*0.55,0.009,4,14),tm(rx+s*hl*0.6,sy+hl*0.42,0,0.25,0,s*0.5,1,0.75,0.35),gold); gl(k,Bx(0.03,0.002,0.09),tm(rx+s*0.03,sy,s*0.045,0,s*0.6,0),gold); }
  gl(k,Sp(hl*0.3,10,6),tm(rx,sy+hl*0.25,0,0,0,0,1,0.8,0.8),0xd4a017);
  return fertig(k); };

})();

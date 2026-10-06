/* Verpackungsformen (feuerwerk) - siehe 04-models.js VP_FORM */
/* 03.10. (Tom: "vieles ist einfach nur ein Karton, wo was draufsteht -
   sieht scheisse aus"): jedes Feuerwerksprodukt bekommt seine eigene
   Verpackungsart nach echtem Vorbild aus dem Handel - Hängepackung,
   Streichholzschachtel, Folienschlauch, Munitionskiste, Netzbeutel,
   Blechdose, Holzkiste, Raketenröhre, Alu-Koffer, Dreikant- und
   Sechskantkarton ... Das Druckbild (drawFront, 04d) bleibt vorn lesbar.
   Alles bleibt in p.dims (Ursprung unten Mitte, vorn = +z). */
/* Feuerteufel (06.10.): Lage der beiden Duesen, in m ab Boden-Mitte des
   Produkts - Fuss (fussX quer, fussY hoch), Laenge, Neigung in Grad nach
   aussen, Radius am Fuss (r0) und an der Muendung (r1). Gemeinsam fuer
   die Form (unten) und den Effekt (14k hoerner, ftMuendungen). */
const FT_DUESE={fussX:0.016,fussY:0.145,len:0.058,neig:32,r0:0.0085,r1:0.0068};
/* Muendungen in Weltlage: o = Oberkante des Produkts (wie muendung()) */
function ftMuendungen(o,prod){ const D=FT_DUESE, h=(P[prod]&&P[prod].dims?P[prod].dims[1]:0.2), sn=Math.sin(D.neig*Math.PI/180), cs=Math.cos(D.neig*Math.PI/180);
  return [-1,1].map(s=>({x:o.x+s*(D.fussX+sn*D.len),y:o.y-h+D.fussY+cs*D.len,z:o.z,d:[s*sn,cs,0],s})); }
(()=>{
const PI=Math.PI, HOLZ=0xc9a46a, I=s=>parseInt(String(s).slice(1),16);
/* ---------------- Grundgeruest ---------------- */
function G(t){ const p=P[t]; return {t,p,a:p.art,cat:p.cat,w:p.dims[0],h:p.dims[1],d:p.dims[2],vc:[],dr:[],fo:[],gl:[],ex:[],R:{},rnd:zufallAus(hashStr(t+'|vp'))}; }
function fertig(o){ const parts=[];
  if(o.dr.length) parts.push({geo:merge(o.dr),mat:o.drMat});
  if(o.vc.length) parts.push({geo:merge(o.vc),mat:vcMat});
  o.ex.forEach(q=>parts.push(q));
  if(o.gl.length) parts.push({geo:merge(o.gl),mat:glassMat});
  if(o.fo.length) parts.push({geo:merge(o.fo),mat:o.foMat||folieKlar});
  return parts; }
const box=(o,w,h,d,x,y,z,c,rx,ry,rz)=>o.vc.push({geo:new THREE.BoxGeometry(w,h,d),m:tm(x,y,z,rx,ry,rz),color:c});
const zyl=(o,r1,r2,l,s,x,y,z,c,rx,ry,rz,sx,sy,sz)=>o.vc.push({geo:new THREE.CylinderGeometry(r1,r2,l,s),m:tm(x,y,z,rx,ry,rz,sx,sy,sz),color:c});
const kugel=(o,r,x,y,z,c,sx,sy,sz,ws,hs)=>o.vc.push({geo:new THREE.SphereGeometry(r,ws||8,hs||6),m:tm(x,y,z,0,0,0,sx,sy,sz),color:c});
const torus=(o,R,r,x,y,z,c,rx,ry,rz,seg,sx,sy,sz)=>o.vc.push({geo:new THREE.TorusGeometry(R,r,4,seg||16),m:tm(x,y,z,rx,ry,rz,sx,sy,sz),color:c});
const fol=(o,geo,m)=>o.fo.push({geo,m});
const glas=(o,geo,m)=>o.gl.push({geo,m});
function uvR(geo,r){ if(!r) return geo; const uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,r[0]+uv.getX(i)*(r[2]-r[0]),r[1]+uv.getY(i)*(r[3]-r[1])); return geo; }
const dr=(o,geo,m,r)=>o.dr.push({geo:uvR(geo,r),m});
/* Quader mit eigenem Bildbereich je Seite: f vorn, b hinten, l/r Seiten (s beide), t oben, u unten */
function kiste(w,h,d,R){ const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv, L=R.leer;
  const fl=[R.r||R.s||L,R.l||R.s||L,R.t||L,R.u||R.t||L,R.f||L,R.b||R.f||L];
  for(let f=0;f<6;f++){ const r=fl[f]; for(let i=0;i<4;i++){ const k=f*4+i; uv.setXY(k,r[0]+uv.getX(k)*(r[2]-r[0]),r[1]+uv.getY(k)*(r[3]-r[1])); } } return g; }
/* Viereck p0 unten links, p1 unten rechts, p2 oben rechts, p3 oben links (von aussen gesehen) */
function viereck(p0,p1,p2,p3){ const g=new THREE.BufferGeometry(), P4=[p0,p1,p2,p0,p2,p3], U=[0,0,1,0,1,1,0,0,1,1,0,1];
  g.setAttribute('position',new THREE.Float32BufferAttribute(P4.flat(),3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.computeVertexNormals(); return g; }
function dreieck(p0,p1,p2){ const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute([p0,p1,p2].flat(),3)); g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0.5,1],2)); g.computeVertexNormals(); return g; }
/* Innenseite: Dreiecke umdrehen (fuer Einsaetze, in die man hineinsieht) */
function umdrehen(geo){ const g=geo.index?geo.toNonIndexed():geo, p=g.attributes.position, n=g.attributes.normal, u=g.attributes.uv;
  for(let i=0;i<p.count;i+=3){ for(const A of [p,n,u]){ if(!A) continue; const s=A.itemSize; for(let k=0;k<s;k++){ const t=A.array[(i+1)*s+k]; A.array[(i+1)*s+k]=A.array[(i+2)*s+k]; A.array[(i+2)*s+k]=t; } } }
  for(let i=0;i<n.array.length;i++) n.array[i]=-n.array[i]; return g; }
/* dunkler Einsatz hinter einem Fenster: Rueckwand, Seiten, Boden, Decke (innen sichtbar) */
function einsatz(o,x0,x1,y0,y1,z0,z1,c){ const g=umdrehen(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0)); o.vc.push({geo:g,m:tm((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),color:c}); }
/* Teile in einem eigenen Koordinatensystem bauen und dann versetzen */
function gruppe(o,M,fn){ const s={vc:[],dr:[],fo:[],gl:[],R:o.R,rnd:o.rnd}; fn(s);
  for(const k of ['vc','dr','fo','gl']) s[k].forEach(q=>{ q.m=M.clone().multiply(q.m); o[k].push(q); }); }
/* ---------------- Druckbogen: alle bedruckten Flaechen in einer Textur ---------------- */
function bogen(o,teile,opt){ opt=opt||{};
  const gap=0.003, area=teile.reduce((s,q)=>s+(q.w+gap)*(q.h+gap),0), maxw=Math.max(...teile.map(q=>q.w));
  const Wm=Math.max(maxw,Math.sqrt(area)*1.12); let x=0,y=0,rh=0; const pos=[];
  teile.forEach(q=>{ if(x>0&&x+q.w>Wm){ x=0; y+=rh+gap; rh=0; } pos.push([x,y]); x+=q.w+gap; rh=Math.max(rh,q.h); });
  const Hm=y+rh, MAX=Math.min(opt.max||1100,1100)*TEX_FAKTOR, s=Math.min((opt.ppm||1700)*TEX_FAKTOR,MAX/Math.max(Wm,Hm));
  const W=Math.max(8,Math.round(Wm*s)), H=Math.max(8,Math.round(Hm*s));
  const px=teile.map((q,i)=>[Math.round(pos[i][0]*s),Math.round(pos[i][1]*s),Math.max(4,Math.round(q.w*s)),Math.max(4,Math.round(q.h*s))]);
  teile.forEach((q,i)=>{ const [x0,y0,w0,h0]=px[i]; o.R[q.n]=[(x0+0.5)/W,1-(y0+h0-0.5)/H,(x0+w0-0.5)/W,1-(y0+0.5)/H]; });
  const T=tex(W,H,g=>{ teile.forEach((q,i)=>{ const [x0,y0,w0,h0]=px[i]; g.save(); g.translate(x0,y0); g.beginPath(); g.rect(0,0,w0,h0); g.clip(); q.f(g,w0,h0); g.restore(); }); });
  o.drMat=new THREE.MeshStandardMaterial({map:T,roughness:opt.rough||0.55,metalness:opt.metal||0,alphaTest:opt.alpha?0.5:0,side:opt.ds?THREE.DoubleSide:THREE.FrontSide});
  return o.R; }
const teil=(g,x,y,w,h,fn)=>{ g.save(); g.translate(x,y); g.beginPath(); g.rect(0,0,w,h); g.clip(); fn(g,w,h); g.restore(); };
const flach=c=>(g,W,H)=>{ g.fillStyle=c; g.fillRect(0,0,W,H); };
const verlauf=(c1,c2)=>(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,c1); gr.addColorStop(1,c2); g.fillStyle=gr; g.fillRect(0,0,W,H); };
const zweimal=fn=>(g,W,H)=>{ for(let k=0;k<2;k++) teil(g,k*W/2,0,W/2,H,fn); };
/* Loecher (Fenster, Euroloch): durchsichtig, mit hellem Rand */
function loch(g,L,rand){ g.save(); g.globalCompositeOperation='destination-out'; g.fillStyle='#000'; for(const q of L){ g.beginPath(); pfad(g,q); g.fill(); } g.restore();
  if(rand===false) return; g.save(); g.strokeStyle=rand||'rgba(255,255,255,.9)'; for(const q of L){ g.lineWidth=Math.max(1.5,(q.r||Math.min(q.w,q.h))*0.06); g.beginPath(); pfad(g,q); g.stroke(); } g.restore(); }
function pfad(g,q){ if(q.stern){ for(let i=0;i<10;i++){ const an=-PI/2+i*PI/5, rr=i%2?q.r*0.45:q.r; g.lineTo(q.x+Math.cos(an)*rr,q.y+Math.sin(an)*rr); } g.closePath(); }
  else if(q.r) g.arc(q.x,q.y,q.r,0,PI*2); else if(q.ell) g.ellipse(q.x,q.y,q.ell[0],q.ell[1],0,0,PI*2); else g.rect(q.x,q.y,q.w,q.h); }
function euroloch(g,cx,cy,s){ g.save(); g.globalCompositeOperation='destination-out'; g.fillStyle='#000'; g.beginPath(); g.arc(cx,cy,s*0.32,0,PI*2); g.fill();
  g.beginPath(); g.ellipse(cx,cy+s*0.12,s*0.9,s*0.17,0,0,PI*2); g.fill(); g.restore();
  g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=Math.max(1,s*0.05); g.beginPath(); g.arc(cx,cy,s*0.32,PI*0.85,PI*2.15); g.stroke(); }
/* ---------------- Druckbild ---------------- */
function stil(t){ const l=typeof linieVon==='function'?linieVon(t):'sternwerk', a=P[t].art, hl=typeof heller==='function'?heller:(c=>c);
  return {l, bg:l==='aurum'?'#0b0a09':l==='nordlicht'?'#c9a676':l==='titan'?'#121418':l==='funkenkind'?hl(a.bg1,0.15):a.bg2,
    tf:l==='aurum'?'#e9c76a':l==='nordlicht'?'#2b1d10':l==='funkenkind'||l==='titan'||l==='blitz'?'#ffffff':a.ac,
    ol:l==='nordlicht'||l==='aurum'?null:l==='funkenkind'?a.bg2:'rgba(0,0,0,.85)',
    font:l==='aurum'?FNT.cin:l==='funkenkind'||l==='blitz'?FNT.bun:l==='sternwerk'?FNT.barIt:FNT.bar,
    sf:l==='aurum'?'#d9b45a':l==='nordlicht'?'#5a4428':l==='titan'?'#ff7a00':'#ffffff', foto:l!=='aurum'&&l!=='nordlicht'&&l!=='funkenkind'}; }
/* Druckbild in einen Bereich: breit -> Motivfeld + grosser Name, hoch ->
   Motiv oben + Name hochkant, sonst die normale Vorderseite */
function bild(g,W,H,t,o){ o=o||{}; const p=P[t], a=p.art;
  if(o.mitte&&W>H*1.6){ const S=stil(t), pw=Math.min(W*0.26,H*0.9);
    g.fillStyle=S.bg; g.fillRect(0,0,W,H);
    if(S.foto&&typeof effektFoto==='function') effektFoto(g,0,0,W,H,t,a,zufallAus(hashStr(t+'bm')),{stadt:false});
    for(const lx of [0,W-pw]) teil(g,lx,0,pw,H,(g2,w2,h2)=>drawFront(g2,w2,h2,a,p.cat));
    const rw=W-2*pw; nameText(g,a.title,W/2,H*0.42,rw*0.94,Math.round(H*0.4),S.font,S.tf,S.ol,Math.max(2,H*0.045));
    nameText(g,a.sub,W/2,H*0.78,rw*0.9,Math.round(H*0.15),FNT.bar,S.sf,S.foto?'rgba(0,0,0,.75)':null,2);
  } else if(W>H*2.1){ const S=stil(t), pw=Math.min(W*0.4,H*1.25), lx=o.rechts?W-pw:0, rx0=o.rechts?0:pw, rw=W-pw;
    g.fillStyle=S.bg; g.fillRect(0,0,W,H);
    if(S.foto&&typeof effektFoto==='function') effektFoto(g,rx0,0,rw,H,t,a,zufallAus(hashStr(t+'bf')),{stadt:false});
    teil(g,lx,0,pw,H,(g2,w2,h2)=>drawFront(g2,w2,h2,a,p.cat));
    const cx=rx0+rw/2, sk=S.l==='blitz'||S.l==='sternwerk'?-0.12:0;
    nameText(g,a.title,cx,H*(o.sub===false?0.5:0.42),rw*0.9,Math.round(H*0.46),S.font,S.tf,S.ol,Math.max(2,H*0.045),sk);
    if(o.sub!==false) nameText(g,a.sub,cx,H*0.81,rw*0.86,Math.round(H*0.16),FNT.bar,S.sf,S.foto?'rgba(0,0,0,.75)':null,2);
    g.fillStyle=a.ac2; g.fillRect(o.rechts?W-pw-2:pw,0,2,H);
  } else if(H>W*1.75){ const S=stil(t), ph=Math.min(H*0.5,W*1.3);
    g.fillStyle=S.bg; g.fillRect(0,0,W,H);
    if(S.foto&&typeof effektFoto==='function') effektFoto(g,0,ph,W,H-ph,t,a,zufallAus(hashStr(t+'bh')),{stadt:false});
    teil(g,0,0,W,ph,(g2,w2,h2)=>drawFront(g2,w2,h2,a,p.cat));
    g.save(); g.translate(W/2,ph+(H-ph)*0.47); g.rotate(-PI/2); nameText(g,a.title,0,0,(H-ph)*0.88,Math.round(W*0.56),S.font,S.tf,S.ol,Math.max(2,W*0.05)); g.restore();
    g.fillStyle=a.ac2; g.fillRect(0,H*0.955,W,H*0.045);
  } else drawFront(g,W,H,a,p.cat);
}
const B=(t,o)=>(g,W,H)=>bild(g,W,H,t,o);
const seite=t=>(g,W,H)=>drawSide(g,W,H,P[t].art);
const oben=t=>(g,W,H)=>drawTop(g,W,H,P[t].art,P[t].cat);
function titel(g,t,x,y,mw,sz,farbe,rand){ const S=stil(t); nameText(g,P[t].art.title,x,y,mw,Math.round(sz),S.font,farbe||S.tf,rand===undefined?S.ol:rand,Math.max(2,sz*0.1)); }
function kraft(g,W,H,rnd,c){ g.fillStyle=c||'#b48a58'; g.fillRect(0,0,W,H);
  for(let x=0;x<W;x+=3){ g.fillStyle=`rgba(80,52,24,${0.03+0.03*Math.sin(x*0.9)})`; g.fillRect(x,0,1.5,H); }
  for(let i=0;i<W*H/90;i++){ g.fillStyle=`rgba(60,40,20,${rnd()*0.08})`; g.fillRect(rnd()*W,rnd()*H,2,1); } }
function holz(g,W,H,rnd,c){ g.fillStyle=c||'#c89a60'; g.fillRect(0,0,W,H);
  for(let i=0;i<H/3;i++){ const y=rnd()*H; g.strokeStyle=`rgba(120,74,30,${0.08+rnd()*0.14})`; g.lineWidth=1+rnd()*1.5; g.beginPath(); g.moveTo(0,y);
    for(let x=0;x<=W;x+=W/8) g.lineTo(x,y+Math.sin(x*0.02+i)*2+rnd()*1.5); g.stroke(); }
  for(let k=0;k<2;k++){ const x=rnd()*W, y=rnd()*H; g.fillStyle='rgba(110,64,24,.35)'; g.beginPath(); g.ellipse(x,y,W*0.012+2,H*0.06+2,0,0,PI*2); g.fill(); }
  g.strokeStyle='rgba(70,40,15,.6)'; g.lineWidth=Math.max(2,Math.min(W,H)*0.03); g.strokeRect(0,0,W,H); }
function blech(g,W,H,rnd,c,hell){ g.fillStyle=c; g.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=2){ g.fillStyle=`rgba(${hell?'255,255,255':'0,0,0'},${rnd()*0.06})`; g.fillRect(0,y,W,1); }
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'rgba(255,255,255,.18)'); gr.addColorStop(0.5,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(0,0,0,.18)'); g.fillStyle=gr; g.fillRect(0,0,W,H); }
function rahmen(g,x,y,w,h,c,lw){ g.strokeStyle=c||'rgba(255,255,255,.9)'; g.lineWidth=lw||Math.max(2,Math.min(w,h)*0.03); g.strokeRect(x,y,w,h); }
function nacht(g,W,H,rnd){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#05071a'); gr.addColorStop(1,'#1a1438'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,.7)'; for(let i=0;i<W*H/700;i++) g.fillRect(rnd()*W,rnd()*H,1.2,1.2); }
/* ---------------- Bauteile ---------------- */
/* Rakete liegend: Spitze bei x, Kopf zeigt nach dir (+1 = +x), Stab endet bei ende */
function rakete(o,x,y,z,r,L,c,q){ q=q||{}; const s=q.dir||1, seg=q.seg||8, kl=q.kl||r*3, rz=-s*PI/2;
  zyl(o,0,r*1.04,kl,seg,x-s*kl/2,y,z,q.kc!==undefined?q.kc:c,0,0,rz);
  if(q.c2!==undefined){ zyl(o,r,r,L/2,seg,x-s*(kl+L/4),y,z,c,0,0,PI/2); zyl(o,r,r,L/2,seg,x-s*(kl+L*0.75),y,z,q.c2,0,0,PI/2); }
  else zyl(o,r,r,L,seg,x-s*(kl+L/2),y,z,c,0,0,PI/2);
  if(q.ring!==false&&!WARE_SPAR_AN) zyl(o,r*1.05,r*1.05,Math.min(0.012,L*0.12),seg,x-s*(kl+L*0.2),y,z,q.ringC!==undefined?q.ringC:0xf2f2f2,0,0,PI/2);
  if(!WARE_SPAR_AN) zyl(o,r*0.72,r*0.86,r*0.6,seg,x-s*(kl+L+r*0.3),y,z,0x3a3a3a,0,0,PI/2);
  if(q.ende!==undefined){ const st=q.st||Math.max(0.003,r*0.32), x0=x-s*(kl+L*0.35), len=Math.abs(x0-q.ende);
    box(o,len,st,st,(x0+q.ende)/2,q.sy!==undefined?q.sy:y-r+st/2,z+(q.sz!==undefined?q.sz:r*0.75),q.sc||HOLZ); }
  if(q.lunte!==false) zyl(o,0.0011,0.0011,r*1.4,4,x-s*(kl+L+r*1.2),y-r*0.3,z,0x2e8b3a,0,0,PI/2);
}
/* Folienschlauch entlang x, an den Enden zur Naht gequetscht */
function quetsch(L,ry,rz,kopf,nR,nU){ nR=sparN(nR||12,4); nU=sparN(nU||12,6); const pos=[], idx=[];
  for(let i=0;i<=nR;i++){ const u=i/nR, x=-L/2+u*L, e=Math.max(0,Math.abs(x)-(L/2-kopf))/kopf, fy=1-0.12*e, fz=Math.pow(1-e,0.7)*0.97+0.03;
    for(let j=0;j<=nU;j++){ const a=j/nU*PI*2; pos.push(x,Math.cos(a)*ry*fy,Math.sin(a)*rz*fz); } }
  for(let i=0;i<nR;i++) for(let j=0;j<nU;j++){ const a=i*(nU+1)+j, b=a+nU+1; idx.push(a,b,a+1,b,b+1,a+1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
/* Prisma entlang x: n Flaechen, Normale der Flaeche i unter Winkel a0+i*2pi/n (0 = vorn, pi/2 = oben) */
function prismaX(o,n,R,L,x,yc,zc,a0,regs,ziel){ const ap=R*Math.cos(PI/n), sw=2*R*Math.sin(PI/n);
  for(let i=0;i<n;i++){ const al=a0+i*2*PI/n, g=new THREE.PlaneGeometry(L,sw), m=tm(x,yc+Math.sin(al)*ap,zc+Math.cos(al)*ap,-al,0,0);
    if(ziel==='fo') fol(o,g,m); else if(regs) dr(o,g,m,regs(i,al)); else o.vc.push({geo:g,m,color:0x888888}); } }
/* stehendes Prisma (Achse y): Flaeche i hat Normale (sin a, 0, cos a) */
function prismaY(o,n,R,H,y0,a0,regs){ const ap=R*Math.cos(PI/n), sw=2*R*Math.sin(PI/n);
  for(let i=0;i<n;i++){ const al=a0+i*2*PI/n; dr(o,new THREE.PlaneGeometry(sw,H),tm(Math.sin(al)*ap,y0+H/2,Math.cos(al)*ap,0,al,0),regs(i,al)); } }
/* bedruckter Zylindermantel: Druck vorn in der Mitte der vorderen Haelfte */
function mantel(o,r1,r2,H,y,reg,seg,x,z){ dr(o,new THREE.CylinderGeometry(r1,r2,H,seg||28,1,true,-PI/2),tm(x||0,y+H/2,z||0),o.R[reg]); }
/* offenes Band um x (vorn, oben, hinten, unten) */
function bandX(o,w,h,d,x,y,z,R){ dr(o,new THREE.PlaneGeometry(w,h),tm(x,y,z+d/2),R.f); dr(o,new THREE.PlaneGeometry(w,h),tm(x,y,z-d/2,0,PI,0),R.b||R.f);
  dr(o,new THREE.PlaneGeometry(w,d),tm(x,y+h/2,z,-PI/2,0,0),R.t||R.f); dr(o,new THREE.PlaneGeometry(w,d),tm(x,y-h/2,z,PI/2,0,0),R.u||R.t||R.f); }
/* Zelt-Kopfkarte ueber dem Inhalt: Grat bei y1, Kanten bei y0, z = +-zk */
function zeltkarte(o,w,y0,y1,zk,rf,rb){ const L=Math.hypot(y1-y0,zk), ph=Math.atan2(zk,y1-y0);
  dr(o,new THREE.PlaneGeometry(w,L),tm(0,(y0+y1)/2,zk/2,-ph,0,0),rf); dr(o,new THREE.PlaneGeometry(w,L),tm(0,(y0+y1)/2,-zk/2,ph,PI,0),rb||rf); }
/* Kegelfontaene stehend */
function kegel(o,x,z,y0,R,H,c,q){ q=q||{}; zyl(o,R*0.34,R,H*0.82,q.seg||14,x,y0+H*0.41,z,c);
  zyl(o,R*0.35,R*0.45,H*0.1,q.seg||14,x,y0+H*0.55,z,q.kragen!==undefined?q.kragen:0xf4f0e6);
  zyl(o,R*0.12,R*0.33,H*0.12,10,x,y0+H*0.88,z,q.kappe!==undefined?q.kappe:0x3b3b3b);
  zyl(o,0.0015,0.0015,H*0.08,4,x,y0+H*0.97,z,0x2e8b3a); }
/* Kegelfontaene mit bedrucktem Mantel (Region reg): Effektbild, Name,
   Farbschild - statt nackter Farbkegel (03.10., Tom: "so eintoenig") */
function kegelD(o,x,z,y0,R,H,reg,q){ q=q||{}; dr(o,new THREE.CylinderGeometry(R*0.34,R,H*0.82,q.seg||16,1,true,-PI/2),tm(x,y0+H*0.41,z,0,q.ry||0,0),reg);
  zyl(o,R*0.35,R*0.45,H*0.1,q.seg||14,x,y0+H*0.55+H*0.32,z,q.kragen!==undefined?q.kragen:0xf4f0e6);
  zyl(o,R*0.12,R*0.33,H*0.08,10,x,y0+H*0.96-H*0.04,z,q.kappe!==undefined?q.kappe:0x3b3b3b);
  zyl(o,0.0015,0.0015,H*0.06,4,x,y0+H*0.98,z,0x2e8b3a); }
function kegelEtikett(t,c,nm,i){ return (g,W,H)=>{ const rnd=zufallAus(hashStr(t+'ke'+i)), a=P[t].art;
  g.fillStyle=c; g.fillRect(0,0,W,H); g.fillStyle='rgba(255,255,255,.12)'; for(let x=0;x<W;x+=W/16) g.fillRect(x,0,W/40,H);
  for(const cx of [W*0.25,W*0.75]){ const fw=W*0.36, fy=H*0.08, fh=H*0.52;
    g.save(); WZ.rr(g,cx-fw/2,fy,fw,fh,fw*0.12); g.clip(); const gr=g.createLinearGradient(0,fy,0,fy+fh); gr.addColorStop(0,'#04050f'); gr.addColorStop(1,'#1a1030'); g.fillStyle=gr; g.fillRect(cx-fw/2,fy,fw,fh);
    g.globalCompositeOperation='lighter'; for(let k=0;k<70;k++){ const an=-PI/2+(rnd()-0.5)*1.1, L=fh*(0.35+rnd()*0.6), x0=cx, y0=fy+fh;
      g.strokeStyle=rgba(k%3?c:'#fff3c4',0.75); g.lineWidth=1; g.beginPath(); g.moveTo(x0,y0); g.quadraticCurveTo(x0+Math.cos(an)*L*0.6,y0+Math.sin(an)*L*0.9,x0+Math.cos(an)*L*1.1,y0+Math.sin(an)*L*0.75); g.stroke(); }
    g.restore(); g.strokeStyle='#fff'; g.lineWidth=Math.max(1.5,W*0.006); WZ.rr(g,cx-fw/2,fy,fw,fh,fw*0.12); g.stroke();
    nameText(g,a.title,cx,H*0.68,fw*1.05,Math.round(H*0.09),FNT.bun,'#fff','rgba(0,0,0,.8)',2);
    g.fillStyle='#fff'; WZ.rr(g,cx-fw*0.4,H*0.75,fw*0.8,H*0.09,H*0.03); g.fill(); nameText(g,nm,cx,H*0.795,fw*0.72,Math.round(H*0.065),FNT.bar,WZ.dunkel(c,0.2)); }
  g.fillStyle='#ffd23f'; g.fillRect(0,H*0.9,W,H*0.04); g.fillStyle='#14151c'; g.fillRect(0,H*0.94,W,H*0.06); }; }
const hex=c=>typeof c==='number'?c:I(c);
/* Hex-Farbe aufhellen (k>0) bzw. abdunkeln (k<0), als Zahl */
const hexMix=(c,k)=>{ const n=hex(c); return [16,8,0].reduce((s,sh)=>{ const v=(n>>sh)&255; return s+(Math.round(k>=0?v+(255-v)*k:v*(1+k))<<sh); },0); };
const ROT=0xd8352a, GOLD=0xd9b45a, SILBER=0xc9ccd2, DUNKEL=0x1b1d24;

/* =================== WUNDERKERZEN =================== */
/* Goldfunken: Faltschachtel mit Aufhaengelasche (Euroloch) und
   Sichtfensterstreifen rechts - darin die grauen Staebe */
VP_FORM.wunder=t=>{ const o=G(t), {w,h,d,a}=o, bh=h*0.88, th=h-bh;
  const R=bogen(o,[{n:'f',w,h:bh,f:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); teil(g,0,0,W*0.7,H,B(t));
      g.fillStyle=a.ac2; g.fillRect(W*0.7,H*0.92,W*0.3,H*0.08); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'10×',W*0.25,Math.round(H*0.05),BUN); g.fillText('10×',W*0.85,H*0.96);
      loch(g,[{x:W*0.74,y:H*0.07,w:W*0.21,h:H*0.82}]); }},
    {n:'b',w,h:bh,f:seite(t)},{n:'s',w:d,h:bh,f:seite(t)},{n:'t',w,h:d,f:oben(t)},
    {n:'tab',w:w*0.5,h:th,f:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle=a.ac2; g.fillRect(0,H*0.85,W,H*0.15); euroloch(g,W/2,H*0.42,H*0.55); }}],{alpha:true});
  dr(o,kiste(w,bh,d,R),tm(0,bh/2,0)); dr(o,kiste(w*0.5,th+0.002,0.003,{f:R.tab,leer:R.tab}),tm(0,bh+th/2-0.001,-d*0.1));
  const x0=-w/2+w*0.74, x1=-w/2+w*0.95; einsatz(o,x0-0.002,x1+0.002,bh*0.08,bh*0.94,-d/2+0.003,d/2-0.002,0x0b0f2e);
  for(let i=0;i<4;i++){ const x=x0+(x1-x0)*(i+0.5)/4, z=-d*0.15+i%2*d*0.18;
    zyl(o,0.0013,0.0013,bh*0.32,5,x,bh*0.25,z,0x9aa0a8); zyl(o,0.0032,0.0032,bh*0.52,6,x,bh*0.66,z,0x6b6d70); }
  fol(o,new THREE.PlaneGeometry(x1-x0,bh*0.82),tm((x0+x1)/2,bh*0.52,d/2-0.0015));
  return fertig(o); };

/* Bengalhoelzer: grosse Streichholz-Schiebeschachtel, Lade halb
   herausgeschoben - oben schauen die Koepfe heraus (06.10.: Rot, Gruen,
   Gelb, Blau wie im Halter beim Abbrennen, 14q) */
VP_FORM.bengalholz=t=>{ const o=G(t), {w,h,d,a,rnd}=o, hs=h*0.76;
  const R=bogen(o,[{n:'f',w,h:hs,f:B(t)},{n:'b',w,h:hs,f:seite(t)},
    {n:'s',w:d,h:hs,f:(g,W,H)=>{ g.fillStyle='#5a3422'; g.fillRect(0,0,W,H); for(let i=0;i<W*H/6;i++){ g.fillStyle=rnd()<0.5?'rgba(20,10,5,.5)':'rgba(140,90,60,.4)'; g.fillRect(rnd()*W,rnd()*H,1.5,1.5); }
      g.fillStyle=a.bg1; g.fillRect(0,0,W*0.12,H); g.fillRect(W*0.88,0,W*0.12,H); }},
    {n:'t',w,h:d,f:flach(a.bg2)}]);
  dr(o,kiste(w,hs,d,R),tm(0,hs/2,0));
  /* Lade: Rueckwand, Seiten, Deckel - vorn offen */
  const ly0=hs-0.03, lh=h-ly0, lw=w*0.96, ld=d*0.9, LC=0xc0221c;
  box(o,lw,lh,0.0015,0,ly0+lh/2,-ld/2,0xf2ead8); for(const sx of [-1,1]) box(o,0.0015,lh,ld,sx*lw/2,ly0+lh/2,0,LC); box(o,lw,0.0015,ld,0,h-0.00075,0,LC);
  for(let i=0;i<12;i++){ const x=-lw*0.44+i*lw*0.88/11, z=(i%2?0.25:-0.15)*ld, top=h-0.006-(i%3)*0.002;
    box(o,0.0026,top-hs*0.5,0.0026,x,(top+hs*0.5)/2,z,0xe3c48f); kugel(o,0.0036,x,top,z,[0xc8322a,0x2f9a4a,0xe0b020,0x2f5fc0][i%4],1,1.5,1,6,4); }
  return fertig(o); };

/* Herz-Wunderkerzen: Blisterkarte mit Euroloch, herzfoermige
   Klarsichtblase, darin zwei Drahtherzen */
VP_FORM.wunderherz=t=>{ const o=G(t), {w,h,d,a,rnd}=o, kd=0.004;
  const R=bogen(o,[{n:'f',w,h,f:(g,W,H)=>{ verlauf(a.bg1,a.bg2)(g,W,H); teil(g,0,H*0.09,W,H*0.47,B(t));
      g.fillStyle='rgba(255,255,255,.18)'; for(let i=0;i<26;i++){ const x=rnd()*W, y=H*0.58+rnd()*H*0.34, s=W*0.03+rnd()*W*0.03; g.beginPath(); g.moveTo(x,y+s*0.5); g.bezierCurveTo(x-s*1.1,y-s*0.2,x-s*0.4,y-s*0.9,x,y-s*0.3); g.bezierCurveTo(x+s*0.4,y-s*0.9,x+s*1.1,y-s*0.2,x,y+s*0.5); g.fill(); }
      g.fillStyle=a.ac2; g.fillRect(0,H*0.93,W,H*0.07); g.fillStyle='#4a0626'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'6 STÜCK',W*0.8,Math.round(H*0.045),BAR); g.fillText('6 STÜCK',W/2,H*0.965);
      g.fillStyle=a.bg2; g.fillRect(0,0,W,H*0.09); euroloch(g,W/2,H*0.045,H*0.05); }},
    {n:'b',w,h,f:seite(t)},{n:'leer',w:0.02,h:0.02,f:flach(a.bg2)}],{alpha:true});
  dr(o,kiste(w,h,kd,R),tm(0,h/2,-d/2+kd/2));
  const S=w*0.37, cy=h*0.235, herz=k=>{ const s=new THREE.Shape(); s.moveTo(0,-k); s.bezierCurveTo(-0.2*k,-0.75*k,-k,-0.35*k,-k,0.25*k); s.bezierCurveTo(-k,0.75*k,-0.4*k,k,0,0.55*k); s.bezierCurveTo(0.4*k,k,k,0.75*k,k,0.25*k); s.bezierCurveTo(k,-0.35*k,0.2*k,-0.75*k,0,-k); return s; };
  const bt=d-kd-0.006, bl=new THREE.ExtrudeGeometry(herz(S),{depth:bt*0.5,bevelEnabled:true,bevelThickness:bt*0.25,bevelSize:S*0.06,bevelSegments:2,curveSegments:8});
  fol(o,bl,tm(0,cy,-d/2+kd+bt*0.25+0.001));
  for(const [k,dz,c,rr] of [[0.72,0.006,0x6b6d70,0.0034],[0.6,0.011,0x7a7c80,0.003]]){
    const pts=herz(S*k).getPoints(10).map(p=>new THREE.Vector3(p.x,p.y,0)); pts.pop();
    o.vc.push({geo:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),44,rr,4,true),m:tm(0,cy+S*0.05,-d/2+kd+dz),color:c});
    zyl(o,0.0012,0.0012,cy-S*k-0.012,4,0,(cy-S*k+0.012)/2+S*0.05-0.004,-d/2+kd+dz,0x9aa0a8); }
  return fertig(o); };

/* Jahreszahl: Haengekarte, die vier Zahlen-Wunderkerzen mit
   Klarsichtclips auf die Karte geklemmt */
VP_FORM.wunderzahl=t=>{ const o=G(t), {w,h,d,a,rnd}=o, kd=0.004;
  const R=bogen(o,[{n:'f',w,h,f:(g,W,H)=>{ nacht(g,W,H,rnd); teil(g,0,H*0.12,W,H*0.3,B(t));
      g.fillStyle='#0e1226'; g.fillRect(0,0,W,H*0.12); euroloch(g,W/2,H*0.06,H*0.07);
      g.fillStyle=GOLD_TXT; g.fillRect(0,H*0.92,W,H*0.08); g.fillStyle='#0e1226'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'4 ZAHLEN-WUNDERKERZEN · 2 0 2 7',W*0.9,Math.round(H*0.05),BAR); g.fillText('4 ZAHLEN-WUNDERKERZEN · 2 0 2 7',W/2,H*0.96);
      g.strokeStyle='rgba(255,210,63,.35)'; g.lineWidth=2; g.strokeRect(W*0.03,H*0.45,W*0.94,H*0.44); }},
    {n:'b',w,h,f:seite(t)},{n:'leer',w:0.02,h:0.02,f:flach('#0e1226')}],{alpha:true});
  dr(o,kiste(w,h,kd,R),tm(0,h/2,-d/2+kd/2));
  const zf=-d/2+kd+0.007, A=0.026, Bh=0.052, cy=h*0.33, segs={'2':'abged','0':'abcdef','7':'abc'}, rr=0.0034;
  ['2','0','2','7'].forEach((z,i)=>{ const cx=(i-1.5)*w*0.22;
    const S={a:[cx,cy+Bh,1],b:[cx+A,cy+Bh/2,0],c:[cx+A,cy-Bh/2,0],d:[cx,cy-Bh,1],e:[cx-A,cy-Bh/2,0],f:[cx-A,cy+Bh/2,0],g:[cx,cy,1]};
    for(const s of segs[z]){ const [x,y,hz]=S[s]; zyl(o,rr,rr,hz?2*A:Bh,6,x,y,zf,0x6b6d70,0,0,hz?PI/2:0); }
    zyl(o,0.0013,0.0013,0.04,4,cx,cy-Bh-0.02,zf,0x9aa0a8);
    for(const yy of [cy+Bh*0.55,cy-Bh-0.012]) box(o,0.022,0.006,0.002,cx,yy,zf+0.0045,0xe8eef2);
    fol(o,new THREE.BoxGeometry(0.024,0.008,0.009),tm(cx,cy+Bh*0.55,zf)); fol(o,new THREE.BoxGeometry(0.014,0.008,0.009),tm(cx,cy-Bh-0.012,zf)); });
  return fertig(o); };
const GOLD_TXT='#ffd23f';

/* Riesenfunken: Folienbeutel mit geklammerter Kopfkarte (Euroloch),
   darin die meterlangen Staebe vor einem bedruckten Einleger */
VP_FORM.wunderkerzeXXL=t=>{ const o=G(t), {w,h,d,a}=o, hh=h*0.17, bH=h-hh+0.008;
  const R=bogen(o,[{n:'k',w,h:hh,f:(g,W,H)=>{ verlauf(a.bg1,a.bg2)(g,W,H); euroloch(g,W/2,H*0.2,H*0.2);
      titel(g,t,W/2,H*0.6,W*0.92,H*0.3); g.fillStyle=a.ac; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,a.sub,W*0.9,Math.round(H*0.13),BAR); g.fillText(a.sub,W/2,H*0.86); }},
    {n:'kb',w,h:hh,f:(g,W,H)=>{ verlauf(a.bg2,a.bg1)(g,W,H); euroloch(g,W/2,H*0.2,H*0.2); }},
    {n:'e',w:w*0.86,h:bH*0.97,f:B(t)},{n:'leer',w:0.02,h:0.02,f:flach(a.bg2)}],{alpha:true});
  dr(o,kiste(w,hh,0.005,{f:R.k,b:R.kb,leer:R.leer}),tm(0,h-hh/2,0));
  for(const sx of [-1,1]) box(o,0.008,0.0025,0.007,sx*w*0.3,h-hh*0.82,0,0xb9bec6);
  dr(o,kiste(w*0.86,bH*0.97,0.002,{f:R.e,leer:R.leer}),tm(0,bH*0.485+0.002,-d*0.2));
  for(const x of [-0.052,-0.03,0.03,0.052]){ const xx=x*w/0.137; zyl(o,0.0014,0.0014,bH*0.3,4,xx,bH*0.16,0,0x9aa0a8); zyl(o,0.0036,0.0036,bH*0.66,6,xx,bH*0.63,0,0x6b6d70); }
  fol(o,new THREE.BoxGeometry(w*0.94,bH,d*0.62),tm(0,bH/2,0));
  return fertig(o); };

/* =================== BOELLER =================== */
/* Pupsalarm: Folienschlauch mit gequetschten Siegelnaehten an beiden
   Enden, dazu eine bedruckte Papierbanderole */
VP_FORM.boeller=t=>{ const o=G(t), {w,h,d,a}=o, Rq=Math.min(h,d)*0.47, r=Rq/3.15, L=w*0.66, cols=['#8a5a2a','#6b8a2a','#a0702e'];
  /* 03.10.: jeder Boeller mit bedrucktem Papier (Name laengs, Wolken, Warnring) statt nackter Farbrohre */
  const bp=(c,i)=>(g,W,H)=>{ g.fillStyle=c; g.fillRect(0,0,W,H); g.fillStyle='rgba(255,255,255,.1)'; for(let y=0;y<H;y+=H/14) g.fillRect(0,y,W,H/40);
    g.fillStyle='#d8322a'; g.fillRect(0,H*0.08,W,H*0.05); g.fillRect(0,H*0.87,W,H*0.05);
    for(const cx of [W*0.25,W*0.75]){ g.save(); g.translate(cx,H/2); g.rotate(-PI/2); nameText(g,a.title,0,0,H*0.64,Math.round(W*0.22),FNT.bun,'#fff','rgba(0,0,0,.7)',2); g.restore(); }
    g.fillStyle='rgba(255,255,255,.75)'; for(let k=0;k<3;k++){ const y=H*(0.2+k*0.3); for(const cx of [W*0.5,W*0.02]){ g.beginPath(); g.arc(cx,y,W*0.05,0,2*PI); g.arc(cx+W*0.05,y-W*0.02,W*0.05,0,2*PI); g.arc(cx+W*0.1,y,W*0.04,0,2*PI); g.fill(); } } };
  const RB=bogen(o,[...cols.map((c,i)=>({n:'r'+i,w:PI*2*r,h:L,f:bp(c,i)})),{n:'f',w:w*0.4,h:2*Rq+0.004,f:B(t)},{n:'b',w:w*0.4,h:2*Rq+0.004,f:seite(t)},{n:'t',w:w*0.4,h:2*Rq+0.004,f:oben(t)}]);
  for(let ly=-1;ly<=1;ly++) for(let iz=-1;iz<=1;iz++){ const y=h/2+ly*r*2.02, z=iz*r*2.02;
    dr(o,new THREE.CylinderGeometry(r,r,L,12,1,true),tm(0,y,z,(ly*3+iz)*0.7,0,PI/2),RB['r'+((ly+iz+3)%3)]); o.vc.push({geo:new THREE.CircleGeometry(r*0.98,8),m:tm(-L/2,y,z,0,-PI/2,0),color:0xd9cbb0}); zyl(o,r*0.95,r*0.95,0.003,10,L/2+0.0015,y,z,0xd9cbb0,0,0,PI/2); zyl(o,0.0014,0.0014,0.012,4,L/2+0.007,y,z,0x2e8b3a,0,0,PI/2); }
  fol(o,quetsch(w*0.98,Rq,Rq,(w*0.98-L)/2,16,14),tm(0,h/2,0));
  for(const sx of [-1,1]) fol(o,new THREE.BoxGeometry(0.008,Rq*1.7,0.0015),tm(sx*(w/2-0.006),h/2,0));
  const bw=w*0.4, bb=2*Rq+0.004;
  bandX(o,bw,bb,bb,-w*0.03,h/2,0,RB);
  return fertig(o); };

/* Monster: Munitionskiste aus Blech mit Klappbuegel, Verschluss und
   aufgeklebtem Etikett */
VP_FORM.monsterboeller=t=>{ const o=G(t), {w,h,d,a,rnd}=o, bw=w*0.93, bh=h*0.8, bd=d*0.86, OL='#2f3a26';
  const R=bogen(o,[{n:'f',w:bw,h:bh,f:(g,W,H)=>{ blech(g,W,H,rnd,OL); teil(g,W*0.05,H*0.08,W*0.66,H*0.84,(g2,w2,h2)=>drawFront(g2,w2,h2,a,o.cat)); rahmen(g,W*0.05,H*0.08,W*0.66,H*0.84,'#e8e4d8',3);
      g.save(); g.translate(W*0.86,H*0.5); g.rotate(-PI/2); g.fillStyle=a.ac; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'4 × EXTREM',H*0.8,Math.round(W*0.12),BUN); g.fillText('4 × EXTREM',0,0); g.restore(); }},
    {n:'s',w:bd,h:bh,f:(g,W,H)=>{ blech(g,W,H,rnd,OL); g.fillStyle=a.ac; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'MONSTER',W*0.85,Math.round(H*0.3),BUN); g.fillText('MONSTER',W/2,H*0.45); g.font=BAR(Math.round(H*0.12)); g.fillStyle='#e8e4d8'; g.fillText('CAL. F2 · 4 STK',W/2,H*0.72); }},
    {n:'b',w:bw,h:bh,f:(g,W,H)=>{ blech(g,W,H,rnd,OL); g.fillStyle='#e8e4d8'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'MONSTER BÖLLER · NUR IM FREIEN',W*0.9,Math.round(H*0.14),BAR); g.fillText('MONSTER BÖLLER · NUR IM FREIEN',W/2,H/2); }},
    {n:'d',w:bw,h:bd,f:(g,W,H)=>{ blech(g,W,H,rnd,'#28321f'); g.fillStyle='rgba(0,0,0,.35)'; for(let i=1;i<4;i++) g.fillRect(W*0.06,H*i/4,W*0.88,2); }}],{metal:0.35,rough:0.5});
  dr(o,kiste(bw,bh,bd,{f:R.f,b:R.b,s:R.s,t:R.d}),tm(0,bh/2,0));
  dr(o,kiste(w*0.97,h*0.12,d*0.92,{f:R.d,s:R.d,t:R.d}),tm(0,bh+h*0.06,0));
  const DK=0x1c2216;
  box(o,w*0.42,0.004,0.012,0,h-0.004,d*0.08,DK); for(const sx of [-1,1]) box(o,0.006,0.008,0.008,sx*w*0.22,h-0.006,d*0.08,DK);
  box(o,0.006,h*0.34,d*0.32,bw/2+0.003,bh*0.95,0,DK); box(o,0.007,h*0.1,d*0.2,bw/2+0.0035,bh+h*0.03,0,0x3a4430);
  zyl(o,0.004,0.004,w*0.9,8,0,bh+h*0.02,-d*0.46,DK,0,0,PI/2);
  box(o,w*0.95,h*0.04,d*0.88,0,h*0.02,0,DK);
  return fertig(o); };

/* Blitzknaller: Sechskantroehre aus Klarsicht mit runden Kappen,
   Papieretikett um die Mitte, drin die sechs Knaller */
VP_FORM.blitzknaller=t=>{ const o=G(t), {w,h,d,a}=o, Rr=Math.min(h/2,d/(2*0.866))*0.96, yc=Rr*1.012, cl=w*0.055, L=w-2*cl-0.002, lw=w*0.44, sw=Rr;
  const R=bogen(o,[{n:'f',w:lw,h:sw,f:B(t)},{n:'n',w:lw,h:sw,f:(g,W,H)=>{ g.fillStyle=a.bg1; g.fillRect(0,0,W,H); g.fillStyle=a.ac2; g.fillRect(0,H*0.82,W,H*0.18); titel(g,t,W/2,H*0.45,W*0.9,H*0.5,a.ac,null); }},
    {n:'leer',w:lw,h:sw,f:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle='#1b1b2e'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'6 STÜCK · F2 · NUR IM FREIEN',W*0.9,Math.round(H*0.3),BAR); g.fillText('6 STÜCK · F2 · NUR IM FREIEN',W/2,H/2); }}]);
  prismaX(o,6,Rr*1.012,lw,-w*0.04,yc,0,0,(i)=>i===0?R.f:i===1||i===5?R.n:R.leer);
  prismaX(o,6,Rr,L,0,yc,0,0,null,'fo');
  for(const sx of [-1,1]){ o.vc.push({geo:new THREE.CylinderGeometry(Rr*1.01,Rr*1.01,cl,6,1,false,PI/6),m:tm(sx*(w/2-cl/2),yc,0,0,0,PI/2),color:I(a.ac2)});
    o.vc.push({geo:new THREE.CylinderGeometry(Rr*0.7,Rr*0.7,0.002,6,1,false,PI/6),m:tm(sx*(w/2-0.0005),yc,0,0,0,PI/2),color:0xf2f5ff}); }
  for(let k=0;k<6;k++){ const al=PI/6+k*PI/3; zyl(o,0.0008,0.0008,L,4,0,yc+Math.sin(al)*Rr,Math.cos(al)*Rr,0xe8eef2,0,0,PI/2); }
  const r=Rr*0.27;
  [[-1,1],[0,1],[1,1],[-1,-1],[0,-1],[1,-1]].forEach(([iz,iy],i)=>{ const y=yc+iy*r*1.05, z=iz*r*2.05;
    zyl(o,r,r,L*0.9,8,0,y,z,0xb9bec6,0,0,PI/2); zyl(o,r*1.03,r*1.03,L*0.12,8,L*0.18,y,z,ROT,0,0,PI/2); zyl(o,r*1.03,r*1.03,L*0.05,8,-L*0.3,y,z,0x1b1b2e,0,0,PI/2); });
  return fertig(o); };

/* =================== KLEINFEUERWERK =================== */
/* Knallerbsen: ovale Weissblechdose mit Klarsichtdeckel - drin
   Saegespaene und die Erbsen in Papier */
VP_FORM.knallerbsen=t=>{ const o=G(t), {w,h,d,a,rnd}=o, rz=d/2*0.96, sx=(w/2*0.96)/rz, Hb=h*0.82;
  const C=PI*(rz*(1+sx));
  const R=bogen(o,[{n:'m',w:C,h:Hb,f:zweimal((g,W,H)=>{ bild(g,W,H,t,{mitte:true}); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,0,W,H*0.04); g.fillRect(0,H*0.96,W,H*0.04); })}],{metal:0.15});
  dr(o,new THREE.CylinderGeometry(rz,rz,Hb,28,1,true,-PI/2),tm(0,Hb/2,0,0,0,0,sx,1,1),R.m);
  zyl(o,rz*1.01,rz*1.01,0.004,28,0,0.002,0,0x8f949c,0,0,0,sx,1,1);
  o.vc.push({geo:new THREE.CylinderGeometry(rz*1.03,rz*1.03,h-Hb+0.004,28,1,true),m:tm(0,(Hb+h)/2-0.002,0,0,0,0,sx,1,1),color:0x9aa1ab});
  torus(o,rz*1.02,0.0022,0,h-0.002,0,0xd7dbe0,PI/2,0,0,28,sx,1,1);
  zyl(o,rz*0.99,rz*0.99,0.003,24,0,h*0.78,0,0xd8b27a,0,0,0,sx,1,1);
  for(let i=0;i<24;i++){ const an=rnd()*PI*2, rr=Math.sqrt(rnd())*0.82; kugel(o,0.0055,Math.cos(an)*rr*rz*sx,h*0.78+0.004+rnd()*0.004,Math.sin(an)*rr*rz,rnd()<0.5?0xf3e3c0:0xfff2d6,1,0.85,1,6,4); }
  fol(o,new THREE.CylinderGeometry(rz*1.01,rz*1.01,0.002,28),tm(0,h-0.003,0,0,0,0,sx,1,1));
  return fertig(o); };

/* Knallfrosch (03.10., Tom: "sieht nicht aus wie echte Knallfroesche"):
   wie im Handel - bedruckte Faltschachtel, oben ein Sichtfenster, darunter
   liegen die Froesche nebeneinander: schmale, im Zickzack gefaltete
   Papierroehrchen, in der Mitte mit Garn gebunden, vorn ragt die
   Zuendschnur heraus.
   06.10. (Toms PDF: "Die Knallfroesche sind in echt aber gruen" und die
   Verpackung "sieht aus wie schlecht gezeichnete Voegel"): echte
   Knallfroesche (Nico, Weco, Funke) sind gruenes Papier - "gruen wie echte
   Laubfroesche aus dem Bilderbuch" (Haendlertext). Jetzt alle Froesche
   gruen mit dunkelgruenem Feindruck und weissem Garn (vorher rot-weiss,
   gruen-gelb, blau-weiss mit KNALL-Schrift). Das Druckmotiv ist ein
   sitzender Frosch von vorn - breiter Kopf, Glubschaugen oben, breites
   Maul, Schwimmfuesse mit Haftballen; die lachenden Sterne und der kleine
   Kopf ohne Koerper (las sich wie ein Kueken) sind weg. */
function froschDruck(g,W,H,rnd){ g.fillStyle='#3c9a3a'; g.fillRect(0,0,W,H);
  /* Feindruck: dunkelgruene Schraegschraffur, wie auf dem echten Papier */
  g.strokeStyle='rgba(12,60,18,.45)'; g.lineWidth=Math.max(1,H*0.06);
  for(let x=-H;x<W+H;x+=Math.max(3,H*0.45)){ g.beginPath(); g.moveTo(x,H); g.lineTo(x+H,0); g.stroke(); }
  g.fillStyle='rgba(0,0,0,.14)'; for(let k=0;k<W*H/40;k++) g.fillRect(rnd()*W,rnd()*H,1,1);
  g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(0,0,W,H*0.25); }
/* sitzender Frosch von vorn, Mitte (cx,cy), Hoehe s */
function froschBild(g,cx,cy,s){ const K='#34a33c', Kd='#258a2f', D='#0d3f14', Hb='#c9ec7a', lw=Math.max(1.2,s*0.04);
  g.save(); g.lineJoin='round'; g.lineCap='round'; g.strokeStyle=D; g.lineWidth=lw;
  const X=v=>cx+v*s, Y=v=>cy+v*s;
  const ell=(x,y,rx,ry,rot,f,ohne)=>{ g.beginPath(); g.ellipse(X(x),Y(y),rx*s,ry*s,rot||0,0,PI*2); g.fillStyle=f; g.fill(); if(!ohne) g.stroke(); };
  /* Zehen mit Haftballen: von (x,y) in Richtung a0..a1 */
  const zehen=(x,y,a0,a1,l,n)=>{ for(let i=0;i<n;i++){ const a=a0+(a1-a0)*i/(n-1), ex=x+Math.cos(a)*l, ey=y+Math.sin(a)*l;
      g.strokeStyle=D; g.lineWidth=s*0.075; g.beginPath(); g.moveTo(X(x),Y(y)); g.lineTo(X(ex),Y(ey)); g.stroke();
      g.strokeStyle=K; g.lineWidth=s*0.04; g.beginPath(); g.moveTo(X(x),Y(y)); g.lineTo(X(ex),Y(ey)); g.stroke();
      g.strokeStyle=D; g.lineWidth=lw; ell(ex,ey,0.035,0.035,0,K); } };
  /* Hinterbeine: angewinkelte Schenkel links und rechts, Fuesse nach aussen gespreizt */
  for(const sx of [-1,1]){ ell(sx*0.4,0.2,0.2,0.3,sx*0.55,Kd); zehen(sx*0.52,0.44,sx>0?-0.25:PI+0.25,sx>0?0.55:PI-0.55,0.17,3); ell(sx*0.47,0.44,0.13,0.06,0,Kd); }
  /* Koerper mit hellem Bauch */
  ell(0,0.12,0.36,0.36,0,K); ell(0,0.2,0.22,0.22,0,Hb,true);
  /* Vorderbeine gerade nach unten, Finger gespreizt */
  for(const sx of [-1,1]){ g.strokeStyle=D; g.lineWidth=s*0.13; g.beginPath(); g.moveTo(X(sx*0.17),Y(0.16)); g.lineTo(X(sx*0.2),Y(0.44)); g.stroke();
    g.strokeStyle=K; g.lineWidth=s*0.08; g.beginPath(); g.moveTo(X(sx*0.17),Y(0.16)); g.lineTo(X(sx*0.2),Y(0.44)); g.stroke();
    zehen(sx*0.2,0.45,PI/2+sx*0.9,PI/2-sx*0.2,0.1,3); }
  /* breiter, flacher Kopf */
  ell(0,-0.2,0.44,0.25,0,K);
  /* Glubschaugen oben auf dem Kopf */
  for(const sx of [-1,1]){ ell(sx*0.23,-0.4,0.15,0.14,0,K); ell(sx*0.23,-0.41,0.1,0.095,0,'#ffffff',true); ell(sx*0.21,-0.4,0.05,0.06,0,'#111111',true); ell(sx*0.19,-0.43,0.017,0.017,0,'#ffffff',true); }
  /* Nasenloecher und das breite Froschmaul */
  g.fillStyle=D; for(const sx of [-1,1]){ g.beginPath(); g.arc(X(sx*0.06),Y(-0.24),s*0.016,0,PI*2); g.fill(); }
  g.strokeStyle=D; g.lineWidth=lw*1.3; g.beginPath(); g.moveTo(X(-0.33),Y(-0.15)); g.quadraticCurveTo(X(0),Y(-0.02),X(0.33),Y(-0.15)); g.stroke();
  g.restore(); }
/* Knallfrosch als Zeichnung: gruenes Zickzack-Paeckchen mit Garn und Zuendschnur */
function froschPaeckchen(g,x,y,w,h){ const n=6, dh=h/n;
  g.save(); g.lineJoin='round'; g.strokeStyle='#0d3f14'; g.lineWidth=Math.max(1,h*0.035);
  for(let i=0;i<n;i++){ g.fillStyle=i%2?'#2f8d35':'#46ad44'; g.beginPath(); g.rect(x,y+i*dh,w,dh*0.98); g.fill(); g.stroke(); }
  g.fillStyle='#f4f0e2'; g.fillRect(x+w*0.46,y-h*0.02,w*0.08,h*1.04);
  g.strokeStyle='#5a6a2a'; g.lineWidth=Math.max(1,h*0.05); g.beginPath(); g.moveTo(x+w,y+dh*0.5); g.quadraticCurveTo(x+w*1.25,y-h*0.05,x+w*1.15,y-h*0.25); g.stroke();
  g.restore(); }
VP_FORM.knallfrosch=t=>{ const o=G(t), {w,h,d,a,rnd}=o, n=WARE_SPAR_AN?6:10, fw=w*0.84/n, L=d*0.78, nf=WARE_SPAR_AN?5:9, amp=Math.min(0.005,h*0.09), yb=h-0.0035-amp;
  const fen={x:0.07,y:0.12,w:0.86,h:0.66};
  const grund=(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#cdea55'); gr.addColorStop(0.55,'#7cc443'); gr.addColorStop(1,'#2f8d35'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    /* Seerosenblatt-Tupfen im Hintergrund */
    g.fillStyle='rgba(255,255,255,.12)'; for(let i=0;i<9;i++){ const r=Math.min(W,H)*(0.05+0.04*(i%3)); g.beginPath(); g.arc(W*((i*0.37)%1),H*((i*0.61)%1),r,0.3,PI*2-0.3); g.lineTo(W*((i*0.37)%1),H*((i*0.61)%1)); g.fill(); } };
  const R=bogen(o,[{n:'f',w,h,f:(g,W,H)=>{ grund(g,W,H);
      froschBild(g,W*0.25,H*0.5,H*0.78);
      nameText(g,a.title,W*0.67,H*0.33,W*0.6,Math.round(H*0.3),FNT.bun,'#ffffff','#0d3f14',Math.max(2,H*0.04));
      nameText(g,'KNALLFRÖSCHE',W*0.67,H*0.6,W*0.58,Math.round(H*0.17),FNT.bar,'#0d3f14',null);
      froschPaeckchen(g,W*0.6,H*0.73,W*0.1,H*0.2); nameText(g,'20×',W*0.84,H*0.83,W*0.2,Math.round(H*0.2),FNT.bun,'#ffd23f','#0d3f14',2); }},
    {n:'b',w,h,f:(g,W,H)=>{ grund(g,W,H); froschPaeckchen(g,W*0.1,H*0.2,W*0.22,H*0.5);
      nameText(g,'SPRINGT UND KNALLT',W*0.62,H*0.32,W*0.62,Math.round(H*0.15),FNT.bar,'#0d3f14',null);
      nameText(g,'Auf festem Boden zünden,',W*0.62,H*0.55,W*0.62,Math.round(H*0.11),FNT.bar,'#ffffff',null);
      nameText(g,'sofort entfernen.',W*0.62,H*0.7,W*0.62,Math.round(H*0.11),FNT.bar,'#ffffff',null); }},
    {n:'s',w:d,h,f:(g,W,H)=>{ grund(g,W,H); froschBild(g,W/2,H*0.42,H*0.62); g.fillStyle='#0d3f14'; g.fillRect(0,H*0.8,W,H*0.2); nameText(g,'20 STÜCK',W/2,H*0.9,W*0.86,Math.round(H*0.14),FNT.bar,'#ffd23f'); }},
    {n:'t',w,h:d,f:(g,W,H)=>{ g.fillStyle='#2f8d35'; g.fillRect(0,0,W,H); g.fillStyle='#0d3f14'; g.fillRect(0,0,W,H*fen.y); g.fillStyle='#cdea55'; g.fillRect(0,H*(fen.y+fen.h),W,H*(1-fen.y-fen.h));
      nameText(g,a.title,W*0.4,H*0.89,W*0.62,Math.round(H*0.15),FNT.bun,'#ffffff','#0d3f14',2); froschBild(g,W*0.86,H*0.89,H*0.19);
      nameText(g,'20 KNALLFRÖSCHE',W/2,H*0.06,W*0.8,Math.round(H*0.08),FNT.bar,'#cdea55');
      loch(g,[{x:W*fen.x,y:H*fen.y,w:W*fen.w,h:H*fen.h}],'#cdea55'); }},
    {n:'fr',w:L,h:fw,f:(g,W,H)=>froschDruck(g,W,H,rnd)},
    {n:'u',w,h:d,f:flach('#2a2018')}],{alpha:true,ppm:5000});
  dr(o,kiste(w,h,d,{f:R.f,b:R.b,s:R.s,t:R.t,u:R.u}),tm(0,h/2,0));
  einsatz(o,-w/2+0.001,w/2-0.001,0.001,h-0.0015,-d/2+0.001,d/2-0.001,0x2a1a10);
  /* gefalteter Streifen: Zickzack laengs z, Oberseite bedruckt */
  const zick=()=>{ const pos=[],uv=[],idx=[]; for(let i=0;i<=nf;i++){ const z=-L/2+i*L/nf, y=i%2?amp:0; pos.push(-fw*0.45,y,z, fw*0.45,y,z); uv.push(i/nf,0,i/nf,1); }
    for(let i=0;i<nf;i++){ const b=2*i; idx.push(b,b+3,b+1,b,b+2,b+3); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  box(o,w*0.96,0.003,d*0.96,0,yb-0.004,0,0x2a1a10);
  for(let i=0;i<n;i++){ const x=-w*0.42+fw*(i+0.5), dz=(rnd()-0.5)*0.004;
    dr(o,zick(),tm(x,yb,dz,0,(rnd()-0.5)*0.06,0),R.fr);
    /* weisses Garn um die Mitte */
    if(!WARE_SPAR_AN) box(o,fw*0.92,amp+0.0016,0.003,x,yb+amp/2,dz,0xf4f0e2);
    zyl(o,0.0009,0.0009,0.008,4,x,yb+amp*0.3,dz+L/2+0.003,0x6a7a2e,PI/2,0,0); }
  /* Klarsichtfolie im Fenster */
  fol(o,new THREE.PlaneGeometry(w*fen.w,d*fen.h),tm(0,h-0.0006,-d/2+d*(fen.y+fen.h/2),-PI/2,0,0));
  return fertig(o); };

/* Flitzer: Netzbeutel mit gefalteter Reiterkarte oben */
VP_FORM.schwaermer=t=>{ const o=G(t), {w,h,d,a}=o, cy=h*0.42, ax=w*0.48, ay=h*0.41, az=d*0.43;
  const nt=tex(128,128,(g,W,H)=>{ g.clearRect(0,0,W,H); g.strokeStyle=a.ac2; g.lineWidth=12; g.beginPath(); g.moveTo(0,0); g.lineTo(W,H); g.moveTo(W,0); g.lineTo(0,H); g.stroke(); g.fillStyle='#8a1410'; g.beginPath(); g.arc(W/2,H/2,9,0,PI*2); g.fill(); });
  nt.wrapS=nt.wrapT=THREE.RepeatWrapping; nt.repeat.set(16,7);
  o.ex.push({geo:merge([{geo:new THREE.SphereGeometry(1,18,10),m:tm(0,cy,0,0,0,0,ax,ay,az)}]),mat:new THREE.MeshStandardMaterial({map:nt,alphaTest:0.5,side:THREE.DoubleSide,roughness:0.8})});
  const cols=[0xf2a01c,ROT,0x2f7fd0,0xffd23f,0x2f9e57,0xf2f5ff];
  [[-0.5,-0.55],[-0.5,0],[-0.5,0.55],[0,-0.7],[0,-0.25],[0,0.25],[0,0.7],[0.5,-0.55],[0.5,0],[0.5,0.55],[0.25,-0.25],[0.25,0.3]].forEach(([fy,fz],i)=>{
    const y=cy+fy*ay*0.85, z=fz*az*0.85, k=Math.max(0.2,1-fy*fy*0.72-fz*fz*0.72), len=2*ax*Math.sqrt(k)*0.86, r=0.0075;
    zyl(o,r,r,len,8,(i%3-1)*0.006,y,z,cols[i%cols.length],0,0,PI/2); zyl(o,0.0012,0.0012,0.01,4,len/2+0.004,y,z,0x2e8b3a,0,0,PI/2); });
  const y0=h*0.66, zk=d*0.36;
  const R=bogen(o,[{n:'kf',w:w*0.96,h:Math.hypot(h-y0,zk),f:B(t)},{n:'kb',w:w*0.96,h:Math.hypot(h-y0,zk),f:seite(t)}]);
  zeltkarte(o,w*0.96,y0,h-0.001,zk,R.kf,R.kb);
  box(o,0.012,0.002,0.003,0,(y0+h)/2,zk*0.5+0.002,0xb9bec6);
  return fertig(o); };

/* Knallbonbons: Geschenkbox - bedruckter Boden, Klarsichtdeckel,
   goldenes Satinband mit Schleife */
VP_FORM.knallbonbon=t=>{ const o=G(t), {w,h,d,a}=o, hb=h*0.48, hl=h*0.84;
  const R=bogen(o,[{n:'f',w,h:hb,f:B(t)},{n:'s',w:d,h:hb,f:seite(t)},{n:'t',w,h:d,f:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); for(let y=0;y<H;y+=3){ g.fillStyle=`rgba(255,255,255,${0.03+0.03*Math.sin(y*0.3)})`; g.fillRect(0,y,W,1.5); } }}]);
  dr(o,kiste(w,hb,d,{f:R.f,s:R.s,t:R.t}),tm(0,hb/2,0));
  const cols=[0xd8352a,0xffd23f,0xf2f5ff,0x2f9e57,0xe35aa8], r=0.0085, n=WARE_SPAR_AN?3:5;
  for(let k=0;k<2;k++) for(let i=0;i<n;i++){ const x=(k?1:-1)*w*0.235, z=-d*0.4+i*d*0.8/(n-1), y=hb+r, c=cols[(i+k*2)%cols.length], bl=w*0.2;
    zyl(o,r,r,bl,8,x,y,z,c,0,0,PI/2); for(const s of [-1,1]){ if(!WARE_SPAR_AN) zyl(o,r*0.35,r,0.014,8,x+s*(bl/2+0.007),y,z,c,0,0,s*PI/2); zyl(o,r*1.1,r*0.4,WARE_SPAR_AN?0.026:0.012,8,x+s*(bl/2+(WARE_SPAR_AN?0.013:0.019)),y,z,c,0,0,s*PI/2); }
    if(!WARE_SPAR_AN) zyl(o,r*1.04,r*1.04,0.006,8,x,y,z,GOLD,0,0,PI/2); }
  fol(o,new THREE.BoxGeometry(w,hl-hb,d),tm(0,(hb+hl)/2,0));
  const bx=-w*0.3, BAND=0xe0b44a;
  box(o,0.016,0.0015,d,bx,hl+0.0008,0,BAND); box(o,w,0.0015,0.016,0,hl+0.0008,0,BAND);
  box(o,0.016,hl-hb,0.0015,bx,(hl+hb)/2,d/2+0.0008,BAND); box(o,0.016,hl-hb,0.0015,bx,(hl+hb)/2,-d/2-0.0008,BAND);
  for(const s of [-1,1]){ torus(o,0.016,0.0045,bx+s*0.016,hl+0.006,0,BAND,PI/2,0,s*0.35,14,1,1,0.55); box(o,0.006,0.0015,0.03,bx+s*0.008,hl+0.002,s*0.02,BAND,0,s*0.5,0); }
  kugel(o,0.006,bx,hl+0.006,0,0xc9982e,1,0.8,1);
  return fertig(o); };

/* Brummkreisel: Formfaser-Tray wie ein Eierkarton, sechs Kreisel in
   den Mulden, darum eine bedruckte Manschette */
VP_FORM.bodenkreisel=t=>{ const o=G(t), {w,h,d,a}=o, PU=0xb9b3a4, ty=h*0.36, mh=h*0.56;
  box(o,w*0.97,ty,d*0.97,0,ty/2,0,PU);
  if(!WARE_SPAR_AN) for(const x of [-0.43,-0.155,0.155,0.43]) for(const z of [-0.4,0,0.4]) zyl(o,0.004,0.011,h*0.3,8,x*w,ty+h*0.15,z*d,PU);
  const cols=[0x5cff9e,0xffd23f,0xe35aa8,0x2f7fd0,0xff7a3d,0x9b3bd6];
  for(let i=0;i<6;i++){ const x=(i%3-1)*w*0.31, z=(i<3?-1:1)*d*0.235, y=ty+0.008;
    zyl(o,0.024,0.024,0.011,14,x,y,z,cols[i]); if(!WARE_SPAR_AN) zyl(o,0.016,0.02,0.006,14,x,y+0.008,z,0xf2f5ff); zyl(o,0.0015,0.0015,0.012,4,x+0.026,y,z,0x2e8b3a,0,0,PI/2); }
  const R=bogen(o,[{n:'f',w,h:mh,f:B(t)},{n:'b',w,h:mh,f:seite(t)},{n:'u',w,h:d,f:flach(a.bg2)}]);
  dr(o,new THREE.PlaneGeometry(w,mh),tm(0,mh/2,d/2),R.f); dr(o,new THREE.PlaneGeometry(w,mh),tm(0,mh/2,-d/2,0,PI,0),R.b); dr(o,new THREE.PlaneGeometry(w,d),tm(0,0.0005,0,PI/2,0,0),R.u);
  return fertig(o); };

/* Party-Popper: Displaykarton mit Ausreissfront - oben der Kopf mit
   Namen, unten offen, die Popper stehen in zwei Reihen */
VP_FORM.partypopper=t=>{ const o=G(t), {w,h,d,a}=o;
  const R=bogen(o,[{n:'f',w,h,f:(g,W,H)=>{ g.fillStyle=a.bg1; g.fillRect(0,0,W,H); teil(g,0,0,W,H*0.37,B(t));
      g.save(); g.globalCompositeOperation='destination-out'; g.fillStyle='#000'; g.beginPath(); g.moveTo(W*0.06,H*0.43); const n=14; for(let i=0;i<=n;i++) g.lineTo(W*(0.06+0.88*i/n),H*(0.43+(i%2?0.025:0)));
      g.lineTo(W*0.94,H*0.95); g.lineTo(W*0.06,H*0.95); g.closePath(); g.fill(); g.restore();
      g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=3; g.beginPath(); for(let i=0;i<=14;i++) g.lineTo(W*(0.06+0.88*i/14),H*(0.43+(i%2?0.025:0))); g.stroke(); }},
    {n:'b',w,h,f:seite(t)},{n:'s',w:d,h,f:seite(t)},{n:'t',w,h:d,f:oben(t)}],{alpha:true});
  dr(o,kiste(w,h,d,R),tm(0,h/2,0));
  einsatz(o,-w*0.47,w*0.47,0.004,h*0.6,-d/2+0.002,d/2-0.002,I(a.bg2));
  box(o,w*0.9,0.03,d*0.45,0,0.019,-d*0.22,I(a.bg2));
  const cols=[0xc01c6a,0x1557a8,0xffd23f,0x2f9e57,0xff7a3d];
  for(let k=0;k<2;k++) for(let i=0;i<5;i++){ const x=(i-2)*w*0.17, z=k?d*0.17:-d*0.22, y0=k?0.004:0.034, c=cols[(i+k)%5];
    if(!WARE_SPAR_AN) zyl(o,0.0125,0.0125,0.012,10,x,y0+0.006,z,0xf2f5ff); zyl(o,0.004,0.0125,WARE_SPAR_AN?0.067:0.055,10,x,y0+(WARE_SPAR_AN?0.0335:0.012+0.0275),z,c); zyl(o,0.0045,0.0045,0.006,8,x,y0+0.071,z,GOLD);
    box(o,0.003,0.016,0.0015,x+0.004,y0+0.08,z,0xf2f5ff); }
  return fertig(o); };

/* Niagara: lange Faltschachtel mit Sichtfenster - dahinter haengen die
   Silberfontaenen an ihrer Lunte */
VP_FORM.wasserfall=t=>{ const o=G(t), {w,h,d,a}=o, bh=h*0.97;
  const R=bogen(o,[{n:'f',w,h:bh,f:(g,W,H)=>{ const S=stil(t); g.fillStyle=S.bg; g.fillRect(0,0,W,H); teil(g,0,0,W*0.45,H,(g2,w2,h2)=>drawFront(g2,w2,h2,a,o.cat));
      titel(g,t,W*0.72,H*0.15,W*0.5,H*0.22); g.fillStyle=S.sf; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,a.sub,W*0.5,Math.round(H*0.07),BAR); g.fillText(a.sub,W*0.72,H*0.29);
      loch(g,[{x:W*0.48,y:H*0.35,w:W*0.49,h:H*0.58}]); }},{n:'b',w,h:bh,f:B(t)},{n:'s',w:d,h:bh,f:seite(t)},{n:'t',w,h:d,f:oben(t)}],{alpha:true,max:1500});
  dr(o,kiste(w,bh,d,R),tm(0,bh/2,0));
  const x0=-w/2+w*0.48, x1=-w/2+w*0.97, y0=bh*0.07, y1=bh*0.65;
  einsatz(o,x0-0.003,x1+0.003,y0-0.003,y1+0.003,-d/2+0.003,d/2-0.002,0x10202e);
  const cy=y1-0.025; zyl(o,0.0016,0.0016,x1-x0,4,(x0+x1)/2,cy,0,0xf2f2f2,0,0,PI/2);
  for(let i=0;i<10;i++){ const x=x0+(x1-x0)*(i+0.5)/10, l=0.07+(i%3)*0.01; zyl(o,0.0075,0.0075,l,8,x,cy-l/2-0.004,0,0xc9ccd2); zyl(o,0.0078,0.0078,0.008,8,x,cy-l+0.002,0,0x5ce1ff); zyl(o,0.0012,0.0012,0.012,4,x,cy-0.002,0,0x2e8b3a); }
  fol(o,new THREE.PlaneGeometry(x1-x0,y1-y0),tm((x0+x1)/2,(y0+y1)/2,d/2-0.0015));
  return fertig(o); };

/* Drehsonne: Blisterkarte mit Euroloch, davor eine runde
   Klarsichtkuppel mit dem Feuerrad */
VP_FORM.feuerrad=t=>{ const o=G(t), {w,h,d,a,rnd}=o, kd=0.005, cy=h*0.63;
  const R=bogen(o,[{n:'f',w,h,f:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H);
      if(typeof effektFoto==='function') effektFoto(g,0,H*0.06,W,H*0.6,t,a,zufallAus(hashStr(t+'fr')),{stadt:false,einzeln:true});
      teil(g,0,H*0.66,W,H*0.34,B(t)); g.fillStyle=a.ac2; g.fillRect(0,0,W,H*0.06); euroloch(g,W/2,H*0.03,H*0.04); }},
    {n:'b',w,h,f:seite(t)},{n:'leer',w:0.02,h:0.02,f:flach(a.bg2)}],{alpha:true});
  dr(o,kiste(w,h,kd,R),tm(0,h/2,-d/2+kd/2));
  const Rr=0.11*w/0.44, Rd=Rr*1.32, dz=d-kd-0.003, zc=-d/2+kd;
  fol(o,new THREE.SphereGeometry(Rd,22,8,0,PI*2,0,PI/2),tm(0,cy,zc,PI/2,0,0,1,dz/Rd,1));
  fol(o,new THREE.RingGeometry(Rd,Rd*1.1,22),tm(0,cy,zc+0.0008));
  const wz=zc+dz*0.45; torus(o,Rr,Rr*0.07,0,cy,wz,0x2f3a8c,0,0,0,24);
  for(let i=0;i<8;i++){ const an=i/8*PI*2; zyl(o,Rr*0.075,Rr*0.075,Rr*0.5,8,Math.cos(an)*Rr,cy+Math.sin(an)*Rr,wz,[ROT,0xffd23f,0x2f9e57,0x2f7fd0][i%4],0,0,an); }
  for(let i=0;i<4;i++) box(o,Rr*2,0.004,0.004,0,cy,wz,0x2a2a30,0,0,i*PI/4);
  zyl(o,Rr*0.16,Rr*0.16,Rr*0.3,12,0,cy,wz,0xd9cbb0,PI/2,0,0);
  return fertig(o); };

/* =================== FONTAENEN EINZELN (Zylinder) =================== */
/* Goldgeysir: Weissblech-Golddose mit Stuelpdeckel, Praegeringe */
VP_FORM.goldgeysir=t=>{ const o=G(t), {w,h,d,a}=o, Rr=w/2*0.95, Hb=h*0.84;
  const R=bogen(o,[{n:'m',w:PI*Rr*2,h:Hb,f:zweimal(B(t))},{n:'dk',w:Rr*2,h:Rr*2,f:(g,W,H)=>{ g.fillStyle='#c9a24a'; g.fillRect(0,0,W,H); teil(g,W*0.08,H*0.08,W*0.84,H*0.84,(g2,w2,h2)=>{ g2.beginPath(); g2.arc(w2/2,h2/2,w2/2,0,PI*2); g2.clip(); drawTop(g2,w2,h2,a,o.cat); }); }}],{metal:0.3,rough:0.4});
  mantel(o,Rr,Rr,Hb,0,'m',32);
  zyl(o,Rr,Rr,0.006,28,0,0.003,0,0x8a6a2a);
  for(const y of [0.03,Hb-0.025]) torus(o,Rr*1.005,0.0035,0,y,0,GOLD,PI/2,0,0,28);
  const ly=Hb-0.012, lh=h*0.15; o.vc.push({geo:new THREE.CylinderGeometry(Rr*1.045,Rr*1.045,lh,32,1,true),m:tm(0,ly+lh/2,0),color:0xd9b45a});
  torus(o,Rr*1.045,0.003,0,ly+0.002,0,0xb8892f,PI/2,0,0,28); torus(o,Rr*1.03,0.004,0,ly+lh,0,0xe9c76a,PI/2,0,0,28);
  zyl(o,Rr*1.04,Rr*1.04,0.003,32,0,ly+lh-0.0015,0,0xd9b45a);
  dr(o,new THREE.CircleGeometry(Rr*0.9,32),tm(0,ly+lh+0.0006,0,-PI/2,0,0),R.dk);
  return fertig(o); };

/* Tischbombe: Papptrommel mit Krepppapier-Ruesche oben und unten und
   Zugschnur mit Ring vorn */
VP_FORM.tischbombe=t=>{ const o=G(t), {w,h,d,a,rnd}=o, Rr=w/2*0.86, Hb=h*0.8, y0=h*0.05;
  const R=bogen(o,[{n:'m',w:PI*Rr*2,h:Hb,f:zweimal(B(t))},{n:'dk',w:Rr*2,h:Rr*2,f:(g,W,H)=>{ g.fillStyle=a.ac; g.fillRect(0,0,W,H); if(typeof stern==='function'){ stern(g,W/2,H/2,W*0.36,5,0.48); g.fillStyle='#fff'; g.fill(); } titel(g,t,W/2,H*0.5,W*0.7,H*0.13,a.bg2,null); }}]);
  mantel(o,Rr,Rr,Hb,y0,'m',28);
  dr(o,new THREE.CircleGeometry(Rr,28),tm(0,y0+Hb,0,-PI/2,0,0),R.dk);
  const ruesche=(yy,hh,auf)=>{ const g=new THREE.CylinderGeometry(auf?w/2*0.985:Rr,auf?Rr:w/2*0.985,hh,48,1,true), p=g.attributes.position;
    for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), an=Math.atan2(z,x), r0=Math.hypot(x,z), k=1+0.035*Math.sin(an*24); p.setX(i,Math.cos(an)*r0*k*0.985); p.setZ(i,Math.sin(an)*r0*k*0.985); }
    g.computeVertexNormals(); o.vc.push({geo:g,m:tm(0,yy,0),color:I(a.ac2)}); };
  ruesche(y0+Hb+h*0.055,h*0.11,true); ruesche(y0*0.5+0.002,y0+0.004,false);
  zyl(o,0.0014,0.0014,Rr*0.95,4,0,y0+Hb+0.002,Rr*0.47,0xf2f2f2,PI/2,0,0);
  zyl(o,0.0014,0.0014,Hb*0.3,4,0,y0+Hb*0.85,Rr+0.002,0xf2f2f2);
  torus(o,0.0055,0.0016,0,y0+Hb*0.69,Rr+0.003,ROT,0,0,0,12);
  return fertig(o); };

/* Feuerteufel (06.10., Toms PDF: "Verpackung/Form passt nicht ... die
   Fontaene soll aus zwei Loechern oben nach links und rechts kommen ...
   der Effekt soll aus diesen Loechern rauskommen"): runde Papphuelse mit
   Teufelsdruck, oben eine schwarze Kappe mit zwei schraegen Duesen wie
   Hoerner - eine nach links, eine nach rechts (FT_DUESE, ausserhalb des
   Blocks: 14k hoerner setzt die Funken genau in die Muendungen). Vorbild:
   Doppel- bzw. Zweistrahl-Fontaenen; jede Duese hat ihre eigene
   Lehmpfropf-Oeffnung, die man von vorn als dunkles Loch sieht. */
VP_FORM.feuerteufel=t=>{ const o=G(t), {w,h,d,a}=o, D=FT_DUESE, Rb=d/2*0.96, Hb=D.fussY-0.02;
  const teufel=(g,W,H)=>{ B(t)(g,W,H);
    /* Teufelsgesicht vorn: Hoerner, schraege Augen, Grinsen */
    const cx=W*0.25, cy=H*0.3, r=Math.min(W*0.1,H*0.13);
    g.fillStyle='#c81c0c'; g.beginPath(); g.arc(cx,cy,r,0,PI*2); g.fill();
    for(const s of [-1,1]){ g.beginPath(); g.moveTo(cx+s*r*0.55,cy-r*0.7); g.quadraticCurveTo(cx+s*r*1.25,cy-r*1.1,cx+s*r*1.15,cy-r*1.75); g.quadraticCurveTo(cx+s*r*0.9,cy-r*1.1,cx+s*r*0.2,cy-r*0.9); g.fill();
      g.fillStyle='#ffd23f'; g.beginPath(); g.moveTo(cx+s*r*0.15,cy-r*0.25); g.lineTo(cx+s*r*0.6,cy-r*0.4); g.lineTo(cx+s*r*0.5,cy-r*0.05); g.closePath(); g.fill(); g.fillStyle='#c81c0c'; }
    g.strokeStyle='#ffd23f'; g.lineWidth=Math.max(1,r*0.12); g.beginPath(); g.arc(cx,cy+r*0.1,r*0.55,0.15*PI,0.85*PI); g.stroke(); };
  const R=bogen(o,[{n:'m',w:2*PI*Rb,h:Hb,f:zweimal(teufel)}]);
  mantel(o,Rb,Rb,Hb,0,'m',28);
  zyl(o,Rb*1.01,Rb*1.01,0.004,24,0,0.002,0,0x1d1f24);
  /* Kappe: schwarzer Kunststoff, oben gewoelbt, darauf der Duesenkopf */
  zyl(o,Rb*1.02,Rb*1.02,0.012,24,0,Hb+0.006,0,0x1b1b1e);
  kugel(o,Rb*0.92,0,Hb+0.012,0,0x24221f,1,0.32,1,20,8);
  const sn=Math.sin(D.neig*PI/180), cs=Math.cos(D.neig*PI/180);
  for(const s of [-1,1]){
    /* Duese: rote Pappduese, leicht verjuengt, Fuss im Kopf versenkt */
    const fx=s*D.fussX, fy=D.fussY, mx=fx+s*sn*D.len, my=fy+cs*D.len;
    zyl(o,D.r1,D.r0,D.len+0.008,14,(fx+mx)/2-s*sn*0.004,(fy+my)/2-cs*0.004,0,0xa8180c,0,0,-s*D.neig*PI/180);
    /* zwei schwarze Ringe wie auf einer echten Duese */
    for(const k of [0.35,0.7]){ const rr=D.r0+(D.r1-D.r0)*k+0.0006; zyl(o,rr,rr,0.002,14,fx+s*sn*D.len*k,fy+cs*D.len*k,0,0x141414,0,0,-s*D.neig*PI/180); }
    /* Muendung: dunkles Loch (Lehmpfropf mit Bohrung), senkrecht zur Duesenachse */
    zyl(o,D.r1*0.62,D.r1*0.62,0.0012,12,mx+s*sn*0.0002,my+cs*0.0002,0,0x050505,0,0,-s*D.neig*PI/180); }
  /* Zuendschnur seitlich aus der Kappe */
  zyl(o,0.0014,0.0014,0.04,5,Rb*0.2,Hb+0.03,Rb*0.75,0x2e8b3a,-0.6,0,0);
  return fertig(o); };

/* Feuerkreis: achteckige Schachtel, im Deckel ein rundes Fenster auf
   den Bodenring */
VP_FORM.bodenfeuer=t=>{ const o=G(t), {w,h,d,a}=o, ap=w*0.49, Rc=ap/Math.cos(PI/8), sw=2*ap*Math.tan(PI/8), Hb=h*0.97;
  const R=bogen(o,[{n:'v',w:sw*3,h:Hb,f:B(t)},{n:'s',w:sw,h:Hb,f:seite(t)},{n:'h',w:sw,h:Hb,f:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle=a.ac; g.fillRect(0,H*0.9,W,H*0.1); }},
    {n:'dk',w:Rc*2,h:Rc*2,f:(g,W,H)=>{ drawTop(g,W,H,a,o.cat); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,0,W,H); loch(g,[{x:W/2,y:H/2,r:W*0.3}]); g.strokeStyle=a.ac; g.lineWidth=W*0.02; g.beginPath(); g.arc(W/2,H/2,W*0.33,0,PI*2); g.stroke(); }}],{alpha:true});
  const v=R.v, third=k=>[v[0]+(v[2]-v[0])*k/3,v[1],v[0]+(v[2]-v[0])*(k+1)/3,v[3]];
  prismaY(o,8,Rc,Hb,0,0,(i)=>i===7?third(0):i===0?third(1):i===1?third(2):i===2||i===6?R.s:R.h);
  dr(o,new THREE.CircleGeometry(Rc,8,PI/8),tm(0,Hb,0,-PI/2,0,0),R.dk);
  const fy=Hb*0.55; o.vc.push({geo:umdrehen(new THREE.CylinderGeometry(Rc*0.97,Rc*0.97,Hb-fy,8,1,true,PI/8)),m:tm(0,(Hb+fy)/2,0),color:0x3a2414});
  o.vc.push({geo:new THREE.CylinderGeometry(Rc*0.97,Rc*0.97,0.004,8,1,false,PI/8),m:tm(0,fy,0),color:0x8a6a44});
  torus(o,ap*0.42,0.013,0,fy+0.013,0,0xc05a1a,PI/2,0,0,24);
  for(let i=0;i<8;i++){ const an=i/8*PI*2; zyl(o,0.009,0.009,0.014,8,Math.cos(an)*ap*0.42,fy+0.027,Math.sin(an)*ap*0.42,i%2?ROT:0xffd23f); }
  zyl(o,0.0016,0.0016,0.03,4,ap*0.42,fy+0.02,0.012,0x2e8b3a,PI/2,0,0);
  fol(o,new THREE.CircleGeometry(Rc*0.6,24),tm(0,Hb-0.002,0,-PI/2,0,0));
  return fertig(o); };

/* Zauberbrunnen: konischer Becher, oben eine Klarsichtkuppel ueber der
   goldenen Zuendspitze */
VP_FORM.zauberbrunnen=t=>{ const o=G(t), {w,h,d,a}=o, Rt=w/2*0.96, Rb=w/2*0.76, Hb=h*0.7;
  const R=bogen(o,[{n:'m',w:PI*(Rt+Rb),h:Hb,f:zweimal(B(t))}]);
  mantel(o,Rt,Rb,Hb,0,'m',28);
  zyl(o,Rb,Rb,0.004,24,0,0.002,0,0x1d1f24); torus(o,Rt,0.003,0,Hb,0,0xf2f5ff,PI/2,0,0,28);
  zyl(o,Rt*0.98,Rt*0.98,0.003,24,0,Hb-0.003,0,0xf2f5ff);
  zyl(o,Rt*0.12,Rt*0.42,h*0.13,16,0,Hb+h*0.065,0,GOLD); zyl(o,Rt*0.14,Rt*0.14,h*0.025,12,0,Hb+h*0.14,0,ROT); zyl(o,0.0015,0.0015,h*0.05,4,0,Hb+h*0.17,0,0x2e8b3a);
  const dh=h-Hb-0.003; fol(o,new THREE.SphereGeometry(Rt*0.99,24,8,0,PI*2,0,PI/2),tm(0,Hb,0,0,0,0,1,dh/(Rt*0.99),1));
  return fertig(o); };

/* Feuerberg: Vulkankegel - bedruckter Kegel auf einem Lavasockel,
   oben der Krater mit Lava und Zuendkappe */
VP_FORM.feuerberg=t=>{ const o=G(t), {w,h,d,a,rnd}=o, Rb=w/2*0.95, Rt=Rb*0.34, y0=h*0.045, Hc=h*0.8;
  const R=bogen(o,[{n:'m',w:PI*(Rb+Rt),h:Hc,f:zweimal(B(t))}]);
  mantel(o,Rt,Rb,Hc,y0,'m',28);
  const sg=new THREE.CylinderGeometry(Rb*1.0,Rb*1.04,y0+0.006,16), p=sg.attributes.position;
  for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), r0=Math.hypot(x,z); if(r0>0.001){ const k=1-rnd()*0.05; p.setX(i,x*k); p.setZ(i,z*k); } }
  sg.computeVertexNormals(); o.vc.push({geo:sg,m:tm(0,(y0+0.006)/2,0),color:0x2a1a14});
  const ty=y0+Hc; torus(o,Rt*0.92,0.008,0,ty,0,0x3a1a10,PI/2,0,0,18); zyl(o,Rt*0.88,Rt*0.88,0.004,18,0,ty+0.002,0,0xff6a1a);
  for(const an of [2.3,-2.3,3.1,1.7,-1.7]){ const yy=ty-Hc*(0.06+rnd()*0.12), rr=Rt+(Rb-Rt)*((ty-yy)/Hc)+0.002, sl=Math.atan2(Rb-Rt,Hc);
    kugel(o,0.007,Math.sin(an)*rr,yy,Math.cos(an)*rr,0xff7a1c,1,2.6,0.8,6,5); }
  zyl(o,0.008,0.012,h*0.035,10,0,ty+h*0.02,0,0xb01a0a); zyl(o,0.0015,0.0015,h*0.07,4,0,ty+h*0.05,0,0x2e8b3a);
  return fertig(o); };

/* Wendeltreppe: spiralgewickelte Pappwickelhuelse mit Etikett und
   eisblauer Kappe mit Kristall */
VP_FORM.eisblume=t=>{ const o=G(t), {w,h,d,a}=o, Rr=w/2*0.92, Hb=h*0.84, y0=0.006;
  const R=bogen(o,[{n:'m',w:PI*Rr*2,h:Hb,f:(g,W,H)=>{ g.fillStyle='#b7c3cc'; g.fillRect(0,0,W,H);
      g.strokeStyle='rgba(60,80,95,.45)'; g.lineWidth=Math.max(2,W*0.004); for(let x=-H;x<W+H;x+=W/7){ g.beginPath(); g.moveTo(x,H); g.lineTo(x+H*0.9,0); g.stroke(); }
      for(let k=0;k<2;k++){ const x0=k*W/2+W*0.07, lw=W*0.36; teil(g,x0,H*0.05,lw,H*0.9,B(t)); rahmen(g,x0,H*0.05,lw,H*0.9,'#f2f5ff',3); } }},
    {n:'dk',w:Rr*1.8,h:Rr*1.8,f:(g,W,H)=>{ g.fillStyle='#9ff0ff'; g.fillRect(0,0,W,H); g.strokeStyle='#2f7fd0'; g.lineWidth=W*0.02; g.beginPath(); for(let k=0;k<=80;k++){ const an=k*0.32, r=W*0.05+k*W*0.0045; g.lineTo(W/2+Math.cos(an)*r,H/2+Math.sin(an)*r); } g.stroke();
      nameText(g,a.title,W/2,H*0.82,W*0.6,Math.round(H*0.1),FNT.bun,'#14306a'); }}]);
  mantel(o,Rr,Rr,Hb,y0,'m',28);
  zyl(o,Rr*1.02,Rr*1.02,0.012,28,0,0.006,0,0xa9b2ba); torus(o,Rr*1.01,0.003,0,y0+Hb,0,0xa9b2ba,PI/2,0,0,28);
  const ch=h*0.1; zyl(o,Rr*1.05,Rr*1.05,ch,28,0,y0+Hb+ch/2-0.004,0,I(a.ac2)); o.vc.push({geo:new THREE.CylinderGeometry(Rr*0.9,Rr*1.0,0.006,28,1,true),m:tm(0,y0+Hb+ch-0.001,0),color:0x9ff0ff}); dr(o,new THREE.CircleGeometry(Rr*0.9,28),tm(0,y0+Hb+ch+0.0028,0,-PI/2,0,0),R.dk);
  for(let i=0;i<3;i++){ box(o,Rr*1.1,0.004,0.006,0,y0+Hb+ch+0.002,0,0xf2f5ff,0,i*PI/3,0); }
  kugel(o,0.008,0,y0+Hb+ch+0.004,0,0xf2f5ff,1,0.6,1);
  return fertig(o); };

/* Schlangenregen: Schraubglas mit rosa Deckel, drin bunte
   Luftschlangenrollen und Konfetti, vorn das Etikett */
VP_FORM.luftschlangentisch=t=>{ const o=G(t), {w,h,d,a,rnd}=o, Rr=w/2*0.94, Hj=h*0.74;
  const R=bogen(o,[{n:'e',w:Rr*PI*0.8,h:Hj*0.6,f:B(t)},{n:'dk',w:Rr*1.6,h:Rr*1.6,f:oben(t)}]);
  glas(o,new THREE.CylinderGeometry(Rr,Rr,Hj,24),tm(0,Hj/2,0)); glas(o,new THREE.CylinderGeometry(Rr*0.8,Rr,h*0.07,24,1,true),tm(0,Hj+h*0.035,0));
  dr(o,new THREE.CylinderGeometry(Rr*1.004,Rr*1.004,Hj*0.6,24,1,true,-0.4*PI,0.8*PI),tm(0,Hj*0.45,0),R.e);
  const cy=Hj+h*0.07, ch=h-cy; zyl(o,Rr*0.84,Rr*0.84,ch*0.98,24,0,cy+ch*0.49,0,I(a.ac));
  for(let i=0;i<12;i++){ const an=i/12*PI*2; box(o,0.003,ch*0.8,0.002,Math.cos(an)*Rr*0.845,cy+ch*0.45,Math.sin(an)*Rr*0.845,I(a.ac),0,-an,0); }
  dr(o,new THREE.CircleGeometry(Rr*0.8,24),tm(0,h-0.0005,0,-PI/2,0,0),R.dk);
  const cols=[0xff4fa3,0xffe45c,0x5ce1ff,0x7dff8a,0xff7a3d,0xc78bff];
  for(let i=0;i<13;i++){ const an=rnd()*PI*2, rr=rnd()*Rr*0.55, y=0.012+rnd()*(Hj*0.95-0.024);
    o.vc.push({geo:new THREE.TorusGeometry(0.011,0.0035,4,10),m:tm(Math.cos(an)*rr,y,Math.sin(an)*rr,rnd()*3,rnd()*3,0),color:cols[i%cols.length]}); }
  for(let i=0;i<30;i++) box(o,0.004,0.004,0.0006,(rnd()-0.5)*Rr*1.4,0.004+rnd()*Hj*0.9,(rnd()-0.5)*Rr*1.4,cols[i%cols.length],rnd()*3,rnd()*3,0);
  return fertig(o); };

/* =================== ROEMISCHE LICHTER =================== */
/* Bedrucktes Rohr eines Roemischen Lichts (Rundum-Etikett, zwei Haelften:
   vorn u 0,25, hinten u 0,75): Nachthimmel mit aufsteigender Kugelkette
   in der Rohrfarbe, Name hochkant, Farbschild, Warnfeld, Kaliber */
function rlEtikett(g,W,H,t,c,farbe,i){ const a=P[t].art, rnd=zufallAus(hashStr(t+'rl'+i)), info=produktInfo(t);
  const halb=(g,W,H,hinten)=>{
    /* farbiges Papier mit feinen Schraegstreifen */
    const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,heller(c,0.2)); gr.addColorStop(1,WZ.dunkel(c,0.3)); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(255,255,255,.1)'; g.lineWidth=Math.max(1,W*0.03); for(let y=-W;y<H;y+=W*0.16){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y+W*0.5); g.stroke(); }
    /* Effektfoto im Fenster: aufsteigende Kugelkette */
    const fx=W*0.1, fy=H*0.07, fw=W*0.8, fh=H*0.5;
    g.save(); WZ.rr(g,fx,fy,fw,fh,W*0.08); g.clip();
    const ng=g.createLinearGradient(0,fy,0,fy+fh); ng.addColorStop(0,'#03040c'); ng.addColorStop(0.75,'#0d0b22'); ng.addColorStop(1,WZ.dunkel(c,0.6)); g.fillStyle=ng; g.fillRect(fx,fy,fw,fh);
    g.fillStyle='rgba(255,255,255,.6)'; for(let k=0;k<fw*fh/450;k++) g.fillRect(fx+rnd()*fw,fy+rnd()*fh*0.7,1,1);
    g.globalCompositeOperation='lighter';
    const cx=fx+fw*(hinten?0.4:0.55), y0=fy+fh*0.97, y1=fy+fh*0.1;
    for(let k=0;k<6;k++){ const q=k/5, y=y0-(y0-y1)*q, x=cx+Math.sin(k*1.9+i)*fw*0.14, r=fw*(0.03+q*0.055);
      const sp=g.createLinearGradient(x,y,x,y+fh*0.16); sp.addColorStop(0,rgba(c,0.9)); sp.addColorStop(1,rgba(c,0)); g.strokeStyle=sp; g.lineWidth=Math.max(1,r*0.8); g.beginPath(); g.moveTo(x,y); g.lineTo(x-Math.sin(k*1.9+i)*fw*0.04,y+fh*0.16); g.stroke();
      const hof=g.createRadialGradient(x,y,0,x,y,r*3.2); hof.addColorStop(0,rgba(c,0.6)); hof.addColorStop(1,rgba(c,0)); g.fillStyle=hof; g.fillRect(x-r*3.2,y-r*3.2,r*6.4,r*6.4);
      g.fillStyle=heller(c,0.7); g.beginPath(); g.arc(x,y,r,0,PI*2); g.fill(); }
    for(let k=0;k<50;k++){ g.fillStyle=k%2?'rgba(255,230,160,.85)':rgba(c,0.85); g.fillRect(cx+(rnd()-0.5)*fw*0.5,y0-rnd()*fh*0.08,1.5,1.5); }
    g.restore(); g.strokeStyle='#fff'; g.lineWidth=Math.max(1.5,W*0.025); WZ.rr(g,fx,fy,fw,fh,W*0.08); g.stroke();
    /* Name, Farbschild, Daten */
    nameText(g,a.title,W/2,H*0.635,W*0.86,Math.round(H*0.06),FNT.bun,'#ffffff','rgba(0,0,0,.85)',Math.max(2,W*0.035));
    const by=H*0.68; g.fillStyle='#ffffff'; WZ.rr(g,W*0.14,by,W*0.72,H*0.06,W*0.06); g.fill();
    nameText(g,farbe,W/2,by+H*0.031,W*0.62,Math.round(H*0.045),FNT.bar,WZ.dunkel(c,0.15));
    nameText(g,hinten?'KALIBER '+info.kal+' mm':'RÖMISCHES LICHT',W/2,H*0.78,W*0.88,Math.round(H*0.028),FNT.bar,'#ffffff','rgba(0,0,0,.5)',2);
    /* Warnstreifen und Piktogramme */
    g.save(); g.beginPath(); g.rect(0,H*0.83,W,H*0.025); g.clip(); g.fillStyle='#ffd23f'; g.fillRect(0,H*0.83,W,H*0.025); g.fillStyle='#14151c'; for(let x=-H*0.05;x<W;x+=H*0.03){ g.beginPath(); g.moveTo(x,H*0.855); g.lineTo(x+H*0.015,H*0.855); g.lineTo(x+H*0.04,H*0.83); g.lineTo(x+H*0.025,H*0.83); g.fill(); } g.restore();
    for(let k=0;k<3;k++){ const px=W*(0.25+k*0.25), py=H*0.9, pr=W*0.09; g.fillStyle='#fff'; g.beginPath(); g.arc(px,py,pr,0,PI*2); g.fill(); g.strokeStyle='#c8322a'; g.lineWidth=Math.max(1,pr*0.25); g.stroke();
      g.fillStyle='#1b1b1b'; g.textAlign='center'; g.textBaseline='middle'; g.font=`700 ${Math.max(5,Math.round(pr*0.9))}px Arial`; g.fillText(['8m','F2','18+'][k],px,py); }
  };
  teil(g,0,0,W/2,H,(g2,w2,h2)=>halb(g2,w2,h2,false)); teil(g,W/2,0,W/2,H,(g2,w2,h2)=>halb(g2,w2,h2,true));
  /* hintere Naht: schmales Warnfeld mit Strichcode */
  const x0=W*0.97, sw=W*0.06; g.fillStyle='#f4f1ea'; g.fillRect(x0-sw/2,H*0.3,sw,H*0.45); g.fillRect(-sw/2,H*0.3,sw,H*0.45);
  g.fillStyle='#14151c'; for(let y=H*0.32;y<H*0.72;y+=3){ const bh=1+(hashStr(t+i+y)%3); g.fillRect(x0-sw*0.4,y,sw*0.8,bh); y+=bh; }
  /* Ringe oben und unten */
  g.fillStyle=WZ.dunkel(c,0.45); g.fillRect(0,0,W,H*0.03); g.fillRect(0,H*0.975,W,H*0.025);
  g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(0,H*0.03,W,Math.max(1,H*0.004)); }
/* Farbkanon (03.10., Tom: "nur drei Farben, das gefaellt mir gar nicht"):
   fuenf bedruckte Rohre im Fuenfeck - jedes mit Rundum-Etikett in seiner
   Sternfarbe, farbiger Kunststoffkappe und Zuendschnur; unten eine
   Papierbanderole mit dem Druckbild, alles in Schrumpffolie, oben zur
   Naht gerafft. Kein Rohr gleicht dem anderen. */
VP_FORM.roemisch=t=>{ const o=G(t), {w,h,d,a}=o, r=Math.min(w,d)/2*0.965/2.7, Rc=r*1.7, zv=r*0.162;
  const F=[['#e8322a','ROT'],['#2f7fd0','BLAU'],['#ffc93a','GOLD'],['#2fbf5a','GRÜN'],['#a04be0','VIOLETT']];
  const fb=0.006, HH=h*0.86, ch=h*0.045, ky=fb+HH;
  /* Huelle um die fuenf Rohre (konvexe Huelle der Kreise), u ab hinten Mitte */
  const C=[0,1,2,3,4].map(i=>{ const al=PI*(36+i*72)/180; return [Math.sin(al)*Rc,Math.cos(al)*Rc+zv]; });
  const huelle=(rr)=>{ const pts=[]; for(let k=0;k<36;k++){ const ph=PI+k/36*PI*2, nx=Math.sin(ph), nz=Math.cos(ph); let b=-1e9, q=null; C.forEach(c=>{ const v=c[0]*nx+c[1]*nz; if(v>b){ b=v; q=c; } }); pts.push([q[0]+nx*rr,q[1]+nz*rr]); } return pts; };
  const ring=(pts,y0,y1,reg)=>{ const n=pts.length, L=[0]; for(let i=1;i<=n;i++){ const p=pts[i-1], q=pts[i%n]; L.push(L[i-1]+Math.hypot(q[0]-p[0],q[1]-p[1])); }
    const pos=[],uv=[],idx=[]; for(let i=0;i<=n;i++){ const p=pts[i%n], u=L[i]/L[n]; pos.push(p[0],y0,p[1],p[0],y1,p[1]); uv.push(u,0,u,1); }
    for(let i=0;i<n;i++){ const b=2*i; idx.push(b,b+2,b+3,b,b+3,b+1); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return {g,L:L[n]}; };
  const bh=h*0.19, bp=huelle(r*1.012), umf=ring(bp,0,1).L;
  const teile=F.map(([c,nm],i)=>({n:'r'+i,w:PI*2*r,h:HH,f:(g,W,H)=>rlEtikett(g,W,H,t,c,nm,i)}));
  teile.push({n:'bd',w:umf,h:bh,f:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); teil(g,W/4,0,W/2,H,B(t)); teil(g,-W/4,0,W/2,H,seite(t)); teil(g,W*0.75,0,W/2,H,seite(t));
    g.fillStyle=a.ac2; g.fillRect(0,0,W,H*0.05); g.fillRect(0,H*0.95,W,H*0.05); }});
  const R=bogen(o,teile,{max:1100});
  /* Dreiecke sparsam (Handy): je Rohr 12 Seiten, Kappe ein Stueck, keine Bodenplatte */
  C.forEach(([x,z],i)=>{ const c=I(F[i][0]), al=PI*(36+i*72)/180;
    /* Etikett so drehen, dass die Vorderhaelfte nach aussen zeigt */
    dr(o,new THREE.CylinderGeometry(r,r,HH,12,1,true,-PI/2),tm(x,fb+HH/2,z,0,al,0),R['r'+i]);
    /* Kappe: Kragen mit abgeschraegtem Deckel */
    zyl(o,r*0.9,r*1.06,ch,12,x,ky+ch*0.45,z,c);
    /* Zuendschnur mit Papierlasche, nach aussen gebogen */
    const ox=Math.sin(al), oz=Math.cos(al), lx=x+ox*r*0.55, lz=z+oz*r*0.55;
    o.vc.push({geo:new THREE.CylinderGeometry(0.0013,0.0013,h*0.05,3,1,true),m:tm(lx,ky+ch*1.05+h*0.022,lz,oz*0.35,0,-ox*0.35),color:0x2e8b3a});
    box(o,0.006,0.004,0.006,lx+ox*0.006,ky+ch*1.05+h*0.046,lz+oz*0.006,0xd8352a); });
  /* Banderole unten */
  const B0=ring(bp,h*0.06,h*0.06+bh); dr(o,B0.g,tm(0,0,0),R.bd);
  /* Schrumpffolie: Huelle, oben gerafft */
  const fp=huelle(r*1.03), F0=ring(fp,0.002,ky+ch*0.7); fol(o,F0.g,tm(0,0,0));
  const sp=new THREE.Shape(fp.map(p=>new THREE.Vector2(p[0],-p[1]))), dg=new THREE.ShapeGeometry(sp); dg.rotateX(-PI/2);
  fol(o,dg,tm(0,ky+ch*0.7,0)); 
  return fertig(o); };

/* Feuerperlen: ein dickes Einzelrohr auf schwarzem Standfuss, oben eine
   gerippte Schutzkappe mit Siegelstreifen */
VP_FORM.feuerperlen=t=>{ const o=G(t), {w,h,d,a}=o, Rr=w*0.33, fh=0.014, Hb=h*0.83;
  const R=bogen(o,[{n:'m',w:PI*Rr*2,h:Hb,f:zweimal(B(t))}]);
  box(o,w*0.97,fh,0.026,0,fh/2,0,DUNKEL); box(o,0.026,fh,d*0.97,0,fh/2,0,DUNKEL); zyl(o,Rr*1.15,Rr*1.2,fh*1.2,20,0,fh*0.6,0,0x2a2c33);
  mantel(o,Rr,Rr,Hb,fh,'m',24);
  const cy=fh+Hb-0.01, ch=h-cy-0.012;
  zyl(o,Rr*1.06,Rr*1.06,ch,24,0,cy+ch/2,0,ROT); for(let i=0;i<16;i++){ const an=i/16*PI*2; box(o,0.003,ch*0.85,0.003,Math.cos(an)*Rr*1.065,cy+ch/2,Math.sin(an)*Rr*1.065,0xa8180f,0,-an,0); }
  zyl(o,Rr*0.45,Rr*0.6,0.012,16,0,h-0.006,0,0xa8180f);
  box(o,0.014,0.002,Rr*2.16,0,cy+ch+0.001,0,0xf2f2f2); box(o,0.014,ch*0.6,0.002,0,cy+ch*0.7,Rr*1.075,0xf2f2f2);
  return fertig(o); };

/* Lichterkette: Vierkantsaeule mit einer Reihe Bullaugen, dahinter die
   Glitzerkugeln */
VP_FORM.lichterkugeln=t=>{ const o=G(t), {w,h,d,a}=o, bw=w*0.92;
  const holes=W=>[0,1,2,3,4].map(i=>({x:W*0.83,y:0,r:W*0.105}));
  const R=bogen(o,[{n:'f',w:bw,h,f:(g,W,H)=>{ bild(g,W*0.7,H,t); g.fillStyle=a.bg2; g.fillRect(W*0.7,0,W*0.3,H); g.fillStyle=a.ac; g.fillRect(W*0.7,0,W*0.012,H);
      loch(g,[0,1,2,3,4].map(i=>({x:W*0.85,y:H*(0.52+i*0.095),r:W*0.1})),'#ffd23f'); }},
    {n:'b',w:bw,h,f:B(t)},{n:'s',w:bw,h,f:seite(t)},{n:'t',w:bw,h:bw,f:oben(t)}],{alpha:true});
  dr(o,kiste(bw,h,bw,R),tm(0,h/2,0));
  const x=-bw/2+bw*0.85, cols=[0xffd23f,0xff4fa3,0x5ce1ff,0xffd23f,0xff4fa3];
  einsatz(o,x-bw*0.12,x+bw*0.12,h*0.03,h*0.47,-bw*0.1,bw/2-0.002,0x0a1530);
  for(let i=0;i<5;i++) kugel(o,bw*0.085,x,h*(1-0.52-i*0.095),bw*0.28,cols[i],1,1,1,10,8);
  return fertig(o); };

/* Goldene Zwillinge: zwei Rohre nebeneinander, von einer goldenen
   Banderole in Achterform zusammengehalten, goldene Kappen */
VP_FORM.goldregen22=t=>{ const o=G(t), {w,h,d,a}=o, Rr=w*0.243, cx=Rr*1.02, Hb=h*0.86, bh=h*0.24;
  const R=bogen(o,[{n:'m',w:PI*Rr*2,h:Hb,f:zweimal((g,W,H)=>{ g.fillStyle='#0b0a09'; g.fillRect(0,0,W,H); const gold=g.createLinearGradient(0,0,W,0); gold.addColorStop(0,'#8a6a2a'); gold.addColorStop(0.5,'#f3d98b'); gold.addColorStop(1,'#8a6a2a');
      g.fillStyle=gold; for(let i=0;i<9;i++) g.fillRect(0,H*(0.05+i*0.11),W,H*0.012); g.save(); g.translate(W/2,H*0.36); g.rotate(-PI/2); nameText(g,'ZWILLINGE',0,0,H*0.5,Math.round(W*0.24),FNT.cin,gold); g.restore(); })},
    {n:'f',w:4*Rr,h:bh,f:B(t)},{n:'b',w:4*Rr,h:bh,f:seite(t)},{n:'r',w:PI*Rr,h:bh,f:flach('#0b0a09')}]);
  for(const s of [-1,1]){ mantel(o,Rr,Rr,Hb,0,'m',22,s*cx,0); zyl(o,Rr*1.03,Rr*1.03,0.004,22,s*cx,0.002,0,0x111111);
    zyl(o,Rr*1.04,Rr*1.04,h*0.08,22,s*cx,Hb+h*0.035,0,GOLD); zyl(o,Rr*0.3,Rr*0.3,h*0.03,10,s*cx,Hb+h*0.09,0,0xe9c76a); zyl(o,0.0015,0.0015,h*0.04,4,s*cx,Hb+h*0.11,0,0x2e8b3a); }
  const by=Hb*0.8, br=Rr+0.0025;
  dr(o,new THREE.PlaneGeometry(2*cx,bh),tm(0,by,br),R.f); dr(o,new THREE.PlaneGeometry(2*cx,bh),tm(0,by,-br,0,PI,0),R.b);
  for(const s of [-1,1]) dr(o,new THREE.CylinderGeometry(br,br,bh,14,1,true,s>0?0:PI,PI),tm(s*cx,by,0),R.r);
  return fertig(o); };

/* =================== FONTAENEN-SETS =================== */
/* Feuerquelle: Henkelkorb aus Karton - drei Faecher, die Stirnwaende
   tragen einen Griffsteg mit Griffloch */
VP_FORM.fontaene=t=>{ const o=G(t), {w,h,d,a}=o, hw=h*0.44, th=0.003, gs=h*0.17;
  const R=bogen(o,[{n:'f',w,h:hw,f:B(t)},{n:'b',w,h:hw,f:seite(t)},{n:'in',w:0.05,h:0.05,f:(g,W,H)=>kraft(g,W,H,o.rnd,'#c9a676')},
    {n:'e',w:d,h,f:(g,W,H)=>{ drawSide(g,W,H,a); }},{n:'g',w,h:gs,f:(g,W,H)=>{ g.fillStyle=a.bg1; g.fillRect(0,0,W,H); titel(g,t,W*0.22,H*0.52,W*0.36,H*0.6,a.ac); titel(g,t,W*0.78,H*0.52,W*0.36,H*0.6,a.ac);
      g.save(); g.globalCompositeOperation='destination-out'; g.fillStyle='#000'; g.beginPath(); g.ellipse(W/2,H*0.5,W*0.11,H*0.24,0,0,PI*2); g.fill(); g.restore(); }}],{alpha:true});
  dr(o,kiste(w,hw,th,{f:R.f,b:R.in,leer:R.in}),tm(0,hw/2,d/2-th/2)); dr(o,kiste(w,hw,th,{f:R.in,b:R.b,leer:R.in}),tm(0,hw/2,-d/2+th/2));
  for(const s of [-1,1]) dr(o,kiste(th,h,d-2*th,{r:R.e,l:R.e,leer:R.in}),tm(s*(w/2-th/2),h/2,0));
  dr(o,kiste(w-2*th,gs,th,{f:R.g,b:R.g,leer:R.in}),tm(0,h-gs/2,0));
  box(o,w,0.003,d,0,0.0015,0,0xb48a58); for(const s of [-1,1]) box(o,0.002,hw*0.9,d-2*th,s*w/6,hw*0.45,0,0xb48a58);
  const cols=[I(a.ac2),I(a.ac),0x5ce1ff], Rk=Math.min(w/6,d/2)*0.78;
  for(let i=0;i<3;i++) kegel(o,(i-1)*w/3,0,0.003,Rk,h*0.66,cols[i]);
  return fertig(o); };

/* Perlenquartett (03.10.: vorher Gummibaerchen-Tuete - passte nach der
   Umbenennung nicht mehr): stehende Blisterkarte wie eine Perlenkette -
   auf samtdunklem Grund laeuft eine Perlenschnur durch vier
   Klarsichtkuppeln, in jeder steht eine Perlenfontaene mit bedrucktem
   Mantel und perlmuttfarbener Kappe. Oben der Name. */
VP_FORM.leuchtfontaene=t=>{ const o=G(t), {w,h,d,a,rnd}=o, kd=0.004, zc=-d/2+kd, Rb=Math.min((d-kd-0.006)/2.8,w/11), Hf=h*0.5, xs=[-0.33,-0.11,0.11,0.33].map(f=>f*w);
  /* 04.10.: Farben wie der Effekt (Silberfontaenen mit roten und gruenen
     Perlen, 14k) und wie die Unterzeile "Rot und Gruen" - vorher Rosa,
     Eisblau, Gold, Flieder; Karte im Gruen des Produkts statt Violett */
  const P4=[['#ff4a3a','ROT'],['#3dff7a','GRÜN'],['#ff4a3a','ROT'],['#3dff7a','GRÜN']];
  const karte=(g,W,H,hinten)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,a.bg1||'#1f5d2a'); gr.addColorStop(1,a.bg2||'#06200c'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,255,255,.05)'; for(let k=0;k<W*H/60;k++) g.fillRect(rnd()*W,rnd()*H,1.5,1.5);
    if(hinten){ titel(g,t,W/2,H*0.4,W*0.8,H*0.3,a.ac); nameText(g,'4 Perlenfontänen · F1 · Kinder ab 12',W/2,H*0.7,W*0.8,Math.round(H*0.09),FNT.bar,'#fff'); return; }
    /* Perlenschnur in Bogen von Kuppel zu Kuppel */
    const pts=xs.map(x=>[W*(0.5+x/w),H*0.66]); g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=1;
    for(let s=-1;s<pts.length;s++){ const p0=s<0?[0,H*0.5]:pts[s], p1=s+1<pts.length?pts[s+1]:[W,H*0.5], mx=(p0[0]+p1[0])/2, my=Math.max(p0[1],p1[1])+H*0.18;
      for(let k=0;k<=14;k++){ const u=k/14, x=(1-u)*(1-u)*p0[0]+2*u*(1-u)*mx+u*u*p1[0], y=(1-u)*(1-u)*p0[1]+2*u*(1-u)*my+u*u*p1[1]; WZ.kugel(g,x,y,Math.max(1.5,H*0.022),'#f4ecf6','#ffffff'); } }
    /* Kopf: Name und Unterzeile */
    titel(g,t,W/2,H*0.13,W*0.7,H*0.2,a.ac,'rgba(0,0,0,.8)');
    nameText(g,a.sub||'4 Perlenfontänen',W/2,H*0.29,W*0.6,Math.round(H*0.08),FNT.bar,'#f4ecf6');
    pts.forEach(([x,y],k)=>{ g.fillStyle=P4[k][0]; WZ.rr(g,x-W*0.05,H*0.9,W*0.1,H*0.07,H*0.03); g.fill(); nameText(g,P4[k][1],x,H*0.935,W*0.09,Math.round(H*0.05),FNT.bar,'#1b1b1b'); });
    g.fillStyle='#fff'; g.beginPath(); g.arc(W*0.965,H*0.1,H*0.07,0,PI*2); g.fill(); nameText(g,'F1',W*0.965,H*0.105,H*0.12,Math.round(H*0.08),FNT.bun,a.bg2||'#06200c'); };
  const mantelDruck=(c,k)=>(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#0a1a10'); gr.addColorStop(1,WZ.dunkel(c,0.4)); g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let q=0;q<26;q++){ WZ.kugel(g,rnd()*W,rnd()*H*0.85,Math.max(1.2,W*0.02),c,'#ffffff'); }
    g.fillStyle=c; g.fillRect(0,H*0.82,W,H*0.18); for(const cx of [W*0.25,W*0.75]) nameText(g,'PERLE',cx,H*0.91,W*0.4,Math.round(H*0.12),FNT.bar,'#1b1b1b'); };
  const R=bogen(o,[{n:'k',w,h,f:(g,W,H)=>karte(g,W,H,false)},{n:'kb',w,h,f:(g,W,H)=>karte(g,W,H,true)},{n:'rd',w:0.02,h:0.02,f:flach(a.bg2||'#06200c')},
    ...P4.map((c,k)=>({n:'m'+k,w:PI*2*Rb,h:Hf,f:mantelDruck(c[0],k)}))]);
  dr(o,kiste(w,h,kd,{f:R.k,b:R.kb,leer:R.rd}),tm(0,h/2,-d/2+kd/2));
  xs.forEach((x,k)=>{ const c=I(P4[k][0]), y0=0.004, z=zc+Rb*1.4+0.001;
    /* Standfuss, bedruckter Kegelmantel, Kragen, Perlmuttkappe */
    dr(o,new THREE.CylinderGeometry(Rb*0.55,Rb,Hf,12,1,true,-PI/2),tm(x,y0+Hf/2,z),R['m'+k]);
    zyl(o,Rb*0.6,Rb*0.55,Hf*0.08,10,x,y0+Hf+Hf*0.04,z,0xf4f0e6);
    kugel(o,Rb*0.5,x,y0+Hf*1.08+Rb*0.38,z,hexMix(P4[k][0],0.55),1,0.8,1,8,5);
    o.vc.push({geo:new THREE.CylinderGeometry(0.0012,0.0012,Hf*0.12,3,1,true),m:tm(x,y0+Hf*1.08+Rb*0.85,z),color:0x2e8b3a});
    /* Klarsichtkuppel */
    fol(o,new THREE.CylinderGeometry(Rb*1.3,Rb*1.4,Hf*1.25,10,1,true),tm(x,Hf*0.62,z));
    fol(o,new THREE.SphereGeometry(Rb*1.3,10,3,0,PI*2,0,PI/2),tm(x,Hf*1.245,z,0,0,0,1,0.5,1)); });
  return fertig(o); };

/* Dreiklang: Dreierpack - die drei Fontaenen in Schrumpffolie auf einer
   bedruckten Pappmanschette */
VP_FORM.dreiklang=t=>{ const o=G(t), {w,h,d,a}=o, hm=h*0.34, th=0.003;
  const R=bogen(o,[{n:'f',w,h:hm,f:B(t)},{n:'b',w,h:hm,f:seite(t)},{n:'s',w:d,h:hm,f:seite(t)},{n:'in',w:0.05,h:0.05,f:flach(a.bg2)},
    ...[['#2f7fd0','LINKS · BLAU'],[a.ac2,'MITTE · KREUZ'],[a.ac,'RECHTS · GOLD']].map(([c,nm],i)=>({n:'k'+i,w:PI*2*Math.min(d*0.44,w*0.13),h:h*0.76,f:kegelEtikett(t,c,nm,i)}))]);
  dr(o,kiste(w,hm,th,{f:R.f,b:R.in,leer:R.in}),tm(0,hm/2,d/2-th/2)); dr(o,kiste(w,hm,th,{f:R.in,b:R.b,leer:R.in}),tm(0,hm/2,-d/2+th/2));
  for(const s of [-1,1]) dr(o,kiste(th,hm*0.7,d,{r:R.s,l:R.s,leer:R.in}),tm(s*(w/2-th/2),hm*0.35,0));
  box(o,w-0.002,th,d-0.002,0,th/2,0,I(a.bg2));
  const Rk=Math.min(d*0.44,w*0.13), cols=[0x2f7fd0,I(a.ac2),I(a.ac)];
  for(let i=0;i<3;i++){ const x=(i-1)*w*0.31; kegelD(o,x,0,th,Rk,h*0.93,R['k'+i],{seg:16}); torus(o,Rk*0.7,0.003,x,h*0.36,0,0xf2f5ff,PI/2,0,0,16); }
  fol(o,new THREE.BoxGeometry(w*0.995,h*0.985,d*0.995,1,1,1),tm(0,h*0.4925,0));
  return fertig(o); };

/* Wasserorgel: Stufendisplay - die vier Fontaenen stehen wie
   Orgelpfeifen auf Stufen, Rueckwand bedruckt, Folienhaube davor */
VP_FORM.wasserspiel=t=>{ const o=G(t), {w,h,d,a}=o, hb=h*0.3, kd=0.004;
  const KF=[['#5ce1ff','1 · SOPRAN'],['#c9d6e8','2 · ALT'],['#2f7fd0','3 · TENOR'],['#39c4d8','4 · BASS']];
  const R=bogen(o,[{n:'f',w,h:hb,f:B(t)},{n:'s',w:d,h:hb,f:seite(t)},{n:'t',w,h:d,f:flach(a.bg2)},
    ...KF.map(([c,nm],i)=>({n:'k'+i,w:PI*2*0.034,h:(h-hb)*0.8,f:kegelEtikett(t,c,nm,i)})),
    {n:'rw',w,h:h-hb,f:(g,W,H)=>{ if(typeof effektFoto==='function') effektFoto(g,0,0,W,H,t,a,zufallAus(hashStr(t+'rw')),{stadt:true}); else { g.fillStyle=a.bg2; g.fillRect(0,0,W,H); }
      titel(g,t,W*0.5,H*0.16,W*0.6,H*0.24,a.ac); }}]);
  dr(o,kiste(w,hb,d,{f:R.f,b:R.f,s:R.s,t:R.t}),tm(0,hb/2,0));
  dr(o,kiste(w,h-hb,kd,{f:R.rw,b:R.rw,leer:R.t}),tm(0,hb+(h-hb)/2,-d/2+kd/2));
  const st=[0,0.018,0.036,0.054], cols=[0x5ce1ff,0xf2f5ff,0x2f7fd0,0x39c4d8], Rk=0.034;
  for(let i=0;i<4;i++){ const x=(i-1.5)*w*0.22, y0=hb+st[i]; if(st[i]) box(o,0.09,st[i],d*0.8,x,hb+st[i]/2,0.004,I(a.bg1));
    kegelD(o,x,0.004,y0,Rk,h-y0-0.01-(3-i)*0.004,R['k'+i]); }
  fol(o,new THREE.BoxGeometry(w*0.995,h-hb,d-kd),tm(0,hb+(h-hb)/2,kd/2));
  return fertig(o); };

/* Feuerwand: brauner Wellpapp-Versandkarton mit aufgeklebtem
   Produktetikett, Gefahrgutraute, Klebeband und Grifflöchern */
VP_FORM.feuerwand=t=>{ const o=G(t), {w,h,d,a,rnd}=o;
  const F=s=>`700 ${Math.round(s)}px "Barlow Condensed", Arial, sans-serif`;
  const R=bogen(o,[{n:'f',w,h,f:(g,W,H)=>{ kraft(g,W,H,rnd); teil(g,W*0.03,H*0.08,W*0.55,H*0.84,(g2,w2,h2)=>drawFront(g2,w2,h2,a,o.cat)); rahmen(g,W*0.03,H*0.08,W*0.55,H*0.84,'#fff',3);
      g.fillStyle='#1d1a16'; g.textAlign='left'; g.textBaseline='alphabetic'; g.font=F(H*0.13); g.fillText(a.title,W*0.62,H*0.3); g.font=F(H*0.075); g.fillText('5 FONTÄNEN · FÄCHER',W*0.62,H*0.45); g.fillText('KATEGORIE F2 · 1 STK',W*0.62,H*0.56);
      g.font=F(H*0.06); g.fillStyle='#3a332a'; g.fillText('UN 0336 · 1.4G',W*0.62,H*0.68);
      if(typeof gefahrRaute==='function') gefahrRaute(g,W*0.93,H*0.3,H*0.32,'1.4G');
      g.fillStyle='#1d1a16'; for(const k of [0,1]){ const x=W*(0.885+k*0.05), y=H*0.85; g.beginPath(); g.moveTo(x,y-H*0.14); g.lineTo(x-W*0.012,y-H*0.07); g.lineTo(x+W*0.012,y-H*0.07); g.closePath(); g.fill(); g.fillRect(x-W*0.004,y-H*0.075,W*0.008,H*0.12); } }},
    {n:'b',w,h,f:(g,W,H)=>{ kraft(g,W,H,rnd); g.fillStyle='#1d1a16'; g.textAlign='center'; g.textBaseline='middle'; g.font=F(H*0.22); g.fillText(a.title,W/2,H*0.45); g.font=F(H*0.08); g.fillText('VORSICHT · EXPLOSIVSTOFF · 1.4G',W/2,H*0.7); }},
    {n:'s',w:d,h,f:(g,W,H)=>{ kraft(g,W,H,rnd); g.fillStyle='#2a2016'; g.beginPath(); g.ellipse(W/2,H*0.2,W*0.22,H*0.06,0,0,PI*2); g.fill(); if(typeof gefahrRaute==='function') gefahrRaute(g,W/2,H*0.65,Math.min(W,H)*0.4,'1.4G'); }},
    {n:'t',w,h:d,f:(g,W,H)=>{ kraft(g,W,H,rnd); g.strokeStyle='rgba(60,40,20,.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,H/2); g.lineTo(W,H/2); g.stroke(); }}],{rough:0.85,max:1500});
  dr(o,kiste(w,h,d,R),tm(0,h/2,0));
  const TP=0xc8a46a; box(o,w*1.002,0.0012,d*0.36,0,h+0.0006,0,TP);
  for(const s of [-1,1]){ box(o,0.0012,h*0.25,d*0.36,s*(w/2+0.0006),h*0.875,0,TP); }
  return fertig(o); };

/* =================== RAKETEN =================== */
/* gemeinsame Raketenreihe: n Raketen nebeneinander (z), Kopf nach +x */
function reihe(o,n,q){ const {w,d}=o, step=(q.dz||d*0.84)/n, r=q.r||Math.min(o.h*0.3,step*0.42), cols=q.cols||[0xd8352a,0x2f7fd0,0xffc93a,0x2f9e57,0x9b3bd6,0xf2f5ff,0xff7a3d,0x39c4d8,0xe35aa8];
  for(let i=0;i<n;i++){ const z=(q.z0!==undefined?q.z0:-(q.dz||d*0.84)/2)+step*(i+0.5), c=typeof cols==='function'?cols(i):cols[i%cols.length];
    rakete(o,q.x!==undefined?q.x:w*0.46,(q.y!==undefined?q.y:0)+r+(q.stab===false?0:0.004),z,r,q.L||w*0.3,c,Object.assign({ende:q.stab===false?undefined:(q.ende!==undefined?q.ende:-w*0.47),sy:q.sy},q.opt||{},q.optI?q.optI(i):{})); }
  return r; }

/* Sternschnuppe: Karton, im Deckel sternfoermige Fenster genau ueber
   den Raketenkoepfen */
VP_FORM.raketenklein=t=>{ const o=G(t), {w,h,d,a,rnd}=o, n=5, dz=d*0.82, xs=0.36;
  const sterne=(W,H)=>[...Array(n)].map((_,i)=>({stern:1,x:W*(0.83+(i%2)*0.08),y:H*(1-((i+0.5)/n*dz+(d-dz)/2)/d),r:H*0.13}));
  const R=bogen(o,[{n:'f',w,h,f:B(t)},{n:'s',w:d,h,f:seite(t)},
    {n:'t',w,h:d,f:(g,W,H)=>{ nacht(g,W,H,rnd); g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<5;i++){ const y=H*(0.15+i*0.17), gr=g.createLinearGradient(W*0.1,y,W*0.8,y-H*0.08); gr.addColorStop(0,'rgba(255,210,63,0)'); gr.addColorStop(1,'rgba(255,230,160,.8)'); g.strokeStyle=gr; g.lineWidth=H*0.02; g.beginPath(); g.moveTo(W*0.1,y+H*0.06); g.lineTo(W*0.78,y-H*0.02); g.stroke(); } g.restore();
      titel(g,t,W*0.4,H*0.5,W*0.66,H*0.32,a.ac); loch(g,sterne(W,H),'#ffd23f'); }}],{alpha:true});
  dr(o,kiste(w,h,d,R),tm(0,h/2,0));
  einsatz(o,w*0.2,w*0.49,0.002,h-0.002,-d/2+0.002,d/2-0.002,0x0c0626);
  reihe(o,n,{dz,r:Math.min(h*0.3,0.0105),x:w*(xs+0.1),L:w*0.3,cols:[0xc9ccd2,0xffd23f,0xc9ccd2,0xff4fa3,0xc9ccd2]});
  return fertig(o); };

/* Hasenjagd: der Klassiker - Karton mit grossem Deckelfenster, darunter
   die Raketen mit Stab auf dunkler Einlage */
VP_FORM.raketen=t=>{ const o=G(t), {w,h,d,a}=o;
  const R=bogen(o,[{n:'f',w,h,f:B(t)},{n:'s',w:d,h,f:seite(t)},{n:'t',w,h:d,f:(g,W,H)=>{ drawFront(g,W,H,a,o.cat); loch(g,[{x:W*0.3,y:H*0.1,w:W*0.66,h:H*0.8}]); }}],{alpha:true});
  dr(o,kiste(w,h,d,R),tm(0,h/2,0));
  einsatz(o,-w*0.2,w*0.48,0.002,h-0.002,-d*0.42,d*0.42,0x1d2130);
  reihe(o,o.p.stueck||10,{dz:d*0.78});
  fol(o,new THREE.PlaneGeometry(w*0.66,d*0.8),tm(w*0.13,h-0.0015,0,-PI/2,0,0));
  return fertig(o); };

/* Korkenzieher: liegende Blisterkarte - jede Rakete unter ihrer
   eigenen laenglichen Blase, vorn eine hochgeklappte Kopfleiste */
VP_FORM.pfeifraketen=t=>{ const o=G(t), {w,h,d,a,rnd}=o, kd=0.004, lh=h*0.42, n=6;
  const R=bogen(o,[{n:'f',w,h:lh,f:B(t)},{n:'k',w,h:d,f:(g,W,H)=>{ verlauf(a.bg1,a.bg2)(g,W,H); g.strokeStyle=rgba?rgba(a.ac,0.35):a.ac; g.lineWidth=H*0.01; for(let i=0;i<9;i++){ g.beginPath(); for(let x=0;x<W;x+=4) g.lineTo(x,H*(0.1+i*0.1)+Math.sin(x*0.05+i)*H*0.02); g.stroke(); } }},{n:'leer',w:0.02,h:0.02,f:flach(a.bg2)}]);
  dr(o,kiste(w,kd,d,{t:R.k,leer:R.leer}),tm(0,kd/2,0));
  dr(o,kiste(w,lh,kd,{f:R.f,leer:R.leer}),tm(0,lh/2,d/2-kd/2));
  const dz=d*0.8, step=dz/n, r=Math.min(0.0095,step*0.36), bz0=-d/2+0.004;
  for(let i=0;i<n;i++){ const z=-dz/2+step*(i+0.5)-d*0.04;
    rakete(o,w*0.45,kd+r+0.004,z,r,w*0.28,[0x5cff9e,0xffd23f,0xf2f5ff][i%3],{ende:-w*0.46,seg:7,sz:0});
    fol(o,new THREE.SphereGeometry(1,12,5,0,PI*2,0,PI/2),tm(0,kd,z,0,0,0,w*0.475,Math.min(h-kd-0.001,r*2.6+0.006),step*0.46)); }
  fol(o,new THREE.BoxGeometry(w*0.99,0.001,d*0.95),tm(0,kd+0.0006,-d*0.02));
  return fertig(o); };

/* Goldbrokat: Geschenkbox mit goldenem Satinband und Schleife */
VP_FORM.raketengold=t=>{ const o=G(t), {w,h,d,a}=o, bh=h*0.78;
  const R=bogen(o,[{n:'f',w,h:bh,f:B(t)},{n:'s',w:d,h:bh,f:seite(t)},{n:'t',w,h:d,f:oben(t)}]);
  dr(o,kiste(w,bh,d,R),tm(0,bh/2,0));
  const bx=-w*0.305, BD=0xe0b44a, bw=0.018;
  box(o,bw,0.0015,d+0.002,bx,bh+0.0007,0,BD); box(o,bw,bh,0.0015,bx,bh/2,d/2+0.0007,BD); box(o,bw,bh,0.0015,bx,bh/2,-d/2-0.0007,BD);
  box(o,w+0.002,0.0015,bw,0,bh+0.0007,0,BD); for(const s of [-1,1]) box(o,0.0015,bh,bw,s*(w/2+0.0007),bh/2,0,BD);
  for(const s of [-1,1]){ torus(o,0.022,0.006,bx+s*0.022,bh+0.007,0,BD,PI/2,0,s*0.3,14,1,1,0.5); box(o,0.008,0.0015,0.045,bx+s*0.012,bh+0.002,s*0.028,BD,0,s*0.45,0); }
  kugel(o,0.008,bx,bh+0.007,0,0xc9982e,1,0.75,1);
  return fertig(o); };

/* Titan: Holzkiste aus Latten mit Brandstempel und Etikett - durch die
   Luecken sieht man die drei dicken Ratterraketen */
VP_FORM.titanraketen=t=>{ const o=G(t), {w,h,d,a,rnd}=o, th=0.008, ew=0.014;
  const R=bogen(o,[{n:'h',w:w*0.5,h:0.05,f:(g,W,H)=>holz(g,W,H,rnd)},
    {n:'lf',w,h:h*0.5,f:(g,W,H)=>{ holz(g,W,H,rnd); teil(g,W*0.2,H*0.08,W*0.6,H*0.84,B(t)); rahmen(g,W*0.2,H*0.08,W*0.6,H*0.84,'#f2f2f2',3);
      g.fillStyle='rgba(40,20,8,.75)'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bar(Math.round(H*0.42)); g.fillText('TITAN',W*0.12,H*0.52); g.fillText('XXL',W*0.88,H*0.52); }},
    {n:'e',w:d,h,f:(g,W,H)=>{ holz(g,W,H,rnd); g.fillStyle='rgba(40,20,8,.75)'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bar(Math.round(H*0.28)); g.fillText('TITAN',W/2,H*0.42); g.font=FNT.bar(Math.round(H*0.12)); g.fillText('1.4G · F2',W/2,H*0.7); }}]);
  const hz=R.h, L=(ww,hh,dd,x,y,z,f)=>dr(o,kiste(ww,hh,dd,{f:f||hz,leer:hz}),tm(x,y,z));
  L(w,th,d,0,th/2,0); for(const s of [-1,1]) dr(o,kiste(ew,h,d,{r:R.e,l:R.e,leer:hz}),tm(s*(w/2-ew/2),h/2,0));
  L(w-2*ew,h*0.5,th,0,h*0.25,d/2-th/2,R.lf); L(w-2*ew,h*0.2,th,0,h*0.88,d/2-th/2);
  L(w-2*ew,h*0.42,th,0,h*0.21,-d/2+th/2); L(w-2*ew,h*0.24,th,0,h*0.86,-d/2+th/2);
  for(const z of [-0.33,0.02,0.36]) L(w-2*ew,th,d*0.22,0,h-th/2,z*d);
  for(const s of [-1,1]) for(const z of [-1,1]) box(o,0.002,h*0.9,0.012,s*(w/2-ew-0.001),h*0.5,z*(d/2-0.006),0x3a3a3a);
  const n=3, step=d*0.8/n, r=Math.min(h*0.3,step*0.38);
  for(let i=0;i<n;i++){ const z=-d*0.4+step*(i+0.5); rakete(o,w*0.44,th+r+0.004,z,r,w*0.3,[0x26292f,0xd1e5ff,0x26292f][i],{kc:0xd1e5ff,ringC:0xffd23f,ende:-w*0.46,seg:10}); }
  return fertig(o); };

/* Juwelenpalme: langer Jumbo-Karton mit hochgeklappter Grifflasche */
VP_FORM.jumbogold=t=>{ const o=G(t), {w,h,d,a}=o, bh=h*0.8, gh=h-bh, gw=w*0.34;
  const R=bogen(o,[{n:'f',w,h:bh,f:B(t)},{n:'s',w:d,h:bh,f:seite(t)},{n:'t',w,h:d,f:oben(t)},
    {n:'g',w:gw,h:gh,f:(g,W,H)=>{ g.fillStyle='#d9b45a'; g.fillRect(0,0,W,H); g.fillStyle='#0b0a09'; g.fillRect(0,H*0.82,W,H*0.18); g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.cin(Math.round(H*0.16)); g.fillText('JUMBO',W*0.13,H*0.42); g.fillText('JUMBO',W*0.87,H*0.42); g.save(); g.globalCompositeOperation='destination-out'; g.fillStyle='#000'; g.beginPath(); g.ellipse(W/2,H*0.42,W*0.3,H*0.2,0,0,PI*2); g.fill(); g.restore(); g.strokeStyle='#d9b45a'; g.lineWidth=2; g.beginPath(); g.ellipse(W/2,H*0.42,W*0.3,H*0.2,0,0,PI*2); g.stroke(); }}],{alpha:true});
  dr(o,kiste(w,bh,d,R),tm(0,bh/2,0));
  dr(o,kiste(gw,gh+0.003,0.004,{f:R.g,leer:R.g}),tm(0,bh+gh/2-0.0015,0));
  for(const s of [-1,1]) box(o,0.004,0.004,d*0.3,s*gw*0.45,bh+0.002,0,0x9a7a3a);
  return fertig(o); };

/* Polarstern: Raketenroehre aus Pappe mit Blechkappen auf zwei
   Saetteln, Etikett ueber die Laenge */
VP_FORM.jumboleiter=t=>{ const o=G(t), {w,h,d,a,rnd}=o, sh=0.012, Rr=Math.min(h/2-sh/2,d/2)*0.95, yc=sh+Rr, cl=0.024, L=w-2*cl;
  const R=bogen(o,[{n:'m',w:2*PI*Rr,h:L,f:(g,W,H)=>{ for(let k=0;k<2;k++){ g.save(); g.translate(k*W/2,H); g.rotate(-PI/2); bild(g,H,W/2,t); g.restore(); } }}],{max:1500});
  dr(o,new THREE.CylinderGeometry(Rr,Rr,L,28,1,true,-PI/2),tm(0,yc,0,0,0,-PI/2),R.m);
  for(const s of [-1,1]){ zyl(o,Rr*1.03,Rr*1.03,cl,28,s*(w/2-cl/2),yc,0,SILBER,0,0,PI/2); torus(o,Rr*1.02,0.003,s*(L/2),yc,0,0x8f949c,0,PI/2,0,24);
    box(o,0.03,sh+Rr*0.4,d*0.75,s*w*0.3,(sh+Rr*0.4)/2,0,0x26282e); }
  return fertig(o); };

/* Blanko: unbedruckte Kraftpapier-Steige mit Faechern, nur ein
   Stempeletikett - die Rohlinge weiss */
VP_FORM.blanko=t=>{ const o=G(t), {w,h,d,a,rnd}=o, hw=h*0.62, th=0.003, n=5;
  const R=bogen(o,[{n:'f',w,h:hw,f:(g,W,H)=>{ kraft(g,W,H,rnd); g.fillStyle='#f4f1ea'; g.fillRect(W*0.32,H*0.12,W*0.36,H*0.76); g.strokeStyle='#999'; g.lineWidth=1; g.strokeRect(W*0.32,H*0.12,W*0.36,H*0.76);
      g.fillStyle='#1b1b1b'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,a.title,W*0.3,Math.round(H*0.4),BUN); g.fillText(a.title,W*0.5,H*0.42); g.font=BAR(Math.round(H*0.16)); g.fillText('ROHLINGE · '+a.sub,W*0.5,H*0.72);
      g.strokeStyle='rgba(180,30,30,.75)'; g.lineWidth=H*0.05; g.strokeRect(W*0.75,H*0.2,W*0.2,H*0.6); g.fillStyle='rgba(180,30,30,.75)'; g.font=BAR(Math.round(H*0.24)); g.fillText('5 STK',W*0.85,H*0.5);
      g.fillStyle='#111'; for(let x=W*0.05,k=0;x<W*0.27;k++){ const b=1+(k*7%3); g.fillRect(x,H*0.3,b,H*0.4); x+=b+1.5; } }},
    {n:'k',w:0.06,h:0.06,f:(g,W,H)=>kraft(g,W,H,rnd)}]);
  dr(o,kiste(w,hw,th,{f:R.f,leer:R.k}),tm(0,hw/2,d/2-th/2)); dr(o,kiste(w,hw,th,{leer:R.k}),tm(0,hw/2,-d/2+th/2));
  for(const s of [-1,1]) dr(o,kiste(th,hw,d,{leer:R.k}),tm(s*(w/2-th/2),hw/2,0));
  dr(o,kiste(w,th,d,{leer:R.k}),tm(0,th/2,0));
  const step=(d-2*th)/n; for(let i=1;i<n;i++) box(o,w-2*th,hw*0.42,0.002,0,hw*0.21,-d/2+th+step*i,0xa67c4c);
  for(let i=0;i<n;i++){ const z=-d/2+th+step*(i+0.5), r=Math.min(0.0105,step*0.32); rakete(o,w*0.45,th+r+0.004,z,r,w*0.3,0xf8f8f8,{kc:0xd9dde2,ringC:0xd8d8d8,ende:-w*0.46,lunte:true,sz:0}); }
  return fertig(o); };

/* Donnerbalken (05.10., Tom: "komische Staebe, die da rausgehen, und man
   kann in die Verpackung reingucken"): vorher eine oben offene
   Kraftpapiertuete, die Raketenstaebe ragten ein Drittel der Packungs-
   laenge hinaus und durch die offene Tuete sah man ins Leere. Jetzt ein
   geschlossener Achtkant-Karton im Look eines Holzbalkens (gefaste Kanten,
   Maserung, an den Stirnseiten Jahresringe) - der Donnerbalken vom
   Plumpsklo. Vorn rechts das Plumpsklo-Herz als Sichtfenster mit Folie,
   dahinter gucken die drei gruenen Raketenkoepfe heraus; die Staebe
   liegen innen. Druck: gemalter Name, Plumpsklo-Aufkleber mit startender
   Furzrakete, "3 Furzraketen", F2. */
function herzPfad(g,x,y,s){ g.moveTo(x,y+s*0.95);
  g.bezierCurveTo(x-s*0.2,y+s*0.7,x-s,y+s*0.35,x-s,y-s*0.25); g.bezierCurveTo(x-s,y-s*0.78,x-s*0.38,y-s*1.02,x,y-s*0.52);
  g.bezierCurveTo(x+s*0.38,y-s*1.02,x+s,y-s*0.78,x+s,y-s*0.25); g.bezierCurveTo(x+s,y+s*0.35,x+s*0.2,y+s*0.7,x,y+s*0.95); g.closePath(); }
/* Holzbalken: Maserung laengs, ein, zwei Aeste */
function balkenHolz(g,W,H,rnd,dunkel){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,dunkel?'#6a4019':'#86552a'); gr.addColorStop(1,dunkel?'#55321a':'#6c4220'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  for(let i=0;i<Math.max(6,H/5);i++){ const y=rnd()*H, a=1+rnd()*2.5, f=0.004+rnd()*0.01, ph=rnd()*9; g.strokeStyle=`rgba(${rnd()<0.7?'45,22,6':'190,140,80'},${0.12+rnd()*0.22})`; g.lineWidth=0.8+rnd()*1.8; g.beginPath();
    for(let x=0;x<=W;x+=W/40) g.lineTo(x,y+Math.sin(x*f+ph)*a*(H/60)); g.stroke(); }
  for(let k=0;k<(W>H*3?2:1);k++){ const x=W*(0.15+rnd()*0.7), y=H*(0.25+rnd()*0.5), r=Math.min(H*0.09,W*0.02)+2;
    for(let j=4;j>=1;j--){ g.strokeStyle=`rgba(70,38,12,${0.15+j*0.06})`; g.lineWidth=1.2; g.beginPath(); g.ellipse(x,y,r*j*1.9,r*j*0.55,0,0,PI*2); g.stroke(); }
    g.fillStyle='rgba(60,30,8,.75)'; g.beginPath(); g.ellipse(x,y,r*1.2,r*0.6,0,0,PI*2); g.fill(); } }
/* gruene Pupswolke aus Kringeln */
function pupsWolke(g,x,y,r,rnd,c){ g.fillStyle=c||'#a8cc2e'; g.strokeStyle='rgba(60,70,10,.85)'; g.lineWidth=Math.max(1,r*0.08);
  const K=[[0,0,1],[-0.8,0.25,0.7],[0.8,0.2,0.75],[-0.35,-0.5,0.7],[0.4,-0.45,0.65],[1.4,-0.1,0.45]].map(([dx,dy,s])=>[x+dx*r,y+dy*r,r*s*(0.9+rnd()*0.2)]);
  for(const [a,b,s] of K){ g.beginPath(); g.arc(a,b,s,0,PI*2); g.stroke(); } for(const [a,b,s] of K){ g.beginPath(); g.arc(a,b,s,0,PI*2); g.fill(); } }
/* Comic: Plumpsklo mit Herz in der Tuer, die Furzrakete schiesst durchs Dach */
function plumpsklo(g,x,y,s,rnd,a){ const L=Math.max(1,s*0.035), DK='#2b1608';
  const bw=s*0.5, bh=s*0.62, x0=x-bw/2, y0=y-bh;
  g.save(); g.lineJoin='round'; g.fillStyle='#9a6532'; g.fillRect(x0,y0,bw,bh); g.strokeStyle='rgba(43,22,8,.6)'; g.lineWidth=L*0.7;
  for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(x0+bw*i/4,y0); g.lineTo(x0+bw*i/4,y); g.stroke(); }
  g.fillStyle='#b5793e'; g.fillRect(x0+bw*0.2,y0+bh*0.12,bw*0.6,bh*0.88); g.strokeStyle=DK; g.lineWidth=L; g.strokeRect(x0+bw*0.2,y0+bh*0.12,bw*0.6,bh*0.88);
  g.fillStyle=DK; g.beginPath(); herzPfad(g,x,y0+bh*0.32,bw*0.12); g.fill();
  g.fillStyle='#1b1b1b'; g.beginPath(); g.arc(x+bw*0.2,y0+bh*0.6,L*1.2,0,PI*2); g.fill();
  g.strokeStyle=DK; g.lineWidth=L; g.strokeRect(x0,y0,bw,bh);
  /* Dach: aufgeplatzt, die Bretter fliegen */
  g.fillStyle='#4a3420'; g.beginPath(); g.moveTo(x0-bw*0.12,y0+L); g.lineTo(x-bw*0.12,y0-s*0.14); g.lineTo(x0+bw*0.3,y0+L); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x+bw*0.62,y0+L); g.lineTo(x+bw*0.2,y0-s*0.12); g.lineTo(x+bw*0.1,y0+L); g.closePath(); g.fill(); g.stroke();
  for(const [dx,dy,r] of [[-0.55,-0.55,-0.6],[0.7,-0.62,0.5]]){ g.save(); g.translate(x+bw*dx,y0+s*dy*0.6); g.rotate(r); g.fillStyle='#4a3420'; g.fillRect(-bw*0.16,-L*1.5,bw*0.32,L*3); g.strokeRect(-bw*0.16,-L*1.5,bw*0.32,L*3); g.restore(); }
  /* Pupswolke und Rakete */
  pupsWolke(g,x+bw*0.02,y0-s*0.08,s*0.13,rnd);
  g.save(); g.translate(x+bw*0.12,y0-s*0.42); g.rotate(0.35); const rr=s*0.07;
  g.fillStyle=a.ac; g.fillRect(-rr,-rr*1.4,rr*2,rr*3.4); g.strokeStyle=DK; g.lineWidth=L; g.strokeRect(-rr,-rr*1.4,rr*2,rr*3.4);
  g.fillStyle=a.ac2; g.beginPath(); g.moveTo(-rr,-rr*1.4); g.lineTo(0,-rr*3.2); g.lineTo(rr,-rr*1.4); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#fff'; g.beginPath(); g.arc(-rr*0.3,-rr*0.4,rr*0.42,0,PI*2); g.arc(rr*0.45,-rr*0.4,rr*0.42,0,PI*2); g.fill(); g.fillStyle='#111'; g.beginPath(); g.arc(-rr*0.15,-rr*0.45,rr*0.18,0,PI*2); g.arc(rr*0.6,-rr*0.45,rr*0.18,0,PI*2); g.fill();
  g.strokeStyle=DK; g.lineWidth=L*0.9; g.beginPath(); g.arc(rr*0.1,rr*0.5,rr*0.45,0.3,PI-0.3); g.stroke(); g.restore();
  g.restore(); }
VP_FORM.furzrakete=t=>{ const o=G(t), {w,h,d,a,rnd}=o, c=Math.min(h,d)*0.14, hf=h-2*c, df=d-2*c, ks=c*Math.SQRT2;
  /* Herzfenster vorn rechts (Anteil der Breite), Groesse relativ zur Flaechenhoehe */
  const hx=0.875, hs=0.46, DK='#2b1608', GELB=a.ac2, GRUEN=a.ac;
  const schild=(g,txt,x,y,mw,sz)=>{ nameText(g,txt,x+sz*0.05,y+sz*0.07,mw,sz,FNT.bun,'rgba(25,10,0,.55)',null,0); return nameText(g,txt,x,y,mw,sz,FNT.bun,GELB,DK,Math.max(2,sz*0.16)); };
  const aufkleber=(g,x,y,W,H,rot,fn)=>{ g.save(); g.translate(x+W/2,y+H/2); g.rotate(rot); g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(-W/2+2,-H/2+3,W,H);
    g.fillStyle='#f3ead2'; g.fillRect(-W/2,-H/2,W,H); g.strokeStyle='#c9b98f'; g.lineWidth=Math.max(1,H*0.02); g.strokeRect(-W/2+H*0.04,-H/2+H*0.04,W-H*0.08,H-H*0.08); fn(g,W,H); g.restore(); };
  const R=bogen(o,[
    {n:'f',w,h:hf,f:(g,W,H)=>{ balkenHolz(g,W,H,rnd);
      aufkleber(g,W*0.012,H*0.08,W*0.19,H*0.84,-0.035,(g,w2,h2)=>{ plumpsklo(g,-w2*0.24,h2*0.42,h2*0.72,rnd,a);
        nameText(g,'PFFRRT!',w2*0.2,-h2*0.12,w2*0.5,Math.round(h2*0.3),FNT.bun,GRUEN,DK,Math.max(2,h2*0.05),-0.15);
        nameText(g,'KATEGORIE F2',w2*0.2,h2*0.28,w2*0.5,Math.round(h2*0.15),FNT.bar,DK); });
      schild(g,a.title,W*0.47,H*0.4,W*0.5,Math.round(H*0.56));
      g.fillStyle='rgba(30,14,2,.85)'; g.fillRect(W*0.26,H*0.73,W*0.42,H*0.21);
      nameText(g,'3 FURZRAKETEN · STEIGEN MIT RÜCKENWIND',W*0.47,H*0.835,W*0.4,Math.round(H*0.17),FNT.bar,GRUEN);
      /* Fenster: Herz ausgestanzt, Rand eingebrannt */
      const cx=W*hx, cy=H*0.5, s=H*hs; g.save(); g.globalCompositeOperation='destination-out'; g.fillStyle='#000'; g.beginPath(); herzPfad(g,cx,cy,s); g.fill(); g.restore();
      g.strokeStyle=DK; g.lineWidth=Math.max(2,H*0.05); g.beginPath(); herzPfad(g,cx,cy,s*1.04); g.stroke();
      siegel(g,W*0.965,H*0.72,H*0.2,'F2','#fff','#1b1b1b'); }},
    {n:'t',w,h:df,f:(g,W,H)=>{ balkenHolz(g,W,H,rnd);
      schild(g,a.title,W*0.39,H*0.36,W*0.56,Math.round(H*0.34));
      g.fillStyle='rgba(30,14,2,.85)'; g.fillRect(W*0.13,H*0.62,W*0.52,H*0.18);
      nameText(g,'3 FURZRAKETEN · MIT PUPS-ANTRIEB',W*0.39,H*0.71,W*0.49,Math.round(H*0.13),FNT.bar,GRUEN);
      aufkleber(g,W*0.69,H*0.08,W*0.28,H*0.84,0.04,(g,w2,h2)=>{ plumpsklo(g,-w2*0.27,h2*0.4,h2*0.74,rnd,a);
        nameText(g,'PFFRRT!',w2*0.2,-h2*0.2,w2*0.5,Math.round(h2*0.2),FNT.bun,GRUEN,DK,Math.max(2,h2*0.035),-0.15);
        nameText(g,'Kommt nur mühsam hoch,',w2*0.2,h2*0.08,w2*0.56,Math.round(h2*0.11),FNT.bar,DK);
        nameText(g,'aber mit Nachdruck.',w2*0.2,h2*0.22,w2*0.56,Math.round(h2*0.11),FNT.bar,DK); });
      siegel(g,W*0.06,H*0.5,H*0.2,'F2','#fff','#1b1b1b');
      nameText(g,'NUR IM FREIEN',W*0.06,H*0.79,W*0.09,Math.round(H*0.08),FNT.bar,'#f3ead2'); }},
    {n:'b',w,h:hf,f:(g,W,H)=>{ balkenHolz(g,W,H,rnd);
      aufkleber(g,W*0.3,H*0.1,W*0.4,H*0.8,0,(g,w2,h2)=>{ g.fillStyle=DK; g.textAlign='left'; g.textBaseline='middle';
        ['Kategorie F2 · Nur im Freien verwenden','Sicherheitsabstand 8 m · Rakete nur aus Rohr','oder Flasche starten · nicht in der Hand zünden'].forEach((s,i)=>{ fitFont(g,s,w2*0.66,Math.round(h2*0.15),FNT.bar); g.fillText(s,-w2*0.44,-h2*0.24+i*h2*0.22); });
        siegel(g,w2*0.36,0,h2*0.26,'F2','#fff','#1b1b1b'); });
      g.fillStyle='#111'; for(let x=W*0.76,k=0;x<W*0.86;k++){ const b=1+(k*7%3); g.fillRect(x,H*0.25,b,H*0.5); x+=b+1.5; } }},
    {n:'k',w,h:ks,f:(g,W,H)=>balkenHolz(g,W,H,rnd,true)},
    {n:'e',w:d,h,f:(g,W,H)=>{ g.fillStyle='#b07a45'; g.fillRect(0,0,W,H); const cx=W*0.46, cy=H*0.56;
      for(let i=14;i>=1;i--){ g.strokeStyle=`rgba(110,64,26,${0.25+(i%3)*0.12})`; g.lineWidth=1+(i%2); g.beginPath(); g.ellipse(cx,cy,W*0.045*i,H*0.07*i,0,0,PI*2); g.stroke(); }
      g.fillStyle='#7a4a1e'; g.beginPath(); g.arc(cx,cy,Math.min(W,H)*0.03,0,PI*2); g.fill();
      g.strokeStyle='rgba(50,25,8,.7)'; g.lineWidth=1.5; for(const an of [0.4,2.5,4.4]){ g.beginPath(); g.moveTo(cx+Math.cos(an)*W*0.05,cy+Math.sin(an)*H*0.08); g.lineTo(cx+Math.cos(an)*W*0.3,cy+Math.sin(an)*H*0.42); g.stroke(); }
      g.strokeStyle='rgba(170,30,30,.8)'; g.lineWidth=Math.max(1.5,H*0.03); g.strokeRect(W*0.62,H*0.1,W*0.32,H*0.3); g.fillStyle='rgba(170,30,30,.8)'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bar(Math.round(H*0.2)); g.fillText('3 STK',W*0.78,H*0.26); }}],{alpha:true,ppm:2200});
  /* Achtkant: vier Seiten, vier Fasen, zwei Stirnseiten */
  dr(o,new THREE.PlaneGeometry(w,hf),tm(0,h/2,d/2),R.f);
  dr(o,new THREE.PlaneGeometry(w,hf),tm(0,h/2,-d/2,0,PI,0),R.b);
  dr(o,new THREE.PlaneGeometry(w,df),tm(0,h,0,-PI/2,0,0),R.t);
  o.vc.push({geo:new THREE.PlaneGeometry(w,df),m:tm(0,0,0,PI/2,0,0),color:0x6b4520});
  for(const [sy,sz] of [[1,1],[1,-1],[-1,-1],[-1,1]]) dr(o,new THREE.PlaneGeometry(w,ks),tm(0,h/2+sy*(h/2-c/2),sz*(d/2-c/2),-Math.atan2(sy,sz),0,0),R.k);
  const s8=new THREE.Shape(), A=d/2, Bh=h/2; [[-A+c,-Bh],[A-c,-Bh],[A,-Bh+c],[A,Bh-c],[A-c,Bh],[-A+c,Bh],[-A,Bh-c],[-A,-Bh+c]].forEach(([x,y],i)=>i?s8.lineTo(x,y):s8.moveTo(x,y));
  for(const s of [-1,1]){ const g8=new THREE.ShapeGeometry(s8), uv=g8.attributes.uv, P8=g8.attributes.position;
    for(let i=0;i<uv.count;i++) uv.setXY(i,(P8.getX(i)+A)/d,(P8.getY(i)+Bh)/h);
    dr(o,g8,tm(s*w/2,h/2,0,0,s*PI/2,0),R.e); }
  /* hinter dem Herz: dunkler Einsatz, drei Raketenkoepfe (die Staebe liegen innen, unsichtbar) */
  const fx=-w/2+w*hx, fr=hf*hs; einsatz(o,fx-fr*2.2,w/2-0.003,c,h-c,-d/2+c,d/2-0.0015,0x3a2814);
  const r=Math.min(h*0.22,d*0.13), kl=r*3, xs=fx+fr*0.95, L=fr*2.2;
  for(let i=0;i<3;i++){ const z=d/2-0.004-r-i*(2*r+0.004), y=h/2-(i===1?0:0.002);
    zyl(o,0,r,kl,10,xs-kl/2,y,z,hexMix(GRUEN,-0.25),0,0,-PI/2);
    zyl(o,r*1.02,r*1.02,0.008,10,xs-kl-0.004,y,z,I(GELB),0,0,PI/2);
    zyl(o,r,r,L,10,xs-kl-0.008-L/2,y,z,0xe8dcc0,0,0,PI/2); }
  fol(o,new THREE.PlaneGeometry(fr*2.2,fr*2.1),tm(fx,h/2,d/2-0.0012));
  return fertig(o); };

/* Silberpfeil: Skinverpackung - die Raketen hauteng in Folie auf einer
   schraeg stehenden Karte (Keilaufsteller) */
VP_FORM.silberpfeil=t=>{ const o=G(t), {w,h,d,a,rnd}=o, Lk=Math.hypot(h,d)-0.004, al=Math.atan2(d,h);
  const R=bogen(o,[{n:'k',w,h:Lk,f:(g,W,H)=>{ g.fillStyle='#202329'; g.fillRect(0,0,W,H); teil(g,0,0,W,H*0.44,B(t));
      const gr=g.createLinearGradient(0,H*0.44,0,H); gr.addColorStop(0,'#9aa3ad'); gr.addColorStop(0.5,'#e6ebf0'); gr.addColorStop(1,'#7c858f'); g.fillStyle=gr; g.fillRect(0,H*0.44,W,H*0.56);
      g.fillStyle='rgba(30,40,60,.18)'; for(let i=0;i<12;i++){ const x=W*i/12; g.beginPath(); g.moveTo(x,H*0.46); g.lineTo(x+W*0.04,H*0.72); g.lineTo(x,H*0.98); g.lineTo(x+W*0.02,H*0.98); g.lineTo(x+W*0.06,H*0.72); g.lineTo(x+W*0.02,H*0.46); g.fill(); } }},
    {n:'s',w:d,h,f:flach('#202329')}]);
  dr(o,new THREE.PlaneGeometry(w,Lk),tm(0,h/2,0,-al,0,0),R.k);
  for(const s of [-1,1]) o.vc.push({geo:dreieck(s>0?[0,0,d/2]:[0,0,-d/2],s>0?[0,0,-d/2]:[0,0,d/2],[0,h,-d/2]),m:tm(s*w/2,0,0),color:0x202329});
  o.vc.push({geo:new THREE.PlaneGeometry(w,h),m:tm(0,h/2,-d/2,0,PI,0),color:0x202329});
  const n=4; gruppe(o,tm(0,h/2,0,-al,0,0),s=>{ for(let i=0;i<n;i++){ const yy=-Lk/2+Lk*(0.08+0.5*(i+0.5)/n), r=0.0072, c=[0xd1e5ff,0x5ce1ff,0xd1e5ff,0x5ce1ff][i];
      gruppe(s,tm(0,yy,r+0.0005,PI/2,0,0),u=>rakete(u,w*0.46,0,0,r,w*0.3,c,{ende:-w*0.46,seg:7,sz:0,sy:-r*0.5}));
      fol(s,new THREE.CylinderGeometry(r*1.35,r*1.35,w*0.93,8,1,true,0,PI),tm(0,yy,0.0004,0,0,PI/2)); } });
  gruppe(o,tm(0,h/2,0,-al,0,0),s=>fol(s,new THREE.PlaneGeometry(w*0.99,Lk*0.99),tm(0,0,0.0008)));
  return fertig(o); };

/* Kometenkette: jede Rakete einzeln in Folie mit gequetschten Enden,
   in einer Reihe auf einem bedruckten Papptraeger mit Kopfleiste */
VP_FORM.kometenraketen=t=>{ const o=G(t), {w,h,d,a}=o, lh=h*0.62, th=0.003, n=7;
  const R=bogen(o,[{n:'f',w,h:lh,f:B(t)},{n:'k',w,h:d,f:(g,W,H)=>{ if(typeof effektFoto==='function') effektFoto(g,0,0,W,H,t,a,zufallAus(hashStr(t+'k')),{stadt:false}); else { g.fillStyle=a.bg2; g.fillRect(0,0,W,H); } }},{n:'leer',w:0.02,h:0.02,f:flach(a.bg2)}]);
  dr(o,kiste(w,th,d,{t:R.k,leer:R.leer}),tm(0,th/2,0)); dr(o,kiste(w,lh,th,{f:R.f,leer:R.leer}),tm(0,lh/2,d/2-th/2));
  const dz=d*0.86, step=dz/n, r=Math.min(0.0085,step*0.3);
  for(let i=0;i<n;i++){ const z=-d/2+0.004+step*(i+0.5), y=th+r+0.004;
    rakete(o,w*0.44,y,z,r,w*0.28,[0x0c3d7a,0xffd23f,0x5ce1ff][i%3],{ende:-w*0.44,seg:7,sz:0,sy:y-r-0.0005});
    if(!WARE_SPAR_AN) fol(o,quetsch(w*0.97,r*1.5,step*0.46,0.03,8,8),tm(0,y-0.001,z)); }
  /* Handy: eine gemeinsame Folie statt sieben Schlaeuche */
  if(WARE_SPAR_AN) fol(o,new THREE.BoxGeometry(w*0.97,0.004+2*Math.min(0.0085,dz/n*0.3)*1.5,d*0.97),tm(0,0.003+0.002+Math.min(0.0085,dz/n*0.3)*1.5,0));
  return fertig(o); };

/* Halbe-Halbe: halb Karton, halb Folie - links der bedruckte Karton,
   rechts schauen die zweifarbigen Raketenkoepfe in Folie heraus */
VP_FORM.farbenrausch=t=>{ const o=G(t), {w,h,d,a}=o, kw=w*0.56;
  const R=bogen(o,[{n:'f',w:kw,h,f:B(t)},{n:'s',w:d,h,f:seite(t)},{n:'t',w:kw,h:d,f:oben(t)}]);
  dr(o,kiste(kw,h,d,R),tm(-w/2+kw/2,h/2,0));
  box(o,w-kw,0.003,d,w/2-(w-kw)/2,0.0015,0,I(a.bg2));
  const c1=I(a.ac), c2=I(a.ac2);
  reihe(o,7,{dz:d*0.84,x:w*0.47,L:w*0.3,y:0.003,cols:i=>i%2?c1:c2,optI:i=>({c2:i%2?c2:c1,kc:0xf2f5ff})});
  fol(o,new THREE.BoxGeometry(w-kw,h*0.98,d*0.98),tm(w/2-(w-kw)/2,h*0.49,0));
  return fertig(o); };

/* Spaetzuender: in braunes Packpapier eingeschlagen, mit Bindfaden
   verschnuert, Etikett aufgeklebt */
VP_FORM.knisterstern=t=>{ const o=G(t), {w,h,d,a,rnd}=o, bh=h*0.96;
  const knitter=(g,W,H)=>{ kraft(g,W,H,rnd,'#a9824f'); g.strokeStyle='rgba(255,240,210,.18)'; g.lineWidth=1.5; for(let i=0;i<W*H/2500;i++){ const x=rnd()*W, y=rnd()*H; g.beginPath(); g.moveTo(x,y); g.lineTo(x+(rnd()-0.5)*W*0.08,y+(rnd()-0.5)*H*0.3); g.stroke(); } };
  const R=bogen(o,[{n:'f',w,h:bh,f:(g,W,H)=>{ knitter(g,W,H); teil(g,W*0.04,H*0.12,W*0.6,H*0.76,B(t)); rahmen(g,W*0.04,H*0.12,W*0.6,H*0.76,'#f2ead8',3);
      g.save(); g.translate(W*0.85,H*0.5); g.rotate(-0.08); g.strokeStyle='rgba(170,30,30,.8)'; g.lineWidth=H*0.04; g.strokeRect(-W*0.1,-H*0.28,W*0.2,H*0.56); g.fillStyle='rgba(170,30,30,.8)'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,'KNISTERT!',W*0.18,Math.round(H*0.22),BUN); g.fillText('KNISTERT!',0,-H*0.06); g.font=BAR(Math.round(H*0.15)); g.fillText('10 STK',0,H*0.16); g.restore(); }},
    {n:'s',w:d,h:bh,f:(g,W,H)=>{ knitter(g,W,H); g.strokeStyle='rgba(60,40,20,.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,0); g.lineTo(W*0.5,H*0.45); g.lineTo(W,0); g.moveTo(0,H); g.lineTo(W*0.5,H*0.55); g.lineTo(W,H); g.stroke(); }},
    {n:'t',w,h:d,f:(g,W,H)=>{ knitter(g,W,H); g.strokeStyle='rgba(60,40,20,.45)'; g.lineWidth=2; g.beginPath(); g.moveTo(0,H*0.6); g.lineTo(W,H*0.6); g.stroke(); }}],{rough:0.9});
  dr(o,kiste(w,bh,d,R),tm(0,bh/2,0));
  const SF=0xe8d8b0, s=0.0018, xs=w*0.3;
  box(o,w+0.002,s,s,0,bh+s/2,0,SF); box(o,w+0.002,s,s,0,s/2,0,SF); for(const k of [-1,1]) box(o,s,bh,s,k*(w/2+s/2),bh/2,0,SF);
  box(o,s,s,d+0.002,xs,bh+s/2,0,SF); box(o,s,bh,s,xs,bh/2,d/2+s/2,SF); box(o,s,bh,s,xs,bh/2,-d/2-s/2,SF);
  kugel(o,0.004,xs,bh+0.002,0,SF,1,0.6,1); for(const k of [-1,1]){ torus(o,0.008,0.0012,xs+k*0.008,bh+0.002,0,SF,PI/2,0,0,10,1,1,0.4); box(o,0.02,s,s,xs+k*0.004,bh+0.001,k*0.01,SF,0,k*0.7,0); }
  return fertig(o); };

/* Smaragd: Schmuckkasten - gruenes Samtbett mit Goldrand, darauf die
   sieben Raketen, Klarsichtdeckel mit Goldkante */
VP_FORM.smaragd=t=>{ const o=G(t), {w,h,d,a,rnd}=o, hb=h*0.52;
  const R=bogen(o,[{n:'f',w,h:hb,f:(g,W,H)=>{ g.fillStyle='#0b3a20'; g.fillRect(0,0,W,H); for(let i=0;i<W*H/30;i++){ g.fillStyle=`rgba(0,0,0,${rnd()*0.12})`; g.fillRect(rnd()*W,rnd()*H,2,2); }
      const pw=Math.min(W*0.3,H*1.0); teil(g,W*0.03,H*0.12,pw,H*0.76,(g2,w2,h2)=>drawFront(g2,w2,h2,a,o.cat)); rahmen(g,W*0.03,H*0.12,pw,H*0.76,'#d9b45a',2);
      const gold=g.createLinearGradient(0,H*0.2,0,H*0.7); gold.addColorStop(0,'#fff0b8'); gold.addColorStop(0.5,'#d9b45a'); gold.addColorStop(1,'#8a6a2a');
      const cx=W*0.03+pw+(W*0.94-pw)/2; nameText(g,a.title,cx,H*0.44,(W*0.94-pw)*0.8,Math.round(H*0.42),FNT.cin,gold,'rgba(0,0,0,.6)',2);
      nameText(g,a.sub,cx,H*0.76,(W*0.94-pw)*0.8,Math.round(H*0.14),FNT.bar,'#d9b45a');
      rahmen(g,W*0.015,H*0.06,W*0.97,H*0.88,'#d9b45a',Math.max(2,H*0.025)); }},
    {n:'s',w:d,h:hb,f:(g,W,H)=>{ g.fillStyle='#0b3a20'; g.fillRect(0,0,W,H); rahmen(g,W*0.08,H*0.15,W*0.84,H*0.7,'#d9b45a',2); }},
    {n:'t',w,h:d,f:(g,W,H)=>{ g.fillStyle='#0f5a2e'; g.fillRect(0,0,W,H); for(let i=0;i<W*H/12;i++){ g.fillStyle=`rgba(${rnd()<0.5?'0,0,0':'120,255,170'},${rnd()*0.08})`; g.fillRect(rnd()*W,rnd()*H,2,2); }
      for(let i=0;i<7;i++){ const y=H*(0.08+0.84*(i+0.5)/7); g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(W*0.04,y-H*0.035,W*0.92,H*0.07); } }}]);
  dr(o,kiste(w,hb,d,R),tm(0,hb/2,0));
  for(const s of [-1,1]){ box(o,w,0.0025,0.0025,0,hb,s*(d/2-0.00125),GOLD); box(o,0.0025,0.0025,d,s*(w/2-0.00125),hb,0,GOLD);
    box(o,w,0.0025,0.0025,0,h-0.00125,s*(d/2-0.00125),GOLD); box(o,0.0025,0.0025,d,s*(w/2-0.00125),h-0.00125,0,GOLD); }
  for(const sx of [-1,1]) for(const sz of [-1,1]) box(o,0.0025,h-hb,0.0025,sx*(w/2-0.00125),(h+hb)/2,sz*(d/2-0.00125),GOLD);
  reihe(o,7,{dz:d*0.84,y:hb-0.004,x:w*0.45,cols:[0x0f8a4a,0x0f8a4a],opt:{kc:GOLD,ringC:GOLD,seg:8},ende:-w*0.45});
  fol(o,new THREE.BoxGeometry(w*0.995,h-hb,d*0.995),tm(0,(h+hb)/2,0));
  return fertig(o); };

/* Leuchtturm: Klarsicht-Klappbox (Clamshell) mit Scharnier hinten,
   Rand und Druckknopf vorn - drin ein bedruckter Einleger */
VP_FORM.blinkstern=t=>{ const o=G(t), {w,h,d,a}=o, bw=w*0.97, bd=d*0.94, hm=h/2;
  const R=bogen(o,[{n:'e',w:bw*0.98,h:h*0.92,f:B(t)},{n:'u',w:bw*0.98,h:bd*0.9,f:(g,W,H)=>{ for(let i=0;i<12;i++){ g.fillStyle=i%2?'#f2f5ff':'#d8322a'; g.fillRect(W*i/12,0,W/12+1,H); } g.fillStyle='rgba(15,42,74,.55)'; g.fillRect(0,0,W,H); }},{n:'leer',w:0.02,h:0.02,f:flach(a.bg2)}]);
  dr(o,kiste(bw*0.98,h*0.92,0.002,{f:R.e,leer:R.leer}),tm(0,h*0.47,-bd*0.45));
  dr(o,kiste(bw*0.98,0.002,bd*0.9,{t:R.u,leer:R.leer}),tm(0,0.002,0));
  for(const k of [0,1]) fol(o,new THREE.BoxGeometry(bw,hm-0.001,bd),tm(0,k?hm+hm/2:hm/2,0));
  fol(o,new THREE.BoxGeometry(w,0.0025,d),tm(0,hm,0));
  const ED=0xdfe8f0; for(const sx of [-1,1]) for(const sz of [-1,1]) box(o,0.0012,h*0.96,0.0012,sx*bw/2,h/2,sz*bd/2,ED);
  zyl(o,0.0025,0.0025,w*0.9,6,0,hm,-d/2+0.0025,ED,0,0,PI/2);
  kugel(o,0.006,0,hm,d/2-0.004,ED,1,0.6,0.6);
  reihe(o,7,{dz:bd*0.62,z0:-bd*0.2,y:0.003,x:w*0.44,L:w*0.28,cols:[0xf2f5ff,0xd8322a],opt:{kc:0x5ce1ff,seg:7},ende:-w*0.44});
  return fertig(o); };

/* Silberregen: silbernes Blechetui mit runden Kanten, Deckelfalz und
   Scharnier, der Druck direkt aufs Blech */
VP_FORM.silberregen=t=>{ const o=G(t), {w,h,d,a,rnd}=o, rc=0.012, hb=h*0.97;
  const R=bogen(o,[{n:'f',w:w-2*rc,h:hb,f:(g,W,H)=>{ blech(g,W,H,rnd,'#c4cad2',true); teil(g,W*0.03,H*0.14,W*0.94,H*0.72,B(t)); rahmen(g,W*0.03,H*0.14,W*0.94,H*0.72,'#8f969e',Math.max(2,H*0.03)); }},
    {n:'m',w:0.08,h:0.08,f:(g,W,H)=>blech(g,W,H,rnd,'#c4cad2',true)},
    {n:'t',w:w-2*rc,h:d-2*rc,f:(g,W,H)=>{ blech(g,W,H,rnd,'#c4cad2',true); g.strokeStyle='rgba(80,90,100,.5)'; g.lineWidth=3; g.strokeRect(W*0.04,H*0.12,W*0.92,H*0.76); teil(g,W*0.06,H*0.16,W*0.36,H*0.68,(g2,w2,h2)=>{ if(typeof effektFoto==='function') effektFoto(g2,0,0,w2,h2,t,a,zufallAus(hashStr(t+'dk')),{stadt:false,einzeln:true}); }); rahmen(g,W*0.06,H*0.16,W*0.36,H*0.68,'#8f969e',3); titel(g,t,W*0.7,H*0.45,W*0.52,H*0.3,'#3a4048',null); nameText(g,a.sub||'',W*0.7,H*0.7,W*0.5,Math.round(H*0.1),FNT.bar,'#5a626c'); }}],{metal:0.55,rough:0.32});
  dr(o,kiste(w-2*rc,hb,d,{f:R.f,t:R.t,leer:R.m}),tm(0,hb/2,0)); dr(o,kiste(w,hb-0.002,d-2*rc,{leer:R.m,t:R.m}),tm(0,(hb-0.002)/2,0)); /* 03.10.: vorher gleich hoch wie der Deckel - Z-Fighting, der Deckeldruck flackerte weg */
  for(const sx of [-1,1]) for(const sz of [-1,1]) zyl(o,rc,rc,hb,10,sx*(w/2-rc),hb/2,sz*(d/2-rc),0xb9c0c8);
  box(o,w*1.002,0.0018,d-2*rc,0,hb*0.62,0,0x6e757f); box(o,w-2*rc,0.0018,d*1.004,0,hb*0.62,0,0x6e757f);
  zyl(o,0.003,0.003,w*0.8,8,0,hb*0.62,-d/2-0.001,0x8f969e,0,0,PI/2);
  return fertig(o); };

/* Glasbruch: liegender Sechskantkarton, das rechte Ende ist ein
   Klarsichtfenster auf die Raketenkoepfe */
VP_FORM.kristall=t=>{ const o=G(t), {w,h,d,a,rnd}=o, Rr=h/(2*0.866)*0.995, yc=h/2, sw=Rr, L=w-0.004;
  const facette=(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); for(let i=0;i<40;i++){ g.fillStyle=`rgba(${rnd()<0.5?'209,229,255':'120,170,230'},${0.06+rnd()*0.12})`; const x=rnd()*W, y=rnd()*H, s=H*(0.3+rnd()*0.6); g.beginPath(); g.moveTo(x,y); g.lineTo(x+s*0.8,y+s*0.2); g.lineTo(x+s*0.3,y+s); g.closePath(); g.fill(); } };
  const R=bogen(o,[{n:'f',w:L,h:sw,f:B(t)},{n:'u',w:L,h:sw,f:(g,W,H)=>{ facette(g,W,H); g.fillStyle='#f2f5ff'; g.textAlign='center'; g.textBaseline='middle'; fitFont(g,a.sub+' · KRISTALLKLAR',W*0.8,Math.round(H*0.4),BAR); g.fillText(a.sub+' · KRISTALLKLAR',W/2,H/2); }},
    {n:'t',w:L,h:sw,f:(g,W,H)=>{ facette(g,W,H); titel(g,t,W/2,H/2,W*0.6,H*0.6,a.ac); }},{n:'leer',w:L,h:sw,f:facette}]);
  prismaX(o,6,Rr,L-0.02,-0.008,yc,0,PI/6,(i)=>i===0?R.f:i===1?R.t:i===5?R.u:R.leer);
  zyl(o,Rr,Rr,0.003,6,-w/2+0.0035,yc,0,I(a.bg2),0,0,PI/2);
  zyl(o,Rr*1.01,Rr*1.01,0.004,6,w/2-0.022,yc,0,0xd1e5ff,0,0,PI/2,1,1,1);
  o.vc.push({geo:umdrehen(new THREE.CylinderGeometry(Rr*0.98,Rr*0.98,0.03,6,1,true)),m:tm(w/2-0.04,yc,0,0,0,-PI/2),color:0x02060f});
  fol(o,new THREE.CylinderGeometry(Rr,Rr,0.02,6,1,true),tm(w/2-0.012,yc,0,0,0,-PI/2)); fol(o,new THREE.CircleGeometry(Rr,6,0),tm(w/2-0.002,yc,0,0,PI/2,0));
  const r=Rr*0.2; [[0,0],[0,1.1],[0,-1.1],[0.95,0.55],[0.95,-0.55],[-0.95,0.55],[-0.95,-0.55]].forEach(([fy,fz],i)=>{
    rakete(o,w/2-0.003,yc+fy*r*1.9,fz*r*1.9,r,w*0.3,[0xd1e5ff,0xf2f5ff,0x8fd0ff][i%3],{lunte:false,seg:6,kc:0xf2f5ff}); });
  return fertig(o); };

/* Saphirkrone: Schraegfrontkarton - die Vorderseite liegt schraeg
   nach hinten wie ein Aufsteller, oben ein Saphir */
VP_FORM.regenbogenkrone=t=>{ const o=G(t), {w,h,d,a}=o, dz=d*0.42, zf=d/2, zt=d/2-dz, Lf=Math.hypot(h,dz), al=Math.atan2(dz,h);
  const R=bogen(o,[{n:'f',w,h:Lf,f:B(t)},{n:'b',w,h,f:seite(t)},{n:'t',w,h:d-dz,f:oben(t)},{n:'s',w:d,h,f:seite(t)}],{max:1500});
  dr(o,new THREE.PlaneGeometry(w,Lf),tm(0,h/2,(zf+zt)/2,-al,0,0),R.f);
  dr(o,new THREE.PlaneGeometry(w,h),tm(0,h/2,-d/2,0,PI,0),R.b);
  dr(o,new THREE.PlaneGeometry(w,d-dz),tm(0,h,(zt-d/2)/2,-PI/2,0,0),R.t);
  o.vc.push({geo:new THREE.PlaneGeometry(w,d),m:tm(0,0.0005,0,PI/2,0,0),color:0x040a1f});
  for(const s of [-1,1]){ const p=s>0?[[w/2,0,zf],[w/2,0,-d/2],[w/2,h,-d/2],[w/2,h,zt]]:[[-w/2,0,-d/2],[-w/2,0,zf],[-w/2,h,zt],[-w/2,h,-d/2]];
    dr(o,viereck(...p),tm(0,0,0),R.s); }
  o.vc.push({geo:new THREE.OctahedronGeometry(0.014,0),m:tm(w*0.36,h+0.0005-0.012,zt-0.014,0,0.4,0,1,0.9,1),color:0x2f5fd0});
  box(o,0.03,0.003,0.03,w*0.36,h+0.0015-0.003,zt-0.014,GOLD);
  return fertig(o); };

/* Mondfinsternis: schwarzer Karton mit Bullauge - durch das
   Chromfenster sieht man den Kopf der Jumbo-Rakete vor dem Blutmond */
VP_FORM.silbermond=t=>{ const o=G(t), {w,h,d,a}=o, hx=0.86, hr=0.36;
  const R=bogen(o,[{n:'f',w,h,f:(g,W,H)=>{ g.fillStyle='#0b0b0e'; g.fillRect(0,0,W,H); teil(g,0,0,W*0.74,H,B(t)); loch(g,[{x:W*hx,y:H*0.5,r:H*hr}],false); }},{n:'s',w:d,h,f:seite(t)},{n:'t',w,h:d,f:oben(t)}],{alpha:true,max:1500});
  dr(o,kiste(w,h,d,R),tm(0,h/2,0));
  const px=-w/2+w*hx, pr=h*hr;
  torus(o,pr*1.02,0.0045,px,h/2,d/2+0.0005,0xd7dbe0,0,0,0,28);
  einsatz(o,px-pr*1.2,px+pr*1.2,h*0.05,h*0.95,-d/2+0.004,d/2-0.002,0x0a0a0c);
  zyl(o,pr*0.75,pr*0.75,0.002,24,px+pr*0.3,h*0.62,-d/2+0.006,0xc0301c,PI/2,0,0);
  const r=Math.min(h*0.18,d*0.2); rakete(o,w*0.47,h*0.36,0,r,w*0.32,0x2a2d33,{kc:0x9aa3ad,ringC:0xd1e5ff,ende:-w*0.46,seg:14,st:0.008,sz:0});
  fol(o,new THREE.CircleGeometry(pr,24),tm(px,h/2,d/2-0.001));
  return fertig(o); };

/* Feuerdrache: Dreikantkarton mit Drachenzacken auf dem Grat */
VP_FORM.feuerdrache=t=>{ const o=G(t), {w,h,d,a}=o, hg=h*0.9, Lf=Math.hypot(hg,d/2), al=Math.atan2(d/2,hg);
  const R=bogen(o,[{n:'f',w,h:Lf,f:B(t)},{n:'b',w,h:Lf,f:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); for(let i=0;i<W/20;i++){ g.fillStyle='rgba(255,122,28,.12)'; g.beginPath(); g.arc(i*20+10,H*0.5+Math.sin(i)*H*0.2,H*0.18,0,PI); g.fill(); } titel(g,t,W/2,H/2,W*0.5,H*0.4,a.ac); }},{n:'s',w:d,h:hg,f:flach(a.bg2)}],{max:1500});
  dr(o,new THREE.PlaneGeometry(w,Lf),tm(0,hg/2,d/4,-al,0,0),R.f);
  dr(o,new THREE.PlaneGeometry(w,Lf),tm(0,hg/2,-d/4,al,PI,0),R.b);
  o.vc.push({geo:new THREE.PlaneGeometry(w,d),m:tm(0,0.0005,0,PI/2,0,0),color:0x1a0202});
  for(const s of [-1,1]){ const p=s>0?[[w/2,0,d/2],[w/2,0,-d/2],[w/2,hg,0]]:[[-w/2,0,-d/2],[-w/2,0,d/2],[-w/2,hg,0]]; dr(o,dreieck(...p),tm(0,0,0),R.s); }
  for(let i=0;i<9;i++){ const x=-w*0.42+i*w*0.105, hz=(h-hg)*(0.7+0.3*Math.sin(i*1.3)); zyl(o,0,0.012,hz+0.006,4,x,hg+hz/2-0.003,0,i%2?0xff7a1c:0xb01a0a,0,PI/4,0,1.6,1,0.5); }
  return fertig(o); };

/* Supernova: Alu-Koffer mit Kantenprofilen, Eckkappen, Schnapp-
   verschluessen und Tragegriff - vorn das Etikett */
VP_FORM.supernova=t=>{ const o=G(t), {w,h,d,a,rnd}=o, bh=h*0.86, bw=w*0.99, bd=d*0.96, sy=bh*0.62;
  const alu=(g,W,H)=>{ blech(g,W,H,rnd,'#b8bec6',true); g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=1; for(let x=0;x<W;x+=6){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+H*0.3,H); g.stroke(); } };
  const R=bogen(o,[{n:'f',w:bw,h:bh,f:(g,W,H)=>{ alu(g,W,H); teil(g,W*0.12,H*0.08,W*0.76,H*0.5,B(t)); rahmen(g,W*0.12,H*0.08,W*0.76,H*0.5,'#2a2d33',3); }},{n:'m',w:0.1,h:0.1,f:alu}],{metal:0.6,rough:0.3,max:1500});
  dr(o,kiste(bw,bh,bd,{f:R.f,leer:R.m}),tm(0,bh/2,0));
  const PR=0x22252b, e=0.006;
  for(const y of [e/2,bh-e/2,sy]) for(const s of [-1,1]){ box(o,bw+0.002,e,e,0,y,s*(bd/2),PR); box(o,e,e,bd,s*(bw/2),y,0,PR); }
  for(const sx of [-1,1]) for(const sz of [-1,1]){ box(o,e,bh,e,sx*bw/2,bh/2,sz*bd/2,PR); for(const y of [0.0095,bh-0.008]) kugel(o,0.009,sx*(bw/2-0.002),y,sz*(bd/2-0.002),0xd7dbe0,1,1,1,6,4); }
  for(const s of [-1,1]){ box(o,0.03,0.022,0.006,s*bw*0.36,sy,bd/2+0.002,0xd7dbe0); box(o,0.016,0.008,0.004,s*bw*0.36,sy-0.008,bd/2+0.0045,PR); }
  const gw=w*0.18; box(o,gw,0.012,0.022,0,h-0.007,0,PR); for(const s of [-1,1]) box(o,0.016,h-bh,0.026,s*gw*0.55,bh+(h-bh)/2-0.002,0,0x6e757f);
  return fertig(o); };

/* Himmelsgarbe: wie eine Garbe gebunden - die Raketen im
   Schrumpfschlauch, mittig eine breite Banderole, die Staebe gebuendelt */
VP_FORM.glitzerraketen=t=>{ const o=G(t), {w,h,d,a}=o, r=Math.min(h/4.3,d*0.9/8.2), cols=[0xffd23f,0xf2f5ff,0x12406b,0xffd23f,0xf2f5ff,0x12406b,0xffd23f];
  const pos=[[-1.5,0],[-0.5,0],[0.5,0],[1.5,0],[-1,1],[0,1],[1,1]];
  pos.forEach(([fz,fy],i)=>rakete(o,w*0.47,r+0.003+fy*r*1.85,fz*r*2.05,r,w*0.26,cols[i],{seg:8}));
  for(let i=0;i<7;i++) box(o,w*0.58,0.004,0.004,-w*0.2,h*0.38+(i%2)*0.006-0.003,(i-3)*0.0055,HOLZ);
  for(const x of [-0.42,-0.3]) torus(o,0.024,0.0022,x*w,h*0.38,0,0xd8322a,0,PI/2,0,12,1,0.5,1);
  fol(o,quetsch(w*0.6,h*0.5,d*0.47,0.05,12,12),tm(w*0.2,h*0.5,0));
  const bw=w*0.3, bb=h*0.98, bd=d*0.97;
  const R=bogen(o,[{n:'f',w:bw,h:bb,f:B(t)},{n:'b',w:bw,h:bb,f:seite(t)},{n:'t',w:bw,h:bd,f:oben(t)}]);
  bandX(o,bw,bb,bd,w*0.05,bb/2+0.001,0,R);
  return fertig(o); };

})();

/* Verpackungsformen (essen) - siehe 04-models.js VP_FORM
   03.10. (Tom: "Auch die Snacks: alles sieht gleich aus, nur anderer Text
   und etwas andere Farbe. Jede Verpackung soll so etwas Einzigartiges
   haben"): Essen und Getraenke bekommen echte Verpackungsarten nach
   Vorbildern aus dem Handel - Kissenbeutel, Standbodenbeutel, Netz,
   Dosen, Becher, Eimer, Schalen mit Haube, Traeger, Kasten, Giebelkarton,
   Holzkiste, Styroporbox ... Das Druckbild (wareFront, Motive 04f) bleibt
   und sitzt auf Etikett, Banderole oder Front; wo es passt, ist der
   Inhalt in 3D durch Folie, Fenster oder Netz zu sehen.
   Je Produkt hoechstens 4 Teile: ein Atlas (alles Bedruckte), vcMat
   (einfarbige Teile), folieKlar bzw. glassMat (durchsichtig). */
(()=>{
const PI=Math.PI, T2=PI*2;
const hx=s=>parseInt(String(s||'#888888').slice(1),16);

/* ---------- Atlas: mehrere bedruckte Flaechen in einer Textur ---------- */
/* regs: [{k, w, h (Meter), draw(g,W,H), q (Schaerfe-Faktor)}] -> {mat, uv:{k:[u0,v0,u1,v1]}} */
function mkAtlas(regs,o){
  o=o||{}; const TF=typeof TEX_FAKTOR!=='undefined'?TEX_FAKTOR:1, D=1800*TF, MX=Math.round((HIQ?900:512)*TF);
  const R=regs.map(r=>{ const q=r.q||(r.k==='h'?0.55:r.k==='s'?0.7:1); let pw=r.w*D*q, ph=r.h*D*q; const s=Math.min(1,(r.max?r.max*TF:MX)/Math.max(pw,ph)); return Object.assign({},r,{pw:Math.max(8,Math.round(pw*s)),ph:Math.max(8,Math.round(ph*s))}); });
  const pad=2, area=R.reduce((s,r)=>s+(r.pw+pad)*(r.ph+pad),0), maxW=R.reduce((m,r)=>Math.max(m,r.pw+pad),0);
  const W=Math.max(maxW,Math.ceil(Math.sqrt(area)*1.12));
  let x=0,y=0,sh=0; R.slice().sort((a,b)=>b.ph-a.ph).forEach(r=>{ if(x+r.pw+pad>W){ x=0; y+=sh; sh=0; } r.x=x; r.y=y; x+=r.pw+pad; sh=Math.max(sh,r.ph+pad); });
  const H=y+sh;
  const t=tex(W,H,(g)=>{ for(const r of R){ g.save(); g.beginPath(); g.rect(r.x,r.y,r.pw,r.ph); g.clip(); g.translate(r.x,r.y);
    try{ r.draw(g,r.pw,r.ph); }catch(e){ if(typeof console!=='undefined') console.warn('VP essen',r.k,e); } g.restore(); } });
  const uv={}; for(const r of R){ const i=0.6; uv[r.k]=[(r.x+i)/W,1-(r.y+r.ph-i)/H,(r.x+r.pw-i)/W,1-(r.y+i)/H]; }
  const mat=new THREE.MeshStandardMaterial({map:t,roughness:o.rough!==undefined?o.rough:0.55,metalness:o.metal||0});
  if(o.alpha) mat.alphaTest=0.5;
  if(o.double) mat.side=THREE.DoubleSide;
  return {mat,uv};
}
/* UV (0..1) einer Geometrie in ein Atlasfeld legen */
function uvR(geo,r){ const uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,r[0]+uv.getX(i)*(r[2]-r[0]),r[1]+uv.getY(i)*(r[3]-r[1])); return geo; }
/* Quader mit eigenem Feld je Seite (px nx py ny pz nz), fehlende -> F.alle */
function boxU(w,h,d,F){ const g=new THREE.BoxGeometry(w,h,d), uv=g.attributes.uv, ks=['px','nx','py','ny','pz','nz'];
  for(let f=0;f<6;f++){ const r=F[ks[f]]||F.alle; if(!r) continue; for(let i=0;i<4;i++){ const k=f*4+i; uv.setXY(k,r[0]+uv.getX(k)*(r[2]-r[0]),r[1]+uv.getY(k)*(r[3]-r[1])); } }
  return g; }
/* Quader ohne bestimmte Seiten (Huelle, Banderole, offene Schale) */
function boxOhne(w,h,d,F,ohne){ const g=boxU(w,h,d,F), ks=['px','nx','py','ny','pz','nz'], idx=g.index.array, neu=[];
  for(let f=0;f<6;f++){ if(ohne.indexOf(ks[f])>=0) continue; for(let i=0;i<6;i++) neu.push(idx[f*6+i]); }
  g.setIndex(neu); return g; }
/* Geometrie nach innen kehren (Innenseite einer Schachtel) */
function innen(g){ g=g.index?g:g; const ix=g.index.array; for(let i=0;i<ix.length;i+=3){ const q=ix[i+1]; ix[i+1]=ix[i+2]; ix[i+2]=q; } const n=g.attributes.normal; for(let i=0;i<n.array.length;i++) n.array[i]=-n.array[i]; return g; }
function geoAus(pos,uv,idx){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); return g; }
/* Flaeche aus fn(u,v)->[x,y,z]; u nach rechts, v nach oben -> Normale nach vorn */
function flaeche(nu,nv,fn){ const pos=[],uv=[],idx=[];
  for(let j=0;j<=nv;j++) for(let i=0;i<=nu;i++){ const u=i/nu,v=j/nv, p=fn(u,v); pos.push(p[0],p[1],p[2]); uv.push(u,v); }
  for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){ const a=j*(nu+1)+i,b=a+1,c=a+nu+2,d=a+nu+1; idx.push(a,b,c,a,c,d); }
  return geoAus(pos,uv,idx); }
/* Viereck p0 unten links, p1 unten rechts, p2 oben rechts, p3 oben links */
function quad(p0,p1,p2,p3){ return geoAus([...p0,...p1,...p2,...p3],[0,0,1,0,1,1,0,1],[0,1,2,0,2,3]); }
/* Ringpunkte: abgerundetes Rechteck (hw,hd,r) oder Ellipse (ell), ab hinten Mitte
   ueber links nach vorn (u=0.5 vorn Mitte) */
function ringPts(R,k){ const pts=[];
  if(R.ell){ const n=4*k; for(let i=0;i<=n;i++){ const an=-PI+i/n*T2; pts.push([R.hw*Math.sin(an),R.hd*Math.cos(an)]); } return pts; }
  const r=Math.min(R.r||0,R.hw,R.hd), cx=R.hw-r, cz=R.hd-r; pts.push([0,-R.hd]);
  for(const [x0,z0,a0] of [[-cx,-cz,-PI],[-cx,cz,-PI/2],[cx,cz,0],[cx,-cz,PI/2]]) for(let i=0;i<=k;i++){ const an=a0+i/k*PI/2; pts.push([x0+r*Math.sin(an),z0+r*Math.cos(an)]); }
  pts.push([0,-R.hd]); return pts; }
/* Mantel durch Ringe [{y,hw,hd,r|ell}]: u = Umfang, v = Hoehe */
function loft(rings,k){ k=k||4; const P=rings.map(R=>ringPts(R,k)), n=P[0].length, y0=rings[0].y, y1=rings[rings.length-1].y, pos=[],uv=[],idx=[];
  rings.forEach((R,j)=>{ const p=P[j]; const L=[0]; for(let i=1;i<n;i++) L.push(L[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1])); const tot=L[n-1]||1;
    for(let i=0;i<n;i++){ pos.push(p[i][0]+(R.x||0),R.y,p[i][1]+(R.z||0)); uv.push(L[i]/tot,(R.y-y0)/((y1-y0)||1)); } });
  for(let j=0;j<rings.length-1;j++) for(let i=0;i<n-1;i++){ const a=j*n+i,b=a+1,c=b+n,d=a+n; idx.push(a,b,c,a,c,d); }
  return geoAus(pos,uv,idx); }
/* Deckel/Boden eines Rings (uv eben: unten im Bild = vorn) */
function kappe(R,y,oben,k){ const p=ringPts(R,k||4), pos=[R.x||0,y,R.z||0], uv=[0.5,0.5], idx=[];
  p.forEach(q=>{ pos.push(q[0]+(R.x||0),y,q[1]+(R.z||0)); uv.push((q[0]+R.hw)/(2*R.hw),(R.hd-q[1])/(2*R.hd)); });
  for(let i=1;i<p.length;i++) oben?idx.push(0,i,i+1):idx.push(0,i+1,i); return geoAus(pos,uv,idx); }
/* Drehkoerper aus [[r,y],...] (von unten nach oben), vorn = u 0.5 */
function dreh(prof,seg,phi0,phiL){ const g=new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(Math.max(1e-4,r),y)),seg||12,phi0===undefined?-PI:phi0,phiL||T2); return g; }

/* ---------- Bauen ---------- */
function C(t){ const p=P[t]; return {t,p,a:p.art,w:p.dims[0],h:p.dims[1],d:p.dims[2],vc:[],pr:[],fo:[],gl:[],rnd:zufallAus(hashStr(t+'vpform'))}; }
const vc=(c,geo,m,col)=>{ c.vc.push({geo,m:m||tm(0,0,0),color:col}); };
const pr=(c,geo,m)=>{ c.pr.push({geo,m:m||tm(0,0,0)}); };
const fo=(c,geo,m)=>{ c.fo.push({geo,m:m||tm(0,0,0)}); };
const gl=(c,geo,m)=>{ c.gl.push({geo,m:m||tm(0,0,0)}); };
const kugel=(c,x,y,z,rx,ry,rz,col,ws,hs,rot)=>vc(c,new THREE.SphereGeometry(1,ws||8,hs||6),tm(x,y,z,rot?rot[0]:0,rot?rot[1]:0,rot?rot[2]:0,rx,ry,rz),col);
const ico=(c,x,y,z,r,col,sy,det)=>vc(c,new THREE.IcosahedronGeometry(r,det||0),tm(x,y,z,c.rnd()*3,c.rnd()*3,0,1,sy||1,1),col);
const zyl=(c,x,y,z,rt,rb,hh,col,seg,rx,ry,rz,offen)=>vc(c,new THREE.CylinderGeometry(rt,rb,hh,seg||12,1,!!offen),tm(x,y,z,rx||0,ry||0,rz||0),col);
const kiste=(c,x,y,z,w,h,d,col,rx,ry,rz)=>vc(c,new THREE.BoxGeometry(w,h,d),tm(x,y,z,rx||0,ry||0,rz||0),col);
const ring=(c,x,y,z,R,r,col,rx,ry,rz,seg,arc)=>vc(c,new THREE.TorusGeometry(R,r,5,seg||20,arc||T2),tm(x,y,z,rx===undefined?PI/2:rx,ry||0,rz||0),col);
function fertig(c,A,o){ const parts=[];
  if(c.pr.length&&A) parts.push({geo:merge(c.pr),mat:A.mat});
  if(c.vc.length) parts.push({geo:merge(c.vc),mat:vcMat});
  if(c.gl.length) parts.push({geo:merge(c.gl),mat:glassMat});
  if(c.fo.length) parts.push({geo:merge(c.fo),mat:(o&&o.folie)||folieKlar});
  return parts; }

/* ---------- Druckbilder ---------- */
const fVorn=c=>(g,W,H)=>drawFront(g,W,H,c.a,0);
const fSeite=c=>(g,W,H)=>drawSide(g,W,H,c.a);
const fOben=c=>(g,W,H)=>drawTop(g,W,H,c.a,0);
const fFarbe=f=>(g,W,H)=>{ g.fillStyle=f; g.fillRect(0,0,W,H); };
const fBild=(c,ohne)=>(g,W,H)=>wareBild(g,0,0,W,H,c.t,c.a,zufallAus(hashStr(c.t+'vpbild')),ohne);
function verlauf(g,W,H,c1,c2,quer){ const gr=quer?g.createLinearGradient(0,0,W,0):g.createLinearGradient(0,0,0,H); gr.addColorStop(0,c1); gr.addColorStop(1,c2); g.fillStyle=gr; g.fillRect(0,0,W,H); }
function strichcode(g,x,y,w,h,s){ g.fillStyle='#fff'; g.fillRect(x,y,w,h); g.fillStyle='#111'; let k=0; for(let xx=x+w*0.06;xx<x+w*0.94;k++){ const b=Math.max(1,w*0.012*(1+((s>>(k%24))&1)*1.4)); g.fillRect(xx,y+h*0.08,b,h*0.7); xx+=b+Math.max(1,w*0.012); } }
/* Rueckseite: Name, Zutaten-/Naehrwertfeld, Strichcode */
function rueck(c,hell){ return (g,W,H)=>{ const a=c.a; verlauf(g,W,H,hell?'#f4f1ea':a.bg2,hell?'#e2dccf':WZ.dunkel(a.bg2,0.3));
  WZ.txt(g,a.title||c.p.short,W/2,H*0.13,W*0.86,Math.min(H*0.11,W*0.16),WFNT.rund,hell?'#2b2b33':a.ac);
  g.fillStyle='rgba(255,255,255,.9)'; g.fillRect(W*0.1,H*0.26,W*0.8,H*0.42); g.fillStyle='#1b1b1b';
  WZ.txt(g,'Zutaten · Nährwerte',W*0.14,H*0.3,W*0.7,H*0.04,WFNT.kond,'#1b1b1b','left');
  for(let i=0;i<8;i++){ g.fillStyle='rgba(30,30,30,.5)'; g.fillRect(W*0.14,H*(0.35+i*0.04),W*(0.5+0.22*((i*37)%5)/5),Math.max(1,H*0.008)); }
  strichcode(g,W*0.5,H*0.76,W*0.38,H*0.14,hashStr(c.t)); }; }
/* Rundum-Etikett: Grund, vorn (u 0.5) das Druckbild in Breite anteil*W */
function fRund(c,anteil,grund,o){ o=o||{}; return (g,W,H)=>{ if(grund) grund(g,W,H); else verlauf(g,W,H,c.a.bg1,c.a.bg2);
  const fw=W*anteil, x0=(W-fw)/2; g.save(); g.translate(x0,o.y0||0); g.beginPath(); g.rect(0,0,fw,H-(o.y0||0)-(o.y1||0)); g.clip(); drawFront(g,fw,H-(o.y0||0)-(o.y1||0),c.a,0); g.restore();
  if(o.rueck!==false){ const bw=W*Math.min(0.3,(1-anteil)/2*0.8); g.save(); g.translate(W*0.02,H*0.08); rueck(c,o.hell)(g,bw,H*0.84); g.restore(); } }; }
/* Kraftpapier, Wellpappe, Holz, Styropor */
function kraft(g,W,H,f){ g.fillStyle=f||'#b98c58'; g.fillRect(0,0,W,H); const r=zufallAus(W*7+H);
  for(let i=0;i<W*H/60;i++){ g.fillStyle=`rgba(${r()<0.5?'90,60,30':'240,215,170'},${0.05+r()*0.08})`; g.fillRect(r()*W,r()*H,1+r()*4,1); } }
function holz(g,W,H,f,quer){ g.fillStyle=f||'#c9a06a'; g.fillRect(0,0,W,H); const r=zufallAus(W*3+H*5);
  for(let i=0;i<70;i++){ g.strokeStyle=`rgba(${r()<0.6?'110,70,30':'250,225,180'},${0.12+r()*0.18})`; g.lineWidth=Math.max(1,r()*3); g.beginPath();
    if(quer){ const y=r()*H; g.moveTo(0,y); g.bezierCurveTo(W*0.3,y+(r()-0.5)*H*0.05,W*0.6,y+(r()-0.5)*H*0.05,W,y+(r()-0.5)*H*0.04); }
    else { const x=r()*W; g.moveTo(x,0); g.bezierCurveTo(x+(r()-0.5)*W*0.05,H*0.3,x+(r()-0.5)*W*0.05,H*0.6,x+(r()-0.5)*W*0.04,H); } g.stroke(); } }
function styro(g,W,H){ g.fillStyle='#f4f5f2'; g.fillRect(0,0,W,H); const r=zufallAus(W+H*3); const s=Math.max(3,Math.min(W,H)*0.025);
  for(let y=0;y<H;y+=s) for(let x=(y/s%2)*s/2;x<W;x+=s){ g.strokeStyle=`rgba(150,155,150,${0.12+r()*0.12})`; g.lineWidth=1; g.beginPath(); g.arc(x+r()*2,y+r()*2,s*0.5,0,T2); g.stroke(); } }
/* Etikett mit Druckbild in einem Rahmen (fuer Aufkleber/Anhaenger) */
function fEtikett(c,rand,rund){ return (g,W,H)=>{ g.fillStyle=rand||'#ffffff'; g.fillRect(0,0,W,H); const m=Math.max(1,Math.min(W,H)*0.05);
  g.save(); g.translate(m,m); g.beginPath(); if(rund) WZ.rr(g,0,0,W-2*m,H-2*m,Math.min(W,H)*0.1); else g.rect(0,0,W-2*m,H-2*m); g.clip(); drawFront(g,W-2*m,H-2*m,c.a,0); g.restore(); }; }
/* Loch (Euroloch/Fenster/Griff) ausstanzen */
function stanz(g,fn){ g.save(); g.globalCompositeOperation='destination-out'; g.fillStyle='#000'; g.globalAlpha=1; g.beginPath(); fn(g); g.fill(); g.restore(); }
function euroloch(g,cx,cy,s){ stanz(g,g2=>{ g2.ellipse(cx-s*0.55,cy,s*0.35,s*0.35,0,0,T2); g2.moveTo(cx+s*0.9,cy); g2.ellipse(cx+s*0.55,cy,s*0.35,s*0.35,0,0,T2); g2.rect(cx-s*0.55,cy-s*0.2,s*1.1,s*0.4); }); }
/* Siegelnaht mit Riffelung (Beutel) */
function riffel(g,y,h,W,f){ g.fillStyle=f; g.fillRect(0,y,W,h); const s=Math.max(2,h*0.18); for(let x=0;x<W;x+=s){ g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x,y,s*0.45,h); g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(x+s*0.5,y,s*0.2,h); } }

/* =================== Knabberzeug und Suesses =================== */

/* Kissenbeutel (Chipstuete): zwei gewoelbte Folienhaelften, oben und
   unten gequetschte Siegelnaht mit Riffelung, glaenzende Metallfolie */
function kissenForm(w,h,d,sn,o){ o=o||{};
  const body=v=>{ const y=v*h; if(y<sn||y>h-sn) return 0; return Math.pow(Math.sin(PI*(y-sn)/(h-2*sn)),o.ex||0.5); };
  const fn=s=>(u,v)=>{ const b=body(v), q=Math.pow(Math.sin(PI*u),0.42); return [(u-0.5)*w*(1-0.07*b*(1-Math.abs(2*u-1)*0.3)),v*h,s*(d/2)*0.985*q*b]; };
  return {vorn:flaeche(o.nu||14,o.nv||18,fn(1)),hinten:flaeche(o.nu||14,o.nv||18,(u,v)=>{ const p=fn(-1)(1-u,v); return p; })}; }
VP_FORM.chips=t=>{ const c=C(t), a=c.a, {w,h,d}=c, sn=h*0.075;
  const naht=(g,W,H)=>{ const s=H*sn/h; riffel(g,0,s,W,a.ac2); riffel(g,H-s,s,W,a.ac2); };
  const A=mkAtlas([
    {k:'v',w,h,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); const s=H*sn/h; g.save(); g.translate(W*0.05,s*1.25); drawFront(g,W*0.9,H-s*2.5,a,0); g.restore(); naht(g,W,H);
      /* Aufreisskerbe und Glanzstreifen der Folie */ g.fillStyle='rgba(0,0,0,.5)'; g.beginPath(); g.moveTo(0,s*1.1); g.lineTo(W*0.035,s*1.25); g.lineTo(0,s*1.4); g.fill();
      WZ.glanz(g,W*0.12,s,W*0.1,H-2*s,0.18); }},
    {k:'h',w,h,draw:(g,W,H)=>{ const s=H*sn/h; rueck(c)(g,W,H); naht(g,W,H); }}
  ],{rough:0.3,metal:0.25});
  const K=kissenForm(w,h,d,sn); pr(c,uvR(K.vorn,A.uv.v)); pr(c,uvR(K.hinten,A.uv.h));
  return fertig(c,A); };

/* Salzgebaeck: zwei Klarsicht-Roehren mit roten Kappen in einem bedruckten
   Kartonsleeve - oben und unten sieht man die Stangen */
VP_FORM.salzstangen=t=>{ const c=C(t), a=c.a, {w,h,d}=c, r=Math.min(d/2*0.97,w/4*0.97), xs=[-w/4,w/4], sy0=h*0.2, sy1=h*0.78;
  const A=mkAtlas([{k:'v',w,h:sy1-sy0,draw:fVorn(c)},{k:'s',w:d,h:sy1-sy0,draw:fSeite(c)},{k:'h',w,h:sy1-sy0,draw:rueck(c)}],{rough:0.6});
  pr(c,boxOhne(w*0.995,sy1-sy0,d*0.995,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s},['py','ny']),tm(0,(sy0+sy1)/2,0));
  const kh=h*0.07;
  for(const x of xs){
    gl(c,new THREE.CylinderGeometry(r*0.97,r*0.97,h-2*kh,16,1,true),tm(x,h/2,0));
    for(const [y,s] of [[kh/2,1],[h-kh/2,-1]]){ zyl(c,x,y,0,r,r,kh,0xd8322a,16); zyl(c,x,y-s*kh*0.52,0,r*0.9,r*0.9,0.002,0xb02018,16); }
    /* Stangen und ein paar Brezeln */
    for(let i=0;i<9;i++){ const an=i/9*T2+c.rnd()*0.4, rr=i?r*0.55:0; zyl(c,x+Math.cos(an)*rr,h/2,Math.sin(an)*rr,0.0042,0.0042,h-2*kh-0.006,i%3?0xc98a3c:0xb87430,5,(c.rnd()-0.5)*0.05,0,(c.rnd()-0.5)*0.05); }
  }
  return fertig(c,A); };

/* Popcorn: rot-weiss gestreifte Kinobox, oben quillt das Popcorn unter
   einer Klarsichthaube heraus */
VP_FORM.popcorn=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.8, rB={hw:w*0.4,hd:d*0.4,r:0.004}, rT={hw:w*0.492,hd:d*0.49,r:0.004};
  const streifen=(g,W,H)=>{ const n=26; for(let i=0;i<n;i++){ g.fillStyle=i%2?'#f6f2e8':'#d0201f'; g.fillRect(i*W/n,0,W/n+1,H); } g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(0,H*0.96,W,H*0.04); };
  const A=mkAtlas([{k:'m',w:2*(w+d)*0.9,h:bh,draw:streifen,max:700},
    {k:'v',w:w*0.9,h:bh,draw:(g,W,H)=>{ streifen(g,W*3.4,H); const m=W*0.07; g.save(); WZ.rr(g,m,H*0.16,W-2*m,H*0.74,W*0.06); g.fillStyle='#fff'; g.fill(); g.clip(); g.translate(m*1.4,H*0.16+m*0.4); drawFront(g,W-2.8*m,H*0.74-m*0.8,a,0); g.restore();
      g.fillStyle='#d0201f'; WZ.rr(g,W*0.2,H*0.03,W*0.6,H*0.1,H*0.03); g.fill(); WZ.txt(g,'KINO-BOX',W/2,H*0.08,W*0.5,H*0.07,WFNT.rund,'#fff'); }}],{rough:0.45});
  pr(c,uvR(loft([Object.assign({y:0},rB),Object.assign({y:bh},rT)],1),A.uv.m));
  pr(c,uvR(quad([-rB.hw,0.002,rB.hd+0.0015],[rB.hw,0.002,rB.hd+0.0015],[rT.hw,bh-0.002,rT.hd+0.0015],[-rT.hw,bh-0.002,rT.hd+0.0015]),A.uv.v));
  vc(c,kappe(rB,0.001,false,1),tm(0,0,0),0xd0201f);
  /* Popcornberg */
  const n=70; for(let i=0;i<n;i++){ const an=c.rnd()*T2, q=Math.sqrt(c.rnd()), x=Math.sin(an)*q*rT.hw*0.92, z=Math.cos(an)*q*rT.hd*0.85, berg=1-q*q;
    const r=0.011+c.rnd()*0.006, y=bh-0.01+berg*(h-bh-0.02)*0.95+c.rnd()*0.008; ico(c,x,Math.min(y,h-r),z,r,c.rnd()<0.25?0xe8b84a:c.rnd()<0.5?0xfff2c8:0xfbe3a0,0.85); }
  fo(c,loft([{y:bh-0.004,hw:rT.hw*1.01,hd:rT.hd*1.02,r:0.01},{y:bh+(h-bh)*0.55,hw:rT.hw*0.96,hd:rT.hd*0.98,r:0.03},{y:h*0.997,hw:rT.hw*0.55,hd:rT.hd*0.6,r:0.03}],3));
  fo(c,kappe({hw:rT.hw*0.55,hd:rT.hd*0.6,r:0.03},h*0.997,true,3));
  return fertig(c,A); };

/* Erdnuesse: Weissblechdose mit Klarsicht-Stuelpdeckel, darunter die
   bedruckte Aufreissmembran */
VP_FORM.erdnuesse=t=>{ const c=C(t), a=c.a, {w,h,d}=c, R=Math.min(w,d)/2*0.985, ch=h*0.83, Cu=T2*R;
  const A=mkAtlas([{k:'m',w:Cu,h:ch*0.9,draw:fRund(c,0.3),max:900},
    {k:'o',w:2*R,h:2*R,draw:(g,W,H)=>{ g.fillStyle='#c9a64a'; g.fillRect(0,0,W,H); g.save(); g.beginPath(); g.arc(W/2,H/2,W*0.42,0,T2); g.clip(); wareBild(g,0,0,W,H,c.t,a,zufallAus(7)); g.restore();
      g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=W*0.02; g.beginPath(); g.arc(W/2,H/2,W*0.43,0,T2); g.stroke();
      WZ.rr(g,W*0.36,H*0.86,W*0.28,H*0.1,H*0.03); g.fillStyle='#d8d8dc'; g.fill(); WZ.txt(g,'HIER ÖFFNEN',W/2,H*0.91,W*0.26,H*0.05,WFNT.kond,'#333'); }}],{rough:0.35,metal:0.3});
  pr(c,uvR(new THREE.CylinderGeometry(R,R,ch*0.9,28,1,true,-PI,T2),A.uv.m),tm(0,ch*0.5,0));
  vc(c,dreh([[R*0.9,0],[R*0.995,0.002],[R,0.008],[R*0.985,ch*0.05],[R*0.985,ch*0.95],[R,ch*0.985],[R*0.94,ch]],28),tm(0,0,0),0xc5c8ce);
  pr(c,uvR(new THREE.CircleGeometry(R*0.94,28),A.uv.o),tm(0,ch-0.003,0,-PI/2,0,0));
  vc(c,new THREE.CircleGeometry(R*0.9,20),tm(0,0.0015,0,PI/2,0,0),0x9a9ea6);
  /* Stuelpdeckel aus Klarsicht-Kunststoff */
  fo(c,dreh([[R*0.995,ch-0.012],[R*0.995,h*0.985],[R*0.9,h]],28));
  fo(c,new THREE.CircleGeometry(R*0.9,28),tm(0,h,0,-PI/2,0,0));
  ring(c,0,ch-0.006,0,R*0.995,0.0012,0xe8eaee);
  return fertig(c,A); };

/* Fruchtgummi: Standbodenbeutel mit Zipper, Euroloch und Sichtfenster in
   Baerchenform - darin die bunten Baerchen */
function standbeutel(w,h,d,sn,o){ o=o||{}; const ys=h-sn;
  const z=(u,v)=>{ const y=v*h; if(y>=ys) return 0; return (d/2)*0.97*Math.pow(Math.sin(PI*u),0.38)*Math.pow(1-y/ys,0.55); };
  const x=(u,v)=>(u-0.5)*w*(1-0.05*(z(u,v)/(d/2)));
  const nu=o.nu||14, nv=o.nv||16;
  return {vorn:flaeche(nu,nv,(u,v)=>[x(u,v),v*h,z(u,v)]),hinten:flaeche(nu,nv,(u,v)=>[x(1-u,v),v*h,-z(1-u,v)]),
    boden:flaeche(nu,4,(u,v)=>[x(u,0),0.0005,z(u,0)*(2*v-1)]),z,x}; }
VP_FORM.gummibaerchen=t=>{ const c=C(t), a=c.a, {w,h,d}=c, sn=h*0.12;
  const fenster=(g,W,H)=>{ /* grosses Baerchen als Fenster */ const cx=W*0.5, cy=H*0.74, s=W*0.2;
    g.ellipse(cx,cy+s*0.35,s*0.95,s*0.85,0,0,T2); g.moveTo(cx+s*0.62,cy-s*0.62); g.ellipse(cx,cy-s*0.62,s*0.62,s*0.55,0,0,T2);
    g.moveTo(cx-s*0.3,cy-s*1.05); g.ellipse(cx-s*0.48,cy-s*1.05,s*0.2,s*0.2,0,0,T2); g.moveTo(cx+s*0.68,cy-s*1.05); g.ellipse(cx+s*0.48,cy-s*1.05,s*0.2,s*0.2,0,0,T2); };
  const A=mkAtlas([
    {k:'v',w,h,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); const s=H*sn/h; g.save(); g.translate(W*0.04,s*1.2); drawFront(g,W*0.92,H*0.44,a,0); g.restore();
      riffel(g,0,s*0.55,W,heller(a.bg2,0.2)); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,s*0.85,W,Math.max(2,s*0.08)); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,s*0.95,W,Math.max(1,s*0.04));
      g.save(); g.beginPath(); fenster(g,W,H); g.lineWidth=W*0.03; g.strokeStyle=a.ac; g.stroke(); g.restore();
      stanz(g,g2=>fenster(g2,W,H)); euroloch(g,W/2,s*0.32,W*0.07);
      WZ.txt(g,'mit Sichtfenster',W*0.5,H*0.97,W*0.6,H*0.03,WFNT.kond,'#fff'); }},
    {k:'h',w,h,draw:(g,W,H)=>{ rueck(c)(g,W,H); const s=H*sn/h; riffel(g,0,s*0.55,W,heller(a.bg2,0.2)); euroloch(g,W/2,s*0.32,W*0.07); }},
    {k:'b',w,h:d,draw:fFarbe(a.bg2)}],{rough:0.32,metal:0.15,alpha:true,double:true});
  const B=standbeutel(w,h,d,sn); pr(c,uvR(B.vorn,A.uv.v)); pr(c,uvR(B.hinten,A.uv.h)); pr(c,uvR(B.boden,A.uv.b));
  fo(c,B.vorn.clone(),tm(0,0,0.0008));
  /* Baerchen: Bauch und Kopf */
  const farben=[0xe0201c,0xffc21a,0x2fbf3a,0xff7a1a,0xf6f0d8,0xd0206a];
  for(let i=0;i<26;i++){ const v=0.03+c.rnd()*0.36, u=0.22+c.rnd()*0.56, zz=B.z(u,v)*(c.rnd()*1.5-0.75), x=B.x(u,v), y=v*h, s=0.011, rz=(c.rnd()-0.5)*1.4, col=farben[i%farben.length];
    const ux=Math.sin(rz), uy=Math.cos(rz);
    vc(c,new THREE.IcosahedronGeometry(s,0),tm(x,y,zz,0,0,rz,1,1.25,0.75),col); vc(c,new THREE.IcosahedronGeometry(s*0.72,0),tm(x-ux*s*1.4,y+uy*s*1.4,zz,0,0,rz,1,1,0.75),col); }
  return fertig(c,A); };

/* Schoko-Taler: Netzbeutel mit Goldtalern, oben die gefaltete Reiterkarte */
VP_FORM.schokotaler=t=>{ const c=C(t), a=c.a, {w,h,d}=c, kh=h*0.24, kw=w*0.8, nh=h-kh*0.85;
  const A=mkAtlas([{k:'v',w:kw,h:kh,draw:(g,W,H)=>{ drawFront(g,W,H,a,0); euroloch(g,W/2,H*0.12,W*0.07); }},{k:'h',w:kw,h:kh,draw:(g,W,H)=>{ rueck(c)(g,W,H); euroloch(g,W/2,H*0.12,W*0.07); }},
    {k:'n',w:w,h:nh,q:0.8,draw:(g,W,H)=>{ g.clearRect(0,0,W,H); g.strokeStyle='#b01818'; g.lineWidth=Math.max(1.2,W*0.008); const s=W/11;
      for(let i=-12;i<24;i++){ g.beginPath(); g.moveTo(i*s,0); g.lineTo(i*s+H*0.7,H); g.stroke(); g.beginPath(); g.moveTo(i*s,0); g.lineTo(i*s-H*0.7,H); g.stroke(); } }}],{rough:0.5,alpha:true,double:true});
  /* Netz: oben unter der Karte zusammengerafft, unten bauchig */
  const zN=(u,v)=>(d/2)*0.95*Math.pow(Math.sin(PI*u),0.5)*Math.pow(Math.sin(PI*Math.min(1,v*0.92+0.08)),0.7)*(v>0.85?Math.max(0.15,(1-v)/0.15):1);
  const xN=(u,v)=>(u-0.5)*w*0.97*(v<0.7?1:1-(v-0.7)/0.3*(1-kw*0.7/w));
  pr(c,uvR(flaeche(12,12,(u,v)=>[xN(u,v),v*nh,zN(u,v)]),A.uv.n)); pr(c,uvR(flaeche(12,12,(u,v)=>[xN(1-u,v),v*nh,-zN(1-u,v)]),A.uv.n));
  /* Reiterkarte, ueber den Netzzipfel gefaltet */
  const y0=h-kh; pr(c,uvR(quad([-kw/2,y0,0.006],[kw/2,y0,0.006],[kw/2,h,0.0012],[-kw/2,h,0.0012]),A.uv.v)); pr(c,uvR(quad([kw/2,y0,-0.006],[-kw/2,y0,-0.006],[-kw/2,h,-0.0012],[kw/2,h,-0.0012]),A.uv.h));
  kiste(c,0,y0+0.003,0,kw*0.25,0.006,0.008,0xc8ccd2);
  /* Taler: Goldscheiben, unten gehaeuft */
  for(let i=0;i<30;i++){ const v=0.06+Math.pow(c.rnd(),1.4)*0.6, u=0.18+c.rnd()*0.64, zz=zN(u,v)*(c.rnd()*1.2-0.6), r=0.017+c.rnd()*0.004;
    zyl(c,xN(u,v),Math.max(r+0.002,v*nh),zz,r,r,0.0035,i%5?0xa8720c:0xc28a12,12,PI/2+(c.rnd()-0.5)*1.2,c.rnd()*PI,(c.rnd()-0.5)*0.8); }
  return fertig(c,A); };

/* Berliner: goldene Konditorschale, darueber die Klarsichthaube mit
   aufgeklebtem Etikett - vier Berliner mit Zuckerhaube */
VP_FORM.berliner=t=>{ const c=C(t), a=c.a, {w,h,d}=c, th=h*0.26;
  const A=mkAtlas([{k:'e',w:w*0.62,h:h*0.42,draw:fEtikett(c,'#e8c35a',true)},
    {k:'g',w:2*(w+d)*0.8,h:th,q:0.6,draw:(g,W,H)=>{ verlauf(g,W,H,'#f2d27a','#a8781e'); for(let x=0;x<W;x+=H*0.5){ g.fillStyle='rgba(255,255,255,.22)'; g.beginPath(); g.arc(x,H*0.15,H*0.22,0,PI); g.fill(); } }}],{rough:0.4,metal:0.3});
  const rb=[{y:0,hw:w*0.43,hd:d*0.43,r:0.02},{y:th,hw:w*0.497,hd:d*0.497,r:0.026}];
  pr(c,uvR(loft(rb,3),A.uv.g)); vc(c,kappe(rb[0],0.001,true,3),tm(0,0,0),0xd8b050);
  const rr=Math.min(w,d)*0.235;
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const x=sx*w*0.235, z=sz*d*0.235, y=th*0.35+rr*0.6;
    kugel(c,x,y,z,rr,rr*0.62,rr,0xc8843a,12,8);
    ring(c,x,y-rr*0.05,z,rr*0.98,rr*0.07,0xf0d6a0,PI/2,0,0,18);
    vc(c,new THREE.SphereGeometry(1,12,4,0,T2,0,PI*0.32),tm(x,y+rr*0.06,z,0,0,0,rr*0.99,rr*0.6,rr*0.99),0xfbf7f0);
    kugel(c,x+sx*rr*0.2,y-rr*0.1,z+rr*0.95,rr*0.13,rr*0.1,rr*0.06,0x9a1424,6,4); }
  const hb=[{y:th*0.92,hw:w*0.4985,hd:d*0.4985,r:0.028},{y:h*0.8,hw:w*0.485,hd:d*0.485,r:0.04},{y:h*0.995,hw:w*0.43,hd:d*0.43,r:0.05}];
  fo(c,loft(hb,4)); fo(c,kappe(hb[2],h*0.995,true,4));
  const ey0=th*1.05, ey1=th*1.05+h*0.38; pr(c,uvR(quad([-w*0.31,ey0,d*0.4995],[w*0.31,ey0,d*0.4995],[w*0.31,ey1,d*0.492],[-w*0.31,ey1,d*0.492]),A.uv.e));
  return fertig(c,A); };

/* Neujahrsbrezel: liegende Baeckertuete aus Kraftpapier, vorn auf dem
   Blockboden das Etikett, oben ein Sichtfenster auf die Brezel, hinten
   die umgeschlagene Lasche mit Siegel */
VP_FORM.neujahrsbrezel=t=>{ const c=C(t), a=c.a, {w,h,d}=c;
  const R=[{y:0,hw:w*0.49,hd:d*0.48,r:0.01},{y:h*0.45,hw:w*0.5,hd:d*0.495,r:0.014},{y:h*0.9,hw:w*0.488,hd:d*0.478,r:0.02},{y:h*0.995,hw:w*0.465,hd:d*0.455,r:0.024}];
  const fx=0.36, fz=0.3;
  const A=mkAtlas([{k:'m',w:2*(w+d),h,q:0.5,draw:(g,W,H)=>kraft(g,W,H)},{k:'b',w,h:d,q:0.3,draw:(g,W,H)=>kraft(g,W,H,'#a87c4a')},
    {k:'v',w:w*0.92,h:h*0.86,draw:fEtikett(c,'#f3e6cc')},
    {k:'o',w:2*R[3].hw,h:2*R[3].hd,draw:(g,W,H)=>{ kraft(g,W,H); const fw=W*fx*2, fh=H*fz*2, x0=W/2-fw/2-W*0.12, y0=H/2-fh/2;
      g.fillStyle=a.bg2; for(let i=0;i<3;i++) g.fillRect(0,H*(0.05+i*0.035),W,H*0.012);
      g.save(); g.translate(W*0.9,H*0.5); g.rotate(-PI/2); WZ.txt(g,'BÄCKEREI',0,0,H*0.7,W*0.08,WFNT.serif,'#5a3a1a'); g.restore();
      WZ.txt(g,a.title,x0+fw/2,y0+fh+H*0.08,fw,H*0.08,WFNT.rund,a.bg2);
      g.strokeStyle='#fff'; g.lineWidth=W*0.012; WZ.rr(g,x0,y0,fw,fh,H*0.08); g.stroke();
      stanz(g,g2=>WZ.rr(g2,x0,y0,fw,fh,H*0.08)); }}],{rough:0.85,alpha:true,double:true});
  pr(c,uvR(loft(R,3),A.uv.m)); pr(c,uvR(kappe(R[3],R[3].y,true,3),A.uv.o)); pr(c,uvR(kappe(R[0],0.0008,false,3),A.uv.b));
  fo(c,new THREE.PlaneGeometry(w*fx*2*R[3].hw*2/w,d*fz*2*R[3].hd*2/d),tm(-0.12*R[3].hw*2,h*0.99,0,-PI/2,0,0));
  pr(c,uvR(quad([-w*0.44,h*0.08,d*0.4965],[w*0.44,h*0.08,d*0.4965],[w*0.44,h*0.86,d*0.4955],[-w*0.44,h*0.86,d*0.4955]),A.uv.v));
  /* umgeschlagene Lasche hinten und Siegel */
  kiste(c,0,h*0.993,-d*0.4,w*0.88,0.002,d*0.1,0xa57a48); kiste(c,0,h*0.996,-d*0.37,w*0.1,0.002,d*0.06,0xc8322a);
  /* Brezel aus Hefeteig, liegend, mit Hagelzucker */
  const bx=-0.12*R[3].hw*2, by=h*0.32, braun=0xb8692a;
  ring(c,bx,by,0.008,0.07,0.012,braun,PI/2,0,0,22,PI*1.55); 
  vc(c,new THREE.TorusGeometry(0.07,0.012,6,22,PI*1.55),tm(bx,by,0.008,PI/2,0,PI*0.72,1.25,1,1),braun);
  for(const s of [-1,1]){ ring(c,bx+s*0.04,by+0.004,-0.008,0.032,0.0105,braun,PI/2,0,0,16);
    zyl(c,bx+s*0.02,by+0.006,0.035,0.0095,0.0095,0.07,braun,6,PI/2,0,s*0.55); }
  for(let i=0;i<22;i++){ const an=c.rnd()*T2, r=0.03+c.rnd()*0.06; ico(c,bx+Math.cos(an)*r*1.2,by+0.012,Math.sin(an)*r*0.7,0.0025,0xfbfaf4); }
  return fertig(c,A); };

/* Aufback-Baguette: vier Stangen in Schutzfolie, in der Mitte eine
   Papierbanderole mit dem Druckbild */
VP_FORM.baguette=t=>{ const c=C(t), a=c.a, {w,h,d}=c, L=w*0.95, ry=h*0.235, rz=d*0.235, bw=w*0.43;
  const A=mkAtlas([{k:'v',w:bw,h,draw:fVorn(c)},{k:'o',w:bw,h:d,draw:(g,W,H)=>{ kraft(g,W,H,'#e9d6b0'); WZ.txt(g,a.title,W/2,H/2,W*0.86,H*0.3,WFNT.rund,a.ac); }},{k:'h',w:bw,h,draw:rueck(c,true)}],{rough:0.75});
  const prof=[]; for(let i=0;i<=8;i++){ const q=i/8; prof.push([Math.pow(Math.sin(PI*(0.04+q*0.92)),0.4),(q-0.5)]); }
  for(const [yy,zz] of [[ry,-rz*1.02],[ry,rz*1.02],[ry*3.02,-rz*1.02],[ry*3.02,rz*1.02]]){
    vc(c,dreh(prof,9),tm(0,yy,zz,0,0,PI/2,ry,L,rz),0xc9802e);
    if(yy>ry*2) for(let k=0;k<5;k++) kugel(c,-L*0.34+k*L*0.17,yy+ry*0.82,zz,L*0.05,ry*0.18,rz*0.32,0xf0d8a6,8,4,[0,0.5,0]); }
  const R=[{y:0.0005,hw:w*0.495,hd:d*0.47,r:0.03},{y:h*0.5,hw:w*0.499,hd:d*0.499,r:0.045},{y:h*0.998,hw:w*0.49,hd:d*0.45,r:0.04}];
  fo(c,loft(R,3)); fo(c,kappe(R[2],R[2].y,true,3));
  pr(c,boxOhne(bw,h*0.998,d*0.998,{pz:A.uv.v,nz:A.uv.h,py:A.uv.o,ny:A.uv.o},['px','nx']),tm(w*0.12,h/2,0));
  return fertig(c,A); };

/* Cracker: rechteckige Blechdose mit Stuelpdeckel - Rundumdruck, Deckel
   mit eigenem Bild */
VP_FORM.cracker=t=>{ const c=C(t), a=c.a, {w,h,d}=c, rk=0.014, B={hw:w*0.488,hd:d*0.478,r:rk}, D={hw:w*0.4995,hd:d*0.4995,r:rk*1.1}, yl=h*0.74;
  const per=4*(B.hw-rk)+4*(B.hd-rk)+T2*rk, ant=(2*B.hw)/per;
  const A=mkAtlas([{k:'m',w:per,h:yl,draw:fRund(c,ant,null,{rueck:true})},
    {k:'l',w:per,h:h-yl,q:0.5,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg2,WZ.dunkel(a.bg2,0.3)); g.fillStyle=a.ac2; g.fillRect(0,H*0.1,W,H*0.08); g.fillRect(0,H*0.82,W,H*0.08);
      for(let x=0;x<W;x+=H*0.6){ WZ.stern(g,x,H*0.5,H*0.16,a.ac2,4); } }},
    {k:'o',w:2*D.hw,h:2*D.hd,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg2,a.bg1); g.save(); WZ.rr(g,W*0.06,H*0.1,W*0.88,H*0.8,H*0.12); g.clip(); wareBild(g,W*0.06,H*0.1,W*0.88,H*0.8,c.t,a,zufallAus(3)); g.restore();
      g.strokeStyle=a.ac2; g.lineWidth=H*0.03; WZ.rr(g,W*0.06,H*0.1,W*0.88,H*0.8,H*0.12); g.stroke(); WZ.txt(g,a.title,W/2,H*0.8,W*0.6,H*0.14,WFNT.rund,'#fff','center','rgba(0,0,0,.6)'); }}],{rough:0.32,metal:0.35});
  pr(c,uvR(loft([Object.assign({y:0.004},B),Object.assign({y:yl},B)],4),A.uv.m));
  vc(c,loft([{y:0,hw:B.hw*0.98,hd:B.hd*0.97,r:rk},{y:0.005,hw:B.hw*1.005,hd:B.hd*1.008,r:rk}],4),tm(0,0,0),0x8a8f96);
  vc(c,kappe(B,0.0008,false,4),tm(0,0,0),0x9aa0a8);
  pr(c,uvR(loft([Object.assign({y:yl-0.004},D),Object.assign({y:h-0.004},D)],4),A.uv.l));
  vc(c,loft([Object.assign({y:h-0.004},D),{y:h,hw:D.hw-0.003,hd:D.hd-0.003,r:rk}],4),tm(0,0,0),parseInt(a.bg2.slice(1),16));
  pr(c,uvR(kappe({hw:D.hw-0.003,hd:D.hd-0.003,r:rk},h,true,4),A.uv.o));
  return fertig(c,A); };

/* Glueckskekse: Asia-Faltschachtel - nach oben breiter, oben die vier
   eingeschlagenen Laschen, darueber der Drahtbuegel */
VP_FORM.glueckskekse=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.7, B={hw:w*0.35,hd:d*0.36,r:0.002}, T={hw:w*0.497,hd:d*0.495,r:0.002}, rot='#b81c1c';
  const muster=(g,W,H)=>{ g.fillStyle=rot; g.fillRect(0,0,W,H); g.strokeStyle='rgba(255,210,63,.55)'; g.lineWidth=Math.max(1,H*0.012); const s=H*0.18;
    for(let y=s/2;y<H;y+=s) for(let x=((y/s)%2)*s/2;x<W;x+=s){ g.beginPath(); g.arc(x,y,s*0.3,PI,T2); g.stroke(); g.beginPath(); g.arc(x,y,s*0.15,PI,T2); g.stroke(); } };
  const A=mkAtlas([{k:'m',w:2*(w+d)*0.85,h:bh,q:0.5,draw:muster},{k:'f',w,h:d*0.6,q:0.5,draw:muster},
    {k:'v',w,h:bh,draw:(g,W,H)=>{ muster(g,W,H); g.save(); g.translate(W*0.13,H*0.08); drawFront(g,W*0.74,H*0.84,a,0); g.restore(); g.strokeStyle='#ffd23f'; g.lineWidth=W*0.008; g.strokeRect(W*0.13,H*0.08,W*0.74,H*0.84);
      for(const x of [W*0.065,W*0.935]){ WZ.txt(g,'福',x,H*0.5,W*0.1,H*0.18,WFNT.serif,'#ffd23f'); } }}],{rough:0.6});
  pr(c,uvR(loft([Object.assign({y:0},B),Object.assign({y:bh},T)],1),A.uv.m)); vc(c,kappe(B,0.001,false,1),tm(0,0,0),0x8a1010);
  pr(c,uvR(quad([-B.hw,0.0005,B.hd+0.0012],[B.hw,0.0005,B.hd+0.0012],[T.hw,bh,T.hd+0.0012],[-T.hw,bh,T.hd+0.0012]),A.uv.v));
  /* Laschen oben */
  const ry=h*0.985, zr=d*0.03;
  pr(c,uvR(quad([-T.hw,bh,T.hd],[T.hw,bh,T.hd],[T.hw*0.93,ry,zr],[-T.hw*0.93,ry,zr]),A.uv.f));
  pr(c,uvR(quad([T.hw,bh,-T.hd],[-T.hw,bh,-T.hd],[-T.hw*0.93,ry,-zr],[T.hw*0.93,ry,-zr]),A.uv.f));
  for(const s of [-1,1]) pr(c,uvR(quad([s*T.hw,bh,s*T.hd],[s*T.hw,bh,-s*T.hd],[s*T.hw*0.95,h*0.9,-s*zr*0.5],[s*T.hw*0.95,h*0.9,s*zr*0.5]),A.uv.f));
  /* Drahtbuegel, nach hinten umgelegt */
  const Rb=T.hw*0.93; vc(c,new THREE.TorusGeometry(Rb,0.0018,4,24,PI),tm(0,ry+0.002,0,-PI/2,0,0,1,(d*0.36)/Rb,1),0xc8ccd2);
  for(const s of [-1,1]) kiste(c,s*T.hw*0.93,ry-0.004,0,0.004,0.01,0.004,0xc8ccd2);
  return fertig(c,A); };

/* Gluecksschweinchen: Klarsichtschachtel auf Goldkarte, hinten die
   bedruckte Rueckwandkarte, davor sechs Marzipanschweine */
VP_FORM.marzipanschwein=t=>{ const c=C(t), a=c.a, {w,h,d}=c;
  const A=mkAtlas([{k:'k',w:w*0.97,h:h*0.95,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); wareMarkeZeichnen(g,0,0,W,H*0.17,c.t,a);
      WZ.txt(g,a.title,W/2,H*0.29,W*0.9,H*0.17,WFNT.schreib,a.ac,'center','rgba(0,0,0,.5)'); WZ.txt(g,a.sub,W/2,H*0.43,W*0.8,H*0.09,WFNT.kond,'#fff');
      for(let i=0;i<9;i++){ const x=W*(0.06+i*0.11), y=H*0.82; for(let k=0;k<4;k++){ const an=k*PI/2+PI/4; WZ.kreis(g,x+Math.cos(an)*H*0.035,y+Math.sin(an)*H*0.035,H*0.03,'rgba(47,140,60,.55)'); } } }},
    {k:'g',w,h:d,q:0.4,draw:(g,W,H)=>{ verlauf(g,W,H,'#f4d77a','#b08424',true); }}],{rough:0.35,metal:0.25});
  pr(c,boxU(w*0.98,0.004,d*0.98,{alle:A.uv.g}),tm(0,0.002,0));
  pr(c,new THREE.PlaneGeometry(w*0.96,h*0.94).translate(0,0,0).applyMatrix4(new THREE.Matrix4()),tm(0,h*0.48,-d*0.44)); uvR(c.pr[c.pr.length-1].geo,A.uv.k);
  vc(c,new THREE.PlaneGeometry(w*0.96,h*0.94),tm(0,h*0.48,-d*0.441,0,PI,0),0xd8b050);
  const rosa=0xf2a3b5;
  [[-1,0.16],[0,0.16],[1,0.16],[-1,-0.14],[0,-0.14],[1,-0.14]].forEach(([ix,fz],i)=>{ const x=ix*w*0.31+(fz<0?w*0.04:0), z=fz*d*1.6, s=0.82+((i*7)%3)*0.04, y=0.004+0.017*s;
    kugel(c,x,y,z,0.02*s,0.017*s,0.026*s,rosa,10,7);
    kugel(c,x,y+0.019*s,z+0.012*s,0.014*s,0.013*s,0.013*s,rosa,8,6);
    zyl(c,x,y+0.016*s,z+0.026*s,0.0065*s,0.0075*s,0.006*s,0xe8869c,8,PI/2);
    for(const e of [-1,1]){ vc(c,new THREE.ConeGeometry(0.005*s,0.01*s,4),tm(x+e*0.008*s,y+0.033*s,z+0.01*s,0.3,0,-e*0.4),0xe8869c); kugel(c,x+e*0.005*s,y+0.024*s,z+0.024*s,0.0016,0.0016,0.0012,0x2a1a1a,4,3); }
    kugel(c,x,y+0.034*s,z+0.006,0.004,0.0015,0.004,0x2f8c3c,6,3); });
  fo(c,new THREE.BoxGeometry(w*0.995,h*0.995,d*0.995),tm(0,h*0.4975,0));
  return fertig(c,A); };

/* =================== Kuehltheke =================== */

/* Heringssalat: runder Feinkostbecher mit Rundum-Etikett und gewoelbtem
   Klarsichtdeckel - oben sieht man den roten Salat */
VP_FORM.heringssalat=t=>{ const c=C(t), a=c.a, {w,h,d}=c, R=Math.min(w,d)/2*0.995, bh=h*0.82;
  const A=mkAtlas([{k:'m',w:T2*R*0.92,h:bh,draw:fRund(c,0.34,(g,W,H)=>{ g.fillStyle='#ffffff'; g.fillRect(0,0,W,H); g.fillStyle='#1d6fb8'; g.fillRect(0,H*0.92,W,H*0.08); },{hell:true}),max:900}],{rough:0.4});
  pr(c,uvR(dreh([[R*0.86,0.004],[R*0.965,bh]],28),A.uv.m));
  vc(c,dreh([[0,0],[R*0.82,0],[R*0.86,0.004]],28),tm(0,0,0),0xe8ecf0);
  ring(c,0,bh,0,R*0.972,0.0035,0xf4f6f8,PI/2,0,0,28);
  /* Salat: rote Masse, Rote-Bete-, Apfel- und Gurkenwuerfel, Dill */
  vc(c,dreh([[R*0.95,bh-0.012],[R*0.8,bh-0.002],[R*0.4,bh+0.004],[0,bh+0.006]],20),tm(0,0,0),0x9a2248);
  for(let i=0;i<34;i++){ const an=c.rnd()*T2, q=Math.sqrt(c.rnd())*R*0.82, s=0.007+c.rnd()*0.004; kiste(c,Math.sin(an)*q,bh+0.002+c.rnd()*0.003,Math.cos(an)*q,s*0.8,s*0.8,s*0.8,[0x6a0c26,0xf2e8e0,0x7a1030,0xd9c88a,0x5a8a3a][i%5],c.rnd(),c.rnd(),c.rnd()); }
  for(let i=0;i<3;i++) kiste(c,(i-1)*0.03,bh+0.008,0.01*i,0.03,0.0015,0.004,0x3d8a2a,0,i,0);
  /* Deckel */
  fo(c,dreh([[R*0.995,bh-0.006],[R,bh+0.01],[R*0.93,h*0.97],[R*0.5,h*0.995],[0,h*0.999]],28));
  ring(c,0,bh+0.004,0,R*0.99,0.004,0xdfe6ee,PI/2,0,0,28);
  return fertig(c,A); };

/* Kartoffelsalat: Henkeleimer aus Kunststoff mit Rundumdruck, gruener
   Deckel mit Etikett, der Buegel liegt nach hinten umgelegt */
VP_FORM.kartoffelsalat=t=>{ const c=C(t), a=c.a, {w,h,d}=c, R=Math.min(w,d)/2*0.975, bh=h*0.84, gruen=0x1f6a32;
  const A=mkAtlas([{k:'m',w:T2*R*0.93,h:bh,draw:fRund(c,0.36,(g,W,H)=>{ verlauf(g,W,H,'#fffbea','#f3e6b8'); g.fillStyle='#1f6a32'; g.fillRect(0,0,W,H*0.06); g.fillRect(0,H*0.95,W,H*0.05); },{hell:true}),max:900},
    {k:'o',w:R*1.2,h:R*1.2,draw:(g,W,H)=>{ g.fillStyle='#1f6a32'; g.fillRect(0,0,W,H); g.save(); g.beginPath(); g.arc(W/2,H/2,W*0.49,0,T2); g.clip(); g.fillStyle='#fffbea'; g.fillRect(0,0,W,H); wareBild(g,W*0.1,H*0.08,W*0.8,H*0.56,c.t,a,zufallAus(5)); WZ.txt(g,a.title,W/2,H*0.76,W*0.8,H*0.13,WFNT.kond,'#1f6a32'); g.restore(); }}],{rough:0.42});
  pr(c,uvR(dreh([[R*0.9,0.004],[R*0.975,bh]],28),A.uv.m)); vc(c,dreh([[0,0],[R*0.88,0],[R*0.9,0.004]],28),tm(0,0,0),0xe8e2c8);
  vc(c,dreh([[R*0.97,bh-0.012],[R,bh-0.01],[R,bh+0.012],[R*0.96,bh+0.016],[R*0.9,bh+0.011],[0,bh+0.011]],28),tm(0,0,0),gruen);
  pr(c,uvR(new THREE.CircleGeometry(R*0.6,24),A.uv.o),tm(0,bh+0.0115,0,-PI/2,0,0));
  /* Buegel: Ösen an der Seite, Draht nach hinten, Griffstueck */
  for(const s of [-1,1]) kiste(c,s*R*0.985,bh-0.006,0,0.006,0.02,0.016,gruen);
  vc(c,new THREE.TorusGeometry(R*0.97,0.0022,4,26,PI),tm(0,bh+0.018,0,-PI/2,0,0,1,0.98,1),0xb8bcc4);
  zyl(c,0,bh+0.018,-R*0.95,0.006,0.006,0.06,0xf2f0e6,8,0,0,PI/2);
  return fertig(c,A); };

/* Nudelsalat: eckiger Klarsichtbecher, Siegelfolie oben, rundum ein
   bedruckter Kartonsleeve - oben und unten sieht man den Salat */
VP_FORM.nudelsalat=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.86, B={hw:w*0.44,hd:d*0.44,r:0.03}, T={hw:w*0.485,hd:d*0.485,r:0.034};
  const lerp=(q)=>({hw:B.hw+(T.hw-B.hw)*q+0.0018,hd:B.hd+(T.hd-B.hd)*q+0.0018,r:B.r+(T.r-B.r)*q});
  const s0=0.14, s1=0.74, S0=lerp(s0), S1=lerp(s1), per=4*(S1.hw-S1.r)+4*(S1.hd-S1.r)+T2*S1.r;
  const A=mkAtlas([{k:'m',w:per,h:(s1-s0)*bh,draw:fRund(c,(2*S1.hw)/per*0.98,(g,W,H)=>{ g.fillStyle='#fff'; g.fillRect(0,0,W,H); g.fillStyle='#1d6fb8'; g.fillRect(0,0,W,H*0.1); g.fillStyle=a.bg1; g.fillRect(0,H*0.9,W,H*0.1); },{rueck:true,hell:true})}],{rough:0.6});
  pr(c,uvR(loft([Object.assign({y:s0*bh},S0),Object.assign({y:s1*bh},S1)],4),A.uv.m));
  fo(c,loft([Object.assign({y:0},B),Object.assign({y:bh},T)],4)); fo(c,kappe(T,bh+0.004,true,4));
  vc(c,loft([Object.assign({y:bh},T),{y:bh,hw:w*0.499,hd:d*0.499,r:0.038},{y:bh+0.004,hw:w*0.499,hd:d*0.499,r:0.038},Object.assign({y:bh+0.004},T)],4),tm(0,0,0),0xf2f4f6);
  /* Salat im Becher */
  const I0={hw:B.hw*0.97,hd:B.hd*0.97,r:0.028}, I1={hw:T.hw*0.97,hd:T.hd*0.97,r:0.032}, yi=bh*0.9;
  vc(c,loft([Object.assign({y:0.002},I0),Object.assign({y:yi},I1)],4),tm(0,0,0),0xe2b85a); vc(c,kappe(I1,yi,true,4),tm(0,0,0),0xe8c46a);
  for(let i=0;i<46;i++){ const x=(c.rnd()-0.5)*I1.hw*1.8, z=(c.rnd()-0.5)*I1.hd*1.8, y=yi+0.003+c.rnd()*0.004, k=i%6;
    if(k<3) vc(c,new THREE.TorusGeometry(0.006,0.0028,4,8,PI),tm(x,y,z,c.rnd()*3,c.rnd()*3,0),0xf0cf6a);
    else if(k===3) ico(c,x,y,z,0.0045,0x5aa83a); else if(k===4) kiste(c,x,y,z,0.008,0.004,0.008,0xe08a8a,0,c.rnd()*3,0); else kiste(c,x,y,z,0.006,0.004,0.006,0xf4efe0,0,c.rnd()*3,0); }
  for(let i=0;i<10;i++){ const an=i/10*T2; kiste(c,Math.sin(an)*I1.hw*0.98,bh*0.3+((i*37)%7)*0.012,Math.cos(an)*I1.hd*0.98,0.012,0.006,0.006,i%2?0xf0cf6a:0x5aa83a,0,an,0.5); }
  return fertig(c,A); };

/* Wiener Wuerstchen: Vakuum-Tiefziehpackung, die Folie liegt eng um die
   zehn Wuerstchen; vorn der bedruckte Kartonstreifen, oben ein Etikett */
VP_FORM.wuerstchen=t=>{ const c=C(t), a=c.a, {w,h,d}=c, r=Math.min(d/10.6,h/4.3), L=w*0.92, fh=h*0.64;
  const A=mkAtlas([{k:'v',w,h:fh,draw:fVorn(c)},{k:'b',w,h:d,q:0.3,draw:(g,W,H)=>{ g.fillStyle='#1d6fb8'; g.fillRect(0,0,W,H); }},
    {k:'o',w:w*0.42,h:d*0.42,draw:(g,W,H)=>{ g.fillStyle='#fff'; g.fillRect(0,0,W,H); g.fillStyle='#1d6fb8'; g.fillRect(0,0,W,H*0.3); WZ.txt(g,'FRISCHETHEKE',W/2,H*0.15,W*0.86,H*0.2,WFNT.kond,'#fff');
      WZ.txt(g,a.title,W/2,H*0.5,W*0.86,H*0.24,WFNT.rund,'#12324f'); WZ.txt(g,'❄ 2–7 °C · '+a.sub,W/2,H*0.78,W*0.86,H*0.14,WFNT.kond,'#1d6fb8'); }}],{rough:0.5});
  pr(c,uvR(new THREE.PlaneGeometry(w*0.995,fh),A.uv.v),tm(0,fh/2,d*0.497)); pr(c,boxU(w*0.995,0.002,d*0.99,{alle:A.uv.b}),tm(0,0.001,0));
  const prof=[[0,-0.5],[0.55,-0.49],[0.88,-0.46],[1,-0.42],[1,0.42],[0.88,0.46],[0.55,0.49],[0,0.5]];
  for(let ly=0;ly<2;ly++) for(let iz=0;iz<5;iz++){ const z=(iz-2)*r*2.04, y=0.002+r*(1+ly*2.02);
    vc(c,dreh(prof,7),tm(0,y,z,0.15*iz,0,PI/2,r,L,r),ly?0xbc5a2e:0xa84e28); }
  const R=[{y:0.002,hw:w*0.48,hd:Math.min(r*5.3,d*0.49),r:r},{y:0.002+r*2,hw:w*0.495,hd:Math.min(r*5.45,d*0.4995),r:r*1.2},{y:0.004+r*4.05,hw:w*0.48,hd:Math.min(r*5.2,d*0.48),r:r}];
  fo(c,loft(R,3)); fo(c,kappe(R[2],R[2].y,true,3));
  pr(c,uvR(new THREE.PlaneGeometry(w*0.42,d*0.42),A.uv.o),tm(-w*0.24,R[2].y+0.0008,-d*0.04,-PI/2,0,0));
  return fertig(c,A); };

/* Mini-Frikadellen: Kraftpapier-Schale mit gewoelbter Siegelfolie, vorn
   auf der Schale das Druckbild */
VP_FORM.frikadellen=t=>{ const c=C(t), a=c.a, {w,h,d}=c, th=h*0.55, B={hw:w*0.43,hd:d*0.42,r:0.02}, T={hw:w*0.497,hd:d*0.495,r:0.026};
  const A=mkAtlas([{k:'m',w:2*(w+d),h:th,q:0.4,draw:(g,W,H)=>kraft(g,W,H,'#a8784a')},{k:'v',w,h:th,draw:fVorn(c)}],{rough:0.8});
  pr(c,uvR(loft([Object.assign({y:0},B),Object.assign({y:th},T)],3),A.uv.m)); vc(c,kappe(B,0.001,true,3),tm(0,0,0),0x8a6038);
  pr(c,uvR(quad([-B.hw+B.r,0.002,B.hd+0.0012],[B.hw-B.r,0.002,B.hd+0.0012],[T.hw-T.r,th-0.002,T.hd+0.0012],[-T.hw+T.r,th-0.002,T.hd+0.0012]),A.uv.v));
  const rb=Math.min(w/10.4,d/8.4);
  for(let ix=0;ix<5;ix++) for(let iz=0;iz<4;iz++){ const x=(ix-2)*rb*2.05+(c.rnd()-0.5)*0.004, z=(iz-1.5)*rb*2.05+(c.rnd()-0.5)*0.004;
    kugel(c,x,th*0.55+rb*0.5,z,rb,rb*0.72,rb,[0x7a3e1c,0x8e4c24,0x6c3416][(ix+iz)%3],9,6,[c.rnd()*0.3,c.rnd()*3,0]); }
  for(let i=0;i<4;i++) kugel(c,(i-1.5)*w*0.2,th*0.55+rb*1.25,(i%2-0.5)*d*0.3,0.008,0.004,0.008,0x3f8a2a,6,3);
  const F=[Object.assign({y:th},T),{y:th+(h-th)*0.6,hw:T.hw*0.97,hd:T.hd*0.96,r:0.04},{y:h*0.998,hw:T.hw*0.86,hd:T.hd*0.82,r:0.05}];
  fo(c,loft(F,3)); fo(c,kappe(F[2],F[2].y,true,3)); ring(c,0,th,0,1,0.002,0x8a6038,PI/2,0,0,4);
  c.vc.pop();
  vc(c,loft([Object.assign({y:th},T),{y:th,hw:T.hw+0.001,hd:T.hd+0.001,r:T.r},{y:th+0.003,hw:T.hw+0.001,hd:T.hd+0.001,r:T.r},Object.assign({y:th+0.003},T)],3),tm(0,0,0),0x9a6c40);
  return fertig(c,A); };

/* Mett-Igel: der Igel auf einer schwarzen Partyplatte unter der
   Kuppelhaube, Zwiebelstacheln, Oliven als Augen; vorn auf der Haube das
   Etikett */
VP_FORM.mettigel=t=>{ const c=C(t), a=c.a, {w,h,d}=c, pb=0.012, HA=w*0.497, HB=h-pb-0.001, HC=d*0.497;
  const A=mkAtlas([{k:'e',w:w*0.42,h:h*0.42,draw:fEtikett(c,'#1d6fb8',true)}],{rough:0.4});
  vc(c,loft([{y:0,hw:w*0.47,hd:d*0.47,ell:true},{y:pb*0.6,hw:w*0.499,hd:d*0.499,ell:true},{y:pb,hw:w*0.495,hd:d*0.495,ell:true}],5),tm(0,0,0),0x1d1d22);
  vc(c,kappe({hw:w*0.495,hd:d*0.495,ell:true},pb,true,5),tm(0,0,0),0x2a2a30);
  /* Salatblaetter rund um den Igel */
  for(let i=0;i<10;i++){ const an=i/10*T2; kugel(c,Math.sin(an)*w*0.37,pb+0.003,Math.cos(an)*d*0.36,0.032,0.005,0.024,i%2?0x4f9a2a:0x6ab83a,10,3,[0,an,0]); }
  /* Igel: Mett-Koerper, Schnauze nach links, Oliven als Augen und Nase */
  const bx=w*0.04, by=pb+0.002, RA=w*0.27, RB=h*0.5, RC=d*0.29;
  vc(c,new THREE.SphereGeometry(1,18,9,0,T2,0,PI/2),tm(bx,by,0,0,0,0,RA,RB,RC),0xb4443a);
  const sx=bx-RA*0.95, sy=by+RB*0.4; vc(c,new THREE.ConeGeometry(RC*0.48,RA*0.72,12),tm(sx,sy,0,0,0,PI/2+0.22,1,1,0.85),0xbe4c40);
  kugel(c,sx-RA*0.36*0.975,sy-RA*0.36*0.22,0,0.009,0.008,0.009,0x14141a,6,4);
  for(const s of [-1,1]) kugel(c,bx-RA*0.8,by+RB*0.62,s*RC*0.36,0.0075,0.0075,0.0075,0x14141a,6,4);
  /* Zwiebelstacheln, nach hinten gekaemmt */
  for(let i=0;i<72;i++){ const ph=(c.rnd()*1.3-0.65)*PI, el=0.28+c.rnd()*1.2, nx=Math.cos(el)*Math.cos(ph), ny=Math.sin(el), nz=Math.cos(el)*Math.sin(ph);
    const px=bx+nx*RA*0.9, py=by+ny*RB*0.9, pz=nz*RC*0.9; const dir=new THREE.Vector3(nx/RA,ny/RB,nz/RC).normalize().add(new THREE.Vector3(0.55,0.25,0)).normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir), m=new THREE.Matrix4().compose(new THREE.Vector3(px+dir.x*0.012,py+dir.y*0.012,pz+dir.z*0.012),q,new THREE.Vector3(1,1,1));
    vc(c,new THREE.ConeGeometry(0.0055,0.034,4),m,i%3?0xf6f0e0:0xe8d8b8); }
  /* Kuppelhaube */
  fo(c,new THREE.SphereGeometry(1,20,8,0,T2,0,PI/2),tm(0,pb,0,0,0,0,HA,HB,HC));
  pr(c,uvR(flaeche(6,4,(u,v)=>{ const ph=0.18+u*0.85, el=0.1+v*0.42, k=1.012; return [HA*k*Math.cos(el)*Math.sin(ph),pb+HB*k*Math.sin(el),HC*k*Math.cos(el)*Math.cos(ph)]; }),A.uv.e));
  return fertig(c,A); };

/* Dip-Trio: drei runde Becher mit bedruckten Siegeldeckeln, zusammen-
   gehalten von einem Kartonsleeve */
VP_FORM.dips=t=>{ const c=C(t), a=c.a, {w,h,d}=c, r=Math.min(w/6.3,d/2*0.98), ch=h*0.86, xs=[-w*0.332,0,w*0.332];
  const sorten=[['KRÄUTER','#3f8a2a','#eef6e4'],['KNOBLAUCH','#f4f1e6','#6a6a72'],['CURRY','#e8a21b','#fff6dc']];
  const regs=[{k:'v',w,h:h*0.68,draw:fVorn(c)},{k:'s',w:d,h:h*0.68,draw:(g,W,H)=>{ g.fillStyle='#fff'; g.fillRect(0,0,W,H); g.fillStyle='#1d6fb8'; g.fillRect(0,0,W,H*0.25); g.fillStyle=a.bg1; g.fillRect(0,H*0.8,W,H*0.2); }}];
  sorten.forEach(([n,f,b],i)=>regs.push({k:'l'+i,w:r*2,h:r*2,draw:(g,W,H)=>{ g.fillStyle=f; g.fillRect(0,0,W,H); g.fillStyle=b; g.beginPath(); g.arc(W/2,H/2,W*0.36,0,T2); g.fill(); WZ.txt(g,n,W/2,H*0.5,W*0.66,H*0.16,WFNT.kond,f==='#f4f1e6'?'#6a6a72':f);
    WZ.txt(g,'DIP',W/2,H*0.3,W*0.4,H*0.12,WFNT.rund,f==='#f4f1e6'?'#9a9aa2':f); g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=W*0.02; g.beginPath(); g.arc(W/2,H/2,W*0.46,0,T2); g.stroke(); }}));
  const A=mkAtlas(regs,{rough:0.4,metal:0.2});
  xs.forEach((x,i)=>{ vc(c,dreh([[0,0],[r*0.78,0],[r*0.8,0.003],[r*0.95,ch],[r,ch],[r,ch+0.003]],20),tm(x,0,0),0xf4f4f0);
    pr(c,uvR(new THREE.CircleGeometry(r,20),A.uv['l'+i]),tm(x,ch+0.0035,0,-PI/2,0,0)); });
  const sy0=h*0.06, sy1=h*0.74, sd=2*r*0.93;
  pr(c,boxOhne(w*0.998,sy1-sy0,sd,{pz:A.uv.v,nz:A.uv.v,px:A.uv.s,nx:A.uv.s},['py','ny']),tm(0,(sy0+sy1)/2,0));
  return fertig(c,A); };

/* Gefuellte Eier: Eierschale mit zwoelf Mulden unter dem Klappdeckel,
   links eine Papierbanderole mit dem Druckbild */
VP_FORM.gefuellteeier=t=>{ const c=C(t), a=c.a, {w,h,d}=c, th=h*0.32, bw=w*0.32, bx=-w/2+bw/2;
  const A=mkAtlas([{k:'v',w:bw,h,draw:fVorn(c)},{k:'o',w:bw,h:d,draw:(g,W,H)=>{ g.fillStyle='#fff'; g.fillRect(0,0,W,H); WZ.txt(g,a.title,W/2,H/2,W*0.9,H*0.2,WFNT.rund,'#12324f'); }},{k:'h',w:bw,h,draw:rueck(c,true)}],{rough:0.6});
  vc(c,loft([{y:0,hw:w*0.47,hd:d*0.46,r:0.02},{y:th,hw:w*0.497,hd:d*0.495,r:0.024}],3),tm(0,0,0),0x1d2126); vc(c,kappe({hw:w*0.497,hd:d*0.495,r:0.024},th,true,3),tm(0,0,0),0x2a2f36);
  for(let ix=0;ix<4;ix++) for(let iz=0;iz<3;iz++){ const x=(ix-1.5)*w*0.235, z=(iz-1)*d*0.31, s=Math.min(w*0.115,d*0.15);
    vc(c,new THREE.SphereGeometry(1,8,3,0,T2,PI/2,PI/2),tm(x,th+s*0.12,z,0,0.3,0,s*0.72,s*0.55,s),0xfbfbf6); vc(c,new THREE.CircleGeometry(1,12),tm(x,th+s*0.121,z,-PI/2,0,0.3,s*0.72,s,1),0xffffff);
    kugel(c,x,th+s*0.12,z,s*0.4,s*0.22,s*0.5,0xf0b828,8,5); vc(c,new THREE.ConeGeometry(s*0.3,s*0.32,7),tm(x,th+s*0.36,z,0,0,0,1,1,1.2),0xf4c43a);
    kugel(c,x+s*0.08,th+s*0.52,z,s*0.08,s*0.05,s*0.08,0xd8322a,4,3); kiste(c,x-s*0.12,th+s*0.45,z+s*0.1,s*0.35,s*0.03,s*0.04,0x3f8a2a,0,0.7,0); }
  const F=[{y:th*0.5,hw:w*0.499,hd:d*0.499,r:0.026},{y:h*0.8,hw:w*0.49,hd:d*0.48,r:0.034},{y:h*0.998,hw:w*0.46,hd:d*0.44,r:0.04}];
  fo(c,loft(F,3)); fo(c,kappe(F[2],F[2].y,true,3));
  pr(c,boxOhne(bw,h*0.998,d*0.998,{pz:A.uv.v,nz:A.uv.h,py:A.uv.o,ny:A.uv.o},['px','nx']),tm(bx,h/2,0));
  return fertig(c,A); };

/* =================== Feinkost, Fisch, Torte =================== */

/* Partypizza (TK): Pizzakarton mit rundem Sichtfenster im Deckel, darin
   die oberste Pizza; Frostkristalle, -18 °C */
VP_FORM.partypizza=t=>{ const c=C(t), a=c.a, {w,h,d}=c, R=Math.min(w,d)*0.31;
  const A=mkAtlas([{k:'v',w,h,draw:(g,W,H)=>{ drawFront(g,W,H,a,0); g.fillStyle='#1557a8'; WZ.rr(g,W*0.86,H*0.08,W*0.12,H*0.3,H*0.05); g.fill(); WZ.txt(g,'❄ −18 °C',W*0.92,H*0.23,W*0.11,H*0.16,WFNT.kond,'#fff'); }},
    {k:'s',w:d,h,draw:fSeite(c)},{k:'h',w,h,draw:rueck(c)},
    {k:'o',w,h:d,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2,true); const cx=W/2, cy=H/2, r=R/w*W;
      g.fillStyle='rgba(255,255,255,.12)'; for(let i=0;i<12;i++){ g.fillRect(0,i*H/12,W,H/48); }
      g.strokeStyle='#fff'; g.lineWidth=W*0.012; g.beginPath(); g.arc(cx,cy,r*1.04,0,T2); g.stroke();
      g.save(); g.translate(cx,cy); const sz=W*0.05; g.font=WFNT.rund(Math.round(sz)); g.fillStyle=a.ac; g.textAlign='center'; g.textBaseline='middle';
      const txt=(a.title+' · '+a.title+' · ').split(''); txt.forEach((ch,i)=>{ g.save(); g.rotate(-PI*0.85+i*PI*1.7/txt.length); g.translate(0,-r*1.17); g.fillText(ch,0,0); g.restore(); }); g.restore();
      g.fillStyle='#fff'; g.beginPath(); g.arc(W*0.12,H*0.85,W*0.08,0,T2); g.fill(); WZ.txt(g,'4×',W*0.12,H*0.83,W*0.1,W*0.06,WFNT.rund,a.bg2); WZ.txt(g,'STÜCK',W*0.12,H*0.89,W*0.1,W*0.025,WFNT.kond,a.bg2);
      for(let i=0;i<10;i++){ const x=W*(0.08+0.84*((i*37)%11)/11), y=H*(0.05+0.15*((i*13)%5)/5); g.strokeStyle='rgba(220,240,255,.8)'; g.lineWidth=W*0.003; for(let k=0;k<3;k++){ g.beginPath(); const an=k*PI/3; g.moveTo(x-Math.cos(an)*W*0.012,y-Math.sin(an)*W*0.012); g.lineTo(x+Math.cos(an)*W*0.012,y+Math.sin(an)*W*0.012); g.stroke(); } }
      stanz(g,g2=>g2.arc(cx,cy,r,0,T2)); }}],{rough:0.6,alpha:true});
  pr(c,boxU(w,h,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,py:A.uv.o,ny:A.uv.s}),tm(0,h/2,0));
  vc(c,innen(new THREE.BoxGeometry(w*0.985,h*0.97,d*0.985)),tm(0,h/2,0),0xcbb48a);
  const rp=Math.min(w,d)*0.46, ph=h*0.2;
  for(let i=0;i<3;i++) zyl(c,0,0.004+ph*(i+0.5),0,rp,rp,ph*0.95,0xe0b070,24);
  const y=0.004+ph*3; zyl(c,0,y+0.006,0,rp,rp*0.98,0.012,0xd9a050,28); zyl(c,0,y+0.0125,0,rp*0.88,rp*0.88,0.002,0xc23a1e,28);
  for(let i=0;i<40;i++){ const an=c.rnd()*T2, q=Math.sqrt(c.rnd())*rp*0.82; zyl(c,Math.sin(an)*q,y+0.0138,Math.cos(an)*q,0.012,0.012,0.0012,0xf4d77a,6); }
  for(let i=0;i<13;i++){ const an=i*2.4, q=(0.25+0.6*((i*7)%10)/10)*rp*0.85; zyl(c,Math.sin(an)*q,y+0.0148,Math.cos(an)*q,0.017,0.017,0.002,0x9a1c1c,12); }
  for(let i=0;i<8;i++){ const an=i*1.7+0.5, q=(0.3+0.5*((i*3)%5)/5)*rp*0.8; kugel(c,Math.sin(an)*q,y+0.016,Math.cos(an)*q,0.008,0.0012,0.005,0x2f8a2a,6,3,[0,an,0]); }
  fo(c,new THREE.CircleGeometry(R,28),tm(0,h-0.0012,0,-PI/2,0,0));
  return fertig(c,A); };

/* Kaeseplatte: Holzbrett mit Gouda, Brie, Blauschimmel, Trauben und
   Nuessen unter Frischhaltefolie, vorn auf der Folie das Etikett */
VP_FORM.kaeseplatte=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bt=h*0.18;
  const A=mkAtlas([{k:'b',w,h:d,q:0.4,draw:(g,W,H)=>holz(g,W,H,'#d2a868',true)},{k:'e',w:w*0.6,h:h*0.6,draw:fEtikett(c,'#e8b418',true)}],{rough:0.6});
  pr(c,boxU(w*0.97,bt,d*0.95,{alle:A.uv.b}),tm(0,bt/2,0));
  const y0=bt, gelb=0xf0c040;
  /* Gouda-Ecken mit Rinde, Brie, Blauschimmel, Cheddarwuerfel */
  for(let i=0;i<3;i++){ const x=-w*0.3+i*0.035; vc(c,new THREE.CylinderGeometry(0.075,0.075,0.03,5,1,false,0,PI/4),tm(x,y0+0.015,-d*0.18,0,0.4+i*0.15,0),gelb); }
  zyl(c,-w*0.03,y0+0.014,d*0.08,0.042,0.042,0.028,0xf6f1e2,16); vc(c,new THREE.CylinderGeometry(0.0425,0.0425,0.029,6,1,false,0,PI/3),tm(-w*0.03,y0+0.0145,d*0.08,0,0.2,0),0xfff4c8);
  vc(c,new THREE.CylinderGeometry(0.07,0.07,0.035,4,1,false,0,PI/3),tm(w*0.12,y0+0.0175,-d*0.25,0,1.2,0),0xe6ead6);
  for(let i=0;i<4;i++) kugel(c,w*0.12+0.02+i*0.008,y0+0.036,-d*0.15+(i%2)*0.01,0.004,0.002,0.004,0x4a6a8a,5,3);
  for(let i=0;i<7;i++) kiste(c,w*0.07+(i%4)*0.026,y0+0.009,d*0.18+Math.floor(i/4)*0.026,0.018,0.018,0.018,0xe8902a,0,i*0.4,0);
  for(let i=0;i<12;i++){ const an=i*2.3, q=0.012+(i%4)*0.008; ico(c,w*0.33+Math.cos(an)*q*1.2,y0+0.012+(i%3)*0.007,d*0.05+Math.sin(an)*q,0.009,i%3?0x5a2a6a:0x6e3a7e,1,1); }
  for(let i=0;i<5;i++) kugel(c,w*0.34+(i-2)*0.018,y0+0.006,-d*0.28,0.009,0.005,0.007,0x8a5a2a,6,4,[0,i,0]);
  const F=[{y:bt*0.3,hw:w*0.4995,hd:d*0.4995,r:0.03},{y:h*0.62,hw:w*0.495,hd:d*0.49,r:0.04},{y:h*0.998,hw:w*0.45,hd:d*0.42,r:0.05}];
  fo(c,loft(F,3)); fo(c,kappe(F[2],F[2].y,true,3));
  const ez=d*0.4995+0.0006; pr(c,uvR(quad([-w*0.3,bt*0.35,ez],[w*0.3,bt*0.35,ez],[w*0.3,bt*0.35+h*0.6,ez-0.0035],[-w*0.3,bt*0.35+h*0.6,ez-0.0035]),A.uv.e));
  return fertig(c,A); };

/* Raeucherlachs: Vakuumpackung auf Goldkarton - vorn die bedruckte
   Kartonkante, oben links das Goldetikett, daneben die Lachsscheiben */
VP_FORM.lachs=t=>{ const c=C(t), a=c.a, {w,h,d}=c;
  const gold=(g,W,H)=>{ verlauf(g,W,H,'#f6dd8a','#a87a1e',true); g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=Math.max(1,H*0.01); for(let x=-H;x<W;x+=H*0.08){ g.beginPath(); g.moveTo(x,H); g.lineTo(x+H,0); g.stroke(); } };
  const A=mkAtlas([{k:'v',w,h,draw:fVorn(c)},{k:'g',w,h:d,q:0.5,draw:gold},
    {k:'o',w:w*0.36,h:d*0.94,draw:(g,W,H)=>{ g.fillStyle='#0e1226'; g.fillRect(0,0,W,H); g.strokeStyle='#d9b45a'; g.lineWidth=W*0.02; g.strokeRect(W*0.06,H*0.04,W*0.88,H*0.92);
      siegel(g,W/2,H*0.2,W*0.16,'♛','#d9b45a','#0e1226'); g.save(); g.translate(W*0.5,H*0.62); g.rotate(-PI/2); WZ.txt(g,a.title,0,0,H*0.62,W*0.3,WFNT.serif,'#e8c35a'); g.restore(); }}],{rough:0.35,metal:0.3});
  pr(c,boxU(w,0.003,d,{alle:A.uv.g}),tm(0,0.0015,0));
  pr(c,uvR(new THREE.PlaneGeometry(w,h*0.98),A.uv.v),tm(0,h*0.49,d/2-0.001)); vc(c,new THREE.PlaneGeometry(w,h*0.98),tm(0,h*0.49,d/2-0.0015,0,PI,0),0xc89a3a);
  pr(c,uvR(new THREE.PlaneGeometry(w*0.36,d*0.92),A.uv.o),tm(-w*0.32,0.0045,-d*0.03,-PI/2,0,0));
  /* Lachsscheiben, gefaechert */
  for(let i=0;i<7;i++){ const x=-w*0.09+i*w*0.076, z=-d*0.03+(i%2)*0.012, rot=-0.12+i*0.04;
    vc(c,new THREE.CylinderGeometry(1,1,1,16),tm(x,0.006+i*0.0016,z,0,rot,0.12,0.03,0.003,d*0.4),i%2?0xf0703e:0xf58a54);
    for(const o of [-0.4,0.1,0.55]) vc(c,new THREE.BoxGeometry(0.03,0.0004,0.0025),tm(x,0.0077+i*0.0016+o*0.002,z+o*d*0.3,0,rot+0.5,0.12),0xffd2b8); }
  for(let i=0;i<4;i++) kiste(c,w*0.4,0.02,-d*0.32+i*0.012,0.03,0.0015,0.003,0x3d8a2a,0,0.5+i*0.3,0);
  const F=[{y:0.003,hw:w*0.497,hd:d*0.488,r:0.02},{y:h*0.4,hw:w*0.495,hd:d*0.48,r:0.03},{y:h*0.62,hw:w*0.47,hd:d*0.44,r:0.04}];
  fo(c,loft(F,3)); fo(c,kappe(F[2],F[2].y,true,3));
  return fertig(c,A); };

/* Fingerfood: Catering-Karton mit bedruckten Waenden und Klarsicht-
   deckel - Mini-Quiches, Spiesschen, Wraps */
VP_FORM.fingerfood=t=>{ const c=C(t), a=c.a, {w,h,d}=c, th=h*0.62;
  const A=mkAtlas([{k:'v',w,h:th,draw:fVorn(c)},{k:'s',w:d,h:th,draw:(g,W,H)=>{ g.fillStyle='#fff'; g.fillRect(0,0,W,H); g.fillStyle='#1d6fb8'; g.fillRect(0,0,W,H*0.22); g.fillStyle=a.ac; g.fillRect(0,H*0.85,W,H*0.15); }},{k:'h',w,h:th,draw:rueck(c,true)}],{rough:0.6});
  pr(c,boxOhne(w,th,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,ny:A.uv.s},['py']),tm(0,th/2,0));
  vc(c,innen(boxOhne(w*0.99,th,d*0.99,{},['py'])),tm(0,th/2,0),0xf4f2ee); vc(c,new THREE.PlaneGeometry(w*0.98,d*0.98),tm(0,0.006,0,-PI/2,0,0),0x1b1d22);
  const fl=[0xd8322a,0x2f7fd0,0xffc21a,0x2f9e57];
  for(let ix=0;ix<6;ix++) for(let iz=0;iz<2;iz++){ const x=(ix-2.5)*w*0.158, z=(iz-0.5)*d*0.46, k=(ix+iz*3)%3, y=0.006;
    if(k===0){ zyl(c,x,y+0.008,z,0.026,0.022,0.016,0xc98a40,12); zyl(c,x,y+0.0165,z,0.022,0.022,0.002,0xf2cf5a,12); kugel(c,x+0.006,y+0.018,z,0.006,0.003,0.006,0x3f8a2a,5,3); kugel(c,x-0.008,y+0.018,z+0.005,0.005,0.003,0.005,0xc8322a,5,3); }
    else if(k===1){ kiste(c,x,y+0.012,z,0.02,0.02,0.02,0xf2c84a,0,0.4,0); kugel(c,x,y+0.03,z,0.011,0.01,0.011,0xd8322a,8,6); kugel(c,x,y+0.046,z,0.009,0.009,0.009,0x6a3a7a,6,4);
      zyl(c,x,y+0.04,z,0.0012,0.0012,0.06,0xe8d0a0,4); kiste(c,x+0.008,y+0.066,z,0.016,0.01,0.001,fl[(ix+iz)%4]); }
    else { for(const o of [-1,1]){ zyl(c,x+o*0.013,y+0.012,z,0.012,0.012,0.045,0xead8a8,10,PI/2,0.3,0); zyl(c,x+o*0.013+Math.sin(0.3)*0.0226,y+0.012,z+Math.cos(0.3)*0.0226,0.0105,0.0105,0.001,0x6ab03a,10,PI/2,0.3,0); } } }
  const F=[{y:th,hw:w*0.4995,hd:d*0.4995,r:0.02},{y:h*0.85,hw:w*0.495,hd:d*0.49,r:0.03},{y:h*0.998,hw:w*0.47,hd:d*0.44,r:0.04}];
  fo(c,loft(F,3)); fo(c,kappe(F[2],F[2].y,true,3));
  return fertig(c,A); };

/* Sushi: schwarz-rotes Bento-Tablett mit Klarsichtdeckel, Maki, Nigiri,
   Wasabi und Ingwer; obenauf Staebchen in der Papierhuelle */
VP_FORM.sushi=t=>{ const c=C(t), a=c.a, {w,h,d}=c, th=h*0.6, B={hw:w*0.48,hd:d*0.46,r:0.012}, T={hw:w*0.497,hd:d*0.495,r:0.014};
  const A=mkAtlas([{k:'v',w,h:th,draw:fVorn(c)},{k:'st',w:0.24,h:0.02,draw:(g,W,H)=>{ g.fillStyle='#f6f1e6'; g.fillRect(0,0,W,H); g.fillStyle='#c81c1c'; g.fillRect(W*0.62,0,W*0.18,H); WZ.txt(g,'はし',W*0.71,H*0.5,W*0.15,H*0.7,WFNT.klar,'#fff'); }}],{rough:0.35});
  vc(c,loft([Object.assign({y:0},B),Object.assign({y:th},T)],3),tm(0,0,0),0x141418); vc(c,kappe(T,th*0.25,true,3),tm(0,0,0),0x9a1414);
  pr(c,uvR(quad([-B.hw+B.r,0.001,B.hd+0.0012],[B.hw-B.r,0.001,B.hd+0.0012],[T.hw-T.r,th-0.001,T.hd+0.0012],[-T.hw+T.r,th-0.001,T.hd+0.0012]),A.uv.v));
  const y=th*0.25;
  for(let i=0;i<8;i++){ const x=-w*0.4+i*0.034, z=-d*0.22; zyl(c,x,y+0.012,z,0.015,0.015,0.024,0x1a2a1a,10,0,0,0,true); zyl(c,x,y+0.0242,z,0.014,0.014,0.0005,0xf6f4ee,10); zyl(c,x,y+0.0245,z,0.006,0.006,0.0005,i%2?0xf07a3a:0x6ab03a,8); }
  for(let i=0;i<6;i++){ const x=-w*0.38+i*0.045, z=d*0.12; kiste(c,x,y+0.008,z,0.03,0.016,0.018,0xf6f4ee); kiste(c,x,y+0.0175,z,0.038,0.004,0.022,i%3===2?0xf2f0ea:i%3?0xe8603a:0xf28a5a,0,0,0.04); }
  kugel(c,w*0.22,y+0.008,-d*0.2,0.014,0.01,0.012,0x8ab83a,8,5);
  for(let i=0;i<4;i++) kugel(c,w*0.3+i*0.006,y+0.005+i*0.002,-d*0.18,0.016,0.002,0.012,0xf4b8b8,8,3,[0.3,i,0]);
  for(let i=0;i<4;i++){ const x=w*0.24+(i%2)*0.04, z=d*0.12+Math.floor(i/2)*0.0; zyl(c,x+(i>1?0.0:0),y+0.012,z+(i>1?-0.06:0),0.016,0.016,0.024,0xf6f4ee,10); zyl(c,x,y+0.0245,z+(i>1?-0.06:0),0.009,0.009,0.001,0xc8322a,8); }
  const F=[Object.assign({y:th},T),{y:h*0.88,hw:w*0.495,hd:d*0.49,r:0.02},{y:h*0.965,hw:w*0.485,hd:d*0.47,r:0.025}];
  fo(c,loft(F,3)); fo(c,kappe(F[2],F[2].y,true,3));
  pr(c,boxU(0.24,0.004,0.016,{alle:A.uv.st}),tm(0,h-0.0022,d*0.05,0,0.35,0));
  return fertig(c,A); };

/* Silvesterkarpfen: weisse Fischschale, der Karpfen auf Crushed Ice mit
   Zitrone, stramm in Frischhaltefolie; vorn das Thekenetikett */
VP_FORM.karpfen=t=>{ const c=C(t), a=c.a, {w,h,d}=c, th=h*0.32, B={hw:w*0.47,hd:d*0.45,r:0.015}, T={hw:w*0.497,hd:d*0.495,r:0.02};
  const A=mkAtlas([{k:'st',w:2*(w+d),h:th,q:0.4,draw:styro},{k:'e',w:w*0.5,h:h*0.55,draw:fEtikett(c,'#1d6fb8',true)}],{rough:0.8});
  pr(c,uvR(loft([Object.assign({y:0},B),Object.assign({y:th},T)],3),A.uv.st)); vc(c,kappe(B,0.003,true,3),tm(0,0,0),0xeef0ee);
  vc(c,flaeche(14,6,(u,v)=>[(u-0.5)*w*0.92,th*0.75+0.006*Math.sin(u*41+v*17)*Math.cos(u*23-v*11)+0.004,(0.5-v)*d*0.86]),tm(0,0,0),0xdcecf6);
  for(let i=0;i<24;i++) ico(c,(c.rnd()-0.5)*w*0.9,th*0.78+0.004,(c.rnd()-0.5)*d*0.84,0.007+c.rnd()*0.004,0xeaf6ff);
  /* Karpfen auf der Seite: Koerper, heller Bauch, Kopf links, Flossen, Auge */
  const L=w*0.6, fy=th*0.78+0.016, fx=0.01, R0=[0.1,0.13,0.28,0.52,0.75,0.9,0.98,1,0.96,0.86,0.66,0.0], prof=R0.map((r,i)=>[r,i/(R0.length-1)-0.5]);
  vc(c,dreh(prof,12),tm(fx,fy,0,0,0,PI/2,0.02,L,0.062),0x8a6a2e);
  vc(c,dreh(prof,10),tm(fx-0.01,fy-0.003,0.014,0,0,PI/2,0.017,L*0.85,0.05),0xd6c48a);
  vc(c,dreh(prof,10),tm(fx-L*0.36,fy+0.001,0,0,0,PI/2,0.018,L*0.26,0.056),0x7a5a26);
  vc(c,new THREE.ConeGeometry(0.045,0.06,4),tm(fx+L*0.5+0.025,fy,0,0,0,PI/2,0.12,1,1),0x6e5222);
  vc(c,new THREE.ConeGeometry(0.06,0.03,4),tm(fx+0.02,fy,-0.068,-PI/2,0,0,1,1,0.12),0x6e5222);
  vc(c,new THREE.ConeGeometry(0.02,0.025,3),tm(fx-L*0.15,fy-0.004,0.062,PI/2,0,0,1,1,0.15),0x8a6a2e);
  kugel(c,fx-L*0.39,fy+0.012,-0.006,0.008,0.005,0.008,0xf4f0e0,8,4); kugel(c,fx-L*0.39,fy+0.016,-0.006,0.0042,0.002,0.0042,0x101010,6,3);
  vc(c,new THREE.TorusGeometry(0.03,0.0015,3,10,PI*0.8),tm(fx-L*0.3,fy+0.016,0,PI/2,0,PI*0.6,1,1,1),0x4a3416);
  for(let i=0;i<12;i++) kugel(c,fx-L*0.15+(i%6)*L*0.09,fy+0.0175,-0.02+Math.floor(i/6)*0.03,0.006,0.0012,0.005,0x9a7a3a,5,2);
  for(const x of [-w*0.4,-w*0.33]){ zyl(c,x,th*0.8+0.01,d*0.3,0.02,0.02,0.004,0xf2d21b,14,0.3,0,0); zyl(c,x,th*0.8+0.0122,d*0.3,0.016,0.016,0.0012,0xfaf2c0,12,0.3,0,0); }
  for(let i=0;i<5;i++) kugel(c,w*0.38+(i%2)*0.012,th*0.85,d*0.28+i*0.01,0.01,0.004,0.008,0x3f8a2a,6,3);
  const F=[{y:th,hw:T.hw*1.002,hd:T.hd*1.002,r:0.02},{y:h*0.7,hw:w*0.47,hd:d*0.44,r:0.04},{y:h*0.995,hw:w*0.38,hd:d*0.26,r:0.05}];
  fo(c,loft(F,3)); fo(c,kappe(F[2],F[2].y,true,3));
  pr(c,uvR(quad([w*0.02,th*0.15,d*0.4985],[w*0.47,th*0.15,d*0.4985],[w*0.47,th*0.15+h*0.52,d*0.452],[w*0.02,th*0.15+h*0.52,d*0.452]),A.uv.e));
  return fertig(c,A); };

/* Hummer: Styroporbox (Thermobox) mit Klarsichtdeckel, darin der rote
   Hummer auf Algen und Eis; vorn der Aufkleber */
VP_FORM.hummer=t=>{ const c=C(t), a=c.a, {w,h,d}=c, th=h*0.72, wd=0.014;
  const A=mkAtlas([{k:'v',w,h:th,draw:(g,W,H)=>{ styro(g,W,H); g.save(); g.translate(W*0.05,H*0.12); g.fillStyle='#fff'; g.fillRect(-W*0.008,-H*0.03,W*0.6+W*0.016,H*0.82); drawFront(g,W*0.6,H*0.76,a,0); g.restore();
      g.fillStyle='#1d6fb8'; g.fillRect(W*0.7,H*0.2,W*0.26,H*0.6); WZ.txt(g,'❄',W*0.83,H*0.4,W*0.2,H*0.24,WFNT.klar,'#fff'); WZ.txt(g,'FRISCH',W*0.83,H*0.62,W*0.22,H*0.14,WFNT.kond,'#fff'); }},
    {k:'st',w:d,h:th,q:0.5,draw:styro}],{rough:0.85});
  pr(c,boxOhne(w,th,d,{pz:A.uv.v,nz:A.uv.st,px:A.uv.st,nx:A.uv.st,ny:A.uv.st},['py']),tm(0,th/2,0));
  for(const [x,z,bw,bd] of [[0,d/2-wd/2,w,wd],[0,-d/2+wd/2,w,wd],[w/2-wd/2,0,wd,d],[-w/2+wd/2,0,wd,d]]) kiste(c,x,th-0.001,z,bw*0.999,0.002,bd*0.999,0xf2f3ef);
  vc(c,innen(boxOhne(w-2*wd,th,d-2*wd,{},['py'])),tm(0,th/2+0.002,0),0xe2e4e0);
  /* Algen und Eis */
  for(let i=0;i<10;i++) kugel(c,(c.rnd()-0.5)*w*0.8,th*0.42,(c.rnd()-0.5)*d*0.7,0.04,0.004,0.02,i%2?0x2f5a2a:0x3f6a32,7,3,[0,c.rnd()*3,0]);
  for(let i=0;i<14;i++) ico(c,(c.rnd()-0.5)*w*0.82,th*0.45,(c.rnd()-0.5)*d*0.72,0.009,0xe4f4ff);
  /* Hummer */
  const rot=0xc0281e, dun=0x9a1c16, y=th*0.45+0.022;
  kugel(c,-w*0.08,y,0,0.055,0.03,0.034,rot,12,8);
  for(let i=0;i<6;i++){ const s=1-i*0.1; kugel(c,-w*0.08+0.055+i*0.026,y-0.002-i*0.002,0,0.017,0.022*s,0.03*s,i%2?rot:dun,8,6); }
  for(let k=-1;k<=1;k++) kugel(c,-w*0.08+0.055+6*0.026+0.012,y-0.012,k*0.016,0.02,0.004,0.01,dun,6,3,[0,k*0.5,0]);
  for(const s of [-1,1]){ zyl(c,-w*0.08-0.05,y,s*0.03,0.007,0.007,0.05,rot,6,0,s*0.6,PI/2);
    kugel(c,-w*0.08-0.1,y,s*0.05,0.042,0.02,0.024,rot,10,6,[0,s*0.35,0]); kugel(c,-w*0.08-0.145,y+0.002,s*0.065,0.022,0.008,0.009,dun,6,4,[0,s*0.5,0]); kugel(c,-w*0.08-0.142,y-0.006,s*0.052,0.02,0.006,0.008,rot,6,4,[0,s*0.2,0]);
    zyl(c,-w*0.08-0.09,y+0.012,s*0.014,0.0012,0.0012,0.12,dun,4,0,s*0.3,PI/2);
    for(let i=0;i<4;i++) zyl(c,-w*0.08+0.01+i*0.016,y-0.012,s*0.045,0.0022,0.0022,0.04,dun,4,PI/2-s*0.2,0,0); }
  kugel(c,-w*0.08-0.045,y+0.02,0.014,0.004,0.004,0.004,0x111111,4,3); kugel(c,-w*0.08-0.045,y+0.02,-0.014,0.004,0.004,0.004,0x111111,4,3);
  fo(c,new THREE.BoxGeometry(w*0.996,h-th,d*0.996),tm(0,th+(h-th)/2,0));
  for(const s of [-1,1]) kiste(c,0,h-0.002,s*(d/2-0.004),w*0.98,0.003,0.006,0xf2f3ef);
  return fertig(c,A); };

/* Austern: Spankiste aus Holzlatten, darin Holzwolle und die Austern;
   vorn das angetackerte Etikett, ins Holz gebrannt der Name */
VP_FORM.austern=t=>{ const c=C(t), a=c.a, {w,h,d}=c, kh=h*0.74, lt=0.006, ph=kh/3-0.006, pf=0.016;
  const A=mkAtlas([{k:'hz',w:w,h:ph*3,q:0.6,draw:(g,W,H)=>holz(g,W,H,'#d6b07a',true)},{k:'st',w:w,h:ph,draw:(g,W,H)=>{ holz(g,W,H,'#d6b07a',true); WZ.txt(g,'ÎLE DE RÉ · AUSTERN',W/2,H*0.55,W*0.9,H*0.6,WFNT.serif,'rgba(70,35,10,.75)'); }},
    {k:'e',w:w*0.66,h:h*0.42,draw:fEtikett(c,'#f4efe0')}],{rough:0.85});
  /* Latten: vorn/hinten/seitlich je drei, Ecksaeulen, Boden */
  for(let i=0;i<3;i++){ const y=0.004+i*(ph+0.006)+ph/2;
    pr(c,boxU(w,ph,lt,{alle:A.uv.hz,pz:i===2?A.uv.st:A.uv.hz}),tm(0,y,d/2-lt/2)); pr(c,boxU(w,ph,lt,{alle:A.uv.hz}),tm(0,y,-d/2+lt/2));
    for(const s of [-1,1]) pr(c,boxU(lt,ph,d-2*lt,{alle:A.uv.hz}),tm(s*(w/2-lt/2),y,0)); }
  for(const sx of [-1,1]) for(const sz of [-1,1]) pr(c,boxU(pf,kh,pf,{alle:A.uv.hz}),tm(sx*(w/2-lt-pf/2),kh/2,sz*(d/2-lt-pf/2)));
  pr(c,boxU(w,0.004,d,{alle:A.uv.hz}),tm(0,0.002,0));
  /* Holzwolle und Austern */
  vc(c,flaeche(12,8,(u,v)=>[(u-0.5)*w*0.95,kh*0.82+0.01*Math.sin(u*37+v*13)*Math.cos(u*19-v*29),(0.5-v)*d*0.92]),tm(0,0,0),0xd8b878);
  for(let i=0;i<26;i++) zyl(c,(c.rnd()-0.5)*w*0.8,kh*0.84+c.rnd()*0.008,(c.rnd()-0.5)*d*0.45,0.0012,0.0012,0.05+c.rnd()*0.03,c.rnd()<0.5?0xe2c488:0xc9a462,3,PI/2+(c.rnd()-0.5)*0.4,c.rnd()*3,0);
  [[-0.32,-0.25],[-0.1,-0.28],[0.12,-0.24],[0.33,-0.22],[-0.3,0.05],[-0.06,0.02],[0.18,0.06],[0.34,0.2],[-0.2,0.28],[0.06,0.3]].forEach(([fx,fz],i)=>{ const x=fx*w, z=fz*d, ry=c.rnd()*3, y=kh*0.86+0.006;
    if(i%4===1){ kugel(c,x,y,z,0.036,0.011,0.026,0x6e6658,8,4,[0.1,ry,0]); kugel(c,x,y+0.006,z,0.03,0.004,0.021,0xe8e4dc,8,3,[0.1,ry,0]); kugel(c,x,y+0.009,z,0.02,0.004,0.014,0xbdb2a0,6,3,[0.1,ry,0]); return; }
    kugel(c,x,y,z,0.038,0.011,0.026,i%2?0x6e6658:0x7a7466,8,4,[0.15,ry,0.1]); kugel(c,x-0.003,y+0.006,z,0.032,0.008,0.022,i%3?0x9a9a88:0x8c8a7a,8,3,[0.1,ry,0.12]); kugel(c,x-0.006,y+0.009,z,0.022,0.005,0.015,0xa8a898,6,3,[0.1,ry,0.12]); });
  kugel(c,w*0.36,kh*0.86+0.012,-d*0.02,0.022,0.018,0.022,0xf2d21b,8,6); 
  /* Etikett vorn auf den Latten */
  pr(c,uvR(new THREE.PlaneGeometry(w*0.62,h*0.4),A.uv.e),tm(-w*0.06,kh*0.42,d/2+0.0008));
  for(const s of [-1,1]) kiste(c,-w*0.06+s*w*0.28,kh*0.6,d/2+0.0012,0.008,0.002,0.0008,0xb0b4ba);
  return fertig(c,A); };

/* Kaviar: schwarze Geschenkbox mit goldener Kante und Acryldeckel - darin
   die blaue Kaviardose, Perlmuttloeffel und Blinis */
VP_FORM.kaviar=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.6;
  const A=mkAtlas([{k:'v',w,h:bh,draw:(g,W,H)=>{ g.fillStyle='#0b0b10'; g.fillRect(0,0,W,H); g.strokeStyle='#d9b45a'; g.lineWidth=H*0.03; g.strokeRect(H*0.05,H*0.06,W-H*0.1,H*0.88); g.save(); g.translate(H*0.1,H*0.12); drawFront(g,W-H*0.2,H*0.76,a,0); g.restore(); }},
    {k:'s',w:d,h:bh,q:0.5,draw:(g,W,H)=>{ g.fillStyle='#0b0b10'; g.fillRect(0,0,W,H); g.fillStyle='#d9b45a'; g.fillRect(0,H*0.08,W,H*0.04); g.fillRect(0,H*0.88,W,H*0.04); }},
    {k:'dl',w:0.1,h:0.1,draw:(g,W,H)=>{ g.fillStyle='#1d3a6b'; g.fillRect(0,0,W,H); g.strokeStyle='#d9b45a'; g.lineWidth=W*0.03; g.beginPath(); g.arc(W/2,H/2,W*0.44,0,T2); g.stroke(); WZ.txt(g,'CAVIAR',W/2,H*0.45,W*0.7,H*0.18,WFNT.serif,'#e8c35a'); WZ.txt(g,'IMPERIAL · 50 g',W/2,H*0.62,W*0.6,H*0.08,WFNT.kond,'#e8c35a'); }}],{rough:0.35,metal:0.2});
  pr(c,boxOhne(w,bh,d,{pz:A.uv.v,nz:A.uv.s,px:A.uv.s,nx:A.uv.s,ny:A.uv.s},['py']),tm(0,bh/2,0));
  vc(c,new THREE.PlaneGeometry(w*0.99,d*0.99),tm(0,bh-0.001,0,-PI/2,0,0),0x16161e);
  kugel(c,-w*0.17,bh,0,0.06,0.006,0.06,0x0a0a10,14,4);
  zyl(c,-w*0.17,bh+0.01,0,0.048,0.048,0.02,0x1d3a6b,24); ring(c,-w*0.17,bh+0.02,0,0.047,0.002,0xd9b45a,PI/2,0,0,24);
  pr(c,uvR(new THREE.CircleGeometry(0.046,24),A.uv.dl),tm(-w*0.17,bh+0.0202,0,-PI/2,0,0));
  for(let i=0;i<5;i++) zyl(c,w*0.17,bh+0.003+i*0.0055,-d*0.12,0.024,0.024,0.005,i%2?0xe2c08a:0xd8b070,14);
  kugel(c,w*0.07,bh+0.004,d*0.2,0.012,0.003,0.018,0xf2ece6,8,4,[0,0.6,0]); kiste(c,w*0.13,bh+0.004,d*0.27,0.06,0.003,0.007,0xe8e0da,0,0.6,0);
  zyl(c,w*0.2,bh+0.012,d*0.16,0.022,0.02,0.024,0xf4f4f0,14); zyl(c,w*0.2,bh+0.0245,d*0.16,0.0225,0.0225,0.002,0xd9b45a,14);
  fo(c,new THREE.BoxGeometry(w*0.995,h-bh,d*0.995),tm(0,bh+(h-bh)/2,0));
  for(const [x,z,bw,bd] of [[0,d/2-0.002,w,0.004],[0,-d/2+0.002,w,0.004],[w/2-0.002,0,0.004,d],[-w/2+0.002,0,0.004,d]]) kiste(c,x,bh+0.002,z,bw*0.999,0.004,bd*0.999,0xd9b45a);
  for(const sx of [-1,1]) for(const sz of [-1,1]) kiste(c,sx*(w/2-0.002),bh+(h-bh)/2,sz*(d/2-0.002),0.003,h-bh,0.003,0xe8e2d0);
  return fertig(c,A); };

/* Tiramisu: Glasschale mit Griffmulden und Kunststoffdeckel, durch das Glas
   sieht man die Schichten; vorn klebt das Etikett */
VP_FORM.tiramisu=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.8, B={hw:w*0.42,hd:d*0.4,r:0.025}, T={hw:w*0.47,hd:d*0.47,r:0.03};
  const A=mkAtlas([{k:'e',w:w*0.62,h:bh*0.62,draw:fEtikett(c,'#e8c35a',true)}],{rough:0.4});
  gl(c,loft([Object.assign({y:0},B),Object.assign({y:bh},T)],4)); gl(c,kappe(B,0.002,false,4));
  for(const s of [-1,1]) gl(c,new THREE.BoxGeometry(w*0.03,0.01,d*0.4),tm(s*(T.hw+w*0.014),bh-0.008,0));
  const lay=[[0.006,0.02,0x8a5a2a],[0.02,0.036,0xf2e6c8],[0.036,0.05,0x7a4a20],[0.05,0.07,0xf4ead0]];
  const at=q=>({hw:(B.hw+(T.hw-B.hw)*q)*0.96,hd:(B.hd+(T.hd-B.hd)*q)*0.95,r:0.024});
  lay.forEach(([y0,y1,col])=>{ const q0=y0/bh, q1=y1/bh; vc(c,loft([Object.assign({y:y0*bh/0.08},at(q0*bh/0.08)),Object.assign({y:y1*bh/0.08},at(q1*bh/0.08))],4),tm(0,0,0),col); });
  const yt=0.07*bh/0.08; vc(c,kappe(at(yt/bh),yt,true,4),tm(0,0,0),0x5a3418);
  for(let i=0;i<8;i++) kugel(c,(c.rnd()-0.5)*w*0.6,yt+0.002,(c.rnd()-0.5)*d*0.6,0.009,0.003,0.009,0x4a2810,6,3);
  /* Deckel */
  vc(c,loft([{y:bh-0.002,hw:T.hw+0.004,hd:T.hd+0.004,r:0.033},{y:bh+0.008,hw:T.hw+0.004,hd:T.hd+0.004,r:0.033},{y:bh+0.008,hw:T.hw-0.002,hd:T.hd-0.002,r:0.03}],4),tm(0,0,0),0x7a4a26);
  fo(c,loft([{y:bh+0.006,hw:T.hw,hd:T.hd,r:0.03},{y:h*0.97,hw:T.hw*0.94,hd:T.hd*0.92,r:0.04}],4)); fo(c,kappe({hw:T.hw*0.94,hd:T.hd*0.92,r:0.04},h*0.97,true,4));
  const ez=B.hd+(T.hd-B.hd)*0.55+0.0016; pr(c,uvR(quad([-w*0.3,bh*0.18,B.hd+(T.hd-B.hd)*0.18+0.0016],[w*0.3,bh*0.18,B.hd+(T.hd-B.hd)*0.18+0.0016],[w*0.3,bh*0.8,B.hd+(T.hd-B.hd)*0.8+0.0016],[-w*0.3,bh*0.8,B.hd+(T.hd-B.hd)*0.8+0.0016]),A.uv.e));
  return fertig(c,A); };

/* Neujahrstorte: weisse Tortenschachtel mit Sichtfenster im Deckel und
   goldenem Band mit Schleife; darin die Sahnetorte mit Rosetten */
VP_FORM.neujahrstorte=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h-0.016, rx=w*0.3, ex=0.018;
  const weiss=(g,W,H)=>{ g.fillStyle='#fbf8f2'; g.fillRect(0,0,W,H); g.fillStyle='rgba(200,160,60,.35)'; const s=Math.max(6,Math.min(W,H)*0.06); for(let y=s/2;y<H;y+=s) for(let x=((y/s|0)%2)*s/2;x<W;x+=s){ g.beginPath(); g.arc(x,y,s*0.08,0,T2); g.fill(); } };
  const fw=w*0.62, fd=d*0.52;
  const A=mkAtlas([{k:'v',w,h:bh,draw:fVorn(c)},{k:'s',w:d,h:bh,q:0.5,draw:weiss},{k:'h',w,h:bh,q:0.6,draw:rueck(c,true)},
    {k:'o',w,h:d,draw:(g,W,H)=>{ weiss(g,W,H); const cx=W*0.45, cy=H*0.47, ew=fw/w*W/2, eh=fd/d*H/2;
      WZ.txt(g,'Prosit Neujahr',cx,H*0.88,W*0.7,H*0.07,WFNT.schreib,'#b08a3e'); WZ.txt(g,a.title,cx,H*0.08,W*0.8,H*0.06,WFNT.rund,a.ac);
      g.strokeStyle='#d9b45a'; g.lineWidth=W*0.012; g.beginPath(); g.ellipse(cx,cy,ew*1.04,eh*1.03,0,0,T2); g.stroke();
      stanz(g,g2=>g2.ellipse(cx,cy,ew,eh,0,0,T2)); }}],{rough:0.6,alpha:true});
  pr(c,boxU(w,bh,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,py:A.uv.o,ny:A.uv.s}),tm(0,bh/2,0));
  vc(c,innen(new THREE.BoxGeometry(w*0.985,bh*0.98,d*0.99)),tm(0,bh/2,0),0xf2efe6);
  const cx=-0.05*w, R=Math.min(w*0.4,d*0.3), ty=bh*0.6;
  zyl(c,cx,0.003,0,R*1.06,R*1.06,0.004,0xd9b45a,28);
  zyl(c,cx,0.005+ty/2,0,R,R,ty,0xfbf6ec,28); ring(c,cx,0.009,0,R*1.0,0.006,0x6a3a1a,PI/2,0,0,28);
  for(let i=0;i<14;i++){ const an=i/14*T2, x=cx+Math.sin(an)*R*0.82, z=Math.cos(an)*R*0.82; vc(c,new THREE.ConeGeometry(0.012,0.018,7),tm(x,0.005+ty+0.009,z),0xf6eedd); kugel(c,x,0.005+ty+0.02,z,0.006,0.006,0.006,i%2?0xc8102a:0xd9b45a,6,4); }
  for(let i=0;i<4;i++) kiste(c,cx-0.03+i*0.02,0.005+ty+0.002,0,0.014,0.003,0.022,0x3a1a0a);
  /* Band und Schleife */
  const bx=w*0.33; kiste(c,bx,bh+0.0008,0,ex,0.0016,d*0.999,0xd9a521); kiste(c,bx,bh/2,d/2+0.0008,ex,bh,0.0016,0xd9a521); kiste(c,bx,bh/2,-d/2-0.0008,ex,bh,0.0016,0xd9a521);
  for(const s of [-1,1]) vc(c,new THREE.TorusGeometry(0.02,0.005,5,14),tm(bx+s*0.016,bh+0.006,d*0.3,PI/2,0,s*0.5,1,0.55,1),0xe0b030);
  kugel(c,bx,bh+0.007,d*0.3,0.009,0.006,0.009,0xc8961a,6,4);
  for(const s of [-1,1]) kiste(c,bx+s*0.008,bh+0.002,d*0.3+0.03,0.012,0.002,0.05,0xd9a521,0,s*0.25,0);
  fo(c,new THREE.PlaneGeometry(fw,fd),tm(-0.05*w,bh-0.0012,(0.5-0.47)*d,-PI/2,0,0));
  return fertig(c,A); };

/* =================== Getraenke =================== */
/* Flaschenprofile [r,y] von unten nach oben */
const PROF={
  bier:(r,H)=>[[0,0],[r*0.9,0],[r,0.006],[r,H*0.56],[r*0.92,H*0.64],[r*0.55,H*0.74],[r*0.38,H*0.83],[r*0.36,H*0.95],[r*0.42,H*0.962],[r*0.38,H*0.975],[0,H*0.975]],
  pet:(r,H)=>[[0,0],[r*0.75,0],[r*0.95,0.008],[r,0.02],[r,H*0.6],[r*0.92,H*0.7],[r*0.5,H*0.84],[r*0.3,H*0.9],[r*0.3,H*0.93],[0,H*0.93]],
  buegel:(r,H)=>[[0,0],[r*0.9,0],[r,0.008],[r,H*0.6],[r*0.94,H*0.67],[r*0.5,H*0.8],[r*0.36,H*0.87],[r*0.4,H*0.89],[r*0.36,H*0.9],[0,H*0.9]],
  sekt:(r,H)=>[[0,0],[r*0.9,0],[r,0.008],[r,H*0.56],[r*0.8,H*0.66],[r*0.42,H*0.76],[r*0.34,H*0.97],[0,H*0.97]],
  gin:(r,H)=>[[0,0],[r*0.95,0],[r,0.006],[r,H*0.72],[r*0.9,H*0.78],[r*0.36,H*0.84],[r*0.32,H*0.94],[0,H*0.94]],
  mini:(r,H)=>[[0,0],[r,0.004],[r,H*0.6],[r*0.42,H*0.78],[r*0.4,H*0.86],[0,H*0.86]]
};
/* Flaschenetikett: Ring-Ausschnitt vorn (Bogen L) */
const etikett=(r,hh,L,seg)=>new THREE.CylinderGeometry(r,r,hh,seg||8,1,true,-L/2,L);

/* Pils: Sechserpack im Karton-Traeger mit Griffloch, die braunen
   Flaschen ragen mit Kronkorken und Goldfolie heraus */
VP_FORM.bier=t=>{ const c=C(t), a=c.a, {w,h,d}=c, rb=Math.min(w/6,d/4)*0.86, hb=h*0.97, ch=h*0.56;
  const A=mkAtlas([{k:'v',w,h:ch,draw:fVorn(c)},{k:'h',w,h:ch,draw:rueck(c)},{k:'s',w:d,h:ch,draw:fSeite(c)},
    {k:'g',w,h:h-ch*0.6,q:0.6,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); g.fillStyle=a.ac; WZ.txt(g,a.title,W/2,H*0.62,W*0.7,H*0.18,WFNT.rund,a.ac); const gw=W*0.3, gh=H*0.12; g.strokeStyle=a.ac2; g.lineWidth=H*0.02; WZ.rr(g,W/2-gw/2,H*0.22,gw,gh,gh/2); g.stroke(); stanz(g,g2=>WZ.rr(g2,W/2-gw/2,H*0.22,gw,gh,gh/2)); }}],{rough:0.6,alpha:true,double:true});
  pr(c,boxOhne(w,ch,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,ny:A.uv.s},['py']),tm(0,ch/2,0));
  const gh=h-ch*0.6; pr(c,uvR(new THREE.PlaneGeometry(w*0.99,gh),A.uv.g),tm(0,ch*0.6+gh/2,0));
  const pf=PROF.bier(rb,hb);
  for(let ix=0;ix<3;ix++) for(const sz of [-1,1]){ const x=(ix-1)*w/3, z=sz*d/4;
    vc(c,dreh(pf,10),tm(x,0,z),0x4a2206); zyl(c,x,hb*0.98,z,rb*0.42,rb*0.42,hb*0.025,0xd9b45a,10);
    vc(c,etikett(rb*0.4,hb*0.1,T2,10),tm(x,hb*0.9,z),0xe8c35a); vc(c,etikett(rb*1.01,hb*0.16,PI*0.9),tm(x,ch+hb*0.02,z,0,sz>0?0:PI,0),0xf2ecd8); }
  return fertig(c,A); };

/* Radler: kleiner Kunststoffkasten mit Griffloechern und eingesetztem
   Etikettenfeld, darin sechs gruene Flaschen mit Zitronenetikett */
VP_FORM.radler=t=>{ const c=C(t), a=c.a, {w,h,d}=c, rb=Math.min(w/6,d/4)*0.84, hb=h*0.97, ch=h*0.6, gruen='#2a8a3a';
  const kasten=(g,W,H,feld)=>{ g.fillStyle=gruen; g.fillRect(0,0,W,H); g.fillStyle='rgba(0,0,0,.18)'; for(let x=W*0.04;x<W;x+=W*0.08) g.fillRect(x,H*0.05,W*0.012,H*0.9);
    g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(0,0,W,H*0.05); g.fillRect(0,H*0.95,W,H*0.05);
    if(feld){ g.fillStyle='#1d6a2a'; g.fillRect(W*0.14,H*0.1,W*0.72,H*0.84); g.save(); g.translate(W*0.16,H*0.13); drawFront(g,W*0.68,H*0.78,a,0); g.restore(); }
    else { const gw=W*0.5, gh=H*0.16; stanz(g,g2=>WZ.rr(g2,W/2-gw/2,H*0.1,gw,gh,gh/2)); } };
  const A=mkAtlas([{k:'v',w,h:ch,draw:(g,W,H)=>kasten(g,W,H,true)},{k:'s',w:d,h:ch,q:0.6,draw:(g,W,H)=>kasten(g,W,H,false)},{k:'b',w,h:d,q:0.3,draw:(g,W,H)=>{ g.fillStyle='#1d6a2a'; g.fillRect(0,0,W,H); }}],{rough:0.45,alpha:true,double:true});
  pr(c,boxOhne(w,ch,d,{pz:A.uv.v,nz:A.uv.v,px:A.uv.s,nx:A.uv.s,ny:A.uv.b},['py']),tm(0,ch/2,0));
  for(let i=0;i<2;i++) kiste(c,(i-0.5)*w/3,ch*0.45,0,0.004,ch*0.9,d*0.98,0x237a32); kiste(c,0,ch*0.45,0,w*0.98,ch*0.9,0.004,0x237a32);
  kiste(c,0,ch-0.003,d/2-0.004,w,0.006,0.008,0x34a044); kiste(c,0,ch-0.003,-d/2+0.004,w,0.006,0.008,0x34a044);
  const pf=PROF.bier(rb,hb);
  for(let ix=0;ix<3;ix++) for(const sz of [-1,1]){ const x=(ix-1)*w/3, z=sz*d/4;
    vc(c,dreh(pf,10),tm(x,0,z),0x2a6a22); zyl(c,x,hb*0.98,z,rb*0.42,rb*0.42,hb*0.025,0xf2d21b,10);
    vc(c,etikett(rb*0.4,hb*0.12,T2,10),tm(x,hb*0.89,z),0xf2d21b); vc(c,etikett(rb*0.62,hb*0.07,PI*0.9),tm(x,hb*0.72,z,0,sz>0?0:PI,0),0xf2d21b); }
  return fertig(c,A); };

/* Pils alkoholfrei: sechs Dosen auf dem Kartontray, stramm in
   Schrumpffolie - jede Dose rundum bedruckt */
VP_FORM.bierfrei=t=>{ const c=C(t), a=c.a, {w,h,d}=c, rc=Math.min(w/6,d/4)*0.96, hc=h*0.9, th=h*0.16, Cu=T2*rc;
  const A=mkAtlas([{k:'d',w:Cu,h:hc*0.82,draw:fRund(c,0.46),max:700},{k:'v',w,h:th,draw:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); WZ.txt(g,a.title+' · '+a.sub,W/2,H*0.5,W*0.9,H*0.5,WFNT.kond,a.ac); }},{k:'s',w:d,h:th,q:0.5,draw:fFarbe(a.bg2)}],{rough:0.3,metal:0.35});
  pr(c,boxOhne(w,th,d,{pz:A.uv.v,nz:A.uv.v,px:A.uv.s,nx:A.uv.s,ny:A.uv.s},['py']),tm(0,th/2,0));
  for(let ix=0;ix<3;ix++) for(const sz of [-1,1]){ const x=(ix-1)*w/3, z=sz*d/4;
    vc(c,dreh([[0,0.002],[rc*0.82,0.002],[rc,0.012],[rc,hc*0.92],[rc*0.84,hc*0.985],[rc*0.84,hc],[0,hc]],16),tm(x,0,z),0xc8ccd4);
    pr(c,uvR(new THREE.CylinderGeometry(rc*1.004,rc*1.004,hc*0.82,16,1,true,-PI,T2),A.uv.d),tm(x,0.012+hc*0.41,z,0,sz>0?0:PI,0));
    kiste(c,x,hc+0.0008,z+rc*0.3,rc*0.5,0.0015,rc*0.7,0xb0b4ba); }
  fo(c,loft([{y:0,hw:w*0.499,hd:d*0.499,r:rc},{y:hc*0.98,hw:w*0.499,hd:d*0.499,r:rc},{y:h*0.995,hw:w*0.42,hd:d*0.35,r:rc}],4)); fo(c,kappe({hw:w*0.42,hd:d*0.35,r:rc},h*0.995,true,4));
  return fertig(c,A); };

/* Energydrink: vier schlanke Dosen in einer Reihe, oben der Kunststoff-
   Ringtraeger */
VP_FORM.energy=t=>{ const c=C(t), a=c.a, {w,h,d}=c, rc=Math.min(w/8,d/2)*0.97, hc=h*0.93, Cu=T2*rc;
  const A=mkAtlas([{k:'d',w:Cu,h:hc*0.84,draw:fRund(c,0.5,(g,W,H)=>{ verlauf(g,W,H,'#1b1b2e','#000'); g.strokeStyle=a.ac; g.lineWidth=W*0.01; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(0,H*(0.1+i*0.2)); g.lineTo(W,H*(0.2+i*0.2)); g.stroke(); } },{rueck:false}),max:600}],{rough:0.3,metal:0.4});
  for(let i=0;i<4;i++){ const x=(i-1.5)*w/4;
    vc(c,dreh([[0,0.001],[rc*0.82,0.001],[rc,0.01],[rc,hc*0.93],[rc*0.84,hc*0.985],[rc*0.84,hc],[0,hc]],14),tm(x,0,0),0xb8bcc4);
    pr(c,uvR(new THREE.CylinderGeometry(rc*1.004,rc*1.004,hc*0.84,14,1,true,-PI,T2),A.uv.d),tm(x,0.01+hc*0.42,0));
    ring(c,x,hc*0.955,0,rc*1.02,0.002,0xe8eef2,PI/2,0,0,14); kiste(c,x,hc+0.0008,rc*0.3,rc*0.5,0.0015,rc*0.7,0x9cff3a); }
  kiste(c,0,hc*0.955,0,w*0.98,0.0015,rc*0.8,0xe8eef2);
  return fertig(c,A); };

/* Cola: sechs 1-l-PET-Flaschen in bedruckter Schrumpffolie mit rotem
   Tragegriff; oben sieht man Schultern und Deckel */
VP_FORM.cola=t=>{ const c=C(t), a=c.a, {w,h,d}=c, rb=Math.min(w/6,d/4)*0.97, hb=h*0.95, y0=0.012, y1=hb*0.6, F={hw:w*0.4985,hd:d*0.4985,r:rb};
  const per=4*(F.hw-F.r)+4*(F.hd-F.r)+T2*F.r;
  const A=mkAtlas([{k:'m',w:per,h:y1-y0,draw:fRund(c,2*F.hw/per)}],{rough:0.3});
  pr(c,uvR(loft([Object.assign({y:y0},F),Object.assign({y:y1},F)],4),A.uv.m));
  const pf=PROF.pet(rb,hb);
  for(let ix=0;ix<3;ix++) for(const sz of [-1,1]){ const x=(ix-1)*w/3, z=sz*d/4; vc(c,dreh(pf,12),tm(x,0,z),0x2a0a06); zyl(c,x,hb*0.95,z,rb*0.34,rb*0.34,hb*0.045,0xd8322a,10); }
  fo(c,loft([{y:0,hw:F.hw,hd:F.hd,r:F.r},Object.assign({y:y0},F)],4)); fo(c,loft([Object.assign({y:y1},F),{y:hb*0.8,hw:w*0.45,hd:d*0.4,r:rb*0.8}],4));
  vc(c,new THREE.TorusGeometry(w*0.26,0.004,4,16,PI),tm(0,hb*0.8,0,0,0,0,1,(h*0.995-hb*0.8)/(w*0.26),3),0xd8322a);
  for(const s of [-1,1]) kiste(c,s*w*0.26,hb*0.8,0,0.03,0.004,0.03,0xd8322a);
  return fertig(c,A); };

/* Mineralwasser: sechs geriffelte 1,5-l-Flaschen in klarer Folie mit
   aufgedrucktem Etikettfeld und Folien-Tragegriff */
VP_FORM.wasser=t=>{ const c=C(t), a=c.a, {w,h,d}=c, rb=Math.min(w/6,d/4)*0.97, hb=h*0.92, F={hw:w*0.4985,hd:d*0.4985,r:rb};
  const A=mkAtlas([{k:'et',w:T2*rb*0.6,h:hb*0.14,q:0.8,draw:(g,W,H)=>{ g.fillStyle='#1d6fd8'; g.fillRect(0,0,W,H); g.fillStyle='#fff'; g.fillRect(0,H*0.1,W,H*0.06); g.fillRect(0,H*0.84,W,H*0.06); WZ.txt(g,a.title,W/2,H*0.5,W*0.9,H*0.42,WFNT.rund,'#fff'); }},
    {k:'fp',w:w*0.7,h:hb*0.34,draw:(g,W,H)=>{ g.clearRect(0,0,W,H); g.save(); WZ.rr(g,0,0,W,H,H*0.08); g.clip(); drawFront(g,W,H,a,0); g.restore(); }},
    {k:'hg',w:w*0.45,h:h-hb*0.78,draw:(g,W,H)=>{ g.fillStyle='rgba(235,245,255,.9)'; g.fillRect(0,0,W,H); WZ.txt(g,'TRAGEGRIFF',W/2,H*0.82,W*0.7,H*0.14,WFNT.kond,'#1d6fd8'); const gw=W*0.55, gh=H*0.3; stanz(g,g2=>WZ.rr(g2,W/2-gw/2,H*0.25,gw,gh,gh/2)); }}],{rough:0.3,alpha:true,double:true});
  const pf=[[0,0],[rb*0.7,0],[rb*0.95,0.01],[rb,0.025]]; for(let i=0;i<3;i++){ const y=0.03+i*hb*0.17; pf.push([rb,y],[rb*0.93,y+hb*0.07],[rb,y+hb*0.14]); }
  pf.push([rb,hb*0.6],[rb*0.6,hb*0.82],[rb*0.3,hb*0.9],[rb*0.3,hb*0.93],[0,hb*0.93]);
  for(let ix=0;ix<3;ix++) for(const sz of [-1,1]){ const x=(ix-1)*w/3, z=sz*d/4;
    gl(c,dreh(pf,8),tm(x,0,z)); vc(c,dreh([[0,0.004],[rb*0.92,0.004],[rb*0.92,hb*0.72],[rb*0.65,hb*0.8],[0,hb*0.8]],8),tm(x,0,z),0xd8ecf8);
    zyl(c,x,hb*0.95,z,rb*0.34,rb*0.34,hb*0.045,0x1d6fd8,10); pr(c,uvR(etikett(rb*1.01,hb*0.14,PI*1.2,10),A.uv.et),tm(x,hb*0.62,z,0,sz>0?0:PI,0)); }
  fo(c,loft([Object.assign({y:0.002},F),Object.assign({y:hb*0.6},F),{y:hb*0.8,hw:w*0.46,hd:d*0.42,r:rb*0.7}],4));
  pr(c,uvR(new THREE.PlaneGeometry(w*0.7,hb*0.34),A.uv.fp),tm(0,hb*0.32,F.hd+0.0008));
  pr(c,uvR(new THREE.PlaneGeometry(w*0.45,h-hb*0.78),A.uv.hg),tm(0,(hb*0.78+h)/2,0));
  return fertig(c,A); };

/* Zitronenlimonade: sechs Buegelflaschen im Drahttraeger mit Holzgriff,
   am Griff haengt das Etikett */
VP_FORM.limonade=t=>{ const c=C(t), a=c.a, {w,h,d}=c, rb=Math.min(w/6,d/4)*0.9, hb=h*0.86, dr=0.0018, silber=0x9aa0a8, tw=w*0.36, tg=h*0.36;
  const A=mkAtlas([{k:'et',w:T2*rb*0.5,h:hb*0.2,q:0.8,draw:(g,W,H)=>{ g.fillStyle='#fff8d0'; g.fillRect(0,0,W,H); g.strokeStyle='#1b5a2a'; g.lineWidth=H*0.04; g.strokeRect(W*0.04,H*0.08,W*0.92,H*0.84); me_zitrone(g,W*0.5,H*0.36,H*0.18,0.3); WZ.txt(g,a.title,W/2,H*0.72,W*0.84,H*0.2,WFNT.rund,'#1b5a2a'); }},
    {k:'v',w:tw,h:tg,draw:(g,W,H)=>{ fEtikett(c,'#1b5a2a',true)(g,W,H); g.fillStyle='#fff'; g.beginPath(); g.arc(W/2,H*0.06,W*0.04,0,T2); g.fill(); }}],{rough:0.5});
  const pf=PROF.buegel(rb,hb), inh=pf.slice(0,6).map(([r,y])=>[r*0.9,y+0.002]).concat([[0,hb*0.67]]);
  for(let ix=0;ix<3;ix++) for(const sz of [-1,1]){ const x=(ix-1)*w/3, z=sz*d/4;
    gl(c,dreh(pf,8),tm(x,0,z)); vc(c,dreh(inh,7),tm(x,0,z),0xf2d548);
    kugel(c,x,hb*0.92,z,rb*0.42,rb*0.3,rb*0.42,0xf4f2ec,6,4); zyl(c,x,hb*0.895,z,rb*0.43,rb*0.43,0.004,0xd8322a,8);
        pr(c,uvR(etikett(rb*1.012,hb*0.2,PI,8),A.uv.et),tm(x,hb*0.32,z,0,sz>0?0:PI,0)); }
  /* Drahttraeger: Bodenrahmen, Ecken, oberer Rahmen, Mittelbuegel mit Holzgriff */
  const hw=w*0.495, hd=d*0.495, yt=hb*0.5;
  for(const y of [0.003,yt]){ for(const s of [-1,1]){ zyl(c,0,y,s*hd,dr,dr,w*0.99,silber,4,0,0,PI/2); zyl(c,s*hw,y,0,dr,dr,d*0.99,silber,4,PI/2,0,0); } }
  for(const sx of [-1,1]) for(const sz of [-1,1]) zyl(c,sx*hw,yt/2,sz*hd,dr,dr,yt,silber,4);
  zyl(c,0,yt,0,dr,dr,w*0.99,silber,4,0,0,PI/2);
  for(const s of [-1,1]) zyl(c,s*hw*0.98,(yt+h*0.94)/2,0,dr,dr,h*0.94-yt,silber,4);
  zyl(c,0,h*0.94,0,0.009,0.009,w*0.5,0xa8783a,8,0,0,PI/2); zyl(c,0,h*0.94,0,dr,dr,w*0.98,silber,4,0,0,PI/2);
  pr(c,uvR(new THREE.PlaneGeometry(tw,tg),A.uv.v),tm(0,h*0.86-tg/2,d*0.485,-0.08,0,0)); zyl(c,0,(h*0.94+h*0.86)/2,d*0.24,0.0008,0.0008,d*0.5,0xe8e0c8,3,-1.27,0,0);
  return fertig(c,A); };

/* Gluehwein: Giebelkarton (Gable Top) mit Siegelkamm und Schraubverschluss
   auf der vorderen Dachschraege */
VP_FORM.gluehwein=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.8, yr=h*0.955, ins=0.006;
  const A=mkAtlas([{k:'v',w,h:bh,draw:fVorn(c)},{k:'h',w,h:bh,draw:rueck(c)},{k:'s',w:d,h:bh,draw:fSeite(c)},
    {k:'r',w,h:Math.hypot(yr-bh,d/2),q:0.7,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg2,a.bg1); g.fillStyle=a.ac2; g.fillRect(0,H*0.84,W,H*0.16); WZ.txt(g,'HEISS GENIESSEN',W/2,H*0.25,W*0.8,H*0.12,WFNT.kond,a.ac); }},
    {k:'t',w:d,h:yr-bh,q:0.6,draw:fFarbe(a.bg2)}],{rough:0.5});
  pr(c,boxOhne(w,bh,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,ny:A.uv.s},['py']),tm(0,bh/2,0));
  pr(c,uvR(quad([-w/2,bh,d/2],[w/2,bh,d/2],[w/2,yr,0.002],[-w/2,yr,0.002]),A.uv.r)); pr(c,uvR(quad([w/2,bh,-d/2],[-w/2,bh,-d/2],[-w/2,yr,-0.002],[w/2,yr,-0.002]),A.uv.r));
  for(const sx of [-1,1]){ const x=sx*w/2, xi=sx*(w/2-ins); pr(c,uvR(sx>0?quad([x,bh,d/2],[x,bh,-d/2],[xi,yr,0],[xi,yr,0]):quad([x,bh,-d/2],[x,bh,d/2],[xi,yr,0],[xi,yr,0]),A.uv.t)); }
  kiste(c,0,yr+(h-yr)/2-0.001,0,w*0.99,h-yr,0.004,parseInt(a.bg2.slice(1),16));
  const be=Math.atan2(yr-bh,d/2), ny=Math.cos(be), nz=Math.sin(be), py=bh+(yr-bh)*0.5, pz=d/2*0.5;
  vc(c,new THREE.CylinderGeometry(0.019,0.019,0.006,16),tm(-w*0.12,py+ny*0.003,pz+nz*0.003,be,0,0),0xf4f0e6);
  vc(c,new THREE.CylinderGeometry(0.016,0.016,0.016,16),tm(-w*0.12,py+ny*0.011,pz+nz*0.011,be,0,0),parseInt((a.ac2||'#e8b418').slice(1),16));
  return fertig(c,A); };

/* Orangensaft: achteckiger Karton (Prisma) mit abgeschraegten Kanten,
   oben die gruene Schraubkappe */
VP_FORM.orangensaft=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.895, F={hw:w*0.5,hd:d*0.5,r:Math.min(w,d)*0.18}, T={hw:w*0.47,hd:d*0.45,r:Math.min(w,d)*0.22};
  const per=4*(F.hw-F.r)+4*(F.hd-F.r)+4*Math.SQRT2*F.r*0.92, ant=(2*(F.hw-F.r)+F.r*1.2)/per;
  const A=mkAtlas([{k:'m',w:per,h:bh,draw:fRund(c,ant)},{k:'o',w,h:d,q:0.6,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); WZ.txt(g,a.title,W*0.68,H*0.7,W*0.5,H*0.18,WFNT.rund,'#fff'); }}],{rough:0.45});
  pr(c,uvR(loft([Object.assign({y:0},F),Object.assign({y:bh},F)],1),A.uv.m));
  pr(c,uvR(loft([Object.assign({y:bh},F),Object.assign({y:h*0.93},T)],1),A.uv.o)); pr(c,uvR(kappe(T,h*0.93,true,1),A.uv.o));
  vc(c,kappe(F,0.001,false,1),tm(0,0,0),0xd87a10);
  const yo=h*0.93; zyl(c,-w*0.17,yo+0.004,d*0.12,0.022,0.022,0.008,0xf4f0e6,18); zyl(c,-w*0.17,yo+0.0125,d*0.12,0.019,0.02,0.015,0x1b7a2a,18);
  for(let i=0;i<12;i++){ const an=i/12*T2; kiste(c,-w*0.17+Math.sin(an)*0.0195,yo+0.0125,d*0.12+Math.cos(an)*0.0195,0.002,0.013,0.002,0x146020,0,an,0); }
  return fertig(c,A); };

/* Kinderpunsch: Tetra-Brik mit flachem Kopf, umgelegtem Siegelstreifen
   und angeklebten Ohren; kleine Drehkappe an der Ecke */
VP_FORM.kinderpunsch=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.945, oh=0.032;
  const A=mkAtlas([{k:'v',w,h:bh,draw:fVorn(c)},{k:'h',w,h:bh,draw:rueck(c)},{k:'s',w:d,h:bh,draw:fSeite(c)},
    {k:'o',w,h:d,q:0.6,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,H*0.46,W,H*0.08); for(let i=0;i<6;i++) WZ.stern(g,W*(0.1+i*0.16),H*0.25,H*0.08,a.ac,5); }},
    {k:'ohr',w:d,h:oh,q:0.6,draw:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); g.fillStyle=a.ac; g.fillRect(0,0,W,H*0.12); }}],{rough:0.45});
  pr(c,boxU(w,bh,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,py:A.uv.o,ny:A.uv.s}),tm(0,bh/2,0));
  /* Siegelstreifen quer, umgelegt; Ohren seitlich heruntergeklappt */
  kiste(c,0,bh+0.0015,-d*0.06,w*0.995,0.003,d*0.16,parseInt(a.bg2.slice(1),16));
  for(const sx of [-1,1]){ const x=sx*(w/2-0.0004); pr(c,uvR(sx>0?quad([x,bh-oh,0],[x,bh-oh,0],[x,bh,-d*0.48],[x,bh,d*0.48]):quad([x,bh-oh,0],[x,bh-oh,0],[x,bh,d*0.48],[x,bh,-d*0.48]),A.uv.ohr)); }
  zyl(c,w*0.24,bh+0.004,d*0.22,0.015,0.015,0.008,0xf4f0e6,14); zyl(c,w*0.24,bh+0.012,d*0.22,0.0125,0.013,0.01,parseInt(a.ac.slice(1),16),14);
  return fertig(c,A); };

/* Partyfass: 5-l-Blechfass mit Sicken, Rundum-Etikett, Klapp-Tragegriff
   oben und Zapfhahn unten vorn */
VP_FORM.partyfass=t=>{ const c=C(t), a=c.a, {w,h,d}=c, R=Math.min(w,d)/2*0.965, y0=h*0.14, y1=h*0.82;
  const A=mkAtlas([{k:'m',w:T2*R,h:y1-y0,draw:fRund(c,0.4),max:1000},{k:'o',w:2*R,h:2*R,q:0.6,draw:(g,W,H)=>{ const gr=g.createRadialGradient(W/2,H/2,0,W/2,H/2,W/2); gr.addColorStop(0,'#e8ecf0'); gr.addColorStop(1,'#9aa1ab'); g.fillStyle=gr; g.fillRect(0,0,W,H); WZ.txt(g,a.title,W/2,H*0.78,W*0.6,H*0.1,WFNT.rund,'#3a3f48'); }}],{rough:0.3,metal:0.45});
  pr(c,uvR(new THREE.CylinderGeometry(R*1.003,R*1.003,y1-y0,28,1,true,-PI,T2),A.uv.m),tm(0,(y0+y1)/2,0));
  vc(c,dreh([[R*0.9,0],[R*0.97,0.004],[R,0.012],[R,y0],[R,y1],[R,h*0.9],[R*0.97,h*0.96],[R*0.92,h*0.975]],28),tm(0,0,0),0xc5ccd6);
  for(const y of [h*0.07,h*0.9]) ring(c,0,y,0,R*1.006,0.004,0x9aa1ab,PI/2,0,0,28);
  pr(c,uvR(new THREE.CircleGeometry(R*0.92,28),A.uv.o),tm(0,h*0.975,0,-PI/2,0,0));
  zyl(c,R*0.4,h*0.982,-R*0.3,0.016,0.016,0.012,0x1b1b1b,12);
  /* Klappgriff, Zapfhahn */
  vc(c,new THREE.TorusGeometry(R*0.55,0.006,5,16,PI),tm(0,h*0.985,0,-PI/2,0,0,1,1,0.6),0x1b1d22);
  for(const s of [-1,1]) kiste(c,s*R*0.55,h*0.982,0,0.016,0.01,0.016,0x1b1d22);
  kiste(c,0,h*0.07,R*0.93,w*0.12,h*0.05,0.016,0x22252c); kiste(c,0,h*0.035,R*0.95,0.014,h*0.06,0.012,0xd8322a);
  return fertig(c,A); };

/* Single Malt: Geschenkroehre aus Karton mit Metalldeckel und -boden */
VP_FORM.whisky=t=>{ const c=C(t), a=c.a, {w,h,d}=c, R=Math.min(w,d)/2*0.985, yb=h*0.035, yt=h*0.9;
  const A=mkAtlas([{k:'m',w:T2*R,h:yt-yb,draw:fRund(c,0.33),max:1000},{k:'o',w:2*R,h:2*R,q:0.7,draw:(g,W,H)=>{ g.fillStyle='#2a1a0e'; g.fillRect(0,0,W,H); g.strokeStyle='#e8c35a'; g.lineWidth=W*0.03; g.beginPath(); g.arc(W/2,H/2,W*0.4,0,T2); g.stroke(); WZ.txt(g,'12',W/2,H*0.48,W*0.5,H*0.32,WFNT.serif,'#e8c35a'); WZ.txt(g,'YEARS',W/2,H*0.7,W*0.4,H*0.1,WFNT.serif,'#e8c35a'); }}],{rough:0.4,metal:0.25});
  pr(c,uvR(new THREE.CylinderGeometry(R*0.985,R*0.985,yt-yb,28,1,true,-PI,T2),A.uv.m),tm(0,(yb+yt)/2,0));
  vc(c,dreh([[0,0],[R*0.95,0],[R,0.004],[R,yb+0.006],[R*0.985,yb+0.008]],28),tm(0,0,0),0x2a1a0e);
  vc(c,dreh([[R*0.985,yt-0.004],[R,yt-0.002],[R,h-0.004],[R*0.96,h]],28),tm(0,0,0),0xb8923a);
  ring(c,0,yt+0.006,0,R*1.002,0.0018,0x7a5a1a,PI/2,0,0,28); ring(c,0,h-0.012,0,R*1.002,0.0018,0x7a5a1a,PI/2,0,0,28);
  pr(c,uvR(new THREE.CircleGeometry(R*0.96,28),A.uv.o),tm(0,h,0,-PI/2,0,0));
  return fertig(c,A); };

/* Eiswuerfel: klarer Eisbeutel mit Bedruckung in der Mitte, oben die
   Siegelnaht mit Aufhaengeloch, innen die Wuerfel */
VP_FORM.eiswuerfel=t=>{ const c=C(t), a=c.a, {w,h,d}=c, sn=h*0.07, l0=0.34, l1=0.72;
  const druck=(vorn)=>(g,W,H)=>{ g.clearRect(0,0,W,H); const s=H*sn/h; g.fillStyle='rgba(235,248,255,.92)'; g.fillRect(0,0,W,s); g.fillRect(0,H-s*0.7,W,s*0.7);
    g.fillStyle='#1557a8'; for(let x=0;x<W;x+=W*0.02) g.fillRect(x,s*0.15,W*0.008,s*0.7); euroloch(g,W/2,s*0.45,W*0.05);
    const y0=H*(1-l1), y1=H*(1-l0); if(vorn){ g.save(); g.translate(W*0.06,y0); drawFront(g,W*0.88,y1-y0,a,0); g.restore(); } else { g.save(); g.translate(W*0.1,y0); rueck(c)(g,W*0.8,y1-y0); g.restore(); }
    g.fillStyle='rgba(21,87,168,.9)'; g.fillRect(0,y1,W,H*0.03); WZ.txt(g,'❄ TIEFGEKÜHLT −18 °C',W/2,y1+H*0.015,W*0.8,H*0.024,WFNT.kond,'#fff'); };
  const A=mkAtlas([{k:'v',w,h,draw:druck(true)},{k:'h',w,h,draw:druck(false)}],{rough:0.3,alpha:true,double:true});
  const K=kissenForm(w,h,d,sn,{ex:0.35,nu:12,nv:14}); pr(c,uvR(K.vorn,A.uv.v)); pr(c,uvR(K.hinten,A.uv.h));
  const K2=kissenForm(w,h,d,sn,{ex:0.35,nu:12,nv:14}); fo(c,K2.vorn,tm(0,0,0.0006)); fo(c,K2.hinten,tm(0,0,-0.0006));
  /* Eiswuerfel in der Tuete */
  const zb=v=>{ const y=v*h; return (y<sn||y>h-sn)?0:Math.pow(Math.sin(PI*(y-sn)/(h-2*sn)),0.35); };
  for(let i=0;i<46;i++){ const v=0.12+c.rnd()*0.76, u=0.16+c.rnd()*0.68, q=zb(v)*Math.pow(Math.sin(PI*u),0.42)*(d/2)*0.62, s=0.022+c.rnd()*0.008;
    const qz=Math.max(0,q*1.5-s*0.8); kiste(c,(u-0.5)*w*0.88,v*h,(c.rnd()*2-1)*qz,s,s,s,[0xcfeefc,0xb8e2f8,0xe2f6ff][i%3],c.rnd()*3,c.rnd()*3,c.rnd()*3); }
  return fertig(c,A); };

/* Hugo-Set: Geschenktuete aus Papier mit Kordelgriffen, oben schauen
   Proseccoflasche, Holunderflasche, Minze und Seidenpapier heraus */
VP_FORM.hugo=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.7, bw=w*0.97, bd=d*0.94;
  const A=mkAtlas([{k:'v',w:bw,h:bh,draw:(g,W,H)=>{ g.fillStyle='#f4f7ec'; g.fillRect(0,0,W,H); g.save(); g.translate(W*0.06,H*0.05); drawFront(g,W*0.88,H*0.9,a,0); g.restore(); }},
    {k:'h',w:bw,h:bh,draw:rueck(c,true)},{k:'s',w:bd,h:bh,q:0.5,draw:(g,W,H)=>{ g.fillStyle='#e8eedc'; g.fillRect(0,0,W,H); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=W*0.012; g.beginPath(); g.moveTo(W/2,H*0.12); g.lineTo(W/2,H); g.moveTo(0,0); g.lineTo(W/2,H*0.12); g.lineTo(W,0); g.stroke(); }}],{rough:0.8});
  pr(c,boxOhne(bw,bh,bd,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,ny:A.uv.s},['py']),tm(0,bh/2,0));
  vc(c,innen(boxOhne(bw*0.99,bh,bd*0.99,{},['py'])),tm(0,bh/2,0),0xdfe8d0);
  for(const s of [-1,1]){ vc(c,new THREE.TorusGeometry(w*0.16,0.0028,4,14,PI),tm(0,bh,s*bd*0.48,0,0,0,1,(h*0.9-bh)/(w*0.16),1),0x5a8a3a);
    for(const x of [-1,1]) kiste(c,x*w*0.16,bh-0.012,s*(bd/2+0.0008),0.012,0.012,0.0012,0xd9b45a); }
  /* Prosecco */
  vc(c,dreh(PROF.sekt(0.036,h*0.99),12),tm(-w*0.17,0.004,-d*0.1),0x2f5a2a); zyl(c,-w*0.17,h*0.9,-d*0.1,0.0135,0.0125,h*0.17,0xd9b45a,10);
  /* Holundersirup */
  gl(c,dreh(PROF.gin(0.03,h*0.84),10),tm(w*0.18,0.004,-d*0.05)); vc(c,dreh(PROF.gin(0.027,h*0.6),8),tm(w*0.18,0.006,-d*0.05),0xe8d890); zyl(c,w*0.18,h*0.84,-d*0.05,0.011,0.011,0.02,0x3f8a2a,10);
  /* Minze, Seidenpapier */
  for(let i=0;i<9;i++) kugel(c,w*0.02+(c.rnd()-0.5)*0.05,bh+0.02+c.rnd()*0.05,d*0.12+(c.rnd()-0.5)*0.04,0.014,0.004,0.009,i%2?0x3f9a3a:0x5ab84a,6,3,[c.rnd()*2,c.rnd()*3,c.rnd()]);
  for(let i=0;i<7;i++) ico(c,(i-3)*w*0.13,bh+0.012+(i%3)*0.008,(i%2?1:-1)*d*0.2,0.03,i%2?0xffffff:0xe8f6dc,0.7);
  return fertig(c,A); };

/* Gin & Tonic: Geschenkkarton mit grossem Sichtfenster - Ginflasche und
   vier Tonicflaschen; unten das Druckbild */
VP_FORM.gintonic=t=>{ const c=C(t), a=c.a, {w,h,d}=c, fy0=0.06, fy1=0.56;
  const A=mkAtlas([{k:'v',w,h,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); g.save(); g.translate(W*0.04,H*0.6); drawFront(g,W*0.92,H*0.37,a,0); g.restore();
      g.strokeStyle=a.ac2; g.lineWidth=W*0.012; WZ.rr(g,W*0.06,H*fy0,W*0.88,H*(fy1-fy0),W*0.05); g.stroke(); WZ.txt(g,'GESCHENKSET',W/2,H*0.03,W*0.6,H*0.03,WFNT.kond,a.ac2);
      stanz(g,g2=>WZ.rr(g2,W*0.06,H*fy0,W*0.88,H*(fy1-fy0),W*0.05)); }},
    {k:'s',w:d,h,draw:fSeite(c)},{k:'h',w,h,draw:rueck(c)},{k:'o',w,h:d,q:0.6,draw:fOben(c)},
    {k:'gl',w:0.07,h:0.09,draw:(g,W,H)=>{ g.fillStyle='#f4f1e6'; g.fillRect(0,0,W,H); g.strokeStyle='#12406b'; g.lineWidth=W*0.04; g.strokeRect(W*0.06,H*0.05,W*0.88,H*0.9); WZ.txt(g,'LONDON',W/2,H*0.3,W*0.8,H*0.12,WFNT.serif,'#12406b'); WZ.txt(g,'DRY GIN',W/2,H*0.55,W*0.8,H*0.2,WFNT.serif,'#12406b'); WZ.txt(g,'0,7 l · 41 %',W/2,H*0.8,W*0.7,H*0.1,WFNT.kond,'#12406b'); }},
    {k:'tl',w:0.05,h:0.04,draw:(g,W,H)=>{ g.fillStyle='#e8c35a'; g.fillRect(0,0,W,H); WZ.txt(g,'TONIC',W/2,H/2,W*0.86,H*0.5,WFNT.kond,'#12406b'); }}],{rough:0.5,alpha:true});
  pr(c,boxU(w,h,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,py:A.uv.o,ny:A.uv.s}),tm(0,h/2,0));
  vc(c,innen(new THREE.BoxGeometry(w*0.985,h*0.99,d*0.98)),tm(0,h/2,0),0x0e2a4a);
  const gx=-w*0.2, gR=0.04, gH=h*0.9; gl(c,dreh(PROF.gin(gR,gH),12),tm(gx,0.004,-d*0.05)); vc(c,dreh(PROF.gin(gR*0.92,gH*0.72),10),tm(gx,0.006,-d*0.05),0xdcecf4);
  zyl(c,gx,gH*0.96,-d*0.05,gR*0.36,gR*0.36,gH*0.06,0x12406b,10); pr(c,uvR(etikett(gR*1.01,0.09,PI*0.8,8),A.uv.gl),tm(gx,gH*0.4,-d*0.05));
  for(let i=0;i<4;i++){ const x=w*0.08+(i%2)*w*0.2, z=(i<2?d*0.2:-d*0.18), tR=0.024, tH=h*0.5; gl(c,dreh(PROF.bier(tR,tH),8),tm(x,0.004,z)); vc(c,dreh(PROF.bier(tR*0.9,tH*0.7),8),tm(x,0.006,z),0xeef4e0);
    zyl(c,x,tH*0.98,z,tR*0.42,tR*0.42,tH*0.03,0xe8c35a,8); pr(c,uvR(etikett(tR*1.01,0.04,PI*0.9,8),A.uv.tl),tm(x,tH*0.36,z)); }
  fo(c,new THREE.PlaneGeometry(w*0.88,h*(fy1-fy0)),tm(0,h*(1-(fy0+fy1)/2),d/2-0.0015));
  return fertig(c,A); };

/* Cocktail-Set: Klarsichtschachtel auf bedrucktem Sockel, hinten die
   Rueckwandkarte im Neonlook; Shaker, zwei Flaschen, zwei Glaeser */
VP_FORM.cocktailset=t=>{ const c=C(t), a=c.a, {w,h,d}=c, sh=h*0.17;
  const A=mkAtlas([{k:'v',w,h:sh,draw:fVorn(c)},{k:'s',w:d,h:sh,q:0.6,draw:fFarbe(a.bg2)},
    {k:'k',w:w*0.98,h:h-sh,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); const r=zufallAus(9); g.fillStyle='rgba(255,255,255,.7)'; for(let i=0;i<60;i++) g.fillRect(r()*W,r()*H*0.6,1.5,1.5);
      g.save(); g.shadowColor=a.ac; g.shadowBlur=W*0.04; WZ.txt(g,a.title,W/2,H*0.12,W*0.9,H*0.12,WFNT.rund,a.ac); g.restore(); WZ.txt(g,a.sub,W/2,H*0.22,W*0.7,H*0.06,WFNT.kond,a.ac2);
      g.strokeStyle=a.ac2; g.lineWidth=W*0.006; for(let i=0;i<3;i++){ g.beginPath(); g.arc(W/2,H*1.05,W*(0.3+i*0.12),PI*1.15,PI*1.85); g.stroke(); } }}],{rough:0.5});
  pr(c,boxU(w,sh,d,{pz:A.uv.v,nz:A.uv.s,px:A.uv.s,nx:A.uv.s,py:A.uv.s,ny:A.uv.s}),tm(0,sh/2,0));
  pr(c,uvR(new THREE.PlaneGeometry(w*0.98,h-sh),A.uv.k),tm(0,sh+(h-sh)/2,-d*0.47));
  const y=sh;
  vc(c,dreh([[0,0],[0.03,0],[0.032,0.11],[0.026,0.13],[0.018,0.15],[0.012,0.17],[0,0.175]],14),tm(-w*0.3,y,-d*0.12),0x8e959e);
  vc(c,dreh(PROF.likoer?PROF.likoer(0.03,0.2):PROF.gin(0.03,0.2),10),tm(-w*0.08,y,-d*0.2),0x6a1a8a);
  vc(c,dreh(PROF.sekt(0.028,0.21),10),tm(w*0.12,y,-d*0.24),0x1d6fd8);
  for(const [x,col] of [[w*0.02,0xff4fd8],[w*0.3,0x5ce1ff]]){ gl(c,dreh([[0.026,0],[0.028,0.003],[0.004,0.008],[0.004,0.07],[0.04,0.11],[0.042,0.112]],12),tm(x,y,d*0.18)); vc(c,new THREE.ConeGeometry(0.034,0.034,12),tm(x,y+0.093,d*0.18,PI,0,0),col); }
  fo(c,new THREE.BoxGeometry(w*0.995,h-sh,d*0.995),tm(0,sh+(h-sh)/2,0));
  return fertig(c,A); };

/* Party-Kurze: Displaykarton mit Ausreissfront - die Rueckwand zeigt das
   Druckbild, davor zwanzig Feigen-Minis in Reih und Glied */
VP_FORM.kurze=t=>{ const c=C(t), a=c.a, {w,h,d}=c, fh=h*0.3, lt=0.003;
  const A=mkAtlas([{k:'r',w,h,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); drawFront(g,W,H*0.5,a,0); g.fillStyle=a.ac; for(let i=0;i<8;i++) WZ.stern(g,W*(0.06+i*0.125),H*0.62,H*0.03,a.ac,5); }},{k:'h',w,h,draw:rueck(c)},
    {k:'v',w,h:fh,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); WZ.txt(g,a.sub,W/2,H*0.55,W*0.9,H*0.5,WFNT.kond,a.ac); g.fillStyle='#f2ecd8'; for(let x=0;x<W;x+=W*0.02) g.fillRect(x,0,W*0.01,H*0.06); }},
    {k:'s',w:d,h,q:0.5,draw:(g,W,H)=>{ g.fillStyle=a.bg2; g.fillRect(0,0,W,H); stanz(g,g2=>{ g2.moveTo(0,0); g2.lineTo(W*0.92,0); g2.lineTo(0,H*0.7); g2.closePath(); }); g.fillStyle=a.ac; }}],{rough:0.6,alpha:true,double:true});
  pr(c,boxU(w,h,lt,{pz:A.uv.r,nz:A.uv.h,alle:A.uv.s}),tm(0,h/2,-d/2+lt/2));
  pr(c,boxU(w,fh,lt,{pz:A.uv.v,nz:A.uv.s,alle:A.uv.s}),tm(0,fh/2,d/2-lt/2));
  for(const s of [-1,1]) pr(c,uvR(new THREE.PlaneGeometry(d,h),A.uv.s),tm(s*(w/2-0.0008),h/2,0,0,s*PI/2,0));
  vc(c,new THREE.PlaneGeometry(w,d),tm(0,0.002,0,-PI/2,0,0),0x3a0a2a);
  const pf=PROF.mini(0.0155,h*0.6);
  for(let ix=0;ix<5;ix++) for(let iz=0;iz<4;iz++){ const x=(ix-2)*w*0.19, z=-d*0.32+iz*d*0.2;
    vc(c,dreh(pf,6),tm(x,0.002,z),0x5a1a3a); zyl(c,x,0.002+h*0.6*0.9,z,0.0068,0.0068,h*0.08,0xd9b45a,6); vc(c,etikett(0.0157,h*0.14,T2,6),tm(x,h*0.19,z),0xf2e6c4); }
  return fertig(c,A); };

/* Feuerzangenbowle: bedruckter Sockelkarton mit Klarsichthaube - darin
   Zuckerhut, Rumflasche und die Feuerzange */
VP_FORM.bowle=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.46;
  const A=mkAtlas([{k:'v',w,h:bh,draw:fVorn(c)},{k:'s',w:d,h:bh,draw:fSeite(c)},{k:'h',w,h:bh,draw:rueck(c)},
    {k:'re',w:0.05,h:0.035,draw:(g,W,H)=>{ g.fillStyle='#f2e6c4'; g.fillRect(0,0,W,H); WZ.txt(g,'RUM',W/2,H*0.4,W*0.8,H*0.4,WFNT.serif,'#6b2410'); WZ.txt(g,'54 %',W/2,H*0.75,W*0.6,H*0.2,WFNT.kond,'#6b2410'); }}],{rough:0.55});
  pr(c,boxU(w,bh,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,py:A.uv.h,ny:A.uv.s}),tm(0,bh/2,0));
  vc(c,new THREE.PlaneGeometry(w*0.96,d*0.96),tm(0,bh+0.001,0,-PI/2,0,0),0x5a1208);
  /* Zuckerhut halb im blauen Papier */
  vc(c,new THREE.CylinderGeometry(0.012,0.026,0.04,14),tm(-w*0.24,bh+0.04+0.02,-d*0.05),0xfbf8f0); vc(c,new THREE.CylinderGeometry(0.0262,0.034,0.04,14),tm(-w*0.24,bh+0.02,-d*0.05),0x1d4aa8);
  vc(c,new THREE.ConeGeometry(0.012,0.018,12),tm(-w*0.24,bh+0.089,-d*0.05),0xfbf8f0);
  /* Rumflasche (flach) */
  vc(c,dreh([[0,0],[0.026,0],[0.028,0.004],[0.028,0.055],[0.012,0.068],[0.009,0.08],[0,0.08]],12),tm(w*0.18,bh+0.001,-d*0.12,0,0,0,1,1,0.55),0x6b2410);
  zyl(c,w*0.18,bh+0.085,-d*0.12,0.009,0.009,0.01,0xd9b45a,10); pr(c,uvR(new THREE.PlaneGeometry(0.04,0.03),A.uv.re),tm(w*0.18,bh+0.03,-d*0.12+0.0158));
  /* Feuerzange */
  for(const s of [-1,1]){ kiste(c,-w*0.04+s*0.006,bh+0.004,d*0.24,0.13,0.003,0.004,0xb8bcc4,0,s*0.05,0); }
  kiste(c,-w*0.04-0.07,bh+0.004,d*0.24,0.026,0.003,0.022,0xb8bcc4); zyl(c,-w*0.04+0.08,bh+0.006,d*0.24,0.006,0.006,0.032,0x5a3a1a,8,0,0,PI/2);
  for(let i=0;i<3;i++) zyl(c,w*0.05+i*0.01,bh+0.004,d*0.02,0.0035,0.0035,0.06,0x8a4a1a,6,PI/2,0.6,0);
  fo(c,loft([{y:bh,hw:w*0.4995,hd:d*0.4995,r:0.01},{y:h*0.97,hw:w*0.495,hd:d*0.495,r:0.014},{y:h,hw:w*0.48,hd:d*0.48,r:0.02}],3)); fo(c,kappe({hw:w*0.48,hd:d*0.48,r:0.02},h,true,3));
  return fertig(c,A); };

/* =================== Fondue, Raclette, Konserven =================== */

/* Raclette-Paket: Tragekarton mit aufgestelltem Griff (Griffloch), rundum
   bedruckt */
VP_FORM.racletteessen=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.74, gw=w*0.46, gh=h-bh;
  const A=mkAtlas([{k:'v',w,h:bh,draw:fVorn(c)},{k:'s',w:d,h:bh,draw:fSeite(c)},{k:'h',w,h:bh,draw:rueck(c)},{k:'o',w,h:d,q:0.6,draw:fOben(c)},
    {k:'g',w:gw,h:gh+0.012,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); WZ.txt(g,'FRISCHETHEKE',W/2,H*0.8,W*0.7,H*0.16,WFNT.kond,'#fff'); const lw=W*0.55, lh=H*0.3; stanz(g,g2=>WZ.rr(g2,W/2-lw/2,H*0.2,lw,lh,lh/2)); }}],{rough:0.6,alpha:true,double:true});
  pr(c,boxU(w,bh,d,{pz:A.uv.v,nz:A.uv.h,px:A.uv.s,nx:A.uv.s,py:A.uv.o,ny:A.uv.s}),tm(0,bh/2,0));
  pr(c,uvR(new THREE.PlaneGeometry(gw,gh+0.012),A.uv.g),tm(0,bh+(gh+0.012)/2-0.012,0.0012)); pr(c,uvR(new THREE.PlaneGeometry(gw,gh+0.012),A.uv.g),tm(0,bh+(gh+0.012)/2-0.012,-0.0012,0,PI,0));
  /* Faltkanten der Griffklappen auf dem Deckel */
  for(const s of [-1,1]) kiste(c,0,bh+0.0008,s*d*0.25,gw*1.1,0.0015,d*0.5,parseInt(a.bg2.slice(1),16),0,0,0);
  return fertig(c,A); };

/* Fondue-Platte: offener Kartonschuber mit Deckelfenster, darin die
   schwarze Platte mit Fleisch und drei Sossenschaelchen */
VP_FORM.fondueessen=t=>{ const c=C(t), a=c.a, {w,h,d}=c, fx=0.62, fz=0.56;
  const A=mkAtlas([{k:'v',w,h,draw:fVorn(c)},{k:'h',w,h,draw:rueck(c)},{k:'u',w,h:d,q:0.3,draw:fFarbe(a.bg2)},
    {k:'o',w,h:d,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2,true); const fw=W*fx, fh=H*fz, x0=W*0.3-fw/2+W*0.15, y0=H/2-fh/2;
      WZ.txt(g,a.title,W*0.12,H*0.5,W*0.2,H*0.12,WFNT.kond,a.ac); g.strokeStyle=a.ac2; g.lineWidth=W*0.006; WZ.rr(g,x0,y0,fw,fh,H*0.06); g.stroke(); stanz(g,g2=>WZ.rr(g2,x0,y0,fw,fh,H*0.06)); }}],{rough:0.55,alpha:true,double:true});
  pr(c,boxOhne(w,h*0.998,d,{pz:A.uv.v,nz:A.uv.h,py:A.uv.o,ny:A.uv.u},['px','nx']),tm(0,h*0.499,0));
  vc(c,innen(boxOhne(w*0.999,h*0.99,d*0.985,{},['px','nx','py'])),tm(0,h*0.495,0),0xe8e2d6);
  const th=h*0.35, B={hw:w*0.47,hd:d*0.45,r:0.015}, T={hw:w*0.485,hd:d*0.47,r:0.018};
  vc(c,loft([Object.assign({y:0.002},B),Object.assign({y:th},T)],3),tm(0,0,0),0x141418); vc(c,kappe(T,th*0.3,true,3),tm(0,0,0),0x1d1d22);
  const rot=[0x9a2420,0xb03a30,0x8a2a2a,0xc8605a], y=th*0.3;
  for(let i=0;i<34;i++){ const x=-w*0.12+(i%9)*w*0.07+(c.rnd()-0.5)*0.01, z=-d*0.3+Math.floor(i/9)*d*0.17; kiste(c,x,y+0.012,z,0.026,0.018,0.024,rot[i%4],c.rnd()*0.3,c.rnd()*3,0); }
  for(let i=0;i<3;i++){ const z=(i-1)*d*0.28, x=-w*0.33; zyl(c,x,y+0.012,z,0.03,0.026,0.024,0xf4f4f0,16); zyl(c,x,y+0.022,z,0.027,0.027,0.002,[0xe88a8a,0xf0d040,0xf2ece0][i],16); }
  fo(c,loft([Object.assign({y:th},T),{y:h*0.9,hw:T.hw*0.98,hd:T.hd*0.95,r:0.03}],3)); fo(c,kappe({hw:T.hw*0.98,hd:T.hd*0.95,r:0.03},h*0.9,true,3));
  return fertig(c,A); };

/* Raclettekaese: Klarsichtschale mit gefaechertem Scheibenstapel,
   bedruckte Deckelfolie mit hochgezogener Aufreissecke, vorn das Etikett */
VP_FORM.raclettekaese=t=>{ const c=C(t), a=c.a, {w,h,d}=c, th=h*0.86;
  const A=mkAtlas([{k:'o',w,h:d,draw:(g,W,H)=>{ g.fillStyle='#fff8dc'; g.fillRect(0,0,W,H); g.save(); WZ.rr(g,W*0.42,H*0.12,W*0.52,H*0.76,H*0.06); g.clip(); g.clearRect(0,0,W,H); g.restore();
      g.fillStyle=a.bg1; g.fillRect(0,0,W*0.4,H); WZ.txt(g,a.title,W*0.2,H*0.3,W*0.36,H*0.1,WFNT.rund,a.ac); WZ.txt(g,a.sub,W*0.2,H*0.45,W*0.34,H*0.07,WFNT.kond,'#1b1b1b');
      siegel(g,W*0.2,H*0.72,H*0.13,'1kg',a.ac2,'#fff'); }},
    {k:'e',w:w*0.7,h:th*0.7,draw:fEtikett(c,'#1d6fb8',true)},{k:'ec',w:0.06,h:0.05,q:0.6,draw:(g,W,H)=>{ g.fillStyle='#fff8dc'; g.fillRect(0,0,W,H); WZ.txt(g,'↗ ÖFFNEN',W/2,H/2,W*0.9,H*0.3,WFNT.kond,'#c8322a'); }}],{rough:0.4,alpha:true,double:true});
  const B={hw:w*0.47,hd:d*0.46,r:0.012}, T={hw:w*0.497,hd:d*0.495,r:0.014};
  fo(c,loft([Object.assign({y:0},B),Object.assign({y:th},T)],3)); fo(c,kappe(B,0.001,false,3));
  pr(c,uvR(kappe(T,th+0.0008,true,3),A.uv.o));
  for(let i=0;i<9;i++){ const yy=0.004+i*0.0068, dx=-w*0.04+i*0.008;
    kiste(c,dx,yy,0,w*0.62,0.006,d*0.8,i%2?0xf2c84a:0xeebd3a,0,0.02*(i%3-1),0); kiste(c,dx+w*0.31,yy,0,0.006,0.0062,d*0.8,0xc8862a,0,0.02*(i%3-1),0); }
  pr(c,uvR(quad([w*0.34,th+0.001,d*0.43],[w*0.47,th+0.001,d*0.43],[w*0.47,h*0.995,d*0.38],[w*0.34,h*0.995,d*0.38]),A.uv.ec));
  pr(c,uvR(quad([-w*0.35,th*0.08,T.hd*0.99+0.0012],[w*0.35,th*0.08,T.hd*0.99+0.0012],[w*0.35,th*0.92,T.hd+0.0012],[-w*0.35,th*0.92,T.hd+0.0012]),A.uv.e));
  return fertig(c,A); };

/* Fondue-Sossen: fuenf Glaeschen mit bunten Deckeln im offenen
   Kartontraeger, die Rueckwand traegt Marke und Sorten */
VP_FORM.fonduesossen=t=>{ const c=C(t), a=c.a, {w,h,d}=c, fh=h*0.4, lt=0.003;
  const sorten=[['Cocktail',0xe88a8a,0xc8322a],['Curry',0xe8b02a,0x1b5a2a],['Knoblauch',0xf2ece0,0x6a6a72],['Kräuter',0x8ab04a,0xd9b45a],['BBQ',0x7a2a10,0x1b1b1b]];
  const A=mkAtlas([{k:'v',w,h:fh,draw:fVorn(c)},{k:'r',w,h,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); WZ.txt(g,a.title,W/2,H*0.14,W*0.9,H*0.16,WFNT.serif,a.ac); WZ.txt(g,sorten.map(q=>q[0]).join(' · '),W/2,H*0.3,W*0.9,H*0.07,WFNT.kond,a.ac2); }},
    {k:'h',w,h,draw:rueck(c)},{k:'s',w:d,h:fh,q:0.5,draw:fFarbe(a.bg2)}],{rough:0.6});
  pr(c,boxU(w,h,lt,{pz:A.uv.r,nz:A.uv.h,alle:A.uv.s}),tm(0,h/2,-d/2+lt/2)); pr(c,boxU(w,fh,lt,{pz:A.uv.v,nz:A.uv.s,alle:A.uv.s}),tm(0,fh/2,d/2-lt/2));
  for(const sx of [-1,1]) pr(c,boxU(lt,fh,d,{alle:A.uv.s}),tm(sx*(w/2-lt/2),fh/2,0));
  vc(c,new THREE.PlaneGeometry(w,d),tm(0,0.002,0,-PI/2,0,0),0x3a0606);
  const jr=Math.min(w*0.12,d*0.2), jh=h*0.62, pos=[[-w*0.3,-d*0.2],[0,-d*0.2],[w*0.3,-d*0.2],[-w*0.15,d*0.18],[w*0.15,d*0.18]];
  pos.forEach(([x,z],i)=>{ const [n,f,l]=sorten[i];
    gl(c,dreh([[0,0],[jr*0.9,0],[jr,0.006],[jr,jh*0.82],[jr*0.86,jh*0.9],[jr*0.86,jh*0.93]],10),tm(x,0.002,z));
    vc(c,dreh([[0,0.004],[jr*0.9,0.004],[jr*0.92,jh*0.78],[0,jh*0.78]],8),tm(x,0.002,z),f);
    zyl(c,x,0.002+jh*0.96,z,jr*0.9,jr*0.9,jh*0.1,l,12); vc(c,etikett(jr*1.01,jh*0.25,PI*0.9,8),tm(x,jh*0.45,z),0xf6f1e4); });
  return fertig(c,A); };

/* Kaesefondue: ovale Spanschachtel aus Holz mit Stuelpdeckel, vorn das
   Papieretikett, oben der runde Deckelaufkleber */
VP_FORM.kaesefondue=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.74, yl=h*0.66, E={hw:w*0.485,hd:d*0.485,ell:true}, D={hw:w*0.4995,hd:d*0.4995,ell:true};
  const per=PI*(3*(E.hw+E.hd)-Math.sqrt((3*E.hw+E.hd)*(E.hw+3*E.hd)));
  const span=(g,W,H)=>{ holz(g,W,H,'#e2c48e',false); g.fillStyle='rgba(120,80,40,.2)'; g.fillRect(W*0.02,0,W*0.01,H); };
  const A=mkAtlas([{k:'m',w:per,h:yl,draw:fRund(c,0.34,span,{rueck:false})},{k:'l',w:per,h:h-yl,q:0.5,draw:(g,W,H)=>{ span(g,W,H); g.fillStyle='#c8322a'; g.fillRect(0,H*0.3,W,H*0.4); for(let x=W*0.01;x<W;x+=W*0.05){ g.fillStyle='#fff'; g.fillRect(x,H*0.42,H*0.16,H*0.16); } }},
    {k:'o',w:2*D.hw,h:2*D.hd,draw:(g,W,H)=>{ span(g,W,H); g.save(); g.beginPath(); g.ellipse(W/2,H/2,W*0.36,H*0.36,0,0,T2); g.clip(); g.fillStyle='#c8322a'; g.fillRect(0,0,W,H); g.fillStyle='#fff'; g.fillRect(W*0.47,H*0.28,W*0.06,H*0.44); g.fillRect(W*0.39,H*0.43,W*0.22,H*0.14); g.restore();
      WZ.txt(g,a.title,W/2,H*0.86,W*0.6,H*0.08,WFNT.serif,'#5a3a1a'); }}],{rough:0.75});
  pr(c,uvR(loft([Object.assign({y:0},E),Object.assign({y:yl},E)],6),A.uv.m)); vc(c,kappe(E,0.001,false,6),tm(0,0,0),0xb8945a);
  pr(c,uvR(loft([Object.assign({y:yl-0.002},D),Object.assign({y:h-0.002},D)],6),A.uv.l)); vc(c,loft([Object.assign({y:h-0.002},D),{y:h,hw:D.hw-0.002,hd:D.hd-0.002,ell:true}],6),tm(0,0,0),0xd2b07a);
  pr(c,uvR(kappe({hw:D.hw-0.002,hd:D.hd-0.002,ell:true},h,true,6),A.uv.o));
  for(let i=0;i<3;i++) kugel(c,-w*0.05+i*0.02,yl*0.5,-E.hd-0.0005,0.002,0.002,0.001,0x3a2a1a,4,3);
  return fertig(c,A); };

/* Schokofondue: Kartontraeger mit hoher Rueckwand, darin das braune
   Keramik-Caquelon mit Schokolade und vier Obstspiesse, alles in Folie */
VP_FORM.schokofondue=t=>{ const c=C(t), a=c.a, {w,h,d}=c, fh=h*0.38, lt=0.003;
  const A=mkAtlas([{k:'v',w,h:fh,draw:fVorn(c)},{k:'r',w,h,q:0.7,draw:(g,W,H)=>{ verlauf(g,W,H,a.bg1,a.bg2); WZ.txt(g,a.title,W/2,H*0.14,W*0.86,H*0.15,WFNT.schreib,a.ac); for(let i=0;i<8;i++) WZ.herz(g,W*(0.08+i*0.12),H*0.3,H*0.035,a.ac2); }},
    {k:'h',w,h,draw:rueck(c)},{k:'s',w:d,h:fh,q:0.5,draw:fFarbe(a.bg2)}],{rough:0.6});
  pr(c,boxU(w,h*0.97,lt,{pz:A.uv.r,nz:A.uv.h,alle:A.uv.s}),tm(0,h*0.485,-d/2+lt/2+0.001)); pr(c,boxU(w*0.99,fh,lt,{pz:A.uv.v,nz:A.uv.s,alle:A.uv.s}),tm(0,fh/2,d/2-lt/2-0.001));
  for(const sx of [-1,1]) pr(c,boxU(lt,fh,d*0.98,{alle:A.uv.s}),tm(sx*(w/2-lt/2-0.001),fh/2,0));
  vc(c,new THREE.PlaneGeometry(w*0.98,d*0.98),tm(0,0.002,0,-PI/2,0,0),0x2a1408);
  /* Caquelon mit Griff */
  const px=-w*0.22, pR=Math.min(w*0.2,d*0.3);
  vc(c,dreh([[0,0.003],[pR*0.8,0.003],[pR,pR*0.4],[pR*0.96,pR*0.9],[pR*1.02,pR*0.95],[pR*0.9,pR*0.95],[0,pR*0.8]],18),tm(px,0,0),0x6a3216);
  zyl(c,px,pR*0.82,0,pR*0.9,pR*0.9,0.002,0x3a1a08,18); zyl(c,px+pR*1.3,pR*0.7,0,0.008,0.01,pR*0.8,0x5a2a12,8,0,0,PI/2+0.3);
  /* Obstspiesse: Erdbeere, Banane, Traube, Ananas */
  for(let k=0;k<4;k++){ const z=-d*0.3+k*d*0.2, x0=-w*0.02, y=0.012+k*0.003;
    zyl(c,x0+0.06,y,z,0.0015,0.0015,0.13,0xe2c890,4,0,0,PI/2);
    vc(c,new THREE.ConeGeometry(0.011,0.024,8),tm(x0,y,z,0,0,PI/2),0xd8202a); zyl(c,x0+0.03,y,z,0.011,0.011,0.008,0xf6eaa8,10,0,0,PI/2);
    kugel(c,x0+0.055,y,z,0.009,0.009,0.009,0x8ac03a,6,4); kiste(c,x0+0.08,y,z,0.016,0.016,0.016,0xf2c428,0.4,0,0.4); kugel(c,x0+0.105,y,z,0.009,0.009,0.009,0x7a2a6a,6,4); }
  fo(c,loft([{y:0,hw:w*0.4995,hd:d*0.4995,r:0.01},{y:h*0.97,hw:w*0.4995,hd:d*0.4995,r:0.01},{y:h*0.998,hw:w*0.48,hd:d*0.47,r:0.02}],3)); fo(c,kappe({hw:w*0.48,hd:d*0.47,r:0.02},h*0.998,true,3));
  return fertig(c,A); };

/* Fondue Chinoise Luxus: schwarze Geschenkbox mit Stuelpdeckel, goldenes
   Satinband ueber Kreuz und Schleife */
VP_FORM.luxusfondue=t=>{ const c=C(t), a=c.a, {w,h,d}=c, top=h-0.016, lh=h*0.24, gold=0xd9b040;
  const schwarz=(g,W,H)=>{ g.fillStyle='#0d0b0a'; g.fillRect(0,0,W,H); g.strokeStyle='#d9b45a'; g.lineWidth=Math.max(1,H*0.04); g.strokeRect(H*0.08,H*0.12,W-H*0.16,H*0.76); };
  const A=mkAtlas([{k:'v',w,h:top-lh,draw:(g,W,H)=>{ g.fillStyle='#0d0b0a'; g.fillRect(0,0,W,H); g.save(); g.translate(W*0.03,H*0.08); drawFront(g,W*0.94,H*0.84,a,0); g.restore(); g.strokeStyle='#d9b45a'; g.lineWidth=H*0.03; g.strokeRect(W*0.02,H*0.05,W*0.96,H*0.9); }},
    {k:'s',w:d,h:top,q:0.4,draw:schwarz},{k:'l',w,h:lh,q:0.7,draw:(g,W,H)=>{ schwarz(g,W,H); WZ.txt(g,'FONDUE CHINOISE · LUXUS',W*0.62,H/2,W*0.6,H*0.5,WFNT.serif,'#e8c35a'); }},
    {k:'o',w,h:d,q:0.6,draw:(g,W,H)=>{ schwarz(g,W,H); siegel(g,W*0.62,H*0.5,H*0.22,'♛','#d9b45a','#0d0b0a'); }}],{rough:0.4,metal:0.15});
  pr(c,boxU(w*0.985,top-lh,d*0.985,{pz:A.uv.v,nz:A.uv.s,px:A.uv.s,nx:A.uv.s,ny:A.uv.s,py:A.uv.s}),tm(0,(top-lh)/2,0));
  pr(c,boxU(w,lh,d,{pz:A.uv.l,nz:A.uv.l,px:A.uv.s,nx:A.uv.s,py:A.uv.o,ny:A.uv.s}),tm(0,top-lh/2,0));
  const bx=-w*0.3;
  kiste(c,bx,top/2,d/2+0.0008,0.022,top,0.0016,gold); kiste(c,bx,top/2,-d/2-0.0008,0.022,top,0.0016,gold); kiste(c,bx,top+0.0008,0,0.022,0.0016,d,gold);
  kiste(c,0,top-lh/2,0,w+0.0016,lh*0.5,0.022,gold,0,0,0); c.vc.pop(); kiste(c,0,top+0.0008,0,w,0.0016,0.022,gold);
  for(const s of [-1,1]) vc(c,new THREE.TorusGeometry(0.026,0.006,5,14),tm(bx+s*0.024,top+0.007,0,PI/2,0,s*0.5,1,0.45,1),0xe8c048);
  kugel(c,bx,top+0.008,0,0.011,0.007,0.011,0xc89a2a,6,4);
  for(const s of [-1,1]) kiste(c,bx+s*0.01,top+0.002,0.035,0.014,0.002,0.06,gold,0,s*0.35,0);
  return fertig(c,A); };

/* Fondue-Bruehe: kleiner Kunststoffkanister mit Griff und Schraubkappe,
   am Hals haengt das Kaertchen "inkl. Brennpaste" */
VP_FORM.fondueoel=t=>{ const c=C(t), a=c.a, {w,h,d}=c, bh=h*0.72, sh=h*0.8, B={hw:w*0.495,hd:d*0.49,r:0.014}, S={hw:w*0.44,hd:d*0.42,r:0.02}, nx=-w*0.18, nz=d*0.12;
  const A=mkAtlas([{k:'v',w:w*0.86,h:bh*0.86,draw:fEtikett(c,'#f4efe0')},{k:'k',w:0.05,h:0.06,draw:(g,W,H)=>{ g.fillStyle='#c8322a'; g.fillRect(0,0,W,H); g.fillStyle='#fff'; g.beginPath(); g.arc(W/2,H*0.12,W*0.08,0,T2); g.fill();
      g.fillStyle='#ffb03a'; g.beginPath(); g.moveTo(W/2,H*0.28); g.quadraticCurveTo(W*0.7,H*0.45,W/2,H*0.6); g.quadraticCurveTo(W*0.3,H*0.45,W/2,H*0.28); g.fill(); WZ.txt(g,'inkl. Brennpaste',W/2,H*0.78,W*0.9,H*0.14,WFNT.kond,'#fff'); }}],{rough:0.45});
  vc(c,loft([Object.assign({y:0.004},{hw:B.hw*0.97,hd:B.hd*0.96,r:B.r}),Object.assign({y:0.012},B),Object.assign({y:bh},B),Object.assign({y:sh},S)],4),tm(0,0,0),0xd89a3a);
  vc(c,kappe(S,sh,true,4),tm(0,0,0),0xd09030); vc(c,kappe({hw:B.hw*0.97,hd:B.hd*0.96,r:B.r},0.004,false,4),tm(0,0,0),0xb87a20);
  zyl(c,nx,sh+0.012,nz,0.015,0.016,0.024,0xd89a3a,14); zyl(c,nx,sh+0.032,nz,0.019,0.019,0.022,0xc8322a,16);
  for(let i=0;i<10;i++){ const an=i/10*T2; kiste(c,nx+Math.sin(an)*0.019,sh+0.032,nz+Math.cos(an)*0.019,0.002,0.02,0.002,0xa8221a,0,an,0); }
  /* Griff hinten rechts */
  const gx=w*0.18, gz=-d*0.12; for(const x of [gx-0.032,gx+0.032]) kiste(c,x,(sh+h*0.97)/2,gz,0.012,h*0.97-sh,0.018,0xd89a3a); kiste(c,gx,h*0.97-0.005,gz,0.076,0.012,0.018,0xd89a3a);
  pr(c,uvR(new THREE.PlaneGeometry(w*0.86,bh*0.86),A.uv.v),tm(0,bh*0.5,B.hd+0.0008));
  pr(c,uvR(new THREE.PlaneGeometry(0.05,0.06),A.uv.k),tm(nx,sh-0.022,nz+0.021,-0.25,0,0.1));
  return fertig(c,A); };

/* Gulaschsuppe: Konservendose mit Papieretikett, Sicken und Ringpull-
   Deckel */
VP_FORM.gulaschsuppe=t=>{ const c=C(t), a=c.a, {w,h,d}=c, R=Math.min(w,d)/2*0.985, y0=h*0.07, y1=h*0.93;
  const A=mkAtlas([{k:'m',w:T2*R,h:y1-y0,draw:fRund(c,0.36),max:900}],{rough:0.5});
  pr(c,uvR(new THREE.CylinderGeometry(R*1.002,R*1.002,y1-y0,26,1,true,-PI,T2),A.uv.m),tm(0,(y0+y1)/2,0));
  vc(c,dreh([[R*0.9,0],[R*0.98,0.002],[R,0.008],[R*0.985,h*0.03],[R,h*0.05],[R,y0+0.002],[R,y1-0.002],[R,h*0.95],[R*0.985,h*0.97],[R,h*0.99],[R*0.95,h]],26),tm(0,0,0),0xb8bec6);
  vc(c,new THREE.CircleGeometry(R*0.95,24),tm(0,h-0.002,0,-PI/2,0,0),0xc8ccd2); ring(c,0,h-0.002,0,R*0.82,0.0018,0xa8aeb6,PI/2,0,0,24); ring(c,0,h-0.002,0,R*0.6,0.0014,0xa8aeb6,PI/2,0,0,24);
  ring(c,0,h-0.0015,R*0.35,R*0.25,0.003,0xd0d4da,PI/2,0,0,16); kiste(c,0,h-0.0015,R*0.08,0.016,0.002,0.03,0xd0d4da); kugel(c,0,h-0.001,0,0.005,0.002,0.005,0xb0b4ba,6,3);
  vc(c,new THREE.CircleGeometry(R*0.9,20),tm(0,0.0015,0,PI/2,0,0),0x9aa0a8);
  return fertig(c,A); };

/* Katerfruehstueck: Schraubglas, darin Rollmops, Gewuerzgurken und
   Zwiebelringe; vorn das Etikett, oben der bedruckte Twist-off-Deckel */
VP_FORM.rollmops=t=>{ const c=C(t), a=c.a, {w,h,d}=c, R=Math.min(w,d)/2*0.985, gh=h*0.84;
  const A=mkAtlas([{k:'e',w:R*2.2,h:gh*0.44,draw:fVorn(c)},{k:'o',w:2*R,h:2*R,q:0.7,draw:(g,W,H)=>{ g.fillStyle='#1b5a2a'; g.fillRect(0,0,W,H); const q=W/10; for(let i=0;i<10;i++) for(let j=0;j<10;j++) if((i+j)%2){ g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(i*q,j*q,q,q); }
      g.fillStyle='#f2ecd8'; g.beginPath(); g.arc(W/2,H/2,W*0.3,0,T2); g.fill(); WZ.txt(g,'KATER',W/2,H*0.45,W*0.5,H*0.12,WFNT.rund,'#1b5a2a'); WZ.txt(g,'FRÜHSTÜCK',W/2,H*0.57,W*0.5,H*0.08,WFNT.kond,'#1b5a2a'); }}],{rough:0.4,metal:0.2});
  gl(c,dreh([[0,0],[R*0.92,0],[R,0.01],[R,gh*0.9],[R*0.9,gh*0.96],[R*0.86,gh]],18));
  /* Inhalt: Rollmops mit Holzspiess, Gewuerzgurken, Zwiebelringe, Pfefferkoerner */
  for(let i=0;i<4;i++){ const yy=gh*(0.14+i*0.2), an=i*1.9, x=Math.sin(an)*R*0.25, z=Math.cos(an)*R*0.25, ry=an+PI/2;
    zyl(c,x,yy,z,R*0.3,R*0.3,R*1.05,0x5d6a78,10,0,ry,PI/2); for(const e of [-1,1]) vc(c,new THREE.CircleGeometry(R*0.28,10),tm(x+Math.cos(ry)*e*R*0.53,yy,z-Math.sin(ry)*e*R*0.53,0,ry+e*PI/2,0),0xf2ece2);
    zyl(c,x,yy,z,0.0016,0.0016,R*1.5,0xd8b880,4,0,ry,PI/2); }
  for(let i=0;i<4;i++){ const an=i*PI/2+0.7; kugel(c,Math.sin(an)*R*0.66,gh*0.45,Math.cos(an)*R*0.66,R*0.2,gh*0.38,R*0.2,0x3a6a22,8,6,[0.1,an,0.06]); }
  for(let i=0;i<6;i++) ring(c,(c.rnd()-0.5)*R*1.1,gh*(0.1+i*0.13),(c.rnd()-0.5)*R*1.1,R*0.22,0.003,0xf4f0e4,PI/2+(c.rnd()-0.5)*0.8,0,c.rnd(),10);
  for(let i=0;i<10;i++) ico(c,(c.rnd()-0.5)*R*1.5,0.006+c.rnd()*gh*0.8,(c.rnd()-0.5)*R*1.5,0.003,0x2a1a10);
  /* Deckel */
  vc(c,dreh([[R*0.88,gh-0.004],[R*0.9,gh-0.002],[R*0.9,h-0.006],[R*0.86,h-0.001],[R*0.8,h]],22),tm(0,0,0),0xc9a046);
  pr(c,uvR(new THREE.CircleGeometry(R*0.8,22),A.uv.o),tm(0,h,0,-PI/2,0,0));
  pr(c,uvR(etikett(R*1.006,gh*0.44,2.2,10),A.uv.e),tm(0,gh*0.42,0));
  return fertig(c,A); };

})();

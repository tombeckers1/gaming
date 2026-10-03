/* Inhaltsbilder: zubehoer (03.10.) - siehe 04e-ware.js
   Jedes Motiv zeigt den Inhalt der Packung. Alle Masse ueber S=min(w,h);
   breite Flaechen nebeneinander, hohe uebereinander. Helfer lokal (IIFE). */
(()=>{
const PI=Math.PI, TAU=PI*2;
function mz_m(x,y,w,h){ return {S:Math.min(w,h),cx:x+w/2,cy:y+h/2,q:w/h}; }
/* zwei Bereiche: nebeneinander, uebereinander oder diagonal versetzt */
function mz_zwei(x,y,w,h){ const q=w/h, S=Math.min(w,h);
  if(q>1.3){ const s=Math.min(h,w*0.5); return [{x:x+w*0.27,y:y+h/2,s},{x:x+w*0.73,y:y+h/2,s}]; }
  if(q<0.77){ const s=Math.min(w,h*0.5); return [{x:x+w/2,y:y+h*0.27,s},{x:x+w/2,y:y+h*0.73,s}]; }
  const s=S*0.64; return [{x:x+w/2-S*0.18,y:y+h/2-S*0.18,s},{x:x+w/2+S*0.18,y:y+h/2+S*0.18,s}]; }
/* drei Bereiche: Reihe, Spalte oder gross links + zwei klein rechts */
function mz_drei(x,y,w,h){ const q=w/h, S=Math.min(w,h), cx=x+w/2, cy=y+h/2;
  if(q>1.25){ const s=Math.min(h*0.96,w*0.34); return [0,1,2].map(i=>({x:x+w*(i*2+1)/6,y:cy,s})); }
  if(q<0.8){ const s=Math.min(w*0.96,h*0.34); return [0,1,2].map(i=>({x:cx,y:y+h*(i*2+1)/6,s})); }
  return [{x:cx-S*0.2,y:cy+S*0.02,s:S*0.6},{x:cx+S*0.27,y:cy-S*0.24,s:S*0.44},{x:cx+S*0.27,y:cy+S*0.25,s:S*0.44}]; }
function mz_raster(x,y,w,h,n){ let b=null; for(let c=1;c<=n;c++){ const r=Math.ceil(n/c), s=Math.min(w/c,h/r); if(!b||s>b.s) b={c,r,s}; }
  const out=[], oy=y+(h-b.r*b.s)/2; for(let i=0;i<n;i++){ const row=Math.floor(i/b.c), im=row<b.r-1?b.c:n-b.c*(b.r-1), col=i%b.c; out.push({x:x+(w-im*b.s)/2+(col+0.5)*b.s,y:oy+(row+0.5)*b.s,s:b.s}); } return out; }
function mz_nacht(g,x,y,w,h,c1,c2){ const gr=g.createRadialGradient(x+w/2,y+h*0.42,0,x+w/2,y+h/2,Math.max(w,h)*0.75); gr.addColorStop(0,c1); gr.addColorStop(1,c2); g.fillStyle=gr; g.fillRect(x,y,w,h); }
function mz_metall(g,x0,y0,x1,y1,f){ const gr=g.createLinearGradient(x0,y0,x1,y1); gr.addColorStop(0,WZ.hell(f,0.35)); gr.addColorStop(0.25,WZ.hell(f,0.7)); gr.addColorStop(0.5,f); gr.addColorStop(0.85,WZ.dunkel(f,0.4)); gr.addColorStop(1,WZ.dunkel(f,0.2)); return gr; }
function mz_flamme(g,x,y,r){ WZ.leucht(g,x,y-r*0.9,r*2.6,'#ffa030',0.55);
  const f=(k,c)=>{ g.fillStyle=c; g.beginPath(); g.moveTo(x,y-r*2.2*k); g.bezierCurveTo(x+r*0.95*k,y-r*0.9*k,x+r*0.75*k,y,x,y); g.bezierCurveTo(x-r*0.75*k,y,x-r*0.95*k,y-r*0.9*k,x,y-r*2.2*k); g.fill(); };
  f(1,'#ff6a1c'); f(0.74,'#ffc23c'); f(0.44,'#fff6d6'); }
function mz_funkel(g,x,y,r,f){ g.fillStyle=f||'#ffffff'; g.beginPath(); g.moveTo(x,y-r); g.quadraticCurveTo(x,y,x+r,y); g.quadraticCurveTo(x,y,x,y+r); g.quadraticCurveTo(x,y,x-r,y); g.quadraticCurveTo(x,y,x,y-r); g.fill(); }
function mz_neon(g,pfad,f,lw){ g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round'; g.lineJoin='round';
  [[lw*3.6,0.09],[lw*2.1,0.2],[lw,0.95]].forEach(([l,al])=>{ g.lineWidth=l; g.strokeStyle=rgba(f,al); pfad(); g.stroke(); });
  g.globalCompositeOperation='source-over'; g.lineWidth=lw*0.3; g.strokeStyle='rgba(255,255,255,.8)'; pfad(); g.stroke(); g.restore(); }
function mz_goldtxt(g,s,x,y,maxW,size,font,f){ f=f||'#ffd23f'; g.save(); g.textAlign='center'; g.textBaseline='middle'; let z=Math.max(5,Math.round(size));
  do{ g.font=font(z); if(g.measureText(s).width<=maxW) break; z--; }while(z>5);
  const gr=g.createLinearGradient(x,y-z*0.5,x,y+z*0.5); gr.addColorStop(0,WZ.hell(f,0.75)); gr.addColorStop(0.45,f); gr.addColorStop(0.55,WZ.dunkel(f,0.3)); gr.addColorStop(1,WZ.hell(f,0.35));
  g.lineJoin='round'; g.lineWidth=Math.max(1.5,z*0.13); g.strokeStyle=WZ.dunkel(f,0.6); g.strokeText(s,x,y); g.fillStyle=gr; g.fillText(s,x,y); g.restore(); return z; }
/* Schleife aus Luftschlange: Gerade mit Kringeln */
function mz_kringel(g,x0,y0,x1,y1,r,n,f,lw){ g.save(); g.lineCap='round'; g.lineJoin='round'; const N=Math.ceil(n*22);
  const pfad=o=>{ g.beginPath(); for(let i=0;i<=N;i++){ const t=i/N, th=t*n*TAU, px=x0+(x1-x0)*t+Math.cos(th)*r+o, py=y0+(y1-y0)*t+Math.sin(th)*r*0.8+o; i?g.lineTo(px,py):g.moveTo(px,py); } g.stroke(); };
  g.strokeStyle=WZ.dunkel(f,0.4); g.lineWidth=lw; pfad(lw*0.3); g.strokeStyle=f; g.lineWidth=lw*0.8; pfad(0); g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=lw*0.25; pfad(-lw*0.15); g.restore(); }
function mz_klecks(g,x,y,r,rnd,f){ const n=7, p=[]; for(let i=0;i<n;i++){ const an=i/n*TAU, rr=r*(0.55+rnd()*0.6); p.push([x+Math.cos(an)*rr,y+Math.sin(an)*rr*0.8]); }
  g.beginPath(); g.moveTo((p[n-1][0]+p[0][0])/2,(p[n-1][1]+p[0][1])/2); for(let i=0;i<n;i++){ const a=p[i], b=p[(i+1)%n]; g.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2); } g.closePath();
  const gr=g.createRadialGradient(x-r*0.3,y-r*0.3,r*0.05,x,y,r*1.1); gr.addColorStop(0,'#fff6c0'); gr.addColorStop(0.35,f); gr.addColorStop(1,WZ.dunkel(f,0.45)); g.fillStyle=gr; g.fill(); }
function mz_rot(g,x,y,an,fn){ g.save(); g.translate(x,y); g.rotate(an); fn(); g.restore(); }

/* ---------- Feuerzeuge, Streichhoelzer ---------- */
function mz_zippo(g,cx,by,hh,offen,emb){ const bw=hh*0.6, bh=hh*0.62, lh=hh*0.34, x0=cx-bw/2, top=by-bh, r=bw*0.12;
  WZ.schatten(g,cx+bw*0.25,by,bw,bw*0.16,0.45);
  if(offen){ const kw=bw*0.58, kh=lh*0.82, kx=x0+bw*0.05;
    g.fillStyle=mz_metall(g,kx,0,kx+kw,0,'#c4cad3'); g.fillRect(kx,top-kh,kw,kh);
    for(let j=0;j<2;j++) for(let i=0;i<3;i++) WZ.kreis(g,kx+kw*(0.2+i*0.3),top-kh*(0.3+j*0.38),kw*0.075,'#23262c');
    mz_rot(g,x0+bw,top,1.72,()=>{ g.fillStyle=mz_metall(g,-bw,0,0,0,'#a9b0ba'); WZ.rr(g,-bw,-lh,bw,lh,r); g.fill(); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(-bw,-lh*0.12,bw,lh*0.12); });
    mz_flamme(g,kx+kw/2,top-kh*0.9,hh*0.17); }
  g.fillStyle=mz_metall(g,x0,0,x0+bw,0,'#b8bec8'); WZ.rr(g,x0,top,bw,bh,r); g.fill();
  if(!offen){ WZ.rr(g,x0,top-lh,bw,lh+r,r); g.fill(); g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(x0,top,bw,Math.max(1,hh*0.014)); }
  const ey=top+bh*0.5; WZ.ellipse(g,cx,ey,bw*0.3,bh*0.28,WZ.dunkel(emb,0.3)); WZ.ellipse(g,cx,ey,bw*0.26,bh*0.24,emb); WZ.stern(g,cx,ey,bw*0.17,'#ffd23f');
  g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(x0+bw*0.1,top+bh*0.06,bw*0.07,bh*0.85); }
wareReg('feuerzeug',(g,x,y,w,h,rnd,a)=>{ const {cx,cy,q}=mz_m(x,y,w,h);
  if(q>1.3){ const hh=Math.min(h*0.66,w*0.42); mz_zippo(g,cx-hh*0.6,cy+hh*0.55,hh*0.88,false,a.bg1); mz_zippo(g,cx+hh*0.12,cy+hh*0.6,hh,true,a.bg1); }
  else { const hh=Math.min(h*0.66,w*0.9); mz_zippo(g,cx-hh*0.18,cy+hh*0.6,hh,true,a.bg1); } });

wareReg('stabfeuerzeug',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy}=mz_m(x,y,w,h);
  /* Anzuendlunte als Rolle unten rechts */
  const lx=x+w*0.72, ly=y+h*0.76, lr=S*0.2; g.save(); g.lineCap='round';
  const spi=o=>{ g.beginPath(); for(let i=0;i<=120;i++){ const t=i/120, an=t*TAU*3.2, rr=lr*(0.25+0.75*t); g.lineTo(lx+Math.cos(an)*rr+o,ly+Math.sin(an)*rr*0.6+o); } const ex=lx+lr, ey=ly; g.quadraticCurveTo(ex+lr*0.3,ey+lr*0.5,ex-lr*0.1,ey+lr*0.75); };
  WZ.schatten(g,lx,ly+lr*0.2,lr*1.2,lr*0.5,0.35);
  g.strokeStyle='#1d4a24'; g.lineWidth=S*0.045; spi(S*0.006); g.stroke(); g.strokeStyle='#3f9a4a'; g.lineWidth=S*0.032; spi(0); g.stroke(); g.strokeStyle='rgba(200,255,200,.5)'; g.lineWidth=S*0.01; spi(-S*0.006); g.stroke(); g.restore();
  const fx=lx+lr*0.9, fy=ly+lr*0.75; WZ.leucht(g,fx,fy,S*0.12,'#ffd23f',0.8); for(let i=0;i<7;i++){ const an=rnd()*TAU, d=S*(0.03+rnd()*0.06); mz_funkel(g,fx+Math.cos(an)*d,fy+Math.sin(an)*d,S*(0.012+rnd()*0.02),i%2?'#fff3a0':'#ffffff'); }
  /* Stabfeuerzeug diagonal */
  const an=-Math.atan2(h*0.75,w), c=Math.cos(an), s=Math.sin(an), L=Math.min(w*0.84/Math.abs(c),h*0.66/Math.abs(s)), T=Math.min(L*0.14,S*0.24);
  const bx=cx-c*L*0.5-w*0.04, by=cy-s*L*0.5+h*0.06;
  WZ.schatten(g,bx+c*L*0.25,by+T*0.9,L*0.3,T*0.3,0.3);
  mz_rot(g,bx,by,an,()=>{ g.fillStyle=mz_metall(g,0,-T*0.17,0,T*0.17,'#c9ced6'); g.fillRect(L*0.36,-T*0.15,L*0.6,T*0.3);
    g.fillStyle='#7a8089'; g.fillRect(L*0.95,-T*0.19,L*0.05,T*0.38);
    const gr=g.createLinearGradient(0,-T/2,0,T*0.6); gr.addColorStop(0,heller(a.ac,0.45)); gr.addColorStop(0.35,a.ac); gr.addColorStop(1,WZ.dunkel(a.ac,0.5)); g.fillStyle=gr;
    g.beginPath(); g.moveTo(0,-T*0.4); g.lineTo(L*0.36,-T*0.3); g.lineTo(L*0.4,-T*0.2); g.lineTo(L*0.4,T*0.2); g.lineTo(L*0.3,T*0.32); g.quadraticCurveTo(L*0.12,T*0.8,0,T*0.55); g.closePath(); g.fill();
    g.fillStyle='#1a1d24'; WZ.rr(g,L*0.22,T*0.24,L*0.06,T*0.42,T*0.08); g.fill();
    g.fillStyle='rgba(0,0,0,.3)'; WZ.rr(g,L*0.03,-T*0.12,L*0.17,T*0.42,T*0.15); g.fill();
    g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(L*0.02,-T*0.33,L*0.33,T*0.08); });
  mz_flamme(g,bx+c*L*1.02,by+s*L*1.02,T*0.5); });

wareReg('streichhoelzer',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), breit=q>1.2;
  const s=breit?Math.min(h*1.15,w*0.6):Math.min(w*0.95,h*0.7), bxc=breit?x+w*0.36:cx, byc=breit?cy+h*0.18:y+h*0.7;
  const bw=s*0.6, bh=s*0.16, ox=s*0.2, oy=s*0.24, fx=bxc-bw*0.6, fy=byc, e=bw*0.42;
  WZ.schatten(g,bxc+bw*0.1,fy+bh,bw*0.85,bh*0.9,0.4);
  /* Lade mit Hoelzern */
  const lx0=fx+bw*0.6, lx1=fx+bw+e;
  g.fillStyle='#e8d3a8'; g.beginPath(); g.moveTo(lx0,fy); g.lineTo(lx1,fy); g.lineTo(lx1+ox,fy-oy); g.lineTo(lx0+ox,fy-oy); g.fill();
  for(let k=0;k<7;k++){ const t=(k+0.6)/7.4, mx0=lx0+ox*t, my=fy-oy*t, mx1=lx1-e*0.08+ox*t;
    g.strokeStyle='#f0d9a4'; g.lineWidth=s*0.022; g.beginPath(); g.moveTo(mx0,my); g.lineTo(mx1,my); g.stroke(); WZ.ellipse(g,mx1,my,s*0.03,s*0.016,k%2?'#7a1e14':'#5a1a10'); }
  g.fillStyle='#c79e62'; g.fillRect(lx0,fy,lx1-lx0,bh*0.92); g.fillStyle='#a8814a'; g.beginPath(); g.moveTo(lx1,fy); g.lineTo(lx1+ox,fy-oy); g.lineTo(lx1+ox,fy-oy+bh*0.92); g.lineTo(lx1,fy+bh*0.92); g.fill();
  /* Huelle */
  const tg=g.createLinearGradient(fx,fy-oy,fx+bw,fy); tg.addColorStop(0,heller(a.bg1,0.25)); tg.addColorStop(1,a.bg1); g.fillStyle=tg;
  g.beginPath(); g.moveTo(fx,fy); g.lineTo(fx+bw,fy); g.lineTo(fx+bw+ox,fy-oy); g.lineTo(fx+ox,fy-oy); g.fill();
  g.fillStyle='#4a2c1c'; g.fillRect(fx,fy,bw,bh); g.fillStyle='rgba(255,255,255,.12)'; for(let i=0;i<40;i++) g.fillRect(fx+rnd()*bw,fy+rnd()*bh,1,1);
  g.save(); g.transform(bw,0,ox,-oy,fx,fy); g.fillStyle=a.ac2; g.fillRect(0.06,0.12,0.88,0.76); g.fillStyle=a.ac; g.fillRect(0.1,0.18,0.8,0.64); g.restore();
  mz_flamme(g,fx+bw*0.5+ox*0.5,fy-oy*0.3,s*0.05);
  /* brennendes Sturmholz */
  const m0x=breit?x+w*0.62:x+w*0.12, m0y=breit?y+h*0.82:y+h*0.5, m1x=breit?x+w*0.86:x+w*0.7, m1y=breit?y+h*0.42:y+h*0.32;
  g.lineCap='round'; g.strokeStyle='#e8c98a'; g.lineWidth=S*0.04; g.beginPath(); g.moveTo(m0x,m0y); g.lineTo(m1x,m1y); g.stroke();
  const kx=m0x+(m1x-m0x)*0.6, ky=m0y+(m1y-m0y)*0.6; g.strokeStyle='#4a1a10'; g.lineWidth=S*0.07; g.beginPath(); g.moveTo(kx,ky); g.lineTo(m1x,m1y); g.stroke();
  g.strokeStyle='rgba(255,140,60,.5)'; g.lineWidth=S*0.02; g.beginPath(); g.moveTo(kx,ky); g.lineTo(m1x,m1y); g.stroke();
  mz_flamme(g,m1x,m1y+S*0.02,S*0.11); });

/* ---------- Party ---------- */
function mz_troete(g,x,y,L,an,f1,f2){ mz_rot(g,x,y,an,()=>{ const r0=L*0.045, r1=L*0.2;
  g.fillStyle='#f4f1ea'; WZ.rr(g,-L*0.13,-r0*1.15,L*0.15,r0*2.3,r0); g.fill();
  const gr=g.createLinearGradient(0,-r1,0,r1); gr.addColorStop(0,heller(f1,0.5)); gr.addColorStop(0.35,f1); gr.addColorStop(1,WZ.dunkel(f1,0.5)); g.fillStyle=gr;
  g.beginPath(); g.moveTo(0,-r0); g.quadraticCurveTo(L*0.7,-r0*1.4,L,-r1); g.lineTo(L,r1); g.quadraticCurveTo(L*0.7,r0*1.4,0,r0); g.closePath(); g.fill();
  g.save(); g.clip(); g.strokeStyle=rgba(f2,0.9); g.lineWidth=L*0.04; for(let i=1;i<9;i++){ const xx=L*i/9; g.beginPath(); g.moveTo(xx-L*0.05,-r1); g.lineTo(xx+L*0.05,r1); g.stroke(); } g.restore();
  WZ.ellipse(g,L,0,r1*0.32,r1,WZ.dunkel(f1,0.55));
  g.strokeStyle=f2; g.lineWidth=Math.max(1,L*0.018); for(let i=0;i<16;i++){ const w=i/16*TAU; g.beginPath(); g.moveTo(L+Math.cos(w)*r1*0.3,Math.sin(w)*r1); g.lineTo(L+Math.cos(w)*r1*0.3+L*0.08,Math.sin(w)*r1*1.2); g.stroke(); } }); }
wareReg('luftschlangen',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), F=[a.ac,a.ac2,'#7cff6b','#ff7a3d','#b06cff','#ffffff'];
  const n=q>1.4||q<0.7?5:4;
  for(let i=0;i<n;i++){ const t=(i+0.5)/n, r=S*(0.05+rnd()*0.025);
    if(q>=1){ const xx=x+w*t; mz_kringel(g,xx+(rnd()-0.5)*w*0.1,y-S*0.05,xx+(rnd()-0.5)*w*0.2,y+h+S*0.05,r,(h+S*0.1)/(r*2.6),F[i%6],S*0.026); }
    else { const yy=y+h*t; mz_kringel(g,x-S*0.05,yy,x+w+S*0.05,yy+(rnd()-0.5)*h*0.15,r,(w+S*0.1)/(r*2.6),F[i%6],S*0.026); } }
  /* aufgerollte Luftschlangen */
  [[0.2,0.8,F[2]],[0.8,0.22,F[0]]].forEach(([u,v,f])=>{ const rx=x+w*u, ry=y+h*v, rr=S*0.12; WZ.schatten(g,rx,ry+rr*0.5,rr*1.1,rr*0.3,0.35); WZ.ellipse(g,rx,ry+rr*0.12,rr,rr*0.62,WZ.dunkel(f,0.35)); WZ.ellipse(g,rx,ry,rr,rr*0.62,f);
    g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=Math.max(0.6,S*0.004); for(let k=1;k<6;k++){ g.beginPath(); g.ellipse(rx,ry,rr*k/6,rr*0.62*k/6,0,0,TAU); g.stroke(); } WZ.ellipse(g,rx,ry,rr*0.15,rr*0.09,'#ffffff'); });
  const L=Math.min(S*1.05,Math.max(w,h)*0.72), an=q>=1?-0.38:-1.1;
  mz_troete(g,cx-Math.cos(an)*L*0.45,cy-Math.sin(an)*L*0.45,L,an,'#ffd23f','#ff4fa3'); });

wareReg('brille',(g,x,y,w,h,rnd,a)=>{ const {cx,cy}=mz_m(x,y,w,h), gw=Math.min(w*0.94,h*1.15), lr=gw*0.19, ly=cy+gw*0.15, gold='#ffc21a';
  WZ.schatten(g,cx,ly+lr*1.5,gw*0.5,gw*0.06,0.3);
  g.strokeStyle=WZ.dunkel(gold,0.3); g.lineWidth=gw*0.03; g.lineCap='round'; [-1,1].forEach(s=>{ g.beginPath(); g.moveTo(cx+s*gw*0.45,ly-lr*0.45); g.lineTo(cx+s*gw*0.5,ly-lr*0.75); g.stroke(); });
  [-1,1].forEach(s=>{ const lx=cx+s*gw*0.25; g.fillStyle=mz_metall(g,lx-lr*1.3,ly-lr*1.3,lx+lr*1.3,ly+lr*1.3,gold); stern(g,lx,ly,lr*1.3,5,0.6); g.fill();
    const gr=g.createLinearGradient(lx-lr,ly-lr,lx+lr,ly+lr); gr.addColorStop(0,'#ff9ad6'); gr.addColorStop(1,'#5a1478'); g.fillStyle=gr; stern(g,lx,ly,lr*0.98,5,0.6); g.fill();
    g.fillStyle='rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(lx-lr*0.25,ly-lr*0.3,lr*0.32,lr*0.1,-0.7,0,TAU); g.fill(); });
  mz_goldtxt(g,'2027',cx,ly-lr*1.55,gw*0.8,gw*0.32,WFNT.rund,gold);
  for(let i=0;i<40;i++){ const s=i%2?-1:1; WZ.kreis(g,cx+s*gw*0.25+(rnd()-0.5)*lr*2.4,ly+(rnd()-0.5)*lr*2.4,Math.max(0.6,gw*0.006),'rgba(255,255,255,.75)'); }
  mz_funkel(g,cx-gw*0.38,ly-lr*1.6,gw*0.05); mz_funkel(g,cx+gw*0.42,ly-lr*1.1,gw*0.035); });

wareReg('konfetti',(g,x,y,w,h,rnd,a)=>{ const {S,q}=mz_m(x,y,w,h), F=[a.ac,a.ac2,'#ffffff','#7cff6b','#ff7a3d','#b06cff'];
  const breit=q>1.2, an=breit?-0.6:-1.15, L=Math.min(breit?h*0.95:h*0.6,S*1.15), R=L*0.15;
  const bx=breit?x+w*0.1:x+w*0.3, by=y+h*0.9, d=[Math.cos(an),Math.sin(an)], p=[-d[1],d[0]], mx=bx+d[0]*L, my=by+d[1]*L, D=Math.hypot(w,h)*0.62;
  WZ.leucht(g,mx+d[0]*S*0.1,my+d[1]*S*0.1,S*0.4,'#fff3a0',0.5);
  for(let i=0;i<3;i++){ const k=(i-1)*0.5; mz_kringel(g,mx,my,mx+(d[0]+p[0]*k)*D*0.7,my+(d[1]+p[1]*k)*D*0.7,S*0.04,7,F[i],S*0.018); }
  for(let i=0;i<120;i++){ const t=0.08+rnd()*0.95, sp=(rnd()-0.5)*1.2*t, px=mx+(d[0]*t+p[0]*sp)*D, py=my+(d[1]*t+p[1]*sp)*D, z=S*(0.018+0.035*t);
    g.save(); g.translate(px,py); g.rotate(rnd()*PI); g.fillStyle=F[i%F.length]; if(i%5===0){ stern(g,0,0,z*1.2,5,0.45); g.fill(); } else if(i%3===0){ g.beginPath(); g.arc(0,0,z*0.6,0,TAU); g.fill(); } else g.fillRect(-z,-z*0.4,z*2,z*0.8); g.restore(); }
  mz_rot(g,bx,by,an,()=>{ const gr=g.createLinearGradient(0,-R,0,R); gr.addColorStop(0,heller(a.ac,0.5)); gr.addColorStop(0.35,a.ac); gr.addColorStop(1,WZ.dunkel(a.ac,0.5)); g.fillStyle=gr; g.fillRect(L*0.26,-R,L*0.74,R*2);
    g.save(); g.beginPath(); g.rect(L*0.26,-R,L*0.74,R*2); g.clip(); g.fillStyle=a.ac2; for(let i=0;i<10;i++){ const xx=L*0.2+i*L*0.1; g.beginPath(); g.moveTo(xx,-R); g.lineTo(xx+L*0.045,-R); g.lineTo(xx+L*0.045-R*0.9,R); g.lineTo(xx-R*0.9,R); g.fill(); }
    const sh=g.createLinearGradient(0,-R,0,R); sh.addColorStop(0,'rgba(255,255,255,.35)'); sh.addColorStop(0.4,'rgba(255,255,255,0)'); sh.addColorStop(1,'rgba(0,0,0,.45)'); g.fillStyle=sh; g.fillRect(L*0.26,-R,L*0.74,R*2); g.restore();
    g.fillStyle=mz_metall(g,0,-R,0,R,'#9aa3ad'); WZ.rr(g,0,-R*0.9,L*0.28,R*1.8,R*0.3); g.fill(); g.strokeStyle='rgba(0,0,0,.3)'; g.lineWidth=Math.max(1,L*0.012); for(let i=1;i<6;i++){ g.beginPath(); g.moveTo(L*0.045*i,-R*0.85); g.lineTo(L*0.045*i,R*0.85); g.stroke(); }
    WZ.ellipse(g,L,0,R*0.32,R,WZ.dunkel(a.ac,0.4)); WZ.ellipse(g,L,0,R*0.24,R*0.82,'#1a1020'); }); });

wareReg('knicklichter',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), F=[a.ac,a.ac2,'#4fc3ff','#ffe45c','#ff7a3d','#b06cff'];
  mz_nacht(g,x,y,w,h,'#24244c','#04040c'); const lw=S*0.045;
  const n=q>1.4||q<0.7?5:4, L=Math.min(Math.max(w,h)*0.72,S*1.5);
  for(let i=0;i<n;i++){ const t=(i+0.5)/n, an=(q>=1?0.55:1.05)*(i%2?1:-1)+(rnd()-0.5)*0.3, px=q>=1?x+w*t:cx+(rnd()-0.5)*w*0.25, py=q>=1?cy+(rnd()-0.5)*h*0.25:y+h*t, dx=Math.cos(an)*L/2, dy=Math.sin(an)*L/2;
    mz_neon(g,()=>{ g.beginPath(); g.moveTo(px-dx,py-dy); g.lineTo(px+dx,py+dy); },F[(i+2)%F.length],lw); }
  const nr=q>1.5||q<0.67?3:2;
  mz_raster(x+w*0.08,y+h*0.08,w*0.84,h*0.84,nr).forEach((c,i)=>{ const r=c.s*0.36, f=F[i%2];
    mz_neon(g,()=>{ g.beginPath(); g.ellipse(c.x,c.y,r,r*0.78,i*0.4-0.2,0,TAU); },f,lw*0.9);
    const vx=c.x-Math.sin(i*0.4-0.2)*r*0.78, vy=c.y+Math.cos(i*0.4-0.2)*r*0.78; g.fillStyle='#2a2a33'; WZ.rr(g,vx-lw*0.9,vy-lw*0.6,lw*1.8,lw*1.2,lw*0.3); g.fill(); g.fillStyle='rgba(255,255,255,.3)'; g.fillRect(vx-lw*0.8,vy-lw*0.5,lw*1.6,lw*0.25); }); });

function mz_hut(g,cx,by,hh,f1,f2,m){ const bw=hh*0.62, top=by-hh;
  WZ.schatten(g,cx,by+bw*0.06,bw*0.6,bw*0.14,0.35);
  g.save(); g.beginPath(); g.moveTo(cx,top); g.lineTo(cx+bw/2,by); g.ellipse(cx,by,bw/2,bw*0.13,0,0,PI); g.closePath(); g.fillStyle=f1; g.fill(); g.clip();
  g.fillStyle=f2; g.strokeStyle=f2;
  if(m===0){ g.lineWidth=bw*0.09; for(let i=-6;i<8;i++){ g.beginPath(); g.moveTo(cx-bw+i*bw*0.22,by+bw*0.2); g.lineTo(cx+i*bw*0.22,top); g.stroke(); } }
  else if(m===1){ for(let j=0;j<8;j++) for(let i=-3;i<=3;i++) WZ.kreis(g,cx+i*bw*0.2+(j%2)*bw*0.1,top+hh*(0.12+j*0.12),bw*0.05,f2); }
  else { g.lineWidth=bw*0.07; for(let j=0;j<5;j++){ g.beginPath(); for(let i=0;i<=10;i++) g.lineTo(cx-bw/2+i*bw*0.1,top+hh*(0.2+j*0.18)+(i%2?-1:1)*hh*0.04); g.stroke(); } }
  const sh=g.createLinearGradient(cx-bw/2,0,cx+bw/2,0); sh.addColorStop(0,'rgba(255,255,255,.35)'); sh.addColorStop(0.35,'rgba(255,255,255,0)'); sh.addColorStop(1,'rgba(0,0,0,.45)'); g.fillStyle=sh; g.fillRect(cx-bw,top,bw*2,hh*1.3); g.restore();
  g.strokeStyle='#ffd23f'; g.lineWidth=Math.max(1,bw*0.025); for(let i=0;i<=20;i++){ const t=PI*i/20, ex=cx+Math.cos(t)*bw/2, ey=by+Math.sin(t)*bw*0.13; g.beginPath(); g.moveTo(ex,ey-bw*0.04); g.lineTo(ex+(i%2-0.5)*bw*0.03,ey+bw*0.05); g.stroke(); }
  g.lineWidth=Math.max(1,bw*0.03); for(let i=0;i<18;i++){ const w=i/18*TAU; g.strokeStyle=i%2?'#ffffff':f2; g.beginPath(); g.moveTo(cx,top); g.lineTo(cx+Math.cos(w)*bw*0.17,top+Math.sin(w)*bw*0.17); g.stroke(); } }
wareReg('partyhuete',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), H=[[a.ac2,a.ac,0],[a.ac,a.bg1,1],['#7cff6b','#b06cff',2],['#ff7a3d','#ffffff',1]];
  if(q<0.8){ const hh=Math.min(h*0.48,w*0.95); mz_hut(g,cx-w*0.18,y+h*0.6,hh*0.85,...H[0]); mz_hut(g,cx+w*0.16,y+h*0.62,hh,...H[1]); const L=w*0.75; mz_troete(g,cx-L*0.5,y+h*0.82,L,-0.15,'#ffd23f',a.bg1); return; }
  const k=q>1.6?4:3, hh=Math.min(h*0.74,w/(k*0.58)), sp=hh*0.5;
  for(let i=0;i<k;i++){ const j=[0,2,1,3][i], hx=cx+(i-(k-1)/2)*sp, hk=hh*(i%2?1:0.86); mz_hut(g,hx,cy+hh*0.42+(i%2?hh*0.04:0),hk,...H[j%H.length]); }
  const L=Math.min(w*0.5,S*0.7); mz_troete(g,cx-L*0.55,y+h*0.9,L,-0.12,'#ffd23f',a.bg1); });

function mz_ruessel(g,ox,oy,an,L,W,f1,f2,roll){ mz_rot(g,ox,oy,an,()=>{
  g.fillStyle=mz_metall(g,0,-W*0.6,0,W*0.6,'#f4f1ea'); WZ.rr(g,-W*1.3,-W*0.42,W*1.5,W*0.84,W*0.3); g.fill(); g.fillStyle=f2; g.fillRect(-W*0.15,-W*0.55,W*0.32,W*1.1);
  const Lg=L*(1-roll), Rs=Math.max(W*1.3,roll*L/(TAU*1.6));
  for(let xx=W*0.17,i=0;xx<Lg;xx+=W*0.9,i++){ g.fillStyle=i%2?f1:f2; g.fillRect(xx,-W/2,Math.min(W*0.9,Lg-xx)+0.5,W); }
  const sh=g.createLinearGradient(0,-W/2,0,W/2); sh.addColorStop(0,'rgba(255,255,255,.35)'); sh.addColorStop(0.5,'rgba(255,255,255,0)'); sh.addColorStop(1,'rgba(0,0,0,.35)'); g.fillStyle=sh; g.fillRect(W*0.17,-W/2,Lg-W*0.17,W);
  const sp=()=>{ g.beginPath(); for(let i=0;i<=90;i++){ const th=i/90*TAU*2, r=Rs*(1-th/(TAU*2)*0.75); g.lineTo(Lg+r*Math.sin(th),-Rs+r*Math.cos(th)); } };
  g.lineCap='butt'; g.lineWidth=W; g.strokeStyle=WZ.dunkel(f1,0.2); sp(); g.stroke(); g.setLineDash([W*0.9,W*0.9]); g.strokeStyle=f2; sp(); g.stroke(); g.setLineDash([]);
  g.lineWidth=W*0.2; g.strokeStyle='rgba(255,255,255,.4)'; sp(); g.stroke(); }); }
wareReg('luftruessel',(g,x,y,w,h,rnd,a)=>{ const {S,cx,q}=mz_m(x,y,w,h), C=[[a.ac2,'#ffffff'],[a.ac,'#ff4fa3'],['#5ce1ff','#ffe45c'],['#b06cff','#7cff6b']], R=[0.3,0.12,0.5,0.22], W=S*(q<0.8?0.1:0.075);
  const breit=q>1.3, n=4;
  for(let i=0;i<n;i++){ const t=i/(n-1), an=breit?-0.4+t*0.62:(q<0.8?-1.95+t*0.75:-2.05+t*1.2), L=(breit?Math.min(w*0.62,h*1.5):q<0.8?h*0.72:Math.min(h*0.62,S*1.4))*(0.85+((i*5)%3)*0.08);
    const ox=breit?x+w*0.1:cx+w*0.06+(t-0.5)*w*0.18, oy=breit?y+h*0.62+(t-0.5)*h*0.12:y+h*0.93; mz_ruessel(g,ox,oy,an,L,W,C[i][0],C[i][1],R[i]); } });

wareReg('girlanden',(g,x,y,w,h,rnd,a)=>{ const {S}=mz_m(x,y,w,h), B=Math.max(2,Math.round(h/(S*0.33))), bh=h/B, ph=bh*0.72, pw=Math.min(ph*0.85,S*0.2);
  for(let b=0;b<B;b++){ const y0=y+bh*(b+0.12), sag=bh*0.22, Y=t=>y0+sag*4*t*(1-t), dY=t=>sag*4*(1-2*t)/w;
    if(b%2===1){ /* Lametta-Girlande */ g.lineWidth=Math.max(0.7,S*0.007); const m=Math.round(w/(S*0.008));
      for(let i=0;i<m;i++){ const t=rnd(), px=x+t*w, py=Y(t)+bh*0.25, an=rnd()*TAU, l=S*(0.03+rnd()*0.04); g.strokeStyle=i%3?'#ffd23f':(i%2?'#fff3c4':'#c9a12a'); g.beginPath(); g.moveTo(px,py); g.lineTo(px+Math.cos(an)*l,py+Math.sin(an)*l); g.stroke(); } continue; }
    g.strokeStyle='#8a6a1c'; g.lineWidth=Math.max(1,S*0.008); g.beginPath(); for(let i=0;i<=30;i++){ const t=i/30; g.lineTo(x+t*w,Y(t)); } g.stroke();
    const k=Math.ceil(w/(pw*1.12)); for(let i=0;i<k;i++){ const t=(i+0.5)/k, px=x+t*w, py=Y(t), an=Math.atan(dY(t)), f=(i+b)%2?'#e2e8f0':'#ffc21a';
      mz_rot(g,px,py,an,()=>{ g.beginPath(); g.moveTo(-pw/2,0); g.lineTo(pw/2,0); g.lineTo(0,ph); g.closePath(); g.fillStyle=mz_metall(g,-pw/2,0,pw/2,ph,f); g.fill();
        for(let j=0;j<5;j++){ const v=rnd(); WZ.kreis(g,(rnd()-0.5)*pw*(1-v),v*ph*0.9,Math.max(0.5,pw*0.025),'rgba(255,255,255,.85)'); } }); } } });

wareReg('folienvorhang',(g,x,y,w,h,rnd,a)=>{ const {S}=mz_m(x,y,w,h);
  mz_nacht(g,x,y,w,h,'#4a3a6a','#0a0614');
  const n=Math.max(16,Math.round(w/(S*0.04))), sw=w/n, top=y+h*0.1;
  for(let i=0;i<n;i++){ const f=i%2?'#ffd23f':'#e6ecf4', xx=x+i*sw+(rnd()-0.5)*sw*0.3, len=h*(0.82+rnd()*0.16), bend=(rnd()-0.5)*sw*3;
    const gr=g.createLinearGradient(0,top,0,top+len); for(let k=0;k<=7;k++) gr.addColorStop(k/7,k%2?WZ.dunkel(f,0.3+rnd()*0.3):WZ.hell(f,0.2+rnd()*0.7)); g.fillStyle=gr;
    g.beginPath(); g.moveTo(xx,top); g.lineTo(xx+sw*0.85,top); g.quadraticCurveTo(xx+sw*0.85+bend,top+len*0.6,xx+sw*0.85+bend*0.4,top+len); g.lineTo(xx+bend*0.4,top+len); g.quadraticCurveTo(xx+bend,top+len*0.6,xx,top); g.fill(); }
  g.save(); g.globalCompositeOperation='lighter'; const gl=g.createLinearGradient(x,y+h*0.2,x+w,y+h*0.8); gl.addColorStop(0,'rgba(255,255,255,0)'); gl.addColorStop(0.45,'rgba(255,255,255,.22)'); gl.addColorStop(0.55,'rgba(255,255,255,0)'); g.fillStyle=gl; g.fillRect(x,top,w,h); g.restore();
  g.fillStyle=mz_metall(g,0,y+h*0.05,0,top+h*0.02,'#c9a12a'); WZ.rr(g,x+w*0.02,y+h*0.05,w*0.96,top-y-h*0.03,h*0.02); g.fill();
  for(let i=0;i<8;i++){ const fx=x+rnd()*w, fy=y+h*0.2+rnd()*h*0.75; WZ.leucht(g,fx,fy,S*0.06,'#ffffff',0.5); mz_funkel(g,fx,fy,S*(0.025+rnd()*0.03)); } });

/* ---------- Tisch ---------- */
function mz_faecher(g,cx,by,s,f,rand){ const nh=s, k=6, pts=[]; for(let i=0;i<=k;i++){ const t=-1.05+2.1*i/k; pts.push([cx+Math.sin(t)*nh*0.62,by-Math.cos(t)*nh]); }
  for(let i=0;i<k;i++){ g.fillStyle=i%2?WZ.dunkel(f,0.25):f; g.beginPath(); g.moveTo(cx,by); g.lineTo(pts[i][0],pts[i][1]); g.lineTo(pts[i+1][0],pts[i+1][1]); g.closePath(); g.fill(); }
  g.strokeStyle=rand; g.lineWidth=Math.max(1,s*0.03); g.beginPath(); pts.forEach(p=>g.lineTo(p[0],p[1])); g.stroke();
  g.fillStyle='rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(cx,by); g.lineTo(pts[1][0],pts[1][1]); g.lineTo(pts[2][0],pts[2][1]); g.fill(); }
function mz_kerze(g,kx,by,kh,kw,f,flamme){ WZ.ellipse(g,kx,by,kw*1.4,kw*0.4,WZ.dunkel('#d4a62a',0.2)); WZ.ellipse(g,kx,by-kw*0.12,kw*1.3,kw*0.35,'#ffd86a');
  const gr=g.createLinearGradient(kx-kw/2,0,kx+kw/2,0); gr.addColorStop(0,WZ.dunkel(f,0.15)); gr.addColorStop(0.3,WZ.hell(f,0.55)); gr.addColorStop(0.6,f); gr.addColorStop(1,WZ.dunkel(f,0.5)); g.fillStyle=gr;
  WZ.rr(g,kx-kw/2,by-kh,kw,kh-kw*0.1,kw*0.25); g.fill(); WZ.ellipse(g,kx,by-kh+kw*0.1,kw/2,kw*0.15,WZ.hell(f,0.35));
  g.fillStyle=WZ.hell(f,0.4); WZ.rr(g,kx-kw*0.45,by-kh+kw*0.05,kw*0.2,kh*0.18,kw*0.1); g.fill();
  g.strokeStyle='#222'; g.lineWidth=Math.max(1,kw*0.08); g.beginPath(); g.moveTo(kx,by-kh+kw*0.1); g.lineTo(kx,by-kh-kw*0.25); g.stroke();
  if(flamme) mz_flamme(g,kx,by-kh-kw*0.1,kw*0.6); }
wareReg('tischdeko',(g,x,y,w,h,rnd,a)=>{ const {S,cx}=mz_m(x,y,w,h), hor=y+h*0.36, th=y+h-hor;
  g.fillStyle=WZ.dunkel(a.bg1,0.1); g.fillRect(x,y,w,hor-y);
  for(let i=0;i<6;i++) WZ.leucht(g,x+rnd()*w,y+rnd()*(hor-y),S*0.06,a.ac,0.25);
  const tg=g.createLinearGradient(0,hor,0,y+h); tg.addColorStop(0,'#dfe9e2'); tg.addColorStop(1,'#ffffff'); g.fillStyle=tg; g.fillRect(x,hor,w,th);
  g.fillStyle=rgba(a.ac2,0.85); g.beginPath(); g.moveTo(cx-w*0.09,hor); g.lineTo(cx+w*0.09,hor); g.lineTo(cx+w*0.22,y+h); g.lineTo(cx-w*0.22,y+h); g.fill();
  WZ.konfetti(g,x,hor+th*0.05,w,th*0.95,Math.round(30*w/S),[a.ac,'#e2e8f0',a.ac2,'#ffd23f'],S*0.012,rnd);
  for(let i=0;i<10;i++) WZ.stern(g,x+rnd()*w,hor+th*(0.1+rnd()*0.85),S*0.022,i%2?a.ac:'#d4a62a');
  const kh=Math.min(h*0.44,S*0.55), kw=kh*0.13, kd=Math.min(w*0.33,S*0.42), kb=hor+th*0.35;
  [-1,1].forEach(s=>{ WZ.schatten(g,cx+s*kd+kw,kb,kw*2,kw*0.5,0.3); mz_kerze(g,cx+s*kd,kb,kh*(s<0?1:0.86),kw,a.ac2,true); });
  const py=hor+th*0.62, prx=Math.min(w*0.26,S*0.36), pry=prx*0.38;
  WZ.teller(g,cx,py,prx,pry,'#ffffff','#ece7dc'); g.strokeStyle=a.ac; g.lineWidth=Math.max(1,prx*0.03); g.beginPath(); g.ellipse(cx,py,prx*0.92,pry*0.9,0,0,TAU); g.stroke();
  mz_faecher(g,cx,py+pry*0.2,prx*0.95,a.ac2,a.ac); });

function mz_tellerstapel(g,cx,cy,s,f){ const rx=s*0.46, ry=rx*0.3; WZ.schatten(g,cx,cy+s*0.3,rx*1.1,ry*0.9,0.35);
  for(let i=6;i>=0;i--){ const yy=cy+s*0.08+i*s*0.028; WZ.ellipse(g,cx,yy+s*0.012,rx,ry,'#c9c4b8'); WZ.ellipse(g,cx,yy,rx,ry,'#f6f3ec'); }
  const yy=cy+s*0.08; g.strokeStyle=f; g.lineWidth=Math.max(1,s*0.035); g.beginPath(); g.ellipse(cx,yy,rx*0.88,ry*0.84,0,0,TAU); g.stroke(); WZ.ellipse(g,cx,yy+ry*0.06,rx*0.6,ry*0.55,'#ebe6da');
  for(let i=0;i<12;i++){ const an=i/12*TAU; WZ.stern(g,cx+Math.cos(an)*rx*0.76,yy+Math.sin(an)*ry*0.72,s*0.018,f); } }
function mz_becher(g,cx,by,ch,f,n){ const tw=ch*0.74, bw=ch*0.52; WZ.schatten(g,cx,by,tw*0.6,tw*0.14,0.35);
  for(let i=0;i<n;i++){ const b=by-i*ch*0.14, t=b-ch; g.beginPath(); g.moveTo(cx-tw/2,t); g.lineTo(cx+tw/2,t); g.lineTo(cx+bw/2,b); g.lineTo(cx-bw/2,b); g.closePath();
    const gr=g.createLinearGradient(cx-tw/2,0,cx+tw/2,0); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.55,'#e8eef6'); gr.addColorStop(1,'#9aa8ba'); g.fillStyle=gr; g.fill();
    g.save(); g.clip(); g.fillStyle=f; g.fillRect(cx-tw,t+ch*0.2,tw*2,ch*0.2); for(let k=0;k<6;k++) WZ.kreis(g,cx-tw*0.4+k*tw*0.16,t+ch*0.62,ch*0.035,f);
    const sh=g.createLinearGradient(cx-tw/2,0,cx+tw/2,0); sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(0.6,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,.35)'); g.fillStyle=sh; g.fillRect(cx-tw,t,tw*2,ch); g.restore();
    g.fillStyle='#d8dee8'; WZ.rr(g,cx-tw*0.53,t-ch*0.03,tw*1.06,ch*0.06,ch*0.03); g.fill(); }
  const t=by-(n-1)*ch*0.14-ch; WZ.ellipse(g,cx,t,tw*0.48,tw*0.1,'#7d8aa0'); }
function mz_besteck(g,cx,cy,s,f){ const L=s*0.9;
  [[-0.4,0],[0,1],[0.4,2]].forEach(([an,art])=>mz_rot(g,cx,cy+L*0.45,an,()=>{ g.fillStyle=mz_metall(g,-L*0.08,0,L*0.08,0,f);
    WZ.rr(g,-L*0.04,-L*0.56,L*0.08,L*0.56,L*0.04); g.fill();
    if(art===0){ g.fillRect(-L*0.075,-L*0.72,L*0.15,L*0.18); for(let k=0;k<4;k++) g.fillRect(-L*0.075+k*L*0.041,-L*0.95,L*0.026,L*0.26); }
    else if(art===1){ g.beginPath(); g.moveTo(-L*0.045,-L*0.55); g.lineTo(-L*0.05,-L*1.0); g.quadraticCurveTo(L*0.07,-L*0.92,L*0.045,-L*0.55); g.fill(); }
    else { g.beginPath(); g.ellipse(0,-L*0.8,L*0.095,L*0.16,0,0,TAU); g.fill(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-L*0.03,-L*0.83,L*0.03,L*0.09,0,0,TAU); g.fill(); } })); }
wareReg('geschirr',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), f=a.ac;
  if(q<=1.25&&q>=0.8){ mz_becher(g,cx-S*0.26,cy+S*0.12,S*0.38,f,4); mz_besteck(g,cx+S*0.27,cy-S*0.12,S*0.5,'#5c9ce6'); mz_tellerstapel(g,cx,cy+S*0.12,S*0.68,f); return; }
  const B=mz_drei(x,y,w,h); mz_becher(g,B[0].x,B[0].y+B[0].s*0.42,B[0].s*0.55,f,4); mz_tellerstapel(g,B[1].x,B[1].y,B[1].s*1.1,f); mz_besteck(g,B[2].x,B[2].y,B[2].s*0.85,'#5c9ce6'); });

/* ---------- Spiel, Kalender ---------- */
function mz_wuerfel(g,cx,cy,s,n1,n2,n3){ const e=s*0.5, F=[cx,cy+e*0.95], r=[e*0.87,-e*0.5], l=[-e*0.87,-e*0.5], u=[0,-e];
  WZ.schatten(g,cx,cy+e*0.9,e*1.0,e*0.3,0.35);
  const flaeche=(o,A,B,farbe,n)=>{ g.save(); g.transform(A[0],A[1],B[0],B[1],o[0],o[1]); g.fillStyle=farbe; WZ.rr(g,0,0,1,1,0.12); g.fill();
    const P={1:[[.5,.5]],2:[[.27,.27],[.73,.73]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.27,.27],[.73,.27],[.27,.73],[.73,.73]],5:[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],6:[[.27,.22],[.27,.5],[.27,.78],[.73,.22],[.73,.5],[.73,.78]]}[n];
    g.fillStyle='#1a1a2a'; P.forEach(p=>{ g.beginPath(); g.arc(p[0],p[1],0.1,0,TAU); g.fill(); }); g.restore(); };
  const top=[F[0]+u[0],F[1]+u[1]];
  flaeche([F[0]+l[0]+u[0],F[1]+l[1]+u[1]],[-l[0],-l[1]],[-u[0],-u[1]],'#e8e8ee',n2);
  flaeche([F[0]+u[0],F[1]+u[1]],r,[-u[0],-u[1]],'#b8b8c8',n3);
  flaeche([top[0]+l[0],top[1]+l[1]],[r[0],r[1]],[-l[0],-l[1]],'#ffffff',n1); }
function mz_sanduhr(g,cx,cy,s){ const hh=s*0.9, bw=s*0.5, t=cy-hh/2, b=cy+hh/2, pl=hh*0.07;
  WZ.schatten(g,cx,b,bw*0.7,bw*0.15,0.4);
  const glas=()=>{ g.beginPath(); g.moveTo(cx-bw*0.4,t+pl); g.bezierCurveTo(cx-bw*0.45,cy-hh*0.12,cx-bw*0.05,cy-hh*0.05,cx-bw*0.05,cy); g.bezierCurveTo(cx-bw*0.05,cy+hh*0.05,cx-bw*0.45,cy+hh*0.12,cx-bw*0.4,b-pl);
    g.lineTo(cx+bw*0.4,b-pl); g.bezierCurveTo(cx+bw*0.45,cy+hh*0.12,cx+bw*0.05,cy+hh*0.05,cx+bw*0.05,cy); g.bezierCurveTo(cx+bw*0.05,cy-hh*0.05,cx+bw*0.45,cy-hh*0.12,cx+bw*0.4,t+pl); g.closePath(); };
  glas(); g.fillStyle='rgba(210,235,255,.3)'; g.fill(); g.save(); glas(); g.clip();
  g.fillStyle='#f2c14e'; g.beginPath(); g.moveTo(cx-bw*0.5,b-pl); g.quadraticCurveTo(cx,b-pl-hh*0.32,cx+bw*0.5,b-pl); g.fill(); g.fillRect(cx-bw*0.4,cy-hh*0.2,bw*0.8,hh*0.2); g.fillRect(cx-s*0.01,cy-hh*0.02,s*0.02,hh*0.4);
  WZ.glanz(g,cx-bw*0.35,t,bw*0.2,hh,0.5); g.restore(); glas(); g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=Math.max(1,s*0.012); g.stroke();
  const holz=mz_metall(g,cx-bw/2,0,cx+bw/2,0,'#8a5a2c'); g.fillStyle=holz; WZ.rr(g,cx-bw/2,t,bw,pl,pl*0.3); g.fill(); WZ.rr(g,cx-bw/2,b-pl,bw,pl,pl*0.3); g.fill();
  [-0.44,0.44].forEach(k=>{ g.fillRect(cx+k*bw-bw*0.03,t+pl,bw*0.06,hh-pl*2); }); }
wareReg('partyspiel',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h);
  let K,U,D; if(q>1.25){ const s=Math.min(h*0.95,w*0.34); K={x:x+w*0.2,y:cy,s:s*0.8}; U={x:cx,y:cy,s}; D={x:x+w*0.8,y:cy+s*0.12,s:s*0.7}; }
  else if(q<0.8){ const s=Math.min(w*0.9,h*0.5); U={x:cx,y:y+h*0.3,s}; K={x:x+w*0.3,y:y+h*0.76,s:s*0.55}; D={x:x+w*0.72,y:y+h*0.78,s:s*0.45}; }
  else { U={x:cx-S*0.2,y:cy,s:S*0.85}; K={x:cx+S*0.24,y:cy-S*0.2,s:S*0.42}; D={x:cx+S*0.25,y:cy+S*0.26,s:S*0.36}; }
  [10,9,8].forEach((n,i)=>mz_rot(g,K.x,K.y+K.s*0.3,(i-1)*0.35,()=>{ const cw=K.s*0.5, ch=K.s*0.72; g.fillStyle='rgba(0,0,0,.25)'; WZ.rr(g,-cw/2+cw*0.05,-ch-K.s*0.02,cw,ch,cw*0.1); g.fill();
    g.fillStyle='#ffffff'; WZ.rr(g,-cw/2,-ch-K.s*0.05,cw,ch,cw*0.1); g.fill(); g.strokeStyle=[a.bg1,'#e63b2e','#1b5fa8'][i]; g.lineWidth=Math.max(1,cw*0.07); WZ.rr(g,-cw/2+cw*0.08,-ch-K.s*0.05+cw*0.08,cw*0.84,ch-cw*0.16,cw*0.06); g.stroke();
    WZ.txt(g,String(n),0,-ch/2-K.s*0.05,cw*0.7,ch*0.45,WFNT.rund,[a.bg1,'#e63b2e','#1b5fa8'][i]); }));
  mz_sanduhr(g,U.x,U.y,U.s); mz_wuerfel(g,D.x-D.s*0.22,D.y,D.s*0.55,5,3,2); mz_wuerfel(g,D.x+D.s*0.25,D.y+D.s*0.1,D.s*0.5,6,1,4); });

function mz_burst(g,x,y,r,f,rnd){ g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle=rgba(f,0.85); g.lineWidth=Math.max(0.6,r*0.05); g.lineCap='round';
  for(let i=0;i<16;i++){ const an=i/16*TAU+rnd()*0.2, r0=r*0.2, r1=r*(0.8+rnd()*0.25); g.beginPath(); g.moveTo(x+Math.cos(an)*r0,y+Math.sin(an)*r0); g.lineTo(x+Math.cos(an)*r1,y+Math.sin(an)*r1); g.stroke(); WZ.kreis(g,x+Math.cos(an)*r1,y+Math.sin(an)*r1,r*0.06,'#ffffff'); }
  WZ.leucht(g,x,y,r*1.1,f,0.35); g.restore(); }
wareReg('kalender',(g,x,y,w,h,rnd,a)=>{ const {cx,cy,q}=mz_m(x,y,w,h), quer=q>1.25, asp=quer?1.45:0.74;
  const pw=Math.min(w*0.9,h*0.84*asp), ph=pw/asp, px=cx-pw/2, py=cy-ph/2+h*0.03;
  g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(px+pw*0.03,py+ph*0.035,pw,ph); g.fillStyle='#e6dfcc'; g.fillRect(px+pw*0.012,py+ph*0.015,pw,ph); g.fillStyle='#ffffff'; g.fillRect(px,py,pw,ph);
  const bx=px+pw*0.04, by=py+ph*(quer?0.1:0.08), bw=quer?pw*0.48:pw*0.92, bh=quer?ph*0.84:ph*0.46;
  const sg=g.createLinearGradient(0,by,0,by+bh); sg.addColorStop(0,'#0a0f3a'); sg.addColorStop(1,'#3a2a6a'); g.fillStyle=sg; g.fillRect(bx,by,bw,bh);
  g.save(); g.beginPath(); g.rect(bx,by,bw,bh); g.clip(); const br=Math.min(bw,bh);
  mz_burst(g,bx+bw*0.3,by+bh*0.32,br*0.26,'#ff4fa3',rnd); mz_burst(g,bx+bw*0.72,by+bh*0.26,br*0.22,'#ffd23f',rnd); mz_burst(g,bx+bw*0.55,by+bh*0.55,br*0.15,'#5ce1ff',rnd);
  g.fillStyle='#07091e'; for(let i=0;i<9;i++){ const hx=bx+bw*i/9, hh=bh*(0.12+rnd()*0.2); g.fillRect(hx,by+bh-hh,bw/9+1,hh); } g.fillRect(bx+bw*0.62,by+bh*0.55,bw*0.03,bh*0.45); g.restore();
  const gx=quer?px+pw*0.56:px+pw*0.06, gy=quer?py+ph*0.1:by+bh+ph*0.035, gw=quer?pw*0.4:pw*0.88, gh=(quer?ph*0.84:py+ph-gy-ph*0.04);
  g.fillStyle=a.ac2; g.fillRect(gx,gy,gw,gh*0.17); WZ.txt(g,'JANUAR 2027',gx+gw/2,gy+gh*0.09,gw*0.92,gh*0.13,WFNT.kond,'#ffffff');
  const cw=gw/7, rh=gh*0.83/5, z=Math.min(cw,rh);
  for(let r=0;r<5;r++) for(let c=0;c<7;c++){ const d=r*7+c-3; if(d<1||d>31) continue; const tx=gx+(c+0.5)*cw, ty=gy+gh*0.17+(r+0.5)*rh;
    if(z>=7) WZ.txt(g,String(d),tx,ty,cw*0.9,z*0.62,WFNT.klar,c===6?a.ac2:'#2a2a3a'); else WZ.kreis(g,tx,ty,z*0.18,c===6?a.ac2:'#555');
    if(d===1){ g.strokeStyle=a.ac2; g.lineWidth=Math.max(1,z*0.08); g.beginPath(); g.arc(tx,ty,z*0.45,0,TAU); g.stroke(); } }
  const n=Math.max(6,Math.round(pw/Math.max(4,pw*0.06))); for(let i=0;i<n;i++){ const rx=px+pw*(i+0.5)/n; g.strokeStyle='#3a3a44'; g.lineWidth=Math.max(1,pw*0.012); g.beginPath(); g.ellipse(rx,py,pw*0.012,ph*0.035,0,PI*0.9,PI*2.1); g.stroke(); }
  WZ.kreis(g,cx,py-ph*0.06,Math.max(1.5,pw*0.015),'#555'); g.strokeStyle='#555'; g.lineWidth=Math.max(1,pw*0.006); g.beginPath(); g.moveTo(px+pw*0.25,py); g.lineTo(cx,py-ph*0.06); g.lineTo(px+pw*0.75,py); g.stroke(); });

/* ---------- Glaeser, Kerzen, Servietten ---------- */
function mz_flute(g,cx,by,h,voll,rnd){ const kw=h*0.21, kh=h*0.56, top=by-h, st=top+kh;
  const kelch=()=>{ g.beginPath(); g.moveTo(cx-kw/2,top); g.bezierCurveTo(cx-kw*0.55,top+kh*0.6,cx-kw*0.25,st,cx,st); g.bezierCurveTo(cx+kw*0.25,st,cx+kw*0.55,top+kh*0.6,cx+kw/2,top); g.closePath(); };
  g.strokeStyle='rgba(235,245,255,.85)'; g.lineWidth=Math.max(1,h*0.022); g.lineCap='round'; g.beginPath(); g.moveTo(cx,st); g.lineTo(cx,by-h*0.02); g.stroke();
  WZ.ellipse(g,cx,by-h*0.015,h*0.13,h*0.03,'rgba(225,240,255,.6)');
  kelch(); g.fillStyle='rgba(220,235,255,.2)'; g.fill(); g.save(); kelch(); g.clip();
  if(voll){ const gr=g.createLinearGradient(0,top+kh*0.15,0,st); gr.addColorStop(0,'#fff0b0'); gr.addColorStop(1,'#e2a82a'); g.fillStyle=gr; g.fillRect(cx-kw,top+kh*0.15,kw*2,kh); WZ.ellipse(g,cx,top+kh*0.15,kw*0.5,kw*0.06,'#fffbe0');
    for(let i=0;i<8;i++) WZ.kreis(g,cx+(rnd()-0.5)*kw*0.5,top+kh*(0.25+rnd()*0.65),Math.max(0.6,h*0.008),'rgba(255,255,255,.85)'); }
  g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(cx-kw*0.36,top+kh*0.05,kw*0.12,kh*0.8); g.restore();
  kelch(); g.lineWidth=Math.max(1,h*0.012); g.stroke(); }
wareReg('sektglaeser',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h);
  mz_nacht(g,x,y,w,h,heller(a.bg1,0.3),a.bg2); for(let i=0;i<12;i++) WZ.leucht(g,x+rnd()*w,y+rnd()*h,S*(0.04+rnd()*0.08),a.ac,0.3);
  const gh=Math.min(h*0.8,S*1.0), by=cy+gh*0.5;
  if(q>1.45) [-1,1].forEach(s=>{ const sx=cx+s*Math.min(w*0.34,gh*0.75); WZ.schatten(g,sx,by,gh*0.12,gh*0.03,0.4); mz_flute(g,sx,by,gh*0.8,false,rnd); });
  [-1,1].forEach(s=>{ WZ.schatten(g,cx+s*gh*0.2,by,gh*0.14,gh*0.03,0.4); mz_rot(g,cx+s*gh*0.2,by,-s*0.17,()=>mz_flute(g,0,0,gh,true,rnd)); });
  const ky=by-gh*0.97; WZ.leucht(g,cx,ky,gh*0.18,'#fff3a0',0.7); mz_funkel(g,cx,ky,gh*0.09);
  for(let i=0;i<7;i++){ const an=-PI/2+(rnd()-0.5)*2.2, d=gh*(0.08+rnd()*0.12); WZ.kreis(g,cx+Math.cos(an)*d,ky+Math.sin(an)*d,gh*(0.008+rnd()*0.01),'#ffe9a0'); } });

wareReg('kerzen',(g,x,y,w,h,rnd,a)=>{ const {S,cx,q}=mz_m(x,y,w,h);
  mz_nacht(g,x,y,w,h,'#5a3e14','#100a02');
  const n=q>1.6?5:q>1.05?4:3, sp=Math.min(w/(n+0.4),h*0.36), kw=Math.min(sp*0.42,h*0.11), by=y+h*0.93;
  WZ.ellipse(g,cx,by+kw*0.1,sp*n*0.55,kw*0.5,'rgba(0,0,0,.35)');
  for(let i=0;i<n;i++){ const kx=cx+(i-(n-1)/2)*sp, kh=h*(0.5+((i*7)%3)*0.08); mz_kerze(g,kx,by,kh,kw,'#d4a62a',true); }
  for(let i=0;i<10;i++) mz_funkel(g,x+rnd()*w,y+rnd()*h*0.8,S*(0.01+rnd()*0.015),'#fff3c4'); });

wareReg('servietten',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), breit=q>1.3;
  const sq=Math.min(breit?w*0.5:w*0.78,h*1.15), sx=breit?x+w*0.36:cx, sy=cy+h*0.04, d=sq*0.012;
  WZ.schatten(g,sx,sy+sq*0.3,sq*0.6,sq*0.12,0.4);
  const blatt=(k,f)=>{ g.save(); g.translate(sx,sy+k*d); g.scale(1,0.55); g.rotate(-0.12); g.fillStyle=f; g.fillRect(-sq/2,-sq/2,sq,sq); g.restore(); };
  for(let k=10;k>0;k--) blatt(k,k%2?'#d8d2c2':'#f2eee4');
  g.save(); g.translate(sx,sy); g.scale(1,0.55); g.rotate(-0.12); g.fillStyle=a.bg1; g.fillRect(-sq/2,-sq/2,sq,sq);
  g.strokeStyle=a.ac2; g.lineWidth=sq*0.03; g.strokeRect(-sq*0.44,-sq*0.44,sq*0.88,sq*0.88); g.strokeStyle=a.ac; g.lineWidth=sq*0.01; g.strokeRect(-sq*0.4,-sq*0.4,sq*0.8,sq*0.8);
  for(let i=0;i<14;i++) WZ.stern(g,(rnd()-0.5)*sq*0.72,(rnd()-0.5)*sq*0.72,sq*(0.02+rnd()*0.025),a.ac);
  WZ.txt(g,'Prosit',0,-sq*0.1,sq*0.7,sq*0.2,WFNT.schreib,a.ac,'center',WZ.dunkel(a.bg1,0.5)); WZ.txt(g,'Neujahr',0,sq*0.13,sq*0.7,sq*0.2,WFNT.schreib,a.ac,'center',WZ.dunkel(a.bg1,0.5)); g.restore();
  if(breit){ const fx=x+w*0.82, fb=y+h*0.86, s=Math.min(h*0.7,w*0.3); WZ.schatten(g,fx,fb,s*0.5,s*0.08,0.35); mz_faecher(g,fx,fb,s,a.ac2,a.ac); } });

wareReg('champagnerturm',(g,x,y,w,h,rnd,a)=>{ const {S,cx,q}=mz_m(x,y,w,h);
  mz_nacht(g,x,y,w,h,heller(a.bg1,0.25),a.bg2); for(let i=0;i<14;i++) WZ.leucht(g,x+rnd()*w,y+rnd()*h,S*(0.03+rnd()*0.07),a.ac,0.3);
  const n=q>1.5?4:q<0.75?2:3, gw=Math.min(w*0.9/n,h*0.88/(n*0.62+0.85)), st=gw*0.62, by0=y+h*0.95;
  const coupe=(gx,by)=>{ const ry=gw*0.09, top=by-st, dp=gw*0.22;
    WZ.ellipse(g,gx,by-ry*0.4,gw*0.2,ry*0.5,'rgba(220,235,255,.55)'); g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=Math.max(1,gw*0.03); g.beginPath(); g.moveTo(gx,by-ry*0.4); g.lineTo(gx,top+dp); g.stroke();
    g.beginPath(); g.moveTo(gx-gw/2,top); g.quadraticCurveTo(gx-gw*0.45,top+dp*1.3,gx,top+dp); g.quadraticCurveTo(gx+gw*0.45,top+dp*1.3,gx+gw/2,top); g.closePath();
    const gr=g.createLinearGradient(0,top,0,top+dp); gr.addColorStop(0,'#ffe58a'); gr.addColorStop(1,'#c99a2a'); g.fillStyle=gr; g.fill(); g.lineWidth=Math.max(1,gw*0.02); g.stroke();
    WZ.ellipse(g,gx,top,gw/2,ry,'#fff0b0'); g.strokeStyle='rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(gx,top,gw/2,ry,0,0,TAU); g.stroke();
    g.strokeStyle='rgba(255,220,120,.85)'; g.lineWidth=Math.max(0.8,gw*0.015); [-1,1].forEach(s=>{ g.beginPath(); g.moveTo(gx+s*gw*0.48,top+ry*0.3); g.quadraticCurveTo(gx+s*gw*0.55,top+dp,gx+s*gw*0.5,by); g.stroke(); }); };
  let topX=cx, topY=by0;
  for(let r=0;r<n;r++){ const k=n-r, by=by0-r*st; for(let i=0;i<k;i++) coupe(cx+(i-(k-1)/2)*gw,by); topY=by-st; }
  const bh=gw*1.35, nx=topX+gw*0.08, ny=topY-gw*0.32, an=-2.09;
  g.strokeStyle='#ffe07a'; g.lineWidth=Math.max(1,gw*0.04); g.beginPath(); g.moveTo(nx,ny); g.quadraticCurveTo(nx-gw*0.05,ny+gw*0.15,topX,topY+gw*0.02); g.stroke();
  mz_rot(g,nx+0.87*bh,ny-0.5*bh,an,()=>WZ.flasche(g,0,0,bh,{glas:'#1f4a35',kapsel:'#e8c35a',etikett:'#f2ecd8',etikett2:'#e8c35a'}));
  for(let i=0;i<6;i++) mz_funkel(g,cx+(rnd()-0.5)*n*gw,by0-rnd()*n*st,gw*(0.05+rnd()*0.05),'#fff3c4'); });

/* ---------- Licht, Glueck ---------- */
wareReg('lichterkette',(g,x,y,w,h,rnd,a)=>{ const {S}=mz_m(x,y,w,h);
  mz_nacht(g,x,y,w,h,'#26264e','#05050e'); for(let i=0;i<10;i++) WZ.leucht(g,x+rnd()*w,y+rnd()*h,S*(0.05+rnd()*0.08),a.ac,0.18);
  const rows=Math.max(2,Math.round(h/(S*0.45))), br=S*0.03;
  for(let r=0;r<rows;r++){ const y0=y+h*(r+0.15)/rows, sag=h/rows*0.5, Y=t=>y0+sag*4*t*(1-t)+Math.sin(t*9+r*2)*sag*0.08, X=t=>x-S*0.05+(w+S*0.1)*t;
    g.strokeStyle='#3a5a3a'; g.lineWidth=Math.max(1,S*0.008); g.beginPath(); for(let i=0;i<=40;i++) g.lineTo(X(i/40),Y(i/40)); g.stroke();
    const n=Math.max(5,Math.round(w/(S*0.13))); for(let i=0;i<n;i++){ const t=(i+0.5+(r%2)*0.5)/n; if(t>1) continue; const lx=X(t), ly=Y(t);
      WZ.leucht(g,lx,ly+br*1.3,br*5,a.ac,0.45); g.fillStyle='#2c3a2c'; g.fillRect(lx-br*0.4,ly,br*0.8,br*0.7);
      const gr=g.createRadialGradient(lx-br*0.2,ly+br*1.1,br*0.1,lx,ly+br*1.4,br); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.4,'#fff1c8'); gr.addColorStop(1,a.ac); g.fillStyle=gr;
      g.beginPath(); g.ellipse(lx,ly+br*1.45,br*0.62,br*0.85,0,0,TAU); g.fill(); } } });

wareReg('discokugel',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy}=mz_m(x,y,w,h), R=Math.min(S*0.36,h*0.36), by=cy+h*0.07, F=[a.ac2,'#5ce1ff','#ffe45c','#7cff6b','#ff4a4a'];
  mz_nacht(g,x,y,w,h,'#2a2045','#030308');
  g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<10;i++){ const an=rnd()*TAU, sp=0.05+rnd()*0.06, Ln=Math.max(w,h); g.fillStyle=rgba(F[i%5],0.16); g.beginPath(); g.moveTo(cx,by); g.lineTo(cx+Math.cos(an-sp)*Ln,by+Math.sin(an-sp)*Ln); g.lineTo(cx+Math.cos(an+sp)*Ln,by+Math.sin(an+sp)*Ln); g.fill(); } g.restore();
  for(let i=0;i<30;i++) WZ.kreis(g,x+rnd()*w,y+rnd()*h,S*(0.006+rnd()*0.012),rgba(F[i%5],0.8));
  g.strokeStyle='#bfc4cc'; g.lineWidth=Math.max(1,S*0.012); g.setLineDash([S*0.02,S*0.012]); g.beginPath(); g.moveTo(cx,y); g.lineTo(cx,by-R); g.stroke(); g.setLineDash([]);
  const P=(la,lo)=>[cx+R*Math.cos(la)*Math.sin(lo),by+R*Math.sin(la)], rows=12, Lx=-0.45, Ly=-0.55, Lz=0.7;
  g.lineWidth=Math.max(0.5,R*0.012); g.strokeStyle='rgba(0,0,0,.45)';
  for(let i=0;i<rows;i++){ const la0=-PI/2+i*PI/rows, la1=la0+PI/rows, lm=(la0+la1)/2, cols=Math.max(4,Math.round(2*rows*Math.cos(lm)));
    for(let j=0;j<cols;j++){ const lo0=-PI/2+j*PI/cols, lo1=lo0+PI/cols, lo=(lo0+lo1)/2, nx=Math.cos(lm)*Math.sin(lo), ny=Math.sin(lm), nz=Math.cos(lm)*Math.cos(lo);
      const d=Math.max(0,nx*Lx+ny*Ly+nz*Lz), v=Math.round(Math.min(255,35+d*170+rnd()*70)), tint=rnd()<0.1;
      g.fillStyle=tint?F[(i+j)%5]:`rgb(${v},${v},${Math.min(255,v+12)})`; const p=[P(la0,lo0),P(la0,lo1),P(la1,lo1),P(la1,lo0)];
      g.beginPath(); p.forEach(q=>g.lineTo(q[0],q[1])); g.closePath(); g.fill(); g.stroke(); } }
  const sh=g.createRadialGradient(cx-R*0.3,by-R*0.35,R*0.2,cx,by,R); sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(0.75,'rgba(0,0,0,.1)'); sh.addColorStop(1,'rgba(0,0,0,.6)'); g.fillStyle=sh; g.beginPath(); g.arc(cx,by,R,0,TAU); g.fill();
  [[-0.4,-0.45,0.16],[0.15,-0.6,0.1],[-0.55,0.1,0.09],[0.35,0.2,0.07]].forEach(([u,v,s])=>{ WZ.leucht(g,cx+u*R,by+v*R,R*s*2.2,'#ffffff',0.6); mz_funkel(g,cx+u*R,by+v*R,R*s); }); });

function mz_klee(g,cx,cy,r,f){ const gr=g.createRadialGradient(cx-r*0.4,cy-r*0.5,r*0.1,cx,cy,r*1.8); gr.addColorStop(0,WZ.hell(f,0.4)); gr.addColorStop(1,WZ.dunkel(f,0.35));
  for(let k=0;k<4;k++) mz_rot(g,cx,cy,k*PI/2+PI/4,()=>{ WZ.herz(g,0,-r*0.9,r,gr); g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=Math.max(0.6,r*0.06); g.beginPath(); g.moveTo(0,-r*0.1); g.lineTo(0,-r*1.0); g.stroke(); });
  WZ.kreis(g,cx,cy,r*0.12,WZ.dunkel(f,0.3)); }
function mz_feger(g,cx,cy,s){ const k=s;
  WZ.schatten(g,cx,cy+k*0.44,k*0.3,k*0.06,0.4);
  g.strokeStyle='#a0703a'; g.lineWidth=k*0.035; [-0.06,0.08].forEach(o=>{ g.beginPath(); g.moveTo(cx-k*0.36+o*k,cy+k*0.42); g.lineTo(cx-k*0.1+o*k,cy-k*0.42); g.stroke(); });
  g.lineWidth=k*0.025; for(let i=1;i<7;i++){ const t=i/7; g.beginPath(); g.moveTo(cx-k*0.42+t*k*0.26,cy+k*0.42-t*k*0.84); g.lineTo(cx-k*0.28+t*k*0.26,cy+k*0.42-t*k*0.84); g.stroke(); }
  g.fillStyle='#16161c'; g.fillRect(cx-k*0.1,cy+k*0.22,k*0.08,k*0.2); g.fillRect(cx+k*0.03,cy+k*0.22,k*0.08,k*0.2);
  const gr=g.createLinearGradient(cx-k*0.2,0,cx+k*0.2,0); gr.addColorStop(0,'#3a3a46'); gr.addColorStop(1,'#0c0c10'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(cx-k*0.13,cy-k*0.08); g.lineTo(cx+k*0.13,cy-k*0.08); g.lineTo(cx+k*0.18,cy+k*0.26); g.lineTo(cx-k*0.18,cy+k*0.26); g.closePath(); g.fill();
  for(let i=0;i<3;i++){ WZ.kreis(g,cx-k*0.05,cy-k*0.02+i*k*0.08,k*0.018,'#ffd23f'); WZ.kreis(g,cx+k*0.05,cy-k*0.02+i*k*0.08,k*0.018,'#ffd23f'); }
  g.strokeStyle='#ffffff'; g.lineWidth=k*0.02; g.beginPath(); g.moveTo(cx-k*0.08,cy-k*0.08); g.lineTo(cx,cy-k*0.02); g.lineTo(cx+k*0.08,cy-k*0.08); g.stroke();
  WZ.kugel(g,cx,cy-k*0.17,k*0.1,'#f2c3a0','#fff0e0'); WZ.kreis(g,cx-k*0.035,cy-k*0.18,k*0.012,'#222'); WZ.kreis(g,cx+k*0.035,cy-k*0.18,k*0.012,'#222');
  g.strokeStyle='#8a3a2a'; g.lineWidth=k*0.01; g.beginPath(); g.arc(cx,cy-k*0.15,k*0.04,0.3,PI-0.3); g.stroke(); WZ.ellipse(g,cx+k*0.05,cy-k*0.13,k*0.02,k*0.012,'rgba(0,0,0,.35)');
  WZ.ellipse(g,cx,cy-k*0.255,k*0.15,k*0.035,'#111'); g.fillStyle='#16161c'; g.fillRect(cx-k*0.09,cy-k*0.43,k*0.18,k*0.18); WZ.ellipse(g,cx,cy-k*0.43,k*0.09,k*0.02,'#2a2a34'); g.fillStyle='#e63b2e'; g.fillRect(cx-k*0.09,cy-k*0.31,k*0.18,k*0.03); }
function mz_schwein(g,cx,cy,s){ const k=s, pink='#ff9ec2';
  WZ.schatten(g,cx,cy+k*0.26,k*0.4,k*0.07,0.4);
  g.fillStyle=WZ.dunkel(pink,0.25); [-0.2,-0.06,0.1,0.22].forEach(o=>{ WZ.rr(g,cx+o*k-k*0.04,cy+k*0.08,k*0.08,k*0.17,k*0.03); g.fill(); });
  g.strokeStyle=WZ.dunkel(pink,0.2); g.lineWidth=k*0.02; g.beginPath(); for(let i=0;i<=30;i++){ const t=i/30*TAU*1.3; g.lineTo(cx+k*0.34+Math.cos(t)*k*0.04*(1-i/40)+i*k*0.002,cy-k*0.06+Math.sin(t)*k*0.04); } g.stroke();
  WZ.kugel(g,cx+k*0.05,cy,k*0.29,pink,'#ffe8f0');
  WZ.kugel(g,cx-k*0.24,cy-k*0.06,k*0.17,pink,'#fff0f5');
  g.fillStyle=WZ.dunkel(pink,0.15); [[-0.36,-0.2],[-0.16,-0.24]].forEach(([u,v])=>{ g.beginPath(); g.moveTo(cx+u*k,cy+v*k); g.lineTo(cx+(u+0.05)*k,cy+(v-0.1)*k); g.lineTo(cx+(u+0.1)*k,cy+(v+0.02)*k); g.fill(); });
  WZ.ellipse(g,cx-k*0.34,cy,k*0.07,k*0.055,'#ff7aa8'); WZ.kreis(g,cx-k*0.36,cy,k*0.012,'#8a2a4a'); WZ.kreis(g,cx-k*0.32,cy,k*0.012,'#8a2a4a');
  WZ.kreis(g,cx-k*0.27,cy-k*0.1,k*0.018,'#222'); WZ.kreis(g,cx-k*0.19,cy-k*0.11,k*0.018,'#222');
  mz_klee(g,cx-k*0.36,cy+k*0.1,k*0.045,'#2f9e57'); }
wareReg('glueckssymbole',(g,x,y,w,h,rnd,a)=>{ const B=mz_drei(x,y,w,h);
  mz_feger(g,B[0].x,B[0].y,B[0].s);
  g.strokeStyle='#2a7a3a'; g.lineWidth=B[1].s*0.035; g.lineCap='round'; g.beginPath(); g.moveTo(B[1].x,B[1].y); g.quadraticCurveTo(B[1].x+B[1].s*0.1,B[1].y+B[1].s*0.3,B[1].x+B[1].s*0.25,B[1].y+B[1].s*0.4); g.stroke();
  WZ.leucht(g,B[1].x,B[1].y,B[1].s*0.5,'#ffffff',0.35); mz_klee(g,B[1].x,B[1].y,B[1].s*0.22,'#3fc060'); mz_schwein(g,B[2].x,B[2].y,B[2].s);
  for(let i=0;i<5;i++) mz_funkel(g,x+rnd()*w,y+rnd()*h,Math.min(w,h)*0.03,'#ffe9a0'); });

wareReg('gluecksklee',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), s=Math.min(h*0.95,w*0.9), by=cy+s*0.46, tw=s*0.5, th=s*0.36, tt=by-th;
  WZ.schatten(g,cx,by,tw*0.65,tw*0.12,0.45);
  const st=[]; for(let i=0;i<8;i++){ const u=(i/7-0.5), px=cx+u*tw*1.3+(rnd()-0.5)*s*0.05, py=tt-s*0.2-Math.cos(u*2.6)*s*0.16+(rnd()-0.5)*s*0.06; st.push([px,py,i]); }
  st.sort((p,r)=>p[1]-r[1]); g.strokeStyle='#3a8a3a'; g.lineWidth=Math.max(1,s*0.015); st.forEach(p=>{ g.beginPath(); g.moveTo(cx+(p[0]-cx)*0.3,tt+s*0.02); g.quadraticCurveTo(p[0],tt,p[0],p[1]); g.stroke(); });
  st.forEach(p=>mz_klee(g,p[0],p[1],s*0.075,p[2]%2?'#2f9e57':'#3fb866'));
  const lk=st[3]; WZ.kugel(g,lk[0]+s*0.04,lk[1]-s*0.02,s*0.035,'#e8231e','#ffb0a0'); WZ.kreis(g,lk[0]+s*0.04,lk[1]-s*0.05,s*0.015,'#111'); WZ.kreis(g,lk[0]+s*0.03,lk[1]-s*0.01,s*0.008,'#111'); WZ.kreis(g,lk[0]+s*0.055,lk[1]-s*0.015,s*0.008,'#111');
  const gr=g.createLinearGradient(cx-tw/2,0,cx+tw/2,0); gr.addColorStop(0,'#e08a5a'); gr.addColorStop(0.35,'#c8643a'); gr.addColorStop(1,'#7a3418'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(cx-tw/2,tt+th*0.18); g.lineTo(cx+tw/2,tt+th*0.18); g.lineTo(cx+tw*0.38,by); g.lineTo(cx-tw*0.38,by); g.fill();
  WZ.ellipse(g,cx,tt+th*0.02,tw*0.47,tw*0.07,'#3a2416'); g.fillStyle=gr; WZ.rr(g,cx-tw*0.55,tt,tw*1.1,th*0.22,th*0.05); g.fill();
  g.fillStyle=a.ac2; g.fillRect(cx-tw*0.47,tt+th*0.48,tw*0.94,th*0.12);
  const bx=cx, byy=tt+th*0.54; g.fillStyle=WZ.dunkel(a.ac2,0.2); [-1,1].forEach(sg=>{ g.beginPath(); g.moveTo(bx,byy); g.lineTo(bx+sg*tw*0.2,byy-th*0.14); g.lineTo(bx+sg*tw*0.2,byy+th*0.14); g.fill(); g.beginPath(); g.moveTo(bx,byy); g.lineTo(bx+sg*tw*0.1,byy+th*0.32); g.lineTo(bx+sg*tw*0.02,byy+th*0.34); g.fill(); }); WZ.kreis(g,bx,byy,th*0.06,a.ac2);
  if(q>1.4){ [-1,1].forEach(sg=>{ const mx=cx+sg*Math.min(w*0.34,s*0.75), my=by-s*0.06; WZ.schatten(g,mx,my+s*0.06,s*0.12,s*0.03,0.35); const mg=g.createRadialGradient(mx-s*0.03,my-s*0.03,0,mx,my,s*0.09); mg.addColorStop(0,'#fff3b0'); mg.addColorStop(0.5,'#e2b23a'); mg.addColorStop(1,'#8a6414'); g.fillStyle=mg; g.beginPath(); g.ellipse(mx,my,s*0.09,s*0.07,0,0,TAU); g.fill(); WZ.txt(g,sg<0?'1':'2',mx,my,s*0.1,s*0.08,WFNT.rund,'#8a6414'); }); } });

/* ---------- Geraete ---------- */
wareReg('fonduegeraet',(g,x,y,w,h,rnd,a)=>{ const {S,cx,q}=mz_m(x,y,w,h);
  const pr=Math.min(w*0.3,h*0.27,S*0.42), by=y+h*0.93, bh=pr*0.3, ph=pr*0.9, top=by-bh-ph, ry=pr*0.28;
  if(q>1.6){ [-1,1].forEach(sg=>{ const sx=cx+sg*Math.min(w*0.36,pr*2.5), sy=by-pr*0.35; WZ.schale(g,sx,sy,pr*0.55,pr*0.16,'#f4f1ea',sg<0?'#e8c88a':'#b0402a');
    for(let i=0;i<6;i++){ const ux=sx+(rnd()-0.5)*pr*0.7, uy=sy+(rnd()-0.5)*pr*0.15-pr*0.05, z=pr*0.12; g.fillStyle=sg<0?'#f0d49a':'#a8302a'; g.fillRect(ux-z/2,uy-z/2,z,z*0.8); g.fillStyle=sg<0?'#c89a5a':'#7a1a14'; g.fillRect(ux-z/2,uy+z*0.25,z,z*0.12); } }); }
  WZ.schatten(g,cx,by,pr*1.4,pr*0.25,0.5);
  g.fillStyle=mz_metall(g,cx-pr*1.1,0,cx+pr*1.1,0,'#3a3d44'); WZ.rr(g,cx-pr*1.1,by-bh,pr*2.2,bh,bh*0.3); g.fill(); WZ.kreis(g,cx+pr*0.8,by-bh*0.5,bh*0.28,'#1a1a1a'); WZ.kreis(g,cx-pr*0.8,by-bh*0.5,bh*0.12,'#ff3a2a'); WZ.leucht(g,cx-pr*0.8,by-bh*0.5,bh*0.5,'#ff3a2a',0.6);
  g.fillStyle='#16181c'; WZ.rr(g,cx+pr*0.85,top+ph*0.25,pr*0.7,ph*0.16,ph*0.08); g.fill();
  const gr=g.createLinearGradient(cx-pr,0,cx+pr,0); gr.addColorStop(0,'#e0484a'); gr.addColorStop(0.3,'#ff8a7a'); gr.addColorStop(0.5,'#c8202a'); gr.addColorStop(1,'#5a080c'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(cx-pr,top); g.bezierCurveTo(cx-pr,top+ph*0.8,cx-pr*0.8,top+ph,cx,top+ph); g.bezierCurveTo(cx+pr*0.8,top+ph,cx+pr,top+ph*0.8,cx+pr,top); g.closePath(); g.fill();
  WZ.ellipse(g,cx,top,pr,ry,'#c8cdd5'); const og=g.createRadialGradient(cx-pr*0.3,top-ry*0.3,0,cx,top,pr); og.addColorStop(0,'#ffd27a'); og.addColorStop(1,'#a8641a'); WZ.ellipse(g,cx,top,pr*0.86,ry*0.8,og);
  const n=q>1.2?7:6, Lf=Math.min(top-y-h*0.05,S*0.85);
  for(let i=0;i<n;i++){ const t=i/(n-1), an=-PI/2+(t-0.5)*(q>1?1.6:1.2), sx=cx+(t-0.5)*pr*1.2, sy=top+ry*0.2-Math.abs(t-0.5)*ry*0.6, ex=sx+Math.cos(an)*Lf*(0.85+(i%2)*0.12), ey=sy+Math.sin(an)*Lf*(0.85+(i%2)*0.12);
    g.lineCap='round'; g.strokeStyle='#d8dde4'; g.lineWidth=Math.max(1,S*0.012); g.beginPath(); g.moveTo(sx,sy); g.lineTo(ex,ey); g.stroke();
    const hx=sx+(ex-sx)*0.68, hy=sy+(ey-sy)*0.68; g.strokeStyle=['#ff4a4a','#ffd23f','#5ce1ff','#7cff6b','#ff4fd8','#ff7a1c','#b06cff'][i]; g.lineWidth=Math.max(2,S*0.03); g.beginPath(); g.moveTo(hx,hy); g.lineTo(ex,ey); g.stroke(); WZ.kreis(g,ex,ey,S*0.022,g.strokeStyle); }
  g.strokeStyle='#e8ecf2'; g.lineWidth=Math.max(1,pr*0.05); g.beginPath(); g.ellipse(cx,top,pr*0.98,ry,0,0.05,PI-0.05); g.stroke();
  g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(cx-pr*0.75,top+ph*0.15,pr*0.12,ph*0.6);
  for(let i=0;i<3;i++){ const sx=cx+(i-1)*pr*0.5; g.strokeStyle='rgba(255,255,255,.3)'; g.lineWidth=Math.max(1,S*0.012); g.beginPath(); g.moveTo(sx,top-ry); g.bezierCurveTo(sx-pr*0.2,top-ry-pr*0.3,sx+pr*0.2,top-ry-pr*0.5,sx,top-ry-pr*0.8); g.stroke(); } });

function mz_raclette(g,cx,cy,dw,rnd){ const pt=cy-dw*0.17, d=dw*0.14, bt=pt+d+dw*0.06, bh=dw*0.2;
  WZ.schatten(g,cx,bt+bh+dw*0.06,dw*0.6,dw*0.07,0.45);
  g.fillStyle='#0e0f12'; [-0.4,0.4].forEach(o=>g.fillRect(cx+o*dw-dw*0.025,bt+bh-dw*0.01,dw*0.05,dw*0.05));
  g.fillStyle=mz_metall(g,0,bt,0,bt+bh,'#2a2d33'); WZ.rr(g,cx-dw*0.44,bt,dw*0.88,bh,dw*0.02); g.fill();
  g.fillStyle='#55585e'; [-0.38,0.38].forEach(o=>g.fillRect(cx+o*dw-dw*0.015,pt+d,dw*0.03,bt-pt-d));
  const HF=['#e63b2e','#ffd23f','#1b5fa8','#2f9e57'];
  for(let k=0;k<4;k++){ const px=cx-dw*0.315+k*dw*0.21, sy=bt+bh*0.4, ex=px+(k-1.5)*dw*0.04, ey=bt+bh+dw*0.13;
    g.fillStyle='#1a1b1f'; g.fillRect(px-dw*0.085,sy-bh*0.12,dw*0.17,bh*0.28);
    g.strokeStyle='#8a9099'; g.lineWidth=dw*0.012; g.beginPath(); g.moveTo(px,sy+bh*0.1); g.lineTo(ex,ey); g.stroke(); g.strokeStyle=HF[k]; g.lineWidth=dw*0.022; g.lineCap='round'; g.beginPath(); g.moveTo(px+(ex-px)*0.6,sy+bh*0.1+(ey-sy-bh*0.1)*0.6); g.lineTo(ex,ey); g.stroke();
    if(k!==2){ g.fillStyle='#ffcf3a'; g.beginPath(); g.ellipse(px,sy-bh*0.1,dw*0.08,bh*0.12,0,PI,TAU); g.fill(); g.fillRect(px-dw*0.05,sy-bh*0.12,dw*0.02,bh*0.3); g.fillRect(px+dw*0.03,sy-bh*0.12,dw*0.015,bh*0.22); WZ.kreis(g,px-dw*0.02,sy-bh*0.15,dw*0.008,'#d8901a'); } }
  g.fillStyle='#1c1d21'; g.beginPath(); g.moveTo(cx-dw*0.5,pt+d); g.lineTo(cx+dw*0.5,pt+d); g.lineTo(cx+dw*0.5,pt+d+dw*0.03); g.lineTo(cx-dw*0.5,pt+d+dw*0.03); g.fill();
  const tg=g.createLinearGradient(0,pt,0,pt+d); tg.addColorStop(0,'#2e3036'); tg.addColorStop(1,'#4a4d55'); g.fillStyle=tg; g.beginPath(); g.moveTo(cx-dw*0.42,pt); g.lineTo(cx+dw*0.42,pt); g.lineTo(cx+dw*0.5,pt+d); g.lineTo(cx-dw*0.5,pt+d); g.closePath(); g.fill();
  g.strokeStyle='rgba(0,0,0,.45)'; g.lineWidth=Math.max(1,dw*0.006); for(let i=1;i<12;i++){ const t=i/12; g.beginPath(); g.moveTo(cx-dw*0.42+t*dw*0.84,pt); g.lineTo(cx-dw*0.5+t*dw,pt+d); g.stroke(); }
  const W=[[-0.3,0.4,0],[-0.12,0.6,1],[0.08,0.35,0],[0.26,0.62,2],[0.34,0.3,1],[-0.36,0.75,2]];
  W.forEach(([u,v,art])=>{ const fx=cx+u*dw, fy=pt+v*d;
    if(art===0){ mz_rot(g,fx,fy,0.15,()=>{ g.fillStyle='#a8402a'; WZ.rr(g,-dw*0.07,-dw*0.02,dw*0.14,dw*0.04,dw*0.02); g.fill(); g.strokeStyle='#5a1a0a'; g.lineWidth=Math.max(1,dw*0.006); for(let j=-1;j<=1;j++){ g.beginPath(); g.moveTo(j*dw*0.03-dw*0.008,-dw*0.018); g.lineTo(j*dw*0.03+dw*0.008,dw*0.018); g.stroke(); } }); }
    else if(art===1){ WZ.ellipse(g,fx,fy,dw*0.04,dw*0.022,'#d8c8b0'); WZ.ellipse(g,fx,fy-dw*0.005,dw*0.03,dw*0.014,'#8a6a4a'); }
    else { WZ.ellipse(g,fx,fy,dw*0.035,dw*0.018,rnd()<0.5?'#e63b2e':'#ffcf3a'); WZ.ellipse(g,fx+dw*0.04,fy+dw*0.004,dw*0.03,dw*0.016,'#3fa83a'); } }); }
wareReg('raclettegeraet',(g,x,y,w,h,rnd,a)=>{ const {cx,cy,q}=mz_m(x,y,w,h);
  if(q>1.6){ const dw=Math.min(w*0.62,h*1.45); mz_raclette(g,cx-w*0.13,cy,dw,rnd);
    const kx=x+w*0.86, ky=cy+dw*0.14, ks=Math.min(w*0.2,h*0.5); WZ.schatten(g,kx,ky+ks*0.3,ks*0.6,ks*0.1,0.35);
    g.fillStyle='#f0c860'; g.beginPath(); g.moveTo(kx-ks*0.5,ky+ks*0.2); g.lineTo(kx+ks*0.45,ky+ks*0.3); g.lineTo(kx+ks*0.45,ky); g.lineTo(kx-ks*0.5,ky-ks*0.08); g.fill();
    g.fillStyle='#ffe08a'; g.beginPath(); g.moveTo(kx-ks*0.5,ky-ks*0.08); g.lineTo(kx+ks*0.45,ky); g.lineTo(kx+ks*0.3,ky-ks*0.3); g.fill();
    g.fillStyle='#b8762a'; g.beginPath(); g.moveTo(kx+ks*0.45,ky); g.lineTo(kx+ks*0.3,ky-ks*0.3); g.lineTo(kx+ks*0.36,ky-ks*0.3); g.lineTo(kx+ks*0.5,ky); g.lineTo(kx+ks*0.5,ky+ks*0.3); g.lineTo(kx+ks*0.45,ky+ks*0.3); g.fill();
    [[-0.3,0.42],[0.05,0.48]].forEach(([u,v])=>WZ.kugel(g,kx+u*ks,ky+v*ks,ks*0.1,'#d8b060','#fff3c0')); }
  else if(q<0.8){ const dw=Math.min(w*0.94,h*0.9); mz_raclette(g,cx,y+h*0.36,dw,rnd); const ks=Math.min(w*0.5,h*0.25), kx=cx, ky=y+h*0.84; WZ.schatten(g,kx,ky+ks*0.3,ks*0.6,ks*0.1,0.35); g.fillStyle='#f0c860'; g.beginPath(); g.moveTo(kx-ks*0.5,ky+ks*0.2); g.lineTo(kx+ks*0.45,ky+ks*0.3); g.lineTo(kx+ks*0.45,ky); g.lineTo(kx-ks*0.5,ky-ks*0.08); g.fill(); g.fillStyle='#ffe08a'; g.beginPath(); g.moveTo(kx-ks*0.5,ky-ks*0.08); g.lineTo(kx+ks*0.45,ky); g.lineTo(kx+ks*0.3,ky-ks*0.3); g.fill(); }
  else mz_raclette(g,cx,cy,Math.min(w*0.94,h*1.5),rnd); });

function mz_pfanne(g,L,hf,inhalt,rnd){ const pw=L*0.5, ph=L*0.4, p0=L-pw;
  g.fillStyle='#9aa0a8'; g.fillRect(L*0.25,-L*0.02,p0-L*0.22,L*0.04);
  g.fillStyle=mz_metall(g,0,-L*0.05,0,L*0.05,'#2a2c31'); WZ.rr(g,0,-L*0.05,L*0.32,L*0.1,L*0.05); g.fill(); WZ.kreis(g,L*0.07,0,L*0.028,hf);
  g.fillStyle='rgba(0,0,0,.3)'; WZ.rr(g,p0+L*0.025,-ph/2+L*0.035,pw,ph,ph*0.15); g.fill();
  g.fillStyle=mz_metall(g,0,-ph/2,0,ph/2,'#4a4d55'); WZ.rr(g,p0,-ph/2,pw,ph,ph*0.15); g.fill(); g.fillStyle='#24262b'; WZ.rr(g,p0+pw*0.08,-ph*0.38,pw*0.84,ph*0.76,ph*0.1); g.fill();
  g.fillStyle=hf; g.fillRect(p0-L*0.01,-ph*0.12,L*0.02,ph*0.24);
  if(inhalt>0){ g.fillStyle='#ffcf3a'; WZ.rr(g,p0+pw*0.1,-ph*0.34,pw*0.8,ph*0.68,ph*0.15); g.fill(); g.fillStyle='#ffe58a'; WZ.rr(g,p0+pw*0.18,-ph*0.26,pw*0.4,ph*0.2,ph*0.1); g.fill(); for(let j=0;j<5;j++) WZ.kreis(g,p0+pw*(0.2+rnd()*0.6),(rnd()-0.5)*ph*0.5,ph*0.05,'#d8901a');
    g.fillStyle='#ffcf3a'; g.beginPath(); g.moveTo(p0+pw*0.3,ph*0.36); g.quadraticCurveTo(p0+pw*0.36,ph*0.62,p0+pw*0.42,ph*0.36); g.fill(); }
  if(inhalt>1) WZ.kugel(g,p0+pw*0.62,-ph*0.02,ph*0.2,'#e8c070','#fff3c0'); }
wareReg('raclettezubehoer',(g,x,y,w,h,rnd,a)=>{ const {S,cx,q}=mz_m(x,y,w,h), HF=['#e63b2e','#ffd23f','#5ce1ff','#7cff6b','#ff4fd8'], n=q>1.3?5:4, tm=q>1.3?1.05:0.55;
  if(q<0.8){ const k=4, L=Math.min(w*0.92,h/k*2.1); for(let i=0;i<k;i++){ const sg=i%2?1:-1; mz_rot(g,cx+sg*L*0.48,y+h*(i+0.5)/k,(sg>0?PI:0)+sg*0.12,()=>mz_pfanne(g,L,HF[i],[1,0,2,1][i],rnd)); } return; }
  const ox=cx, oy=y+h*0.97, L=Math.min(h*0.9,w*0.47/(Math.sin(tm)+0.22));
  for(let i=0;i<n;i++){ const an=-PI/2+(i/(n-1)-0.5)*2*tm; mz_rot(g,ox+Math.cos(an)*L*0.1,oy+Math.sin(an)*L*0.1,an,()=>mz_pfanne(g,L*0.9,HF[i],[1,0,2,1,0][i],rnd)); }
  mz_rot(g,cx,y+h*0.88,-0.12,()=>{ const sl=Math.min(S*0.9,w*0.55); g.fillStyle='rgba(0,0,0,.3)'; WZ.rr(g,-sl/2+sl*0.02,-sl*0.02,sl,sl*0.1,sl*0.03); g.fill();
    g.fillStyle=mz_metall(g,0,-sl*0.06,0,sl*0.06,'#c8945a'); WZ.rr(g,-sl/2,-sl*0.035,sl*0.6,sl*0.07,sl*0.035); g.fill(); g.beginPath(); g.moveTo(sl*0.08,-sl*0.035); g.lineTo(sl*0.5,-sl*0.08); g.lineTo(sl*0.5,sl*0.08); g.lineTo(sl*0.08,sl*0.035); g.fill(); }); });

/* ---------- Schutz ---------- */
function mz_ohr(g,cx,cy,s){ const k=s;
  const gr=g.createLinearGradient(cx-k*0.3,cy-k*0.4,cx+k*0.3,cy+k*0.4); gr.addColorStop(0,'#ffd8bd'); gr.addColorStop(1,'#c8845e'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(cx-k*0.16,cy-k*0.24); g.bezierCurveTo(cx-k*0.1,cy-k*0.46,cx+k*0.3,cy-k*0.5,cx+k*0.33,cy-k*0.12); g.bezierCurveTo(cx+k*0.36,cy+k*0.12,cx+k*0.18,cy+k*0.2,cx+k*0.14,cy+k*0.34); g.bezierCurveTo(cx+k*0.1,cy+k*0.48,cx-k*0.1,cy+k*0.48,cx-k*0.12,cy+k*0.3); g.bezierCurveTo(cx-k*0.2,cy+k*0.1,cx-k*0.2,cy-k*0.05,cx-k*0.16,cy-k*0.24); g.fill();
  g.strokeStyle='#b06a48'; g.lineWidth=k*0.035; g.lineCap='round'; g.beginPath(); g.moveTo(cx-k*0.06,cy-k*0.24); g.bezierCurveTo(cx+k*0.05,cy-k*0.36,cx+k*0.25,cy-k*0.3,cx+k*0.22,cy-k*0.08); g.bezierCurveTo(cx+k*0.2,cy+k*0.06,cx+k*0.08,cy+k*0.12,cx+k*0.06,cy+k*0.24); g.stroke();
  WZ.ellipse(g,cx+k*0.02,cy-k*0.02,k*0.07,k*0.09,'#7a3a24');
  mz_stoepsel(g,cx-k*0.02,cy-k*0.02,k*0.22,-2.6,'#ffd23f'); }
function mz_stoepsel(g,x,y,len,an,f){ mz_rot(g,x,y,an,()=>{ const r=len*0.32;
  const gr=g.createLinearGradient(0,-r,0,r); gr.addColorStop(0,WZ.hell(f,0.55)); gr.addColorStop(0.4,f); gr.addColorStop(1,WZ.dunkel(f,0.45)); g.fillStyle=gr;
  g.beginPath(); g.moveTo(0,-r*0.85); g.lineTo(len-r,-r); g.arc(len-r,0,r,-PI/2,PI/2); g.lineTo(0,r*0.85); g.arc(0,0,r*0.85,PI/2,PI*1.5); g.fill();
  g.fillStyle='rgba(0,0,0,.12)'; for(let i=0;i<10;i++) g.fillRect(len*((i*0.37)%1)*0.85,((i*0.61)%1-0.5)*r*1.4,Math.max(0.6,len*0.03),Math.max(0.6,len*0.03)); }); }
wareReg('gehoerschutz',(g,x,y,w,h,rnd,a)=>{ const B=mz_zwei(x,y,w,h), O=B[0], P=B[1], s=P.s;
  WZ.leucht(g,O.x,O.y,O.s*0.55,'#ffffff',0.35); mz_ohr(g,O.x,O.y,O.s*0.95);
  WZ.schatten(g,P.x,P.y+s*0.32,s*0.4,s*0.08,0.3);
  g.strokeStyle='#1b5fa8'; g.lineWidth=Math.max(1,s*0.02); g.beginPath(); g.moveTo(P.x-s*0.08,P.y-s*0.14); g.bezierCurveTo(P.x-s*0.05,P.y+s*0.1,P.x+s*0.15,P.y+s*0.05,P.x+s*0.12,P.y-s*0.17); g.stroke();
  mz_stoepsel(g,P.x-s*0.08,P.y-s*0.14,s*0.3,-2.5,'#ffd23f'); mz_stoepsel(g,P.x+s*0.12,P.y-s*0.17,s*0.3,-0.6,'#ffd23f');
  mz_stoepsel(g,P.x-s*0.32,P.y+s*0.22,s*0.3,-0.2,'#7cff6b'); mz_stoepsel(g,P.x+s*0.06,P.y+s*0.28,s*0.3,0.35,'#7cff6b'); });

wareReg('schutzbrille',(g,x,y,w,h,rnd,a)=>{ if(h>w*1.3){ mz_brille(g,x,y,w,h*0.5,rnd,a,false); mz_brille(g,x,y+h*0.5,w,h*0.5,rnd,a,true); } else mz_brille(g,x,y,w,h,rnd,a,true); });
function mz_brille(g,x,y,w,h,rnd,a,funke){ const {cx,cy}=mz_m(x,y,w,h), gw=Math.min(w*0.92,h*1.75), gh=gw*0.42, t=cy-gh*0.45;
  WZ.schatten(g,cx,t+gh*1.15,gw*0.45,gh*0.12,0.35);
  g.fillStyle='#1f3550'; [-1,1].forEach(s=>{ g.beginPath(); g.moveTo(cx+s*gw*0.45,t+gh*0.08); g.lineTo(cx+s*gw*0.5,t+gh*0.16); g.lineTo(cx+s*gw*0.43,t+gh*0.78); g.lineTo(cx+s*gw*0.39,t+gh*0.66); g.fill(); });
  const pfad=()=>{ g.beginPath(); g.moveTo(cx-gw*0.47,t+gh*0.08); g.quadraticCurveTo(cx,t-gh*0.14,cx+gw*0.47,t+gh*0.08); g.quadraticCurveTo(cx+gw*0.52,t+gh*0.62,cx+gw*0.36,t+gh*0.95); g.quadraticCurveTo(cx+gw*0.2,t+gh*1.06,cx+gw*0.1,t+gh*0.9); g.quadraticCurveTo(cx,t+gh*0.55,cx-gw*0.1,t+gh*0.9); g.quadraticCurveTo(cx-gw*0.2,t+gh*1.06,cx-gw*0.36,t+gh*0.95); g.quadraticCurveTo(cx-gw*0.52,t+gh*0.62,cx-gw*0.47,t+gh*0.08); g.closePath(); };
  pfad(); g.fillStyle='rgba(190,225,255,.38)'; g.fill(); g.save(); pfad(); g.clip();
  g.fillStyle='rgba(255,255,255,.45)'; [[0.08,0.06],[0.3,0.03]].forEach(([o,b])=>{ g.beginPath(); g.moveTo(cx-gw*0.5+gw*o,t+gh*1.1); g.lineTo(cx-gw*0.5+gw*(o+b),t+gh*1.1); g.lineTo(cx-gw*0.5+gw*(o+b+0.25),t-gh*0.2); g.lineTo(cx-gw*0.5+gw*(o+0.25),t-gh*0.2); g.fill(); });
  const rg=g.createLinearGradient(0,t+gh*0.6,0,t+gh*1.05); rg.addColorStop(0,'rgba(255,255,255,0)'); rg.addColorStop(1,'rgba(255,255,255,.35)'); g.fillStyle=rg; g.fillRect(cx-gw/2,t,gw,gh*1.1); g.restore();
  pfad(); g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=Math.max(1,gw*0.012); g.stroke();
  g.lineCap='round'; g.strokeStyle='#1f3550'; g.lineWidth=gw*0.05; g.beginPath(); g.moveTo(cx-gw*0.46,t+gh*0.1); g.quadraticCurveTo(cx,t-gh*0.12,cx+gw*0.46,t+gh*0.1); g.stroke();
  g.strokeStyle=a.ac2; g.lineWidth=gw*0.012; g.beginPath(); g.moveTo(cx-gw*0.4,t+gh*0.06); g.quadraticCurveTo(cx,t-gh*0.14,cx+gw*0.4,t+gh*0.06); g.stroke();
  for(let i=0;i<4;i++){ WZ.kreis(g,cx-gw*0.43+i*gw*0.015,t+gh*(0.35+i*0.1),gw*0.006,'#1f3550'); WZ.kreis(g,cx+gw*0.43-i*gw*0.015,t+gh*(0.35+i*0.1),gw*0.006,'#1f3550'); }
  if(!funke) return; const fx=cx-gw*0.22, fy=t+gh*0.42; WZ.leucht(g,fx,fy,gw*0.12,'#ffd23f',0.8); mz_funkel(g,fx,fy,gw*0.05,'#fff6c0');
  g.strokeStyle='#ffd23f'; g.lineWidth=Math.max(1,gw*0.008); for(let i=0;i<6;i++){ const an=-PI*0.9+i*0.3, r0=gw*0.04, r1=gw*(0.1+rnd()*0.06); g.beginPath(); g.moveTo(fx+Math.cos(an)*r0,fy+Math.sin(an)*r0); g.lineTo(fx+Math.cos(an)*r1,fy+Math.sin(an)*r1); g.stroke(); } }

function mz_spraydose(g,cx,by,ch,f,kopf,deko){ const cw=ch*0.36, top=by-ch*0.8;
  WZ.schatten(g,cx,by,cw*0.8,cw*0.18,0.4);
  const gr=g.createLinearGradient(cx-cw/2,0,cx+cw/2,0); gr.addColorStop(0,WZ.dunkel(f,0.25)); gr.addColorStop(0.2,WZ.hell(f,0.45)); gr.addColorStop(0.45,f); gr.addColorStop(1,WZ.dunkel(f,0.55)); g.fillStyle=gr;
  g.beginPath(); g.moveTo(cx-cw/2,by-cw*0.06); g.lineTo(cx-cw/2,top); g.quadraticCurveTo(cx-cw/2,top-cw*0.35,cx-cw*0.18,top-cw*0.38); g.lineTo(cx+cw*0.18,top-cw*0.38); g.quadraticCurveTo(cx+cw/2,top-cw*0.35,cx+cw/2,top); g.lineTo(cx+cw/2,by-cw*0.06); g.quadraticCurveTo(cx,by+cw*0.06,cx-cw/2,by-cw*0.06); g.fill();
  if(deko) deko(cw,top);
  const sh=g.createLinearGradient(cx-cw/2,0,cx+cw/2,0); sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(0.2,'rgba(255,255,255,.3)'); sh.addColorStop(0.35,'rgba(255,255,255,0)'); sh.addColorStop(1,'rgba(0,0,0,.3)'); g.fillStyle=sh; g.fillRect(cx-cw/2,top,cw,by-top-cw*0.06);
  const mt=mz_metall(g,cx-cw/2,0,cx+cw/2,0,'#c9ced6'); g.fillStyle=mt; g.fillRect(cx-cw/2,by-cw*0.12,cw,cw*0.07);
  const kt=top-cw*0.38; g.fillRect(cx-cw*0.2,kt-cw*0.08,cw*0.4,cw*0.1);
  g.fillStyle=mz_metall(g,cx-cw*0.25,0,cx+cw*0.25,0,kopf); WZ.rr(g,cx-cw*0.24,kt-cw*0.42,cw*0.48,cw*0.36,cw*0.08); g.fill(); WZ.kreis(g,cx+cw*0.22,kt-cw*0.26,cw*0.05,'#111');
  return {nx:cx+cw*0.26,ny:kt-cw*0.26,cw}; }
wareReg('feuerloescher',(g,x,y,w,h,rnd,a)=>{ const {S,q}=mz_m(x,y,w,h), breit=q>1.15;
  const ch=breit?Math.min(h*0.82,w*0.7):Math.min(q<0.8?h*0.55:h*0.78,w*1.0), dx=breit?x+w*0.25:x+w*0.3, dby=breit?y+h*0.93:(q<0.8?y+h*0.62:y+h*0.93);
  const fx=breit?x+w*0.8:x+w*0.76, fy=y+h*0.92;
  for(let i=0;i<3;i++) mz_flamme(g,fx+(i-1)*S*0.08,fy-(i===1?S*0.02:0),S*(i===1?0.1:0.07));
  const N=mz_spraydose(g,dx,dby,ch,a.bg1,'#2a2a2a',(cw,top)=>{ g.fillStyle='#ffffff'; g.fillRect(dx-cw/2,top+ch*0.12,cw,ch*0.3); g.fillStyle=a.ac2; g.fillRect(dx-cw/2,top+ch*0.45,cw,ch*0.05);
    const ix=dx, iy=top+ch*0.3; g.save(); g.beginPath(); g.rect(dx-cw/2,top+ch*0.12,cw,ch*0.3); g.clip(); mz_flamme(g,ix,iy+ch*0.07,cw*0.14); g.strokeStyle='#e63b2e'; g.lineWidth=cw*0.07; g.beginPath(); g.arc(ix,iy-ch*0.02,cw*0.28,0,TAU); g.moveTo(ix-cw*0.2,iy-ch*0.02-cw*0.2); g.lineTo(ix+cw*0.2,iy-ch*0.02+cw*0.2); g.stroke(); g.restore(); });
  const dxs=fx-N.nx, dys=fy-S*0.08-N.ny, Ls=Math.hypot(dxs,dys), px=-dys/Ls, py=dxs/Ls;
  for(let i=0;i<55;i++){ const t=0.05+rnd()*0.95, sp=(rnd()-0.5)*t*0.5*Ls; WZ.kreis(g,N.nx+dxs*t+px*sp,N.ny+dys*t+py*sp,S*(0.01+0.045*t*rnd()),`rgba(255,255,255,${0.45+rnd()*0.4})`); } });
wareReg('luftschlangenspray',(g,x,y,w,h,rnd,a)=>{ const {S,cx,q}=mz_m(x,y,w,h), F=[a.ac,a.ac2,'#7cff6b'], K=['#ffd23f','#ff4fa3','#5ce1ff'];
  const ch=Math.min(h*0.55,w/3*2.3), sp=Math.min(w*0.3,ch*0.5), by=y+h*0.95;
  [1,0,2].forEach(i=>{ const dx=cx+(i-1)*sp, db=by-(i===1?0:ch*0.04);
    const N=mz_spraydose(g,dx,db,ch*(i===1?1:0.9),F[i],K[i],(cw,top)=>{ for(let k=0;k<5;k++) WZ.stern(g,dx+((k*0.37)%1-0.5)*cw*0.8,top+ch*(0.15+k*0.12),cw*0.12,'#ffffff'); });
    g.lineCap='round'; g.lineJoin='round'; let px=N.nx, py=N.ny; const pts=[[px,py]]; const tx=(i-1)*0.5;
    for(let k=0;k<9;k++){ px+=(tx*0.6+(rnd()-0.5)*1.4)*S*0.12; py-=(N.ny-y)/9*(0.9+rnd()*0.4); pts.push([px,py]); }
    [[S*0.04,WZ.dunkel(K[(i+1)%3],0.35)],[S*0.028,K[(i+1)%3]]].forEach(([lw,c])=>{ g.lineWidth=lw; g.strokeStyle=c; g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(let k=1;k<pts.length-1;k++) g.quadraticCurveTo(pts[k][0],pts[k][1],(pts[k][0]+pts[k+1][0])/2,(pts[k][1]+pts[k+1][1])/2); g.stroke(); }); }); });

/* ---------- Kopfschmuck, Fotobox, Konfetti ---------- */
function mz_reif(g,cx,cy,s,rnd){ const rx=s*0.38, ry=s*0.3, by=cy+s*0.36, Z='2027';
  for(let i=0;i<4;i++){ const an=PI*(1.22+i*0.187), px=cx+Math.cos(an)*rx, py=by+Math.sin(an)*ry, qx=px+(i-1.5)*s*0.035, qy=py-s*0.16;
    g.strokeStyle='#e8c35a'; g.lineWidth=Math.max(1,s*0.018); g.beginPath(); for(let k=0;k<=10;k++){ const t=k/10; g.lineTo(px+(qx-px)*t+(k%2?1:-1)*s*0.02,py+(qy-py)*t); } g.stroke();
    mz_goldtxt(g,Z[i],qx,qy-s*0.1,s*0.22,s*0.26,WFNT.rund,i%2?'#e2e8f0':'#ffd23f'); }
  g.lineCap='round'; g.strokeStyle='#14141a'; g.lineWidth=s*0.07; g.beginPath(); g.ellipse(cx,by,rx,ry,0,PI*1.05,PI*1.95); g.stroke();
  g.strokeStyle='#5a5a6a'; g.lineWidth=s*0.015; g.beginPath(); g.ellipse(cx,by-s*0.01,rx,ry,0,PI*1.1,PI*1.6); g.stroke();
  for(let i=0;i<25;i++){ const an=PI*(1.05+rnd()*0.9); WZ.kreis(g,cx+Math.cos(an)*rx,by+Math.sin(an)*ry,Math.max(0.5,s*0.006),'rgba(255,255,255,.8)'); } }
function mz_krone(g,cx,cy,s,rnd){ const bw=s*0.75, bh=s*0.2, by=cy+s*0.2, sp=[0.42,0.2,0.48,0.2,0.42];
  WZ.schatten(g,cx,by+bh*0.2,bw*0.55,bh*0.3,0.4);
  g.beginPath(); g.moveTo(cx-bw/2,by); g.quadraticCurveTo(cx,by+bh*0.5,cx+bw/2,by);
  for(let i=4;i>=0;i--){ const px=cx-bw/2+bw*i/4; g.lineTo(px,by-bh-s*sp[i]); if(i>0) g.lineTo(px-bw/8,by-bh*1.0); }
  g.closePath(); g.fillStyle=mz_metall(g,cx-bw/2,by-s*0.5,cx+bw/2,by,'#ffc21a'); g.fill(); g.strokeStyle='#a87a10'; g.lineWidth=Math.max(1,s*0.01); g.stroke();
  for(let i=0;i<5;i++) WZ.kugel(g,cx-bw/2+bw*i/4,by-bh-s*sp[i],s*0.035,'#f4f0ff');
  [['#e63b2e',-0.25],['#1b5fa8',0],['#2f9e57',0.25]].forEach(([f,u])=>WZ.kugel(g,cx+u*bw,by-bh*0.35+Math.abs(u)*bh*0.1,s*0.045,f));
  for(let i=0;i<20;i++) WZ.kreis(g,cx+(rnd()-0.5)*bw,by-rnd()*bh*1.6,Math.max(0.5,s*0.006),'rgba(255,255,255,.85)'); }
wareReg('haarreifen',(g,x,y,w,h,rnd,a)=>{ const B=mz_zwei(x,y,w,h); mz_reif(g,B[0].x,B[0].y,B[0].s,rnd); mz_krone(g,B[1].x,B[1].y,B[1].s,rnd);
  for(let i=0;i<6;i++) mz_funkel(g,x+rnd()*w,y+rnd()*h,Math.min(w,h)*0.03,'#fff6c0'); });

const MZ_REQ=[
  (g,s)=>{ g.fillStyle='#1a1a1a'; g.beginPath(); g.moveTo(0,-s*0.05); g.bezierCurveTo(-s*0.15,-s*0.2,-s*0.38,-s*0.1,-s*0.45,-s*0.2); g.bezierCurveTo(-s*0.42,s*0.08,-s*0.15,s*0.12,0,s*0.0); g.bezierCurveTo(s*0.15,s*0.12,s*0.42,s*0.08,s*0.45,-s*0.2); g.bezierCurveTo(s*0.38,-s*0.1,s*0.15,-s*0.2,0,-s*0.05); g.fill(); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(-s*0.25,-s*0.1,s*0.15,s*0.03); },
  (g,s)=>{ g.fillStyle='#e8231e'; g.beginPath(); g.moveTo(-s*0.4,0); g.bezierCurveTo(-s*0.25,-s*0.22,-s*0.1,-s*0.2,0,-s*0.12); g.bezierCurveTo(s*0.1,-s*0.2,s*0.25,-s*0.22,s*0.4,0); g.bezierCurveTo(s*0.2,s*0.28,-s*0.2,s*0.28,-s*0.4,0); g.fill(); g.strokeStyle='#8a0a0a'; g.lineWidth=s*0.02; g.beginPath(); g.moveTo(-s*0.38,0); g.quadraticCurveTo(0,s*0.06,s*0.38,0); g.stroke(); WZ.ellipse(g,-s*0.1,s*0.1,s*0.1,s*0.03,'rgba(255,255,255,.45)'); },
  (g,s)=>{ g.strokeStyle='#ff4fa3'; g.lineWidth=s*0.08; [-1,1].forEach(k=>{ WZ.rr(g,k*s*0.24-s*0.18,-s*0.15,s*0.36,s*0.3,s*0.1); g.fillStyle='rgba(30,10,40,.75)'; g.fill(); g.stroke(); }); g.beginPath(); g.moveTo(-s*0.06,-s*0.04); g.quadraticCurveTo(0,-s*0.1,s*0.06,-s*0.04); g.stroke(); WZ.ellipse(g,-s*0.3,-s*0.06,s*0.06,s*0.025,'rgba(255,255,255,.5)',-0.5); },
  (g,s)=>{ WZ.ellipse(g,0,s*0.2,s*0.42,s*0.08,'#14141a'); g.fillStyle='#1d1d26'; g.fillRect(-s*0.24,-s*0.35,s*0.48,s*0.55); WZ.ellipse(g,0,-s*0.35,s*0.24,s*0.05,'#2a2a36'); g.fillStyle='#e63b2e'; g.fillRect(-s*0.24,s*0.06,s*0.48,s*0.09); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(-s*0.18,-s*0.3,s*0.06,s*0.45); },
  (g,s)=>{ g.fillStyle='#ffffff'; WZ.rr(g,-s*0.45,-s*0.3,s*0.9,s*0.48,s*0.12); g.fill(); g.beginPath(); g.moveTo(-s*0.2,s*0.15); g.lineTo(-s*0.3,s*0.38); g.lineTo(s*0.0,s*0.15); g.fill(); g.strokeStyle='#1a1a1a'; g.lineWidth=s*0.03; WZ.rr(g,-s*0.45,-s*0.3,s*0.9,s*0.48,s*0.12); g.stroke(); WZ.txt(g,'PROST!',0,-s*0.06,s*0.78,s*0.26,WFNT.rund,'#e63b2e'); },
  (g,s)=>{ g.fillStyle='#1b5fa8'; g.beginPath(); g.moveTo(0,0); g.lineTo(-s*0.4,-s*0.2); g.lineTo(-s*0.4,s*0.2); g.closePath(); g.moveTo(0,0); g.lineTo(s*0.4,-s*0.2); g.lineTo(s*0.4,s*0.2); g.closePath(); g.fill(); WZ.kreis(g,0,0,s*0.08,'#14407a'); for(let i=0;i<6;i++) WZ.kreis(g,(i%2?1:-1)*s*(0.15+(i>>1)*0.08),((i>>1)-1)*s*0.08,s*0.025,'#ffffff'); }
];
wareReg('fotobox',(g,x,y,w,h,rnd,a)=>{ const {S,cx}=mz_m(x,y,w,h), n=MZ_REQ.length, C=mz_raster(x+w*0.03,y+h*0.02,w*0.94,h*0.8,n);
  C.forEach((c,i)=>{ g.strokeStyle='#d9b47a'; g.lineWidth=Math.max(1.5,c.s*0.05); g.lineCap='round'; g.beginPath(); g.moveTo(c.x,c.y); g.lineTo(c.x+(cx-c.x)*0.25,y+h+2); g.stroke(); g.strokeStyle='rgba(0,0,0,.2)'; g.lineWidth=Math.max(0.6,c.s*0.015); g.stroke(); });
  C.forEach((c,i)=>mz_rot(g,c.x,c.y,(rnd()-0.5)*0.4,()=>MZ_REQ[i](g,c.s*0.92))); });

wareReg('streukonfetti',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), G=['#ffd23f','#e2e8f0','#f2c230','#fff3a0'];
  mz_nacht(g,x,y,w,h,'#4a3a14','#140e02');
  for(let i=0;i<Math.round(90*Math.max(w,h)/S);i++){ const px=x+rnd()*w, py=y+rnd()*h, z=S*(0.015+rnd()*0.025), f=G[i%4], t=i%4;
    if(t===0) WZ.stern(g,px,py,z,f); else if(t===1) WZ.kreis(g,px,py,z*0.45,f); else if(t===2) mz_rot(g,px,py,rnd()*TAU,()=>WZ.txt(g,'2027'[i%4],0,0,z*2,z*1.6,WFNT.rund,f)); else mz_funkel(g,px,py,z*0.7,f); }
  const Z='2027', zeile=q>=0.8, dz=zeile?Math.min(w/4.6,h*0.5):Math.min(w/2.4,h/4.8);
  for(let i=0;i<4;i++){ const zx=zeile?cx+(i-1.5)*dz*1.05:cx+(i%2-0.5)*dz*1.1, zy=zeile?cy+(i%2?dz*0.08:-dz*0.08):cy+(Math.floor(i/2)-0.5)*dz*1.15;
    WZ.schatten(g,zx+dz*0.05,zy+dz*0.32,dz*0.4,dz*0.1,0.4); mz_rot(g,zx,zy,(rnd()-0.5)*0.5,()=>mz_goldtxt(g,Z[i],0,0,dz*1.2,dz*1.1,WFNT.rund,i%2?'#e2e8f0':'#ffd23f')); }
  for(let i=0;i<5;i++) mz_funkel(g,x+rnd()*w,y+rnd()*h,S*0.04,'#ffffff'); });

/* ---------- Musik ---------- */
function mz_note(g,x,y,z,f,dop){ g.save(); g.fillStyle=f; g.strokeStyle=f; g.lineWidth=Math.max(1,z*0.12);
  WZ.ellipse(g,x,y,z*0.32,z*0.22,f,-0.4); g.beginPath(); g.moveTo(x+z*0.28,y-z*0.05); g.lineTo(x+z*0.28,y-z*1.1); g.stroke();
  if(dop){ WZ.ellipse(g,x+z*0.75,y-z*0.15,z*0.32,z*0.22,f,-0.4); g.beginPath(); g.moveTo(x+z*1.03,y-z*0.2); g.lineTo(x+z*1.03,y-z*1.25); g.stroke(); g.lineWidth=z*0.22; g.beginPath(); g.moveTo(x+z*0.28,y-z*1.05); g.lineTo(x+z*1.03,y-z*1.2); g.stroke(); }
  else { g.beginPath(); g.moveTo(x+z*0.28,y-z*1.1); g.quadraticCurveTo(x+z*0.7,y-z*0.8,x+z*0.6,y-z*0.4); g.stroke(); }
  g.restore(); }
wareReg('karaoke',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h);
  mz_nacht(g,x,y,w,h,heller(a.bg1,0.25),a.bg2);
  g.save(); g.globalCompositeOperation='lighter'; [[0.2,a.ac],[0.8,a.ac2]].forEach(([u,f])=>{ g.fillStyle=rgba(f,0.14); g.beginPath(); g.moveTo(x+w*u,y); g.lineTo(cx-w*0.3,y+h); g.lineTo(cx+w*0.3,y+h); g.fill(); }); g.restore();
  const an=q<1?1.15:0.6, c=Math.cos(an), s=Math.sin(an), L=Math.min(S*1.7,w*0.95/(c*0.85+0.36),h*0.95/(s*0.85+0.36)), R=L*0.17, hx=cx-c*L*0.42, hy=cy-s*L*0.42;
  const pp=[-s,c];
  [[-1,0.1,0],[1,0.25,1],[-1,0.6,2],[1,0.75,0]].forEach(([sg,t,k],i)=>{ const nx=hx+c*L*t+pp[0]*sg*S*0.32, ny=hy+s*L*t+pp[1]*sg*S*0.32, f=[a.ac,a.ac2,'#ffe45c'][k]; WZ.leucht(g,nx,ny-S*0.05,S*0.12,f,0.4); mz_note(g,nx-S*0.05,ny,S*0.13,f,i%2===1); });
  WZ.schatten(g,hx+c*L*0.6,hy+s*L*0.6+R*0.9,L*0.4,R*0.3,0.35);
  mz_rot(g,hx,hy,an,()=>{ const gr=g.createLinearGradient(0,-R,0,R); gr.addColorStop(0,heller(a.ac2,0.4)); gr.addColorStop(0.35,a.ac2); gr.addColorStop(1,WZ.dunkel(a.ac2,0.6)); g.fillStyle=gr;
    g.beginPath(); g.moveTo(R*0.6,-R*0.82); g.lineTo(L,-R*0.48); g.quadraticCurveTo(L+R*0.25,0,L,R*0.48); g.lineTo(R*0.6,R*0.82); g.closePath(); g.fill();
    g.fillStyle='#1a1a24'; g.fillRect(R*0.75,-R*0.86,R*0.3,R*1.72);
    g.fillStyle='rgba(0,0,0,.35)'; for(let i=0;i<5;i++) WZ.kreis(g,L*0.42+i*R*0.25,-R*0.05,R*0.05,'rgba(0,0,0,.4)');
    [[L*0.6,'#ffffff'],[L*0.7,a.ac]].forEach(([bx,f])=>WZ.kreis(g,bx,-R*0.62+bx*0.04*R/L,R*0.1,f)); });
  const rx=hx+c*R*0.9, ry=hy+s*R*0.9; WZ.leucht(g,rx,ry,R*0.9,a.ac,0.6);
  WZ.kugel(g,hx,hy,R,'#b8bec8'); g.save(); g.beginPath(); g.arc(hx,hy,R,0,TAU); g.clip(); g.strokeStyle='rgba(30,30,40,.45)'; g.lineWidth=Math.max(0.6,R*0.035);
  for(let i=-8;i<=8;i++){ g.beginPath(); g.moveTo(hx-R+i*R*0.25,hy-R); g.lineTo(hx+R+i*R*0.25,hy+R); g.stroke(); g.beginPath(); g.moveTo(hx+R+i*R*0.25,hy-R); g.lineTo(hx-R+i*R*0.25,hy+R); g.stroke(); }
  g.restore(); WZ.leucht(g,hx-R*0.35,hy-R*0.4,R*0.5,'#ffffff',0.5); });

/* ---------- Wachsgiessen, Ballons ---------- */
function mz_wachsLoeffel(g,cx,cy,s){ const tx=cx-s*0.1, ty=cy+s*0.28, tr=s*0.2, th=s*0.1;
  WZ.schatten(g,tx,ty+th,tr*1.3,tr*0.3,0.4);
  WZ.ellipse(g,tx,ty+th,tr,tr*0.3,'#8a9099'); g.fillStyle=mz_metall(g,tx-tr,0,tx+tr,0,'#c8ccd2'); g.fillRect(tx-tr,ty,tr*2,th);
  WZ.ellipse(g,tx,ty,tr,tr*0.3,'#e6e8ec'); WZ.ellipse(g,tx,ty+tr*0.03,tr*0.85,tr*0.24,'#fffaf0');
  g.strokeStyle='#222'; g.lineWidth=Math.max(1,s*0.01); g.beginPath(); g.moveTo(tx,ty); g.lineTo(tx,ty-s*0.03); g.stroke();
  mz_flamme(g,tx,ty-s*0.02,s*0.06);
  const lx=tx, ly=cy-s*0.12, lr=s*0.16;
  g.lineCap='round'; g.strokeStyle=mz_metall(g,lx,ly-s*0.3,lx+s*0.5,ly,'#c9ced6'); g.lineWidth=s*0.045; g.beginPath(); g.moveTo(lx+lr*0.8,ly-lr*0.15); g.quadraticCurveTo(cx+s*0.25,ly-s*0.12,cx+s*0.46,cy-s*0.44); g.stroke();
  g.fillStyle=mz_metall(g,lx-lr,ly-lr,lx+lr,ly+lr,'#c9ced6'); g.beginPath(); g.ellipse(lx,ly,lr,lr*0.55,0,0,TAU); g.fill();
  const wg=g.createRadialGradient(lx-lr*0.3,ly-lr*0.2,0,lx,ly,lr*0.8); wg.addColorStop(0,'#fff6c0'); wg.addColorStop(0.4,'#ffcf3f'); wg.addColorStop(1,'#d8901a'); WZ.ellipse(g,lx,ly+lr*0.03,lr*0.78,lr*0.38,wg);
  WZ.leucht(g,lx,ly,lr*1.3,'#ffb040',0.35); WZ.ellipse(g,lx-lr*0.3,ly-lr*0.05,lr*0.2,lr*0.07,'rgba(255,255,255,.7)'); }
function mz_wachsSchale(g,cx,cy,s,rnd){ const rx=s*0.44, ry=s*0.13, top=cy-s*0.1, bot=cy+s*0.34;
  WZ.schatten(g,cx,bot,rx*1.05,ry*0.6,0.4);
  const body=()=>{ g.beginPath(); g.moveTo(cx-rx,top); g.bezierCurveTo(cx-rx,top+(bot-top)*0.85,cx-rx*0.6,bot,cx,bot); g.bezierCurveTo(cx+rx*0.6,bot,cx+rx,top+(bot-top)*0.85,cx+rx,top); g.ellipse(cx,top,rx,ry,0,0,PI,true); g.closePath(); };
  const wg=g.createLinearGradient(0,top,0,bot); wg.addColorStop(0,'rgba(120,200,255,.75)'); wg.addColorStop(1,'rgba(20,70,160,.9)'); body(); g.fillStyle=wg; g.fill();
  mz_klecks(g,cx-rx*0.4,cy+s*0.16,s*0.09,rnd,'#ffc21a'); mz_klecks(g,cx+rx*0.3,cy+s*0.2,s*0.08,rnd,'#ffc21a');
  WZ.ellipse(g,cx,top+s*0.02,rx*0.96,ry*0.85,'rgba(170,225,255,.85)'); mz_klecks(g,cx+rx*0.05,top+s*0.025,s*0.1,rnd,'#ffd23f');
  g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=Math.max(1,s*0.015); g.beginPath(); g.ellipse(cx,top,rx,ry,0,0,TAU); g.stroke(); body(); g.stroke();
  g.save(); body(); g.clip(); WZ.glanz(g,cx-rx*0.85,top,rx*0.3,bot-top,0.45); g.restore(); }
wareReg('bleigiessen',(g,x,y,w,h,rnd,a)=>{ const B=mz_zwei(x,y,w,h);
  for(let i=0;i<6;i++) mz_funkel(g,x+rnd()*w,y+rnd()*h,Math.min(w,h)*(0.02+rnd()*0.02),i%2?a.ac:a.ac2);
  mz_wachsSchale(g,B[1].x,B[1].y,B[1].s,rnd); mz_wachsLoeffel(g,B[0].x,B[0].y,B[0].s); });

wareReg('ballons',(g,x,y,w,h,rnd,a)=>{ const {S,cx,cy,q}=mz_m(x,y,w,h), F=[a.ac2,'#ff4a4a','#5ce1ff','#7cff6b','#b06cff','#ff9f1c','#ffffff'];
  mz_nacht(g,x,y,w,h,heller(a.bg1,0.3),a.bg2);
  const n=q>1.4||q<0.7?8:7, br=S*0.15;
  for(let i=0;i<n;i++){ const an=-PI/2+(i/n)*TAU+0.3, bx=cx+Math.cos(an)*w*0.34, by=cy+Math.sin(an)*h*0.3-br*0.5; WZ.ballon(g,bx,by,br*(0.85+rnd()*0.3),F[i%F.length]); }
  WZ.konfetti(g,x,y,w,h,24,[a.ac,a.ac2,'#5ce1ff'],S*0.012,rnd);
  const z=mz_goldtxt(g,'2027',cx,cy+h*0.05,w*0.82,Math.min(h*0.45,S*0.62),WFNT.rund,a.ac);
  [[-0.32,-0.25],[0.3,-0.3],[0.05,0.3]].forEach(([u,v])=>mz_funkel(g,cx+u*z*2,cy+h*0.05+v*z,z*0.12)); });
})();

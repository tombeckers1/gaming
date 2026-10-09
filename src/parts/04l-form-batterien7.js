/* =========================================================
   Verpackungen der Batterie-Runde (09.10., Daten 02j, Effekte 14z3):
   die elf neuen Batterien. Stil wie 04i (Runde 4): rundum bedruckt
   (Effektbild bis an den Rand, Schriftzug mit Metallverlauf, Schuss-
   Badge, Infozeile, F2/CE), oben genau so viele Rohrmuendungen wie Schuss,
   jede Batterie mit eigener Bauform (Block, Treppe, Verbund auf Platte).
   Am Handy hoechstens rund 550 Dreiecke (themen.js VERPACKUNG).
   ========================================================= */
(function(){
if(typeof VP_FORM==='undefined'||typeof window==='undefined'||!window.VP_WERK) return;
const W_=window.VP_WERK, PI=Math.PI, V=VP_FORM;
const {neu,reg,farbe,kasten,fertig,ecken,gurtX,vbox,vzyl,vkugel,kordel,schleife}=W_;
const hellC=(c,f)=>{ const n=parseInt(String(c).slice(1),16), A=[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.round(v+(255-v)*f)); return `rgb(${A[0]},${A[1]},${A[2]})`; };
const himmel=(g,W,H,o,u)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,o); gr.addColorStop(1,u); g.fillStyle=gr; g.fillRect(0,0,W,H); };
/* Bruch mit Glitzerschweif: Linien, an jeder Spitze ein heller Punkt */
const bruch=(g,x,y,R,n,c1,c2,lw,haeng)=>{ g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<n;i++){ const a=i/n*2*PI, l=R*(0.8+0.2*Math.sin(i*7.1)), ex=x+Math.cos(a)*l*1.05, ey=y+Math.sin(a)*l+(haeng||0)*R;
  g.strokeStyle=i%3?c1:c2; g.lineWidth=lw||1.4; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*l,y+Math.sin(a)*l*0.9,ex,ey); g.stroke();
  g.fillStyle='rgba(255,255,255,.85)'; g.beginPath(); g.arc(ex,ey,Math.max(0.8,(lw||1.4)*0.9),0,2*PI); g.fill(); } g.restore(); };
const funkeln=(g,W,H,r,n,c)=>{ g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<n;i++){ const x=r()*W, y=r()*H*0.75, s=H*(0.006+r()*0.01); g.fillStyle=c||'rgba(255,255,255,.9)'; g.fillRect(x-0.6,y-s,1.2,2*s); g.fillRect(x-s,y-0.6,2*s,1.2); } g.restore(); };
const MOTIV={
  laube(g,W,H,r){ himmel(g,W,H,'#1a1004','#3a2a08'); for(let i=0;i<3;i++) bruch(g,W*(0.2+i*0.3),H*0.2,H*0.2,22,'rgba(255,200,80,.95)','rgba(255,230,150,.9)',1.6,0.9);
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<14;i++){ g.fillStyle='rgba(90,140,255,.95)'; g.beginPath(); g.arc(r()*W,H*(0.15+r()*0.5),H*0.018,0,2*PI); g.fill(); } g.restore();
    g.strokeStyle='#5a3a10'; g.lineWidth=Math.max(2,H*0.02); g.beginPath(); g.moveTo(W*0.05,H); g.quadraticCurveTo(W*0.5,H*0.35,W*0.95,H); g.stroke(); },
  eis(g,W,H,r){ himmel(g,W,H,'#2a1a3a','#0a0a14'); bruch(g,W*0.72,H*0.24,H*0.18,12,'rgba(255,240,90,.95)','rgba(220,220,255,.9)',1.5); bruch(g,W*0.3,H*0.18,H*0.14,12,'rgba(190,100,255,.95)','rgba(255,210,90,.9)',1.4);
    const gx=W*0.22, gy=H*0.62; g.fillStyle='rgba(220,240,255,.5)'; g.beginPath(); g.moveTo(gx-H*0.14,gy); g.lineTo(gx+H*0.14,gy); g.lineTo(gx+H*0.04,gy+H*0.22); g.lineTo(gx-H*0.04,gy+H*0.22); g.fill();
    [['#fff35c',-0.07],['#b85cff',0.07],['#ffffff',0]].forEach(([c,dx],i)=>{ g.fillStyle=c; g.beginPath(); g.arc(gx+dx*H,gy-H*(0.02+i*0.05),H*0.07,0,2*PI); g.fill(); });
    g.fillStyle='#ff2a3a'; g.beginPath(); g.arc(gx,gy-H*0.16,H*0.025,0,2*PI); g.fill(); funkeln(g,W,H,r,30); },
  maerchen(g,W,H,r){ himmel(g,W,H,'#1a0a3a','#06020c'); bruch(g,W*0.25,H*0.22,H*0.17,26,'rgba(255,200,80,.95)','rgba(255,80,80,.9)',1.4,0.5); bruch(g,W*0.72,H*0.18,H*0.15,24,'rgba(120,255,120,.9)','rgba(255,255,255,.9)',1.3);
    funkeln(g,W,H,r,60); g.fillStyle='#120820'; const by=H*0.95; g.fillRect(W*0.35,by-H*0.3,W*0.3,H*0.3);
    for(const [x,h] of [[0.33,0.42],[0.5,0.5],[0.67,0.42]]){ g.fillRect(W*x-W*0.035,by-H*h,W*0.07,H*h); g.beginPath(); g.moveTo(W*x-W*0.05,by-H*h); g.lineTo(W*x,by-H*(h+0.12)); g.lineTo(W*x+W*0.05,by-H*h); g.fill(); }
    g.fillStyle='#ffd23f'; for(let i=0;i<6;i++) g.fillRect(W*(0.38+i*0.045),by-H*0.2,W*0.012,H*0.03); },
  wolf(g,W,H,r){ himmel(g,W,H,'#06103a','#01030c'); g.fillStyle='#e8ecff'; g.beginPath(); g.arc(W*0.72,H*0.32,H*0.17,0,2*PI); g.fill();
    bruch(g,W*0.25,H*0.25,H*0.18,24,'rgba(90,140,255,.95)','rgba(255,255,255,.9)',1.5);
    g.fillStyle='#02040c'; g.beginPath(); g.moveTo(W*0.55,H); g.lineTo(W*0.58,H*0.62); g.lineTo(W*0.64,H*0.5); g.lineTo(W*0.67,H*0.36); g.lineTo(W*0.7,H*0.44); g.lineTo(W*0.74,H*0.48); g.lineTo(W*0.78,H*0.6); g.lineTo(W*0.84,H*0.72); g.lineTo(W*0.9,H); g.fill();
    g.fillRect(0,H*0.9,W,H*0.1); funkeln(g,W,H,r,24,'rgba(255,220,120,.9)'); },
  wueste(g,W,H,r){ himmel(g,W,H,'#2a1404','#c87a2a'); for(let i=0;i<3;i++) bruch(g,W*(0.18+i*0.32),H*0.22,H*0.19,26,'rgba(255,205,90,.95)','rgba(255,240,180,.9)',1.5,0.8);
    g.fillStyle='#8a4a14'; g.beginPath(); g.moveTo(0,H); for(let i=0;i<=10;i++) g.lineTo(W*i/10,H*(0.78+Math.sin(i*1.3)*0.06)); g.lineTo(W,H); g.fill();
    g.strokeStyle='#2a1404'; g.lineWidth=Math.max(2,W*0.01); g.beginPath(); g.moveTo(W*0.82,H*0.85); g.quadraticCurveTo(W*0.8,H*0.65,W*0.84,H*0.55); g.stroke();
    g.fillStyle='#2a1404'; for(let k=0;k<5;k++){ g.beginPath(); g.ellipse(W*0.84+Math.cos(k*1.3)*W*0.04,H*0.56+Math.sin(k*1.3)*H*0.03,W*0.05,H*0.012,k*1.3,0,2*PI); g.fill(); }
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<10;i++){ g.fillStyle=i%2?'rgba(255,60,40,.9)':'rgba(80,120,255,.9)'; g.beginPath(); g.arc(r()*W,H*(0.1+r()*0.4),H*0.016,0,2*PI); g.fill(); } g.restore(); },
  neon(g,W,H,r){ himmel(g,W,H,'#3a0640','#ff6a3a'); bruch(g,W*0.25,H*0.22,H*0.18,26,'rgba(255,60,220,.95)','rgba(255,255,255,.9)',1.5); bruch(g,W*0.7,H*0.2,H*0.16,26,'rgba(60,255,220,.95)','rgba(160,255,60,.9)',1.5);
    g.fillStyle='#120418'; g.fillRect(0,H*0.84,W,H*0.16);
    for(const x of [0.12,0.88]){ g.strokeStyle='#120418'; g.lineWidth=Math.max(2,W*0.012); g.beginPath(); g.moveTo(W*x,H*0.86); g.quadraticCurveTo(W*(x+0.03),H*0.6,W*x,H*0.45); g.stroke();
      g.fillStyle='#120418'; for(let k=0;k<6;k++){ g.beginPath(); g.ellipse(W*x+Math.cos(k)*W*0.05,H*0.46+Math.sin(k)*H*0.03,W*0.06,H*0.012,k,0,2*PI); g.fill(); } } },
  natter(g,W,H,r){ himmel(g,W,H,'#1a1a06','#040402'); bruch(g,W*0.75,H*0.22,H*0.18,22,'rgba(255,200,80,.95)','rgba(255,60,40,.9)',1.5,0.6);
    g.save(); g.globalCompositeOperation='lighter'; g.strokeStyle='rgba(255,200,80,.95)'; g.lineWidth=Math.max(2,H*0.03); g.lineCap='round'; g.beginPath(); g.moveTo(W*0.05,H*0.8);
    for(let i=0;i<=24;i++){ const u=i/24; g.lineTo(W*(0.05+u*0.65),H*(0.8-u*0.35)+Math.sin(u*14)*H*0.07); } g.stroke(); g.restore();
    g.fillStyle='#ffd23f'; g.beginPath(); g.ellipse(W*0.71,H*0.45,H*0.045,H*0.03,-0.4,0,2*PI); g.fill(); g.fillStyle='#e8180c'; g.fillRect(W*0.74,H*0.43,W*0.03,H*0.008); },
  pauke(g,W,H,r){ himmel(g,W,H,'#06102a','#01020a'); g.save(); g.globalCompositeOperation='lighter';
    for(let row=0;row<6;row++) for(let i=0;i<10;i++){ const x=W*(0.06+i*0.095), y=H*(0.08+row*0.08), z=(row%2?i:9-i)/9; g.strokeStyle=`rgba(${row%3===1?'255,200,80':'220,230,255'},${0.5+z*0.5})`; g.lineWidth=1.3; g.beginPath(); g.moveTo(x,y+H*0.06); g.lineTo(x+W*0.02*(row%2?1:-1),y); g.stroke(); }
    g.restore(); bruch(g,W*0.5,H*0.35,H*0.22,30,'rgba(255,200,80,.95)','rgba(255,240,180,.9)',1.8,0.4);
    g.fillStyle='#a8181c'; g.fillRect(W*0.32,H*0.7,W*0.36,H*0.22); g.fillStyle='#e8e0d0'; g.beginPath(); g.ellipse(W*0.5,H*0.7,W*0.18,H*0.04,0,0,2*PI); g.fill();
    g.strokeStyle='#ffd23f'; g.lineWidth=2; for(let i=0;i<7;i++){ g.beginPath(); g.moveTo(W*(0.33+i*0.055),H*0.71); g.lineTo(W*(0.355+i*0.055),H*0.91); g.stroke(); } },
  parade(g,W,H,r){ himmel(g,W,H,'#1a0a3a','#04020c'); const C=['rgba(190,100,255,.95)','rgba(255,240,90,.95)','rgba(255,60,60,.95)','rgba(120,255,90,.95)'];
    for(let i=0;i<4;i++) for(let k=0;k<4;k++){ const x=W*(0.15+i*0.23)+(k%2)*W*0.04, y=H*(0.18+(k>>1)*0.12+(i%2)*0.06); g.save(); g.globalCompositeOperation='lighter';
      for(let j=0;j<14;j++){ const a=j/14*2*PI; g.fillStyle=C[(i+k)%4]; g.fillRect(x+Math.cos(a)*H*0.06-1,y+Math.sin(a)*H*0.06-1,2.4,2.4); } g.restore(); }
    funkeln(g,W,H,r,40); g.fillStyle='#08040c'; g.fillRect(0,H*0.88,W,H*0.12); },
  beete(g,W,H,r){ himmel(g,W,H,'#0a1a2a','#02060a'); const C=[['#ff5ac8','#ff2a3a'],['#ffd23f','#ffb03a'],['#5c8dff','#ffd23f'],['#ffffff','#fff35c'],['#ff3ad8','#fff35c'],['#ffc81a','#8a4a10']];
    C.forEach(([a,b],i)=>{ bruch(g,W*(0.09+i*0.165),H*(0.22+(i%2)*0.08),H*0.11,18,a,b,1.3,0.3);
      const x0=W*i/6; g.fillStyle=a; for(let k=0;k<12;k++){ g.beginPath(); g.arc(x0+r()*W/6,H*(0.72+r()*0.24),H*0.022,0,2*PI); g.fill(); } g.fillStyle='rgba(20,60,20,.9)'; g.fillRect(x0,H*0.97,W/6,H*0.03); }); },
  ragnar(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#1a0402'); gr.addColorStop(0.6,'#5a1004'); gr.addColorStop(1,'#ff6a1a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    bruch(g,W*0.2,H*0.2,H*0.18,24,'rgba(255,200,80,.95)','rgba(255,255,255,.9)',1.6,0.5); bruch(g,W*0.5,H*0.14,H*0.2,30,'rgba(255,60,30,.95)','rgba(255,170,60,.9)',1.6); bruch(g,W*0.8,H*0.22,H*0.17,24,'rgba(90,140,255,.95)','rgba(120,255,90,.9)',1.5);
    g.strokeStyle='#100202'; g.lineWidth=Math.max(3,W*0.018); g.beginPath(); g.moveTo(W*0.5,H); g.lineTo(W*0.5,H*0.6); g.stroke();
    for(let k=0;k<7;k++){ const a=-PI/2+(k-3)*0.38; g.lineWidth=Math.max(1.5,W*0.008); g.beginPath(); g.moveTo(W*0.5,H*0.66); g.quadraticCurveTo(W*0.5+Math.cos(a)*W*0.1,H*0.66+Math.sin(a)*H*0.1,W*0.5+Math.cos(a)*W*0.2,H*0.62+Math.sin(a)*H*0.2); g.stroke(); }
    funkeln(g,W,H,r,30,'rgba(255,200,120,.9)'); }
};
/* ---------- Druckbilder (wie 04i) ---------- */
function vorn(k,motiv,o){ o=o||{}; return (g,W,H)=>{ const a=k.a, rnd=zufallAus(hashStr(k.t+'b7'+(o.id||''))), info=produktInfo(k.t);
  MOTIV[motiv](g,W,H,rnd);
  const vg=g.createLinearGradient(0,H*0.45,0,H); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.6)'); g.fillStyle=vg; g.fillRect(0,0,W,H);
  const gr=g.createLinearGradient(0,H*0.45,0,H*0.75); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.5,hellC(a.ac,0.45)); gr.addColorStop(0.52,a.ac); gr.addColorStop(1,hellC(a.ac,0.2));
  nameText(g,a.title,W*0.52,H*0.57,W*0.9,Math.round(H*(o.gross||0.28)),o.font||FNT.bun,gr,'rgba(10,6,4,.9)',Math.max(3,H*0.035),-0.06);
  nameText(g,(info.schuss?info.schuss+' SCHUSS · ':'')+(o.zeile||a.sub.replace(/^\d+ Schuss /,'').toUpperCase()),W*0.52,H*0.78,W*0.72,Math.round(H*0.07),FNT.bar,'#ffffff','rgba(0,0,0,.7)',2);
  if(info.schuss&&o.badge!==false){ const bw=H*0.22, bx=W-bw*1.25, by=H*0.06; g.fillStyle='#ffffff'; g.fillRect(bx,by,bw,bw*1.05); g.fillStyle=o.badgeFarbe||a.ac2; g.fillRect(bx+bw*0.06,by+bw*0.06,bw*0.88,bw*0.6);
    g.fillStyle='#ffffff'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bar(Math.round(bw*0.5)); g.fillText(String(info.schuss),bx+bw/2,by+bw*0.37);
    g.fillStyle='#1b1b1b'; g.font=`700 ${Math.round(bw*0.17)}px Arial`; g.fillText('SCHUSS',bx+bw/2,by+bw*0.84); }
  g.fillStyle='rgba(255,255,255,.92)'; g.font=`italic 700 ${Math.max(6,Math.round(H*0.06))}px "Barlow Condensed", Arial`; g.textAlign='left'; g.textBaseline='top'; g.fillText(o.marke||'NOVA PYRO',W*0.03,H*0.04);
  g.font=`600 ${Math.max(5,Math.round(H*0.035))}px Arial`; g.fillText(o.reihe||'Showbox',W*0.03,H*0.11);
  g.fillStyle='rgba(4,6,12,.72)'; g.fillRect(0,H*0.87,W,H*0.13); infoZeile(g,W*0.02,H*0.875,W*0.62,H*0.12,info,a.ac,'#ffffff');
  siegel(g,W*0.8,H*0.935,H*0.05,'F'+(P[k.t].cat||2),'#ffffff','#1b1b1b'); g.fillStyle='#ffffff'; g.font=`700 ${Math.max(5,Math.round(H*0.05))}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('CE',W*0.9,H*0.935); }; }
function seite(k,motiv,id){ return (g,W,H)=>{ const a=k.a; MOTIV[motiv](g,W,H,zufallAus(hashStr(k.t+'s7'+(id||''))));
  g.fillStyle='rgba(250,248,240,.9)'; g.fillRect(W*0.08,H*0.62,W*0.84,H*0.3); g.fillStyle='#1b1b1b'; g.font=`700 ${Math.max(5,Math.round(Math.min(W,H)*0.07))}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('F'+(P[k.t].cat||2)+' · CE · NEM',W/2,H*0.69);
  for(let i=0;i<4;i++){ g.fillStyle='rgba(30,30,30,.45)'; g.fillRect(W*0.14,H*(0.75+i*0.04),W*0.72,Math.max(1,H*0.012)); }
  nameText(g,a.title,W/2,H*0.32,W*0.9,Math.round(Math.min(H*0.24,W*0.2)),FNT.bun,'#ffffff','rgba(0,0,0,.7)',2); }; }
function deckel(n,kappe,o){ o=o||{}; return (g,W,H)=>{ g.fillStyle=o.grund||'#2e2e30'; g.fillRect(0,0,W,H);
  let best=null; for(let c=1;c<=n;c++){ const rr=Math.ceil(n/c), s=Math.min(W/c,H/rr); if(!best||s>best.s) best={c,r:rr,s}; }
  const {c,r}=best, cw=W/c, ch=H/r, R=Math.min(cw,ch)*0.46; let k=0;
  for(let j=0;j<r;j++){ const inR=Math.min(c,n-k), x0=(W-inR*cw)/2; for(let i=0;i<inR;i++,k++){ const x=x0+cw*(i+0.5), y=ch*(j+0.5);
    g.fillStyle='#9a9a9e'; g.beginPath(); g.arc(x,y,R,0,2*PI); g.fill(); g.fillStyle='#1c1a1a'; g.beginPath(); g.arc(x,y,R*0.74,0,2*PI); g.fill();
    const kc=typeof kappe==='function'?kappe(k):kappe, tg=g.createRadialGradient(x-R*0.12,y-R*0.12,R*0.05,x,y,R*0.5); tg.addColorStop(0,'#ffffff'); tg.addColorStop(0.35,kc); tg.addColorStop(1,'rgba(0,0,0,.6)'); g.fillStyle=tg; g.beginPath(); g.arc(x,y,R*0.5,0,2*PI); g.fill(); } }
  g.strokeStyle=o.schnur||'#2e8b3a'; g.lineWidth=Math.max(1.5,Math.min(W,H)*0.012); g.beginPath(); g.moveTo(W*0.02,H*0.5); for(let i=0;i<=8;i++) g.lineTo(W*(0.02+i*0.12),H*(0.5+(i%2?0.08:-0.08))); g.stroke(); }; }
function block(k,o){ const id=o.id||'', w=o.w, h=o.h, d=o.d;
  const vo=reg(k,'v'+id,w,h,o.vorn||vorn(k,o.motiv,o)), si=reg(k,'s'+id,d,h,o.seite||seite(k,o.motiv,id)), hi=o.hinten?reg(k,'h'+id,w,h,o.hinten):vo;
  kasten(k,w,h,d,tm(o.x||0,(o.y0||0)+h/2,o.z||0),{pz:vo,nz:hi,px:si,nx:si,py:reg(k,'d'+id,w,d,deckel(o.n,o.kappe,o)),ny:farbe(k,'#2a2018')});
  return {w,h,d,x:o.x||0,z:o.z||0,y0:o.y0||0}; }
function teile(n,fl){ const s=fl.reduce((a,b)=>a+b,0), out=fl.map(f=>Math.floor(n*f/s)); let r=n-out.reduce((a,b)=>a+b,0); for(let i=0;r>0;i=(i+1)%out.length,r--) out[i]++; return out; }
const N=t=>rohrBedarf(t).schuss;
const ring=k=>i=>k[i%k.length];
/* Verbund aus Bloecken auf einer Platte: Raster cols x rows, Hoehen hf */
function verbund(k,t,motiv,o){ const pl=o.platte||0.012, g0=o.fuge||0.01, C=o.cols, R=o.rows||1, w=(k.w-(C-1)*g0-0.006)/C, d=(k.d-(R-1)*g0-0.008)/R, n=teile(N(t),o.anteil||Array(C*R).fill(1));
  vbox(k,k.w,pl,k.d,0,pl/2,0,o.plattenFarbe||'#141414');
  for(let j=0;j<R;j++) for(let i=0;i<C;i++){ const q=j*C+i; block(k,{id:'b'+q,motiv,w,h:(k.h-pl-0.004)*(o.hf?o.hf[q]:1),d,x:(i-(C-1)/2)*(w+g0),z:((R-1)/2-j)*(d+g0),y0:pl,n:n[q],kappe:o.kappe,grund:o.grund,badge:q===(o.badgeAn||0),gross:o.gross||0.26,zeile:q===(o.badgeAn||0)?o.zeile:(o.zeile2||'VERBUNDFEUERWERK'),badgeFarbe:o.badgeFarbe,marke:o.marke,reihe:o.reihe}); }
  return {pl}; }

Object.assign(V,{
  /* Goldlaube: Block mit Goldgurt, obenauf ein kleiner Bogen aus Golddraht */
  b7_goldlaube:t=>{ const k=neu(t), w=k.w-0.004, d=k.d-0.004, h=k.h-0.03, B=block(k,{motiv:'laube',w,h,d,n:N(t),kappe:ring(['#ffd23f','#5c8dff','#ffd23f','#2ec85a']),zeile:'GOLDWEIDEN & BLINKER',badgeFarbe:'#c89a10'});
    gurtX(k,0,B.w,B.h,'#d9b45a',0.014);
    for(let i=0;i<5;i++){ const a=i/4*PI, x=Math.cos(a)*B.w*0.22, y=B.h+Math.sin(a)*0.022; vkugel(k,0.004,5,4,x,y,0,'#ffd23f',1,1,1); }
    return fertig(k); },
  /* Eisbecher: Block, obenauf ein Eisbecher mit drei Kugeln */
  b7_eisbecher:t=>{ const k=neu(t), w=k.w-0.004, d=k.d-0.004, h=k.h-0.06, B=block(k,{motiv:'eis',w,h,d,n:N(t),kappe:ring(['#fff35c','#b85cff','#ffffff']),zeile:'CROSSETTEN & SPITZE',badgeFarbe:'#8a2ad8'});
    const x=B.w*0.3; vzyl(k,0.016,0.006,0.03,8,x,B.h+0.015,0,'#d8ecff'); vkugel(k,0.011,8,5,x-0.007,B.h+0.035,0,'#fff35c',1,1,1); vkugel(k,0.011,8,5,x+0.007,B.h+0.035,0,'#b85cff',1,1,1); vkugel(k,0.004,5,4,x,B.h+0.05,0,'#ff2a3a',1,1,1);
    return fertig(k); },
  /* Maerchenstunde: Block, an den vier Ecken Tuermchen mit Spitzdach */
  b7_maerchen:t=>{ const k=neu(t), w=k.w-0.03, d=k.d-0.03, h=k.h-0.05, B=block(k,{motiv:'maerchen',w,h,d,n:N(t),kappe:ring(['#ffd23f','#ff3a3a','#9cff3a','#ffffff']),zeile:'KRONEN & SCHLEIERKRAUT',badgeFarbe:'#5a2aa8',reihe:'Märchen-Edition'});
    for(const sx of [-1,1]) for(const sz of [-1,1]){ const x=sx*(k.w/2-0.014), z=sz*(k.d/2-0.014); vzyl(k,0.012,0.012,k.h-0.03,8,x,(k.h-0.03)/2,z,'#2a1a4a'); vzyl(k,0.001,0.016,0.03,8,x,k.h-0.015,z,'#ffd23f'); }
    return fertig(k); },
  /* Wolfsnacht: Treppe aus zwei Bloecken (vorn niedrig), nachtblau */
  b7_wolfsnacht:t=>{ const k=neu(t), w=k.w-0.006, d=(k.d-0.01)/2, n=teile(N(t),[1,1.25]);
    block(k,{id:'a',motiv:'wolf',w,h:k.h*0.66,d,z:d/2+0.003,n:n[0],kappe:ring(['#5c8dff','#ffffff','#ffd23f']),zeile:'BLAU, GOLD & BLINKER',grund:'#10141e'});
    block(k,{id:'b',motiv:'wolf',w,h:k.h-0.006,d,z:-d/2-0.003,n:n[1],kappe:ring(['#5c8dff','#ffd23f','#ff3a3a','#2ec85a']),badge:false,zeile:'STUFENBATTERIE',grund:'#10141e',gross:0.24});
    gurtX(k,d/2,k.w,k.h*0.66,'#3a5cff',0.012); return fertig(k); },
  /* Wuestengold: schwerer Block mit Goldecken und Goldbanderole */
  b7_wuestengold:t=>{ const k=neu(t), w=k.w-0.012, d=k.d-0.012, h=k.h-0.008, B=block(k,{motiv:'wueste',w,h,d,n:N(t),kappe:ring(['#ffd23f','#ff3a1a','#3a6aff']),zeile:'KAMURO & GOLD · 30 MM',marke:'SAHARA',reihe:'Gold Edition',badgeFarbe:'#a87a10'});
    ecken(k,B.w,B.h,B.d,'#d9b45a',0.022); W_.banderole(k,{x:0,z:0,w:B.w,d:B.d},B.h*0.12,B.h*0.18,{farbe:'#1a1004',akzent:'#d9b45a'}); return fertig(k); },
  /* Neonkueste: zwei Bloecke nebeneinander auf schwarzer Platte, Neongurt */
  b7_neonkueste:t=>{ const k=neu(t);
    verbund(k,t,'neon',{cols:2,hf:[0.88,1],anteil:[1,1.1],kappe:ring(['#ff3ad8','#3affe0','#9cff3a','#ffd23f']),zeile:'NEON & WIRBELGOLD',badgeAn:1,badgeFarbe:'#d8189a',marke:'BEACH NIGHT',reihe:'Neon Series'});
    gurtX(k,0,k.w,k.h*0.8,'#ff3ad8',0.012); return fertig(k); },
  /* Goldnatter: Block, obenauf windet sich eine goldene Schlange */
  b7_goldnatter:t=>{ const k=neu(t), w=k.w-0.004, d=k.d-0.004, h=k.h-0.02, B=block(k,{motiv:'natter',w,h,d,n:N(t),kappe:ring(['#ffd23f','#ff3a1a','#b85cff','#ff8a1a']),zeile:'SCHLANGEN & SPITZE',badgeFarbe:'#1a1a1a',marke:'VIPER',reihe:'Black & Gold'});
    const pts=[]; for(let i=0;i<=10;i++){ const u=i/10; pts.push([-B.w*0.4+u*B.w*0.8,B.h+0.006,Math.sin(u*PI*3)*B.d*0.25]); } kordel(k,pts,'#ffd23f',0.005);
    vkugel(k,0.008,6,4,pts[10][0],B.h+0.008,pts[10][2],'#ffd23f',1.4,0.7,1); return fertig(k); },
  /* Paukenschlag: breiter, flacher Block mit 295 kleinen Rohren, obenauf
     eine kleine rote Pauke */
  b7_paukenschlag:t=>{ const k=neu(t), w=k.w-0.006, d=k.d-0.006, h=k.h-0.04, B=block(k,{motiv:'pauke',w,h,d,n:N(t),kappe:ring(['#e8f0ff','#ffd23f','#5c8dff','#ffb03a']),zeile:'WELLEN & KNISTER',badgeFarbe:'#a8181c',marke:'THUNDER',reihe:'Rapid Fire'});
    vzyl(k,0.03,0.026,0.03,10,-B.w*0.36,B.h+0.015,0,'#a8181c'); vzyl(k,0.031,0.031,0.003,10,-B.w*0.36,B.h+0.031,0,'#e8e0d0'); return fertig(k); },
  /* Sternparade: vier Batterien (2 x 2) auf einer Platte, verschieden hoch */
  b7_sternparade:t=>{ const k=neu(t);
    verbund(k,t,'parade',{cols:2,rows:2,hf:[0.82,1,0.9,0.74],kappe:ring(['#b85cff','#fff35c','#ff3a3a','#ffffff','#9cff3a']),zeile:'BLINKSTERN-BUKETTS',zeile2:'4 BATTERIEN',badgeAn:1,badgeFarbe:'#7a2ad8',marke:'STARLINE',reihe:'4er Verbund'});
    gurtX(k,0,k.w,k.h*0.7,'#fff35c',0.012); return fertig(k); },
  /* Blumenmeer: sechs Beete - sechs Bloecke (3 x 2) auf gruener Platte */
  b7_blumenmeer:t=>{ const k=neu(t);
    verbund(k,t,'beete',{cols:3,rows:2,hf:[0.86,0.94,0.86,0.92,1,0.92],anteil:[60,60,60,62,62,64],plattenFarbe:'#123a1a',kappe:ring(['#ff5ac8','#ffd23f','#5c8dff','#ffffff','#ff3ad8','#ffc81a']),zeile:'SECHS BLUMENBEETE',zeile2:'2 VERBUNDE',badgeAn:4,badgeFarbe:'#1a8a3a',marke:'GARDEN',reihe:'Doppelverbund'});
    schleife(k,0,k.h-0.01,0,0.05,'#ff5ac8'); return fertig(k); },
  /* Ragnaroek: vier Verbunde verschieden hoch auf schwarzer Platte mit
     Goldkante und rotem Gurt */
  b7_ragnaroek:t=>{ const k=neu(t);
    verbund(k,t,'ragnar',{cols:2,rows:2,platte:0.016,hf:[0.78,1,0.94,0.7],plattenFarbe:'#0a0404',kappe:ring(['#ffd23f','#ff3a1a','#3a6aff','#2ec85a','#ffffff']),grund:'#1a0a08',zeile:'WELTENBRAND · 409 SCHUSS',zeile2:'4 VERBUNDE',badgeAn:1,badgeFarbe:'#c81a0a',marke:'ASGARD',reihe:'Monster Compound'});
    vbox(k,k.w+0.004,0.004,k.d+0.004,0,0.016,0,'#d9b45a'); gurtX(k,0,k.w,k.h*0.66,'#c81a0a',0.016); return fertig(k); }
});
})();

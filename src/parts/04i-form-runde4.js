/* =========================================================
   Verpackungen Runde 4 (07.10.): die zehn neuen Themen-Batterien und
   die zehn neuen Kugelbomben (Daten 02g, Effekte 14y). Stil wie 04h:
   rundum bedruckt (Effektbild bis an den Rand, Schriftzug mit Metall-
   verlauf, Schuss-Badge, Infozeile, F2/CE), oben genau so viele
   Rohrmuendungen wie Schuss. Jede Batterie hat eine eigene Bauform,
   jede Kugel eine eigene Schachtel. Am Handy hoechstens rund 500
   Dreiecke (themen.js VERPACKUNG).
   ========================================================= */
(function(){
if(typeof VP_FORM==='undefined'||typeof window==='undefined'||!window.VP_WERK) return;
const W_=window.VP_WERK, PI=Math.PI, V=VP_FORM;
const {neu,reg,farbe,kasten,druck,fertig,folie,ecken,gurtX,vbox,vzyl,vkugel,vring,kordel,schleife,mantel,kugel,pKraft,pSamt,klar,mit,banderole}=W_;
const hellC=(c,f)=>{ const n=parseInt(String(c).slice(1),16), A=[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.round(v+(255-v)*f)); return `rgb(${A[0]},${A[1]},${A[2]})`; };
/* ---------- Motive (Effektbilder auf Canvas) ---------- */
const himmel=(g,W,H,o,u)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,o); gr.addColorStop(1,u); g.fillStyle=gr; g.fillRect(0,0,W,H); };
const bruch=(g,x,y,R,n,c1,c2,lw,haeng)=>{ g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<n;i++){ const a=i/n*2*PI, l=R*(0.8+0.2*Math.sin(i*7.1));
  g.strokeStyle=i%3?c1:c2; g.lineWidth=lw||1.4; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*l,y+Math.sin(a)*l*0.9,x+Math.cos(a)*l*1.05,y+Math.sin(a)*l+(haeng||0)*R); g.stroke(); } g.restore(); };
const MOTIV={
  korn(g,W,H,r){ himmel(g,W,H,'#0e1e5a','#3a3a20'); for(let i=0;i<3;i++) bruch(g,W*(0.2+i*0.3),H*(0.22+r()*0.1),H*0.16,22,'rgba(110,150,255,.9)','rgba(255,220,90,.8)',1.6);
    for(let i=0;i<40;i++){ const x=r()*W, h=H*(0.25+r()*0.25); g.strokeStyle='#c8a040'; g.lineWidth=Math.max(1,W*0.004); g.beginPath(); g.moveTo(x,H); g.lineTo(x+(r()-0.5)*W*0.03,H-h); g.stroke();
      g.fillStyle='#e8c060'; g.beginPath(); g.ellipse(x,H-h,W*0.006,H*0.03,0,0,2*PI); g.fill(); }
    for(let i=0;i<9;i++){ const x=r()*W, y=H*(0.62+r()*0.3), R=H*0.035; g.fillStyle='#3a6aff'; for(let k=0;k<8;k++){ g.beginPath(); g.arc(x+Math.cos(k*0.785)*R,y+Math.sin(k*0.785)*R,R*0.5,0,2*PI); g.fill(); } g.fillStyle='#1a2a8a'; g.beginPath(); g.arc(x,y,R*0.45,0,2*PI); g.fill(); } },
  klee(g,W,H,r){ himmel(g,W,H,'#2a1a3a','#1a3a10'); bruch(g,W*0.7,H*0.3,H*0.2,30,'rgba(200,160,255,.9)','rgba(255,255,255,.8)',1.4);
    for(let i=0;i<10;i++){ const x=r()*W, y=H*(0.55+r()*0.4), R=H*0.05; for(let k=0;k<26;k++){ const a=r()*2*PI, rr=r()*R; g.fillStyle=k%3?'#c89cff':'#ffffff'; g.beginPath(); g.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,R*0.2,0,2*PI); g.fill(); } }
    for(let i=0;i<5;i++){ const x=W*(0.1+r()*0.5), y=H*(0.15+r()*0.35), s=H*0.05; g.fillStyle='#ffb03a'; g.beginPath(); g.ellipse(x,y,s,s*0.6,0.3,0,2*PI); g.fill(); g.fillStyle='#1a1008'; for(let k=-1;k<=1;k++) g.fillRect(x+k*s*0.5-s*0.1,y-s*0.55,s*0.2,s*1.1);
      g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(x-s*0.2,y-s*0.7,s*0.45,s*0.25,-0.5,0,2*PI); g.fill(); } },
  traube(g,W,H,r){ himmel(g,W,H,'#1a0a2a','#2a1a08'); bruch(g,W*0.75,H*0.25,H*0.18,24,'rgba(255,210,90,.9)','rgba(200,120,255,.8)',1.4,0.4);
    const t=(x,y,s)=>{ for(let row=0;row<5;row++) for(let k=0;k<5-row;k++){ const cx=x+(k-(4-row)/2)*s, cy=y+row*s*0.85, gr=g.createRadialGradient(cx-s*0.15,cy-s*0.15,s*0.05,cx,cy,s*0.5); gr.addColorStop(0,'#d8a0ff'); gr.addColorStop(1,'#4a1a7a'); g.fillStyle=gr; g.beginPath(); g.arc(cx,cy,s*0.5,0,2*PI); g.fill(); } };
    t(W*0.22,H*0.3,H*0.09); t(W*0.5,H*0.45,H*0.06);
    g.fillStyle='#5aa83a'; for(let i=0;i<4;i++){ const x=W*(0.1+i*0.25), y=H*0.2; g.beginPath(); g.moveTo(x,y); for(let k=0;k<5;k++){ const a=-PI/2+k*PI*2/5; g.lineTo(x+Math.cos(a)*H*0.08,y+Math.sin(a)*H*0.06); } g.fill(); } },
  mohn(g,W,H,r){ himmel(g,W,H,'#3a0a06','#1a3a10'); for(let i=0;i<3;i++) bruch(g,W*(0.15+i*0.35),H*0.25,H*0.15,26,'rgba(255,60,40,.9)','rgba(150,255,60,.8)',1.6);
    for(let i=0;i<14;i++){ const x=r()*W, y=H*(0.55+r()*0.4), R=H*(0.04+r()*0.04); g.strokeStyle='#3a7a2a'; g.lineWidth=Math.max(1,W*0.004); g.beginPath(); g.moveTo(x,y); g.lineTo(x,H); g.stroke();
      g.fillStyle='#e8180c'; for(let k=0;k<4;k++){ g.beginPath(); g.ellipse(x+Math.cos(k*PI/2)*R*0.5,y+Math.sin(k*PI/2)*R*0.5,R*0.62,R*0.5,k*PI/2,0,2*PI); g.fill(); } g.fillStyle='#1a1a10'; g.beginPath(); g.arc(x,y,R*0.28,0,2*PI); g.fill(); } },
  winter(g,W,H,r){ himmel(g,W,H,'#0a1a3a','#e8f4ff'); bruch(g,W*0.7,H*0.25,H*0.18,30,'rgba(255,255,255,.9)','rgba(200,230,255,.8)',1.4);
    for(let i=0;i<7;i++){ const x=W*(0.05+i*0.15)+r()*W*0.05, h=H*(0.3+r()*0.25), y=H*0.95; g.fillStyle=i%2?'#0e5a2a':'#0a4a20'; g.beginPath(); g.moveTo(x,y-h); g.lineTo(x-h*0.32,y); g.lineTo(x+h*0.32,y); g.fill();
      g.fillStyle='rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(x,y-h); g.lineTo(x-h*0.1,y-h*0.7); g.lineTo(x+h*0.1,y-h*0.7); g.fill(); }
    for(let i=0;i<80;i++){ g.fillStyle='rgba(255,255,255,.8)'; g.beginPath(); g.arc(r()*W,r()*H*0.8,Math.max(0.8,H*0.006),0,2*PI); g.fill(); }
    g.fillStyle='#e01818'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(W*(0.05+r()*0.25),H*(0.78+r()*0.12),H*0.018,0,2*PI); g.fill(); } },
  fuchsie(g,W,H,r){ himmel(g,W,H,'#2a0630','#0a0410'); bruch(g,W*0.72,H*0.28,H*0.2,28,'rgba(255,60,220,.9)','rgba(160,90,255,.8)',1.5,0.6);
    const bl=(x,y,s)=>{ g.strokeStyle='#3a6a2a'; g.lineWidth=Math.max(1,s*0.05); g.beginPath(); g.moveTo(x,0); g.quadraticCurveTo(x+s*0.3,y*0.5,x,y); g.stroke();
      g.fillStyle='#ff3ad8'; for(const sx of [-1,0,1]){ g.beginPath(); g.ellipse(x+sx*s*0.22,y+s*0.15,s*0.16,s*0.4,sx*0.5,0,2*PI); g.fill(); }
      g.fillStyle='#8a3aff'; g.beginPath(); g.ellipse(x,y+s*0.55,s*0.22,s*0.3,0,0,2*PI); g.fill(); g.strokeStyle='#ffb0f0'; g.lineWidth=Math.max(1,s*0.03); for(const sx of [-1,0,1]){ g.beginPath(); g.moveTo(x,y+s*0.8); g.lineTo(x+sx*s*0.08,y+s*1.25); g.stroke(); } };
    bl(W*0.18,H*0.35,H*0.28); bl(W*0.4,H*0.5,H*0.2); bl(W*0.9,H*0.6,H*0.16); },
  riff(g,W,H,r){ himmel(g,W,H,'#0a3a4a','#02121a'); bruch(g,W*0.75,H*0.25,H*0.18,26,'rgba(255,130,100,.9)','rgba(60,255,220,.8)',1.5);
    const ast=(x,y,a,l,d)=>{ if(d>4||l<2) return; const x2=x+Math.cos(a)*l, y2=y+Math.sin(a)*l; g.strokeStyle=d<2?'#ff7a5a':'#ff9a7a'; g.lineWidth=Math.max(1,(5-d)*H*0.006); g.beginPath(); g.moveTo(x,y); g.lineTo(x2,y2); g.stroke(); ast(x2,y2,a-0.45+r()*0.2,l*0.72,d+1); ast(x2,y2,a+0.45-r()*0.2,l*0.72,d+1); };
    for(let i=0;i<4;i++) ast(W*(0.08+i*0.26),H,-PI/2+(r()-0.5)*0.3,H*0.16,0);
    const fisch=(x,y,s,c)=>{ g.fillStyle=c; g.beginPath(); g.ellipse(x,y,s,s*0.45,0,0,2*PI); g.fill(); g.beginPath(); g.moveTo(x-s*0.8,y); g.lineTo(x-s*1.4,y-s*0.4); g.lineTo(x-s*1.4,y+s*0.4); g.fill(); };
    for(let i=0;i<9;i++) fisch(W*(0.1+r()*0.8),H*(0.35+r()*0.3),H*0.035,i%3?'#ffb04a':'#ffffff'); },
  samt(g,W,H,r){ const gr=g.createRadialGradient(W*0.5,H*0.4,0,W*0.5,H*0.4,W*0.7); gr.addColorStop(0,'#14142a'); gr.addColorStop(1,'#020204'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    bruch(g,W*0.25,H*0.3,H*0.22,16,'rgba(255,200,80,.95)','rgba(255,230,140,.9)',2.2,0.5); bruch(g,W*0.62,H*0.25,H*0.18,30,'rgba(60,90,255,.95)','rgba(255,210,90,.8)',1.4); bruch(g,W*0.88,H*0.4,H*0.14,22,'rgba(255,200,80,.9)','rgba(80,110,255,.8)',1.3,0.3);
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<40;i++){ const x=r()*W, y=r()*H*0.7; g.fillStyle='rgba(255,255,255,.9)'; g.fillRect(x-1,y-H*0.012,2,H*0.024); g.fillRect(x-H*0.012,y-1,H*0.024,2); } g.restore(); },
  meteor(g,W,H,r){ himmel(g,W,H,'#020a06','#0a1a10'); for(let i=0;i<120;i++){ g.fillStyle=`rgba(255,255,255,${r()*0.6})`; g.fillRect(r()*W,r()*H,1.2,1.2); }
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<9;i++){ const x=W*(0.2+r()*0.8), y=H*(0.05+r()*0.5), l=W*(0.12+r()*0.18); const gr=g.createLinearGradient(x,y,x-l,y-l*0.45); gr.addColorStop(0,'rgba(220,255,200,1)'); gr.addColorStop(0.3,'rgba(150,255,60,.7)'); gr.addColorStop(1,'rgba(150,255,60,0)'); g.strokeStyle=gr; g.lineWidth=Math.max(1.5,H*(0.008+r()*0.01)); g.beginPath(); g.moveTo(x,y); g.lineTo(x-l,y-l*0.45); g.stroke();
      g.fillStyle='#ffffff'; g.beginPath(); g.arc(x,y,Math.max(1.5,H*0.012),0,2*PI); g.fill(); } g.restore();
    g.fillStyle='#050a06'; g.beginPath(); g.moveTo(0,H); for(let i=0;i<=12;i++) g.lineTo(W*i/12,H*(0.86+r()*0.08)); g.lineTo(W,H); g.fill(); },
  phoenix(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2a0402'); gr.addColorStop(0.7,'#5a1404'); gr.addColorStop(1,'#ff6a1a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.save(); g.globalCompositeOperation='lighter'; for(const sd of [-1,1]) for(let i=0;i<9;i++){ const a=-PI/2+sd*(0.25+i*0.13), l=H*(0.32+i*0.03); g.strokeStyle=i%2?'rgba(255,190,60,.9)':'rgba(255,70,30,.85)'; g.lineWidth=Math.max(1.5,H*0.012);
      g.beginPath(); g.moveTo(W*0.5,H*0.62); g.quadraticCurveTo(W*0.5+Math.cos(a)*l*1.3,H*0.62+Math.sin(a)*l*0.8,W*0.5+Math.cos(a)*l*1.6,H*0.62+Math.sin(a)*l*0.4); g.stroke(); }
    bruch(g,W*0.5,H*0.25,H*0.16,26,'rgba(255,200,80,.9)','rgba(255,80,30,.9)',1.5,0.5); g.restore();
    for(let i=0;i<50;i++){ g.fillStyle=r()<0.5?'#ffb03a':'#ff3a1a'; g.beginPath(); g.arc(r()*W,H*(0.75+r()*0.25),Math.max(0.8,H*0.008),0,2*PI); g.fill(); } }
};
/* ---------- Druckbilder ---------- */
function vorn(k,motiv,o){ o=o||{}; return (g,W,H)=>{ const a=k.a, rnd=zufallAus(hashStr(k.t+'r4'+(o.id||''))), info=produktInfo(k.t);
  MOTIV[motiv](g,W,H,rnd);
  const vg=g.createLinearGradient(0,H*0.45,0,H); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.6)'); g.fillStyle=vg; g.fillRect(0,0,W,H);
  const gr=g.createLinearGradient(0,H*0.45,0,H*0.75); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.5,hellC(a.ac,0.45)); gr.addColorStop(0.52,a.ac); gr.addColorStop(1,hellC(a.ac,0.2));
  nameText(g,a.title,W*0.52,H*0.57,W*0.9,Math.round(H*(o.gross||0.3)),o.font||FNT.bun,gr,'rgba(10,6,4,.9)',Math.max(3,H*0.035),-0.06);
  nameText(g,(info.schuss?info.schuss+' SCHUSS · ':'')+(o.zeile||a.sub.replace(/^\d+ Schuss /,'').toUpperCase()),W*0.52,H*0.78,W*0.72,Math.round(H*0.07),FNT.bar,'#ffffff','rgba(0,0,0,.7)',2);
  if(info.schuss&&o.badge!==false){ const bw=H*0.22, bx=W-bw*1.25, by=H*0.06; g.fillStyle='#ffffff'; g.fillRect(bx,by,bw,bw*1.05); g.fillStyle=o.badgeFarbe||a.ac2; g.fillRect(bx+bw*0.06,by+bw*0.06,bw*0.88,bw*0.6);
    g.fillStyle='#ffffff'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bar(Math.round(bw*0.5)); g.fillText(String(info.schuss),bx+bw/2,by+bw*0.37);
    g.fillStyle='#1b1b1b'; g.font=`700 ${Math.round(bw*0.17)}px Arial`; g.fillText('SCHUSS',bx+bw/2,by+bw*0.84); }
  g.fillStyle='rgba(255,255,255,.92)'; g.font=`italic 700 ${Math.max(6,Math.round(H*0.06))}px "Barlow Condensed", Arial`; g.textAlign='left'; g.textBaseline='top'; g.fillText(o.marke||'LUMEN',W*0.03,H*0.04);
  g.font=`600 ${Math.max(5,Math.round(H*0.035))}px Arial`; g.fillText(o.reihe||'Naturwelten',W*0.03,H*0.11);
  g.fillStyle='rgba(4,6,12,.72)'; g.fillRect(0,H*0.87,W,H*0.13); infoZeile(g,W*0.02,H*0.875,W*0.62,H*0.12,info,a.ac,'#ffffff');
  siegel(g,W*0.8,H*0.935,H*0.05,'F'+(P[k.t].cat||2),'#ffffff','#1b1b1b'); g.fillStyle='#ffffff'; g.font=`700 ${Math.max(5,Math.round(H*0.05))}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('CE',W*0.9,H*0.935); }; }
function seite(k,motiv,id){ return (g,W,H)=>{ const a=k.a; MOTIV[motiv](g,W,H,zufallAus(hashStr(k.t+'s'+(id||''))));
  g.fillStyle='rgba(250,248,240,.9)'; g.fillRect(W*0.08,H*0.62,W*0.84,H*0.3); g.fillStyle='#1b1b1b'; g.font=`700 ${Math.max(5,Math.round(Math.min(W,H)*0.07))}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('F'+(P[k.t].cat||2)+' · CE · NEM',W/2,H*0.69);
  for(let i=0;i<4;i++){ g.fillStyle='rgba(30,30,30,.45)'; g.fillRect(W*0.14,H*(0.75+i*0.04),W*0.72,Math.max(1,H*0.012)); }
  nameText(g,a.title,W/2,H*0.32,W*0.9,Math.round(Math.min(H*0.24,W*0.2)),FNT.bun,'#ffffff','rgba(0,0,0,.7)',2); }; }
/* Deckel: genau n Muendungen, Kappe in den Farben des Themas, Zuendschnur */
function deckel(n,kappe,o){ o=o||{}; return (g,W,H)=>{ g.fillStyle=o.grund||'#2e2e30'; g.fillRect(0,0,W,H);
  let best=null; for(let c=1;c<=n;c++){ const rr=Math.ceil(n/c), s=Math.min(W/c,H/rr); if(!best||s>best.s) best={c,r:rr,s}; }
  const {c,r}=best, cw=W/c, ch=H/r, R=Math.min(cw,ch)*0.46; let k=0;
  for(let j=0;j<r;j++){ const inR=Math.min(c,n-k), x0=(W-inR*cw)/2; for(let i=0;i<inR;i++,k++){ const x=x0+cw*(i+0.5), y=ch*(j+0.5);
    g.fillStyle='#9a9a9e'; g.beginPath(); g.arc(x,y,R,0,2*PI); g.fill(); g.fillStyle='#1c1a1a'; g.beginPath(); g.arc(x,y,R*0.74,0,2*PI); g.fill();
    const kc=typeof kappe==='function'?kappe(k):kappe, tg=g.createRadialGradient(x-R*0.12,y-R*0.12,R*0.05,x,y,R*0.5); tg.addColorStop(0,'#ffffff'); tg.addColorStop(0.35,kc); tg.addColorStop(1,'rgba(0,0,0,.6)'); g.fillStyle=tg; g.beginPath(); g.arc(x,y,R*0.5,0,2*PI); g.fill(); } }
  g.strokeStyle=o.schnur||'#2e8b3a'; g.lineWidth=Math.max(1.5,Math.min(W,H)*0.012); g.beginPath(); g.moveTo(W*0.02,H*0.5); for(let i=0;i<=8;i++) g.lineTo(W*(0.02+i*0.12),H*(0.5+(i%2?0.08:-0.08))); g.stroke(); }; }
/* bedruckter Rohrblock */
function block(k,o){ const id=o.id||'', w=o.w, h=o.h, d=o.d;
  const vo=reg(k,'v'+id,w,h,o.vorn||vorn(k,o.motiv,o)), si=reg(k,'s'+id,d,h,o.seite||seite(k,o.motiv,id)), hi=o.hinten?reg(k,'h'+id,w,h,o.hinten):vo;
  kasten(k,w,h,d,tm(o.x||0,(o.y0||0)+h/2,o.z||0),{pz:vo,nz:hi,px:si,nx:si,py:reg(k,'d'+id,w,d,deckel(o.n,o.kappe,o)),ny:farbe(k,'#2a2018')});
  return {w,h,d,x:o.x||0,z:o.z||0,y0:o.y0||0}; }
function teile(n,fl){ const s=fl.reduce((a,b)=>a+b,0), out=fl.map(f=>Math.floor(n*f/s)); let r=n-out.reduce((a,b)=>a+b,0); for(let i=0;r>0;i=(i+1)%out.length,r--) out[i]++; return out; }
const N=t=>rohrBedarf(t).schuss;
const ring=k=>i=>k[i%k.length];

Object.assign(V,{
  /* Kornblumen: kleiner Block mit Banderole in Weizengelb, obendrauf ein
     Straeusschen aus drei Kornblumen */
  kornblumen:t=>{ const k=neu(t), w=k.w-0.004, d=k.d-0.004, h=k.h-0.03, B=block(k,{motiv:'korn',w,h,d,n:N(t),kappe:ring(['#5c8dff','#ffd23f','#3a6aff']),zeile:'SOMMERWIESE',reihe:'Kinderfeuerwerk'});
    gurtX(k,-B.d*0.3,B.w,B.h,'#e8c060',0.014);
    for(let i=0;i<3;i++){ const x=-B.w*0.32+i*0.012, z=-B.d*0.3; vzyl(k,0.001,0.001,0.035,4,x,B.h+0.017,z,'#3a7a2a',0,0,(i-1)*0.2); vkugel(k,0.006,6,4,x+(i-1)*0.006,B.h+0.035,z,'#3a6aff',1,0.6,1); }
    return fertig(k); },
  /* Bienenweide: Block mit Bienenwaben-Seiten, auf einem Draht sitzt eine Biene */
  bienenweide:t=>{ const k=neu(t), w=k.w-0.004, d=k.d-0.004, h=k.h-0.045;
    const wabe=(g,W,H)=>{ g.fillStyle='#e89a1a'; g.fillRect(0,0,W,H); const s=Math.max(4,H*0.09); g.strokeStyle='#8a4a08'; g.lineWidth=Math.max(1,s*0.12);
      for(let y=0;y<H+s;y+=s*1.5) for(let x=0;x<W+s;x+=s*1.73){ const ox=x+((y/(s*1.5))%2?s*0.865:0); g.beginPath(); for(let i=0;i<6;i++){ const a=PI/6+i*PI/3; g.lineTo(ox+Math.cos(a)*s*0.95,y+Math.sin(a)*s*0.95); } g.closePath(); g.stroke(); }
      nameText(g,k.a.title,W/2,H*0.35,W*0.9,Math.round(Math.min(H*0.22,W*0.18)),FNT.bun,'#2a1408','rgba(255,220,120,.8)',2); };
    const B=block(k,{motiv:'klee',w,h,d,n:N(t),kappe:ring(['#ffb03a','#b89cff','#ffffff']),seite:wabe,zeile:'SUMMEN & KLEE',badgeFarbe:'#d87a00'});
    vzyl(k,0.001,0.001,0.04,4,B.w*0.3,B.h+0.02,0,'#2a2a2a'); vkugel(k,0.009,8,5,B.w*0.3,B.h+0.042,0,'#ffb03a',1.4,1,1);
    for(const s of [-1,1]) vbox(k,0.012,0.001,0.008,B.w*0.3,B.h+0.05,s*0.007,'#e8f4ff',0,0,0); vbox(k,0.004,0.008,0.008,B.w*0.3+0.004,B.h+0.042,0,'#1a1008');
    return fertig(k); },
  /* Weinlese: Block in einer kleinen Lesekiste aus Holzlatten, vorn ein Traubenschild */
  weinlese:t=>{ const k=neu(t), w=k.w-0.016, d=k.d-0.016, h=k.h-0.006, B=block(k,{motiv:'traube',w,h,d,n:N(t),kappe:ring(['#b85cff','#9cff3a','#7a3aff']),zeile:'TRAUBENBUKETTS',badgeFarbe:'#6a1aa8'});
    const holz='#b8894f', lh=h*0.3;
    for(const s of [-1,1]){ vbox(k,k.w,lh,0.006,0,lh/2,s*(k.d/2-0.003),holz); vbox(k,0.006,lh,k.d,s*(k.w/2-0.003),lh/2,0,holz); vbox(k,k.w,lh*0.35,0.0062,0,lh*0.15,s*(k.d/2-0.003),'#8a6a3a'); }
    return fertig(k); },
  /* Mohnfeld: Treppe in zwei Stufen, vorn niedrig, hinten hoch, rote Papierschleife */
  mohnfeld:t=>{ const k=neu(t), w=k.w-0.006, d=(k.d-0.006)/2, n=teile(N(t),[1,1.2]);
    block(k,{id:'a',motiv:'mohn',w,h:k.h*0.62,d,z:d/2,n:n[0],kappe:ring(['#ff2a1a','#9cff3a']),zeile:'MOHNKAPSELN'});
    const B=block(k,{id:'b',motiv:'mohn',w,h:k.h-0.012,d,z:-d/2,n:n[1],kappe:ring(['#ff2a1a','#ff5a3a','#9cff3a']),badge:false,zeile:'STUFENBATTERIE',gross:0.24});
    schleife(k,0,k.h-0.01,-d/2,0.04,'#e8180c'); return fertig(k); },
  /* Winterwald: Block mit Schneekante oben, an der Seite steht ein Tannenbaum aus Pappe */
  winterwald:t=>{ const k=neu(t), w=k.w-0.05, d=k.d-0.006, h=k.h-0.012, B=block(k,{motiv:'winter',w,h,d,x:0.022,n:N(t),kappe:ring(['#e8f4ff','#2ec85a','#e8f4ff','#e01818']),zeile:'RAUREIF & TANNEN',badgeFarbe:'#0a7a3a'});
    for(let i=0;i<5;i++) vbox(k,B.w/5+0.004,0.008,0.012,B.x-B.w/2+B.w*(i+0.5)/5,B.h-0.002+(i%2)*0.003,B.d/2-0.004,'#f4f8ff');
    const tx=-k.w/2+0.022; vzyl(k,0.001,0.02,k.h*0.55,6,tx,k.h*0.45,0,'#0e6a2a'); vzyl(k,0.001,0.016,k.h*0.4,6,tx,k.h*0.72,0,'#128a34'); vzyl(k,0.004,0.004,k.h*0.18,5,tx,k.h*0.09,0,'#5a3a1a');
    vkugel(k,0.004,5,4,tx,k.h*0.93,0,'#ffd23f',1,1,1);
    return fertig(k); },
  /* Fuchsien: drei Bloecke verschieden hoch auf einer Platte (wie haengende
     Blueten, die mittlere am laengsten), Magentaband */
  fuchsien:t=>{ const k=neu(t), pl=0.01, g0=0.008, w=(k.w-2*g0-0.006)/3, d=k.d-0.012, H=[0.72,1,0.84], n=teile(N(t),[1,1.3,1.1]);
    vbox(k,k.w,pl,k.d,0,pl/2,0,'#1a0614');
    for(let i=0;i<3;i++) block(k,{id:'f'+i,motiv:'fuchsie',w,h:(k.h-pl-0.004)*H[i],d,x:(i-1)*(w+g0),y0:pl,n:n[i],kappe:ring(['#ff3ad8','#9a4aff','#ff8ae8']),badge:i===1,gross:0.26,zeile:i===1?'HÄNGEBLÜTEN':'3 BLÖCKE',badgeFarbe:'#b8188a'});
    gurtX(k,0,k.w,k.h*0.7,'#ff3ad8',0.012); return fertig(k); },
  /* Korallenriff: Zwei-Block-Verbund auf Sandplatte, Tau rundum, an der
     Ecke ein Korallenast */
  korallenriff:t=>{ const k=neu(t), pl=0.012, g0=0.01, w=(k.w-g0-0.006)/2, d=k.d-0.02, n=teile(N(t),[1,1.15]);
    vbox(k,k.w,pl,k.d,0,pl/2,0,'#d8c08a');
    [-1,1].forEach((s,i)=>block(k,{id:'k'+i,motiv:'riff',w,h:(k.h-pl-0.004)*(i?1:0.82),d,x:s*(w/2+g0/2),y0:pl,n:n[i],kappe:ring(['#ff7a5a','#3affe0','#ffffff']),badge:i===1,gross:0.28,zeile:i?'KORALLEN & FISCHE':'2 BLÖCKE · VERBUND',badgeFarbe:'#0a8a8a'}));
    const yh=pl+0.02, D=k.d/2-0.002, W2=k.w/2-0.002; kordel(k,[[-W2,yh,-D],[W2,yh,-D],[W2,yh,D],[-W2,yh,D],[-W2,yh,-D]],'#d8c08a',0.003);
    const cx=k.w/2-0.03, cz=k.d/2-0.012; vzyl(k,0.003,0.004,0.05,5,cx,k.h*0.45+0.02,cz,'#ff7a5a',0,0,0.3); vzyl(k,0.0025,0.003,0.035,5,cx-0.012,k.h*0.45+0.04,cz,'#ff9a7a',0,0,-0.5);
    return fertig(k); },
  /* Schwarzer Samt: schwarzer Block mit Goldecken und Goldbanderole,
     dahinter steht der aufgeklappte Deckel, innen samtblau */
  schwarzersamt:t=>{ const k=neu(t), dz=0.02, w=k.w-0.008, d=k.d-dz-0.008, h=k.h*0.74;
    const B=block(k,{motiv:'samt',w,h,d,z:dz/2,n:N(t),kappe:ring(['#ffd23f','#3a5cff','#f2f5ff']),grund:'#0a0a0e',zeile:'SAMT & GOLD',font:FNT.cin,marke:'NOIR',reihe:'Edition Velours',badgeFarbe:'#1a1a1a',gross:0.26});
    ecken(k,B.w,B.h,B.d,'#d9b45a',0.02);
    W_.banderole(k,{x:0,z:dz/2,w:B.w,d:B.d},B.h*0.08,B.h*0.2,{farbe:'#0a0a0e',akzent:'#d9b45a'});
    const ah=k.h-0.004, samt=reg(k,'samt',w,ah,pSamt('#1a2a8a')), aussen=reg(k,'aus',w,ah,vorn(k,'samt',{id:'aus',zeile:'EDITION VELOURS',font:FNT.cin,marke:'NOIR',badge:false,gross:0.24}));
    mit(k,tm(0,0,-k.d/2+0.006,-0.12,0,0),()=>kasten(k,w,ah,0.006,tm(0,ah/2,0),{pz:samt,nz:aussen,rest:farbe(k,'#0a0a0e')}));
    return fertig(k); },
  /* Meteorschauer: Drei-Block-Treppe schraeg (hinten links hoch, vorn
     rechts niedrig) auf schwarzer Platte, gruene Gurte */
  meteorschauer:t=>{ const k=neu(t), pl=0.012, g0=0.01, w=(k.w-2*g0-0.006)/3, d=k.d-0.014, H=[1,0.82,0.66], n=teile(N(t),[1.2,1,0.85]);
    vbox(k,k.w,pl,k.d,0,pl/2,0,'#08100a');
    for(let i=0;i<3;i++) block(k,{id:'m'+i,motiv:'meteor',w,h:(k.h-pl-0.004)*H[i],d:d*(1-i*0.08),z:-d*i*0.04,x:(i-1)*(w+g0),y0:pl,n:n[i],kappe:ring(['#e8ffe0','#9cff3a','#f2f5ff']),grund:'#101410',badge:i===0,gross:0.28,zeile:i?'3 BLÖCKE · VERBUND':'FEUERKUGELN',badgeFarbe:'#2a8a1a'});
    gurtX(k,-d*0.25,k.w,k.h*0.6,'#4aff2a',0.012); gurtX(k,d*0.25,k.w,k.h*0.55,'#4aff2a',0.012); return fertig(k); },
  /* Phoenix: Vier-Block-Verbund wie ein Vogel mit ausgebreiteten Fluegeln -
     aussen zwei flache Fluegel, innen zwei hohe Bloecke, auf roter Platte
     mit Goldkante und Goldgurt */
  phoenix:t=>{ const k=neu(t), pl=0.014, g0=0.008, w=(k.w-3*g0-0.006)/4, d=k.d-0.014, H=[0.6,1,0.92,0.6], n=teile(N(t),[0.8,1.3,1.3,0.8]);
    vbox(k,k.w,pl,k.d,0,pl/2,0,'#3a0604'); vbox(k,k.w+0.004,0.004,k.d+0.004,0,pl,0,'#d9b45a');
    for(let i=0;i<4;i++) block(k,{id:'p'+i,motiv:'phoenix',w,h:(k.h-pl-0.004)*H[i],d,x:(i-1.5)*(w+g0),y0:pl,n:n[i],kappe:ring(['#ffb03a','#ff3a1a','#ffd23f']),grund:'#201010',badge:i===1,gross:i===1||i===2?0.24:0.3,zeile:i===1?'AUS DER GLUT':i===2?'VERBUNDFEUERWERK':'4 BLÖCKE',badgeFarbe:'#d8281a'});
    gurtX(k,0,k.w,k.h*0.58,'#d9b45a',0.014); return fertig(k); }
});

/* ---------- Kugelbomben: jede in ihrer eigenen Schachtel ---------- */
const kEtikett=(k,motiv,mm,o)=>(g,W,H)=>{ o=o||{}; MOTIV[motiv](g,W,H,zufallAus(hashStr(k.t+'k')));
  const vg=g.createLinearGradient(0,H*0.4,0,H); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.65)'); g.fillStyle=vg; g.fillRect(0,0,W,H);
  nameText(g,k.a.title,W/2,H*0.62,W*0.9,Math.round(Math.min(H*0.2,W*0.16)),o.font||FNT.bun,o.fg||'#ffffff','rgba(0,0,0,.8)',Math.max(2,H*0.02));
  nameText(g,'KUGELBOMBE '+mm+' mm',W/2,H*0.8,W*0.8,Math.round(Math.min(H*0.07,W*0.06)),FNT.bar,k.a.ac,'rgba(0,0,0,.7)',1.5);
  g.fillStyle='rgba(255,255,255,.9)'; g.font=`700 ${Math.max(5,Math.round(H*0.05))}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('F4 · CE · NUR FÜR FACHKUNDIGE',W/2,H*0.93); };
/* rundum: das Etikett vorn und hinten nur ueber den sichtbaren Bogen (ein
   Drittel), dazwischen das Motiv ohne Schrift - sonst laeuft der Name um
   die Rundung (gerendert 07.10.: "ERDISTEL", "UREGEN") */
const rundDruck=(k,motiv,mm)=>(g,W,H)=>{ MOTIV[motiv](g,W,H,zufallAus(hashStr(k.t+'r'))); const vg=g.createLinearGradient(0,H*0.4,0,H); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.6)'); g.fillStyle=vg; g.fillRect(0,0,W,H);
  const bw=W*0.3; for(let q=0;q<2;q++){ const x=W*(0.25+q*0.5)-bw/2; g.save(); g.beginPath(); g.rect(x,0,bw,H); g.clip(); g.translate(x,0); kEtikett(k,motiv,mm)(g,bw,H); g.restore(); } };
Object.assign(MOTIV,{
  distel(g,W,H,r){ himmel(g,W,H,'#1a1a3a','#06060f'); bruch(g,W*0.5,H*0.3,H*0.25,40,'rgba(230,236,255,.95)','rgba(184,92,255,.9)',1.2); g.fillStyle='#b85cff'; g.beginPath(); g.arc(W*0.5,H*0.3,H*0.06,0,2*PI); g.fill(); },
  hummel(g,W,H,r){ himmel(g,W,H,'#3a2a06','#0c0802'); g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<14;i++){ let x=W*0.5, y=H*0.32; g.strokeStyle=i%2?'rgba(255,210,60,.9)':'rgba(240,240,255,.8)'; g.lineWidth=1.3; g.beginPath(); g.moveTo(x,y); const a0=i/14*2*PI;
    for(let s=0;s<14;s++){ const a=a0+Math.sin(s*0.9+i)*0.9; x+=Math.cos(a)*H*0.02; y+=Math.sin(a)*H*0.02; g.lineTo(x,y); } g.stroke(); } g.restore(); },
  blauregen(g,W,H,r){ himmel(g,W,H,'#2a1a5a','#06040f'); for(let i=0;i<9;i++){ const x=W*(0.1+i*0.1), y=H*0.12; for(let j=0;j<10;j++){ g.fillStyle=j%2?'#a88cff':'#6a5cff'; g.beginPath(); g.arc(x+Math.sin(j*0.8+i)*W*0.01,y+j*H*0.035,H*(0.022-j*0.0015),0,2*PI); g.fill(); } } },
  smaragd(g,W,H,r){ himmel(g,W,H,'#063a1a','#010c05'); g.strokeStyle='rgba(42,255,138,.95)'; g.lineWidth=Math.max(2,H*0.02); g.beginPath(); g.ellipse(W*0.5,H*0.3,H*0.2,H*0.12,0.3,0,2*PI); g.stroke(); bruch(g,W*0.5,H*0.3,H*0.07,16,'rgba(255,210,60,.9)','rgba(255,240,150,.9)',1.4); },
  abendrot(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2a0a2a'); gr.addColorStop(0.5,'#c84a10'); gr.addColorStop(1,'#ffb03a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    bruch(g,W*0.5,H*0.3,H*0.26,40,'rgba(255,210,80,.9)','rgba(255,210,80,.9)',1.2); bruch(g,W*0.5,H*0.3,H*0.17,30,'rgba(255,120,30,.9)','rgba(255,120,30,.9)',1.3); bruch(g,W*0.5,H*0.3,H*0.09,20,'rgba(255,40,20,.95)','rgba(255,40,20,.95)',1.4); },
  kometen(g,W,H,r){ himmel(g,W,H,'#1a1a1a','#050505'); g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<16;i++){ const a=i/16*2*PI, l=H*0.28; g.strokeStyle='rgba(255,200,80,.85)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(W*0.5,H*0.32); g.lineTo(W*0.5+Math.cos(a)*l,H*0.32+Math.sin(a)*l); g.stroke();
    g.fillStyle='#ffffff'; g.beginPath(); g.arc(W*0.5+Math.cos(a)*l,H*0.32+Math.sin(a)*l,H*0.014,0,2*PI); g.fill(); } g.restore(); },
  seerose(g,W,H,r){ himmel(g,W,H,'#062a2a','#010c08'); g.fillStyle='#1a6a3a'; g.beginPath(); g.ellipse(W*0.5,H*0.42,W*0.35,H*0.08,0,0,2*PI); g.fill();
    for(let i=0;i<10;i++){ const a=i/10*2*PI; g.fillStyle=i%2?'#ffffff':'#ffc8e0'; g.beginPath(); g.ellipse(W*0.5+Math.cos(a)*W*0.08,H*0.36+Math.sin(a)*H*0.03,W*0.07,H*0.025,a,0,2*PI); g.fill(); } g.fillStyle='#ffd23f'; g.beginPath(); g.arc(W*0.5,H*0.35,H*0.025,0,2*PI); g.fill(); },
  granat(g,W,H,r){ himmel(g,W,H,'#3a0410','#0c0103'); bruch(g,W*0.5,H*0.3,H*0.24,36,'rgba(255,40,70,.95)','rgba(255,170,190,.9)',1.4,0.3);
    for(let i=0;i<40;i++){ const a=r()*2*PI, rr=H*(0.15+r()*0.15); g.fillStyle='#ff4a6a'; g.beginPath(); g.arc(W*0.5+Math.cos(a)*rr,H*0.3+Math.sin(a)*rr+H*0.05,Math.max(1,H*0.008),0,2*PI); g.fill(); } },
  palme(g,W,H,r){ himmel(g,W,H,'#0a1a3a','#3a2a06'); g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<10;i++){ const a=-PI/2+(i-4.5)*0.32, l=H*0.32; g.strokeStyle='rgba(255,200,70,.95)'; g.lineWidth=Math.max(2,H*0.016);
    g.beginPath(); g.moveTo(W*0.5,H*0.3); g.quadraticCurveTo(W*0.5+Math.cos(a)*l,H*0.3+Math.sin(a)*l*0.6,W*0.5+Math.cos(a)*l*1.2,H*0.3+H*0.18); g.stroke(); }
    for(let i=0;i<12;i++){ const a=i/12*2*PI; g.fillStyle='rgba(60,110,255,.95)'; g.beginPath(); g.arc(W*0.5+Math.cos(a)*H*0.12,H*0.3+Math.sin(a)*H*0.08,H*0.012,0,2*PI); g.fill(); } g.restore(); },
  treppe(g,W,H,r){ himmel(g,W,H,'#0a0a2a','#02020a'); [['rgba(255,200,70,.9)',0.7,0.1],['rgba(255,60,40,.9)',0.52,0.12],['rgba(70,110,255,.9)',0.36,0.14],['rgba(230,236,255,.95)',0.17,0.2]].forEach(([c,y,R],i)=>bruch(g,W*(0.5+(i%2?0.06:-0.06)),H*y,H*R,24,c,c,1.3,i===3?0.3:0)); }
});
Object.assign(V,{
  /* Silberdistel 75: Kugel in silberner Folie in einem Klarsichtbecher auf bedrucktem Sockel */
  silberdistel75:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.003, sh=k.h*0.3;
    mantel(k,R,sh,0,'sockel',rundDruck(k,'distel',75),{seg:16}); vring(k,R,0.003,4,16,2*PI,0,sh,0,'#c9ced6',PI/2,0,0);
    const Rk=R*0.82; kugel(k,Rk,0,sh+Rk+0.002,0,{seg:12}); k.klarMat=glassMat; klar(k,new THREE.CylinderGeometry(R,R*0.96,k.h-sh,16,1,true),tm(0,sh+(k.h-sh)/2,0));
    return fertig(k); },
  /* Hummelschwarm 75: sechseckige Wabenschachtel mit Deckel */
  hummelschwarm75:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.002, h=k.h-0.016;
    mantel(k,R,h,0,'wabe',rundDruck(k,'hummel',75),{seg:6}); vzyl(k,R+0.003,R+0.003,0.016,6,0,h+0.008,0,'#2a1408',0,PI/6,0);
    vkugel(k,0.009,8,5,0,h+0.022,0,'#ffb03a',1.4,1,1); vbox(k,0.004,0.008,0.008,0.005,h+0.022,0,'#1a1008'); return fertig(k); },
  /* Blauregen 100: lavendelfarbene Rolle mit Quaste aus violetten Perlen */
  blauregen100:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.006, h=k.h-0.012;
    mantel(k,R,h,0,'rolle',rundDruck(k,'blauregen',100),{seg:18}); vzyl(k,R+0.002,R+0.002,0.012,18,0,h+0.006,0,'#6a5cff');
    kordel(k,[[R*0.6,h+0.012,0],[R+0.006,h-0.01,0],[R+0.008,h*0.55,0]],'#a88cff',0.0015);
    for(let i=0;i<4;i++) vkugel(k,0.006-i*0.0008,6,4,R+0.008,h*0.55-i*0.011,0,i%2?'#a88cff':'#6a5cff',1,1,1);
    return fertig(k); },
  /* Smaragdring 100: gruene Schachtel mit rundem Fenster, darin die Kugel */
  smaragdring100:t=>{ const k=neu(t), w=k.w-0.004, h=k.h-0.004, d=k.d-0.004;
    const front=reg(k,'front',w,h,W_.pLoch(kEtikett(k,'smaragd',100),[{x:0.22,y:0.08,w:0.56,h:0.42,form:'kreis'}],'#d9b45a',0.02));
    k.alpha=true; kasten(k,w,h,d,tm(0,h/2,0),{pz:front,nz:reg(k,'hint',w,h,kEtikett(k,'smaragd',100)),px:reg(k,'seite',d,h,kEtikett(k,'smaragd',100)),nx:'seite',py:farbe(k,'#0a3a1a'),ny:farbe(k,'#0a3a1a')});
    kugel(k,Math.min(w,d)*0.34,0,h*0.7,0,{zuender:false,seg:12}); return fertig(k); },
  /* Abendrot 150: hohe Rolle im Sonnenuntergangsverlauf mit Kraftdeckel */
  abendrot150:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.004, h=k.h-0.03;
    mantel(k,R,h,0,'rolle',rundDruck(k,'abendrot',150),{seg:20});
    mantel(k,R+0.002,0.03,h,'deckel',pKraft({farbe:'#b8925f'}),{seg:20}); druck(k,new THREE.CircleGeometry(R+0.002,20),tm(0,k.h,0,-PI/2,0,0),reg(k,'dt',0.1,0.1,(g,W,H)=>{ pKraft({farbe:'#b8925f'})(g,W,H); g.fillStyle='#c84a10'; g.beginPath(); g.arc(W/2,H/2,W*0.25,0,2*PI); g.fill(); }));
    return fertig(k); },
  /* Kometenschlag 150: Kraftkarton mit Kometen-Stempel und Seilgriff */
  kometenschlag150:t=>{ const k=neu(t), w=k.w-0.004, h=k.h-0.004, d=k.d-0.004;
    const kr=reg(k,'kraft',w,h,(g,W,H)=>{ pKraft({farbe:'#c49a62'})(g,W,H); g.save(); g.translate(W*0.1,H*0.1); kEtikett(k,'kometen',150)(g,W*0.8,H*0.8); g.restore(); g.strokeStyle='#2b1d10'; g.lineWidth=3; g.strokeRect(W*0.1,H*0.1,W*0.8,H*0.8); });
    kasten(k,w,h,d,tm(0,h/2,0),{pz:kr,nz:kr,px:reg(k,'s',d,h,pKraft({farbe:'#b8925f'})),nx:'s',py:reg(k,'top',w,d,pKraft({farbe:'#b8925f'})),ny:farbe(k,'#6a5030')});
    kordel(k,[[-w*0.3,h,0],[-w*0.22,h+0.05,0],[w*0.22,h+0.05,0],[w*0.3,h,0]],'#c8a870',0.003); gurtX(k,0,w,h,'#2b1d10',0.008); return fertig(k); },
  /* Seerose 200: flache runde Dose, Deckel wie ein Seerosenblatt */
  seerose200:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.004, h=k.h-0.02;
    mantel(k,R,h,0,'dose',rundDruck(k,'seerose',200),{seg:22});
    vzyl(k,R+0.006,R+0.006,0.01,22,0,h+0.005,0,'#1a6a3a'); vbox(k,R*0.9,0.0104,0.02,R*0.45,h+0.005,0,'#0a3a1a',0,0.4,0);
    for(let i=0;i<6;i++){ const a=i/6*2*PI; vbox(k,0.03,0.006,0.012,Math.cos(a)*0.02,h+0.014,Math.sin(a)*0.02,i%2?'#ffffff':'#ffc8e0',0,-a,0.2); } vkugel(k,0.008,6,4,0,h+0.018,0,'#ffd23f',1,0.6,1);
    return fertig(k); },
  /* Granatapfel 200: Obstkiste, die Kugel liegt auf rotem Seidenpapier */
  granatapfel200:t=>{ const k=neu(t), H=k.h*0.48;
    const K=W_.kiste(k,{latten:true,H,holz:'#c89a5a',bretter:3,gap:0.016,deckel:false,kern:farbe(k,'#a87a3a'),bt:0.01});
    vbox(k,K.W-0.012,0.01,K.D-0.012,0,H*0.8,0,'#c8102a'); const R=Math.min(K.W,K.D)*0.38; kugel(k,R,0,H*0.8+R*0.9,0,{});
    W_.schild(k,'schild',K.W*0.8,H*0.8,0,H*0.5,K.D/2+0.0005,kEtikett(k,'granat',200)); return fertig(k); },
  /* Riesenpalme 300: Bambusfass mit Seilringen */
  riesenpalme300:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.006, h=k.h-0.03;
    mantel(k,R,h,0,'fass',(g,W,H)=>{ g.fillStyle='#c8a860'; g.fillRect(0,0,W,H); for(let x=0;x<W;x+=W/40){ g.fillStyle='rgba(90,60,20,.35)'; g.fillRect(x,0,1.5,H); } for(let q=0;q<2;q++){ g.save(); g.translate(q*W/2+W*0.07,H*0.15); kEtikett(k,'palme',300)(g,W*0.36,H*0.7); g.restore(); } },{seg:22});
    for(const y of [0.03,h*0.5,h-0.03]) vring(k,R+0.002,0.004,4,22,2*PI,0,y,0,'#8a6a3a',PI/2,0,0);
    vzyl(k,R+0.004,R+0.004,0.03,22,0,h+0.015,0,'#6a4a1a'); return fertig(k); },
  /* Himmelstreppe 300: drei Kartons uebereinander, jeder kleiner - wie eine Treppe in den Himmel */
  himmelstreppe300:t=>{ const k=neu(t); let y=0; const S=[[1,0.42],[0.8,0.32],[0.6,0.26]];
    S.forEach(([f,hf],i)=>{ const w=(k.w-0.004)*f, d=(k.d-0.004)*f, h=k.h*hf-0.002, e=kEtikett(k,'treppe',300);
      kasten(k,w,h,d,tm(0,y+h/2,0),{pz:reg(k,'v'+i,w,h,e),nz:'v'+i,px:reg(k,'s'+i,d,h,e),nx:'s'+i,py:farbe(k,'#0a0a2a'),ny:farbe(k,'#0a0a2a')}); y+=h; });
    return fertig(k); }
});
/* 09.10.: Motive und Etiketten auch fuer die Kugeln der Runde 5 (04j) */
window.R4_VP={MOTIV,kEtikett,rundDruck,himmel,bruch,hellC};
})();

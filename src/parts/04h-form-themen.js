/* =========================================================
   Verpackungen der zehn Themen-Batterien (06.10., Tom: "jede Verpackung
   soll so etwas Einzigartiges haben"; dazu Toms Vorbilder echter
   Batterien: "Grafisch wie hier, hochaufloesend, passende Formen wie in
   echt ... einige Batterien sehen immer noch 0815 aus").
   Wie echte Batterien: der Block ist rundum bedruckt (Effektbild bis an
   den Rand, grosser Schriftzug mit Metallverlauf, Schuss-Badge, kleine
   Infozeile, F2/CE), oben sieht man die Rohrmuendungen - genau so viele
   wie Schuss. Jede Batterie hat eine eigene Bauform nach den Vorbildern:
   Folienblock mit Anhaenger (Tautropfen), Block mit Papp-Falter
   (Zitronenfalter), Block mit Lavendelstrauss und Bast (Lavendelfeld),
   Deckelkarton mit aufgestelltem Deckel (Herbstlaub), Treppe in zwei
   Stufen (Kolibri), Zwei-Block-Verbund mit Mondsiegeln (Vollmond),
   Treppe in drei Stufen mit Seil (Lagune), Block mit Bluetendeckel
   (Sonnenblumen), Drei-Block-Verbund wie Eisschollen (Gletscher) und
   Drei-Block-Verbund als Vulkankegel (Vulkanausbruch).
   Werkzeug aus 04g-form-batterie (VP_WERK). Am Handy hoechstens rund
   500 Dreiecke (04-models Sparaufbau).
   ========================================================= */
(function(){
if(typeof VP_FORM==='undefined'||typeof window==='undefined'||!window.VP_WERK) return;
const W_=window.VP_WERK, PI=Math.PI;
const {neu,reg,farbe,kasten,fertig,folie,ecken,gurtX,lascheSeite,vbox,vzyl,vkugel,vring,kordel,schleife}=W_;
/* ---------- Motive (Effektbilder, Canvas) ---------- */
const MOTIV={
  tau(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#0e2a3a'); gr.addColorStop(1,'#123a26'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let i=0;i<5;i++){ const x=W*(0.15+i*0.18), y=H*(0.12+r()*0.15); g.save(); g.globalCompositeOperation='lighter'; for(let k=0;k<24;k++){ const a=k/24*2*PI, l=H*0.12; g.strokeStyle='rgba(200,255,240,.5)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*l,y+Math.sin(a)*l*0.6,x+Math.cos(a)*l,y+Math.sin(a)*l*0.6+H*0.12); g.stroke(); } g.restore(); }
    for(let i=0;i<26;i++){ const x=r()*W, h=H*(0.35+r()*0.5), b=(r()-0.5)*W*0.08; g.strokeStyle=`rgba(${60+r()*40|0},${150+r()*60|0},${90+r()*40|0},.9)`; g.lineWidth=Math.max(1.5,W*0.006); g.beginPath(); g.moveTo(x,H); g.quadraticCurveTo(x+b*0.3,H-h*0.6,x+b,H-h); g.stroke();
      if(r()<0.6){ const dx=x+b*0.8, dy=H-h*0.86, R=Math.max(2,H*(0.025+r()*0.025)), dg=g.createRadialGradient(dx-R*0.3,dy-R*0.3,R*0.1,dx,dy,R); dg.addColorStop(0,'#ffffff'); dg.addColorStop(0.5,'#c8fff0'); dg.addColorStop(1,'rgba(120,255,210,.15)'); g.fillStyle=dg; g.beginPath(); g.arc(dx,dy,R,0,2*PI); g.fill(); } } },
  falter(g,W,H,r){ const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,'#5a7a1e'); gr.addColorStop(1,'#1e3008'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const fl=(x,y,s,rot)=>{ g.save(); g.translate(x,y); g.rotate(rot); for(const sx of [-1,1]){ g.fillStyle='#fff35c'; g.beginPath(); g.ellipse(sx*s*0.55,-s*0.25,s*0.55,s*0.45,sx*0.5,0,2*PI); g.fill(); g.beginPath(); g.ellipse(sx*s*0.45,s*0.38,s*0.38,s*0.32,-sx*0.4,0,2*PI); g.fill();
        g.fillStyle='#ff9a1e'; g.beginPath(); g.arc(sx*s*0.6,-s*0.2,s*0.08,0,2*PI); g.fill(); }
      g.fillStyle='#3a2a10'; g.fillRect(-s*0.06,-s*0.5,s*0.12,s*1.05); g.restore(); };
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<3;i++){ g.strokeStyle='rgba(255,240,90,.55)'; g.lineWidth=2; g.beginPath(); let x=W*(0.3+i*0.22), y=H; g.moveTo(x,y); for(let k=0;k<14;k++){ x+=(k%2?1:-1)*W*0.02; y-=H*0.05; g.lineTo(x,y); } g.stroke(); } g.restore();
    for(let i=0;i<14;i++){ g.fillStyle=r()<0.5?'#ffffff':'#ffe0f0'; const x=r()*W, y=H*(0.6+r()*0.4); for(let k=0;k<5;k++){ g.beginPath(); g.arc(x+Math.cos(k*1.26)*H*0.02,y+Math.sin(k*1.26)*H*0.02,H*0.016,0,2*PI); g.fill(); } }
    fl(W*0.18,H*0.36,H*0.24,-0.3); fl(W*0.86,H*0.28,H*0.13,0.4); },
  lavendel(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#ff9a6a'); gr.addColorStop(0.35,'#8a5ab8'); gr.addColorStop(1,'#2a1a4a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,220,150,.9)'; g.beginPath(); g.arc(W*0.78,H*0.3,H*0.09,0,2*PI); g.fill();
    for(let row=0;row<9;row++){ const y=H*(0.42+row*row*0.008+row*0.03), s=0.3+row*0.12; for(let i=0;i<30;i++){ const x=(i/29)*W*1.2-W*0.1+(row%2)*W*0.02, h=H*0.07*s;
      g.strokeStyle='#3a6a2a'; g.lineWidth=Math.max(1,s*1.5); g.beginPath(); g.moveTo(x,y+h); g.lineTo(x,y); g.stroke();
      g.fillStyle=row%2?'#9a6aff':'#b88cff'; g.beginPath(); g.ellipse(x,y,Math.max(1,s*1.6),h*0.45,0,0,2*PI); g.fill(); } } },
  herbst(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#3a1a08'); gr.addColorStop(1,'#120602'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const C=['#ff8a2a','#ffc04a','#e0381a','#b84a10','#ffd23f'];
    for(let i=0;i<26;i++){ const x=r()*W, y=r()*H, s=H*(0.06+r()*0.1); g.save(); g.translate(x,y); g.rotate(r()*6.3); g.fillStyle=C[i%5]; g.beginPath();
      for(let k=0;k<10;k++){ const a=-PI/2+k*PI/5, rr=k%2?s*0.45:s; g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } g.closePath(); g.fill();
      g.strokeStyle='rgba(60,20,4,.7)'; g.lineWidth=Math.max(1,s*0.06); g.beginPath(); g.moveTo(0,s*0.9); g.lineTo(0,-s*0.7); g.stroke(); g.restore(); } },
  kolibri(g,W,H,r){ const gr=g.createRadialGradient(W*0.3,H*0.4,0,W*0.3,H*0.4,W*0.7); gr.addColorStop(0,'#0e4a3a'); gr.addColorStop(1,'#010806'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<30;i++){ const a=-PI*0.95+i/29*PI*0.9, l=H*0.4; g.strokeStyle=i%2?'rgba(60,255,190,.5)':'rgba(40,190,255,.5)'; g.lineWidth=2; g.beginPath(); g.moveTo(W*0.72,H*0.55); g.lineTo(W*0.72+Math.cos(a)*l*1.4,H*0.55+Math.sin(a)*l); g.stroke(); } g.restore();
    const x=W*0.24, y=H*0.42, s=H*0.28;
    g.fillStyle='#ff3a6a'; g.beginPath(); g.ellipse(x+W*0.13,y+s*0.1,s*0.22,s*0.4,0.4,0,2*PI); g.fill();
    const kg=g.createLinearGradient(x-s,y,x+s,y); kg.addColorStop(0,'#1aff9a'); kg.addColorStop(1,'#1ab8ff'); g.fillStyle=kg;
    g.beginPath(); g.ellipse(x,y,s*0.55,s*0.24,-0.3,0,2*PI); g.fill(); g.beginPath(); g.ellipse(x-s*0.15,y-s*0.42,s*0.45,s*0.14,-1.1,0,2*PI); g.fill();
    g.beginPath(); g.moveTo(x-s*0.5,y+s*0.1); g.lineTo(x-s*0.95,y+s*0.38); g.lineTo(x-s*0.85,y+s*0.12); g.fill();
    g.fillStyle='#ff2a4a'; g.beginPath(); g.arc(x+s*0.36,y-s*0.08,s*0.13,0,2*PI); g.fill();
    g.strokeStyle='#202020'; g.lineWidth=Math.max(1.5,s*0.04); g.beginPath(); g.moveTo(x+s*0.48,y-s*0.16); g.lineTo(x+s*0.95,y-s*0.02); g.stroke(); },
  mond(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#1a2050'); gr.addColorStop(1,'#04050c'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let i=0;i<60;i++){ g.fillStyle=`rgba(255,255,255,${r()*0.7})`; g.fillRect(r()*W,r()*H,1.2,1.2); }
    const x=W*0.22, y=H*0.4, R=H*0.24; g.strokeStyle='rgba(200,212,255,.35)'; g.lineWidth=Math.max(1.5,H*0.012); g.beginPath(); g.arc(x,y,R*1.7,0,2*PI); g.stroke();
    const mg=g.createRadialGradient(x-R*0.3,y-R*0.3,R*0.1,x,y,R); mg.addColorStop(0,'#fffaf0'); mg.addColorStop(1,'#e8d8a8'); g.fillStyle=mg; g.beginPath(); g.arc(x,y,R,0,2*PI); g.fill();
    g.fillStyle='rgba(160,140,100,.3)'; [[-.3,-.2,.18],[.25,.1,.22],[-.05,.35,.12],[.3,-.35,.1]].forEach(([a,b,c])=>{ g.beginPath(); g.arc(x+a*R,y+b*R,c*R,0,2*PI); g.fill(); });
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<40;i++){ const a=i/40*2*PI; g.fillStyle='rgba(255,240,200,.6)'; g.beginPath(); g.arc(W*0.75+Math.cos(a)*H*0.2,H*0.35+Math.sin(a)*H*0.2,1.5,0,2*PI); g.fill(); } g.restore();
    g.fillStyle='rgba(30,36,70,.75)'; for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(x+R*(i-0.5)*1.3,y+R*(0.5+i*0.25),R*0.9,R*0.12,0,0,2*PI); g.fill(); } },
  lagune(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2ae8e0'); gr.addColorStop(1,'#04384a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let i=0;i<6;i++){ g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=1.5; g.beginPath(); for(let u=0;u<=1;u+=0.05) g.lineTo(u*W,H*(0.08+i*0.05)+Math.sin(u*14+i)*H*0.01); g.stroke(); }
    const fisch=(x,y,s,c,d)=>{ g.save(); g.translate(x,y); g.scale(d,1); g.fillStyle=c; g.beginPath(); g.ellipse(0,0,s,s*0.42,0,0,2*PI); g.fill(); g.beginPath(); g.moveTo(-s*0.8,0); g.lineTo(-s*1.5,-s*0.45); g.lineTo(-s*1.5,s*0.45); g.fill(); g.fillStyle='#08202a'; g.beginPath(); g.arc(s*0.55,-s*0.08,s*0.09,0,2*PI); g.fill(); g.restore(); };
    for(let i=0;i<11;i++) fisch(W*(0.05+r()*0.9),H*(0.2+r()*0.5),H*(0.04+r()*0.05),['#c8fff4','#5cffe8','#ffffff'][i%3],r()<0.5?-1:1);
    g.fillStyle='#ff7a5a'; for(let i=0;i<5;i++){ const x=W*(0.05+i*0.22); g.beginPath(); g.moveTo(x,H); for(let k=0;k<7;k++) g.lineTo(x+(r()-0.5)*W*0.08,H*(0.75+r()*0.2)); g.closePath(); g.fill(); }
    for(let i=0;i<16;i++){ g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=1; g.beginPath(); g.arc(r()*W,r()*H*0.8,H*(0.008+r()*0.015),0,2*PI); g.stroke(); } },
  sonne(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#1a2a6a'); gr.addColorStop(1,'#4a6a3a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const blume=(x,y,R)=>{ g.fillStyle='#2e6a1e'; g.fillRect(x-R*0.06,y,R*0.12,H); for(let k=0;k<20;k++){ const a=k/20*2*PI; g.save(); g.translate(x,y); g.rotate(a); g.fillStyle=k%2?'#ffd83a':'#ffc21e'; g.beginPath(); g.ellipse(R*0.72,0,R*0.32,R*0.11,0,0,2*PI); g.fill(); g.restore(); }
      g.fillStyle='#5a3008'; g.beginPath(); g.arc(x,y,R*0.45,0,2*PI); g.fill(); g.fillStyle='#8a5a1a'; for(let i=0;i<70;i++){ const a=i*2.39996, rr=Math.sqrt(i/70)*R*0.42; g.beginPath(); g.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,R*0.025,0,2*PI); g.fill(); } };
    blume(W*0.2,H*0.42,H*0.34); blume(W*0.88,H*0.62,H*0.16); blume(W*0.62,H*0.2,H*0.12); },
  eis(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#0a2a5a'); gr.addColorStop(1,'#02081a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='#d8f0ff'; g.beginPath(); g.moveTo(0,H*0.7); [0.12,0.2,0.3,0.42,0.55,0.66,0.8,0.92,1].forEach((u,i)=>g.lineTo(u*W,H*(i%2?0.38+r()*0.1:0.55+r()*0.1))); g.lineTo(W,H*0.78); g.lineTo(0,H*0.78); g.fill();
    g.fillStyle='#8ac8f0'; for(let i=0;i<8;i++){ const x=r()*W; g.beginPath(); g.moveTo(x,H*0.5); g.lineTo(x+W*0.02,H*0.78); g.lineTo(x-W*0.02,H*0.78); g.fill(); }
    g.fillStyle='#0a3a6a'; g.fillRect(0,H*0.78,W,H*0.22);
    const x=W*0.2, y=H*0.28, R=H*0.18; g.strokeStyle='#ffffff'; g.lineWidth=Math.max(1.5,H*0.018); for(let k=0;k<6;k++){ const a=k*PI/3, ex=x+Math.cos(a)*R, ey=y+Math.sin(a)*R; g.beginPath(); g.moveTo(x,y); g.lineTo(ex,ey); g.stroke();
      for(const sd of [-1,1]){ const mx=x+Math.cos(a)*R*0.6, my=y+Math.sin(a)*R*0.6; g.beginPath(); g.moveTo(mx,my); g.lineTo(mx+Math.cos(a+sd*PI/3)*R*0.3,my+Math.sin(a+sd*PI/3)*R*0.3); g.stroke(); } } },
  vulkan(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2a0806'); gr.addColorStop(1,'#0a0202'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(90,40,40,.6)'; for(let i=0;i<7;i++){ g.beginPath(); g.arc(W*(0.12+i*0.05),H*(0.12+r()*0.1),H*(0.08+r()*0.06),0,2*PI); g.fill(); }
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<22;i++){ const a=-PI/2+(r()-0.5)*2, l=H*(0.2+r()*0.3); g.strokeStyle=r()<0.5?'rgba(255,90,20,.9)':'rgba(255,190,60,.9)'; g.lineWidth=Math.max(1.5,H*0.012); g.beginPath(); g.moveTo(W*0.22,H*0.45); g.quadraticCurveTo(W*0.22+Math.cos(a)*l,H*0.45+Math.sin(a)*l,W*0.22+Math.cos(a)*l*1.5,H*0.45+Math.sin(a)*l*0.4+l*0.5); g.stroke(); } g.restore();
    g.fillStyle='#1a0a06'; g.beginPath(); g.moveTo(0,H); g.lineTo(W*0.16,H*0.46); g.lineTo(W*0.28,H*0.46); g.lineTo(W*0.5,H); g.fill();
    g.strokeStyle='#ff4a1e'; g.lineWidth=Math.max(2,H*0.02); g.beginPath(); g.moveTo(W*0.22,H*0.47); g.quadraticCurveTo(W*0.18,H*0.7,W*0.24,H); g.stroke(); }
};
/* ---------- Druckbilder ---------- */
/* Vorderseite wie echte Batterien: Effektbild bis an den Rand, grosser
   Schriftzug mit Metallverlauf, Schuss-Badge oben rechts, Marke, Info, F2 */
function thFront(k,motiv,o){ o=o||{}; return (g,W,H)=>{ const a=k.a, rnd=zufallAus(hashStr(k.t+'thema'+(o.id||''))), info=produktInfo(k.t);
  MOTIV[motiv](g,W,H,rnd);
  const vg=g.createLinearGradient(0,H*0.45,0,H); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)'); g.fillStyle=vg; g.fillRect(0,0,W,H);
  const gr=g.createLinearGradient(0,H*0.45,0,H*0.75); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.5,hellC(a.ac,0.45)); gr.addColorStop(0.52,a.ac); gr.addColorStop(1,hellC(a.ac,0.2));
  nameText(g,a.title,W*0.52,H*0.57,W*0.9,Math.round(H*(o.gross||0.33)),FNT.bun,gr,'rgba(10,6,4,.9)',Math.max(3,H*0.035),-0.06);
  nameText(g,(info.schuss?info.schuss+' SCHUSS · ':'')+(o.zeile||'THEMEN-BATTERIE'),W*0.52,H*0.78,W*0.7,Math.round(H*0.07),FNT.bar,'#ffffff','rgba(0,0,0,.7)',2);
  if(info.schuss&&o.badge!==false){ const bw=H*0.22, bx=W-bw*1.25, by=H*0.06; g.fillStyle='#ffffff'; g.fillRect(bx,by,bw,bw*1.05); g.fillStyle=o.badgeFarbe||'#d8282a'; g.fillRect(bx+bw*0.06,by+bw*0.06,bw*0.88,bw*0.6);
    g.fillStyle='#ffffff'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bar(Math.round(bw*0.5)); g.fillText(String(info.schuss),bx+bw/2,by+bw*0.37);
    g.fillStyle='#1b1b1b'; g.font=`700 ${Math.round(bw*0.17)}px Arial`; g.fillText('SCHUSS',bx+bw/2,by+bw*0.84); }
  g.fillStyle='rgba(255,255,255,.92)'; g.font=`italic 700 ${Math.max(6,Math.round(H*0.06))}px "Barlow Condensed", Arial`; g.textAlign='left'; g.textBaseline='top'; g.fillText('LUMEN',W*0.03,H*0.04);
  g.font=`600 ${Math.max(5,Math.round(H*0.035))}px Arial`; g.fillText('Naturwelten',W*0.03,H*0.11);
  g.fillStyle='rgba(4,6,12,.72)'; g.fillRect(0,H*0.87,W,H*0.13); infoZeile(g,W*0.02,H*0.875,W*0.62,H*0.12,info,a.ac,'#ffffff');
  siegel(g,W*0.8,H*0.935,H*0.05,'F'+(P[k.t].cat||2),'#ffffff','#1b1b1b'); g.fillStyle='#ffffff'; g.font=`700 ${Math.max(5,Math.round(H*0.05))}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('CE',W*0.9,H*0.935); }; }
const hellC=(c,f)=>{ const n=parseInt(String(c).slice(1),16), A=[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.round(v+(255-v)*f)); return `rgb(${A[0]},${A[1]},${A[2]})`; };
/* Seite: Effektbild, senkrechter Name, Warnhinweis-Feld */
function thSeite(k,motiv,id){ return (g,W,H)=>{ const a=k.a; MOTIV[motiv](g,W,H,zufallAus(hashStr(k.t+'seite'+(id||''))));
  g.fillStyle='rgba(250,248,240,.9)'; g.fillRect(W*0.08,H*0.62,W*0.84,H*0.3); g.fillStyle='#1b1b1b'; g.font=`700 ${Math.max(5,Math.round(Math.min(W,H)*0.07))}px Arial`; g.textAlign='center'; g.textBaseline='middle'; g.fillText('F'+(P[k.t].cat||2)+' · CE · NEM',W/2,H*0.69);
  for(let i=0;i<4;i++){ g.fillStyle='rgba(30,30,30,.45)'; g.fillRect(W*0.14,H*(0.75+i*0.04),W*0.72,Math.max(1,H*0.012)); }
  nameText(g,a.title,W/2,H*0.32,W*0.9,Math.round(Math.min(H*0.24,W*0.2)),FNT.bun,'#ffffff','rgba(0,0,0,.7)',2); }; }
/* Deckel: genau n Rohrmuendungen (graue Pappe, dunkles Loch, Seidenpapier
   in der Kappenfarbe), dazu die gruene Zuendschnur */
function thDeckel(n,kappe,o){ o=o||{}; return (g,W,H)=>{ g.fillStyle=o.grund||'#3a3a3c'; g.fillRect(0,0,W,H);
  /* verschiedene Kaliber in einem Block (Toms Vorbild): die grossen Finale-
     Rohre stehen hinten als eigene Reihe(n) mit weiteren Muendungen */
  const gz=Math.min(o.kal||0,n-1);
  if(gz>0){ const f=Math.min(0.55,0.25+gz/n); const sub=(n2,y0,h2,s2)=>{ g.save(); g.translate(0,y0); thDeckelRaster(g,W,h2,n2,kappe,s2); g.restore(); };
    sub(gz,0,H*f,1); sub(n-gz,H*f,H*(1-f),0); }
  else thDeckelRaster(g,W,H,n,kappe,0);
  g.strokeStyle=o.schnur||'#2e8b3a'; g.lineWidth=Math.max(1.5,Math.min(W,H)*0.012); g.beginPath(); g.moveTo(W*0.02,H*0.5); for(let i=0;i<=8;i++) g.lineTo(W*(0.02+i*0.12),H*(0.5+(i%2?0.08:-0.08))); g.stroke(); }; }
function thDeckelRaster(g,W,H,n,kappe,gross){
  let best=null; for(let c=1;c<=n;c++){ const r=Math.ceil(n/c), s=Math.min(W/c,H/r); if(!best||s>best.s) best={c,r,s}; }
  const {c,r}=best, cw=W/c, ch=H/r, rr=Math.min(cw,ch)*0.46; let k=0;
  for(let j=0;j<r;j++){ const inR=Math.min(c,n-k), x0=(W-inR*cw)/2; for(let i=0;i<inR;i++,k++){ const x=x0+cw*(i+0.5), y=ch*(j+0.5);
    const rg=g.createRadialGradient(x-rr*0.3,y-rr*0.3,rr*0.2,x,y,rr); rg.addColorStop(0,'#d8d8d8'); rg.addColorStop(1,'#8a8a8e'); g.fillStyle=rg; g.beginPath(); g.arc(x,y,rr,0,2*PI); g.fill();
    const kc=typeof kappe==='function'?kappe(k+(gross?500:0)):kappe; g.fillStyle='#1c1a1a'; g.beginPath(); g.arc(x,y,rr*0.74,0,2*PI); g.fill();
    const tg=g.createRadialGradient(x-rr*0.12,y-rr*0.12,rr*0.05,x,y,rr*0.5); tg.addColorStop(0,'#ffffff'); tg.addColorStop(0.35,kc); tg.addColorStop(1,'rgba(0,0,0,.6)'); g.fillStyle=tg; g.beginPath(); g.arc(x,y,rr*0.5,0,2*PI); g.fill();
    g.fillStyle='rgba(0,0,0,.35)'; g.beginPath(); g.arc(x+rr*0.08,y+rr*0.08,rr*0.3,0,2*PI); g.fill(); } }
}
/* bedruckter Block (Rohrbatterie): x/z Mitte, w/h/d, n Muendungen oben */
function druckBlock(k,o){ const id=o.id||'', w=o.w, h=o.h, d=o.d;
  const vorn=reg(k,'tv'+id,w,h,o.vorn||thFront(k,o.motiv,o)), seite=reg(k,'ts'+id,d,h,o.seite||thSeite(k,o.motiv,id)), hinten=o.hinten?reg(k,'th'+id,w,h,o.hinten):vorn;
  const deck=reg(k,'td'+id,w,d,thDeckel(o.n,o.kappe,o));
  kasten(k,w,h,d,tm(o.x||0,(o.y0||0)+h/2,o.z||0),{pz:vorn,nz:hinten,px:seite,nx:seite,py:deck,ny:farbe(k,'#2a2018')});
  return {w,h,d,x:o.x||0,z:o.z||0,y0:o.y0||0}; }
/* n auf Teile verteilen (nach Flaeche), Summe genau n */
function teile(n,fl){ const s=fl.reduce((a,b)=>a+b,0), out=fl.map(f=>Math.floor(n*f/s)); let r=n-out.reduce((a,b)=>a+b,0); for(let i=0;r>0;i=(i+1)%out.length,r--) out[i]++; return out; }
const N=t=>rohrBedarf(t).schuss;
const NG=t=>{ try{ return SHOWS[t]().reduce((a,p)=>a+(p.kal==='gross'?(p.n===undefined?1:p.n):0),0); }catch(e){ return 0; } };
const V=VP_FORM;
Object.assign(V,{
  /* Tautropfen: kleiner Block in Klarsichtfolie, mint Seidenpapier, am Gurt ein Tropfen-Anhaenger */
  lb_tautropfen:t=>{ const k=neu(t), w=k.w-0.008, d=k.d-0.008, h=k.h-0.003, B=druckBlock(k,{motiv:'tau',w,h,d,n:N(t),kal:NG(t),kappe:i=>i%2?'#d8fff0':'#9fffd0',zeile:'KINDERFEUERWERK',badgeFarbe:'#1e9a6a'});
    gurtX(k,0,B.w,B.h,'#9fffd0',0.012); kordel(k,[[B.w/2+0.002,B.h-0.01,0],[B.w/2+0.012,B.h-0.05,0.004],[B.w/2+0.014,B.h-0.07,0.006]],'#e8fff6',0.0012);
    vkugel(k,0.011,8,6,B.w/2+0.014,B.h-0.083,0.006,'#c8fff0',1,1.25,0.7); vzyl(k,0.0001,0.008,0.014,6,B.w/2+0.014,B.h-0.068,0.006,'#c8fff0');
    folie(k); return fertig(k); },
  /* Zitronenfalter: bedruckter Block, oben steckt ein Papp-Falter auf einem Draht */
  lb_zitronenfalter:t=>{ const k=neu(t), w=k.w-0.004, d=k.d-0.004, h=k.h-0.07, B=druckBlock(k,{motiv:'falter',w,h,d,n:N(t),kal:NG(t),kappe:i=>i%3?'#fff35c':'#ffffd0',badgeFarbe:'#e0a000'});
    ecken(k,B.w,B.h,B.d,'#fff35c',0.01); vzyl(k,0.0012,0.0012,0.06,4,-B.w*0.3,B.h+0.03,0,'#3a2a10');
    for(const s of [-1,1]){ vbox(k,0.034,0.002,0.026,-B.w*0.3+s*0.018,B.h+0.06,0,'#fff35c',0,0,s*0.45); vbox(k,0.022,0.002,0.018,-B.w*0.3+s*0.014,B.h+0.06,0.02,'#ffe83a',0,0,s*0.45); }
    vzyl(k,0.002,0.002,0.03,5,-B.w*0.3,B.h+0.062,0.008,'#3a2a10',PI/2,0,0); return fertig(k); },
  /* Lavendelfeld: bedruckter Block mit Bastband, obendrauf ein Lavendelstraeusschen mit Schleife */
  lb_lavendelfeld:t=>{ const k=neu(t), w=k.w-0.006, d=k.d-0.006, h=k.h-0.03, B=druckBlock(k,{motiv:'lavendel',w,h,d,n:N(t),kal:NG(t),kappe:i=>i%2?'#b89cff':'#8a6ad8',badgeFarbe:'#7a3aff'});
    gurtX(k,-B.d*0.25,B.w,B.h,'#d8c08a',0.01);
    const x0=B.w*0.18;
    for(let i=0;i<5;i++){ const dx=(i-2)*0.006, rz=(i-2)*0.12; vzyl(k,0.0012,0.0012,0.12,4,x0+dx*2,B.h+0.004,dx,'#4a7a3a',PI/2,0,rz);
      vbox(k,0.006,0.006,0.035,x0+dx*2-Math.sin(rz)*0.05,B.h+0.006,dx-0.062,i%2?'#9a6aff':'#b88cff'); }
    schleife(k,x0,B.h+0.008,0.01,0.028,'#7a3aff',0); return fertig(k); },
  /* Herbstlaub: Display-Karton wie im Laden - vorn der niedrige bedruckte
     Block mit den Muendungen, hinten steht der bedruckte Aufsteller schraeg */
  lb_herbstlaub:t=>{ const k=neu(t), w=k.w-0.01, d=k.d-0.03, h=k.h*0.6, z0=0.012;
    druckBlock(k,{motiv:'herbst',w,h,d,z:z0,n:N(t),kal:NG(t),kappe:i=>['#ff8a2a','#ffc04a','#e0381a'][i%3],badgeFarbe:'#b84a10',gross:0.32});
    const ah=k.h-0.006, card=reg(k,'tauf',w,ah,thFront(k,'herbst',{id:'auf',zeile:'BLÄTTERFALL',gross:0.24}));
    W_.mit(k,tm(0,0,z0-d/2-0.004,-0.07,0,0),()=>{ kasten(k,w,ah,0.004,tm(0,ah/2,0),{pz:card,nz:farbe(k,'#3a1a08'),rest:farbe(k,'#e0381a')}); });
    for(const s of [-1,1]) vbox(k,0.006,h*0.9,0.03,s*(w/2-0.01),h*0.45,z0-d/2-0.012,'#b84a10',0.25,0,0);
    return fertig(k); },
  /* Kolibri: Treppe in zwei Stufen - vorn die niedrige, hinten die hohe Stufe */
  lb_kolibri:t=>{ const k=neu(t); k.rauh=0.35; const w=k.w-0.006, d=k.d-0.006, n=teile(N(t),[1,1]);
    druckBlock(k,{id:'a',motiv:'kolibri',w,h:k.h*0.58,d:d*0.5,z:d*0.25,n:n[0],kappe:i=>i%2?'#3affc0':'#1ab8ff',badgeFarbe:'#0a8a5a'});
    druckBlock(k,{id:'b',motiv:'kolibri',w,h:k.h-0.004,d:d*0.5,z:-d*0.25,n:n[1],kal:Math.min(NG(t),n[1]-2),kappe:i=>i%3?'#3affc0':'#ff3a6a',vorn:thFront(k,'kolibri',{id:'b',zeile:'STUFENBATTERIE',gross:0.22})});
    lascheSeite(k,{x:0,z:d*0.25,w,d:d*0.5},0.04,'#ff3a6a'); return fertig(k); },
  /* Vollmond: Zwei-Block-Verbund auf schwarzer Platte, je ein silbernes
     Mondsiegel vorn, eine Banderole mit dem Namen haelt beide zusammen */
  lb_vollmond:t=>{ const k=neu(t), pl=0.012, w=(k.w-0.03)/2, d=k.d-0.02, h=k.h-pl-0.004, n=teile(N(t),[1,1]);
    vbox(k,k.w,pl,k.d,0,pl/2,0,'#141418');
    [-1,1].forEach((s,i)=>{ druckBlock(k,{id:'m'+i,motiv:'mond',w,h,d,x:s*(w/2+0.006),y0:pl,n:n[i],kal:i?Math.min(NG(t),n[i]-2):0,kappe:'#fff0c8',badge:i===1,zeile:'2 BLÖCKE · VERBUND',gross:0.3});
      vzyl(k,0.03,0.03,0.003,16,s*(w/2+0.006)-s*w*0.28,pl+h*0.7,d/2+0.002,'#e8e0c8',PI/2,0,0); vring(k,0.032,0.0025,4,16,2*PI,s*(w/2+0.006)-s*w*0.28,pl+h*0.7,d/2+0.003,'#c8d4ff'); });
    W_.banderole(k,{x:0,z:0,w:k.w-0.01,d},pl+h*0.08,pl+h*0.22,{farbe:'#1a1e3a',akzent:'#fff0c8'}); return fertig(k); },
  /* Lagune: Treppe in drei Stufen (wie Wellen), unten ein Tau mit Seestern */
  lb_lagune:t=>{ const k=neu(t), w=k.w-0.006, d=(k.d-0.006)/3, n=teile(N(t),[1,1,1]), H=[0.5,0.75,1];
    for(let i=0;i<3;i++) druckBlock(k,{id:'l'+i,motiv:'lagune',w,h:k.h*H[i]-0.004,d,z:(k.d-0.006)/2-d*(i+0.5),n:n[i],kal:i===2?Math.min(NG(t),n[i]-2):0,kappe:j=>(j+i)%3?'#5cffe8':'#c8fff4',badge:i===0,
      vorn:i?thFront(k,'lagune',{id:'l'+i,zeile:'TREPPE · '+(i+1)+'. STUFE',gross:0.2,badge:false}):null,badgeFarbe:'#0a7a8a'});
    const yh=k.h*0.12, t2=0.004, D=(k.d-0.006)/2; kordel(k,[[-w/2-t2,yh,-D-t2],[w/2+t2,yh,-D-t2],[w/2+t2,yh,D+t2],[-w/2-t2,yh,D+t2],[-w/2-t2,yh,-D-t2]],'#d8c08a',0.003);
    for(let i=0;i<5;i++){ const a=i*2*PI/5; vbox(k,0.03,0.012,0.004,w*0.4+Math.cos(a)*0.014,k.h*0.3+Math.sin(a)*0.014,D+0.004,'#ff7a5a',0,0,a); }
    vkugel(k,0.008,6,4,w*0.4,k.h*0.3,D+0.005,'#ff9a6a',1,1,0.5); return fertig(k); },
  /* Sonnenblumen: bedruckter Block mit Bluetendeckel - ein Kranz gelber Blaetter um ein braunes Herz */
  lb_sonnenblumen:t=>{ const k=neu(t), w=k.w-0.006, d=k.d-0.006, h=k.h-0.012, B=druckBlock(k,{motiv:'sonne',w,h,d,n:N(t),kal:NG(t),kappe:i=>i%2?'#ffd83a':'#8a4a12',badgeFarbe:'#c87a00'});
    const cx=-B.w*0.25, R=Math.min(B.d*0.32,0.09);
    vzyl(k,R*0.5,R*0.5,0.006,12,cx,B.h+0.003,0,'#5a3008');
    for(let i=0;i<12;i++){ const a=i/12*2*PI; vbox(k,R*0.55,0.003,R*0.22,cx+Math.cos(a)*R*0.75,B.h+0.002,Math.sin(a)*R*0.75,i%2?'#ffd83a':'#ffc21e',0,-a,0); }
    return fertig(k); },
  /* Gletscher: Drei-Block-Verbund wie Eisschollen - drei bedruckte Bloecke
     verschiedener Hoehe auf einer weissen Platte, Frostfolie darueber */
  lb_gletscher:t=>{ const k=neu(t), pl=0.012, g0=0.008, w=(k.w-2*g0-0.006)/3, d=k.d-0.012, H=[0.78,1,0.66], n=teile(N(t),[1,1,1]);
    vbox(k,k.w,pl,k.d,0,pl/2,0,'#e8f4ff');
    for(let i=0;i<3;i++) druckBlock(k,{id:'g'+i,motiv:'eis',w,h:(k.h-pl-0.004)*H[i],d,x:(i-1)*(w+g0),y0:pl,n:n[i],kal:i===1?Math.min(NG(t),n[i]-2):0,kappe:j=>(j+i)%3?'#c8ecff':'#5c9dff',badge:i===1,gross:0.3,zeile:'3 BLÖCKE · VERBUND',badgeFarbe:'#2a6ad8'});
    ecken(k,k.w,k.h*0.25,k.d,'#c9ced6',0.014); folie(k); return fertig(k); },
  /* Vulkanausbruch: Drei-Block-Verbund als Vulkankegel - der mittlere Block
     ist der hoechste (der Krater), auf schwarzer Platte, ein Tragegurt */
  lb_vulkan:t=>{ const k=neu(t), pl=0.014, g0=0.008, w=(k.w-2*g0-0.006)/3, d=k.d-0.012, H=[0.62,1,0.62], n=teile(N(t),[1,1.4,1]);
    vbox(k,k.w,pl,k.d,0,pl/2,0,'#0c0808'); vbox(k,k.w+0.004,0.004,k.d+0.004,0,pl,0,'#d8281a');
    for(let i=0;i<3;i++) druckBlock(k,{id:'v'+i,motiv:'vulkan',w,h:(k.h-pl-0.004)*H[i],d,x:(i-1)*(w+g0),y0:pl,n:n[i],kal:i===1?Math.min(NG(t),n[i]-2):0,kappe:j=>['#ff5a1e','#ffb03a','#d8281a'][(j+i)%3],grund:'#201414',badge:i===1,gross:i===1?0.24:0.3,zeile:i===1?'VERBUNDFEUERWERK':'3 BLÖCKE',badgeFarbe:'#d8281a'});
    gurtX(k,0,k.w,k.h*0.62,'#d8281a',0.014); return fertig(k); }
});
})();

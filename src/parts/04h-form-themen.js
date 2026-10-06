/* =========================================================
   Verpackungen der zehn Themen-Batterien (06.10., Tom: "jede Verpackung
   soll so etwas Einzigartiges haben"; Themen-Batterien 14v). Jede hat
   ein gemaltes Motiv ihres Themas (Tau auf Graes­ern, Falter, Lavendel-
   feld, Herbstblaetter, Kolibri, Vollmond, Lagune, Sonnenblume, Gletscher,
   Vulkan), gut lesbar Name, Schusszahl und F2 - und eine eigene Form:
   Anhaenger, Pappfalter, Lavendelstrauss, Lattenkiste mit Laub,
   Fensterkarton, Mondfenster, Seil und Seestern, Bluetendeckel,
   Eisschollen, verkohlte Kiste. Werkzeug aus 04g-form-batterie
   (VP_WERK). Am Handy hoechstens rund 500 Dreiecke (04-models Sparaufbau).
   ========================================================= */
(function(){
if(typeof VP_FORM==='undefined'||typeof window==='undefined'||!window.VP_WERK) return;
const W_=window.VP_WERK, PI=Math.PI;
const {neu,reg,farbe,kasten,fertig,block,banderole,folie,ecken,gurtX,gurtZ,lascheSeite,vbox,vzyl,vkugel,vring,kordel,schleife,pKraft,pHolz,kiste,seilgriff,hell,dunkel}=W_;
/* ---------- Motive (Canvas, in Anteilen der Flaeche) ---------- */
const MOTIV={
  tau(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#0e2a3a'); gr.addColorStop(1,'#123a26'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let i=0;i<26;i++){ const x=r()*W, h=H*(0.35+r()*0.5), b=(r()-0.5)*W*0.08; g.strokeStyle=`rgba(${60+r()*40|0},${150+r()*60|0},${90+r()*40|0},.9)`; g.lineWidth=Math.max(1.5,W*0.006); g.beginPath(); g.moveTo(x,H); g.quadraticCurveTo(x+b*0.3,H-h*0.6,x+b,H-h); g.stroke();
      if(r()<0.6){ const dx=x+b*0.8, dy=H-h*0.86, R=Math.max(2,H*(0.025+r()*0.025)), dg=g.createRadialGradient(dx-R*0.3,dy-R*0.3,R*0.1,dx,dy,R); dg.addColorStop(0,'#ffffff'); dg.addColorStop(0.5,'#c8fff0'); dg.addColorStop(1,'rgba(120,255,210,.15)'); g.fillStyle=dg; g.beginPath(); g.arc(dx,dy,R,0,2*PI); g.fill(); } } },
  falter(g,W,H,r){ const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,'#5a7a1e'); gr.addColorStop(1,'#1e3008'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const fl=(x,y,s,rot)=>{ g.save(); g.translate(x,y); g.rotate(rot); for(const sx of [-1,1]){ g.fillStyle='#fff35c'; g.beginPath(); g.ellipse(sx*s*0.55,-s*0.25,s*0.55,s*0.45,sx*0.5,0,2*PI); g.fill(); g.beginPath(); g.ellipse(sx*s*0.45,s*0.38,s*0.38,s*0.32,-sx*0.4,0,2*PI); g.fill();
        g.fillStyle='#ff9a1e'; g.beginPath(); g.arc(sx*s*0.6,-s*0.2,s*0.08,0,2*PI); g.fill(); }
      g.fillStyle='#3a2a10'; g.fillRect(-s*0.06,-s*0.5,s*0.12,s*1.05); g.restore(); };
    for(let i=0;i<14;i++){ g.fillStyle=r()<0.5?'#ffffff':'#ffe0f0'; const x=r()*W, y=H*(0.6+r()*0.4); for(let k=0;k<5;k++){ g.beginPath(); g.arc(x+Math.cos(k*1.26)*H*0.02,y+Math.sin(k*1.26)*H*0.02,H*0.016,0,2*PI); g.fill(); } }
    fl(W*0.2,H*0.36,H*0.24,-0.3); fl(W*0.82,H*0.3,H*0.13,0.4); },
  lavendel(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#ff9a6a'); gr.addColorStop(0.35,'#8a5ab8'); gr.addColorStop(1,'#2a1a4a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(255,220,150,.9)'; g.beginPath(); g.arc(W*0.78,H*0.3,H*0.09,0,2*PI); g.fill();
    for(let row=0;row<9;row++){ const y=H*(0.42+row*row*0.008+row*0.03), s=0.3+row*0.12; for(let i=0;i<30;i++){ const x=(i/29)*W*1.2-W*0.1+(row%2)*W*0.02, h=H*0.07*s;
      g.strokeStyle='#3a6a2a'; g.lineWidth=Math.max(1,s*1.5); g.beginPath(); g.moveTo(x,y+h); g.lineTo(x,y); g.stroke();
      g.fillStyle=row%2?'#9a6aff':'#b88cff'; g.beginPath(); g.ellipse(x,y,Math.max(1,s*1.6),h*0.45,0,0,2*PI); g.fill(); } } },
  herbst(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#3a1a08'); gr.addColorStop(1,'#120602'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const C=['#ff8a2a','#ffc04a','#e0381a','#b84a10','#ffd23f'];
    for(let i=0;i<22;i++){ const x=r()*W, y=r()*H, s=H*(0.06+r()*0.1); g.save(); g.translate(x,y); g.rotate(r()*6.3); g.fillStyle=C[i%5]; g.beginPath();
      for(let k=0;k<10;k++){ const a=-PI/2+k*PI/5, rr=k%2?s*0.45:s; g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr); } g.closePath(); g.fill();
      g.strokeStyle='rgba(60,20,4,.7)'; g.lineWidth=Math.max(1,s*0.06); g.beginPath(); g.moveTo(0,s*0.9); g.lineTo(0,-s*0.7); g.stroke(); g.restore(); } },
  kolibri(g,W,H,r){ const gr=g.createRadialGradient(W*0.3,H*0.4,0,W*0.3,H*0.4,W*0.7); gr.addColorStop(0,'#0e4a3a'); gr.addColorStop(1,'#010806'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const x=W*0.24, y=H*0.42, s=H*0.28;
    g.fillStyle='#ff3a6a'; g.beginPath(); g.ellipse(x+W*0.13,y+s*0.1,s*0.22,s*0.4,0.4,0,2*PI); g.fill();
    g.fillStyle='#e8204a'; for(let k=0;k<5;k++){ g.beginPath(); g.ellipse(x+W*0.13+Math.cos(k*1.26)*s*0.35,y+s*0.1+Math.sin(k*1.26)*s*0.35,s*0.18,s*0.08,k*1.26,0,2*PI); g.fill(); }
    const kg=g.createLinearGradient(x-s,y,x+s,y); kg.addColorStop(0,'#1aff9a'); kg.addColorStop(1,'#1ab8ff'); g.fillStyle=kg;
    g.beginPath(); g.ellipse(x,y,s*0.55,s*0.24,-0.3,0,2*PI); g.fill(); g.beginPath(); g.ellipse(x-s*0.15,y-s*0.42,s*0.45,s*0.14,-1.1,0,2*PI); g.fill();
    g.beginPath(); g.moveTo(x-s*0.5,y+s*0.1); g.lineTo(x-s*0.95,y+s*0.38); g.lineTo(x-s*0.85,y+s*0.12); g.fill();
    g.fillStyle='#ff2a4a'; g.beginPath(); g.arc(x+s*0.36,y-s*0.08,s*0.13,0,2*PI); g.fill();
    g.strokeStyle='#202020'; g.lineWidth=Math.max(1.5,s*0.04); g.beginPath(); g.moveTo(x+s*0.48,y-s*0.16); g.lineTo(x+s*0.95,y-s*0.02); g.stroke();
    for(let i=0;i<30;i++){ g.fillStyle=`rgba(90,255,200,${r()*0.6})`; g.fillRect(r()*W,r()*H,1.5,1.5); } },
  mond(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#1a2050'); gr.addColorStop(1,'#04050c'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let i=0;i<60;i++){ g.fillStyle=`rgba(255,255,255,${r()*0.7})`; g.fillRect(r()*W,r()*H,1.2,1.2); }
    const x=W*0.24, y=H*0.42, R=H*0.26; g.strokeStyle='rgba(200,212,255,.35)'; g.lineWidth=Math.max(1.5,H*0.012); g.beginPath(); g.arc(x,y,R*1.7,0,2*PI); g.stroke();
    const mg=g.createRadialGradient(x-R*0.3,y-R*0.3,R*0.1,x,y,R); mg.addColorStop(0,'#fffaf0'); mg.addColorStop(1,'#e8d8a8'); g.fillStyle=mg; g.beginPath(); g.arc(x,y,R,0,2*PI); g.fill();
    g.fillStyle='rgba(160,140,100,.3)'; [[-.3,-.2,.18],[.25,.1,.22],[-.05,.35,.12],[.3,-.35,.1]].forEach(([a,b,c])=>{ g.beginPath(); g.arc(x+a*R,y+b*R,c*R,0,2*PI); g.fill(); });
    g.fillStyle='rgba(30,36,70,.75)'; for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(x+R*(i-0.5)*1.3,y+R*(0.5+i*0.25),R*0.9,R*0.12,0,0,2*PI); g.fill(); } },
  lagune(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2ae8e0'); gr.addColorStop(1,'#04384a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    for(let i=0;i<6;i++){ g.strokeStyle='rgba(255,255,255,.25)'; g.lineWidth=1.5; g.beginPath(); for(let u=0;u<=1;u+=0.05) g.lineTo(u*W,H*(0.08+i*0.05)+Math.sin(u*14+i)*H*0.01); g.stroke(); }
    const fisch=(x,y,s,c,d)=>{ g.save(); g.translate(x,y); g.scale(d,1); g.fillStyle=c; g.beginPath(); g.ellipse(0,0,s,s*0.42,0,0,2*PI); g.fill(); g.beginPath(); g.moveTo(-s*0.8,0); g.lineTo(-s*1.5,-s*0.45); g.lineTo(-s*1.5,s*0.45); g.fill(); g.fillStyle='#08202a'; g.beginPath(); g.arc(s*0.55,-s*0.08,s*0.09,0,2*PI); g.fill(); g.restore(); };
    for(let i=0;i<9;i++) fisch(W*(0.1+r()*0.8),H*(0.25+r()*0.45),H*(0.04+r()*0.05),['#c8fff4','#5cffe8','#ffffff'][i%3],r()<0.5?-1:1);
    g.fillStyle='#ff7a5a'; for(let i=0;i<5;i++){ const x=W*(0.05+i*0.22); g.beginPath(); g.moveTo(x,H); for(let k=0;k<7;k++) g.lineTo(x+(r()-0.5)*W*0.08,H*(0.75+r()*0.2)); g.closePath(); g.fill(); }
    for(let i=0;i<14;i++){ g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=1; g.beginPath(); g.arc(r()*W,r()*H*0.8,H*(0.008+r()*0.015),0,2*PI); g.stroke(); } },
  sonne(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#4a8ad8'); gr.addColorStop(1,'#d8e8a0'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const blume=(x,y,R)=>{ g.fillStyle='#2e6a1e'; g.fillRect(x-R*0.06,y,R*0.12,H); for(let k=0;k<20;k++){ const a=k/20*2*PI; g.save(); g.translate(x,y); g.rotate(a); g.fillStyle=k%2?'#ffd83a':'#ffc21e'; g.beginPath(); g.ellipse(R*0.72,0,R*0.32,R*0.11,0,0,2*PI); g.fill(); g.restore(); }
      g.fillStyle='#5a3008'; g.beginPath(); g.arc(x,y,R*0.45,0,2*PI); g.fill(); g.fillStyle='#8a5a1a'; for(let i=0;i<70;i++){ const a=i*2.39996, rr=Math.sqrt(i/70)*R*0.42; g.beginPath(); g.arc(x+Math.cos(a)*rr,y+Math.sin(a)*rr,R*0.025,0,2*PI); g.fill(); } };
    blume(W*0.2,H*0.42,H*0.34); blume(W*0.88,H*0.62,H*0.16); },
  eis(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#0a2a5a'); gr.addColorStop(1,'#02081a'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='#d8f0ff'; g.beginPath(); g.moveTo(0,H*0.7); [0.12,0.2,0.3,0.42,0.55,0.66,0.8,0.92,1].forEach((u,i)=>g.lineTo(u*W,H*(i%2?0.38+r()*0.1:0.55+r()*0.1))); g.lineTo(W,H*0.78); g.lineTo(0,H*0.78); g.fill();
    g.fillStyle='#8ac8f0'; for(let i=0;i<8;i++){ const x=r()*W; g.beginPath(); g.moveTo(x,H*0.5); g.lineTo(x+W*0.02,H*0.78); g.lineTo(x-W*0.02,H*0.78); g.fill(); }
    g.fillStyle='#0a3a6a'; g.fillRect(0,H*0.78,W,H*0.22);
    const x=W*0.2, y=H*0.3, R=H*0.2; g.strokeStyle='#ffffff'; g.lineWidth=Math.max(1.5,H*0.018); for(let k=0;k<6;k++){ const a=k*PI/3, ex=x+Math.cos(a)*R, ey=y+Math.sin(a)*R; g.beginPath(); g.moveTo(x,y); g.lineTo(ex,ey); g.stroke();
      for(const sd of [-1,1]){ const mx=x+Math.cos(a)*R*0.6, my=y+Math.sin(a)*R*0.6; g.beginPath(); g.moveTo(mx,my); g.lineTo(mx+Math.cos(a+sd*PI/3)*R*0.3,my+Math.sin(a+sd*PI/3)*R*0.3); g.stroke(); } } },
  vulkan(g,W,H,r){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#2a0806'); gr.addColorStop(1,'#0a0202'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.fillStyle='rgba(90,40,40,.6)'; for(let i=0;i<7;i++){ g.beginPath(); g.arc(W*(0.12+i*0.05),H*(0.12+r()*0.1),H*(0.08+r()*0.06),0,2*PI); g.fill(); }
    for(let i=0;i<18;i++){ const a=-PI/2+(r()-0.5)*2, l=H*(0.2+r()*0.3); g.strokeStyle=r()<0.5?'#ff8a1e':'#ffd23f'; g.lineWidth=Math.max(1.5,H*0.012); g.beginPath(); g.moveTo(W*0.22,H*0.45); g.quadraticCurveTo(W*0.22+Math.cos(a)*l,H*0.45+Math.sin(a)*l,W*0.22+Math.cos(a)*l*1.5,H*0.45+Math.sin(a)*l*0.4+l*0.5); g.stroke(); }
    g.fillStyle='#1a0a06'; g.beginPath(); g.moveTo(0,H); g.lineTo(W*0.16,H*0.46); g.lineTo(W*0.28,H*0.46); g.lineTo(W*0.5,H); g.fill();
    g.strokeStyle='#ff4a1e'; g.lineWidth=Math.max(2,H*0.02); g.beginPath(); g.moveTo(W*0.22,H*0.47); g.quadraticCurveTo(W*0.18,H*0.7,W*0.24,H); g.stroke(); }
};
/* Druckbild vorn: Motiv, Name, Schussstern, Infozeile, F2 */
function thFront(k,motiv){ return (g,W,H)=>{ const a=k.a, rnd=zufallAus(hashStr(k.t+'thema')), info=produktInfo(k.t);
  MOTIV[motiv](g,W,H,rnd);
  g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(W*0.38,H*0.12,W*0.5,H*0.48);
  nameText(g,a.title,W*0.63,H*0.33,W*0.48,Math.round(H*0.24),FNT.bun,'#ffffff',a.bg2,Math.max(2,H*0.03));
  nameText(g,a.sub,W*0.63,H*0.52,W*0.46,Math.round(H*0.1),FNT.bar,a.ac);
  if(info.schuss){ g.save(); g.translate(W*0.92,H*0.2); stern(g,0,0,H*0.16,12,0.78); g.fillStyle=a.ac; g.fill(); g.strokeStyle=a.bg2; g.lineWidth=Math.max(1.5,H*0.012); g.stroke();
    g.fillStyle=a.bg2; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bar(Math.round(H*0.12)); g.fillText(String(info.schuss),0,-H*0.02); g.font=`700 ${Math.round(H*0.04)}px Arial`; g.fillText('SCHUSS',0,H*0.07); g.restore(); }
  g.fillStyle='rgba(4,6,12,.78)'; g.fillRect(0,H*0.78,W,H*0.22); infoZeile(g,W*0.03,H*0.79,W*0.78,H*0.2,info,a.ac,'#ffffff');
  siegel(g,W*0.91,H*0.89,H*0.085,'F'+(P[k.t].cat||2),'#ffffff','#1b1b1b'); }; }
/* Seite: Motiv-Ausschnitt und senkrechter Name */
function thSeite(k,motiv){ return (g,W,H)=>{ const a=k.a; MOTIV[motiv](g,W,H,zufallAus(hashStr(k.t+'seite'))); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,H*0.3,W,H*0.4);
  nameText(g,a.title,W/2,H/2,W*0.9,Math.round(H*0.22),FNT.bun,'#ffffff','rgba(0,0,0,.6)',2); }; }
const druckBlock=(k,motiv,o)=>block(k,Object.assign({vornMaler:thFront(k,motiv),seitenMaler:thSeite(k,motiv)},o||{}));
const V=VP_FORM;
Object.assign(V,{
  /* Tautropfen: Klarsichtfolie, mint Kappen, am Gurt ein Tropfen-Anhaenger */
  lb_tautropfen:t=>{ const k=neu(t), B=druckBlock(k,'tau',{folie:true,deckel:{kappe:(i,j)=>(i+j)%2?'#d8fff0':'#9fffd0'}});
    gurtX(k,0,B.w,B.h,'#9fffd0',0.012); kordel(k,[[B.w/2+0.002,B.h-0.01,0],[B.w/2+0.012,B.h-0.05,0.004],[B.w/2+0.014,B.h-0.07,0.006]],'#e8fff6',0.0012);
    vkugel(k,0.011,8,6,B.w/2+0.014,B.h-0.083,0.006,'#c8fff0',1,1.25,0.7); vzyl(k,0.0001,0.008,0.014,6,B.w/2+0.014,B.h-0.068,0.006,'#c8fff0');
    folie(k); return fertig(k); },
  /* Zitronenfalter: gelber Karton, oben steckt ein Papp-Falter auf einem Draht */
  lb_zitronenfalter:t=>{ const k=neu(t), B=druckBlock(k,'falter',{deckel:{kappe:(i,j)=>(i+2*j)%3?'#fff35c':'#ffffd0',wand:'#d8c84a'}});
    ecken(k,B.w,B.h,B.d,'#fff35c',0.012); vzyl(k,0.0012,0.0012,0.06,4,-B.w*0.3,B.h+0.03,0,'#3a2a10');
    for(const s of [-1,1]){ vbox(k,0.034,0.002,0.026,-B.w*0.3+s*0.018,B.h+0.06,0,'#fff35c',0,0,s*0.45); vbox(k,0.022,0.002,0.018,-B.w*0.3+s*0.014,B.h+0.06,0.02,'#ffe83a',0,0,s*0.45); }
    vzyl(k,0.002,0.002,0.03,5,-B.w*0.3,B.h+0.062,0.008,'#3a2a10',PI/2,0,0); return fertig(k); },
  /* Lavendelfeld: Kraftpapier mit lila Banderole, obendrauf ein Lavendelstraeusschen mit Schleife */
  lb_lavendelfeld:t=>{ const k=neu(t), B=block(k,{vornMaler:pKraft({fn:(g,W,H)=>{ g.save(); g.beginPath(); g.rect(W*0.04,H*0.08,W*0.92,H*0.84); g.clip(); g.translate(W*0.04,H*0.08); thFront(k,'lavendel')(g,W*0.92,H*0.84); g.restore(); }}),seitenMaler:pKraft({}),deckel:{kappe:(i,j)=>(i+j)%2?'#b89cff':'#8a6ad8',wand:'#c8a46a'}});
    const x0=B.w*0.18, z0=0;
    for(let i=0;i<5;i++){ const dx=(i-2)*0.006, rz=(i-2)*0.12; vzyl(k,0.0012,0.0012,0.12,4,x0+dx*2,B.h+0.004,z0+dx,'#4a7a3a',PI/2,0,rz);
      vbox(k,0.006,0.006,0.035,x0+dx*2-Math.sin(rz)*0.05,B.h+0.006,z0+dx-0.062,i%2?'#9a6aff':'#b88cff'); }
    schleife(k,x0,B.h+0.008,z0+0.01,0.028,'#7a3aff',0); return fertig(k); },
  /* Herbstlaub: offene Lattenkiste, vorn ein Druckschild, oben liegen Ahornblaetter */
  lb_herbstlaub:t=>{ const k=neu(t), K=kiste(k,{latten:true,holz:'#b8844a',deckel:false,ex:0.006,ez:0.006});
    W_.schild(k,'thschild',K.W*0.8,K.H*0.62,0,K.H*0.52,K.D/2+0.002,thFront(k,'herbst'));
    const L=['#ff8a2a','#e0381a','#ffc04a','#b84a10'];
    for(let i=0;i<4;i++) vbox(k,0.05,0.002,0.04,(i-1.5)*K.W*0.22,K.H+0.002+i*0.001,(i%2-0.5)*K.D*0.3,L[i],0,i*0.9,0);
    seilgriff(k,1,K.W/2,K.H*0.6,'#c8a46a'); seilgriff(k,-1,-K.W/2,K.H*0.6,'#c8a46a'); return fertig(k); },
  /* Kolibri: schwarzer Glanzkarton, Smaragd-Kanten, Tragegriff */
  lb_kolibri:t=>{ const k=neu(t); k.rauh=0.3; const B=druckBlock(k,'kolibri',{deckel:{kappe:(i,j)=>(i+j)%2?'#3affc0':'#1ab8ff',wand:'#0e2a20'}});
    ecken(k,B.w,B.h,B.d,'#3affc0',0.01); W_.griff(k,0,B.h,B.h+0.05,B.w*0.3,'#101614'); lascheSeite(k,B,0.045,'#ff3a6a'); return fertig(k); },
  /* Vollmond: nachtblauer Karton mit rundem Mondfenster auf die Rohre, Silberring als Hof */
  lb_vollmond:t=>{ const k=neu(t), w=k.w, h=k.h;
    const fk=W_.fensterKarton(k,{vorn:thFront(k,'mond'),vornL:[{x:0.12,y:0.18,w:0.2,h:0.55,form:'kreis'}],seite:thSeite(k,'mond'),rohr:'#2a3050',rohrO:{kopf:'#fff0c8'},deckel:{kappe:'#fff0c8',wand:'#3a4060'},rahmen:'rgba(255,240,200,.95)'});
    vring(k,0.112*w,0.003,4,24,2*PI,-w/2+0.22*w,h-0.455*h,k.d/2+0.003,'#c8d4ff',0,0,0,1,(0.3*h)/(0.112*w),1); return fertig(k); },
  /* Lagune: tuerkis bedruckt, ein Seil rundherum, vorn ein Seestern */
  lb_lagune:t=>{ const k=neu(t), B=druckBlock(k,'lagune',{deckel:{kappe:(i,j)=>(i*2+j)%3?'#5cffe8':'#c8fff4',wand:'#0a4a50'}});
    const yh=B.h*0.86, t2=0.004; kordel(k,[[-B.w/2-t2,yh,-B.d/2-t2],[B.w/2+t2,yh,-B.d/2-t2],[B.w/2+t2,yh,B.d/2+t2],[-B.w/2-t2,yh,B.d/2+t2],[-B.w/2-t2,yh,-B.d/2-t2]],'#d8c08a',0.003);
    for(let i=0;i<5;i++){ const a=i*2*PI/5; vbox(k,0.03,0.012,0.004,B.w*0.36+Math.cos(a)*0.014,B.h*0.2+Math.sin(a)*0.014,B.d/2+0.004,'#ff7a5a',0,0,a); }
    vkugel(k,0.008,6,4,B.w*0.36,B.h*0.2,B.d/2+0.005,'#ff9a6a',1,1,0.5); return fertig(k); },
  /* Sonnenblumen: Karton mit Bluetendeckel - ein Kranz gelber Blaetter um ein braunes Herz */
  lb_sonnenblumen:t=>{ const k=neu(t), B=druckBlock(k,'sonne',{deckel:{kappe:(i,j)=>(i+j)%2?'#ffd83a':'#8a4a12',wand:'#5a3a10'}});
    gurtZ(k,B.w*0.36,B.h,B.d,'#2e6a1e',0.014); const cx=-B.w*0.22, R=Math.min(B.d*0.32,0.09);
    vzyl(k,R*0.5,R*0.5,0.006,12,cx,B.h+0.003,0,'#5a3008');
    for(let i=0;i<12;i++){ const a=i/12*2*PI; vbox(k,R*0.55,0.003,R*0.22,cx+Math.cos(a)*R*0.75,B.h+0.002,Math.sin(a)*R*0.75,i%2?'#ffd83a':'#ffc21e',0,-a,0); }
    return fertig(k); },
  /* Gletscher: Frostfolie, Stahlkanten, obendrauf drei Eisschollen */
  lb_gletscher:t=>{ const k=neu(t), B=druckBlock(k,'eis',{folie:true,deckel:{kappe:(i,j)=>(i+j)%3?'#c8ecff':'#5c9dff',wand:'#e8f4ff'}});
    ecken(k,B.w,B.h,B.d,'#c9ced6',0.016); gurtZ(k,-B.w/2+0.03,B.h,B.d,'#8a929e',0.014); gurtZ(k,B.w/2-0.03,B.h,B.d,'#8a929e',0.014);
    [[-0.2,0.05,0.4],[0.05,-0.04,-0.3],[0.25,0.04,0.9]].forEach(([fx,fz,ry],i)=>vbox(k,B.w*0.16,0.012+i*0.004,B.d*0.32,fx*B.w,B.h+0.008+i*0.002,fz*B.d,i%2?'#d8f0ff':'#ffffff',0.06*(i-1),ry,0.05));
    folie(k); return fertig(k); },
  /* Vulkanausbruch: verkohlte Holzkiste mit roter Banderole, Druckschild vorn, Seilgriffe */
  lb_vulkan:t=>{ const k=neu(t), K=kiste(k,{holz:'#3a2418',ex:0.012,ez:0.006,leisten:true});
    W_.schild(k,'thschild',K.W*0.78,K.H*0.66,0,K.H*0.48,K.D/2+0.003,thFront(k,'vulkan'));
    vbox(k,K.W+0.004,0.022,K.D+0.004,0,K.H*0.9,0,'#d8281a'); vbox(k,K.W+0.006,0.006,K.D+0.006,0,K.H*0.9,0,'#ffb03a');
    seilgriff(k,1,K.W/2,K.H*0.55,'#8a6a40'); seilgriff(k,-1,-K.W/2,K.H*0.55,'#8a6a40'); return fertig(k); }
});
})();

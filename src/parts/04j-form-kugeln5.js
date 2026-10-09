/* =========================================================
   Verpackungen der Kugelbomben-Runde 5 (09.10., Daten 02h, Effekte 14z):
   jede Kugel in ihrer eigenen Schachtel wie Runde 4 (04i) - Effektbild
   rundum, Name mit Schatten, "KUGELBOMBE xxx mm", F4-Zeile; die Form
   erzaehlt den Namen (Fackel, Schatztruhe, Drachennest ...). Wenige
   Dreiecke (Handy).
   ========================================================= */
(function(){
if(typeof VP_FORM==='undefined'||typeof window==='undefined'||!window.VP_WERK||!window.R4_VP) return;
const W_=window.VP_WERK, PI=Math.PI, V=VP_FORM, R4=window.R4_VP;
const {neu,reg,farbe,kasten,druck,fertig,vbox,vzyl,vkugel,vring,kordel,schleife,mantel,kugel,pKraft,mit,ecken,gurtX}=W_;
const {MOTIV,kEtikett,rundDruck,himmel,bruch}=R4;
/* ---------- Motive ---------- */
const flamme=(g,x,y,s,c1,c2)=>{ const gr=g.createRadialGradient(x,y+s*0.35,s*0.05,x,y,s); gr.addColorStop(0,c2); gr.addColorStop(0.5,c1); gr.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gr; g.beginPath(); g.moveTo(x,y-s); g.quadraticCurveTo(x+s*0.7,y,x,y+s*0.6); g.quadraticCurveTo(x-s*0.7,y,x,y-s); g.fill(); };
Object.assign(MOTIV,{
  fackel(g,W,H,r){ himmel(g,W,H,'#2a0804','#0a0201'); g.save(); g.globalCompositeOperation='lighter';
    for(let i=0;i<14;i++){ const x=W*(0.08+r()*0.84), y=H*(0.12+r()*0.4), s=H*(0.06+r()*0.05); flamme(g,x,y,s,'rgba(255,110,20,.9)','rgba(255,240,170,1)');
      for(let k=0;k<5;k++){ g.fillStyle='rgba(255,200,90,.8)'; g.fillRect(x+(r()-0.5)*s,y-s*(1+r()*1.2),1.5,1.5); } } g.restore(); },
  wetter(g,W,H,r){ himmel(g,W,H,'#081a2e','#02060c'); bruch(g,W*0.5,H*0.3,H*0.24,40,'rgba(230,240,255,.95)','rgba(150,230,255,.9)',1.1);
    g.strokeStyle='rgba(200,240,255,.95)'; g.lineWidth=Math.max(1.5,H*0.008); for(let i=0;i<4;i++){ let x=W*(0.15+i*0.23), y=H*0.05; g.beginPath(); g.moveTo(x,y);
      for(let k=0;k<5;k++){ x+=(r()-0.5)*W*0.08; y+=H*0.07; g.lineTo(x,y); } g.stroke(); } },
  schatz(g,W,H,r){ himmel(g,W,H,'#2a1a04','#0a0602'); bruch(g,W*0.5,H*0.3,H*0.26,46,'rgba(255,205,90,.95)','rgba(255,240,180,.9)',1.3,0.35);
    const J=['#ff2a4a','#2aff7a','#3a6aff','#b85cff','#ffb03a','#3affe0']; for(let i=0;i<8;i++){ const a=i/8*2*PI+0.4, x=W*0.5+Math.cos(a)*H*0.2, y=H*0.3+Math.sin(a)*H*0.15, R=H*0.028;
      const gr=g.createRadialGradient(x-R*0.3,y-R*0.3,R*0.1,x,y,R); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.3,J[i%6]); gr.addColorStop(1,'#100808'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,R,0,2*PI); g.fill(); } },
  blueten(g,W,H,r){ himmel(g,W,H,'#2a0a24','#0a0208'); const C=['#ffb0d8','#ffffff','#fff07a','#9cffd0','#9cc8ff'];
    for(let i=0;i<36;i++){ const x=W*(0.1+r()*0.8), y=H*(0.08+r()*0.5), R=H*(0.012+r()*0.02), c=C[i%5];
      for(let k=0;k<6;k++){ const a=k/6*2*PI; g.fillStyle=c; g.beginPath(); g.arc(x+Math.cos(a)*R,y+Math.sin(a)*R,R*0.55,0,2*PI); g.fill(); } g.fillStyle='#ffd23f'; g.beginPath(); g.arc(x,y,R*0.4,0,2*PI); g.fill(); } },
  aurora(g,W,H,r){ himmel(g,W,H,'#020a10','#06140a'); g.save(); g.globalCompositeOperation='lighter';
    for(let i=0;i<5;i++){ const gr=g.createLinearGradient(0,H*0.05,0,H*0.7); gr.addColorStop(0,'rgba(180,90,255,.0)'); gr.addColorStop(0.3,'rgba(180,90,255,.5)'); gr.addColorStop(0.8,'rgba(60,255,150,.55)'); gr.addColorStop(1,'rgba(60,255,150,0)');
      g.fillStyle=gr; g.beginPath(); const x0=W*(i*0.22-0.05); g.moveTo(x0,H*0.05); g.bezierCurveTo(x0+W*0.1,H*0.25,x0-W*0.05,H*0.45,x0+W*0.08,H*0.7); g.lineTo(x0+W*0.2,H*0.7); g.bezierCurveTo(x0+W*0.05,H*0.45,x0+W*0.25,H*0.25,x0+W*0.14,H*0.05); g.fill(); }
    g.restore(); for(let i=0;i<30;i++){ g.fillStyle='rgba(255,255,255,.9)'; g.fillRect(r()*W,r()*H*0.6,1.5,1.5); } },
  sonne(g,W,H,r){ himmel(g,W,H,'#3a1204','#0c0402'); const x=W*0.5, y=H*0.32, R=H*0.12;
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<14;i++){ const a=i/14*2*PI; g.strokeStyle='rgba(255,140,30,.9)'; g.lineWidth=Math.max(2,H*0.014); g.beginPath(); g.moveTo(x+Math.cos(a)*R,y+Math.sin(a)*R);
      g.quadraticCurveTo(x+Math.cos(a+0.3)*R*2.2,y+Math.sin(a+0.3)*R*2.2,x+Math.cos(a+0.1)*R*2.6,y+Math.sin(a+0.1)*R*2.6+H*0.04); g.stroke(); } g.restore();
    const gr=g.createRadialGradient(x,y,R*0.1,x,y,R); gr.addColorStop(0,'#fff6c0'); gr.addColorStop(0.5,'#ffb03a'); gr.addColorStop(1,'#d8281a'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,R,0,2*PI); g.fill(); },
  drache(g,W,H,r){ himmel(g,W,H,'#2a0404','#0a0101'); bruch(g,W*0.5,H*0.32,H*0.24,36,'rgba(255,50,30,.9)','rgba(255,120,40,.9)',1.4);
    for(let i=0;i<26;i++){ const a=r()*2*PI, rr=H*(0.05+r()*0.2); g.fillStyle=i%3?'#ffd23f':'#f2f5ff'; g.beginPath(); g.ellipse(W*0.5+Math.cos(a)*rr,H*0.32+Math.sin(a)*rr,H*0.012,H*0.016,a,0,2*PI); g.fill(); } },
  ringnebel(g,W,H,r){ himmel(g,W,H,'#06102a','#01030a'); const x=W*0.5, y=H*0.32; bruch(g,x,y,H*0.15,36,'rgba(90,140,255,.95)','rgba(240,245,255,.9)',1.3);
    g.strokeStyle='rgba(255,210,70,.95)'; g.lineWidth=Math.max(1.5,H*0.012); g.beginPath(); g.ellipse(x,y,H*0.3,H*0.07,-0.25,0,2*PI); g.stroke(); g.beginPath(); g.ellipse(x,y,H*0.27,H*0.09,0.2,0,2*PI); g.stroke();
    g.fillStyle='#ffffff'; g.beginPath(); g.arc(x,y,H*0.02,0,2*PI); g.fill(); },
  kometen3(g,W,H,r){ himmel(g,W,H,'#041414','#010404'); g.save(); g.globalCompositeOperation='lighter'; const C=['rgba(60,255,140,.95)','rgba(70,120,255,.95)','rgba(255,60,220,.95)'];
    for(let i=0;i<18;i++){ const a=i/18*2*PI, l=H*(0.2+0.08*(i%3)); g.strokeStyle=C[i%3]; g.lineWidth=Math.max(2,H*0.012); g.beginPath(); g.moveTo(W*0.5,H*0.32); g.lineTo(W*0.5+Math.cos(a)*l,H*0.32+Math.sin(a)*l); g.stroke();
      g.fillStyle='#ffffff'; g.beginPath(); g.arc(W*0.5+Math.cos(a)*l,H*0.32+Math.sin(a)*l,H*0.012,0,2*PI); g.fill(); } g.restore(); },
  urknall(g,W,H,r){ g.fillStyle='#000000'; g.fillRect(0,0,W,H); const x=W*0.5, y=H*0.32;
    const gr=g.createRadialGradient(x,y,1,x,y,H*0.3); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.15,'#fff0c0'); gr.addColorStop(0.4,'#ff3a1a'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    bruch(g,x,y,H*0.32,60,'rgba(255,255,255,.95)','rgba(255,200,80,.9)',1.2); }
});
/* ---------- Schachteln ---------- */
Object.assign(V,{
  /* Fackelhimmel 150: hohe Fackelrolle, oben ein roter Wachsdeckel mit Kordel */
  fackelhimmel150:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.004, h=k.h-0.022;
    mantel(k,R,h,0,'rolle',rundDruck(k,'fackel',150),{seg:16,r2:R*0.94});
    vzyl(k,R*0.96,R*0.96,0.022,16,0,h+0.011,0,'#a8180a'); vkugel(k,R*0.5,8,5,0,h+0.02,0,'#c8200c',1,0.35,1);
    kordel(k,[[R*0.94,h*0.8,0],[R*1.02,h*0.55,0],[R*0.96,h*0.3,0]],'#e8c070',0.0016); return fertig(k); },
  /* Wetterleuchten 150: eckiger Metallkoffer, Blitz-Etikett vorn, zwei Spanngurte */
  wetterleuchten150:t=>{ const k=neu(t), w=k.w-0.004, h=k.h-0.004, d=k.d-0.004, e=kEtikett(k,'wetter',150);
    kasten(k,w,h,d,tm(0,h/2,0),{pz:reg(k,'v',w,h,e),nz:'v',px:reg(k,'s',d,h,e),nx:'s',py:farbe(k,'#9aa4b2'),ny:farbe(k,'#2a3038')});
    ecken(k,w,h,d,'#c8d0dc',0.012); gurtX(k,-d*0.3,w,h,'#3a6aff',0.01); gurtX(k,d*0.3,w,h,'#3a6aff',0.01); return fertig(k); },
  /* Schatztruhe 200: Truhe mit gewoelbtem Deckel und Goldbeschlaegen */
  schatztruhe200:t=>{ const k=neu(t), w=k.w-0.006, d=k.d-0.006, hb=k.h*0.62, e=kEtikett(k,'schatz',200,{font:FNT.cin,fg:'#ffe08a'});
    kasten(k,w,hb,d,tm(0,hb/2,0),{pz:reg(k,'v',w,hb,e),nz:'v',px:reg(k,'s',d,hb,e),nx:'s',py:farbe(k,'#3a2208'),ny:farbe(k,'#2a1806')});
    const Rd=d/2; vzyl(k,Rd,Rd,w,14,0,hb,0,'#5a3410',0,0,PI/2,(k.h-hb)/Rd,1,1);
    for(const x of [-w*0.42,0,w*0.42]){ vbox(k,0.012,hb+0.002,d+0.004,x,hb/2,0,'#d9b45a'); vring(k,Rd+0.002,0.004,4,14,PI,x,hb,0,'#d9b45a',0,PI/2,0,1,(k.h-hb)/Rd,1); }
    vbox(k,0.03,0.035,0.006,0,hb*0.9,d/2+0.004,'#e8c060'); return fertig(k); },
  /* Bluetenhagel 200: runde Hutschachtel mit rosa Deckel und Schleife */
  bluetenhagel200:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.004, h=k.h-0.026;
    mantel(k,R,h,0,'dose',rundDruck(k,'blueten',200),{seg:22});
    vzyl(k,R+0.004,R+0.004,0.026,22,0,h+0.013,0,'#ff8ac8'); schleife(k,0,k.h+0.004,0,R*0.9,'#ffffff');
    for(let i=0;i<6;i++){ const a=i/6*2*PI; vkugel(k,0.008,6,4,Math.cos(a)*R*0.6,k.h+0.002,Math.sin(a)*R*0.6,['#ffb0d8','#fff07a','#9cffd0'][i%3],1,0.5,1); }
    return fertig(k); },
  /* Aurora 200: sechseckige Saeule, Deckel in Polarlicht-Violett */
  aurora200:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.003, h=k.h-0.018;
    mantel(k,R,h,0,'saeule',rundDruck(k,'aurora',200),{seg:6}); vzyl(k,R+0.003,R+0.003,0.018,6,0,h+0.009,0,'#6a2aa8',0,PI/6,0);
    vzyl(k,R*0.35,R*0.42,0.012,6,0,k.h+0.004,0,'#3aff9a',0,PI/6,0); return fertig(k); },
  /* Sonnensturm 300: grosse Trommel mit Goldringen, Deckel als Sonne */
  sonnensturm300:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.005, h=k.h-0.025;
    mantel(k,R,h,0,'trommel',rundDruck(k,'sonne',300),{seg:24});
    for(const y of [0.012,h-0.012]) vring(k,R+0.002,0.005,4,24,2*PI,0,y,0,'#d9b45a',PI/2,0,0);
    vzyl(k,R+0.004,R+0.004,0.025,24,0,h+0.0125,0,'#d8661a'); vzyl(k,R*0.45,R*0.45,0.006,16,0,k.h+0.003,0,'#ffd23f');
    for(let i=0;i<10;i++){ const a=i/10*2*PI; vbox(k,R*0.3,0.004,0.012,Math.cos(a)*R*0.65,k.h+0.002,Math.sin(a)*R*0.65,'#ffb03a',0,-a,0); } return fertig(k); },
  /* Drachennest 300: geflochtener Korb, darin die Kugel auf rotem Stroh */
  drachennest300:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.006, H=k.h*0.55;
    mantel(k,R,H,0,'korb',(g,W,Hh)=>{ g.fillStyle='#7a4a1a'; g.fillRect(0,0,W,Hh); for(let y=0;y<Hh;y+=Hh/9) for(let x=0;x<W;x+=W/24){ g.fillStyle=((x/(W/24)+y/(Hh/9))|0)%2?'#a8743a':'#5a3410'; g.fillRect(x,y,W/24-1,Hh/9-1); }
      for(let q=0;q<2;q++){ g.save(); g.translate(q*W/2+W*0.08,Hh*0.1); kEtikett(k,'drache',300)(g,W*0.34,Hh*0.8); g.restore(); } },{seg:20,r2:R*1.08});
    vring(k,R*1.08,0.008,5,20,2*PI,0,H,0,'#8a5a22',PI/2,0,0); vzyl(k,R*1.02,R*1.02,0.012,20,0,H-0.004,0,'#c8281a');
    const Rk=Math.min(R*0.75,(k.h-H)/1.8); kugel(k,Rk,0,H+Rk*0.75,0,{}); return fertig(k); },
  /* Ringnebel 300: Kugel auf einem Sockel, ein schraeger Goldring darum */
  ringnebel300:t=>{ const k=neu(t), w=k.w-0.006, d=k.d-0.006, hb=k.h*0.3, e=kEtikett(k,'ringnebel',300);
    kasten(k,w,hb,d,tm(0,hb/2,0),{pz:reg(k,'v',w,hb,e),nz:'v',px:reg(k,'s',d,hb,e),nx:'s',py:farbe(k,'#0a1a3a'),ny:farbe(k,'#06102a')});
    const Rk=Math.min(w,d)*0.33; kugel(k,Rk,0,hb+Rk+0.004,0,{});
    vring(k,Rk*1.45,0.005,4,26,2*PI,0,hb+Rk+0.004,0,'#d9b45a',PI/2-0.35,0,0.2); return fertig(k); },
  /* Kometensturm 300: drei Rollen im Dreieck (gruen, blau, magenta), zusammengegurtet */
  kometensturm300:t=>{ const k=neu(t), r=Math.min(k.w,k.d)*0.23, h=k.h-0.016, C=['#1a8a4a','#2a4aaa','#a82a8a'];
    for(let i=0;i<3;i++){ const a=-PI/2+i*2*PI/3, x=Math.cos(a)*r*1.12, z=-Math.sin(a)*r*1.12;
      mantel(k,r,h,0,'rolle'+i,rundDruck(k,'kometen3',300),{seg:14,x,z}); vzyl(k,r+0.002,r+0.002,0.016,14,x,h+0.008,z,C[i]); }
    vring(k,r*2.2,0.004,4,24,2*PI,0,h*0.5,0,'#d9b45a',PI/2,0,0); return fertig(k); },
  /* Urknall 300: schwere schwarze Kiste mit Warnstreifen und Stahlecken */
  urknall300:t=>{ const k=neu(t), w=k.w-0.004, h=k.h-0.004, d=k.d-0.004, e=kEtikett(k,'urknall',300,{fg:'#ffffff'});
    const warn=reg(k,'warn',d,h,(g,W,Hh)=>{ g.fillStyle='#111'; g.fillRect(0,0,W,Hh); g.fillStyle='#ffd21a'; for(let x=-Hh;x<W;x+=W/6){ g.beginPath(); g.moveTo(x,Hh); g.lineTo(x+W/12,Hh); g.lineTo(x+W/12+Hh*0.3,Hh*0.7); g.lineTo(x+Hh*0.3,Hh*0.7); g.fill(); }
      g.fillStyle='#ffffff'; g.font=`700 ${Math.round(Hh*0.09)}px Arial`; g.textAlign='center'; g.fillText('MAXIMUM',W/2,Hh*0.35); g.fillText('300 mm',W/2,Hh*0.5); });
    kasten(k,w,h,d,tm(0,h/2,0),{pz:reg(k,'v',w,h,e),nz:'v',px:warn,nx:warn,py:farbe(k,'#151515'),ny:farbe(k,'#0a0a0a')});
    ecken(k,w,h,d,'#8a929e',0.018); gurtX(k,0,w,h,'#d8281a',0.014); return fertig(k); }
});
})();

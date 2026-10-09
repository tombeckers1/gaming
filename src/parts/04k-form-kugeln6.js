/* =========================================================
   Verpackungen der Kugelbomben-Runde 6 (09.10., Daten 02i, Effekte 14z2):
   die acht neuen 300-mm-Kugeln, jede in eigener Schachtel wie Runde 5
   (04j) - Effektbild rundum, Name, "KUGELBOMBE 300 mm"; die Form erzaehlt
   den Namen. Wenige Dreiecke (Handy).
   ========================================================= */
(function(){
if(typeof VP_FORM==='undefined'||typeof window==='undefined'||!window.VP_WERK||!window.R4_VP) return;
const W_=window.VP_WERK, PI=Math.PI, V=VP_FORM, R4=window.R4_VP;
const {neu,reg,farbe,kasten,fertig,vbox,vzyl,vkugel,vring,schleife,mantel,kugel,ecken,gurtX}=W_;
const {MOTIV,kEtikett,rundDruck,himmel,bruch}=R4;
Object.assign(MOTIV,{
  herbst(g,W,H,r){ himmel(g,W,H,'#3a1404','#0c0402'); bruch(g,W*0.5,H*0.28,H*0.22,40,'rgba(255,190,80,.95)','rgba(255,120,30,.9)',1.2,0.3);
    for(let i=0;i<22;i++){ const x=W*(0.08+r()*0.84), y=H*(0.3+r()*0.4), s=H*(0.018+r()*0.012), a=r()*PI;
      g.save(); g.translate(x,y); g.rotate(a); g.fillStyle=['#ff9a2a','#ffd23f','#e8461a'][i%3]; g.beginPath(); g.ellipse(0,0,s*1.6,s*0.8,0,0,2*PI); g.fill(); g.restore(); } },
  eis(g,W,H,r){ himmel(g,W,H,'#06203a','#01060c'); const x=W*0.5, y=H*0.32;
    for(let i=0;i<60;i++){ const a=r()*2*PI, rr=H*(0.05+r()*0.22); g.fillStyle=i%3?'#bfe8ff':'#ffffff'; g.fillRect(x+Math.cos(a)*rr,y+Math.sin(a)*rr,2,2); }
    g.strokeStyle='rgba(220,245,255,.9)'; g.lineWidth=Math.max(1,H*0.006); for(let i=0;i<6;i++){ const a=i/6*2*PI; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*H*0.12,y+Math.sin(a)*H*0.12); g.stroke(); } },
  faust(g,W,H,r){ himmel(g,W,H,'#141418','#040406'); const x=W*0.5, y=H*0.42;
    const gr=g.createRadialGradient(x,y,1,x,y,H*0.18); gr.addColorStop(0,'#ffffff'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H);
    const C=['#ff3a2a','#ffc83a','#3aff6a','#3a7aff','#c85cff']; for(let k=0;k<5;k++){ const a=PI*(1.12+0.19*k), ex=x+Math.cos(a)*H*0.28, ey=y+Math.sin(a)*H*0.3;
      g.strokeStyle='rgba(255,230,180,.8)'; g.lineWidth=2; g.beginPath(); g.moveTo(x,y); g.lineTo(ex,ey); g.stroke(); bruch(g,ex,ey,H*0.07,18,C[k],'#ffffff',1); } },
  lava(g,W,H,r){ himmel(g,W,H,'#3a0804','#0a0101'); bruch(g,W*0.5,H*0.25,H*0.18,34,'rgba(255,60,20,.95)','rgba(255,160,40,.9)',1.2);
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<12;i++){ const a=PI*(0.15+0.7*r()), x0=W*0.5, y0=H*0.25, l=H*(0.25+r()*0.2);
      const gr=g.createLinearGradient(x0,y0,x0+Math.cos(a)*l,y0+Math.sin(a)*l); gr.addColorStop(0,'rgba(255,200,80,.9)'); gr.addColorStop(1,'rgba(200,30,0,.2)');
      g.strokeStyle=gr; g.lineWidth=Math.max(2,H*0.016); g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0+Math.cos(a)*l,y0+Math.sin(a)*l); g.stroke(); } g.restore(); },
  galaxie(g,W,H,r){ himmel(g,W,H,'#0a1030','#010208'); const x=W*0.5, y=H*0.32; g.save(); g.globalCompositeOperation='lighter';
    for(let i=0;i<220;i++){ const arm=i%2, u=r(), th=arm*PI+u*4.2+(r()-0.5)*0.4, rr=H*0.03+u*H*0.26; g.fillStyle=u<0.45?'rgba(255,210,90,.9)':'rgba(140,180,255,.9)';
      g.fillRect(x+Math.cos(th)*rr,y+Math.sin(th)*rr*0.55,2,2); } const gr=g.createRadialGradient(x,y,1,x,y,H*0.06); gr.addColorStop(0,'#ffffff'); gr.addColorStop(1,'rgba(255,240,200,0)'); g.fillStyle=gr; g.fillRect(x-H*0.1,y-H*0.1,H*0.2,H*0.2); g.restore(); },
  flut(g,W,H,r){ himmel(g,W,H,'#04203a','#01060c'); const C=['rgba(110,200,255,.9)','rgba(255,210,70,.9)','rgba(240,245,255,.9)'];
    for(let k=0;k<3;k++){ g.strokeStyle=C[k]; g.lineWidth=Math.max(2,H*0.01); g.beginPath(); for(let i=0;i<=40;i++){ const x=i/40*W, y=H*(0.2+k*0.14)+Math.sin(i/40*PI*3+k)*H*0.04; i?g.lineTo(x,y):g.moveTo(x,y); } g.stroke();
      for(let i=0;i<14;i++){ g.fillStyle=C[k]; g.fillRect(r()*W,H*(0.22+k*0.14)+r()*H*0.1,1.5,1.5); } } },
  goetter(g,W,H,r){ himmel(g,W,H,'#2a0404','#000000'); bruch(g,W*0.5,H*0.48,H*0.1,24,'rgba(255,40,20,.95)','rgba(255,90,60,.9)',1);
    bruch(g,W*0.5,H*0.32,H*0.15,30,'rgba(255,200,70,.95)','rgba(255,230,140,.9)',1.2,0.3); bruch(g,W*0.5,H*0.14,H*0.2,44,'rgba(255,255,255,.95)','rgba(220,225,240,.9)',1.2); },
  sturz(g,W,H,r){ g.fillStyle='#000'; g.fillRect(0,0,W,H); const x=W*0.5, y=H*0.2;
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<40;i++){ const a=PI*(0.05+0.9*i/39); g.strokeStyle='rgba(255,200,80,.7)'; g.lineWidth=Math.max(1.5,H*0.008);
      g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+Math.cos(a)*H*0.35,y-H*0.05,x+Math.cos(a)*H*0.45,y+H*0.6); g.stroke(); } g.restore();
    const gr=g.createRadialGradient(x,y,1,x,y,H*0.12); gr.addColorStop(0,'#ffffff'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,W,H*0.5); }
});
const kiste=(t,mot,c1,c2,deko)=>{ const k=neu(t), w=k.w-0.004, h=k.h-0.004, d=k.d-0.004, e=kEtikett(k,mot,300);
  kasten(k,w,h,d,tm(0,h/2,0),{pz:reg(k,'v',w,h,e),nz:'v',px:reg(k,'s',d,h,e),nx:'s',py:farbe(k,c1),ny:farbe(k,c2)}); if(deko) deko(k,w,h,d); return fertig(k); };
Object.assign(V,{
  /* Herbststurm: Holzkiste mit Laubrand und Hanfgurt */
  herbststurm300:t=>kiste(t,'herbst','#6a3a10','#3a1a06',(k,w,h,d)=>{ ecken(k,w,h,d,'#a8743a',0.014); gurtX(k,0,w,h,'#c8a060',0.012); }),
  /* Eiszeit: eisblaue Trommel mit weissem Reif */
  eiszeit300:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.005, h=k.h-0.02;
    mantel(k,R,h,0,'trommel',rundDruck(k,'eis',300),{seg:22}); vzyl(k,R+0.004,R+0.004,0.02,22,0,h+0.01,0,'#e8f6ff');
    for(const y of [0.014,h-0.014]) vring(k,R+0.003,0.005,4,22,2*PI,0,y,0,'#9ce8ff',PI/2,0,0); return fertig(k); },
  /* Titanenfaust: Stahlkiste mit Nieten-Ecken und rotem Gurt */
  titanenfaust300:t=>kiste(t,'faust','#9aa4b2','#3a4048',(k,w,h,d)=>{ ecken(k,w,h,d,'#d0d8e2',0.02); gurtX(k,-d*0.25,w,h,'#c8281a',0.012); gurtX(k,d*0.25,w,h,'#c8281a',0.012); }),
  /* Lavastrom: schwarze Rolle mit Glut-Deckel */
  lavastrom300:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.005, h=k.h-0.024;
    mantel(k,R,h,0,'rolle',rundDruck(k,'lava',300),{seg:20}); vzyl(k,R+0.004,R+0.004,0.024,20,0,h+0.012,0,'#c8281a'); vkugel(k,R*0.4,10,6,0,h+0.03,0,'#ff6a1a',1,0.4,1); return fertig(k); },
  /* Galaxie: flache Sternenkiste mit goldenem Ring obenauf */
  galaxie300:t=>kiste(t,'galaxie','#0a1030','#04081a',(k,w,h,d)=>{ vring(k,Math.min(w,d)*0.32,0.005,4,24,2*PI,0,h+0.004,0,'#d9b45a',0,0,0); }),
  /* Sturmflut: blaue Trommel mit Goldwelle */
  sturmflut300:t=>{ const k=neu(t), R=Math.min(k.w,k.d)/2-0.005, h=k.h-0.02;
    mantel(k,R,h,0,'trommel',rundDruck(k,'flut',300),{seg:22}); vzyl(k,R+0.004,R+0.004,0.02,22,0,h+0.01,0,'#1a5aa8');
    vring(k,R+0.003,0.005,4,22,2*PI,0,h*0.5,0,'#d9b45a',PI/2,0,0.12); return fertig(k); },
  /* Goetterdaemmerung: hohe schwarze Kiste mit drei roten Gurten */
  goetterdaemmerung300:t=>kiste(t,'goetter','#1a0606','#0a0202',(k,w,h,d)=>{ ecken(k,w,h,d,'#8a6a2a',0.016); for(const z of [-0.3,0,0.3]) gurtX(k,d*z,w,h,'#a8181a',0.01); }),
  /* Himmelssturz: die schwerste Kiste - Gold auf Schwarz, Stahlecken, Schleife */
  himmelssturz300:t=>kiste(t,'sturz','#151515','#0a0a0a',(k,w,h,d)=>{ ecken(k,w,h,d,'#d9b45a',0.02); gurtX(k,0,w,h,'#d9b45a',0.016); schleife(k,0,h+0.006,0,Math.min(w,d)*0.35,'#d9b45a'); })
});
})();

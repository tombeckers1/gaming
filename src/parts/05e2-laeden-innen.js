/* =========================================================
   Laeden gegenueber mit echtem Innenraum (Tom, 26.09.: "es soll
   wirklich so aussehen, als sind da Laeden drin, gerne 3D").
   08.10. (Tom: "guck dir an, wie so ein Laden in echt aussieht, und
   mach das so realistisch wie moeglich" - vorher grosse einfarbige
   Flaechen, z. B. die Apotheke): alle Innenraeume teilen sich EINEN
   gemalten Textur-Atlas (Boeden, Fliesen, Regalware, Plakate, Theken,
   Maschinen). Damit bleibt es bei einem Material und einem Mesh je
   Laden (plus Leuchten), die Ware ist aber bedruckt: Sichtwahl mit
   gestapelten Packungen, Brotregal, Fleischauslage, Brillenwand,
   Buecherruecken, Waschmaschinen mit Bullauge ...
   Vorlage: echte deutsche Ladenlokale (Ladenbau-Seiten, Apotheken-
   Sichtwahl hinter dem HV-Tisch, Brotregal an der Rueckwand hinter
   der Theke, Bedientheke mit schraeger Auslage in der Metzgerei).
   Ausschnitte ohne Ware (Hintergrund der Regalreihen) sind
   durchsichtig (alphaTest) - so stehen Packungen und Brote mit echter
   Kontur im Regal, auch auf einem einzigen Rechteck.
   Zufall: der Atlas und die Einrichtung wuerfeln mit einem eigenen
   Zufall - buildStreet laeuft mit festem Seed ueber Math.random, und
   jeder zusaetzliche Aufruf haette die ganze Strasse dahinter
   umgebaut. Was die alte Einrichtung verbraucht hat, wird am Ende
   nachgezogen (_altZufall), damit Haeuser und Laeden bleiben, wo Tom
   sie kennt.
   ========================================================= */
function iaRng(s){ return ()=>{ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^(s>>>15),1|s); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
const IA={W:2048,H:2048,PAD:6,K:{},tex:null};
/* Schriften: Barlow ist geladen, der Rest faellt sauber zurueck */
const iaF=(s,w)=>`${w||700} ${s}px "Barlow Condensed", Arial, sans-serif`, iaS=s=>`700 ${s}px Georgia, "Times New Roman", serif`, iaK=s=>`${s}px "Segoe Print", "Comic Sans MS", cursive`;
const iaHsl=(h,s,l,a)=>a===undefined?`hsl(${h|0},${s|0}%,${l|0}%)`:`hsla(${h|0},${s|0}%,${l|0}%,${a})`;
function iaText(g,t,x,y,font,col,al,maxW){ g.font=font; g.fillStyle=col; g.textAlign=al||'left'; g.textBaseline='middle'; if(maxW) g.fillText(t,x,y,maxW); else g.fillText(t,x,y); }
/* kleine graue Textzeilen (Kleingedrucktes), aus der Naehe wie Schrift */
function iaZeilen(g,x,y,w,n,col,dy){ g.fillStyle=col; for(let i=0;i<n;i++) g.fillRect(x,y+i*(dy||3),w*(i===n-1?0.6:1),1); }
function iaKante(g,x,y,w,h,s){ /* Licht oben, Schatten rechts: Packung wirkt koerperlich */
  g.fillStyle=`rgba(255,255,255,${0.35*(s||1)})`; g.fillRect(x,y,w,1);
  g.fillStyle=`rgba(0,0,0,${0.22*(s||1)})`; g.fillRect(x+w-2,y,2,h); g.fillStyle=`rgba(0,0,0,${0.3*(s||1)})`; g.fillRect(x,y+h-1,w,1); }
/* Eine Regalreihe: Produkte in Bloecken (2-5 gleiche nebeneinander,
   "Masse verkauft Masse"), unten buendig, Rest durchsichtig */
function iaReihe(g,w,h,r,mk){ let x=1+r()*3;
  while(x<w-8){ const it=mk(r); const n=it.n||1;
    for(let i=0;i<n;i++){ if(x+it.w>w-1) break; it.draw(g,Math.round(x),h-it.h,it.w,it.h,i); x+=it.w+(it.gap===undefined?1:it.gap); }
    x+=it.luecke===undefined?2:it.luecke; } }
const IA_BUNT=[[4,70,48],[211,65,40],[140,45,36],[45,90,52],[350,55,42],[200,70,55],[28,80,50],[275,35,45],[160,60,35],[0,0,20],[50,15,85]];
/* ---------- Malfunktionen der Kacheln ---------- */
const IA_MAL={
  weiss:(g,w,h)=>{ g.fillStyle='#fff'; g.fillRect(0,0,w,h); },
  /* Boeden: eine Kachel = 1,2 m */
  boden_hell:(g,w,h,r)=>{ const n=4, s=w/n; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const l=80+r()*5; g.fillStyle=iaHsl(38,10,l); g.fillRect(i*s,j*s,s,s);
      for(let k=0;k<40;k++){ g.fillStyle=`rgba(${r()<0.5?60:255},${r()<0.5?55:250},50,${r()*0.08})`; g.fillRect(i*s+r()*s,j*s+r()*s,2,2); } }
    g.fillStyle='#9a958b'; for(let i=0;i<=n;i++){ g.fillRect(i*s-1,0,2,h); g.fillRect(0,i*s-1,w,2); } },
  boden_grau:(g,w,h,r)=>{ const n=2, s=w/n; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const l=40+r()*6; g.fillStyle=iaHsl(210,4,l); g.fillRect(i*s,j*s,s,s);
      for(let k=0;k<300;k++){ g.fillStyle=`rgba(${r()<0.5?0:255},${r()<0.5?0:255},${r()<0.5?0:255},${r()*0.06})`; g.fillRect(i*s+r()*s,j*s+r()*s,2,2); } }
    g.fillStyle='#2c2d2f'; for(let i=0;i<=n;i++){ g.fillRect(i*s-1,0,2,h); g.fillRect(0,i*s-1,w,2); } },
  boden_holz:(g,w,h,r)=>{ const n=8, s=h/n; for(let j=0;j<n;j++){ let x=-r()*w*0.6; while(x<w){ const L=w*(0.45+r()*0.5), l=38+r()*14;
        const gr=g.createLinearGradient(0,j*s,0,j*s+s); gr.addColorStop(0,iaHsl(28,45,l+3)); gr.addColorStop(1,iaHsl(26,48,l-4)); g.fillStyle=gr; g.fillRect(x,j*s,L,s);
        for(let k=0;k<7;k++){ g.strokeStyle=`rgba(60,32,14,${0.12+r()*0.15})`; g.lineWidth=1; g.beginPath(); const y=j*s+2+r()*(s-4); g.moveTo(x,y); g.bezierCurveTo(x+L*0.3,y+r()*4-2,x+L*0.6,y+r()*4-2,x+L,y); g.stroke(); }
        g.fillStyle='rgba(30,16,8,.55)'; g.fillRect(x+L-1,j*s,2,s); x+=L; }
      g.fillStyle='rgba(30,16,8,.6)'; g.fillRect(0,j*s+s-1,w,2); } },
  boden_terrakotta:(g,w,h,r)=>{ const n=4, s=w/n; g.fillStyle='#cfc4b2'; g.fillRect(0,0,w,h);
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){ g.fillStyle=iaHsl(16+r()*8,48,36+r()*8); g.fillRect(i*s+2,j*s+2,s-4,s-4);
      for(let k=0;k<60;k++){ g.fillStyle=`rgba(${r()<0.5?70:220},${r()<0.5?30:160},20,${r()*0.12})`; g.fillRect(i*s+2+r()*(s-6),j*s+2+r()*(s-6),3,3); } } },
  boden_terrazzo:(g,w,h,r)=>{ g.fillStyle='#d6d0c4'; g.fillRect(0,0,w,h);
    for(let k=0;k<2600;k++){ const c=r(); g.fillStyle=c<0.4?'rgba(120,112,100,.5)':c<0.7?'rgba(250,248,242,.7)':c<0.85?'rgba(160,90,70,.4)':'rgba(60,60,64,.5)'; const s2=1+r()*3; g.fillRect(r()*w,r()*h,s2,s2); }
    g.fillStyle='rgba(90,86,80,.6)'; g.fillRect(0,0,w,1); g.fillRect(0,0,1,h); g.fillRect(w/2,0,1,h); g.fillRect(0,h/2,w,1); },
  boden_teppich:(g,w,h,r)=>{ for(let i=0;i<2;i++) for(let j=0;j<2;j++){ g.fillStyle=iaHsl(215,22,30+((i+j)%2)*3); g.fillRect(i*w/2,j*h/2,w/2,h/2); }
    for(let k=0;k<5000;k++){ g.fillStyle=`rgba(${r()<0.5?10:200},${r()<0.5?20:210},${r()<0.5?40:230},${r()*0.08})`; g.fillRect(r()*w,r()*h,1,2); } },
  boden_rot:(g,w,h,r)=>{ const n=8, s=w/n; g.fillStyle='#3a2a24'; g.fillRect(0,0,w,h);
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){ g.fillStyle=iaHsl(12,40,30+r()*6); g.fillRect(i*s+1,j*s+1,s-2,s-2);
      g.fillStyle='rgba(0,0,0,.12)'; for(let k=0;k<6;k++) g.fillRect(i*s+2+r()*(s-6),j*s+2+r()*(s-6),2,2); } },
  wand_fliese:(g,w,h,r)=>{ const n=8, s=w/n; g.fillStyle='#bdbcb6'; g.fillRect(0,0,w,h);
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const gr=g.createLinearGradient(i*s,j*s,i*s+s,j*s+s); gr.addColorStop(0,'#fbfbf8'); gr.addColorStop(1,iaHsl(50,8,88+r()*4)); g.fillStyle=gr; g.fillRect(i*s+1,j*s+1,s-2,s-2);
      g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(i*s+3,j*s+3,s*0.4,1); } },
  wand_backstein:(g,w,h,r)=>{ g.fillStyle='#b9ad9a'; g.fillRect(0,0,w,h); const bh=18, bw=60;
    for(let j=0;j*bh<h;j++) for(let x=(j%2)*-bw/2;x<w;x+=bw){ g.fillStyle=iaHsl(10+r()*14,40+r()*15,30+r()*12); g.fillRect(x+2,j*bh+2,bw-3,bh-3);
      g.fillStyle='rgba(0,0,0,.15)'; g.fillRect(x+2,j*bh+bh-3,bw-3,2); g.fillStyle='rgba(255,230,200,.08)'; g.fillRect(x+2,j*bh+2,bw-3,2); } },
  holz:(g,w,h,r)=>{ g.fillStyle='#ad7a48'; g.fillRect(0,0,w,h);
    for(let k=0;k<90;k++){ g.strokeStyle=`rgba(${r()<0.5?60:180},${r()<0.5?30:120},${r()<0.5?10:70},${0.15+r()*0.2})`; g.lineWidth=1+r(); const x=r()*w; g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x+r()*10-5,h*0.3,x+r()*10-5,h*0.7,x+r()*6-3,h); g.stroke(); } },
  /* ---------- Regalreihen (1,6 m x 0,4 m, durchsichtiger Hintergrund) ---------- */
  medi1:(g,w,h,r)=>iaReihe(g,w,h,r,iaMedi), medi2:(g,w,h,r)=>iaReihe(g,w,h,r,iaMedi),
  kosmetik:(g,w,h,r)=>iaReihe(g,w,h,r,iaKosm),
  zigaretten:(g,w,h,r)=>{ /* Schachteln in senkrechten Schaechten, dicht an dicht */
    let x=2; while(x<w-18){ const hu=pickR(r,[0,0,210,0,355,45,200,120]), sat=hu?50:0, l=hu?45:pickR(r,[92,20,96]), n=2+(r()*3|0);
      for(let i=0;i<n&&x<w-18;i++){ for(let y=h-30;y>4;y-=30){ g.fillStyle=iaHsl(hu,sat,l); g.fillRect(x,y,17,29); g.fillStyle='rgba(40,30,25,.85)'; g.fillRect(x,y+14,17,15);
          g.fillStyle=pickR(r,['#7a5040','#4a3a3a','#6a6050']); g.fillRect(x+2,y+16,13,8); g.fillStyle='#f2f2f2'; g.fillRect(x+2,y+3,13,3); iaKante(g,x,y,17,29,0.6); } x+=18; } x+=3; } },
  suess:(g,w,h,r)=>iaReihe(g,w,h,r,r2=>{ const c=pickR(r2,IA_BUNT), bw=14+(r2()*26|0), bh=24+(r2()*40|0), tuete=r2()<0.4;
    return {w:bw,h:bh,n:2+(r2()*3|0),draw:(g,x,y,w2,h2)=>{ g.fillStyle=iaHsl(c[0],c[1],c[2]); if(tuete){ g.beginPath(); g.moveTo(x+2,y); g.lineTo(x+w2-2,y); g.lineTo(x+w2,y+h2); g.lineTo(x,y+h2); g.fill(); } else g.fillRect(x,y,w2,h2);
      g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(x+2,y+h2*0.3,w2-4,h2*0.18); g.fillStyle=iaHsl(c[0]+40,80,55); g.beginPath(); g.arc(x+w2/2,y+h2*0.68,Math.min(w2,h2)*0.18,0,7); g.fill(); iaKante(g,x,y,w2,h2,0.7); }}; }),
  buch1:(g,w,h,r)=>iaReihe(g,w,h,r,iaBuch), buch2:(g,w,h,r)=>iaReihe(g,w,h,r,iaBuch),
  ordner:(g,w,h,r)=>iaReihe(g,w,h,r,r2=>{ const c=pickR(r2,[[215,60,35],[0,65,40],[0,0,15],[140,40,30],[48,85,50],[200,10,60]]);
    return {w:24,h:100,n:3+(r2()*5|0),gap:0,luecke:3,draw:(g,x,y,w2,h2)=>{ g.fillStyle=iaHsl(c[0],c[1],c[2]); g.fillRect(x,y,w2,h2); g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(x+2,y,2,h2);
      g.fillStyle='#f4f2ea'; g.fillRect(x+4,y+12,w2-8,34); iaZeilen(g,x+6,y+16,w2-12,4,'#555',4); g.fillStyle='rgba(0,0,0,.6)'; g.beginPath(); g.arc(x+w2/2,y+h2-22,5,0,7); g.fill(); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+w2-1,y,1,h2); }}; }),
  hefte:(g,w,h,r)=>iaReihe(g,w,h,r,r2=>{ const c=pickR(r2,IA_BUNT), st=r2()<0.5; /* Stehsammler oder Stapel Bloecke */
    return st?{w:30,h:96,n:2+(r2()*3|0),draw:(g,x,y,w2,h2)=>{ for(let k=0;k<6;k++){ g.fillStyle=iaHsl(c[0]+k*25,c[1],c[2]+k*3); g.fillRect(x+k*5,y+4,5,h2-4); } g.fillStyle='rgba(30,30,30,.85)'; g.fillRect(x,y+h2*0.45,w2,h2*0.55); }}
      :{w:46,h:40,n:1+(r2()*3|0),draw:(g,x,y,w2,h2)=>{ for(let k=0;k*4<h2;k++){ g.fillStyle=k%2?'#f4f2ec':iaHsl(c[0],c[1],c[2]+(k%3)*4); g.fillRect(x,y+k*4,w2,4); } iaKante(g,x,y,w2,h2,0.6); }}; }),
  haar:(g,w,h,r)=>iaReihe(g,w,h,r,r2=>{ const dunkel=r2()<0.5, gold=r2()<0.3, f=gold?'#c9a14e':dunkel?'#1c1c1e':'#f4f2ee', bw=14+(r2()*12|0), bh=40+(r2()*44|0), pumpe=r2()<0.4;
    return {w:bw,h:bh,n:2+(r2()*3|0),gap:3,draw:(g,x,y,w2,h2)=>{ const gr=g.createLinearGradient(x,0,x+w2,0); gr.addColorStop(0,f); gr.addColorStop(0.3,'rgba(255,255,255,.55)'); gr.addColorStop(0.4,f); gr.addColorStop(1,f);
      g.fillStyle=gr; g.fillRect(x,y+(pumpe?12:5),w2,h2-(pumpe?12:5)); g.fillStyle=dunkel?'#c9a14e':'#1c1c1e'; g.fillRect(x+w2*0.25,y+(pumpe?6:0),w2*0.5,pumpe?7:6); if(pumpe) g.fillRect(x+w2*0.4,y,w2*0.6,3);
      g.fillStyle=dunkel?'#e8e2d0':'#2a2a2a'; g.fillRect(x+2,y+h2*0.45,w2-4,2); g.fillRect(x+3,y+h2*0.55,w2-6,1); }}; }),
  brote:(g,w,h,r)=>iaReihe(g,w,h,r,iaBrot),
  broetchen:(g,w,h,r)=>{ /* Weidenkoerbe mit Broetchen und Brezeln */
    let x=2; while(x<w-60){ const kw=70+r()*40, art=r(); const ky=h-34;
      for(let k=0;k<26;k++){ const bx=x+6+r()*(kw-14), by=ky-6+r()*10, rr=7+r()*4; const l=art<0.33?45:art<0.66?32:52;
        if(art>0.66&&r()<0.5){ g.strokeStyle=iaHsl(25,60,28); g.lineWidth=4; g.beginPath(); g.arc(bx,by,rr,0.2,Math.PI-0.2); g.moveTo(bx-rr*0.9,by); g.lineTo(bx+rr*0.6,by-rr*0.8); g.moveTo(bx+rr*0.9,by); g.lineTo(bx-rr*0.6,by-rr*0.8); g.stroke(); continue; }
        const gr=g.createRadialGradient(bx-rr*0.3,by-rr*0.4,1,bx,by,rr); gr.addColorStop(0,iaHsl(36,60,l+18)); gr.addColorStop(1,iaHsl(28,55,l)); g.fillStyle=gr; g.beginPath(); g.ellipse(bx,by,rr*1.2,rr*0.8,0,0,7); g.fill();
        if(art<0.33){ g.strokeStyle='rgba(250,235,200,.6)'; g.lineWidth=1; g.beginPath(); g.moveTo(bx-rr*0.6,by-1); g.lineTo(bx+rr*0.6,by-2); g.stroke(); } else if(art<0.66){ g.fillStyle='rgba(240,230,200,.8)'; for(let s=0;s<5;s++) g.fillRect(bx-rr+r()*rr*2,by-rr*0.6+r()*rr,1.5,1.5); } }
      g.fillStyle='#8a6034'; g.beginPath(); g.moveTo(x,ky); g.lineTo(x+kw,ky); g.lineTo(x+kw-6,h); g.lineTo(x+6,h); g.fill();
      g.strokeStyle='rgba(60,36,14,.6)'; g.lineWidth=1; for(let y=ky+3;y<h;y+=4){ g.beginPath(); g.moveTo(x+2,y); g.lineTo(x+kw-2,y); g.stroke(); } for(let xx=x+5;xx<x+kw;xx+=6){ g.beginPath(); g.moveTo(xx,ky); g.lineTo(xx,h); g.stroke(); }
      g.fillStyle='#f6f2e8'; g.fillRect(x+kw/2-14,ky+8,28,14); iaText(g,(0.35+((r()*8)|0)*0.1).toFixed(2).replace('.',',')+' €',x+kw/2,ky+15,iaF(11),'#222','center');
      x+=kw+6; } },
  kuchen:(g,w,h,r)=>{ /* Kuchenstuecke auf Tortenplatten mit Preisclip */
    let x=2; while(x<w-60){ const pw=80+r()*30, art=r(), py=h-10; g.fillStyle='#d8dade'; g.fillRect(x,py,pw,4); g.fillStyle='#9aa0a8'; g.fillRect(x,py+4,pw,2);
      for(let k=0;k<3;k++){ const sx=x+4+k*(pw-8)/3, sw=(pw-8)/3-3, sh=34+r()*14;
        if(art<0.3){ g.fillStyle='#e9d29a'; g.fillRect(sx,py-sh,sw,sh); g.fillStyle='#f6eedc'; g.fillRect(sx,py-sh*0.7,sw,sh*0.35); g.fillStyle='#c8322a'; for(let s=0;s<4;s++){ g.beginPath(); g.arc(sx+4+s*(sw-8)/3,py-sh-2,3,0,7); g.fill(); } }
        else if(art<0.55){ g.fillStyle='#3a2216'; g.fillRect(sx,py-sh,sw,sh); g.fillStyle='#f4ece0'; g.fillRect(sx,py-sh*0.62,sw,5); g.fillRect(sx,py-sh*0.3,sw,5); g.fillStyle='#f8f4ee'; g.fillRect(sx,py-sh-4,sw,5); g.fillStyle='#8a1020'; g.beginPath(); g.arc(sx+sw/2,py-sh-6,3.5,0,7); g.fill(); }
        else if(art<0.8){ g.fillStyle='#f2dc9e'; g.fillRect(sx,py-sh*0.8,sw,sh*0.8); g.fillStyle='#c8913e'; g.fillRect(sx,py-sh*0.8,sw,4); }
        else { g.fillStyle='#d9a45a'; g.fillRect(sx,py-sh*0.5,sw,sh*0.5); g.fillStyle='#f0d68a'; for(let s=0;s<14;s++) g.fillRect(sx+r()*(sw-3),py-sh*0.5-3+r()*5,3,3); } }
      g.fillStyle='#fff'; g.fillRect(x+pw/2-13,py-62,26,13); iaText(g,(2.2+((r()*14)|0)*0.1).toFixed(2).replace('.',','),x+pw/2,py-55,iaF(11),'#222','center');
      g.fillStyle='#9aa0a8'; g.fillRect(x+pw/2-1,py-49,2,8);
      x+=pw+8; } },
  flaschen:(g,w,h,r)=>iaReihe(g,w,h,r,r2=>iaFlasche(r2,false)),
  wein:(g,w,h,r)=>iaReihe(g,w,h,r,r2=>iaFlasche(r2,true)),
  /* ---------- grosse Flaechen ---------- */
  zeitschriften:(g,w,h,r)=>{ g.fillStyle='#2a2d33'; g.fillRect(0,0,w,h); const TT=['TOPFIT','AUTO PUR','WOHNEN','RÄTSEL','TV HEUTE','GARTEN','KOCHEN','FUSSBALL','REISEN','STRICKEN','PC WELT','GOLF','ANGELN','MOTORRAD','BACKEN','HEIM & HAUS'];
    for(let j=0;j<3;j++){ let x=3; while(x<w-50){ const cw=52+(r()*10|0), ch=78, y=j*85+4, c=pickR(r,IA_BUNT);
        const gr=g.createLinearGradient(x,y,x,y+ch); gr.addColorStop(0,iaHsl(c[0],c[1],Math.min(80,c[2]+25))); gr.addColorStop(1,iaHsl(c[0]+30,c[1],c[2])); g.fillStyle=gr; g.fillRect(x,y,cw,ch);
        g.fillStyle=iaHsl(20+r()*20,40,55+r()*20); g.beginPath(); g.ellipse(x+cw*0.6,y+ch*0.6,cw*0.22,ch*0.2,0,0,7); g.fill(); g.fillStyle=iaHsl(r()*360,40,30); g.fillRect(x+cw*0.38,y+ch*0.74,cw*0.44,ch*0.26);
        g.fillStyle=r()<0.5?'#fff':'#c8102e'; g.fillRect(x,y,cw,17); iaText(g,pickR(r,TT),x+cw/2,y+9,iaF(13),g.fillStyle==='#ffffff'?'#c8102e':'#fff','center',cw-4);
        g.fillStyle='#ffe23a'; g.beginPath(); g.arc(x+11,y+32,8,0,7); g.fill(); iaZeilen(g,x+3,y+46,cw*0.35,4,'rgba(255,255,255,.9)',4);
        g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+cw-1,y,1,ch); x+=cw+3; } } },
  fleisch:(g,w,h,r)=>{ /* Bedientheke von vorn-oben: Schalen mit Fleisch, Wurst, Aufschnitt, Petersilie, Preisschilder */
    g.fillStyle='#e8eaec'; g.fillRect(0,0,w,h); const zeilen=2, zh=h/zeilen;
    for(let j=0;j<zeilen;j++){ let x=4; while(x<w-40){ const sw=56+r()*40, art=r(), y=j*zh+16, sh=zh-24;
        g.fillStyle='#fafafa'; g.fillRect(x,y,sw,sh); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x,y+sh-2,sw,2);
        if(art<0.22){ for(let k=0;k<4;k++){ g.fillStyle=iaHsl(355,62,32+r()*8); g.beginPath(); g.ellipse(x+sw*(0.2+k*0.2),y+sh*0.5,sw*0.11,sh*0.34,0.3,0,7); g.fill(); g.strokeStyle='rgba(255,240,230,.7)'; g.lineWidth=2; g.beginPath(); g.ellipse(x+sw*(0.2+k*0.2),y+sh*0.5,sw*0.09,sh*0.26,0.3,0,7); g.stroke(); } }
        else if(art<0.4){ for(let k=0;k<180;k++){ g.fillStyle=iaHsl(355,50,40+r()*18); g.fillRect(x+3+r()*(sw-8),y+3+r()*(sh-8),3,3); } }
        else if(art<0.55){ for(let k=0;k<3;k++){ g.fillStyle=iaHsl(25,45,64+r()*8); g.beginPath(); g.ellipse(x+sw*(0.22+k*0.28),y+sh*0.5,sw*0.13,sh*0.38,0,0,7); g.fill(); g.fillStyle='rgba(180,110,50,.6)'; g.fillRect(x+sw*(0.14+k*0.28),y+sh*0.4,sw*0.12,2); } }
        else if(art<0.72){ for(let k=0;k<5;k++){ g.fillStyle=iaHsl(30,35,78); g.beginPath(); g.roundRect?g.roundRect(x+4,y+4+k*(sh-8)/5,sw-8,(sh-8)/5-2,4):g.rect(x+4,y+4+k*(sh-8)/5,sw-8,(sh-8)/5-2); g.fill(); } }
        else { for(let k=0;k<9;k++){ const cx=x+10+(k%5)*(sw-18)/4, cy=y+sh*0.35+(k>4?sh*0.32:0); g.fillStyle=iaHsl(352,50,45); g.beginPath(); g.arc(cx,cy,sh*0.24,0,7); g.fill(); g.fillStyle='rgba(255,245,235,.85)'; for(let s=0;s<6;s++) g.fillRect(cx-5+r()*10,cy-5+r()*10,2,2); } }
        g.fillStyle='#2e7d32'; g.fillRect(x+sw,y,5,sh); g.fillStyle='#4caf50'; for(let s=0;s<sh;s+=4) g.fillRect(x+sw+(s%8?0:2),y+s,3,2);
        g.fillStyle='#fff'; g.fillRect(x+sw/2-16,y-14,32,14); g.fillStyle='#c62828'; iaText(g,(0.89+((r()*30)|0)*0.1).toFixed(2).replace('.',','),x+sw/2,y-7,iaF(12),'#c62828','center');
        x+=sw+8; } } },
  brillenwand:(g,w,h,r)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#fbfbf8'); gr.addColorStop(1,'#e9e8e3'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    for(let x=0;x<w;x+=128){ g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(x,0,2,h); }
    for(let j=0;j<6;j++){ const y=20+j*40; g.fillStyle='rgba(120,130,140,.55)'; g.fillRect(4,y+12,w-8,2);
      for(let x=8;x<w-50;x+=50+((r()*4)|0)){ iaBrille(g,x,y,44,pickR(r,['#16161a','#16161a','#6a3a1e','#8a5a2a','#b8913e','#a01c2a','#1f3f6a','#5a5f66']),r); } }
    for(let x=64;x<w;x+=128){ g.fillStyle='#2a2d33'; g.fillRect(x-20,4,40,9); } },
  prospekte:(g,w,h,r)=>{ g.fillStyle='#d9dce2'; g.fillRect(0,0,w,h); const OR=['MALLORCA','TÜRKEI','KANAREN','GRIECHENLAND','ÄGYPTEN','ALPEN','KREUZFAHRT','ITALIEN','FERNREISEN','OSTSEE','THAILAND','DUBAI'];
    for(let j=0;j<4;j++){ for(let i=0;i<8;i++){ const x=6+i*63, y=6+j*62, art=r();
      const gr=g.createLinearGradient(0,y,0,y+56); if(art<0.5){ gr.addColorStop(0,'#5ab0e6'); gr.addColorStop(0.55,'#2a7ab8'); gr.addColorStop(0.56,'#e8d39a'); gr.addColorStop(1,'#d9b870'); } else if(art<0.75){ gr.addColorStop(0,'#7ab0e0'); gr.addColorStop(0.5,'#f2f4f8'); gr.addColorStop(0.7,'#5a7a5a'); gr.addColorStop(1,'#3a5a3a'); } else { gr.addColorStop(0,'#f2a050'); gr.addColorStop(0.6,'#c85a3a'); gr.addColorStop(1,'#3a2a3a'); }
      g.fillStyle=gr; g.fillRect(x,y,54,56); g.fillStyle=pickR(r,['#fff','#ffd400','#0a4a8a']); g.fillRect(x,y+38,54,12); iaText(g,pickR(r,OR),x+27,y+44,iaF(10),g.fillStyle==='#0a4a8a'?'#fff':'#0a2a4a','center',50);
      g.fillStyle='#8a8f98'; g.fillRect(x-3,y+50,60,5); } } },
  schubladen:(g,w,h,r)=>{ g.fillStyle='#d8dad6'; g.fillRect(0,0,w,h); const nx=8, ny=4, sw=w/nx, sh=h/ny;
    for(let i=0;i<nx;i++) for(let j=0;j<ny;j++){ const x=i*sw, y=j*sh, gr=g.createLinearGradient(0,y,0,y+sh); gr.addColorStop(0,'#fbfbf9'); gr.addColorStop(1,'#eceeeb'); g.fillStyle=gr; g.fillRect(x+2,y+2,sw-4,sh-4);
      g.fillStyle='#e8efe8'; g.fillRect(x+sw/2-18,y+12,36,14); g.strokeStyle='#9aa49a'; g.strokeRect(x+sw/2-18,y+12,36,14); iaZeilen(g,x+sw/2-14,y+17,28,2,'#667',4);
      g.fillStyle='#9aa0a8'; g.fillRect(x+sw/2-14,y+sh-18,28,4); } },
  weltkarte:(g,w,h,r)=>{ g.fillStyle='#2f6f9e'; g.fillRect(0,0,w,h); g.fillStyle='rgba(255,255,255,.08)'; for(let x=0;x<w;x+=32) g.fillRect(x,0,1,h); for(let y=0;y<h;y+=32) g.fillRect(0,y,w,1);
    const L=[[[60,40],[150,30],[170,70],[130,110],[110,150],[80,110],[50,80]],[[135,150],[170,160],[160,230],[140,240],[120,180]],[[235,45],[290,35],[300,70],[270,80],[245,75]],[[245,95],[300,90],[310,150],[285,200],[260,170],[240,120]],[[300,40],[430,30],[470,70],[420,110],[380,120],[340,100],[300,80]],[[400,170],[450,165],[460,200],[420,210]]];
    g.fillStyle='#d8c890'; for(const P of L){ g.beginPath(); P.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill(); }
    g.fillStyle='#e04040'; for(let k=0;k<9;k++){ g.beginPath(); g.arc(80+r()*380,50+r()*150,3,0,7); g.fill(); } g.fillStyle='#f4f2ea'; g.fillRect(0,0,w,3); g.fillRect(0,h-3,w,3); g.fillRect(0,0,3,h); g.fillRect(w-3,0,3,h); },
  kuehlschrank:(g,w,h,r)=>{ g.fillStyle='#1c1e22'; g.fillRect(0,0,w,h); g.fillStyle='#c8102e'; g.fillRect(8,6,w-16,52); iaText(g,'EISKALT',w/2,32,iaF(30),'#fff','center');
    g.fillStyle='#e8eef4'; g.fillRect(14,66,w-28,h-80); for(let j=0;j<5;j++){ const y=66+(j+1)*((h-80)/5); g.save(); g.beginPath(); g.rect(14,y-((h-80)/5)+4,w-28,(h-80)/5-4); g.clip(); g.translate(14,y-((h-80)/5)+4);
        iaReihe(g,w-28,(h-80)/5-6,r,r2=>iaFlasche(r2,false,0.8)); g.restore(); g.fillStyle='#9aa4ae'; g.fillRect(14,y-3,w-28,4); }
    g.fillStyle='rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(14,h*0.65); g.lineTo(w*0.55,66); g.lineTo(w*0.8,66); g.lineTo(14,h*0.9); g.fill();
    g.fillStyle='#3a3f48'; g.fillRect(w-22,h*0.4,6,90); },
  /* ---------- Plakate und Tafeln (192 x 256) ---------- */
  tafel_baeck:(g,w,h)=>iaTafel(g,w,h,'UNSERE BACKWAREN',[['Weizenbrötchen','0,45'],['Körnerbrötchen','0,75'],['Laugenbrezel','0,85'],['Croissant','1,30'],['Silvester-Berliner','1,20'],['Bauernbrot 750 g','4,20'],['Dinkel-Vollkorn','4,90'],['Kaffee to go','2,20']],'#2b2b28','#f4efe2','#e2b955'),
  tafel_cafe:(g,w,h)=>iaTafel(g,w,h,'Kaffee & Kuchen',[['Espresso','2,40'],['Cappuccino','3,60'],['Latte Macchiato','3,90'],['Milchkaffee','3,80'],['Heiße Schokolade','3,50'],['Tee','2,90'],['Kuchen','ab 3,50'],['Frühstück','ab 7,90']],'#1f2420','#eef0ea','#f2c86a',true),
  tafel_pizza:(g,w,h)=>{ iaTafel(g,w,h,'PIZZA',[['Margherita','8,50'],['Salami','9,50'],['Funghi','9,50'],['Prosciutto','10,50'],['Tonno','10,50'],['Diavola','10,90'],['Quattro Stagioni','11,50'],['Calzone','11,90']],'#f6f0e2','#2a2420','#c8322a');
    g.fillStyle='#1f8a3a'; g.fillRect(0,0,w/3,8); g.fillStyle='#fff'; g.fillRect(w/3,0,w/3,8); g.fillStyle='#c8322a'; g.fillRect(2*w/3,0,w/3,8); },
  tafel_metzger:(g,w,h)=>iaTafel(g,w,h,'HEUTE IM ANGEBOT',[['Rinderhack 1 kg','9,90'],['Schweineschnitzel','12,90'],['Rostbratwurst','1,10'],['Leberkäse 100 g','1,49'],['Kasseler 1 kg','11,50'],['Fondue-Fleisch','ab 19,90'],['Raclette-Platte','ab 8,90'],['Mittagstisch','6,90']],'#f8f6f0','#3a1a14','#b0201c'),
  tafel_friseur:(g,w,h)=>iaTafel(g,w,h,'PREISE',[['Damen W/S/F','ab 42 €'],['Herren','ab 24 €'],['Kinder bis 12','16 €'],['Färben','ab 48 €'],['Strähnen','ab 55 €'],['Bart','12 €'],['Föhnen','22 €'],['Hochsteckfrisur','ab 45 €']],'#141416','#f2f0ea','#c9a14e'),
  tafel_wasch:(g,w,h)=>iaTafel(g,w,h,'SB-WASCHSALON',[['Waschen 7 kg','4,50 €'],['Waschen 11 kg','6,50 €'],['Trocknen 10 Min','1,00 €'],['Waschmittel','inkl.'],['Geöffnet','6 – 22 Uhr'],['täglich','auch So.']],'#f4f6f8','#123a6a','#1f6ab8'),
  plakat_apo:(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#cfe6f2'); gr.addColorStop(1,'#f4f8fa'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    g.fillStyle='#e8c3a0'; g.beginPath(); g.ellipse(w*0.5,h*0.42,34,42,0,0,7); g.fill(); g.fillStyle='#5a3a24'; g.beginPath(); g.ellipse(w*0.5,h*0.32,40,30,0,Math.PI,0); g.fill(); g.fillRect(w*0.5-40,h*0.32,12,50); g.fillRect(w*0.5+28,h*0.32,12,50);
    g.fillStyle='#c8322a'; g.fillRect(w*0.2,h*0.58,w*0.6,22); g.fillStyle='#a01c20'; g.fillRect(w*0.55,h*0.58,14,60);
    g.fillStyle='#1f7a3a'; g.fillRect(0,h-78,w,78); iaText(g,'Gut durch die',w/2,h-60,iaF(20),'#fff','center'); iaText(g,'Erkältungszeit',w/2,h-38,iaF(26),'#fff','center'); iaText(g,'Fragen Sie uns!',w/2,h-14,iaF(15,500),'#dff2e0','center'); },
  plakat_optik:(g,w,h)=>{ g.fillStyle='#ece8e2'; g.fillRect(0,0,w,h); g.fillStyle='#d8b494'; g.beginPath(); g.ellipse(w*0.5,h*0.4,46,58,0,0,7); g.fill(); g.fillStyle='#2a1e18'; g.beginPath(); g.ellipse(w*0.5,h*0.25,52,34,0,Math.PI,0); g.fill();
    iaBrille(g,w*0.5-44,h*0.37,88,'#16161a'); g.fillStyle='#2a2d33'; g.fillRect(0,h-70,w,70); iaText(g,'NEUE KOLLEKTION',w/2,h-50,iaF(20),'#fff','center'); iaText(g,'Sehtest kostenlos',w/2,h-24,iaF(17,500),'#e9c46a','center'); },
  reise_strand:(g,w,h)=>iaReise(g,w,h,0,'MALLORCA','1 Woche ab 499 €'),
  reise_berge:(g,w,h)=>iaReise(g,w,h,1,'TIROL','Skiurlaub ab 389 €'),
  reise_stadt:(g,w,h)=>iaReise(g,w,h,2,'ROM','Städtereise ab 299 €'),
  lastminute:(g,w,h)=>iaTafel(g,w,h,'LAST MINUTE',[['Antalya 7 N.','ab 429 €'],['Hurghada 7 N.','ab 519 €'],['Gran Canaria','ab 649 €'],['Kreta 7 N.','ab 459 €'],['Fuerteventura','ab 589 €'],['Silvester Wien','ab 249 €']],'#fff8e0','#1a2a4a','#d22a2a'),
  frisuren:(g,w,h,r)=>{ g.fillStyle='#f4f2ee'; g.fillRect(0,0,w,h); for(let i=0;i<4;i++){ const x=(i%2)*w/2+6, y=(i>>1)*h/2+6, pw=w/2-12, ph=h/2-12;
      g.fillStyle=pickR(r,['#c9d4dc','#e2d8cc','#d8cfd8','#cfdcd0']); g.fillRect(x,y,pw,ph); g.fillStyle='#e0b896'; g.beginPath(); g.ellipse(x+pw/2,y+ph*0.5,pw*0.2,ph*0.24,0,0,7); g.fill();
      g.fillStyle=pickR(r,['#2a1a10','#8a5a2a','#d9b56a','#1a1a1a','#a0402a']); g.beginPath(); g.ellipse(x+pw/2,y+ph*0.36,pw*0.28,ph*0.2,0,Math.PI,0); g.fill(); if(i%2) g.fillRect(x+pw*0.22,y+ph*0.36,pw*0.12,ph*0.45);
      g.fillStyle='#2a2a2a'; g.fillRect(x+pw*0.2,y+ph*0.78,pw*0.6,ph*0.22); } },
  kalender:(g,w,h,r)=>{ g.fillStyle='#fdfbf6'; g.fillRect(0,0,w,h); g.fillStyle='#c8322a'; g.fillRect(0,0,w,46); iaText(g,'KALENDER 2027',w/2,24,iaF(22),'#fff','center');
    for(let i=0;i<6;i++){ const x=8+(i%3)*60, y=56+(i>>1)*96*0+((i/3)|0)*96; g.fillStyle=iaHsl(r()*360,45,55); g.fillRect(x,y,54,60); g.fillStyle='#fff'; g.fillRect(x,y+60,54,24); iaZeilen(g,x+4,y+66,46,4,'#999',4); } },
  getraenke:(g,w,h)=>{ g.fillStyle='#ffd400'; g.fillRect(0,0,w,h); g.fillStyle='#d2101e'; g.fillRect(0,0,w,56); iaText(g,'ANGEBOT',w/2,30,iaF(36),'#fff','center');
    iaText(g,'Kasten Pils',w/2,82,iaF(24),'#1a1a1a','center'); iaText(g,'20 × 0,5 l',w/2,106,iaF(18,500),'#1a1a1a','center');
    g.fillStyle='#d2101e'; g.beginPath(); g.ellipse(w/2,166,70,40,0,0,7); g.fill(); iaText(g,'13,99',w/2,166,iaF(44),'#fff','center'); iaText(g,'zzgl. 3,10 € Pfand',w/2,226,iaF(15,500),'#1a1a1a','center'); },
  buch_best:(g,w,h,r)=>{ g.fillStyle='#5a2d3a'; g.fillRect(0,0,w,h); iaText(g,'BESTSELLER',w/2,26,iaS(24),'#f2e6c8','center'); iaText(g,'der Woche',w/2,50,iaS(15),'#e2c8a0','center');
    for(let i=0;i<3;i++) iaCover(g,10+i*60,74,54,82,r); for(let i=0;i<3;i++) iaCover(g,10+i*60,166,54,82,r); },
  /* ---------- Leisten, Schilder, Theken ---------- */
  kat_apo:(g,w,h)=>{ g.fillStyle='#1f7a3a'; g.fillRect(0,0,w,h); ['ERKÄLTUNG','SCHMERZ','MAGEN & DARM','VITAMINE'].forEach((t,i)=>{ iaText(g,t,w*(i+0.5)/4,h/2,iaF(26),'#fff','center',w/4-10); g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(w*i/4,6,1,h-12); }); },
  kat_buch:(g,w,h)=>{ g.fillStyle='#3a2418'; g.fillRect(0,0,w,h); ['ROMANE','KRIMI','KINDERBUCH','REISE'].forEach((t,i)=>iaText(g,t,w*(i+0.5)/4,h/2,iaS(22),'#e9d6a8','center',w/4-10)); },
  lotto:(g,w,h)=>{ g.fillStyle='#d8261c'; g.fillRect(0,0,w,h); g.fillStyle='#ffd400'; g.fillRect(0,h-26,w,26); iaText(g,'LOTTO · TOTO',w/2,h/2-12,iaF(40),'#fff','center',w-10); iaText(g,'Annahmestelle',w/2,h-13,iaF(19),'#1a1a1a','center'); },
  preisleiste:(g,w,h,r)=>{ g.fillStyle='#f6f6f2'; g.fillRect(0,0,w,h); for(let x=4;x<w-20;x+=24+((r()*16)|0)){ g.fillStyle=r()<0.15?'#ffd400':'#fff'; g.fillRect(x,3,18,h-6); g.fillStyle='#333'; g.fillRect(x+3,h/2-1,12,2); } g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,h-2,w,2); },
  front_holz:(g,w,h,r)=>{ IA_MAL.holz(g,w,h,r); g.fillStyle='rgba(0,0,0,.25)'; for(let x=0;x<w;x+=64) g.fillRect(x,0,2,h); g.fillStyle='#2a2a2c'; g.fillRect(0,h-14,w,14); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(0,0,w,3); },
  front_apo:(g,w,h)=>{ g.fillStyle='#f6f6f3'; g.fillRect(0,0,w,h); g.fillStyle='#1f7a3a'; g.fillRect(0,h*0.28,w,6); g.fillStyle='#c8102e'; g.fillRect(w/2-16,h*0.45,32,32); iaText(g,'A',w/2,h*0.45+17,iaS(26),'#fff','center'); g.fillStyle='#cfd2d4'; g.fillRect(0,h-12,w,12); },
  front_metzger:(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#e2e5e8'); gr.addColorStop(1,'#b8bec4'); g.fillStyle=gr; g.fillRect(0,0,w,h); g.fillStyle='#a01c1c'; g.fillRect(0,10,w,10);
    g.fillStyle='rgba(0,0,0,.2)'; for(let x=0;x<w;x+=64) g.fillRect(x,24,1,h-38); g.fillStyle='#8a9096'; g.fillRect(0,h-14,w,14); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,26,w,2); },
  front_kiosk:(g,w,h,r)=>{ g.fillStyle='#24303c'; g.fillRect(0,0,w,h); for(let i=0;i<5;i++){ g.fillStyle=pickR(r,['#d8261c','#ffd400','#2f8a4a','#f2f2f2','#1f5fb8']); g.fillRect(14+i*48,22,40,54); g.fillStyle='rgba(255,255,255,.6)'; g.fillRect(18+i*48,30,32,6); } g.fillStyle='#14181e'; g.fillRect(0,h-14,w,14); },
  front_stahl:(g,w,h,r)=>{ g.fillStyle='#c4c9ce'; g.fillRect(0,0,w,h); for(let k=0;k<300;k++){ g.fillStyle=`rgba(255,255,255,${r()*0.25})`; g.fillRect(r()*w,r()*h,r()*40,1); } g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(w/2,0,1,h); g.fillStyle='#8a9096'; g.fillRect(w*0.2,10,40,4); g.fillRect(w*0.7,10,40,4); },
  /* ---------- Geraete ---------- */
  waschmaschine:(g,w,h)=>{ const gr=g.createLinearGradient(0,0,w,0); gr.addColorStop(0,'#e4e6e8'); gr.addColorStop(0.5,'#fbfbfb'); gr.addColorStop(1,'#d8dadd'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    g.fillStyle='#d0d4d8'; g.fillRect(0,0,w,44); g.fillStyle='#2a6ab8'; g.fillRect(10,10,40,20); g.fillStyle='#9ae0ff'; g.fillRect(14,14,32,12); g.fillStyle='#444'; g.beginPath(); g.arc(w-30,22,12,0,7); g.fill(); g.fillStyle='#bbb'; g.fillRect(w-31,12,2,10);
    g.fillStyle='#3a3f48'; g.fillRect(62,14,24,16); const cx=w/2, cy=h*0.58, R=w*0.36; g.fillStyle='#9aa0a8'; g.beginPath(); g.arc(cx,cy,R,0,7); g.fill(); g.fillStyle='#5a6068'; g.beginPath(); g.arc(cx,cy,R*0.84,0,7); g.fill();
    const gl=g.createRadialGradient(cx-R*0.3,cy-R*0.3,2,cx,cy,R*0.8); gl.addColorStop(0,'#5a7088'); gl.addColorStop(1,'#1a2430'); g.fillStyle=gl; g.beginPath(); g.arc(cx,cy,R*0.78,0,7); g.fill();
    g.fillStyle='rgba(200,120,160,.5)'; g.beginPath(); g.ellipse(cx,cy+R*0.4,R*0.6,R*0.25,0,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx-R*0.35,cy-R*0.35,R*0.25,R*0.12,-0.7,0,7); g.fill(); g.fillStyle='#ccc'; g.fillRect(cx+R-4,cy-10,8,20); },
  trockner:(g,w,h)=>{ g.fillStyle='#eef0f2'; g.fillRect(0,0,w,h); g.fillStyle='#3a3f48'; g.fillRect(0,0,w,26); g.fillStyle='#ff6a2a'; g.fillRect(8,7,30,12); iaText(g,'TROCKNER',w-8,13,iaF(12),'#fff','right');
    const cx=w/2, cy=h*0.58, R=w*0.38; g.fillStyle='#8a9096'; g.beginPath(); g.arc(cx,cy,R,0,7); g.fill(); const gl=g.createRadialGradient(cx-10,cy-10,2,cx,cy,R*0.85); gl.addColorStop(0,'#6a7a8a'); gl.addColorStop(1,'#202830'); g.fillStyle=gl; g.beginPath(); g.arc(cx,cy,R*0.82,0,7); g.fill();
    g.fillStyle='rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(cx-R*0.3,cy-R*0.35,R*0.28,R*0.1,-0.7,0,7); g.fill(); },
  monitor:(g,w,h)=>{ g.fillStyle='#16181c'; g.fillRect(0,0,w,h); const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#2a7ab8'); gr.addColorStop(1,'#bfe0f4'); g.fillStyle=gr; g.fillRect(5,5,w-10,h-10);
    g.fillStyle='#0a3a6a'; g.fillRect(5,5,w-10,12); g.fillStyle='#fff'; for(let i=0;i<4;i++) g.fillRect(10,24+i*12,w*0.5,6); g.fillStyle='#ffd400'; g.fillRect(w*0.65,26,w*0.25,30); },
  spiegel:(g,w,h)=>{ g.fillStyle='#1a1a1c'; g.fillRect(0,0,w,h); const gr=g.createLinearGradient(0,0,w,h); gr.addColorStop(0,'#cfd6dc'); gr.addColorStop(0.45,'#9aa4ac'); gr.addColorStop(1,'#6a747c'); g.fillStyle=gr; g.fillRect(8,8,w-16,h-16);
    g.fillStyle='rgba(60,50,40,.35)'; g.fillRect(14,h*0.62,w-28,h*0.3); g.fillStyle='rgba(255,250,240,.6)'; g.fillRect(20,h*0.2,w-40,6); g.fillStyle='rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(8,h*0.5); g.lineTo(w*0.6,8); g.lineTo(w*0.8,8); g.lineTo(8,h*0.75); g.fill();
    g.fillStyle='#fffbe8'; g.fillRect(8,0,w-16,6); },
  kiste_bier:(g,w,h,r)=>iaKiste(g,w,h,'#2f6a32','#4a2a10',r), kiste_wasser:(g,w,h,r)=>iaKiste(g,w,h,'#1f5aa8','#bcd8ee',r), kiste_saft:(g,w,h,r)=>iaKiste(g,w,h,'#d8261c','#e8901e',r),
  kiste_oben:(g,w,h,r)=>{ g.fillStyle='#2a3a2a'; g.fillRect(0,0,w,h); for(let j=0;j<4;j++) for(let i=0;i<5;i++){ const x=w*(i+0.5)/5, y=h*(j+0.5)/4; g.fillStyle='#1a1a1a'; g.beginPath(); g.arc(x,y,13,0,7); g.fill(); g.fillStyle=pickR(r,['#c9a14e','#c8322a','#e8e8e8','#2a5a2a']); g.beginPath(); g.arc(x,y,8,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(x-4,y-5,4,2); } },
  torte1:(g,w,h)=>iaTorte(g,w,h,'#f4ece0','#c8322a',0), torte2:(g,w,h)=>iaTorte(g,w,h,'#3a2216','#f8f4ee',1), torte3:(g,w,h)=>iaTorte(g,w,h,'#f2dc9e','#e8a0a8',2),
  torte_seite:(g,w,h)=>{ const s=h/3; [['#3a2216','#f4ece0'],['#f2dc9e','#e9d29a'],['#e9d29a','#f6eedc']].forEach((c,i)=>{ for(let k=0;k<4;k++){ g.fillStyle=k%2?c[1]:c[0]; g.fillRect(0,i*s+k*s/4,w,s/4); } }); },
  pizza:(g,w,h,r)=>{ g.clearRect(0,0,w,h); g.fillStyle='#d9a45a'; g.beginPath(); g.arc(w/2,h/2,w*0.48,0,7); g.fill(); g.fillStyle='#c8401e'; g.beginPath(); g.arc(w/2,h/2,w*0.42,0,7); g.fill();
    g.fillStyle='rgba(250,235,190,.85)'; for(let k=0;k<30;k++){ g.beginPath(); g.arc(w/2+(r()-0.5)*w*0.7,h/2+(r()-0.5)*h*0.7,5+r()*6,0,7); g.fill(); } g.fillStyle='#8a1a14'; for(let k=0;k<9;k++){ g.beginPath(); g.arc(w/2+(r()-0.5)*w*0.6,h/2+(r()-0.5)*h*0.6,7,0,7); g.fill(); } },
  karo:(g,w,h)=>{ g.fillStyle='#fff'; g.fillRect(0,0,w,h); g.fillStyle='rgba(200,30,30,.55)'; for(let i=0;i<w;i+=16){ g.fillRect(i,0,8,h); g.fillRect(0,i,w,8); } },
  cover:(g,w,h,r)=>{ g.fillStyle='#f4f2ec'; g.fillRect(0,0,w,h); for(let i=0;i<6;i++) iaCover(g,i*(w/6)+2,2,w/6-4,h-4,r); },
  /* ---------- Freisteller ---------- */
  blumen1:(g,w,h,r)=>iaStrauss(g,w,h,r,['#c8102e','#a00a20','#e0283a']),
  blumen2:(g,w,h,r)=>iaStrauss(g,w,h,r,['#ffd21e','#ff8a1e','#f2f0ea','#e85a9a']),
  blumen3:(g,w,h,r)=>iaStrauss(g,w,h,r,['#f4f2ea','#e8e0f0','#c8b0e0']),
  blumen4:(g,w,h,r)=>iaStrauss(g,w,h,r,['#ffcc00'],true),
  pflanze:(g,w,h,r)=>{ for(let k=0;k<26;k++){ const a=-Math.PI/2+(r()-0.5)*2.6, L=h*(0.35+r()*0.5), bx=w/2+Math.cos(a)*L*0.2, by=h, ex=w/2+Math.cos(a)*L*0.75, ey=h-Math.sin(-a)*L;
      g.strokeStyle='#3a5a2a'; g.lineWidth=2; g.beginPath(); g.moveTo(bx,by); g.quadraticCurveTo(w/2,h*0.6,ex,ey); g.stroke();
      g.fillStyle=iaHsl(110+r()*30,45,22+r()*16); g.beginPath(); g.ellipse(ex,ey,10+r()*12,5+r()*5,a+Math.PI/2*0.1,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(ex-6,ey-1,12,1); } },
  brille:(g,w,h)=>iaBrille(g,4,4,w-8,'#16161a'),
  wurst:(g,w,h,r)=>{ for(let i=0;i<8;i++){ const x=6+i*(w-12)/8, L=h*(0.55+r()*0.4), dick=r()<0.3; g.strokeStyle='#d8d0c0'; g.lineWidth=1; g.beginPath(); g.moveTo(x+6,0); g.lineTo(x+6,8); g.stroke();
      const gr=g.createLinearGradient(x,0,x+12,0); const c=dick?'#a0503a':pickR(r,['#7a2a22','#8a3a26','#5a2018','#b07050']); gr.addColorStop(0,c); gr.addColorStop(0.4,'#c8806a'); gr.addColorStop(1,c); g.fillStyle=gr;
      g.beginPath(); if(g.roundRect) g.roundRect(x+(dick?-2:1),8,dick?16:10,L-8,6); else g.rect(x+(dick?-2:1),8,dick?16:10,L-8); g.fill(); g.fillStyle='rgba(255,255,255,.25)'; for(let s=0;s<L-12;s+=10) g.fillRect(x+3,12+s,6,1); } }
};
function pickR(r,a){ return a[Math.floor(r()*a.length)]; }
/* Arzneischachteln: meist weiss mit Farbband, gestapelt (2-3 hoch) */
function iaMedi(r){ const c=pickR(r,IA_BUNT), weiss=r()<0.7, bw=22+(r()*22|0), eh=16+(r()*14|0), st=1+(r()*3|0), stil=r()*3|0, name=pickR(r,['Gripp','Dolo','Nasa','Hust','Magn','Vita','Ibu','Para','Sinu','Calc','Zink','Lact','Derm','Ome']);
  return {w:bw,h:eh*st,n:2+(r()*3|0),draw:(g,x,y,w,h)=>{ for(let k=0;k<st;k++){ const yy=y+k*eh;
    g.fillStyle=weiss?'#f6f6f2':iaHsl(c[0],c[1],c[2]+10); g.fillRect(x,yy,w,eh-1);
    g.fillStyle=iaHsl(c[0],c[1],c[2]);
    if(stil===0) g.fillRect(x,yy,w,eh*0.38); else if(stil===1) g.fillRect(x,yy,w*0.22,eh-1); else { g.beginPath(); g.moveTo(x,yy+eh*0.7); g.quadraticCurveTo(x+w*0.5,yy+eh*0.2,x+w,yy+eh*0.5); g.lineTo(x+w,yy+eh-1); g.lineTo(x,yy+eh-1); g.fill(); }
    if(w>=30&&eh>=20){ iaText(g,name,x+w*0.55,yy+eh*(stil===0?0.68:0.38),iaF(9),weiss&&stil!==2?iaHsl(c[0],c[1],Math.max(15,c[2]-10)):'#fff','center',w-6); }
    else { g.fillStyle=weiss?'#555':'#fff'; g.fillRect(x+w*0.3,yy+eh*0.55,w*0.5,1); }
    iaKante(g,x,yy,w,eh-1,0.7); } }}; }
function iaKosm(r){ const c=pickR(r,IA_BUNT), bw=12+(r()*16|0), bh=36+(r()*48|0), art=r()*3|0;
  return {w:bw,h:bh,n:2+(r()*3|0),gap:2,draw:(g,x,y,w,h)=>{ const f=iaHsl(c[0],Math.min(60,c[1]),Math.min(88,c[2]+30)), gr=g.createLinearGradient(x,0,x+w,0); gr.addColorStop(0,f); gr.addColorStop(0.25,'rgba(255,255,255,.7)'); gr.addColorStop(0.35,f); gr.addColorStop(1,iaHsl(c[0],c[1],c[2]));
    g.fillStyle=gr; if(art===0){ g.fillRect(x,y+h*0.18,w,h*0.82); g.fillStyle='#e8e8e8'; g.fillRect(x+w*0.3,y,w*0.4,h*0.18); } else if(art===1){ g.beginPath(); g.moveTo(x+w*0.1,y); g.lineTo(x+w*0.9,y); g.lineTo(x+w,y+h); g.lineTo(x,y+h); g.fill(); g.fillStyle='#fff'; g.fillRect(x,y+h-8,w,8); }
    else { g.fillRect(x,y+h*0.1,w,h*0.9); g.fillStyle=iaHsl(c[0],c[1],c[2]-10); g.fillRect(x+w*0.2,y,w*0.6,h*0.12); }
    g.fillStyle='rgba(255,255,255,.85)'; g.fillRect(x+2,y+h*0.45,w-4,h*0.16); iaZeilen(g,x+3,y+h*0.48,w-6,2,iaHsl(c[0],60,30),3); }}; }
function iaBuch(r){ const c=pickR(r,IA_BUNT), cover=r()<0.08;
  if(cover) return {w:56,h:84,n:1,luecke:2,draw:(g,x,y,w,h)=>iaCover(g,x,y,w,h,r)};
  return {w:7+(r()*12|0),h:68+(r()*42|0),n:1+(r()*3|0),gap:0,luecke:0,draw:(g,x,y,w,h)=>{ const l=c[2]+(r()*16-8);
    g.fillStyle=iaHsl(c[0],c[1],l); g.fillRect(x,y,w,h); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(x+1,y,1,h); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+w-1,y,1,h);
    const gold=r()<0.4; g.fillStyle=gold?'#d9b25a':(l>60?'#222':'#f4efe2'); g.fillRect(x+2,y+h*0.15,w-4,1); g.fillRect(x+2,y+h*0.82,w-4,1);
    for(let k=0;k<5;k++) g.fillRect(x+w/2-1,y+h*0.25+k*h*0.09,2,h*0.06); }}; }
function iaCover(g,x,y,w,h,r){ const c=pickR(r,IA_BUNT), gr=g.createLinearGradient(x,y,x,y+h); gr.addColorStop(0,iaHsl(c[0],c[1],Math.min(85,c[2]+20))); gr.addColorStop(1,iaHsl(c[0]+20,c[1],Math.max(12,c[2]-15)));
  g.fillStyle=gr; g.fillRect(x,y,w,h); g.fillStyle=`rgba(255,255,255,${0.15+r()*0.25})`; g.beginPath(); g.arc(x+w*(0.3+r()*0.4),y+h*(0.45+r()*0.2),w*(0.15+r()*0.2),0,7); g.fill();
  g.fillStyle=r()<0.5?'#fff':'#1a1a1a'; g.fillRect(x+w*0.12,y+h*0.1,w*0.76,Math.max(2,h*0.07)); g.fillRect(x+w*0.2,y+h*0.21,w*0.6,Math.max(1,h*0.04)); g.fillRect(x+w*0.25,y+h*0.86,w*0.5,Math.max(1,h*0.035));
  g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(x+w-1,y,1,h); }
function iaBrot(r){ const art=r()*4|0, l=26+r()*14;
  const it={w:[46,52,34,62][art],h:[34,30,28,16][art],n:1+(r()*3|0),gap:3,luecke:6};
  it.draw=(g,x,y,w,h)=>{ const gr=g.createLinearGradient(0,y,0,y+h); gr.addColorStop(0,iaHsl(30,55,l+14)); gr.addColorStop(1,iaHsl(24,58,l-4)); g.fillStyle=gr; g.beginPath();
    if(art===0) g.ellipse(x+w/2,y+h,w/2,h,0,Math.PI,0); else if(art===1){ g.moveTo(x,y+h); g.lineTo(x,y+h*0.35); g.quadraticCurveTo(x+w/2,y-h*0.2,x+w,y+h*0.35); g.lineTo(x+w,y+h); } else if(art===2) g.ellipse(x+w/2,y+h,w/2,h,0,Math.PI,0); else g.ellipse(x+w/2,y+h*0.6,w/2,h*0.55,0,0,7);
    g.fill(); g.strokeStyle='rgba(250,232,190,.55)'; g.lineWidth=1.5;
    if(art===0){ for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(x+w*(0.25+k*0.22),y+h*0.35); g.lineTo(x+w*(0.35+k*0.22),y+h*0.75); g.stroke(); } g.fillStyle='rgba(255,255,255,.35)'; for(let k=0;k<20;k++) g.fillRect(x+w*0.2+r()*w*0.6,y+h*0.2+r()*h*0.4,1.5,1.5); }
    else if(art===1){ g.beginPath(); g.moveTo(x+w*0.15,y+h*0.3); g.lineTo(x+w*0.85,y+h*0.3); g.stroke(); }
    else if(art===2){ g.fillStyle='rgba(60,40,20,.6)'; for(let k=0;k<26;k++) g.fillRect(x+w*0.15+r()*w*0.7,y+h*0.25+r()*h*0.6,1.5,1.5); }
    else { for(let k=0;k<4;k++){ g.beginPath(); g.moveTo(x+w*(0.15+k*0.2),y+h*0.25); g.lineTo(x+w*(0.25+k*0.2),y+h*0.65); g.stroke(); } }
    g.fillStyle='#f6f2e8'; g.fillRect(x+w/2-10,y+h-9,20,9); g.fillStyle='#333'; g.fillRect(x+w/2-7,y+h-5,14,2); };
  return it; }
function iaFlasche(r,wein,sk){ sk=sk||1; const art=wein?3:r()*3|0, c=wein?pickR(r,['#2a3a1a','#3a1a1a','#1a2a1a','#c8b070']):pickR(r,['#3a2210','#2f6a2a','#c8102e','#e8eef0','#ff8a1e','#1f5aa8']), bw=Math.round((art===2?10:12)*sk), bh=Math.round((art===2?34:art===3?66:52)*sk);
  return {w:bw,h:bh,n:3+(r()*4|0),gap:2,draw:(g,x,y,w,h)=>{ const gr=g.createLinearGradient(x,0,x+w,0); gr.addColorStop(0,c); gr.addColorStop(0.3,'rgba(255,255,255,.5)'); gr.addColorStop(0.45,c); gr.addColorStop(1,c); g.fillStyle=gr;
    if(art===2){ g.fillRect(x,y+3,w,h-3); g.fillStyle='#ccc'; g.fillRect(x+1,y,w-2,3); } else { g.fillRect(x,y+h*0.38,w,h*0.62); g.beginPath(); g.moveTo(x,y+h*0.4); g.quadraticCurveTo(x+w*0.3,y+h*0.25,x+w*0.35,y+h*0.12); g.lineTo(x+w*0.65,y+h*0.12); g.quadraticCurveTo(x+w*0.7,y+h*0.25,x+w,y+h*0.4); g.fill();
      g.fillStyle=wein?'#7a1a1a':'#c9a14e'; g.fillRect(x+w*0.3,y,w*0.4,h*0.13); }
    g.fillStyle=wein?'#f2ead6':'#f6f4ee'; g.fillRect(x,y+h*0.58,w,h*0.22); g.fillStyle=wein?'#7a1a1a':'#c8102e'; g.fillRect(x+1,y+h*0.64,w-2,2); }}; }
function iaBrille(g,x,y,w,c,r){ const lw=w*0.42, lh=w*0.28, art=r?(r()*3|0):0; g.strokeStyle=c; g.lineWidth=Math.max(2,w*0.05);
  g.fillStyle='rgba(170,200,220,.25)';
  for(const sx of [0,1]){ const lx=x+sx*(w-lw); g.beginPath(); if(art===1) g.ellipse(lx+lw/2,y+lh/2,lw/2,lh/2,0,0,7); else if(art===2){ g.moveTo(lx,y); g.lineTo(lx+lw,y); g.lineTo(lx+lw*0.9,y+lh); g.lineTo(lx+lw*0.15,y+lh); g.closePath(); } else g.rect(lx,y,lw,lh); g.fill(); g.stroke(); }
  g.beginPath(); g.moveTo(x+lw,y+lh*0.3); g.quadraticCurveTo(x+w/2,y+lh*0.05,x+w-lw,y+lh*0.3); g.stroke(); }
function iaKiste(g,w,h,f,fl,r){ g.fillStyle='#16181a'; g.fillRect(0,0,w,24); g.fillStyle=fl; for(let i=0;i<5;i++){ g.fillRect(8+i*(w-16)/5+6,0,(w-16)/5-12,26); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(8+i*(w-16)/5+9,2,3,22); g.fillStyle=fl; }
  g.fillStyle=f; g.fillRect(0,22,w,h-22); g.fillStyle='rgba(0,0,0,.28)'; g.fillRect(w/2-26,32,52,14); g.fillStyle='rgba(255,255,255,.12)'; for(let x=6;x<w;x+=12) g.fillRect(x,52,3,h-58);
  g.fillStyle='#f6f2e6'; g.fillRect(w/2-32,h-48,64,30); g.fillStyle=f; g.fillRect(w/2-28,h-42,56,4); g.fillStyle='#555'; g.fillRect(w/2-24,h-32,48,2); g.fillStyle='rgba(0,0,0,.3)'; g.fillRect(0,h-3,w,3); }
function iaTorte(g,w,h,f,deko,art){ g.clearRect(0,0,w,h); g.fillStyle=f; g.beginPath(); g.arc(w/2,h/2,w*0.48,0,7); g.fill(); g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=1;
  for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; g.beginPath(); g.moveTo(w/2,h/2); g.lineTo(w/2+Math.cos(a)*w*0.48,h/2+Math.sin(a)*h*0.48); g.stroke(); }
  g.fillStyle=deko; for(let k=0;k<12;k++){ const a=(k+0.5)/12*Math.PI*2; g.beginPath(); g.arc(w/2+Math.cos(a)*w*0.38,h/2+Math.sin(a)*h*0.38,art===2?6:5,0,7); g.fill(); }
  if(art===1){ g.fillStyle='#f8f4ee'; g.beginPath(); g.arc(w/2,h/2,w*0.12,0,7); g.fill(); } }
function iaStrauss(g,w,h,r,farben,sonne){ g.strokeStyle='#3f6a2a'; g.lineWidth=2;
  for(let k=0;k<18;k++){ const ex=w*0.15+r()*w*0.7, ey=h*0.08+r()*h*0.45; g.beginPath(); g.moveTo(w/2+(r()-0.5)*14,h); g.quadraticCurveTo(w/2,h*0.6,ex,ey); g.stroke();
    g.fillStyle=iaHsl(110,45,28); g.beginPath(); g.ellipse((ex+w/2)/2,(ey+h)/2+8,9,3,r()*3,0,7); g.fill(); }
  for(let k=0;k<16;k++){ const ex=w*0.15+r()*w*0.7, ey=h*0.08+r()*h*0.45, c=pickR(r,farben), R=sonne?13:7+r()*5; g.fillStyle=c; g.beginPath(); g.arc(ex,ey,R,0,7); g.fill();
    if(sonne){ g.fillStyle='#4a2a10'; g.beginPath(); g.arc(ex,ey,R*0.45,0,7); g.fill(); } else { g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.arc(ex+R*0.25,ey+R*0.25,R*0.5,0,7); g.fill(); g.fillStyle='rgba(255,255,255,.3)'; g.beginPath(); g.arc(ex-R*0.3,ey-R*0.3,R*0.3,0,7); g.fill(); } } }
function iaTafel(g,w,h,titel,Z,bg,fg,ak,kreide){ g.fillStyle=bg; g.fillRect(0,0,w,h); g.strokeStyle=ak; g.lineWidth=4; g.strokeRect(5,5,w-10,h-10);
  iaText(g,titel,w/2,30,kreide?iaK(22):iaF(24),ak,'center',w-20); g.fillStyle=ak; g.fillRect(24,46,w-48,2);
  const dy=(h-66)/Z.length; Z.forEach((z,i)=>{ const y=64+i*dy+dy/2; iaText(g,z[0],14,y,kreide?iaK(14):iaF(16,500),fg,'left',w*0.62); iaText(g,z[1],w-14,y,kreide?iaK(14):iaF(16),fg,'right'); g.fillStyle=fg; g.globalAlpha=0.25; g.fillRect(14,y+dy/2-1,w-28,1); g.globalAlpha=1; }); }
function iaReise(g,w,h,art,ort,preis){ const gr=g.createLinearGradient(0,0,0,h);
  if(art===0){ gr.addColorStop(0,'#6ec6f0'); gr.addColorStop(0.5,'#1f8ac0'); gr.addColorStop(0.62,'#2aa0c8'); gr.addColorStop(0.63,'#f0dca0'); gr.addColorStop(1,'#e2c27a'); }
  else if(art===1){ gr.addColorStop(0,'#8ac0f0'); gr.addColorStop(0.6,'#dfe9f4'); gr.addColorStop(0.61,'#f4f6fa'); gr.addColorStop(1,'#e2e8f0'); }
  else { gr.addColorStop(0,'#f6b46a'); gr.addColorStop(0.55,'#e8845a'); gr.addColorStop(1,'#a8584a'); }
  g.fillStyle=gr; g.fillRect(0,0,w,h);
  if(art===0){ g.fillStyle='#ffe680'; g.beginPath(); g.arc(w*0.75,h*0.18,18,0,7); g.fill(); g.strokeStyle='#5a3a1a'; g.lineWidth=5; g.beginPath(); g.moveTo(w*0.2,h*0.85); g.quadraticCurveTo(w*0.18,h*0.5,w*0.3,h*0.3); g.stroke();
    g.fillStyle='#2f7a2a'; for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; g.beginPath(); g.ellipse(w*0.3+Math.cos(a)*16,h*0.3+Math.sin(a)*7,20,5,a,0,7); g.fill(); } }
  else if(art===1){ g.fillStyle='#7a8a9a'; g.beginPath(); g.moveTo(0,h*0.62); g.lineTo(w*0.3,h*0.22); g.lineTo(w*0.55,h*0.5); g.lineTo(w*0.75,h*0.28); g.lineTo(w,h*0.55); g.lineTo(w,h*0.62); g.fill();
    g.fillStyle='#fff'; g.beginPath(); g.moveTo(w*0.22,h*0.32); g.lineTo(w*0.3,h*0.22); g.lineTo(w*0.38,h*0.32); g.fill(); g.beginPath(); g.moveTo(w*0.69,h*0.36); g.lineTo(w*0.75,h*0.28); g.lineTo(w*0.82,h*0.36); g.fill();
    g.fillStyle='#2a4a2a'; for(let k=0;k<7;k++){ g.beginPath(); g.moveTo(10+k*28,h*0.74); g.lineTo(20+k*28,h*0.6); g.lineTo(30+k*28,h*0.74); g.fill(); } }
  else { g.fillStyle='#6a3a2a'; g.beginPath(); g.ellipse(w/2,h*0.62,w*0.42,h*0.2,0,Math.PI,0); g.fill(); g.fillStyle='#4a2a24'; for(let k=0;k<6;k++) g.fillRect(w*0.12+k*w*0.13,h*0.48,w*0.07,h*0.14); g.fillStyle='#3a2a2a'; g.fillRect(0,h*0.62,w,h*0.38); }
  g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(0,h-70,w,70); iaText(g,ort,w/2,h-48,iaF(30),'#fff','center',w-12); iaText(g,preis,w/2,h-18,iaF(18),'#ffd400','center',w-12); }
/* Kachelliste: [id, Breite, Hoehe, Massstab] - gemalt wird in Breite x
   Hoehe, abgelegt um den Massstab verkleinert (Plakate, Boeden und grosse
   Flaechen sieht man nur von der anderen Strassenseite) */
const IA_LISTE=[['weiss',8,8],
  ['boden_hell',256,256,0.75],['boden_grau',256,256,0.75],['boden_holz',256,256,0.75],['boden_terrakotta',256,256,0.75],['boden_terrazzo',256,256,0.75],['boden_teppich',256,256,0.75],['boden_rot',256,256,0.75],['wand_fliese',256,256,0.75],['wand_backstein',256,256,0.75],['holz',256,256,0.5],
  ['medi1',512,128],['medi2',512,128],['kosmetik',512,128],['zigaretten',512,128],['suess',512,128],['buch1',512,128],['buch2',512,128],['ordner',512,128],['hefte',512,128],['haar',512,128],['brote',512,128],['broetchen',512,128],['kuchen',512,128],['flaschen',512,128],['wein',512,128],
  ['zeitschriften',512,256,0.75],['fleisch',512,256,0.75],['brillenwand',512,256,0.75],['prospekte',512,256,0.75],['schubladen',512,256,0.5],['weltkarte',512,256,0.5],['kuehlschrank',256,512,0.75],
  ['tafel_baeck',192,256,0.75],['tafel_cafe',192,256,0.75],['tafel_pizza',192,256,0.75],['tafel_metzger',192,256,0.75],['tafel_friseur',192,256,0.75],['tafel_wasch',192,256,0.75],['plakat_apo',192,256,0.75],['plakat_optik',192,256,0.75],['reise_strand',192,256,0.75],['reise_berge',192,256,0.75],['reise_stadt',192,256,0.75],['lastminute',192,256,0.75],['frisuren',192,256,0.75],['kalender',192,256,0.75],['getraenke',192,256,0.75],['buch_best',192,256,0.75],
  ['kat_apo',512,48,0.75],['kat_buch',512,48,0.75],['lotto',256,96,0.75],['preisleiste',512,24,0.5],
  ['front_holz',256,128,0.75],['front_apo',256,128,0.75],['front_metzger',256,128,0.75],['front_kiosk',256,128,0.75],['front_stahl',256,128,0.75],
  ['waschmaschine',160,224,0.75],['trockner',160,160,0.75],['monitor',128,80,0.75],['spiegel',160,256,0.75],['kiste_bier',192,128,0.75],['kiste_wasser',192,128,0.75],['kiste_saft',192,128,0.75],['kiste_oben',192,128,0.5],
  ['torte1',128,128,0.5],['torte2',128,128,0.5],['torte3',128,128,0.5],['torte_seite',256,96,0.5],['pizza',128,128,0.5],['karo',128,128,0.5],['cover',512,128,0.75],
  ['blumen1',128,160],['blumen2',128,160],['blumen3',128,160],['blumen4',128,160],['pflanze',192,256,0.75],['brille',128,48],['wurst',256,160]];
/* Regalpacker: Kacheln nach Hoehe sortiert in Zeilen */
function iaPacken(){ const L=IA_LISTE.map(([id,dw,dh,m])=>({id,dw,dh,w:Math.round(dw*(m||1)),h:Math.round(dh*(m||1))})).sort((a,b)=>b.h-a.h||b.w-a.w); let x=0,y=0,zh=0;
  for(const k of L){ if(x+k.w>IA.W){ x=0; y+=zh+IA.PAD; zh=0; } k.x=x; k.y=y; x+=k.w+IA.PAD; zh=Math.max(zh,k.h); IA.K[k.id]=k; }
  IA.voll=y+zh; return L; }
/* UV-Rechteck [u0,v0,u1,v1] einer Kachel; Teilbereich in Bruchteilen (y von oben) */
function ia(id,fx0,fy0,fx1,fy1){ const k=IA.K[id]||IA.K.weiss, e=0.5;
  if(fx0===undefined){ fx0=0; fy0=0; fx1=1; fy1=1; }
  const x0=k.x+fx0*k.w+e, x1=k.x+fx1*k.w-e, y0=k.y+fy0*k.h+e, y1=k.y+fy1*k.h-e;
  return [x0/IA.W,1-y1/IA.H,x1/IA.W,1-y0/IA.H]; }
function iaTex(){
  if(IA.tex) return IA.tex;
  const L=iaPacken();
  /* schwache Rechner (Niedrig, Ultra Low, Handy): halbe Aufloesung */
  const sp=(typeof gfxNiedrig==='function'&&gfxNiedrig(GFX))||!HIQ, s=sp?0.5:1, r=iaRng(4711);
  IA.tex=tex(IA.W*s,IA.H*s,(g,W,H)=>{ g.clearRect(0,0,W,H); g.scale(s,s);
    for(const k of L){ g.save(); g.translate(k.x,k.y); g.beginPath(); g.rect(0,0,k.w,k.h); g.clip(); g.scale(k.w/k.dw,k.h/k.dh); try{ IA_MAL[k.id](g,k.dw,k.dh,r); }catch(e){ g.fillStyle='#f0f'; g.fillRect(0,0,k.w,k.h); } g.restore(); } });
  IA.tex.anisotropy=Math.min(8,GFX_START.ani*2);
  return IA.tex; }
/* Wie viel Zufall die alte Einrichtung (bis 08.10.) aus Math.random zog.
   Jedes three-Objekt (Geometrie, Mesh, Material) holt sich beim Bauen eine
   uuid aus 4 Zufallszahlen, dazu kamen rand() bei Blumen und Buechern.
   Gezaehlt wird nach dem alten Aufbau: je Bauteil 2 Geometrien (Form und
   ihre Kopie beim Verschmelzen), je Laden 2 verschmolzene Geometrien und
   2 Meshes, beim ersten Laden die 2 Materialien. Gegenprobe gegen die
   alte Fassung: siehe Kopf von src/tests/laeden.js (ZUFALL). */
let _altErster=true;
function _altZufall(t,iw,aw){ const nA=w=>Math.max(1,Math.floor(aw/w)), fl=Math.floor;
  let n=5, nl=Math.max(2,Math.round(iw/2)), zr=0;
  const regal=(bw,f,per,rnd)=>{ n+=4; for(let k=0;k<f;k++){ n+=1; if(HIQ||k%2===0){ const j=fl((bw-0.1)/0.16); n+=j*per; zr+=j*(rnd||0); } } };
  if(t.startsWith('BÄCK')){ regal(iw*0.6,4,1); n+=2+fl(iw*0.55/0.2)+1+nA(0.9)*4; }
  else if(t.startsWith('APOTH')){ regal(iw*0.5,5,1); regal(iw*0.35,5,1); n+=2+nA(1.2)+1+nA(0.26); nl+=2; }
  else if(t.startsWith('BLUM')){ n+=2*nA(0.5)*6+3*2; zr+=2*nA(0.5)*15; }
  else if(t.startsWith('CAF')){ n+=2+fl(iw*0.5/0.3)+2+22+Math.max(0,nA(1.4)-1)*7; }
  else if(t.startsWith('BUCH')){ regal(iw*0.45,6,1,1); regal(iw*0.4,6,1,1); n+=3+fl(aw*0.8/0.3)*3; }
  else if(t.startsWith('WASCH')){ n+=fl(iw/0.72)*3+1; }
  else if(t.startsWith('GETR')){ n+=fl(iw/0.5)*8+fl(iw/0.7)*2+nA(1.1)*3; }
  else if(t.startsWith('PIZZ')){ n+=2+1+5+5+Math.max(0,Math.min(2,nA(1.6))-1)*6; nl+=1; }
  else if(t.startsWith('METZ')){ n+=1+fl(iw*0.75/0.22); regal(iw*0.7,3,1); n+=2; for(let j=0;j<nA(0.34);j++) n+=j%3===1?1:2; n+=1+nA(0.4); }
  else if(t.startsWith('FRIS')){ n+=fl(iw/1.1)*4+2+1+fl(aw*0.55/0.12); nl+=fl(iw/1.1); }
  else if(t.startsWith('OPTIK')){ regal(iw*0.8,5,1); n+=2+1+nA(0.7)*2; }
  else if(t.startsWith('REISE')){ n+=fl(iw/1.4)*4+fl(iw/0.9)+Math.max(1,Math.min(3,fl((aw-0.9)/1.3)))*4+7; }
  else { regal(iw*0.5,5,1); n+=2+22+1+3*nA(0.24)*2; }
  const uuid=2*(n+nl)+4+(_altErster?2:0); _altErster=false;
  return 4*uuid+zr; }
let _innenM=null,_lichtM=null;
const _innenNacht={value:0};
function ladenInnen(g,typ,xa,xb,gfH,z1,farbe,yb){
  /* eigener Zufall fuer alles, was hier entsteht (auch die uuids von
     three) - der Strassen-Seed bekommt danach genau den alten Verbrauch */
  const mr=Math.random, t0=typ.toUpperCase(), x0a=xa+0.025, iwa=xb-0.025-x0a, awa=xb-1.2-x0a-0.1, n0=_altZufall(t0,iwa,awa);
  Math.random=iaRng(((xa*1000)|0)^0x5bd1e995);
  try{ _ladenInnenBau(g,typ,xa,xb,gfH,z1,farbe,yb); }
  finally{ Math.random=mr; }
  for(let i=0;i<n0;i++) Math.random();
}
function _ladenInnenBau(g,typ,xa,xb,gfH,z1,farbe,yb){
  if(!_innenM){ _innenM=new THREE.MeshStandardMaterial({vertexColors:true,map:iaTex(),alphaTest:0.5,roughness:0.7,emissive:LIN(0x40362a),emissiveIntensity:0});
    /* Der Raum wird nach hinten dunkler (Vertexfarbe, unten), deshalb
       darf der Grundton heller sein als der alte Dimmer 0x9a958e - mit
       dem war die Ware hinter der Scheibe nicht zu erkennen (27.09.) */
    _innenM.color=LIN(0xd2ccc3);
    /* Nachts leuchtet der Laden von innen: die Einrichtung strahlt in
       ihrer eigenen Farbe (Vertexfarbe mal Atlas), statt nur flach im
       Emissive-Ton. Ohne das war der Laden nachts eine graue Hoehle (26.09.). */
    _innenM.onBeforeCompile=sh=>{ sh.uniforms.uNacht=_innenNacht;
      sh.fragmentShader='uniform float uNacht;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\n#ifdef USE_MAP\n totalEmissiveRadiance += vColor * texelColor.rgb * vec3(1.0,0.82,0.6) * uNacht;\n#else\n totalEmissiveRadiance += vColor * vec3(1.0,0.82,0.6) * uNacht;\n#endif\n#endif'); };
    _lichtM=new THREE.MeshBasicMaterial({color:0xfff6e2,toneMapped:false}); }
  /* Waende und Boden schliessen buendig an die Laibung an - vorher
     blieb seitlich und vorn ein Spalt, durch den man schraeg ins hohle
     Haus sah (27.09.) */
  const T=[], L=[], D=2.6, x0=xa+0.025, x1=xb-0.025, iw=x1-x0, xm=(x0+x1)/2, z0=z1-D, yt=gfH-0.02, H=yt-yb;
  /* Schaufensterzone: vom linken Rand bis vor die Ladentuer (rechts) -
     dort steht die Auslage, der Weg zur Tuer bleibt frei (27.09.) */
  const xt=xb-1.2, aw=xt-x0-0.1, am=(x0+0.05+xt)/2, zA=z1-0.42;
  const t=typ.toUpperCase(), r=iaRng(((xa*1000)|0)^(t.charCodeAt(0)*7919)^(t.length*104729));
  const DET=HIQ&&!gfxNiedrig(GFX);
  const WS=ia('weiss'), PH=Math.PI/2;
  const uvSet=(geo,R)=>{ const uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,R[0]+uv.getX(i)*(R[2]-R[0]),R[1]+uv.getY(i)*(R[3]-R[1])); return geo; };
  /* B: Quader ohne Bild (Vertexfarbe), BT: Quader mit Bild je Seite */
  const B=(bw,bh,bd,x,y,z,c,rx)=>T.push({geo:atlasBox(bw,bh,bd,{side:WS,top:WS,front:WS}),m:tm(x,y,z,rx||0),color:c});
  const BT=(bw,bh,bd,x,y,z,R,c)=>T.push({geo:atlasBox(bw,bh,bd,{side:R.side||WS,top:R.top||WS,front:R.front||WS}),m:tm(x,y,z),color:c===undefined?0xffffff:c});
  /* Q: Bild-Rechteck, zeigt nach +z (zur Strasse) */
  const Q=(w,h,x,y,z,R,c,rx,ry)=>T.push({geo:uvSet(new THREE.PlaneGeometry(w,h),R),m:tm(x,y,z,rx||0,ry||0,0),color:c===undefined?0xffffff:c});
  const C=(r1,r2,h,x,y,z,c,seg,rx)=>T.push({geo:uvSet(new THREE.CylinderGeometry(r1,r2,h,seg||10),WS),m:tm(x,y,z,rx||0),color:c});
  /* Zylinder mit Bild: Mantel und Deckel getrennt (Torten, Eimer) */
  const CT=(r1,r2,h,x,y,z,Rs,Rd,seg)=>{ const s=seg||14, geo=new THREE.CylinderGeometry(r1,r2,h,s), uv=geo.attributes.uv, nT=(s+1)*2;
    for(let i=0;i<uv.count;i++){ const R=i<nT?Rs:Rd; uv.setXY(i,R[0]+uv.getX(i)*(R[2]-R[0]),R[1]+uv.getY(i)*(R[3]-R[1])); }
    T.push({geo,m:tm(x,y,z),color:0xffffff}); };
  const K=(rad,x,y,z,c,sy)=>T.push({geo:uvSet(new THREE.SphereGeometry(rad,8,6),WS),m:tm(x,y,z,0,0,0,1,sy||1,1),color:c});
  /* Kachelflaechen: Boden (k m je Kachel) und Wand */
  const kBoden=(id,k,c)=>{ const R=ia(id); for(let x=x0;x<x1-1e-3;x+=k) for(let z=z0;z<z1-1e-3;z+=k){ const w=Math.min(k,x1-x), d=Math.min(k,z1-z);
      Q(w,d,x+w/2,yb,z+d/2,[R[0],R[3]-(R[3]-R[1])*d/k,R[0]+(R[2]-R[0])*w/k,R[3]],c,-PH); } };
  const kWand=(id,k,xa2,xb2,ya,yb2,z,c,kh)=>{ const R=ia(id); kh=kh||k; for(let x=xa2;x<xb2-1e-3;x+=k) for(let y=ya;y<yb2-1e-3;y+=kh){ const w=Math.min(k,xb2-x), h=Math.min(kh,yb2-y);
      Q(w,h,x+w/2,y+h/2,z,[R[0],R[1],R[0]+(R[2]-R[0])*w/k,R[1]+(R[3]-R[1])*h/kh],c); } };
  /* Front aus Kacheln in natuerlicher Groesse (Theken, Schubladen) statt
     eine Kachel ueber die ganze Breite zu ziehen */
  const kFront=(id,xl,xr,ya,yb2,z,c)=>{ const k=IA.K[id]; kWand(id,(yb2-ya)*k.dw/k.dh,xl,xr,ya,yb2,z,c,yb2-ya); };
  /* Schilderleiste: Kachel in Stuecken von gleicher Hoehe nebeneinander */
  const leiste=(id,xl,xr,y,z,h)=>{ const k=IA.K[id], sw=h*k.dw/k.dh; for(let x=xl;x<xr-0.05;x+=sw){ const w=Math.min(sw,xr-x); Q(w,h,x+w/2,y,z,ia(id,0,0,w/sw,1)); } };
  /* Regalreihe mit Ware: Kachel (1,6 x 0,4 m) passend skaliert, zufaelliger Ausschnitt */
  const ware=(ids,xl,xr,y,z,hMax,c,tief)=>{ const sc=Math.min(1,hMax/0.4), segW=1.6*sc; let x=xl;
    while(x<xr-0.05){ const w=Math.min(segW,xr-x), f=w/segW, f0=r()*(1-f), id=pickR(r,ids);
      Q(w,0.4*sc,x+w/2,y+0.2*sc,z,ia(id,f0,0,f0+f,1),c);
      if(tief&&DET){ const g0=r()*(1-f); Q(w,0.4*sc,x+w/2,y+0.2*sc,z-0.12,ia(pickR(r,ids),g0,0,g0+f,1),0x9a9a9a); }
      x+=w; } };
  /* Wandregal: Rueckwand, Seiten, Boeden mit Preisleiste, Ware je Fach */
  const regal=(x,bw,ys,ids,o)=>{ o=o||{}; const zb=o.z===undefined?z0:o.z, top=ys[ys.length-1]+(o.oben||0.42), zr=zb+0.05+(o.tief||0.4)/2, td=o.tief||0.4, fc=o.farbe===undefined?0xeeeae2:o.farbe;
    B(bw,top-yb,0.02,x,(yb+top)/2,zb+0.04,o.rueck===undefined?0xb8b2a8:o.rueck);
    for(const sx of [-1,1]) B(0.03,top-yb,td,x+sx*bw/2,(yb+top)/2,zr,fc);
    B(bw,0.03,td,x,top,zr,fc); B(bw,ys[0]-yb,0.02,x,(yb+ys[0])/2,zr+td/2,o.sockel===undefined?0x3a3632:o.sockel);
    ys.forEach((y,k)=>{ B(bw-0.04,0.025,td,x,y,zr,fc);
      if(o.leiste!==false) Q(bw-0.04,0.035,x,y-0.005,zr+td/2+0.003,ia('preisleiste',r()*0.5,0,r()*0.5+0.5,1));
      const hM=(k<ys.length-1?ys[k+1]:top)-y-0.04; ware(o.ids&&o.ids[k]?o.ids[k]:ids,x-bw/2+0.03,x+bw/2-0.03,y+0.013,zr+td*0.3,hM,o.c,o.tief2!==false); }); };
  const theke=(x,bw,front,c,top,tiefe)=>{ const d=tiefe||0.6; B(bw,0.95,d,x,yb+0.475,z0+1.35,c); kFront(front,x-bw/2,x+bw/2,yb,yb+0.95,z0+1.35+d/2+0.003,c); B(bw+0.06,0.04,d+0.06,x,yb+0.97,z0+1.35,top===undefined?0x3a3f48:top); };
  const plakat=(id,w,x,y,z,ry)=>{ const k=IA.K[id], h=w*k.dh/k.dw; B(w+0.04,h+0.04,0.015,x,y,z-0.01,0x2a2a2c); Q(w,h,x,y,z,ia(id),0xffffff,0,ry||0); };
  const pflanze=(x,z,h,topf)=>{ C(0.17,0.13,0.34,x,yb+0.17,z,topf||0xe8e4dc,12); Q(h*0.75,h,x,yb+0.3+h/2,z,ia('pflanze')); if(DET) Q(h*0.75,h,x,yb+0.3+h/2,z,ia('pflanze'),0xd8d8d8,0,PH); };
  const stuhl=(x,z,c,ry)=>{ B(0.4,0.04,0.4,x,yb+0.45,z,c); B(0.4,0.42,0.04,x,yb+0.68,z-0.18*(ry||1),c); for(const sx of [-1,1]) for(const sz of [-1,1]) B(0.03,0.45,0.03,x+sx*0.17,yb+0.225,z+sz*0.17,0x2a2a2c); };
  const sockelLeiste=c=>{ B(iw,0.08,0.015,xm,yb+0.04,z0+0.03,c||0x3a3632); };
  /* Raum: Decke, Seitenwaende (eine Stufe dunkler als die Rueckwand: das
     helle Creme stand schraeg gesehen als leuchtender Block hinter der
     Tuer, 26.09.) */
  const wand=parseInt(farbe.slice(1),16), hell=new THREE.Color(wand).lerp(new THREE.Color(0xe8e2d6),0.6).getHex(), seite=hexMix(hell,0x2a2622,0.35);
  B(iw,0.04,D,xm,yt,(z0+z1)/2,0xf2f0ea);
  for(const sx of [-1,1]) B(0.05,H,D,xm+sx*iw/2,(yb+yt)/2,(z0+z1)/2,seite);
  const rueckwand=(id,k,c,bis)=>{ if(id) kWand(id,k,x0,x1,yb,bis||yt,z0+0.026,c); if(!id||bis) B(iw,yt-(bis||yb),0.05,xm,((bis||yb)+yt)/2,z0,id&&bis?hell:(c===undefined?hell:c)); };
  /* Deckenleuchten */
  const nl=Math.max(2,Math.round(iw/2));
  for(let i=0;i<nl;i++) L.push({geo:new THREE.BoxGeometry(0.9,0.03,0.25),m:tm(x0+iw*(i+0.5)/nl,yt-0.03,(z0+z1)/2)});
  const podest=(h,id,c)=>{ c=c===undefined?0xf2f0ea:c; B(aw,h,0.5,am,yb+h/2,z1-0.32,c); if(id) kFront(id,am-aw/2,am+aw/2,yb,yb+h,z1-0.069,c); };
  const nA=w=>Math.max(1,Math.floor(aw/w));

  if(t.startsWith('BÄCK')){
    kBoden('boden_terrakotta',1.2,0xe8dccc); rueckwand('wand_fliese',1.2,0xf4efe6,yb+1.0); sockelLeiste();
    /* Rueckbuffet mit Brotregal darueber (schraege Boeden), Tafel oben */
    const bw=xt-x0-0.3, bx=x0+0.15+bw/2;
    B(iw-0.2,0.9,0.55,xm,yb+0.45,z0+0.33,0xd8c8b0); kFront('front_holz',x0+0.1,x1-0.1,yb,yb+0.9,z0+0.607,0xd8c8b0); B(iw-0.16,0.04,0.6,xm,yb+0.92,z0+0.33,0x5a3b26);
    B(bw,1.3,0.02,bx,yb+1.6,z0+0.04,0xc49a6a); for(const sx of [-1,1]) B(0.04,1.35,0.42,bx+sx*bw/2,yb+1.62,z0+0.25,0x8a6038);
    for(let k=0;k<3;k++){ const y=yb+1.3+k*0.36; B(bw-0.06,0.025,0.4,bx,y,z0+0.25,0x7a5434,-0.18); ware(['brote'],bx-bw/2+0.05,bx+bw/2-0.05,y+0.02,z0+0.36,0.32,0xffffff,false); }
    ware(['broetchen'],bx-bw/2+0.05,bx+bw/2-0.05,yb+0.94,z0+0.42,0.3,0xffffff,false);
    plakat('tafel_baeck',0.72,x1-0.75,yb+2.0,z0+0.06);
    /* Kaffeemaschine rechts auf dem Buffet */
    { const xk=x1-0.6; B(0.5,0.55,0.45,xk,yb+1.22,z0+0.32,0x2a2a2c); B(0.44,0.1,0.02,xk,yb+1.4,z0+0.56,0xb8bec8); for(const sx of [-1,1]) C(0.03,0.03,0.08,xk+sx*0.1,yb+1.08,z0+0.5,0xb8bec8,8); }
    /* Theke mit Glasaufsatz: Kuchen unten, Teilchen oben, Chromkanten */
    const tw=iw*0.62, tx=x0+iw*0.4; theke(tx,tw,'front_holz',0xffffff,0xd8dade);
    ware(['kuchen'],tx-tw/2+0.05,tx+tw/2-0.05,yb+0.99,z0+1.35,0.22,0xffffff,false);
    for(const sx of [-1,1]) B(0.02,0.3,0.02,tx+sx*(tw/2-0.01),yb+1.12,z0+1.62,0xd8dade); B(tw,0.02,0.02,tx,yb+1.26,z0+1.62,0xd8dade); B(tw,0.02,0.5,tx,yb+1.27,z0+1.38,0xe8eef2);
    B(0.32,0.22,0.3,tx+tw/2-0.25,yb+1.1,z0+1.15,0x2a2e36);
    /* Auslage im Fenster: Podest, Koerbe mit Broetchen und Brot, Angebotstafel */
    podest(0.28,'front_holz',0xd8c8b0);
    ware(['broetchen','brote'],x0+0.15,xt-0.3,yb+0.29,z1-0.3,0.34,0xffffff,false);
    { const xs=xt-0.55; B(0.04,0.9,0.04,xs,yb+0.74,z1-0.6,0x3a2a1e); Q(0.46,0.62,xs,yb+0.98,z1-0.57,ia('tafel_baeck',0,0,1,0.62)); }
  } else if(t.startsWith('APOTH')){
    kBoden('boden_terrazzo',1.2,0xffffff); rueckwand(null); sockelLeiste(0xc8ccc8);
    /* Sichtwahl hinter dem HV-Tisch: unten Apothekerschubladen, oben dicht
       gefuellte Packungen in Bloecken, Kategorieleiste oben */
    const sw=iw-0.2; B(sw,0.85,0.5,xm,yb+0.425,z0+0.3,0xf4f4f2); kFront('schubladen',xm-sw/2,xm+sw/2,yb,yb+0.85,z0+0.553,0xffffff); B(sw+0.02,0.03,0.52,xm,yb+0.865,z0+0.3,0xd8dcd8);
    const ys=[]; for(let k=0;k<5;k++) ys.push(yb+1.0+k*0.3); regal(xm,sw,ys,['medi1','medi2'],{rueck:0xe4ece6,oben:0.28,tief:0.3,sockel:0xe8eae6});
    leiste('kat_apo',xm-sw/2,xm+sw/2,ys[4]+0.38,z0+0.07,0.17);
    /* HV-Tische mit Bildschirm (Rueckseite zur Kundschaft) und Kassenschale */
    const n=iw>6.5?2:1; for(let i=0;i<n;i++){ const hx=x0+iw*(n===2?0.3+i*0.36:0.45); theke(hx,1.2,'front_apo',0xffffff,0xd0d4d0,0.7); B(0.42,0.3,0.04,hx-0.2,yb+1.2,z0+1.3,0x1a1c20); B(0.06,0.14,0.06,hx-0.2,yb+1.04,z0+1.3,0x1a1c20); B(0.3,0.02,0.22,hx+0.3,yb+1.0,z0+1.55,0x5a6a5a); }
    L.push({geo:new THREE.BoxGeometry(0.1,0.34,0.02),m:tm(x1-0.6,yt-0.35,z0+0.04)}); L.push({geo:new THREE.BoxGeometry(0.34,0.1,0.02),m:tm(x1-0.6,yt-0.35,z0+0.04)});
    /* Freiwahl-Gondel an der Tuer: Pflege, Pflaster, Tees */
    regal(xt-0.75,1.1,[yb+0.15,yb+0.48,yb+0.81],['kosmetik','medi2'],{rueck:0xe4ece6,oben:0.32,tief:0.35,z:z0+1.9});
    /* Fenster: Plakat und Aufsteller mit Riesenpackungen */
    plakat('plakat_apo',0.62,x0+0.6,yb+1.45,z1-0.75);
    if(aw>2.4) plakat('plakat_apo',0.62,x0+1.5,yb+1.45,z1-0.75);
    podest(0.34,null,0xf4f2ee);
    ware(['medi1','medi2','kosmetik'],x0+0.1,xt-0.25,yb+0.345,z1-0.3,0.4,0xffffff,false);
  } else if(t.startsWith('METZ')){
    kBoden('boden_rot',1.2,0xffffff); rueckwand('wand_fliese',1.2,0xffffff,yb+2.2); sockelLeiste(0x8a8f96);
    /* Rueckseite: Arbeitstheke mit Aufschnittmaschine und Waage, Wurststange, Preistafel */
    B(iw-0.2,0.9,0.55,xm,yb+0.45,z0+0.33,0xd8dce0); kFront('front_stahl',x0+0.1,x1-0.1,yb,yb+0.9,z0+0.607,0xffffff); B(iw-0.18,0.04,0.58,xm,yb+0.92,z0+0.33,0xd0d4d8);
    { const xs=x0+0.7; B(0.42,0.18,0.36,xs,yb+1.03,z0+0.33,0xe8e8e8); C(0.15,0.15,0.02,xs,yb+1.22,z0+0.4,0xc0c6cc,18,PH); B(0.36,0.12,0.3,x1-0.6,yb+1.0,z0+0.33,0xe8e8e8); B(0.16,0.07,0.01,x1-0.6,yb+1.04,z0+0.49,0x1e3a2a); }
    B(iw-0.6,0.025,0.025,xm,yb+1.95,z0+0.18,0xb8bec8); for(let x=x0+0.35;x<x1-0.4;x+=0.9){ const w=Math.min(0.9,x1-0.35-x); Q(w,0.5,x+w/2,yb+1.7,z0+0.18,ia('wurst',0,0,w/0.9,0.9)); }
    plakat('tafel_metzger',0.66,xm,yb+2.55,z0+0.06);
    /* Bedientheke: Edelstahlfront mit rotem Band, schraege Auslage (Fleisch,
       Wurst, Aufschnitt mit Preisschildern), Glasoberkante und Ablage */
    const tw=iw*0.82, zt=z0+1.45, a=0.62;
    B(tw,0.85,0.75,xm,yb+0.425,zt,0xd8dce0); kFront('front_metzger',xm-tw/2,xm+tw/2,yb,yb+0.85,zt+0.378,0xffffff);
    for(let x=xm-tw/2+0.02;x<xm+tw/2-0.05;x+=1.2){ const w=Math.min(1.2,xm+tw/2-0.02-x); Q(w,0.6,x+w/2,yb+1.02,zt-0.02,ia('fleisch',0,0,w/1.2,1),0xffffff,-PH+a); }
    B(tw,0.02,0.02,xm,yb+1.42,zt-0.3,0xd8dce0); for(const sx of [-1,1]) B(0.02,0.55,0.7,xm+sx*tw/2,yb+1.12,zt,0xd8dce0); B(tw,0.025,0.03,xm,yb+0.86,zt+0.37,0xd8dce0);
    B(tw,0.03,0.22,xm,yb+1.44,zt-0.3,0xe8eef2);
    /* Im Fenster: dunkle Kachelwand, Stange mit Wuersten und Schinken, darunter Schalen */
    /* dunkle Kachelwand dahinter und dicke Wuerste: vorher las sich die
       Auslage wie eine Tapete mit Punkten (26.09.) */
    B(aw,1.25,0.03,am,yb+1.5,zA-0.22,0x3a2e2a);
    B(aw,0.03,0.03,am,yb+2.05,zA,0xb8bec8);
    for(let j=0;j<nA(0.34);j++){ const x=x0+0.22+j*0.34;
      if(j%3===1){ C(0.09,0.15,0.42,x,yb+1.7,zA,0x7a3022,12); C(0.13,0.13,0.012,x,yb+1.49,zA,0xd89a8a,12); C(0.012,0.012,0.12,x,yb+1.97,zA,0xe8e2d4,4); } else { C(0.06,0.05,0.6,x,yb+1.72,zA,j%2?0x7a2a22:0xa05a3a); C(0.012,0.012,0.12,x,yb+1.99,zA,0xe8e2d4,4); } }
    podest(0.4,'front_stahl',0xffffff);
    for(let x=x0+0.1;x<xt-0.25;x+=0.9){ const w=Math.min(0.9,xt-0.15-x); Q(w,0.45,x+w/2,yb+0.55,z1-0.36,ia('fleisch',0,0,w/0.9,0.5),0xffffff,-PH+0.75); }
  } else if(t.startsWith('FRIS')){
    kBoden('boden_holz',1.2,0x8a7a6e); rueckwand(null,0,0x8a8d92); sockelLeiste(0x1e1e20);
    /* Bedienplaetze: Spiegel mit Leuchtleiste, Ablage mit Produkten, Hydraulikstuhl */
    const n=Math.max(2,Math.floor((iw-0.4)/1.25)), dx=(iw-0.4)/n;
    for(let j=0;j<n;j++){ const x=x0+0.2+dx*(j+0.5);
      Q(0.62,1.0,x,yb+1.45,z0+0.06,ia('spiegel')); L.push({geo:new THREE.BoxGeometry(0.62,0.03,0.02),m:tm(x,yb+1.98,z0+0.07)});
      B(0.8,0.04,0.28,x,yb+0.82,z0+0.18,0xf2f0ea); ware(['haar'],x-0.36,x+0.36,yb+0.84,z0+0.2,0.16,0xffffff,false);
      C(0.22,0.24,0.04,x,yb+0.02,z0+0.85,0x9aa1ac,16); C(0.05,0.05,0.38,x,yb+0.21,z0+0.85,0x9aa1ac);
      B(0.52,0.12,0.5,x,yb+0.48,z0+0.85,0x16161a); B(0.5,0.6,0.1,x,yb+0.86,z0+0.62,0x16161a); B(0.2,0.14,0.08,x,yb+1.22,z0+0.6,0x16161a);
      for(const sx of [-1,1]) B(0.06,0.06,0.42,x+sx*0.28,yb+0.66,z0+0.85,0x16161a); B(0.36,0.03,0.18,x,yb+0.16,z0+1.18,0x9aa1ac); }
    plakat('frisuren',0.62,x0+0.55,yb+1.5,z1-0.7);
    plakat('tafel_friseur',0.5,xt-0.45,yb+1.35,z1-0.6);
    /* Im Fenster: Pflanze und ein Bord mit Pflegeprodukten */
    pflanze(x0+0.4,z1-0.42,1.1,0x2a2a2c);
    B(aw*0.6,0.03,0.25,am+aw*0.15,yb+0.9,zA+0.05,0xf4f2ee); ware(['haar'],am-aw*0.15+0.03,am+aw*0.45-0.03,yb+0.915,zA+0.08,0.22,0xffffff,false);
  } else if(t.startsWith('OPTIK')){
    kBoden('boden_holz',1.2,0xd8c8b4); rueckwand(null,0,0xf2f0ea); sockelLeiste(0xd8d4cc);
    /* Brillenwand: hinterleuchtete Paneele mit Glasboeden, unten Schubladen */
    const bw=iw-0.3; B(bw,0.9,0.45,xm,yb+0.45,z0+0.27,0xf4f4f2); kFront('schubladen',xm-bw/2,xm+bw/2,yb,yb+0.9,z0+0.497,0xffffff);
    kWand('brillenwand',1.6,xm-bw/2,xm+bw/2,yb+1.0,yb+1.0+Math.min(1.6,H-1.2),z0+0.03,0xffffff,0.8);
    for(let k=0;k<4;k++) L.push({geo:new THREE.BoxGeometry(bw,0.012,0.02),m:tm(xm,yb+1.0+k*0.4,z0+0.08)});
    /* Beratungstisch mit Spiegel und zwei Stuehlen */
    const tx=x0+iw*0.42; B(1.2,0.04,0.7,tx,yb+0.74,z0+1.4,0xf4f2ee); for(const sx of [-1,1]) B(0.04,0.72,0.6,tx+sx*0.56,yb+0.36,z0+1.4,0xd8d8d8);
    Q(0.24,0.32,tx+0.3,yb+0.95,z0+1.25,ia('spiegel')); Q(0.3,0.2,tx-0.3,yb+0.9,z0+1.2,ia('monitor')); B(0.3,0.2,0.02,tx-0.3,yb+0.9,z0+1.19,0x16181c);
    stuhl(tx-0.3,z0+1.95,0x2a2d33); stuhl(tx+0.3,z0+1.95,0x2a2d33);
    /* Im Fenster: Saeulen mit je einer Brille und ein Plakat */
    for(let j=0;j<nA(0.7);j++){ const x=x0+0.4+j*0.7, h=0.5+(j%3)*0.25;
      C(0.12,0.12,h,x,yb+h/2,z1-0.4,0xf4f2ee,12); Q(0.2,0.075,x,yb+h+0.05,z1-0.33,ia('brille')); }
    plakat('plakat_optik',0.58,xt-0.5,yb+1.5,z1-0.65);
  } else if(t.startsWith('BLUM')){
    kBoden('boden_grau',1.2,0xc8c4bc); rueckwand(null,0,0x3a4a3a); sockelLeiste(0x2a2a2a);
    /* Stufenregal an der Rueckwand mit Zinkeimern voller Schnittblumen */
    const BL=['blumen1','blumen2','blumen3','blumen4'];
    const eimer=(x,y,z,s)=>{ C(0.13*s,0.1*s,0.3*s,x,y+0.15*s,z,0x8a9098,12); const id=pickR(r,BL); Q(0.42*s,0.52*s,x,y+0.3*s+0.24*s,z,ia(id)); if(DET) Q(0.42*s,0.52*s,x,y+0.3*s+0.24*s,z,ia(pickR(r,BL)),0xe0e0e0,0,PH); };
    for(let k=0;k<3;k++){ const y=yb+0.3+k*0.35, z=z0+0.75-k*0.3; B(iw-0.4,0.04,0.32,xm,y,z,0x6a4a2e); B(iw-0.4,y-yb,0.02,xm,(yb+y)/2,z+0.16,0x5a3b26);
      for(let j=0;j<Math.floor((iw-0.6)/0.36);j++) eimer(x0+0.4+j*0.36,y+0.02,z,0.9); }
    /* Bindetisch mit Papierrolle, Gruenpflanzen */
    B(1.3,0.05,0.6,xt-0.6,yb+0.85,z0+1.6,0x7a5a3a); for(const sx of [-1,1]) B(0.05,0.83,0.55,xt-0.6+sx*0.6,yb+0.42,z0+1.6,0x5a3b26); C(0.06,0.06,0.9,xt-0.6,yb+0.95,z0+1.35,0xe8dcc0,10,0); T[T.length-1].m=tm(xt-0.6,yb+0.95,z0+1.35,0,0,PH);
    pflanze(x1-0.4,z0+0.6,1.4,0xb06a3a);
    /* Fenster: zwei Reihen Eimer */
    for(let rr=0;rr<2;rr++) for(let j=0;j<nA(0.5);j++) eimer(x0+0.3+j*0.5,yb,z1-0.45-rr*0.6,1.05);
  } else if(t.startsWith('CAF')){
    kBoden('boden_holz',1.2,0xb89a80); rueckwand('wand_backstein',1.0,0xd8c8b8); sockelLeiste(0x2a2018);
    /* Theke mit Siebtraeger, Tassen, Kaffeekarte; Bord mit Tassen */
    const tw=iw*0.55, tx=x0+iw*0.6; theke(tx,tw,'front_holz',0xe8d8c8,0x2a2018);
    for(let j=0;j<Math.floor(tw*0.5/0.16);j++) C(0.04,0.035,0.08,tx-tw/2+0.15+j*0.16,yb+1.03,z0+1.25,0xf4f2ee,8);
    { const xs=tx+tw/2-0.45; B(0.6,0.42,0.45,xs,yb+1.2,z0+1.25,0xc4c9ce); B(0.62,0.04,0.47,xs,yb+1.43,z0+1.25,0x2a2a2c); for(const sx of [-1,1]) C(0.035,0.035,0.08,xs+sx*0.15,yb+1.06,z0+1.48,0x2a2a2c,8); B(0.5,0.08,0.02,xs,yb+1.33,z0+1.48,0x16181c); }
    B(iw*0.7,0.03,0.25,xm,yb+1.6,z0+0.17,0x5a3b26); for(let j=0;j<Math.floor(iw*0.6/0.14);j++) C(0.045,0.04,0.09,xm-iw*0.3+j*0.14,yb+1.66,z0+0.17,j%4?0xf4f2ee:0x2a5a6a,8);
    plakat('tafel_cafe',0.7,x0+0.6,yb+1.95,z0+0.06);
    /* Tortenvitrine direkt am Glas, damit schraeg gesehen Ware statt
       nur Spiegelung zu sehen ist (26.09.) */
    { const xv=x0+0.75, zv=z1-0.5; BT(1.2,0.8,0.55,xv,yb+0.4,zv,{front:ia('front_holz')},0x8a6a50); B(1.24,0.04,0.6,xv,yb+0.82,zv,0x2a2018);
      for(const sx of [-1,1]) B(0.03,0.75,0.03,xv+sx*0.59,yb+1.2,zv+0.26,0xc9a14e);
      B(1.2,0.03,0.52,xv,yb+1.2,zv,0xe8e4dc); B(1.22,0.04,0.56,xv,yb+1.58,zv,0x2a2018);
      const TS=ia('torte_seite');
      for(let k=0;k<2;k++) for(let j=0;j<4;j++){ const xx=xv-0.43+j*0.29, y=yb+0.84+k*0.38, a=(j+k*2)%3, Rs=[TS[0],TS[1]+(TS[3]-TS[1])*(2-a)/3,TS[2],TS[1]+(TS[3]-TS[1])*(3-a)/3];
        CT(0.12,0.12,0.13,xx,y+0.07,zv,Rs,ia('torte'+(a+1))); } }
    for(let j=0;j<nA(1.4)-1;j++){ const x=x0+2.3+j*1.4, z=z1-0.6;
      C(0.32,0.32,0.03,x,yb+0.74,z,0xf2f0ea,14); C(0.035,0.035,0.72,x,yb+0.36,z,0x2a2e36);
      for(const sx of [-1,1]){ B(0.36,0.04,0.36,x+sx*0.5,yb+0.45,z,0x3a2a20); B(0.36,0.42,0.04,x+sx*0.5,yb+0.68,z-0.16,0x3a2a20); }
      C(0.04,0.035,0.08,x+0.08,yb+0.8,z,0xf2f0ea); }
  } else if(t.startsWith('BUCH')){
    kBoden('boden_holz',1.2,0xc8b098); rueckwand(null,0,0xe8dcc4); sockelLeiste(0x3a2418);
    /* Holzregale bis unter die Decke, Kategorieleiste oben */
    const ys=[]; for(let k=0;k<6;k++) ys.push(yb+0.12+k*Math.min(0.42,(H-0.7)/6));
    regal(xm,iw-0.2,ys,['buch1','buch2'],{rueck:0x3a2418,farbe:0x6a4628,sockel:0x4a2e1a,leiste:false,tief:0.32});
    leiste('kat_buch',x0+0.15,x1-0.15,Math.min(yt-0.12,ys[5]+0.52),z0+0.38,0.15);
    /* Buechertisch mit Stapeln (Cover oben) und Plakat im Fenster */
    const tw=aw*0.9; B(tw,0.06,0.7,am,yb+0.75,z1-0.65,0x5a3b26); for(const sx of [-1,1]) B(0.06,0.72,0.6,am+sx*tw*0.47,yb+0.36,z1-0.65,0x5a3b26);
    for(let j=0;j<Math.floor(tw*0.9/0.3);j++){ const n=1+(r()*4|0), i=r()*6|0; BT(0.22,0.035*n,0.28,am-tw*0.45+0.15+j*0.3,yb+0.78+0.0175*n,z1-0.65,{top:ia('cover',i/6,0,(i+1)/6,1)},0xf2efe6); }
    for(let j=0;j<Math.floor(tw/0.45);j++){ const i=r()*6|0; Q(0.2,0.3,am-tw*0.45+0.2+j*0.45,yb+0.95,z1-0.5,ia('cover',i/6,0,(i+1)/6,1),0xffffff,-0.25); }
    plakat('buch_best',0.55,xt-0.4,yb+1.5,z1-0.85);
  } else if(t.startsWith('WASCH')){
    kBoden('boden_hell',1.2,0xffffff); rueckwand('wand_fliese',1.2,0xffffff,yb+2.0); sockelLeiste(0x8a8f96);
    /* Waschmaschinenreihe, daneben Trockner doppelt gestapelt */
    const n=Math.floor((iw-0.2)/0.66), nw=Math.ceil(n*0.6);
    for(let j=0;j<n;j++){ const x=x0+0.43+j*0.66;
      if(j<nw){ BT(0.62,0.86,0.62,x,yb+0.43,z0+0.38,{front:ia('waschmaschine')},0xffffff); }
      else for(let k=0;k<2;k++) BT(0.62,0.68,0.62,x,yb+0.34+k*0.7,z0+0.38,{front:ia('trockner')},0xffffff); }
    B(nw*0.66,0.03,0.3,x0+0.1+nw*0.33,yb+1.6,z0+0.2,0xe8e8e8); ware(['kosmetik'],x0+0.15,x0+0.05+nw*0.66,yb+1.615,z0+0.22,0.26,0xffffff,false);
    plakat('tafel_wasch',0.6,x0+0.1+nw*0.33,yb+2.3,z0+0.08);
    /* Falttisch, Wandautomat fuer Waschmittel */
    B(1.4,0.04,0.6,xm,yb+0.85,z0+1.6,0xd8dade); for(const sx of [-1,1]) B(0.04,0.83,0.55,xm+sx*0.66,yb+0.42,z0+1.6,0x9aa1ac);
    BT(0.5,0.8,0.3,x1-0.4,yb+1.3,z1-1.2,{front:ia('monitor')},0x3a4a6a);
    /* Fenster: Bank, Waeschekorb, Pflanze */
    B(aw*0.6,0.06,0.4,am,yb+0.45,z1-0.6,0x3a4a6a); for(const sx of [-1,1]) B(0.05,0.42,0.38,am+sx*aw*0.28,yb+0.21,z1-0.6,0x2a2e36);
    B(0.45,0.28,0.32,am-aw*0.15,yb+0.62,z1-0.6,0x4a8ad0); pflanze(x0+0.3,z1-0.4,1.0);
  } else if(t.startsWith('GETR')){
    kBoden('boden_grau',1.2,0xffffff); rueckwand(null,0,0xd8d4cc); sockelLeiste();
    const KI=['kiste_bier','kiste_wasser','kiste_saft','kiste_bier'];
    const kiste=(x,y,z,id)=>BT(0.4,0.28,0.32,x,y,z,{front:ia(id),top:ia('kiste_oben'),side:ia(id,0.1,0.25,0.4,1)},0xffffff);
    const stapel=(x,z,n,id)=>{ B(0.82,0.12,0.6,x,yb+0.06,z,0xb08a5a); for(let k=0;k<n;k++) for(const sx of [-1,1]) kiste(x+sx*0.205,yb+0.26+k*0.285,z,id); };
    for(let j=0;j<Math.floor((iw-1.0)/0.9);j++) stapel(x0+0.5+j*0.9,z0+0.4,5,KI[j%4]);
    for(let j=0;j<Math.floor((iw-1.6)/1.1);j++) stapel(x0+0.6+j*1.1,z0+1.4,2,KI[(j+1)%4]);
    /* Kuehlschrank an der Tuer */
    { const xk=x1-0.45; B(0.8,1.95,0.6,xk,yb+0.975,z0+1.3,0x2a2e36); Q(0.74,1.9,xk,yb+0.975,z0+1.605,ia('kuehlschrank')); }
    /* Fenster: Kistenstapel und Angebotsplakat */
    for(let j=0;j<nA(1.1);j++) for(let k=0;k<3;k++) kiste(x0+0.4+j*1.1,yb+0.14+k*0.285,z1-0.4,KI[(j*2+k)%4]);
    plakat('getraenke',0.6,xt-0.5,yb+1.5,z1-0.75);
  } else if(t.startsWith('PIZZ')){
    kBoden('boden_terrakotta',1.2,0xffffff); rueckwand('wand_fliese',1.2,0xffffff,yb+1.3); sockelLeiste(0x5a3a2a);
    kWand('wand_backstein',1.0,x0,x1,yb+1.3,yt,z0+0.027,0xe0c8b0);
    /* Theke mit Pizzastuecken, Menuetafel, Weinregal */
    const tw=iw*0.45, tx=x0+iw*0.3; theke(tx,tw,'front_holz',0xffffff,0x3a3f48);
    for(let j=0;j<Math.floor(tw/0.36);j++) CT(0.15,0.15,0.02,tx-tw/2+0.2+j*0.36,yb+1.0,z0+1.35,WS,ia('pizza'),16);
    plakat('tafel_pizza',0.8,x0+iw*0.3,yb+2.05,z0+0.06);
    { const wx=x0+iw*0.75; B(1.2,0.03,0.3,wx,yb+1.55,z0+0.2,0x5a3b26); B(1.2,0.03,0.3,wx,yb+1.95,z0+0.2,0x5a3b26); ware(['wein'],wx-0.58,wx+0.58,yb+1.565,z0+0.22,0.38,0xffffff,false); ware(['wein','flaschen'],wx-0.58,wx+0.58,yb+1.965,z0+0.22,0.38,0xffffff,false); }
    B(0.9,0.9,0.7,x0+iw*0.75,yb+0.7,z0+0.45,0x3a3a3a); L.push({geo:new THREE.BoxGeometry(0.5,0.2,0.02),m:tm(x0+iw*0.75,yb+0.7,z0+0.81)});
    if(iw>6.5){ const xk=x1-0.5; B(0.7,1.9,0.6,xk,yb+0.95,z0+0.4,0x2a2e36); Q(0.64,1.84,xk,yb+0.95,z0+0.705,ia('kuehlschrank')); }
    /* Am Glas: gemauerter Pizzaofen mit Glut und ein Stapel Kartons -
       vorher sah man durch die Scheibe fast nur Spiegelung (26.09.) */
    const xo=x0+0.75, zo=z1-0.75;
    BT(1.1,0.75,0.9,xo,yb+0.375,zo,{front:ia('wand_backstein',0,0,1,0.6),side:ia('wand_backstein',0,0,0.8,0.6)},0xffffff); K(0.5,xo,yb+0.78,zo,0xa0583a,0.75);
    B(0.4,0.26,0.05,xo,yb+0.9,zo+0.48,0x1a1210); B(0.34,0.16,0.02,xo,yb+0.86,zo+0.51,0xff8a2a);
    C(0.06,0.06,0.5,xo+0.2,yb+1.35,zo-0.1,0x3a3a3a);
    for(let k=0;k<5;k++) B(0.36,0.05,0.36,xo+0.9,yb+0.03+k*0.052,z1-0.4,k%2?0xe8dcc0:0xd8c8a8);
    for(let j=0;j<Math.min(3,nA(1.6))-1;j++){ const x=x0+2.4+j*1.6, z=z1-0.7; BT(0.7,0.04,0.7,x,yb+0.74,z,{top:ia('karo')},0xffffff); C(0.035,0.03,0.22,x+0.15,yb+0.87,z,0x2a4a1a,8); C(0.05,0.05,0.06,x-0.12,yb+0.79,z+0.1,0xe8e4dc,8); C(0.04,0.04,0.72,x,yb+0.36,z,0x3a3f48);
      for(const sx of [-1,1]){ B(0.36,0.04,0.36,x+sx*0.55,yb+0.45,z,0x6a4a2a); B(0.36,0.4,0.04,x+sx*0.55,yb+0.66,z,0x6a4a2a); } }
  } else if(t.startsWith('REISE')){
    kBoden('boden_teppich',1.2,0xffffff); rueckwand(null,0,0xeef0f2); sockelLeiste(0x2a2e36);
    /* Prospektwand und Weltkarte an der Rueckwand */
    const pw=Math.min(2.2,iw*0.38); kWand('prospekte',pw,x0+0.15,x0+0.15+pw,yb+0.5,yb+0.5+pw*0.5,z0+0.04,0xffffff,pw*0.5); B(pw+0.06,0.06,0.2,x0+0.15+pw/2,yb+0.47,z0+0.12,0x8a8f98);
    plakat('weltkarte',Math.min(2.0,iw-pw-0.8),x0+pw+0.3+Math.min(2.0,iw-pw-0.8)/2,yb+1.85,z0+0.06);
    /* Beratungsplaetze: Tisch, Bildschirm zur Kundschaft gedreht, Stuehle */
    for(let j=0;j<Math.floor(iw/1.6);j++){ const x=x0+0.9+j*1.6;
      B(1.2,0.05,0.65,x,yb+0.74,z0+1.25,0xf2f0ea); B(1.2,0.6,0.03,x,yb+0.42,z0+1.55,0x2a4a6a); B(0.05,0.72,0.6,x-0.55,yb+0.36,z0+1.25,0x2a2e36);
      Q(0.44,0.28,x+0.1,yb+0.98,z0+1.22,ia('monitor'),0xffffff,0,-0.35); B(0.06,0.14,0.06,x+0.1,yb+0.83,z0+1.18,0x16181c);
      stuhl(x-0.25,z0+1.95,0x2a4a6a); stuhl(x+0.3,z0+1.95,0x2a4a6a); }
    /* Im Fenster: Plakatstaender mit Strand, Bergen, Stadt und Last Minute, dazu eine Palme */
    const RP=['reise_strand','lastminute','reise_berge','reise_stadt'];
    for(let j=0;j<Math.max(1,Math.min(4,Math.floor((aw-0.9)/1.0)));j++){ const x=x0+0.55+j*1.0;
      B(0.03,1.0,0.03,x,yb+0.5,zA-0.05,0x3a3f48); plakat(RP[j%4],0.66,x,yb+1.3,zA); }
    pflanze(xt-0.35,z1-0.5,1.5,0x7a5a3a);
  } else {
    /* Kiosk und Schreibwaren */
    const kiosk=t.startsWith('KIOSK');
    kBoden(kiosk?'boden_grau':'boden_holz',1.2,kiosk?0xd8d8d8:0xd0b89c); rueckwand(null,0,kiosk?0xe6e2da:0xf0ece2); sockelLeiste();
    const ys=[]; for(let k=0;k<5;k++) ys.push(yb+0.25+k*0.38);
    if(kiosk){
      /* links Suesswaren und Getraenke, rechts hinter der Kasse das Zigarettenregal mit Lotto-Schild */
      regal(x0+iw*0.24,iw*0.42,ys,['suess','flaschen'],{rueck:0x3a3f48,ids:['flaschen','suess','suess','flaschen','suess']});
      const zx=x0+iw*0.68, zw=Math.min(1.8,iw*0.36); B(zw+0.08,1.25,0.25,zx,yb+1.6,z0+0.15,0x2a2d33); kWand('zigaretten',1.6,zx-zw/2,zx+zw/2,yb+1.05,yb+2.15,z0+0.28,0xffffff,0.4);
      Q(zw*0.8,zw*0.8*96/256,zx,yb+2.45,z0+0.06,ia('lotto'));
      theke(x0+iw*0.68,iw*0.36,'front_kiosk',0xffffff); B(0.5,0.3,0.3,x0+iw*0.68-0.3,yb+1.14,z0+1.45,0x2a2e36); Q(0.48,0.12,x0+iw*0.68-0.3,yb+1.06,z0+1.61,ia('suess',0,0.5,0.3,1)); Q(0.48,0.12,x0+iw*0.68-0.3,yb+1.2,z0+1.61,ia('suess',0.4,0.5,0.7,1)); B(0.3,0.18,0.3,x0+iw*0.68+0.35,yb+1.08,z0+1.3,0x2a2e36);
    } else {
      regal(x0+iw*0.24,iw*0.42,ys,['ordner','hefte'],{rueck:0xd8d0c0,farbe:0xf4f2ee,ids:['ordner','ordner','hefte','hefte','ordner']});
      regal(x0+iw*0.62,iw*0.3,ys,['hefte','buch1'],{rueck:0xd8d0c0,farbe:0xf4f2ee});
      plakat('kalender',0.55,x1-0.55,yb+1.9,z0+0.06);
      theke(x0+iw*0.72,iw*0.3,'front_holz',0xe8d8c0);
      /* Kartenstaender und Geschenkpapierrollen */
      { const kx=xt-0.4, kz=z0+1.9; C(0.02,0.02,1.6,kx,yb+0.8,kz,0x8a8f98); for(let k=0;k<4;k++){ const i=r()*6|0; BT(0.3,0.22,0.12,kx,yb+0.65+k*0.26,kz,{front:ia('cover',i/6,0,(i+1)/6,0.8)},0xffffff); } }
      for(let j=0;j<7;j++) C(0.035,0.035,0.9,x1-0.3+(j%3)*0.08-0.08,yb+0.45,z0+2.0+((j/3)|0)*0.08,[0xc8322a,0x2f5d9e,0xd9a52f,0x3f8a4a,0x8a3a7a,0xe8e4d8,0x2a2e36][j]);
    }
    /* hinter der Glastuer ein Getraenkekuehlschrank statt nackter Wand (26.09.) */
    if(kiosk){ const xk=x1-0.45; B(0.8,1.95,0.6,xk,yb+0.975,z0+0.9,0x2a2e36); Q(0.74,1.9,xk,yb+0.975,z0+1.205,ia('kuehlschrank')); }
    /* im Fenster eine Wand mit schraeg gestellten Zeitschriften bzw. Heften */
    B(aw,1.2,0.03,am,yb+0.9,zA-0.14,0x2a2e36);
    for(let k=0;k<3;k++){ const y=yb+0.5+k*0.37; let x=x0+0.08;
      while(x<xt-0.2){ const w=Math.min(1.6,xt-0.12-x), f=w/1.6*0.95, f0=r()*(1-f);
        Q(w,0.3,x+w/2,y,zA,kiosk?ia('zeitschriften',f0,(k%3)/3,f0+f,(k%3+1)/3):ia(k===1?'cover':'hefte',f0,k===1?0:0.1,f0+f,1),0xffffff,-0.2); x+=w; }
      B(aw,0.03,0.08,am,y-0.16,zA+0.03,0x9aa0a8); }
  }
  const geo=merge(T), P=geo.attributes.position.array, F=geo.attributes.color.array;
  /* Licht kommt von vorn: nach hinten wird der Raum dunkler, die
     Auslage im Fenster bleibt hell. Vorher war alles gleich hell und
     der Laden sah nachts aus wie ein Leuchtkasten (27.09.) */
  for(let i=0,n=P.length/3;i<n;i++){ const k=1-0.55*clamp((z1-P[i*3+2])/D,0,1); F[i*3]*=k; F[i*3+1]*=k; F[i*3+2]*=k; }
  const mm=new THREE.Mesh(geo,_innenM); mm.userData.ladenInnen=t; mm.userData.ladenArgs=[typ,xa,xb,gfH,z1,farbe,yb]; g.add(mm);
  /* etwas Eigenlicht auch am Tag (die Laeden haben Licht an), nachts
     viel mehr; die Nacht liest sich an den Fensterscheiben ab */
  mm.onBeforeRender=()=>{ _innenNacht.value=0.04+0.4*(_hzM?clamp(_hzM.glas.emissiveIntensity/0.9,0,1):0); };
  if(L.length){ const lm=new THREE.Mesh(merge(L.map(l=>Object.assign(l,{color:0xffffff}))),_lichtM); lm.userData.ladenLicht=t; g.add(lm); }
}

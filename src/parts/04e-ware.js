/* =========================================================
   Verpackungen fuer Zubehoer, Essen und Getraenke (Tom, 03.10.: "die
   Verpackungen sehen alle ultra aehnlich aus ... Cracker, Glueckskekse,
   alle in einer aehnlichen Box ... bei Knicklichter ist gar kein Knicklicht
   drauf ... dass man auf dem Bild sieht, was drin ist ... jede Verpackung
   einzigartig wie beim Feuerwerk").
   Bisher bekamen alle 109 Artikel dieselbe Schachtel (Konfetti, Titel,
   Streifen) und alle Flaschen dasselbe gruene Glas. Jetzt:
   - jedes Produkt hat ein eigenes Inhaltsbild (WARE_MOTIV, 04f-*)
   - Marke und Aufbau je Sparte, mit Varianten (Zubehoer: PARTYZEIT,
     Snacks: KNUSPERWERK, Suesses: ZUCKERGLUECK, Kuehltheke: FRISCHE-
     THEKE, Feinkost: KRONE, Getraenke: je Getraenk eigene Marke)
   - Aufbau nach Seitenverhaeltnis: flache Schalen zeigen das Essen oben
     durch den Klarsichtdeckel, vorn eine Banderole; hohe Packungen Bild
     oben, Name unten; breite Kartons Bild links, Name rechts
   - Flaschen: Glasfarbe, Kapsel und Etikett je Produkt (04-models)
   ========================================================= */
const WARE_MOTIV={};
function wareReg(t,fn){ WARE_MOTIV[t]=fn; }
/* ---------- Zeichenhilfen fuer die Motive ---------- */
const WZ={
  rr(g,x,y,w,h,r){ r=Math.max(0,Math.min(r,w/2,h/2)); g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); },
  /* weicher Schatten unter einem Gegenstand */
  schatten(g,cx,cy,rx,ry,a){ g.save(); const gr=g.createRadialGradient(cx,cy,0,cx,cy,rx); gr.addColorStop(0,`rgba(0,0,0,${a||0.35})`); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.translate(cx,cy); g.scale(1,ry/rx); g.translate(-cx,-cy); g.beginPath(); g.arc(cx,cy,rx,0,Math.PI*2); g.fill(); g.restore(); },
  /* Glanzlicht (weisser Verlauf) */
  glanz(g,x,y,w,h,a){ const gr=g.createLinearGradient(x,y,x+w,y); gr.addColorStop(0,`rgba(255,255,255,0)`); gr.addColorStop(0.5,`rgba(255,255,255,${a||0.45})`); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(x,y,w,h); },
  kreis(g,x,y,r,f){ g.fillStyle=f; g.beginPath(); g.arc(x,y,Math.max(0.5,r),0,Math.PI*2); g.fill(); },
  ellipse(g,x,y,rx,ry,f,rot){ g.fillStyle=f; g.beginPath(); g.ellipse(x,y,Math.max(0.5,rx),Math.max(0.5,ry),rot||0,0,Math.PI*2); g.fill(); },
  /* Kugel mit Licht von links oben */
  kugel(g,x,y,r,f,hell){ const gr=g.createRadialGradient(x-r*0.35,y-r*0.4,r*0.08,x,y,r); gr.addColorStop(0,hell||'#ffffff'); gr.addColorStop(0.25,f); gr.addColorStop(1,WZ.dunkel(f,0.45)); g.fillStyle=gr; g.beginPath(); g.arc(x,y,Math.max(0.5,r),0,Math.PI*2); g.fill(); },
  /* Farbe mischen: hex + Anteil Schwarz/Weiss */
  dunkel(h,k){ const c=hexRgb(h).map(v=>Math.round(v*(1-k))); return `rgb(${c[0]},${c[1]},${c[2]})`; },
  hell(h,k){ return heller(h,k); },
  /* Teller oder Platte von schraeg oben */
  teller(g,cx,cy,rx,ry,f,rand){ WZ.schatten(g,cx,cy+ry*0.25,rx*1.05,ry*1.05,0.3); WZ.ellipse(g,cx,cy,rx,ry,rand||'#f4f1ea'); WZ.ellipse(g,cx,cy+ry*0.04,rx*0.8,ry*0.76,f||'#ffffff'); },
  /* Schale (Glas/Porzellan) */
  schale(g,cx,cy,rx,ry,f,inhalt){ WZ.schatten(g,cx,cy+ry*1.1,rx*1.05,ry*0.6,0.3); g.fillStyle=f||'#f4f1ea'; g.beginPath(); g.ellipse(cx,cy,rx,ry,0,0,Math.PI); g.lineTo(cx+rx*0.7,cy+ry*1.8); g.lineTo(cx-rx*0.7,cy+ry*1.8); g.closePath(); g.ellipse(cx,cy,rx,ry,0,Math.PI,Math.PI*2); g.fill(); WZ.ellipse(g,cx,cy,rx*0.92,ry*0.8,inhalt||'#c9a46a'); },
  /* Flasche, unten auf by stehend */
  flasche(g,cx,by,h,o){ o=o||{}; const w=h*(o.breit||0.3), hb=h*0.58, hs=h*0.16, hn=h*0.2, glas=o.glas||'#2d5a3c';
    g.save(); g.fillStyle=glas; g.beginPath(); g.moveTo(cx-w/2,by); g.lineTo(cx-w/2,by-hb); g.quadraticCurveTo(cx-w/2,by-hb-hs,cx-w*0.17,by-hb-hs); g.lineTo(cx-w*0.15,by-h); g.lineTo(cx+w*0.15,by-h); g.lineTo(cx+w*0.17,by-hb-hs); g.quadraticCurveTo(cx+w/2,by-hb-hs,cx+w/2,by-hb); g.lineTo(cx+w/2,by); g.closePath(); g.fill();
    if(o.kapsel){ g.fillStyle=o.kapsel; g.fillRect(cx-w*0.18,by-h,w*0.36,hn*0.75); }
    if(o.etikett){ g.fillStyle=o.etikett; g.fillRect(cx-w/2,by-hb*0.75,w,hb*0.5); if(o.etikett2){ g.fillStyle=o.etikett2; g.fillRect(cx-w/2,by-hb*0.75,w,hb*0.08); } }
    WZ.glanz(g,cx-w*0.42,by-hb-hs*0.5,w*0.3,hb+hs*0.5,0.35); g.restore(); },
  /* Getraenkedose */
  dose(g,cx,by,h,f,band){ const w=h*0.55; g.save(); WZ.schatten(g,cx,by,w*0.6,w*0.15,0.3); g.fillStyle=f; WZ.rr(g,cx-w/2,by-h,w,h,w*0.08); g.fill(); g.fillStyle='#c9ccd2'; g.fillRect(cx-w*0.42,by-h-h*0.03,w*0.84,h*0.06); if(band){ g.fillStyle=band; g.fillRect(cx-w/2,by-h*0.62,w,h*0.22); } WZ.glanz(g,cx-w*0.4,by-h,w*0.35,h,0.4); g.restore(); },
  /* Trinkglas: form 'sekt'|'wein'|'becher'|'tumbler'|'cocktail'|'krug' */
  trinkglas(g,cx,by,h,form,inhalt,o){ o=o||{}; g.save(); g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=Math.max(1,h*0.025); const glas='rgba(220,235,255,.22)';
    if(form==='sekt'||form==='wein'||form==='cocktail'){ const kh=h*(form==='sekt'?0.55:0.45), kw=h*(form==='sekt'?0.16:form==='wein'?0.3:0.42), st=by-h*0.08;
      g.beginPath(); g.moveTo(cx,st); g.lineTo(cx,by-h+kh); g.stroke(); WZ.ellipse(g,cx,by-h*0.02,h*0.15,h*0.035,'rgba(220,235,255,.5)');
      g.beginPath(); if(form==='cocktail'){ g.moveTo(cx-kw/2,by-h); g.lineTo(cx+kw/2,by-h); g.lineTo(cx,by-h+kh); } else { g.moveTo(cx-kw/2,by-h); g.quadraticCurveTo(cx-kw/2,by-h+kh,cx,by-h+kh); g.quadraticCurveTo(cx+kw/2,by-h+kh,cx+kw/2,by-h); } g.closePath(); g.fillStyle=glas; g.fill(); g.stroke();
      if(inhalt){ g.save(); g.clip(); g.fillStyle=inhalt; g.fillRect(cx-kw/2,by-h+kh*0.22,kw,kh); g.restore(); if(o.blasen){ g.fillStyle='rgba(255,255,255,.8)'; for(let i=0;i<6;i++) WZ.kreis(g,cx+(i%3-1)*kw*0.15,by-h+kh*(0.35+i*0.09),Math.max(0.6,h*0.012),'rgba(255,255,255,.85)'); } } }
    else { const w=h*(form==='tumbler'?0.62:form==='krug'?0.6:0.5); g.beginPath(); g.moveTo(cx-w/2,by-h); g.lineTo(cx-w*0.42,by); g.lineTo(cx+w*0.42,by); g.lineTo(cx+w/2,by-h); g.closePath(); g.fillStyle=glas; g.fill();
      if(inhalt){ g.save(); g.clip(); g.fillStyle=inhalt; g.fillRect(cx-w/2,by-h*(o.voll||0.8),w,h); if(o.schaum){ g.fillStyle='#fffaf0'; g.fillRect(cx-w/2,by-h*(o.voll||0.8)-h*0.12,w,h*0.14); } if(o.eis){ g.fillStyle='rgba(235,250,255,.7)'; g.fillRect(cx-w*0.25,by-h*0.65,w*0.22,w*0.22); g.fillRect(cx+w*0.02,by-h*0.55,w*0.2,w*0.2); } g.restore(); }
      g.stroke(); if(form==='krug'){ g.beginPath(); g.arc(cx+w*0.55,by-h*0.5,h*0.18,-1.3,1.3); g.stroke(); } }
    WZ.glanz(g,cx-h*0.12,by-h,h*0.08,h*0.9,0.35); g.restore(); },
  ballon(g,cx,cy,r,f){ WZ.kugel(g,cx,cy,r,f); g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=Math.max(0.6,r*0.04); g.beginPath(); g.moveTo(cx,cy+r); g.bezierCurveTo(cx-r*0.3,cy+r*1.6,cx+r*0.3,cy+r*2,cx,cy+r*2.6); g.stroke(); },
  stern(g,x,y,r,f,z){ g.fillStyle=f; stern(g,x,y,r,z||5,0.45); g.fill(); },
  herz(g,x,y,r,f){ g.fillStyle=f; g.beginPath(); g.moveTo(x,y+r*0.9); g.bezierCurveTo(x-r*1.6,y-r*0.2,x-r*0.6,y-r*1.3,x,y-r*0.45); g.bezierCurveTo(x+r*0.6,y-r*1.3,x+r*1.6,y-r*0.2,x,y+r*0.9); g.fill(); },
  /* Krumen/Koerner/Gewuerz verstreuen */
  streu(g,x,y,w,h,n,farben,gr,rnd){ for(let i=0;i<n;i++){ g.fillStyle=farben[i%farben.length]; const s=gr*(0.5+rnd()); g.fillRect(x+rnd()*w,y+rnd()*h,s,s*0.7); } },
  konfetti(g,x,y,w,h,n,farben,gr,rnd){ for(let i=0;i<n;i++){ g.save(); g.translate(x+rnd()*w,y+rnd()*h); g.rotate(rnd()*3); g.fillStyle=farben[i%farben.length]; g.fillRect(-gr,-gr*0.35,gr*2,gr*0.7); g.restore(); } },
  /* Text, auf Breite eingepasst */
  txt(g,s,x,y,maxW,size,font,f,align,outline){ g.save(); g.textAlign=align||'center'; g.textBaseline='middle'; let z=Math.max(5,Math.round(size)); do{ g.font=font(z); if(g.measureText(s).width<=maxW) break; z--; }while(z>5);
    if(outline){ g.lineJoin='round'; g.lineWidth=Math.max(2,z*0.16); g.strokeStyle=outline; g.strokeText(s,x,y); } g.fillStyle=f; g.fillText(s,x,y); g.restore(); return z; },
  /* Leuchten (fuer Knicklichter, Kerzen, Lichterketten) */
  leucht(g,x,y,r,f,a){ g.save(); g.globalCompositeOperation='lighter'; const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,rgba(f,a||0.7)); gr.addColorStop(1,rgba(f,0)); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); g.restore(); }
};
const WFNT={rund:s=>`${s}px Bungee, Impact, sans-serif`, kond:s=>`700 ${s}px "Barlow Condensed", "Arial Narrow", Arial, sans-serif`, kondIt:s=>`italic 700 ${s}px "Barlow Condensed", "Arial Narrow", Arial, sans-serif`, serif:s=>`700 ${s}px Cinzel, Georgia, serif`, schreib:s=>`italic 700 ${s}px Georgia, "Times New Roman", serif`, klar:s=>`600 ${s}px Arial, Helvetica, sans-serif`};

/* ---------- Marken ---------- */
/* Welche Marke traegt ein Produkt? Nach Sparte, Kuehlung und Art */
const WARE_SUESS=new Set(['gummibaerchen','marzipanschwein','schokotaler','glueckskekse','berliner','neujahrstorte','tiramisu','schokofondue']);
const WARE_SNACK=new Set(['chips','popcorn','salzstangen','erdnuesse','cracker','neujahrsbrezel','baguette']);
function wareMarke(t){
  const p=P[t], s=sparteVon(t);
  if(s==='zubehoer') return 'party';
  if(s==='getraenke') return 'trink';
  if(WARE_SUESS.has(t)) return 'suess';
  if(WARE_SNACK.has(t)) return 'snack';
  if(p.kuehlpflicht) return 'frisch';
  return 'krone';
}
const WARE_MARKE={
  party:{name:'PARTYZEIT',fnt:WFNT.rund,sub:WFNT.kond,boden:['#fff6e0','#ffe2f0','#e6f6ff','#f0ffe6']},
  snack:{name:'KNUSPERWERK',fnt:WFNT.rund,sub:WFNT.kondIt,boden:['#fff2d9']},
  suess:{name:'Zuckerglück',fnt:WFNT.schreib,sub:WFNT.kond,boden:['#fff0f4']},
  frisch:{name:'FRISCHETHEKE',fnt:WFNT.kond,sub:WFNT.klar,boden:['#f4f8fb']},
  krone:{name:'KRONE Feinkost',fnt:WFNT.serif,sub:WFNT.schreib,boden:['#f3ead8']},
  trink:{name:'',fnt:WFNT.rund,sub:WFNT.kond,boden:['#eef4f8']}
};
/* Untergrund hinter dem Inhaltsbild: Tisch, Tischdecke, Holz, Marmor */
function wareUntergrund(g,x,y,w,h,t,a,rnd){
  const m=wareMarke(t), k=hashStr(t)%4;
  if(m==='party'){ const gr=g.createLinearGradient(x,y,x,y+h); gr.addColorStop(0,heller(a.bg1,0.55)); gr.addColorStop(1,heller(a.bg1,0.15)); g.fillStyle=gr; g.fillRect(x,y,w,h);
    g.fillStyle='rgba(255,255,255,.18)'; for(let i=-h;i<w;i+=Math.max(6,w*0.08)){ g.beginPath(); g.moveTo(x+i,y+h); g.lineTo(x+i+h,y); g.lineTo(x+i+h+w*0.03,y); g.lineTo(x+i+w*0.03,y+h); g.fill(); } return; }
  if(m==='trink'){ const gr=g.createRadialGradient(x+w*0.5,y+h*0.35,0,x+w*0.5,y+h*0.5,Math.max(w,h)*0.8); gr.addColorStop(0,heller(a.bg1,0.35)); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(x,y,w,h);
    for(let i=0;i<12;i++) WZ.leucht(g,x+rnd()*w,y+rnd()*h*0.6,Math.min(w,h)*(0.04+rnd()*0.05),a.ac,0.25); return; }
  if(m==='frisch'){ g.fillStyle='#eef3f7'; g.fillRect(x,y,w,h); g.fillStyle='rgba(120,150,180,.12)'; for(let i=0;i<w;i+=Math.max(4,w*0.05)) g.fillRect(x+i,y,1,h); return; }
  if(m==='krone'){ /* dunkles Holz */ g.fillStyle='#5a3a22'; g.fillRect(x,y,w,h); for(let i=0;i<14;i++){ g.fillStyle=`rgba(${30+rnd()*30|0},${15+rnd()*15|0},5,${0.15+rnd()*0.2})`; g.fillRect(x,y+rnd()*h,w,Math.max(1,h*0.02)); } return; }
  if(m==='snack'){ /* kariertes Tuch */ g.fillStyle='#fff3dc'; g.fillRect(x,y,w,h); const q=Math.max(6,Math.min(w,h)*0.14); g.fillStyle=rgba(a.ac2||'#e63b2e',0.22); for(let i=0;i*q<w;i+=2) g.fillRect(x+i*q,y,q,h); for(let j=0;j*q<h;j+=2) g.fillRect(x,y+j*q,w,q); return; }
  /* suess: rosa Marmor */ g.fillStyle='#fde8ef'; g.fillRect(x,y,w,h); g.strokeStyle='rgba(200,120,150,.25)'; g.lineWidth=Math.max(1,w*0.006); for(let i=0;i<6;i++){ g.beginPath(); g.moveTo(x+rnd()*w,y); g.bezierCurveTo(x+rnd()*w,y+h*0.3,x+rnd()*w,y+h*0.7,x+rnd()*w,y+h); g.stroke(); }
}
/* Inhaltsbild: Untergrund + Motiv (oder Platzhalter, falls keins da ist) */
function wareBild(g,x,y,w,h,t,a,rnd,ohneGrund){
  g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip();
  if(!ohneGrund) wareUntergrund(g,x,y,w,h,t,a,rnd);
  const fn=WARE_MOTIV[t];
  if(fn){ try{ fn(g,x,y,w,h,zufallAus(hashStr(t+'motiv')),a); }catch(e){ if(typeof console!=='undefined') console.warn('Motiv',t,e); } }
  else { WZ.txt(g,P[t].short,x+w/2,y+h/2,w*0.9,h*0.3,WFNT.kond,a.ac||'#fff'); }
  g.restore();
}
/* Markenleiste */
function wareMarkeZeichnen(g,x,y,w,h,t,a){
  const m=wareMarke(t), M=WARE_MARKE[m];
  if(m==='trink'){ return; }
  const bg=m==='party'?a.bg2:m==='frisch'?'#1d6fb8':m==='krone'?'#2b1a0e':m==='snack'?'#e63b2e':'#d6336c';
  const fg=m==='krone'?'#e2c27a':'#ffffff';
  g.fillStyle=bg; g.fillRect(x,y,w,h);
  WZ.txt(g,M.name,x+w/2,y+h*0.54,w*0.9,h*0.7,M.fnt,fg);
}
/* Vorderseite */
function wareFront(g,W,H,t,a){
  const p=P[t], m=wareMarke(t), M=WARE_MARKE[m], rnd=zufallAus(hashStr(t+'front')), r=W/H;
  const titel=a.title||p.short, sub=a.sub||'';
  /* Grundflaeche */
  if(m==='frisch'){ g.fillStyle='#ffffff'; g.fillRect(0,0,W,H); }
  else if(m==='krone'){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#f3ead8'); gr.addColorStop(1,'#e3d3b2'); g.fillStyle=gr; g.fillRect(0,0,W,H); }
  else { const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H); }
  const titelF=m==='frisch'?'#12324f':m==='krone'?'#2b1a0e':a.ac, umriss=m==='frisch'||m==='krone'?null:'rgba(0,0,0,.55)';
  if(r>=2.1){
    /* Banderole: Bild links, Name rechts */
    const bw=Math.min(W*0.42,H*1.5);
    wareBild(g,0,0,bw,H,t,a,rnd);
    const tx=bw+(W-bw)/2, tw=(W-bw)*0.9;
    if(m!=='trink'){ g.fillStyle=m==='frisch'?'#1d6fb8':m==='krone'?'#2b1a0e':'rgba(0,0,0,.25)'; g.fillRect(bw,0,W-bw,H*0.24); WZ.txt(g,M.name,tx,H*0.12,tw,H*0.18,M.fnt,m==='krone'?'#e2c27a':'#fff'); }
    WZ.txt(g,titel,tx,H*0.52,tw,H*0.3,m==='krone'?WFNT.serif:m==='suess'?WFNT.schreib:WFNT.rund,titelF,'center',umriss);
    if(sub) WZ.txt(g,sub,tx,H*0.8,tw,H*0.18,WFNT.kond,m==='frisch'||m==='krone'?'#3a4a5a':'#fff','center',m==='frisch'||m==='krone'?null:'rgba(0,0,0,.45)');
  } else if(hashStr(t)%3===1&&m!=='frisch'){
    /* Variante Vollbild: das Inhaltsbild fuellt die ganze Seite, Name auf
       einem Band, Marke als Ecke oben links */
    wareBild(g,0,0,W,H,t,a,rnd);
    const bh=Math.min(H*0.3,W*0.42), by=H-bh;
    g.fillStyle=m==='krone'?'rgba(43,26,14,.86)':rgba(a.bg2,0.86); g.fillRect(0,by,W,bh);
    g.fillStyle=a.ac2||a.ac; g.fillRect(0,by,W,Math.max(2,bh*0.06));
    WZ.txt(g,titel,W/2,by+bh*0.42,W*0.92,bh*0.46,m==='krone'?WFNT.serif:m==='suess'?WFNT.schreib:WFNT.rund,m==='krone'?'#e2c27a':a.ac,'center','rgba(0,0,0,.5)');
    if(sub) WZ.txt(g,sub,W/2,by+bh*0.8,W*0.9,bh*0.24,WFNT.kond,'#ffffff');
    if(M.name){ const tw=Math.min(W*0.6,H*0.5), th=Math.min(H*0.09,tw*0.22); g.fillStyle=m==='krone'?'#2b1a0e':a.bg2; WZ.rr(g,-th*0.3,H*0.03,tw,th,th*0.3); g.fill(); WZ.txt(g,M.name,tw*0.45,H*0.03+th/2,tw*0.8,th*0.7,M.fnt,m==='krone'?'#e2c27a':'#ffffff'); }
  } else if(hashStr(t)%3===2&&m!=='frisch'&&m!=='krone'){
    /* Variante Rundfenster: Muster-Grund, Bild im runden Fenster */
    g.fillStyle=rgba(a.ac,0.12); const q=Math.max(5,Math.min(W,H)*0.07); for(let yy=0;yy<H;yy+=q) for(let xx=(yy/q%2)*q/2;xx<W;xx+=q) { g.beginPath(); g.arc(xx,yy,q*0.18,0,Math.PI*2); g.fill(); }
    const mh=m==='trink'?0:Math.min(H*0.1,W*0.16); wareMarkeZeichnen(g,0,0,W,mh,t,a);
    const R=Math.min(W*0.44,(H-mh)*0.32), cx=W/2, cy=mh+R+H*0.04;
    g.save(); g.beginPath(); g.arc(cx,cy,R,0,Math.PI*2); g.clip(); wareBild(g,cx-R,cy-R,R*2,R*2,t,a,rnd); g.restore();
    g.strokeStyle=a.ac; g.lineWidth=Math.max(2,R*0.06); g.beginPath(); g.arc(cx,cy,R,0,Math.PI*2); g.stroke();
    const ty=cy+R;
    WZ.txt(g,titel,W/2,ty+(H-ty)*0.38,W*0.92,Math.min(W*0.2,(H-ty)*0.4),m==='suess'?WFNT.schreib:WFNT.rund,a.ac,'center','rgba(0,0,0,.55)');
    if(sub) WZ.txt(g,sub,W/2,ty+(H-ty)*0.76,W*0.9,Math.min(W*0.12,(H-ty)*0.22),WFNT.kond,'#ffffff','center','rgba(0,0,0,.4)');
  } else if(r>0.8){
    /* quer/quadratisch: Markenleiste, grosses Bild, Namensband */
    const mh=m==='trink'?0:H*0.12;
    wareMarkeZeichnen(g,0,0,W,mh,t,a);
    const bh=H*0.58; wareBild(g,0,mh,W,bh,t,a,rnd);
    const ty=mh+bh;
    if(m==='trink'){ g.fillStyle=rgba(a.bg2,0.92); g.fillRect(0,ty,W,H-ty); }
    WZ.txt(g,titel,W/2,ty+(H-ty)*0.42,W*0.9,(H-ty)*0.48,m==='krone'?WFNT.serif:m==='suess'?WFNT.schreib:WFNT.rund,titelF,'center',umriss);
    if(sub) WZ.txt(g,sub,W/2,ty+(H-ty)*0.8,W*0.88,(H-ty)*0.26,WFNT.kond,m==='krone'?'#3a3a4a':'#fff','center',m==='krone'?null:'rgba(0,0,0,.45)');
  } else {
    /* hoch: Marke, Bild, Name, Zusatz */
    const mh=m==='trink'?0:H*0.08;
    wareMarkeZeichnen(g,0,0,W,mh,t,a);
    const bh=H*0.56; wareBild(g,W*0.06,mh+H*0.03,W*0.88,bh,t,a,rnd);
    g.strokeStyle=m==='krone'?'#b08a3e':'rgba(255,255,255,.85)'; g.lineWidth=Math.max(1,W*0.012); g.strokeRect(W*0.06,mh+H*0.03,W*0.88,bh);
    const ty=mh+H*0.03+bh;
    WZ.txt(g,titel,W/2,ty+(H-ty)*0.35,W*0.92,Math.min(W*0.2,(H-ty)*0.34),m==='krone'?WFNT.serif:m==='suess'?WFNT.schreib:WFNT.rund,titelF,'center',umriss);
    if(sub) WZ.txt(g,sub,W/2,ty+(H-ty)*0.72,W*0.9,Math.min(W*0.13,(H-ty)*0.2),WFNT.kond,m==='krone'||m==='frisch'?'#3a3a4a':'#fff','center',m==='krone'||m==='frisch'?null:'rgba(0,0,0,.45)');
  }
  /* Siegel je Marke */
  const S=Math.min(W,H);
  if(m==='frisch'){ WZ.rr(g,W-S*0.42,H-S*0.2,S*0.38,S*0.15,S*0.04); g.fillStyle='#e8f4ff'; g.fill(); WZ.txt(g,'GEKÜHLT',W-S*0.23,H-S*0.125,S*0.34,S*0.1,WFNT.kond,'#1d6fb8'); }
  if(m==='krone'&&r<=2.1){ siegel(g,W-S*0.16,S*0.3,S*0.11,'♛','#2b1a0e','#e2c27a'); }
  if(p.cold&&!p.kuehlpflicht&&m==='trink'&&r<=2.1){ WZ.txt(g,'❄ KÜHL GENIESSEN',W/2,H*0.04+S*0.04,W*0.8,S*0.07,WFNT.kond,'#e8f4ff'); }
}
/* Oberseite: flache Schalen zeigen den Inhalt durch den Deckel */
function wareTop(g,W,H,t,a){
  const p=P[t], m=wareMarke(t), rnd=zufallAus(hashStr(t+'top')), d=p.dims;
  const flach=d&&d[1]<=0.13&&d[2]>=d[1]*1.4;
  if(flach){
    wareBild(g,0,0,W,H,t,a,rnd);
    /* Klarsichtdeckel: Rand und Spiegelung */
    g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=Math.max(1.5,Math.min(W,H)*0.03); WZ.rr(g,g.lineWidth,g.lineWidth,W-2*g.lineWidth,H-2*g.lineWidth,Math.min(W,H)*0.08); g.stroke();
    g.fillStyle='rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(W*0.1,0); g.lineTo(W*0.35,0); g.lineTo(W*0.15,H); g.lineTo(0,H); g.lineTo(0,H*0.6); g.fill();
    /* Aufkleber mit Name */
    const sw=Math.min(W*0.5,H*1.4), sh=Math.min(H*0.24,sw*0.32);
    WZ.rr(g,W-sw-W*0.05,H-sh-H*0.06,sw,sh,sh*0.2); g.fillStyle=m==='frisch'?'#1d6fb8':m==='krone'?'#2b1a0e':a.bg2; g.fill();
    WZ.txt(g,a.title||p.short,W-sw/2-W*0.05,H-sh/2-H*0.06,sw*0.9,sh*0.6,m==='krone'?WFNT.serif:WFNT.kond,m==='krone'?'#e2c27a':'#ffffff');
    return;
  }
  const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,m==='frisch'?'#ffffff':m==='krone'?'#efe2c6':a.bg1); gr.addColorStop(1,m==='frisch'?'#e4edf5':m==='krone'?'#d9c497':a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
  WZ.txt(g,a.title||p.short,W/2,H/2,W*0.86,H*0.4,m==='krone'?WFNT.serif:WFNT.rund,m==='frisch'?'#12324f':m==='krone'?'#2b1a0e':a.ac);
}
/* Seite: Farbe, Name hochkant, Zutaten-Zeilen */
function wareSeite(g,W,H,t,a){
  const p=P[t], m=wareMarke(t);
  const bg=m==='frisch'?'#ffffff':m==='krone'?'#e9dcc0':a.bg2; g.fillStyle=bg; g.fillRect(0,0,W,H);
  const fg=m==='frisch'?'#1d6fb8':m==='krone'?'#2b1a0e':a.ac;
  g.save(); g.translate(W/2,H*0.4); g.rotate(-Math.PI/2); WZ.txt(g,a.title||p.short,0,0,H*0.7,W*0.5,m==='krone'?WFNT.serif:WFNT.rund,fg); g.restore();
  g.fillStyle=rgba(m==='frisch'||m==='krone'?'#3a3a4a':'#ffffff',0.35); for(let i=0;i<5;i++) g.fillRect(W*0.15,H*(0.76+i*0.04),W*(0.5+((i*37)%5)*0.06),Math.max(1,H*0.012));
}
/* Einstieg aus designZeichnen (04d) */
function wareZeichnen(teil,g,W,H,t,a){
  if(!P[t]||P[t].cat) return false;
  if(teil==='front') wareFront(g,W,H,t,a); else if(teil==='side') wareSeite(g,W,H,t,a); else wareTop(g,W,H,t,a);
  return true;
}
/* Flaschen je Produkt: Glas, Kapsel, Etikett */
const WARE_FLASCHE={
  sekt:{glas:0x1f4a35,kapsel:'#e8c35a'}, kindersekt:{glas:0x3a7a3a,kapsel:'#ff7ab0'}, secco:{glas:0x6f8f4a,kapsel:'#f2f2f2'},
  rosesekt:{glas:0xe6a0a8,kapsel:'#c43a6a',klar:true}, champagner:{glas:0x14261b,kapsel:'#d4af37'}, rotwein:{glas:0x2a1418,kapsel:'#7a1022',form:'wein'},
  weisswein:{glas:0x9ab27a,kapsel:'#e8e2c8',form:'wein',klar:true}, eierlikoer:{glas:0xf2d36b,kapsel:'#2b2b2b',form:'likoer',klar:true}, likoer:{glas:0x3b2416,kapsel:'#c9a46a',form:'likoer'},
  magnum:{glas:0x101c14,kapsel:'#d4af37'}, kindersekt2:{glas:0xe05a7a,kapsel:'#ffffff',klar:true}, goldsekt:{glas:0x2a2a1a,kapsel:'#ffd700'},
  jahrgang:{glas:0x0e1a12,kapsel:'#8a1c1c'}, prosecco:{glas:0x7d9a55,kapsel:'#1d4a8a'},
  erdnuesse:{glas:0xd9c38a,kapsel:'#c0392b',form:'glas',klar:true}, rollmops:{glas:0xc8d8c0,kapsel:'#e8e8e8',form:'glas',klar:true}, feuerloescher:{glas:0xc0392b,kapsel:'#222222',form:'spray'}
};
function wareFlasche(t){ return WARE_FLASCHE[t]||null; }

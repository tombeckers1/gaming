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
/* 04.10. (Tom: "jede Verpackung soll realistisch und eigen aussehen" - die
   Kuehlware sah wie eine einzige Hausmarke aus: weiss, blaue Kopfleiste
   FRISCHETHEKE, bei 25 Produkten). Jetzt hat jedes Kuehlprodukt seinen
   eigenen Hersteller wie im echten Kuehlregal: eigener Name, eigene
   Kopffarbe, eigener Grund mit Muster, eigene Schrift; einige mit
   Vollbild-Gestaltung. k=Kopfleiste, kf=Kopfschrift, g=Grund, t=Name,
   u=Zusatz, f=Schrift, m=Muster, v=Vollbild */
const FRISCH_STIL={
  heringssalat:{n:'NORDSEE-KÜCHE',k:'#123a5e',kf:'#ffffff',g:'#e9f1f7',t:'#123a5e',f:'kond',m:'wellen'},
  kartoffelsalat:{n:'Omas Feinkost',k:'#2f6b2a',kf:'#fff8e6',g:'#fff8e6',t:'#2f4a1a',f:'schreib',m:'karo'},
  racletteessen:{n:'ALPENGLÜCK',k:'#c8102e',kf:'#ffffff',g:'#ffffff',t:'#8a0a1e',f:'rund',m:'kreuz',v:1},
  fondueessen:{n:'Le Caquelon',k:'#5a2a12',kf:'#f6d48a',g:'#fbf1de',t:'#5a2a12',f:'serif',m:'papier'},
  wuerstchen:{n:'METZGEREI HUBER',k:'#b8241c',kf:'#ffffff',g:'#fff4e8',t:'#8a1a12',f:'kond',m:'karo',v:1},
  frikadellen:{n:'Landmetzgerei',k:'#6a3a1a',kf:'#f4e2b8',g:'#f7ecd6',t:'#4a2a10',f:'serif',m:'holz'},
  mettigel:{n:'Partyservice Kuhn',k:'#a8142a',kf:'#ffffff',g:'#fff0f0',t:'#a8142a',f:'schreib',m:'punkte'},
  partypizza:{n:'PIZZERIA BELLA',k:'#1f7a3a',kf:'#ffffff',g:'#fffaf0',t:'#c8102e',f:'rund',m:'trikolore',v:1},
  dips:{n:'DIP & DIP',k:'#3f8a2a',kf:'#ffffff',g:'#f2f8ec',t:'#2a5a1a',f:'rund',m:'punkte'},
  raclettekaese:{n:'Bergkäserei Alpstein',k:'#f2b81c',kf:'#3a2a0a',g:'#fff8dc',t:'#6a4a0a',f:'serif',m:'loecher'},
  kaeseplatte:{n:'Käse-Sommelier',k:'#2b4a2a',kf:'#e8c35a',g:'#f5efe0',t:'#2b4a2a',f:'serif',m:'papier'},
  lachs:{n:'NORDKAP',k:'#1a2a4a',kf:'#ffffff',g:'#fff1ea',t:'#e5673a',f:'kond',m:'wellen',v:1},
  kaesefondue:{n:'Fromagerie Valais',k:'#b8141e',kf:'#ffffff',g:'#fff6e6',t:'#b8141e',f:'serif',m:'kreuz'},
  kaviar:{n:'TSAR IMPERIAL',k:'#0b0b0b',kf:'#d4af37',g:'#14161c',t:'#d4af37',u:'#c9b27a',f:'serif',m:'marmor'},
  luxusfondue:{n:'Maison Chinoise',k:'#7a0a0a',kf:'#e8c35a',g:'#24100c',t:'#e8c35a',u:'#e8d8b0',f:'serif',m:'marmor'},
  gefuellteeier:{n:'Eierhof Sonnenschein',k:'#f2c21c',kf:'#5a3a0a',g:'#fffbe8',t:'#7a4a0a',f:'schreib',m:'punkte'},
  nudelsalat:{n:'Mamma Lina',k:'#d1462f',kf:'#ffffff',g:'#fff9ee',t:'#1f6a3a',f:'schreib',m:'karo'},
  fingerfood:{n:'HÄPPCHEN-WERK',k:'#e8731c',kf:'#ffffff',g:'#fff6ea',t:'#a8420a',f:'rund',m:'punkte',v:1},
  karpfen:{n:'Teichwirtschaft Aischgrund',k:'#2a6a5a',kf:'#ffffff',g:'#eef6f2',t:'#1e4a40',f:'kond',m:'wellen'},
  sushi:{n:'SAKURA SUSHI',k:'#14141a',kf:'#ffffff',g:'#f8f4ec',t:'#c8102e',f:'kond',m:'kreise',v:1},
  austern:{n:'Île de Ré',k:'#1a3a6a',kf:'#ffffff',g:'#eef2f6',t:'#1a3a6a',f:'serif',m:'wellen'},
  hummer:{n:'ATLANTIC',k:'#0c2a4a',kf:'#ffffff',g:'#eaf0f6',t:'#c8241c',f:'kond',m:'wellen'},
  eiswuerfel:{n:'POLAR-EIS',k:'#1557a8',kf:'#ffffff',g:'#eaf6ff',t:'#1557a8',f:'rund',m:'punkte'}
};
function frischStil(t){ const s=FRISCH_STIL[t]; if(s) return s;
  const P8=['#1d6fb8','#2f6b2a','#b8241c','#5a2a12','#123a5e','#7a2a6a','#c8641c','#2a6a5a'], k=P8[hashStr(t)%P8.length];
  return {n:'FRISCHETHEKE',k,kf:'#ffffff',g:'#ffffff',t:k,f:'kond',m:'streifen'}; }
/* Musterflaeche einer Kuehl-Marke */
function frischMuster(g,x,y,w,h,S){ const c=S.k, q=Math.max(5,Math.min(w,h)*0.06);
  g.fillStyle=S.g; g.fillRect(x,y,w,h); g.save(); g.beginPath(); g.rect(x,y,w,h); g.clip();
  if(S.m==='wellen'){ g.strokeStyle=rgba(c,0.13); g.lineWidth=Math.max(1,q*0.12); for(let yy=y;yy<y+h+q;yy+=q*0.8){ g.beginPath(); for(let xx=x;xx<=x+w;xx+=q*0.25) g.lineTo(xx,yy+Math.sin(xx/q*2)*q*0.2); g.stroke(); } }
  else if(S.m==='karo'){ g.fillStyle=rgba(c,0.1); for(let i=0;i*q<w;i+=2) g.fillRect(x+i*q,y,q,h); for(let j=0;j*q<h;j+=2) g.fillRect(x,y+j*q,w,q); }
  else if(S.m==='punkte'||S.m==='loecher'){ g.fillStyle=rgba(S.m==='loecher'?'#c89a1c':c,0.14); for(let yy=y;yy<y+h;yy+=q) for(let xx=x+((yy-y)/q%2)*q/2;xx<x+w;xx+=q){ g.beginPath(); g.arc(xx,yy,q*(S.m==='loecher'?0.3:0.16),0,Math.PI*2); g.fill(); } }
  else if(S.m==='kreuz'){ g.fillStyle=rgba(c,0.1); for(let yy=y+q/2;yy<y+h;yy+=q*1.6) for(let xx=x+q/2;xx<x+w;xx+=q*1.6){ g.fillRect(xx-q*0.3,yy-q*0.1,q*0.6,q*0.2); g.fillRect(xx-q*0.1,yy-q*0.3,q*0.2,q*0.6); } }
  else if(S.m==='holz'){ for(let i=0;i<14;i++){ g.fillStyle=rgba('#8a5a2a',0.06+((i*37)%5)*0.02); g.fillRect(x,y+((i*53)%97)/97*h,w,Math.max(1,h*0.02)); } }
  else if(S.m==='marmor'){ g.strokeStyle=rgba(S.t,0.18); g.lineWidth=Math.max(1,w*0.004); for(let i=0;i<7;i++){ g.beginPath(); g.moveTo(x+((i*37)%11)/11*w,y); g.bezierCurveTo(x+((i*17)%7)/7*w,y+h*0.3,x+((i*29)%9)/9*w,y+h*0.7,x+((i*41)%13)/13*w,y+h); g.stroke(); } }
  else if(S.m==='trikolore'){ const b=Math.max(3,h*0.04); [['#1f7a3a',0],['#ffffff',1],['#c8102e',2]].forEach(([f,i])=>{ g.fillStyle=f; g.fillRect(x,y+h-b*(3-i),w,b); }); }
  else if(S.m==='kreise'){ g.strokeStyle=rgba('#c8102e',0.16); g.lineWidth=Math.max(1,q*0.1); for(let yy=y;yy<y+h+q;yy+=q*1.2) for(let xx=x;xx<x+w+q;xx+=q*1.2){ g.beginPath(); g.arc(xx,yy,q*0.5,Math.PI,Math.PI*2); g.stroke(); } }
  else if(S.m==='papier'){ for(let i=0;i<w*h/90;i++){ g.fillStyle=rgba('#7a5a3a',0.05); g.fillRect(x+((i*97)%1009)/1009*w,y+((i*61)%1013)/1013*h,2,1); } }
  else { g.fillStyle=rgba(c,0.1); for(let i=0;i<w;i+=Math.max(4,w*0.05)) g.fillRect(x+i,y,1,h); }
  g.restore(); }
const frischFnt=S=>WFNT[S.f]||WFNT.kond;
/* Untergrund hinter dem Inhaltsbild: Tisch, Tischdecke, Holz, Marmor */
function wareUntergrund(g,x,y,w,h,t,a,rnd){
  const m=wareMarke(t), k=hashStr(t)%4;
  if(m==='party'){ const gr=g.createLinearGradient(x,y,x,y+h); gr.addColorStop(0,heller(a.bg1,0.55)); gr.addColorStop(1,heller(a.bg1,0.15)); g.fillStyle=gr; g.fillRect(x,y,w,h);
    g.fillStyle='rgba(255,255,255,.18)'; for(let i=-h;i<w;i+=Math.max(6,w*0.08)){ g.beginPath(); g.moveTo(x+i,y+h); g.lineTo(x+i+h,y); g.lineTo(x+i+h+w*0.03,y); g.lineTo(x+i+w*0.03,y+h); g.fill(); } return; }
  if(m==='trink'){ const gr=g.createRadialGradient(x+w*0.5,y+h*0.35,0,x+w*0.5,y+h*0.5,Math.max(w,h)*0.8); gr.addColorStop(0,heller(a.bg1,0.35)); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(x,y,w,h);
    for(let i=0;i<12;i++) WZ.leucht(g,x+rnd()*w,y+rnd()*h*0.6,Math.min(w,h)*(0.04+rnd()*0.05),a.ac,0.25); return; }
  if(m==='frisch'){ const S=frischStil(t); frischMuster(g,x,y,w,h,Object.assign({},S,{g:wareLum(S.g)<0.3?S.g:heller(S.g,0.2)})); return; }
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
  if(m==='frisch'){ const S=frischStil(t); g.fillStyle=S.k; g.fillRect(x,y,w,h); g.fillStyle=rgba(S.kf,0.5); g.fillRect(x,y+h-Math.max(1,h*0.06),w,Math.max(1,h*0.06));
    WZ.txt(g,S.n,x+w/2,y+h*0.54,w*0.9,h*0.66,frischFnt(S),S.kf); return; }
  const bg=m==='party'?a.bg2:m==='krone'?'#2b1a0e':m==='snack'?'#e63b2e':'#d6336c';
  const fg=m==='krone'?'#e2c27a':'#ffffff';
  g.fillStyle=bg; g.fillRect(x,y,w,h);
  WZ.txt(g,M.name,x+w/2,y+h*0.54,w*0.9,h*0.7,M.fnt,fg);
}
/* relative Helligkeit 0..1 einer #rrggbb-Farbe */
function wareLum(h){ const c=String(h||'#000').replace('#',''); if(c.length<6) return 0.5; const v=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255); return 0.2126*v[0]+0.7152*v[1]+0.0722*v[2]; }
/* Vorderseite */
function wareFront(g,W,H,t,a){
  const p=P[t], m=wareMarke(t), M=m==='frisch'?Object.assign({},WARE_MARKE.frisch,{name:frischStil(t).n,fnt:frischFnt(frischStil(t))}):WARE_MARKE[m], rnd=zufallAus(hashStr(t+'front')), r=W/H, FS=m==='frisch'?frischStil(t):null;
  const titel=a.title||p.short, sub=a.sub||'';
  /* Grundflaeche */
  if(m==='frisch'){ frischMuster(g,0,0,W,H,FS); }
  else if(m==='krone'){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#f3ead8'); gr.addColorStop(1,'#e3d3b2'); g.fillStyle=gr; g.fillRect(0,0,W,H); }
  else { const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,a.bg1); gr.addColorStop(1,a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H); }
  const titelF=m==='frisch'?FS.t:m==='krone'?'#2b1a0e':a.ac, umriss=m==='frisch'||m==='krone'?null:'rgba(0,0,0,.55)', subF=m==='frisch'?(FS.u||'#3a3a4a'):'#3a3a4a', titelFnt=m==='frisch'?frischFnt(FS):null;
  if(r>=2.1){
    /* Banderole: Bild links, Name rechts */
    const bw=Math.min(W*0.42,H*1.5);
    wareBild(g,0,0,bw,H,t,a,rnd);
    const tx=bw+(W-bw)/2, tw=(W-bw)*0.9;
    if(m!=='trink'){ g.fillStyle=m==='frisch'?FS.k:m==='krone'?'#2b1a0e':'rgba(0,0,0,.25)'; g.fillRect(bw,0,W-bw,H*0.24); WZ.txt(g,M.name,tx,H*0.12,tw,H*0.18,M.fnt,m==='krone'?'#e2c27a':m==='frisch'?FS.kf:'#fff'); }
    WZ.txt(g,titel,tx,H*0.52,tw,H*0.3,titelFnt||(m==='krone'?WFNT.serif:m==='suess'?WFNT.schreib:WFNT.rund),titelF,'center',umriss);
    if(sub) WZ.txt(g,sub,tx,H*0.8,tw,H*0.18,WFNT.kond,m==='frisch'?subF:m==='krone'?'#3a4a5a':'#fff','center',m==='frisch'||m==='krone'?null:'rgba(0,0,0,.45)');
  } else if((hashStr(t)%3===1&&m!=='frisch')||(FS&&FS.v)){
    /* Variante Vollbild: das Inhaltsbild fuellt die ganze Seite, Name auf
       einem Band, Marke als Ecke oben links */
    wareBild(g,0,0,W,H,t,a,rnd);
    const bh=Math.min(H*0.3,W*0.42), by=H-bh;
    /* das Band immer dunkel, der Name immer hell genug (03.10.: Popcorn
       stand weiss auf hellem Band, Berliner rot auf braun) */
    const bandC=FS?FS.k:m==='krone'?'#2b1a0e':wareLum(a.bg2)>0.3?'#1e1a24':a.bg2, nameC=FS?FS.kf:m==='krone'?'#e2c27a':wareLum(a.ac)>0.45?a.ac:'#ffffff';
    g.fillStyle=rgba(bandC,0.88); g.fillRect(0,by,W,bh);
    g.fillStyle=a.ac2||a.ac; g.fillRect(0,by,W,Math.max(2,bh*0.06));
    WZ.txt(g,titel,W/2,by+bh*0.42,W*0.92,bh*0.46,titelFnt||(m==='krone'?WFNT.serif:m==='suess'?WFNT.schreib:WFNT.rund),nameC,'center','rgba(0,0,0,.5)');
    if(sub) WZ.txt(g,sub,W/2,by+bh*0.8,W*0.9,bh*0.24,WFNT.kond,'#ffffff');
    if(M.name){ const tw=Math.min(W*0.6,H*0.5), th=Math.min(H*0.09,tw*0.22); g.fillStyle=FS?FS.g:m==='krone'?'#2b1a0e':a.bg2; WZ.rr(g,-th*0.3,H*0.03,tw,th,th*0.3); g.fill(); WZ.txt(g,M.name,tw*0.45,H*0.03+th/2,tw*0.8,th*0.7,M.fnt,FS?FS.t:m==='krone'?'#e2c27a':'#ffffff'); }
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
    WZ.txt(g,titel,W/2,ty+(H-ty)*0.36,W*0.9,(H-ty)*0.4,titelFnt||(m==='krone'?WFNT.serif:m==='suess'?WFNT.schreib:WFNT.rund),titelF,'center',umriss);
    if(sub) WZ.txt(g,sub,W/2,ty+(H-ty)*0.78,m==='frisch'?W*0.56:W*0.88,(H-ty)*0.22,WFNT.kond,m==='frisch'?subF:m==='krone'?'#3a3a4a':'#fff','center',m==='krone'||m==='frisch'?null:'rgba(0,0,0,.45)');
  } else {
    /* hoch: Marke, Bild, Name, Zusatz */
    const mh=m==='trink'?0:H*0.08;
    wareMarkeZeichnen(g,0,0,W,mh,t,a);
    const bh=H*0.56; wareBild(g,W*0.06,mh+H*0.03,W*0.88,bh,t,a,rnd);
    g.strokeStyle=m==='krone'?'#b08a3e':'rgba(255,255,255,.85)'; g.lineWidth=Math.max(1,W*0.012); g.strokeRect(W*0.06,mh+H*0.03,W*0.88,bh);
    const ty=mh+H*0.03+bh;
    WZ.txt(g,titel,W/2,ty+(H-ty)*0.35,W*0.92,Math.min(W*0.2,(H-ty)*0.34),titelFnt||(m==='krone'?WFNT.serif:m==='suess'?WFNT.schreib:WFNT.rund),titelF,'center',umriss);
    if(sub) WZ.txt(g,sub,W/2,ty+(H-ty)*0.72,W*0.9,Math.min(W*0.13,(H-ty)*0.2),WFNT.kond,m==='frisch'?subF:m==='krone'?'#3a3a4a':'#fff','center',m==='krone'||m==='frisch'?null:'rgba(0,0,0,.45)');
  }
  /* Siegel je Marke */
  const S=Math.min(W,H);
  /* GEKUEHLT-Plakette: in der Bildecke, nicht ueber Name und Zusatz
     (03.10.: Heringssalat, Nudelsalat - die Plakette lag auf dem Text) */
  if(m==='frisch'){ const bx=r>=2.1?S*0.04:W-S*0.42, by=r>=2.1?H-S*0.2:(r>0.8?H*0.12:H*0.08)+S*0.04;
    g.save(); g.shadowColor='rgba(0,0,0,.25)'; g.shadowOffsetY=S*0.01; WZ.rr(g,bx,by,S*0.38,S*0.15,S*0.04); g.fillStyle=FS.kf; g.fill(); g.restore();
    WZ.txt(g,p.dims&&/tiefgek|TK/.test(String(p.name)+(a.sub||''))?'❄ TIEFGEKÜHLT':'❄ GEKÜHLT',bx+S*0.19,by+S*0.075,S*0.34,S*0.1,WFNT.kond,FS.k); }
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
    const FT=m==='frisch'?frischStil(t):null;
    WZ.rr(g,W-sw-W*0.05,H-sh-H*0.06,sw,sh,sh*0.2); g.fillStyle=FT?FT.k:m==='krone'?'#2b1a0e':a.bg2; g.fill();
    WZ.txt(g,a.title||p.short,W-sw/2-W*0.05,H-sh/2-H*0.06,sw*0.9,sh*0.6,FT?frischFnt(FT):m==='krone'?WFNT.serif:WFNT.kond,FT?FT.kf:m==='krone'?'#e2c27a':'#ffffff');
    return;
  }
  if(m==='frisch'){ const S=frischStil(t); frischMuster(g,0,0,W,H,S); g.fillStyle=S.k; g.fillRect(0,0,W,H*0.18); WZ.txt(g,S.n,W/2,H*0.09,W*0.8,H*0.12,frischFnt(S),S.kf); WZ.txt(g,a.title||p.short,W/2,H*0.55,W*0.86,H*0.34,frischFnt(S),S.t); return; }
  const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,m==='frisch'?'#ffffff':m==='krone'?'#efe2c6':a.bg1); gr.addColorStop(1,m==='frisch'?'#e4edf5':m==='krone'?'#d9c497':a.bg2); g.fillStyle=gr; g.fillRect(0,0,W,H);
  WZ.txt(g,a.title||p.short,W/2,H/2,W*0.86,H*0.4,m==='krone'?WFNT.serif:WFNT.rund,m==='frisch'?'#12324f':m==='krone'?'#2b1a0e':a.ac);
}
/* Seite: Farbe, Name hochkant, Zutaten-Zeilen */
function wareSeite(g,W,H,t,a){
  const p=P[t], m=wareMarke(t);
  const FS=m==='frisch'?frischStil(t):null;
  const bg=FS?FS.g:m==='krone'?'#e9dcc0':a.bg2; if(FS){ frischMuster(g,0,0,W,H,FS); g.fillStyle=FS.k; g.fillRect(0,0,W,H*0.08); } else { g.fillStyle=bg; g.fillRect(0,0,W,H); }
  const fg=FS?FS.t:m==='krone'?'#2b1a0e':a.ac;
  g.save(); g.translate(W/2,H*0.4); g.rotate(-Math.PI/2); WZ.txt(g,a.title||p.short,0,0,H*0.7,W*0.5,m==='krone'?WFNT.serif:WFNT.rund,fg); g.restore();
  g.fillStyle=rgba(FS?(wareLum(FS.g)<0.3?'#ffffff':'#3a3a4a'):m==='krone'?'#3a3a4a':'#ffffff',0.35); for(let i=0;i<5;i++) g.fillRect(W*0.15,H*(0.76+i*0.04),W*(0.5+((i*37)%5)*0.06),Math.max(1,H*0.012));
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
/* 04.10. (Tom: "jede Verpackung eigen"): die Flaschen trugen alle dasselbe
   dunkle Druckbild als Etikett - auf dunklem Glas sah man fast nichts,
   Magnum, Jahrgang, Goldsekt und Champagner wirkten gleich. Jetzt ein
   eigenes Papieretikett je Flasche: Papierfarbe, Rahmen, Schrift,
   Zier und Zusatz wie bei echten Weinen und Sekten.
   p=Papier, r=Rahmen/Akzent, s=Schrift, z=Zier (wappen, sterne, traube,
   gold, kreis, blume, ei, krone), f=Schrift */
const FLASCHE_ETIKETT={
  sekt:{p:'#f4ecd8',r:'#b8902a',s:'#1f3a2a',z:'wappen',f:'serif',o:'Sekt · trocken'},
  kindersekt:{p:'#fff6dc',r:'#ff7ab0',s:'#2a7a3a',z:'sterne',f:'rund',o:'alkoholfrei'},
  secco:{p:'#eef4e0',r:'#6f8f4a',s:'#2f4a1a',z:'blume',f:'schreib',o:'Frizzante'},
  rosesekt:{p:'#fff0f4',r:'#c43a6a',s:'#8a1a4a',z:'blume',f:'schreib',o:'Rosé · halbtrocken'},
  champagner:{p:'#efe4c8',r:'#d4af37',s:'#14261b',z:'krone',f:'serif',o:'Brut · Reims'},
  rotwein:{p:'#efe6d6',r:'#7a1022',s:'#3a0a12',z:'traube',f:'serif',o:'Spätburgunder 2024'},
  weisswein:{p:'#f6f2e0',r:'#9ab27a',s:'#3a4a1a',z:'traube',f:'schreib',o:'Riesling · trocken'},
  eierlikoer:{p:'#2b2b2b',r:'#f2d36b',s:'#f2d36b',z:'ei',f:'schreib',o:'20 % vol'},
  likoer:{p:'#e8d8b8',r:'#6a3a1a',s:'#3b2416',z:'kreis',f:'serif',o:'Sahnelikör'},
  magnum:{p:'#0e1a12',r:'#d4af37',s:'#d4af37',z:'krone',f:'serif',o:'1,5 Liter · Brut'},
  kindersekt2:{p:'#ffe8f0',r:'#e05a7a',s:'#a8143a',z:'sterne',f:'rund',o:'Erdbeere'},
  goldsekt:{p:'#1a1a1a',r:'#ffd700',s:'#ffd700',z:'gold',f:'serif',o:'mit Blattgold'},
  jahrgang:{p:'#f6f2ea',r:'#8a1c1c',s:'#1a1a1a',z:'wappen',f:'serif',o:'Millésime 2017'},
  prosecco:{p:'#f2f6ec',r:'#1d4a8a',s:'#1d4a8a',z:'kreis',f:'schreib',o:'DOC · Extra Dry'}
};
function flaschenEtikett(g,W,H,t,a){ const E=FLASCHE_ETIKETT[t]; if(!E) return false;
  const F=WFNT[E.f]||WFNT.serif, nm=a.title||P[t].short, rnd=zufallAus(hashStr(t+'etk'));
  /* rundum geklebt: vorn das Hauptetikett, hinten das Rueckenetikett */
  g.fillStyle=E.p; g.fillRect(0,0,W,H);
  /* u 0 = vorn (+z der Zylinderflaeche): das Hauptetikett liegt ueber der Naht */
  for(const [cx,k] of [[0,0],[W,0],[W/2,1]]){ const ew=W*0.44, x0=cx-ew/2;
    /* Papierstruktur */
    for(let i=0;i<ew*H/40;i++){ g.fillStyle=wareLum(E.p)>0.5?'rgba(90,70,40,.05)':'rgba(255,255,255,.04)'; g.fillRect(x0+rnd()*ew,H*0.02+rnd()*H*0.96,2,1); }
    g.strokeStyle=E.r; g.lineWidth=Math.max(1.5,ew*0.02); WZ.rr(g,x0+ew*0.05,H*0.07,ew*0.9,H*0.86,Math.min(ew,H)*0.05); g.stroke();
    g.lineWidth=Math.max(1,ew*0.006); WZ.rr(g,x0+ew*0.08,H*0.11,ew*0.84,H*0.78,Math.min(ew,H)*0.04); g.stroke();
    if(k===1){ /* Rueckenetikett: Text-Zeilen, Strichcode */
      WZ.txt(g,nm,cx,H*0.24,ew*0.6,H*0.12,F,E.s);
      g.fillStyle=rgba(E.s,0.45); for(let i=0;i<5;i++) g.fillRect(cx-ew*0.32,H*(0.38+i*0.07),ew*0.64*(0.6+0.4*rnd()),Math.max(1,H*0.02));
      g.fillStyle=E.s; for(let x=cx-ew*0.22;x<cx+ew*0.22;x+=ew*0.022) g.fillRect(x,H*0.76,Math.max(1,ew*(0.006+0.008*rnd())),H*0.1); continue; }
    /* Zier oben */
    const zy=H*0.27, zr=Math.min(ew*0.14,H*0.13); g.fillStyle=E.r; g.strokeStyle=E.r; g.lineWidth=Math.max(1,zr*0.12);
    if(E.z==='krone'){ g.beginPath(); g.moveTo(cx-zr,zy+zr*0.5); g.lineTo(cx-zr,zy-zr*0.3); g.lineTo(cx-zr*0.5,zy+zr*0.1); g.lineTo(cx,zy-zr*0.6); g.lineTo(cx+zr*0.5,zy+zr*0.1); g.lineTo(cx+zr,zy-zr*0.3); g.lineTo(cx+zr,zy+zr*0.5); g.closePath(); g.fill(); }
    else if(E.z==='traube'){ for(let r=0;r<4;r++) for(let c=0;c<=3-r;c++){ g.beginPath(); g.arc(cx+(c-(3-r)/2)*zr*0.5,zy-zr*0.4+r*zr*0.42,zr*0.24,0,Math.PI*2); g.fill(); } }
    else if(E.z==='sterne'){ for(let i=0;i<5;i++) WZ.stern(g,cx+(i-2)*zr*0.6,zy+(i%2)*zr*0.3,zr*0.28,E.r,5); }
    else if(E.z==='blume'){ for(let i=0;i<6;i++){ g.beginPath(); g.ellipse(cx+Math.cos(i*Math.PI/3)*zr*0.45,zy+Math.sin(i*Math.PI/3)*zr*0.45,zr*0.3,zr*0.18,i*Math.PI/3,0,Math.PI*2); g.fill(); } g.fillStyle=E.p; g.beginPath(); g.arc(cx,zy,zr*0.2,0,Math.PI*2); g.fill(); }
    else if(E.z==='ei'){ g.beginPath(); g.ellipse(cx,zy,zr*0.5,zr*0.68,0,0,Math.PI*2); g.fill(); }
    else if(E.z==='gold'){ for(let i=0;i<14;i++){ g.globalAlpha=0.5+0.5*rnd(); g.fillRect(cx+(rnd()-0.5)*zr*2,zy+(rnd()-0.5)*zr*1.4,zr*0.22,zr*0.14); } g.globalAlpha=1; }
    else if(E.z==='kreis'){ g.beginPath(); g.arc(cx,zy,zr*0.7,0,Math.PI*2); g.stroke(); WZ.txt(g,(P[t].short||'').slice(0,1),cx,zy,zr,zr,WFNT.serif,E.r); }
    else { /* wappen */ g.beginPath(); g.moveTo(cx-zr*0.6,zy-zr*0.6); g.lineTo(cx+zr*0.6,zy-zr*0.6); g.lineTo(cx+zr*0.6,zy); g.quadraticCurveTo(cx+zr*0.6,zy+zr*0.6,cx,zy+zr*0.75); g.quadraticCurveTo(cx-zr*0.6,zy+zr*0.6,cx-zr*0.6,zy); g.closePath(); g.stroke(); }
    WZ.txt(g,nm,cx,H*0.53,ew*0.62,H*0.2,F,E.s);
    g.fillStyle=E.r; g.fillRect(cx-ew*0.3,H*0.65,ew*0.6,Math.max(1,H*0.012));
    WZ.txt(g,E.o,cx,H*0.76,ew*0.6,H*0.1,WFNT.kond,E.s); }
  return true; }

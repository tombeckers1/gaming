/* =========================================================
   Verpackungsdesign (Tom, 01.10.: "die Verpackungen sehen alle gleich
   aus, langweilig - guck, wie es in echt aussieht").
   Echte Hersteller fuehren Produktlinien mit eigener Bildsprache
   (Classic-Linie mit Effektfoto, Premium in Schwarz-Gold, Power-Linie
   in Neon, Oeko-Linie auf Kraftpapier, Kinderlinie). Vorn das
   Effektfoto, Name, Schusszahl, Brenndauer, Kaliber, Hoehe, NEM, F2
   und Pruefzeichen; Seite Sicherheitshinweise, Piktogramme, Barcode.
   Hier sechs erfundene Linien - jedes Produkt bekommt eine Linie und
   ein eigenes Effektfoto aus seinen Farben und seinem Effekt.
   ========================================================= */

/* Produkt zu einem art-Objekt finden (drawFront bekommt nur art) */
let _artId=null;
function artProdukt(a){
  if(!_artId){ _artId=new Map(); if(typeof P!=='undefined') for(const t in P) if(P[t]&&P[t].art) _artId.set(P[t].art,t); }
  return _artId.get(a)||null;
}
function hashStr(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function zufallAus(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* Eckdaten fuer die Packung */
function produktInfo(t){
  const p=P[t]||{}, sh=p.shape, lvl=p.lvl||1;
  let schuss=0;
  if((sh==='battery'||sh==='fan')&&typeof rohrBedarf==='function') schuss=rohrBedarf(t).schuss;
  if(sh==='rocketset') schuss=p.stueck||Math.max(3,Math.round(((p.dims&&p.dims[2])||0.15)/0.026));
  let dauer=0; try{ if(typeof SHOWS!=='undefined'&&SHOWS[t]) dauer=showLength(t); }catch(e){}
  if(!dauer) dauer=sh==='cylinder'||sh==='fountainset'?Math.round(25+lvl*1.5):sh==='sparkler'?40:0;
  const kal=lvl<8?15:lvl<14?20:lvl<20?25:30;
  const hoehe=sh==='rocketset'?Math.round(40+lvl*2):sh==='battery'||sh==='fan'?Math.round(15+lvl*1.2):sh==='shell'?Math.round(60+lvl*4):0;
  const nem=schuss?Math.round(schuss*(kal/4)):Math.round(20+lvl*6);
  return {schuss,dauer,kal,hoehe,nem,lvl};
}
/* Welcher Effekt ist auf dem Foto? Aus Name und Beschreibung */
function fotoStil(t){
  const p=P[t]||{}, s=((p.name||'')+' '+((p.art&&p.art.sub)||'')+' '+t).toLowerCase();
  if(/weide|kamuro|willow|trauer|vorhang|wasserfall|regen/.test(s)) return 'weide';
  if(/palm|kokos/.test(s)) return 'palme';
  if(/knister|crack|knatter|prassel|donner|knall/.test(s)) return 'knister';
  if(/ring|saturn|kranz/.test(s)) return 'ring';
  if(/komet|schweif|pfeil|drache/.test(s)) return 'komet';
  if(/blink|strobe|glitzer|blitz|funkel|stern/.test(s)) return 'blink';
  if(/faecher|fächer|pfau|wand|fan/.test(s)) return 'faecher';
  return 'dahlie';
}
/* Produktlinie */
const LINIEN=['sternwerk','aurum','blitz','nordlicht','funkenkind','titan'];
function linieVon(t){
  const p=P[t]||{}, s=((p.name||'')+t).toLowerCase();
  if(p.cat===1) return 'funkenkind';
  if(typeof istVerbundKarton==='function'&&p.shape==='battery'&&istVerbundKarton(t)) return /kaiser|krone|gold|tor|royal/.test(s)?'aurum':'titan';
  if(/kaiser|krone|gold|royal|juwel|kristall|diamant|premium|mond/.test(s)) return 'aurum';
  return ['sternwerk','blitz','nordlicht','sternwerk','blitz'][hashStr(t)%5];
}
const LINIE_NAME={sternwerk:'STERNWERK',aurum:'AURUM',blitz:'BLITZ·WERK',nordlicht:'NORDLICHT',funkenkind:'FUNKENKIND',titan:'TITAN PRO'};
const LINIE_ZUSATZ={sternwerk:'Classic Line',aurum:'First Class',blitz:'Power Line',nordlicht:'Green Line · Pappe statt Plastik',funkenkind:'Familienfeuerwerk',titan:'Pro Series'};

function hexRgb(h){ const n=parseInt(String(h||'#888888').slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgba(h,a){ const c=hexRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function heller(h,k){ const c=hexRgb(h).map(v=>Math.round(v+(255-v)*k)); return `rgb(${c[0]},${c[1]},${c[2]})`; }

/* ---------- das "Effektfoto": Nachthimmel mit echten Leuchtspuren ---------- */
function fotoHimmel(g,x,y,W,H,rnd,mitStadt){
  const gr=g.createLinearGradient(0,y,0,y+H); gr.addColorStop(0,'#03040c'); gr.addColorStop(0.7,'#0d0b22'); gr.addColorStop(1,'#241632');
  g.fillStyle=gr; g.fillRect(x,y,W,H);
  g.fillStyle='rgba(255,255,255,.55)'; for(let i=0;i<W*H/2600;i++){ g.fillRect(x+rnd()*W,y+rnd()*H*0.7,1,1); }
  if(mitStadt){ /* Silhouette mit erleuchteten Fenstern */
    const by=y+H; g.fillStyle='#05050a'; let cx=x;
    while(cx<x+W){ const bw=W*(0.05+rnd()*0.09), bh=H*(0.08+rnd()*0.2); g.fillRect(cx,by-bh,bw+1,bh);
      g.fillStyle='rgba(255,200,110,.55)'; for(let k=0;k<bw*bh/90;k++) if(rnd()<0.5) g.fillRect(cx+2+rnd()*(bw-4),by-bh+3+rnd()*(bh-6),1.5,2);
      g.fillStyle='#05050a'; cx+=bw; } }
}
function fotoBurst(g,cx,cy,R,c1,c2,stil,rnd){
  g.save(); g.globalCompositeOperation='lighter'; g.lineCap='round';
  /* Leuchthof */
  const hof=g.createRadialGradient(cx,cy,0,cx,cy,R*1.2); hof.addColorStop(0,rgba(c1,0.32)); hof.addColorStop(1,rgba(c1,0));
  g.fillStyle=hof; g.fillRect(cx-R*1.2,cy-R*1.2,R*2.4,R*2.4);
  const n=stil==='palme'?9:stil==='ring'?54:stil==='weide'?46:stil==='faecher'?7:stil==='komet'?14:64;
  for(let i=0;i<n;i++){
    const an=stil==='faecher'?-Math.PI/2+(i/(n-1)-0.5)*1.6:i/n*Math.PI*2+rnd()*0.08;
    const col=i%3===0?c2:c1, rr=R*(stil==='ring'?1:0.8+rnd()*0.25);
    if(stil==='palme'){ /* dicke Arme, die nach unten abknicken */
      g.strokeStyle=rgba(col,0.85); g.lineWidth=Math.max(1.5,R*0.05); g.beginPath(); g.moveTo(cx,cy);
      const ex=cx+Math.cos(an)*rr, ey=cy+Math.sin(an)*rr*0.8; g.quadraticCurveTo((cx+ex)/2,(cy+ey)/2-R*0.12,ex,ey+R*0.25); g.stroke();
      for(let k=0;k<8;k++){ g.fillStyle=rgba('#fff3c4',0.5); g.fillRect(ex+(rnd()-0.5)*R*0.12,ey+R*0.25+rnd()*R*0.3,1.5,1.5); } }
    else if(stil==='weide'){ /* lange, herabhaengende Goldfaeden */
      g.strokeStyle=rgba(col,0.55); g.lineWidth=Math.max(1,R*0.015); g.beginPath(); g.moveTo(cx,cy);
      const ex=cx+Math.cos(an)*rr*0.7, ey=cy+Math.sin(an)*rr*0.5; g.quadraticCurveTo(ex,ey-R*0.1,ex+Math.cos(an)*R*0.1,ey+R*0.75); g.stroke(); }
    else if(stil==='ring'){ const ex=cx+Math.cos(an)*rr, ey=cy+Math.sin(an)*rr*0.45; g.fillStyle=rgba(col,0.95); g.beginPath(); g.arc(ex,ey,Math.max(1.5,R*0.03),0,Math.PI*2); g.fill(); }
    else if(stil==='komet'){ /* Kometen mit langem Schweif von unten */
      const ex=cx+Math.cos(an)*rr, ey=cy+Math.sin(an)*rr; const lg=g.createLinearGradient(cx,cy,ex,ey); lg.addColorStop(0,rgba(col,0)); lg.addColorStop(1,rgba(col,0.95));
      g.strokeStyle=lg; g.lineWidth=Math.max(2,R*0.045); g.beginPath(); g.moveTo(cx,cy); g.lineTo(ex,ey); g.stroke();
      g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.arc(ex,ey,Math.max(1.5,R*0.035),0,Math.PI*2); g.fill(); }
    else { /* Dahlie, Blinker, Knister, Faecher: Sternspuren mit hellem Kopf */
      const ex=cx+Math.cos(an)*rr, ey=cy+Math.sin(an)*rr; const lg=g.createLinearGradient(cx,cy,ex,ey); lg.addColorStop(0,rgba(col,0.05)); lg.addColorStop(1,rgba(col,0.9));
      g.strokeStyle=lg; g.lineWidth=Math.max(1,R*(stil==='faecher'?0.05:0.022)); g.beginPath(); g.moveTo(cx+Math.cos(an)*R*0.12,cy+Math.sin(an)*R*0.12); g.lineTo(ex,ey); g.stroke();
      g.fillStyle=rgba(heller(col,0.6),1); g.beginPath(); g.arc(ex,ey,Math.max(1.2,R*0.022),0,Math.PI*2); g.fill(); }
  }
  if(stil==='knister'||stil==='blink'){ /* Knister- bzw. Blinkpunkte */
    for(let i=0;i<(stil==='knister'?160:70);i++){ const an=rnd()*Math.PI*2, rr=R*Math.sqrt(rnd())*1.05; g.fillStyle=stil==='knister'?'rgba(255,236,170,.8)':'rgba(255,255,255,.95)';
      const s=stil==='knister'?1.2:Math.max(1.5,R*0.03); g.fillRect(cx+Math.cos(an)*rr,cy+Math.sin(an)*rr,s,s); } }
  /* Kern */
  const k=g.createRadialGradient(cx,cy,0,cx,cy,R*0.16); k.addColorStop(0,'rgba(255,255,255,.95)'); k.addColorStop(1,rgba(c2,0)); g.fillStyle=k; g.beginPath(); g.arc(cx,cy,R*0.16,0,Math.PI*2); g.fill();
  g.restore();
}
/* Steigspuren von unten zu den Bruechen */
function steigSpur(g,x0,y0,x1,y1,c){ g.save(); g.globalCompositeOperation='lighter'; const lg=g.createLinearGradient(x0,y0,x1,y1); lg.addColorStop(0,rgba(c,0)); lg.addColorStop(1,rgba(c,0.7)); g.strokeStyle=lg; g.lineWidth=1.6; g.beginPath(); g.moveTo(x0,y0); g.quadraticCurveTo(x0+(x1-x0)*0.3,y0+(y1-y0)*0.6,x1,y1); g.stroke(); g.restore(); }
function effektFoto(g,x,y,W,H,t,a,rnd,o){
  o=o||{}; g.save(); g.beginPath(); if(o.rund){ g.arc(x+W/2,y+H/2,Math.min(W,H)/2,0,Math.PI*2); } else g.rect(x,y,W,H); g.clip();
  fotoHimmel(g,x,y,W,H,rnd,o.stadt!==false);
  const stil=fotoStil(t), S=Math.min(W,H);
  const B=o.einzeln?[[0.5,0.42,0.42]]:[[0.32,0.36,0.3],[0.7,0.3,0.26],[0.52,0.6,0.2]];
  B.forEach(([fx,fy,fr],i)=>{ const cx=x+W*fx, cy=y+H*fy; steigSpur(g,x+W*(0.4+rnd()*0.2),y+H,cx,cy,i%2?a.ac2:a.ac);
    fotoBurst(g,cx,cy,S*fr,i===1?a.ac2:a.ac,i===1?a.ac:a.ac2,i===2&&stil==='dahlie'?'blink':stil,rnd); });
  g.restore();
}
/* Piktogramme und Infozeile */
function infoZeile(g,x,y,W,h,info,farbe,fg){
  const teile=[]; if(info.schuss) teile.push([info.schuss,'SCHUSS']); if(info.dauer) teile.push([info.dauer+' s','DAUER']); if(info.hoehe) teile.push([info.hoehe+' m','HÖHE']); teile.push([info.kal+' mm','KALIBER']);
  const bw=W/teile.length; g.textAlign='center'; g.textBaseline='middle';
  teile.forEach(([v,l],i)=>{ const cx=x+bw*(i+0.5);
    if(i){ g.fillStyle=rgba(fg,0.35); g.fillRect(x+bw*i,y+h*0.18,1.5,h*0.64); }
    g.fillStyle=fg; g.font=`700 ${Math.max(7,Math.round(h*0.46))}px "Barlow Condensed", Arial, sans-serif`; g.fillText(String(v),cx,y+h*0.38);
    g.fillStyle=farbe; g.font=`600 ${Math.max(5,Math.round(h*0.22))}px Arial, sans-serif`; g.fillText(l,cx,y+h*0.76); });
}
function siegel(g,x,y,r,txt,bg,fg){ g.fillStyle=bg; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); g.strokeStyle=fg; g.lineWidth=Math.max(1,r*0.08); g.beginPath(); g.arc(x,y,r*0.84,0,Math.PI*2); g.stroke();
  g.fillStyle=fg; g.textAlign='center'; g.textBaseline='middle'; g.font=`700 ${Math.round(r*0.78)}px "Barlow Condensed", Arial`; g.fillText(txt,x,y+r*0.04); }
function stern(g,x,y,r,zacken,innen){ g.beginPath(); for(let i=0;i<zacken*2;i++){ const an=-Math.PI/2+i*Math.PI/zacken, rr=i%2?r*innen:r; g.lineTo(x+Math.cos(an)*rr,y+Math.sin(an)*rr); } g.closePath(); }
function nameText(g,txt,x,y,maxW,size,font,fill,outline,lw,skew){
  g.save(); g.translate(x,y); if(skew) g.transform(1,0,skew,1,0,0); g.textAlign='center'; g.textBaseline='middle'; let s=size; do{ g.font=font(s); if(g.measureText(txt).width<=maxW) break; s-=1; }while(s>6);
  if(outline){ g.lineJoin='round'; g.lineWidth=lw||Math.max(2,s*0.14); g.strokeStyle=outline; g.strokeText(txt,0,0); }
  g.fillStyle=fill; g.fillText(txt,0,0); g.restore(); return s; }
const FNT={bun:s=>`${s}px Bungee, Impact, sans-serif`, bar:s=>`700 ${s}px "Barlow Condensed", "Arial Narrow", Arial, sans-serif`, barIt:s=>`italic 700 ${s}px "Barlow Condensed", "Arial Narrow", Arial, sans-serif`, cin:s=>`700 ${s}px Cinzel, Georgia, serif`};

/* ---------- Vorderseiten der Linien ---------- */
const DESIGN_FRONT={
  sternwerk(g,W,H,t,a,info,rnd){
    effektFoto(g,0,0,W,H,t,a,rnd);
    /* Markenlogo oben links */
    const lh=H*0.09; g.fillStyle='#d8322a'; g.beginPath(); g.roundRect?g.roundRect(W*0.04,H*0.04,W*0.34,lh,lh*0.3):g.rect(W*0.04,H*0.04,W*0.34,lh); g.fill();
    nameText(g,'★ STERNWERK',W*0.21,H*0.04+lh/2,W*0.31,Math.round(lh*0.62),FNT.bar,'#fff');
    /* Name: metallisch, schraeg */
    const ny=H*0.66; const gr=g.createLinearGradient(0,ny-H*0.12,0,ny+H*0.1); gr.addColorStop(0,'#ffffff'); gr.addColorStop(0.55,heller(a.ac,0.25)); gr.addColorStop(1,a.ac);
    nameText(g,a.title,W*0.5,ny,W*0.9,Math.round(H*0.2),FNT.barIt,gr,'rgba(0,0,0,.85)',Math.max(3,H*0.022),-0.12);
    /* Schussbanner schraeg oben rechts */
    if(info.schuss){ g.save(); g.translate(W*0.86,H*0.12); g.rotate(0.12); stern(g,0,0,H*0.12,14,0.78); g.fillStyle='#ffd23f'; g.fill(); g.fillStyle='#1b1b1b'; g.textAlign='center'; g.textBaseline='middle';
      g.font=FNT.bar(Math.round(H*0.08)); g.fillText(String(info.schuss),0,-H*0.012); g.font=`700 ${Math.round(H*0.03)}px Arial`; g.fillText('SCHUSS',0,H*0.045); g.restore(); }
    g.fillStyle='rgba(6,8,20,.82)'; g.fillRect(0,H*0.8,W,H*0.2); infoZeile(g,W*0.03,H*0.81,W*0.8,H*0.17,info,'#ffd23f','#ffffff');
    siegel(g,W*0.91,H*0.9,H*0.07,'F'+(P[t].cat||2),'#fff','#1b1b1b');
  },
  aurum(g,W,H,t,a,info,rnd){
    g.fillStyle='#0b0a09'; g.fillRect(0,0,W,H);
    for(let i=0;i<W*H/60;i++){ g.fillStyle=`rgba(255,255,255,${rnd()*0.025})`; g.fillRect(rnd()*W,rnd()*H,1,1); }
    const gold=g.createLinearGradient(0,0,W,H); gold.addColorStop(0,'#8a6a2a'); gold.addColorStop(0.35,'#f3d98b'); gold.addColorStop(0.6,'#b8892f'); gold.addColorStop(1,'#f0d27a');
    g.strokeStyle=gold; g.lineWidth=Math.max(2,H*0.012); g.strokeRect(W*0.035,H*0.035,W*0.93,H*0.93); g.lineWidth=1; g.strokeRect(W*0.05,H*0.05,W*0.9,H*0.9);
    const r=Math.min(W*0.32,H*0.3); effektFoto(g,W/2-r,H*0.08,r*2,r*2,t,a,rnd,{rund:true,einzeln:true,stadt:false});
    g.strokeStyle=gold; g.lineWidth=Math.max(2,H*0.01); g.beginPath(); g.arc(W/2,H*0.08+r,r,0,Math.PI*2); g.stroke();
    g.fillStyle=gold; g.textAlign='center'; g.textBaseline='middle'; g.font=`600 ${Math.max(6,Math.round(H*0.04))}px Cinzel, Georgia, serif`; g.letterSpacing=Math.round(H*0.012)+'px';
    g.fillText('AURUM · FIRST CLASS',W/2,H*0.74); g.letterSpacing='0px';
    nameText(g,a.title,W/2,H*0.64,W*0.84,Math.round(H*0.12),FNT.cin,gold,'rgba(0,0,0,.6)',2);
    g.fillStyle=gold; g.fillRect(W*0.2,H*0.785,W*0.6,1.5); infoZeile(g,W*0.1,H*0.8,W*0.8,H*0.13,info,'#b8892f','#f3e6c2');
  },
  blitz(g,W,H,t,a,info,rnd){
    g.fillStyle=a.bg2; g.fillRect(0,0,W,H);
    g.save(); g.beginPath(); g.moveTo(0,0); g.lineTo(W,0); g.lineTo(W,H*0.42); g.lineTo(0,H*0.68); g.closePath(); g.clip(); effektFoto(g,0,0,W,H*0.68,t,a,rnd,{stadt:false}); g.restore();
    /* Neon-Speedlines */
    g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<7;i++){ g.strokeStyle=rgba(i%2?a.ac:a.ac2,0.6); g.lineWidth=Math.max(1.5,H*0.008); const y0=H*(0.42+i*0.04);
      g.beginPath(); g.moveTo(W*0.02,y0+H*0.26); g.lineTo(W*(0.55+rnd()*0.4),y0+H*0.26-W*0.32); g.stroke(); } g.restore();
    /* Blitz */
    g.fillStyle='#ffe23f'; g.beginPath(); const bx=W*0.08, by=H*0.06, bs=H*0.22; g.moveTo(bx+bs*0.4,by); g.lineTo(bx,by+bs*0.58); g.lineTo(bx+bs*0.25,by+bs*0.58); g.lineTo(bx+bs*0.1,by+bs); g.lineTo(bx+bs*0.55,by+bs*0.4); g.lineTo(bx+bs*0.3,by+bs*0.4); g.closePath(); g.fill();
    nameText(g,a.title,W*0.52+H*0.012,H*0.72+H*0.012,W*0.92,Math.round(H*0.2),FNT.bun,a.ac2,null,0,-0.18);
    nameText(g,a.title,W*0.52,H*0.72,W*0.92,Math.round(H*0.2),FNT.bun,'#ffffff','#111',Math.max(3,H*0.03),-0.18);
    if(info.schuss){ g.save(); g.translate(W*0.84,H*0.16); stern(g,0,0,H*0.14,18,0.7); g.fillStyle='#ffe23f'; g.fill(); g.strokeStyle='#111'; g.lineWidth=2; g.stroke();
      g.fillStyle='#111'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bun(Math.round(H*0.075)); g.fillText(String(info.schuss),0,-H*0.01); g.font=`700 ${Math.round(H*0.028)}px Arial`; g.fillText('SCHUSS!',0,H*0.05); g.restore(); }
    g.fillStyle='#111'; g.fillRect(0,H*0.84,W,H*0.16); nameText(g,'BLITZ·WERK  POWER LINE',W*0.3,H*0.92,W*0.5,Math.round(H*0.06),FNT.barIt,a.ac);
    infoZeile(g,W*0.58,H*0.845,W*0.4,H*0.15,{...info,hoehe:0,dauer:0},a.ac2,'#fff');
  },
  nordlicht(g,W,H,t,a,info,rnd){
    g.fillStyle='#c9a676'; g.fillRect(0,0,W,H); for(let i=0;i<W*H/40;i++){ g.fillStyle=`rgba(${rnd()<0.5?'110,80,40':'240,215,170'},${rnd()*0.1})`; g.fillRect(rnd()*W,rnd()*H,1+rnd()*3,1); }
    const px=W*0.06, py=H*0.06, pw=W*0.88, ph=H*0.56; g.fillStyle='#fff'; g.fillRect(px-3,py-3,pw+6,ph+6); effektFoto(g,px,py,pw,ph,t,a,rnd);
    g.fillStyle='#2f3b2a'; g.textAlign='left'; g.textBaseline='alphabetic'; g.font=`600 ${Math.max(6,Math.round(H*0.045))}px "Barlow Condensed", Arial`; g.fillText('NORDLICHT',W*0.06,H*0.7);
    nameText(g,a.title,W*0.5,H*0.78,W*0.88,Math.round(H*0.13),FNT.bar,'#2b1d10');
    g.fillStyle='#3e7d3a'; g.beginPath(); g.ellipse(W*0.86,H*0.68,W*0.075,H*0.038,0,0,Math.PI*2); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.font=`700 ${Math.max(5,Math.round(H*0.022))}px Arial`; g.fillText('PAPPE',W*0.86,H*0.68);
    infoZeile(g,W*0.04,H*0.86,W*0.92,H*0.12,info,'#5a4428','#2b1d10');
  },
  funkenkind(g,W,H,t,a,info,rnd){
    const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,heller(a.bg1,0.25)); gr.addColorStop(1,a.bg1); g.fillStyle=gr; g.fillRect(0,0,W,H);
    /* Konfetti und lachende Sterne */
    for(let i=0;i<40;i++){ g.save(); g.translate(rnd()*W,rnd()*H*0.55); g.rotate(rnd()*3); g.fillStyle=['#ffd23f','#ff5a8a','#5ce1ff','#7dff8a','#fff'][i%5]; g.fillRect(-W*0.02,-W*0.006,W*0.04,W*0.012); g.restore(); }
    for(let k=0;k<2;k++){ const x=W*(0.24+k*0.52), y=H*(0.26-k*0.04), r=Math.min(W,H)*(0.16-k*0.03); stern(g,x,y,r,5,0.5); g.fillStyle='#ffd23f'; g.fill(); g.strokeStyle='#e08a00'; g.lineWidth=Math.max(1.5,r*0.06); g.stroke();
      g.fillStyle='#3a2200'; g.beginPath(); g.arc(x-r*0.18,y-r*0.05,r*0.07,0,Math.PI*2); g.arc(x+r*0.18,y-r*0.05,r*0.07,0,Math.PI*2); g.fill(); g.strokeStyle='#3a2200'; g.lineWidth=Math.max(1,r*0.05); g.beginPath(); g.arc(x,y+r*0.08,r*0.18,0.2,Math.PI-0.2); g.stroke(); }
    nameText(g,a.title,W/2,H*0.62,W*0.9,Math.round(H*0.17),FNT.bun,'#ffffff',a.bg2,Math.max(3,H*0.03));
    nameText(g,a.sub||'',W/2,H*0.76,W*0.86,Math.round(H*0.07),FNT.bar,'#fff');
    g.fillStyle='#fff'; g.beginPath(); g.ellipse(W*0.16,H*0.89,W*0.12,H*0.065,0,0,Math.PI*2); g.fill(); g.fillStyle='#e0287a'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bun(Math.round(H*0.045)); g.fillText('FUNKENKIND',W*0.16,H*0.89);
    siegel(g,W*0.86,H*0.88,H*0.08,'F'+(P[t].cat||1),'#fff','#e0287a');
  },
  titan(g,W,H,t,a,info,rnd){
    g.fillStyle='#121418'; g.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=4) for(let x=(y/4)%2*4;x<W;x+=8){ g.fillStyle='rgba(255,255,255,.035)'; g.fillRect(x,y,4,2); }
    /* Warnstreifen oben */
    g.save(); g.beginPath(); g.rect(0,0,W,H*0.07); g.clip(); g.fillStyle='#ff7a00'; g.fillRect(0,0,W,H*0.07); g.fillStyle='#121418'; for(let x=-H;x<W;x+=H*0.09){ g.beginPath(); g.moveTo(x,H*0.07); g.lineTo(x+H*0.045,H*0.07); g.lineTo(x+H*0.115,0); g.lineTo(x+H*0.07,0); g.fill(); } g.restore();
    effektFoto(g,0,H*0.07,W,H*0.5,t,a,rnd);
    g.fillStyle='#ff7a00'; g.fillRect(0,H*0.57,W,H*0.008);
    nameText(g,a.title,W*0.42,H*0.68,W*0.78,Math.round(H*0.16),FNT.bar,'#ffffff');
    nameText(g,'TITAN PRO · VERBUNDFEUERWERK',W*0.42,H*0.775,W*0.78,Math.round(H*0.045),FNT.bar,'#ff7a00');
    if(info.schuss){ g.fillStyle='#ff7a00'; g.fillRect(W*0.84,H*0.6,W*0.15,H*0.22); g.fillStyle='#121418'; g.textAlign='center'; g.textBaseline='middle'; g.font=FNT.bar(Math.round(H*0.1)); g.fillText(String(info.schuss),W*0.915,H*0.69); g.font=`700 ${Math.round(H*0.035)}px Arial`; g.fillText('SCHUSS',W*0.915,H*0.77); }
    infoZeile(g,W*0.03,H*0.84,W*0.94,H*0.14,info,'#ff7a00','#fff');
  }
};
/* ---------- Seite und Deckel ---------- */
function designSeite(g,W,H,t,a,info,linie,rnd){
  const dunkel=linie!=='nordlicht'&&linie!=='funkenkind', bg=linie==='nordlicht'?'#c9a676':linie==='funkenkind'?heller(a.bg1,0.1):linie==='aurum'?'#0b0a09':linie==='titan'?'#121418':a.bg2;
  g.fillStyle=bg; g.fillRect(0,0,W,H);
  const fg=dunkel?'#f2f2f2':'#2b1d10', ak=linie==='aurum'?'#d9b45a':linie==='titan'?'#ff7a00':a.ac;
  g.fillStyle=ak; g.fillRect(0,0,W,H*0.06);
  nameText(g,LINIE_NAME[linie],W/2,H*0.03,W*0.9,Math.round(H*0.04),FNT.bar,dunkel?'#111':'#fff');
  /* Name hochkant */
  g.save(); g.translate(W*0.3,H*0.36); g.rotate(-Math.PI/2); nameText(g,a.title,0,0,H*0.52,Math.round(W*0.3),linie==='aurum'?FNT.cin:FNT.bar,ak); g.restore();
  /* Warnfeld */
  const x0=W*0.52, w0=W*0.42; g.fillStyle=dunkel?'rgba(255,255,255,.9)':'rgba(255,255,255,.8)'; g.fillRect(x0,H*0.1,w0,H*0.5);
  g.fillStyle='#1b1b1b'; g.textAlign='left'; g.textBaseline='top'; g.font=`700 ${Math.max(5,Math.round(w0*0.12))}px Arial`; g.fillText('ACHTUNG',x0+w0*0.06,H*0.115);
  for(let i=0;i<9;i++){ g.fillStyle='rgba(30,30,30,.55)'; g.fillRect(x0+w0*0.06,H*(0.15+i*0.028),w0*(0.6+0.3*rnd()),Math.max(1,H*0.008)); }
  /* Piktogramme: Abstand, Ohrschutz, Brille */
  for(let i=0;i<3;i++){ const cx=x0+w0*(0.2+i*0.3), cy=H*0.5, r=w0*0.12; g.fillStyle='#fff'; g.beginPath(); g.arc(cx,cy,r,0,Math.PI*2); g.fill(); g.strokeStyle='#c8322a'; g.lineWidth=Math.max(1,r*0.18); g.stroke();
    g.fillStyle='#1b1b1b'; g.textAlign='center'; g.textBaseline='middle'; g.font=`700 ${Math.max(5,Math.round(r*0.8))}px Arial`; g.fillText(['8m','18+','◉'][i],cx,cy); }
  /* Daten, CE, Barcode */
  g.fillStyle=fg; g.textAlign='left'; g.textBaseline='top'; const fs=Math.max(5,Math.round(W*0.06)); g.font=`600 ${fs}px Arial`;
  const zeilen=[info.schuss?`${info.schuss} Schuss`:'',info.dauer?`ca. ${info.dauer} s`:'',`Kaliber ${info.kal} mm`,`NEM ${info.nem} g`,`CE 0589-F${P[t].cat||2}-${String(1000+hashStr(t)%8999)}`].filter(Boolean);
  zeilen.forEach((z,i)=>g.fillText(z,W*0.08,H*0.64+i*fs*1.25));
  g.fillStyle='#fff'; g.fillRect(W*0.5,H*0.8,W*0.44,H*0.12); g.fillStyle='#111'; for(let x=W*0.52,k=0;x<W*0.92;k++){ const b=1+((hashStr(t)>>(k%24))&1)*1.5; g.fillRect(x,H*0.81,b,H*0.085); x+=b+1.2; }
  g.fillStyle=ak; g.fillRect(0,H*0.95,W,H*0.05);
}
function designTop(g,W,H,t,a,info,linie,rnd){
  if(linie==='aurum'){ g.fillStyle='#0b0a09'; g.fillRect(0,0,W,H); const gold='#d9b45a'; g.strokeStyle=gold; g.lineWidth=2; g.strokeRect(W*0.05,H*0.08,W*0.9,H*0.84); nameText(g,a.title,W/2,H/2,W*0.8,Math.round(H*0.3),FNT.cin,gold); return; }
  if(linie==='nordlicht'){ g.fillStyle='#c9a676'; g.fillRect(0,0,W,H); nameText(g,a.title,W/2,H/2,W*0.8,Math.round(H*0.3),FNT.bar,'#2b1d10'); return; }
  effektFoto(g,0,0,W,H,t,a,rnd,{stadt:false,einzeln:W<H*1.6});
  nameText(g,a.title,W/2,H*0.82,W*0.86,Math.round(H*0.18),linie==='funkenkind'?FNT.bun:FNT.bar,'#fff','rgba(0,0,0,.7)',3);
}
/* Einstieg aus reuse-pack: liefert true, wenn das Design gezeichnet hat */
function designZeichnen(teil,g,W,H,a,cat){
  const t=artProdukt(a); if(!t||!P[t]) return false;
  /* Zubehoer, Essen, Getraenke: eigene Gestaltung (04e) */
  if(!P[t].cat) return typeof wareZeichnen==='function'&&wareZeichnen(teil,g,W,H,t,a);
  const linie=linieVon(t), info=produktInfo(t), rnd=zufallAus(hashStr(t+teil));
  try{
    if(teil==='front') DESIGN_FRONT[linie](g,W,H,t,a,info,rnd);
    else if(teil==='side') designSeite(g,W,H,t,a,info,linie,rnd);
    else designTop(g,W,H,t,a,info,linie,rnd);
  }catch(e){ return false; }
  return true;
}

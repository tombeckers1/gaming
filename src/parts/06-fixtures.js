
/* =========================================================
   Verschiebbare Einrichtung
   ========================================================= */
const movables=[];
/* Ein Rechteck in Gruppenkoordinaten, als achsenparalleles Rechteck
   in der Welt - fuer eine Gruppe an (x,z) mit Drehung ry. */
function rectWelt(x,z,ry,r){
  const s=Math.sin(ry), c=Math.cos(ry);
  let a=1e9,b=-1e9,e=1e9,f=-1e9;
  for(const lx of [r.x0,r.x1]) for(const lz of [r.z0,r.z1]){
    const wx=x+lx*c+lz*s, wz=z-lx*s+lz*c;
    a=Math.min(a,wx); b=Math.max(b,wx); e=Math.min(e,wz); f=Math.max(f,wz);
  }
  return {minX:a,maxX:b,minZ:e,maxZ:f};
}
/* Moebel nie in der Wand (05.10., Tom, Gameplay-Vorfuehrung: "das
   Lagerregal war halb in der Wand drin - beim Eingang zum Verkaufsladen",
   die Einraeumer davor "verschwinden halb in der Wand"): die Stellplaetze
   sind fuer die schmalen Regale gerechnet. Das Schwerlastregal (3,3 m)
   ragte am Platz neben der Lagertuer einen halben Meter durch die Wand,
   tiefe Tische und Gitterboxen an der Wandreihe 7 bis 50 cm, und der
   Halteplatz vor dem letzten Fach lag mitten in der Mauer.
   wandRechtecke: Grundriss aller sichtbaren Waende am Boden.
   wandSchub: wie weit ein Moebel-Rechteck aus den Waenden heraus muss -
   nach vorn (Tiefe) bis maxT, seitlich (Laenge) bis maxL; mehr ist kein
   Nachruecken mehr, dann passt das Moebel an diesen Platz nicht (null). */
function wandRechtecke(){
  const out=[];
  for(const m of WAENDE){ let o=m, an=true; while(o){ if(!o.visible){ an=false; break; } o=o.parent; } if(an) out.push(m.userData.aabb); }
  return out;
}
function wandSchub(r,ry,maxT,maxL){
  const W=wandRechtecke(), tx=Math.abs(Math.sin(ry||0))>0.5; let dx=0, dz=0;
  for(let n=0;n<8;n++){
    let hit=null;
    for(const w of W){ const ox=Math.min(r.x1+dx,w.x1)-Math.max(r.x0+dx,w.x0), oz=Math.min(r.z1+dz,w.z1)-Math.max(r.z0+dz,w.z0);
      if(ox>0.004&&oz>0.004){ hit={w,ox,oz}; break; } }
    if(!hit){ const t=tx?Math.abs(dx):Math.abs(dz), l=tx?Math.abs(dz):Math.abs(dx);
      return t<=maxT+1e-6&&l<=maxL+1e-6?{dx:Math.round(dx*1000)/1000,dz:Math.round(dz*1000)/1000}:null; }
    const {w,ox,oz}=hit;
    if(ox<oz) dx+=((r.x0+r.x1)/2+dx<(w.x0+w.x1)/2?-1:1)*(ox+0.01);
    else dz+=((r.z0+r.z1)/2+dz<(w.z0+w.z1)/2?-1:1)*(oz+0.01);
  }
  return null;
}
const SCHUB_T=0.6, SCHUB_L=0.15;
function dropFootprint(m){
  if(m.col){ dropCol(m.col); m.col=null; }
  if(m.cols){ m.cols.forEach(dropCol); m.cols=null; }
}
function applyFootprint(m){
  if(typeof navDirty==='function') navDirty();
  dropFootprint(m);
  /* Grosse Einheiten wie die Packstation sind kein Klotz: sie
     blockieren nur dort, wo wirklich etwas steht. Auf der
     bemalten Flaeche dazwischen kann man laufen. */
  if(m.teile){
    m.cols=m.teile().map(t=>{ const w=rectWelt(m.g.position.x,m.g.position.z,m.g.rotation.y,t);
      return col(w.minX,w.maxX,w.minZ,w.maxZ,m); });
    return;
  }
  if(!m.fw) return;
  const s=Math.abs(Math.sin(m.g.rotation.y))>0.5, w=(s?m.fd:m.fw)/2, d=(s?m.fw:m.fd)/2;
  m.col=col(m.g.position.x-w,m.g.position.x+w,m.g.position.z-d,m.g.position.z+d,m);
}
function addMovable(m){ movables.push(m); applyFootprint(m); return m; }
function placeMovable(m,x,z,ry){ m.g.position.x=x; m.g.position.z=z; m.g.rotation.y=ry; applyFootprint(m); if(m.onPlace) m.onPlace(); }
function localToWorld(g,x,z){ const s=Math.sin(g.rotation.y), c=Math.cos(g.rotation.y); return V(g.position.x+x*c+z*s,0,g.position.z-x*s+z*c); }

/* =========================================================
   Kasse mit Laufband (als Gruppe, verschiebbar)
   ========================================================= */
const BELT_A=1.45, BELT_B=0.12, BELT_Y=0.972;
let ckG=null, ckMov=null, ckNameTex=null;
/* Die Blende hat dieselbe Farbe wie der Korpus, die Schrift steht
   rechts (Tom, 25.09.). Vorher hellgraue Blende mit Anthrazit-Schrift
   in Bungee, mittig.
   06.10. (Tom: "Mache die Kassen standardmaessig weiss."): Korpus und
   Blende weiss wie im Supermarkt, Schrift Anthrazit; dunkel bleiben nur
   Sockel, Bedienfeld und Bildschirm. Vorher Korpus und Blende Anthrazit
   mit heller Schrift. */
const CK_KORPUS=MAT.farbe('weiss'), CK_SOCKEL=MAT.farbe('anthrazit');
const CK_BLENDE='#e9ebee', CK_TEXT='#2b2e34';
const CK_SCHRIFT=s=>`700 ${s}px Cinzel, Georgia, "Times New Roman", serif`;
function drawCkName(g,W,H){
  g.fillStyle=CK_BLENDE; g.fillRect(0,0,W,H);
  const t=shopName().toUpperCase(), rechts=W-34;
  g.textAlign='right'; g.textBaseline='middle';
  if('letterSpacing' in g) g.letterSpacing='6px';
  fitFont(g,t,W-150,74,CK_SCHRIFT);
  const bw=g.measureText(t).width;
  g.fillStyle=CK_TEXT; g.fillText(t,rechts,H/2+4);
  /* feine Edelstahllinie links vom Namen */
  g.fillStyle='#9aa1ac'; g.fillRect(Math.max(20,rechts-bw-120),H/2+2,90,3);
  if('letterSpacing' in g) g.letterSpacing='0px';
}
/* Nach einer Umbenennung Schild und Kassenblende neu zeichnen */
function applyShopName(){
  if(ckNameTex) redraw(ckNameTex,(g,W,H)=>drawCkName(g,W,H));
  if(signTex) redraw(signTex,(g,W,H)=>drawSignFace(g,W,H));
}
/* Die Kasse steht links vom Eingang, laengs an der Trennwand (Tom,
   25.09.): die Kundenseite zeigt in den Raum, die Schlange laeuft
   von hinten auf die Tuer zu, bezahlt wird vorn am Eingang. Vorher
   stand sie rechts vom Eingang unter dem Schaufenster. */
const CK_HOME={x:0.7,z:2.2,ry:-Math.PI/2}, CK_ALT={x:-5,z:3.2,ry:0};
function ck(x,z){ return localToWorld(ckG,x,z); }
function ckYaw(){ return ckG.rotation.y; }
function buildCheckout(){
  ckG=new THREE.Group(); ckG.position.set(CK_HOME.x,0,CK_HOME.z); ckG.rotation.y=CK_HOME.ry; scene.add(ckG);
  /* Kassenplatz aus dem Baukasten (bk.kasse art 'kasse', 04z): Korpus und Blende weiss, Sockel dunkel, Leisten Edelstahl;
     hier bleiben Ladenname, Kassenbildschirm, Trefferflaechen und die Logik (Band, Tuete, Bezahlen) */
  ckNameTex=tex(1000,136,(g,W,H)=>drawCkName(g,W,H));
  posTex=tex(1024,720,()=>{});
  const K=bk.kasse({art:'kasse',parent:ckG,name:ckNameTex,pos:posTex,bandA:BELT_A,bandB:BELT_B});
  occluders.push(K.korpus); beltTex=K.band;
  posHit=bbox(0.66,0.72,0.6,hitM,-0.8,1.2,-0.1,ckG,false); posHit.userData={kind:'pos'};
  cardHit=bbox(0.34,0.3,0.34,hitM,0.58,1.06,0.26,ckG,false); cardHit.userData={kind:'card'};
  ckMov=addMovable({kind:'ck',name:'Kasse',g:ckG,fw:3.4,fd:0.95,onPlace:()=>{ belt.forEach(b=>syncBeltItem(b)); syncBag(); }});
  drawPOS();
}
/* =========================================================
   SB-Kassen: zwei Selbstbedienungsterminals in der neuen
   Verkaufsflaeche. Kunden mit wenig Ware zahlen dort selbst.
   ========================================================= */
let sbG=null; const sbLanes=[], sbCols=[];
function sbScreenTex(){
  return tex(512,384,(g,W,H)=>{
    g.fillStyle='#0f1726'; g.fillRect(0,0,W,H);
    g.fillStyle='#16233a'; g.fillRect(0,0,W,68);
    g.fillStyle=MAT.css('schildgold'); g.font=BUN(34); g.textAlign='left'; g.textBaseline='middle';
    g.fillText('SB-KASSE', 20, 34);
    g.fillStyle='#6cf2a8'; g.font=BAR(24); g.textAlign='right';
    g.fillText('BEREIT', W-20, 34);
    g.textAlign='left';
    const zeilen=[['Batteriebox 100 Schuss','24,90'],['Raketensortiment','12,50'],['Wunderkerzen','2,40']];
    zeilen.forEach((z,i)=>{
      g.fillStyle=i%2?'#132034':'#101b2d'; g.fillRect(16,92+i*46,W-32,42);
      g.fillStyle='#cfe0f5'; g.font=BAR(22); g.fillText(z[0],28,113+i*46);
      g.textAlign='right'; g.fillStyle='#ffffff'; g.fillText(z[1]+' €',W-28,113+i*46); g.textAlign='left';
    });
    g.fillStyle='#1d2c47'; g.fillRect(16,246,W-32,52);
    g.fillStyle='#ffffff'; g.font=BUN(30); g.fillText('Summe',30,272);
    g.textAlign='right'; g.fillText('39,80 €',W-30,272); g.textAlign='left';
    g.fillStyle='#2f9e57'; g.fillRect(16,310,(W-40)/2,56);
    g.fillStyle='#3a4560'; g.fillRect(24+(W-40)/2,310,(W-40)/2,56);
    g.fillStyle='#ffffff'; g.font=BUN(26); g.textAlign='center';
    g.fillText('BEZAHLEN',16+(W-40)/4,340);
    g.fillText('HILFE',24+(W-40)*0.75,340);
  });
}
/* 10.10.: Geraetebau mit wenigen Zeichenaufrufen - alle Teile einer
   Oberflaeche (Lack, Metall, matt, leuchtend) werden mit Vertexfarben zu
   je einem Mesh verschmolzen. pivot() setzt eine Bezugsmatrix fuer
   gekippte Baugruppen (Bildschirm, Kartenterminal). */
/* 13.10. (Fundament): duenne Huelle ueber den Baukasten-Sammler bk.sammler (04z) -
   gleiche Aufrufe wie vorher, Materialien aus MAT.vc (lack/metall/matt/glas/leucht); geraetMat entfaellt. */
function geraetBau(){
  const S=bk.sammler({form:{fase:0.02,faseMin:0.03},reihenfolge:['lack','metall','matt','glas','leucht'],bauteil:'geraet'});
  const B={
    pivot(x,y,z,rx,ry,rz){ S.pivot(x,y,z,rx,ry,rz); return B; },
    box(art,w,h,d,c,x,y,z,rx,ry,rz){ S.box(w,h,d,x,y,z,c,art,rx,ry,rz); return B; },
    rund(art,w,h,d,r,c,x,y,z,rx,ry,rz){ S.rund(w,h,d,r,x,y,z,c,art,rx,ry,rz); return B; },
    zyl(art,r1,r2,h,seg,c,x,y,z,rx,ry,rz){ S.zyl(r1,r2,h,seg,x,y,z,c,art,rx,ry,rz); return B; },
    fertig(parent,schatten){ return S.fertig(parent,{schatten}); }
  };
  return B;
}
function sbTerminal(parent,x,z){
  /* 10.10. (Tom: Bildschirm zu tief, grauer Staender billig): wie ein echtes Self-Checkout. Gebaut von bk.kasse (art 'sb', 04z) -
     hier Trefferflaeche und Spurzustand */
  const T=bk.kasse({art:'sb',parent,x,z,bildschirm:sbScreenTex()});
  occluders.push(T.korpus);
  /* unsichtbare Trefferflaeche: der Spieler kann selbst helfen */
  const hit=bbox(0.9,1.9,0.8,hitM,0,0.95,0.05,T.g,false);
  const l={g:T.g,lamp:T.lamp,lampM:T.lampM,busy:null,t:0,hit,helfer:null,hilfe:false};
  hit.userData={kind:'sbterm',ref:l}; sbLampe(l,true);
  return l;
}
function buildSBKasse(){
  if(sbG) return sbG;
  sbG=new THREE.Group(); sbG.position.set(0,0,0); scene.add(sbG);
  /* Rueckwand mit Beschilderung hinter den Terminals (bk.kasse art 'sbTafel') */
  bk.kasse({art:'sbTafel',parent:sbG,x:10.6,z:3.75,breite:3.6});
  for(const x of [9.7,11.5]) sbLanes.push(sbTerminal(sbG,x,4.4));
  sbCols.push(col(9.0,10.4,4.05,4.75),col(10.8,12.2,4.05,4.75));
  return sbG;
}
function sbLampe(l,frei){
  l.lampM.color.copy(LIN(frei?0x1d5f36:0x5f3a1d));
  l.lampM.emissive.copy(LIN(frei?0x37d977:MAT.farbe('signalorange')));
  l.lampM.emissiveIntensity=1.6; l.hilfe=false;
}
/* Rot blinkend: hier kommt ein Kunde nicht weiter */
function sbLampeHilfe(l,an){
  if(!an){ sbLampe(l,!l.busy); return; }
  l.hilfe=true; l.lampM.color.copy(LIN(0x5f1d1d)); l.lampM.emissive.copy(LIN(0xff3a2e));
}
function sbLampeBlink(l,t){ l.lampM.emissiveIntensity=(t*2.4)%1<0.55?2.2:0.25; }
/* Nach der Hilfe (Betreuer, Spieler oder der Kunde selbst) scannt er weiter */
const SB_SELBST=30;
function sbGeholfen(l,wer){
  if(!l) return; const c=l.busy; l.helfer=null;
  sbLampe(l,false);
  if(!c||c.state!=='sbHilfe') return;
  c.state='sbPay';
  if(wer){ c.say(pick(['Danke!','Ah, so geht das.','Super, danke!'])); DS.sbHilfe=(DS.sbHilfe||0)+1; rep(WIRT.ruf.sbHilfe); sfx.beep(); }
  if(wer==='spieler'){ addXP(WIRT.xp.sbHilfe,'SB-Hilfe'); }
}
let sbHinweisZeit=-1e9;
function sbHinweisOk(){ const t=performance.now(); if(t-sbHinweisZeit<45000) return false; sbHinweisZeit=t; return true; }
/* Der Kunde nimmt die freie SB-Kasse, die ihm am naechsten ist -
   nicht einfach die erste in der Liste am anderen Ende des Ladens */
function sbFreiNah(pos){
  let best=-1, bd=1e9;
  for(let i=0;i<sbLanes.length;i++){ if(sbLanes[i].busy||!sbNutzbar(i)) continue;
    const q=sbPos(i), d=Math.hypot(q.x-pos.x,q.z-pos.z); if(d<bd){ bd=d; best=i; } }
  return best;
}
/* Beim Laden eines anderen Spielstands muessen die Terminals wieder weg */
function setSB(an){
  if(an){ buildSBKasse(); sbG.visible=true;
    sbCols.forEach(c=>{ if(colliders.indexOf(c)<0) colliders.push(c); }); }
  else if(sbG){ sbG.visible=false; sbCols.forEach(c=>dropCol(c)); }
  sbLanes.forEach(l=>{ l.busy=null; sbLampe(l,true); });
}
/* Wohin das SB-Kassenpaket getragen wird: vor die Kassenzeile */
function sbZiel(){ return {x:10.6,z:2.8}; }
/* Anlaufpunkt vor einem SB-Terminal (haengt das Terminal in einer
   verschobenen oder gedrehten Gruppe, ist seine lokale Position nicht
   die Weltposition) */
function sbPos(i){
  const g=sbLanes[i].g, p=g.parent;
  if(p&&p!==scene) return localToWorld(p,g.position.x,g.position.z+0.95);
  return V(g.position.x,0,g.position.z+0.95);
}
/* Eine Spur zaehlt nur, wenn die SB-Kassen gekauft sind */
function sbFrei(){ for(let i=0;i<sbLanes.length;i++) if(!sbLanes[i].busy&&sbNutzbar(i)) return i; return -1; }
function sbOffen(){ let n=0; for(let i=0;i<sbLanes.length;i++) if(sbNutzbar(i)) n++; return n; }
let deskG=null;
function buildDesk(){
  /* Die Bueroecke mit dem Laptop haengt an der Westwand, gleich
     neben der Lagertuer. Vorher stand sie an der Ostwand - die
     liegt jetzt hinter der Trennwand. */
  /* 05.10.: 5 cm von der Wand weg - die Tischplatte (1,17 m mit Kante)
     ragte bei x -7,35 drei Zentimeter in die Westwand */
  deskG=new THREE.Group(); deskG.position.set(-7.3,0,0.9); deskG.rotation.y=Math.PI; scene.add(deskG);
  /* Hochwertiger Schreibtisch: Nussbaum-Furnier auf Stahlwangen */
  const furnierT=(()=>{ const t=tex(768,768,(g,W,H)=>{
        const base=g.createLinearGradient(0,0,W,H);
        base.addColorStop(0,'#5d4630'); base.addColorStop(0.5,'#6b5138'); base.addColorStop(1,'#573f2b');
        g.fillStyle=base; g.fillRect(0,0,W,H);
        /* lange, ruhige Maserung statt Kratzern */
        for(let i=0;i<220;i++){
          const y=Math.random()*H, amp=rand(4,16), tone=rand(0.05,0.16);
          g.strokeStyle=`rgba(${Math.random()<0.5?42:120},${Math.random()<0.5?28:92},${Math.random()<0.5?16:62},${tone})`;
          g.lineWidth=rand(0.7,2.6); g.beginPath(); g.moveTo(-10,y);
          for(let x=0;x<=W+10;x+=48) g.lineTo(x,y+Math.sin(x*0.011+i)*amp*0.35+rand(-1.2,1.2));
          g.stroke();
        }
        /* Spiegelfurnier: weiche helle Baender */
        for(let i=0;i<7;i++){ const y=rand(0,H);
          const gr=g.createLinearGradient(0,y-30,0,y+30);
          gr.addColorStop(0,'rgba(196,160,112,0)'); gr.addColorStop(0.5,'rgba(196,160,112,.12)'); gr.addColorStop(1,'rgba(196,160,112,0)');
          g.fillStyle=gr; g.fillRect(0,y-30,W,60); }
        /* seidenmatter Lack */
        const gl=g.createLinearGradient(0,0,W*0.6,H);
        gl.addColorStop(0,'rgba(255,245,225,.10)'); gl.addColorStop(0.6,'rgba(255,245,225,0)');
        g.fillStyle=gl; g.fillRect(0,0,W,H);
      }); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; })();
  const woodT=new THREE.MeshStandardMaterial({map:furnierT,roughness:0.34,metalness:0.04}),
        kante=MAT.ober('holzDunkel','matt'),
        metal=MAT.get('chromHell'),
        metalD=MAT.get('stahlAnthrazit'),
        dark=MAT.get('kunststoffSchwarz');
  /* Platte mit umlaufender Massivholzkante */
  bbox(1.12,0.038,1.56,woodT,0,0.762,0,deskG);
  for(const [w,d,x,z] of [[1.14,0.022,0,0.782],[1.14,0.022,0,-0.782]])
    bbox(w,0.052,0.024,kante,x,0.757,z,deskG,false);
  for(const sx of [-0.572,0.572]) bbox(0.024,0.052,1.61,kante,sx,0.757,0,deskG,false);
  /* Stahlwangen statt duenner Beine */
  for(const sz of [-0.62,0.62]){
    bbox(0.9,0.028,0.07,metal,0,0.735,sz,deskG,false);
    bbox(0.06,0.7,0.055,metal,-0.42,0.385,sz,deskG);
    bbox(0.06,0.7,0.055,metal, 0.42,0.385,sz,deskG);
    bbox(0.92,0.035,0.09,metal,0,0.028,sz,deskG,false);
    for(const sx of [-0.42,0.42]){
      const gl2=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.022,0.014,10),metalD);
      gl2.position.set(sx,0.007,sz); deskG.add(gl2);
    }
  }
  /* Traverse und Kabelwanne */
  bbox(0.05,0.05,1.2,metal,-0.42,0.18,0,deskG,false);
  bbox(0.05,0.05,1.2,metal, 0.42,0.18,0,deskG,false);
  bbox(0.62,0.02,0.16,metalD,0,0.66,-0.52,deskG,false);
  for(const sx of [-0.2,0.2]) bbox(0.03,0.09,0.03,metalD,sx,0.71,-0.52,deskG,false);
  /* Rollcontainer unter der Platte */
  { const c2=new THREE.Group(); c2.position.set(0.28,0,0.28); deskG.add(c2);
    rbox(0.42,0.58,0.52,0.014,MAT.get('lackAnthrazit'),0,0.32,0,c2);
    for(let i=0;i<3;i++){
      bbox(0.4,0.16,0.012,MAT.ober('graphit','kunststoff'),0,0.16+i*0.18,0.262,c2,false);
      bbox(0.16,0.014,0.016,metal,0,0.16+i*0.18,0.272,c2,false);
    }
    for(const sx of [-0.15,0.15]) for(const sz of [-0.18,0.18]){
      const w2=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.018,8),dark);
      w2.rotation.z=Math.PI/2; w2.position.set(sx,0.024,sz); c2.add(w2);
    }
  }
  /* Laptop */
  const lap=new THREE.Group(); lap.position.set(-0.05,0.78,-0.16); lap.rotation.y=-Math.PI/2; deskG.add(lap);
  rbox(0.44,0.018,0.32,0.006,MAT.get('stahlAnthrazit'),0,0.009,0.08,lap);
  bbox(0.36,0.004,0.2,MAT.get('gummi'),0,0.019,0.11,lap,false);
  for(let r=0;r<4;r++) for(let c2=0;c2<12;c2++)
    bbox(0.024,0.004,0.018,MAT.get('graphitMatt'),-0.15+c2*0.0275,0.022,0.05+r*0.023,lap,false);
  bbox(0.12,0.004,0.06,MAT.get('graphitMatt'),0,0.021,0.17,lap,false);
  const lid=rbox(0.45,0.3,0.014,0.006,MAT.get('stahlAnthrazit'),0,0.16,-0.08,lap);
  lid.rotation.x=-0.22;
  /* Bildschirmschoner statt Menueattrappe - das echte Menue oeffnet sich beim Anklicken */
  const sch=neuerSchoner(512,320);
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(0.41,0.26),new THREE.MeshBasicMaterial({toneMapped:false,map:sch.t}));
  sch.mesh=scr;
  scr.position.set(0,0.16,-0.072); scr.rotation.x=-0.22; lap.add(scr);
  const led=new THREE.MeshStandardMaterial({color:LIN(0x0a2a12),emissive:LIN(0x3dff7a),emissiveIntensity:1.4});
  bbox(0.012,0.006,0.004,led,0.18,0.02,0.19,lap,false);
  lapHit=bbox(0.7,0.5,0.7,hitM,-0.05,0.95,-0.1,deskG,false); lapHit.userData={kind:'laptop'};
  /* Bürostuhl */
  { const ch=new THREE.Group(); ch.position.set(-0.85,0,0.05); ch.rotation.y=1.5; deskG.add(ch);
    rbox(0.46,0.09,0.44,0.03,MAT.get('kunststoffAnthrazit'),0,0.46,0,ch);
    const bk=rbox(0.44,0.5,0.08,0.03,MAT.get('kunststoffAnthrazit'),0,0.76,-0.21,ch); bk.rotation.x=0.14;
    bbox(0.06,0.14,0.06,metal,0,0.56,-0.2,ch,false);
    const col2=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.045,0.38,10),metal); col2.position.y=0.23; ch.add(col2);
    for(let i=0;i<5;i++){ const a2=i/5*Math.PI*2;
      bbox(0.05,0.03,0.26,metal,Math.cos(a2)*0.11,0.06,Math.sin(a2)*0.11,ch,false).rotation.y=-a2;
      const w=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.022,8),dark);
      w.rotation.z=Math.PI/2; w.position.set(Math.cos(a2)*0.24,0.035,Math.sin(a2)*0.24); ch.add(w); }
    for(const sx of [-1,1]) bbox(0.05,0.18,0.28,MAT.get('anthrazitMatt'),sx*0.25,0.6,0,ch,false); }
  addMovable({kind:'desk',name:'Büro-Tisch',g:deskG,fw:1.2,fd:1.6});
}

/* =========================================================
   Verkaufsregale
   ========================================================= */
const shelves=[];
const shelfStrips=[];
/* Gestell-Material aller Verkaufsmoebel (Vertexfarben nach Rolle): Oberflaechenklasse Kunststoff/Lack aus der Bibliothek
   (Einheit 15.10., vorher eigenes Material roughness 0,72); Rueckwand, Glas, Gitter usw. baut bk.regal (04z) */
function gestellMat(){ return MAT.vc('kunststoff'); }
function kindOf(sh){ return SHELFKIND[sh&&sh.kind]||SHELFKIND.standard; }
function shelfCount(k){ return shelves.filter(s=>s.kind===k).length; }
/* Fassungsvermögen richtet sich nach Regalbreite und -tiefe */
/* Freie Hoehe ueber einem Fach: bis zum naechsten Boden; das oberste
   Fach hat mehr Luft bis zur Deckplatte - dort stehen die grossen Verbundbatterien
   (Tom, 25.09.: "die wirklich krassen viel, viel groesser"). Vorher
   stand hohe Ware einfach im Boden darueber. */
function fachHoehe(K,li){ return li<K.lv.length-1?K.lv[li+1]-K.lv[li]-0.04:(K.oben!==undefined?K.oben:(K.cold?0.44:0.58)); }
/* Fach-Module (02.10., Tom, Foto Wunderkerzen: "da ist nur eine Reihe
   vorne - und im Karton sind 36 Stueck, ins Fach passen 39"):
   - Die Ware fuellt das Fach jetzt auch in die Tiefe, Reihe hinter Reihe
     wie im Supermarkt (vorher begrenzte das Gitter im Produkt die Tiefe
     auf eine bis drei Reihen).
   - Jedes Moebel besteht aus gleichen Modulen (SHELFKIND, 02-data):
     gerechnet wird, was in EIN Modul passt, mal die Zahl der Module -
     das Verkaufsregal fasst genau doppelt so viel wie das kleine.
   - Ein Fach fasst immer ganze Kartons: wo die Menge nicht aufgeht,
     bleibt eine Reihe oder Lage frei. Die Kartongroesse jedes Produkts
     ist so gewaehlt, dass ein Modul ganze Kartons fasst (kartonWahl).
   Zu breit, zu tief oder zu hoch fuer das Fach heisst "passt nicht". */
const MODUL={B:0.9,T:0.44,H:0.52};
const _lay=new Map();
/* groesste Menge a*b*c <= Grenzen, die ein Vielfaches von box ist -
   bei Gleichstand die breiteste, dann die tiefste Anordnung */
function ganzeKartons(c,r,s,box){
  if(box<=1) return [c,r,s];
  /* zuerst die volle Breite halten (Tom, 25.09.: das Fach von links bis
     rechts fuellen) - dann eher eine Reihe hinten oder eine Lage weniger */
  for(let a=c;a>=1;a--){ let best=null, bn=0;
    for(let b=r;b>=1;b--) for(let d=s;d>=1;d--){ const n=a*b*d; if(n%box||n<bn) continue; if(n>bn||b>best[1]){ bn=n; best=[a,b,d]; } }
    if(best&&(bn>=0.6*c*r*s||a===1)) return best; }
  return [0,0,0];
}
/* Modulraster eines Moebels: Grundflaeche B x T je Modul, MX x MZ Module */
function modRaster(K){ return K.frei?{B:MODUL.B,T:MODUL.T,MX:K.modX||1,MZ:K.modZ||1}:{B:K.modB||MODUL.B,T:K.tiefe||MODUL.T,MX:K.mod||Math.max(1,Math.round(K.w)),MZ:1}; }
function layoutRoh(t,K,lvH){
  const p=P[t], G=p.grid, g=0.012, dw=p.dims[0], dh=p.dims[1], dd=p.dims[2], R=modRaster(K);
  const pro=(L,d)=>Math.floor((L+g)/(d+g)), auf=(d,m)=>Math.ceil(d/m-1e-6);
  /* Tische und Gitterboxen: stapeln, so hoch es geht (hoechstens 4);
     Regale: so hoch, wie das Produkt stapelbar ist (grid[2]) */
  const st=dh>lvH+0.001?0:K.frei?Math.min(4,Math.floor(lvH/dh)):Math.max(1,Math.min(G[2],Math.floor(lvH/dh)));
  if(dw<=R.B&&dd<=R.T) return {cm:pro(R.B,dw),rm:pro(R.T,dd),st,mx:R.MX,mz:R.MZ};
  return {cols:dw<=R.B?R.MX*pro(R.B,dw):Math.floor(R.MX/auf(dw,R.B)),rows:dd<=R.T?R.MZ*pro(R.T,dd):Math.floor(R.MZ/auf(dd,R.T)),st};
}
function layout(t,sh,lv){
  const p=P[t], K=kindOf(sh), g=0.012;
  /* ohne Fach: das hoechste, das dieses Regal hat */
  const lvH=lv?fachHoehe(K,lv.li):Math.max(...K.lv.map((_,i)=>fachHoehe(K,i)));
  const box=Math.max(1,p.box|0), key=t+'|'+K.id+'|'+lvH.toFixed(3)+'|'+box+'|'+p.dims.join(',');
  let L=_lay.get(key);
  if(!L){ const R=layoutRoh(t,K,lvH); let cols, rows, st, modCm=0, modN=0;
    if(R.cm!==undefined){
      /* je Modul ganze Kartons; reicht ein Modul nicht fuer einen Karton,
         dann ueber das ganze Fach */
      let [a,b,c]=ganzeKartons(R.cm,R.rm,R.st,box);
      if(a*b*c){ cols=a*R.mx; rows=b*R.mz; st=c; if(!K.frei&&R.mx>1){ modCm=a; modN=R.mx; } }
      /* Tisch und Gitterbox: passt kein Karton in ein Modul, dann in eine
         Modulspalte (1 x 2) - so bleibt der grosse Tisch genau doppelt so
         voll wie der kleine */
      else if(K.frei&&R.mz>=2&&(([a,b,c]=ganzeKartons(R.cm,R.rm*2,R.st,box)),a*b*c)){ cols=a*R.mx; rows=b*Math.floor(R.mz/2); st=c; }
      /* ... sonst in die ganze Breite, zwei Module tief */
      else if(K.frei&&R.mz>=2&&(([a,b,c]=ganzeKartons(R.cm*R.mx,R.rm*2,R.st,box)),a*b*c)){ cols=a; rows=b*Math.floor(R.mz/2); st=c; }
      else [cols,rows,st]=ganzeKartons(R.cm*R.mx,R.rm*R.mz,R.st,box);
    } else [cols,rows,st]=ganzeKartons(R.cols,R.rows,R.st,box);
    if(!(R.st>0)) cols=rows=st=0;
    L={cols:Math.max(1,cols),rows:Math.max(1,rows),st,cap:cols*rows*st,w:p.dims[0],h:p.dims[1],d:p.dims[2],g,K,modCm,modN};
    _lay.set(key,L); }
  return L;
}
/* Kartongroesse (02.10., Tom: "dann musst du die Stueckzahl im Karton
   veraendern"): je Produkt eine handelsuebliche Stueckzahl nahe der
   bisherigen, die ein Fach-Modul seines Heimatmoebels (Regal, sonst
   Grossverbund-Regal, sonst Tisch) mit ganzen Kartons fuellt - moeglichst
   ganz breit und tief. Der Preis je Stueck bleibt, der Karton kostet
   entsprechend mehr oder weniger. */
const KARTON_ZAHLEN=[1,2,3,4,5,6,8,10,12,15,16,18,20,24,25,30,32,36,40,45,48,50,60,64,72,80,90,96,100,120,144];
function kartonWahl(t){
  const p=P[t]; if(!p||!p.dims||!p.grid) return;
  if(p.box0===undefined) p.box0=p.box;
  const b0=Math.max(1,p.box0|0);
  const heim=p.kuehlpflicht?['kuehl','tisch']:p.kasse==='nur'?['kasse']:['standard','gross','tisch'];
  for(const kid of heim){ const K=SHELFKIND[kid], H=Math.max(...K.lv.map((_,i)=>fachHoehe(K,i))), R=layoutRoh(t,K,H);
    const [c,r,s]=R.cm!==undefined?[R.cm,R.rm,R.st]:[R.cols,R.rows,R.st];
    if(!(c*r*s)) continue;
    const V0=c*r*s; let best=null;
    for(let a=c;a>=Math.max(1,Math.ceil(c*0.75));a--) for(let b=r;b>=Math.max(1,Math.ceil(r*0.6));b--) for(let d=s;d>=Math.max(1,Math.ceil(s*0.5));d--){
      const V=a*b*d;
      /* nahe an der alten Stueckzahl, das Modul voll, die Breite voll
         (eine Spalte weniger wiegt schwer), runde Zahlen bevorzugt */
      for(let k=1;k<=Math.min(V,200);k++){ if(V%k) continue;
        const w=Math.abs(Math.log(k/b0))+2*(1-V/V0)+6*(1-a/c)+(KARTON_ZAHLEN.includes(k)?0:0.15);
        if(!best||w<best.w) best={w,k}; } }
    if(best){ p.box=best.k; return; }
  }
}
/* Massraster (02.10., Tom, Verpackungs-Vorfuehrung: "dass das Regal
   befuellt ist und nicht irgendwelche Luecken ... notfalls die
   Produktgroesse veraendern"): eine Packung von 53 cm Breite stand
   einzeln im 90-cm-Fach, daneben 37 cm Luft. Jede Packung bekommt jetzt
   Breite und Tiefe so, dass eine ganze Zahl davon das Fach-Modul (90 x 44,
   Grossverbund 98 x 62) fuellt - die naechstliegende solche Groesse.
   Runde Ware (Dosen, Flaschen, Kerzen, Kugelbomben) waechst oder
   schrumpft gleichmaessig, Kugelbomben nur wenig (sie muessen in ihr
   Moerserrohr). Flache Packungen werden so hoch gestapelt, wie das Fach
   es hergibt (eine Handbreit Luft nach oben). Was schon voll ist, bleibt. */
const RASTER_STAPEL=new Set(['boxA','rocketset','tubepack','fountainset','assort','battery','fan','sparkler']);
const RASTER_RUND=new Set(['cylinder','bottle','candle','shell','atombombe','fass','lighter']);
function rasterFuell(x,L){ const g=0.012, n=Math.floor((L+g)/(x+g)); return n*(x+g)/L; }
/* n Packungen je Modul; zwei Module nebeneinander (Tisch, Gitterbox) brauchen
   dazwischen noch eine Fuge, darum (L+g/2)/n */
function rasterKandidaten(x,L,lo,hi){ const g=0.012, out=[];
  for(let n=1;n<=60;n++){ const v=Math.floor(((L+g/2)/n-g-0.001)*1000)/1000, q=v/x; if(q>=lo&&q<=hi) out.push(q); }
  return out; }
function massRaster(t){
  const p=P[t]; if(!p||!p.dims||!p.grid||p.noOrder||p.rezept||p.dims0) return;
  p.dims0=p.dims.slice();
  /* die Raketenzahl im Set haengt sonst an der Tiefe der Packung */
  if(p.shape==='rocketset'&&p.stueck===undefined) p.stueck=Math.max(3,Math.round(p.dims[2]/0.026));
  const [w,h,d]=p.dims, Hs=fachHoehe(SHELFKIND.standard,0);
  const M=h<=Hs?{B:MODUL.B,T:MODUL.T,H:Hs}:{B:SHELFKIND.gross.modB,T:SHELFKIND.gross.tiefe,H:fachHoehe(SHELFKIND.gross,0)};
  if(RASTER_RUND.has(p.shape)){
    /* gleichmaessig: die Groesse, bei der Breite mal Tiefe am vollsten ist */
    const lo=p.shape==='shell'?0.92:0.65, hi=p.shape==='shell'?1.08:1.3;
    let best={q:1,f:rasterFuell(w,M.B)*rasterFuell(d,M.T)};
    for(const q of rasterKandidaten(w,M.B,lo,hi).concat(rasterKandidaten(d,M.T,lo,hi))){
      if(w*q>M.B||d*q>M.T||(q>1&&h*q>M.H-0.01)) continue;
      const f=rasterFuell(w*q,M.B)*rasterFuell(d*q,M.T)-0.25*Math.abs(Math.log(q));
      if(f>best.f+0.02) best={q,f}; }
    if(best.q!==1) p.dims=[w*best.q,h*best.q,d*best.q].map(v=>Math.round(v*1000)/1000);
  } else {
    /* keine Packung waechst ueber eine Paketgrenze des Versands (86 cm
       im grossen Paket) - sonst brauchte das Raketen-Set ploetzlich das riesige */
    const VSG=0.86;
    const achse=(x,L)=>{ if(x<=L&&rasterFuell(x,L)>=0.92) return x;
      const ok=q=>x>VSG||x*q<=VSG;
      /* naechstliegende Groesse; erst wenn keine im Rahmen liegt, auch weiter weg
         (60 cm im 90-cm-Fach: 44 oder 89 cm, beides weit) */
      let b=null; for(const q of rasterKandidaten(x,L,0.75,1.4)) if(ok(q)&&(!b||Math.abs(Math.log(q))<Math.abs(Math.log(b)))) b=q;
      if(!b) for(const q of rasterKandidaten(x,L,0.6,1.6)) if(ok(q)&&(!b||Math.abs(Math.log(q))<Math.abs(Math.log(b)))) b=q;
      return b?Math.round(x*b*1000)/1000:x; };
    p.dims=[achse(w,M.B),h,achse(d,M.T)];
  }
  /* Kugelbomben und kleine Dosen stehen in Papphuelsen - die stapelt man auch */
  if(RASTER_STAPEL.has(p.shape)||p.shape==='shell'||(p.shape==='cylinder'&&p.dims[1]<=0.22)){ const hh=p.dims[1]; p.grid=[p.grid[0],p.grid[1],Math.max(p.grid[2]|0,Math.min(6,Math.floor((M.H-0.06)/hh)))]; }
}
Object.keys(P).forEach(massRaster);
/* alle Produkte bekommen ihre Kartongroesse (P ist hier vollstaendig) */
Object.keys(P).forEach(kartonWahl);
/* Breite eines Regalmoduls zwischen den Stehern (Mittelsteher 3 cm) */
const STEHER=0.03;
function modBreite(K){ const n=K.mod||1; return (K.w-0.1-(n-1)*STEHER)/n; }
function slotLocal(t,idx,sh,lv){
  /* 02.10. (Tom): eingeraeumt wird von hinten nach vorn - die erste Reihe
     steht ganz hinten, die vorderste kommt zuletzt. Dann sieht man, wie
     viel noch passt, und der Kunde nimmt vorn (removeFromLevel nimmt das
     zuletzt eingeraeumte Stueck, also aus der vordersten Reihe). */
  const L=layout(t,sh,lv), c=idx%L.cols, rest=Math.floor(idx/L.cols), layer=rest%L.st, row=L.rows-1-Math.floor(rest/L.st);
  const z=L.K.d/2-0.03-L.d/2-row*(L.d+L.g);
  /* Regal aus mehreren Modulen: je Modul mittig zwischen den Stehern */
  if(L.modCm){ const m=Math.floor(c/L.modCm), cc=c%L.modCm, mb=modBreite(L.K), iw=L.K.w-0.1, tw=L.modCm*(L.w+L.g)-L.g;
    return {x:-iw/2+m*(mb+STEHER)+mb/2-tw/2+L.w/2+cc*(L.w+L.g), y:layer*L.h, z}; }
  const tw=L.cols*(L.w+L.g)-L.g;
  return {x:-tw/2+L.w/2+c*(L.w+L.g), y:layer*L.h, z};
}
function slotFrei(sl){ return !sl.zone||zoneOffen(sl.zone); }
/* Mittelgondeln und Eckregale brauchen den passenden Stellplatz */
/* 02.10.: breite Moebel (Gitterbox XL, grosser Tisch) brauchen auch
   Platz neben dem Stellplatz - kein Platz, an dem sie in ein Nachbarmoebel
   ragen wuerden. Grundflaeche als achsparalleles Rechteck (Drehung in
   Vierteln). */
function moebelRect(K,x,z,ry){ const w=(K.fw||K.w)/2, d=(K.fd||K.d)/2, q=Math.abs(Math.round(Math.sin(ry||0)));
  return q?{x0:x-d,x1:x+d,z0:z-w,z1:z+w}:{x0:x-w,x1:x+w,z0:z-d,z1:z+d}; }
/* Wo ein Moebel an einem Stellplatz wirklich steht: tiefe Tische und
   Gitterboxen ruecken von der Wand ab nach vorn (05.10.); passt es auch
   so nicht, ist der Platz fuer diese Art nichts (null) */
function stellPlatz(K,sl){ const ry=sl.ry||0, sb=wandSchub(moebelRect(K,sl.x,sl.z,ry),ry,SCHUB_T,SCHUB_L);
  return sb?{x:sl.x+sb.dx,z:sl.z+sb.dz,ry}:null; }
function slotPasst(K,sl){
  const art=K.art||'wand';
  if((sl.art||'wand')!==art) return false;
  if(shelves.some(s=>Math.abs(s.g.position.x-sl.x)<0.05&&Math.abs(s.g.position.z-sl.z)<0.05)) return false;
  const p=stellPlatz(K,sl); if(!p) return false;
  const a=moebelRect(K,p.x,p.z,p.ry);
  return !shelves.some(s=>{ const b=moebelRect(kindOf(s),s.g.position.x,s.g.position.z,s.g.rotation.y);
    return a.x0<b.x1-0.02&&a.x1>b.x0+0.02&&a.z0<b.z1-0.02&&a.z1>b.z0+0.02; });
}
function slotsOffen(){ return SLOTS.filter(slotFrei); }
/* Gibt es noch einen freien Stellplatz fuer diesen Regaltyp? */
function freiFuer(kindId){ const K=SHELFKIND[kindId]; return K?slotsOffen().some(sl=>slotPasst(K,sl)):false; }
/* Fertig ist ein Regaltyp erst, wenn es Plaetze dafuer gibt und alle
   belegt sind. Solange der passende Raum noch gar nicht gekauft ist,
   ist er gesperrt - nicht erledigt. */
function alleBelegt(kindId){
  const K=SHELFKIND[kindId]; if(!K) return true;
  const art=K.art||'wand';
  const offen=slotsOffen().filter(sl=>(sl.art||'wand')===art);
  return offen.length>0&&!offen.some(sl=>slotPasst(K,sl));
}
/* Ein Regal kann mehrere Warenseiten haben: das normale Regal eine,
   die Mittelgondel zwei (Ware rundum) und das Eckregal zwei ueber Eck.
   Jede Seite ist eine eigene Gruppe mit eigenen Faechern. */
const FACE1=[{ry:0,ox:0,oz:0}];
function seitenVon(K){ return K.seiten||FACE1; }
function faceOf(sh,lv){ return seitenVon(kindOf(sh))[lv.face||0]; }
/* Punkt in der Seitenebene -> Weltkoordinate */
function faceWorld(sh,f,x,z){
  const si=Math.sin(f.ry), c=Math.cos(f.ry);
  return localToWorld(sh.g,f.ox+x*c+z*si,f.oz-x*si+z*c);
}
/* Regalpalette aus der Wandfarbe: auf heller Wand ein anthrazitfarbenes
   Gestell mit hellen, leicht in den Wandton gebrochenen Seiten und
   Rueckwand, auf dunkler Wand ein helles Alu-Gestell. Boeden und Preis-
   leiste bleiben neutral grau wie im echten Ladenbau. */
function regalFarben(K){
  let w=null; try{ w=wallSet(); }catch(e){} w=w||{a:'#e9e1d1'};
  const hx=h=>parseInt(String(h).slice(1),16), ch=(c,k)=>(c>>k)&255, lum=c=>(0.2126*ch(c,16)+0.7152*ch(c,8)+0.0722*ch(c,0))/255;
  const mix=(a,b,t)=>(Math.round(ch(a,16)*(1-t)+ch(b,16)*t)<<16)|(Math.round(ch(a,8)*(1-t)+ch(b,8)*t)<<8)|Math.round(ch(a,0)*(1-t)+ch(b,0)*t);
  const wa=hx(w.a), hell=lum(wa)>0.42;
  /* Verkaufstische (02.10., Tom: "nicht gelb, sondern weiss und so"):
     weisse Schichtstoffplatte, Gestell in Alu bzw. Anthrazit zur Wand */
  if(K&&K.bau==='tisch') return {rahmen:hell?MAT.farbe('graphit'):MAT.farbe('aluminium'), seite:MAT.farbe('aluminium'), blende:MAT.farbe('aluminium'), fuss:MAT.farbe('gummischwarz'), boden:MAT.farbe('lichtgrau'), preis:MAT.farbe('weiss'), lippe:MAT.farbe('hellgrau'), kopf:hell?MAT.farbe('anthrazit'):MAT.farbe('gummischwarz'), platte:MAT.farbe('cremeweiss'), rueck:MAT.farbe('cremeweiss')};
  /* Kassenregal: Farben der Kasse (Korpus und Blende weiss, Sockel
     dunkel, Platte und Boeden hellgrau, Leisten Edelstahl) - unabhaengig
     von der Wand. 06.10.: weiss wie die Kasse, vorher Anthrazit. */
  if(K&&K.kasse) return {rahmen:CK_KORPUS, seite:CK_KORPUS, blende:CK_KORPUS, fuss:CK_SOCKEL, boden:MAT.farbe('lichtgrau'), preis:MAT.farbe('weiss'), lippe:MAT.farbe('aluminium'), kopf:CK_KORPUS, platte:MAT.farbe('lichtgrau'), rueck:MAT.farbe('lichtgrau')};
  if(K&&K.cold) return {rahmen:MAT.farbe('aluminium'),seite:MAT.farbe('aluminium'),blende:MAT.farbe('aluminium'),fuss:MAT.farbe('anthrazit'),boden:MAT.farbe('lichtgrau'),preis:MAT.farbe('aluminium'),lippe:MAT.farbe('weiss'),kopf:MAT.farbe('nachtblau'),platte:MAT.farbe('holzPalette'),rueck:MAT.farbe('weiss')};
  return {rahmen:hell?MAT.farbe('graphit'):MAT.farbe('aluminium'), seite:hell?mix(wa,MAT.farbe('cremeweiss'),0.78):mix(wa,MAT.farbe('hellgrau'),0.45), blende:hell?MAT.farbe('graphit'):MAT.farbe('aluminium'), fuss:MAT.farbe('gummischwarz'),
    boden:MAT.farbe('lichtgrau'), preis:MAT.farbe('weiss'), lippe:MAT.farbe('hellgrau'), kopf:hell?MAT.farbe('anthrazit'):MAT.farbe('gummischwarz'), platte:hell?MAT.farbe('holzPalette'):MAT.farbe('holzPaletteDunkel'), rueck:hell?mix(wa,MAT.farbe('cremeweiss'),0.82):mix(wa,MAT.farbe('hellgrau'),0.5)};
}
function regaleFaerben(){
  bk.regal.rueckwand().color.copy(LIN(regalFarben(null).rueck));
  shelves.forEach(sh=>{ (sh.gestelle||[]).forEach(m=>{ const RF=regalFarben(m.userData.regalK), ca=m.geometry.attributes.color; let o=0;
      for(const [r,n] of m.userData.rollen){ const c=LIN(RF[r]); for(let i=0;i<n;i++) ca.setXYZ(o+i,c.r,c.g,c.b); o+=n; } ca.needsUpdate=true; });
    if(sh.gitterM) sh.gitterM.color.copy(LIN(regalFarben(kindOf(sh)).rahmen)); });
}
/* Drahtgitter fuer die Gitterbox: Stahldraht 4 mm im 5-cm-Raster, als
   Alpha-Textur - man sieht die Ware durch das Gitter */
/* gitterTex() entfaellt (13.10., Materialangleichung): Drahtgitter = MAT.tex('drahtgitter') (geteilt) */
/* Verkaufsmoebel (Regal, Gondel, Eck, Kuehlschrank, Kassenregal, Verkaufstisch, Gitterbox): gebaut von bk.regal (04z, art 'laden') -
   hier nur Platz, Faecher (Level), Speicherstand. Tisch und Gitterbox haben dieselben Faecher, Preisschilder, Kopfschild und
   Treffer wie ein Regal - Kunden, Einraeumer und Speicherstand behandeln sie wie jedes andere Regal. */
function createShelf(i,data){
  const kind=(data&&data.kind&&SHELFKIND[data.kind])?data.kind:'standard';
  const K=SHELFKIND[kind];
  bk.regal.rueckwand().color.copy(LIN(regalFarben(null).rueck));
  const g=new THREE.Group(); const frei=slotsOffen().filter(sl=>slotPasst(K,sl));
  const s=data&&data.x!==undefined?data:(frei[0]||slotsOffen()[0]||SLOTS[0]);
  g.position.set(s.x,0,s.z); g.rotation.y=s.ry||0; scene.add(g);
  /* nie in der Wand: ein wenig nachruecken, wo das reicht (auch fuer
     alte Spielstaende mit Tischen an der Wandreihe) */
  { const sb=wandSchub(moebelRect(K,s.x,s.z,s.ry||0),s.ry||0,SCHUB_T,SCHUB_L); if(sb){ g.position.x+=sb.dx; g.position.z+=sb.dz; } }
  const W=K.w, D=K.d;
  const sh={i,g,kind,levels:[],W,D};
  if(data&&typeof data.schild==='string'&&data.schild.trim()) sh.schild=data.schild.trim().slice(0,24);
  /* Farben nach Rolle: sie folgen der Wandfarbe (regalFarben) und werden beim Umstreichen nachgefaerbt (regaleFaerben) */
  const R=bk.regal({art:'laden',K,g,farben:regalFarben(K),px:REGAL_TEX});
  sh.gestelle=R.gestelle; sh.headTex=R.headTex; sh.headY=R.headY; if(R.kopfG) sh.kopfG=R.kopfG; if(R.gitterM) sh.gitterM=R.gitterM;
  if(R.leiste){ if(shelfStrips.indexOf(R.leiste)<0) shelfStrips.push(R.leiste); R.leiste.emissiveIntensity=(S&&S.up&&S.up.regallicht)?1.5:0; }
  for(const f of R.faecher){ const lv={sh,li:f.li,face:f.face,type:null,count:0,q:1,items:[],tex:f.tex,hit:f.hit}; f.hit.userData={kind:'level',ref:lv}; sh.levels.push(lv); }
  sh.mov=addMovable({kind:'shelf',name:K.name,g,fw:(K.fw||W)+0.06,fd:(K.fd||D)+0.04,ref:sh,onPlace:()=>syncShelf(sh)});
  shelves.push(sh);
  if(data&&data.levels) data.levels.forEach((ld,li)=>{ if(ld&&ld.type&&P[ld.type]&&sh.levels[li]){ const n=Math.min(ld.count|0,layout(ld.type,sh,sh.levels[li]).cap); for(let k=0;k<n;k++) addToLevel(sh.levels[li],ld.type,ld.q||1); } });
  sh.levels.forEach(updateLabel); updateHead(sh);
  return sh;
}
function shelfStand(sh,lv){ const K=kindOf(sh); return faceWorld(sh,lv?faceOf(sh,lv):seitenVon(K)[0],0,K.d/2+0.65); }
function itemMatrix(sh,lv,idx,jit){ const f=faceOf(sh,lv), p=slotLocal(lv.type,idx,sh,lv), w=faceWorld(sh,f,p.x,p.z);
  return mx(w.x,kindOf(sh).lv[lv.li]+p.y,w.z,sh.g.rotation.y+f.ry+jit); }
function syncShelf(sh){ sh.levels.forEach(lv=>{ lv.items.forEach((h,k)=>{ if(lv.type) h.pool.set(h,itemMatrix(sh,lv,k,h.jit||0)); }); }); }
/* nach Sparte: Essen und Getraenke haben seit 26.09. ihr eigenes Schild */
const HEADNAME={zubehoer:['SILVESTER-ZUBEHÖR','#2f7fd0'],f1:['KLEINFEUERWERK F1','#2f9e57'],f2:['FEUERWERK F2 · AB 18','#c8322a'],essen:['ESSEN & SNACKS','#d0782f'],getraenke:['GETRÄNKE','#1f8fb8']};
/* Welche Sparte ueberwiegt im Regal - daraus das Kopfschild */
function headArt(sh){
  const cnt={}; sh.levels.forEach(l=>{ if(l.type){ const c=sparteVon(l.type); cnt[c]=(cnt[c]||0)+l.count; } });
  let best=null,bn=0; for(const k in cnt) if(cnt[k]>bn){ bn=cnt[k]; best=k; }
  return best; }
function updateHead(sh){
  if(!sh.headTex) return;
  /* Kassenregal: Schild wie das Namensschild der Kasse - weiss (06.10.,
     vorher Anthrazit), dunkle Serifenschrift, feine Edelstahllinie */
  if(kindOf(sh).kasse){ const t=(sh.schild||'Nicht vergessen').toUpperCase();
    redraw(sh.headTex,(g,W,Hh)=>{ g.setTransform(1,0,0,1,0,0); g.scale(W/512,Hh/80); W=512; Hh=80;
      g.fillStyle=CK_BLENDE; g.fillRect(0,0,W,Hh);
      g.fillStyle='#9aa1ac'; g.fillRect(0,Hh-5,W,2);
      g.textAlign='center'; g.textBaseline='middle'; if('letterSpacing' in g) g.letterSpacing='3px';
      fitFont(g,t,W-60,40,CK_SCHRIFT); g.fillStyle=CK_TEXT; g.fillText(t,W/2,Hh/2+2);
      if('letterSpacing' in g) g.letterSpacing='0px'; });
    return; }
  const best=headArt(sh);
  /* 02.10. (Tom): kein "REGAL FREI" mehr - dass es leer ist, sieht man.
     Tisch und Gitterbox zeigen leer gar kein Schild, Regale einen
     schlichten Kopf ohne Schrift. */
  /* eigenes Schild (Taste L) geht vor die Warengruppe */
  if(sh.kopfG) sh.kopfG.visible=best!==null||!!sh.schild;
  const H=best!==null?HEADNAME[best].slice():['','#39405a']; if(sh.schild) H[0]=sh.schild;
  const bg=schildBg().c||H[1], fg=schildFg().c;
  redraw(sh.headTex,(g,W,Hh)=>{
    g.setTransform(1,0,0,1,0,0); g.scale(W/512,Hh/80); W=512; Hh=80;
    g.fillStyle=bg; g.fillRect(0,0,W,Hh);
    g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(0,0,W,10);
    g.fillStyle='rgba(0,0,0,.2)'; g.fillRect(0,Hh-8,W,8);
    g.fillStyle=fg; g.textAlign='center'; g.textBaseline='middle';
    if(H[0]){ fitFont(g,H[0],W-40,44,BUN); g.fillText(H[0],W/2,Hh/2+2); }
  });
}
/* Alle Kopfschilder neu drucken, nachdem die Farbe gewechselt wurde */
function repaintSchilder(){ shelves.forEach(updateHead); }
function updateLabel(lv){
  redraw(lv.tex,(g,W,H)=>{ g.setTransform(1,0,0,1,0,0); g.scale(W/300,H/34); W=300; H=34;
    g.fillStyle=lv.type?'#ffd23f':'#39405a'; g.fillRect(0,0,W,H); g.textBaseline='middle';
    if(lv.type){ g.fillStyle='#0e1226'; g.font=BAR(26); g.textAlign='left'; g.fillText(P[lv.type].short,8,H/2+1); g.font=BUN(22); g.textAlign='right'; g.fillText((S.prices[lv.type]||marketOf(lv.type)).toFixed(2).replace('.',',')+' €',W-8,H/2+2); }
    else { g.fillStyle='rgba(242,245,255,.75)'; g.font=BAR(24); g.textAlign='center'; g.fillText('leer',W/2,H/2+1); } });
}
function capOf(lv,t){ return layout(t||lv.type,lv.sh,lv).cap; }
/* Schildaufloesung (1 = Laden). Die Verpackungs-Vorfuehrung stellt 50
   Moebel auf einmal auf - mit halber Aufloesung brauchen ihre rund 250
   Schilder ein Viertel des Grafikspeichers (02.10., iPhone stuerzte ab). */
let REGAL_TEX=1;
/* Viele Stuecke auf einmal: Preis- und Kopfschild erst am Ende zeichnen.
   Vorher wurde fuer jedes einzelne Stueck neu gemalt und hochgeladen -
   bei 10 000 Stueck zwanzigtausendmal (Verpackungs-Vorfuehrung, 6 s). */
let _ohneSchild=false;
function addViele(lv,t,n){ _ohneSchild=true; let k=0; try{ while(k<n&&addToLevel(lv,t,1)) k++; } finally{ _ohneSchild=false; } updateLabel(lv); updateHead(lv.sh); return k; }
function leereFach(lv){ _ohneSchild=true; try{ while(lv.count>0) removeFromLevel(lv); } finally{ _ohneSchild=false; } }
function addToLevel(lv,t,q){
  if(lv.sh&&lv.sh.weg) return false;
  /* jedes eingeraeumte Stueck zaehlt fuer die Herausforderung */
  if(lv.type&&lv.type!==t) return false;
  if(!shelfAccepts(lv.sh,t)) return false;
  const L=layout(t,lv.sh,lv); if(lv.count>=L.cap) return false; if(pools[t].full()) return false;
  if(q===undefined) q=1;
  lv.q=lv.count?((lv.q||1)*lv.count+q)/(lv.count+1):q;
  lv.type=t; const jit=rand(-0.04,0.04);
  /* face mitgeben: sonst landete die Ware der zweiten Gondel- und
     Eckregalseite auf der ersten (02.10., Verpackungs-Vorfuehrung) */
  const h=pools[t].add(itemMatrix(lv.sh,{li:lv.li,type:t,face:lv.face},lv.count,jit)); h.jit=jit;
  lv.items.push(h); lv.count++; lvSicht(lv); if(!_ohneSchild){ updateLabel(lv); updateHead(lv.sh); } return true;
}
/* der Kunde nimmt vorn: das zuletzt eingeraeumte Stueck steht am weitesten vorn */
/* Verdeckte Ware (04.10.): eingeraeumt wird von hinten nach vorn, also
   sind die vorderen Reihen die zuletzt eingeraeumten. Alles hinter den
   zwei vordersten vollen Reihen sieht man nicht - es wird nicht
   gezeichnet (Reihe = Breite x Stapel). Ausgenommen: Tische und
   Gitterboxen (man sieht von oben hinein) und das oberste Fach, wenn es
   unter Augenhoehe offen ist. */
function lvSicht(lv){
  const it=lv.items; let weg=0;
  if(lv.type&&it.length){ const K=kindOf(lv.sh), L=layout(lv.type,lv.sh,lv), reihe=L.cols*L.st;
    const offen=lv.li===K.lv.length-1&&K.lv[lv.li]+fachHoehe(K,lv.li)<1.8;
    /* am Handy (lv.nah gesetzt) reicht die vorderste volle Reihe - nur bei
       nahen Faechern unter 0,6 m, in die man von oben hineinsieht, zwei */
    const halten=lv.nah===undefined?2:lv.nah&&K.lv[lv.li]<0.6?2:1;
    if(!K.frei&&!offen&&reihe>0) weg=Math.max(0,Math.floor(it.length/reihe)-halten)*reihe; }
  if(lv.imBlick===false) weg=it.length;
  let v=Math.min(lv.weg||0,it.length);
  while(v<weg){ const h=it[v++]; if(h&&h.pool) h.pool.verstecke(h); }
  while(v>weg){ const h=it[--v]; if(h&&h.pool) h.pool.zeige(h); }
  lv.weg=weg;
}
/* Am Handy (ohne Schatten) zusaetzlich: Faecher ausserhalb des Blickfelds
   oder weiter als 24 m weg werden nicht gezeichnet - je Bild ein
   Kugeltest je Fach, geaendert wird nur, wenn ein Fach rein- oder
   rausfaellt. Am Rechner bleibt alles stehen (Schatten von Ware ausserhalb
   des Bildes). */
const _blickF=typeof THREE.Frustum==='function'?new THREE.Frustum():null, _blickM=new THREE.Matrix4(), _blickS=typeof THREE.Sphere==='function'?new THREE.Sphere():null, _blickV=new THREE.Vector3();
/* 07.10. (Tom: auf Niedrig 10-11 Bilder/s): gemessen 9,8 Millionen Dreiecke je Bild in der Vorfuehrung -
   die Sichtregel gilt auch in Niedrig und Ultra Low (ohne Schattenkarte gibt es keinen Grund, Ware
   ausserhalb des Bildes zu zeichnen) */
function regaleImBlick(){
  if((HIQ&&!gfxNiedrig(GFX))||!_blickF||!_blickS) return;
  camera.updateMatrixWorld();
  _blickM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse); _blickF.setFromProjectionMatrix(_blickM);
  for(const sh of shelves) for(const lv of sh.levels){
    if(!lv.hit||!lv.items.length){ lv.imBlick=true; continue; }
    if(!lv.r){ const gp=lv.hit.geometry&&lv.hit.geometry.parameters; lv.r=gp?0.5*Math.hypot(gp.width,gp.height,gp.depth)+0.1:1.5; }
    lv.hit.getWorldPosition(_blickV); _blickS.set(_blickV,lv.r);
    const ab=_blickV.distanceTo(camera.position), da=ab<24+lv.r&&_blickF.intersectsSphere(_blickS), nah=ab<8+lv.r;
    if(da!==(lv.imBlick!==false)||nah!==(lv.nah!==false)){ lv.imBlick=da; lv.nah=nah; lvSicht(lv); } }
  /* Preisschild je Fach (eigenes Bild, eigener Zeichenaufruf) ab 9 m: die
     Schrift ist am Handy dort ohnehin nicht lesbar */
  for(const sh of shelves) for(const lv of sh.levels){
    if(lv.schildM===undefined){ lv.schildM=null; sh.g.traverse(o=>{ if(o.material&&o.material.map===lv.tex) lv.schildM=o; }); }
    if(!lv.schildM) continue; lv.schildM.getWorldPosition(_blickV);
    const zeig=_blickV.distanceTo(camera.position)<9;
    if(zeig!==(lv.schildM.layers.mask===1)) lv.schildM.layers.set(zeig?0:1); }
  /* Lagerregale mit Kartons (rund 40 Teile je Regal) weiter als 16 m weg:
     von den Kassen sah man sie durch die Wand mitgezeichnet. Ausgeblendet
     ueber die Ebene der Kamera (layers), nicht ueber visible - visible
     nutzen Kollision und Umbau. */
  /* Logistikhalle, ihre Tore und die LKW an den Rampen (35-60 m, hinter
     Waenden): gemessen rund 280 Zeichenaufrufe beim Blick von der Kasse.
     Ausgeblendet, solange die Kamera drinnen im Laden/Lager steht. */
  const drin=camera.position.x>-24&&typeof unterDach==='function'&&unterDach(camera.position.x,camera.position.y,camera.position.z);
  const fern=[]; if(typeof LOGI_G!=='undefined') fern.push(...LOGI_G, ...TOR_G); if(typeof wbays!=='undefined') wbays.forEach(b=>{ if(b&&b.g) fern.push(b.g); });
  for(const g of fern){ if(!g) continue; if(drin===!!g._fernAus&&(!drin||g._fernN===g.children.length)) continue;
    g._fernAus=drin; g._fernN=g.children.length; g.traverse(o=>o.layers.set(drin?1:0)); }
  for(const rk of racks){ if(!rk.g) continue; rk.g.getWorldPosition(_blickV);
    const an=_blickV.distanceTo(camera.position)<16;
    if(an===!rk._fern&&(an||rk._n===rk.g.children.length)) continue;
    rk._fern=!an; rk._n=rk.g.children.length; rk.g.traverse(o=>o.layers.set(an?0:1)); }
}
function removeFromLevel(lv){ const h=lv.items.pop(); if(h) h.pool.remove(h); lv.count--; lvSicht(lv); if(lv.count<=0){ lv.count=0; lv.type=null; lv.q=1; } if(!_ohneSchild){ updateLabel(lv); updateHead(lv.sh); } }
function allLevels(){ const a=[]; shelves.forEach(s=>s.levels.forEach(l=>a.push(l))); return a; }
function findLevel(t,from){ let best=null,bd=1e9; for(const l of allLevels()){ if(l.type===t&&l.count>0){ const d=from?from.distanceTo(shelfStand(l.sh,l)):0; if(d<bd){ bd=d; best=l; } } } return best; }
/* Größtes Fach, das dieses Produkt überhaupt aufnehmen kann */
function shelfCapOf(t){ let m=0; shelves.forEach(sh=>{ if(shelfAccepts(sh,t)) m=Math.max(m,layout(t,sh).cap); }); return m; }
/* Ins Kuehlregal kommt nur Gekuehltes; frische Lebensmittel (Fondue-
   und Raclette-Platten) nur ins Kuehlregal */
/* Kassenregal (05.10.): nimmt nur Kleinkram (P[t].kasse); was 'nur' dorthin
   gehoert (Sturmfeuerzeuge ...), nimmt kein anderes Regal */
function shelfAccepts(sh,t){ const K=kindOf(sh), p=P[t];
  if(K.kasse) return !!p.kasse&&!p.kuehlpflicht;
  if(p.kasse==='nur') return false;
  return K.cold?!!p.cold:!p.kuehlpflicht; }
/* Warum ein Produkt nicht in dieses Fach darf - fuer Meldung und Anzeige */
function regalNein(sh,t){
  if(shelfAccepts(sh,t)) return null;
  const K=kindOf(sh), p=P[t];
  if(K.kasse) return `${p.short}: Ins Kassenregal kommt nur Kleinkram wie Feuerzeuge und Knicklichter.`;
  if(p.kasse==='nur') return `${p.short} gehören ins Kassenregal an der Kasse.`;
  if(K.cold) return `${p.short}: Im Kühlschrank steht nur Gekühltes.`;
  return `${p.short} müssen in den Kühlschrank.`; }
/* Freie Faecher im Kassenregal, die die 'nur'-Ware noch braucht: dorthin
   kommt Kleinkram, der auch ins Regal darf, erst, wenn genug frei ist */
function kasseReserve(){
  const fehlt=ORDER.filter(t=>P[t]&&P[t].kasse==='nur'&&isUnlocked(t)&&!allLevels().some(l=>l.type===t&&kindOf(l.sh).kasse)).length;
  const leer=allLevels().filter(l=>!l.type&&kindOf(l.sh).kasse).length;
  return leer>fehlt; }
function emptyLevel(t){ if(!canShelf(t)) return null;
  let pool=allLevels().filter(l=>shelfAccepts(l.sh,t));
  if(P[t].kasse==='gern'&&!kasseReserve()) pool=pool.filter(l=>!kindOf(l.sh).kasse||l.type===t);
  /* Kühlware kommt bevorzugt in den Kühlschrank, Kleinkram ins Kassenregal */
  const pref=P[t].cold?pool.filter(l=>kindOf(l.sh).cold):P[t].kasse?pool.filter(l=>kindOf(l.sh).kasse):[];
  for(const list of [pref,pool]){
    for(const l of list) if(l.type===t&&l.count<capOf(l,t)) return l;
    /* nur Faecher, in die die Ware auch passt - sonst lief der Einraeumer
       immer wieder ein zu niedriges Fach an */
    for(const l of list) if(!l.type&&capOf(l,t)>0) return l;
  }
  return null; }

/* =========================================================
   Lager
   ========================================================= */
const racks=[], RLV=[0.14,0.94,1.74];
/* Regaltypen im Lager. Alles bleibt in Reichweite: das oberste Fach
   liegt so hoch, dass man es von unten noch anvisieren kann. */
const RACKKIND={
  standard:{id:'standard',name:'Lagerregal',     w:2.44,zo:0.30,lv:RLV,                          sp:[-0.8,0,0.8],          cost:WIRT.regal.lager.standard.grund,  step:WIRT.regal.lager.standard.jeWeiteres,  lvl:1, hoch:2.34},
  hoch:    {id:'hoch',    name:'Hochregal',      w:2.44,zo:0.30,lv:[0.14,1.02,1.90,2.78,3.66],   sp:[-0.8,0,0.8],          cost:WIRT.regal.lager.hoch.grund,step:WIRT.regal.lager.hoch.jeWeiteres,lvl:12,hoch:4.26},
  schwer:  {id:'schwer',  name:'Schwerlastregal',w:3.30,zo:0.42,lv:[0.16,1.26,2.36,3.46],        sp:[-1.2,-0.4,0.4,1.2],   cost:WIRT.regal.lager.schwer.grund,step:WIRT.regal.lager.schwer.jeWeiteres,lvl:18,hoch:4.20}
};
const RACKORDER=['standard','hoch','schwer'];
function rackKindOf(rk){ return RACKKIND[rk&&rk.kind]||RACKKIND.standard; }
function rackCount(k){ return racks.filter(r=>r.kind===k).length; }
/* Ein Stellplatz nimmt nur Regale, die unter die Decke passen */
function rackPasst(K,sl){ return K.hoch+0.5<=(sl.h||WH); }
/* pack: den Stellplatz belegt ab dieser Stufe die Palettierstation (05h) */
function racksOffen(){ return RACKS.filter(x=>(!x.zone||zoneOffen(x.zone))&&!(x.weg&&zoneOffen(x.weg))&&!(x.pack&&typeof packStufe==='function'&&packStufe()>=x.pack)); }
/* Grundriss eines Lagerregals: Traversen und Stuetzen samt Fussplatten */
function rackRect(K,x,z,ry){ const w=K.w/2+0.05, d=K.zo+0.09, q=Math.abs(Math.round(Math.sin(ry||0)));
  return q?{x0:x-d,x1:x+d,z0:z-w,z1:z+w}:{x0:x-w,x1:x+w,z0:z-d,z1:z+d}; }
/* 05.10.: ein Platz nimmt ein Lagerregal nur, wenn es nicht in eine Wand
   und nicht ins Nachbarregal ragt - das Schwerlastregal (3,3 m) ist
   breiter als der Abstand der Plaetze (3,1 m) und stand neben der
   Lagertuer einen halben Meter in der Mauer */
function rackStellPlatz(K,sl){ const ry=sl.ry||0, sb=wandSchub(rackRect(K,sl.x,sl.z,ry),ry,SCHUB_T,SCHUB_L);
  return sb?{x:sl.x+sb.dx,z:sl.z+sb.dz,ry}:null; }
function rackPlatzFrei(K,ohne){ return racksOffen().filter(sl=>{
  if(!rackPasst(K,sl)) return false;
  if(racks.some(r=>r!==ohne&&Math.abs(r.g.position.x-sl.x)<0.05&&Math.abs(r.g.position.z-sl.z)<0.05)) return false;
  const p=rackStellPlatz(K,sl); if(!p) return false;
  const a=rackRect(K,p.x,p.z,p.ry);
  return !racks.some(r=>{ if(r===ohne) return false; const b=rackRect(rackKindOf(r),r.g.position.x,r.g.position.z,r.g.rotation.y);
    return a.x0<b.x1-0.02&&a.x1>b.x0+0.02&&a.z0<b.z1-0.02&&a.z1>b.z0+0.02; }); }); }
/* Kein Regal macht einen Gang zu (05.10.): in der Lagererweiterung Nord
   stand die Reihe am Rolltor Ruecken an Ruecken mit der Nordreihe - voll
   besetzt war der Gang davor von nirgends mehr zu erreichen, und Einraeumer
   und Packer liefen auf dem Notweg geradeaus durch die Lagerwand. Ein
   neues Lagerregal kommt nur dorthin, wo danach jedes Lagerfach von der
   Lagertuer aus erreichbar bleibt. */
function rackErreichbar(g){
  const out=new Uint8Array(g.length), start=navNah(-8.9,-2.5); if(start<0) return out;
  const W=NAV.w, H=NAV.h; out[start]=1; const Q=[start]; let h=0;
  while(h<Q.length){ const k=Q[h++], i=k%W, r=(k-i)/W;
    for(const n of [i>0?k-1:-1,i<W-1?k+1:-1,r>0?k-W:-1,r<H-1?k+W:-1]) if(n>=0&&!g[n]&&!out[n]){ out[n]=1; Q.push(n); } }
  return out;
}
/* Haltepunkte vor allen Faechern: die vorhandenen Lagerregale und das neue */
function rackHaltepunkte(K,p){
  const pts=[], stand=(gx,gz,ry,KK)=>{ const sn=Math.sin(ry), cs=Math.cos(ry), lz=KK.zo+0.55; KK.sp.forEach(x=>pts.push([gx+x*cs+lz*sn, gz-x*sn+lz*cs])); };
  racks.forEach(rk=>stand(rk.g.position.x,rk.g.position.z,rk.g.rotation.y,rackKindOf(rk)));
  if(K) stand(p.x,p.z,p.ry||0,K);
  return pts;
}
/* Abgelehnt wird, wenn ein Haltepunkt, der ohne das neue Regal erreichbar
   ist, es mit ihm nicht mehr ist - Bereiche, die ohnehin abseits liegen
   (Logistikhalle hinter dem Tor), zaehlen nicht dagegen. Das Raster wird
   einmal gebaut, das neue Regal nur hineingezeichnet. */
function rackZugang(K,p){
  if(NAV.dirty) navBuild();
  const G=NAV.g, roh=rackHaltepunkte(K,p), vorher=rackErreichbar(G);
  const a=roh.map(([x,z])=>{ const n=navNah(x,z); return n>=0&&!!vorher[n]; });
  const r1v=rackR1Pack(G);
  const fw=K.w+0.16, fd=2*K.zo+0.14, q=Math.abs(Math.round(Math.sin(p.ry||0))), hw=(q?fd:fw)/2+0.3, hd=(q?fw:fd)/2+0.3;
  const g2=G.slice();
  const i0=Math.max(0,Math.floor((p.x-hw-NAV.x0)/NAV.s)), i1=Math.min(NAV.w-1,Math.floor((p.x+hw-NAV.x0)/NAV.s));
  const k0=Math.max(0,Math.floor((p.z-hd-NAV.z0)/NAV.s)), k1=Math.min(NAV.h-1,Math.floor((p.z+hd-NAV.z0)/NAV.s));
  for(let i=i0;i<=i1;i++) for(let k=k0;k<=k1;k++) g2[k*NAV.w+i]=1;
  NAV.g=g2;
  try{ const nach=rackErreichbar(g2);
    /* 07.10. (Tom, Vorfuehrung): zwischen Packstation und Rolltor 1 kam man nicht durch -
       die Regalreihe vor der Halle-Sued-Oeffnung stand die ganze Breite zu. Der Weg vom
       Rolltor zum Packplatz bleibt frei, solange er frei war. */
    if(r1v&&!rackR1Pack(g2)) return false;
    return roh.every(([x,z],i)=>{ if(!a[i]) return true; const m=navNah(x,z); return m>=0&&!!nach[m]; });
  } finally { NAV.g=G; }
}
/* Rolltor 1 (Innenseite) und der Platz vor dem ersten Packtisch */
const R1_INNEN={x:-19.0,z:-2.0};
function rackR1Pack(g){
  if(typeof packTisch==='undefined'||!packTisch||typeof zoneOffen!=='function'||!zoneOffen('packstation')||typeof vsHeim!=='function') return true;
  const start=navNah(R1_INNEN.x,R1_INNEN.z), h=vsHeim({pp:0}), ziel=navNah(h.x,h.z); if(start<0||ziel<0) return true;
  const W=NAV.w, H=NAV.h, out=new Uint8Array(g.length); out[start]=1; const Q=[start]; let k0=0;
  if(start===ziel) return true;
  while(k0<Q.length){ const k=Q[k0++], i=k%W, r=(k-i)/W;
    for(const n of [i>0?k-1:-1,i<W-1?k+1:-1,r>0?k-W:-1,r<H-1?k+W:-1]) if(n>=0&&!g[n]&&!out[n]){ if(n===ziel) return true; out[n]=1; Q.push(n); } }
  return false;
}
/* Alte Spielstaende: ein Lagerregal, das in der Wand steht, zieht auf
   den naechsten freien Platz, der es nimmt (sonst bleibt es stehen) */
function racksEntwirren(){
  for(const rk of racks.slice()){ const K=rackKindOf(rk), g=rk.g;
    if(wandSchub(rackRect(K,g.position.x,g.position.z,g.rotation.y),g.rotation.y,0,0)) continue;
    const frei=rackPlatzFrei(K,rk); if(!frei.length) continue;
    let best=frei[0], bd=1e9; for(const sl of frei){ const d=(sl.x-g.position.x)**2+(sl.z-g.position.z)**2; if(d<bd){ bd=d; best=sl; } }
    const p=rackStellPlatz(K,best); placeMovable(rk.mov,p.x,p.z,p.ry); rk.slot=best; }
}
function rackFreiFuer(kindId){ const K=RACKKIND[kindId]; return K?rackPlatzFrei(K).length>0:false; }
function rackAlleBelegt(kindId){
  const K=RACKKIND[kindId]; if(!K) return true;
  const passend=racksOffen().filter(sl=>rackPasst(K,sl));
  return passend.length>0&&rackPlatzFrei(K).length===0;
}
/* Was liegt gerade drin? Die drei haeufigsten Sorten auf das Schild. */
function drawRackSchild(rk){
  if(!rk||!rk.schildTex) return;
  const cnt={};
  rk.slots.forEach(sl=>{ if(sl.box&&P[sl.box.type]) cnt[sl.box.type]=(cnt[sl.box.type]||0)+sl.box.count; });
  const list=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]);
  redraw(rk.schildTex,(c,W,H)=>{
    c.fillStyle='#f4f2ea'; c.fillRect(0,0,W,H);
    c.fillStyle='#1b2340'; c.fillRect(0,0,W,54);
    c.textAlign='left'; c.textBaseline='middle';
    c.fillStyle=MAT.css('schildgold'); c.font=BUN(30); c.fillText('LAGERPLATZ '+((rk.nr||0)+1),16,29);
    if(!list.length){
      c.fillStyle='#8a9099'; c.font=BAR(40); c.textAlign='center';
      c.fillText('leer',W/2,150);
    } else {
      c.font=BAR(34);
      list.slice(0,3).forEach((t,k)=>{
        const y=96+k*52;
        c.fillStyle='#1b2340'; c.fillText(P[t].name,18,y);
        c.textAlign='right'; c.fillStyle='#3d7a52'; c.fillText(cnt[t]+' St.',W-18,y); c.textAlign='left';
        c.fillStyle='rgba(27,35,64,.14)'; c.fillRect(16,y+22,W-32,2);
      });
      if(list.length>3){ c.fillStyle='#8a9099'; c.font=BAR(26); c.fillText('+ '+(list.length-3)+' weitere',18,242); }
    }
    c.strokeStyle='#c9c4b8'; c.lineWidth=4; c.strokeRect(2,2,W-4,H-4);
  });
}
function refreshRackSchilder(){ racks.forEach(r=>{ if(r) drawRackSchild(r); }); }
function createRack(i,data){
  const kind=(data&&data.kind&&RACKKIND[data.kind])?data.kind:'standard';
  const K=RACKKIND[kind];
  /* Stellplatz: gespeicherte Koordinate, sonst der erste freie, in den
     dieser Regaltyp auch hineinpasst. */
  let slot=null;
  if(!(data&&data.x!==undefined)){ const frei=rackPlatzFrei(K); slot=frei[0]||racksOffen().filter(sl=>rackPasst(K,sl))[0]||RACKS[0]; }
  const r=data&&data.x!==undefined?data:slot, g=new THREE.Group();
  g.position.set(r.x,0,r.z); g.rotation.y=r.ry||0; scene.add(g);
  { const sb=wandSchub(rackRect(K,r.x,r.z,r.ry||0),r.ry||0,SCHUB_T,SCHUB_L); if(sb){ g.position.x+=sb.dx; g.position.z+=sb.dz; } }
  /* Gestell, Boeden, Stuetzen und Inhaltsschild: bk.regal (04z, art 'lager') */
  const rk={i,g,kind,slot:slot||null,slots:[]};
  const R=bk.regal({art:'lager',K,g});
  for(const f of R.faecher){ const sl={rk,li:f.li,si:f.si,x:f.x,y:f.y,box:null,hit:f.hit}; f.hit.userData={kind:'rslot',ref:sl}; rk.slots.push(sl); }
  rk.schildTex=R.schildTex;
  rk.mov=addMovable({kind:'rack',name:K.name,g,fw:K.w+0.16,fd:2*K.zo+0.14,ref:rk});
  rk.nr=racks.length; racks.push(rk); drawRackSchild(rk);
  if(data&&data.slots) data.slots.forEach((sd,k)=>{ if(sd&&P[sd.type]&&rk.slots[k]) putInSlot(rk.slots[k],sd.type,sd.count,sd.q,sd.kiste); });
  drawRackSchild(rk);
  return rk;
}
/* Einpacken (Tom, 29.09.): ein leeres Regal verschwindet wieder ins
   Paket. Alles, was noch darauf verweist (Einraeumer unterwegs,
   Kunden auf dem Weg), sieht es an sh.weg und laesst es links liegen. */
function moebelWeg(m){
  dropFootprint(m); const i=movables.indexOf(m); if(i>=0) movables.splice(i,1);
  scene.remove(m.g); if(typeof navDirty==='function') navDirty();
}
function removeShelf(sh){
  const i=shelves.indexOf(sh); if(i<0) return false;
  sh.weg=true; moebelWeg(sh.mov); shelves.splice(i,1);
  shelves.forEach((x,k)=>{ x.i=k; });
  return true;
}
function removeRack(rk){
  const i=racks.indexOf(rk); if(i<0) return false;
  rk.weg=true; moebelWeg(rk.mov); racks.splice(i,1);
  racks.forEach((x,k)=>{ x.nr=k; drawRackSchild(x); });
  return true;
}
function putInSlot(sl,type,count,q,kiste){ const m=bk.karton(type,{kiste}); m.position.set(sl.x,sl.y+0.2,0); m.rotation.y=rand(-0.05,0.05); sl.rk.g.add(m); sl.box={type,count,q:q||1,mesh:m}; if(kiste) sl.box.kiste=true; drawRackSchild(sl.rk); }
function findStoredBox(type){ for(const r of racks) for(const s of r.slots) if(s.box&&(!type||s.box.type===type)) return s; return null; }

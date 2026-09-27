/* Jedes Stadtmesh wird markiert: so laesst sich im Test pruefen, dass
   nichts davon in den begehbaren Bereich ragt. */
function stadtAdd(m){ m.userData.stadt=true; scene.add(m); return m; }
/* =========================================================
   Stadt hinter dem Laden.
   Gebaut in Ringen, wie es Spiele mit grosser Sichtweite machen:
   was nah ist, hat Fenster, Balkone und Dachaufbauten; was fern
   ist, wird zur Silhouette und laeuft farblich in den Himmel.
   Jeder Ring ist zu wenigen Meshes verschmolzen, damit die
   Bildrate nicht einbricht.
   ========================================================= */

/* Der Spielbereich bleibt frei: hier steht schon etwas */

/* Der Spielbereich bleibt frei: hier steht schon etwas */
const STADT_FREI=[
  {x0:-101,x1:42,z0:-54,z1:38},      /* Laden, Lager, Grosshandel, Hoefe, Testfeld */
  {x0:-76,x1:-16,z0:-68,z1:-54},     /* LKW-Hof der Logistikhalle          */
  {x0:42, x1:96,z0:-20,z1:18},       /* Logistikzentrum mit Vorplatz         */
  {x0:-260,x1:260,z0:8,z1:23}        /* die Fahrbahn bleibt frei             */
];
function stadtFrei(x,z,r){
  for(const f of STADT_FREI)
    if(x+r>f.x0&&x-r<f.x1&&z+r>f.z0&&z-r<f.z1) return false;
  return true;
}
/* Belegte Grundstuecke (26.09.): Wahrzeichen, Hochstrassen und jedes
   gebaute Haus. Vorher standen Quartier und Haeuserzeile teils
   ineinander, und Parkbaeume wuchsen aus Hauswaenden. */
const STADT_BELEGT=[
  {x0:-222,x1:-202,z0:-176,z1:176},{x0:208,x1:228,z0:-176,z1:176},   /* Hochstrassen */
  {x0:-132,x1:-104,z0:192,z1:220},                                    /* Fernsehturm  */
  {x0:84,x1:108,z0:136,z1:160},{x0:-76,x1:-52,z0:164,z1:188},         /* Kraene       */
  {x0:58,x1:90,z0:72,z1:100}                                          /* Kirche       */
];
function belegen(x,z,hw,hd){ STADT_BELEGT.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd}); }
function platzFrei(x,z,hw,hd){
  if(!stadtFrei(x,z,Math.max(hw,hd))) return false;
  for(const b of STADT_BELEGT) if(x+hw>b.x0&&x-hw<b.x1&&z+hd>b.z0&&z-hd<b.z1) return false;
  return true;
}

/* --------------------------------------------------------
   Fassaden der Stadt (Tom, 25.09.: "zu wenig Pixel, die Haeuser
   sollen richtig schoen werden - vor allem, wenn man am Testfeld
   das Feuerwerk beobachtet").
   Je Baustil ein hochaufgeloestes, kachelbares Modul aus 8 Fenster-
   achsen mal 8 Geschossen (128 Pixel je Achse und Geschoss). Jedes Haus
   wiederholt das Modul genau so oft, wie es Achsen und Geschosse hat,
   ein zufaelliger Versatz verteilt die Nachtlichter.
   26.09. (Tom: "Hochhaeuser und alles drum herum nochmal deutlich
   schoener und hochwertiger in der 3D"): zwei Stile mehr - Naturstein
   fuer Bank- und Verwaltungsbauten, Betonraster fuer die Buerohaeuser
   der Siebziger -, dazu je Stil eine Glanzkarte: Scheiben spiegeln den
   Himmel, Putz und Stein bleiben matt.
   -------------------------------------------------------- */
const FMOD=8;
const FASSADE={
  putz:   {achse:3.4,geschoss:3.0},
  klinker:{achse:3.2,geschoss:3.0},
  stein:  {achse:3.3,geschoss:3.5},
  band:   {achse:3.0,geschoss:3.6},
  raster: {achse:2.7,geschoss:3.5},
  glas:   {achse:2.6,geschoss:3.4}
};
/* Fensterausschnitt je Achse und Geschoss (Anteile x,y,b,h, y von oben):
   Tag-, Nacht- und Glanzbild muessen deckungsgleich sein */
const FENSTER={putz:[.27,.2,.46,.58],klinker:[.27,.2,.46,.58],stein:[.25,.17,.5,.62],raster:[.15,.16,.7,.6],band:[.04,.38,.92,.46],glas:[.05,.2,.9,.72]};
const BUERO={stein:1,band:1,raster:1,glas:1};
function fZufall(seed){ let x=seed*9301+49297; return ()=>{ x=(x*233280+49297)%2147483647; return (x%100000)/100000; }; }
function fassadeZeichnen(g,W,H,stil,nacht){
  const R=fZufall({putz:11,klinker:23,band:37,glas:53,stein:71,raster:89}[stil]), cw=W/FMOD, ch=H/FMOD;
  const rr=(a,b)=>a+R()*(b-a), [fx,fy,fw,fh]=FENSTER[stil];
  if(nacht){
    g.fillStyle='#000'; g.fillRect(0,0,W,H);
    const WARM=['#ffd79a','#ffc478','#f7e6c4','#ffb96b','#ffe3b0'], KALT=['#dfe8ff','#cfe0ff','#eef3ff','#fff4dc'];
    const buero=!!BUERO[stil];
    for(let r=0;r<FMOD;r++){
      /* Bueros: ganze Etagen brennen, auf dunklen Etagen arbeitet hier
         und da noch ein Team - Gruppen statt Salz und Pfeffer */
      const etageAn=R()<0.42, farbe=KALT[Math.floor(R()*4)];
      let an=R()<0.18;
      for(let c=0;c<FMOD;c++){
        const x=c*cw+cw*fx, y=r*ch+ch*fy, w=cw*fw, h=ch*fh;
        let lit;
        if(buero){ if(R()<0.24) an=!an; lit=etageAn?R()<0.86:an&&R()<0.8; }
        else lit=R()<0.42;
        if(!lit) continue;
        const tv=!buero&&R()<0.12;
        const f=tv?'#8fb4ff':buero?farbe:WARM[Math.floor(R()*5)];
        const hell=buero?(etageAn?rr(0.5,0.78):rr(0.32,0.58)):rr(0.55,1);
        g.globalAlpha=hell; g.fillStyle=f; g.fillRect(x,y,w,h);
        if(buero){
          /* Deckenleuchten als heller Streifen, unten Tische und Bruestung */
          g.globalAlpha=Math.min(1,hell+0.3); g.fillStyle='#fff'; g.fillRect(x,y+h*0.05,w,Math.max(2,h*0.05));
          g.globalAlpha=0.5; g.fillStyle='#000'; g.fillRect(x,y+h*0.74,w,h*0.26);
          g.globalAlpha=0.35; for(let k=1;k<4;k++) g.fillRect(x+w*k/4-1,y,2,h);
        } else if(R()<0.45){ g.globalAlpha=0.55; g.fillStyle='#000'; const k=rr(0.2,0.5); g.fillRect(x,y,w*k,h); }
        /* Streulicht */
        g.globalAlpha=0.12; g.fillStyle=f; g.fillRect(x-w*0.1,y-h*0.1,w*1.2,h*1.2);
        g.globalAlpha=1;
        /* Sprossen bleiben dunkel */
        g.fillStyle='rgba(0,0,0,.8)';
        if(stil==='putz'||stil==='klinker'||stil==='stein'){ g.fillRect(x+w/2-2,y,4,h); g.fillRect(x,y+h*0.32,w,3); }
      }
    }
    return;
  }
  const rauschen=(n,a,hell)=>{ for(let i=0;i<n;i++){ g.fillStyle=hell?`rgba(255,255,255,${R()*a})`:`rgba(0,0,0,${R()*a})`; g.fillRect(R()*W,R()*H,rr(1,4),rr(1,4)); } };
  const poly=(f,...p)=>{ g.fillStyle=f; g.beginPath(); g.moveTo(p[0],p[1]); for(let i=2;i<p.length;i+=2) g.lineTo(p[i],p[i+1]); g.closePath(); g.fill(); };
  /* tiefe Laibung: Licht von oben links, oben und links liegt Schatten */
  const laibung=(x,y,w,h,d,oben,links,rechts,unten)=>{
    poly(oben,x,y,x+w,y,x+w-d,y+d,x+d,y+d); poly(links,x,y,x+d,y+d,x+d,y+h-d,x,y+h);
    poly(rechts,x+w,y,x+w,y+h,x+w-d,y+h-d,x+w-d,y+d); poly(unten,x,y+h,x+d,y+h-d,x+w-d,y+h-d,x+w,y+h); };
  if(stil==='glas'){
    /* Vorhangfassade: dunkle Scheiben - den Himmel spiegelt die
       Umgebungskarte -, Bruestungspaneele, zwei Pfosten je Achse */
    g.fillStyle='#343f4b'; g.fillRect(0,0,W,H);
    for(let r=0;r<FMOD;r++) for(let c=0;c<FMOD;c++){
      const x=c*cw, y=r*ch+ch*fy, h=ch*fh, t=rr(-1,1);
      const gr=g.createLinearGradient(x,y,x+cw*0.5,y+h);
      gr.addColorStop(0,`rgb(${104+t*12|0},${126+t*12|0},${148+t*10|0})`); gr.addColorStop(1,`rgb(${50+t*8|0},${64+t*8|0},${82+t*8|0})`);
      g.fillStyle=gr; g.fillRect(x,y,cw,h);
      /* Jalousien: in manchen Scheiben heruntergelassen */
      if(R()<0.2){ g.fillStyle='rgba(196,200,204,.5)'; g.fillRect(x,y,cw,h*rr(0.2,0.85)); }
    }
    for(let r=0;r<FMOD;r++){ const y=r*ch;
      g.fillStyle='#2d3641'; g.fillRect(0,y,W,ch*fy); g.fillRect(0,y+ch*(fy+fh),W,ch*(1-fy-fh));
      g.fillStyle='#98a4b0'; g.fillRect(0,y+ch*fy-3,W,3); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(0,y+ch*fy,W,2); }
    for(let k=0;k<=FMOD*2;k++){ g.fillStyle='#b3bdc8'; g.fillRect(k*cw/2-(k%2?1.5:3),0,k%2?3:6,H); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(k*cw/2+3,0,2,H); }
    return;
  }
  if(stil==='band'){
    /* Bandfassade: durchlaufende Fensterbaender, dazwischen Beton */
    g.fillStyle='#e4e1da'; g.fillRect(0,0,W,H); rauschen(900,0.05);
    for(let r=0;r<FMOD;r++){ const y=r*ch+ch*0.36, h=ch*0.5;
      const gr=g.createLinearGradient(0,y,0,y+h); gr.addColorStop(0,'#5f7288'); gr.addColorStop(0.4,'#34414f'); gr.addColorStop(1,'#26303b');
      g.fillStyle=gr; g.fillRect(0,y,W,h);
      g.fillStyle='rgba(200,215,230,.18)'; g.fillRect(0,y,W,h*0.22);
      for(let k=0;k<=FMOD*2;k++){ g.fillStyle='#c9ccd0'; g.fillRect(k*cw/2-2,y,4,h); }
      g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,y+h,W,3);
      g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,y-3,W,2); }
    return;
  }
  if(stil==='stein'){
    /* Naturstein: Sandsteinplatten im Verband, tiefe Laibungen,
       Bronzefenster mit Oberlicht */
    g.fillStyle='#b3a487'; g.fillRect(0,0,W,H);
    const lh=ch/4, lw=cw/2;
    for(let y=0,k=0;y<H;y+=lh,k++) for(let x=(k%2)*lw/2-lw;x<W;x+=lw){ const t=rr(-9,9);
      g.fillStyle=`rgb(${214+t|0},${201+t|0},${174+t*0.8|0})`; g.fillRect(x+1.5,y+1.5,lw-3,lh-3); }
    rauschen(1800,0.05);
    for(let r=0;r<FMOD;r++) for(let c=0;c<FMOD;c++){
      const x=c*cw+cw*fx, y=r*ch+ch*fy, w=cw*fw, h=ch*fh, d=Math.round(w*0.11);
      g.fillStyle='#e6dcc6'; g.fillRect(x-7,y-7,w+14,h+14);
      laibung(x,y,w,h,d,'#5c5142','#7b6d57','#c9ba9c','#dccfb3');
      const gr=g.createLinearGradient(x,y,x+w,y+h); gr.addColorStop(0,'#71869c'); gr.addColorStop(0.5,'#3a4654'); gr.addColorStop(1,'#232a33');
      g.fillStyle=gr; g.fillRect(x+d,y+d,w-2*d,h-2*d);
      if(R()<0.3){ g.fillStyle='rgba(226,220,204,.5)'; g.fillRect(x+d,y+d,w-2*d,(h-2*d)*rr(0.2,0.55)); }
      g.fillStyle='#4b3d2d'; g.fillRect(x+w/2-2,y+d,4,h-2*d); g.fillRect(x+d,y+d+(h-2*d)*0.3,w-2*d,4);
      g.fillStyle='#f0e8d6'; g.fillRect(x-9,y+h+4,w+18,6); g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(x-9,y+h+10,w+18,3);
    }
    for(let r=0;r<FMOD;r++){ g.fillStyle='rgba(0,0,0,.1)'; g.fillRect(0,r*ch,W,4); g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(0,r*ch+4,W,2); }
    return;
  }
  if(stil==='raster'){
    /* Betonraster: Waschbeton-Fertigteile, jedes Fenster tief im Rahmen */
    g.fillStyle='#aaa69c'; g.fillRect(0,0,W,H); rauschen(2600,0.08); rauschen(2200,0.07,true);
    for(let r=0;r<FMOD;r++) for(let c=0;c<FMOD;c++){
      const x=c*cw+cw*fx, y=r*ch+ch*fy, w=cw*fw, h=ch*fh, d=Math.round(w*0.1);
      laibung(x,y,w,h,d,'#56534c','#716d65','#bdb8ad','#cbc6ba');
      const gr=g.createLinearGradient(x,y,x+w*0.6,y+h); gr.addColorStop(0,'#62768a'); gr.addColorStop(0.5,'#33404d'); gr.addColorStop(1,'#1d242c');
      g.fillStyle=gr; g.fillRect(x+d,y+d,w-2*d,h-2*d);
      /* Aussenjalousie halb heruntergelassen */
      if(R()<0.3){ g.fillStyle='rgba(170,172,168,.8)'; const k=rr(0.15,0.7); g.fillRect(x+d,y+d,w-2*d,(h-2*d)*k);
        g.fillStyle='rgba(0,0,0,.18)'; for(let yy=y+d;yy<y+d+(h-2*d)*k;yy+=5) g.fillRect(x+d,yy,w-2*d,1); }
      g.fillStyle='#2c3136'; g.fillRect(x+d,y+d+(h-2*d)*0.26,w-2*d,4);
      for(let k=1;k<3;k++) g.fillRect(x+d+(w-2*d)*k/3-2,y+d,4,h-2*d);
      g.fillStyle='rgba(0,0,0,.16)'; g.fillRect(x-cw*fx,y+h+2,cw,3);
    }
    return;
  }
  if(stil==='klinker'){
    /* Klinker: Steine im Verband, weisse Fenster mit Sturz */
    g.fillStyle='#b9b0a4'; g.fillRect(0,0,W,H);
    const sh=Math.max(4,Math.round(ch/14)), sw=sh*2.6;
    for(let y=0;y<H;y+=sh){ const off=(y/sh)%2?sw/2:0;
      for(let x=-sw;x<W;x+=sw){ const t=rr(-18,18); g.fillStyle=`rgb(${Math.round(168+t)},${Math.round(84+t*0.6)},${Math.round(62+t*0.5)})`; g.fillRect(x+off+1,y+1,sw-2,sh-2); } }
  } else {
    /* Putz: helle Wand mit Struktur und Regenspuren */
    g.fillStyle='#ebe6dc'; g.fillRect(0,0,W,H); rauschen(1400,0.05);
  }
  for(let r=0;r<FMOD;r++) for(let c=0;c<FMOD;c++){
    const x=c*cw+cw*fx, y=r*ch+ch*fy, w=cw*fw, h=ch*fh;
    if(stil==='putz'){ const s=g.createLinearGradient(0,y+h,0,y+h+ch*0.5); s.addColorStop(0,'rgba(60,60,64,.14)'); s.addColorStop(1,'rgba(60,60,64,0)'); g.fillStyle=s; g.fillRect(x+w*0.1,y+h,w*0.8,ch*0.45); }
    g.fillStyle=stil==='klinker'?'#8e4a34':'#d9d3c7'; g.fillRect(x-4,y-7,w+8,6);
    g.fillStyle='#f3f1ec'; g.fillRect(x-3,y-3,w+6,h+6);
    /* Laibung: das Fenster sitzt in der Wand, nicht auf ihr */
    laibung(x,y,w,h,Math.round(w*0.07),'rgba(0,0,0,.45)','rgba(0,0,0,.3)','rgba(255,255,255,.2)','rgba(255,255,255,.3)');
    const k=Math.round(w*0.07), gr=g.createLinearGradient(x,y,x+w,y+h); gr.addColorStop(0,'#7d93ab'); gr.addColorStop(0.45,'#3a4656'); gr.addColorStop(1,'#232b36');
    g.fillStyle=gr; g.fillRect(x+k,y+k,w-2*k,h-2*k);
    if(R()<0.35){ g.fillStyle='rgba(235,230,215,.55)'; g.fillRect(x+k,y+k,w-2*k,(h-2*k)*rr(0.2,0.6)); }
    g.fillStyle='#f3f1ec'; g.fillRect(x+w/2-2,y+k,4,h-2*k); g.fillRect(x+k,y+h*0.32,w-2*k,3);
    g.fillStyle='#cfc9bd'; g.fillRect(x-6,y+h+2,w+12,5); g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x-6,y+h+7,w+12,2);
  }
  /* Geschossdecken */
  for(let r=0;r<FMOD;r++){ g.fillStyle='rgba(0,0,0,.07)'; g.fillRect(0,r*ch,W,3); }
}
/* Glanzkarte: gruen = Rauheit, blau = Metall (so liest three die Kanaele) */
function glanzZeichnen(g,W,H,stil){
  const cw=W/FMOD, ch=H/FMOD, [fx,fy,fw,fh]=FENSTER[stil];
  g.fillStyle=stil==='glas'?'rgb(0,80,150)':'rgb(0,235,0)'; g.fillRect(0,0,W,H);
  g.fillStyle='rgb(0,22,165)';
  for(let r=0;r<FMOD;r++) for(let c=0;c<FMOD;c++) g.fillRect(c*cw+cw*fx+2,r*ch+ch*fy+2,cw*fw-4,ch*fh-4);
  if(stil==='glas'){ g.fillStyle='rgb(0,120,200)'; for(let k=0;k<=FMOD*2;k++) g.fillRect(k*cw/2-1.5,0,3,H); }
}
/* Umgebung fuer Scheiben und Glas (26.09.): Himmel mit Wolken, eine
   Stadtkante am Horizont, darunter Strasse. Ohne sie waren Glastuerme
   nur blau angemalte Kloetze. Nachts wird sie gedimmt (updateStadt). */
let _stadtEnv=null;
function stadtUmgebung(){
  if(_stadtEnv!==null) return _stadtEnv||null;
  _stadtEnv=false;
  try{
    if(!THREE.PMREMGenerator||typeof renderer==='undefined') return null;
    const t=tex(512,256,(g,W,H)=>{
      const gr=g.createLinearGradient(0,0,0,H*0.5); gr.addColorStop(0,'#4d70a0'); gr.addColorStop(0.62,'#9db8d4'); gr.addColorStop(1,'#e6edf3');
      g.fillStyle=gr; g.fillRect(0,0,W,H*0.5);
      for(let i=0;i<16;i++){ g.fillStyle=`rgba(255,255,255,${0.2+Math.random()*0.3})`; g.beginPath();
        g.ellipse(Math.random()*W,H*(0.1+Math.random()*0.3),30+Math.random()*80,4+Math.random()*9,0,0,Math.PI*2); g.fill(); }
      const bo=g.createLinearGradient(0,H*0.5,0,H); bo.addColorStop(0,'#555c66'); bo.addColorStop(1,'#26292d'); g.fillStyle=bo; g.fillRect(0,H*0.5,W,H*0.5);
      for(let x=0;x<W;){ const w=5+Math.random()*24, h=5+Math.random()*(Math.random()<0.2?54:22), c=78+Math.random()*52|0;
        g.fillStyle=`rgb(${c},${c+8},${c+18})`; g.fillRect(x,H*0.5-h,w,h); x+=w+Math.random()*4; }
    });
    t.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(renderer);
    _stadtEnv=pm.fromEquirectangular(t).texture; pm.dispose();
  }catch(e){ _stadtEnv=false; }
  return _stadtEnv||null;
}
const STADT_MATS={}, FASSADE_TEX={};
function fassadenMaterial(stil,fern){
  const key=stil+(fern?'f':'n');
  if(STADT_MATS[key]) return STADT_MATS[key];
  const px=COARSE?512:1024;
  /* Nah und fern teilen sich die Texturen. Nacht- und Glanzbild
     reichen in halber Aufloesung. */
  const mk=art=>{ const k=stil+art; if(FASSADE_TEX[k]) return FASSADE_TEX[k];
    const p=art==='T'?px:px/2;
    const t=tex(p,p,(g,W,H)=>art==='G'?glanzZeichnen(g,W,H,stil):fassadeZeichnen(g,W,H,stil,art==='N'),false);
    t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return FASSADE_TEX[k]=t; };
  /* Auf dem Handy nur das Glas mit Spiegelung, sonst jede Scheibe */
  const glanz=!COARSE||stil==='glas', env=glanz?stadtUmgebung():null;
  const m=new THREE.MeshStandardMaterial({
    vertexColors:true, map:mk('T'), emissive:LIN(0xffffff), emissiveMap:mk('N'), emissiveIntensity:0,
    roughness:glanz?1:(fern?1:0.9), metalness:glanz?1:0,
    roughnessMap:glanz?mk('G'):null, metalnessMap:glanz?mk('G'):null,
    envMap:env, envMapIntensity:stil==='glas'?1.25:0.9
  });
  m.userData={env:m.envMapIntensity};
  houseMats.push(m);
  STADT_MATS[key]=m;
  return m;
}
/* Box mit Fassade im richtigen Massstab (nur noch fuer den fernen Ring) */
function fassadenBox(w,h,d,stil){
  const S=FASSADE[stil], geo=new THREE.BoxGeometry(w,h,d), uv=geo.attributes.uv;
  const rows=Math.max(3,Math.round(h/S.geschoss)), oV=Math.floor(Math.random()*FMOD)/FMOD;
  const breite=[d,d,w,w,w,w];
  for(let f=0;f<6;f++){
    const oben=f===2||f===3, cols=Math.max(2,Math.round(breite[f]/S.achse)), oU=Math.floor(Math.random()*FMOD)/FMOD;
    for(let k=0;k<4;k++){ const i=f*4+k;
      if(oben){ uv.setXY(i,0.004,0.996); continue; }
      uv.setXY(i,oU+uv.getX(i)*cols/FMOD,oV+uv.getY(i)*rows/FMOD); } }
  uv.needsUpdate=true;
  return geo;
}

/* --------------------------------------------------------
   Grundrisse und Koerper (26.09.). Grundriss = Vieleck gegen den
   Uhrzeigersinn, Mitte im Ursprung. r: der Punkt liegt auf einer
   Rundung, b: die Kante zum naechsten Punkt ist ein Bogenstueck.
   -------------------------------------------------------- */
const P2=(x,z,r,b)=>({x,z,r:!!r,b:!!b});
function gRechteck(w,d){ return [P2(w/2,-d/2),P2(w/2,d/2),P2(-w/2,d/2),P2(-w/2,-d/2)]; }
function gFase(w,d,c){ return [P2(w/2,-d/2+c),P2(w/2,d/2-c),P2(w/2-c,d/2),P2(-w/2+c,d/2),P2(-w/2,d/2-c),P2(-w/2,-d/2+c),P2(-w/2+c,-d/2),P2(w/2-c,-d/2)]; }
function gRund(w,d,r,seg){
  const p=[], E=[[1,1],[-1,1],[-1,-1],[1,-1]];
  for(let k=0;k<4;k++){ const cx=E[k][0]*(w/2-r), cz=E[k][1]*(d/2-r);
    for(let j=0;j<=seg;j++){ const a=(k+j/seg)*Math.PI/2; p.push(P2(cx+Math.cos(a)*r,cz+Math.sin(a)*r,true,j<seg)); } }
  return p;
}
function gOval(w,d,n){ const p=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; p.push(P2(Math.cos(a)*w/2,Math.sin(a)*d/2,true,true)); } return p; }
/* um o Meter nach aussen (o<0: nach innen) */
function weiter(pts,w,d,o){ const sx=(w+2*o)/w, sz=(d+2*o)/d; return pts.map(p=>P2(p.x*sx,p.z*sz,p.r,p.b)); }
/* Vieleck senkrecht hochgezogen: u laeuft um das Haus herum, v zaehlt
   Geschosse - so sitzen die Fenster auch an Fasen und Rundungen im
   Massstab (jeder Bogen bekommt ganze Achsen). Ohne Stil: glatte
   Flaechen fuer Gesimse und Attiken, o.u/o.v fuer die Lobby-Textur. */
function prisma(pts,h,stil,o){
  o=o||{};
  const S=stil?FASSADE[stil]:null, n=pts.length, pos=[], nor=[], uv=[];
  const rows=S?Math.max(1,Math.round(h/S.geschoss)):0;
  const v0=S?Math.floor(Math.random()*FMOD)/FMOD:(o.v?o.v[0]:0), v1=S?v0+rows/FMOD:(o.v?o.v[1]:0);
  const kn=[];
  for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n], dx=b.x-a.x, dz=b.z-a.z, l=Math.hypot(dx,dz)||1; kn.push([dz/l,-dx/l,l]); }
  const du=new Array(n).fill(0);
  if(S){
    const f=pts.findIndex(p=>!p.b), s=f<0?0:f+1; let lauf=[];
    const flush=()=>{ if(!lauf.length) return; const L=lauf.reduce((a,i)=>a+kn[i][2],0), c=Math.max(1,Math.round(L/S.achse)); lauf.forEach(i=>du[i]=c*kn[i][2]/L/FMOD); lauf=[]; };
    for(let k=0;k<n;k++){ const i=(s+k)%n; if(pts[i].b) lauf.push(i); else { flush(); du[i]=Math.max(1,Math.round(kn[i][2]/S.achse))/FMOD; } }
    flush();
  } else if(o.u) for(let i=0;i<n;i++) du[i]=kn[i][2]/o.u;
  const mit=(p,q)=>{ const x=p[0]+q[0], z=p[1]+q[1], l=Math.hypot(x,z)||1; return [x/l,z/l]; };
  const pu=(x,y,z,nx,ny,nz,u,v)=>{ pos.push(x,y,z); nor.push(nx,ny,nz); uv.push(u,v); };
  let u=S?Math.floor(Math.random()*FMOD)/FMOD:(o.u0||0);
  for(let i=0;i<n;i++){
    const a=pts[i], b=pts[(i+1)%n], k=kn[i];
    const na=a.b&&a.r?mit(kn[(i-1+n)%n],k):k, nb=a.b&&b.r?mit(k,kn[(i+1)%n]):k, u2=u+du[i];
    pu(a.x,0,a.z,na[0],0,na[1],u,v0); pu(b.x,h,b.z,nb[0],0,nb[1],u2,v1); pu(b.x,0,b.z,nb[0],0,nb[1],u2,v0);
    pu(a.x,0,a.z,na[0],0,na[1],u,v0); pu(a.x,h,a.z,na[0],0,na[1],u,v1); pu(b.x,h,b.z,nb[0],0,nb[1],u2,v1);
    u=u2;
  }
  let cx=0,cz=0; pts.forEach(p=>{ cx+=p.x; cz+=p.z; }); cx/=n; cz/=n;
  const cu=S?0.004:0, cv=S?0.996:0;
  for(let i=0;i<n;i++){ const a=pts[i], b=pts[(i+1)%n];
    if(o.deckel!==false){ pu(cx,h,cz,0,1,0,cu,cv); pu(b.x,h,b.z,0,1,0,cu,cv); pu(a.x,h,a.z,0,1,0,cu,cv); }
    if(o.boden){ pu(cx,0,cz,0,-1,0,cu,cv); pu(a.x,0,a.z,0,-1,0,cu,cv); pu(b.x,0,b.z,0,-1,0,cu,cv); } }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  return g;
}
/* Dreiecke mit Flaechennormale; hint zeigt grob nach aussen */
function dreiecke(liste){
  const pos=[], nor=[], uv=[];
  for(const [a,b,c,ua,ub,uc,hint] of liste){
    const ax=b[0]-a[0], ay=b[1]-a[1], az=b[2]-a[2], bx=c[0]-a[0], by=c[1]-a[1], bz=c[2]-a[2];
    let nx=ay*bz-az*by, ny=az*bx-ax*bz, nz=ax*by-ay*bx; const l=Math.hypot(nx,ny,nz)||1; nx/=l; ny/=l; nz/=l;
    let p=[a,b,c], q=[ua,ub,uc];
    if(nx*hint[0]+ny*hint[1]+nz*hint[2]<0){ p=[a,c,b]; q=[ua,uc,ub]; nx=-nx; ny=-ny; nz=-nz; }
    for(let k=0;k<3;k++){ pos.push(p[k][0],p[k][1],p[k][2]); nor.push(nx,ny,nz); uv.push(q[k][0],q[k][1]); }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  return g;
}
/* Dach als Profil (z,y von Traufe zu Traufe), entlang x gezogen.
   Die Giebelflaechen (inn, etwas kleiner, liegen unter der Dachhaut)
   gehoeren zur Fassade und kommen getrennt zurueck. */
function dachGeo(L,prof,inn){
  const L2=L/2+0.3, T=[], s=[0];
  for(let i=1;i<prof.length;i++) s.push(s[i-1]+Math.hypot(prof[i][0]-prof[i-1][0],prof[i][1]-prof[i-1][1]));
  const S=s[s.length-1], v=i=>Math.min(s[i],S-s[i])/2;
  for(let i=0;i<prof.length-1;i++){
    const [z1,y1]=prof[i], [z2,y2]=prof[i+1];
    const A=[-L2,y1,z1], B=[L2,y1,z1], C=[L2,y2,z2], D=[-L2,y2,z2];
    const ua=[-L2/2,v(i)], ub=[L2/2,v(i)], uc=[L2/2,v(i+1)], ud=[-L2/2,v(i+1)];
    T.push([A,B,C,ua,ub,uc,[0,1,0]],[A,C,D,ua,uc,ud,[0,1,0]]);
  }
  const G=[], w=[0.004,0.996];
  let mz=0,my=0; inn.forEach(p=>{ mz+=p[0]; my+=p[1]; }); mz/=inn.length; my/=inn.length;
  for(const sx of [-1,1]) for(let i=0;i<inn.length;i++){ const a=inn[i], b=inn[(i+1)%inn.length], x=sx*L/2;
    G.push([[x,my,mz],[x,a[1],a[0]],[x,b[1],b[0]],w,w,w,[sx,0,0]]); }
  return {dach:dreiecke(T),giebel:dreiecke(G)};
}
function pyramide(w,d,h){
  const e=[[w/2,0,-d/2],[w/2,0,d/2],[-w/2,0,d/2],[-w/2,0,-d/2]], T=[], sp=[0,h,0];
  for(let i=0;i<4;i++){ const a=e[i], b=e[(i+1)%4]; T.push([a,b,sp,[0,0],[1,0],[0.5,1],[(a[0]+b[0])/2,0.3,(a[2]+b[2])/2]]); }
  return dreiecke(T);
}

/* --------------------------------------------------------
   Sammelbecken: alles, was sich ein Material teilt, wird am Ende zu
   einem Mesh verschmolzen - egal aus welchem Ring es kommt.
   -------------------------------------------------------- */
const ST_KANTEN=[], ST_DEKO=[], ST_DACH=[], ST_LOBBY=[], ST_KRONE=[], ST_HELI=[], ST_LICHTER=[];
function sammler(fern){ const f={}; for(const s in FASSADE) f[s]=[]; return {fern,fass:f,boxen:0}; }
function sammlerBauen(S){
  for(const s in S.fass){ if(!S.fass[s].length) continue;
    SKYLINE_INFO.stile.add(s);
    stadtAdd(new THREE.Mesh(merge(S.fass[s]),fassadenMaterial(s,S.fern))); S.fass[s].length=0; }
  return S.boxen;
}
/* Flugwarnlichter auf den hohen Tuermen - bei Nacht und Feuerwerk
   geben sie der Skyline Tiefe */
const WARNLICHT=[];
/* fuer den Test: abgesetzte Dachgeschosse und Stile in der Skyline */
const SKYLINE_INFO={stufen:0,stile:new Set()};
/* Kronen: angestrahlte Dachabschluesse der Tuerme */
const KRONEN=[];
let _lobbyM=null, _kroneM=null, _dachM=null, lichtPts=null;
/* Erdgeschoss: oben in der Textur eine Lobby, unten Ladenzeilen.
   Tagsueber dunkles Glas mit Spiegelung, nachts warmes Licht. */
function lobbyMaterial(){
  if(_lobbyM) return _lobbyM;
  const zeichne=(g,W,H,nacht)=>{
    const R=fZufall(97), Hh=H/2;
    g.fillStyle=nacht?'#000':'#1c2228'; g.fillRect(0,0,W,H);
    /* Lobby: vier Felder zu 2,5 m, Tuer im zweiten */
    if(nacht){ const gr=g.createLinearGradient(0,0,0,Hh); gr.addColorStop(0,'#fff1d2'); gr.addColorStop(0.5,'#e8c690'); gr.addColorStop(1,'#8a6a42'); g.fillStyle=gr; g.fillRect(0,0,W,Hh);
      g.fillStyle='#fff'; for(let x=16;x<W;x+=32) g.fillRect(x,Hh*0.1,6,4);
      g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(W*0.58,Hh*0.62,W*0.22,Hh*0.3); }
    else { const gr=g.createLinearGradient(0,0,W,Hh); gr.addColorStop(0,'#3a4550'); gr.addColorStop(0.5,'#232a31'); gr.addColorStop(1,'#303a44'); g.fillStyle=gr; g.fillRect(0,0,W,Hh);
      g.fillStyle='rgba(220,210,190,.2)'; g.fillRect(0,Hh*0.08,W,Hh*0.05); g.fillStyle='rgba(150,140,120,.25)'; g.fillRect(W*0.58,Hh*0.62,W*0.22,Hh*0.3);
      g.fillStyle='rgba(200,220,240,.12)'; for(let i=0;i<5;i++){ const x=(i*0.23+0.07)*W; g.beginPath(); g.moveTo(x,0); g.lineTo(x+40,0); g.lineTo(x-30,Hh); g.lineTo(x-70,Hh); g.fill(); } }
    g.fillStyle=nacht?'#000':'#8e969e';
    for(let k=0;k<=4;k++) g.fillRect(k*W/4-5,0,10,Hh);
    g.fillRect(0,0,W,12); g.fillRect(0,Hh*0.8,W,6); g.fillRect(0,Hh-10,W,10);
    g.fillRect(W*0.25+W*0.125-3,Hh*0.8,6,Hh*0.2);
    /* Laeden: je 10 m zwei Schaufenster mit Blende, dazwischen Pfeiler */
    const y0=Hh, BL=['#1f4a3a','#5a1f24','#1d2f52','#2b2b2e','#6a4a1c','#3d2450'];
    g.fillStyle=nacht?'#000':'#cfc6b4'; g.fillRect(0,y0,W,Hh);
    for(let j=0;j<2;j++){ const bx=W*(0.05+0.5*j), bw=W*0.4, f=BL[Math.floor(R()*BL.length)], warm=R()<0.6, schild=R()<0.6;
      g.fillStyle=nacht&&!schild?'#000':f; g.globalAlpha=nacht?0.9:1;
      g.fillRect(bx,y0+Hh*0.08,bw,Hh*0.14); g.globalAlpha=1;
      if(nacht){ const gr=g.createLinearGradient(0,y0+Hh*0.26,0,y0+Hh*0.94); gr.addColorStop(0,warm?'#fff0cf':'#eef4ff'); gr.addColorStop(1,warm?'#c9a06a':'#9fb2c8'); g.fillStyle=gr; }
      else g.fillStyle='#232a31';
      g.fillRect(bx,y0+Hh*0.26,bw,Hh*0.68);
      /* Ware im Fenster */
      for(let i=0;i<7;i++){ g.fillStyle=nacht?'rgba(0,0,0,.35)':`rgba(${150+R()*90|0},${120+R()*90|0},${100+R()*90|0},.35)`;
        g.fillRect(bx+R()*bw*0.85,y0+Hh*(0.6+R()*0.2),bw*0.1,Hh*0.14); }
      if(!nacht){ g.fillStyle='rgba(210,225,240,.14)'; g.fillRect(bx,y0+Hh*0.26,bw,Hh*0.2); }
      g.fillStyle=nacht?'#000':'#39424b'; g.fillRect(bx,y0+Hh*0.26,bw,5); g.fillRect(bx+bw/2-3,y0+Hh*0.26,6,Hh*0.68); }
  };
  const tT=tex(512,512,(g,W,H)=>zeichne(g,W,H,false),false), tN=tex(512,512,(g,W,H)=>zeichne(g,W,H,true),false);
  tT.wrapS=tN.wrapS=THREE.RepeatWrapping;
  _lobbyM=new THREE.MeshStandardMaterial({map:tT,emissive:LIN(0xffffff),emissiveMap:tN,emissiveIntensity:0,roughness:0.3,metalness:0.2,
    envMap:stadtUmgebung(),envMapIntensity:0.8});
  _lobbyM.userData={env:0.8};
  houseMats.push(_lobbyM);
  return _lobbyM;
}
/* Kronen und Lamellen: nachts von unten angestrahlt, oben verlaeuft das Licht */
function kroneMaterial(){
  if(_kroneM) return _kroneM;
  const grad=tex(8,128,(g,W,H)=>{ const gr=g.createLinearGradient(0,H,0,0); gr.addColorStop(0,'#fff'); gr.addColorStop(0.5,'#8a8a8a'); gr.addColorStop(1,'#141414'); g.fillStyle=gr; g.fillRect(0,0,W,H); });
  _kroneM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.45,metalness:0.4,emissive:LIN(0xffe9c8),emissiveMap:grad,emissiveIntensity:0,
    envMap:stadtUmgebung(),envMapIntensity:0.7});
  _kroneM.userData={env:0.7};
  return _kroneM;
}
/* Dachziegel: helles Muster, die Farbe kommt je Haus ueber die Vertexfarbe */
function dachMaterial(){
  if(_dachM) return _dachM;
  const t=tex(256,256,(g,W,H)=>{
    g.fillStyle='#bdbdbd'; g.fillRect(0,0,W,H);
    const rh=H/8, tw=W/8;
    for(let r=0;r<8;r++){ const off=(r%2)*tw/2, y=r*rh;
      for(let c=-1;c<9;c++){ const x=c*tw+off, t=Math.random()*34-17;
        const gr=g.createLinearGradient(0,y,0,y+rh); gr.addColorStop(0,`rgb(${214+t|0},${214+t|0},${214+t|0})`); gr.addColorStop(1,`rgb(${160+t|0},${160+t|0},${160+t|0})`);
        g.fillStyle=gr; g.fillRect(x+1,y,tw-2,rh-2); }
      g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(0,y+rh-3,W,3); }
  },false);
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8;
  _dachM=new THREE.MeshStandardMaterial({vertexColors:true,map:t,roughness:0.82,side:THREE.DoubleSide});
  return _dachM;
}
function stadtTeileBauen(){
  const vc=r=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:r});
  if(ST_KANTEN.length) stadtAdd(new THREE.Mesh(merge(ST_KANTEN),vc(0.88)));
  if(ST_DEKO.length) stadtAdd(new THREE.Mesh(merge(ST_DEKO),vc(0.9)));
  if(ST_DACH.length) stadtAdd(new THREE.Mesh(merge(ST_DACH),dachMaterial()));
  if(ST_LOBBY.length) stadtAdd(new THREE.Mesh(merge(ST_LOBBY),lobbyMaterial()));
  if(ST_KRONE.length) stadtAdd(new THREE.Mesh(merge(ST_KRONE),kroneMaterial()));
  if(ST_HELI.length){
    const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#3d4247'; g.fillRect(0,0,W,H);
      g.strokeStyle='#e8e8e2'; g.lineWidth=7; g.beginPath(); g.arc(W/2,H/2,W*0.4,0,Math.PI*2); g.stroke();
      g.fillStyle='#f2c230'; g.fillRect(W*0.34,H*0.3,W*0.07,H*0.4); g.fillRect(W*0.59,H*0.3,W*0.07,H*0.4); g.fillRect(W*0.34,H*0.47,W*0.32,H*0.07); });
    stadtAdd(new THREE.Mesh(merge(ST_HELI),new THREE.MeshStandardMaterial({map:t,roughness:0.9})));
  }
  if(ST_LICHTER.length){
    /* Flugwarnlichter und Dachleuchten: ein einziger Zeichenaufruf */
    const n=ST_LICHTER.length, pos=new Float32Array(n*3), col=new Float32Array(n*3);
    ST_LICHTER.forEach((l,i)=>{ pos.set(l.slice(0,3),i*3); col.set(l.slice(3,6),i*3); });
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3)); g.setAttribute('color',new THREE.BufferAttribute(col,3));
    lichtPts=new THREE.Points(g,new THREE.PointsMaterial({size:2.6,map:dotTex,vertexColors:true,transparent:true,opacity:0,
      depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
    lichtPts.frustumCulled=false; scene.add(lichtPts);
  }
  [ST_KANTEN,ST_DEKO,ST_DACH,ST_LOBBY,ST_KRONE,ST_HELI,ST_LICHTER].forEach(a=>a.length=0);
}
const ROT=[1,0.12,0.06], GRUEN=[0.3,1,0.45], WEISS=[1,0.93,0.8];

/* Farbtoene je Stil (Vertexfarbe mal Textur) - deutsche Putzfarben,
   Klinker in mehreren Braennungen, Glas mal blau, mal gruenlich */
const TON={
  putz:[0xd8cca9,0xd0bb92,0xd2b29d,0xc2c5be,0xbac6b0,0xb5bfca,0xdad6cd,0xcda783,0xc9b9c0],
  klinker:[0xd8d8d8,0xcabfb6,0xbaaaa2,0xa99686],
  stein:[0xdcd8d0,0xd2c6b0,0xc4bcb0],
  band:[0xd2d2ce,0xc3c5c7,0xbcb8b0],
  raster:[0xd0ccc3,0xc4bfb4,0xbabcbe],
  glas:[0xc0ccd6,0xafbfca,0xb8c2bc,0xb0b6c4,0xc6ccd2]
};
function stadtTon(stil,r){ const a=TON[stil]; const c=new THREE.Color(a[Math.floor(Math.random()*a.length)]);
  return c.lerp(new THREE.Color(0xb9cbdd),clamp((r-60)/330,0,1)*0.55).getHex(); }
const DACHTON=[0x9c4a34,0xa85a3e,0x8a4230,0x55585e,0x4a4c52,0x70463a,0x5d6068];
const GESIMS=0xd6cfc0;

/* --------------------------------------------------------
   Stadthaus: Laden- oder Sockelgeschoss, Fassade, Gesimse, Dach mit
   Gauben und Schornsteinen. Achse X: der First laeuft entlang x.
   -------------------------------------------------------- */
function haus(S,cx,cz,w,d,h,stil,achseX,o){
  const L=achseX?w:d, B=achseX?d:w, hex=o.hex, gs=o.gesims||GESIMS, EG=o.eg||0;
  belegen(cx,cz,w/2,d/2); S.boxen++;
  if(EG){
    ST_LOBBY.push({geo:prisma(gRechteck(w-0.5,d-0.5),EG,null,{u:10,u0:Math.random(),v:o.laden?[0,0.5]:[0.5,1],deckel:false}),m:tm(cx,0,cz)});
    ST_KANTEN.push({geo:new THREE.BoxGeometry(w+0.24,0.42,d+0.24),m:tm(cx,EG,cz),color:gs});
  }
  S.fass[stil].push({geo:prisma(gRechteck(w,d),h-EG,stil),m:tm(cx,EG,cz),color:hex});
  if(o.dach==='flach'){
    ST_KANTEN.push({geo:new THREE.BoxGeometry(w+0.3,0.9,d+0.3),m:tm(cx,h+0.25,cz),color:gs});
    const sw=w-2.4, sd=d-3;
    if(o.staffel&&sw>4&&sd>4){
      /* Staffelgeschoss, zur Strasse zurueckgesetzt */
      S.fass[stil].push({geo:prisma(gRechteck(sw,sd),3.0,stil),m:tm(cx,h+0.1,cz),color:hex});
      ST_KANTEN.push({geo:new THREE.BoxGeometry(sw+0.3,0.6,sd+0.3),m:tm(cx,h+3.2,cz),color:gs});
    } else for(let a=0;a<2;a++) ST_DEKO.push({geo:new THREE.BoxGeometry(rand(1.2,2.4),rand(0.8,1.6),rand(1.2,2)),m:tm(cx+rand(-w*0.25,w*0.25),h+1,cz+rand(-d*0.25,d*0.25)),color:0x9aa2ac});
    return;
  }
  ST_KANTEN.push({geo:new THREE.BoxGeometry(w+0.36,0.44,d+0.36),m:tm(cx,h,cz),color:gs});
  const Wm=tm(cx,h+0.2,cz,0,achseX?0:Math.PI/2,0), b=B/2;
  let prof, inn, rh, sl;
  if(o.dach==='mansard'){ rh=4.1; sl=0;
    prof=[[b+0.4,-0.25],[b-1.1,2.9],[0,rh],[-(b-1.1),2.9],[-b-0.4,-0.25]];
    inn=[[b,-0.2],[b-1.25,2.72],[0,rh-0.18],[-(b-1.25),2.72],[-b,-0.2]]; }
  else { rh=Math.min(5.5,b*rand(0.62,0.95)); sl=(rh+0.32)/(b+0.5);
    prof=[[b+0.5,-0.32],[0,rh],[-b-0.5,-0.32]]; inn=[[b,-0.2],[0,rh-0.16],[-b,-0.2]]; }
  const dg=dachGeo(L,prof,inn);
  ST_DACH.push({geo:dg.dach,m:Wm,color:o.dachHex});
  S.fass[stil].push({geo:dg.giebel,m:Wm,color:hex});
  const lok=(x,y,z,rx,sx,sy,sz)=>Wm.clone().multiply(tm(x,y,z,rx||0,0,0,sx,sy,sz));
  /* Schleppgauben auf der Strassenseite, manchmal auch hinten */
  if(sl&&o.gauben&&rh>2.6){
    const n=Math.max(1,Math.floor((L-1.5)/3.8)), yr=z=>-0.32+(b+0.5-z)*sl;
    for(const sz of [1,-1]){ if(sz<0&&Math.random()<0.5) continue;
      for(let k=0;k<n;k++){ const gx=-L/2+(k+0.5)*L/n, zf=b-0.9, yb=yr(zf)-0.2;
        ST_KANTEN.push({geo:new THREE.BoxGeometry(1.5,1.45,1.8),m:lok(gx,yb+0.72,sz*(zf-0.9)),color:0xe8e4dc});
        ST_KANTEN.push({geo:new THREE.BoxGeometry(1.0,0.85,0.06),m:lok(gx,yb+0.74,sz*(zf+0.02)),color:0x2a323c});
        ST_DACH.push({geo:new THREE.BoxGeometry(1.8,0.14,2.3),m:lok(gx,yb+1.52,sz*(zf-0.9),sz*0.16),color:o.dachHex}); } }
  }
  /* Schornsteine am First */
  if(Math.random()<0.75){ const hc=rand(1.2,2.2), zz=rand(-0.4,0.4)*b;
    const y=sl?rh-Math.abs(zz)*sl:rh-0.2;
    ST_DEKO.push({geo:new THREE.BoxGeometry(0.62,hc,0.75),m:lok(rand(-L*0.3,L*0.3),y+hc/2-0.3,zz),color:0x7a4a3c}); }
}

/* --------------------------------------------------------
   Hochhaus: Grundform (eckig, gefast, gerundet, oval), Lobby oder
   Sockelbau, bis zu drei Staffeln mit Ruecksprung, Relief (Lisenen,
   Bruestungsbaender) und eine Krone. Tom, 26.09.: Tuerme mit
   Pfosten-Riegel, Naturstein, Beton, Klinker, Dachaufbauten und
   glaubwuerdigem Nachtlicht statt glatter Kloetze.
   -------------------------------------------------------- */
function lamellen(P,x,y,z,hk,abst){
  for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], dx=b.x-a.x, dz=b.z-a.z, l=Math.hypot(dx,dz);
    const k=Math.max(1,Math.round(l/abst)), nx=dz/l, nz=-dx/l, ry=Math.atan2(-dz,dx);
    for(let j=0;j<k;j++){ const t=(j+0.5)/k;
      ST_KRONE.push({geo:new THREE.BoxGeometry(0.22,hk,0.7),m:tm(x+a.x+dx*t+nx*0.12,y+hk/2,z+a.z+dz*t+nz*0.12,0,ry,0),color:0xd8dee4}); } }
}
function relief(stil,form,P,ww,dd,th,x,y,z){
  const S=FASSADE[stil], rows=Math.max(1,Math.round(th/S.geschoss)), fh=th/rows;
  if(stil==='band'&&rows<40){
    /* Bruestungsbaender stehen vor: jedes Geschoss wirft einen Schatten */
    const ring=weiter(P,ww,dd,0.3);
    for(let k=1;k<rows;k++) ST_KANTEN.push({geo:prisma(ring,0.34,null,{boden:true}),m:tm(x,y+k*fh-fh*0.1,z),color:0xe4e1da});
    return;
  }
  if(form!=='eckig'||stil==='putz') return;
  /* Lisenen: senkrechte Pfeiler auf den Achsgrenzen */
  const jede=stil==='glas'?2:1, farbe=stil==='glas'?0xc6ced6:stil==='stein'?0xe0d6c0:stil==='klinker'?0x9a5a44:0xc6c1b6;
  const tief=stil==='glas'?0.4:0.55, br=stil==='glas'?0.3:0.5;
  for(let i=0;i<4;i++){ const a=P[i], b=P[(i+1)%4], dx=b.x-a.x, dz=b.z-a.z, l=Math.hypot(dx,dz);
    const c=Math.max(1,Math.round(l/S.achse)), nx=dz/l, nz=-dx/l, ry=Math.atan2(-dz,dx);
    for(let j=jede;j<c;j+=jede){ const t=j/c;
      ST_KANTEN.push({geo:new THREE.BoxGeometry(br,th,tief),m:tm(x+a.x+dx*t+nx*tief/2,y+th/2,z+a.z+dz*t+nz*tief/2,0,ry,0),color:farbe}); } }
}
function turm(S,cx,cz,w,d,h,stil,o){
  o=o||{};
  const r=Math.hypot(cx,cz), detail=!COARSE&&(!S.fern||o.held), hex=stadtTon(stil,r);
  belegen(cx,cz,(o.sockel?o.sockel[0]:w)/2+1,(o.sockel?o.sockel[1]:d)/2+1); S.boxen++;
  const q=Math.random(), rund=w/d<1.45&&d/w<1.45;
  const form=o.form||(stil==='glas'?(q<0.26?'rund':q<0.46?'fase':q<0.6&&rund?'oval':'eckig'):(stil==='klinker'||stil==='putz')?'eckig':(q<0.22?'fase':q<0.3?'rund':'eckig'));
  const fq=rand(0.13,0.22), rq=rand(0.2,0.3);
  const grund=(ww,dd)=>form==='fase'?gFase(ww,dd,Math.min(ww,dd)*fq):form==='rund'?gRund(ww,dd,Math.min(ww,dd)*rq,COARSE?2:3):form==='oval'?gOval(ww,dd,COARSE?12:20):gRechteck(ww,dd);
  let y;
  if(o.sockel){
    /* Sockelbau mit Ladenzeile, der Turm steht darauf */
    const [pw,pd]=o.sockel, ps=Math.random()<0.5?'stein':'raster', ph=rand(8,13);
    ST_LOBBY.push({geo:prisma(gRechteck(pw-0.6,pd-0.6),4.6,null,{u:10,u0:Math.random(),v:[0,0.5],deckel:false}),m:tm(cx,0,cz)});
    ST_KANTEN.push({geo:new THREE.BoxGeometry(pw+0.3,0.5,pd+0.3),m:tm(cx,4.6,cz),color:0xd8d2c6});
    S.fass[ps].push({geo:prisma(gRechteck(pw,pd),ph-4.6,ps),m:tm(cx,4.6,cz),color:stadtTon(ps,r)});
    ST_KANTEN.push({geo:new THREE.BoxGeometry(pw+0.3,0.8,pd+0.3),m:tm(cx,ph+0.2,cz),color:0xd0cabd});
    /* Lobby des Turms auf dem Sockeldach nicht noetig: der Turm beginnt hier */
    y=ph;
  } else {
    /* Lobby: eingerueckter Glassockel unter einem Vordach */
    ST_LOBBY.push({geo:prisma(grund(w-1.4,d-1.4),5,null,{u:10,u0:Math.random(),v:[0.5,1],deckel:false}),m:tm(cx,0,cz)});
    ST_KANTEN.push({geo:prisma(weiter(grund(w,d),w,d,0.4),0.5,null,{boden:true}),m:tm(cx,4.75,cz),color:0xcfd4da});
    y=5;
  }
  /* Staffelung mit Ruecksprung, manchmal aus der Mitte geschoben */
  const nT=h>80?3:h>46?(Math.random()<0.72?2:1):1, fr=nT===3?[0.6,0.26,0.14]:nT===2?[0.74,0.26]:[1];
  let ww=w, dd=d, ox=0, oz=0; const H0=h-y;
  for(let t=0;t<nT;t++){
    const th=H0*fr[t], P=grund(ww,dd);
    S.fass[stil].push({geo:prisma(P,th,stil),m:tm(cx+ox,y,cz+oz),color:hex});
    if(detail) relief(stil,form,P,ww,dd,th,cx+ox,y,cz+oz);
    y+=th;
    if(t<nT-1){
      ST_KANTEN.push({geo:prisma(weiter(P,ww,dd,0.45),0.7,null,{boden:true}),m:tm(cx+ox,y-0.35,cz+oz),color:0xd3d6da});
      const nw=ww*rand(0.7,0.86), nd=dd*rand(0.7,0.86), z=Math.random();
      if(z<0.3) ox+=(Math.random()<0.5?1:-1)*(ww-nw)/2*0.9; else if(z<0.55) oz+=(Math.random()<0.5?1:-1)*(dd-nd)/2*0.9;
      ww=nw; dd=nd;
    }
  }
  if(nT>1) SKYLINE_INFO.stufen++;
  const P=grund(ww,dd), tx=cx+ox, tz=cz+oz;
  ST_KANTEN.push({geo:prisma(weiter(P,ww,dd,0.25),1.1,null,{boden:true}),m:tm(tx,y-0.2,tz),color:0xd3d6da});
  y+=0.9;
  let top=y;
  if(h>38){
    const k=o.krone||(q<0.5?'lamellen':form==='eckig'||form==='fase'?(q<0.68?'spitze':q<0.84?'heli':'technik'):(q<0.8?'heli':'technik'));
    KRONEN.push({cx:tx,cz:tz,w:ww,d:dd,y:top});
    if(k==='lamellen'){
      /* Technikgeschoss hinter einem Lamellenschirm, nachts angestrahlt */
      const hk=rand(3.5,7);
      ST_KANTEN.push({geo:new THREE.BoxGeometry(ww*0.55,hk*0.85,dd*0.55),m:tm(tx,top+hk*0.42,tz),color:0x6c737c});
      lamellen(P,tx,top,tz,hk,detail?1.1:1.8);
      ST_KRONE.push({geo:prisma(weiter(P,ww,dd,0.2),0.4,null,{v:[0.55,0.62],boden:true}),m:tm(tx,top+hk-0.4,tz),color:0xd8dee4});
      top+=hk;
    } else if(k==='spitze'){
      /* Pyramidendach aus Metall, von unten angestrahlt */
      const hs=Math.min(ww,dd)*rand(0.45,0.85);
      ST_KRONE.push({geo:pyramide(ww*0.94,dd*0.94,hs),m:tm(tx,top,tz),color:q<0.6?0x8a939c:0x6f8c80});
      top+=hs;
    } else if(k==='heli'){
      /* Hubschrauberlandeplatz mit Befeuerung */
      const R=Math.min(ww,dd)*0.36;
      ST_KANTEN.push({geo:new THREE.BoxGeometry(ww*0.35,2.6,dd*0.3),m:tm(tx+ww*0.2,top+1.3,tz-dd*0.22),color:0x737a83});
      ST_HELI.push({geo:new THREE.CylinderGeometry(R,R,0.3,24),m:tm(tx-ww*0.08,top+1.6,tz+dd*0.06)});
      for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; ST_LICHTER.push([tx-ww*0.08+Math.cos(a)*R,top+1.9,tz+dd*0.06+Math.sin(a)*R].concat(i%2?GRUEN:WEISS)); }
      top+=1.8;
    } else {
      /* Technikaufbau mit Rueckkuehlern */
      ST_KANTEN.push({geo:new THREE.BoxGeometry(ww*0.6,3.6,dd*0.5),m:tm(tx,top+1.8,tz),color:0x7b828b});
      for(let i=0;i<4;i++) ST_DEKO.push({geo:new THREE.CylinderGeometry(0.9,0.9,1.1,10),m:tm(tx+(i-1.5)*2.2,top+4.15,tz),color:0x9aa2ac});
      top+=4.7;
    }
    /* Antennenmast */
    let spitze=top;
    if(Math.random()<(k==='spitze'?0.7:0.4)){ const ah=rand(8,20);
      ST_DEKO.push({geo:new THREE.CylinderGeometry(0.12,0.38,ah,6),m:tm(tx,top+ah/2,tz),color:0xb8bec6}); spitze=top+ah; }
    WARNLICHT.push([tx,spitze+0.6,tz]);
    /* Flugwarnlichter an den Dachecken (ab etwa 60 m) */
    if(y>58){ const E=[[ww/2,dd/2],[-ww/2,dd/2],[-ww/2,-dd/2],[ww/2,-dd/2]];
      for(const [ex,ez] of E) ST_LICHTER.push([tx+ex*0.95,y+0.4,tz+ez*0.95].concat(ROT));
      if(spitze>top) ST_LICHTER.push([tx,top+(spitze-top)*0.5,tz].concat(ROT)); }
  }
  return y;
}

/* --------------------------------------------------------
   Eine geschlossene Haeuserzeile entlang der Strasse: Altbauten mit
   Sattel- und Mansarddaechern, Gauben und Ladengeschoss, dazwischen
   ein paar Nachkriegsbauten mit Staffelgeschoss. Alles landet in den
   gemeinsamen Sammelbecken - frueher kostete jede Zeile sechs
   Zeichenaufrufe.
   -------------------------------------------------------- */
function stadtZeile(S,x0,x1,z,tiefe,hoehe,frontZ,laden){
  let x=x0;
  while(x<x1-5){
    const w=rand(7.5,12.5), d=tiefe*rand(0.9,1.12), h=rand(hoehe[0],hoehe[1]);
    const cx=x+w/2, cz=z+(frontZ>0?d/2:-d/2);
    if(platzFrei(cx,cz,w/2,d/2)){
      const q=Math.random(), stil=q<0.42?'putz':q<0.66?'klinker':q<0.78?'stein':q<0.9?'raster':'band';
      const modern=stil==='raster'||stil==='band', dq=Math.random();
      const dach=modern?'flach':dq<0.58?'sattel':dq<0.8?'mansard':'flach';
      /* ab und zu ein Giebelhaus mit dem Giebel zur Strasse */
      const giebel=dach==='sattel'&&w<10.5&&Math.random()<0.22;
      haus(S,cx,cz,w,d,h,stil,!giebel,{hex:stadtTon(stil,Math.hypot(cx,cz)),eg:4.2,laden:Math.random()<laden,dach,
        staffel:modern&&Math.random()<0.6,gauben:!COARSE&&Math.random()<0.6,dachHex:DACHTON[Math.floor(Math.random()*DACHTON.length)]});
    }
    x+=w+rand(0.08,0.35);
  }
}

/* --------------------------------------------------------
   Ring B: das Quartier hinter der Haeuserzeile - Blockrandbebauung
   (zwei Zeilen je Block, dazwischen der Hof), hier und da ein
   Buerohaus. Die Strassen zwischen den Bloecken bleiben frei.
   -------------------------------------------------------- */
function quartier(S,opt){
  const schritt=opt.raster, n=Math.ceil(opt.r1/schritt), B=schritt-8;
  for(let ix=-n;ix<=n;ix++) for(let iz=-n;iz<=n;iz++){
    const cx=ix*schritt+rand(-1.5,1.5), cz=iz*schritt+rand(-1.5,1.5), r=Math.hypot(cx,cz);
    if(r<opt.r0||r>opt.r1||Math.random()>opt.dichte) continue;
    const zentral=1-clamp((r-opt.r0)/(opt.r1-opt.r0),0,1);
    if(Math.random()<opt.turmChance){
      const w=rand(15,20), d=rand(15,20), h=rand(34,56)*(0.85+zentral*0.3), q=Math.random();
      const stil=q<0.35?'glas':q<0.55?'band':q<0.8?'raster':'stein';
      const sockel=Math.random()<0.5?[Math.min(B+4,w+rand(6,10)),Math.min(B+4,d+rand(6,10))]:null;
      if(platzFrei(cx,cz,(sockel?sockel[0]:w)/2+1,(sockel?sockel[1]:d)/2+1)) turm(S,cx,cz,w,d,h,stil,{sockel,held:true});
      continue;
    }
    const achseX=Math.random()<0.5, seiten=Math.random()<0.6?[-1,1]:[Math.random()<0.5?-1:1];
    const hb=rand(opt.hoehe[0],opt.hoehe[1])*(0.85+zentral*0.3), dh=DACHTON[Math.floor(Math.random()*DACHTON.length)];
    for(const sd of seiten){
      const D=rand(9,11), off=sd*(B/2-D/2);
      let s=-B/2;
      while(s<B/2-4.5){
        const lang=Math.min(rand(7,11),B/2-s); if(lang<4.5) break;
        const hx=achseX?cx+s+lang/2:cx+off, hz=achseX?cz+off:cz+s+lang/2, w=achseX?lang:D, d=achseX?D:lang;
        if(platzFrei(hx,hz,w/2,d/2)){
          const q=Math.random(), stil=q<0.46?'putz':q<0.7?'klinker':q<0.8?'stein':q<0.92?'raster':'band';
          const modern=stil==='raster'||stil==='band', dq=Math.random();
          const dach=modern?'flach':dq<0.6?'sattel':dq<0.82?'mansard':'flach';
          /* ein Block hat meist dieselbe Dachdeckung */
          haus(S,hx,hz,w,d,clamp(hb*rand(0.85,1.15),9,30),stil,achseX,{hex:stadtTon(stil,Math.hypot(hx,hz)),eg:4,laden:Math.random()<0.35,dach,
            staffel:modern&&Math.random()<0.5,gauben:!COARSE&&r<115&&Math.random()<0.55,dachHex:Math.random()<0.75?dh:DACHTON[Math.floor(Math.random()*DACHTON.length)]});
        }
        s+=lang+rand(0.08,0.4);
      }
    }
  }
}

/* --------------------------------------------------------
   Ring C: die Skyline. Echte Grossstaedte haben ein Zentrum - hier
   ballen sich die hoechsten Tuerme (vor allem hinter dem Testfeld,
   wo man beim Feuerwerk hinschaut), dazwischen wird es niedriger.
   -------------------------------------------------------- */
const CITY=[{x:0,z:-238,s:1},{x:70,z:232,s:0.75},{x:-236,z:-30,s:0.55},{x:238,z:-70,s:0.5}];
function cityBoost(x,z){ let b=0; for(const c of CITY) b=Math.max(b,c.s*Math.exp(-((x-c.x)**2+(z-c.z)**2)/(2*62*62))); return b; }
function skyline(S,opt){
  const schritt=opt.raster, n=Math.ceil(opt.r1/schritt), liste=[];
  for(let ix=-n;ix<=n;ix++) for(let iz=-n;iz<=n;iz++){
    const cx=ix*schritt+rand(-opt.jitter,opt.jitter), cz=iz*schritt+rand(-opt.jitter,opt.jitter), r=Math.hypot(cx,cz);
    if(r<opt.r0||r>opt.r1) continue;
    const bo=cityBoost(cx,cz);
    if(Math.random()>opt.dichte+bo*0.35) continue;
    const w=rand(opt.breite[0],opt.breite[1])*(1-bo*0.2), d=rand(opt.breite[0],opt.breite[1])*(1-bo*0.2);
    let h=rand(opt.hoehe[0],opt.hoehe[1])*(1+bo*1.1);
    if(Math.random()<opt.turmChance) h*=rand(1.3,1.8);
    liste.push({cx,cz,w,d,h:Math.min(h,152),bo});
  }
  /* die hoechsten zuerst: sie bekommen ihren Platz sicher */
  liste.sort((a,b)=>b.h-a.h);
  liste.forEach((t,i)=>{
    const q=Math.random(), gl=opt.glas+t.bo*0.2;
    const stil=q<gl?'glas':q<gl+(1-gl)*0.28?'stein':q<gl+(1-gl)*0.52?'raster':q<gl+(1-gl)*0.8?'band':'klinker';
    const held=i<8||t.bo>0.5;
    let sockel=Math.random()<(held?0.6:0.25)?[t.w+rand(8,14),t.d+rand(8,14)]:null;
    if(sockel&&!platzFrei(t.cx,t.cz,sockel[0]/2+1.5,sockel[1]/2+1.5)) sockel=null;
    if(!sockel&&!platzFrei(t.cx,t.cz,t.w/2+1.5,t.d/2+1.5)) return;
    turm(S,t.cx,t.cz,t.w,t.d,t.h,stil,{sockel,held});
  });
}
/* Ring D: ganz aussen, im Dunst. Frueher gemalte Tafeln, die man
   als flache Pappe erkannte; jetzt echte, schlichte Koerper, die
   das Sonnenlicht von der Seite bekommen und im Nebel verschwinden. */
function fernRing(S,opt){
  const schritt=opt.raster, n=Math.ceil(opt.r1/schritt);
  for(let ix=-n;ix<=n;ix++) for(let iz=-n;iz<=n;iz++){
    const cx=ix*schritt+rand(-8,8), cz=iz*schritt+rand(-8,8), r=Math.hypot(cx,cz);
    if(r<opt.r0||r>opt.r1||Math.random()>opt.dichte) continue;
    const w=rand(14,30), d=rand(14,30);
    let h=rand(14,42)*(1+cityBoost(cx*0.72,cz*0.72)*1.2);
    if(Math.random()<0.14) h*=rand(1.6,2.5);
    if(!platzFrei(cx,cz,w/2+1,d/2+1)) continue;
    belegen(cx,cz,w/2,d/2); S.boxen++;
    const q=Math.random(), stil=q<0.3?'putz':q<0.5?'raster':q<0.68?'band':q<0.9?'glas':'klinker';
    S.fass[stil].push({geo:fassadenBox(w,h,d,stil),m:tm(cx,h/2,cz),color:stadtTon(stil,r)});
    if(h>28) ST_KANTEN.push({geo:new THREE.BoxGeometry(w*0.5,3,d*0.45),m:tm(cx,h+1.5,cz),color:0x9aa6b2});
    if(h>70) ST_LICHTER.push([cx,h+3.4,cz].concat(ROT));
  }
}
/* --------------------------------------------------------
   Wahrzeichen: ein Fernsehturm, zwei Kraene und eine Kirche.
   Ohne Orientierungspunkte wirkt jede Skyline beliebig.
   -------------------------------------------------------- */
let turmSpitze=null;
const beacons=[];
function baueBeacon(x,y,z,gross){
  const m=new THREE.MeshStandardMaterial({color:LIN(0x2a1010),emissive:LIN(0xff2a1e),emissiveIntensity:1.6,fog:false});
  const b=new THREE.Mesh(new THREE.SphereGeometry(gross?0.9:0.55,8,6),m);
  b.position.set(x,y,z); scene.add(b);
  beacons.push({m,ph:Math.random()*6.28,sp:rand(0.7,1.3)});
  return b;
}
function buildFernsehturm(x,z){
  const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  const beton=std(0xa9b2bd,{roughness:0.95});
  const H=118;
  const schaft=new THREE.Mesh(new THREE.CylinderGeometry(3.2,7.5,H*0.72,16,1,true),beton);
  schaft.position.y=H*0.36; schaft.material.side=THREE.DoubleSide; g.add(schaft);
  /* Kanzel mit Fensterband */
  const kanzel=new THREE.Mesh(new THREE.CylinderGeometry(9.5,9.5,9,20),
    fassadenMaterial('glas',true));
  kanzel.position.y=H*0.72; g.add(kanzel);
  /* Fensterband im Massstab: 24 Achsen rundum, drei Geschosse */
  { const uv=kanzel.geometry.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*24/FMOD,uv.getY(i)*3/FMOD); uv.needsUpdate=true; }
  /* die Kanzel braucht Vertexfarben, weil das Material sie erwartet */
  { const gm=kanzel.geometry, n=gm.attributes.position.count, col=new Float32Array(n*3);
    const c=LIN(0xcdd8e4); for(let i=0;i<n;i++){ col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b; }
    gm.setAttribute('color',new THREE.BufferAttribute(col,3)); }
  const dach=new THREE.Mesh(new THREE.ConeGeometry(10,6,20),beton);
  dach.position.y=H*0.72+7.2; g.add(dach);
  const antenne=new THREE.Mesh(new THREE.CylinderGeometry(0.5,2.2,H*0.3,10),std(0xd8d8d8,{roughness:0.7}));
  antenne.position.y=H*0.86; g.add(antenne);
  const spitze=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.5,12,6),std(0xe8e8e8));
  spitze.position.y=H+4; g.add(spitze);
  turmSpitze=baueBeacon(x,H+11,z,true);
  baueBeacon(x,H*0.72+9,z,false);
}
function buildKran(x,z,h,ry){
  const gitter=[];
  /* Mast */
  for(let i=0;i<Math.round(h/3);i++){
    gitter.push({geo:new THREE.BoxGeometry(1.5,0.22,0.22),m:tm(0,i*3,0.7),color:0xe0a520});
    gitter.push({geo:new THREE.BoxGeometry(1.5,0.22,0.22),m:tm(0,i*3,-0.7),color:0xe0a520});
  }
  for(const sx of [-0.7,0.7]) for(const sz of [-0.7,0.7])
    gitter.push({geo:new THREE.BoxGeometry(0.24,h,0.24),m:tm(sx,h/2,sz),color:0xe0a520});
  /* Ausleger und Gegengewicht */
  gitter.push({geo:new THREE.BoxGeometry(34,0.9,1.1),m:tm(11,h+1.4,0),color:0xe0a520});
  gitter.push({geo:new THREE.BoxGeometry(9,1.6,2.2),m:tm(-7,h+1.4,0),color:0x555a62});
  gitter.push({geo:new THREE.BoxGeometry(2.2,2,2),m:tm(0,h+2.8,0),color:0xe0a520});
  /* Seil und Haken */
  gitter.push({geo:new THREE.BoxGeometry(0.1,h*0.5,0.1),m:tm(18,h*0.75,0),color:0x3a3f48});
  gitter.push({geo:new THREE.BoxGeometry(0.7,0.7,0.7),m:tm(18,h*0.5,0),color:0x6a7078});
  /* Das verschmolzene Gitter stand bisher im Nullpunkt statt am
     Bauplatz - mitten im Laden. Position und Drehung gehoeren an das
     Mesh, eine Gruppe drumherum braucht es nicht. */
  const kran=stadtAdd(new THREE.Mesh(merge(gitter),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85})));
  kran.position.set(x,0,z); kran.rotation.y=ry;
  baueBeacon(x,h+3.6,z,false);
}
function buildKirche(x,z,ry){
  /* 26.09.: ein Mesh statt achtzehn - mit Satteldach, Strebepfeilern,
     Spitzbogenfenstern und Schallarkaden im Turm */
  const W=tm(x,0,z,0,ry,0), T=[];
  const L=(geo,px,py,pz,c,ry2)=>T.push({geo,m:W.clone().multiply(tm(px,py,pz,0,ry2||0,0)),color:c});
  const STEIN=0xa39887, DACHF=0x5d4a44, DUNKEL=0x2c313a;
  L(new THREE.BoxGeometry(16,11,9),0,5.5,0,STEIN);
  const dg=dachGeo(16,[[4.9,-0.3],[0,6.2],[-4.9,-0.3]],[[4.5,-0.2],[0,6],[-4.5,-0.2]]);
  L(dg.dach,0,11,0,DACHF); L(dg.giebel,0,11,0,STEIN);
  for(let i=0;i<5;i++){ const px=-5.2+i*3.2;
    for(const s of [1,-1]){ L(new THREE.BoxGeometry(1.3,5.2,0.08),px,5.6,s*4.52,DUNKEL);
      if(i<4) L(new THREE.BoxGeometry(0.7,7.5,0.9),px+1.6,3.75,s*4.9,0x958a7a); } }
  L(new THREE.BoxGeometry(0.08,3.4,3.4),8.02,6.5,0,DUNKEL);
  /* Turm mit Schallarkaden, Helm und Kreuz */
  L(new THREE.BoxGeometry(5.4,27,5.4),-9,13.5,0,STEIN);
  L(new THREE.BoxGeometry(5.8,0.5,5.8),-9,17.5,0,0x958a7a);
  for(const [dx,dz,r] of [[0,2.72,0],[0,-2.72,0],[2.72,0,Math.PI/2],[-2.72,0,Math.PI/2]])
    L(new THREE.BoxGeometry(2.2,3.2,0.08),-9+dx,24.4,dz,DUNKEL,r);
  L(new THREE.ConeGeometry(4,12,4),-9,33,0,0x4a6a5a,Math.PI/4);
  L(new THREE.BoxGeometry(0.2,2.4,0.2),-9,40.2,0,0xd8c070);
  L(new THREE.BoxGeometry(1.2,0.2,0.2),-9,40.7,0,0xd8c070);
  stadtAdd(new THREE.Mesh(merge(T),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95})));
  /* beleuchtetes Zifferblatt */
  const zb=new THREE.MeshStandardMaterial({color:LIN(0xf4efe0),emissive:LIN(0xffe9b8),emissiveIntensity:0,roughness:0.6,
    map:tex(128,128,(c,W,H)=>{
      c.fillStyle='#f4efe0'; c.beginPath(); c.arc(W/2,H/2,W*0.46,0,Math.PI*2); c.fill();
      c.strokeStyle='#2a2620'; c.lineWidth=4; c.stroke();
      for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; c.save(); c.translate(W/2,H/2); c.rotate(a);
        c.fillStyle='#2a2620'; c.fillRect(-2,-W*0.42,4,W*0.08); c.restore(); }
      c.strokeStyle='#2a2620'; c.lineWidth=5; c.beginPath(); c.moveTo(W/2,H/2); c.lineTo(W/2+W*0.2,H/2-W*0.18); c.stroke();
      c.lineWidth=3; c.beginPath(); c.moveTo(W/2,H/2); c.lineTo(W/2-W*0.08,H/2-W*0.3); c.stroke(); })});
  houseMats.push(zb);
  const Z=[];
  for(const [dx,dz,rr] of [[0,2.75,0],[0,-2.75,Math.PI],[2.75,0,Math.PI/2],[-2.75,0,-Math.PI/2]])
    Z.push({geo:new THREE.PlaneGeometry(3,3),m:W.clone().multiply(tm(-9+dx,21,dz,0,rr,0))});
  stadtAdd(new THREE.Mesh(merge(Z),zb));
}

/* --------------------------------------------------------
   Aussen schlossen frueher gemalte Silhouetten-Tafeln den Horizont.
   Man erkannte sie als flache Pappe (Tom, 26.09.) - jetzt macht das
   der ferne Ring aus echten Koerpern (fernRing). Die Liste bleibt fuer
   die Tests bestehen.
   -------------------------------------------------------- */
const silhouetten=[];

/* --------------------------------------------------------
   Grün in der Stadt: Baumreihen an den Strassen und ein paar
   Parks in den Luecken zwischen den Bloecken. Alles verschmolzen,
   ein Baum ist aus der Ferne nur Stamm und Krone.
   -------------------------------------------------------- */
function buildFernbaeume(){
  const staemme=[], kronen=[];
  const gruen=[0x3c5a32,0x44603a,0x35502c,0x4a6a3e,0x2f4a28,0x546f42];
  const setzen=(x,z,skal)=>{
    if(!platzFrei(x,z,1.5,1.5)) return false;
    const h=rand(5,9)*skal, r=rand(1.9,3.2)*skal;
    staemme.push({geo:new THREE.CylinderGeometry(0.16*skal,0.26*skal,h*0.55,6),m:tm(x,h*0.28,z),color:0x4a3a2c});
    const c=gruen[Math.floor(Math.random()*gruen.length)];
    /* zwei versetzte Kugeln geben der Krone Form, ohne teuer zu sein */
    kronen.push({geo:new THREE.SphereGeometry(r,7,5),m:tm(x,h*0.62,z),color:c});
    kronen.push({geo:new THREE.SphereGeometry(r*0.72,6,5),m:tm(x+rand(-0.6,0.6)*skal,h*0.86,z+rand(-0.6,0.6)*skal),color:c});
    return true;
  };
  /* Alleen entlang der eigenen Strasse, weit links und rechts */
  for(const [von,bis] of [[-230,-56],[34,230]])
    for(let x=von;x<bis;x+=rand(9,15)){
      setzen(x,rand(6.5,7.5),rand(0.85,1.25));
      setzen(x+rand(2,6),rand(23.5,24.5),rand(0.85,1.25));
    }
  /* Parks: Baumgruppen in den Luecken des Quartiers */
  const parks=COARSE?4:8, rasen=[];
  for(let i=0;i<parks;i++){
    const a=Math.random()*Math.PI*2, r=rand(58,170);
    const px=Math.cos(a)*r, pz=Math.sin(a)*r;
    if(!platzFrei(px,pz,14,14)) continue;
    const n=COARSE?7:14;
    for(let k=0;k<n;k++)
      setzen(px+rand(-13,13),pz+rand(-13,13),rand(0.9,1.5));
    /* Rasenflaeche darunter */
    const w=rand(22,34), d=rand(20,30);
    rasen.push({geo:new THREE.PlaneGeometry(w,d),m:tm(px,0.02,pz,-Math.PI/2),color:0x4e6640});
    belegen(px,pz,w/2,d/2);
  }
  /* alle Rasenflaechen in einem Mesh (26.09.) */
  if(rasen.length) stadtAdd(new THREE.Mesh(merge(rasen),new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})));
  /* Ein Gruenzug ganz aussen, damit die Skyline nicht nackt endet */
  for(let i=0;i<(COARSE?24:54);i++){
    const a=Math.random()*Math.PI*2, r=rand(190,330);
    setzen(Math.cos(a)*r,Math.sin(a)*r,rand(1.2,2.2));
  }
  if(staemme.length) stadtAdd(new THREE.Mesh(merge(staemme),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95})));
  if(kronen.length) stadtAdd(new THREE.Mesh(merge(kronen),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.92,flatShading:true})));
  return kronen.length/2;
}

/* =========================================================
   Leben in der Ferne. Eine Stadt ohne Bewegung sieht aus wie
   eine Kulisse, deshalb: Vogelschwaerme, Verkehr auf der
   Ausfallstrasse, ein Flugzeug und Rauch aus Schornsteinen.
   ========================================================= */

/* --- Vogelschwaerme --- */
const schwaerme=[];
function vogelGeo(){
  /* ein flacher Keil, der von unten wie ein Vogel aussieht */
  const g=new THREE.BufferGeometry();
  const v=new Float32Array([ 0,0,-0.55,  -0.7,0.06,0.35,  0,0,0.1,
                             0,0,-0.55,   0,0,0.1,   0.7,0.06,0.35 ]);
  g.setAttribute('position',new THREE.BufferAttribute(v,3));
  g.computeVertexNormals();
  return g;
}
/* 26.09.: ein Schwarm ist ein InstancedMesh - vorher war jeder Vogel
   ein eigener Zeichenaufruf (42 Stueck) */
function buildVoegel(){
  const geo=vogelGeo();
  const mat=new THREE.MeshBasicMaterial({color:LIN(0x2b3038),side:THREE.DoubleSide,fog:true});
  const nS=COARSE?2:3;
  for(let s=0;s<nS;s++){
    const g=new THREE.Group(); scene.add(g);
    const n=COARSE?8:14, voegel=[];
    const im=new THREE.InstancedMesh(geo,mat,n); im.frustumCulled=false; g.add(im);
    for(let i=0;i<n;i++){
      const m=new THREE.Object3D();
      const r=rand(4,16), a=Math.random()*Math.PI*2;
      m.position.set(Math.cos(a)*r,rand(-3,3),Math.sin(a)*r);
      m.scale.setScalar(rand(0.55,1.0));
      voegel.push({m,ph:Math.random()*6.28,sp:rand(7,11)});
    }
    schwaerme.push({g,im,voegel,
      mx:rand(-90,90), mz:rand(-90,90), my:rand(26,48),
      r:rand(38,70), a:Math.random()*Math.PI*2, sp:rand(0.035,0.075)*(Math.random()<0.5?-1:1)});
  }
}
/* --- Hochstrassen mit Verkehr ---
   Sie laufen quer zur eigenen Strasse und kreuzen sie weit draussen.
   Genau dort ist der Blick frei: schaut man die Strasse hinunter,
   sieht man in der Ferne eine Brueckenfahrbahn mit Verkehr darauf.
   Haetten sie hinter dem Quartier gestanden, waeren sie von den
   Daechern der Haeuserzeile komplett verdeckt. */
const VIA={y:15.5, len:340, x:[-212,218]};
function buildHochstrasse(){
  const teile=[], pfeiler=[], lampen=[];
  const lm=new THREE.MeshStandardMaterial({color:LIN(0x2a2a2e),emissive:LIN(0xffd9a0),emissiveIntensity:0,fog:true});
  lampMats.push(lm);
  VIA.x.forEach((vx,k)=>{
    const n=Math.round(VIA.len/20);
    for(let i=0;i<n;i++){
      const z=-VIA.len/2+i*20+10;
      const dy=Math.sin(i*0.35+k)*0.9;         /* leichte Kuppe in der Fahrbahn */
      teile.push({geo:new THREE.BoxGeometry(13,1.2,20.2),m:tm(vx,VIA.y+dy,z),color:0x8b9099});
      /* Leitplanken links und rechts */
      for(const sx of [-6.2,6.2])
        teile.push({geo:new THREE.BoxGeometry(0.4,0.8,20.2),m:tm(vx+sx,VIA.y+dy+0.95,z),color:0xb4bac4});
      /* Pfeilerpaare */
      if(i%2===0) for(const sx of [-3.4,3.4]){
        pfeiler.push({geo:new THREE.CylinderGeometry(1.2,1.7,VIA.y+dy,10),m:tm(vx+sx,(VIA.y+dy)/2,z),color:0x9aa1ab});
        pfeiler.push({geo:new THREE.BoxGeometry(3.6,0.8,3.6),m:tm(vx+sx,0.4,z),color:0x868d97});
      }
      /* Beleuchtungsmasten mit Ausleger */
      if(i%3===0){
        pfeiler.push({geo:new THREE.CylinderGeometry(0.15,0.22,10,6),m:tm(vx+6.4,VIA.y+dy+6.2,z),color:0x6f767f});
        pfeiler.push({geo:new THREE.BoxGeometry(2.4,0.24,0.5),m:tm(vx+5.2,VIA.y+dy+11.1,z),color:0x6f767f});
        lampen.push({geo:new THREE.BoxGeometry(1.6,0.32,0.8),m:tm(vx+4.4,VIA.y+dy+10.8,z)});
      }
    }
  });
  stadtAdd(new THREE.Mesh(merge(teile),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.92})));
  stadtAdd(new THREE.Mesh(merge(pfeiler),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95})));
  if(lampen.length){ const m=new THREE.Mesh(merge(lampen),lm); m.userData.stadt=true; scene.add(m); }
}
/* --- Verkehr: auf der Hochstrasse und die eigene Strasse hinunter --- */
let verkehrPts=null, verkehrDat=[];
function buildFernverkehr(){
  const n=COARSE?40:84;
  const pos=new Float32Array(n*3), col=new Float32Array(n*3);
  verkehrDat=[];
  for(let i=0;i<n;i++){
    /* Zwei Drittel fahren oben auf dem Viadukt, ein Drittel unten
       die eigene Strasse entlang - dort aber nur weit weg. */
    const oben=i%3!==2;
    const dir=i%2?1:-1;
    verkehrDat.push({oben,dir,t:Math.random(),sp:rand(0.020,0.042),
      bruecke:i%2, spur:dir>0?-2.6:2.6, jit:rand(-0.6,0.6)});
    /* Scheinwerfer weiss, Rueckleuchten rot - je nach Fahrtrichtung */
    const c=dir>0?[1,0.95,0.82]:[1,0.24,0.13];
    col[i*3]=c[0]; col[i*3+1]=c[1]; col[i*3+2]=c[2];
    pos[i*3+1]=-999;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  verkehrPts=new THREE.Points(g,new THREE.PointsMaterial({
    size:2.1,map:dotTex,vertexColors:true,transparent:true,opacity:0,
    depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
  verkehrPts.frustumCulled=false; scene.add(verkehrPts);
}
/* --- Flugzeug, das gelegentlich vorbeizieht --- */
let flieger=null, fliegerLicht=null, fliegerT=rand(20,70);
function buildFlieger(){
  const g=new THREE.Group(); scene.add(g); g.visible=false;
  const m=std(0xdfe4ea,{roughness:0.6,metalness:0.2});
  bbox(1.1,0.5,7,m,0,0,0,g,false);
  bbox(9,0.16,1.5,m,0,-0.05,0.4,g,false);
  bbox(3.2,0.14,0.9,m,0,0.5,-2.8,g,false);
  bbox(0.16,1.5,1.1,m,0,0.7,-3,g,false);
  const lm=new THREE.MeshBasicMaterial({color:LIN(0xff3020),fog:false});
  fliegerLicht=new THREE.Mesh(new THREE.SphereGeometry(0.26,6,5),lm);
  fliegerLicht.position.set(0,-0.3,1.5); g.add(fliegerLicht);
  flieger=g;
}
/* --- Rauch aus den Schornsteinen der Stadt --- */
let rauchPts=null, rauchDat=[];
function buildRauch(){
  const quellen=[];
  for(let i=0;i<(COARSE?3:6);i++){
    const a=Math.random()*Math.PI*2, r=rand(70,150);
    const x=Math.cos(a)*r, z=Math.sin(a)*r;
    if(!stadtFrei(x,z,10)) continue;
    quellen.push({x,y:rand(18,34),z});
  }
  if(!quellen.length) return;
  const proQuelle=COARSE?10:18, n=quellen.length*proQuelle;
  const pos=new Float32Array(n*3);
  rauchDat=[];
  for(let q=0;q<quellen.length;q++) for(let i=0;i<proQuelle;i++){
    rauchDat.push({q:quellen[q],t:i/proQuelle,sp:rand(0.055,0.1),dr:rand(0.6,1.8)});
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  rauchPts=new THREE.Points(g,new THREE.PointsMaterial({
    size:7,map:dotTex,color:0xc8ceda,transparent:true,opacity:0.16,
    depthWrite:false,fog:true}));
  rauchPts.frustumCulled=false; scene.add(rauchPts);
}

/* --------------------------------------------------------
   Alles zusammenbauen
   -------------------------------------------------------- */
let stadtBoxen=0, stadtBaeume=0;
function buildStadt(){
  /* 26.09.: Die Kamera schnitt bei 300 m ab - die Skyline endete mitten
     im zweiten Ring. Der Nebel (bis 520 m) blendet jetzt aus, nicht
     die Schnittebene. */
  if(camera.far<640){ camera.far=640; camera.updateProjectionMatrix(); }
  const NAH=sammler(false), FERN=sammler(true);
  /* Die Strasse laeuft nach beiden Seiten weiter, gesaeumt von Haeusern.
     Vorne die Zeile gegenueber, dahinter eine Reihe zur Tiefe. */
  stadtZeile(NAH,-150,-44,23,8.5,[11,18],1,0.8);
  stadtZeile(NAH,44,150,23,8.5,[11,18],1,0.8);
  stadtZeile(NAH,-160,160,36,9,[12,21],1,0.3);
  /* und unsere Strassenseite jenseits von Hof und Testfeld */
  stadtZeile(NAH,-150,-50,7,9,[10,17],-1,0.7);
  stadtZeile(NAH,28,150,7,9,[10,17],-1,0.7);
  stadtZeile(NAH,-170,-56,-14,10,[11,20],-1,0.2);
  stadtZeile(NAH,34,170,-14,10,[11,20],-1,0.2);
  /* Ring B: das Quartier gleich hinter der Haeuserzeile */
  quartier(NAH,{r0:40,r1:150,raster:COARSE?42:32,dichte:COARSE?0.5:0.74,hoehe:[12,21],turmChance:0.07});
  /* Ring C: die Skyline, Ring D: die Stadt im Dunst */
  skyline(FERN,{r0:165,r1:330,raster:COARSE?58:44,jitter:9,dichte:COARSE?0.42:0.58,breite:[16,30],hoehe:[34,80],glas:0.4,turmChance:0.2});
  fernRing(FERN,{r0:342,r1:470,raster:COARSE?56:40,dichte:COARSE?0.45:0.66});
  stadtBoxen=sammlerBauen(NAH)+sammlerBauen(FERN);
  stadtTeileBauen();
  /* Blinkende Befeuerung: die hoechsten Tuerme */
  WARNLICHT.sort((a,b)=>b[1]-a[1]).slice(0,COARSE?4:6).forEach(([x,y,z])=>baueBeacon(x,y,z,false));
  /* Wahrzeichen */
  buildFernsehturm(-118,206);
  buildKran(96,148,44,0.7);
  buildKran(-64,176,38,-1.2);
  buildKirche(74,86,-0.5);
  /* Leben */
  buildHochstrasse();
  stadtBaeume=buildFernbaeume();
  buildVoegel(); buildFernverkehr(); buildFlieger(); buildRauch();
}
/* --------------------------------------------------------
   Bewegung
   -------------------------------------------------------- */
const _vTmp=new THREE.Vector3();
let stadtT=0, _stadtNacht=-1;
const _vM=new THREE.Matrix4(), _vQ=new THREE.Quaternion();
function updateStadt(dt){
  stadtT+=dt;
  const t=stadtT;
  const nacht=clamp(((typeof todUhr==='function'?todUhr():clock)-960)/100,0,1);
  /* Spiegelungen nachts gedimmt, Kronen angestrahlt, Warnlichter an */
  if(Math.abs(nacht-_stadtNacht)>0.002){ _stadtNacht=nacht;
    const k=1-0.85*nacht;
    for(const key in STADT_MATS){ const m=STADT_MATS[key]; if(m.envMap) m.envMapIntensity=m.userData.env*k; }
    for(const m of [_lobbyM,_kroneM]) if(m&&m.envMap) m.envMapIntensity=m.userData.env*k;
    if(_kroneM) _kroneM.emissiveIntensity=nacht*1.7;
    if(lichtPts) lichtPts.material.opacity=nacht; }
  /* Vogelschwaerme ziehen ihre Kreise und schlagen mit den Fluegeln */
  for(const s of schwaerme){
    s.a+=s.sp*dt;
    s.g.position.set(s.mx+Math.cos(s.a)*s.r, s.my+Math.sin(s.a*2.3)*4, s.mz+Math.sin(s.a)*s.r);
    s.g.rotation.y=-s.a+Math.PI/2;
    s.voegel.forEach((v,i)=>{
      const f=Math.sin(t*v.sp+v.ph);
      v.m.rotation.z=f*0.55;
      v.m.position.y+=f*dt*0.35;
      if(v.m.position.y>4) v.m.position.y=4; if(v.m.position.y<-4) v.m.position.y=-4;
      _vM.compose(v.m.position,_vQ.setFromEuler(v.m.rotation),v.m.scale); s.im.setMatrixAt(i,_vM);
    });
    s.im.instanceMatrix.needsUpdate=true;
    /* nachts sind weniger Voegel unterwegs */
    s.g.visible=nacht<0.75;
  }
  /* Verkehr: nachts sieht man nur die Lichter, tags gar nichts */
  if(verkehrPts){
    verkehrPts.material.opacity=nacht*0.95;
    if(nacht>0.02){
      const a=verkehrPts.geometry.attributes.position, arr=a.array;
      for(let i=0;i<verkehrDat.length;i++){
        const d=verkehrDat[i];
        d.t+=d.sp*dt*d.dir;
        if(d.t>1) d.t-=1; if(d.t<0) d.t+=1;
        if(d.oben){
          const z=-VIA.len/2+d.t*VIA.len;
          const i20=(z+VIA.len/2-10)/20;
          const dy=Math.sin(i20*0.35+d.bruecke)*0.9;
          arr[i*3]=VIA.x[d.bruecke]+d.spur+d.jit; arr[i*3+1]=VIA.y+dy+1.3; arr[i*3+2]=z;
        } else {
          /* die eigene Strasse: nur in der Ferne, sonst waere der
             Lichtpunkt direkt vor der Nase zu sehen */
          const x=-230+d.t*460;
          if(Math.abs(x)<52){ arr[i*3+1]=-999; }
          else { arr[i*3]=x; arr[i*3+1]=0.8; arr[i*3+2]=15.3+d.spur*0.6+d.jit; }
        }
      }
      a.needsUpdate=true;
    }
  }
  /* Blinklichter auf Turm und Kraenen */
  for(const b of beacons)
    b.m.emissiveIntensity=(((t*b.sp+b.ph)%2)<0.35)?2.6:0.12;
  /* Flugzeug */
  if(flieger){
    fliegerT-=dt;
    if(fliegerT<=0&&!flieger.visible){
      flieger.visible=true;
      const seite=Math.random()<0.5?1:-1;
      flieger.userData={x:-260*seite,z:rand(-120,180),y:rand(72,110),vx:seite*rand(13,20)};
      flieger.rotation.y=seite>0?Math.PI/2:-Math.PI/2;
    }
    if(flieger.visible){
      const u=flieger.userData;
      u.x+=u.vx*dt;
      flieger.position.set(u.x,u.y,u.z);
      if(Math.abs(u.x)>270){ flieger.visible=false; fliegerT=rand(45,130); }
      fliegerLicht.visible=((t*1.4)%1)<0.2;
    }
  }
  /* Rauchfahnen */
  if(rauchPts){
    const a=rauchPts.geometry.attributes.position, arr=a.array;
    for(let i=0;i<rauchDat.length;i++){
      const d=rauchDat[i];
      d.t+=d.sp*dt*0.28;
      if(d.t>1) d.t-=1;
      const h=d.t*26;
      arr[i*3]=d.q.x+Math.sin(d.t*4+i)*d.dr*(0.4+d.t*2.4);
      arr[i*3+1]=d.q.y+h;
      arr[i*3+2]=d.q.z+Math.cos(d.t*3+i)*d.dr*(0.3+d.t*1.8);
    }
    a.needsUpdate=true;
    rauchPts.material.opacity=0.10+0.09*(1-nacht);
  }
}


/* =========================================================
   Wände, Böden, Welt
   ========================================================= */
const SKY_R=285;
let lapHit, padHit, doorSign, doorSignTex, starsMat, posHit, cardHit, posTex, beltTex, skyGeo, skyMesh=null, starPts=null, lampMats=[], houseMats=[], snowPts;
let grimeMats=[], windowHits=[], winWork=0;
let uhrStd=null, uhrMin=null, uhrSek=null;
let wallTex=null, floorTexRef=null, shopWall=null, shopUpper=null, shopLower=null, floorMat=null;
const WH=3.6;
/* =========================================================
   Grundriss. Die ganze Flaeche steht von Anfang an, aber nur
   der Kern ist begehbar - der Rest liegt hinter Bauwaenden und
   waechst Stueck fuer Stueck hinzu.

        Strasse z 13..20 / Gehweg z 8.5
   +--------+------------------+--------------------------+
   | Lager  | Lager Basis      |  Verkauf Basis  | shop_  |
   | Nord   | x -19.9..-8.1    |  x -7.9..8      | gross  |
   +--------+ z -5.9..1.9      |  z -5.9..5.9    | +ost   |
   | Lager West | Lager Sued   +-----------------+--------+
   | x -41.9..  | x -19.9..    |    Testfeld     | shop_  |
   |   -19.9    |   -8.1       |  x -7.9..8      | sued   |
   | z -29.9..-7| z -29.9..-5.9|  z -28..-6      |        |
   +------------+--------------+-----------------+--------+
   ========================================================= */
const LAY={
  /* Verkaufsflaeche, zusammen 1018 m2 */
  shop  :{x0:-7.9, x1:37.9, z0:-21.9, z1:5.9},
  basis :{x0:-7.9, x1:8.0,  z0:-5.9,  z1:5.9},   /* 186 m2, das ganze Ladenlokal */
  /* Am Anfang gehoert nur die westliche Haelfte dazu; oestlich der
     Trennwand liegt die zweite Haelfte samt Tuer zum Testfeld. */
  ost1  :{x0:8.0,  x1:20.0, z0:-5.9,  z1:5.9},   /* 142 m2 */
  ost2  :{x0:20.0, x1:37.9, z0:-5.9,  z1:5.9},   /* 212 m2 */
  sued  :{x0:8.0,  x1:37.9, z0:-21.9, z1:-5.9},  /* 478 m2 */
  /* Lager, zusammen 927 m2 */
  lager :{x0:-66.0,x1:-8.1, z0:-45.0, z1:5.9},
  /* Am Anfang gehoert nur der Raum am Rolltor zum Lager. Der
     Anbau nach Norden ist die erste Lagererweiterung; bis dahin
     steht dort eine Wand mit Durchbruch. */
  lbasis:{x0:-19.9,x1:-8.1, z0:-5.9,  z1:1.9},   /*  92 m2, von Anfang an */
  lnord :{x0:-19.9,x1:-8.1, z0:1.9,   z1:5.9},   /*  47 m2, Lagererweiterung 1 */
  /* Die Halle Sued waechst vom Rolltor aus nach Sueden, in drei
     Abschnitten. Der erste traegt die Packstation - ab dort laeuft
     der Versand. Zwischen den Abschnitten faellt die Wand beim
     Kauf ganz weg, damit am Ende eine durchgehende Halle steht. */
  lsued :{x0:-19.9,x1:-8.1, z0:-29.9, z1:-5.9},  /* 283 m2 gesamt */
  ls1   :{x0:-19.9,x1:-8.1, z0:-15.9, z1:-5.9},  /* 118 m2 */
  ls2   :{x0:-19.9,x1:-8.1, z0:-22.9, z1:-15.9}, /*  83 m2 */
  ls3   :{x0:-19.9,x1:-8.1, z0:-29.9, z1:-22.9}, /*  83 m2 */
  /* Grosshandel: eigenes Gebaeude, 40 x 38 m und zwoelf Meter licht.
     Palettenregale und ein Hubwagen brauchen die Hoehe; die alte
     Halle mit 505 m2 und 6,4 m war dafuer zu klein. */
  /* Logistikhalle in drei Stufen (seit 24.09.): klein anfangen,
     dann groesser und hoeher. Die Tore stehen an der Suedwand
     (z -34), der LKW-Hof liegt suedlich davor. lwest ist die
     volle Halle der dritten Stufe. */
  lw1   :{x0:-44.0,x1:-26.0,z0:-34.0, z1:-14.0},  /* 360 m2, 6,5 m  */
  lw2   :{x0:-56.0,x1:-26.0,z0:-34.0, z1:-10.0},  /* 720 m2, 8,5 m  */
  lwest :{x0:-66.0,x1:-26.0,z0:-34.0, z1:-7.0},   /* 1080 m2, 11 m  */
  /* Schleuse zwischen Lager (6,4 m) und Grosshandel (12 m). Zwei
     Gebaeude mit verschiedenen Deckenhoehen kann man nicht einfach
     aneinanderstellen - dazwischen gehoert ein Zwischenbau. */
  schleuse:{x0:-26.0,x1:-19.9,z0:-24.0,z1:-17.0},
  /* Testfeld hinter dem Basisladen, durch die Hintertuer erreichbar */
  test  :{x0:-7.9, x1:8.0,  z0:-28.0, z1:-6.0},
  /* Hoefe: der kleine an der Basisrampe, der grosse an der Westrampe */
  hof   :{x0:-34.0,x1:-20.0,z0:-6.5,  z1:2.5},
  hof2  :{x0:-70.0,x1:-22.0,z0:-62.0, z1:-34.2},   /* LKW-Hof suedlich der Logistikhalle */
  /* Logistikzentrum, vorerst nur von aussen */
  logi  :{x0:44.0, x1:90.0, z0:-16.0, z1:14.0}
};
const LW=0.2;                      /* Wandstaerke                      */
function flaeche(r){ return Math.round((r.x1-r.x0)*(r.z1-r.z0)); }
/* Hintertuer aus dem Basisladen aufs Testfeld */
const HINTERTUER={x0:4.4, x1:6.1};
/* Lichte Hoehe des Anbaus hinter dem Lager. Er ist kein eigener
   Raum mehr, sondern Teil des Lagers - seine Hoehe ist die
   Lagerhoehe. Die Konstante bleibt, weil sie an ein paar Stellen
   als Mass fuer Einbauten dient. */
const ANBAU_H=2.9;
/* Lichte Hoehe der Lagerhalle Sued. 6,4 m waren zu viel fuer einen
   Raum, der nur Regale traegt; unter 4,8 m passt aber kein Hochregal
   mehr hinein (4,26 m plus Luft). */
/* Die Trennwand im Ladenlokal. Sie steht zwischen Eingangsrahmen
   und zweitem Schaufenster, damit Eingang, Kasse und Bueroecke in
   der Starthaelfte liegen. */
const SHOP_HALB=2.0;
const HALLE_H=5.0;
const LSUED_H=HALLE_H;
/* Das ganze Lager hat dieselbe lichte Hoehe: Raum an der Rampe,
   Anbau nach Norden und die drei Abschnitte der Halle Sued. Nur so
   entfallen Stuerze und stehengebliebene Wandstuecke zwischen den
   Bereichen, und am Ende steht wirklich ein grosser Raum. */
const LAGER_H=HALLE_H;
/* Grosshandel: Hoehe fuer Palettenregale und Hubwagen */
const GH_H=12.0;
/* Lichte Hoehe der Schleuse */
const SCHLEUSE_H=3.4;
function paintWall(g,W,H,c){
  g.fillStyle=c.up; g.fillRect(0,0,W,H);
  const band=Math.round(H*(1-1.1/WH));
  if(c.pat==='streifen'){ g.fillStyle=c.pat2; for(let x=0;x<W;x+=W/6) g.fillRect(x,0,W/14,band);
    g.fillStyle='rgba(0,0,0,.05)'; for(let x=W/12;x<W;x+=W/6) g.fillRect(x,0,W/40,band); }
  else if(c.pat==='raute'){ g.strokeStyle=c.pat2; g.lineWidth=Math.max(1.5,W/90);
    const s2=W/5; for(let y=-s2;y<band+s2;y+=s2){ for(let x=-s2;x<W+s2;x+=s2){
      g.beginPath(); g.moveTo(x,y+s2/2); g.lineTo(x+s2/2,y); g.lineTo(x+s2,y+s2/2); g.lineTo(x+s2/2,y+s2); g.closePath(); g.stroke(); } } }
  else if(c.pat==='ziegel'){ const bh=band/14;
    for(let r=0;r<14;r++){ const off=(r%2)*(W/6);
      for(let x=-W/6;x<W;x+=W/3){ g.fillStyle=c.pat2; g.fillRect(x+off+2,r*bh+2,W/3-4,bh-4); } }
    g.fillStyle='rgba(255,255,255,.08)'; for(let r=0;r<14;r++) g.fillRect(0,r*bh,W,1.5); }
  else if(c.pat==='blume'){ const s2=W/4;
    for(let y=s2/2;y<band;y+=s2) for(let x=((y/s2)%2)*s2/2;x<W;x+=s2){
      g.fillStyle=c.pat2; for(let k=0;k<5;k++){ const a2=k/5*Math.PI*2;
        g.beginPath(); g.ellipse(x+Math.cos(a2)*s2*0.13,y+Math.sin(a2)*s2*0.13,s2*0.09,s2*0.05,a2,0,Math.PI*2); g.fill(); }
      g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(x,y,s2*0.045,0,Math.PI*2); g.fill(); } }
  else if(c.pat==='holz'){ const pw=W/5;
    for(let x=0;x<W;x+=pw){ g.fillStyle=c.pat2; g.fillRect(x+2,0,pw-4,band);
      g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x,0,2,band);
      g.strokeStyle='rgba(60,40,20,.18)'; g.lineWidth=1;
      for(let k=0;k<5;k++){ g.beginPath(); g.moveTo(x+4+k*(pw/6),0); g.bezierCurveTo(x+8+k*(pw/6),band*0.3,x+2+k*(pw/6),band*0.7,x+6+k*(pw/6),band); g.stroke(); } } }
  else if(c.pat==='ornament'){ const s2=W/4;
    for(let y=s2/2;y<band;y+=s2) for(let x=((y/s2)%2)*s2/2;x<W;x+=s2){
      g.strokeStyle=c.pat2; g.lineWidth=Math.max(1.5,W/120);
      g.beginPath(); g.arc(x,y,s2*0.22,0,Math.PI*2); g.stroke();
      g.beginPath(); g.moveTo(x-s2*0.3,y); g.quadraticCurveTo(x,y-s2*0.32,x+s2*0.3,y); g.stroke();
      g.beginPath(); g.moveTo(x-s2*0.3,y); g.quadraticCurveTo(x,y+s2*0.32,x+s2*0.3,y); g.stroke(); } }
  g.fillStyle=c.low; g.fillRect(0,band,W,H-band);
  g.fillStyle=c.rail; g.fillRect(0,band-6,W,8); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(0,band-6,W,2);
}
function paintFloor(g,W,H,f){
  g.setTransform(1,0,0,1,0,0); g.scale(W/256,H/256); W=256; H=256;
  g.fillStyle=f.b; g.fillRect(0,0,W,H);
  if(f.big){ for(let i=0;i<2;i++) for(let j=0;j<2;j++){ g.fillStyle=(i+j)%2?f.a:f.b; g.fillRect(i*128+2,j*128+2,124,124);
      for(let k=0;k<40;k++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.03})`; g.fillRect(i*128+Math.random()*124,j*128+Math.random()*124,6,4); } } }
  else if(f.plate){ g.fillStyle=f.a; g.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=32) for(let x=0;x<W;x+=32){ g.fillStyle=f.b; g.save(); g.translate(x+16,y+16); g.rotate((x/32+y/32)%2?0.7:-0.7);
      g.fillRect(-11,-3,22,6); g.restore(); }
    g.fillStyle='rgba(255,255,255,.08)'; for(let y=0;y<H;y+=32) g.fillRect(0,y,W,1); }
  else if(f.carpet){ g.fillStyle=f.a; g.fillRect(0,0,W,H);
    for(let i=0;i<9000;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.10})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } }
  else if(f.marble){ g.fillStyle=f.a; g.fillRect(0,0,W,H);
    for(let i=0;i<26;i++){ g.strokeStyle=`rgba(120,120,130,${rand(0.06,0.24)})`; g.lineWidth=rand(1,4);
      let x=Math.random()*W, y=Math.random()*H; g.beginPath(); g.moveTo(x,y);
      for(let k=0;k<7;k++){ x+=rand(-50,50); y+=rand(-40,40); g.lineTo(x,y); } g.stroke(); }
    g.strokeStyle='rgba(0,0,0,.14)'; g.lineWidth=2; g.strokeRect(0,0,128,128); g.strokeRect(128,0,128,128); g.strokeRect(0,128,128,128); g.strokeRect(128,128,128,128); }
  else if(f.check){ for(let i=0;i<2;i++) for(let j=0;j<2;j++){ g.fillStyle=(i+j)%2?f.a:f.b; g.fillRect(i*128,j*128,128,128); } }
  else if(f.wood){ for(let r=0;r<8;r++){ const off=(r%2)*40; for(let x=-80;x<W;x+=120){ g.fillStyle=r%2?f.a:f.b; g.fillRect(x+off,r*32,116,30); g.fillStyle='rgba(0,0,0,.14)'; g.fillRect(x+off,r*32+29,116,2); } } }
  else if(f.terra){ g.fillStyle=f.a; g.fillRect(0,0,W,H); for(let i=0;i<420;i++){ g.fillStyle=pick(['#8a8175','#c2452f','#3d5a6c','#d9cdb4','#6b7a52']); g.globalAlpha=0.75; g.save(); g.translate(Math.random()*W,Math.random()*H); g.rotate(Math.random()*3); g.fillRect(-4,-3,8+Math.random()*6,5); g.restore(); } g.globalAlpha=1; }
  else { for(let i=0;i<2;i++) for(let j=0;j<2;j++){ g.fillStyle=f.a; g.fillRect(i*128+1,j*128+1,126,126); for(let k=0;k<70;k++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.045})`; g.fillRect(i*128+Math.random()*124,j*128+Math.random()*124,3,3); } } }
  g.strokeStyle='rgba(0,0,0,.2)'; g.lineWidth=2; g.strokeRect(0,0,128,128); g.strokeRect(128,0,128,128); g.strokeRect(0,128,128,128); g.strokeRect(128,128,128,128);
}
function wallSet(){ return WALLS.find(w=>w.id===S.wall)||WALLS[0]; }
function floorSet(){ return FLOORS.find(f=>f.id===S.floor)||FLOORS[0]; }
function repaint(){
  const w=wallSet(), f=floorSet();
  if(wallTex) redraw(wallTex,(g,W,H)=>paintWall(g,W,H,w));
  if(shopUpper) shopUpper.color=LIN(parseInt(w.up.slice(1),16));
  if(shopLower) shopLower.color=LIN(parseInt(w.low.slice(1),16));
  if(floorTexRef) redraw(floorTexRef,(g,W,H)=>paintFloor(g,W,H,f));
  if(typeof applyReliefs==='function') applyReliefs();
}
/* =========================================================
   Aussenhaut der Gebaeude.

   Vorher lag ueberall dieselbe Ziegeltapete: 256 Pixel, die sich
   alle 1,3 Meter wiederholten. Auf einer 30 Meter langen Hallenwand
   sind das zwei Dutzend sichtbare Naehte, und Ziegel passen ohnehin
   nicht zu einem Fachmarkt.

   Jetzt haengen grossformatige Faserzementtafeln davor. Der Trick
   gegen die Naht: die Kachel ist genau zwei Tafeln breit und die
   Fuge liegt exakt auf dem Kachelrand. Wo sich die Textur
   wiederholt, sitzt also eine Fuge - und Fugen duerfen sich
   wiederholen. Senkrecht laeuft die Kachel ueber die volle
   Wandhoehe und wird geklemmt, damit der dunkle Sockel unten
   bleibt und nicht alle zwei Meter noch einmal auftaucht.
   ========================================================= */
const FASS={b:2.4, h:8.0, sockel:0.62, tafel:1.18};
function fassadeTex(){
  const PXB=256, PXH=1024;                       /* 107 px/m quer, 128 px/m hoch */
  return tex(PXB,PXH,(g,W,H)=>{
    const mx=W/FASS.b, my=H/FASS.h;              /* Pixel je Meter */
    const yv=m=>H-m*my;                          /* Meter ueber Boden -> Pixel */
    /* Grundton der Tafeln, leicht warmes Hellgrau */
    g.fillStyle='#c9cbc7'; g.fillRect(0,0,W,H);
    /* Jede Tafel bekommt ihren eigenen Ton. Quer wechseln nur zwei
       Werte - mehr passt nicht in eine Kachel -, senkrecht laeuft
       die Reihe ueber die ganze Wandhoehe und wiederholt sich
       darum gar nicht. So wirkt die Flaeche wie verlegte Platten
       und nicht wie ein Stueck Pappe. */
    { let sd=7; const rnd=()=>{ sd=(sd*1103515245+12345)&0x7fffffff; return sd/0x7fffffff; };
      for(let m=FASS.sockel;m<FASS.h;m+=FASS.tafel){
        const y0=H-(m+FASS.tafel)*my, y1=H-m*my;
        for(const [xa,xb] of [[0,W/2],[W/2,W]]){
          const t2=(rnd()-0.5)*2;
          g.fillStyle=`rgba(${t2>0?'255,255,255':'96,100,106'},${Math.abs(t2)*0.085})`;
          g.fillRect(xa,y0,xb-xa,y1-y0);
        }
      }
    }
    /* grossflaechige Wolke, damit die Wand nicht wie Pappe wirkt */
    for(let i=0;i<70;i++){
      const r=rand(40,150);
      g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'120,124,128'},${rand(0.012,0.045)})`;
      g.beginPath(); g.ellipse(rand(0,W),rand(0,H),r,r*rand(0.4,1.0),rand(0,3.14),0,Math.PI*2); g.fill();
    }
    /* feines Korn */
    for(let i=0;i<14000;i++){
      g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'90,94,98'},${rand(0.02,0.09)})`;
      g.fillRect(Math.random()*W,Math.random()*H,1,1);
    }
    /* Regenschlieren von den Fugen abwaerts */
    for(let i=0;i<90;i++){
      const x=rand(0,W), y=rand(yv(FASS.h),yv(FASS.sockel)), l=rand(20,140);
      g.fillStyle=`rgba(96,99,104,${rand(0.02,0.06)})`; g.fillRect(x,y,rand(1,3),l);
    }
    /* --- Fugen. Eine senkrechte sitzt auf dem Kachelrand (x=0),
       die zweite in der Mitte. Beide bekommen Tiefe: dunkler
       Schattenkern, rechts eine helle Kante.                     --- */
    const fugeV=x=>{
      const w2=Math.max(2,Math.round(0.022*mx));
      g.fillStyle='rgba(58,60,64,.62)'; g.fillRect(x-w2/2,0,w2,H);
      g.fillStyle='rgba(255,255,255,.22)'; g.fillRect(x+w2/2,0,1.5,H);
      g.fillStyle='rgba(30,32,36,.30)';  g.fillRect(x-w2/2-1.5,0,1.5,H);
    };
    const fugeH=y=>{
      const w2=Math.max(2,Math.round(0.022*my));
      g.fillStyle='rgba(58,60,64,.58)'; g.fillRect(0,y-w2/2,W,w2);
      g.fillStyle='rgba(255,255,255,.20)'; g.fillRect(0,y+w2/2,W,1.5);
    };
    for(let m=FASS.sockel;m<FASS.h+FASS.tafel;m+=FASS.tafel) fugeH(yv(m));
    fugeV(0); fugeV(W/2); fugeV(W);
    /* Nieten an den Tafelecken */
    g.fillStyle='rgba(84,88,94,.5)';
    for(let m=FASS.sockel+0.10;m<FASS.h;m+=FASS.tafel)
      for(const x of [0.12*mx,W/2-0.12*mx,W/2+0.12*mx,W-0.12*mx]){
        g.beginPath(); g.arc(x,yv(m),Math.max(1,0.018*my),0,Math.PI*2); g.fill(); }
    /* --- Sockel: dunkler, rauer, mit Tropfkante und Spritzwasser --- */
    const sy=yv(FASS.sockel);
    g.fillStyle='#3b4049'; g.fillRect(0,sy,W,H-sy);
    for(let i=0;i<5000;i++){
      g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'0,0,0'},${rand(0.02,0.08)})`;
      g.fillRect(Math.random()*W,sy+Math.random()*(H-sy),1,1);
    }
    const sp=g.createLinearGradient(0,H-0.45*my,0,H);
    sp.addColorStop(0,'rgba(24,26,30,0)'); sp.addColorStop(1,'rgba(24,26,30,.55)');
    g.fillStyle=sp; g.fillRect(0,H-0.45*my,W,0.45*my);
    /* Tropfkante als schmales helles Blech ueber dem Sockel */
    g.fillStyle='#9aa0a8'; g.fillRect(0,sy-Math.max(2,0.05*my),W,Math.max(2,0.05*my));
    g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,sy-Math.max(2,0.05*my),W,1.5);
    g.fillStyle='rgba(20,22,26,.45)'; g.fillRect(0,sy,W,2);
  });
}
let wallBrick=null;
function wallBrickMat(){
  if(!wallBrick){
    const t=fassadeTex();
    t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.ClampToEdgeWrapping;
    t.repeat.set(1/FASS.b,1/FASS.h); t.anisotropy=8;
    wallBrick=new THREE.MeshStandardMaterial({map:t,roughness:0.78,metalness:0.04});
  }
  return wallBrick;
}
/* Hof- und Grundstuecksmauern stehen als einfache Kaesten in der
   Welt, ihre UVs laufen von 0 bis 1 je Seite. Deshalb bekommen sie
   ein eigenes Material, dessen Wiederholung aus den Massen kommt:
   Betonfertigteile mit Stossfugen und Abplatzungen. */
function brickMat(len,h){
  const t=tex(256,256,(g,W,H)=>{
    g.fillStyle='#a2a5a4'; g.fillRect(0,0,W,H);
    for(let i=0;i<40;i++){ const r=rand(30,110);
      g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'110,112,116'},${rand(0.02,0.06)})`;
      g.beginPath(); g.ellipse(rand(0,W),rand(0,H),r,r*rand(0.4,1),rand(0,3.14),0,Math.PI*2); g.fill(); }
    for(let i=0;i<9000;i++){
      g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'86,88,92'},${rand(0.02,0.1)})`;
      g.fillRect(Math.random()*W,Math.random()*H,1,1); }
    /* Stossfuge am Kachelrand - dort faellt die Wiederholung nicht auf */
    g.fillStyle='rgba(66,68,72,.55)'; g.fillRect(0,0,4,H); g.fillRect(W-4,0,4,H);
    g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(4,0,1.5,H);
    /* Schalungsstoss waagerecht auf halber Hoehe */
    g.fillStyle='rgba(66,68,72,.35)'; g.fillRect(0,H/2-1.5,W,3);
    /* Ankerloecher der Schalung */
    g.fillStyle='rgba(92,94,98,.45)';
    for(const y of [H*0.22,H*0.72]) for(const x of [W*0.25,W*0.75]){
      g.beginPath(); g.arc(x,y,3,0,Math.PI*2); g.fill(); }
    /* Schmutzrand unten */
    const gr=g.createLinearGradient(0,H-40,0,H);
    gr.addColorStop(0,'rgba(78,76,70,0)'); gr.addColorStop(1,'rgba(78,76,70,.38)');
    g.fillStyle=gr; g.fillRect(0,H-40,W,40);
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8;
  t.repeat.set(Math.max(1,Math.round(len/2.5)),1);
  return new THREE.MeshStandardMaterial({map:t,roughness:0.92,metalness:0.02});
}
const trimMat=std(0xd2d5db,{roughness:0.95});
const lagerWallTex=tex(32,512,(g,W,H)=>{ g.fillStyle='#a3a8b0'; g.fillRect(0,0,W,H); const b=Math.round(H*(1-0.35/WH)); for(let y=b;y<H;y+=16){ g.fillStyle=((y-b)/16)%2<1?'#f2c230':'#1f1f24'; g.fillRect(0,y,W,16);} });
lagerWallTex.wrapS=THREE.RepeatWrapping; lagerWallTex.wrapT=THREE.ClampToEdgeWrapping; lagerWallTex.repeat.set(1/2.6,1/WH);
const lagerWall=new THREE.MeshStandardMaterial({map:lagerWallTex,roughness:0.95});
const lagerUpper=std(0xa3a8b0,{roughness:0.95});
/* Wand-UVs in Metern: dadurch ist die Tapete auf jedem Wandstueck gleich
   gross, die Scheuerleiste laeuft durch und Teilstuecke ueber Tuer oder
   Fenster zeigen genau den passenden Ausschnitt - keine Naehte mehr. */
function meterUV(m){
  const g=m.geometry, p=g.attributes.position, n=g.attributes.normal, uv=g.attributes.uv;
  if(!p||!n||!uv||uv.count!==p.count) return;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i)+m.position.x, y=p.getY(i)+m.position.y, z=p.getZ(i)+m.position.z;
    const ax=Math.abs(n.getX(i)), ay=Math.abs(n.getY(i)), az=Math.abs(n.getZ(i));
    if(ay>ax&&ay>az) uv.setXY(i,x,z);
    else if(ax>az)   uv.setXY(i,z,y);
    else             uv.setXY(i,x,y);
  }
  uv.needsUpdate=true;
}
/* Bodenkacheln in Weltkoordinaten. Der Basisladen ist 16 x 12 m und
   kachelte 8 x 6 mal, also 2 x 2 m. Die Erweiterungen bekamen
   dieselbe Wiederholung auf ihre eigene Groesse - bei Ost I also
   1,5 x 2 m. Genau an der Raumgrenze sprang die Fuge um. Mit UVs in
   Metern liegt das Raster ueber die ganze Flaeche durch. */
function bodenUV(m,kachel){
  const g=m.geometry, p2=g.attributes.position, uv=g.attributes.uv;
  if(!p2||!uv) return m;
  /* Ein Boden liegt immer flach, also um -90 Grad um x gedreht. Aus
     der lokalen (x,y) wird damit die Welt-(x,-y) plus Position -
     ohne Matrizen gerechnet, die kennt der Test-Stub nicht. */
  for(let i=0;i<p2.count;i++)
    uv.setXY(i,(p2.getX(i)+m.position.x)/kachel,(-p2.getY(i)+m.position.z)/kachel);
  uv.needsUpdate=true; return m;
}
const FACE={'+x':0,'-x':1,'+z':4,'-z':5}, OPP={'+x':'-x','-x':'+x','+z':'-z','-z':'+z'};
/* ue: Ueberstand in Laengsrichtung. Er schliesst Haarfugen an den
   Enden einer Wandflucht. Zwischen zwei Stuecken DERSELBEN Flucht
   richtet er Schaden an: die beiden Stuecke ueberlappen sich dann um
   zwoelf Millimeter, ihre Vorderseiten liegen in einer Ebene und
   flimmern gegeneinander - das sind die senkrechten Streifen, die
   ueberall dort standen, wo eine Wand aus Abschnitten gebaut wird.
   Solche Abschnitte setzen ue auf 0. */
function wall(x0,x1,z0,z1,y0,y1,inFace,inMat,exMat,ue,randMat){
  const u=ue===undefined?0.006:ue;
  if(x1-x0>z1-z0){ x0-=u; x1+=u; } else { z0-=u; z1+=u; }
  /* Die vier Schmalseiten sind die Laibung. Sie standen ueberall auf
     hellem Grau; an einer Tuer in einer dunklen Fassade sah das aus
     wie ein weisser Klotz, der vor der Wand steht. Wer eine Oeffnung
     baut, gibt hier das passende Material mit. */
  const rm=randMat||trimMat;
  const w=x1-x0,h=y1-y0,d=z1-z0; const mats=[rm,rm,rm,rm,rm,rm];
  mats[FACE[inFace]]=inMat; mats[FACE[OPP[inFace]]]=exMat||wallBrickMat();
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats); m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);
  meterUV(m);
  m.userData.aabb={x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1)};
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; } scene.add(m); occluders.push(m); return m;
}

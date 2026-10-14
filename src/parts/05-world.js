
/* =========================================================
   Wände, Böden, Welt
   ========================================================= */
const SKY_R=285;
let lapHit, padHit, doorSign, doorSignTex, starsMat, posHit, cardHit, posTex, beltTex, skyGeo, skyMesh=null, starPts=null, lampMats=[], houseMats=[], snowPts;
let grimeMats=[], windowHits=[], winWork=0;
let uhrStd=null, uhrMin=null, uhrSek=null;
let wallTex=null, floorTexRef=null, shopWall=null, floorMat=null;
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
function wallSet(){ return WALLS.find(w=>w.id===S.wall)||WALLS[0]; }
function floorSet(){ return FLOORS.find(f=>f.id===S.floor)||FLOORS[0]; }
/* Streichen und verlegen: die Maler stehen in 05o-oberflaechen */
function repaint(){ oberflaechenAnwenden(); }
/* Aussenhaut der Gebaeude (Faserzementtafeln, fassadeTex/wallBrickMat) und Lagerwand stehen seit 14.10.
   (Fundament Schritt Waende) in der Materialbibliothek: MAT.get('wandFassade') / MAT.get('wandLager'),
   Malcode unveraendert in 01b-material.js (TEXTUR fassade/lagerwand). Waende baut bk.wand (04z). */
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
/* Lagerwand: hell mit gelb-schwarzem Sockelband (Materialbibliothek, Kachel 2,6 x 3,6 m) */
const lagerWall=MAT.get('wandLager');
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
/* ue: Ueberstand in Laengsrichtung. Er schliesst Haarfugen an den
   Enden einer Wandflucht. Zwischen zwei Stuecken DERSELBEN Flucht
   richtet er Schaden an: die beiden Stuecke ueberlappen sich dann um
   zwoelf Millimeter, ihre Vorderseiten liegen in einer Ebene und
   flimmern gegeneinander - das sind die senkrechten Streifen, die
   ueberall dort standen, wo eine Wand aus Abschnitten gebaut wird.
   Solche Abschnitte setzen ue auf 0. */
const WAENDE=[];
/* Huelle (14.10., Fundament Schritt Waende): baut ueber bk.wand (04z) - ein Material je Flaeche,
   hoechstens drei Gruppen, gezeichnet im Wandbild. Die Schmalseiten sind die Laibung; wer eine
   Oeffnung baut, gibt das passende Material mit (randMat), sonst 'laibung'. exMat fehlt = Fassade. */
function wall(x0,x1,z0,z1,y0,y1,inFace,inMat,exMat,ue,randMat){
  return bk.wand({x0,x1,z0,z1,y0,y1,innen:inFace,flaechen:{innen:inMat,aussen:exMat,laibung:randMat},ue});
}

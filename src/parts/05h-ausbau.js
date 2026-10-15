
/* =========================================================
   Ausbau: Die Welt steht von Anfang an in voller Groesse.
   Noch nicht gekaufte Bereiche liegen hinter einer Bauwand und
   sind unsichtbar. Beim Kauf faellt die Wand und der Bereich
   wird freigegeben.
   ========================================================= */
const ZONEN={};
function zone(id){ return ZONEN[id]||(ZONEN[id]={obj:[],cols:[],wand:[],wandCols:[],hooks:[],offen:false}); }
/* Wird nach jedem Oeffnen oder Zuruecksetzen der Zone gerufen */
function zHook(id,fn){ zone(id).hooks.push(fn); }
/* Objekt gehoert zum noch gesperrten Bereich */
function zAdd(id,o){ if(o&&id){ o.visible=false; zone(id).obj.push(o); } return o; }
/* Kollision, die erst nach dem Kauf gilt */
function zCol(id,c){ if(c&&id){ dropCol(c); zone(id).cols.push(c); } return c; }
/* Teil der Bauwand: sichtbar, bis gekauft wird */
function zWand(id,o){ if(o) zone(id).wand.push(o); return o; }
function zWandCol(id,c){ if(c) zone(id).wandCols.push(c); return c; }

function zoneOffen(id){ return !!(S&&S.up&&S.up[id]); }
/* Bereich freigeben: Bauwand weg, Inhalt sichtbar, Kollisionen tauschen */
function oeffneZone(id,leise){
  const z=ZONEN[id]; if(!z||z.offen) return;
  z.offen=true;
  z.wand.forEach(o=>{ o.visible=false; });
  z.wandCols.forEach(c=>dropCol(c));
  z.obj.forEach(o=>{ o.visible=true; });
  z.cols.forEach(c=>{ if(colliders.indexOf(c)<0) colliders.push(c); });
  z.hooks.forEach(fn=>fn());
  if(typeof navDirty==='function') navDirty();
  bk.wandbild();
  if(!leise) sfx.cash();
}
/* Nach dem Laden eines Spielstands alle gekauften Bereiche oeffnen */
function applyZonen(){
  /* Wandbild erst am Ende einmal neu bauen, nicht je geoeffneter Zone (Laden eines Spielstands) */
  bk.WB.halt=true;
  try{
  for(const id in ZONEN){
    const z=ZONEN[id];
    if(zoneOffen(id)) oeffneZone(id,true);
    else { z.offen=false;
      z.wand.forEach(o=>{ o.visible=true; });
      z.obj.forEach(o=>{ o.visible=false; });
      z.cols.forEach(c=>dropCol(c));
      z.wandCols.forEach(c=>{ if(colliders.indexOf(c)<0) colliders.push(c); });
      z.hooks.forEach(fn=>fn()); }
  }
  if(typeof logiAnwenden==='function') logiAnwenden();
  if(typeof navDirty==='function') navDirty();
  } finally { bk.WB.halt=false; }
  bk.wandbild();
}

/* --------------------------------------------------------
   Noch nicht gekaufte Bereiche liegen hinter einer ganz normalen
   Wand: gleiches Material, gleiche Fugen, gleiche Sockelleiste wie
   im uebrigen Raum. Wer den Laden betritt, sieht schlicht eine Wand.
   Beim Kauf faellt sie weg und der Laden ist einfach groesser.
   -------------------------------------------------------- */
let _sockelM=null;
function sockelM(){ if(!_sockelM) _sockelM=MAT.eigen('nachtblau','matt'); return _sockelM; }
/* Eine Wand, die nicht den Blick auf Regale verstellen soll:
   sie liegt nicht in der Liste, die der Zielstrahl abfragt. */
function stilleWand(x0,x1,z0,z1,y0,y1,inFace,inMat,exMat,ue){
  return bk.wand({x0,x1,z0,z1,y0,y1,innen:inFace,flaechen:{innen:inMat,aussen:exMat},ue,still:true});
}
/* Auf welcher Seite einer Wand (-1/+1 entlang ihrer Dicke) klebt die
   Ladentapete? face ist die Innenseite ('-z' = Seite zu kleinerem z). */
function ladenSeiten(face,innen,aussen){
  const si=face[0]==='-'?-1:1, r=[];
  if(innen===shopWall) r.push(si);
  if(aussen===shopWall) r.push(-si);
  return r;
}
/* Scheuerleiste auf einer oder beiden Seiten einer Wandflucht */
/* seiten: nur die Seiten, auf denen Ladentapete klebt. Frueher kam die
   Leiste immer auf beide Seiten - an einer Wand zwischen Laden und
   Lager lag die dunkle Ladenleiste dann im Lager ueber dem gelb-
   schwarzen Sockel (Tom, 01.10.: doppelter Streifen in der Ecke). */
/* Huelle (14.10.): Leisten aus dem Baukasten (bk.sockelleiste), gezeichnet im Wandbild */
function sockelLeiste(id,laengs,fest,a0,a1,seiten){
  for(const s of (seiten||[-1,1])) bk.sockelleiste({laengs,fest,a0,a1,seite:s,zone:id||null});
}
/* Fuellung einer vorbereiteten Oeffnung. laengs = die Wand laeuft in x. */
/* Die Fuellung einer Oeffnung, solange der Bereich dahinter nicht
   gekauft ist. Sie bekommt aussen dasselbe Material wie die Wand,
   in der sie steht. Frueher stand hier aussen||innen - wo die Wand
   nach draussen zeigt, klebte damit die gelbe Lagerwand mitten in
   der Fassade, vom Testfeld aus gut zu sehen. */
function trennwand(id,laengs,fest,a0,a1,h,innen,aussen,face){
  const f=face||(laengs?'-z':'-x');
  const m=laengs
    ? stilleWand(a0,a1,fest-LW/2,fest+LW/2,0,h,f,innen,aussen,0)
    : stilleWand(fest-LW/2,fest+LW/2,a0,a1,0,h,f,innen,aussen,0);
  zWand(id,m);
  sockelLeiste(id,laengs,fest,a0,a1,ladenSeiten(f,innen,aussen));
  zWandCol(id,laengs?col(a0,a1,fest-LW/2,fest+LW/2):col(fest-LW/2,fest+LW/2,a0,a1));
  return m;
}

/* =========================================================
   Die drei Ausbaustufen
   ========================================================= */
/* =========================================================
   Die Ausbaustufen. Jede ist eine Halle: Boden, Decke, Dach,
   Aussenwaende, Sockelleisten, Beleuchtung und Bodenschatten.
   Alles liegt hinter einer Bauwand, bis es gekauft wird.
   ========================================================= */
const SHOP_X2=LAY.shop.x1, LAGER_Z2=LAY.lnord.z1;

let _panelM=null;
/* Streuscheibe der Deckenleuchten (Material; Korpus = MAT.vc('matt'), gleiche Werte wie vorher) */
function deckenPanelMat(){ if(!_panelM) _panelM=new THREE.MeshBasicMaterial({map:deckenDiffuse(),toneMapped:false}); return _panelM; }
/* Deckenleuchten im Raster - baut seit 14.10. bk.lampe({art:'raster'}) (04z, Halle Etappe A).
   Das ganze Raster ist zwei Meshes: Korpus und Leuchtflaeche. */
function leuchtenRaster(id,r,y,ax,az){ return bk.lampe({art:'raster',id,r,y,ax,az,panel:deckenPanelMat()}); }
/* Eine ganze Halle in einem Rutsch.
   aussen sagt, welche Seiten eine echte Aussenwand bekommen;
   die uebrigen grenzen an einen Nachbarbereich. */
function halle(id,r,opt){
  opt=opt||{};
  const H=opt.h||WH;
  const lager=opt.art==='lager';
  const innen=lager?lagerWall:shopWall;
  const ceil=MAT.get('weissMatt');
  const au=opt.aussen||{};
  const ex=opt.ex||undefined;
  /* Boden */
  let bodenMat;
  if(lager) bodenMat=MAT.get('betonBoden');
  else bodenMat=floorMat;
  if(!opt.keinBoden){
    const bo=new THREE.Mesh(new THREE.PlaneGeometry(r.x1-r.x0,r.z1-r.z0),bodenMat);
    bo.rotation.x=-Math.PI/2; bo.position.set((r.x0+r.x1)/2,0.015,(r.z0+r.z1)/2); scene.add(bo);
    if(!lager) bodenUV(bo,BODEN_KACHEL); else MAT.kachel(bo.geometry,(r.x1-r.x0)/2,(r.z1-r.z0)/2);
    zAdd(id,bo);
  }
  /* Decke und Dach */
  if(!opt.keinDeck){
    const ce=new THREE.Mesh(new THREE.PlaneGeometry(r.x1-r.x0+0.3,r.z1-r.z0+0.3),ceil);
    ce.rotation.x=Math.PI/2; ce.position.set((r.x0+r.x1)/2,H-0.01,(r.z0+r.z1)/2); scene.add(ce); zAdd(id,ce);
  }
  /* Die Dachplatte lag 1,5 cm ueber der Decke. Bei 3,6 m Raumhoehe
     faellt das nicht auf, bei zwoelf Metern flimmern die beiden
     Flaechen gegeneinander und die Decke wird streifig. Zehn
     Zentimeter Abstand reichen auf die ganze Hallenlaenge. */
  if(!opt.keinDach) bbox(r.x1-r.x0+LW*3,0.25,r.z1-r.z0+LW*3,MAT.get('anthrazitMatt'),(r.x0+r.x1)/2,H+0.24,(r.z0+r.z1)/2,null,true);
  /* Aussenwaende: stehen immer, auch solange der Bereich gesperrt ist.
     Von der Strasse aus sieht man sonst ein Loch im Gebaeude. */
  if(au.w) wall(r.x0-LW,r.x0,r.z0,r.z1,0,H,'+x',innen,ex);
  if(au.e) wall(r.x1,r.x1+LW,r.z0,r.z1,0,H,'-x',innen,ex);
  if(au.n) wall(r.x0-LW,r.x1+LW,r.z1,r.z1+LW,0,H,'-z',innen,ex);
  if(au.s&&opt.torS){ const T=opt.torS;
    wall(r.x0-LW,T.x0,r.z0-LW,r.z0,0,H,'+z',innen,ex); wall(T.x1,r.x1+LW,r.z0-LW,r.z0,0,H,'+z',innen,ex);
    wall(T.x0,T.x1,r.z0-LW,r.z0,T.h,H,'+z',innen,ex); }
  else if(au.s) wall(r.x0-LW,r.x1+LW,r.z0-LW,r.z0,0,H,'+z',innen,ex);
  if(au.w) col(r.x0-LW,r.x0,r.z0,r.z1);
  if(au.e) col(r.x1,r.x1+LW,r.z0,r.z1);
  if(au.n) col(r.x0-LW,r.x1+LW,r.z1,r.z1+LW);
  if(au.s&&opt.torS){ const T=opt.torS; col(r.x0-LW,T.x0,r.z0-LW,r.z0); col(T.x1,r.x1+LW,r.z0-LW,r.z0); }
  else if(au.s) col(r.x0-LW,r.x1+LW,r.z0-LW,r.z0);
  /* Sockelleisten nur im Laden */
  if(!lager){
    const L=(laengs,a0,a1,x,z)=>bk.sockelleiste({laengs,a0,a1,x,z,versteckt:id});
    if(au.n) L(true,r.x0,r.x1,(r.x0+r.x1)/2,r.z1-0.01);
    if(au.s) L(true,r.x0,r.x1,(r.x0+r.x1)/2,r.z0+0.01);
    if(au.w) L(false,r.z0,r.z1,r.x0+0.01,(r.z0+r.z1)/2);
    if(au.e) L(false,r.z0,r.z1,r.x1-0.01,(r.z0+r.z1)/2);
  }
  if(!opt.keinLicht) leuchtenRaster(id,r,H,opt.ax||(lager?3.6:3.4),opt.az||(lager?4.2:3.6));
  /* Der Bodenschatten gehoert nur an Kanten, an denen dauerhaft
     eine Wand steht - sonst bleibt er nach dem Kauf mitten im
     Raum stehen. */
  /* Die Streifen reichen bis an die Raumgrenze: 2 cm eingerueckt
     blieb zwischen zwei aneinanderstossenden Hallen eine 4 cm breite
     helle Luecke im Schatten an der Fensterfront (Tom, Foto 29.09.) */
  roomAO(r.x0,r.x1,r.z0,r.z1,id,opt.ao||au);
}

/* Eine Wand mit vorbereiteten Durchbruechen. Pfeiler und Sturz
   bleiben stehen, die Fuellungen fallen beim Kauf des Bereichs.
   Solange sie stehen, sieht man ihnen nichts an - es ist dieselbe
   Wand wie daneben, nur eben durchgehend.
   laengs = die Wand laeuft in x-Richtung. */
/* Eine schlanke Stuetze da, wo vorher ein Wandstueck stand. Eine
   Halle von vierzig Metern ganz ohne Stuetze sieht falsch aus, ein
   stehengebliebener Wandklotz aber auch. */
let _stuetzeM=null;
function stuetzeM(){ if(!_stuetzeM) _stuetzeM=MAT.eigen('lichtgrau','kunststoff'); return _stuetzeM; }
function stuetze(x,z,h){
  const g=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,h-0.16,HIQ?18:10),stuetzeM());
  g.position.set(x,(h-0.16)/2,z); if(HIQ){ g.castShadow=true; g.receiveShadow=true; } scene.add(g);
  bbox(0.46,0.1,0.46,MAT.ober('silbergrau','matt'),x,0.05,z,null,false);
  bbox(0.44,0.08,0.44,stuetzeM(),x,h-0.06,z,null,false);
  col(x-0.22,x+0.22,z-0.22,z+0.22);
  return g;
}
function durchbruchWand(id,laengs,fest,von,bis,oeffnungen,mat,exMat,sturzY,hoehe,face,offen){
  const H=hoehe||WH, sy=sturzY||2.7;
  /* Welche Seite der Wand die Innenseite ist, stand bisher fest.
     Die Westwand des Rueckgebaeudes zeigt aber nach +x in den
     Verkaufsraum, nicht nach -x - sonst klebt die Ladentapete
     aussen und die Fassade innen. */
  const f=face||(laengs?'-z':'-x');
  /* Die Stuecke ueberlappen sich um die ueblichen 6 mm. Exakt auf
     Stoss gesetzt blieb an jeder Fuge ein Haarriss, durch den oben
     der helle Himmel schien - eine duenne Linie in der Wand. */
  const w=(a2,b2,y0,y1)=>laengs
    ? wall(a2,b2,fest-LW/2,fest+LW/2,y0,y1,f,mat,exMat,undefined,mat)
    : wall(fest-LW/2,fest+LW/2,a2,b2,y0,y1,f,mat,exMat,undefined,mat);
  const c=(a2,b2)=>laengs?col(a2,b2,fest-LW/2,fest+LW/2):col(fest-LW/2,fest+LW/2,a2,b2);
  const zc=(a2,b2)=>zWandCol(id,c(a2,b2));
  /* offen=true: beim Kauf faellt die ganze Wand, nicht nur die
     Fuellungen. Sonst bleiben bei jeder Erweiterung Pfeiler und ein
     Sturz quer durch den Raum stehen, und der Laden sieht aus wie
     eine Reihe aneinandergehaengter Zimmer statt wie eine Halle.
     Wo sich die Deckenhoehe aendert, muss die Wand stehen bleiben. */
  const teil=(a2,b2,y0,y1)=>{
    const m=w(a2,b2,y0,y1);
    if(offen){ zWand(id,m); if(y0<=0.01) zc(a2,b2); }
    else { if(y0<=0.01) c(a2,b2); }
    if(y0<=0.01) sockelLeiste(offen?id:null,laengs,fest,a2,b2,ladenSeiten(f,mat,exMat));
    return m;
  };
  const saeulen=[];
  let x=von;
  for(const [oa,ob] of oeffnungen){
    if(oa>x){ teil(x,oa,0,H); if(offen&&x>von) saeulen.push((x+oa)/2); }
    teil(oa,ob,sy,H);                    /* Sturz ueber der Oeffnung */
    zc(oa,ob);                           /* sperrt, solange die Fuellung steht */
    trennwand(id,laengs,fest,oa,ob,sy,mat,exMat,f);
    x=ob;
  }
  if(bis>x) teil(x,bis,0,H);
  /* Frueher blieb hier eine Stuetze stehen. Tom will die Flaeche
     ganz frei haben - die Halle traegt sich ueber die Aussenwaende. */
  void saeulen;
}

/* =========================================================
   Zugang zum Testfeld. Bis er gekauft ist, haengt ein rotes
   Absperrband in der Hintertuer - kein Schild, kein Bauzaun, nur
   das Band. Was dahinter steht, sieht man trotzdem: das ist der
   Sinn der Sache.
   ========================================================= */
let tfHit=null;
/* sperrbandTex()/sperrband() entfallen (14.10., Fundament Schritt Zaeune): Absperrband = bk.absperrung (04z) -
   Pfosten in einem Sammler, alle Baender EIN Mesh, Material je Aufdruck einmal (bk.bandMat) */
/* Kapitel 1, Pyro-Kiosk: die Tuer vom Verkauf ins Lager ist mit
   Absperrband zu, wie die Hintertuer zum Testfeld. Man sieht ins
   Lager hinein, kommt aber nicht hin. Die Lieferungen landen solange
   auf der markierten Warenannahme vor der Ladentuer. */
function lagerSperre(){
  const Z='lager';
  const g=new THREE.Group(); g.position.set(-8.0,0,-2.5); g.rotation.y=Math.PI/2; scene.add(g);
  /* Pfosten in den Laibungen der Tuer (frei:false = ohne Fussplatte) */
  bk.absperrung({punkte:[[-0.62,0],[0.62,0]],text:'LAGER · KAPITEL 2',zone:Z,parent:g,frei:false});
  zWandCol(Z,col(-8.3,-7.7,-3.25,-1.75));
  /* Warenannahme auf dem Gehweg: gelbe Markierung mit Schrift */
  /* 02.10. (Tom, Foto): der Gehweg steigt zum Bord hin an (1 cm am Haus,
     12 cm am Bord) - die flach auf 2 cm liegende Markierung verschwand zur
     Strasse hin samt Schrift unter den Platten. Jetzt liegt sie Punkt fuer
     Punkt auf der Gehwegflaeche. */
  { const M=bk.bodenmarkierung({rahmen:[{x0:WA.x-1.35,x1:WA.x+1.35,z0:WA.z-0.875,z1:WA.z+0.875,farbe:'gelb',breite:0.06,strich:0.15,luecke:0.08}],
      schriften:[{text:'WARENANNAHME',x:WA.x,z:WA.z+0.55,b:2.3,h:0.42}],y:0,boden:(x,z)=>(typeof gehwegY==='function'?gehwegY(x,z):0.012)+0.003}).meshes;
    M.forEach(m=>zWand(Z,m)); }
}
/* Warenannahme vor der Tuer: sechs Stellplaetze, gestapelt */
const WA={x:3.5,z:7.75};
const WA_SLOTS=[]; for(let r=0;r<2;r++) for(let c=0;c<3;c++) WA_SLOTS.push({x:WA.x-0.75+c*0.75,z:WA.z-0.42+r*0.84});
function testfeldSperre(){
  const Z='testfeld', a=4.4, b=6.1, z=-6.0;
  /* Zwei Pfosten in den Laibungen, an denen das Band haengt */
  bk.absperrung({punkte:[[a+0.04,z],[b-0.04,z]],text:'TESTFELD GESPERRT',zone:Z,frei:false});
  /* Schild ueber dem Durchgang, wie das Schild an der Lagertuer.
     Es bleibt stehen, auch nachdem der Zugang gekauft ist - es
     sagt, wohin die Tuer fuehrt, nicht dass sie zu ist. */
  bk.schild(scene,{text:'TESTFELD',b:1.4,h:0.35,x:(a+b)/2,y:2.85,z:z+0.12,leucht:true});
  zWandCol(Z,col(a,b,z-0.14,z+0.14));
  tfHit=bbox(b-a-0.1,2.0,0.34,hitM,(a+b)/2,1.0,z,null,false);
  tfHit.userData={kind:'tfsperre'}; zWand(Z,tfHit);
}

/* =========================================================
   Lagergang: der kurze Weg vom Verkauf ins Lager.

   Das Rueckgebaeude liegt ganz im Osten, die Lagerhalle West ganz
   im Westen, dazwischen das Testfeld. Wer eine Palette holen
   wollte, lief vorher quer durch den Basisladen. Der Gang laeuft
   dicht hinter der Rueckwand des Basisladens ueber das Testfeld
   und verbindet beide Seiten direkt.

   Die Hintertuer des Ladens muendet jetzt in den Gang; genau
   gegenueber steht ein Durchgang aufs Testfeld, sodass der
   gewohnte Weg nach draussen unveraendert geradeaus fuehrt.
   Die Huelle steht wie alles andere von Anfang an, nur die beiden
   Kopfenden sind zugesetzt, bis die Lagerhalle West gekauft ist.
   ========================================================= */
const GANG={x0:-7.9, x1:7.8, z0:-8.9, z1:-6.1, h:2.9};
const GANGTUER={a:4.4, b:6.1};        /* fluchtet mit der Hintertuer */
function buildLagergang(){
  /* Der Gang gehoert zum Grosshandel und erscheint mit ihm - er
     ist der kurze Weg vom Rueckgebaeude dorthin. Vorher stand er
     von Tag eins da und die Hintertuer fuehrte in einen Gang, den
     man noch gar nicht gekauft hatte. */
  const Z='lager_west';
  const G=GANG, mitteX=(G.x0+G.x1)/2, mitteZ=(G.z0+G.z1)/2;
  const breite=G.x1-G.x0, tiefe=G.z1-G.z0;
  /* Boden: derselbe Estrich wie im Lager */
  const bo=new THREE.Mesh(MAT.kachel(new THREE.PlaneGeometry(breite,tiefe),breite/2,tiefe/2),
    MAT.get('betonBoden'));
  bo.rotation.x=-Math.PI/2; bo.position.set(mitteX,0.016,mitteZ); scene.add(bo); zAdd(Z,bo);
  /* Decke und Dachrand */
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(breite+0.3,tiefe+0.3),MAT.get('weissMatt'));
  ce.rotation.x=Math.PI/2; ce.position.set(mitteX,G.h-0.01,mitteZ); scene.add(ce); zAdd(Z,ce);
  /* Der Dachrand deckt die Kopf- und Suedwand ab, aber keinen
     Zentimeter mehr: mit dem sonst ueblichen Ueberstand ragte er
     durch die Ostwand der Lagerhalle Sued hinein. */
  /* Dachrand in beiden Richtungen INNERHALB der angrenzenden Waende.
     Lag er mit -5,9 genau in der Ebene der Ladenrueckwand, flimmerte
     er von innen als dunkler Streifen ueber der Uhr. */
  zAdd(Z,bbox(breite+LW,0.25,tiefe+LW,MAT.get('anthrazitMatt'),mitteX,G.h+0.13,mitteZ,null,true));
  /* Suedwand mit dem Durchgang aufs Testfeld. Der Sturz bleibt
     stehen, sonst steht das Dach in der Luft. */
  const zs=G.z0;
  /* Laibung des Testfelddurchgangs in der Fassade, nicht in Grau */
  const lb=bk.flaeche('fassade');
  /* Die Enden stecken bis zur Mitte in den Kopfwaenden. Reichten sie
     bis zu deren Innenflaeche, lag die Stirnseite genau in derselben
     Ebene - in der Halle hinterm Laden und im Lager flimmerte dann
     ein 20 cm breiter, 2,9 m hoher grauer Streifen auf der Wand. */
  zAdd(Z,wall(G.x0-LW/2,GANGTUER.a,zs-LW,zs,0,G.h,'+z',lagerWall,null,0,lb));
  zAdd(Z,wall(GANGTUER.b,G.x1+LW/2,zs-LW,zs,0,G.h,'+z',lagerWall,null,0,lb));
  zAdd(Z,wall(GANGTUER.a,GANGTUER.b,zs-LW,zs,2.5,G.h,'+z',lagerWall,null,0,lb));
  zCol(Z,col(G.x0-LW,GANGTUER.a,zs-LW,zs));
  zCol(Z,col(GANGTUER.b,G.x1+LW,zs-LW,zs));
  /* Innen ueberall dieselbe Wand wie gegenueber: hell mit gelb-
     schwarzem Sockel (Tom, 25.09.). Die Rueckwand des Ladens und die
     beiden Kopfwaende zeigen aussen Fassade, solange der Gang nicht
     steht; mit dem Gang bekommen sie innen eine Verkleidung. */
  const vk=(x0,x1,z0,z1,y0,y1,f)=>zAdd(Z,wall(x0,x1,z0,z1,y0,y1,f,lagerWall,lagerWall,0,lagerWall));
  const zn=G.z1, d=0.02;
  vk(G.x0,HINTERTUER.x0,zn-d,zn,0,G.h,'-z');
  vk(HINTERTUER.x1,G.x1,zn-d,zn,0,G.h,'-z');
  vk(HINTERTUER.x0,HINTERTUER.x1,zn-d,zn,2.5,G.h,'-z');
  vk(G.x1-d,G.x1,G.z0,G.z1,0,G.h,'-x');
  vk(G.x0,G.x0+d,G.z0,G.z0+0.25,0,G.h,'+x');
  vk(G.x0,G.x0+d,G.z1-0.25,G.z1,0,G.h,'+x');
  vk(G.x0,G.x0+d,G.z0+0.25,G.z1-0.25,2.5,G.h,'+x');
  leuchtenRaster(Z,{x0:G.x0,x1:G.x1,z0:G.z0,z1:G.z1},G.h,3.4,2.6);
  roomAO(G.x0+0.02,G.x1-0.02,G.z0+0.02,G.z1-0.02);
  /* Hinweisschild ueber dem Durchgang zum Lager */
  zAdd(Z,bk.schild(scene,{text:'◄  LAGER · GROSSHANDEL',b:1.5,h:0.3,x:mitteX,y:2.45,z:G.z1-0.06,ry:Math.PI,leucht:true,doppel:true}));
}
/* =========================================================
   Schleuse zwischen Lager und Grosshandel. Das Lager ist 6,4 m
   hoch, der Grosshandel zwoelf - direkt aneinander geht das nicht.
   Dazwischen steht ein niedriger Zwischenbau, durch den man von
   einem Gebaeude ins andere geht.
   ========================================================= */
/* =========================================================
   Streifenvorhang. Ein Durchgang zwischen zwei Hallen ist in
   echt nie ein blosses Loch - dort haengt ein Vorhang aus
   PVC-Streifen. Er haelt die Waerme und sieht aus wie das, was
   er ist. Kollision bekommt er keine, man geht hindurch.
   ========================================================= */
function streifenvorhang(zid,laengs,fest,a0,a1,hoehe){
  /* PVC-Streifen mit Traverse: bk.tuer art 'streifen' (04z) - hier nur die Zone (faellt/erscheint mit dem Ausbau) */
  const T=bk.tuer({art:'streifen',laengs,fest,a0,a1,hoehe});
  zAdd(zid,T.traverse); zAdd(zid,T.streifen);
  return T.streifen;
}
function buildSchleuse(){
  const S2=LAY.schleuse, H=SCHLEUSE_H;
  const mx=(S2.x0+S2.x1)/2, mz=(S2.z0+S2.z1)/2;
  const br=S2.x1-S2.x0, ti=S2.z1-S2.z0;
  const bo=new THREE.Mesh(MAT.kachel(new THREE.PlaneGeometry(br,ti),br/2,ti/2),
    MAT.get('betonBoden'));
  bo.rotation.x=-Math.PI/2; bo.position.set(mx,0.016,mz); scene.add(bo);
  /* Die Decke endet buendig in den beiden Gebaeudewaenden. Mit dem
     ueblichen Ueberstand schaute ihre Kante als dunkler Streifen in
     die Lagerhalle hinein. */
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(br-0.2,ti+0.3),MAT.get('weissMatt'));
  ce.rotation.x=Math.PI/2; ce.position.set(mx,H-0.01,mz); scene.add(ce);
  /* Der Dachrand darf nur bis in die Gebaeudewaende reichen. Mit dem
     ueblichen Ueberstand stand er als schwarzer Balken frei in der
     Lagerhalle. */
  /* Der Dachrand endet INNERHALB der beiden Gebaeudewaende. Lag seine
     Kante genau in der Wandebene, flimmerte die dunkle Platte durch
     den Sturz und stand als schwarzer Balken in der Lagerhalle. */
  /* 03.10.: die Westwand der Halle Sued steht jetzt in der Flucht der
     Rolltorwand (-20,1 bis -19,9). Dachrand und Laengswaende enden
     darum in ihrer Mitte (x1 - LW/2), nicht an ihrer Innenseite - sonst
     standen ihre Kanten als helle Streifen und dunkler Balken in der Halle. */
  const xo=S2.x1-LW/2;
  bbox(xo-S2.x0,0.25,ti+LW*2,MAT.get('anthrazitMatt'),(S2.x0+xo)/2,H+0.24,mz,null,true);
  /* Laengswaende. Die Kopfenden sind die Gebaeudewaende selbst. */
  for(const [z0,z1] of [[S2.z0-LW,S2.z0],[S2.z1,S2.z1+LW]]){
    wall(S2.x0,xo,z0,z1,0,H,z0<mz?'+z':'-z',lagerWall);
    col(S2.x0,xo,z0,z1);
  }
  leuchtenRaster(null,S2,H,3.0,3.0);
  roomAO(S2.x0+0.02,S2.x1-0.02,S2.z0+0.02,S2.z1-0.02);
}
/* =========================================================
   Lager-PC (Tom 09.10., vorlaeufig): der Laptop aus der Logistikhalle
   ("Lagerterminal") ist weg. Dafuer steht ein Stehpult-PC im Lager, in
   der Versandecke an der Rueckwand neben dem DDL-Telefon - vom Schleusen-
   tor zur Logistikhalle sind es 15 m, zur Packstation 3 m. Dort steuert
   man Onlineshop, Team und Bestellungen (17-laptop, GERAETE.lager).
   Der Platz liegt im Versandbereich (PACK_FL) und bleibt frei.
   Dazu im Laden ein Tablet an der Wand neben der Hintertuer: Ware bestellen.
   ========================================================= */
let lapHit2=null, tabHit=null;
const LAGERPC={x:-14.55,z:-29.6};
function buildLagerTerminal(){
  const g=new THREE.Group(); g.position.set(LAGERPC.x,0,LAGERPC.z); scene.add(g); zAdd('lager_sued2',g);
  g.userData.inventar=true;
  const VC=[], B=(w,h,d,c,x,y,z,rx,ry,rz)=>VC.push({geo:roundedBoxGeo(w,h,d,Math.min(0.01,Math.min(w,h,d)*0.2),2),m:tm(x,y,z,rx,ry,rz),color:c});
  const STAHL=MAT.farbe('mittelgrau'), DUNKEL=MAT.farbe('anthrazit'), PLATTE=MAT.farbe('aluminium'), BLAU=MAT.farbe('signalblau');
  /* Stehpult: Saeule mit Fuss, schraege Platte, Ablage, Monitor am Arm */
  B(0.62,0.04,0.46,DUNKEL,0,0.02,0.04); B(0.09,1.02,0.09,STAHL,0,0.53,-0.02);
  B(0.72,0.035,0.42,PLATTE,0,1.06,0.06,-0.18,0,0); B(0.72,0.03,0.04,DUNKEL,0,1.03,0.27,-0.18,0,0);
  B(0.5,0.03,0.3,STAHL,0,0.42,0.02); B(0.36,0.42,0.26,DUNKEL,0.1,0.21,0.0);
  B(0.04,0.36,0.04,STAHL,0,1.28,-0.12); B(0.56,0.36,0.035,MAT.farbe('tiefschwarz'),0,1.48,-0.08);
  B(0.44,0.02,0.15,MAT.farbe('gummischwarz'),-0.02,1.095,0.09,-0.18,0,0); B(0.07,0.02,0.1,MAT.farbe('gummischwarz'),0.28,1.09,0.12,-0.18,0,0);
  /* Etikettendrucker und Handscanner im Halter */
  B(0.18,0.14,0.2,MAT.farbe('weiss'),-0.48,1.0,0.04); B(0.12,0.01,0.1,MAT.farbe('cremeweiss'),-0.48,1.075,0.04);
  B(0.05,0.16,0.05,MAT.farbe('signalgelb'),0.4,1.16,0.12,0.4,0,0);
  /* Schild an der Wand */
  B(0.62,0.16,0.02,BLAU,0,1.95,-0.27);
  const m=new THREE.Mesh(merge(VC),vcMat); if(HIQ){ m.castShadow=true; m.receiveShadow=true; } g.add(m);
  const sch=neuerSchoner(480,304,'Lager-PC');
  const sc=plane(0.52,0.32,new THREE.MeshBasicMaterial({toneMapped:false,map:sch.t}),0,1.48,-0.06,0,g); sch.mesh=sc;
  bk.schild(g,{text:'LAGER-PC',stil:'info',b:0.6,h:0.15,px:0.5,y:1.95,z:-0.258,leucht:true});
  lapHit2=bbox(0.9,1.4,0.8,hitM,0,0.95,0.1,g,false);
  lapHit2.userData={kind:'laptop2'};
  zCol('lager_sued2',col(LAGERPC.x-0.36,LAGERPC.x+0.36,LAGERPC.z-0.32,LAGERPC.z+0.33));
  buildTablet();
}
/* Tablet im Laden, an der Rueckwand rechts neben der Hintertuer zum Testfeld */
function buildTablet(){
  const g=new THREE.Group(); g.position.set(7.0,0,-5.86); scene.add(g);
  const dunkel=MAT.get('lackSchwarz');
  bbox(0.07,0.32,0.03,MAT.ober('silbergrau','blank'),0,1.32,0.02,g,false);
  const t=bbox(0.32,0.22,0.018,dunkel,0,1.42,0.05,g,false); t.rotation.x=-0.18;
  const sch=neuerSchoner(320,220,'Bestellen');
  const sc=plane(0.29,0.19,new THREE.MeshBasicMaterial({toneMapped:false,map:sch.t}),0,1.42,0.061,0,g); sc.rotation.x=-0.18; sch.mesh=sc;
  tabHit=bbox(0.5,0.5,0.4,hitM,0,1.4,0.2,g,false); tabHit.userData={kind:'tablet'};
}
/* =========================================================
   Bauabschnitte. Vor jeder noch nicht gekauften Flaeche steht ab
   Tag eins eine Bautafel und ein Absperrband: man sieht, was
   dahinter entsteht, wie gross es wird und ab welchem Level es
   zu haben ist. Damit weiss man mit Level 1 schon, wohin die
   Reise geht, statt vor einer stummen Wand zu stehen.
   ========================================================= */
/* =========================================================
   Fugenfueller.

   Zwei Bauabschnitte stossen auf den Millimeter aneinander: der
   Boden des Basisladens endet bei x 8,00 und der des Anbaus faengt
   dort an. Zwischen zwei exakt aneinandergrenzenden Flaechen
   bleibt beim Rastern eine Haarfuge stehen, und durch die sieht
   man den Untergrund - als heller Strich quer durch den Laden.
   Unter allen Boeden liegt deshalb eine durchgehende Platte aus
   demselben Material; die Fuge zeigt dann wieder nur Boden. Fuer
   die Decke gilt dasselbe, dort liegt die Fuellplatte hoeher.
   Die Platten liegen immer unter beziehungsweise ueber den
   echten Flaechen und sind darum nie direkt zu sehen.
   ========================================================= */
function fugenPlatte(r,mat,y,decke,kachel){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(r.x1-r.x0+0.4,r.z1-r.z0+0.4),mat);
  m.rotation.x=decke?Math.PI/2:-Math.PI/2;
  m.position.set((r.x0+r.x1)/2,y,(r.z0+r.z1)/2);
  scene.add(m);
  if(kachel) bodenUV(m,kachel);
  return m;
}
function fugenfueller(){
  const ceil=MAT.get('weissMatt');
  /* Verkauf: Basis, Ost I und Ost II liegen in einer Flucht, das
     Rueckgebaeude haengt darunter. Die zweite Platte liegt einen
     Millimeter tiefer, damit sich die beiden im Ueberlappungs-
     streifen nicht gegenseitig zerflimmern. */
  fugenPlatte({x0:-7.9,x1:37.9,z0:-5.9,z1:5.9},floorMat,0.012,false,BODEN_KACHEL);
  fugenPlatte({x0: 8.0,x1:37.9,z0:-21.9,z1:-5.9},floorMat,0.011,false,BODEN_KACHEL);
  fugenPlatte({x0:-7.9,x1:37.9,z0:-5.9,z1:5.9},ceil,WH-0.006,true);
  fugenPlatte({x0: 8.0,x1:37.9,z0:-21.9,z1:-5.9},ceil,WH-0.0065,true);
  /* Lager: Basislager mit Anbau Nord, dazu die Halle Sued */
  const bet=()=>MAT.get('betonBoden');
  const l1={x0:-19.9,x1:-8.1,z0:-5.9,z1:5.9}, l2={x0:-19.9,x1:-8.1,z0:-29.9,z1:-5.9};
  MAT.kachel(fugenPlatte(l1,bet(),0.012,false).geometry,(l1.x1-l1.x0)/2,(l1.z1-l1.z0)/2);
  MAT.kachel(fugenPlatte(l2,bet(),0.011,false).geometry,(l2.x1-l2.x0)/2,(l2.z1-l2.z0)/2);
  /* Das ganze Lager liegt jetzt auf einer Deckenhoehe - eine
     durchgehende Platte darueber schliesst die Haarfugen zwischen
     den einzelnen Deckenfeldern. */
  fugenPlatte({x0:-19.9,x1:-8.1,z0:-29.9,z1:5.9},ceil,LAGER_H-0.006,true);
}
function buildAusbau(){
  fugenfueller();
  /* ---------- Verkaufsflaeche ----------
     Die Front uebernimmt die Nachbarfassade (05e), deshalb bekommen
     Ost I und Ost II von der Halle keine Nordwand. */
  halle('shop_gross',LAY.ost1,{aussen:{},ao:{n:true}});
  halle('shop_ost',  LAY.ost2,{aussen:{e:true},ao:{n:true,e:true}});
  halle('shop_sued', LAY.sued,{aussen:{s:true,e:true},ao:{s:true,e:true,w:true}});
  /* Innenwaende zwischen zwei Verkaufsraeumen: auf beiden Seiten
     Ladentapete, sonst schaut man von drinnen auf Backstein. */
  durchbruchWand('shop_ost',false,LAY.ost1.x1,LAY.ost1.z0,LAY.ost1.z1,[[-4.2,4.2]],shopWall,shopWall,null,null,null,true);
  /* 29.09. (Tom, Foto): die Wand steht 10 cm suedlicher als die Mitte
     der Linie. Mittig auf z=-5,9 stand ihre Nordseite 10 cm vor der
     Rueckwand des Ladenlokals - bei x=8 eine senkrechte Stufe gleich
     hinter der Testfeldtuer. Jetzt fluchtet sie mit der Rueckwand. */
  durchbruchWand('shop_sued',true,LAY.sued.z1-LW/2,LAY.sued.x0,LAY.sued.x1,[[10.0,17.0],[24.0,32.0]],shopWall,shopWall,null,null,null,true);
  /* Die beiden ersten Durchbrueche stehen schon in 05c beziehungsweise
     im Dock - hier kommt nur die Fuellung in die Oeffnung. */
  trennwand('shop_gross',false,8.0,-4.4,4.4,2.7,shopWall,shopWall);
  /* Das Ladenlokal ist am Anfang nur zur Haelfte ausgebaut: eine
     Trennwand auf halber Tiefe, oestlich davon das zweite
     Schaufenster und die Tuer zum Testfeld. Beim Kauf faellt die
     Wand ganz weg. */
  durchbruchWand('shop_halb',false,SHOP_HALB,LAY.basis.z0,LAY.basis.z1,[],shopWall,shopWall,2.7,WH,'-x',true);

  /* ---------- Lager ----------
     Am Anfang gehoert nur der Raum am Rolltor dazu. Der Nordteil
     liegt dahinter und wird als erste Ausbaustufe gekauft; die
     Wand faellt dann ganz, damit ein Raum entsteht. */
  /* Boden, Decke und Westwand zieht 05c in einem Stueck ueber das
     ganze Basislager; von hier kommt nur noch die Nordwand.
     Vorher stand auch die Westwand doppelt - zwei Flaechen genau
     aufeinander, die gegeneinander flimmerten und an der
     Stossstelle eine senkrechte Naht hinterliessen. */
  /* Die Nordwand baut lagerFensterWand() - mit drei echten Fenstern
     zur Strasse, die man auch von innen sieht. */
  lagerFensterWand();
  halle(null,LAY.lnord,{art:'lager',aussen:{},ao:{},h:LAGER_H,
    keinDach:true,keinDeck:true,keinBoden:true,keinLicht:true});
  /* Die Halle Sued in drei Abschnitten. Alle drei sind gleich
     hoch, damit zwischen ihnen keine Wand stehen bleiben muss. */
  halle('lager_gross',LAY.ls1,{art:'lager',ao:{w:true,e:true},h:HALLE_H});
  halle('lager_sued', LAY.ls2,{art:'lager',ao:{w:true,e:true},h:HALLE_H});
  halle('lager_sued2',LAY.ls3,{art:'lager',aussen:{s:true},ao:{s:true,w:true,e:true},h:HALLE_H,
    /* Versandtor V1 in der Rueckwand (11e): 3,26 m breit, 3 m hoch */
    torS:{x0:V1.x-V1.w/2,x1:V1.x+V1.w/2,h:V1.h}});
  /* Der Grosshandel ist ein eigenes Gebaeude: 1520 m2 und zwoelf
     Meter licht, damit Palettenregale und ein Hubwagen hineinpassen.
     Die Westwand mit den Ladetoren baut westWand(). */
  /* Die Logistikhalle baut buildLogistikHalle() in drei Stufen. */
  /* Vom Rolltor in die Halle Sued. Das ganze Lager hat jetzt
     dieselbe Hoehe, darum faellt diese Wand beim Kauf komplett
     weg (offen=true) - kein Sturz, kein Pfeiler, ein Raum. */
  durchbruchWand('lager_gross',true,LAY.lbasis.z0,LAY.lbasis.x0,LAY.lbasis.x1,[[-18.7,-9.3]],lagerWall,lagerWall,3.3,LAGER_H,null,true);
  /* Die Wand zum Nordteil: steht am Anfang durch, faellt beim Kauf
     ganz weg. Danach ist das Basislager ein Raum von der Suedwand
     bis zur Nordwand. */
  durchbruchWand('lager_nord',true,LAY.lbasis.z1,LAY.lbasis.x0,LAY.lbasis.x1,[],lagerWall,lagerWall,3.3,LAGER_H,null,true);
  /* Zwischen den drei Abschnitten faellt die Wand beim Kauf ganz
     weg (offen=true) - am Ende steht eine durchgehende Halle ohne
     Pfeiler und Sturz quer im Raum. */
  durchbruchWand('lager_sued', true,LAY.ls1.z0,LAY.ls1.x0,LAY.ls1.x1,[[-18.7,-9.3]],lagerWall,lagerWall,3.3,HALLE_H,null,true);
  durchbruchWand('lager_sued2',true,LAY.ls2.z0,LAY.ls2.x0,LAY.ls2.x1,[[-18.7,-9.3]],lagerWall,lagerWall,3.3,HALLE_H,null,true);
  /* Halle Sued und Grosshandel stehen nicht mehr aneinander, zwischen
     ihnen liegen sechs Meter Hof. Beide bekommen eine Aussenwand mit
     einer Tuer in die Schleuse. */
  const ST=[[LAY.schleuse.z0+1.6,LAY.schleuse.z1-1.6]];
  /* Innenseite der Halle Sued liegt oestlich dieser Wand, also '+x' -
     mit dem Standardwert klebte die Aussenfassade innen im Lager. */
  /* 03.10. (Tom, Foto): die Wand stand mittig auf x0 und ragte damit
     10 cm weiter in die Halle als die Westwand des Rolltor-Raums (05c,
     -20,1 bis -19,9) - rechts neben dem Rolltor sprang sie sichtbar vor.
     Jetzt dieselbe Flucht innen und aussen; sie endet dort, wo die
     Rolltorwand beginnt (z -6,1), mit den ueblichen 6 mm Ueberlappung. */
  /* 14.10. (Halle Etappe A): Ostwand von ②, alte Schleuse und ihre Streifenvorhaenge verschwinden mit dem
     Ausbau "lagerlogistik" (neue Schleuse z −29,9…−17, ③ offen zu ②) - darum gesammelt in llAltSammle (05q) */
  llAltSammle(()=>{
  durchbruchWand('lager_west',false,LAY.lsued.x0-LW/2,LAY.lsued.z0,-6.1+0.006,ST,lagerWall,undefined,3.0,HALLE_H,'+x');
  /* Nur das Stueck in der Schleuse zeigt nach aussen in den Gang -
     dort gehoert die Lagerwand hin, sonst stossen im Gang zwei
     verschiedene Waende aneinander. Der lange Rest steht im Hof und
     bekommt dieselbe Aussenhaut wie die uebrige Halle; vorher zog
     sich die gelbe Lagerwand ueber die ganze Ostseite ins Freie. */
  buildSchleuse();
  /* Die beiden Schleusentore und der Gang bekommen Streifenvorhaenge
     statt blanker Loecher. */
  streifenvorhang('lager_west',false,LAY.lsued.x0-LW/2,ST[0][0],ST[0][1],3.0);
  streifenvorhang('lager_west',false,LAY.lwest.x1,ST[0][0],ST[0][1],3.0);
  });

  /* ---------- Packstation, Rampen, Logistikzentrum ---------- */
  /* Die beiden Kopfwaende des Lagergangs. Sie ersetzen die
     Westwand des Rueckgebaeudes und die Ostwand der Halle Sued;
     beide bekommen an der Stelle des Gangs eine Oeffnung, die
     zusammen mit der Lagerhalle West freigegeben wird. */
  const GT=[[GANG.z0+0.25,GANG.z1-0.25]];
  /* Zum Rueckgebaeude gibt es bewusst keine Tuer: vom Verkauf geht es
     nur ueber das Lager weiter, nicht quer durch den Gang. Die
     Westwand des Rueckgebaeudes bleibt darum geschlossen. */
  /* Westwand des Rueckgebaeudes. Nur das kurze Stueck, das im
     Lagergang steht, traegt aussen die Lagerwand mit dem gelben
     Streifen - der Rest steht am Testfeld im Freien und bekommt die
     Fassade. Vorher lief der gelbe Streifen aussen ums Gebaeude. */
  durchbruchWand('shop_sued',false,7.9,LAY.sued.z0,GANG.z0,[],shopWall,undefined,2.5,WH,'+x');
  /* Im Gangstreifen steht die Ostwand des Ladens. Sie zeigt dort
     nach draussen, solange der Gang nicht gebaut ist, und danach in
     einen Gang zwischen zwei Gebaeuden - beides ist Fassade, nicht
     gelbe Lagerwand. */
  durchbruchWand('shop_sued',false,7.9,GANG.z0,GANG.z1,[],shopWall,undefined,2.5,WH,'+x');
  /* endet 12 mm vor der Ladenflucht: mit den ueblichen 6 mm Ueberstand
     ragte das Stueck sonst 6 mm aus der Rueckwand - als feine
     senkrechte Linie gleich hinter der Testfeldtuer (Tom, 29.09.) */
  durchbruchWand('shop_sued',false,7.9,GANG.z1,LAY.sued.z1-0.012,[],shopWall,undefined,2.5,WH,'+x');
  /* Der Gang muendet in die Halle Sued und wird mit ihr freigegeben. */
  /* Der Gang muendet in den ersten Abschnitt der Halle Sued, wird
     aber erst mit dem Grosshandel geoeffnet - vorher fuehrt er
     nirgendwohin. */
  /* endet wie die Westwand an der Rolltor-Raumwand (z -6,1) - vorher
     lagen beide 20 cm deckungsgleich uebereinander */
  durchbruchWand('lager_west',false,-8.0,LAY.lsued.z0,-6.1+0.006,GT,lagerWall,undefined,2.5,HALLE_H,'-x');
  streifenvorhang('lager_west',false,-8.0,GT[0][0],GT[0][1],2.5);
  buildLagergang();
  testfeldSperre();
  lagerSperre();
  buildLagerTerminal();
  buildPackstation();
  buildVersandhof();
  buildLogistikHalle();
  buildLogistik();
  buildLagerlogistik();
  buildWerk();
}

/* =========================================================
   Packstation (Tom, 05.10.): Packplaetze an einem Foerderband, das
   auf eigenen Fuessen am Boden steht, und am Ende eine Palettier-
   station. Das fertige Paket rutscht vom Packtisch aufs Band, laeuft
   bis an den Endanschlag, und ein Portalgreifer setzt es auf eine
   Palette - Lage fuer Lage, jedes Paket mit der Unterkante auf
   Palette oder Paket darunter. Vorher lief es ueber eine kurze
   Rollenbahn und flog im hohen Bogen auf Stapel am Boden, die teils
   in der Luft hingen.
   Drei Stufen: 1, 2 oder 3 Packplaetze (je mit Packmaterial-Regal und
   Wagen), 2, 4 oder 6 Paletten unter dem Portal.
   Gruppenkoordinaten: x nach Osten, z nach Norden. Das Band laeuft von
   Osten nach Westen; die Palettierstation steht an der Westwand.
   06.10.: Die Station haelt den Weg in die Halle frei. Vorher reichte
   sie bis an das erste Lagerregal im Osten und mit der Palettierstation
   mitten in den Mittelgang - in der Vorfuehrung war die ganze hintere
   Halle samt Logistikhalle abgeschnitten, und die Packer liefen ewig
   gegen die Wand. Jetzt bleiben oestlich der Station 1,7 m Gang frei,
   und nach Sueden waechst sie nur an der Westwand, auf dem Stellplatz
   des Lagerregals dort (ab Stufe 2).
   ========================================================= */
let packHit=null, packTisch=null, packMov=null;
/* 07.10. (Tom, Ausbauplan): die Versandecke steht am hinteren Ende von Lager Sued 3,
   gedreht - die offene Seite der gelben Box zeigt zum Rolltor V1 in der Rueckwand */
/* 1,2 m von der Rueckwand weg: zwischen Rollwagen und Wand blieb sonst nur eine Gasse von 0,4 m, die Packer
   und ihre Wagen quetschte (Wagen drehte durch den Tisch, Packer 3 lief durch den Parkplatz) */
/* 09.10. (Tom, Foto versand-0910): das ganze Konstrukt 1 m weiter Richtung Lager - vor dem Rolltor V1
   bleibt eine abgesperrte Ladezone, die Packer haben zwischen Tisch und Rueckwand 2,3 m statt 1,2 m */
const PACK_HOME={x:-11.6,z:-26.3,ry:Math.PI};
/* Packplaetze: Tischmitte und Seite. s 1: Tisch noerdlich am Band, der
   Packer steht noerdlich davor; s -1: gespiegelt suedlich des Bandes.
   Platzkoordinaten (px,pz): Tischmitte 0/0, +pz zeigt zum Packer. */
const VS_PP=[{x:3.25,z:-0.19,s:1},{x:3.25,z:-1.77,s:-1},{x:1.3,z:-0.19,s:1}];
const VS_PZ=-0.19, VS_TOP=0.95, VS_TB=1.2;
function ppW(i,px,pz){ const q=VS_PP[i]; return {x:q.x+px,z:q.z+q.s*pz}; }
function ppRy(i,ry){ return VS_PP[i].s>0?ry:Math.PI-ry; }
/* Foerderband: Gurt von x1 (Osten) bis stau, dann Staurollenbahn bis
   zum Endanschlag bei x0. Oberkante wie die Tischplatte - das Paket wird
   eben hinuebergeschoben. */
const BAND={x0:0.0,x1:4.05,z:-0.98,b:0.7,y:VS_TOP,stau:1.2};
/* Palettierstation je Stufe, an der Westwand (Gruppe; in der Welt die Ostseite).
   09.10. (Tom): 1/2/3 Paletten, der Kran ab Stufe 1. Die Box (Zaun) waechst je Stufe um
   einen Palettenplatz nach hinten; das Portal muss immer bis ueber das Bandende reichen
   (Band bei z -0,98) und waechst erst mit der dritten Palette mit. */
const ZELLE=[null,{x0:-1.75,x1:-0.05,z0:-0.15,z1:1.2},{x0:-1.75,x1:-0.05,z0:-1.05,z1:1.2},{x0:-1.75,x1:-0.05,z0:-1.95,z1:1.2}];
const PORTAL_Z0=[0,-1.45,-1.45,-1.95];
const ZELLE_Z1=1.2, PORTAL_Y=2.55;
/* Europaletten 1,2 x 0,8 m, die lange Seite quer zur Wand, Reihen nach Sueden */
const PALETTEN=[0.65,-0.25,-1.15].map(z=>({x:-0.9,z}));
const PAL_N=[0,1,2,3], PAL_H=0.144;
/* Versandbereich (09.10., Tom): die ganze Flaeche, in die Box, Kran und Packplaetze bis
   Stufe 3 wachsen, dazu die Ladezone vor V1 und der Gang hinter den Tischen - von Anfang
   an reserviert, dort stellt man keine Regale und Moebel ab (spotFree, versandBereichRaeumen).
   Gruppenkoordinaten: x -3,5 ist die Hallen-Ostwand, z 3,6 die Rueckwand. */
const PACK_FL={x0:-3.5,x1:4.25,z0:-3.3,z1:3.6};
/* Ladezone vor V1: Ostwand bis zum Westzaun, Rueckwand bis zur Boxfront (Gruppe) */
const LADEZONE={x0:-3.5,x1:0.45,z0:ZELLE_Z1,z1:3.6};
function packStufe(){ return !S||!S.up?1:S.up.packstation3?3:S.up.packstation2?2:1; }
/* Ab Stufe 2 steht die Palettierstation auf dem Stellplatz des
   Lagerregals an der Westwand (02-data: RACKS mit pack) */
function packRegalImWeg(st){
  for(const sl of RACKS){ if(!sl.pack||sl.pack>st) continue;
    const r=racks.find(rk=>Math.hypot(rk.g.position.x-sl.x,rk.g.position.z-sl.z)<1.2); if(r) return r; }
  return null;
}
/* Gitter (Tom 09.10.: "Absperrungen in Gelb, im Stil der Gitterbox"): Drahtgitter als
   Alpha-Textur, der Massstab steckt in den UVs - ein Material fuer alle Felder */
/* gitterGeo()/gitterZaun() entfallen (14.10., Fundament Schritt Zaeune): gelbes Schutzgitter und Gelaender =
   bk.zaun({art:'gitter'|'gelaender', S}) (04z). Die Packstation sammelt ihre Teile je Stufe selbst (VC,
   Vertexfarben) - bk.zaun legt Pfosten und Holme dort hinein, das Gitter wird ein eigenes Mesh. */
function vsZaunS(B,k){ return {box:(w,h,d,x,y,z,c,kl,rx,ry,rz)=>B(k,w,h,d,c,x,y,z,rx,ry,rz)}; }
/* Versandbereich am Boden (Tom 09.10.: "gelbe Linie/Schraffur, keine Schrift"): hier waechst
   die Station noch hin - Regale und Moebel kommen dort nicht hin (PACK_FL) */
function versandReserve(x0,x1,z0,z1,g){
  /* gestrichelter Rand und Freihalte-Schraffur (bk.bodenmarkierung, vorher reserveTex je Flaeche) */
  const X0=Math.min(x0,x1), X1=Math.max(x0,x1), Z0=Math.min(z0,z1), Z1=Math.max(z0,z1);
  return bk.bodenmarkierung({rahmen:[{x0:X0,x1:X1,z0:Z0,z1:Z1,farbe:'gelb',breite:0.06,strich:0.3,luecke:0.15}],flaechen:[{x0:X0+0.08,x1:X1-0.08,z0:Z0+0.08,z1:Z1-0.08,art:'frei'}],parent:g,y:0.017}).meshes;
}
/* Ladezone vor Rolltor V1 (Tom 09.10.): Spieler, Personal und Kunden kommen nicht vor das
   Tor - links und rechts gelbe Gitterabsperrung, dazwischen die offene Seite der Box. Nur
   der DDL-Fahrer faehrt hier mit dem Hubwagen (11e, ohne Wegraster). Gruppenkoordinaten. */
const LZ_ZAUN=[
  {ax:LADEZONE.x1,az:LADEZONE.z1-0.06,bx:LADEZONE.x1,bz:ZELLE_Z1+0.03},          /* West: Rueckwand bis Boxecke */
  {ax:LADEZONE.x1,az:ZELLE_Z1+0.03,bx:ZELLE[1].x1+0.02,bz:ZELLE_Z1+0.03},         /* Ecke zur Box */
  {ax:ZELLE[1].x0-0.02,az:ZELLE_Z1+0.03,bx:LADEZONE.x0+0.05,bz:ZELLE_Z1+0.03}];   /* Ost: Box bis Hallenwand */
function ladezoneRechtecke(){ return LZ_ZAUN.map(f=>({x0:Math.min(f.ax,f.bx)-0.06,x1:Math.max(f.ax,f.bx)+0.06,z0:Math.min(f.az,f.bz)-0.06,z1:Math.max(f.az,f.bz)+0.06})); }
function ladezoneBauen(g,B){
  for(const f of LZ_ZAUN) bk.zaun({art:'gitter',von:[f.ax,f.az],bis:[f.bx,f.bz],hoehe:1.25,S:vsZaunS(B,'lz'),parent:g});
  /* Sperrflaeche am Boden: Warnrand gelb-schwarz, innen gelbe Schraffur (bk.bodenmarkierung) */
  const x0=LADEZONE.x0+0.05, x1=LADEZONE.x1-0.08, z0=ZELLE_Z1+0.1, z1=LADEZONE.z1-0.05;
  bk.bodenmarkierung({rahmen:[{x0,x1,z0,z1,farbe:'sperr',breite:0.08}],flaechen:[{x0:x0+0.08,x1:x1-0.08,z0:z0+0.08,z1:z1-0.08,art:'frei'}],parent:g,y:0.016});
}
/* Teile je Stufe: ab[s] gilt ab Stufe s, nur[s] genau in Stufe s */
const packTeile={ab:[null,[],[],[]],nur:[null,[],[],[]],hits:[],portal:null};
function buildPackstation(){
  /* Die Packstation steht im ersten Abschnitt der Halle Sued, gleich
     hinter dem Rolltor, die Westkante an der Wand. Sie steht von Anfang
     an da - bis zum Kauf haengt ein Absperrband davor. */
  const id='packstation', PX=PACK_HOME.x, PZ=PACK_HOME.z;
  const g=new THREE.Group(); g.position.set(PX,0,PZ); scene.add(g);
  packTisch=g;
  const T=packTeile;
  /* Gestelle, Beine, Portal und Zaunpfosten: je Sichtbarkeit ein Mesh
     mit Vertexfarben - sonst waeren es ein paar hundert Zeichenaufrufe */
  const VC={}, vc=k=>VC[k]||(VC[k]=[]);
  /* Ultra Low: einfache Quader statt gefaster Kanten (12 statt rund 150 Dreiecke je Teil) */
  const UL=GFX==='ultralow';
  const B=(k,w,h,d,c,x,y,z,rx,ry,rz)=>vc(k).push({geo:UL?new THREE.BoxGeometry(w,h,d):roundedBoxGeo(w,h,d,Math.min(0.01,Math.min(w,h,d)*0.2),2),m:tm(x,y,z,rx,ry,rz),color:c});
  const Cy=(k,r,h,c,x,y,z,rx,ry,rz,seg)=>vc(k).push({geo:new THREE.CylinderGeometry(r,r,h,seg||10),m:tm(x,y,z,rx,ry,rz),color:c});
  const STAHL=MAT.farbe('silbergrau'), DUNKEL=MAT.farbe('anthrazit'), GELB=MAT.farbe('signalgelb'), ZINK=MAT.farbe('hellgrau'), HOLZ=MAT.farbe('holzPalette'), HOLZ2=MAT.farbe('holzPaletteDunkel');
  /* userData.stufe: die Handy-Vorfuehrung (gpStatisch) fasst solche Teile
     nicht zusammen - sonst liessen sie sich nicht mehr ein- und ausblenden */
  const reg=(o,k)=>{ const s=+k.slice(-1); (k.indexOf('nur')===0?T.nur:T.ab)[s].push(o); if(o.userData&&!o.userData.kind) o.userData.stufe=k; return o; };
  const platte=new THREE.MeshStandardMaterial({roughness:0.42,metalness:0.12,
    map:(()=>{ const t=tex(512,256,(c,W,H)=>{
      const gr=c.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#cdd3dc'); gr.addColorStop(1,'#aeb5c0');
      c.fillStyle=gr; c.fillRect(0,0,W,H);
      for(let i=0;i<1800;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.04})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
      for(let i=0;i<30;i++){ c.strokeStyle=`rgba(120,128,140,${rand(0.05,0.18)})`; c.lineWidth=rand(0.5,1.4);
        const x=Math.random()*W,y=Math.random()*H; c.beginPath(); c.moveTo(x,y); c.lineTo(x+rand(-70,70),y+rand(-8,8)); c.stroke(); }
    }); t.anisotropy=8; return t; })()});

  /* ---- Packplaetze: Tisch, Waage, Drucker, Abroller, Ablage ---- */
  for(let i=0;i<3;i++){ const k='ab'+(i+1), W=(px,pz)=>ppW(i,px,pz);
    /* in Platzkoordinaten bauen; gespiegelte Plaetze spiegeln z */
    const Bp=(w,h,d,c,px,y,pz,rx,ry,rz)=>{ const p=W(px,pz); B(k,w,h,d,c,p.x,y,p.z,rx,ry,rz); };
    const Cp=(r,h,c,px,y,pz,rx,ry,rz,seg)=>{ const p=W(px,pz); Cy(k,r,h,c,p.x,y,p.z,rx,ry,rz,seg); };
    const M=W(0,0), hb=VS_TB/2;
    reg(rbox(VS_TB,0.06,0.78,0.012,platte,M.x,0.92,M.z,g),k);
    Bp(VS_TB+0.04,0.05,0.8,DUNKEL,0,0.87,0);
    for(const sx of [-hb+0.08,hb-0.08]) for(const sz of [-0.32,0.32]){ Bp(0.06,0.85,0.06,STAHL,sx,0.425,sz); Bp(0.12,0.02,0.12,DUNKEL,sx,0.01,sz); }
    for(const sz of [-0.32,0.32]) Bp(VS_TB-0.22,0.05,0.04,STAHL,0,0.28,sz);
    Bp(VS_TB-0.16,0.03,0.68,DUNKEL,0,0.31,0);
    /* gefaltete Kartons auf der unteren Ablage */
    Bp(0.5,0.05,0.5,MAT.farbe('holzPalette'),-0.24,0.35,0); Bp(0.44,0.04,0.46,MAT.farbe('holzPalette'),-0.22,0.395,0.01);
    Bp(0.36,0.05,0.36,MAT.farbe('holzPalette'),0.3,0.35,-0.02);
    /* Waage vorn links, Etikettendrucker hinten links, Abroller rechts -
       die Mitte bleibt frei: dort steht der Karton, und zum Band hin wird
       er hinuebergeschoben */
    Bp(0.2,0.04,0.2,DUNKEL,-0.46,0.97,0.24); Bp(0.17,0.01,0.17,ZINK,-0.46,0.995,0.24);
    Bp(0.18,0.18,0.2,DUNKEL,-0.48,1.04,-0.25); Bp(0.14,0.01,0.12,MAT.farbe('cremeweiss'),-0.48,1.135,-0.25);
    /* Uebergabeblech: Tischkante bis Bandkante, buendig mit der Platte */
    Bp(VS_TB-0.2,0.012,0.12,MAT.farbe('hellgrau'),0,VS_TOP-0.006,-0.45);
    /* Handabroller (Tom 09.10.: "Klebebandrolle ist zwei Pixel"): Pistolengriff, Rahmen,
       Andrueckrolle, Messer - und eine echte Rolle (Lathe, 50 mm aussen, 38 mm Huelse) */
    { const q=W(0.47,-0.22), ry=VS_PP[i].s>0?0:Math.PI, R=(lx,lz)=>{ const a=W(0.47+lx,-0.22+lz); return a; };
      const T2=(w,h,d,c,lx,y,lz,rx,rz)=>{ const a=R(lx,lz); B(k,w,h,d,c,a.x,y,a.z,rx||0,ry,rz||0); };
      T2(0.035,0.11,0.03,MAT.farbe('feuerrot'),0.0,0.99,0.07,0.5,0); T2(0.03,0.02,0.16,MAT.farbe('anthrazit'),0.0,1.045,0.0); T2(0.03,0.07,0.02,MAT.farbe('anthrazit'),0.0,1.03,-0.08);
      T2(0.03,0.012,0.05,MAT.farbe('hellgrau'),0.0,1.012,-0.1); Cy(k,0.012,0.05,MAT.farbe('gummischwarz'),R(0,-0.085).x,0.998,R(0,-0.085).z,0,0,Math.PI/2,10);
      vc(k).push({geo:vmBandGeo(),m:tm(q.x,1.05+0.02,q.z,0,0,Math.PI/2),color:MAT.farbe('wellpappe')});
      Cy(k,0.037,0.052,MAT.farbe('holzPalette'),q.x,1.07,q.z,0,0,Math.PI/2,14); void ry; }
    const hit=bbox(VS_TB+0.1,1.3,0.95,hitM,M.x,0.65,M.z,g,false);
    hit.userData={kind:'pack',ref:i}; T.hits[i]=hit; reg(hit,k);
    if(i===0) packHit=hit;
    /* Packmaterial-Regal links neben dem Tisch (11d-packmaterial.js) */
    vmRegalBauen(g,i,(o)=>reg(o,k),B,k);
  }

  /* ---- Foerderband: Gurt, Rollen, Gestell auf eigenen Fuessen ---- */
  { const k='ab1', z=BAND.z, b=BAND.b, L=BAND.x1-BAND.x0, Ls=BAND.x1-BAND.stau, Y=BAND.y, xm=(BAND.x0+BAND.x1)/2;
    /* Seitenprofile bleiben unter der Oberkante, damit das Paket von den
       Tischen eben herueberrutscht - Tische gibt es auf beiden Seiten */
    for(const s of [-1,1]) B(k,L,0.14,0.04,STAHL,xm,Y-0.075,z+s*(b/2+0.02));
    /* Beine mit Fussplatten und Querstreben, etwa alle 1,2 m */
    const nB=Math.round(L/1.2);
    for(let j=0;j<=nB;j++){ const x=BAND.x0+0.12+(L-0.24)*j/nB;
      for(const s of [-1,1]){ B(k,0.05,Y-0.1,0.05,STAHL,x,(Y-0.1)/2,z+s*(b/2-0.02)); B(k,0.13,0.015,0.11,DUNKEL,x,0.008,z+s*(b/2-0.02)); }
      B(k,0.04,0.04,b-0.04,STAHL,x,0.24,z); B(k,0.04,0.04,b-0.04,STAHL,x,Y-0.17,z); }
    for(const s of [-1,1]) B(k,L-0.2,0.035,0.035,STAHL,xm,0.24,z+s*(b/2-0.02));
    /* Gurt: Unterseite, Umlenktrommeln, Antrieb am Anfang im Osten */
    B(k,Ls,0.02,b-0.02,MAT.farbe('gummischwarz'),BAND.stau+Ls/2,Y-0.12,z);
    for(const x of [BAND.stau+0.04,BAND.x1-0.04]) Cy(k,0.045,b-0.02,MAT.farbe('basaltgrau'),x,Y-0.045,z,Math.PI/2,0,0,12);
    B(k,0.3,0.22,0.24,MAT.farbe('signalblau'),BAND.x1-0.4,Y-0.42,z); Cy(k,0.07,0.16,MAT.farbe('signalblau'),BAND.x1-0.62,Y-0.42,z,0,0,Math.PI/2,12);
    /* Staurollenbahn bis zum Endanschlag */
    for(let x=BAND.x0+0.06;x<BAND.stau-0.02;x+=0.075) Cy(k,0.03,b-0.03,ZINK,x,Y-0.03,z,Math.PI/2,0,0,10);
    /* Endanschlag mit Gummipuffer und Lichtschranke */
    B(k,0.04,0.2,b+0.08,GELB,BAND.x0-0.02,Y+0.06,z); B(k,0.02,0.1,b-0.1,MAT.farbe('gummischwarz'),BAND.x0+0.005,Y+0.05,z);
    for(const s of [-1,1]) B(k,0.05,0.08,0.05,DUNKEL,BAND.x0+0.25,Y+0.09,z+s*(b/2+0.05));
    /* Gurt mit Laufrichtung: das Muster wandert mit (11c) */
    const gt=tex(512,64,(c,W,H)=>{ c.fillStyle='#24272d'; c.fillRect(0,0,W,H);
      for(let x=0;x<W;x+=16){ c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(x,0,8,H); }
      for(let i=0;i<500;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.05})`; c.fillRect(Math.random()*W,Math.random()*H,2,1); } });
    gt.wrapS=THREE.RepeatWrapping; gt.repeat&&gt.repeat.set(Ls/1.0,1);
    const gurt=new THREE.Mesh(new THREE.PlaneGeometry(Ls,b-0.02),new THREE.MeshStandardMaterial({map:gt,roughness:0.85}));
    gurt.rotation.x=-Math.PI/2; gurt.position.set(BAND.stau+Ls/2,Y-0.002,z); g.add(gurt);
    if(HIQ) gurt.receiveShadow=true;
    T.gurt=gt;
  }

  /* ---- Palettierstation je Stufe: Portal, Zaun, Bodenmarkierung ----
     09.10. (Tom): Kran schon ab Stufe 1, nur eine Palette; je Stufe eine Palette mehr */
  const brX1=BAND.x0+0.65;   /* die Portalbruecke ragt im Osten ueber das Bandende */
  for(let s=1;s<=3;s++){ const k='nur'+s, C=ZELLE[s], x0=C.x0, x1=C.x1, z0=C.z0, z1=C.z1;
    const px0=x0+0.06, px1=x1-0.06, pz0=PORTAL_Z0[s]+0.06, pz1=z1-0.06;
    /* vier Stuetzen, zwei Laengstraeger an West- und Ostseite, Querriegel */
    for(const px of [px0,px1]) for(const pz of [pz0,pz1]){ B(k,0.12,PORTAL_Y,0.12,GELB,px,PORTAL_Y/2,pz); B(k,0.24,0.02,0.24,DUNKEL,px,0.01,pz);
      if(GFX!=='ultralow') for(const sx of [-0.08,0.08]) for(const sz of [-0.08,0.08]) Cy(k,0.012,0.03,ZINK,px+sx,0.03,pz+sz,0,0,0,6); }
    for(const px of [px0,px1]){ B(k,0.12,0.16,pz1-pz0,GELB,px,PORTAL_Y+0.08,(pz0+pz1)/2); B(k,0.04,0.03,pz1-pz0,ZINK,px,PORTAL_Y+0.175,(pz0+pz1)/2); }
    for(const pz of [pz0,pz1]) B(k,px1-px0,0.12,0.1,GELB,(px0+px1)/2,PORTAL_Y-0.02,pz);
    /* Energiekette am westlichen Traeger, Schaltkasten mit Leuchten an der Stuetze */
    B(k,0.08,0.06,pz1-pz0-0.2,MAT.farbe('gummischwarz'),px0-0.1,PORTAL_Y+0.05,(pz0+pz1)/2);
    B(k,0.22,0.36,0.14,MAT.farbe('lichtgrau'),px1,1.5,pz1-0.13); B(k,0.05,0.05,0.02,0x2fd06a,px1-0.05,1.6,pz1-0.205); B(k,0.05,0.05,0.02,0xff4433,px1+0.05,1.6,pz1-0.205);
    /* Zaun: 2 m hoch an West und Sued, zum Band hin im Osten ein niedriges Gelaender -
       darueber hebt der Greifer die Pakete. Die Seite zum Rolltor V1 ist offen: dort holt
       der DDL-Fahrer die Paletten mit dem Hubwagen. */
    for(const [von,bis,art] of [[[x0,z1],[x0,z0],'gitter'],[[x0,z0],[x1,z0],'gitter'],[[x1,z1-0.15],[x1,z0+0.15],'gelaender']])
      bk.zaun({art,von,bis,S:vsZaunS(B,k),parent:g}).gitter.forEach(o=>reg(o,k));
    B(k,0.5,0.03,0.04,GELB,x0+0.3,0.02,z1-0.05); B(k,0.5,0.03,0.04,GELB,x1-0.3,0.02,z1-0.05);
    /* Boden: Warnrand gelb-schwarz, Eckmarken der Palettenplaetze (bk.bodenmarkierung, vorher eigene Textur je Stufe) */
    { const E=0.12, ek=[]; for(let j=0;j<PAL_N[s];j++){ const p=PALETTEN[j], a=p.x-0.65, b=p.x+0.65, o=p.z-0.45, u=p.z+0.45;
        for(const [x,z,dx,dz] of [[a,o,1,1],[b,o,-1,1],[b,u,-1,-1],[a,u,1,-1]]){ ek.push([x,z,x+dx*E,z,'gelb',0.03],[x,z,x,z+dz*E,'gelb',0.03]); } }
      bk.bodenmarkierung({rahmen:[{x0,x1,z0,z1,farbe:'sperr',breite:0.09}],linien:ek,parent:g,y:0.016}).meshes.forEach(m=>reg(m,k)); }
    /* Versandbereich: wohin die Box noch waechst - gelb schraffiert, bis Stufe 3 */
    if(s<3) versandReserve(x0,x1,ZELLE[3].z0,z0,g).forEach(m=>reg(m,k));
  }
  ladezoneBauen(g,B);
  /* Paletten sind eigene Objekte (11e-palette.js): die Box zeigt sie dort. */
  /* bewegliche Portalteile: Bruecke (faehrt in z), Laufwagen, Hubachse, Greifer */
  { const Pt={}, gelb=std(GELB,{roughness:0.5,metalness:0.25}), dunkel=MAT.get('lackAnthrazit'), zink=std(ZINK,{metalness:0.6,roughness:0.35});
    const bx0=ZELLE[1].x0+0.01, L=brX1-bx0;
    const br=new THREE.Group(); br.position.set((bx0+brX1)/2,PORTAL_Y+0.27,BAND.z); g.add(br);
    bbox(L,0.14,0.14,gelb,0,0,0,br); bbox(L-0.1,0.03,0.05,zink,0,0.085,0,br,false);
    for(const sx of [ZELLE[1].x0+0.06,ZELLE[1].x1-0.06]) bbox(0.16,0.12,0.24,dunkel,sx-(bx0+brX1)/2,-0.09,0,br,false);
    const wg=new THREE.Group(); wg.position.set(BAND.x0+0.4,PORTAL_Y+0.27,BAND.z); g.add(wg);
    bbox(0.28,0.24,0.3,dunkel,0,0,0,wg); bbox(0.16,0.12,0.12,MAT.ober('signalblau','kunststoff'),0.05,0.18,0,wg,false);
    const mast=bbox(0.08,1,0.08,zink,0,0,0,g,false), mast2=bbox(0.11,0.5,0.11,dunkel,0,0,0,g,false);
    const gr=new THREE.Group(); g.add(gr);
    /* Unterkante der Sauger = Greiferlage: dort liegt die Paketoberseite an */
    bbox(0.3,0.04,0.26,dunkel,0,0.045,0,gr); bbox(0.12,0.07,0.12,dunkel,0,0.1,0,gr,false);
    const saugM=MAT.get('gummi'), saugG=new THREE.CylinderGeometry(0.035,0.028,0.025,12);
    for(const sx of [-0.09,0.09]) for(const sz of [-0.08,0.08]){ const c=new THREE.Mesh(saugG,saugM); c.position.set(sx,0.0125,sz); gr.add(c); }
    Pt.bruecke=br; Pt.wagen=wg; Pt.mast=mast; Pt.mast2=mast2; Pt.greifer=gr;
    [br,wg,mast,mast2,gr].forEach(o=>T.ab[1].push(o));   /* Kran ab Stufe 1 (Tom 09.10.) */
    T.portal=Pt;
  }
  /* Statische Teile zusammenfassen */
  for(const k in VC){ const m=new THREE.Mesh(merge(VC[k]),vcMat); if(HIQ){ m.castShadow=true; m.receiveShadow=true; } g.add(m); if(k!=='lz') reg(m,k); }

  /* Hinweisschild ueber dem ersten Packplatz, von beiden Seiten lesbar */
  { const P=ppW(0,0,-0.36), st=MAT.eigen('silbergrau','stahl');
    for(const sx of [-0.56,0.56]) bbox(0.05,1.5,0.05,st,P.x+sx,1.72,P.z,g,false);
    bbox(1.3,0.36,0.05,MAT.get('schildBlau'),P.x,2.3,P.z,g,false);
    /* Statusanzeige (Leuchtschild, beidseitig; Inhalt malt drawPackSchild) */
    const vorn=bk.schild(g,{malen:()=>{},pw:1024,ph:256,b:1.24,h:0.31,x:P.x,y:2.3,z:P.z+0.03,leucht:true});
    packSchildTex=vorn.material.map; const hinten=new THREE.Mesh(vorn.geometry,vorn.material); hinten.position.set(P.x,2.3,P.z-0.03); hinten.rotation.y=Math.PI; hinten.userData.bauteil='schild'; g.add(hinten);
    drawPackSchild(); }
  versandFlaeche(g);
  packSperre(id,g);
  for(let i=0;i<3;i++) vsWagenBauen(g,i);
  packMov=addMovable({kind:'pack',name:'Versandecke',fest:true,g,flaeche:PACK_FL,
    teile:()=>{
      const st=packStufe(), C=ZELLE[st], t=[];
      t.push({x0:BAND.x0-0.06,x1:BAND.x1+0.06,z0:BAND.z-BAND.b/2-0.04,z1:BAND.z+BAND.b/2+0.04});   /* Band */
      /* Tisch und Packmaterial-Regal je Platz */
      for(let i=0;i<st;i++){ const a=ppW(i,-1.27,-0.41), b=ppW(i,VS_TB/2+0.04,0.41);
        t.push({x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),z0:Math.min(a.z,b.z),z1:Math.max(a.z,b.z)}); }
      /* Palettierstation: Zaun an Wand, Suedende und zum Band; die Seite zu V1 ist offen,
         dahinter liegt die abgesperrte Ladezone. Portalstuetzen hinter einer kleinen Box. */
      t.push({x0:C.x0-0.02,x1:C.x0+0.1,z0:C.z0-0.04,z1:C.z1+0.04});
      t.push({x0:C.x0-0.02,x1:C.x1+0.04,z0:C.z0-0.04,z1:C.z0+0.08});
      t.push({x0:C.x1-0.06,x1:C.x1+0.04,z0:C.z0-0.04,z1:C.z1+0.04});
      if(PORTAL_Z0[st]<C.z0-0.1) for(const px of [C.x0+0.06,C.x1-0.06]) t.push({x0:px-0.12,x1:px+0.12,z0:PORTAL_Z0[st]-0.06,z1:PORTAL_Z0[st]+0.18});
      ladezoneRechtecke().forEach(r=>t.push(r));
      if(!zoneOffen(id)) t.push({x0:-1.75,x1:4.15,z0:-1.7,z1:-1.35});
      /* die geparkten Kommissionierwagen (solange sie nicht unterwegs sind) */
      else for(let i=0;i<st;i++){ const w=vsPlaetze[i]&&vsPlaetze[i].wagen; if(w&&w.parent===g){ const p=ppW(i,vsPK(i).px,vsPK(i).pz); t.push({x0:p.x-0.48,x1:p.x+0.48,z0:p.z-0.36,z1:p.z+0.36}); } }
      return t;
    }});
  zHook(id,()=>{ packStufeAnwenden(); });
  zHook('packstation2',()=>{ packStufeAnwenden(); packPlatzPruefen(true); });
  zHook('packstation3',()=>{ packStufeAnwenden(); packPlatzPruefen(true); });
  packStufeAnwenden();
}
/* Stufe sichtbar machen, Flaeche, Paletten und Kollision nachziehen */
function packStufeAnwenden(){
  const st=packStufe(), T=packTeile;
  for(let s=1;s<=3;s++){ T.ab[s].forEach(o=>{ o.visible=st>=s; }); T.nur[s].forEach(o=>{ o.visible=st===s; }); }
  VS_FELD.length=0; for(let j=0;j<PAL_N[st];j++) VS_FELD.push(PALETTEN[j]);
  if(typeof vsStufeGeaendert==='function') vsStufeGeaendert();
  if(packMov&&grabbed!==packMov) applyFootprint(packMov);
}
/* Die groessere Station passt nicht mehr dorthin, wo man sie hingeschoben
   hat (oder ein alter Spielstand stellt sie an eine Wand): zurueck an
   ihren Platz hinter dem Rolltor */
/* 09.10.: die Versandecke ist fest eingebaut (Box, Kran und Ladezone gehoeren zu Rolltor V1).
   Ein alter Spielstand mit verschobener Station stellt sie zurueck; was im Versandbereich
   steht, zieht um (versandBereichRaeumen). */
function packPlatzPruefen(laut){
  if(!packMov||grabbed===packMov) return;
  const g=packMov.g;
  if(Math.abs(g.position.x-PACK_HOME.x)>0.01||Math.abs(g.position.z-PACK_HOME.z)>0.01||Math.abs(g.rotation.y-PACK_HOME.ry)>0.01){
    placeMovable(packMov,PACK_HOME.x,PACK_HOME.z,PACK_HOME.ry);
    if(laut) toast('Die Versandecke steht wieder an ihrem festen Platz vor Rolltor V1.'); }
  versandBereichRaeumen(laut);
}
/* Versandbereich in der Welt (achsenparallel) */
function versandBereich(){ return rectWelt(PACK_HOME.x,PACK_HOME.z,PACK_HOME.ry,PACK_FL); }
/* Moebel, Regale und Kartons im Versandbereich (alte Spielstaende): an den naechsten
   freien Platz - nichts wird geloescht. Gibt die Zahl der umgezogenen Dinge zurueck. */
function versandBereichRaeumen(laut){
  const A=versandBereich(), drin=(r)=>r.minX<A.maxX-0.02&&r.maxX>A.minX+0.02&&r.minZ<A.maxZ-0.02&&r.maxZ>A.minZ+0.02;
  let n=0;
  for(const m of movables.slice()){
    if(m===packMov||!m.g||m.g.visible===false) continue;
    if(!m.fw&&!m.flaeche&&m.kind!=='rack') continue;
    const r=m.kind==='rack'&&m.ref?(()=>{ const q=rackRect(rackKindOf(m.ref),m.g.position.x,m.g.position.z,m.g.rotation.y); return {minX:q.x0,maxX:q.x1,minZ:q.z0,maxZ:q.z1}; })():rectOf(m,m.g.position.x,m.g.position.z,m.g.rotation.y);
    if(!drin(r)) continue;
    if(m.kind==='rack'&&m.ref){ const K=rackKindOf(m.ref), frei=rackPlatzFrei(K,m.ref).filter(sl=>{ const p=rackStellPlatz(K,sl); if(!p) return false; const q=rackRect(K,p.x,p.z,p.ry); return !drin({minX:q.x0,maxX:q.x1,minZ:q.z0,maxZ:q.z1}); });
      if(!frei.length) continue; let best=frei[0], bd=1e9; for(const sl of frei){ const d=(sl.x-m.g.position.x)**2+(sl.z-m.g.position.z)**2; if(d<bd){ bd=d; best=sl; } }
      const p=rackStellPlatz(K,best); placeMovable(m,p.x,p.z,p.ry); m.ref.slot=best; n++; continue; }
    const ry=m.g.rotation.y, x0=m.g.position.x, z0=m.g.position.z; let ok=null;
    dropFootprint(m);
    for(let rr=0.5;rr<14&&!ok;rr+=0.5) for(let a=0;a<16&&!ok;a++){ const x=Math.round((x0+Math.cos(a/16*Math.PI*2)*rr)*4)/4, z=Math.round((z0+Math.sin(a/16*Math.PI*2)*rr)*4)/4;
      if(drin(rectOf(m,x,z,ry))) continue; if(spotFree(m,x,z,ry)) ok={x,z}; }
    if(ok){ placeMovable(m,ok.x,ok.z,ry); n++; } else applyFootprint(m);
  }
  /* Kartons am Boden */
  if(typeof floorBoxes!=='undefined') for(const b of floorBoxes){ const p=b.mesh.position; if(p.x>A.minX&&p.x<A.maxX&&p.z>A.minZ&&p.z<A.maxZ){ p.x=A.minX-0.6-Math.random()*0.8; p.z=Math.max(A.minZ+0.5,Math.min(A.maxZ-0.5,p.z)); n++; } }
  if(n&&laut!==false) toast(`${n} Sache${n===1?'':'n'} aus dem Versandbereich vor der Packstation umgestellt – dort wächst die Versandecke.`);
  return n;
}
/* Absperrband vor der Packstation, solange sie nicht gekauft ist.
   Pfosten und Baender an der Nordseite, von der man kommt - man sieht
   darueber hinweg, kommt aber nicht heran. Es haengt in der Gruppe der
   Station und wandert beim Umbau mit. */
function packSperre(id,g){
  const zb=-1.62, xs=[-1.7,0.3,2.2,4.1];
  bk.absperrung({punkte:xs.map(x=>[x,zb]),baender:[0.55,1.05],text:'NOCH NICHT FREIGESCHALTET',zone:id,parent:g});
}
/* Die Packplaetze stehen auf einer eigenen, markierten Flaeche: grauer
   Boden mit gelbem Rand und Schraffur an den Schmalseiten. Der zweite
   Packplatz suedlich des Bandes bekommt ein eigenes Stueck. */
function versandFlaeche(g){
  /* grauer Arbeitsboden, gelber Rand, Schraffur an der Schmalseite (bk.bodenmarkierung) */
  const boden=MAT.ober('basaltgrau','matt');
  const flaeche=(x0,x1,z0,z1,k)=>{
    const bo=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),boden); bo.rotation.x=-Math.PI/2; bo.position.set((x0+x1)/2,0.02,(z0+z1)/2); g.add(bo);
    const M=bk.bodenmarkierung({rahmen:[{x0,x1,z0,z1,farbe:'gelb',breite:0.06}],flaechen:[{x0:x1-0.3,x1:x1-0.06,z0:z0+0.06,z1:z1-0.06,art:'frei'}],parent:g,y:0.021}).meshes;   /* ueber dem Arbeitsboden (0,02) */
    if(k){ packTeile.ab[k].push(bo); M.forEach(m=>packTeile.ab[k].push(m)); } };
  flaeche(-0.05,4.15,BAND.z-BAND.b/2-0.1,1.22,0);
  flaeche(1.6,4.15,-3.25,BAND.z-BAND.b/2-0.1,2);
  /* Schrift vor jedem Packplatz - nur fuer die Plaetze, die es in der
     Stufe schon gibt, lesbar fuer den, der davor steht (Bodenschrift aus dem Baukasten) */
  for(let i=0;i<3;i++){ const p=ppW(i,0,1.32);
    bk.bodenmarkierung({schriften:[{text:'PACKPLATZ '+(i+1),x:p.x,z:p.z,b:1.2,h:0.26,ry:VS_PP[i].s<0?Math.PI:0}],parent:g,y:0.021}).meshes.forEach(m=>packTeile.ab[i+1].push(m));
  }
}
let packSchildTex=null;
function packBereit(){ return zoneOffen('packstation')&&S&&S.up&&S.up.onlineshop; }
function drawPackSchild(){
  if(!packSchildTex) return;
  redraw(packSchildTex,(g,W,H)=>{
    g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
    g.textAlign='center'; g.textBaseline='middle';
    if(packBereit()){
      const d=typeof ddlStand==='function'?ddlStand():null, voll=d&&d.voll&&!d.unterwegs;
      g.fillStyle=voll?'#ff8a7a':d&&d.unterwegs?'#ffd23f':'#6cf2a8'; g.font=BUN(58);
      g.fillText(voll?'BOX VOLL · DDL RUFEN':d&&d.unterwegs?'DDL KOMMT':'VERSAND · BEREIT',W/2,H/2-14);
      g.fillStyle='#bcd0ea'; g.font=BAR(34); g.fillText(`${S.offen|0} Bestellung${(S.offen|0)===1?'':'en'} offen · ${S.pakete|0} Paket${(S.pakete|0)===1?'':'e'} zur Abholung`,W/2,H-38);
    } else {
      g.fillStyle=MAT.css('schildgold'); g.font=BUN(52); g.fillText('VERSAND',W/2,H/2-16);
      g.fillStyle='#ff9d92'; g.font=BAR(32); g.fillText('Onlineshop noch nicht freigeschaltet',W/2,H-38);
    }
    g.strokeStyle='#2f3a5e'; g.lineWidth=6; g.strokeRect(3,3,W-6,H-6);
  });
}

/* Versand: Bestellungen, Kommissionierwagen, Pakete und Stapel
   stehen seit dem 25.09. in 11c-versand.js. Die fertigen Pakete
   auf der Ablage (Meshes, Tischkoordinaten): */
const pakete=[];

/* =========================================================
   Westrampen: drei Ladetore in der Westhalle und der grosse
   Hof dahinter. Hier passen mehrere Auflieger nebeneinander -
   der kleine Hof an der Basisrampe reicht dafuer nicht.
   ========================================================= */
/* Mitte der vier Tore in x an der Suedwand der Logistikhalle - von
   der Schleuse aus nach Westen: Tor 2, 3 (Stufe 1), 4 (Stufe 2), 5 (Stufe 3) */
const WRAMPEN=[-31.0,-38.5,-47.5,-57.5];
const WTORE=[];                             /* Torblatt und Ampel je Rampe */
const WTOR={w:3.4,h:3.05};

/* Trapezblech fuer Hallenwaende. Die Wand-UVs stehen in Metern,
   deshalb passt ein einziges Material auf jede Wandlaenge. */
/* blechMat() entfaellt (14.10., Fundament Schritt Waende): Trapezblech = bk.flaeche('blech') = MAT.get('wandBlech') */
/* Ein Ladetor in der Suedwand der Logistikhalle (R2-R5). Seit 13.10.
   (Fundament, Schritt Tore) baut bk.tor() Blatt, Aussen- und Innenseite -
   vorher standen hier westTor/westTorInnen mit je rund 73 Einzelmeshes und
   der eigenen Textur torBlattMat. Innen = +x der Torgruppe, die Gruppe ist
   so gedreht, dass +x nach Norden in die Halle zeigt. Die Spiel-Logik
   (WTORE: blatt/zu/auf/rot/gruen, wtorSet in 08c) bleibt unveraendert. */
function westTor(cx,nr){
  const Z=LHALLE.z;
  const T=bk.tor({art:'sektional',fuehrung:'vertikal',breite:WTOR.w,hoehe:WTOR.h,wand:[-LW,0],blatt:-0.15,fahrzeug:2.55,
    nr:String(nr+1),bedien:1,x:cx,z:Z,ry:-Math.PI/2});
  for(const r of T.kollision) col(r.x0,r.x1,r.z0,r.z1);
  WTORE[nr-1]={nr,x:cx,g:T.g,blatt:T.blatt,zu:T.zu,auf:T.auf,t:0,rot:T.ampel.rot,gruen:T.ampel.gruen,T};
  return T.g;
}
/* =========================================================
   Nordwand des Lagers zur Strasse, mit drei echten Fenstern
   (Tom, 24.09.: "das sind keine Fenster, da muessen richtige hin").
   Vorher klebten dort drei dunkle Kaesten aussen auf der Wand.
   Jetzt hat die Wand Oeffnungen mit Laibung, Aluminiumrahmen,
   Mittelpfosten, Glas, Fensterbank aussen und innen - von der
   Strasse aus und aus der Lagererweiterung zu sehen.
   ========================================================= */
const LAGERFENSTER=[-17.6,-14.0,-10.4];
function lagerFensterWand(){
  /* Wand mit drei Oeffnungen (Pfeiler, Bruestung 1,35, Sturz 2,6) und Fluegelfenster: bk.fenster art 'fluegel' (04z) -
     Profile Anthrazit, Glas wie alle Scheiben, Fensterbank aussen Anthrazit wie die Schaufenster, innen weiss */
  const r=LAY.lnord, z0=r.z1, z1=r.z1+LW;
  bk.fenster({art:'fluegel',felder:LAGERFENSTER.map(cx=>({cx,b:1.7,y0:1.35,y1:2.6})),
    wand:{x0:r.x0-LW,x1:r.x1+LW,z0,z1,hoehe:LAGER_H,innen:'-z',flaechen:{innen:lagerWall,laibung:MAT.ober('lichtgrau','matt')}}});
  col(r.x0-LW,r.x1+LW,z0,z1);
}
/* Flutlichtmast fuer den Hof */
function hofMast(x,z,ry){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g);
  g.userData.hof='mast';
  const mast=MAT.get('zaunPfosten');
  const dark=MAT.get('stahlAnthrazit');
  const so=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.26,0.4,12),dark); so.position.y=0.2; g.add(so);
  const m1=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.14,7.4,12),mast);
  m1.position.y=4.1; if(HIQ) m1.castShadow=true; g.add(m1);
  bbox(1.7,0.09,0.09,mast,0,7.7,0,g,false);
  for(const s of [-1,1]){
    const geh=rbox(0.62,0.3,0.34,0.04,dark,s*0.62,7.55,0,g); geh.rotation.x=0.42;
    const lm=new THREE.MeshStandardMaterial({color:LIN(MAT.farbe('anthrazit')),emissive:LIN(0xfff2d6),emissiveIntensity:0}); lampMats.push(lm);
    const fl=bbox(0.54,0.03,0.26,lm,s*0.62,7.4,0.06,g,false); fl.rotation.x=0.42;
  }
  col(x-0.3,x+0.3,z-0.3,z+0.3);
}
/* Abgestellter Auflieger, von aussen. Kein Innenraum noetig. */
function abstellAuflieger(x,z,ry,name,farbe,fahrend){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; scene.add(g);
  g.userData.hof='auflieger';
  /* Laenge des Aufbaus, damit der Anrufer das Heck ausrichten kann */
  g.userData.len=13.2;
  const L=13.2, W2=2.55, HH=2.95, FY=1.15;      /* Ladeflaechenhoehe */
  const alu=MAT.get('stahlHell');
  const dark=MAT.get('lackSchwarz');
  /* Aufbau mit Werbung auf den Seiten */
  const side=new THREE.MeshStandardMaterial({map:liveryTex(name,farbe,false),roughness:0.74});
  const body=new THREE.Mesh(new THREE.BoxGeometry(L,HH,W2),[dark,dark,alu,dark,side,side]);
  body.position.set(0,FY+HH/2,0); if(HIQ){ body.castShadow=true; body.receiveShadow=true; } g.add(body);
  bbox(L+0.05,0.1,W2+0.06,alu,0,FY+HH-0.04,0,g,false);
  bbox(L+0.05,0.16,W2+0.06,MAT.std(0x8a7f6a,{roughness:0.9}),0,FY+0.1,0,g,false);
  /* Hecktueren mit Scharnieren und Stangen */
  for(const s of [-1,1]) bbox(0.06,HH-0.2,W2/2-0.08,MAT.get('kunststoffWeiss'),-L/2-0.04,FY+HH/2,s*W2/4,g,false);
  for(const s of [-1,1]) for(const o of [0.28,0.9]){
    const st=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,HH-0.34,8),alu);
    st.position.set(-L/2-0.09,FY+HH/2,s*o*W2/2.2); g.add(st); }
  /* Chassis, Stuetzwinden, Achsen und Heckleuchten: ein Mesh.
     Vierzig Einzelteile je Auflieger waeren fuer eine Kulisse zu viel. */
  const gRahmen=new THREE.BoxGeometry(L-0.3,0.22,0.16), gWinde=new THREE.BoxGeometry(0.14,0.85,0.14);
  const gFuss=new THREE.BoxGeometry(0.3,0.06,0.3), gKoenig=new THREE.BoxGeometry(0.9,0.12,1.5);
  const gRad=new THREE.CylinderGeometry(0.5,0.5,0.26,HIQ?20:12);
  const gFelge=new THREE.CylinderGeometry(0.23,0.23,0.28,HIQ?16:10);
  const gAchse=new THREE.BoxGeometry(0.3,0.14,W2-0.3), gKotfl=new THREE.BoxGeometry(1.2,0.3,0.1);
  const gSchutz=new THREE.BoxGeometry(0.1,0.16,W2-0.2), gRueck=new THREE.BoxGeometry(0.05,0.2,0.34);
  const gBlink=new THREE.BoxGeometry(0.05,0.08,0.12), gSchild=new THREE.BoxGeometry(0.03,0.12,0.5);
  const ch=[];
  for(const s of [-1,1]) ch.push({geo:gRahmen,m:tm(0,FY-0.16,s*0.42),color:MAT.farbe('basaltgrau')});
  for(const s of [-1,1]){ ch.push({geo:gWinde,m:tm(L/2-3.3,FY-0.62,s*0.95),color:MAT.farbe('gummischwarz')});
    ch.push({geo:gFuss,m:tm(L/2-3.3,FY-1.04,s*0.95),color:MAT.farbe('gummischwarz')}); }
  ch.push({geo:gKoenig,m:tm(L/2-0.7,FY-0.2,0),color:MAT.farbe('mittelgrau')});
  for(let a=0;a<3;a++){ const ax=-L/2+2.1+a*1.34;
    for(const s of [-1,1]) for(const dz of [0.145,-0.145]){
      const pz=s*(W2/2-0.46)+s*dz;
      ch.push({geo:gRad,  m:tm(ax,0.5,pz,Math.PI/2,0,0),color:MAT.farbe('anthrazit')});
      ch.push({geo:gFelge,m:tm(ax,0.5,pz,Math.PI/2,0,0),color:MAT.farbe('hellgrau')}); }
    ch.push({geo:gAchse,m:tm(ax,0.5,0),color:MAT.farbe('gummischwarz')});
    for(const s of [-1,1]) ch.push({geo:gKotfl,m:tm(ax,1.05,s*(W2/2-0.02)),color:MAT.farbe('graphit')}); }
  ch.push({geo:gSchutz,m:tm(-L/2+0.1,0.62,0),color:MAT.farbe('mittelgrau')});
  for(const s of [-1,1]){
    ch.push({geo:gRueck,m:tm(-L/2-0.09,0.92,s*(W2/2-0.35)),color:0x9a2a24});
    ch.push({geo:gBlink,m:tm(-L/2-0.09,1.12,s*(W2/2-0.35)),color:MAT.farbe('signalorange')}); }
  ch.push({geo:gSchild,m:tm(-L/2-0.1,0.72,0),color:MAT.farbe('cremeweiss')});
  const chm=new THREE.Mesh(merge(ch),MAT.std(0xffffff,{vertexColors:true,metalness:0.12,roughness:0.66}));
  if(HIQ) chm.castShadow=true; g.add(chm);
  [gRahmen,gWinde,gFuss,gKoenig,gRad,gFelge,gAchse,gKotfl,gSchutz,gRueck,gBlink,gSchild].forEach(q=>q.dispose());
  /* Kollision als ein Block */
  /* Ein Auflieger, der noch faehrt, bekommt keine feste Kollision -
     die zoege sonst als unsichtbarer Block ueber den Hof. */
  if(!fahrend){
    const c=Math.cos(ry), s2=Math.sin(ry);
    const hx=Math.abs(c)*L/2+Math.abs(s2)*W2/2, hz=Math.abs(s2)*L/2+Math.abs(c)*W2/2;
    col(x-hx,x+hx,z-hz,z+hz);
  }
  return g;
}
/* Palettenstapel als Hofdeko: palettenStapel(x,z,n,ry) steht seit 14.10. im Baukasten (04z, bk.paletten). */
/* =========================================================
   Logistikzentrum im Osten. Steht fertig hinter Zaun und
   Bauschild, betreten kann man es noch nicht.
   ========================================================= */
const LOGI={
  halle:{x0:46.5,x1:90.0,z0:-16.0,z1:7.5},
  buero:{x0:46.5,x1:60.0,z0:7.5,  z1:14.0},
  zaun :{x:41.0, z0:-16.0, z1:14.0},
  hoehe:11.2, bh:7.4
};
function logiSchriftzug(){
  return tex(1024,180,(g,W,H)=>{
    g.fillStyle='#16213f'; g.fillRect(0,0,W,H);
    const gr=g.createLinearGradient(0,0,0,H);
    gr.addColorStop(0,'rgba(255,255,255,.12)'); gr.addColorStop(0.5,'rgba(255,255,255,0)');
    g.fillStyle=gr; g.fillRect(0,0,W,H);
    g.textAlign='left'; g.textBaseline='middle';
    g.fillStyle=MAT.css('schildgold'); g.font=BUN(92); g.fillText('LOGISTIK',44,H/2-4);
    g.fillStyle='#e8eefc'; g.font=BUN(92); g.fillText('ZENTRUM',430,H/2-4);
    g.fillStyle='#7f8db0'; g.font=BAR(34); g.fillText('UMSCHLAG · KOMMISSIONIERUNG · VERSAND',44,H-34);
    /* Rautenlogo rechts */
    g.save(); g.translate(W-96,H/2); g.rotate(Math.PI/4);
    g.fillStyle=MAT.css('schildgold'); g.fillRect(-42,-42,84,84);
    g.fillStyle='#16213f'; g.fillRect(-22,-22,44,44); g.restore();
  });
}
/* Fensterband fuer das Buero: zwei Geschosse, ein Teil beleuchtet */
function logiGlas(len,rows){
  const cols=Math.max(4,Math.round(len/1.8));
  return tex(1024,256,(g,W,H)=>{
    g.fillStyle='#2b3348'; g.fillRect(0,0,W,H);
    const cw=W/cols, rh=H/rows;
    for(let c=0;c<cols;c++) for(let r=0;r<rows;r++){
      const x=c*cw+3, y=r*rh+4, w=cw-6, h=rh-8;
      const gg=g.createLinearGradient(x,y,x+w,y+h);
      if(Math.random()<0.42){ gg.addColorStop(0,'#f6e6bd'); gg.addColorStop(1,'#d8c294'); }
      else { gg.addColorStop(0,'#9fb4cc'); gg.addColorStop(0.55,'#6d8299'); gg.addColorStop(1,'#b6c8dc'); }
      g.fillStyle=gg; g.fillRect(x,y,w,h);
      g.fillStyle='rgba(255,255,255,.22)'; g.fillRect(x,y,w,4);
      g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x,y+h-4,w,4);
    }
    g.fillStyle='#c9ced6';
    for(let c=0;c<=cols;c++) g.fillRect(c*cw-2,0,5,H);
    for(let r=0;r<=rows;r++) g.fillRect(0,r*rh-2,W,5);
  });
}
function buildLogistik(){
  const H=LOGI.hoehe, ha=LOGI.halle, bu=LOGI.buero;
  const blech=bk.flaeche('blech');
  const sockel=MAT.get('graphitMatt');
  const attika=MAT.get('lackAnthrazit');
  const steel=MAT.get('stahlVerzinkt');
  /* --- Halle --- */
  const hw=ha.x1-ha.x0, hd=ha.z1-ha.z0, hcx=(ha.x0+ha.x1)/2, hcz=(ha.z0+ha.z1)/2;
  const halleM=new THREE.Mesh(new THREE.BoxGeometry(hw,H,hd),blech);
  halleM.position.set(hcx,H/2,hcz);
  if(HIQ){ halleM.castShadow=true; halleM.receiveShadow=true; }
  scene.add(halleM); occluders.push(halleM); meterUV(halleM);
  bbox(hw+0.1,1.3,hd+0.1,sockel,hcx,0.65,hcz,null,false);
  bbox(hw+0.5,0.7,hd+0.5,attika,hcx,H+0.3,hcz,null,false);
  bbox(hw+0.2,0.5,hd+0.2,MAT.ober('nachtblau','matt'),hcx,H-1.4,hcz,null,false);
  /* Dach mit Lichtband und Lueftern */
  flat(hw-0.6,hd-0.6,MAT.std(0x4a4f58,{roughness:0.95}),hcx,H+0.02,hcz);
  for(let i=0;i<7;i++) flat(3.4,hd-4,MAT.basic(MAT.farbe('weiss'),{toneMapped:false}),ha.x0+4+i*6.2,H+0.05,hcz);
  for(let i=0;i<5;i++){ const rx=ha.x0+6+i*8.4;
    rbox(2.4,1.1,2.0,0.1,MAT.get('stahlHell'),rx,H+0.85,ha.z1-4.5,null);
    bbox(2.5,0.12,2.1,MAT.get('weissMatt'),rx,H+1.46,ha.z1-4.5,null,false); }
  /* --- Buerokopf --- */
  const bw=bu.x1-bu.x0, bd=bu.z1-bu.z0, bcx=(bu.x0+bu.x1)/2, bcz=(bu.z0+bu.z1)/2;
  const glasN=new THREE.MeshStandardMaterial({map:logiGlas(bw,2),roughness:0.22,metalness:0.4});
  const glasW=new THREE.MeshStandardMaterial({map:logiGlas(bd,2),roughness:0.22,metalness:0.4});
  const putz=MAT.ober('lichtgrau','matt');
  const bm=new THREE.Mesh(new THREE.BoxGeometry(bw,LOGI.bh,bd),[glasW,glasW,putz,putz,glasN,glasN]);
  bm.position.set(bcx,LOGI.bh/2,bcz);
  if(HIQ){ bm.castShadow=true; bm.receiveShadow=true; }
  scene.add(bm); occluders.push(bm);
  bbox(bw+0.4,0.45,bd+0.4,attika,bcx,LOGI.bh+0.22,bcz,null,false);
  bbox(bw+0.1,0.9,bd+0.1,sockel,bcx,0.45,bcz,null,false);
  /* Eingangsvordach und Schriftzug */
  bbox(5.0,0.18,2.4,MAT.get('stahlHell'),bu.x0+3.2,3.35,bu.z1+1.0,null,false);
  for(const dx of [-2.0,2.0]) bbox(0.09,3.3,0.09,steel,bu.x0+3.2+dx,1.65,bu.z1+1.9,null,false);
  plane(11.0,1.95,new THREE.MeshStandardMaterial({map:logiSchriftzug()}),bcx,LOGI.bh-1.5,bu.z1+0.06,0,null);
  /* --- Ladetore an der Westfassade der Halle (Attrappen, Baukasten: Blatt fest) --- */
  for(let i=0;i<4;i++) bk.tor({art:'sektional',breite:3.6,hoehe:4.2,seite:'aussen',beweglich:false,ampel:false,poller:false,fahrzeug:2.55,
    wand:[0,0],blatt:-0.04,x:ha.x0,z:ha.z0+3.4+i*5.6,ry:0});
  /* --- Vorplatz, Zaun, Bauschild --- */
  MAT.kachel(flat(6.0,30.0,MAT.get('betonHof'),43.5,0.013,-1.0).geometry,3,14);
  MAT.kachel(flat(hw-2,5.5,MAT.get('betonHof'),hcx,0.012,ha.z1+2.8).geometry,10,3);
  { const L=[]; for(let i=0;i<4;i++){ const tz=ha.z0+3.4+i*5.6; for(const s of [-1,1]) L.push([ha.x0-4.8,tz+s*2.4,ha.x0-0.4,tz+s*2.4,'gelb',bk.MARKIERUNG.fahrweg]); }
    bk.bodenmarkierung({linien:L,y:0.012,schatten:true}); }
  /* Zaun mit Bauschild: faellt, sobald das Zentrum freigeschaltet wird */
  const Z=LOGI.zaun, ZH=2.4;
  /* Luecke fuer das Doppeltor (bis 14.10. lief die Matte mitten durch das Tor) */
  const TZ=2.0, TB=6.22;
  bk.zaun({art:'doppelstab',von:[Z.x,Z.z0],bis:[Z.x,Z.z1],hoehe:ZH,luecke:[[TZ-TB/2-Z.z0,TZ+TB/2-Z.z0]]});
  bk.zaun({art:'doppelstab',von:[Z.x,Z.z0],bis:[ha.x0,Z.z0],hoehe:ZH});
  bk.zaun({art:'doppelstab',von:[Z.x,Z.z1],bis:[bu.x0,Z.z1],hoehe:ZH});
  col(Z.x-0.12,Z.x+0.12,Z.z0,Z.z1);
  col(Z.x,ha.x0,Z.z0-0.12,Z.z0+0.12);
  col(Z.x,bu.x0,Z.z1-0.12,Z.z1+0.12);
  zWandCol('logistik',col(Z.x,ha.x1+1,Z.z0,Z.z1));
  /* Doppeltor in der Zaunflucht, verschlossen (Zauntor aus dem Baukasten) */
  bk.tor({art:'gitter',bewegung:'fluegel',breite:TB,hoehe:ZH,boden:0.35,pfosten:true,schloss:true,x:Z.x,z:TZ,ry:0});
  /* Hier stand ein Bauschild „NOCH NICHT ZU HABEN“. Auch das ist
     raus - kein Schild im Spiel soll den Spieler daran erinnern,
     was er noch nicht hat. */
  /* Abgestellte Auflieger laengs auf dem Vorplatz - quer wuerden sie
     durch die Ladenwand ragen, dazwischen liegen nur sechs Meter. */
  abstellAuflieger(43.6,-8.5,Math.PI/2,'Import',TRUCKCOL.import);
  abstellAuflieger(43.6, 5.0,Math.PI/2,'Premium',TRUCKCOL.premium);
  /* Masten und Deko, alles hinter dem Zaun */
  hofMast(42.4,ha.z0+1.0,-Math.PI/2);
  hofMast(42.4,ha.z1-2.0,-Math.PI/2);
  hofMast(bu.x1+4.0,Z.z1-2.0,Math.PI);
  palettenStapel(45.4,ha.z1-1.2,8,0.2);
  palettenStapel(44.0,ha.z1-1.4,6,-0.3);
}


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
  if(!leise) sfx.cash();
}
/* Nach dem Laden eines Spielstands alle gekauften Bereiche oeffnen */
function applyZonen(){
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
}

/* --------------------------------------------------------
   Noch nicht gekaufte Bereiche liegen hinter einer ganz normalen
   Wand: gleiches Material, gleiche Fugen, gleiche Sockelleiste wie
   im uebrigen Raum. Wer den Laden betritt, sieht schlicht eine Wand.
   Beim Kauf faellt sie weg und der Laden ist einfach groesser.
   -------------------------------------------------------- */
let _sockelM=null;
function sockelM(){ if(!_sockelM) _sockelM=std(0x1a2038); return _sockelM; }
/* Eine Wand, die nicht den Blick auf Regale verstellen soll:
   sie liegt nicht in der Liste, die der Zielstrahl abfragt. */
function stilleWand(x0,x1,z0,z1,y0,y1,inFace,inMat,exMat,ue){
  const m=wall(x0,x1,z0,z1,y0,y1,inFace,inMat,exMat,ue);
  const i=occluders.indexOf(m); if(i>=0) occluders.splice(i,1);
  return m;
}
/* Scheuerleiste auf beiden Seiten einer Wandflucht */
function sockelLeiste(id,laengs,fest,a0,a1){
  for(const s of [-1,1]){
    const o=laengs
      ? bbox(a1-a0,0.1,0.02,sockelM(),(a0+a1)/2,0.05,fest+s*(LW/2+0.011),null,false)
      : bbox(0.02,0.1,a1-a0,sockelM(),fest+s*(LW/2+0.011),0.05,(a0+a1)/2,null,false);
    if(id) zWand(id,o);
  }
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
  if(innen===shopWall) sockelLeiste(id,laengs,fest,a0,a1);
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

let _panelM=null, _korpusM=null;
function leuchtenMat(){
  if(!_panelM){ _panelM=new THREE.MeshBasicMaterial({map:deckenDiffuse(),toneMapped:false});
    _korpusM=new THREE.MeshStandardMaterial({vertexColors:true,metalness:0,roughness:0.72}); }
  return _panelM;
}
/* Deckenleuchten im Raster. Eine grosse Halle bekommt schnell dreissig
   Leuchten - als Einzelmeshes waere das teuer, deshalb wird das ganze
   Raster zu zwei Meshes verschmolzen: Korpus und Leuchtflaeche. */
function leuchtenRaster(id,r,y,ax,az){
  leuchtenMat();
  const nx=Math.max(1,Math.round((r.x1-r.x0)/ax)), nz=Math.max(1,Math.round((r.z1-r.z0)/az));
  /* Je hoeher die Halle, desto groesser die Leuchte - sonst haengen
     unter zwoelf Metern Decke nur noch Striche. */
  const f=Math.max(1,y/3.8);
  const gRev=new THREE.BoxGeometry(1.44*f,0.03*f,0.42*f), gFix=new THREE.BoxGeometry(1.36*f,0.028*f,0.36*f);
  const gDif=new THREE.PlaneGeometry(1.26*f,0.28*f);
  const korpus=[], diff=[];
  for(let i=0;i<nx;i++) for(let k=0;k<nz;k++){
    const x=r.x0+(i+0.5)*(r.x1-r.x0)/nx, z=r.z0+(k+0.5)*(r.z1-r.z0)/nz;
    korpus.push({geo:gRev,m:tm(x,y-0.008*f,z),color:0x252932});
    korpus.push({geo:gFix,m:tm(x,y-0.026*f,z),color:0xdfe3e9});
    diff.push({geo:gDif,m:tm(x,y-0.043*f,z,Math.PI/2,0,0)});
  }
  const mk=new THREE.Mesh(merge(korpus),_korpusM); scene.add(mk); zAdd(id,mk);
  const md=new THREE.Mesh(merge(diff),_panelM); scene.add(md); zAdd(id,md);
  gRev.dispose(); gFix.dispose(); gDif.dispose();
}
/* Eine ganze Halle in einem Rutsch.
   aussen sagt, welche Seiten eine echte Aussenwand bekommen;
   die uebrigen grenzen an einen Nachbarbereich. */
function halle(id,r,opt){
  opt=opt||{};
  const H=opt.h||WH;
  const lager=opt.art==='lager';
  const innen=lager?lagerWall:shopWall;
  const ceil=std(0xe6e8ee,{roughness:1});
  const au=opt.aussen||{};
  const ex=opt.ex||undefined;
  /* Boden */
  let bodenMat;
  if(lager){ const lc=concreteTex(); lc.repeat.set((r.x1-r.x0)/2,(r.z1-r.z0)/2); bodenMat=new THREE.MeshStandardMaterial({map:lc,roughness:0.85}); }
  else bodenMat=floorMat;
  if(!opt.keinBoden){
    const bo=new THREE.Mesh(new THREE.PlaneGeometry(r.x1-r.x0,r.z1-r.z0),bodenMat);
    bo.rotation.x=-Math.PI/2; bo.position.set((r.x0+r.x1)/2,0.015,(r.z0+r.z1)/2); scene.add(bo);
    if(!lager) bodenUV(bo,2);
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
  if(!opt.keinDach) bbox(r.x1-r.x0+LW*3,0.25,r.z1-r.z0+LW*3,std(0x2b2f3a),(r.x0+r.x1)/2,H+0.24,(r.z0+r.z1)/2,null,true);
  /* Aussenwaende: stehen immer, auch solange der Bereich gesperrt ist.
     Von der Strasse aus sieht man sonst ein Loch im Gebaeude. */
  if(au.w) wall(r.x0-LW,r.x0,r.z0,r.z1,0,H,'+x',innen,ex);
  if(au.e) wall(r.x1,r.x1+LW,r.z0,r.z1,0,H,'-x',innen,ex);
  if(au.n) wall(r.x0-LW,r.x1+LW,r.z1,r.z1+LW,0,H,'-z',innen,ex);
  if(au.s) wall(r.x0-LW,r.x1+LW,r.z0-LW,r.z0,0,H,'+z',innen,ex);
  if(au.w) col(r.x0-LW,r.x0,r.z0,r.z1);
  if(au.e) col(r.x1,r.x1+LW,r.z0,r.z1);
  if(au.n) col(r.x0-LW,r.x1+LW,r.z1,r.z1+LW);
  if(au.s) col(r.x0-LW,r.x1+LW,r.z0-LW,r.z0);
  /* Sockelleisten nur im Laden */
  if(!lager){
    const base=std(0x1a2038);
    if(au.n) zAdd(id,bbox(r.x1-r.x0,0.1,0.02,base,(r.x0+r.x1)/2,0.05,r.z1-0.01,null,false));
    if(au.s) zAdd(id,bbox(r.x1-r.x0,0.1,0.02,base,(r.x0+r.x1)/2,0.05,r.z0+0.01,null,false));
    if(au.w) zAdd(id,bbox(0.02,0.1,r.z1-r.z0,base,r.x0+0.01,0.05,(r.z0+r.z1)/2,null,false));
    if(au.e) zAdd(id,bbox(0.02,0.1,r.z1-r.z0,base,r.x1-0.01,0.05,(r.z0+r.z1)/2,null,false));
  }
  if(!opt.keinLicht) leuchtenRaster(id,r,H,opt.ax||(lager?3.6:3.4),opt.az||(lager?4.2:3.6));
  /* Der Bodenschatten gehoert nur an Kanten, an denen dauerhaft
     eine Wand steht - sonst bleibt er nach dem Kauf mitten im
     Raum stehen. */
  roomAO(r.x0+0.02,r.x1-0.02,r.z0+0.02,r.z1-0.02,id,opt.ao||au);
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
function stuetzeM(){ if(!_stuetzeM) _stuetzeM=std(0xdfe3ea,{roughness:0.72}); return _stuetzeM; }
function stuetze(x,z,h){
  const g=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,h-0.16,HIQ?18:10),stuetzeM());
  g.position.set(x,(h-0.16)/2,z); if(HIQ){ g.castShadow=true; g.receiveShadow=true; } scene.add(g);
  bbox(0.46,0.1,0.46,std(0x9aa0ab,{roughness:0.8}),x,0.05,z,null,false);
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
    if(mat===shopWall&&y0<=0.01) sockelLeiste(offen?id:null,laengs,fest,a2,b2);
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
function sperrbandTex(text,n){
  const wdh=n||2;
  const t=tex(1024,64,(g,W,H)=>{
    g.fillStyle='#cf1f16'; g.fillRect(0,0,W,H);
    /* dunkle Webkante oben und unten, wie bei echtem Band */
    g.fillStyle='rgba(0,0,0,.24)'; g.fillRect(0,0,W,5); g.fillRect(0,H-5,W,5);
    g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(0,7,W,4);
    g.fillStyle='#f7f8fc'; g.font=BUN(31); g.textAlign='center'; g.textBaseline='middle';
    for(let i=0;i<wdh;i++) g.fillText(text,W/(wdh*2)+i*W/wdh,H/2+2);
  });
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; t.anisotropy=8; return t;
}
/* Ein Band spannt zwischen zwei Pfosten und haengt in der Mitte
   durch. Eine gerade Leiste sieht aus wie ein roter Strich. */
function sperrband(Z,a,b,z,y,mat,parent){
  const L=b-a, durch=0.05;
  const geo=new THREE.PlaneGeometry(L,0.09,16,1);
  /* Direkt im Array rechnen: getX/setY gibt es im Testdoppel nicht,
     und das Band soll auch dort ohne Fehler gebaut werden. */
  const pos=geo.attributes&&geo.attributes.position, arr=pos&&pos.array;
  if(arr&&pos.count){
    for(let i=0;i<pos.count;i++){
      const t=(arr[i*3]+L/2)/L;
      arr[i*3+1]-=durch*Math.sin(Math.PI*t);
    }
    pos.needsUpdate=true;
    if(geo.computeVertexNormals) geo.computeVertexNormals();
  }
  const m=new THREE.Mesh(geo,mat);
  m.position.set((a+b)/2,y,z); m.userData.sperrband=true;
  (parent||scene).add(m); zWand(Z,m);
  return m;
}
/* Kapitel 1, Pyro-Kiosk: die Tuer vom Verkauf ins Lager ist mit
   Absperrband zu, wie die Hintertuer zum Testfeld. Man sieht ins
   Lager hinein, kommt aber nicht hin. Die Lieferungen landen solange
   auf der markierten Warenannahme vor der Ladentuer. */
function lagerSperre(){
  const Z='lager';
  const g=new THREE.Group(); g.position.set(-8.0,0,-2.5); g.rotation.y=Math.PI/2; scene.add(g);
  const bandM=new THREE.MeshStandardMaterial({map:sperrbandTex('LAGER · KAPITEL 2'),roughness:0.72,side:THREE.DoubleSide});
  const halt=std(0x3d4450,{metalness:0.5,roughness:0.5});
  const kopf=std(0x1f242e,{metalness:0.4,roughness:0.55});
  const a=-0.66, b=0.66;
  for(const y of [0.5,1.0,1.5]) sperrband(Z,a+0.06,b-0.06,0,y,bandM,g);
  for(const x of [a+0.04,b-0.04]){
    zWand(Z,bbox(0.05,1.76,0.05,halt,x,0.88,0,g,false));
    zWand(Z,bbox(0.08,0.05,0.08,kopf,x,1.78,0,g,false));
  }
  zWandCol(Z,col(-8.3,-7.7,-3.25,-1.75));
  /* Warenannahme auf dem Gehweg: gelbe Markierung mit Schrift */
  const m=new THREE.Mesh(new THREE.PlaneGeometry(2.7,1.75),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,
    map:tex(540,350,(c,W,H)=>{ c.clearRect(0,0,W,H);
      c.strokeStyle='#ffd23f'; c.lineWidth=12; c.setLineDash([30,16]); c.strokeRect(10,10,W-20,H-20); c.setLineDash([]);
      c.fillStyle='rgba(255,210,63,.95)'; c.font=BUN(46); c.textAlign='center'; c.textBaseline='middle';
      c.fillText('WARENANNAHME',W/2,H-52); })}));
  m.rotation.x=-Math.PI/2; m.position.set(WA.x,0.021,WA.z); m.renderOrder=2; scene.add(m);
  zWand(Z,m);
}
/* Warenannahme vor der Tuer: sechs Stellplaetze, gestapelt */
const WA={x:3.5,z:7.75};
const WA_SLOTS=[]; for(let r=0;r<2;r++) for(let c=0;c<3;c++) WA_SLOTS.push({x:WA.x-0.75+c*0.75,z:WA.z-0.42+r*0.84});
function testfeldSperre(){
  const Z='testfeld', a=4.4, b=6.1, z=-6.0;
  const bandM=new THREE.MeshStandardMaterial({map:sperrbandTex('TESTFELD GESPERRT'),roughness:0.72,side:THREE.DoubleSide});
  const halt=std(0x3d4450,{metalness:0.5,roughness:0.5});
  const kopf=std(0x1f242e,{metalness:0.4,roughness:0.55});
  for(const y of [0.5,1.0,1.5]) sperrband(Z,a+0.06,b-0.06,z,y,bandM);
  /* Zwei Pfosten in den Laibungen, an denen das Band haengt */
  for(const x of [a+0.04,b-0.04]){
    zWand(Z,bbox(0.05,1.76,0.05,halt,x,0.88,z,null,false));
    zWand(Z,bbox(0.08,0.05,0.08,kopf,x,1.78,z,null,false));
    for(const y of [0.5,1.0,1.5]) zWand(Z,bbox(0.075,0.035,0.035,kopf,x,y,z,null,false));
  }
  /* Schild ueber dem Durchgang, wie das Schild an der Lagertuer.
     Es bleibt stehen, auch nachdem der Zugang gekauft ist - es
     sagt, wohin die Tuer fuehrt, nicht dass sie zu ist. */
  plane(1.4,0.35,new THREE.MeshStandardMaterial({map:tex(280,70,(g,W,Hh)=>{
    g.fillStyle='#f2c230'; g.fillRect(0,0,W,Hh);
    g.fillStyle='#16181f'; g.font=BUN(38); g.textAlign='center'; g.textBaseline='middle';
    g.fillText('TESTFELD',W/2,Hh/2+2); })}),(a+b)/2,2.85,z+0.12,0,null);
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
  const bc=concreteTex(); bc.repeat.set(breite/2,tiefe/2);
  const bo=new THREE.Mesh(new THREE.PlaneGeometry(breite,tiefe),
    new THREE.MeshStandardMaterial({map:bc,roughness:0.85}));
  bo.rotation.x=-Math.PI/2; bo.position.set(mitteX,0.016,mitteZ); scene.add(bo); zAdd(Z,bo);
  /* Decke und Dachrand */
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(breite+0.3,tiefe+0.3),std(0xe6e8ee,{roughness:1}));
  ce.rotation.x=Math.PI/2; ce.position.set(mitteX,G.h-0.01,mitteZ); scene.add(ce); zAdd(Z,ce);
  /* Der Dachrand deckt die Kopf- und Suedwand ab, aber keinen
     Zentimeter mehr: mit dem sonst ueblichen Ueberstand ragte er
     durch die Ostwand der Lagerhalle Sued hinein. */
  /* Dachrand in beiden Richtungen INNERHALB der angrenzenden Waende.
     Lag er mit -5,9 genau in der Ebene der Ladenrueckwand, flimmerte
     er von innen als dunkler Streifen ueber der Uhr. */
  zAdd(Z,bbox(breite+LW,0.25,tiefe+LW,std(0x2b2f3a),mitteX,G.h+0.13,mitteZ,null,true));
  /* Suedwand mit dem Durchgang aufs Testfeld. Der Sturz bleibt
     stehen, sonst steht das Dach in der Luft. */
  const zs=G.z0;
  /* Laibung des Testfelddurchgangs in der Fassade, nicht in Grau */
  const lb=wallBrickMat();
  /* Die Enden stecken bis zur Mitte in den Kopfwaenden. Reichten sie
     bis zu deren Innenflaeche, lag die Stirnseite genau in derselben
     Ebene - in der Halle hinterm Laden und im Lager flimmerte dann
     ein 20 cm breiter, 2,9 m hoher grauer Streifen auf der Wand. */
  zAdd(Z,wall(G.x0-LW/2,GANGTUER.a,zs-LW,zs,0,G.h,'+z',lagerWall,null,0,lb));
  zAdd(Z,wall(GANGTUER.b,G.x1+LW/2,zs-LW,zs,0,G.h,'+z',lagerWall,null,0,lb));
  zAdd(Z,wall(GANGTUER.a,GANGTUER.b,zs-LW,zs,2.5,G.h,'+z',lagerWall,null,0,lb));
  zCol(Z,col(G.x0-LW,GANGTUER.a,zs-LW,zs));
  zCol(Z,col(GANGTUER.b,G.x1+LW,zs-LW,zs));
  leuchtenRaster(Z,{x0:G.x0,x1:G.x1,z0:G.z0,z1:G.z1},G.h,3.4,2.6);
  roomAO(G.x0+0.02,G.x1-0.02,G.z0+0.02,G.z1-0.02);
  /* Hinweisschild ueber dem Durchgang zum Lager */
  zAdd(Z,plane(1.5,0.3,new THREE.MeshBasicMaterial({toneMapped:false,side:THREE.DoubleSide,
    map:tex(512,104,(g,W,H)=>{
      g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
      g.fillStyle='#f2c230'; g.fillRect(0,H-7,W,7);
      g.textAlign='center'; g.textBaseline='middle';
      g.fillStyle='#e8ecf5'; g.font=BUN(36); g.fillText('◄  LAGER · GROSSHANDEL',W/2,H/2-3);
    })}),mitteX,2.45,G.z1-0.06,Math.PI,null));
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
let _pvcM=null;
function pvcMat(){
  if(!_pvcM) _pvcM=new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,
    opacity:0.38,roughness:0.3,metalness:0,side:THREE.DoubleSide,depthWrite:false});
  return _pvcM;
}
function streifenvorhang(zid,laengs,fest,a0,a1,hoehe){
  const len=a1-a0, mitte=(a0+a1)/2, H=hoehe-0.12;
  /* Traverse mit Halteklemmen */
  const stahl=std(0x8d939d,{metalness:0.6,roughness:0.4});
  zAdd(zid,laengs
    ? bbox(len+0.16,0.1,0.14,stahl,mitte,hoehe-0.05,fest,null,false)
    : bbox(0.14,0.1,len+0.16,stahl,fest,hoehe-0.05,mitte,null,false));
  /* Die Streifen ueberlappen sich um sechs Zentimeter, so wie an
     jeder Laderampe. Alles in ein Mesh, sonst haengen an drei
     Durchgaengen fuenfzig Einzelobjekte in der Szene. */
  const B=0.30, T=0.24, n=Math.max(2,Math.floor(len/T));
  const rest=(len-(n-1)*T-B)/2;
  const geo=new THREE.BoxGeometry(B,H,0.006);
  const teile=[];
  for(let i=0;i<n;i++){
    const a=a0+rest+B/2+i*T;
    const kipp=(i%2?1:-1)*0.035;           /* leicht schraeg, wie benutzt */
    teile.push({geo,color:i%2?0xeef3f7:0xe4ecf2,
      m:laengs?tm(a,H/2+0.02,fest,0,kipp,0):tm(fest,H/2+0.02,a,0,Math.PI/2+kipp,0)});
  }
  const m=new THREE.Mesh(merge(teile),pvcMat());
  m.renderOrder=1; scene.add(m); zAdd(zid,m);
  geo.dispose();
  return m;
}
function buildSchleuse(){
  const S2=LAY.schleuse, H=SCHLEUSE_H;
  const mx=(S2.x0+S2.x1)/2, mz=(S2.z0+S2.z1)/2;
  const br=S2.x1-S2.x0, ti=S2.z1-S2.z0;
  const bc=concreteTex(); bc.repeat.set(br/2,ti/2);
  const bo=new THREE.Mesh(new THREE.PlaneGeometry(br,ti),
    new THREE.MeshStandardMaterial({map:bc,roughness:0.85}));
  bo.rotation.x=-Math.PI/2; bo.position.set(mx,0.016,mz); scene.add(bo);
  /* Die Decke endet buendig in den beiden Gebaeudewaenden. Mit dem
     ueblichen Ueberstand schaute ihre Kante als dunkler Streifen in
     die Lagerhalle hinein. */
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(br-0.2,ti+0.3),std(0xe6e8ee,{roughness:1}));
  ce.rotation.x=Math.PI/2; ce.position.set(mx,H-0.01,mz); scene.add(ce);
  /* Der Dachrand darf nur bis in die Gebaeudewaende reichen. Mit dem
     ueblichen Ueberstand stand er als schwarzer Balken frei in der
     Lagerhalle. */
  /* Der Dachrand endet INNERHALB der beiden Gebaeudewaende. Lag seine
     Kante genau in der Wandebene, flimmerte die dunkle Platte durch
     den Sturz und stand als schwarzer Balken in der Lagerhalle. */
  bbox(br,0.25,ti+LW*2,std(0x2b2f3a),mx,H+0.24,mz,null,true);
  /* Laengswaende. Die Kopfenden sind die Gebaeudewaende selbst. */
  for(const [z0,z1] of [[S2.z0-LW,S2.z0],[S2.z1,S2.z1+LW]]){
    wall(S2.x0,S2.x1,z0,z1,0,H,z0<mz?'+z':'-z',lagerWall);
    col(S2.x0,S2.x1,z0,z1);
  }
  leuchtenRaster(null,S2,H,3.0,3.0);
  roomAO(S2.x0+0.02,S2.x1-0.02,S2.z0+0.02,S2.z1-0.02);
}
/* =========================================================
   Lagerterminal im Grosshandel. Der Laptop im Buero-Eck steht auf
   der Verkaufsflaeche - wer im Grosshandel steht, hat einen
   halben Kilometer Fussweg dorthin. Hier steht ein zweites
   Terminal fuer alles, was das Lager betrifft.
   ========================================================= */
let lapHit2=null;
function buildLagerTerminal(){
  const g=new THREE.Group(); g.position.set(LAY.lwest.x1-2.2,0,-16.0); g.rotation.y=-Math.PI/2;
  scene.add(g); zAdd('lager_west',g);
  /* Gewollte Einrichtung. leer.js prueft, dass in den Hallen nichts
     steht, was dort nicht hingehoert - diese Markierung nimmt das
     Terminal davon aus. */
  g.userData.inventar=true;
  const stahl=std(0x767d88,{metalness:0.68,roughness:0.38});
  const dunkel=std(0x2b303c,{metalness:0.25,roughness:0.5});
  /* Stahltisch auf Rahmengestell */
  bbox(1.7,0.05,0.8,std(0xb8bec8,{metalness:0.5,roughness:0.42}),0,0.82,0,g);
  for(const sx of [-0.76,0.76]){
    bbox(0.07,0.8,0.07,stahl,sx,0.4,0.33,g,false);
    bbox(0.07,0.8,0.07,stahl,sx,0.4,-0.33,g,false);
    bbox(0.06,0.06,0.72,stahl,sx,0.12,0,g,false);
  }
  bbox(1.6,0.05,0.06,stahl,0,0.12,0.3,g,false);
  /* Rueckwand mit Lochblech und zwei Bildschirmen */
  bbox(1.7,0.95,0.04,std(0x9aa1ac,{metalness:0.55,roughness:0.5}),0,1.32,-0.38,g,false);
  for(const sx of [-0.42,0.42]){
    bbox(0.62,0.38,0.03,dunkel,sx,1.42,-0.34,g,false);
    plane(0.58,0.34,new THREE.MeshBasicMaterial({toneMapped:false,map:tex(320,190,(c,W,H)=>{
      c.fillStyle='#0b1020'; c.fillRect(0,0,W,H);
      c.fillStyle='#1d2b48'; for(let i=0;i<7;i++) c.fillRect(14,18+i*23,W-28,15);
      c.fillStyle='#6cf2a8'; for(let i=0;i<7;i++) c.fillRect(14,18+i*23,rand(40,W-40),15);
      c.fillStyle='#ffd23f'; c.font=BUN(22); c.textAlign='left'; c.textBaseline='middle';
      c.fillText('LAGER',16,12);
    })}),sx,1.42,-0.315,0,g);
  }
  /* Laptop auf dem Tisch */
  bbox(0.42,0.02,0.3,dunkel,0,0.855,0.04,g,false);
  { const d=bbox(0.42,0.28,0.02,dunkel,0,1.0,-0.1,g,false); d.rotation.x=-0.28;
    const sch=neuerSchoner(480,304,'Lagerterminal');
    const sc=plane(0.38,0.24,new THREE.MeshBasicMaterial({toneMapped:false,map:sch.t}),0,1.0,-0.088,0,g); sc.rotation.x=-0.28; sch.mesh=sc; }
  /* Rollcontainer und Papierkorb, damit die Ecke nicht leer wirkt */
  rbox(0.4,0.56,0.5,0.014,dunkel,0.62,0.3,0.1,g);
  lapHit2=bbox(1.8,1.2,1.0,hitM,0,0.9,0,g,false);
  lapHit2.userData={kind:'laptop2'};
  zCol('lager_west',col(LAY.lwest.x1-3.1,LAY.lwest.x1-1.3,-16.9,-15.1));
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
  const ceil=std(0xe6e8ee,{roughness:1});
  /* Verkauf: Basis, Ost I und Ost II liegen in einer Flucht, das
     Rueckgebaeude haengt darunter. Die zweite Platte liegt einen
     Millimeter tiefer, damit sich die beiden im Ueberlappungs-
     streifen nicht gegenseitig zerflimmern. */
  fugenPlatte({x0:-7.9,x1:37.9,z0:-5.9,z1:5.9},floorMat,0.012,false,2);
  fugenPlatte({x0: 8.0,x1:37.9,z0:-21.9,z1:-5.9},floorMat,0.011,false,2);
  fugenPlatte({x0:-7.9,x1:37.9,z0:-5.9,z1:5.9},ceil,WH-0.006,true);
  fugenPlatte({x0: 8.0,x1:37.9,z0:-21.9,z1:-5.9},ceil,WH-0.0065,true);
  /* Lager: Basislager mit Anbau Nord, dazu die Halle Sued */
  const bet=(r)=>{ const t=concreteTex(); t.repeat.set((r.x1-r.x0)/2,(r.z1-r.z0)/2);
    return new THREE.MeshStandardMaterial({map:t,roughness:0.85}); };
  const l1={x0:-19.9,x1:-8.1,z0:-5.9,z1:5.9}, l2={x0:-19.9,x1:-8.1,z0:-29.9,z1:-5.9};
  fugenPlatte(l1,bet(l1),0.012,false);
  fugenPlatte(l2,bet(l2),0.011,false);
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
  durchbruchWand('shop_sued',true,LAY.sued.z1,LAY.sued.x0,LAY.sued.x1,[[10.0,17.0],[24.0,32.0]],shopWall,shopWall,null,null,null,true);
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
  halle('lager_sued2',LAY.ls3,{art:'lager',aussen:{s:true},ao:{s:true,w:true,e:true},h:HALLE_H});
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
  durchbruchWand('lager_west',false,LAY.lsued.x0,LAY.lsued.z0,LAY.lsued.z1,ST,lagerWall,undefined,3.0,HALLE_H,'+x');
  /* Nur das Stueck in der Schleuse zeigt nach aussen in den Gang -
     dort gehoert die Lagerwand hin, sonst stossen im Gang zwei
     verschiedene Waende aneinander. Der lange Rest steht im Hof und
     bekommt dieselbe Aussenhaut wie die uebrige Halle; vorher zog
     sich die gelbe Lagerwand ueber die ganze Ostseite ins Freie. */
  buildSchleuse();
  /* Die beiden Schleusentore und der Gang bekommen Streifenvorhaenge
     statt blanker Loecher. */
  streifenvorhang('lager_west',false,LAY.lsued.x0,ST[0][0],ST[0][1],3.0);
  streifenvorhang('lager_west',false,LAY.lwest.x1,ST[0][0],ST[0][1],3.0);

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
  durchbruchWand('shop_sued',false,7.9,GANG.z1,LAY.sued.z1,[],shopWall,undefined,2.5,WH,'+x');
  /* Der Gang muendet in die Halle Sued und wird mit ihr freigegeben. */
  /* Der Gang muendet in den ersten Abschnitt der Halle Sued, wird
     aber erst mit dem Grosshandel geoeffnet - vorher fuehrt er
     nirgendwohin. */
  durchbruchWand('lager_west',false,-8.0,LAY.lsued.z0,LAY.lsued.z1,GT,lagerWall,undefined,2.5,HALLE_H,'-x');
  streifenvorhang('lager_west',false,-8.0,GT[0][0],GT[0][1],2.5);
  buildLagergang();
  testfeldSperre();
  lagerSperre();
  buildLagerTerminal();
  buildPackstation();
  buildLogistikHalle();
  buildLogistik();
}

/* =========================================================
   Packstation: Packtisch, Kartonlager, Waage, Paketrutsche
   ========================================================= */
let packHit=null, packTisch=null, packMov=null;
/* Die ganze Versandecke in Gruppenkoordinaten, Packtisch in der
   Mitte bei 0/0. PACK_FL ist die Flaeche, die sie belegt - Boden,
   Paketablage, Schild und Absperrband zusammen. */
const PACK_FL={x0:-1.75,x1:5.95,z0:-1.42,z1:1.28};
const PACK_HOME={x:-18.0,z:-8.6,ry:0};
function buildPackstation(){
  /* Die Packstation steht jetzt im ersten Abschnitt der Halle
     Sued, gleich hinter dem Rolltor - dort, wo der LKW anfaehrt
     und die Ware hereinkommt. Vorher stand sie im Anbau Nord,
     quer durch das ganze Lager vom Wareneingang entfernt. */
  /* Die Ecke steht mit ihrer ganzen Flaeche im ersten Hallen-
     abschnitt: Westkante an der Wand, und im Osten bleibt der
     Stellplatz fuer das erste Lagerregal frei. */
  const id='packstation', PX=PACK_HOME.x, PZ=PACK_HOME.z;
  /* Die Packstation steht von Anfang an da. Man soll sehen, was
     man sich damit kauft - bis dahin haengt ein Absperrband
     davor. Vorher war an dieser Stelle einfach leerer Boden. */
  const g=new THREE.Group(); g.position.set(PX,0,PZ); scene.add(g);
  packTisch=g;
  const stahl=std(0x7d838c,{metalness:0.6,roughness:0.4});
  const dunkel=std(0x2f343e,{metalness:0.45,roughness:0.5});
  const platte=new THREE.MeshStandardMaterial({roughness:0.42,metalness:0.12,
    map:(()=>{ const t=tex(512,256,(c,W,H)=>{
      const gr=c.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#cdd3dc'); gr.addColorStop(1,'#aeb5c0');
      c.fillStyle=gr; c.fillRect(0,0,W,H);
      for(let i=0;i<1800;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.04})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
      for(let i=0;i<30;i++){ c.strokeStyle=`rgba(120,128,140,${rand(0.05,0.18)})`; c.lineWidth=rand(0.5,1.4);
        const x=Math.random()*W,y=Math.random()*H; c.beginPath(); c.moveTo(x,y); c.lineTo(x+rand(-70,70),y+rand(-8,8)); c.stroke(); }
    }); t.anisotropy=8; return t; })()});
  /* Packtisch mit Untergestell und Rollenbahn */
  rbox(2.6,0.06,0.9,0.012,platte,0,0.92,0,g);
  bbox(2.64,0.05,0.94,dunkel,0,0.87,0,g,false);
  for(const sx of [-1.15,1.15]) for(const sz of [-0.36,0.36]){
    bbox(0.07,0.88,0.07,stahl,sx,0.44,sz,g);
    bbox(0.13,0.02,0.13,dunkel,sx,0.011,sz,g,false);
  }
  for(const sz of [-0.36,0.36]) bbox(2.3,0.05,0.05,stahl,0,0.28,sz,g,false);
  /* Ablage unten mit leeren Kartons */
  bbox(2.3,0.03,0.7,dunkel,0,0.3,0,g,false);
  for(let k=0;k<4;k++) bbox(0.5,0.34,0.4,std(0xc9a978,{roughness:0.9}),-0.9+k*0.6,0.5,0.02,g,true);
  /* Rollenbahn zur Abholrampe */
  for(let k=0;k<9;k++){
    const r=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.62,10),stahl);
    r.rotation.x=Math.PI/2; r.position.set(1.5+k*0.26,0.9,0); g.add(r);
  }
  for(const sz of [-0.33,0.33]) bbox(2.5,0.09,0.05,dunkel,2.54,0.86,sz,g,false);
  for(const sx of [1.6,3.4]) for(const sz of [-0.33,0.33]) bbox(0.06,0.86,0.06,stahl,sx,0.43,sz,g);
  /* Waage, Etikettendrucker, Klebebandroller */
  bbox(0.46,0.07,0.4,dunkel,-0.95,0.98,0.1,g,false);
  bbox(0.3,0.012,0.28,std(0x9aa1ac,{metalness:0.7,roughness:0.3}),-0.95,1.02,0.1,g,false);
  const disp=plane(0.2,0.08,new THREE.MeshBasicMaterial({toneMapped:false,map:tex(200,80,(c,W,H)=>{
    c.fillStyle='#0d1a12'; c.fillRect(0,0,W,H);
    c.fillStyle='#6cf2a8'; c.font=BUN(38); c.textAlign='right'; c.textBaseline='middle';
    c.fillText('1,24 kg',W-12,H/2); })}),-0.95,1.04,-0.14,0,g);
  disp.rotation.x=-1.1;
  /* Drucker, Etiketten und Klebeband an der Hinterkante: vorne
     laeuft das Paket vom Zukleben zur Rollenbahn durch */
  rbox(0.36,0.22,0.22,0.02,dunkel,0.55,1.06,-0.33,g);
  bbox(0.3,0.012,0.16,std(0xf2f0e8),-0.95,0.956,-0.3,g,false);
  const roll=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.09,14),std(0xd8b46a,{roughness:0.7}));
  roll.rotation.z=Math.PI/2; roll.position.set(1.05,1.03,-0.33); g.add(roll);
  /* Hinweisschild ueber dem Tisch */
  for(const sx of [-1.2,1.2]) bbox(0.06,1.5,0.06,stahl,sx,1.72,-0.42,g,false);
  bbox(2.6,0.5,0.05,std(0x1b2340,{roughness:0.7}),0,2.3,-0.42,g,false);
  packSchildTex=tex(1024,200,()=>{});
  /* Die Schrift gehoert auf die Seite, von der man kommt: der
     Zugang zum Anbau liegt im Sueden. Vorher las man das Schild
     nur, wenn man mit dem Ruecken zur Wand stand. */
  plane(2.5,0.44,new THREE.MeshBasicMaterial({map:packSchildTex,toneMapped:false}),0,2.3,-0.455,Math.PI,g);
  drawPackSchild();
  const hit=bbox(3.0,2.0,1.4,hitM,0.6,1.0,0,g,false);
  hit.userData={kind:'pack'}; packHit=hit;
  versandFlaeche(g);
  paketAblage(g);
  packSperre(id,g);
  vsWagenBauen(g);
  /* Die ganze Ecke ist ein Moebel: im Umbaumodus greift man sie
     irgendwo an - Tisch, Boden, Schild - und alles wandert mit.
     So kann man die Halle spaeter anders mit Regalen fuellen.
     Blockiert wird nur, wo wirklich etwas steht; das Absperrband
     nur, solange die Station noch nicht gekauft ist. */
  packMov=addMovable({kind:'pack',name:'Versandecke',g,flaeche:PACK_FL,
    teile:()=>{
      const t=[{x0:-1.4,x1:3.9,z0:-0.5,z1:0.5}];               /* Tisch und Rollenbahn */
      for(const sx of DDL_MAST) t.push({x0:sx-0.13,x1:sx+0.13,z0:DDL_Z-0.13,z1:DDL_Z+0.13});
      if(!zoneOffen(id)) t.push({x0:PACK_FL.x0,x1:3.95,z0:1.03,z1:1.27});
      /* der geparkte Kommissionierwagen (ab dem Kauf, solange er nicht unterwegs ist) */
      else if(vsWagen&&vsWagen.parent===g) t.push({x0:0.75,x1:1.77,z0:0.58,z1:1.28});
      return t;
    }});
  zHook(id,()=>{ if(packMov&&grabbed!==packMov) applyFootprint(packMov); });
}
/* Absperrband vor der Packstation, solange sie nicht gekauft ist.
   Drei Pfosten, zwei Baender dazwischen - man sieht darueber
   hinweg, kommt aber nicht heran. Es haengt in der Gruppe der
   Station und wandert beim Umbau mit. */
function packSperre(id,g){
  /* Die Seite zum Rolltor, dort kommt man her. Das Band reicht
     ueber den Tisch, nicht ueber die Paketablage - der Weg nach
     Sueden muss frei bleiben. */
  const zb=1.15, x0=-1.7, x1=3.9;
  const bandM=new THREE.MeshStandardMaterial({map:sperrbandTex('NOCH NICHT FREIGESCHALTET'),
    roughness:0.72,side:THREE.DoubleSide});
  const halt=std(0x3d4450,{metalness:0.5,roughness:0.5});
  const kopf=std(0x1f242e,{metalness:0.4,roughness:0.55});
  const mitte=(x0+x1)/2;
  for(const [a,b] of [[x0,mitte],[mitte,x1]])
    for(const y of [0.55,1.05]) sperrband(id,a+0.04,b-0.04,zb,y,bandM,g);
  for(const x of [x0,mitte,x1]){
    zWand(id,bbox(0.055,1.2,0.055,halt,x,0.6,zb,g,false));
    zWand(id,bbox(0.09,0.055,0.09,kopf,x,1.22,zb,g,false));
    zWand(id,bbox(0.2,0.03,0.2,kopf,x,0.015,zb,g,false));
  }
}
/* Der Packtisch stand bisher frei im Lager herum, als haette ihn
   jemand vergessen. Er bekommt eine eigene Flaeche: markierter
   Boden mit Beschriftung, Schild an der Westwand und ein
   Abholfeld fuer DDL am Ende der Rollenbahn. */
/* Masten des DDL-Schilds, in Gruppenkoordinaten */
const DDL_X=4.95, DDL_Z=-1.3, DDL_MAST=[DDL_X-0.43,DDL_X+0.43];
function versandFlaeche(g){
  /* Die Bodenflaeche endet mit der Rollenbahn. Dahinter liegt die
     Paketablage als eigene Markierung - vorher lagen gelbe Felder
     mitten auf dem Schriftzug. */
  const BW=5.6, BT=1.8, cxl=1.1;
  const t=tex(1120,360,(c,W,H)=>{
    c.fillStyle='#57606c'; c.fillRect(0,0,W,H);
    for(let i=0;i<8000;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.03})`;
      c.fillRect(Math.random()*W,Math.random()*H,2,2); }
    /* Gelbe Umrandung mit Schraffur an den Schmalseiten */
    c.strokeStyle='#f2c230'; c.lineWidth=14; c.strokeRect(7,7,W-14,H-14);
    c.save(); c.beginPath(); c.rect(0,0,W,H); c.clip();
    c.strokeStyle='rgba(242,194,48,.75)'; c.lineWidth=10;
    for(const x0 of [0,W-62]) for(let y=-H;y<H*2;y+=34){
      c.beginPath(); c.moveTo(x0,y); c.lineTo(x0+62,y-62); c.stroke(); }
    c.restore();
    c.fillStyle='rgba(242,194,48,.9)';
    c.textAlign='center'; c.textBaseline='middle';
    fitFont(c,'VERSANDZENTRUM',W-190,104,BUN);
    c.fillText('VERSANDZENTRUM',W/2,H/2+6);
  });
  const bo=new THREE.Mesh(new THREE.PlaneGeometry(BW,BT),
    new THREE.MeshStandardMaterial({map:t,roughness:0.62}));
  /* Man kommt vom Rolltor her, also muss die Schrift von dort aus
     lesbar sein. */
  bo.rotation.x=-Math.PI/2; bo.position.set(cxl,0.022,-0.05);
  g.add(bo);
  /* Abholschild hinter der Paketablage */
  const dt=tex(520,260,(c,W,H)=>{
    c.fillStyle='#1b2340'; c.fillRect(0,0,W,H);
    c.strokeStyle='#ffd23f'; c.lineWidth=10; c.strokeRect(8,8,W-16,H-16);
    c.textAlign='center'; c.textBaseline='middle';
    c.fillStyle='#ffd23f'; c.font=BUN(58); c.fillText('ABHOLUNG',W/2,66);
    c.fillStyle='#ffffff'; c.font=BUN(72); c.fillText('DDL',W/2,142);
    c.fillStyle='#bcd0ea'; c.font=BAR(34); c.fillText('täglich ab 18:00 Uhr',W/2,212);
  });
  const stahl=std(0x8d939d,{metalness:0.6,roughness:0.4});
  /* Zwei Masten an den Seiten. Einer in der Mitte stand genau vor
     der Schrift und schnitt "ABHOLUNG DDL" entzwei. */
  for(const sx of DDL_MAST){
    bbox(0.06,2.05,0.06,stahl,sx,1.02,DDL_Z,g,false);
    bbox(0.22,0.035,0.22,std(0x2f343e,{roughness:0.8}),sx,0.018,DDL_Z,g,false);
  }
  bbox(1.06,0.56,0.05,std(0x2f343d,{metalness:0.4,roughness:0.55}),DDL_X,1.72,DDL_Z,g,false);
  /* beidseitig bedruckt - im Lager laeuft man von beiden Seiten daran vorbei */
  for(const sg of [-1,1])
    plane(1.0,0.5,new THREE.MeshStandardMaterial({map:dt,roughness:0.6}),
      DDL_X,1.72,DDL_Z+sg*0.032,sg<0?Math.PI:0,g);
  /* Das VERSAND-Schild an der Westwand ist weg: die Ecke laesst
     sich jetzt verschieben, und ein Schild, das mitwandert, stuende
     frei im Raum. Das Schild ueber dem Packtisch sagt dasselbe. */
}
/* Paketablage: aufgemalt statt sechs gelber Platten. Ein Rahmen,
   vier Stapelfelder mit Eckmarken und die Beschriftung zur Seite,
   von der man kommt. Die Pakete stapeln sich auf den Feldern. */
const ABLAGE={x0:4.0,x1:5.9,z0:-0.975,z1:0.875};
function paketAblage(g){
  const A=ABLAGE, PXM=400, W=Math.round((A.x1-A.x0)*PXM), H=Math.round((A.z1-A.z0)*PXM);
  const cx=x=>(x-A.x0)*PXM, cy=z=>(z-A.z0)*PXM;
  const t=tex(W,H,(c)=>{
    c.clearRect(0,0,W,H);
    const gelb='rgba(242,194,48,.92)';
    c.strokeStyle=gelb; c.lineWidth=16; c.strokeRect(8,8,W-16,H-16);
    /* Trennlinie zur Schriftzeile */
    const ty=cy(0.5);
    c.fillStyle=gelb; c.fillRect(8,ty-5,W-16,10);
    /* vier Stapelfelder: nur die Ecken, wie auf dem Hallenboden ueblich */
    c.lineWidth=7; c.lineCap='square';
    for(const p of VS_FELD){
      const a=cx(p.x-0.45), b=cx(p.x+0.45), o=cy(p.z-0.32), u=cy(p.z+0.32), L=40;
      c.beginPath();
      c.moveTo(a,o+L); c.lineTo(a,o); c.lineTo(a+L,o);
      c.moveTo(b-L,o); c.lineTo(b,o); c.lineTo(b,o+L);
      c.moveTo(b,u-L); c.lineTo(b,u); c.lineTo(b-L,u);
      c.moveTo(a+L,u); c.lineTo(a,u); c.lineTo(a,u-L);
      c.stroke();
    }
    c.fillStyle=gelb; c.textAlign='center'; c.textBaseline='middle';
    fitFont(c,'PAKETABLAGE',W-90,96,BUN);
    c.fillText('PAKETABLAGE',W/2,(ty+H-16)/2+4);
  });
  const m=new THREE.Mesh(new THREE.PlaneGeometry(A.x1-A.x0,A.z1-A.z0),
    new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,roughness:0.6,
      polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  m.rotation.x=-Math.PI/2; m.position.set((A.x0+A.x1)/2,0.02,(A.z0+A.z1)/2);
  g.add(m);
}
let packSchildTex=null;
function packBereit(){ return zoneOffen('packstation')&&S&&S.up&&S.up.onlineshop; }
function drawPackSchild(){
  if(!packSchildTex) return;
  redraw(packSchildTex,(g,W,H)=>{
    g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
    g.textAlign='center'; g.textBaseline='middle';
    if(packBereit()){
      g.fillStyle='#6cf2a8'; g.font=BUN(58); g.fillText('VERSAND · BEREIT',W/2,H/2-14);
      g.fillStyle='#bcd0ea'; g.font=BAR(34); g.fillText(`${S.offen|0} Bestellung${(S.offen|0)===1?'':'en'} offen · ${S.pakete|0} Paket${(S.pakete|0)===1?'':'e'} zur Abholung`,W/2,H-38);
    } else {
      g.fillStyle='#ffd23f'; g.font=BUN(52); g.fillText('VERSAND',W/2,H/2-16);
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
let _blech=null;
function blechMat(){
  if(_blech) return _blech;
  const t=tex(256,64,(g,W,H)=>{
    g.fillStyle='#b9bec6'; g.fillRect(0,0,W,H);
    /* eine Sicke je 32 px, also je 0,4 m */
    for(let x=0;x<W;x+=32){
      const gr=g.createLinearGradient(x,0,x+32,0);
      gr.addColorStop(0.00,'#8f959e'); gr.addColorStop(0.16,'#cfd4da');
      gr.addColorStop(0.42,'#e4e8ed'); gr.addColorStop(0.58,'#c4c9d1');
      gr.addColorStop(0.84,'#9aa0a9'); gr.addColorStop(1.00,'#7d838c');
      g.fillStyle=gr; g.fillRect(x,0,32,H);
      g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(x+12,0,2,H);
      g.fillStyle='rgba(0,0,0,.18)';       g.fillRect(x+30,0,2,H);
    }
    for(let i=0;i<900;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.05})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
  });
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1/3.2,1/3.2); t.anisotropy=8;
  _blech=new THREE.MeshStandardMaterial({map:t,roughness:0.52,metalness:0.38});
  return _blech;
}
/* Sektionaltorblatt, geschlossen. Fuenf Panele, mittleres mit Fenstern. */
let _torBlatt=null;
function torBlattMat(){
  if(_torBlatt) return _torBlatt;
  const t=tex(512,640,(g,W,H)=>{
    const ph=H/5;
    for(let i=0;i<5;i++){
      const y=i*ph;
      const gr=g.createLinearGradient(0,y,0,y+ph);
      gr.addColorStop(0,'#e9ebee'); gr.addColorStop(0.1,'#f4f5f7');
      gr.addColorStop(0.5,'#dcdfe4'); gr.addColorStop(0.9,'#eff1f3'); gr.addColorStop(1,'#b7bcc3');
      g.fillStyle=gr; g.fillRect(0,y,W,ph);
      for(let k=y+18;k<y+ph-14;k+=22){ g.fillStyle='rgba(255,255,255,.45)'; g.fillRect(0,k,W,2);
        g.fillStyle='rgba(110,116,126,.28)'; g.fillRect(0,k+2,W,3); }
      g.fillStyle='rgba(50,56,66,.45)'; g.fillRect(0,y+ph-5,W,5);
      if(i===1){ for(let k=0;k<4;k++){ const wx=48+k*108;
          g.fillStyle='#6f7a88'; g.fillRect(wx-3,y+22,84,ph-47);
          const gg=g.createLinearGradient(wx,y+24,wx+78,y+ph-26);
          gg.addColorStop(0,'#aab8c8'); gg.addColorStop(0.5,'#8d9db0'); gg.addColorStop(1,'#c3cedb');
          g.fillStyle=gg; g.fillRect(wx,y+25,78,ph-53); } }
    }
    /* Schmutzrand und Anfahrspuren unten */
    const gr2=g.createLinearGradient(0,H-90,0,H);
    gr2.addColorStop(0,'rgba(86,82,74,0)'); gr2.addColorStop(1,'rgba(86,82,74,.3)');
    g.fillStyle=gr2; g.fillRect(0,H-90,W,90);
    for(let i=0;i<20;i++){ g.strokeStyle=`rgba(120,126,136,${rand(0.08,0.24)})`; g.lineWidth=rand(0.6,1.8);
      const x=Math.random()*W,y=H-rand(0,150); g.beginPath(); g.moveTo(x,y); g.lineTo(x+rand(-70,70),y+rand(-4,4)); g.stroke(); }
  });
  t.anisotropy=8;
  _torBlatt=new THREE.MeshStandardMaterial({map:t,metalness:0.4,roughness:0.46});
  return _torBlatt;
}
/* Die Innenseite eines Westtores. Sie zeigt dasselbe wie das Tor
   an der Basisrampe: Fuehrungsschienen, Torwelle mit Federn,
   Antrieb mit Kette, Warnleuchte, Ampel und Bedienkasten. Die
   Halle liegt oestlich der Wand, innen ist also +x. */
function westTorInnen(g,steel,dark,kante,eintrag){
  const H=WTOR.h, B=WTOR.w;
  const hell=std(0x6a707a,{metalness:0.7,roughness:0.35});
  /* Senkrechte Schienen bis ueber die Torhoehe: das Blatt faehrt
     gerade nach oben, die Halle ist zwoelf Meter hoch. */
  for(const dz of [-1,1]){
    bbox(0.08,H*2+0.2,0.08,steel,0.12,(H*2+0.2)/2,dz*(B/2+0.1),g,false);
    for(let k=0;k<4;k++)
      bbox(0.38,0.05,0.05,steel,0.3,0.7+k*(H*2)/4,dz*(B/2+0.1),g,false);
  }
  /* Torwelle mit Federn, Seiltrommeln und Konsolen */
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.038,0.038,B+0.7,HIQ?12:8),steel);
  shaft.rotation.x=Math.PI/2; shaft.position.set(0.3,H+0.34,0); g.add(shaft);
  for(const dz of [-0.8,0.8]){
    const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.9,HIQ?14:8),hell);
    sp.rotation.x=Math.PI/2; sp.position.set(0.3,H+0.34,dz); g.add(sp);
  }
  for(const dz of [-1,1]){
    const dr=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.085,0.1,HIQ?14:8),steel);
    dr.rotation.x=Math.PI/2; dr.position.set(0.3,H+0.34,dz*(B/2+0.02)); g.add(dr);
    bbox(0.26,0.22,0.06,steel,0.28,H+0.34,dz*(B/2+0.16),g,false);
  }
  /* Antrieb mit Kette */
  bbox(0.34,0.3,0.44,std(0x3a4150,{metalness:0.55}),0.52,H+0.34,-(B/2+0.42),g,false);
  bbox(0.18,0.18,0.22,std(0xf2a01c,{roughness:0.5}),0.52,H+0.08,-(B/2+0.42),g,false);
  const chain=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.013,6,HIQ?16:8),dark);
  chain.position.set(0.56,H-0.2,-(B/2+0.42)); chain.scale.y=4.2; g.add(chain);
  /* Warnleuchte ueber dem Tor */
  const warn=new THREE.MeshStandardMaterial({color:LIN(0x3a2a08),emissive:LIN(0xffb02a),emissiveIntensity:0.5});
  const wl=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.095,0.13,HIQ?12:8),warn);
  wl.position.set(0.34,H+0.62,B/2+0.3); g.add(wl);
  bbox(0.11,0.07,0.11,dark,0.34,H+0.71,B/2+0.3,g,false);
  /* Ampel und Bedienkasten neben dem Tor, innen */
  bbox(0.15,0.36,0.13,dark,0.24,1.92,B/2+0.5,g,false);
  for(const [m,y] of [[eintrag.rot,2.04],[eintrag.gruen,1.82]]){
    const c2=new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.052,0.045,HIQ?10:6),m);
    c2.rotation.z=Math.PI/2; c2.position.set(0.33,y,B/2+0.5); g.add(c2);
  }
  bbox(0.13,0.26,0.17,std(0xf2c230,{roughness:0.6}),0.3,1.35,B/2+0.5,g,false);
  for(let k=0;k<3;k++)
    bbox(0.04,0.05,0.05,std([0x2f9e57,0xd8352a,0x2a2e38][k]),0.37,1.44-k*0.075,B/2+0.5,g,false);
  /* Torkennung innen, damit man die Rampen auseinanderhaelt */
  plane(0.62,0.48,new THREE.MeshStandardMaterial({map:tex(150,116,(c,W,Hh)=>{
    c.fillStyle='#1b2340'; c.fillRect(0,0,W,Hh);
    c.strokeStyle='#ffd23f'; c.lineWidth=6; c.strokeRect(5,5,W-10,Hh-10);
    c.fillStyle='#ffd23f'; c.font=BUN(68); c.textAlign='center'; c.textBaseline='middle';
    c.fillText(String(eintrag.nr+1),W/2,Hh/2+5); })}),0.16,H+0.95,0,Math.PI/2,g);
}
/* Ein Ladetor in der Suedwand der Logistikhalle, von aussen gesehen.
   Gebaut ist es in eigenen Koordinaten mit innen = +x; die Gruppe
   wird so gedreht, dass +x nach Norden in die Halle zeigt. */
function westTor(cx,nr){
  const Z=LHALLE.z, steel=std(0x8d939d,{metalness:0.6,roughness:0.42});
  const dark=std(0x2a2e38,{metalness:0.5,roughness:0.45});
  const rub=std(0x16181d,{roughness:0.96});
  const g=new THREE.Group(); g.position.set(cx,0,Z); g.rotation.y=-Math.PI/2; scene.add(g);
  /* Torblatt aus echten Sektionalpanelen, denselben wie an der
     Basisrampe. Vorher war hier eine Textur auf einen Kasten
     geklebt - im Spiel sah man den Unterschied sofort. */
  const kante=std(0x6f757e,{metalness:0.5,roughness:0.5});
  const pmT=torPanelMat(), pm=std(0xdfe2e6,{metalness:0.4,roughness:0.5});
  const bl=new THREE.Group(); bl.position.set(-0.15,WTOR.h/2,0); g.add(bl);
  const PN=5, ph=WTOR.h/PN;
  for(let i=0;i<PN;i++){
    const pn=new THREE.Mesh(new THREE.BoxGeometry(0.095,ph-0.012,WTOR.w),
      [pm,pm,pm,pm,pmT,pmT]);
    pn.position.y=-WTOR.h/2+ph/2+i*ph;
    if(HIQ){ pn.castShadow=true; pn.receiveShadow=true; }
    bl.add(pn);
    /* Scharnierrollen an den Panelkanten */
    for(const dz of [-1,1]){
      const rl=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.05,8),kante);
      rl.rotation.x=Math.PI/2; rl.position.set(-0.06,pn.position.y+ph/2-0.02,dz*(WTOR.w/2-0.12));
      bl.add(rl);
    }
  }
  /* Das Tor merkt sich Torblatt und Ampel, damit eine zugekaufte
     Andockstation wirklich aufmachen kann. */
  /* Die beiden Ampelmaterialien werden von aussen und von innen
     benutzt und muessen darum vor beidem stehen. */
  const lr=new THREE.MeshStandardMaterial({color:LIN(0x300808),emissive:LIN(0xff2a2a),emissiveIntensity:1.2});
  const lg=new THREE.MeshStandardMaterial({color:LIN(0x082a12),emissive:LIN(0x3dff7a),emissiveIntensity:0});
  const eintrag={nr,x:cx,g,blatt:bl,zu:WTOR.h/2,auf:WTOR.h/2+WTOR.h-0.06,t:0,rot:lr,gruen:lg};
  /* Fuehrungsschienen links und rechts */
  for(const dz of [-1,1]) bbox(0.07,WTOR.h+0.1,0.07,kante,-0.06,WTOR.h/2,dz*(WTOR.w/2+0.05),g,false);
  /* --- Innenseite: dieselbe Ausstattung wie am Tor der Basisrampe.
         Vorher war von der Halle aus nur ein Torblatt in der Wand zu
         sehen, ohne Schienen, Welle, Antrieb oder Ampel. --- */
  westTorInnen(g,steel,dark,kante,eintrag);

  /* Zarge */
  for(const s of [-1,1]) bbox(0.3,WTOR.h+0.26,0.18,steel,-0.24,(WTOR.h+0.26)/2,s*(WTOR.w/2+0.09),g,false);
  bbox(0.3,0.22,WTOR.w+0.36,steel,-0.24,WTOR.h+0.13,0,g,false);
  /* Anfahrpuffer aus Gummi */
  for(const s of [-1,1]){
    bbox(0.22,0.52,0.28,rub,-0.33,1.05,s*(WTOR.w/2+0.28),g,true);
    bbox(0.06,0.56,0.32,dark,-0.21,1.05,s*(WTOR.w/2+0.28),g,false);
  }
  /* Vordach mit Schneeauflage */
  const cano=bbox(1.35,0.1,WTOR.w+1.2,std(0x3a4150,{metalness:0.5}),-0.85,WTOR.h+0.52,0,g,false);
  cano.rotation.z=-0.09;
  const sn=bbox(1.38,0.08,WTOR.w+1.24,std(0xeef2f8,{roughness:1}),-0.85,WTOR.h+0.61,0,g,false);
  sn.rotation.z=-0.09;
  /* Streben von der Wand hinauf unter die Aussenkante des Vordachs.
     Mit rotation.z = -0.74 kippten sie falsch herum: das untere Ende
     schwebte vor der Wand, das obere steckte im Dach. */
  for(const s of [-1,1]) strebe(-0.25,WTOR.h-0.25,-1.4,WTOR.h+0.47,s*(WTOR.w/2+0.4),steel,g);
  /* Torbeschlaege: Fuehrungsschienen und Antriebskasten sieht man
     von aussen nicht - dafuer Ampel, Taster und Torkennung. */
  bbox(0.14,0.44,0.14,dark,-0.3,2.0,WTOR.w/2+0.62,g,false);
  for(const [m,y] of [[lr,2.12],[lg,1.9]]){
    const c2=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.04,10),m);
    c2.rotation.z=Math.PI/2; c2.position.set(-0.38,y,WTOR.w/2+0.62); g.add(c2);
  }
  WTORE[nr-1]=eintrag;
  /* Torabdichtung. Der Auflieger ist 2,55 m breit, das Tor 3,4 -
     ohne Dichtung schaut man links und rechts am Heck vorbei ins
     Freie. Drei Polster aus Planenstoff schliessen den Spalt, so
     wie an jeder echten Rampe. */
  const planeM=std(0x23262c,{roughness:0.95});
  for(const s2 of [-1,1])
    bbox(0.46,WTOR.h+0.1,0.5,planeM,-0.26,(WTOR.h+0.1)/2,s2*(WTOR.w/2-0.2),g,false);
  bbox(0.46,0.42,WTOR.w+0.1,planeM,-0.26,WTOR.h-0.09,0,g,false);
  bbox(0.12,0.24,0.16,std(0xf2c230,{roughness:0.6}),-0.3,1.35,WTOR.w/2+0.62,g,false);
  for(let k=0;k<3;k++) bbox(0.04,0.05,0.05,std([0x2f9e57,0xd8352a,0x2a2e38][k]),-0.37,1.43-k*0.07,WTOR.w/2+0.62,g,false);
  /* Torkennung ueber dem Vordach */
  plane(0.8,0.62,new THREE.MeshStandardMaterial({map:tex(160,124,(c,W,H)=>{
    c.fillStyle='#1b2340'; c.fillRect(0,0,W,H);
    c.strokeStyle='#ffd23f'; c.lineWidth=6; c.strokeRect(5,5,W-10,H-10);
    c.fillStyle='#ffd23f'; c.font=BUN(78); c.textAlign='center'; c.textBaseline='middle';
    c.fillText(String(nr+1),W/2,H/2+6); })}),-0.22,WTOR.h+0.95,0,-Math.PI/2,g);
  /* Poller neben der Torlaibung, im Hof vor der Wand */
  for(const s of [-1,1]){
    const lz=s*(WTOR.w/2+1.15);
    bbox(0.2,0.95,0.2,std(0xf2c230,{roughness:0.7}),-0.9,0.48,lz,g,true);
    bbox(0.22,0.14,0.22,std(0x1f1f24),-0.9,0.86,lz,g,false);
    /* lokal (x,z) -> Welt (cx - z, Z + x) bei Drehung -90 Grad */
    col(cx-lz-0.15,cx-lz+0.15,Z-1.05,Z-0.75);
  }
  return g;
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
  const r=LAY.lnord, z0=r.z1, z1=r.z1+LW, H=LAGER_H;
  const FB=1.7, Y0=1.35, Y1=2.6;                       /* Breite, Bruestung, Sturz */
  const leib=std(0xdfe3e8,{roughness:0.85});          /* Laibung: heller Putz */
  const alu=std(0x2b3040,{metalness:0.55,roughness:0.38});
  const glas=new THREE.MeshStandardMaterial({color:LIN(0x5d7288),transparent:true,opacity:0.38,roughness:0.05,metalness:0.2,side:THREE.DoubleSide,depthWrite:false});
  const bankA=std(0xb9bec6,{metalness:0.6,roughness:0.35}), bankI=std(0xe6e8ec,{roughness:0.6});
  const W=(a,b,y0,y1)=>{ if(b-a>0.005&&y1-y0>0.005) wall(a,b,z0,z1,y0,y1,'-z',lagerWall,undefined,0,leib); };
  let x=r.x0-LW;
  for(const cx of LAGERFENSTER){
    const a=cx-FB/2, b=cx+FB/2;
    W(x,a,0,H);                    /* Pfeiler */
    W(a,b,0,Y0);                   /* Bruestung */
    W(a,b,Y1,H);                   /* Sturz */
    /* Rahmen in der Wandmitte, zwei Fluegel mit Mittelpfosten */
    const zm=(z0+z1)/2, fh=Y1-Y0;
    bbox(FB,0.07,0.08,alu,cx,Y1-0.035,zm,null,false);
    bbox(FB,0.07,0.08,alu,cx,Y0+0.035,zm,null,false);
    for(const sx of [-1,1]) bbox(0.07,fh,0.08,alu,cx+sx*(FB/2-0.035),Y0+fh/2,zm,null,false);
    bbox(0.06,fh-0.1,0.07,alu,cx,Y0+fh/2,zm,null,false);
    /* Fluegelrahmen, etwas schmaler, dahinter das Glas */
    for(const sx of [-1,1]){ const fx=cx+sx*FB/4;
      for(const dy of [0.075,fh-0.075]) bbox(FB/2-0.12,0.04,0.05,alu,fx,Y0+dy,zm+0.01,null,false);
      bbox(FB/2-0.14,fh-0.2,0.012,glas,fx,Y0+fh/2,zm,null,false);
      /* Griff am Fluegel innen */
      bbox(0.025,0.12,0.03,std(0xc9ced6,{metalness:0.8,roughness:0.25}),cx+sx*0.1,Y0+fh/2,z0-0.01,null,false); }
    /* Fensterbank aussen (Alu, leicht vorstehend) und innen */
    bbox(FB+0.08,0.03,0.2,bankA,cx,Y0-0.012,z1+0.06,null,false);
    bbox(FB+0.05,0.03,0.16,bankI,cx,Y0-0.012,z0-0.05,null,false);
    x=b;
  }
  W(x,r.x1+LW,0,H);
  col(r.x0-LW,r.x1+LW,z0,z1);
}
/* Flutlichtmast fuer den Hof */
function hofMast(x,z,ry){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry||0; scene.add(g);
  g.userData.hof='mast';
  const mast=std(0x4b515c,{metalness:0.62,roughness:0.38});
  const dark=std(0x2a2e38,{metalness:0.5,roughness:0.5});
  const so=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.26,0.4,12),dark); so.position.y=0.2; g.add(so);
  const m1=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.14,7.4,12),mast);
  m1.position.y=4.1; if(HIQ) m1.castShadow=true; g.add(m1);
  bbox(1.7,0.09,0.09,mast,0,7.7,0,g,false);
  for(const s of [-1,1]){
    const geh=rbox(0.62,0.3,0.34,0.04,dark,s*0.62,7.55,0,g); geh.rotation.x=0.42;
    const lm=new THREE.MeshStandardMaterial({color:LIN(0x23262e),emissive:LIN(0xfff2d6),emissiveIntensity:0}); lampMats.push(lm);
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
  const alu=std(0xb6bcc4,{metalness:0.55,roughness:0.42});
  const dark=std(0x22262e,{metalness:0.4,roughness:0.6});
  /* Aufbau mit Werbung auf den Seiten */
  const side=new THREE.MeshStandardMaterial({map:liveryTex(name,farbe,false),roughness:0.74});
  const body=new THREE.Mesh(new THREE.BoxGeometry(L,HH,W2),[dark,dark,alu,dark,side,side]);
  body.position.set(0,FY+HH/2,0); if(HIQ){ body.castShadow=true; body.receiveShadow=true; } g.add(body);
  bbox(L+0.05,0.1,W2+0.06,alu,0,FY+HH-0.04,0,g,false);
  bbox(L+0.05,0.16,W2+0.06,std(0x8a7f6a,{roughness:0.9}),0,FY+0.1,0,g,false);
  /* Hecktueren mit Scharnieren und Stangen */
  for(const s of [-1,1]) bbox(0.06,HH-0.2,W2/2-0.08,std(0xe6e8ec,{roughness:0.6}),-L/2-0.04,FY+HH/2,s*W2/4,g,false);
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
  for(const s of [-1,1]) ch.push({geo:gRahmen,m:tm(0,FY-0.16,s*0.42),color:0x5a6068});
  for(const s of [-1,1]){ ch.push({geo:gWinde,m:tm(L/2-3.3,FY-0.62,s*0.95),color:0x22262e});
    ch.push({geo:gFuss,m:tm(L/2-3.3,FY-1.04,s*0.95),color:0x22262e}); }
  ch.push({geo:gKoenig,m:tm(L/2-0.7,FY-0.2,0),color:0x6a7078});
  for(let a=0;a<3;a++){ const ax=-L/2+2.1+a*1.34;
    for(const s of [-1,1]) for(const dz of [0.145,-0.145]){
      const pz=s*(W2/2-0.46)+s*dz;
      ch.push({geo:gRad,  m:tm(ax,0.5,pz,Math.PI/2,0,0),color:0x26292f});
      ch.push({geo:gFelge,m:tm(ax,0.5,pz,Math.PI/2,0,0),color:0x9aa1ac}); }
    ch.push({geo:gAchse,m:tm(ax,0.5,0),color:0x22262e});
    for(const s of [-1,1]) ch.push({geo:gKotfl,m:tm(ax,1.05,s*(W2/2-0.02)),color:0x3a4048}); }
  ch.push({geo:gSchutz,m:tm(-L/2+0.1,0.62,0),color:0x6a7078});
  for(const s of [-1,1]){
    ch.push({geo:gRueck,m:tm(-L/2-0.09,0.92,s*(W2/2-0.35)),color:0x9a2a24});
    ch.push({geo:gBlink,m:tm(-L/2-0.09,1.12,s*(W2/2-0.35)),color:0xf2a01c}); }
  ch.push({geo:gSchild,m:tm(-L/2-0.1,0.72,0),color:0xf2f0e8});
  const chm=new THREE.Mesh(merge(ch),new THREE.MeshStandardMaterial({vertexColors:true,metalness:0.12,roughness:0.66}));
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
/* Palettenstapel als Hofdeko. Ein Stapel sind ueber achtzig Bretter -
   die werden zu einem einzigen Mesh verschmolzen. */
let _holzM=null;
function holzMat(){ if(!_holzM) _holzM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.94}); return _holzM; }
function palettenStapel(x,z,n,ry){
  const kl=new THREE.BoxGeometry(1.16,0.08,0.13), br=new THREE.BoxGeometry(1.16,0.03,0.09);
  const qu=new THREE.BoxGeometry(0.1,0.04,1.0), sn=new THREE.BoxGeometry(1.2,0.05,1.05);
  const ps=[];
  for(let i=0;i<n;i++){ const y=i*0.15, jx=rand(-0.02,0.02);
    for(const dz of [-0.48,0,0.48]) ps.push({geo:kl,m:tm(jx,y+0.04,dz),color:0x8e7550});
    for(const dz of [-0.48,-0.24,0,0.24,0.48]) ps.push({geo:br,m:tm(0,y+0.1,dz),color:0xa58a5e});
    for(const dx of [-0.5,0,0.5]) ps.push({geo:qu,m:tm(dx,y+0.125,0),color:0xa58a5e}); }
  ps.push({geo:sn,m:tm(0,n*0.15+0.14,0),color:0xeef2f8});
  const m=new THREE.Mesh(merge(ps),holzMat());
  m.position.set(x,0,z); m.rotation.y=ry||0; m.userData.hof='paletten';
  if(HIQ){ m.castShadow=true; m.receiveShadow=true; }
  scene.add(m);
  kl.dispose(); br.dispose(); qu.dispose(); sn.dispose();
  col(x-0.62,x+0.62,z-0.55,z+0.55);
  return m;
}
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
    g.fillStyle='#ffd23f'; g.font=BUN(92); g.fillText('LOGISTIK',44,H/2-4);
    g.fillStyle='#e8eefc'; g.font=BUN(92); g.fillText('ZENTRUM',430,H/2-4);
    g.fillStyle='#7f8db0'; g.font=BAR(34); g.fillText('UMSCHLAG · KOMMISSIONIERUNG · VERSAND',44,H-34);
    /* Rautenlogo rechts */
    g.save(); g.translate(W-96,H/2); g.rotate(Math.PI/4);
    g.fillStyle='#ffd23f'; g.fillRect(-42,-42,84,84);
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
  const blech=blechMat();
  const sockel=std(0x3f454e,{roughness:0.88});
  const attika=std(0x2b2f3a,{metalness:0.4,roughness:0.6});
  const steel=std(0x8d939d,{metalness:0.6,roughness:0.42});
  /* --- Halle --- */
  const hw=ha.x1-ha.x0, hd=ha.z1-ha.z0, hcx=(ha.x0+ha.x1)/2, hcz=(ha.z0+ha.z1)/2;
  const halleM=new THREE.Mesh(new THREE.BoxGeometry(hw,H,hd),blech);
  halleM.position.set(hcx,H/2,hcz);
  if(HIQ){ halleM.castShadow=true; halleM.receiveShadow=true; }
  scene.add(halleM); occluders.push(halleM); meterUV(halleM);
  bbox(hw+0.1,1.3,hd+0.1,sockel,hcx,0.65,hcz,null,false);
  bbox(hw+0.5,0.7,hd+0.5,attika,hcx,H+0.3,hcz,null,false);
  bbox(hw+0.2,0.5,hd+0.2,std(0x1b2340,{roughness:0.8}),hcx,H-1.4,hcz,null,false);
  /* Dach mit Lichtband und Lueftern */
  flat(hw-0.6,hd-0.6,std(0x4a4f58,{roughness:0.95}),hcx,H+0.02,hcz);
  for(let i=0;i<7;i++) flat(3.4,hd-4,new THREE.MeshBasicMaterial({color:0xdfe6ef,toneMapped:false}),ha.x0+4+i*6.2,H+0.05,hcz);
  for(let i=0;i<5;i++){ const rx=ha.x0+6+i*8.4;
    rbox(2.4,1.1,2.0,0.1,std(0xa7adb6,{metalness:0.5,roughness:0.5}),rx,H+0.85,ha.z1-4.5,null);
    bbox(2.5,0.12,2.1,std(0xeef2f8,{roughness:1}),rx,H+1.46,ha.z1-4.5,null,false); }
  /* --- Buerokopf --- */
  const bw=bu.x1-bu.x0, bd=bu.z1-bu.z0, bcx=(bu.x0+bu.x1)/2, bcz=(bu.z0+bu.z1)/2;
  const glasN=new THREE.MeshStandardMaterial({map:logiGlas(bw,2),roughness:0.22,metalness:0.4});
  const glasW=new THREE.MeshStandardMaterial({map:logiGlas(bd,2),roughness:0.22,metalness:0.4});
  const putz=std(0xdde1e7,{roughness:0.9});
  const bm=new THREE.Mesh(new THREE.BoxGeometry(bw,LOGI.bh,bd),[glasW,glasW,putz,putz,glasN,glasN]);
  bm.position.set(bcx,LOGI.bh/2,bcz);
  if(HIQ){ bm.castShadow=true; bm.receiveShadow=true; }
  scene.add(bm); occluders.push(bm);
  bbox(bw+0.4,0.45,bd+0.4,attika,bcx,LOGI.bh+0.22,bcz,null,false);
  bbox(bw+0.1,0.9,bd+0.1,sockel,bcx,0.45,bcz,null,false);
  /* Eingangsvordach und Schriftzug */
  bbox(5.0,0.18,2.4,std(0x9aa1ac,{metalness:0.6,roughness:0.4}),bu.x0+3.2,3.35,bu.z1+1.0,null,false);
  for(const dx of [-2.0,2.0]) bbox(0.09,3.3,0.09,steel,bu.x0+3.2+dx,1.65,bu.z1+1.9,null,false);
  plane(11.0,1.95,new THREE.MeshStandardMaterial({map:logiSchriftzug()}),bcx,LOGI.bh-1.5,bu.z1+0.06,0,null);
  /* --- Ladetore an der Westfassade der Halle --- */
  const tm2=torBlattMat();
  for(let i=0;i<4;i++){
    const tz=ha.z0+3.4+i*5.6;
    const bl=new THREE.Mesh(new THREE.PlaneGeometry(3.6,4.2),tm2);
    bl.rotation.y=-Math.PI/2; bl.position.set(ha.x0-0.06,2.1,tz); scene.add(bl);
    for(const s of [-1,1]) bbox(0.16,4.5,0.2,steel,ha.x0-0.08,2.25,tz+s*1.9,null,false);
    bbox(0.16,0.24,4.0,steel,ha.x0-0.08,4.32,tz,null,false);
    bbox(1.2,0.12,4.6,std(0x3a4150,{metalness:0.5}),ha.x0-0.65,4.85,tz,null,false);
    for(const s of [-1,1]) bbox(0.2,0.6,0.26,std(0x16181d,{roughness:0.96}),ha.x0-0.16,1.2,tz+s*2.1,null,false);
  }
  /* --- Vorplatz, Zaun, Bauschild --- */
  const ap=concreteTex(); ap.repeat.set(3,14);
  flat(6.0,30.0,new THREE.MeshStandardMaterial({map:ap,roughness:0.93,color:LIN(0xa8acb2)}),43.5,0.013,-1.0);
  const ap2=concreteTex(); ap2.repeat.set(10,3);
  flat(hw-2,5.5,new THREE.MeshStandardMaterial({map:ap2,roughness:0.93,color:LIN(0xa8acb2)}),hcx,0.012,ha.z1+2.8);
  for(let i=0;i<4;i++){ const tz=ha.z0+3.4+i*5.6;
    for(const s of [-1,1]) flat(4.4,0.14,std(0xf2c230),ha.x0-2.6,0.017,tz+s*2.4); }
  /* Zaun mit Bauschild: faellt, sobald das Zentrum freigeschaltet wird */
  const Z=LOGI.zaun, ZH=2.4;
  zaunLauf(Z.x,Z.z0,Z.x,Z.z1,ZH);
  zaunLauf(Z.x,Z.z0,ha.x0,Z.z0,ZH);
  zaunLauf(Z.x,Z.z1,bu.x0,Z.z1,ZH);
  col(Z.x-0.12,Z.x+0.12,Z.z0,Z.z1);
  col(Z.x,ha.x0,Z.z0-0.12,Z.z0+0.12);
  col(Z.x,bu.x0,Z.z1-0.12,Z.z1+0.12);
  zWandCol('logistik',col(Z.x,ha.x1+1,Z.z0,Z.z1));
  /* Doppeltor in der Zaunflucht, verschlossen */
  { const g2=new THREE.Group(); g2.position.set(Z.x,0,2.0); scene.add(g2);
    for(const s of [-1,1]){
      bbox(0.1,0.1,3.0,steel,0,ZH-0.14,s*1.55,g2,false);
      bbox(0.1,0.1,3.0,steel,0,0.4,s*1.55,g2,false);
      for(let i=0;i<10;i++) bbox(0.07,ZH-0.6,0.07,steel,0,ZH/2,s*0.1+s*i*0.32,g2,false);
      bbox(0.12,ZH+0.3,0.12,steel,0,(ZH+0.3)/2,s*3.05,g2,false); }
    bbox(0.14,0.3,0.24,std(0xf2c230,{roughness:0.6}),0.1,1.15,0,g2,false); }
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

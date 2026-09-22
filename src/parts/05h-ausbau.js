
/* =========================================================
   Ausbau: Die Welt steht von Anfang an in voller Groesse.
   Noch nicht gekaufte Bereiche liegen hinter einer Bauwand und
   sind unsichtbar. Beim Kauf faellt die Wand und der Bereich
   wird freigegeben.
   ========================================================= */
const ZONEN={};
function zone(id){ return ZONEN[id]||(ZONEN[id]={obj:[],cols:[],wand:[],wandCols:[],offen:false}); }
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
      z.wandCols.forEach(c=>{ if(colliders.indexOf(c)<0) colliders.push(c); }); }
  }
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
function stilleWand(x0,x1,z0,z1,y0,y1,inFace,inMat,exMat){
  const m=wall(x0,x1,z0,z1,y0,y1,inFace,inMat,exMat);
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
function trennwand(id,laengs,fest,a0,a1,h,innen,aussen,face){
  const f=face||(laengs?'-z':'-x');
  const m=laengs
    ? stilleWand(a0,a1,fest-LW/2,fest+LW/2,0,h,f,innen,aussen||innen)
    : stilleWand(fest-LW/2,fest+LW/2,a0,a1,0,h,f,innen,aussen||innen);
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
  const gRev=new THREE.BoxGeometry(1.44,0.03,0.42), gFix=new THREE.BoxGeometry(1.36,0.028,0.36);
  const gDif=new THREE.PlaneGeometry(1.26,0.28);
  const korpus=[], diff=[];
  for(let i=0;i<nx;i++) for(let k=0;k<nz;k++){
    const x=r.x0+(i+0.5)*(r.x1-r.x0)/nx, z=r.z0+(k+0.5)*(r.z1-r.z0)/nz;
    korpus.push({geo:gRev,m:tm(x,y-0.008,z),color:0x252932});
    korpus.push({geo:gFix,m:tm(x,y-0.026,z),color:0xdfe3e9});
    diff.push({geo:gDif,m:tm(x,y-0.043,z,Math.PI/2,0,0)});
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
  const bo=new THREE.Mesh(new THREE.PlaneGeometry(r.x1-r.x0,r.z1-r.z0),bodenMat);
  bo.rotation.x=-Math.PI/2; bo.position.set((r.x0+r.x1)/2,0.015,(r.z0+r.z1)/2); scene.add(bo); zAdd(id,bo);
  /* Decke und Dach */
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(r.x1-r.x0+0.3,r.z1-r.z0+0.3),ceil);
  ce.rotation.x=Math.PI/2; ce.position.set((r.x0+r.x1)/2,H-0.01,(r.z0+r.z1)/2); scene.add(ce); zAdd(id,ce);
  if(!opt.keinDach) bbox(r.x1-r.x0+LW*3,0.25,r.z1-r.z0+LW*3,std(0x2b2f3a),(r.x0+r.x1)/2,H+0.13,(r.z0+r.z1)/2,null,true);
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
  leuchtenRaster(id,r,H,lager?3.6:3.4,lager?4.2:3.6);
  roomAO(r.x0+0.02,r.x1-0.02,r.z0+0.02,r.z1-0.02,id);
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
  const w=(a2,b2,y0,y1)=>laengs
    ? wall(a2,b2,fest-LW/2,fest+LW/2,y0,y1,f,mat,exMat)
    : wall(fest-LW/2,fest+LW/2,a2,b2,y0,y1,f,mat,exMat);
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
  /* Stuetzen bleiben stehen, wo vorher ein Zwischenstueck war */
  for(const p2 of saeulen) stuetze(laengs?p2:fest,laengs?fest:p2,H);
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
  const G=GANG, mitteX=(G.x0+G.x1)/2, mitteZ=(G.z0+G.z1)/2;
  const breite=G.x1-G.x0, tiefe=G.z1-G.z0;
  /* Boden: derselbe Estrich wie im Lager */
  const bc=concreteTex(); bc.repeat.set(breite/2,tiefe/2);
  const bo=new THREE.Mesh(new THREE.PlaneGeometry(breite,tiefe),
    new THREE.MeshStandardMaterial({map:bc,roughness:0.85}));
  bo.rotation.x=-Math.PI/2; bo.position.set(mitteX,0.016,mitteZ); scene.add(bo);
  /* Decke und Dachrand */
  const ce=new THREE.Mesh(new THREE.PlaneGeometry(breite+0.3,tiefe+0.3),std(0xe6e8ee,{roughness:1}));
  ce.rotation.x=Math.PI/2; ce.position.set(mitteX,G.h-0.01,mitteZ); scene.add(ce);
  /* Der Dachrand deckt die Kopf- und Suedwand ab, aber keinen
     Zentimeter mehr: mit dem sonst ueblichen Ueberstand ragte er
     durch die Ostwand der Lagerhalle Sued hinein. */
  bbox(breite+LW*2,0.25,tiefe+LW*2,std(0x2b2f3a),mitteX,G.h+0.13,mitteZ,null,true);
  /* Suedwand mit dem Durchgang aufs Testfeld. Der Sturz bleibt
     stehen, sonst steht das Dach in der Luft. */
  const zs=G.z0;
  wall(G.x0-LW,GANGTUER.a,zs-LW,zs,0,G.h,'+z',lagerWall);
  wall(GANGTUER.b,G.x1+LW,zs-LW,zs,0,G.h,'+z',lagerWall);
  wall(GANGTUER.a,GANGTUER.b,zs-LW,zs,2.5,G.h,'+z',lagerWall);
  col(G.x0-LW,GANGTUER.a,zs-LW,zs);
  col(GANGTUER.b,G.x1+LW,zs-LW,zs);
  leuchtenRaster(null,{x0:G.x0,x1:G.x1,z0:G.z0,z1:G.z1},G.h,3.4,2.6);
  roomAO(G.x0+0.02,G.x1-0.02,G.z0+0.02,G.z1-0.02);
  /* Hinweisschild ueber dem Durchgang zum Lager */
  plane(1.5,0.3,new THREE.MeshBasicMaterial({toneMapped:false,side:THREE.DoubleSide,
    map:tex(512,104,(g,W,H)=>{
      g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
      g.fillStyle='#f2c230'; g.fillRect(0,H-7,W,7);
      g.textAlign='center'; g.textBaseline='middle';
      g.fillStyle='#e8ecf5'; g.font=BUN(40); g.fillText('◄  LAGER      VERKAUF  ►',W/2,H/2-3);
    })}),mitteX,2.45,G.z1-0.06,Math.PI,null);
}
function buildAusbau(){
  /* ---------- Verkaufsflaeche ----------
     Die Front uebernimmt die Nachbarfassade (05e), deshalb bekommen
     Ost I und Ost II von der Halle keine Nordwand. */
  halle('shop_gross',LAY.ost1,{aussen:{}});
  halle('shop_ost',  LAY.ost2,{aussen:{e:true}});
  halle('shop_sued', LAY.sued,{aussen:{s:true,e:true}});
  /* Innenwaende zwischen zwei Verkaufsraeumen: auf beiden Seiten
     Ladentapete, sonst schaut man von drinnen auf Backstein. */
  durchbruchWand('shop_ost',false,LAY.ost1.x1,LAY.ost1.z0,LAY.ost1.z1,[[-4.2,4.2]],shopWall,shopWall,null,null,null,true);
  durchbruchWand('shop_sued',true,LAY.sued.z1,LAY.sued.x0,LAY.sued.x1,[[10.0,17.0],[24.0,32.0]],shopWall,shopWall,null,null,null,true);
  /* Die beiden ersten Durchbrueche stehen schon in 05c beziehungsweise
     im Dock - hier kommt nur die Fuellung in die Oeffnung. */
  trennwand('shop_gross',false,8.0,-4.4,4.4,2.7,shopWall,shopWall);

  /* ---------- Lager ---------- */
  halle('lager_gross',LAY.lnord,{art:'lager',aussen:{n:true,w:true},h:ANBAU_H-0.06,keinDach:true});
  /* Sued und West sind echte Hallen mit 6,4 m lichter Hoehe -
     nur so haben Hochregale und Schwerlastregale ueberhaupt Platz. */
  halle('lager_sued', LAY.lsued,{art:'lager',aussen:{s:true},h:HALLE_H});
  halle('lager_west', LAY.lwest,{art:'lager',aussen:{s:true,n:true},h:HALLE_H,ex:blechMat()});
  /* Basislager nach Sueden */
  durchbruchWand('lager_sued',true,LAY.lbasis.z0,LAY.lbasis.x0,LAY.lbasis.x1,[[-17.5,-10.5]],lagerWall,lagerWall,null,HALLE_H);
  /* Sued nach West. Die Wand laeuft bis an die Suedwand des Basislagers
     durch - sonst bleibt zwischen Halle West und Hof ein Loch. */
  durchbruchWand('lager_west',false,LAY.lwest.x1,LAY.lwest.z0,LAY.lsued.z1,[[-26.0,-13.0]],lagerWall,lagerWall,3.4,HALLE_H);
  trennwand('lager_gross',true,2.0,-19.0,-9.0,2.6,lagerWall,lagerWall);

  /* ---------- Packstation, Rampen, Logistikzentrum ---------- */
  /* Die beiden Kopfwaende des Lagergangs. Sie ersetzen die
     Westwand des Rueckgebaeudes und die Ostwand der Halle Sued;
     beide bekommen an der Stelle des Gangs eine Oeffnung, die
     zusammen mit der Lagerhalle West freigegeben wird. */
  const GT=[[GANG.z0+0.25,GANG.z1-0.25]];
  durchbruchWand('lager_west',false,7.9,LAY.sued.z0,LAY.sued.z1,GT,shopWall,undefined,2.5,WH,'+x');
  durchbruchWand('lager_west',false,-8.0,LAY.lsued.z0,LAY.lsued.z1,GT,lagerWall,undefined,2.5,HALLE_H,'-x');
  buildLagergang();
  buildPackstation();
  buildWestrampen();
  buildLogistik();
}

/* =========================================================
   Packstation: Packtisch, Kartonlager, Waage, Paketrutsche
   ========================================================= */
let packHit=null, packTisch=null;
const pakete=[];                       /* fertige Pakete auf der Rampe */
function buildPackstation(){
  const id='packstation', PX=-17.2, PZ=4.2;
  const g=new THREE.Group(); g.position.set(PX,0,PZ); scene.add(g); zAdd(id,g);
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
  rbox(0.36,0.22,0.3,0.02,dunkel,0.55,1.05,-0.2,g);
  bbox(0.3,0.02,0.16,std(0xf2f0e8),0.55,0.95,-0.02,g,false);
  const roll=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.09,14),std(0xd8b46a,{roughness:0.7}));
  roll.rotation.z=Math.PI/2; roll.position.set(1.05,1.0,0.22); g.add(roll);
  /* Hinweisschild ueber dem Tisch */
  for(const sx of [-1.2,1.2]) bbox(0.06,1.5,0.06,stahl,sx,1.72,-0.42,g,false);
  bbox(2.6,0.5,0.05,std(0x1b2340,{roughness:0.7}),0,2.3,-0.42,g,false);
  packSchildTex=tex(1024,200,()=>{});
  plane(2.5,0.44,new THREE.MeshBasicMaterial({map:packSchildTex,toneMapped:false}),0,2.3,-0.39,0,g);
  drawPackSchild();
  /* Abholrampe mit Paketstellplaetzen */
  for(let k=0;k<6;k++){
    const px=3.9+(k%3)*0.62, pz=-0.3+Math.floor(k/3)*0.6;
    bbox(0.52,0.02,0.52,std(0xf2c230),px,0.016,pz,g,false);
  }
  const hit=bbox(3.0,2.0,1.4,hitM,0.6,1.0,0,g,false);
  hit.userData={kind:'pack'}; packHit=hit;
  zCol('packstation',col(PX-1.4,PX+3.9,PZ-0.5,PZ+0.5));
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
      g.fillStyle='#bcd0ea'; g.font=BAR(34); g.fillText((S.pakete|0)+' Pakete warten auf Abholung',W/2,H-38);
    } else {
      g.fillStyle='#ffd23f'; g.font=BUN(52); g.fillText('VERSAND',W/2,H/2-16);
      g.fillStyle='#ff9d92'; g.font=BAR(32); g.fillText('Onlineshop noch nicht freigeschaltet',W/2,H-38);
    }
    g.strokeStyle='#2f3a5e'; g.lineWidth=6; g.strokeRect(3,3,W-6,H-6);
  });
}

/* =========================================================
   Versand: Onlinebestellungen kommen herein, werden am
   Packtisch zu Paketen und warten auf der Rampe auf DDL.
   ========================================================= */
const PAKET_BAYS=6;
let versandT=0, paketTex=null;
/* Kartonoberflaeche mit Klebeband, Aufdruck und Adressaufkleber */
function paketMaterial(){
  if(paketTex) return paketTex;
  const t=tex(512,512,(g,W,H)=>{
    const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#c8a271'); gr.addColorStop(1,'#a98454');
    g.fillStyle=gr; g.fillRect(0,0,W,H);
    /* Wellpappe-Struktur */
    for(let y=0;y<H;y+=6){ g.fillStyle=`rgba(120,92,58,${rand(0.05,0.13)})`; g.fillRect(0,y,W,2); }
    for(let i=0;i<5200;i++){ g.fillStyle=`rgba(255,240,215,${Math.random()*0.07})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
    /* Klebeband ueber der Mitte */
    g.fillStyle='rgba(216,180,106,.85)'; g.fillRect(0,H/2-26,W,52);
    g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(0,H/2-26,W,8);
    g.strokeStyle='rgba(150,118,64,.6)'; g.lineWidth=2;
    g.beginPath(); g.moveTo(0,H/2-26); g.lineTo(W,H/2-26); g.moveTo(0,H/2+26); g.lineTo(W,H/2+26); g.stroke();
    /* Adressaufkleber */
    g.fillStyle='#f6f4ec'; g.fillRect(46,64,236,150);
    g.strokeStyle='#c6c1b2'; g.lineWidth=3; g.strokeRect(46,64,236,150);
    g.fillStyle='#22262e'; g.font=BUN(26); g.textAlign='left'; g.textBaseline='top';
    g.fillText('DDL EXPRESS',60,76);
    g.fillStyle='#5b6270'; g.font=BAR(18);
    g.fillText('Paketmarke bezahlt',60,110);
    g.fillText('Empfänger siehe Barcode',60,134);
    for(let i=0,x=60;i<40&&x<268;i++){ const w=rand(2,7); g.fillStyle='#1c2028'; g.fillRect(x,162,w,40); x+=w+rand(2,6); }
    /* Zerbrechlich-Aufdruck */
    g.strokeStyle='rgba(60,50,38,.5)'; g.lineWidth=4;
    g.strokeRect(330,300,132,132);
    g.fillStyle='rgba(60,50,38,.5)'; g.font=BUN(22); g.textAlign='center';
    g.fillText('ZERBRECHLICH',396,444);
    g.beginPath(); g.moveTo(370,410); g.lineTo(370,336); g.lineTo(422,336); g.lineTo(422,410); g.stroke();
  });
  paketTex=new THREE.MeshStandardMaterial({map:t,roughness:0.86});
  return paketTex;
}
function paketPose(i){ return {x:3.9+(i%3)*0.62,z:-0.3+Math.floor(i/3)*0.6}; }
function syncPakete(){
  if(!packTisch) return;
  const soll=Math.min(PAKET_BAYS,S?(S.pakete|0):0);
  while(pakete.length<soll){
    const i=pakete.length, p=paketPose(i), h=rand(0.3,0.42);
    const m=rbox(0.46,h,0.46,0.012,paketMaterial(),p.x,h/2+0.02,p.z,packTisch);
    m.rotation.y=rand(-0.16,0.16);
    pakete.push(m);
  }
  while(pakete.length>soll){ const m=pakete.pop(); if(m.parent) m.parent.remove(m); }
}
/* Ein Paket packen: eine offene Bestellung wird zur Ware auf der Rampe */
function paketWert(){ return r2(5+S.rep*0.06+S.level*0.25); }
function bestellungenProTag(){
  if(!packBereit()) return 0;
  return Math.max(4,Math.min(20,Math.round((40+S.rep*1.6+S.level*4)/Math.max(6,paketWert()))));
}
/* Sechs Stellplaetze auf der Rampe waren die Obergrenze fuer einen
   ganzen Tag - bei zwanzig Bestellungen taeglich staute sich der
   Versand endlos auf und kostete jeden Abend Ruf. Ist die Rampe voll,
   faehrt DDL eben zwischendurch vor. */
function packOne(auto){
  if(!packBereit()||(S.offen|0)<=0) return false;
  if((S.pakete|0)>=PAKET_BAYS){
    ddlAbholung();
    if(!auto) toast('Die Rampe war voll - DDL hat zwischendurch abgeholt.');
  }
  S.offen--; S.pakete=(S.pakete|0)+1;
  const w=paketWert();
  S.money=r2(S.money+w); DS.revenue=r2(DS.revenue+w); DS.versand=r2((DS.versand||0)+w);
  goalAdd('rev',w);
  syncPakete(); drawPackSchild();
  statAdd('pakete',1);
  if(!auto){ addXP(3); sfx.beep(); toast('Paket fertig: +'+eur(w),'money'); }
  return true;
}
function updateVersand(dt){
  if(!packBereit()){ versandT=0; return; }
  if(phase==='open'){
    const n=bestellungenProTag(); if(n>0){
      versandT-=dt;
      if(versandT<=0){ versandT=330/n; S.offen=(S.offen|0)+1; drawPackSchild(); }
    }
  }
  if(staff.packer&&(S.offen|0)>0){
    S.packT=(S.packT||0)-dt;
    if(S.packT<=0){ S.packT=3.4/(staff.packer.wf||1); packOne(true); }
  }
}
/* Tagesende: DDL holt ab, offene Bestellungen bleiben liegen */
function ddlAbholung(){
  const n=S.pakete|0; if(n<=0) return 0;
  statAdd('ddl',n);
  S.pakete=0; syncPakete(); drawPackSchild();
  return n;
}

/* =========================================================
   Westrampen: drei Ladetore in der Westhalle und der grosse
   Hof dahinter. Hier passen mehrere Auflieger nebeneinander -
   der kleine Hof an der Basisrampe reicht dafuer nicht.
   ========================================================= */
const WRAMPEN=[-25.6,-18.6,-11.6];          /* Mitte der drei Tore in z */
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
/* Ein Ladetor in der Westwand, von aussen gesehen. Das Tor bleibt zu. */
function westTor(cz,nr){
  const X=LAY.lwest.x0, steel=std(0x8d939d,{metalness:0.6,roughness:0.42});
  const dark=std(0x2a2e38,{metalness:0.5,roughness:0.45});
  const rub=std(0x16181d,{roughness:0.96});
  const g=new THREE.Group(); g.position.set(X,0,cz); scene.add(g);
  /* Torblatt buendig in der Laibung - von aussen wie von innen ein
     Sektionaltor, nicht ein schwarzes Loch. */
  const tb=torBlattMat(), kante=std(0x6f757e,{metalness:0.5,roughness:0.5});
  const bl=new THREE.Mesh(new THREE.BoxGeometry(0.1,WTOR.h,WTOR.w),[tb,tb,kante,kante,kante,kante]);
  bl.position.set(-0.15,WTOR.h/2,0); g.add(bl);
  /* Das Tor war reine Kulisse. Jetzt merkt sich die Rampe ihr
     Torblatt und ihre Ampel, damit eine zugekaufte Andockstation
     wirklich aufmachen kann. */
  const eintrag={nr,z:cz,blatt:bl,zu:WTOR.h/2,auf:WTOR.h/2+WTOR.h-0.06,t:0};
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
  for(const s of [-1,1]){ const st=bbox(0.07,0.95,0.07,steel,-1.2,WTOR.h+0.1,s*(WTOR.w/2+0.4),g,false); st.rotation.z=-0.74; }
  /* Torbeschlaege: Fuehrungsschienen und Antriebskasten sieht man
     von aussen nicht - dafuer Ampel, Taster und Torkennung. */
  bbox(0.14,0.44,0.14,dark,-0.3,2.0,WTOR.w/2+0.62,g,false);
  const lr=new THREE.MeshStandardMaterial({color:LIN(0x300808),emissive:LIN(0xff2a2a),emissiveIntensity:1.2});
  const lg=new THREE.MeshStandardMaterial({color:LIN(0x082a12),emissive:LIN(0x3dff7a),emissiveIntensity:0});
  for(const [m,y] of [[lr,2.12],[lg,1.9]]){
    const c2=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.04,10),m);
    c2.rotation.z=Math.PI/2; c2.position.set(-0.38,y,WTOR.w/2+0.62); g.add(c2);
  }
  eintrag.rot=lr; eintrag.gruen=lg; WTORE[nr-1]=eintrag;
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
    c.fillText(String(nr),W/2,H/2+6); })}),-0.22,WTOR.h+0.95,0,-Math.PI/2,g);
  /* Poller neben der Torlaibung */
  for(const s of [-1,1]){
    const pz=cz+s*(WTOR.w/2+1.15);
    bbox(0.2,0.95,0.2,std(0xf2c230,{roughness:0.7}),X-0.9,0.48,pz,null,true);
    bbox(0.22,0.14,0.22,std(0x1f1f24),X-0.9,0.86,pz,null,false);
    col(X-1.05,X-0.75,pz-0.15,pz+0.15);
  }
}
/* Die Westwand der Halle: massive Abschnitte, drei Tore, Sturz darueber. */
function westWand(){
  const x0=LAY.lwest.x0, z0=LAY.lwest.z0, z1=LAY.lwest.z1, H=HALLE_H, ex=blechMat();
  let z=z0;
  for(const cz of WRAMPEN){
    const a=cz-WTOR.w/2, b=cz+WTOR.w/2;
    if(a>z){ wall(x0-LW,x0,z,a,0,H,'+x',lagerWall,ex); col(x0-LW,x0,z,a); }
    wall(x0-LW,x0,a,b,WTOR.h,H,'+x',lagerWall,ex);
    col(x0-LW,x0,a,b);                     /* die Tore bleiben zu */
    z=b;
  }
  if(z1>z){ wall(x0-LW,x0,z,z1,0,H,'+x',lagerWall,ex); col(x0-LW,x0,z,z1); }
  /* Sockelband gegen Spritzwasser */
  bbox(0.06,1.05,z1-z0,std(0x4a5058,{roughness:0.9}),x0-LW-0.03,0.525,(z0+z1)/2,null,false);
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
function buildWestrampen(){
  const r=LAY.hof2;
  westWand();
  for(let i=0;i<WRAMPEN.length;i++) westTor(WRAMPEN[i],i+1);
  /* Hofbelag: grosse Betonplatte mit Zufahrt zum alten Hof */
  const bt=concreteTex(); bt.repeat.set((r.x1-r.x0)/2.4,(r.z1-r.z0)/2.4);
  flat(r.x1-r.x0,r.z1-r.z0,new THREE.MeshStandardMaterial({map:bt,roughness:0.93,color:LIN(0xaaaeb4)}),
       (r.x0+r.x1)/2,0.013,(r.z0+r.z1)/2);
  const zt=concreteTex(); zt.repeat.set(10,2);
  flat(21,4.2,new THREE.MeshStandardMaterial({map:zt,roughness:0.93,color:LIN(0xa4a8ae)}),-44.5,0.012,-1.5);
  flat(6,7,new THREE.MeshStandardMaterial({map:zt,roughness:0.93,color:LIN(0xa4a8ae)}),-52,0.012,-4.0);
  /* Stellplatzmarkierung vor jedem Tor */
  const gelb=std(0xf2c230);
  for(const cz of WRAMPEN){
    for(const s of [-1,1]) flat(14,0.14,gelb,r.x1-7.4,0.017,cz+s*1.9);
    flat(0.14,3.8,gelb,r.x1-14.4,0.017,cz);
    for(let k=0;k<5;k++) flat(0.5,0.1,gelb,r.x1-1.2-k*1.1,0.017,cz);
  }
  /* Wartespur fuer abgestellte Auflieger: laengs an der Westseite,
     nebeneinander, damit sie nicht quer im Hof stehen. */
  for(let i=0;i<4;i++){ const px=r.x0+2.2+i*3.6;
    for(const s of [-1,1]) flat(0.14,14,gelb,px+s*1.5,0.017,r.z0+9.6); }
  abstellAuflieger(r.x0+2.2, r.z0+9.6,Math.PI/2,'Kowalski',TRUCKCOL.kowalski);
  abstellAuflieger(r.x0+5.8, r.z0+9.2,Math.PI/2,'Mertens', TRUCKCOL.mertens);
  abstellAuflieger(r.x0+9.4, r.z0+10.0,Math.PI/2,'Ratzke', TRUCKCOL.ratzke);
  /* Zaun: Westseite, Sueden, Norden mit Einfahrt */
  const ZH=2.2;
  zaunLauf(r.x0,r.z0,r.x0,r.z1,ZH);
  zaunLauf(r.x0,r.z0,r.x1,r.z0,ZH);
  zaunLauf(r.x0,r.z1,-55,r.z1,ZH);
  zaunLauf(-49,r.z1,r.x1,r.z1,ZH);
  col(r.x0-0.1,r.x0+0.1,r.z0,r.z1);
  col(r.x0,r.x1,r.z0-0.1,r.z0+0.1);
  col(r.x0,-55,r.z1-0.1,r.z1+0.1);
  col(-49,r.x1,r.z1-0.1,r.z1+0.1);
  /* Schiebetor, offen an den Zaun gefahren */
  { const g2=new THREE.Group(); g2.position.set(-49,0,r.z1); scene.add(g2);
    const steel=std(0x8d939d,{metalness:0.6,roughness:0.42});
    bbox(6.4,0.1,0.1,steel,3.2,ZH-0.1,0.16,g2,false);
    bbox(6.4,0.1,0.1,steel,3.2,0.34,0.16,g2,false);
    for(let i=0;i<21;i++) bbox(0.07,ZH-0.5,0.07,steel,0.2+i*0.31,ZH/2,0.16,g2,false);
    for(const dx of [0.2,6.2]) bbox(0.1,ZH+0.2,0.1,steel,dx,ZH/2,0.16,g2,false);
    col(-48.9,-42.6,r.z1+0.06,r.z1+0.26); }
  /* Licht, Deko, Winterdienst */
  hofMast(r.x0+1.6,-27.5,Math.PI/2); hofMast(r.x0+1.6,-11.5,Math.PI/2);
  hofMast(-46.5,r.z0+1.6,0);         hofMast(-56.5,r.z1-1.6,Math.PI);
  palettenStapel(r.x1-2.4,-29.0,7,0.1);
  palettenStapel(r.x1-3.8,-28.8,5,-0.2);
  palettenStapel(r.x1-2.6,-7.9,6,0.3);
  /* Abrollcontainer an der Sued-Ecke */
  { const cx=-58.5, cz=-28.4;
    const cm=std(0x4a6f52,{metalness:0.35,roughness:0.7});
    bbox(6.0,2.2,2.5,cm,cx,1.1,cz,null,true);
    bbox(6.1,0.14,2.6,std(0xeef2f8,{roughness:1}),cx,2.24,cz,null,false);
    for(let i=0;i<9;i++) bbox(0.08,2.1,2.56,std(0x3f6047,{metalness:0.3,roughness:0.75}),cx-2.8+i*0.7,1.1,cz,null,false);
    col(cx-3.1,cx+3.1,cz-1.35,cz+1.35); }
  /* Schneehaufen vom Raeumen, an den Zaun geschoben */
  for(const [sx,sz,sw] of [[-62,-24,3.2],[-62,-16,2.6],[-52,-29,3.6],[-45,-9.4,2.4]]){
    const h=new THREE.Mesh(new THREE.SphereGeometry(sw/2,HIQ?14:8,8),std(0xeef2f8,{roughness:1}));
    h.scale.set(1,0.42,0.8); h.position.set(sx,0.1,sz); scene.add(h);
    col(sx-sw/2,sx+sw/2,sz-sw/2.6,sz+sw/2.6); }
  /* Hinweisschild an der Einfahrt */
  { const px=-49.8, pz=r.z1+0.2;
    bbox(0.1,2.4,0.1,std(0x59606b,{metalness:0.6}),px,1.2,pz,null,false);
    plane(1.5,0.95,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,map:tex(300,190,(g,W,H)=>{
      g.fillStyle='#1b2340'; g.fillRect(0,0,W,H);
      g.strokeStyle='#ffd23f'; g.lineWidth=6; g.strokeRect(7,7,W-14,H-14);
      g.textAlign='center'; g.textBaseline='middle';
      g.fillStyle='#ffd23f'; g.font=BUN(32); g.fillText('WESTRAMPE',W/2,44);
      g.fillStyle='#bcd0ea'; g.font=BAR(24);
      g.fillText('Tor 1 – 3 · Auflieger',W/2,86);
      g.fillText('Schrittgeschwindigkeit',W/2,118);
      g.fillStyle='#ff9d92'; g.font=BAR(22); g.fillText('Rauchen und Feuer verboten',W/2,152); })}),
      px,1.75,pz,Math.PI/2,null);
    col(px-0.15,px+0.15,pz-0.15,pz+0.15); }
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
  /* Bauschild am Zaun */
  { const sx=Z.x+0.16, sz=-6.0;
    const t=tex(1024,460,(g,W,H)=>{
      g.fillStyle='#f4f2ea'; g.fillRect(0,0,W,H);
      for(let i=0;i<2600;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.035})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
      g.fillStyle='#1b2340'; g.fillRect(0,0,W,110);
      g.textAlign='center'; g.textBaseline='middle';
      g.fillStyle='#ffd23f'; g.font=BUN(58); g.fillText('LOGISTIKZENTRUM',W/2,57);
      g.fillStyle='#1b2340'; g.font=BUN(52); g.fillText('BAUABSCHNITT 2',W/2,190);
      g.fillStyle='#5a6070'; g.font=BAR(38);
      g.fillText('Umschlag · Kommissionierung · Versand',W/2,258);
      g.strokeStyle='#c8322a'; g.lineWidth=7; g.strokeRect(120,300,W-240,110);
      g.fillStyle='#c8322a'; g.font=BUN(40); g.fillText('NOCH NICHT ZU HABEN',W/2,357);
      g.strokeStyle='#c9c4b8'; g.lineWidth=8; g.strokeRect(4,4,W-8,H-8);
    });
    zWand('logistik',plane(5.4,2.4,new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide}),sx,1.45,sz,-Math.PI/2,null));
    for(const dz of [-2.4,2.4]) zWand('logistik',bbox(0.1,2.8,0.1,std(0x59606b,{metalness:0.6}),sx,1.4,sz+dz,null,false)); }
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

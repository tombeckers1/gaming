/* =========================================================
   Lagerlogistik – Halle Etappe A (Kapitel 7.3, Tom 14.10.2026: „bau mal die Halle komplett dran“)
   Bauvorgabe docs/halle/plan-1410.md, Masse aus der Skizze docs/halle/skizze-1410.html (Z/LINIEN/TORE/WEGE).

   Mit dem Ausbau „lagerlogistik“ (setzt Logistikhalle Stufe 3 voraus) wird die Halle zum Hochregallager:
   - Kartonlager ③ (x −36…−19,9 / z −17…−7, 5 m) mit gelber Wand zur Halle und Schnelllauftor N1;
     ①, ② und ③ sind ein Raum (die Wand ② ↔ ③ faellt).
   - Neue Schleuse x −26…−19,9 / z −29,9…−17 (3,4 m) mit Brandschutz-Schiebetor + Streifenvorhang zur Halle,
     breit offen zu ② und zur Versandecke. Die alte Schleuse (z −24…−17) wird ausgeblendet (LL_ALT).
   - Hochregal 3 Gassen (bk.hochregal), Gasse 1 mit Regalbediengeraet (bk.rbg), Gassen 2/3 stehen leer
     (kommen mit Kapitel 8 / 8.2, LL_GASSEN). I/O Ost mit Foerderern (bk.foerderer), Anbruch, Wareneingang-
     Stellplaetze, Ausgang R5, Packmaterial, 13 Schnellplaetze, Bodenmarkierungen (bk.bodenmarkierung),
     Hallenleuchten (bk.lampe 'halle'), Lichtbaender, Sprinkler, Fluchtwegschilder.
   - Aussen: Sprinkler-Tank, Mitarbeiter-Parkplatz, Pforte.
   Gebaut wird erst beim Kauf (vorher liegt nichts davon im Speicher). Die Lager-Logik steht in 11f.
   ========================================================= */
const LL={id:'lagerlogistik',
  lager3:{x0:-36,x1:-19.9,z0:-17,z1:-7}, h3:5.0,
  schleuse:{x0:-26,x1:-19.9,z0:-29.9,z1:-17},
  durchgang:[-26.9,-23.1], n1:{x:-36,z0:-13.6,z1:-10.4,h:3.0},
  hr:{x0:-65.7,z0:k=>-27.8+4.67*k}, io:{x0:-48.3,x1:-46},
  anbruch:{x0:-46,x1:-42,z0:-28,z1:-14},
  weing:{x0:-50,x1:-26.6,z0:-33.8,z1:-28.6}, wausg:{x0:-62,x1:-53,z0:-33.8,z1:-28.6},
  packmat:{x0:-41.5,x1:-33,z0:-27.5,z1:-23}, schnell:{x0:-63.4,x1:-43.9,z0:-9.6,z1:-7.4},
  aufgabe:{x:-47.4,z0:-29.7,z1:-27.2}, auslager:{z:-24.4,x0:-47.75,x1:-45.7},
  spur:-29.15,                                   /* Fahrweg FTS vor den Stellplaetzen */
  park:{x0:-58,x1:-38,z0:-5,z1:4}, pforte:{x0:-38,x1:-34,z0:0,z1:5}, tank:{x:-62.5,z:-0.5,r:3.6,h:9.0}
};
/* Gassen: Gasse 1 mit Kapitel 7.3, Gasse 2 mit Kapitel 8 (fabrik), Gasse 3 mit Kapitel 8.2 (fabrik2) - die
   Ausbauten der Fertigung kommen in Etappe B; bis dahin stehen Gasse 2 und 3 als Regal ohne RBG. */
const LL_GASSEN=[{up:'lagerlogistik',nr:1},{up:'fabrik',nr:2},{up:'fabrik2',nr:3}];
function llOffen(){ return zoneOffen(LL.id)&&zoneOffen('lager_west3'); }
function llGasseAktiv(k){ return llOffen()&&!!(S&&S.up&&S.up[LL_GASSEN[k].up]); }
/* Bereiche, die mit dem Ausbau belegt sind (Moebel, Lagerregale, Kartons ziehen um; nichts darf hinein) */
function llSperrRechtecke(){ const a=LL.anbruch, R=[];
  R.push({x0:-66,x1:LL.io.x1+0.1,z0:-28.4,z1:-14.2});                     /* Hochregal + I/O */
  R.push({x0:a.x0,x1:a.x1,z0:a.z0,z1:a.z1});                              /* Anbruch */
  R.push({x0:LL.weing.x0,x1:LL.weing.x1,z0:-34,z1:LL.weing.z1});           /* Wareneingang */
  R.push({x0:LL.wausg.x0,x1:LL.wausg.x1,z0:-34,z1:LL.wausg.z1});           /* Ausgang R5 */
  R.push(LL.packmat); R.push(LL.schnell);
  R.push({x0:-26.4,x1:-19.6,z0:-30.2,z1:-17.0});                          /* Schleuse */
  R.push({x0:-36.2,x1:-33.0,z0:-13.8,z1:-10.2}); R.push({x0:-38.6,x1:-36.0,z0:-13.8,z1:-10.2});  /* vor und hinter N1 */
  return R; }
function llSperrt(x0,x1,z0,z1){ if(!llOffen()) return false;
  for(const r of llSperrRechtecke()) if(x0<r.x1-0.02&&x1>r.x0+0.02&&z0<r.z1-0.02&&z1>r.z0+0.02) return true; return false; }

/* ---------- Alte Teile, die mit dem Ausbau verschwinden ----------
   05h baut die alte Schleuse (z −24…−17) samt Ostwand von ② und Streifenvorhaengen in llAltSammle;
   05m verschiebt die alte Ostwand der Halle (Stufe 3) mit llAltHalle hierher. Sichtbarkeit/Kollision
   schaltet llAnwenden. Lampen der alten Teile bekommen aus:'lagerlogistik'. */
const LL_ALT={g:null,cols:[],halle:null,halleCols:[]};
function llAltSammle(fn){
  if(!LL_ALT.g){ LL_ALT.g=new THREE.Group(); LL_ALT.g.name='llAlt'; scene.add(LL_ALT.g); }
  const vorS=new Set(scene.children), vorC=colliders.length, vorL=LAMPEN.length;
  fn();
  const zw=new Set(); for(const id in ZONEN) for(const c of ZONEN[id].wandCols) zw.add(c);
  for(const o of scene.children.filter(o=>!vorS.has(o)&&o!==LL_ALT.g)){ scene.remove(o); LL_ALT.g.add(o); }
  for(const c of colliders.slice(vorC)) if(!zw.has(c)) LL_ALT.cols.push(c);
  for(let i=vorL;i<LAMPEN.length;i++) LAMPEN[i].aus=LL.id;
}
/* Stufe 3 der Logistikhalle: Ostwand, Bodenschatten an der Ostwand und Hallenschild ueber dem alten Durchgang */
function llAltHalle(g,cols){
  const alt=new THREE.Group(); alt.name='llAltHalle'; g.add(alt); LL_ALT.halle=alt;
  for(const o of g.children.slice()){ if(o===alt) continue; o.updateMatrixWorld&&o.updateMatrixWorld(true);
    const p=new THREE.Vector3(); o.getWorldPosition(p);
    const wand=o.userData&&o.userData.aabb&&o.userData.aabb.x0>-26.4&&o.userData.aabb.x1<-25.6;
    const ao=o.material===aoMatF&&Math.abs(p.x+26.2)<0.35;
    const schild=o.isMesh&&o.geometry&&o.geometry.type==='PlaneGeometry'&&Math.abs(p.x+26.13)<0.05&&p.y>3;
    const sockel=o.userData&&o.userData.bauteil==='wand'&&Math.abs(p.x+26)<0.4&&!o.userData.aabb;
    if(wand||ao||schild||sockel){ g.remove(o); alt.add(o); } }
  for(const c of cols) if(c.minX>-26.4&&c.maxX<-25.6) LL_ALT.halleCols.push(c);
  /* Lampen der Stufe 3 ueber ③ (x −36…−26, z −17…−7) und die ganze alte Rasterbeleuchtung: aus mit dem Ausbau */
  for(const L of LAMPEN) if(L.y>10&&L.x>-66&&L.x<-26&&L.z>-34&&L.z<-7&&!L.id) L.aus=LL.id;
  for(const o of g.children.slice()) if(o.userData&&o.userData.bauteil==='lampe'&&o.userData.bauteilArt==='raster'){ g.remove(o); alt.add(o); }
}
/* Bodenschatten an der Westseite von ② (x −19,9) laufen durch die neuen Oeffnungen - mit dem Ausbau aus */
function llAltAO(){ const out=[];
  scene.traverse(o=>{ if(o.material!==aoMatF||!o.parent) return; const p=o.position; if(Math.abs(p.x+19.7)<0.25&&p.z<-6&&p.z>-30) out.push(o); });
  return out; }

/* Gruppen: LL_G Rohbau (③, Schleuse, Aussen - immer sichtbar), LL_H Halleninhalt (Hochregal, Zonen, Markierungen, Licht -
   nur gezeichnet, wenn die Kamera in der Halle steht oder eine Oeffnung der Halle im Blick hat, llSichtTakt), LL_D bewegte
   Teile (RBG, FTS, Ladungen, Stellplatz-Paletten; nicht in die Laufzeit-Buendelung) */
let LL_G=null, LL_H=null, LL_D=null, LL_A=null, LL_COLS=[], LL_T=null, LL_AO=null;
function buildLagerlogistik(){
  zone(LL.id); zHook(LL.id,llAnwenden);
}
function llAnwenden(){
  const an=llOffen();
  if(an&&!LL_G) llBauen();
  if(LL_G) LL_G.visible=an;
  if(LL_H&&!an){ LL_H.visible=false; LL_D.visible=false; LL_A.visible=false; }
  for(const c of LL_COLS){ const d=colliders.indexOf(c)>=0; if(an&&!d) colliders.push(c); else if(!an&&d) dropCol(c); }
  if(LL_ALT.g) LL_ALT.g.visible=!an;
  for(const c of LL_ALT.cols){ const d=colliders.indexOf(c)>=0; if(!an&&!d) colliders.push(c); else if(an&&d) dropCol(c); }
  if(!LL_AO) LL_AO=llAltAO();
  for(const o of LL_AO) o.userData.llAus=an;
  for(const o of LL_AO) if(an) o.visible=false;
  if(typeof logiAnwenden==='function') logiAnwenden();
  if(typeof hrAnwenden==='function') hrAnwenden();
  if(typeof navDirty==='function') navDirty();
  if(an) later(0.4,()=>{ if(llOffen()&&typeof llRaeumen==='function') llRaeumen(); });
}

/* ---------- Bau (einmal, beim ersten Oeffnen) ---------- */
function llBauen(){
  const grp=(n,bnd)=>{ const g=new THREE.Group(); g.name=n; g.userData.inventar=true; if(bnd) g.userData._bnd=true; scene.add(g); return g; };
  LL_G=grp('lagerlogistik'); LL_H=grp('lagerlogistikHalle'); LL_D=grp('lagerlogistikBewegt',true); LL_A=grp('lagerlogistikAussen');
  LL_T={gassen:[],foerderer:{},n1:null,lichtband:null,tor:null,hr:null};
  const vorC=colliders.length, vorL=LAMPEN.length;
  /* alles, was eine Baufunktion in die Szene stellt, in ihre Gruppe; Kollisionen verwaltet llAnwenden */
  const fang=(ziel,fn)=>{ const vorS=new Set(scene.children); fn(); for(const o of scene.children.filter(o=>!vorS.has(o))){ scene.remove(o); ziel.add(o); } };
  fang(LL_G,()=>{ llRohbau(); }); fang(LL_A,()=>{ llAussen(); });
  /* Bodenschatten von ③/Schleuse/Halle in EIN Mesh (sonst je Streifen ein Zeichenaufruf) */
  { const ao=LL_G.children.filter(o=>o.isMesh&&o.material===aoMatF);
    if(ao.length>1){ const teile=ao.map(o=>{ o.updateMatrix(); return {geo:o.geometry,m:o.matrix.clone()}; }); const m=new THREE.Mesh(merge(teile),aoMatF); m.renderOrder=1; m.matrixAutoUpdate=false; ao.forEach(o=>{ LL_G.remove(o); o.geometry.dispose(); }); LL_G.add(m); } }
  fang(LL_H,()=>{ llHochregal(); llZonen(); llBoden(); llLicht(); });
  LL_COLS=colliders.slice(vorC); for(const c of LL_COLS) dropCol(c);
  for(let i=vorL;i<LAMPEN.length;i++) LAMPEN[i].id=LL.id;
  bk.wandbild();
}
/* Wandstueck (Kollision nur, wenn es am Boden steht) */
function llW(x0,x1,z0,z1,y0,y1,innen,fi,fa,still){
  const m=bk.wand({x0,x1,z0,z1,y0,y1,innen,flaechen:{innen:fi,aussen:fa,laibung:'laibung'},ue:0,still});
  if(y0<0.05) col(Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1));
  return m; }
function llRohbau(){
  const GELB=MAT.ober('signalgelb','matt'), W=LW/2, H=11.0, h3=LL.h3, hs=SCHLEUSE_H, S2=LL.schleuse, L3=LL.lager3, N=LL.n1;
  /* Boden der Schleuse und von ③ ausserhalb der Halle (x −26…−19,9) */
  { const bo=new THREE.Mesh(MAT.kachel(new THREE.PlaneGeometry(S2.x1-S2.x0,L3.z1-S2.z0),(S2.x1-S2.x0)/2,(L3.z1-S2.z0)/2),MAT.get('betonBoden'));
    bo.rotation.x=-Math.PI/2; bo.position.set((S2.x0+S2.x1)/2,0.016,(S2.z0+L3.z1)/2); scene.add(bo); }   /* wie die Hallenboeden: ohne Sonnenschatten */
  /* Decken: ③ bei 5,0 m, Schleuse bei 3,4 m; Dach ueber dem Ostteil von ③ und ueber der Schleuse */
  const decke=(x0,x1,z0,z1,y)=>{ const ce=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),MAT.get('weissMatt')); ce.rotation.x=Math.PI/2; ce.position.set((x0+x1)/2,y-0.01,(z0+z1)/2); scene.add(ce); };
  decke(L3.x0+W,L3.x1,L3.z0+W,L3.z1,h3); decke(S2.x0+W,S2.x1,S2.z0,S2.z1-W,hs);
  bbox(6.0,0.25,10.2,MAT.get('anthrazitMatt'),-23.0,h3+0.24,-11.9,null,true);
  bbox(6.0,0.25,13.1,MAT.get('anthrazitMatt'),-23.0,hs+0.24,-23.55,null,true);
  /* Gelbe Wand x −36 (zur Halle Signalgelb bis 5 m, darueber Paneel bis unters Hallendach), Tor N1 */
  llW(-36-W,-36+W,L3.z0-W,N.z0,0,h3,'+x','lager',GELB);
  llW(-36-W,-36+W,N.z1,L3.z1,0,h3,'+x','lager',GELB);
  llW(-36-W,-36+W,N.z0,N.z1,N.h,h3,'+x','lager',GELB);
  llW(-36-W,-36+W,L3.z0-W,L3.z1,h3,H,'+x','lager','blech',true);
  /* Gelbe Wand z −17 (x −36…−26) */
  llW(-36+W,-26-W,L3.z0-W,L3.z0+W,0,h3,'+z','lager',GELB);
  llW(-36+W,-26-W,L3.z0-W,L3.z0+W,h3,H,'+z','lager','blech',true);
  /* Brandwand x −26 zwischen Halle und Schleuse, Durchgang z −26,9…−23,1, Sturz 3,0 m */
  const [d0,d1]=LL.durchgang;
  llW(-26-W,-26+W,-34-W,S2.z0,0,H,'-x','lager','blech');
  llW(-26-W,-26+W,S2.z0,d0,0,hs,'-x','lager','lager');
  llW(-26-W,-26+W,d1,L3.z0-W,0,hs,'-x','lager','lager');
  llW(-26-W,-26+W,d0,d1,3.0,hs,'-x','lager','lager');
  llW(-26-W,-26+W,S2.z0,L3.z0-W,hs,H,'-x','lager','blech',true);
  /* Ostwand der Halle ueber ③ (ab 5 m) */
  llW(-26-W,-26+W,L3.z0-W,L3.z1+LW,h3,H,'-x','lager','blech',true);
  /* Schleuse: Suedwand, Sturz zu ③, Sturz und Pfeiler zu ② (breit offen) */
  llW(S2.x0+W,S2.x1-W,S2.z0-LW,S2.z0,0,hs,'+z','lager','blech');
  llW(S2.x0+W,S2.x1-W,L3.z0-W,L3.z0+W,3.0,hs,'+z','lager','lager',true);
  llW(S2.x0+W,S2.x1-W,L3.z0-W,L3.z0+W,hs,h3,'+z','lager','blech',true);
  llW(S2.x1-LW,S2.x1,S2.z0-LW,S2.z0+0.4,0,hs,'+x','lager','lager');
  llW(S2.x1-LW,S2.x1,S2.z0+0.4,L3.z0-W,3.0,hs,'+x','lager','lager',true);
  llW(S2.x1-LW,S2.x1,S2.z0+0.4,L3.z0-W,hs,h3,'+x','lager','blech',true);
  /* ② ↔ ③ (x −19,9): oben bleibt ein Sturz bis zur Decke, damit das Dach von ③ und ② buendig anschliesst */
  /* ③ Nordwand ausserhalb der Halle (x −26…−20) + Eckstueck an der Rampe R1 */
  llW(-26+W,S2.x1-LW,L3.z1,L3.z1+LW,0,h3,'-z','lager','blech');
  llW(S2.x1-LW,S2.x1,L3.z1,-6.1+0.006,0,h3,'+x','lager','fassade');
  /* Brandschutz-Schiebetor (offen geparkt auf der Hallenseite, faellt bei Alarm) + Streifenvorhang */
  { const Sx=bk.sammler({form:{fase:0.01,faseMin:0.04,lod0Kasten:true},bauteil:'brandschutztor'}), F=MAT.farbe, b=d1-d0+0.4, xg=-26-W-0.12;
    Sx.box(0.08,3.25,b,xg,1.625,d0-b/2-0.05,F('lichtgrau'),'lackMetall');
    Sx.box(0.085,0.12,b,xg,0.5,d0-b/2-0.05,F('feuerrot'),'lackMetall'); Sx.box(0.085,0.12,b,xg,2.8,d0-b/2-0.05,F('feuerrot'),'lackMetall');
    Sx.box(0.12,0.14,2*b+0.4,xg,3.34,d0-b/2+b/2,F('silbergrau'),'stahl');
    for(const z of [d0-b-0.05,d0-0.05]) Sx.box(0.1,0.06,0.06,xg,3.26,z,F('anthrazit'),'stahl');
    Sx.box(0.06,0.3,0.2,xg+0.02,3.0,d1+0.4,F('feuerrot'),'kunststoff');   /* Feststellanlage mit Rauchmelder */
    Sx.fertig(scene,{fest:true});
    col(xg-0.06,xg+0.06,d0-b-0.1,d0-0.05);
    bk.bodenmarkierung({flaechen:[{x0:-27.2,x1:-26.1,z0:d0,z1:d1,art:'sperr'}],y:0.015});
    bk.schild(scene,{text:'FEUERSCHUTZTOR',unter:'Schliessbereich freihalten',b:1.5,h:0.42,x:xg-0.05,y:3.65,z:(d0+d1)/2,ry:-Math.PI/2,bg:MAT.css('feuerrot'),fg:MAT.css('weiss')}); }
  streifenvorhang(null,false,-26,d0,d1,3.0);
  /* Schnelllauftor N1 in der gelben Wand */
  LL_T.n1=bk.tor({art:'roll',breite:N.z1-N.z0,hoehe:N.h,wand:[-W,W],blatt:0,nr:null,bedien:1,ampel:false,vordach:false,dichtung:false,poller:false,x:-36,z:(N.z0+N.z1)/2,ry:0});
  LL_T.n1.set(0); LL_T.n1t=0;
  bk.schild(scene,{text:'N1',unter:'Kartonlager',b:0.9,h:0.4,x:-36-W-0.03,y:N.h+0.75,z:(N.z0+N.z1)/2,ry:-Math.PI/2});
  bk.schild(scene,{text:'KARTONLAGER',unter:'③',b:1.6,h:0.5,x:-36-W-0.03,y:6.2,z:-12,ry:-Math.PI/2});
  /* ③ und Schleuse: Leuchtenraster wie im uebrigen Lager */
  bk.lampe({art:'raster',r:LL.lager3,y:LL.h3,ax:3.6,az:3.4,panel:deckenPanelMat()});
  bk.lampe({art:'raster',r:{x0:-26,x1:-19.9,z0:-29.9,z1:-17},y:SCHLEUSE_H,ax:3.0,az:3.2,panel:deckenPanelMat()});
  /* Bodenschatten an den neuen Waenden */
  roomAO(L3.x0+W,-26-W,L3.z0+W,L3.z1,null,{s:true,w:true});
  roomAO(-26-W,S2.x1,L3.z0+W,L3.z1,null,{n:true});
  roomAO(S2.x0+W,S2.x1,S2.z0,S2.z1,null,{s:true,w:true});
  roomAO(-66,-26-W,-34,L3.z0-W,null,{e:true});
  roomAO(-36-W,-26-W,-34,L3.z0-W,null,{n:true});
  roomAO(-66,-36-W,L3.z0-W,-7,null,{e:true});
}
/* Hochregal 3 Gassen + RBG (Gasse 1 aktiv, 2/3 kommen spaeter) + I/O-Foerderer + Schutzzaun */
function llHochregal(){
  const R=bk.hochregal({x0:LL.hr.x0,gassen:[0,1,2].map(k=>({z0:LL.hr.z0(k),nr:k+1,schieneOst:k===0?2.2:0.6}))});
  LL_T.hr=R;
  R.gassen.forEach((G,k)=>{ for(const c of G.kollision) col(c.x0,c.x1,c.z0,c.z1); LL_T.gassen[k]={R:G,rbg:null,k}; });
  /* Foerderer: Aufgabe (Hofseite -> Reihe A, Gasse 1), Auslagerung (Reihe B -> Anbruch) */
  const A=LL.aufgabe, B=LL.auslager;
  LL_T.foerderer.ein=bk.foerderer({von:[A.x,A.z0],bis:[A.x,A.z1],breite:1.0,hoehe:0.55});
  LL_T.foerderer.aus=bk.foerderer({von:[B.x0,B.z],bis:[B.x1,B.z],breite:1.0,hoehe:0.55});
  for(const f of [LL_T.foerderer.ein,LL_T.foerderer.aus]){ const c=f.kollision; col(c.x0,c.x1,c.z0,c.z1); }
  /* Schutzzaun um I/O und Gassenenden (gelbes Gitter), Durchlass fuer die Foerderer */
  const xz=LL.io.x1+0.05;
  bk.zaun({art:'gitter',von:[xz,-28.1],bis:[xz,-14.2],hoehe:2.0,luecke:[[B.z-0.65-(-28.1),B.z+0.65-(-28.1)]]});
  bk.zaun({art:'gitter',von:[-48.35,-28.1],bis:[xz,-28.1],hoehe:2.0,luecke:[[A.x-0.65+48.35,A.x+0.65+48.35]]});
  bk.zaun({art:'gitter',von:[-48.35,-14.2],bis:[xz,-14.2],hoehe:2.0});
  col(xz-0.06,xz+0.06,-28.1,B.z-0.65); col(xz-0.06,xz+0.06,B.z+0.65,-14.2);
  col(-48.35,A.x-0.65,-28.16,-28.04); col(A.x+0.65,xz,-28.16,-28.04); col(-48.35,xz,-14.26,-14.14);
  /* der ganze eingezaeunte Block (Gassen, I/O) ist fuer Personen gesperrt - auch im Wegenetz */
  col(-66,xz,-28.1,-14.2);
  bk.schild(scene,{text:'HOCHREGAL',unter:'Zutritt nur für Befugte · RBG-Bereich',b:1.6,h:0.5,x:xz+0.07,y:1.55,z:-15.6,ry:Math.PI/2});
}
/* Schild frei im Raum: haengt an zwei Abhaengern unter der Hallendecke (nie frei schwebend) */
function llHaengend(o,decke){ bk.schild(scene,o); const S=bk.sammler({bauteil:'schild'}), c=Math.cos(o.ry||0), s=Math.sin(o.ry||0), y0=o.y+o.h/2, L=(decke||10.9)-y0;
  for(const d of [-1,1]){ const dx=d*(o.b/2-0.1)*c, dz=-d*(o.b/2-0.1)*s; S.box(0.012,L,0.012,o.x+dx,y0+L/2,o.z+dz,MAT.farbe('silbergrau'),'stahl'); }
  S.box(o.b,0.04,0.04,o.x,y0+0.02,o.z,MAT.farbe('anthrazit'),'lackMetall',0,o.ry||0,0); S.fertig(scene,{fest:true,schatten:false}); }
/* Wareneingang-Stellplaetze, Ausgang R5, Packmaterial, Schnellplaetze, Anbruch-Kennzeichnung */
function LLstell(){ /* Stellplaetze je Tor R2-R4: 2 Spalten x 3 Plaetze (Paletten 0,8 x 1,2 m) */
  const out=[]; [-31,-38.5,-47.5].forEach((cx,ti)=>{ for(let r=0;r<(ti===2?2:3);r++) for(let s=0;s<2;s++) out.push({tor:ti,x:cx+(s?0.62:-0.62),z:-33.05+r*1.38,r,s}); });
  return out; }
const LL_STELL=LLstell();
function llZonen(){
  const F=MAT.farbe, P=[];
  /* Packmaterial: Faltkartons auf Paletten (Pappe), Fuellmaterial-Ballen, Klebeband */
  const S=bk.sammler({form:{fase:0.01,faseMin:0.05,lod0Kasten:true},bauteil:'packmaterial'});
  const pm=LL.packmat, ps=[];
  for(let i=0;i<5;i++){ ps.push({x:pm.x0+1.0+i*1.6,z:pm.z0+0.7}); ps.push({x:pm.x0+1.0+i*1.6,z:pm.z1-0.7}); }
  ps.forEach((p,i)=>{ P.push({x:p.x,z:p.z,ry:Math.PI/2});
    const y=bk.PALETTE.euro.h;
    if(i%4===3){ for(let k=0;k<3;k++) S.box(0.78,0.42,0.56,p.x,y+0.21+k*0.42,p.z+(k%2?0.3:-0.3),F('weiss'),'kunststoff'); }
    else { const n=6+(i*5)%5; for(let k=0;k<n;k++) S.box(0.76,0.1,1.16,p.x+((k*7)%3-1)*0.006,y+0.05+k*0.1,p.z,F('wellpappe'),'stumpf');
      S.box(0.8,0.012,0.02,p.x,y+n*0.1-0.04,p.z-0.55,F('gummischwarz'),'kunststoff'); } });
  for(let k=0;k<4;k++) S.zyl(0.06,0.06,0.05,10,pm.x1-0.6,0.9+k*0.06,pm.z0+2.25,F('wellpappe'),'kunststoff');
  S.fertig(scene,{fest:true});
  for(const p of ps) col(p.x-0.42,p.x+0.42,p.z-0.62,p.z+0.62);
  bk.paletten(P,{gruppe:'ll:packmat',fein:bk.lod()>1});
  llHaengend({text:'PACKMATERIAL',unter:'Kartons · Füllmaterial · Klebeband',b:1.6,h:0.5,x:(pm.x0+pm.x1)/2,y:3.6,z:pm.z0+0.6,ry:0});
  /* Wareneingang: leere Paletten stehen auf den Stellplaetzen (LL_STELL), die Logik (11f) belegt sie */
  bk.schild(scene,{text:'WARENEINGANG',unter:'Tor 2 – 4 · Stellplätze',b:1.8,h:0.5,x:-39.6,y:4.3,z:-33.9+0.02,ry:0});
  bk.schild(scene,{text:'AUSGANG R5',unter:'Bereitstellung ganze Paletten',b:1.8,h:0.5,x:-60.6,y:4.3,z:-33.9+0.02,ry:0});
  llHaengend({text:'ANBRUCH',unter:'Kommissionierung · Nachschub ③',b:1.6,h:0.5,x:-43.6,y:3.4,z:-21,ry:Math.PI/2});
  bk.schild(scene,{text:'SCHNELLPLÄTZE',unter:'Schnelldreher · 13 Bodenplätze',b:1.8,h:0.5,x:-53.6,y:3.4,z:-7.02,ry:Math.PI});
}
/* Bodenmarkierungen: Fahrwege gelb, Gehwege gruen mit Piktogramm, Sperrflaechen, Stellplaetze */
function llBoden(){
  const M=bk.MARKIERUNG, L=[], R=[], Fl=[], Pk=[];
  /* Fahrweg FTS: Spur vor den Stellplaetzen bis zur Aufgabe (Randlinien gelb) */
  for(const z of [LL.spur-0.55,LL.spur+0.55]) L.push([LL.aufgabe.x+0.6,z,LL.weing.x1,z,'gelb',M.fahrweg]);
  /* Wareneingang: Stellplaetze weiss umrandet, Bereich gelb */
  for(const p of LL_STELL) R.push({x0:p.x-0.55,x1:p.x+0.55,z0:p.z-0.67,z1:p.z+0.67,farbe:'weiss',breite:0.06});
  R.push({x0:LL.weing.x0,x1:LL.weing.x1,z0:LL.weing.z0,z1:LL.weing.z1+0.05,farbe:'gelb',breite:M.fahrweg});
  /* Ausgang R5: 2 x 5 Stellplaetze */
  for(let r=0;r<2;r++) for(let s=0;s<6;s++){ const x=LL.wausg.x0+0.9+s*1.45, z=-33.05+r*1.5; R.push({x0:x-0.55,x1:x+0.55,z0:z-0.67,z1:z+0.67,farbe:'weiss',breite:0.06}); }
  R.push({x0:LL.wausg.x0,x1:LL.wausg.x1,z0:LL.wausg.z0,z1:LL.wausg.z1,farbe:'gelb',breite:M.fahrweg});
  /* Packmaterial, Anbruch, Schnellplaetze (13 x 1,5 m) */
  R.push({x0:LL.packmat.x0,x1:LL.packmat.x1,z0:LL.packmat.z0,z1:LL.packmat.z1,farbe:'gelb',breite:M.fahrweg});
  R.push({x0:LL.anbruch.x0+0.1,x1:LL.anbruch.x1,z0:LL.anbruch.z0,z1:LL.anbruch.z1,farbe:'gelb',breite:M.fahrweg});
  for(let i=0;i<13;i++){ const x0=LL.schnell.x0+i*1.5; R.push({x0,x1:x0+1.5,z0:LL.schnell.z0,z1:LL.schnell.z1,farbe:'weiss',breite:0.06}); }
  /* Sperrflaechen: I/O vor den Foerderern, Gassenmuendungen */
  Fl.push({x0:LL.aufgabe.x-0.55,x1:LL.aufgabe.x+0.55,z0:-30.95,z1:LL.aufgabe.z0-0.05,art:'sperr'});
  /* Gehweg gruen: Hauptgang z −12 von ① durch N1 bis zur Westwand, dann zur Verbindungsbau-Tuer (z −9);
     Packerweg von der Schleuse am Packmaterial vorbei zum Anbruch; Personaltuer x −40 */
  const gw=(x0,z0,x1,z1)=>{ const b=0.6; if(z0===z1){ L.push([x0,z0-b,x1,z0-b,'gruen',M.gehweg]); L.push([x0,z0+b,x1,z0+b,'gruen',M.gehweg]); }
    else { L.push([x0-b,z0,x0-b,z1,'gruen',M.gehweg]); L.push([x0+b,z0,x0+b,z1,'gruen',M.gehweg]); } };
  gw(-64.5,-12,-36.6,-12); gw(-35.4,-12,-20.6,-12); gw(-64.5,-11.4,-64.5,-9.6+0.6);
  gw(-41.6,-25.0,-26.8,-25.0); gw(-40,-11.4,-40,-7.3);
  for(const x of [-60,-52,-44,-31,-24]) Pk.push({x,z:-12,ry:Math.PI/2});
  Pk.push({x:-36.0+5,z:-25.0,ry:Math.PI/2}); Pk.push({x:-40,z:-9.0,ry:0});
  bk.bodenmarkierung({linien:L,rahmen:R,flaechen:Fl,piktos:Pk,y:0.015});
}
/* Licht: Hallenleuchten ueber den Gassen und im Rest der Halle, Leuchten in ③, Lichtbaender im Dach, Sprinkler, Fluchtwege */
function llLicht(){
  const pk=[];
  for(let k=0;k<3;k++){ const zm=LL.hr.z0(k)+2.0; for(let i=0;i<6;i++) pk.push([LL.hr.x0+1.45+i*2.9,zm]); }
  for(const x of [-63,-58,-53]) pk.push([x,-31.2]);
  for(const x of [-44,-39,-34,-29]) for(const z of [-31.2,-26.0,-20.5]) pk.push([x,z]);
  for(const x of [-64,-59,-54,-49,-44,-39]) pk.push([x,-11.6]);
  bk.lampe({art:'halle',punkte:pk,y:9.0,decke:11.0,zone:LL.id});
  /* Lichtbaender (zugleich Rauch- und Waermeabzug): helle Streifen in der Hallendecke, Tag hell, Nacht dunkel (11f) */
  { const parts=[]; for(const z of [-30.5,-20.5,-10.5]) parts.push({geo:new THREE.PlaneGeometry(38,1.6),m:tm(-46,10.97,z,Math.PI/2,0,0),color:0xffffff});
    LL_T.lichtband=new THREE.Mesh(merge(parts),MAT.neu('lichtband')); LL_T.lichtband.userData.bauteil='lichtband'; scene.add(LL_T.lichtband);
    const S=bk.sammler({bauteil:'lichtband'}); for(const z of [-30.5,-20.5,-10.5]){ for(const s of [-1,1]) S.box(38.2,0.12,0.08,-46,10.92,z+s*0.84,MAT.farbe('aluminium'),'lackMetall'); }
    S.fertig(scene,{fest:true,schatten:false}); }
  /* Sprinkler (sparsam): drei Hauptleitungen Feuerrot unter der Decke, Abzweige mit Sprinklerkoepfen */
  { const S=bk.sammler({bauteil:'sprinkler'}), F=MAT.farbe, seg=[6,8,10][bk.lod()];
    for(const z of [-32.5,-23.3,-13.0]){ const xe=z>-17?-36.3:-26.3; S.zyl(0.06,0.06,xe+65.7,seg,(xe-65.7)/2,10.55,z,F('feuerrot'),'lackMetall',0,0,Math.PI/2);
      for(let x=-64;x<=xe-1;x+=3){ S.zyl(0.025,0.025,0.35,seg,x,10.37,z,F('feuerrot'),'lackMetall'); S.zyl(0.03,0.02,0.05,seg,x,10.17,z,F('messing'),'blank'); } }
    S.zyl(0.08,0.08,10.4,seg,-26.4,5.2,-33.6,F('feuerrot'),'lackMetall');
    S.fertig(scene,{fest:true,schatten:false}); }
  llTuer([1]);
  /* Fluchtweg-Schilder (gruen) */
  const fw={bg:MAT.css('signalgruen'),fg:MAT.css('weiss')};
  bk.schild(scene,Object.assign({text:'NOTAUSGANG',unter:'↑ Personaltür',b:1.2,h:0.38,x:-40,y:2.55,z:-7.03,ry:Math.PI},fw));
  bk.schild(scene,Object.assign({text:'FLUCHTWEG',unter:'← Kartonlager ③ · Laden',b:1.2,h:0.38,x:-36.12,y:3.55,z:-14.4,ry:-Math.PI/2},fw));
  bk.schild(scene,Object.assign({text:'FLUCHTWEG',unter:'→ Schleuse · Lager',b:1.2,h:0.38,x:-26.12,y:3.6,z:-21.6,ry:-Math.PI/2},fw));
  llHaengend(Object.assign({text:'NOTAUSGANG',unter:'↑ Personaltür',b:1.2,h:0.38,x:-48,y:3.2,z:-12.0,ry:-Math.PI/2},fw));
}
/* Aussen an der Strasse: Sprinkler-Tank, Mitarbeiter-Parkplatz, Pforte, Zaun */
/* Personaltuer (Notausgang) in der Nordwand x −40: Stahltuer mit Panikstange; seite 1 = innen (Halle), −1 = aussen */
function llTuer(seiten){
  const S=bk.sammler({form:{fase:0.008,faseMin:0.03,lod0Kasten:true},bauteil:'notausgang'}), F=MAT.farbe;
  for(const s of seiten){ const z=-7+s*-0.025+(s>0?0:LW+0.05);
    S.box(1.1,2.12,0.04,-40,1.06,z,F('anthrazit'),'lackMetall'); S.box(1.0,2.04,0.03,-40,1.04,z+s*-0.02,F('lichtgrau'),'lackMetall');
    if(s>0){ S.box(0.86,0.06,0.06,-40,1.05,z-0.07,F('silbergrau'),'stahl'); for(const x of [-0.4,0.4]) S.box(0.06,0.1,0.08,-40+x,1.05,z-0.05,F('anthrazit'),'lackMetall'); } }
  S.fertig(scene,{fest:true});
}
/* Portale der Halle: Durchgang Schleuse, N1 (wenn offen), Ladetore R2-R5 (wenn offen) */
const _llFr=new THREE.Frustum(), _llM=new THREE.Matrix4(), _llBox=new THREE.Box3(), _llA=new THREE.Vector3(), _llB=new THREE.Vector3();
function llSichtTakt(){
  if(!LL_H||!LL_G||!LL_G.visible) return;
  const c=camera.position, x=c.x, z=c.z; let v=x>-66&&x<-25.9&&z>-34.1&&z<-6.9&&!(x>-36&&z>-17);
  /* von aussen nur durch eine Oeffnung, und nur aus dem Raum davor: Schleuse/Lager (Durchgang), ③/Lager (N1), Hof (Tore) */
  if(!v){ camera.updateMatrixWorld(); _llM.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse); _llFr.setFromProjectionMatrix(_llM);
    const P=(x0,y0,z0,x1,y1,z1)=>_llFr.intersectsBox(_llBox.set(_llA.set(x0,y0,z0),_llB.set(x1,y1,z1)));
    const imLager=x>-26&&x<-8.1&&z>-30&&z<5.9, imDritten=x>-36&&x<-8.1&&z>-17.2&&z<5.9;
    v=(imLager&&P(-26.3,0,LL.durchgang[0],-25.7,3.0,LL.durchgang[1]))||(imDritten&&LL_T.n1t>0.04&&P(-36.3,0,LL.n1.z0,-35.7,LL.n1.h,LL.n1.z1));
    if(!v&&z<-34&&typeof WTORE!=='undefined') for(const T of WTORE) if(T&&T.t>0.04&&P(T.x-1.75,0,-34.3,T.x+1.75,3.1,-33.7)){ v=true; break; } }
  LL_H.visible=v; LL_D.visible=v;
  /* Aussenanlagen (Tank, Parkplatz, Pforte): nicht aus Halle, ③, Schleuse und dem Lager-Sueden (dort nur Waende dazwischen) */
  LL_A.visible=!((x>-66&&x<-8.1&&z>-34.1&&z<-6.0)||(x>-26&&x<-8.1&&z>-30&&z<-6));
}
function llAussen(){
  const F=MAT.farbe, T=LL.tank, P=LL.park, Pf=LL.pforte, seg=[16,28,40][bk.lod()];
  /* Flaeche: Beton von der Hallenwand bis zum Gehweg */
  MAT.kachel(flat(32,12.7,MAT.get('betonHof'),-50,0.012,-0.45).geometry,32/2.4,12.7/2.4);
  /* Tank */
  const S=bk.sammler({form:{fase:0.02,faseMin:0.06,lod0Kasten:true},bauteil:'sprinklertank'});
  S.zyl(T.r,T.r,T.h,seg,T.x,T.h/2+0.3,T.z,F('lichtgrau'),'lackMetall'); S.zyl(T.r+0.15,T.r+0.15,0.3,seg,T.x,0.15,T.z,F('hellgrau'),'matt');
  S.zyl(T.r*0.2,T.r+0.02,0.6,seg,T.x,T.h+0.6,T.z,F('lichtgrau'),'lackMetall');
  for(let i=1;i<6;i++) S.zyl(T.r+0.01,T.r+0.01,0.04,seg,T.x,0.3+i*T.h/6,T.z,F('basaltgrau'),'stahl');
  for(let y=0.6;y<T.h;y+=0.3) S.box(0.42,0.03,0.03,T.x+T.r+0.12,y,T.z+0.4,F('silbergrau'),'stahl');
  for(const dz of [0.2,0.6]) S.box(0.04,T.h,0.04,T.x+T.r+0.12,T.h/2+0.3,T.z+dz,F('silbergrau'),'stahl');
  S.zyl(0.12,0.12,3.0,10,T.x+1.6,0.25,T.z-T.r-0.4,F('feuerrot'),'lackMetall',Math.PI/2,0,0);
  S.box(2.4,2.4,2.0,T.x+1.6,1.2,T.z-T.r-1.8,F('lichtgrau'),'lackMetall'); S.box(2.5,0.12,2.1,T.x+1.6,2.46,T.z-T.r-1.8,F('anthrazit'),'lackMetall');
  S.fertig(scene,{fest:true});
  bk.schild(scene,{text:'SPRINKLERZENTRALE',unter:'Löschwasser 360 m³',b:1.5,h:0.42,x:T.x+1.6,y:2.0,z:T.z-T.r-2.82,ry:Math.PI,bg:MAT.css('feuerrot'),fg:MAT.css('weiss')});
  col(T.x-T.r,T.x+T.r,T.z-T.r,T.z+T.r); col(T.x+0.4,T.x+2.8,T.z-T.r-2.8,T.z-T.r-0.8);
  /* Parkplatz: 8 Stellplaetze an der Hallenwand */
  const L=[]; for(let i=0;i<=8;i++){ const x=P.x0+i*2.5; L.push([x,P.z0,x,P.z0+5,'weiss',0.1]); }
  L.push([P.x0,P.z0+5,P.x1,P.z0+5,'weiss',0.1]);
  bk.bodenmarkierung({linien:L,y:0.012,schatten:true});
  /* Pforte: kleiner Bau mit Fensterband und Vordach */
  const Wp=LW/2;
  bk.wand({x0:Pf.x0,x1:Pf.x1,z0:Pf.z0,z1:Pf.z0+LW,y0:0,y1:3,innen:'+z',flaechen:{innen:'putz',aussen:'fassade'}});
  bk.wand({x0:Pf.x0,x1:Pf.x1,z0:Pf.z1-LW,z1:Pf.z1,y0:0,y1:3,innen:'-z',flaechen:{innen:'putz',aussen:'fassade'}});
  bk.wand({x0:Pf.x0,x1:Pf.x0+LW,z0:Pf.z0,z1:Pf.z1,y0:0,y1:1.0,innen:'+x',flaechen:{innen:'putz',aussen:'fassade'}});
  bk.wand({x0:Pf.x0,x1:Pf.x0+LW,z0:Pf.z0,z1:Pf.z1,y0:2.3,y1:3,innen:'+x',flaechen:{innen:'putz',aussen:'fassade'}});
  bk.wand({x0:Pf.x1-LW,x1:Pf.x1,z0:Pf.z0,z1:Pf.z1,y0:0,y1:3,innen:'-x',flaechen:{innen:'putz',aussen:'fassade'}});
  const Sp=bk.sammler({form:{fase:0.01,faseMin:0.04,lod0Kasten:true},bauteil:'pforte'});
  Sp.box(Pf.x1-Pf.x0+0.6,0.22,Pf.z1-Pf.z0+0.6,(Pf.x0+Pf.x1)/2-0.2,3.11,(Pf.z0+Pf.z1)/2,F('anthrazit'),'lackMetall');
  Sp.box(0.06,1.3,Pf.z1-Pf.z0-2*LW,Pf.x0+Wp,1.65,(Pf.z0+Pf.z1)/2,F('glasKlar'),'glas');
  for(const z of [Pf.z0+1.4,Pf.z0+2.6,Pf.z0+3.8]) Sp.box(0.08,1.3,0.06,Pf.x0+Wp,1.65,z,F('aluminium'),'lackMetall');
  Sp.box(0.6,0.75,1.6,Pf.x0+0.55,0.75,(Pf.z0+Pf.z1)/2,F('lichtgrau'),'kunststoff');
  Sp.fertig(scene,{fest:true});
  bk.schild(scene,{text:'PFORTE',unter:'Werk · Logistik',b:1.3,h:0.4,x:(Pf.x0+Pf.x1)/2,y:2.75,z:Pf.z1+0.02,ry:0});
  col(Pf.x0,Pf.x1,Pf.z0,Pf.z1);
  llTuer([-1]);
  /* Zaun zur Strasse mit Einfahrt (x −42…−38) und Westseite um den Tank */
  bk.zaun({art:'doppelstab',von:[-66.2,5.9],bis:[Pf.x0,5.9],hoehe:2.0,luecke:[[66.2-42,66.2-38.2]]});
  bk.zaun({art:'doppelstab',von:[-66.2,-6.9],bis:[-66.2,5.9],hoehe:2.0});
  col(-66.2,-42,5.84,5.96); col(-66.3,-66.1,-6.9,5.9);
}

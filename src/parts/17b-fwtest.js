/* =========================================================
   FEUERWERK-TESTSTATION - NUR FUER DIE ENTWICKLUNG (Tom, 24.09.)
   Laptop > Laden > "Feuerwerk-Teststation": es wird Nacht, das
   Testfeld ist offen, von jedem zuendbaren Produkt steht ein Karton
   neben dem Zuendpult, nach Art sortiert. Aufheben, auf Tisch /
   Roehren / Moerser stellen, zuenden - ohne auf den Abend zu warten.

   VOR DER VEROEFFENTLICHUNG: FW_DEV auf false setzen (oder diese
   Datei samt Aufrufen entfernen). Tom sagt Bescheid, wann.
   ========================================================= */
const FW_DEV=true;
let fwTestAn=false, fwTestBoxen=[], fwTestMarken=[];
/* Welche Uhrzeit das Licht sieht: im Testmodus immer 22 Uhr */
function todUhr(){ return FW_DEV&&fwTestAn?Math.max(clock,1320):clock; }
/* Stufen nach Level (Tom, 28.09.: "welches Level was ist ... die hat
   man am Anfang, die in der Mitte, das sind die wirklich krassen
   Sachen" - damit die Steigerung beim Testen sichtbar wird) */
const FW_STUFEN=[
  {ab:1, name:'EINSTIEG',     sub:'hat man am Anfang',   farbe:'#3fbf5f'},
  {ab:6, name:'AUFSTEIGER',   sub:'erste größere Sachen', farbe:'#3a8dde'},
  {ab:12,name:'MITTELKLASSE', sub:'Mitte des Spiels',     farbe:'#f2c230'},
  {ab:17,name:'PROFI',        sub:'spätes Spiel',         farbe:'#f07a28'},
  {ab:22,name:'KÖNIGSKLASSE', sub:'die krassen Sachen',   farbe:'#e0303a'}];
function fwStufe(lvl){ let i=0; FW_STUFEN.forEach((s,k)=>{ if(lvl>=s.ab) i=k; }); return i; }
/* Reihenfolge = Spielverlauf: Level, bei gleichem Level Tisch, Rohre, Moerser */
function fwTestProdukte(){
  const reihe={tisch:0,rampe:1,moerser:2};
  return ORDER.filter(t=>{ const p=P[t]; return p&&p.cat&&!p.rezept&&!p.noOrder&&stationOf(t); })
    .sort((a,b)=>(P[a].lvl-P[b].lvl)||(reihe[stationOf(a)]-reihe[stationOf(b)]));
}
/* Aufkleber oben auf dem Karton: Level in der Farbe der Stufe */
const _fwAufkleber={};
function fwAufkleber(lvl){
  if(!_fwAufkleber[lvl]) _fwAufkleber[lvl]=new THREE.MeshBasicMaterial({color:0xdddddd,map:tex(256,150,(c,W,H)=>{
    c.fillStyle=FW_STUFEN[fwStufe(lvl)].farbe; c.fillRect(0,0,W,H);
    c.strokeStyle='#0e1226'; c.lineWidth=8; c.strokeRect(4,4,W-8,H-8);
    c.fillStyle='#0e1226'; c.textAlign='center'; c.textBaseline='middle';
    c.font=BUN(96); c.fillText('L'+lvl,W/2,H/2+6); })});
  return _fwAufkleber[lvl];
}
const _fwAufGeo=new THREE.PlaneGeometry(0.34,0.2);
/* Bodenstreifen vor jeder Stufe: Name, Level-Spanne, wofuer */
function fwMarke(i,bis,z){
  const s=FW_STUFEN[i], B=3.9, T=0.5;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(B,T),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,color:0xdddddd,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,map:tex(2048,262,(c,W,H)=>{
      c.fillStyle='rgba(14,18,38,.82)'; c.fillRect(0,0,W,H);
      c.fillStyle=s.farbe; c.fillRect(0,0,W,18); c.fillRect(0,H-18,W,18);
      c.textBaseline='middle'; c.textAlign='left'; c.fillStyle=s.farbe; c.font=BUN(112); c.fillText(s.name,40,H/2+8);
      const lv=`Level ${s.ab}${bis>s.ab?'–'+bis:''}`, x1=40+c.measureText(s.name).width+50;
      c.fillStyle='#f2f5ff'; c.font=BAR(100); c.fillText(lv,x1,H/2+6);
      const x2=x1+c.measureText(lv).width+50;
      c.textAlign='right'; c.fillStyle='rgba(242,245,255,.75)'; fitFont(c,s.sub,W-40-x2,76,BAR);
      c.fillText(s.sub,W-40,H/2+6); })}));
  m.rotation.x=-Math.PI/2; m.position.set(-3.35,0.022,z); scene.add(m); fwTestMarken.push(m);
  /* dazu ein Stehschild an der Wandseite: der Bodenstreifen verschwindet
     von vorn hinter den Kartonreihen */
  const sm=new THREE.MeshBasicMaterial({color:0xdddddd,map:tex(512,256,(c,W,H)=>{
    c.fillStyle='#0e1226'; c.fillRect(0,0,W,H); c.fillStyle=s.farbe; c.fillRect(0,0,W,22); c.fillRect(0,H-22,W,22);
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=s.farbe; fitFont(c,s.name,W-130/* Pfosten verdecken die Raender */,84,BUN); c.fillText(s.name,W/2,96);
    c.fillStyle='#f2f5ff'; c.font=BAR(64); c.fillText(`Level ${s.ab}${bis>s.ab?'–'+bis:''}`,W/2,178); })});
  const g=schild(-5.75,1.25,z-0.1,0.9,0.45,sm,std(0x5a616c,{metalness:0.6,roughness:0.45})); g.userData.fwSchild=sm; fwTestMarken.push(g);
}
function fwMarkenWeg(){ fwTestMarken.forEach(m=>{ scene.remove(m);
  if(m.userData.fwSchild){ m.userData.fwSchild.map.dispose(); m.userData.fwSchild.dispose(); return; }
  m.geometry.dispose(); m.material.map.dispose(); m.material.dispose(); }); fwTestMarken=[]; }
/* Kartons links vom Zuendpult, fuenf Spalten, je zwei uebereinander.
   Vorne links faengt Level 1 an, gelesen wird wie ein Buch (Reihe fuer
   Reihe nach hinten), oben liegt der fruehere Karton. Jede Stufe
   beginnt mit einem eigenen Bodenstreifen. */
function fwTestStapeln(){
  fwTestBoxen.forEach(b=>removeFloorBox(b)); fwTestBoxen=[]; fwMarkenWeg();
  /* rechts neben dem Flutlichtmast (-5,6 | -13,0) */
  const L=fwTestProdukte(), SP=5, DX=0.8, DZ=0.62, STUFE=1.05;
  const gruppen=[]; L.forEach(t=>{ const i=fwStufe(P[t].lvl); let g=gruppen[gruppen.length-1]; if(!g||g.i!==i){ g={i,t:[]}; gruppen.push(g); } g.t.push(t); });
  let z0=-12.9;
  gruppen.forEach(g=>{
    const bis=Math.max(...g.t.map(t=>P[t].lvl));
    fwMarke(g.i,bis,z0+0.525);
    let zl=z0;
    g.t.forEach((t,k)=>{ const platz=Math.floor(k/2), lage=k%2?0:1; /* oben der fruehere */
      const x=-4.95+(platz%SP)*DX, z=z0-Math.floor(platz/SP)*DZ; zl=z;
      const b=spawnFloorBox(t,P[t].box,{x,y:0.2+lage*0.41,z,ry:0},1); b.test=true; b.lvl=P[t].lvl;
      const a=new THREE.Mesh(_fwAufGeo,fwAufkleber(P[t].lvl)); a.rotation.x=-Math.PI/2; a.position.y=0.202; b.mesh.add(a);
      fwTestBoxen.push(b); });
    z0=zl-STUFE;
  });
  return L.length;
}
function fwTestSchalten(){
  if(!FW_DEV) return;
  if(fwTestAn){
    fwTestAn=false; fwTestBoxen.forEach(b=>removeFloorBox(b)); fwTestBoxen=[]; fwMarkenWeg();
    lastF=-1; applyTOD(); toast('Feuerwerk-Teststation aus.'); return;
  }
  if(!S.up.testfeld){ S.up.shop_halb=true; S.up.testfeld=true; if(typeof applyZonen==='function') applyZonen(); }
  fwTestAn=true; lastF=-1; applyTOD();
  const n=fwTestStapeln();
  /* direkt vor die Kartons stellen, Blick zu den Stationen */
  pl.x=-3.0; pl.z=-11.8; yaw=Math.atan2(4,6); pitch=-0.18;
  if(laptopOpen) closeLaptop(true); if(typeof handyOpen!=='undefined'&&handyOpen) closeHandy();
  toast(`Teststation: Nacht, ${n} Kartons nach Level sortiert – vorne links Level 1, hinten die Königsklasse.`,'money');
}

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
let fwTestAn=false, fwTestBoxen=[];
/* Welche Uhrzeit das Licht sieht: im Testmodus immer 22 Uhr */
function todUhr(){ return FW_DEV&&fwTestAn?Math.max(clock,1320):clock; }
function fwTestProdukte(){
  const reihe={moerser:0,rampe:1,tisch:2};
  return ORDER.filter(t=>{ const p=P[t]; return p&&p.cat&&!p.rezept&&!p.noOrder&&stationOf(t); })
    .sort((a,b)=>(reihe[stationOf(a)]-reihe[stationOf(b)])||(P[a].lvl-P[b].lvl));
}
/* Kartons in Reihen links vom Zuendpult, je zwei uebereinander */
function fwTestStapeln(){
  fwTestBoxen.forEach(b=>removeFloorBox(b)); fwTestBoxen=[];
  /* rechts neben dem Flutlichtmast (-5,6 | -13,0), fuenf Spalten */
  const L=fwTestProdukte(), SP=5, DX=0.8, DZ=0.78;
  L.forEach((t,i)=>{ const platz=Math.floor(i/2), lage=i%2;
    const x=-4.95+(platz%SP)*DX, z=-12.6-Math.floor(platz/SP)*DZ;
    const b=spawnFloorBox(t,P[t].box,{x,y:0.2+lage*0.41,z,ry:0},1); b.test=true; fwTestBoxen.push(b); });
  return L.length;
}
function fwTestSchalten(){
  if(!FW_DEV) return;
  if(fwTestAn){
    fwTestAn=false; fwTestBoxen.forEach(b=>removeFloorBox(b)); fwTestBoxen=[];
    lastF=-1; applyTOD(); toast('Feuerwerk-Teststation aus.'); return;
  }
  if(!S.up.testfeld){ S.up.shop_halb=true; S.up.testfeld=true; if(typeof applyZonen==='function') applyZonen(); }
  fwTestAn=true; lastF=-1; applyTOD();
  const n=fwTestStapeln();
  /* direkt vor die Kartons stellen, Blick zu den Stationen */
  pl.x=-3.0; pl.z=-11.8; yaw=Math.atan2(4,6); pitch=-0.18;
  if(laptopOpen) closeLaptop(true); if(typeof handyOpen!=='undefined'&&handyOpen) closeHandy();
  toast(`Teststation: Nacht, ${n} Kartons neben dem Zündpult.`,'money');
}

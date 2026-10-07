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
let fwTestAn=false, fwTestBoxen=[], fwTestMarken=[], vfAn=false, vfGezuendet=0;
/* Welche Uhrzeit das Licht sieht: im Testmodus immer 22 Uhr */
function todUhr(){ return FW_DEV&&(fwTestAn||vfAn)?Math.max(clock,1320):clock; }
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

/* =========================================================
   FEUERWERK-VORFUEHRUNG - NUR FUER DIE ENTWICKLUNG (Tom, 29.09.)
   "alle Feuerwerke aufgelistet, Level und Name ... ich druecke eine
   Taste, dann kommt das naechste Feuerwerk ... einzeln, nicht
   automatisch ... der Name muss klar sichtbar sein" - in 15 Minuten
   einmal durch das ganze Sortiment, ohne Kartons zu schleppen.
   Gezuendet wird auf einer eigenen grossen Anlage (Tisch, zwoelf Rohre,
   zwoelf Moerser) mit denselben Abschussorten wie im Spiel.
   Tasten: Leertaste/Enter zuenden (dann das naechste), Pfeil rechts
   ueberspringen, Pfeil links zurueck, R nochmal, X stoppt alles, was
   gerade brennt, 1 gut, 2 aendern, 3 raus,
   L Liste, B beenden (Esc nur ohne gefangenen Mauszeiger). Der Stand (Nummer, Notizen) bleibt gemerkt.
   ========================================================= */
let vfIdx=0, vfListe=[], vfEl=null, vfLetzt=null, vfNoten={}, vfListeAuf=false;
const VF_KEY='bb_vorfuehrung', VF_ART={tisch:'Tisch',rampe:'Rohre',moerser:'Mörser'};
function vfLaden(){ try{ const d=JSON.parse(localStorage.getItem(VF_KEY)||'{}'); vfIdx=d.i|0; vfNoten=d.n||{}; }catch(e){ vfIdx=0; vfNoten={}; } vfDbLaden(); }
/* 04.10. (Tom: "wenn ich die Sachen als gut markiere, siehst du das dann?
   ... die guten nimmst du als Referenz, die schlechten kommen raus"):
   jede Bewertung (gut / aendern / raus) geht zusaetzlich in die Datenbank
   des Artefakts (Sammlung "bewertungen", ein Dokument je Produkt) - dort
   liest Claude sie aus. Ohne Datenbank (lokal, Test) bleibt es beim
   Speicher des Geraets. */
let _vfDbP=null;
function vfDb(){ if(!_vfDbP) _vfDbP=(typeof window!=='undefined'&&window.claude&&window.claude.use?window.claude.use('db'):Promise.resolve(null)).catch(()=>null); return _vfDbP; }
function vfDbLaden(){ vfDb().then(db=>{ if(!db) return; return db.collection('bewertungen').get().then(q=>{ let neu=0;
  q.docs.forEach(d=>{ const x=d.data(); if(x&&P[d.id]&&['gut','aendern','raus'].includes(x.note)&&vfNoten[d.id]!==x.note){ vfNoten[d.id]=x.note; neu++; } });
  if(neu){ try{ localStorage.setItem(VF_KEY,JSON.stringify({i:vfIdx,n:vfNoten})); }catch(e){} if(vfAn) vfZeigen(); } }); }).catch(()=>{}); }
function vfDbSchreiben(t){ const w=vfNoten[t]; vfDb().then(db=>{ if(!db) return; const ref=db.doc('bewertungen/'+t);
  return w?ref.set({note:w,name:P[t].name,lvl:P[t].lvl,art:P[t].shape||'',zeit:new Date().toISOString()}):ref.delete(); }).catch(()=>{}); }
/* vfSonder: eine Testsektion (nur die neuen Batterien oder Kugeln) - ihr
   Platz in der Liste ersetzt nicht den der ganzen Vorfuehrung */
let vfSonder=null;
function vfMerken(){ try{ let i=vfIdx; if(vfSonder){ const d=JSON.parse(localStorage.getItem(VF_KEY)||'{}'); i=d.i|0; }
  localStorage.setItem(VF_KEY,JSON.stringify({i,n:vfNoten})); }catch(e){} }
function vorfuehrungSchalten(){ if(!FW_DEV) return; if(vfAn) vorfuehrungAus(); else vorfuehrungAn(); }
function vorfuehrungAn(nur){
  if(fwTestAn) fwTestSchalten();
  if(!S.up.testfeld){ S.up.shop_halb=true; S.up.testfeld=true; if(typeof applyZonen==='function') applyZonen(); }
  vfSonder=Array.isArray(nur)?nur.filter(t=>P[t]&&stationOf(t)):null;
  vfListe=vfSonder||fwTestProdukte(); vfLaden(); if(vfSonder) vfIdx=0; vfIdx=clamp(vfIdx,0,Math.max(0,vfListe.length-1)); vfLetzt=null;
  vfAn=true; lastF=-1; applyTOD(); clearStations(); vfAnlageBauen(); vfBelegt={};
  for(const sid of ['tisch','rampe','moerser']) if(stations[sid]&&stations[sid].g) stations[sid].g.visible=false;
  /* Uhr, Geld, Tutorial und Zielpfeil stoeren beim Zusehen - weg damit */
  if(!document.getElementById('vfStil')){ const st=document.createElement('style'); st.id='vfStil';
    st.textContent='body.vorf #hud .tl,body.vorf #tip,body.vorf #zielPfeil,body.vorf #staff,body.vorf #cross{display:none!important}'; document.head.appendChild(st); }
  document.body.classList.add('vorf');
  /* hinter das Zuendpult, Blick ueber die Stationen in den Himmel */
  const m={x:0.3,z:VF_Z}; let px=m.x, pz=m.z+14;
  if(typeof pultHit!=='undefined'&&pultHit&&pultHit.parent){ const w=new THREE.Vector3(); pultHit.parent.getWorldPosition(w);
    const dx=w.x-m.x, dz=w.z-m.z, l=Math.hypot(dx,dz)||1; px=w.x+dx/l*1.6; pz=w.z+dz/l*1.6; }
  pl.x=px; pl.z=pz; yaw=Math.atan2(-(m.x-px),-(m.z-pz)); pitch=0.62;
  if(laptopOpen) closeLaptop(true); if(typeof handyOpen!=='undefined'&&handyOpen) closeHandy();
  vfZeigen();
}
function vorfuehrungAus(){
  vfAn=false; vfListeAuf=false; vfMerken(); lastF=-1; applyTOD();
  if(vfEl){ vfEl.remove(); vfEl=null; }
  if(vfAnlage) vfAnlage.visible=false;
  for(const sid of ['tisch','rampe','moerser']) if(stations[sid]&&stations[sid].g) stations[sid].g.visible=true;
  document.body.classList.remove('vorf');
  toast('Vorführung beendet. Nummer und Notizen sind gemerkt.');
}
/* Grosse Vorfuehranlage (Tom, 29.09.: "riesiger Zuendtisch, riesige
   Abschussrohre, ganz viele Abschussrohre und ganz viele fuer
   Kugelbomben"): eine eigene Reihe hinten im Testfeld, 15 m vor dem
   Pult - ein langer Tisch mit zehn Plaetzen, ein Gestell mit zwoelf
   Rohren, eine Moerserbatterie mit vier Rohren je Kaliber. Jede Zuendung
   nimmt den naechsten freien Platz, nichts kommt sich in die Quere. */
/* 30.09. (Tom: "alle Test-Vorfuehrungen in die Mitte des Testfelds, dass
   man alles gut sehen kann - aktuell hinten links"): die Reihe steht in der
   Mitte (Testfeld z -28..-6), die normalen Stationen sind solange ausgeblendet */
const VF_Z=-18.0, VF_TISCH={x0:-7.0,n:10,dx:0.52,y:0.93}, VF_ROHR={x0:-1.4,n:12,dx:0.3,y:1.38}, VF_MOERSER={x0:2.9,n:4,dx:0.42,gdx:1.7,hoch:[0.62,0.82,1.02]};
let vfAnlage=null, vfBelegt={};
function vfAnlageBauen(){
  if(vfAnlage){ vfAnlage.visible=true; return; }
  const g=new THREE.Group(), stahl=std(0x8a929e,{metalness:0.6,roughness:0.4}), holz=std(0xa8844f,{roughness:0.8}), rohrM=std(0x6f7782,{metalness:0.5,roughness:0.5}), gruen=std(0x4f8a5c,{roughness:0.7});
  const box=(w,h,d,m,x,y,z)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); b.position.set(x,y,z); b.castShadow=b.receiveShadow=true; g.add(b); return b; };
  const T=VF_TISCH, tw=T.n*T.dx+0.2, tx=T.x0+(T.n-1)*T.dx/2;
  box(tw,0.06,0.9,holz,tx,T.y-0.03,VF_Z);
  for(const sx of [-1,1]) for(const sz of [-1,1]) box(0.08,T.y-0.06,0.08,stahl,tx+sx*(tw/2-0.1),(T.y-0.06)/2,VF_Z+sz*0.35);
  const R=VF_ROHR, rw=(R.n-1)*R.dx+0.4, rx=R.x0+(R.n-1)*R.dx/2;
  /* Raketen: Abschussrohre (0,62 m) auf Fussplatten auf einem Tisch, wie an der Station */
  box(rw,0.04,0.5,stahl,rx,0.74,VF_Z);
  for(const sx of [-1,1]) for(const sz of [-1,1]) box(0.06,0.72,0.06,stahl,rx+sx*(rw/2-0.08),0.36,VF_Z+sz*0.2);
  for(let i=0;i<R.n;i++){ const c=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.62,14,1,true),rohrM); c.position.set(R.x0+i*R.dx,R.y-0.31,VF_Z); g.add(c);
    box(0.16,0.02,0.16,stahl,R.x0+i*R.dx,0.77,VF_Z); }
  const M=VF_MOERSER;
  for(let k=0;k<3;k++){ const gx=M.x0+k*M.gdx, h=M.hoch[k], r=ROHR_INNEN[k]+0.012;
    box(M.n*M.dx+0.1,0.12,0.6,gruen,gx+(M.n-1)*M.dx/2,0.06,VF_Z);
    for(let i=0;i<M.n;i++){ const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18,1,true),rohrM); c.position.set(gx+i*M.dx,h/2,VF_Z); g.add(c); } }
  scene.add(g); vfAnlage=g;
}
/* naechster freier Platz der Art (Tisch, Rohr, Moerser je Kaliber) */
function vfPlatz(art,n){ const jetzt=FW_UHR; let best=0, bz=Infinity;
  for(let i=0;i<n;i++){ const z=vfBelegt[art+i]||0; if(z<=jetzt) return i; if(z<bz){ bz=z; best=i; } }
  return best; }
function vfMuendung(t){
  const sid=stationOf(t), p=P[t], d=p.dims||[0.2,0.2,0.2];
  if(sid==='tisch'){ const i=vfPlatz('t',VF_TISCH.n), hx=d[0]/2, hz=d[2]/2;
    return {art:'t'+i,sid,x:VF_TISCH.x0+i*VF_TISCH.dx,y:VF_TISCH.y+d[1],z:VF_Z,ab:0.08,jit:Math.min(0.06,hx*0.5,hz*0.5),hx,hz,boden:VF_TISCH.y,ry:Math.PI}; }
  if(sid==='moerser'){ const k=moerserRohr(t)%3, i=vfPlatz('m'+k,VF_MOERSER.n);
    return {art:'m'+k+i,sid,x:VF_MOERSER.x0+k*VF_MOERSER.gdx+i*VF_MOERSER.dx,y:VF_MOERSER.hoch[k],z:VF_Z,ab:0.05,jit:0.02,hx:ROHR_INNEN[k]*0.8,hz:ROHR_INNEN[k]*0.8}; }
  const i=vfPlatz('r',VF_ROHR.n), kerze=p.shape==='candle';
  return {art:'r'+i,sid,x:VF_ROHR.x0+i*VF_ROHR.dx,y:kerze?VF_ROHR.y+0.25:VF_ROHR.y,z:VF_Z,ab:kerze?0.02:0.05,jit:kerze?0.005:0.02,hx:kerze?0.05:0.045,hz:kerze?0.05:0.045};
}
/* ein Produkt auf seinen Platz der Anlage und sofort zuenden - wie auf
   der Station: Zuendschnur bei Rohr und Moerser, dann igniteType am
   Abschussort (Effekt und Klang wie im Spiel) */
function vfZuenden(t){ FW_KTX++; try{ return vfZuendenRoh(t); } finally { FW_KTX--; } }
/* was nach dem Abbrennen vom Tisch muss (Batterie, Kleinfeuerwerk) */
let vfAufraeumen=[];
/* 03.10. (Tom): "wenn das Feuerwerk laeuft, eine Taste druecken, dann
   beendet das Feuerwerk sofort" - sonst stoert das alte das naechste.
   Taste X: alle geplanten Schuesse und Brueche, Sterne, Raketen, Boden-
   Emitter, Rauch, Lichtblitze und der Ton sind auf der Stelle weg; die
   Produkte verschwinden vom Tisch. Testfeld und Nacht bleiben. */
function vfStopp(){
  let n=0;
  for(let i=timers.length-1;i>=0;i--) if(timers[i].fw){ timers.splice(i,1); n++; }
  if(typeof FAECHER!=='undefined') FAECHER.clear();
  for(const ps of [psHuge,psBig,psMid,psSmall]) if(ps) for(let i=0;i<ps.max;i++) if(ps.life[i]>0){ ps.life[i]=1e-4; n++; }
  /* Kleinfeuerwerk-Emitter haben eigene Gegenstaende (Frosch, Spielzeug,
     Kerzen): mit wegraeumen, sonst lagen sie noch eine Minute herum */
  if(typeof klWeg==='function') for(const e of emitters) if(e.meshes||e.toene) try{ klWeg(e); }catch(x){}
  /* Hilfsdienst, Funkenstriche und fliegendes Papier zuruecksetzen: der
     Dienst-Emitter ist mit weg, DIENST.e zeigte aber noch auf ihn - danach
     lief er nie wieder an und alle Wunderkerzen-Funken standen still */
  if(typeof DIENST!=='undefined') DIENST.e=null;
  if(typeof KL_FK!=='undefined'&&KL_FK.mesh){ KL_FK.n=0; KL_FK.mesh.geometry.setDrawRange(0,0); KL_FK.mesh.visible=false; }
  if(typeof KL_PAP!=='undefined'){ KL_PAP.liste.length=0; KL_PAP.e=null; if(KL_PAP.mesh){ KL_PAP.mesh.count=0; KL_PAP.mesh.visible=false; } }
  /* liegengebliebenes Konfetti, Fetzen, Brandflecken (bodenrest) ebenfalls weg */
  if(typeof REST!=='undefined'&&REST.mesh){ REST.dauer.fill(0); REST.n=0; REST.next=0; REST.mesh.count=0; REST.mesh.visible=false; }
  n+=rockets.length+emitters.length; rockets.length=0; emitters.length=0;
  if(typeof WOLKEN!=='undefined') for(const w of WOLKEN) w.t=w.dauer;
  for(const f of FLASH){ f.t=0; f.max=0; if(f.l) f.l.intensity=0; }
  for(const fn of vfAufraeumen.splice(0)) try{ fn(); }catch(e){}
  vfBelegt={};
  if(typeof sfxSchnitt==='function') sfxSchnitt();
  vfZeigen();
  return n;
}
function vfZuendenRoh(t){
  if(!t||!P[t]) return false;
  /* 06.10. (Toms PDF: Raketen und Kugeln sichtbar im Rohr): die Zuendschnur
     brennt etwas laenger als an der Station, damit man das Modell sieht (14u) */
  const o=vfMuendung(t), dauer=brennDauer(t), vor=o.sid==='moerser'?1.2:o.sid==='rampe'?(P[t].shape==='rocketset'?0.9:0.4):0;
  vfBelegt[o.art]=FW_UHR+vor+dauer+0.5;
  let h=null, bt=null, pg=null;
  if(o.sid==='tisch'&&istBatterie(t)){ bt=batterieModell(t,Math.PI); bt.g.position.set(o.x,o.boden,o.z); bt.g.rotation.y=Math.PI; scene.add(bt.g); o.batt=bt; }
  /* Wunderkerzen: Mini-Podest statt Verpackung (03.10., Tom; 14q) */
  else if(o.sid==='tisch'&&typeof kqPodestAuf==='function'&&(pg=kqPodestAuf(t,{x:o.x,y:o.boden,z:o.z}))) scene.add(pg);
  /* Kleinfeuerwerk ausgepackt statt Ladenverpackung (07.10., Tom; 14x) */
  else if(o.sid==='tisch'&&typeof kfTischAuf==='function'&&(pg=kfTischAuf(t,{x:o.x,y:o.boden,z:o.z}))) scene.add(pg);
  else if(o.sid==='tisch'&&stationsPool(t)&&!stationsPool(t).full()) h=stationsPool(t).add(mx(o.x,o.boden,o.z,Math.PI));
  if(typeof vfImRohr==='function') vfImRohr(t,o);
  if(vor){ emitters.push({t:vor,k:'fuse',o:{x:o.x,y:o.y,z:o.z}}); sfx.fizz(distVol(o)*0.5); }
  later(vor,()=>{ if(vfAn) igniteType(t,o); });
  /* der Blick folgt dem Produkt: zur Seite auf seinen Platz, nach oben so
     weit, wie es steigt - Kleinfeuerwerk flach, Batterien halb, Raketen
     und Kugeln steil */
  /* 03.10. (Tom: alle Brueche viel hoeher): Batterien 0,8 statt 0,55 -
     oberer Bildrand bei ~70 m statt 25 m, Brueche (27-35 m) im oberen
     Drittel statt am Rand (gemessen, Spieler 11 m vor dem Tisch); Rampe 0,85 statt 0,72 (Raketen bis ~75 m im Bild statt 35 m); Moerser 0,95 statt 0,85, sonst schneidet der Rand die 300er
     (Bruch ~90 m) mittendurch */
  /* 06.10.: Finale Grande schiesst ihre Kugeln auf Kugelhoehe (14u) - Blick wie am Moerser */
  { const sh=P[t].shape; pitch=t==='kugelfinale'?1.0:o.sid==='tisch'?(SHOWS[t]||sh==='battery'||sh==='fan'?0.8:sh==='fountain'||sh==='cylinder'||sh==='fountainset'?0.35:0.1):o.sid==='rampe'?0.85:0.95;
    yaw=Math.atan2(-(o.x-pl.x),-(o.z-pl.z)); }
  if(h){ let weg=false; const fn=()=>{ if(weg) return; weg=true; if(h.pool) h.pool.remove(h); }; vfAufraeumen.push(fn); later(vor+dauer,fn); }
  if(bt){ let weg=false; const fn=()=>{ if(weg) return; weg=true; bt.weg(); }; vfAufraeumen.push(fn); later(vor+dauer,fn); }
  if(pg){ let weg=false; const fn=()=>{ if(weg) return; weg=true; if(pg.parent) pg.parent.remove(pg); }; vfAufraeumen.push(fn); later(vor+dauer,fn); }
  if(vfAufraeumen.length>40) vfAufraeumen.splice(0,vfAufraeumen.length-40);
  vfLetzt=t; return true;
}
function vfNaechstes(){ if(!vfListe.length) return; vfZuenden(vfListe[vfIdx]); vfIdx=Math.min(vfListe.length,vfIdx+1); vfMerken(); vfZeigen(); }
function vfSpringen(d){ vfIdx=clamp(vfIdx+d,0,vfListe.length); vfMerken(); vfZeigen(); }
function vfNote(w){ const t=vfLetzt||vfListe[vfIdx]; if(!t) return; vfNoten[t]=vfNoten[t]===w?undefined:w; if(!vfNoten[t]) delete vfNoten[t]; vfMerken(); vfDbSchreiben(t); vfZeigen(); }
function vfText(){
  return vfListe.map((t,i)=>`${String(i+1).padStart(3)}  L${String(P[t].lvl).padStart(2)}  ${P[t].short.padEnd(22)} ${vfNoten[t]==='gut'?'gut':vfNoten[t]==='aendern'?'ÄNDERN':vfNoten[t]==='raus'?'RAUS':''}`).join('\n');
}
/* Tasten - true: verbraucht */
function vfTaste(e){
  if(!vfAn||e.repeat) return vfAn&&['Space','Enter','ArrowLeft','ArrowRight'].includes(e.code);
  const c=e.code;
  if(c==='Space'||c==='Enter'){ e.preventDefault(); vfNaechstes(); return true; }
  if(c==='ArrowRight'){ e.preventDefault(); vfSpringen(1); return true; }
  if(c==='ArrowLeft'){ e.preventDefault(); vfSpringen(-1); return true; }
  if(c==='KeyR'){ if(vfLetzt) vfZuenden(vfLetzt); vfZeigen(); return true; }
  if(c==='KeyX'||c==='Backspace'){ e.preventDefault(); vfStopp(); toast('Feuerwerk gestoppt.'); return true; }
  if(c==='Digit1'||c==='Numpad1'){ vfNote('gut'); return true; }
  if(c==='Digit2'||c==='Numpad2'){ vfNote('aendern'); return true; }
  if(c==='Digit3'||c==='Numpad3'){ vfNote('raus'); return true; }
  if(c==='KeyL'){ vfListeAuf=!vfListeAuf; vfZeigen(); return true; }
  /* Beenden mit B - Esc faengt bei gefangenem Mauszeiger der Browser ab (dann Pause) */
  if(c==='KeyB'||(c==='Escape'&&!locked)){ vorfuehrungAus(); return true; }
  return false;
}
const vfEsc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
function vfZeile(t,klein){
  const p=P[t], s=FW_STUFEN[fwStufe(p.lvl)], n=vfNoten[t];
  return `<span style="background:${s.farbe};color:#0e1226;border-radius:6px;padding:1px 8px;font:${BUN(klein?13:18)}">L${p.lvl}</span> `+
    `<span style="color:${s.farbe};font:${BAR(klein?14:18)};letter-spacing:.06em">${s.name}</span> · <span style="opacity:.8">${VF_ART[stationOf(t)]||''}</span>`+
    (n?` <b style="color:${n==='gut'?'#5fe07a':n==='raus'?'#ff3a3a':'#ffb03a'}">${n==='gut'?'✓ gut':n==='raus'?'✗ raus':'✎ ändern'}</b>`:'');
}
function vfZeigen(){
  if(!vfAn) return;
  if(!vfEl){ vfEl=document.createElement('div'); vfEl.id='vorfuehrung';
    vfEl.style.cssText='position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:60;width:min(760px,94vw);background:rgba(10,13,28,.86);color:#f2f5ff;border:2px solid #f2c230;border-radius:14px;padding:12px 18px 10px;font:600 16px "Barlow Condensed",sans-serif;pointer-events:auto;box-shadow:0 8px 30px rgba(0,0,0,.5)';
    vfEl.addEventListener('click',e=>{ const b=e.target.closest('[data-vf]'); if(!b) return; const a=b.dataset.vf;
      if(a==='zuenden') vfNaechstes(); else if(a==='vor') vfSpringen(1); else if(a==='zurueck') vfSpringen(-1);
      else if(a==='nochmal'){ if(vfLetzt) vfZuenden(vfLetzt); vfZeigen(); }
      else if(a==='gut') vfNote('gut'); else if(a==='aendern') vfNote('aendern'); else if(a==='raus') vfNote('raus');
      else if(a==='liste'){ vfListeAuf=!vfListeAuf; vfZeigen(); }
      else if(a==='kopieren'){ try{ navigator.clipboard.writeText(vfText()); toast('Liste mit Notizen kopiert.'); }catch(err){} }
      else if(a==='stopp'){ vfStopp(); toast('Feuerwerk gestoppt.'); }
      else if(a==='ende') vorfuehrungAus();
      else if(a.startsWith('i')){ vfIdx=+a.slice(1); vfMerken(); vfZeigen(); } });
    document.body.appendChild(vfEl); }
  const N=vfListe.length, akt=vfLetzt, naechst=vfListe[vfIdx];
  const btn=(a,txt,f)=>`<button data-vf="${a}" style="font:700 15px 'Barlow Condensed',sans-serif;padding:5px 10px;margin:2px;border-radius:8px;border:1px solid #f2c230;background:${f||'#1b2140'};color:#f2f5ff;cursor:pointer">${txt}</button>`;
  let h=`<div style="display:flex;justify-content:space-between;align-items:center;font:${BAR(15)};opacity:.85"><span>FEUERWERK-VORFÜHRUNG</span><span>${Math.min(vfIdx,N)} / ${N} gezündet</span></div>`;
  if(akt){ const p=P[akt];
    h+=`<div style="margin-top:4px;font:${BAR(14)};color:#f2c230">BRENNT JETZT</div>`+
      `<div style="font:${BUN(40)};line-height:1.05;margin:2px 0;word-break:break-word">${vfEsc(p.short)}</div>`+
      `<div style="font:${BAR(17)};opacity:.85">${vfEsc(p.name)}</div><div style="margin:4px 0 2px">${vfZeile(akt)}</div>`; }
  else h+=`<div style="margin:6px 0;font:${BAR(20)}">Leertaste zündet das erste Feuerwerk.</div>`;
  h+=`<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(242,197,48,.35);font:${BAR(17)}">`+
    (naechst?`ALS NÄCHSTES (${vfIdx+1}): <b>${vfEsc(P[naechst].short)}</b> &nbsp;${vfZeile(naechst,true)}`:'<b>Ende der Liste.</b> Mit Pfeil links zurück.')+`</div>`;
  h+=`<div style="margin-top:6px">${btn('zuenden','␣ Zünden','#8a2a16')}${btn('zurueck','← Zurück')}${btn('vor','→ Weiter')}${btn('nochmal','R Nochmal')}${btn('stopp','X Stopp','#5a1020')}${btn('gut','1 Gut')}${btn('aendern','2 Ändern')}${btn('raus','3 Raus','#5a1020')}${btn('liste','L Liste')}${btn('ende','B Beenden')}</div>`;
  if(vfListeAuf){
    h+=`<div style="margin-top:6px;max-height:30vh;overflow:auto;border-top:1px solid rgba(242,197,48,.35)">`+
      vfListe.map((t,i)=>`<div data-vf="i${i}" style="cursor:pointer;padding:2px 4px;${i===vfIdx?'background:rgba(242,197,48,.22);':''}${t===akt?'outline:1px solid #f2c230;':''}">`+
        `<span style="opacity:.6;display:inline-block;width:34px">${i+1}</span><b>${vfEsc(P[t].short)}</b> ${vfZeile(t,true)}</div>`).join('')+`</div>`+
      `<div style="margin-top:4px">${btn('kopieren','Liste mit Notizen kopieren')}</div>`;
  }
  vfEl.innerHTML=h;
}

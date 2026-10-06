/* =========================================================
   Offener Karton in der Hand (Tom, 06.10.: "Wenn man die Produkte
   einraeumt, soll sich das Paket zuvor oeffnen und die Artikel werden
   dann im Paket weniger und gehen Stueck fuer Stueck ins Regal/den
   Verkaufstisch etc. - wie beim Supermarket Simulator.")
   Der Karton haengt unten mittig vor einem. Erst ist er zu; C (am
   Handy der Knopf "Öffnen") oder die erste Aktion am Fach klappt ihn
   auf. Drin stehen dieselben Packungen wie im Regal - so viele, wie
   noch im Karton sind. Jedes Einraeumen nimmt die oberste vordere
   Packung heraus, sie fliegt an ihren Platz im Fach; erst wenn sie
   ankommt, sieht man sie dort. R nimmt eine Packung wieder heraus
   (gleiche Ware, Karton nicht voll). Leer wird der Karton in der Hand
   zusammengefaltet und ist weg - wie bisher.
   Sparsam: im Karton sind nur die Packungen gezeichnet, die man von
   oben sieht (hoechstens eine Lage), als eine Instanz-Gruppe je Teil
   der Packung - dieselben Geometrien und Materialien wie im Regal.
   ========================================================= */
const KH={g:null,k:null,inh:null,ims:[],typ:null,lay:null,auf:0,falt:0,leer:false,flug:[],stoss:0,rT:0};
const _kz=new THREE.Matrix4().makeScale(0,0,0), _km=new THREE.Matrix4(), _kq=new THREE.Quaternion(), _kv=new THREE.Vector3(), _ks=new THREE.Vector3(), _ke=new THREE.Euler();
/* Nur echte Warenkartons - keine Kiste, kein Paket, kein Versandmaterial */
function kartonWare(c){ return !!(c&&c.type&&!c.kiste&&!c.vm&&!c.regal&&!c.einbau&&c.type!=='gravur'&&P[c.type]&&P[c.type].dims&&kartonMat[c.type]); }
/* In der Hand: ohne Karre immer, mit Karre der oberste, sobald er offen ist */
function kartonInHand(){ const c=S&&S.carrying; return kartonWare(c)&&(!karreAn()||!!c.offen); }
function kartonZu(){ const c=S&&S.carrying; return kartonWare(c)&&!c.offen; }
/* Wie die Packungen im Karton stehen: Spalten x Reihen x Lagen, so
   gross wie moeglich (hoechstens echte Groesse), moeglichst wenige
   Lagen - dann sieht man von oben viel Ware */
const KI={w:0.54,d:0.39,h:0.36,y:-0.19};
function kartonLayout(t){
  const p=P[t], n=Math.max(1,p.box|0), best={s:-1};
  for(const rot of [0,1]){ const w=rot?p.dims[2]:p.dims[0], d=rot?p.dims[0]:p.dims[2], h=p.dims[1];
    for(let cols=1;cols<=n;cols++) for(let rows=1;rows<=n;rows++){
      const lay=Math.ceil(n/(cols*rows)); if(cols*rows>n&&rows>1&&cols*(rows-1)>=n) continue;
      const s=Math.min(1,KI.w/(cols*w),KI.d/(rows*d),KI.h/(lay*h));
      const besser=s>best.s+1e-4||(Math.abs(s-best.s)<=1e-4&&(lay<best.lay||(lay===best.lay&&cols*rows*lay<best.cols*best.rows*best.lay)));
      if(besser) Object.assign(best,{s,cols,rows,lay,rot,w,d,h}); } }
  best.pro=best.cols*best.rows; return best;
}
/* Matrix der i-ten Packung im Karton (Kartonkoordinaten). Gefuellt wird
   von unten, in jeder Lage von hinten nach vorn - herausgenommen wird
   also oben vorn zuerst, wo die Hand hinkommt. */
function kartonStueckM(L,i,out){
  const lage=Math.floor(i/L.pro), r=i%L.pro, row=Math.floor(r/L.cols), col=r%L.cols;
  const cw=KI.w/L.cols, cd=KI.d/L.rows;
  _ke.set(0,(L.rot?Math.PI/2:0)+Math.sin(i*12.9898)*0.05,0); _kq.setFromEuler(_ke);
  _kv.set(-KI.w/2+cw*(col+0.5),KI.y+lage*L.h*L.s,-KI.d/2+cd*(row+0.5));
  _ks.setScalar(L.s); return out.compose(_kv,_kq,_ks);
}
function kartonHandBau(){
  if(KH.g) return;
  KH.g=new THREE.Group(); KH.k=einrKiste(); KH.k.visible=true; KH.k.scale.setScalar(1);
  KH.inh=new THREE.Group(); KH.k.add(KH.inh); KH.g.add(KH.k);
  KH.g.visible=false; camera.add(KH.g);
}
/* Inhalt fuer eine Ware: je Teil der Packung ein InstancedMesh mit
   hoechstens einer Lage - mehr sieht man von oben nicht */
function kartonInhalt(t){
  if(KH.typ===t) return;
  for(const m of KH.ims){ KH.inh.remove(m); m.dispose&&m.dispose(); }
  KH.ims=[]; KH.typ=t; KH.lay=null; if(!t) return;
  const L=KH.lay=kartonLayout(t);
  for(const me of pools[t].meshes){ const m=new THREE.InstancedMesh(me.geometry,me.material,L.pro); m.count=0; m.frustumCulled=false; m.castShadow=false; m.receiveShadow=false; KH.inh.add(m); KH.ims.push(m); }
  einrKisteTyp(KH.k,t);
}
/* Wie viele Packungen der Karton gerade zeigt: Packungen auf dem Weg
   zurueck in den Karton sind noch nicht drin */
function kartonAnzeige(){ const c=S&&S.carrying; if(!kartonWare(c)) return 0; return Math.max(0,c.count-KH.flug.filter(f=>f.rein).length); }
function kartonInhaltZeigen(n){
  const L=KH.lay; if(!L) return;
  /* nur neu setzen, wenn sich die Zahl oder die Ware aendert */
  if(KH.nZeig===n&&KH.lZeig===L) return; KH.nZeig=n; KH.lZeig=L; let k=0;
  for(let i=Math.max(0,n-L.pro);i<n;i++){ kartonStueckM(L,i,_km); for(const m of KH.ims) m.setMatrixAt(k,_km); k++; }
  for(const m of KH.ims){ m.count=k; m.instanceMatrix.needsUpdate=true; }
  KH.gezeigt=k;
}
/* Haltung: unten mittig, etwas zum Spieler gekippt - man sieht hinein */
function kartonHaltung(dt){
  const g=KH.g, st=KH.stoss;
  g.position.set(0.02,-0.5+st*0.04,-0.78-st*0.06);
  g.rotation.set(0.62-KH.auf*0.12,0,0);
  g.scale.setScalar(0.9);
}
function kartonOeffnen(an){
  const c=S&&S.carrying; if(!kartonWare(c)) return false;
  const vor=!!c.offen; c.offen=an===undefined?!c.offen:!!an;
  if(vor!==c.offen){ sfx.pop(); updateCarry(); }
  return true;
}
function kartonTaste(){ if(!S||paused) return; if(!kartonOeffnen()){ if(S.carrying&&S.carrying.kiste) toast('Die Kiste ist offen – einfach einräumen.'); return; } }
/* Nach dem Einraeumen (stockOne): die Packung fliegt aus dem Karton ins
   Fach. Im Fach wird sie bis zur Landung nicht gezeichnet. */
function kartonFlug(lv,t){
  const c=S&&S.carrying; if(!c||!kartonWare(c)||c.type!==t) return;
  if(!c.offen){ c.offen=true; }
  const h=lv.items[lv.items.length-1]; if(!h) return;
  if(!h.versteckt&&h.pool.h[h.i]===h){ for(const me of h.pool.meshes){ me.setMatrixAt(h.i,_kz); me.instanceMatrix.needsUpdate=true; } }
  KH.flug.push({t:0,typ:t,h,idx:c.count,raus:true,m:null});
  KH.stoss=1; if(c.count<=0) KH.leer=true;
}
/* R: eine Packung aus dem Fach zurueck in den Karton */
function kartonKannZurueck(lv){ const c=S&&S.carrying; return !!(lv&&kartonWare(c)&&c.offen&&lv.type===c.type&&lv.count>0&&c.count<P[c.type].box); }
function kartonZurueck(lv,quiet){
  const c=S&&S.carrying;
  if(!kartonKannZurueck(lv)){ if(!quiet&&kartonWare(c)){ if(!c.offen) toast(`Erst den Karton öffnen (${COARSE?'„Öffnen“':'C'}).`,'bad'); else if(lv&&lv.type&&lv.type!==c.type) toast(`Im Fach liegen ${P[lv.type].short}, im Karton ${P[c.type].short}.`,'bad'); else if(c.count>=P[c.type].box) toast('Der Karton ist voll.','bad'); } return false; }
  const h=lv.items[lv.items.length-1], von=h?h.m.clone():null, q=lv.q||1;
  removeFromLevel(lv);
  c.q=((c.q||1)*c.count+q)/(c.count+1); c.count++;
  if(von) KH.flug.push({t:0,typ:c.type,von,idx:c.count-1,rein:true,m:null});
  sfx.pop(); updateCarry(); return true;
}
function kartonFlugEnde(f){
  if(f.m){ scene.remove(f.m); f.m=null; }
  const h=f.h; if(h&&!h.versteckt&&h.pool.h[h.i]===h){ for(const me of h.pool.meshes){ me.setMatrixAt(h.i,h.m); me.instanceMatrix.needsUpdate=true; } }
}
/* Alle Fluege sofort beenden (Karton weg, Spiel geladen) */
function kartonFluegeAus(){ for(const f of KH.flug) kartonFlugEnde(f); KH.flug.length=0; }
const _kA=new THREE.Vector3(), _kB=new THREE.Vector3(), _kQa=new THREE.Quaternion(), _kQb=new THREE.Quaternion(), _kSa=new THREE.Vector3(), _kSb=new THREE.Vector3();
function kartonTick(dt){
  if(!S) return;
  kartonHandBau();
  const c=S.carrying, inHand=kartonInHand();
  /* leer geworden: in der Hand zusammenfalten */
  if(KH.leer&&!inHand){ KH.falt=1; }
  KH.leer=false;
  if(inHand){ KH.falt=0; kartonInhalt(c.type); }
  const ziel=inHand&&c.offen?1:0;
  KH.auf+=(ziel-KH.auf)*Math.min(1,dt*9); if(Math.abs(ziel-KH.auf)<0.01) KH.auf=ziel;
  KH.stoss=Math.max(0,KH.stoss-dt*5);
  if(KH.falt>0) KH.falt=Math.max(0,KH.falt-dt*3.2);
  const zeigen=inHand||KH.falt>0;
  KH.g.visible=zeigen;
  if(zeigen){
    kartonHaltung(dt);
    /* Klappen: beim Falten zuerst flach zusammen */
    einrKlappen(KH.k,KH.falt>0?0:KH.auf);
    KH.k.scale.set(1,KH.falt>0?Math.max(0.05,KH.falt):1,1);
    KH.inh.visible=inHand&&KH.auf>0.05;
    if(KH.inh.visible) kartonInhaltZeigen(kartonAnzeige());
  }
  /* Fluege: Start im Karton, Ziel im Fach (oder umgekehrt) */
  if(KH.flug.length){ camera.updateMatrixWorld(); KH.k.updateMatrixWorld(); }
  for(let i=KH.flug.length-1;i>=0;i--){ const f=KH.flug[i];
    /* raus: erst wenn der Karton offen ist */
    if(f.raus&&KH.auf<0.85&&inHand&&f.t===0){ continue; }
    if(!f.m){ f.m=einrStueck(f.typ); }
    f.t+=dt/0.24; const t=Math.min(1,f.t), e=t*t*(3-2*t);
    const L=KH.lay&&KH.typ===f.typ?KH.lay:null, regalM=f.raus?f.h.m:f.von;
    if(L&&KH.g.visible){ kartonStueckM(L,f.idx,_km); _km.premultiply(KH.k.matrixWorld); } else _km.copy(regalM);
    (f.raus?_km:regalM).decompose(_kA,_kQa,_kSa); (f.raus?regalM:_km).decompose(_kB,_kQb,_kSb);
    _kA.lerp(_kB,e); _kA.y+=Math.sin(Math.PI*t)*0.14; _kQa.slerp(_kQb,e); _kSa.lerp(_kSb,e);
    f.m.matrix.compose(_kA,_kQa,_kSa); f.m.matrixWorldNeedsUpdate=true;
    if(f.t>=1){ kartonFlugEnde(f); KH.flug.splice(i,1); }
  }
  /* R gehalten: im gleichen Takt wie das Einraeumen weiter zuruecknehmen */
  if(keys.KeyR&&!grabbed&&target&&target.kind==='level'&&kartonKannZurueck(target.ref)){ KH.rT-=dt; if(KH.rT<=0){ kartonZurueck(target.ref,true); KH.rT=0.16; } }
  else KH.rT=0;
  kartonKnopf();
}
/* Handy: Knopf "Öffnen"/"Schließen", nur mit Warenkarton in der Hand */
function kartonKnopf(){
  const b=$('btnKarton'); if(!b) return;
  const c=S&&S.carrying, da=kartonWare(c), d=da?'':'none';
  if(b.style.display!==d) b.style.display=d;
  if(da){ const tx=c.offen?'Zu':'Öffnen'; if(b.textContent!==tx) b.textContent=tx; }
}
/* Tastenhinweise (Desktop) links wie im Supermarket Simulator */
function kartonTasten(){
  const el=$('kTasten'); if(!el) return;
  const c=S&&S.carrying;
  if(COARSE||!kartonWare(c)){ if(el.innerHTML) el.innerHTML=''; return; }
  const z=(k,t)=>`<div><kbd>${k}</kbd>${t}</div>`;
  const h=(c.offen?z('C','Schließen')+z('E','Einräumen')+z('R','Zurücknehmen'):z('C','Öffnen')+z('E','Öffnen &amp; einräumen'))+z('Q','Abstellen');
  if(el.innerHTML!==h) el.innerHTML=h;
}
/* Fuer Tests und Bilder (kartonauf.js) - eigenes Objekt, window.__bb bleibt unberuehrt */
window.__karton={KH,kartonOeffnen,kartonZurueck,kartonLayout,kartonWare,kartonTaste,itemMatrix,faceOf,get carryMesh(){return carryMesh},get karreKisten(){return karreKisten}};

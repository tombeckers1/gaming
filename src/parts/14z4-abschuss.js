/* =========================================================
   ABSCHUSS-BAUSTEIN - eine Mechanik fuer jede Zuendung
   (Fundament Etappe 2b, Tom 13.10.2026: "Effekte kommen genau aus den
   Loechern/Rohren, sichtbare Loecher = Schusszahl, immer gleiche Art der
   Zuendung/Darstellung - es kann nicht sein, dass einmal aus der
   Verpackung abgeschossen wird und einmal ein ausgepacktes Produkt
   dasteht.")
   Regelwerk: docs/fundament/feuerwerk-regeln.md, Waechter-Test
   src/tests/abschussregel.js.

   Hier steht GENAU EINMAL, fuer jeden Zuend-Ort (Testfeld-Stationen im
   Spiel und in der Teststation, alle drei Vorfuehrungen auf PC und Handy,
   Prototyp der eigenen Rezeptur):
   - der Platz (abPlatz, abPlatzStation): Zuendtisch, Abschussrohr
     (Raketen, Roemische Lichter), Moerser je Kaliber. Ein Ort liefert nur
     Koordinaten, alles andere ist hier gleich.
   - die Muendung (abMuendung): Abschusspunkt und Oeffnung des Produkts;
     Roemische Lichter mit ihren einzelnen Rohren (abKerzenLoecher).
   - die Darstellung (abForm, abAufstellen): immer das ausgepackte Produkt
     - Batterie mit einem Rohr je Schuss (Rohrraster 04c rohrLayout),
     Rakete im Rohr, Kugel in der Moerser-Muendung mit Zuendschnur,
     Lichterbuendel im Rohr, Gestell, Podest, Kleinfeuerwerk, Fontaene.
   - die Zuendung (abZuenden): Zuendschnur, Abschuss (igniteType), das
     Modell fliegt mit (abFlug), Rauchrest, Abraeumen.
   - die Abschussgeraete (abRohrBau, abMoerserBau, abTischBau,
     abRampeBau): Station und Vorfuehrung haben dieselben Rohre.
   Neue Zuend-Orte rufen NUR diese Funktionen auf (Waechter: EINMAL).
   Die Effekte selbst (Drehbuecher 14g-14z3: Bruchbild, Ablauf, Klang)
   bleiben Anomalie und werden hier nicht angefasst.
   ========================================================= */

/* ---------- Abschussgeraete: Masse ---------- */
/* Abschussrohr fuer Raketen und Roemische Lichter (01.10. abends): Platte
   in 0,76 m, Rohr 0,62 m lang, um 0,1 rad vom Zuschauer weg geneigt -
   Muendung in 1,39 m. pl.x/pl.z eines Rohr-Platzes = Mitte der Reihe. */
const RAMPE_TISCH=0.76;
const ROHR_ACHSE={y:RAMPE_TISCH+0.012+0.31*Math.cos(0.1),z:-0.055,neig:-0.1,halb:0.31,innen:0.056};
/* Moerser: Rohr je Kaliber (klein/mittel/gross), auf 0,18 m Fuss -
   Muendung in 1,48 / 1,73 / 2,03 m (vorher dreimal getrennt notiert:
   Station, Platz und Vorfuehrung) */
const MOERSER_FUSS=0.18, MOERSER_H=[1.30,1.55,1.85], MOERSER_MUND=MOERSER_H.map(h=>+(MOERSER_FUSS+h).toFixed(3));
const MOERSER_X=[-0.72,0,0.78];
/* Zuendschnur bis zum Abschuss (s), je Darstellung - an jedem Ort gleich
   (vorher Station 0,4/0,75 s, Vorfuehrung 0,9/1,2 s). Lang genug, dass
   man Rakete und Kugel im Rohr sieht (Toms PDF 05.10.). Batterien,
   Fontaenen und Kleinfeuerwerk bringen ihre Zuendschnur im Drehbuch mit. */
const AB_VOR={rakete:0.9,gravur:0.9,kugel:1.2,buendel:0.4};
/* Wer selbst das Geschoss ist, fliegt mit (Modell folgt dem Aufstieg) */
const AB_FLIEGT={rakete:true,gravur:true,kugel:true};
const AB_FLIEGT_T={atomboeller:true};

/* ---------- Darstellung: immer ausgepackt ---------- */
/* Produkte, deren Form aus 04g das Produkt SELBST ist (die Huelle ist die
   Fontaene, ihre Duesen sind die Oeffnungen) - kein Verkaufspaket. Alle
   anderen Tischprodukte stehen als buildProduct(t,true) (ohne Verpackung)
   oder mit eigenem Modell da. Ausgepackt heisst: ohne Folie, Blister,
   Haube, Schachtel (VP_AUSGEPACKT, 04g). */
const AB_KOERPER={
  roemisch:'fuenf bedruckte Rohre mit Kappen (03.10., Tom) - ausgepackt ohne Schrumpffolie, im Abschussrohr',
  feuerteufel:'Papphuelse mit zwei Hoerner-Duesen, aus denen Strahl und Flamme kommen (Toms PDF 06.10.)',
  feuerberg:'Vulkankegel mit Krater - der Kegel ist die Fontaene',
  eisblume:'Pappwickelhuelse mit Kristallkappe - die Huelse ist die Fontaene',
  tischbombe:'Papptrommel mit Zugschnur - die Trommel ist die Tischbombe',
  goldgeysir:'Golddose - Frage an Tom (F3): Dose mit Deckel ist eher Verpackung',
  bodenfeuer:'ausgepackt nur der Bodenring mit acht Duesen (vorher: Schachtel mit Fenster)'
};
/* Offene Fragen an Tom (feuerwerk-regeln.md, Abschnitt 4): Abweichungen,
   deren Behebung den Effekt veraendern wuerde. Der Waechter meldet sie
   als OFFEN statt als Fehler - und schlaegt an, wenn hier etwas steht,
   das gar nicht mehr abweicht. */
const AB_OFFEN={
  /* F1: Begleitkometen am Moerser (14p KUGEL_ABSCHUSS kometen/farbkometen) */
  kronenkranz200:'F1', goldweidenkreuz200:'F1', kometensturm300:'F1', urknall300:'F1', titanenfaust300:'F1', sturmflut300:'F1', goetterdaemmerung300:'F1'
};
/* Mitzaehler fuer den Waechter: jede Darstellung und Zuendung je Ort */
const AB_ZAEHLER={aufstellen:{},zuenden:{}};
let AB_LOG=null;   /* Waechter: Mitschnitt jeder Darstellung und Zuendung */

function abForm(t){
  const p=P[t]; if(!p) return null; const sid=stationOf(t); if(!sid) return null;
  if(sid==='moerser') return 'kugel';
  if(sid==='rampe') return t==='gravur'?'gravur':p.shape==='candle'?'buendel':'rakete';
  if(istBatterie(t)) return 'batterie';
  if(p.gestell&&typeof fkGestellBau==='function') return 'gestell';
  if(typeof kqWkLayout==='function'&&kqWkLayout(t)) return 'podest';
  if(typeof KF_BAU!=='undefined'&&KF_BAU[t]) return 'klein';
  if(AB_KOERPER[t]&&VP_FORM[t]) return 'koerper';
  return 'roh';
}
/* Modellteile der ausgepackten Form (Pool je Produkt) */
const _abPools={};
function abTeile(t){ return AB_KOERPER[t]&&VP_FORM[t]&&typeof VP_AUSGEPACKT==='function'?VP_AUSGEPACKT(t):buildProduct(t,true); }
function abPool(t){ if(!_abPools[t]){ const L=abTeile(t); _abPools[t]=new ItemPool(L,4); _abPools[t].teile=L; } return _abPools[t]; }
/* Hoehe der Oeffnung ueber der Tischplatte: die ausgepackte Form sagt
   es (parts.oben), sonst die Hoehe des Produkts */
const _abOben={};
function abOben(t){ const p=P[t], h=p&&p.dims?p.dims[1]:0.2, f=abForm(t);
  if(f!=='koerper'&&f!=='roh') return h;
  if(_abOben[t]===undefined){ const L=abPool(t).teile||null; _abOben[t]=L&&L.oben!==undefined?L.oben:h; }
  return _abOben[t]; }

/* ---------- Platz ---------- */
/* art: tisch (pl.y = Tischplatte) | rohr (pl.x/pl.z = Reihe) | moerser
   (pl.y = Muendung, kal = Kaliber 0-2). ry: Drehung auf dem Tisch, neig:
   Rohrneigung, blick: wohin die Zuendschnur der Kugel haengt. */
function abPlatz(art,x,y,z,ext){ return Object.assign({art,x,y,z,ry:Math.PI,neig:0,kal:0,blick:null,ort:'station'},ext||{}); }
/* Testfeld (05d): Platz slot einer Station */
function abPlatzStation(st,slot){ const p=STATION_POS[st.id], i=slot%3;
  if(st.id==='tisch') return abPlatz('tisch',p.x+TISCH_X[i],0.93,p.z,{ry:Math.PI});
  if(st.id==='moerser') return abPlatz('moerser',p.x+MOERSER_X[i],MOERSER_MUND[i],p.z,{kal:i,blick:PULT_POS});
  return abPlatz('rohr',p.x+RAMPE_X[i],RAMPE_TISCH,p.z,{neig:ROHR_ACHSE.neig}); }

/* ---------- Muendung ---------- */
function abRohrBei(pl,u){ const A=ROHR_ACHSE, n=pl.neig||0; return {x:pl.x,y:A.y+Math.cos(n)*u,z:pl.z+A.z+Math.sin(n)*u}; }
function abRohrMund(pl){ return abRohrBei(pl,ROHR_ACHSE.halb); }
/* Roemische Lichter stecken IM Abschussrohr (Tom, Foto 29.09.), das obere
   Drittel schaut heraus; so schmal, dass das Buendel hineinpasst */
function abKerze(pl,t){
  const d=P[t].dims, w=d[0], L=abForm(t)==='buendel'?abPool(t).teile:null, lo=L&&L.loecher;
  /* Breite des Buendels: aus den Rohren des Modells (Kreis um die Mitte) */
  const breite=lo?2*Math.max(...lo.map(q=>Math.hypot(q.x,q.z)+q.r)):1.41*w;
  const HH=lo?Math.max(...lo.map(q=>q.y)):d[1]*0.9, s=Math.min(1,(ROHR_ACHSE.innen*2-0.008)/breite), tb=ROHR_ACHSE.halb-0.4*HH;
  const hx=lo?Math.max(...lo.map(q=>Math.abs(q.x)))*s:0.52*w*s, hz=lo?Math.max(...lo.map(q=>Math.abs(q.z)))*s:0.5*w*s;
  return {base:abRohrBei(pl,tb),top:abRohrBei(pl,tb+HH),s,neig:pl.neig||0,hx,hz,lo}; }
/* die einzelnen Rohre des Buendels in Weltlage (x quer bleibt, y/z kippen mit der Rohrneigung) */
function abKerzenLoecher(pl,t){ const k=abKerze(pl,t); if(!k.lo) return null; const c=Math.cos(k.neig), s=Math.sin(k.neig);
  return k.lo.map(q=>{ const a=q.x*k.s, b=q.y, z=q.z*k.s; return {x:k.base.x+a,y:k.base.y+b*c-z*s,z:k.base.z+b*s+z*c,r:q.r*0.9*k.s}; }); }
/* Abschusspunkt o eines Produkts auf seinem Platz: x/y/z Muendung, ab
   Abstand darueber, jit Streuung, hx/hz halbe Oeffnung - weiter darf kein
   Abschuss, keine Mine und keine Duese vom Mittelpunkt weg (28.09., Tom) */
function abMuendung(pl,t){ const p=P[t]||{}, d=p.dims||[0.2,0.2,0.2];
  if(pl.art==='tisch'){ const hx=d[0]/2, hz=d[2]/2; return {x:pl.x,y:pl.y+abOben(t),z:pl.z,ab:0.08,jit:Math.min(0.06,hx*0.5,hz*0.5),hx,hz,ry:pl.ry}; }
  if(pl.art==='moerser'){ const r=ROHR_INNEN[pl.kal]*0.8; return {x:pl.x,y:pl.y,z:pl.z,ab:0.05,jit:0.02,hx:r,hz:r}; }
  if(p.shape==='candle'&&p.dims){ const k=abKerze(pl,t), L=abKerzenLoecher(pl,t);
    /* hx: das aeusserste Rohr - die Drehbuch-Versaetze landen genau auf den Rohren (14b ortAus) */
    return {x:k.top.x,y:k.top.y,z:k.top.z,ab:0.02,jit:0.005,hx:k.hx+0.015,hz:k.hz,loecher:L}; }
  const mu=abRohrMund(pl); return {x:mu.x,y:mu.y,z:mu.z,ab:0.05,jit:0.02,hx:0.045,hz:0.045}; }
/* Drehbuch-Versatz quer (m) -> das Rohr des Buendels, das dort sitzt */
function abLochOrt(o,off){ const L=o.loecher; let b=L[0], bd=1e9;
  for(const q of L){ const dd=Math.abs(q.x-(o.x+off)); if(dd<bd){ bd=dd; b=q; } }
  const v=V(b.x,b.y,b.z); v.jit=Math.min(o.jit||0.005,b.r*0.4); v.ab=o.ab; return v; }

/* ---------- Darstellung ---------- */
/* Stellt das ausgepackte Produkt auf den Platz. Rueckgabe: der Griff h
   (Felder wie ein Stationsplatz: h Pool, batt Batterie, modell Rakete/
   Kugel, gestell, mesh Gravur) - die Station nimmt ihn als Platz-Eintrag. */
function abAufstellen(pl,t,opt){ opt=opt||{};
  const p=P[t], form=abForm(t); if(!p||!form) return null;
  const h={form,t,pl};
  AB_ZAEHLER.aufstellen[pl.ort]=(AB_ZAEHLER.aufstellen[pl.ort]||0)+1;
  const o=abMuendung(pl,t);
  if(form==='batterie'){ const b=batterieModell(t,pl.ry); b.g.position.set(pl.x,pl.y,pl.z); b.g.rotation.y=pl.ry; scene.add(b.g); h.batt=b; }
  else if(form==='gestell'||form==='podest'||form==='klein'){
    const g=form==='gestell'?fkGestell(t,pl):form==='podest'?kqPodestAuf(t,pl):kfTischAuf(t,pl);
    if(g){ scene.add(g); h.gestell=g; } }
  else if(form==='rakete'){ const g=raketeModell(t); g.position.set(o.x,o.y-0.01,o.z); g.rotation.x=pl.neig||0; h.modell=g; }
  else if(form==='gravur'){
    /* Gravur-Rakete: liegend gebaut (06b) - in einer Gruppe aufgestellt,
       damit sie wie jede Rakete mit der Spitze voran fliegt */
    const m=makeEngraved(opt.text||''), g=new THREE.Group(); m.rotation.z=Math.PI/2; m.position.y=0.07; g.add(m);
    g.position.set(o.x,o.y,o.z); g.rotation.x=pl.neig||0; h.modell=g; h.mesh=m; h.text=opt.text||null; }
  else if(form==='kugel'){
    /* 07.10. (Tom: "Kugelbomben NICHT sichtbar im Rohr, ohne heraushaengende
       Zuendschnur"): die Kugel sitzt oben in der Muendung (die obere Haelfte
       schaut heraus), die Schnur haengt zum Zuschauer hin ueber den Rand -
       an der Station zum Zuendpult, in der Vorfuehrung zur Kamera */
    const g=kugelModell(t,pl.kal), kugel=g.children[0], b=pl.blick||camera.position;
    const rk=kugel.geometry&&kugel.geometry.parameters?kugel.geometry.parameters.radius:0.06; kugel.position.y=rk*0.25;
    g.position.set(o.x,o.y,o.z); g.rotation.y=-Math.atan2(b.z-o.z,b.x-o.x); h.modell=g; h.kugel=kugel; }
  else if(form==='buendel'){ const k=abKerze(pl,t); _e.set(k.neig,0,0); _q.setFromEuler(_e);
    h.h=abPool(t).add(new THREE.Matrix4().compose(V(k.base.x,k.base.y,k.base.z),_q,V(k.s,1,k.s))); }
  else h.h=abPool(t).add(mx(pl.x,pl.y,pl.z,pl.ry));
  if(h.modell){ h.modell.userData.abModell=t; h.modell.userData.vfModell=t; scene.add(h.modell); }
  if(AB_LOG) AB_LOG.push({was:'auf',ort:pl.ort,t,form,h,pl});
  return h;
}
/* alles, was der Griff aufgestellt hat, wieder weg (Station: itemEntfernen) */
function abWeg(h){ if(!h||h.weg_) return; h.weg_=true;
  if(h.h&&h.h.pool) h.h.pool.remove(h.h);
  if(h.batt) h.batt.weg();
  if(h.mesh) disposeEngraved(h.mesh);
  if(h.modell&&h.modell.parent) h.modell.parent.remove(h.modell);
  if(h.gestell&&h.gestell.parent) h.gestell.parent.remove(h.gestell);
  if(h.flug&&!h.flug.fertig) h.flug.weg(); }

/* ---------- Zuendung ---------- */
/* opt: q Qualitaet (Blindgaenger bei billiger Ware - nur im Spiel),
   solange() Abbruch (Vorfuehrung beendet), fertig() nach dem Abbrand
   (sonst raeumt der Baustein selbst ab), it fuer igniteType (Gravurtext).
   Rueckgabe {o,vor,dauer,dud}. */
function abZuenden(pl,t,h,opt){ opt=opt||{};
  AB_ZAEHLER.zuenden[pl.ort]=(AB_ZAEHLER.zuenden[pl.ort]||0)+1;
  const form=h?h.form:abForm(t), o=abMuendung(pl,t); if(h&&h.batt) o.batt=h.batt;
  const vor=AB_VOR[form]||0; if(h) h.vor=vor;
  const dud=opt.q!==undefined&&Math.random()<clamp((1-opt.q)*0.65,0,0.45);
  if(vor){ let lo=o;
    if(h&&h.modell&&h.modell.userData.lunte){ h.modell.updateMatrixWorld(true); const w=h.modell.localToWorld(h.modell.userData.lunte.clone()); lo={x:w.x,y:w.y-0.05,z:w.z}; }
    emitters.push({t:vor,k:'fuse',o:lo}); sfx.fizz(distVol(o)*0.5); }
  if(h&&(AB_FLIEGT[form]||AB_FLIEGT_T[t])) abFlug(h,o);
  later(vor,()=>{
    if(opt.solange&&!opt.solange()) return;
    if(dud){ fizzle(t,o); if(h&&h.flug) h.flug.weg(); return; }
    igniteType(t,o,opt.it||h); });
  const dauer=vor+(dud?2.2:brennDauer(t));
  later(dauer,()=>{
    /* abgebrannt: ein Rest Rauch steigt aus der Oeffnung, nicht daneben
       (28.09., Tom: echt), dann ist der Platz wieder frei */
    const dd=P[t]&&P[t].dims||[0.2,0.2,0.2], rr=pl.art==='tisch'?Math.min(0.08,Math.min(dd[0],dd[2])*0.4):0.03;
    for(let k=0;k<14;k++){ const d=randDir();
      psSmall.emit(o.x+rand(-rr,rr),o.y,o.z+rand(-rr,rr),d[0]*0.25,Math.abs(d[1])*0.6+0.3,d[2]*0.25,0.34,0.34,0.36,rand(1.2,2.2),-0.25,0); }
    if(opt.fertig) opt.fertig(); else abWeg(h); });
  if(AB_LOG) AB_LOG.push({was:'zuend',ort:pl.ort,t,form,h,pl,o,vor,dauer,dud,uhr:FW_UHR});
  return {o,vor,dauer,dud};
}
/* Das Modell fliegt mit: die Rakete (Stab voran gekippt in Flugrichtung),
   die Kugel ohne Schnur, und ist mit dem Bruch weg (vorher nur in der
   Vorfuehrung - an der Station verschwand die Rakete beim Start). Ein
   Produkt, das selbst das Geschoss ist (Atom-Boeller), verschwindet beim
   Abschuss vom Tisch. e.blick: die Vorfuehrung haengt ihren Kamerablick an (14u). */
function abFlug(h,o){
  const e={t:30,k:'abModell',o:{x:o.x,y:o.y,z:o.z},ab:o.ab||0,g:h.modell||null,pool:h.modell?null:h.h,kugel:h.kugel||null,alter:0,r:null,fertig:false,warte:(h.vor||0)+8};
  e.weg=()=>{ if(e.g&&e.g.parent) e.g.parent.remove(e.g); e.fertig=true; e.t=0; if(e.blickAus) e.blickAus(e); };
  h.flug=e; emitters.push(e); return e; }
const _abY=new THREE.Vector3(0,1,0), _abD=new THREE.Vector3();
NEU_EMIT.abModell=function(e,dt,o){
  e.alter+=dt;
  if(e.fertig){ e.t=0; return; }
  e.t=30;
  if(!e.r){
    /* die Rakete oder Kugel, die eben aus dieser Muendung gestartet ist */
    for(const r of rockets) if(!r.abModell&&r.alter<0.3&&Math.abs(r.y0-(o.y+e.ab))<0.3&&Math.abs(r.p.x-o.x)<0.6&&Math.abs(r.p.z-o.z)<0.6){ e.r=r; r.abModell=e.g||true; break; }
    if(e.r){
      if(e.pool&&e.pool.pool){ e.pool.pool.remove(e.pool); e.pool=null; }
      if(e.kugel){ e.g.children.forEach(m=>{ if(m!==e.kugel) m.visible=false; }); e.kugel.position.set(0,0,0); e.g.rotation.set(0,0,0); } }
    else if(e.alter>e.warte){ e.weg(); return; }
  }
  const r=e.r;
  if(r&&e.nach===undefined&&rockets.indexOf(r)<0){ if(e.g&&e.g.parent) e.g.parent.remove(e.g);
    if(!e.blick){ e.weg(); return; }
    e.bruchP={x:r.p.x,y:r.p.y,z:r.p.z}; e.nach=1.5; }
  if(e.nach!==undefined){ e.nach-=dt; if(e.nach<=0){ e.weg(); return; } }
  else if(r&&e.g){ e.g.position.set(r.p.x,r.p.y,r.p.z);
    if(!e.kugel){ _abD.set(r.v.x,r.v.y,r.v.z); if(_abD.lengthSq()>0.01){ _abD.normalize(); e.g.quaternion.setFromUnitVectors(_abY,_abD); } } }
  if(e.blick) e.blick(e,dt,o,r);
};

/* ---------- Abschussgeraete ---------- */
/* Materialien: der Zuendtisch aus Lochblech und die Riffelblechplatte
   des Moersers entstehen in buildYard (05d) und werden hier fuer die
   Vorfuehranlage mitbenutzt (abMatSetzen); Rohre, Stahl, Gummi hier. */
const AB_MAT={};
function abMatSetzen(m){ Object.assign(AB_MAT,m); }
function abMat(){ if(AB_MAT.rohr) return AB_MAT;
  AB_MAT.rohr=MAT.ober('graphit','blank',{side:THREE.DoubleSide});
  AB_MAT.rohrInnen=MAT.ober('tiefschwarz','matt',{side:THREE.DoubleSide});
  AB_MAT.stahl=AB_MAT.stahl||MAT.get('chromHell');
  AB_MAT.stahlDunkel=AB_MAT.stahlDunkel||MAT.get('zaunPfosten');
  AB_MAT.gummi=AB_MAT.gummi||MAT.get('gummi');
  AB_MAT.moerser=MAT.ober('anthrazit','blank',{side:THREE.DoubleSide});
  AB_MAT.moerserInnen=MAT.ober('tiefschwarz','matt',{side:THREE.DoubleSide});
  AB_MAT.moerserBoden=MAT.get('gummi');
  AB_MAT.wulst=MAT.ober('graphit','blank');
  AB_MAT.schelle=MAT.get('stahlMittel');
  if(!AB_MAT.perf) AB_MAT.perf=std(0xaab0b9,{metalness:0.66,roughness:0.42});
  if(!AB_MAT.riffel) AB_MAT.riffel=std(0x7b828d,{metalness:0.62,roughness:0.44});
  return AB_MAT; }
/* Ein Abschussrohr fuer Raketen: Stahlrohr mit schwarzer Innenwand, Boden,
   Muendungsring, Schelle, schwere Fussplatte mit zwei Stuetzen. x/z0 in
   der Gruppe g: Mitte der Reihe (wie pl.x/pl.z). */
function abRohrBau(g,x,z0){
  const M=abMat(), A=ROHR_ACHSE, c=Math.cos(A.neig), sn=Math.sin(A.neig), TT=RAMPE_TISCH, z=z0+A.z;
  const t=new THREE.Mesh(new THREE.CylinderGeometry(0.062,0.062,A.halb*2,20,1,true),M.rohr);
  t.position.set(x,A.y,z); t.rotation.x=A.neig; if(HIQ) t.castShadow=true; g.add(t);
  const inner=new THREE.Mesh(new THREE.CylinderGeometry(0.056,0.056,A.halb*2-0.03,16,1,true),M.rohrInnen);
  inner.position.copy(t.position); inner.rotation.copy(t.rotation); g.add(inner);
  const fussY=A.y-c*A.halb, fussZ=z-sn*A.halb;
  const boden=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.012,20),M.stahlDunkel); boden.position.set(x,fussY,fussZ); boden.rotation.x=A.neig; g.add(boden);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.064,0.013,8,18),M.stahl);
  ring.rotation.x=Math.PI/2+A.neig; ring.position.set(x,A.y+c*A.halb,z+sn*A.halb); g.add(ring);
  const schelle=new THREE.Mesh(new THREE.TorusGeometry(0.066,0.012,8,18),M.stahlDunkel);
  schelle.rotation.x=Math.PI/2+A.neig; schelle.position.set(x,A.y-c*A.halb*0.55,z-sn*A.halb*0.55); g.add(schelle);
  bbox(0.24,0.022,0.24,M.stahlDunkel,x,TT+0.011,fussZ,g,false);
  for(const sx of [-1,1]){ const st=bbox(0.014,0.2,0.014,M.stahlDunkel,x+sx*0.085,TT+0.1,fussZ+0.02,g,false); st.rotation.z=-sx*0.32; }
  g.userData.abRohre=(g.userData.abRohre||0)+1;
  return t; }
/* Lochblechtisch unter den Abschussrohren: Breite B, Mitte x0/z0 */
function abRampeBau(g,x0,z0,B){ const M=abMat(), TT=RAMPE_TISCH;
  bbox(B,0.04,0.74,M.perf,x0,TT-0.02,z0,g);
  bbox(B+0.06,0.05,0.05,M.stahlDunkel,x0,TT-0.025,z0+0.37,g); bbox(B+0.06,0.05,0.05,M.stahlDunkel,x0,TT-0.025,z0-0.37,g);
  bbox(0.05,0.05,0.76,M.stahlDunkel,x0+B/2+0.01,TT-0.025,z0,g); bbox(0.05,0.05,0.76,M.stahlDunkel,x0-B/2-0.01,TT-0.025,z0,g);
  const n=Math.max(2,Math.ceil((B-0.14)/1.6)+1);
  for(let i=0;i<n;i++){ const x=x0-B/2+0.07+(B-0.14)*i/(n-1); for(const z of [-0.3,0.3]){
    bbox(0.06,TT-0.05,0.06,M.stahlDunkel,x,(TT-0.05)/2,z0+z,g);
    bbox(0.11,0.025,0.11,M.gummi,x,0.012,z0+z,g,false); } }
  bbox(B-0.2,0.03,0.12,M.stahlDunkel,x0,0.26,z0+0.3,g,false); bbox(B-0.2,0.03,0.12,M.stahlDunkel,x0,0.26,z0-0.3,g,false); }
/* Ein Moerserrohr des Kalibers k: Rohr, Innenwand, Boden, Muendungswulst,
   zwei Verstaerkungsringe, zwei Rohrschellen mit Schraube */
function abMoerserBau(g,x,z0,k){
  const M=abMat(), r=MOERSER_R[k], hh=MOERSER_H[k], y0=MOERSER_FUSS;
  const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,hh,22,1,true),M.moerser); t.position.set(x,y0+hh/2,z0); if(HIQ) t.castShadow=true; g.add(t);
  const innen=new THREE.Mesh(new THREE.CylinderGeometry(r*0.9,r*0.9,hh-0.04,16,1,true),M.moerserInnen); innen.position.copy(t.position); g.add(innen);
  const bo=new THREE.Mesh(new THREE.CircleGeometry(r*0.9,16),M.moerserBoden); bo.rotation.x=-Math.PI/2; bo.position.set(x,y0+0.02,z0); g.add(bo);
  const ring=(R,d,m,y)=>{ const q=new THREE.Mesh(new THREE.TorusGeometry(R,d,8,20),m); q.rotation.x=Math.PI/2; q.position.set(x,y,z0); g.add(q); return q; };
  ring(r*1.03,r*0.17,M.wulst,y0+hh);
  for(const f of [0.3,0.62]) ring(r*1.02,r*0.1,M.moerser,y0+hh*f);
  for(const y of [0.42,0.66]){ ring(r+0.03,0.026,M.schelle,y); bbox(0.05,0.05,0.09,M.schelle,x+r+0.05,y,z0,g,false); }
  g.userData.abMoerser=(g.userData.abMoerser||0)+1;
  return t; }
/* Zuendtisch aus Lochblech: Platte, Rahmen, Beine im Abstand von hoechstens
   1,65 m, Gummifuesse, Querstreben. Breite B, Mitte x0/z0, Platte bei 0,9 m */
function abTischBau(g,x0,z0,B){ const M=abMat(), TB=B/2;
  bbox(B,0.04,1.05,M.perf,x0,0.9,z0,g);
  bbox(B+0.06,0.05,0.05,M.stahlDunkel,x0,0.925,z0+0.52,g); bbox(B+0.06,0.05,0.05,M.stahlDunkel,x0,0.925,z0-0.52,g);
  bbox(0.05,0.05,1.07,M.stahlDunkel,x0+TB+0.02,0.925,z0,g); bbox(0.05,0.05,1.07,M.stahlDunkel,x0-TB-0.02,0.925,z0,g);
  const n=Math.max(2,Math.ceil((B-0.22)/1.65)+1);
  for(let i=0;i<n;i++){ const x=x0-TB+0.11+(B-0.22)*i/(n-1); for(const z of [-0.42,0.42]){
    bbox(0.07,0.88,0.07,M.stahlDunkel,x,0.44,z0+z,g);
    bbox(0.12,0.025,0.12,M.gummi,x,0.012,z0+z,g,false); } }
  bbox(B-0.2,0.03,0.16,M.stahlDunkel,x0,0.3,z0+0.42,g,false);
  bbox(B-0.2,0.03,0.16,M.stahlDunkel,x0,0.3,z0-0.42,g,false);
  bbox(0.06,0.06,0.9,M.stahlDunkel,x0+TB-0.15,0.3,z0,g,false);
  bbox(0.06,0.06,0.9,M.stahlDunkel,x0-TB+0.15,0.3,z0,g,false); }

/* ---------- Prototyp der eigenen Rezeptur ----------
   Vorher schoss rezProto (17-laptop) seine Effekte frei in die Luft ueber
   den Stationen (ohne Produkt, mit eigener Kopie der Rezeptur-Logik).
   Jetzt: ein Probestueck kommt wie jedes Produkt auf seinen Platz und
   zuendet ueber denselben Weg (Kanal, Darstellung, Zuendschnur). Das
   Probestueck ist nur fuer diese Zuendung im Katalog P (nicht im
   Sortiment, kein Hype, keine Erfahrung) und danach wieder weg. */
let _abProtoN=0;
function abProtoProdukt(r){
  const id='proto_'+(++_abProtoN);
  P[id]=rezeptProdukt(Object.assign({},r,{id,name:String(r.name||'Prototyp').trim()||'Prototyp',cost:0,market:0,hype:0}));
  P[id].proto=true; return id; }
function abProtoWeg(id){ if(!P[id]||!P[id].proto) return;
  for(const C of [typeof _rohrBedarf!=='undefined'?_rohrBedarf:null,typeof _rohrLayout!=='undefined'?_rohrLayout:null,typeof _zplan!=='undefined'?_zplan:null,
    typeof _korpus!=='undefined'?_korpus:null,typeof _rohrGeo!=='undefined'?_rohrGeo:null,_abOben]) if(C) delete C[id];
  for(const C of [typeof _pools!=='undefined'?_pools:null,typeof _poolsAus!=='undefined'?_poolsAus:null,_abPools]) if(C&&C[id]){
    for(const m of C[id].meshes||[]) if(m.parent) m.parent.remove(m); delete C[id]; }
  delete P[id]; }
function abProtoZuenden(r){
  const id=abProtoProdukt(r), sid=stationOf(id), st=stations[sid];
  const slot=sid==='moerser'?moerserRohr(id):freierPlatz(st);
  if(!st||slot<0||itemAufPlatz(st,slot)){ abProtoWeg(id); return {frei:false,name:STATION_POS[sid]?STATION_POS[sid].name:''}; }
  const pl=abPlatzStation(st,slot), it=Object.assign(abAufstellen(pl,id),{type:id,q:1,slot,kanal:kanalVon(st,slot),state:'bereit',proto:true});
  st.items.push(it); drawPult(); zuendeItem(st,it,true);
  return {frei:true,kanal:it.kanal,id}; }
/* QS-Stichprobe der Eigenproduktion (Werk West, 05s pdQs): ein Stueck aus der Fertigung wird auf dem Testfeld gezuendet - gleicher Platz,
   gleiche Mechanik, Effekt unveraendert; q = Effektqualitaet (Blindgaenger bei schlechter Qualitaet wie bei Lieferantenware),
   it.qs: kein Hype, keine Erfahrung, nicht "selbst gezuendet" (das Stueck ist Teil der Produktion). Ohne Testfeld/freien Platz: frei false */
function abStichprobe(t,q){
  const sid=typeof stationOf==='function'?stationOf(t):null, st=sid&&typeof stations!=='undefined'?stations[sid]:null;
  if(!st||!P[t]) return {frei:false};
  const slot=sid==='moerser'?moerserRohr(t):freierPlatz(st);
  if(slot<0||itemAufPlatz(st,slot)) return {frei:false};
  const h=abAufstellen(abPlatzStation(st,slot),t); if(!h) return {frei:false};
  const it=Object.assign(h,{type:t,q:q||1,slot,kanal:kanalVon(st,slot),state:'bereit',qs:true});
  st.items.push(it); drawPult(); later(1.5,()=>zuendeItem(st,it,true));
  return {frei:true,kanal:it.kanal}; }

/* Testzugang (abschussregel.js) */
try{ window.__abschuss={abForm,abPlatz,abPlatzStation,abMuendung,abKerze,abKerzenLoecher,abOben,abPool,abTeile,abAufstellen,abZuenden,abWeg,
  log(a){ AB_LOG=a; }, verpackungsMats:()=>[typeof folieKlar!=='undefined'?folieKlar:null,typeof folieMat!=='undefined'?folieMat:null,typeof glassMat!=='undefined'?glassMat:null].filter(Boolean),
  get rohrGeometrie(){ return rohrGeometrie; }, get rohrLayout(){ return rohrLayout; }, get VF(){ return {VF_TISCH,VF_ROHR,VF_MOERSER,VF_Z}; }, fontDuesenLage, FT_DUESE:typeof FT_DUESE!=='undefined'?FT_DUESE:null,
  AB_VOR,AB_KOERPER,AB_OFFEN,AB_ZAEHLER,AB_FLIEGT,AB_FLIEGT_T,MOERSER_MUND,ROHR_ACHSE,RAMPE_TISCH,abProtoZuenden,
  get KUGEL_ABSCHUSS(){ return typeof KUGEL_ABSCHUSS!=='undefined'?KUGEL_ABSCHUSS:null; },
  get KUGEL(){ return KUGEL; }, get vfAnlage(){ return typeof vfAnlage!=='undefined'?vfAnlage:null; }}; }catch(e){}

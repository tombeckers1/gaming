/* =========================================================
   VERPACKUNGS-VORFUEHRUNG - NUR FUER DIE ENTWICKLUNG (Tom, 02.10.)
   "keine Feuerwerksexplosion, sondern die Verpackung ... ein Testfeld,
   wo nur Regale sind und die Produkte eingeraeumt, immer in einer Reihe
   ein Produkt ... du kannst die Lagerflaeche nehmen ... dass ich alle
   Regale mal sehe und wie die eingeraeumt sind ... wie im Supermarkt".
   Laptop > Laden > Verpackungs-Vorfuehrung: die Halle Sued im Lager
   steht solange offen (auch ungekauft), darin Gassen aus allen
   Moebeltypen - Hochregal, Verkaufsregal, Mittelgondel, kleines Regal,
   Kuehlschrank, Grossverbund-Regal, Tische, Gitterboxen, Eckregale.
   Jedes Produkt fuellt genau ein Fach bis zum Rand.
   Die Moebel gehoeren nicht zum Laden: keine Kunden, kein Einraeumer,
   kein Speicherstand. Was in der Halle steht, ist so lange weggeraeumt
   und kommt beim Beenden zurueck.
   ========================================================= */
let vpAn=false, vpRegale=[], vpWeg=[], vpEl=null, vpPlan=[], vpVorher=null;
const VP_FL={x0:-19.9,x1:-8.1,z0:-29.9,z1:-5.9}, VP_RAND=0.25, VP_GANG=1.8;
/* Reihen von Nord (Eingang) nach Sued. seite: wohin die Ware schaut
   (n = zum Eingang, s = nach Sueden); paar: steht Ruecken an Ruecken
   mit der vorigen Reihe. */
const VP_REIHEN=[
  {kinds:['hoch','hoch','hoch','hoch','hoch'],seite:'n'},
  {kinds:['standard','standard','standard','standard','standard'],seite:'s',paar:true},
  {kinds:['gondel','gondel','gondel','gondel','gondel']},
  {kinds:['gondel','gondel','gondel','gondel','gondel']},
  {kinds:['klein','klein','klein','klein','klein','klein','klein','klein','klein'],seite:'n'},
  {kinds:['kuehl','kuehl','kuehl','kuehl','kuehl','kuehl','kuehl','kuehl','kuehl'],seite:'s',paar:true},
  {kinds:['gross','gross','gross','gross','gross'],seite:'n'},
  {kinds:['tisch','tischgross','gitter','gitter2','gitter3'],frei:true},
  {kinds:['eck','eck'],seite:'n',wand:true}
];
/* Alle Produkte, die im Laden im Regal stehen koennen */
function vpProdukte(){ return ORDER.filter(t=>{ const p=P[t]; return p&&p.dims&&!p.noOrder&&!p.rezept; }); }
/* Stellplaetze ausrechnen: je Moebel x, z, Drehung */
function vpStellplaetze(){
  const out=[], X0=VP_FL.x0+VP_RAND, X1=VP_FL.x1-VP_RAND;
  let z=VP_FL.z1-VP_RAND-VP_GANG, vorT=0;
  VP_REIHEN.forEach((R,ri)=>{
    const Ks=R.kinds.map(k=>SHELFKIND[k]), breite=k=>k.fw||k.w, tiefe=k=>k.fd||k.d;
    const T=Math.max(...Ks.map(tiefe));
    if(R.wand) z=VP_FL.z0+VP_RAND+T;   /* letzte Reihe an die Suedwand */
    else if(ri>0) z-=R.paar?0.04:VP_GANG;
    const zc=z-T/2;
    /* gleichmaessig verteilen, Ecken an die Waende */
    const summe=Ks.reduce((a,k)=>a+breite(k),0), luft=(X1-X0-summe)/Math.max(1,Ks.length-1);
    let x=X0;
    Ks.forEach((K,i)=>{ const b=breite(K); let cx=x+b/2, cz=R.frei?z-tiefe(K)/2:zc, ry=R.seite==='s'?Math.PI:0;
      if(K.id==='eck'){ /* hintere Ecke in die Hallenecke */ cz=VP_FL.z0+VP_RAND+tiefe(K)/2; ry=i===0?0:-Math.PI/2; }
      else if(!K.art&&!K.frei&&R.seite!=='s') cz=z-T+K.d/2;    /* Ruecken an die Reihe dahinter */
      else if(!K.art&&!K.frei) cz=z-K.d/2;
      out.push({kind:K.id,x:cx,z:cz,ry,reihe:ri}); x+=b+(R.kinds.length>1?luft:0); });
    z-=T; vorT=T;
  });
  return out;
}
/* Fuellbild eines Fachs: Breite und Tiefe, wie viel davon Ware ist */
function vpFuellung(t,sh,lv){
  const L=layout(t,sh,lv); if(!L.cap) return 0;
  const K=kindOf(sh), R=modRaster(K);
  const fw=Math.min(1,L.cols*(L.w+L.g)/(R.B*R.MX)), fd=Math.min(1,L.rows*(L.d+L.g)/(R.T*R.MZ));
  return fw*fd;
}
/* Wer kommt wohin: zuerst die Faecher mit engem Wunsch (Kuehlschrank,
   Grossverbund, Tische, Gitterwanne), dann der Rest der Reihe nach in
   die Regale - nach Sparte und Art sortiert, so wie im Laden. */
const VP_SPARTE={f2:0,f1:1,zubehoer:2,essen:3,getraenke:4};
function vpVerteilen(regale){
  const frei=new Set(vpProdukte()), plan=[];
  const passt=(t,sh,lv)=>shelfAccepts(sh,t)&&layout(t,sh,lv).cap>0;
  const istWanne=(sh,lv)=>kindOf(sh).bau==='gitter'&&lv.li===kindOf(sh).lv.length-1;
  const nimm=(sh,lv,t)=>{ frei.delete(t); plan.push({sh,lv,t}); };
  /* bester Kandidat fuer ein Fach: der das Fach am vollsten macht */
  const bester=(sh,lv,wahl)=>{ let b=null, bw=-1; for(const t of frei){ if(!wahl(t)||!passt(t,sh,lv)) continue;
      const w=vpFuellung(t,sh,lv); if(w>bw){ bw=w; b=t; } } return b; };
  const alle=[]; regale.forEach(sh=>sh.levels.forEach(lv=>alle.push({sh,lv})));
  const passtStandard=t=>layout(t,{kind:'standard',levels:[]},{li:0}).cap>0;
  const wunsch=[
    [x=>kindOf(x.sh).cold, t=>P[t].kuehlpflicht],
    [x=>kindOf(x.sh).cold, t=>P[t].cold],
    [x=>x.sh.kind==='gross', t=>!passtStandard(t)],
    [x=>kindOf(x.sh).bau==='tisch', t=>!passtStandard(t)],
    [x=>istWanne(x.sh,x.lv), t=>!passtStandard(t)],
    [x=>istWanne(x.sh,x.lv), t=>P[t].shape==='rocketset'],
    [x=>kindOf(x.sh).bau==='tisch', t=>P[t].shape==='battery'||P[t].shape==='fan'],
    [x=>x.sh.kind==='gross', t=>P[t].shape==='battery'||P[t].shape==='assort'],
    /* die niedrigen Faecher unter der Gitterwanne: Kleinkram */
    [x=>kindOf(x.sh).bau==='gitter'&&!istWanne(x.sh,x.lv), t=>true]];
  const belegt=new Set();
  wunsch.forEach(([fach,wahl])=>{ alle.forEach(x=>{ if(belegt.has(x.lv)||!fach(x)) return; const t=bester(x.sh,x.lv,wahl); if(t){ nimm(x.sh,x.lv,t); belegt.add(x.lv); } }); });
  /* der Rest: sortiert, dann Fach fuer Fach; passt ein Produkt nicht
     (zu hoch), kommt das naechste passende */
  const rest=[...frei].sort((a,b)=>(VP_SPARTE[sparteVon(a)]-VP_SPARTE[sparteVon(b)])||String(P[a].shape).localeCompare(String(P[b].shape))||(P[a].lvl-P[b].lvl));
  alle.forEach(x=>{ if(belegt.has(x.lv)) return; const i=rest.findIndex(t=>frei.has(t)&&passt(t,x.sh,x.lv));
    if(i>=0){ nimm(x.sh,x.lv,rest[i]); belegt.add(x.lv); rest.splice(i,1); } });
  /* je Warenseite die hoechsten Packungen nach unten */
  const seiten=new Map(); plan.forEach(e=>{ const k=e.sh.i+'|'+(e.lv.face||0); if(!seiten.has(k)) seiten.set(k,[]); seiten.get(k).push(e); });
  seiten.forEach(L=>{ if(kindOf(L[0].sh).bau) return; const ts=L.map(e=>e.t).sort((a,b)=>P[b].dims[1]-P[a].dims[1]), lvs=L.map(e=>e.lv).sort((a,b)=>a.li-b.li);
    if(ts.every((t,i)=>passt(t,L[0].sh,lvs[i]))) L.forEach((e,i)=>{ e.lv=lvs[i]; e.t=ts[i]; }); });
  return {plan,uebrig:[...frei]};
}
function vpAufbauen(){
  const st=vpStellplaetze();
  vpRegale=st.map((s,i)=>{ const sh=createShelf(9000+i,{kind:s.kind,x:s.x,z:s.z,ry:s.ry});
    /* nicht Teil des Ladens: raus aus Regal- und Moebelliste, die
       Kollision bleibt, damit man nicht hindurchlaeuft */
    const k=shelves.indexOf(sh); if(k>=0) shelves.splice(k,1);
    const m=movables.indexOf(sh.mov); if(m>=0) movables.splice(m,1);
    sh.vp=true; return sh; });
  const V=vpVerteilen(vpRegale); vpPlan=V.plan;
  V.plan.forEach(e=>{ const n=layout(e.t,e.sh,e.lv).cap; for(let k=0;k<n;k++) if(!addToLevel(e.lv,e.t,1)) break; });
  return V;
}
function vpAbbauen(){
  vpRegale.forEach(sh=>{ sh.levels.forEach(lv=>{ while(lv.count>0) removeFromLevel(lv); }); dropFootprint(sh.mov); scene.remove(sh.g); });
  vpRegale=[]; vpPlan=[];
}
/* Was sonst in der Halle steht, raeumen wir so lange beiseite */
function vpImFeld(x,z){ return x>VP_FL.x0&&x<VP_FL.x1&&z>VP_FL.z0&&z<VP_FL.z1; }
function vpWegraeumen(){
  vpWeg=[];
  movables.forEach(m=>{ if(m.g.visible!==false&&vpImFeld(m.g.position.x,m.g.position.z)){ m.g.visible=false; dropFootprint(m); vpWeg.push({m}); } });
  floorBoxes.forEach(b=>{ if(b.mesh.visible&&vpImFeld(b.mesh.position.x,b.mesh.position.z)){ b.mesh.visible=false; vpWeg.push({b}); } });
}
function vpZurueck(){ vpWeg.forEach(w=>{ if(w.m){ w.m.g.visible=true; applyFootprint(w.m); } if(w.b) w.b.mesh.visible=true; }); vpWeg=[]; }
function vpSchalten(){ if(!FW_DEV) return; if(vpAn) vpAus(); else vpStart(); }
function vpStart(){
  if(vpAn) return;
  if(typeof vfAn!=='undefined'&&vfAn) vorfuehrungAus();
  if(fwTestAn) fwTestSchalten();
  vpVorher={x:pl.x,z:pl.z,yaw,pitch};
  vpAn=true; VP_ZONEN=['lager','lager_gross','lager_sued','lager_sued2']; applyZonen();
  vpWegraeumen();
  const V=vpAufbauen();
  if(V.uebrig.length) console.warn('Verpackungs-Vorfuehrung: kein Platz fuer',V.uebrig.join(', '));
  /* am Eingang der Halle, Blick in die erste Gasse */
  pl.x=(VP_FL.x0+VP_FL.x1)/2; pl.z=VP_FL.z1-0.8; yaw=0; pitch=-0.08;
  if(laptopOpen) closeLaptop(true); if(typeof handyOpen!=='undefined'&&handyOpen) closeHandy();
  vpZeigen(V);
  toast(`Verpackungs-Vorführung: ${V.plan.length} Produkte in ${vpRegale.length} Möbeln. B beendet.`,'money');
}
function vpAus(){
  if(!vpAn) return;
  vpAbbauen(); vpZurueck(); vpAn=false; VP_ZONEN=null; applyZonen();
  if(vpEl){ vpEl.remove(); vpEl=null; }
  /* zurueck, wo man vorher stand */
  if(vpVorher){ pl.x=vpVorher.x; pl.z=vpVorher.z; yaw=vpVorher.yaw; pitch=vpVorher.pitch; vpVorher=null; }
  toast('Verpackungs-Vorführung beendet.');
}
function vpZeigen(V){
  if(!vpEl){ vpEl=document.createElement('div'); vpEl.id='vpInfo';
    vpEl.style.cssText='position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:30;pointer-events:none;background:rgba(14,18,38,.82);color:#f2f5ff;border-radius:10px;padding:8px 16px;font:600 14px Barlow,Arial,sans-serif;text-align:center;border-top:3px solid #ffd23f';
    document.body.appendChild(vpEl); }
  vpEl.innerHTML=`<b style="font-size:17px;letter-spacing:.04em">VERPACKUNGS-VORFÜHRUNG</b><br>${V.plan.length} Produkte · je Fach ein Produkt · Name und Preis am Fach${V.uebrig.length?` · <span style="color:#ff8a7a">${V.uebrig.length} ohne Platz</span>`:''} · B beendet`;
}
function vpTaste(e){ if(e.code==='KeyB'&&!e.repeat){ vpAus(); return true; } return false; }

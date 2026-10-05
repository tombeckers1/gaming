/* =========================================================
   VERPACKUNGS-VORFUEHRUNG - NUR FUER DIE ENTWICKLUNG (Tom, 02.10.)
   "keine Feuerwerksexplosion, sondern die Verpackung ... immer in einer
   Reihe ein Produkt ... dass ich alle Regale mal sehe und wie die
   eingeraeumt sind ... wie im Supermarkt".
   03.10. (Tom, Foto vom iPhone: "ich kann nur die erste Reihe sehen,
   dahinter stehen ganz viele, aber da komme ich nicht hin ... gerne einen
   komplett neuen, leeren Raum"): die Vorfuehrung hat jetzt einen eigenen
   Ausstellungsraum weit ab vom Laden, wie ein Supermarkt aufgeteilt:
   vorn ein breiter Hauptgang, hinten ein Quergang, dazwischen sechs
   Regalzeilen in die Tiefe mit 2,2-m-Gaengen - jede Zeile ist von beiden
   Enden erreichbar, jede Warenseite steht an einem Gang. Darin alle
   Moebeltypen: Hochregal, Verkaufsregal, Mittelgondel, kleines Regal,
   Kuehlschrank, Grossverbund-Regal, Tische, Gitterboxen, Eckregale.
   Jedes Produkt fuellt genau ein Fach bis zum Rand, vorn steht sein Name.
   Sieben Kuehlschraenke fuer das Kuehlpflichtige, Getraenke offen im Regal.
   Die Moebel gehoeren nicht zum Laden: keine Kunden, kein Einraeumer,
   kein Speicherstand. Beenden: Knopf oben oder Taste B.
   ========================================================= */
let vpAn=false, vpRegale=[], vpEl=null, vpPlan=[], vpVorher=null;
/* 02.10. (Tom: "beim Starten haengt sich das Spiel auf ... Fehler ist
   aufgetreten", PC und iPhone): alle 225 Verpackungen auf einmal kosteten
   124 Megapixel Texturen (660 MB Grafik- + 500 MB Zwischenspeicher) und
   blockierten den Start 10 s. Jetzt: Verpackungsbilder der Vorfuehrung in
   reduzierter Aufloesung, keine Schatten, Aufbau Stueck fuer Stueck mit
   Anzeige, beim Beenden alles wieder frei. */
let vpFertig=false, vpLauf=0, vpNeu=new Set(), vpV=null, vpRaumG=null, vpRaumCols=[];
/* Aufloesung der Verpackungsbilder in der Vorfuehrung. 03.10.: die
   Leinwand wird nicht mehr nach dem Hochladen geleert - auf dem iPhone
   kamen die Packungen dann grau an (Safari uebernimmt das Bild offenbar
   erst spaeter). Dafuer etwas kleiner: 0,4 = rund 20 Megapixel. */
const VP_TEX=0.4;
/* Zeilen von West nach Ost. art: paar = zwei Regalreihen Ruecken an
   Ruecken (links schaut nach Westen, rechts nach Osten), insel = Gondeln
   (Ware auf beiden Seiten), einzeln = eine Reihe, frei = Tische und
   Gitterboxen mit Luft rundum. */
const VP_ZEILEN=[
  {art:'paar',links:['hoch','hoch','hoch','hoch','hoch'],rechts:['standard','standard','standard','standard','standard']},
  {art:'insel',kinds:['gondel','gondel','gondel','gondel','gondel']},
  {art:'insel',kinds:['gondel','gondel','gondel','gondel','gondel']},
  /* 03.10.: neue Raketen, Kugeln und Batterien - 24 Fächer mehr, sonst
     blieben die Getraenke (sie kommen zuletzt dran) ohne Platz */
  {art:'insel',kinds:['gondel','gondel','gondel']},
  /* 05.10.: Kleinfeuerwerk und neue Batterien - 252 Produkte, 3 mehr als
     Faecher; ein zehntes kleines Regal (3 Faecher), die Zeile wird dadurch
     nicht laenger als die rechte Seite */
  /* 05.10.: das letzte kleine Regal links ist jetzt das Kassenregal (fuenf
     Faecher) - Sturmfeuerzeuge, Streichhoelzer und Gehoerschutz duerfen
     nur dorthin */
  {art:'paar',links:['klein','klein','klein','klein','klein','klein','klein','klein','klein','kasse'],rechts:['kuehl','kuehl','kuehl','kuehl','kuehl','kuehl','kuehl','hoch','klein']},
  {art:'einzeln',kinds:['gross','gross','gross','gross','gross']},
  {art:'frei',kinds:['tisch','tischgross','gitter','gitter2','gitter3']}
];
const VP_GANG=2.2, VP_SEITE=2.5, VP_VORN=3.2, VP_HINTEN=3.0, VP_LUFT=1.0, VP_H=4.6;
/* Lage des Raums: weit weg von allem anderen (die Stadt reicht nicht so weit) */
const VP_URSPRUNG={x:230,z:-160};
const _vpLang=K=>K.fw||K.w, _vpTief=K=>K.fd||K.d;
function vpZeilenMass(Z){ const S=k=>SHELFKIND[k];
  if(Z.art==='paar') return {t:_vpTief(S(Z.links[0]))+_vpTief(S(Z.rechts[0]))+0.04, l:Math.max(Z.links.reduce((a,k)=>a+_vpLang(S(k)),0),Z.rechts.reduce((a,k)=>a+_vpLang(S(k)),0))};
  if(Z.art==='frei') return {t:Math.max(...Z.kinds.map(k=>_vpTief(S(k)))), l:Z.kinds.reduce((a,k)=>a+_vpLang(S(k)),0)+VP_LUFT*(Z.kinds.length-1)};
  return {t:Math.max(...Z.kinds.map(k=>_vpTief(S(k)))), l:Z.kinds.reduce((a,k)=>a+_vpLang(S(k)),0)}; }
/* Grundriss aus den Zeilen: Breite = Seitengaenge + Zeilen + Gaenge,
   Tiefe = Hauptgang + laengste Zeile + Quergang */
const VP_FL=(()=>{ const M=VP_ZEILEN.map(vpZeilenMass);
  const B=2*VP_SEITE+M.reduce((a,m)=>a+m.t,0)+VP_GANG*(M.length-1), T=VP_VORN+Math.max(...M.map(m=>m.l))+VP_HINTEN;
  return {x0:VP_URSPRUNG.x, x1:VP_URSPRUNG.x+B, z0:VP_URSPRUNG.z, z1:VP_URSPRUNG.z+T}; })();
/* Alle Produkte, die im Laden im Regal stehen koennen */
function vpProdukte(){ return ORDER.filter(t=>{ const p=P[t]; return p&&p.dims&&!p.noOrder&&!p.rezept; }); }
/* Stellplaetze: die Zeilen laufen vom Hauptgang (Norden, +z) nach
   Sueden. Ein Regal mit ry=+90 Grad schaut nach Osten, -90 nach Westen. */
function vpStellplaetze(){
  const out=[], F=VP_FL, zA=F.z1-VP_VORN;
  let x=F.x0+VP_SEITE;
  VP_ZEILEN.forEach((Z,zi)=>{ const M=vpZeilenMass(Z), xc=x+M.t/2;
    const reihe=(kinds,cx,ry)=>{ let z=zA; kinds.forEach(k=>{ const K=SHELFKIND[k], l=_vpLang(K); out.push({kind:k,x:cx,z:z-l/2,ry,zeile:zi}); z-=l+(Z.art==='frei'?VP_LUFT:0); }); };
    if(Z.art==='paar'){ const tl=_vpTief(SHELFKIND[Z.links[0]]), tr=_vpTief(SHELFKIND[Z.rechts[0]]);
      reihe(Z.links,x+tl/2,-Math.PI/2); reihe(Z.rechts,x+M.t-tr/2,Math.PI/2); }
    else if(Z.art==='einzeln') reihe(Z.kinds,xc,-Math.PI/2);
    else reihe(Z.kinds,xc,Math.PI/2);
    x+=M.t+VP_GANG; });
  /* Eckregale in die beiden hinteren Ecken */
  const E=SHELFKIND.eck, h=_vpTief(E)/2;
  out.push({kind:'eck',x:F.x0+h,z:F.z0+h,ry:0,zeile:-1});
  out.push({kind:'eck',x:F.x1-h,z:F.z0+h,ry:-Math.PI/2,zeile:-1});
  return out;
}
/* Der Raum selbst: einmal gebaut, danach nur ein- und ausgeblendet.
   Wie die Lagerhallen (halle): Ladenboden, Ladenwand, Decke, Leuchten,
   Dach; dazu Waende rundum mit Kollision. */
function vpRaumBauen(){
  if(vpRaumG){ vpRaumG.visible=true; vpRaumCols.forEach(c=>{ if(colliders.indexOf(c)<0) colliders.push(c); }); return; }
  const vorher=scene.children.length, cv=colliders.length;
  halle(null,VP_FL,{h:VP_H,aussen:{w:true,e:true,n:true,s:true},ax:3.4,az:3.4});
  /* alles Neue in eine Gruppe, damit es beim Beenden verschwindet */
  const neu=scene.children.slice(vorher); vpRaumG=new THREE.Group(); scene.add(vpRaumG); neu.forEach(o=>vpRaumG.add(o));
  /* die Waende stossen nur, solange die Vorfuehrung laeuft */
  vpRaumCols=colliders.slice(cv);
  /* unter Dach: kein Schnee im Raum */
  if(typeof dachBereiche==='function') dachBereiche().push({x0:VP_FL.x0-0.3,x1:VP_FL.x1+0.3,z0:VP_FL.z0-0.3,z1:VP_FL.z1+0.3,h:VP_H+0.4});
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
    [x=>kindOf(x.sh).kasse, t=>P[t].kasse==='nur'],
    [x=>kindOf(x.sh).kasse, t=>!!P[t].kasse],
    [x=>kindOf(x.sh).cold, t=>P[t].kuehlpflicht],
    /* 03.10. (Tom: "die Getraenke kannst du in normale Regale raeumen"):
       Getraenke stehen offen im Regal, im Kuehlschrank nur, was kuehl-
       pflichtig ist - und was dort an Faechern uebrig bleibt */
    [x=>kindOf(x.sh).cold, t=>P[t].cold&&sparteVon(t)!=='getraenke'],
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
  REGAL_TEX=0.5;
  try{ vpRegale=st.map((s,i)=>{ const sh=createShelf(9000+i,{kind:s.kind,x:s.x,z:s.z,ry:s.ry});
    /* nicht Teil des Ladens: raus aus Regal- und Moebelliste, die
       Kollision bleibt, damit man nicht hindurchlaeuft */
    const k=shelves.indexOf(sh); if(k>=0) shelves.splice(k,1);
    const m=movables.indexOf(sh.mov); if(m>=0) movables.splice(m,1);
    sh.vp=true; return sh; }); } finally { REGAL_TEX=1; }
  const V=vpVerteilen(vpRegale); vpPlan=V.plan;
  return V;
}
/* Namensschilder (03.10., Tom: "an den Produkten soll der Name stehen,
   sonst muss ich dich erst fragen, welches Produkt das ist - nur im
   Testraum"): je Fach ein weisses Schild vorn an der Ware mit dem vollen
   Produktnamen. Alle Namen liegen in EINEM Bild (Atlas), alle Schilder
   sind EIN Mesh - kostet ein Bild und einen Zeichenaufruf. */
let vpNamenM=null;
const VP_NAME={sp:5,w:400,h:64};
function vpNamenBauen(plan){
  vpNamenWeg(); if(!plan.length) return;
  const N=VP_NAME, zeilen=Math.ceil(plan.length/N.sp), W=N.sp*N.w, H=zeilen*N.h;
  const tx=tex(W,H,(g)=>{ plan.forEach((e,i)=>{ const x=(i%N.sp)*N.w, y=Math.floor(i/N.sp)*N.h, nm=String(P[e.t].name||e.t);
    g.fillStyle='#fbfbf7'; g.fillRect(x,y,N.w,N.h); g.fillStyle='#ffd23f'; g.fillRect(x,y,9,N.h);
    g.fillStyle='#0e1226'; g.textAlign='left'; g.textBaseline='middle';
    const k=nm.indexOf(' · '), a=k>0?nm.slice(0,k):nm, b=k>0?nm.slice(k+3):'';
    const pass=(txt,px,bold)=>{ g.font=(bold?'700 ':'500 ')+px+'px Barlow, Arial, sans-serif'; const m=g.measureText(txt).width, max=N.w-26; if(m>max){ g.font=(bold?'700 ':'500 ')+Math.floor(px*max/m)+'px Barlow, Arial, sans-serif'; } };
    if(b){ pass(a,29,true); g.fillText(a,x+17,y+20); g.fillStyle='#3a4160'; pass(b,23,false); g.fillText(b,x+17,y+47); }
    else { pass(a,31,true); g.fillText(a,x+17,y+N.h/2+1); } }); });
  tx.anisotropy=8;
  const teile=[], v=new THREE.Vector3();
  plan.forEach((e,i)=>{ const hit=e.lv.hit; if(!hit) return; hit.updateWorldMatrix(true,false);
    const pa=hit.geometry.parameters||{}, bw=pa.width||0.8, bh=pa.height||0.3, bd=pa.depth||0.4;
    const w=Math.min(bw*0.92,0.78), h=w*N.h/N.w;
    const geo=new THREE.PlaneGeometry(w,h), uv=geo.attributes.uv;
    const u0=(i%N.sp)/N.sp, u1=u0+1/N.sp, v1=1-Math.floor(i/N.sp)/zeilen, v0=v1-1/zeilen;
    for(let j=0;j<uv.count;j++){ uv.setXY(j,uv.getX(j)?u1:u0,uv.getY(j)?v1:v0); }
    const m=new THREE.Matrix4().makeTranslation(0,-bh/2+h/2+0.012,bd/2+0.014);
    teile.push({geo,m:new THREE.Matrix4().multiplyMatrices(hit.matrixWorld,m)}); });
  /* gedaempftes Weiss: reines Weiss ueberstrahlt im Leuchthof */
  vpNamenM=new THREE.Mesh(merge(teile),new THREE.MeshBasicMaterial({map:tx,color:0xc4c4c4,toneMapped:false}));
  vpNamenM.name='vpNamen'; vpNamenM.renderOrder=2; scene.add(vpNamenM);
}
function vpNamenWeg(){ if(!vpNamenM) return; scene.remove(vpNamenM); vpNamenM.geometry.dispose(); if(vpNamenM.material.map) vpNamenM.material.map.dispose(); vpNamenM.material.dispose(); vpNamenM=null; }
/* ein Produkt einraeumen; fehlt sein Modell noch, entsteht es sparsam */
function vpEinraeumen(e){
  if(!poolDa(e.t)){ TEX_FAKTOR=VP_TEX; let pl; try{ pl=pools[e.t]; } finally { TEX_FAKTOR=GFX_START.tex; }
    pl.vp=true; vpNeu.add(e.t);
    pl.meshes.forEach(m=>{ m.castShadow=false;
      const ms=Array.isArray(m.material)?m.material:[m.material];
      ms.forEach(mt=>{ const tx=mt&&mt.map; if(tx&&tx.image) tx.__px=tx.image.width*tx.image.height; }); }); }
  addViele(e.lv,e.t,layout(e.t,e.sh,e.lv).cap);
}
/* Stueck fuer Stueck: je Bild hoechstens ~25 ms, dann darf das Spiel zeichnen */
function vpFuellen(lauf,i){
  if(!vpAn||lauf!==vpLauf) return;
  const t0=performance.now();
  while(i<vpPlan.length&&performance.now()-t0<25){ vpEinraeumen(vpPlan[i]); i++; }
  if(i<vpPlan.length){ vpZeigen(vpV,i); setTimeout(()=>vpFuellen(lauf,i),16); return; }
  vpFertig=true; vpZeigen(vpV);
  toast(`Verpackungs-Vorführung: ${vpPlan.length} Produkte in ${vpRegale.length} Möbeln. B beendet.`,'money');
}
function vpAbbauen(){
  vpRegale.forEach(sh=>{ sh.levels.forEach(leereFach); dropFootprint(sh.mov); scene.remove(sh.g);
    /* eigene Texturen und Geometrien freigeben - geteilte Materialien bleiben */
    sh.g.traverse(o=>{ if(!o.isMesh) return; const m=o.material;
      if(m&&m.map&&(sh.levels.some(lv=>lv.tex===m.map)||m.map===sh.headTex)){ m.map.dispose(); m.dispose(); }
      if((sh.gestelle||[]).includes(o)) o.geometry.dispose(); }); });
  vpNamenWeg();
  vpRegale=[]; vpPlan=[];
  /* Modelle, die nur fuer die Vorfuehrung entstanden sind, wieder weg */
  vpNeu.forEach(t=>{ if(poolDa(t)&&pools[t].h.length===0) poolWeg(t); }); vpNeu=new Set();
}
function vpSchalten(){ if(!FW_DEV) return; if(vpAn) vpAus(); else vpStart(); }
function vpStart(){
  if(vpAn) return;
  if(typeof vfAn!=='undefined'&&vfAn) vorfuehrungAus();
  if(fwTestAn) fwTestSchalten();
  vpVorher={x:pl.x,z:pl.z,yaw,pitch};
  vpAn=true; vpRaumBauen(); SPIEL_RAUM=VP_FL;
  vpFertig=false; vpLauf++;
  const V=vpAufbauen(); vpV=V;
  vpNamenBauen(V.plan);
  if(V.uebrig.length) console.warn('Verpackungs-Vorfuehrung: kein Platz fuer',V.uebrig.join(', '));
  /* im Hauptgang am Anfang des ersten Gangs, Blick hinein (nach Sueden) */
  pl.x=VP_FL.x0+VP_SEITE+vpZeilenMass(VP_ZEILEN[0]).t+VP_GANG/2; pl.z=VP_FL.z1-1.3; yaw=0; pitch=-0.05;
  if(laptopOpen) closeLaptop(true); if(typeof handyOpen!=='undefined'&&handyOpen) closeHandy();
  vpZeigen(V,0);
  const lauf=vpLauf; setTimeout(()=>vpFuellen(lauf,0),30);
}
function vpAus(){
  if(!vpAn) return;
  vpLauf++; vpFertig=false;
  vpAbbauen(); vpAn=false; SPIEL_RAUM=null; if(vpRaumG) vpRaumG.visible=false; vpRaumCols.forEach(dropCol);
  if(vpEl){ vpEl.remove(); vpEl=null; }
  /* zurueck, wo man vorher stand */
  if(vpVorher){ pl.x=vpVorher.x; pl.z=vpVorher.z; yaw=vpVorher.yaw; pitch=vpVorher.pitch; vpVorher=null; }
  toast('Verpackungs-Vorführung beendet.');
}
/* Anzeige oben: schmal, mit Knopf zum Beenden (am iPhone gibt es keine
   Taste B). Nach dem Einraeumen schrumpft sie auf eine Zeile. */
function vpZeigen(V,bis){
  if(!vpEl){ vpEl=document.createElement('div'); vpEl.id='vpInfo';
    vpEl.style.cssText='position:fixed;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);z-index:30;max-width:min(92vw,560px);background:rgba(14,18,38,.84);color:#f2f5ff;border-radius:10px;padding:6px 10px 6px 14px;font:600 13px Barlow,Arial,sans-serif;display:flex;gap:10px;align-items:center;border-top:3px solid #ffd23f';
    document.body.appendChild(vpEl); }
  const txt=bis!==undefined?`Regale werden eingeräumt … ${bis} / ${V.plan.length}`:`${V.plan.length} Produkte · ${vpRegale.length} Möbel${V.uebrig.length?` · <span style="color:#ff8a7a">${V.uebrig.length} ohne Platz</span>`:''}`;
  vpEl.innerHTML=`<span><b style="letter-spacing:.04em">VERPACKUNGS-VORFÜHRUNG</b> · ${txt}</span><button id="vpAusKnopf" style="pointer-events:auto;font:700 13px Barlow,Arial,sans-serif;background:#ffd23f;color:#0e1226;border:0;border-radius:7px;padding:6px 10px;cursor:pointer">Beenden (B)</button>`;
  const k=vpEl.querySelector('#vpAusKnopf'); k.onclick=e=>{ e.stopPropagation(); vpAus(); };
  k.addEventListener('touchend',e=>{ e.preventDefault(); e.stopPropagation(); vpAus(); },{passive:false});
}
function vpTaste(e){ if(e.code==='KeyB'&&!e.repeat){ vpAus(); return true; } return false; }

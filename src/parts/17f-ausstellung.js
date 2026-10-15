/* =========================================================
   VERPACKUNGS-VORFUEHRUNG 2.0 (AUSSTELLUNG) - NUR FUER DIE ENTWICKLUNG (Tom, 15.10.2026)
   "Ich moechte jede einzelne Verpackung genau anschauen und freigeben. Stell mir Verkaufstische hin
   und jedes Produkt EINMAL drauf, ein einziges Stueck als Ausstellungsstueck, mit dem Namen davon.
   Dann sage ich dir, welche Verpackung nicht passt. Die bisherige Vorfuehrung bleibt drin."
   Eigener Raum weit ab von Karte und Vorfuehrung 1 (17c): Reihen von Verkaufstischen (Bauteil
   bk.verkaufstisch, Optik wie die Laden-Tische), nach Kategorien gruppiert, breite Gaenge. Jedes Produkt
   steht genau 1x als Einzelpackung in natuerlicher Lage auf einem Tisch, davor ein Schild: laufende
   Nummer, Name, Kategorie, Level (bk.schildAtlas: alle Schilder = 2 Draw-Calls, 1 Bild). Nummern
   stabil: nach Kategorie, dann Produkt-ID sortiert ("Nr. 47 passt nicht").
   Freigabe: Aktion-Taste (E / Aktion-Knopf) auf ein Stueck: offen -> passt -> passt nicht -> offen,
   das Schild faerbt sich blau/gruen/rot. Stand in localStorage. Knopf "Liste" (Taste L): die
   Nicht-Freigegebenen als Text zum Kopieren. Beenden: Knopf oder B (alles wieder weg).
   Leistung: Packungen aus den Pools (eine Instanz je Produkt), ausserhalb des Blickfelds und weiter
   als VP2_SICHT m weg nicht gezeichnet (wie die Regale), Texturen bis VP2_TEX.
   ========================================================= */
const VP2_KEY='bb_vp2_freigabe_v1';
const VP2_TEX=Math.min(GFX_START.tex,0.75);        /* Aufloesung der Packungsbilder (Tom prueft sie genau) */
const VP2_SICHT=16;                               /* weiter weg wird die Packung nicht gezeichnet */
const VP2_H=4.0, VP2_WEST=3.6, VP2_OST=2.6, VP2_NORD=3.2, VP2_GANG=2.6, VP2_TISCH=2.0, VP2_FUGE=0.1, VP2_REIHE=8, VP2_MAXN=3;
const VP2_NAMEN=['offen','✓ passt','✗ passt nicht'];
/* Kategorien in Reihenfolge der Ausstellung; Name gross auf dem Reihenschild */
const VP2_KATS=[['bat','Batterien'],['rak','Raketen'],['kug','Kugelbomben'],['fon','Fontänen & Vulkane'],['boe','Böller'],['bod','Bodeneffekte & Sonstiges'],['sor','Sortimente'],['f1','Kleinfeuerwerk F1'],['zub','Zubehör'],['ess','Essen'],['get','Getränke']];
const VP2_KATNAME={}, VP2_KATIDX={}; VP2_KATS.forEach(([k,n],i)=>{ VP2_KATNAME[k]=n; VP2_KATIDX[k]=i; });
let vp2An=false, vp2Lauf=0, vp2Fertig=false, vp2Liste=[], vp2Reihen=[], vp2FL=null, vp2G=null, vp2Tische=null, vp2Atlas=null, vp2Cols=[], vp2Neu=new Set();
let vp2El=null, vp2PanelEl=null, vp2ListeOffen=false, vp2Vorher=null, vp2Stat={}, vp2RaumG=null, vp2RaumCols=[], vp2RaumFL=null, vp2Frame=0, vp2Modus=2, vp2ResetArm=false, vp2Mess={};
let vp2HitGeo=null, vp2Banner=[];
/* Farben der Bedienelemente: aus der Palette (MAT.css) */
const vp2C=()=>({blau:MAT.css('nachtblau',0.88),gold:MAT.css('schildgold'),weiss:MAT.css('weiss'),gruen:MAT.css('signalgruen'),rot:MAT.css('signalrot'),grau:MAT.css('graphit'),dunkel:MAT.css('tiefschwarz'),dunkel2:MAT.css('tiefschwarz',0.97)});
function vp2Lesen(){ try{ const s=JSON.parse(localStorage.getItem(VP2_KEY)||'{}'); return s&&typeof s==='object'?s:{}; }catch(e){ return {}; } }
function vp2Speichern(){ try{ localStorage.setItem(VP2_KEY,JSON.stringify(vp2Stat)); }catch(e){} }
/* Kategorie eines Produkts: Sparte + Form (die Daten haben kein eigenes Feld) */
function vp2KatVon(t){
  const p=P[t], sp=sparteVon(t), sh=p.shape;
  if(sp==='f1') return 'f1';
  if(sp==='zubehoer') return 'zub'; if(sp==='essen') return 'ess'; if(sp==='getraenke') return 'get';
  if(sh==='battery'||sh==='fan'||(typeof istBatterie==='function'&&istBatterie(t))) return 'bat';
  if(sh==='rocketset') return 'rak';
  if(sh==='shell'||sh==='atombombe'||sh==='fass') return 'kug';
  if(sh==='fountainset'||sh==='cylinder') return 'fon';
  if(sh==='tubepack') return 'boe';
  if(sh==='assort') return 'sor';
  return 'bod';
}
/* Alle Produkte des Spiels mit Verpackung: die der Vorfuehrung 1 (vpProdukte) und die nicht bestellbaren (Gravur-Rakete), ohne eigene Rezepte */
function vp2Produkte(){ return ORDER.filter(t=>{ const p=P[t]; return p&&p.dims&&!p.rezept&&!p.eigen; }); }
/* Nummern und Reihenfolge: Kategorie, dann Produkt-ID - stabil, solange das Sortiment gleich bleibt */
function vp2Sammeln(){
  const L=vp2Produkte().map(t=>{ const p=P[t]; return {t,kat:vp2KatVon(t),w:p.dims[0],hh:p.dims[1],d:p.dims[2],stat:0,hd:null}; });
  L.sort((a,b)=>(VP2_KATIDX[a.kat]-VP2_KATIDX[b.kat])||(a.t<b.t?-1:a.t>b.t?1:0));
  L.forEach((e,i)=>{ e.nr=i+1; e.i=i; e.stat=vp2Stat[e.t]|0; });
  return L;
}
/* Tische und Reihen: je Tisch hoechstens VP2_MAXN Stuecke, jedes mit Platz fuer sein Schild (0,44 m) und 0,2 m Luft */
function vp2Platz(e){ return Math.max(e.w+0.2,VP2_SCHILD.b+0.08); }
function vp2Planen(L){
  const reihen=[], tischArt=e=>e.d>SHELFKIND.tisch.d-0.30?'tischgross':'tisch';
  VP2_KATS.forEach(([kat])=>{
    const es=L.filter(e=>e.kat===kat); if(!es.length) return;
    const tische=[]; let T=null;
    es.forEach(e=>{ const art=tischArt(e), pl=vp2Platz(e);
      if(!T||T.art!==art||T.es.length>=VP2_MAXN||T.sum+pl>VP2_TISCH+1e-6){ T={art,es:[],sum:0}; tische.push(T); }
      T.es.push(e); T.sum+=pl; });
    /* gleichmaessig auf Reihen verteilen */
    const n=Math.ceil(tische.length/VP2_REIHE), je=Math.ceil(tische.length/n);
    for(let r=0;r<n;r++){ const ts=tische.slice(r*je,(r+1)*je); if(ts.length) reihen.push({kat,tische:ts,teil:r,von:n}); }
  });
  return reihen;
}
/* Grundriss und Lage aller Teile */
function vp2Anordnen(reihen){
  const F={x0:VP_URSPRUNG.x,x1:0,z0:0,z1:VP_FL.z0-30};
  let T=VP2_NORD, lang=0;
  reihen.forEach(R=>{ R.tiefe=Math.max(...R.tische.map(t=>SHELFKIND[t.art].d)); R.lang=R.tische.length*(VP2_TISCH+VP2_FUGE)-VP2_FUGE; lang=Math.max(lang,R.lang); T+=R.tiefe+VP2_GANG; });
  F.x1=F.x0+VP2_WEST+lang+VP2_OST; F.z0=F.z1-T;
  let zF=F.z1-VP2_NORD;
  reihen.forEach(R=>{ R.zF=zF; R.x0=F.x0+VP2_WEST;
    R.tische.forEach((tb,k)=>{ const K=SHELFKIND[tb.art]; tb.x=R.x0+VP2_TISCH/2+k*(VP2_TISCH+VP2_FUGE); tb.z=zF-K.d/2; tb.y=K.lv[K.lv.length-1]; tb.K=K;
      const extra=(VP2_TISCH-tb.sum)/tb.es.length; let xl=tb.x-VP2_TISCH/2;
      tb.es.forEach(e=>{ const pl=vp2Platz(e)+extra; e.x=xl+pl/2; xl+=pl; e.y=tb.y; e.z=zF-0.20-e.d/2; e.zFront=zF; e.tisch=tb; e.reihe=R; }); });
    zF-=R.tiefe+VP2_GANG; });
  return F;
}
/* Der Raum: einmal gebaut, danach nur ein- und ausgeblendet (wie 17c) */
function vp2RaumBauen(F){
  const gleich=vp2RaumFL&&vp2RaumFL.x0===F.x0&&vp2RaumFL.x1===F.x1&&vp2RaumFL.z0===F.z0&&vp2RaumFL.z1===F.z1;
  if(vp2RaumG&&gleich){ vp2RaumG.visible=true; vp2RaumCols.forEach(c=>{ if(colliders.indexOf(c)<0) colliders.push(c); }); return; }
  if(vp2RaumG){ scene.remove(vp2RaumG); vp2RaumCols.forEach(dropCol); vp2RaumG=null; }
  const vorher=scene.children.length, cv=colliders.length;
  halle(null,F,{h:VP2_H,aussen:{w:true,e:true,n:true,s:true},ax:3.4,az:3.4});
  const neu=scene.children.slice(vorher); vp2RaumG=new THREE.Group(); scene.add(vp2RaumG); neu.forEach(o=>vp2RaumG.add(o));
  vp2RaumCols=colliders.slice(cv); vp2RaumFL={x0:F.x0,x1:F.x1,z0:F.z0,z1:F.z1};
  if(typeof dachBereiche==='function') dachBereiche().push({x0:F.x0-0.3,x1:F.x1+0.3,z0:F.z0-0.3,z1:F.z1+0.3,h:VP2_H+0.4});
}
/* ---------- Schilder ---------- */
const VP2_ZELLE={w:320,h:116}, VP2_SCHILD={b:0.44,h:0.44*116/320,kipp:0.62};
const VP2_STATUS={w:320,h:28,hm:VP2_SCHILD.h*28/116};
function vp2SchildMalen(g,i,w,h){
  const e=vp2Liste[i], p=P[e.t], nm=String(p.name||e.t), k=nm.indexOf(' · '), a=k>0?nm.slice(0,k):nm, b=k>0?nm.slice(k+3):'';
  g.textBaseline='middle'; g.textAlign='center'; g.fillStyle=MAT.css('weiss');
  g.font=BUN(e.nr>99?42:50); g.fillText(String(e.nr),46,41);
  g.fillStyle=MAT.css('weiss',0.55); g.fillRect(93,12,2,66);
  g.textAlign='left'; g.fillStyle=MAT.css('weiss'); fitFont(g,a,w-112,36,BAR); g.fillText(a,104,20);
  g.fillStyle=MAT.css('cremeweiss'); if(b){ fitFont(g,b,w-112,27,BAR); g.fillText(b,104,48); }
  g.fillStyle=MAT.css('aluminium'); g.font=BAR(24); g.fillText(VP2_KATNAME[e.kat].replace(/ & .*/,'')+(p.lvl!==undefined?` · Level ${p.lvl}`:''),104,74);
}
function vp2StatusMalen(art){ return (g,w,h)=>{
  g.fillStyle=MAT.css(['anthrazit','tannengruen','feuerrot'][art]); g.fillRect(0,0,w,h);
  g.fillStyle=MAT.css('weiss'); g.strokeStyle=MAT.css('weiss'); g.lineWidth=4; g.lineCap='round'; g.lineJoin='round';
  if(art===1){ g.beginPath(); g.moveTo(14,15); g.lineTo(21,22); g.lineTo(34,6); g.stroke(); }
  if(art===2){ g.beginPath(); g.moveTo(16,7); g.lineTo(32,21); g.moveTo(32,7); g.lineTo(16,21); g.stroke(); }
  g.textBaseline='middle'; g.textAlign='left'; g.font=BAR(20);
  g.fillText(['OFFEN · Aktion zum Prüfen','PASST','PASST NICHT'][art],art?46:14,15); }; }
/* ---------- Aufstellen ---------- */
function vp2Aufstellen(F){
  vp2G=new THREE.Group(); scene.add(vp2G);
  /* Tische: alle in einem Mesh */
  const tl=[]; vp2Reihen.forEach(R=>R.tische.forEach(tb=>{ tl.push({x:tb.x,z:tb.z,kind:tb.art});
    vp2Cols.push(col(tb.x-VP2_TISCH/2-0.04,tb.x+VP2_TISCH/2+0.04,tb.z-tb.K.d/2-0.04,tb.z+tb.K.d/2+0.04)); }));
  vp2Tische=bk.verkaufstisch({tische:tl,parent:vp2G});
  /* Schilder: alle in einem Atlas, schraeg auf dem Tisch vor dem Stueck */
  const S=VP2_SCHILD, schilde=vp2Liste.map(e=>{ const zc=e.zFront-0.02-S.h/2*Math.cos(S.kipp), yc=e.y+S.h/2*Math.sin(S.kipp)+0.008;
    return {m:tm(e.x,yc,zc,-S.kipp,0,0),b:S.b,h:S.h}; });
  vp2Atlas=bk.schildAtlas({schilde,zelle:VP2_ZELLE,spalten:12,malen:vp2SchildMalen,status:{w:VP2_STATUS.w,h:VP2_STATUS.h,hm:VP2_STATUS.hm,ton:['nachtblau','signalgruen','signalrot'],malen:[0,1,2].map(vp2StatusMalen)},start:vp2Liste.map(e=>e.stat),skalaMin:0.75,parent:vp2G});
  /* Trefferflaechen (unsichtbar): Packung + Schild */
  if(!vp2HitGeo) vp2HitGeo=new THREE.BoxGeometry(1,1,1);
  vp2Liste.forEach(e=>{ const hw=Math.max(e.w+0.04,S.b+0.02), hh=Math.max(e.hh,0.22)+0.04, z1=e.zFront, z0=e.z-e.d/2-0.02;
    const m=new THREE.Mesh(vp2HitGeo,hitM); m.scale.set(hw,hh,z1-z0); m.position.set(e.x,e.y+hh/2,(z0+z1)/2);
    m.userData={kind:'vpstueck',ref:e}; vp2G.add(m); e.hit=m; });
  /* Reihenschilder: haengen am westlichen Reihenanfang, von beiden Seiten lesbar */
  const SM=bk.sammler({klasse:'lackMetall'}), hy=2.85;
  vp2Reihen.forEach(R=>{ const nr0=R.tische[0].es[0].nr, nr1=R.tische[R.tische.length-1].es[R.tische[R.tische.length-1].es.length-1].nr, n=R.tische.reduce((a,t)=>a+t.es.length,0);
    const name=VP2_KATNAME[R.kat].toUpperCase()+(R.von>1?`  ${R.teil+1}/${R.von}`:''), zc=R.zF-R.tiefe/2, xs=R.x0-0.55;
    for(const s of [-1,1]) vp2Banner.push(bk.schild(vp2G,{text:name,unter:`Nr. ${nr0}–${nr1} · ${n} Produkte`,b:2.3,h:0.7,px:1.4,x:xs+s*0.02,y:hy,z:zc,ry:s>0?Math.PI/2:-Math.PI/2}));
    for(const dz of [-0.9,0.9]) SM.box(0.03,VP2_H-hy-0.35,0.03,xs,hy+(VP2_H-hy-0.35)/2+0.35,zc+dz,MAT.farbe('silbergrau'),'lackMetall'); });
  SM.fertig(vp2G,{schatten:false});
}
/* ---------- Einraeumen (Stueck fuer Stueck, jedes Bild hoechstens ~25 ms) ---------- */
function vp2Stueck(e){
  try{
    if(!poolDa(e.t)){ TEX_FAKTOR=VP2_TEX; let pl; try{ pl=pools[e.t]; } finally { TEX_FAKTOR=GFX_START.tex; }
      pl.vp=true; vp2Neu.add(e.t); pl.meshes.forEach(m=>{ m.castShadow=false; }); }
    e.hd=pools[e.t].add(mx(e.x,e.y,e.z,0));
  }catch(err){ e.fehler=String(err&&err.message||err); console.warn('Ausstellung: Modell fehlt fuer',e.t,e.fehler); }
}
function vp2Fuellen(lauf,i){
  if(!vp2An||lauf!==vp2Lauf) return;
  const t0=performance.now();
  while(i<vp2Liste.length&&performance.now()-t0<25){ vp2Stueck(vp2Liste[i]); i++; }
  if(i<vp2Liste.length){ vp2Zeigen(i); setTimeout(()=>vp2Fuellen(lauf,i),16); return; }
  vp2Fertig=true; vp2Mess.fertigMs=Math.round(performance.now()-vp2Mess.t0); vp2Sicht(true); vp2Zeigen();
  toast(`Ausstellung: ${vp2Liste.length} Produkte auf ${vp2Tische.anzahl} Tischen. E prüft, L Liste, B beendet.`,'money');
}
/* ---------- Sichtbarkeit: nur zeichnen, was im Bild und nah ist ---------- */
const _vp2F=typeof THREE.Frustum==='function'?new THREE.Frustum():null, _vp2M=new THREE.Matrix4(), _vp2S=new THREE.Sphere(new THREE.Vector3(),1);
function vp2Sicht(erzwingen){
  if(!_vp2F||!vp2An) return;
  camera.updateMatrixWorld(); _vp2M.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse); _vp2F.setFromProjectionMatrix(_vp2M);
  let n=0;
  for(const e of vp2Liste){ if(!e.hd) continue;
    _vp2S.center.set(e.x,e.y+e.hh/2,e.z); _vp2S.radius=Math.max(e.w,e.hh,e.d)*0.75+0.15;
    const sicht=Math.abs(e.x-pl.x)<VP2_SICHT&&Math.abs(e.z-pl.z)<VP2_SICHT&&_vp2F.intersectsSphere(_vp2S), pool=e.hd.pool;
    if(sicht){ n++; if(e.hd.versteckt) pool.zeige(e.hd); } else if(!e.hd.versteckt) pool.verstecke(e.hd); }
  vp2Mess.sichtbar=n;
}
function vp2Takt(){ if(!vp2An) return; if(++vp2Frame%3===0) vp2Sicht(); }
/* ---------- Freigabe ---------- */
function vp2Weiter(e){
  e.stat=(e.stat+1)%3; if(e.stat) vp2Stat[e.t]=e.stat; else delete vp2Stat[e.t];
  if(vp2Atlas) vp2Atlas.set(e.i,e.stat); vp2Speichern(); vp2Zeigen();
  try{ sfx.pop(); }catch(x){}
  toast(`Nr. ${e.nr} · ${P[e.t].short||P[e.t].name}: ${VP2_NAMEN[e.stat]}`,e.stat===2?'bad':e.stat===1?'money':undefined);
  if(vp2ListeOffen) vp2PanelFuellen();
}
function vp2Zaehlen(){ const z=[0,0,0]; vp2Liste.forEach(e=>z[e.stat]++); return z; }
function vp2Prompt(e){ const n=(e.stat+1)%3; return {t:`Nr. ${e.nr} · ${P[e.t].name} — ${VP2_NAMEN[e.stat]} · ${COARSE?'Aktion':'E'}: ${VP2_NAMEN[n]}`,a:true}; }
/* Text zum Kopieren: modus 2 = nicht freigegeben, 1 = passt, 0 = offen */
function vp2ListeText(modus){
  const L=vp2Liste.filter(e=>e.stat===modus), kopf=['Noch offen','Freigegeben (passt)','Nicht freigegeben (passt nicht)'][modus];
  return `${kopf}: ${L.length} von ${vp2Liste.length}\n`+L.map(e=>`Nr. ${e.nr} · ${P[e.t].name} · ${VP2_KATNAME[e.kat]} · ${e.t}`).join('\n');
}
/* ---------- Anzeige oben + Listenfenster ---------- */
function vp2Zeigen(bis){
  if(!vp2An) return;
  if(!vp2El){ vp2El=document.createElement('div'); vp2El.id='vp2Info';
    const c=vp2C(); vp2El.style.cssText=`position:fixed;left:50%;top:${COARSE?'calc(env(safe-area-inset-top) + 50px)':'max(10px,env(safe-area-inset-top))'};transform:translateX(-50%);z-index:30;width:max-content;max-width:94vw;box-sizing:border-box;background:${c.blau};color:${c.weiss};border-radius:10px;padding:5px 6px 5px 10px;font:600 ${COARSE?12:13}px Barlow,Arial,sans-serif;display:flex;${COARSE?'':'flex-wrap:wrap;'}gap:8px 8px;align-items:center;border-top:3px solid ${c.gold}`;
    document.body.appendChild(vp2El); }
  const z=vp2Zaehlen(), c=vp2C(), btn=`pointer-events:auto;font:700 ${COARSE?15:13}px Barlow,Arial,sans-serif;border:0;border-radius:8px;padding:${COARSE?'11px 15px':'7px 11px'};cursor:pointer;`;
  const txt=bis!==undefined?`Aufbau … ${bis} / ${vp2Liste.length}`:`${COARSE?'':vp2Liste.length+' Produkte · '}<span style="color:${c.gruen};filter:brightness(1.5)">✓ ${z[1]}</span> · <span style="color:${c.rot};filter:brightness(1.4)">✗ ${z[2]}</span> · offen ${z[0]}`;
  vp2El.innerHTML=`<span style="flex:1 1 auto;white-space:nowrap">${COARSE?'':'<b style="letter-spacing:.04em">AUSSTELLUNG 2.0</b> · '}${txt}</span><button id="vp2ListeKnopf" style="${btn}background:${c.grau};color:${c.weiss}">${COARSE?'Liste':'Liste (L)'}</button><button id="vp2AusKnopf" style="${btn}background:${c.gold};color:${c.dunkel}">${COARSE?'Ende':'Beenden (B)'}</button>`;
  const tipp=(id,f)=>{ const k=vp2El.querySelector(id); k.onclick=e=>{ e.stopPropagation(); f(); }; k.addEventListener('touchend',e=>{ e.preventDefault(); e.stopPropagation(); f(); },{passive:false}); };
  tipp('#vp2ListeKnopf',vp2ListeSchalten); tipp('#vp2AusKnopf',vp2Aus);
}
function vp2ListeSchalten(){ if(vp2ListeOffen) vp2ListeZu(); else vp2ListeAuf(); }
function vp2ListeAuf(){
  if(!vp2An||vp2ListeOffen) return;
  vp2ListeOffen=true; paused=true; vp2ResetArm=false; if(locked) document.exitPointerLock(); for(const k in keys) keys[k]=false; mouseDown=false; touchAct=false;
  if(!vp2PanelEl){ vp2PanelEl=document.createElement('div'); vp2PanelEl.id='vp2Panel';
    const c=vp2C(); vp2PanelEl.style.cssText=`position:fixed;inset:0;z-index:45;background:${c.dunkel2};color:${c.weiss};font:600 15px Barlow,Arial,sans-serif;display:flex;flex-direction:column;gap:10px;padding:max(14px,env(safe-area-inset-top)) 14px 14px;box-sizing:border-box`;
    document.body.appendChild(vp2PanelEl); }
  vp2PanelFuellen();
}
function vp2PanelFuellen(){
  if(!vp2PanelEl) return;
  const z=vp2Zaehlen(), c=vp2C(), btn=`font:700 15px Barlow,Arial,sans-serif;border:0;border-radius:8px;padding:${COARSE?'13px 16px':'10px 14px'};cursor:pointer;`, tab=(m,n,t)=>`<button data-m="${m}" style="${btn}background:${vp2Modus===m?c.gold:c.grau};color:${vp2Modus===m?c.dunkel:c.weiss}">${t} ${n}</button>`;
  vp2PanelEl.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><b style="letter-spacing:.04em;flex:1 1 200px">AUSSTELLUNG 2.0 · FREIGABE</b>${tab(2,z[2],'✗ passt nicht')}${tab(0,z[0],'offen')}${tab(1,z[1],'✓ passt')}</div>`+
    `<textarea id="vp2Text" readonly style="flex:1 1 auto;min-height:120px;width:100%;box-sizing:border-box;background:${c.dunkel};color:${c.weiss};border:1px solid ${c.grau};border-radius:8px;padding:10px;font:500 14px/1.45 Barlow,Arial,sans-serif;resize:none"></textarea>`+
    `<div style="display:flex;flex-wrap:wrap;gap:8px"><button data-a="kopieren" style="${btn}background:${c.gold};color:${c.dunkel}">Kopieren</button><button data-a="reset" style="${btn}background:${c.grau};color:${c.weiss}">${vp2ResetArm?'Wirklich alles zurücksetzen?':'Alles zurücksetzen'}</button><button data-a="zu" style="${btn}background:${c.grau};color:${c.weiss};margin-left:auto">Schließen (L)</button></div>`;
  vp2PanelEl.querySelector('#vp2Text').value=vp2ListeText(vp2Modus);
  vp2PanelEl.onclick=ev=>{ const b=ev.target.closest('button'); if(!b) return; ev.stopPropagation();
    if(b.dataset.m!==undefined){ vp2Modus=+b.dataset.m; vp2ResetArm=false; vp2PanelFuellen(); }
    else if(b.dataset.a==='zu') vp2ListeZu();
    else if(b.dataset.a==='kopieren') vp2Kopieren();
    else if(b.dataset.a==='reset'){ if(!vp2ResetArm){ vp2ResetArm=true; vp2PanelFuellen(); } else { vp2Liste.forEach(e=>{ e.stat=0; if(vp2Atlas) vp2Atlas.set(e.i,0); }); vp2Stat={}; vp2Speichern(); vp2ResetArm=false; vp2PanelFuellen(); vp2Zeigen(); } } };
}
function vp2Kopieren(){
  const ta=vp2PanelEl&&vp2PanelEl.querySelector('#vp2Text'); if(!ta) return;
  const fertig=()=>toast('Liste kopiert.','money');
  try{ ta.focus(); ta.select(); ta.setSelectionRange(0,ta.value.length); if(document.execCommand&&document.execCommand('copy')){ fertig(); return; } }catch(e){}
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(ta.value).then(fertig,()=>toast('Kopieren nicht möglich – Text markieren und kopieren.','bad')); return; } }catch(e){}
  toast('Text ist markiert – bitte kopieren.');
}
function vp2ListeZu(){
  if(!vp2ListeOffen) return;
  vp2ListeOffen=false; paused=false; if(vp2PanelEl){ vp2PanelEl.remove(); vp2PanelEl=null; } requestLock();
}
/* ---------- Start / Ende ---------- */
function vp2Schalten(){ if(!FW_DEV) return; if(vp2An) vp2Aus(); else vp2Start(); }
function vp2Start(){
  if(vp2An) return;
  if(typeof vpAn!=='undefined'&&vpAn) vpAus();
  if(typeof vfAn!=='undefined'&&vfAn) vorfuehrungAus();
  if(typeof fwTestAn!=='undefined'&&fwTestAn) fwTestSchalten();
  vp2Mess={t0:performance.now()};
  vp2Vorher={x:pl.x,z:pl.z,yaw,pitch};
  vp2Stat=vp2Lesen(); vp2Liste=vp2Sammeln(); vp2Reihen=vp2Planen(vp2Liste); vp2FL=vp2Anordnen(vp2Reihen);
  vp2An=true; vp2Fertig=false; vp2Lauf++; vp2Frame=0;
  vp2RaumBauen(vp2FL); SPIEL_RAUM=vp2FL;
  vp2Aufstellen(vp2FL);
  vp2Mess.aufbauMs=Math.round(performance.now()-vp2Mess.t0);
  pl.x=vp2FL.x0+VP2_WEST/2+0.4; pl.z=vp2FL.z1-1.4; yaw=0; pitch=-0.22;
  if(laptopOpen) closeLaptop(true); if(typeof handyOpen!=='undefined'&&handyOpen) closeHandy();
  vp2Zeigen(0);
  const lauf=vp2Lauf; setTimeout(()=>vp2Fuellen(lauf,0),30);
}
function vp2Aus(){
  if(!vp2An) return;
  vp2ListeZu(); vp2Lauf++; vp2Fertig=false; vp2An=false;
  /* Packungen raus; Modelle, die nur fuer die Ausstellung entstanden sind, ganz weg */
  vp2Liste.forEach(e=>{ if(e.hd&&e.hd.pool) e.hd.pool.remove(e.hd); e.hd=null; e.hit=null; });
  vp2Neu.forEach(t=>{ if(poolDa(t)&&pools[t].h.length===0) poolWeg(t); }); vp2Neu=new Set();
  if(vp2Atlas){ vp2Atlas.dispose(); vp2Atlas=null; }
  if(vp2Tische){ vp2Tische.dispose(); vp2Tische=null; }
  vp2Banner.forEach(bk.schildWeg); vp2Banner=[];
  if(vp2G){ vp2G.traverse(o=>{ if(o.isMesh&&o.geometry&&o.geometry!==vp2HitGeo) o.geometry.dispose(); }); scene.remove(vp2G); vp2G=null; }
  vp2Cols.forEach(dropCol); vp2Cols=[];
  SPIEL_RAUM=null; if(vp2RaumG) vp2RaumG.visible=false; vp2RaumCols.forEach(dropCol);
  if(vp2El){ vp2El.remove(); vp2El=null; }
  vp2Liste=[]; vp2Reihen=[];
  if(vp2Vorher){ pl.x=vp2Vorher.x; pl.z=vp2Vorher.z; yaw=vp2Vorher.yaw; pitch=vp2Vorher.pitch; vp2Vorher=null; }
  toast('Ausstellung beendet.');
}
function vp2Taste(e){
  if(e.code==='KeyB'&&!e.repeat){ vp2Aus(); return true; }
  if(e.code==='KeyL'&&!e.repeat){ vp2ListeSchalten(); return true; }
  return false;
}

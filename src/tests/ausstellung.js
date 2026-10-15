/* Verpackungs-Vorfuehrung 2.0 / Ausstellung (Tom, 15.10.: "jedes Produkt EINMAL auf einen Verkaufstisch, mit
   Name - dann sage ich dir, welche Verpackung nicht passt"). Prueft nach vp2.start():
   - PRODUKTE  jedes Produkt der Vorfuehrung 1 (bb.vpProdukte) und jedes nicht bestellbare (Gravur-Rakete) steht genau 1x in der Ausstellung und genau 1 Instanz im Pool
   - NUMMERN   1..N lueckenlos, sortiert nach Kategorie, dann Produkt-ID; Kategorien in der Reihenfolge vp2.KATS
   - SCHILD    Atlas: ein Schild je Produkt, jede Zelle bemalt; Platte + Schrift = genau 2 Meshes (alle Schilder)
   - PLATZ     jedes Stueck auf seinem Tisch (x/z innerhalb), Tische ueberschneiden sich nicht, alles im Raum, Gaenge >= 2,4 m
   - TREFFER   ein Strahl auf jedes Stueck trifft dessen Trefferflaeche (Aktion-Taste kann es waehlen); echtes Zielen + Taste E
   - FREIGABE  E: offen -> passt -> passt nicht -> offen; Schildfarbe wechselt; Liste enthaelt die Nr.; localStorage; ueberlebt Neustart
   - SICHT     ausserhalb des Blickfelds/weit weg ist die Packung aus dem Zeichenpuffer (Zeichenaufrufe gemessen)
   - AUS       nach dem Beenden: Pools, Kollision, Schilder, Tische, Trefferflaechen, Anzeige weg; Spieler wieder am alten Ort
   - FEHLER    keine Seitenfehler
   Aufruf:  node -r ./ladezeit-preload.js ausstellung.js real.html      BILDER=<ordner> schreibt zusaetzlich die Bilder */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require('../../tools/test/start-hilfe.js');
const BILDER=process.env.BILDER||'';
(async()=>{
  const t0=Date.now(), dauer=()=>((Date.now()-t0)/1000).toFixed(0)+' s';
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-accelerated-2d-canvas']});
  const p=await b.newPage({viewport:BILDER?{width:1100,height:640}:{width:480,height:300}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>{ errs.push('PAGEERROR: '+e.message); console.log('PAGEERROR',e.message.slice(0,300)); });
  p.on('console',m=>{ if(m.type()==='warning'&&/Vorfuehrung|Ausstellung/.test(m.text())) console.log('WARN',m.text().slice(0,200)); });
  await p.addInitScript(()=>{ try{ if(!sessionStorage.getItem('x')){ localStorage.clear(); sessionStorage.setItem('x','1'); } }catch(e){} });
  await H.laden(p,process.argv[2]);
  await H.neuesSpiel(p,{stoppen:true});
  console.log('Spiel gestartet nach',dauer());
  const o={produkte:[],nummern:[],schild:[],platz:[],treffer:[],freigabe:[],sicht:[],aus:[]};
  /* Hilfen im Browser: Zeichenaufrufe zaehlen wie der Laufzeit-Waechter */
  await p.evaluate(()=>{ const bb=window.__bb, R=bb.renderer, rbd=R.renderBufferDirect.bind(R), W=window.__W={rec:null};
    R.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){ const a=W.rec; if(a){ if(sc){ a.calls++; a.m.add(mat); } else a.schatten++; } return rbd(cam,sc,geo,mat,obj,grp); };
    W.zaehle=()=>{ bb.kameraSetzen(); bb.vp2.sicht(); bb.renderFrame(0.016); W.rec={calls:0,schatten:0,m:new Set()}; bb.kameraSetzen(); bb.renderFrame(0.016); const r=W.rec; W.rec=null;
      return {calls:r.calls,schatten:r.schatten,mats:r.m.size,tris:bb.renderer.info.render.triangles}; };
    window.__vorher={pools:Object.keys(bb.pools).sort(),cols:bb.colliders.length,shelves:bb.shelves.length,tex:bb.renderer.info.memory.textures,geo:bb.renderer.info.memory.geometries,px:bb.pl.x,pz:bb.pl.z,
      poolN:Object.fromEntries(Object.keys(bb.pools).map(k=>[k,bb.pools[k].h.length])) }; });
  /* Start wie im Spiel: Knopf im Laptop */
  await p.evaluate(()=>{ const bb=window.__bb; bb.openLaptop('shop'); bb.renderLaptop(); });
  await p.waitForTimeout(600);   /* wie ein Spieler: erst das Laptop oeffnen (gibt die Maus frei), dann klicken */
  const start=await p.evaluate(()=>{ const k=document.querySelector('[data-a="verpackung2"]'); const t=performance.now(); if(k) k.click(); return {knopf:!!k,ms:Math.round(performance.now()-t)}; });
  console.log('Knopf',JSON.stringify(start));
  if(!start.knopf) o.produkte.push('kein Knopf "verpackung2" im Laptop');
  if(start.ms>2500) o.produkte.push('Knopf blockiert das Spiel '+start.ms+' ms');
  await p.waitForFunction('window.__bb.vp2.fertig',null,{timeout:1200000,polling:500});
  console.log('Ausstellung fertig nach',dauer());
  const info=await p.evaluate(()=>{ const bb=window.__bb, V=bb.vp2, P=bb.P, alle=bb.vpProdukte().concat(Object.keys(P).filter(t=>P[t].dims&&P[t].noOrder&&!P[t].rezept&&!P[t].eigen&&!bb.vpProdukte().includes(t))), L=V.liste;
    const r={n:L.length,alle:alle.length,fehler:L.filter(e=>e.fehler).map(e=>e.t+': '+e.fehler),mess:Object.assign({},V.mess),FL:V.FL,reihen:V.reihen.length,tische:V.tische.anzahl};
    /* PRODUKTE */
    const zaehl={}; L.forEach(e=>zaehl[e.t]=(zaehl[e.t]||0)+1);
    const prod=[]; alle.forEach(t=>{ if(zaehl[t]!==1) prod.push(`${t}: ${zaehl[t]||0}x`); });
    Object.keys(zaehl).forEach(t=>{ if(!alle.includes(t)) prod.push('nicht in Vorfuehrung 1: '+t); });
    L.forEach(e=>{ if(!e.hd) prod.push('ohne Instanz: '+e.t); else { const vor=window.__vorher.poolN[e.t]||0, jetzt=bb.pools[e.t].h.length+(e.hd.versteckt?1:0);
      if(jetzt-vor!==1) prod.push(`${e.t}: Pool ${vor} -> ${jetzt}`); } });
    r.prod=prod;
    /* NUMMERN */
    const kidx={}; V.KATS.forEach(([k],i)=>kidx[k]=i); const num=[];
    L.forEach((e,i)=>{ if(e.nr!==i+1) num.push(`Nr. ${e.nr} an Stelle ${i+1}`); if(i){ const a=L[i-1]; if(kidx[a.kat]>kidx[e.kat]||(a.kat===e.kat&&a.t>e.t)) num.push(`Reihenfolge ${a.t} vor ${e.t}`); } });
    r.num=num; r.kats=V.KATS.map(([k,n])=>[n,L.filter(e=>e.kat===k).length]);
    /* SCHILD: Zelle bemalt? */
    const A=V.atlas, c=A.tex.image, g=c.getContext('2d'), sk=A.skala, sch=[];
    const cw=320, ch=116, cols=12;
    L.forEach((e,i)=>{ const x=(i%cols)*cw*sk, y=Math.floor(i/cols)*ch*sk, d=g.getImageData(Math.round(x),Math.round(y),Math.round(cw*sk),Math.round(ch*sk*0.76)).data; let k=0; for(let q=3;q<d.length;q+=4) if(d[q]>200) k++; if(k<200*sk*sk) sch.push(`Nr. ${e.nr} ${e.t}: Zelle fast leer (${k} Pixel)`); });
    r.sch=sch; r.atlas={n:A.n,px:A.pixel,skala:sk,platte:A.platte.parent===V.gruppe,schrift:A.schrift.parent===V.gruppe};
    let sm=0; bb.scene.traverse(o=>{ if(o.isMesh&&o.userData.bauteil==='schildAtlas') sm++; }); r.schildMeshes=sm;
    let hits=0; bb.scene.traverse(o=>{ if(o.userData&&o.userData.kind==='vpstueck') hits++; }); r.hits=hits;
    /* PLATZ */
    const pl=[]; const F=V.FL, R=[];
    L.forEach(e=>{ const tb=e.tisch, K=tb.K; if(e.x-e.w/2<tb.x-1.0-0.001||e.x+e.w/2>tb.x+1.0+0.001) pl.push(`Nr. ${e.nr}: x ausserhalb Tisch`);
      if(e.z-e.d/2<tb.z-K.d/2-0.001||e.z+e.d/2>tb.z+K.d/2+0.001) pl.push(`Nr. ${e.nr}: z ausserhalb Tisch`);
      if(e.x-e.w/2<F.x0||e.x+e.w/2>F.x1||e.z-e.d/2<F.z0||e.z+e.d/2>F.z1) pl.push(`Nr. ${e.nr}: ausserhalb Raum`); });
    L.forEach((a,i)=>{ for(let j=i+1;j<L.length;j++){ const c2=L[j]; if(a.tisch.z!==c2.tisch.z&&Math.abs(a.z-c2.z)>3) continue;
      if(a.x-a.w/2<c2.x+c2.w/2-0.001&&a.x+a.w/2>c2.x-c2.w/2+0.001&&a.z-a.d/2<c2.z+c2.d/2-0.001&&a.z+a.d/2>c2.z-c2.d/2+0.001) pl.push(`Nr. ${a.nr}/${c2.nr} ueberschneiden sich`);
      /* Schilder (0,44 m breit, vorn am Tisch) duerfen sich nicht beruehren */
      if(a.tisch===c2.tisch&&Math.abs(a.x-c2.x)<0.46) pl.push(`Nr. ${a.nr}/${c2.nr}: Schilder zu dicht (${Math.abs(a.x-c2.x).toFixed(2)} m)`); } });
    const reih=V.reihen; for(let k=1;k<reih.length;k++){ const gang=reih[k-1].zF-reih[k-1].tiefe-reih[k].zF; if(gang<2.39) pl.push(`Gang zwischen Reihe ${k-1}/${k}: ${gang.toFixed(2)} m`); }
    r.nummern=L.map(e=>`Nr. ${e.nr}\t${P[e.t].name}\t${V.KATS.find(k=>k[0]===e.kat)[1]}\t${e.t}\tReihe ${V.reihen.indexOf(e.reihe)+1}`);
    r.pl=pl; r.maxStueckProTisch=Math.max(...V.reihen.flatMap(q=>q.tische.map(t=>t.es.length)));
    /* TREFFER: Strahl von vorn-oben auf jedes Stueck */
    const TH=window.THREE, tre=[]; const ray=new TH.Raycaster(), hs=[]; V.gruppe.traverse(o=>{ if(o.userData&&o.userData.kind==='vpstueck') hs.push(o); });
    V.gruppe.updateMatrixWorld(true);
    L.forEach(e=>{ const von=new TH.Vector3(e.x,e.y+0.95,e.zFront+0.9), nach=new TH.Vector3(e.x,e.y+Math.min(e.hh,0.3)*0.5+0.05,e.z); ray.set(von,nach.clone().sub(von).normalize()); ray.far=3.3;
      const h=ray.intersectObjects(hs,false); if(!h.length||h[0].object.userData.ref!==e) tre.push(`Nr. ${e.nr} ${e.t}: Strahl trifft ${h.length?'Nr. '+h[0].object.userData.ref.nr:'nichts'}`); });
    r.tre=tre;
    return r; });
  if(BILDER){ fs.mkdirSync(BILDER,{recursive:true}); fs.writeFileSync(path.join(BILDER,'nummern.txt'),'Verpackungs-Ausstellung 2.0 - Nummer, Name, Kategorie, ID, Reihe\n'+info.nummern.join('\n')+'\n'); }
  console.log(`Produkte: ${info.n} (Vorfuehrung 1 + nicht bestellbare: ${info.alle}), Tische ${info.tische}, Reihen ${info.reihen}, max ${info.maxStueckProTisch} je Tisch`);
  console.log('Kategorien',JSON.stringify(info.kats));
  console.log('Raum',JSON.stringify(info.FL),'| Atlas',JSON.stringify(info.atlas),'| Aufbau/fertig',JSON.stringify(info.mess));
  o.produkte.push(...info.prod); o.produkte.push(...info.fehler.map(x=>'Modell fehlt: '+x)); if(info.n!==info.alle) o.produkte.push(`Anzahl ${info.n} != ${info.alle}`);
  o.nummern.push(...info.num);
  o.schild.push(...info.sch); if(info.atlas.n!==info.n) o.schild.push('Atlas n '+info.atlas.n); if(!info.atlas.platte||!info.atlas.schrift) o.schild.push('Atlas-Meshes nicht in der Gruppe'); if(info.schildMeshes!==2) o.schild.push('Schild-Meshes '+info.schildMeshes+' (erwartet 2)');
  o.platz.push(...info.pl); o.treffer.push(...info.tre); if(info.hits!==info.n) o.treffer.push('Trefferflaechen '+info.hits);
  /* Zeichenaufrufe: am Startpunkt, dann mitten in einer Reihe, dann ohne Sichtregel */
  const mess=await p.evaluate(()=>{ const bb=window.__bb, V=bb.vp2, W=window.__W, r={}; const F=V.FL;
    bb.setView(F.x0+1.8,F.z1-1.4,0,-0.22); r.start=W.zaehle();
    const R=V.reihen[Math.floor(V.reihen.length/2)]; bb.setView(R.x0+8,R.zF+1.4,0,-0.25); r.mitte=W.zaehle();
    bb.setView(R.x0+8,R.zF+1.4,-Math.PI/2,-0.1); r.seite=W.zaehle();
    V.liste.forEach(e=>{ if(e.hd&&!e.hd.versteckt) e.hd.pool.verstecke(e.hd); }); r.leer=(bb.setView(R.x0+8,R.zF+1.4,0,-0.25), W.rec=null, (()=>{ bb.kameraSetzen(); bb.renderFrame(0.016); W.rec={calls:0,schatten:0,m:new Set()}; bb.renderFrame(0.016); const q=W.rec; W.rec=null; return {calls:q.calls}; })());
    V.sicht();
    /* ohne Sichtregel: alles anzeigen */
    V.liste.forEach(e=>{ if(e.hd&&e.hd.versteckt) e.hd.pool.zeige(e.hd); });
    bb.setView(R.x0+8,R.zF+1.4,0,-0.25); bb.kameraSetzen(); bb.renderFrame(0.016); W.rec={calls:0,schatten:0,m:new Set()}; bb.renderFrame(0.016); r.ohneRegel={calls:W.rec.calls,schatten:W.rec.schatten}; W.rec=null;
    bb.vp2.sicht(); r.sichtbar=V.mess.sichtbar; r.gesamt=V.liste.length; return r; });
  console.log('Zeichenaufrufe',JSON.stringify(mess));
  if(mess.start.calls>=mess.ohneRegel.calls) o.sicht.push(`Sichtregel spart nichts: Start ${mess.start.calls} >= ohne Regel ${mess.ohneRegel.calls}`);
  if(mess.sichtbar>=mess.gesamt) o.sicht.push('alle Stuecke sichtbar');
  /* FREIGABE: echtes Zielen + Taste E */
  const fr=await p.evaluate(async()=>{ const bb=window.__bb, V=bb.vp2, L=V.liste, out=[], e=L[Math.floor(L.length/3)];
    const farbe=i=>{ const a=V.atlas.platte.geometry.attributes.color; return [a.getX(i*4),a.getY(i*4),a.getZ(i*4)].map(v=>+v.toFixed(3)).join(','); };
    const taste=(code)=>{ window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true})); window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true})); };
    /* Blick auf das Stueck: 1,0 m davor, Augenhoehe 1,65 */
    const dx=0, dy=e.y+Math.min(e.hh,0.3)/2-1.65, dz=-(1.0+e.zFront-e.z);
    bb.setView(e.x,e.zFront+1.0,0,Math.atan2(dy,-dz)); bb.kameraSetzen(); bb.step(0.016);
    const t=bb.target; out.push(['ziel',[t&&t.kind,t&&t.ref===e]]); out.push(['zustand',{paused:bb.vp2.paused,overlay:bb.overlayOpen(),flags:bb.vp2.flags}]);
    const pr=bb.promptFor(bb.target); out.push(['prompt',pr&&pr.t]);
    const f0=farbe(e.i); const seq=[e.stat];
    const cols=[f0];
    for(let k=0;k<3;k++){ taste('KeyE'); bb.step(0.016); seq.push(e.stat); cols.push(farbe(e.i)); }
    out.push(['folge',seq.join('>')]); out.push(['farben',cols]);
    if(seq.join('>')==='0>0>0>0'){ const q=[e.stat]; for(let k=0;k<3;k++){ bb.tuAktion('vpstueck',e); q.push(e.stat); } out.push(['tuAktion',q.join('>')]); out.push(['zustand2',{paused:bb.vp2.paused,overlay:bb.overlayOpen(),listeOffen:bb.vp2.listeOffen}]); }
    /* zwei Stuecke auf nicht passt, eins auf passt */
    const a=L[10], c2=L[50], d=L[120]; e.stat&&(()=>{ while(e.stat) bb.vp2.weiter(e); })(); bb.vp2.weiter(a); bb.vp2.weiter(a); bb.vp2.weiter(c2); bb.vp2.weiter(c2); bb.vp2.weiter(d);
    out.push(['ls',localStorage.getItem('bb_vp2_freigabe_v1')]); out.push(['text2',bb.vp2.listeText(2)]); out.push(['text1',bb.vp2.listeText(1)]); out.push(['a',[a.nr,a.t,P_name(a.t)]]); out.push(['d',[d.nr,d.t,P_name(d.t)]]);
    function P_name(t){ return bb.P[t].name; }
    return out; });
  const f=Object.fromEntries(fr);
  if(f.tuAktion) console.log('E wirkt nicht - tuAktion:',f.tuAktion,JSON.stringify(f.zustand2));
  console.log('Zielen',JSON.stringify(f.ziel),'Zustand',JSON.stringify(f.zustand),'Prompt:',f.prompt,'| Folge',f.folge);
  if(f.ziel[0]!=='vpstueck'||!f.ziel[1]) o.freigabe.push('Zielen trifft das Stueck nicht: '+JSON.stringify(f.ziel));
  if(f.folge.split('>').join()!=='0,1,2,0') o.freigabe.push('Folge '+f.folge+' (erwartet 0>1>2>0)');
  if(new Set([f.farben[0],f.farben[1],f.farben[2]]).size!==3) o.freigabe.push('Schildfarbe wechselt nicht: '+JSON.stringify(f.farben));
  if(f.farben[0]!==f.farben[3]) o.freigabe.push('Farbe nach 3x E nicht wieder wie vorher');
  const nrA=f.a[0], nrD=f.d[0];
  if(!f.text2.includes(`Nr. ${f.a[0]} · ${f.a[2]}`)) o.freigabe.push('Liste "nicht freigegeben" ohne Nr. '+nrA);
  if(!f.text2.startsWith('Nicht freigegeben')||!/ 2 von /.test(f.text2.split('\n')[0])) o.freigabe.push('Liste Kopfzeile: '+f.text2.split('\n')[0]);
  if(!f.text1.includes(`Nr. ${nrD} · ${f.d[2]}`)) o.freigabe.push('Liste "passt" ohne Nr. '+nrD);
  if(f.text2.includes(`Nr. ${nrD} `)) o.freigabe.push('Liste "nicht freigegeben" enthaelt ein "passt"-Stueck');
  if(!f.ls||!f.ls.includes(f.a[1])) o.freigabe.push('localStorage ohne Status');
  console.log('Liste nicht freigegeben:\n'+f.text2);
  /* Listenfenster am "Handy"-Weg: Knopf L, Text, Kopieren */
  const pan=await p.evaluate(()=>{ const bb=window.__bb; const kn=document.getElementById('vp2ListeKnopf'); kn&&kn.click(); const pe=document.getElementById('vp2Panel'), ta=document.getElementById('vp2Text'), r={offen:!!pe,text:ta&&ta.value.split('\n')[0],listeOffen:bb.vp2.listeOffen};
    const k=pe&&pe.querySelector('[data-a="kopieren"]'); r.kopierKnopf=!!k; const zu=pe&&pe.querySelector('[data-a="zu"]'); zu&&zu.click(); r.zu=!document.getElementById('vp2Panel')&&!bb.vp2.listeOffen; return r; });
  console.log('Panel',JSON.stringify(pan));
  if(!pan.offen||!pan.kopierKnopf||!pan.zu) o.freigabe.push('Listenfenster: '+JSON.stringify(pan));
  /* Bilder */
  if(BILDER){ fs.mkdirSync(BILDER,{recursive:true});
    const png=async(name,fn,arg)=>{ const d=await p.evaluate(fn,arg); fs.writeFileSync(path.join(BILDER,name),Buffer.from(d.split(',')[1],'base64')); console.log('Bild',name); };
    const setz=`bb.clock=800; bb.applyTOD();`;
    await png('uebersicht.png',()=>{ const bb=window.__bb, V=bb.vp2, F=V.FL; bb.clock=800; bb.applyTOD(); V.liste.forEach(e=>{ if(e.hd&&e.hd.versteckt) e.hd.pool.zeige(e.hd); });
      const c=bb.camera; c.position.set(F.x0+0.8,3.7,F.z1-0.8); c.lookAt(F.x0+14,0.6,F.z1-24); c.updateMatrixWorld(); bb.renderFrame(0.016); return bb.renderer.domElement.toDataURL('image/png'); });
    await png('uebersicht-mitte.png',()=>{ const bb=window.__bb, V=bb.vp2, F=V.FL; const c=bb.camera; c.position.set(F.x1-1.0,3.7,F.z1-8); c.lookAt(F.x0+4,0.6,F.z1-30); c.updateMatrixWorld(); bb.renderFrame(0.016); return bb.renderer.domElement.toDataURL('image/png'); });
    await png('reihe-nah.png',()=>{ const bb=window.__bb, V=bb.vp2, R=V.reihen[0]; bb.setView(R.x0+3.2,R.zF+1.5,0.55,-0.32); bb.kameraSetzen(); bb.vp2.sicht(); bb.kameraSetzen(); bb.renderFrame(0.016); return bb.renderer.domElement.toDataURL('image/png'); });
    await png('reihe-front.png',()=>{ const bb=window.__bb, V=bb.vp2, R=V.reihen[1]; bb.setView(R.x0+5,R.zF+1.9,0,-0.3); bb.kameraSetzen(); bb.vp2.sicht(); bb.kameraSetzen(); bb.renderFrame(0.016); return bb.renderer.domElement.toDataURL('image/png'); });
    for(const [name,st] of [['schild-offen',0],['schild-passt',1],['schild-passt-nicht',2]]){
      await png(name+'.png',(st)=>{ const bb=window.__bb, V=bb.vp2, e=V.liste[12]; while(e.stat!==st) bb.vp2.weiter(e); bb.setView(e.x,e.zFront+0.75,0,-0.62); bb.kameraSetzen(); bb.vp2.sicht(); bb.kameraSetzen(); bb.step(0.016); bb.renderFrame(0.016); return bb.renderer.domElement.toDataURL('image/png'); },st); }
    await p.evaluate(()=>{ const V=window.__bb.vp2; V.liste.forEach(e=>{ while(e.stat) V.weiter(e); }); });
    await png('reihenschild.png',()=>{ const bb=window.__bb, V=bb.vp2, R=V.reihen[2]; bb.setView(R.x0-3.3,R.zF-R.tiefe/2,-Math.PI/2,0.12); bb.kameraSetzen(); bb.vp2.sicht(); bb.kameraSetzen(); bb.renderFrame(0.016); return bb.renderer.domElement.toDataURL('image/png'); });
    await p.evaluate(()=>{ const V=window.__bb.vp2; V.liste.forEach((e,i)=>{ if(i%9===3) V.weiter(e); if(i%17===5){ V.weiter(e); V.weiter(e); } }); window.__bb.vp2.listeAuf(); });
    await p.screenshot({path:path.join(BILDER,'liste-fenster.png')}); console.log('Bild liste-fenster.png');
    await p.evaluate(()=>window.__bb.vp2.listeZu());
  }
  /* AUS */
  const aus=await p.evaluate(()=>{ const bb=window.__bb, V=bb.vp2, vor=window.__vorher; const nrs=V.liste.map(e=>[e.t,e.stat]).filter(x=>x[1]); bb.vp2.aus();
    const r={an:V.an,pools:Object.keys(bb.pools).sort(),cols:bb.colliders.length,shelves:bb.shelves.length,px:bb.pl.x,pz:bb.pl.z,tex:bb.renderer.info.memory.textures,geo:bb.renderer.info.memory.geometries,
      neu:V.neu.size,atlas:!!V.atlas,tische:!!V.tische,grp:!!V.gruppe,info:!!document.getElementById('vp2Info'),panel:!!document.getElementById('vp2Panel'),status:nrs.length,ls:localStorage.getItem('bb_vp2_freigabe_v1')};
    r.poolN=Object.fromEntries(Object.keys(bb.pools).map(k=>[k,bb.pools[k].h.length]));
    let m=0; bb.scene.traverse(o=>{ if(o.userData&&(o.userData.kind==='vpstueck'||o.userData.bauteil==='schildAtlas'||o.userData.bauteil==='verkaufstisch')) m++; }); r.reste=m;
    r.vor=vor; return r; });
  const dp=[]; if(aus.an) dp.push('vp2.an noch true');
  if(JSON.stringify(aus.pools)!==JSON.stringify(aus.vor.pools)) dp.push('Pools: '+aus.pools.filter(x=>!aus.vor.pools.includes(x)).length+' neue uebrig, '+aus.vor.pools.filter(x=>!aus.pools.includes(x)).length+' fehlen');
  if(JSON.stringify(aus.poolN)!==JSON.stringify(aus.vor.poolN)) dp.push('Instanzen in alten Pools veraendert');
  if(aus.cols!==aus.vor.cols) dp.push(`Kollision ${aus.vor.cols} -> ${aus.cols}`);
  if(aus.shelves!==aus.vor.shelves) dp.push('Regale veraendert');
  if(aus.neu||aus.atlas||aus.tische||aus.grp) dp.push('Reste: '+JSON.stringify({neu:aus.neu,atlas:aus.atlas,tische:aus.tische,grp:aus.grp}));
  if(aus.reste) dp.push(aus.reste+' Meshes der Ausstellung noch in der Szene');
  if(aus.info||aus.panel) dp.push('Anzeige/Panel noch da');
  if(Math.abs(aus.px-aus.vor.px)>1e-6||Math.abs(aus.pz-aus.vor.pz)>1e-6) dp.push('Spieler nicht zurueck');
  console.log(`Speicher: Texturen ${aus.vor.tex} -> ${aus.tex}, Geometrien ${aus.vor.geo} -> ${aus.geo} (Raum bleibt ausgeblendet im Speicher)`);
  if(aus.tex>aus.vor.tex+16) dp.push(`Texturen ${aus.vor.tex} -> ${aus.tex} (zu viele uebrig)`);
  o.aus.push(...dp);
  /* Neustart: Status bleibt */
  const neu=await p.evaluate(async()=>{ const bb=window.__bb; bb.vp2.start(); return new Promise(res=>{ const iv=setInterval(()=>{ if(bb.vp2.fertig){ clearInterval(iv); res({n:bb.vp2.liste.filter(e=>e.stat).length,z:bb.vp2.liste.filter(e=>e.stat===2).length}); } },300); }); });
  console.log('Neustart: gemerkt',JSON.stringify(neu));
  if(neu.n!==aus.status) o.freigabe.push(`Status nach Neustart ${neu.n} != ${aus.status}`);
  const aus2=await p.evaluate(()=>{ const bb=window.__bb; bb.vp2.aus(); return {tex:bb.renderer.info.memory.textures,pools:Object.keys(bb.pools).length}; });
  console.log('nach zweitem Beenden',JSON.stringify(aus2),'Fehler:',errs.length);
  /* Ultra Low: gleiche Ausstellung, Zeichenaufrufe und Zeit (Tom: "Ultra Low spielbar") */
  await p.close();
  const ctx=BILDER?await b.newContext({viewport:{width:390,height:780},isMobile:true,hasTouch:true,deviceScaleFactor:2}):null;
  const pu=await (ctx||b).newPage(BILDER?undefined:{viewport:{width:480,height:300}}); pu.setDefaultTimeout(900000); pu.on('pageerror',e=>errs.push('PAGEERROR (ultralow): '+e.message));
  await pu.addInitScript(()=>{ try{ if(!sessionStorage.getItem('x')){ localStorage.clear(); sessionStorage.setItem('x','1'); } localStorage.setItem('bb_gfx','ultralow'); }catch(e){} });
  await H.laden(pu,process.argv[2]); await H.neuesSpiel(pu,{stoppen:true});
  await pu.evaluate(()=>{ const bb=window.__bb, R=bb.renderer, rbd=R.renderBufferDirect.bind(R), W=window.__W={rec:null};
    R.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){ const a=W.rec; if(a){ if(sc) a.calls++; else a.schatten++; } return rbd(cam,sc,geo,mat,obj,grp); };
    W.zaehle=()=>{ bb.kameraSetzen(); bb.vp2.sicht(); bb.renderFrame(0.016); W.rec={calls:0,schatten:0}; bb.kameraSetzen(); bb.renderFrame(0.016); const r=W.rec; W.rec=null; return r; };
    bb.vp2.start(); });
  await pu.waitForFunction('window.__bb.vp2.fertig',null,{timeout:1200000,polling:500});
  const ul=await pu.evaluate(()=>{ const bb=window.__bb, V=bb.vp2, W=window.__W, F=V.FL, R=V.reihen[Math.floor(V.reihen.length/2)], r={stufe:bb.MAT.stufe().name,mess:Object.assign({},V.mess),atlasPx:V.atlas.pixel,skala:V.atlas.skala};
    bb.setView(F.x0+1.8,F.z1-1.4,0,-0.22); r.start=W.zaehle(); bb.setView(R.x0+8,R.zF+1.4,0,-0.25); r.mitte=W.zaehle(); r.sichtbar=V.mess.sichtbar;
    r.coarse=!!(window.matchMedia&&matchMedia('(pointer: coarse)').matches); r.texturen=bb.renderer.info.memory.textures; return r; });
  if(BILDER){ await pu.evaluate(()=>{ const bb=window.__bb, V=bb.vp2, e=V.liste[12]; bb.setView(e.x,e.zFront+0.8,0,-0.55); bb.kameraSetzen(); V.sicht(); bb.step(0.016); bb.renderFrame(0.016); V.weiter(e); });
    await pu.screenshot({path:path.join(BILDER,'handy-ausstellung.png')}); console.log('Bild handy-ausstellung.png');
    const ziel=await pu.evaluate(()=>{ const bb=window.__bb; bb.step(0.016); return bb.promptFor(bb.target); }); console.log('Handy-Prompt',JSON.stringify(ziel));
    await pu.evaluate(()=>window.__bb.vp2.listeAuf()); await pu.screenshot({path:path.join(BILDER,'handy-liste.png')}); console.log('Bild handy-liste.png'); await pu.evaluate(()=>window.__bb.vp2.listeZu()); }
  const nach=await pu.evaluate(()=>{ const bb=window.__bb; bb.vp2.aus(); return bb.renderer.info.memory.textures; }); ul.nachher=nach;
  console.log('ULTRALOW',JSON.stringify(ul));
  if(ul.stufe!=='ultralow') o.sicht.push('Ultra-Low-Lauf lief auf '+ul.stufe);
  const rot=[]; for(const k of Object.keys(o)) if(o[k].length) rot.push(`${k.toUpperCase()}: ${o[k].length} - ${o[k].slice(0,6).join(' | ')}`);
  errs.forEach(e=>rot.push('FEHLER: '+e));
  await b.close();
  if(rot.length){ console.log('MANGEL:\n  '+rot.join('\n  ')); process.exit(1); }
  console.log('ALLES OK ('+dauer()+')');
})().catch(e=>{ console.log('ERRORS:',e.stack||e); process.exit(2); });

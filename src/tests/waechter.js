/* Laufzeit-Waechter Fundament (Etappe 5, 14.10.2026) - kurz (Ziel <= 10 Min), EIN Browser.
   Tom 13.10.: "Neues entsteht automatisch im System" - was der Node-Waechter
   (tools/fundament/waechter.js) im Quelltext prueft, prueft dieser im laufenden Spiel
   (neues Spiel, Level 99, alle Ausbauten und Zonen offen, Stufe wie gespeichert = Hoch):
   - TORE      jedes Tor ist ein Bauteil: die Tor-Griffe der Spiellogik (door, WTORE[], VD) haengen an
               einer Gruppe mit userData.bauteil='tor'; jedes Mesh mit dem Torblatt-Material liegt in
               so einer Gruppe; Anzahl Tor-Gruppen >= Ausgangswert
   - BAUTEILE  Meshes je userData.bauteil (selbst oder Elterngruppe) >= Ausgangswert - faellt eine Zahl,
               hat ein Bauteil seine Markierung verloren (oder wurde neben dem Baukasten gebaut)
   - SECHS     Meshes mit 6-Material-Array (alte wall()-Waende) <= Ausgangswert (Liste schrumpft)
   - BUDGET    je Ansicht Zeichenaufrufe (Haupt- und Schattenpass), Materialien und Texturen im Bild,
               dazu Meshes/Materialien/Texturen im Szenengraf <= Ausgangswert + Toleranz
   - WACHE     kein geteiltes Material aus MAT wird veraendert (MAT-Waechter, 0 Verstoesse) -
               Ansichten bei Tag/Abend/Nacht zeichnen und 20 s Spiel laufen lassen
   Ausgangswerte und Begruendung: tools/fundament/waechter-ausnahmen.json, Abschnitt "laufzeit".
   Aufruf:  node waechter.js real.html
            GEGENPROBE=1 node waechter.js real.html   (baut nach dem normalen Lauf je Waechter einen
                       Verstoss ein, erwartet ROT, baut ihn zurueck - alles im selben Browser)
            BUDGET_SCHREIBEN=1 GRUND="warum" node waechter.js real.html   (Ausgangswerte neu schreiben -
                       nur mit Begruendung, z. B. nach einem Merge, der Bauteile zusammenlegt)
   Sperre:  flock /tmp/bb-testlock-<agent> nice -n 10 timeout 1200 node -r ./ladezeit-preload.js .../waechter.js $PWD/real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const AUS=path.join(__dirname,'..','..','tools','fundament','waechter-ausnahmen.json');
const GP=process.env.GEGENPROBE==='1', SCHREIB=process.env.BUDGET_SCHREIBEN==='1';
const t0=Date.now(), dauer=()=>((Date.now()-t0)/1000).toFixed(0)+' s';
const VIEWS={laden:[0,3,0,0],lager:[-14,-2,0,0],lagerDock:[-17,-2,-Math.PI/2,0],dockHof:[-27,3,-Math.PI/2,0],testfeld:[0,-12,0,0.05],strasse:[0,12,Math.PI,0.05]};

(async()=>{
  if(SCHREIB&&!(process.env.GRUND||'').trim()){ console.log('ABGELEHNT: BUDGET_SCHREIBEN braucht GRUND="..." (Begruendungspflicht)'); process.exit(2); }
  const A=JSON.parse(fs.readFileSync(AUS,'utf8')); const B=A.laufzeit;
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:480,height:300}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>{ errs.push('PAGEERROR: '+e.message); console.log('PAGEERROR',e.message.slice(0,300)); });
  await p.addInitScript(()=>{ window.__MATWACHE=true; try{ if(!sessionStorage.getItem('x')){ localStorage.clear(); sessionStorage.setItem('x','1'); } }catch(e){} });
  await p.goto('file://'+process.argv[2],{timeout:900000,waitUntil:'domcontentloaded'});
  await p.waitForFunction("!!window.__bb&&!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000,polling:1000});
  await p.evaluate(()=>{ document.querySelector('#startBtns button:last-child').click(); document.getElementById('nameGo').click(); });
  console.log('Start geklickt nach',dauer());
  for(let i=0;;i++){ const z=await p.evaluate(()=>({zu:!document.getElementById('start').classList.contains('show'),S:!!(window.__bb&&window.__bb.S),name:!!document.querySelector('#nameBox.show')}));
    if(z.zu) break; if(i%6===5) console.log('warte auf Spielstart',dauer(),JSON.stringify(z)); if(i>180) throw new Error('Spielstart haengt: '+JSON.stringify(z)+' '+errs.slice(0,3).join(' | '));
    await new Promise(r=>setTimeout(r,10000)); }
  console.log('geladen nach',dauer());

  /* Messfunktionen im Spiel einmal anlegen */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.run(1,0.05);
    const W=window.__W={};
    const bauteilVon=o=>{ for(let x=o;x;x=x.parent) if(x.userData&&x.userData.bauteil) return x.userData.bauteil; return null; };
    const TEXK=['map','emissiveMap','alphaMap','normalMap','roughnessMap','metalnessMap','bumpMap','aoMap','lightMap'];
    W.tore=()=>{ const r={gruppen:0,ohne:[],waisen:0};
      bb.scene.traverse(o=>{ if(o.userData&&o.userData.bauteil==='tor'&&!o.isMesh) r.gruppen++; });
      const griff=[['door',bb.door&&bb.door.g]]; (bb.WTORE||[]).forEach((w,i)=>griff.push(['WTORE['+i+']',w&&w.g])); griff.push(['VD',bb.VD&&bb.VD.T&&bb.VD.T.g]);
      for(const [n,g] of griff){ if(!g||!(g.userData&&g.userData.bauteil==='tor')) r.ohne.push(n); }
      bb.scene.traverse(o=>{ if(!o.isMesh) return; const ms=Array.isArray(o.material)?o.material:[o.material];
        if(ms.some(m=>m&&m.userData&&(m.userData.mat==='get:torBlatt'||(m.map&&m.map.userData&&m.map.userData.mat==='torBlatt')))&&bauteilVon(o)!=='tor') r.waisen++; });
      return r; };
    W.bauteile=()=>{ const r={}; bb.scene.traverse(o=>{ if(!o.isMesh) return; const n=bauteilVon(o); if(n) r[n]=(r[n]||0)+1; }); return r; };
    W.sechs=()=>{ let n=0; bb.scene.traverse(o=>{ if(o.isMesh&&Array.isArray(o.material)&&o.material.length===6) n++; }); return n; };
    W.szene=()=>{ const m=new Set(), t=new Set(); let me=0; bb.scene.traverse(o=>{ if(!o.isMesh) return; me++; (Array.isArray(o.material)?o.material:[o.material]).forEach(x=>{ if(!x) return; m.add(x); for(const k of TEXK) if(x[k]) t.add(x[k]); }); });
      return {meshes:me,materialien:m.size,texturen:t.size}; };
    const R=bb.renderer, rbd=R.renderBufferDirect.bind(R); W.rec=null;
    R.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){ const a=W.rec; if(a){ if(sc){ a.calls++; a.m.add(mat); for(const k of TEXK) if(mat&&mat[k]) a.t.add(mat[k]); } else a.schatten++; } return rbd(cam,sc,geo,mat,obj,grp); };
    W.ansicht=(v,clk)=>{ bb.setView(...v); bb.clock=clk; bb.applyTOD(); bb.kameraSetzen(); bb.renderFrame(0.016);
      W.rec={calls:0,schatten:0,m:new Set(),t:new Set()}; bb.kameraSetzen(); bb.renderFrame(0.016); const r=W.rec; W.rec=null;
      return {calls:r.calls,schatten:r.schatten,mats:r.m.size,texs:r.t.size}; };
    W.alles=(views)=>{ const o={tore:W.tore(),bauteile:W.bauteile(),sechs:W.sechs(),szene:W.szene(),ansichten:{}};
      for(const k in views) o.ansichten[k]=W.ansicht(views[k],1000); return o; };
  });
  const messen=(v)=>p.evaluate(v=>window.__W.alles(v),v||VIEWS);
  const M=await messen(); console.log('gemessen nach',dauer());

  /* WACHE: Tag/Abend/Nacht zeichnen, 20 s Spiel */
  const wache=async(eingriff)=>p.evaluate(e=>{ const bb=window.__bb, W=window.__W, MAT=bb.MAT;
    if(e==='verstoss') MAT.get('markierungGelb').color.setHex(0xff0000);
    for(const clk of [600,1100,1300]) for(const v of [[0,3,0,0],[-27,3,-Math.PI/2,0],[0,12,Math.PI,0.05]]) W.ansicht(v,clk);
    if(!e) bb.run(20,0.1);
    const r={an:MAT.wache,n:MAT.verstoesse.length,erste:MAT.verstoesse.slice(0,4).map(x=>x.name+'.'+x.was+' @ '+String(x.stack).slice(0,140))};
    if(e==='verstoss'){ MAT.get('markierungGelb').color.setHex(MAT.farbe('signalgelb')); r.n=MAT.verstoesse.length; MAT.verstoesse.length=0; }
    return r; },eingriff||null);
  const WA=await wache(); console.log('Wache nach',dauer());

  /* ---------- Pruefen gegen die Ausgangswerte ---------- */
  const pruefe=(M,WA)=>{ const rot=[], hinweis=[];
    if(!B){ rot.push('AUSGANG: keine Ausgangswerte (laufzeit) in waechter-ausnahmen.json - einmal BUDGET_SCHREIBEN=1 GRUND="..." laufen lassen'); return {rot,hinweis}; }
    const tol=B.toleranz||{rel:0.05,abs:15}, grenze=x=>Math.ceil(x*(1+tol.rel)+tol.abs);
    const t=M.tore;
    if(t.ohne.length) rot.push('TORE: Tor-Griffe ohne userData.bauteil=tor: '+t.ohne.join(', '));
    if(t.waisen) rot.push('TORE: '+t.waisen+' Mesh(es) mit Torblatt-Material ausserhalb eines Tor-Bauteils (Tor neben bk.tor gebaut?)');
    if(t.gruppen<B.tore) rot.push(`TORE: ${t.gruppen} Tor-Bauteile statt mindestens ${B.tore}`);
    for(const k in B.bauteile){ const n=M.bauteile[k]||0; if(n<B.bauteile[k]) rot.push(`BAUTEILE: ${k} ${n} Meshes statt mindestens ${B.bauteile[k]} (Markierung verloren oder neben dem Baukasten gebaut?)`); }
    for(const k in M.bauteile) if(!(k in B.bauteile)) hinweis.push(`BAUTEILE: neues Bauteil "${k}" (${M.bauteile[k]} Meshes) - beim naechsten BUDGET_SCHREIBEN aufnehmen`);
    if(M.sechs>B.sechsMaterial) rot.push(`SECHS: ${M.sechs} Meshes mit 6-Material-Array statt hoechstens ${B.sechsMaterial} (neue Wand ohne Baukasten?)`);
    else if(M.sechs<B.sechsMaterial) rot.push(`SECHS: nur noch ${M.sechs} statt ${B.sechsMaterial} - Liste schrumpfen (BUDGET_SCHREIBEN=1 GRUND="...")`);
    for(const k of ['meshes','materialien','texturen']) if(M.szene[k]>grenze(B.szene[k])) rot.push(`BUDGET: Szene ${k} ${M.szene[k]} > ${grenze(B.szene[k])} (Ausgang ${B.szene[k]} + Toleranz)`);
    for(const v in B.ansichten){ const a=M.ansichten[v], z=B.ansichten[v]; if(!a) continue;
      for(const k of ['calls','schatten','mats','texs']) if(a[k]>grenze(z[k])) rot.push(`BUDGET: ${v} ${k} ${a[k]} > ${grenze(z[k])} (Ausgang ${z[k]} + Toleranz)`);
      if(a.calls<z.calls*0.85) hinweis.push(`BUDGET: ${v} Zeichenaufrufe ${a.calls} deutlich unter ${z.calls} - Gewinn festschreiben?`); }
    if(!WA.an) rot.push('WACHE: MAT-Waechter nicht aktiv');
    if(WA.n) rot.push(`WACHE: ${WA.n} Veraenderungen an geteilten Materialien: ${WA.erste.join(' | ')}`);
    return {rot,hinweis}; };

  console.log('MESSUNG',JSON.stringify({tore:M.tore,bauteile:M.bauteile,sechs:M.sechs,szene:M.szene}));
  for(const v in M.ansichten) console.log('  '+v.padEnd(10),JSON.stringify(M.ansichten[v]));
  console.log('  WACHE',JSON.stringify(WA));

  if(SCHREIB){
    A.laufzeit={stand:new Date().toISOString().slice(0,10),grund:process.env.GRUND,toleranz:(B&&B.toleranz)||{rel:0.05,abs:15},
      ansicht:'neues Spiel, Level 99, alle Ausbauten, applyZonen, Stufe Hoch (gespeichert), swiftshader 480x300, Abend (clock 1000), vor der Laufzeit-Buendelung',
      tore:M.tore.gruppen,bauteile:M.bauteile,sechsMaterial:M.sechs,
      sechsGrund:'alte Waende aus wall() (05-world) mit je einem Material pro Seite - Schritt Waende (claude/fundament-waende) loest sie auf',
      szene:M.szene,ansichten:M.ansichten};
    const teil=fs.readFileSync(AUS,'utf8');
    const neu=teil.replace(/,\n  "laufzeit": [\s\S]*\n}\n$/,'')+',\n  "laufzeit": '+JSON.stringify(A.laufzeit,null,2).replace(/\n/g,'\n  ')+'\n}\n';
    JSON.parse(neu); fs.writeFileSync(AUS,neu); console.log('Ausgangswerte geschrieben ->',AUS);
    await b.close(); process.exit(0);
  }

  const {rot,hinweis}=pruefe(M,WA);
  if(errs.length) rot.push('FEHLER: '+errs.slice(0,4).join(' | '));
  let gpOk=true;
  if(GP){
    if(rot.length) console.log('GEGENPROBE auf rotem Stand nur bedingt aussagekraeftig');
    const probe=async(name,erwart,ein,aus)=>{ await p.evaluate(ein); const M2=await messen({laden:VIEWS.laden}); await p.evaluate(aus);
      const r=pruefe(M2,WA).rot.filter(x=>x.startsWith(erwart)); const an=r.length>0; if(!an) gpOk=false;
      console.log(`  GEGENPROBE ${name}: ${an?'schlaegt an - richtig ('+r[0].slice(0,110)+')':'schlaegt NICHT an - Waechter blind'}`); };
    await probe('TORE (Markierung an WTORE[0] entfernt)','TORE',()=>{ const g=window.__bb.WTORE[0].g; window.__gpAlt=g.userData.bauteil; delete g.userData.bauteil; },()=>{ window.__bb.WTORE[0].g.userData.bauteil=window.__gpAlt; });
    await probe('BAUTEILE (Schild-Markierung entfernt)','BAUTEILE',()=>{ window.__gpS=[]; window.__bb.scene.traverse(o=>{ if(o.isMesh&&o.userData.bauteil==='schild'&&window.__gpS.length<3){ window.__gpS.push(o); delete o.userData.bauteil; } }); },()=>{ for(const o of window.__gpS) o.userData.bauteil='schild'; });
    await probe('SECHS (Kasten mit 6 Materialien)','SECHS',()=>{ const M=window.__bb.MAT; const me=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),[0,1,2,3,4,5].map(()=>M.ober('weiss','matt'))); me.position.set(0,1,3); window.__bb.scene.add(me); window.__gp6=me; },()=>{ window.__bb.scene.remove(window.__gp6); });
    await probe('BUDGET (80 eigene Materialien im Laden)','BUDGET',()=>{ const g=new THREE.Group(); for(let i=0;i<80;i++){ const me=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.1),new THREE.MeshStandardMaterial({color:0x123456+i})); me.position.set((i%10)*0.3-1.5,1.2+Math.floor(i/10)*0.2,1.5); g.add(me); } window.__bb.scene.add(g); window.__gp7=g; },()=>{ window.__bb.scene.remove(window.__gp7); });
    { const W2=await wache('verstoss'); const r=pruefe(M,W2).rot.filter(x=>x.startsWith('WACHE')); const an=r.length>0; if(!an) gpOk=false;
      console.log(`  GEGENPROBE WACHE (geteiltes markierungGelb umgefaerbt): ${an?'schlaegt an - richtig ('+r[0].slice(0,110)+')':'schlaegt NICHT an - Waechter blind'}`); }
    console.log(gpOk?'GEGENPROBE: alle 5 Laufzeit-Waechter schlagen an':'GEGENPROBE: mindestens ein Waechter blind');
  }
  if(hinweis.length) console.log('HINWEIS:\n  '+hinweis.join('\n  '));
  console.log('Dauer',dauer());
  console.log('MANGEL:',rot.length?rot.length:'keine');
  console.log(rot.length?'ERRORS: '+rot.join('\n  '):'ALLES OK: Tore/Bauteile markiert, keine neuen 6-Material-Waende, Budget eingehalten, MAT-Wache 0');
  await b.close(); process.exit(rot.length||(GP&&!gpOk)?1:0);
})().catch(e=>{ console.error('ABBRUCH',e); process.exit(3); });

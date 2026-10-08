/* Versandecke als ein Moebel: Packtisch, Rollenbahn, Bodenflaeche,
   Paketablage, DDL-Schild und Absperrband gehoeren in eine Gruppe
   und wandern im Umbaumodus gemeinsam. Dazu die Pause mit der
   Steuerung: Esc haelt an, im Spielbild stehen keine Tastenlisten.
   Braucht echtes three.js (Box3). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1180,height:820}}); p.setDefaultTimeout(120000);  /* Spielstand laden dauert im Software-Renderer >30 s */
  const fehler=[];
  p.on('pageerror',e=>fehler.push('PAGEERROR '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_CERT/.test(m.text())) fehler.push('CONSOLE '+m.text().slice(0,160)); });
  const neuesSpiel=async()=>{
    await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
    await p.click('#startBtns button:last-child');
    await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
    await p.click('#nameGo');
    await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
    await p.waitForTimeout(300);
  };
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await neuesSpiel();

  const mangel=[];
  const pruef=(name,ok,was)=>{ if(!ok) mangel.push(name+': '+was); };

  /* Hilfen im Browser: Weltbox eines Objekts, Kollisionen der Ecke */
  await p.evaluate(()=>{
    const bb=window.__bb;
    window.__box=o=>{ bb.scene.updateMatrixWorld(true); const x=new THREE.Box3().setFromObject(o); return {x0:+x.min.x.toFixed(2),x1:+x.max.x.toFixed(2),z0:+x.min.z.toFixed(2),z1:+x.max.z.toFixed(2)}; };
    window.__cols=()=>bb.colliders.filter(c=>c.ref===bb.packMov).map(c=>({x0:+c.minX.toFixed(2),x1:+c.maxX.toFixed(2),z0:+c.minZ.toFixed(2),z1:+c.maxZ.toFixed(2)}));
    window.__inG=o=>{ for(let q=o;q;q=q.parent) if(q===bb.packTisch) return true; return false; };
    bb.S.level=99; bb.S.money=9e6;
    ['shop_halb','lager','lager_nord','lager_gross','lager_sued','lager_sued2'].forEach(id=>bb.testKauf(id));   /* seit 08.10. steht die Station am Ende von Sued 3 */
  });

  /* 1 - alles in einer Gruppe */
  const a=await p.evaluate(()=>{
    const bb=window.__bb, g=bb.packTisch, o={};
    const fl=bb.rectOf(bb.packMov,g.position.x,g.position.z,g.rotation.y);
    o.flaeche=fl;
    /* Kleine Teile in der Flaeche, die nicht in der Gruppe haengen */
    o.fremd=[];
    bb.scene.traverse(q=>{
      if(!q.isMesh||window.__inG(q)) return;
      const x=new THREE.Box3().setFromObject(q);
      if(x.isEmpty()) return;
      if(x.max.x-x.min.x>3||x.max.z-x.min.z>3) return;      /* Boden, Waende */
      if(x.min.x>=fl.minX-0.05&&x.max.x<=fl.maxX+0.05&&x.min.z>=fl.minZ-0.05&&x.max.z<=fl.maxZ+0.05)
        o.fremd.push((q.geometry&&q.geometry.type)+'@'+((x.min.x+x.max.x)/2).toFixed(1)+','+((x.min.y+x.max.y)/2).toFixed(1)+','+((x.min.z+x.max.z)/2).toFixed(1));
    });
    let band=0, bandDrin=0;
    bb.scene.traverse(q=>{ if(q.userData&&q.userData.sperrband){ const x=new THREE.Box3().setFromObject(q);
      if(x.min.z<-6.5&&x.max.x<-8){ band++; if(window.__inG(q)) bandDrin++; } } });
    o.band=band; o.bandDrin=bandDrin;
    o.cols=window.__cols();
    o.pos={x:g.position.x,z:g.position.z};
    /* Die Flaeche passt in den ersten Hallenabschnitt */
    o.frei=bb.spotFree(bb.packMov,g.position.x,g.position.z,g.rotation.y);
    return o;
  });
  console.log('GRUPPE    ',JSON.stringify({fremd:a.fremd,band:a.band,bandDrin:a.bandDrin,cols:a.cols.length,frei:a.frei}));
  pruef('GRUPPE',a.fremd.length===0,a.fremd.length+' Teile in der Versandecke haengen nicht an der Gruppe');
  pruef('GRUPPE',a.band>0&&a.band===a.bandDrin,'das Absperrband haengt nicht an der Gruppe');
  pruef('GRUPPE',a.cols.length>=4,'vor dem Kauf erwartet: Tisch, Zaun, Band - gefunden '+a.cols.length);
  pruef('GRUPPE',a.frei===true,'die Ecke steht am Startplatz nicht frei im Raum');

  /* 2 - greifen und woanders absetzen */
  const v=await p.evaluate(()=>{
    const bb=window.__bb, g=bb.packTisch, o={};
    const teile={};
    g.traverse(q=>{ if(q.isMesh&&q.userData&&q.userData.sperrband&&!teile.band) teile.band=q; });
    teile.tisch=g.children[0];
    const vor={}; for(const k in teile) vor[k]=window.__box(teile[k]);
    const cVor=window.__cols();
    bb.toggleBuild(true);
    o.mode=document.getElementById('mode').textContent;
    const p0={x:g.position.x,z:g.position.z};
    /* seit 08.10. steht die Station am Ende von Sued 3: von mehreren Standpunkten aus greifen und neben dem Startplatz absetzen */
    o.greifbar=false;
    for(const off of [0.9,-0.9,1.6,-1.6]) for(const d of [2.5,3.0,2.0,3.5,1.5]){
      bb.setView(p0.x+off,p0.z+d,0,0);
      bb.grab(bb.packMov); bb.updateGrab();
      const frei=bb.spotFree(bb.packMov,g.position.x,g.position.z,g.rotation.y);
      if(frei&&Math.hypot(g.position.x-p0.x,g.position.z-p0.z)>0.3){ o.greifbar=true; break; }
      bb.cancelGrab&&bb.cancelGrab(); if(bb.grabbed){ bb.placeGrab(); }
    }
    if(!bb.grabbed){ bb.grab(bb.packMov); bb.updateGrab(); }
    bb.placeGrab();
    o.abgesetzt=bb.grabbed===null;
    o.dx=+(g.position.x-p0.x).toFixed(2); o.dz=+(g.position.z-p0.z).toFixed(2);
    o.teile={};
    for(const k in teile){ const n=window.__box(teile[k]);
      o.teile[k]={dx:+(n.x0-vor[k].x0).toFixed(2),dz:+(n.z0-vor[k].z0).toFixed(2)}; }
    const cNach=window.__cols();
    o.cols=cNach.length;
    o.colDx=cNach.length?+(cNach[0].x0-cVor[0].x0).toFixed(2):null;
    o.colDz=cNach.length?+(cNach[0].z0-cVor[0].z0).toFixed(2):null;
    /* Am alten Platz blockiert nichts mehr */
    o.altBlock=bb.colliders.filter(c=>c.ref===bb.packMov&&c.minX<p0.x-3.5&&c.maxX>p0.x-3.0&&c.minZ<p0.z-5&&c.maxZ>p0.z-4.9).length;
    return o;
  });
  console.log('VERSCHIEBEN',JSON.stringify(v));
  pruef('VERSCHIEBEN',v.abgesetzt===true,'die Ecke laesst sich nicht absetzen');
  pruef('VERSCHIEBEN',v.greifbar===true&&Math.abs(v.dx)+Math.abs(v.dz)>0.3,'die Ecke hat sich nicht bewegt: '+JSON.stringify({dx:v.dx,dz:v.dz,greifbar:v.greifbar}));
  for(const k in v.teile)
    pruef('VERSCHIEBEN',Math.abs(v.teile[k].dx-v.dx)<0.02&&Math.abs(v.teile[k].dz-v.dz)<0.02,`${k} wandert nicht mit (${JSON.stringify(v.teile[k])})`);
  pruef('VERSCHIEBEN',v.cols>=4&&Math.abs(v.colDx-v.dx)<0.02&&Math.abs(v.colDz-v.dz)<0.02,'die Kollision bleibt am alten Platz');
  pruef('VERSCHIEBEN',v.altBlock===0,'am alten Platz steht noch eine unsichtbare Wand');
  /* 29.09.: kein Umbaumodus mehr - mit Moebel in der Hand steht nur das, keine Tastenliste */
  pruef('UMBAU',v.mode===''||v.mode==='Möbel in der Hand','im Bild steht noch eine Tastenliste: '+v.mode);

  /* 3 - drehen: die Kollision dreht mit */
  await p.evaluate(()=>{ const bb=window.__bb; bb.toggleBuild(true); bb.setView(bb.packTisch.position.x,bb.packTisch.position.z+2.5,Math.PI/2,0); bb.grab(bb.packMov); bb.rotateGrab(); });
  const dr2=await p.evaluate(()=>{
    const bb=window.__bb, g=bb.packTisch, o={};
    bb.updateGrab();
    o.ry=+g.rotation.y.toFixed(3);
    o.frei=bb.spotFree(bb.packMov,g.position.x,g.position.z,g.rotation.y);
    /* seit 08.10.: Sued 3 ist enger - von mehreren Standpunkten aus einen freien Platz fuer die gedrehte Ecke suchen */
    const home={x:g.position.x,z:g.position.z};
    for(let i=0;i<24&&!o.frei;i++){ const off=[0,1.2,-1.2,2.4,-2.4,3.6][i%6], d=[0.5,1.5,2.5,3.5][Math.floor(i/6)];
      bb.setView(home.x+off,home.z+d,Math.PI/2,0); bb.updateGrab();
      o.frei=bb.spotFree(bb.packMov,g.position.x,g.position.z,g.rotation.y); }
    bb.placeGrab();
    o.abgesetzt=bb.grabbed===null;
    const c=window.__cols();
    o.tisch=c[0]; o.tiefer=c[0]?(c[0].z1-c[0].z0)>(c[0].x1-c[0].x0):null;
    const fl=bb.rectOf(bb.packMov,g.position.x,g.position.z,g.rotation.y);
    o.flaeche={minX:+fl.minX.toFixed(2),maxX:+fl.maxX.toFixed(2),minZ:+fl.minZ.toFixed(2),maxZ:+fl.maxZ.toFixed(2)};
    return o;
  });
  console.log('DREHEN    ',JSON.stringify(dr2));
  pruef('DREHEN',dr2.abgesetzt===true,'gedrehte Ecke laesst sich nicht absetzen');
  pruef('DREHEN',dr2.tiefer!==false,'die Tischkollision hat sich nicht mitgedreht');
  pruef('DREHEN',dr2.frei===true,'die gedrehte Ecke passt nirgends in den Hallenabschnitt: '+JSON.stringify(dr2.flaeche));

  /* 4 - die Flaeche ist belegt: kein Regal auf die Paketablage oder
         zwischen Tisch und Band. Und daneben geht es. */
  const f=await p.evaluate(()=>{
    const bb=window.__bb, g=bb.packTisch, o={};
    const fake={fw:1.0,fd:0.5,g:{visible:true,position:{x:0,z:0},rotation:{y:0}}};
    const welt=(lx,lz)=>{ const s=Math.sin(g.rotation.y), c=Math.cos(g.rotation.y);
      return {x:g.position.x+lx*c+lz*s,z:g.position.z-lx*s+lz*c}; };
    /* seit 06.10. stehen die Paletten an der Westwand der Station */
    const w1=welt(-0.9,0.2), w2=welt(0.0,0.85);
    o.aufAblage=bb.spotFree(fake,w1.x,w1.z,0);
    o.vorTisch=bb.spotFree(fake,w2.x,w2.z,0);
    const fl=bb.rectOf(bb.packMov,g.position.x,g.position.z,g.rotation.y);
    /* ein Stueck neben der Flaeche, noch im Hallenabschnitt */
    const cand=[[fl.maxX+0.9,(fl.minZ+fl.maxZ)/2],[fl.minX-0.9,(fl.minZ+fl.maxZ)/2],[(fl.minX+fl.maxX)/2,fl.minZ-0.6],[(fl.minX+fl.maxX)/2,fl.maxZ+0.6]];
    o.daneben=cand.some(([x,z])=>bb.spotFree(fake,x,z,0));
    return o;
  });
  console.log('BELEGT    ',JSON.stringify(f));
  pruef('BELEGT',f.aufAblage===false,'ein Regal passt auf die Paketablage');
  pruef('BELEGT',f.vorTisch===false,'ein Regal passt zwischen Tisch und Absperrband');
  pruef('BELEGT',f.daneben===true,'neben der Ecke passt gar nichts - Pruefung zu streng');

  /* 5 - Kauf: Band weg, seine Kollision auch; Pakete stehen auf der Ablage */
  const k=await p.evaluate(()=>{
    const bb=window.__bb, g=bb.packTisch, o={};
    bb.toggleBuild(false);
    bb.S.level=Math.max(bb.S.level,40); bb.S.money=Math.max(bb.S.money,9e6); ['lager','lager_nord','lager_gross','lager_sued','lager_sued2'].forEach(id=>bb.testKauf(id)); bb.testKauf('packstation');
    o.gekauft=!!bb.S.up.packstation;
    o.cols=window.__cols().length;
    let sicht=0; g.traverse(q=>{ if(q.userData&&q.userData.sperrband){ let v=q.visible; for(let a=q.parent;a;a=a.parent) if(!a.visible) v=false; if(v) sicht++; } });
    o.bandSichtbar=sicht;
    bb.S.up.onlineshop=true; bb.S.pakete=6; bb.syncPakete&&bb.syncPakete();
    return o;
  });
  console.log('KAUF      ',JSON.stringify(k));
  pruef('KAUF',k.gekauft===true,'die Packstation laesst sich nicht kaufen');
  pruef('KAUF',k.cols>=4,'nach dem Kauf erwartet: Tisch, Zaun, Paletten und der geparkte Kommissionierwagen - gefunden '+k.cols);
  pruef('KAUF',k.bandSichtbar===0,'das Band haengt nach dem Kauf noch');

  /* 6 - Speichern und Laden: die Ecke bleibt, wo sie steht */
  const vorher=await p.evaluate(()=>{ const bb=window.__bb, g=bb.packTisch; bb.save(); return {x:g.position.x,z:g.position.z,ry:+g.rotation.y.toFixed(3),cols:bb.colliders.filter(c=>c.ref===bb.packMov).length}; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  await p.waitForTimeout(300);
  const nach=await p.evaluate(()=>{ const bb=window.__bb, g=bb.packTisch;
    return {x:g.position.x,z:g.position.z,ry:+g.rotation.y.toFixed(3),
      cols:bb.colliders.filter(c=>c.ref===bb.packMov).length}; });
  console.log('LADEN     ',JSON.stringify({vorher,nach}));
  pruef('LADEN',Math.abs(nach.x-vorher.x)<0.02&&Math.abs(nach.z-vorher.z)<0.02&&Math.abs(nach.ry-vorher.ry)<0.01,'nach dem Laden steht die Ecke woanders');
  pruef('LADEN',nach.cols===vorher.cols,'nach dem Laden stimmt die Kollision nicht ('+nach.cols+' statt '+vorher.cols+')');

  /* 7 - Pause: Esc haelt an und zeigt die Steuerung */
  const tool0=await p.evaluate(()=>document.getElementById('tool').textContent);
  await p.keyboard.press('Escape');
  /* seit 26.09.: Hauptmaske, die Tasten stehen auf der Maske Steuerung */
  const aufHaupt=await p.evaluate(()=>window.__bb.pauseSeiteAktiv());
  await p.evaluate(()=>document.querySelector('#pHaupt [data-pseite="pSteuer"]').click());
  const pa=await p.evaluate(()=>({auf:document.getElementById('pause').classList.contains('show'),
    zeilen:document.querySelectorAll('#steuer kbd').length,
    text:document.getElementById('steuer').textContent}));
  /* Der Knopf muss ohne Scrollen zu sehen sein - vorher lag er bei
     820 Pixel Fensterhoehe unter der Kante der Karte. */
  await p.evaluate(()=>window.__bb.pauseSeite('pHaupt'));
  const knopf=await p.evaluate(()=>{ const b=document.getElementById('pBtn'), r=b.getBoundingClientRect();
    return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b; });
  pruef('PAUSE',knopf===true,'Weiterspielen liegt ausserhalb des sichtbaren Bereichs');
  /* Mit Mauszeiger-Sperre schliesst der Knopf die Pause (ein
     zweites Esc nur ohne Sperre, siehe 21-input) */
  await p.evaluate(()=>document.getElementById('pBtn').click());
  await p.waitForTimeout(200);
  const pz=await p.evaluate(()=>document.getElementById('pause').classList.contains('show'));
  console.log('PAUSE     ',JSON.stringify({auf:pa.auf,tasten:pa.zeilen,zu:!pz,tool:tool0}));
  pruef('PAUSE',pa.auf===true,'Esc oeffnet die Pause nicht');
  pruef('PAUSE',aufHaupt==='pHaupt','Esc zeigt nicht die Hauptmaske: '+aufHaupt);
  pruef('PAUSE',pa.zeilen>=15,'in der Pause stehen nur '+pa.zeilen+' Tasten');
  pruef('PAUSE',/Preisgerät/.test(pa.text)&&/Pfefferspray/.test(pa.text)&&/Möbel/.test(pa.text)&&!/Umbaumodus/.test(pa.text),'Steuerung unvollstaendig');
  pruef('PAUSE',!pz,'Weiterspielen schliesst die Pause nicht');
  pruef('HUD',tool0==='','unten rechts steht noch eine Tastenliste: '+tool0);

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',fehler.length||mangel.length?(fehler.concat(mangel)).join('\n'):'keine');
  await b.close();
})();

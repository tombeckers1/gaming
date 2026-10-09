/* Versandecke als eine Gruppe: Packtisch, Band, Box, Ladezone und Absperrband
   gehoeren zusammen. Seit 09.10. (Tom) ist die Ecke fest eingebaut (Box und
   Ladezone gehoeren zu Rolltor V1) und der ganze Versandbereich ist fuer Regale
   und Moebel gesperrt - auch in alten Spielstaenden (dort zieht, was im Bereich
   steht, beim Laden um). Dazu die Pause mit der Steuerung.
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
    const fremdOk=q=>{ for(let a=q;a;a=a.parent){ if(a===bb.VD.g||(a.userData&&a.userData.inventar)) return true; } return false; };   /* Rolltor/Telefon und Lager-PC stehen bewusst dort */
    bb.scene.traverse(q=>{
      if(!q.isMesh||window.__inG(q)||fremdOk(q)) return;
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
    /* nichts anderes ueberdeckt die Station (fest eingebaut: kein spotFree) */
    { const ov=(a,c)=>Math.min(a.maxX,c.maxX)-Math.max(a.minX,c.minX)>0.03&&Math.min(a.maxZ,c.maxZ)-Math.max(a.minZ,c.minZ)>0.03;
      o.frei=(bb.packMov.cols||[]).every(a=>!bb.colliders.some(c=>c.ref!==bb.packMov&&ov(a,c))); }
    return o;
  });
  console.log('GRUPPE    ',JSON.stringify({fremd:a.fremd,band:a.band,bandDrin:a.bandDrin,cols:a.cols.length,frei:a.frei}));
  pruef('GRUPPE',a.fremd.length===0,a.fremd.length+' Teile in der Versandecke haengen nicht an der Gruppe');
  pruef('GRUPPE',a.band>0&&a.band===a.bandDrin,'das Absperrband haengt nicht an der Gruppe');
  pruef('GRUPPE',a.cols.length>=4,'vor dem Kauf erwartet: Tisch, Zaun, Band - gefunden '+a.cols.length);
  pruef('GRUPPE',a.frei===true,'die Ecke steht am Startplatz nicht frei im Raum');

  /* 2 - fest eingebaut (09.10.): F auf die Ecke greift nichts, sondern sagt warum.
         Gegenprobe: als normales Moebel waere sie greifbar. */
  const v=await p.evaluate(()=>{
    const bb=window.__bb, g=bb.packTisch, o={};
    const tisch=bb.ppW(0,0,0), w=bb.vsWelt(0,0,0);
    bb.setView(w.x-1.6,w.z,-Math.PI/2,-0.35); bb.run(0.1,0.05); bb.setView(w.x-1.6,w.z,-Math.PI/2,-0.35); bb.run(0.05,0.05);   /* Kamera folgt erst im naechsten Schritt */
    o.imBlick=!!bb.moebelImBlick(); bb.moebelTaste(); o.gegriffen=!!bb.grabbed; o.toast=bb.toastLast;
    if(bb.grabbed) bb.cancelGrab();
    bb.packMov.fest=false; const m=bb.moebelImBlick(); o.gegenprobe=m===bb.packMov; bb.packMov.fest=true;
    o.pos={x:g.position.x,z:g.position.z,ry:g.rotation.y}; o.home=bb.PACK_HOME;
    void tisch; return o;
  });
  console.log('FEST      ',JSON.stringify(v));
  pruef('FEST',!v.imBlick&&!v.gegriffen&&/fest eingebaut/.test(v.toast||''),'die Versandecke laesst sich greifen: '+JSON.stringify(v));
  pruef('FEST_GEGENPROBE',v.gegenprobe,'Test taugt nicht: auch ohne fest waere die Ecke nicht im Blick');
  pruef('FEST',Math.abs(v.pos.x-v.home.x)<0.01&&Math.abs(v.pos.z-v.home.z)<0.01,'die Ecke steht nicht an ihrem festen Platz');

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
    /* 09.10.: Versandbereich - wohin die Box bis Stufe 3 waechst, die Ladezone vor V1 und der Gang hinter den Tischen */
    const w3=welt(-0.9,-1.6), w4=welt(-2.4,2.6), w5=welt(3.0,2.6);
    o.reserve=bb.spotFree(fake,w3.x,w3.z,0); o.ladezone=bb.spotFree(fake,w4.x,w4.z,0); o.gang=bb.spotFree(fake,w5.x,w5.z,0);
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
  pruef('VERSANDBEREICH',f.reserve===false&&f.ladezone===false&&f.gang===false,'im Versandbereich laesst sich ein Regal abstellen: '+JSON.stringify({reserve:f.reserve,ladezone:f.ladezone,gang:f.gang}));

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
  /* alter Spielstand: ein Verkaufsregal steht mitten im (neuen) Versandbereich - beim Laden zieht es um */
  const vorher=await p.evaluate(()=>{ const bb=window.__bb, g=bb.packTisch; const s=Math.sin(g.rotation.y), c=Math.cos(g.rotation.y), W=(lx,lz)=>({x:g.position.x+lx*c+lz*s,z:g.position.z-lx*s+lz*c});
    const q=W(-0.9,-1.6); const sh=bb.createShelf(bb.shelves.length,{kind:'standard',x:q.x,z:q.z,ry:0}); bb.placeMovable(sh.mov,q.x,q.z,0);
    const A=bb.versandBereich(), r=bb.rectOf(sh.mov,sh.g.position.x,sh.g.position.z,0);
    const drin=r.minX<A.maxX&&r.maxX>A.minX&&r.minZ<A.maxZ&&r.maxZ>A.minZ;
    bb.save(); return {x:g.position.x,z:g.position.z,ry:+g.rotation.y.toFixed(3),cols:bb.colliders.filter(c=>c.ref===bb.packMov).length,regalDrin:drin,regale:bb.shelves.length}; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  await p.waitForTimeout(300);
  const nach=await p.evaluate(()=>{ const bb=window.__bb, g=bb.packTisch, A=bb.versandBereich();
    const drin=bb.shelves.filter(sh=>{ const r=bb.rectOf(sh.mov,sh.g.position.x,sh.g.position.z,sh.g.rotation.y); return r.minX<A.maxX-0.02&&r.maxX>A.minX+0.02&&r.minZ<A.maxZ-0.02&&r.maxZ>A.minZ+0.02; }).length;
    return {x:g.position.x,z:g.position.z,ry:+g.rotation.y.toFixed(3),
      cols:bb.colliders.filter(c=>c.ref===bb.packMov).length,regaleDrin:drin,regale:bb.shelves.length}; });
  console.log('LADEN     ',JSON.stringify({vorher,nach}));
  pruef('LADEN',Math.abs(nach.x-vorher.x)<0.02&&Math.abs(nach.z-vorher.z)<0.02&&Math.abs(nach.ry-vorher.ry)<0.01,'nach dem Laden steht die Ecke woanders');
  pruef('LADEN',nach.cols===vorher.cols,'nach dem Laden stimmt die Kollision nicht ('+nach.cols+' statt '+vorher.cols+')');
  pruef('ALTSTAND_REGAL',vorher.regalDrin&&nach.regaleDrin===0&&nach.regale===vorher.regale,'Regal im Versandbereich zieht beim Laden nicht um (oder geht verloren): '+JSON.stringify({vorher:vorher.regalDrin,nachDrin:nach.regaleDrin,regale:[vorher.regale,nach.regale]}));

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

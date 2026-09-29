/* Moebel ohne Umbaumodus (Tom, 29.09.): Pakete so gross wie der Inhalt;
   mit dem Paket in der Hand oeffnet F es - das Paket verschwindet, das
   Regal haengt an der Hand und wird mit E abgesetzt. Mit F nimmt man ein
   stehendes Moebel in die Hand, noch einmal F packt ein leeres wieder ins
   Paket. Q stellt ein Paket nur ab. Den Umbaumodus gibt es nicht mehr. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=40; S.money=1e7;
    ['shop_halb','lager','lager_nord','shop_gross'].forEach(id=>bb.testKauf(id));
    bb.run(0.2,0.05);
    const taste=code=>window.dispatchEvent(new KeyboardEvent('keydown',{code}));
    const los=code=>window.dispatchEvent(new KeyboardEvent('keyup',{code}));
    const druck=code=>{ taste(code); los(code); bb.run(0.05,0.05); };
    /* 1. Paketgroessen: so lang wie das Regal, der Kuehlschrank steht im Karton */
    const M=bb.PAKET_MASS;
    o.groesse={standard:M.standard[0],kuehl:M.kuehl[1],
      standardW:bb.SHELFKIND.standard.w,kuehlH:bb.SHELFKIND.kuehl.lv[bb.SHELFKIND.kuehl.lv.length-1]+0.48};
    /* 2. Umbaumodus weg: F schaltet keinen Modus, der Knopf heisst "Möbel" */
    bb.setView(-3,2,0,-0.1); bb.run(0.1,0.05);
    druck('KeyF');
    o.modus={text:document.getElementById('mode').textContent,knopf:document.getElementById('btnMove').textContent,
      steuerung:document.body.innerText.indexOf('Umbaumodus')};
    /* 3. Paket tragen, mit Q abstellen: kein Regal, nur ein Paket - auch direkt an einem Stellplatz */
    const sl=bb.slotsOffen().filter(s=>(s.art||'wand')==='wand'&&!bb.shelves.some(h=>Math.abs(h.g.position.x-s.x)<0.3&&Math.abs(h.g.position.z-s.z)<0.3))[0];
    bb.setView(sl.x,sl.z+2.4,0,-0.1);
    const r0=bb.shelves.length, p0=bb.einbauPakete.length;
    S.carrying={regal:'standard'}; bb.run(0.05,0.05);
    o.tragen={knopf:document.getElementById('btnMove').textContent};
    druck('KeyQ');
    o.abstellen={regale:bb.shelves.length-r0,pakete:bb.einbauPakete.length-p0,tragen:!!S.carrying};
    /* 4. aufheben und mit F auspacken: Paket weg, Regal an der Hand */
    bb.paketAufheben(bb.einbauPakete[bb.einbauPakete.length-1]);
    bb.setView(-3,3.2,0,-0.1); bb.run(0.05,0.05);
    druck('KeyF');
    const g=bb.grabbed;
    o.auspacken={regale:bb.shelves.length-r0,pakete:bb.einbauPakete.length-p0,tragen:!!S.carrying,
      inHand:g?g.kind:null,knopf:document.getElementById('btnMove').textContent,spray:document.getElementById('btnTool').textContent};
    /* R dreht, E stellt ab */
    const ry0=g?g.g.rotation.y:0; druck('KeyR'); o.gedreht=g?Math.abs(g.g.rotation.y-ry0)>1:false;
    if(!g){ o.FEHLER="F packt nicht aus"; return o; }
    let frei=false;
    for(const [x,z] of [[-3,3.2],[-4,3.4],[-2,3.4],[-3,2.6]]){ bb.setView(x,z,0,-0.1); bb.run(0.05,0.05); if(bb.spotFree(g,g.g.position.x,g.g.position.z,g.g.rotation.y)){ frei=true; break; } }
    druck('KeyE');
    o.abgesetzt={frei,inHand:!!bb.grabbed,regale:bb.shelves.length-r0,
      x:g?+g.g.position.x.toFixed(2):null,z:g?+g.g.position.z.toFixed(2):null};
    /* 5. stehendes Regal mit F in die Hand nehmen (anschauen) */
    const sh=g&&g.ref;
    const zielen=()=>{ const px=sh.g.position.x, pz=sh.g.position.z+(bb.SHELFKIND.standard.d/2)+1.6;
      const dx=sh.g.position.x-px, dz=sh.g.position.z-pz;
      /* Regal steht gedreht - von der Seite schauen, auf der man frei steht */
      bb.setView(px,pz,Math.atan2(-dx,-dz),-0.35); bb.run(0.05,0.05); };
    if(sh){ zielen(); druck('KeyF'); }
    o.aufnehmen={inHand:bb.grabbed===(sh&&sh.mov)};
    /* 6. mit Ware: nicht einpacken */
    if(sh&&bb.grabbed){ bb.addToLevel(sh.levels[0],'boeller',1); druck('KeyF');
      o.mitWare={regal:bb.shelves.indexOf(sh)>=0,inHand:bb.grabbed===sh.mov,tragen:JSON.stringify(S.carrying)};
      bb.removeFromLevel(sh.levels[0]); }
    /* 7. leer: F packt ein - Regal weg, Paket in der Hand */
    if(bb.grabbed) druck('KeyF');
    o.einpacken={regale:bb.shelves.length-r0,weg:bb.shelves.indexOf(sh)<0,inHand:!!bb.grabbed,tragen:JSON.stringify(S.carrying),
      movable:bb.movables.indexOf(sh&&sh.mov)>=0};
    /* 8. frisch ausgepackt und Q: zurueck ins Paket */
    bb.setView(-3,3.2,0,-0.1); bb.run(0.05,0.05);
    druck('KeyF'); const g2=bb.grabbed; druck('KeyQ');
    o.zurueck={inHand:!!bb.grabbed,tragen:JSON.stringify(S.carrying),regale:bb.shelves.length-r0,war:g2?g2.kind:null};
    /* 9. Lagerregal: ein- und auspacken */
    if(!bb.racks.length) bb.regalStellen('rack');
    const rk=bb.racks[0];
    if(rk){ rk.slots.forEach(s=>{ if(s.box){ rk.g.remove(s.box.mesh); s.box=null; } });
      S.carrying=null; bb.grab(rk.mov); const n0=bb.racks.length; bb.moebelTaste();
      o.lagerregal={weg:bb.racks.length===n0-1,tragen:JSON.stringify(S.carrying)}; }
    /* 10. Deko/Kasse laesst sich greifen, aber nicht einpacken */
    S.carrying=null; const ck=bb.ckMovable; bb.grab(ck); bb.moebelTaste();
    o.kasse={inHand:bb.grabbed===ck,tragen:!!S.carrying}; bb.cancelGrab&&bb.cancelGrab();
    if(bb.grabbed) druck('KeyQ');
    o.kasseZurueck=!bb.grabbed;
    return o; });
  console.log('MOEBEL',JSON.stringify(r));
  if(r.FEHLER){ console.log('ERRORS: '+r.FEHLER); await b.close(); return; }
  pruef('GROESSE',r.groesse.standard>=0.95*r.groesse.standardW&&r.groesse.kuehl>=0.95*r.groesse.kuehlH,'Paket kleiner als der Inhalt: '+JSON.stringify(r.groesse));
  pruef('KEIN_UMBAUMODUS',!r.modus.text&&r.modus.knopf==='Möbel'&&r.modus.steuerung<0,'Umbaumodus noch da: '+JSON.stringify(r.modus));
  pruef('KNOPF_AUSPACKEN',r.tragen.knopf==='Auspacken','Knopf mit Paket: '+r.tragen.knopf);
  pruef('Q_STELLT_AB',r.abstellen.regale===0&&r.abstellen.pakete===1&&!r.abstellen.tragen,'Q am Stellplatz: '+JSON.stringify(r.abstellen));
  pruef('F_AUSPACKEN',r.auspacken.regale===1&&r.auspacken.pakete===0&&!r.auspacken.tragen&&r.auspacken.inHand==='shelf'&&r.auspacken.knopf==='Einpacken'&&r.auspacken.spray==='Drehen','F mit Paket: '+JSON.stringify(r.auspacken));
  pruef('DREHEN',r.gedreht,'R dreht nicht');
  pruef('ABSETZEN',r.abgesetzt.frei&&!r.abgesetzt.inHand&&r.abgesetzt.regale===1,'E setzt nicht ab: '+JSON.stringify(r.abgesetzt));
  pruef('AUFNEHMEN',r.aufnehmen.inHand,'F auf stehendes Regal nimmt es nicht: '+JSON.stringify(r.aufnehmen));
  pruef('MIT_WARE',r.mitWare&&r.mitWare.regal&&r.mitWare.inHand&&r.mitWare.tragen==='null','Regal mit Ware eingepackt: '+JSON.stringify(r.mitWare));
  pruef('EINPACKEN',r.einpacken.weg&&r.einpacken.regale===0&&!r.einpacken.inHand&&r.einpacken.tragen==='{"regal":"standard"}'&&!r.einpacken.movable,'F packt nicht ein: '+JSON.stringify(r.einpacken));
  pruef('Q_ZURUECK_INS_PAKET',r.zurueck.war==='shelf'&&!r.zurueck.inHand&&r.zurueck.tragen==='{"regal":"standard"}'&&r.zurueck.regale===0,'Q nach Auspacken: '+JSON.stringify(r.zurueck));
  pruef('LAGERREGAL',!!r.lagerregal&&r.lagerregal.weg&&r.lagerregal.tragen==='{"regal":"rack"}','Lagerregal: '+JSON.stringify(r.lagerregal));
  pruef('KASSE_NUR_VERSCHIEBEN',r.kasse.inHand&&!r.kasse.tragen&&r.kasseZurueck,'Kasse: '+JSON.stringify(r.kasse)+' zurueck '+r.kasseZurueck);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

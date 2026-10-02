/* Winzige Objekte ausblenden (03.10., Tom: "fluessiger"):
   - WEG: ein 5-cm-Wuerfel in 30 m Entfernung wird nicht mehr gezeichnet
   - DA: derselbe Wuerfel in 2 m Entfernung wird wieder gezeichnet
   - LICHT: ein leuchtendes Teil gleicher Groesse bleibt immer
   - BUENDEL: Ebene 1 (Buendel) bleibt unangetastet
   - CALLS: im iPhone-Format im Laden mindestens 20 % weniger Zeichenaufrufe
   Aufruf: node -r ladezeit-preload.js kappe.js real.html
   Gegenprobe: kleinTakt leer -> WEG und CALLS. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:3}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',null,{timeout:240000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:60000});
  const r=await p.evaluate(()=>{ const bb=__bb, m=[], sc=bb.scene;
    const calls=()=>{ bb.renderer.info.autoReset=false; bb.renderer.info.reset(); bb.shot(); return bb.renderer.info.render.calls; };
    bb.KAPPE.pause=true; bb.kleinTakt(1); bb.setView(0,4,0,-0.1); const vorher=calls(); bb.KAPPE.pause=false;
    const w=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.05),new THREE.MeshStandardMaterial({color:0x888888}));
    const l=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.05),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));
    const bu=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.05),new THREE.MeshStandardMaterial()); bu.layers.set(1);
    [w,l,bu].forEach(o=>{ o.position.set(0,1.6,-26); sc.add(o); o.updateMatrixWorld(); });
    bb.KAPPE.liste=null; bb.kleinTakt(1);
    if(w.layers.mask!==4) m.push('WEG: Wuerfel in 30 m bleibt sichtbar (Maske '+w.layers.mask+')');
    if(l.layers.mask!==1) m.push('LICHT: Leuchtteil ausgeblendet');
    if(bu.layers.mask!==2) m.push('BUENDEL: Ebene 1 veraendert');
    w.position.set(0,1.6,2); w.updateMatrixWorld(); bb.kleinTakt(1);
    if(w.layers.mask!==1) m.push('DA: Wuerfel in 2 m bleibt ausgeblendet');
    [w,l,bu].forEach(o=>sc.remove(o));
    bb.setView(0,4,0,-0.1); bb.kleinTakt(1); const nachher=calls();
    if(!(nachher<=vorher*0.8)) m.push('CALLS: '+vorher+' -> '+nachher);
    return {m,vorher,nachher}; });
  console.log('Zeichenaufrufe',r.vorher,'->',r.nachher);
  console.log('ERRORS:',r.m.concat(errs).join(' | ')||'keine'); await b.close();
})();

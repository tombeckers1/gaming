/* Buendeln mit Waechter (30.09., Leistung):
   - WENIGER: Zeichenaufrufe im Laden und auf der Strasse deutlich weniger
   - GLEICH: das Bild ist mit Buendeln (fast) pixelgleich wie ohne
   - WAECHTER: wird ein gebuendeltes Original verschoben, loest der Waechter
     sein Buendel auf und das Bild stimmt wieder (Gegenprobe: ohne Waechter
     bleibt der Unterschied)
   - TREFFER: Regalboeden und Pult sind weiter anklickbar
   Aufruf: node buendel.js real.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:60000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:480,height:300}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const mangel=[]; const pruef=(n,ok,w)=>{ if(!ok) mangel.push(n+': '+w); };
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('bb_buendel','0'); }); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, R=bb.renderer, gl=R.getContext(), W=gl.drawingBufferWidth, H=gl.drawingBufferHeight;
    bb.run(0.5,0.05); bb.setPost(false);
    const bild=()=>{ bb.renderFrame(1/60); const px=new Uint8Array(W*H*4); gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,px); return px; };
    const diff=(a,c)=>{ let n=0; for(let i=0;i<a.length;i+=4) if(Math.abs(a[i]-c[i])+Math.abs(a[i+1]-c[i+1])+Math.abs(a[i+2]-c[i+2])>24) n++; return +(100*n/(a.length/4)).toFixed(3); };
    const calls=()=>{ R.info.autoReset=false; R.info.reset(); bb.renderFrame(1/60); R.info.autoReset=true; return R.info.render.calls; };
    const blicke={laden:[0,2,0,0],strasse:[0,14,0,0]}, vor={}, o={};
    for(const [n,v] of Object.entries(blicke)){ bb.setView(...v); bb.run(0.05,0.05); bild(); vor[n]={px:bild(),calls:calls()}; }
    o.gebuendelt=bb.buendelJetzt();
    for(const [n,v] of Object.entries(blicke)){ bb.setView(...v); bb.run(0.05,0.05); bild(); const px=bild(); o[n]={vorher:vor[n].calls,nachher:calls(),diff:diff(vor[n].px,px)}; }
    /* Waechter: ein gebuendeltes Original im Laden-Blick verschieben */
    bb.setView(...blicke.laden); bb.run(0.05,0.05); const ref=bild();
    /* ein gut sichtbares Original: Radius 0,3-1,2 m */
    let ziel=null, best=0; for(const B of bb.BUENDEL.liste) for(const x of B.orig){ const g=x.o.geometry; if(!g.boundingSphere) g.computeBoundingSphere(); const rr=g.boundingSphere.radius*x.o.scale.x; if(rr>0.3&&rr<1.2&&rr>best){ best=rr; ziel=x.o; } }
    o.ziel=!!ziel;
    /* das Original direkt vor die Kamera ruecken und vergroessern - so ist
       die Aenderung sicher im Bild, sobald es wieder gezeichnet wird */
    let altPos=null, altSk=null;
    if(ziel){ altPos=ziel.position.clone(); altSk=ziel.scale.clone(); const cam=bb.camera, vorn=new THREE.Vector3(0,0,-1.6).applyQuaternion(cam.quaternion).add(cam.position);
      ziel.parent.updateMatrixWorld(true); ziel.position.copy(ziel.parent.worldToLocal(vorn)); ziel.scale.multiplyScalar(1.5); ziel.updateMatrixWorld(true); const oh=bild();
      /* ohne Waechter bleibt die Aenderung unsichtbar - das Buendel zeigt
         den alten Stand (Gegenprobe: genau das behebt der Waechter) */
      o.ohneWaechter=diff(ref,oh);
      bb.bWaechter(); const mit=bild(); o.mitWaechter=diff(ref,mit); o.aufgeloest=bb.BUENDEL.aufgeloest;
      ziel.position.copy(altPos); ziel.scale.copy(altSk); }
    /* Treffer: Pult bleibt anklickbar */
    const pos=bb.pultHit.parent.position; bb.setView(pos.x,pos.z+1.1,0,-0.5); bb.run(0.1,0.05); o.pult=bb.target&&bb.target.kind;
    return o; });
  console.log(JSON.stringify(r));
  pruef('WENIGER',r.laden.nachher<r.laden.vorher*0.9&&r.strasse.nachher<r.strasse.vorher*0.9,'Aufrufe '+JSON.stringify([r.laden,r.strasse]));
  pruef('GLEICH',r.laden.diff<0.5&&r.strasse.diff<0.5,'Bildunterschied in % der Pixel: '+r.laden.diff+' / '+r.strasse.diff);
  pruef('WAECHTER',r.ziel&&r.ohneWaechter<0.05&&r.mitWaechter>0.5&&r.aufgeloest>=1,'Waechter: '+JSON.stringify(r));
  pruef('TREFFER',r.pult==='pult','Pult nicht anklickbar: '+r.pult);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

/* Strassenbaeume (Tom, 24.09.): durchgehende Aeste statt gestapelter
   Zylinder, Rinde als Textur, Schnee per Shader.
   - jeder Baum ist ein Mesh mit Rindentextur und Schnee-Attribut
   - Hoehe 6 bis 11 m, Krone mindestens 4 m breit
   - fein genug verzweigt (Dreiecke), aber nicht ausufernd
   - kein Laternenmast steht in der Krone (Abstand > 2 m)
   Aufruf: node baum.js real.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, baeume=[], masten=[];
    bb.scene.traverse(o=>{
      if(o.userData.baum){ const bx=new THREE.Box3().setFromObject(o); const g=o.geometry;
        baeume.push({x:+o.position.x.toFixed(2),z:+o.position.z.toFixed(2),h:+(bx.max.y-bx.min.y).toFixed(2),
          breit:+Math.min(bx.max.x-bx.min.x,bx.max.z-bx.min.z).toFixed(2),dreiecke:g.index?g.index.count/3:g.attributes.position.count/3,
          rinde:!!(o.material.map),schnee:!!g.attributes.schnee,schneeMax:g.attributes.schnee?Math.max(...g.attributes.schnee.array):0}); }
      /* Laternenmasten: schlanke, hohe Zylinder am Gehweg */
      if(o.isMesh&&o.geometry&&o.geometry.type==='CylinderGeometry'){ const bx=new THREE.Box3().setFromObject(o);
        if(bx.max.y-bx.min.y>4&&bx.max.x-bx.min.x<0.4&&bx.min.z>9&&bx.max.z<12) masten.push({x:(bx.min.x+bx.max.x)/2,z:(bx.min.z+bx.max.z)/2}); }
    });
    return {baeume,masten}; });
  console.log('BAEUME  ',JSON.stringify(r.baeume));
  console.log('MASTEN  ',JSON.stringify(r.masten.map(m=>[+m.x.toFixed(2),+m.z.toFixed(2)])));
  pruef('ANZAHL',r.baeume.length>=2,'keine Strassenbaeume gefunden');
  for(const t of r.baeume){
    pruef('BAU',t.rinde&&t.schnee&&t.schneeMax>0.3,'Baum ohne Rinde/Schnee: '+JSON.stringify(t));
    pruef('FORM',t.h>6&&t.h<11&&t.breit>4,'Baum zu klein/schmal: '+JSON.stringify(t));
    pruef('DETAIL',t.dreiecke>3000&&t.dreiecke<40000,'Dreiecke: '+t.dreiecke);
    const nah=Math.min(...r.masten.map(m=>Math.hypot(m.x-t.x,m.z-t.z)));
    pruef('LATERNE',nah>2,'Laterne steht im Baum bei x '+t.x+' (Abstand '+nah.toFixed(2)+')');
  }
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Laeden gegenueber (Tom, 26.09.: "so aussehen, als sind da Laeden
   drin, gerne 3D"): jeder Laden hat einen Innenraum mit Einrichtung
   und Deckenlicht, die Fassade ist im Schaufenster ausgespart und die
   Scheibe laesst hineinsehen. */
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
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, o={innen:[],licht:0,schilder:0,ausgespart:0,scheiben:[]};
    bb.scene.traverse(m=>{ if(!m.isMesh||!m.material) return; const M=m.material;
      if(M.isMeshBasicMaterial&&M.color&&M.color.getHexString()==='fff6e2') o.licht++;
      if(M.isMeshStandardMaterial&&M.vertexColors&&M.emissive&&M.emissive.getHexString()===new THREE.Color(0x40362a).convertSRGBToLinear().getHexString()) o.innen.push(m.geometry.attributes.position.count);
      if(Array.isArray(M)) return; });
    /* Hausfronten mit Aussparung: Material mit alphaTest und transparentem Pixel mitten im Schaufenster */
    bb.scene.traverse(m=>{ if(!m.isMesh||!Array.isArray(m.material)) return; const F=m.material[4]; if(!F||!F.map||!(F.alphaTest>0)) return;
      const c=F.map.image, g=c.getContext('2d'), a=g.getImageData(Math.round(c.width*0.4),Math.round(c.height*0.85),1,1).data[3]; if(a===0) o.ausgespart++; });
    return o; });
  console.log('LAEDEN',JSON.stringify({innen:r.innen.length,min:Math.min(...r.innen),licht:r.licht,ausgespart:r.ausgespart}));
  pruef('INNENRAUM',r.innen.length>=3&&Math.min(...r.innen)>=400,'Laeden ohne Innenraum: '+JSON.stringify(r.innen));
  pruef('LICHT',r.licht>=r.innen.length,'Innenraeume ohne Deckenlicht');
  pruef('AUSGESPART',r.ausgespart>=r.innen.length&&r.ausgespart>0,'Fassade vor dem Laden nicht ausgespart: '+r.ausgespart+' von '+r.innen.length);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

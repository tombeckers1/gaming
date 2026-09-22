/* Baustellen-Vorschau: Jeder gesperrte Bereich muss einen Bauzaun,
   einen Rohbauboden und die Geisterumrisse der kuenftigen Regale
   zeigen - und beim Kauf muss alles davon verschwinden. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});

  const zaehle=id=>p.evaluate(zid=>{
    const bb=window.__bb, z=bb.ZONEN[zid];
    if(!z) return null;
    let sicht=0, geist=0, band=0;
    for(const o of z.wand){
      let v=true; for(let a=o;a;a=a.parent) if(!a.visible) v=false;
      if(!v) continue;
      sicht++;
      o.traverse&&o.traverse(q=>{ if(q.userData&&q.userData.vorschau) band++; });
      if(o.material&&o.material.vertexColors&&o.material.transparent&&o.geometry
         &&o.geometry.attributes&&o.geometry.attributes.position.count>100) geist++;
    }
    return {sicht,geist,band};
  },id);

  const FLAECHEN=['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west'];
  const RAMPEN=['rampe2','rampe3','rampe4','rampe5'];
  let bad=0;
  for(const id of FLAECHEN){
    const v=await zaehle(id);
    if(!v){ console.log(`${id}: keine Zone`); bad++; continue; }
    const ok=v.sicht>0&&v.geist>=2;
    console.log(`${id}: Bauzaun ${v.sicht} Teile, Geistermeshes ${v.geist} ${ok?'ok':'FEHLT'}`);
    if(!ok) bad++;
  }
  for(const id of RAMPEN){
    const v=await zaehle(id);
    const ok=v&&v.sicht>0;
    console.log(`${id}: Absperrung ${v?v.sicht:0} Teile ${ok?'ok':'FEHLT'}`);
    if(!ok) bad++;
  }
  /* Kauf: alles muss verschwinden */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=5e6;
    ['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west',
     'rampe2','rampe3','rampe4','rampe5'].forEach(id=>bb.buyUp(id)); });
  for(const id of FLAECHEN.concat(RAMPEN)){
    const v=await zaehle(id);
    const weg=v&&v.sicht===0;
    console.log(`${id} nach Kauf: ${v?v.sicht:'?'} sichtbare Teile ${weg?'ok':'STEHT NOCH'}`);
    if(!weg) bad++;
  }
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):(bad?`ERRORS: ${bad} Punkte fehlen`:'ERRORS: keine'));
  await b.close();
})();

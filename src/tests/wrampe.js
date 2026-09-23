const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1180,height:760}});
  const fehler=[];
  p.on('pageerror',e=>fehler.push('PAGEERROR '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_CERT/.test(m.text())) fehler.push('CONSOLE '+m.text().slice(0,160)); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});

  console.log('PLAETZE   ',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb, r={};
    r.ohne=bb.dockPlaetze();
    bb.S.level=40; bb.S.money=9e6;
    ['shop_halb','shop_gross','shop_ost','shop_sued','lager_nord','lager_gross','lager_sued','lager_west']
      .forEach(id=>{ bb.S.up[id]=true; if(bb.ZONEN[id]) bb.oeffneZone(id,false); });
    bb.applyZonen(); bb.wbaysInit();
    r.halleOffen=bb.dockPlaetze();
    ['rampe2','rampe3','rampe4'].forEach(id=>bb.testKauf(id));
    r.alleGekauft=bb.dockPlaetze();
    r.gekaufteIds=['rampe2','rampe3','rampe4'].map(id=>!!bb.S.up[id]);
    r.freieRampe=bb.wbayFrei();
    return r;
  })));

  /* Zwei Lieferungen gleichzeitig: eine an die Basisrampe, eine an Tor 2 */
  console.log('START     ',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb;
    bb.spawnTruck([{type:'boeller',q:1},{type:'raketen',q:1}],'mertens','Mertens');
    const ok=bb.spawnWTruck(0,[{type:'sekt',q:1},{type:'konfetti',q:1},{type:'boeller',q:1}],'kowalski','Kowalski');
    return {basisLkw:!!bb.truck, westOk:ok, westZustand:bb.wbays[0]&&bb.wbays[0].state};
  })));

  /* Simulationszeit vorspulen */
  const lauf=async(sek)=>p.evaluate(s=>{ const bb=window.__bb;
    for(let k=0;k<s*30;k++) bb.updateWBays(1/30);
    return {zustand:bb.wbays[0]&&bb.wbays[0].state,
            rest:bb.wbays[0]?bb.wbays[0].cargo.length:null,
            torY:+bb.WTORE[0].blatt.position.y.toFixed(2),
            kartons:bb.__floorBoxen?bb.__floorBoxen():null};
  },sek);
  console.log('NACH 6s   ',JSON.stringify(await lauf(6)));
  console.log('NACH 16s  ',JSON.stringify(await lauf(10)));
  await p.evaluate(()=>{ window.__bb.clock=760; window.__bb.setView(-34,-25.6,-Math.PI/2,0.02); });
  const d=await p.evaluate(()=>{ window.__bb.clock=760; return window.__bb.shot(); });
  require('fs').writeFileSync('/tmp/rampe-tor.jpg',Buffer.from(d.split(',')[1],'base64'));
  console.log('NACH 30s  ',JSON.stringify(await lauf(14)));
  console.log('NACH 60s  ',JSON.stringify(await lauf(30)));
  console.log('ENDE      ',JSON.stringify(await p.evaluate(()=>({
    bay:window.__bb.wbays[0], torY:+window.__bb.WTORE[0].blatt.position.y.toFixed(2)}))));
  console.log(fehler.length?fehler.slice(0,5).join('\n'):'ERRORS: keine');
  await b.close();
})();

/* Testmodus: ist im Testmodus wirklich jeder Ausbau erreichbar, und
   sagt das Spiel, warum ein Kauf nicht geht? */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1180,height:820}});
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

  console.log('STUFE     ',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb;
    const noetig=Math.max(...bb.UPGRADES.map(u=>u.lvl),...bb.LIZENZEN.map(l=>l.lvl));
    bb.toggleTest();
    return {hoechsteStufeImSpiel:noetig, testLevel:bb.S.level, reicht:bb.S.level>=noetig};
  })));

  /* Ohne Voraussetzung: das Spiel muss den Grund nennen, nicht schweigen */
  console.log('GESPERRT  ',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb; bb.__toast=null;
    const alt=window.toast;
    bb.testKauf('lager_west');
    return {gekauft:!!bb.S.up.lager_west, meldung:bb.toastLast||null};
  })));

  /* Die ganze Flaechenkette der Reihe nach - im Testmodus muss jede gehen */
  console.log('KETTE     ',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb; bb.S.money=9e6;
    const kette=['shop_halb','testfeld','shop_gross','shop_ost','shop_sued',
                 'lager','lager_nord','lager_gross','lager_sued','lager_sued2',
                 'lager_west','rampe2','rampe3','rampe4','packstation'];
    const out={};
    for(const id of kette){ bb.testKauf(id); out[id]=!!bb.S.up[id]; }
    out.__alleGekauft=kette.every(id=>bb.S.up[id]);
    out.__dockPlaetze=bb.dockPlaetze();
    return out;
  }),null,0));

  /* Zu wenig Geld: auch das muss erklaert werden */
  console.log('ZU TEUER  ',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb; bb.S.up.meister=false; bb.S.money=10;
    bb.testKauf('meister');
    return {gekauft:!!bb.S.up.meister, meldung:bb.toastLast||null};
  })));

  console.log(fehler.length?fehler.slice(0,5).join('\n'):'ERRORS: keine');
  await b.close();
})();

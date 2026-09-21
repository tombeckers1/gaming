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

  const zeig=async(t)=>console.log(t,JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb;
    return {stufe:bb.onlineStufe(),zahlen:bb.onlineZahlen(),
            knoepfe:[...document.querySelectorAll('#lbody button')].map(b=>b.dataset.a+(b.disabled?':aus':':an'))};
  })));

  /* 1. Nichts freigeschaltet */
  await p.evaluate(()=>{ window.__bb.openLaptop(); document.querySelector('#ltabs button[data-tab="online"]').click(); });
  await zeig('ZU        ');

  /* 2. Nur Onlineshop */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=40; bb.S.money=9e6; bb.S.up.onlineshop=true;
    document.querySelector('#ltabs button[data-tab="online"]').click(); });
  await zeig('PAUSCHAL  ');

  /* 3. Mit Packstation */
  await p.evaluate(()=>{ const bb=window.__bb;
    ['lager_gross','packstation'].forEach(id=>{ bb.S.up[id]=true; if(bb.ZONEN[id]) bb.oeffneZone(id,false); });
    bb.applyZonen(); bb.S.offen=11; bb.S.pakete=0;
    document.querySelector('#ltabs button[data-tab="online"]').click(); });
  await zeig('VERSAND   ');
  await p.screenshot({path:'/tmp/online-tab.jpg',type:'jpeg',quality:82});

  /* 4. Ein Paket packen */
  const vor=await p.evaluate(()=>({geld:window.__bb.S.money,offen:window.__bb.S.offen,pak:window.__bb.S.pakete}));
  await p.click('#onPack');
  const nach=await p.evaluate(()=>({geld:window.__bb.S.money,offen:window.__bb.S.offen,pak:window.__bb.S.pakete}));
  console.log('EINZELN    vorher',JSON.stringify(vor),'nachher',JSON.stringify(nach));

  /* 5. Alles packen - Rampe muss zwischendurch geleert werden */
  await p.click('#onPackAll');
  const alle=await p.evaluate(()=>({offen:window.__bb.S.offen,pak:window.__bb.S.pakete,
     ddl:window.__bb.stat?window.__bb.stat('ddl'):null}));
  console.log('ALLE       ',JSON.stringify(alle));

  /* 6. Leere Liste: Knoepfe aus */
  await zeig('LEER      ');

  /* 7. Live-Tick schreibt die Zahlen nach, ohne neu aufzubauen */
  await p.evaluate(()=>{ window.__bb.S.offen=4; window.__bb.updateOnline(); });
  console.log('TICK       ',await p.evaluate(()=>document.getElementById('onOffen').textContent+' / Knopf '+
    (document.getElementById('onPack').disabled?'aus':'an')));

  console.log(fehler.length?fehler.slice(0,5).join('\n'):'ERRORS: keine');
  await b.close();
})();

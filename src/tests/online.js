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
            knoepfe:[...document.querySelectorAll('#hApp button')].map(b=>b.dataset.a+(b.disabled?':aus':':an'))};
  })));

  /* 1. Nichts freigeschaltet */
  await p.evaluate(()=>{ window.__bb.openHandy('online'); });
  await zeig('ZU        ');

  /* 2. Nur Onlineshop */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=40; bb.S.money=9e6; bb.S.up.onlineshop=true;
    bb.openHandy('online'); });
  await zeig('PAUSCHAL  ');

  /* 3. Mit Packstation */
  await p.evaluate(()=>{ const bb=window.__bb;
    ['lager_gross','packstation'].forEach(id=>{ bb.S.up[id]=true; if(bb.ZONEN[id]) bb.oeffneZone(id,false); });
    bb.applyZonen(); bb.S.offen=11; bb.S.pakete=0;
    bb.openHandy('online'); });
  await zeig('VERSAND   ');
  await p.screenshot({path:'/tmp/online-tab.jpg',type:'jpeg',quality:82});

  /* 4. Die Liste zeigt jede Bestellung mit Inhalt, Groesse und Wert.
        Gepackt wird am Packtisch, nicht per Knopf - es gibt keinen
        Pack-Knopf mehr im Handy (Tom, 25.09.). */
  const liste=await p.evaluate(()=>{ const bb=window.__bb, li=document.getElementById('onListe');
    return {eintraege:li?li.querySelectorAll('.best').length:-1,text:li?li.textContent.slice(0,160):'',
      bestellungen:bb.S.bestellungen.length,mitInhalt:bb.S.bestellungen.every(x=>x.pos.length>0&&x.wert>0),
      knopf:!!document.getElementById('onPack')}; });
  console.log('LISTE      ',JSON.stringify(liste));
  if(liste.eintraege<1||liste.bestellungen!==11||!liste.mitInhalt||liste.knopf) fehler.push('LISTE: Bestellungen ohne Inhalt oder alter Pack-Knopf '+JSON.stringify(liste));

  /* 5. Live-Tick schreibt Zahlen und Liste nach, ohne neu aufzubauen */
  await p.evaluate(()=>{ window.__bb.S.offen=4; window.__bb.updateOnline(); });
  const tick=await p.evaluate(()=>({offen:document.getElementById('onOffen').textContent,
    eintraege:document.querySelectorAll('#onListe .best').length,S:window.__bb.S.bestellungen.length}));
  console.log('TICK       ',JSON.stringify(tick));
  if(tick.offen!=='4'||tick.eintraege!==4||tick.S!==4) fehler.push('TICK: '+JSON.stringify(tick));

  console.log(fehler.length?fehler.slice(0,5).join('\n'):'ERRORS: keine');
  await b.close();
})();

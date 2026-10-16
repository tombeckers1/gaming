/* Herausforderungen und eigene Marke (Werkbank, seit 16.10. statt Labor-Rezeptur - ausfuehrlich: werkbank.js) */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1460,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ const x=m.text(); if(m.type()==='error'&&x.indexOf('ERR_')<0) errs.push('CONSOLE: '+x); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);

  /* --- Herausforderungen: Gating und Zaehler --- */
  const erf=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.gesamt=bb.ERFOLGE.length;
    o.stufenGesamt=bb.erfGesamt();
    o.amStartOffen=bb.ERFOLGE.filter(e=>bb.erfOffen(e)).map(e=>e.id);
    o.amStartZu=bb.ERFOLGE.filter(e=>!bb.erfOffen(e)).length;
    /* Kein Erfolg darf eine Streak- oder Negativbedingung haben */
    o.keineStreaks=bb.ERFOLGE.every(e=>Array.isArray(e.stufen)&&e.stufen.every((v,i)=>i===0||v>e.stufen[i-1]));
    o.lohnSteigt=bb.ERFOLGE.every(e=>e.lohn.every((v,i)=>i===0||v>e.lohn[i-1]));
    o.lohnPasstZuStufen=bb.ERFOLGE.every(e=>e.lohn.length===e.stufen.length);
    /* Zaehler laeuft und schuettet aus */
    const g0=bb.S.money;
    for(let i=0;i<100;i++) bb.statVerkauf('boeller',1);
    o.boellerStand=bb.stat('v_boeller');
    o.stufeErreicht=bb.erfStufe(bb.ERFOLGE.find(e=>e.id==='v_boeller'));
    o.geldKam=bb.S.money>g0;
    /* Zaehler faellt nie */
    bb.statVerkauf('boeller',1);
    o.faelltNie=bb.stat('v_boeller')===101;
    /* Rekord nur nach oben */
    bb.statRekord('rek_tag',900); bb.statRekord('rek_tag',400);
    o.rekordBleibt=bb.stat('rek_tag')===900;
    /* Gesperrtes zaehlt nicht aus */
    const pk=bb.ERFOLGE.find(e=>e.id==='pakete');
    o.paketeZu=!bb.erfOffen(pk);
    bb.statAdd('pakete',9999);
    o.gesperrtKeineStufe=bb.erfStufe(pk)===0;
    bb.S.up.packstation=true;
    o.paketeOffenNachFreischaltung=bb.erfOffen(pk);
    return o;
  });
  console.log('ERFOLGE',JSON.stringify(erf));

  /* --- Bruchbilder muss man erst gesehen haben --- */
  const seh=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.gesehen.length=0;
    o.amAnfangKeine=bb.bruchListe().length===0;
    bb.bruchGesehen('kugel'); bb.bruchGesehen('kamuro'); bb.bruchGesehen('kugel');
    o.nachZwei=bb.bruchListe().length;
    o.keineDoppel=bb.S.gesehen.length===2;
    /* Zuenden traegt automatisch ein */
    bb.S.level=30; bb.S.money=400000; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    bb.igniteType('raketen'); bb.run(14,0.05);
    o.nachZuenden=bb.bruchListe().length;
    o.waechstDurchSpielen=o.nachZuenden>o.nachZwei;
    /* nur echte Bruchbilder, kein Muell */
    o.alleGueltig=bb.S.gesehen.every(e=>!!bb.wbEffekt(e));
    return o;
  });
  console.log('GESEHEN',JSON.stringify(seh));

  /* --- Die Kalkulation darf nicht ausnutzbar sein: jede Kombination hat Marge, teure Effekte kosten mehr --- */
  const form=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.BRUCH_IDS.forEach(e=>bb.bruchGesehen(e));
    let minM=9, maxM=0, ungueltig=0;
    for(let st=0;st<5;st++) bb.BRUCH_IDS.forEach(e=>{ const N=bb.WIRT.werkbank.stufen[st].schuss, d={stufe:st,abschnitte:[bb.wbAbschnitt({e,n:N})]};
      const k=bb.wbStueckkosten(d), m=bb.wbMarkt(d); if(!(k>0)||!(m>k)) ungueltig++; minM=Math.min(minM,m/k); maxM=Math.max(maxM,m/k); });
    o.ungueltigeKombis=ungueltig; o.margeVon=+minM.toFixed(2); o.margeBis=+maxM.toFixed(2);
    const d=e=>({stufe:2,abschnitte:[bb.wbAbschnitt({e,n:110})]});
    o.teuresKostetMehr=bb.wbStueckkosten(d('zeitregen'))>bb.wbStueckkosten(d('kugel'));
    o.teuresBringtMehr=bb.wbMarkt(d('zeitregen'))>bb.wbMarkt(d('kugel'));
    o.kaufwareMargen=['raketenklein','raketen','knatter','kugel75','fontaene'].filter(t=>bb.P[t]).map(t=>+(bb.P[t].market/bb.P[t].cost).toFixed(2));
    return o;
  });
  console.log('FORMEL',JSON.stringify(form));

  /* --- Entwickeln und liefern --- */
  const dev=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.level=30; bb.S.money=300000; ['shop_halb','lager','lager_nord','labor'].forEach(id=>bb.testKauf(id));
    const d=bb.wbEntwurfNeu(0); d.name='Nordlicht'; const r=bb.wbEntwickeln(d,0,0);
    o.ok=r.ok; const e=bb.eigeneListe()[0]; if(!e) return o;
    o.imKatalog=!!bb.P[e.id]; o.inORDER=bb.ORDER.indexOf(e.id)>=0; o.hatPreis=bb.S.prices[e.id]>0; o.station=bb.stationOf(e.id);
    bb.wbTick(); bb.wbTick(); o.unterwegs=bb.pendingListe().filter(x=>x.type===e.id).length;
    const st0=bb.stat('v_eigene'); bb.statVerkauf(e.id,3); o.zaehltAlsEigene=bb.stat('v_eigene')-st0===3;
    return o;
  });
  console.log('ENTWICKLUNG',JSON.stringify(dev));

  /* --- Masken --- */
  await p.evaluate(()=>window.__bb.openLaptop());
  const ui=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    /* Ziele liegen seit dem 24.09. auf dem Handy, der Rest am Laptop */
    const klick=t=>{ if(bb.HANDY_APPS.some(a=>a.id===t)) bb.openHandy(t); else { if(!bb.handyOpen&&!document.querySelector('#laptop.show')) bb.openLaptop(); if(bb.handyOpen){ bb.closeHandy(false); bb.openLaptop(); } document.querySelector(`#ltabs button[data-tab="${t}"]`).click(); } };
    o.tabs=[...document.querySelectorAll('#ltabs button')].map(x=>x.dataset.tab);
    klick('erf');
    o.erfZeilen=document.querySelectorAll('#hApp .row').length;
    o.erfBalken=document.querySelectorAll('#hApp .erfbar').length;
    o.erfBilder=document.querySelectorAll('#hApp img.pic').length;
    o.keinReiterEntwicklung=o.tabs.indexOf('rez')<0;
    return o;
  });
  console.log('MASKE',JSON.stringify(ui));
  await p.screenshot({path:process.argv[3]||'/tmp/claude-0/marke.png'});
  await p.evaluate(()=>window.__bb.openHandy('erf'));
  await p.screenshot({path:(process.argv[3]||'/tmp/claude-0/marke.png').replace('.png','-erf.png')});

  /* --- Speichern und laden --- */
  await p.evaluate(()=>{ window.__bb.closeHandy(false); window.__bb.closeLaptop(false); window.__bb.save(); });
  await p.reload();
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const sv=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const e=bb.eigeneListe()[0];
    o.eigene=bb.eigeneListe().length;
    o.wiederImKatalog=!!(e&&bb.P[e.id]);
    o.wiederInORDER=!!(e&&bb.ORDER.indexOf(e.id)>=0);
    o.poolDa=!!(e&&bb.pools[e.id]);
    o.gesehen=bb.S.gesehen.length;
    o.zaehler=bb.stat('v_boeller');
    o.stufen=bb.erfGeschafft();
    o.gutschrift=bb.S.gutschrift||0;
    return o;
  });
  console.log('SPEICHERN',JSON.stringify(sv));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

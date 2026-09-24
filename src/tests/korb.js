/* Startmaske: Neues Spiel -> Namensmaske -> aufschliessen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  /* Seit den Kapiteln ist das Lager am Anfang gesperrt; dieser Test
     braucht den LKW an der Rampe */
  await p.evaluate(()=>{ const bb=window.__bb; if(bb&&bb.S&&!bb.S.up.lager){ bb.S.up.lager=true; bb.oeffneZone('lager',true); } });
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_CERT')<0) errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  await p.waitForTimeout(400);
  console.log('KORB:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.money=2000;
    bb.openLaptop();
    o.leerKnopf=document.getElementById('lKorb').textContent;
    bb.cartAdd('knallerbsen',1,'mertens'); bb.cartAdd('knallerbsen',1,'mertens'); bb.cartAdd('boeller',1,'mertens');
    o.zeilen=bb.cartLines().length; o.kartons=bb.cartBoxes();
    o.ware=bb.cartGoods(); o.versand=bb.cartFee(); o.gesamt=bb.cartTotal();
    const vor=S.money;
    bb.cartOrder();
    o.abgebucht=+(vor-S.money).toFixed(2); o.korbLeer=bb.cartLines().length===0;
    o.pending=bb.pending.length;
    o.lieferSek=+bb.lieferSek().toFixed(2);
    o.allesGleich=bb.pending.every(x=>Math.abs(x.t-bb.pending[0].t)<0.001);
    return o;
  })));
  console.log('FREI:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.money=99999; bb.cartClear();
    for(let i=0;i<9;i++) bb.cartAdd('boeller',1,'mertens');
    o.ware=bb.cartGoods(); o.versand=bb.cartFee();
    bb.cartClear(); bb.cartAdd('knallerbsen',1,'mertens');
    o.kleinVersand=bb.cartFee();
    bb.cartClear(); o.leerVersand=bb.cartFee();
    return o;
  })));
  console.log('MASKE:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={},$=id=>document.getElementById(id);
    S.money=5000; bb.cartClear(); bb.openLaptop();
    o.hinweisWeg=!$('lHint');
    o.tabWeg=!document.querySelector('#ltabs button[data-tab="korb"]');
    const foot=$('lclose').parentElement;
    o.fussKnoepfe=[...foot.querySelectorAll('button')].map(b=>b.id);
    o.knopfLeer=$('lKorb').textContent;
    document.querySelector('#lbody button[data-a="cart"]').click();
    o.knopfVoll=$('lKorb').textContent;
    o.maskeZu=!$('korbOv').classList.contains('show');
    $('lKorb').click();
    o.maskeAuf=$('korbOv').classList.contains('show');
    o.kopf=$('korbCount').textContent+' / '+$('korbSum').textContent;
    const txt=$('korbBody').textContent;
    o.zeigtStueckpreis=/Karton × /.test(txt)||/Kartons × /.test(txt);
    o.zeigtZwischen=/Zwischensumme/.test(txt);
    o.zeigtVersand=/Liefergeb/.test(txt);
    o.zeigtGesamt=/Gesamt/.test(txt);
    $('korbBody').querySelector('button[data-a="cartplus"]').click();
    o.nachPlus=bb.cartBoxes(); o.kopfNachPlus=$('korbCount').textContent;
    $('korbBody').querySelector('button[data-a="cartminus"]').click();
    o.nachMinus=bb.cartBoxes();
    o.fussMaske=[...$('korbFoot').querySelectorAll('button')].map(b=>b.dataset.a);
    $('korbFoot').querySelector('button[data-a="cartgo"]').click();
    o.nachBestellen=bb.cartBoxes();
    o.maskeDanachZu=!$('korbOv').classList.contains('show');
    o.knopfDanach=$('lKorb').textContent;
    $('lKorb').click();
    o.leerMaske=/Warenkorb ist leer/.test($('korbBody').textContent);
    o.leerFuss=[...$('korbFoot').querySelectorAll('button')].map(b=>b.dataset.a);
    $('korbFoot').querySelector('button[data-a="korbclose"]').click();
    o.wiederZu=!$('korbOv').classList.contains('show');
    bb.closeLaptop(false);
    o.mitLaptopZu=!$('korbOv').classList.contains('show');
    return o;
  })));
  console.log('LKW:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.LR=bb.LR; o.front=bb.lrFront();
    bb.doorOpen(false); for(let i=0;i<300;i++) bb.updateTruck(0.05);
    const c=[]; for(let i=0;i<24;i++) c.push({type:'boeller',q:1});
    bb.spawnTruck(c,'mertens','Mertens');
    for(let i=0;i<600;i++) bb.updateTruck(0.05);
    o.zustand=bb.truck.state; o.pakete=bb.truck.boxes.length;
    o.tiefsteKiste=Math.min(...bb.truck.boxes.map(m=>m.position.x));
    o.stirnwand=bb.lrFront();
    /* Tor zu: das Aussenmodell darf erst sichtbar werden, wenn das Tor unten ist */
    while(bb.truck&&bb.truck.cargo.length){ bb.S.carrying=null; bb.takeBox(bb.truck.cargo[0]); }
    bb.S.carrying=null; bb.updateCarry(); bb.setView(-14,-2,0,0);
    for(let i=0;i<40;i++) bb.updateTruck(0.05);
    o.beimZufahren={zustand:bb.truck.state,torOffen:+bb.door.t.toFixed(2),aussen:bb.truck.g.visible,raum:!!bb.truck.raum,bruecke:!!bb.truck.bruecke};
    let guard=0, minTor=9;
    while(bb.truck&&bb.truck.state==='closing'&&guard++<2000){ bb.updateTruck(0.05);
      if(!bb.truck) break;
      if(bb.truck.g.visible&&bb.door.t>0.02) o.fehler='Aussenmodell sichtbar bei offenem Tor';
      if(!bb.truck.raum&&bb.door.t>0.02) o.fehler2='Laderaum verschwand bei offenem Tor';
      if(!bb.truck.raum) minTor=Math.min(minTor,bb.door.t); }
    o.raumWegBeiTorstand=minTor===9?null:+minTor.toFixed(2);
    o.nachSchliessen=bb.truck?{zustand:bb.truck.state,tor:+bb.door.t.toFixed(2),aussen:bb.truck.g.visible}:'weg';
    return o;
  })));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

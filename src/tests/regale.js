/* Regal-Lieferkette: Am Anfang steht kein Regal im Laden. Regale
   kommen ausschliesslich vom Lieferanten "Regalbau" und werden mit
   dem LKW an die Rampe gebracht - Paket tragen, dann aufbauen.
   Jede Pruefung hat eine Gegenprobe. */
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
  /* Seit den Kapiteln ist das Lager am Anfang gesperrt; dieser Test
     braucht den LKW an der Rampe */
  await p.evaluate(()=>{ const bb=window.__bb; if(bb&&bb.S&&!bb.S.up.lager){ bb.S.up.lager=true; bb.oeffneZone('lager',true); } });
  await p.waitForTimeout(400);

  const mangel=[];
  const pruef=(name,ok,was)=>{ if(!ok) mangel.push(name+': '+was); };

  /* 1 - leerer Start */
  const start=await p.evaluate(()=>{
    const bb=window.__bb;
    return {regale:bb.shelves.length,racks:bb.racks.length,
            kisten:bb.UPGRADES.filter(u=>u.art==='shelf'||u.art==='rack').length};
  });
  console.log('START     ',JSON.stringify(start));
  pruef('START',start.regale===0&&start.racks===0,'es steht schon etwas da');
  pruef('START',start.kisten===0,'Regale haengen noch in der Ausbauliste');

  /* 2 - Sortiment des Lieferanten: klein/rack ab Stufe 1, der Rest gesperrt */
  const sort=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    bb.REGALWARE.forEach(r=>o[r.id]=bb.regalOffen(r.id));
    return o;
  });
  console.log('SORTIMENT ',JSON.stringify(sort));
  /* Seit den Kapiteln: das kleine Regal von Anfang an, das
     Lagerregal erst mit dem Lager ab Level 6 */
  pruef('SORTIMENT',sort.klein===true&&sort.rack===false,'kleines Regal nicht ab Start oder Lagerregal schon auf Level 1: '+JSON.stringify(sort));
  pruef('SORTIMENT',['standard','kuehl','hoch','gondel','eck','rhoch','rschwer'].every(k=>sort[k]===false),
        'ein grosses Regal ist auf Stufe 1 schon kaufbar');

  /* 3 - Bestellung: Geld weg, Lieferung unterwegs */
  const best=await p.evaluate(()=>{
    const bb=window.__bb;
    bb.S.money=5000; const vor=bb.S.money, preis=bb.regalPreis('klein');
    bb.orderRegal('klein');
    return {preis,gezahlt:+(vor-bb.S.money).toFixed(2),
            unterwegs:bb.pending.filter(x=>x.regal==='klein').length,
            sofortAufgebaut:bb.shelves.length};
  });
  console.log('BESTELLT  ',JSON.stringify(best));
  pruef('BESTELLT',best.gezahlt===best.preis,'der Preis stimmt nicht');
  pruef('BESTELLT',best.unterwegs===1,'die Bestellung steht nicht in der Lieferliste');
  pruef('BESTELLT',best.sofortAufgebaut===0,'das Regal steht sofort da, ohne Lieferung');

  /* 4 - Gegenprobe: ohne Geld keine Bestellung */
  const pleite=await p.evaluate(()=>{
    const bb=window.__bb; bb.S.money=0;
    const vorher=bb.pending.length; bb.orderRegal('klein');
    return {neu:bb.pending.length-vorher,meldung:bb.toastLast||null};
  });
  console.log('OHNEGELD  ',JSON.stringify(pleite));
  pruef('OHNEGELD',pleite.neu===0,'ohne Geld wird trotzdem geliefert');
  pruef('OHNEGELD',/fehl/i.test(pleite.meldung||''),'das Spiel sagt nicht, warum es nicht geht');

  /* 5 - Gegenprobe: gesperrte Ware laesst sich nicht bestellen */
  const gesperrt=await p.evaluate(()=>{
    const bb=window.__bb; bb.S.money=9e5;
    const vorher=bb.pending.length; bb.orderRegal('gondel');
    return {neu:bb.pending.length-vorher,meldung:bb.toastLast||null};
  });
  console.log('GESPERRT  ',JSON.stringify(gesperrt));
  pruef('GESPERRT',gesperrt.neu===0,'ein gesperrtes Regal wird trotzdem geliefert');

  /* 6 - Der LKW bringt es: Welle ausloesen, andocken, Paket nehmen */
  const fahrt=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    bb.pending.forEach(x=>x.t=0);
    for(let i=0;i<40;i++) bb.step(0.05);
    o.lkw=!!bb.truck;
    o.ladung=bb.truck?bb.truck.cargo.map(c=>c.regal||c.type):[];
    for(let i=0;i<900&&bb.truck&&bb.truck.state!=='docked';i++) bb.updateTruck(0.05);
    o.zustand=bb.truck?bb.truck.state:'weg';
    bb.setView(-22.5,-2,0,0);
    const paket=bb.truck&&bb.truck.cargo.find(c=>c.regal);
    if(paket){ bb.S.carrying=null; bb.takeBox(paket); }
    o.getragen=bb.S.carrying?(bb.S.carrying.regal||bb.S.carrying.type):null;
    return o;
  });
  console.log('LIEFERUNG ',JSON.stringify(fahrt));
  pruef('LIEFERUNG',fahrt.lkw===true,'es kommt kein LKW');
  pruef('LIEFERUNG',fahrt.ladung.indexOf('klein')>=0,'das Regalpaket ist nicht an Bord');
  pruef('LIEFERUNG',fahrt.zustand==='docked','der LKW dockt nicht an');
  pruef('LIEFERUNG',fahrt.getragen==='klein','das Regalpaket laesst sich nicht tragen');

  /* 7 - Aufbauen */
  const bau=await p.evaluate(()=>{
    const bb=window.__bb;
    bb.setView(-2,2,0,0);
    const vor=bb.shelves.length; bb.dropBox();
    return {vor,nach:bb.shelves.length,haendeFrei:!bb.S.carrying};
  });
  console.log('AUFBAU    ',JSON.stringify(bau));
  pruef('AUFBAU',bau.nach===bau.vor+1,'das Regal wird nicht aufgebaut');
  pruef('AUFBAU',bau.haendeFrei,'das Paket klebt an den Haenden');

  /* 8 - Gegenprobe: ohne Paket in der Hand entsteht kein Regal */
  const ohne=await p.evaluate(()=>{
    const bb=window.__bb; bb.S.carrying=null;
    const vor=bb.shelves.length; bb.dropBox();
    return {vor,nach:bb.shelves.length};
  });
  console.log('LEERHAND  ',JSON.stringify(ohne));
  pruef('LEERHAND',ohne.nach===ohne.vor,'ein Regal entsteht aus dem Nichts');

  /* 9 - Speichern und laden: unterwegs bleibt unterwegs */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.money=5000; bb.orderRegal('klein'); bb.save(); });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  await p.waitForTimeout(400);
  const nachLaden=await p.evaluate(()=>{
    const bb=window.__bb;
    return {regale:bb.shelves.length,unterwegs:bb.pending.filter(x=>x.regal).length};
  });
  console.log('SPIELSTAND',JSON.stringify(nachLaden));
  pruef('SPIELSTAND',nachLaden.regale===1,'das aufgebaute Regal ist nach dem Laden weg');
  pruef('SPIELSTAND',nachLaden.unterwegs===1,'die offene Regallieferung geht beim Laden verloren');

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',fehler.length||mangel.length?fehler.concat(mangel).join('\n'):'keine');
  await b.close();
})();

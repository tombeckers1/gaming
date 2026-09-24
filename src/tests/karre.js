/* Sackkarre und Plattformwagen (Tom, 24.09.):
   - ohne Kauf: K meldet, wo es die Karre gibt
   - Sackkarre: vier Kartons vom Boden aufnehmen, der fuenfte passt nicht
   - einraeumen leert den obersten, dann rueckt der naechste nach
   - Q stellt den obersten ab, der naechste rueckt nach
   - mit Last laeuft man langsamer
   - Plattformwagen: acht Kartons, auch aus dem LKW
   - wegstellen geht erst, wenn die Karre leer ist
   - der Stapel bleibt nach dem Neuladen erhalten
   Aufruf: node karre.js real.html [bild-praefix] */
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
  const p=await b.newPage({viewport:{width:1000,height:640}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const pre=process.argv[3];
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    bb.run(0.3,0.05);
    bb.toggleKarre(); o.ohne={an:bb.karreAn(),toast:bb.toastLast};
    S.level=10; S.money=9000; bb.buyUp('sackkarre'); bb.toggleKarre(); o.an=bb.karreAn();
    /* sechs Kartons auf den Boden, dann einzeln aufheben */
    const sorten=['wunder','knallerbsen','tisch','knallfrosch','wunder','tisch'];
    sorten.forEach((t,i)=>bb.spawnFloorBox(t,bb.P[t].box,{x:-3+i*0.8,y:0.2,z:2,ry:0}));
    const boxen=bb.floorBoxes.slice(-6);
    for(let i=0;i<5;i++) bb.tuAktion('box',boxen[i]);
    o.last=bb.karreLast(); o.fuenfterLiegt=bb.floorBoxes.indexOf(boxen[4])>=0; o.vollToast=bb.toastLast;
    o.prompt=bb.promptFor({kind:'box',ref:boxen[5]});
    /* einraeumen: oberster ist knallfrosch; ein Regal stellen und fuellen */
    bb.regalStellen('standard'); const lv=bb.allLevels()[0];
    const oben=S.carrying.type; for(let i=0;i<60;i++) bb.stockOne(lv,true); bb.run(0.1,0.05);
    o.nachEinraeumen={last:bb.karreLast(),oben:S.carrying&&S.carrying.type,warOben:oben};
    /* Q: obersten abstellen */
    const vorQ=bb.floorBoxes.length; bb.dropBox(); bb.run(0.1,0.05);
    o.nachQ={last:bb.karreLast(),boden:bb.floorBoxes.length-vorQ};
    /* Tempo */
    const x0=bb.pl.x; bb.pl.x=0; bb.pl.z=0; const t0={x:bb.pl.x,z:bb.pl.z};
    return o; });
  console.log('SACK    ',JSON.stringify(r));
  pruef('OHNE',!r.ohne.an&&/Laptop/.test(r.ohne.toast),'ohne Kauf: '+JSON.stringify(r.ohne));
  pruef('SACK',r.an&&r.last===4&&r.fuenfterLiegt&&/voll/.test(r.vollToast),'Sackkarre nimmt nicht genau vier: '+JSON.stringify(r));
  pruef('SACK',r.prompt&&r.prompt.a===false&&/voll/.test(r.prompt.t),'Hinweis bei voller Karre: '+JSON.stringify(r.prompt));
  pruef('NACH',r.nachEinraeumen.last===3&&r.nachEinraeumen.oben&&r.nachEinraeumen.oben!==r.nachEinraeumen.warOben,'nach dem Einraeumen ruckt keiner nach: '+JSON.stringify(r.nachEinraeumen));
  pruef('Q',r.nachQ.last===2&&r.nachQ.boden===1,'Q stellt nicht den obersten ab: '+JSON.stringify(r.nachQ));

  /* Tempo: je 1 s geradeaus, mit und ohne Last */
  const tempo=await p.evaluate(async()=>{ const bb=window.__bb;
    const lauf=async()=>{ bb.setView(0,0,0,0); const z0=bb.pl.z; window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'})); bb.run(1,0.05); window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'})); return +(z0-bb.pl.z).toFixed(2); };
    const mit=await lauf();
    const st=bb.karreStapel().splice(0); const c=bb.S.carrying; bb.S.carrying=null; bb.S.karre.an=false; bb.updateKarre();
    const ohne=await lauf();
    bb.S.karre.an=true; bb.karreStapel().push(...st); bb.S.carrying=c; bb.updateKarre();
    return {mit,ohne}; });
  console.log('TEMPO   ',JSON.stringify(tempo));
  pruef('TEMPO',tempo.mit>0.5&&tempo.mit<tempo.ohne*0.95,'mit Karre nicht langsamer: '+JSON.stringify(tempo));

  /* Bild: Sackkarre mit Kartons */
  await p.evaluate(()=>{ const bb=window.__bb; bb.setView(0,1,0,-0.25); bb.run(0.05,0.05); bb.renderFrame(1/60); });
  if(pre) await p.screenshot({path:pre+'_sack.png'});

  /* Wegstellen erst leer, dann Plattformwagen mit acht aus dem LKW */
  const w=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    bb.toggleKarre(); o.volleWeg={an:bb.karreAn(),toast:bb.toastLast};
    bb.karreStapel().splice(0); S.carrying=null; bb.toggleKarre(); o.leerWeg=bb.karreAn();
    S.up.lager=true; bb.applyZonen(); S.level=12; bb.buyUp('wagen'); bb.toggleKarre(); o.art=bb.karreArt();
    bb.spawnTruck(Array.from({length:10},()=>({type:'wunder',q:1})),'mertens','Mertens');
    for(let i=0;i<400&&!(bb.truck&&bb.truck.state==='docked');i++) bb.run(0.1,0.1);
    o.lkw=bb.truck&&bb.truck.state;
    for(let i=0;i<10;i++){ if(bb.truck&&bb.truck.cargo.length) bb.tuAktion('tbox',bb.truck.cargo[0]); }
    o.last=bb.karreLast(); o.imLkw=bb.truck?bb.truck.cargo.length:null;
    bb.save(); return o; });
  console.log('WAGEN   ',JSON.stringify(w));
  pruef('WEG',w.volleWeg.an&&!w.leerWeg,'Wegstellen: '+JSON.stringify(w));
  pruef('WAGEN',w.art==='wagen'&&w.lkw==='docked'&&w.last===8&&w.imLkw===2,'Plattformwagen aus dem LKW: '+JSON.stringify(w));
  await p.evaluate(()=>{ const bb=window.__bb; bb.setView(-14,-3,Math.PI/2,-0.3); bb.run(0.05,0.05); bb.renderFrame(1/60); });
  if(pre) await p.screenshot({path:pre+'_wagen.png'});

  /* Neuladen: Stapel bleibt */
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:first-child',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const nl=await p.evaluate(()=>({an:window.__bb.karreAn(),last:window.__bb.karreLast()}));
  console.log('LADEN   ',JSON.stringify(nl));
  pruef('LADEN',nl.an&&nl.last===8,'Stapel nach dem Neuladen: '+JSON.stringify(nl));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

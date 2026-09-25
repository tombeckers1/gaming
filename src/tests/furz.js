/* Schabernack-Edition: Furzrakete und Furzboeller; Heuler und Stinkbomben sind raus */
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
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ const x=m.text(); if(m.type()==='error'&&x.indexOf('ERR_')<0) errs.push('CONSOLE: '+x); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.level=30; bb.S.money=200000; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    o.imSortiment=['furzrakete','boeller'].map(t=>!!(bb.P[t]&&bb.hatLizenz(bb.lizenzOf(t))));
    o.paket=bb.lizenzOf('furzrakete');
    o.station=['furzrakete','boeller'].map(t=>bb.P[t].shape);
    const leben=()=>{ let n=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let i=0;i<ps.life.length;i++) if(ps.life[i]>0) n++; return n; };
    /* Furzrakete: Steigflug, dann die Wolke */
    bb.igniteType('furzrakete');
    bb.run(1.0,0.05); o.nachStart=leben();
    bb.run(1.5,0.05); o.imFlug=bb.rockets.length;
    bb.run(2.0,0.05); o.nachKnall=leben();
    /* braune Toene in der Wolke */
    let braun=0, gesamt=0;
    const b3=bb.psBig.base;
    for(let i=0;i<bb.psBig.life.length;i++) if(bb.psBig.life[i]>0){ gesamt++;
      if(b3[i*3]>b3[i*3+2]*1.6&&b3[i*3]<0.75) braun++; }
    o.brauneQuote=gesamt?Math.round(braun/gesamt*100):0;
    bb.run(10,0.05);
    /* Furzboeller: Pups und gruenbraune Wolke */
    const w0=bb.WOLKEN.length; bb.igniteType('boeller'); bb.run(1.6,0.05); o.furzWolke=bb.WOLKEN.length-w0;
    /* Heuler ist seit dem 25.09. raus */
    o.heulerWeg=!bb.P.heuler&&!bb.LIZENZEN.some(l=>l.items.includes('heuler'));
    bb.run(8,0.05);
    /* Stinkbomben sind seit dem 23.09. raus aus dem Sortiment */
    o.stinkWeg=!bb.P.stinkbombe&&!bb.LIZENZEN.some(l=>l.items.includes('stinkbombe'));
    o.keineRaketenUebrig=bb.rockets.length===0;
    o.emitterLeer=bb.emitters.length===0;
    /* Verkauf: passen sie ins Regal und werden sie gekauft? */
    /* Erst Regale kaufen, dann passt auch etwas hinein */
    for(let i=0;i<4;i++) bb.regalStellen('standard');
    for(let i=0;i<2;i++) bb.regalStellen('hoch');
    o.regale=bb.shelves.length;
    o.regalPlatz=['furzrakete','boeller'].map(t=>bb.shelfCapOf(t));
    o.vergleich={raketenklein:bb.shelfCapOf('raketenklein'),monsterboeller:bb.shelfCapOf('monsterboeller'),knallerbsen:bb.shelfCapOf('knallerbsen')};
    o.einraeumbar=['furzrakete','boeller'].map(t=>!!bb.emptyLevel(t));
    o.marktpreise=['furzrakete','boeller'].map(t=>bb.marketOf(t));
    o.kaufchance=['furzrakete','boeller'].map(t=>+bb.buyChance(t,bb.marketOf(t),1,false,null).toFixed(2));
    return o;
  });
  console.log('SCHABERNACK',JSON.stringify(r));
  if(!r.stinkWeg) errs.push('Stinkbomben stehen noch im Sortiment');
  if(!r.heulerWeg) errs.push('Heuler steht noch im Sortiment');
  if(r.furzWolke<1) errs.push('Furzboeller macht keine Wolke');
  if(r.einraeumbar.some(x=>!x)) errs.push('nicht einraeumbar: '+JSON.stringify(r.einraeumbar));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

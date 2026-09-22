/* Schabernack-Edition: Furzrakete, Heuler, Stinkbomben */
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
    o.imSortiment=['furzrakete','heuler','stinkbombe'].map(t=>!!(bb.P[t]&&bb.hatLizenz(bb.lizenzOf(t))));
    o.paket=bb.lizenzOf('furzrakete');
    o.station=['furzrakete','heuler','stinkbombe'].map(t=>bb.P[t].shape);
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
    /* Heuler */
    const v1=leben(); bb.igniteType('heuler'); bb.run(2.0,0.05); o.heulerPartikel=leben()-v1;
    bb.run(8,0.05);
    /* Stinkbomben */
    const v2=leben(); bb.igniteType('stinkbombe'); bb.run(2.0,0.05); o.stinkPartikel=leben()-v2;
    bb.run(8,0.05);
    o.keineRaketenUebrig=bb.rockets.length===0;
    o.emitterLeer=bb.emitters.length===0;
    /* Verkauf: passen sie ins Regal und werden sie gekauft? */
    /* Erst Regale kaufen, dann passt auch etwas hinein */
    for(let i=0;i<4;i++) bb.regalStellen('standard');
    for(let i=0;i<2;i++) bb.regalStellen('hoch');
    o.regale=bb.shelves.length;
    o.regalPlatz=['furzrakete','heuler','stinkbombe'].map(t=>bb.shelfCapOf(t));
    o.vergleich={raketenklein:bb.shelfCapOf('raketenklein'),doppelschlag:bb.shelfCapOf('doppelschlag'),knallerbsen:bb.shelfCapOf('knallerbsen')};
    o.einraeumbar=['furzrakete','heuler','stinkbombe'].map(t=>!!bb.emptyLevel(t));
    o.marktpreise=['furzrakete','heuler','stinkbombe'].map(t=>bb.marketOf(t));
    o.kaufchance=['furzrakete','heuler','stinkbombe'].map(t=>+bb.buyChance(t,bb.marketOf(t),1,false,null).toFixed(2));
    return o;
  });
  console.log('SCHABERNACK',JSON.stringify(r));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

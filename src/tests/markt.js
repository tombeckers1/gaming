/* Markt-Dynamik und Lizenzpakete */
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
  const p=await b.newPage({viewport:{width:1400,height:820}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ const x=m.text(); if(m.type()==='error'&&x.indexOf('ERR_CERT')<0&&x.indexOf('ERR_TUNNEL')<0) errs.push('CONSOLE: '+x); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);

  /* --- Lizenzen --- */
  const liz=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.pakete=bb.LIZENZEN.map(l=>`${l.id}:L${l.lvl}:${l.items.length}`);
    o.produkteGesamt=Object.keys(bb.P).length;
    o.inPaketen=bb.LIZENZEN.reduce((a,l)=>a+l.items.length,0);
    o.ohnePaket=Object.keys(bb.P).filter(t=>!bb.lizenzOf(t));
    o.startOffen=Object.keys(bb.P).filter(t=>bb.S.level=1||true).filter(t=>bb.lizenzOf(t)&&bb.hatLizenz(bb.lizenzOf(t))).length;
    /* Level hoch, aber ohne Lizenz bleibt gesperrt */
    bb.S.level=30; bb.S.money=300000;
    o.ohneKaufOffen=Object.keys(bb.P).filter(t=>{const l=bb.lizenzOf(t);return l&&bb.hatLizenz(l);}).length;
    bb.buyLizenz('zubehoer');
    o.nachKauf=bb.hatLizenz('zubehoer');
    o.preisGesetzt=bb.S.prices.konfetti>0;
    const g0=bb.S.money; bb.buyLizenz('zubehoer');
    o.keinDoppelkauf=bb.S.money===g0;
    bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    o.alleGekauft=bb.S.lic.length===bb.LIZENZEN.length;
    o.alleOffen=Object.keys(bb.P).filter(t=>{const l=bb.lizenzOf(t);return l&&bb.hatLizenz(l);}).length;
    return o;
  });
  console.log('LIZENZ',JSON.stringify(liz));

  /* --- Marktbewegung ueber 120 Tage --- */
  const mk=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const spur={}, idx={}; Object.keys(bb.P).forEach(t=>{ spur[t]=[bb.marketOf(t)]; idx[t]=[bb.miOf(t)]; });
    let schocks=0, phasen={};
    for(let d=0;d<120;d++){
      const n=bb.rollMarkt(); schocks+=n.length;
      Object.keys(bb.P).forEach(t=>{ spur[t].push(bb.marketOf(t)); idx[t].push(bb.miOf(t)); });
      Object.keys(bb.P).forEach(t=>{ const k=bb.S.reg[t].k; phasen[k]=(phasen[k]||0)+1; });
    }
    o.inflation=+((bb.inflOf()-1)*100).toFixed(1);
    o.schocks=schocks;
    o.phasen=phasen;
    /* Bandbreite des Index, also ohne die Inflation */
    const band=t=>{ const a=idx[t]; const lo=Math.min(...a),hi=Math.max(...a); return +((hi/lo-1)*100).toFixed(0); };
    o.bandbreite={
      feuerzeug:band('feuerzeug'), knicklichter:band('knicklichter'), wunder:band('wunder'),
      sekt:band('sekt'), boeller:band('boeller'), batterie100:band('batterie100'),
      xxlpolen:band('xxlpolen'), profi:band('profi'), furzrakete:band('furzrakete')
    };
    o.schnitt=+bb.marktSchnitt().toFixed(3);
    o.histLen=bb.S.mh.sekt.length;
    /* Erwartung laeuft dem Einkauf hinterher */
    bb.S.mi.sekt=1.5; bb.S.me.sekt=1.0;
    o.luecke=bb.marktLuecke('sekt');
    o.erwartungTraege=bb.marketOf('sekt')<bb.marktZiel('sekt');
    for(let d=0;d<10;d++) bb.rollMarkt();
    o.holtAuf=Math.abs(bb.meOf('sekt')-bb.miOf('sekt'))<0.12;
    o.alleEndlich=Object.keys(bb.P).every(t=>isFinite(bb.marketOf(t))&&bb.marketOf(t)>0&&isFinite(bb.costOf(t)));
    o.margeOk=Object.keys(bb.P).every(t=>bb.marketOf(t)>bb.costOf(t));
    return o;
  });
  console.log('MARKT',JSON.stringify(mk));

  /* --- Zwei Laeufe unterscheiden sich --- */
  const var2=await p.evaluate(()=>{
    const bb=window.__bb;
    const lauf=()=>{ bb.S.mi={}; bb.S.reg={}; bb.S.mh={}; bb.S.schock={}; bb.S.infl=1; bb.marktInit();
      for(let d=0;d<40;d++) bb.rollMarkt();
      return Object.keys(bb.P).map(t=>bb.S.mi[t].toFixed(2)).join(','); };
    const a=lauf(), b2=lauf();
    return {unterschiedlich:a!==b2, beispielA:a.slice(0,44), beispielB:b2.slice(0,44)};
  });
  console.log('STREUUNG',JSON.stringify(var2));

  /* --- Preis-Hilfen --- */
  const pr=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.mi.sekt=1.6;
    o.marktSekt=bb.marketOf('sekt');
    o.niveau=bb.marktNiveau('sekt');
    o.label=bb.marktLabel('sekt')[1];
    bb.setPreisAufMarkt('sekt',1);
    o.preisNachAnpassung=bb.S.prices.sekt;
    o.gleichMarkt=Math.abs(bb.S.prices.sekt-bb.marketOf('sekt'))<0.02;
    o.kauftNochGern=bb.buyChance('sekt',bb.marketOf('sekt'),1,false,null)>0.5;
    o.zuTeuerErkannt=bb.buyChance('sekt',bb.marketOf('sekt')*1.9,1,false,null)===0;
    return o;
  });
  console.log('PREIS',JSON.stringify(pr));

  /* --- Neue Produkte zuenden --- */
  const fw=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const vor=bb.timersLen();
    ['furzrakete','heuler','stinkbombe'].forEach(t=>bb.igniteType(t));
    o.timers=bb.timersLen()-vor;
    bb.run(2.5,0.05);
    o.raketenUnterwegs=bb.rockets.length;
    bb.run(12,0.05);
    o.raketenDanach=bb.rockets.length;
    o.partikel=bb.psBig.max;
    o.effFurz=typeof bb.EFF.furz==='function';
    /* Partikel der Furzwolke pruefen */
    const zaehl=()=>{ let n=0; const l=bb.psBig.life; for(let i=0;i<l.length;i++) if(l[i]>0) n++; return n; };
    const vorP=zaehl();
    bb.EFF.furz({x:0,y:8,z:-10},bb.FW?bb.FW.braun:[1,1,1],null,1);
    o.wolkePartikel=zaehl()-vorP;
    const b2=bb.psBig.base; let braun=0;
    for(let i=0;i<bb.psBig.life.length;i++) if(bb.psBig.life[i]>0&&b2[i*3]>0.25&&b2[i*3]<0.7&&b2[i*3+2]<0.25) braun++;
    o.brauneTeilchen=braun;
    o.hype=Math.round(bb.hype||0);
    return o;
  });
  console.log('FEUERWERK',JSON.stringify(fw));

  /* --- Laptop-Masken --- */
  await p.evaluate(()=>window.__bb.openLaptop());
  const ui=await p.evaluate(async()=>{
    const bb=window.__bb,o={};
    const klick=t=>{ document.querySelector(`#ltabs button[data-tab="${t}"]`).click(); };
    o.tabs=[...document.querySelectorAll('#ltabs button')].map(b=>b.dataset.tab);
    klick('liz');
    o.lizZeilen=document.querySelectorAll('#lbody .row').length;
    o.lizBilder=document.querySelectorAll('#lbody img.pic').length;
    o.lizText=document.querySelector('#lbody .row b').textContent;
    klick('price');
    o.preisZeilen=document.querySelectorAll('#lbody .row').length;
    o.sparklines=document.querySelectorAll('#lbody img.spark').length;
    o.hatMarktKnopf=!!document.querySelector('#lbody button[data-a="pall"]');
    const b2=document.querySelector('#lbody button[data-a="pall"]'); b2.click();
    o.nachAlleAufMarkt=Math.abs(bb.S.prices.wunder-bb.marketOf('wunder'))<0.02;
    o.text=document.querySelector('#lbody').textContent.indexOf('Markt')>=0;
    return o;
  });
  console.log('UI',JSON.stringify(ui));
  await p.screenshot({path:process.argv[3]||'/tmp/claude-0/markt.png'});
  await p.evaluate(()=>{ document.querySelector('#ltabs button[data-tab="liz"]').click(); });
  await p.screenshot({path:(process.argv[3]||'/tmp/claude-0/markt.png').replace('.png','-liz.png')});

  /* --- Speichern und laden --- */
  await p.evaluate(()=>{ window.__bb.S.mi.sekt=1.55; window.__bb.closeLaptop(false); window.__bb.save(); });
  await p.reload();
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const sv=await p.evaluate(()=>{
    const bb=window.__bb;
    return {lizenzen:bb.S.lic.length, miSekt:bb.S.mi.sekt, infl:bb.S.infl>1,
            histDa:(bb.S.mh.sekt||[]).length>1, phaseDa:!!bb.S.reg.sekt,
            offen:Object.keys(bb.P).filter(t=>{const l=bb.lizenzOf(t);return l&&bb.hatLizenz(l);}).length};
  });
  console.log('SPEICHERN',JSON.stringify(sv));

  /* Dispo: der Laden darf sich nicht komplett festfahren */
  const dispo=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.level=12; bb.S.money=-40;
    o.limit=bb.dispoLimit();
    o.verfuegbar=bb.verfuegbar();
    o.zins=bb.dispoZins();
    bb.cartClear(); bb.cartAdd('wunder',1,'mertens');
    const vor=bb.pending.length; bb.cartOrder();
    o.bestellungTrotzMinus=bb.pending.length>vor;
    o.kontoDanach=Math.round(bb.S.money);
    /* Ausbau bleibt gesperrt, solange kein echtes Geld da ist */
    bb.S.money=-40; const lv=bb.S.lic.length; bb.buyLizenz('krach');
    o.lizenzGesperrt=bb.S.lic.length===lv;
    return o;
  });
  console.log('DISPO',JSON.stringify(dispo));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

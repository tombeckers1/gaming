/* Fontaenen-Klang (Tom, 29.09.: "passende Geraeusche", z. B. Zauberbrunnen):
   - jede Phase hat einen Klang, der zur Funkenart passt (Glitter britzelt,
     Titan zischt, Brokat/Kohle rauscht, Knister knistert);
   - der Klang ist ein durchgehendes Bett je Duese, kein Anstossen im
     Sekundentakt (das pulsierte hoerbar). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, K=window.__fontklang, o={};
    if(!K) return {fehler:'kein __fontklang'};
    /* 1. Zuordnung fuer alle Phasen aller Fontaenen */
    const passt={kohle:'rauschen',brokat:'rauschen',titan:'zischen',eisen:'zischen',glitter:'glitzer',knister:'knistern'};
    const falsch=[]; let phasen=0;
    for(const [id,d] of Object.entries(K.FONT)){ if(!d||!d.phasen) continue;
      d.phasen.forEach((ph,i)=>{ phasen++; const a=K.fkTonArt(ph); if(!ph.ton) return;
        const fu=Array.isArray(ph.funke)?ph.funke[0]:ph.funke;
        if(passt[fu]&&!['still','blubb','grollen','brummen','fauchen','knistern_laut'].includes(ph.ton)&&a!==passt[fu]) falsch.push(id+'#'+i+':'+fu+'->'+a); }); }
    o.zuordnung={phasen,falsch};
    /* 06.10.: der Zauberbrunnen ist aus dem Sortiment (Toms PDF) - seine
       Phasen fallen mit ihm weg; abgebrannt
       wird jetzt der Goldgeysir (Kohle rauscht, dann zwei Knisterphasen) */
    o.geysir=K.FONT.goldgeysir.phasen.map(ph=>K.fkTonArt(ph));
    /* 2. Goldgeysir abbrennen: wie viele Klangbetten entstehen? */
    try{ bb.ac(); }catch(e){}
    S.level=40; S.money=1e7; ['shop_halb','testfeld'].forEach(id=>bb.testKauf(id)); bb.run(0.2,0.05);
    const v0=K.FK_KLANG_LOG.betten, a0=K.FK_KLANG_LOG.arten.length;
    S.carrying={type:'goldgeysir',count:1,q:1}; bb.placeOnStation(bb.stations.tisch); S.carrying=null;
    bb.zuendeAlle(); for(let t=0;t<22;t+=0.1) bb.run(0.1,0.05);
    o.lauf={audio:!!(window.AudioContext||window.webkitAudioContext),betten:K.FK_KLANG_LOG.betten-v0,arten:K.FK_KLANG_LOG.arten.slice(a0)};
    return o; });
  console.log('KLANG',JSON.stringify(r));
  if(r.fehler){ console.log('ERRORS: '+r.fehler); await b.close(); return; }
  pruef('ZUORDNUNG',r.zuordnung.phasen>20&&!r.zuordnung.falsch.length,'Klang passt nicht zur Funkenart: '+r.zuordnung.falsch.slice(0,8).join(', '));
  pruef('GOLDGEYSIR',r.geysir[1]==='rauschen'&&r.geysir[2]==='knistern'&&r.geysir[3]==='knistern','Goldgeysir-Klaenge: '+r.geysir.join(', '));
  /* durchgehend: je klingender Phase ein Bett (3 Saetze), nicht alle Sekunde ein neues */
  pruef('DURCHGEHEND',r.lauf.betten>=3&&r.lauf.betten<=6,'Klangbetten beim Goldgeysir: '+r.lauf.betten+' '+JSON.stringify(r.lauf.arten));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

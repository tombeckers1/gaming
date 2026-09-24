/* Rueckmeldung im Laden (Toms Wunsch vom 24.09.): Betrag steigt ueber
   der Kasse auf, Symbole ueber den Kunden, Geld zaehlt hoch, Serie
   zufriedener Kunden mit Bonus. Alles raeumt sich selbst weg. */
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
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(async()=>{
    const bb=window.__bb,S=bb.S,o={};
    /* echter Verkauf: Regal, Ware, Kunde bezahlt an der Kasse */
    S.level=10; S.money=5000;
    bb.regalStellen('standard'); bb.regalStellen('standard'); const sorten=['wunder','knallerbsen','tisch','knallfrosch']; bb.allLevels().forEach((l,i)=>{ for(let k=0;k<8;k++) bb.addToLevel(l,sorten[i%4],1); });
    bb.openShop();
    let geschwebt=0, bezahlt=0, symbole=0;
    const vorGeld=S.money;
    for(let i=0;i<4800;i++){ bb.step(0.05);
      if(bb.belt.length) bb.scanBelt(bb.belt[0]);
      const reg=bb.regCustomer(); if(reg&&reg.state==='pay'){ if(reg.method==='card') reg.finishCard(); else reg.finishCash(Math.round((reg.given-reg.total)*100)/100); bezahlt++; }
      geschwebt=Math.max(geschwebt,bb.schweber.filter(w=>w.s.scale.x>1).length);
      symbole=Math.max(symbole,bb.schweber.filter(w=>w.s.scale.x<0.5).length); }
    o.bezahlt=bezahlt; o.geschwebt=geschwebt; o.symbole=symbole;
    bb.run(3,0.05); o.nachher=bb.schweber.length;
    /* Geldanzeige zaehlt hoch */
    const el=document.getElementById('hMoney');
    bb.S.money=Math.round(bb.S.money)+500; const werte=[];
    for(let i=0;i<6;i++){ bb.updateHUD?bb.updateHUD():0; werte.push(el.textContent); }
    o.zaehlt=werte; o.gruen=el.classList.contains('plus');
    /* Serie */
    const x0=S.xp; for(let i=0;i<10;i++) bb.serieZufrieden();
    o.serie=bb.serie; o.bonus=S.xp-x0; bb.serieBricht(); o.nachBruch=bb.serie;
    return o;
  });
  console.log('LADEN   ',JSON.stringify({bezahlt:r.bezahlt,betraege:r.geschwebt,symbole:r.symbole,uebrig:r.nachher}));
  console.log('GELD    ',JSON.stringify({werte:r.zaehlt,gruen:r.gruen}));
  console.log('SERIE   ',JSON.stringify({serie:r.serie,bonus:r.bonus,nachBruch:r.nachBruch}));
  pruef('LADEN',r.bezahlt>0&&r.geschwebt>0,'kein schwebender Betrag beim Bezahlen');
  pruef('LADEN',r.symbole>0,'keine Symbole ueber den Kunden');
  pruef('LADEN',r.nachher===0,r.nachher+' Schweber bleiben liegen');
  pruef('GELD',new Set(r.zaehlt).size>=3&&r.gruen,'Geld springt statt zu zaehlen: '+r.zaehlt);
  pruef('SERIE',r.serie===10&&r.bonus>0&&r.nachBruch===0,'Serie: '+JSON.stringify(r));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

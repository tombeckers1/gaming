/* Startmaske: Neues Spiel -> Namensmaske -> aufschliessen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message+' | '+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined');
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined');
  await neuesSpiel(p); await p.waitForTimeout(200);
  const o=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    o.startLevel=S.level; o.startDay=S.day; o.startBoxes=bb.floorBoxes.length; o.startShelves=bb.shelves.length; o.startRacks=bb.racks.length;
    o.unlockedAtStart=Object.keys(S.prices).filter(t=>S.level>=window.__bb.S.level&&true).length;
    // Bestellung
    S.money=20000; ['shelf_klein','shelf_standard','shelf_standard'].forEach(id=>bb.buyUp(id)); S.money=1000; bb.openLaptop();
    document.querySelector('#lbody button[data-a="cart"][data-t="wunder"]').click();
    o.imKorb=bb.cartBoxes(); o.versand=bb.cartFee();
    document.getElementById('lKorb').click();
    document.querySelector('#korbFoot button[data-a="cartgo"]').click();
    o.pending=bb.pending.length; o.korbLeer=bb.cartBoxes()===0; bb.closeLaptop(false);
    bb.run(45,0.05); o.lkwDa=!!bb.truck; o.delivered=bb.floorBoxes.length;
    // Kredit
    S.level=5; bb.openLaptop(); document.querySelector('#ltabs button[data-tab="bank"]').click();
    const lb=document.querySelector('#lbody button[data-a="loan"]'); o.loanBtn=!!lb; if(lb) lb.click();
    o.loan=S.loan?S.loan.remaining:null; o.moneyAfterLoan=Math.round(S.money);
    o.dailyRate=bb.S.loan?Math.round(S.loan.amount/S.loan.term+S.loan.remaining*S.loan.rate):0;
    bb.closeLaptop(false);
    // Dieb + Spray
    S.level=10; bb.openShop();
    bb.run(120,0.05);
    const lvs=bb.allLevels(); for(let i=0;i<3;i++){ for(let k=0;k<20;k++) bb.addToLevel(lvs[i],['wunder','knallerbsen','tisch'][i]); }
    bb.run(200,0.05);
    o.thieves=bb.customers.filter(c=>c.state==='steal').length;
    o.rev=Math.round(bb.DS.revenue); o.dirt=bb.dirts.length;
    return o;
  });
  console.log('A:',JSON.stringify(o));
  const o2=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    // Dieb erzwingen und mit Spray stoppen
    const c=bb.customers[0]||null;
    if(c){ c.items=[{type:'wunder',price:1.49},{type:'wunder',price:1.49}]; c.thief=true; c.startSteal();
      bb.pl.x=c.pos.x; bb.pl.z=c.pos.z+1.5;
      o.caughtBefore=bb.DS.caught;
      window.__bbSpray=true;
    }
    return o;
  });
  // Spray ausloesen ueber Tastatur-Pfad
  const o3=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const c=bb.customers.find(x=>x.state==='steal');
    if(!c){ o.noThief=true; return o; }
    // Blickrichtung auf den Dieb
    const dx=c.pos.x-bb.pl.x, dz=c.pos.z-bb.pl.z;
    bb.setView(bb.pl.x,bb.pl.z,Math.atan2(-dx,-dz),0);
    bb.S.level=10;
    const before=bb.DS.caught;
    // toggleSpray + Aktion
    document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyG'}));
    document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE'}));
    o.caught=bb.DS.caught-before; o.state=c.state; o.items=c.items.length;
    return o;
  });
  console.log('SPRAY:',JSON.stringify(o3));
  const o4=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    // Umbau: greifen + absetzen
    bb.toggleBuild(true);
    const m=bb.movables.find(x=>x.kind==='shelf');
    const old={x:m.g.position.x,z:m.g.position.z};
    bb.pl.x=0; bb.pl.z=0; bb.setView(0,0,0,0);
    // Zielobjekt manuell setzen
    const g=(function(){ return m; })();
    // grab ueber interne API simulieren
    window.dispatchEvent(new Event('blur'));
    bb.toggleBuild(false);
    o.old=old;
    // Tagesabschluss mit Kredit + Loehnen
    bb.S.staff.reinigung=true; bb.hireStaff('reinigung');
    bb.clock=1330; bb.run(200,0.05);
    o.phase=bb.phase;
    const before=Math.round(bb.S.money);
    bb.endDay();
    o.moneyDelta=Math.round(bb.S.money)-before;
    o.loanLeft=bb.S.loan?Math.round(bb.S.loan.remaining):0;
    o.rows=document.querySelectorAll('#sRows .sumrow').length;
    document.getElementById('sBtn').click();
    o.levelupShown=document.getElementById('levelup').classList.contains('show');
    if(o.levelupShown) document.getElementById('luBtn').click();
    o.day=bb.S.day; o.level=bb.S.level;
    return o;
  });
  console.log('TAG-ENDE:',JSON.stringify(o4));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

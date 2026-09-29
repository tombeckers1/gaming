/* Alte Spielstaende mit gestrichenen Sorten (Tom, 29.09.: 40 Produkte
   komplett entfernt): Bestand dieser Sorten wird beim Laden zur
   aehnlichsten verbliebenen Sorte - kein Absturz, keine Ware ohne
   Katalogeintrag. Der Test legt Wunderkerzen in Regal, Kartons und
   Warenkorb, speichert, benennt sie im Spielstand in gestrichene
   Sorten um und laedt neu. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const vor=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S;
    bb.regalStellen('standard'); bb.regalStellen('standard'); const lv=bb.allLevels()[0]; for(let k=0;k<6;k++) bb.addToLevel(lv,'wunder',1);
    S.cart=[{t:'wunder',n:3}]; bb.save();
    const KEY=Object.keys(localStorage).find(k=>/boellerbude/.test(k)); const roh=localStorage.getItem(KEY);
    /* Wunderkerzen -> Tischfeuerwerk (gestrichen), Knallerbsen -> Pharaoschlangen (gestrichen) */
    const neu=roh.replace(/"wunder"/g,'"tisch"').replace(/"knallerbsen"/g,'"pharao"');
    localStorage.setItem(KEY,neu);
    /* das Spiel speichert beim Verlassen der Seite - das wuerde den
       praeparierten Stand ueberschreiben */
    const alt=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k===KEY) return; return alt.call(this,k,v); };
    return {KEY,tisch:(neu.match(/"tisch"/g)||[]).length,pharao:(neu.match(/"pharao"/g)||[]).length}; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:first-child'); await p.waitForTimeout(1500);
  const nach=await p.evaluate((KEY)=>{ const bb=window.__bb, S=bb.S, P=bb.P, fremd=new Set();
    const typen=[]; bb.allLevels().forEach(l=>{ if(l.type) typen.push(l.type); (l.items||[]).forEach(i=>{ const t=i&&(i.type||i.t); if(typeof t==='string') typen.push(t); }); });
    bb.floorBoxes.forEach(x=>typen.push(x.type)); (S.cart||[]).forEach(l=>typen.push(l.t));
    const nurS=typen.filter(t=>typeof t==='string'); typen.length=0; typen.push(...nurS); typen.forEach(t=>{ if(!P[t]) fremd.add(t); });
    bb.run(2,0.1); bb.save(); const roh=localStorage.getItem(KEY);
    return {typen:[...new Set(typen)].slice(0,20),fremd:[...fremd],gestrichen:['tisch','pharao'].filter(t=>roh.indexOf('"'+t+'"')>=0),level0:(bb.allLevels()[0]||{}).type}; },vor.KEY);
  console.log('ALTSTAND',JSON.stringify({vor,nach}));
  pruef('EINGEBAUT',vor.tisch>0,'Spielstand enthielt keine gestrichene Sorte - Test wirkungslos');
  pruef('KATALOG',!nach.fremd.length,'Ware ohne Katalogeintrag: '+nach.fremd.join(','));
  pruef('UMGESTELLT',!nach.gestrichen.length,'noch im Spielstand: '+nach.gestrichen.join(','));
  pruef('REGAL',!!nach.level0,'erstes Fach nach dem Laden leer');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

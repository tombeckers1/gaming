/* Regalschild beschriften (Tom, 03.10.: "die einzelnen Regale umbenennen
   ... XXL Fontaene oder irgendwas anderes"):
   - TEXT: L oeffnet das Feld, Beschriften setzt den Text aufs Kopfschild
     (das Bild aendert sich), auch ein leeres Regal zeigt dann sein Schild
   - LAENGE: hoechstens 24 Zeichen
   - SPEICHER: das Schild uebersteht Speichern und Laden
   - AUTO: "Automatisch" nimmt den eigenen Text wieder weg
   - TASTEN: solange das Feld offen ist, gilt das Spiel als Overlay
   Aufruf: node schild.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
async function start(p,neu){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  if(neu){ await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo'); }
  else await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:60000});
}
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:700,height:450}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await start(p,true);
  const r=await p.evaluate(()=>{ const bb=window.__bb, m=[];
    bb.regalStellen('standard'); const sh=bb.shelves[0];
    const px=()=>{ const c=bb.texCanvas(sh.headTex); return c.getContext('2d').getImageData(0,0,c.width,c.height).data.join(','); };
    const vor=px();
    bb.schildTaste(sh);
    if(!bb.schildOpen||!bb.overlayOpen()) m.push('TASTEN: Feld nicht offen bzw. kein Overlay');
    document.getElementById('schildIn').value='XXL Fontänen und noch viel mehr Text';
    bb.schildFertig('ok');
    if(bb.schildOpen) m.push('TEXT: Feld bleibt offen');
    if(sh.schild!=='XXL Fontänen und noch vi') m.push('LAENGE/TEXT: '+JSON.stringify(sh.schild));
    if(px()===vor) m.push('TEXT: Kopfschild unveraendert');
    if(sh.kopfG&&!sh.kopfG.visible) m.push('TEXT: Schild am leeren Regal unsichtbar');
    bb.save(); const d=JSON.parse(localStorage.getItem('boellerbude_v3'));
    if(!d.shelves[0]||d.shelves[0].schild!==sh.schild) m.push('SPEICHER: nicht gespeichert '+JSON.stringify(d.shelves[0]&&d.shelves[0].schild));
    return m; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await start(p,false);
  const r2=await p.evaluate(()=>{ const bb=window.__bb, m=[], sh=bb.shelves[0];
    if(!sh||sh.schild!=='XXL Fontänen und noch vi') m.push('SPEICHER: geladen '+JSON.stringify(sh&&sh.schild));
    bb.schildTaste(sh); bb.schildFertig('auto');
    if(sh.schild) m.push('AUTO: eigener Text bleibt');
    return m; });
  console.log('ERRORS:',r.concat(r2,errs).join(' | ')||'keine'); await b.close();
})();

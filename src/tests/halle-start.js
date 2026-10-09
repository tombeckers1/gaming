/* Startbildschirm: Auswahl "Verkaufsflaeche + Lager" / "Grosse Halle"; Neues Spiel bleibt letzter Knopf; Klick laedt die Halle, Zurueck fuehrt ins Spiel. Aufruf: node halle-start.js real.html [bildordner] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const out=process.argv[3]||'.';
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1100,height:640}}); p.setDefaultTimeout(300000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const mangel=[];
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:300000});
  const r1=await p.evaluate(()=>({modus:!!document.getElementById('startModus'),letzter:document.querySelector('#startBtns button:last-child').textContent,bb:!!window.__bb,halle:!!window.__halle}));
  console.log('START',JSON.stringify(r1)); if(!r1.modus) mangel.push('keine Auswahl'); if(r1.letzter!=='Neues Spiel') mangel.push('letzter Knopf '+r1.letzter); if(!r1.bb||r1.halle) mangel.push('Spiel nicht normal geladen');
  await p.screenshot({path:out+'/start.png'});
  const t0=Date.now();
  await Promise.all([p.waitForNavigation(),p.click('#smHalle')]);
  await p.waitForFunction('window.__halle&&window.__halle.fertig',null,{timeout:300000});
  console.log('HALLE geladen nach s',((Date.now()-t0)/1000).toFixed(1),'bb?',await p.evaluate(()=>!!window.__bb));
  await p.waitForTimeout(1500); await p.screenshot({path:out+'/halle-live.png'});
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const menu=await p.evaluate(()=>document.getElementById('hmMenu').classList.contains('show')); if(!menu) mangel.push('Menue nicht offen');
  await p.screenshot({path:out+'/menu.png'});
  await Promise.all([p.waitForNavigation(),p.click('#hmMenu [data-a="zurueck"]')]);
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:300000});
  const r2=await p.evaluate(()=>({bb:!!window.__bb,halle:!!window.__halle}));
  console.log('ZURUECK',JSON.stringify(r2)); if(!r2.bb||r2.halle) mangel.push('zurueck nicht im Spiel');
  console.log(mangel.length?'MANGEL: '+mangel.join('; '):'ALLES OK');
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

/* Produktsuche im Laptop (Tom, 03.10.: "gibt man STU ein, ploppt schon
   Sturmfeuerzeug auf, man kann draufklicken"):
   - VORSCHLAG: nach "stu" steht Sturmfeuerzeuge oben in den Vorschlaegen
   - FILTER: die Liste zeigt nur noch passende Produkte
   - WAHL: Enter nimmt den ersten Vorschlag, nur dieses Produkt bleibt
   - BLEIBT: nach "+ in den Warenkorb" (Neuzeichnen) gilt die Suche weiter
   - UMLAUT: "gluh" findet Glühwein im Reiter Preise & Markt
   - ESC: Esc leert die Suche, der Laptop bleibt offen
   - SPARTE: ohne Suche filtert der Spartenknopf wie vorher
   Aufruf: node suche.js test.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1100,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:60000});
  const m=[];
  /* alles freischalten, damit es genug Produkte gibt */
  await p.evaluate(()=>{ const bb=__bb; bb.S.level=30; bb.S.money=1e6; bb.S.lic=['start'].concat(bb.LIZENZEN.map(l=>l.id)); bb.openLaptop(); bb.ltab='order'; bb.lsup='ware'; bb.lkat='alle'; bb.renderLaptop(); });
  const sicht=()=>p.evaluate(()=>[...document.querySelectorAll('#lbody [data-ware]')].filter(e=>e.style.display!=='none').map(e=>e.dataset.ware));
  const alle=(await sicht()).length;
  await p.click('#lSuche'); await p.keyboard.type('stu');
  const vor=await p.evaluate(()=>[...document.querySelectorAll('#lVorschlag button')].map(x=>x.dataset.t));
  if(vor[0]!=='feuerzeug') m.push('VORSCHLAG: '+JSON.stringify(vor.slice(0,4)));
  const v1=await sicht(); if(!(v1.includes('feuerzeug')&&v1.length<alle&&v1.length>0)) m.push(`FILTER: ${v1.length} von ${alle}`);
  await p.keyboard.press('Enter');
  const v2=await sicht(); const wert=await p.inputValue('#lSuche');
  if(!(v2.length===1&&v2[0]==='feuerzeug')) m.push('WAHL: '+JSON.stringify(v2)); if(!/Sturm/.test(wert)) m.push('WAHL: Feld '+wert);
  await p.click('#lbody [data-ware="feuerzeug"] button[data-a="cart"]');
  const v3=await sicht(); if(!(v3.length===1&&v3[0]==='feuerzeug')) m.push('BLEIBT: '+JSON.stringify(v3.slice(0,5)));
  /* Preise & Markt */
  await p.evaluate(()=>{ const bb=__bb; bb.ltab='price'; bb.renderLaptop(); });
  await p.fill('#lSuche',''); await p.click('#lSuche'); await p.keyboard.type('gluh');
  const v4=await sicht(), vor4=await p.evaluate(()=>[...document.querySelectorAll('#lVorschlag button')].map(x=>x.dataset.t));
  if(!(v4.includes('gluehwein')&&vor4[0]==='gluehwein')) m.push('UMLAUT: '+JSON.stringify(v4)+' '+JSON.stringify(vor4));
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  const nach=await p.evaluate(()=>({q:document.getElementById('lSuche').value,offen:__bb.laptopOpen!==undefined?__bb.laptopOpen:!!document.querySelector('#laptop.show')}));
  const v5=await sicht(); if(nach.q!==''||v5.length<10) m.push('ESC: Feld "'+nach.q+'", sichtbar '+v5.length);
  const lo=await p.evaluate(()=>document.getElementById('laptop')?document.getElementById('laptop').classList.contains('show'):null);
  if(lo===false) m.push('ESC: Laptop zu');
  /* Sparte ohne Suche */
  await p.evaluate(()=>{ const bb=__bb; bb.ltab='order'; bb.lkat='getraenke'; bb.renderLaptop(); });
  const v6=await sicht(); const fremd=await p.evaluate(v=>v.filter(t=>__bb.sparteVon(t)!=='getraenke'),v6);
  if(!v6.length||fremd.length) m.push('SPARTE: '+v6.length+' sichtbar, fremd '+fremd.join(','));
  console.log('Produkte',alle,'| Vorschlaege fuer stu:',vor.slice(0,3).join(', '));
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

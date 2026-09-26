/* Handy (Tom, 24.09.: "der Laptop ist mit ganz vielen Kategorien
   ueberlaufen - der Spieler soll ein Handy haben, per Taste"):
   - Laptop nur noch mit den Schreibtisch-Sachen (7 Reiter)
   - Tab holt das Handy heraus, nicht mehr den Laptop
   - sechs Apps; Team einstellen geht vom Handy aus
   - Zurueck fuehrt zum Startbildschirm, Tab steckt es weg
   - klingelt es, nimmt H den Anruf an statt das Handy zu oeffnen
   - offene Pakete stehen als Zahl an der Onlineshop-App
   Aufruf: node handy.js test.html [bild-praefix] */
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
  const p=await b.newPage({viewport:{width:1200,height:820}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const pre=process.argv[3];
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const sichtbar=id=>p.evaluate(id=>document.getElementById(id).classList.contains('show'),id);

  /* Laptop: nur noch Schreibtisch-Reiter */
  const tabs=await p.evaluate(()=>[...document.querySelectorAll('#ltabs button')].map(b=>b.dataset.tab));
  console.log('LAPTOP  ',JSON.stringify(tabs));
  /* seit 25.09. steht die Einrichtung unter Bestellen: 7 Reiter */
  pruef('LAPTOP',tabs.length===7&&tabs.indexOf('einr')<0&&!tabs.some(t=>['online','staff','markt','bank','stats','erf'].indexOf(t)>=0),'Reiter: '+tabs);

  /* Tab: Handy statt Laptop */
  await p.evaluate(()=>{ window.__bb.S.level=12; window.__bb.S.money=5000; });
  await p.keyboard.press('Tab'); await p.waitForTimeout(100);
  const auf={handy:await sichtbar('handy'),laptop:await sichtbar('laptop'),
    apps:await p.evaluate(()=>[...document.querySelectorAll('#hInhalt .app')].map(a=>a.dataset.app))};
  if(pre) await p.screenshot({path:pre+'_home.png'});
  console.log('TAB     ',JSON.stringify(auf));
  pruef('TAB',auf.handy&&!auf.laptop&&auf.apps.length===6,'Tab: '+JSON.stringify(auf));

  /* App Team: Reinigungskraft einstellen, zurueck, wegstecken */
  await p.click('#hInhalt .app[data-app="staff"]'); await p.waitForTimeout(80);
  const team=await p.evaluate(()=>({kopf:document.querySelector('#hInhalt .hkopf b').textContent,knoepfe:document.querySelectorAll('#hApp button[data-a="hire"]').length}));
  if(pre) await p.screenshot({path:pre+'_team.png'});
  await p.click('#hApp button[data-a="hire"][data-t="reinigung"]'); await p.waitForTimeout(80);
  const eingestellt=await p.evaluate(()=>!!window.__bb.S.staff.reinigung);
  await p.click('#hInhalt .hkopf button'); await p.waitForTimeout(60);
  const home=await p.evaluate(()=>document.querySelectorAll('#hInhalt .app').length);
  await p.keyboard.press('Tab'); await p.waitForTimeout(80);
  const zu=!(await sichtbar('handy'));
  console.log('TEAM    ',JSON.stringify({team,eingestellt,home,zu}));
  pruef('TEAM',team.kopf==='Team'&&team.knoepfe>0&&eingestellt,'Team-App: '+JSON.stringify(team)+' eingestellt '+eingestellt);
  pruef('TEAM',home===6&&zu,'Zurueck/Wegstecken: home '+home+' zu '+zu);

  /* Bank und Bericht zeigen Inhalt */
  const inhalt=await p.evaluate(()=>{ const bb=window.__bb, o={};
    for(const a of ['bank','stats','markt','erf']){ bb.openHandy(a); o[a]=document.querySelectorAll('#hApp .row').length; }
    bb.closeHandy(false); return o; });
  console.log('APPS    ',JSON.stringify(inhalt));
  pruef('APPS',Object.values(inhalt).every(n=>n>0),'leere App: '+JSON.stringify(inhalt));

  /* Anruf: H nimmt ab */
  /* ein Anruf wie im Spiel: Auftrag erzeugen, Handy klingelt */
  const anruf=await p.evaluate(()=>{ const bb=window.__bb; bb.S.up.grosskunden=true; const c=bb.makeCall(); if(c){ bb.phone.call=c; bb.phone.state='ringing'; bb.phone.t=26; } return !!c; });
  /* ohne Mausfang (headless) oeffnet sich beim Wegstecken die Pause - zu */
  if(await sichtbar('pause')) await p.click('#pBtn');
  const vorH=await p.evaluate(()=>[...document.querySelectorAll('.ov.show')].map(e=>e.id).join(','));
  await p.keyboard.press('KeyH'); await p.waitForTimeout(100);
  const ab={vorH,deal:await sichtbar('deal'),handy:await sichtbar('handy'),klingelte:anruf};
  console.log('ANRUF   ',JSON.stringify(ab));
  pruef('ANRUF',ab.deal&&!ab.handy,'H bei Anruf: '+JSON.stringify(ab));
  await p.evaluate(()=>{ try{ window.__bb.declineDeal(); }catch(e){} });

  /* Onlineshop: Zahl der offenen Pakete an der App */
  const badge=await p.evaluate(()=>{ const bb=window.__bb; bb.S.up.onlineshop=true; bb.S.pakete=3; bb.openHandy();
    const e=document.querySelector('#hInhalt .app[data-app="online"] em'); const t=e?e.textContent:''; return t; });
  if(pre) await p.screenshot({path:pre+'_badge.png'});
  console.log('BADGE   ',JSON.stringify(badge));
  pruef('BADGE',badge==='3','keine Paketzahl an der Onlineshop-App ('+badge+')');

  /* Laptop oeffnen schliesst das Handy */
  const wechsel=await p.evaluate(()=>{ const bb=window.__bb; bb.openLaptop(); return {handy:bb.handyOpen,laptop:document.getElementById('laptop').classList.contains('show')}; });
  pruef('WECHSEL',!wechsel.handy&&wechsel.laptop,'Laptop und Handy zugleich offen: '+JSON.stringify(wechsel));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

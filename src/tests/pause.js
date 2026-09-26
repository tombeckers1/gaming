/* Pausenmenue (Tom, 26.09.): "ESC ... Steuerung auswaehlen, weiterspielen,
   Tutorial einblenden, Tutorial ausblenden und zum Home-Bildschirm
   zurueck ... bei Steuerung alles reinschreiben: Werkzeuge, wie setze
   ich die Sackkarre ein ... Musik: die verschiedenen Titel auswaehlen,
   lauter und leiser. Fuer jedes eine einzelne Maske."
   - HAUPT: Esc zeigt nur die Hauptmaske mit fuenf Punkten
   - STEUERUNG: eigene Maske, alle Tasten und ein Handbuch mit den
     Werkzeugen und Ablaeufen; Esc fuehrt zur Hauptmaske zurueck
   - MUSIK: eigene Maske, jeder Titel waehlbar, Lautstaerke
   - TUTORIAL: ein Knopf, der ein- und ausblendet
   - START: zum Startbildschirm mit Weiterspielen / Neues Spiel;
     Weiterspielen setzt ohne Neuladen fort, Neues Spiel startet frisch
   - WEITER: Weiterspielen schliesst die Pause
   - SPERRE: kommt die Mauszeiger-Sperre an (Spielstart, Weiterspielen),
     darf sich die Pause nicht von selbst oeffnen (26.09.: ein
     zerrissenes else oeffnete sie bei jeder Sperre) */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800}}); p.setDefaultTimeout(180000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const sicht=id=>p.evaluate(id=>{ const e=document.getElementById(id); if(!e) return false; const r=e.getBoundingClientRect(); return r.width>0&&r.height>0; },id);
  const seite=()=>p.evaluate(()=>window.__bb.pauseSeiteAktiv());
  const sperre=()=>p.evaluate(()=>({gesperrt:!!document.pointerLockElement,pause:document.getElementById('pause').classList.contains('show')}));

  /* Sperre beim Spielstart: die Pause bleibt zu */
  await p.mouse.click(640,400); await p.waitForTimeout(800);
  const sp0=await sperre();
  console.log('SPERRE  ',JSON.stringify(sp0));
  pruef('SPERRE',sp0.gesperrt,'Mauszeiger-Sperre kam im Test nicht an - Pruefung nicht moeglich');
  pruef('SPERRE',!sp0.pause,'Pause oeffnet sich, sobald die Maus gefangen wird');

  /* Hauptmaske */
  await p.keyboard.press('Escape');
  const haupt=await p.evaluate(()=>{ const P=document.getElementById('pause'), H=document.getElementById('pHaupt');
    const knoepfe=[...H.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().width>0).map(x=>x.textContent.trim());
    return {auf:P.classList.contains('show'),knoepfe,steuerSichtbar:document.getElementById('steuer').getBoundingClientRect().height>0,musikSichtbar:document.getElementById('pMusikVol').getBoundingClientRect().width>0}; });
  console.log('HAUPT   ',JSON.stringify(haupt));
  pruef('HAUPT',haupt.auf&&haupt.knoepfe.length===5,'Hauptmaske: '+JSON.stringify(haupt.knoepfe));
  pruef('HAUPT',/Weiterspielen/.test(haupt.knoepfe[0]||'')&&haupt.knoepfe.some(t=>t==='Steuerung')&&haupt.knoepfe.some(t=>t==='Musik')&&haupt.knoepfe.some(t=>/^Tutorial (ein|aus)blenden$/.test(t))&&haupt.knoepfe.some(t=>/Startbildschirm/.test(t)),'Punkte fehlen: '+JSON.stringify(haupt.knoepfe));
  pruef('HAUPT',!haupt.steuerSichtbar&&!haupt.musikSichtbar,'Steuerung oder Musik stehen schon auf der Hauptmaske');

  /* Steuerung */
  await p.click('#pHaupt [data-pseite="pSteuer"]');
  const st=await p.evaluate(()=>{ const hb=document.getElementById('handbuch');
    return {seite:window.__bb.pauseSeiteAktiv(),tasten:document.querySelectorAll('#steuer kbd').length,
      abschnitte:[...hb.querySelectorAll('h4')].map(h=>h.textContent),text:(document.getElementById('steuer').textContent+' '+hb.textContent).replace(/\s+/g,' '),
      sichtbar:document.getElementById('steuer').getBoundingClientRect().height>0,hauptWeg:document.getElementById('pHaupt').getBoundingClientRect().height===0}; });
  console.log('STEUER  ',JSON.stringify({seite:st.seite,tasten:st.tasten,abschnitte:st.abschnitte,zeichen:st.text.length}));
  const muss=['Sackkarre','Plattformwagen','Preisgerät','Pfefferspray','Umbau','Zündpult','Kasse','Regal','Handy','Laptop','Putz','Musik','Versand','Karton'];
  const fehlt=muss.filter(w=>st.text.indexOf(w)<0);
  pruef('STEUERUNG',st.seite==='pSteuer'&&st.sichtbar&&st.hauptWeg,'eigene Maske fehlt: '+JSON.stringify({seite:st.seite,sichtbar:st.sichtbar,hauptWeg:st.hauptWeg}));
  pruef('STEUERUNG',st.tasten>=20&&st.abschnitte.length>=10&&!fehlt.length,'unvollstaendig: '+st.tasten+' Tasten, '+st.abschnitte.length+' Abschnitte, fehlt '+fehlt.join(','));
  pruef('STEUERUNG',/Sackkarre[^.]*K\b|K[^.]{0,40}Sackkarre/.test(st.text),'Sackkarre ohne Taste K');
  await p.keyboard.press('Escape');
  const nachEsc={seite:await seite(),auf:await p.evaluate(()=>document.getElementById('pause').classList.contains('show'))};
  pruef('STEUERUNG',nachEsc.auf&&nachEsc.seite==='pHaupt','Esc auf der Steuerung: '+JSON.stringify(nachEsc));

  /* Musik */
  await p.click('#pHaupt [data-pseite="pMusikSeite"]');
  const mu0=await p.evaluate(()=>({seite:window.__bb.pauseSeiteAktiv(),titel:[...document.querySelectorAll('#pTitel [data-stueck]')].map(x=>x.textContent),n:window.__bb.STUECKE.length}));
  await p.click('#pTitel [data-stueck="3"]');
  const mu1=await p.evaluate(()=>({an:window.__bb.MUSIK.an,stueck:window.__bb.MUSIK.stueck,laeuft:[...document.querySelectorAll('#pTitel .laeuft')].map(x=>x.dataset.stueck)}));
  await p.click('#pTitel [data-stueck="7"]');
  const mu2=await p.evaluate(()=>({stueck:window.__bb.MUSIK.stueck,laeuft:[...document.querySelectorAll('#pTitel .laeuft')].map(x=>x.dataset.stueck)}));
  const vol=await p.evaluate(()=>{ const r=document.getElementById('pMusikVol'); const s=r.getBoundingClientRect().width>0; r.value=30; r.dispatchEvent(new Event('input')); return {sicht:s,vol:window.__bb.MUSIK.vol}; });
  console.log('MUSIK   ',JSON.stringify({mu0,mu1,mu2,vol}));
  pruef('MUSIK',mu0.seite==='pMusikSeite'&&mu0.titel.length===mu0.n&&mu0.n>=10,'Titelliste: '+JSON.stringify(mu0));
  pruef('MUSIK',mu1.an&&mu1.stueck===3&&JSON.stringify(mu1.laeuft)==='["3"]'&&mu2.stueck===7&&JSON.stringify(mu2.laeuft)==='["7"]','Titelwahl: '+JSON.stringify([mu1,mu2]));
  pruef('MUSIK',vol.sicht&&Math.abs(vol.vol-0.3)<0.001,'Lautstaerke: '+JSON.stringify(vol));
  await p.click('#pMusikSeite .pzur');
  pruef('MUSIK',(await seite())==='pHaupt','Zurueck fuehrt nicht zur Hauptmaske');

  /* Tutorial ein/aus */
  const t0=await p.evaluate(()=>({an:window.__bb.tutorialAn(),txt:document.getElementById('pTut').textContent}));
  await p.click('#pTut');
  const t1=await p.evaluate(()=>({an:window.__bb.tutorialAn(),txt:document.getElementById('pTut').textContent}));
  await p.click('#pTut');
  const t2=await p.evaluate(()=>({an:window.__bb.tutorialAn(),txt:document.getElementById('pTut').textContent}));
  console.log('TUTORIAL',JSON.stringify([t0,t1,t2]));
  pruef('TUTORIAL',t0.an!==t1.an&&t2.an===t0.an&&t0.txt!==t1.txt&&/einblenden|ausblenden/.test(t1.txt),'Knopf: '+JSON.stringify([t0,t1,t2]));

  /* Weiterspielen */
  await p.click('#pBtn'); await p.waitForTimeout(800);
  const sp1=await sperre();
  pruef('WEITER',!sp1.pause,'Pause bleibt offen oder oeffnet sich mit der Sperre wieder: '+JSON.stringify(sp1));

  /* Startbildschirm und zurueck, ohne neu zu laden */
  await p.evaluate(()=>{ window.__marke=1; window.__bb.S.money=4321.5; });
  await p.keyboard.press('Escape');
  await p.click('#pHome');
  const st1=await p.evaluate(()=>({start:document.getElementById('start').classList.contains('show'),pause:document.getElementById('pause').classList.contains('show'),
    knoepfe:[...document.querySelectorAll('#startBtns button')].map(x=>x.textContent),gespeichert:JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/boellerbude/.test(k)))||'{}').money}));
  const tag0=await p.evaluate(()=>window.__bb.S.day+'/'+window.__bb.clock);
  await p.waitForTimeout(1500);
  const steht=await p.evaluate(()=>window.__bb.S.day+'/'+window.__bb.clock);
  await p.click('#startBtns button:first-child');
  await p.waitForTimeout(400);
  const st2=await p.evaluate(()=>({start:document.getElementById('start').classList.contains('show'),marke:window.__marke===1,geld:window.__bb.S.money,startOpen:window.__bb.startOpen}));
  console.log('START   ',JSON.stringify({st1,steht:tag0===steht,st2}));
  pruef('START',st1.start&&!st1.pause&&/Weiterspielen/.test(st1.knoepfe[0]||'')&&st1.knoepfe.some(t=>/Neues Spiel/.test(t))&&Math.abs(st1.gespeichert-4321.5)<0.01,'Startbildschirm: '+JSON.stringify(st1));
  pruef('START',tag0===steht,'Spiel laeuft hinter dem Startbildschirm weiter');
  pruef('START',!st2.start&&!st2.startOpen&&st2.marke&&Math.abs(st2.geld-4321.5)<0.01,'Weiterspielen: '+JSON.stringify(st2));

  /* Neues Spiel vom Startbildschirm aus */
  await p.keyboard.press('Escape');
  await p.click('#pHome');
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible'});
  await p.fill('#shopInput','Testladen Neu');
  await Promise.all([p.waitForEvent('load',{timeout:180000}),p.click('#nameGo')]);
  await p.waitForFunction('window.__bb!==undefined&&window.__bb.S&&!document.getElementById("start").classList.contains("show")',{timeout:180000});
  const neu=await p.evaluate(()=>({name:window.__bb.S.shopName,geld:window.__bb.S.money,marke:window.__marke===1,tag:window.__bb.S.day}));
  console.log('NEU     ',JSON.stringify(neu));
  pruef('START',neu.name==='Testladen Neu'&&!neu.marke&&Math.abs(neu.geld-4321.5)>1,'Neues Spiel: '+JSON.stringify(neu));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

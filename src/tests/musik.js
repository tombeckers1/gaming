/* Musik (Toms Wunsch vom 23.09.): selbst erzeugt, laeuft nach dem
   Start, jedes Stueck klingt hoerbar, M schaltet aus und an, N
   springt weiter, der Regler im Pausenmenue aendert die Lautstaerke,
   die Einstellung bleibt nach dem Neuladen. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  /* laeuft von allein; jedes Stueck ist hoerbar */
  await p.waitForTimeout(1500);
  const lauf=await p.evaluate(()=>({an:window.__bb.MUSIK.an,schritt:window.__bb.mStep,bus:!!window.__bb.mBus,knopf:!!document.getElementById('musikBtn'),anz:document.getElementById('pMusikAn').textContent}));
  const pegel=[];
  const anzahl=await p.evaluate(()=>window.__bb.STUECKE.length);
  for(let k=0;k<anzahl;k++){
    const r=await p.evaluate(async k=>{ const bb=window.__bb;
      const ac=bb.mBus.context, an=ac.createAnalyser(); an.fftSize=2048; bb.mBus.connect(an);
      /* Stueck k ab dem vollen Teil (Takt 8), hinter dem Regler gemessen */
      bb.MUSIK.stueck=k; bb.mStep=8*16;
      await new Promise(r=>setTimeout(r,700));
      const d=new Float32Array(2048); let summe=0, n=0, spitze=0, nan=false;
      for(let w=0;w<50;w++){ await new Promise(r=>setTimeout(r,120)); an.getFloatTimeDomainData(d);
        let s=0; for(const x of d){ if(!isFinite(x)) nan=true; s+=x*x; spitze=Math.max(spitze,Math.abs(x)); } summe+=s/d.length; n++; }
      bb.mBus.disconnect(an);
      return {name:bb.STUECKE[k].name,rms:+Math.sqrt(summe/n).toFixed(4),spitze:+spitze.toFixed(3),nan}; },k);
    pegel.push(r);
  }
  console.log('LAUF    ',JSON.stringify(lauf));
  console.log('PEGEL   ',JSON.stringify(pegel));
  pruef('PEGEL',anzahl>=10,'nur '+anzahl+' Stuecke');
  pruef('LAUF',lauf.an&&lauf.bus&&lauf.schritt>8&&!lauf.knopf&&/an/.test(lauf.anz),'Musik laeuft nach dem Start nicht: '+JSON.stringify(lauf));
  pegel.forEach(x=>pruef('PEGEL',x.rms>0.005&&!x.nan&&x.spitze<1,x.name+' stumm, uebersteuert oder kaputt ('+x.rms+' / '+x.spitze+')'));
  const rs=pegel.map(x=>x.rms), lautLeise=Math.max(...rs)/Math.min(...rs);
  pruef('PEGEL',lautLeise<2,'Stuecke unterschiedlich laut: Faktor '+lautLeise.toFixed(2));

  /* M: aus, der Takt steht, Einstellung bleibt nach dem Neuladen */
  await p.keyboard.press('KeyM');
  const aus=await p.evaluate(async()=>{ const bb=window.__bb, s0=bb.mStep; await new Promise(r=>setTimeout(r,800));
    return {an:bb.MUSIK.an,weiter:bb.mStep-s0,btn:document.getElementById('pMusikAn').textContent,gespeichert:(JSON.parse(localStorage.getItem('bb_musik')||'{}')).an}; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  const nachLaden=await p.evaluate(()=>window.__bb.MUSIK.an);
  console.log('AUS     ',JSON.stringify({aus,nachLaden}));
  pruef('AUS',aus.an===false&&aus.weiter===0&&aus.gespeichert===false&&/aus/.test(aus.btn),'M schaltet nicht aus: '+JSON.stringify(aus));
  pruef('AUS',nachLaden===false,'nach dem Neuladen wieder an');

  /* Knopf im Pausenmenue schaltet wieder an; N springt zum naechsten Stueck */
  await neuesSpiel(p);
  await p.evaluate(()=>document.getElementById('pMusikAn').click());
  const wieder=await p.evaluate(()=>window.__bb.MUSIK.an);
  const s0=await p.evaluate(()=>window.__bb.MUSIK.stueck);
  await p.keyboard.press('KeyN');
  const s1=await p.evaluate(()=>window.__bb.MUSIK.stueck);
  /* Pausenmenue: Regler */
  /* seit 26.09. eigene Musik-Maske im Pausenmenue */
  await p.evaluate(()=>{ window.__bb.showPause(); window.__bb.pauseSeite('pMusikSeite'); });
  const regler=await p.evaluate(()=>{ const r=document.getElementById('pMusikVol'); const sicht=!!r&&r.getBoundingClientRect().width>0;
    r.value=20; r.dispatchEvent(new Event('input')); return {sicht,vol:window.__bb.MUSIK.vol,name:document.getElementById('pMusikName').textContent}; });
  console.log('BEDIENUNG',JSON.stringify({wieder,s0,s1,regler}));
  pruef('BEDIENUNG',wieder===true,'Knopf schaltet nicht an');
  pruef('BEDIENUNG',s1===(s0+1)%anzahl,'N springt nicht weiter: '+s0+' -> '+s1);
  pruef('BEDIENUNG',regler.sicht&&Math.abs(regler.vol-0.2)<0.001&&regler.name.length>3,'Regler im Pausenmenue: '+JSON.stringify(regler));

  /* Oben rechts steht kein Wochenziel mehr (Tom, 25.09.) */
  const ziel=await p.evaluate(()=>{ const bb=window.__bb; bb.closePause&&bb.closePause(); bb.updateHUD();
    return {ziel:bb.S.goal&&bb.S.goal.name,hud:document.getElementById('staff').textContent}; });
  console.log('ZIEL    ',JSON.stringify(ziel));
  pruef('ZIEL',!!ziel.ziel&&ziel.hud.indexOf(ziel.ziel)<0,'Wochenziel steht noch im Bild: '+JSON.stringify(ziel));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

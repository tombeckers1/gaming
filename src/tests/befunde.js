/* Befunde aus der Durchsicht fuer das Handbuch (26.09.):
   - RUHETAG: Sonntag ohne Sonntagsgenehmigung war eine Sackgasse -
     der Laden liess sich nicht oeffnen und der Tag nie beenden. Jetzt:
     am Tuerschild "Ruhetag: Tag beenden", um 22 Uhr von selbst Feierabend
   - ROHR: die neuen Kugelbomben (150/200/300 mm) landeten im kleinen
     Rohr; jede Kugel gehoert ins Rohr ihres Kalibers
   - QUALITAET: Restposten-Ware (86 %) kam aus dem Lagerregal als 100 %
     zurueck
   - MENUE: am Touchgeraet gab es keinen Weg ins Pausenmenue */
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
  const p=await b.newPage({viewport:{width:1200,height:760}}); p.setDefaultTimeout(180000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    /* Ruhetag: Sonntag suchen */
    let d=S.day; while(!bb.isSunday(d)) d++;
    S.day=d; S.up.tag4=false; bb.phase='closed'; bb.clock=8*60;
    o.sonntag=d; o.hinweis=bb.promptFor({kind:'sign'});
    const tag0=S.day; bb.tuAktion('sign',null);
    o.nachSchild={tag:S.day,phase:bb.phase,summary:document.getElementById('summary').classList.contains('show')};
    const nb=document.querySelector('#summary button:last-child'); if(nb) nb.click();
    o.weiter={tag:S.day,phase:bb.phase};
    /* von selbst um 22 Uhr */
    S.day=d+7; bb.phase='closed'; bb.clock=21*60+59;
    for(let i=0;i<40;i++) bb.run(0.25,0.25);
    o.uhr22={phase:bb.phase,tag:S.day};
    document.querySelectorAll('.ov.show').forEach(x=>x.classList.remove('show'));
    /* Rohr je Kaliber */
    const soll={kugel75:0,kugel100:0,kugel150:1,kugel200:1,kugel300:2,palmenkugel75:0,farbenmeer75:0,goldweide100:0,kristallkugel100:0,sternenstaub150:1,sternkugel150:1,goldkrone200:1,kaiserkrone:2};
    o.rohr={}; o.rohrFalsch=[]; for(const t in soll){ const ist=bb.moerserRohr(t); o.rohr[t]=ist; if(ist!==soll[t]) o.rohrFalsch.push(t+':'+ist+'≠'+soll[t]); }
    /* Qualitaet durchs Lagerregal */
    S.up.lager=true; bb.oeffneZone&&bb.oeffneZone('lager',true);
    bb.testKauf('REGAL:rack');
    let slot=null; for(const rk of (bb.racks||[])) for(const s2 of rk.slots) if(!s2.box&&!slot) slot=s2;
    o.lagerDa=!!slot;
    if(slot){ S.carrying={type:'wunder',count:12,q:0.86};
      const alt=bb.target; bb.tuAktion('rslot',slot); o.imRegal=slot.box?slot.box.q:null;
      S.carrying=null; bb.tuAktion('rslot',slot); o.zurueck=S.carrying?S.carrying.q:null; S.carrying=null; }
    /* Menue-Knopf am Touchgeraet */
    const m=document.getElementById('btnMenu'); o.menuImTouch=!!m&&!!m.closest('#touch');
    if(m){ m.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true})); }
    o.pauseAuf=document.getElementById('pause').classList.contains('show');
    bb.closePause&&bb.closePause();
    return o; });
  console.log('RUHETAG ',JSON.stringify({sonntag:r.sonntag,hinweis:r.hinweis,nachSchild:r.nachSchild,weiter:r.weiter,uhr22:r.uhr22}));
  console.log('ROHR    ',JSON.stringify(r.rohr),'falsch',JSON.stringify(r.rohrFalsch));
  console.log('QUALI   ',JSON.stringify({lager:r.lagerDa,imRegal:r.imRegal,zurueck:r.zurueck}),'| MENUE',JSON.stringify({im:r.menuImTouch,auf:r.pauseAuf}));
  pruef('RUHETAG',r.hinweis&&r.hinweis.a&&/Ruhetag/.test(r.hinweis.t),'Hinweis am Schild: '+JSON.stringify(r.hinweis));
  pruef('RUHETAG',r.nachSchild.summary&&r.weiter.tag===r.sonntag+1,'Sonntag laesst sich nicht beenden: '+JSON.stringify([r.nachSchild,r.weiter]));
  pruef('RUHETAG',r.uhr22.phase==='after','um 22 Uhr kein Feierabend: '+JSON.stringify(r.uhr22));
  pruef('ROHR',!r.rohrFalsch.length,'falsches Rohr: '+r.rohrFalsch.join(', '));
  pruef('QUALITAET',r.lagerDa&&r.imRegal===0.86&&r.zurueck===0.86,'Restposten-Qualitaet: '+JSON.stringify([r.lagerDa,r.imRegal,r.zurueck]));
  pruef('MENUE',r.menuImTouch&&r.pauseAuf,'Menue-Knopf: '+JSON.stringify([r.menuImTouch,r.pauseAuf]));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

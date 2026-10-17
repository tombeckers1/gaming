/* Speichern zuverlaessig (Tom 17.10.: "save() schluckt Fehler still - bei der Simulation fiel der Spielstand auf einen aelteren Tag
   zurueck"). Vollausbau-Stand (Gameplay-Aufbau, danach ein paar Tage), dann:
   1. SPEICHERN-LADEN: save() schreibt, loadSave() liefert denselben Stand (Rundlauf), Lesekontrolle
   2. QUOTA: setItem wirft QuotaExceededError - save() meldet "Speichern fehlgeschlagen" mit Grund, der alte Stand bleibt unveraendert
   3. PLATZ: Quota, aber eine ersetzbare Sicherungskopie (GP_KEY) liegt im Speicher - sie wird geraeumt, danach gelingt das Speichern
   4. KOMPAKT: Stand zu gross fuer die Grenze, mit gekuerztem Verlauf passt er - gespeichert, Stand sonst vollstaendig
   5. ZIRKEL: ein Szenenobjekt mit Zirkelbezug im Stand - gespeichert (ohne den Bezug), gemeldet
   6. DEFEKT: beschaedigter Stand wird nicht still verworfen (Kopie + Meldung)
   7. VORFUEHRUNG: scheitert die Sicherungskopie, bleibt der eigene Stand unberuehrt (Meldung)
   Gegenprobe: gegen den Stand vor dem Fix (Build V142) schlaegt QUOTA an - save() schluckt den Fehler, kein Toast (siehe docs/bilder/figuren-1710/speichern.md).
   Aufruf: node speichern.js test.html|real.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:30000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1100,height:700}}); p.setDefaultTimeout(1800000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  await p.evaluate(()=>{ window.__toasts=[]; new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>window.__toasts.push(n.textContent)))).observe(document.getElementById('toasts'),{childList:true}); });
  const toasts=async()=>{ await p.evaluate(()=>new Promise(r=>setTimeout(r,80))); return p.evaluate(()=>window.__toasts.slice()); };
  /* Sicherungskopie der Vorfuehrung schlaegt fehl (Schritt 7 zuerst: gpStart ist der Aufbau des Vollausbaus) */
  const v=await p.evaluate(()=>{ const bb=__bb, o={}; const orig=Storage.prototype.setItem; window.__origSet=orig;
    Storage.prototype.setItem=function(k,val){ if(k==='bb_gp_sicherung') throw new DOMException('quota','QuotaExceededError'); return orig.call(this,k,val); };
    bb.gpStart(); let n=0; while(!bb.gpFertig&&n++<20000) bb.gpBauSchritt(50);
    Storage.prototype.setItem=orig;
    o.stand=(localStorage.getItem(bb.SAVE_KEY())||'').length; o.gpKey=localStorage.getItem('bb_gp_sicherung');
    return o; });
  v.toast=(await toasts()).join(' | ');
  console.log('VORFUEHRUNG',JSON.stringify(v));
  pruef('VORFUEHRUNG',/ohne Sicherungskopie/.test(v.toast)&&v.stand>1000&&v.gpKey===null,'Vorfuehrung ohne Sicherungskopie nicht gemeldet oder eigener Stand fehlt: '+JSON.stringify(v));
  /* Vollausbau-Stand, Speichersperre der Vorfuehrung aus, ein paar Tage Betrieb (Bestellungen, Verlauf) */
  const g=await p.evaluate(()=>{ const bb=__bb, o={}; localStorage.removeItem('bb_gp_sicherung');
    let g=0; while(bb.S.day<4&&g++<200000) bb.run(1,0.1);
    bb.gpAn=false;   /* Speichersperre der Vorfuehrung aus: ab jetzt schreibt save() */
    o.tag=bb.S.day; o.regale=bb.shelves.length; o.lager=bb.racks.length; o.kb=Math.round(JSON.stringify(bb.stateBauen()).length/1024);
    return o; });
  console.log('AUSBAU',JSON.stringify(g));
  pruef('AUSBAU',g.regale>=25&&g.lager>=10&&g.kb>40,'kein Vollausbau-Stand: '+JSON.stringify(g));
  const r=await p.evaluate(()=>{ const bb=__bb, o={}, orig=window.__origSet, K=bb.SAVE_KEY();
    const st=()=>({ok:bb.SAVE_STATUS.ok,fehler:bb.SAVE_STATUS.fehler,zirkel:bb.SAVE_STATUS.zirkel|0,kompakt:bb.SAVE_STATUS.kompakt|0,platz:bb.SAVE_STATUS.platz|0});
    const limit=(n,nurKey)=>{ Storage.prototype.setItem=function(k,val){ if((!nurKey||k===K)&&String(val).length>n) throw new DOMException('The quota has been exceeded.','QuotaExceededError'); return orig.call(this,k,val); }; };
    const frei=()=>{ Storage.prototype.setItem=orig; };
    /* 1. Rundlauf */
    bb.S.money=12345.67; bb.S.day=bb.S.day;
    o.s0=st(); o.erg1=bb.save(); const roh=localStorage.getItem(K); const d=bb.loadSave();
    o.rund={ok:o.erg1,tag:d&&d.day===bb.S.day,geld:d&&d.money===bb.S.money,regale:d&&d.shelves.length===bb.shelves.length,lager:d&&d.racks.length===bb.racks.length,gleich:JSON.stringify(d)===JSON.stringify(bb.stateBauen()),kb:Math.round(roh.length/1024)};
    /* 2. Quota */
    const alt=localStorage.getItem(K); bb.S.money=99999; limit(1000,true); const f0=bb.SAVE_STATUS.fehler; bb.SAVE_STATUS.toastT=0;
    o.erg2=bb.save(); frei(); o.quota={erg:o.erg2,fehler:bb.SAVE_STATUS.fehler-f0,grund:bb.SAVE_STATUS.grund,altBlieb:localStorage.getItem(K)===alt};
    /* 3. Platz schaffen: Sicherungskopie + Leistungsbericht liegen im Speicher, Grenze laesst nur den Stand zu, wenn sie weg sind */
    orig.call(localStorage,'bb_gp_sicherung','x'.repeat(2000)); orig.call(localStorage,'bb_leistung_bericht','y'.repeat(2000));
    let belegt=2000+2000; Storage.prototype.setItem=function(k,val){ const rest=Object.keys(localStorage).reduce((s,key)=>key===k?s:s+(localStorage.getItem(key)||'').length,0); if(rest+String(val).length>alt.length+3000) throw new DOMException('quota','QuotaExceededError'); return orig.call(this,k,val); };
    bb.S.money=88888; const p0=bb.SAVE_STATUS.platz; o.erg3=bb.save(); frei();
    o.platz={erg:o.erg3,platz:bb.SAVE_STATUS.platz-p0,gp:localStorage.getItem('bb_gp_sicherung'),lm:localStorage.getItem('bb_leistung_bericht'),geld:JSON.parse(localStorage.getItem(K)).money};
    /* 4. kompakt: Verlauf aufblasen, Grenze knapp ueber dem gekuerzten Stand */
    for(const t in bb.S.mh) bb.S.mh[t]=Array.from({length:400},(_,i)=>+(1+i/1000).toFixed(3));
    const gross=JSON.stringify(bb.stateBauen()).length; const k0=bb.SAVE_STATUS.kompakt|0; limit(Math.round(gross*0.8),true); bb.S.money=77777;
    o.erg4=bb.save(); frei(); const dk=JSON.parse(localStorage.getItem(K));
    o.kompakt={erg:o.erg4,kompakt:(bb.SAVE_STATUS.kompakt|0)-k0,geld:dk.money,mh:Math.max(...Object.values(dk.mh).map(a=>a.length)),regale:dk.shelves.length===bb.shelves.length,gross:Math.round(gross/1024)};
    for(const t in bb.S.mh) bb.S.mh[t]=bb.S.mh[t].slice(-30);
    /* 5. Zirkelbezug */
    const zz={a:1}; zz.selbst=zz; bb.S.carrying=zz; bb.S.money=66666; const z0=bb.SAVE_STATUS.zirkel|0;
    o.erg5=bb.save(); bb.S.carrying=null; o.zirkel={erg:o.erg5,zirkel:(bb.SAVE_STATUS.zirkel|0)-z0,geld:JSON.parse(localStorage.getItem(K)).money};
    /* 5b. Karton ohne y (Ursache der Rueckfaelle im Bot-Lauf: sim.js legte Kartons ohne Hoehe auf den Boden - toFixed von undefined) */
    const nB0=bb.floorBoxes.length; bb.spawnFloorBox('boeller',5,{x:-10,z:-2},1); const bx=bb.floorBoxes[bb.floorBoxes.length-1]; bx.mesh.position.y=undefined; bb.S.money=60606;
    const fz0=bb.SAVE_STATUS.fehler; o.erg5b=bb.save(); const d5=JSON.parse(localStorage.getItem(K));
    o.ohneY={erg:o.erg5b,fehler:bb.SAVE_STATUS.fehler-fz0,geld:d5.money,box:d5.boxes.some(b=>b.type==='boeller'&&b.y===0.2),spawnY:(()=>{ bb.spawnFloorBox('boeller',1,{x:-9,z:-2}); return bb.floorBoxes[bb.floorBoxes.length-1].mesh.position.y; })()};
    bb.removeFloorBox(bx);
    /* 6. defekter Stand */
    orig.call(localStorage,K,'{"v":3,"day":9,"money":'); const dd=bb.loadSave();
    o.defekt={ergNull:dd===null,kopie:!!localStorage.getItem(K+'_defekt'),status:bb.SAVE_STATUS.defekt||''};
    localStorage.removeItem(K+'_defekt'); bb.S.money=55555; bb.save();
    return o; });
  console.log('RUNDLAUF',JSON.stringify(r.rund)); console.log('QUOTA',JSON.stringify(r.quota)); console.log('PLATZ',JSON.stringify(r.platz));
  console.log('KOMPAKT',JSON.stringify(r.kompakt)); console.log('ZIRKEL',JSON.stringify(r.zirkel)); console.log('DEFEKT',JSON.stringify(r.defekt)); console.log('OHNE_Y',JSON.stringify(r.ohneY));
  r.toasts=await toasts(); console.log('TOASTS',JSON.stringify(r.toasts.filter(t=>/Speich|Sicherung|besch/i.test(t))));
  pruef('QUOTA_TOAST',r.toasts.some(t=>/Speichern fehlgeschlagen: Speicher des Browsers voll/.test(t)),'kein sichtbarer Toast "Speichern fehlgeschlagen" mit Grund: '+JSON.stringify(r.toasts));
  const R=r.rund; pruef('RUNDLAUF',R.ok&&R.tag&&R.geld&&R.regale&&R.lager&&R.gleich,'Speichern-Laden nicht gleich: '+JSON.stringify(R));
  const Q=r.quota; pruef('QUOTA',Q.erg===false&&Q.fehler===1&&Q.altBlieb&&/Speicher/.test(Q.grund),'Quota still geschluckt oder alter Stand veraendert: '+JSON.stringify(Q));
  const P=r.platz; pruef('PLATZ',P.erg===true&&P.platz===1&&P.gp===null&&P.lm===null&&P.geld===88888,'Platz schaffen klappt nicht: '+JSON.stringify(P));
  const K=r.kompakt; pruef('KOMPAKT',K.erg===true&&K.kompakt===1&&K.geld===77777&&K.mh<=30&&K.regale,'kompaktes Speichern klappt nicht: '+JSON.stringify(K));
  const Z=r.zirkel; pruef('ZIRKEL',Z.erg===true&&Z.zirkel===1&&Z.geld===66666,'Zirkelbezug verhindert das Speichern: '+JSON.stringify(Z));
  const Y=r.ohneY; pruef('OHNE_Y',Y.erg===true&&Y.fehler===0&&Y.geld===60606&&Y.box&&Y.spawnY===0.2,'Karton ohne y kippt das Speichern: '+JSON.stringify(Y));
  const D=r.defekt; pruef('DEFEKT',D.ergNull&&D.kopie&&D.status,'defekter Stand wird still verworfen: '+JSON.stringify(D));
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK'); await b.close();
})();

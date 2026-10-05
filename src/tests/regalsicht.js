/* Verdeckte Ware (04.10., Tom: Gameplay-Vorfuehrung am iPhone mit 5 Bildern
   je Sekunde): Stuecke hinter den zwei vordersten vollen Reihen werden
   nicht gezeichnet. Geprueft: Zaehlung und Griffe passen immer zusammen,
   versteckt ist genau der hintere Teil, die vorderen Reihen sind im
   Zeichenpuffer - auch nachdem Kunden kaufen und nachgeraeumt wird. */
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
  /* HANDY=1: Handy-Profil (Blickfeld- und Entfernungsregel, eine Reihe) */
  const p=process.env.HANDY==='1'?await (await b.newContext({isMobile:true,hasTouch:true,viewport:{width:390,height:844}})).newPage():await b.newPage({viewport:{width:1100,height:700}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const stand=()=>p.evaluate(()=>{ const bb=__bb, f=[]; let faecher=0, versteckt=0, stueck=0;
    for(const lv of bb.allLevels()){ if(!lv.type) continue; faecher++; stueck+=lv.count;
      const K=bb.kindOf(lv.sh), L=bb.layout(lv.type,lv.sh,lv), reihe=L.cols*L.st;
      if(lv.items.length!==lv.count) f.push('Zaehlung '+lv.type+' '+lv.items.length+'/'+lv.count);
      const weg=lv.weg||0; versteckt+=weg;
      lv.items.forEach((h,i)=>{ const soll=i<weg; if(!!h.versteckt!==soll) f.push('Griff '+lv.type+' #'+i+' versteckt='+!!h.versteckt+' soll='+soll);
        if(!h.versteckt&&h.pool.h[h.i]!==h) f.push('fehlt im Puffer '+lv.type+' #'+i);
        if(h.versteckt&&h.pool.h.indexOf(h)>=0) f.push('versteckt aber im Puffer '+lv.type+' #'+i); });
      /* die zwei vordersten vollen Reihen und die angebrochene sind sichtbar */
      /* ausserhalb des Blickfelds (Handy) ist das ganze Fach versteckt */
      if(lv.imBlick===false){ if(weg!==lv.count) f.push('nicht im Blick, aber sichtbar '+lv.type+' '+weg+'/'+lv.count); }
      else if(reihe>0&&lv.count-weg<Math.min(lv.count,(lv.nah===undefined?2:1)*reihe)) f.push('zu viel versteckt '+lv.type+' '+weg+'/'+lv.count+' Reihe '+reihe);
      /* oberstes Fach unter Augenhoehe (Kassenregal): man sieht von oben hinein - wie in lvSicht */
      const offen=lv.li===K.lv.length-1&&K.lv[lv.li]+bb.fachHoehe(K,lv.li)<1.8;
      if(!K.frei&&!offen&&reihe>0&&L.rows>3&&lv.count===L.cap&&weg===0) f.push('nichts versteckt '+lv.type+' '+lv.count);
    }
    for(const t of Object.keys(bb.pools)){ const pl=bb.pools[t]; pl.h.forEach((h,i)=>{ if(h.i!==i) f.push('Index '+t); if(h.versteckt) f.push('versteckter Griff im Puffer '+t); });
      for(const m of pl.meshes) if(m.count!==pl.h.length){ f.push('Mesh-Anzahl '+t); break; } }
    return {faecher,stueck,versteckt,fehler:f.slice(0,8),nFehler:f.length}; });
  await p.evaluate(()=>{ const bb=__bb; bb.gpStart(); let n=0; while(!bb.gpFertig&&n++<20000) bb.gpBauSchritt(50); });
  const a=await stand(); console.log('VOLL',JSON.stringify(a));
  pruef('voll',a.nFehler===0,a.fehler.join(' | '));
  pruef('spart',a.versteckt>a.stueck*0.3,'versteckt nur '+a.versteckt+' von '+a.stueck);
  /* Laden laufen lassen: Kunden kaufen vorn, Einraeumer fuellen nach */
  for(let r=0;r<4;r++){ await p.evaluate(()=>{ for(let i=0;i<1500;i++) __bb.step(1/30); }); }
  const c=await stand(); console.log('NACH VERKAUF',JSON.stringify(c));
  pruef('lauf',c.nFehler===0,c.fehler.join(' | '));
  /* Fach komplett leeren und neu fuellen */
  const d=await p.evaluate(()=>{ const bb=__bb, lv=bb.allLevels().find(l=>l.type&&(l.weg||0)>0); if(!lv) return {ok:false};
    const t=lv.type, n=lv.count; while(lv.count>0) bb.removeFromLevel(lv); const leer=(lv.weg||0)===0&&lv.items.length===0;
    let k=0; while(k<n&&bb.addToLevel(lv,t,1)) k++; return {ok:leer, n, k, weg:lv.weg||0}; });
  const e=await stand(); console.log('LEEREN',JSON.stringify(d),e.nFehler);
  pruef('leeren',d.ok&&e.nFehler===0,JSON.stringify(d)+' '+e.fehler.join(' | '));
  console.log(mangel.length?'MANGEL: '+mangel.join(' || '):'ALLES OK'); console.log(errs.length?errs.slice(0,3).join('\n'):'ERRORS: keine');
  await b.close();
})();

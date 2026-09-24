/* Wandfarbe und Bodenbelag (Tom, 24.09.: "ich klicke an, im Raum
   aendert sich nichts"):
   - zu wenig Geld: es gibt eine Meldung, warum nicht
   - jede Kachel zeigt ihren Preis sichtbar (nicht nur im Tooltip)
   - mit genug Geld aendert JEDE Wandfarbe und JEDER Boden das Bild
     im Laden, und keine zwei sehen gleich aus
   Aufruf: node deko.js real.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const klick=(a,t)=>p.evaluate(([a,t])=>{ const bb=window.__bb; bb.openLaptop(); const tab=document.querySelector('[data-tab="deko"]'); if(tab) tab.click();
    const btn=document.querySelector(`#lbody [data-a="${a}"][data-t="${t}"]`); const vor=bb.toastLast; if(btn) btn.click();
    const r={gefunden:!!btn,text:btn?btn.textContent.trim():'',wall:bb.S.wall,floor:bb.S.floor,toast:bb.toastLast!==vor?bb.toastLast:null}; bb.closeLaptop(false); return r; },[a,t]);

  /* 1. zu wenig Geld */
  await p.evaluate(()=>{ window.__bb.S.money=110; });
  const arm=await klick('wall','sand');
  console.log('ARM     ',JSON.stringify(arm));
  pruef('GELD',arm.wall!=='sand'&&arm.toast&&/Geld|fehl/.test(arm.toast),'keine Meldung bei zu wenig Geld: '+JSON.stringify(arm));
  pruef('PREIS',/250/.test(arm.text),'Preis steht nicht auf der Kachel: '+JSON.stringify(arm.text));

  /* 2. mit Geld: jede Wand und jeder Boden aendert das Bild */
  const L=await p.evaluate(()=>({w:window.__bb.WALLS.map(x=>x.id),f:window.__bb.FLOORS.map(x=>x.id)}));
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.money=1e6; document.querySelectorAll('#hud,.tip,#tip,#zielPfeil').forEach(e=>e.style.display='none'); });
  const bild=async(pitch)=>{ await p.evaluate((pitch)=>{ const bb=window.__bb; bb.setView(0,4,0,pitch); bb.run(0.05,0.05); bb.renderFrame(1/60); },pitch);
    return (await p.screenshot({clip:{x:120,y:60,width:400,height:280}})).toString('base64'); };
  const vgl=async(kind,ids,pitch)=>{ const seen={}, fehl=[];
    for(const id of ids){ const k=await klick(kind,id); if(k[kind]!==id){ fehl.push(id+':nicht gesetzt'); continue; }
      const h=await bild(pitch); if(seen[h]) fehl.push(id+'=='+seen[h]); else seen[h]=id; }
    return fehl; };
  const fw=await vgl('wall',L.w,0.05), ff=await vgl('floor',L.f,-0.9);
  console.log('WAENDE  ',L.w.length,'Fehler',JSON.stringify(fw));
  console.log('BOEDEN  ',L.f.length,'Fehler',JSON.stringify(ff));
  pruef('WAND',!fw.length,'Wandfarben ohne Wirkung: '+fw.join(','));
  pruef('BODEN',!ff.length,'Boeden ohne Wirkung: '+ff.join(','));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

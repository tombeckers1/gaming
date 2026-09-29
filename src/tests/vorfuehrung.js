/* Feuerwerk-Vorfuehrung (Tom, 29.09.): alle Feuerwerke nach Level, einzeln
   per Taste - Leertaste zuendet das naechste, der Name steht gross oben,
   Pfeile vor/zurueck, 1/2 Notiz, Esc beendet. Nichts laeuft von selbst. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    const taste=code=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:code,bubbles:true}));
    S.clock=600; bb.clock=600; bb.applyTOD(); const sonneTag=bb.sonne();
    bb.vorfuehrungAn(); bb.run(0.2,0.05);
    const L=bb.vfListe, P=bb.P;
    o.start={an:bb.vfAn,n:L.length,sonne:+bb.sonne().toFixed(3),sonneTag:+sonneTag.toFixed(3),el:!!bb.vfEl,idx:bb.vfIdx};
    o.sortiert=L.every((t,i)=>!i||P[L[i-1]].lvl<=P[t].lvl);
    o.alle=Object.keys(P).filter(t=>P[t].cat&&bb.stationOf(t)&&!P[t].rezept&&!P[t].noOrder).length;
    /* nichts laeuft von selbst */
    const g0=bb.stat('gezuendet'); bb.run(3,0.1); o.vonSelbst=bb.stat('gezuendet')-g0;
    /* Leertaste: das erste zuendet, sein Name steht oben */
    taste('Space'); bb.run(0.1,0.05);
    o.erst={letzt:bb.vfLetzt,soll:L[0],idx:bb.vfIdx,gez:bb.stat('gezuendet')-g0,text:bb.vfEl.innerText.slice(0,400)};
    o.erst.nameDa=o.erst.text.indexOf(P[L[0]].short)>=0&&o.erst.text.indexOf('L'+P[L[0]].lvl)>=0;
    o.erst.naechstDa=o.erst.text.indexOf(P[L[1]].short)>=0;
    /* Pfeile, Notiz */
    taste('ArrowRight'); const i1=bb.vfIdx; taste('ArrowLeft'); const i2=bb.vfIdx;
    taste('Digit1'); o.pfeile={i1,i2}; o.note=bb.vfText().split('\n')[0]; o.haken=bb.vfEl.innerText.indexOf('gut')>=0;
    /* R: das letzte nochmal */
    const g1=bb.stat('gezuendet'); taste('KeyR'); bb.run(0.1,0.05); o.nochmal={gez:bb.stat('gezuendet')-g1,idx:bb.vfIdx};
    /* das ganze Sortiment, alle 0,6 s eins - jedes muss zuenden */
    const fehlt=[]; let zeit=0;
    while(bb.vfIdx<L.length){ const t=L[bb.vfIdx], g=bb.stat('gezuendet'); taste('Space'); bb.run(0.9,0.05); zeit+=0.9; if(bb.stat('gezuendet')<=g) fehlt.push(t); }
    o.durch={fehlt,idx:bb.vfIdx,minuten:+(zeit/60).toFixed(1),ende:bb.vfEl.innerText.indexOf('Ende der Liste')>=0};
    /* Esc beendet (ohne Mauszeiger-Sperre) */
    taste('Escape'); o.aus={an:bb.vfAn,el:!!document.getElementById('vorfuehrung')};
    return o; });
  console.log('VORF',JSON.stringify(r).slice(0,1500));
  pruef('START',r.start.an&&r.start.el&&r.start.n===r.alle&&r.start.n>100,'Start/Liste: '+JSON.stringify(r.start)+' alle '+r.alle);
  pruef('NACHT',r.start.sonne<r.start.sonneTag,'es wird nicht Nacht: '+JSON.stringify(r.start));
  pruef('REIHENFOLGE',r.sortiert,'Liste nicht nach Level');
  pruef('EINZELN',r.vonSelbst===0,'zuendet von selbst: '+r.vonSelbst);
  pruef('LEERTASTE',r.erst.letzt===r.erst.soll&&r.erst.idx===1&&r.erst.gez===1,'Leertaste: '+JSON.stringify(r.erst).slice(0,300));
  pruef('NAME',r.erst.nameDa&&r.erst.naechstDa,'Name/Level/Naechstes nicht zu sehen: '+r.erst.text.slice(0,200));
  pruef('PFEILE',r.pfeile.i1===2&&r.pfeile.i2===1,'Pfeile: '+JSON.stringify(r.pfeile));
  pruef('NOTIZ',/gut\s*$/.test(r.note)&&r.haken,'Notiz: '+r.note);
  pruef('NOCHMAL',r.nochmal.gez===1&&r.nochmal.idx===1,'R: '+JSON.stringify(r.nochmal));
  pruef('ALLE',!r.durch.fehlt.length&&r.durch.ende,'nicht gezuendet: '+JSON.stringify(r.durch));
  pruef('ESC',!r.aus.an&&!r.aus.el,'Esc: '+JSON.stringify(r.aus));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

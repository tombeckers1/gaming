/* Mehrwegkisten (Tom, 03.10.: "fuer wenig Geld eine Kiste kaufen ... was
   einem nicht gefaellt, in diese Kiste einraeumen ... mit einer Taste
   aktivieren und dann woanders einraeumen").
   - KAUF: Laptop > Einrichtung > Mehrwegkisten gibt 5 Kisten fuer 10 EUR
   - RAUS: leere Kiste (X) + Aktion auf ein Fach nimmt Stueck fuer Stueck
     heraus, Fach und Kiste zaehlen richtig, Ware im Regal verschwindet
   - REIN: X schaltet auf einraeumen, Aktion legt in ein anderes Fach
   - LEER: leer geraeumt bleibt die Kiste in der Hand, X stellt sie weg
   - SPERRE: Kiste auf "ausraeumen" legt nie etwas in ein leeres Fach
   - BODEN: Kiste abstellen und aufheben, sie bleibt eine Kiste
   - LAGER: ins Lagerregal und wieder heraus bleibt es eine Kiste
   - SPEICHER: Vorrat und Kiste in der Hand ueberstehen Speichern/Laden
   Aufruf: node kiste.js test.html (oder real.html) */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, P=bb.P, o={m:[],info:{}};
    const f=(ok,txt)=>{ if(!ok) o.m.push(txt); };
    /* KAUF */
    const up=bb.UPGRADES.find(u=>u.id==='kisten');
    f(up&&up.kat==='einr'&&up.cost()<=10,'KAUF: kein Eintrag Mehrwegkisten unter Einrichtung fuer hoechstens 10 EUR');
    S.money=1000; const m0=S.money; bb.buyUp('kisten');
    f(S.kisten===5&&m0-S.money===10,`KAUF: ${S.kisten} Kisten, ${m0-S.money} EUR bezahlt`);
    bb.regalStellen('standard'); bb.regalStellen('standard');
    /* Ware in ein Fach */
    const lvs=bb.allLevels(); let t=null, A=null;
    for(const lv of lvs){ for(const k of bb.ORDER){ const q=P[k]; if(!q||q.noOrder||q.kuehl) continue; if(bb.capOf(lv,k)>=6){ t=k; A=lv; break; } } if(A) break; }
    if(!A){ o.m.push('kein Fach gefunden'); return o; }
    const B=lvs.find(l=>l!==A&&!l.count&&bb.capOf(l,t)>=6);
    S.carrying={type:t,count:6,q:1}; for(let i=0;i<6;i++) bb.stockOne(A,true);
    f(A.count===6&&!S.carrying,`Vorbereitung: Fach ${A.count}/6`);
    o.info.sorte=t;
    const lager0=bb.stockOf?bb.stockOf(t):null;
    /* RAUS */
    bb.kisteTaste();
    f(S.kisteHand&&S.kisten===4,`RAUS: X gibt keine leere Kiste (Hand ${S.kisteHand}, Vorrat ${S.kisten})`);
    const pr=bb.promptFor&&bb.promptFor({kind:'level',ref:A});
    for(let i=0;i<4;i++) bb.tuAktion('level',A);
    const c=S.carrying;
    f(c&&c.kiste&&c.raus&&c.type===t&&c.count===4,'RAUS: Kiste '+JSON.stringify(c));
    f(A.count===2&&A.items.length===2,`RAUS: Fach ${A.count}, sichtbar ${A.items.length} (soll 2)`);
    f(!S.kisteHand,'RAUS: leere Kiste noch zusaetzlich in der Hand');
    if(lager0!=null) f(bb.stockOf(t)===lager0,`RAUS: Bestand ${bb.stockOf(t)} statt ${lager0} – Ware verschwunden oder verdoppelt`);
    o.info.prompt=pr&&pr.t;
    /* SPERRE: auf ausraeumen in ein leeres Fach -> nichts */
    if(B){ bb.tuAktion('level',B); f(B.count===0&&c&&c.count===4,`SPERRE: Kiste auf ausraeumen legte ${B.count} ins leere Fach`); }
    /* REIN */
    bb.kisteTaste(); f(c&&c.raus===false,'REIN: X schaltet nicht auf einraeumen');
    const Z=B||A;
    for(let i=0;i<4;i++) bb.tuAktion('level',Z);
    f(Z.count===(Z===A?6:4),`REIN: Zielfach ${Z.count}`);
    /* LEER */
    f(!S.carrying&&S.kisteHand,'LEER: leer geraeumte Kiste nicht mehr in der Hand');
    bb.kisteTaste(); f(!S.kisteHand&&S.kisten===5,`LEER: X stellt die Kiste nicht weg (Vorrat ${S.kisten})`);
    /* BODEN */
    bb.kisteTaste(); bb.tuAktion('level',Z); bb.tuAktion('level',Z);
    const nb=bb.floorBoxes.length; bb.dropBox();
    const fb=bb.floorBoxes[bb.floorBoxes.length-1];
    f(bb.floorBoxes.length===nb+1&&fb.kiste&&fb.count===2,'BODEN: abgestellt keine Kiste mit 2 Stueck');
    bb.pickUp(fb);
    f(S.carrying&&S.carrying.kiste&&S.carrying.count===2&&S.carrying.raus===false,'BODEN: aufgehoben '+JSON.stringify(S.carrying));
    /* LAGER: Kiste ins Lagerregal und zurueck */
    let n=0; while(bb.racks.length<1&&bb.regalStellen('rack')&&n++<3);
    const sl=bb.racks.length&&bb.racks[0].slots.find(x=>!x.box);
    if(sl){ bb.tuAktion('rslot',sl); f(sl.box&&sl.box.kiste&&!S.carrying,'LAGER: im Lagerregal keine Kiste '+JSON.stringify(sl.box&&{k:sl.box.kiste,n:sl.box.count}));
      bb.tuAktion('rslot',sl); f(!sl.box&&S.carrying&&S.carrying.kiste&&S.carrying.count===2,'LAGER: aus dem Lagerregal '+JSON.stringify(S.carrying)); }
    else o.m.push('LAGER: kein Lagerregal aufstellbar');
    /* SPEICHER vorbereiten: Kiste mit 2 in der Hand, Vorrat 4 */
    bb.save(); const d=JSON.parse(localStorage.getItem('boellerbude_v3'));
    f(d.kisten===4&&d.carrying&&d.carrying.kiste,'SPEICHER: gespeichert '+JSON.stringify({k:d.kisten,c:d.carrying}));
    o.info.t=t; return o; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:60000});
  const r2=await p.evaluate(()=>{ const S=window.__bb.S; return {k:S.kisten,c:S.carrying}; });
  if(!(r2.k===4&&r2.c&&r2.c.kiste&&r2.c.count===2)) r.m.push('SPEICHER: geladen '+JSON.stringify(r2));
  console.log('Sorte',r.info.t,'| Hinweis:',r.info.prompt);
  console.log('ERRORS:',r.m.concat(errs).join(' | ')||'keine'); await b.close();
})();

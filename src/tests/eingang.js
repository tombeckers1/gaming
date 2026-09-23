/* Zweiter Eingang: vor dem Kauf eine feste Scheibe, danach eine
   zweite Schiebetuer mit eigener Kassenzeile - und Kunden, die
   beide Tueren benutzen. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  let bad=0;
  const sag=(t,ok)=>{ console.log(`${t}: ${ok?'ok':'FEHLER'}`); if(!ok) bad++; };

  const vor=await p.evaluate(()=>{
    const bb=window.__bb;
    const sicht=o=>{ for(let a=o;a;a=a.parent) if(!a.visible) return false; return true; };
    return {x:bb.EING2.x, tueren:bb.TUEREN.length,
      zweiteSichtbar:bb.EING2.tuer?sicht(bb.EING2.tuer.g):null,
      eing:bb.eingaenge().length, lanes:bb.sbLanes.length, offen:bb.sbOffen()};
  });
  sag('Eingangsachse im Grundriss ('+vor.x+')',typeof vor.x==='number');
  sag('zwei Tuerobjekte gebaut',vor.tueren===2);
  sag('zweite Tuer vor dem Kauf unsichtbar',vor.zweiteSichtbar===false);
  sag('vor dem Kauf nur ein Eingang',vor.eing===1);
  sag('vor dem Kauf keine SB-Spur offen',vor.offen===0);

  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=5e6;
    ['shop_halb','shop_gross','shop_ost','eingang2'].forEach(id=>bb.testKauf(id)); });
  /* Vor die Tuer stellen und ein paar Bilder laufen lassen, damit
     der Bewegungsmelder anspricht - die Tuer geht im Loop auf. */
  await p.evaluate(()=>window.__bb.setView(window.__bb.EING2.x,4.6,0,0));
  await p.waitForTimeout(6000);
  const nach=await p.evaluate(()=>{
    const bb=window.__bb;
    const sicht=o=>{ for(let a=o;a;a=a.parent) if(!a.visible) return false; return true; };
    const z=bb.ZONEN.eingang2;
    let wand=0; z.wand.forEach(o=>{ if(sicht(o)) wand++; });
    /* Kommt man durch die Tuer nach draussen? Schrittweise laufen,
       nicht springen - wer sich an die Zielkoordinate setzt, wird
       von der Kollision einfach auf die andere Seite geschoben und
       der Test wird gruen, obwohl die Wand zu ist. */
    let durch=false, cur={x:bb.EING2.x,z:4.6};
    for(let i=0;i<60;i++){
      const r=bb.schiebe(cur.x,cur.z+0.06);
      if(Math.abs(r.z-cur.z)<0.005) break;      /* steht an */
      cur=r; if(cur.z>7.0){ durch=true; break; }
    }
    return {eing:bb.eingaenge().length, offen:bb.sbOffen(), wand,
      tuerAuf:+bb.EING2.tuer.t.toFixed(2), halt:+cur.z.toFixed(2),
      tuerSichtbar:sicht(bb.EING2.tuer.g), sb2:!!bb.sb2G, durch};
  });
  sag('nach dem Kauf zwei Eingaenge',nach.eing===2);
  sag('zweite Tuer sichtbar',nach.tuerSichtbar===true);
  sag('feste Scheibe verschwunden',nach.wand===0);
  sag('zweite Kassenzeile steht',nach.sb2===true);
  sag('zwei SB-Spuren offen',nach.offen===2);
  /* Ab 0,3 faellt der Kollisionsquader - das ist die Schwelle, auf
     die es ankommt. Wie weit die Fluegel in den paar Bildern des
     Tests darueber hinaus fahren, haengt an der Bildrate. */
  sag(`Tuer geht auf (t=${nach.tuerAuf})`,nach.tuerAuf>0.3);
  sag(`Tuer laesst durch (bis z=${nach.halt})`,nach.durch===true);

  /* Kunden verteilen sich auf beide Tueren */
  const wahl=await p.evaluate(()=>{
    const bb=window.__bb, n={a:0,b:0};
    for(let i=0;i<200;i++){ const e=bb.eingaenge(); const pickx=e[(Math.random()*e.length)|0];
      if(pickx===0) n.a++; else n.b++; }
    return n;
  });
  sag(`beide Tueren werden gewaehlt (${wahl.a}/${wahl.b})`,wahl.a>40&&wahl.b>40);

  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):(bad?`ERRORS: ${bad} Punkte`:'ERRORS: keine'));
  await b.close();
})();

/* Essen und Getraenke als eigene Kategorie (Tom, 26.09.):
   - ZUORDNUNG: jede Ware in genau einer Sparte (F1, F2, Zubehoer,
     Essen, Getraenke); Essen und Getraenke bleiben kein Feuerwerk
     (keine Station, kein Zuenden); Raclette-Paket ist Essen, das
     Raclette-Geraet bleibt Zubehoer
   - ETIKETT: Bestellkarte zeigt "Essen" / "Getränke"
   - FILTER: der Filter im Laptop zeigt nur die gewaehlte Sparte
   - REGAL: ein Kuehlschrank voller Getraenke bekommt das Schild
     GETRAENKE, nicht mehr SILVESTER-ZUBEHOER
   - GRUPPE: Essen zaehlt als Essen, Getraenke als Getraenke - nichts
     davon mehr als Zubehoer; die Partykiste enthaelt kein Essen
   - ERFOLG: es gibt einen Verkaufserfolg fuer Essen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:30000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1200,height:760}}); p.setDefaultTimeout(120000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, P=bb.P, o={};
    S.level=40; S.money=1e7; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    const SP=bb.SPARTE;
    o.anzahl={essen:SP.essen.length,getraenke:SP.getraenke.length};
    o.fehlt=SP.essen.concat(SP.getraenke).filter(t=>!P[t]);
    o.doppelt=SP.essen.filter(t=>SP.getraenke.includes(t));
    o.pyro=SP.essen.concat(SP.getraenke).filter(t=>P[t]&&(P[t].cat!==0||bb.stationOf(t)!==null));
    o.falsch=SP.essen.filter(t=>bb.sparteVon(t)!=='essen').concat(SP.getraenke.filter(t=>bb.sparteVon(t)!=='getraenke'));
    o.raclette={paket:bb.sparteVon('racletteessen'),geraet:bb.sparteVon('raclettegeraet'),sekt:bb.sparteVon('sekt'),boeller:bb.sparteVon('boeller'),wunder:bb.sparteVon('wunder')};
    /* jede Ware hat genau eine gueltige Sparte */
    o.ohne=bb.ORDER.filter(t=>!['f1','f2','zubehoer','essen','getraenke'].includes(bb.sparteVon(t)));
    /* Etikett */
    const tx=h=>{ const d=document.createElement('div'); d.innerHTML=h; return d.textContent; };
    o.etikett={essen:tx(bb.catPill(P.heringssalat)),getraenke:tx(bb.catPill(P.bier)),f2:tx(bb.catPill(P.boeller)),zub:tx(bb.catPill(P.feuerzeug))};
    /* Filter */
    bb.lsup='ware'; const fil={};
    for(const k of ['alle','essen','getraenke','f1']){ bb.lkat=k; bb.openLaptop('order');
      const K=[...document.querySelectorAll('#lbody .karte')];
      fil[k]={n:K.length,etiketten:[...new Set(K.map(x=>{ const pl=x.querySelector('.pill'); return pl?pl.textContent:''; }))]}; }
    bb.lkat='alle'; o.filter=fil;
    o.sollEssen=bb.ORDER.filter(t=>!P[t].noOrder&&bb.sparteVon(t)==='essen').length;
    /* Regalschild: Kuehlschrank voller Getraenke */
    bb.testKauf('REGAL:kuehl'); const kuehl=bb.shelves[bb.shelves.length-1];
    kuehl.levels.forEach((lv,i)=>{ const t=['bier','cola','sekt','champagner'][i%4]; while(bb.addToLevel(lv,t,1)); });
    o.schildKuehl=bb.headArt(kuehl);
    bb.testKauf('REGAL:standard'); const std=bb.shelves[bb.shelves.length-1];
    std.levels.forEach((lv,i)=>{ const t=['popcorn','salzstangen','chips','erdnuesse'][i%4]; while(bb.addToLevel(lv,t,1)); });
    o.schildEssen=bb.headArt(std);
    /* Gruppen */
    o.gruppeFalsch=SP.essen.filter(t=>bb.gruppeVon(t)!=='essen').concat(SP.getraenke.filter(t=>bb.gruppeVon(t)!=='sekt'));
    o.imZubehoer=(bb.GRUPPE.zubehoer||[]).filter(t=>SP.essen.includes(t)||SP.getraenke.includes(t));
    let essenInKiste=0; for(let i=0;i<200;i++) essenInKiste+=bb.packContents(8,'zubehoer').filter(t=>bb.sparteVon(t)!=='zubehoer').length;
    o.essenInKiste=essenInKiste;
    o.erfolg=!!bb.ERFOLGE.find(e=>e.id==='v_essen');
    return o; });
  console.log('ANZAHL  ',JSON.stringify(r.anzahl),'RACLETTE',JSON.stringify(r.raclette));
  console.log('ETIKETT ',JSON.stringify(r.etikett));
  console.log('FILTER  ',JSON.stringify(r.filter),'soll Essen',r.sollEssen);
  console.log('SCHILD  kuehl',r.schildKuehl,'essen',r.schildEssen,'| GRUPPE falsch',JSON.stringify(r.gruppeFalsch),'im Zubehoer',JSON.stringify(r.imZubehoer),'Kiste',r.essenInKiste,'| Erfolg',r.erfolg);
  pruef('ZUORDNUNG',!r.fehlt.length&&!r.doppelt.length&&!r.falsch.length&&!r.ohne.length,JSON.stringify({fehlt:r.fehlt,doppelt:r.doppelt,falsch:r.falsch,ohne:r.ohne}));
  pruef('ZUORDNUNG',r.anzahl.essen>=35&&r.anzahl.getraenke>=28,'zu wenig: '+JSON.stringify(r.anzahl));
  pruef('KEIN_FEUERWERK',!r.pyro.length,'Essen/Getraenke als Feuerwerk: '+r.pyro);
  pruef('ZUORDNUNG',r.raclette.paket==='essen'&&r.raclette.geraet==='zubehoer'&&r.raclette.sekt==='getraenke'&&r.raclette.boeller==='f2'&&r.raclette.wunder==='f1',JSON.stringify(r.raclette));
  pruef('ETIKETT',r.etikett.essen==='Essen'&&r.etikett.getraenke==='Getränke'&&r.etikett.f2==='F2'&&r.etikett.zub==='Zubehör',JSON.stringify(r.etikett));
  pruef('FILTER',r.filter.essen.n===r.sollEssen&&JSON.stringify(r.filter.essen.etiketten)==='["Essen"]'&&JSON.stringify(r.filter.getraenke.etiketten)==='["Getränke"]'&&JSON.stringify(r.filter.f1.etiketten)==='["F1"]'&&r.filter.alle.n>r.filter.essen.n+r.filter.getraenke.n,JSON.stringify(r.filter));
  pruef('REGAL',r.schildKuehl==='getraenke'&&r.schildEssen==='essen','Schilder: '+r.schildKuehl+' / '+r.schildEssen);
  pruef('GRUPPE',!r.gruppeFalsch.length&&!r.imZubehoer.length&&r.essenInKiste===0,JSON.stringify({falsch:r.gruppeFalsch,zub:r.imZubehoer,kiste:r.essenInKiste}));
  pruef('ERFOLG',r.erfolg,'kein Erfolg fuer Essen');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

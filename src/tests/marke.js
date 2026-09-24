/* Herausforderungen und eigene Rezeptur */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1460,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ const x=m.text(); if(m.type()==='error'&&x.indexOf('ERR_')<0) errs.push('CONSOLE: '+x); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);

  /* --- Herausforderungen: Gating und Zaehler --- */
  const erf=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.gesamt=bb.ERFOLGE.length;
    o.stufenGesamt=bb.erfGesamt();
    o.amStartOffen=bb.ERFOLGE.filter(e=>bb.erfOffen(e)).map(e=>e.id);
    o.amStartZu=bb.ERFOLGE.filter(e=>!bb.erfOffen(e)).length;
    /* Kein Erfolg darf eine Streak- oder Negativbedingung haben */
    o.keineStreaks=bb.ERFOLGE.every(e=>Array.isArray(e.stufen)&&e.stufen.every((v,i)=>i===0||v>e.stufen[i-1]));
    o.lohnSteigt=bb.ERFOLGE.every(e=>e.lohn.every((v,i)=>i===0||v>e.lohn[i-1]));
    o.lohnPasstZuStufen=bb.ERFOLGE.every(e=>e.lohn.length===e.stufen.length);
    /* Zaehler laeuft und schuettet aus */
    const g0=bb.S.money;
    for(let i=0;i<100;i++) bb.statVerkauf('boeller',1);
    o.boellerStand=bb.stat('v_boeller');
    o.stufeErreicht=bb.erfStufe(bb.ERFOLGE.find(e=>e.id==='v_boeller'));
    o.geldKam=bb.S.money>g0;
    /* Zaehler faellt nie */
    bb.statVerkauf('boeller',1);
    o.faelltNie=bb.stat('v_boeller')===101;
    /* Rekord nur nach oben */
    bb.statRekord('rek_tag',900); bb.statRekord('rek_tag',400);
    o.rekordBleibt=bb.stat('rek_tag')===900;
    /* Gesperrtes zaehlt nicht aus */
    const pk=bb.ERFOLGE.find(e=>e.id==='pakete');
    o.paketeZu=!bb.erfOffen(pk);
    bb.statAdd('pakete',9999);
    o.gesperrtKeineStufe=bb.erfStufe(pk)===0;
    bb.S.up.packstation=true;
    o.paketeOffenNachFreischaltung=bb.erfOffen(pk);
    return o;
  });
  console.log('ERFOLGE',JSON.stringify(erf));

  /* --- Bruchbilder muss man erst gesehen haben --- */
  const seh=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.S.gesehen.length=0;
    o.amAnfangKeine=bb.bruchListe().length===0;
    bb.bruchGesehen('kugel'); bb.bruchGesehen('kamuro'); bb.bruchGesehen('kugel');
    o.nachZwei=bb.bruchListe().length;
    o.keineDoppel=bb.S.gesehen.length===2;
    /* Zuenden traegt automatisch ein */
    bb.S.level=30; bb.S.money=400000; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    bb.igniteType('raketen'); bb.run(14,0.05);
    o.nachZuenden=bb.bruchListe().length;
    o.waechstDurchSpielen=o.nachZuenden>o.nachZwei;
    /* nur echte Bruchbilder, kein Muell */
    o.alleGueltig=bb.S.gesehen.every(e=>!!bb.BRUCH[e]);
    return o;
  });
  console.log('GESEHEN',JSON.stringify(seh));

  /* --- Die Formel darf nicht ausnutzbar sein --- */
  const form=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.BRUCH_IDS.forEach(e=>bb.bruchGesehen(e));
    const bau=(traeger,eff,A,B,eff2)=>({traeger,eff,A:A||'gold',B:B||'blau',eff2:eff2||null,etikett:'klassik',name:'X'});
    /* Marge muss ueber alle Kombinationen gesund bleiben */
    let minM=9, maxM=0, minP=1e9, maxP=0, ungueltig=0;
    bb.TRAEGER.forEach(t=>bb.BRUCH_IDS.forEach(e=>{
      const r=bau(t.id,e);
      const k=bb.rezeptKosten(r), m=bb.rezeptMarkt(r);
      if(!(k>0)||!(m>k)) ungueltig++;
      const marge=m/k; minM=Math.min(minM,marge); maxM=Math.max(maxM,marge);
      minP=Math.min(minP,m); maxP=Math.max(maxP,m);
    }));
    o.ungueltigeKombis=ungueltig;
    o.margeVon=+minM.toFixed(2); o.margeBis=+maxM.toFixed(2);
    o.preisVon=+minP.toFixed(2); o.preisBis=+maxP.toFixed(2);
    /* Teure Bruchbilder muessen auch teurer sein */
    const billig=bau('rakete3','kugel'), teuer=bau('rakete3','zeitregen');
    o.teuresKostetMehr=bb.rezeptKosten(teuer)>bb.rezeptKosten(billig);
    o.teuresBringtMehr=bb.rezeptMarkt(teuer)>bb.rezeptMarkt(billig);
    /* Zweite Stufe kostet und bringt */
    const s2=bau('rakete3','kugel',null,null,'kamuro');
    o.zweiteStufeKostet=bb.rezeptKosten(s2)>bb.rezeptKosten(billig);
    o.zweiteStufeBringt=bb.rezeptMarkt(s2)>bb.rezeptMarkt(billig);
    /* Vergleich mit der Kaufware: die eigene Marke darf nicht absurd sein */
    const kaufMargen=['raketenklein','raketen','knatter','kugel75','fontaene']
      .map(t=>+(bb.P[t].market/bb.P[t].cost).toFixed(2));
    o.kaufwareMargen=kaufMargen;
    return o;
  });
  console.log('FORMEL',JSON.stringify(form));

  /* --- Entwicklung durchspielen --- */
  const dev=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.ohneLaborGesperrt=bb.renderRezeptur().indexOf('Entwicklungslabor')>=0&&!bb.S.up.labor;
    bb.S.up.labor=true; bb.S.up.labor2=true; bb.S.level=30; bb.S.money=300000;
    bb.entwurf=null; bb.entwurfInit();
    bb.entwurf.traeger='kugel100'; bb.entwurf.eff='kamuro'; bb.entwurf.eff2='salut';
    bb.entwurf.A='violett'; bb.entwurf.B='gold'; bb.entwurf.name='Nordlicht';
    const g0=bb.S.money;
    bb.rezBauen();
    o.kostetGeld=bb.S.money<g0;
    o.inEntwicklung=bb.eigeneListe().filter(e=>!e.fertig).length;
    o.nochNichtImKatalog=bb.ORDER.filter(t=>bb.P[t].eigen).length===0;
    /* Tage vergehen lassen */
    for(let d=0;d<8;d++) bb.rezepteTick();
    const e=bb.eigeneListe()[0];
    o.fertig=!!e.fertig;
    o.imKatalog=!!bb.P[e.id];
    o.inORDER=bb.ORDER.indexOf(e.id)>=0;
    o.hatPreis=bb.S.prices[e.id]>0;
    o.marktIndex=typeof bb.S.mi[e.id]==='number';
    o.name=bb.P[e.id]?bb.P[e.id].name:null;
    o.station=bb.stationOf(e.id);
    /* Regalplatz und Bestellbarkeit */
    for(let i=0;i<4;i++) bb.regalStellen('standard');
    o.regalPlatz=bb.shelfCapOf(e.id);
    o.einraeumbar=!!bb.emptyLevel(e.id);
    bb.cartClear(); bb.cartAdd(e.id,1,'mertens');
    o.bestellbar=bb.cartBoxes()>0;
    bb.cartClear();
    /* zuenden */
    const leben=()=>{ let n=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let i=0;i<ps.life.length;i++) if(ps.life[i]>0) n++; return n; };
    bb.run(10,0.05);
    const v0=leben(); bb.igniteType(e.id); bb.run(4,0.05);
    o.zuendetPartikel=leben()-v0;
    bb.run(16,0.05);
    /* Verkauf zaehlt auf die eigene Marke */
    const st0=bb.stat('v_eigene');
    bb.statVerkauf(e.id,3);
    o.zaehltAlsEigene=bb.stat('v_eigene')-st0===3;
    return o;
  });
  console.log('ENTWICKLUNG',JSON.stringify(dev));

  /* --- Masken --- */
  await p.evaluate(()=>window.__bb.openLaptop());
  const ui=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    /* Ziele liegen seit dem 24.09. auf dem Handy, der Rest am Laptop */
    const klick=t=>{ if(bb.HANDY_APPS.some(a=>a.id===t)) bb.openHandy(t); else { if(!bb.handyOpen&&!document.querySelector('#laptop.show')) bb.openLaptop(); if(bb.handyOpen){ bb.closeHandy(false); bb.openLaptop(); } document.querySelector(`#ltabs button[data-tab="${t}"]`).click(); } };
    o.tabs=[...document.querySelectorAll('#ltabs button')].map(x=>x.dataset.tab);
    klick('erf');
    o.erfZeilen=document.querySelectorAll('#hApp .row').length;
    o.erfBalken=document.querySelectorAll('#hApp .erfbar').length;
    o.erfBilder=document.querySelectorAll('#hApp img.pic').length;
    klick('rez');
    o.rezFelder=document.querySelectorAll('#lbody .rezfeld').length;
    o.farbknoepfe=document.querySelectorAll('#lbody .farbw button').length;
    o.vorschau=!!document.querySelector('#lbody .rezr img');
    o.protoKnopf=!!document.querySelector('#lbody button[data-a="rzproto"]');
    /* Auswahl umschalten */
    const bt=document.querySelector('#lbody button[data-a="rz"][data-f="A"][data-v="magenta"]');
    if(bt) bt.click();
    o.farbeGesetzt=bb.entwurf.A==='magenta';
    return o;
  });
  console.log('MASKE',JSON.stringify(ui));
  await p.screenshot({path:process.argv[3]||'/tmp/claude-0/marke.png'});
  await p.evaluate(()=>window.__bb.openHandy('erf'));
  await p.screenshot({path:(process.argv[3]||'/tmp/claude-0/marke.png').replace('.png','-erf.png')});

  /* --- Speichern und laden --- */
  await p.evaluate(()=>{ window.__bb.closeHandy(false); window.__bb.closeLaptop(false); window.__bb.save(); });
  await p.reload();
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const sv=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const e=bb.eigeneListe()[0];
    o.eigene=bb.eigeneListe().length;
    o.wiederImKatalog=!!(e&&bb.P[e.id]);
    o.wiederInORDER=!!(e&&bb.ORDER.indexOf(e.id)>=0);
    o.poolDa=!!(e&&bb.pools[e.id]);
    o.gesehen=bb.S.gesehen.length;
    o.zaehler=bb.stat('v_boeller');
    o.stufen=bb.erfGeschafft();
    o.gutschrift=bb.S.gutschrift||0;
    return o;
  });
  console.log('SPEICHERN',JSON.stringify(sv));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

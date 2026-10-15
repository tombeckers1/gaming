/* Produktion im Werk West (15.10.): Bestellen -> Lieferung an R6 -> Produktion -> Hochregal -> Bestand wie Kaufware,
   Kosten/Ausschuss plausibel, Straße steht ohne Rohstoffe (Werker kostet weiter), Stoerung + Freigabe, Kugelbomben trocknen,
   Kapazitaet der Chemie-Boxen, Fixkosten erst ab Produktion, Tagesabschluss, Laptop/Leitstand, Speichern.
   Logik-Test fuer test.html (three-Stub, schnell): node -r ./ladezeit-preload.js produktion.js test.html
   GEGENPROBE=1: Rohstoffverbrauch abgeschaltet (Rezept leer) -> der Test muss anschlagen. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:640}}); p.setDefaultTimeout(300000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message+' '+(e.stack||'').split('\n')[1]));
  const H=require('../../tools/test/start-hilfe.js');
  await H.laden(p,process.argv[2]);
  await H.neuesSpiel(p,{stoppen:true});
  const mangel=[]; const M=(ok,t)=>{ if(!ok) mangel.push(t); };
  const GEGEN=!!process.env.GEGENPROBE;

  /* 1) Werk kaufen: ohne eingeschaltete Straße keine Werk-Fixkosten */
  const a=await p.evaluate((GEGEN)=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=40; S.money=900000; S.lic=bb.LIZENZEN.map(l=>l.id); S.up.tag4=true;   /* auch sonntags offen */
    ['lager','lager_nord','lager_gross','lager_sued','lager_sued2','lager_west','lager_west2','lager_west3','rampe2','rampe3','rampe4','rampe5','lagerlogistik','fabrik','testfeld'].forEach(id=>bb.testKauf(id));
    bb.run(1,0.05);
    if(GEGEN){ const R=bb.pdRezept('raketen'); for(const k in R.kg) R.kg[k]=0; }
    o.offen=bb.wkOffen(); o.fix0=bb.fixedCosts(); o.grund=bb.pdGrund(0);
    o.produkte=bb.pdProdukte(0).length; o.kugel=bb.pdProdukte(1).length; o.batt=bb.pdProdukte(2).length;
    o.rez=bb.pdRezept('raketen'); o.band=bb.ORDER.filter(t=>bb.pdKlasse(t)>=0&&!bb.P[t].noOrder&&!bb.P[t].rezept).map(t=>{ const r=bb.pdRezept(t); return Math.round(r.kosten/bb.P[t].cost*1000)/1000; });
    /* Personal: Werker 1 + Mischer (Team-Tab: hire) - ohne Figur im Wegenetz */
    for(const id of ['mischer','werker1']){ bb.ltab='staff'; const s=bb.STAFF?null:null; S.staff[id]=true; bb.hireStaff(id); }
    o.figur=!!bb.staff.werker1; o.lohn=bb.dailyWages();
    return o; },GEGEN);
  console.log('KAUF',JSON.stringify(Object.assign({},a,{band:undefined,rez:{nem:a.rez.nem,takt:a.rez.takt,kosten:a.rez.kosten,anteil:a.rez.anteil}})));
  M(a.offen,'Werk nicht offen');
  M(a.grund==='ausgeschaltet','Straße 1 sollte ausgeschaltet sein: '+a.grund);
  M(a.produkte>=15&&a.kugel>=15&&a.batt>=30,'herstellbare Produkte je Klasse (Raketen/Kugel/Batterie): '+[a.produkte,a.kugel,a.batt]);
  M(a.band.every(x=>x>=0.449&&x<=0.601)||GEGEN,'variable Kosten ausserhalb 45-60 % vom Einkauf: '+a.band.filter(x=>x<0.449||x>0.601).join(','));
  M(!a.figur,'Werker darf keine Figur im Wegenetz anlegen');

  /* 2) Rohstoffe bestellen: Preis, Kapazitaetsgrenze, Lieferung naechster Tag an R6 */
  const c=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, W=bb.WIRT||window.__wirt.WIRT, o={};
    const g0=S.money;
    o.ok=['huelsen','oxidator','metall','schwarzpulver'].map(r=>bb.pdBestellen(r,false,2));
    const R=W.produktion.roh; o.erwartet=Object.keys(R).reduce((s,r)=>s+R[r].gebinde*2*R[r].preis,0)+W.produktion.lieferpauschale;
    o.bezahlt=Math.round((g0-S.money)*100)/100;
    o.zuviel=bb.pdBestellen('metall',false,50);           /* Chemie-Box Metall: Grenze */
    o.premium=bb.pdBestellen('oxidator',true,1);
    o.unterwegs=bb.pdDaten().bestellt.length; o.lagerVor=bb.pdDaten().lager.huelsen.std;
    /* heute kein LKW */
    bb.openShopTest=true; return o; });
  console.log('BESTELLEN',JSON.stringify(c));
  M(c.ok.every(Boolean)&&Math.abs(c.bezahlt-c.erwartet)<0.6,'Bestellung/Preis falsch: '+JSON.stringify(c));
  M(!c.zuviel,'Kapazitaetsgrenze der Chemie-Box greift nicht');
  M(c.premium&&c.unterwegs===5&&c.lagerVor===0,'Bestellung unterwegs falsch');

  /* naechster Tag: Laden auf, LKW an R6, Ware im Lager */
  const d=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.day++; bb.pdNeuerTag(); bb.newDayStatsTest&&0; bb.openShop(); bb.run(0.5,0.05); o.lkw=!!bb.pdLkw;
    for(let i=0;i<80&&bb.pdLkw;i++) bb.run(0.5,0.05);
    const D=bb.pdDaten(); o.lager=Object.fromEntries(Object.entries(D.lager).map(([k,v])=>[k,v.std+v.pre])); o.unterwegs=D.bestellt.length; o.lkwWeg=!bb.pdLkw; return o; });
  console.log('LIEFERUNG',JSON.stringify(d));
  M(d.lkw&&d.lkwWeg,'Gefahrgut-LKW an R6 kam nicht oder fuhr nicht ab');
  M(d.lager.huelsen===200&&d.lager.oxidator===75&&d.unterwegs===0,'Rohstoffe nicht eingelagert: '+JSON.stringify(d.lager));

  /* 3) Plan + Produktion: Raketen, laeuft im offenen Laden, Paletten ins Hochregal (Gasse 2), Merkmal Eigenproduktion */
  const e=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={}, D=bb.pdDaten(), t='raketen';
    o.fixAus=bb.fixedCosts();
    bb.pdKlick('pdadd',{i:'0',t,v:'16'}); bb.pdKlick('pdan',{i:'0'});
    o.fixAn=bb.fixedCosts(); o.laeuft=bb.pdLaeuft(0);
    const st0=bb.stockOf(t), hr0=bb.hrStock(t), roh0=JSON.stringify(D.lager);
    for(let i=0;i<300;i++){ bb.run(1,0.05); D.s[0].stoer&&D.s[0].stoer.art==='zelle'&&bb.pdBeheben(0,'hand'); }
    const s=D.s[0]; o.stk=s.heute.stk; o.aus=s.heute.aus; o.kosten=s.heute.kosten; o.qs=(D.qs||[]).length; o.erf=s.erf;
    o.rezKosten=bb.pdRezept(t).kosten; o.ek=bb.costOf(t);
    o.hr=bb.hrStock(t)-hr0; o.stock=bb.stockOf(t)-st0;
    let e1=0, gasse=[0,0,0]; S.hr.p.forEach((pl,j)=>{ if(pl) pl.forEach(x=>{ if(x.e){ e1+=x.c; gasse[Math.floor(j/180)]++; } }); }); o.eigen=e1; o.gasse=gasse;
    o.anim=bb.WK.zustand[0].laeuft; o.produktion=bb.WK.produktion; o.vsBestand=bb.vsBestand?bb.vsBestand(t):null;
    o.lagerNach=JSON.stringify(D.lager)!==roh0;
    return o; });
  console.log('PRODUKTION',JSON.stringify(e));
  M(e.laeuft&&e.produktion,'Straße laeuft nicht nach Einschalten');
  M(Math.round(e.fixAn-e.fixAus)===75,'Fixkosten nach Einschalten: Werk 45 + Straße 30 erwartet, ist '+(e.fixAn-e.fixAus));
  M(e.stk>=20,'zu wenig produziert: '+e.stk);
  M(e.lagerNach,'Rohstoffe wurden nicht verbraucht');
  { const r=e.aus/(e.stk+e.aus); M(r<=0.3,'Ausschuss unplausibel: '+r); }
  { const je=e.kosten/(e.stk+e.aus+1); M(Math.abs(je-e.rezKosten)/e.rezKosten<0.05,'Rohstoffkosten je Stueck '+je+' statt '+e.rezKosten); M(e.rezKosten/e.ek>0.4&&e.rezKosten/e.ek<0.65,'variable Kosten nicht ~45-60 % vom Einkauf: '+e.rezKosten/e.ek); }
  M(e.eigen>0&&e.gasse[1]>0,'keine Eigenproduktion in Gasse 2 des Hochregals: '+JSON.stringify(e.gasse));
  M(e.hr===e.eigen&&e.stock>=e.eigen,'Eigenproduktion zaehlt nicht im Bestand (stockOf/hrStock)');
  M(e.qs===1,'QS-Stichprobe nicht genau einmal am Tag: '+e.qs);

  /* 4) Rohstoffe aus: Straße steht, Werker kostet weiter; Stoerung + Freigabe am Leitstand/Station */
  const f=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={}, D=bb.pdDaten();
    /* neuer Tag (Laden wieder offen), neuer Auftrag */
    S.day++; bb.pdNeuerTag(); bb.phase='closed'; bb.clock=480; bb.openShop(); bb.pdKlick('pdadd',{i:'0',t:'raketen',v:'40'});
    const lohn0=bb.dailyWages(); for(const r in D.lager){ D.lager[r].std=0; D.lager[r].pre=0; }
    const stk0=D.s[0].heute.stk+D.s[0].heute.aus; for(let i=0;i<20;i++) bb.run(1,0.05);
    o.grund=bb.pdGrund(0); o.steht=!bb.pdLaeuft(0)&&!bb.WK.zustand[0].laeuft; o.mehr=D.s[0].heute.stk+D.s[0].heute.aus-stk0; o.lohn=bb.dailyWages()===lohn0&&lohn0>0;
    o.fix=bb.fixedCosts();
    /* Rohstoffe wieder da -> Straße laeuft; dann Stoerung */
    D.lager.huelsen.std=100; D.lager.oxidator.std=50; D.lager.metall.std=20; D.lager.schwarzpulver.std=50; bb.run(1,0.05); o.wieder=bb.pdLaeuft(0);
    D.s[0].stoer={art:'zelle',st:'R2',j:1,t:0}; bb.run(0.5,0.05); o.stoerSteht=!bb.pdLaeuft(0);
    bb.setView(-85,-12.5,Math.PI/2,0); bb.kameraSetzen&&bb.kameraSetzen(); bb.renderFrame(0.016);
    o.hit=bb.pdHits().some(h=>h.userData.kind==='pdstoer'); o.prompt=bb.pdPrompt({kind:'pdstoer',ref:0}).t;
    bb.pdAktion({kind:'pdstoer',ref:0}); o.frei=!D.s[0].stoer&&bb.pdLaeuft(0);
    /* Laptop im Leitstand */
    bb.openLaptop('prod','leitstand'); o.leitstand=bb.lapGeraet==='leitstand'&&document.getElementById('lbody').innerHTML.indexOf('Straße 1')>=0&&document.getElementById('lbody').innerHTML.indexOf('Rohstoffe')>=0;
    bb.closeLaptop(false);
    return o; });
  console.log('STEHT',JSON.stringify(f));
  M(f.steht&&f.grund.indexOf('Rohstoff fehlt')===0&&f.mehr===0,'ohne Rohstoffe laeuft die Straße weiter: '+JSON.stringify(f));
  M(f.lohn,'Werker-Lohn muss weiterlaufen');
  M(f.wieder,'Straße laeuft nach Lieferung nicht wieder an');
  M(f.stoerSteht&&f.hit&&f.frei,'Stoerung/Freigabe an der Station: '+JSON.stringify(f));
  M(f.leitstand,'Leitstand-Laptop zeigt die Produktion nicht');

  /* 5) Kugelbomben: Trocknung bis zum naechsten Tag; Tagesabschluss; Speichern */
  const g=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={}, D=bb.pdDaten();
    bb.testKauf('fabrik2'); bb.run(1,0.05); S.staff.werker2=true; bb.hireStaff('werker2');
    S.day++; bb.pdNeuerTag(); bb.phase='closed'; bb.clock=480; bb.openShop();
    for(const r in D.lager){ D.lager[r].std=150; }
    const t=bb.pdProdukte(1)[0]; o.t=t; bb.pdKlick('pdadd',{i:'1',t,v:'8'}); bb.pdKlick('pdan',{i:'1'});
    for(let i=0;i<240&&!D.trocken.length;i++){ bb.run(1,0.05); if(D.s[1].stoer&&D.s[1].stoer.art==='zelle') bb.pdBeheben(1,'hand'); }
    o.trocken=D.trocken.length; o.ausHeute=D.aus[1].length;
    o.rows=bb.pdTagesabschluss().map(r=>Array.isArray(r)?r[0]:r.head);
    S.day++; bb.pdNeuerTag(); o.ausMorgen=D.aus[1].length; o.trockenMorgen=D.trocken.length; o.erf=D.s[0].erf;
    bb.save(); const sv=JSON.parse(localStorage.getItem('boellerbude_v3')||localStorage.getItem(Object.keys(localStorage).find(k=>k.indexOf('gp')<0)||'')||'{}'); o.gespeichert=!!(sv.pd&&sv.pd.s&&sv.pd.s[0].plan);
    return o; });
  console.log('KUGEL',JSON.stringify(g));
  M(g.trocken>=1&&g.ausHeute===0,'Kugelbomben gehen nicht in die Trockenkammer');
  M(g.ausMorgen>=1&&g.trockenMorgen===0,'Kugelbomben am naechsten Tag nicht fertig');
  M(g.rows.indexOf('Produktion (Werk West)')>=0&&g.rows.some(r=>String(r).indexOf('Straße 2')===0),'Tagesabschluss ohne Produktion: '+g.rows);
  M(g.erf>=1,'Werker-Erfahrung steigt nicht');
  M(g.gespeichert,'Produktion nicht im Spielstand');

  if(errs.length) console.log('ERRORS: '+errs.slice(0,6).join(' | '));
  console.log(mangel.length?'MANGEL: '+mangel.join(' | '):'ALLES OK');
  await b.close();
  process.exit(mangel.length||errs.length?1:0);
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

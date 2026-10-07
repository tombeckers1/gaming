/* Packmaterial und Versandkosten (Tom, 05.10.):
   - Kartons, Luftpolsterfolie und Klebeband im Regal neben dem Packtisch
     werden beim Packen verbraucht (Karton nach Paketgroesse), das Regal
     zeigt es; ohne passenden Karton wird nicht gepackt, Laptop/Handy
     sagen, was fehlt
   - Nachschub im Laptop kaufen: kommt mit dem LKW, der Einraeumer
     raeumt es ins Regal; der Spieler kann es auch selbst tragen
   - Versandkosten und Freigrenze wirken auf die Bestellzahl und auf die
     Einnahmen; das Porto an DDL geht fuer jedes Paket ab
   - Speicherstand: Bestand und Einstellung bleiben; ein alter Stand ohne
     beides laedt mit Erstausstattung und Standardwerten
   Braucht echtes three.js (real.html). Aufruf: node packmaterial.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:700}}); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_CERT/.test(m.text())) errs.push('CONSOLE '+m.text().slice(0,160)); });
  const neuesSpiel=async(weiter)=>{
    await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
    if(weiter){ await p.click('#startBtns button:first-child'); }
    else { await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo'); }
    await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
  };
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(false);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const hilfen=()=>p.evaluate(()=>{ const bb=window.__bb, S=bb.S;
    window.__auf=(pos,gr,versand)=>{ S.bestNr=(S.bestNr|0)+1; const x={id:S.bestNr,pos:pos.map(([t,n])=>({t,n,g:0})),gr:gr||bb.vsKlasse(pos.map(([t,n])=>({t,n}))),st:'offen',tag:S.day,versand:versand||0};
      x.wert=+pos.reduce((a,[t,n])=>a+n*Math.min(S.prices[t],bb.marketOf(t)*1.3),0).toFixed(2); S.bestellungen.push(x); S.offen=S.bestellungen.length; return x; };
    window.__lagern=(t,n)=>{ const s=bb.racks.flatMap(r=>r.slots).find(s=>!s.box); if(s) bb.putInSlot(s,t,n||bb.P[t].box,1); };
  });
  await hilfen();

  /* 1. Erstausstattung und Verbrauch beim Packen */
  const v=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=30; S.money=9e6; S.lic=bb.LIZENZEN.map(l=>l.id);
    ['shop_halb','lager','lager_nord','lager_gross','lager_sued','lager_sued2','packstation','onlineshop'].forEach(id=>bb.testKauf(id)); S.up.onlineshop=true;
    for(let i=0;i<4;i++) bb.regalStellen('rack');
    o.erst=JSON.stringify(bb.vmStand(0)); o.voll=bb.VM_IDS.every(id=>bb.vmStand(0)[id]===bb.VM[id].kap);
    window.__lagern('boeller'); window.__lagern('raketen'); window.__lagern('lb_goldader'); window.__lagern('lb_goldader');
    S.bestellungen=[];
    const R=bb.vmRegale[0], h0=R.stapel.ks.m.scale.y, v0=Object.assign({},bb.vmStand(0));
    window.__auf([['boeller',2]],1);
    o.packen=bb.vsSpielerPacken(0);
    for(let i=0;i<400&&(bb.vsTisch||bb.vsBahn.length);i++) bb.step(0.05);
    const v1=bb.vmStand(0);
    o.dKlein={ks:v0.ks-v1.ks,km:v0.km-v1.km,kl:v0.kl-v1.kl,folie:v0.folie-v1.folie,band:v0.band-v1.band};
    o.stapelKleiner=R.stapel.ks.m.scale.y<h0-1e-6;
    /* riesig: ein L-Karton, drei Folie, zwei Band */
    const v2=Object.assign({},bb.vmStand(0));
    window.__auf([['lb_goldader',1]],6); o.packen6=bb.packOne(true);
    const v3=bb.vmStand(0); o.dRiesig={ks:v2.ks-v3.ks,km:v2.km-v3.km,kl:v2.kl-v3.kl,folie:v2.folie-v3.folie,band:v2.band-v3.band};
    return o; });
  console.log('VERBRAUCH',JSON.stringify(v));
  pruef('ERSTAUSSTATTUNG',v.voll,'Regal beim Kauf nicht voll: '+v.erst);
  pruef('VERBRAUCH',v.packen&&v.dKlein.ks===1&&v.dKlein.km===0&&v.dKlein.kl===0&&v.dKlein.folie===1&&v.dKlein.band===1,'kleines Paket verbraucht falsch: '+JSON.stringify(v.dKlein));
  pruef('VERBRAUCH',v.packen6&&v.dRiesig.kl===1&&v.dRiesig.ks===0&&v.dRiesig.folie===3&&v.dRiesig.band===2,'riesiges Paket verbraucht falsch: '+JSON.stringify(v.dRiesig));
  pruef('REGAL',v.stapelKleiner,'der Kartonstapel im Regal wird nicht kleiner');

  /* 2. Ohne passenden Karton wird nicht gepackt - und man erfaehrt es */
  const ohne=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.bestellungen=[]; S.vm[0].km=0; bb.vmRegalZeichnen(0);
    window.__lagern('raketen');
    const x=window.__auf([['raketen',1]],3);
    o.spieler=bb.vsSpielerPacken(0); o.packOne=bb.packOne(true); o.plan=!!bb.vsPlan(0);
    o.prompt=(bb.promptFor({kind:'pack',ref:bb.packHit})||{}).t;
    o.warnung=bb.vmWarnung();
    /* der Onlineshop ist eine App im Handy */
    bb.openHandy('online'); const txt=document.getElementById('hApp').textContent;
    o.laptop=/Packmaterial/.test(txt)&&/Versandkarton M/.test(txt);
    bb.closeHandy(false); if(bb.pauseOpen) bb.closePause();
    o.offen=S.bestellungen.length; o.stapelWeg=!bb.vmRegale[0].stapel.km.m.visible;
    /* mit Karton geht es wieder */
    S.vm[0].km=5; o.danach=bb.packOne(true);
    return o; });
  console.log('OHNE KARTON',JSON.stringify(ohne));
  pruef('OHNE',!ohne.spieler&&!ohne.packOne&&!ohne.plan&&ohne.offen===1,'gepackt ohne passenden Karton: '+JSON.stringify(ohne));
  pruef('HINWEIS',/Karton M/.test(ohne.prompt||'')&&/Versandkarton M/.test(ohne.warnung)&&ohne.laptop,'kein Hinweis auf den fehlenden Karton: '+JSON.stringify({prompt:ohne.prompt,warnung:ohne.warnung,laptop:ohne.laptop}));
  pruef('HINWEIS',ohne.stapelWeg,'leeres Fach zeigt noch Kartons');
  pruef('OHNE',ohne.danach,'mit Karton wird wieder gepackt');

  /* 3. Nachschub: kaufen, LKW, Einraeumer raeumt ins Regal */
  const lkw=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    /* nur die Aufgabe Versandmaterial, damit nichts anderes dazwischenkommt */
    S.einr=S.einr||{}; S.einr.auffueller={reihe:['vm','direkt','lager','regal'],aus:{direkt:true,lager:true,regal:true}};
    S.staff.auffueller=true; bb.hireStaff('auffueller');
    S.vm[0].km=2; S.vm[0].folie=10; bb.vmRegalZeichnen(0);
    const geld=S.money;
    o.kauf=bb.vmBestellen('km',1)&&bb.vmBestellen('folie',1);
    o.kosten=+(geld-S.money).toFixed(2); o.soll=+(bb.VM.km.preis+bb.VM.folie.preis).toFixed(2);
    o.unterwegs=bb.vmUnterwegs('km');
    bb.pendingListe().forEach(pd=>pd.t=0);
    let i=0, gedockt=false, imLkw=0;
    for(;i<12000;i++){ bb.step(0.05); const T=bb.truck; if(T&&T.state==='docked'){ gedockt=true; imLkw=Math.max(imLkw,T.cargo.filter(c=>c.vm).length); }
      if(S.vm[0].km>=2+bb.VM.km.stueck&&S.vm[0].folie>=10+bb.VM.folie.stueck) break; }
    o.sek=+(i*0.05).toFixed(1); o.gedockt=gedockt; o.imLkw=imLkw; o.km=S.vm[0].km; o.folie=S.vm[0].folie;
    o.stapelHoch=bb.vmRegale[0].stapel.km.m.scale.y;
    return o; });
  console.log('NACHSCHUB',JSON.stringify(lkw));
  pruef('KAUF',lkw.kauf&&Math.abs(lkw.kosten-lkw.soll)<0.01&&lkw.unterwegs===1,'Kauf bucht falsch: '+JSON.stringify(lkw));
  pruef('LIEFERUNG',lkw.gedockt&&lkw.imLkw===2,'Versandmaterial kommt nicht mit dem LKW: '+JSON.stringify(lkw));
  pruef('EINRAEUMEN',lkw.km===2+15&&lkw.folie===10+20,'der Einraeumer raeumt nicht ins Regal: '+JSON.stringify(lkw));

  /* 3b. der Spieler holt selbst aus dem LKW und raeumt ein */
  const selbst=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.staff.auffueller=false; bb.fireStaff('auffueller');
    S.vm[0].ks=10; bb.vmRegalZeichnen(0); if(bb.pauseOpen) bb.closePause();
    /* Aufstieg oder Tagesabschluss halten das Spiel an - wegklicken */
    const frei=()=>{ for(let i=0;i<12;i++){ const lu=document.getElementById('levelup'), sm=document.getElementById('summary');
      if(lu&&lu.classList.contains('show')) document.getElementById('luBtn').click(); else if(sm&&sm.classList.contains('show')&&document.getElementById('sBtn')) document.getElementById('sBtn').click(); else break; } };
    frei();
    bb.vmBestellen('ks',1); bb.pendingListe().forEach(pd=>pd.t=0);
    for(let i=0;i<3000&&!(bb.truck&&bb.truck.state==='docked');i++) bb.step(0.05);
    const it=bb.truck&&bb.truck.cargo.find(c=>c.vm==='ks');
    o.da=!!it;
    frei();
    if(it){ bb.tuAktion('tbox',it); o.traegt=JSON.stringify(S.carrying);
      o.promptRegal=(bb.promptFor({kind:'vmregal',ref:0})||{}).t;
      bb.tuAktion('vmregal',0); }
    o.ks=S.vm[0].ks; o.hand=!!S.carrying;
    return o; });
  console.log('SELBST',JSON.stringify(selbst));
  pruef('SPIELER',selbst.da&&/"vm":"ks"/.test(selbst.traegt||'')&&/Einräumen/.test(selbst.promptRegal||'')&&selbst.ks===35&&!selbst.hand,'der Spieler kann Versandmaterial nicht selbst einraeumen: '+JSON.stringify(selbst));

  /* 4. Versandkosten und Freigrenze: Nachfrage und Einnahmen */
  const kf=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    const c=bb.vsCfg(); o.std={k:c.kosten,f:c.frei,n:bb.bestellungenProTag(),f1:+bb.vsNachfrage().toFixed(3)};
    c.kosten=9.9; c.frei=0; o.teuer={n:bb.bestellungenProTag(),f:+bb.vsNachfrage().toFixed(3)};
    c.kosten=0; c.frei=20; o.billig={n:bb.bestellungenProTag(),f:+bb.vsNachfrage().toFixed(3)};
    c.kosten=4.9; c.frei=150; o.hoheGrenze={n:bb.bestellungenProTag()};
    c.kosten=4.9; c.frei=25; o.niedrigeGrenze={n:bb.bestellungenProTag()};
    /* Einnahmen: Kunde zahlt Versand, du zahlst Porto */
    for(let i=0;i<3;i++) bb.VM_IDS.forEach(id=>{ S.vm[i][id]=bb.VM[id].kap; });
    window.__lagern('boeller'); S.bestellungen=[];
    c.kosten=5.9; c.frei=0;
    let x=bb.vsNeueBestellung(false); S.bestellungen.push(x); S.offen=1;
    o.gebuehr=x.versand; let g=S.money; bb.packOne(true); o.mitGeb=+(S.money-g).toFixed(2); o.sollMit=+(x.wert+5.9-bb.VS_PORTO[x.gr]).toFixed(2);
    c.frei=15; x=bb.vsNeueBestellung(false); S.bestellungen.push(x); S.offen=1;
    o.gebuehrFrei=x.versand; g=S.money; bb.packOne(true); o.ohneGeb=+(S.money-g).toFixed(2); o.sollOhne=+(x.wert-bb.VS_PORTO[x.gr]).toFixed(2); o.wertFrei=x.wert;
    c.kosten=4.9; c.frei=50;
    return o; });
  console.log('KONFIG',JSON.stringify(kf));
  pruef('NACHFRAGE',Math.abs(kf.std.f1-1)<0.05&&kf.std.k===4.9&&kf.std.f===50,'Standard nicht 4,90 EUR / frei ab 50 EUR mit Faktor 1: '+JSON.stringify(kf.std));
  pruef('NACHFRAGE',kf.teuer.n<kf.std.n&&kf.billig.n>kf.std.n&&kf.niedrigeGrenze.n>kf.hoheGrenze.n,'Versandkosten wirken nicht auf die Bestellzahl: '+JSON.stringify(kf));
  pruef('EINNAHMEN',kf.gebuehr===5.9&&Math.abs(kf.mitGeb-kf.sollMit)<0.01,'Versandkosten des Kunden nicht gebucht oder Porto fehlt: '+JSON.stringify(kf));
  pruef('EINNAHMEN',kf.gebuehrFrei===0&&kf.wertFrei>=15&&Math.abs(kf.ohneGeb-kf.sollOhne)<0.01,'kostenloser Versand: Porto nicht abgezogen: '+JSON.stringify(kf));

  /* 5. Laptop: Versandmaterial bestellen, Einstellung am Onlineshop */
  const lap=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    bb.openLaptop(); bb.ltab='order'; bb.lsup='vm'; bb.renderLaptop();
    const body=document.getElementById('lbody'); o.karten=body.querySelectorAll('[data-a="vmbuy"]').length;
    const vor=bb.pendingListe().filter(x=>x.vm).length; const k=body.querySelector('[data-a="vmbuy"][data-t="kl"]'); if(k) k.click();
    o.bestellt=bb.pendingListe().filter(x=>x.vm).length-vor;
    bb.closeLaptop(false); bb.openHandy('online');
    const kn=document.querySelector('#hApp [data-a="vsk"][data-d="0.5"]'); const k0=bb.vsCfg().kosten; if(kn) kn.click(); o.plus=+(bb.vsCfg().kosten-k0).toFixed(2);
    const fr=document.querySelector('#hApp [data-a="vsf"][data-d="aus"]'); if(fr) fr.click(); o.nie=bb.vsCfg().frei;
    const fr2=document.querySelector('#hApp [data-a="vsf"][data-d="aus"]'); if(fr2) fr2.click(); o.wieder=bb.vsCfg().frei;
    bb.closeHandy(false); if(bb.pauseOpen) bb.closePause(); return o; });
  console.log('LAPTOP',JSON.stringify(lap));
  pruef('LAPTOP',lap.karten>=5&&lap.bestellt===1&&lap.plus===0.5&&lap.nie===0&&lap.wieder===50,'Bestellen oder Einstellen im Laptop geht nicht: '+JSON.stringify(lap));

  /* 6. Speichern und Laden; alter Stand ohne Packmaterial */
  await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; S.vm[0].ks=7; S.vm[0].band=33; bb.vsCfg().kosten=3.5; bb.vsCfg().frei=80; bb.save(); });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000}); await neuesSpiel(true);
  const geladen=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; return {ks:S.vm[0].ks,band:S.vm[0].band,k:bb.vsCfg().kosten,f:bb.vsCfg().frei,unterwegs:bb.pendingListe().filter(x=>x.vm).length}; });
  console.log('LADEN',JSON.stringify(geladen));
  pruef('LADEN',geladen.ks===7&&geladen.band===33&&geladen.k===3.5&&geladen.f===80&&geladen.unterwegs>=1,'Bestand, Einstellung oder Unterwegs-Material nicht gespeichert: '+JSON.stringify(geladen));
  await p.evaluate(()=>{ const KEY='boellerbude_v3'; const d=JSON.parse(localStorage.getItem(KEY));
    delete d.vm; delete d.versandCfg; delete d.vmUnterwegs; if(d.up){ delete d.up.packstation2; delete d.up.packstation3; }
    (d.bestellungen||[]).forEach(x=>delete x.versand); localStorage.setItem(KEY,JSON.stringify(d));
    /* beim Neuladen speichert das Spiel (visibilitychange) - das soll den
       zurechtgestutzten alten Stand nicht ueberschreiben */
    Storage.prototype.setItem=function(){}; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000}); await neuesSpiel(true);
  const alt=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    o.voll=bb.VM_IDS.every(id=>S.vm[0][id]===bb.VM[id].kap); o.k=bb.vsCfg().kosten; o.f=bb.vsCfg().frei; o.stufe=bb.packStufe();
    S.offen=3; bb.vsAbgleich(); for(let i=0;i<200;i++) bb.step(0.05); o.laeuft=true; return o; });
  console.log('ALTER STAND',JSON.stringify(alt));
  pruef('ALTSTAND',alt.voll&&alt.k===4.9&&alt.f===50&&alt.stufe===1,'alter Spielstand laedt nicht mit Standardwerten: '+JSON.stringify(alt));
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK');
  await b.close();
})();

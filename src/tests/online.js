const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1180,height:820}});
  const fehler=[];
  p.on('pageerror',e=>fehler.push('PAGEERROR '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_CERT/.test(m.text())) fehler.push('CONSOLE '+m.text().slice(0,160)); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});

  const zeig=async(t)=>console.log(t,JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb;
    return {stufe:bb.onlineStufe(),zahlen:bb.onlineZahlen(),
            knoepfe:[...document.querySelectorAll('#hApp button')].map(b=>b.dataset.a+(b.disabled?':aus':':an'))};
  })));

  /* 1. Nichts freigeschaltet */
  await p.evaluate(()=>{ window.__bb.openHandy('online'); });
  await zeig('ZU        ');

  /* 2. Nur Onlineshop */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=40; bb.S.money=9e6; bb.S.up.onlineshop=true;
    bb.openHandy('online'); });
  await zeig('PAUSCHAL  ');

  /* 3. Mit Packstation */
  await p.evaluate(()=>{ const bb=window.__bb;
    ['lager_gross','lager_sued','lager_sued2','packstation'].forEach(id=>{ bb.S.up[id]=true; if(bb.ZONEN[id]) bb.oeffneZone(id,false); });
    bb.applyZonen(); bb.S.offen=11; bb.S.pakete=0;
    bb.openHandy('online'); });
  await zeig('VERSAND   ');
  await p.screenshot({path:'/tmp/online-tab.jpg',type:'jpeg',quality:82});

  /* 4. Die Liste zeigt jede Bestellung mit Inhalt, Groesse und Wert.
        Gepackt wird am Packtisch, nicht per Knopf - es gibt keinen
        Pack-Knopf mehr im Handy (Tom, 25.09.). */
  const liste=await p.evaluate(()=>{ const bb=window.__bb, li=document.getElementById('onListe');
    return {eintraege:li?li.querySelectorAll('.best').length:-1,text:li?li.textContent.slice(0,160):'',
      bestellungen:bb.S.bestellungen.length,mitInhalt:bb.S.bestellungen.every(x=>x.pos.length>0&&x.wert>0),
      knopf:!!document.getElementById('onPack')}; });
  console.log('LISTE      ',JSON.stringify(liste));
  if(liste.eintraege<1||liste.bestellungen!==11||!liste.mitInhalt||liste.knopf) fehler.push('LISTE: Bestellungen ohne Inhalt oder alter Pack-Knopf '+JSON.stringify(liste));

  /* 5. Live-Tick schreibt Zahlen und Liste nach, ohne neu aufzubauen */
  await p.evaluate(()=>{ window.__bb.S.offen=4; window.__bb.updateOnline(); });
  const tick=await p.evaluate(()=>({offen:document.getElementById('onOffen').textContent,
    eintraege:document.querySelectorAll('#onListe .best').length,S:window.__bb.S.bestellungen.length}));
  console.log('TICK       ',JSON.stringify(tick));
  if(tick.offen!=='4'||tick.eintraege!==4||tick.S!==4) fehler.push('TICK: '+JSON.stringify(tick));

  /* 6. Nachfrage (Tom 09.10.): hohe Versandkosten senken die Bestellungen stark (echte Abbrueche
        beim Bestellen), Gratisversand hebt sie. Gegenprobe: "heute versandkostenfrei" bei 20 EUR -
        dann darf die Zahl nicht fallen (zeigt, dass der Test die Wirkung misst). */
  const nf=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    bb.closeHandy(false);
    /* Ware in die Ladenregale, damit Bestellungen entstehen koennen (Lager gibt es hier nicht) */
    S.lic=bb.LIZENZEN.map(l=>l.id); const typen=bb.ORDER.filter(t=>bb.P[t]&&!bb.P[t].noShelf&&!bb.P[t].noOrder&&bb.isUnlocked(t));
    /* Kartons am Boden in Halle Sued II/III, erreichbar fuer den Versand (ein frisches Spiel hat keine Regale) */
    for(let i=0;i<30;i++){ const t=typen[(i*7)%typen.length]; bb.spawnFloorBox(t,40,{x:-17.2+(i%6)*0.7,y:0,z:-17.0-Math.floor(i/6)*0.9,ry:0},1); }
    bb.NAV.dirty=true; o.bestand=typen.filter(t=>bb.vsBestand(t)>0).length;
    const tag=(cfg,gratis)=>{ Object.assign(bb.vsCfg(),cfg); bb.vsAktion().frei=gratis?S.day:-1; let n=0, ab=0;
      for(let r=0;r<6;r++){ S.bestellungen=[]; S.offen=0; const a0=bb.DS.onAbbr|0; bb.phase='open';
        for(let t=0;t<330;t+=0.5) bb.updateVersand(0.5); n+=S.bestellungen.length; ab+=(bb.DS.onAbbr|0)-a0; }
      S.bestellungen=[]; S.offen=0; return {n:n/6,abbr:ab/6}; };
    o.std=tag({kosten:4.9,frei:50,nie:false},false); o.teuer=tag({kosten:20,frei:50,nie:true},false); o.frei=tag({kosten:0,frei:50,nie:false},false);
    o.gegen=tag({kosten:20,frei:50,nie:true},true);
    Object.assign(bb.vsCfg(),{kosten:4.9,frei:50,nie:false}); bb.vsAktion().frei=-1;
    /* Anzeige: Statistik, Aktionen und Versandbox im Onlineshop */
    bb.openHandy('online'); const h=document.getElementById('hApp');
    o.ui={stat:!!h.querySelector('table.onstat'),sale:h.querySelectorAll('[data-a="sale"]').length,gratis:!!h.querySelector('[data-a="gratis"]'),psale:!!h.querySelector('[data-a="psale"]'),box:!!h.querySelector('#onDdl'),ergebnis:/Ergebnis Online/.test(h.textContent)};
    bb.closeHandy(false);
    return o; });
  console.log('NACHFRAGE  ',JSON.stringify(nf));
  if(!(nf.bestand>=10&&nf.std.n>=5&&nf.teuer.n<nf.std.n*0.35&&nf.frei.n>nf.std.n*1.15&&nf.teuer.abbr>nf.std.abbr)) fehler.push('NACHFRAGE: Versandkosten wirken nicht auf die Bestellungen '+JSON.stringify(nf));
  if(!(nf.gegen.n>nf.teuer.n*2)) fehler.push('NACHFRAGE_GEGENPROBE: Test misst die Wirkung nicht '+JSON.stringify(nf));
  if(!(nf.ui.stat&&nf.ui.sale>=4&&nf.ui.gratis&&nf.ui.psale&&nf.ui.box&&nf.ui.ergebnis)) fehler.push('ONLINESHOP_UI: Statistik/Aktionen/Box fehlen '+JSON.stringify(nf.ui));

  console.log(fehler.length?fehler.slice(0,5).join('\n'):'ERRORS: keine');
  await b.close();
})();

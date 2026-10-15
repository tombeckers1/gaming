/* Bilder Produktion (15.10.2026): Vorher/Nachher fuer Tom - Leitstand-Bildschirme, Straße 1 mit Werker im Betrieb, Gefahrgut-LKW an
   Tor 6, Stoerung (Ampel/Leitstand), Laptop-Tab "Produktion". Laeuft auf real.html (swiftshader), auch auf dem alten Stand (ohne 05s:
   nur Kauf + Ansichten). Aufruf: node -r ./ladezeit-preload.js tools/produktion/bilder.js real.html <ausgabeordner> <praefix> */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const H=require('../test/start-hilfe.js');
const [,,HTML,OUT,PRE='nachher']=process.argv;
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1100,height:700}}); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await H.laden(p,HTML); await H.neuesSpiel(p,{stoppen:true});
  await p.evaluate(()=>{ const bb=window.__bb, S=bb.S;
    S.level=40; S.money=900000; S.lic=bb.LIZENZEN.map(l=>l.id); S.up.tag4=true;
    ['lager','lager_nord','lager_gross','lager_sued','lager_sued2','lager_west','lager_west2','lager_west3','rampe2','rampe3','rampe4','rampe5','lagerlogistik','fabrik','testfeld'].forEach(id=>bb.testKauf(id));
    bb.run(1,0.05);
    if(bb.pdDaten){ for(const id of ['mischer','werker1']){ S.staff[id]=true; bb.hireStaff(id); }
      const D=bb.pdDaten(); for(const r in D.lager) D.lager[r].std=200;
      bb.pdKlick('pdadd',{i:'0',t:'supernova',v:'40'}); bb.pdKlick('pdadd',{i:'0',t:'kristall',v:'16'}); bb.pdKlick('pdan',{i:'0'}); bb.pdKlick('pdb2b',{i:'0'});
      bb.pdBestellen('huelsen',false,5); bb.pdBestellen('schwarzpulver',true,1); }
    if(bb.phase!=='open'){ bb.phase='closed'; bb.clock=600; bb.openShop(); }
    for(let i=0;i<40;i++) bb.run(1,0.05); });
  const bild=async(n,x,z,yaw,pitch,y)=>{ await p.evaluate(([x,z,yaw,pitch,y])=>{ const bb=window.__bb; bb.setView(x,z,yaw,pitch); bb.kameraSetzen(); if(y) window.__bb.camera.position.y=y;
      for(let i=0;i<8;i++){ bb.run(0.1,0.05); bb.renderFrame(0.05); } },[x,z,yaw,pitch,y]);
    await p.screenshot({path:`${OUT}/${PRE}-${n}.jpg`,quality:82}); };
  await bild('leitstand-monitore',-82.2,-9.0,0,-0.12);
  await bild('strasse1',-91.3,-11.7,-Math.PI/2+0.25,-0.12);
  /* Stoerung: Zelle R3, Ampel blinkt, Leitstand zeigt STOERUNG */
  await p.evaluate(()=>{ const bb=window.__bb; if(bb.pdDaten){ const D=bb.pdDaten(); D.s[0].stoer={art:'zelle',st:'R3',j:2,t:0}; } });
  await bild('stoerung-leitstand',-82.2,-9.0,0,-0.12);
  await bild('stoerung-strasse',-86.0,-15.6,Math.PI*0.62,-0.05);
  /* LKW an Tor 6: naechster Tag, Laden auf */
  const lkw=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; if(!bb.pdDaten) return false; const D=bb.pdDaten(); D.s[0].stoer=null;
    S.day++; bb.pdNeuerTag(); bb.phase='closed'; bb.clock=480; bb.openShop(); for(let i=0;i<14;i++) bb.run(0.5,0.05); return !!bb.pdLkw; });
  await bild('r6-lkw',-80.5,-52,Math.PI*0.97,0.02);
  /* Laptop-Tab */
  if(await p.evaluate(()=>!!window.__bb.pdLaptop)){ await p.evaluate(()=>{ window.__bb.openLaptop('prod','leitstand'); });
    await p.screenshot({path:`${OUT}/${PRE}-laptop-produktion.jpg`,quality:82}); }
  console.log('BILDER',PRE,'lkw',lkw,errs.length?'ERR '+errs.slice(0,3).join(' | '):'');
  await b.close();
})();

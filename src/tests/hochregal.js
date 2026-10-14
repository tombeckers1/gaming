/* Halle Etappe A (14.10.): Lagerlogistik - Ausbau, Waende/Kollision, Wege (NAV), Umzug der Lagerregale,
   Wareneingang -> FTS -> Foerderer -> RBG -> Hochregal, Auslagerung in den Anbruch, Nachschub nach ③,
   Bestand (stockOf), Fixkosten, Speichern/Laden. Aufruf: node -r ./ladezeit-preload.js hochregal.js real.html
   GEGENPROBE=1: Kollision der gelben Wand entfernen -> der Wand-Test muss anschlagen. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:960,height:600}}); p.setDefaultTimeout(120000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_CERT')<0) errs.push('CONSOLE: '+m.text()); });
  const H=require('../../tools/test/start-hilfe.js');
  await H.laden(p,process.argv[2]);
  await H.neuesSpiel(p,{stoppen:true});
  const mangel=[]; const M=(ok,t)=>{ if(!ok) mangel.push(t); };

  /* 1) Vorher: Halle Stufe 3 mit Lagerregalen und Kartons, dann Kauf */
  const a=await p.evaluate(()=>{ const bb=window.__bb, o={};
    bb.S.level=40; bb.S.money=900000;
    ['lager','lager_nord','lager_gross','lager_sued','lager_sued2','lager_west','lager_west2','lager_west3','rampe2','rampe3','rampe4','rampe5','packstation','onlineshop'].forEach(id=>bb.testKauf(id));
    /* zwei Lagerregale in die Halle (Plaetze, die mit dem Ausbau entfallen) und eines in ① */
    const T=bb.ORDER.filter(t=>bb.P[t]&&bb.P[t].box&&!bb.P[t].noOrder).slice(0,12); o.T=T;
    const rk1=bb.createRack(bb.racks.length,{kind:'standard',x:-59,z:-20,ry:0}), rk2=bb.createRack(bb.racks.length,{kind:'hoch',x:-47.5,z:-22,ry:0});
    bb.putInSlot(rk1.slots[0],T[0],bb.P[T[0]].box,1); bb.putInSlot(rk2.slots[1],T[1],bb.P[T[1]].box,1);
    o.racksVor=bb.racks.length; o.stockVor=T.map(t=>bb.stockOf(t));
    o.preis=bb.UPGRADES.find(u=>u.id==='lagerlogistik').cost();
    o.fixVor=bb.fixedCosts();
    const g0=bb.S.money; bb.buyUp('lagerlogistik'); o.bezahlt=Math.round(g0-bb.S.money);
    o.offen=bb.llOffen(); o.gebaut=!!bb.LL_G&&bb.LL_G.visible; o.altSichtbar=bb.LL_ALT.g.visible;
    bb.run(2,0.05);
    o.racksNach=bb.racks.length; o.stockNach=T.map(t=>bb.stockOf(t));
    o.racksInSperre=bb.racks.filter(r=>{ const q=r.g.position; return bb.llSperrt(q.x-0.3,q.x+0.3,q.z-0.3,q.z+0.3)&&!(q.x>-46&&q.x<-42&&q.z>-28&&q.z<-14); }).length;
    o.anbruch=bb.racks.filter(r=>{ const q=r.g.position; return q.x>-46&&q.x<-42&&q.z>-28&&q.z<-14; }).length;
    o.fixNach=bb.fixedCosts();
    o.gassen=bb.LL_T.gassen.map(G=>!!G.rbg);
    return o; });
  console.log('KAUF',JSON.stringify(a));
  M(a.offen&&a.gebaut&&!a.altSichtbar,'Ausbau nicht offen/gebaut oder alte Schleuse sichtbar');
  M(a.bezahlt===a.preis,'Preis nicht bezahlt: '+a.bezahlt+' statt '+a.preis);
  M(a.racksInSperre===0,'Lagerregale stehen noch in belegten Flaechen: '+a.racksInSperre);
  M(a.anbruch===5,'Anbruch hat '+a.anbruch+' statt 5 Lagerregale');
  M(JSON.stringify(a.stockVor)===JSON.stringify(a.stockNach),'Bestand beim Umzug veraendert: '+a.stockVor+' -> '+a.stockNach);
  M(a.fixNach-a.fixVor>=35,'Fixkosten ohne Betrieb Hochregal: '+a.fixVor+' -> '+a.fixNach);
  M(a.gassen[0]&&!a.gassen[1]&&!a.gassen[2],'RBG: nur Gasse 1 soll fahren: '+a.gassen);

  /* 2) Waende und Wege */
  const w=await p.evaluate(gp=>{ const bb=window.__bb, o={};
    if(gp){ const c=bb.colliders.find(c=>c.minX>-36.2&&c.maxX<-35.8&&c.minZ<-15&&c.maxZ>-15); if(c) bb.colliders.splice(bb.colliders.indexOf(c),1); bb.NAV.dirty=true; }
    const drin=(x,z)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ);
    o.gelbX=drin(-36,-15); o.gelbZ=drin(-30,-17); o.brand=drin(-26,-28.5); o.hr=drin(-55,-27.2); o.n1Frei=!drin(-36,-12);
    o.schleuseZuHalle=!drin(-26,-25); o.schleuseZu2=!drin(-19.95,-24); o.dritteZu2=!drin(-19.95,-12); o.alteSchleuseWand=drin(-23,-24.0)||drin(-23,-17.0);
    const lang=(a,z)=>{ const r=bb.route(bb.V?bb.V(a[0],0,a[1]):{x:a[0],y:0,z:a[1]},{x:z[0],y:0,z:z[1]}); let L=0, q={x:a[0],z:a[1]}, durch=false; for(const s of r){ L+=Math.hypot(s.x-q.x,s.z-q.z); for(let t=0;t<=10;t++){ const x=q.x+(s.x-q.x)*t/10, zz=q.z+(s.z-q.z)*t/10; if(drin(x,zz)) durch=true; } q=s; } return {n:r.length,L:Math.round(L*10)/10,durch}; };
    o.weg1=lang([-14,-2],[-43,-21]);         /* ① -> Anbruch (durch ③ und N1) */
    o.weg2=lang([-12,-26],[-42.6,-24]);      /* Versandecke -> Schleuse -> Anbruch */
    o.weg3=lang([-14,-2],[-30,-12]);         /* ① -> ③ */
    o.hrBetreten=bb.NAV.g[bb.navIdx(-55,-25.8)]===0;
    return o; },!!process.env.GEGENPROBE);
  console.log('WAENDE',JSON.stringify(w));
  M(w.gelbX&&w.gelbZ&&w.brand&&w.hr,'Kollision fehlt (gelbe Wand/Brandwand/Hochregal)');
  M(w.n1Frei&&w.schleuseZuHalle&&w.schleuseZu2&&w.dritteZu2&&!w.alteSchleuseWand,'Durchgaenge zu oder alte Schleusenwand steht noch');
  for(const k of ['weg1','weg2','weg3']) M(w[k].n>0&&!w[k].durch&&w[k].L<80,k+' nicht begehbar oder durch Hindernis: '+JSON.stringify(w[k]));
  M(!w.hrBetreten,'Gasse des Hochregals im Wegenetz begehbar');

  /* 3) Lieferung an Tor 3 -> Stellplaetze -> FTS -> Foerderer -> RBG -> Hochregal -> Anbruch -> FTS -> ③ */
  const l=await p.evaluate(()=>{ const bb=window.__bb, o={};
    const T=bb.ORDER.filter(t=>bb.P[t]&&bb.P[t].box&&!bb.P[t].noOrder).slice(2,8); o.T=T;
    o.stock0=T.map(t=>bb.stockOf(t)); o.soll=T.map(t=>2*bb.P[t].box);
    o.spawn=bb.spawnWTruck(1,T.flatMap(t=>[{type:t,q:1},{type:t,q:1}]),'grosshandel','Test');
    return o; });
  const lauf=await H.vorspulen(p,{sek:3,dt:0.05,max:260,bis:'bb.HR.zahl.ein>=2&&bb.HR.zahl.aus>=1&&bb.HR.zahl.nach>=1'});
  const l2=await p.evaluate(T=>{ const bb=window.__bb, o={};
    o.zahl=bb.HR.zahl; o.belegt=bb.hrBelegt(); o.stellRest=bb.LL_STELL.reduce((n,q)=>n+bb.llStellBoxen(q).length,0); o.tr=bb.S.hr.tr.length;
    o.stock=T.map(t=>bb.stockOf(t)); o.kap=bb.hrKapazitaet();
    o.in3=bb.racks.filter(r=>{ const q=r.g.position; return q.x>-36.2&&q.x<-19.9&&q.z>-17.2&&q.z<-6.8; }).reduce((n,r)=>n+r.slots.filter(s=>s.box).length,0);
    return o; },l.T);
  console.log('LOGISTIK',JSON.stringify(l.spawn),JSON.stringify(lauf),JSON.stringify(l2));
  M(l.spawn,'Lieferung an Tor 3 nicht gestartet');
  M(l2.zahl.ein>=2,'Hochregal hat keine Paletten eingelagert: '+JSON.stringify(l2.zahl));
  M(l2.zahl.aus>=1,'RBG hat nichts in den Anbruch ausgelagert');
  M(l2.zahl.nach>=1&&l2.in3>0,'kein Nachschub nach ③: '+l2.in3);
  M(l2.kap===180,'Kapazitaet Gasse 1 nicht 180: '+l2.kap);
  M(JSON.stringify(l2.stock)===JSON.stringify(l.stock0.map((v,i)=>v+l.soll[i])),'Bestand stimmt nicht: '+l.stock0+' + '+l.soll+' -> '+l2.stock);

  /* 4) Speichern/Laden: Bestand bleibt */
  const s1=await p.evaluate(()=>{ const bb=window.__bb; bb.save(); return {hr:bb.hrStock(),belegt:bb.hrBelegt()}; });
  await H.neuladen(p);
  await p.click('#startBtns button:first-child').catch(()=>{});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:300000}).catch(()=>{});
  const s2=await p.evaluate(()=>{ const bb=window.__bb; return {hr:bb.hrStock(),belegt:bb.hrBelegt(),offen:bb.llOffen(),gebaut:!!bb.LL_G&&bb.LL_G.visible,anbruch:bb.racks.filter(r=>{ const q=r.g.position; return q.x>-46&&q.x<-42&&q.z>-28&&q.z<-14; }).length}; });
  console.log('LADEN',JSON.stringify(s1),JSON.stringify(s2));
  M(s2.offen&&s2.gebaut,'nach dem Laden nicht gebaut');
  M(s2.hr===s1.hr&&s2.belegt===s1.belegt,'Hochregal-Bestand nach dem Laden anders: '+JSON.stringify([s1,s2]));
  M(s2.anbruch===5,'Anbruch nach dem Laden: '+s2.anbruch);

  if(errs.length) console.log('ERRORS: '+errs.slice(0,6).join(' | '));
  console.log(mangel.length?'MANGEL: '+mangel.join(' | '):'ALLES OK');
  await b.close();
  process.exit(mangel.length||errs.length?1:0);
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

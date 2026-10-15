/* Halle Etappe B (15.10.): Werk West - Kauf fabrik/fabrik2/fabrik3, Bau erst beim Kauf, Waende/Kollision (Brandwaende, Tueren),
   Leitstand ueber die Treppe begehbar (Bodenhoehe), Personaltuer der Halle, Welt bis x −124, Schau-Betrieb (Traeger, Portale,
   Paletten in die Gasse), RBG in Gasse 2/3, Fixkosten, Wegenetz unveraendert (Groesse, Bauzeit), Speichern/Laden.
   Aufruf: node -r ./ladezeit-preload.js werk.js real.html   GEGENPROBE=1: Kollision der Brandwand entfernen -> muss anschlagen. */
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

  /* 1) Kauf: vorher nichts im Speicher, danach Werk + Straße 1 + Gasse 2 */
  const a=await p.evaluate((GEGEN)=>{ const bb=window.__bb, o={};
    bb.S.level=40; bb.S.money=900000;
    ['lager','lager_nord','lager_gross','lager_sued','lager_sued2','lager_west','lager_west2','lager_west3','rampe2','rampe3','rampe4','rampe5','lagerlogistik'].forEach(id=>bb.testKauf(id));
    bb.run(1,0.05);
    const t0=performance.now(); bb.navBuild(); o.navMs0=Math.round((performance.now()-t0)*10)/10; o.nav0=bb.NAV.w*bb.NAV.h;
    o.vorG=!!bb.WK_G; o.x0vor=bb.wkWeltX0();
    o.preis=bb.UPGRADES.find(u=>u.id==='fabrik').cost(); o.fixVor=bb.fixedCosts();
    const g0=bb.S.money; bb.buyUp('fabrik'); o.bezahlt=Math.round(g0-bb.S.money);
    bb.run(1,0.05);
    o.offen=bb.wkOffen(); o.gebaut=!!bb.WK_G&&bb.WK_G.visible; o.str=bb.WK_T.str.map(s=>!!s); o.fixNach=bb.fixedCosts();
    o.gassen=bb.LL_T.gassen.map(G=>!!G.rbg&&G.rbg.g.visible); o.altWand=bb.WK_ALT.halle&&bb.WK_ALT.halle.visible; o.altHof=bb.WK_ALT.hof.some(m=>m.visible);
    o.kapitel=!bb.KAPITEL[7].geplant&&bb.KAPITEL[7].up==='fabrik'; o.x0=bb.wkWeltX0(); o.n1=bb.LL_T.n1.art;
    const t1=performance.now(); bb.navBuild(); o.navMs1=Math.round((performance.now()-t1)*10)/10; o.nav1=bb.NAV.w*bb.NAV.h;
    /* Feinschliff 15.10.: RBG an Feld 0 (westlichster Platz) darf nicht in die Brandwand x −66 ragen */
    { const xs=bb.LL_T.hr.plaetze.map(q=>q.x), xmin=Math.min(...xs)-(GEGEN?0.6:0); o.rbgWest=bb.LL_T.gassen.filter(G=>G.rbg).map(G=>{ const R=G.rbg, x=R.g.position.x;
        R.set(xmin); R.g.updateMatrixWorld(true); const bx=new THREE.Box3().setFromObject(R.g); R.set(x); return Math.round(bx.min.x*100)/100; }); }
    return o; },!!process.env.GEGENPROBE_RBG);
  console.log('KAUF',JSON.stringify(a));
  M(!a.vorG,'Werk vor dem Kauf schon gebaut (Speicher)');
  M(a.bezahlt===a.preis&&a.offen&&a.gebaut,'Kauf/Bau fehlgeschlagen: '+JSON.stringify(a));
  M(a.str[0]&&!a.str[1]&&!a.str[2],'nur Straße 1 soll stehen: '+a.str);
  M(a.gassen[0]&&a.gassen[1]&&!a.gassen[2],'RBG in Gasse 1+2 erwartet: '+a.gassen);
  M(a.rbgWest.length&&a.rbgWest.every(x=>x>=-66.0),'RBG ragt an Feld 0 in die Brandwand x -66: '+a.rbgWest);
  M(a.fixNach-a.fixVor===35,'Fixkosten: nur Betrieb Gasse 2 (35) erwartet, ist '+(a.fixNach-a.fixVor));
  M(a.altWand===false&&a.altHof===false,'alte Westwand/Hofzaun noch sichtbar');
  M(a.kapitel,'Kapitel 8 noch geplant oder nicht fabrik');
  M(a.x0vor>-67&&a.x0<-123,'Welt nicht nach Westen erweitert: '+a.x0vor+' -> '+a.x0);
  M(a.nav0===a.nav1,'Wegenetz-Groesse veraendert: '+a.nav0+' -> '+a.nav1);
  M(a.n1==='schnelllauf','N1 ist kein Schnelllauftor: '+a.n1);

  /* 2) Waende, Tueren, Wege des Spielers (in kleinen Schritten gehen - collide wie beim Laufen) */
  const w=await p.evaluate(gp=>{ const bb=window.__bb, o={};
    if(gp){ for(const c of bb.colliders.slice()) if(c.minX>-70.2&&c.maxX<-69.8&&c.maxZ-c.minZ>2) bb.colliders.splice(bb.colliders.indexOf(c),1); }
    const drin=(x,z)=>bb.colliders.some(c=>!c.nurNav&&x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ);
    o.brandA=drin(-70,-16.5)&&drin(-70,-30); o.brandB=drin(-66.1,-14)&&drin(-66.1,-30); o.tuerA=!drin(-70,-9); o.tuerB=!drin(-66.1,-9);
    o.zelle=drin(-87,-13.75); o.strasse=drin(-80,-13.75); o.gang=!drin(-80,-16.5)&&!drin(-80,-11.55); o.aussenWand=drin(-100.1,-20)&&drin(-85,-34.1);
    const geh=(pfad)=>{ let ok=true, max=0, hs=[]; bb.setView(pfad[0][0],pfad[0][1],0,0);
      for(let i=1;i<pfad.length;i++){ const [x0,z0]=pfad[i-1], [x1,z1]=pfad[i], n=Math.ceil(Math.hypot(x1-x0,z1-z0)/0.08);
        for(let k=1;k<=n;k++){ const q=bb.playerPos(), tx=x0+(x1-x0)*k/n, tz=z0+(z1-z0)*k/n, r=bb.schiebe(tx,tz); const d=Math.hypot(r.x-tx,r.z-tz); max=Math.max(max,d);
          hs.push(bb.wkBoden(r.x,r.z)); if(d>0.25){ ok=false; break; } } if(!ok) break; }
      let sprung=0; for(let i=1;i<hs.length;i++) sprung=Math.max(sprung,Math.abs(hs[i]-hs[i-1]));
      const e=bb.playerPos(); return {ok,abw:Math.round(max*100)/100,ende:[+e.x.toFixed(2),+e.z.toFixed(2)],hoehe:bb.wkBoden(e.x,e.z),sprung:Math.round(sprung*100)/100}; };
    /* Halle -> Verbindungsbau -> Umkleide -> Treppe -> Podest -> Leitstand */
    o.leitstand=geh([[-60,-12],[-64.5,-9],[-67,-9],[-71,-9],[-74,-8.8],[-75.3,-7.5],[-76.5,-7.5],[-76.55,-10.5],[-77.5,-10.5],[-77.5,-7.5],[-79.5,-7.5],[-82,-9]]);
    /* Umkleide -> Werk (Tuer z −11) -> Gang zwischen Straße 1 und 2 */
    o.werk=geh([[-72,-9.5],[-74.5,-10.2],[-74.5,-11.5],[-91.5,-11.6],[-91.5,-16.5],[-75,-16.5]]);
    /* Personaltuer der Halle x −40 nach draussen und aussen herum zum Werkseingang */
    o.draussen=geh([[-40,-8.5],[-40,-5.5],[-45,-3],[-52,4.6],[-67,4.6],[-73,4.6],[-73,-6.0]]);
    o.navTuer=!bb.navFrei(bb.navIdx(-40,-6.9));
    o.boden={leitstand:bb.wkBoden(-82,-9),podest:bb.wkBoden(-77,-10.6),fuss:bb.wkBoden(-76.5,-7.5),werk:bb.wkBoden(-82,-14)};
    return o; },!!process.env.GEGENPROBE);
  console.log('WEGE',JSON.stringify(w));
  M(w.brandA&&w.brandB&&w.aussenWand,'Kollision Brandwand/Aussenwand fehlt');
  M(w.tuerA&&w.tuerB,'Tueren im Verbindungsbau zu');
  M(w.zelle&&w.strasse&&w.gang,'Straße/Zellen nicht gesperrt oder Gang zu');
  M(w.leitstand.ok&&Math.abs(w.leitstand.hoehe-3.2)<0.01&&w.leitstand.sprung<0.25,'Leitstand nicht begehbar: '+JSON.stringify(w.leitstand));
  M(w.werk.ok,'Werk nicht begehbar: '+JSON.stringify(w.werk));
  M(w.draussen.ok,'Personaltuer/Aussenweg nicht begehbar: '+JSON.stringify(w.draussen));
  M(w.navTuer,'Personaltuer im Wegenetz offen (Personal liefe hinaus)');
  M(w.boden.leitstand===3.2&&Math.abs(w.boden.podest-1.6)<0.01&&w.boden.fuss===0&&w.boden.werk===0,'Bodenhoehen falsch: '+JSON.stringify(w.boden));

  /* 3) Schau-Betrieb: Kamera im Werk, Traeger/Portale bewegen sich, Paletten erreichen die Gasse */
  const sb=await p.evaluate(()=>{ const bb=window.__bb, o={}, st=bb.WK_T.str[0];
    bb.setView(-80,-16.5,-Math.PI/2,0); bb.kameraSetzen(); bb.renderFrame(0.016);
    o.sichtbar=bb.WK_H.visible&&bb.WK_D.visible;
    const m=new THREE.Matrix4(), pos=()=>{ st.traeger.getMatrixAt(0,m); return m.elements[12]; };
    const x0=pos(), b0=st.portale[0].P.bruecke.position.x+st.portale[0].P.hub.position.y, p0=bb.WK.zahl.paletten[0];
    for(let i=0;i<20;i++){ bb.run(3,0.05); bb.renderFrame(0.016); } bb.run(1.3,0.05); bb.renderFrame(0.016);
    o.traeger=Math.abs(pos()-x0)>0.1; o.portal=Math.abs(st.portale[0].P.bruecke.position.x+st.portale[0].P.hub.position.y-b0)>0.01;
    o.paletten=bb.WK.zahl.paletten[0]-p0; o.ampel=st.ampel.rot.emissiveIntensity;
    bb.setView(-14,-2,0,0); bb.kameraSetzen(); bb.renderFrame(0.016); o.ausLager=!bb.WK_H.visible;
    return o; });
  console.log('SCHAU',JSON.stringify(sb));
  M(sb.sichtbar&&sb.ausLager,'Sichtsteuerung: im Werk sichtbar, aus dem Lager nicht erwartet: '+JSON.stringify(sb));
  M(sb.traeger&&sb.portal,'Schau-Betrieb bewegt sich nicht: '+JSON.stringify(sb));
  M(sb.paletten>=1,'keine Palette in Gasse 2 angekommen');
  M(sb.ampel>1,'Zellenampel nicht rot (Straße laeuft)');

  /* 4) 8.2 und 8.3 */
  const c=await p.evaluate(()=>{ const bb=window.__bb, o={}; bb.S.level=40; const f0=bb.fixedCosts();
    bb.buyUp('fabrik2'); bb.buyUp('fabrik3'); bb.run(1,0.05);
    o.str=bb.WK_T.str.map(s=>!!s&&s.g.visible); o.gassen=bb.LL_T.gassen.map(G=>!!G.rbg&&G.rbg.g.visible); o.dfix=bb.fixedCosts()-f0;
    o.blenden=bb.WK_T.blende.map(l=>l.some(m=>m.visible)); bb.save(); return o; });
  console.log('AUSBAU',JSON.stringify(c));
  M(c.str.every(Boolean)&&c.gassen.every(Boolean),'Straße 2/3 oder Gasse 3 fehlt: '+JSON.stringify(c));
  M(c.dfix===35,'Fixkosten 8.2/8.3: nur Gasse 3 (35) erwartet, ist '+c.dfix);
  M(!c.blenden.some(Boolean),'Brandschutz-Blenden in laufenden Straßen noch zu');

  /* 5) Speichern/Laden */
  await H.neuladen(p);
  await p.click('#startBtns button:first-child').catch(()=>{});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:300000}).catch(()=>{});
  const s2=await p.evaluate(()=>{ const bb=window.__bb; return {offen:bb.wkOffen(),str:bb.WK_T&&bb.WK_T.str.map(s=>!!s),gassen:bb.LL_T.gassen.map(G=>!!G.rbg)}; });
  console.log('LADEN',JSON.stringify(s2));
  M(s2.offen&&s2.str&&s2.str.every(Boolean)&&s2.gassen.every(Boolean),'nach dem Laden nicht vollstaendig: '+JSON.stringify(s2));

  if(errs.length) console.log('ERRORS: '+errs.slice(0,6).join(' | '));
  console.log(mangel.length?'MANGEL: '+mangel.join(' | '):'ALLES OK');
  await b.close();
  process.exit(mangel.length||errs.length?1:0);
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

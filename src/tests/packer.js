/* Versandmitarbeiter mit Kommissionierwagen (Tom, 25.09.):
   - Bestellungen haben einen Inhalt; der Bestand sinkt genau um ihn
   - auf den Wagen passen 6 kleine, 2 grosse oder 1 riesiges Paket
   - jedes Stueck wird an seiner Quelle gegriffen (Abstand), einzeln
   - Lager zuerst; nur was dort fehlt, holt er aus dem Laden - und
     laeuft dabei durch die Tuer, nicht durch eine Wand
   - Karton offen auf dem Wagen, am Tisch Klappen zu, Klebeband,
     Etikett; danach Rollenbahn und Stapel auf der Paketablage
   - Geld wird gebucht; Speichern mitten in der Tour verliert nichts;
     Kuendigung raeumt den Wagen; der Spieler packt am Tisch selbst
   Aufruf: node packer.js real.html [bild-praefix] */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:640}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_CERT/.test(m.text())) errs.push('CONSOLE '+m.text().slice(0,160)); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const pre=process.argv[3];
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const hilfen=async()=>p.evaluate(()=>{ window.__hilfen=()=>{ const bb=window.__bb, S=bb.S;
    window.__lager=t=>{ let n=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type===t) n+=s.box.count; })); bb.floorBoxes.forEach(x=>{ if(x.type===t) n+=x.count; }); return n; };
    window.__laden=t=>bb.allLevels().reduce((a,l)=>a+(l.type===t?l.count:0),0);
    window.__auf=(pos,gr)=>{ S.bestNr=(S.bestNr|0)+1; const b={id:S.bestNr,pos:pos.map(([t,n])=>({t,n,g:0})),gr:gr||bb.vsKlasse(pos.map(([t,n])=>({t,n}))),st:'offen',tag:S.day};
      b.wert=+pos.reduce((a,[t,n])=>a+n*Math.min(S.prices[t],bb.marketOf(t)*1.3),0).toFixed(2); S.bestellungen.push(b); S.offen=S.bestellungen.length; return b; };
    window.__wand=(x,z)=>bb.colliders.some(c=>x>c.minX+0.05&&x<c.maxX-0.05&&z>c.minZ+0.05&&z<c.maxZ-0.05);
  }; });
  await hilfen();
  /* Aufbau: Hallen, Packstation, Onlineshop, drei Lagerregale, Ladenregale */
  await p.evaluate(()=>{ const bb=window.__bb, S=bb.S;
    S.level=30; S.money=9e6; S.lic=bb.LIZENZEN.map(l=>l.id);
    ['shop_halb','lager','lager_nord','lager_gross','packstation','onlineshop'].forEach(id=>bb.testKauf(id)); S.up.onlineshop=true;
    for(let i=0;i<3;i++) bb.regalStellen('rack');
    while(bb.shelves.length<2) bb.regalStellen('standard');
    bb.floorBoxes.slice().forEach(x=>bb.removeFloorBox(x));
    bb.allLevels().forEach(l=>{ while(l.count>0) bb.removeFromLevel(l); });
    bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box){ r.g.remove(s.box.mesh); s.box=null; } }));
    window.__hilfen();
  });

  /* 1. Groessen und Wagenkapazitaet */
  const kap=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    const K=bb.vsKlasse;
    o.klassen=[K([{t:'boeller',n:3}]),K([{t:'raketen',n:1}]),K([{t:'batterie49',n:1}]),K([{t:'batterie100',n:1}]),K([{t:'profi',n:1}])].join(',');
    const lager=(t,n)=>{ const s=bb.racks.flatMap(r=>r.slots).find(s=>!s.box); bb.putInSlot(s,t,n,1); };
    lager('boeller',16); lager('boeller',16); lager('raketen',6); lager('batterie100',2); lager('batterie100',2);
    const plan=list=>{ S.bestellungen=[]; list.forEach(([pos,gr])=>window.__auf(pos,gr)); const pl=bb.vsPlan(); const r=pl?pl.auf.length:0; S.bestellungen=[]; S.offen=0; return r; };
    o.klein=plan(Array.from({length:8},()=>[[['boeller',1]],1]));
    o.gross=plan(Array.from({length:3},()=>[[['raketen',1]],3]));
    o.riesig=plan(Array.from({length:2},()=>[[['batterie100',1]],6]));
    o.misch=plan([[[['raketen',1]],3],[[['boeller',1]],1],[[['boeller',1]],1],[[['boeller',1]],1],[[['boeller',1]],1]]);
    /* ohne Ware wird nichts geplant */
    o.ohneWare=plan([[[['kugel300',1]],6]]);
    return o; });
  console.log('KAPAZITAET',JSON.stringify(kap));
  /* seit 25.09. sind die Batterien viel groesser - der 49er braucht
     jetzt das riesige Paket */
  pruef('GROESSE',kap.klassen==='1,3,6,6,6','Paketgroessen falsch: '+kap.klassen);
  pruef('WAGEN',kap.klein===6&&kap.gross===2&&kap.riesig===1&&kap.misch===4,'Wagen fasst nicht 6 klein / 2 gross / 1 riesig: '+JSON.stringify(kap));
  pruef('WAGEN',kap.ohneWare===0,'Bestellung ohne Ware wurde auf den Wagen geplant');

  /* 2. Tour: Lager zuerst, Laden nur fuer das, was im Lager fehlt */
  const tour=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    /* Wunderkerzen im Lager UND im Laden, Sekt nur im Laden */
    const s=bb.racks.flatMap(r=>r.slots).find(s=>!s.box); bb.putInSlot(s,'wunder',36,1);
    const lvW=bb.emptyLevel('wunder'); for(let i=0;i<10;i++) bb.addToLevel(lvW,'wunder',1);
    const lvS=bb.emptyLevel('kindersekt'); for(let i=0;i<8;i++) bb.addToLevel(lvS,'kindersekt',1);
    const T=['boeller','raketen','batterie100','wunder','kindersekt'];
    const v0={}; T.forEach(t=>v0[t]={lager:window.__lager(t),laden:window.__laden(t)});
    const B=[window.__auf([['boeller',3],['wunder',2]]),window.__auf([['kindersekt',2]]),window.__auf([['raketen',1],['boeller',2]]),window.__auf([['wunder',4]]),window.__auf([['batterie100',1]])];
    const soll={}; B.forEach(b=>b.pos.forEach(l=>soll[l.t]=(soll[l.t]||0)+l.n));
    /* das erste Stapelfeld ist schon voll: neue Pakete muessen daran vorbei */
    S.paketGr=Array(30).fill(1); S.pakete=30; bb.syncPakete();
    const tischRect=[[-1.32,1.32,-0.47,0.47],[1.3,3.62,-0.34,0.34]];
    const imTisch=(x,z)=>{ const g=bb.packTisch, sn=Math.sin(g.rotation.y), cs=Math.cos(g.rotation.y), dx=x-g.position.x, dz=z-g.position.z;
      const lx=dx*cs-dz*sn, lz=dx*sn+dz*cs; return tischRect.some(r=>lx>r[0]&&lx<r[1]&&lz>r[2]&&lz<r[3]); };
    let wagenTisch=0, handMax=0, handN=0, durchStapel=0, stapelInfo=[], handL=[];
    const hand=new THREE.Vector3(), bx=new THREE.Box3(), by=new THREE.Box3();
    const wert=+B.reduce((a,b)=>a+b.wert,0).toFixed(2), geld0=S.money;
    S.staff.packer=true; bb.hireStaff('packer'); const w=bb.staff.packer;
    let maxWagen=0, felder=0, offenAufWagen=false, griffe=[], weitMax=0, wandTreffer=[], wagenWand=0, zu=null, stapelHoch=0, flugSeen=new Set(), zustand=new Set(), ladenGriff=null, lagerGriffe=0;
    for(let i=0;i<24000;i++){
      bb.step(0.05);
      zustand.add(w.vs);
      const auf=bb.vsWagen.children.filter(c=>c.userData&&c.userData.klappen);
      maxWagen=Math.max(maxWagen,auf.length);
      felder=Math.max(felder,auf.reduce((a,c)=>a+c.userData.gr,0));
      if(w.vs==='greifen'&&auf.some(c=>Math.abs(c.userData.klappen[2].pv.rotation.z)>1.5)) offenAufWagen=true;
      if(w.flug&&!flugSeen.has(w.flug)){ flugSeen.add(w.flug);
        const d=Math.hypot(w.flug.von.x-w.pos.x,w.flug.von.z-w.pos.z); weitMax=Math.max(weitMax,d);
        griffe.push(w.flug.s.kind+':'+w.flug.s.t+':'+d.toFixed(2));
        if(w.flug.s.kind==='level'){ ladenGriff=ladenGriff||{t:w.flug.s.t,x:+w.pos.x.toFixed(2),z:+w.pos.z.toFixed(2)}; } else lagerGriffe++; }
      if(window.__wand(w.pos.x,w.pos.z)) wandTreffer.push(w.vs+'@'+w.pos.x.toFixed(2)+','+w.pos.z.toFixed(2));
      /* der Wagen faehrt nie durch Tisch oder Rollenbahn */
      if(bb.vsWagen.parent===bb.scene){ const g=bb.vsWagen; for(const [cx,cz] of [[0.35,0.47],[-0.35,0.47],[0.35,-0.47],[-0.35,-0.47],[0,0]]){
        const s2=Math.sin(g.rotation.y), c2=Math.cos(g.rotation.y); if(imTisch(g.position.x+cx*c2+cz*s2,g.position.z-cx*s2+cz*c2)) { wagenTisch++; break; } } }
      /* beim Schieben liegen die Haende am Buegel */
      if(w.vs==='fahren'&&bb.vsWagen.userData.modus==='schieben'&&bb.vsWagen.userData.t>=1&&w.moving&&w.armX&&Math.abs(w.armX[0]+0.35)<0.03){
        bb.scene.updateMatrixWorld(true);
        for(const arm of w.g.userData.arms){ const fa=arm.children.find(c=>c.isGroup); hand.set(0,-0.26,0); fa.localToWorld(hand); bb.vsWagen.worldToLocal(hand);
          const d=Math.hypot(hand.y-(0.78+0.32),hand.z+0.49); handMax=Math.max(handMax,d); handN++; if(handL.length<3) handL.push([+hand.x.toFixed(3),+hand.y.toFixed(3),+hand.z.toFixed(3)]); } }
      /* kein Paket fliegt durch einen fertigen Stapel */
      for(const e of bb.vsBahn) if(e.phase==='heben'){ bx.setFromObject(e.m).expandByScalar(-0.01);
        for(const m of bb.pakete){ by.setFromObject(m); if(bx.intersectsBox(by)){ durchStapel++; if(stapelInfo.length<4) stapelInfo.push({t:+e.t.toFixed(2),gr:e.gr,von:[+bx.min.x.toFixed(2),+bx.min.y.toFixed(2),+bx.min.z.toFixed(2),+bx.max.x.toFixed(2),+bx.max.y.toFixed(2),+bx.max.z.toFixed(2)],mit:[+by.min.x.toFixed(2),+by.min.y.toFixed(2),+by.min.z.toFixed(2),+by.max.x.toFixed(2),+by.max.y.toFixed(2),+by.max.z.toFixed(2)]}); break; } } }
      if(bb.vsTisch&&bb.vsTisch.phase==='etikett'&&!zu){ const u=bb.vsTisch.pk.userData;
        zu={klappe:Math.max(...u.klappen.map(k=>Math.abs(k.pv.rotation.x)+Math.abs(k.pv.rotation.z))),band:u.band.visible?+u.band.scale.z.toFixed(2):0}; }
      stapelHoch=Math.max(stapelHoch,...bb.pakete.map(m=>m.position.y));
      if(!S.bestellungen.length&&!bb.vsBahn.length&&!bb.vsTisch&&w.vs==='bereit') { o.sek=+(i*0.05).toFixed(1); break; }
    }
    const v1={}; T.forEach(t=>v1[t]={lager:window.__lager(t),laden:window.__laden(t)});
    o.soll=soll; o.v0=v0; o.v1=v1;
    o.weg={}; T.forEach(t=>o.weg[t]=(v0[t].lager+v0[t].laden)-(v1[t].lager+v1[t].laden));
    o.wunderLadenWeg=v0.wunder.laden-v1.wunder.laden; o.sektLadenWeg=v0.kindersekt.laden-v1.kindersekt.laden;
    o.geld=+(S.money-geld0).toFixed(2); o.wert=wert;
    o.maxWagen=maxWagen; o.felder=felder; o.offen=offenAufWagen; o.weitMax=+weitMax.toFixed(2); o.griffe=griffe.length; o.griffListe=griffe.slice(0,40);
    o.wand=wandTreffer.slice(0,6); o.wandN=wandTreffer.length; o.zu=zu; o.stapelHoch=+stapelHoch.toFixed(2);
    o.pakete=S.pakete; o.meshes=bb.pakete.length; o.rest=S.bestellungen.length; o.ladenGriff=ladenGriff; o.lagerGriffe=lagerGriffe;
    o.zustaende=[...zustand].join(',');
    o.wagenTisch=wagenTisch; o.handMax=+handMax.toFixed(3); o.handN=handN; o.durchStapel=durchStapel; o.stapelInfo=stapelInfo; o.handL=handL;
    /* Pakete liegen in den Stapelfeldern */
    const F=bb.VS_FELD; o.aufFeld=bb.pakete.every(m=>F.some(f=>Math.abs(m.position.x-f.x)<0.5&&Math.abs(m.position.z-f.z)<0.36));
    o.imTisch=bb.pakete.every(m=>m.parent===bb.packTisch);
    return o; });
  console.log('TOUR     ',JSON.stringify(tour));
  const summe=Object.values(tour.soll).reduce((a,n)=>a+n,0);
  pruef('BESTAND',Object.keys(tour.soll).every(t=>tour.weg[t]===tour.soll[t]),'Bestand sinkt nicht genau um den Inhalt: soll '+JSON.stringify(tour.soll)+' weg '+JSON.stringify(tour.weg));
  pruef('STUECK',tour.griffe===summe,'nicht Stueck fuer Stueck: '+tour.griffe+' Griffe fuer '+summe+' Stueck');
  pruef('GREIFEN',tour.weitMax<=1.7,'gegriffen aus '+tour.weitMax+' m Entfernung - er steht nicht an der Quelle');
  pruef('LAGER',tour.wunderLadenWeg===0,'Wunderkerzen aus dem Laden, obwohl das Lager genug hat ('+tour.wunderLadenWeg+')');
  pruef('LADEN',tour.sektLadenWeg===2&&tour.ladenGriff&&tour.ladenGriff.x>-8,'Kindersekt (nur im Laden) nicht im Laden geholt: '+JSON.stringify(tour.ladenGriff));
  pruef('WAND',tour.wandN===0,'Mitarbeiter steht in einer Wand oder einem Regal: '+tour.wand.join(' '));
  pruef('WAGEN',tour.maxWagen>=1&&tour.felder<=6,'Wagen ueberladen: '+tour.felder+' Felder');
  pruef('OFFEN',tour.offen,'auf dem Wagen sind die Kartons nicht offen');
  pruef('ZU',tour.zu&&tour.zu.klappe<0.05&&tour.zu.band>=0.99,'am Tisch nicht zugeklappt und verklebt: '+JSON.stringify(tour.zu));
  pruef('TISCH',tour.wagenTisch===0,'der Wagen faehrt durch Tisch oder Rollenbahn ('+tour.wagenTisch+' Bilder)');
  pruef('HAENDE',tour.handN>0&&tour.handMax<0.1,'die Haende liegen beim Schieben nicht am Buegel: '+tour.handMax+' m daneben');
  pruef('FLUG',tour.durchStapel===0,'Pakete fliegen durch den fertigen Stapel ('+tour.durchStapel+' Bilder)');
  pruef('STAPEL',tour.pakete===35&&tour.meshes===35&&tour.aufFeld&&tour.imTisch,'Pakete nicht auf der Ablage gestapelt: '+JSON.stringify({p:tour.pakete,m:tour.meshes,feld:tour.aufFeld,tisch:tour.imTisch}));
  pruef('GELD',Math.abs(tour.geld-tour.wert)<0.02,'gebucht '+tour.geld+' statt '+tour.wert);
  pruef('FERTIG',tour.rest===0,'Bestellungen bleiben liegen: '+tour.rest);

  /* Bild: Mitarbeiter greift ins Regal, Karton offen auf dem Wagen */
  if(pre){
    await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, w=bb.staff.packer;
      const s=bb.racks.flatMap(r=>r.slots).find(s=>!s.box); bb.putInSlot(s,'monsterboeller',20,1);
      window.__auf([['monsterboeller',4]]); window.__auf([['monsterboeller',3]]); window.__auf([['batterie100',1]]);
      for(let i=0;i<6000&&!(w.vs==='greifen'&&w.flug&&w.flug.t>0.5);i++) bb.step(0.05);
      document.querySelectorAll('#hud,.tip,#tip,#zielPfeil').forEach(e=>e.style.display='none');
      const V=w.pos, ry=w.g.rotation.y, cx=V.x+Math.sin(ry+2.0)*2.3, cz=V.z+Math.cos(ry+2.0)*2.3;
      bb.setView(cx,cz,Math.atan2(cx-V.x,cz-V.z),-0.22); bb.renderFrame(1/60); });
    await p.screenshot({path:pre+'_greifen.png'});
    await p.evaluate(()=>{ const bb=window.__bb, S=bb.S;
      for(let i=0;i<9000&&(S.bestellungen.length||bb.vsBahn.length||bb.vsTisch);i++) bb.step(0.05); });
  }

  /* 3. Speichern mitten in der Tour */
  const sp=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, w=bb.staff.packer, o={};
    const s=bb.racks.flatMap(r=>r.slots).find(s=>!s.box); bb.putInSlot(s,'boeller',16,1);
    window.__auf([['boeller',5]]); window.__auf([['boeller',4]]);
    o.lager0=window.__lager('boeller');
    /* mitten im Flug speichern: das Stueck hat das Regal verlassen,
       ist aber noch nicht im Karton gelandet */
    for(let i=0;i<6000&&!(w.vs==='greifen'&&w.flug&&w.flug.t>0.2&&S.bestellungen.some(b=>b.pos.some(l=>l.g>0)));i++) bb.step(0.05);
    o.imFlug=!!w.flug;
    o.g=S.bestellungen.map(b=>b.pos.map(l=>l.g).join('/')).join(' ');
    o.st=S.bestellungen.map(b=>b.st).join(',');
    o.lager=window.__lager('boeller'); o.pakete=S.pakete;
    bb.save(); return o; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  await hilfen(); await p.evaluate(()=>window.__hilfen());
  const gl=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    o.g=S.bestellungen.map(b=>b.pos.map(l=>l.g).join('/')).join(' ');
    o.st=S.bestellungen.map(b=>b.st).join(',');
    o.pakete=S.pakete; o.meshes=bb.pakete.length;
    o.aufWagen=bb.vsWagen.children.filter(c=>c.userData&&c.userData.klappen).length;
    o.geparkt=bb.vsWagen.parent===bb.packTisch;
    let n=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type==='boeller') n+=s.box.count; })); o.lager=n;
    /* und danach wird fertig gepackt */
    const w=bb.staff.packer;
    for(let i=0;i<8000&&(S.bestellungen.length||bb.vsBahn.length||bb.vsTisch);i++) bb.step(0.05);
    o.danachRest=S.bestellungen.length;
    let m=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type==='boeller') m+=s.box.count; })); o.lagerDanach=m;
    return o; });
  console.log('SPEICHERN',JSON.stringify({vorher:sp,nachher:gl}));
  pruef('SPEICHERN',sp.imFlug,'Speichern nicht mitten im Flug getestet');
  pruef('SPEICHERN',gl.g===sp.g&&/^offen(,offen)*$/.test(gl.st)&&gl.aufWagen===0&&gl.geparkt&&gl.pakete===sp.pakete&&gl.meshes===Math.min(gl.pakete,gl.meshes)&&gl.lager===sp.lager,'Tour geht beim Laden verloren oder doppelt: '+JSON.stringify({sp,gl}));
  /* Bilanz gegen den Bestand VOR der Tour: genau 9 Boeller weg, keiner mehr, keiner weniger */
  pruef('SPEICHERN',gl.danachRest===0&&gl.lagerDanach===sp.lager0-9,'Stueck geht beim Speichern verloren oder doppelt: vorher '+sp.lager0+', nachher '+gl.lagerDanach+' (soll '+(sp.lager0-9)+')');

  /* 4. Kuendigen mitten in der Tour */
  const kd=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, w=bb.staff.packer, o={};
    const s=bb.racks.flatMap(r=>r.slots).find(s=>!s.box); bb.putInSlot(s,'wunder',36,1);
    window.__auf([['wunder',3]]);
    for(let i=0;i<4000&&w.vs!=='greifen';i++) bb.step(0.05);
    o.vorher=w.vs;
    S.staff.packer=false; bb.fireStaff('packer');
    o.st=S.bestellungen.map(b=>b.st).join(','); o.aufWagen=bb.vsWagen.children.filter(c=>c.userData&&c.userData.klappen).length;
    o.geparkt=bb.vsWagen.parent===bb.packTisch; o.flug=bb.scene.children.length;
    return o; });
  console.log('KUENDIGEN',JSON.stringify(kd));
  pruef('KUENDIGEN',kd.vorher==='greifen'&&kd.st==='offen'&&kd.aufWagen===0&&kd.geparkt,'Kuendigung laesst Wagen oder Bestellung haengen: '+JSON.stringify(kd));

  /* 5. Ohne Mitarbeiter packt der Spieler am Tisch */
  const sp2=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    const vor=window.__lager('wunder'), geld=S.money, b=S.bestellungen[0];
    o.prompt=bb.promptFor({kind:'pack',ref:bb.packHit}); o.prompt=o.prompt&&o.prompt.t;
    bb.tuAktion('pack',bb.packHit);
    o.tisch=!!bb.vsTisch; o.lagerWeg=vor-window.__lager('wunder');
    let zu=false;
    for(let i=0;i<400&&(bb.vsTisch||bb.vsBahn.length);i++){ bb.step(0.05); if(bb.vsTisch&&bb.vsTisch.phase==='kleben') zu=true; }
    o.zu=zu; o.geld=+(S.money-geld).toFixed(2); o.wert=b?b.wert:null; o.rest=S.bestellungen.length;
    return o; });
  console.log('SPIELER  ',JSON.stringify(sp2));
  pruef('SPIELER',/Paket packen/.test(sp2.prompt||'')&&sp2.tisch&&sp2.lagerWeg===3&&sp2.zu&&Math.abs(sp2.geld-sp2.wert)<0.02&&sp2.rest===0,'Spieler packt am Tisch nicht richtig: '+JSON.stringify(sp2));

  /* 5b. Was auf dem Wagen verplant ist, packt der Spieler nicht weg */
  const res=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box&&s.box.type==='monsterboeller'){ r.g.remove(s.box.mesh); s.box=null; } }));
    bb.allLevels().forEach(l=>{ if(l.type==='monsterboeller') while(l.count>0) bb.removeFromLevel(l); });
    const s=bb.racks.flatMap(r=>r.slots).find(s=>!s.box); bb.putInSlot(s,'monsterboeller',5,1);
    S.bestellungen=[]; const A=window.__auf([['monsterboeller',5]]); const B=window.__auf([['monsterboeller',3]]);
    A.st='wagen';
    o.spieler=bb.vsSpielerBestellung(); o.spieler=o.spieler?o.spieler.id:null;
    o.packOne=bb.packOne(true);
    o.prompt=(bb.promptFor({kind:'pack',ref:bb.packHit})||{}).t;
    S.bestellungen=[]; S.offen=0; return o; });
  console.log('RESERVIERT',JSON.stringify(res));
  pruef('RESERVIERT',res.spieler===null&&res.packOne===false,'der Spieler packt Ware weg, die auf dem Wagen verplant ist: '+JSON.stringify(res));

  /* 6. Einraeumer nimmt dem Packer den Karton nicht weg */
  const er=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.staff.packer=true; bb.hireStaff('packer'); S.staff.auffueller=true; bb.hireStaff('auffueller');
    const lv=bb.emptyLevel('boeller'); o.fach=!!lv;
    const sl=bb.racks.flatMap(r=>r.slots).filter(s=>s.box&&s.box.type==='boeller');
    bb.staff.packer.src={slot:sl[0]};
    const e=bb.einrOf('auffueller'); e.reihe=['regal','direkt','lager']; e.aus={};
    const j=bb.einrJob(bb.staff.auffueller);
    o.anderer=!!j&&j.slot!==sl[0]; o.slots=sl.length;
    bb.staff.packer.src=null;
    return o; });
  console.log('EINRAEUMER',JSON.stringify(er));
  pruef('EINRAEUMER',er.slots<2||er.anderer,'Einraeumer greift den Karton, zu dem der Packer faehrt');

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?(errs.concat(mangel)).join('\n'):'keine');
  await b.close();
})();

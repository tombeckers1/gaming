/* Boeller (Toms PDF vom 25.09.): alle alten Boeller und der Heuler
   sind raus, dafuer gibt es drei neue - Furzboeller (Pups und Wolke),
   Monster Boeller (extrem laut) und Atombomben-Boeller (steigt auf,
   riesiger Pilz). Gemessen: Sortiment, Lautstaerke am Ausgang, Hoehe
   und Groesse des Pilzes, Aufraeumen, alte Spielstaende. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  /* Sortiment */
  const sort=await p.evaluate(()=>{ const bb=window.__bb, P=bb.P;
    const ALT=['kanonen','grossboeller','sprengmeister','xxlpolen','doppelschlag','heuler'];
    const NEU=['boeller','monsterboeller','atomboeller'];
    const tubes=Object.keys(P).filter(t=>P[t].shape==='tubepack');
    return {alt:ALT.filter(t=>P[t]||bb.LIZENZEN.some(l=>l.items.includes(t))||bb.VOLA[t]!==undefined||Object.values(bb.GRUPPE).some(g=>g.includes(t))),
      tubes, namen:NEU.map(t=>P[t]&&P[t].name), lvl:NEU.map(t=>P[t]&&P[t].lvl), preis:NEU.map(t=>P[t]&&P[t].market),
      lizenz:NEU.map(t=>bb.lizenzOf(t)), gruppe:NEU.every(t=>bb.GRUPPE.boeller.includes(t)), vola:NEU.every(t=>bb.VOLA[t]>0)}; });
  console.log('SORTIMENT',JSON.stringify(sort));
  pruef('SORTIMENT',!sort.alt.length,'alte Sorten noch da: '+sort.alt);
  pruef('SORTIMENT',JSON.stringify(sort.tubes.sort())===JSON.stringify(['atomboeller','boeller','monsterboeller']),'Boeller sind nicht genau die drei neuen: '+sort.tubes);
  pruef('SORTIMENT',/Furz/.test(sort.namen[0])&&/Monster/.test(sort.namen[1])&&/Atom/.test(sort.namen[2]),'Namen: '+sort.namen);
  pruef('SORTIMENT',sort.lvl[0]<sort.lvl[1]&&sort.lvl[1]<sort.lvl[2]&&sort.preis[0]<sort.preis[1]&&sort.preis[1]<sort.preis[2],'keine Steigerung: '+sort.lvl+' / '+sort.preis);
  pruef('SORTIMENT',sort.lizenz.every(Boolean)&&sort.gruppe&&sort.vola,'Lizenz, Gruppe oder Markt fehlt');

  /* Lautstaerke: Spitze am Ausgang (vor der Musik), echte Zeit */
  const laut=await p.evaluate(async()=>{ const bb=window.__bb, S=bb.S; S.level=40; S.money=1e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    if(bb.MUSIK.an) bb.musikAn();
    const ac=bb.ac(); if(ac.state!=='running') await ac.resume();
    /* lueckenlos mitschreiben: ein AudioWorklet laeuft im Audio-Thread
       und verliert keinen Block, auch wenn das Bild gerade haengt (der
       ScriptProcessor auf dem Haupt-Thread liess Bloecke aus) */
    const code="class M extends AudioWorkletProcessor{constructor(){super();this.s=0;this.e=0;this.port.onmessage=m=>{this.port.postMessage([this.s,this.e]);if(m.data==='reset'){this.s=0;this.e=0;}};}process(i){const d=i[0]&&i[0][0];if(d)for(let k=0;k<d.length;k++){const x=d[k];if(x>this.s)this.s=x;else if(-x>this.s)this.s=-x;this.e+=x*x/sampleRate;}return true;}}registerProcessor('mess',M);";
    await ac.audioWorklet.addModule('data:application/javascript;base64,'+btoa(code));
    const wn=new AudioWorkletNode(ac,'mess'), stumm=ac.createGain(); stumm.gain.value=0;
    bb.master.connect(wn); wn.connect(stumm); stumm.connect(ac.destination);
    const frage=m=>new Promise(r=>{ wn.port.onmessage=e=>r(e.data); wn.port.postMessage(m); });
    const mess={spitze:0,energie:0};
    const o={};
    /* Kamera wie am Pult: gut zehn Meter vor den Stationen */
    const T=bb.STATION_POS.tisch; bb.setView(T.x,T.z+10,0,0.2);
    /* Spielzeit und Klang laufen getrennt: die Schleife zaehlt Spielzeit,
       am Ende wartet sie, bis der letzte Nachhall durch ist */
    const miss=async(t,sek)=>{ await new Promise(r=>setTimeout(r,300)); await frage('reset'); bb.igniteType(t);
      for(let i=0;i<sek*20;i++){ await new Promise(r=>setTimeout(r,50)); bb.run(0.05,0.05); }
      await new Promise(r=>setTimeout(r,2500));
      const [sp,en]=await frage('lesen'); const r={spitze:+sp.toFixed(3),energie:+en.toFixed(4)};
      bb.run(3,0.05); return r; };
    const zaehl={}; for(const k of ['pups','monster','atom','boom']){ const f=bb.sfx[k]; bb.sfx[k]=v=>{ zaehl[k]=(zaehl[k]||0)+1; return f(v); }; }
    o.furz=await miss('boeller',2.5);
    o.kugel=await miss('kugel150',5);
    o.monster=await miss('monsterboeller',2.5);
    o.atom=await miss('atomboeller',7);
    o.zaehl=zaehl; bb.master.disconnect(wn);
    return o; });
  console.log('LAUT    ',JSON.stringify(laut));
  pruef('LAUT',laut.zaehl.pups===1,'Furzboeller pupst nicht');
  pruef('LAUT',laut.zaehl.monster===1&&laut.monster.spitze>laut.kugel.spitze*1.25&&laut.monster.spitze>laut.furz.spitze*2,'Monster nicht deutlich lauter als eine 150er Kugel: '+JSON.stringify(laut));
  pruef('LAUT',laut.zaehl.atom===1&&laut.atom.energie>laut.monster.energie*1.5,'Atombombe ohne langes Grollen: '+JSON.stringify(laut));

  /* Atompilz: Hoehe, Groesse, Stiel bis zum Boden, raeumt auf */
  const pilz=await p.evaluate(()=>{ const bb=window.__bb, o={}; bb.run(14,0.05); o.vorher=bb.WOLKEN.length;
    const kinder0=bb.scene.children.length, log=[]; bb.fwLog(log);
    const T=bb.STATION_POS.tisch;
    bb.igniteType('atomboeller'); bb.run(1.9,0.05);
    o.steigt=bb.rockets.some(r=>r.eff==='atom');
    const alt=new Set(bb.WOLKEN), neu=()=>bb.WOLKEN.find(w=>!alt.has(w)); let knallY=null, w0=alt.size;
    for(let i=0;i<80&&!neu();i++){ const r=bb.rockets.find(r=>r.eff==='atom'); if(r) knallY=r.p.y; bb.run(0.05,0.05); }
    o.knallHoehe=+(knallY||0).toFixed(1); o.log=log.filter(x=>x.eff==='atom').length;
    const w=neu(); o.teile=w?w.teile.length:0; o.w0=w0; o.nW=bb.WOLKEN.length; o.raketen=bb.rockets.map(r=>r.eff+'@'+r.p.y.toFixed(1)+'/'+r.fuse.toFixed(2)); if(!w){ bb.fwLog(null); o.nach6={}; return o; }
    const mass=()=>{ let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const sp of w.teile) if(sp.visible&&sp.material.opacity>0.2&&sp.position.y>2){
        x0=Math.min(x0,sp.position.x-sp.scale.x/2); x1=Math.max(x1,sp.position.x+sp.scale.x/2); y0=Math.min(y0,sp.position.y-sp.scale.y/2); y1=Math.max(y1,sp.position.y+sp.scale.y/2); }
      return {breite:+(x1-x0).toFixed(1),unten:+y0.toFixed(1),oben:+y1.toFixed(1)}; };
    bb.run(0.45,0.05); o.blitz=bb.shakeWert;
    bb.run(5.5,0.05); o.nach6=mass();
    bb.run(8,0.05); o.danach=bb.WOLKEN.length; o.kinderDiff=bb.scene.children.length-kinder0;
    bb.fwLog(null); return o; });
  console.log('PILZ    ',JSON.stringify(pilz));
  pruef('PILZ',pilz.steigt&&pilz.knallHoehe>20&&pilz.knallHoehe<34,'steigt nicht auf rund 27 m: '+pilz.knallHoehe);
  pruef('PILZ',pilz.teile>=100,'zu wenige Wolkenteile: '+pilz.teile);
  pruef('PILZ',pilz.nach6.breite>=22&&pilz.nach6.oben>=34&&pilz.nach6.unten<=4,'Pilz nicht gigantisch oder ohne Stiel: '+JSON.stringify(pilz.nach6));
  pruef('PILZ',pilz.blitz>1,'keine Erschuetterung');
  pruef('PILZ',pilz.vorher===0&&pilz.danach===0&&pilz.kinderDiff===0,'Pilz raeumt nicht auf: '+pilz.danach+' / '+pilz.kinderDiff);

  /* Monster und Furz: Wolken, die wieder verschwinden */
  const wolk=await p.evaluate(()=>{ const bb=window.__bb; const n0=bb.scene.children.length;
    bb.igniteType('monsterboeller'); bb.igniteType('boeller'); bb.run(1.7,0.05); const w=bb.WOLKEN.length;
    bb.run(6,0.05); return {w,danach:bb.WOLKEN.length,diff:bb.scene.children.length-n0}; });
  console.log('WOLKEN  ',JSON.stringify(wolk));
  pruef('WOLKEN',wolk.w===2&&wolk.danach===0&&wolk.diff===0,'Monster- und Furzwolke: '+JSON.stringify(wolk));

  /* Alter Spielstand mit alten Boellern */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.money=1e5; bb.testKauf('REGAL:standard'); bb.save();
    window.addEventListener('visibilitychange',e=>e.stopImmediatePropagation(),true);
    const K='boellerbude_v3', d=JSON.parse(localStorage.getItem(K));
    d.shelves[0].levels[0]={type:'kanonen',count:4,q:1}; d.shelves[0].levels[1]={type:'xxlpolen',count:2,q:1};
    d.boxes=(d.boxes||[]).concat([{type:'heuler',count:6,q:1,x:-3,y:0.2,z:0,ry:0}]);
    d.carrying={type:'sprengmeister',count:1,q:1}; d.cart=[{t:'doppelschlag',n:2}];
    d.prices.kanonen=7.99; d.stat=d.stat||{};
    localStorage.setItem(K,JSON.stringify(d)); });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button'); await p.waitForTimeout(400);
  const alt=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; const lv=bb.shelves[0].levels;
    return {l0:[lv[0].type,lv[0].count],l1:[lv[1].type,lv[1].count],kartons:bb.floorBoxes.map(x=>x.type),hand:S.carrying&&S.carrying.type,
      korb:S.cart.map(l=>l.t),preisAlt:'kanonen' in S.prices,preisNeu:S.prices.monsterboeller}; });
  console.log('ALTSTAND',JSON.stringify(alt));
  pruef('ALTSTAND',alt.l0[0]==='monsterboeller'&&alt.l0[1]>0&&alt.l1[0]==='atomboeller','Regal nicht umgestellt: '+JSON.stringify(alt));
  pruef('ALTSTAND',alt.kartons.includes('boeller')&&alt.hand==='atomboeller'&&alt.korb[0]==='monsterboeller','Karton, Hand oder Korb nicht umgestellt: '+JSON.stringify(alt));
  pruef('ALTSTAND',!alt.preisAlt&&alt.preisNeu>10,'Preise: '+JSON.stringify(alt));

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

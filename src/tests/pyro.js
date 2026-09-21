/* Feuerwerk: Effektbibliothek, Kugelbomben, Moerserbatterie */
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
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ const x=m.text(); if(m.type()==='error'&&x.indexOf('ERR_')<0) errs.push('CONSOLE: '+x); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);

  /* --- Effektbibliothek --- */
  const eff=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.anzahl=bb.EFF_ALL.length;
    o.namen=bb.EFF_ALL.slice().sort();
    o.klein=bb.EFF_KLEIN.length; o.gross=bb.EFF_GROSS.length; o.pro=bb.EFF_PRO.length;
    o.alleListenGueltig=[].concat(bb.EFF_KLEIN,bb.EFF_GROSS,bb.EFF_PRO).every(e=>typeof bb.EFF[e]==='function');
    /* jeder Effekt muss Partikel erzeugen und darf nicht werfen */
    const leben=()=>{ let n=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let i=0;i<ps.life.length;i++) if(ps.life[i]>0) n++; return n; };
    const A=[1,.2,.2], B=[.2,.6,1], tot=[];
    bb.EFF_ALL.forEach(e=>{
      const vor=leben();
      try{ bb.EFF[e]({x:0,y:30,z:-30},A,B,1.2); }catch(err){ tot.push(e+': '+err.message); return; }
      bb.run(0.2,0.05);
      if(leben()-vor<10) tot.push(e+': zu wenig Partikel');
      bb.run(7,0.05);
    });
    o.defekt=tot;
    return o;
  });
  console.log('EFFEKTE',JSON.stringify(eff));

  /* --- Moerserbatterie --- */
  const st=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.stationen=Object.keys(bb.stations).sort();
    o.moerserDa=!!bb.stations.moerser;
    o.kapazitaet=bb.stations.moerser?bb.stations.moerser.cap:0;
    o.routing={kugel75:bb.stationOf('kugel75'),kugel100:bb.stationOf('kugel100'),kugel150:bb.stationOf('kugel150'),
               raketen:bb.stationOf('raketen'),boeller:bb.stationOf('boeller')};
    /* Kugelbombe aufstellen und zuenden */
    bb.S.level=30; bb.S.money=300000; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    bb.S.carrying={type:'kugel150',count:3,q:1};
    bb.placeOnStation(bb.stations.moerser);
    o.aufgestellt=bb.stations.moerser.items.length;
    o.falscheWareBlockiert=(()=>{ bb.S.carrying={type:'boeller',count:1,q:1};
      const v=bb.stations.moerser.items.length; bb.placeOnStation(bb.stations.moerser);
      return bb.stations.moerser.items.length===v; })();
    bb.S.carrying=null;
    return o;
  });
  console.log('MOERSER',JSON.stringify(st));

  /* --- steht die Moerserbatterie sauber auf dem Hof? --- */
  const geo=await p.evaluate(()=>{
    const bb=window.__bb, M=bb.STATION_POS.moerser, o={};
    o.pos={x:M.x,z:M.z};
    /* Hofbelag liegt bei x -2..8, z -15..-6 */
    o.aufDemHof=M.x-1.4>-2&&M.x+1.4<8&&M.z-1.0>-15&&M.z+1.0<-6;
    /* Abstand zu den anderen Stationen und zum Zuendpult */
    const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
    o.abstandRampe=+d(M,bb.STATION_POS.rampe).toFixed(2);
    o.abstandTisch=+d(M,bb.STATION_POS.tisch).toFixed(2);
    o.abstandPult=+Math.hypot(M.x-5.9,M.z+8.2).toFixed(2);
    o.frei=o.abstandRampe>2.5&&o.abstandTisch>2.5&&o.abstandPult>2.5;
    /* nichts darf im Rohrbereich in der Luft haengen */
    let tiefstes=99;
    bb.stations.moerser.g.traverse(m=>{ if(m.geometry&&m.geometry.parameters) tiefstes=Math.min(tiefstes,m.position.y); });
    o.tiefstesTeil=+tiefstes.toFixed(2);
    o.stehtAufDemBoden=tiefstes<0.2;
    return o;
  });
  console.log('AUFSTELLUNG',JSON.stringify(geo));

  /* --- Kugelbomben zuenden: Aufstieg, Hauptbruch, Nachbrueche --- */
  const kb=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const leben=()=>{ let n=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let i=0;i<ps.life.length;i++) if(ps.life[i]>0) n++; return n; };
    const pad={x:4.6,y:1.7,z:-12.8};
    ['kugel75','kugel100','kugel150'].forEach((t,i)=>{
      const kal=i+1;
      bb.run(9,0.05);
      const vorher=leben();
      bb.kugelbombe(pad,kal);
      bb.run(0.3,0.05);
      o['muendung'+kal]=leben()-vorher>40;
      bb.run(1.0,0.05);
      o['steigt'+kal]=bb.rockets.length>0;
      bb.run(1.6,0.05);
      const nachBruch=leben();
      o['bruch'+kal]=nachBruch;
      /* direkt nach dem Hauptbruch messen, die Tochterbomben gehen ab 0,45 s auf */
      let spitze=0;
      for(let k=0;k<26;k++){ bb.run(0.1,0.05); spitze=Math.max(spitze,leben()); }
      o['nachbrueche'+kal]=spitze;
      bb.run(8,0.05);
    });
    o.kleinerAlsGross=o.bruch1<o.bruch3;
    o.mehrBruecheBeiGroesseremKaliber=o.nachbrueche3>o.nachbrueche1&&o.nachbrueche2>o.nachbrueche1;
    bb.run(14,0.05);
    o.sauberAbgeraeumt=bb.rockets.length===0;
    return o;
  });
  console.log('KUGELBOMBE',JSON.stringify(kb));

  /* --- Sternenbrunnen: Fontaene, dann Aufstieg --- */
  const sb=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.run(10,0.05);
    bb.igniteType('sternenbrunnen');
    bb.run(1.0,0.05); o.fontaeneLaeuft=bb.emitters.some(e=>e.k==='fountain');
    bb.run(2.6,0.05); o.steigtAuf=bb.rockets.length>0;
    bb.run(2.0,0.05);
    let n=0; for(let i=0;i<bb.psBig.life.length;i++) if(bb.psBig.life[i]>0) n++;
    o.bluetePartikel=n;
    bb.run(12,0.05);
    o.leer=bb.rockets.length===0&&bb.emitters.length===0;
    return o;
  });
  console.log('STERNENBRUNNEN',JSON.stringify(sb));

  /* --- Batterien: Steigerung ueber die Produkte --- */
  const bat=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.laenge={};
    ['batterie16','batterie25','faecher','batterie49','batterie100','profi'].forEach(t=>{ o.laenge[t]=bb.showLength(t); });
    const wachsend=(a)=>a.every((v,i)=>i===0||v>=a[i-1]);
    o.laengeSteigt=wachsend(Object.values(o.laenge));
    /* Schusszahl je Drehbuch */
    o.schuesse={};
    ['batterie16','batterie25','faecher','batterie49','batterie100','profi'].forEach(t=>{
      o.schuesse[t]=bb.SHOWS[t]().reduce((a,ph)=>a+(ph.n||1),0); });
    o.schuesseSteigen=wachsend(Object.values(o.schuesse));
    /* Profi nutzt die Profi-Effekte und Kugelbomben */
    const pe=new Set(); let bomben=0;
    bb.SHOWS.profi().forEach(ph=>{ if(ph.bomb) bomben++; const e=ph.eff; (Array.isArray(e)?e:[e]).forEach(x=>x&&pe.add(x)); });
    o.profiBomben=bomben;
    o.profiHatKamuro=pe.has('kamuro'); o.profiHatSalut=pe.has('salut'); o.profiHatZeitregen=pe.has('zeitregen');
    o.kleineOhneKamuro=!bb.SHOWS.batterie16().some(ph=>String(ph.eff).indexOf('kamuro')>=0);
    /* eine ganze Profishow durchlaufen lassen */
    const t0=bb.timersLen();
    bb.igniteType('profi');
    bb.run(4,0.05);
    o.profiLaeuft=bb.timersLen()>t0;
    bb.run(140,0.05);
    o.profiFertig=bb.rockets.length===0&&bb.timersLen()<=t0+2;
    return o;
  });
  console.log('BATTERIEN',JSON.stringify(bat));

  /* --- Produktnamen und Lizenzen --- */
  const pr=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.neu=['kugel75','kugel100','kugel150','sternenbrunnen'].map(t=>bb.P[t]&&bb.P[t].name);
    o.imPaket=['kugel75','kugel100','kugel150','sternenbrunnen'].map(t=>bb.lizenzOf(t));
    for(let i=0;i<4;i++) bb.buyUp('shelf_standard');
    for(let i=0;i<2;i++) bb.buyUp('shelf_hoch');
    o.regale=bb.shelves.length;
    o.regalPlatz=['kugel75','kugel100','kugel150','sternenbrunnen'].map(t=>bb.shelfCapOf(t));
    o.einraeumbar=['kugel75','kugel100','kugel150','sternenbrunnen'].map(t=>!!bb.emptyLevel(t));
    o.produkte=Object.keys(bb.P).length;
    o.ohnePaket=Object.keys(bb.P).filter(t=>!bb.lizenzOf(t));
    o.namen=['batterie16','batterie49','batterie100','profi','kugel150'].map(t=>bb.P[t].name);
    return o;
  });
  console.log('PRODUKTE',JSON.stringify(pr));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

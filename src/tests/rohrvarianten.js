/* Die vier Rohr-Batterien (Tom, 01.10. abends) einzeln durchspielen:
   - am Laptop bestellbar (orderBox legt einen Karton in die Lieferung)
   - ins Verkaufsregal einraeumbar (addToLevel)
   - Verpackung: eigenes Modell mit Schusszahl, Raster wie auf der Packung
   - Testfeld: auf den Zuendtisch stellen (3D-Modell steht da), ueber
     den Kanal zuenden; jedes Rohr feuert genau einmal in fester Folge,
     0,2-0,4 s Abstand, das Modell bleibt stehen, bis es abgebrannt ist,
     und ist danach weg
   Aufruf: node rohrvarianten.js test.html
   Gegenprobe (01.10.): zuendAbstand in test.html auf 0,8 s gesetzt ->
   TAKT schlaegt bei allen vier an. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const SOLL={rb25:[25,'5x5'],rb49:[49,'7x7'],rb100:[100,'10x10'],rbfaecher:[30,'6x5']};
  const r=await p.evaluate(([SOLL])=>{ const bb=window.__bb, S=bb.S, P=bb.P, out=[];
    S.level=26; S.money=1e7;
    bb.regalStellen('standard'); bb.regalStellen('standard'); bb.regalStellen('standard');
    for(const t of Object.keys(SOLL)){
      const q=P[t], o={t};
      /* bestellbar, sobald das Lizenzpaket ihres Levels gekauft ist */
      o.lizenz=bb.lizenzOf(t); if(o.lizenz&&!S.lic.includes(o.lizenz)) S.lic.push(o.lizenz);
      o.da=!!q&&q.cat===2&&!q.noOrder&&bb.ORDER.includes(t);
      o.frei=bb.isUnlocked(t);
      const n0=bb.pendingListe().filter(x=>x.type===t).length; bb.orderBox(t,1,'fachhandel');
      o.bestellt=bb.pendingListe().filter(x=>x.type===t).length-n0;
      const lv=bb.emptyLevel?bb.emptyLevel(t):bb.allLevels().find(l=>!l.type);
      o.regal=!!lv&&bb.addToLevel(lv,t,1)&&bb.addToLevel(lv,t,1)?lv.count:0;
      const L=bb.rohrLayout(t); o.rohre=L.rohre.length; o.raster=L.cols+'x'+L.rows; o.schuss=bb.rohrBedarf(t).schuss;
      o.packung=/(\d+) Schuss/.exec(q.name)[1]|0;
      o.verpackung=!!bb.buildProduct(t)&&bb.istBatterie(t);
      /* Testfeld: auf den Zuendtisch, ueber den Kanal zuenden */
      for(let i=0;i<80&&(bb.rockets.length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
      bb.clearStations(); const st=bb.stations.tisch;
      S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st); S.carrying=null;
      const it=st.items[0]; o.modell=!!(it&&it.batt&&it.batt.g.parent);
      bb.ROHR_LOG=[];
      bb.zuendeKanal(it.kanal);
      const dauer=bb.brennDauer(t); let stehtNoch=true;
      for(let s=0;s<dauer-0.3;s+=0.05){ bb.run(0.05,0.05); if(!(it.batt&&it.batt.g.parent)) stehtNoch=false; }
      o.stehtBisEnde=stehtNoch;
      for(let s=0;s<1;s+=0.05) bb.run(0.05,0.05);
      o.weg=!st.items.includes(it)&&!(it.batt.g.parent);
      const log=bb.ROHR_LOG.filter(e=>e.i!==undefined); bb.ROHR_LOG=null;
      o.gefeuert=log.length; o.doppelt=log.length-new Set(log.map(e=>e.i)).size;
      o.folge=log.every((e,k)=>e.i===L.folge[k]);
      const g=[]; for(let k=1;k<log.length;k++) g.push(log[k].t-log[k-1].t);
      o.gmin=+Math.min(...g).toFixed(3); o.gmax=+Math.max(...g).toFixed(3);
      o.verkohlt=it.batt.verkohlt.size;
      out.push(o);
    }
    return out; },[SOLL]);
  const m=[];
  for(const x of r){ console.log(x.t.padEnd(10),JSON.stringify(x));
    const [n,ra]=SOLL[x.t];
    if(!x.da||!x.frei||x.bestellt!==1) m.push(`LAPTOP ${x.t}: bestellbar ${x.da}/${x.frei}/${x.bestellt}`);
    if(x.regal<2) m.push(`REGAL ${x.t}: ${x.regal} im Fach`);
    if(x.rohre!==n||x.schuss!==n||x.packung!==n||x.raster!==ra) m.push(`ROHRE ${x.t}: ${x.rohre} Rohre, ${x.schuss} Schuss, Packung ${x.packung}, Raster ${x.raster} (soll ${n}, ${ra})`);
    if(!x.verpackung) m.push(`VERPACKUNG ${x.t}`);
    if(!x.modell||!x.stehtBisEnde||!x.weg) m.push(`TISCH ${x.t}: Modell ${x.modell}, steht bis Ende ${x.stehtBisEnde}, danach weg ${x.weg}`);
    if(x.gefeuert!==n||x.doppelt||!x.folge) m.push(`ZUENDUNG ${x.t}: ${x.gefeuert}/${n}, doppelt ${x.doppelt}, Folge ${x.folge}`);
    if(x.gmin<0.149||x.gmax>0.451) m.push(`TAKT ${x.t}: ${x.gmin}-${x.gmax} s`);
    if(x.verkohlt!==n) m.push(`KOHLE ${x.t}: ${x.verkohlt}/${n} Rohre verkohlt`); }
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

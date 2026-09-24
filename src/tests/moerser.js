/* Moerser (Tom, 24.09.): jede Kugel in ihr Rohr - klein 75-100 mm,
   mittel 150 mm, gross 200-300 mm. Die Zuendschnur haengt an dem
   Rohr, in dem die Kugel steckt. Ist das Rohr belegt, gibt es eine
   Meldung statt eines falschen Rohrs.
   Aufruf: node moerser.js test.html */
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
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, st=bb.stations.moerser, M=bb.STATION_POS.moerser, o={};
    bb.S.level=30; bb.S.money=9e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    const stell=t=>{ const vor=st.items.length, tl=bb.toastLast; bb.S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st);
      const it=st.items.length>vor?st.items[st.items.length-1]:null; bb.S.carrying=null;
      return it?{slot:it.slot,kanal:it.kanal,x:+(it.modell.position.x-M.x).toFixed(2)}:{abgelehnt:bb.toastLast!==tl?bb.toastLast:''}; };
    o.gross=stell('kugel300'); o.klein=stell('kugel75'); o.mittel=stell('kugel150');
    o.zweiGross=stell('kugel200'); o.zweiKlein=stell('kugel100');
    o.schilder=bb.ROHR_KALIBER;
    return o; });
  console.log(JSON.stringify(r));
  const X=[-0.72,0,0.78];
  pruef('GROSS',r.gross.slot===2&&r.gross.kanal===15&&Math.abs(r.gross.x-X[2])<0.01,'300 mm nicht im grossen Rohr: '+JSON.stringify(r.gross));
  pruef('KLEIN',r.klein.slot===0&&Math.abs(r.klein.x-X[0])<0.01,'75 mm nicht im kleinen Rohr: '+JSON.stringify(r.klein));
  pruef('MITTEL',r.mittel.slot===1&&Math.abs(r.mittel.x-X[1])<0.01,'150 mm nicht im mittleren Rohr: '+JSON.stringify(r.mittel));
  pruef('BELEGT',r.zweiGross.abgelehnt&&/große Rohr/.test(r.zweiGross.abgelehnt)&&r.zweiKlein.abgelehnt&&/kleine Rohr/.test(r.zweiKlein.abgelehnt),'belegtes Rohr: '+JSON.stringify([r.zweiGross,r.zweiKlein]));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

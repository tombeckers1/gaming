/* Moerser (Tom, 24.09. und PDF vom 25.09.): jede Kugel in ihr Rohr, und
   das Rohr passt zur Kugel - klein 75-100 mm, mittel 150-200, gross 300.
   Vorher: klein 75-100 mm,
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
    o.zweiMittel=stell('kugel200'); o.zweiKlein=stell('kugel100');
    o.schilder=bb.ROHR_KALIBER;
    /* Passt die Kugel ins Rohr? Echte Groesse (Kaliber aus dem Namen)
       und hoechstens knapp drei Zentimeter Luft zu jeder Seite */
    o.passung=['kugel75','kugel100','kugel150','kugel200','kugel300'].map(t=>{ const sl=bb.moerserRohr(t), innen=bb.ROHR_INNEN[sl];
      const rk=Math.min(bb.KUGEL_R[t],innen*0.97), mm=+(/(\d+) mm/.exec(bb.P[t].name)||[0,0])[1];
      return {t,sl,innen,rk,luft:+(innen-rk).toFixed(3),echt:rk*2>=mm/1000,aussen:bb.MOERSER_R[sl]}; });
    return o; });
  console.log(JSON.stringify(r));
  const X=[-0.72,0,0.78];
  pruef('GROSS',r.gross.slot===2&&r.gross.kanal===3&&Math.abs(r.gross.x-X[2])<0.01,'300 mm nicht im grossen Rohr: '+JSON.stringify(r.gross));
  pruef('KLEIN',r.klein.slot===0&&r.klein.kanal===1&&Math.abs(r.klein.x-X[0])<0.01,'75 mm nicht im kleinen Rohr: '+JSON.stringify(r.klein));
  pruef('MITTEL',r.mittel.slot===1&&r.mittel.kanal===2&&Math.abs(r.mittel.x-X[1])<0.01,'150 mm nicht im mittleren Rohr: '+JSON.stringify(r.mittel));
  pruef('BELEGT',r.zweiMittel.abgelehnt&&/mittlere Rohr/.test(r.zweiMittel.abgelehnt)&&r.zweiKlein.abgelehnt&&/kleine Rohr/.test(r.zweiKlein.abgelehnt),'belegtes Rohr: '+JSON.stringify([r.zweiMittel,r.zweiKlein]));
  r.passung.forEach(x=>pruef('PASSUNG',x.echt&&x.rk<x.innen&&x.luft<=0.03,`${x.t} im Rohr ${x.sl}: Kugel r=${x.rk}, innen ${x.innen}, Luft ${x.luft} m`));
  pruef('PASSUNG',r.passung.every((x,i)=>!i||x.rk>r.passung[i-1].rk),'Kugeln werden nicht stetig groesser');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Zuendpult-Anzeige (Tom, 29.09.): beim Zuenden steht auf dem Display,
   was gerade abgefeuert wird; ist es abgebrannt, stehen wieder die
   uebrigen scharfen Kanaele da. Bei vielen Namen hoechstens drei, dann "…". */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=40; S.money=1e7; ['shop_halb','testfeld'].forEach(id=>bb.testKauf(id)); bb.run(0.2,0.05);
    /* je Station drei verschiedene Produkte */
    const art={tisch:[],rampe:[],moerser:[]};
    /* Moerser: je Rohr ein passendes Kaliber (jedes Rohr nimmt nur seins) */
    const rohre=new Set();
    for(const t of Object.keys(bb.P)){ const s=bb.stationOf(t); if(!s||!art[s]||art[s].length>=3||art[s].some(x=>bb.P[x].short===bb.P[t].short)) continue;
      if(s==='moerser'){ const r=bb.moerserRohr(t); if(rohre.has(r)) continue; rohre.add(r); }
      art[s].push(t); }
    for(const s of ['moerser','rampe','tisch']) for(const t of art[s]){ S.carrying={type:t,count:1,q:1}; bb.placeOnStation(bb.stations[s]); }
    S.carrying=null; bb.drawPult();
    o.voll={scharf:bb.bereitCount(),text:bb.pultText};
    /* Kanal 1 zuenden: jetzt steht da, was brennt */
    const k1=bb.kanalItem(1), name1=k1&&bb.P[k1.type].short;
    bb.zuendeKanal(1); bb.run(0.1,0.05);
    o.zuendung={name:name1,text:bb.pultText};
    /* abbrennen lassen: wieder die uebrigen */
    for(let t=0;t<40&&bb.kanalItem(1);t+=0.5) bb.run(0.5,0.05);
    o.danach={frei:!bb.kanalItem(1),scharf:bb.bereitCount(),text:bb.pultText};
    /* zwei Kanaele gleichzeitig */
    bb.zuendeKanal(2); bb.zuendeKanal(4); bb.run(0.1,0.05);
    o.zwei={text:bb.pultText,namen:[2,4].map(k=>{ const it=bb.kanalItem(k); return it&&bb.P[it.type].short; })};
    return o; });
  console.log('PULT',JSON.stringify(r));
  const namen=t=>t.replace(/^Zündet: /,'').replace(/, …$/,'').split(', ').filter(Boolean);
  pruef('VOLL_KURZ',r.voll.scharf===9&&/, …$/.test(r.voll.text)&&namen(r.voll.text).length===3,'neun scharf: '+JSON.stringify(r.voll));
  pruef('ZEIGT_ZUENDUNG',/^Zündet: /.test(r.zuendung.text)&&r.zuendung.text.indexOf(r.zuendung.name)>=0,'beim Zuenden: '+JSON.stringify(r.zuendung));
  pruef('DANACH_UEBRIGE',r.danach.frei&&r.danach.scharf===8&&!/^Zündet/.test(r.danach.text)&&/, …$/.test(r.danach.text),'nach dem Abbrennen: '+JSON.stringify(r.danach));
  pruef('ZWEI_ZUGLEICH',/^Zündet: /.test(r.zwei.text)&&r.zwei.namen.every(n=>!n||r.zwei.text.indexOf(n)>=0),'zwei zugleich: '+JSON.stringify(r.zwei));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

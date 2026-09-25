/* Lieferanten und Bestellansicht (Tom, 25.09.): jeder Lieferant hat seine
   eigene Ware zu gleichen Bedingungen, nur Ratzke verkauft Restposten mit
   starkem Rabatt. Jede Karte hat ein Bild, mehrere Karten stehen in einer
   Zeile, Regalbau steht ganz links. */
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
  const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, P=bb.P, o={};
    const reg=bb.SUPPLIERS.filter(s=>!s.mystery), mys=bb.SUPPLIERS.filter(s=>s.mystery);
    const ware=bb.ORDER.filter(t=>!P[t].noOrder);
    o.mehrfach=[]; o.keiner=[]; o.zuSpaet=[];
    ware.forEach(t=>{ const n=reg.filter(s=>s.ware(t)).length;
      if(n>1) o.mehrfach.push(t+' ×'+n); if(n<1) o.keiner.push(t);
      const s=bb.supplierFor(t); if(s.lvl>bb.lizLevel(t)) o.zuSpaet.push(t+' lvl'+bb.lizLevel(t)+' bei '+s.id+' lvl'+s.lvl); });
    o.leer=reg.filter(s=>!ware.some(t=>s.ware(t))).map(s=>s.id);
    const bed=s=>JSON.stringify([s.mult,s.quality,s.tiers]);
    o.bedingungen=[...new Set(reg.map(bed))];
    o.mystery=mys.map(s=>({id:s.id,ware:ware.filter(t=>s.ware(t)).length}));
    S.level=40; S.money=1e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    o.packs=bb.PACKS.filter(pk=>bb.packOffen(pk)).map(pk=>{ const w=bb.packKartonWert?bb.packKartonWert(pk.gruppe)*pk.n:0;
      return {id:pk.id,preis:bb.packPreis(pk),wert:Math.round(w),rabatt:w?+(1-bb.packPreis(pk)/w).toFixed(2):null}; });
    /* Staffelrabatt der normalen Lieferanten zum Vergleich */
    o.staffelMax=Math.max(...reg[0].tiers.map(t=>t.d));
    /* Ansicht */
    o.ansicht=[];
    for(const id of ['regal',...bb.SUPPLIERS.map(s=>s.id)]){
      bb.lsup=id; bb.openLaptop('order');
      const body=document.getElementById('lbody');
      const karten=[...body.querySelectorAll('.karten .karte')];
      const ohneBild=karten.filter(k=>{ const im=k.querySelector('img.kbild'); return !im||!im.src||im.src.length<200||im.naturalWidth===0&&!im.src.startsWith('data:'); }).length;
      const tops={}; karten.forEach(k=>{ const t=Math.round(k.getBoundingClientRect().top); tops[t]=(tops[t]||0)+1; });
      const fremd=id==='regal'||bb.SUPPLIERS.find(s=>s.id===id).mystery?[]:
        [...body.querySelectorAll('.karte button[data-a="cart"]')].map(x=>x.dataset.t).filter(t=>bb.supplierFor(t).id!==id);
      /* sichtbar ganz links: nach Zeile, dann nach x sortiert */
      const sb=[...body.querySelectorAll('.steps button')].filter(x=>(x.dataset.a==='sup'||/Lvl/.test(x.textContent))&&x.offsetParent)
        .map(x=>({x,r:x.getBoundingClientRect()})).sort((a,b)=>Math.round(a.r.top-b.r.top)||a.r.left-b.r.left);
      o.ansicht.push({id,erster:sb.length?sb[0].x.textContent:'',karten:karten.length,ohneBild,
        proZeile:Math.max(0,...Object.values(tops)),zeilen:karten.length?Object.keys(tops).length:0,fremd}); }
    bb.lsup='mertens';
    return o; });
  console.log('MEHRFACH',JSON.stringify(r.mehrfach),'KEINER',JSON.stringify(r.keiner),'LEER',JSON.stringify(r.leer),'ZU_SPAET',JSON.stringify(r.zuSpaet));
  console.log('BEDINGUNGEN',JSON.stringify(r.bedingungen),'MYSTERY',JSON.stringify(r.mystery),'STAFFEL_MAX',r.staffelMax);
  r.packs.forEach(x=>console.log('PACK',JSON.stringify(x)));
  r.ansicht.forEach(x=>console.log('ANSICHT',JSON.stringify(x)));
  pruef('EIGENE_WARE',!r.mehrfach.length&&!r.keiner.length&&!r.leer.length,'doppelt '+r.mehrfach.join(',')+' / ohne Lieferant '+r.keiner.join(',')+' / leer '+r.leer.join(','));
  pruef('ERREICHBAR',!r.zuSpaet.length,r.zuSpaet.join(', '));
  pruef('GLEICHE_BEDINGUNGEN',r.bedingungen.length===1&&JSON.parse(r.bedingungen[0])[0]===1,r.bedingungen.join(' | '));
  pruef('RESTPOSTEN',r.mystery.length===1&&r.mystery[0].ware===0,JSON.stringify(r.mystery));
  pruef('RABATT',r.packs.length>0&&r.packs.every(x=>x.rabatt!==null&&x.rabatt>=0.35&&x.rabatt>=r.staffelMax*2.5),
    r.packs.filter(x=>!(x.rabatt>=0.35)).map(x=>x.id+' '+x.rabatt).join(', '));
  r.ansicht.forEach(x=>{
    pruef('REGAL_LINKS',/Regalbau/.test(x.erster||''),x.id+': erster Knopf '+x.erster);
    pruef('KARTEN',x.karten>0,x.id+' zeigt keine Karten');
    pruef('BILDER',x.ohneBild===0,x.id+': '+x.ohneBild+' Karten ohne Bild');
    pruef('NEBENEINANDER',x.karten<2||x.proZeile>=2,x.id+': nur '+x.proZeile+' Karte je Zeile');
    pruef('NUR_EIGENE',!x.fremd.length,x.id+' zeigt fremde Ware '+x.fremd.join(','));
  });
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Einkauf (Tom, 25.09., zweite Runde): keine Lieferanten mit eigener Ware
   mehr. Fachhandel (je Karton einzeln), ab Kapitel 2 Grosshandel (mehrere
   Kartons, guenstiger), dazu Restposten mit sehr starken Rabatten -
   gemischt, halb sortiert oder sortenrein. Alle Ware auf einer Seite,
   nach Freischaltung und Level sortiert. Regale & Einrichtung (mit den
   Kassen) als eigene Kategorie ganz links, nur ueber das Level gesperrt. */
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
    const body=()=>document.getElementById('lbody');
    const ansicht=id=>{ bb.lsup=id; bb.openLaptop('order'); const B=body();
      const sb=[...B.querySelectorAll('.steps button')].filter(x=>(x.dataset.a==='sup'||x.disabled&&/Lvl|Restposten/.test(x.textContent))&&x.offsetParent)
        .map(x=>({x,r:x.getBoundingClientRect()})).sort((a,b)=>Math.round(a.r.top-b.r.top)||a.r.left-b.r.left);
      const karten=[...B.querySelectorAll('.karten .karte')];
      const ohneBild=karten.filter(k=>{ const im=k.querySelector('img.kbild'); return !im||!im.src||im.src.length<200; }).length;
      const tops={}; karten.forEach(k=>{ const t=Math.round(k.getBoundingClientRect().top); tops[t]=(tops[t]||0)+1; });
      return {erster:sb.length?sb[0].x.textContent:'',karten:karten.length,ohneBild,proZeile:Math.max(0,...Object.values(tops)),text:B.textContent,
        cart:[...B.querySelectorAll('.karte button[data-a="cart"]')].map(x=>({t:x.dataset.t,n:+x.dataset.n,preis:parseFloat(x.textContent.split('×')[1].split('€')[0].replace(/\./g,'').replace(',','.'))})),
        reihe:karten.map(k=>{ const b=k.querySelector('button[data-a="cart"]'); return b?b.dataset.t:null; }).filter(Boolean)}; };
    o.ids=bb.SUPPLIERS.map(s=>s.id);
    S.level=40; S.money=1e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    o.kette=bb.ORDER.filter(t=>!P[t].noOrder).length;
    /* vor Kapitel 2: Fachhandel */
    S.up.lager=false; o.fach=ansicht('ware'); o.fachSup=bb.supplierFor('boeller').id;
    /* ab Kapitel 2: Grosshandel */
    S.up.lager=true; o.gross=ansicht('ware'); o.grossSup=bb.supplierFor('boeller').id;
    o.regal=ansicht('regal'); o.rest=ansicht('rest');
    o.tabs=[...document.querySelectorAll('#ltabs button')].map(x=>x.dataset.tab);
    o.einr=bb.UPGRADES.filter(u=>(u.kat||'einr')==='einr').map(u=>u.name);
    /* Restposten */
    o.packs=bb.PACKS.filter(pk=>bb.packOffen(pk)).map(pk=>{ const w=bb.packKartonWert(pk.gruppe,pk.sorten)*pk.n; return {id:pk.id,sorten:pk.sorten||0,rabatt:+(1-bb.packPreis(pk)/w).toFixed(2)}; });
    o.sortenrein=[...Array(20)].map(()=>new Set(bb.packContents(8,null,1)).size);
    o.halb=[...Array(20)].map(()=>new Set(bb.packContents(12,null,3)).size);
    o.lizReihe=o.gross.reihe.map(t=>bb.lizLevel(t));
    bb.lsup='ware';
    return o; });
  const tierSet=v=>[...new Set(v.cart.map(c=>c.n))].sort((a,b)=>a-b).join(',');
  const stueck=(v,t,n)=>{ const c=v.cart.find(c=>c.t===t&&c.n===n); return c?c.preis/n:null; };
  console.log('IDS',JSON.stringify(r.ids),'FACH',r.fachSup,tierSet(r.fach),'GROSS',r.grossSup,tierSet(r.gross),'KARTEN',r.fach.karten,r.gross.karten,'WARE',r.kette);
  console.log('PREIS boeller 1/20:',stueck(r.gross,'boeller',1),stueck(r.gross,'boeller',20));
  console.log('PACKS',JSON.stringify(r.packs),'SORTENREIN',Math.max(...r.sortenrein),'HALB',Math.max(...r.halb));
  console.log('TABS',JSON.stringify(r.tabs),'ERSTER',r.fach.erster,'|',r.regal.erster,'|',r.rest.erster);
  ['fach','gross','regal','rest'].forEach(k=>console.log('ANSICHT',k,JSON.stringify({karten:r[k].karten,ohneBild:r[k].ohneBild,proZeile:r[k].proZeile})));
  pruef('DREI_STUFEN',JSON.stringify(r.ids)===JSON.stringify(['fachhandel','grosshandel','ratzke']),'Lieferanten: '+r.ids);
  pruef('FACHHANDEL',r.fachSup==='fachhandel'&&tierSet(r.fach)==='1','vor Kapitel 2 nicht nur einzelne Kartons: '+r.fachSup+' '+tierSet(r.fach));
  pruef('GROSSHANDEL',r.grossSup==='grosshandel'&&tierSet(r.gross)==='1,5,20'&&stueck(r.gross,'boeller',20)<=stueck(r.gross,'boeller',1)*0.9,'Grosshandel ohne Mengenrabatt: '+tierSet(r.gross));
  pruef('GLEICHE_WARE',r.fach.karten===r.kette&&r.gross.karten===r.kette,'nicht alle Ware auf einer Seite: '+r.fach.karten+' / '+r.gross.karten+' von '+r.kette);
  pruef('SORTIERT',r.lizReihe.every((v,i)=>!i||v>=r.lizReihe[i-1]),'nicht nach Freischaltung sortiert: '+r.lizReihe.join(','));
  pruef('RABATT',r.packs.length>=8&&r.packs.every(x=>x.rabatt>=0.35),'Restposten zu teuer: '+r.packs.filter(x=>!(x.rabatt>=0.35)).map(x=>x.id+' '+x.rabatt));
  pruef('SORTENREIN',Math.max(...r.sortenrein)===1&&Math.max(...r.halb)<=3&&r.packs.some(x=>x.sorten===1)&&r.packs.some(x=>x.sorten===3),'Posten nicht sortenrein/halb sortiert: '+Math.max(...r.sortenrein)+' / '+Math.max(...r.halb));
  pruef('REGAL_LINKS',['fach','gross','regal','rest'].every(k=>/Regale/.test(r[k].erster)),'erster Knopf: '+['fach','gross','regal','rest'].map(k=>r[k].erster));
  pruef('EINRICHTUNG',r.tabs.indexOf('einr')<0&&/SB-Kassen/.test(r.regal.text)&&/Kontaktlos-Terminal/.test(r.regal.text)&&/Verkaufsregal/.test(r.regal.text)&&r.einr.every(n=>r.regal.text.indexOf(n)>=0),'Einrichtung nicht unter Regale: Reiter '+r.tabs);
  ['fach','gross','regal','rest'].forEach(k=>{
    pruef('BILDER',r[k].ohneBild===0&&r[k].karten>0,k+': '+r[k].ohneBild+' von '+r[k].karten+' Karten ohne Bild');
    pruef('NEBENEINANDER',r[k].proZeile>=2,k+': nur '+r[k].proZeile+' Karte je Zeile'); });
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

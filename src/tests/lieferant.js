/* Einkauf (Tom, 26.09.): vier Reiter - Regale & Einrichtung,
   Fachhandel (Standard, nur einzelne Kartons), Grosshandel (eigener
   Reiter, 10er/20er mit Rabatt, ab Level 8 mit Lager), Restposten
   (deutlich spaeter; Angebot wechselt nach Zufall, mal leer, mal viel,
   und wird knapper, je besser der Spieler dasteht).
   Vorher (25.09., zweite Runde): keine Lieferanten mit eigener Ware
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
      const sb=[...B.querySelectorAll('.steps button')].filter(x=>(x.dataset.a==='sup'||x.disabled&&/Lvl|Restposten|Großhandel/.test(x.textContent))&&x.offsetParent)
        .map(x=>({x,r:x.getBoundingClientRect()})).sort((a,b)=>Math.round(a.r.top-b.r.top)||a.r.left-b.r.left);
      const karten=[...B.querySelectorAll('.karten .karte')];
      const ohneBild=karten.filter(k=>{ const im=k.querySelector('img.kbild'); return !im||!im.src||im.src.length<200; }).length;
      const tops={}; karten.forEach(k=>{ const t=Math.round(k.getBoundingClientRect().top); tops[t]=(tops[t]||0)+1; });
      return {erster:sb.length?sb[0].x.textContent:'',knoepfe:sb.map(k=>k.x.textContent+(k.x.disabled?'#zu':'')),lsup:bb.lsup,karten:karten.length,ohneBild,proZeile:Math.max(0,...Object.values(tops)),text:B.textContent,
        cart:[...B.querySelectorAll('.karte button[data-a="cart"]')].map(x=>({t:x.dataset.t,n:+x.dataset.n,s:x.dataset.s,preis:parseFloat(x.textContent.split('×')[1].split('€')[0].replace(/\./g,'').replace(',','.'))})),
        reihe:karten.map(k=>{ const b=k.querySelector('button[data-a="cart"]'); return b?b.dataset.t:null; }).filter(Boolean)}; };
    o.ids=bb.SUPPLIERS.map(s=>s.id);
    S.level=40; S.money=1e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    o.kette=bb.ORDER.filter(t=>!P[t].noOrder).length;
    /* Grosshandel gesperrt: ohne Lager, oder mit Lager unter Level 8 */
    S.up.lager=false; o.ohneLager=ansicht('gross');
    S.up.lager=true; S.level=7; o.lvl7=ansicht('gross');
    S.level=40;
    o.fach=ansicht('ware'); o.fachSup=bb.supplierFor('boeller').id;
    o.gross=ansicht('gross');
    o.regal=ansicht('regal');
    /* Restposten: eine sichere volle Lieferung, dann ansehen */
    bb.restDaten().angebote=[]; bb.restWelle(0.999); o.rest=ansicht('rest');
    bb.restDaten().angebote=[]; o.restLeer=ansicht('rest');
    o.lvl={gross:bb.SUPPLIERS[1].lvl,rest:bb.SUPPLIERS[2].lvl};
    /* Zufall und Schwierigkeitshebel: viele Lieferungen bei knapper
       und bei dicker Kasse */
    const welle=geld=>{ S.money=geld; S.loan=null; const R=bb.restDaten(); const z=[], w=[];
      for(let i=0;i<600;i++){ R.angebote=[]; R.erst=true; z.push(bb.restWelle()); w.push(R.t); }
      return {mittel:z.reduce((a,b)=>a+b,0)/z.length,leer:z.filter(x=>!x).length/z.length,viel:z.filter(x=>x>=3).length/z.length,warte:w.reduce((a,b)=>a+b,0)/w.length,druck:bb.restDruck()}; };
    o.knapp=welle(200); o.reich=welle(5e6);
    /* Ablauf in Echtzeit: zwei Spielstunden, jede Sekunde ein Blick */
    S.money=3000; const R=bb.restDaten(); R.angebote=[]; R.t=5; const verlauf=[];
    for(let s2=0;s2<7200;s2++){ bb.restTick(1); verlauf.push(R.angebote.length); }
    o.verlauf={min:Math.min(...verlauf),max:Math.max(...verlauf),leerAnteil:verlauf.filter(x=>!x).length/verlauf.length};
    /* Kauf: Vorrat sinkt, Geld sinkt um den Preis, Kartons kommen */
    R.angebote=[]; bb.restWelle(0.999); const a=R.angebote[0]; a.vorrat=1; const pk=bb.PACKS.find(x=>x.id===a.pack);
    S.money=1e6; const g0=S.money, p0=bb.pendingListe().length;
    bb.buyAngebot(a.id); o.kauf={preis:a.preis,bezahlt:+(g0-S.money).toFixed(2),kartons:bb.pendingListe().length-p0,soll:pk.n,weg:!R.angebote.includes(a)};
    const g1=S.money; bb.buyAngebot(a.id); o.kauf.zweimal=S.money!==g1;
    o.angebotRabatt=[]; for(let i=0;i<40;i++){ R.angebote=[]; bb.restWelle(0.999); R.angebote.forEach(x=>{ const q=bb.PACKS.find(y=>y.id===x.pack); o.angebotRabatt.push(1-x.preis/(bb.packKartonWert(q.gruppe,q.sorten)*q.n)); }); }
    /* Grosshandel landet als Grosshandel im Warenkorb, Fachhandel einzeln */
    S.cart=[]; bb.cartAdd('boeller',20,'grosshandel'); bb.cartAdd('boeller',20,'fachhandel');
    o.korb=bb.cartLines().map(l=>l.sup+':'+l.n+':'+l.step); S.cart=[];
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
  console.log('IDS',JSON.stringify(r.ids),'FACH',r.fachSup,tierSet(r.fach),'GROSS',tierSet(r.gross),'KARTEN',r.fach.karten,r.gross.karten,'WARE',r.kette,'LVL',JSON.stringify(r.lvl));
  console.log('KNOEPFE',JSON.stringify(r.fach.knoepfe),'OHNE_LAGER',r.ohneLager.lsup,JSON.stringify(r.ohneLager.knoepfe[2]),'LVL7',r.lvl7.lsup,JSON.stringify(r.lvl7.knoepfe[2]));
  console.log('PREIS boeller fach 1 / gross 20:',stueck(r.fach,'boeller',1),stueck(r.gross,'boeller',20));
  console.log('WELLE knapp',JSON.stringify(r.knapp),'reich',JSON.stringify(r.reich));
  console.log('VERLAUF',JSON.stringify(r.verlauf),'KAUF',JSON.stringify(r.kauf),'KORB',JSON.stringify(r.korb));
  const mr=r.angebotRabatt.reduce((a,b)=>a+b,0)/r.angebotRabatt.length;
  console.log('ANGEBOTSRABATT mittel',mr.toFixed(2),'min',Math.min(...r.angebotRabatt).toFixed(2));
  console.log('PACKS',JSON.stringify(r.packs),'SORTENREIN',Math.max(...r.sortenrein),'HALB',Math.max(...r.halb));
  console.log('TABS',JSON.stringify(r.tabs),'ERSTER',r.fach.erster,'|',r.regal.erster,'|',r.rest.erster);
  ['fach','gross','regal','rest'].forEach(k=>console.log('ANSICHT',k,JSON.stringify({karten:r[k].karten,ohneBild:r[k].ohneBild,proZeile:r[k].proZeile})));
  pruef('DREI_STUFEN',JSON.stringify(r.ids)===JSON.stringify(['fachhandel','grosshandel','ratzke']),'Lieferanten: '+r.ids);
  pruef('VIER_REITER',r.fach.knoepfe.length===4&&/Regale/.test(r.fach.knoepfe[0])&&/Fachhandel/.test(r.fach.knoepfe[1])&&/Großhandel/.test(r.fach.knoepfe[2])&&/Restposten/.test(r.fach.knoepfe[3]),'Reiter: '+r.fach.knoepfe.join(' | '));
  pruef('STANDARD',r.fach.lsup==='ware'&&r.fachSup==='fachhandel','Standard ist nicht der Fachhandel');
  pruef('FACHHANDEL',tierSet(r.fach)==='1'&&r.fach.cart.every(c=>c.s==='fachhandel'),'Fachhandel nicht nur einzelne Kartons: '+tierSet(r.fach));
  pruef('GROSSHANDEL',tierSet(r.gross)==='10,20'&&r.gross.cart.every(c=>c.s==='grosshandel')&&stueck(r.gross,'boeller',20)<stueck(r.gross,'boeller',10)&&stueck(r.gross,'boeller',10)<stueck(r.fach,'boeller',1),'Grosshandel nicht 10/20 mit steigendem Rabatt: '+tierSet(r.gross));
  pruef('GROSS_GESPERRT',r.ohneLager.lsup==='ware'&&/#zu/.test(r.ohneLager.knoepfe[2])&&r.lvl7.lsup==='ware'&&/Lvl 8#zu/.test(r.lvl7.knoepfe[2]),'Grosshandel vor Level 8/Lager offen: '+r.ohneLager.knoepfe[2]+' / '+r.lvl7.knoepfe[2]);
  pruef('KORB',JSON.stringify(r.korb)===JSON.stringify(['grosshandel:20:20','fachhandel:1:1']),'Warenkorb: '+r.korb);
  pruef('REST_SPAET',r.lvl.rest>=12&&r.lvl.rest>=r.lvl.gross+4,'Restposten nicht deutlich spaeter: '+JSON.stringify(r.lvl));
  pruef('REST_ZUFALL',r.knapp.leer>0.05&&r.knapp.viel>0.1&&r.reich.leer>0.3&&r.verlauf.min===0&&r.verlauf.max>=3,'Angebot nicht wechselhaft: '+JSON.stringify({k:r.knapp,v:r.verlauf}));
  pruef('REST_HEBEL',r.knapp.druck<0.1&&r.reich.druck>0.9&&r.knapp.mittel>=1.6*r.reich.mittel&&r.reich.warte>=1.3*r.knapp.warte,'wer gut dasteht, bekommt nicht weniger: '+r.knapp.mittel.toFixed(2)+' / '+r.reich.mittel.toFixed(2));
  pruef('REST_KAUF',Math.abs(r.kauf.bezahlt-r.kauf.preis)<0.01&&r.kauf.kartons===r.kauf.soll&&r.kauf.weg&&!r.kauf.zweimal,'Restposten-Kauf: '+JSON.stringify(r.kauf));
  pruef('REST_LEER',/Gerade nichts da/.test(r.restLeer.text)&&r.restLeer.karten===0,'leerer Restposten ohne Hinweis');
  pruef('REST_RABATT',mr>=0.35,'Angebote im Mittel nur '+mr.toFixed(2)+' unter Einkauf');
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

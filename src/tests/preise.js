/* Einkaufspreise beim Lieferanten (Tom, 26.09.: "der Marktwert veraendert
   sich immer so ein bisschen, das heisst, die Preise werden natuerlich
   auch teurer beim Lieferanten"):
   - WECHSEL: der Kartonpreis aendert sich fast jeden Tag - auch bei
     billiger Ware (vorher auf den Cent je Stueck gerundet: Wunderkerzen
     nur an jedem fuenften Tag, dann Spruenge von 36 Cent)
   - FOLGT: der Kartonpreis folgt genau Marktindex und Inflation
   - TEURER: ueber eine lange Saison wird der Einkauf teurer
   - DELTA: die Anzeige "gegenueber gestern" rechnet richtig
   - ANZEIGE: Bestellkarte und Preisliste zeigen den Trend, der
     Handscanner rechnet mit dem Tagesfaktor wie der Laptop
   - SPEICHERN: der Vergleichsstand ueberlebt Speichern und Laden */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:30000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1200,height:760}}); p.setDefaultTimeout(120000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, P=bb.P, o={};
    S.level=40; S.money=1e7; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    const FH=bb.SUPPLIERS[0], T1={n:1,d:0}, W=['wunder','knallerbsen','tisch','feuerzeug','batterie16','sekt','popcorn'];
    const p0={}, i0={}, last={}; o.wechsel={};
    W.forEach(t=>{ p0[t]=bb.tierPrice(t,FH,T1); i0[t]=bb.ekRoh(t); last[t]=p0[t]; o.wechsel[t]=0; });
    for(let d=0;d<60;d++){ bb.rollMarkt(); W.forEach(t=>{ const q=bb.tierPrice(t,FH,T1); if(q!==last[t]) o.wechsel[t]++; last[t]=q; }); }
    o.folgt={}; W.forEach(t=>{ o.folgt[t]=+Math.abs(bb.tierPrice(t,FH,T1)/p0[t]-bb.ekRoh(t)/i0[t]).toFixed(4); });
    /* Delta gegen gestern */
    const t='batterie16', vor=S.ekVor[t];
    o.delta={soll:Math.round((S.mi[t]*S.infl/vor-1)*1000)/10, ist:bb.ekDelta(t)};
    const L=bb.ORDER.filter(x=>!P[x].noOrder&&bb.isUnlocked(x)), e=bb.ekTag();
    o.schnitt={soll:Math.round(L.reduce((a,x)=>a+bb.ekDelta(x),0)/L.length*10)/10, ist:e.schnitt};
    /* lange Saison */
    for(let d=0;d<120;d++) bb.rollMarkt();
    o.infl=S.infl; o.ekIndex=+(bb.ORDER.reduce((a,x)=>a+bb.ekRoh(x)/P[x].cost,0)/bb.ORDER.length).toFixed(3);
    /* Anzeige: Wunderkerzen gestern 25 % billiger */
    S.ekVor.wunder=S.mi.wunder*S.infl/1.25;
    bb.lsup='ware'; bb.lkat='alle'; bb.openLaptop('order');
    const karte=[...document.querySelectorAll('#lbody .karte')].find(k=>k.querySelector('button[data-t="wunder"]'));
    o.karte=karte?karte.textContent.replace(/\s+/g,' ').slice(0,160):'';
    bb.openLaptop('price'); o.preisliste=/EK \+25,0 %/.test(document.getElementById('lbody').textContent);
    bb.closeLaptop&&bb.closeLaptop(false);
    /* Handscanner mit Tagesfaktor: Lizenz-Rabatt macht den Faktor 0,9 */
    S.up.lizenz=true;
    bb.openPDA('batterie16');
    const zeile=[...document.querySelectorAll('#pdaBody .pdarow')].find(z=>/Einkauf \/ Marge/.test(z.textContent));
    const zahl=zeile?parseFloat(zeile.textContent.replace('Einkauf / Marge','').split('→')[0].replace(/[^\d,]/g,'').replace(',','.')):null;
    o.pda={ist:zahl, soll:Math.round(bb.costOf('batterie16')*bb.ekFactor()*100)/100, ohne:bb.costOf('batterie16')};
    bb.closePDA();
    /* Speichern und Laden */
    bb.save(); const d=JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>/boellerbude/.test(k))));
    o.gespeichert=!!(d.ekVor&&Math.abs(d.ekVor.wunder-S.ekVor.wunder)<1e-6);
    return o; });
  console.log('WECHSEL ',JSON.stringify(r.wechsel),'(von 60 Tagen)');
  console.log('FOLGT   ',JSON.stringify(r.folgt));
  console.log('DELTA   ',JSON.stringify(r.delta),'SCHNITT',JSON.stringify(r.schnitt));
  console.log('TEURER  inflation',r.infl,'EK-Index',r.ekIndex);
  console.log('ANZEIGE karte:',r.karte,'| preisliste',r.preisliste,'| PDA',JSON.stringify(r.pda),'| gespeichert',r.gespeichert);
  pruef('WECHSEL',Object.values(r.wechsel).every(n=>n>=48),'Kartonpreis bleibt zu oft gleich: '+JSON.stringify(r.wechsel));
  pruef('FOLGT',Object.values(r.folgt).every(x=>x<0.005),'Kartonpreis folgt dem Index nicht: '+JSON.stringify(r.folgt));
  pruef('TEURER',r.infl>1.15&&r.ekIndex>1.1,'Einkauf wird nicht teurer: Inflation '+r.infl+', Index '+r.ekIndex);
  pruef('DELTA',Math.abs(r.delta.soll-r.delta.ist)<0.11&&Math.abs(r.schnitt.soll-r.schnitt.ist)<0.11,JSON.stringify([r.delta,r.schnitt]));
  pruef('ANZEIGE',/EK \+25,0 %/.test(r.karte),'Bestellkarte ohne Trend: '+r.karte);
  pruef('ANZEIGE',r.preisliste,'Preisliste ohne Trend');
  pruef('ANZEIGE',r.pda.ist!==null&&Math.abs(r.pda.ist-r.pda.soll)<0.011&&Math.abs(r.pda.ist-r.pda.ohne)>0.02,'Handscanner-Einkauf '+JSON.stringify(r.pda));
  pruef('SPEICHERN',r.gespeichert,'Vergleichsstand nicht gespeichert');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

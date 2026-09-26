/* Sortiment mal drei (Tom, 26.09.):
   - ANZAHL: gut dreimal so viele Produkte wie vorher (70), auf jedem
     Level von 1 bis 26 mindestens fuenf
   - DATEN: jede neue Ware hat Lizenz (nicht vor ihrem Level), Gruppe,
     Markt, passende Marge
   - REGAL: jede passt in ein Regal, Kuehlware in den Kuehlschrank
   - ZUENDEN: jedes neue Feuerwerk hat eine Station und macht sichtbar
     etwas; Raketen eine Rakete je Zuendung; Fontaenen ohne Ladung
   - SCHUSS: Schusszahl im Namen = Drehbuch
   - FRUEH: bis Level 15 keine Profi-Bruchbilder
   - EIGEN: kein Drehbuch ist die Kopie eines anderen (Bruchbilder und
     Thema), keine Rakete gleicht einer anderen
   - STUFE: Grundgroesse und Steighoehe fallen nie unter ein Produkt mit
     niedrigerem Level
   - ALT: die Boeller, die Tom am 25.09. rausgeworfen hat, bleiben draussen */
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
  const p=await b.newPage({viewport:{width:1000,height:640}}); p.setDefaultTimeout(120000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, P=bb.P, o={};
    S.level=40; S.money=1e8; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    const NEU=Object.keys(bb.NEUWARE);
    o.neu=NEU.length;
    o.gesamt=bb.ORDER.filter(t=>!P[t].noOrder).length;
    o.proLevel={}; for(let l=1;l<=26;l++) o.proLevel[l]=bb.ORDER.filter(t=>!P[t].noOrder&&P[t].lvl===l).length;
    /* Daten */
    o.daten=[];
    NEU.forEach(t=>{ const q=P[t], liz=bb.lizenzOf(t), L=bb.LIZENZEN.find(x=>x.id===liz), g=bb.gruppeVon(t), m=q.market/q.cost;
      const [lo,hi]=q.cat===0?[2.3,2.8]:[2.1,2.6];
      if(!liz) o.daten.push(t+': keine Lizenz');
      else if(L.lvl>q.lvl+0) { if(L.lvl>q.lvl) o.daten.push(t+': Lizenz '+liz+' (Level '+L.lvl+') nach Produkt-Level '+q.lvl); }
      if(g==='sonstiges') o.daten.push(t+': keine Warengruppe');
      if(!(bb.volaOf(t)>0)||!(bb.marketOf(t)>bb.costOf(t))) o.daten.push(t+': kein Markt');
      if(m<lo||m>hi) o.daten.push(t+': Marge '+m.toFixed(2));
      if(!q.art||!q.art.title) o.daten.push(t+': keine Verpackung'); });
    /* Regal: jedes passt in einen passenden Regaltyp */
    o.regal=[];
    NEU.forEach(t=>{ const q=P[t]; if(q.noShelf) return;
      const passt=Object.keys(bb.SHELFKIND).some(kind=>{ const K=bb.SHELFKIND[kind]; if(K.cold&&!q.cold) return false; if(!K.cold&&q.kuehlpflicht) return false;
        const L=bb.layout(t,{kind}); return L&&L.cap>0; });
      if(!passt) o.regal.push(t); });
    /* Feuerwerk zuenden */
    o.zuenden=[]; o.raketen=[]; o.fontLadung=[]; o.schuss=[]; o.frueh=[];
    const PROFI=['dahlie','pistill','kamuro','kronleuchter','titan','zehnfach','zeitregen','brokat','sternschnuppen','glitzerweide'];
    const FONT=['leuchtfontaene','feuerteufel','farbfontaenen','bodenfeuer','zauberbrunnen','feuerberg','vulkanfeld','funkenturm','dreiklang','wasserspiel','glitzerkaskade','sternfontaene','eisblume','goldvulkan','feuerwand','silberkaskade','feuerkaskade','bengalfackel','bengalduo','feuerrad'];
    NEU.filter(t=>P[t].cat>0).forEach(t=>{
      const st=bb.stationOf(t); if(!st){ o.zuenden.push(t+': keine Station'); return; }
      bb.run(4,0.1);
      const pad=st==='moerser'?{x:5,y:1.7,z:-23,ab:0.3,jit:0}:{x:3,y:0.95,z:-18,ab:0.1,jit:0.05};
      const log=[]; bb.fwLog(log); const r0=bb.rockets.length; let raketen=0, partikel=0, emit=0;
      const dauer=bb.brennDauer(t);
      bb.igniteType(t,pad);
      for(let k=0;k<Math.ceil((dauer+5)/0.1);k++){ bb.run(0.1,0.1);
        if(bb.rockets.length>r0) raketen=Math.max(raketen,bb.rockets.length-r0);
        emit=Math.max(emit,bb.emittersListe().length);
        if(k%5===0){ let n=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let i=0;i<ps.life.length;i++) if(ps.life[i]>0) n++; partikel=Math.max(partikel,n); } }
      bb.fwLog(null);
      const schuesse=log.filter(e=>e.art==='schuss').length;
      if(partikel<30) o.zuenden.push(t+': nichts zu sehen ('+partikel+' Funken)');
      if(P[t].shape==='rocketset'&&schuesse!==1) o.raketen.push(t+': '+schuesse+' Brueche');
      if(FONT.includes(t)&&schuesse>0) o.fontLadung.push(t+': '+schuesse+' Ladungen');
    });
    /* Drehbuecher */
    const sig={};
    Object.keys(bb.SHOWS).forEach(t=>{ const ph=bb.SHOWS[t](); const effs=new Set();
      ph.forEach(x=>{ (Array.isArray(x.eff)?x.eff:[x.eff]).forEach(e=>e&&effs.add(e)); if(x.bomb) effs.add('bomb'+x.bomb); if(x.perle) effs.add('perle'); });
      const th=(bb.SHOW_BASIS[t]||{}).th, key=[...effs].sort().join(',')+'|'+th+'|'+ph.length;
      (sig[key]=sig[key]||[]).push(t);
      const m=/(\d+) Schuss/.exec(P[t].name), summe=ph.reduce((a,x)=>a+(x.n===undefined?1:x.n),0);
      if(m&&Math.abs(+m[1]-summe)>0) o.schuss.push(t+': Name '+m[1]+', Drehbuch '+summe);
      if(P[t].lvl<=15&&bb.NEUWARE[t]){ const f=[...effs].filter(e=>PROFI.includes(e)); if(f.length) o.frueh.push(t+' (Level '+P[t].lvl+'): '+f.join(',')); } });
    o.kopien=Object.values(sig).filter(l=>l.length>1);
    const rsig={}; Object.keys(bb.RAKETEN_KL).forEach(t=>{ const k=bb.RAKETEN_KL[t]; const key=(k.eff||[]).join(',')+'|'+k.th+'|'+k.sz; (rsig[key]=rsig[key]||[]).push(t); });
    o.rkopien=Object.values(rsig).filter(l=>l.length>1);
    /* Stufe: Grundgroesse der Shows nie unter einem Produkt mit niedrigerem Level */
    o.stufe=[];
    const B=Object.keys(bb.SHOW_BASIS).filter(t=>P[t]).map(t=>({t,lvl:P[t].lvl,sz:bb.SHOW_BASIS[t].sz,pw:bb.SHOW_BASIS[t].pw}));
    B.forEach(a=>B.forEach(c=>{ if(c.lvl>a.lvl&&(c.sz<a.sz-0.001||c.pw<a.pw-0.001)) o.stufe.push(c.t+' ('+c.lvl+') unter '+a.t+' ('+a.lvl+')'); }));
    /* Raketen: groesser mit dem Level */
    const RK=Object.keys(bb.RAKETEN_KL).filter(t=>P[t]&&P[t].shape==='rocketset'&&t!=='gravur'&&t!=='blanko'&&t!=='furzrakete'&&t!=='pfeifraketen').map(t=>({t,lvl:P[t].lvl,sz:bb.RAKETEN_KL[t].sz,pw:bb.RAKETEN_KL[t].pw}));
    RK.forEach(a=>RK.forEach(c=>{ if(c.lvl>a.lvl&&(c.sz<a.sz-0.001||c.pw<a.pw-0.001)) o.stufe.push('Rakete '+c.t+' ('+c.lvl+') unter '+a.t+' ('+a.lvl+')'); }));
    o.alt=['kanonen','grossboeller','sprengmeister','xxlpolen','doppelschlag','heuler'].filter(t=>P[t]);
    return o; });
  console.log('ANZAHL  neu',r.neu,'gesamt',r.gesamt,'pro Level',JSON.stringify(r.proLevel));
  ['daten','regal','zuenden','raketen','fontLadung','schuss','frueh','stufe'].forEach(k=>console.log(k.toUpperCase().padEnd(8),r[k].length,JSON.stringify(r[k].slice(0,8))));
  console.log('KOPIEN  ',JSON.stringify(r.kopien),JSON.stringify(r.rkopien));
  pruef('ANZAHL',r.gesamt>=200,'nur '+r.gesamt+' Produkte');
  const duenn=Object.keys(r.proLevel).filter(l=>r.proLevel[l]<5);
  pruef('ANZAHL',!duenn.length,'zu wenig auf Level '+duenn.map(l=>l+' ('+r.proLevel[l]+')').join(', '));
  pruef('DATEN',!r.daten.length,r.daten.slice(0,6).join(' | '));
  pruef('REGAL',!r.regal.length,'passt in kein Regal: '+r.regal.join(', '));
  pruef('ZUENDEN',!r.zuenden.length,r.zuenden.slice(0,6).join(' | '));
  pruef('RAKETE',!r.raketen.length,r.raketen.join(' | '));
  pruef('FONTAENE',!r.fontLadung.length,r.fontLadung.join(' | '));
  pruef('SCHUSS',!r.schuss.length,r.schuss.join(' | '));
  pruef('FRUEH',!r.frueh.length,r.frueh.join(' | '));
  pruef('EIGEN',!r.kopien.length&&!r.rkopien.length,'gleiche Drehbuecher: '+JSON.stringify(r.kopien.concat(r.rkopien)));
  pruef('STUFE',!r.stufe.length,r.stufe.slice(0,6).join(' | '));
  pruef('ALT',!r.alt.length,'wieder drin: '+r.alt);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

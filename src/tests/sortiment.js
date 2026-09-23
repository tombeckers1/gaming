/* Sortiment-Ueberarbeitung (Toms Wunsch vom 23.09.):
   - Polarlicht (25 Schuss, langweilig) ist raus, Stinkbomben auch
   - neue Batterien, Raketen und die 200-mm-Kugelbombe sind da,
     jede mit Lizenz, Station, Regalplatz, Marktpreis
   - die Schusszahl im Namen stimmt mit dem Drehbuch
   - Batterien steigern sich: mehr Schuss und laengere Show
   - jedes Bruchbild, das irgendwo verwendet wird, existiert
   - Goetterzorn: zehn Brueche gleichzeitig
   - jedes Produkt steht, bis sein letzter Schuss raus ist
   - Pfeifraketen ziehen eine Spirale, Titan bricht dreifach */
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
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const r=await p.evaluate(()=>{
    const bb=window.__bb,P=bb.P,o={};
    bb.S.level=30; bb.S.money=9e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    o.weg=['batterie25','stinkbombe'].filter(t=>P[t]||bb.LIZENZEN.some(l=>l.items.includes(t)));
    const NEU=['knatter','zfaecher','kometen','finale','pfeifraketen','titanraketen','kugel200','goldgeysir','feuersaeule','donnerwand','kugel300'];
    o.neu={};
    for(let i=0;i<4;i++) bb.regalStellen('hoch');
    NEU.forEach(t=>{ const q=P[t];
      o.neu[t]=q?{liz:bb.lizenzOf(t),st:bb.stationOf(t),regal:bb.shelfCapOf(t),markt:bb.marketOf(t)>q.cost,
        marge:+(q.market/q.cost).toFixed(2),gruppe:bb.gruppeVon(t)}:null; });
    /* Schusszahl im Namen gegen das Drehbuch */
    o.schuss={};
    Object.keys(bb.SHOWS).forEach(t=>{ const m=/(\d+) Schuss/.exec(P[t]&&P[t].name||''); if(!m) return;
      o.schuss[t]=[+m[1],bb.SHOWS[t]().reduce((a,ph)=>a+(ph.n||1),0)]; });
    /* Leiter: Schuss und Laenge wachsen */
    const LEITER=['batterie16','knatter','faecher','zfaecher','batterie49','kometen','batterie100','donnerwand','profi','finale'];
    o.leiter=LEITER.map(t=>[t,bb.SHOWS[t]().reduce((a,ph)=>a+(ph.n||1),0),bb.showLength(t),P[t].market]);
    /* alle verwendeten Bruchbilder existieren */
    const benutzt=new Set([].concat(bb.EFF_KLEIN,bb.EFF_GROSS,bb.EFF_PRO));
    Object.keys(bb.SHOWS).forEach(t=>bb.SHOWS[t]().forEach(ph=>{ const e=ph.eff; (Array.isArray(e)?e:[e]).forEach(x=>x&&benutzt.add(x)); }));
    o.fehlend=[...benutzt].filter(e=>typeof bb.EFF[e]!=='function');
    o.neueEff=['tausend','mehrring','regenbogen','glitzerweide','komet','titan','zehnfach','kaskade','schneeflocke','spirale','ringring','strauss'].filter(e=>typeof bb.EFF[e]!=='function');
    return o;
  });
  console.log('WEG     ',JSON.stringify(r.weg));
  console.log('NEU     ',JSON.stringify(r.neu));
  console.log('SCHUSS  ',JSON.stringify(r.schuss));
  console.log('LEITER  ',JSON.stringify(r.leiter));
  pruef('WEG',r.weg.length===0,'noch im Sortiment: '+r.weg);
  for(const [t,v] of Object.entries(r.neu)){
    if(!v){ mangel.push('NEU: '+t+' fehlt'); continue; }
    pruef('NEU',v.liz&&v.st&&v.regal>0&&v.markt,t+' unvollstaendig '+JSON.stringify(v));
    pruef('NEU',v.marge>=2.1&&v.marge<=2.6,t+' Marge '+v.marge+' faellt aus der Reihe');
    pruef('NEU',v.gruppe!=='sonstiges',t+' in keiner Warengruppe');
  }
  pruef('NEU',r.neu.kugel200&&r.neu.kugel200.st==='moerser','Kugel 200 gehoert in den Moerser');
  pruef('NEU',r.neu.titanraketen&&r.neu.titanraketen.st==='rampe'&&r.neu.pfeifraketen.st==='rampe','Raketen gehoeren in die Roehren');
  for(const [t,[soll,ist]] of Object.entries(r.schuss))
    pruef('SCHUSS',Math.abs(ist-soll)<=Math.max(2,soll*0.05),t+': Name sagt '+soll+', Drehbuch hat '+ist);
  r.leiter.forEach((e,i)=>{ if(!i) return; const v=r.leiter[i-1];
    pruef('LEITER',e[1]>v[1]&&e[2]>v[2],e[0]+' ('+e[1]+' Schuss, '+e[2]+' s) steigert '+v[0]+' ('+v[1]+', '+v[2]+' s) nicht'); });
  pruef('EFFEKTE',!r.fehlend.length&&!r.neueEff.length,'fehlen: '+r.fehlend.concat(r.neueEff));

  /* Goetterzorn: wie viele Brueche gehen im selben Moment auf? */
  const kz=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.run(20,0.05);
    const zeiten=[]; let uhr=0;
    const orig={};
    Object.keys(bb.EFF).forEach(k=>{ orig[k]=bb.EFF[k]; bb.EFF[k]=function(){ zeiten.push(+uhr.toFixed(2)); return orig[k].apply(this,arguments); }; });
    const pad={x:5,y:1.7,z:-23};
    bb.kugelbombe(pad,4);
    for(let i=0;i<120;i++){ bb.run(0.05,0.05); uhr+=0.05; }
    Object.keys(orig).forEach(k=>{ bb.EFF[k]=orig[k]; });
    const proZeit={}; zeiten.forEach(t=>{ proZeit[t]=(proZeit[t]||0)+1; });
    o.gesamt=zeiten.length; o.maxGleichzeitig=Math.max(...Object.values(proZeit));
    o.hoehe=null;
    /* Bruchhoehe der 200er */
    bb.run(12,0.05);
    bb.kugelbombe(pad,4); let hmax=0;
    for(let i=0;i<60;i++){ bb.run(0.05,0.05); bb.rockets.forEach(q=>{ hmax=Math.max(hmax,q.p.y); }); }
    o.hoehe=+hmax.toFixed(1);
    bb.run(14,0.05);
    return o;
  });
  console.log('GOETTERZORN',JSON.stringify(kz));
  pruef('GOETTERZORN',kz.maxGleichzeitig>=10,'nur '+kz.maxGleichzeitig+' Brueche gleichzeitig');
  pruef('GOETTERZORN',kz.hoehe>22&&kz.hoehe<40,'Bruchhoehe '+kz.hoehe+' m');

  /* Jedes Feuerwerk: letzter Schuss vor dem Abraeumen, keine Fehler */
  const lauf=await p.evaluate(()=>{
    const bb=window.__bb,P=bb.P,o={zuSpaet:[],still:[]};
    const typen=Object.keys(P).filter(t=>P[t].cat===2&&!P[t].rezept);
    for(const t of typen){
      bb.run(6,0.1);
      const pad=bb.stationOf(t)==='moerser'?{x:5,y:1.7,z:-23,ab:0.3,jit:0}:{x:3,y:0.95,z:-18,ab:0.1,jit:0.05};
      let letzter=-1, n0=bb.rockets.length, uhr=0, partikel=0;
      const dauer=bb.brennDauer(t);
      bb.igniteType(t,pad);
      for(let k=0;k<Math.ceil((dauer+6)/0.1);k++){
        bb.run(0.1,0.1); uhr+=0.1;
        if(bb.rockets.length>n0) letzter=uhr;
        n0=bb.rockets.length;
        if(k%5===0){ let n=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let i=0;i<ps.life.length;i++) if(ps.life[i]>0) n++; partikel=Math.max(partikel,n); }
      }
      if(letzter>dauer+0.05) o.zuSpaet.push(t+': letzter Schuss '+letzter.toFixed(1)+' s, abgeraeumt nach '+dauer.toFixed(1)+' s');
      if(partikel<30) o.still.push(t+' ('+partikel+')');
    }
    o.anzahl=typen.length;
    return o;
  });
  console.log('LAUF    ',JSON.stringify(lauf));
  pruef('LAUF',!lauf.zuSpaet.length,lauf.zuSpaet.join(' | '));
  pruef('LAUF',!lauf.still.length,'ohne sichtbaren Effekt: '+lauf.still.join(', '));

  /* Pfeifraketen: Spirale im Schweif; Titan: drei Brueche je Rakete */
  const rk=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.run(10,0.1);
    bb.igniteType('pfeifraketen',{x:3,y:1.3,z:-18,ab:0.1,jit:0});
    bb.run(0.3,0.05);
    const q=bb.rockets.find(x=>x.pfeif); o.pfeif=!!q;
    bb.run(10,0.1);
    const zeiten=[]; let uhr=0; const orig={};
    Object.keys(bb.EFF).forEach(k=>{ orig[k]=bb.EFF[k]; bb.EFF[k]=function(){ zeiten.push(k); return orig[k].apply(this,arguments); }; });
    bb.igniteType('titanraketen',{x:3,y:1.3,z:-18,ab:0.1,jit:0});
    bb.run(bb.brennDauer('titanraketen')+3,0.05);
    Object.keys(orig).forEach(k=>{ bb.EFF[k]=orig[k]; });
    o.titanBrueche=zeiten.length; o.titanArten=[...new Set(zeiten)];
    return o;
  });
  console.log('RAKETEN ',JSON.stringify(rk));
  pruef('RAKETEN',rk.pfeif,'Pfeifrakete ohne Spirale');
  pruef('RAKETEN',rk.titanBrueche>=9,'Titan: '+rk.titanBrueche+' Brueche statt 3 x 3');

  /* Pakete: Themenpakete nur mit Ware der Gruppe, Preis unter dem
     mittleren Einkaufswert; gesperrt, solange die Gruppe fehlt */
  const pk=await p.evaluate(()=>{
    const bb=window.__bb,P=bb.P,o={};
    const wert=l=>l.reduce((a,t)=>a+bb.costOf(t)*P[t].box,0);
    o.pakete={};
    bb.PACKS.forEach(pk=>{
      let summe=0, fremd=0; const N=1000;
      for(let i=0;i<N;i++){ const l=bb.packContents(pk.n,pk.gruppe); summe+=wert(l);
        if(pk.gruppe) fremd+=l.filter(t=>bb.GRUPPE[pk.gruppe].indexOf(t)<0).length; }
      const preis=bb.packPreis(pk);
      o.pakete[pk.id]={preis,offen:bb.packOffen(pk),wertZuPreis:+(summe/N/preis).toFixed(2),fremd};
    });
    /* Kauf: Geld runter um den Preis, Kartons unterwegs */
    const vor=bb.S.money, off=bb.pending.length, vk=bb.PACKS.find(x=>x.id==='verbundpaket');
    bb.buyPack('verbundpaket');
    o.kauf={bezahlt:+(vor-bb.S.money).toFixed(2),preis:bb.packPreis(vk),kartons:bb.pending.length-off};
    /* ohne Lizenzen: Raketen-Paket und Kugelkiste gesperrt */
    const lic=bb.S.lic.slice(); bb.S.lic=[];
    o.ohneLizenz=bb.PACKS.filter(x=>x.gruppe&&x.gruppe!=='boeller').map(x=>x.id+':'+bb.packOffen(x));
    bb.S.lic=lic;
    return o;
  });
  console.log('PAKETE  ',JSON.stringify(pk));
  for(const [id,v] of Object.entries(pk.pakete)){
    pruef('PAKETE',v.offen&&v.preis>0,id+' nicht kaufbar');
    pruef('PAKETE',!v.fremd,id+' enthaelt '+v.fremd+' Kartons aus anderen Gruppen');
    pruef('PAKETE',v.wertZuPreis>1.0&&v.wertZuPreis<1.4,id+' Wert/Preis '+v.wertZuPreis+' (unter 1 lohnt es nie, ueber 1.4 ist es geschenkt)');
  }
  pruef('PAKETE',pk.pakete.tuete.wertZuPreis<pk.pakete.kiste.wertZuPreis&&pk.pakete.kiste.wertZuPreis<pk.pakete.palette.wertZuPreis,'groessere Wundertueten sind je Karton nicht guenstiger');
  pruef('PAKETE',Math.abs(pk.kauf.bezahlt-pk.kauf.preis)<0.01&&pk.kauf.kartons===5,'Kauf stimmt nicht: '+JSON.stringify(pk.kauf));
  pruef('PAKETE',pk.ohneLizenz.every(x=>x.endsWith(':false')),'ohne Lizenz kaufbar: '+pk.ohneLizenz);

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Produktgroessen (Tom, 25.09.): die wirklich krassen Batterien viel,
   viel groesser, der Atom-Boeller mit eigenem Aussehen. Dazu: nichts
   steht hoeher als sein Fach, und auf dem Zuendtisch ragt kein
   Produkt in den Nachbarplatz. */
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
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, P=bb.P, o={};
    S.level=40; S.money=1e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id)); bb.testKauf('testfeld');
    const vol=t=>P[t].dims[0]*P[t].dims[1]*P[t].dims[2];
    const BATT=['batterie16','knatter','batterie49','kometen','batterie100','donnerwand','profi','finale'];
    o.batt=BATT.map(t=>({t,preis:P[t].market,vol:+vol(t).toFixed(4),h:P[t].dims[1]}));
    o.leiter=BATT.slice(1).filter((t,i)=>!(vol(t)>vol(BATT[i]))).map(t=>t);
    o.gross=['donnerwand','profi','finale'].map(t=>+(vol(t)/vol('batterie16')).toFixed(1));
    o.atom={form:P.atomboeller.shape,teile:bb.pools.atomboeller.meshes.length};
    /* Faecher: was Kapazitaet hat, passt in die Hoehe; jede Ware
       findet in jedem normalen Regal wenigstens ein Fach */
    o.zuHoch=[]; o.ohneFach=[];
    for(const kind of Object.keys(bb.SHELFKIND)){ const K=bb.SHELFKIND[kind];
      for(const t of bb.ORDER){ const q=P[t]; if(q.noShelf) continue; if(K.cold&&!q.cold) continue; if(!K.cold&&q.kuehlpflicht) continue;
        let irgendwo=false;
        K.lv.forEach((_,li)=>{ const L=bb.layout(t,{kind},{li}); if(L.cap>0){ irgendwo=true; if(q.dims[1]>bb.fachHoehe(K,li)+0.001) o.zuHoch.push(kind+'/'+li+'/'+t); } });
        if(!irgendwo&&!K.cold) o.ohneFach.push(kind+'/'+t); } }
    /* Zuendtisch: drei gleiche Produkte nebeneinander */
    const st=bb.stations.tisch; o.tisch=[];
    for(const t of ['finale','profi','donnerwand','faecher','zfaecher','batterie100','atomboeller']){
      bb.clearStations(); for(let k=0;k<3;k++){ S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st); }
      const fp=st.items.map(it=>{ const e=it.h.m.elements, cx=Math.hypot(e[0],e[2]), sx=Math.hypot(e[8],e[10]);
        /* Breite entlang der Tischkante: Anteil der Produkt-x- und -z-Achse an Welt-x */
        return Math.abs(e[0])/cx*P[t].dims[0]+Math.abs(e[8])/sx*P[t].dims[2]; });
      o.tisch.push({t,n:st.items.length,breit:+Math.max(...fp).toFixed(2)}); }
    bb.clearStations(); S.carrying=null;
    return o; });
  console.log('BATT',JSON.stringify(r.batt)); console.log('GROSS',JSON.stringify(r.gross),'LEITER',JSON.stringify(r.leiter),'ATOM',JSON.stringify(r.atom));
  console.log('ZU_HOCH',r.zuHoch.length,JSON.stringify(r.zuHoch.slice(0,6)),'OHNE_FACH',JSON.stringify(r.ohneFach.slice(0,6)));
  console.log('TISCH',JSON.stringify(r.tisch));
  pruef('LEITER',!r.leiter.length,'Batterie nicht groesser als die kleinere davor: '+r.leiter);
  pruef('KRASS',r.gross.every(x=>x>=18),'die grossen Verbunde sind nur '+r.gross+'x so gross wie die 16er');
  pruef('ATOM',r.atom.form==='atombombe'&&r.atom.teile>=3,'Atom-Boeller ohne eigenes Modell: '+JSON.stringify(r.atom));
  pruef('FACHHOEHE',!r.zuHoch.length,r.zuHoch.length+' Ware hoeher als ihr Fach, z.B. '+r.zuHoch.slice(0,3));
  pruef('REGALPLATZ',!r.ohneFach.length,'passt in kein Fach: '+r.ohneFach.slice(0,5));
  r.tisch.forEach(x=>pruef('TISCH',x.n===3&&x.breit<=0.78,x.t+': '+x.n+' Stueck, '+x.breit+' m breit bei 0,8 m Abstand'));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

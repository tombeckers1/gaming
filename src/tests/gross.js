/* Produktgroessen (Tom, 25.09.): die wirklich krassen Batterien viel,
   viel groesser, der Atom-Boeller mit eigenem Aussehen. Dazu: nichts
   steht hoeher als sein Fach, und auf dem Zuendtisch ragt kein
   Produkt in den Nachbarplatz (seit 28.09.: 1,1 m Abstand, alles
   steht mit der Breite quer). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:120000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:120000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  /* 28.09.: Lade-Grenzen 120 s wie in fwtest.js - unter Last lief das Laden in die 30 s */
  p.setDefaultTimeout(120000);
  await p.goto('file://'+process.argv[2],{timeout:120000});
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload({timeout:120000}); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, P=bb.P, o={};
    S.level=40; S.money=1e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id)); bb.testKauf('testfeld');
    const vol=t=>P[t].dims[0]*P[t].dims[1]*P[t].dims[2];
    const BATT=['goldpalmen','knatter','lb_polarweiden','lb_goldader','donnerwand','profi','finale']; /* 06.10.: Feuersturm, Schimmelreiter und Z-Faecher sind raus */
    o.batt=BATT.map(t=>({t,preis:P[t].market,vol:+vol(t).toFixed(4),h:P[t].dims[1]}));
    o.leiter=BATT.slice(1).filter((t,i)=>!(vol(t)>vol(BATT[i]))).map(t=>t);
    o.gross=['donnerwand','profi','finale'].map(t=>+(vol(t)/vol('goldpalmen')).toFixed(1));
    o.atom={form:P.atomboeller.shape,teile:bb.pools.atomboeller.meshes.length};
    /* Faecher: was Kapazitaet hat, passt in die Hoehe. Jede Ware findet
       ein Regal, das es spaetestens mit ihr gibt; Kuehlpflichtiges passt
       in den Kuehlschrank. */
    o.zuHoch=[]; o.ohneFach=[];
    const passt=(kind,t)=>bb.SHELFKIND[kind].lv.some((_,li)=>bb.layout(t,{kind},{li}).cap>0);
    for(const kind of Object.keys(bb.SHELFKIND)){ const K=bb.SHELFKIND[kind];
      for(const t of bb.ORDER){ const q=P[t]; if(q.noShelf) continue; if(K.cold&&!q.cold) continue; if(!K.cold&&q.kuehlpflicht) continue;
        K.lv.forEach((_,li)=>{ const L=bb.layout(t,{kind},{li}); if(L.cap>0&&q.dims[1]>bb.fachHoehe(K,li)+0.001) o.zuHoch.push(kind+'/'+li+'/'+t); }); } }
    for(const t of bb.ORDER){ const q=P[t]; if(q.noShelf) continue;
      const kinds=Object.keys(bb.SHELFKIND).filter(k=>{ const K=bb.SHELFKIND[k]; return (q.kuehlpflicht?K.cold:!K.cold)&&K.lvl<=Math.max(q.lvl,bb.lizLevel(t)); });
      if(!kinds.some(k=>passt(k,t))) o.ohneFach.push(t); }
    /* ueber mehrere Etagen: fast so hoch wie zwei Faecher eines
       Verkaufsregals, passt nur ins Grossverbund-Regal */
    const Ks=bb.SHELFKIND.standard;
    /* 01.10.: Faecher des Verkaufsregals jetzt alle gleich (0,52 m statt
       0,465 unten) - der Massstab bleibt "fast zwei Faecher hoch" */
    o.etagen={h:P.finale.dims[1],zwei:+(1.7*bb.fachHoehe(Ks,0)).toFixed(3),gross:passt('gross','finale'),standard:passt('standard','finale')};
    /* alles groesser als vorher (Masse vom 25.09. vormittags) */
    const ALT={wunder:0.3,tisch:0.21,raketen:0.52,sekt:0.3,fontaene:0.22,ballons:0.28,knallerbsen:null,roemisch:0.34,vulkan:0.3,konfetti:0.21};
    o.kleiner=Object.keys(ALT).filter(t=>ALT[t]&&P[t]&&Math.max(...P[t].dims)<ALT[t]*1.2); /* 29.09.: entfernte Produkte zaehlen nicht */
    /* Zuendtisch: drei gleiche Produkte nebeneinander */
    const st=bb.stations.tisch; o.tisch=[];
    /* 28.09.: Plaetze 1,1 m auseinander, alles steht mit der Breite quer
       (auch die Fontaenen-Sets bis 1 m) */
    o.abstand=+(bb.TISCH_X[1]-bb.TISCH_X[0]).toFixed(2);
    for(const t of ['finale','profi','donnerwand','faecher','zfaecher','zfaecher','atomboeller','feuerkaskade','wasserspiel'].filter(t=>P[t])){
      bb.clearStations(); for(let k=0;k<3;k++){ S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st); }
      /* 01.10. abends: Batterien stehen als eigenes Modell (it.batt.g), sonst im Pool (it.h.m) */
      const fp=st.items.map(it=>{ const M=it.batt?(it.batt.g.updateMatrixWorld(true),it.batt.g.matrixWorld):it.h.m; const e=M.elements, cx=Math.hypot(e[0],e[2]), sx=Math.hypot(e[8],e[10]);
        /* Breite entlang der Tischkante: Anteil der Produkt-x- und -z-Achse an Welt-x */
        return Math.abs(e[0])/cx*P[t].dims[0]+Math.abs(e[8])/sx*P[t].dims[2]; });
      o.tisch.push({t,n:st.items.length,breit:+Math.max(...fp).toFixed(2)}); }
    bb.clearStations(); S.carrying=null;
    return o; });
  console.log('BATT',JSON.stringify(r.batt)); console.log('GROSS',JSON.stringify(r.gross),'LEITER',JSON.stringify(r.leiter),'ATOM',JSON.stringify(r.atom));
  console.log('ZU_HOCH',r.zuHoch.length,JSON.stringify(r.zuHoch.slice(0,6)),'OHNE_FACH',JSON.stringify(r.ohneFach));
  console.log('TISCH',JSON.stringify(r.tisch)); console.log('ETAGEN',JSON.stringify(r.etagen),'KLEINER',JSON.stringify(r.kleiner));
  pruef('LEITER',!r.leiter.length,'Batterie nicht groesser als die kleinere davor: '+r.leiter);
  pruef('KRASS',r.gross.every(x=>x>=18),'die grossen Verbunde sind nur '+r.gross+'x so gross wie die 16er');
  pruef('ATOM',r.atom.form==='atombombe'&&r.atom.teile>=3,'Atom-Boeller ohne eigenes Modell: '+JSON.stringify(r.atom));
  pruef('FACHHOEHE',!r.zuHoch.length,r.zuHoch.length+' Ware hoeher als ihr Fach, z.B. '+r.zuHoch.slice(0,3));
  pruef('REGALPLATZ',!r.ohneFach.length,'passt in kein Fach: '+r.ohneFach.slice(0,5));
  pruef('ETAGEN',r.etagen.h>r.etagen.zwei&&r.etagen.gross&&!r.etagen.standard,'Weltuntergang nicht ueber mehrere Etagen: '+JSON.stringify(r.etagen));
  pruef('GROESSER',!r.kleiner.length,'nicht groesser geworden: '+r.kleiner);
  r.tisch.forEach(x=>pruef('TISCH',x.n===3&&x.breit<=r.abstand-0.04,x.t+': '+x.n+' Stueck, '+x.breit+' m breit bei '+r.abstand+' m Abstand'));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

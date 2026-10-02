/* Regale, Kartons und Module (Tom, 02.10., Foto Wunderkerzen: "im Karton
   36, ins Fach passen 39 - ein Karton soll komplett in die Reihe passen;
   nicht nur vorne eine Reihe; ein grosses Regal hat genau doppelt so viel
   wie ein kleines"). Fuer jedes bestellbare Produkt und jedes Moebel:
   - GANZ: jedes Fach fasst ganze Kartons (Fassung ist ein Vielfaches der
     Stueckzahl im Karton)
   - DOPPELT: Verkaufsregal = 2 x kleines Regal; Hochregal und Gondel wie
     das Verkaufsregal, Eckregal und Kuehlschrank wie das kleine;
     grosser Tisch = 2 x Tisch; Gitterbox gross = 2 x Gitterbox, XL = 2 x gross
   - TIEFE: im Verkaufsregal steht die Ware auch hintereinander - flache
     Packungen fuellen mindestens 60 % der Fachtiefe
   - KARTON: in jedem Fach, in das ein Produkt passt, geht mindestens ein
     voller Karton (sonst bliebe Ware im Karton uebrig)
   Aufruf: node kartons.js test.html
   Gegenprobe (02.10.): alter Stand (V98) -> GANZ, DOPPELT und TIEFE
   schlagen an (Wunderkerzen: 39 im Fach, Karton 36). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, P=bb.P, K=bb.SHELFKIND, o={ganz:[],doppelt:[],tiefe:[],karton:[],n:0,beispiel:{}};
    const ks=['klein','standard','hoch','gondel','eck','kuehl','tisch','tischgross','gitter','gitter2','gitter3','gross'];
    const fach=(t,k,li)=>bb.layout(t,{kind:k,levels:[]},{li});
    const maxi=(t,k)=>Math.max(...K[k].lv.map((_,li)=>fach(t,k,li).cap));
    for(const t of bb.ORDER){ const q=P[t]; if(!q||q.noOrder||!q.dims) continue; o.n++;
      const c={}; ks.forEach(k=>{ c[k]=maxi(t,k);
        K[k].lv.forEach((_,li)=>{ const L=fach(t,k,li); if(L.cap%q.box) o.ganz.push(`${t} ${k}/${li}: ${L.cap} bei Karton ${q.box}`);
          if(L.cap>0&&L.cap<q.box) o.karton.push(`${t} ${k}/${li}: ${L.cap}<${q.box}`); }); });
      if(t==='wunder') o.beispiel={box:q.box,klein:c.klein,standard:c.standard,tisch:c.tisch,tischgross:c.tischgross};
      const paare=[['standard','klein',2],['hoch','standard',1],['gondel','standard',1],['eck','klein',1],['kuehl','klein',1],['tischgross','tisch',2],['gitter2','gitter',2],['gitter3','gitter2',2]];
      paare.forEach(([a,bb2,f])=>{ if(c[bb2]>0&&c[a]!==f*c[bb2]) o.doppelt.push(`${t}: ${a} ${c[a]} statt ${f}x${bb2} ${c[bb2]}`); });
      const L=fach(t,'standard',0);
      if(L.cap>0&&q.dims[2]<=0.2&&L.rows*(q.dims[2]+L.g)<0.6*0.44) o.tiefe.push(`${t}: ${L.rows} Reihe(n) a ${q.dims[2].toFixed(2)} m`); }
    return o; });
  console.log('Produkte',r.n,'| Wunderkerzen:',JSON.stringify(r.beispiel));
  const m=[];
  if(r.ganz.length) m.push('GANZ '+r.ganz.length+'x: '+r.ganz.slice(0,6).join(' | '));
  if(r.doppelt.length) m.push('DOPPELT '+r.doppelt.length+'x: '+r.doppelt.slice(0,6).join(' | '));
  if(r.tiefe.length) m.push('TIEFE '+r.tiefe.length+'x: '+r.tiefe.slice(0,6).join(' | '));
  if(r.karton.length) m.push('KARTON '+r.karton.length+'x: '+r.karton.slice(0,6).join(' | '));
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

/* Passform aller Produkte (Tom, 02.10.: "dass jedes Produkt irgendwo
   reinpasst, auch schoen - ich will nicht jedes einzelne testen; wenn
   nicht, Meldung 'passt nicht ins Regal'"):
   - PLATZ: jedes bestellbare Produkt passt in mindestens ein Moebel, das es
     spaetestens auf seinem Level gibt - mit Platz fuer mindestens einen
     vollen Karton (02.10.: vorher zwei Stueck)
   - KANTE: wo ein Produkt als passend gilt, steht es nirgends ueber -
     die ganze Anordnung (Spalten, Reihen, Lagen) liegt im Fach
   - MELDUNG: in ein zu kleines Fach gibt es die Meldung "passt nicht"
   Aufruf: node passform.js test.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, P=bb.P, K=bb.SHELFKIND, o={keins:[],knapp:[],kante:[],geprueft:0};
    const RW=bb.REGALWARE.filter(x=>x.art==='shelf');
    const fh=(Kk,li)=>li<Kk.lv.length-1?Kk.lv[li+1]-Kk.lv[li]-0.04:(Kk.oben!==undefined?Kk.oben:(Kk.cold?0.44:0.58));
    for(const t of bb.ORDER){ const q=P[t]; if(!q||q.noOrder||!q.dims) continue; o.geprueft++;
      const passt=[];
      for(const rw of RW){ const Kk=K[rw.kind]; if(!Kk) continue; if(Kk.cold?!q.cold:q.kuehlpflicht) continue;
        let best=0;
        Kk.lv.forEach((_,li)=>{ const L=bb.layout(t,{kind:rw.kind,levels:[]},{li}); if(L.cap>0){ best=Math.max(best,L.cap);
          const B=L.cols*(L.w+L.g)-L.g, T=L.rows*(L.d+L.g)-L.g+0.03, H=L.st*L.h;
          if(B>Kk.w-0.06+0.001||T>Kk.d+0.001||H>fh(Kk,li)+0.001) o.kante.push(t+' in '+rw.kind+' Fach '+li+' ('+B.toFixed(2)+'x'+T.toFixed(2)+'x'+H.toFixed(2)+')'); } });
        if(best>0) passt.push({k:rw.kind,lvl:rw.lvl,cap:best}); }
      if(!passt.length){ o.keins.push(t); continue; }
      const da=passt.filter(x=>x.lvl<=Math.max(q.lvl,1)); const capDa=da.length?Math.max(...da.map(x=>x.cap)):0;
      if(capDa<q.box) o.knapp.push(t+' (L'+q.lvl+'): '+(da.length?'nur '+capDa+' Stueck, Karton '+q.box:'erst ab L'+Math.min(...passt.map(x=>x.lvl)))); }
    /* Meldung: Weltuntergang ins kleine Regal */
    bb.regalStellen('klein'); const sh=bb.shelves[bb.shelves.length-1], lv=sh.levels[0];
    const S=bb.S; S.carrying={type:'finale',count:1,q:1}; bb.aimAt&&0;
    o.meldungCap=bb.capOf(lv,'finale');
    let hinweis=null; try{ hinweis=bb.promptFor&&bb.promptFor({kind:'level',ref:lv}); }catch(e){ hinweis='FEHLER '+e.message; }
    o.hinweis=hinweis&&hinweis.t; S.carrying=null;
    return o; });
  console.log('geprueft',r.geprueft,'Produkte; Meldung:',r.hinweis);
  const m=[];
  if(r.keins.length) m.push('PLATZ ohne Moebel: '+r.keins.join(', '));
  if(r.knapp.length) m.push('PLATZ knapp: '+r.knapp.slice(0,12).join(' | '));
  if(r.kante.length) m.push('KANTE '+r.kante.length+'x ueber die Kante, z.B. '+r.kante.slice(0,6).join(' | '));
  if(r.meldungCap!==0||!/passt nicht/i.test(r.hinweis||'')) m.push('MELDUNG: '+r.meldungCap+' / '+r.hinweis);
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

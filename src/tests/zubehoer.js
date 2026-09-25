/* Partyzubehoer, Getraenke, Fondue und Raclette (Tom, 25.09.): alles ist
   Zubehoer und kommt nie aufs Testfeld, hat eine Lizenz und einen Markt,
   ist nicht winzig, frische Platten nur im Kuehlregal. Dazu: die Ware
   fuellt jedes Fach von links bis rechts. */
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
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const NEU=['stabfeuerzeug','ballons','partyhuete','luftruessel','girlanden','folienvorhang','tischdeko','geschirr','partyspiel','secco','partyfass','gluehwein','fonduegeraet','raclettegeraet','fondueessen','racletteessen'];
  const r=await p.evaluate(NEU=>{ const bb=window.__bb, S=bb.S, P=bb.P, o={};
    S.level=40; S.money=1e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    ['REGAL:standard','REGAL:standard','REGAL:kuehl'].forEach(id=>bb.testKauf(id));
    const kuehl=bb.shelves.find(s=>s.kind==='kuehl'), normal=bb.shelves.find(s=>s.kind==='standard');
    o.produkte=NEU.map(t=>{ const q=P[t]; if(!q) return {t,fehlt:true};
      /* aufs Testfeld? */
      const st=bb.stations.tisch, vor=st.items.length; S.carrying={type:t,count:1,q:1}; bb.placeOnStation(st); const testfeld=st.items.length>vor||bb.stationOf(t)!==null; S.carrying=null;
      const lv=l=>l.sh===kuehl, inKuehl=bb.allLevels().some(l=>lv(l)&&bb.canStockType?true:true);
      return {t,cat:q.cat,liz:bb.lizenzOf(t),vola:bb.VOLA[t]>0,gruppe:Object.keys(bb.GRUPPE).find(g=>bb.GRUPPE[g].includes(t))||null,
        testfeld,marge:+(q.market/q.cost).toFixed(2),gross:Math.max(q.dims[0],q.dims[1]),
        normal:bb.shelfAccepts(normal,t),kuehl:bb.shelfAccepts(kuehl,t),cold:!!q.cold,pflicht:!!q.kuehlpflicht,
        cap:bb.shelfCapOf(t),kauf:+bb.buyChance(t,bb.marketOf(t),1,false,null).toFixed(2)}; });
    o.kiste=bb.PACKS.find(x=>x.id==='partykiste'); o.kisteOffen=o.kiste?bb.packOffen(o.kiste):false;
    /* Fuellung: auf jedem Regaltyp bleibt links und rechts hoechstens
       ein halber Artikel frei */
    o.luecken=[];
    for(const kind of Object.keys(bb.SHELFKIND)){ const K=bb.SHELFKIND[kind];
      for(const t of bb.ORDER){ const q=P[t]; if(q.noShelf) continue; if(K.cold&&!q.cold) continue; if(!K.cold&&q.kuehlpflicht) continue;
        const L=bb.layout(t,{kind}); const breit=L.cols*(L.w+L.g)-L.g, frei=(K.w-0.1)-breit;
        if(frei>q.dims[0]+L.g+0.001) o.luecken.push(kind+'/'+t+' '+frei.toFixed(2)+' m frei'); } }
    return o; },NEU);
  r.produkte.forEach(x=>console.log(x.t.padEnd(15),JSON.stringify(x)));
  console.log('KISTE   ',JSON.stringify({da:!!r.kiste,offen:r.kisteOffen}),'LUECKEN',r.luecken.length,JSON.stringify(r.luecken.slice(0,5)));
  r.produkte.forEach(x=>{
    if(x.fehlt){ pruef('DA',false,x.t+' fehlt'); return; }
    pruef('ZUBEHOER',x.cat===0&&!x.testfeld,x.t+' ist kein Zubehoer oder kommt aufs Testfeld');
    pruef('LIZENZ',!!x.liz&&x.vola&&!!x.gruppe,x.t+': Lizenz '+x.liz+', Markt '+x.vola+', Gruppe '+x.gruppe);
    pruef('PREIS',x.marge>=2.3&&x.marge<=2.8,x.t+' Marge '+x.marge);
    pruef('GROESSE',x.gross>=0.2,x.t+' ist winzig ('+x.gross+' m)');
    pruef('REGAL',x.cap>0&&x.kauf>0,x.t+' passt in kein Regal oder wird nie gekauft');
    if(x.pflicht) pruef('KUEHL',x.kuehl&&!x.normal,x.t+' muss ins Kuehlregal');
    if(x.cold&&!x.pflicht) pruef('KUEHL',x.kuehl,x.t+' passt nicht in den Kuehlschrank');
  });
  pruef('KISTE',r.kiste&&r.kisteOffen,'Partykiste fehlt oder ist zu');
  pruef('FUELLUNG',!r.luecken.length,r.luecken.length+' Faecher halb leer, z.B. '+r.luecken.slice(0,3).join(' | '));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

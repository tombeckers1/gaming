/* Tourplanung des Versands (Tom, 08.10.): kein Versand-Pickregal - der Packer pickt mit dem Rollwagen aus
   dem ganzen Kartonlager und nimmt mehrere Bestellungen je Tour, so effizient wie moeglich.
   Gemessen wird ohne Zeitablauf (schnell): fester Bestellsatz, wiederholt vsPlan + vsStopsBauen, bis alles
   verplant ist. Verglichen werden die alte Planung (VS_OPT.an=false: Eingangsreihenfolge, naechster Nachbar)
   und die neue (Buendelung nach Wegnaehe, 2-opt, naechste Quelle). Mass: Luftlinie des Rundwegs ab dem
   Packtisch ueber alle Stopps und zurueck, je Paket.
   Pruefungen: neue Planung deutlich kuerzer; jede Bestellung genau einmal und nicht ewig zurueckgestellt;
   je Ware keine Quelle doppelt (gleiche Ware mehrerer Bestellungen an einem Stopp); Stueckzahlen stimmen.
   Gegenprobe: schaltet man die Verbesserung aus, schlaegt dieselbe Pruefung an.
   Aufruf: node tourplan.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}}); p.setDefaultTimeout(240000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=40; S.money=9e6; S.lic=bb.LIZENZEN.map(l=>l.id);
    ['shop_halb','lager','lager_nord','lager_gross','lager_sued','lager_sued2','packstation','onlineshop'].forEach(id=>bb.testKauf(id)); S.up.onlineshop=true;
    let nR=0; for(let i=0;i<30;i++){ const before=bb.racks.length; bb.regalStellen('rack'); if(bb.racks.length>before) nR++; }
    bb.floorBoxes.slice().forEach(x=>bb.removeFloorBox(x));
    bb.allLevels().forEach(l=>{ while(l.count>0) bb.removeFromLevel(l); });
    bb.racks.forEach(rk=>rk.slots.forEach(s=>{ if(s.box){ rk.g.remove(s.box.mesh); s.box=null; } }));
    bb.run(1,0.05);
    /* Ware ueber alle erreichbaren Lagerfaecher verteilt: je Fach eine andere Sorte, reichlich Bestand */
    const sorten=bb.ORDER.filter(t=>bb.P[t]&&!bb.P[t].noOrder&&!bb.P[t].noShelf&&bb.P[t].cat!==undefined&&bb.vsKlasse([{t,n:1}])===1);
    const belegt=[];
    /* je Sorte ein Lagerfach, reihum ueber alle Regale - so verteilt sich die Ware ueber alle Hallen */
    for(let i=0;i<sorten.length&&belegt.length<60;i++){ const rk=bb.racks[(i*7)%bb.racks.length]; const s=rk&&rk.slots.find(q=>!q.box); if(!s) continue; bb.putInSlot(s,sorten[i],200,1); if(s.box) belegt.push(sorten[i]); }
    o.sorten=belegt.length; o.racks=bb.racks.length;
    { const h0=bb.vsWelt(0,-0.5+0.845,0.99); const ds=bb.racks.filter(rk=>rk.slots.some(q=>q.box)).map(rk=>Math.hypot(rk.g.position.x-h0.x,rk.g.position.z-h0.z)); o.abstand={min:+Math.min(...ds).toFixed(1),max:+Math.max(...ds).toFixed(1),n:ds.length}; }
    /* fester Bestellsatz (LCG), 48 Bestellungen mit 1-3 Positionen */
    let z=12345; const rnd=()=>{ z=(z*1103515245+12345)&0x7fffffff; return z/0x7fffffff; };
    const satz=[]; for(let i=0;i<48;i++){ const np=1+Math.floor(rnd()*3), pos=[]; for(let j=0;j<np;j++){ const t=belegt[Math.floor(rnd()*belegt.length)]; if(!pos.some(q=>q.t===t)) pos.push({t,n:1+Math.floor(rnd()*2),g:0}); } satz.push(pos); }
    const heim=bb.vsWelt(0,bb.vsPK(0).gx,bb.vsPK(0).gz);   /* dort steht der Wagen am Tisch */
    const messen=(an)=>{
      bb.VS_OPT.an=an;
      S.bestellungen=satz.map((pos,i)=>({id:i+1,pos:pos.map(q=>Object.assign({},q)),gr:1,st:'offen',tag:S.day,wert:5,versand:0}));
      const tourvonB={}; let strecke=0, anfahrt=0, pakete=0, touren=0, doppelt=0, summeFalsch=0, maxWarten=0, wuenschtouren=[];
      let guard=0;
      while(S.bestellungen.some(x=>x.st==='offen')&&guard++<60){
        const plan=bb.vsPlan(0); if(!plan) break; touren++;
        const need=bb.vsBedarf(plan);
        const stops=bb.vsStopsBauen(need,heim);
        strecke+=bb.vsRouteLaenge(stops,heim); if(stops.length){ const d0=Math.hypot(stops[0].stand.x-heim.x,stops[0].stand.z-heim.z), d1=Math.hypot(stops[stops.length-1].stand.x-heim.x,stops[stops.length-1].stand.z-heim.z); anfahrt+=d0+d1; } const st=plan.auf.reduce((a,x)=>a+x.b.pos.reduce((c,l)=>c+l.n,0),0); pakete+=plan.auf.length; wuenschtouren.push(plan.auf.length);
        /* keine Quelle doppelt, Stueckzahlen stimmen */
        const ids=new Map(); stops.forEach(s=>{ let m=ids.get(s.ref); if(!m){ m=new Set(); ids.set(s.ref,m); } if(m.has(s.t)) doppelt++; m.add(s.t); });
        const sum={}; stops.forEach(s=>{ sum[s.t]=(sum[s.t]||0)+s.k; }); for(const t in need) if(sum[t]!==need[t]) summeFalsch++;
        plan.auf.forEach(a=>{ a.b.st='fertig'; tourvonB[a.b.id]=touren; });
        S.bestellungen=S.bestellungen.filter(x=>x.st==='offen');
        /* neu verbleibende offene Bestellungen behalten ihren Zaehler (skip) */
        S.bestellungen.forEach(x=>{ x.wartet=(x.wartet|0)+1; maxWarten=Math.max(maxWarten,x.wartet); });
      }
      const offen=S.bestellungen.length;
      S.bestellungen=[]; S.offen=0;
      return {an,touren,pakete,strecke:+strecke.toFixed(1),imLager:+(strecke-anfahrt).toFixed(1),imLagerProPaket:+((strecke-anfahrt)/Math.max(1,pakete)).toFixed(2),proPaket:+(strecke/Math.max(1,pakete)).toFixed(2),offen,doppelt,summeFalsch,maxWarten,proTour:+(pakete/Math.max(1,touren)).toFixed(2),wuenschtouren:wuenschtouren.slice(0,12)};
    };
    o.alt=messen(false); o.neu=messen(true); o.alt2=messen(false); o.neu2=messen(true);
    bb.VS_OPT.an=true;
    return o; });
  console.log('TOURPLAN',JSON.stringify(r));
  const gewinn=(a,n)=>1-n.proPaket/a.proPaket;
  const g1=gewinn(r.alt,r.neu);
  console.log('GEWINN '+(g1*100).toFixed(1)+' % kuerzere Strecke je Paket ('+r.alt.proPaket+' m -> '+r.neu.proPaket+' m), Touren '+r.alt.touren+' -> '+r.neu.touren);
  pruef('SORTEN',r.sorten>=12,'zu wenige Sorten im Lager: '+r.sorten);
  pruef('ALLE',r.alt.offen===0&&r.neu.offen===0,'Bestellungen bleiben liegen: alt '+r.alt.offen+', neu '+r.neu.offen);
  const gl=1-r.neu.imLagerProPaket/r.alt.imLagerProPaket;
  console.log('IM LAGER (ohne An- und Abfahrt zum Tisch): '+r.alt.imLagerProPaket+' m -> '+r.neu.imLagerProPaket+' m je Paket = '+(gl*100).toFixed(1)+' % weniger');
  pruef('KURZER',g1>=0.03,'die neue Planung spart zu wenig: gesamt '+(g1*100).toFixed(1)+' %, im Lager '+(gl*100).toFixed(1)+' %');
  pruef('NICHT_EWIG',r.neu.maxWarten<=12,'eine Bestellung wartet '+r.neu.maxWarten+' Touren');
  pruef('QUELLE_EINMAL',r.neu.doppelt===0,'dieselbe Quelle kommt in einer Tour doppelt vor: '+r.neu.doppelt);
  pruef('STUECKE',r.neu.summeFalsch===0&&r.alt.summeFalsch===0,'Stueckzahl der Stopps stimmt nicht');
  pruef('REPRODUZIERBAR',Math.abs(r.alt.proPaket-r.alt2.proPaket)<0.01&&Math.abs(r.neu.proPaket-r.neu2.proPaket)<0.01,'Messung nicht wiederholbar');
  /* Gegenprobe: mit abgeschalteter Verbesserung (alt gegen alt) muss dieselbe Pruefung anschlagen */
  const gAlt=gewinn(r.alt,r.alt2), glAlt=1-r.alt2.imLagerProPaket/r.alt.imLagerProPaket;
  pruef('GEGENPROBE',!(gAlt>=0.03),'die Pruefung schlaegt auch ohne Verbesserung nicht an: '+(gAlt*100).toFixed(1)+' %');
  pruef('FEHLER',!errs.length,errs.slice(0,3).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK');
  await b.close(); process.exit(mangel.length?1:0);
})();

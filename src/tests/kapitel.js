/* Kapitel (Toms Wunsch vom 24.09.):
   - Start als Pyro-Kiosk: Lager mit Band gesperrt, Lieferungen
     landen vor der Ladentuer, Regale baut der Lieferant auf
   - Lager kaufen: Kapitel 2 Kleines Fachgeschaeft, Tuer frei,
     der LKW faehrt wieder an die Rampe
   - Grosses Fachgeschaeft mit shop_gross ... Kapitel 7 Pyro-Logistik mit lager_west, Finale Kapitel 11 Pyro-Imperium (seit 24.09., der Reihe nach)
   - alte Spielstaende behalten ihr Lager
   - Ausbau-Liste mit Kapitel-Ueberschriften
   - Kassierer 2 bis 5 besetzen die SB-Kassen, dort zahlen dann
     auch volle Koerbe */
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

  const k=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    o.start={nr:bb.kapitelNr(),name:bb.kapitel().name,lager:bb.zoneOffen('lager'),hud:document.getElementById('hKap').textContent};
    /* ins Lager laufen: das Band haelt auf */
    let cur={x:-7.4,z:-2.5}; for(let i=0;i<40;i++){ const r=bb.schiebe(cur.x-0.06,cur.z); cur=r; }
    o.lagerGesperrtBis=+cur.x.toFixed(2);
    o.rackOffen=bb.regalOffen('rack');
    /* Ware bestellen: kommt vor die Tuer */
    S.money=5000; bb.cartAdd('boeller',2,'mertens'); bb.cartOrder();
    bb.orderRegal('klein');
    const regaleVor=bb.shelves.length;
    for(let i=0;i<80&&bb.pending.length;i++) bb.run(1,0.1);
    o.lkw=!!bb.truck;
    o.kartons=bb.floorBoxes.map(f=>[+f.mesh.position.x.toFixed(2),+f.mesh.position.z.toFixed(2)]);
    o.vorDerTuer=bb.floorBoxes.length>0&&bb.floorBoxes.every(f=>f.mesh.position.z>6.5&&Math.abs(f.mesh.position.x-bb.WA.x)<1.3);
    o.regalAufgebaut=bb.shelves.length-regaleVor;
    /* Lager kaufen */
    S.level=6; S.money=9000; bb.testKauf('lager');
    o.nach={nr:bb.kapitelNr(),name:bb.kapitel().name,lager:bb.zoneOffen('lager')};
    cur={x:-7.4,z:-2.5}; for(let i=0;i<60;i++){ const r=bb.schiebe(cur.x-0.06,cur.z); cur=r; }
    o.lagerFreiBis=+cur.x.toFixed(2);
    o.rackOffenNach=bb.regalOffen('rack');
    bb.cartAdd('boeller',1,'mertens'); bb.cartOrder();
    let lkw=false; for(let i=0;i<80;i++){ bb.run(1,0.1); if(bb.truck) lkw=true; if(lkw) break; }
    o.lkwNach=lkw;
    /* Kapitel 3 und 4 */
    S.level=99; S.money=9e7; bb.UPGRADES.filter(u=>u.kat==='flaeche').forEach(u=>{ try{ bb.testKauf(u.id); }catch(e){} });
    o.ende={nr:bb.kapitelNr(),name:bb.kapitel().name}; o.finale=bb.KAPITEL[bb.KAPITEL.length-1].name;
    /* der Reihe nach: Labor vor dem Onlineshop hebt das Kapitel nicht */
    const alt=Object.assign({},S.up);
    Object.keys(S.up).forEach(k=>{ S.up[k]=false; }); S.up.lager=true; S.up.shop_gross=true; S.up.labor=true;
    o.vorgezogen=bb.kapitelNr(); S.up.onlineshop=true; o.nachgeholt=bb.kapitelNr();
    Object.assign(S.up,alt);
    /* Demo: das Logistikzentrum laesst sich nicht kaufen */
    S.up.lager_west=false; bb.DEMO=true; bb.buyUp('lager_west'); o.demoGesperrt=!S.up.lager_west; o.demoToast=bb.toastLast;
    bb.DEMO=false; bb.buyUp('lager_west'); o.vollOffen=!!S.up.lager_west;
    return o;
  });
  console.log('START   ',JSON.stringify(k.start),'gesperrt bis x',k.lagerGesperrtBis,'Rack',k.rackOffen);
  console.log('KIOSK   ',JSON.stringify({lkw:k.lkw,vor:k.vorDerTuer,kartons:k.kartons,regal:k.regalAufgebaut}));
  console.log('LAGER   ',JSON.stringify(k.nach),'frei bis x',k.lagerFreiBis,'Rack',k.rackOffenNach,'LKW',k.lkwNach);
  console.log('ENDE    ',JSON.stringify(k.ende));
  pruef('START',k.start.nr===1&&k.start.name==='Pyro-Kiosk'&&!k.start.lager&&/Kiosk/.test(k.start.hud),'Start: '+JSON.stringify(k.start));
  pruef('START',k.lagerGesperrtBis>-8.4,'man kommt ins gesperrte Lager (x='+k.lagerGesperrtBis+')');
  pruef('START',!k.rackOffen,'Lagerregal vor dem Lager bestellbar');
  pruef('KIOSK',!k.lkw&&k.vorDerTuer&&k.kartons.length===2,'Lieferung nicht vor der Tuer: '+JSON.stringify(k.kartons)+' LKW '+k.lkw);
  pruef('KIOSK',k.regalAufgebaut===1,'Regal nicht aufgebaut');
  pruef('LAGER',k.nach.nr===2&&k.nach.name==='Kleines Fachgeschäft'&&k.nach.lager,'Kapitel 2: '+JSON.stringify(k.nach));
  pruef('LAGER',k.lagerFreiBis<-9,'Lagertuer nach dem Kauf zu (x='+k.lagerFreiBis+')');
  pruef('LAGER',k.rackOffenNach&&k.lkwNach,'nach dem Kauf kein LKW an der Rampe / kein Lagerregal');
  console.log('REIHE   ',JSON.stringify({vorgezogen:k.vorgezogen,nachgeholt:k.nachgeholt}));
  pruef('ENDE',k.ende.nr===7&&k.ende.name==='Pyro-Logistik'&&k.finale==='Pyro-Imperium','Ende: '+JSON.stringify(k.ende)+' Finale '+k.finale);
  pruef('REIHE',k.vorgezogen===3&&k.nachgeholt===5,'Kapitel nicht der Reihe nach: Labor vor Onlineshop gibt '+k.vorgezogen+', danach '+k.nachgeholt);

  /* Laptop: Ausbau mit Kapitelueberschriften */
  const lap=await p.evaluate(()=>{ const bb=window.__bb; bb.openLaptop(); const t=document.querySelector('[data-tab="up"]'); if(t) t.click();
    /* je Kapitel: Ueberschrift und wie viele Ausbauten darunter stehen */
    const k=[]; for(const e of document.querySelectorAll('#lbody .kapkopf, #lbody .row')){ if(e.classList.contains('kapkopf')) k.push([e.querySelector('b').textContent,0,e.classList.contains('voll')]); else if(k.length) k[k.length-1][1]++; }
    bb.closeLaptop(false); return k; });
  console.log('LAPTOP  ',JSON.stringify(lap));
  pruef('LAPTOP',lap.length===11&&lap.every((x,i)=>x[0].indexOf('Kapitel '+(i+1))===0),'Kapitelueberschriften: '+JSON.stringify(lap));
  /* Kapitel 7 traegt die drei Hallenstufen und vier Tore (Tom, 24.09.) */
  pruef('LAPTOP',lap.slice(0,7).every((x,i)=>x[1]>=2&&x[1]<=(i===6?8:6)),'Kapitel ungleich verteilt: '+lap.map(x=>x[1]).join('/'));
  /* Demo 1-6, Vollversion ab 7; 8-11 sind Vorschau */
  pruef('VOLL',lap.every((x,i)=>x[2]===(i>=6)&&(i<6||/Vollversion/.test(x[0]))),'Vollversion falsch markiert: '+JSON.stringify(lap.map(x=>x[2])));
  pruef('VOLL',lap.slice(7).every(x=>x[1]===1),'Vorschau der geplanten Kapitel fehlt');
  console.log('DEMO    ',JSON.stringify({gesperrt:k.demoGesperrt,toast:k.demoToast,voll:k.vollOffen}));
  pruef('DEMO',k.demoGesperrt&&/Vollversion/.test(k.demoToast||'')&&k.vollOffen,'Demo-Sperre: '+JSON.stringify({g:k.demoGesperrt,t:k.demoToast,v:k.vollOffen}));

  /* Alter Spielstand ohne Lager-Schluessel behaelt sein Lager */
  const alt=await p.evaluate(()=>{ const bb=window.__bb; bb.save();
    const d=JSON.parse(localStorage.getItem('boellerbude3')||localStorage.getItem(Object.keys(localStorage).find(k=>{ try{ return JSON.parse(localStorage.getItem(k)).v===3; }catch(e){ return false; } })));
    return !!d; });
  /* Erst neu laden (dabei speichert das Spiel noch einmal), dann auf
     dem Startbildschirm den Stand zurueckdrehen - vor der Kapitel-
     Umstellung gab es den Schluessel 'lager' nicht */
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  const migr=await p.evaluate(()=>{ const key=Object.keys(localStorage).find(k=>{ try{ return JSON.parse(localStorage.getItem(k)).v===3; }catch(e){ return false; } });
    const d=JSON.parse(localStorage.getItem(key)); d.level=3; d.up={shop_halb:true}; localStorage.setItem(key,JSON.stringify(d)); return key; });
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const nachLaden=await p.evaluate(()=>({lager:window.__bb.zoneOffen('lager'),nr:window.__bb.kapitelNr()}));
  console.log('ALTSTAND',JSON.stringify({gespeichert:alt,key:migr,nachLaden}));
  pruef('ALTSTAND',nachLaden.lager===true&&nachLaden.nr===2,'alter Spielstand verliert sein Lager: '+JSON.stringify(nachLaden));

  /* Kassierer an den SB-Kassen */
  const ka=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.level=99; S.money=9e6; bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id));
    ['shop_halb','shop_gross','kasse2'].forEach(id=>bb.testKauf(id));
    o.lanes=bb.sbLanes.length;
    for(let i=0;i<4;i++) bb.regalStellen('standard');
    bb.allLevels().forEach(l=>{ for(let k=0;k<8;k++) bb.addToLevel(l,'boeller',1); });
    ['kassierer','kassierer2','kassierer3'].forEach(id=>{ S.staff[id]=true; bb.hireStaff(id); });
    const bahn=['kassierer2','kassierer3'].map(id=>bb.sbLaneVon(id));
    o.bahnen=bahn;
    o.besetzt=bahn.map(i=>!!bb.sbBesetzt(i));
    o.plaetze=bahn.map((i,k)=>{ const w=bb.staff['kassierer'+(k+2)]; const P=bb.sbKassiererPlatz(i); return +Math.hypot(w.pos.x-P.p.x,w.pos.z-P.p.z).toFixed(2); });
    /* die besetzten Bahnen gehoeren zu den SB-Kassen der Erweiterung */
    o.richtigeBahn=bahn.every(i=>i>=0&&!bb.sbLanes[i].up);
    bb.openShop();
    /* Ein Kunde mit sechs Artikeln stellt sich an: geht er an eine
       besetzte Kasse, und geht es dort schneller? */
    let c=null; for(let t=0;t<200&&!c;t++){ bb.run(0.5,0.05); c=bb.customers.find(x=>x.state!=='leave'&&x.state!=='enter'); }
    if(!c){ o.fehler='kein Kunde'; return o; }
    const korb=()=>Array.from({length:6},()=>({type:'boeller',price:4.49}));
    /* an der Hauptkasse bedient niemand: der Kunde nimmt die besetzte SB-Kasse */
    bb.fireStaff('kassierer'); S.staff.kassierer=false;
    c.items=korb(); c.state='shop'; c.joinQueue();
    o.vollerKorb={state:c.state,bahn:c.sb,besetzt:bahn.indexOf(c.sb)>=0};
    if(c.sb!==null&&c.sb!==undefined){ c.sbStart(); o.dauerBesetzt=+c.sbT.toFixed(2); c.sbFree(); }
    /* ohne Kassierer: sechs Artikel duerfen nicht an die SB-Kasse */
    ['kassierer2','kassierer3'].forEach(id=>{ bb.fireStaff(id); S.staff[id]=false; });
    c.sb=null; c.items=korb(); c.state='shop'; c.joinQueue();
    o.ohneKassierer=c.state;
    return o;
  });
  console.log('KASSEN  ',JSON.stringify(ka));
  pruef('KASSEN',ka.lanes>=2&&ka.richtigeBahn&&ka.besetzt.every(x=>x)&&ka.plaetze.every(d=>d<0.5),'Kassierer nicht an den SB-Kassen: '+JSON.stringify(ka));
  pruef('KASSEN',ka.vollerKorb&&ka.vollerKorb.state==='sbGo'&&ka.vollerKorb.besetzt,'voller Korb geht nicht an die besetzte Kasse: '+JSON.stringify(ka));
  pruef('KASSEN',ka.dauerBesetzt<1.1+6*1.25*0.6,'besetzte Kasse nicht schneller: '+ka.dauerBesetzt+' s');
  pruef('KASSEN',ka.ohneKassierer==='queue','ohne Kassierer geht der volle Korb an die SB-Kasse: '+ka.ohneKassierer);

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

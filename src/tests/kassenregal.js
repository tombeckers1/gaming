/* Kassenregal (05.10., Tom: "Sturmfeuerzeug im Regal macht keinen Sinn.
   Sowas an der Kasse platzieren - ein extra Regal fuer die Kasse"):
   ab Level 3 bestellbar, steht am Kassengang neben dem Band, nimmt nur
   Kleinkram; Sturmfeuerzeuge, Streichhoelzer und Gehoerschutz nur dort
   (richtige Meldung im normalen Regal), Einraeumer fuellen es zuerst,
   Kunden in der Schlange kaufen spontan daraus.
   Dazu die abgeschafften SB-Kassen am zweiten Eingang: ein alter
   Spielstand mit ihnen (und ihren zwei Betreuern) laedt fehlerfrei, das
   Geld kommt zurueck, nichts davon bleibt im Stand.
   Laeuft mit test.html (three-Stub). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:30000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1100,height:700}}); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=__bb, S=bb.S, P=bb.P, o={};
    S.level=2; o.lvl2=bb.regalOffen('kasse'); S.level=3; o.lvl3=bb.regalOffen('kasse')&&bb.regalPlatz('kasse');
    S.level=20; S.money=1e6;
    bb.regalStellen('standard'); bb.regalStellen('kasse');
    const ks=bb.shelves.find(sh=>sh.kind==='kasse'), st=bb.shelves.find(sh=>sh.kind==='standard');
    o.steht=!!ks; if(!ks) return o;
    o.zweites=bb.regalPlatz('kasse');
    /* am Kassengang: Haltepunkt nahe den Warteplaetzen, Front zum Band */
    const h=bb.shelfStand(ks), spots=[1,2,3].map(i=>bb.spotPos(i));
    o.zurSchlange=+Math.min(...spots.map(q=>Math.hypot(q.x-h.x,q.z-h.z))).toFixed(2);
    o.zumBand=+Math.hypot(ks.g.position.x-bb.ckG.position.x,ks.g.position.z-bb.ckG.position.z).toFixed(2);
    o.nimmt={feuerzeugRegal:bb.shelfAccepts(st,'feuerzeug'),feuerzeugKasse:bb.shelfAccepts(ks,'feuerzeug'),gehoerschutzKasse:bb.shelfAccepts(ks,'gehoerschutz'),
      streichhoelzerRegal:bb.shelfAccepts(st,'streichhoelzer'),knicklichterRegal:bb.shelfAccepts(st,'knicklichter'),knicklichterKasse:bb.shelfAccepts(ks,'knicklichter'),
      sektKasse:bb.shelfAccepts(ks,'sekt'),boellerKasse:bb.shelfAccepts(ks,'boeller')};
    /* alle 'nur'-Sorten passen in ein Fach des Kassenregals */
    o.nurPasst=Object.keys(P).filter(t=>P[t].kasse==='nur').map(t=>t+':'+ks.levels.some(l=>bb.capOf(l,t)>0));
    /* Meldung im normalen Regal */
    S.carrying={type:'feuerzeug',count:24,q:1}; bb.stockOne(st.levels[0]); o.meldung=bb.toastLast; o.imRegal=st.levels[0].count;
    o.prompt=null; try{ const alt=bb.target; o.prompt=bb.promptFor?JSON.stringify(bb.promptFor({kind:'level',ref:st.levels[0]})):null; }catch(e){ o.prompt='x '+e.message; }
    /* Einraeumer-Ziel: zuerst das Kassenregal */
    const el=bb.emptyLevel('feuerzeug'), ek=bb.emptyLevel('knicklichter');
    o.ziel={feuerzeug:el&&el.sh.kind,knicklichter:ek&&ek.sh.kind};
    S.carrying=null;
    /* Spontankauf: Kassenregal fuellen, Laden auf, Kunden anstehen lassen */
    S.lic=bb.LIZENZEN.map(l=>l.id);
    o.fuell=ks.levels.map((l,i)=>{ const t=['feuerzeug','streichhoelzer','gehoerschutz','knicklichter','schokotaler'][i]; let k=0; for(;k<200&&bb.addToLevel(l,t,1);k++); return t+':'+k+':'+bb.capOf(l,t)+':'+bb.isUnlocked(t); });
    o.vorher=ks.levels.reduce((a,l)=>a+l.count,0);
    for(const l of st.levels) for(let k=0;k<60&&bb.addToLevel(l,'wunder',1);k++);
    if(bb.phase==='closed') bb.openShop();
    bb.hireStaff('kassierer'); S.staff.kassierer=true;
    for(let i=0;i<40;i++) bb.run(5,0.1);
    o.spontan=bb.DS.spontan||0; o.nachher=ks.levels.reduce((a,l)=>a+l.count,0); o.kunden=bb.DS.customers;
    return o; });
  console.log('KASSENREGAL',JSON.stringify(r));
  pruef('LEVEL',r.lvl2===false&&r.lvl3===true,'ab Level 3 bestellbar: '+JSON.stringify([r.lvl2,r.lvl3]));
  pruef('STEHT',r.steht&&r.zweites===false,'Kassenregal: '+JSON.stringify(r));
  pruef('AM_KASSENGANG',r.zurSchlange<1.6&&r.zumBand<3,'Platz: zur Schlange '+r.zurSchlange+' m, zur Kasse '+r.zumBand+' m');
  const n=r.nimmt||{};
  pruef('NIMMT',!n.feuerzeugRegal&&n.feuerzeugKasse&&n.gehoerschutzKasse&&!n.streichhoelzerRegal&&n.knicklichterRegal&&n.knicklichterKasse&&!n.sektKasse&&!n.boellerKasse,JSON.stringify(n));
  pruef('NUR_PASST',(r.nurPasst||[]).length>=3&&r.nurPasst.every(x=>/:true$/.test(x)),JSON.stringify(r.nurPasst));
  pruef('MELDUNG',/Kassenregal/.test(r.meldung||'')&&r.imRegal===0,'Meldung "'+r.meldung+'", im Regal '+r.imRegal);
  pruef('ANZEIGE',/Kassenregal/.test(r.prompt||''),'Hinweis am Fach: '+r.prompt);
  pruef('EINRAEUMER',r.ziel&&r.ziel.feuerzeug==='kasse'&&r.ziel.knicklichter==='kasse','Ziel: '+JSON.stringify(r.ziel));
  pruef('SPONTANKAUF',r.spontan>=1&&r.nachher<r.vorher,'Spontankaeufe '+r.spontan+' bei '+r.kunden+' Kunden, Ware '+r.vorher+' -> '+r.nachher);
  /* alter Spielstand mit SB-Kassen am zweiten Eingang */
  const vor=await p.evaluate(()=>{ const bb=__bb, S=bb.S; S.money=1000; bb.save();
    const KEY=Object.keys(localStorage).find(k=>/boellerbude/.test(k)); const d=JSON.parse(localStorage.getItem(KEY));
    delete d.sb2weg; d.money=1000; d.up.eingang2=true; d.up.shop_ost=true; d.up.kasse3=true; d.staff=Object.assign(d.staff||{},{kassierer4:true,kassierer5:true});
    d.wage=Object.assign(d.wage||{},{kassierer4:1.3}); d.sb2={x:29,z:3.5,ry:0};
    /* dazu ein Schwerlastregal von vor dem 05.10. auf dem Platz neben der
       Lagertuer - es ragte einen halben Meter in die Wand */
    d.up.lager=true; d.racks=(d.racks||[]).concat([{kind:'schwer',x:-9.3,z:1.35,ry:Math.PI,slots:[]}]);
    localStorage.setItem(KEY,JSON.stringify(d));
    const alt=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k===KEY) return; return alt.call(this,k,v); };
    return KEY; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:first-child'); await p.waitForTimeout(1500);
  const nach=await p.evaluate(()=>{ const bb=__bb, S=bb.S; bb.run(4,0.1);
    return {geld:S.money,k3:'kasse3' in S.up,staff:Object.keys(S.staff).filter(k=>/kassierer[45]/.test(k)),wage:'kassierer4' in (S.wage||{}),
      spuren:bb.sbLanes.length,offen:bb.sbOffen(),upg:bb.UPGRADES.some(u=>u.id==='kasse3'),toast:bb.toastLast,eingang2:!!S.up.eingang2,
      regal:bb.racks.filter(r=>r.kind==='schwer').map(r=>{ const K=bb.rackKindOf(r), a=bb.rackRect(K,r.g.position.x,r.g.position.z,r.g.rotation.y);
        return {x:+r.g.position.x.toFixed(2),z:+r.g.position.z.toFixed(2),wand:bb.wandRechtecke().some(w=>Math.min(a.x1,w.x1)-Math.max(a.x0,w.x0)>0.005&&Math.min(a.z1,w.z1)-Math.max(a.z0,w.z0)>0.005)}; })}; });
  console.log('ALTSTAND',JSON.stringify(nach));
  pruef('ERSTATTET',Math.abs(nach.geld-(1000+3800+1300))<0.01,'Geld '+nach.geld+' (soll 6100: 1000 + 3800 Kassen + 2x650 Betreuer)');
  pruef('AUFGERAEUMT',!nach.k3&&!nach.staff.length&&!nach.wage&&!nach.upg&&nach.offen===0&&nach.eingang2,'Stand: '+JSON.stringify(nach));
  /* zweites Laden: kein Geld mehr (der Stand traegt jetzt sb2weg) */
  await p.evaluate(()=>__bb.save());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:first-child'); await p.waitForTimeout(1500);
  const zwei=await p.evaluate(()=>__bb.S.money);
  console.log('ZWEITES_LADEN',zwei);
  pruef('EINMAL',Math.abs(zwei-nach.geld)<1,'beim zweiten Laden wieder erstattet: '+nach.geld+' -> '+zwei);
  pruef('ALTES_REGAL',nach.regal.length===1&&!nach.regal[0].wand,'Schwerlastregal aus altem Stand: '+JSON.stringify(nach.regal));
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK'); await b.close();
})();

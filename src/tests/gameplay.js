/* Gameplay-Vorfuehrung (Tom, 03.10.): fast durchgespielter Laden, alles
   gebaut, Personal, Regale voll, laeuft von selbst Tag fuer Tag;
   eigener Spielstand bleibt unangetastet und kommt danach zurueck. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:30000});
}
const HANDY=process.env.HANDY==='1';
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  /* HANDY=1: Handy-Profil (kleinerer Aufbau, Zusammenfassen, Blickfeldregel) */
  const p=process.env.HANDY==='1'?await (await b.newContext({isMobile:true,hasTouch:true,viewport:{width:390,height:844}})).newPage():await b.newPage({viewport:{width:1100,height:700}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=__bb, S=bb.S, o={};
    S.money=1234.56; bb.renderLaptop&&0; bb.tuAktion; 

    o.knopf=(()=>{ bb.ltab='shop'; bb.renderLaptop&&bb.renderLaptop(); return !!document.querySelector('[data-a="gameplay"]'); })();
    /* 03.10.: der Aufbau laeuft schrittweise (Generator); hier am Stueck fertig bauen */
    bb.gpStart(); o.sofort=bb.gpFertig; o.bauSchritte=0; while(!bb.gpFertig&&o.bauSchritte<5000){ bb.gpBauSchritt(50); o.bauSchritte++; } o.vorher=localStorage.getItem('bb_gp_sicherung'); o.vorherLvl=o.vorher?JSON.parse(o.vorher).level:null;
    o.an=bb.gpAn; o.lvl=S.level; o.offen=bb.UPGRADES.filter(u=>!u.done()&&u.kat==='flaeche').map(u=>u.id); o.lic=S.lic.length===bb.LIZENZEN.length;
    o.ups=bb.UPGRADES.filter(u=>u.kat==='flaeche').map(u=>u.done()?1:0).reduce((a,b)=>a+b,0)+'/'+bb.UPGRADES.filter(u=>u.kat==='flaeche').length;
    o.staff=Object.keys(S.staff).filter(k=>S.staff[k]).length+'/'+bb.STAFF?.length;
    const L=bb.allLevels(); o.regale=bb.shelves.length; o.faecher=L.length; o.voll=L.filter(l=>l.type&&l.count>0).length;
    o.sorten=new Set(L.filter(l=>l.type).map(l=>l.type)).size;
    o.lagerKartons=bb.racks.reduce((a,r)=>a+r.slots.filter(s=>s.box).length,0);
    o.phase=bb.phase; o.panel=!!document.getElementById('gameplayVf');
    /* 05.10.: Versand in der hoechsten Stufe, Packmaterial-Regale voll */
    o.pack=bb.packStufe(); o.packer=['packer','packer2','packer3'].filter(id=>bb.staff[id]).length;
    o.vmVoll=[0,1,2].every(i=>bb.VM_IDS.every(id=>S.vm[i][id]>=bb.VM[id].kap));
    return o; });
  console.log('START',JSON.stringify(Object.assign({},r,{vorher:undefined})));
  pruef('KNOPF',r.knopf,'kein Knopf im Laptop > Laden');
  pruef('SCHRITTWEISE',!r.sofort&&r.bauSchritte>(HANDY?10:20),'Aufbau nicht schrittweise (haengt den Browser): '+JSON.stringify({sofort:r.sofort,schritte:r.bauSchritte}));
  pruef('VERSAND',r.pack===3&&r.packer===3&&r.vmVoll,'Versand nicht in der hoechsten Stufe: '+JSON.stringify({stufe:r.pack,packer:r.packer,vm:r.vmVoll}));
  pruef('AUFBAU',r.an&&r.lvl>=26&&!r.offen.length&&r.lic&&r.regale>=(HANDY?15:25)&&r.voll>=r.faecher*0.9&&r.sorten>=(HANDY?35:150)&&r.lagerKartons>=30&&r.panel,'Aufbau unvollstaendig: '+JSON.stringify(r));
  /* drei Spieltage laufen lassen */
  const tage=await p.evaluate(()=>{ const bb=__bb, S=bb.S, out=[]; const d0=S.day; let n=0;
    while(S.day<d0+3&&n++<4000){ bb.run(3,0.1); if(n%30===0) out.push({tag:S.day,geld:Math.round(S.money),kunden:bb.DS?bb.DS.customers:null,phase:bb.phase}); }
    return {ddl:{rufe:S.stat.ddlRuf||0,abgeholt:S.stat.ddl||0,log:(S.onlineLog||[]).length},vm:{verbraucht:S.stat.vmVerbraucht||0,eingelagert:S.stat.vmEingelagert||0,pakete:S.stat.pakete||0},out:out.slice(-12),verlauf:bb.gpVerlauf.map(v=>({t:v.tag,g:Math.round(v.geld)})),tag:S.day,d0,schritte:n,gespeichert:localStorage.getItem('boellerbude_v3')}; });
  console.log('TAGE',JSON.stringify(Object.assign({},tage,{gespeichert:undefined})).slice(0,1500));
  pruef('PACKMATERIAL',tage.vm.verbraucht>20&&tage.vm.eingelagert>0,'Packmaterial wird nicht verbraucht oder nachgefuellt: '+JSON.stringify(tage.vm));
  /* 09.10.: DDL nur auf Anruf - der Versand-Disponent der Vorfuehrung ruft am Wandtelefon an */
  pruef('DDL_ANRUF',tage.ddl.rufe>=1&&tage.ddl.abgeholt>0&&tage.ddl.log>=2,'in der Vorfuehrung wird DDL nicht gerufen oder nichts abgeholt: '+JSON.stringify(tage.ddl));
  pruef('LAEUFT',tage.tag>=tage.d0+3,'Tage laufen nicht weiter: '+tage.tag+' (Start '+tage.d0+')');
  pruef('KEIN_SPEICHERN',tage.gespeichert===r.vorher&&!!r.vorher,'die Vorfuehrung hat den Spielstand ueberschrieben');
  /* Beenden: alter Stand zurueck */
  await Promise.all([p.waitForNavigation({timeout:120000}).catch(()=>null),p.evaluate(()=>__bb.gpEnde())]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  const zur=await p.evaluate(()=>({key:localStorage.getItem('boellerbude_v3'),sich:localStorage.getItem('bb_gp_sicherung')}));
  pruef('ZURUECK',zur.key===r.vorher&&!zur.sich,'Spielstand nicht zurueck: '+JSON.stringify({gleich:zur.key===r.vorher,lvl:zur.key&&JSON.parse(zur.key).level,sich:!!zur.sich,laenge:[zur.key&&zur.key.length,r.vorher&&r.vorher.length]}));
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK'); await b.close();
})();

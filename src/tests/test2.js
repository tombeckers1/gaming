/* Startmaske: Neues Spiel -> Namensmaske -> aufschliessen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message+'\n'+(e.stack||'').split('\n')[1]));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  await p.waitForTimeout(300);
  const out=await p.evaluate(()=>{
    const bb=window.__bb,S=bb.S,o={};
    S.money=200000; S.level=20;
    // alles freischalten
    ['REGAL:klein','REGAL:standard','REGAL:standard','REGAL:hoch','REGAL:kuehl','REGAL:standard','REGAL:hoch','REGAL:standard','REGAL:rack','REGAL:rack','REGAL:rack','plakat','terminal','tag4','heizung','musik','radio','cams','regallicht','alarm'].forEach(id=>bb.testKauf(id));
    ['pflanze','muell','teppich','lichter','ventilator','baum','neon','automat'].forEach(id=>bb.buyDeko(id));
    ['reinigung','auffueller','kassierer','security'].forEach(id=>{ S.staff[id]=true; bb.hireStaff(id); });
    o.shelves=bb.shelves.length; o.racks=bb.racks.length;
    // jedes Produkt in ein Fach raeumen
    const types=Object.keys(S.prices), lvs=bb.allLevels();
    types.forEach((t,i)=>{ const lv=lvs[i]; if(!lv) return; for(let k=0;k<60;k++) if(!bb.addToLevel(lv,t)) break; });
    o.filled=lvs.filter(l=>l.count>0).length;
    o.caps=types.map(t=>({t,cap:lvs.find(l=>l.type===t)?lvs.find(l=>l.type===t).count:0,box:bb.S.prices[t]?undefined:0}));
    bb.openShop(); bb.run(300,0.05);
    o.revenue=Math.round(bb.DS.revenue); o.customers=bb.DS.customers; o.sold=bb.DS.sold; o.stolen=bb.DS.stolen; o.caught=bb.DS.caught; o.angry=bb.DS.angry;
    o.dirt=bb.dirts.length;
    return o;
  });
  console.log('TAG:',JSON.stringify(out));
  const out2=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.clock=1330; bb.run(140,0.05);
    o.phase=bb.phase;
    bb.endDay();
    o.summaryShown=document.getElementById('summary').classList.contains('show');
    document.getElementById('sBtn').click();
    o.phaseAfter=bb.phase; o.day=bb.S.day; o.level=bb.S.level; o.xp=bb.S.xp;
    bb.save();
    o.saveLen=(localStorage.getItem('boellerbude_v3')||'').length;
    return o;
  });
  console.log('ENDE:',JSON.stringify(out2));
  // Reload -> Spielstand laden
  await p.reload();
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.click('#startBtns button');
  await p.waitForTimeout(300);
  const out3=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.level=bb.S.level; o.money=Math.round(bb.S.money); o.shelves=bb.shelves.length; o.racks=bb.racks.length; o.dekos=bb.dekos.length;
    o.filled=bb.allLevels().filter(l=>l.count>0).length; o.staff=Object.keys(bb.staff).filter(k=>bb.staff[k]).length;
    o.wall=bb.S.wall; o.floor=bb.S.floor; o.day=bb.S.day;
    // Kredit
    bb.S.money=100; const t=bb.S; 
    return o;
  });
  console.log('LADEN:',JSON.stringify(out3));
  const out4=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    // Umbaumodus: Regal greifen + absetzen
    bb.toggleBuild(true);
    const m=bb.movables.find(m=>m.kind==='shelf');
    const before={x:m.g.position.x,z:m.g.position.z};
    bb.pl.x=0; bb.pl.z=0;
    window.__bbGrab=m;
    o.ok=true;
    bb.toggleBuild(false);
    return o;
  });
  console.log('UMBAU:',JSON.stringify(out4));
  await p.screenshot({path:process.argv[3]});
  console.log('ERRORS:',errs.length?errs.join('\n---\n'):'keine');
  await b.close();
})();

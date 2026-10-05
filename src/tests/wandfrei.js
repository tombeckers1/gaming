/* Nichts in der Wand (05.10., Tom, Gameplay-Vorfuehrung: "die Mitarbeiter,
   die Regale einraeumen oder Pakete packen, verschwinden halb in der Wand.
   Das Lagerregal war auch halb in der Wand drin - beim Eingang zum
   Verkaufsladen"). Nach dem Gameplay-Aufbau steht kein Moebel mit seinem
   Grundriss in einer Wand (Regale, Tische, Gitterboxen, Lagerregale,
   Kasse, Buero ...), und waehrend einiger Spielstunden steht keine Person
   (Personal, Kunden) mit ihrem Koerper in einer Wand.
   Laeuft mit test.html (three-Stub) oder real.html. */
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
  const p=await b.newPage({viewport:{width:1100,height:700}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  /* Koerperradius: halbe Schulterbreite einer Figur */
  const KR=0.18;
  const r=await p.evaluate(()=>{ const bb=__bb; bb.gpStart(); let n=0; while(!bb.gpFertig&&n++<20000) bb.gpBauSchritt(50);
    const W=bb.wandRechtecke(), o={waende:W.length,moebel:0,lager:bb.racks.length,regale:bb.shelves.length,drin:[]};
    const tief=(a,w)=>Math.min(Math.min(a.x1,w.x1)-Math.max(a.x0,w.x0),Math.min(a.z1,w.z1)-Math.max(a.z0,w.z0));
    const pruefe=(name,a)=>{ o.moebel++; for(const w of W){ const t=tief(a,w); if(t>0.005) o.drin.push(name+' @'+[a.x0,a.x1,a.z0,a.z1].map(v=>v.toFixed(2))+' in Wand '+[w.x0,w.x1,w.z0,w.z1].map(v=>v.toFixed(2))+' um '+t.toFixed(2)+' m'); } };
    for(const sh of bb.shelves){ const g=sh.g; pruefe(bb.kindOf(sh).name,bb.moebelRect(bb.kindOf(sh),g.position.x,g.position.z,g.rotation.y)); }
    for(const rk of bb.racks){ const g=rk.g; pruefe(bb.rackKindOf(rk).name,bb.rackRect(bb.rackKindOf(rk),g.position.x,g.position.z,g.rotation.y)); }
    /* alle anderen Moebel: ihr Kollisionsrechteck, ohne die 3 cm Luft rundum */
    for(const m of bb.movables){ if(m.kind==='shelf'||m.kind==='rack'||m.g.visible===false) continue;
      for(const c of (m.cols||(m.col?[m.col]:[]))) pruefe(m.name||m.kind,{x0:c.minX+0.03,x1:c.maxX-0.03,z0:c.minZ+0.03,z1:c.maxZ-0.03}); }
    return o; });
  console.log('MOEBEL',JSON.stringify(Object.assign({},r,{drin:r.drin.length})));
  pruef('AUFBAU',r.waende>30&&r.lager>=10&&r.regale>=25&&r.moebel>=r.lager+r.regale,'Aufbau zu klein: '+JSON.stringify(r));
  pruef('MOEBEL_IN_WAND',!r.drin.length,r.drin.length+' Moebel in der Wand: '+r.drin.slice(0,8).join(' | '));
  /* Spielzeit laufen lassen, alle halbe Sekunde jede Person pruefen */
  const lauf=await p.evaluate((KR)=>{ const bb=__bb, W=bb.wandRechtecke(), funde=new Map(); let proben=0, personen=new Set();
    const tief=(x,z,w)=>{ const dx=Math.max(w.x0-x,0,x-w.x1), dz=Math.max(w.z0-z,0,z-w.z1); return Math.hypot(dx,dz); };
    const probe=(wer,g,st)=>{ if(!g||g.visible===false||!g.parent) return; const x=g.position.x, z=g.position.z; proben++; personen.add(wer);
      for(const w of W){ if(tief(x,z,w)<KR){ const k=wer.replace(/#\d+$/,'')+(st?'/'+st:'')+' '+[w.x0,w.x1,w.z0,w.z1].map(v=>v.toFixed(1)).join(',');
        const f=funde.get(k)||{n:0,x:+x.toFixed(2),z:+z.toFixed(2),st:''}; f.n++; funde.set(k,f); } } };
    const kunden=new Map(); let kn=0;
    for(let i=0;i<360;i++){ bb.run(0.5,0.1);
      for(const id in bb.staff){ const s=bb.staff[id]; if(s&&s.g) probe(id,s.g,s.state||s.task||s.job&&s.job.kind||''); }
      for(const c of bb.customers){ if(!kunden.has(c)) kunden.set(c,++kn); probe('kunde#'+kunden.get(c),c.g,c.state); } }
    return {proben,personen:personen.size,kunden:kn,funde:[...funde].map(([k,f])=>k+' x'+f.n+' z.B. ('+f.x+','+f.z+')'),tag:bb.S.day}; },KR);
  console.log('PERSONEN',JSON.stringify(Object.assign({},lauf,{funde:lauf.funde.length})));
  pruef('LAUF',lauf.proben>1000&&lauf.kunden>=10,'zu wenig Betrieb: '+JSON.stringify(lauf));
  pruef('PERSON_IN_WAND',!lauf.funde.length,lauf.funde.length+' Stellen: '+lauf.funde.slice(0,10).join(' | '));
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK'); await b.close();
})();

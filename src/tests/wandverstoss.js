/* Figuren nicht in Waenden (Tom 17.10.: "Mitarbeiter laufen durch Waende, auch an der DDL-Station - stehen halb in der Wand").
   Messung: Gameplay-Vorfuehrung (alles ausgebaut, alles Personal, DDL kommt), ein Spieltag in kleinen Schritten.
   Jeder Schritt: Position jeder Figur (Personal, Kunden, DDL-Fahrer, LKW-Fahrer) gegen
   - WAENDE (sichtbare Wandrechtecke): Abstand Koerpermitte >= KR (Koerperradius)
   - alle Kollisionsrechtecke (colliders, ohne bewegliche Moebel der eigenen Arbeit): Mitte nie im Rechteck
   Ausgabe: Zahl der Verstoesse (Schritte) und die haeufigsten Stellen. Aufruf: node wandverstoss.js test.html|real.html [KR] */
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
  const p=await b.newPage({viewport:{width:1100,height:700}}); p.setDefaultTimeout(1800000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const KR=+(process.argv[3]||0.24);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  await p.evaluate(()=>{ const bb=__bb; bb.gpStart(); let n=0; while(!bb.gpFertig&&n++<20000) bb.gpBauSchritt(50); });
  await p.evaluate((KR)=>{ window.__wv={KR,proben:0,schritte:0,w:new Map(),c:new Map(),arten:new Set(),minW:{},ddl:0,verstoesse:0}; },KR);
  /* Pruefung im Browser: Abstand der Koerpermitte zu jedem Wandrechteck und Kollisionsrechteck.
     Verstoss = Abstand < KR - 1 cm (Koerperradius). Ausnahme: der DDL-Fahrer geht durch den Durchstieg der Stirnwand (Absicht, VT.cols[2]). */
  const sample=function(){ const bb=__bb, V=window.__wv, W=bb.wandRechtecke(), CO=bb.colliders; V.schritte++;
    const dist=(x,z,x0,x1,z0,z1)=>Math.hypot(Math.max(x0-x,0,x-x1),Math.max(z0-z,0,z-z1));
    const wer=[];
    for(const id in bb.staff){ const s=bb.staff[id]; if(s&&s.g) wer.push([id,s.g,(s.state||'')+(s.vsZiel?'*':'')]); }
    bb.customers.forEach(c=>wer.push(['kunde',c.g,c.state||'']));
    const td=bb.truckDriver; if(td) wer.push(['lkwFahrer',td,'']);
    if(bb.LD&&bb.LD.fig&&bb.LD.fig.visible) wer.push(['ddlFahrer',bb.LD.fig,bb.LD.ph]);
    const stirn=bb.VT&&bb.VT.cols?bb.VT.cols[2]:null, grenze=V.KR-0.01;
    for(const [id,g,st] of wer){ if(!g||g.visible===false||!g.parent) continue;
      const x=g.position.x, z=g.position.z; V.proben++; V.arten.add(id); if(id==='ddlFahrer') V.ddl++;
      let mw=9, bad=false;
      for(const w of W){ const dd=dist(x,z,w.x0,w.x1,w.z0,w.z1); if(dd<mw) mw=dd;
        if(dd<grenze){ bad=true; const k=id+' Wand '+[w.x0,w.x1,w.z0,w.z1].map(v=>v.toFixed(1)); const f=V.w.get(k)||{n:0,x:x,z:z,st,min:9}; f.n++; f.min=Math.min(f.min,dd); V.w.set(k,f); } }
      V.minW[id]=Math.min(V.minW[id]===undefined?9:V.minW[id],mw);
      for(const c of CO){ if(c===stirn&&id==='ddlFahrer') continue; const dd=dist(x,z,c.minX,c.maxX,c.minZ,c.maxZ);
        if(dd<grenze){ bad=true; const nm=c.ref?(c.ref.kind||'')+':'+(c.ref.name||''):'-'; const k=id+' Koll '+[c.minX,c.maxX,c.minZ,c.maxZ].map(v=>v.toFixed(1)).join(',')+' '+nm; const f=V.c.get(k)||{n:0,x:x,z:z,st,min:9}; f.n++; f.min=Math.min(f.min,dd); V.c.set(k,f); } }
      if(bad) V.verstoesse++; } };
  await p.addScriptTag({content:'window.__sample='+sample.toString()});
  /* Spieltag: Schritte von 0,1 s Spielzeit, in Stuecken von 15 s */
  const STUECKE=+(process.env.STUECKE||70);
  for(let n=0;n<STUECKE;n++){ await p.evaluate(()=>{ const bb=__bb; for(let i=0;i<150;i++){ bb.run(0.1,0.1); window.__sample(); } }); }
  const r=await p.evaluate(()=>{ const V=window.__wv; return {proben:V.proben,schritte:V.schritte,ddl:V.ddl,arten:[...V.arten],minW:V.minW,
    wand:[...V.w].map(([k,f])=>k+' x'+f.n+' min '+f.min.toFixed(2)+' ('+f.x.toFixed(1)+','+f.z.toFixed(1)+') '+f.st).sort(),
    koll:[...V.c].map(([k,f])=>k+' x'+f.n+' min '+f.min.toFixed(2)+' ('+f.x.toFixed(1)+','+f.z.toFixed(1)+') '+f.st).sort(), tag:__bb.S.day, verstoesse:V.verstoesse}; });
  console.log('MESSUNG',JSON.stringify({KR,verstoesseProben:r.verstoesse,proben:r.proben,schritte:r.schritte,ddlProben:r.ddl,arten:r.arten,tag:r.tag}));
  console.log('MINWAND',JSON.stringify(Object.fromEntries(Object.entries(r.minW).map(([k,v])=>[k,+v.toFixed(2)]))));
  console.log('WANDVERSTOESSE',r.wand.length,'Stellen'); r.wand.slice(0,40).forEach(s=>console.log('  W',s));
  console.log('KOLLVERSTOESSE',r.koll.length,'Stellen'); r.koll.slice(0,40).forEach(s=>console.log('  K',s));
  pruef('VERSTOESSE',r.verstoesse===0,r.verstoesse+' von '+r.proben+' Proben mit Koerpermitte naeher als KR an Wand/Rechteck');
  pruef('WAND',!r.wand.length,r.wand.length+' Stellen in der Wand');
  pruef('KOLL',!r.koll.length,r.koll.length+' Stellen im Kollisionsrechteck');
  pruef('MESSUNG',r.proben>3000&&r.ddl>100,'zu wenig Betrieb: '+r.proben+' Proben, DDL '+r.ddl);
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK'); await b.close();
})();

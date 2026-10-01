/* Sockelleisten: die dunkle Laden-Fussleiste darf nur vor Ladentapete
   liegen, nie vor der gelb-schwarzen Lagerwand (Tom, 01.10.: doppelter
   Streifen in der Lagerecke). Prueft jede Leiste gegen die Wand dahinter. */
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
  const r=await p.evaluate(()=>{ const bb=window.__bb, sm=bb.sockelM(), lw=bb.lagerWall, out={n:0,falsch:[]};
    const waende=[]; bb.scene.traverse(o=>{ if(o.isMesh&&Array.isArray(o.material)&&o.material.length===6&&o.geometry.parameters&&o.geometry.parameters.width!==undefined) waende.push(o); });
    bb.scene.traverse(o=>{ if(!o.isMesh||o.material!==sm) return; const g=o.geometry.parameters; if(!g||g.width===undefined) return;
      out.n++; const p=o.position, xd=g.width<g.depth; /* duenn in x -> Leiste laeuft in z */
      for(const w of waende){ const q=w.position, G=w.geometry.parameters;
        const dicke=xd?Math.abs(p.x-q.x):Math.abs(p.z-q.z), halb=(xd?G.width:G.depth)/2;
        if(dicke>halb+0.05||dicke<halb-0.01) continue;
        const lang=xd?[q.z-G.depth/2,q.z+G.depth/2]:[q.x-G.width/2,q.x+G.width/2], pl=xd?p.z:p.x;
        if(pl<lang[0]+0.05||pl>lang[1]-0.05) continue;
        if(q.y-G.height/2>0.05) continue;
        const s=xd?Math.sign(p.x-q.x):Math.sign(p.z-q.z), fi=xd?(s>0?0:1):(s>0?4:5);
        if(w.material[fi]===lw) out.falsch.push([+p.x.toFixed(2),+p.z.toFixed(2),o.visible]); } });
    return out; });
  console.log('Leisten',r.n,'vor Lagerwand',r.falsch.length,JSON.stringify(r.falsch.slice(0,10)));
  const m=[]; if(!r.n) m.push('keine Leisten gefunden'); if(r.falsch.length) m.push('SOCKEL: '+r.falsch.length+' Ladenleisten vor der Lagerwand');
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

/* Fugen an Stossstellen (Tom, Fotos 29.09.):
   1. Gleich hinter der Testfeldtuer sprang die Rueckwand bei x=8 um
      10 cm (Nordwand der Halle Sued stand mittig auf z=-5,9), dazu
      ragte ein Pfeiler 6 mm heraus - eine senkrechte Linie in der Wand.
   2. An der Fensterfront der Erweiterungen hatte der Bodenschatten an
      jeder Raumgrenze eine helle Luecke (Streifen quer zur Wand), und
      innen fehlte die Sockelleiste, waehrend sie im Basisladen lief. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={};
    S.level=40; S.money=1e8;
    /* Stand wie auf Toms Fotos: Erweiterungen bis Level 23 (ohne Halle Sued) */
    bb.UPGRADES.filter(u=>(u.kat==='flaeche'||u.kat==='einr')&&(u.lvl||0)<=23).sort((a,b)=>(a.lvl||0)-(b.lvl||0)).forEach(u=>{ try{ bb.testKauf(u.id); }catch(e){} });
    bb.run(0.3,0.05);
    const sichtbar=o2=>{ let q=o2; while(q){ if(q.visible===false) return false; q=q.parent; } return true; };
    /* 1. Rueckwand: keine sichtbare Wand darf zwischen x 6,1 und 10 in den Laden ragen */
    const vor=[];
    bb.scene.traverse(m=>{ const a=m.userData&&m.userData.aabb; if(!a||!m.isMesh||!sichtbar(m)) return;
      if(a.x1>6.2&&a.x0<10&&a.z0<-5.95&&a.z1>-5.95&&a.z1>-5.9+0.001) vor.push([a.x0,a.x1,a.z0,a.z1].map(v=>+v.toFixed(3))); });
    o.rueckwand=vor;
    /* 2. Bodenschatten an der Fensterfront: Abdeckung von x -7,9 bis 37,9 */
    const ao=[];
    bb.scene.traverse(m=>{ if(!m.isMesh||!sichtbar(m)||!m.geometry||!m.geometry.parameters) return;
      const g=m.geometry.parameters;
      if(m.geometry.type==='PlaneGeometry'&&Math.abs(g.height-0.4)<1e-6&&Math.abs(m.position.y-0.021)<1e-4&&Math.abs(m.position.z-5.7)<0.05)
        ao.push([m.position.x-g.width/2,m.position.x+g.width/2]); });
    ao.sort((a,b)=>a[0]-b[0]);
    const luecken=[]; let bis=-7.9;
    for(const [a,c] of ao){ if(a>bis+0.005) luecken.push([+bis.toFixed(3),+a.toFixed(3)]); bis=Math.max(bis,c); }
    if(bis<37.9-0.005) luecken.push([+bis.toFixed(3),37.9]);
    o.ao={n:ao.length,luecken};
    /* 3. Sockelleiste innen an der Fensterfront (auch in den Erweiterungen) */
    const so=[];
    bb.scene.traverse(m=>{ if(!m.isMesh||!sichtbar(m)||!m.geometry||!m.geometry.parameters) return;
      const g=m.geometry.parameters;
      if(m.geometry.type==='BoxGeometry'&&Math.abs(g.height-0.1)<1e-6&&Math.abs(g.depth-0.02)<1e-6&&Math.abs(m.position.z-5.89)<0.02)
        so.push([m.position.x-g.width/2,m.position.x+g.width/2]); });
    so.sort((a,b)=>a[0]-b[0]);
    let sb=0; for(const [a,c] of so){ const a2=Math.max(a,8.0), c2=Math.min(c,37.9); if(c2>a2) sb+=c2-a2; }
    o.sockel={stuecke:so.length,meterErweiterung:+sb.toFixed(2)};
    return o; });
  console.log('FUGEN',JSON.stringify(r));
  pruef('RUECKWAND',!r.rueckwand.length,'ragt in den Laden: '+JSON.stringify(r.rueckwand));
  pruef('BODENSCHATTEN',r.ao.n>=3&&!r.ao.luecken.length,'Luecken im Schatten an der Fensterfront: '+JSON.stringify(r.ao));
  /* 29,9 m Front, abzueglich der Eingangsachse (hoechstens gut 5 m) */
  pruef('SOCKEL',r.sockel.meterErweiterung>=24,'Sockelleiste in den Erweiterungen nur '+r.sockel.meterErweiterung+' m');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

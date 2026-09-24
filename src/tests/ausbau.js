/* Ausbau: Bauwaende, Zonen, SB-Kassen, Packstation */
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
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_CERT')<0) errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);

  const zu=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    const z=id=>bb.ZONEN[id];
    o.zonen=Object.keys(bb.ZONEN).sort();
    o.wandSichtbar=o.zonen.map(id=>id+':'+z(id).wand.filter(m=>m.visible).length);
    o.inhaltSichtbar=o.zonen.map(id=>id+':'+z(id).obj.filter(m=>m.visible).length);
    o.offen=o.zonen.map(id=>bb.zoneOffen(id));
    /* Bauwand sperrt */
    const drin=(x,zz)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&zz>c.minZ&&zz<c.maxZ);
    o.sperrtShop=drin(8.0,0); o.sperrtLager=drin(-14,2.0);
    o.slotsOffen=bb.slotsOffen().length; o.slotsGesamt=bb.SLOTS.length;
    o.racksOffen=bb.RACKS.filter(r=>!r.zone||bb.zoneOffen(r.zone)).length; o.racksGesamt=bb.RACKS.length;
    o.packHitAus=(()=>{let n=bb.packHit;while(n){if(!n.visible)return true;n=n.parent;}return false;})();
    return o;
  });
  console.log('GESPERRT',JSON.stringify(zu));

  const auf=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    bb.S.level=30; bb.S.money=200000;
    ['shop_halb','shop_gross','lager','lager_nord','lager_gross','packstation','onlineshop','kasse2'].forEach(id=>bb.testKauf(id));
    o.gekauft={shop:bb.S.up.shop_gross,lager:bb.S.up.lager_gross,pack:bb.S.up.packstation,online:bb.S.up.onlineshop,sb:bb.S.up.kasse2};
    const z=id=>bb.ZONEN[id];
    o.wandSichtbar=['shop_gross','lager_gross','packstation'].map(id=>id+':'+z(id).wand.filter(m=>m.visible).length);
    o.inhaltUnsichtbar=['shop_gross','lager_gross','packstation'].map(id=>id+':'+z(id).obj.filter(m=>!m.visible).length);
    const drin=(x,zz)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&zz>c.minZ&&zz<c.maxZ);
    o.bauwandWeg={shop:!drin(8.0,0),lager:!drin(-14,2.0)};
    o.neueWand={ostwand:drin(14.7,0),lagerRueck:drin(-14,6.05)};
    o.slotsOffen=bb.slotsOffen().length;
    o.racksOffen=bb.RACKS.filter(r=>!r.zone||bb.zoneOffen(r.zone)).length;
    o.sbLanes=bb.sbLanes.length;
    o.packHitAn=(()=>{let n=bb.packHit;while(n){if(!n.visible)return false;n=n.parent;}return true;})();
    return o;
  });
  console.log('GEKAUFT',JSON.stringify(auf));

  /* Voraussetzungen: ohne shop_gross keine SB-Kasse */
  const req=await p.evaluate(()=>{
    const bb=window.__bb;
    const u=bb.UPGRADES.find(x=>x.id==='kasse2'), pk=bb.UPGRADES.find(x=>x.id==='packstation');
    return {kasse2Req:u.req,packReq:pk.req,packerReq:bb.STAFF.find(s=>s.id==='packer').req,torWeg:!bb.UPGRADES.some(x=>x.id==='tor2')};
  });
  console.log('REQ',JSON.stringify(req));

  /* Neue Regale auf die neuen Plaetze */
  const regale=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    const vor=bb.shelves.length;
    for(let i=0;i<8;i++) bb.regalStellen('standard');
    o.neu=bb.shelves.length-vor;
    o.maxX=Math.max(...bb.shelves.map(s=>+s.g.position.x.toFixed(1)));
    const vr=bb.racks.length;
    for(let i=0;i<6;i++) bb.regalStellen('rack');
    o.racksNeu=bb.racks.length-vr;
    o.maxZ=Math.max(...bb.racks.map(r=>+r.g.position.z.toFixed(1)));
    return o;
  });
  console.log('REGALE',JSON.stringify(regale));

  /* Versand: Bestellungen -> Pakete -> Abholung */
  const versand=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    o.bereit=bb.packBereit();
    o.proTag=bb.bestellungenProTag();
    o.wert=bb.paketWert();
    bb.openShop(); bb.run(200,0.05);
    o.offenNachLauf=bb.S.offen|0;
    const geld0=bb.S.money;
    let n=0; while(bb.packOne(false)) n++;
    o.gepackt=n; o.pakete=bb.S.pakete|0; o.meshes=bb.pakete.length;
    o.verdient=+(bb.S.money-geld0).toFixed(2);
    o.rampeVoll=bb.packOne(false)===false;
    const ab=bb.ddlAbholung();
    o.abgeholt=ab; o.meshesDanach=bb.pakete.length;
    return o;
  });
  console.log('VERSAND',JSON.stringify(versand));

  /* SB-Kassen bedienen Kunden */
  const sb=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    bb.hireStaff('packer'); bb.S.staff.packer=true;
    /* Regale fuellen, sonst kauft niemand */
    const arten=['wunder','knallfrosch','boeller','sekt','konfetti','raketenklein','chips','knicklichter'];
    bb.allLevels().forEach((lv,i)=>{ const t=arten[i%arten.length]; bb.addToLevel(lv,t,1); for(let k=0;k<30;k++) bb.addToLevel(lv,t,1); });
    o.imRegal=bb.allLevels().reduce((a,l)=>a+l.count,0);
    bb.phase='open'; bb.clock=480;
    const rev0=bb.DS.revenue;
    bb.run(260,0.05);
    o.kunden=bb.customers.length;
    o.sbBenutzt=bb.DS.sb|0;
    o.zustaende=[...new Set(bb.customers.map(c=>c.state))].sort();
    o.umsatz=+(bb.DS.revenue-rev0).toFixed(2);
    o.lanesFrei=bb.sbLanes.filter(l=>!l.busy).length;
    o.genervt=bb.DS.angry;
    return o;
  });
  console.log('SB',JSON.stringify(sb));


  /* Geometrie: ragt etwas in die neuen Raeume hinein? */
  const geo=await p.evaluate(()=>{
    const bb=window.__bb;
    const rot=e=>{ const a=Math.cos(e.x),b2=Math.sin(e.x),c=Math.cos(e.y),d=Math.sin(e.y),f=Math.cos(e.z),h=Math.sin(e.z);
      return [[c*f,-c*h,d],[a*h+b2*f*d,a*f-b2*h*d,-b2*c],[b2*h-a*f*d,b2*f+a*h*d,a*c]]; };
    const out=[];
    bb.scene.traverse(m=>{
      const pr=m.geometry&&m.geometry.parameters; if(!pr) return;
      let n=m; while(n){ if(!n.visible) return; n=n.parent; }
      const half=[(pr.width||0)/2,(pr.height||0)/2,(pr.depth||0)/2];
      let off=[0,0,0]; n=m; let R=null;
      while(n&&n!==bb.scene){ off[0]+=n.position.x; off[1]+=n.position.y; off[2]+=n.position.z; if(!R&&(n.rotation.x||n.rotation.y||n.rotation.z)) R=rot(n.rotation); n=n.parent; }
      R=R||[[1,0,0],[0,1,0],[0,0,1]];
      const lo=[],hi=[];
      for(let i=0;i<3;i++){ let e=0; for(let c2=0;c2<3;c2++) e+=Math.abs(R[i][c2])*half[c2];
        lo[i]=+(off[i]-e).toFixed(2); hi[i]=+(off[i]+e).toFixed(2); }
      out.push({lo,hi,t:m.geometry.constructor.name});
    });
    const scan=(RX,RY,RZ)=>out.filter(o=>{
      const ueber=o.hi[0]>RX[0]&&o.lo[0]<RX[1]&&o.hi[2]>RZ[0]&&o.lo[2]<RZ[1]&&o.hi[1]>RY[0]&&o.lo[1]<RY[1];
      if(!ueber) return false;
      const mx=(o.lo[0]+o.hi[0])/2, mz=(o.lo[2]+o.hi[2])/2;
      return !(mx>RX[0]&&mx<RX[1]&&mz>RZ[0]&&mz<RZ[1]);
    }).map(o=>`${o.t} x[${o.lo[0]},${o.hi[0]}] y[${o.lo[1]},${o.hi[1]}] z[${o.lo[2]},${o.hi[2]}]`);
    return {neuerShop:scan([8.15,14.55],[0.05,3.58],[-5.85,5.75]),
            anbau:scan([-19.85,-8.15],[0.05,2.8],[2.15,5.9]),
            altShop:scan([-7.88,7.88],[0.05,3.58],[-5.88,5.88]),
            altLager:scan([-19.88,-8.12],[0.05,3.58],[-5.88,1.88])};
  });
  console.log('GEOMETRIE',JSON.stringify(geo,null,1));

  /* Speichern und laden */
  await p.evaluate(()=>{ window.__bb.save(); });
  await p.reload();
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
  const geladen=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    o.up={shop:bb.S.up.shop_gross,lager:bb.S.up.lager_gross,pack:bb.S.up.packstation,sb:bb.S.up.kasse2};
    o.zonenOffen=['shop_gross','lager_gross','packstation'].map(id=>id+':'+bb.zoneOffen(id));
    o.wandSichtbar=['shop_gross','lager_gross'].map(id=>bb.ZONEN[id].wand.filter(m=>m.visible).length);
    o.inhaltSichtbar=bb.ZONEN.shop_gross.obj.filter(m=>m.visible).length;
    const drin=(x,zz)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&zz>c.minZ&&zz<c.maxZ);
    o.bauwandWeg=!drin(8.0,0);
    o.sbDa=bb.sbLanes.length;
    o.regale=bb.shelves.length; o.racks=bb.racks.length;
    o.maxX=Math.max(...bb.shelves.map(s=>+s.g.position.x.toFixed(1)));
    o.pakete=bb.S.pakete|0; o.offen=bb.S.offen|0;
    return o;
  });
  console.log('GELADEN',JSON.stringify(geladen));

  /* Alle 18 Regalplaetze und 14 Lagerplaetze belegen */
  const voll=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    bb.S.money=500000;
    for(let i=0;i<20;i++) bb.regalStellen('standard');
    for(let i=0;i<20;i++) bb.regalStellen('rack');
    o.regale=bb.shelves.length; o.racks=bb.racks.length;
    o.xNeu=bb.shelves.filter(sh=>sh.g.position.x>8).length;
    o.zNeu=bb.racks.filter(r=>r.g.position.z>2).length;
    const p2=bb.shelves.map(sh=>sh.g.position.x.toFixed(1)+'/'+sh.g.position.z.toFixed(1));
    o.doppelt=p2.length-new Set(p2).size;
    const p3=bb.racks.map(r=>r.g.position.x.toFixed(1)+'/'+r.g.position.z.toFixed(1));
    o.rDoppelt=p3.length-new Set(p3).size;
    return o;
  });
  console.log('VOLL',JSON.stringify(voll));

  /* Neues Spiel nach einem Spielstand: alles wieder hinter der Bauwand */
  const frisch=await p.evaluate(()=>{
    const bb=window.__bb;
    bb.startGame(true);
    const drin=(x,zz)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&zz>c.minZ&&zz<c.maxZ);
    return {up:bb.S.up.shop_gross,wandDa:bb.ZONEN.shop_gross.wand.filter(m=>m.visible).length,
            inhaltWeg:bb.ZONEN.shop_gross.obj.every(m=>!m.visible),
            sperrt:drin(8.0,0), sbWeg:!bb.sbLanes.length||bb.sbLanes.every(l=>{let n=l.g;while(n){if(!n.visible)return true;n=n.parent;}return false;}),
            sbColAusListe:bb.colliders.filter(c=>c.minX===9&&c.minZ===4.05).length, pakete:bb.pakete.length};
  });
  console.log('FRISCH',JSON.stringify(frisch));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

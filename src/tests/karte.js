/* Karte: Flaechen, Westrampen, Hof2, Logistikzentrum, freie Wege */
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

  const fl=await p.evaluate(()=>{
    const bb=window.__bb, L=bb.LAY, f=bb.flaeche, o={};
    o.basis=f(L.basis); o.verkauf=f(L.basis)+f(L.ost1)+f(L.ost2)+f(L.sued);
    o.lbasis=f(L.lbasis); o.lager=f(L.lbasis)+f(L.lnord)+f(L.lsued)+f(L.lwest);
    o.test=f(L.test); o.logi=f(L.logi); o.hof2=f(L.hof2);
    o.faktorVerkauf=+(o.verkauf/o.basis).toFixed(1);
    o.faktorLager=+(o.lager/o.lbasis).toFixed(1);
    /* Rechtecke duerfen sich nicht ueberlappen */
    const R=[['ost1',L.ost1],['ost2',L.ost2],['sued',L.sued],['basis',L.basis],
             ['lbasis',L.lbasis],['lnord',L.lnord],['lsued',L.lsued],['lwest',L.lwest],['test',L.test]];
    o.ueberlappt=[];
    for(let i=0;i<R.length;i++) for(let k=i+1;k<R.length;k++){
      const a=R[i][1],c=R[k][1];
      if(a.x0<c.x1-0.01&&a.x1>c.x0+0.01&&a.z0<c.z1-0.01&&a.z1>c.z0+0.01) o.ueberlappt.push(R[i][0]+'/'+R[k][0]);
    }
    return o;
  });
  console.log('FLAECHEN',JSON.stringify(fl));

  const w=await p.evaluate(()=>{
    const bb=window.__bb, L=bb.LAY, o={};
    const drin=(x,z)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ);
    /* Die drei Tore sitzen in der Westwand und bleiben zu */
    o.tore=bb.WRAMPEN.slice();
    o.toreImBereich=bb.WRAMPEN.every(z=>z-bb.WTOR.w/2>L.lwest.z0&&z+bb.WTOR.w/2<L.lwest.z1);
    o.toreDicht=bb.WRAMPEN.every(z=>drin(L.lwest.x0-0.1,z));
    /* Die Westwand ist ueberall dicht */
    o.westwandDicht=[-29,-25.6,-22,-18.6,-15,-11.6,-8].every(z=>drin(L.lwest.x0-0.1,z));
    /* Hofboden vor den Toren ist frei begehbar */
    o.hofFrei=bb.WRAMPEN.every(z=>!drin(L.lwest.x0-6,z));
    /* Zufahrt vom alten Hof nach Westen und weiter in den grossen Hof */
    o.zufahrt=[[-36,-1.5],[-44,-1.5],[-52,-1.5],[-52,-5],[-52,-9],[-52,-16]].map(q=>drin(q[0],q[1]));
    o.zufahrtFrei=o.zufahrt.every(v=>!v);
    /* Der Hof ist eingezaeunt */
    o.zaunDicht=[[-64,-20],[-64,-12],[-55,-30],[-45,-30],[-60,-7],[-44,-7]].every(q=>drin(q[0],q[1]));
    /* Auflieger stehen im Weg, aber nicht vor den Toren */
    o.aufliegerBlock=drin(L.hof2.x0+2.2,L.hof2.z0+9.6);
    return o;
  });
  console.log('WESTRAMPE',JSON.stringify(w));

  const lo=await p.evaluate(()=>{
    const bb=window.__bb, Z=bb.LOGI, o={};
    const drin=(x,z)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&z>c.minZ&&z<c.maxZ);
    o.zone=!!bb.ZONEN.logistik;
    o.offen=bb.zoneOffen('logistik');
    o.schildSichtbar=bb.ZONEN.logistik?bb.ZONEN.logistik.wand.filter(m=>m.visible).length:0;
    /* gesperrt: alles hinter dem Zaun */
    o.gesperrt=[[45,0],[60,0],[70,-10],[85,5],[43,-14],[50,12]].every(q=>drin(q[0],q[1]));
    /* davor bleibt der Gehweg frei */
    o.davorFrei=[[39,8],[39,0],[35,8]].every(q=>!drin(q[0],q[1]));
    /* nach dem Kauf faellt Zaunkollision und Bauschild */
    bb.S.up.logistik=true; bb.oeffneZone('logistik');
    o.nachKauf={frei:!drin(60,0),schild:bb.ZONEN.logistik.wand.filter(m=>m.visible).length};
    return o;
  });
  console.log('LOGISTIK',JSON.stringify(lo));

  const st=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    /* Stadt darf weder auf den Hof noch aufs Logistikzentrum bauen */
    o.frei=[[-60,-20],[-50,-28],[30,-10],[60,0],[88,10],[20,-18]].map(q=>bb.stadtFrei(q[0],q[1],6));
    o.keineBauten=o.frei.every(v=>v===false);
    /* Weit draussen wird weiter gebaut */
    o.draussen=[[-140,-60],[140,-60],[0,-120]].every(q=>bb.stadtFrei(q[0],q[1],6));
    let n=0; bb.scene.traverse(m=>{ if(m.userData&&m.userData.stadt) n++; });
    o.stadtMeshes=n;
    return o;
  });
  console.log('STADT',JSON.stringify(st));

  const voll=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    bb.S.level=40; bb.S.money=5e6;
    ['shop_halb','shop_gross','shop_ost','shop_sued','lager_nord','lager_gross','lager_sued','lager_west','packstation','onlineshop','kasse2']
      .forEach(id=>bb.testKauf(id));
    o.zonen=['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west'].map(z=>z+':'+bb.zoneOffen(z));
    /* alles vollstellen */
    const kauf=['klein','standard','hoch','kuehl','gondel','eck','rack','rhoch','rschwer'];
    for(let r=0;r<80;r++){ let w=false;
      for(const id of kauf){ if(bb.regalStellen(id)) w=true; }
      if(!w) break; }
    o.slots=bb.SLOTS.length; o.regale=bb.shelves.length;
    o.racks=bb.racks.length; o.rackPlaetze=bb.RACKS.length;
    o.arten={}; bb.shelves.forEach(sh=>o.arten[sh.kind]=(o.arten[sh.kind]||0)+1);
    o.rArten={}; bb.racks.forEach(r=>o.rArten[r.kind]=(o.rArten[r.kind]||0)+1);
    /* Gondel und Eck haben zwei Warenseiten */
    const gon=bb.shelves.find(s=>s.kind==='gondel'), eck=bb.shelves.find(s=>s.kind==='eck');
    o.gondelFaecher=gon?gon.levels.length:0; o.gondelSeiten=gon?new Set(gon.levels.map(l=>l.face)).size:0;
    o.eckFaecher=eck?eck.levels.length:0;   o.eckSeiten=eck?new Set(eck.levels.map(l=>l.face)).size:0;
    /* keine zwei Moebel auf derselben Stelle, nichts ueberlappt */
    const rects=[];
    bb.movables.forEach(m=>{ if(!m.fw||(m.kind!=='shelf'&&m.kind!=='rack')) return;
      const si=Math.abs(Math.sin(m.g.rotation.y))>0.5, w=(si?m.fd:m.fw)/2, d=(si?m.fw:m.fd)/2;
      rects.push({k:m.kind,x0:m.g.position.x-w,x1:m.g.position.x+w,z0:m.g.position.z-d,z1:m.g.position.z+d}); });
    o.ueberlappt=0;
    for(let i=0;i<rects.length;i++) for(let k=i+1;k<rects.length;k++){ const a=rects[i],c=rects[k];
      if(a.x0<c.x1-0.02&&a.x1>c.x0+0.02&&a.z0<c.z1-0.02&&a.z1>c.z0+0.02) o.ueberlappt++; }
    /* Hochregale duerfen nur in die hohen Hallen */
    o.hochFalsch=bb.racks.filter(r=>r.kind!=='standard'&&r.g.position.z>-6).length;
    /* Ware laesst sich auf beiden Gondelseiten einraeumen */
    if(gon){ const a=bb.addToLevel(gon.levels[0],'boeller',1), b=bb.addToLevel(gon.levels[gon.levels.length-1],'boeller',1);
      o.gondelBeideSeiten=!!(a&&b); }
    return o;
  });
  console.log('VOLLAUSBAU',JSON.stringify(voll));

  const weg=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    const V2=(x,z)=>({x:x,y:0,z:z,clone:function(){return {x:x,y:0,z:z,clone:this.clone};}});
    /* von der Tuer zu jedem Regal: Weg vorhanden und frei */
    let ok=0, fehl=0, lang=0;
    const start={x:0,y:0,z:4.9,clone(){return this;}};
    bb.shelves.forEach(sh=>{
      const ziel=bb.shelfStand(sh,sh.levels[0]);
      const p2=bb.route(start,ziel);
      if(!p2||!p2.length){ fehl++; return; }
      /* jeder Zwischenpunkt muss begehbar sein */
      let frei=true;
      for(const q of p2.slice(0,-1)) if(!bb.navFrei(bb.navIdx(q.x,q.z))) frei=false;
      if(frei) ok++; else fehl++;
      lang=Math.max(lang,p2.length);
    });
    o.erreichbar=ok; o.unerreichbar=fehl; o.maxPunkte=lang;
    o.rasterFrei=(()=>{ let n=0; for(let i=0;i<bb.NAV.g.length;i++) if(!bb.NAV.g[i]) n++; return n; })();
    o.rasterGesamt=bb.NAV.g.length;
    return o;
  });
  console.log('WEGE',JSON.stringify(weg));

  /* Speichern, neu laden, alles muss wieder da sein */
  await p.evaluate(()=>window.__bb.save());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  await p.waitForTimeout(400);
  const neu=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    o.zonen=['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west'].map(z=>z+':'+bb.zoneOffen(z));
    o.alleOffen=['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west'].every(z=>bb.zoneOffen(z));
    o.regale=bb.shelves.length; o.racks=bb.racks.length;
    o.arten={}; bb.shelves.forEach(sh=>o.arten[sh.kind]=(o.arten[sh.kind]||0)+1);
    o.rArten={}; bb.racks.forEach(r=>o.rArten[r.kind]=(o.rArten[r.kind]||0)+1);
    o.bauwaendeWeg=['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west']
      .every(z=>bb.ZONEN[z].wand.every(m=>!m.visible));
    o.inhaltDa=['shop_ost','shop_sued','lager_sued','lager_west']
      .every(z=>bb.ZONEN[z].obj.every(m=>m.visible));
    const drin=(x,zz)=>bb.colliders.some(c=>x>c.minX&&x<c.maxX&&zz>c.minZ&&zz<c.maxZ);
    o.durchgaengeFrei=[[8.0,0],[20.0,0],[13.0,-6.0],[28.0,-6.0],[-14,2.0],[-14,-6.0],[-19.9,-19.0]]
      .map(q=>!drin(q[0],q[1]));
    o.warenAufGondel=bb.shelves.filter(s=>s.kind==='gondel').reduce((a,s)=>a+s.levels.reduce((b,l)=>b+l.count,0),0);
    return o;
  });
  console.log('NEUGELADEN',JSON.stringify(neu));

  /* Hofobjekte muessen im Hof bleiben - ein quer gestellter Auflieger
     ragte schon einmal durch die Ladenwand bis in die Suedhalle. */
  const hof=await p.evaluate(()=>{
    const bb=window.__bb, L=bb.LAY, o={draussen:[]};
    const HOF=[
      {x0:L.hof2.x0-1,x1:L.hof2.x1+1,z0:L.hof2.z0-1,z1:L.hof2.z1+1},   /* Westhof   */
      {x0:L.hof.x0-2, x1:-19.5,      z0:L.hof.z0-1, z1:L.hof.z1+1},     /* Basishof  */
      {x0:40.5,x1:92,z0:-18,z1:16}                                      /* Logistik  */
    ];
    const ecken=[[-1,-1],[1,-1],[1,1],[-1,1]];
    bb.scene.traverse(m=>{
      if(!m.userData||!m.userData.hof) return;
      /* halbe Ausdehnung grob aus den Kindern, mit Drehung gerechnet */
      let hx=0,hz=0;
      m.traverse(k=>{ const pr=k.geometry&&k.geometry.parameters; if(!pr) return;
        let px=0,pz=0,n=k; while(n&&n!==m){ px+=n.position.x; pz+=n.position.z; n=n.parent; }
        hx=Math.max(hx,Math.abs(px)+(pr.width||pr.radiusBottom*2||0)/2);
        hz=Math.max(hz,Math.abs(pz)+(pr.depth||pr.radiusBottom*2||0)/2); });
      if(m.geometry&&m.geometry.boundingSphere){ hx=Math.max(hx,1); hz=Math.max(hz,1); }
      const c=Math.cos(m.rotation.y), si=Math.sin(m.rotation.y);
      let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
      for(const [ex,ez] of ecken){
        const lx=ex*hx, lz=ez*hz;
        const wx=m.position.x+lx*c+lz*si, wz=m.position.z-lx*si+lz*c;
        minX=Math.min(minX,wx); maxX=Math.max(maxX,wx);
        minZ=Math.min(minZ,wz); maxZ=Math.max(maxZ,wz);
      }
      const drin=HOF.some(h=>minX>=h.x0&&maxX<=h.x1&&minZ>=h.z0&&maxZ<=h.z1);
      if(!drin) o.draussen.push(m.userData.hof+' x['+minX.toFixed(1)+','+maxX.toFixed(1)+'] z['+minZ.toFixed(1)+','+maxZ.toFixed(1)+']');
    });
    o.anzahl=0; bb.scene.traverse(m=>{ if(m.userData&&m.userData.hof) o.anzahl++; });
    return o;
  });
  console.log('HOFOBJEKTE',JSON.stringify(hof));

  const perf=await p.evaluate(()=>{
    const bb=window.__bb; let n=0,tri=0;
    bb.scene.traverse(m=>{ if(m.isMesh){ n++; const g=m.geometry; if(g&&g.attributes&&g.attributes.position) tri+=g.attributes.position.count/3; } });
    return {meshes:n,dreiecke:Math.round(tri),colliders:bb.colliders.length};
  });
  console.log('SZENE',JSON.stringify(perf));

  if(process.argv[3]){
    await p.evaluate(()=>window.__bb.setView(-38,-2,-Math.PI/2,-0.05));
    const d=await p.evaluate(()=>window.__bb.shot());
    require('fs').writeFileSync(process.argv[3],Buffer.from(d.split(',')[1],'base64'));
    await p.evaluate(()=>window.__bb.setView(30,9,Math.PI/2,-0.02));
    const d2=await p.evaluate(()=>window.__bb.shot());
    require('fs').writeFileSync(process.argv[3].replace('.png','-logi.png'),Buffer.from(d2.split(',')[1],'base64'));
  }
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'ERRORS: keine');
  await b.close();
})();

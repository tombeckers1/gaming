/* Verpackungs-Vorfuehrung (Tom, 02.10.: "jedes Produkt in einer Reihe im
   Regal ... dass das Regal befuellt ist, keine Luecken, das Produkt haengt
   nicht halb ueber, die Sachen verschmelzen nicht ... wie im Supermarkt").
   Prueft nach vpStart():
   - PLATZ: jedes Produkt hat ein Fach, kein Fach bleibt leer, die Moebel
     ueberschneiden sich nicht und stehen im Raum
   - VOLL: jedes Fach ist bis zur Fassung gefuellt
   - RAND: keine Packung ragt aus dem Fach (Breite zwischen den Stehern,
     Tiefe, Hoehe bis zum naechsten Boden)
   - FUGE: keine zwei Packungen stecken ineinander
   - SEITE: Ware der zweiten Gondel- und Eckregalseite steht auf ihrer
     Seite (vorher landete sie auf der ersten)
   - LUECKE: in seinem Heimatregal fuellt jedes Produkt das Fach-Modul in
     der Breite zu mindestens 85 % und in der Tiefe zu mindestens 75 %
   - AUS: nach dem Beenden ist alles wie vorher (Regale, Zonen, Kollision, Modelle)
   - ERREICHBAR (03.10., Tom, Foto: "ich kann nur die erste Reihe sehen,
     dahinter komme ich nicht hin"): eigener Ausstellungsraum; vom
     Startpunkt aus kommt man zu Fuss (Rasterweg ueber die echten
     Kollisionen, Spielerradius) vor jede Warenseite jedes Moebels.
   Aufruf: node -r ladezeit-preload.js verpackung.js real.html
   - GETRAENK (03.10.): Getraenke offen im Regal, hoechstens 2 im Kuehlschrank
   - NAME (03.10., Tom): vorn an jedem Fach ein Schild mit dem Produkt-
     namen, nach dem Beenden weg. Gegenprobe: ohne vpNamenBauen -> NAME.
   - SPEICHER / KNOPF (02.10. abends, Tom: "haengt sich auf, Fehler ist
     aufgetreten", PC und iPhone): gestartet wird ueber den Knopf im Laptop,
     der Klick haelt das Spiel hoechstens 2,5 s an (vorher 10,4 s), die
     Verpackungsbilder der Vorfuehrung haben zusammen hoechstens 45
     Megapixel (vorher 124), nach dem Beenden sind die Modelle wieder weg.
     Gegenprobe: volle Aufloesung -> SPEICHER (124,2 MP).
   Gegenprobe (02.10.): ohne face in addToLevel -> SEITE schlaegt an (48
   Faecher auf der falschen Gondelseite); ohne Massraster -> LUECKE (119
   Produkte) und RAND (9 lange Packungen ueber dem Mittelsteher). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:60000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await neuesSpiel(p);
  /* wie im Spiel: Knopf im Laptop, dann baut sich die Halle Stueck fuer
     Stueck auf - waehrenddessen laeuft das Spiel weiter */
  const start=await p.evaluate(()=>{ const bb=window.__bb; window.__poolsVorher=Object.keys(bb.pools); window.__vorher={shelves:bb.shelves.length,cols:bb.colliders.length,lager:bb.ZONEN.lager_gross?bb.ZONEN.lager_gross.offen:null,pools:Object.keys(bb.pools).length};
    bb.openLaptop('shop'); bb.renderLaptop();   /* 09.10.: Tab heisst seit der Versandecke (Geraete-Tabs) 'shop' */ const k=document.querySelector('[data-a="verpackung"]'); const t=performance.now(); if(k) k.click(); return {knopf:!!k,ms:Math.round(performance.now()-t)}; });
  console.log('Knopf',JSON.stringify(start));
  await p.waitForFunction('window.__bb.vpFertig',null,{timeout:1200000,polling:500});
  const r=await p.evaluate((start)=>{ const bb=window.__bb, P=bb.P, o={platz:[],voll:[],rand:[],fuge:[],seite:[],luecke:[],aus:[],erreichbar:[]};
    const vorher=window.__vorher;
    /* der Klick darf das Spiel nicht lange anhalten (vorher 10 s) */
    if(!start.knopf) o.aus.push('kein Knopf im Laptop'); if(start.ms>2500) o.aus.push('Knopf blockiert das Spiel '+start.ms+' ms');
    const regale=bb.vpRegale, plan=bb.vpPlan, alle=bb.vpProdukte();
    /* PLATZ */
    const hat=new Set(plan.map(e=>e.t)); alle.forEach(t=>{ if(!hat.has(t)) o.platz.push('ohne Fach: '+t); });
    regale.forEach(sh=>sh.levels.forEach(lv=>{ if(!lv.count) o.platz.push('leer: '+sh.kind+'/'+(lv.face||0)+'/'+lv.li); }));
    const rect=sh=>{ const K=bb.kindOf(sh), w=(K.fw||K.w)/2, d=(K.fd||K.d)/2, q=Math.abs(Math.round(Math.sin(sh.g.rotation.y))), x=sh.g.position.x, z=sh.g.position.z;
      return q?[x-d,x+d,z-w,z+w]:[x-w,x+w,z-d,z+d]; };
    const F=bb.VP_FL;
    regale.forEach((a,i)=>{ const A=rect(a); if(A[0]<F.x0-0.01||A[1]>F.x1+0.01||A[2]<F.z0-0.01||A[3]>F.z1+0.01) o.platz.push('aus der Halle: '+a.kind+i);
      regale.forEach((c,j)=>{ if(j<=i) return; const C=rect(c); if(A[0]<C[1]-0.01&&A[1]>C[0]+0.01&&A[2]<C[3]-0.01&&A[3]>C[2]+0.01) o.platz.push('ueberschneiden: '+a.kind+i+'/'+c.kind+j); }); });
    /* VOLL, RAND, FUGE */
    plan.forEach(e=>{ const sh=e.sh, lv=e.lv, K=bb.kindOf(sh), L=bb.layout(e.t,sh,lv), cap=L.cap, id=e.t+'@'+sh.kind+'/'+lv.li;
      if(lv.count!==cap) o.voll.push(id+' '+lv.count+'/'+cap);
      const H=bb.fachHoehe(K,lv.li), iw=K.w-0.1, n=K.mod||1, mb=(iw-(n-1)*0.03)/n;
      const box=[];
      for(let k=0;k<cap;k++){ const s=bb.slotLocal(e.t,k,sh,lv), x0=s.x-L.w/2, x1=s.x+L.w/2, z0=s.z-L.d/2, z1=s.z+L.d/2;
        if(x0<-iw/2-0.002||x1>iw/2+0.002) { o.rand.push(id+' seitlich'); break; }
        if(!K.frei&&n>1){ const m=Math.floor((s.x+iw/2)/(mb+0.03)), mx0=-iw/2+m*(mb+0.03), mx1=mx0+mb; if(x0<mx0-0.002||x1>mx1+0.002){ o.rand.push(id+' ueber den Mittelsteher'); break; } }
        if(z0<-K.d/2-0.002||z1>K.d/2+0.002){ o.rand.push(id+' Tiefe'); break; }
        if(s.y+L.h>H+0.002){ o.rand.push(id+' Hoehe '+(s.y+L.h).toFixed(2)+'>'+H.toFixed(2)); break; }
        box.push([x0,x1,s.y,s.y+L.h,z0,z1]); }
      if(box.length<=400) for(let i=0;i<box.length;i++) for(let j=i+1;j<box.length;j++){ const A=box[i],C=box[j];
        if(A[0]<C[1]-0.001&&A[1]>C[0]+0.001&&A[2]<C[3]-0.001&&A[3]>C[2]+0.001&&A[4]<C[5]-0.001&&A[5]>C[4]+0.001){ o.fuge.push(id+' #'+i+'/#'+j); i=box.length; break; } } });
    /* SEITE: Weltlage der Ware vor der Warenseite */
    const VC=bb.camera.position.constructor, v=new VC(), q=new bb.camera.quaternion.constructor(), s3=new VC();
    plan.forEach(e=>{ const sh=e.sh, lv=e.lv, K=bb.kindOf(sh); if(!K.seiten) return;
      const f=K.seiten[lv.face||0], a=sh.g.rotation.y+f.ry, nx=Math.sin(a), nz=Math.cos(a);
      const cx=sh.g.position.x+f.ox*Math.cos(sh.g.rotation.y)+f.oz*Math.sin(sh.g.rotation.y), cz=sh.g.position.z-f.ox*Math.sin(sh.g.rotation.y)+f.oz*Math.cos(sh.g.rotation.y);
      const h=lv.items[lv.items.length-1]; if(!h) return; h.m.decompose(v,q,s3);
      const vor=(v.x-cx)*nx+(v.z-cz)*nz; if(vor<-0.01||vor>K.d/2+0.01) o.seite.push(e.t+'@'+sh.kind+' Seite '+(lv.face||0)+': '+vor.toFixed(2)+' m vor der Seitenmitte'); });
    /* LUECKE: Heimatregal (wie kartonWahl) */
    alle.forEach(t=>{ const pp=P[t], heim=pp.kuehlpflicht?['kuehl','tisch']:['standard','gross','tisch'];
      for(const k of heim){ const K=bb.SHELFKIND[k]; let best=null;
        K.lv.forEach((_,li)=>{ const L=bb.layout(t,{kind:k,levels:[]},{li}); if(!L.cap) return; const R=bb.modRaster(K);
          const fw=L.cols*(L.w+L.g)/(R.B*R.MX), fd=L.rows*(L.d+L.g)/(R.T*R.MZ); if(!best||fw*fd>best.fw*best.fd) best={fw,fd}; });
        /* Kugelbomben sind rund und muessen ins Moerserrohr: nur die Breite zaehlt */
        if(best){ if(best.fw<0.85||(best.fd<0.75&&pp.shape!=='shell')) o.luecke.push(`${t} in ${k}: Breite ${Math.round(best.fw*100)} %, Tiefe ${Math.round(best.fd*100)} %`); break; } } });
    /* ERREICHBAR (03.10., Tom: "ich kann nur die erste Reihe sehen, da
       komme ich nicht hin"): vom Startpunkt aus zu Fuss (Spielerradius
       0,32 m) vor jede Warenseite jedes Moebels kommen. Rasterweg ueber die
       echten Kollisionen. */
    { const F=bb.VP_FL, s0=0.1, R=0.34, nx=Math.ceil((F.x1-F.x0)/s0), nz=Math.ceil((F.z1-F.z0)/s0);
      const cols=bb.colliders.filter(c=>c.maxX>F.x0-1&&c.minX<F.x1+1&&c.maxZ>F.z0-1&&c.minZ<F.z1+1);
      const frei=new Uint8Array(nx*nz);
      for(let i=0;i<nx;i++) for(let k=0;k<nz;k++){ const x=F.x0+(i+0.5)*s0, z=F.z0+(k+0.5)*s0; let ok=x>F.x0+R&&x<F.x1-R&&z>F.z0+R&&z<F.z1-R;
        if(ok) for(const c of cols){ if(x>c.minX-R&&x<c.maxX+R&&z>c.minZ-R&&z<c.maxZ+R){ ok=false; break; } } frei[i*nz+k]=ok?1:0; }
      const idx=(x,z)=>{ const i=Math.floor((x-F.x0)/s0), k=Math.floor((z-F.z0)/s0); return i<0||k<0||i>=nx||k>=nz?-1:i*nz+k; };
      const p=bb.playerPos(), seen=new Uint8Array(nx*nz), q=[]; const st=idx(p.x,p.z);
      if(st<0||!frei[st]) o.platz.push('Startpunkt nicht frei'); else { q.push(st); seen[st]=1; }
      while(q.length){ const c=q.pop(), i=Math.floor(c/nz), k=c%nz;
        for(const [di,dk] of [[1,0],[-1,0],[0,1],[0,-1]]){ const i2=i+di, k2=k+dk; if(i2<0||k2<0||i2>=nx||k2>=nz) continue; const n=i2*nz+k2; if(frei[n]&&!seen[n]){ seen[n]=1; q.push(n); } } }
      o.seiten=0;
      regale.forEach(sh=>{ const K=bb.kindOf(sh), fs=K.seiten||[{ry:0,ox:0,oz:0}];
        fs.forEach((f,fi)=>{ o.seiten++; const a=sh.g.rotation.y, c=Math.cos(a), si=Math.sin(a);
          /* 0,55 bis 1,8 m vor der Warenseite muss ein freier, erreichbarer Punkt liegen (das Eckregal stoesst als ganzes Quadrat - man steht davor wie im Laden) */
          let ok=false; for(let d=0.55;d<=1.8&&!ok;d+=0.05){ const lx=f.ox+Math.sin(f.ry)*(K.d/2+d), lz=f.oz+Math.cos(f.ry)*(K.d/2+d);
            const x=sh.g.position.x+lx*c+lz*si, z=sh.g.position.z-lx*si+lz*c, n=idx(x,z); if(n>=0&&seen[n]) ok=true; }
          if(!ok) o.erreichbar.push(sh.kind+' Seite '+fi+' bei '+sh.g.position.x.toFixed(1)+'/'+sh.g.position.z.toFixed(1)); }); }); }
    /* SPEICHER: Verpackungsbilder der Vorfuehrung zusammen hoechstens 45
       Megapixel (vorher 124 - das iPhone stuerzte ab) */
    { const seen=new Set(); let px=0; for(const t of alle){ const pl=bb.pools[t]; if(!pl||!pl.vp) continue;
        pl.meshes.forEach(m=>{ (Array.isArray(m.material)?m.material:[m.material]).forEach(mt=>{ const tx=mt&&mt.map; if(tx&&!seen.has(tx)){ seen.add(tx); px+=(tx.__px||(tx.image?tx.image.width*tx.image.height:0)); } }); }); }
      o.mp=Math.round(px/1e5)/10; }
    /* GETRAENK (03.10., Tom: "die Getraenke kannst du in normale Regale
       raeumen"): hoechstens zwei Getraenke hinter Kuehlschrankglas */
    o.getraenk=[]; { const k=plan.filter(e=>bb.kindOf(e.sh).cold&&bb.sparteVon(e.t)==='getraenke').map(e=>e.t); if(k.length>2) o.getraenk.push(k.length+' Getraenke im Kuehlschrank: '+k.join(', ')); }
    /* NAME (03.10., Tom: "an den Produkten soll der Name stehen - nur im
       Testraum"): ein Schild je Fach, vorn an der Ware, mit seinem Bildfeld */
    o.name=[]; { const M=bb.vpNamenM; if(!M) o.name.push('keine Namensschilder');
      else { const pos=M.geometry.attributes.position, uv=M.geometry.attributes.uv, n=pos.count/6, sp=5, zl=Math.ceil(plan.length/sp);
        if(n!==plan.length) o.name.push(n+' Schilder fuer '+plan.length+' Faecher');
        const w=new THREE.Vector3(), c=new THREE.Vector3();
        plan.forEach((e,i)=>{ if(i>=n) return; c.set(0,0,0); let u=0,v=0; for(let j=0;j<6;j++){ w.fromBufferAttribute(pos,i*6+j); c.add(w); u+=uv.getX(i*6+j); v+=uv.getY(i*6+j); } c.multiplyScalar(1/6); u/=6; v/=6;
          const loc=e.lv.hit.worldToLocal(c.clone()), pa=e.lv.hit.geometry.parameters;
          if(!(loc.z>pa.depth/2&&loc.z<pa.depth/2+0.05&&Math.abs(loc.x)<0.05&&Math.abs(loc.y)<pa.height/2)) o.name.push(e.t+': Schild nicht vorn am Fach '+[loc.x,loc.y,loc.z].map(q=>q.toFixed(2)).join('/'));
          if(Math.floor(u*sp)!==i%sp||Math.floor((1-v)*zl)!==Math.floor(i/sp)) o.name.push(e.t+': falsches Namensfeld'); }); } }
    bb.vpAus();
    const nach={shelves:bb.shelves.length,cols:bb.colliders.length,lager:bb.ZONEN.lager_gross?bb.ZONEN.lager_gross.offen:null,pools:Object.keys(bb.pools).length};
    if(JSON.stringify(vorher)!==JSON.stringify(nach)) o.aus.push(JSON.stringify(vorher)+' -> '+JSON.stringify(nach)+' neu: '+Object.keys(bb.pools).filter(t=>!(window.__poolsVorher||[]).includes(t)).map(t=>t+'('+bb.pools[t].h.length+')').join(','));
    if(bb.vpRegale.length) o.aus.push('Moebel bleiben stehen');
    if(bb.vpNamenM||bb.scene.getObjectByName('vpNamen')) o.name.push('Namensschilder bleiben nach dem Beenden');
    o.n=plan.length; o.moebel=regale.length; return o; },start);
  console.log('Produkte',r.n,'Moebel',r.moebel,'Warenseiten',r.seiten,'Verpackungsbilder',r.mp,'MP');
  if(!(r.mp<=45)) r.aus.push('SPEICHER: Verpackungsbilder '+r.mp+' Megapixel (hoechstens 45)');
  const m=[];
  for(const k of ['platz','voll','rand','fuge','seite','luecke','aus','erreichbar','name','getraenk']) if(r[k].length) m.push(k.toUpperCase()+' '+r[k].length+'x: '+r[k].slice(0,40).join(' | '));
  console.log('MANGEL:',m.join('\n')||'keine');
  console.log('ERRORS:',errs.join(' | ')||'keine'); await b.close();
})();

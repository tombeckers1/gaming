/* Lagerstruktur: Das kleine Lager besteht ab Level 1 aus zwei
   Teilen, die Halle Sued waechst in drei Abschnitten vom Rolltor
   nach Sueden, und zwischen den Abschnitten bleibt keine Wand. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});

  let bad=0;
  const sag=(t,ok)=>{ console.log(`${t}: ${ok?'ok':'FEHLER'}`); if(!ok) bad++; };
  /* Schrittweise laufen, nicht springen - wer sich an das Ziel
     setzt, wird von der Kollision einfach durchgeschoben. */
  const lauf=(von,nach)=>p.evaluate(v=>{
    const bb=window.__bb;
    let cur={x:v.von[0],z:v.von[1]};
    bb.setView(cur.x,cur.z,0,0);
    for(let i=0;i<900;i++){
      const dx=v.nach[0]-cur.x, dz=v.nach[1]-cur.z, d=Math.hypot(dx,dz);
      if(d<0.4) return {an:true,x:+cur.x.toFixed(1),z:+cur.z.toFixed(1)};
      const r=bb.schiebe(cur.x+dx/d*0.08,cur.z+dz/d*0.08);
      if(Math.hypot(r.x-cur.x,r.z-cur.z)<0.004) return {an:false,x:+r.x.toFixed(1),z:+r.z.toFixed(1)};
      cur=r;
    }
    return {an:false,x:+cur.x.toFixed(1),z:+cur.z.toFixed(1)};
  },{von,nach});

  const RAMPE=[-14.0,-1.0];
  let r=await lauf(RAMPE,[-14.0,4.2]);
  sag(`Anbau Nord ab Level 1 begehbar (bis ${r.x}/${r.z})`,r.an);
  r=await lauf(RAMPE,[-14.0,-9.0]);
  sag(`Halle Sued I vor dem Kauf zu (bis ${r.x}/${r.z})`,!r.an);

  const kauf=id=>p.evaluate(i=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=5e6; bb.testKauf(i);
    return !!bb.S.up[i]; },id);
  sag('Halle Sued I gekauft',await kauf('lager_gross'));
  r=await lauf(RAMPE,[-14.0,-9.0]);
  sag(`Halle Sued I begehbar (bis ${r.x}/${r.z})`,r.an);
  r=await lauf([-14.0,-9.0],[-14.0,-19.0]);
  sag(`Halle Sued II vor dem Kauf zu (bis ${r.x}/${r.z})`,!r.an);

  sag('Halle Sued II gekauft',await kauf('lager_sued'));
  r=await lauf([-14.0,-9.0],[-14.0,-19.0]);
  sag(`Halle Sued II begehbar (bis ${r.x}/${r.z})`,r.an);
  sag('Halle Sued III gekauft',await kauf('lager_sued2'));
  r=await lauf([-14.0,-9.0],[-14.0,-26.5]);
  sag(`Halle Sued III begehbar (bis ${r.x}/${r.z})`,r.an);

  /* Keine Wand mehr zwischen den Abschnitten */
  const wand=await p.evaluate(()=>{
    const bb=window.__bb, vek=new THREE.Vector3(), treffer=[];
    const kanten=[-15.9,-22.9];
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.geometry||!o.geometry.attributes) return;
      let v=true; for(let a=o;a;a=a.parent) if(!a.visible) v=false; if(!v) return;
      if(o.material&&(o.material.transparent||o.material.opacity<1)) return;
      const pos=o.geometry.attributes.position;
      let kx=1e9,gx=-1e9,ky=1e9,gy=-1e9,kz=1e9,gz=-1e9;
      for(let i=0;i<pos.count;i++){
        vek.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
        kx=Math.min(kx,vek.x); gx=Math.max(gx,vek.x); ky=Math.min(ky,vek.y);
        gy=Math.max(gy,vek.y); kz=Math.min(kz,vek.z); gz=Math.max(gz,vek.z);
      }
      /* Etwas Massives auf Kopfhoehe quer ueber die Hallenbreite.
         Die Stadt im Hintergrund hat riesige Bounding-Boxen - was
         nicht ganz in der Halle liegt, zaehlt nicht. */
      if(kx<-21||gx>-7||kz<-31||gz>-5) return;
      if(ky>3.5||gy<1.0||gx-kx<4) return;
      for(const k of kanten)
        if(kz<k+0.25&&gz>k-0.25&&kx<-13&&gx>-15)
          treffer.push(`z=${k} <- x[${kx.toFixed(1)},${gx.toFixed(1)}] y[${ky.toFixed(1)},${gy.toFixed(1)}] ${o.geometry.type}`);
    });
    return treffer;
  });
  sag('keine Trennwand zwischen den Abschnitten',wand.length===0);
  wand.forEach(t=>console.log('   '+t));

  /* Eine Hoehe im ganzen Lager: nichts Massives darf unter der
     Decke quer durch den Raum haengen. Der alte Anbau hatte ein
     eigenes Flachdach auf 2,90 m - das lag als dunkler Balken quer
     im Lager, sobald die Decke hoeher wurde. */
  const balken=await p.evaluate(()=>{
    const bb=window.__bb, vek=new THREE.Vector3(), out=[];
    const R={x0:-19.6,x1:-8.4,z0:-29.6,z1:5.6,y0:2.2,y1:4.7};
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.geometry||!o.geometry.attributes) return;
      let v=true; for(let a=o;a;a=a.parent) if(!a.visible) v=false; if(!v) return;
      if(o.material&&(o.material.transparent||o.material.opacity<1)) return;
      const pos=o.geometry.attributes.position;
      let kx=1e9,gx=-1e9,ky=1e9,gy=-1e9,kz=1e9,gz=-1e9;
      for(let i=0;i<pos.count;i++){
        vek.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
        kx=Math.min(kx,vek.x); gx=Math.max(gx,vek.x); ky=Math.min(ky,vek.y);
        gy=Math.max(gy,vek.y); kz=Math.min(kz,vek.z); gz=Math.max(gz,vek.z);
      }
      /* Ueberschneidung mit dem Lager, nicht Enthaltensein: das alte
         Anbaudach ragte ueber die Waende hinaus und waere sonst
         durchgerutscht. Die Stadt im Hintergrund hat Bounding-Boxen
         von hunderten Metern und faellt ueber die Groesse raus. */
      if(gx<R.x0||kx>R.x1||gz<R.z0||kz>R.z1) return;
      if(gx-kx>30||gz-kz>40) return;
      if(ky<R.y0||gy>R.y1) return;
      if(Math.max(gx-kx,gz-kz)<3) return;
      out.push(`x[${kx.toFixed(1)},${gx.toFixed(1)}] y[${ky.toFixed(2)},${gy.toFixed(2)}] z[${kz.toFixed(1)},${gz.toFixed(1)}] ${o.geometry.type}`);
    });
    return out;
  });
  sag('nichts haengt unter der Lagerdecke',balken.length===0);
  balken.forEach(t=>console.log('   '+t));

  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):(bad?`ERRORS: ${bad} Punkte`:'ERRORS: keine'));
  await b.close();
})();

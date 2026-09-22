/* Naehte zwischen Basisladen und Ausbau: Die Fassade muss an der
   Stossstelle dicht sein, und der Bodenschatten darf nach dem Kauf
   nicht mehr dort liegen, wo frueher die Wand stand. */
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
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=5e6;
    ['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west'].forEach(id=>bb.testKauf(id)); });

  let bad=0;
  const sag=(t,ok)=>{ console.log(`${t}: ${ok?'ok':'FEHLER'}`); if(!ok) bad++; };

  /* 1) Fassade an der Stossstelle: ein Strahl von innen nach draussen
        darf nicht durchkommen. Vorher klaffte dort ein Schlitz von
        neun Zentimetern. */
  const strahl=await p.evaluate(()=>{
    const bb=window.__bb, rc=new THREE.Raycaster();
    const mess=x=>{
      rc.set(new THREE.Vector3(x,1.5,5.4),new THREE.Vector3(0,0,1));
      rc.far=1.6;
      const tr=rc.intersectObjects(bb.scene.children,true)
        .filter(h=>h.object.visible&&h.object.material&&h.object.material.opacity!==0);
      return tr.length?+tr[0].distance.toFixed(2):null;
    };
    return {naht:mess(8.03),links:mess(7.0),rechts:mess(9.5)};
  });
  sag(`Fassade an der Naht dicht (Treffer bei ${strahl.naht})`,strahl.naht!==null);
  sag(`Fassade links dicht (${strahl.links})`,strahl.links!==null);
  sag(`Fassade rechts dicht (${strahl.rechts})`,strahl.rechts!==null);

  /* 2) Bodenschatten: an den inneren Kanten darf nach dem Kauf
        keiner mehr liegen. */
  const ao=await p.evaluate(()=>{
    const bb=window.__bb, vek=new THREE.Vector3(), streifen=[];
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.material||!o.material.alphaMap) return;
      if(!(o.material.opacity>0.4&&o.material.opacity<0.45)) return;
      let v=true; for(let a=o;a;a=a.parent) if(!a.visible) v=false; if(!v) return;
      const pos=o.geometry.attributes.position;
      let kx=1e9,gx=-1e9,ky=1e9,gy=-1e9,kz=1e9,gz=-1e9;
      for(let i=0;i<pos.count;i++){
        vek.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
        kx=Math.min(kx,vek.x); gx=Math.max(gx,vek.x); ky=Math.min(ky,vek.y);
        gy=Math.max(gy,vek.y); kz=Math.min(kz,vek.z); gz=Math.max(gz,vek.z);
      }
      if(ky<0.1) streifen.push({x:[+kx.toFixed(2),+gx.toFixed(2)],z:[+kz.toFixed(2),+gz.toFixed(2)]});
    });
    /* Kanten, an denen nach dem Kauf keine Wand mehr steht. Bei
       x -8 steht dauerhaft die Wand zwischen Verkauf und Lager,
       die gehoert nicht dazu. */
    const kanten=[{x:8.0,z0:-5.0,z1:5.0},{x:20.0,z0:-5.0,z1:5.0},
                  {z:-5.9,x0:11.0,x1:16.0},{z:1.9,x0:-18.0,x1:-10.0}];
    const treffer=[];
    for(const k of kanten)
      for(const s of streifen){
        const tr=k.x!==undefined
          ? (s.x[0]<k.x+0.3&&s.x[1]>k.x-0.3&&s.z[0]<k.z1&&s.z[1]>k.z0)
          : (s.z[0]<k.z+0.3&&s.z[1]>k.z-0.3&&s.x[0]<k.x1&&s.x[1]>k.x0);
        if(tr) treffer.push(`${k.x!==undefined?'x='+k.x:'z='+k.z} <- Streifen x[${s.x}] z[${s.z}]`);
      }
    return {n:streifen.length,treffer};
  });
  sag(`kein Bodenschatten an offenen Kanten (${ao.n} Streifen gesamt)`,ao.treffer.length===0);
  ao.treffer.forEach(t=>console.log('   '+t));

  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):(bad?`ERRORS: ${bad} Punkte`:'ERRORS: keine'));
  await b.close();
})();

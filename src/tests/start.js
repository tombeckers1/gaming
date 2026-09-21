/* Wie der Laden am ersten Tag aussieht - ohne jeden Ausbau */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1180,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  /* Nichts aus der Stadt darf im Spielbereich stehen. Zwei Kraene
     standen im Nullpunkt, also mitten im Laden: buildKran hat das
     verschmolzene Gitter an die Szene gehaengt statt an die Gruppe.
     Eine Huellquader-Pruefung hilft hier nicht - die Stadtringe sind
     ein einziges Mesh rund um den Horizont, ihr Huellquader umschliesst
     den Laden zwangslaeufig. Also wird jeder Eckpunkt einzeln gefragt. */
  console.log('STADT-ABSTAND',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb, o={meshes:0,punkte:0,treffer:0,wo:[]};
    const S={x0:-70,x1:95,z0:-32,z1:16};
    bb.scene.traverse(m=>{
      if(!m.userData||!m.userData.stadt||!m.isMesh) return;
      const a=m.geometry&&m.geometry.attributes&&m.geometry.attributes.position;
      if(!a||!a.count) return;
      o.meshes++; o.punkte+=a.count;
      for(let i=0;i<a.count;i++){
        const x=a.array[i*3]+m.position.x, z=a.array[i*3+2]+m.position.z;
        if(x>S.x0&&x<S.x1&&z>S.z0&&z<S.z1){
          o.treffer++;
          if(o.wo.length<5) o.wo.push(`${x.toFixed(1)}/${z.toFixed(1)}`);
        }
      }
    });
    return o;
  })));
  const B=[
    ['a-laden-ost',      2.0,  1.0, -Math.PI/2, -0.02],
    ['b-laden-mitte',   -2.5,  1.5, -Math.PI/2,  0.02],
    ['c-laden-sued',     0.0,  3.0,  0.0,        0.0 ],
    ['d-lager-sued',   -14.0, -2.0,  0.0,        0.02],
    ['e-lager-nord',   -14.0, -2.0,  Math.PI,    0.02],
    ['f-vor-dem-laden',  0.0, 11.0,  Math.PI,    0.04],
    ['g-himmel',         0.0,  1.5, -Math.PI/2,  0.9 ]
  ];
  for(const [n,x,z,yaw,pit] of B){
    await p.evaluate(v=>window.__bb.setView(v[0],v[1],v[2],v[3]),[x,z,yaw,pit]);
    const d=await p.evaluate(()=>{ window.__bb.clock=760; return window.__bb.shot(); });
    fs.writeFileSync('/tmp/start-'+n+'.jpg',Buffer.from(d.split(',')[1],'base64'));
  }
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'ERRORS: keine');
  await b.close();
})();

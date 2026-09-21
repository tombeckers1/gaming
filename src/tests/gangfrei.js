const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  console.log(await p.evaluate(()=>{
    const bb=window.__bb, G=bb.GANG;
    /* Luftraum des Gangs, ohne die Waende selbst */
    const R={x0:G.x0+0.15,x1:G.x1-0.15,z0:G.z0+0.15,z1:G.z1-0.15,y1:G.h-0.1};
    const treffer=[];
    const v=new THREE.Vector3();
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.geometry) return;
      const pos=o.geometry.attributes&&o.geometry.attributes.position; if(!pos) return;
      let n=0, kx=1e9,gx=-1e9,ky=1e9,gy=-1e9,kz=1e9,gz=-1e9;
      for(let i=0;i<pos.count;i++){
        v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
        if(v.x>R.x0&&v.x<R.x1&&v.z>R.z0&&v.z<R.z1&&v.y>0.12&&v.y<R.y1){
          n++; kx=Math.min(kx,v.x); gx=Math.max(gx,v.x);
          ky=Math.min(ky,v.y); gy=Math.max(gy,v.y);
          kz=Math.min(kz,v.z); gz=Math.max(gz,v.z);
        }
      }
      if(n) treffer.push({v:n,x:[+kx.toFixed(2),+gx.toFixed(2)],
        y:[+ky.toFixed(2),+gy.toFixed(2)],z:[+kz.toFixed(2),+gz.toFixed(2)],
        n:o.name||(o.geometry.type+'/'+pos.count+'V')});
    });
    treffer.sort((a,b)=>b.v-a.v);
    return JSON.stringify(treffer.slice(0,14),null,1);
  }));
  await b.close();
})();

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
  /* Leere Hallen muessen leer sein. Beim Vergroessern der Karte sind
     schon einmal Masten, ein Container und Schneehaufen in einem
     Gebaeude gelandet, weil ihre Koordinaten fest verdrahtet waren. */
  const raeume=[['Grosshandel','lwest',11.5],['Schleuse','schleuse',3.1],['Lagergang',null,2.6]];
  let schlimm=0;
  for(const [name,key,ymax] of raeume){
  const treffer=await p.evaluate(v=>{
    const bb=window.__bb, L=v.key?bb.LAY[v.key]:bb.GANG;
    const R={x0:L.x0+0.4,x1:L.x1-0.4,z0:L.z0+0.4,z1:L.z1-0.4,y0:0.15,y1:v.ymax};
    const out=[], vek=new THREE.Vector3();
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.geometry) return;
      /* Gewollte Einrichtung und die Baustellen-Vorschau ueberspringen */
      for(let a=o;a;a=a.parent) if(a.userData&&(a.userData.inventar||a.userData.vorschau)) return;
      const pos=o.geometry.attributes&&o.geometry.attributes.position; if(!pos) return;
      let n=0,kx=1e9,gx=-1e9,ky=1e9,gy=-1e9,kz=1e9,gz=-1e9;
      for(let i=0;i<pos.count;i++){
        vek.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
        if(vek.x>R.x0&&vek.x<R.x1&&vek.z>R.z0&&vek.z<R.z1&&vek.y>R.y0&&vek.y<R.y1){
          n++; kx=Math.min(kx,vek.x); gx=Math.max(gx,vek.x); ky=Math.min(ky,vek.y);
          gy=Math.max(gy,vek.y); kz=Math.min(kz,vek.z); gz=Math.max(gz,vek.z); }
      }
      if(n>3) out.push({n,x:[+kx.toFixed(1),+gx.toFixed(1)],y:[+ky.toFixed(1),+gy.toFixed(1)],
        z:[+kz.toFixed(1),+gz.toFixed(1)],t:o.geometry.type,c:o.material&&o.material.color?'#'+o.material.color.getHexString():''});
    });
    out.sort((a,b)=>b.n-a.n);
    return out.slice(0,10).map(e=>
      `      ${String(e.n).padStart(6)} V  x[${e.x}]  y[${e.y}]  z[${e.z}]  ${e.t} ${e.c}`).join('\n');
  },{key,ymax});
  console.log(treffer?`${name}: steht etwas drin\n${treffer}`:`${name}: leer`);
  if(treffer) schlimm++;
  }
  console.log(schlimm?`ERRORS: in ${schlimm} Raum/Raeumen steht etwas`:'ERRORS: keine');
  await b.close();
})();

/* Autos (Tom, 26.09.: "deutlich schoener und echter"). Gemessen am Modell:
   - Material: Lack mit Klarlack und Umgebungsspiegelung, eigenes Glas
   - glatt: Anteil der Lack-Ecken mit gemittelter statt Flaechennormale
     (facettiert = 0)
   - Grundriss: die Nase ist schmaler als die Wagenmitte (keine Kiste)
   - Haube: faellt zur Nase ab
   - Scheinwerfer: sitzen vorn an der Oberflaeche, nicht in der Nase */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, out=[];
    for(const f of Object.keys(bb.AUTOFORM)){ const F=bb.AUTOFORM[f], g=bb.makeAuto(0xc9ccd2,f);
      const [lack,gummi,glas,chrom]=g.children, o={f};
      o.klarlack=!!(lack.material.clearcoat>0&&lack.material.envMap);
      o.glas=!!(glas&&glas.material!==lack.material&&glas.material.envMap&&glas.material.roughness<0.1);
      const pa=lack.geometry.attributes.position, no=lack.geometry.attributes.normal;
      let glatt=0; const a=new THREE.Vector3(), b2=new THREE.Vector3(), c=new THREE.Vector3(), fn=new THREE.Vector3(), nn=new THREE.Vector3();
      /* nur die Karosserie: ihre Streifen laufen ueber die ganze Breite,
         Anbauteile sind klein und fuer sich ohnehin rund */
      let zaehl=0;
      for(let i=0;i+2<pa.count;i+=3){ a.fromBufferAttribute(pa,i); b2.fromBufferAttribute(pa,i+1); c.fromBufferAttribute(pa,i+2);
        if(Math.max(a.distanceTo(b2),b2.distanceTo(c),c.distanceTo(a))<1.2) continue;
        fn.subVectors(b2,a).cross(c.clone().sub(a)).normalize();
        for(let k=0;k<3;k++){ zaehl++; nn.fromBufferAttribute(no,i+k); if(nn.dot(fn)<0.9995) glatt++; } }
      o.glatt=+(glatt/Math.max(1,zaehl)).toFixed(2);
      /* nur die Flanke unter der Guertellinie zaehlt - Spiegel und
         Saeulen sitzen hoeher */
      const gurt=F.H*(F.stufe?0.655:0.640);
      let zMax=-9, xMitte=0, xNase=0, yNase=-9;
      for(let i=0;i<pa.count;i++){ const x=Math.abs(pa.getX(i)), y=pa.getY(i), z=pa.getZ(i); if(y<gurt-0.1) zMax=Math.max(zMax,z);
        if(y<gurt-0.1&&Math.abs(z)<1.6) xMitte=Math.max(xMitte,x); }
      for(let i=0;i<pa.count;i++){ const x=Math.abs(pa.getX(i)), y=pa.getY(i), z=pa.getZ(i);
        if(z>zMax-0.1&&y<gurt-0.1) xNase=Math.max(xNase,x); if(z>zMax-0.3&&z<zMax-0.12) yNase=Math.max(yNase,y); }
      o.nase=+(xNase/xMitte).toFixed(2); o.haube=+(gurt+0.02-yNase).toFixed(2);
      /* Scheinwerferglas: vorderster Punkt im Glas-/Chromteil gegen die Nase */
      let zLicht=-9; for(const m of [glas,chrom]){ const q=m.geometry.attributes.position; for(let i=0;i<q.count;i++) if(q.getY(i)<F.H*0.6&&q.getY(i)>0.3) zLicht=Math.max(zLicht,q.getZ(i)); }
      o.licht=+(zMax-zLicht).toFixed(3);
      out.push(o); }
    return out; });
  r.forEach(o=>console.log('AUTO',JSON.stringify(o)));
  r.forEach(o=>{
    pruef('MATERIAL',o.klarlack&&o.glas,o.f+': Lack oder Glas ohne Spiegelung');
    pruef('GLATT',o.glatt>=0.4,o.f+': nur '+o.glatt+' glatte Ecken - facettiert');
    pruef('GRUNDRISS',o.nase<=0.96,o.f+': Nase so breit wie die Mitte ('+o.nase+')');
    pruef('HAUBE',o.haube>=0.04,o.f+': Haube faellt nicht ab ('+o.haube+')');
    pruef('SCHEINWERFER',o.licht<=0.05,o.f+': Scheinwerfer '+o.licht+' m hinter der Nase');
  });
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

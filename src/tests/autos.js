/* Autos (Tom, 26.09.: "deutlich schoener und echter"; 03.10.: neu gebaut,
   "Reifen sehen kacke aus, Kruemmungen drin"). Gemessen am Modell:
   - Facetten: 95 %-Wert der Abweichung Ecken- zu Flaechennormale auf der
     Karosseriehaut <= 20 Grad; keine verdrehten Normalen
   - Masse: Laenge/Breite/Hoehe wie AUTOFORM; Reifen steht auf y=0
   - Leistung: hoechstens 12 Zeichenaufrufe und 25 000 Dreiecke je Auto
   - Material: Lack mit Klarlack und Umgebungsspiegelung, eigenes Glas
   - glatt: Anteil der Lack-Ecken mit gemittelter statt Flaechennormale
     (facettiert = 0)
   - Grundriss: die Nase ist schmaler als die Wagenmitte (keine Kiste)
   - Haube: faellt zur Nase ab
   - Scheinwerfer: sitzen vorn an der Oberflaeche, nicht in der Nase */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000});
  await p.click('#startBtns button:last-child',{timeout:900000});
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:900000});
  await p.click('#nameGo',{timeout:900000,noWaitAfter:true});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:900000});
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
      let glatt=0, zaehl=0, verdreht=0, ecken=0; const a=new THREE.Vector3(), b2=new THREE.Vector3(), c=new THREE.Vector3(), fn=new THREE.Vector3(), nn=new THREE.Vector3();
      /* gemittelte Normalen im Lack (facettiert = 0) und verdrehte
         Normalen (zeigen gegen die Dreiecksflaeche) in allen Teilen */
      for(const m of [lack,gummi,glas,chrom]){ const q=m.geometry.attributes.position, qn=m.geometry.attributes.normal;
        for(let i=0;i+2<q.count;i+=3){ a.fromBufferAttribute(q,i); b2.fromBufferAttribute(q,i+1); c.fromBufferAttribute(q,i+2);
          fn.subVectors(b2,a).cross(c.clone().sub(a)); if(fn.length()<1e-9) continue; fn.normalize();
          for(let k=0;k<3;k++){ nn.fromBufferAttribute(qn,i+k); const d=nn.dot(fn); ecken++; if(d<0) verdreht++; if(m===lack){ zaehl++; if(d<0.9995) glatt++; } } } }
      o.glatt=+(glatt/Math.max(1,zaehl)).toFixed(2); o.verdreht=+(verdreht/Math.max(1,ecken)*100).toFixed(2);
      /* Facetten: auf der Karosseriehaut weicht die Eckennormale kaum von
         der Dreiecksflaeche ab, wenn das Raster fein genug ist (95 %-Wert) */
      { const h=g.userData.haut, hp=h.attributes.position, hn=h.attributes.normal, ix=h.index.array, w=[];
        for(let t=0;t<ix.length;t+=3){ a.fromBufferAttribute(hp,ix[t]); b2.fromBufferAttribute(hp,ix[t+1]); c.fromBufferAttribute(hp,ix[t+2]);
          fn.subVectors(b2,a).cross(c.clone().sub(a)); if(fn.length()<2e-6) continue; fn.normalize();
          for(let k=0;k<3;k++){ nn.fromBufferAttribute(hn,ix[t+k]); w.push(Math.acos(Math.min(1,Math.max(-1,nn.dot(fn))))*180/Math.PI); } }
        w.sort((x,y)=>x-y); o.facette=+w[Math.floor(w.length*0.95)].toFixed(1); }
      /* Masse der Karosserie unterhalb der Guertellinie (ohne Spiegel) */
      { let xm=0, z0=9, z1=-9; const gurt=F.H*(F.stufe?0.655:0.640); for(let i=0;i<pa.count;i++) if(pa.getY(i)<gurt-0.1){ xm=Math.max(xm,Math.abs(pa.getX(i))); z0=Math.min(z0,pa.getZ(i)); z1=Math.max(z1,pa.getZ(i)); }
        const bx=new THREE.Box3().setFromObject(lack); o.L=+(z1-z0).toFixed(3); o.B=+(2*xm).toFixed(3); o.H=+bx.max.y.toFixed(3); }
      /* Raeder: Reifen steht auf dem Boden (nicht schwebend, nicht
         eingesunken) und bleibt innerhalb der Karosseriebreite */
      { const q=gummi.geometry.attributes.position; let ymin=9, xr=0; for(let i=0;i<q.count;i++){ const y=q.getY(i); ymin=Math.min(ymin,y); if(y<F.rad*0.5) xr=Math.max(xr,Math.abs(q.getX(i))); }
        o.reifenY=+ymin.toFixed(4); o.reifenX=+xr.toFixed(3); }
      o.soll=[F.L,F.B,F.H]; o.dc=g.children.length; o.tri=g.children.reduce((s,m)=>s+m.geometry.attributes.position.count/3,0);
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
    pruef('FACETTEN',o.facette<=20,o.f+': Karosserie facettiert ('+o.facette+' Grad)');
    pruef('NORMALEN',o.verdreht<0.5,o.f+': '+o.verdreht+' % verdrehte Normalen');
    pruef('MASSE',Math.abs(o.L-o.soll[0])<0.05&&Math.abs(o.B-o.soll[1])<0.05&&Math.abs(o.H-o.soll[2])<0.06,o.f+': Masse '+o.L+'/'+o.B+'/'+o.H+' statt '+o.soll.join('/'));
    pruef('RAD',o.reifenY>=-0.001&&o.reifenY<=0.002&&o.reifenX<=o.soll[1]/2,o.f+': Reifen Unterkante '+o.reifenY+' m, aussen '+o.reifenX+' m');
    pruef('LEISTUNG',o.dc<=12&&o.tri<=25000,o.f+': '+o.dc+' Zeichenaufrufe, '+o.tri+' Dreiecke');
    pruef('GRUNDRISS',o.nase<=0.96,o.f+': Nase so breit wie die Mitte ('+o.nase+')');
    pruef('HAUBE',o.haube>=0.04,o.f+': Haube faellt nicht ab ('+o.haube+')');
    pruef('SCHEINWERFER',o.licht<=0.05,o.f+': Scheinwerfer '+o.licht+' m hinter der Nase');
  });
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

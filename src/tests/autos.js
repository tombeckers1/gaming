/* Autos (Tom, 26.09.: "deutlich schoener und echter"; 03.10.: "Reifen sehen kacke aus"; 17.10.: "immer noch nicht
   realistisch genug - die Form und so"). Seit 17.10. Baukasten bk.auto / bk.autos (04z, docs/fundament/autos.md).
   Gemessen am Modell je Form (klein, kompakt, limo, kombi, suv, van):
   - MASSE: Laenge/Breite (ohne Spiegel)/Hoehe wie bk.AUTO (echte Fahrzeugdaten), Toleranz 3 cm
   - RAD: Reifen steht auf y = 0 (eingefedert, unten abgeplattet), Spur wie bk.AUTO
   - MATERIAL: Lack mit Klarlack und Umgebungsspiegelung, eigenes Glas
   - NORMALEN: keine verdrehten Normalen (< 0,5 %)
   - GRUNDRISS: die Nase ist schmaler als die Wagenmitte; Kabine oben schmaler als unten (Tumblehome)
   - SCHEINWERFER: sitzen vorn an der Oberflaeche (hoechstens 5 cm hinter der Nase)
   - LEISTUNG: je Auto hoechstens 6 Zeichenaufrufe und 22 000 Dreiecke (fein), grob hoechstens 2 / 1 500
   - REIHE: bk.autos legt 7 Autos zu hoechstens 6 Meshes je Stufe zusammen (LOD nah/fern), Geometrie je Form gecacht
   - FARBEN: Lackverteilung wie bk.AUTOFARBEN (VDA/KBA: Grau/Silber, Schwarz, Weiss vorn) */
const path=require('path');
const H=require(path.join(__dirname,'../../tools/test/start-hilfe.js'));
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await H.laden(p,process.argv[2]); await H.neuesSpiel(p,{stoppen:true});
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, bk=bb.bk, out=[];
    const kl=(g,k)=>{ let m=null; g.traverse(o=>{ if(o.isMesh&&o.userData.klasse===k&&!m) m=o; }); return m; };
    for(const f of Object.keys(bk.AUTO)){ const F=bk.AUTO[f], g=bk.auto({form:f,farbe:'autoSilber',detail:'fein'}), o={f};
      const lack=kl(g,'lack'), glas=kl(g,'glas'), dunkel=kl(g,'dunkel'), chrom=kl(g,'chrom');
      o.klarlack=!!(lack.material.clearcoat>0&&lack.material.envMap); o.glas=!!(glas&&glas.material!==lack.material&&glas.material.envMap);
      /* verdrehte Normalen: Ecknormale gegen die Dreiecksflaeche */
      let ecken=0, verdreht=0; const a=new THREE.Vector3(), b2=new THREE.Vector3(), c=new THREE.Vector3(), fn=new THREE.Vector3(), nn=new THREE.Vector3();
      for(const m of [lack,glas,dunkel,chrom]){ const q=m.geometry.attributes.position, qn=m.geometry.attributes.normal;
        for(let i=0;i+2<q.count;i+=3){ a.fromBufferAttribute(q,i); b2.fromBufferAttribute(q,i+1); c.fromBufferAttribute(q,i+2);
          fn.subVectors(b2,a).cross(c.clone().sub(a)); if(fn.length()<1e-9) continue; fn.normalize();
          for(let k=0;k<3;k++){ nn.fromBufferAttribute(qn,i+k); ecken++; if(nn.dot(fn)<-0.05) verdreht++; } } }
      o.verdreht=+(verdreht/Math.max(1,ecken)*100).toFixed(2);
      /* Masse am Lack: Laenge/Breite unter der Guertellinie (ohne Spiegel), Hoehe gesamt */
      const pa=lack.geometry.attributes.position, gu=Math.min(F.gurt[0],F.gurt[1])-0.13; let xm=0, z0=9, z1=-9, ym=0, xN=0, xM=0, xU=0, xO=0;
      for(let i=0;i<pa.count;i++){ const x=Math.abs(pa.getX(i)), y=pa.getY(i), z=pa.getZ(i); ym=Math.max(ym,y);
        if(y<gu){ xm=Math.max(xm,x); z0=Math.min(z0,z); z1=Math.max(z1,z); } }
      for(let i=0;i<pa.count;i++){ const x=Math.abs(pa.getX(i)), y=pa.getY(i), z=pa.getZ(i);
        if(y<gu&&y>F.yS+0.1){ if(z>z1-0.08) xN=Math.max(xN,x); if(Math.abs(z)<0.5) xM=Math.max(xM,x); }
        if(Math.abs(z-(F.L/2-F.dach[1][0]))<0.3){ if(Math.abs(y-(F.gurt[0]+0.06))<0.03) xU=Math.max(xU,x); if(Math.abs(y-(F.H-0.12))<0.03) xO=Math.max(xO,x); } }
      o.L=+(z1-z0).toFixed(3); o.B=+(2*xm).toFixed(3); o.H=+ym.toFixed(3); o.soll=[F.L,F.B,F.H];
      o.nase=+(xN/xM).toFixed(3); o.tumble=+(xO/Math.max(1e-6,xU)).toFixed(3);
      /* Reifen (Teile mit UV): Unterkante und Spur */
      { const q=dunkel.geometry.attributes.position, uv=dunkel.geometry.attributes.uv; let ymin=9, xr=0, xl=9;
        for(let i=0;i<q.count;i++){ if(uv.getX(i)===0&&uv.getY(i)===0) continue; const y=q.getY(i); ymin=Math.min(ymin,y); if(y<0.05){ xr=Math.max(xr,Math.abs(q.getX(i))); xl=Math.min(xl,Math.abs(q.getX(i))); } }
        o.reifenY=+ymin.toFixed(4); o.spur=+(xr+xl).toFixed(3); o.spurSoll=F.spur; }
      /* Scheinwerfer: vorderster Punkt im Chrom (Reflektor) zwischen Stossfaenger und Haube gegen die Nase */
      { const q=chrom.geometry.attributes.position; let zl=-9; for(let i=0;i<q.count;i++){ const y=q.getY(i); if(y>F.nase&&y<F.haube[1]) zl=Math.max(zl,q.getZ(i)); } o.licht=+(z1-zl).toFixed(3); }
      let tri=0, dc=0; g.traverse(m=>{ if(m.isMesh){ dc++; tri+=m.geometry.attributes.position.count/3; } }); o.dc=dc; o.tri=Math.round(tri);
      const gr=bk.auto({form:f,farbe:'autoSilber',detail:'grob'}); let tg=0, dg=0; gr.traverse(m=>{ if(m.isMesh){ dg++; tg+=m.geometry.attributes.position.count/3; } }); o.grobDc=dg; o.grobTri=Math.round(tg);
      out.push(o); }
    /* Reihe: 7 Autos, LOD, Cache */
    const L=[]; for(let i=0;i<7;i++) L.push({form:Object.keys(bk.AUTO)[i%6],farbe:bk.autoFarbe(),x:i*6,z:0,ry:Math.PI/2,licht:i===2});
    const vor=Object.keys(bk.autoInfo()).length, R=bk.autos(L,{lod:true}), nach=Object.keys(bk.autoInfo()).length;
    const stufen=R.levels?R.levels.map(l=>{ let n=0; l.object.traverse(m=>{ if(m.isMesh) n++; }); return n; }):[];
    /* Farben: Verteilung */
    const zahl={}; for(let i=0;i<20000;i++){ const t=bk.autoFarbe(); zahl[t]=(zahl[t]||0)+1; }
    const summe=bk.AUTOFARBEN.reduce((s,f)=>s+f[1],0), farbe=bk.AUTOFARBEN.map(([t,w])=>[t,+(w/summe).toFixed(3),+((zahl[t]||0)/20000).toFixed(3)]);
    return {out,reihe:{lod:!!R.isLOD,stufen,cacheNeu:nach-vor},farbe}; });
  r.out.forEach(o=>console.log('AUTO',JSON.stringify(o)));
  console.log('REIHE',JSON.stringify(r.reihe)); console.log('FARBEN',JSON.stringify(r.farbe));
  r.out.forEach(o=>{
    pruef('MATERIAL',o.klarlack&&o.glas,o.f+': Lack oder Glas ohne Spiegelung');
    pruef('NORMALEN',o.verdreht<0.5,o.f+': '+o.verdreht+' % verdrehte Normalen');
    pruef('MASSE',Math.abs(o.L-o.soll[0])<0.03&&Math.abs(o.B-o.soll[1])<0.03&&Math.abs(o.H-o.soll[2])<0.03,o.f+': Masse '+o.L+'/'+o.B+'/'+o.H+' statt '+o.soll.join('/'));
    pruef('RAD',o.reifenY>=-0.0005&&o.reifenY<=0.002&&Math.abs(o.spur-o.spurSoll)<0.03,o.f+': Reifen Unterkante '+o.reifenY+' m, Spur '+o.spur+' statt '+o.spurSoll);
    pruef('GRUNDRISS',o.nase<=0.97&&o.tumble<=0.9,o.f+': Nase/Mitte '+o.nase+', Kabine oben/unten '+o.tumble);
    pruef('SCHEINWERFER',o.licht<=0.05,o.f+': Scheinwerfer '+o.licht+' m hinter der Nase');
    pruef('LEISTUNG',o.dc<=6&&o.tri<=22000&&o.grobDc<=2&&o.grobTri<=1500,o.f+': fein '+o.dc+' Aufrufe/'+o.tri+' Dreiecke, grob '+o.grobDc+'/'+o.grobTri);
  });
  pruef('REIHE',r.reihe.lod&&r.reihe.stufen.length===2&&r.reihe.stufen.every(n=>n<=6)&&r.reihe.cacheNeu===0,JSON.stringify(r.reihe));
  pruef('FARBEN',r.farbe.every(([t,s,i])=>Math.abs(s-i)<0.02),JSON.stringify(r.farbe));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log(errs.length||mangel.length?'ERRORS: '+errs.concat(mangel).join('\n'):'ALLES OK');
  await b.close();
})();

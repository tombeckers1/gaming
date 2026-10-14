// Messung Halle Etappe A (14.10.): Zeichenaufrufe, Dreiecke, Texturspeicher je Grafikstufe und Ansicht.
// node -r tools/test/ladezeit-preload.js tools/halle/messen.js <real.html> <ausgabe.json> [stufen=ultralow,niedrig,hoch,max]
// Alle Ausbauten gekauft (wie tools/fundament/messen3.js), Spielschleife aus, je Ansicht 3 Bilder, das dritte zaehlt.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'../test/start-hilfe.js'));
(async()=>{
  const html=process.argv[2], out=process.argv[3], stufen=(process.argv[4]||'ultralow,niedrig,hoch,max').split(',');
  const V={laden:[0,3,0,0],lager:[-14,-2,0,0],halleW:[-46,-10,0,0],hochregal:[-43.2,-25.6,Math.PI/2,0.1],wareneingang:[-30,-24,Math.PI*0.75,-0.1],lager3:[-21,-12,Math.PI/2,0],schleuse:[-16,-23,Math.PI/2*1.05,0],dockHof:[-27,3,-Math.PI/2,0],strasse:[0,12,Math.PI,0.05]};
  const res={};
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:960,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await H.laden(p,html);
  for(const g of stufen){
    await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },g);
    await H.neuladen(p); await H.neuesSpiel(p,{stoppen:true});
    res[g]=await p.evaluate(V=>{ const bb=window.__bb, R=bb.renderer;
      bb.S.level=99; bb.S.money=9e6; for(const u of bb.UPGRADES) if(!u.geplant) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.run(2,0.05);
      const o={ansichten:{}};
      for(const k in V){ const v=V[k]; bb.setView(v[0],v[1],v[2],v[3]); bb.clock=600; bb.run(0.2,0.05); bb.clock=600; bb.applyTOD();
        for(let i=0;i<3;i++){ bb.kameraSetzen(); bb.renderFrame(0.016); }
        o.ansichten[k]={calls:R.info.render.calls,tris:R.info.render.triangles}; }
      /* Texturspeicher: alle Texturen im Szenengraf (Breite x Hoehe x 4 Byte, Mipmaps +1/3) */
      const T=new Set(); bb.scene.traverse(x=>{ if(!x.material) return; for(const m of [].concat(x.material)) if(m) for(const k of ['map','emissiveMap','alphaMap','normalMap','bumpMap','roughnessMap']) if(m[k]) T.add(m[k]); });
      let by=0; for(const t of T){ const im=t.image; if(im&&im.width) by+=im.width*im.height*4*(t.generateMipmaps!==false?4/3:1); }
      o.texturen=T.size; o.texMB=Math.round(by/1048576*10)/10; o.speicher=R.info.memory;
      let me=0; bb.scene.traverse(x=>{ if(x.isMesh) me++; }); o.meshes=me;
      o.ll=typeof bb.llOffen==='function'?bb.llOffen():null;
      return o; },V);
    console.log(g,JSON.stringify(res[g]));
  }
  res.fehler=errs.slice(0,5);
  fs.writeFileSync(out,JSON.stringify(res,null,1));
  console.log('fertig',errs.length);
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

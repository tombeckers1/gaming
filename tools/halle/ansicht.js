// Aufruf mit node -r tools/test/ladezeit-preload.js (Fristen). Freie Ansichten fuer die Halle (Etappe A, 14.10.): node tools/halle/ansicht.js <real.html> <ordner> [gfx]
// ANSICHTEN='{"name":{"p":[x,y,z],"t":[x,y,z],"fov":60,"clip":10.9,"zeit":600,"w":1280,"h":800}}'
// Alle Ausbauten gekauft (Level 99). clip = alles oberhalb dieser Hoehe weg (Draufsicht ohne Dach).
// oben:1 = Draufsicht (Norden/Strasse unten, x nach rechts). VORBEREITUNG='js' oder VORBEREITUNG_DATEI=pfad wird nach dem Kauf im Spiel ausgefuehrt (z. B. Hochregal fuellen).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const html=process.argv[2], out=process.argv[3], gfx=process.argv[4]||'hoch';
  fs.mkdirSync(out,{recursive:true});
  const A=JSON.parse(process.env.ANSICHTEN||'{}');
  const W0=+(process.env.BREITE||1280), H0=+(process.env.HOEHE||800);
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:W0,height:H0}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const H=require(require('path').join(__dirname,'../test/start-hilfe.js'));
  await H.laden(p,html);
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },gfx);
  await H.neuladen(p); await H.neuesSpiel(p,{stoppen:true});
  await p.evaluate(v=>{ const bb=window.__bb; bb.S.level=99; for(const u of bb.UPGRADES) if(!u.geplant) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){ console.error(e); } bb.run(1,0.05);
    if(v) (0,eval)(v); },process.env.VORBEREITUNG_DATEI?fs.readFileSync(process.env.VORBEREITUNG_DATEI,'utf8'):(process.env.VORBEREITUNG||''));
  console.log('info',JSON.stringify(await p.evaluate(()=>window.__hrInfo||null)));
  if(process.env.LAUF) await p.evaluate(s=>{ window.__bb.run(+s,0.05); },process.env.LAUF);
  for(const k in A){ const v=A[k];
    const url=await p.evaluate(v=>{ const bb=window.__bb, cam=bb.camera, R=bb.renderer;
      if(bb.setPost) bb.setPost(false);
      bb.setView(v.p[0],v.p[2],0,0); bb.clock=v.zeit||600; bb.run(0.2,0.05); bb.clock=v.zeit||600; bb.applyTOD();
      bb.kameraSetzen();
      const f=()=>{ cam.position.set(v.p[0],v.p[1],v.p[2]); cam.fov=v.fov||60; cam.updateProjectionMatrix(); cam.up.set(0,v.oben?0:1,v.oben?-1:0); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); };
      R.clippingPlanes=v.clip?[new THREE.Plane(new THREE.Vector3(0,-1,0),v.clip)]:[];
      f(); bb.renderFrame(0.016); f(); bb.renderFrame(0.016);
      const u=R.domElement.toDataURL('image/jpeg',0.86); R.clippingPlanes=[]; cam.fov=60; cam.up.set(0,1,0); cam.updateProjectionMatrix(); return u; },v);
    fs.writeFileSync(out+'/'+k+'.jpg',Buffer.from(url.split(',')[1],'base64')); console.log('bild',k); }
  console.log('fertig',errs.length,errs.slice(0,3).join(' | '));
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

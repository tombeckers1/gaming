// Vorher/Nachher-Bilder und Zaehlung fuer den Schritt "Autos" (bk.auto, 17.10.).
//   node -r <arbeitsordner>/ladezeit-preload.js tools/fundament/autos-bilder.js <real.html> <ordner> <gfx> [bilder,zaehlen,modell] [tag]
// bilder:  je Form (klein, limo, kombi, suv, van) ein Auto allein auf der Fahrbahn (geparkte Autos ausgeblendet):
//          seite (Seitenprofil), vorn34 (3/4 von vorn), heck34 (3/4 von hinten); dazu die Strasse mit den geparkten Autos
//          (strasse, strasseNah) bei Tag und Nacht. -> <ordner>/<ansicht>-<gfx><tag>.jpg
// zaehlen: Zeichenaufrufe/Dreiecke je Strassenansicht (inkl. Schattenkarten und Bildeffekte, Mittel ueber 2 Bilder) und
//          nur die Autos (Meshes, Dreiecke, Zeichenaufrufe je Auto) -> <ordner>/zaehlen-<gfx><tag>.json
// modell:  Masse je Form aus der Geometrie (L/B/H, Radstand, Boden) -> Konsole
// Laden ohne Gameplay-Vorfuehrung (Autos stehen draussen, der Laden spielt keine Rolle). Zufall fest je Aufrufer.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'../test/start-hilfe.js'));
const FORMEN=['klein','limo','kombi','suv','van'];
const AX=62, AZ=13.0;                 /* Studio-Platz auf der Fahrbahn (Ost), Wagen faehrt nach +x */
const STUDIO={
  seite:{p:[AX,1.05,AZ-7.2],t:[AX,0.72,AZ]},
  vorn34:{p:[AX+5.0,1.45,AZ-4.0],t:[AX+0.3,0.7,AZ]},
  heck34:{p:[AX-5.0,1.55,AZ-3.8],t:[AX-0.3,0.75,AZ]}
};
const STRASSE={
  strasse:{p:[-3,1.65,9.6],t:[-16,0.8,16]},
  strasseNah:{p:[-9.5,1.4,12.6],t:[-14,0.7,16]}
};
(async()=>{
  const html=process.argv[2], out=process.argv[3], gfx=process.argv[4]||'hoch', modus=(process.argv[5]||'bilder,zaehlen').split(','), tag=process.argv[6]||'';
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:+(process.env.BREITE||1280),height:+(process.env.HOEHE||720)}});
  await p.addInitScript(()=>{ const Q=new Map(); const mk=seed=>{ let s=seed|0; return ()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; };
    const hash=str=>{ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h; };
    const RE=/at ([^\s(]+) \(/g;
    Math.random=function(){ const o=Error.stackTraceLimit; Error.stackTraceLimit=7; const st=new Error().stack; Error.stackTraceLimit=o;
      RE.lastIndex=0; let m, k='', n=0; RE.exec(st); while(n<2&&(m=RE.exec(st))){ k+=m[1]+'|'; n++; }
      let r=Q.get(k); if(!r){ r=mk(hash(k)); Q.set(k,r); } return r(); }; });
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await H.laden(p,html);
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },gfx);
  await H.neuladen(p); await H.neuesSpiel(p,{stoppen:true});
  await p.evaluate(()=>{ const bb=window.__bb; bb.stoppSchleife(); bb.run(2,0.05);
    /* geparkte Autos finden: alt userData.haut, neu userData.bauteil==='auto' */
    window.__autos=bb.scene.children.filter(c=>c.userData&&(c.userData.haut||c.userData.bauteil==='auto'));
    /* fahrende Autos (falls vorhanden) gehoeren dazu */
  });
  const ansicht=async(v,zeit,o)=>p.evaluate(({v,zeit,o})=>{ const bb=window.__bb, cam=bb.camera, R=bb.renderer;
      const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2], yaw=Math.atan2(-dx,-dz);
      bb.setView(v.p[0],v.p[2],yaw,0); bb.clock=zeit; bb.run(0.2,0.05); bb.clock=zeit; bb.applyTOD();
      const f=()=>{ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); };
      for(let i=0;i<3;i++){ f(); bb.renderFrame(0.05); }
      const r={};
      if(o.zaehlen){ let calls=0, tris=0; const NB=2;
        for(let i=0;i<NB;i++){ f(); R.info.autoReset=false; R.info.reset(); bb.renderFrame(0.05); calls+=R.info.render.calls; tris+=R.info.render.triangles; R.info.autoReset=true; }
        r.calls=Math.round(calls/NB); r.tris=Math.round(tris/NB); }
      if(o.bild) r.u=R.domElement.toDataURL('image/jpeg',0.9);
      return r; },{v,zeit,o});
  const speichern=(name,u)=>{ fs.writeFileSync(path.join(out,name+'-'+gfx+tag+'.jpg'),Buffer.from(u.split(',')[1],'base64')); console.log('bild',name); };
  const zaehl={};
  if(modus.includes('zaehlen')){
    for(const k in STRASSE){ const r=await ansicht(STRASSE[k],600,{zaehlen:true}); zaehl[k]=r; console.log('ZAEHLEN',k,JSON.stringify(r)); }
    zaehl.autos=await p.evaluate(()=>{ const A=window.__autos, o={n:A.length,meshes:0,tris:0,instanzen:0};
      for(const a of A) a.traverse(m=>{ if(!m.isMesh) return; o.meshes++; const g=m.geometry, t=(g.index?g.index.count:g.attributes.position.count)/3; o.tris+=Math.round(t*(m.isInstancedMesh?m.count:1)); if(m.isInstancedMesh) o.instanzen+=m.count; });
      o.trisJeAuto=Math.round(o.tris/Math.max(1,A.length)); o.meshesJeAuto=+(o.meshes/Math.max(1,A.length)).toFixed(1); return o; });
    /* Strasse ohne Autos: Anteil der Autos an Zeichenaufrufen/Dreiecken */
    await p.evaluate(()=>window.__autos.forEach(a=>a.visible=false));
    for(const k in STRASSE){ const r=await ansicht(STRASSE[k],600,{zaehlen:true}); zaehl[k+'OhneAutos']=r; }
    await p.evaluate(()=>window.__autos.forEach(a=>a.visible=true));
    console.log('ZAEHLEN autos',JSON.stringify(zaehl.autos));
    fs.writeFileSync(path.join(out,'zaehlen-'+gfx+tag+'.json'),JSON.stringify(zaehl,null,1));
  }
  if(modus.includes('modell')){
    const m=await p.evaluate(()=>{ const bb=window.__bb, o={};
      for(const f of Object.keys(bb.AUTOFORM)){ const g=bb.makeAuto(0xc9ccd2,f); g.updateMatrixWorld(true); const bx=new THREE.Box3().setFromObject(g);
        o[f]={L:+(bx.max.z-bx.min.z).toFixed(3),B:+(bx.max.x-bx.min.x).toFixed(3),H:+bx.max.y.toFixed(3),y0:+bx.min.y.toFixed(3)}; }
      return o; });
    console.log('MODELL',JSON.stringify(m));
  }
  if(modus.includes('bilder')){
    const NUR=process.env.NUR?process.env.NUR.split(','):null;
    for(const zeit of [['tag',600],['nacht',1320]]){
      if(!NUR||NUR.includes('strasse')) for(const k in STRASSE){ const r=await ansicht(STRASSE[k],zeit[1],{bild:true}); speichern(k+'-'+zeit[0],r.u); } }
    await p.evaluate(()=>window.__autos.forEach(a=>a.visible=false));
    const farben={klein:0x1f4a8a,limo:0x17191d,kombi:0xc9ccd2,suv:0x5b6068,van:0xeeeeec};
    for(const f of FORMEN){ if(NUR&&!NUR.includes(f)) continue;
      await p.evaluate(({f,c,AX,AZ})=>{ const bb=window.__bb; if(window.__studio){ bb.scene.remove(window.__studio); }
        const g=bb.makeAuto(c,f); g.position.set(AX,0,AZ); g.rotation.y=Math.PI/2; bb.scene.add(g); window.__studio=g; },{f,c:farben[f],AX,AZ});
      for(const k in STUDIO){ const r=await ansicht(STUDIO[k],600,{bild:true}); speichern(f+'-'+k,r.u); }
      if(f==='limo'||f==='suv'){ const r=await ansicht(STUDIO.vorn34,1320,{bild:true}); speichern(f+'-vorn34-nacht',r.u); const r2=await ansicht(STUDIO.heck34,1320,{bild:true}); speichern(f+'-heck34-nacht',r2.u); }
    }
  }
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

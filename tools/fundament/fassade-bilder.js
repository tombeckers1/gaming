// Vorher/Nachher-Bilder und Zaehlung fuer den Schritt "Fassade + Hoflampen" (Fundament-Schritt 2, 16.10.).
//   node -r <arbeitsordner>/ladezeit-preload.js tools/fundament/fassade-bilder.js <real.html> <ordner> <gfx> [bilder,zaehlen,wände] [tag]
// Laden wie im Spiel: Gameplay-Vorfuehrung aufgebaut, Vollausbau (alle Ausbauten ausser geplanten). Ansichten aussen je Tag (10:00)
// und Nacht (22:00). Bilder <ordner>/<ansicht>-<tag|nacht>-<gfx><tag>.jpg; Zaehlung <ordner>/zaehlen-<gfx><tag>.json:
// je Ansicht Zeichenaufrufe/Dreiecke (inkl. Schattenkarten und Bildeffekte, Mittel ueber 2 Bilder) und Texturspeicher (Summe
// Breite x Hoehe x 4 x 4/3 aller Texturen der sichtbaren Szene, MB) sowie renderer.info.memory.
// waende: listet die Aussenwaende (Material fassade/blech) mit Lage (Uebersicht fuer die Kameras).
// NUR=ansicht1,ansicht2 / ZEITEN=tag,nacht schraenken ein. Zufall fest je Aufrufer (wie einheit-bilder.js).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'../test/start-hilfe.js'));
/* Kameras: p = Auge, t = Ziel (Welt-Meter) */
const ANS={
  front:{p:[6,1.8,17],t:[-2,2.4,6]},                   /* Strasse: Ladenfront, Lagerfront, Sockel, Attika */
  frontOst:{p:[40,1.8,16],t:[24,2.6,6]},              /* Strasse Ost: Erweiterungen */
  hofR1:{p:[-30,1.8,6],t:[-20,2.0,-3]},               /* Hof R1: Lagerwand, Tor R1, Wandleuchten */
  hofPyro:{p:[0.5,1.7,-24],t:[-6,2.2,-10]},           /* Feuerwerkshof hinter dem Laden (Toms Foto): Wand, Mastleuchte */
  versandhof:{p:[-28,1.8,-57],t:[-44,3,-38]},         /* Versandhof / Halle Sued */
  hofWest:{p:[-70,1.8,-52],t:[-86,3,-38]},            /* Hof West / Werk */
  nah:{p:[-23.2,1.5,3.2],t:[-20.1,1.0,0.6]}            /* Wand nah: Paneele, Sockel */
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
  if(!process.env.OHNE_VORF){ await p.evaluate(()=>{ window.__bb.gpStart(); });
    await H.stuecke(p,(st,aus)=>{ const bb=window.__bb; let n=0; while(!bb.gpFertig&&!aus()){ bb.gpBauSchritt(50); n++; } return {fertig:bb.gpFertig,info:n}; },{name:'Vorfuehrung'}); }
  await p.evaluate(()=>{ const bb=window.__bb; bb.stoppSchleife(); bb.S.level=99; for(const u of bb.UPGRADES) if(!u.geplant) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.run(4,0.05); });
  if(modus.includes('waende')){
    const w=await p.evaluate(()=>{ const bb=window.__bb, o=[]; bb.scene.traverse(m=>{ const f=m.userData&&m.userData.flaechen; if(!f) return;
      const a=f.map(x=>x&&x.userData&&x.userData.mat).filter(Boolean).filter(n=>/wandFassade|wandBlech/.test(n)); if(!a.length) return;
      const bx=new THREE.Box3().setFromObject(m); o.push([a[0].replace('get:wand',''),+bx.min.x.toFixed(1),+bx.max.x.toFixed(1),+bx.min.z.toFixed(1),+bx.max.z.toFixed(1),+bx.min.y.toFixed(1),+bx.max.y.toFixed(1)]); });
      return o; });
    fs.writeFileSync(path.join(out,'waende.json'),JSON.stringify(w)); console.log('WAENDE',w.length); }
  const NUR=process.env.NUR?process.env.NUR.split(','):null, ZEITEN=process.env.ZEITEN?process.env.ZEITEN.split(','):['tag','nacht'];
  const zaehl={};
  for(const zeit of [['tag',600],['nacht',1320]].filter(z=>ZEITEN.includes(z[0]))) for(const k in ANS){ if(NUR&&!NUR.includes(k)) continue; const v=ANS[k];
    const r=await p.evaluate(({v,zeit,mod})=>{ const bb=window.__bb, cam=bb.camera, R=bb.renderer;
      const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2], yaw=Math.atan2(-dx,-dz);
      bb.setView(v.p[0],v.p[2],yaw,0); bb.clock=zeit; bb.run(0.4,0.05); bb.clock=zeit; bb.applyTOD();
      const f=()=>{ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); };
      for(let i=0;i<3;i++){ f(); bb.renderFrame(0.05); }
      const o={};
      if(mod.includes('zaehlen')){ let calls=0, tris=0; const NB=2;
        for(let i=0;i<NB;i++){ f(); R.info.autoReset=false; R.info.reset(); bb.renderFrame(0.05); calls+=R.info.render.calls; tris+=R.info.render.triangles; R.info.autoReset=true; }
        o.calls=Math.round(calls/NB); o.tris=Math.round(tris/NB); }
      if(mod.includes('bilder')) o.u=R.domElement.toDataURL('image/jpeg',0.88);
      return o; },{v,zeit:zeit[1],mod:modus});
    const name=k+'-'+zeit[0]+'-'+gfx+tag;
    if(r.u){ fs.writeFileSync(path.join(out,name+'.jpg'),Buffer.from(r.u.split(',')[1],'base64')); delete r.u; }
    zaehl[k+'-'+zeit[0]]=r; console.log('ansicht',name,JSON.stringify(r)); }
  if(modus.includes('zaehlen')){
    zaehl._graf=await p.evaluate(()=>{ const bb=window.__bb; let meshes=0; const mats=new Set(), tex=new Set();
      bb.scene.traverse(o=>{ if(o.isMesh){ meshes++; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(!m) return; mats.add(m);
        for(const s of ['map','emissiveMap','normalMap','bumpMap','roughnessMap','alphaMap','lightMap','aoMap']) if(m[s]) tex.add(m[s]); }); } });
      let byte=0; for(const t of tex){ const im=t.image; if(im&&im.width) byte+=im.width*im.height*4*(t.generateMipmaps===false?1:4/3); }
      return {meshes,materialien:mats.size,texturen:tex.size,texturMB:+(byte/1048576).toFixed(1),gpuTexturen:bb.renderer.info.memory.textures,gpuGeometrien:bb.renderer.info.memory.geometries}; });
    console.log('GRAF',JSON.stringify(zaehl._graf));
    fs.writeFileSync(path.join(out,'zaehlen-'+gfx+tag+'.json'),JSON.stringify(zaehl,null,1)); }
  console.log('fertig',errs.length,errs.slice(0,3).join(' | '));
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

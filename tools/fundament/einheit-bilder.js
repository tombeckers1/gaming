// Vorher/Nachher-Bilder und Zaehlung fuer den Schritt "Einheit" (Regale, Kassen, Fenster, Tueren, Schilder, Bodenmarkierungen, 15.10.).
//   BB_LOCK=... node -r <arbeitsordner>/ladezeit-preload.js tools/fundament/einheit-bilder.js <real.html> <ordner> <gfx> [bilder,zaehlen]
// Laden wie im Spiel: Gameplay-Vorfuehrung aufgebaut (Regale voll), Vollausbau, Tag (10:00). Bilder <ordner>/<ansicht>-<gfx>.jpg,
// Zaehlung <ordner>/zaehlen-<gfx>.json: je Ansicht Zeichenaufrufe/Dreiecke (renderer.info, Mittel ueber 2 Bilder) sowie Meshes im Graf.
// NUR=ansicht1,ansicht2 schraenkt ein. Zufall fest je Aufrufer (wie tools/fundament/bilder.js), damit vorher/nachher vergleichbar sind.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'../test/start-hilfe.js'));
/* Kameras: p = Auge, t = Ziel (Welt-Meter). Je Kategorie mindestens eine Ansicht. */
const ANS={
  regalLaden:{p:[-3.6,1.65,4.2],t:[-3.6,1.1,-4]},       /* Verkaufsregale, Mittelgondeln, Kopfschilder, Preisleisten */
  regalEingang:{p:[0.5,2.9,5.3],t:[2,0.4,-4]},           /* Laden vom Eingang: Regale, Tische, Gitterboxen */
  regalLager:{p:[-9,2.4,4.8],t:[-17,0.6,-4]},            /* Lagerregale */
  kuehl:{p:[10.6,1.9,1.4],t:[10.6,0.9,4.4]},             /* Kuehlregal nah (Glastuer, Schild) */
  kasse:{p:[3.4,1.9,4.4],t:[0.7,0.9,2.0]},               /* Kassenplatz + Kassenregal */
  sbKasse:{p:[8.0,2.3,2.4],t:[10.6,0.9,4.4]},            /* SB-Kassen mit Tafel */
  front:{p:[0,1.8,15],t:[0,2.3,6]},                     /* Schaufenster, Schiebetuer, Leuchtschild */
  eingang2:{p:[28.95,1.8,13],t:[28.95,1.9,6]},           /* Eingang 2 (Schiebetuer, Festfelder) */
  lagerFenster:{p:[-12.0,1.7,4.6],t:[-14,1.9,6.0]},      /* Lager-Fensterwand von innen */
  lagerFensterAussen:{p:[-14,1.8,12],t:[-14,1.9,6]},     /* Lager-Fensterwand von der Strasse */
  versand:{p:[-13,2.2,-18.5],t:[-14,0.6,-27]},           /* Packmaterial-Regal, Packplatz, Markierung */
  dockHof:{p:[-24,2.6,8],t:[-34,0.3,0]},                 /* Hof: Bodenmarkierung, Schilder ANLIEFERUNG */
  halle:{p:[-38,2.6,-25.6],t:[-52,1.6,-25.6]},           /* Halle: Bodenmarkierung, Hochregal */
  streifen:{p:[-6,1.8,-6],t:[-10,1.0,-10]}               /* Streifenvorhang, Lager */
};
(async()=>{
  const html=process.argv[2], out=process.argv[3], gfx=process.argv[4]||'hoch', modus=(process.argv[5]||'bilder,zaehlen').split(',');
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:+(process.env.BREITE||960),height:+(process.env.HOEHE||600)}});
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
  await p.evaluate(()=>{ const bb=window.__bb; bb.gpStart(); });
  await H.stuecke(p,(st,aus)=>{ const bb=window.__bb; let n=0; while(!bb.gpFertig&&!aus()){ bb.gpBauSchritt(50); n++; } return {fertig:bb.gpFertig,info:n}; },{name:'Vorfuehrung'});
  await p.evaluate(()=>{ const bb=window.__bb; bb.stoppSchleife(); bb.S.level=99; for(const u of bb.UPGRADES) if(!u.geplant) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} try{ const sg=bb.buildSBKasse(); sg.visible=true; }catch(e){} bb.run(4,0.05); });
  const NUR=process.env.NUR?process.env.NUR.split(','):null;
  const zaehl={};
  for(const k in ANS){ if(NUR&&!NUR.includes(k)) continue; const v=ANS[k];
    const r=await p.evaluate(({v,mod})=>{ const bb=window.__bb, cam=bb.camera, R=bb.renderer;
      const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2], yaw=Math.atan2(-dx,-dz);
      bb.setView(v.p[0],v.p[2],yaw,0); bb.clock=600; bb.run(0.4,0.05); bb.clock=600; bb.applyTOD();
      const f=()=>{ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); };
      for(let i=0;i<3;i++){ f(); bb.renderFrame(0.05); }
      const o={};
      if(mod.includes('zaehlen')){ let calls=0, tris=0; const NB=2;
        for(let i=0;i<NB;i++){ f(); R.info.autoReset=false; R.info.reset(); bb.renderFrame(0.05); calls+=R.info.render.calls; tris+=R.info.render.triangles; R.info.autoReset=true; }
        o.calls=Math.round(calls/NB); o.tris=Math.round(tris/NB); }
      if(mod.includes('bilder')) o.u=R.domElement.toDataURL('image/jpeg',0.9);
      return o; },{v,mod:modus});
    if(r.u){ fs.writeFileSync(path.join(out,k+'-'+gfx+'.jpg'),Buffer.from(r.u.split(',')[1],'base64')); delete r.u; }
    zaehl[k]=r; console.log('ansicht',k,JSON.stringify(r)); }
  if(modus.includes('zaehlen')){
    zaehl._graf=await p.evaluate(()=>{ const bb=window.__bb; let meshes=0, mats=new Set(), tex=new Set();
      bb.scene.traverse(o=>{ if(o.isMesh){ meshes++; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m){ mats.add(m); if(m.map) tex.add(m.map); } }); } });
      return {meshes,materialien:mats.size,texturen:tex.size,programme:bb.renderer.info.programs?bb.renderer.info.programs.length:null}; });
    console.log('GRAF',JSON.stringify(zaehl._graf));
    const zf=path.join(out,'zaehlen-'+gfx+'.json'); let alt={}; try{ alt=JSON.parse(fs.readFileSync(zf,'utf8')); }catch(e){}
    fs.writeFileSync(zf,JSON.stringify(Object.assign(alt,zaehl),null,1)); }
  console.log('fertig',errs.length,errs.slice(0,3).join(' | '));
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

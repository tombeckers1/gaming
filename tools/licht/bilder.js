// Licht-Bilder und Helligkeits-Lauf (Licht-Paket 15.10.). Immer unter der Sperre starten:
//   flock /tmp/bb-testlock-licht node -r <arbeitsordner>/ladezeit-preload.js tools/licht/bilder.js <real.html> <ordner> <gfx> [bilder|lauf] [tag]
// zaehlen: Zeichenaufrufe (inkl. Schattenkarten und Bildeffekte) und Bildzeit je Ansicht, Mittel ueber 2 Bilder (Mittel: 6 -
//         dort zeichnet die Sonne ihre Schattenkarte nur jedes 3. Bild). Modi kombinierbar: bilder,zaehlen,lauf
// bilder: feste Kameras (Laden vom Eingang/von der Kasse erhoeht wie das Referenzbild, Gang, Lager, Versand, Sued)
//         je Tag (10:00) und Nacht (22:00) -> <ordner>/<ansicht>-<tag|nacht>-<gfx><tag>.jpg; Mittelwert je Bild in mittel.json
// lauf:   Gang durch die Raeume (ein Bild je 3 m, 480 x 270) mit Kameradrehung (6 Blicke je Wegpunkt), mittlere Bildhelligkeit je Bild
//         (bild) und dasselbe mit grauem Einheitsmaterial (nurLicht: nur die Beleuchtung, ohne Inhalt) -> <ordner>/lauf-<gfx><tag>.json
// Laden wie im Spiel: Gameplay-Vorfuehrung aufgebaut (Regale voll, Kunden), Bildeffekte wie die Stufe sie hat.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'../test/start-hilfe.js'));
const ANS={
  ladenEingang:{p:[0.5,2.9,5.3],t:[2,0.4,-4]},
  ladenKasse:{p:[5.5,2.8,5.2],t:[-1.5,0.5,-1.5]},
  gang:{p:[-3.6,1.65,4.2],t:[-3.6,1.1,-4]},
  ost:{p:[10,2.6,5.2],t:[24,0.6,-3]},
  sued:{p:[31,2.6,-7],t:[17,0.6,-19]},
  lager:{p:[-9,2.4,4.8],t:[-17,0.6,-4]},
  versand:{p:[-13,2.2,-18.5],t:[-14,0.6,-27]}
};   /* Halle und Werk: Rueckbau 16.10. */
/* Weg: Punkte [x,z]; zwischen den Punkten gehen (4 m/s), an jedem Punkt einmal ganz umdrehen */
const WEG=[[0,4],[0,-3],[14,1],[22,-12],[4,-3],[-7.4,1.0],[-14,-8],[-14,-22],[-12,-27]];
(async()=>{
  const html=process.argv[2], out=process.argv[3], gfx=process.argv[4]||'hoch', modus=process.argv[5]||'bilder', tag=process.argv[6]||'';
  fs.mkdirSync(out,{recursive:true});
  const W0=+(process.env.BREITE||1280), H0=+(process.env.HOEHE||720);
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:W0,height:H0}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await H.laden(p,html);
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },gfx);
  await H.neuladen(p); await H.neuesSpiel(p,{stoppen:true});
  /* OHNE_VORF=1: ohne Gameplay-Vorfuehrung (Laden fast leer) - fuer den Helligkeits-Lauf (Licht haengt nicht am Inhalt, Bilder 5-10x schneller) */
  if(!process.env.OHNE_VORF){ await p.evaluate(()=>{ const bb=window.__bb; bb.gpStart(); });
  await H.stuecke(p,(st,aus)=>{ const bb=window.__bb; let n=0; while(!bb.gpFertig&&!aus()){ bb.gpBauSchritt(50); n++; } return {fertig:bb.gpFertig,info:n}; },{name:'Vorfuehrung'}); }
  await p.evaluate(()=>{ const bb=window.__bb; bb.stoppSchleife(); bb.S.level=99; for(const u of bb.UPGRADES) if(!u.geplant) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.run(4,0.05); });
  const hell=`(()=>{ const gl=window.__bb.renderer.getContext(), W=gl.drawingBufferWidth, H=gl.drawingBufferHeight, a=new Uint8Array(W*H*4);
    gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,a); let s=0, n=0, weiss=0; for(let i=0;i<a.length;i+=16){ const l=0.2126*a[i]+0.7152*a[i+1]+0.0722*a[i+2]; s+=l; n++; if(l>=250) weiss++; }
    return {mittel:+(s/n).toFixed(1), weiss:+(weiss/n*100).toFixed(2)}; })()`;
  const MOD=modus.split(',');
  if(MOD.includes('bilder')){
    const mittel={};
    const NUR=process.env.NUR?process.env.NUR.split(','):null, ZEITEN=process.env.ZEITEN?process.env.ZEITEN.split(','):['tag','nacht'];
    for(const zeit of [['tag',600],['nacht',1320]].filter(z=>ZEITEN.includes(z[0]))) for(const k in ANS){ if(NUR&&!NUR.includes(k)) continue; const v=ANS[k];
      const r=await p.evaluate(({v,zeit,hell})=>{ const bb=window.__bb, cam=bb.camera;
        const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2], yaw=Math.atan2(-dx,-dz);
        bb.setView(v.p[0],v.p[2],yaw,0); bb.clock=zeit; bb.run(0.4,0.05); bb.clock=zeit; bb.applyTOD();
        const f=()=>{ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); };
        for(let i=0;i<3;i++){ f(); bb.renderFrame(0.05); }
        const m=(0,eval)(hell);
        return {u:bb.renderer.domElement.toDataURL('image/jpeg',0.88),m}; },{v,zeit:zeit[1],hell});
      const name=k+'-'+zeit[0]+'-'+gfx+tag; fs.writeFileSync(path.join(out,name+'.jpg'),Buffer.from(r.u.split(',')[1],'base64')); mittel[name]=r.m; console.log('bild',name,JSON.stringify(r.m)); }
    const mf=path.join(out,'mittel.json'); let alt={}; try{ alt=JSON.parse(fs.readFileSync(mf,'utf8')); }catch(e){}
    fs.writeFileSync(mf,JSON.stringify(Object.assign(alt,mittel),null,1));
  }
  if(MOD.includes('zaehlen')){
    /* Zeichenaufrufe je Bild (alles: Schattenkarten, Szene, Bildeffekte) und Bildzeit (swiftshader, nur als Vergleichswert) */
    const r=await p.evaluate(({ANS,gfx})=>{ const bb=window.__bb, R=bb.renderer, cam=bb.camera, o={};
      for(const k of ['ladenEingang','lager','versand']){ const v=ANS[k]; const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2], yaw=Math.atan2(-dx,-dz);
        bb.setView(v.p[0],v.p[2],yaw,0); bb.clock=600; bb.run(0.4,0.05); bb.clock=600; bb.applyTOD();
        const f=()=>{ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); };
        for(let i=0;i<2;i++){ f(); bb.renderFrame(0.05); }
        const gl=R.getContext(), px=new Uint8Array(4); let calls=0, tris=0, ms=0;
        const NB=gfx==='mittel'?6:2; for(let i=0;i<NB;i++){ f(); R.info.autoReset=false; R.info.reset(); const t=performance.now(); bb.renderFrame(0.05); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); ms+=performance.now()-t; calls+=R.info.render.calls; tris+=R.info.render.triangles; R.info.autoReset=true; }
        /* nur Zeichnen (ohne Spiel-/Licht-Takt und Bildeffekte): Szene direkt, 3 Mal */
        let ms2=0; for(let i=0;i<3;i++){ const t=performance.now(); R.setRenderTarget(null); R.render(bb.scene,cam); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); ms2+=performance.now()-t; }
        o[k]={calls:Math.round(calls/NB),tris:Math.round(tris/NB),ms:Math.round(ms/NB),msSzene:Math.round(ms2/3)}; }
      return o; },{ANS,gfx});
    fs.writeFileSync(path.join(out,'zaehlen-'+gfx+tag+'.json'),JSON.stringify(r,null,1));
    console.log('ZAEHLEN',gfx,JSON.stringify(r));
  }
  if(MOD.includes('lauf')){
    await p.setViewportSize({width:480,height:270}); await p.evaluate(()=>new Promise(r=>setTimeout(r,300)));
    for(const zeit of [['tag',600],['nacht',1320]]){
      const r=await p.evaluate(({WEG,zeit,hell})=>{ const bb=window.__bb, werte=[]; bb.clock=zeit; bb.applyTOD();
        const dt=1/30; let yaw=0;
        /* zweites Bild nur Licht: alles in einem grauen Einheitsmaterial (Albedo 0,5) - zeigt die Beleuchtung ohne Texturen/Inhalt */
        const grau=new THREE.MeshStandardMaterial({color:0x808080,roughness:1,metalness:0});
        const bild=(x,z,y)=>{ bb.setView(x,z,y,-0.05); bb.run(dt,dt); bb.clock=zeit; bb.kameraSetzen(); bb.renderFrame(dt); const m=(0,eval)(hell);
          const LIM=[]; bb.scene.traverse(o=>{ if(o.userData&&o.userData._licht&&o.visible){ LIM.push(o); o.visible=false; } }); bb.scene.overrideMaterial=grau; bb.renderFrame(dt); const l=(0,eval)(hell); bb.scene.overrideMaterial=null; for(const o of LIM) o.visible=true;
          werte.push([+x.toFixed(1),+z.toFixed(1),+y.toFixed(2),m.mittel,l.mittel]); };
        for(let i=0;i<WEG.length-1;i++){ const [x0,z0]=WEG[i], [x1,z1]=WEG[i+1], d=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(d/3));
          yaw=Math.atan2(-(x1-x0),-(z1-z0));
          for(let k=0;k<n;k++){ const t=k/n; bild(x0+(x1-x0)*t,z0+(z1-z0)*t,yaw); }
          /* am Punkt umdrehen: 6 Blickrichtungen */
          for(let k=1;k<=6;k++) bild(x1,z1,yaw+k*Math.PI/3); }
        return werte; },{WEG,zeit:zeit[1],hell});
      /* Spruenge: groesste Aenderung zwischen zwei Nachbarbildern, getrennt nach Gehen/Drehen am selben Ort */
      const stat=(j)=>{ let maxDreh=0, maxGeh=0, summe=0; const d=[]; for(let i=1;i<r.length;i++){ const x=Math.abs(r[i][j]-r[i-1][j]); d.push(x); if(r[i][0]===r[i-1][0]&&r[i][1]===r[i-1][1]) maxDreh=Math.max(maxDreh,x); else maxGeh=Math.max(maxGeh,x); summe+=x; }
        d.sort((a,b)=>a-b); const ms=r.map(q=>q[j]);
        return {min:Math.min(...ms),max:Math.max(...ms),mittel:+(ms.reduce((a,b)=>a+b,0)/ms.length).toFixed(1),maxSprungDrehen:+maxDreh.toFixed(1),maxSprungGehen:+maxGeh.toFixed(1),p95:+d[Math.floor(d.length*0.95)].toFixed(1),mittlereAenderung:+(summe/(r.length-1)).toFixed(2)}; };
      const aus={zeit:zeit[0],bilder:r.length,bild:stat(3),nurLicht:stat(4),werte:r};
      fs.writeFileSync(path.join(out,'lauf-'+zeit[0]+'-'+gfx+tag+'.json'),JSON.stringify(aus));
      console.log('LAUF',zeit[0],gfx,JSON.stringify(Object.assign({},aus,{werte:undefined}))); }
  }
  console.log('fertig',errs.length,errs.slice(0,3).join(' | '));
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

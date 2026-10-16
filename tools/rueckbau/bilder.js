// Rueckbau (16.10.): Bilder und Zaehlung vorher/nachher - Lager (Westwand ②), Hof R1, Aussen West, Draufsicht, Versandecke, Nacht.
//   flock <sperre> node -r <arbeitsordner>/ladezeit-preload.js tools/rueckbau/bilder.js <real.html> <ordner> <gfx> [bilder,zaehlen,stand] [tag]
// Aufbau wie im Spiel: Gameplay-Vorfuehrung (Vollausbau), danach alle Ausbauten gekauft.
// stand: speichert den Spielstand der Vorfuehrung (braucht bb.gpAus im Build - nur fuer den alten V141-Stand, siehe rueckbau.md) nach <ordner>/stand.json
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'../test/start-hilfe.js'));
const ANS={
  lagerWest:{p:[-10.5,1.9,-13],t:[-19.9,1.3,-19]},       /* Lager ② innen, Blick auf die Westwand (x -19,9) */
  lagerWestNah:{p:[-14.5,1.7,-20],t:[-19.9,1.4,-20]},    /* frontal auf die Stelle der alten Schleuse */
  lagerWestNord:{p:[-10,1.9,-24],t:[-19.9,1.2,-9]},      /* von ③ Richtung R1: ganze Westwand ①/② */
  versand:{p:[-13,2.2,-18.5],t:[-14,0.6,-27]},
  hofR1:{p:[-31,2.4,1.5],t:[-20,1.6,-3]},                /* Hof an der Basisrampe R1 */
  aussenWest:{p:[-44,5,-40],t:[-20,1.5,-16]},            /* von Suedwest auf Lager Sued von aussen */
  aussenSued:{p:[-14,3,-48],t:[-14,1.5,-28]},            /* Rueckseite mit V1 */
  draufsicht:{p:[-25,95,-12],t:[-25,0,-12.01]},
  ladenEingang:{p:[0.5,2.9,5.3],t:[2,0.4,-4]}
};
(async()=>{
  const html=process.argv[2], out=process.argv[3], gfx=process.argv[4]||'hoch', modus=(process.argv[5]||'bilder').split(','), tag=process.argv[6]||'';
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:+(process.env.BREITE||1280),height:+(process.env.HOEHE||720)}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await H.laden(p,html);
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },gfx);
  await H.neuladen(p);
  /* Start ohne Playwright-click: der Aufbau auf Hoch blockiert die Seite unter Last laenger als die 120-s-Frist des Klicks */
  await p.evaluate(()=>document.querySelector('#startBtns button:last-child').click());
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:300000});
  await p.evaluate(()=>{ setTimeout(()=>document.getElementById('nameGo').click(),0); });
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:900000,polling:1000});
  await p.evaluate(()=>window.__bb.stoppSchleife());
  await p.evaluate(()=>{ window.__bb.gpStart(); });
  await H.stuecke(p,(st,aus)=>{ const bb=window.__bb; let n=0; while(!bb.gpFertig&&!aus()){ bb.gpBauSchritt(50); n++; } return {fertig:bb.gpFertig,info:n}; },{name:'Vorfuehrung'});
  if(modus.includes('stand')){
    const st=await p.evaluate(()=>{ const bb=window.__bb; bb.run(30,0.05); bb.gpAus(); bb.save(); return localStorage.getItem(Object.keys(localStorage).find(k=>{ try{ return JSON.parse(localStorage.getItem(k)).v===3; }catch(e){ return false; } })); });
    fs.writeFileSync(path.join(out,'stand.json'),st); console.log('STAND',st.length,'Zeichen');
  }
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; for(const u of bb.UPGRADES) if(!u.geplant) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.run(4,0.05); });
  const zeige=async(v,zeit,bild)=>p.evaluate(({v,zeit,bild})=>{ const bb=window.__bb, cam=bb.camera;
    const dx=v.t[0]-v.p[0], dz=v.t[2]-v.p[2], yaw=Math.atan2(-dx,-dz);
    bb.setView(v.p[0],v.p[2],yaw,0); bb.clock=zeit; bb.run(0.4,0.05); bb.clock=zeit; bb.applyTOD();
    const f=()=>{ bb.kameraSetzen(); cam.position.set(v.p[0],v.p[1],v.p[2]); cam.lookAt(v.t[0],v.t[1],v.t[2]); cam.updateMatrixWorld(); };
    for(let i=0;i<3;i++){ f(); bb.renderFrame(0.05); }
    if(bild) return {u:bb.renderer.domElement.toDataURL('image/jpeg',0.88)};
    const R=bb.renderer, gl=R.getContext(), px=new Uint8Array(4); let calls=0, tris=0, ms=0;
    for(let i=0;i<3;i++){ f(); R.info.autoReset=false; R.info.reset(); const t=performance.now(); bb.renderFrame(0.05); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); ms+=performance.now()-t; calls+=R.info.render.calls; tris+=R.info.render.triangles; R.info.autoReset=true; }
    return {calls:Math.round(calls/3),tris:Math.round(tris/3),ms:Math.round(ms/3)}; },{v,zeit,bild});
  if(modus.includes('bilder')){
    const NUR=process.env.NUR?process.env.NUR.split(','):null;
    for(const zeit of [['tag',600],['nacht',1320]]) for(const k in ANS){ if(NUR&&!NUR.includes(k)) continue;
      if(zeit[0]==='nacht'&&!['lagerWest','hofR1','aussenWest','versand','draufsicht'].includes(k)) continue;
      const r=await zeige(ANS[k],zeit[1],true); const name=k+'-'+zeit[0]+'-'+gfx+tag;
      fs.writeFileSync(path.join(out,name+'.jpg'),Buffer.from(r.u.split(',')[1],'base64')); console.log('bild',name); }
  }
  if(modus.includes('zaehlen')){
    const o={};
    for(const k of ['ladenEingang','lagerWest','versand','hofR1','aussenWest','draufsicht']) o[k]=await zeige(ANS[k],600,false);
    o.speicher=await p.evaluate(()=>{ const bb=window.__bb, R=bb.renderer; let meshes=0, sichtbar=0; bb.scene.traverse(x=>{ if(x.isMesh||x.isInstancedMesh){ meshes++; let v=true, q=x; while(q){ if(!q.visible){ v=false; break; } q=q.parent; } if(v) sichtbar++; } });
      return {geometrien:R.info.memory.geometries,texturen:R.info.memory.textures,meshes,sichtbar,colliders:bb.collide?undefined:undefined}; });
    fs.writeFileSync(path.join(out,'zaehlen-'+gfx+tag+'.json'),JSON.stringify(o,null,1)); console.log('ZAEHLEN',gfx,JSON.stringify(o));
  }
  console.log('fertig',errs.length,errs.slice(0,3).join(' | '));
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

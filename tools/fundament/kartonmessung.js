// Kartons/Paletten vorher-nachher (Fundament Schritt 6, 14.10.2026, Doku docs/fundament/kartons.md):
//   node tools/fundament/kartonmessung.js <real.html> <ausgabeordner>
//   GFXW=hoch|ultralow, RACKS=8 (Lagerregale), VIEWS=lagerRegal,..., VF=1 Gameplay-Vorfuehrung (swiftshader stuerzt dabei ab)
//   Schreibt mess.json (Texturspeicher je Ansicht ueber WebGL-Haken, Zeichenaufrufe, Meshes, Materialien), Ansichten als PNG, zellen/ (Kartonmotive).
// Neues Spiel, alles freigeschaltet, Gameplay-Vorfuehrung aufgebaut (Regale voller Kartons), Ansichten rendern,
// Texturspeicher ueber einen WebGL-Haken messen, Bilder und Kartonzellen speichern.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const html=process.argv[2], out=process.argv[3]; fs.mkdirSync(out,{recursive:true});
  const t0=Date.now(), log=(...a)=>console.log(((Date.now()-t0)/1000).toFixed(0)+'s',...a);
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}}); p.setDefaultTimeout(900000);
  await p.addInitScript(()=>{
    let s=12345; Math.random=function(){ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    /* WebGL-Haken: Bytes je Textur (Stufe 0, x4/3 mit Mipmaps), Kartonanteil ueber Markierung __karton am Bild */
    const G={tex:new Map(),unit:0,bound:{},uploads:0,kartonUploads:0}; window.__G=G;
    for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext]){ if(!C) continue; const P=C.prototype;
      const at=P.activeTexture, bt=P.bindTexture, ti=P.texImage2D, ts=P.texStorage2D, gm=P.generateMipmap, dt=P.deleteTexture;
      P.activeTexture=function(u){ G.unit=u; return at.apply(this,arguments); };
      P.bindTexture=function(tg,t){ G.bound[G.unit+':'+tg]=t; return bt.apply(this,arguments); };
      const cur=(gl,tg)=>G.bound[G.unit+':'+(tg>=34069&&tg<=34074?34067:tg)];
      P.texImage2D=function(tg,lvl){ try{ if(lvl===0){ let w,h,src=null; if(arguments.length>=9){ w=arguments[3]; h=arguments[4]; src=arguments[8]; } else { src=arguments[5]; w=src&&(src.width||src.videoWidth); h=src&&(src.height||src.videoHeight); }
          const t=cur(this,tg); if(t){ let e=G.tex.get(t); if(!e){ e={faces:{},mip:false,karton:false}; G.tex.set(t,e); } e.faces[tg]=(w||0)*(h||0)*4; if(src&&src.__karton){ e.karton=true; G.kartonUploads++; } G.uploads++; } } }catch(e){} return ti.apply(this,arguments); };
      if(ts) P.texStorage2D=function(tg,lv,f,w,h){ try{ const t=cur(this,tg); if(t){ G.tex.set(t,{faces:{[tg]:w*h*4*(tg===34067?6:1)},mip:lv>1,karton:false}); } }catch(e){} return ts.apply(this,arguments); };
      P.generateMipmap=function(tg){ try{ const t=cur(this,tg); const e=t&&G.tex.get(t); if(e) e.mip=true; }catch(e){} return gm.apply(this,arguments); };
      P.deleteTexture=function(t){ G.tex.delete(t); return dt.apply(this,arguments); };
    }
    window.__gpuListe=()=>{ const L=[]; for(const e of G.tex.values()){ let s=0; for(const f in e.faces) s+=e.faces[f]; L.push((e.karton?'K ':'')+Object.keys(e.faces).length+'x'+Math.round(s/4/Object.keys(e.faces).length)+(e.mip?'m':'')); } return L.sort(); };
    window.__gpu=()=>{ let all=0,k=0,nk=0,n=0; for(const e of G.tex.values()){ let s=0; for(const f in e.faces) s+=e.faces[f]; if(e.mip) s*=4/3; all+=s; n++; if(e.karton){ k+=s; nk++; } } return {texturen:n,mb:+(all/1048576).toFixed(1),kartonTexturen:nk,kartonMB:+(k/1048576).toFixed(1),uploads:G.uploads,kartonUploads:G.kartonUploads}; };
  });
  p.on('crash',()=>{ console.log('CRASH Seite abgestuerzt'); process.exit(3); });
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,200)); });
  await p.goto('file://'+html);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:900000});
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },process.env.GFXW||'hoch');
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:900000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible'});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  log('gestartet');
  const res={errs};
  /* Kartonbilder markieren (vorher: je Sorte ein ImageData/Canvas; nachher: Atlasseiten) */
  const mark=()=>p.evaluate(()=>{ const bb=window.__bb; let n=0;
    if(bb.kartonAtlasInfo){ const A=bb.MAT.atlas('karton',{}); for(const t of A.seiten()){ if(t.image) { t.image.__karton=true; n++; } } }
    else for(const k of Object.keys(bb.kartonMat)){ const m=bb.kartonMat[k]; if(m&&m.map&&m.map.image){ m.map.image.__karton=true; n++; } }
    return n; });
  res.start=await p.evaluate(()=>{ const bb=window.__bb, o={};
    if(bb.kartonAtlasInfo){ o.kartonCPU_MB=+((bb.kartonAtlasInfo()?bb.kartonAtlasInfo().bytes:0)/1048576).toFixed(1); o.atlas=bb.kartonAtlasInfo(); }
    else { let s=0,n=0; for(const k of Object.keys(bb.kartonMat)){ const im=bb.kartonMat[k].map.image; s+=(im.width*im.height*4); n++; } o.kartonCPU_MB=+(s/1048576).toFixed(1); o.kartonTexturen=n; }
    return o; });
  await mark();
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=9e7; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} try{ bb.logiAnwenden(); }catch(e){} try{ bb.packStufeAnwenden(); }catch(e){} bb.run(1,0.05); });
  res.racksBau=await p.evaluate(n=>{ const bb=window.__bb, o={vor:bb.racks.length,err:[]}; for(let i=0;i<n;i++){ try{ bb.createRack(bb.racks.length,{kind:'standard'}); }catch(e){ o.err.push(String(e).slice(0,80)); } } o.nach=bb.racks.length; o.slots=bb.racks.reduce((a,r)=>a+r.slots.length,0); return o; },+(process.env.RACKS||8));
  log('racks',JSON.stringify(res.racksBau));
  if(process.env.VF==='1'){ await p.evaluate(()=>{ const bb=window.__bb; bb.gpStart(); let n=0; while(!bb.gpFertig&&n++<5000) bb.gpBauSchritt(50); }); log('vorfuehrung aufgebaut'); }
  /* Kartons in die Lagerregale, an den Boden und auf die Paletten (Versand) */
  res.fuellung=await p.evaluate(()=>{ const bb=window.__bb, o={};
    const T=bb.ORDER.filter(t=>bb.P[t]&&bb.P[t].dims);
    const NS=+(window.__NSORTEN||60); let k=0; bb.racks.forEach(r=>r.slots.forEach(s=>{ if(!s.box){ const t=T[((k%NS)*11)%T.length]; k++; bb.putInSlot(s,t,bb.P[t].box,1); } }));
    o.regalKartons=k; o.racks=bb.racks.length;
    for(let i=0;i<6;i++) bb.spawnFloorBox(T[(i*11+3)%T.length],6,null,1);
    try{ bb.syncPakete(); }catch(e){ o.syncErr=String(e); }
    let typen=new Set(); bb.racks.forEach(r=>r.slots.forEach(s=>{ if(s.box) typen.add(s.box.type); })); bb.floorBoxes.forEach(f=>typen.add(f.type)); o.sorten=typen.size;
    return o; });
  await mark();
  log('gefuellt',JSON.stringify(res.fuellung));
  await p.evaluate(()=>{ const bb=window.__bb, R=bb.renderer, o=R.renderBufferDirect.bind(R); window.__rec=null; R.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){ if(window.__rec){ window.__rec[sc?'main':'shadow']++; } return o(cam,sc,geo,mat,obj,grp); }; });
  /* Ansichten: feste und berechnete (Paletten in der Versandecke, Hofstapel) */
  const dyn=await p.evaluate(()=>{ const bb=window.__bb, out={}; const sc=bb.scene; sc.updateMatrixWorld(true);
    const ids=Object.keys(bb.vsPalObj||{}); if(ids.length){ const g=bb.vsPalObj[ids[0]].g, w=g.getWorldPosition(g.position.clone()); out.versandPalette={cam:[w.x+0.9,2.5,w.z+1.6],ziel:[w.x,0.1,w.z]}; }
    const st=[]; sc.traverse(m=>{ if(m.userData&&m.userData.hof==='paletten'){ const w=m.getWorldPosition(m.position.clone()); st.push([w.x,w.z]); } });
    st.sort((a,b)=>b[0]-a[0]); if(st[0]) out.hofStapelOst={cam:[st[0][0]+2.6,2.3,st[0][1]+2.6],ziel:[st[0][0]-0.6,0.6,st[0][1]]};
    if(st.length>2){ const q=st[2]; out.hofStapelWest={cam:[q[0]+2.0,1.9,q[1]+2.3],ziel:[q[0],0.5,q[1]]}; }
    out.lagerBoden={cam:[-17.6,1.9,-0.4],ziel:[-17.9,0.3,-3.0]};
    const rk=(bb.racks||[]).find(r=>r.slots.some(s=>s.box)); if(rk){ rk.g.updateMatrixWorld(true); const w=rk.g.getWorldPosition(rk.g.position.clone()); const d=new (w.constructor)(0,0,2.6).applyQuaternion(rk.g.getWorldQuaternion(rk.g.quaternion.clone())); out.lagerRegal={cam:[w.x+d.x,1.7,w.z+d.z],ziel:[w.x,1.0,w.z]}; }
    out._stapel=st; return out; });
  log('ziele',JSON.stringify(dyn));
  const views=Object.assign({laden:{spieler:[0,3,0,-0.05]},lager:{spieler:[-14,-2,0,-0.1]},lagerDock:{spieler:[-17,-2,-Math.PI/2,-0.1]}},Object.fromEntries(Object.entries(dyn).filter(([k])=>k[0]!=='_')));
  const nur=process.env.VIEWS?process.env.VIEWS.split(','):null;
  res.views={};
  for(const k in views){ const v=views[k]; if(nur&&nur.indexOf(k)<0) continue;
    const r=await p.evaluate((v)=>{ const bb=window.__bb, R=bb.renderer, cam=bb.camera;
      const sp=v.spieler||[v.cam[0],v.cam[2],0,0];
      const setz=()=>{ bb.kameraSetzen(); if(v.cam){ cam.position.set(v.cam[0],v.cam[1],v.cam[2]); cam.lookAt(v.ziel[0],v.ziel[1],v.ziel[2]); cam.updateMatrixWorld(); } };
      if(bb.setPost) bb.setPost(false); bb.setView(sp[0],sp[1],sp[2],sp[3]); bb.run(0.3,0.05); bb.clock=600; bb.applyTOD(); setz();
      for(let i=0;i<2;i++){ setz(); bb.renderFrame(0.016); }
      window.__rec={main:0,shadow:0}; setz(); bb.renderFrame(0.016); const rec=window.__rec; window.__rec=null;
      const u=R.domElement.toDataURL('image/png');
      const B=bb.BUENDEL||{}; return {bnd:{n:B.n,aus:B.aus,fehler:B.fehler},rec,tex:R.info.memory.textures,geo:R.info.memory.geometries,prog:R.info.programs?R.info.programs.length:null,gpu:window.__gpu(),u}; },v);
    fs.writeFileSync(out+'/'+k+'.png',Buffer.from(r.u.split(',')[1],'base64')); delete r.u; res.views[k]=r; log('ansicht',k,JSON.stringify(r)); }
  res.ende=await p.evaluate(()=>{ const bb=window.__bb, o={}; const mats=new Set(), kmats=new Set(); let meshes=0, kmesh=0, pal=0;
    bb.scene.traverse(x=>{ if(!x.isMesh) return; meshes++; const ms=Array.isArray(x.material)?x.material:[x.material]; ms.forEach(m=>m&&mats.add(m));
      if(x.userData&&x.userData.bauteil==='palette') pal++;
      if(ms.some(m=>m&&(m.userData&&m.userData.atlas==='karton'||(m.map&&m.map.image&&m.map.image.__karton)))){ kmesh++; ms.forEach(m=>m&&kmats.add(m)); } });
    o.meshes=meshes; o.materialien=mats.size; o.kartonMeshes=kmesh; o.kartonMaterialien=kmats.size; o.palettenMeshes=pal;
    if(bb.kartonAtlasInfo){ o.atlas=bb.kartonAtlasInfo(); o.kartonCPU_MB=+(o.atlas.bytes/1048576).toFixed(1); }
    else { let s=0; for(const k of Object.keys(bb.kartonMat)){ const im=bb.kartonMat[k].map.image; s+=im.width*im.height*4; } o.kartonCPU_MB=+(s/1048576).toFixed(1); }
    o.gpu=window.__gpu(); o.gpuListe=window.__gpuListe(); o.texturenThree=bb.renderer.info.memory.textures; o.programme=bb.renderer.info.programs?bb.renderer.info.programs.length:null;
    return o; });
  log('ende',JSON.stringify(res.ende));
  /* Kartonzellen: Auswahl einzeln + Kontaktbogen der ersten 64 Sorten (gleiche Reihenfolge vorher/nachher) */
  const zellen=await p.evaluate(()=>{ const bb=window.__bb; const T=bb.ORDER.filter(t=>bb.P[t]&&bb.P[t].dims);
    const pick=[]; const want=[t=>bb.P[t].cat===1,t=>bb.P[t].cat===2,t=>bb.P[t].sparte==='essen',t=>bb.P[t].sparte==='getraenke',t=>bb.P[t].cold,t=>!bb.P[t].cat&&bb.P[t].sparte==='zubehoer'];
    for(const f of want){ const t=T.find(x=>{ try{ return f(x)&&pick.indexOf(x)<0; }catch(e){ return false; } }); if(t) pick.push(t); }
    const bild=t=>{ let d,W,H; if(bb.kartonBild){ const b=bb.kartonBild(t); d=b; W=b.width; H=b.height; } else { const im=bb.kartonMat[t].map.image; if(im.data){ d=im; W=im.width; H=im.height; } else { W=im.width; H=im.height; d=im.getContext('2d').getImageData(0,0,W,H); } }
      const c=document.createElement('canvas'); c.width=W; c.height=H; c.getContext('2d').putImageData(d,0,0); return c; };
    const einzeln={}; for(const t of pick) einzeln[t]=bild(t).toDataURL('image/png');
    const N=Math.min(64,T.length), cs=128, sp=8, sh=document.createElement('canvas'); sh.width=sp*cs; sh.height=Math.ceil(N/sp)*cs; const g=sh.getContext('2d');
    for(let i=0;i<N;i++) g.drawImage(bild(T[i]),(i%sp)*cs,Math.floor(i/sp)*cs,cs,cs);
    return {einzeln,bogen:sh.toDataURL('image/png'),liste:T.slice(0,N)}; });
  fs.mkdirSync(out+'/zellen',{recursive:true});
  for(const t in zellen.einzeln) fs.writeFileSync(out+'/zellen/'+t+'.png',Buffer.from(zellen.einzeln[t].split(',')[1],'base64'));
  fs.writeFileSync(out+'/zellen/bogen.png',Buffer.from(zellen.bogen.split(',')[1],'base64'));
  res.zellenListe=zellen.liste; res.zellenEinzeln=Object.keys(zellen.einzeln);
  res.endeNachZellen=await p.evaluate(()=>window.__bb.kartonAtlasInfo?window.__bb.kartonAtlasInfo():null);
  fs.writeFileSync(out+'/mess.json',JSON.stringify(res,null,1));
  log('fertig',errs.length,errs.slice(0,5));
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

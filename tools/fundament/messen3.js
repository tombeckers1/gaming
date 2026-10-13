const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,200)); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); if(process.env.GFXW) await p.evaluate(g=>localStorage.setItem('bb_gfx',g),process.env.GFXW);
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child',{timeout:120000});
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:60000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
  const res={errs};
  res.build=await p.evaluate(()=>({calls:window.__P.calls,mats:window.__P.mats.length,matLab:window.__P.mats.reduce((a,m)=>{a[m.lab]=(a[m.lab]||0)+1;return a},{}),texs:window.__P.texs,perr:window.__P.err||null}));
  // einzelne Regale/Racks bauen
  res.reg=await p.evaluate(()=>{
    const bb=window.__bb, out=[]; window.__P.calls.length=0;
    bb.S.level=99; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){}
    for(const k of ['klein','standard','hoch','kuehl','gondel','eck','gross','tisch','tischgross','gitter','gitter2','gitter3','kasse']){
      try{ const n0=window.__P.calls.length; bb.createShelf(bb.shelves.length,{kind:k}); const c=window.__P.calls.slice(n0).filter(x=>x.name==='createShelf'||x.name==='bauMoebel'); out.push({art:'shelf',kind:k,calls:c}); }catch(e){ out.push({art:'shelf',kind:k,err:String(e).slice(0,100)}); } }
    for(const k of ['standard','hoch','schwer']){
      try{ const n0=window.__P.calls.length; bb.createRack(bb.racks.length,{kind:k}); const c=window.__P.calls.slice(n0).filter(x=>x.name==='createRack'); out.push({art:'rack',kind:k,calls:c}); }catch(e){ out.push({art:'rack',kind:k,err:String(e).slice(0,100)}); } }
    return out; });
  // Renderer-Wrapper
  await p.evaluate(()=>{ const bb=window.__bb, R=bb.renderer, o=R.renderBufferDirect.bind(R); window.__rec=null; R.renderBufferDirect=function(cam,sc,geo,mat,obj,grp){ if(window.__rec){ const a=window.__rec[sc?'main':'shadow']; const n=grp?grp.count:(geo.index?geo.index.count:(geo.attributes.position?geo.attributes.position.count:0)); const e=a.get(obj.id)||[0,0]; e[0]++; e[1]+=n/3*(obj.isInstancedMesh?obj.count:1); a.set(obj.id,e); } return o(cam,sc,geo,mat,obj,grp); }; });
  await p.evaluate(()=>{ const bb=window.__bb, R=bb.renderer, o=R.render.bind(R); window.__rend=[]; R.render=function(s,c){ const r=o(s,c); window.__rend.push({sc:s===bb.scene,calls:R.info.render.calls,tris:R.info.render.triangles,shadowOn:R.shadowMap.enabled}); return r; }; });
  res.alle=await p.evaluate(()=>{
    const bb=window.__bb, scene=bb.scene, out={meshes:[],mats:{},texs:{}};
    const effVis=o=>{ for(let x=o;x;x=x.parent){ if(!x.visible) return false; } return true; };
    scene.updateMatrixWorld(true);
    const ts=t=>{ if(!t) return null; const im=t.image; return {id:t.id,w:im&&(im.width||0),h:im&&(im.height||0)}; };
    window.__idx=[]; window.__idmap=new Map();
    scene.traverse(o=>{ if(!(o.isMesh||o.isPoints||o.isLine||o.isSprite)) return;
      const g=o.geometry; let tri=0; if(g){ const c=g.index?g.index.count:(g.attributes.position?g.attributes.position.count:0); tri=c/3; }
      const ms=Array.isArray(o.material)?o.material:[o.material]; const id=out.meshes.length; window.__idx.push(o); window.__idmap.set(o.id,id);
      out.meshes.push({i:id,own:o.userData.__own||'',zone:'',vis:effVis(o),type:o.type,inst:o.isInstancedMesh?o.count:1,tri:Math.round(tri),mats:ms.map(m=>m&&m.id),cast:!!o.castShadow,hid:ms.every(m=>m&&m.visible===false),vc:!!(g&&g.attributes.color),arr:Array.isArray(o.material)});
      for(const m of ms){ if(!m||out.mats[m.id]) continue; out.mats[m.id]={t:m.type,col:m.color?'#'+m.color.clone().convertLinearToSRGB().getHexString():null,r:m.roughness,m:m.metalness,vc:!!m.vertexColors,map:ts(m.map),nrm:ts(m.normalMap),bump:ts(m.bumpMap),lm:ts(m.lightMap),em:m.emissive?'#'+m.emissive.getHexString():null,emI:m.emissiveIntensity,op:m.opacity,tr:m.transparent,at:m.alphaTest,side:m.side}; }
    });
    return out; });
  const views={laden:[0,3,0,0],ladenFront:[0,-4,Math.PI,0],lager:[-14,-2,0,0],lagerDock:[-17,-2,Math.PI/2*-1,0],testfeld:[0,-12,0,0.05],dockHof:[-27,3,-Math.PI/2,0],halleW:[-46,-10,0,0],strasse:[0,12,Math.PI,0.05]};
  res.views={};
  for(const k in views){ const v=views[k];
    res.views[k]=await p.evaluate(([x,z,yaw,pitch])=>{
      const bb=window.__bb, R=bb.renderer, cam=bb.camera, scene=bb.scene;
      bb.setView(x,z,yaw,pitch); bb.run(0.3,0.05); bb.clock=1000; bb.applyTOD(); bb.kameraSetzen(); window.__rend.length=0;
      for(let i=0;i<2;i++){ bb.kameraSetzen(); bb.renderFrame(0.016); } window.__rec={main:new Map(),shadow:new Map()}; bb.kameraSetzen(); bb.renderFrame(0.016); const rec=window.__rec; window.__rec=null; const recOut={main:[...rec.main].map(([id,e])=>[window.__idmap.get(id),e[0],Math.round(e[1])]),shadow:[...rec.shadow].map(([id,e])=>[window.__idmap.get(id),e[0],Math.round(e[1])])};
      const rend=window.__rend.slice(-12);
      cam.updateMatrixWorld(true);
      const fr=new THREE.Frustum(), pm=new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
      const sp=new THREE.Sphere(), drawn=[];
      const effVis=o=>{ for(let x=o;x;x=x.parent){ if(!x.visible) return false; } return true; };
      window.__idx.forEach((o,i)=>{ if(!(o.isMesh)) return; if(!effVis(o)) return; const ms=Array.isArray(o.material)?o.material:[o.material]; if(ms.every(m=>!m||m.visible===false)) return;
        const g=o.geometry; if(o.isInstancedMesh&&o.count===0) return;
        if(o.frustumCulled!==false&&g){ if(!g.boundingSphere) g.computeBoundingSphere(); sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); if(!fr.intersectsSphere(sp)) return; }
        const dc=ms.length>1?ms.length:1; drawn.push([i,dc]); });
      return {pos:[x,z,yaw,pitch],rend,drawn,recOut}; },v);
  }
  fs.writeFileSync(process.argv[3],JSON.stringify(res));
  console.log('fertig',errs.length,'fehler',errs.slice(0,3));
  await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});

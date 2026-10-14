// Bauteil-Bilder vorher/nachher (Fundament Schritt Zaeune/Poller und Waende, 14.10.)
//   node -r tools/test/ladezeit-preload.js tools/fundament/bauteilbilder.js <real.html> <ausgabeordner> [iso]
// Neues Spiel, Tag, Stufe Hoch, Zufall fest. Zuerst die Ansichten im Anfangszustand (Absperrbaender
// haengen nur vor dem Kauf), dann alles freigeschaltet. "iso" baut die Baukasten-Bauteile zusaetzlich
// einzeln vor hellem Grund (nur im Nachher-Stand vorhanden: bk.zaun/poller/anfahrschutz/absperrung/wand).
// VIEWS=a,b schraenkt die Ansichten ein.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const html=process.argv[2], out=process.argv[3], iso=process.argv[4]==='iso';
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}});
  await p.addInitScript(()=>{ let s=12345; Math.random=function(){ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; });
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+html);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:900000});
  await p.evaluate(()=>{ localStorage.clear(); localStorage.setItem('bb_gfx','hoch'); });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:900000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000});
  await p.click('#startBtns button:last-child',{timeout:900000});
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:600000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:600000});
  const P2=Math.PI/2;
  /* [x,z,yaw,pitch] - yaw 0 schaut nach -z, P2 nach -x */
  const START={
    'band-testfeld':[5.25,-2.6,0,0.12], 'band-lager':[-4.6,-2.5,P2,0.1]
  };
  const ALLES={
    'zaun-testfeld':[3.5,-21.5,0.55,0.08], 'zaun-lkwhof':[-62.5,-47,'auf',-70,-51.5,0.04], 'zaun-ost':[39.4,-1.5,-P2+0.45,0.04],
    'zaun-versandhof':null, 'gitter-packstation':[-10.25,-24.6,0,0.16],
    'poller-laden':[3.6,10.6,'auf',5.4,7.5,0.22], 'anfahrschutz-moerser':null,
    'wand-laden':[0,3,0,0], 'wand-lager':[-14,-2,0,0.05], 'wand-lagerdock':[-17,-2,-P2,0], 'wand-dockhof':[-27,3,-P2,0.05],
    'wand-halle':[-46,-10,0,0], 'wand-front':[0,-4,Math.PI,0], 'wand-testfeld':[0,-12,0,0.05]
  };
  const nur=process.env.VIEWS?process.env.VIEWS.split(','):null;
  /* [x,z,'auf',zielX,zielZ,pitch] = Blick von (x,z) auf den Zielpunkt */
  const auf=v=>v&&v[2]==='auf'?[v[0],v[1],Math.atan2(-(v[3]-v[0]),-(v[4]-v[1])),v[5]]:v;
  const bild=async(k,v)=>{ if(nur&&!nur.includes(k)) return; v=auf(v);
    const url=await p.evaluate(([x,z,yaw,pitch])=>{ const bb=window.__bb;
      if(bb.setPost) bb.setPost(false); bb.setView(x,z,yaw,pitch); bb.clock=600; bb.run(0.3,0.05); bb.clock=600; bb.applyTOD();
      bb.shot(); bb.shot(); return bb.renderer.domElement.toDataURL('image/png'); },v);
    fs.writeFileSync(out+'/'+k+'.png',Buffer.from(url.split(',')[1],'base64')); console.log('bild',k); };
  for(const k in START) await bild(k,START[k]);
  /* Packstation-Band: Lager gekauft, Packstation noch nicht */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=9e7; for(const id of ['lager','lager_nord','lager_gross','lager_sued','lager_sued2']) bb.S.up[id]=true; bb.S.up.packstation=false; try{ bb.applyZonen(); }catch(e){} bb.run(0.5,0.05); });
  { const q=await p.evaluate(()=>{ const bb=window.__bb, bx=new THREE.Box3(); bb.packTisch.updateMatrixWorld(true);
      bb.packTisch.traverse(o=>{ if(o.isMesh&&o.userData&&o.userData.sperrband) bx.expandByObject(o); });
      const c=bx.getCenter(new THREE.Vector3()); return [c.x+0.6,c.z+3.0,'auf',c.x,c.z,0.2]; }); await bild('band-packstation',q); }
  await p.evaluate(()=>{ const bb=window.__bb; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} try{ bb.logiAnwenden(); }catch(e){} bb.run(1,0.05); });
  { const m=await p.evaluate(()=>{ const s=window.__bb.STATION_POS.moerser; return [s.x-2.4,s.z+2.9,'auf',s.x,s.z,0.4]; }); ALLES['anfahrschutz-moerser']=m; }
  { const m=await p.evaluate(()=>{ const h=window.__bb.V1_HOF; return [h.x1-0.9,h.z0+1.2,'auf',h.x0,(h.z0+h.z1)/2,0.1]; }); ALLES['zaun-versandhof']=m; }
  for(const k in ALLES) await bild(k,ALLES[k]);
  if(iso){
    /* Bauteile einzeln: eigene Szene, gleiches Licht wie der Katalog (Himmel + Sonne), heller Grund */
    const teile={
      'iso-zaun-doppelstab':"bk.zaun({art:'doppelstab',von:[-2.6,0],bis:[2.6,0],parent:G})",
      'iso-zaun-luecke':"bk.zaun({art:'doppelstab',von:[-4,0],bis:[4,0],luecke:[[3,5]],parent:G})",
      'iso-zaun-gitter':"bk.zaun({art:'gitter',von:[-1.8,0],bis:[1.8,0],parent:G}); bk.zaun({art:'gitter',von:[-1.8,0],bis:[-1.8,1.6],parent:G})",
      'iso-zaun-gelaender':"bk.zaun({art:'gelaender',von:[-1.8,0],bis:[1.8,0],parent:G})",
      'iso-poller':"{ const S=bk.sammler({bauteil:'poller'}); bk.poller(S,-0.35,0); bk.poller(S,0.35,0,{art:'stadt'}); S.fertig(G); }",
      'iso-anfahrschutz':"{ const S=bk.sammler({bauteil:'anfahrschutz'}); bk.anfahrschutz(S,{von:[-1.2,0],bis:[1.2,0]}); S.fertig(G); }",
      'iso-absperrung':"bk.absperrung({punkte:[[-1.4,0],[0,0],[1.4,0]],text:'NOCH NICHT FREIGESCHALTET',parent:G})",
      'iso-wand-innen':"bk.wand({x0:-2,x1:2,z0:-0.1,z1:0.1,y0:0,y1:2.6,innen:'+z',flaechen:{innen:'laden',aussen:'fassade'},sockel:true,parent:G,bild:false}); bk.wand({x0:-2.2,x1:-2,z0:-0.1,z1:2.4,y0:0,y1:2.6,innen:'+x',flaechen:{innen:'lager',aussen:'fassade'},parent:G,bild:false})",
      'iso-wand-aussen':"bk.wand({x0:-3.2,x1:0,z0:-0.1,z1:0.1,y0:0,y1:3.4,innen:'-z',flaechen:{innen:'laden',aussen:'fassade'},parent:G,bild:false}); bk.wand({x0:0,x1:3.2,z0:-0.1,z1:0.1,y0:0,y1:3.4,innen:'-z',flaechen:{innen:'lager',aussen:'blech'},ue:0,parent:G,bild:false}); bk.sockelleiste({art:'aussen',laengs:true,a0:0.4,a1:3.2,fest:0,seite:1,parent:G,bild:false})"
    };
    for(const k in teile){ if(nur&&!nur.includes(k)) continue;
      const url=await p.evaluate(code=>{ const bb=window.__bb, bk=bb.bk, R=bb.renderer, T=THREE;
        const sc=new T.Scene(); sc.background=new T.Color(0xe9ecf0); const G=new T.Group(); sc.add(G);
        sc.add(new T.HemisphereLight(0xffffff,0x9aa0a8,0.9)); const d=new T.DirectionalLight(0xffffff,1.6); d.position.set(4,7,6); sc.add(d);
        const bo=new T.Mesh(new T.CircleGeometry(6,48),new T.MeshStandardMaterial({color:0xd8dce2,roughness:1})); bo.rotation.x=-Math.PI/2; sc.add(bo);
        try{ (new Function('bk','G','THREE',code))(bk,G,T); }catch(e){ return 'FEHLER '+e.message; }
        const bx=new T.Box3().setFromObject(G), c=bx.getCenter(new T.Vector3()), s=bx.getSize(new T.Vector3()), r=Math.max(s.x,s.y,s.z,2.2);
        const cam=new T.PerspectiveCamera(40,640/400,0.05,200); cam.position.set(c.x+r*0.55,c.y+r*0.42,c.z+r*1.25); cam.lookAt(c);
        const alt=R.getRenderTarget(); R.setRenderTarget(null); R.render(sc,cam); const u=R.domElement.toDataURL('image/png'); R.setRenderTarget(alt); return u; },teile[k]);
      if(url.indexOf('FEHLER')===0){ console.log(k,url); continue; }
      fs.writeFileSync(out+'/'+k+'.png',Buffer.from(url.split(',')[1],'base64')); console.log('bild',k); }
  }
  console.log('fertig',errs.length,errs.slice(0,3));
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

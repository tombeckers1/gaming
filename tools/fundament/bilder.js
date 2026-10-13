// Bildvergleich vorher/nachher (Fundament Etappe 2, 13.10.): node bilder.js <real.html> <ausgabeordner> [gfx]
// Zeichnet Laden, Ladenfront, Lager, Lagerdock, Dock-Hof, Strasse, Testfeld, Halle West zu Tag/Abend/Nacht
// (VIEWS=..., ZEITEN='{"tag":600}' schraenken ein) ohne Bildaufbereitung (Filmkorn haengt an der Uhr).
// Zufall ist je "Helfer|Aufrufer" (Funktionsnamen im Stapel) ein eigener fester Strom - so verschiebt
// eine Stelle, die weniger wuerfelt (z. B. geteilte Textur), nicht die ganze Welt. Vergleich: bildvergleich.py
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const html=process.argv[2], out=process.argv[3], gfx=process.argv[4]||'hoch';
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:640,height:400}});
  await p.addInitScript(()=>{ /* Zufall je aufrufender Funktion (Namen aus dem Stapel, der Code ist strikt - caller geht nicht):
       ein Strom je "Helfer|Aufrufer", unabhaengig davon, wie oft andere Stellen wuerfeln */
    const Q=new Map(); const mk=seed=>{ let s=seed|0; const f=()=>{ f.n++; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; f.n=0; return f; };
    const hash=str=>{ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h; };
    const RE=/at ([^\s(]+) \(/g; window.__Q=Q;
    Math.random=function(){ const o=Error.stackTraceLimit; Error.stackTraceLimit=7; const st=new Error().stack; Error.stackTraceLimit=o;
      RE.lastIndex=0; let m, k='', n=0; RE.exec(st); while(n<2&&(m=RE.exec(st))){ k+=m[1]+'|'; n++; }
      let r=Q.get(k); if(!r){ r=mk(hash(k)); Q.set(k,r); } return r(); }; });
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+html);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:900000});
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },gfx);
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:900000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000});
  await p.click('#startBtns button:last-child',{timeout:900000});
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:600000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:600000});
  const info=await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} bb.run(1,0.05);
    let mats=new Set(), tex=new Set(), meshes=0; bb.scene.traverse(o=>{ if(o.isMesh){ meshes++; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(!m) return; mats.add(m); for(const k of ['map','emissiveMap','roughnessMap','normalMap','bumpMap','alphaMap']) if(m[k]) tex.add(m[k]); }); } });
    return {meshes,mats:mats.size,tex:tex.size,gfx:typeof GFX!=='undefined'?GFX:null}; });
  const views0={laden:[0,3,0,0],ladenFront:[0,-4,Math.PI,0],lager:[-14,-2,0,0],lagerDock:[-17,-2,-Math.PI/2,0],testfeld:[0,-12,0,0.05],dockHof:[-27,3,-Math.PI/2,0],halleW:[-46,-10,0,0],strasse:[0,12,Math.PI,0.05]}; const views={}; for(const k of (process.env.VIEWS||'laden,ladenFront,lager,lagerDock,dockHof,strasse,testfeld,halleW').split(',')) views[k]=views0[k];
  const zeiten=process.env.ZEITEN?JSON.parse(process.env.ZEITEN):{tag:600,abend:1000,nacht:1300}; const T0=Date.now();
  for(const zt in zeiten) for(const k in views){ const v=views[k];
    const url=await p.evaluate(([x,z,yaw,pitch,clk])=>{ const bb=window.__bb; if(bb.setPost) bb.setPost(false); if(bb.LI){ bb.LI.cx=1e9; bb.LI.tS=-1e9; } bb.setView(x,z,yaw,pitch); bb.clock=clk; bb.run(0.3,0.05); bb.clock=clk; bb.applyTOD();
      bb.shot(); if(bb.LI){ bb.LI.cx=1e9; bb.LI.tS=-1e9; }
      bb.shot(); return bb.renderer.domElement.toDataURL('image/png'); },[...v,zeiten[zt]]);
    console.log(zt,k,Date.now()-T0); fs.writeFileSync(out+'/'+zt+'-'+k+'.png',Buffer.from(url.split(',')[1],'base64')); }
  fs.writeFileSync(out+'/info.json',JSON.stringify({info,errs}));
  console.log('fertig',JSON.stringify(info),errs.length,errs.slice(0,3));
  await b.close();
})();

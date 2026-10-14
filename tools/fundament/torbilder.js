// Tor-Bilder vorher/nachher (Fundament Schritt Tore, 13.10.): node -r tools/test/ladezeit-preload.js tools/fundament/torbilder.js <real.html> <ausgabeordner> [iso]
// Neues Spiel, alles freigeschaltet, Tag. Je Tor eine Ansicht im Spiel; mit "iso" zusaetzlich nur die
// Meshes mit userData.bauteil==='tor' (Baukasten) bzw. TORISO-Filter.
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
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=9e7; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){} try{ bb.logiAnwenden(); }catch(e){} bb.run(1,0.05); });
  const P2=Math.PI/2;
  const views={
    'r1-aussen':[-26.5,-2,-P2,0.12], 'r1-innen':[-15.2,-2,P2,0.18],
    'r2-aussen':[-31,-41.5,Math.PI,0.12], 'r2-innen':[-31,-27.2,0,0.2],
    'v1-aussen':[-10.25,-37,Math.PI,0.14], 'v1-innen':[-10.25,-24.6,0,0.16],
    'ost':[40.4,-15.6,-2.0,0.16], 'hof-schiebetor':[-28.5,3.4,P2,0.02], 'doppeltor':[39.4,2,-P2,0.05]
  };
  const nur=process.env.VIEWS?process.env.VIEWS.split(','):Object.keys(views);
  for(const k of nur){ const v=views[k]; if(!v) continue;
    for(const modus of iso?['spiel','iso']:['spiel']){
      const url=await p.evaluate(([x,z,yaw,pitch,modus])=>{ const bb=window.__bb, scene=bb.scene;
        if(bb.setPost) bb.setPost(false); bb.setView(x,z,yaw,pitch); bb.clock=600; bb.run(0.3,0.05); bb.clock=600; bb.applyTOD();
        const versteckt=[];
        if(modus==='iso'){ const torig=o=>{ for(let a=o;a;a=a.parent) if(a.userData&&(a.userData.bauteil==='tor'||a.userData.bauteil==='torPanel')) return true; return false; };
          scene.traverse(o=>{ if((o.isMesh||o.isPoints||o.isLine||o.isSprite)&&o.visible&&!torig(o)){ o.visible=false; versteckt.push(o); } }); }
        bb.shot(); bb.shot(); const u=bb.renderer.domElement.toDataURL('image/png');
        versteckt.forEach(o=>o.visible=true); return u; },[...v,modus]);
      fs.writeFileSync(out+'/'+k+(modus==='iso'?'-iso':'')+'.png',Buffer.from(url.split(',')[1],'base64'));
      console.log('bild',k,modus); }
  }
  console.log('fertig',errs.length,errs.slice(0,3));
  await b.close();
})().catch(e=>{ console.error('FAIL',e); process.exit(1); });

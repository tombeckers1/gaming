/* Lagergang innen (Toms PDF vom 25.09.): jede Wand, die man im Gang
   sieht, ist die helle Lagerwand mit gelb-schwarzem Sockel - auch die
   Rueckwand des Ladens und die beiden Kopfenden. Vorher war die
   Rueckwand innen Betonfassade mit schwarzem Sockel. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; S.level=99; S.money=9e6;
    ['shop_halb','testfeld','lager','lager_nord','lager_gross','lager_sued','lager_sued2','shop_gross','shop_ost','shop_sued','lager_west'].forEach(id=>bb.testKauf(id));
    const ray=new THREE.Raycaster(), sicht=o=>{ for(let x=o;x;x=x.parent) if(!x.visible) return false; return true; };
    const treffer=(x,y,z,dx,dz)=>{ ray.set(new THREE.Vector3(x,y,z),new THREE.Vector3(dx,0,dz)); ray.far=4;
      const h=ray.intersectObjects(bb.scene.children,true).find(i=>sicht(i.object)&&i.object.isMesh&&!(i.object.material&&i.object.material.visible===false)&&!(i.object.material&&i.object.material.transparent));
      if(!h) return 'nichts';
      const m=Array.isArray(h.object.material)?h.object.material[h.face.materialIndex]:h.object.material;
      return m===bb.lagerWall?'lager':'anders@'+h.point.x.toFixed(2)+','+h.point.z.toFixed(2); };
    const falsch=[]; let n=0;
    const pr=(was,x,y,z,dx,dz)=>{ n++; const t=treffer(x,y,z,dx,dz); if(t!=='lager') falsch.push(was+' '+x.toFixed(1)+'/'+y+': '+t); };
    for(let x=-7.6;x<=7.6;x+=0.4){ if(x>4.3&&x<6.2) continue;
      for(const y of [0.15,1.5]){ pr('nord',x,y,-7.5,0,1); pr('sued',x,y,-7.5,0,-1); } }
    for(let z=-8.8;z<=-6.2;z+=0.2) for(const y of [0.15,1.5]) pr('ost',6.5,y,z,1,0);
    for(const z of [-8.8,-6.2]) for(const y of [0.15,1.5]) pr('west',-6.5,y,z,-1,0);
    for(let z=-8.6;z<=-6.4;z+=0.4) pr('west-sturz',-6.5,2.7,z,-1,0);
    return {n,falsch}; });
  console.log('WAENDE',r.n,'Strahlen, falsch:',r.falsch.length, JSON.stringify(r.falsch.slice(0,8)));
  const mangel=r.falsch.length?['WAND: '+r.falsch.length+' Stellen ohne Lagerwand, z.B. '+r.falsch.slice(0,3).join(' | ')]:[];
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Fassade und Ecken (Tom, 26.09.):
   - ECKE: kein Zaunpfosten steht in der Verkaufsflaeche (einer stand in
     der Innenecke der Suedhalle)
   - SOCKEL: alle Sockel vor den Schaufenstern gleich niedrig (0,62 m),
     der alte 0,875-m-Block am Basisladen ist weg
   - FENSTER: kein umlaufender Rahmen - keine senkrechten 10-cm-Profile
     an den Schaufenstern der Erweiterungen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, o={pfosten:[],sockel:[],profile:0};
    S.level=40; S.money=1e7; ['shop_halb','lager','lager_nord','shop_gross','lager_gross','lager_sued','shop_ost','shop_sued','eingang2'].forEach(id=>bb.testKauf(id));
    const L=bb.LAY.shop, bx=new THREE.Box3(), sz=new THREE.Vector3();
    bb.scene.traverse(m=>{ if(!m.isMesh) return; bx.setFromObject(m); bx.getSize(sz);
      if(m.userData.zaunPfosten){ const c=bx.getCenter(new THREE.Vector3());
        if(c.x>L.x0-0.02&&c.x<L.x1+0.02&&c.z>L.z0-0.02&&c.z<L.z1+0.02) o.pfosten.push([+c.x.toFixed(2),+c.z.toFixed(2)]); }
      /* Sockel: dunkle Bloecke an der Ladenfront (z um 6), lang und flach */
      if(bx.min.y<0.01&&sz.x>2&&sz.y>0.4&&sz.y<1.2&&sz.z<0.4&&bx.min.z>5.8&&bx.max.z<6.6&&m.material&&m.material.color&&m.material.color.getHex()===new THREE.Color().setHex(0x3b4049).convertSRGBToLinear().getHex()) o.sockel.push(+sz.y.toFixed(3));
      /* senkrechte 10-cm-Profile in der Frontwand ueber Bruestungshoehe */
      if(Math.abs(sz.x-0.1)<0.005&&sz.y>1.2&&sz.z<0.08&&bx.min.z>5.7&&bx.max.z<6.4) o.profile++; });
    return o; });
  console.log('AUSSEN',JSON.stringify(r));
  pruef('ECKE',!r.pfosten.length,'Zaunpfosten in der Verkaufsflaeche: '+JSON.stringify(r.pfosten));
  pruef('SOCKEL',r.sockel.length>=3&&r.sockel.every(h=>Math.abs(h-0.62)<0.01),'Sockelhoehen '+r.sockel);
  pruef('FENSTER',r.profile===0,r.profile+' seitliche Rahmenprofile an Schaufenstern');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

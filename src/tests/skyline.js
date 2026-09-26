/* Hochhaeuser im Hintergrund (Tom, 25.09.: "zu wenig Pixel, die sollen
   richtig schoen werden"). Gemessen an der Geometrie selbst:
   - schaerfe: Texel je Meter Fassadenhoehe (Textur-Pixel mal
     UV-Spanne durch Wandhoehe), Median und schlechtestes Haus
   - stile: verschiedene Fassadenmaterialien
   - Tuerme mit abgesetzter, beleuchteter Krone und Flugwarnlicht */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
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
  const r=await p.evaluate(()=>{ const bb=window.__bb, o={dichte:[]};
    const karten=new Set();
    bb.scene.traverse(m=>{ if(!m.isMesh||!m.userData.stadt||!m.material||!m.material.map||!m.material.map.image) return;
      karten.add(m.material.map.uuid);
      const H=m.material.map.image.height, pos=m.geometry.attributes.position, uv=m.geometry.attributes.uv, nor=m.geometry.attributes.normal;
      if(!uv) return;
      for(let i=0;i+2<pos.count;i+=3){ if(Math.abs(nor.getY(i))>0.1) continue;
        let ymin=1e9,ymax=-1e9,vmin=1e9,vmax=-1e9;
        for(let k=0;k<3;k++){ ymin=Math.min(ymin,pos.getY(i+k)); ymax=Math.max(ymax,pos.getY(i+k)); vmin=Math.min(vmin,uv.getY(i+k)); vmax=Math.max(vmax,uv.getY(i+k)); }
        if(ymax-ymin<6) continue;
        o.dichte.push(H*(vmax-vmin)/(ymax-ymin)); } });
    o.dichte.sort((a,b)=>a-b);
    o.median=+o.dichte[Math.floor(o.dichte.length/2)].toFixed(1); o.min=+o.dichte[0].toFixed(1); o.n=o.dichte.length; delete o.dichte;
    o.karten=karten.size; Object.assign(o,bb.stadtInfo());
    return o; });
  console.log('SKYLINE',JSON.stringify(r));
  pruef('SCHAERFE',r.median>=30&&r.min>=20,'nur '+r.median+' Texel je Meter (schlechtestes Haus '+r.min+')');
  pruef('STILE',r.karten>=4&&r.skyStile>=4,'nur '+r.karten+' Fassaden, '+r.skyStile+' Stile in der Skyline');
  pruef('TUERME',r.stufen>=4&&r.kronen>=4&&r.warn>=6,'Stufen '+r.stufen+', Kronen '+r.kronen+', Warnlichter '+r.warn);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

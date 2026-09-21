/* Rundgang: Standbilder aus den neuen Bereichen */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=40; bb.S.money=5e6;
    ['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west','packstation','onlineshop','kasse2'].forEach(id=>bb.buyUp(id));
    const kauf=['shelf_klein','shelf_standard','shelf_hoch','shelf_kuehl','shelf_gondel','shelf_eck','rack','rack_hoch','rack_schwer'];
    for(let r=0;r<80;r++){ let w=false;
      for(const id of kauf){ const u=bb.UPGRADES.find(x=>x.id===id); if(u&&!u.done()){ bb.buyUp(id); w=true; } }
      if(!w) break; }
    /* Ware einraeumen, damit die Regale nicht leer sind */
    const types=Object.keys(bb.P).filter(t=>!bb.P[t].noShelf);
    for(const lv of bb.allLevels()){ const t=types[(Math.random()*types.length)|0];
      const c=Math.min(bb.pools[t]?8:0,20); for(let k=0;k<c;k++) bb.addToLevel(lv,t,1); }
    bb.clock=780;
  });
  /* yaw 0 = Blick nach -z, -PI/2 = nach +x, +PI/2 = nach -x, PI = nach +z */
  const BLICKE=[
    ['01-laden-ost',      2.0,  0.0, -Math.PI/2, -0.02],
    ['02-gondelgasse',   12.0, -1.0, -Math.PI/2, -0.04],
    ['03-ost2',          24.0,  1.0, -Math.PI/2, -0.02],
    ['04-eckregal',      33.5, -2.0, -Math.PI*0.25,-0.06],
    ['05-suedhalle',     14.0,-11.0, -Math.PI/2, -0.02],
    ['06-suedhalle-quer',24.0, -8.0,  0.0,       -0.02],
    ['07-lager-sued',   -14.0,-10.0,  0.0,        0.10],
    ['08-lager-west',   -30.0,-14.0,  Math.PI/2,  0.10],
    ['09-westtore',     -38.0,-18.6,  Math.PI/2,  0.06],
    ['10-hof-west',     -50.0,-18.0,  Math.PI/2,  0.02],
    ['11-hof-weit',     -55.0, -9.0,  0.0,        0.02],
    ['12-testfeld',       0.0,-22.0,  Math.PI,    0.04],
    ['13-strasse-ost',   24.0,  9.5, -Math.PI/2,  0.03],
    ['14-logistik',      30.0,  4.0, -Math.PI/2,  0.05],
    ['15-ladenfront',    12.0, 21.5,  0.0,        0.06],
    ['16-eck-sued',       11.0,-18.6,  Math.PI*0.25,-0.06],
    ['17-lagerhoch',    -12.0,-20.0,  0.0,        0.18]
  ];
  for(const [name,x,z,yaw,pit] of BLICKE){
    await p.evaluate(v=>window.__bb.setView(v[0],v[1],v[2],v[3]),[x,z,yaw,pit]);
    const d=await p.evaluate(()=>{ window.__bb.clock=780; return window.__bb.shot(); });
    fs.writeFileSync('/tmp/blick-'+name+'.jpg',Buffer.from(d.split(',')[1],'base64'));
  }
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'ERRORS: keine');
  await b.close();
})();

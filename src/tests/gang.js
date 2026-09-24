const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const fehler=[];
  p.on('pageerror',e=>fehler.push('PAGEERROR '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  console.log(JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb;
    const geh=(zx,zz)=>{ let last=null;
      for(let k=0;k<4000;k++){ const pp=bb.playerPos();
        const dx=zx-pp.x, dz=zz-pp.z, d=Math.hypot(dx,dz);
        if(d<0.45) return true;
        bb.schiebe(pp.x+dx/d*0.12, pp.z+dz/d*0.12);
        const np=bb.playerPos();
        if(last&&Math.hypot(np.x-last.x,np.z-last.z)<0.002&&k>30) return false;
        last=np; }
      return false; };
    const lauf=(pfad)=>{ bb.setView(0,0,0,0); for(const w of pfad) if(!geh(w[0],w[1])) return false; return true; };
    const HINTEN=[[5.2,-4.6],[5.2,-7.5]];
    const out={};
    /* Tag eins: Gang steht, Kopfenden zu, Weg aufs Testfeld offen */
    out.tag1_testfeld = lauf(HINTEN.concat([[5.2,-10.5],[0,-14]]));
    out.tag1_gang_west_zu = !lauf(HINTEN.concat([[0,-7.5],[-9.5,-7.5]]));
    out.tag1_gang_ost_zu  = !lauf(HINTEN.concat([[0,-7.5],[9.5,-7.5]]));
    /* Nach dem Kauf der Lagerhalle West muessen beide Enden offen sein */
    bb.S.level=40; bb.S.money=9e6;
    ['shop_halb','shop_gross','shop_ost','shop_sued','lager','lager_nord','lager_gross','lager_sued','lager_west']
      .forEach(id=>{ bb.S.up[id]=true; if(bb.ZONEN[id]) bb.oeffneZone(id,false); });
    bb.applyZonen(); bb.navBuild();
    /* Nach dem Kauf fuehrt der Gang ins Lager. Zum Rueckgebaeude
       bleibt er zu - vom Verkauf geht es nur ueber das Lager
       weiter, so soll es sein. */
    out.gekauft_gang_west_offen = lauf(HINTEN.concat([[0,-7.5],[-9.5,-7.5]]));
    out.gekauft_gang_ost_bleibt_zu = !lauf(HINTEN.concat([[0,-7.5],[9.5,-7.5]]));
    out.gekauft_testfeld  = lauf(HINTEN.concat([[5.2,-10.5],[0,-14]]));
    return out;
  }),null,1));
  console.log(fehler.length?fehler.slice(0,3).join('\n'):'ERRORS: keine');
  await b.close();
})();

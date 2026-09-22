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
  const r=await p.evaluate(()=>{
    const bb=window.__bb;
    bb.S.level=40; bb.S.money=9e6;
    ['shop_gross','shop_ost','shop_sued','lager_gross','lager_sued','lager_west','packstation','onlineshop','kasse2','labor']
      .forEach(id=>{ bb.S.up[id]=true; if(bb.ZONEN[id]) bb.oeffneZone(id,false); });
    bb.applyZonen(); bb.navBuild();
    /* Laufweg: Spieler schrittweise zum Ziel schieben, Kollision wirkt */
    const geh=(zx,zz)=>{
      let last=null;
      for(let k=0;k<4000;k++){
        const pp=bb.playerPos();
        const dx=zx-pp.x, dz=zz-pp.z, d=Math.hypot(dx,dz);
        if(d<0.45) return {ok:true,x:+pp.x.toFixed(2),z:+pp.z.toFixed(2)};
        bb.schiebe(pp.x+dx/d*0.12, pp.z+dz/d*0.12);
        const np=bb.playerPos();
        if(last&&Math.hypot(np.x-last.x,np.z-last.z)<0.002&&k>30) break;
        last=np;
      }
      const pp=bb.playerPos(); return {ok:false,x:+pp.x.toFixed(2),z:+pp.z.toFixed(2)};
    };
    /* Wegpunkte durch die bekannten Tueren - der Test kann nicht
       selbst navigieren, er soll nur pruefen, ob eine Flaeche
       ueberhaupt zu betreten ist. */
    /* Wegpunkte durch die bekannten Tueren - der Test kann nicht
       selbst navigieren, er soll nur pruefen, ob eine Flaeche
       ueberhaupt zu betreten ist. */
    const TUER_HINTEN=[[5.2,-4.6],[5.2,-7.5]];
    const TUER_LAGER =[[-6.5,-2.5],[-9.5,-2.5]];
    const LAGER_SUED =TUER_LAGER.concat([[-14.0,-4.0],[-14.0,-8.0]]);
    const GROSSHANDEL=LAGER_SUED.concat([[-16.0,-20.5],[-21.0,-20.5],[-24.0,-20.5],[-30.0,-20.5]]);
    const ziele={
      'Ladenlokal 2 Ost'  :{p:[35.0,0.0]},
      'Rueckgebaeude Sued':{p:[35.0,-20.0],w:[[13.5,-4.0],[13.5,-9.0]]},
      'Rueckgeb. Suedwest':{p:[10.0,-20.0],w:[[13.5,-4.0],[13.5,-9.0]]},
      'Testfeld Sued'     :{p:[0.0,-26.5],w:TUER_HINTEN.concat([[5.2,-10.5]])},
      'Lagerhalle Sued'   :{p:[-14.0,-27.0],w:LAGER_SUED},
      'Lagergang (v. Lager)':{p:[-3.0,-7.5],w:LAGER_SUED.concat([[-12.0,-7.5],[-9.0,-7.5]])},
      'Schleuse'          :{p:[-23.0,-20.5],w:LAGER_SUED.concat([[-16.0,-20.5],[-21.0,-20.5]])},
      'Grosshandel Mitte' :{p:[-46.0,-26.0],w:GROSSHANDEL},
      'Grosshandel Sued'  :{p:[-60.0,-42.0],w:GROSSHANDEL},
      'Grosshandel Nord'  :{p:[-60.0,-10.0],w:GROSSHANDEL}
    };
    const lauf=(pfad)=>{ bb.setView(0,0,0,0); for(const w of pfad) if(!geh(w[0],w[1]).ok) return false; return true; };
    const out={};
    for(const k in ziele){
      bb.setView(0,0,0,0);
      const z2=ziele[k]; let ok=true;
      for(const w of (z2.w||[])) if(!geh(w[0],w[1]).ok) ok=false;
      const e=geh(z2.p[0],z2.p[1]); out[k]={ok:ok&&e.ok,x:e.x,z:e.z};
    }
    /* Vom Verkauf darf es KEINEN direkten Weg in den Gang geben -
       nur ueber das Lager. */
    bb.setView(0,0,0,0);
    const direkt=lauf([[13.5,-4.0],[13.5,-9.0],[9.0,-7.5],[5.0,-7.5]]);
    out['Verkauf->Gang direkt (muss zu sein)']={ok:!direkt,x:0,z:0};
    /* Schiebetuer auf, dann muss der Gehweg erreichbar sein */
    bb.setView(0,0,0,0); bb.tuerSet(1);
    const g2=geh(0,4.0).ok&&geh(0,9.0);
    out['Gehweg (Tuer auf)']=g2?{ok:g2.ok,x:g2.x,z:g2.z}:{ok:false,x:0,z:0};
    return out;
  });
  for(const k in r) console.log((r[k].ok?'  OK  ':'BLOCK ')+k.padEnd(20)+' -> x '+r[k].x+'  z '+r[k].z);
  console.log(fehler.length?fehler.slice(0,3).join('\n'):'ERRORS: keine');
  await b.close();
})();

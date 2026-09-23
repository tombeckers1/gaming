/* Die kleinen Ausbaustufen am Anfang: halbes Ladenlokal, halbes
   Lager, Testfeld erst nach Kauf. Geprueft wird, was man betreten
   kann - vor und nach jeder Stufe. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const fehler=[];
  p.on('pageerror',e=>fehler.push('PAGEERROR '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/ERR_CERT/.test(m.text())) fehler.push('CONSOLE '+m.text().slice(0,160)); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});

  /* Hilfsfunktionen in die Seite legen */
  await p.evaluate(()=>{
    const bb=window.__bb;
    window.__geh=(ziel)=>{
      let last=null;
      for(let k=0;k<4000;k++){
        const pp=bb.playerPos();
        const dx=ziel[0]-pp.x, dz=ziel[1]-pp.z, d=Math.hypot(dx,dz);
        if(d<0.45) return true;
        bb.schiebe(pp.x+dx/d*0.12, pp.z+dz/d*0.12);
        const np=bb.playerPos();
        if(last&&Math.hypot(np.x-last.x,np.z-last.z)<0.002&&k>30) break;
        last=np;
      }
      return false;
    };
    /* Ein Weg ist gegangen, wenn jeder Punkt erreicht wurde. */
    window.__weg=(start,punkte)=>{
      bb.setView(start[0],start[1],0,0);
      for(const q of punkte) if(!window.__geh(q)) return false;
      return true;
    };
    window.__kauf=(id)=>{ bb.S.up[id]=true; bb.oeffneZone(id,true); bb.applyZonen(); bb.navBuild(); };
    /* Steht das rote Band noch? */
    window.__band=()=>{
      let n=0;
      bb.scene.traverse(o=>{ if(o.isMesh&&o.visible&&o.userData&&o.userData.sperrband) n++; });
      return n;
    };
  });

  const START=[0,3.0];
  const mangel=[];
  const pruef=(name,ok,was)=>{ if(!ok) mangel.push(name+': '+was); };

  /* --- Wegpunkte --- */
  const OST   =[[1.0,3.0],[4.0,3.0],[6.0,0.0]];                 /* zweite Ladenhaelfte */
  const LAGER =[[-6.5,-2.5],[-9.5,-2.5],[-14.0,-2.0]];          /* Lager am Rolltor    */
  const LNORD =LAGER.concat([[-14.0,0.5],[-14.0,4.0]]);         /* Lager Nord          */
  const TFELD =[[1.0,3.0],[5.2,0.0],[5.2,-4.6],[5.2,-7.5],[5.2,-12.0]];

  const stand=async(titel)=>{
    const o=await p.evaluate(a=>{
      const bb=window.__bb, W=a;
      return {ost:window.__weg([0,3.0],W.OST), lager:window.__weg([0,3.0],W.LAGER),
              lnord:window.__weg([0,3.0],W.LNORD), testfeld:window.__weg([0,3.0],W.TFELD),
              band:window.__band()};
    },{OST,LAGER,LNORD,TFELD});
    console.log(titel.padEnd(11),JSON.stringify(o));
    return o;
  };

  /* --- Einrichtung steht in der Starthaelfte --- */
  const moebel=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    let k=null, lap=null;
    bb.scene.traverse(q=>{ if(q.userData&&q.userData.kind==='pos'){
      const w=new THREE.Vector3(); q.getWorldPosition(w); k=[+w.x.toFixed(2),+w.z.toFixed(2)]; } });
    o.kasse=k;
    bb.scene.traverse(q=>{ if(q.userData&&q.userData.kind==='laptop'){
      const w=new THREE.Vector3(); q.getWorldPosition(w); lap=[+w.x.toFixed(2),+w.z.toFixed(2)]; } });
    o.laptop=lap;
    o.slotsOffen=bb.slotsOffen().length;
    o.racksOffen=bb.RACKS.filter(r=>!r.zone||bb.zoneOffen(r.zone)).length;
    return o;
  });
  console.log('EINRICHTUNG',JSON.stringify(moebel));
  pruef('EINRICHTUNG',moebel.kasse[0]<2,'die Kasse steht hinter der Trennwand');
  pruef('EINRICHTUNG',moebel.laptop&&moebel.laptop[0]<2,'der Laptop steht hinter der Trennwand');
  pruef('EINRICHTUNG',moebel.slotsOffen===8,'die Starthaelfte hat nicht acht Regalplaetze, sondern '+moebel.slotsOffen);
  pruef('EINRICHTUNG',moebel.racksOffen===8,'das Startlager hat nicht acht Stellplaetze, sondern '+moebel.racksOffen);

  const a=await stand('START');
  pruef('START',a.lager===true,'das Lager am Rolltor ist nicht zu betreten');
  pruef('START',a.ost===false,'die zweite Ladenhaelfte ist schon offen');
  pruef('START',a.lnord===false,'das Lager Nord ist schon offen');
  pruef('START',a.testfeld===false,'das Testfeld ist schon offen');
  pruef('START',a.band>0,'an der Hintertuer haengt kein Absperrband');

  await p.evaluate(()=>window.__kauf('shop_halb'));
  const b2=await stand('SHOP_HALB');
  pruef('SHOP_HALB',b2.ost===true,'die zweite Ladenhaelfte bleibt zu');
  pruef('SHOP_HALB',b2.testfeld===false,'das Testfeld ist ohne eigenen Kauf offen');
  pruef('SHOP_HALB',b2.band>0,'das Absperrband ist zu frueh weg');
  pruef('SHOP_HALB',b2.lnord===false,'das Lager Nord geht mit der Ladenhaelfte auf');

  await p.evaluate(()=>window.__kauf('lager_nord'));
  const c=await stand('LAGER_NORD');
  pruef('LAGER_NORD',c.lnord===true,'das Lager Nord bleibt zu');
  pruef('LAGER_NORD',c.testfeld===false,'das Testfeld geht mit dem Lager auf');

  await p.evaluate(()=>window.__kauf('testfeld'));
  const d=await stand('TESTFELD');
  pruef('TESTFELD',d.testfeld===true,'das Testfeld bleibt zu');
  pruef('TESTFELD',d.band===0,'das Absperrband haengt noch');

  /* Nach dem Vollausbau steht keine Trennwand mehr im Weg */
  const voll=await p.evaluate(()=>{
    const bb=window.__bb;
    return {slots:bb.slotsOffen().length,
            racks:bb.RACKS.filter(r=>!r.zone||bb.zoneOffen(r.zone)).length};
  });
  console.log('AUSGEBAUT  ',JSON.stringify(voll));
  pruef('AUSGEBAUT',voll.slots===10,'nach dem Kauf sind nicht zehn Regalplaetze frei, sondern '+voll.slots);
  pruef('AUSGEBAUT',voll.racks===14,'nach dem Kauf sind nicht vierzehn Stellplaetze frei, sondern '+voll.racks);

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',fehler.length?fehler.join('\n'):'keine');
  await b.close();
})();

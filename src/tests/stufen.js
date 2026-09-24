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
    /* Nur die Baender in der Testfeldtuer - vor der Packstation
       haengen eigene. */
    window.__band=()=>{
      let n=0;
      bb.scene.traverse(o=>{ if(!o.isMesh||!o.visible||!o.userData||!o.userData.sperrband) return;
        const bx=new THREE.Box3().setFromObject(o);
        if(bx.min.x>4.0&&bx.max.x<6.5&&bx.min.z>-6.4&&bx.max.z<-5.6) n++; });
      return n;
    };
  });

  /* Keine Deckenleuchte darf in einer Wand stecken - vor und nach
     dem Ausbau. Die Leuchten sind waagerechte Scheiben unter der
     Decke, die Waende tragen ihre Grundflaeche in userData.aabb. */
  const leuchten=()=>p.evaluate(()=>{
    const bb=window.__bb, waende=[], treffer=[], scheiben=[];
    bb.scene.traverse(o=>{ if(o.isMesh&&o.visible&&o.userData&&o.userData.aabb)
      waende.push(new THREE.Box3().setFromObject(o)); });
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.visible||!o.geometry||o.geometry.type!=='PlaneGeometry') return;
      const bx=new THREE.Box3().setFromObject(o);
      if(bx.max.y-bx.min.y>0.06||bx.min.y<2.4) return;
      const br=bx.max.x-bx.min.x, ti=bx.max.z-bx.min.z;
      if(br<0.5||ti<0.15) return;
      if(br>3||ti>3) return;            /* Decken und Boeden sind keine Leuchten */
      for(const w of waende){
        if(bx.min.x<w.max.x-0.03&&bx.max.x>w.min.x+0.03&&
           bx.min.z<w.max.z-0.03&&bx.max.z>w.min.z+0.03&&
           bx.min.y<w.max.y&&bx.max.y>w.min.y){
          treffer.push(`x[${bx.min.x.toFixed(1)},${bx.max.x.toFixed(1)}] z[${bx.min.z.toFixed(1)},${bx.max.z.toFixed(1)}] y${bx.min.y.toFixed(2)}`);
          break; }
      }
    });
    /* Leuchtende Scheiben unter der Decke: flach, schmal, hoch
       oben. Eine zusammengefasste Reihe zaehlt genauso wie ein
       einzelnes Panel - beide duerfen nicht uebereinanderliegen. */
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.visible||!o.geometry) return;
      for(let q=o.parent;q;q=q.parent) if(!q.visible) return;
      const bx=new THREE.Box3().setFromObject(o);
      if(bx.max.y-bx.min.y>0.02||bx.min.y<2.4) return;
      const br=bx.max.x-bx.min.x, ti=bx.max.z-bx.min.z;
      if(Math.min(br,ti)>1.2||Math.min(br,ti)<0.05) return;
      if(Math.max(br,ti)<0.4) return;
      scheiben.push(bx);
    });
    for(let i=0;i<scheiben.length;i++) for(let j=i+1;j<scheiben.length;j++){
      const a=scheiben[i], b=scheiben[j];
      const ux=Math.min(a.max.x,b.max.x)-Math.max(a.min.x,b.min.x);
      const uz=Math.min(a.max.z,b.max.z)-Math.max(a.min.z,b.min.z);
      const uy=Math.min(a.max.y,b.max.y)-Math.max(a.min.y,b.min.y);
      if(ux>0.1&&uz>0.1&&uy>-0.08)
        treffer.push(`zwei Leuchten ineinander bei x[${a.min.x.toFixed(1)},${a.max.x.toFixed(1)}] z[${a.min.z.toFixed(1)},${a.max.z.toFixed(1)}]`);
    }
    return treffer;
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

  const lVor=await leuchten();
  console.log('LEUCHTEN0  ',lVor.length?lVor.join(' | '):'keine steckt in einer Wand');
  pruef('LEUCHTEN0',lVor.length===0,lVor.length+' Beanstandungen an den Deckenleuchten am Anfang');

  const a=await stand('START');
  /* Seit den Kapiteln ist der Start ein Kiosk: das Lager ist gesperrt,
     bis es gekauft wird */
  pruef('START',a.lager===false,'im Kiosk ist das Lager schon zu betreten');
  await p.evaluate(()=>window.__kauf('lager'));
  const a2=await stand('LAGER');
  pruef('LAGER',a2.lager===true,'nach dem Kauf ist das Lager am Rolltor nicht zu betreten');
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

  await p.evaluate(()=>{ window.__kauf('lager'); window.__kauf('lager_nord'); });
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

  const lNach=await leuchten();
  console.log('LEUCHTEN   ',lNach.length?lNach.join(' | '):'keine steckt in einer Wand');
  pruef('LEUCHTEN',lNach.length===0,lNach.length+' Beanstandungen an den Deckenleuchten');

  /* Die Packstation steht von Anfang an da, mit Absperrband davor.
     Man soll sehen, was man sich damit kauft. */
  const pack=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    const sicht=()=>{ let n=0; bb.scene.traverse(q=>{
      if(q.isMesh&&q.visible&&q.userData&&q.userData.sperrband){
        const bx=new THREE.Box3().setFromObject(q);
        if(bx.min.z<-6.5) n++; } }); return n; };
    const tisch=()=>{ let v=false; let q=bb.packTisch;
      if(!q) return false; v=q.visible; for(let a=q.parent;a;a=a.parent) if(!a.visible) v=false;
      return v; };
    bb.S.up.packstation=false; bb.applyZonen();
    o.tischVorKauf=tisch(); o.bandVorKauf=sicht();
    bb.S.level=99; bb.S.money=9e6;
    ['lager','lager_nord','lager_gross','packstation'].forEach(id=>bb.testKauf(id));
    o.gekauft=!!bb.S.up.packstation;
    o.tischNachKauf=tisch(); o.bandNachKauf=sicht();
    return o;
  });
  console.log('PACKSTATION',JSON.stringify(pack));
  pruef('PACKSTATION',pack.tischVorKauf===true,'die Packstation ist vor dem Kauf unsichtbar');
  pruef('PACKSTATION',pack.bandVorKauf>0,'vor der Packstation haengt kein Absperrband');
  pruef('PACKSTATION',pack.gekauft===true,'die Packstation laesst sich nicht kaufen');
  pruef('PACKSTATION',pack.tischNachKauf===true,'die Packstation ist nach dem Kauf weg');
  pruef('PACKSTATION',pack.bandNachKauf===0,'das Absperrband haengt nach dem Kauf noch');

  /* Das Schild ueber der Tuer bleibt auch nach dem Kauf haengen */
  const schild=await p.evaluate(()=>{
    const bb=window.__bb; let n=0;
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.visible||!o.material||!o.material.map||!o.material.map.image) return;
      const im=o.material.map.image; if(im.width!==280||im.height!==70) return;
      const bx=new THREE.Box3().setFromObject(o);
      if(bx.min.x>4.0&&bx.max.x<6.5&&bx.min.z>-6.3&&bx.max.z<-5.6) n++; });
    return n;
  });
  console.log('SCHILD     ',JSON.stringify({ueberDerTuer:schild}));
  pruef('SCHILD',schild===1,'ueber der Testfeldtuer haengt kein Schild mehr');

  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',fehler.length||mangel.length?fehler.concat(mangel).join('\n'):'keine');
  await b.close();
})();

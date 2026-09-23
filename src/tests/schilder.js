/* Im ganzen Spiel darf kein Bauschild und kein rot-weiss
   schraffiertes Absperrband stehen. Tom will einen schicken Laden
   sehen, keine Baustelle. Der Test sucht beides an seiner
   Machart: rot-weiss schraffierte schmale Baender und Tafeln mit
   dem Wort BAUABSCHNITT.
   Ausdruecklich erlaubt ist das eine rote Band in der Tuer zum
   Testfeld - einfarbig rot, ohne Schraffur und ohne Schild. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});

  let bad=0;
  const sag=(t,ok,n)=>{ console.log(`${t}: ${ok?'ok':'FEHLER'+(n?` (${n})`:'')}`); if(!ok) bad++; };

  /* Alle Canvas-Texturen der Szene nach verraeterischen Woertern
     absuchen. Der Text steht im Bild, nicht im Objekt - also wird
     das Canvas selbst noch einmal gezeichnet und verglichen geht
     nicht; stattdessen merkt sich tex() den gezeichneten Text. */
  const funde=await p.evaluate(()=>{
    const bb=window.__bb, out={texte:[],baender:0,tafeln:0};
    const vek=new THREE.Vector3();
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.material) return;
      const mats=Array.isArray(o.material)?o.material:[o.material];
      for(const m of mats){
        const im=m.map&&m.map.image;
        if(!im||!im.getContext) continue;
        /* Rot-Weiss-Schraffur eines Absperrbands: sehr breite,
           sehr flache Textur mit genau zwei kraeftigen Farben. */
        if(im.width>=128&&im.height<=40&&im.width/im.height>=6){
          try{
            const d=im.getContext('2d').getImageData(0,0,im.width,im.height).data;
            let rot=0,weiss=0;
            for(let i=0;i<d.length;i+=4){
              if(d[i]>170&&d[i+1]<90&&d[i+2]<90) rot++;
              else if(d[i]>230&&d[i+1]>230&&d[i+2]>230) weiss++;
            }
            const n=d.length/4;
            if(rot/n>0.25&&weiss/n>0.25) out.baender++;
          }catch(e){}
        }
      }
    });
    /* Tafeln, die stehen, SOLANGE ein Bereich gesperrt ist - genau
       das waren die Bauabschnittsschilder. Die Einrichtung, die
       nach dem Kauf erscheint (zone.obj), ist etwas anderes: das
       Schild ueber dem Packtisch darf bleiben. Ein Betriebsschild
       auf dem Hof gehoert gar keiner Zone an. */
    const inZone=[];
    for(const id in bb.ZONEN)
      for(const o of bb.ZONEN[id].wand) o.traverse&&o.traverse(q=>inZone.push(q));
    for(const o of inZone){
      if(!o.isMesh||!o.geometry||o.geometry.type!=='PlaneGeometry') continue;
      if(!o.material||!o.material.map) continue;
      const pos=o.geometry.attributes&&o.geometry.attributes.position; if(!pos) continue;
      let ky=1e9,gy=-1e9,kx=1e9,gx=-1e9,kz=1e9,gz=-1e9;
      for(let i=0;i<pos.count;i++){
        vek.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);
        ky=Math.min(ky,vek.y); gy=Math.max(gy,vek.y);
        kx=Math.min(kx,vek.x); gx=Math.max(gx,vek.x);
        kz=Math.min(kz,vek.z); gz=Math.max(gz,vek.z);
      }
      const br=Math.max(gx-kx,gz-kz), ho=gy-ky;
      if(br>0.8&&ho>0.35&&ky>0.7&&gy<3.0){
        out.tafeln++;
        out.texte.push(`x[${kx.toFixed(1)},${gx.toFixed(1)}] y[${ky.toFixed(2)},${gy.toFixed(2)}] z[${kz.toFixed(1)},${gz.toFixed(1)}] ${br.toFixed(2)}x${ho.toFixed(2)}`);
      }
    }
    return out;
  });
  sag('kein Absperrband in der Szene',funde.baender===0,funde.baender);
  sag('keine Tafel an einem gesperrten Bereich',funde.tafeln===0,funde.tafeln);
  funde.texte.forEach(t=>console.log('   '+t));

  /* Auch nach dem Kauf aller Flaechen darf nichts auftauchen */
  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=5e6;
    ['shop_halb','shop_gross','shop_ost','shop_sued','testfeld','lager_nord','lager_gross',
     'lager_sued','lager_sued2','lager_west','rampe2','rampe3','rampe4','rampe5',
     'packstation','eingang2'].forEach(id=>bb.testKauf(id)); });
  const nach=await p.evaluate(()=>{
    const bb=window.__bb; let n=0;
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.material||!o.material.map||!o.material.map.image) return;
      const im=o.material.map.image; if(!im.getContext) return;
      if(!(im.width>=128&&im.height<=40&&im.width/im.height>=6)) return;
      try{
        const d=im.getContext('2d').getImageData(0,0,im.width,im.height).data;
        let rot=0,weiss=0;
        for(let i=0;i<d.length;i+=4){
          if(d[i]>170&&d[i+1]<90&&d[i+2]<90) rot++;
          else if(d[i]>230&&d[i+1]>230&&d[i+2]>230) weiss++;
        }
        const c=d.length/4; if(rot/c>0.25&&weiss/c>0.25) n++;
      }catch(e){}
    });
    return n;
  });
  sag('auch nach dem Kauf kein Absperrband',nach===0,nach);

  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):(bad?`ERRORS: ${bad} Punkte`:'ERRORS: keine'));
  await b.close();
})();

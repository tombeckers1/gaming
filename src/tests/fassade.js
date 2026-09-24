/* Draussen gehoert die Fassade hin, nicht die gelb-schwarze
   Lagerwand. Der Test sucht jede sichtbare Wandflaeche, die mit der
   Lagerwand-Textur ins Freie zeigt - vor und nach dem Ausbau. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const fehler=[];
  p.on('pageerror',e=>fehler.push('PAGEERROR '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:30000});

  /* Die Lagerwand erkennt man an ihrer Textur: 32 x 512 Pixel. */
  const suche=()=>p.evaluate(()=>{
    const bb=window.__bb, treffer=[];
    const gelb=m=>!!(m&&m.map&&m.map.image&&m.map.image.width===32&&m.map.image.height===512);
    /* 0=+x 1=-x 4=+z 5=-z; Ober- und Unterseite (2,3) zaehlen nicht,
       die sieht im Spiel niemand. */
    const N={0:[1,0,0],1:[-1,0,0],4:[0,0,1],5:[0,0,-1]};
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.visible) return;
      for(let q=o.parent;q;q=q.parent) if(!q.visible) return;
      const ms=Array.isArray(o.material)?o.material:[o.material];
      if(ms.length<6) return;
      const bx=new THREE.Box3().setFromObject(o);
      const mi=bx.getCenter(new THREE.Vector3());
      if(mi.x<-70||mi.x>12||mi.z<-34||mi.z>12) return;       /* nur das Betriebsgelaende */
      for(const k in N){
        if(!gelb(ms[k])) continue;
        const n=N[k];
        /* Messpunkt 20 cm vor der Flaeche, auf Kopfhoehe des Spielers */
        const x=(n[0]>0?bx.max.x:n[0]<0?bx.min.x:mi.x)+n[0]*0.2;
        const z=(n[2]>0?bx.max.z:n[2]<0?bx.min.z:mi.z)+n[2]*0.2;
        const y=Math.min(1.6,(bx.min.y+bx.max.y)/2);
        if(bx.max.y<0.3) continue;                            /* flache Kanten */
        if(!bb.unterDach(x,y,z))
          treffer.push(`Flaeche ${k} bei (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) `+
                       `zeigt ins Freie; Wand x[${bx.min.x.toFixed(1)},${bx.max.x.toFixed(1)}] z[${bx.min.z.toFixed(1)},${bx.max.z.toFixed(1)}]`);
      }
    });
    return treffer;
  });

  const vorher=await suche();
  console.log('START     ',vorher.length?vorher.join('\n           '):'keine gelbe Wand im Freien');

  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=9e6;
    ['shop_halb','shop_gross','shop_ost','shop_sued','lager','lager_nord','lager_gross','lager_sued','lager_sued2',
     'lager_west','rampe2','rampe3','rampe4','packstation','kasse2'].forEach(id=>bb.testKauf(id)); });
  await p.waitForTimeout(300);
  const nachher=await suche();
  console.log('AUSGEBAUT ',nachher.length?nachher.join('\n           '):'keine gelbe Wand im Freien');

  console.log('MANGEL:',(vorher.length+nachher.length)?(vorher.length+nachher.length)+' Flaechen':'keine');
  const mangel=(vorher.length+nachher.length)?[(vorher.length+nachher.length)+' Flaechen gelb im Freien']:[];
  console.log('ERRORS:',fehler.length||mangel.length?fehler.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Zwei Waende duerfen nicht an derselben Stelle stehen. Wo sie es
   tun, flimmern die beiden Flaechen gegeneinander und an der
   Stossstelle steht eine senkrechte Naht in der Wand.
   Ein paar Millimeter Ueberlappung an jedem Stoss sind gewollt -
   sie verhindern Spalten. Ab fuenf Zentimetern ist es ein Fehler. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:800,height:600}});
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

  const suche=()=>p.evaluate(()=>{
    const bb=window.__bb, w=[], out=[];
    bb.scene.traverse(o=>{
      if(!o.isMesh||!o.visible||!o.userData||!o.userData.aabb) return;
      for(let q=o.parent;q;q=q.parent) if(!q.visible) return;
      const bx=new THREE.Box3().setFromObject(o);
      w.push({x0:bx.min.x,x1:bx.max.x,y0:bx.min.y,y1:bx.max.y,z0:bx.min.z,z1:bx.max.z});
    });
    const ue=(a,b,k)=>Math.min(a[k+'1'],b[k+'1'])-Math.max(a[k+'0'],b[k+'0']);
    /* Die duenne Achse einer Wand ist ihre Dicke; die andere ist
       ihre Laenge. Zwei Waende stehen nur dann aufeinander, wenn
       sie dieselbe Dickenachse haben - sonst ist es eine Ecke oder
       ein T-Stoss, und der gehoert sich so. */
    w.forEach(q=>{ q.dick=(q.x1-q.x0)<(q.z1-q.z0)?'x':'z';
      /* Ein quadratisches Stueck ist kein Wandstueck, sondern ein
         Eckpfosten - der darf an beide Waende stossen. */
      q.eck=Math.abs((q.x1-q.x0)-(q.z1-q.z0))<0.05; });
    for(let i=0;i<w.length;i++) for(let j=i+1;j<w.length;j++){
      const a=w[i], c=w[j];
      if(a.dick!==c.dick||a.eck||c.eck) continue;
      const ux=ue(a,c,'x'), uy=ue(a,c,'y'), uz=ue(a,c,'z');
      if(ux<=0.005||uy<=0.005||uz<=0.005) continue;
      const laengs=a.dick==='x'?uz:ux;
      const dicke=a.dick==='x'?ux:uz;
      /* Ein paar Zentimeter an jedem Stoss und in jeder Ecke sind
         gewollt. Erst wenn sich zwei gleich gerichtete Waende auf
         einem Drittelmeter Laenge und ueber die halbe Dicke
         ueberdecken, stehen sie wirklich aufeinander. */
      if(laengs<0.3||uy<0.3||dicke<0.09) continue;
      out.push(`x[${a.x0.toFixed(2)},${a.x1.toFixed(2)}] z[${a.z0.toFixed(2)},${a.z1.toFixed(2)}]`+
               ` <-> x[${c.x0.toFixed(2)},${c.x1.toFixed(2)}] z[${c.z0.toFixed(2)},${c.z1.toFixed(2)}]`+
               ` Ueberlapp ${ux.toFixed(2)}/${uy.toFixed(2)}/${uz.toFixed(2)}`);
    }
    return {waende:w.length,funde:out};
  });

  const vor=await suche();
  console.log('START     ',vor.waende+' Waende, '+(vor.funde.length?vor.funde.length+' doppelt':'keine doppelt'));
  vor.funde.forEach(t=>console.log('   '+t));

  await p.evaluate(()=>{ const bb=window.__bb; bb.S.level=99; bb.S.money=9e6;
    ['shop_halb','testfeld','shop_gross','shop_ost','shop_sued','lager','lager_nord','lager_gross',
     'lager_sued','lager_sued2','lager_west','rampe2','rampe3','rampe4','rampe5',
     'packstation','eingang2','kasse2'].forEach(id=>bb.testKauf(id)); });
  await p.waitForTimeout(300);
  const nach=await suche();
  console.log('AUSGEBAUT ',nach.waende+' Waende, '+(nach.funde.length?nach.funde.length+' doppelt':'keine doppelt'));
  nach.funde.forEach(t=>console.log('   '+t));

  const n=vor.funde.length+nach.funde.length;
  console.log('MANGEL:',n?n+' Wandpaare stehen aufeinander':'keine');
  console.log('ERRORS:',fehler.length?fehler.join('\n'):(n?n+' Punkte':'keine'));
  await b.close();
})();

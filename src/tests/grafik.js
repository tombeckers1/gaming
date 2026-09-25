/* Feuerwerksgrafik (Toms Vorlagen vom 23.09.):
   - jeder Stern zieht eine Leuchtspur; Weiden haengen lang, eine
     Peonie hat kurze Strahlen
   - die Spur liegt auf der Flugbahn: ihr Ende zeigt zur Bruchmitte
   - Riesenfontaenen: Goldgeysir ueber 8 m, Feuersaeule ueber 12 m
   - Kugelbomben: jede Stufe groesser, 300 mm mit 12 Bruechen auf einmal
   - der Salvenverbund zuendet sechs Schuesse auf einmal */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const r=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const ps=bb.psBig;
    /* Spurlaenge: Abstand vom Kopf zum Ende der Linie je Stern */
    const spur=(eff)=>{
      bb.run(8,0.05);
      const p0={x:0,y:20,z:-30};
      const fn=()=>bb.EFF[eff](p0,bb.FW.gold,bb.FW.rot,1.2);
      /* wie im Spiel: mit der Spurlaenge des Bruchbilds */
      bb.mitSchweif(eff,fn);
      bb.run(1.2,0.05);
      /* Spuren rechnet der Shader; spurEnden rechnet sie genauso nach */
      const n=ps.lines&&ps.lines.visible?ps.nl:0;
      let lang=0, zurMitte=0, zaehl=0;
      for(let q=0;q<n;q++){
        const [[hx,hy,hz],[ex,ey,ez]]=bb.spurEnden(ps,q);
        const L=Math.hypot(hx-ex,hy-ey,hz-ez); lang+=L; zaehl++;
        const dk=Math.hypot(hx-p0.x,hy-p0.y,hz-p0.z), de=Math.hypot(ex-p0.x,ey-p0.y,ez-p0.z);
        if(de<dk) zurMitte++;
      }
      return {segmente:n,mittel:zaehl?+(lang/zaehl).toFixed(2):0,zurMitte:zaehl?+(zurMitte/zaehl).toFixed(2):0};
    };
    o.kugel=spur('kugel'); o.weide=spur('weide'); o.blink=spur('blink');
    /* Fontaenen: hoechster Funke */
    const hoch=(t,sek)=>{ bb.run(10,0.1); bb.igniteType(t,{x:3,y:0.95,z:-18,ab:0.1,jit:0.05}); let h=0;
      for(let i=0;i<sek*10;i++){ bb.run(0.1,0.05); for(let k=0;k<bb.psMid.max;k++) if(bb.psMid.life[k]>0) h=Math.max(h,bb.psMid.pos[k*3+1]); }
      bb.run(35,0.1); return +h.toFixed(1); };
    o.geysir=hoch('goldgeysir',5); o.saeule=hoch('feuersaeule',5); o.fontaene=hoch('fontaene',4);
    /* Kugelbomben: Ausdehnung 1,5 s nach dem Bruch */
    const weite=kal=>{ bb.run(14,0.1); const pad={x:5,y:1.7,z:-23}; bb.kugelbombe(pad,kal,{eff:'kugel'});
      let brP=null; for(let i=0;i<80&&!brP;i++){ const r0=bb.rockets.slice(-1)[0]; const pp=r0&&{x:r0.p.x,y:r0.p.y,z:r0.p.z}; bb.run(0.05,0.05); if(!bb.rockets.length&&pp) brP=pp; }
      bb.run(1.5,0.05); let w=0;
      for(let k=0;k<ps.max;k++) if(ps.life[k]>0) w=Math.max(w,Math.hypot(ps.pos[k*3]-brP.x,ps.pos[k*3+2]-brP.z));
      bb.run(10,0.1); return +w.toFixed(1); };
    o.weiten=[1,2,3,4,5].map(weite);
    /* 300 mm: gleichzeitige Brueche */
    bb.run(14,0.1);
    const zeiten=[]; let uhr=0; const orig={};
    Object.keys(bb.EFF).forEach(k=>{ orig[k]=bb.EFF[k]; bb.EFF[k]=function(){ zeiten.push(+uhr.toFixed(2)); return orig[k].apply(this,arguments); }; });
    bb.kugelbombe({x:5,y:1.7,z:-23},5);
    for(let i=0;i<140;i++){ bb.run(0.05,0.05); uhr+=0.05; }
    Object.keys(orig).forEach(k=>{ bb.EFF[k]=orig[k]; });
    const pz={}; zeiten.forEach(t=>{ pz[t]=(pz[t]||0)+1; });
    o.k300=Math.max(...Object.values(pz)); o.k300gesamt=zeiten.length;
    bb.run(10,0.1);
    /* Donnerwand: Salven von sechs */
    const sh=bb.SHOWS.donnerwand();
    o.salven=sh.filter(ph=>ph.n>=6&&ph.gap<=0.1).length; o.phasen=sh.filter(ph=>ph.n).length; o.auftakt=!!(sh[0].ground&&!sh[0].n);
    return o;
  });
  console.log('SPUREN  ',JSON.stringify({kugel:r.kugel,weide:r.weide,blink:r.blink}));
  console.log('FONTAENE',JSON.stringify({geysir:r.geysir,saeule:r.saeule,fontaene:r.fontaene}));
  console.log('KUGELN  ',JSON.stringify({weiten:r.weiten,k300:r.k300,gesamt:r.k300gesamt}));
  console.log('SALVEN  ',JSON.stringify({salven:r.salven,phasen:r.phasen}));
  pruef('SPUREN',r.kugel.segmente>20&&r.weide.segmente>20,'keine Leuchtspuren: '+r.kugel.segmente+'/'+r.weide.segmente);
  pruef('SPUREN',r.weide.mittel>r.kugel.mittel*2,'Weide ('+r.weide.mittel+' m) nicht deutlich laenger als Peonie ('+r.kugel.mittel+' m)');
  pruef('SPUREN',r.kugel.zurMitte>0.9&&r.weide.zurMitte>0.9,'Spuren zeigen nicht zur Bruchmitte: '+r.kugel.zurMitte+'/'+r.weide.zurMitte);
  pruef('SPUREN',r.blink.segmente===0,'Blinksterne ziehen Spuren ('+r.blink.segmente+')');
  pruef('FONTAENE',r.geysir>8&&r.saeule>12&&r.saeule>r.geysir&&r.geysir>r.fontaene*1.5,'Hoehen '+r.geysir+' / '+r.saeule+' / normale '+r.fontaene);
  pruef('KUGELN',r.weiten.every((w,i)=>i===0||w>r.weiten[i-1]),'Kugeln werden nicht mit dem Kaliber groesser: '+r.weiten);
  pruef('KUGELN',r.k300>=12,'300 mm: nur '+r.k300+' Brueche gleichzeitig');
  pruef('SALVEN',r.salven===r.phasen&&r.salven>=20,'Donnerwand: '+r.salven+' Salven von '+r.phasen);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Gitterboxen und Verkaufstische (Tom, 02.10.):
   - HOCH: die Wanne der Gitterbox liegt so hoch, dass man sich nicht
     buecken muss (Boden mindestens 0,6 m), darunter zwei Faecher
   - GROESSEN: drei Gitterboxen, je groesser, desto mehr passt hinein;
     ein grosser Verkaufstisch neben dem normalen
   - WEISS: Tischplatte nicht gelb/holzfarben, sondern hell (weiss)
   - SCHILD: kein "REGAL FREI" - leere Tische/Gitterboxen ohne Schild,
     leere Regale ohne Schrift im Kopf
   - PLATZ: aufgebaute Moebel ueberlappen sich nicht
   Aufruf: node moebelneu.js test.html */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, S=bb.S, K=bb.SHELFKIND||{}, o={};
    S.level=26; S.money=1e7; S.up.shop_gross=true; try{ bb.applyZonen(); }catch(e){}
    const kinds=['gitter','gitter2','gitter3','tisch','tischgross'];
    o.da=kinds.filter(k=>!!(bb.regalOf&&bb.regalOf(k)));
    o.gitter=['gitter','gitter2','gitter3'].filter(k=>K[k]).map(k=>({k,boden:K[k].lv[K[k].lv.length-1],faecher:K[k].lv.length-1,w:K[k].w}));
    /* Fassungsvermoegen der Wanne fuer eine mittlere Batterie */
    o.cap={};
    for(const k of kinds){ const n0=bb.shelves.length; bb.regalStellen(k); const sh=bb.shelves[bb.shelves.length-1]; if(bb.shelves.length===n0) continue;
      const lv=sh.levels[sh.levels.length-1]; let n=0; while(n<400&&bb.addToLevel(lv,'batterie49',1)) n++; o.cap[k]=n;
      /* wieder leeren: Kopfschild muss verschwinden */
      while(lv.count>0) bb.removeFromLevel(lv);
      o['kopf_'+k]=sh.kopfG?sh.kopfG.visible:'kein kopfG'; }
    /* Tischfarbe */
    const RF=bb.regalFarben(K.tisch||{}), c=RF.platte, lum=((c>>16&255)*0.2126+(c>>8&255)*0.7152+(c&255)*0.0722)/255;
    o.platte='#'+c.toString(16).padStart(6,'0'); o.platteHell=+lum.toFixed(2); o.platteGelb=((c>>16&255)-(c&255));
    /* leeres normales Regal: Kopf ohne Schrift (wenige Farben im Schild) */
    bb.regalStellen('standard'); const sh=bb.shelves[bb.shelves.length-1]; bb.updateHead(sh);
    const cv=sh.headTex.image, d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data, farben=new Set();
    for(let i=0;i<d.length;i+=16) farben.add(d[i]+','+d[i+1]+','+d[i+2]); o.kopfFarben=farben.size;
    /* Ueberlappung aller aufgebauten Moebel */
    const R=s=>{ const k=bb.kindOf(s), w=(k.fw||k.w)/2, dd=(k.fd||k.d)/2, q=Math.abs(Math.round(Math.sin(s.g.rotation.y))); const x=s.g.position.x, z=s.g.position.z;
      return q?[x-dd,x+dd,z-w,z+w]:[x-w,x+w,z-dd,z+dd]; };
    o.ueberlapp=[]; bb.shelves.forEach((a,i)=>bb.shelves.forEach((c2,j)=>{ if(j<=i) return; const A=R(a), B=R(c2);
      if(A[0]<B[1]-0.02&&A[1]>B[0]+0.02&&A[2]<B[3]-0.02&&A[3]>B[2]+0.02) o.ueberlapp.push(bb.kindOf(a).id+'/'+bb.kindOf(c2).id); }));
    return o; });
  console.log(JSON.stringify(r));
  const m=[];
  if(r.da.length!==5) m.push('ARTEN: nur '+r.da.join(','));
  r.gitter.forEach(g=>{ if(g.boden<0.6) m.push(`HOCH ${g.k}: Wanne auf ${g.boden} m`); if(g.faecher<2) m.push(`FAECHER ${g.k}: ${g.faecher} Faecher darunter`); });
  if(!(r.cap.gitter<r.cap.gitter2&&r.cap.gitter2<r.cap.gitter3)) m.push('GROESSEN Gitterbox: '+JSON.stringify(r.cap));
  /* die kleine Gitterbox fasst mindestens so viel wie die alte (8 Feuersturm) */
  if(!(r.cap.gitter>=8)) m.push('GROESSEN kleine Gitterbox fasst weniger als vorher: '+r.cap.gitter);
  if(!(r.cap.tisch<r.cap.tischgross)) m.push('GROESSEN Tisch: '+JSON.stringify(r.cap));
  if(r.platteHell<0.85||r.platteGelb>20) m.push('WEISS: Tischplatte '+r.platte);
  ['gitter','gitter2','gitter3','tisch','tischgross'].forEach(k=>{ if(r['kopf_'+k]!==false) m.push(`SCHILD ${k}: leer mit Schild (${r['kopf_'+k]})`); });
  if(r.kopfFarben>8) m.push('SCHILD Regal: leerer Kopf mit Schrift ('+r.kopfFarben+' Farben)');
  if(r.ueberlapp.length) m.push('PLATZ: '+r.ueberlapp.join(' '));
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

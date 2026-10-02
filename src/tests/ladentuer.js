/* Ladentuer und Warenannahme von aussen (Tom, 02.10., zwei Fotos):
   - FLUEGEL: die Schiebefluegel beider Eingaenge fuhren beim Oeffnen
     aussen vor der Fassade in Sockel, Sohlbank und Fensterrahmen. Jeder
     Fluegel liegt jetzt in jeder Stellung (zu, halb, offen) ganz innen
     vor der Fassade (z < 5,90) und schneidet keinen Sockel (Unterkante
     0,62 m, z ab 6,03).
   - MARKE: die gelbe Warenannahme lag flach auf 2 cm, der Gehweg steigt
     aber zum Bord hin an - zur Strasse hin verschwanden Rahmen und Schrift
     unter den Platten. Jeder Punkt der Markierung liegt jetzt ueber der
     Gehwegflaeche.
   Aufruf: node -r ladezeit-preload.js ladentuer.js real.html
   Gegenprobe (02.10.): alter Stand -> FLUEGEL (alle Fluegel aussen bis
   z 6,17, offen im Sockel) und MARKE (bis 2,7 cm unter dem Gehweg). */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:60000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}}); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, T=bb.THREE||window.THREE, o={fluegel:[],marke:[],n:0};
    bb.S.up.shop_halb=true; bb.S.up.shop_gross=true; bb.S.up.shop_ost=true; bb.S.up.eingang2=true; bb.applyZonen();
    bb.TUEREN.forEach((d,di)=>{ for(const t of [0,0.5,1]){ bb.tuerSetD(d,t); d.g.updateMatrixWorld(true);
      d.leaves.forEach((lf,li)=>{ const bx=new T.Box3().setFromObject(lf); o.n++;
        if(bx.max.z>5.9) o.fluegel.push(`Tuer ${di+1} Fluegel ${li+1} bei ${Math.round(t*100)} %: reicht bis z ${bx.max.z.toFixed(2)} (Fassade innen 5,90)`);
        if(bx.max.z>6.03&&bx.min.y<0.62&&Math.abs((bx.min.x+bx.max.x)/2-d.cx)>1.3) o.fluegel.push(`Tuer ${di+1} Fluegel ${li+1} bei ${Math.round(t*100)} %: im Sockel`); }); }
      bb.tuerSetD(d,0); });
    /* die Markierung: das Mesh mit WARENANNAHME-Textur nahe WA */
    let mk=null; bb.scene.traverse(m=>{ if(mk||!m.isMesh||!m.material||!m.material.map||!m.material.transparent) return;
      const g=m.geometry; if(!g||!g.attributes.position) return; g.computeBoundingBox(); const bb2=g.boundingBox.clone().applyMatrix4(m.matrixWorld);
      if(Math.abs((bb2.min.x+bb2.max.x)/2-bb.WA.x)<0.1&&Math.abs((bb2.min.z+bb2.max.z)/2-bb.WA.z)<0.1&&bb2.max.x-bb2.min.x>2.5) mk=m; });
    if(!mk) o.marke.push('Markierung nicht gefunden');
    else { mk.updateMatrixWorld(true); const pa=mk.geometry.attributes.position, v=new T.Vector3(); let unter=0, tief=0;
      /* Gehweg von oben abtasten */
      const ray=new T.Raycaster(); const boden=[]; bb.scene.traverse(m=>{ if(m.isMesh&&m!==mk&&m.visible) boden.push(m); });
      for(let i=0;i<pa.count;i+=Math.max(1,Math.floor(pa.count/120))){ v.fromBufferAttribute(pa,i).applyMatrix4(mk.matrixWorld);
        ray.set(new T.Vector3(v.x,1.0,v.z),new T.Vector3(0,-1,0)); ray.far=1.2;
        const h=ray.intersectObjects(boden,false).filter(x=>x.point.y<0.5);
        if(h.length&&h[0].point.y>v.y-0.002){ unter++; tief=Math.max(tief,h[0].point.y-v.y); } }
      if(unter) o.marke.push(`${unter} Punkte der Markierung unter der Gehwegflaeche (bis ${(tief*100).toFixed(1)} cm)`); }
    return o; });
  console.log('Fluegelstellungen geprueft:',r.n);
  const m=[]; if(r.fluegel.length) m.push('FLUEGEL '+r.fluegel.length+'x: '+r.fluegel.slice(0,6).join(' | ')); if(r.marke.length) m.push('MARKE: '+r.marke.join(' | '));
  console.log('MANGEL:',m.join('\n')||'keine');
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

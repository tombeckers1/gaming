/* Grafikfehler aus Toms Fotos vom 23.09.: jede Stelle einzeln
   nachgemessen, mit allen Ausbauten gekauft.
   1 Flimmern: zwei Flaechen gleicher Richtung in derselben Ebene,
     verschiedene Materialien - an den bekannten Stellen (Lagergang an
     beiden Kopfwaenden, Ladenschild vor dem Traufkasten).
   2 Das freie Wandende bei x = 8 traegt die Wandfarbe.
   3 In der offenen Tuer des zweiten Eingangs steht nichts.
   4 Muelleimer und Poller stehen nicht ineinander.
   Braucht echtes three.js. */
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

  const r=await p.evaluate(()=>{
    const bb=window.__bb, o={};
    bb.S.level=99; bb.S.money=9e7;
    bb.UPGRADES.forEach(u=>{ try{ bb.testKauf(u.id); }catch(e){} });
    bb.scene.updateMatrixWorld(true);
    const sicht=q=>{ for(let a=q;a;a=a.parent) if(!a.visible) return false; return true; };
    const boxen=[];
    bb.scene.traverse(q=>{ if(q.isMesh&&sicht(q)&&q.geometry&&q.geometry.type==='BoxGeometry')
      boxen.push({q,bx:new THREE.Box3().setFromObject(q)}); });
    /* Vertikale Flaeche in Ebene achse=pos mit Blickrichtung sg,
       innerhalb des Fensters: welche Meshes haben dort eine Seite? */
    const seiten=(achse,pos,sg,a0,a1,y0,y1)=>{
      const out=[];
      boxen.forEach(({q,bx})=>{
        const f=achse==='x'?(sg>0?bx.max.x:bx.min.x):(sg>0?bx.max.z:bx.min.z);
        if(Math.abs(f-pos)>0.002) return;
        const b0=achse==='x'?bx.min.z:bx.min.x, b1=achse==='x'?bx.max.z:bx.max.x;
        if(Math.min(b1,a1)-Math.max(b0,a0)<0.02) return;
        if(Math.min(bx.max.y,y1)-Math.max(bx.min.y,y0)<0.02) return;
        const k=achse==='x'?(sg>0?0:1):(sg>0?4:5);
        const m=Array.isArray(q.material)?q.material[k]:q.material;
        out.push(m);
      });
      return new Set(out).size;
    };
    /* Lagergang-Enden: Innenflaeche der Halle hinterm Laden (x=8, +x)
       und des Lagers (x=-8.1, -x), im Streifen des Gangs */
    o.gangSued=seiten('x',8.0,1,-9.1,-8.9,0,2.9);
    o.gangLager=seiten('x',-8.1,-1,-9.1,-8.9,0,2.9);
    /* Traufkasten und Schildrahmen (z=6.39, +z) */
    o.traufe=seiten('z',6.39,1,-4.3,4.3,3.8,4.0);
    /* 2 - freies Wandende bei x=8 (Rueckwand des Grundladens) */
    o.ende=null;
    boxen.forEach(({q,bx})=>{
      if(Math.abs(bx.max.x-8.006)<0.01&&bx.min.x>6&&bx.min.x<6.2&&Math.abs(bx.min.z+6.1)<0.01&&Array.isArray(q.material)){
        const m=q.material[0], w=q.material[4];
        o.ende={gleich:m===w, farbe:m&&m.color?m.color.getHexString():'?'};
      }
    });
    /* 3 - Tuer des zweiten Eingangs: nichts Festes in der Oeffnung */
    const cx=bb.EING2.x; o.tuerX=cx; o.inTuer=[];
    boxen.forEach(({q,bx})=>{
      if(bx.max.x<cx-1.15||bx.min.x>cx+1.15) return;
      if(bx.max.z<5.98||bx.min.z>6.3) return;
      if(bx.min.y>1.2||bx.max.y<0.1) return;
      if(bx.max.y-bx.min.y<0.03) return;                /* Bodenschiene */
      let fl=false; for(let a=q;a;a=a.parent) if(bb.TUEREN.some(t=>t.leaves.includes(a))) fl=true;
      if(fl) return;                                    /* Tuerfluegel selbst */
      o.inTuer.push([bx.min.x,bx.max.x,bx.min.y,bx.max.y,bx.min.z,bx.max.z].map(v=>+v.toFixed(2)).join(' '));
    });
    /* 4 - Muelleimer (Korb mit Lochblech, r=0.2) gegen Poller (x=+-5.4) */
    o.muellAbstand=99;
    bb.scene.traverse(q=>{ if(!q.isMesh||!q.geometry||q.geometry.type!=='CylinderGeometry') return;
      const pa=q.geometry.parameters; if(!pa||!pa.openEnded||Math.abs(pa.radiusTop-0.2)>0.001) return;
      const w=new THREE.Vector3(); q.getWorldPosition(w);
      for(const px of [-5.4,5.4]) o.muellAbstand=Math.min(o.muellAbstand,Math.hypot(w.x-px,w.z-7.5)); });
    return o;
  });
  console.log('FLIMMERN ',JSON.stringify({gangSued:r.gangSued,gangLager:r.gangLager,traufe:r.traufe}));
  console.log('WANDENDE ',JSON.stringify(r.ende));
  console.log('EINGANG2 ',JSON.stringify({x:r.tuerX,inTuer:r.inTuer}));
  console.log('MUELL    ',r.muellAbstand.toFixed(2));
  const mangel=[];
  if(r.gangSued>1) mangel.push('Lagergang flimmert an der Wand der Halle hinterm Laden');
  if(r.gangLager>1) mangel.push('Lagergang flimmert an der Lagerwand');
  if(r.traufe>1) mangel.push('Schildrahmen flimmert im Traufkasten');
  if(!r.ende) mangel.push('Wandende bei x=8 nicht gefunden');
  else if(!r.ende.gleich) mangel.push('Wandende bei x=8 ohne Wandfarbe (#'+r.ende.farbe+')');
  if(r.inTuer.length) mangel.push('in der Tuer des zweiten Eingangs steht etwas: '+r.inTuer.join(' | '));
  if(r.muellAbstand<0.55) mangel.push('Muelleimer steht im Poller ('+r.muellAbstand.toFixed(2)+' m)');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',fehler.length||mangel.length?fehler.concat(mangel).join('\n'):'keine');
  await b.close();
})();

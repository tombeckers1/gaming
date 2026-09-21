/* Stadt: Ringe, Wahrzeichen, Leben */
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
  const p=await b.newPage({viewport:{width:1280,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ const x=m.text(); if(m.type()==='error'&&x.indexOf('ERR_')<0) errs.push('CONSOLE: '+x); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);

  /* --- Wie voll ist der Horizont? --- */
  const w=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    /* alle Meshes mit ihrer Entfernung vom Laden einsammeln */
    const ring={nah:0,quartier:0,skyline:0,ferne:0};
    let hoechste=0, meshes=0, dreiecke=0;
    bb.scene.traverse(m=>{
      if(!m.geometry||!m.geometry.attributes||!m.geometry.attributes.position) return;
      meshes++;
      const pos=m.geometry.attributes.position;
      dreiecke+=pos.count/3;
      /* Weltposition grob ueber die Elternkette */
      let x=0,y=0,z=0,n=m;
      while(n&&n!==bb.scene){ x+=n.position.x; y+=n.position.y; z+=n.position.z; n=n.parent; }
      const r=Math.hypot(x,z);
      /* hoechsten Punkt direkt aus den Vertexdaten holen */
      const arr=pos.array||[];
      let top=0;
      for(let i=1;i<arr.length;i+=3) if(arr[i]>top) top=arr[i];
      /* Himmelskuppel und Bodenplatte nicht als Bauwerk zaehlen */
      if(isFinite(top)&&top<200) hoechste=Math.max(hoechste,y+top);
      if(r<50) ring.nah++;
      else if(r<160) ring.quartier++;
      else if(r<350) ring.skyline++;
      else ring.ferne++;
    });
    o.meshes=meshes; o.dreiecke=Math.round(dreiecke); o.stadtBoxen=bb.stadtBoxen; o.stadtBaeume=Math.round(bb.stadtBaeume);
    o.ring=ring;
    o.hoechstesBauwerk=Math.round(hoechste);
    o.nebel={nah:bb.scene.fog.near,fern:bb.scene.fog.far};
    return o;
  });
  console.log('HORIZONT',JSON.stringify(w));

  /* --- Nichts darf im Spielbereich stehen --- */
  const frei=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    /* Der Spieler laeuft zwischen etwa x -34..15 und z -16..20.
       Dort darf kein Stadtgebaeude stehen. */
    const proben=[];
    for(let x=-40;x<=20;x+=4) for(let z=-18;z<=22;z+=4) proben.push([x,z]);
    o.probenGeprueft=proben.length;
    o.alleFrei=proben.every(([x,z])=>!bb.stadtFrei(x,z,1));
    /* Stichprobe: wo darf gebaut werden */
    o.weitDraussenFrei=bb.stadtFrei(90,90,10)&&bb.stadtFrei(-120,140,12);
    o.strasseGeschuetzt=!bb.stadtFrei(0,28,6);
    return o;
  });
  console.log('FREIRAUM',JSON.stringify(frei));

  /* --- ragt Stadtgeometrie in den begehbaren Bereich? --- */
  const ein=await p.evaluate(()=>{
    const bb=window.__bb;
    /* Bereich, in dem der Spieler laufen kann, mit etwas Rand */
    const RX=[-46,24], RZ=[-25,21], treffer=[];
    bb.scene.traverse(m=>{
      const g=m.geometry; if(!g||!g.attributes||!g.attributes.position) return;
      const arr=g.attributes.position.array; if(arr.length>90000) return;
      let ox=0,oy=0,oz=0,n=m;
      while(n&&n!==bb.scene){ ox+=n.position.x; oy+=n.position.y; oz+=n.position.z; n=n.parent; }
      /* nur die markierten Stadtmeshes interessieren */
      if(!m.userData||!m.userData.stadt) return;
      let lo=[1e9,1e9,1e9], hi=[-1e9,-1e9,-1e9];
      for(let i=0;i<arr.length;i+=3){
        const x=arr[i], y=arr[i+1], z=arr[i+2];
        if(y<0.4||y>60) continue;
        if(x>RX[0]&&x<RX[1]&&z>RZ[0]&&z<RZ[1]){ treffer.push([+x.toFixed(1),+y.toFixed(1),+z.toFixed(1)]); if(treffer.length>6) return; }
      }
    });
    return {imSpielbereich:treffer.length,beispiele:treffer.slice(0,4)};
  });
  console.log('EINDRINGEN',JSON.stringify(ein));

  /* --- Leben --- */
  const leb=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.schwaerme=bb.schwaerme.length;
    o.voegelGesamt=bb.schwaerme.reduce((a,s)=>a+s.voegel.length,0);
    o.beacons=bb.beacons.length;
    o.silhouetten=bb.silhouetten.length;
    o.verkehrspunkte=bb.verkehrPts?bb.verkehrPts.geometry.attributes.position.count:0;
    o.rauchpunkte=bb.rauchPts?bb.rauchPts.geometry.attributes.position.count:0;
    /* bewegen sich die Voegel? */
    const vor=bb.schwaerme.map(s=>s.g.position.clone());
    bb.run(6,0.05);
    o.voegelBewegen=bb.schwaerme.every((s,i)=>s.g.position.distanceTo(vor[i])>0.5);
    /* blinken die Beacons? */
    const b0=bb.beacons.map(x=>x.m.emissiveIntensity);
    let wechsel=false;
    for(let k=0;k<40;k++){ bb.run(0.12,0.04); if(bb.beacons.some((x,i)=>x.m.emissiveIntensity!==b0[i])) wechsel=true; }
    o.beaconsBlinken=wechsel;
    /* Rauch steigt */
    const r0=bb.rauchPts?bb.rauchPts.geometry.attributes.position.array[1]:0;
    bb.run(5,0.05);
    o.rauchSteigt=bb.rauchPts?bb.rauchPts.geometry.attributes.position.array[1]!==r0:false;
    return o;
  });
  console.log('LEBEN',JSON.stringify(leb));

  /* --- Nacht: Fensterlichter und Verkehr --- */
  const nacht=await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.clock=1180;                       /* spaeter Abend */
    bb.run(1.5,0.05);
    o.hausMaterialien=bb.scene.children.length>0;
    /* die Stadtfassaden muessen nachts leuchten */
    let leuchtend=0, gesamt=0;
    bb.scene.traverse(m=>{ const mm=m.material;
      (Array.isArray(mm)?mm:[mm]).forEach(x=>{ if(x&&x.emissiveMap){ gesamt++; if(x.emissiveIntensity>0.2) leuchtend++; } }); });
    o.fassadenMitFenstern=gesamt; o.davonLeuchtend=leuchtend;
    o.verkehrSichtbar=bb.verkehrPts?bb.verkehrPts.material.opacity>0.4:false;
    /* Verkehr bewegt sich */
    const va=bb.verkehrPts.geometry.attributes.position.array;
    const v0=Array.from(va);
    bb.run(4,0.05);
    o.verkehrFaehrt=v0.some((v,i)=>v!==va[i]);
    /* Lichter auf der Hochstrasse und unten in der Strassenschlucht */
    let oben=0, unten=0, imNahbereich=0;
    for(let i=0;i<va.length;i+=3){
      const x=va[i], y=va[i+1], z=va[i+2];
      if(y<-100) continue;
      if(y>10) oben++; else { unten++; if(Math.abs(x)<52) imNahbereich++; }
    }
    o.lichterOben=oben; o.lichterUnten=unten;
    o.keineLichterVorDerNase=imNahbereich===0;
    /* Die Strassenschlucht muss frei sein, sonst sieht man nichts davon */
    o.schluchtFrei=[-200,-120,-70,70,120,200].every(x=>!bb.stadtFrei(x,15,2));
    /* Flugzeug taucht irgendwann auf */
    let gesehen=false;
    for(let k=0;k<200;k++){ bb.run(1,0.1); if(bb.flieger&&bb.flieger.visible){ gesehen=true; break; } }
    o.flugzeugGesehen=gesehen;
    bb.clock=600;
    return o;
  });
  console.log('NACHT',JSON.stringify(nacht));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

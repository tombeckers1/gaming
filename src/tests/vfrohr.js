/* Vorfuehrung: Raketen und Kugelbomben sichtbar im Rohr (Toms PDF vom
   05.10.: "Auf dem Testfeld Vorfuehrung sieht man keine Raketen und keine
   Kugelbomben in den Roehren, nur der Effekt - bitte aendern").
   Je Rakete und Kugel (ein Teil der Liste oder alle mit "alle"):
   - MODELL: vor dem Abschuss steht das Modell (Rakete / Kugel mit
     Zuendschnur) in der Szene, sichtbar, an der Rohrmuendung
   - START: die Rakete startet an der Rohrmuendung (FW_LOG)
   - FLUG: kurz nach dem Start fliegt das Modell mit nach oben
   - WEG: nach dem Bruch ist das Modell aus der Szene
   - BLICK: beim Zuenden ist das Rohr im Bild, beim Bruch der Bruchpunkt
   - PIXEL (07.10., Tom sah trotz gruenem Test nichts): nach leichtem
     Mauszittern (6 x 0,03 rad je Bild) wird das Bild
     wirklich gerendert - einmal mit, einmal ohne Modell; mindestens
     PIXEL_MIN Bildpunkte muessen sich unterscheiden (Rakete bzw. Kugel
     und Zuendschnur sind im Bild zu sehen, nicht verdeckt, nicht winzig)
   Aufruf: node vfrohr.js real.html [alle] */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PIXEL_MIN=80;
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:800,height:500}}); p.setDefaultTimeout(1200000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const alle=process.argv[3]==='alle';
  const r=await p.evaluate(alle=>{ const bb=window.__bb, P=bb.P, out=[];
    bb.vorfuehrungAn(); bb.run(0.2,0.05);
    let ids=bb.vfListe.filter(t=>P[t].shape==='rocketset'||P[t].shape==='shell');
    if(!alle){ const rk=ids.filter(t=>P[t].shape==='rocketset'), kg=ids.filter(t=>P[t].shape==='shell'); ids=[rk[0],rk[Math.floor(rk.length/2)],rk[rk.length-1],kg[0],kg[kg.length-1]]; }
    const modell=t=>{ let g=null; bb.scene.traverse(o=>{ if(!g&&o.userData&&o.userData.vfModell===t) g=o; }); return g; };
    /* sichtbare Bildpunkte des Modells: zweimal rendern, mit und ohne Modell */
    const pixel=g=>{ const cv=bb.renderer.domElement, W=cv.width, H=cv.height, c2=document.createElement('canvas'); c2.width=W; c2.height=H; const x2=c2.getContext('2d');
      const grab=()=>{ bb.renderFrame(1/60); x2.clearRect(0,0,W,H); x2.drawImage(cv,0,0); return x2.getImageData(0,0,W,H).data; };
      const a=grab(); g.visible=false; const b2=grab(); g.visible=true; bb.renderFrame(1/60);
      let n=0; for(let i=0;i<a.length;i+=4) if(Math.abs(a[i]-b2[i])+Math.abs(a[i+1]-b2[i+1])+Math.abs(a[i+2]-b2[i+2])>40) n++; return n; };
    const imBild=(x,y,z)=>{ const c=bb.camera; c.updateMatrixWorld(true); const v=new (c.position.constructor)(x,y,z).project(c); return v.z<1&&Math.abs(v.x)<=1&&Math.abs(v.y)<=1; };
    for(const t of ids){
      bb.vfStopp(); for(let i=0;i<6;i++) bb.run(0.25,0.05);
      const log=[]; log.brueche=[]; bb.fwLog(log);
      bb.vfZuenden(t); bb.run(0.1,0.05);
      /* eine Hand auf der Maus: der Blick zittert um gut 4 Grad (Tom) */
      for(let k=0;k<6;k++){ const pp=bb.playerPos(); bb.setView(pp.x,pp.z,bb.camYaw(),bb.camPitch()+0.03); bb.run(0.05,0.05); }
      bb.renderFrame(1/60);
      const g=modell(t), sid=bb.stationOf(t);
      const o={t,sid,lvl:P[t].lvl,da:!!g,sicht:!!g&&g.visible};
      if(g){ o.p0=[+g.position.x.toFixed(2),+g.position.y.toFixed(2),+g.position.z.toFixed(2)]; o.rohrImBild=imBild(g.position.x,g.position.y,g.position.z); o.px=pixel(g); }
      /* bis zum Start */
      let start=null; for(let s=0;s<3&&!start;s+=0.05){ bb.run(0.05,0.05); start=log.find(x=>x.art==='schuss'||x.art==='kugel'); }
      o.start=start?[start.x,start.y,start.z]:null;
      bb.run(0.4,0.05); const g2=modell(t); o.flug=g2&&g2.parent?+g2.position.y.toFixed(1):null;
      /* bis zum Bruch */
      let br=null; for(let s=0;s<6&&!br;s+=0.05){ bb.run(0.05,0.05); br=log.brueche.find(x=>!x.stufe); }
      bb.run(0.6,0.05); bb.renderFrame(1/60);
      o.bruch=br?[br.x,br.y,br.z]:null; o.bruchImBild=br?imBild(br.x,br.y,br.z):null;
      const g3=modell(t); o.weg=!g3||!g3.parent;
      bb.fwLog(null); out.push(o); }
    bb.vfStopp(); bb.run(0.5,0.1);
    let rest=0; bb.scene.traverse(x=>{ if(x.userData&&x.userData.vfModell) rest++; });
    return {out,rest}; },alle);
  const mangel=[]; const pruef=(n,ok,w)=>{ if(!ok) mangel.push(n+': '+w); };
  for(const o of r.out){ console.log(JSON.stringify(o));
    pruef('MODELL',o.da&&o.sicht,o.t+' ohne sichtbares Modell im Rohr');
    pruef('PIXEL',o.px>=PIXEL_MIN,o.t+' Modell im gerenderten Bild nicht zu sehen: '+o.px+' Bildpunkte');
    pruef('START',o.start&&o.p0&&Math.hypot(o.start[0]-o.p0[0],o.start[2]-o.p0[2])<0.1&&Math.abs(o.start[1]-o.p0[1])<0.25,o.t+' startet nicht an der Muendung: '+JSON.stringify([o.start,o.p0]));
    pruef('FLUG',o.flug!==null&&o.p0&&o.flug>o.p0[1]+2,o.t+' Modell fliegt nicht mit: '+o.flug);
    pruef('WEG',o.weg,o.t+' Modell nach dem Bruch noch da');
    pruef('BLICK',o.rohrImBild&&o.bruchImBild,o.t+' Rohr/Bruch nicht im Bild: '+JSON.stringify([o.rohrImBild,o.bruchImBild])); }
  pruef('AUFRAEUMEN',r.rest===0,r.rest+' Modelle nach Stopp noch in der Szene');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

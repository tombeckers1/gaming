/* Leistung beim Feuerwerk (Tom, 24.09.: "das Spiel faengt an, sich
   aufzuhaengen"): nachts auf dem Testfeld ein Finale, die Donnerwand,
   zwei Riesenfontaenen und zwei 300-mm-Kugeln gleichzeitig. Gemessen
   wird je Bild die Zeit fuer die Spiellogik (step) und fuers Zeichnen
   (renderFrame bis zum fertigen Bild), dazu wie oft Shader neu
   uebersetzt werden und wie viele Daten je Bild zur Grafikkarte gehen.
   Aufruf: node leistung.js real.html [basis]  - mit "basis" nur Ausgabe */
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
  const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  const r=await p.evaluate(async()=>{
    const bb=window.__bb, R=bb.renderer, gl=R.getContext();
    bb.run(0.5,0.05); bb.clock=1300; bb.applyTOD();
    const m=bb.testfeldMitte(); bb.setView(m.x,m.z+9,0,0.55);
    /* Buffer-Uploads zaehlen: bufferSubData/bufferData-Bytes je Bild */
    let bytes=0; const bsd=gl.bufferSubData.bind(gl), bd=gl.bufferData.bind(gl);
    /* WebGL2: bufferSubData(ziel,versatz,daten,start,laenge) - dann zaehlt nur die Laenge */
    gl.bufferSubData=function(t,o,d,st,len){ bytes+=len?len*d.BYTES_PER_ELEMENT:((d&&d.byteLength)||0); return bsd.apply(null,arguments); };
    gl.bufferData=function(t,d){ bytes+=(d&&d.byteLength)||0; return bd.apply(null,arguments); };
    const px=new Uint8Array(4);
    const bild=()=>{ const t0=performance.now(); bb.step(1/60); const t1=performance.now(); bb.renderFrame(1/60); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); const t2=performance.now(); return [t1-t0,t2-t1]; };
    /* aufwaermen: Szene einmal ohne Feuerwerk */
    for(let i=0;i<20;i++) bild();
    const prog0=R.info.programs.length;
    const ruhig=[]; for(let i=0;i<40;i++) ruhig.push(bild());
    bytes=0;
    const P=bb.STATION_POS;
    bb.igniteType('finale',{x:P.moerser.x,y:0.95,z:P.moerser.z});
    bb.igniteType('donnerwand',{x:P.rampe.x,y:0.95,z:P.rampe.z});
    bb.igniteType('goldgeysir',{x:P.tisch.x-1,y:0.95,z:P.tisch.z});
    bb.igniteType('feuersaeule',{x:P.tisch.x+1,y:0.95,z:P.tisch.z});
    bb.kugelbombe({x:5,y:1.7,z:-23},5); bb.kugelbombe({x:2,y:1.7,z:-25},5);
    const feuer=[], lebend=[]; let upl=0, maxUpl=0, maxProg=prog0, blitzWarAn=false;
    for(let i=0;i<400;i++){ bytes=0; feuer.push(bild()); upl+=bytes; maxUpl=Math.max(maxUpl,bytes);
      maxProg=Math.max(maxProg,R.info.programs.length); if(bb.FLASH.every(f=>f.l.visible)) blitzWarAn=true;
      if(i%30===0){ let n=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let k=0;k<ps.max;k++) if(ps.life[k]>0) n++; lebend.push(n); } }
    /* danach: Blitze gehen wieder aus, ein LKW dockt an - ohne neue Shader */
    /* bis die Show vorbei ist (hoechstens 4 min), dann 9 s Ruhe */
    let lief=0; while(lief<240&&(bb.rockets.length||bb.emitters.length||bb.timersLen()||bb.FLASH.some(f=>f.t>0))){ bb.run(2,0.1); lief+=2; }
    bb.run(9,0.1); bild();
    const blitzAus=blitzWarAn&&bb.FLASH.every(f=>!f.l.visible);
    bb.S.up.lager=true; bb.applyZonen();
    const pL=R.info.programs.length; let lkwMax=0, lampe=0;
    bb.pending.push({type:bb.ORDER[0],q:1,t:0,sup:'mertens'});
    for(let k=0;k<8;k++){ bb.run(4,0.05); const t=bild(); lkwMax=Math.max(lkwMax,t[1]); lampe=Math.max(lampe,bb.LR_LAMPE[0].intensity); }
    const lkw={neu:R.info.programs.length-pL,lampe,max:Math.round(lkwMax)}; lkw.lief=lief; lkw.war=blitzWarAn;
    const st=a=>{ const s=a.slice().sort((x,y)=>x-y); const q=f=>+s[Math.floor(f*(s.length-1))].toFixed(2);
      return {mittel:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),p50:q(0.5),p95:q(0.95),max:q(1)}; };
    return {ruhig:{step:st(ruhig.map(x=>x[0])),render:st(ruhig.map(x=>x[1]))},
      feuer:{step:st(feuer.map(x=>x[0])),render:st(feuer.map(x=>x[1])),gesamt:st(feuer.map(x=>x[0]+x[1]))},
      shader:{vorher:prog0,neu:maxProg-prog0}, uploadKB:{mittel:+(upl/400/1024).toFixed(0),max:+(maxUpl/1024).toFixed(0)},
      partikel:Math.max(...lebend), blitzAus, lkw, spitzen:feuer.map((x,i)=>[i,Math.round(x[1])]).sort((a,b)=>b[1]-a[1]).slice(0,4)};
  });
  console.log('RUHIG   ',JSON.stringify(r.ruhig));
  console.log('FEUER   ',JSON.stringify(r.feuer));
  console.log('SHADER  ',JSON.stringify(r.shader),' UPLOAD KB/Bild',JSON.stringify(r.uploadKB),' PARTIKEL max',r.partikel,' SPITZEN [bild,ms]',JSON.stringify(r.spitzen));
  console.log('DANACH  ',JSON.stringify({blitzAus:r.blitzAus,lkw:r.lkw}));
  if(process.argv[3]!=='basis'){
    pruef('RUCKLER',r.feuer.render.max<r.feuer.render.p50*2,'Einzelbild '+r.feuer.render.max+' ms bei Median '+r.feuer.render.p50+' ms');
    pruef('BLITZ',r.blitzAus,'Blitzlichter bleiben nach dem Feuerwerk an (kostet im Laden Rechenzeit)');
    pruef('LKW',r.lkw.neu===0&&r.lkw.lampe>0.5,'LKW dockt an: '+JSON.stringify(r.lkw));
    pruef('SHADER',r.shader.neu===0,r.shader.neu+' Shader waehrend des Feuerwerks neu uebersetzt (Ruckler)');
    pruef('UPLOAD',r.uploadKB.mittel<800,'im Schnitt '+r.uploadKB.mittel+' KB je Bild zur Grafikkarte');
    pruef('PARTIKEL',r.partikel>4000,'nur '+r.partikel+' Partikel - Grafik gekuerzt?');
  }
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

/* Grafik unveraendert nach der Leistungsarbeit (24.09.): alte und neue
   Fassung bekommen denselben Zufall und dieselbe Szene - Finale,
   Weiden, Riesenfontaene, 300-mm-Kugel - und werden nach 2,5 s Pixel
   fuer Pixel verglichen.
   Aufruf: node gleichbild.js alt.html neu.html [png-praefix] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
async function bild(b,datei,png,post){
  const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_CERT/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://'+datei); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const px=await p.evaluate((process_post)=>{ const bb=window.__bb, gl=bb.renderer.getContext();
    bb.run(0.5,0.05); bb.clock=1300; bb.applyTOD(); bb.setView(1.5,-12,0,0.62); bb.step(1/60);
    let a=20260924; Math.random=()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
    const P=bb.STATION_POS;
    bb.igniteType('goldgeysir',{x:P.tisch.x,y:0.95,z:P.tisch.z});
    bb.kugelbombe({x:5,y:1.7,z:-23},5,{eff:'weide'});
    bb.mitSchweif('kugel',()=>bb.EFF.kugel({x:-6,y:18,z:-32},bb.FW.rot,bb.FW.gold,1.2));
    bb.mitSchweif('weide',()=>bb.EFF.weide({x:8,y:20,z:-34},bb.FW.gold,bb.FW.weiss,1.2));
    /* nur das Feuerwerk rechnen: sonst ziehen Stadt und Kunden je nach
       Aufbau verschieden oft Zufall, und die Folgen laufen auseinander */
    for(let i=0;i<150;i++) bb.updateFireworks(1/60);
    /* nur das Feuerwerk zeichnen - die Stadt wird bei jedem Laden neu
       gewuerfelt und waere sonst der Unterschied */
    const fw=new Set(); for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]){ fw.add(ps.pts); if(ps.lines) fw.add(ps.lines); }
    bb.scene.children.forEach(o=>{ if(!fw.has(o)&&!o.isLight) o.visible=false; });
    bb.scene.background=null; bb.renderer.setClearColor(0x000000);
    /* ohne Nachbearbeitung: deren Filmkorn haengt an der Laufzeit */
    if(process_post==='aus') bb.setPost(false);
    bb.renderFrame(1/60);
    const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight, d=new Uint8Array(w*h*4); gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,d);
    return {w,h,d:Array.from(d)}; },post);
  if(png) await p.screenshot({path:png});
  await p.close(); return {px,errs};
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const pre=process.argv[4];
  const post=process.env.POST||'aus';
  const A=await bild(b,process.argv[2],pre&&pre+'_alt.png',post), B=await bild(b,process.argv[3],pre&&pre+'_neu.png',post);
  const a=A.px.d, n=B.px.d; let diff=0, gross=0, hellA=0, hellB=0, sumA=0, sumB=0;
  for(let i=0;i<a.length;i+=4){ let m=0; for(let c=0;c<3;c++){ const x=Math.abs(a[i+c]-n[i+c]); diff+=x; m=Math.max(m,x); sumA+=a[i+c]; sumB+=n[i+c]; }
    if(m>40) gross++; if(a[i]+a[i+1]+a[i+2]>300) hellA++; if(n[i]+n[i+1]+n[i+2]>300) hellB++; }
  const pxN=a.length/4;
  const hist=[0,0,0,0,0]; for(let i=0;i<a.length;i+=4){ let m=0; for(let c=0;c<3;c++) m=Math.max(m,Math.abs(a[i+c]-n[i+c])); hist[m===0?0:m<=3?1:m<=10?2:m<=25?3:4]++; }
  console.log('ABWEICHUNG je Pixel [0, 1-3, 4-10, 11-25, >25]:',JSON.stringify(hist));
  const r={mittlereAbw:+(diff/(pxN*3)).toFixed(3),grobAbwAnteil:+(gross/pxN*100).toFixed(3)+'%',hellAlt:hellA,hellNeu:hellB,helligkeit:+(sumB/sumA).toFixed(4)};
  console.log('VERGLEICH',JSON.stringify(r));
  const mangel=[];
  if(!(r.mittlereAbw<1&&gross/pxN<0.005&&Math.abs(r.helligkeit-1)<0.02)) mangel.push('Bild weicht ab: '+JSON.stringify(r));
  if(hellB<200) mangel.push('kaum Feuerwerk im Bild ('+hellB+' helle Pixel)');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  const errs=A.errs.concat(B.errs);
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

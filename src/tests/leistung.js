/* Leistung beim Feuerwerk (Tom, 24.09.: "das Spiel faengt an, sich
   aufzuhaengen"): nachts auf dem Testfeld ein Finale, die Donnerwand,
   zwei Riesenfontaenen und zwei 300-mm-Kugeln gleichzeitig. Gemessen
   wird je Bild die Zeit fuer die Spiellogik (step) und fuers Zeichnen
   (renderFrame bis zum fertigen Bild), dazu wie oft Shader neu
   uebersetzt werden und wie viele Daten je Bild zur Grafikkarte gehen.
   Aufruf: node leistung.js real.html [basis]  - mit "basis" nur Ausgabe */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const H=require('../../tools/test/start-hilfe.js');
  const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await H.laden(p,process.argv[2]);
  await p.evaluate(()=>localStorage.clear());
  await H.neuladen(p);
  await H.neuesSpiel(p,{stoppen:true});
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };

  /* Messung in Stuecken (je <= 25 s): 400 gerenderte Bilder in EINEM evaluate liefen in swiftshader ueber das Zeitlimit.
     Gemessen wird je Bild wie bisher (step + renderFrame + readPixels); die Pausen zwischen den Stuecken zaehlen nicht. */
  const res=await H.stuecke(p,(st,aus)=>{
    const bb=window.__bb, R=bb.renderer, gl=R.getContext(), P=bb.STATION_POS;
    if(!st.init){ st.init=1; st.ph='warm'; st.n=0; st.ruhig=[]; st.feuer=[]; st.lebend=[]; st.upl=0; st.maxUpl=0; st.blitz=false; st.bytes=0; st.lief=0; st.k=0; st.lkwMax=0; st.lampe=0;
      bb.run(0.5,0.05); bb.clock=1300; bb.applyTOD();
      const m=bb.testfeldMitte(); bb.setView(m.x,m.z+9,0,0.55);
      /* Buffer-Uploads zaehlen: bufferSubData/bufferData-Bytes je Bild */
      const bsd=gl.bufferSubData.bind(gl), bd=gl.bufferData.bind(gl);
      /* WebGL2: bufferSubData(ziel,versatz,daten,start,laenge) - dann zaehlt nur die Laenge */
      gl.bufferSubData=function(t,o,d,s2,len){ st.bytes+=len?len*d.BYTES_PER_ELEMENT:((d&&d.byteLength)||0); return bsd.apply(null,arguments); };
      gl.bufferData=function(t,d){ st.bytes+=(d&&d.byteLength)||0; return bd.apply(null,arguments); };
      st.px=new Uint8Array(4); }
    const bild=()=>{ const t0=performance.now(); bb.step(1/60); const t1=performance.now(); bb.renderFrame(1/60); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,st.px); const t2=performance.now(); return [t1-t0,t2-t1]; };
    const info=()=>({ph:st.ph,n:st.n,k:st.k});
    /* aufwaermen: Szene einmal ohne Feuerwerk */
    if(st.ph==='warm'){ while(!aus()&&st.n<20){ bild(); st.n++; } if(st.n<20) return {fertig:false,info:info()}; st.prog0=R.info.programs.length; st.maxProg=st.prog0; st.ph='ruhig'; st.n=0; }
    if(st.ph==='ruhig'){ while(!aus()&&st.n<40){ st.ruhig.push(bild()); st.n++; } if(st.n<40) return {fertig:false,info:info()};
      st.bytes=0;
      bb.igniteType('finale',{x:P.moerser.x,y:0.95,z:P.moerser.z});
      bb.igniteType('feuerpfau',{x:P.rampe.x,y:0.95,z:P.rampe.z}); /* 09.10.: Trommelfeuer gestrichen - Farbsaeulen haben dieselbe Last (101k/107k Teilchen) */
      bb.igniteType('goldgeysir',{x:P.tisch.x-1,y:0.95,z:P.tisch.z});
      bb.igniteType('goldgeysir',{x:P.tisch.x+1,y:0.95,z:P.tisch.z}); /* 29.09.: statt Feuersaeule (entfernt); 06.10.: Goldgeysir statt Zauberbrunnen (Toms PDF) */
      bb.kugelbombe({x:5,y:1.7,z:-23},5); bb.kugelbombe({x:2,y:1.7,z:-25},5);
      st.ph='feuer'; st.n=0; }
    if(st.ph==='feuer'){ while(!aus()&&st.n<400){ const i=st.n; st.bytes=0; st.feuer.push(bild()); st.upl+=st.bytes; st.maxUpl=Math.max(st.maxUpl,st.bytes);
        st.maxProg=Math.max(st.maxProg,R.info.programs.length); if(bb.FLASH.every(f=>f.l.visible)) st.blitz=true;
        if(i%30===0){ let c=0; for(const ps of [bb.psHuge,bb.psBig,bb.psMid,bb.psSmall]) for(let k=0;k<ps.max;k++) if(ps.life[k]>0) c++; st.lebend.push(c); }
        st.n++; }
      if(st.n<400) return {fertig:false,info:info()}; st.ph='aus'; }
    /* danach: Blitze gehen wieder aus, ein LKW dockt an - ohne neue Shader; bis die Show vorbei ist (hoechstens 4 min), dann 9 s Ruhe */
    if(st.ph==='aus'){ const laeuft=()=>st.lief<240&&(bb.rockets.length||bb.emitters.length||bb.timersLen()||bb.FLASH.some(f=>f.t>0));
      while(!aus()&&laeuft()){ bb.run(2,0.1); st.lief+=2; }
      if(laeuft()) return {fertig:false,info:info()};
      bb.run(9,0.1); bild();
      st.blitzAus=st.blitz&&bb.FLASH.every(f=>!f.l.visible);
      bb.S.up.lager=true; bb.applyZonen();
      st.pL=R.info.programs.length;
      bb.pending.push({type:bb.ORDER[0],q:1,t:0,sup:'mertens'});
      st.ph='lkw'; st.k=0; }
    if(st.ph==='lkw'){ while(!aus()&&st.k<8){ bb.run(4,0.05); const t=bild(); st.lkwMax=Math.max(st.lkwMax,t[1]); st.lampe=Math.max(st.lampe,bb.LR_LAMPE[0].intensity); st.k++; }
      if(st.k<8) return {fertig:false,info:info()}; }
    const lkw={neu:R.info.programs.length-st.pL,lampe:st.lampe,max:Math.round(st.lkwMax)}; lkw.lief=st.lief; lkw.war=st.blitz;
    const sta=a=>{ const s=a.slice().sort((x,y)=>x-y); const q=f=>+s[Math.floor(f*(s.length-1))].toFixed(2);
      return {mittel:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2),p50:q(0.5),p95:q(0.95),max:q(1)}; };
    const feuer=st.feuer, ruhig=st.ruhig;
    return {fertig:true,info:'fertig',r:{ruhig:{step:sta(ruhig.map(x=>x[0])),render:sta(ruhig.map(x=>x[1]))},
      feuer:{step:sta(feuer.map(x=>x[0])),render:sta(feuer.map(x=>x[1])),gesamt:sta(feuer.map(x=>x[0]+x[1]))},
      shader:{vorher:st.prog0,neu:st.maxProg-st.prog0}, uploadKB:{mittel:+(st.upl/400/1024).toFixed(0),max:+(st.maxUpl/1024).toFixed(0)},
      partikel:Math.max(...st.lebend), blitzAus:st.blitzAus, lkw, erstes:Math.round(feuer[0][1]), spitzen:feuer.map((x,i)=>[i,Math.round(x[1])]).sort((a,b)=>b[1]-a[1]).slice(0,4)}}; },{name:'Messung',max:200});
  const r=res.r;
  console.log('RUHIG   ',JSON.stringify(r.ruhig));
  console.log('FEUER   ',JSON.stringify(r.feuer));
  console.log('SHADER  ',JSON.stringify(r.shader),' UPLOAD KB/Bild',JSON.stringify(r.uploadKB),' PARTIKEL max',r.partikel,' SPITZEN [bild,ms]',JSON.stringify(r.spitzen));
  console.log('DANACH  ',JSON.stringify({blitzAus:r.blitzAus,lkw:r.lkw}));
  if(process.argv[3]!=='basis'){
    pruef('RUCKLER',r.feuer.render.max<r.feuer.render.p50*2,'Einzelbild '+r.feuer.render.max+' ms bei Median '+r.feuer.render.p50+' ms');
    /* 30.09.: das erste Feuerwerksbild eigens - ohne Vorzeichnen der
       Blitzlichter lag es bei 1,9x Median und schluepfte unter der 2x-Grenze durch */
    pruef('ERSTES',r.erstes<r.feuer.render.p50*1.5,'erstes Feuerwerksbild '+r.erstes+' ms bei Median '+r.feuer.render.p50+' ms');
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

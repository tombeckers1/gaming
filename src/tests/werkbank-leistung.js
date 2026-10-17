/* Leistung der Monsterbatterie (Werkbank, 500 Schuss) - kurz, je Grafikstufe einmal:
   Die eigene 500-Schuss-Batterie (schwerster Entwurf: Kamuro/Zeitregen/Kronleuchter im Finale, grosses Kaliber)
   brennt in der Vorschau; zum Vergleich der groesste Kaufverbund (Ragnaroek, 409 Schuss) am Zuendtisch.
   Je 0,25 s Spielzeit ein Schritt mit Logikzeit, je 2 s ein gezeichnetes Bild (swiftshader: Zeichnen ist hier
   CPU - die absoluten ms sind kein PC-Wert, der Vergleich beider Batterien schon). Dazu lebende Partikel je Pool
   (gegen das Funkenlimit der Stufe, PS.max) und Starts.
   Aufruf: GFX=hoch|ultralow BB_LOCK=... sh tools/test/lauf.sh werkbank-leistung */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path=require('path');
const H=require(path.join(__dirname,'../../tools/test/start-hilfe.js'));
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:960,height:600}}); p.setDefaultTimeout(120000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const gfx=process.env.GFX||'hoch';
  await H.laden(p,process.argv[2]);
  await p.evaluate(g=>{ localStorage.clear(); localStorage.setItem('bb_gfx',g); },gfx);
  await H.neuladen(p); await H.neuesSpiel(p,{stoppen:true});
  await p.evaluate(()=>{ const bb=window.__bb, S=bb.S; S.level=40; S.money=1e6; ['shop_halb','lager','lager_nord','testfeld','labor','labor2','labor3','labor4','labor5'].forEach(id=>bb.testKauf(id));
    bb.BRUCH_IDS.forEach(e=>bb.bruchGesehen(e)); Object.keys(bb.WB_LICHT).forEach(k=>bb.bruchGesehen('licht:'+k)); S.lic=bb.LIZENZEN.map(l=>l.id); bb.run(0.5,0.05); });
  const messe=async(was)=>H.stuecke(p,new Function('return '+`(st,aus)=>{ const bb=window.__bb, R=bb.renderer, gl=R.getContext(), was=${JSON.stringify(was)};
    if(!st.init){ st.init=1; st.t=0; st.logik=[]; st.bild=[]; st.part=[]; st.max={}; st.log=[]; bb.fwLog(st.log); st.px=new Uint8Array(4);
      if(was==='monster'){ const N=500, d={stufe:4,name:'Monster',abschnitte:[
          bb.wbAbschnitt({e:'licht:kometenkrone',A:'gold',B:'weiss',n:60,takt:2,muster:'faecher'}),
          bb.wbAbschnitt({e:'brokat',A:'gold',B:'pastellkoralle',n:120,takt:1,muster:'lr',hoehe:2,kal:2}),
          bb.wbAbschnitt({e:'zeitregen',A:'gold',B:'flieder',n:120,takt:0,muster:'w',hoehe:2,kal:2}),
          bb.wbAbschnitt({e:'kronleuchter',A:'gold',B:'blau',n:100,takt:0,muster:'z',hoehe:2,kal:2}),
          bb.wbAbschnitt({e:'kamuro',A:'gold',B:'weiss',n:100,muster:'finale',hoehe:2,kal:2})]};
        st.soll=bb.wbDauer(d); bb.wbVorschauStart(d); }
      else { const T=bb.WB_VS.tisch; bb.clock=1300; bb.applyTOD(); bb.setView(bb.WB_VS.auge[0],bb.WB_VS.auge[2],0,0); bb.igniteType('b7_ragnaroek',{x:T.x,y:0.95,z:T.z}); st.soll=bb.zuendPlan('b7_ragnaroek').dauer; } }
    /* beide aus derselben Abendansicht der Vorschau (WB_VS) gezeichnet */
    const kam=()=>{ const a=bb.WB_VS.auge, z=bb.WB_VS.zielHimmel, c=bb.camera; c.position.set(a[0],a[1],a[2]); c.fov=bb.WB_VS.fovHimmel; c.updateProjectionMatrix(); c.lookAt(z[0],z[1],z[2]); c.updateMatrixWorld(); };
    const lebend=()=>{ const o={}; let s=0; for(const [n,ps] of [['huge',bb.psHuge],['big',bb.psBig],['mid',bb.psMid],['small',bb.psSmall]]){ let k=0; for(let i=0;i<ps.max;i++) if(ps.life[i]>0) k++; o[n]=k; s+=k; st.max[n]=Math.max(st.max[n]||0,k); st.max[n+'Max']=ps.max; } o.s=s; return o; };
    while(!aus()&&st.t<st.soll+6&&(was!=='monster'||bb.wbVs||st.t<2)){
      const t0=performance.now(); bb.run(0.25,0.05); const t1=performance.now(); st.logik.push((t1-t0)/5); st.t+=0.25;
      const L=lebend(); st.part.push(L.s);
      if(Math.round(st.t*4)%8===0){ kam(); const t2=performance.now(); bb.renderFrame(0.05); gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,st.px); st.bild.push(performance.now()-t2); } }
    const fertig=st.t>=st.soll+6||(was==='monster'&&!bb.wbVs&&st.t>=2);
    if(!fertig) return {fertig:false,info:{t:Math.round(st.t),teil:st.part[st.part.length-1]}};
    bb.fwLog(null); if(bb.wbVs) bb.wbVorschauEnde(true);
    const q=(a,f)=>{ const s=a.slice().sort((x,y)=>x-y); return s.length?+s[Math.min(s.length-1,Math.floor(s.length*f))].toFixed(1):0; };
    const starts=st.log.filter(e=>e.art==='schuss'||e.art==='perle').length;
    return {fertig:true,erg:{was,dauer:Math.round(st.t),soll:Math.round(st.soll),starts,logikMs:{mittel:q(st.logik,0.5),p95:q(st.logik,0.95),max:q(st.logik,1)},bildMs:{mittel:q(st.bild,0.5),p95:q(st.bild,0.95),max:q(st.bild,1),n:st.bild.length},
      partikel:{mittel:q(st.part,0.5),p95:q(st.part,0.95),max:q(st.part,1)},pools:st.max}}; }`)(),{name:'Messung '+was});
  const mon=await messe('monster'); console.log('MONSTER',gfx,JSON.stringify(mon.erg));
  const rag=await messe('ragnaroek'); console.log('RAGNAROEK',gfx,JSON.stringify(rag.erg));
  const m=mon.erg, r=rag.erg, mangel=[];
  if(m.starts!==500) mangel.push('Monster: '+m.starts+' Starts statt 500');
  /* Leistungstauglich: Zeichnen und Logik im Mittel und p95 hoechstens 25 % ueber dem groessten Kaufverbund */
  if(m.bildMs.p95>r.bildMs.p95*1.25) mangel.push(`Bild p95 ${m.bildMs.p95} ms gegen ${r.bildMs.p95} ms (Ragnaroek)`);
  if(m.logikMs.p95>Math.max(r.logikMs.p95*1.25,r.logikMs.p95+2)) mangel.push(`Logik p95 ${m.logikMs.p95} ms gegen ${r.logikMs.p95} ms`);
  console.log(errs.length?'ERRORS: '+errs.slice(0,5).join(' | '):'keine Seitenfehler');
  console.log(mangel.length?'MANGEL: '+mangel.join(' | '):'ALLES OK');
  await b.close(); process.exit(mangel.length||errs.length?1:0);
})().catch(e=>{ console.error('ABBRUCH',e); process.exit(2); });

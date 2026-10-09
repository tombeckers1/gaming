/* Grosse Halle (30-halle-*): eigenstaendig laden (#halle), ohne Fehler,
   Mass nach Plan v7, Kollision an gelber Wand und Tor N1, Aufwand im Rahmen.
   Aufruf: node halle.js real.html [gfx]   (Grafikstufe, Standard hoch) */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const gfx=process.argv[3]||'hoch';
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:960,height:540}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  await p.addInitScript(g=>{ try{ localStorage.setItem('bb_gfx',g); }catch(e){} },gfx);
  await p.goto('file://'+process.argv[2]+'#halle');
  await p.waitForFunction('window.__halle&&window.__halle.fertig',null,{timeout:240000});
  const mangel=[], pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const H=__halle, V=H.HV7, m=H.messen();
    const wand=H.schiebe(-36.1,-15.0), n1=H.schiebe(-36.1,-12.0), schleuse=H.schiebe(-26.0,-25.0), regal=H.schiebe(-57.0,-27.2);
    return {fehler:H.fehler(),spiel:!!window.__bb,ges:m.gesamt,bereiche:Object.keys(m).length,schleuseL:V.schleuse.z1-V.schleuse.z0,
      kl3:(V.kl3.x1-V.kl3.x0)*(V.kl3.z1-V.kl3.z0),gassen:V.gassen.length,schnell:V.schnell.n,hrHoehe:V.hr.hoehe,hallenH:V.H,prodH:V.PH,
      prodFl:(V.prod.x1-V.prod.x0)*(V.prod.z1-V.prod.z0),pal:H.HALLE.palettenHR,wand,n1,schleuse,regal,lampen:H.HALLE.lampen.length,laptop:!!H.HALLE.laptop,
      tore:V.tore.map(t=>t.n).concat(V.ptore.map(t=>t.n)).join(','),lade:H.HM.ladezeit}; });
  console.log('HALLE',JSON.stringify(r));
  pruef('Fehler',!r.fehler,r.fehler); pruef('Spielwelt',!r.spiel,'Hauptspiel wurde mitgeladen');
  pruef('Schleuse',r.schleuseL>12.5&&r.schleuseL<13.5,r.schleuseL);
  pruef('Kartonlager3',Math.abs(r.kl3-161)<3,r.kl3);
  pruef('Gassen',r.gassen===3,r.gassen); pruef('Schnellplaetze',r.schnell===13,r.schnell);
  pruef('Hochregal',r.hrHoehe<=10&&r.hrHoehe>9.5&&r.hallenH>=11,r.hrHoehe+'/'+r.hallenH);
  pruef('Produktion',r.prodH===5&&Math.abs(r.prodFl-945)<40,r.prodH+' m, '+r.prodFl+' m2');
  pruef('Palettenplaetze',r.pal>300&&r.pal<=540,r.pal);
  pruef('Tore',r.tore==='R2,R3,R4,R6,R5',r.tore);
  pruef('gelbe Wand',Math.abs(r.wand.x+36.12)>0.3,JSON.stringify(r.wand));
  pruef('N1 offen',Math.abs(r.n1.x+36.1)<0.01,JSON.stringify(r.n1));
  pruef('Schleuse offen',Math.abs(r.schleuse.x+26.0)<0.01,JSON.stringify(r.schleuse));
  pruef('Regal fest',Math.abs(r.regal.z+27.2)>0.2,JSON.stringify(r.regal));
  pruef('Laptop',r.laptop,'fehlt');
  pruef('Aufwand',r.ges.tri<(gfx==='ultralow'||gfx==='niedrig'?200000:300000)&&r.ges.draw<320,JSON.stringify(r.ges));
  /* ein Bild aus der Ansicht am Eingang: Zeichenaufrufe und Dreiecke */
  const z=await p.evaluate(()=>{ const v=__halle.ansichten[0]; __halle.ansicht(v[1],v[2],v[3],v[4],v[5]); __halle.shot(); return __halle.info(); });
  console.log('BILD',JSON.stringify(z));
  pruef('Bild',z.calls>40&&z.calls<500,JSON.stringify(z));
  console.log(mangel.length?'MANGEL: '+mangel.join(' | '):'ALLES OK');
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

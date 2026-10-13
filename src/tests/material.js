/* Materialbibliothek (Fundament Etappe 2, 13.10., Tom: "einheitliche Struktur - aendert man es an
   einer Stelle, aendert es sich ueberall"):
   - BIBLIOTHEK: MAT und bk sind da, geteilte Materialien/Texturen werden wirklich geteilt
     (Abrufe > Materialien), Beton und Doppelstabmatte gibt es genau einmal
   - WACHE: kein geteiltes Material wird waehrend des Spiels veraendert (Waechter in 01b:
     color/opacity/emissiveIntensity/map/visible/dispose ...) - Gameplay-Vorfuehrung aufbauen,
     einen Spieltag laufen lassen, Tag/Abend/Nacht aus mehreren Blickwinkeln zeichnen
   - SZENE: Material-Objekte im Szenengraf (alle Zonen offen) unter 700 (vorher 973)
   - SAMMLER: Baukasten-Meshes tragen userData.bauteil
   Gegenprobe: GEGENPROBE=1 veraendert absichtlich ein geteiltes Material -> WACHE meldet.
   Aufruf: node material.js real.html */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const GP=process.env.GEGENPROBE==='1';
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:480,height:300}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  const mangel=[]; const pruef=(n,ok,w)=>{ if(!ok) mangel.push(n+': '+w); };
  await p.addInitScript(()=>{ window.__MATWACHE=true; try{ if(!sessionStorage.getItem('x')){ localStorage.clear(); sessionStorage.setItem('x','1'); } }catch(e){} });
  await p.goto('file://'+process.argv[2],{timeout:900000,waitUntil:'domcontentloaded'});
  await p.waitForFunction("!!window.__bb&&!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:900000,polling:1000});
  await p.evaluate(()=>{ document.querySelector('#startBtns button:last-child').click(); document.getElementById('nameGo').click(); });
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:900000,polling:1000});
  const r=await p.evaluate(gp=>{ const bb=__bb, o={}, MAT=bb.MAT, bk=bb.bk;
    o.da=!!MAT&&!!bk&&MAT.wache;
    bb.S.level=99; for(const u of bb.UPGRADES) bb.S.up[u.id]=true; try{ bb.applyZonen(); }catch(e){}
    const zaehle=()=>{ const s=new Set(); bb.scene.traverse(x=>{ if(x.isMesh) (Array.isArray(x.material)?x.material:[x.material]).forEach(m=>m&&s.add(m)); }); return s.size; };
    o.matsStart=zaehle();
    bb.gpStart(); let n=0; while(!bb.gpFertig&&n++<5000) bb.gpBauSchritt(50);
    const blicke=[[0,3,0,0],[-14,-2,0,0],[-17,-2,-Math.PI/2,0],[-27,3,-Math.PI/2,0],[0,12,Math.PI,0.05],[0,-12,0,0.05]];
    const zeichnen=clk=>{ for(const v of blicke){ bb.setView(...v); bb.clock=clk; bb.applyTOD(); bb.kameraSetzen(); bb.renderFrame(0.016); } };
    zeichnen(600);
    const d0=bb.S.day; let k=0; while(bb.S.day<d0+1&&k++<3000) bb.run(3,0.1);
    zeichnen(1000); zeichnen(1300); bb.save();
    if(gp) MAT.get('markierungGelb').color.setHex(0xff0000);
    const L=MAT.liste(); o.liste={geteilt:L.geteilt,abrufe:L.abrufe,gespart:L.gespart,eigene:L.eigene.length};
    o.beton=L.texturen.filter(t=>t.name==='beton').map(t=>t.abrufe)[0]||0; o.doppelstab=L.materialien.filter(t=>t.name==='get:zaunGitter').map(t=>t.abrufe)[0]||0;
    o.nBeton=L.texturen.filter(t=>t.name==='beton').length; o.betonBoden=L.materialien.filter(t=>t.name==='get:betonBoden').map(t=>t.abrufe)[0]||0;
    /* Materialangleichung 13.10.: Hofbeton, Warnschraffur und Drahtgitter je EIN Material/EINE Textur */
    const ab=n=>L.materialien.filter(t=>t.name===n).map(t=>t.abrufe)[0]||0; o.betonHof=ab('get:betonHof'); o.warn=ab('get:warnschraffur'); o.gitterGelb=ab('get:gitterGelb');
    o.nTex=L.texturen.map(t=>t.name).sort().join(','); o.kat=L.katalog&&L.katalog.farben.every(f=>f.name&&f.hex&&f.wofuer)&&L.katalog.rezepte.every(x=>x.wofuer);
    o.verstoesse=MAT.verstoesse.slice(0,8); o.nVerst=MAT.verstoesse.length;
    const mats=new Set(); let bauteil=0, vcOhne=0;
    bb.scene.traverse(x=>{ if(!x.isMesh) return; (Array.isArray(x.material)?x.material:[x.material]).forEach(m=>m&&mats.add(m));
      if(x.userData.bauteil) bauteil++; });
    o.mats=mats.size; o.bauteil=bauteil; o.tag=bb.S.day-d0;
    return o; },GP);
  console.log(JSON.stringify(r).slice(0,3000));
  pruef('BIBLIOTHEK',r.da&&r.liste.gespart>=300&&r.betonBoden+r.betonHof>=12&&r.nBeton===1&&r.doppelstab>=5,JSON.stringify({da:r.da,liste:r.liste,beton:r.beton,betonBoden:r.betonBoden,betonHof:r.betonHof,doppelstab:r.doppelstab}));
  pruef('ANGLEICHUNG',r.warn>=3&&r.gitterGelb>=2&&/drahtgitter/.test(r.nTex)&&/warnschraffur/.test(r.nTex)&&r.kat,'Warnschraffur/Drahtgitter nicht geteilt oder Katalog ohne Name/wofuer: '+JSON.stringify({warn:r.warn,gitter:r.gitterGelb,tex:r.nTex,kat:r.kat}));
  pruef('WACHE',r.nVerst===0,r.nVerst+' Veraenderungen an geteilten Materialien: '+JSON.stringify(r.verstoesse));
  pruef('SZENE',r.matsStart<700,'Material-Objekte im Szenengraf (alle Zonen, vor der Vorfuehrung; vorher 973): '+r.matsStart);
  pruef('SAMMLER',r.bauteil>=1,'Meshes mit userData.bauteil: '+r.bauteil);
  pruef('TAG',r.tag>=1,'Spieltag lief nicht durch');
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log(mangel.length||errs.length?'ERRORS: '+errs.concat(mangel).join(' | '):'ALLES OK');
  await b.close();
})();

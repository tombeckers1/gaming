/* Feuerwerk-Teststation (nur Entwicklung, Tom 24.09.):
   - Laptop > Laden: Knopf da, solange FW_DEV an ist
   - einschalten: Nacht, von jedem zuendbaren Produkt genau ein
     Karton neben dem Zuendpult, man steht davor
   - Karton aufheben, auf die Station stellen, zuenden: es knallt
   - ausschalten: Kartons weg, Tageslicht wieder da
   Aufruf: node fwtest.js real.html [bild] */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:640}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, o={};
    bb.run(0.3,0.05); o.sonneTag=bb.sonne();
    bb.openLaptop(); const tab=document.querySelector('[data-tab="shop"]')||[...document.querySelectorAll('[data-tab]')].find(e=>/Laden/.test(e.textContent)); if(tab) tab.click();
    const knopf=document.querySelector('#lbody [data-a="fwtest"]'); o.knopf=!!knopf; if(knopf) knopf.click();
    bb.run(0.3,0.05);
    o.an=bb.fwTestAn; o.sonneNacht=bb.sonne(); o.laptopZu=!document.getElementById('laptop').classList.contains('show');
    const soll=bb.fwTestProdukte(), da=bb.fwTestBoxen.map(x=>x.type);
    o.soll=soll.length; o.da=da.length; o.fehlt=soll.filter(t=>da.indexOf(t)<0); o.doppelt=da.length-new Set(da).size;
    o.arten={tisch:soll.filter(t=>bb.stationOf(t)==='tisch').length,rampe:soll.filter(t=>bb.stationOf(t)==='rampe').length,moerser:soll.filter(t=>bb.stationOf(t)==='moerser').length};
    const pp=bb.playerPos(); o.spieler=[+pp.x.toFixed(1),+pp.z.toFixed(1)];
    /* kein Karton steckt in einem Hindernis (Mast, Tisch, Wand) */
    o.imWeg=bb.fwTestBoxen.filter(x=>bb.colliders.some(c=>c.x0!==undefined&&x.mesh.position.x>c.x0-0.2&&x.mesh.position.x<c.x1+0.2&&x.mesh.position.z>c.z0-0.2&&x.mesh.position.z<c.z1+0.2)||Math.hypot(x.mesh.position.x+5.6,x.mesh.position.z+13.0)<0.5).map(x=>x.type);
    /* naechster Karton ist in Reichweite */
    o.naechster=+Math.min(...bb.fwTestBoxen.map(x=>Math.hypot(x.mesh.position.x-pp.x,x.mesh.position.z-pp.z))).toFixed(2);
    /* Kugelbombe aufheben, in den Moerser, zuenden */
    const kb=bb.fwTestBoxen.find(x=>x.type==='kugel300');
    const log=[]; bb.fwLog(log);
    bb.tuAktion('box',kb); o.traegt=bb.S.carrying&&bb.S.carrying.type;
    bb.placeOnStation(bb.stations.moerser); bb.S.carrying=null;
    bb.zuendeAlle(); bb.run(4,0.1); bb.fwLog(null);
    o.gezuendet=log.filter(e=>e.art==='kugel').length;
    /* aus */
    bb.fwTestSchalten(); bb.run(0.3,0.05);
    o.aus={an:bb.fwTestAn,sonne:bb.sonne(),reste:bb.floorBoxes.filter(x=>soll.indexOf(x.type)>=0&&x.mesh.position.z<-12).length};
    return o; });
  console.log(JSON.stringify(r));
  pruef('KNOPF',r.knopf,'kein Knopf unter Laden');
  pruef('NACHT',r.an&&r.sonneNacht<0.3&&r.sonneTag>1,'keine Nacht: '+r.sonneTag+' -> '+r.sonneNacht);
  pruef('KARTONS',r.da===r.soll&&!r.fehlt.length&&!r.doppelt&&r.soll>=40,'Kartons: '+JSON.stringify({soll:r.soll,da:r.da,fehlt:r.fehlt,doppelt:r.doppelt}));
  pruef('FREI',!r.imWeg.length,'Kartons stecken in Hindernissen: '+r.imWeg.join(','));
  pruef('NAH',r.naechster<2.5,'Kartons zu weit weg: '+r.naechster);
  pruef('ZUENDEN',r.traegt==='kugel300'&&r.gezuendet===1,'aufheben und zuenden geht nicht: '+JSON.stringify([r.traegt,r.gezuendet]));
  pruef('AUS',!r.aus.an&&r.aus.sonne>1&&r.aus.reste===0,'Ausschalten: '+JSON.stringify(r.aus));
  if(process.argv[3]){ await p.evaluate(()=>{ const bb=window.__bb; bb.fwTestSchalten(); bb.run(0.3,0.05); document.querySelectorAll('#hud,.tip,#tip,#toasts,#zielPfeil').forEach(e=>e.style.display='none'); bb.renderFrame(1/60); });
    await p.screenshot({path:process.argv[3]}); }
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

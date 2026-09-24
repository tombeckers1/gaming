/* Schnee darf in keinem ueberdachten Raum fallen, und er muss dem
   Spieler folgen - sonst schneit es auf dem gewachsenen Grundstueck
   nur noch ueber der alten Kartenmitte. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const fehler=[];
  p.on('pageerror',e=>fehler.push('PAGEERROR '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:90000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  const r=await p.evaluate(()=>{
    const bb=window.__bb;
    bb.S.level=40; bb.S.money=9e6;
    ['shop_halb','shop_gross','shop_ost','shop_sued','lager','lager_nord','lager_gross','lager_sued','lager_west']
      .forEach(id=>{ bb.S.up[id]=true; if(bb.ZONEN[id]) bb.oeffneZone(id,false); });
    bb.applyZonen();
    const orte=[['Verkauf',0,0],['Rueckgebaeude',22,-14],['Lager Sued',-14,-20],
                ['Grosshandel',-46,-26],['Lagergang',0,-7.5],['Testfeld',0,-20]];
    const out={};
    for(const [name,x,z] of orte){
      bb.setView(x,z,0,0);
      for(let k=0;k<200;k++) bb.updateSnow(1/30);
      const a=bb.snowPts.geometry.attributes.position.array;
      /* Die Raeume kommen aus dem Grundriss, NICHT aus unterDach() -
         sonst prueft der Test dieselbe Funktion, die er pruefen
         soll, und ist immer gruen. */
      const L=bb.LAY, G=bb.GANG;
      const R=[[L.basis,3.6],[L.ost1,3.6],[L.ost2,3.6],[L.sued,3.6],
               [L.lbasis,3.6],[L.lnord,2.9],[L.lsued,5.0],[L.lwest,12.0],
               [L.schleuse,3.4],[{x0:G.x0,x1:G.x1,z0:G.z0,z1:G.z1},G.h]];
      let drin=0, nah=0;
      for(let i=0;i<a.length;i+=3){
        for(const [r2,h] of R)
          if(a[i]>r2.x0&&a[i]<r2.x1&&a[i+2]>r2.z0&&a[i+2]<r2.z1&&a[i+1]<h){ drin++; break; }
        if(Math.abs(a[i]-x)<45&&Math.abs(a[i+2]-z)<45) nah++;
      }
      out[name]={flockenImRaum:drin,inReichweite:Math.round(nah/(a.length/3)*100)+'%'};
    }
    return out;
  });
  let schlimm=0;
  for(const k in r){
    console.log(`${k.padEnd(15)} Flocken im Raum: ${String(r[k].flockenImRaum).padStart(4)}   in Reichweite: ${r[k].inReichweite}`);
    /* Eine einzelne Flocke kann in dem Bild, das der Test misst,
       gerade noch im Raum stehen, bevor updateSnow sie umsetzt -
       das ist kein Fehler. Der echte Fehler waren 100 bis 400
       Flocken je Raum, die Trennschaerfe bleibt also erhalten. */
    if(r[k].flockenImRaum>2) schlimm++;
  }
  console.log(fehler.length?fehler[0]:(schlimm?`ERRORS: in ${schlimm} Raeumen schneit es`:'ERRORS: keine'));
  await b.close();
})();

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1400,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_CERT')<0) errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  console.log('LAPTOP:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,$=id=>document.getElementById(id),o={};
    bb.S.money=99999; bb.S.level=30;
    bb.openLaptop();
    o.breite=Math.round($('laptop').querySelector('.card').getBoundingClientRect().width);
    o.tabs=[...document.querySelectorAll('#ltabs button')].map(x=>x.dataset.tab);
    const zaehl={};
    for(const t of ['up','einr','markt']){
      document.querySelector(`#ltabs button[data-tab="${t}"]`).click();
      zaehl[t]={zeilen:document.querySelectorAll('#lbody .row').length,
                bilder:document.querySelectorAll('#lbody img.pic').length};
    }
    o.kategorien=zaehl;
    document.querySelector('#ltabs button[data-tab="deko"]').click();
    const txt=$('lbody').textContent;
    o.dekoZeigtPreis=/Kosten|Gekauft/.test(txt);
    o.dekoUeberschriften=/Wandfarbe/.test(txt)&&/Bodenbelag/.test(txt);
    const vor=bb.S.money; bb.setFloor('holz');
    o.bodenKostet=vor-bb.S.money>0; o.bodenGesetzt=bb.S.floor;
    bb.closeLaptop(false);
    return o;
  })));
  console.log('WELT:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    o.stationen=bb.STATION_POS;
    o.pultDrehung=+bb.pultYaw().toFixed(3);
    const m=bb.testfeldMitte(), pos={x:5.9,z:-7.4};
    const soll=Math.atan2(-(m.x-pos.x),-(m.z-pos.z));
    bb.setView(pos.x,pos.z,0,0);
    bb.S.level=20; bb.S.carrying={type:'raketen',count:3,q:1};
    bb.placeOnStation(bb.stations.rampe); bb.firePult();
    for(let i=0;i<60;i++) bb.step(0.05);
    let d=bb.camYaw()-soll; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI;
    o.blickAbweichungGrad=+(Math.abs(d)*180/Math.PI).toFixed(1);
    /* Uhr laeuft? */
    const y0=bb.uhrZeiger();
    bb.clock+=90; for(let i=0;i<5;i++) bb.step(0.05);
    const y1=bb.uhrZeiger();
    o.uhrBewegtSich=y0.min!==y1.min&&y0.std!==y1.std;
    return o;
  })));
  console.log('REGAL:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    bb.regalStellen('rack');
    const rk=bb.racks[0];
    const px=()=>rk.schildTex.image.getContext('2d').getImageData(0,80,rk.schildTex.image.width,120).data.join('');
    const leer=px();
    bb.putInSlot(rk.slots[0],'knallerbsen',32,1);
    o.schildAendertSich=px()!==leer;
    o.hatSchild=!!rk.schildTex;
    return o;
  })));
  console.log('ERRORS:',errs.length?errs.slice(0,4).join('\n'):'keine');
  await b.close();
})();

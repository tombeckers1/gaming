/* Ausbau-Bilder im Laptop (Tom, 26.09.: "Die Bilder musst du teils
   ueberarbeiten, 'Paket fuer Versand' passt zB nicht")
   - BILD: jeder Ausbau hat ein Bild, keins ist leer
   - EIGEN: keine zwei Ausbauten teilen sich dasselbe Bild (vorher:
     Soundanlage = Heizung, SB-Kassen = SB-Kassen Eingang 2)
   - MOTIV: kein Ausbau faellt auf das Ersatzbild (Fragezeichen) */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:60000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1000,height:700}}); p.setDefaultTimeout(180000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:120000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(async()=>{ const bb=window.__bb, U=bb.UPGRADES, ids=U.map(u=>u.id), o={n:ids.length,leer:[],gleich:[],ohneMotiv:[],fehler:[]};
    const seen={}, ersatz=bb.upPic('__kein_ausbau__');
    for(const id of ids){ let url; try{ url=bb.upPic(id); }catch(e){ o.fehler.push(id+':'+e.message); continue; }
      const im=new Image(); im.src=url; await im.decode(); const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const g=c.getContext('2d'); g.drawImage(im,0,0);
      const d=g.getImageData(0,0,c.width,c.height).data; let mn=1e9,mx=-1; for(let i=0;i<d.length;i+=4*7){ const l=d[i]+d[i+1]+d[i+2]; mn=Math.min(mn,l); mx=Math.max(mx,l); }
      if(mx-mn<120) o.leer.push(id);
      if(seen[url]) o.gleich.push(seen[url]+'='+id); else seen[url]=id;
      if(url===ersatz) o.ohneMotiv.push(id); }
    return o; });
  console.log('BILDER  ',JSON.stringify(r));
  pruef('BILD',r.n>=40&&!r.fehler.length&&!r.leer.length,'fehlend/leer: '+JSON.stringify([r.n,r.fehler,r.leer]));
  pruef('EIGEN',!r.gleich.length,'gleiches Bild: '+r.gleich.join(', '));
  pruef('MOTIV',!r.ohneMotiv.length,'Ersatzbild (Fragezeichen): '+r.ohneMotiv.join(', '));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join(' | '):'keine');
  await b.close();
})();

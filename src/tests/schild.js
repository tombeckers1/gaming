/* Regalschilder: Farben setzen, speichern, laden */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:20000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_CERT')<0) errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);

  /* Bildpunkt aus der Mitte des Kopfschilds lesen */
  /* Eine Zeile quer durch das Schild scannen: die haeufigste Farbe ist
     der Hintergrund, die zweithaeufigste die Schrift. Ein einzelner
     Messpunkt in der Mitte landet leicht in einer Buchstabenluecke. */
  const px=()=>p.evaluate(()=>{
    const bb=window.__bb, sh=bb.shelves[0];
    if(!sh||!sh.headTex) return null;
    const c=sh.headTex.image, g=c.getContext('2d');
    const y=Math.round(c.height*0.52);
    const d=g.getImageData(0,y,c.width,1).data, zaehl={};
    for(let i=0;i<c.width;i++){
      const k='#'+[d[i*4],d[i*4+1],d[i*4+2]].map(v=>v.toString(16).padStart(2,'0')).join('');
      zaehl[k]=(zaehl[k]||0)+1;
    }
    const sortiert=Object.keys(zaehl).sort((a,b)=>zaehl[b]-zaehl[a]);
    return {bg:sortiert[0],text:sortiert[1]||null,farben:sortiert.length};
  });

  const start=await p.evaluate(()=>{
    const bb=window.__bb;
    bb.S.level=20; bb.S.money=99999;
    bb.buyUp('shelf_standard');
    const lv=bb.shelves[0].levels[0];
    for(let i=0;i<6;i++) bb.addToLevel(lv,'boeller',1);
    return {regale:bb.shelves.length,bg:bb.S.schildBg,fg:bb.S.schildFg};
  });
  console.log('START',JSON.stringify(start),JSON.stringify(await px()));

  const gesetzt=await p.evaluate(()=>{
    const bb=window.__bb;
    bb.setSchild('schildbg','tuerkis');
    bb.setSchild('schildfg','gelb');
    return {bg:bb.S.schildBg,fg:bb.S.schildFg,
            listen:{bg:bb.SCHILDBG.length,fg:bb.SCHILDFG.length}};
  });
  console.log('GESETZT',JSON.stringify(gesetzt),JSON.stringify(await px()));

  /* Alle Kombinationen durchprobieren, keine darf einen Fehler werfen */
  const alle=await p.evaluate(()=>{
    const bb=window.__bb; let n=0;
    for(const a of bb.SCHILDBG) for(const c of bb.SCHILDFG){
      bb.setSchild('schildbg',a.id); bb.setSchild('schildfg',c.id); n++; }
    bb.setSchild('schildbg','bordeaux'); bb.setSchild('schildfg','sand');
    return {kombinationen:n,bg:bb.S.schildBg,fg:bb.S.schildFg};
  });
  console.log('ALLE',JSON.stringify(alle),JSON.stringify(await px()));

  /* Speichern, neu laden, Farbe muss bleiben */
  await p.evaluate(()=>window.__bb.save());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:20000});
  await p.waitForTimeout(300);
  const neu=await p.evaluate(()=>({bg:window.__bb.S.schildBg,fg:window.__bb.S.schildFg,regale:window.__bb.shelves.length}));
  console.log('NEUGELADEN',JSON.stringify(neu),JSON.stringify(await px()));

  /* Und im Laptop sind die Muster da */
  await p.evaluate(()=>window.__bb.openLaptop());
  await p.waitForTimeout(150);
  await p.click('#ltabs button[data-tab="deko"]'); await p.waitForTimeout(150);
  const ui=await p.evaluate(()=>({
    bgKnoepfe:document.querySelectorAll('[data-a="schildbg"]').length,
    fgKnoepfe:document.querySelectorAll('[data-a="schildfg"]').length,
    aktivBg:(document.querySelector('[data-a="schildbg"].on')||{}).dataset,
    aktivFg:(document.querySelector('[data-a="schildfg"].on')||{}).dataset}));
  console.log('LAPTOP',JSON.stringify(ui));
  await p.evaluate(()=>{ document.getElementById('lbody').scrollTop=120; });
  await p.waitForTimeout(120);
  await p.screenshot({path:'/tmp/schild-laptop.png'});
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'ERRORS: keine');
  await b.close();
})();

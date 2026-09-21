const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&m.text().indexOf('ERR_CERT')<0) errs.push('CONSOLE: '+m.text()); });
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.waitForTimeout(800);
  console.log('START:',JSON.stringify(await p.evaluate(()=>{
    const $=id=>document.getElementById(id), o={};
    const st=$('start');
    o.sichtbar=st.classList.contains('show');
    const cs=getComputedStyle(st);
    o.deckend=cs.backgroundColor;
    o.text=st.textContent.replace(/\s+/g,' ').trim();
    o.canvas=!!$('startFx');
    const c=$('startFx'); o.canvasGross=c?c.width>300&&c.height>200:false;
    o.knoepfe=[...$('startBtns').querySelectorAll('button')].map(b=>b.textContent);
    o.logoTransparent=null;
    return o;
  })));
  /* Feuerwerk laeuft? Canvas-Inhalt muss sich aendern */
  const a=await p.evaluate(()=>document.getElementById('startFx').toDataURL().length);
  await p.waitForTimeout(1400);
  const b2=await p.evaluate(()=>document.getElementById('startFx').toDataURL().length);
  console.log('ANIMATION:',JSON.stringify({vorher:a,nachher:b2,bewegtSich:a!==b2}));
  /* Logo wirklich freigestellt? Ecke pruefen */
  console.log('LOGO:',JSON.stringify(await p.evaluate(async()=>{
    const im=document.getElementById('logoImg');
    if(!im.src.startsWith('data:')) return {freigestellt:false,grund:'nicht umgerechnet'};
    const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight;
    const g=c.getContext('2d'); g.drawImage(im,0,0);
    const d=g.getImageData(0,0,c.width,c.height).data;
    let klar=0, gesamt=0;
    const pick=[[2,2],[c.width-3,2],[2,c.height-3],[c.width-3,c.height-3],[c.width>>1,2]];
    for(const [x,y] of pick){ const i=(y*c.width+x)*4; gesamt++; if(d[i+3]<20) klar++; }
    let opak=0; for(let i=3;i<d.length;i+=4) if(d[i]>200) opak++;
    return {freigestellt:klar===gesamt,eckenTransparent:klar+'/'+gesamt,anteilOpak:+(opak/(d.length/4)).toFixed(2)};
  })));
  /* Neues Spiel -> Namensmaske */
  console.log('BENENNEN:',JSON.stringify(await p.evaluate(()=>{
    const $=id=>document.getElementById(id), o={};
    [...$('startBtns').querySelectorAll('button')].find(b=>/Neues Spiel/.test(b.textContent)).click();
    o.maskeAuf=$('nameBox').classList.contains('show');
    o.knoepfeWeg=$('startBtns').style.display==='none';
    $('shopInput').value='Knallkiste'; $('sloganInput').value='Es knallt seit 2026';
    $('nameGo').click();
    const bb=window.__bb;
    o.name=bb.S.shopName; o.slogan=bb.S.slogan;
    o.startWeg=!document.getElementById('start').classList.contains('show');
    return o;
  })));
  console.log('SCHILD:',JSON.stringify(await p.evaluate(()=>{
    const bb=window.__bb,o={};
    const s1=bb.signTexPx(), c1=bb.ckTexPx();
    o.name=bb.shopName(); o.slogan=bb.shopSlogan();
    bb.S.shopName='Pyro Palast'; bb.S.slogan='Wir machen Laerm';
    bb.applyShopName();
    o.schildNeuGezeichnet=bb.signTexPx()!==s1;
    o.kasseNeuGezeichnet=bb.ckTexPx()!==c1;
    o.nachher=bb.shopName();
    return o;
  })));
  console.log('ERRORS:',errs.length?errs.join('\n'):'keine');
  await b.close();
})();

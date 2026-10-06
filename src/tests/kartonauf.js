/* Offener Karton in der Hand (Tom, 06.10.: "Wenn man die Produkte
   einraeumt, soll sich das Paket zuvor oeffnen und die Artikel werden
   dann im Paket weniger und gehen Stueck fuer Stueck ins Regal - wie
   beim Supermarket Simulator."). Geprueft:
   - ZU: der Karton ist erst zu, in der Hand sichtbar, ohne Inhalt
   - AUF: C klappt ihn auf, drin stehen die Packungen (dieselben
     Geometrien wie im Regal), so viele wie im Karton (von oben sichtbar:
     hoechstens eine Lage); erste Aktion am Fach mit zuem Karton oeffnet
   - EINRAEUMEN: N x -> Fach +N, Karton -N, Inhalt -N, jede Packung fliegt
     und ist im Fach erst nach der Landung zu sehen
   - ZURUECK: R nimmt eine Packung aus dem Fach zurueck in den Karton
   - LADEN: offener, halbleerer Karton bleibt nach dem Neuladen offen und
     halbleer
   - LEER: der letzte Einraeumer faltet den Karton zusammen, er ist weg
   - KARRE: zu steht er auf der Karre, offen ist er in der Hand
   - HANDY: Knopf "Öffnen"/"Zu" nur mit Warenkarton
   Aufruf: node kartonauf.js real.html
   Gegenprobe (06.10.): ohne kartonFlug in stockOne -> FLUG und LEER schlagen an;
   ohne Inhaltsanzeige -> AUF und EINRAEUMEN schlagen an. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:30000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:560}}); p.setDefaultTimeout(600000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  /* Zustand des Handkartons */
  const zustand=()=>p.evaluate(()=>{ const S=__bb.S, c=S.carrying, L=KH.lay;
    return {c:c?c.count:null,offen:!!(c&&c.offen),sicht:KH.g.visible,auf:+KH.auf.toFixed(2),inhalt:KH.inh.visible?KH.gezeigt:0,pro:L?L.pro:0,
      klotz:carryMesh.visible,klappe:+Math.abs(KH.k.userData.klappen[0].pv.rotation.x).toFixed(2),flug:KH.flug.length,
      tasten:document.getElementById('kTasten').textContent,knopf:document.getElementById('btnKarton').style.display+'|'+document.getElementById('btnKarton').textContent,
      geo:KH.ims.length&&KH.ims.every((m,i)=>m.geometry===__bb.pools[c?c.type:KH.typ].meshes[i].geometry)}; });
  const T=await p.evaluate(()=>{ const bb=__bb, S=bb.S;
    if(!bb.shelves.length) bb.regalStellen('standard');
    const lv=bb.allLevels().find(l=>l.type&&!bb.P[l.type].cold&&bb.P[l.type].box>=8)||bb.allLevels().find(l=>l.type&&!bb.P[l.type].cold);
    const T=lv.type; bb.allLevels().filter(l=>l.type===T).forEach(l=>{ while(l.count>0) bb.removeFromLevel(l); });
    window.__lv=lv; S.carrying={type:T,count:bb.P[T].box,q:1}; bb.updateCarry(); bb.run(0.3,1/30); return T; });
  /* 1. zu */
  const z=await zustand(); console.log('ZU      ',T,JSON.stringify(z));
  pruef('ZU',z.sicht&&!z.offen&&z.auf===0&&z.inhalt===0&&!z.klotz&&/Öffnen/.test(z.tasten)&&/^\|Öffnen$/.test(z.knopf),JSON.stringify(z));
  /* 2. C oeffnet */
  await p.keyboard.press('KeyC'); await p.evaluate(()=>__bb.run(0.6,1/30));
  const a=await zustand(); console.log('AUF     ',JSON.stringify(a));
  pruef('AUF',a.offen&&a.auf===1&&a.klappe>1.5&&a.inhalt===Math.min(a.c,a.pro)&&a.inhalt>0&&a.geo&&/Schließen/.test(a.tasten)&&/\|Zu$/.test(a.knopf),JSON.stringify(a));
  /* Platz im Karton fuer alles, was drin ist */
  const lay=await p.evaluate(T=>{ const L=kartonLayout(T); return {n:__bb.P[T].box,platz:L.pro*L.lay,s:+L.s.toFixed(2),cols:L.cols,rows:L.rows,lay:L.lay}; },T);
  console.log('LAYOUT  ',JSON.stringify(lay));
  pruef('LAYOUT',lay.platz>=lay.n&&lay.s>0.2,JSON.stringify(lay));
  /* 3. N x einraeumen: Flug, Fach +N, Karton -N, Inhalt -N */
  const e=await p.evaluate(()=>{ const bb=__bb, S=bb.S, lv=window.__lv, c=S.carrying, o={fach0:lv.count,karton0:c.count,flug:true,versteckt:true,landet:true};
    const N=5;
    for(let i=0;i<N;i++){ bb.stockOne(lv);
      const h=lv.items[lv.items.length-1], f=KH.flug[KH.flug.length-1];
      if(!f||f.h!==h) o.flug=false;
      /* im Fach waehrend des Flugs nicht gezeichnet */
      bb.run(0.08,1/60); const m=h.pool.meshes[0], a=new THREE.Matrix4(); m.getMatrixAt(h.i,a); if(a.determinant()!==0) o.versteckt=false;
      if(!f.m||!f.m.parent) o.flug=false;
      bb.run(0.3,1/60); m.getMatrixAt(h.i,a); if(Math.abs(a.determinant())<1e-9) o.landet=false; }
    bb.run(0.2,1/60);
    o.fach=lv.count-o.fach0; o.karton=c.count-o.karton0; o.N=N; o.rest=KH.flug.length; return o; });
  const e2=await zustand(); console.log('EINR    ',JSON.stringify(e),JSON.stringify(e2));
  pruef('EINRAEUMEN',e.fach===e.N&&e.karton===-e.N&&e2.inhalt===Math.min(e2.c,e2.pro)&&e2.c===a.c-e.N,JSON.stringify(e)+' '+JSON.stringify(e2));
  pruef('FLUG',e.flug&&e.versteckt&&e.landet&&e.rest===0,JSON.stringify(e));
  /* 4. R nimmt zurueck */
  const r=await p.evaluate(()=>{ const bb=__bb, lv=window.__lv, c=bb.S.carrying, f0=lv.count, k0=c.count;
    const ok=kartonZurueck(lv); bb.run(0.4,1/60); return {ok,fach:lv.count-f0,karton:c.count-k0,flug:KH.flug.length}; });
  const r2=await zustand(); console.log('ZURUECK ',JSON.stringify(r),r2.inhalt);
  pruef('ZURUECK',r.ok&&r.fach===-1&&r.karton===1&&r.flug===0&&r2.inhalt===Math.min(r2.c,r2.pro),JSON.stringify(r)+' '+r2.inhalt);
  /* 5. erste Aktion mit zuem Karton oeffnet, raeumt aber noch nicht ein */
  const o=await p.evaluate(()=>{ const bb=__bb, lv=window.__lv, c=bb.S.carrying; c.offen=false; bb.run(0.5,1/30); const f0=lv.count, k0=c.count;
    bb.tuAktion('level',lv); const zu=!!c.offen; const p0=bb.promptFor?bb.promptFor({kind:'level',ref:lv}):null; bb.run(0.5,1/30);
    return {offen:zu,fach:lv.count-f0,karton:c.count-k0,auf:+KH.auf.toFixed(2)}; });
  console.log('AKTION  ',JSON.stringify(o));
  pruef('AKTION',o.offen&&o.fach===0&&o.karton===0&&o.auf===1,JSON.stringify(o));
  /* 6. Speichern und Neuladen mit halbleerem, offenem Karton */
  const vor=await p.evaluate(()=>{ const bb=__bb, lv=window.__lv, c=bb.S.carrying; const n=Math.floor(c.count/2); for(let i=0;i<n;i++){ bb.stockOne(lv); bb.run(0.17,1/60); } bb.run(0.4,1/60); bb.save(); return {c:c.count,offen:!!c.offen,box:bb.P[c.type].box}; });
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",null,{timeout:120000});
  await p.click('#startBtns button:first-child');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",null,{timeout:30000});
  await p.evaluate(()=>__bb.run(0.6,1/30));
  const n=await zustand(); console.log('LADEN   ',JSON.stringify(vor),JSON.stringify(n));
  pruef('LADEN',vor.c<vor.box&&vor.c>0&&n.c===vor.c&&n.offen&&n.sicht&&n.auf===1&&n.inhalt===Math.min(n.c,n.pro),JSON.stringify(vor)+' '+JSON.stringify(n));
  /* 7. leer: zusammenfalten und weg */
  const l=await p.evaluate(()=>{ const bb=__bb, S=bb.S, T=S.carrying.type; let lv=bb.allLevels().find(x=>x.type===T&&x.count<bb.capOf(x,T));
    if(!lv){ lv=bb.allLevels().find(x=>!x.type&&bb.shelfAccepts(x.sh,T)&&bb.capOf(x,T)>=S.carrying.count); }
    let i=0; while(S.carrying&&i++<100){ bb.stockOne(lv); bb.run(0.05,1/60); }
    const o={weg:!S.carrying,faltet:KH.falt>0&&KH.g.visible}; bb.run(0.6,1/60); o.danach=KH.g.visible; o.flug=KH.flug.length; o.klotz=carryMesh.visible; return o; });
  console.log('LEER    ',JSON.stringify(l));
  pruef('LEER',l.weg&&l.faltet&&!l.danach&&l.flug===0&&!l.klotz,JSON.stringify(l));
  /* 8. Karre: zu auf der Karre, offen in der Hand */
  const k=await p.evaluate(T=>{ const bb=__bb, S=bb.S; S.up.sackkarre=true; S.karre={an:true,stapel:[{type:T,count:bb.P[T].box,q:1}]};
    S.carrying={type:T,count:bb.P[T].box,q:1}; bb.updateCarry(); bb.run(0.3,1/30);
    const o={karreZu:bb.karreLast(),handZu:KH.g.visible}; kartonOeffnen(true); bb.run(0.6,1/30); o.handAuf=KH.g.visible; o.inhalt=KH.gezeigt;
    o.kistenAufKarre=karreKisten.length; return o; },T);
  console.log('KARRE   ',JSON.stringify(k));
  pruef('KARRE',k.karreZu===2&&!k.handZu&&k.handAuf&&k.inhalt>0&&k.kistenAufKarre===1,JSON.stringify(k));
  /* 9. ohne Warenkarton kein Knopf, keine Hinweise */
  const h=await p.evaluate(()=>{ const bb=__bb, S=bb.S; S.karre={an:false,stapel:[]}; S.carrying=null; bb.updateCarry(); bb.run(0.2,1/30);
    return {knopf:document.getElementById('btnKarton').style.display,tasten:document.getElementById('kTasten').innerHTML,hand:KH.g.visible}; });
  console.log('OHNE    ',JSON.stringify(h));
  pruef('HANDY',h.knopf==='none'&&h.tasten===''&&!h.hand,JSON.stringify(h));
  console.log(mangel.length?'MANGEL: '+mangel.join(' || '):'ALLES OK'); console.log(errs.length?errs.slice(0,3).join('\n'):'ERRORS: keine');
  await b.close();
})();

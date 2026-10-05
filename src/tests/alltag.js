/* Alltag (Tom, 03.10.):
   - SCHRITTE: beim Laufen leise Schritte, im Stand keine
   - TUER: Ladentuer geht auf -> Tuergeraeusch, nur in der Naehe
   - SCAN/KASSE: Kassierer scannt -> Piepen, Kunde zahlt -> Kasse;
     aus 40 m Entfernung hoert man beides nicht
   - KARTON: Spieler packt ein Paket -> Kartongeraeusch
   - FEST: F am Zuendpult -> Meldung "fest eingebaut"
   - WUENSCHE: Kunden wuenschen sich nur freigeschaltete Ware
   Aufruf: node alltag.js real.html */
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
  const p=await b.newPage({viewport:{width:900,height:600}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForFunction('window.__bb!==undefined',null,{timeout:120000});
  await neuesSpiel(p);
  const mangel=[]; const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  /* Zaehler um die Geraeusche */
  await p.evaluate(()=>{ const s=__bb.sfx; window.__z={}; for(const k of ['schritt','tuerAuf','tuerZu','scan','kasse','karton']){ const f=s[k]; __z[k]=[]; s[k]=(...a)=>{ __z[k].push(a[0]); return f(...a); }; } });
  /* Wuensche zuerst, im frischen Spiel (Level 1, kaum Lizenzen) */
  const w=await p.evaluate(()=>{ const bb=__bb, S=bb.S, falsch=new Set(); let n=0;
    for(let i=0;i<3000;i++) for(const x of bb.makeWishes(null)){ n++; if(!bb.isUnlocked(x.type)) falsch.add(x.type); }
    const frei=bb.ORDER.filter(t=>bb.isUnlocked(t)).length;
    return {n,falsch:[...falsch],frei,alle:bb.ORDER.length,lvl:S.level}; });
  console.log('WUENSCHE',JSON.stringify(w));
  pruef('WUENSCHE',w.n>1000&&!w.falsch.length&&w.frei<w.alle,'gesperrte Ware gewuenscht: '+w.falsch.join(','));
  /* Schritte: stehen, dann laufen */
  const s=await p.evaluate(()=>{ const bb=__bb; bb.setView(-2.5,1.5,0,-0.2);
    __z.schritt.length=0; bb.run(2,0.05); const steh=__z.schritt.length;
    window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW'})); bb.run(2,0.05);
    window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW'}));
    const lauf=__z.schritt.length-steh; return {steh,lauf,vol:__z.schritt.slice(-1)[0],pos:bb.playerPos()}; });
  console.log('SCHRITTE',JSON.stringify(s));
  pruef('SCHRITTE',s.steh===0&&s.lauf>=3&&s.lauf<=8,'im Stand '+s.steh+', in 2 s Laufen '+s.lauf+' Schritte');
  /* Zuendpult: F -> Meldung */
  const f=await p.evaluate(()=>{ const bb=__bb, h=bb.pultHit; if(!h) return {fehlt:true};
    const T=window.THREE, q=h.getWorldPosition(new T.Vector3()); bb.setView(q.x,q.z+2.2,0,-0.35); bb.run(0.2,0.05);
    /* exakt auf das Pult zielen */
    const c=bb.camera; c.updateMatrixWorld(); const d=q.clone().sub(c.position); const yaw=Math.atan2(-d.x,-d.z), pit=Math.atan2(d.y,Math.hypot(d.x,d.z));
    bb.setView(bb.playerPos().x,bb.playerPos().z,yaw,pit); bb.run(0.1,0.05);
    const fest=!!bb.festImBlick(); bb.moebelTaste(); return {fest,toast:bb.toastLast&&(bb.toastLast.msg||bb.toastLast.text||String(bb.toastLast))}; });
  console.log('FEST',JSON.stringify(f));
  pruef('FEST',f.fest&&/fest eingebaut/.test(f.toast||''),JSON.stringify(f));
  /* Tuer: Spieler steht an der Ladentuer, Kunde kommt */
  const t=await p.evaluate(()=>{ const bb=__bb, d=bb.TUEREN[0], cx=d.cx||0;
    /* drinnen, 6 m von der Tuer: zu; dann zur Tuer gehen -> auf */
    bb.setView(cx,-1.5,Math.PI,0); bb.run(1,0.05); __z.tuerAuf.length=0; __z.tuerZu.length=0;
    bb.setView(cx,4.6,Math.PI,0); bb.run(1.5,0.05); const nah={auf:__z.tuerAuf.length,vol:__z.tuerAuf[0]};
    bb.setView(cx,-1.5,Math.PI,0); bb.run(1.5,0.05); nah.zu=__z.tuerZu.length;
    /* weit weg (Testfeld), Laden offen, Kunden kommen: nichts zu hoeren */
    bb.setView(0,-40,0,0); bb.run(0.3,0.05); bb.openShop(); __z.tuerAuf.length=0; __z.tuerZu.length=0; bb.run(90,0.05);
    return {nah,fernAuf:__z.tuerAuf.length+__z.tuerZu.length,kunden:bb.customers.length}; });
  console.log('TUER',JSON.stringify(t));
  pruef('TUER',t.nah.auf===1&&t.nah.zu===1&&t.nah.vol>0.3&&t.fernAuf===0,JSON.stringify(t));
  /* Scanner + Kasse: Kassierer einstellen, Spieler neben der Kasse */
  const k=await p.evaluate(()=>{ const bb=__bb, S=bb.S; bb.gpStart(); let gb=0; while(!bb.gpFertig&&gb++<20000) bb.gpBauSchritt(50); bb.fireStaff('packer'); S.staff.packer=false; const g=bb.ckG.position; bb.setView(g.x+1.5,g.z+1.5,0,-0.3); bb.run(0.2,0.05);
    __z.scan.length=0; __z.kasse.length=0; let n=0;
    /* 05.10.: auch SB-Kunden laeuten die Kasse - gewartet wird, bis an der
       Kasse auch gescannt wurde (vorher reichten zufaellig zwei SB-Zahler) */
    while((__z.kasse.length<2||__z.scan.length<1)&&n++<900) bb.run(0.5,0.05);
    const nah={scan:__z.scan.length,kasse:__z.kasse.length,vScan:__z.scan[0],vKasse:__z.kasse[0]};
    bb.setView(0,-40,0,0); bb.run(0.2,0.05); __z.scan.length=0; __z.kasse.length=0; let m=0, kunden=bb.DS?bb.DS.customers:0;
    while(m++<300) bb.run(0.5,0.05);
    return {nah,fern:__z.scan.length+__z.kasse.length,kunden:(bb.DS?bb.DS.customers:0)-kunden,kAlle:bb.DS&&bb.DS.customers,staff:Object.keys(S.staff).filter(x=>S.staff[x])}; });
  console.log('KASSE',JSON.stringify(k));
  pruef('SCAN',k.nah.scan>=1&&k.nah.vScan>0.2,JSON.stringify(k.nah));
  pruef('KASSE',k.nah.kasse>=2&&k.nah.vKasse>0.2,JSON.stringify(k.nah));
  pruef('FERN_LEISE',k.fern===0&&k.kunden>0,'aus 40 m: '+k.fern+' Kassengeraeusche bei '+k.kunden+' Kunden');
  /* Karton: Versand freischalten, Bestellung, packen */
  const v=await p.evaluate(()=>{ const bb=__bb, S=bb.S;
    if(!bb.packBereit()) return {bereit:false};
    for(let i=0;i<10&&!(S.bestellungen||[]).some(x=>x.st==='offen');i++){ const o=bb.vsNeueBestellung(true); if(o&&!(S.bestellungen||[]).includes(o)) (S.bestellungen=S.bestellungen||[]).push(o); }
    /* Ware fuer die Bestellung ins Lager */
    for(const o of S.bestellungen) for(const l of o.pos||[]) { for(let i=0;i<l.n+2;i++) bb.stockOne&&bb.stockOne(l.t); }
    __z.karton.length=0; const ok=bb.vsSpielerPacken(); return {bereit:true,ok,karton:__z.karton.length,toast:bb.toastLast&&(bb.toastLast.msg||String(bb.toastLast)),best:(S.bestellungen||[]).length}; });
  console.log('KARTON',JSON.stringify(v));
  pruef('KARTON',v.karton===1,JSON.stringify(v));
  pruef('FEHLER',!errs.length,errs.slice(0,5).join(' | '));
  console.log(mangel.length?'MANGEL:\n'+mangel.join('\n'):'ALLES OK'); await b.close();
})();

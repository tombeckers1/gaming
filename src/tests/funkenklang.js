/* Funkengeraeusch (Tom, 30.09.: "Wunderkerzen - das muesste ein
   durchgehendes Funkengeraeusch sein, aber es ist immer nur so ein kurzes
   Geraeusch, dann hoert sie auf, dann faengt sie an ... auch Fontaenen").
   Wunderkerzen und fontaenenartige Tischware bekommen ein durchgehendes
   Klangbett (fkBett); einzelne, abklingende Zischer (sfx.fizz) im Takt
   sind waehrend des Brennens verboten. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:60000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:30000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:90000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const WUNDER=['wunder','wunderfarbe','wunderherz','wunderzahl','wunderkerzeXXL','wunderbox'];
  const RAUSCH=['leuchtfontaene','fontaene','goldgeysir','wasserfall','zauberbrunnen','eisblume','wasserspiel','bengalholz'];
  const r=await p.evaluate(([WUNDER,RAUSCH])=>{ const bb=window.__bb, K=window.__fontklang; try{ bb.ac(); }catch(e){}
    if(!K) return {fehler:'kein __fontklang'};
    let T=0, fz=[]; const f0=bb.sfx.fizz; bb.sfx.fizz=function(){ fz.push(T); return f0.apply(this,arguments); };
    const S=bb.S; S.level=40; S.money=1e7; ['shop_halb','testfeld'].forEach(id=>bb.testKauf(id)); bb.run(0.2,0.05);
    const out={};
    for(const t of WUNDER.concat(RAUSCH).filter(t=>bb.P[t])){
      fz=[]; T=0; const b0=K.FK_KLANG_LOG.betten, a0=K.FK_KLANG_LOG.arten.length;
      bb.clearStations(); S.carrying={type:t,count:1,q:1}; bb.placeOnStation(bb.stations.tisch); S.carrying=null; bb.zuendeAlle();
      for(;T<8;T+=0.1) bb.run(0.1,0.05);
      out[t]={betten:K.FK_KLANG_LOG.betten-b0,arten:[...new Set(K.FK_KLANG_LOG.arten.slice(a0))],takt:fz.filter(x=>x>0.5).length};
      bb.clearStations(); }
    return {audio:!!(window.AudioContext||window.webkitAudioContext),out}; },[WUNDER,RAUSCH]);
  console.log('FUNKENKLANG',JSON.stringify(r));
  if(r.fehler){ console.log('ERRORS: '+r.fehler); await b.close(); return; }
  for(const [t,v] of Object.entries(r.out)){
    const wk=WUNDER.includes(t);
    pruef('DURCHGEHEND',v.betten>=1&&(!wk||v.arten.includes('wunderkerze')),t+': kein durchgehendes Klangbett '+JSON.stringify(v));
    pruef('KEIN_TAKT',v.takt===0,t+': '+v.takt+' einzelne Zischer im Takt');
  }
  pruef('ANZAHL',Object.keys(r.out).length>=10,'zu wenige Produkte: '+Object.keys(r.out).length);
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

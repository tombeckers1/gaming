/* Raketen und Kugelbomben echt (28.09., Tom: "keine Punkte, keine
   Leuchtbaelle, das sieht aus wie Lichttechnik"). Jede Rakete und jede
   Kugelbombe wird gezuendet und jeder Stern mitgeschrieben:
   - SCHWEBEN: kein Stern mit negativer Schwere, der laenger als 1 s
     lebt (die alte Furzwolke: 400 Punkte stiegen 3-5 s von selbst)
   - LEUCHTBALL: kein stehender Leuchtball - drei oder mehr grosse
     Sprites (psHuge) im selben Bild, fast ohne Tempo und laenger als
     0,17 s (kern(): die weissen und farbigen Scheiben im Zerlegerpunkt).
     Ausnahme: der Fallschirm-Leuchtsatz, der ist ein Dauerlicht.
   Aufruf: node rkecht.js test.html ['["id",...]'] */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const IDS=["raketenklein","glitzerraketen","blanko","gravur","raketen","silberpfeil","kometenraketen","pfeifraketen","farbenrausch","raketengold","knisterstern","smaragd","blinkstern","silberregen","kristall","furzrakete","regenbogenkrone","titanraketen","jumbogold","silbermond","jumboleiter","feuerdrache","supernova","kugel75","palmenkugel75","farbenmeer75","kristallkugel100","kugel100","goldweide100","kugel150","sternenstaub150","sternkugel150","feuerlilie200","goldkrone200","kanonade300","kugel300","kaiserkrone"];
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage(); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2],{timeout:240000}); await p.waitForFunction('window.__bb!==undefined',{timeout:240000});
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:240000});
  await p.click('#startBtns button:last-child'); await p.waitForSelector('#nameBox.show',{state:'visible'}); await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')");
  const ids=process.argv[3]?JSON.parse(process.argv[3]):IDS;
  const r=await p.evaluate(ids=>{ const bb=window.__bb, S=bb.S, out={};
    S.level=99; S.money=9e6; try{ bb.LIZENZEN.forEach(l=>bb.buyLizenz(l.id)); }catch(e){}
    ['shop_halb','testfeld'].forEach(id=>{ try{ bb.testKauf(id); }catch(e){} });
    const PS=[bb.psHuge,bb.psBig,bb.psMid,bb.psSmall];
    PS.forEach((ps,k)=>{ const f=ps.emit.bind(ps); ps.emit=function(x,y,z,vx,vy,vz,cr,cg,cb,life,g){ if(window.__pk) window.__pk.push([k,bb.fwUhr,Math.hypot(vx,vy,vz),life,g||0]); return f.apply(null,arguments); }; });
    for(const t of ids){
      for(let i=0;i<60&&(bb.rockets.length||bb.emittersListe().length||bb.timersLen()>0);i++) bb.run(0.5,0.25);
      window.__pk=[]; bb.igniteType(t);
      for(let s=0;s<14;s+=0.1) bb.run(0.1,0.05);
      const pk=window.__pk; window.__pk=null;
      const schweben=pk.filter(q=>q[4]<0&&q[3]>1).length;
      const bild={}; for(const q of pk) if(q[0]===0&&q[2]<0.8&&q[3]>=0.17&&q[4]===0){ const k=q[1].toFixed(3); bild[k]=(bild[k]||0)+1; }
      const ball=Object.values(bild).filter(n=>n>=3).length;
      out[t]={sterne:pk.length,schweben,ball};
    }
    return out; },ids);
  const mangel=[];
  for(const t of Object.keys(r)){ const q=r[t];
    if(!q.sterne) mangel.push(t+': kein Stern');
    if(q.schweben) mangel.push(`${t}: ${q.schweben} Sterne schweben (Schwere < 0, > 1 s)`);
    if(q.ball&&t!=='glueckrakete') mangel.push(`${t}: ${q.ball}x stehender Leuchtball`); }
  console.log(JSON.stringify(r));
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

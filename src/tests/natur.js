/* Natuerliche Bruchbilder (Tom, 25.09.: ein Effekt gegen Ende des
   Weltuntergangs "sieht nicht natuerlich aus"). Die Spinne war aus
   geraden Punktreihen gebaut, der Regenbogen aus harten Farbsektoren.
   Gemessen an den ausgestossenen Sternen:
   - reihe: Anteil der Sterne, die exakt in dieselbe Richtung fliegen
     wie ein anderer (Punktreihe)
   - nachbar: Anteil der Sterne, deren Richtungs-Nachbar dieselbe Farbe
     hat (Sektoren) - bei fuenf zufaellig gemischten Farben ~ 1/5 */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo');
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]);
  await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await p.evaluate(()=>localStorage.clear());
  await p.reload(); await p.waitForFunction('window.__bb!==undefined',{timeout:30000});
  await neuesSpiel(p);
  const mangel=[];
  const pruef=(n,ok,was)=>{ if(!ok) mangel.push(n+': '+was); };
  const r=await p.evaluate(()=>{ const bb=window.__bb, o={};
    const sterne=eff=>{ bb.run(8,0.1); const ps=bb.psBig, a=ps.next; bb.EFF[eff]({x:0,y:60,z:-40},[1,.7,.2],[.9,.9,1],1); const e=ps.next;
      const out=[]; for(let i=a;i!==e;i=(i+1)%ps.max){ const v=[ps.vel[i*3],ps.vel[i*3+1],ps.vel[i*3+2]], L=Math.hypot(...v)||1;
        out.push({d:v.map(x=>x/L),c:[ps.base[i*3],ps.base[i*3+1],ps.base[i*3+2]].map(x=>x.toFixed(2)).join()}); } return out; };
    const reihe=S=>S.filter((s,i)=>S.some((t,j)=>j!==i&&s.d[0]*t.d[0]+s.d[1]*t.d[1]+s.d[2]*t.d[2]>0.99999)).length/Math.max(1,S.length);
    const nachbar=S=>S.filter((s,i)=>{ let best=-2,bj=-1; S.forEach((t,j)=>{ if(j===i) return; const dp=s.d[0]*t.d[0]+s.d[1]*t.d[1]+s.d[2]*t.d[2]; if(dp>best){ best=dp; bj=j; } }); return S[bj]&&S[bj].c===s.c; }).length/Math.max(1,S.length);
    const sp=sterne('spinne'), rg=sterne('regenbogen');
    o.spinne={n:sp.length,reihe:+reihe(sp).toFixed(2)};
    o.regenbogen={n:rg.length,nachbar:+nachbar(rg).toFixed(2),farben:new Set(rg.map(s=>s.c)).size};
    /* Ende des Weltuntergangs: die letzten sechs Phasen */
    o.ende=bb.SHOWS.finale().slice(-6).map(ph=>[].concat(ph.eff||[])).flat();
    return o; });
  console.log('SPINNE',JSON.stringify(r.spinne),'REGENBOGEN',JSON.stringify(r.regenbogen),'ENDE',JSON.stringify(r.ende));
  pruef('SPINNE',r.spinne.n>=30&&r.spinne.reihe<0.1,'Spinne aus Punktreihen: '+JSON.stringify(r.spinne));
  pruef('REGENBOGEN',r.regenbogen.farben>=4&&r.regenbogen.nachbar<0.45,'Regenbogen in Farbsektoren: '+JSON.stringify(r.regenbogen));
  pruef('ENDE',r.ende.indexOf('regenbogen')<0,'Weltuntergang endet mit Regenbogen');
  console.log('MANGEL:',mangel.length?mangel.join(' | '):'keine');
  console.log('ERRORS:',errs.length||mangel.length?errs.concat(mangel).join('\n'):'keine');
  await b.close();
})();

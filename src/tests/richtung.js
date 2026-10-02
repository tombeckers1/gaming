/* Richtungen der Batterieschuesse (Tom, 02.10., Goldader: "dass es nicht
   nur am Anfang nur rechts rauskommt und dann irgendwann links, sondern
   so verschiedene Richtungen"):
   - VERBUND: bei jeder Verbund-Batterie (mehrere Bloecke) kommen schon
     in der ersten Haelfte der Schuesse beide Seiten dran (je >= 25 %)
   - GOLDADER: in den ersten zwoelf Schuss wechselt die Seite mindestens
     sechsmal
   - VERKABELUNG: die Lichter-Batterien haben jede ihre eigene Folge
     (keine zwei mit derselben Seitenfolge)
   Aufruf: node richtung.js test.html
   Gegenprobe (02.10.): Neigung wieder ueber die ganze Breite statt je
   Block -> VERBUND und GOLDADER schlagen an. */
async function neuesSpiel(p){
  await p.waitForFunction("!!document.querySelector('#startBtns button:not([disabled])')",{timeout:30000});
  await p.click('#startBtns button:last-child');
  await p.waitForSelector('#nameBox.show',{state:'visible',timeout:15000});
  await p.click('#nameGo',{timeout:90000});
  await p.waitForFunction("!document.getElementById('start').classList.contains('show')",{timeout:15000});
}
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']});
  const p=await b.newPage({viewport:{width:600,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await p.goto('file://'+process.argv[2]); await p.waitForFunction('window.__bb!==undefined',{timeout:60000});
  await neuesSpiel(p);
  const r=await p.evaluate(()=>{ const bb=window.__bb, P=bb.P, o={verbund:[],seiten:{}};
    const seite=t=>bb.zuendPlan(t).S.map(e=>{ const u=bb.rohrMund(t,e.k).u[0]; return u>0.02?'R':u<-0.02?'L':'0'; }).join('');
    for(const t of Object.keys(P)){ if(!bb.istBatterie(t)) continue; const L=bb.rohrLayout(t); if(L.B<2) continue;
      const s=seite(t), h=s.slice(0,Math.floor(s.length/2)), nR=(h.match(/R/g)||[]).length, nL=(h.match(/L/g)||[]).length;
      o.verbund.push({t,B:L.B,n:s.length,R:nR,L:nL}); }
    const lb=bb.NEU_TEST.batterien.filter(t=>t.startsWith('lb_')).concat(['kreuzfeuer90']);
    lb.forEach(t=>{ o.seiten[t]=seite(t); });
    return o; });
  const m=[];
  r.verbund.forEach(x=>{ const h=x.R+x.L; if(h&&(x.R<0.25*h||x.L<0.25*h)) m.push(`VERBUND ${x.t}: erste Haelfte ${x.R}x rechts, ${x.L}x links`); });
  const g=r.seiten.lb_goldader||''; let w=0; for(let i=1;i<12;i++) if(g[i]!==g[i-1]) w++;
  console.log('Goldader erste 24:',g.slice(0,24),'Wechsel in 12:',w,'| Verbund-Batterien:',r.verbund.length);
  if(w<6) m.push('GOLDADER: nur '+w+' Seitenwechsel in den ersten 12 Schuss ('+g.slice(0,12)+')');
  const ids=Object.keys(r.seiten);
  for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){ const a=r.seiten[ids[i]].slice(0,40), c=r.seiten[ids[j]].slice(0,40); if(a===c) m.push('VERKABELUNG gleich: '+ids[i]+' / '+ids[j]); }
  ids.forEach(t=>console.log(t.padEnd(20),r.seiten[t].slice(0,40)));
  console.log('ERRORS:',m.concat(errs).join(' | ')||'keine'); await b.close();
})();

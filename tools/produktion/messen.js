/* Produktion messen (15.10.2026): Vorfuehrung (Kapitel 8, alles gebaut) in test.html, Straße 1 neu eingerichtet wie ein Spieler mit
   gutem Plan: bestes Raketen-Produkt laut Rechner, neuer Werker (Erfahrung 0), Standard-Rohstoffe, Grosshandel an, Stoerungen nach ~15 s
   freigegeben (wie ein Spieler, der im Leitstand sitzt), Straßen 2/3 aus. Je Spieltag: gefertigt, Ausschuss, Werksverkauf, Rohstoffe,
   Fixkosten + Loehne des Werks, netto. Aufruf: node -r ./ladezeit-preload.js tools/produktion/messen.js test.html [tage] [produkt]
   MESS_LAESSIG=1: Stoerungen behebt der Werker selbst. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const H=require('../test/start-hilfe.js');
const [,,HTML,TAGE='8',PROD='supernova']=process.argv;
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage({viewport:{width:1000,height:640}}); p.setDefaultTimeout(900000);
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await H.laden(p,HTML); await H.neuesSpiel(p,{stoppen:true});
  await p.evaluate(()=>{ const bb=__bb; bb.gpStart(); let n=0; while(!bb.gpFertig&&n++<5000) bb.gpBauSchritt(50); });
  const r=await p.evaluate(([TAGE,PROD,LAESSIG])=>{ const bb=__bb, S=bb.S, D=bb.pdDaten(), W=window.__wirt.WIRT, out=[];
    /* Straße 1 neu, 2/3 aus */
    D.s.forEach((s,i)=>{ s.an=i===0; s.plan=[]; s.erf=0; s.b2b=i===0; s.pre=false; });
    D.s[0].plan=[{t:PROD,n:99999,f:0}];
    const lohn=n=>{ const s=bb.STAFF.find(x=>x.id===n); return s&&S.staff[n]?s.wage:0; };
    const d0=S.day; let n=0, tag=S.day, roh0=D.summe.kosten||0, ein0=D.summe.einkauf||0;
    let h0={...D.s[0].heute};
    while(S.day<d0+TAGE&&n++<20000){ bb.run(3,0.1);
      const s=D.s[0]; if(!LAESSIG&&s.stoer&&s.stoer.art==='zelle'&&s.stoer.t>15) bb.pdBeheben(0,'hand');
      if(S.day!==tag){ const g=D.s[0].gestern||{};
        const fix=W.fix.werk+W.fix.werkStrasse+lohn('werker1')+lohn('mischer');
        const verbrauch=(D.summe.kosten||0)-roh0, liefer=((D.summe.einkauf||0)-ein0)-0; roh0=D.summe.kosten||0; ein0=D.summe.einkauf||0;
        out.push({tag,stk:g.stk,aus:g.aus,ausAnteil:Math.round(g.aus/Math.max(1,g.stk+g.aus)*1000)/10,b2b:g.b2b||0,rohVerbrauch:Math.round(verbrauch),rohEinkauf:Math.round(liefer),fix,
          netto:Math.round((g.b2b||0)-verbrauch-fix-W.produktion.lieferpauschale/2),erf:D.s[0].erf,lager:Object.fromEntries(Object.entries(D.lager).map(([k,v])=>[k,Math.round(v.std+v.pre)]))});
        tag=S.day; } }
    return out; },[+TAGE,PROD,!!process.env.MESS_LAESSIG]);
  for(const x of r) console.log(JSON.stringify(x));
  const nt=r.map(x=>x.netto); console.log('NETTO je Tag',nt.join(' '),'Schnitt',Math.round(nt.reduce((a,b)=>a+b,0)/Math.max(1,nt.length)));
  if(errs.length) console.log('ERR',errs.slice(0,3).join(' | '));
  await b.close();
})();

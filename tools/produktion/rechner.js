/* Produktions-Rechner (15.10.2026): Amortisation des Werks aus den Zahlen der Wirtschaftszentrale (WIRT.produktion, fix, personal)
   und dem echten Katalog (P), ohne Browser (tools/fundament/spiel-node.js). Rechnet je Klasse die besten Produkte (Deckungsbeitrag je Tag
   bei voller Auslastung an den Grosshandel) und drei Spielweisen fuer Straße 1 (fabrik), dazu fabrik2/fabrik3.
   Aufruf: node tools/produktion/rechner.js [--json]
   Annahmen (ehrlich, im Kopf der Ausgabe): Einkauf = Katalog-EK (Markt 1,0, keine Inflation), Erfahrung waechst je Produktionstag,
   Stoerungen kosten Zeit (gut: Spieler gibt sofort frei ~15 s, mittel/schlecht: Werker nach selbstSek), Ladennachfrage aus der
   Vorfuehrung gemessen (nachfrage je Tag und Klasse, Kapitel 8: Raketen 34, Kugeln 42, Batterien 35 Stueck). */
const {laden}=require('../fundament/spiel-node.js');
const s=laden(require('path').resolve(__dirname,'..','..'));
const NACHFRAGE=[34,42,35];
const r=s.ev(`(()=>{ const W=WIRT.produktion, out={klassen:[],W:WIRT.produktion,fix:WIRT.fix,lohn:WIRT.personal.lohn,preis:WIRT.ausbau.preis};
  for(let k=0;k<3;k++){ const L=ORDER.filter(t=>{ const p=P[t]; return p&&pdKlasse(t)===k&&!p.noOrder&&!p.rezept&&!p.eigen&&p.cost>0; }).map(t=>{ const R=pdRezept(t);
      return {t,ek:P[t].cost,var:R.kosten,varP:R.kostenPremium,takt:R.takt,kap:W.tagSek/R.takt,nem:R.nem,anteil:R.anteil,kg:R.kg,box:P[t].box,lvl:P[t].lvl}; });
    out.klassen.push(L); }
  return JSON.stringify(out); })()`);
const D=JSON.parse(r), W=D.W, Q=W.qualitaet, G=W.grosshandel;
const erf=(tag)=>Math.min(1,tag/Q.erfahrungTage);
const aus=(e,pre)=>Q.ausschussMax-(Q.ausschussMax-Q.ausschussMin)*(Q.gewErf*e+Q.gewRoh*pre);
const qual=(e,pre)=>Q.qMin+Q.qErf*e+Q.qRoh*pre;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lohn=n=>D.lohn[n];
/* Tagesergebnis einer Straße k mit Produkt p am Produktionstag tag */
function tagErgebnis(k,p,o){
  const e=erf(o.tag), pre=o.pre?1:0, a=aus(e,pre), q=qual(e,pre);
  const zeit=1-o.stoerVerlust, n=p.kap*zeit;                    /* Stueck gefertigt (inkl. Ausschuss) */
  const gut=n*(1-a)-1;                                          /* QS-Stichprobe */
  const roh=n*(o.pre?p.varP:p.var);
  const eigen=Math.min(gut,o.eigenBedarf);                      /* ersetzt Einkauf im Laden */
  const b2b=o.b2b?Math.max(0,gut-eigen):0;
  const erloes=eigen*p.ek+b2b*p.ek*G.faktor*clamp(q,G.qMin,G.qMax);
  const fix=lohn(['werker1','werker2','werker3'][k])+D.fix.werkStrasse+(o.werkAnteil||0);
  const liefer=W.lieferpauschale/(o.lieferAlle||1);
  return {e,a,q,n,gut,eigen,b2b,erloes,roh,fix,liefer,netto:erloes-roh-fix-liefer};
}
function amort(preis,k,p,o,maxTage=400){ let sum=0; for(let t=0;t<maxTage;t++){ const x=tagErgebnis(k,p,Object.assign({},o,{tag:t})); sum+=x.netto; if(sum>=preis) return {tage:t+1,tag1:tagErgebnis(k,p,Object.assign({},o,{tag:0})),tag30:tagErgebnis(k,p,Object.assign({},o,{tag:30}))}; }
  return {tage:Infinity,tag1:tagErgebnis(k,p,Object.assign({},o,{tag:0})),tag30:tagErgebnis(k,p,Object.assign({},o,{tag:30}))}; }
const werk=D.fix.werk+lohn('mischer'), selbst=W.stoerung.jeTag*W.stoerung.selbstSek/W.tagSek, schnell=W.stoerung.jeTag*15/W.tagSek;
const out=[];
const f=x=>Math.round(x), e2=x=>Math.round(x*100)/100;
out.push('Produktions-Rechner - '+new Date().toISOString().slice(0,10)+' - Zahlen aus WIRT.produktion/fix/personal (01c), Katalog P');
out.push(`Annahmen: Katalog-EK (Markt 1,0), Werk ${D.fix.werk} € + Mischer ${lohn('mischer')} € je Tag traegt Straße 1 allein; Stoerungen ${W.stoerung.jeTag}/Tag: sofort freigegeben (~15 s) = ${(schnell*100).toFixed(1)} % Zeit, vom Werker selbst (${W.stoerung.selbstSek} s) = ${(selbst*100).toFixed(1)} %; Ladennachfrage Kapitel 8 je Tag ${NACHFRAGE.join('/')} (Vorfuehrung gemessen).`);
for(let k=0;k<3;k++){ const L=D.klassen[k].map(p=>Object.assign(p,{db:tagErgebnis(k,p,{tag:30,b2b:true,eigenBedarf:0,stoerVerlust:schnell}).netto})).sort((a,b)=>b.db-a.db);
  const anteile=L.map(p=>p.anteil).sort((a,b)=>a-b);
  out.push(`\nKlasse ${['Raketen','Kugelbomben','Batterien'][k]}: ${L.length} Produkte, variable Kosten ${(anteile[0]*100).toFixed(0)}-${(anteile[anteile.length-1]*100).toFixed(0)} % vom EK (Median ${(anteile[Math.floor(anteile.length/2)]*100).toFixed(0)} %)`);
  out.push('  bestes/mittleres/schlechtestes Produkt (Großhandel, erfahren, Standard): Stück/Tag, EK, Rohstoffe/Stück, Netto je Tag nach Straßen-Fixkosten');
  for(const p of [L[0],L[1],L[2],L[Math.floor(L.length/2)],L[L.length-1]]) out.push(`  ${p.t.padEnd(22)} ${f(p.kap)} Stk/Tag  EK ${e2(p.ek)}  Roh ${e2(p.var)} (${(p.anteil*100).toFixed(0)} %)  NEM ${p.nem} g  netto ${f(p.db)} €/Tag`);
  D.klassen[k].best=L[0]; D.klassen[k].mitte=L[Math.floor(L.length/2)]; }
const R0=D.klassen[0];
const sz=[
  ['gut',       'bestes Produkt, Großhandel an, Störungen sofort frei, Lieferung alle 2 Tage',R0.best,{b2b:true,eigenBedarf:NACHFRAGE[0],stoerVerlust:schnell,werkAnteil:werk,lieferAlle:2}],
  ['premium',   'wie gut, mit Premium-Rohstoffen',R0.best,{b2b:true,pre:true,eigenBedarf:NACHFRAGE[0],stoerVerlust:schnell,werkAnteil:werk,lieferAlle:2}],
  ['nachlaessig','bestes Produkt, Großhandel, Störungen behebt der Werker selbst, tägliche Lieferung',R0.best,{b2b:true,eigenBedarf:NACHFRAGE[0],stoerVerlust:selbst,werkAnteil:werk,lieferAlle:1}],
  ['produkt',   'mittleres Produkt (Median), sonst wie gut',R0.mitte,{b2b:true,eigenBedarf:NACHFRAGE[0],stoerVerlust:schnell,werkAnteil:werk,lieferAlle:2}],
  ['nurLaden',  'plant nur den Ladenbedarf (34 Stück am Tag), kein Großhandel',Object.assign({},R0.best,{kap:NACHFRAGE[0]}),{b2b:false,eigenBedarf:NACHFRAGE[0],stoerVerlust:schnell,werkAnteil:werk,lieferAlle:3}],
  ['zuviel',    'volle Menge ohne Großhandel: Kapital im Hochregal, bis es voll ist',R0.best,{b2b:false,eigenBedarf:NACHFRAGE[0],stoerVerlust:schnell,werkAnteil:werk,lieferAlle:2}],
];
out.push(`\nAmortisation fabrik (${D.preis.fabrik} €, Straße 1 Raketen + Werk), Erfahrung waechst ab Tag 0:`);
const erg={};
for(const [id,txt,p,o] of sz){ const a=amort(D.preis.fabrik,0,p,o); erg[id]=a.tage;
  out.push(`  ${id.padEnd(9)} ${txt}: ${p.t}, Tag 1 netto ${f(a.tag1.netto)} €, ab Tag 30 netto ${f(a.tag30.netto)} €/Tag (Ausschuss ${(a.tag30.a*100).toFixed(1)} %, q ${a.tag30.q.toFixed(2)}) -> ${isFinite(a.tage)?a.tage+' Spieltage':'nie'}`); }
for(const [k,up] of [[1,'fabrik2'],[2,'fabrik3']]){ const p=D.klassen[k].best, a=amort(D.preis[up],k,p,{b2b:true,eigenBedarf:NACHFRAGE[k],stoerVerlust:schnell,werkAnteil:0,lieferAlle:2});
  out.push(`  ${up} (${D.preis[up]} €, ${p.t}, gut): ab Tag 30 netto ${f(a.tag30.netto)} €/Tag -> ${isFinite(a.tage)?a.tage+' Spieltage':'nie'}`); erg[up]=a.tage; }
/* Rohstoffbedarf bei gutem Spiel (Straße 1, bestes Produkt) gegen Lagerkapazitaet */
{ const p=R0.best, n=p.kap*(1-schnell), ort={}; for(const rr in p.kg){ const o2=W.roh[rr].lager; ort[o2]=(ort[o2]||0)+p.kg[rr]*n; }
  out.push('\nRohstoffbedarf Straße 1 (gut) je Tag gegen Lager: '+Object.entries(ort).map(([o2,v])=>`${o2} ${f(v)} kg / ${W.lager[o2]} kg = ${(W.lager[o2]/v).toFixed(1)} Tage`).join(', ')); }
if(process.argv.includes('--json')) console.log(JSON.stringify(erg)); else console.log(out.join('\n'));

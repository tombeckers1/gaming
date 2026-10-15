/* =========================================================
   Produktion im Werk West (Produktions-Gameplay, 15.10.2026) - Doku docs/halle/produktion.md
   Konzept docs/halle/produktion-konzept.md (Tom 14.10. freigegeben, OHNE Wartung): Eigenproduktion = Fixkosten gegen Marge.

   - Rohstoffe (Huelsen/Pappe, Oxidator, Metallpulver, Schwarzpulver) in Standard- und Premium-Qualitaet bestellen (Laptop, Lager-PC,
     Leitstand: Tab "Produktion"), Lieferung am naechsten Spieltag mit dem Gefahrgut-LKW an Tor R6, Lager mit Kapazitaetsgrenze
     (Inertlager, drei Chemie-Boxen).
   - Rezept je Produkt aus Klasse + Groesse (pdRezept): Satzgewicht NEM, Rohstoffe je Stueck, Takt - keine Handpflege; jedes Produkt
     des Sortiments (Lizenz) der Klasse der gekauften Straße ist herstellbar (Raketen / Kugelbomben / Batterien).
   - Produktionsplan je Straße (Produkt, Menge in Kartons, Reihenfolge), laeuft nur waehrend der Ladenoeffnung, mit Werker der Straße
     und Mischer. Kugelbomben trocknen: fertig am naechsten Spieltag. Fertige Paletten gehen ueber den Sammelfoerderer in die Gasse
     der Straße (S.hr wie Kaufware, Karton-Merkmal e:1 = Eigenproduktion) und von dort wie Kaufware in Laden und Versand.
   - Qualitaet: Werker-Erfahrung (Produktionstage) + Rohstoffqualitaet -> Ausschuss und Effektqualitaet q (wirkt wie Lieferantenware
     auf Kaufbereitschaft/Blindgaenger und ueber die taegliche QS-Stichprobe auf den Ruf). Keine Wartung.
   - Stoerungen: Straße steht (Ampel blinkt rot, Meldung, Leitstand), Spieler gibt die Zelle frei (an der Station oder im Leitstand),
     sonst der Werker nach WIRT.produktion.stoerung.selbstSek. Rohstoffe aus = Straße steht, Loehne laufen weiter.
   - QS-Stichprobe: das erste Stueck des Tages je Straße wird geprueft; eines je Tag wird auf dem Testfeld gezuendet (14z4 abStichprobe).
   - Statistik (Finanzbildung): Stueckkosten bei aktueller Menge, Break-even, Marge gegen Einkauf, gebundenes Kapital; Tagesabschluss.
   Alle Zahlen: WIRT.produktion (01c). Spielstand: S.pd. Welt/Schnittstellen: 05r (WK, WK_STR, WK_T, wkAusgabe, wkFixkosten).
   ========================================================= */
const PD_ROH=['huelsen','oxidator','metall','schwarzpulver'];
const PD_ROH_NAME={huelsen:'Hülsen und Pappe',oxidator:'Oxidator',metall:'Metallpulver',schwarzpulver:'Schwarzpulver'};
const PD_LAGER_NAME={inert:'Inertlager',oxi:'Chemie-Box Oxidatoren',metall:'Chemie-Box Metallpulver',sp:'Chemie-Box Schwarzpulver'};
const PD_KLASSE_NAME=['Raketen','Kugelbomben','Batterien'];
const PD_WERKER=['werker1','werker2','werker3'];
/* Darstellung (keine Wirtschaft): Takt der Animation zwischen 2,5 und 8 s, damit man die Stationen arbeiten sieht */
const PD_VIS={taktMin:2.5,taktMax:8};

/* Klasse eines Produkts = Straße: 0 Raketen, 1 Kugelbomben, 2 Batterien (Faecher sind Batterien), sonst -1 */
function pdKlasse(t){ const s=P[t]&&P[t].shape; return s==='rocketset'?0:s==='shell'?1:(s==='battery'||s==='fan')?2:-1; }
/* herstellbar auf Straße i: Klasse passt, im Sortiment (Lizenz), normale Katalogware (keine eigene Rezeptur, kein Prototyp) */
function pdHerstellbar(t,i){ const p=P[t]; return !!p&&pdKlasse(t)===i&&!p.noOrder&&!p.rezept&&!p.eigen&&!p.proto&&p.cost>0&&isUnlocked(t); }
function pdProdukte(i){ return ORDER.filter(t=>pdHerstellbar(t,i)); }

/* ---------- Rezept aus Klasse + Groesse (einmal je Sorte) ----------
   Liter = Packmass (dims). NEM = nemJeL g/L (mind. nemMin), davon schwarz Schwarzpulver, Rest Sternsatz (oxi Oxidator, Rest Metall);
   Huelsen/Pappe huelseJeL g/L. Effektaufwand: liegen die variablen Kosten mit Standard-Rohstoffen ausserhalb des Bands
   WIRT.produktion.band vom Katalog-Einkauf, wird das ganze Rezept darauf skaliert (teure kleine Ware = aufwendige Effekte, mehr Satz;
   billige grosse Ware = viel Luft im Karton, weniger Satz). kg = je Stueck. */
const _pdRez={};
function pdRezept(t){
  if(_pdRez[t]) return _pdRez[t];
  const p=P[t], k=pdKlasse(t); if(!p||k<0) return null;
  const W=WIRT.produktion, K=W.klasse[k], R=W.roh, d=p.dims||[0.2,0.2,0.2], L=Math.max(0.05,d[0]*d[1]*d[2]*1000);
  const nem=Math.max(K.nemMin,K.nemJeL*L)/1000, sp=nem*K.schwarz, stern=nem-sp, hu=K.huelseJeL*L/1000;
  const kg0={huelsen:hu,oxidator:stern*K.oxi,metall:stern*(1-K.oxi),schwarzpulver:sp}, k0=pdKostenKg(kg0,false);
  const f=clamp(k0,W.band[0]*p.cost,W.band[1]*p.cost)/Math.max(1e-9,k0), kg={}; for(const r of PD_ROH) kg[r]=kg0[r]*f;
  const st=kg.oxidator+kg.metall;
  const takt=clamp(K.takt*Math.sqrt(L/K.refL),K.taktMin,K.taktMax);
  const r={t,k,liter:L,nem:Math.round((kg.schwarzpulver+st)*1000),kg,takt,aufwand:f,kosten:pdKostenKg(kg,false),kostenPremium:pdKostenKg(kg,true)};
  r.anteil=r.kosten/p.cost;
  return (_pdRez[t]=r);
}
function pdPreisKg(r,pre){ return WIRT.produktion.roh[r].preis*(pre?WIRT.produktion.premium:1); }
function pdKostenKg(kg,pre){ let s=0; for(const r of PD_ROH) s+=kg[r]*pdPreisKg(r,pre); return s; }
function pdStueckJeTag(t){ const r=pdRezept(t); return r?WIRT.produktion.tagSek/r.takt:0; }
/* Stueck je Spielstunde (Anzeige; der Tag hat zeit.schliessen-zeit.oeffnen Spielminuten) */
function pdProStunde(t){ return Math.round(pdStueckJeTag(t)*60/(WIRT.zeit.schliessen-WIRT.zeit.oeffnen)); }

/* ---------- Spielstand ---------- */
function pdStrasseNeu(){ return {an:false,pre:false,b2b:false,plan:[],fort:0,stoer:null,karton:null,pal:[],erf:0,qsTag:-1,heute:{stk:0,aus:0,kosten:0,kartons:0,q:0},gestern:null}; }
function pdDaten(){
  if(!S) return null;
  if(!S.pd||!Array.isArray(S.pd.s)){ const L={}; for(const r of PD_ROH) L[r]={std:0,pre:0};
    S.pd={aktiv:false,tag:S.day,s:[0,1,2].map(pdStrasseNeu),lager:L,bestellt:[],trocken:[],aus:[[],[],[]],qsZuend:-1,summe:{stk:0,aus:0,kosten:0,paletten:0}}; }
  const D=S.pd; for(const r of PD_ROH) if(!D.lager[r]) D.lager[r]={std:0,pre:0};
  if(!Array.isArray(D.aus)) D.aus=[[],[],[]]; if(!Array.isArray(D.trocken)) D.trocken=[]; if(!Array.isArray(D.bestellt)) D.bestellt=[];
  return D;
}
/* Lager je Ort: belegt (kg, beide Qualitaeten) und unterwegs */
function pdLagerOrt(r){ return WIRT.produktion.roh[r].lager; }
function pdBelegt(ort){ const D=pdDaten(); let n=0; for(const r of PD_ROH) if(pdLagerOrt(r)===ort) n+=D.lager[r].std+D.lager[r].pre; return n; }
function pdUnterwegs(ort){ const D=pdDaten(); let n=0; for(const b of D.bestellt) if(pdLagerOrt(b.r)===ort) n+=b.kg; return n; }
function pdFrei(ort){ return WIRT.produktion.lager[ort]-pdBelegt(ort)-pdUnterwegs(ort); }

/* ---------- Werker, Status ---------- */
function pdPersonDa(id){ return !!(S&&S.staff&&S.staff[id])&&!(typeof inPause==='function'&&inPause(id)); }
function pdErfahrung(i){ const D=pdDaten(); return Math.min(1,(D.s[i].erf||0)/WIRT.produktion.qualitaet.erfahrungTage); }
function pdAusschuss(i,pre){ const Q=WIRT.produktion.qualitaet; return Q.ausschussMax-(Q.ausschussMax-Q.ausschussMin)*(Q.gewErf*pdErfahrung(i)+Q.gewRoh*(pre||0)); }
function pdQualitaet(i,pre){ const Q=WIRT.produktion.qualitaet; return Q.qMin+Q.qErf*pdErfahrung(i)+Q.qRoh*(pre||0); }
/* Straße eingeschaltet (fuer die Fixkosten werkStrasse): gebaut + vom Spieler angeschaltet */
function pdStrasseAn(i){ const D=S&&S.pd; return !!(D&&D.s&&D.s[i]&&D.s[i].an&&typeof wkStrasseOffen==='function'&&wkStrasseOffen(i)); }
/* Warum steht sie? '' = sie laeuft (oder wuerde laufen, sobald der Laden offen ist) */
function pdGrund(i){
  const D=pdDaten(), s=D.s[i];
  if(!wkStrasseOffen(i)) return 'nicht gebaut';
  if(!s.an) return 'ausgeschaltet';
  if(!pdPersonDa(PD_WERKER[i])) return 'kein Werker';
  if(!pdPersonDa('mischer')) return 'kein Mischer';
  if(!s.plan.length) return 'kein Auftrag';
  if(s.stoer) return s.stoer.art==='roh'?'Rohstoff fehlt: '+PD_ROH_NAME[s.stoer.r]:s.stoer.art==='voll'?'Hochregal voll':'Störung '+s.stoer.st;
  return '';
}
function pdLaeuft(i){ return !!S&&!!S.pd&&phase==='open'&&!pdGrund(i); }

/* ---------- Rohstoffe bestellen ---------- */
function pdBestellen(r,pre,n){
  const D=pdDaten(), R=WIRT.produktion.roh[r]; if(!R||!wkOffen()) return false; n=Math.max(1,n|0);
  const kg=R.gebinde*n, ort=R.lager;
  if(pdFrei(ort)<kg-1e-6){ toast(`${PD_LAGER_NAME[ort]} ist voll: noch ${Math.max(0,Math.floor(pdFrei(ort)))} kg frei (mit Bestellungen unterwegs).`,'bad'); return false; }
  const neuerTag=!D.bestellt.some(b=>b.tag===S.day);
  const preis=r2(kg*pdPreisKg(r,pre)+(neuerTag?WIRT.produktion.lieferpauschale:0));
  if(preis>verfuegbar()){ toast('Dafür reicht das Geld nicht (auch nicht mit Dispo).','bad'); return false; }
  S.money=r2(S.money-preis); DS.roh=r2((DS.roh||0)+preis); D.summe.einkauf=r2((D.summe.einkauf||0)+preis);
  D.bestellt.push({r,pre:!!pre,kg,tag:S.day});
  if(typeof sfx!=='undefined'&&sfx.cash) sfx.cash();
  toast(`${PD_ROH_NAME[r]} ${pre?'Premium':'Standard'}: ${kg} kg für ${eur(preis)}${neuerTag?` (inkl. Gefahrgut-Lieferung ${eur(WIRT.produktion.lieferpauschale)})`:''} – kommt morgen früh an Tor 6.`,'money');
  return true;
}

/* ---------- Gefahrgut-LKW an Tor R6 ---------- */
let pdLkw=null;
function pdLieferTick(dt){
  const D=pdDaten();
  if(!pdLkw&&phase==='open'&&D.bestellt.some(b=>S.day>=b.tag+WIRT.produktion.lieferTage)&&WK_T&&WK_T.r6){
    const z=WK.werk.z0-LW-0.05-13.2/2, g=abstellAuflieger(WK.r6.x,z-8,Math.PI/2,'Gefahrgut · Rohstoffe',TRUCKCOL.premium,true);
    pdLkw={g,z,state:'anfahrt',t:0}; toast('Der Gefahrgut-LKW mit den Rohstoffen setzt an Tor 6 (Werk West).'); }
  const L=pdLkw; if(!L) return;
  if(L.state==='anfahrt'){ const d=L.z-L.g.position.z; L.g.position.z+=clamp(d*0.9,0.6,3.0)*dt; if(d<=0.04){ L.g.position.z=L.z; L.state='auf'; L.t=0; } }
  else if(L.state==='auf'){ L.t+=dt/2.2; WK_T.r6.set(Math.min(1,L.t)); if(L.t>=1){ L.state='entladen'; L.t=0; } }
  else if(L.state==='entladen'){ L.t+=dt; if(L.t>=4){ pdEinbuchen(); L.state='zu'; L.t=1; } }
  else if(L.state==='zu'){ L.t-=dt/2.2; WK_T.r6.set(Math.max(0,L.t)); if(L.t<=0){ L.state='ab'; L.t=0; } }
  else if(L.state==='ab'){ L.g.position.z-=Math.min(7,3+L.t*6)*dt; L.t+=dt; if(L.g.position.z<WK.hof.z0+7){ scene.remove(L.g); pdLkw=null; } }
}
/* Ware vom LKW ins Lager (alles, was faellig ist) */
function pdEinbuchen(){
  const D=pdDaten(), faellig=D.bestellt.filter(b=>S.day>=b.tag+WIRT.produktion.lieferTage); if(!faellig.length) return;
  for(const b of faellig){ D.lager[b.r][b.pre?'pre':'std']+=b.kg; }
  D.bestellt=D.bestellt.filter(b=>faellig.indexOf(b)<0);
  for(const s of D.s) if(s.stoer&&s.stoer.art==='roh') s.stoer=null;
  toast(`Tor 6: ${faellig.length} Gebindeposten eingelagert (Inertlager und Chemie-Boxen).`,'money');
}

/* ---------- Ein Stueck herstellen ---------- */
/* Rohstoffe nehmen: zuerst die gewaehlte Qualitaet, dann die andere. Rueckgabe {kosten, pre (Anteil Premium)} oder {fehlt:r} */
function pdRohReicht(kg){ const D=pdDaten(); for(const r of PD_ROH){ const l=D.lager[r]; if(l.std+l.pre<kg[r]-1e-9) return r; } return ''; }
function pdRohNehmen(kg,pre){
  const D=pdDaten();
  for(const r of PD_ROH){ const l=D.lager[r]; if(l.std+l.pre<kg[r]-1e-9) return {fehlt:r}; }
  let kosten=0, prem=0, ges=0;
  for(const r of PD_ROH){ const l=D.lager[r], erst=pre?'pre':'std', dann=pre?'std':'pre'; let n=kg[r];
    const a=Math.min(n,l[erst]); l[erst]-=a; n-=a; const b=Math.min(n,l[dann]); l[dann]-=b;
    const kp=(erst==='pre'?a:b), ks=(erst==='pre'?b:a);
    kosten+=kp*pdPreisKg(r,true)+ks*pdPreisKg(r,false); prem+=kp; ges+=kp+ks;
    if(l.std<1e-9) l.std=0; if(l.pre<1e-9) l.pre=0; }
  return {kosten,pre:ges>0?prem/ges:0};
}
function pdStueck(i){
  const D=pdDaten(), s=D.s[i], a=s.plan[0], R=pdRezept(a.t); if(!R) { s.plan.shift(); return false; }
  const n=pdRohNehmen(R.kg,s.pre);
  if(n.fehlt){ s.stoer={art:'roh',r:n.fehlt,t:0}; toast(`Straße ${i+1} steht: ${PD_ROH_NAME[n.fehlt]} ist aus. Rohstoffe bestellen (Produktion) – der Werker kostet trotzdem.`,'bad'); return false; }
  s.heute.kosten+=n.kosten; D.summe.kosten=r2((D.summe.kosten||0)+n.kosten);
  const q=pdQualitaet(i,n.pre);
  /* QS-Stichprobe: das erste Stueck des Tages geht ins Labor (eines je Tag auf das Testfeld) */
  if(s.qsTag!==S.day){ s.qsTag=S.day; pdQs(i,a.t,q); return true; }
  if(Math.random()<pdAusschuss(i,n.pre)){ s.heute.aus++; D.summe.aus++; }
  else { s.heute.stk++; s.heute.q+=q; D.summe.stk++;
    /* angebrochener Karton einer anderen Sorte (Auftrag umgestellt): als Restkarton mit auf die Palette, nichts geht verloren */
    if(s.karton&&s.karton.t!==a.t&&s.karton.n>0) s.pal.push({t:s.karton.t,c:s.karton.n,q:Math.round(s.karton.q/s.karton.n*1000)/1000,e:1});
    if(!s.karton||s.karton.t!==a.t) s.karton={t:a.t,n:0,q:0};
    s.karton.n++; s.karton.q+=q;
    if(s.karton.n>=P[a.t].box){ s.pal.push({t:a.t,c:P[a.t].box,q:Math.round(s.karton.q/s.karton.n*1000)/1000,e:1}); s.karton=null; a.f++; s.heute.kartons++;
      if(s.pal.length>=HR_JE_PALETTE||a.f>=a.n) pdPalette(i);
      if(a.f>=a.n){ s.plan.shift(); if(!s.plan.length) toast(`Straße ${i+1} (${PD_KLASSE_NAME[i]}): Auftragsliste abgearbeitet.`); } } }
  /* Stoerung: im Schnitt stoerung.jeTag je Tag und laufender Straße */
  if(Math.random()<WIRT.produktion.stoerung.jeTag*R.takt/WIRT.produktion.tagSek){
    const Z=WK_STR[i].st.filter(q=>q[2]), st=Z[Math.floor(Math.random()*Z.length)]||WK_STR[i].st[0];
    s.stoer={art:'zelle',st:st[0],j:WK_STR[i].st.indexOf(st),t:0};
    toast(`Störung Straße ${i+1}: Zelle ${st[0]} (${st[1]}) steht. Hingehen und freigeben oder im Leitstand.`,'bad'); }
  return true;
}
/* fertige Palette: Kugelbomben in die Trockenkammer, sonst auf den Sammelfoerderer */
function pdPalette(i){ const D=pdDaten(), s=D.s[i]; if(!s.pal.length) return; const b=s.pal.splice(0);
  if(i===1) D.trocken.push({b,tag:S.day+WIRT.produktion.kugelTrocknungTage}); else D.aus[i].push(b); }
/* Palette in die Gasse der Straße (sonst irgendeine aktive Gasse) - false = Hochregal voll */
function pdEinlagern(b,i){
  const H=hrDaten(), k=WK_STR[i].gasse; let j=-1;
  if(llGasseAktiv(k)){ const P0=hrPlaetze(k); let bd=1e9;
    for(let n=0;n<P0.length;n++){ const q=k*180+n; if(H.p[q]||HR.reserv&&HR.reserv[q]) continue; const p=P0[n], d=Math.abs(p.x-LL.aufgabe.x)/HR_TEMPO.fahr+p.y/HR_TEMPO.hub; if(d<bd){ bd=d; j=q; } } }
  if(j<0) j=hrFreiPlatz(); if(j<0) return false;
  H.p[j]=b; hrSync(); return true; }
function pdAusgabeTick(dt){
  const D=pdDaten(); D._aT=(D._aT||0)+dt; if(D._aT<WIRT.produktion.ausgabeSek) return; D._aT=0;
  for(let i=0;i<3;i++){ const Q=D.aus[i]; if(!Q.length) continue;
    if(pdEinlagern(Q[0],i)){ Q.shift(); D.summe.paletten++; const s=D.s[i]; if(s.stoer&&s.stoer.art==='voll') s.stoer=null; }
    else if(Q.length>=WIRT.produktion.stauPaletten&&!D.s[i].stoer){ D.s[i].stoer={art:'voll',t:0}; toast(`Straße ${i+1} steht: Hochregal voll – zu viel produziert, ${Q.length} Paletten warten. Erst verkaufen, dann weiter.`,'bad'); } }
}
/* Stoerung beheben (Spieler an der Station / im Leitstand, oder der Werker selbst) */
function pdBeheben(i,wer){ const D=pdDaten(), s=D.s[i]; if(!s||!s.stoer||s.stoer.art!=='zelle') return false;
  const z=s.stoer.st; s.stoer=null; wkAmpeln();
  if(wer!=='selbst'){ toast(`Zelle ${z} freigegeben – Straße ${i+1} läuft wieder.`,'money'); if(typeof sfx!=='undefined'&&sfx.pop) sfx.pop(); }
  else toast(`Straße ${i+1}: Der Werker hat Zelle ${z} nach langer Suche selbst freibekommen.`);
  return true; }

/* ---------- QS-Stichprobe ---------- */
function pdQs(i,t,q){
  const D=pdDaten(), W=WIRT.ruf, d=clamp((q-1)*W.qsJe,-W.qsMax,W.qsMax);
  rep(d); D.qs=D.qs||[]; D.qs.unshift({tag:S.day,i,t,q:Math.round(q*100)/100,ruf:Math.round(d*100)/100}); D.qs.length=Math.min(D.qs.length,12);
  const txt=q>=1.08?'sehr gut – sauberer Effekt':q>=0.98?'in Ordnung':'mangelhaft – Kunden merken das';
  /* eines je Tag sichtbar auf dem Testfeld (Abschuss-Baustein 14z4, Effekt unveraendert, ohne Hype) */
  let feld=false;
  if(D.qsZuend!==S.day&&typeof abStichprobe==='function'){ const r=abStichprobe(t,q); if(r&&r.frei){ D.qsZuend=S.day; feld=true; } }
  toast(`QS-Stichprobe Straße ${i+1}: ${P[t].short} ${txt} (Qualität ${Math.round(q*100)} %, Ruf ${d>=0?'+':''}${String(Math.round(d*10)/10).replace('.',',')})${feld?' – wird auf dem Testfeld gezündet':''}.`,d>=0?'money':'bad');
}

/* ---------- Tageswechsel ---------- */
function pdNeuerTag(){
  const D=pdDaten();
  for(let i=0;i<3;i++){ const s=D.s[i];
    if(s.heute.stk+s.heute.aus>0&&pdPersonDa(PD_WERKER[i])) s.erf=(s.erf||0)+1;
    if(!(S.staff&&S.staff[PD_WERKER[i]])) s.erf=0;      /* neuer Werker faengt von vorn an */
    s.gestern=s.heute; s.heute={stk:0,aus:0,kosten:0,kartons:0,q:0};
    if(s.stoer&&s.stoer.art==='zelle') s.stoer=null;   /* ueber Nacht behoben */
    if(s.pal.length) pdPalette(i); }
  /* getrocknete Kugelbomben auf den Foerderer */
  const fertig=D.trocken.filter(x=>x.tag<=S.day); D.trocken=D.trocken.filter(x=>x.tag>S.day); for(const x of fertig) D.aus[1].push(x.b);
  D.tag=S.day;
  if(typeof gpAn!=='undefined'&&gpAn) pdAutoBestellen();
}
/* Vorfuehrung: der Disponent bestellt Rohstoffe nach, wenn weniger als zwei Tage reichen (normale Preise) */
function pdAutoBestellen(){ const RW=pdReichweite(), W=WIRT.produktion;
  for(const r of PD_ROH){ if(RW[r]>=2) continue; const R=W.roh[r], n=Math.floor(Math.max(0,pdFrei(R.lager)*0.6)/R.gebinde); if(n>0) pdBestellen(r,false,n); } }

/* ---------- Takt (aus wkTick, jedes Bild solange das Werk steht) ---------- */
let _pdMonT=0, _pdBlink=0; const _pdBlinkAn=[false,false,false];
function pdTick(dt){
  if(!S||!wkOffen()) return;
  const D=pdDaten(); if(D.tag!==S.day) pdNeuerTag();
  WK.produktion=!!D.aktiv;
  pdLieferTick(dt); pdAusgabeTick(dt);
  _pdBlink+=dt;
  for(let i=0;i<3;i++){ const s=D.s[i], z=WK.zustand[i];
    if(s.stoer){ s.stoer.t=(s.stoer.t||0)+dt;
      if(s.stoer.art==='zelle'&&phase==='open'&&s.stoer.t>WIRT.produktion.stoerung.selbstSek) pdBeheben(i,'selbst');
      if(s.stoer&&s.stoer.art==='roh'&&(!s.plan.length||!pdRohReicht(pdRezept(s.plan[0].t).kg))) s.stoer=null; }
    const lauf=pdLaeuft(i);
    if(z.laeuft!==lauf){ z.laeuft=lauf; wkAmpeln(); }
    if(!lauf) continue;
    const R=pdRezept(s.plan[0].t); z.takt=clamp(R.takt,PD_VIS.taktMin,PD_VIS.taktMax);
    s.fort+=dt; let n=0;
    while(s.fort>=R.takt&&n++<50){ s.fort-=R.takt; if(!pdStueck(i)||!pdLaeuft(i)) { s.fort=0; break; } }
  }
  /* Stoerung: Ampel der Straße blinkt rot */
  if(WK_T) WK_T.str.forEach((st,i)=>{ if(!st||!st.ampel) return; const s=D.s[i];
    if(s.stoer&&s.an){ const an=Math.floor(_pdBlink*2.5)%2===0; st.ampel.rot.emissiveIntensity=an?1.6:0.1; st.ampel.gruen.emissiveIntensity=0; _pdBlinkAn[i]=true; }
    else if(_pdBlinkAn[i]){ _pdBlinkAn[i]=false; wkAmpeln(); } });
  pdFiguren(dt);
  /* Leitstand-Bildschirme: einmal je Sekunde, nur mit Blick ins Werk */
  _pdMonT-=dt; if(_pdMonT<=0){ _pdMonT=1; if(WK_H&&WK_H.visible) wkMonitore(); }
}

/* ---------- Werker an ihrer Straße (Figur am Gang vor Station 5, Blick aufs Band; nur mit Blick ins Werk gezeichnet: WK_D) ---------- */
const PD_FIG=[null,null,null], PD_KOPF=['CM07','M09','BM04'];
function pdFiguren(dt){
  if(!WK_D||typeof makePerson!=='function') return;
  for(let i=0;i<3;i++){ const soll=wkStrasseOffen(i)&&pdPersonDa(PD_WERKER[i]);
    if(soll&&!PD_FIG[i]){ const g=makePerson({kopf:PD_KOPF[i]}), B=WK.band; g.position.set(B.x0+4.5*B.p,0,WK_STR[i].zc-1.85); g.rotation.y=0; WK_D.add(g); PD_FIG[i]=g; }
    else if(!soll&&PD_FIG[i]){ WK_D.remove(PD_FIG[i]); if(typeof personWeg==='function') personWeg(PD_FIG[i]); PD_FIG[i]=null; }
    if(PD_FIG[i]&&WK_D.visible&&typeof animPerson==='function') animPerson(PD_FIG[i],false,dt); } }

/* ---------- Statistik (Finanzbildung) ---------- */
/* Fixkosten je Tag, die Straße i zu tragen hat: Werker + Straßenbetrieb + Anteil Werk und Mischer (auf die eingeschalteten Straßen) */
function pdFixStrasse(i){
  const st=n=>{ const s=STAFF.find(x=>x.id===n); return s&&S.staff[n]?r2(s.wage*wageOf(n)*(inPause(n)?WIRT.personal.pause:1)):0; };
  let an=0; for(let k=0;k<3;k++) if(pdStrasseAn(k)) an++;
  const teil=(WIRT.fix.werk+st('mischer'))/Math.max(1,an);
  return r2(st(PD_WERKER[i])+WIRT.fix.werkStrasse+teil);
}
/* Kennzahlen fuer Produkt t auf Straße i bei der Tagesmenge n (Stueck je Tag; ohne n: volle Auslastung) */
function pdKennzahlen(t,i,n){
  const R=pdRezept(t); if(!R) return null; const s=pdDaten().s[i];
  const aus=pdAusschuss(i,s.pre?1:0), vk=(s.pre?R.kostenPremium:R.kosten)/(1-aus), ek=costOf(t), fix=pdFixStrasse(i);
  const kap=pdStueckJeTag(t), menge=Math.max(1,Math.min(kap,n||kap));
  const stueck=vk+fix/menge, spar=ek-vk, q=pdQualitaet(i,s.pre?1:0), G=WIRT.produktion.grosshandel, gh=ek*G.faktor*clamp(q,G.qMin,G.qMax);
  return {var:vk,stueck,ek,fix,kap,menge,aus,q,gh,marge:(ek-stueck)/ek,margeVar:spar/ek,breakEven:spar>0?Math.ceil(fix/spar):Infinity,
    breakEvenGh:gh>vk?Math.ceil(fix/(gh-vk)):Infinity,dbTagGh:kap*(gh-vk)-fix};
}
/* Eigenproduktion im Hochregal und auf dem Weg: Kartons, Stueck, gebundenes Kapital zu Herstellkosten und zum Einkaufswert */
function pdImLager(){
  const o={kartons:0,stueck:0,herstell:0,ek:0}; const add=b=>{ if(!b||!b.e) return; const R=pdRezept(b.t); o.kartons++; o.stueck+=b.c; o.herstell+=b.c*(R?R.kosten:0); o.ek+=b.c*costOf(b.t); };
  if(S&&S.hr){ for(const p of S.hr.p) if(p) p.forEach(add); for(const l of S.hr.tr||[]) (l.b||[]).forEach(add); }
  const D=pdDaten(); for(const Q of D.aus) for(const b of Q) b.forEach(add); for(const x of D.trocken) x.b.forEach(add);
  o.herstell=r2(o.herstell); o.ek=r2(o.ek); return o; }
/* Reichweite der Rohstoffe in Tagen beim aktuellen Plan (alle eingeschalteten Straßen) */
function pdReichweite(){
  const D=pdDaten(), bed={}; for(const r of PD_ROH) bed[r]=0;
  for(let i=0;i<3;i++){ const s=D.s[i]; if(!pdStrasseAn(i)||!s.plan.length) continue; const R=pdRezept(s.plan[0].t), n=pdStueckJeTag(s.plan[0].t); for(const r of PD_ROH) bed[r]+=R.kg[r]*n; }
  const o={}; for(const r of PD_ROH){ const v=D.lager[r].std+D.lager[r].pre; o[r]=bed[r]>0?v/bed[r]:Infinity; } return o; }

/* ---------- Werksverkauf an den Grosshandel (16-day endDay, vor dem Abschluss) ----------
   Je Straße mit b2b: alle Kartons der Eigenproduktion ihrer Klasse im Hochregal (und auf dem Foerderer), die ueber
   grosshandel.reserveKartons je Sorte liegen, gehen an die Spedition. Erloes = faktor x Einkauf x Qualitaet. Rueckgabe: Euro. */
function pdGrosshandel(){
  if(!S||!S.pd||!wkOffen()) return 0; const D=pdDaten(), G=WIRT.produktion.grosshandel, H=S.hr; let sum=0, kart=0;
  for(let i=0;i<3;i++){ if(!D.s[i].b2b) continue;
    const orte=[]; if(H) H.p.forEach((pl,j)=>{ if(pl) pl.forEach((b,k)=>{ if(b&&b.e&&pdKlasse(b.t)===i) orte.push({pl,b,j}); }); });
    for(const Q of [D.aus[i]]) for(const pl of Q) pl.forEach(b=>{ if(b&&b.e) orte.push({pl,b,j:-1}); });
    const je={}; for(const o of orte) (je[o.b.t]=je[o.b.t]||[]).push(o);
    for(const t in je){ const L=je[t]; /* zuerst die Kartons auf dem Foerderer, dann die oberen Plaetze */ L.sort((x,y)=>(x.j<0?-1:0)-(y.j<0?-1:0));
      for(const o of L.slice(0,Math.max(0,L.length-G.reserveKartons))){ const i2=o.pl.indexOf(o.b); if(i2<0) continue; o.pl.splice(i2,1);
        const e=r2(o.b.c*costOf(t)*G.faktor*clamp(o.b.q||1,G.qMin,G.qMax)); sum+=e; kart++; D.s[i].heute.b2b=r2((D.s[i].heute.b2b||0)+e); } } }
  if(H) for(let j=0;j<H.p.length;j++) if(H.p[j]&&!H.p[j].length) H.p[j]=null;
  for(let i=0;i<3;i++) D.aus[i]=D.aus[i].filter(pl=>pl.length);
  if(typeof hrSync==='function') hrSync();
  sum=r2(sum); DS.b2b=sum; DS.b2bKartons=kart; D.summe.b2b=r2((D.summe.b2b||0)+sum);
  return sum; }

/* ---------- Tagesabschluss (16-day endDay) ---------- */
function pdTagesabschluss(){
  if(!S||!S.pd||!wkOffen()) return [];
  const D=pdDaten(), rows=[{head:'Produktion (Werk West)'}];
  let n=0;
  for(let i=0;i<3;i++){ if(!wkStrasseOffen(i)) continue; const s=D.s[i], h=s.heute, ges=h.stk+h.aus;
    if(!s.an&&!ges) { rows.push([`Straße ${i+1} · ${PD_KLASSE_NAME[i]}`,'ausgeschaltet']); continue; } n++;
    const fix=pdFixStrasse(i), je=h.stk?(h.kosten+fix)/h.stk:0;
    rows.push([`Straße ${i+1} · ${PD_KLASSE_NAME[i]}`,ges?`${h.stk} Stück · Ausschuss ${Math.round(h.aus/ges*100)} % · Rohstoffe ${eur(h.kosten)} · ${eur(je)} je Stück mit Fixkosten${h.b2b?` · Großhandel ${eur(h.b2b)}`:''}`:`nichts gefertigt (${pdGrund(i)||'Laden war zu'}) · Fixkosten ${eur(fix)} laufen trotzdem`]); }
  const L=pdImLager(); if(L.kartons) rows.push(['Eigenproduktion im Lager',`${L.kartons} Kartons · gebundenes Kapital ${eur(L.herstell)} (Einkaufswert ${eur(L.ek)})`]);
  const Tr=D.trocken.reduce((a,x)=>a+x.b.length,0); if(Tr) rows.push(['In der Trockenkammer',`${Tr} Kartons Kugelbomben, morgen fertig`]);
  const B=D.bestellt.reduce((a,b)=>a+b.kg,0); if(B) rows.push(['Rohstoffe unterwegs',`${Math.round(B)} kg, kommen morgen an Tor 6`]);
  return n||L.kartons||B?rows:[];
}

/* ---------- Leitstand und Stationen: Treffer fuer die Aktionstaste (15-player). Unsichtbare Trefferkoerper ausserhalb der Szene
   (der Strahl prueft sie trotzdem, kein Zeichenaufruf) ---------- */
let _pdHitPult=null; const _pdHitStoer=[null,null,null];
function pdHits(){
  if(!WK_T||!WK_H||!WK_H.visible||!S||!S.pd) return [];
  const out=[];
  if(!_pdHitPult){ _pdHitPult=new THREE.Mesh(new THREE.BoxGeometry(5.6,1.2,1.3),hitM); _pdHitPult.position.set(-82.2,WK.raum+0.9,-10.0); _pdHitPult.userData={kind:'pdleitstand',ref:null}; _pdHitPult.updateMatrixWorld(true); }
  if(Math.abs(pl.z+10)<4&&pl.x<-76&&pl.x>-88) out.push(_pdHitPult);
  for(let i=0;i<3;i++){ const s=S.pd.s[i]; if(!s||!s.stoer||s.stoer.art!=='zelle'||!WK_T.str[i]) continue;
    if(!_pdHitStoer[i]){ _pdHitStoer[i]=new THREE.Mesh(new THREE.BoxGeometry(2.4,2.6,2.6),hitM); _pdHitStoer[i].userData={kind:'pdstoer',ref:i}; }
    const B=WK.band, x=B.x0+((s.stoer.j||0)+0.5)*B.p; _pdHitStoer[i].position.set(x,1.3,WK_STR[i].zc); _pdHitStoer[i].updateMatrixWorld(true);
    if(Math.abs(pl.x-x)<6&&Math.abs(pl.z-WK_STR[i].zc)<6) out.push(_pdHitStoer[i]); }
  return out; }
function pdPrompt(t){
  if(t.kind==='pdleitstand') return {t:'Leitstand: Produktion steuern, Störungen freigeben',a:true};
  const s=S.pd.s[t.ref]; return s&&s.stoer?{t:`Zelle ${s.stoer.st} freigeben (Straße ${t.ref+1})`,a:true}:{t:'Läuft',a:false}; }
function pdAktion(t){ if(t.kind==='pdleitstand') openLaptop('prod','leitstand'); else pdBeheben(t.ref,'hand'); }

/* ---------- Laptop / Lager-PC / Leitstand: Tab "Produktion" ---------- */
let pdWahl=-1;
function pdLaptop(){
  if(!S.up.fabrik) return {h:`<div class="row"><div class="rm"><b>Noch kein Werk</b><small>Eigene Produktion gibt es mit dem Pyro-Werk (Ausbau, Kapitel 8). Dann baust du Raketen, Kugelbomben und Batterien selbst – billiger als im Einkauf, aber mit Fixkosten für Werker, Strom und Werk.</small></div></div>`,hint:''};
  const D=pdDaten(), lei=lapGeraet==='leitstand', W=WIRT.produktion;
  const kn=(txt,a,ds,on,dis)=>`<button data-a="${a}" ${Object.entries(ds||{}).map(([k,v])=>`data-${k}="${v}"`).join(' ')} ${dis?'disabled':''} ${on?'':'class="ghost"'} style="padding:3px 9px;font-size:14px;margin:2px 3px 0 0;${on?'background:var(--mint);color:var(--ink)':''}">${txt}</button>`;
  const pz=v=>Math.round(v*100)+' %';
  let h='';
  { const L=pdImLager(); let fix=WIRT.fix.werk*(D.aktiv?1:0); for(let i=0;i<3;i++) if(pdStrasseAn(i)) fix+=WIRT.fix.werkStrasse;
    const lohn=['mischer',...PD_WERKER].reduce((a,n)=>{ const s=STAFF.find(x=>x.id===n); return a+(s&&S.staff[n]?r2(s.wage*wageOf(n)*(inPause(n)?WIRT.personal.pause:1)):0); },0);
    h+=`<div class="row"><div class="rm"><b>Werk West · ${lei?'Leitstand':'Produktion'}</b><small>Fixkosten Werk heute ${eur(fix)} · Löhne Werker und Mischer ${eur(lohn)} – laufen auch, wenn eine Straße steht.</small>`+
      `<small>Eigenproduktion im Lager: ${L.kartons} Kartons · gebundenes Kapital ${eur(L.herstell)} zu Herstellkosten (${eur(L.ek)} Einkaufswert)</small>`+
      `<small>${pdPersonDa('mischer')?'Mischer im Dienst.':'<span class="warn">Kein Mischer – ohne Satz steht das ganze Werk (Team).</span>'} Produziert wird, solange der Laden offen ist.${lei?'':' Störungen gibst du an der Station oder im Leitstand frei.'}</small></div></div>`; }
  for(let i=0;i<3;i++){
    if(!wkStrasseOffen(i)){ h+=`<div class="row locked"><div class="rm"><b>Straße ${i+1} · ${PD_KLASSE_NAME[i]}</b><small>Kommt mit dem Ausbau ${i?'8.'+(i+1):'8'}.</small></div></div>`; continue; }
    const s=D.s[i], g=pdGrund(i), a=s.plan[0], K=a?pdKennzahlen(a.t,i):null;
    const status=g?(s.stoer?`<span class="warn">steht: ${g}</span>`:`steht: ${g}`):(phase==='open'?'läuft':'bereit (läuft, sobald der Laden offen ist)');
    h+=`<div class="row mitEinr"><div class="rm"><b>Straße ${i+1} · ${PD_KLASSE_NAME[i]} – ${status}</b>`+
      `<small>Werker: ${pdPersonDa(PD_WERKER[i])?`${s.erf||0} Produktionstag${(s.erf||0)===1?'':'e'} Erfahrung · Ausschuss ${pz(pdAusschuss(i,s.pre?1:0))} · Effektqualität ${pz(pdQualitaet(i,s.pre?1:0))}`:'<span class="warn">keiner eingestellt (Team)</span>'}</small>`+
      `<small>${kn(s.an?'Eingeschaltet':'Ausgeschaltet','pdan',{i},s.an)}${kn('Standard-Rohstoffe','pdqual',{i,v:0},!s.pre)}${kn('Premium-Rohstoffe','pdqual',{i,v:1},s.pre)}`+
      `${kn(s.b2b?'Großhandel nimmt Überschuss':'Nur für den eigenen Laden','pdb2b',{i},s.b2b)}`+
      `${s.stoer&&s.stoer.art==='zelle'&&lei?kn('Zelle '+s.stoer.st+' freigeben','pdfrei',{i},false):''}</small>`;
    if(K) h+=`<small>Jetzt: ${P[a.t].short} · ${pdProStunde(a.t)} Stück je Stunde, bis ${Math.floor(K.kap)} am Tag · Rohstoffe ${eur(K.var)} je gutes Stück, mit Fixkosten ${eur(K.stueck)} bei voller Auslastung · Einkauf ${eur(K.ek)} (Marge ${pz(K.marge)}) · Großhandel zahlt ${eur(K.gh)}</small>`+
      `<small>Break-even: ${isFinite(K.breakEven)?K.breakEven+' Stück am Tag, die du sonst einkaufen würdest':'nie'} · mit Großhandel ${isFinite(K.breakEvenGh)?K.breakEvenGh+' Stück am Tag':'nie'} · voll ausgelastet an den Großhandel ${K.dbTagGh>=0?'+':''}${eur(K.dbTagGh)} am Tag nach Fixkosten</small>`;
    if(s.gestern&&(s.gestern.stk+s.gestern.aus)) h+=`<small>Gestern: ${s.gestern.stk} Stück, Ausschuss ${s.gestern.aus}, Rohstoffe ${eur(s.gestern.kosten)}${s.gestern.b2b?`, Großhandel ${eur(s.gestern.b2b)}`:''}</small>`;
    h+=`<div class="einr"><small><b>Auftragsliste</b> (Kartons, von oben nach unten)</small>`+
      (s.plan.length?s.plan.map((q,j)=>`<div class="einrZ"><span class="nr">${j+1}</span><span class="tx"><b>${P[q.t].short}</b><small>${q.f} von ${q.n} Kartons à ${P[q.t].box} Stück${i===1?' · trocknet bis morgen':''}</small></span>`+
        kn('▲','pdhoch',{i,j},false,j===0)+kn('−','pdmenge',{i,j,v:-1},false)+kn('+','pdmenge',{i,j,v:1},false)+kn('✕','pddel',{i,j},false)+`</div>`).join(''):'<small>Noch kein Auftrag.</small>')+
      `<div>${kn(pdWahl===i?'Auswahl schließen':'Produkt hinzufügen','pdwahl',{i},pdWahl===i)}</div>`;
    if(pdWahl===i){ const L=pdProdukte(i).map(t=>({t,K:pdKennzahlen(t,i)})).sort((x,y)=>(y.K.ek-y.K.var)*y.K.kap-(x.K.ek-x.K.var)*x.K.kap);
      h+=L.map(({t,K})=>`<div class="einrZ"><span class="tx"><b>${P[t].short}</b><small>Rohstoffe ${eur(K.var)} statt Einkauf ${eur(K.ek)} (${pz(K.margeVar)} gespart) · ${Math.floor(K.kap)} Stück/Tag · NEM ${pdRezept(t).nem} g · Bestand ${stockOf(t)} Stück</small></span>`+
        kn('+1 Karton','pdadd',{i,t,v:1},false)+kn('+1 Palette','pdadd',{i,t,v:HR_JE_PALETTE},false)+`</div>`).join('')||'<small>Kein Produkt dieser Klasse im Sortiment (Lizenz fehlt).</small>'; }
    h+=`</div></div></div>`;
  }
  /* Rohstoffe */
  const RW=pdReichweite();
  h+=`<div class="row"><div class="rm"><b>Rohstoffe</b><small>Bestellt heute, Lieferung morgen früh an Tor 6 (Gefahrgut-LKW ${eur(W.lieferpauschale)} je Liefertag). Premium kostet ${WF.prozMehr(W.premium)} % mehr: weniger Ausschuss, bessere Effekte.</small></div></div>`;
  for(const r of PD_ROH){ const R=W.roh[r], l=D.lager[r], ort=R.lager, rw=RW[r];
    h+=`<div class="row"><div class="rm"><b>${PD_ROH_NAME[r]}</b><small>${PD_LAGER_NAME[ort]}: ${Math.round(l.std)} kg Standard · ${Math.round(l.pre)} kg Premium · ${Math.round(pdUnterwegs(ort))} kg unterwegs · frei ${Math.max(0,Math.floor(pdFrei(ort)))} von ${W.lager[ort]} kg</small>`+
      `<small>${eur(pdPreisKg(r,false))} je kg (Premium ${eur(pdPreisKg(r,true))}) · Gebinde ${R.gebinde} kg${isFinite(rw)?` · reicht ${String(Math.round(rw*10)/10).replace('.',',')} Tage`:''}</small></div>`+
      `<div class="steps">${kn('Standard +'+R.gebinde+' kg','pdroh',{r,v:0,n:1})}${kn('+'+R.gebinde*5+' kg','pdroh',{r,v:0,n:5})}${kn('Premium +'+R.gebinde+' kg','pdroh',{r,v:1,n:1})}${kn('+'+R.gebinde*5+' kg','pdroh',{r,v:1,n:5})}</div></div>`; }
  if(D.qs&&D.qs.length) h+=`<div class="row"><div class="rm"><b>QS-Labor</b>${D.qs.slice(0,4).map(x=>`<small>${dateStr(x.tag)} · Straße ${x.i+1} · ${P[x.t]?P[x.t].short:x.t}: Qualität ${Math.round(x.q*100)} % · Ruf ${x.ruf>=0?'+':''}${String(x.ruf).replace('.',',')}</small>`).join('')}</div></div>`;
  return {h,hint:''};
}
function pdKlick(a,ds){
  const D=pdDaten(), i=+ds.i, s=D.s[i];
  if(a==='pdan'){ s.an=!s.an; if(s.an) D.aktiv=true; WK.produktion=!!D.aktiv; toast(`Straße ${i+1} ${s.an?'eingeschaltet – Fixkosten laufen ab jetzt':'ausgeschaltet'}.`); }
  else if(a==='pdqual'){ s.pre=ds.v==='1'; }
  else if(a==='pdb2b'){ s.b2b=!s.b2b; toast(s.b2b?`Straße ${i+1}: Die Spedition holt jeden Abend alles ab, was über ${WIRT.produktion.grosshandel.reserveKartons} Kartons je Sorte im Hochregal liegt (${WF.prozent(WIRT.produktion.grosshandel.faktor)} % vom Einkaufspreis, je nach Qualität).`:`Straße ${i+1}: nur noch für den eigenen Laden.`); }
  else if(a==='pdwahl'){ pdWahl=pdWahl===i?-1:i; }
  else if(a==='pdadd'){ const t=ds.t, n=+ds.v||1; if(!pdHerstellbar(t,i)) return; const L=s.plan[s.plan.length-1];
    if(L&&L.t===t) L.n+=n; else s.plan.push({t,n,f:0}); toast(`Straße ${i+1}: ${n} Karton${n===1?'':'s'} ${P[t].short} eingeplant.`); }
  else if(a==='pdmenge'){ const q=s.plan[+ds.j]; if(q){ q.n=Math.max(q.f+1,q.n+(+ds.v)); } }
  else if(a==='pdhoch'){ const j=+ds.j; if(j>0){ const x=s.plan.splice(j,1)[0]; s.plan.splice(j-1,0,x); if(j-1===0){ s.fort=0; } } }
  else if(a==='pddel'){ const j=+ds.j; s.plan.splice(j,1); if(j===0) s.fort=0; }
  else if(a==='pdfrei'){ pdBeheben(i,'hand'); }
  else if(a==='pdroh'){ pdBestellen(ds.r,ds.v==='1',+ds.n||1); }
}

/* ---------- Gameplay-Vorfuehrung (17e): das Werk laeuft mit ---------- */
function pdVorfuehrung(){
  if(!wkOffen()) return; const D=pdDaten(); D.aktiv=true; WK.produktion=true;
  for(const r of PD_ROH){ const ort=pdLagerOrt(r); D.lager[r].std=Math.floor(WIRT.produktion.lager[ort]*0.35); D.lager[r].pre=Math.floor(WIRT.produktion.lager[ort]*0.15); }
  for(let i=0;i<3;i++){ if(!wkStrasseOffen(i)) continue; const s=D.s[i], L=pdProdukte(i).sort((a,b)=>(P[b].weight||0)-(P[a].weight||0));
    s.an=true; s.b2b=true; s.erf=WIRT.produktion.qualitaet.erfahrungTage; s.plan=L.slice(0,3).map(t=>({t,n:HR_JE_PALETTE*2,f:0})); }
}

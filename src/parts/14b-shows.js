/* =========================================================
   Choreografie: Batterien und Verbunde laufen als Show ab

   Ueberarbeitet am 24.09. (Tom: "am Anfang klein, dann immer mehr,
   und manches ist zu durcheinander"):
   - Jedes Produkt hat eine Grundstufe (SHOW_BASIS): Steighoehe,
     Kaliber und Farbthema. Die Stufe waechst mit dem Level, zu dem
     es das Produkt gibt - die erste Batterie steigt tief und bricht
     klein, der Weltuntergang steigt am hoechsten.
   - Farben kommen aus dem Thema des Produkts (passend zur
     Verpackung). Jede Phase hat EIN Farbpaar, die Phasen wechseln
     durch das Thema. Kein Zufallsbunt mehr pro Schuss.
   - Effekte laufen in der Reihenfolge, in der sie im Drehbuch
     stehen, nicht zufaellig.
   - Die grossen Bruchbilder (Dahlie, Pistill, Kamuro, Kronleuchter,
     Titan ...) kommen erst in den spaeten Produkten vor.
   ========================================================= */
const FANDIR=Math.PI/2;                 // Fächer quer zum Blickfeld
/* Alle Verbunde brechen ein Fuenftel groesser als frueher */
const SHOW_GROESSE=1.2;
/* Bruchgroesse der Batterien (01.10., Tom: "der Durchmesser ist bei vielen
   Effekten zu gross - auf einmal ist der ganze Himmel voll, das kriegt man
   aus einer Batterie gar nicht raus, und die Kugelbombe sieht dagegen klein
   aus"). Gemessen: Batterien bis 3,5, Kugel 75 mm bricht mit 2,05. Bis 1,0
   bleibt alles, darueber waechst ein Bruch nur noch mit 27 Prozent - so
   bleibt die Reihenfolge (Steigerung) erhalten, das Groesste liegt bei
   etwa 1,7 und damit klar unter jeder Kugelbombe. */
const BRUCH_KNIE=1.0, BRUCH_REST=0.27;
function bruchKappe(x){ return x<=BRUCH_KNIE?x:BRUCH_KNIE+(x-BRUCH_KNIE)*BRUCH_REST; }
const SHOW_BASIS={
  roemisch   :{pw:-9,sz:0.45,th:'bunt'},
  sortiment  :{pw:-6,sz:0.72,th:'bunt'},
  batterie16 :{pw:-4,sz:0.78,th:'nacht'},   // 30.09.: -5; mit 12 m Mindesthoehe (BRUCH_MIN) stieg die Show sonst kaum an
  knatter    :{pw:-4,sz:0.84,th:'eis'},
  batterie49 :{pw:-3,sz:0.90,th:'glut'},
  faecher    :{pw:-1.5,sz:0.95,th:'tropen'},
  batterie100:{pw:-0.5,sz:1.00,th:'himmel'},
  zfaecher   :{pw: 0,sz:1.00,th:'blitz'},
  kometen    :{pw: 0.5,sz:1.08,th:'gold'},
  donnerwand :{pw: 2.0,sz:1.19,th:'rotweiss'},
  profi      :{pw: 2.5,sz:1.22,th:'koenig'},
  finale     :{pw: 3.5,sz:1.30,th:'nacht'}
};
/* Steigerung ueber die ganze Show (Tom, 25.09.: "am Anfang kleinere
   Schuesse, am Ende heller, groesser und hoeher - es wird immer
   intensiver, auch von der Effektbreite"). u laeuft von 0 (erster
   Schuss) bis 1 (letzter): Kaliber und damit Breite wachsen von 70 auf
   130 Prozent, die Steighoehe um sechs Meter, die Helligkeit von 80
   auf 130 Prozent. Im Mittel bleibt alles, wie es war. */
/* Engine v2 (26.09. nachts, Tom: "immer von links nach rechts und
   von rechts nach links ... jede Batterie eine Anomalie"). Neu:
   - eigene Steigerungskurve je Produkt (rampe), nicht mehr fuer alle gleich
   - Muster: mitte, aussen, v, w, z, x, wischer, welle, spirale, kreis,
     paar, schlag, treppe, zufall (fan/rfan bleiben, sparsam)
   - Ebenen gleichzeitig: mit:true (mit der vorigen Phase) oder at:s
   - Tempo: gapEnde (schneller/langsamer werdend), takt:[...] (Rhythmus)
   - Abschuss ueber die Breite der Batterie (rohre:'breit'), Hoehenmuster,
     Farbverteilung links/rechts oder Mitte/aussen, fester Aufstieg (steig)
   - Boden-Ebene waehrend der Phase (boden), Feuertopf mit eigenem Bruch
     (mineEff), Kugelbombe mit eigenem Bild (bombEff), Bruch ohne die
     Standard-Zutaten (bruchOpt)
   Ein Drehbuch bleibt ein Array von Phasen; rampe/basis haengen als
   Eigenschaften daran: show({rampe:{...}}, [phasen]). */
function show(kopf,phasen){ return Object.assign(phasen,kopf||{}); }
/* Bruchlicht der Batterien (28.09., Tom: echt - "sieht aus wie Lichttechnik"):
   ein 30-mm-Bruch in 20-40 m hellt Rauch und Haeuser nur kurz und schwach
   auf. Mit dem vollen Bruchlicht der Bibliothek (Punktlicht 6-9) standen
   Wand, Tisch und Haeuser bei fast jedem Schuss reinweiss, gruen oder gelb
   da - wie ein Scheinwerfer. Faktor fuer alle Schuesse aus show(); die
   eigenen Brueche (14g/14h) rechnen ihren Wert damit um. Salute blitzen
   weiter voll. Ohne Kern: die weissen Kern-Sprites (0,1-0,3 s) standen im
   Bild als runde Leuchtscheiben um jeden Bruch - bei 30-mm-Bruechen ist
   der Zerlegerblitz im Sternbild nicht zu sehen. */
const SHOW_BLITZ=0.4;
const showBlitz=bo=>Object.assign({flash:SHOW_BLITZ,kern:false},bo||{});
/* Moerserblitz der Kugelbomben aus einem Verbund (Finale Grande): der
   Abschussblitz der Bibliothek (Punktlicht 6-8) tauchte Tisch, Wand und
   Haeuser bei jedem Schuss in Weiss - im Verbund gedaempft wie die Brueche.
   BLITZ_K gilt nur waehrend des Aufrufs (14b, show). */
let BLITZ_K=1;
{ const flashRoh=flash; flash=function(p,c,power,dur){ return flashRoh(p,c,power*BLITZ_K,dur); }; }
/* Funkenfaden: hinter jedem Stern der Liste [{v,L}] loesen sich alle
   0,08 s Titan-/Kohlefunken, die kurz flackern, fallen und verloeschen -
   ein koerniger Schweif statt einer durchgehenden Linie (28.09., Tom: echt).
   dichte: Anteil der Sterne je Takt, lebt: Brenndauer der Funken [von,bis] s. */
function funkenFaden(p,st,G,c,dichte,lebt){ const LB=lebt||[0.3,0.7];
  const q=QUAL(), tm=Math.max(...st.map(x=>x.L))*0.9;
  for(let t=0.08;t<tm;t+=0.08){ const tt=t;
    imBild(tt,()=>{ for(const x of st){ if(tt>x.L*0.9||Math.random()>dichte*q) continue; const e=bahnOrt(p,x.v,G,tt), w=bahnTempo(x.v,G,tt);
      psMid.emit(e.x,e.y,e.z,w[0]*0.1+rand(-.35,.35),w[1]*0.1+rand(-.9,0),w[2]*0.1+rand(-.35,.35),c[0],c[1],c[2],rand(LB[0],LB[1]),3,4); } }); }
}

/* Drehbuch in der Katalogschreibweise ({basis, rampe, spuren:[...]})
   oder als Array mit basis/rampe als Eigenschaften - beides geht */
function showNorm(s){
  if(Array.isArray(s)) return s;
  if(s&&Array.isArray(s.spuren)){ const a=s.spuren.slice(); if(s.basis) a.basis=s.basis; if(s.rampe) a.rampe=s.rampe; return a; }
  return [];
}
/* Signatur je Produkt: der eine Effekt / die eine Idee, die nur es hat */
const SIGNATUR={};
const KAL={mini:0.45,klein:0.7,mittel:1,gross:1.3,riesig:1.6};
/* Kaliber: Name, Zahl oder Array (zyklisch je Schuss, in Gruppen je Position) */
function kalWert(k,i){ if(Array.isArray(k)) k=k[((i|0)%k.length+k.length)%k.length]; return typeof k==='number'?k:(k&&KAL[k])||1; }
/* Farbe: FW-Name oder [r,g,b] */
function farbe(x){ return typeof x==='string'?(FW[x]||null):Array.isArray(x)&&typeof x[0]==='number'?x:null; }
/* Wert je Schuss: Liste zyklisch, Einzelwert fuer alle */
function jeSchuss(x,i){ return Array.isArray(x)?x[((i|0)%x.length+x.length)%x.length]:x; }
function rampeKurve(u,k){
  switch(k){ case 'frueh': return Math.sqrt(u); case 'spaet': return u*u*u;
    case 'welle': return clamp(u+0.2*Math.sin(u*Math.PI*4),0,1); case 'flach': return 0.5; default: return u; } }
/* Steigerung ueber die ganze Show (Tom, 25.09.: "am Anfang kleinere
   Schuesse, am Ende heller, groesser und hoeher"). u laeuft von 0 (erster
   Schuss) bis 1 (letzter). Ohne eigene rampe: Kaliber 70 -> 130 %,
   Steighoehe -3 -> +3, Helligkeit 80 -> 130 %. */
function showRampe(u,R){
  const v=rampeKurve(u,R&&R.kurve), L=(a,d0,d1)=>a?a[0]+(a[1]-a[0])*v:d0+(d1-d0)*v;
  return {sz:L(R&&R.sz,0.7,1.3), pw:L(R&&R.pw,-3,3), hell:L(R&&R.hell,0.8,1.3)};
}
/* Abstand vor Schuss i+1 */
function phGap(ph,i,n){
  if(ph.takt&&ph.takt.length) return ph.takt[i%ph.takt.length];
  const g=ph.gap===undefined?0.45:ph.gap;
  if(ph.gapEnde!==undefined&&n>1) return g+(ph.gapEnde-g)*i/(n-1);
  return g;
}
/* Zahl der Takte: bei Paar-Mustern gehen zwei Schuss auf einen Takt */
const PAAR_MUSTER={v:1,x:1,paar:1};
function phTakte(ph){ const n=ph.n===undefined?1:ph.n; return ph.muster&&PAAR_MUSTER[ph.muster]?Math.ceil(n/2):(ph.muster==='schlag'?1:n); }
/* Schussplan einer Phase (Engine v2, Stufe 1, 26.09.): wann welcher
   Schuss kommt. Jeder Eintrag {t, i, g, q, gn}: Zeit ab Phasenbeginn,
   Nummer, Gruppe, Platz in der Gruppe, Groesse der Gruppe.
   - je:k        Gruppen zu k Schuss. takt = Abstand der Gruppen (Beginn
                 zu Beginn), gap = Abstand in der Gruppe (Standard 0);
                 ohne takt: bogenGap (Standard 0,5)
   - hoehe:'melodie' + noten{ton,dauer} + viertel: ein Schuss je Note,
                 Zeitpunkt aus den Notenlaengen
   - sonst wie bisher: Takte mit gap/gapEnde/takt, Paar-Muster zwei je
                 Takt, schlag alle auf einmal
   dauer: bis nach dem letzten Abstand (wie bisher, ohne pause) */
function phPlan(ph){
  const n=ph.n===undefined?1:ph.n, out=[];
  if(n<=0) return {n:0,je:0,G:0,schuesse:out,dauer:0};
  const no=ph.noten;
  if(ph.hoehe==='melodie'&&no&&no.dauer&&no.dauer.length){
    const vt=ph.viertel||0.5; let t=0;
    for(let i=0;i<n;i++){ out.push({t,i,g:i,q:0,gn:1}); t+=no.dauer[i%no.dauer.length]*vt; }
    return {n,je:0,G:n,schuesse:out,dauer:t,melodie:true};
  }
  const je=ph.je|0;
  if(je>0){
    const gIn=ph.gap===undefined?0:ph.gap, G=Math.ceil(n/je); let ts=0, ende=0;
    for(let g=0;g<G;g++){ const gn=Math.min(je,n-g*je);
      for(let q=0;q<gn;q++){ const tt=ts+q*gIn; out.push({t:tt,i:g*je+q,g,q,gn}); ende=Math.max(ende,tt); }
      ts+=ph.takt&&ph.takt.length?ph.takt[g%ph.takt.length]:(ph.bogenGap!==undefined?ph.bogenGap:0.5); }
    return {n,je,G,schuesse:out,dauer:Math.max(ts,ende)};
  }
  const m=ph.muster, takte=phTakte(ph), paarig=m&&PAAR_MUSTER[m];
  let tt=0;
  for(let j=0;j<takte;j++){ const sch=m==='schlag'?n:paarig?Math.min(2,n-j*2):1;
    for(let q=0;q<sch;q++) out.push({t:tt,i:m==='schlag'?q:paarig?j*2+q:j,g:j,q,gn:sch});
    tt+=phGap(ph,j,takte); }
  return {n,je:0,G:takte,schuesse:out,dauer:tt};
}
function phDauer(ph){ return phPlan(ph).dauer; }
/* Startzeit jeder Phase. Ohne Angabe: nach dem Ende der vorigen Gruppe
   (inkl. Pause). mit:true gehoert zur Gruppe der vorigen Phase und
   startet mit ihr; die Gruppe endet mit ihrem laengsten Mitglied.
   mit:Zahl startet Zahl s nach Beginn der vorigen Phase (Kanon).
   at:s startet absolut und haelt niemanden auf. at:'ende' startet mit
   dem letzten Schuss der vorigen Phase, danach geht es von dort weiter. */
function showZeiten(phases){
  phases=showNorm(phases);
  const out=[]; let gStart=0, gEnde=0, weiter=0;
  phases.forEach((ph,pi)=>{
    const d=phDauer(ph)+(ph.pause||0); let t0;
    if(typeof ph.at==='number'){ out.push(ph.at); return; }
    if(ph.at==='ende'&&pi>0){ const vp=phPlan(phases[pi-1]).schuesse; t0=out[pi-1]+(vp.length?vp[vp.length-1].t:0);
      gStart=t0; gEnde=t0+d; weiter=gEnde; out.push(t0); return; }
    if(typeof ph.mit==='number'&&pi>0){ t0=out[pi-1]+ph.mit; gEnde=Math.max(gEnde,t0+d); }
    else if(ph.mit&&out.length){ t0=gStart; gEnde=Math.max(gEnde,t0+d); }
    else { t0=Math.max(weiter,gEnde); gStart=t0; gEnde=t0+d; }
    weiter=gEnde; out.push(t0);
  });
  return out;
}
function showDauer(phases){ phases=showNorm(phases); const z=showZeiten(phases); let e=0; phases.forEach((ph,i)=>{ e=Math.max(e,z[i]+phDauer(ph)+(ph.pause||0)); }); return e; }
/* Winkel eines Schusses im Muster. k: 0..1 ueber die Phase, i: Nummer,
   A: Grundwinkel. Liefert [ang, dir-Versatz, seite(-1..1 fuer Rohrlage)] */
function musterWinkel(m,i,n,k,A,ph){
  const T=x=>{ const f=x-Math.floor(x); return f<0.5?f*2:2-f*2; };   // Dreieck 0..1..0
  switch(m){
    case 'fan': return [(-1+2*k)*A,0];
    case 'rfan': return [(1-2*k)*A,0];
    case 'mitte': { const st=A/Math.max(1,Math.ceil((n-1)/2)), j=Math.ceil(i/2); return [(i%2?1:-1)*j*st,0]; }
    case 'aussen': { const ii=n-1-i, st=A/Math.max(1,Math.ceil((n-1)/2)), j=Math.ceil(ii/2); return [(ii%2?1:-1)*j*st,0]; }
    case 'w': return [[-A,A/3,-A/3,A][i%4],0];
    case 'z': return [A*(2*T(k*(ph.seg||2)/2)-1),0];
    case 'wischer': return [A*(2*T(k*(ph.seg||3))-1),0];
    case 'welle': return [A*Math.sin(2*Math.PI*k*(ph.wellen||1.5)),0];
    case 'spirale': return [A,2*Math.PI*k*(ph.seg||2)];
    case 'kreis': return [A,2*Math.PI*i/Math.max(1,n)];
    case 'schlag': return [(-1+2*k)*A,0];
    case 'zufall': return [rand(-A,A),ph.azi==='zufall'?rand(0,Math.PI*2):0];
    default: return [0,0];
  }
}
/* Spektralfarben: Rot aussen bis Violett innen (farbVert:'spektrum') */
const SPEKTRUM_FW=['rot','orange','zitrone','gruen','tuerkis','blau','violett'];
/* Umrisse fuer muster:'bild' - Paare spiegelgleich von der Spitze an,
   Einheit: Breite 1, Mitte 0 */
const BILD_FORM={
  herz(i,n){ const P=Math.max(1,Math.ceil(n/2)), p=Math.floor(i/2), s=i%2?-1:1, t=Math.PI-Math.PI*(p+0.5)/P;
    const x=16*Math.pow(Math.sin(t),3), y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
    return [s*x/32,(y+2.5)/32]; }
};
/* Tonhoehe je Schuss fuer steig pfeif/tonleiter/dreiklang (Halbtoene
   relativ 1,6 kHz). 'fallend' bleibt Text (Glissando abwaerts). */
function tonFuer(ton,i,q){
  if(ton===undefined||ton===null) return undefined;
  if(typeof ton==='number') return ton;
  if(Array.isArray(ton)) return ton[i%ton.length];
  switch(ton){ case 'akkord': return [0,4,7][q%3]; case 'stimmen': return Math.floor(rand(0,12))+rand(-0.4,0.4);
    case 'hoch': return 7; case 'tief': return -7; default: return ton; }
}
const PFEIF_ERSATZ={pfeif:'silber',heuler:'silber',dreiklang:'gold',tonleiter:'silber'};
/* Phasenfelder in der einen Schreibweise (engine-zusatz.md) */
function phNorm(ph){
  const p=Object.assign({},ph);
  if(p.m!==undefined&&p.seg===undefined) p.seg=p.m;
  if(p.orte&&p.x===undefined) p.x=p.orte;
  if(typeof p.perle==='string'){ p.perleEff=p.perleEff||(p.perle.endsWith('perle')||p.perle==='zwilling'?p.perle:p.perle+'perle'); p.perle=true; }
  if(p.nurBoden&&(p.n===undefined?1:p.n)>0){ p.nurMine=true; }
  if(p.stufen&&p.bomb&&!p.bombStufen) p.bombStufen=p.stufen;
  /* 03.10. abends (Tom: "Ich will keine Pfeif-Sachen"): keine Heuler und
     Pfeifkerzen mehr in Batterien */
  if(PFEIF_ERSATZ[p.steig]){ p.steig=PFEIF_ERSATZ[p.steig]; delete p.ton; }
  p.pfeif=false; if(p.perleEff==='pfeifperle') p.perleEff='knisterperle';
  return p;
}
/* Show-Kennung: jeder Stern, jede Rakete und jeder Boden-Emitter einer
   Show traegt sie (weltenblitz loescht damit "alles dieser Show") */
let SHOW_TAG_N=0;
function neuerShowTag(){ SHOW_TAG_N=SHOW_TAG_N%65000+1; return SHOW_TAG_N; }
function showLoeschen(tag){
  if(!tag) return 0; let n=0;
  for(const ps of [psHuge,psBig,psMid,psSmall]) for(let i=0;i<ps.max;i++) if(ps.life[i]>0&&ps.tag[i]===tag){ ps.life[i]=1e-4; n++; }
  for(let i=rockets.length-1;i>=0;i--) if(rockets[i].tag===tag){ rockets.splice(i,1); n++; }
  for(const e of emitters) if(e.tag===tag){ e.t=0; n++; }
  return n;
}
/* Ort neben dem Abschusspunkt, quer zum Blick (off in Metern) */
function versetzt(o,off,dz){
  const q=V(o.x+Math.sin(FANDIR)*off,o.y,o.z+Math.cos(FANDIR)*off+(dz||0));
  q.jit=o.jit!==undefined?Math.min(o.jit,0.06):0.06; q.ab=o.ab; return q;
}
/* Halbe Oeffnung des Produkts quer zum Blick, abzueglich Streuung:
   so weit darf ein Abschuss hoechstens vom Mittelpunkt weg (28.09.,
   Tom: "die Effekte am Produkt rauslassen - teilweise gehen die
   komplett woanders"). Die Station sagt es (muendung: hx), sonst die
   Kartonbreite. */
function oeffnungHalb(o,prod){
  const d=P[prod]&&P[prod].dims, hx=o&&o.hx!==undefined?o.hx:(d?d[0]/2:0.3);
  return Math.max(0,hx-(o&&o.jit!==undefined?Math.min(o.jit,0.06):0.06)-0.01);
}
/* Versatz-Massstab: die Orte im Drehbuch (x, boden.x, rohrFolge,
   rohre:'breit', treffen) werden als Muster gelesen und auf die
   Oeffnung gestaucht, wenn sie breiter sind als das Produkt. Das
   Muster (links/rechts, aussen/innen, Reihenfolge) bleibt. */
function versatzMass(){ const m={max:0,halb:0,k(){ return m.max>m.halb&&m.max>0?m.halb/m.max:1; },
  nimm(off){ m.max=Math.max(m.max,Math.abs(off||0)); return off||0; }}; return m; }
/* Batterien (01.10. abends, Tom: "realistisch"): playShow plant erst alle
   Ereignisse (mit fester Saat - das Produkt feuert jedes Mal gleich),
   dann legt zuendFolge (04c) fest, aus welchem Rohr jeder Schuss kommt
   (feste Folge der Zuendschnur) und wann (0,2-0,4 s Abstand). mod.plan:
   nur planen, nichts zuenden (Modell auf dem Tisch, Tests). */
function playShow(o,phases,prod,tag,mod){
  const PLAN=!!(mod&&mod.plan);
  if(typeof istBatterie==='function'&&istBatterie(prod)) return rohrSaat(saatZahl(prod),()=>playShowRoh(o,phases,prod,tag,PLAN));
  return playShowRoh(o,phases,prod,tag,false);
}
function playShowRoh(o,phases,prod,tag,PLAN){
  phases=showNorm(phases);
  tag=tag||neuerShowTag();
  const BS=phases.basis||SHOW_BASIS[prod]||{pw:0,sz:1,th:null};
  const R=phases.rampe||null, zeiten=showZeiten(phases), plaene=phases.map(phPlan);
  /* Zeit des ersten und letzten Schusses fuer die Rampe */
  let t0=null, t1=0;
  phases.forEach((ph,pi)=>{ const S=plaene[pi].schuesse; if(!S.length) return; const s=zeiten[pi];
    t0=t0===null?s+S[0].t:Math.min(t0,s+S[0].t); t1=Math.max(t1,s+S[S.length-1].t); });
  const rampe=tt=>showRampe(t1>t0?clamp((tt-t0)/(t1-t0),0,1):0.5,R);
  /* Breite der Batterie fuer den Abschuss ueber mehrere Rohre: die
     Oeffnung des Produkts (vorher Kartonbreite x 1,1 und mindestens
     30 cm - die aeusseren Rohre lagen neben dem Karton) */
  const VM=versatzMass(); VM.halb=oeffnungHalb(o,prod);
  const breite=2*VM.halb;
  /* Ort zum Versatz: erst beim Zuenden gerechnet, wenn alle Versaetze
     der Show bekannt sind (VM.k) */
  const ortAus=off=>off?versetzt(o,off*VM.k()):versetzt(o,0);
  /* Batterien: jeder Schuss und jeder Boden-Effekt aus seinem eigenen
     Rohr (04c, Tom 01.10.: so viele Loecher wie Schuss) */
  const RS=rohrSatz(o,prod);
  /* Batterie: Ereignisse sammeln statt sofort einplanen */
  const EV=[], plane=(tt,fn,info)=>{ if(RS||PLAN) EV.push(Object.assign({tt,fn},info||{})); else later(tt,fn); };
  phases.forEach((ph0,pi)=>{
    const ph=phNorm(ph0), t=zeiten[pi], pl=plaene[pi], n=pl.n, th=ph.th||BS.th, je=pl.je;
    const m=ph.muster||(ph.fan?'fan':ph.vfan?'vfan':null);
    const zufall=Math.floor(Math.random()*SCHEMES.length);
    /* Farbpaar: aus dem Thema, je Phase eins; wechsel = Paare im Takt */
    const paar=i=>th?themaPaar(th,(ph.farbe!==undefined?ph.farbe:pi)+(ph.wechsel||ph.farbVert==='wechsel'?i:0)):scheme(ph.sc===undefined?zufall:ph.sc);
    /* Boden-Ebene: alle Felder gehen an den Emitter (i, klein, bis ...) */
    /* Boden-Ebene am Produkt: ort ist der Versatz der Gruppe (je), b.x
       und b.bis kommen dazu - alles gestaucht auf die Oeffnung */
    const bodenAn=(b,st,ort)=>{ const [gA,gB]=paar(0), A=farbe(b.A)||(b.gA?K(b.gA):gA), B=farbe(b.B)||(b.gB?K(b.gB):gB);
      /* bis: Ziel des Lauffeuers (sonst 0,4 m weiter) - auch gestaucht */
      const offB=VM.nimm((ort||0)+(+b.x||0)), offZ=b.bis!==undefined?VM.nimm((ort||0)+(+b.bis||0)):b.k==='lauffeuer'?VM.nimm(offB+0.4):null;
      /* 03.10. (Tom): statt der kleinen Funkenfontaenen eine grosse breite
         Fontaene in den Farben der Batterie (14m breitBoden) */
      if(typeof BREIT_BODEN!=='undefined'&&BREIT_BODEN[b.k]&&!b.alt){ const T=[gA,gB], lvl=P[prod]&&P[prod].lvl||10, saat=typeof saatZahl==='function'?saatZahl(prod||'x'):0;
        plane(st,()=>{ const alt=FW_TAG; FW_TAG=tag; try{ breitBoden(RS?RS.modul(offB*VM.k()):ortAus(offB),A,B,{k:b.k,D:b.gt,lvl,saat,T,muster:b.muster}); } finally { FW_TAG=alt; } },{art:'b'}); return; }
      if(b.k==='monsterfont'){ plane(st,()=>monsterFontaene(RS?RS.modul(offB*VM.k()):ortAus(offB),b.gh||20,b.gt||8,b.farben||[A,B,FW.gold]),{art:'b'}); return; }
      /* spielraum: Platz vom Emitter bis zum Rand des Produkts - breite
         oder wandernde Boden-Emitter (Wasserfall, Kreisel, Kessel)
         bleiben darin */
      const e=Object.assign({},b,{t:b.gt||4,k:b.k,A,B,h:b.gh||1,tag,versatz:b.t||0});
      delete e.je; delete e.x; delete e.bis;
      plane(st,()=>{ e.o=RS?RS.modul(offB*VM.k()):ortAus(offB); e.spielraum=Math.max(0.02,VM.halb-Math.abs(offB*VM.k())); if(offZ!==null){ e.ziel=ortAus(offZ); e.bis=(offZ-offB)*VM.k(); } emitters.push(e); sfx.fizz(distVol(e.o)); },{art:'b'}); };
    if(ph.ground) bodenAn({k:ph.ground,gt:ph.gt,gh:ph.gh,gA:ph.gA,gB:ph.gB,farben:ph.farben},t);
    const boeden=ph.boden?(Array.isArray(ph.boden)?ph.boden:[ph.boden]):[];
    boeden.forEach(b=>{ if(!b.je) bodenAn(b,t+(b.t||0)); });
    const A0=ph.ang===undefined?(ph.fan||ph.vfan?0.3:m&&m!=='gerade'&&m!=='treppe'?0.45:0):Math.abs(ph.ang);
    /* altes fan mit negativem ang = rechts nach links */
    const mm=m==='fan'&&ph.ang<0?'rfan':m;
    const paarig=mm&&PAAR_MUSTER[mm], G=pl.G;
    const kette={};   // Girlande der Schwebeperlen
    const perleEff=ph.perle?(ph.perleEff||null):null;
    const fuseS=ph.fuse||1.2;
    /* Bildmuster: eine gemeinsame Steigzeit je Phase - alle Punkte eines
       Bogens (Bildes) brechen im selben Takt, in dem sie gezuendet werden */
    /* Bildgroesse: engine-zusatz nennt Bogen r*30 m und Herz 30 m breit auf
       45 m - vom Zuendpult aus (10-12 m vor der Station) lag das Herz ganz
       ueber dem Bildrand und der Bogen als Band ueber dem Kopf. Vorgabe
       darum kleiner und tiefer; rSkala:1 bzw. breite:30, mitteH:45 geben
       die Katalogmasse. */
    const rSk=ph.rSkala||0.65, bildW=ph.breite||24, bildY=ph.mitteH||steigHoehe(BS.pw+(ph.pw||0),fuseS)+6;
    const bildT=ph.fuse||(mm==='bogen'?zielZeit((ph.bogenY!==undefined?ph.bogenY:4)+30*Math.max(...(ph.r||[1,0.7]))*rSk)
      :mm==='bild'?zielZeit(bildY+0.46*bildW):mm==='halbkreis'?zielZeit(steigHoehe(BS.pw+(ph.pw||0),fuseS)):0);
    pl.schuesse.forEach(s=>{
      const i=s.i, q=s.q, gn=s.gn, tt=t+s.t, Rz=rampe(tt);
      const k=n>1?i/(n-1):0.5, kg=G>1?s.g/(G-1):0.5, kq=gn>1?q/(gn-1):0.5;
      const idx=je?q:i;       // Position fuer Listen (eff, kal) - in Gruppen je Platz
      let ang=0, dOff=0, seite=0, ziel=null;
      if(je&&paarig){ const np=Math.ceil(gn/2), kp=np>1?Math.floor(q/2)/(np-1):1, sd=q%2;
        ang=(mm==='x'?(sd?-1:1):(sd?1:-1))*A0*(np>1?0.4+0.6*kp:1); if(mm==='x') seite=sd?1:-1; }
      else if(pl.melodie&&paarig){ const sd=i%2; ang=(mm==='x'?(sd?-1:1):(sd?1:-1))*A0; if(mm==='x') seite=sd?1:-1; }
      else if(je&&mm&&mm!=='bogen'&&mm!=='bild'&&mm!=='halbkreis') [ang,dOff]=musterWinkel(mm,q,gn,kq,A0,ph);
      else if(mm==='vfan') ang=(1-Math.abs(0.5-k)*2)*A0*(i%2?1:-1);
      else if(mm==='v') ang=(q?1:-1)*A0;
      else if(mm==='x') { ang=(q?-1:1)*A0*(0.55+0.45*kg); seite=q?1:-1; }
      else if(mm==='paar') ang=(q?1:-1)*A0*(0.25+0.75*kg);
      else if(mm==='halbkreis'){ const v=ph.von, g0=ph.gap===undefined||ph.gap===0;
        ang=v==='aussen'?musterWinkel('aussen',i,n,k,A0,ph)[0]:(v==='mitte'||!g0)?musterWinkel('mitte',i,n,k,A0,ph)[0]:(-1+2*k)*A0; }
      else if(mm&&mm!=='bogen'&&mm!=='bild') [ang,dOff]=musterWinkel(mm,i,n,k,A0,ph);
      else if(!mm&&ph.ang) ang=rand(-ph.ang,ph.ang);
      /* angOff: Grundwinkel, gezaehlt wie x (Liste je Schuss, in Gruppen
         je Gruppe) - Saeulen und Module aus einem Karton faechern sich am
         Himmel auf, statt am selben Punkt zu stehen (28.09., Tom: echt -
         die Orte liegen auf der Oeffnung, die Breite am Himmel kommt aus
         dem Rohrwinkel wie bei echten Faecherbatterien) */
      if(ph.angOff!==undefined) ang+=+jeSchuss(ph.angOff,je?s.g:i)||0;
      if(!seite) seite=A0>0?clamp(ang/A0,-1,1):0;
      /* Effekte der Reihe nach, nicht gewuerfelt */
      const eff=Array.isArray(ph.eff)?ph.eff[idx%ph.eff.length]:(ph.eff||pick(EFF_GROSS));
      let [A,B]=paar(i);
      if(ph.A){ A=farbe(jeSchuss(ph.A,i))||A; B=ph.B?farbe(jeSchuss(ph.B,i))||B:A; }
      else if(ph.B) B=farbe(jeSchuss(ph.B,i))||B;
      if(ph.farbFolge){ A=farbe(jeSchuss(ph.farbFolge,i))||A; B=FW.weiss; }
      if(ph.farbVert==='spektrum'){ A=B=K(SPEKTRUM_FW[(je&&mm==='bogen'?s.g:i)%SPEKTRUM_FW.length]); }
      if(ph.farbVert==='seite'&&seite>0) [A,B]=[B,A];
      if(ph.farbVert==='mitte'&&Math.abs(seite)<0.34) [A,B]=[B,A];
      const baseDir=ph.azi!==undefined&&ph.azi!=='zufall'?ph.azi:FANDIR;
      const dir=mm&&mm!=='gerade'&&mm!=='treppe'?baseDir+dOff:(ph.ang?undefined:FANDIR);
      /* Hoehe: Muster ueber die Phase (in Gruppen je Gruppe), Welle,
         Melodie (Ton x hStufe), Akkord (Ton je Rohr) */
      const hS=ph.hSpanne!==undefined?ph.hSpanne:(mm==='treppe'?8:4), hm=ph.hoehe||(mm==='treppe'?'steigend':null), kh=je?kq:k;
      let hAdd=hm==='steigend'?(kh-0.5)*hS:hm==='fallend'?(0.5-kh)*hS:hm==='wechsel'?(i%2?0.5:-0.5)*hS:hm==='zufall'?rand(-0.5,0.5)*hS:0;
      if(hm==='welle') hAdd=hS/2*Math.sin(2*Math.PI*k*(ph.wellen||1));
      if((hm==='melodie'||hm==='akkord')&&ph.noten&&ph.noten.ton) hAdd=ph.noten.ton[i%ph.noten.ton.length]*(ph.hStufe||4)/(STEIG*fuseS);
      const szK=kalWert(ph.kal,idx);
      let pw=BS.pw+(ph.pw||0)+Rz.pw+hAdd;
      /* nie tiefer als 6 m ueber dem Rohr brechen */
      if(steigHoehe(pw,fuseS)<6) pw=pwFuerHoehe(6,fuseS);
      /* 03.10. abends (Tom: "die Effekte muessen alle ganz oben sein" -
         mindestens so hoch wie Silbergewitter): jede Bruchhoehe der Show
         um SHOW_HUB hoeher (was unter 16 m lag, noch etwas mehr), mit
         laengerer Steigzeit. Alle Abstufungen
         (Rampe, Hoehenmuster, Ebenen) bleiben erhalten. */
      let fuseH=fuseS;
      if(SHOW_HUB&&!ph.tief){ const h0=steigHoehe(pw,fuseS), hN=h0+SHOW_HUB+Math.max(0,16-h0)*0.4; fuseH=ph.fuse||clamp(1.05+hN/36,1.2,2.2); pw=pwFuerHoehe(hN,fuseH); }
      const sz=bruchKappe((ph.sz||1)*szK*BS.sz*SHOW_GROESSE*Rz.sz), hB=steigHoehe(pw,fuseH);
      /* Abschussort: x in Metern (Liste je Schuss, in Gruppen je Gruppe),
         rohrFolge relativ zur Batteriebreite, rohre:'breit' nach Seite */
      let off=0;
      if(ph.x!==undefined) off+=+jeSchuss(ph.x,je?s.g:i)||0;
      if(ph.rohrFolge) off+=jeSchuss(ph.rohrFolge,i)*breite/2;
      /* breit und treffen: die aeusseren Rohre der Batterie. treffen
         zielt von dort auf einen Punkt ueber der Mitte - die Schuesse
         kreuzen sich, ohne dass sie meterweit neben dem Karton starten */
      if(ph.rohre==='breit'||(mm==='x'&&ph.treffen)) off+=seite*breite/2;
      VM.nimm(off);
      const mitOrt=!!(off||ph.x!==undefined||ph.rohrFolge||ph.rohre==='breit');
      /* Bildmuster ueber den Zielschuss: der Bruch liegt genau am Bildpunkt */
      if(mm==='halbkreis'){ const Rh=hB; ziel={x:o.x+Math.sin(FANDIR)*Math.sin(ang)*Rh,y:(o.y||0)+Math.max(8,Math.cos(ang)*Rh),z:o.z+Math.cos(FANDIR)*Math.sin(ang)*Rh}; }
      else if(mm==='bogen'){ const r=ph.r||[1,0.7], Rb=30*(r[0]+(r[1]-r[0])*kg)*rSk, th2=(20+140*(gn>1?q/(gn-1):0.5))*Math.PI/180, yc=(o.y||0)+(ph.bogenY!==undefined?ph.bogenY:4);
        ziel={x:o.x+Math.sin(FANDIR)*Math.cos(th2)*Rb,y:yc+Math.sin(th2)*Rb,z:o.z+Math.cos(FANDIR)*Math.cos(th2)*Rb}; }
      else if(mm==='bild'){ const f=(BILD_FORM[ph.form]||BILD_FORM.herz)(i,n), W=bildW, yc=(o.y||0)+bildY;
        ziel={x:o.x+Math.sin(FANDIR)*f[0]*W,y:yc+f[1]*W,z:o.z+Math.cos(FANDIR)*f[0]*W}; }
      else if(mm==='x'&&ph.treffen){ ziel={x:o.x,y:(o.y||0)+0.4+hB,z:o.z}; }
      /* Rohrstreuung (29.09., Tom: "in echten Batterien kommt jeder Schuss
         aus seinem eigenen Rohr - die Explosion ist NIE 1:1 an derselben
         Stelle"): jedes Rohr steht ein wenig schief, bis ROHR_STREU rad in
         zufaelliger Richtung. Vorher brach ein Drittel aller Schuesse auf
         30 cm genau dort, wo schon ein anderer gebrochen war (gerade
         Salven: sechs Kugeln in einem Punkt). Bildmuster behalten ihre
         Form - ihr Zielpunkt wandert nur ein paar Dezimeter. */
      const streu=ph.streu!==undefined?ph.streu:ROHR_STREU;
      let sAng=ang, sDir=dir;
      /* Batterie: Richtung schon hier festlegen (Saat), das Rohr steht so */
      if(RS&&dir===undefined&&!ziel) sDir=rand(0,Math.PI*2);
      if(streu>0&&!ziel){ const r=streu*Math.sqrt(Math.random()), az=Math.random()*Math.PI*2, d0=dir===undefined?rand(0,Math.PI*2):dir;
        const vx=Math.sin(d0)*Math.sin(ang)+Math.sin(az)*r, vz=Math.cos(d0)*Math.sin(ang)+Math.cos(az)*r, vy=Math.cos(ang);
        sAng=Math.atan2(Math.hypot(vx,vz),vy); sDir=Math.atan2(vx,vz); }
      if(streu>0&&ziel){ const w=streu*6; ziel={x:ziel.x+rand(-w,w),y:ziel.y+rand(-w,w)*0.6,z:ziel.z+rand(-w,w)}; }
      /* Schussfarbe der Aufstiegsspur */
      const trail=ph.spurFarbe==='A'?A:ph.spurFarbe==='B'?B:ph.spurFarbe?farbe(ph.spurFarbe)||undefined:undefined;
      const par={art:ph.art,split:ph.split,modus:ph.modus,sync:ph.sync,splitDreh:ph.splitDreh,schlaege:ph.schlaege,gleit:ph.gleit,form:ph.form,treffen:ph.treffen,i,n,g:s.g,q};
      const opt={eff,sz,pw,ang:sAng,dir:sDir,A,B,fuse:ziel?(bildT||ph.fuse||zielZeit(ziel.y-(o.y||0))):(ph.fuse||fuseH),dick:ph.dick,hell:Rz.hell,pfeif:ph.pfeif||ph.steig==='pfeif',steig:ph.steig,fein:true,bruchOpt:showBlitz(ph.bruchOpt),
        trail,ton:tonFuer(ph.ton,i,q),par,tag,ziel,knall:ph.knall||showKlang(prod,eff,sz)};
      /* Boden je Gruppe am Gruppenort */
      if(q===0) boeden.forEach(b=>{ if(b.je) bodenAn(b,tt+(b.t||0),off); });
      const [mA,mB]=[A,B];
      /* Richtung des Rohrs (Welt): Zielschuss zum Zielpunkt, Mine und
         Kugel senkrecht, sonst Winkel und Azimut des Schusses */
      let rv=null;
      if(ziel){ const T=opt.fuse||zielZeit(ziel.y-(o.y||0)), v=zielTempo(V(o.x,o.y||0,o.z),ziel,T), l=v.length()||1; rv=[v.x/l,v.y/l,v.z/l]; }
      else if(ph.bomb||ph.nurMine||ph.mine||ph.mineEff) rv=[0,1,0];
      else if(ph.perle){ const a=mm&&mm!=='gerade'?ang:0, d0=dir===undefined?FANDIR:dir; rv=[Math.sin(d0)*Math.sin(a),Math.cos(a),Math.cos(d0)*Math.sin(a)]; }
      plane(tt,ev=>{
        const os=RS?RS.ort(ev.k):(mitOrt?ortAus(off):o);
        if(RS) RS.feuer(ev.k,os);
        /* Batterie: der Schuss fliegt in Richtung seines Rohrs (Zielschuesse
           fuer Bildmuster behalten ihren Zielpunkt) */
        let fa=sAng, fd=sDir;
        const ausRohr=RS&&!ziel;
        if(ausRohr){ const r=RS.richtung(ev.k); fa=r.ang; fd=r.dir; }
        const alt=FW_TAG; FW_TAG=tag;
        /* licht: ein Lichtertyp direkt aus dem Rohr, ohne Bombette (14m,
           01.10., Tom: Kometen, Blinker, Fontaenen, Wasserfall ...) */
        if(ph.licht&&typeof LICHTYP!=='undefined'&&LICHTYP[ph.licht]){ try{ lichtSchuss(os,ph.licht,mA,mB,sz,{ang:fa,dir:fd===undefined?FANDIR:fd,i,n,hell:Rz.hell}); } finally { FW_TAG=alt; } return; }
        /* Feuertopf (Sorte) oder Tiefbruch (EFF) statt der alten Mine */
        if(ph.mineEff) feuertopf(os,ph.mineEff,mA,mB,(ph.mineSz||(TOPF_SORTE[ph.mineEff]?1:0.6))*Rz.sz);
        else if(ph.mine||ph.nurMine) mine(os,mA,mB,(ph.mineSz||0.8)*Rz.sz);
        if(!ph.nurMine){
          /* bomb: echte Kugelbombe mit Nachbruechen statt einer Rakete */
          if(ph.bomb){ BLITZ_K=SHOW_BLITZ; try{ kugelbombe(os,ph.bomb,{A:mA,B:mB,eff:ph.bombEff||['dahlie','dahlie','chrys','mehrring','kamuro'][ph.bomb-1],stufen:ph.bombStufen,stufenRel:true,
            schlaege:ph.schlaege,steig:ph.steig,bruchOpt:showBlitz(ph.bruchOpt),par,tag,
            pw:ph.bombPw,sz:ph.bombSz,schlag:ph.schlag,dick:ph.dick,trail:ph.trail?K(ph.trail):undefined,fuse:ph.bombFuse}); } finally { BLITZ_K=1; } }
          /* perle: Roemisches Licht - eine Leuchtkugel direkt aus dem Rohr */
          else if(ph.perle) perleSchuss(os,mA,sz,{hub:PERLE_HUB,eff:perleEff,ang:ausRohr?fa:mm&&mm!=='gerade'?ang:(perleEff||ph.rohrFolge?0:undefined),dir:ausRohr?fd:dir===undefined?FANDIR:dir,B:mB,i,kette,splitDreh:ph.splitDreh});
          else shot(os,ausRohr?Object.assign({},opt,{ang:fa,dir:fd}):opt);
        }
        FW_TAG=alt;
      },{art:'s',ang:sAng,dir:sDir,rv,brenn:ph.licht&&typeof LICHT_BRENN!=='undefined'?LICHT_BRENN[ph.licht]||0:0});
    });
  });
  if(RS||PLAN){
    const Z=zuendFolge(EV,prod,showDauer(phases));
    if(PLAN) return Z;
    for(const e of EV) later(e.tt,()=>e.fn(e));
    later(Z.letzter+0.35,()=>RS.nachrauch(3.2));
    return Z.dauer;
  }
  return showDauer(phases);
}
/* Rohrstreuung der Batterien in rad (siehe show): 0,05 rad = knapp 3 Grad,
   am Bruchpunkt in 20-25 m gut ein Meter */
let ROHR_STREU=0.05;
/* Hub aller Bruchhoehen einer Show in m (03.10. abends, Tom: "viel, viel,
   viel hoeher") - gemessen an Silbergewitter (Lichter brechen bei 27-31 m) */
let SHOW_HUB=13, PERLE_HUB=2.3;   /* Kerzen: Starttempo x 2,3 - mit Luftwiderstand gut 24 m statt 9 m */
/* Bruchklang der Batterien (03.10. abends, Tom: "die Sounds machen es echt
   aus ... verschiedene Toene, immer ein bisschen unterschiedlich, und darauf
   passende Effekte"): statt des einen Standard-Knalls (Boom + zwei Cracks)
   bekommt jeder Bruch einen Klang aus der Palette (13-sound BRUCH_KLAENGE),
   der zu seinem Bild passt - leise Sterne puffen, Crossetten knacken in
   Kaskade, Weiden rauschen, Knistersterne knistern nach. Welcher der
   passenden Klaenge, waehlt das Produkt (jede Batterie klingt anders),
   grosse Brueche nehmen den schwereren. */
const BRUCH_ZU={
  salut:['salut'], figur:['klack','puff','plopp'], kugel:['puff','doppel','crack','plopp'],
  glanz:['rieseln','puff','knisterhall'], kern:['doppel','puff','kaskade'], weide:['brokat','donnerhall','wumms'],
  palme:['wumms','brokat','puff'], komet:['zisch','kaskade','crack'], knister:['knisterhall','crack','kaskade'],
  schwarm:['zisch','knisterhall'], flamme:['wumms','puff'], glitzer:['rieseln','knisterhall']};
const BRUCH_ART={chrys:'glanz',goldglitzer:'glanz',farbregen:'glanz',sternspritzer:'glitzer',pistill:'kern',wechsel:'kern',drachenblut:'kern',kaleidoskop:'kern',
  weide:'weide',glitzerweide:'weide',kamuro:'weide',brokat:'weide',zeitregen:'weide',kronleuchter:'weide',goldvorhang:'weide',nishiki:'weide',vorhang:'weide',polarlicht:'weide',
  palme:'palme',kokosnuss:'palme',sternpalme:'palme',tigerschweif:'palme',lavaregen:'flamme',
  komet:'komet',kaskade:'komet',sternschnuppen:'komet',titan:'komet',rossschweif:'komet',meteor:'komet',crossette:'komet',kreuzstern:'komet',
  fische:'schwarm',bienen:'schwarm',fischschwarm:'schwarm',kiefernkrone:'knister'};
const klangHash=s=>{ let h=7; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h; };
function bruchKlangArt(eff){ return BRUCH_ART[eff]||(EFF_FAMILIE[eff]==='haenger'?'weide':EFF_FAMILIE[eff])||'kugel'; }
function showKlang(prod,eff,sz){ const L=BRUCH_ZU[bruchKlangArt(eff)]||BRUCH_ZU.kugel;
  let i=(klangHash(prod||'x')+klangHash(eff||''))%L.length;
  if(sz>1.45&&L.indexOf('wumms')>=0) i=L.indexOf('wumms'); else if(sz>1.45&&L.indexOf('donnerhall')>=0) i=L.indexOf('donnerhall');
  const n=L[i]; return 'bk'+n[0].toUpperCase()+n.slice(1); }
/* Feuertopf (mineEff). Sorten = Sternsaeule 10-15 m ohne Bombette:
   farbe, blink, knister, silber, gold, glut. Jeder andere Name ist ein
   Bruchbild: Tiefbruch 4-8 m ueber der Batterie in Groesse s. */
const TOPF_SORTE={farbe:1,blink:1,knister:1,silber:1,gold:1,glut:1};
function feuertopf(o,eff,A,B,s){
  /* zwei Fassungen entstanden parallel (Stufe 1 A/B): die aus 14e hat je
     Sorte ein eigenes Bild und ist in bausteine2.js geprueft - sie gilt */
  if(TOPF_SORTE[eff]) return (typeof feuertopfSorte==='function'?feuertopfSorte:topfSaeule)(o,eff,A,B,s);
  if(typeof tiefbruch==='function') return tiefbruch(o,eff,A,B,s||0.6);
  shot(o,{eff,A,B,sz:s||0.6,pw:-8+rand(-0.8,0.8),fuse:0.7,ang:rand(-0.08,0.08),steig:'keiner',bruchOpt:{nachglitzer:false,kern:false}});
}
function topfSaeule(o,sorte,A,B,s){
  s=s||1; const q=QUAL(), y0=(o.y!==undefined?o.y:0.3)+(o.ab!==undefined?o.ab:0.05), H=rand(10,15)*Math.sqrt(s), alt=SCHWEIF;
  const G={farbe:6,blink:6,knister:6,silber:7,gold:4,glut:5}[sorte], v0=vFuerHoehe(H,G), tA=Math.log(1+ZIEH*v0/G)/ZIEH;
  const n=Math.round({farbe:44,blink:36,knister:40,silber:80,gold:50,glut:40}[sorte]*s*q);
  SCHWEIF={farbe:0.2,blink:0,knister:0.15,silber:0.1,gold:0.45,glut:0.3}[sorte];
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, w=rand(0.2,1.4), vy=v0*rand(0.82,1.0);
    const c=sorte==='silber'?[1,1,1]:sorte==='glut'?[1,.36,.1]:sorte==='gold'?[1,.8,.42]:sorte==='blink'?(i%3?[1,1,1]:A):(i%3?A:B);
    const ps=sorte==='silber'?psMid:psBig, L=sorte==='gold'?tA*1.4:sorte==='glut'?tA*1.25:sorte==='silber'?tA*0.8:tA*rand(0.92,1.05);
    ps.emit(o.x,y0,o.z,Math.cos(a)*w,vy,Math.sin(a)*w,c[0]*1.15,c[1]*1.15,c[2]*1.15,L,G,sorte==='blink'?1:sorte==='gold'?4:0);
    /* knister: oben zerplatzt jeder Stern knisternd */
    if(sorte==='knister'&&i%2===0){ const d=tA*rand(0.85,1.0), p0={x:o.x,y:y0,z:o.z}, vv=[Math.cos(a)*w,vy,Math.sin(a)*w];
      later(d,()=>{ const e=bahnOrt(p0,vv,G,d); for(let k=0;k<Math.round(6*q);k++){ const r=randDir(); psSmall.emit(e.x,e.y,e.z,r[0]*2.5,r[1]*2.5,r[2]*2.5,1.4,1.4,1.3,rand(0.05,0.12),1,3); } }); } }
  if(sorte==='glut') for(let i=0;i<Math.round(24*q);i++){ const a=Math.random()*Math.PI*2; psMid.emit(o.x,y0,o.z,Math.cos(a)*0.6,rand(1,3),Math.sin(a)*0.6,.35,.3,.28,rand(1.2,2),-0.3,0); }
  SCHWEIF=alt;
  if(sorte==='knister') later(tA*0.9,()=>{ sfx.crackle(distVol(o)); later(0.25,()=>sfx.crackle(distVol(o)*0.7)); });
  muendungsblitz(o,y0,1.6); flash({x:o.x,y:y0+0.8,z:o.z},sorte==='silber'?[1,1,1]:A,1.8,0.3); sfx.thump(distVol(o)*1.2);
  if(FW_LOG) FW_LOG.push({t:FW_UHR,art:'topf',sorte,x:+o.x.toFixed(2),hoehe:+H.toFixed(1),A,B,tag:FW_TAG});
}
/* Schlussschlag (mehrschlag): sehr grosser Salut, weisse Titanwolke,
   langer Knall - kein Druckring (Kritik) */
if(!EFF.schlussschlag) EFF.schlussschlag=function(p,A,B,s){
  (EFF.salut||EFF.kugel)(p,[1,1,1],[1,1,1],s*1.3);
  const q=QUAL();
  for(let i=0;i<Math.round(260*s*q);i++){ const d=randDir(), w=rand(2,7)*s; psMid.emit(p.x,p.y,p.z,d[0]*w,d[1]*w,d[2]*w,1,1,1,rand(1.2,2.4),0.8,4); }
  flash(p,[1,1,1],6*s,0.9); shake=Math.max(shake,0.6*distVol(p));
  const d=camera.position.distanceTo(p)/343; later(d,()=>{ sfx.boom(distVol(p)*1.4); if(typeof grollen==='function') grollen(2.5,0.4*distVol(p),200,0.1); });
};
/* =========================================================
   Kugelbomben-Sorten (KUGEL.<id>, Katalog 26.09.): jede Sorte ein
   eigenes Hauptbild, eigener Aufstieg, eigene Nachbrueche.
   Format: {kal, sz, pw, fuse, th, haupt, A, B, C, steig, bruchOpt,
   ton, drall, kerne[], kobana, stehen, stufen:[{t, eff, sz (relativ),
   A, B, n, kranz, drall, risse, lage, dreh, leise, bruchOpt}]}
   ========================================================= */
const KUGEL={};
function kugelSorte(o,k){
  const th=k.th||'bunt', [tA,tB]=themaPaar(th,0), [tC]=themaPaar(th,1);
  const A=farbe(k.A)||tA, B=farbe(k.B)||tB, C=farbe(k.C)||tC, kerne=k.kerne?k.kerne.map(farbe):null;
  /* 02.10. (Tom: "breite Fontaenen ruhig beim Abschuss, mit Roemischen
     Lichtern"): manche Kugeln zeigen schon am Moerser etwas (14p) */
  if(k.abschuss&&typeof KUGEL_ABSCHUSS!=='undefined'&&KUGEL_ABSCHUSS[k.abschuss]) KUGEL_ABSCHUSS[k.abschuss](o,A,B,k.kal||1);
  return kugelbombe(o,k.kal||1,{A,B,C,eff:k.haupt,sz:k.sz,pw:k.pw,fuse:k.fuse,steig:PFEIF_ERSATZ[k.steig]||k.steig,bruchOpt:k.bruchOpt,knall:k.ton,
    stufen:k.stufen||[],stufenRel:true,kobana:k.kobana,kerne,stehen:k.stehen,par:{drall:k.drall,kerne,C,dreh:k.dreh}});
}
/* =========================================================
   Fontaenen-Phasen (FONT.<id>, Katalog 26.09.): die Ablauf-Engine.
   Die Emitter-Arten selbst (gerb, hoerner, wasserorgel ...) stehen in
   NEU_EMIT; hier werden sie zeitlich gesteuert:
     at:s | mit:true | ohne: nach der vorigen Phase (minus deren blende)
     t        Brenndauer
     blende   Ueberblendung in die naechste Phase in s (0 = harter Schnitt)
     x, z     Duesenort in m; x:'alle3'|'alle4'|'reihe3' = dieselbe Phase an
              allen Duesen (Produkt-Feld duesen oder Standard); Felder als
              Liste (A, B, C, neig, azi) gelten dann je Duese
     hm, hKurve:[a,b], hStufen:[m...]   Hoehe in m, Verlauf
     kegel, dichte, lautKurve, neigKurve: Zahl oder [von,bis] ueber die Phase
     neig (Grad), azi ('innen'|'aussen'|Grad, 0 = quer nach rechts)
     ende     Ereignis am Phasenende: FONT_EREIGNIS[ende](e,o,ph)
   Jeder Emitter e bekommt je Bild: e.u (0..1), e.staerke (Ueberblendung),
   e.hAkt (m), e.stufe, e.kegelAkt, e.dichteAkt, e.lautAkt, e.neigAkt (rad),
   e.aziAkt (rad), e.dir (Duesenrichtung), dazu e.ph (Phase), e.nr, e.duesen.
   ========================================================= */
const FONT={}, FONT_EREIGNIS={}, FONT_TON={};
const DUESEN_STD={alle2:[-0.2,0.2],alle3:[-0.3,0,0.3],reihe3:[-0.3,0,0.3],alle4:[-0.21,-0.07,0.07,0.21],alle5:[-0.4,-0.2,0,0.2,0.4]};
/* kleine eingebaute Ereignisse; die grossen bringen die Emitter-Bauer mit */
Object.assign(FONT_EREIGNIS,{
  aus(){},
  pff(e,o){ for(let k=0;k<Math.round(14*QUAL());k++){ const d=randDir(); psSmall.emit(o.x,o.y+0.3,o.z,d[0],Math.abs(d[1])+0.3,d[2],.8,.8,.85,rand(0.3,0.6),0.5,0); } sfx.crack(distVol(o)*0.3); }
});
function fontPhasenListe(spec){
  const def=Object.assign({},spec); delete def.phasen; delete def.duesen;
  return (spec.phasen||[]).map(p=>Object.assign({},def,p));
}
/* Start je Phase und Einblendzeit (blende der vorigen, wenn sie sich ueberlappen) */
function fontZeiten(PH){
  const z=[], ein=[];
  PH.forEach((ph,i)=>{ const vor=PH[i-1];
    let s;
    if(typeof ph.at==='number') s=ph.at;
    else if(ph.mit&&i>0) s=z[i-1];
    else s=i?z[i-1]+(vor.t||0)-(vor.blende||0):0;
    z.push(s);
    ein.push(i&&!ph.mit&&vor.blende&&s<z[i-1]+(vor.t||0)?vor.blende:0); });
  return {z,ein};
}
function fontDauer(spec){ const PH=fontPhasenListe(spec), {z}=fontZeiten(PH); let e=0; PH.forEach((ph,i)=>{ e=Math.max(e,z[i]+(ph.t||0)); }); return e; }
function bereich(x,u){ return Array.isArray(x)&&x.length===2&&typeof x[0]==='number'?x[0]+(x[1]-x[0])*u:x; }
function fontTick(e,dt){
  e.alter+=dt; const ph=e.ph, u=e.u=clamp(e.alter/Math.max(0.01,e.dauer),0,1);
  const a=e.blendeIn>0?Math.min(1,e.alter/e.blendeIn):1, b=e.blendeAus>0?Math.min(1,Math.max(0,e.dauer-e.alter)/e.blendeAus):1;
  e.staerke=clamp(a*b,0,1);
  const hm=typeof ph.hm==='number'?ph.hm:undefined;
  if(ph.hStufen&&ph.hStufen.length){ const j=Math.min(ph.hStufen.length-1,Math.floor(u*ph.hStufen.length)); if(j!==e.stufe){ e.stufeNeu=e.stufe!==undefined; e.stufe=j; } else e.stufeNeu=false; e.hAkt=ph.hStufen[j]; }
  else if(hm!==undefined) e.hAkt=hm*(ph.hKurve?bereich(ph.hKurve,u):1);
  else e.hAkt=bereich(ph.hm,u);
  e.kegelAkt=bereich(ph.kegel,u); e.dichteAkt=bereich(ph.dichte,u); e.lautAkt=bereich(ph.lautKurve,u);
  const ng=ph.neigKurve?bereich(ph.neigKurve,u):(ph.neig||0); e.neigAkt=ng*Math.PI/180;
  const dx=e.dx||0; let az=0;
  if(ph.azi==='innen') az=dx>0?Math.PI:0; else if(ph.azi==='aussen') az=dx<0?Math.PI:0; else if(typeof ph.azi==='number') az=ph.azi*Math.PI/180;
  e.aziAkt=az;
  /* azi 0 = quer zum Blick nach rechts (+x), 90 Grad = vom Zuschauer weg */
  const sn=Math.sin(e.neigAkt); e.dir=[sn*Math.cos(az),Math.cos(e.neigAkt),-sn*Math.sin(az)];
  /* vorhandene Emitter lesen ihre Hoehe als Faktor: riesen (Krone 10,2 m) */
  if(e.k==='riesen'&&e.hAkt) e.h=e.hAkt/10.2;
}
function fwTicks(dt){ for(const e of emitters) if(e.font) fontTick(e,dt); }
/* Duesen einer Fontaenen-Phase (x quer in m) */
function duesenListe(spec,ph){ return typeof ph.x==='string'?(spec.duesen&&spec.duesen.length&&ph.x.startsWith('alle')?spec.duesen:DUESEN_STD[ph.x]||[0]):Array.isArray(ph.x)?ph.x:[ph.x||0]; }
/* Duesen sitzen im Produkt: Reihen breiter als der Karton werden auf
   seine Oeffnung gestaucht, die Reihenfolge bleibt (28.09., Tom: echt).
   Vorher standen die Duesen der Dreier- und Fuenferreihen bis 0,4 m
   vom Mittelpunkt - neben einer 27 cm breiten Fontaene. */
function duesenMass(spec,o,prod){ const VM=versatzMass(); VM.halb=oeffnungHalb(o,prod);
  fontPhasenListe(spec).forEach(ph=>duesenListe(spec,ph).forEach(dx=>VM.nimm(+dx||0))); (spec.duesen||[]).forEach(dx=>VM.nimm(dx)); return VM; }
/* Wo die Duesen eines Fontaenen-Sets im Karton sitzen (quer, m, wie auf
   dem Tisch) - das Modell setzt seine Kegel genau dorthin: die Fontaene
   kommt aus der Duese, die man sieht */
function fontDuesenLage(t,mitFarbe){
  const spec=FONT[t], p=P[t]; if(!spec||!p||!p.dims) return null;
  const hx=p.dims[0]/2, hz=p.dims[2]/2, VM=duesenMass(spec,{hx,jit:Math.min(0.06,hx*0.5,hz*0.5)},t), k=VM.k(), xs=new Map();
  /* eine Phase ohne x ist bei Sets mit duesen nur der Ankerpunkt - ihr
     Emitter spruehet aus den duesen (Wasserorgel, Faecherwand). Farbe
     einer Duese: A der ersten Phase, die aus ihr spruehet */
  const nimm=(dx,A)=>{ const x=+((+dx||0)*k).toFixed(3); if(!xs.has(x)||(!xs.get(x)&&A)) xs.set(x,A?farbe(A):null); };
  fontPhasenListe(spec).forEach(ph=>{ if(ph.x===undefined&&spec.duesen) return; const L=duesenListe(spec,ph);
    L.forEach((dx,nr)=>nimm(dx,Array.isArray(ph.A)&&ph.A.length===L.length?ph.A[nr]:typeof ph.A==='string'?ph.A:null)); });
  (spec.duesen||[]).forEach(dx=>nimm(dx,typeof spec.A==='string'?spec.A:null));
  const L=[...xs.keys()].sort((a,b)=>a-b);
  return mitFarbe?L.map(x=>({x,c:xs.get(x)})):L;
}
function fontPhasen(o,spec,prod,tag){
  tag=tag||neuerShowTag();
  const PH=fontPhasenListe(spec), {z,ein}=fontZeiten(PH);
  const VM=duesenMass(spec,o,prod);
  const kx=VM.k(), duesenK=spec.duesen?spec.duesen.map(v=>v*kx):null, d=P[prod]&&P[prod].dims, hz=Math.max(0,(o&&o.hz!==undefined?o.hz:d?d[2]/2:0.3)-0.02);
  PH.forEach((ph,pi)=>{
    const xs=duesenListe(spec,ph);
    const viele=xs.length>1;
    xs.forEach((dx,nr)=>{
      /* Felder als Liste gelten je Duese */
      const pn=Object.assign({},ph); if(viele) for(const f of ['A','B','C','neig','azi']) if(Array.isArray(ph[f])&&ph[f].length===xs.length) pn[f]=ph[f][nr];
      const ob=versetzt(o,dx*kx,clamp(ph.z||0,-hz,hz));
      const A=farbe(pn.A)||FW.gold, B=farbe(pn.B)||FW.weiss, C=farbe(pn.C)||null;
      later(z[pi],()=>{
        if(ph.k==='monsterfont'){ monsterFontaene(ob,ph.hm||30,ph.t||12,ph.farben||[A,B,FW.gold],ph.stil); return; }
        const e={k:ph.k,t:ph.t||4,o:ob,A,B,C,ph:pn,font:true,alter:0,dauer:ph.t||4,blendeIn:ein[pi],blendeAus:ph.blende||0,nr,dx:dx*kx,duesen:duesenK,spielraum:Math.max(0.02,VM.halb-Math.abs(dx*kx)),
          h:ph.hm&&ph.k==='riesen'?ph.hm/10.2:(ph.h||1),klein:ph.klein,tag,prod};
        fontTick(e,0); emitters.push(e);
        if(nr===0){ if(FONT_TON[ph.ton]) FONT_TON[ph.ton](e,distVol(ob)); else if(ph.ton!=='still') sfx.fizz(distVol(ob)); }
        if(ph.ende) later(ph.t||4,()=>{ const f=FONT_EREIGNIS[ph.ende]; if(f){ const alt=FW_TAG; FW_TAG=tag; f(e,ob,pn); FW_TAG=alt; } });
      });
    });
  });
  return fontDauer(spec);
}
/* --- Drehbücher --- */
/* Alle Show-Drehbuecher stehen seit dem 26.09. in 14g-db-einstieg.js
   (bis Level 15) und 14h-db-gross.js (ab Level 16). Die alten Eintraege
   fuer Familienfest, Nachthimmel, Knattersturm, Feuersturm und das
   Roemische Licht wurden dort ohnehin ueberschrieben und sind weg
   (28.09.: sie enthielten noch Regenbogen- und Feuerradbrueche). */
const SHOWS={};
/* Raketensets: die Eintraege stehen seit dem 26.09. in 14i-db-raketen.js
   (Tom: "jede Rakete eine Anomalie" - eigener Aufstieg, eigener Bruch). */
const RAKETEN_KL={};
function showLength(id){ const f=SHOWS[id]; if(!f) return 0;
  /* Batterien: Dauer nach der echten Zuendfolge (0,2-0,4 s je Schuss) */
  if(typeof istBatterie==='function'&&istBatterie(id)){ const Z=zuendPlan(id); if(Z) return Math.round(Z.dauer); }
  return Math.round(showDauer(f())); }

/* =========================================================
   Zünden
   ========================================================= */
function igniteType(t,o0,it){
  const p=P[t]; if(!p||!p.cat) return;
  /* o0: der Platz des Produkts auf der Station. Ohne Angabe (alte
     Aufrufe, Tests) die Mitte der passenden Station. */
  const o=o0||padOf(t), sh=p.shape;
  /* Vorfuehrung (Entwicklung): kein Hype, keine Erfahrung - sonst ging
     nach gut zwanzig Zuendungen das Level-Fenster auf und fing die Tasten */
  if(!(typeof vfAn!=='undefined'&&vfAn)){
    hype=Math.min(100,hype+p.hype); DS.burned=r2(DS.burned+costOf(t)); addXP(Math.max(1,Math.round(p.hype/3)));
    statAdd('gezuendet',1); statAdd('hype',p.hype); }
  else vfGezuendet++;
  if(SHOWS[t]){ const tag=neuerShowTag(); emitters.push({t:0.8,k:'fuse',o}); later(0.8,()=>playShow(o,SHOWS[t](),t,tag)); return; }
  /* Anomalie-Tabellen (26.09.): Fontaenen in Phasen, Kugelsorten,
     Kleinfeuerwerk (Verteiler aus der Kleinfeuerwerk-Datei) */
  if(FONT[t]){ fontPhasen(o,FONT[t],t); return; }
  if(KUGEL[t]){ kugelSorte(o,KUGEL[t]); return; }
  if(typeof kleinZuenden==='function'&&kleinZuenden(t,o,it)) return;
  /* neue Ware (Sortiment mal drei): Fontaenen, Boeller, Kleinfeuerwerk, Kugelsorten */
  if(typeof neuZuenden==='function'&&neuZuenden(t,o)) return;
  /* ----- Eigene Rezeptur: das Rezept sagt, was passiert ----- */
  if(p.rezept){
    const rz=p.rezept, tr=traegerVon(rz.traeger);
    const A=K(rz.A)||FW.gold, B=K(rz.B)||FW.weiss;
    const st=rz.eff2?[{t:0.55,eff:rz.eff2,sz:tr.kal*0.6,streu:5,A:B,B:A}]:null;
    if(tr.shape==='shell'){
      kugelbombe(o,rz.traeger==='kugel100'?2:1,{A,B,eff:rz.eff});
    } else if(tr.shape==='battery'){
      /* eigene Batterie: wie jede Batterie Rohr fuer Rohr nach Plan */
      emitters.push({t:0.7,k:'fuse',o});
      const Z=zuendPlan(t), RS=rohrSatz(o,t);
      if(Z&&RS){ Z.S.forEach((e,i)=>later(0.7+e.tt,()=>{ const os=RS.ort(e.k); RS.feuer(e.k,os);
          shot(os,{sz:tr.kal,eff:rz.eff,A,B,ang:e.ang,dir:e.dir,stufen:i===Z.S.length-1?st:null}); }));
        later(0.7+Z.letzter+0.35,()=>RS.nachrauch(3.2)); }
      else for(let i=0;i<tr.schuss;i++) later(0.7+i*0.32,()=>
        shot(o,{sz:tr.kal,eff:rz.eff,A,B,ang:rand(-0.08,0.08),stufen:i===tr.schuss-1?st:null}));
    } else if(tr.shape==='cylinder'){
      const v=distVol(o);
      emitters.push({t:3.2,k:'fountain',o,A:FW.gold,B:A});
      sfx.fizz(v);   /* danach rauscht das Klangbett der Fontaene (30.09.) */
      later(3.2,()=>shot(o,{pw:3,sz:tr.kal*1.2,eff:rz.eff,A,B,fuse:1.3,dick:1,stufen:st}));
    } else {
      for(let i=0;i<tr.schuss;i++) later(i*0.45,()=>
        shot(o,{pw:tr.kal>1.1?3:0,sz:tr.kal,eff:rz.eff,A,B,stufen:i===tr.schuss-1?st:null}));
    }
    return;
  }
  /* ----- Kugelbomben aus der Moerserbatterie ----- */
  if(sh==='shell'){
    const kal={kugel75:1,kugel100:2,kugel150:3,kugel200:4,kugel300:5}[kugelTyp(t)]||1;
    kugelbombe(o,kal);
    return;
  }
  /* Riesen-, Monster-, Flammen- und Sternfontaenen laufen seit dem 26.09.
     ueber FONT (14k-db-fontaenen.js, Tom: Anomalie) - oben in FONT[t].
     Fontaene ist Fontaene (Toms PDF vom 25.09.): keine Ladung, kein Komet. */
  /* Die Furzrakete fliegt seit dem 26.09. ueber den normalen Raketenweg
     (RAKETEN_KL.furzrakete): der Witz steckt im Aufstieg 'stotter'. */
  /* Wunderkerzen, Knallerbsen, Knallfrosch, Schwaermer, Tischfeuerwerk
     und alle Boeller laufen seit dem 26.09. (Tom: Anomalie) ueber die
     Drehbuecher KLEIN in 14l-db-klein.js (kleinZuenden, oben);
     Wasserfall und Vulkan ueber FONT (14k-db-fontaenen.js). */
  if(sh==='fountainset'){
    const [A,B]=scheme();
    emitters.push({t:8,k:'fountain',o,A:FW.gold,B:A});
    sfx.fizz(distVol(o));
    later(5,()=>{ emitters.push({t:5,k:'fountain',o,A:B,B:FW.weiss}); });
  }
  else if(sh==='rocketset'){
    const KL=RAKETEN_KL[t]||{n:3,gap:0.45,sz:0.95,pw:0,eff:null};
    for(let i=0;i<KL.n;i++) later(i*KL.gap,()=>{
      /* Farben: fest (A, B), aus dem Thema, oder je Zuendung weiter
         (farbRotation, Zaehler im Spielstand) */
      let AB=KL.A?[farbe(KL.A),farbe(KL.B)||farbe(KL.A)]:KL.th?themaPaar(KL.th,Math.floor(i/(KL.gruppe||1))):null;
      if(KL.farbRotation&&KL.farbRotation.length){ const Z=(typeof S!=='undefined'&&S)?(S.fwZaehler=S.fwZaehler||{}):(igniteType.zaehler=igniteType.zaehler||{});
        const z=Z[t]|0; Z[t]=z+1; const c=farbe(KL.farbRotation[z%KL.farbRotation.length])||FW.gold; AB=[c,AB?AB[1]:FW.weiss]; }
      const text=(it&&it.text)||KL.text||null;
      shot(o,{pw:KL.pw,sz:KL.sz,eff:KL.eff?KL.eff[i%KL.eff.length]:pick(EFF_GROSS),
        ...(AB?{A:AB[0],B:AB[1]}:{sc:-1}),
        pfeif:KL.pfeif||KL.steig==='pfeif',dick:KL.dick,trail:KL.trail?farbe(KL.trail):KL.dick&&!KL.steig?FW.weiss:undefined,fuse:KL.fuse,fest:true,
        steig:KL.steig,bruchOpt:KL.bruchOpt,ton:KL.ton,knall:KL.knall,text,kobana:KL.kobana,stehen:KL.stehen,C:farbe(KL.C),
        par:{art:KL.art,split:KL.split,modus:KL.modus,text,dreh:KL.dreh},
        /* ein Schuss, ein Bruch - keine Nachbrueche mehr (Toms PDF vom 25.09.) */
        stufen:null}); });
  }
  else if(sh==='battery'||sh==='fan'){
    /* Verbundfeuerwerk: Kaliber, Takt und Effektauswahl wachsen mit
       dem Produkt. Die grossen enden mit einem Schlussakkord. */
    const KL={batterie16 :{n:8, gap:0.30,sz:0.85,eff:EFF_KLEIN,faecher:false,finale:0},
              faecher    :{n:12,gap:0.20,sz:0.95,eff:EFF_KLEIN.concat(['spinne','saturn']),faecher:true,finale:0},
              batterie49 :{n:14,gap:0.20,sz:1.05,eff:EFF_GROSS,faecher:false,finale:3},
              batterie100:{n:20,gap:0.15,sz:1.20,eff:EFF_GROSS,faecher:true,finale:5},
              profi      :{n:28,gap:0.11,sz:1.45,eff:EFF_PRO,faecher:true,finale:8}}[t]
            ||{n:8,gap:0.3,sz:0.9,eff:EFF_KLEIN,faecher:false,finale:0};
    emitters.push({t:0.7,k:'fuse',o});
    const sc=Math.floor(Math.random()*24);
    for(let i=0;i<KL.n;i++) later(0.7+i*KL.gap,()=>{
      /* Faecherbatterien streuen ueber die Breite statt senkrecht */
      const ang=KL.faecher?(i/Math.max(1,KL.n-1)-0.5)*0.5:rand(-0.05,0.05);
      shot(o,{sz:KL.sz,eff:pick(KL.eff),ang,dir:KL.faecher?0:undefined,sc:sc});
    });
    /* Schlussakkord: mehrere Schuesse auf einmal */
    if(KL.finale) later(0.7+KL.n*KL.gap+0.35,()=>{
      for(let k=0;k<KL.finale;k++) later(k*0.05,()=>
        shot(o,{sz:KL.sz*1.25,eff:pick(k%3===0?['salut']:EFF_PRO),ang:rand(-0.22,0.22),sc:sc}));
    });
  }
}
/* Testzugang zur Feuerwerk-Engine v2 (Test engine3.js) */
window.__fwA={playShow,showNorm,showZeiten,showDauer,phPlan,shot,zielSchuss,zielTempo,steigHoehe,pwFuerHoehe,STEIG_ART,STEIG_FARBE,STEIG_KLANG,SCHUSS_EFF,
  kugelbombe,kugelSorte,KUGEL,FONT,FONT_EREIGNIS,fontPhasen,fontDauer,fontZeiten,fontPhasenListe,fontDuesenLage,oeffnungHalb,feuertopf,TOPF_SORTE,perleSchuss,showLoeschen,neuerShowTag,
  RAKETEN_KL,igniteType,EFF,SPEKTRUM_FW,BILD_FORM,get rockets(){return rockets},get emitters(){return emitters},get uhr(){return FW_UHR},
  fwLog:a=>{FW_LOG=a;},ps:()=>({psHuge,psBig,psMid,psSmall})};

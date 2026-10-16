/* =========================================================
   WERKBANK - eigene Batterien (Kapitel 5 "Eigene Marke")
   Tom, 16.10.2026 abends: "Man soll seine eigene Marke produzieren
   koennen: sein eigenes Feuerwerk aus den bestehenden Effekten bauen,
   extern produzieren lassen, es wird ganz normal geliefert wie jedes
   andere Produkt und man verkauft es selbst. NUR Batterien. Ein
   komplettes Bauprogramm: wie lang, welche Effekte, die Abfolge. Dazu
   eine kleine Vorsimulation. Dann gibt man den Namen, der wird auf das
   Produkt geschrieben. Maximal 5 eigene Batterien, gestaffelt nach
   Level ... am Ende eine Monsterbatterie mit ~500 Schuss. Gesteuert
   ueber eine WERKBANK im Lager, NICHT ueber den Laptop."
   Ersetzt das Entwicklungslabor (02d-rezeptur, Laptop "Entwicklung").

   Hier: Effekt-Katalog (was man verbauen darf), Entwurf (Abschnitte),
   Bewertung, Kalkulation (Zahlen nur aus WIRT.werkbank, 01c), das
   Drehbuch der Batterie (SHOWS - dieselbe Engine wie jede Batterie im
   Sortiment, gezuendet nur ueber 14z4), Produkt im Katalog, Serien-
   fertigung beim Lohnfertiger, Migration alter Rezepturen.
   Oberflaeche: 17h-werkbank.js, Werkbank in der Welt: 06c-werkbank.js.
   ========================================================= */

/* Bruchbilder mit Effektklasse (Kosten) und Wow (Effektwert). Was teuer
   aussieht, kostet auch im Einkauf. Erst was man selbst am Himmel gesehen
   hat, darf man verbauen (02c bruchGesehen). */
const BRUCH={
  kugel     :{name:'Peonie',          klasse:1, wow:1.00, desc:'Runde Farbkugel ohne Schweif. Der Grundstein jedes Sortiments.'},
  ring      :{name:'Ring',            klasse:1, wow:1.05, desc:'Flacher Ring, der sich quer zum Blick öffnet.'},
  knister   :{name:'Knisterkugel',    klasse:1, wow:1.08, desc:'Kugel mit prasselndem Silberknistern.'},
  fische    :{name:'Fische',          klasse:1, wow:1.02, desc:'Viele kleine Funken, die davonzappeln.'},
  kreisel   :{name:'Kreisel',         klasse:1, wow:1.06, desc:'Ring mit Drall, der sich beim Öffnen dreht.'},
  wechsel   :{name:'Farbwechsler',    klasse:2, wow:1.18, desc:'Startet in der ersten Farbe, endet in der zweiten.'},
  spinne    :{name:'Spinne',          klasse:2, wow:1.20, desc:'Harte, flache Strahlen wie Speichen.'},
  strobe    :{name:'Stroboskop',      klasse:2, wow:1.22, desc:'Blinkende Sterne, die lange am Himmel hängen.'},
  chrys     :{name:'Chrysantheme',    klasse:2, wow:1.25, desc:'Dichter Ball, jeder Stern zieht einen Schweif.'},
  stern     :{name:'Stern',           klasse:2, wow:1.24, desc:'Fünfzackiger Stern, gelegt aus einzelnen Sternen.'},
  herz      :{name:'Herz',            klasse:2, wow:1.26, desc:'Ein Herz am Himmel. Verkauft sich zu Hochzeiten von allein.'},
  doppelring:{name:'Doppelring',      klasse:2, wow:1.28, desc:'Zwei Ringe über Kreuz in zwei Farben.'},
  blink     :{name:'Blinksterne',     klasse:2, wow:1.20, desc:'Sterne, die lange blinkend am Himmel stehen.'},
  doppel    :{name:'Doppelbruch',     klasse:3, wow:1.44, desc:'Zwei Kugeln kurz nacheinander, in getauschten Farben.'},
  dreifach  :{name:'Dreifachbruch',   klasse:3, wow:1.58, desc:'Drei Brüche nacheinander in drei Farben.'},
  saturn    :{name:'Saturn',          klasse:3, wow:1.42, desc:'Ring mit einem Kern in der Mitte.'},
  blaetter  :{name:'Blätterfall',     klasse:3, wow:1.40, desc:'Große Sterne, die flackernd herunterschweben.'},
  dahlie    :{name:'Dahlie',          klasse:3, wow:1.46, desc:'Wenige, sehr große Sterne, die weit fliegen.'},
  crossette :{name:'Crossette',       klasse:3, wow:1.48, desc:'Kometen, die in der Luft vierfach aufplatzen.'},
  pistill   :{name:'Pistill',         klasse:3, wow:1.52, desc:'Außen ein Ball, innen ein zweiter in Gegenfarbe.'},
  geist     :{name:'Geisterschuss',   klasse:3, wow:1.55, desc:'Der ganze Ball läuft durch drei Farben.'},
  palme     :{name:'Palme',           klasse:3, wow:1.50, desc:'Wenige dicke Finger, die sich nach oben öffnen.'},
  weide     :{name:'Goldweide',       klasse:4, wow:1.70, desc:'Lange, tief hängende Goldschweife.'},
  brokat    :{name:'Brokat',          klasse:4, wow:1.74, desc:'Dichtes Goldnetz mit farbigem Kern.'},
  kamuro    :{name:'Kamuro',          klasse:4, wow:1.82, desc:'Dichte Goldglocke, die am Himmel stehen bleibt.'},
  zeitregen :{name:'Zeitregen',       klasse:4, wow:1.86, desc:'Große Sterne werfen ihren Glitzer in Wellen ab.'},
  salut     :{name:'Salut',           klasse:4, wow:1.64, desc:'Kein Bild, nur ein greller Blitz und ein harter Schlag.'},
  feuerrad  :{name:'Feuerrad',        klasse:2, wow:1.30, desc:'Ein Ring, der sich beim Aufgehen dreht und Spiralarme zieht.'},
  farbregen :{name:'Farbregen',       klasse:2, wow:1.28, desc:'Ein Schleier kleiner Sterne, der funkelnd herunterrieselt.'},
  flammenregen:{name:'Flammenregen',  klasse:3, wow:1.60, desc:'Große Flammen, die glühend herunterregnen und Tropfen verlieren.'},
  sternschnuppen:{name:'Sternschnuppen',klasse:4, wow:1.72, desc:'Wenige helle Köpfe mit langen Silberschweifen, flach nach außen.'},
  kronleuchter:{name:'Kronleuchter',  klasse:4, wow:1.80, desc:'Goldene Arme, an deren Enden Glitzertropfen hängen.'},
  spektrum  :{name:'Spektrum',        klasse:3, wow:1.62, desc:'Jeder Stern läuft einmal durch alle Farben des Regenbogens.'},
  goldglitzer:{name:'Goldglitzer',    klasse:3, wow:1.58, desc:'Goldsterne lassen blinkende Glitzervorhänge zurück.'}
};
const BRUCH_IDS=Object.keys(BRUCH);
/* Lichter: steigen direkt aus dem Rohr, ohne Zerleger (14m LICHTYP). Nur
   Typen mit genau einem Start je Rohr (Regel R2 "Loch = Schuss") - keine
   Faecher-, Zwillings- oder Drillingskometen. Freigeschaltet, sobald man
   den Typ einmal gesehen hat ('licht:name' in S.gesehen, 14m lichtSchuss). */
const WB_LICHT={
  goldkomet       :{name:'Goldkomet',        klasse:2, wow:1.30, desc:'Goldene Spitze mit langem Glitzerschweif.'},
  farbkomet       :{name:'Farbkomet',        klasse:2, wow:1.26, desc:'Farbiger Kopf mit farbigem Glitzerschweif.'},
  weidenkomet     :{name:'Weidenkomet',      klasse:3, wow:1.44, desc:'Goldkomet, dessen Schweif lange stehen bleibt und herabsinkt.'},
  crossette       :{name:'Kometen-Crossette',klasse:3, wow:1.46, desc:'Der Komet teilt sich vor dem Scheitel in ein Kreuz aus vier Kometen.'},
  farbcrossette   :{name:'Farbcrossette',    klasse:3, wow:1.52, desc:'Das Kreuz aus vier Kometen wechselt im Flug die Farbe.'},
  dreifachcrossette:{name:'Dreifach-Crossette',klasse:4,wow:1.66,desc:'Teilt sich in drei, jeder Ast noch einmal in zwei.'},
  glitzermine     :{name:'Glitzermine',      klasse:2, wow:1.22, desc:'Eine Säule aus Silberglitzer direkt aus dem Rohr.'},
  glitzergold     :{name:'Goldglitzermine',  klasse:2, wow:1.26, desc:'Dieselbe Säule in warmem Gold, etwas höher.'},
  bluetenmine     :{name:'Blütenmine',       klasse:2, wow:1.24, desc:'Ein Strauß Farbsterne, die oben die Farbe wechseln.'},
  bluetenkranz    :{name:'Blütenkranz',      klasse:3, wow:1.40, desc:'Die Sterne fliegen auf einem Kegelmantel – eine hohle Tulpe.'},
  bluetenglitzer  :{name:'Blütenglitzer',    klasse:3, wow:1.42, desc:'Farbsterne mit feinem Glitzerschweif.'},
  kometenkrone    :{name:'Kometenkrone',     klasse:4, wow:1.70, desc:'Goldkomet, oben breitet sich lautlos eine hängende Krone aus.'},
  farbkrone       :{name:'Farbkrone',        klasse:4, wow:1.68, desc:'Goldkomet, oben hängt eine Krone aus Farbsternen.'},
  blitzkrone      :{name:'Blitzkrone',       klasse:4, wow:1.72, desc:'Eine silberne Krone hängt waagerecht, ihre Spitzen blitzen.'},
  blitzpalme      :{name:'Blitzpalme',       klasse:4, wow:1.74, desc:'Acht schwere Goldarme sinken wie Palmwedel und blitzen.'}
};
/* Ein Effekt-Schluessel: 'chrys' (Bruchbild) oder 'licht:goldkomet' */
function wbEffekt(k){ if(!k) return null; if(k.indexOf('licht:')===0){ const L=WB_LICHT[k.slice(6)]; return L?Object.assign({art:'licht'},L):null; }
  return BRUCH[k]?Object.assign({art:'bruch'},BRUCH[k]):null; }
function bruchOffen(id){ return !!(S&&S.gesehen&&S.gesehen.indexOf(id)>=0&&wbEffekt(id)); }
/* alles Gesehene, was sich verbauen laesst: erst die Bruchbilder, dann die Lichter */
function bruchListe(){ return BRUCH_IDS.filter(bruchOffen).concat(Object.keys(WB_LICHT).map(k=>'licht:'+k).filter(bruchOffen)); }

/* Farben aus der Effekt-Palette (FW in 14-fireworks), mit Aufschlag fuer die seltenen */
const WB_FARBEN=[
  {id:'rot',name:'Rot',hex:'#ff2119',auf:0},        {id:'orange',name:'Orange',hex:'#ff7a10',auf:0},
  {id:'gold',name:'Gold',hex:'#ffcc38',auf:0},      {id:'zitrone',name:'Zitrone',hex:'#fff857',auf:0.04},
  {id:'limette',name:'Limette',hex:'#9eff33',auf:0.06},{id:'gruen',name:'Grün',hex:'#24ff47',auf:0.06},
  {id:'mint',name:'Mint',hex:'#5cffb3',auf:0.10},   {id:'tuerkis',name:'Türkis',hex:'#2ef5ff',auf:0.10},
  {id:'himmel',name:'Himmelblau',hex:'#5cb8ff',auf:0.12},{id:'blau',name:'Blau',hex:'#335cff',auf:0.16},
  {id:'violett',name:'Violett',hex:'#b34dff',auf:0.18},{id:'magenta',name:'Magenta',hex:'#ff33eb',auf:0.16},
  {id:'weiss',name:'Weiß',hex:'#ffffff',auf:0},     {id:'silber',name:'Silber',hex:'#d1e5ff',auf:0.06}
];
function farbVon(id){ return WB_FARBEN.find(f=>f.id===id)||WB_FARBEN[2]; }

/* Groessen: Masse und Kartonfuellung (Katalog wie bei jeder Batterie);
   Schuss, Kaliber, Level, Preise stehen in WIRT.werkbank.stufen (01c) */
const WB_STUFEN=[
  {name:'Kompakt', dims:[0.21,0.15,0.21],box:6,grid:[3,1,1],show:{pw:-3,  sz:0.85},hoeheM:24},
  {name:'Fächer',  dims:[0.40,0.22,0.27],box:4,grid:[3,1,1],show:{pw:-1.5,sz:0.95},hoeheM:26},
  {name:'Verbund', dims:[0.62,0.28,0.40],box:2,grid:[2,1,1],show:{pw:0,   sz:1.05},hoeheM:28},
  {name:'Großverbund',dims:[0.90,0.32,0.43],box:1,grid:[2,1,1],show:{pw:1.5,sz:1.15},hoeheM:30},
  {name:'Monster', dims:[0.98,0.50,0.62],box:1,grid:[2,1,1],show:{pw:2.5, sz:1.25},hoeheM:33}
];
function wbStufe(i){ return Object.assign({nr:i+1},WB_STUFEN[i],WIRT.werkbank.stufen[i],{box:wbBox(i)}); }
/* Stueck je Karton: so, wie die Kartonwahl (06-fixtures kartonWahl) sie fuer jede Batterie dieser Groesse festlegt -
   damit Serie (Mindestmenge in Kartons), Lieferung und Regal dieselbe Zahl kennen */
const _wbBox={};
function wbBox(i){ if(_wbBox[i]) return _wbBox[i]; const st=WB_STUFEN[i]; let b=st.box;
  if(typeof kartonWahl==='function'&&typeof SHELFKIND!=='undefined'){ const id='__wbbox'+i;
    P[id]={name:'',shape:'battery',cat:2,lvl:1,dims:st.dims.slice(),grid:st.grid.slice(),box:st.box};
    try{ kartonWahl(id); b=P[id].box||b; }catch(e){ b=st.box; } delete P[id]; }
  return _wbBox[i]=b; }
function wbStufeOffen(i){ const W=WIRT.werkbank.stufen[i]; return !!W&&!!S&&!!S.up[W.up]&&S.level>=W.lvl; }

/* Abfolge-Muster: wie die Rohre eines Abschnitts nacheinander zuenden.
   Die Richtung jedes Schusses kommt aus der Neigung seines Rohrs - die
   Werkbank verdrahtet die Rohre (Reihenfolge) und stellt sie schraeg wie
   bei echten Faecherbatterien (04c rohrLayout p.folgeVon, rohrNeigung p.rohrNeig). */
const WB_MUSTER={
  lr     :{name:'Links → rechts',  s:(i,n,k)=>-1+2*k},
  rl     :{name:'Rechts → links',  s:(i,n,k)=>1-2*k},
  faecher:{name:'Fächer',          s:(i,n)=>{ const st=1/Math.max(1,Math.ceil((n-1)/2)); return (i%2?1:-1)*Math.ceil(i/2)*st; }},
  z      :{name:'Zickzack (Z)',    s:(i,n,k)=>{ const x=k*1.5, f=x-Math.floor(x); return Math.floor(x)%2?1-2*f:-1+2*f; }},
  w      :{name:'W',               s:i=>[-1,1/3,-1/3,1][i%4]},
  salve  :{name:'V-Salve',         s:(i,n,k)=>(i%2?1:-1)*(0.35+0.65*k)},
  zufall :{name:'Zufällig',        s:(i,n,k,r)=>r*2-1},
  gerade :{name:'Senkrecht',       s:()=>0},
  finale :{name:'Finale (schnellstmöglich)',s:(i,n,k,r)=>(i%2?1:-1)*(0.25+0.75*r)}
};
/* Takt in Schuss je Sekunde: 0,2-0,4 s je Schuss (Tom 01.10., 04c ZUEND_MIN/MAX) */
const WB_TAKT=[5,4,3.3,2.5];
const WB_HOEHE=['tief','mittel','hoch'], WB_KAL=['klein','normal','groß'], WB_PAUSE=[0,1.5,3];
const WB_NEIG=0.32;   /* groesste Rohrneigung (rad), wie die Faecher im Sortiment (04c: Batterie 0,1-0,3, Faecher 0,3-0,6) */

/* ---------- Entwurf ---------- */
function wbAbschnitt(o){ return Object.assign({e:'kugel',A:'gold',B:'weiss',n:5,takt:2,muster:'lr',hoehe:1,kal:1,pause:0},o||{}); }
function wbEntwurfNeu(stufe){
  const W=WIRT.werkbank.stufen[stufe], N=W.schuss, eff=bruchListe(), e0=eff[0]||'kugel', e1=eff[1]||e0, e2=eff[2]||e1;
  const a=Math.round(N*0.4), b=Math.round(N*0.4);
  return {stufe,name:'',abschnitte:[
    wbAbschnitt({e:e0,A:'gold',B:'weiss',n:a,takt:3,muster:'lr',hoehe:1,kal:1,pause:1.5}),
    wbAbschnitt({e:e1,A:'rot',B:'gold',n:b,takt:2,muster:'z',hoehe:2,kal:1}),
    wbAbschnitt({e:e2,A:'gold',B:'blau',n:N-a-b,takt:0,muster:'finale',hoehe:2,kal:2})]};
}
function wbKopie(e){ return JSON.parse(JSON.stringify({stufe:e.stufe,name:e.name||'',abschnitte:e.abschnitte})); }
function wbSchuss(e){ return e.abschnitte.reduce((a,x)=>a+Math.max(0,x.n|0),0); }
function wbRest(e){ return WIRT.werkbank.stufen[e.stufe].schuss-wbSchuss(e); }
/* Abstand im Drehbuch, der nach 04c zuendAbstand den gewuenschten Takt ergibt */
function wbGap(takt){ const g=1/WB_TAKT[clamp(takt|0,0,WB_TAKT.length-1)]; return clamp((g-ZUEND_MIN)/(ZUEND_MAX-ZUEND_MIN),0,1)*0.6; }
function wbIntervall(x){ return x.muster==='finale'?ZUEND_MIN:1/WB_TAKT[clamp(x.takt|0,0,WB_TAKT.length-1)]; }
/* Dauer (s) wie zuendFolge (04c) sie plant: je Schuss der Takt des Abschnitts (0,2-0,4 s); zwischen zwei Abschnitten
   der Abstand im Drehbuch (Takt des vorigen + Pause) - ab VERZ_MIN als Verzoegerung (hoechstens 6 s), sonst wieder
   0,2-0,4 s; zum Schluss 0,6 s wie zuendPlan(t).dauer (= Angabe auf der Verpackung) */
function wbGapDreh(x){ return x.muster==='finale'?0:wbGap(x.takt); }
function wbDauer(e){ let t=0, vor=null;
  e.abschnitte.forEach(x=>{ const n=Math.max(0,x.n|0); if(!n) return;
    if(vor){ const d=wbGapDreh(vor)+(vor.pause||0); t+=d>=VERZ_MIN?Math.min(d,6):zuendAbstand(d); }
    t+=wbIntervall(x)*(n-1); vor=x; });
  return Math.round(t+0.6); }
function wbGueltig(e){
  if(!e||!e.abschnitte||!e.abschnitte.length||e.abschnitte.length>WB_MAX_ABSCHNITTE) return false;
  if(wbRest(e)!==0) return false;
  return e.abschnitte.every(x=>(x.n|0)>=1&&!!wbEffekt(x.e)&&!!WB_MUSTER[x.muster]); }
const WB_MAX_ABSCHNITTE=12;
/* Was fehlt noch? (Texte fuer die Oberflaeche) */
function wbMangel(e){
  const r=wbRest(e);
  if(r>0) return `Noch ${r} Schuss frei – verteile sie auf die Abschnitte.`;
  if(r<0) return `${-r} Schuss zu viel – die Batterie hat nur ${WIRT.werkbank.stufen[e.stufe].schuss} Rohre.`;
  const fremd=e.abschnitte.find(x=>!bruchOffen(x.e)); if(fremd) return `${(wbEffekt(fremd.e)||{name:fremd.e}).name}: diesen Effekt hast du noch nicht am Himmel gesehen.`;
  return ''; }

/* ---------- Bewertung: Effektwert, Abwechslung, Ablauf (0..1) ---------- */
function wbBewertung(e){
  const A=e.abschnitte.filter(x=>(x.n|0)>0), N=Math.max(1,wbSchuss(e));
  /* Effektwert: Wow je Schuss (1,0 Peonie ... 1,86 Zeitregen), groessere Kaliber wirken mehr */
  let w=0; A.forEach(x=>{ const f=wbEffekt(x.e)||{wow:1}; w+=(x.n|0)*(f.wow*(1+(x.kal-1)*0.08)); });
  const effekt=clamp((w/N-1.0)/0.86,0,1);
  /* Abwechslung: verschiedene Effekte, Farbpaare, Muster; ein Abschnitt mit mehr als 60 % ist eintoenig */
  const anz=a=>new Set(a).size;
  const dE=anz(A.map(x=>x.e)), dF=anz(A.map(x=>x.A+'|'+x.B)), dM=anz(A.map(x=>x.muster));
  const groesster=Math.max(...A.map(x=>(x.n|0)))/N;
  const ziel=Math.min(4,1+Math.floor(N/20));      /* bei 25 Schuss reichen 2 Effekte, ab 60 Schuss 4 */
  let abw=0.5*clamp((dE-1)/Math.max(1,ziel-1),0,1)+0.25*clamp((dF-1)/2,0,1)+0.25*clamp((dM-1)/2,0,1);
  abw*=1-clamp(groesster-0.6,0,0.4);
  /* Ablauf: Finale am Ende, Steigerung, Tempo- oder Pausenwechsel, sinnvolle Abschnitte */
  const letzt=A[A.length-1], schnell=x=>x.muster==='finale'||(x.takt|0)<=1;
  const finale=letzt&&A.length>1&&schnell(letzt)&&(letzt.n|0)>=Math.max(3,N*0.08)?1:0;
  const stark=x=>(x.kal|0)+(x.hoehe|0)+(wbEffekt(x.e)||{klasse:1}).klasse*0.5;
  const drittel=k=>{ let s=0,c=0,acc=0; A.forEach(x=>{ const m=acc+(x.n|0)/2; acc+=(x.n|0); if(Math.floor(m/N*3)===k){ s+=stark(x)*(x.n|0); c+=(x.n|0); } }); return c?s/c:null; };
  const d0=drittel(0), d2=drittel(2);
  const steig=d0!==null&&d2!==null?(d2>d0?1:d2===d0?0.4:0):0.4;
  const tempo=anz(A.map(x=>x.muster==='finale'?-1:x.takt|0))>1||A.some(x=>x.pause>0)?1:0;
  const kurz=A.filter(x=>(x.n|0)<3).length, laenge=A.length>=2?clamp(1-kurz*0.25,0,1):0.3;
  const ablauf=0.35*finale+0.25*steig+0.2*tempo+0.2*laenge;
  const B=WIRT.werkbank.bewertung, ges=clamp(B.effekt*effekt+B.abwechslung*abw+B.ablauf*ablauf,0,1);
  return {effekt,abwechslung:abw,ablauf,gesamt:ges,sterne:Math.round((1+4*ges)*2)/2,finale:!!finale,steigerung:steig>=1,tempo:!!tempo}; }

/* ---------- Kalkulation (nur WIRT.werkbank) ---------- */
function wbStueckkosten(e){
  const W=WIRT.werkbank, st=W.stufen[e.stufe], K=W.kosten;
  let c=st.verpackung;
  e.abschnitte.forEach(x=>{ const f=wbEffekt(x.e)||{klasse:1}, fa=farbVon(x.A), fb=farbVon(x.B);
    c+=(x.n|0)*st.jeSchuss*K.klasse[clamp(f.klasse-1,0,3)]*K.kaliber[clamp(x.kal|0,0,2)]*K.hoehe[clamp(x.hoehe|0,0,2)]*(1+(fa.auf+fb.auf)*K.farbAuf);
    c+=K.abschnitt; });
  return r2(c); }
function wbMarkt(e,b){ const W=WIRT.werkbank; b=b||wbBewertung(e); return r2(W.stufen[e.stufe].ref*(W.markt.grund+W.markt.spanne*b.gesamt)); }
function wbGewicht(e,b){ const W=WIRT.werkbank; b=b||wbBewertung(e); return +(W.stufen[e.stufe].gewicht*(W.nachfrage.grund+W.nachfrage.spanne*b.gesamt)).toFixed(2); }
function wbHype(e,b){ const W=WIRT.werkbank; b=b||wbBewertung(e); return Math.round(W.stufen[e.stufe].hype*(W.hypeF.grund+W.hypeF.spanne*b.gesamt)); }
function wbEntwicklung(e){ const W=WIRT.werkbank; return Math.round(W.stufen[e.stufe].entwicklung+e.abschnitte.length*W.kosten.entwicklungJeAbschnitt); }
function wbMindestStueck(stufe){ return WIRT.werkbank.stufen[stufe].mindest*wbBox(stufe); }
/* Serie: n Kartons, Rabatt ab Vielfachen der Mindestmenge, Vorkasse */
function wbRabatt(stufe,kartons){ const m=WIRT.werkbank.stufen[stufe].mindest; let d=0; for(const r of WIRT.werkbank.rabatt) if(kartons>=m*r.ab) d=r.d; return d; }
function wbSerie(e,kartons){ const stk=kartons*wbBox(e.stufe), d=wbRabatt(e.stufe,kartons);
  return {kartons,stueck:stk,rabatt:d,preis:r2(stk*e.cost*(1-d)),tage:WIRT.werkbank.stufen[e.stufe].liefertage}; }
/* Break-even: so viele Stueck, bis die Entwicklung wieder drin ist */
function wbBreakEven(e,preis){ const db=(preis||e.market)-e.cost; return db>0?Math.ceil(e.entw/db):Infinity; }

/* ---------- Drehbuch: die Abschnitte als Phasen der Batterie-Engine (14b) ---------- */
function wbShow(e){
  const st=WB_STUFEN[e.stufe], ph=[];
  e.abschnitte.forEach(x=>{ const n=x.n|0; if(n<=0) return; const f=wbEffekt(x.e)||{art:'bruch'};
    const p={n,gap:wbGapDreh(x),A:x.A,B:x.B,pw:[-3,0,3][clamp(x.hoehe|0,0,2)],sz:[0.82,1,1.18][clamp(x.kal|0,0,2)],pause:x.pause||0};
    if(f.art==='licht') p.licht=x.e.slice(6); else p.eff=x.e;
    ph.push(p); });
  return show({basis:{pw:st.show.pw,sz:st.show.sz,th:null},rampe:{kurve:'flach'},verzoegerung:true},ph);
}
/* Verdrahtung: jeder Abschnitt bekommt die naechsten Rohrreihen (vorn beginnend), darin zuendet Schuss i
   das freie Rohr, dessen Lage am besten zu seinem Musterwinkel passt; das Rohr steht in genau diesem
   Winkel (rohrNeig). So laeuft ein Faecher wirklich von links nach rechts ueber die Batterie. */
function wbVerdrahtung(e,rohre){
  const xs=rohre.map(r=>r.x), x0=Math.min(...xs), x1=Math.max(...xs), mitte=(x0+x1)/2, halb=Math.max(1e-6,(x1-x0)/2);
  const reihe=rohre.map((r,i)=>i).sort((a,b)=>rohre[a].row-rohre[b].row||rohre[a].col-rohre[b].col);
  const folge=[], neig=new Array(rohre.length).fill(0); let pos=0;
  rohrSaat(saatZahl((e.id||'wb')+':draht'),()=>{
    e.abschnitte.forEach(x=>{ const n=x.n|0; if(n<=0) return; const M=WB_MUSTER[x.muster]||WB_MUSTER.lr;
      const frei=reihe.slice(pos,pos+n); pos+=n;
      for(let i=0;i<n&&frei.length;i++){ const k=n>1?i/(n-1):0.5, s=clamp(M.s(i,n,k,Math.random()),-1,1);
        let bi=0, bd=1e9; frei.forEach((ri,j)=>{ const d=Math.abs((rohre[ri].x-mitte)/halb-s); if(d<bd){ bd=d; bi=j; } });
        const ri=frei.splice(bi,1)[0]; folge.push(ri); neig[ri]=-s*WB_NEIG*(x.muster==='finale'?1.1:1); } }); });
  /* Restrohre (sollte bei gueltigem Entwurf nicht vorkommen) */
  reihe.forEach(ri=>{ if(folge.indexOf(ri)<0) folge.push(ri); });
  return {folge,neig};
}

/* ---------- Produkt im Katalog ---------- */
function wbId(){ return 'wb_'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36); }
/* Verpackungsfarben aus den ersten beiden Abschnitten (Hausmarke, 04d DESIGN_FRONT.hausmarke) */
function wbArt(e){ const a=e.abschnitte[0]||{A:'gold',B:'weiss'}, b=e.abschnitte[1]||a, st=wbStufe(e.stufe);
  return {title:String(e.name||'').toUpperCase().slice(0,22),sub:`${st.schuss} Schuss · ${(wbEffekt(a.e)||{name:''}).name}`,
    bg1:'#141c3a',bg2:'#05070f',ac:farbVon(a.A).hex,ac2:farbVon(b.A===a.A?b.B:b.A).hex,hausmarke:true}; }
function wbProdukt(e){
  const st=wbStufe(e.stufe);
  const effekte=[...new Set(e.abschnitte.map(x=>(wbEffekt(x.e)||{name:x.e}).name))];
  return {name:e.name, short:e.name.length>16?e.name.slice(0,15)+'.':e.name,
    cat:2, lvl:1, shape:'battery', dims:st.dims.slice(), grid:st.grid.slice(), box:wbBox(e.stufe),
    cost:e.cost, market:e.market, weight:e.weight, hype:e.hype, risk:7, kal:st.kal, hoeheM:st.hoeheM,
    eigen:true, gruppe:'eigene', werk:e,
    folgeVon:(rohre)=>{ const v=wbVerdrahtung(e,rohre); e._neig=v.neig; return v.folge; },
    rohrNeig:k=>(e._neig&&e._neig[k])||0,
    desc:`Eigene Marke · ${st.schuss} Schuss, ${st.kal} mm · ${e.abschnitte.length} Abschnitte: ${effekte.join(', ')}.`,
    art:wbArt(e)};
}
/* Ins Sortiment heben (beim Entwickeln und beim Laden) */
function wbEintragen(e){
  if(P[e.id]) return P[e.id];
  P[e.id]=wbProdukt(e);
  SHOWS[e.id]=()=>wbShow(e);
  if(typeof _artId!=='undefined') _artId=null;   /* 04d: Verpackungsbild findet das neue Produkt */
  if(typeof kartonWahl==='function') kartonWahl(e.id);
  if(ORDER.indexOf(e.id)<0) ORDER.push(e.id);
  VOLA[e.id]=WIRT.werkbank.vola;
  if(!(S.prices[e.id]>0)) S.prices[e.id]=P[e.id].market;
  if(S.mi&&typeof S.mi[e.id]!=='number'){ S.mi[e.id]=1; S.me[e.id]=1; S.reg[e.id]=regimeNeu(e.id); S.mh[e.id]=[1]; }
  return P[e.id];
}
function eigeneListe(){ return (S&&S.eigene)||[]; }
function eigeneAlleEintragen(){ eigeneListe().forEach(wbEintragen); (S.eigeneAlt||[]).forEach(wbAltEintragen); }

/* Entwickeln: Entwicklung bezahlen, Produkt anlegen, erste Serie (Mindestmenge) bestellen.
   Rueckgabe {ok, grund, e}. */
function wbEntwickeln(entwurf,kartons,preis){
  if(!S.up.labor) return {ok:false,grund:'Noch keine Werkbank.'};
  if(eigeneListe().length>=WIRT.werkbank.slots) return {ok:false,grund:`Höchstens ${WIRT.werkbank.slots} eigene Batterien – lösche erst eine.`};
  if(!wbStufeOffen(entwurf.stufe)) return {ok:false,grund:'Diese Größe ist noch nicht freigeschaltet.'};
  if(!wbGueltig(entwurf)) return {ok:false,grund:wbMangel(entwurf)||'Der Entwurf ist noch nicht fertig.'};
  const m=wbMangel(entwurf); if(m) return {ok:false,grund:m};
  const name=String(entwurf.name||'').trim().slice(0,22);
  if(!name) return {ok:false,grund:'Gib der Batterie einen Namen – er kommt auf die Verpackung.'};
  if(eigeneListe().some(x=>x.name.toLowerCase()===name.toLowerCase())) return {ok:false,grund:'Diesen Namen hat schon eine deiner Batterien.'};
  const e={id:wbId(),stufe:entwurf.stufe,name,abschnitte:JSON.parse(JSON.stringify(entwurf.abschnitte)),tag:S.day,serien:[]};
  const b=wbBewertung(e);
  e.cost=wbStueckkosten(e); e.market=wbMarkt(e,b); e.weight=wbGewicht(e,b); e.hype=wbHype(e,b); e.sterne=b.sterne; e.entw=wbEntwicklung(e);
  const mind=WIRT.werkbank.stufen[e.stufe].mindest; kartons=Math.max(mind,kartons|0||mind);
  const se=wbSerie(e,kartons), summe=r2(e.entw+se.preis);
  if(S.money<summe) return {ok:false,grund:`Entwicklung und erste Serie kosten ${eur(summe)} – dir fehlen ${eur(r2(summe-S.money))}.`};
  S.money=r2(S.money-summe); DS.upgrades=r2(DS.upgrades+e.entw); DS.goods=r2(DS.goods+se.preis);
  S.eigene=eigeneListe().concat(e);
  wbEintragen(e);
  if(preis>0) S.prices[e.id]=r2(preis);
  e.serien.push({kartons,rest:se.tage,preis:se.preis});
  statAdd('eigene',1); addXP(WIRT.xp.eigeneBatterie,'Eigene Batterie');
  save();
  return {ok:true,e,serie:se,summe};
}
/* Nachbestellen: weitere Serie zum Stueckpreis, Mindestmenge, Lieferung nach Tagen */
function wbNachbestellen(id,kartons){
  const e=eigeneListe().find(x=>x.id===id); if(!e) return {ok:false,grund:'Unbekannte Batterie.'};
  const mind=WIRT.werkbank.stufen[e.stufe].mindest; kartons=Math.max(mind,kartons|0);
  const se=wbSerie(e,kartons);
  if(verfuegbar()<se.preis) return {ok:false,grund:`Die Serie kostet ${eur(se.preis)} – dir fehlen ${eur(r2(se.preis-verfuegbar()))}.`};
  S.money=r2(S.money-se.preis); DS.goods=r2(DS.goods+se.preis);
  e.serien.push({kartons,rest:se.tage,preis:se.preis});
  save();
  return {ok:true,serie:se};
}
function wbUnterwegs(e){ return (e.serien||[]).reduce((a,s)=>a+s.kartons,0); }
/* Loeschen: der Platz wird frei; was im Laden liegt, bleibt verkaufbar (Altbestand), offene Serien verfallen nicht -
   darum nur ohne offene Serie */
function wbLoeschen(id){
  const e=eigeneListe().find(x=>x.id===id); if(!e) return {ok:false};
  if(wbUnterwegs(e)) return {ok:false,grund:'Es ist noch eine Serie unterwegs – erst nach der Lieferung löschen.'};
  S.eigene=eigeneListe().filter(x=>x!==e);
  if(stockOf(id)>0) wbAltMerken(e.id,P[e.id]);
  else { const i=ORDER.indexOf(id); if(i>=0) ORDER.splice(i,1); }
  save(); return {ok:true}; }

/* Taeglich (16-day): Serien zaehlen herunter; fertige gehen als ganz normale Lieferung auf den Weg */
function wbTick(){
  let n=0;
  eigeneListe().forEach(e=>{ (e.serien||[]).forEach(s=>{ s.rest--; });
    const fertig=(e.serien||[]).filter(s=>s.rest<=0); if(!fertig.length) return;
    e.serien=e.serien.filter(s=>s.rest>0);
    const k=fertig.reduce((a,s)=>a+s.kartons,0);
    for(let i=0;i<k;i++) pending.push({type:e.id,t:lieferSek()+i*0.01,q:1,sup:'fachhandel'});
    n+=k; toast(`${e.name}: ${k} Karton${k===1?'':'s'} aus der Fertigung – kommt mit dem nächsten LKW.`,'money'); });
  wbAltAufraeumen();
  return n;
}

/* ---------- Altbestand: geloeschte Batterien und alte Rezepturen (Raketen, Kugeln, Fontaenen) ----------
   Die Ware bleibt verkaufbar, bis sie weg ist; nachbestellen geht nicht mehr. */
function wbAltMerken(id,p){ if(!p) return; S.eigeneAlt=(S.eigeneAlt||[]).filter(a=>a.id!==id);
  const q={id,name:p.name,shape:p.shape,dims:p.dims,grid:p.grid,box:p.box,cost:p.cost,market:p.market,art:p.art,
    werk:p.werk?JSON.parse(JSON.stringify(p.werk,(k,v)=>k==='_neig'?undefined:v)):null};
  S.eigeneAlt.push(q); P[id]=wbAltProdukt(q); }
function wbAltProdukt(a){ const p=a.werk?wbProdukt(a.werk):{shape:a.shape,dims:a.dims,grid:a.grid,box:a.box,art:a.art,hype:20,risk:6,cat:2,lvl:1,eigen:true,gruppe:'eigene'};
  return Object.assign(p,{name:a.name,short:a.name.length>16?a.name.slice(0,15)+'.':a.name,cost:a.cost,market:a.market,weight:2,noOrder:true,alt:true,
    desc:'Restbestand der eigenen Marke – wird nicht mehr gefertigt.'}); }
function wbAltEintragen(a){ if(P[a.id]) return; P[a.id]=wbAltProdukt(a); if(a.werk) SHOWS[a.id]=()=>wbShow(a.werk); if(typeof _artId!=='undefined') _artId=null;
  if(typeof kartonWahl==='function') kartonWahl(a.id); if(ORDER.indexOf(a.id)<0) ORDER.push(a.id); VOLA[a.id]=WIRT.werkbank.vola;
  if(!(S.prices[a.id]>0)) S.prices[a.id]=a.market;
  if(S.mi&&typeof S.mi[a.id]!=='number'){ S.mi[a.id]=1; S.me[a.id]=1; S.reg[a.id]=regimeNeu(a.id); S.mh[a.id]=[1]; } }
function wbAltAufraeumen(){ const weg=(S.eigeneAlt||[]).filter(a=>stockOf(a.id)<=0&&!(S.carrying&&S.carrying.type===a.id));
  if(!weg.length) return; S.eigeneAlt=S.eigeneAlt.filter(a=>weg.indexOf(a)<0);
  weg.forEach(a=>{ const i=ORDER.indexOf(a.id); if(i>=0) ORDER.splice(i,1); }); }

/* ---------- Migration (Laden eines alten Spielstands, 18-save) ----------
   Labor -> Werkbank: Batterie-Rezepturen werden eigene Batterien der Stufe 1 (25 Schuss statt 12), mit
   ihrem Bruchbild und ihren Farben; Raketen-, Kugel- und Fontaenen-Rezepturen entfallen, ihr Bestand bleibt
   als Altbestand verkaufbar. Die alte "zweite Zuendstufe" (labor2) ist jetzt die 60-Schuss-Stufe: die
   Differenz zum damaligen Preis kommt zurueck. Einmalige Meldung. */
const WB_ALT_TRAEGER={rakete3:{shape:'rocketset',dims:[0.42,0.055,0.11],grid:[4,2,2],box:8},rakete5:{shape:'rocketset',dims:[0.48,0.065,0.145],grid:[3,2,2],box:6},
  kugel75:{shape:'shell',dims:[0.09,0.115,0.09],grid:[8,2,1],box:8},kugel100:{shape:'shell',dims:[0.12,0.15,0.12],grid:[6,2,1],box:6},fontaene:{shape:'cylinder',dims:[0.145,0.34,0.145],grid:[7,2,1],box:6}};
function wbMigration(){
  const alt=(Array.isArray(S.eigene)?S.eigene:[]).filter(x=>x&&x.id&&x.traeger);
  if(!alt.length&&!S.up.labor2_alt) return null;
  const neu=(Array.isArray(S.eigene)?S.eigene:[]).filter(x=>x&&x.id&&x.abschnitte);
  let bat=0, weg=0;
  for(const r of alt){
    if(r.traeger==='batterie'&&neu.length<WIRT.werkbank.slots){
      const N=WIRT.werkbank.stufen[0].schuss, eff=BRUCH[r.eff]?r.eff:'kugel', a=Math.round(N*0.6);
      const e={id:r.id,stufe:0,name:String(r.name||'Eigenmarke').slice(0,22),tag:S.day,serien:[],migriert:true,
        abschnitte:[wbAbschnitt({e:eff,A:r.A||'gold',B:r.B||'weiss',n:a,takt:2,muster:'lr',hoehe:1,kal:1}),
                    wbAbschnitt({e:BRUCH[r.eff2]?r.eff2:eff,A:r.B||'weiss',B:r.A||'gold',n:N-a,takt:0,muster:'finale',hoehe:2,kal:2})]};
      const b=wbBewertung(e); e.cost=wbStueckkosten(e); e.market=wbMarkt(e,b); e.weight=wbGewicht(e,b); e.hype=wbHype(e,b); e.sterne=b.sterne; e.entw=0;
      neu.push(e); bat++;
    } else {
      const T=WB_ALT_TRAEGER[r.traeger]||WB_ALT_TRAEGER.rakete3;
      S.eigeneAlt=(S.eigeneAlt||[]).filter(a=>a.id!==r.id).concat({id:r.id,name:String(r.name||'Eigenmarke'),shape:T.shape,dims:T.dims,grid:T.grid,box:T.box,cost:r.cost||1,market:r.market||2,
        art:{title:String(r.name||'').toUpperCase().slice(0,18),sub:'Eigene Marke',bg1:'#1b2340',bg2:'#070c1c',ac:'#ffd23f',ac2:'#ff7a3d'},werk:null});
      weg++; }
  }
  S.eigene=neu;
  let erst=0;
  if(S.up.labor2_alt){ erst=r2(Math.max(0,WIRT.historie.erstattung.labor2-WIRT.ausbau.preis.labor2)); S.money=r2(S.money+erst); delete S.up.labor2_alt; }
  return {bat,weg,erst};
}
function wbMigrationText(m){ if(!m) return '';
  const t=[]; if(m.bat) t.push(`${m.bat} Batterie-Rezeptur${m.bat===1?' ist jetzt eine eigene Batterie':'en sind jetzt eigene Batterien'} (25 Schuss)`);
  if(m.weg) t.push(`${m.weg} Raketen-, Kugel- oder Fontänen-Rezeptur${m.weg===1?'':'en'} gibt es nicht mehr – der Bestand bleibt verkaufbar`);
  if(m.erst) t.push(`die alte zweite Zündstufe ist jetzt die 60-Schuss-Stufe, ${eur(m.erst)} kommen zurück`);
  return 'Aus dem Labor wird die Werkbank im Lager: '+t.join('; ')+'.'; }

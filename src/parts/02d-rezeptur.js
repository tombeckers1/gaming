/* =========================================================
   Eigene Rezeptur.
   Kein Knoteneditor, sondern fuenf Auswahlfelder: Traeger,
   Bruchbild, zwei Farben und optional eine zweite Stufe.
   Jeder Wert darin existiert im Spiel schon als Funktion,
   das Rezept sagt nur, welche davon kombiniert werden.
   ========================================================= */

/* Traeger: bestimmt Form, Regalmass, Station und Grundpreis */
const TRAEGER=[
  {id:'rakete3',  name:'Raketenset, 3 Stück', shape:'rocketset', lvl:25, req:'klassiker',
   dims:[0.42,0.055,0.11], grid:[4,2,2], box:8,  basis:2.2, kal:0.95, schuss:3,  zeit:2,
   desc:'Drei Raketen am Stab. Der Klassiker zum Einstieg in die eigene Marke.'},
  {id:'rakete5',  name:'Raketenset, 5 Stück', shape:'rocketset', lvl:26, req:'himmel',
   dims:[0.48,0.065,0.145],grid:[3,2,2], box:6,  basis:4.4, kal:1.30, schuss:5,  zeit:3,
   desc:'Fünf große Raketen. Mehr Kaliber, größerer Bruch.'},
  {id:'batterie', name:'Batterie, 25 Schuss', shape:'battery',  lvl:27, req:'verbund',
   dims:[0.24,0.20,0.24], grid:[7,1,1], box:7,  basis:7.5, kal:1.05, schuss:12, zeit:3,
   desc:'Ein Verbund, der von allein durchläuft. Zwölf sichtbare Schüsse.'},
  {id:'kugel75',  name:'Kugelbombe, 75 mm',   shape:'shell',    lvl:28, req:'verbund',
   dims:[0.09,0.115,0.09],grid:[8,2,1], box:8,  basis:5.0, kal:1.25, schuss:1,  zeit:4,
   desc:'Eine Kugel, ein Aufstieg, ein großer Bruch. Gehört in die Mörserbatterie.'},
  {id:'kugel100', name:'Kugelbombe, 100 mm',  shape:'shell',    lvl:30, req:'import',
   dims:[0.12,0.15,0.12], grid:[6,2,1], box:6,  basis:10.5,kal:1.60, schuss:1,  zeit:5,
   desc:'Schwereres Kaliber mit Tochterbrüchen. Das Aushängeschild einer Marke.'},
  {id:'fontaene', name:'Bodenfontäne',        shape:'cylinder', lvl:25, req:'himmel',
   dims:[0.145,0.34,0.145],grid:[7,2,1],box:6,  basis:3.4, kal:0.80, schuss:1,  zeit:2,
   desc:'Läuft am Boden und schickt zum Schluss einen Kometen nach oben.'}
];
function traegerVon(id){ return TRAEGER.find(t=>t.id===id)||TRAEGER[0]; }
function traegerOffen(t){
  if(S.level<t.lvl) return false;
  return !t.req||hatLizenz(t.req);
}

/* Bruchbilder mit Preisklasse. Was teuer aussieht, kostet auch
   im Einkauf - sonst baut sich jeder in fuenf Minuten das
   perfekte Produkt zusammen. */
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
  blink     :{name:'Blinksterne',      klasse:2, wow:1.20, desc:'Sterne, die lange blinkend am Himmel stehen.'},
  doppel    :{name:'Doppelbruch',      klasse:3, wow:1.44, desc:'Zwei Kugeln kurz nacheinander, in getauschten Farben.'},
  dreifach  :{name:'Dreifachbruch',    klasse:3, wow:1.58, desc:'Drei Brüche nacheinander in drei Farben.'},
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
  /* neu am 24.09. */
  feuerrad  :{name:'Feuerrad',        klasse:2, wow:1.30, desc:'Ein Ring, der sich beim Aufgehen dreht und Spiralarme zieht.'},
  farbregen :{name:'Farbregen',       klasse:2, wow:1.28, desc:'Ein Schleier kleiner Sterne, der funkelnd herunterrieselt.'},
  flammenregen:{name:'Flammenregen',  klasse:3, wow:1.60, desc:'Große Flammen, die glühend herunterregnen und Tropfen verlieren.'},
  sternschnuppen:{name:'Sternschnuppen',klasse:4, wow:1.72, desc:'Wenige helle Köpfe mit langen Silberschweifen, flach nach außen.'},
  kronleuchter:{name:'Kronleuchter',  klasse:4, wow:1.80, desc:'Goldene Arme, an deren Enden Glitzertropfen hängen.'}
};
const BRUCH_IDS=Object.keys(BRUCH);
/* Erst was man selbst gesehen hat, darf man verbauen */
function bruchOffen(id){ return !!(S&&S.gesehen&&S.gesehen.indexOf(id)>=0); }
function bruchListe(){ return BRUCH_IDS.filter(bruchOffen); }

/* Farben aus der vorhandenen Palette, mit Aufschlag fuer die seltenen */
const REZ_FARBEN=[
  {id:'rot',name:'Rot',hex:'#ff2119',auf:0},        {id:'orange',name:'Orange',hex:'#ff7a10',auf:0},
  {id:'gold',name:'Gold',hex:'#ffcc38',auf:0},      {id:'zitrone',name:'Zitrone',hex:'#fff857',auf:0.04},
  {id:'limette',name:'Limette',hex:'#9eff33',auf:0.06},{id:'gruen',name:'Grün',hex:'#24ff47',auf:0.06},
  {id:'mint',name:'Mint',hex:'#5cffb3',auf:0.10},   {id:'tuerkis',name:'Türkis',hex:'#2ef5ff',auf:0.10},
  {id:'himmel',name:'Himmelblau',hex:'#5cb8ff',auf:0.12},{id:'blau',name:'Blau',hex:'#335cff',auf:0.16},
  {id:'indigo',name:'Indigo',hex:'#7052ff',auf:0.18},{id:'violett',name:'Violett',hex:'#b34dff',auf:0.18},
  {id:'magenta',name:'Magenta',hex:'#ff33eb',auf:0.16},{id:'rose',name:'Rosé',hex:'#ff75bd',auf:0.12},
  {id:'weiss',name:'Weiß',hex:'#ffffff',auf:0},     {id:'silber',name:'Silber',hex:'#d1e5ff',auf:0.06},
  {id:'pfirsich',name:'Pfirsich',hex:'#ffb88c',auf:0.08},{id:'aqua',name:'Aqua',hex:'#40ffe0',auf:0.12}
];
function farbVon(id){ return REZ_FARBEN.find(f=>f.id===id)||REZ_FARBEN[0]; }

/* Etikettenstile fuer das Modell im Regal */
const ETIKETT=[
  {id:'klassik',name:'Klassisch',bg1:'#1b2340',bg2:'#070c1c',ac:'#ffd23f',ac2:'#ff7a3d'},
  {id:'gold',   name:'Goldrand', bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true},
  {id:'neon',   name:'Neon',     bg1:'#1a0b2e',bg2:'#050109',ac:'#5cff9e',ac2:'#ff4fd8'},
  {id:'kraft',  name:'Kraftpapier',bg1:'#c9a978',bg2:'#8a7350',ac:'#8a2f28',ac2:'#1b1b1b',light:true},
  {id:'stahl',  name:'Industrie',bg1:'#2a2f3d',bg2:'#0b0d14',ac:'#ff7a3d',ac2:'#d1e5ff'}
];
function etikettVon(id){ return ETIKETT.find(e=>e.id===id)||ETIKETT[0]; }

/* --------------------------------------------------------
   Die Formel. Sie muss stimmen, sonst bastelt sich jeder das
   perfekte Produkt: Der Verkaufswert folgt aus den Bestandteilen,
   und teuer aussehende Effekte haben teure Bestandteile.
   -------------------------------------------------------- */
function rezeptWow(r){
  const tr=traegerVon(r.traeger);
  const b=BRUCH[r.eff]||BRUCH.kugel;
  let w=b.wow*tr.kal*(0.85+Math.log2(1+tr.schuss)*0.24);
  /* Zwei verschiedene Farben wirken staerker als eine */
  if(r.A!==r.B) w*=1.06;
  const fa=farbVon(r.A), fb=farbVon(r.B);
  w*=1+(fa.auf+fb.auf)*0.5;
  /* Eine zweite Stufe ist der groesste einzelne Sprung */
  if(r.eff2){ const b2=BRUCH[r.eff2]||BRUCH.kugel; w*=1.18+b2.wow*0.14; }
  return w;
}
function rezeptKosten(r){
  const tr=traegerVon(r.traeger);
  const b=BRUCH[r.eff]||BRUCH.kugel;
  const fa=farbVon(r.A), fb=farbVon(r.B);
  let c=tr.basis*(0.72+b.klasse*0.19)*(1+(fa.auf+fb.auf)*0.62);
  if(r.eff2){ const b2=BRUCH[r.eff2]||BRUCH.kugel; c*=1.22+b2.klasse*0.06; }
  return r2(c);
}
/* Der Marktpreis ergibt sich aus dem Wow-Wert, nicht aus freier Eingabe */
function rezeptMarkt(r){
  const k=rezeptKosten(r), w=rezeptWow(r);
  return r2(k*(1.75+w*0.42));
}
function rezeptHype(r){ return Math.round(rezeptWow(r)*traegerVon(r.traeger).schuss*3.2+6); }
function rezeptDauer(r){ return traegerVon(r.traeger).zeit+(r.eff2?1:0); }
/* Einmalige Entwicklungskosten: der Deckel gegen Durchprobieren */
function rezeptEntwicklung(r){
  const tr=traegerVon(r.traeger);
  return Math.round((320+tr.basis*95)*(1+(BRUCH[r.eff]||BRUCH.kugel).klasse*0.22)*(r.eff2?1.45:1));
}
function rezeptGueltig(r){
  if(!r||!r.traeger||!r.eff) return false;
  if(!traegerOffen(traegerVon(r.traeger))) return false;
  if(!bruchOffen(r.eff)) return false;
  if(r.eff2&&!bruchOffen(r.eff2)) return false;
  return true;
}

/* --------------------------------------------------------
   Aus einem Rezept wird ein echtes Produkt. Danach laeuft es
   durch dieselbe Maschinerie wie jede Kaufware: bestellen,
   einraeumen, verkaufen, zuenden.
   -------------------------------------------------------- */
function eigenId(n){ return 'eigen'+n; }
function rezeptProdukt(e){
  const tr=traegerVon(e.traeger);
  const et=etikettVon(e.etikett);
  const b=BRUCH[e.eff]||BRUCH.kugel;
  return {
    name:e.name, short:e.name.length>16?e.name.slice(0,15)+'.':e.name,
    cat:2, lvl:1, shape:tr.shape,
    dims:tr.dims.slice(), grid:tr.grid.slice(), box:tr.box,
    cost:e.cost, market:e.market, weight:5, hype:e.hype, risk:6,
    eigen:true, gruppe:'eigene', rezept:e,
    art:{title:e.name.toUpperCase().slice(0,18),sub:b.name+' · '+farbVon(e.A).name,
         bg1:et.bg1,bg2:et.bg2,ac:et.ac,ac2:et.ac2,gold:et.gold,light:et.light}
  };
}
/* Beim Laden und beim Fertigstellen: Produkt ins Sortiment heben */
function eigenesEintragen(e){
  if(P[e.id]) return P[e.id];
  P[e.id]=rezeptProdukt(e);
  if(ORDER.indexOf(e.id)<0) ORDER.push(e.id);
  VOLA[e.id]=0.55;
  if(!(S.prices[e.id]>0)) S.prices[e.id]=P[e.id].market;
  /* Marktindex und Modellvorrat nachziehen */
  if(S.mi&&typeof S.mi[e.id]!=='number'){ S.mi[e.id]=1; S.me[e.id]=1; S.reg[e.id]=regimeNeu(e.id); S.mh[e.id]=[1]; }
  if(typeof pools!=='undefined'&&!pools[e.id]) pools[e.id]=new ItemPool(buildProduct(e.id),poolCap(e.id));
  return P[e.id];
}
function eigeneListe(){ return (S&&S.eigene)||[]; }
function eigeneAlleEintragen(){ eigeneListe().forEach(e=>{ if(e.fertig) eigenesEintragen(e); }); }
/* Taeglich: was in Entwicklung ist, kommt irgendwann heraus */
function rezepteTick(){
  let neu=0;
  eigeneListe().forEach(e=>{
    if(e.fertig) return;
    e.rest--;
    if(e.rest<=0){ e.fertig=true; eigenesEintragen(e); neu++;
      toast(`${e.name} ist fertig entwickelt und steht im Bestellkatalog.`,'money');
      statAdd('eigene',1); addXP(180,'Eigene Rezeptur'); }
  });
  return neu;
}

/* =========================================================
   Herausforderungen.
   Grundregel: jeder Zaehler steigt nur, nie faellt er zurueck.
   Es gibt keine Streaks und keine Bedingungen, die man durch
   einen einzigen Fehler verliert. Und jede Herausforderung
   haengt an etwas, das man vorher freigeschaltet hat - wer
   keinen Onlineshop hat, sieht die Versandziele gar nicht.
   ========================================================= */

/* Warengruppen, damit ein Zaehler mehrere Sorten sammelt */
const GRUPPE={
  boeller:['boeller','grossboeller','kanonen','doppelschlag','sprengmeister','xxlpolen','knallfrosch','knallerbsen'],
  raketen:['raketenklein','raketen','raketengold','furzrakete','blanko','gravur'],
  batterien:['batterie16','batterie25','batterie49','batterie100','faecher','sortiment','profi'],
  kugeln:['kugel75','kugel100','kugel150'],
  boden:['fontaene','vulkan','wasserfall','roemisch','schwaermer','sternenbrunnen','tisch','wunder','heuler'],
  zubehoer:['feuerzeug','luftschlangen','knicklichter','brille','chips','konfetti','bleigiessen','bowle'],
  sekt:['sekt','kindersekt']
};
function gruppeVon(t){
  for(const g in GRUPPE) if(GRUPPE[g].indexOf(t)>=0) return g;
  const p=P[t];
  if(p&&p.eigen) return p.gruppe||'eigene';
  return 'sonstiges';
}

/* Belohnungen bleiben klein: sie geben einen Schub, kippen aber
   die Bilanz nicht. Grob ein halber bis ein ganzer Tagesumsatz
   auf der Stufe, auf der man sie realistisch erreicht. */
const ERFOLGE=[
  /* --- Verkauf: laeuft von Anfang an mit --- */
  {id:'v_boeller',kat:'Verkauf',name:'Krachmacher',ikon:'boeller',
   desc:'Böller aller Art über die Theke gebracht',
   stufen:[100,800,5000,20000],lohn:[60,320,1600,7000]},
  {id:'v_raketen',kat:'Verkauf',name:'Startrampe',ikon:'rakete',
   desc:'Raketen verkauft',req:{liz:'klassiker'},
   stufen:[60,500,3000,12000],lohn:[80,400,2000,8000]},
  {id:'v_batterien',kat:'Verkauf',name:'Verbundhändler',ikon:'batterie',
   desc:'Batterien und Verbunde verkauft',req:{liz:'verbund'},
   stufen:[40,300,1500,6000],lohn:[260,1400,5000,14000]},
  {id:'v_kugeln',kat:'Verkauf',name:'Schweres Kaliber',ikon:'kugel',
   desc:'Kugelbomben verkauft',req:{liz:'verbund'},
   stufen:[10,80,400,1500],lohn:[300,1600,5500,16000]},
  {id:'v_sekt',kat:'Verkauf',name:'Auf Mitternacht',ikon:'sekt',
   desc:'Flaschen Sekt und Kindersekt verkauft',req:{liz:'klassiker'},
   stufen:[50,400,2000,8000],lohn:[70,350,1500,5500]},
  {id:'v_zubehoer',kat:'Verkauf',name:'Alles für die Party',ikon:'zubehoer',
   desc:'Zubehör verkauft',req:{liz:'zubehoer'},
   stufen:[80,600,3000,12000],lohn:[60,300,1300,5000]},
  /* --- Theke und Lager --- */
  {id:'kunden',kat:'Laden',name:'Stammpublikum',ikon:'kunde',
   desc:'Kunden abkassiert',
   stufen:[100,800,4000,15000],lohn:[80,450,2200,9000]},
  {id:'kartons',kat:'Laden',name:'Packesel',ikon:'karton',
   desc:'Kartons eingeräumt',
   stufen:[50,400,2000,8000],lohn:[60,300,1400,5500]},
  {id:'lkw',kat:'Laden',name:'Rampenroutine',ikon:'lkw',
   desc:'Lieferungen an der Rampe entgegengenommen',
   stufen:[10,60,300,1200],lohn:[70,380,1800,7000]},
  /* --- Testfeld: an das eigene Zuenden geknuepft --- */
  {id:'gezuendet',kat:'Testfeld',name:'Feuerwerker',ikon:'zuenden',
   desc:'Artikel selbst gezündet',
   stufen:[20,150,700,3000],lohn:[80,400,1800,7000]},
  {id:'brucharten',kat:'Testfeld',name:'Effektsammler',ikon:'stern',
   desc:'verschiedene Bruchbilder am Himmel gesehen',
   stufen:[6,12,19,27],lohn:[150,600,2400,9000]},
  {id:'hype',kat:'Testfeld',name:'Volksfeststimmung',ikon:'hype',
   desc:'Hype durch eigene Vorführungen erzeugt',
   stufen:[200,2000,10000,40000],lohn:[90,500,2200,8000]},
  /* --- Versand: erst mit Onlineshop und Packstation --- */
  {id:'pakete',kat:'Versand',name:'Versandfertig',ikon:'paket',
   desc:'Pakete selbst gepackt',req:{up:'packstation'},
   stufen:[25,200,1000,4000],lohn:[200,900,3600,12000]},
  {id:'ddl',kat:'Versand',name:'Abholbereit',ikon:'ddl',
   desc:'Pakete von DDL abholen lassen',req:{up:'onlineshop'},
   stufen:[50,400,2000,8000],lohn:[180,800,3200,11000]},
  /* --- Grossauftraege --- */
  {id:'auftraege',kat:'Aufträge',name:'Für die ganze Stadt',ikon:'auftrag',
   desc:'Großaufträge ausgeliefert',req:{up:'grosskunden'},
   stufen:[5,30,150,600],lohn:[220,1000,4200,14000]},
  /* --- Eigene Marke: erst mit dem Labor --- */
  {id:'eigene',kat:'Eigene Marke',name:'Hausmarke',ikon:'labor',
   desc:'eigene Rezepturen entwickelt',req:{up:'labor'},
   stufen:[1,4,10,20],lohn:[400,1800,6000,18000]},
  {id:'v_eigene',kat:'Eigene Marke',name:'Unter eigenem Namen',ikon:'labor',
   desc:'Artikel der eigenen Marke verkauft',req:{up:'labor'},
   stufen:[50,400,2000,8000],lohn:[300,1400,5000,16000]},
  /* --- Bestwerte: kein Scheitern moeglich, nur Rekorde --- */
  {id:'rek_tag',kat:'Rekorde',name:'Bester Tag',ikon:'geld',rekord:true,geld:true,
   desc:'höchster Tagesumsatz',
   stufen:[500,2000,6000,15000],lohn:[120,600,2400,9000]},
  {id:'rek_kunden',kat:'Rekorde',name:'Volle Bude',ikon:'kunde',rekord:true,
   desc:'meiste Kunden an einem Tag',
   stufen:[40,80,140,220],lohn:[110,550,2200,8000]},
  {id:'tage',kat:'Rekorde',name:'Durchgehalten',ikon:'kalender',
   desc:'Tage im Geschäft',
   stufen:[7,30,90,200],lohn:[100,500,2000,7500]}
];

/* --------------------------------------------------------
   Zaehler
   -------------------------------------------------------- */
function statInit(){
  S.stat=S.stat||{};
  S.erf=S.erf||{};                 /* id -> hoechste abgeholte Stufe */
  S.gesehen=Array.isArray(S.gesehen)?S.gesehen:[];
}
function stat(id){ return (S&&S.stat&&S.stat[id])||0; }
/* Ein Zaehler steigt. Wird eine Stufe erreicht, meldet sich das Spiel. */
function statAdd(id,n){
  if(!S||!S.stat) return;
  S.stat[id]=(S.stat[id]||0)+(n||1);
  erfolgPruefen(id);
}
/* Bestwert: nur nach oben */
function statRekord(id,wert){
  if(!S||!S.stat) return;
  if(wert>(S.stat[id]||0)){ S.stat[id]=wert; erfolgPruefen(id); }
}
/* Ein verkaufter Artikel zaehlt auf mehrere Zaehler ein */
function statVerkauf(t,n){
  n=n||1;
  /* gruppeVon liefert fuer eigene Ware bereits 'eigene', sonst
     wuerde der Zaehler doppelt laufen. */
  statAdd('v_'+gruppeVon(t),n);
}
/* Ein gesehenes Bruchbild wird fuer die eigene Entwicklung freigeschaltet */
function bruchGesehen(eff){
  if(!S||!Array.isArray(S.gesehen)||!eff) return;
  /* Nur was sich auch verbauen laesst, wird vermerkt. Die Furzwolke
     hat feste Farben und passt nicht in den Farbwaehler. */
  if(typeof BRUCH==='undefined'||!BRUCH[eff]) return;
  if(S.gesehen.indexOf(eff)>=0) return;
  S.gesehen.push(eff);
  S.stat.brucharten=S.gesehen.length;
  erfolgPruefen('brucharten');
}

/* --------------------------------------------------------
   Freischaltung und Fortschritt
   -------------------------------------------------------- */
function erfOffen(e){
  if(!e.req) return true;
  if(e.req.up&&!(S.up&&S.up[e.req.up])) return false;
  if(e.req.liz&&!hatLizenz(e.req.liz)) return false;
  return true;
}
function erfStufe(e){ return (S&&S.erf&&S.erf[e.id])||0; }
function erfStand(e){ return stat(e.id); }
function erfZiel(e){ const s=erfStufe(e); return s<e.stufen.length?e.stufen[s]:null; }
function erfFertig(e){ return erfStufe(e)>=e.stufen.length; }
function erfAnteil(e){
  const z=erfZiel(e); if(z===null) return 1;
  const s=erfStufe(e), vor=s>0?e.stufen[s-1]:0;
  return clamp((erfStand(e)-vor)/Math.max(1,z-vor),0,1);
}
/* Restposten statt Bargeld: manchmal gibt es ein Angebot statt Geld */
function erfBelohnen(e,stufe){
  const geld=e.lohn[stufe]||0;
  /* Jede dritte Stufe kommt als Warengutschrift herein - das fuehlt
     sich anders an und greift weniger in die Kasse ein. */
  if(stufe===1&&!e.geld){
    S.gutschrift=r2((S.gutschrift||0)+geld);
    toast(`${e.name}: ${eur(geld)} Warengutschrift beim Großhandel.`,'money');
  } else {
    S.money=r2(S.money+geld);
    DS.praemien=r2((DS.praemien||0)+geld);
    toast(`${e.name}: ${eur(geld)} Prämie.`,'money');
  }
  addXP(Math.round(geld/10)+25,'Herausforderung');
  sfx.level();
}
function erfolgPruefen(id){
  const e=ERFOLGE.find(x=>x.id===id);
  if(!e||!erfOffen(e)||erfFertig(e)) return;
  let s=erfStufe(e);
  while(s<e.stufen.length&&erfStand(e)>=e.stufen[s]){
    S.erf[e.id]=++s;
    erfBelohnen(e,s-1);
  }
}
/* Nach dem Laden einmal alles nachziehen, ohne Belohnungen auszuschuetten */
function erfNachziehen(){
  statInit();
  ERFOLGE.forEach(e=>{
    if(!erfOffen(e)) return;
    let s=erfStufe(e);
    while(s<e.stufen.length&&erfStand(e)>=e.stufen[s]) s++;
    S.erf[e.id]=s;
  });
}
function erfOffeneAnzahl(){ return ERFOLGE.filter(e=>erfOffen(e)&&!erfFertig(e)).length; }
function erfGeschafft(){ return ERFOLGE.reduce((a,e)=>a+erfStufe(e),0); }
function erfGesamt(){ return ERFOLGE.reduce((a,e)=>a+e.stufen.length,0); }

/* =========================================================
   Markt: jedes Produkt hat einen eigenen Preisindex, der sich
   Tag fuer Tag bewegt. Wie stark, haengt an der Volatilitaet
   des Produkts und an seiner aktuellen Marktphase. Manche
   Waren liegen monatelang still, andere schlagen wild aus.
   Dazu eine langsame Inflation, die alles teurer macht.
   ========================================================= */
const VOLA={
  feuerzeug:0.15, knicklichter:0.20, brille:0.25, konfetti:0.30, luftschlangen:0.30,
  knallerbsen:0.32, wunder:0.35, bleigiessen:0.40, tisch:0.45,
  knallfrosch:0.50, blanko:0.50, gravur:0.50, schwaermer:0.55, fontaene:0.65,
  chips:0.70, kindersekt:0.70, boeller:0.70, roemisch:0.70, raketenklein:0.70,
  bowle:0.80, vulkan:0.80, sortiment:0.80, wasserfall:0.80,
  raketen:0.85, monsterboeller:0.90, batterie16:0.90,
  raketengold:0.95, knatter:0.95, pfeifraketen:0.80, sekt:1.00, faecher:1.00, batterie49:1.05,
  furzrakete:1.10, batterie100:1.20, atomboeller:1.40, profi:1.40,
  sternenbrunnen:0.75, kugel75:0.95, kugel100:1.15, kugel150:1.45,
  zfaecher:1.05, kometen:1.15, titanraketen:1.25, kugel200:1.50, finale:1.55, jumbogold:1.30, jumboleiter:1.45,
  goldgeysir:0.85, feuerbrunnen:0.9, feuersaeule:1.2, fontaene30:1.35, fontaene50:1.5, donnerwand:1.35, kugel300:1.6
};
function volaOf(t){ const v=VOLA[t]; if(v!==undefined) return v; const p=P[t]; return p&&p.cat===2?0.85:p&&p.cat===1?0.6:0.45; }

/* Marktphasen. amp skaliert das Tagesrauschen, rev zieht zurueck zur Mitte. */
const REGIME={
  fest  :{amp:0.10, rev:0.26, d:[12,30], name:'stabil',      farbe:'ok'},
  ruhig :{amp:0.34, rev:0.15, d:[8,20],  name:'ruhig',       farbe:''},
  normal:{amp:0.85, rev:0.07, d:[5,14],  name:'schwankend',  farbe:'warn'},
  sturm :{amp:2.10, rev:0.04, d:[3,9],   name:'turbulent',   farbe:'no'}
};
const REGIME_ALL=['fest','ruhig','normal','sturm'];
/* Wie wahrscheinlich welche Phase ist, haengt an der Volatilitaet */
function regimeWahl(t){
  const v=volaOf(t);
  const w = v<0.30 ? [72,26,2,0]
          : v<0.60 ? [32,44,23,1]
          : v<0.95 ? [12,32,43,13]
          :          [4,19,45,32];
  let s=0; for(const x of w) s+=x;
  let r=Math.random()*s;
  for(let i=0;i<4;i++){ r-=w[i]; if(r<=0) return REGIME_ALL[i]; }
  return 'normal';
}
function regimeNeu(t){
  const k=regimeWahl(t), d=REGIME[k].d;
  return {k,t:Math.round(rand(d[0],d[1]))};
}
const MI_MIN=0.62, MI_MAX=1.88;
/* Zwei Gleichverteilungen ergeben eine brauchbare Glockenkurve */
const gauss=()=>(Math.random()+Math.random()+Math.random()-1.5)*1.15;

const SCHOCK_KNAPP=[
  'Zoll hält eine ganze Lieferung fest',
  'Die Fabrik in Liuyang steht still',
  'Frachtraten haben sich verdoppelt',
  'Ein Großabnehmer hat den Markt leergekauft',
  'Sicherheitsprüfung stoppt eine Charge',
  'Rohstoff für den Satz ist knapp',
  'Der Importeur sitzt im Stau vor Rotterdam'
];
const SCHOCK_SCHWEMME=[
  'Ein Großhändler räumt sein Lager',
  'Restposten aus Polen überschwemmen den Markt',
  'Importeur insolvent, alles muss raus',
  'Überproduktion aus dem Vorjahr kommt in den Handel',
  'Konkurrenz verramscht ihre Bestände',
  'Neue Fabrik drückt die Preise'
];

function marktInit(){
  S.mi=S.mi||{}; S.me=S.me||{}; S.reg=S.reg||{}; S.mh=S.mh||{}; S.schock=S.schock||{};
  S.infl=+S.infl||1;
  ORDER.forEach(t=>{
    if(typeof S.mi[t]!=='number'||!isFinite(S.mi[t])) S.mi[t]=r3(clamp(1+gauss()*0.06*volaOf(t),MI_MIN,MI_MAX));
    if(typeof S.me[t]!=='number'||!isFinite(S.me[t])) S.me[t]=S.mi[t];
    if(!S.reg[t]||!REGIME[S.reg[t].k]) S.reg[t]=regimeNeu(t);
    if(!Array.isArray(S.mh[t])||!S.mh[t].length) S.mh[t]=[S.mi[t]];
  });
}
const r3=x=>Math.round(x*1000)/1000;
/* Aktueller Marktpreis und Einkaufspreis eines Produkts */
function miOf(t){ const v=S&&S.mi?S.mi[t]:1; return (typeof v==='number'&&isFinite(v))?v:1; }
/* Was die Kunden erwarten, zieht dem Grosshandel ein paar Tage hinterher.
   Genau daraus entsteht das Geschaeft: billig einkaufen, teuer verkaufen. */
function meOf(t){ const v=S&&S.me?S.me[t]:null; return (typeof v==='number'&&isFinite(v))?v:miOf(t); }
function inflOf(){ const v=S?+S.infl:1; return (typeof v==='number'&&isFinite(v)&&v>0)?v:1; }
function marketOf(t){ return r2(P[t].market*meOf(t)*inflOf()); }
/* Der rohe Marktwert, auf den die Erwartung noch zulaeuft */
function marktZiel(t){ return r2(P[t].market*miOf(t)*inflOf()); }
/* Positiv heisst: Einkauf ist gerade guenstiger als die Erwartung der Kunden */
function marktLuecke(t){ const e=meOf(t), m=miOf(t); return Math.round((e/m-1)*100); }
function costOf(t){ return r2(P[t].cost*miOf(t)*inflOf()); }
/* Veraenderung zum Vortag in Prozent */
function marktDelta(t){
  const h=(S&&S.mh&&S.mh[t])||[]; if(h.length<2) return 0;
  const a=h[h.length-2], b=h[h.length-1];
  return a>0?Math.round((b/a-1)*1000)/10:0;
}
/* Wie weit liegt der Preis ueber oder unter dem Normalniveau */
function marktNiveau(t){ return Math.round((meOf(t)-1)*100); }
function marktPhase(t){ const r=(S&&S.reg&&S.reg[t])?REGIME[S.reg[t].k]:null; return r||REGIME.ruhig; }
function marktSchock(t){ return S&&S.schock?S.schock[t]:null; }
function marktLabel(t){
  const n=marktNiveau(t);
  if(n<=-22) return ['ok','Sehr günstig eingekauft'];
  if(n<=-9)  return ['ok','Günstiger als sonst'];
  if(n<9)    return ['','Normales Niveau'];
  if(n<24)   return ['warn','Teurer als sonst'];
  return ['no','Deutlich überteuert'];
}
/* Das am staerksten aus dem Rahmen gefallene Produkt (r=1 teuer, -1 guenstig) */
function marktExtrem(r){
  let best=null, bv=0;
  ORDER.forEach(t=>{ if(P[t].noOrder||!isUnlocked(t)) return;
    const n=marktNiveau(t)*r; if(n>bv){ bv=n; best=t; } });
  return bv>=8?best:null;
}
/* Wo lohnt sich der Einkauf gerade am meisten */
function marktChance(){
  let best=null, bv=6;
  ORDER.forEach(t=>{ if(P[t].noOrder||!isUnlocked(t)) return;
    const l=marktLuecke(t); if(l>bv){ bv=l; best=t; } });
  return best;
}
/* Durchschnittliches Marktniveau ueber alle freigeschalteten Waren */
function marktSchnitt(){
  let n=0,s=0;
  ORDER.forEach(t=>{ if(P[t].noOrder) return; if(!isUnlocked(t)) return; n++; s+=miOf(t); });
  return n?s/n:1;
}

/* Ein Tag Marktbewegung. Gibt die Meldungen des Tages zurueck. */
function rollMarkt(){
  marktInit();
  const news=[];
  /* Inflation: meistens ein kleiner Schritt, selten ein groesserer */
  let inf=rand(0.0008,0.0028);
  if(Math.random()<0.05) inf+=rand(0.003,0.009);
  S.infl=r3(clamp(inflOf()*(1+inf),1,4));
  ORDER.forEach(t=>{
    const reg=S.reg[t];
    reg.t--;
    if(reg.t<=0) S.reg[t]=regimeNeu(t);
    const r=REGIME[S.reg[t].k], v=volaOf(t);
    /* laufender Schock haelt den Markt in Bewegung */
    const sch=S.schock[t];
    if(sch){ sch.t--; if(sch.t<=0) delete S.schock[t]; }
    let mi=miOf(t);
    mi+=(1-mi)*r.rev + gauss()*0.045*v*r.amp;
    /* Neuer Schock? Nur bei Waren, die ueberhaupt schwanken. */
    if(!sch&&v>=0.48&&Math.random()<0.012*v){
      const knapp=Math.random()<0.55;
      const f=knapp?1+rand(0.28,0.80):1-rand(0.18,0.40);
      mi*=f;
      S.schock[t]={k:knapp?'knapp':'schwemme',t:Math.round(rand(3,9))};
      S.reg[t]={k:'sturm',t:Math.round(rand(3,8))};
      news.push({t,knapp,text:knapp?pick(SCHOCK_KNAPP):pick(SCHOCK_SCHWEMME)});
    }
    S.mi[t]=r3(clamp(mi,MI_MIN,MI_MAX));
    /* Erwartung der Kunden laeuft traege nach */
    S.me[t]=r3(clamp(meOf(t)+(S.mi[t]-meOf(t))*0.26,MI_MIN,MI_MAX));
    const h=S.mh[t]; h.push(S.me[t]); if(h.length>16) h.shift();
  });
  S.mkt=r2(clamp(marktSchnitt(),0.7,1.5));
  S.news=news.slice(0,4);
  return S.news;
}

/* =========================================================
   Lizenzpakete: Produkte werden nicht mehr einzeln
   freigeschaltet, sondern in Paketen gekauft.
   ========================================================= */
const LIZENZEN=[
  {id:'start',lvl:1,cost:0,name:'Grundsortiment',
   desc:'Womit jeder Laden anfängt: Wunderkerzen, Knallerbsen, Tischfeuerwerk, Knallfrösche.',
   items:['wunder','knallerbsen','tisch','knallfrosch']},
  {id:'zubehoer',lvl:3,cost:120,name:'Silvesterzubehör',
   desc:'Alles um das Feuerwerk herum. Kleine Margen, aber fast jeder Kunde nimmt etwas davon mit.',
   items:['feuerzeug','luftschlangen','knicklichter','brille','chips','konfetti']},
  {id:'klassiker',lvl:5,cost:380,name:'Silvester-Klassiker',
   desc:'Die Ware, wegen der die Leute überhaupt kommen: der Furzböller, Schwärmer, kleine Raketen und der Sekt für Mitternacht.',
   items:['boeller','schwaermer','raketenklein','sekt','kindersekt']},
  {id:'krach',lvl:8,cost:1100,name:'Abteilung Krach',
   desc:'Der Monster Böller, Römische Lichter und Fontänen. Ab hier wird es laut.',
   items:['monsterboeller','roemisch','fontaene','blanko','gravur']},
  {id:'himmel',lvl:11,cost:2600,name:'Bunte Nacht',
   desc:'Raketensortimente, pfeifende Heulraketen, Goldraketen, ab Level 14 der Goldgeysir mit zehn Metern Fontäne, Vulkane und der Sternenbrunnen, eine Goldfontäne mit Farbsternen. Dazu Wachsgießen und Feuerzangenbowle.',
   items:['raketen','pfeifraketen','raketengold','vulkan','goldgeysir','wasserfall','sternenbrunnen','bleigiessen','bowle']},
  {id:'verbund',lvl:14,cost:6000,name:'Verbund & Kugelbomben',
   desc:'Batterien, der Knattersturm, Fächer, der Feuerbrunnen mit Flammenregen und die ersten Kugelbomben. Die gehören in die Mörserbatterie auf dem Testfeld: ein Schuss, oben mehrere Brüche nacheinander.',
   items:['batterie16','knatter','batterie49','sortiment','faecher','feuerbrunnen','kugel75','kugel100']},
  {id:'import',lvl:17,cost:13000,name:'Import & Sonderposten',
   desc:'Der Atombomben-Böller mit dem großen Pilz, der 100er-Verbund, der Z-Fächer Blitzgewitter, der Kometenregen und die 150-mm-Kugelbombe Weltenbrand. Teuer im Einkauf, launisch im Preis, aber die Kunden reden darüber.',
   items:['atomboeller','batterie100','zfaecher','kometen','kugel150']},
  {id:'schabernack',lvl:19,cost:16000,name:'Schabernack-Edition',
   desc:'Die Furzrakete »Donnerbalken«. Verkauft sich von allein, weil jeder sie einmal gesehen haben will.',
   items:['furzrakete']},
  {id:'grossfeuer',lvl:20,cost:21000,name:'Großkaliber',
   desc:'Die Titan-Raketen mit ihrem riesigen Silberbruch, die Jumbo-Rakete »Goldene Krone«, die 200-mm-Kugelbombe Götterzorn mit zehn Brüchen auf einmal, die Donnerwand mit Salven aus sechs Rohren, die 15-m-Feuersäule und ab Level 23 der Himmelsstürmer, eine 30-m-Monsterfontäne in fünf Farben.',
   items:['titanraketen','jumbogold','kugel200','donnerwand','feuersaeule','fontaene30']},
  {id:'profi',lvl:22,cost:26000,name:'Profiklasse',
   desc:'Der Götterfunken-Verbund: zweihundert Schuss, und der halbe Ort steht auf der Straße. Dazu die Jumbo-Rakete »Polarstern«: eine riesige Kugel mit einem achtzackigen Stern darin. Ab Level 23 die 300-mm-Kugel Himmelsbrecher, ab Level 24 der Weltuntergang mit dreihundert Schuss und ab Level 26 der Regenbogen-Titan: 50 m Fontäne im vollen Regenbogen.',
   items:['profi','finale','kugel300','jumboleiter','fontaene50']}
];
const LIZ_VON={};
LIZENZEN.forEach(l=>l.items.forEach(t=>{ LIZ_VON[t]=l.id; }));
function lizenzOf(t){ return LIZ_VON[t]||null; }
function hatLizenz(id){ return !!(S&&S.lic&&S.lic.indexOf(id)>=0); }
function lizenzDaten(id){ return LIZENZEN.find(l=>l.id===id)||null; }
/* Die naechste Lizenz, die noch fehlt */
function naechsteLizenz(){ return LIZENZEN.find(l=>!hatLizenz(l.id))||null; }

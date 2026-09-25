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
const SHOW_BASIS={
  roemisch   :{pw:-9,sz:0.45,th:'bunt'},
  sortiment  :{pw:-6,sz:0.72,th:'bunt'},
  batterie16 :{pw:-5,sz:0.78,th:'nacht'},
  knatter    :{pw:-4,sz:0.84,th:'eis'},
  batterie49 :{pw:-3,sz:0.90,th:'glut'},
  faecher    :{pw:-1.5,sz:0.95,th:'tropen'},
  batterie100:{pw:-0.5,sz:1.00,th:'himmel'},
  zfaecher   :{pw: 0,sz:1.00,th:'blitz'},
  kometen    :{pw: 0.5,sz:1.08,th:'gold'},
  donnerwand :{pw: 1.5,sz:1.14,th:'rotweiss'},
  profi      :{pw: 2.5,sz:1.22,th:'koenig'},
  finale     :{pw: 3.5,sz:1.30,th:'nacht'}
};
function playShow(o,phases,prod){
  const BS=SHOW_BASIS[prod]||{pw:0,sz:1,th:null};
  let t=0;
  phases.forEach((ph,pi)=>{
    const n=ph.n||1, gap=ph.gap===undefined?0.45:ph.gap, th=ph.th||BS.th;
    const zufall=Math.floor(Math.random()*SCHEMES.length);
    /* Farbpaar: aus dem Thema, je Phase eins; wechsel = Paare im Takt */
    const paar=i=>th?themaPaar(th,(ph.farbe!==undefined?ph.farbe:pi)+(ph.wechsel?i:0)):scheme(ph.sc===undefined?zufall:ph.sc);
    if(ph.ground){ const st=t, [gA,gB]=paar(0), A=ph.gA?K(ph.gA):gA, B=ph.gB?K(ph.gB):gB;
      later(st,()=>{ emitters.push({t:ph.gt||4,k:ph.ground,o,A,B}); sfx.fizz(distVol(o)); }); }
    for(let i=0;i<n;i++){
      const k=n>1?i/(n-1):0.5, tt=t+i*gap;
      let ang=0;
      if(ph.fan) ang=(-1+2*k)*(ph.ang||0.3);
      else if(ph.vfan) ang=(1-Math.abs(0.5-k)*2)*(ph.ang||0.3)*(i%2?1:-1);
      else if(ph.ang) ang=rand(-ph.ang,ph.ang);
      /* Effekte der Reihe nach, nicht gewuerfelt */
      const eff=Array.isArray(ph.eff)?ph.eff[i%ph.eff.length]:(ph.eff||pick(EFF_GROSS));
      const [A,B]=paar(i);
      const dir=ph.fan||ph.vfan?FANDIR:undefined;
      const opt={eff,sz:(ph.sz||1)*BS.sz*SHOW_GROESSE,pw:BS.pw+(ph.pw||0),ang,dir,A,B,fuse:ph.fuse,dick:ph.dick};
      later(tt,()=>{
        if(ph.mine) mine(o,A,B,ph.mineSz||0.8);
        /* bomb: echte Kugelbombe mit Nachbruechen statt einer Rakete */
        if(ph.bomb) kugelbombe(o,ph.bomb,{A,B});
        else shot(o,opt);
      });
    }
    t+=n*gap+(ph.pause||0);
  });
  return t;
}
/* --- Drehbücher --- */
const SHOWS={
  /* Familienfest, 18 Teile: bunt, klein, freundlich */
  sortiment:()=>[
    {n:3,gap:0.9,eff:'kugel',mine:true,mineSz:0.5,pause:1.0},
    {n:2,gap:1.2,ground:'fountain',gt:5,eff:'ring',pause:1.4},
    {n:4,gap:0.8,eff:['kugel','regenbogen','knister','kugel'],wechsel:true,pause:1.2},
    {n:4,gap:0.6,eff:'wechsel',fan:true,ang:0.3,pause:1.4},
    {n:5,gap:0.5,eff:['kugel','chrys','regenbogen','kugel','chrys'],wechsel:true,sz:1.1,pw:1,pause:2.5}
  ],
  /* Nachthimmel, 16 Schuss: Blau und Gold, zum Schluss ein Regenbogen */
  batterie16:()=>[
    {n:4,gap:1.0,eff:'kugel',mine:true,mineSz:0.55,pause:1.2},
    {n:4,gap:0.8,eff:'ring',fan:true,ang:0.3,pause:1.4},
    {n:4,gap:0.75,eff:['stern','ring'],pause:1.4},
    {n:2,gap:0.6,eff:'regenbogen',sz:1.05,pw:1,pause:0.8},
    {n:2,gap:0.12,eff:'chrys',farbe:0,sz:1.1,pw:1,pause:3.0}
  ],
  /* Knattersturm, 30 Schuss: Eisfarben, alles knistert, dazwischen
     kurze Dreiersalven */
  knatter:()=>[
    {n:6,gap:0.7,eff:'knister',mine:true,mineSz:0.6,pause:1.4},
    {n:3,gap:0.1,eff:'tausend',fan:true,ang:0.35,pause:2.2},
    {n:6,gap:0.65,eff:['knister','fische'],fan:true,ang:0.3,pause:1.4},
    {n:3,gap:0.1,eff:'tausend',fan:true,ang:-0.35,pause:2.2},
    {n:6,gap:0.55,eff:['feuerrad','ring','feuerrad'],sz:1.05,pause:1.6},
    {n:3,gap:0.1,eff:'kaskade',fan:true,ang:0.35,sz:1.1,pw:1,pause:1.6},
    {n:3,gap:0.1,eff:'tausend',sz:1.15,pw:2,pause:3.0}
  ],
  /* Feuersturm, 49 Schuss: Rot, Orange, Gold - hier gibt es zum
     ersten Mal den Flammenregen */
  batterie49:()=>[
    {n:6,gap:0.85,eff:'kugel',mine:true,pause:1.4},
    {n:6,gap:0.55,eff:'wechsel',fan:true,ang:0.4,pause:1.4},
    {n:6,gap:0.8,eff:['chrys','palme'],pause:1.6},
    {n:4,gap:0.1,eff:'ring',fan:true,ang:0.4,pause:2.0},
    {n:6,gap:0.9,eff:'flammenregen',sz:0.95,pw:1,pause:2.2},
    {n:8,gap:0.45,eff:['feuerrad','doppelring','feuerrad','ring'],wechsel:true,pause:1.6},
    {n:4,gap:0.12,eff:'palme',fan:true,ang:-0.4,sz:1.1,pw:1,pause:2.0},
    {n:5,gap:0.5,eff:['chrys','flammenregen','chrys','palme','flammenregen'],sz:1.15,pw:2,pause:0.6},
    {n:4,gap:0.1,eff:'salut',sz:1.0,pause:3.4}
  ],
  /* Weitwinkel, 36 Schuss im Faecher: Tropenfarben, links-rechts */
  faecher:()=>[
    {n:7,gap:0.55,eff:'kugel',fan:true,ang:0.5,pause:1.2},
    {n:7,gap:0.55,eff:'ring',fan:true,ang:-0.5,pause:1.4},
    {n:7,gap:0.6,eff:['feuerrad','stern','feuerrad','saturn'],vfan:true,ang:0.5,pause:1.6},
    {n:5,gap:0.12,eff:'farbregen',fan:true,ang:0.5,sz:1.05,pause:2.4},
    {n:5,gap:0.5,eff:['palme','spinne','palme','fische','palme'],fan:true,ang:-0.45,wechsel:true,pause:1.4},
    {n:5,gap:0.1,eff:['chrys','mehrring','dahlie','mehrring','chrys'],fan:true,ang:0.5,sz:1.2,pw:2,pause:4.0}
  ],
  /* Himmelssturm, 100 Schuss: Violett, Magenta, Gold - und der
     Regenbogen als roter Faden: erst als Faecher, am Ende als Salve */
  batterie100:()=>[
    {n:8,gap:0.8,eff:'kugel',mine:true,pause:1.4},
    {n:10,gap:0.45,eff:'regenbogen',fan:true,ang:0.5,pause:1.8},
    {n:8,gap:0.85,eff:['herz','stern','saturn','ring'],pause:1.6},
    {n:6,gap:0.1,eff:'ring',fan:true,ang:0.5,pause:2.2},
    {n:10,gap:0.5,eff:['spinne','fische','tausend','fische','spinne'],wechsel:true,pause:1.6},
    {n:8,gap:0.8,eff:['kronleuchter','weide','farbregen','kronleuchter'],sz:1.1,pw:1,pause:2.0},
    {n:10,gap:0.45,eff:'regenbogen',fan:true,ang:-0.5,sz:1.05,pause:1.8},
    {n:10,gap:0.55,eff:['crossette','dahlie','pistill','dahlie','crossette'],sz:1.1,pw:1,pause:1.6},
    {n:6,gap:0.1,eff:'komet',fan:true,ang:0.5,sz:1.1,pw:2,pause:2.4},
    {n:12,gap:0.3,eff:['chrys','mehrring','regenbogen','brokat'],wechsel:true,sz:1.2,pw:3,pause:1.0},
    {n:6,gap:0.1,eff:'regenbogen',fan:true,ang:0.55,sz:1.25,pw:3,pause:0.8},
    {n:6,gap:0.1,eff:'salut',sz:1.0,pause:4.0}
  ],
  /* Blitzgewitter, 48 Schuss Z-Faecher: Silber und Eisblau,
     Strobo und Sternschnuppen */
  zfaecher:()=>[
    {n:8,gap:0.3,eff:'kugel',fan:true,ang:0.5,mine:true,pause:1.4},
    {n:8,gap:0.3,eff:'ring',fan:true,ang:-0.5,pause:1.4},
    {n:8,gap:0.3,eff:'strobe',fan:true,ang:0.5,pause:2.2},
    {n:6,gap:0.9,eff:['blink','sternschnuppen','blink'],vfan:true,ang:0.45,sz:1.05,pause:2.0},
    {n:6,gap:0.1,eff:['palme','komet'],fan:true,ang:0.5,sz:1.1,pw:2,pause:2.6},
    {n:6,gap:0.5,eff:['feuerrad','ring'],wechsel:true,pause:1.4},
    {n:6,gap:0.1,eff:['mehrring','crossette','strobe'],fan:true,ang:-0.5,sz:1.2,pw:2,pause:4.4}
  ],
  /* Kometenregen, 64 Schuss: nur Gold - Kometen, Brokat, Kronleuchter */
  kometen:()=>[
    {n:6,gap:1.0,eff:'komet',mine:true,mineSz:1.0,pause:1.8},
    {n:10,gap:0.45,eff:['brokat','glitzerweide'],fan:true,ang:0.45,pause:2.0},
    {n:6,gap:1.0,eff:['kronleuchter','kamuro','zeitregen'],sz:1.1,pw:1,pause:1.8},
    {n:7,gap:0.1,eff:'komet',fan:true,ang:0.5,sz:1.05,pause:2.6},
    {n:8,gap:0.7,eff:['sternschnuppen','kaskade','glitzerweide','sternschnuppen'],vfan:true,ang:0.45,sz:1.1,pw:1,pause:2.0},
    {n:7,gap:0.1,eff:'brokat',fan:true,ang:-0.5,sz:1.1,pw:1,pause:2.8},
    {n:14,gap:0.3,eff:['kamuro','kronleuchter','brokat','komet','glitzerweide','zeitregen'],wechsel:true,sz:1.25,pw:3,pause:0.6},
    {n:6,gap:0.12,eff:'salut',sz:1.0,pause:4.4}
  ],
  /* Donnerwand, 120 Schuss: zwanzig Salven aus sechs Rohren in Rot,
     Weiss und Silber - jede Salve etwas groesser und hoeher */
  donnerwand:()=>['kugel','ring','palme','feuerrad','spinne','glitzerweide','stern','tausend','flammenregen','komet',
    'kamuro','regenbogen','crossette','brokat','dahlie','weide','kronleuchter','glitzerweide','titan','salut'].map((eff,i)=>({
      n:6,gap:0.07,eff,fan:true,ang:i%2?-0.55:0.55,sz:eff==='salut'?1.0:0.9+i*0.018,pw:Math.floor(i/5),
      mine:i===0,mineSz:1.4,pause:i===19?5.0:[3.3,3.3,3.7,3.3,3.3,4.3,3.5,3.3,3.7,3.5,4.5,3.5,3.5,4.1,3.7,4.5,3.3,0.25,2.3,5][i]})),
  /* Salve 18 und 19 kommen Schlag auf Schlag: zwoelf Rohre in einer Sekunde */
  /* Goetterfunken, 200 Schuss: Gold, Violett, Rot. Wasserfall,
     Feuerbrunnen und zwei Kugelbomben */
  profi:()=>[
    {n:8,gap:0.9,eff:'kugel',mine:true,mineSz:1.1,pause:2.0},
    {n:14,gap:0.36,eff:'regenbogen',fan:true,ang:0.48,pause:2.0},
    {n:12,gap:0.8,eff:['herz','stern','saturn','ring'],pause:1.8},
    {n:6,gap:0.8,ground:'wasserfall',gt:10,gA:'gold',gB:'zitrone',eff:'kronleuchter',sz:1.05,pw:1,pause:2.4},
    {n:16,gap:0.35,eff:['knister','fische','spinne','tausend'],wechsel:true,pause:1.6},
    {n:10,gap:0.6,eff:['flammenregen','dahlie','flammenregen','weide','kaskade'],th:'glut',sz:1.1,pw:1,pause:1.4},
    {n:1,gap:0.5,bomb:2,pause:2.6},
    {n:18,gap:0.3,eff:'kugel',vfan:true,ang:0.52,wechsel:true,pause:1.8},
    {n:10,gap:0.1,eff:['crossette','pistill'],fan:true,ang:0.5,sz:1.15,pw:2,pause:2.0},
    {n:3,gap:1.2,eff:'zehnfach',sz:1.15,pw:3,pause:2.4},
    {n:10,gap:0.7,eff:['brokat','kamuro','sternschnuppen','zeitregen','glitzerweide'],th:'gold',sz:1.2,pw:3,pause:1.6},
    {n:8,gap:0.55,ground:'feuerbrunnen',gt:8,eff:['flammenregen','titan'],th:'glut',sz:1.2,pw:3,pause:2.0},
    {n:1,gap:0.5,bomb:3,pause:3.2},
    {n:12,gap:0.45,eff:['stern','herz','feuerrad','saturn','ring','doppelring'],pause:1.6},
    {n:10,gap:0.1,eff:'regenbogen',fan:true,ang:0.55,sz:1.15,pw:2,pause:2.0},
    {n:26,gap:0.22,eff:['chrys','dreifach','crossette','kronleuchter','brokat','dahlie','titan'],wechsel:true,sz:1.3,pw:4,pause:1.2},
    {n:21,gap:0.13,eff:['palme','weide','kamuro','chrys','pistill','zeitregen','komet'],wechsel:true,sz:1.45,pw:5,pause:0.9},
    {n:14,gap:0.07,eff:'salut',sz:1.05,pause:5.0}
  ],
  /* Weltuntergang, 300 Schuss in drei Akten: Nacht (Blau, Eis),
     Gold, Glut - und zum Schluss geht der Himmel zu */
  finale:()=>[
    {n:10,gap:0.8,eff:['kugel','regenbogen'],mine:true,mineSz:1.3,th:'nacht',pause:1.8},
    {n:12,gap:0.3,eff:'ring',fan:true,ang:0.5,th:'nacht',pause:0.8},
    {n:12,gap:0.3,eff:'wechsel',fan:true,ang:-0.5,th:'nacht',pause:2.2},
    {n:10,gap:0.9,eff:['herz','stern','saturn','feuerrad'],th:'nacht',sz:1.1,pause:1.8},
    {n:8,gap:0.08,eff:'tausend',fan:true,ang:0.5,th:'eis',pause:3.0},
    {n:22,gap:0.3,eff:['knister','fische','spinne','tausend'],th:'eis',wechsel:true,pause:1.8},
    {n:1,gap:0.5,bomb:3,th:'nacht',pause:3.4},
    {n:10,gap:0.8,ground:'wasserfall',gt:14,gA:'gold',gB:'zitrone',eff:['komet','kronleuchter'],th:'gold',sz:1.15,pw:1,pause:2.0},
    {n:16,gap:0.4,eff:['kamuro','glitzerweide','zeitregen','sternschnuppen'],vfan:true,ang:0.5,th:'gold',sz:1.2,pw:2,pause:1.8},
    {n:8,gap:0.1,eff:'komet',fan:true,ang:0.55,th:'gold',sz:1.2,pw:2,pause:2.6},
    {n:12,gap:0.6,eff:['kaskade','palme','dahlie','pistill'],th:'koenig',wechsel:true,sz:1.2,pw:2,pause:1.8},
    {n:20,gap:0.4,eff:'regenbogen',vfan:true,ang:0.5,sz:1.15,pw:1,pause:1.8},
    {n:4,gap:1.1,eff:'zehnfach',th:'koenig',sz:1.2,pw:3,pause:2.6},
    {n:16,gap:0.35,eff:['crossette','doppel','dreifach','mehrring'],fan:true,ang:0.45,th:'koenig',wechsel:true,sz:1.2,pw:3,pause:2.2},
    {n:1,gap:0.5,bomb:4,th:'koenig',pause:4.6},
    {n:10,gap:0.45,ground:'feuerbrunnen',gt:10,eff:'flammenregen',th:'glut',sz:1.2,pw:3,pause:1.6},
    {n:16,gap:0.3,eff:['strobe','blink','spinne','tausend'],vfan:true,ang:0.52,th:'blitz',pause:1.4},
    {n:14,gap:0.28,eff:['titan','kamuro','flammenregen','mehrring'],th:'glut',wechsel:true,sz:1.35,pw:4,pause:1.2},
    {n:10,gap:0.08,eff:['palme','komet'],fan:true,ang:0.55,th:'gold',sz:1.3,pw:4,pause:2.0},
    {n:10,gap:0.08,eff:'regenbogen',fan:true,ang:-0.55,sz:1.3,pw:4,pause:2.0},
    {n:30,gap:0.18,eff:['chrys','dreifach','crossette','kronleuchter','brokat','dahlie','titan'],th:'koenig',wechsel:true,sz:1.4,pw:5,pause:1.0},
    {n:30,gap:0.1,eff:['palme','weide','kamuro','chrys','pistill','glitzerweide','komet','mehrring','flammenregen'],th:'gold',wechsel:true,sz:1.55,pw:6,pause:0.8},
    {n:18,gap:0.05,eff:'salut',th:'gold',sz:1.15,pause:6.0}
  ],
  roemisch:()=>[
    {n:10,gap:1.0,eff:['kugel','knister'],wechsel:true,fuse:0.8,pause:1.5}
  ]
};
/* Raketensets: Anzahl, Takt, Kaliber, Farbthema und Bruchbilder.
   Von der kleinen Sternschnuppe bis zur Titan steigen alle Werte.
   gruppe: so viele Raketen hintereinander im selben Farbpaar. */
const RAKETEN_KL={
  /* Raketen gehen gegen die grossen Batterien unter - deshalb haben sie
     eigene Bruchbilder, die es sonst nirgends gibt: Spektrum (jeder
     Stern laeuft durch alle Farben) und Goldglitzer (haengende
     Glitzervorhaenge). Schon die kleinste Rakete zeigt sie. */
  raketenklein:{n:3, gap:0.9, sz:0.75,pw:-6,th:'bunt',eff:['spektrum','goldglitzer','spektrum']},
  raketen     :{n:20,gap:0.35,sz:0.85,pw:-3,th:'bunt',gruppe:5,eff:['kugel','spektrum','chrys','goldglitzer','wechsel','spektrum','kugel','goldglitzer','regenbogen','spektrum']},
  pfeifraketen:{n:10,gap:0.5, sz:0.8, pw:-3,th:'wald',gruppe:2,pfeif:true,eff:['knister','spektrum','fische','goldglitzer','strobe','tausend']},
  raketengold :{n:5, gap:1.1, sz:1.25,pw:1, th:'gold',eff:['goldglitzer','kronleuchter','brokat','goldglitzer','zeitregen']},
  titanraketen:{n:3, gap:1.7, sz:1.55,pw:5, th:'eis',dick:1,eff:['titan']},
  /* Einzelraketen (Toms PDF vom 25.09.): ein Schuss, ein Bruch, keine
     Nachladung. Die Krone knisterte vorher 1,7 s spaeter noch einmal,
     die Himmelsleiter schoss Kometen in drei Stufen weiter hoch. */
  /* Jumbo »Goldene Krone«: eine dicke Goldrakete, die Palme endet in
     farbigen Juwelen */
  jumbogold  :{n:1, gap:0, sz:2.2, pw:8, fuse:1.35, th:'koenig',dick:2,trail:'gold',eff:['sternpalme']},
  /* Jumbo »Polarstern«: noch hoeher, eine riesige Kugel mit einem
     achtzackigen Stern darin (Schluessel bleibt fuer alte Staende) */
  jumboleiter:{n:1, gap:0, sz:2.3, pw:10, fuse:1.4, th:'nacht',dick:2,trail:'weiss',eff:['polarstern']},
  gravur      :{n:1, gap:0.45,sz:1.3, pw:4, eff:['herz']},
  blanko      :{n:3, gap:0.45,sz:0.95,pw:0, eff:null}
};
function showLength(id){ const f=SHOWS[id]; if(!f) return 0; let t=0; f().forEach(p=>{ t+=(p.n||1)*(p.gap===undefined?0.45:p.gap)+(p.pause||0); }); return Math.round(t); }

/* =========================================================
   Zünden
   ========================================================= */
function igniteType(t,o0){
  const p=P[t]; if(!p||!p.cat) return;
  /* o0: der Platz des Produkts auf der Station. Ohne Angabe (alte
     Aufrufe, Tests) die Mitte der passenden Station. */
  const o=o0||padOf(t), sh=p.shape;
  hype=Math.min(100,hype+p.hype); DS.burned=r2(DS.burned+costOf(t)); addXP(Math.max(1,Math.round(p.hype/3)));
  statAdd('gezuendet',1); statAdd('hype',p.hype);
  if(SHOWS[t]){ emitters.push({t:0.8,k:'fuse',o}); later(0.8,()=>playShow(o,SHOWS[t](),t)); return; }
  /* ----- Eigene Rezeptur: das Rezept sagt, was passiert ----- */
  if(p.rezept){
    const rz=p.rezept, tr=traegerVon(rz.traeger);
    const A=K(rz.A)||FW.gold, B=K(rz.B)||FW.weiss;
    const st=rz.eff2?[{t:0.55,eff:rz.eff2,sz:tr.kal*0.6,streu:5,A:B,B:A}]:null;
    if(tr.shape==='shell'){
      kugelbombe(o,rz.traeger==='kugel100'?2:1,{A,B,eff:rz.eff});
    } else if(tr.shape==='battery'){
      emitters.push({t:0.7,k:'fuse',o});
      for(let i=0;i<tr.schuss;i++) later(0.7+i*0.32,()=>
        shot(o,{sz:tr.kal,eff:rz.eff,A,B,ang:rand(-0.08,0.08),stufen:i===tr.schuss-1?st:null}));
    } else if(tr.shape==='cylinder'){
      const v=distVol(o);
      emitters.push({t:3.2,k:'fountain',o,A:FW.gold,B:A});
      sfx.fizz(v); later(1.6,()=>sfx.fizz(v));
      later(3.2,()=>shot(o,{pw:3,sz:tr.kal*1.2,eff:rz.eff,A,B,fuse:1.3,dick:1,stufen:st}));
    } else {
      for(let i=0;i<tr.schuss;i++) later(i*0.45,()=>
        shot(o,{pw:tr.kal>1.1?3:0,sz:tr.kal,eff:rz.eff,A,B,stufen:i===tr.schuss-1?st:null}));
    }
    return;
  }
  /* ----- Kugelbomben aus der Moerserbatterie ----- */
  if(sh==='shell'){
    const kal={kugel75:1,kugel100:2,kugel150:3,kugel200:4,kugel300:5}[t]||1;
    kugelbombe(o,kal);
    return;
  }
  /* ----- Riesenfontaenen -----
     Fontaene ist Fontaene (Toms PDF vom 25.09.): aus keiner Fontaene
     steigt mehr eine Ladung, ein Komet oder eine Rakete. Vorher warfen
     Geysir, Feuersaeule, Feuerbrunnen, Vulkan, Sternenbrunnen und das
     Fontaenen-Set zum Schluss noch Kometen mit Bluete aus. */
  if(t==='goldgeysir'||t==='feuersaeule'){
    const gross=t==='feuersaeule', dauer=gross?28:20;
    const e={t:dauer,k:'riesen',o,h:gross?1.35:1,A:FW.gold,B:FW.weiss};
    emitters.push(e);
    /* die Feuersaeule wechselt alle paar Sekunden die Farbe */
    if(gross) for(let i=1;i<6;i++) later(i*dauer/6,()=>{ const [A,B]=scheme(); e.A=A; e.B=FW.gold; e.C=B; });
    return;
  }
  /* Monsterfontaenen: 30 m mit fuenf Farben, 50 m im vollen Regenbogen
     mit Farbwechsel - kurz und gewaltig statt lang */
  if(t==='fontaene30'){ monsterFontaene(o,30,12,['rot','gold','gruen','tuerkis','violett']); return; }
  if(t==='fontaene50'){ monsterFontaene(o,50,14,['rot','orange','zitrone','gruen','tuerkis','blau','violett','magenta'],true); return; }
  /* ----- Feuerbrunnen: Flammenfontaene, die in Stoessen grosse
     Flammenbaelle wirft ----- */
  if(t==='feuerbrunnen'){
    emitters.push({t:16,k:'feuerbrunnen',o,h:1}); sfx.fizz(distVol(o));
    return;
  }
  /* ----- Sternenbrunnen: Goldfontaene, in der farbige Sterne steigen ----- */
  if(t==='sternenbrunnen'){
    const [A,B]=scheme(), v=distVol(o);
    emitters.push({t:5,k:'fountain',o,A:FW.gold,B:A});
    for(let i=0;i<5;i++) later(0.4+i*0.9,()=>{ const c=i%2?B:A;
      for(let k=0;k<Math.round(26*QUAL());k++){ const a=Math.random()*Math.PI*2, w=rand(0.2,1.1);
        psBig.emit(o.x,o.y+0.3,o.z,Math.cos(a)*w,rand(8,11),Math.sin(a)*w,c[0],c[1],c[2],rand(1.2,1.7),6,0); } });
    sfx.fizz(v); later(1.6,()=>sfx.fizz(v)); later(3.2,()=>sfx.fizz(v));
    return;
  }
  /* ----- Schabernack-Edition ----- */
  if(t==='furzrakete'){
    const v=distVol(o);
    for(let i=0;i<3;i++) later(i*1.5,()=>{
      emitters.push({t:0.55,k:'fuse',o});
      later(0.55,()=>{
        emitters.push({t:1.5,k:'furzfont',o});
        sfx.pfffft(v);
        /* die Rakete selbst: langsamer Aufstieg, dann die Entladung */
        shot(o,{pw:-4,sz:1.5,eff:'furz',A:FW.braun,B:FW.sumpf,fuse:1.55,trail:FW.braun});
        later(2.0,()=>{ sfx.furz(Math.min(1.5,v*1.3)); shake=Math.max(shake,0.5*v); });
      });
    });
    return;
  }
  if(sh==='sparkler'){ emitters.push({t:5,k:'spark',o}); sfx.fizz(distVol(o)); }
  else if(t==='knallerbsen'||t==='knallfrosch'){
    const n=t==='knallfrosch'?10:7;
    for(let i=0;i<n;i++) later(i*0.16+rand(0,.1),()=>{ smallPop(o.x+rand(-1.2,1.2),0.15,o.z+rand(-1.2,1.2),14,3,0.35); sfx.crack(distVol(o)*0.6); });
  }
  else if(t==='schwaermer'){
    for(let i=0;i<9;i++) later(i*0.3+rand(0,.15),()=>{
      const x=o.x+rand(-1.4,1.4), z=o.z+rand(-1.4,1.4), c=K(pick(['gold','zitrone','tuerkis','magenta','limette']));
      for(let k=0;k<40;k++){ const a=Math.random()*Math.PI*2, s=rand(1,5);
        psMid.emit(x,0.2,z,Math.cos(a)*s,rand(0.5,3.5),Math.sin(a)*s,c[0],c[1],c[2],rand(0.5,1.1),4,4); }
      sfx.whistle(distVol(o)*0.5); if(Math.random()<0.5) later(0.6,()=>sfx.crack(distVol(o)*0.5));
    });
  }
  else if(t==='wasserfall'){
    emitters.push({t:22,k:'wasserfall',o,A:FW.gold,B:FW.zitrone});
    sfx.fizz(distVol(o)); for(let i=1;i<8;i++) later(i*3,()=>sfx.fizz(distVol(o)));
  }
  /* Boeller (Toms PDF vom 25.09.): Furz, Monster, Atombombe */
  else if(t==='boeller'){
    emitters.push({t:1.2,k:'fuse',o});
    later(1.2,()=>{ const v=distVol(o), yb=o.y!==undefined?o.y:0.4;
      smallPop(o.x,yb,o.z,36,4,0.5,FW.senf);
      flash({x:o.x,y:yb+0.4,z:o.z},FW.sumpf,1.1,0.3);
      /* braune Spritzer, die kurz hochfliegen und zurueckfallen */
      for(let i=0;i<Math.round(60*QUAL());i++){ const a=Math.random()*Math.PI*2, w=rand(0.5,2.2), c=i%3?FW.braun:FW.sumpf;
        psMid.emit(o.x,yb+0.1,o.z,Math.cos(a)*w,rand(2,5),Math.sin(a)*w,c[0],c[1],c[2],rand(0.9,1.6),7,0); }
      sfx.pups(v); furzwolke({x:o.x,y:yb,z:o.z});
      shake=Math.max(shake,0.25*v); });
  }
  else if(t==='monsterboeller'){
    emitters.push({t:1.5,k:'fuse',o});
    later(1.5,()=>monsterknall({x:o.x,y:o.y!==undefined?o.y:0.4,z:o.z}));
  }
  else if(t==='atomboeller'){
    /* Die Zuendschnur brennt etwas laenger, dann steigt die Bombe mit
       dicker Glutspur auf und geht auf rund 25 m als Pilz auf. Sie
       steigt leicht schraeg vom Pult weg: der Pilz wird ueber 40 m
       breit und hoch, und erst aus gut 20 m Abstand passt er ganz
       ins Bild. */
    emitters.push({t:1.8,k:'fuse',o});
    later(1.8,()=>shot(o,{pw:2,sz:1,eff:'atom',fuse:2.2,dick:2,trail:FW.orange,A:FW.orange,B:FW.gold,ang:0.36,dir:Math.PI}));
  }
  else if(sh==='tubepack'){
    emitters.push({t:1.4,k:'fuse',o});
    later(1.4,()=>{ const v=distVol(o), yb=o.y!==undefined?o.y:0.4;
      smallPop(o.x,yb,o.z,100,8,0.6); sfx.boom(v); shake=Math.max(shake,0.45*v);
      flash({x:o.x,y:yb+0.4,z:o.z},FW.bernstein,1.2,0.3); });
  }
  else if(t==='tisch'){
    sfx.crack(distVol(o));
    for(let i=0;i<130;i++){ const d=randDir(), c=K(pick(['gold','magenta','tuerkis','limette','rose','zitrone']));
      psMid.emit(o.x,o.y+0.15,o.z,d[0]*2.5,Math.abs(d[1])*5+2,d[2]*2.5,c[0],c[1],c[2],rand(1.8,2.8),2.2,4); }
  }
  else if(t==='vulkan'){
    const [A,B]=scheme();
    emitters.push({t:12,k:'volcano',o,A:FW.gold,B});
    sfx.fizz(distVol(o)); for(let i=1;i<6;i++) later(i*2,()=>sfx.fizz(distVol(o)));
    /* zum Schluss bricht er noch einmal auf - ohne Ladung */
    later(9,()=>emitters.push({t:3,k:'volcano',o,A:B,B:FW.weiss}));
  }
  else if(sh==='fountainset'){
    const [A,B]=scheme();
    emitters.push({t:8,k:'fountain',o,A:FW.gold,B:A});
    sfx.fizz(distVol(o)); later(2.5,()=>sfx.fizz(distVol(o)));
    later(5,()=>{ emitters.push({t:5,k:'fountain',o,A:B,B:FW.weiss}); sfx.fizz(distVol(o)); });
  }
  else if(sh==='rocketset'){
    const KL=RAKETEN_KL[t]||{n:3,gap:0.45,sz:0.95,pw:0,eff:null};
    for(let i=0;i<KL.n;i++) later(i*KL.gap,()=>{
      const AB=KL.th?themaPaar(KL.th,Math.floor(i/(KL.gruppe||1))):null;
      shot(o,{pw:KL.pw,sz:KL.sz,eff:KL.eff?KL.eff[i%KL.eff.length]:pick(EFF_GROSS),
        ...(AB?{A:AB[0],B:AB[1]}:{sc:-1}),
        pfeif:KL.pfeif,dick:KL.dick,trail:KL.trail?FW[KL.trail]:KL.dick?FW.weiss:undefined,fuse:KL.fuse,
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

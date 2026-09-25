
/* =========================================================
   Produktdaten
   cat: 1 = Feuerwerk F1, 2 = Feuerwerk F2, 0 = Silvester-Zubehör
   grid: [Spalten, Reihen, Stapel] im Regalfach -> Fassungsvermögen
   box:  Stück pro Karton (passt meist genau oder halb ins Fach)
   ========================================================= */
const P={
  wunder:{name:'XXL-Wunderkerzen',short:'Wunderkerzen',cat:1,lvl:1,shape:'sparkler',dims:[0.105,0.30,0.032],grid:[12,3,1],box:36,cost:0.55,market:1.49,weight:10,hype:3,risk:1,
    art:{title:'GOLDREGEN',sub:'XXL 50 cm',bg1:'#26307a',bg2:'#0b0f2e',ac:'#ffcf3a',ac2:'#ff6a3d'}},
  knallerbsen:{name:'Knallerbsen',short:'Knallerbsen',cat:1,lvl:1,shape:'boxA',dims:[0.085,0.05,0.055],grid:[8,2,2],box:32,cost:0.35,market:0.99,weight:9,hype:2,risk:1,
    art:{title:'KNALLERBSEN',sub:'50 Stück',bg1:'#3d9be8',bg2:'#1557a8',ac:'#ffffff',ac2:'#ffd23f',peas:true}},
  tisch:{name:'Tischfeuerwerk',short:'Tischfeuerwerk',cat:1,lvl:1,shape:'cylinder',dims:[0.10,0.21,0.10],grid:[8,2,1],box:16,cost:1.10,market:2.99,weight:8,hype:5,risk:2,
    art:{title:'PARTYZAUBER',sub:'Tischfeuerwerk',bg1:'#ff4fa3',bg2:'#6a24c9',ac:'#ffe45c',ac2:'#5ce1ff'}},
  knallfrosch:{name:'Knallfrösche',short:'Knallfrösche',cat:1,lvl:2,shape:'boxA',dims:[0.075,0.045,0.05],grid:[8,2,2],box:20,cost:0.60,market:1.69,weight:8,hype:4,risk:1,
    art:{title:'HÜPFER',sub:'20er Kette',bg1:'#2f9e57',bg2:'#0d3a20',ac:'#ffd23f',ac2:'#ff7a3d'}},
  feuerzeug:{name:'Sturmfeuerzeuge',short:'Feuerzeuge',cat:0,lvl:3,shape:'lighter',dims:[0.032,0.075,0.022],grid:[12,2,1],box:24,cost:0.45,market:1.29,weight:9,hype:0,risk:3,
    art:{title:'STURM',sub:'Windfest',bg1:'#c01c20',bg2:'#3a0507',ac:'#ffd23f',ac2:'#f2f5ff'}},
  luftschlangen:{name:'Partyset Luftschlangen',short:'Partyset',cat:0,lvl:3,shape:'boxA',dims:[0.115,0.16,0.05],grid:[10,2,1],box:20,cost:1.20,market:3.29,weight:7,hype:0,risk:1,
    art:{title:'PARTY',sub:'Schlangen & Tröten',bg1:'#ff4fa3',bg2:'#8a1f6a',ac:'#ffe45c',ac2:'#5ce1ff'}},
  boeller:{name:'Roter Donner · 9 Böller',short:'Böller',cat:2,lvl:4,shape:'tubepack',dims:[0.15,0.057,0.057],grid:[8,2,2],box:16,cost:1.90,market:4.49,weight:9,hype:8,risk:4,
    art:{title:'ROTER DONNER',sub:'9 Böller',bg1:'#f7ecd2',bg2:'#ead7ab',ac:'#c8201c',ac2:'#1b1b1b',light:true}},
  sekt:{name:'Sekt Halbtrocken',short:'Sekt',cat:0,lvl:5,cold:true,shape:'bottle',dims:[0.078,0.30,0.078],grid:[12,2,1],box:12,cost:2.40,market:5.99,weight:10,hype:0,risk:5,
    art:{title:'MITTERNACHT',sub:'Sekt 0,75 l',bg1:'#1b3a2e',bg2:'#08160f',ac:'#e8c35a',ac2:'#f2f5ff'}},
  brille:{name:'Partybrillen 2027',short:'Partybrillen',cat:0,lvl:5,shape:'boxA',dims:[0.13,0.055,0.085],grid:[9,2,1],box:18,cost:1.10,market:2.99,weight:6,hype:0,risk:2,
    art:{title:'2027',sub:'Partybrille',bg1:'#ffd23f',bg2:'#f28a1c',ac:'#0e1226',ac2:'#e63b2e',light:true}},
  raketenklein:{name:'Sternschnuppe · 3er Raketenset',short:'Raketen 3er',cat:2,lvl:6,shape:'rocketset',dims:[0.42,0.055,0.11],grid:[4,2,2],box:8,cost:2.60,market:6.49,weight:8,hype:10,risk:4,
    art:{title:'KLEINER FLUG',sub:'3 Raketen',bg1:'#35157a',bg2:'#0c0626',ac:'#ffd23f',ac2:'#ff4fa3'}},
  konfetti:{name:'Konfettikanone',short:'Konfetti',cat:0,lvl:7,shape:'cylinder',dims:[0.055,0.21,0.055],grid:[12,2,1],box:12,cost:1.60,market:3.99,weight:6,hype:0,risk:2,
    art:{title:'KONFETTI',sub:'Kanone 40 cm',bg1:'#5ce1ff',bg2:'#1557a8',ac:'#ff4fa3',ac2:'#ffe45c'}},
  chips:{name:'Knabberbox',short:'Knabberzeug',cat:0,lvl:7,shape:'boxA',dims:[0.14,0.20,0.06],grid:[10,2,1],box:20,cost:1.00,market:2.49,weight:8,hype:0,risk:3,
    art:{title:'KNABBERBOX',sub:'Salzig & scharf',bg1:'#f28a1c',bg2:'#8a3d06',ac:'#ffffff',ac2:'#e63b2e'}},
  fontaene:{name:'Feuerquelle · 3er Fontänen-Set',short:'Fontänen',cat:2,lvl:8,shape:'fountainset',dims:[0.22,0.145,0.09],grid:[7,2,1],box:7,cost:3.20,market:7.99,weight:7,hype:12,risk:4,
    art:{title:'FEUERQUELLE',sub:'3er Fontänen-Set',bg1:'#12735a',bg2:'#063328',ac:'#ffd23f',ac2:'#ff7a3d'}},
  kanonen:{name:'Donnerkeil · 6 Kanonenschläge',short:'Kanonen',cat:2,lvl:9,shape:'tubepack',dims:[0.125,0.062,0.062],grid:[8,2,2],box:20,cost:3.40,market:7.99,weight:7,hype:14,risk:5,
    art:{title:'DONNERKEIL',sub:'6 Kanonenschläge',bg1:'#2a2f3d',bg2:'#0b0d14',ac:'#ff7a3d',ac2:'#ffd23f'}},
  raketen:{name:'Sternenflug · 20 Raketen',short:'Raketen 20er',cat:2,lvl:10,shape:'rocketset',dims:[0.52,0.075,0.20],grid:[3,2,2],box:6,cost:7.50,market:17.99,weight:7,hype:20,risk:6,
    art:{title:'STERNENFLUG',sub:'20 Raketen',bg1:'#35157a',bg2:'#0c0626',ac:'#ffd23f',ac2:'#ff4fa3'}},
  pfeifraketen:{name:'Pfeifende Teufel · 10 Heulraketen',short:'Pfeifraketen',cat:2,lvl:11,shape:'rocketset',dims:[0.44,0.06,0.13],grid:[4,2,2],box:8,cost:4.80,market:11.99,weight:7,hype:18,risk:5,
    art:{title:'PFEIFENDE TEUFEL',sub:'10 Heulraketen',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  bleigiessen:{name:'Wachsgießen-Set',short:'Wachsgießen',cat:0,lvl:11,shape:'boxA',dims:[0.105,0.04,0.095],grid:[8,2,2],box:20,cost:1.80,market:4.49,weight:5,hype:0,risk:2,
    art:{title:'ORAKEL',sub:'Wachsgießen',bg1:'#6a24c9',bg2:'#25093f',ac:'#ffd23f',ac2:'#5ce1ff'}},
  kindersekt:{name:'Kindersekt',short:'Kindersekt',cat:0,lvl:11,cold:true,shape:'bottle',dims:[0.07,0.26,0.07],grid:[12,2,1],box:12,cost:1.60,market:3.79,weight:6,hype:0,risk:3,
    art:{title:'KLEINER RUTSCH',sub:'Alkoholfrei 0,5 l',bg1:'#e58c85',bg2:'#8a2f2a',ac:'#ffe45c',ac2:'#f2f5ff'}},
  vulkan:{name:'Vulkan XXL · 90 Sekunden Fontäne',short:'Vulkan',cat:2,lvl:12,shape:'cylinder',dims:[0.13,0.30,0.13],grid:[8,2,1],box:8,cost:6.50,market:14.99,weight:6,hype:22,risk:6,
    art:{title:'VULKAN',sub:'XXL Fontäne 90 s',bg1:'#c01c20',bg2:'#3a0507',ac:'#ffd23f',ac2:'#ff8a2a'}},
  batterie16:{name:'Funkenflug · 16 Schuss',short:'Batterie 16',cat:2,lvl:13,shape:'battery',dims:[0.20,0.17,0.20],grid:[8,2,1],box:8,cost:9.00,market:21.99,weight:6,hype:26,risk:7,
    art:{title:'NACHTHIMMEL',sub:'16 Schuss Verbund',bg1:'#1f3f8a',bg2:'#070e22',ac:'#ffd23f',ac2:'#5ce1ff'}},
  batterie49:{name:'Feuersturm · 49 Schuss',short:'Batterie 49',cat:2,lvl:15,shape:'battery',dims:[0.30,0.24,0.30],grid:[5,1,1],box:5,cost:16.00,market:39.99,weight:5,hype:40,risk:8,
    art:{title:'FEUERSTURM',sub:'49 Schuss Verbund',bg1:'#c01c20',bg2:'#3a0507',ac:'#ffd23f',ac2:'#ff8a2a'}},
  batterie100:{name:'Himmelssturm · 100 Schuss',short:'Verbund 100',cat:2,lvl:17,shape:'battery',dims:[0.38,0.30,0.36],grid:[4,1,1],box:2,cost:32.00,market:74.99,weight:4,hype:60,risk:9,
    art:{title:'HIMMELSSTURM',sub:'100 Schuss, 90 s',bg1:'#2a0f5a',bg2:'#0a0318',ac:'#ff4fa3',ac2:'#ffd23f'}},
  grossboeller:{name:'Großer Knall · 8 große Böller',short:'Große Böller',cat:2,lvl:7,shape:'tubepack',dims:[0.16,0.07,0.07],grid:[7,2,2],box:14,cost:3.10,market:7.49,weight:8,hype:12,risk:6,
    art:{title:'GROSSER KNALL',sub:'8 große Böller',bg1:'#f2ecd8',bg2:'#d8c49a',ac:'#b81a16',ac2:'#1b1b1b',light:true}},
  sprengmeister:{name:'Sprengmeister · 6 Stück Profiklasse',short:'Sprengmeister',cat:2,lvl:15,shape:'tubepack',dims:[0.19,0.085,0.085],grid:[6,2,1],box:6,cost:7.80,market:18.99,weight:6,hype:30,risk:9,
    art:{title:'SPRENGMEISTER',sub:'6 Stück, Profiklasse',bg1:'#26292f',bg2:'#000000',ac:'#ff7a1c',ac2:'#ffd23f'}},
  xxlpolen:{name:'XXL »Ich bomb dich weg Junge«',short:'XXL Bomber',cat:2,lvl:19,shape:'tubepack',dims:[0.22,0.105,0.105],grid:[5,1,1],box:5,cost:16.00,market:39.99,weight:5,hype:55,risk:10,
    art:{title:'ICH BOMB DICH WEG',sub:'XXL Import · 5 Stück',bg1:'#d8151c',bg2:'#6a0409',ac:'#ffffff',ac2:'#ffd23f'}},
  knicklichter:{name:'Knicklichter 50er',short:'Knicklichter',cat:0,lvl:4,shape:'boxA',dims:[0.10,0.14,0.05],grid:[10,2,1],box:20,cost:0.80,market:2.29,weight:7,hype:0,risk:2,
    art:{title:'GLOW',sub:'50 Knicklichter',bg1:'#1b1b2e',bg2:'#070712',ac:'#5cff9e',ac2:'#ff4fd8'}},
  schwaermer:{name:'Wirbelwind · 12 Bodenwirbel',short:'Schwärmer',cat:2,lvl:5,shape:'boxA',dims:[0.115,0.06,0.075],grid:[8,2,2],box:16,cost:1.40,market:3.49,weight:8,hype:6,risk:3,
    art:{title:'WIRBELWIND',sub:'12 Bodenwirbel',bg1:'#f2a01c',bg2:'#8a3d06',ac:'#ffffff',ac2:'#c8201c'}},
  roemisch:{name:'Roma · Römische Lichter 5er',short:'Röm. Lichter',cat:2,lvl:8,shape:'candle',dims:[0.10,0.34,0.10],grid:[8,2,1],box:8,cost:3.60,market:8.99,weight:7,hype:15,risk:5,
    art:{title:'ROMA',sub:'5 Lichter, 10 Schuss',bg1:'#7a1f3d',bg2:'#2a0714',ac:'#ffd23f',ac2:'#5ce1ff'}},
  doppelschlag:{name:'Zwei Schläge · 6 Doppelschläge',short:'Doppelschlag',cat:2,lvl:10,shape:'tubepack',dims:[0.135,0.06,0.06],grid:[8,2,2],box:16,cost:4.20,market:9.99,weight:6,hype:17,risk:6,
    art:{title:'ZWEI SCHLÄGE',sub:'6 Doppelschläge',bg1:'#1f1f26',bg2:'#000000',ac:'#ff7a3d',ac2:'#ffd23f',light:false}},
  raketengold:{name:'Goldregen · 5 Brokatraketen',short:'Goldraketen',cat:2,lvl:12,shape:'rocketset',dims:[0.48,0.065,0.145],grid:[3,2,2],box:6,cost:8.50,market:19.99,weight:6,hype:24,risk:6,
    art:{title:'GOLDFLUG',sub:'5 Brokatraketen',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  titanraketen:{name:'Titan · 3 XXL-Raketen Dreifachbruch',short:'Titan',cat:2,lvl:20,shape:'rocketset',dims:[0.62,0.085,0.18],grid:[3,1,1],box:3,cost:19.00,market:44.99,weight:5,hype:44,risk:9,
    art:{title:'TITAN',sub:'3 XXL-Raketen · Dreifachbruch',bg1:'#26292f',bg2:'#000000',ac:'#d1e5ff',ac2:'#ffd23f'}},
  sortiment:{name:'Familienfest · 18 Teile gemischt',short:'Sortiment',cat:2,lvl:13,shape:'assort',dims:[0.40,0.16,0.30],grid:[4,1,1],box:2,cost:18.00,market:42.99,weight:6,hype:34,risk:6,
    art:{title:'FAMILIENFEST',sub:'18 Teile gemischt',bg1:'#2f5d9e',bg2:'#0a1a33',ac:'#ffd23f',ac2:'#ff4fa3'}},
  /* Knattersturm: ersetzt den alten 25er. Jeder Schuss knistert,
     dazwischen Salven aus fuenf Rohren auf einmal. */
  knatter:{name:'Knattersturm · 30 Schuss Crackling',short:'Knatter 30',cat:2,lvl:14,shape:'battery',dims:[0.24,0.20,0.24],grid:[7,1,1],box:7,cost:13.00,market:30.99,weight:6,hype:34,risk:7,
    art:{title:'KNATTERSTURM',sub:'30 Schuss Crackling',bg1:'#12406b',bg2:'#04121f',ac:'#5ce1ff',ac2:'#ffd23f'}},
  faecher:{name:'Weitwinkel · 36 Schuss Fächer',short:'Fächer 36',cat:2,lvl:16,shape:'fan',dims:[0.42,0.22,0.26],grid:[4,1,1],box:2,cost:24.00,market:54.99,weight:5,hype:48,risk:8,
    art:{title:'WEITWINKEL',sub:'36 Schuss im Fächer',bg1:'#5a1470',bg2:'#1a0322',ac:'#ff4fa3',ac2:'#5cff9e'}},
  zfaecher:{name:'Blitzgewitter · 48 Schuss Z-Fächer',short:'Z-Fächer 48',cat:2,lvl:17,shape:'fan',dims:[0.46,0.22,0.28],grid:[4,1,1],box:2,cost:27.00,market:61.99,weight:5,hype:52,risk:8,
    art:{title:'BLITZGEWITTER',sub:'48 Schuss Z-Fächer',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  kometen:{name:'Kometenregen · 64 Schuss Brokat',short:'Kometen 64',cat:2,lvl:19,shape:'battery',dims:[0.34,0.26,0.32],grid:[4,1,1],box:3,cost:36.00,market:82.99,weight:4,hype:66,risk:9,
    art:{title:'KOMETENREGEN',sub:'64 Schuss Brokat',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#ff7a3d',gold:true}},
  /* Riesenfontaenen: zehn bzw. fuenfzehn Meter Feuer vom Boden */
  goldgeysir:{name:'Goldgeysir · 10-m-Riesenfontäne',short:'Goldgeysir',cat:2,lvl:14,shape:'cylinder',dims:[0.2,0.34,0.2],grid:[8,1,1],box:4,cost:11.00,market:26.99,weight:5,hype:36,risk:7,
    art:{title:'GOLDGEYSIR',sub:'10 m Riesenfontäne · 20 s',bg1:'#6b4a0c',bg2:'#1f1402',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  feuersaeule:{name:'Feuersäule · 15-m-Farbfontäne',short:'Feuersäule',cat:2,lvl:20,shape:'cylinder',dims:[0.24,0.4,0.24],grid:[6,1,1],box:3,cost:24.00,market:57.99,weight:4,hype:62,risk:9,
    art:{title:'FEUERSÄULE',sub:'15 m · Farbwechsel · 28 s',bg1:'#7a1010',bg2:'#1a0202',ac:'#ff7a1c',ac2:'#ffd23f',gold:true}},
  wasserfall:{name:'Niagara · Silberwasserfall 3 m',short:'Wasserfall',cat:2,lvl:18,shape:'cylinder',dims:[0.16,0.36,0.16],grid:[10,1,1],box:5,cost:14.00,market:32.99,weight:4,hype:38,risk:7,
    art:{title:'NIAGARA',sub:'3 m Silberfall, 60 s',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  bowle:{name:'Feuerzangenbowle-Set',short:'Bowle-Set',cat:0,lvl:13,shape:'boxA',dims:[0.18,0.14,0.14],grid:[8,1,1],box:8,cost:6.50,market:15.99,weight:5,hype:0,risk:3,
    art:{title:'FEUERZANGE',sub:'Zange, Zucker, Rum',bg1:'#6b2410',bg2:'#1f0a04',ac:'#ffb03a',ac2:'#f2e6c4'}},
  blanko:{name:'Blanko-Raketen',short:'Blanko',cat:2,lvl:9,shape:'rocketset',dims:[0.42,0.055,0.11],grid:[4,2,2],box:12,cost:3.20,market:6.99,weight:0,hype:9,risk:3,noShelf:true,noWish:true,
    art:{title:'BLANKO',sub:'Für Gravur',bg1:'#4a4f5e',bg2:'#1b1e28',ac:'#f2f5ff',ac2:'#ffd23f'}},
  gravur:{name:'Gravur-Rakete',short:'Gravur',cat:2,lvl:9,shape:'rocketset',dims:[0.42,0.055,0.11],grid:[1,1,1],box:1,cost:3.20,market:24.99,weight:0,hype:16,risk:7,noShelf:true,noWish:true,noOrder:true,
    art:{title:'FÜR DICH',sub:'Persönliche Gravur',bg1:'#6a24c9',bg2:'#25093f',ac:'#ffd23f',ac2:'#ff4fa3'}},
  donnerwand:{name:'Donnerwand · 120 Schuss Salvenwand',short:'Donnerwand',cat:2,lvl:20,shape:'battery',dims:[0.5,0.3,0.4],grid:[3,1,1],box:2,cost:47.00,market:109.99,weight:3,hype:78,risk:10,
    art:{title:'DONNERWAND',sub:'120 Schuss · 20 Salven',bg1:'#1c1c24',bg2:'#000000',ac:'#ff3b2e',ac2:'#f2f5ff'}},
  profi:{name:'Götterfunken · 200 Schuss Profiverbund',short:'Götterfunken',cat:2,lvl:22,shape:'battery',dims:[0.55,0.36,0.42],grid:[3,1,1],box:1,cost:68.00,market:149.99,weight:3,hype:90,risk:10,
    art:{title:'GÖTTERFUNKEN',sub:'200 Schuss Profi',bg1:'#0e1226',bg2:'#000000',ac:'#ffd23f',ac2:'#e63b2e',gold:true}},
  finale:{name:'Weltuntergang · 300 Schuss Finale',short:'Weltuntergang',cat:2,lvl:24,shape:'battery',dims:[0.58,0.34,0.42],grid:[2,1,1],box:1,cost:115.00,market:249.99,weight:2,hype:100,risk:10,
    art:{title:'WELTUNTERGANG',sub:'300 Schuss · 3 Minuten',bg1:'#3a0507',bg2:'#000000',ac:'#ff3b2e',ac2:'#ffd23f',gold:true}},
  /* Schabernack-Edition: der Spaßkram ganz am Ende */
  heuler:{name:'Heulender Derwisch',short:'Heuler',cat:2,lvl:19,shape:'tubepack',dims:[0.14,0.065,0.065],grid:[8,2,2],box:12,cost:3.40,market:8.49,weight:8,hype:16,risk:5,
    art:{title:'DERWISCH',sub:'6 Heuler mit Knall',bg1:'#2a1f5a',bg2:'#0a0620',ac:'#ff9d2a',ac2:'#5ce1ff'}},
  furzrakete:{name:'Furzrakete »Donnerbalken«',short:'Furzrakete',cat:2,lvl:19,shape:'rocketset',dims:[0.44,0.06,0.12],grid:[4,2,2],box:6,cost:6.20,market:15.99,weight:9,hype:28,risk:4,
    art:{title:'DONNERBALKEN',sub:'3 Furzraketen',bg1:'#6b4a1c',bg2:'#241504',ac:'#c8e04a',ac2:'#ffd23f'}},
  /* Kugelbomben: gehoeren in die Moerserbatterie, nicht auf den Tisch.
     Eine Kugel, ein Aufstieg, oben mehrere Brueche nacheinander. */
  kugel75:{name:'Herzschlag · Kugelbombe 75 mm',short:'Kugel 75',cat:2,lvl:14,shape:'shell',dims:[0.09,0.115,0.09],grid:[8,2,1],box:8,cost:5.40,market:13.49,weight:7,hype:24,risk:7,
    art:{title:'HERZSCHLAG',sub:'Kugelbombe 75 mm',bg1:'#8a1230',bg2:'#2a0410',ac:'#ff4f7a',ac2:'#ffd23f'}},
  kugel100:{name:'Drachenblut · Kugelbombe 100 mm',short:'Kugel 100',cat:2,lvl:16,shape:'shell',dims:[0.12,0.15,0.12],grid:[6,2,1],box:6,cost:11.50,market:27.99,weight:6,hype:38,risk:8,
    art:{title:'DRACHENBLUT',sub:'Kugelbombe 100 mm · Doppelbruch',bg1:'#5a0f10',bg2:'#1a0304',ac:'#ff6a2a',ac2:'#ffd23f'}},
  kugel150:{name:'Weltenbrand · Kugelbombe 150 mm',short:'Kugel 150',cat:2,lvl:18,shape:'shell',dims:[0.165,0.20,0.165],grid:[4,1,1],box:3,cost:29.00,market:69.99,weight:5,hype:70,risk:10,
    art:{title:'WELTENBRAND',sub:'Kugelbombe 150 mm · Mehrfachbruch',bg1:'#1a0b2e',bg2:'#050109',ac:'#c8a2ff',ac2:'#ffd23f',gold:true}},
  kugel200:{name:'Götterzorn · Kugelbombe 200 mm Zehnfachbruch',short:'Kugel 200',cat:2,lvl:21,shape:'shell',dims:[0.21,0.25,0.21],grid:[3,1,1],box:2,cost:44.00,market:104.99,weight:4,hype:95,risk:10,
    art:{title:'GÖTTERZORN',sub:'200 mm · zehn Brüche auf einmal',bg1:'#2a0f5a',bg2:'#050109',ac:'#ff4fd8',ac2:'#ffd23f',gold:true}},
  kugel300:{name:'Himmelsbrecher · Kugelbombe 300 mm',short:'Kugel 300',cat:2,lvl:23,shape:'shell',dims:[0.3,0.34,0.3],grid:[2,1,1],box:1,cost:70.00,market:164.99,weight:3,hype:100,risk:10,
    art:{title:'HIMMELSBRECHER',sub:'300 mm · 24 Brüche · Silberweide',bg1:'#0e1226',bg2:'#000000',ac:'#d1e5ff',ac2:'#ffd23f',gold:true}},
  /* Feuerbrunnen: Flammenfontaene mit Flammenregen (Tom, 24.09.) */
  feuerbrunnen:{name:'Feuerbrunnen · Flammenfontäne 16 s',short:'Feuerbrunnen',cat:2,lvl:15,shape:'cylinder',dims:[0.18,0.32,0.18],grid:[8,1,1],box:4,cost:9.50,market:22.99,weight:5,hype:32,risk:7,
    art:{title:'FEUERBRUNNEN',sub:'Flammenfontäne · Flammenregen',bg1:'#8a1a08',bg2:'#240502',ac:'#ff8a2a',ac2:'#ffd23f',gold:true}},
  /* Fontaene, die oben in einen Kometen uebergeht und aufblueht */
  sternenbrunnen:{name:'Sternenbrunnen · Fontäne mit Aufstieg',short:'Sternenbrunnen',cat:2,lvl:12,shape:'cylinder',dims:[0.145,0.34,0.145],grid:[7,2,1],box:6,cost:7.90,market:18.99,weight:7,hype:26,risk:6,
    art:{title:'STERNENBRUNNEN',sub:'Fontäne, Komet, Blüte',bg1:'#123a6b',bg2:'#04101f',ac:'#5ce1ff',ac2:'#ffd23f'}}
};
const ORDER=Object.keys(P);
/* Kapitel: die grossen Stufen des Ladens. Jedes beginnt mit einem
   bestimmten Ausbau. */
/* Demo und Vollversion (Tom, 24.09.): Kapitel 1-6 bilden die Demo,
   die im Dezember erscheinen soll. Ab dem Logistikzentrum (Kapitel 7)
   ist alles Vollversion - dort kommen auch die eigene Fabrik und die
   eigenen Produkte. Kapitel 8-11 sind geplant, aber noch nicht gebaut;
   im Ausbau stehen sie als Vorschau. Pyro-Imperium ist das Finale
   (Kapitel 11): das Silvester-Stadtfeuerwerk, am Ende leuchtet die
   ganze Stadt. */
const KAPITEL=[
  {nr:1,name:'Pyro-Kiosk',up:null,txt:'Ein kleiner Laden, die Lieferungen kommen vor die Tür.'},
  {nr:2,name:'Kleines Fachgeschäft',up:'lager',txt:'Eigenes Lager mit Rampe: der LKW liefert direkt ans Rolltor.'},
  {nr:3,name:'Großes Fachgeschäft',up:'shop_gross',txt:'Das Ladenlokal nebenan gehört dir. Jetzt wird es richtig groß.'},
  {nr:4,name:'Pyro-Versand',up:'onlineshop',txt:'Onlineshop und Packstation: du verkaufst ins ganze Land.'},
  {nr:5,name:'Eigene Marke',up:'labor',txt:'Im Labor mischst du eigene Effekte und verkaufst sie unter deinem Namen.'},
  {nr:6,name:'Pyro-Kaufhaus',up:'shop_sued',txt:'Riesige Verkaufsfläche und ein zweiter Eingang mit eigener Kasse.'},
  {nr:7,name:'Pyro-Logistik',up:'lager_west',voll:true,txt:'Logistikzentrum mit Toren und Hof – der Grundstein für dein Imperium.'},
  {nr:8,name:'Pyro-Fabrik',up:'fabrik',voll:true,geplant:true,txt:'Eigene Fabrikhalle: du produzierst deine Feuerwerke selbst.',
    vorschau:['Fabrikhalle mit Mischraum und Fertigungsstraße','Eigene Produkte in Serie statt Einzelstücke aus dem Labor','Rohstoffe einkaufen, Qualität steuern']},
  {nr:9,name:'Pyro-Großhändler',up:'grosshandel',voll:true,geplant:true,txt:'Du belieferst andere Läden mit deinen eigenen Marken.',
    vorschau:['Händlerverträge und Lieferfristen','Eigene LKW-Flotte vom Logistikzentrum aus','Deine Marke in den Regalen der Konkurrenz']},
  {nr:10,name:'Pyro-Kette',up:'filialen',voll:true,geplant:true,txt:'Filialen in anderen Städten, geführt von deinem Team.',
    vorschau:['Filialen eröffnen und Filialleiter einstellen','Sortiment und Preise zentral steuern','Wettbewerb mit Ketten der Konkurrenz']},
  {nr:11,name:'Pyro-Imperium',up:'stadtfeuerwerk',voll:true,geplant:true,txt:'Das Finale: du zündest das offizielle Silvesterfeuerwerk der Stadt.',
    vorschau:['Offizielles Stadtfeuerwerk an Silvester, von dir geplant','Große Show mit Musik über der ganzen Stadt','Am Ende leuchtet die ganze Stadt – dein Imperium ist komplett']}
];
/* Demo-Schalter: an, sobald die Demo gebaut wird. Dann lassen sich die
   Vollversions-Kapitel ansehen, aber nicht kaufen. */
let DEMO=false;
const kapitelVoll=nr=>!!(KAPITEL[nr-1]&&KAPITEL[nr-1].voll);
/* Die Kapitel kommen der Reihe nach: wer ein spaeteres Kapitel schon
   eroeffnet hat, steigt erst auf, wenn die davor auch geschafft sind. */
function kapitelNr(){ let n=1; for(const k of KAPITEL){ if(!k.up) continue; if(S&&S.up&&S.up[k.up]) n=k.nr; else break; } return n; }
function kapitel(){ return KAPITEL[kapitelNr()-1]; }
const CATNAME={0:'Zubehör',1:'F1',2:'F2'};

/* Ausbau, Deko, Personal ---------------------------------- */
/* Regale stehen hier nicht mehr: sie werden bei Regalbau
   Stegemann bestellt und kommen mit dem LKW (siehe REGALWARE). */
const UPGRADES=[
  {id:'plakat',kat:'markt',lvl:4,name:'Werbeplakate in der Stadt',desc:'Dauerhaft rund 30 Prozent mehr Kunden.',cost:()=>400,done:()=>S.up.plakat},
  {id:'sackkarre',kat:'einr',lvl:3,name:'Sackkarre',desc:'Vier Kartons auf einmal. Mit K herausholen: jeder Karton, den du aufhebst, kommt mit drauf.',cost:()=>350,done:()=>S.up.sackkarre},
  {id:'wagen',kat:'einr',lvl:8,req:'lager',name:'Plattformwagen',desc:'Acht Kartons auf einmal - für den LKW und das Lager. Ersetzt die Sackkarre.',cost:()=>1400,done:()=>S.up.wagen},
  {id:'terminal',kat:'einr',lvl:6,name:'Kontaktlos-Terminal',desc:'Kartenzahlung geht deutlich schneller.',cost:()=>320,done:()=>S.up.terminal},
  {id:'tag4',kat:'markt',lvl:7,name:'Sonntagsgenehmigung',desc:'Du darfst auch sonntags öffnen. Sonst ist Sonntag Ruhetag.',cost:()=>900,done:()=>S.up.tag4},
  {id:'heizung',kat:'einr',lvl:7,name:'Heizstrahler',desc:'Kunden warten länger, bevor sie genervt gehen.',cost:()=>450,done:()=>S.up.heizung},
  {id:'musik',kat:'einr',lvl:8,name:'Soundanlage',desc:'Bessere Stimmung im Laden.',cost:()=>380,done:()=>S.up.musik},
  {id:'radio',kat:'markt',lvl:9,name:'Radiowerbung',desc:'Noch einmal rund 25 Prozent mehr Kunden.',cost:()=>1200,done:()=>S.up.radio},
  {id:'cams',kat:'einr',lvl:10,name:'Überwachungskameras',desc:'Halbiert die Zahl der Diebstahlversuche.',cost:()=>900,done:()=>S.up.cams},
  {id:'regallicht',kat:'einr',lvl:11,name:'Regalbeleuchtung',desc:'Ware wirkt hochwertiger, bessere Stimmung.',cost:()=>700,done:()=>S.up.regallicht},
  {id:'alarm',kat:'einr',lvl:14,name:'Warensicherung',desc:'Diebe werden am Ausgang meistens gestoppt.',cost:()=>2200,done:()=>S.up.alarm},
  {id:'grosskunden',kat:'markt',lvl:7,req:'lager',name:'Eintrag im Branchenbuch',desc:'Pyrotechniker und Veranstalter rufen dich für Großbestellungen an.',cost:()=>500,done:()=>S.up.grosskunden},
  {id:'onlineshop',kat:'flaeche',lvl:15,kap:4,name:'Onlineshop',desc:'Bringt jeden Tag Umsatz nebenbei, abhängig von deinem Ruf. Mit Packstation kommen die Bestellungen als echte Pakete ins Lager und bringen deutlich mehr.',cost:()=>3200,done:()=>S.up.onlineshop},
  {id:'kundenkarte',kat:'markt',lvl:21,name:'Stammkundenkarte',desc:'Stammkunden kommen öfter wieder und zahlen bereitwilliger.',cost:()=>2600,done:()=>S.up.kundenkarte},
  {id:'tafel',kat:'markt',lvl:23,name:'Digitale Werbetafel',desc:'Große Tafel an der Fassade. Noch einmal deutlich mehr Kundschaft.',cost:()=>4200,done:()=>S.up.tafel},
  {id:'lizenz',kat:'markt',lvl:25,name:'Großhandelslizenz',desc:'Alle Lieferanten geben dir zusätzlich zehn Prozent Nachlass.',cost:()=>6500,done:()=>S.up.lizenz},
  {id:'klima',kat:'einr',lvl:27,name:'Klima und Musikanlage XL',desc:'Deutlich bessere Stimmung, Kunden bleiben spürbar länger.',cost:()=>5400,done:()=>S.up.klima},
  {id:'meister',kat:'markt',lvl:30,name:'Meisterbrief Pyrotechnik',desc:'Die höchste Stufe. Großaufträge zahlen ein Drittel mehr.',cost:()=>12000,done:()=>S.up.meister},
  {id:'shop_halb',kat:'flaeche',lvl:3,name:'Ladenerweiterung 1 – etwas mehr Platz',desc:'Die zugemauerte Hälfte deines eigenen Ladenlokals: rund 70 Quadratmeter mehr, das zweite Schaufenster und zwei weitere Regalplätze. Die Trennwand fällt beim Kauf ganz weg — ein Raum, kein Pfeiler, kein Sturz. Dahinter liegt auch die Tür zum Testfeld.',cost:()=>1400,done:()=>S.up.shop_halb},
  {id:'testfeld',kat:'flaeche',lvl:5,req:'shop_halb',name:'Testfeld freischalten',desc:'Der abgesperrte Hof hinter dem Laden wird dein Testfeld: Zündtisch, Abschussröhren und Mörserbatterie. Erst damit kannst du selbst zünden — und was du gezündet hast, spricht sich herum.',cost:()=>3200,done:()=>S.up.testfeld},
  {id:'shop_gross',kat:'flaeche',lvl:11,req:'shop_halb',kap:3,name:'Ladenerweiterung 2 – deutlich mehr Platz',desc:'Kauft das leerstehende Ladenlokal nebenan. Die Seitenwand wird durchbrochen, die Schaufenster werden entmauert: rund 142 Quadratmeter mehr Fläche und zehn zusätzliche Regalplätze.',cost:()=>7500,done:()=>S.up.shop_gross},
  /* Kapitel 2: das Lager. Bis dahin ist der Laden ein Kiosk: der
     Lieferant stellt die Kartons vor die Ladentuer, das Lager hinter
     dem Verkauf ist abgesperrt. */
  {id:'lager',kat:'flaeche',lvl:6,kap:2,name:'Lager mit Warenannahme',desc:'Das Lager hinter dem Laden wird deins: Rolltor mit Andockstation, der LKW fährt direkt an die Rampe, und du kannst Lagerregale aufstellen. Aus dem Pyro-Kiosk wird ein kleines Fachgeschäft.',cost:()=>1200,done:()=>S.up.lager},
  {id:'lager_nord',kat:'flaeche',lvl:8,req:'lager',name:'Lagererweiterung 1 – etwas mehr Platz',desc:'Was hinter der Trennwand im Lager liegt: 47 Quadratmeter mehr, sechs zusätzliche Stellplätze für Regale. Die Wand fällt beim Kauf ganz weg — kein Sturz, kein Pfeiler, ein durchgehender Raum bis zur Stirnwand.',cost:()=>1900,done:()=>S.up.lager_nord},
  {id:'lager_gross',kat:'flaeche',lvl:13,req:'lager_nord',name:'Lagererweiterung 2 – deutlich mehr Platz',desc:'Hinter dem Rolltor wird die Wand auf neun Metern durchbrochen: der erste Abschnitt der großen Halle dahinter, 118 Quadratmeter mit fünf Metern lichter Höhe. Hier steht die Packstation, und ab hier lohnt sich der Onlineshop. Hochregale passen erst in diese Höhe.',cost:()=>6200,done:()=>S.up.lager_gross},
  {id:'shop_ost',kat:'flaeche',lvl:21,req:'shop_gross',name:'Ladenerweiterung 3 – viel mehr Platz',desc:'Das nächste leerstehende Lokal in der Reihe: noch einmal 212 Quadratmeter, Gondelgassen, Eckregal und eine lange Wandreihe.',cost:()=>16000,done:()=>S.up.shop_ost},
  {id:'shop_sued',kat:'flaeche',lvl:24,req:'shop_ost',kap:6,name:'Ladenerweiterung 4 – riesig viel Platz',desc:'Die große Halle hinter dem Laden, zwei breite Durchgänge: 478 Quadratmeter Verkaufsfläche mit zwei Gondelgassen. Damit ist der Laden fünfeinhalbmal so groß wie am Anfang.',cost:()=>34000,done:()=>S.up.shop_sued},
  {id:'lager_sued',kat:'flaeche',lvl:18,req:'lager_gross',name:'Lagererweiterung 3 – noch mehr Platz',desc:'Der zweite Abschnitt, noch einmal 83 Quadratmeter. Die Wand zum ersten fällt ganz weg — kein Pfeiler, kein Sturz, eine durchgehende Halle.',cost:()=>11000,done:()=>S.up.lager_sued},
  {id:'lager_sued2',kat:'flaeche',lvl:25,req:'lager_sued',name:'Lagererweiterung 4 – die ganze Halle',desc:'Der letzte Abschnitt bis zur Stirnwand. Damit steht die ganze Halle: 283 Quadratmeter am Stück, dreizehn Stellplätze für Hoch- und Schwerlastregale.',cost:()=>15000,done:()=>S.up.lager_sued2},
  {id:'lager_west',kat:'flaeche',lvl:28,req:'lager_sued2',kap:7,name:'Logistikhalle – Stufe 1',desc:'Eine eigene Halle hinter der Schleuse: 18 mal 20 Meter, 6,5 Meter hoch, mit zwei Toren an der Südwand zum LKW-Hof. Klein fängt sie an, mit jeder Stufe wird sie größer und höher. Dazu wird der Lagergang hinter dem Laden geöffnet.',cost:()=>22000,done:()=>S.up.lager_west},
  /* Andockstationen. Die Basisrampe hinter dem Lager ist die erste
     und bleibt die begehbare; jede zugekaufte Westrampe nimmt eine
     Lieferung zusaetzlich an, parallel zu allen anderen. */
  {id:'rampe2',kat:'flaeche',lvl:28,req:'lager_west',name:'Andockstation 2',desc:'Das erste Tor der Logistikhalle geht in Betrieb. Ab jetzt können zwei Lieferungen gleichzeitig anrollen: während du an der Basisrampe auslädst, stapelt der Fahrer hier seine Kartons selbst in der Halle ab.',cost:()=>12000,done:()=>S.up.rampe2},
  {id:'lager_west2',kat:'flaeche',lvl:29,req:'lager_west',name:'Logistikhalle – Stufe 2',desc:'Die Halle wächst: 30 mal 24 Meter und 8,5 Meter hoch, mit Platz für ein drittes Tor und acht weitere Regalplätze.',cost:()=>30000,done:()=>S.up.lager_west2},
  {id:'rampe3',kat:'flaeche',lvl:29,req:'rampe2',name:'Andockstation 3',desc:'Das zweite Tor der Logistikhalle kommt dazu. Drei Lieferungen nebeneinander — ab hier staut sich der Einkauf auch an starken Tagen nicht mehr.',cost:()=>15000,done:()=>S.up.rampe3},
  {id:'rampe4',kat:'flaeche',lvl:30,req:'lager_west2',name:'Andockstation 4',desc:'Das Tor in der erweiterten Halle. Vier Lieferungen gleichzeitig.',cost:()=>20000,done:()=>S.up.rampe4},
  {id:'lager_west3',kat:'flaeche',lvl:30,req:'lager_west2',name:'Logistikhalle – Stufe 3',desc:'Die volle Halle: 40 mal 27 Meter und 11 Meter hoch, Platz für Hochregale bis unters Dach und das letzte Tor.',cost:()=>42000,done:()=>S.up.lager_west3},
  {id:'rampe5',kat:'flaeche',lvl:31,req:'lager_west3',name:'Andockstation 5',desc:'Das letzte Tor der Logistikhalle. Zusammen mit der Basisrampe rollen dann fünf Lieferungen gleichzeitig an — mehr gibt das Grundstück nicht her.',cost:()=>26000,done:()=>S.up.rampe5},
  {id:'packstation',kat:'flaeche',lvl:16,req:'lager_gross',name:'Packstation für den Versand',desc:'Packtisch, Waage, Etikettendrucker und Abholrampe im ersten Abschnitt der großen Halle, gleich hinter dem Rolltor. Zusammen mit dem Onlineshop kommen Bestellungen als echte Pakete herein: packen, auf die Rampe stellen, DDL holt am Abend ab.',cost:()=>6400,done:()=>S.up.packstation},
  {id:'eingang2',kat:'flaeche',lvl:25,req:'shop_ost',name:'Ladenerweiterung 5 – zweite Tür mit Kasse',desc:'Im Eckhaus ist die mittlere Achse bis zum Boden offen und wartet auf eine Tür. Der Ausbau setzt dieselbe Schiebetür wie am Haupteingang hinein, mit Vordach und Matte, und stellt dahinter eine eigene SB-Kassenzeile auf. Kunden nehmen ab jetzt den Eingang, der näher liegt, und die Schlange am Band wird spürbar kürzer. Die Kassenzeile lässt sich im Umbaumodus verschieben.',cost:()=>11500,done:()=>S.up.eingang2},
  {id:'kasse2',kat:'einr',lvl:16,req:'shop_gross',name:'SB-Kassen',desc:'Zwei Selbstbedienungsterminals in der neuen Verkaufsfläche. Kunden mit wenig Ware zahlen dort selbst, das entlastet deine Schlange spürbar.',cost:()=>3400,done:()=>S.up.kasse2},
  {id:'labor',kat:'flaeche',lvl:20,req:'shop_gross',kap:5,name:'Entwicklungslabor',desc:'Ein Labortisch im Lager. Ab hier entwickelst du eigene Rezepturen: Träger, Bruchbild und Farben aussuchen, Prototyp auf dem Testfeld zünden, in Produktion geben. Verbauen darfst du nur Bruchbilder, die du selbst schon am Himmel gesehen hast.',cost:()=>9800,done:()=>S.up.labor},
  {id:'labor2',kat:'einr',lvl:28,req:'labor',name:'Zweite Zündstufe',desc:'Erweitert das Labor um eine zweite Stufe im Rezept: Nach dem Hauptbruch geht ein zweites Bruchbild auf. Der größte einzelne Sprung im Wert einer Rezeptur.',cost:()=>16500,done:()=>S.up.labor2},
  {id:'gravur',kat:'einr',lvl:9,name:'Gravur-Automat',desc:'Kunden beschriften ihre eigene Rakete. Hohe Marge, du musst nur Blanko-Ware nachfüllen.',cost:()=>1200,done:()=>S.up.gravur}
];
const DEKO=[
  {id:'pflanze',lvl:6,name:'Zimmerpflanze',amb:2,cost:70},
  {id:'stehtisch',lvl:6,name:'Stehtisch',amb:2,cost:95},
  {id:'muell',lvl:6,name:'Mülleimer',amb:2,cost:80,desc:'Der Laden wird langsamer dreckig.'},
  {id:'teppich',lvl:7,name:'Läufer-Teppich',amb:3,cost:130},
  {id:'lichter',lvl:8,name:'Lichterkette',amb:5,cost:170},
  {id:'ventilator',lvl:9,name:'Deckenventilator',amb:4,cost:210},
  {id:'baum',lvl:10,name:'Weihnachtsbaum',amb:7,cost:290},
  {id:'neon',lvl:12,name:'Neonschild Frohes Neues',amb:9,cost:480},
  {id:'automat',lvl:14,name:'Getränkeautomat',amb:8,cost:640,desc:'Bringt nebenbei ein paar Euro pro Tag.'},
  {id:'bild_raketen',lvl:5,name:'Bild: Raketennacht',amb:4,buy:0.03,cost:180,wall:true,desc:'Großformat an der Wand. Kunden greifen etwas beherzter zu.'},
  {id:'bild_stadt',lvl:8,name:'Bild: Feuerwerk über der Stadt',amb:6,buy:0.04,cost:320,wall:true,desc:'Macht Lust auf Silvester. Wirkt auf die Kauflaune.'},
  {id:'bild_sortiment',lvl:11,name:'Bild: Sortimentstafel',amb:5,buy:0.05,cost:420,wall:true,desc:'Zeigt, was der Laden alles hat. Kunden nehmen mehr mit.'},
  {id:'saeule',lvl:19,name:'Leuchtsäule',amb:10,cost:900,desc:'Dreht sich langsam und zieht Blicke.'},
  {id:'vitrine',lvl:22,name:'Schauvitrine',amb:12,buy:0.04,cost:1400,desc:'Zeigt die teuersten Stücke im besten Licht.'},
  {id:'bild_meister',lvl:16,name:'Bild: Der Sprengmeister',amb:9,buy:0.07,cost:820,wall:true,desc:'Das Prunkstück. Deutlich höhere Kauflaune im ganzen Laden.'}
];
const STAFF=[
  {id:'reinigung',lvl:6,name:'Reinigungskraft',desc:'Wischt den Dreck weg, solange der Laden offen ist.',hire:250,wage:55},
  {id:'auffueller',lvl:9,req:'lager',name:'Einräumer',desc:'Lädt den LKW aus, räumt ins Lager und füllt die Regale - Karton für Karton, Stück für Stück. Was er zuerst macht, stellst du am Handy unter Team ein.',hire:450,wage:110},
  {id:'auffueller2',lvl:12,req:'lager',name:'Zweiter Einräumer',desc:'Zweites Paar Hände. Gib ihm eine andere Reihenfolge, dann greift es ineinander.',hire:600,wage:130},
  {id:'kassierer',lvl:11,name:'Kassierer',desc:'Scannt und kassiert selbstständig an der Kasse.',hire:600,wage:145},
  /* Weitere Kassierer: jeder besetzt eine SB-Kasse. Besetzt nimmt sie
     auch volle Koerbe und kassiert gut doppelt so schnell. */
  {id:'kassierer2',kurz:'Kasse 2',lvl:16,req:'kasse2',name:'Kassierer an SB-Kasse 1',desc:'Besetzt die erste SB-Kasse in der Erweiterung. Dort zahlen dann auch Kunden mit vollem Korb, und es geht gut doppelt so schnell.',hire:600,wage:140},
  {id:'kassierer3',kurz:'Kasse 3',lvl:17,req:'kasse2',name:'Kassierer an SB-Kasse 2',desc:'Besetzt die zweite SB-Kasse in der Erweiterung.',hire:600,wage:140},
  {id:'kassierer4',kurz:'Kasse 4',lvl:24,req:'eingang2',name:'Kassierer am zweiten Eingang 1',desc:'Besetzt die erste Kasse am zweiten Eingang.',hire:650,wage:145},
  {id:'kassierer5',kurz:'Kasse 5',lvl:25,req:'eingang2',name:'Kassierer am zweiten Eingang 2',desc:'Besetzt die zweite Kasse am zweiten Eingang. Damit sind alle fünf Kassen besetzt.',hire:650,wage:145},
  {id:'security',lvl:13,name:'Sicherheitsdienst',desc:'Hält Diebe im Laden auf, bevor sie rauskommen.',hire:800,wage:190},
  {id:'packer',lvl:18,req:'packstation',name:'Versandmitarbeiter',desc:'Schiebt einen Kommissionierwagen mit sechs Fächern durchs Lager – fehlt dort etwas, durch den Laden –, legt jede Onlinebestellung Stück für Stück in ihren Karton, klebt am Packtisch zu und stapelt die Pakete für DDL.',hire:700,wage:165}
];
const SUPPLIERS=[
  {id:'mertens',lvl:1,name:'Pyro Mertens',short:'Mertens',desc:'Dein Stammlieferant seit Jahren. Faire Preise, pünktlich, keine Überraschungen.',
    mult:1.00,quality:1.00,delay:[4,8],tiers:[{n:1,d:0},{n:5,d:0.04}]},
  {id:'kowalski',lvl:5,name:'Feuerwerk Kowalski',short:'Kowalski',desc:'Echter Großhandel. Ab Palette wird es richtig günstig, dafür dauert die Lieferung.',
    mult:0.93,quality:1.00,delay:[10,16],tiers:[{n:5,d:0.05},{n:20,d:0.13}]},
  {id:'ratzke',lvl:8,name:'Restposten-Ratzke',short:'Ratzke',desc:'Verkauft Wundertüten aus Restbeständen. Du weißt vorher nie, was drin ist.',
    mult:0.60,quality:0.86,delay:[6,12],mystery:true},
  {id:'import',lvl:12,name:'Import Direkt',short:'Import',desc:'Containerware aus Übersee. Spottbillig, aber nicht jeder Böller zündet.',
    mult:0.66,quality:0.72,delay:[18,26],tiers:[{n:20,d:0.10},{n:50,d:0.18}]},
  {id:'premium',lvl:15,name:'Pyro Premium',short:'Premium',desc:'Markenware mit Prüfsiegel. Teurer im Einkauf, aber die Kunden zahlen deutlich mehr.',
    mult:1.28,quality:1.15,delay:[5,9],tiers:[{n:1,d:0},{n:5,d:0.06},{n:20,d:0.12}]}
];
const LATE_SUP={id:'direkt',lvl:22,name:'Werksdirekt Hübner',short:'Werk',desc:'Direkt ab Werk. Große Mengen, feste Konditionen, beste Ware.',
    mult:1.12,quality:1.2,delay:[12,18],tiers:[{n:5,d:0.06},{n:20,d:0.15},{n:50,d:0.24}]};
SUPPLIERS.push(LATE_SUP);
const PACKS=[
  {id:'tuete',lvl:8,name:'Kleine Wundertüte',desc:'Sechs Kartons Restware, bunt gemischt. Meist Kleinkram, selten ein Treffer.',n:6},
  {id:'kiste',lvl:10,name:'Große Wundertüte',desc:'Vierzehn Kartons, je Karton etwas günstiger. Manchmal ist etwas richtig Teures dabei.',n:14},
  {id:'palette',lvl:14,name:'Restposten-Palette',desc:'Dreißig Kartons auf einen Schlag, der beste Kartonpreis. Platz im Lager schadet nicht.',n:30},
  /* Themenpakete: nur eine Warengruppe, zufaellig gemischt aus dem,
     was du schon fuehrst. Preis nach dem mittleren Einkaufswert der
     Gruppe, ein Fuenftel darunter - dafuer weisst du nicht, ob
     der teure Verbund oder der kleine dabei ist. */
  {id:'knallkiste',lvl:8,name:'Knallkiste',desc:'Zehn Kartons Böller, gemischt aus deinem Sortiment.',gruppe:'boeller',n:10},
  {id:'raketenpaket',lvl:11,name:'Raketen-Paket',desc:'Acht Kartons Raketen, vom Dreierset bis zu dem, was du freigeschaltet hast.',gruppe:'raketen',n:8},
  {id:'verbundpaket',lvl:15,name:'Verbund-Paket',desc:'Fünf Kartons Batterien und Fächer. Mit Glück ist ein großer Verbund dabei.',gruppe:'batterien',n:5},
  {id:'kugelkiste',lvl:16,name:'Kugelkiste',desc:'Vier Kartons Kugelbomben, Kaliber gemischt.',gruppe:'kugeln',n:4}
];
const PYROTYPES=[
  {id:'knauser',name:'knauserig',ceil:1.03,rounds:4,open:0.78,line:'Ich sag Ihnen gleich, mein Budget ist eng.'},
  {id:'eilig',name:'in Eile',ceil:1.28,rounds:1,open:0.88,line:'Ich brauch das heute noch, machen Sie schnell einen Preis.'},
  {id:'profi',name:'Profi',ceil:1.09,rounds:3,open:0.82,line:'Ich kaufe seit zwanzig Jahren ein, ich kenne die Preise.'},
  {id:'gross',name:'Großabnehmer',ceil:1.04,rounds:3,open:0.74,line:'Bei der Menge erwarte ich einen ordentlichen Nachlass.'},
  {id:'angeber',name:'Angeber',ceil:1.38,rounds:2,open:0.92,line:'Geld spielt keine Rolle, es muss nur knallen.'}
];
const PYRONAMES=['Pyro-Team Schneider','Eventagentur Lindemann','Feuerwerk Bartosz','Schützenverein Ahlen','Hochzeitsplanung Vogt','Stadtfest Bergkamen','Pyrotechnik Krüger','Silvesterparty Hoteltrio','Zeltfest Oberdorf','Gartenverein Sonnenhang'];
const LOANS=[
  {lvl:5,amount:1000,term:10,rate:0.012},
  {lvl:8,amount:2500,term:12,rate:0.013},
  {lvl:12,amount:5000,term:14,rate:0.014},
  {lvl:15,amount:10000,term:16,rate:0.015},
  {lvl:20,amount:25000,term:20,rate:0.016},
  {lvl:26,amount:60000,term:24,rate:0.017}
];
const WALLS=[
  {id:'creme',lvl:1,name:'Creme',cost:0,up:'#efe9dd',low:'#223055',rail:'#c8322a'},
  {id:'weiss',lvl:1,name:'Reinweiß',cost:50,up:'#f6f6f4',low:'#3a3f4a',rail:'#8a8f99'},
  {id:'salbei',lvl:1,name:'Salbeigrün',cost:140,up:'#dfe7dc',low:'#2f4a3c',rail:'#e0b64a'},
  {id:'sand',lvl:1,name:'Sandbeige',cost:250,up:'#ece0cb',low:'#6b5334',rail:'#b8863a'},
  {id:'streifen',lvl:1,name:'Tapete Streifen',cost:370,up:'#efe7d8',low:'#3b4262',rail:'#c8322a',pat:'streifen',pat2:'#d8cbb0'},
  {id:'anthrazit',lvl:1,name:'Anthrazit',cost:520,up:'#d5d8df',low:'#232733',rail:'#7fd1ff'},
  {id:'raute',lvl:1,name:'Tapete Raute',cost:670,up:'#e6e9f2',low:'#2b3550',rail:'#ffd23f',pat:'raute',pat2:'#cbd2e4'},
  {id:'ziegel',lvl:1,name:'Ziegeltapete',cost:840,up:'#c4816a',low:'#3a2a22',rail:'#e0b64a',pat:'ziegel',pat2:'#a86450'},
  {id:'beere',lvl:1,name:'Beere',cost:1020,up:'#f0e2e6',low:'#5a1f36',rail:'#ffd23f'},
  {id:'blume',lvl:1,name:'Tapete Blumen',cost:1210,up:'#f2ece0',low:'#4a3a52',rail:'#c86a8a',pat:'blume',pat2:'#c9a2b4'},
  {id:'holzvert',lvl:1,name:'Holzvertäfelung',cost:1410,up:'#c69a68',low:'#5a3c22',rail:'#8a6034',pat:'holz',pat2:'#b08454'},
  {id:'mitternacht',lvl:1,name:'Mitternachtsblau',cost:1620,up:'#cfd9ef',low:'#16224a',rail:'#ffd23f'},
  {id:'petrol',lvl:1,name:'Petrol',cost:1840,up:'#cfe4e6',low:'#123c44',rail:'#e0b64a'},
  {id:'gold',lvl:1,name:'Goldornament',cost:2060,up:'#1c1b22',low:'#0e0d12',rail:'#e0b64a',pat:'ornament',pat2:'#8a6f2a'}
];
const FLOORS=[
  {id:'grau',lvl:1,name:'Grauer Estrich',cost:0,a:'#b9b6b0',b:'#9a9690'},
  {id:'vinyl',lvl:1,name:'Vinyl Hellgrau',cost:70,a:'#cfd0cd',b:'#b9bab7'},
  {id:'holz',lvl:1,name:'Dielenboden',cost:190,a:'#a97b4c',b:'#8a6038',wood:true},
  {id:'schach',lvl:1,name:'Schachbrett',cost:340,a:'#e8e6e2',b:'#2a2e38',check:true},
  {id:'eiche',lvl:1,name:'Eiche dunkel',cost:520,a:'#6b4a2c',b:'#553a22',wood:true},
  {id:'fliese',lvl:1,name:'Großformatfliese',cost:720,a:'#dad6cd',b:'#c9c4ba',big:true},
  {id:'beton',lvl:1,name:'Polierter Beton',cost:940,a:'#8f949c',b:'#7d828a'},
  {id:'industrie',lvl:1,name:'Riffelblech',cost:1180,a:'#9aa0a8',b:'#848a92',plate:true},
  {id:'teppich',lvl:1,name:'Nadelfilz Rot',cost:1430,a:'#8a2f2a',b:'#7a2824',carpet:true},
  {id:'terrazzo',lvl:1,name:'Terrazzo',cost:1690,a:'#e3ded2',b:'#c9b9a0',terra:true},
  {id:'marmor',lvl:1,name:'Marmor',cost:1970,a:'#efeee9',b:'#dcd9d0',marble:true}
];

/* Fortschritt ---------------------------------------------- */
/* Der Laden hat dauerhaft geöffnet. S.day zählt einfach weiter,
   daraus wird ein Datum berechnet. Sonntag ist Ruhetag. */
const MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MSHORT=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const MLEN=[31,28,31,30,31,30,31,31,30,31,30,31];
const WDAY=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const WSHORT=['So','Mo','Di','Mi','Do','Fr','Sa'];
const START_DOY=273;            // 1. Oktober
function dateInfo(n){
  const t=START_DOY+(n|0), y=1+Math.floor(t/365); let doy=t%365, m=0;
  while(doy>=MLEN[m]){ doy-=MLEN[m]; m++; }
  return {y,m,d:doy+1,doy:t%365,wd:(t+5)%7};
}
function dateStr(n){ const i=dateInfo(n); return `${WDAY[i.wd]}, ${i.d}. ${MONTHS[i.m]}`; }
function dateShort(n){ const i=dateInfo(n); return `${WSHORT[i.wd]} ${i.d}.${i.m+1}.`; }
function isSunday(n){ return dateInfo(n).wd===0; }
/* Nachfrage übers Jahr: Silvester ist der Gipfel, dazwischen läuft es weiter */
function seasonInfo(n){
  const i=dateInfo(n), m=i.m, d=i.d;
  if(m===11&&d>=26) return [1.5+(d-26)*0.34,'Silvestergeschäft'];
  if(m===11&&d>=20) return [1.25,'Weihnachtswoche'];
  if(m===11) return [1.1,'Vorweihnachtszeit'];
  if(m===0&&d===1) return [1.35,'Neujahr, Restverkauf'];
  if(m===0&&d<=14) return [0.80,'Ruhige Januartage'];
  if(m===0||m===1) return [0.72,'Tiefste Nebensaison'];
  if(m===2) return [0.80,'Frühjahr, wenig los'];
  if(m===3&&d>=25) return [1.45,'Walpurgisnacht steht an'];
  if(m===4&&d<=2) return [1.3,'Erster Mai'];
  if(m===3||m===4) return [0.9,'Frühling'];
  if(m===5) return [1.0,'Sommeranfang, Feste'];
  if(m===6||m===7) return [1.15,'Sommerfeste und Hochzeiten'];
  if(m===8) return [0.88,'Spätsommer'];
  if(m===9&&d>=28) return [1.25,'Halloween'];
  if(m===9) return [0.92,'Oktober'];
  return [0.86,'November, ruhig'];
}
const WDMULT=[0.55,0.82,0.84,0.9,1.0,1.28,1.35];
function dayMult(n){ const i=dateInfo(n); return seasonInfo(n)[0]*WDMULT[i.wd]; }
function silvesterNah(n){ const i=dateInfo(n); return i.m===11&&i.d>=26; }
const OPEN_T=480, CLOSE_T=1320, MIN_PER_SEC=840/330;
/* Jede Bestellung ist eine Lieferung: kurzer Vorlauf, bis der Lieferant
   an der Rampe steht, dazu eine kleine Liefergebuehr, die ab einem
   groesseren Warenwert entfaellt. */
const SHOP_DEFAULT='Böllerladen', SLOGAN_DEFAULT='Feuerwerk · Silvester · seit 1998';
function shopName(){ return (S&&S.shopName)||SHOP_DEFAULT; }
function shopSlogan(){ return (S&&S.slogan!==undefined&&S.slogan!==null)?S.slogan:SLOGAN_DEFAULT; }
const LIEFERZEIT_SEK=5, VERSAND=5.9, VERSANDFREI=150;
function lieferSek(){ return LIEFERZEIT_SEK; }
/* Regaltypen. Klein ist der Einstieg, der Kühlschrank nimmt nur Sekt & Co. */
const SHELFKIND={
  klein:{id:'klein',name:'Kleines Regal',w:1.0,d:0.42,lv:[0.12,0.52,0.92],lvl:1,cost:45,step:28,amb:0},
  standard:{id:'standard',name:'Verkaufsregal',w:2.0,d:0.52,lv:[0.115,0.565,1.015,1.465],lvl:4,cost:130,step:70,amb:1},
  hoch:{id:'hoch',name:'Hochregal',w:2.0,d:0.52,lv:[0.11,0.47,0.83,1.19,1.55],lvl:10,cost:260,step:95,amb:2},
  kuehl:{id:'kuehl',name:'Sekt-Kühlschrank',w:1.1,d:0.58,lv:[0.2,0.64,1.08,1.52],lvl:6,cost:430,step:155,amb:5,cold:true},
  /* Mittelgondel: steht frei im Raum, Ware auf beiden Seiten. */
  gondel:{id:'gondel',name:'Mittelgondel',w:2.0,d:0.46,fw:2.1,fd:1.0,lv:[0.12,0.5,0.88,1.26],lvl:12,cost:560,step:190,amb:3,art:'insel',
    seiten:[{ry:0,ox:0,oz:0.24},{ry:Math.PI,ox:0,oz:-0.24}]},
  /* Eckregal: zwei Schenkel ueber Eck, wie im Supermarkt. */
  eck:{id:'eck',name:'Eckregal',w:1.2,d:0.5,fw:1.74,fd:1.74,lv:[0.115,0.565,1.015,1.465],lvl:14,cost:480,step:165,amb:2,art:'ecke',
    seiten:[{ry:0,ox:0.25,oz:-0.60},{ry:Math.PI/2,ox:-0.60,oz:0.25}]}
};
const SHELFORDER=['klein','standard','hoch','kuehl','gondel','eck'];
/* =========================================================
   Regalbau Stegemann. Regale stehen nicht mehr auf Knopfdruck im
   Laden - man bestellt sie wie Ware, der LKW bringt sie als
   flache Pakete an die Rampe, und wo man das Paket abstellt,
   baut man das Regal auf. Der Lieferant ist von Anfang an da;
   was man bei ihm bekommt, haengt am Level wie bei allem anderen.
   ========================================================= */
const REGALWARE=[
  {id:'klein',   art:'shelf',kind:'klein',   lvl:1},
  {id:'rack',    art:'rack', kind:'standard',lvl:6,req:'lager'},
  {id:'standard',art:'shelf',kind:'standard',lvl:4},
  {id:'kuehl',   art:'shelf',kind:'kuehl',   lvl:6},
  {id:'hoch',    art:'shelf',kind:'hoch',    lvl:10},
  {id:'gondel',  art:'shelf',kind:'gondel',  lvl:12,req:'shop_gross'},
  {id:'eck',     art:'shelf',kind:'eck',     lvl:14,req:'shop_gross'},
  {id:'rhoch',   art:'rack', kind:'hoch',    lvl:16,req:'lager_gross'},
  {id:'rschwer', art:'rack', kind:'schwer',  lvl:18,req:'lager_gross'}
];
function regalOf(id){ return REGALWARE.find(x=>x.id===id)||null; }
function regalKind(r){ return r.art==='rack'?RACKKIND[r.kind]:SHELFKIND[r.kind]; }
function regalName(id){ const r=regalOf(id); return r?regalKind(r).name:'Regal'; }
/* Preis wie bisher: Grundpreis plus Aufschlag je bereits
   aufgestelltem Regal derselben Art. */
function regalPreis(id){
  const r=regalOf(id); if(!r) return 0;
  const K=regalKind(r);
  const n=r.art==='rack'?rackCount(r.kind):shelfCount(r.kind);
  return r2(K.cost+K.step*n);
}
/* Passt noch eins in den Laden? */
function regalPlatz(id){
  const r=regalOf(id); if(!r) return false;
  return r.art==='rack'?rackFreiFuer(r.kind):freiFuer(r.kind);
}
function regalOffen(id){
  const r=regalOf(id); if(!r) return false;
  if(S.level<r.lvl) return false;
  return !r.req||!!S.up[r.req];
}
/* =========================================================
   Stellplaetze im Laden. Die Basisflaeche bleibt genau wie
   bisher, die Ausbaustufen bringen Wandreihen, Mittelgondeln
   und Eckregale dazu.
   art: wand (Standardregale), insel (Gondeln), ecke (Eckregale)
   ========================================================= */
function mkSlots(){
  const A=[];
  const add=(x,z,o)=>A.push(Object.assign({x:Math.round(x*100)/100,z:Math.round(z*100)/100},o||{}));
  const reihe=(x0,n,dx,z,o)=>{ for(let i=0;i<n;i++) add(x0+i*dx,z,o); };
  const spalte=(z0,n,dz,x,o)=>{ for(let i=0;i<n;i++) add(x,z0+i*dz,o); };
  /* --- Basis: die westliche Haelfte des Ladenlokals. Die oestliche
         Spalte liegt hinter der Trennwand und kommt mit ihr. --- */
  reihe(-6.4,4,2.2,-5.5);
  reihe(-6.4,4,2.2,-1.2);
  add(2.4,-5.5,{zone:'shop_halb'});
  add(2.4,-1.2,{zone:'shop_halb'});
  /* --- Ost I: Wandreihe, zwei Gondelreihen. Vorn bleibt der
         Durchgang aus dem Basisladen frei. --- */
  const A1={zone:'shop_gross'}, I1={zone:'shop_gross',art:'insel'};
  reihe(11.0,4,2.2,-5.5,A1);
  reihe(11.2,3,3.0,-1.6,I1);
  reihe(11.2,3,3.0, 2.4,I1);
  /* --- Ost II: lange Wandreihe, Gondeln, Ostwand und Eckregal --- */
  const A2={zone:'shop_ost'}, I2={zone:'shop_ost',art:'insel'};
  reihe(22.6,5,2.2,-5.5,A2);
  reihe(23.0,4,3.0,-1.6,I2);
  reihe(23.0,4,3.0, 2.4,I2);
  spalte(-2.0,2,2.2,37.5,Object.assign({ry:-Math.PI/2},A2));
  add(37.05,-5.05,Object.assign({ry:-Math.PI/2,art:'ecke'},A2));
  /* --- Sued: die grosse Halle. Zwei Gondelgassen, Wandreihe an
         der Suedwand, Regale an West- und Ostwand, zwei Ecken. --- */
  const A3={zone:'shop_sued'}, I3={zone:'shop_sued',art:'insel'};
  reihe(11.0,5,3.4,-9.4,I3);
  reihe(11.0,5,3.4,-13.8,I3);
  reihe(11.4,4,4.4,-21.5,A3);
  spalte(-11.0,2,3.2,8.28,Object.assign({ry:Math.PI/2},A3));
  spalte(-11.0,2,3.2,37.62,Object.assign({ry:-Math.PI/2},A3));
  add(8.85,-21.05,Object.assign({art:'ecke'},A3));
  add(37.05,-21.05,Object.assign({ry:-Math.PI/2,art:'ecke'},A3));
  return A;
}
const SLOTS=mkSlots();
/* =========================================================
   Lagerplaetze. h ist die lichte Hoehe - danach entscheidet
   sich, ob ein Hochregal ueberhaupt hineinpasst.
   ========================================================= */
function mkRacks(){
  const A=[];
  const add=(x,z,ry,h,zone)=>A.push({x:Math.round(x*100)/100,z:Math.round(z*100)/100,ry:ry,h:h,zone:zone});
  /* Das ganze Lager ist fuenf Meter licht (LAGER_H steht erst in
     05-world und ist hier noch nicht da, darum die Zahl).
     Ab Level 1 gehoert nur der Raum am Rolltor dazu; was hinter der
     Trennwand liegt, kommt mit der naechsten Stufe. */
  [-9.3,-12.4,-15.5,-18.6].forEach(x=>{ add(x,-5.35,0,5.0); add(x,1.35,Math.PI,5.0); });
  [-9.7,-12.8,-15.9,-19.0].forEach(x=>add(x,5.45,Math.PI,5.0,'lager_nord'));
  [-11.0,-14.1].forEach(x=>add(x,2.75,0,5.0,'lager_nord'));
  /* Halle Sued I bis III, lichte Hoehe 5,0 m (HALLE_H steht erst in
     05-world und ist hier noch nicht da, darum die Zahl).
     In Halle I steht auch die Packstation, darum haelt der
     Westrand die ersten Meter frei. */
  [-8.6,-12.2].forEach(z=>{ add(-10.4,z,0,5.0,'lager_gross'); });
  [-12.2,-14.8].forEach(z=>{ add(-17.8,z,0,5.0,'lager_gross'); });
  add(-10.4,-14.8,0,5.0,'lager_gross');
  /* Halle Sued II */
  [-17.4,-20.6].forEach(z=>{ add(-10.4,z,0,5.0,'lager_sued'); add(-17.8,z,0,5.0,'lager_sued'); });
  /* Halle Sued III */
  [-24.4,-27.6].forEach(z=>{ add(-10.4,z,0,5.0,'lager_sued2'); add(-17.8,z,0,5.0,'lager_sued2'); });
  /* Logistikhalle in drei Stufen (seit 24.09.). Die Tore liegen an
     der Suedwand (z -34), davor bleiben vier Meter frei; der Weg von
     der Schleuse (z -22,4 bis -18,6) laeuft zwischen den Reihen. */
  [-18.0,-22.0,-26.0].forEach(z=>{ add(-41.5,z,0,5.0,'lager_west'); add(-35.0,z,0,5.0,'lager_west'); });
  [-14.0,-18.0,-22.0,-26.0].forEach(z=>{ add(-52.5,z,0,6.4,'lager_west2'); add(-47.5,z,0,6.4,'lager_west2'); });
  [-12.0,-16.0,-20.0,-24.0,-28.0].forEach(z=>{ add(-63.0,z,0,6.4,'lager_west3'); add(-59.0,z,0,6.4,'lager_west3'); });
  return A;
}
const RACKS=mkRacks();
/* Plaetze fuer Plakate und Deko. Die Ausbaustufen bringen eigene
   dazu - ein leerer Anbau soll sich nicht kahler anfuehlen als der
   Basisladen. */
/* =========================================================
   Regalschilder. Die Kopfschilder ueber den Verkaufsregalen
   lassen sich umfaerben - Hintergrund und Schrift getrennt.
   „auto" faerbt nach Warengruppe, wie es vorher fest war.
   Drucken kostet nichts, es ist nur ein Schild.
   ========================================================= */
const SCHILDBG=[
  {id:'auto',      name:'Nach Warengruppe', c:null},
  {id:'rot',       name:'Signalrot',        c:'#c8322a'},
  {id:'blau',      name:'Tiefblau',         c:'#2f5d9e'},
  {id:'gruen',     name:'Tannengrün',       c:'#2f7a4a'},
  {id:'anthrazit', name:'Anthrazit',        c:'#23283a'},
  {id:'schwarz',   name:'Schwarz',          c:'#14161c'},
  {id:'bordeaux',  name:'Bordeaux',         c:'#7a2036'},
  {id:'tuerkis',   name:'Türkis',           c:'#17827d'},
  {id:'violett',   name:'Violett',          c:'#5b3a8e'},
  {id:'orange',    name:'Orange',           c:'#e06a1f'},
  {id:'gelb',      name:'Signalgelb',       c:'#f2c230'},
  {id:'weiss',     name:'Reinweiß',         c:'#eef1f6'}
];
const SCHILDFG=[
  {id:'weiss',   name:'Weiß',      c:'#f2f5ff'},
  {id:'schwarz', name:'Schwarz',   c:'#10131c'},
  {id:'gelb',    name:'Gelb',      c:'#ffd23f'},
  {id:'mint',    name:'Mint',      c:'#8ef0a8'},
  {id:'hellblau',name:'Hellblau',  c:'#9fd8ff'},
  {id:'rot',     name:'Rot',       c:'#ff6a5a'},
  {id:'sand',    name:'Sand',      c:'#e8d6ae'}
];
function schildBg(){ return SCHILDBG.find(x=>x.id===(S&&S.schildBg))||SCHILDBG[0]; }
function schildFg(){ return SCHILDFG.find(x=>x.id===(S&&S.schildFg))||SCHILDFG[0]; }
/* Die Plaetze oestlich der Trennwand gehoeren zur zweiten
   Ladenhaelfte - sonst haengt ein Bild hinter einer Wand. */
const WALLSPOTS=[{x:-2.5,z:-5.86,ry:0},{x:0.6,z:-5.86,ry:0},{x:-7.86,z:3.6,ry:Math.PI/2},{x:-5.5,z:-5.86,ry:0},
  {x:7.86,z:-2.0,ry:-Math.PI/2,zone:'shop_halb'},{x:7.86,z:1.0,ry:-Math.PI/2,zone:'shop_halb'},
  {x:19.8,z:-5.0,ry:-Math.PI/2,zone:'shop_gross'},{x:19.8,z:5.0,ry:-Math.PI/2,zone:'shop_gross'},
  {x:20.2,z:-5.0,ry:Math.PI/2,zone:'shop_ost'},  {x:20.2,z:5.0,ry:Math.PI/2,zone:'shop_ost'},
  {x:8.22,z:-8.0,ry:Math.PI/2,zone:'shop_sued'}, {x:37.68,z:-8.0,ry:-Math.PI/2,zone:'shop_sued'}];
const DEKOSPOTS=[{x:-7.1,z:3.2},{x:-7.1,z:-3.6},{x:-6.2,z:1.2},{x:-3.4,z:3.4},{x:1.4,z:-3.4},{x:-1.6,z:5.2},
  {x:6.9,z:-4.6,zone:'shop_halb'},{x:6.9,z:-2.2,zone:'shop_halb'},{x:3.6,z:5.2,zone:'shop_halb'},{x:6.9,z:0.4,zone:'shop_halb'},
  {x:9.3,z:4.6,zone:'shop_gross'},{x:19.0,z:-4.8,zone:'shop_gross'},
  {x:21.0,z:4.6,zone:'shop_ost'},{x:36.5,z:4.6,zone:'shop_ost'},
  {x:9.5,z:-7.5,zone:'shop_sued'},{x:36.0,z:-7.5,zone:'shop_sued'},
  {x:9.5,z:-19.0,zone:'shop_sued'},{x:36.0,z:-19.0,zone:'shop_sued'}];
function xpFor(l){ return Math.round(50*Math.pow(l,1.55)); }

/* =========================================================
   Tagesereignisse: jeder Tag bekommt eine eigene Färbung
   Werte sind Multiplikatoren, 1 heißt unverändert.
   ========================================================= */
const EVENTS=[
  {id:'busgruppe',name:'Reisegruppe in der Stadt',txt:'Ein Bus mit Silvestertouristen steht am Marktplatz. Heute wird es voll.',cust:1.8,pat:0.85,w:8},
  {id:'zeitung',name:'Artikel im Lokalblatt',txt:'Die Lokalzeitung hat über deinen Laden geschrieben. Das spricht sich herum.',cust:1.45,tol:1.06,rep:2,w:7},
  {id:'influencer',name:'Video geht viral',txt:'Jemand hat dein Testfeld gefilmt. Das Video läuft überall.',cust:1.7,tol:1.08,hype:35,w:5},
  {id:'feiertag',name:'Brückentag',txt:'Viele haben frei und decken sich ein.',cust:1.5,items:1.2,w:7},
  {id:'sperrung',name:'Straße gesperrt',txt:'Bauarbeiten vor der Tür. Kaum jemand kommt vorbei.',cust:0.55,w:7},
  {id:'regen',name:'Dauerregen',txt:'Es schüttet den ganzen Tag. Weniger Laufkundschaft, mehr Dreck.',cust:0.75,dirt:2.2,w:8},
  {id:'kaelte',name:'Kältewelle',txt:'Minus zwölf Grad. Wer rausgeht, will schnell wieder rein.',cust:0.85,pat:0.7,heiz:true,w:7},
  {id:'konkurrenz',name:'Konkurrent wirbt mit Rabatten',txt:'Der Laden zwei Straßen weiter wirft die Preise. Deine Kunden vergleichen.',tol:0.88,cust:0.9,w:8},
  {id:'engpass',name:'Lieferengpass',txt:'Ein Werk steht still. Der Einkauf ist heute teuer.',ek:1.35,w:7},
  {id:'schnaeppchen',name:'Restposten am Markt',txt:'Ein Großhändler räumt sein Lager. Heute ist der Einkauf günstig.',ek:0.68,w:7},
  {id:'jugendbande',name:'Jugendliche ziehen umher',txt:'Eine Gruppe streift durch die Straßen. Heute besser aufpassen.',theft:3.0,cust:1.1,w:6},
  {id:'stromausfall',name:'Stromausfall am Vormittag',txt:'Erst ab Mittag geht das Licht wieder an. Der Laden öffnet später.',late:180,w:5},
  {id:'lieferverzug',name:'Stau auf der Autobahn',txt:'Alle Lieferungen brauchen heute deutlich länger.',delay:2.1,w:6},
  {id:'veranstalter',name:'Veranstalter in der Stadt',txt:'Mehrere Agenturen suchen kurzfristig Ware. Das Telefon steht nicht still.',pyro:0.45,w:6},
  {id:'pruefung',name:'Gewerbeaufsicht angekündigt',txt:'Heute schaut jemand vorbei. Ein sauberer Laden zahlt sich aus.',pruef:true,w:5},
  {id:'sektlaune',name:'Sektlaune',txt:'Irgendein Anlass. Zubehör und Sekt gehen heute besonders gut.',cat0:1.8,w:6},
  {id:'knallerlaune',name:'Alle wollen knallen',txt:'Die Leute fragen gezielt nach den lauten Sachen.',cat2:1.7,tol:1.05,w:6}
];
function eventById(id){ return EVENTS.find(e=>e.id===id)||null; }
function todayEvent(){ return S&&S.ev?eventById(S.ev):null; }
function evv(k,d){ const e=todayEvent(); return e&&e[k]!==undefined?e[k]:(d===undefined?1:d); }

/* Kundentypen: unterschiedliche Geldbeutel, Geduld und Warenkörbe */
const CUSTTYPES=[
  {id:'normal',w:30,tol:1.0,items:1.0,pat:1.0,name:null},
  {id:'spar',w:15,tol:0.85,items:1.15,pat:1.15,name:'Sparfuchs'},
  {id:'familie',w:13,tol:1.0,items:1.8,pat:1.3,name:'Familie'},
  {id:'jugend',w:12,tol:0.92,items:0.8,pat:0.7,name:'Jugendliche',f1:true},
  {id:'stamm',w:10,tol:1.12,items:1.35,pat:1.45,name:'Stammkunde'},
  {id:'angeber',w:8,tol:1.28,items:1.25,pat:0.78,name:'Angeber'},
  {id:'eilig',w:7,tol:1.1,items:0.7,pat:0.5,name:'in Eile'},
  {id:'profi',w:5,tol:1.06,items:2.6,pat:1.25,name:'Profi',f2:true}
];
function rollCustType(){
  const pool=CUSTTYPES.filter(c=>!c.f2||S.level>=8);
  let tot=0; pool.forEach(c=>tot+=c.w);
  let r=Math.random()*tot;
  for(const c of pool){ r-=c.w; if(r<=0) return c; }
  return pool[0];
}

/* Wochenziele */
const GOALS=[
  {id:'umsatz',name:'Wochenumsatz',mk:l=>({need:Math.round(600+l*260),unit:'€',kind:'rev'}),pay:l=>Math.round(120+l*45)},
  {id:'kunden',name:'Kundschaft bedienen',mk:l=>({need:Math.round(40+l*14),unit:'Kunden',kind:'cust'}),pay:l=>Math.round(100+l*40)},
  {id:'artikel',name:'Artikel verkaufen',mk:l=>({need:Math.round(90+l*34),unit:'Artikel',kind:'sold'}),pay:l=>Math.round(110+l*42)},
  {id:'f2',name:'Feuerwerk F2 absetzen',mk:l=>({need:Math.round(30+l*16),unit:'F2-Artikel',kind:'f2'}),pay:l=>Math.round(150+l*55)},
  {id:'sauber',name:'Sauber bleiben',mk:l=>({need:5,unit:'Tage ohne Beschwerde',kind:'clean'}),pay:l=>Math.round(130+l*40)},
  {id:'gross',name:'Großaufträge erfüllen',mk:l=>({need:Math.max(1,Math.round(l/5)),unit:'Aufträge',kind:'orders'}),pay:l=>Math.round(200+l*60)}
];
function levelUnlocks(l){
  const out=[];
  LIZENZEN.forEach(x=>{ if(x.lvl===l) out.push(`Lizenzpaket: ${x.name} (${x.items.length} Sorten)`); });
  UPGRADES.forEach(u=>{ if(u.lvl===l) out.push(`Ausbau: ${u.name}`); });
  STAFF.forEach(s=>{ if(s.lvl===l) out.push(`Personal: ${s.name}`); });
  DEKO.forEach(d=>{ if(d.lvl===l) out.push(`Deko: ${d.name}`); });
  WALLS.forEach(w=>{ if(w.lvl===l) out.push(`Wandfarbe: ${w.name}`); });
  FLOORS.forEach(f=>{ if(f.lvl===l) out.push(`Boden: ${f.name}`); });
  LOANS.forEach(k=>{ if(k.lvl===l) out.push(`Bank: Kredit bis ${k.amount.toLocaleString('de-DE')} €`); });
  SUPPLIERS.forEach(x=>{ if(x.lvl===l) out.push(`Lieferant: ${x.name}`); });
  PACKS.forEach(x=>{ if(x.lvl===l) out.push(`Restposten: ${x.name}`); });
  return out;
}
const TUT=[
  ['shelf','Dein Laden ist leer. Geh an den Laptop im Büro-Eck links an der Lagertür und bestell unter Bestellen bei Regalbau ein kleines Regal.','Laptop: Regal bei Regalbau bestellen.'],
  ['order','Jetzt Ware: im Laptop unter Bestellen einen Karton ordern.','Laptop: Ware bestellen.'],
  ['lkw','Die Lieferung kommt per LKW in den Hof hinterm Lager. Geh durchs Lager nach draußen und lade aus.','LKW im Hof hinterm Lager ausladen.'],
  ['stock','Räum die Ware ins Regal. Jedes Fach nimmt eine Sorte auf.','Ware ins Regalfach einräumen.'],
  ['open','Dreh das Schild neben der Tür um, dann öffnet der Laden.','Türschild umdrehen, dann öffnet der Laden.'],
  ['scan','Der Kunde legt die Ware aufs Band. Klick jeden Artikel an, um ihn zu scannen.','Artikel auf dem Band antippen zum Scannen.'],
  ['pay','Karte: Terminal anklicken. Bargeld: Kasse anklicken und Rückgeld geben.','Karte: Terminal. Bar: Kasse antippen.'],
  ['pick','Kartons kannst du überall aufheben und tragen.','Karton aufheben und tragen.'],
  ['lager','Im Lager kannst du Kartons in die Lagerregale stellen.','Kartons ins Lagerregal stellen.'],
  ['clean','Dreck kostet Ruf. Stell dich davor und halt die Aktionstaste.','Vor den Dreck stellen, Aktion halten.'],
  ['fenster','Die Schaufenster werden mit der Zeit blind. Von innen anvisieren und putzen.','Schaufenster von innen putzen.'],
  ['move','Im Umbaumodus verschiebst du Regale, Kasse und Deko.','Umbau: Möbel verschieben.'],
  ['launch','Im Hof hinten kannst du Feuerwerk zünden. Das lockt Kunden an.','Im Hof zünden bringt Hype.'],
  ['build','Stell die Ware im Hof auf die passende Station und zünde am Pult.','Ware aufbauen, dann am Zündpult zünden.'],
  ['phone','Dein Handy klingelt. Mit H rangehen.','Handy klingelt: H drücken.'],
  ['versand','Großaufträge gehen automatisch aus dem Lager raus. Volle Kartons müssen dort stehen.','Volle Kartons ins Lager stellen.']
];

let S=null, phase='closed', clock=OPEN_T, hype=0, DS=null, paused=true, shake=0, ambient=0;
/* Freigeschaltet wird nur noch ueber Lizenzpakete (siehe 02b-markt.js) */
const isUnlocked=t=>{ const l=LIZ_VON[t]; return l?hatLizenz(l):S.level>=P[t].lvl; };
const lizLevel=t=>{ const l=LIZ_VON[t]; const d=l&&LIZENZEN.find(x=>x.id===l); return d?d.lvl:P[t].lvl; };
const rep=d=>{ S.rep=clamp(S.rep+d,0,100); };
const cleanliness=()=>clamp(100-dirts.length*7,0,100);
const canShelf=t=>!P[t].noShelf;
const canOrder=t=>!P[t].noOrder;
const canWish=t=>!P[t].noWish;
function supplierOf(id){ return SUPPLIERS.find(x=>x.id===id)||SUPPLIERS[0]; }
function qualityLabel(q){ return q>=1.12?['ok','Markenware']:q>=0.98?['','Normale Ware']:q>=0.8?['warn','Restposten']:['no','Billigimport']; }
function bildBoost(){ let b=0; (dekos||[]).forEach(d=>{ const D=DEKO.find(x=>x.id===d.id); if(D&&D.buy) b+=D.buy; }); return b; }
function ambienteScore(){
  let a=0; (S.deko||[]).forEach(d=>{ const D=DEKO.find(x=>x.id===d.id); if(D) a+=D.amb; });
  if(S.up.musik) a+=6; if(S.up.regallicht) a+=6; if(S.up.heizung) a+=4;
  shelves.forEach(sh=>{ a+=(SHELFKIND[sh.kind]||SHELFKIND.standard).amb; });
  a-=Math.round(windowGrime()*12);
  const w=WALLS.findIndex(x=>x.id===S.wall), f=FLOORS.findIndex(x=>x.id===S.floor);
  a+=Math.max(0,w)*2+Math.max(0,f)*2;
  return clamp(a,0,100);
}

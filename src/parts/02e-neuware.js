/* =========================================================
   Sortiment mal drei (Tom, 26.09.: "noch mal ein paar mehr Produkte,
   Sachen, die man an Silvester braucht ... das, was da ist, mal drei
   ... und auch in den Leveln reinpacken, bei manchen ist einfach zu
   wenig ... bunt gemischt, aber auch Batterien, Böller, Fontänen ...
   und beachte die Steigerung").

   Vorher 70 Produkte, auf Level 2, 7, 8, 10 und ab 15 je nur ein oder
   zwei. Jetzt gut 200, auf jedem Level von 1 bis 26 mindestens fünf.
   Feuerwerk steigt mit dem Level wie bisher: groesser, hoeher, mehr
   Schuss, spaeter die grossen Bruchbilder (erst ab Level 16).
   Wie die neuen Feuerwerke abbrennen, steht in 14c-neuware.js.

   Hier nur die Daten. Sie werden in die bestehenden Tabellen
   eingehaengt (P, ORDER, LIZENZEN, GRUPPE, VOLA) - dieselbe Groessen-
   regel wie in 02-data (ein Viertel groesser, ausser Batterien,
   Faecher und Kugeln).
   ========================================================= */
const NEUWARE={
  /* ---------- Level 1-4: Jugendfeuerwerk (F1) ---------- */
  wunderfarbe:{name:'Farbige Wunderkerzen 10er',short:'Farb-Wunderk.',cat:1,lvl:1,shape:'sparkler',dims:[0.105,0.30,0.032],grid:[12,3,1],box:30,cost:0.70,market:1.79,weight:8,hype:3,risk:1,
    art:{title:'FARBZAUBER',sub:'10 Wunderkerzen bunt',bg1:'#8a1f6a',bg2:'#2a0620',ac:'#5cff9e',ac2:'#ffd23f'}},
  knallbonbon:{name:'Knallbonbons 10er',short:'Knallbonbons',cat:1,lvl:2,shape:'boxA',dims:[0.22,0.07,0.1],grid:[6,2,2],box:12,cost:1.30,market:3.29,weight:7,hype:3,risk:1,
    art:{title:'KNALLBONBONS',sub:'10 Stück mit Überraschung',bg1:'#c01c20',bg2:'#5a0608',ac:'#ffd23f',ac2:'#f2f5ff'}},
  tischbombe:{name:'Tischbombe »Überraschung«',short:'Tischbombe',cat:1,lvl:2,shape:'cylinder',dims:[0.12,0.16,0.12],grid:[8,2,1],box:12,cost:1.60,market:3.99,weight:7,hype:5,risk:1,
    art:{title:'TISCHBOMBE',sub:'Konfetti & Überraschungen',bg1:'#1557a8',bg2:'#061a3a',ac:'#ffd23f',ac2:'#ff4fa3'}},
  bengalholz:{name:'Bengalische Hölzer 12er',short:'Bengalhölzer',cat:1,lvl:2,shape:'sparkler',dims:[0.09,0.22,0.03],grid:[12,3,1],box:30,cost:0.65,market:1.59,weight:7,hype:3,risk:1,
    art:{title:'BENGALO',sub:'12 Hölzer · rot & grün',bg1:'#0d4a2a',bg2:'#021208',ac:'#ff4a4a',ac2:'#5cff9e'}},
  wunderherz:{name:'Herz-Wunderkerzen 6er',short:'Herz-Wunderk.',cat:1,lvl:1,shape:'sparkler',dims:[0.12,0.28,0.03],grid:[12,3,1],box:24,cost:0.90,market:2.29,weight:6,hype:3,risk:1,
    art:{title:'HERZFUNKEN',sub:'6 Herz-Wunderkerzen',bg1:'#c01c6a',bg2:'#4a0626',ac:'#ffd23f',ac2:'#fff3c4'}},
  wunderzahl:{name:'Zahlen-Wunderkerzen »2027«',short:'2027-Wunderk.',cat:1,lvl:3,shape:'sparkler',dims:[0.14,0.3,0.03],grid:[12,3,1],box:20,cost:1.20,market:2.99,weight:6,hype:4,risk:1,
    art:{title:'2027',sub:'Zahlen-Wunderkerzen',bg1:'#0e1226',bg2:'#000000',ac:'#ffd23f',ac2:'#f2f5ff',gold:true}},
  pharao:{name:'Pharaoschlangen 12er',short:'Pharaoschlangen',cat:1,lvl:2,shape:'boxA',dims:[0.12,0.05,0.08],grid:[8,2,2],box:24,cost:0.50,market:1.29,weight:5,hype:2,risk:1,
    art:{title:'PHARAO',sub:'12 Schlangen aus Asche',bg1:'#4a3a14',bg2:'#140e02',ac:'#ffd23f',ac2:'#c8e04a'}},
  leuchtfontaene:{name:'Glühwürmchen · 4 Leuchtfontänen',short:'Leuchtfontänen',cat:1,lvl:4,shape:'fountainset',dims:[0.18,0.12,0.07],grid:[7,2,1],box:12,cost:1.50,market:3.79,weight:6,hype:6,risk:2,
    art:{title:'GLÜHWÜRMCHEN',sub:'4 Leuchtfontänen',bg1:'#1f5d2a',bg2:'#06200c',ac:'#c8ff5c',ac2:'#ffd23f'}},
  feuerteufel:{name:'Feuerteufel · Knisterfontäne',short:'Feuerteufel',cat:1,lvl:4,shape:'cylinder',dims:[0.08,0.2,0.08],grid:[12,2,1],box:16,cost:0.90,market:2.29,weight:6,hype:5,risk:2,
    art:{title:'FEUERTEUFEL',sub:'Knisterfontäne',bg1:'#8a1a08',bg2:'#240502',ac:'#ffd23f',ac2:'#ff7a1c'}},

  /* ---------- Zubehoer: Sicherheit und Anzuenden ---------- */
  streichhoelzer:{name:'Sturm-Streichhölzer 10 Schachteln',short:'Streichhölzer',cat:0,lvl:3,shape:'boxA',dims:[0.16,0.06,0.11],grid:[8,2,2],box:20,cost:0.90,market:2.29,weight:7,hype:0,risk:2,
    art:{title:'STURMHOLZ',sub:'windfest · 10 Schachteln',bg1:'#c8322a',bg2:'#4a0a06',ac:'#fff3c4',ac2:'#ffd23f'}},
  gehoerschutz:{name:'Gehörschutz-Stöpsel 10 Paar',short:'Gehörschutz',cat:0,lvl:3,shape:'boxA',dims:[0.12,0.2,0.05],grid:[10,2,1],box:20,cost:1.00,market:2.49,weight:6,hype:0,risk:1,
    art:{title:'LEISE',sub:'Gehörschutz 10 Paar',bg1:'#f28a1c',bg2:'#8a3d06',ac:'#0e1226',ac2:'#ffffff',light:true}},
  schutzbrille:{name:'Schutzbrille klar',short:'Schutzbrille',cat:0,lvl:4,shape:'boxA',dims:[0.18,0.08,0.1],grid:[8,2,2],box:12,cost:1.60,market:3.99,weight:5,hype:0,risk:1,
    art:{title:'KLARSICHT',sub:'Schutzbrille',bg1:'#2a6a9a',bg2:'#0a2236',ac:'#f2f5ff',ac2:'#ffd23f'}},
  feuerloescher:{name:'Feuerlöschspray 400 ml',short:'Löschspray',cat:0,lvl:4,shape:'bottle',dims:[0.07,0.24,0.07],grid:[12,2,1],box:12,cost:4.20,market:10.99,weight:4,hype:0,risk:2,
    art:{title:'LÖSCHSPRAY',sub:'400 ml · für Haushalt',bg1:'#c01c20',bg2:'#3a0507',ac:'#ffffff',ac2:'#ffd23f'}},
  luftschlangenspray:{name:'Luftschlangen-Spray 3er',short:'Schlangenspray',cat:0,lvl:4,shape:'boxA',dims:[0.14,0.22,0.06],grid:[10,2,1],box:12,cost:1.70,market:4.29,weight:6,hype:0,risk:1,
    art:{title:'SPRAYPARTY',sub:'3 Dosen · bunt',bg1:'#5ce1ff',bg2:'#1557a8',ac:'#ff4fa3',ac2:'#ffe45c'}},

  /* ---------- Level 5-6: Klassiker ---------- */
  blitzknaller:{name:'Blitzknaller · 20 Stück',short:'Blitzknaller',cat:2,lvl:5,shape:'tubepack',dims:[0.13,0.05,0.05],grid:[8,2,2],box:16,cost:1.60,market:3.79,weight:8,hype:7,risk:3,
    desc:'Heller Blitz, trockener Knall - der kleine Bruder vom Furzböller, ohne Pups.',
    art:{title:'BLITZKNALLER',sub:'20 Stück · Blitz & Knall',bg1:'#f2f5ff',bg2:'#8a92a8',ac:'#1b1b2e',ac2:'#ff3b2e',light:true}},
  bodenkreisel:{name:'Tanzende Kreisel 6er',short:'Kreisel',cat:2,lvl:5,shape:'boxA',dims:[0.12,0.06,0.08],grid:[8,2,2],box:16,cost:1.30,market:3.19,weight:7,hype:5,risk:2,
    art:{title:'TANZKREISEL',sub:'6 Bodenkreisel',bg1:'#5a1470',bg2:'#1a0322',ac:'#5cff9e',ac2:'#ffd23f'}},
  rosesekt:{name:'Rosé-Sekt',short:'Rosé-Sekt',cat:0,lvl:5,cold:true,shape:'bottle',dims:[0.078,0.3,0.078],grid:[12,2,1],box:12,cost:2.80,market:6.99,weight:8,hype:0,risk:5,
    art:{title:'ROSÉ',sub:'Sekt 0,75 l',bg1:'#e58ca5',bg2:'#7a2a44',ac:'#f2e6c4',ac2:'#ffffff'}},
  berliner:{name:'Berliner mit Marmelade 4er',short:'Berliner',cat:0,lvl:5,shape:'boxA',dims:[0.24,0.08,0.16],grid:[6,2,2],box:10,cost:1.40,market:3.49,weight:8,hype:0,risk:4,
    art:{title:'BERLINER',sub:'4 Stück · Marmelade',bg1:'#e8b418',bg2:'#8a5a08',ac:'#7a1030',ac2:'#fff3c4',light:true}},
  glueckrakete:{name:'Schwebelicht · 5 Fallschirmraketen',short:'Fallschirm 5',cat:2,lvl:6,shape:'rocketset',dims:[0.38,0.05,0.1],grid:[4,2,2],box:8,cost:2.20,market:5.49,weight:7,hype:8,risk:3,
    desc:'Leise Zündung, dann hängt oben ein farbiges Licht am Fallschirm und schwebt acht Sekunden lang pendelnd herab. Fünf Raketen, fünf Farben.',
    art:{title:'SCHWEBELICHT',sub:'5 Fallschirmraketen',bg1:'#1f5d2a',bg2:'#06200c',ac:'#c8ff5c',ac2:'#ffd23f'}},
  kalender:{name:'Wandkalender 2027',short:'Kalender',cat:0,lvl:6,shape:'boxA',dims:[0.3,0.32,0.02],grid:[6,1,1],box:10,cost:2.40,market:5.99,weight:4,hype:0,risk:1,
    art:{title:'2027',sub:'Wandkalender',bg1:'#f2ecd8',bg2:'#d8c49a',ac:'#1b5fa8',ac2:'#c8322a',light:true}},
  sektglaeser:{name:'Sektgläser 12er Kunststoff',short:'Sektgläser',cat:0,lvl:6,shape:'boxA',dims:[0.26,0.24,0.18],grid:[6,1,1],box:8,cost:2.20,market:5.49,weight:6,hype:0,risk:1,
    art:{title:'PROSIT',sub:'12 Sektgläser',bg1:'#1b3a2e',bg2:'#08160f',ac:'#e8c35a',ac2:'#f2f5ff'}},
  kerzen:{name:'Tischkerzen Gold 10er',short:'Kerzen',cat:0,lvl:6,shape:'boxA',dims:[0.24,0.28,0.06],grid:[8,2,1],box:12,cost:1.80,market:4.49,weight:5,hype:0,risk:1,
    art:{title:'KERZENGLANZ',sub:'10 Stabkerzen Gold',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  servietten:{name:'Servietten »Prosit Neujahr« 60er',short:'Servietten',cat:0,lvl:6,shape:'boxA',dims:[0.2,0.08,0.2],grid:[6,2,2],box:20,cost:0.90,market:2.29,weight:6,hype:0,risk:1,
    art:{title:'PROSIT NEUJAHR',sub:'60 Servietten',bg1:'#0c3d2a',bg2:'#021a10',ac:'#ffd23f',ac2:'#ff4a4a'}},

  /* ---------- Level 7: Party und Snacks ---------- */
  haarreifen:{name:'Haarreifen & Krönchen 2027',short:'Haarreifen',cat:0,lvl:7,shape:'boxA',dims:[0.22,0.26,0.07],grid:[8,2,1],box:12,cost:1.60,market:3.99,weight:6,hype:0,risk:1,
    art:{title:'KRÖNCHEN',sub:'Haarreifen 2027',bg1:'#6a24c9',bg2:'#25093f',ac:'#ffd23f',ac2:'#f2f5ff',gold:true}},
  fotobox:{name:'Fotobox-Requisiten 20 Teile',short:'Fotobox',cat:0,lvl:7,shape:'boxA',dims:[0.3,0.3,0.05],grid:[6,1,1],box:10,cost:2.60,market:6.49,weight:5,hype:0,risk:1,
    art:{title:'FOTOBOX',sub:'20 Requisiten am Stab',bg1:'#ff4fa3',bg2:'#6a24c9',ac:'#ffe45c',ac2:'#5ce1ff'}},
  streukonfetti:{name:'Streukonfetti Gold »2027«',short:'Streukonfetti',cat:0,lvl:7,shape:'boxA',dims:[0.1,0.16,0.04],grid:[12,2,1],box:24,cost:0.70,market:1.79,weight:6,hype:0,risk:1,
    art:{title:'2027',sub:'Streukonfetti Gold',bg1:'#3a2c08',bg2:'#120d02',ac:'#ffd23f',ac2:'#f2f5ff',gold:true}},
  lichterkette:{name:'LED-Lichterkette 10 m warmweiß',short:'Lichterkette',cat:0,lvl:7,shape:'boxA',dims:[0.2,0.2,0.1],grid:[6,2,2],box:10,cost:3.60,market:8.99,weight:4,hype:0,risk:2,
    art:{title:'LICHTERGLANZ',sub:'LED · 10 m · warmweiß',bg1:'#1b1b2e',bg2:'#070712',ac:'#ffcf8a',ac2:'#ffd23f'}},
  popcorn:{name:'Popcorn XXL süß',short:'Popcorn',cat:0,lvl:7,shape:'boxA',dims:[0.2,0.3,0.1],grid:[6,1,2],box:12,cost:1.10,market:2.79,weight:7,hype:0,risk:3,
    art:{title:'POPCORN',sub:'XXL · süß',bg1:'#c01c20',bg2:'#f2ecd8',ac:'#ffffff',ac2:'#ffd23f'}},
  salzstangen:{name:'Salzstangen & Brezeln',short:'Salzgebäck',cat:0,lvl:7,shape:'boxA',dims:[0.14,0.24,0.06],grid:[10,2,1],box:20,cost:0.80,market:1.99,weight:7,hype:0,risk:3,
    art:{title:'SALZGEBÄCK',sub:'Stangen & Brezeln',bg1:'#1b5fa8',bg2:'#061a3a',ac:'#f2ecd8',ac2:'#ffd23f'}},
  erdnuesse:{name:'Erdnüsse geröstet & gesalzen',short:'Erdnüsse',cat:0,lvl:7,shape:'bottle',dims:[0.09,0.16,0.09],grid:[12,2,1],box:12,cost:1.00,market:2.49,weight:6,hype:0,risk:3,
    art:{title:'ERDNÜSSE',sub:'geröstet & gesalzen',bg1:'#8a3d06',bg2:'#2a1202',ac:'#ffd23f',ac2:'#f2ecd8'}},
  miniverbund:{name:'Feuerspatz · 9 Schuss Minibatterie',short:'Mini 9',cat:2,lvl:8,shape:'battery',dims:[0.18,0.14,0.18],grid:[10,2,1],box:12,cost:3.20,market:7.49,weight:8,hype:12,risk:4,
    art:{title:'FEUERSPATZ',sub:'9 Schuss Minibatterie',bg1:'#f28a1c',bg2:'#5a1a02',ac:'#ffffff',ac2:'#ffd23f'}},

  /* ---------- Level 8: Krach und Buffet ---------- */
  knallteppich:{name:'Knallteppich · 500er Böllerkette',short:'Knallteppich',cat:2,lvl:8,shape:'boxA',dims:[0.24,0.08,0.16],grid:[6,2,2],box:10,cost:3.80,market:8.99,weight:7,hype:14,risk:5,
    desc:'Fünfhundert kleine Kracher in einer Kette, die knattert vier Sekunden am Stück über den Boden.',
    art:{title:'KNALLTEPPICH',sub:'500er Kette',bg1:'#c8201c',bg2:'#3a0507',ac:'#ffd23f',ac2:'#f2f5ff'}},
  farbfontaenen:{name:'Farbenspiel · 3er Farbfontänen',short:'Farbfontänen',cat:2,lvl:8,shape:'fountainset',dims:[0.22,0.145,0.09],grid:[7,2,1],box:7,cost:3.60,market:8.49,weight:7,hype:12,risk:4,
    art:{title:'FARBENSPIEL',sub:'3 Farbfontänen',bg1:'#5a1470',bg2:'#1a0322',ac:'#5cff9e',ac2:'#ff4fa3'}},
  bodenfeuer:{name:'Feuerkreis · Bodenfontäne mit Knistern',short:'Feuerkreis',cat:2,lvl:8,shape:'cylinder',dims:[0.14,0.14,0.14],grid:[8,2,1],box:10,cost:2.40,market:5.79,weight:7,hype:10,risk:4,
    art:{title:'FEUERKREIS',sub:'Bodenfontäne · Knistern',bg1:'#4a1a02',bg2:'#140600',ac:'#ff8a2a',ac2:'#ffd23f'}},
  heringssalat:{name:'Heringssalat 1 kg',short:'Heringssalat',cat:0,lvl:8,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.18,0.12,0.14],grid:[6,2,2],box:8,cost:2.60,market:6.49,weight:6,hype:0,risk:5,
    art:{title:'HERINGSSALAT',sub:'1 kg · rote Bete',bg1:'#8a1a44',bg2:'#2a0614',ac:'#f2f5ff',ac2:'#ffd23f'}},
  kartoffelsalat:{name:'Kartoffelsalat 1 kg',short:'Kartoffelsalat',cat:0,lvl:8,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.18,0.12,0.14],grid:[6,2,2],box:8,cost:2.00,market:4.99,weight:7,hype:0,risk:5,
    art:{title:'KARTOFFELSALAT',sub:'1 kg · mit Gurke',bg1:'#e8c35a',bg2:'#8a6a18',ac:'#1b5a2a',ac2:'#ffffff',light:true}},

  /* ---------- Level 9 ---------- */
  goldperlen:{name:'Goldene Perlen · Römisches Licht 8 Kugeln',short:'Goldperlen',cat:2,lvl:9,shape:'candle',dims:[0.09,0.34,0.09],grid:[8,2,1],box:8,cost:3.20,market:7.79,weight:7,hype:13,risk:5,
    art:{title:'GOLDPERLEN',sub:'8 Kugeln · Gold',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  bengalfackel:{name:'Bengalfackel rot · 60 Sekunden',short:'Bengalfackel',cat:2,lvl:9,shape:'cylinder',dims:[0.06,0.34,0.06],grid:[14,2,1],box:12,cost:1.80,market:4.29,weight:7,hype:9,risk:4,
    art:{title:'BENGALFEUER',sub:'rot · 60 s',bg1:'#c01c20',bg2:'#3a0507',ac:'#ffffff',ac2:'#ffd23f'}},
  glitzerregen12:{name:'Glitzerregen · 12 Schuss',short:'Batterie 12',cat:2,lvl:9,shape:'battery',dims:[0.2,0.16,0.2],grid:[9,2,1],box:10,cost:4.40,market:10.49,weight:7,hype:14,risk:5,
    art:{title:'GLITZERREGEN',sub:'12 Schuss Verbund',bg1:'#12406b',bg2:'#04121f',ac:'#f2f5ff',ac2:'#ffd23f'}},
  wuerstchen:{name:'Wiener Würstchen 10er',short:'Würstchen',cat:0,lvl:9,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.06,0.12],grid:[4,2,3],box:10,cost:2.20,market:5.49,weight:7,hype:0,risk:5,
    art:{title:'WIENER',sub:'10 Würstchen',bg1:'#c8322a',bg2:'#4a0a06',ac:'#fff3c4',ac2:'#ffd23f'}},
  frikadellen:{name:'Mini-Frikadellen 20er',short:'Frikadellen',cat:0,lvl:9,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.22,0.07,0.16],grid:[4,2,3],box:8,cost:2.60,market:6.49,weight:6,hype:0,risk:5,
    art:{title:'FRIKADELLEN',sub:'20 Mini · fürs Buffet',bg1:'#6b3a14',bg2:'#241204',ac:'#ffd23f',ac2:'#f2ecd8'}},
  baguette:{name:'Aufback-Baguette 4er',short:'Baguette',cat:0,lvl:9,shape:'boxA',dims:[0.4,0.08,0.12],grid:[4,2,2],box:10,cost:1.20,market:2.99,weight:7,hype:0,risk:3,
    art:{title:'BAGUETTE',sub:'4 Stück zum Aufbacken',bg1:'#e8c35a',bg2:'#8a5a18',ac:'#1b3a6b',ac2:'#c8322a',light:true}},
  bier:{name:'Pils 6er-Pack',short:'Pils 6er',cat:0,lvl:9,cold:true,shape:'boxA',dims:[0.2,0.24,0.14],grid:[6,1,2],box:4,cost:2.40,market:5.99,weight:8,hype:0,risk:4,
    art:{title:'PILS',sub:'6 × 0,5 l',bg1:'#1b5a2a',bg2:'#062a10',ac:'#ffd23f',ac2:'#e8e2c8'}},
  cola:{name:'Cola 6 × 1 l',short:'Cola',cat:0,lvl:9,cold:true,shape:'boxA',dims:[0.24,0.3,0.16],grid:[6,1,1],box:4,cost:2.60,market:6.49,weight:8,hype:0,risk:3,
    art:{title:'COLA',sub:'6 × 1 Liter',bg1:'#8a0a0a',bg2:'#2a0202',ac:'#ffffff',ac2:'#ffd23f'}},
  kinderpunsch:{name:'Kinderpunsch 1 l',short:'Kinderpunsch',cat:0,lvl:9,shape:'boxA',dims:[0.1,0.25,0.07],grid:[14,2,1],box:12,cost:1.20,market:2.99,weight:6,hype:0,risk:2,
    art:{title:'KINDERPUNSCH',sub:'alkoholfrei · 1 l',bg1:'#c8322a',bg2:'#4a0a06',ac:'#ffd23f',ac2:'#ffe45c'}},
  gummibaerchen:{name:'Fruchtgummi-Mix XXL',short:'Fruchtgummi',cat:0,lvl:9,shape:'boxA',dims:[0.18,0.26,0.07],grid:[8,2,1],box:14,cost:1.10,market:2.79,weight:7,hype:0,risk:3,
    art:{title:'FRUCHTGUMMI',sub:'XXL-Mix',bg1:'#ff4fa3',bg2:'#8a1f6a',ac:'#ffe45c',ac2:'#5cff9e'}},

  /* ---------- Level 10: Kleinfeuerwerk ---------- */
  sternstaub20:{name:'Sternenstaub · 20 Schuss',short:'Batterie 20',cat:2,lvl:10,shape:'battery',dims:[0.22,0.18,0.22],grid:[8,2,1],box:8,cost:6.00,market:14.49,weight:7,hype:18,risk:5,
    art:{title:'STERNENSTAUB',sub:'20 Schuss Verbund',bg1:'#1f3f8a',bg2:'#070e22',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  silberpfeil:{name:'Silberpfeil · 10 Leitwerkraketen',short:'Silberpfeil',cat:2,lvl:10,shape:'rocketset',dims:[0.44,0.06,0.13],grid:[4,2,2],box:8,cost:4.20,market:9.99,weight:7,hype:14,risk:4,
    desc:'Leitwerkrakete ohne Stab: Knall, ein Silberstrich, und oben zucken zwölf Laserstrahlen auseinander. Schnell, hart, silbern.',
    art:{title:'SILBERPFEIL',sub:'10 Leitwerkraketen',bg1:'#26292f',bg2:'#000000',ac:'#d1e5ff',ac2:'#5ce1ff'}},
  konfettiknaller:{name:'Partyknall · Konfetti-Böller 6er',short:'Konfettiböller',cat:2,lvl:10,shape:'tubepack',dims:[0.15,0.06,0.06],grid:[8,2,2],box:12,cost:2.60,market:6.19,weight:7,hype:10,risk:4,
    desc:'Knall, und dann regnet es bunt: jeder Böller wirft eine Wolke Konfetti in die Luft.',
    art:{title:'PARTYKNALL',sub:'6 Konfetti-Böller',bg1:'#ff4fa3',bg2:'#6a24c9',ac:'#ffe45c',ac2:'#5ce1ff'}},
  zauberbrunnen:{name:'Zauberbrunnen · Knisterfontäne 20 s',short:'Zauberbrunnen',cat:2,lvl:10,shape:'cylinder',dims:[0.12,0.26,0.12],grid:[8,2,1],box:8,cost:4.00,market:9.49,weight:7,hype:14,risk:5,
    art:{title:'ZAUBERBRUNNEN',sub:'Knisterfontäne · 20 s',bg1:'#0f7a6b',bg2:'#03302a',ac:'#fff3a0',ac2:'#f2f5ff'}},
  mettigel:{name:'Mett-Igel für 8',short:'Mett-Igel',cat:0,lvl:10,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.1,0.2],grid:[4,2,2],box:4,cost:4.40,market:10.99,weight:5,hype:0,risk:6,
    art:{title:'METT-IGEL',sub:'für 8 · mit Zwiebel',bg1:'#c8322a',bg2:'#4a0a06',ac:'#f2ecd8',ac2:'#ffd23f'}},
  partypizza:{name:'Partypizza 4er tiefgekühlt',short:'Partypizza',cat:0,lvl:10,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.3,0.08,0.3],grid:[3,2,2],box:6,cost:3.60,market:8.99,weight:6,hype:0,risk:5,
    art:{title:'PARTYPIZZA',sub:'4 Stück · TK',bg1:'#1b5a2a',bg2:'#c8322a',ac:'#ffffff',ac2:'#ffd23f'}},
  energy:{name:'Energydrink 4er',short:'Energydrink',cat:0,lvl:10,cold:true,shape:'boxA',dims:[0.14,0.16,0.07],grid:[10,2,1],box:12,cost:2.00,market:4.99,weight:6,hype:0,risk:3,
    art:{title:'VOLTAGE',sub:'Energydrink 4 × 0,25 l',bg1:'#1b1b2e',bg2:'#000000',ac:'#9cff3a',ac2:'#5ce1ff'}},
  orangensaft:{name:'Orangensaft 1 l',short:'O-Saft',cat:0,lvl:10,cold:true,shape:'boxA',dims:[0.1,0.25,0.07],grid:[14,2,1],box:12,cost:0.90,market:2.29,weight:6,hype:0,risk:3,
    art:{title:'ORANGE',sub:'Saft · 1 Liter',bg1:'#f28a1c',bg2:'#8a3d06',ac:'#ffffff',ac2:'#1b5a2a'}},
  dips:{name:'Dip-Trio: Kräuter, Knoblauch, Curry',short:'Dips',cat:0,lvl:10,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.22,0.06,0.1],grid:[6,2,3],box:10,cost:1.80,market:4.49,weight:6,hype:0,risk:4,
    art:{title:'DIP-TRIO',sub:'Kräuter · Knoblauch · Curry',bg1:'#1b5a2a',bg2:'#062a10',ac:'#f2ecd8',ac2:'#e8b418'}},

  /* ---------- Level 11 ---------- */
  goldstaubboeller:{name:'Goldstaub · Glitzerböller 8er',short:'Glitzerböller',cat:2,lvl:11,shape:'tubepack',dims:[0.15,0.06,0.06],grid:[8,2,2],box:12,cost:3.00,market:7.19,weight:7,hype:12,risk:5,
    desc:'Ein satter Knall, danach hängt eine Wolke aus Goldglitzer über dem Tisch und rieselt herunter.',
    art:{title:'GOLDSTAUB',sub:'8 Glitzerböller',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  kometenraketen:{name:'Kometenkette · 5 Raketen',short:'Kometenkette',cat:2,lvl:11,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:5.60,market:13.49,weight:7,hype:18,risk:5,
    desc:'Ein großer Goldkomet steigt auf. Oben zerbricht sein Kern in eine Kette aus sieben kleinen Kometen, die hintereinander weiterziehen und einer nach dem anderen verglühen.',
    art:{title:'KOMETENKETTE',sub:'5 Raketen · Kern zerbricht',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#5ce1ff'}},
  pfauenrad:{name:'Pfauenrad · 19 Schuss Fächer',short:'Fächer 19',cat:2,lvl:11,shape:'fan',dims:[0.4,0.2,0.26],grid:[5,1,1],box:4,cost:8.00,market:18.99,weight:6,hype:22,risk:6,
    art:{title:'PFAUENRAD',sub:'19 Schuss Fächer',bg1:'#0f5a6b',bg2:'#032028',ac:'#5cff9e',ac2:'#ff4fa3'}},
  glueckssymbole:{name:'Glücksbringer-Set: Schornsteinfeger, Kleeblatt, Schwein',short:'Glücksbringer',cat:0,lvl:11,shape:'boxA',dims:[0.2,0.22,0.08],grid:[8,2,1],box:12,cost:1.80,market:4.49,weight:7,hype:0,risk:1,
    art:{title:'VIEL GLÜCK',sub:'Glücksbringer-Set',bg1:'#1b5a2a',bg2:'#062a10',ac:'#ffd23f',ac2:'#ff4a4a'}},
  glueckskekse:{name:'Glückskekse »Neujahr« 20er',short:'Glückskekse',cat:0,lvl:11,shape:'boxA',dims:[0.2,0.1,0.14],grid:[6,2,2],box:12,cost:1.40,market:3.49,weight:6,hype:0,risk:2,
    art:{title:'GLÜCKSKEKSE',sub:'20 Stück · Neujahr',bg1:'#c8322a',bg2:'#4a0a06',ac:'#ffd23f',ac2:'#fff3c4'}},
  gluecksklee:{name:'Glücksklee im Topf',short:'Glücksklee',cat:0,lvl:11,shape:'cylinder',dims:[0.1,0.14,0.1],grid:[10,2,1],box:12,cost:1.00,market:2.49,weight:7,hype:0,risk:3,
    art:{title:'GLÜCKSKLEE',sub:'im Topf',bg1:'#2f9e57',bg2:'#0d3a20',ac:'#ffd23f',ac2:'#ff4a4a'}},
  marzipanschwein:{name:'Glücksschweinchen aus Marzipan 6er',short:'Marzipanschwein',cat:0,lvl:11,shape:'boxA',dims:[0.18,0.06,0.12],grid:[8,2,2],box:16,cost:1.60,market:3.99,weight:6,hype:0,risk:3,
    art:{title:'GLÜCKSSCHWEIN',sub:'Marzipan · 6 Stück',bg1:'#e58ca5',bg2:'#7a2a44',ac:'#fff3c4',ac2:'#1b5a2a'}},
  schokotaler:{name:'Schoko-Glückstaler 30er',short:'Glückstaler',cat:0,lvl:11,shape:'boxA',dims:[0.16,0.18,0.05],grid:[10,2,1],box:16,cost:1.20,market:2.99,weight:6,hype:0,risk:3,
    art:{title:'GLÜCKSTALER',sub:'Schokolade · 30 Stück',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#f2ecd8',gold:true}},

  /* ---------- Level 12 ---------- */
  farbenrausch:{name:'Halbe-Halbe · 7 Raketen Zweifarbenbruch',short:'Halbe-Halbe',cat:2,lvl:12,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:6.40,market:14.99,weight:7,hype:20,risk:5,
    desc:'Eine Hälfte Magenta, eine Hälfte Limette, dann wird getauscht. Die Rakete fliegt mit farbiger Flamme statt Funkenschweif.',
    art:{title:'HALBE-HALBE',sub:'7 Raketen · Zweifarbenbruch',bg1:'#6a24c9',bg2:'#25093f',ac:'#5cff9e',ac2:'#ff4fa3'}},
  nachtfalter:{name:'Nachtfalter · 36 Schuss',short:'Batterie 36',cat:2,lvl:12,shape:'battery',dims:[0.3,0.24,0.3],grid:[7,1,1],box:6,cost:11.00,market:25.99,weight:6,hype:26,risk:6,
    art:{title:'NACHTFALTER',sub:'36 Schuss Verbund',bg1:'#2a0f5a',bg2:'#0a0318',ac:'#ffd23f',ac2:'#c8a2ff'}},
  feuerberg:{name:'Feuerberg · Vulkan rot-gold 15 s',short:'Feuerberg',cat:2,lvl:12,shape:'cylinder',dims:[0.14,0.3,0.14],grid:[8,2,1],box:8,cost:6.80,market:15.99,weight:6,hype:22,risk:6,
    art:{title:'FEUERBERG',sub:'Vulkan · rot & gold',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#ff7a1c'}},
  raclettekaese:{name:'Raclettekäse in Scheiben 1 kg',short:'Raclettekäse',cat:0,lvl:12,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.06,0.18],grid:[4,2,3],box:8,cost:5.20,market:12.99,weight:6,hype:0,risk:5,
    art:{title:'RACLETTEKÄSE',sub:'1 kg · in Scheiben',bg1:'#e8b418',bg2:'#8a5a08',ac:'#1b1b1b',ac2:'#c8322a',light:true}},
  raclettezubehoer:{name:'Raclette-Pfännchen & Schieber 8er',short:'Pfännchen',cat:0,lvl:12,shape:'boxA',dims:[0.26,0.08,0.18],grid:[6,2,2],box:8,cost:3.40,market:8.49,weight:4,hype:0,risk:2,
    art:{title:'PFÄNNCHEN',sub:'8 Stück + Schieber',bg1:'#26292f',bg2:'#0b0d14',ac:'#ffd23f',ac2:'#ff4a4a'}},
  fonduesossen:{name:'Fondue-Soßen 5er-Set',short:'Fonduesoßen',cat:0,lvl:12,cold:true,shape:'boxA',dims:[0.26,0.1,0.14],grid:[6,2,2],box:8,cost:2.80,market:6.99,weight:5,hype:0,risk:4,
    art:{title:'FONDUE-SOSSEN',sub:'5 Sorten',bg1:'#8a1a1a',bg2:'#3a0606',ac:'#fff3c4',ac2:'#ffd23f'}},
  karaoke:{name:'Karaoke-Mikrofon Bluetooth',short:'Karaoke',cat:0,lvl:12,shape:'boxA',dims:[0.12,0.3,0.08],grid:[8,2,1],box:6,cost:9.00,market:22.99,weight:3,hype:0,risk:3,
    art:{title:'KARAOKE',sub:'Mikrofon · Bluetooth',bg1:'#6a1a8a',bg2:'#1a0626',ac:'#5ce1ff',ac2:'#ff4fa3'}},
  discokugel:{name:'Discokugel mit LED',short:'Discokugel',cat:0,lvl:12,shape:'boxA',dims:[0.2,0.2,0.2],grid:[5,1,1],box:6,cost:6.40,market:15.99,weight:3,hype:0,risk:3,
    art:{title:'DISCO',sub:'Kugel mit LED',bg1:'#1b1b2e',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff4fd8'}},

  /* ---------- Level 13: Feuerzauber ---------- */
  goldpalmen:{name:'Goldpalmen · 25 Schuss',short:'Batterie 25',cat:2,lvl:13,shape:'battery',dims:[0.28,0.22,0.28],grid:[7,2,1],box:6,cost:9.80,market:22.99,weight:6,hype:24,risk:6,
    art:{title:'GOLDPALMEN',sub:'25 Schuss Verbund',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#1b5a2a',gold:true}},
  funkenturm:{name:'Funkenturm · 6-m-Fontäne',short:'Funkenturm',cat:2,lvl:13,shape:'cylinder',dims:[0.15,0.32,0.15],grid:[8,1,1],box:6,cost:7.60,market:17.99,weight:6,hype:24,risk:6,
    art:{title:'FUNKENTURM',sub:'6 m Fontäne · 15 s',bg1:'#12735a',bg2:'#063328',ac:'#f2f5ff',ac2:'#ffd23f'}},
  knisterstern:{name:'Spätzünder · 10 Knisterraketen',short:'Spätzünder',cat:2,lvl:13,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:6.80,market:15.99,weight:6,hype:22,risk:6,
    desc:'Knistert beim Steigen, macht oben kurz »Pff« … und wenn keiner mehr hinschaut, prasselt eine riesige Knisterwolke los.',
    art:{title:'SPÄTZÜNDER',sub:'10 Knisterraketen',bg1:'#12406b',bg2:'#04121f',ac:'#5ce1ff',ac2:'#ffd23f'}},
  mondschein:{name:'Mondschein · 30 Schuss Silber',short:'Batterie 30',cat:2,lvl:13,shape:'battery',dims:[0.3,0.24,0.3],grid:[7,1,1],box:6,cost:11.50,market:26.99,weight:6,hype:26,risk:6,
    art:{title:'MONDSCHEIN',sub:'30 Schuss · Silber',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  kaeseplatte:{name:'Käseplatte für 6',short:'Käseplatte',cat:0,lvl:13,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.3,0.07,0.22],grid:[3,2,3],box:6,cost:6.40,market:15.99,weight:5,hype:0,risk:5,
    art:{title:'KÄSEPLATTE',sub:'für 6 · gekühlt',bg1:'#e8b418',bg2:'#8a5a08',ac:'#1b3a6b',ac2:'#c8322a',light:true}},
  lachs:{name:'Räucherlachs-Platte 400 g',short:'Räucherlachs',cat:0,lvl:13,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.04,0.18],grid:[4,2,4],box:8,cost:5.20,market:12.99,weight:5,hype:0,risk:5,
    art:{title:'RÄUCHERLACHS',sub:'400 g · geschnitten',bg1:'#f28a5a',bg2:'#8a3d1a',ac:'#0e1226',ac2:'#ffffff',light:true}},
  rollmops:{name:'Katerfrühstück: Rollmops & Gewürzgurken',short:'Rollmops',cat:0,lvl:13,cold:true,shape:'bottle',dims:[0.1,0.18,0.1],grid:[12,2,1],box:12,cost:1.80,market:4.49,weight:6,hype:0,risk:4,
    art:{title:'KATERFRÜHSTÜCK',sub:'Rollmops & Gurken',bg1:'#1b5a2a',bg2:'#062a10',ac:'#f2ecd8',ac2:'#ffd23f'}},
  cracker:{name:'Cracker-Mix für Käse',short:'Cracker',cat:0,lvl:13,shape:'boxA',dims:[0.2,0.14,0.08],grid:[8,2,1],box:12,cost:1.30,market:3.29,weight:5,hype:0,risk:3,
    art:{title:'CRACKER',sub:'Mix für Käse',bg1:'#8a5a18',bg2:'#2a1a04',ac:'#f2ecd8',ac2:'#ffd23f'}},

  /* ---------- Level 14 ---------- */
  feuerperlen:{name:'Feuerperlen · 16 Kugeln Römisches Licht',short:'Feuerperlen',cat:2,lvl:14,shape:'candle',dims:[0.11,0.38,0.11],grid:[8,2,1],box:6,cost:6.40,market:14.99,weight:6,hype:22,risk:6,
    art:{title:'FEUERPERLEN',sub:'16 Kugeln · bunt',bg1:'#7a1f3d',bg2:'#2a0714',ac:'#ffd23f',ac2:'#5cff9e'}},
  farbrauchboeller:{name:'Farbrauch-Böller 6er',short:'Farbrauchböller',cat:2,lvl:14,shape:'tubepack',dims:[0.16,0.065,0.065],grid:[7,2,2],box:12,cost:3.60,market:8.49,weight:6,hype:14,risk:5,
    desc:'Kräftiger Schlag, danach steht eine dicke Rauchwolke in Rot, Blau oder Grün über dem Platz.',
    art:{title:'FARBRAUCH',sub:'6 Böller · Rauchwolke',bg1:'#1557a8',bg2:'#8a1f6a',ac:'#5cff9e',ac2:'#ffe45c'}},
  feuerrad:{name:'Drehsonne · Feuerrad 12 s',short:'Feuerrad',cat:2,lvl:14,shape:'cylinder',dims:[0.2,0.2,0.08],grid:[6,2,1],box:6,cost:5.20,market:12.49,weight:6,hype:18,risk:5,
    art:{title:'DREHSONNE',sub:'Feuerrad · 12 s',bg1:'#f2a01c',bg2:'#8a3d06',ac:'#ffffff',ac2:'#c8201c'}},
  knisterfaecher:{name:'Knisterfächer · 24 Schuss',short:'Fächer 24',cat:2,lvl:14,shape:'fan',dims:[0.48,0.24,0.3],grid:[4,1,1],box:3,cost:12.00,market:27.99,weight:6,hype:30,risk:7,
    art:{title:'KNISTERFÄCHER',sub:'24 Schuss Fächer',bg1:'#12406b',bg2:'#04121f',ac:'#fff3a0',ac2:'#5ce1ff'}},
  palmenkugel75:{name:'Palmenstrand · Kugelbombe 75 mm',short:'Kugel 75 Palme',cat:2,lvl:14,shape:'shell',dims:[0.09,0.115,0.09],grid:[8,2,1],box:8,cost:5.80,market:13.99,weight:6,hype:24,risk:7,
    art:{title:'PALMENSTRAND',sub:'Kugelbombe 75 mm · Palme',bg1:'#1b5a2a',bg2:'#062a10',ac:'#ffd23f',ac2:'#5cff9e'}},

  /* ---------- Level 15: feine Getraenke, mehr Farbe ---------- */
  champagner:{name:'Champagner Brut',short:'Champagner',cat:0,lvl:15,cold:true,shape:'bottle',dims:[0.08,0.31,0.08],grid:[12,2,1],box:6,cost:12.00,market:29.99,weight:5,hype:0,risk:6,
    art:{title:'CHAMPAGNE',sub:'Brut · 0,75 l',bg1:'#0e1226',bg2:'#000000',ac:'#e8c35a',ac2:'#f2f5ff',gold:true}},
  cocktailset:{name:'Cocktail-Set »Mitternacht«',short:'Cocktailset',cat:0,lvl:15,shape:'boxA',dims:[0.28,0.3,0.12],grid:[5,1,1],box:4,cost:8.40,market:19.99,weight:4,hype:0,risk:4,
    art:{title:'MITTERNACHT',sub:'Cocktail-Set',bg1:'#2a0f5a',bg2:'#0a0318',ac:'#ff4fd8',ac2:'#5ce1ff'}},
  rotwein:{name:'Rotwein Spätburgunder',short:'Rotwein',cat:0,lvl:15,shape:'bottle',dims:[0.078,0.31,0.078],grid:[12,2,1],box:6,cost:3.60,market:8.99,weight:6,hype:0,risk:4,
    art:{title:'SPÄTBURGUNDER',sub:'Rotwein · trocken',bg1:'#5a0a1e',bg2:'#1a0206',ac:'#e8c35a',ac2:'#f2f5ff'}},
  smaragd:{name:'Smaragd · 7 Raketen Achtblatt',short:'Smaragd',cat:2,lvl:15,shape:'rocketset',dims:[0.48,0.065,0.145],grid:[3,2,2],box:6,cost:8.20,market:18.99,weight:6,hype:24,risk:6,
    desc:'Ein grüner Wirbel dreht sich nach oben. Dort geht eine achtblättrige Blüte in drei Grüntönen auf, geschliffen wie ein Smaragd.',
    art:{title:'SMARAGD',sub:'7 Raketen · Achtblatt-Blüte',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  dreiklang:{name:'Dreiklang · 3 Fontänen nacheinander',short:'Dreiklang',cat:2,lvl:15,shape:'fountainset',dims:[0.26,0.17,0.1],grid:[6,2,1],box:5,cost:7.40,market:17.49,weight:6,hype:24,risk:6,
    art:{title:'DREIKLANG',sub:'3 Fontänen in Folge',bg1:'#123a6b',bg2:'#04101f',ac:'#ffd23f',ac2:'#ff4fa3'}},
  sternenmeer42:{name:'Sternenmeer · 42 Schuss',short:'Batterie 42',cat:2,lvl:15,shape:'battery',dims:[0.36,0.28,0.34],grid:[6,1,1],box:5,cost:15.00,market:34.99,weight:5,hype:34,risk:7,
    art:{title:'STERNENMEER',sub:'42 Schuss Verbund',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#f2f5ff',ac2:'#ffd23f'}},

  /* ---------- Level 16: Nachthimmel ---------- */
  sternenmeer80:{name:'Silberbrandung · 80 Schuss Wellenbatterie',short:'Brandung 80',cat:2,lvl:16,shape:'battery',dims:[0.52,0.38,0.42],grid:[4,1,1],box:3,cost:26.00,market:59.99,weight:5,hype:48,risk:8,
    desc:'Silberne Gischt, die mitten im Flug zu türkisem Wasser wird – Welle auf Welle rollt über den Himmel, erst sanft, dann als Sturmflut.',
    art:{title:'SILBERBRANDUNG',sub:'80 Schuss · Silberwelle',bg1:'#0f4f5c',bg2:'#02141a',ac:'#d1e5ff',ac2:'#5ce1ff'}},
  silberwirbel:{name:'Silberwirbel · 30 Schuss Farfalle-Fächer',short:'Silberwirbel',cat:2,lvl:16,shape:'fan',dims:[0.56,0.26,0.32],grid:[4,1,1],box:3,cost:17.00,market:39.99,weight:5,hype:40,risk:8,
    desc:'Oben angekommen, zerfällt jeder Schuss in ein Dutzend kleiner Silberräder, die sich drehend und zischend durch die Luft schrauben.',
    art:{title:'SILBERWIRBEL',sub:'30 Schuss · Farfalle',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  farbenmeer75:{name:'Farbenmeer · Kugelbombe 75 mm Farbwechsel',short:'Kugel 75 Farbe',cat:2,lvl:16,shape:'shell',dims:[0.09,0.115,0.09],grid:[8,2,1],box:8,cost:6.20,market:14.99,weight:6,hype:28,risk:7,
    art:{title:'FARBENMEER',sub:'75 mm · Farbwechsel',bg1:'#5a1470',bg2:'#1a0322',ac:'#5ce1ff',ac2:'#ff4fa3'}},
  blinkstern:{name:'Leuchtturm · 5 Blinkraketen',short:'Leuchtturm',cat:2,lvl:16,shape:'rocketset',dims:[0.48,0.065,0.145],grid:[3,2,2],box:6,cost:9.00,market:20.99,weight:6,hype:28,risk:6,
    desc:'Die Rakete blinkt schon im Steigen. Oben wandert ein Lichtstrahl im Kreis durch die Sternkugel, wie das Leuchtfeuer eines Leuchtturms.',
    art:{title:'LEUCHTTURM',sub:'5 Blinkraketen',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  wasserspiel:{name:'Wasserspiel · Fontänenkette 4er',short:'Wasserspiel',cat:2,lvl:16,shape:'fountainset',dims:[0.3,0.17,0.1],grid:[6,2,1],box:5,cost:8.80,market:20.49,weight:6,hype:28,risk:6,
    art:{title:'WASSERSPIEL',sub:'4 Fontänen in Kette',bg1:'#0f5a6b',bg2:'#032028',ac:'#5ce1ff',ac2:'#f2f5ff'}},
  weisswein:{name:'Weißwein Riesling',short:'Weißwein',cat:0,lvl:16,cold:true,shape:'bottle',dims:[0.078,0.31,0.078],grid:[12,2,1],box:6,cost:3.40,market:8.49,weight:6,hype:0,risk:4,
    art:{title:'RIESLING',sub:'Weißwein · halbtrocken',bg1:'#e8e2a8',bg2:'#8a8448',ac:'#1b3a2e',ac2:'#c8a23a',light:true}},
  eierlikoer:{name:'Eierlikör 0,7 l',short:'Eierlikör',cat:0,lvl:16,shape:'bottle',dims:[0.08,0.28,0.08],grid:[12,2,1],box:6,cost:3.20,market:7.99,weight:5,hype:0,risk:4,
    art:{title:'EIERLIKÖR',sub:'0,7 Liter',bg1:'#f2d21b',bg2:'#8a7208',ac:'#1b1b1b',ac2:'#ffffff',light:true}},

  /* ---------- Level 17 ---------- */
  regenbogenfaecher:{name:'Regenbogenbrücke · 63 Schuss Spektralfächer',short:'Regenbogenbrücke',cat:2,lvl:17,shape:'fan',dims:[0.64,0.3,0.36],grid:[4,1,1],box:2,cost:27.00,market:62.99,weight:5,hype:50,risk:8,
    desc:'Erst Nieselregen, dann spannt sich ein Bogen aus sieben reinen Farben über den Himmel – Rot außen, Violett innen, 49 Schuss in unter zwei Sekunden.',
    art:{title:'REGENBOGENBRÜCKE',sub:'63 Schuss · Spektralbogen',bg1:'#6a24c9',bg2:'#25093f',ac:'#ffd23f',ac2:'#5cff9e'}},
  goldweide100:{name:'Goldweide · Kugelbombe 100 mm',short:'Kugel 100 Weide',cat:2,lvl:17,shape:'shell',dims:[0.12,0.15,0.12],grid:[6,2,1],box:6,cost:12.00,market:28.99,weight:5,hype:40,risk:8,
    art:{title:'GOLDWEIDE',sub:'Kugelbombe 100 mm',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  silberregen:{name:'Silberregen · 5 Raketen Regenring',short:'Silberregen',cat:2,lvl:17,shape:'rocketset',dims:[0.5,0.07,0.15],grid:[3,2,2],box:6,cost:10.00,market:23.49,weight:5,hype:32,risk:7,
    desc:'Oben legt sich ein Silberring waagrecht an den Himmel, und rundherum fällt senkrecht Regen in feinen Silberschnüren. Schon beim Aufstieg tropft der Schweif.',
    art:{title:'SILBERREGEN',sub:'5 Raketen · Regenring',bg1:'#26292f',bg2:'#000000',ac:'#f2f5ff',ac2:'#d1e5ff'}},
  hagelsturm:{name:'Hagelsturm · 320 Schuss in 40 s',short:'Hagelsturm',cat:2,lvl:17,shape:'battery',dims:[0.46,0.32,0.4],grid:[4,1,1],box:3,cost:22.00,market:49.99,weight:5,hype:50,risk:8,
    desc:'320 Schuss in 40 Sekunden: Ein Dauerprasseln aus weißen Hagelkörnern knapp über den Dächern, alle paar Sekunden schlägt oben ein großer Silberblitz ein – und am Boden sprühen die Knisterfontänen.',
    art:{title:'HAGELSTURM',sub:'320 Schuss · 40 Sekunden',bg1:'#3a4a5c',bg2:'#05090f',ac:'#f2f5ff',ac2:'#8fd8ff'}},
  glitzerkaskade:{name:'Glitzerkaskade · 8-m-Glitzerfontäne',short:'Glitzerkaskade',cat:2,lvl:17,shape:'cylinder',dims:[0.18,0.36,0.18],grid:[7,1,1],box:4,cost:12.00,market:27.99,weight:5,hype:34,risk:7,
    art:{title:'GLITZERKASKADE',sub:'8 m · Glitzer · 20 s',bg1:'#12204a',bg2:'#04081a',ac:'#f2f5ff',ac2:'#ffd23f'}},
  kaesefondue:{name:'Käsefondue-Set für 4',short:'Käsefondue',cat:0,lvl:17,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.1,0.18],grid:[4,2,2],box:6,cost:6.80,market:16.99,weight:4,hype:0,risk:5,
    art:{title:'KÄSEFONDUE',sub:'für 4 · mit Brot',bg1:'#e8b418',bg2:'#8a5a08',ac:'#7a1010',ac2:'#ffffff',light:true}},
  likoer:{name:'Sahnelikör 0,7 l',short:'Sahnelikör',cat:0,lvl:17,cold:true,shape:'bottle',dims:[0.08,0.28,0.08],grid:[12,2,1],box:6,cost:4.60,market:11.49,weight:4,hype:0,risk:4,
    art:{title:'SAHNELIKÖR',sub:'0,7 Liter',bg1:'#4a2a14',bg2:'#140a04',ac:'#f2e6c4',ac2:'#e8c35a'}},

  /* ---------- Level 18: Goldklasse ---------- */
  kreuzfeuer:{name:'Kreuzfeuer · 42 Schuss Crossette',short:'Kreuzfeuer',cat:2,lvl:18,shape:'battery',dims:[0.42,0.34,0.38],grid:[5,1,1],box:4,cost:21.00,market:48.99,weight:5,hype:44,risk:8,
    desc:'Kometen kreuzen sich in halber Höhe und zerplatzen oben mit Knall zu je vier Splittern – rot von links, weiß von rechts, bis der Himmel kariert ist.',
    art:{title:'KREUZFEUER',sub:'42 Schuss · Crossette',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#f2f5ff'}},
  kristall:{name:'Glasbruch · 5 Singraketen',short:'Glasbruch',cat:2,lvl:18,shape:'rocketset',dims:[0.52,0.075,0.16],grid:[3,2,2],box:6,cost:11.40,market:26.49,weight:5,hype:36,risk:7,
    desc:'Die Rakete singt wie ein Weinglas. Oben steht eine Kristallkugel, bis sie klirrend in tausend Splitter zerspringt.',
    art:{title:'GLASBRUCH',sub:'5 Singraketen',bg1:'#0f2a4a',bg2:'#02060f',ac:'#d1e5ff',ac2:'#f2f5ff'}},
  sternenstaub150:{name:'Sternenstaub · Kugelbombe 150 mm Blinker',short:'Kugel 150 Blink',cat:2,lvl:18,shape:'shell',dims:[0.165,0.2,0.165],grid:[4,1,1],box:3,cost:30.00,market:71.99,weight:4,hype:66,risk:10,
    art:{title:'STERNENSTAUB',sub:'150 mm · Blinksterne',bg1:'#12204a',bg2:'#04081a',ac:'#f2f5ff',ac2:'#ffd23f'}},
  magnum:{name:'Champagner Magnum 1,5 l',short:'Magnum',cat:0,lvl:18,cold:true,shape:'bottle',dims:[0.11,0.4,0.11],grid:[8,1,1],box:3,cost:28.00,market:69.99,weight:3,hype:0,risk:7,
    art:{title:'MAGNUM',sub:'Champagner 1,5 l',bg1:'#0e1226',bg2:'#000000',ac:'#e8c35a',ac2:'#f2f5ff',gold:true}},

  /* ---------- Level 19: Sternklasse ---------- */
  goldenerregen:{name:'Vorhang auf! · 70 Schuss Goldvorhang',short:'Goldvorhang',cat:2,lvl:19,shape:'battery',dims:[0.5,0.4,0.44],grid:[4,1,1],box:3,cost:34.00,market:78.99,weight:4,hype:62,risk:9,
    desc:'Drei Klingelzeichen, dann fällt ein goldener Bühnenvorhang über die ganze Breite und öffnet sich zur Mitte hin – dahinter drei Akte Brokat, Applaus, und am Ende schließt er sich wieder.',
    art:{title:'VORHANG AUF!',sub:'70 Schuss · Goldvorhang',bg1:'#6b0f1a',bg2:'#1a0205',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  regenbogenkrone:{name:'Jumbo-Rakete »Regenbogenkrone«',short:'Jumbo Regenbogenkrone',cat:2,lvl:19,shape:'rocketset',stueck:1,dims:[0.8,0.1,0.15],grid:[2,1,1],box:4,cost:12.50,market:29.99,weight:4,hype:40,risk:9,
    desc:'Kein bunter Ball, sondern eine Krone: Sieben Farben stehen der Reihe nach rundherum als Zacken am Himmel, und schon der Aufstieg malt das Spektrum.',
    art:{title:'REGENBOGENKRONE',sub:'Spektralkrone · Einzelrakete',bg1:'#6a24c9',bg2:'#25093f',ac:'#ffd23f',ac2:'#5cff9e'}},
  lichterkugeln:{name:'Lichterkette · 24 Schwebekugeln',short:'Lichterkette',cat:2,lvl:19,shape:'candle',dims:[0.13,0.42,0.13],grid:[7,2,1],box:4,cost:10.50,market:24.49,weight:5,hype:34,risk:7,
    desc:'Sechs Rohre legen eine Kette aus schwebenden Leuchtkugeln quer über den Himmel – sie hängen still und gehen dann Licht für Licht wieder aus.',
    art:{title:'LICHTERKETTE',sub:'24 Kugeln · schwebend',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#ff4fa3'}},
  eisblume:{name:'Eisblume · 12-m-Silberfontäne',short:'Eisblume',cat:2,lvl:19,shape:'cylinder',dims:[0.22,0.38,0.22],grid:[6,1,1],box:3,cost:18.00,market:42.99,weight:4,hype:50,risk:8,
    art:{title:'EISBLUME',sub:'12 m Silberfontäne · 22 s',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  donnerschlag:{name:'Donnerschlag · 20 Schlag Knallring',short:'Donnerschlag',cat:2,lvl:19,shape:'battery',dims:[0.34,0.3,0.34],grid:[6,1,1],box:4,cost:17.00,market:38.99,weight:5,hype:46,risk:9,
    desc:'Kein Farbenzauber, sondern Wumms: Jeder Schuss reißt oben einen Kreis aus Blitzschlägen auf, die rundherum nacheinander detonieren – ta-ta-ta-ta-BUMM.',
    art:{title:'DONNERSCHLAG',sub:'20 Schlag · Knallring',bg1:'#1c1c24',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff3b2e'}},

  /* ---------- Level 20-21 ---------- */
  feuerpfau:{name:'Neonsäulen · 100 Schuss Dreistufen-Fächer',short:'Neonsäulen',cat:2,lvl:20,shape:'fan',dims:[0.76,0.34,0.42],grid:[3,1,1],box:2,cost:44.00,market:99.99,weight:4,hype:72,risk:9,
    desc:'Jeder Schuss ist eine Säule aus Neonlicht: Feuertopf, Leuchtspur und Blüte in derselben Farbe – Magenta, Limette, Violett – vom Boden bis in 40 Meter.',
    art:{title:'NEONSÄULEN',sub:'100 Schuss · Dreistufen',bg1:'#3a0a5c',bg2:'#0a0214',ac:'#ff4fd8',ac2:'#9cff3a'}},
  goldvulkan:{name:'Goldvulkan XXL · 30 Sekunden',short:'Goldvulkan',cat:2,lvl:20,shape:'cylinder',dims:[0.24,0.36,0.24],grid:[6,1,1],box:3,cost:16.00,market:37.99,weight:4,hype:46,risk:8,
    art:{title:'GOLDVULKAN',sub:'XXL · 30 s',bg1:'#6b4a0c',bg2:'#1f1402',ac:'#ffd23f',ac2:'#ff7a1c',gold:true}},
  /* Spektakel-Batterie: Hexenringe um einen brodelnden Kessel */
  hexenkessel:{name:'Hexenkessel · 180 Schuss in 35 s',short:'Hexenkessel',cat:2,lvl:20,shape:'battery',dims:[0.62,0.42,0.5],grid:[3,1,1],box:2,cost:40.00,market:89.99,weight:4,hype:74,risk:9,
    desc:'In der Mitte brodelt ein giftgrüner Kessel, rundherum schießen Ringe aus acht Rohren gleichzeitig schräg nach außen – eine Hexenkrone nach der anderen, immer schneller.',
    art:{title:'HEXENKESSEL',sub:'180 Schuss · 35 Sekunden',bg1:'#2a5a0a',bg2:'#0a0214',ac:'#b6ff3a',ac2:'#c85cff'}},
  nordlicht:{name:'Nordlicht · 150 Schuss Polarlicht-Verbund',short:'Nordlicht',cat:2,lvl:21,shape:'battery',dims:[0.76,0.6,0.5],grid:[3,1,1],box:2,cost:58.00,market:129.99,weight:3,hype:80,risk:10,
    desc:'Leise, hoch und langsam: Grüne Lichtvorhänge mit violettem Saum hängen über dem Himmel und wehen. Nur einmal bricht ein Sonnensturm los – danach wird es wieder still.',
    art:{title:'NORDLICHT',sub:'150 Schuss · Polarlicht',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#c8a2ff'}},
  blitzgewitter60:{name:'Lauflicht · 60 Schuss Strobe',short:'Lauflicht',cat:2,lvl:21,shape:'battery',dims:[0.48,0.38,0.42],grid:[4,1,1],box:3,cost:30.00,market:69.99,weight:4,hype:58,risk:9,
    desc:'Hunderte Blinksterne, die nicht wild durcheinander flackern, sondern im Gleichtakt: Ein Lichtband läuft durch die Wolke, mal quer, mal als Ring nach außen – im Finale über den ganzen Himmel.',
    art:{title:'LAUFLICHT',sub:'60 Schuss · Strobe',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  feuerwand:{name:'Feuerwand · 5 Fontänen in Reihe',short:'Feuerwand',cat:2,lvl:21,shape:'fountainset',dims:[0.4,0.2,0.12],grid:[5,1,1],box:3,cost:19.00,market:44.99,weight:4,hype:52,risk:8,
    art:{title:'FEUERWAND',sub:'5 Fontänen in Reihe',bg1:'#8a1a08',bg2:'#240502',ac:'#ff8a2a',ac2:'#ffd23f',gold:true}},
  sternkugel150:{name:'Sternkranz · Kugelbombe 150 mm Crossette',short:'Kugel 150 Kreuz',cat:2,lvl:21,shape:'shell',dims:[0.165,0.2,0.165],grid:[4,1,1],box:3,cost:31.00,market:73.99,weight:4,hype:70,risk:10,
    art:{title:'STERNKRANZ',sub:'150 mm · Crossette',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#f2f5ff'}},

  /* ---------- Level 22-26: die ganz grossen ---------- */
  silbermond:{name:'Jumbo-Rakete »Mondfinsternis«',short:'Jumbo Mondfinsternis',cat:2,lvl:22,shape:'rocketset',stueck:1,dims:[0.84,0.11,0.16],grid:[2,1,1],box:3,cost:19.00,market:44.99,weight:3,hype:54,risk:10,
    desc:'Ein Vollmond aus Silber geht auf. Langsam schiebt sich der Schatten darüber, bis nur noch ein kupferroter Blutmond am Himmel glüht.',
    art:{title:'MONDFINSTERNIS',sub:'Blutmond · Einzelrakete',bg1:'#26292f',bg2:'#000000',ac:'#f2f5ff',ac2:'#d1e5ff'}},
  pfeifkonzert:{name:'Pfeifkonzert · 80 Schuss Dreiklang-Heuler',short:'Pfeifkonzert',cat:2,lvl:22,shape:'fan',dims:[0.72,0.32,0.4],grid:[3,1,1],box:2,cost:36.00,market:82.99,weight:4,hype:62,risk:9,
    desc:'Ein Orchester aus Pfeifen: erst stimmt jeder für sich, dann Piccolo-Triller, lange Heuler im Duett, kreischende Wirbel – und am Ende zehn Heuler auf einen Schlag, die dreimal gemeinsam den Ton wechseln.',
    art:{title:'PFEIFKONZERT',sub:'80 Schuss · Dreiklang',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  sternenkaiser:{name:'Kaleidoskop · 250 Schuss Spiegelverbund',short:'Kaleidoskop',cat:2,lvl:23,shape:'battery',dims:[0.96,0.84,0.58],grid:[2,1,1],box:1,cost:92.00,market:199.99,weight:2,hype:96,risk:10,
    desc:'Wie ein Blick durchs Kaleidoskop: Jeder Bruch zerfällt in zwölf Inseln aus buntem Glas, und alles geschieht spiegelgleich – links wie rechts, außen wie innen.',
    art:{title:'KALEIDOSKOP',sub:'250 Schuss · Spiegelverbund',bg1:'#5a0f6b',bg2:'#05020f',ac:'#5ce1ff',ac2:'#ffd23f',gold:true}},
  kometenwand:{name:'Weidenwand · 90 Schuss Dreiteiler',short:'Weidenwand',cat:2,lvl:23,shape:'fan',dims:[0.76,0.34,0.42],grid:[3,1,1],box:2,cost:42.00,market:94.99,weight:3,hype:70,risk:9,
    desc:'Drei Batterien in einer Reihe: links, Mitte, rechts im Wechselgespräch – und im Finale feuern alle drei gleichzeitig eine Wand aus goldenen Trauerweiden mit weißen Blinkern.',
    art:{title:'WEIDENWAND',sub:'90 Schuss · 3 Module',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#f2f5ff',gold:true}},
  /* Spektakel-Batterie: Geysire springen uebers Feld, darueber Saeulen aus fuenf Schuss */
  geysirfeld:{name:'Geysirfeld · 200 Schuss in 40 s',short:'Geysirfeld',cat:2,lvl:23,shape:'battery',dims:[0.82,0.5,0.52],grid:[3,1,1],box:2,cost:62.00,market:139.99,weight:3,hype:88,risk:10,
    desc:'Irgendwo im Feld brodelt es – dann schießt ein Geysir aus dem Boden, und über ihm steigt eine Säule aus fünf Schüssen immer höher. Die Ausbrüche springen quer übers Feld, bis alle fünf gleichzeitig hochgehen.',
    art:{title:'GEYSIRFELD',sub:'200 Schuss · 40 Sekunden',bg1:'#0f4a5c',bg2:'#020a10',ac:'#f2f5ff',ac2:'#5cffe8'}},
  goldkrone200:{name:'Goldkrone · Kugelbombe 200 mm Kamuro',short:'Kugel 200 Kamuro',cat:2,lvl:24,shape:'shell',dims:[0.21,0.25,0.21],grid:[3,1,1],box:2,cost:46.00,market:109.99,weight:3,hype:92,risk:10,
    art:{title:'GOLDKRONE',sub:'200 mm · Kamuro',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  silberkaskade:{name:'Silberkaskade · 20-m-Fontäne',short:'Silberkaskade',cat:2,lvl:24,shape:'cylinder',dims:[0.28,0.44,0.28],grid:[4,1,1],box:2,cost:28.00,market:66.99,weight:3,hype:66,risk:10,
    art:{title:'SILBERKASKADE',sub:'20 m · Silber · 22 s',bg1:'#8a9299',bg2:'#1a1e24',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  feuerdrache:{name:'Jumbo-Rakete »Feuerdrache«',short:'Jumbo Drache',cat:2,lvl:24,shape:'rocketset',stueck:1,dims:[0.86,0.12,0.17],grid:[2,1,1],box:2,cost:24.00,market:56.99,weight:3,hype:62,risk:10,
    art:{title:'JUMBO',sub:'Feuerdrache · Einzelrakete',bg1:'#7a1010',bg2:'#1a0202',ac:'#ff7a1c',ac2:'#ffd23f'}},
  himmelsfaecher:{name:'Lichtgitter · 180 Schuss Laserfächer',short:'Lichtgitter',cat:2,lvl:25,shape:'fan',dims:[0.9,0.4,0.5],grid:[2,1,1],box:1,cost:78.00,market:169.99,weight:2,hype:94,risk:10,
    desc:'Gleißende Laserkometen aus drei Positionen kreuzen sich zu einem Netz aus Licht, an den Kreuzungen blühen Sterne auf – wie ein Gitter, das über den ganzen Himmel gespannt wird.',
    art:{title:'LICHTGITTER',sub:'180 Schuss · Laser',bg1:'#062a14',bg2:'#000000',ac:'#3aff7a',ac2:'#ff4fd8'}},
  supernova:{name:'Jumbo-Rakete »Supernova«',short:'Jumbo Supernova',cat:2,lvl:25,shape:'rocketset',stueck:1,dims:[0.9,0.13,0.18],grid:[2,1,1],box:2,cost:28.00,market:64.99,weight:3,hype:70,risk:10,
    desc:'Die größte Rakete im Laden zündet in der Luft eine zweite Stufe. Oben stürzt ein Stern in sich zusammen und explodiert: Blitz, Schockwelle, Nebel, Pulsar.',
    art:{title:'SUPERNOVA',sub:'Zweistufig · Einzelrakete',bg1:'#12204a',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff4fd8'}},
  silvesternacht:{name:'Silvesternacht · 40 Teile Countdown-Sortiment',short:'Silvesternacht',cat:2,lvl:25,shape:'assort',dims:[0.56,0.22,0.4],grid:[3,1,1],box:1,cost:52.00,market:119.99,weight:3,hype:78,risk:9,
    desc:'Der Abend vor Mitternacht in einer Kiste: erst Fontänen, Römisches Licht und Raketen, dann schlägt die Glocke zwölfmal – und beim letzten Schlag geht alles gleichzeitig hoch.',
    art:{title:'SILVESTERNACHT',sub:'40 Teile · Mitternacht',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#f2f5ff',gold:true}},
  kaiserkrone:{name:'Kaiserkrone · Kugelbombe 300 mm Gold',short:'Kugel 300 Gold',cat:2,lvl:26,shape:'shell',dims:[0.3,0.34,0.3],grid:[2,1,1],box:1,cost:74.00,market:174.99,weight:2,hype:100,risk:10,
    art:{title:'KAISERKRONE',sub:'300 mm · Goldvorhang',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  kugelfinale:{name:'Finale Grande · 5 italienische Mehrschlagbomben',short:'Finale Grande',cat:2,lvl:26,shape:'assort',dims:[0.5,0.3,0.36],grid:[3,1,1],box:1,cost:96.00,market:214.99,weight:2,hype:100,risk:10,
    desc:'Fünf italienische Zylinderbomben, jede schlägt öfter als die vorige: eins, zwei, drei, vier, fünf Brüche übereinander – die letzte endet mit einem Donnerschlag. Grün, Weiß, Rot leuchtet der Boden.',
    art:{title:'FINALE GRANDE',sub:'5 Mehrschlagbomben',bg1:'#0f4a1f',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff3b2e',gold:true}},
  /* Spektakel-Batterie: ein Hochhaus aus Feuer, vier Etagen zugleich */
  wolkenkratzer:{name:'Wolkenkratzer · 240 Schuss in 36 s – vier Etagen',short:'Wolkenkratzer',cat:2,lvl:26,shape:'battery',dims:[0.92,0.82,0.58],grid:[2,1,1],box:1,cost:104.00,market:229.99,weight:2,hype:100,risk:10,
    desc:'Ein Hochhaus aus Feuer: Unten sprühen goldene Fontänen, darüber rote Feuertöpfe, in der Mitte weiße Blüten, ganz oben blaue Großkaliber und ein rotes Warnlicht – Stockwerk für Stockwerk, bis alle vier Etagen gleichzeitig brennen.',
    art:{title:'WOLKENKRATZER',sub:'240 Schuss · 4 Etagen',bg1:'#12204a',bg2:'#000000',ac:'#ffd23f',ac2:'#ff3b2e',gold:true}},
  feuerkaskade:{name:'Feuerkaskade · 3 Riesenfontänen',short:'Feuerkaskade',cat:2,lvl:26,shape:'fountainset',dims:[0.44,0.24,0.16],grid:[4,1,1],box:2,cost:40.00,market:92.99,weight:3,hype:84,risk:10,
    art:{title:'FEUERKASKADE',sub:'3 Riesenfontänen · 30 s',bg1:'#7a1010',bg2:'#000000',ac:'#ffd23f',ac2:'#ff7a1c',gold:true}},

  /* ---------- noch mehr Kleinkram fuer den Laden ---------- */
  kindersekt2:{name:'Kindersekt Erdbeere',short:'Kindersekt Erdb.',cat:0,lvl:14,cold:true,shape:'bottle',dims:[0.07,0.26,0.07],grid:[12,2,1],box:12,cost:1.70,market:4.19,weight:5,hype:0,risk:3,
    art:{title:'ERDBEERSPRITZ',sub:'Kindersekt · 0,75 l',bg1:'#c8325a',bg2:'#5a0a1e',ac:'#ffe45c',ac2:'#f2f5ff'}},
  wunderkerzeXXL:{name:'Riesen-Wunderkerzen 1 m 5er',short:'Riesen-Wunderk.',cat:1,lvl:6,shape:'sparkler',dims:[0.12,0.46,0.04],grid:[10,2,1],box:10,cost:2.20,market:5.49,weight:6,hype:6,risk:2,
    art:{title:'RIESENFUNKEN',sub:'5 Wunderkerzen · 1 m',bg1:'#26307a',bg2:'#0b0f2e',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  leuchtstaebe:{name:'Magische Leuchtstäbe 6er',short:'Leuchtstäbe',cat:1,lvl:5,shape:'sparkler',dims:[0.1,0.3,0.03],grid:[12,3,1],box:24,cost:1.10,market:2.79,weight:6,hype:4,risk:1,
    art:{title:'MAGIC LIGHT',sub:'6 Farbleuchtstäbe',bg1:'#1b1b2e',bg2:'#070712',ac:'#ff4fd8',ac2:'#5cff9e'}},
  kinderbatterie:{name:'Sternchen · 6 Schuss Jugendbatterie',short:'Jugend 6',cat:1,lvl:4,shape:'battery',dims:[0.14,0.1,0.14],grid:[12,2,1],box:16,cost:2.00,market:4.79,weight:6,hype:6,risk:2,
    art:{title:'STERNCHEN',sub:'6 Schuss · Jugendfeuerwerk',bg1:'#2f9e57',bg2:'#0d3a20',ac:'#ffd23f',ac2:'#ff4fa3'}},
  kinderparty:{name:'Kinderparty · 12 Teile Sortiment',short:'Kindersortiment',cat:1,lvl:6,shape:'assort',dims:[0.34,0.12,0.24],grid:[5,1,1],box:3,cost:6.40,market:14.99,weight:6,hype:8,risk:2,
    art:{title:'KINDERPARTY',sub:'12 Teile Jugendfeuerwerk',bg1:'#ff4fa3',bg2:'#6a24c9',ac:'#ffe45c',ac2:'#5ce1ff'}},
  glitzerraketen:{name:'Himmelsgarbe · 12 Schüttraketen',short:'Himmelsgarbe',cat:2,lvl:8,shape:'rocketset',dims:[0.42,0.06,0.12],grid:[4,2,2],box:8,cost:3.40,market:7.99,weight:7,hype:11,risk:4,
    desc:'Schon der Aufstieg glitzert. Oben öffnet sich ohne Knall eine Garbe aus Grün und Gold, steigt noch ein Stück und fällt in weiten Bögen wie ein Springbrunnen am Himmel.',
    art:{title:'HIMMELSGARBE',sub:'12 Schüttraketen',bg1:'#12406b',bg2:'#04121f',ac:'#ffd23f',ac2:'#f2f5ff'}},
  heulbatterie:{name:'Heulboje · 12 Pfeifschuss Batterie',short:'Pfeif 12',cat:2,lvl:11,shape:'battery',dims:[0.24,0.2,0.24],grid:[8,2,1],box:8,cost:5.60,market:13.29,weight:6,hype:18,risk:5,
    art:{title:'HEULBOJE',sub:'12 Pfeifschuss',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  familienmix:{name:'Rummelplatz · 24 Teile Sortiment',short:'Rummelplatz',cat:2,lvl:17,shape:'assort',dims:[0.46,0.18,0.34],grid:[4,1,1],box:2,cost:26.00,market:59.99,weight:5,hype:46,risk:7,
    desc:'Ein Abend auf der Kirmes: Riesenrad und Kreisel am Boden, darüber dreht sich ein Karussell in Zuckerwatte-Farben – zum Schluss die Schießbude.',
    art:{title:'RUMMELPLATZ',sub:'24 Teile · Karussell',bg1:'#c8407a',bg2:'#2a0a24',ac:'#7affe8',ac2:'#fff27a'}},
  wunderbox:{name:'Wunderkerzen-Box 50 Stück',short:'Wunderkerzen-Box',cat:1,lvl:8,shape:'boxA',dims:[0.34,0.1,0.14],grid:[6,2,2],box:8,cost:4.40,market:10.49,weight:6,hype:5,risk:1,
    art:{title:'WUNDERBOX',sub:'50 Wunderkerzen',bg1:'#26307a',bg2:'#0b0f2e',ac:'#ffd23f',ac2:'#ff6a3d'}},
  schneeballschlacht:{name:'Schneeball · 12 Schuss Weißstern',short:'Batterie 12 weiß',cat:2,lvl:10,shape:'battery',dims:[0.2,0.16,0.2],grid:[9,2,1],box:10,cost:4.80,market:11.49,weight:6,hype:15,risk:5,
    art:{title:'SCHNEEBALL',sub:'12 Schuss · Weißstern',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  vulkanfeld:{name:'Vulkanfeld · 3 Mini-Vulkane',short:'Vulkanfeld',cat:2,lvl:12,shape:'fountainset',dims:[0.24,0.15,0.1],grid:[6,2,1],box:6,cost:5.40,market:12.79,weight:6,hype:18,risk:5,
    art:{title:'VULKANFELD',sub:'3 Mini-Vulkane',bg1:'#8a1a08',bg2:'#240502',ac:'#ff8a2a',ac2:'#ffd23f'}},
  kristallkugel100:{name:'Eiskristall · Kugelbombe 100 mm Ring',short:'Kugel 100 Ring',cat:2,lvl:15,shape:'shell',dims:[0.12,0.15,0.12],grid:[6,2,1],box:6,cost:11.00,market:25.99,weight:5,hype:34,risk:8,
    art:{title:'EISKRISTALL',sub:'100 mm · Doppelring',bg1:'#12406b',bg2:'#04121f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  sternfontaene:{name:'Sternregen · Fontäne 25 s',short:'Sternregen',cat:2,lvl:18,shape:'cylinder',dims:[0.18,0.36,0.18],grid:[7,1,1],box:4,cost:13.00,market:30.49,weight:5,hype:38,risk:7,
    art:{title:'STERNREGEN',sub:'Fontäne · 25 s',bg1:'#2a0f5a',bg2:'#0a0318',ac:'#ffd23f',ac2:'#c8a2ff'}},
  hochzeitsfaecher:{name:'Rosenherz · 36 Schuss Herzbild',short:'Rosenherz',cat:2,lvl:20,shape:'fan',dims:[0.62,0.28,0.34],grid:[4,1,1],box:2,cost:26.00,market:59.99,weight:4,hype:50,risk:8,
    desc:'Rosenblätter schweben, dann setzen sich rosa Blüten Paar für Paar zu einem riesigen Herz am Himmel zusammen. Zum Schluss: zwei goldene Ringe.',
    art:{title:'ROSENHERZ',sub:'36 Schuss · Herzbild',bg1:'#c01c6a',bg2:'#4a0626',ac:'#ffd23f',ac2:'#fff3c4'}},
  goldregen22:{name:'Goldene Zwillinge · 22 Kugeln Splitlicht',short:'Zwillinge 22',cat:2,lvl:22,shape:'candle',dims:[0.14,0.44,0.14],grid:[6,2,1],box:4,cost:14.00,market:32.99,weight:4,hype:44,risk:8,
    desc:'Jede goldene Leuchtkugel teilt sich im Gipfel mit einem Knacks in zwei, die in entgegengesetzte Richtungen davonziehen – von Schuss zu Schuss in eine andere Richtung, bis ein Stern aus Paaren entsteht.',
    art:{title:'GOLDENE ZWILLINGE',sub:'22 Kugeln · Split',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  tischfeuerwerk2:{name:'Tischfeuerwerk »Goldregen« 3er',short:'Tisch Gold',cat:1,lvl:7,shape:'cylinder',dims:[0.1,0.2,0.1],grid:[8,2,1],box:12,cost:2.00,market:4.99,weight:6,hype:5,risk:1,
    art:{title:'GOLDREGEN',sub:'Tischfeuerwerk 3er',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  bengalduo:{name:'Bengal-Duo · Rot & Grün 30 s',short:'Bengal-Duo',cat:2,lvl:13,shape:'fountainset',dims:[0.18,0.2,0.08],grid:[7,2,1],box:8,cost:3.80,market:8.99,weight:6,hype:14,risk:4,
    art:{title:'BENGAL-DUO',sub:'Rot & Grün · 30 s',bg1:'#0d4a2a',bg2:'#5a0608',ac:'#ffffff',ac2:'#ffd23f'}},
  fondueoel:{name:'Fondue-Brühe & Brennpaste',short:'Fonduebrühe',cat:0,lvl:14,shape:'boxA',dims:[0.12,0.22,0.08],grid:[10,2,1],box:12,cost:2.20,market:5.49,weight:5,hype:0,risk:3,
    art:{title:'FONDUE-BRÜHE',sub:'mit Brennpaste',bg1:'#8a3d06',bg2:'#2a1202',ac:'#fff3c4',ac2:'#ffd23f'}},
  wasser:{name:'Mineralwasser 6 × 1,5 l',short:'Wasser',cat:0,lvl:10,shape:'boxA',dims:[0.26,0.32,0.18],grid:[5,1,1],box:4,cost:1.60,market:3.99,weight:6,hype:0,risk:2,
    art:{title:'QUELLWASSER',sub:'6 × 1,5 Liter',bg1:'#2a6a9a',bg2:'#0a2236',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  /* Feinkost fuer die spaeten Level: die Getraenke-Lizenz waechst mit */
  kaviar:{name:'Kaviar-Set Deluxe mit Blinis',short:'Kaviar',cat:0,lvl:23,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.22,0.08,0.16],grid:[4,2,3],box:4,cost:34.00,market:84.99,weight:2,hype:0,risk:7,
    art:{title:'CAVIAR',sub:'Deluxe · mit Blinis',bg1:'#0e1226',bg2:'#000000',ac:'#e8c35a',ac2:'#f2f5ff',gold:true}},
  champagnerturm:{name:'Champagner-Turm-Set 24 Gläser',short:'Sektturm',cat:0,lvl:24,shape:'boxA',dims:[0.4,0.32,0.3],grid:[3,1,1],box:2,cost:22.00,market:54.99,weight:2,hype:0,risk:4,
    art:{title:'SEKTTURM',sub:'24 Gläser + Ständer',bg1:'#1b3a2e',bg2:'#08160f',ac:'#e8c35a',ac2:'#f2f5ff',gold:true}},
  luxusfondue:{name:'Fondue Chinoise Luxus für 8',short:'Luxusfondue',cat:0,lvl:25,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.34,0.1,0.24],grid:[3,2,2],box:3,cost:26.00,market:64.99,weight:2,hype:0,risk:6,
    art:{title:'CHINOISE',sub:'Luxus · für 8',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#f2e6c4',gold:true}},
  goldsekt:{name:'Sekt mit Blattgold',short:'Goldsekt',cat:0,lvl:25,cold:true,shape:'bottle',dims:[0.08,0.31,0.08],grid:[12,2,1],box:6,cost:9.00,market:22.49,weight:3,hype:0,risk:5,
    art:{title:'GOLDSEKT',sub:'mit echtem Blattgold',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  jahrgang:{name:'Jahrgangs-Champagner 2017',short:'Jahrgang',cat:0,lvl:26,cold:true,shape:'bottle',dims:[0.085,0.32,0.085],grid:[12,2,1],box:3,cost:46.00,market:114.99,weight:2,hype:0,risk:7,
    art:{title:'MILLÉSIME',sub:'Champagner 2017',bg1:'#0e1226',bg2:'#000000',ac:'#e8c35a',ac2:'#d1e5ff',gold:true}},
  /* ---------- 26.09., zweite Runde (Tom: "mehr F1, Essen und Getränke
     als eigene Kategorie") ---------- */
  partypopper:{name:'Party-Popper mit Zugband 10er',short:'Party-Popper',cat:1,lvl:1,shape:'boxA',dims:[0.16,0.22,0.05],grid:[10,2,1],box:24,cost:0.90,market:2.19,weight:8,hype:3,risk:1,
    art:{title:'PARTY-POPPER',sub:'10 Stück · mit Zugband',bg1:'#ffd23f',bg2:'#f28a1c',ac:'#c01c6a',ac2:'#1557a8',light:true}},
  tortenfontaene:{name:'Tortenfontänen »Eissterne« 4er',short:'Tortenfontänen',cat:1,lvl:3,shape:'boxA',dims:[0.12,0.2,0.04],grid:[12,3,1],box:24,cost:1.30,market:3.19,weight:7,hype:4,risk:1,
    art:{title:'EISSTERNE',sub:'4 Tortenfontänen · silber',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#ff4fa3'}},
  luftschlangentisch:{name:'Tischfeuerwerk »Luftschlangen-Regen«',short:'Tisch Schlangen',cat:1,lvl:4,shape:'cylinder',dims:[0.1,0.2,0.1],grid:[8,2,1],box:16,cost:1.40,market:3.49,weight:7,hype:5,risk:1,
    art:{title:'SCHLANGENREGEN',sub:'Tischfeuerwerk · Luftschlangen',bg1:'#1557a8',bg2:'#061a3a',ac:'#ff4fa3',ac2:'#ffe45c'}},
  stroboblinker:{name:'Stroboskop-Blinker 4er',short:'Blinker',cat:1,lvl:5,shape:'boxA',dims:[0.12,0.16,0.06],grid:[10,2,1],box:16,cost:1.80,market:4.29,weight:6,hype:6,risk:2,
    art:{title:'BLINKFEUER',sub:'4 Stroboskop-Blinker',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#ff4a4a'}},
  knallbonbonxxl:{name:'Riesen-Knallbonbon 50 cm',short:'Riesenbonbon',cat:1,lvl:6,shape:'boxA',dims:[0.4,0.1,0.1],grid:[4,2,2],box:8,cost:2.60,market:6.29,weight:6,hype:6,risk:1,
    art:{title:'RIESENBONBON',sub:'50 cm · mit Überraschungen',bg1:'#c01c20',bg2:'#5a0608',ac:'#ffd23f',ac2:'#5ce1ff',gold:true}},
  bengalflamme:{name:'Bengalische Flammen Blau-Violett 3er',short:'Bengalflammen',cat:1,lvl:8,shape:'boxA',dims:[0.18,0.1,0.06],grid:[8,2,2],box:16,cost:1.60,market:3.89,weight:6,hype:5,risk:1,
    art:{title:'BENGALFLAMME',sub:'3 Töpfchen · blau & violett',bg1:'#2a0f5a',bg2:'#0a0318',ac:'#5ce1ff',ac2:'#ff4fd8'}},
  zauberwald:{name:'Zauberwald · 10 Schuss Jugendbatterie',short:'Jugend 10',cat:1,lvl:10,shape:'battery',dims:[0.2,0.14,0.2],grid:[11,2,1],box:12,cost:3.00,market:6.99,weight:6,hype:9,risk:2,
    art:{title:'ZAUBERWALD',sub:'10 Schuss · Jugendfeuerwerk',bg1:'#1f5d2a',bg2:'#06200c',ac:'#ffd23f',ac2:'#c8ff5c'}},
  jugendbox:{name:'Ganzjahres-Box · 30 Teile Jugendfeuerwerk',short:'Jugendbox',cat:1,lvl:12,shape:'assort',dims:[0.4,0.14,0.28],grid:[4,1,1],box:3,cost:11.00,market:25.99,weight:5,hype:12,risk:2,
    art:{title:'GANZJAHRES-BOX',sub:'30 Teile Jugendfeuerwerk',bg1:'#0f7a6b',bg2:'#03302a',ac:'#ffe45c',ac2:'#ff4fa3'}},
  neujahrsbrezel:{name:'Neujahrsbrezel aus Hefeteig',short:'Neujahrsbrezel',cat:0,lvl:5,shape:'boxA',dims:[0.28,0.05,0.22],grid:[5,2,3],box:8,cost:1.60,market:3.99,weight:7,hype:0,risk:4,
    art:{title:'NEUJAHRSBREZEL',sub:'Hefeteig · süß',bg1:'#c8822a',bg2:'#5a3208',ac:'#fff3c4',ac2:'#ffd23f'}},
  gefuellteeier:{name:'Gefüllte Eier 12 Hälften',short:'Gefüllte Eier',cat:0,lvl:8,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.24,0.06,0.16],grid:[4,2,3],box:8,cost:2.20,market:5.49,weight:6,hype:0,risk:5,
    art:{title:'GEFÜLLTE EIER',sub:'12 Hälften · fürs Buffet',bg1:'#f2d21b',bg2:'#8a7208',ac:'#1b5a2a',ac2:'#ffffff',light:true}},
  nudelsalat:{name:'Nudelsalat 1 kg',short:'Nudelsalat',cat:0,lvl:9,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.18,0.12,0.14],grid:[6,2,2],box:8,cost:2.10,market:5.29,weight:7,hype:0,risk:5,
    art:{title:'NUDELSALAT',sub:'1 kg · Erbsen & Schinken',bg1:'#e8a21b',bg2:'#8a4a08',ac:'#ffffff',ac2:'#1b5a2a'}},
  gulaschsuppe:{name:'Mitternachts-Gulaschsuppe 800 ml',short:'Gulaschsuppe',cat:0,lvl:10,shape:'cylinder',dims:[0.11,0.17,0.11],grid:[12,2,1],box:12,cost:1.90,market:4.79,weight:6,hype:0,risk:3,
    art:{title:'GULASCHSUPPE',sub:'Mitternachtssuppe · 800 ml',bg1:'#8a2a0a',bg2:'#2a0a02',ac:'#ffd23f',ac2:'#f2ecd8'}},
  fingerfood:{name:'Party-Fingerfood-Platte 30 Teile',short:'Fingerfood',cat:0,lvl:11,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.3,0.07,0.22],grid:[3,2,3],box:6,cost:4.00,market:9.99,weight:5,hype:0,risk:5,
    art:{title:'FINGERFOOD',sub:'30 Teile · gekühlt · Mini-Quiche & Co.',bg1:'#1b3a6b',bg2:'#061a3a',ac:'#ffd23f',ac2:'#f2f5ff'}},
  schokofondue:{name:'Schokofondue-Set für 4 mit Obstspießen',short:'Schokofondue',cat:0,lvl:13,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.1,0.18],grid:[4,2,2],box:6,cost:5.60,market:13.99,weight:4,hype:0,risk:5,
    art:{title:'SCHOKOFONDUE',sub:'für 4 · mit Obstspießen',bg1:'#4a2a14',bg2:'#140a04',ac:'#ff4a6a',ac2:'#f2e6c4'}},
  karpfen:{name:'Silvesterkarpfen küchenfertig 1,5 kg',short:'Karpfen',cat:0,lvl:15,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.34,0.08,0.18],grid:[3,2,3],box:4,cost:6.00,market:14.99,weight:3,hype:0,risk:6,
    art:{title:'SILVESTERKARPFEN',sub:'küchenfertig · 1,5 kg',bg1:'#2a6a9a',bg2:'#0a2236',ac:'#f2f5ff',ac2:'#ffd23f'}},
  tiramisu:{name:'Tiramisu 1 kg Familienschale',short:'Tiramisu',cat:0,lvl:16,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.24,0.08,0.18],grid:[4,2,3],box:6,cost:3.80,market:9.49,weight:4,hype:0,risk:5,
    art:{title:'TIRAMISU',sub:'1 kg · Familienschale',bg1:'#6b4a2c',bg2:'#241204',ac:'#f2ecd8',ac2:'#e8c35a'}},
  neujahrstorte:{name:'Sahnetorte »Prosit Neujahr«',short:'Neujahrstorte',cat:0,lvl:17,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.1,0.26],grid:[3,2,2],box:4,cost:4.80,market:11.99,weight:4,hype:0,risk:5,
    art:{title:'NEUJAHRSTORTE',sub:'Sahnetorte · 12 Stücke',bg1:'#f2ecd8',bg2:'#8a5a18',ac:'#c8322a',ac2:'#e8c35a',light:true}},
  sushi:{name:'Sushi-Platte 32 Stück',short:'Sushi',cat:0,lvl:19,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.3,0.06,0.22],grid:[3,2,4],box:4,cost:9.60,market:23.99,weight:3,hype:0,risk:6,
    art:{title:'SUSHI',sub:'32 Stück · mit Wasabi',bg1:'#1b1b1b',bg2:'#000000',ac:'#ff4a4a',ac2:'#f2f5ff'}},
  austern:{name:'Frische Austern 12er',short:'Austern',cat:0,lvl:21,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.28,0.1,0.2],grid:[3,2,2],box:3,cost:14.00,market:34.99,weight:2,hype:0,risk:7,
    art:{title:'AUSTERN',sub:'12 Stück · frisch',bg1:'#2a4a5a',bg2:'#0a161c',ac:'#f2f5ff',ac2:'#e8c35a',gold:true}},
  hummer:{name:'Hummer gekocht ca. 500 g',short:'Hummer',cat:0,lvl:24,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.36,0.1,0.2],grid:[3,2,2],box:2,cost:12.00,market:29.99,weight:2,hype:0,risk:7,
    art:{title:'HUMMER',sub:'gekocht · ca. 500 g',bg1:'#c8322a',bg2:'#3a0507',ac:'#f2ecd8',ac2:'#e8c35a',gold:true}},
  prosecco:{name:'Prosecco Frizzante 0,75 l',short:'Prosecco',cat:0,lvl:5,cold:true,shape:'bottle',dims:[0.078,0.3,0.078],grid:[12,2,1],box:12,cost:2.60,market:6.49,weight:8,hype:0,risk:4,
    art:{title:'PROSECCO',sub:'Frizzante · 0,75 l',bg1:'#c8d86a',bg2:'#4a5a14',ac:'#1b3a2e',ac2:'#ffffff',light:true}},
  radler:{name:'Radler 6 × 0,5 l',short:'Radler',cat:0,lvl:9,cold:true,shape:'boxA',dims:[0.2,0.24,0.14],grid:[6,1,2],box:4,cost:2.30,market:5.79,weight:7,hype:0,risk:3,
    art:{title:'RADLER',sub:'Bier & Zitrone · 6 × 0,5 l',bg1:'#f2d21b',bg2:'#1b5a2a',ac:'#1b5a2a',ac2:'#ffffff'}},
  bierfrei:{name:'Pils alkoholfrei 6 × 0,5 l',short:'Pils 0,0',cat:0,lvl:10,cold:true,shape:'boxA',dims:[0.2,0.24,0.14],grid:[6,1,2],box:4,cost:2.40,market:5.99,weight:6,hype:0,risk:3,
    art:{title:'PILS 0,0 %',sub:'alkoholfrei · 6 × 0,5 l',bg1:'#1557a8',bg2:'#061a3a',ac:'#ffd23f',ac2:'#e8e2c8'}},
  limonade:{name:'Zitronenlimonade 6 × 1 l',short:'Limonade',cat:0,lvl:11,cold:true,shape:'boxA',dims:[0.24,0.3,0.16],grid:[6,1,1],box:4,cost:2.40,market:5.99,weight:6,hype:0,risk:2,
    art:{title:'LIMONADE',sub:'Zitrone · 6 × 1 Liter',bg1:'#ffe45c',bg2:'#8a7208',ac:'#1b5a2a',ac2:'#ffffff',light:true}},
  kurze:{name:'Party-Kurze Feige 20 × 2 cl',short:'Party-Kurze',cat:0,lvl:12,shape:'boxA',dims:[0.2,0.1,0.16],grid:[6,2,2],box:10,cost:4.40,market:10.99,weight:6,hype:0,risk:4,
    art:{title:'KURZE',sub:'Feige · 20 × 2 cl',bg1:'#6a1a4a',bg2:'#1a0614',ac:'#ffd23f',ac2:'#f2e6c4'}},
  hugo:{name:'Hugo-Set: Prosecco, Holunderblüte & Minze',short:'Hugo-Set',cat:0,lvl:14,cold:true,shape:'boxA',dims:[0.24,0.32,0.1],grid:[6,1,1],box:6,cost:4.60,market:11.49,weight:5,hype:0,risk:4,
    art:{title:'HUGO',sub:'Prosecco · Holunder · Minze',bg1:'#dff2c8',bg2:'#5a8a3a',ac:'#1b3a2e',ac2:'#ffffff',light:true}},
  gintonic:{name:'Gin 0,7 l mit 4 Tonic Water',short:'Gin & Tonic',cat:0,lvl:15,shape:'boxA',dims:[0.22,0.32,0.1],grid:[6,1,1],box:4,cost:8.80,market:21.99,weight:4,hype:0,risk:5,
    art:{title:'GIN & TONIC',sub:'Gin 0,7 l · 4 Tonic',bg1:'#12406b',bg2:'#04121f',ac:'#c8e6ff',ac2:'#e8c35a'}},
  whisky:{name:'Single Malt Whisky 12 Jahre 0,7 l',short:'Whisky',cat:0,lvl:20,shape:'boxA',dims:[0.1,0.32,0.1],grid:[12,2,1],box:6,cost:16.00,market:39.99,weight:3,hype:0,risk:6,
    art:{title:'SINGLE MALT',sub:'12 Jahre · 0,7 l',bg1:'#6b3a14',bg2:'#1f0a04',ac:'#e8c35a',ac2:'#f2e6c4',gold:true}},
  eiswuerfel:{name:'Eiswürfel 2 kg',short:'Eiswürfel',cat:0,lvl:12,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.24,0.3,0.08],grid:[6,1,2],box:8,cost:0.90,market:2.29,weight:5,hype:0,risk:3,
    art:{title:'EISWÜRFEL',sub:'2 kg',bg1:'#5ce1ff',bg2:'#1557a8',ac:'#ffffff',ac2:'#0e1226',light:true}}
};
/* Lizenzen: bestehende Pakete bekommen Ware dazu, neue Pakete fuellen
   die Luecken. Die Levelreihenfolge bleibt: jedes Produkt kommt erst mit
   seinem Paket und nicht vor seinem Level. */
const NEU_LIZ_DAZU={
  start:['wunderfarbe','wunderherz','partypopper'],
  zubehoer:['streichhoelzer','gehoerschutz','schutzbrille','feuerloescher','luftschlangenspray'],
  klassiker:['blitzknaller','bodenkreisel','rosesekt','berliner','glueckrakete','leuchtstaebe','neujahrsbrezel','prosecco'],
  partydeko:['kalender','sektglaeser','kerzen','servietten','haarreifen','fotobox','streukonfetti','lichterkette'],
  krach:['knallteppich','farbfontaenen','bodenfeuer','goldperlen','bengalfackel','glitzerregen12','miniverbund','glitzerraketen','wunderbox','bengalflamme'],
  partynacht:['bier','cola','kinderpunsch','energy','orangensaft','wasser','karaoke','discokugel','eiswuerfel','radler','bierfrei','limonade','kurze'],
  himmel:['nachtfalter','goldstaubboeller','kometenraketen','farbenrausch','feuerberg','vulkanfeld','glueckssymbole','glueckskekse','gluecksklee'],
  genuss:['raclettekaese','raclettezubehoer','fonduesossen','kaeseplatte','lachs','cracker','kaesefondue','fondueoel','luxusfondue','schokofondue'],
  verbund:['feuerperlen','farbrauchboeller','feuerrad','knisterfaecher','palmenkugel75','sternenmeer42','dreiklang','smaragd','kristallkugel100'],
  import:['regenbogenfaecher','goldweide100','silberregen','glitzerkaskade','familienmix'],
  grossfeuer:['feuerpfau','goldvulkan','nordlicht','blitzgewitter60','feuerwand','sternkugel150','hochzeitsfaecher'],
  profi:['silbermond','pfeifkonzert','sternenkaiser','kometenwand','goldkrone200','silberkaskade','feuerdrache','goldregen22']
};
const NEU_LIZENZEN=[
  {id:'jugend',lvl:2,cost:60,name:'Jugendfeuerwerk',
   desc:'Feuerwerk, das auch Kinder zünden dürfen: Knallbonbons, Tischbomben, Bengalische Hölzer, Zahlen-Wunderkerzen, Pharaoschlangen, Leuchtfontänen, der Feuerteufel, eine kleine Jugendbatterie und das Kinderparty-Sortiment.',
   items:['knallbonbon','tischbombe','bengalholz','wunderzahl','pharao','leuchtfontaene','feuerteufel','kinderbatterie','kinderparty','wunderkerzeXXL','tischfeuerwerk2','tortenfontaene','luftschlangentisch','stroboblinker','knallbonbonxxl']},
  {id:'snacks',lvl:7,cost:260,name:'Snacks & Süßes',
   desc:'Popcorn, Salzgebäck, Erdnüsse, Fruchtgummi, Berliner-Nachschub und die Glücksbringer zum Naschen: Marzipanschweinchen und Schoko-Glückstaler.',
   items:['popcorn','salzstangen','erdnuesse','gummibaerchen','marzipanschwein','schokotaler']},
  {id:'buffet',lvl:8,cost:700,name:'Silvester-Buffet',
   desc:'Heringssalat, Kartoffel- und Nudelsalat, gefüllte Eier, Würstchen, Mini-Frikadellen, Fingerfood, Baguette, Mett-Igel, Partypizza, Dips, die Mitternachts-Gulaschsuppe und das Katerfrühstück. Vieles davon gehört in den Kühlschrank.',
   items:['heringssalat','kartoffelsalat','wuerstchen','frikadellen','baguette','mettigel','partypizza','dips','rollmops','gefuellteeier','nudelsalat','gulaschsuppe','fingerfood']},
  {id:'kleinfeuer',lvl:10,cost:1800,name:'Kleinfeuerwerk',
   desc:'Die ersten richtigen Batterien für den kleinen Geldbeutel: Sternenstaub mit 20 Schuss, Schneeball in Weiß, die Heulboje mit Pfeifschüssen, das Pfauenrad als erster Fächer. Dazu Silberpfeil-Raketen, Konfetti-Böller und der Zauberbrunnen.',
   items:['sternstaub20','schneeballschlacht','heulbatterie','pfauenrad','silberpfeil','konfettiknaller','zauberbrunnen','zauberwald','jugendbox']},
  {id:'feuerzauber',lvl:13,cost:4200,name:'Feuerzauber',
   desc:'Goldpalmen, Mondschein, der Funkenturm mit sechs Metern, Spätzünder-Knisterraketen und das Bengal-Duo.',
   items:['goldpalmen','mondschein','funkenturm','knisterstern','bengalduo']},
  {id:'getraenke',lvl:14,cost:5000,name:'Feine Getränke',
   desc:'Champagner, Rot- und Weißwein, Eierlikör, Sahnelikör, Hugo-Set, Gin & Tonic, Whisky, das Cocktail-Set, Kindersekt Erdbeere, die Magnumflasche, Goldsekt, Jahrgangs-Champagner, der Sektturm und Kaviar für den großen Moment.',
   items:['champagner','cocktailset','rotwein','weisswein','eierlikoer','likoer','kindersekt2','magnum','kaviar','champagnerturm','goldsekt','jahrgang','hugo','gintonic','whisky']},
  {id:'nachthimmel',lvl:16,cost:9000,name:'Nachthimmel',
   desc:'Die Silberbrandung mit 80 Schuss, der Silberwirbel mit drehenden Silberrädern, die 75-mm-Farbwechselkugel, Leuchtturm-Blinkraketen und das Wasserspiel.',
   items:['sternenmeer80','silberwirbel','farbenmeer75','blinkstern','wasserspiel']},
  {id:'goldklasse',lvl:18,cost:15000,name:'Goldklasse',
   desc:'Kreuzfeuer mit gekreuzten Kometen, Glasbruch-Raketen, die 150-mm-Blinkkugel und die Sternregen-Fontäne.',
   items:['kreuzfeuer','kristall','sternenstaub150','sternfontaene']},
  {id:'sternklasse',lvl:19,cost:18000,name:'Sternklasse',
   desc:'Vorhang auf! mit 70 Schuss Goldvorhang, die Jumbo-Rakete »Regenbogenkrone«, die Lichterkette aus 24 Schwebekugeln, die Eisblume mit zwölf Metern und der Donnerschlag mit 20 Knallringen.',
   items:['goldenerregen','regenbogenkrone','lichterkugeln','eisblume','donnerschlag']},
  {id:'festtafel',lvl:15,cost:6500,name:'Festtafel',
   desc:'Silvesterkarpfen, Tiramisu, die Neujahrstorte und die Sushi-Platte. Alles gehört in den Kühlschrank.',
   items:['karpfen','tiramisu','neujahrstorte','sushi']},
  {id:'feinkost',lvl:21,cost:12000,name:'Feinkost',
   desc:'Frische Austern und gekochter Hummer für das große Silvesterdinner. Nur aus dem Kühlschrank.',
   items:['austern','hummer']},
  {id:'meister',lvl:25,cost:34000,name:'Meisterklasse',
   desc:'Das Ende der Leiter: das Lichtgitter mit 180 Schuss, die Jumbo-Rakete »Supernova«, das Silvesternacht-Sortiment, die 300-mm-Kaiserkrone, das Finale Grande, der Wolkenkratzer mit vier Etagen und die Feuerkaskade aus drei Riesenfontänen.',
   items:['himmelsfaecher','supernova','silvesternacht','kaiserkrone','kugelfinale','wolkenkratzer','feuerkaskade']}
];
/* Warengruppen fuer Herausforderungen und Restposten */
const NEU_GRUPPE={
  boeller:['blitzknaller','knallteppich','konfettiknaller','goldstaubboeller','farbrauchboeller'],
  raketen:['glueckrakete','glitzerraketen','silberpfeil','kometenraketen','farbenrausch','knisterstern','smaragd','blinkstern','silberregen','kristall','regenbogenkrone','silbermond','feuerdrache','supernova'],
  batterien:['zauberwald','jugendbox','kinderbatterie','miniverbund','glitzerregen12','sternstaub20','schneeballschlacht','heulbatterie','pfauenrad','nachtfalter','goldpalmen','mondschein','knisterfaecher','sternenmeer42','sternenmeer80','silberwirbel','regenbogenfaecher','hagelsturm','kreuzfeuer','goldenerregen','donnerschlag','feuerpfau','hochzeitsfaecher','nordlicht','blitzgewitter60','pfeifkonzert','sternenkaiser','kometenwand','himmelsfaecher','kinderparty','familienmix','silvesternacht','kugelfinale'],
  kugeln:['palmenkugel75','farbenmeer75','kristallkugel100','goldweide100','sternenstaub150','sternkugel150','goldkrone200','kaiserkrone'],
  boden:['partypopper','tortenfontaene','luftschlangentisch','stroboblinker','knallbonbonxxl','bengalflamme','knallbonbon','tischbombe','pharao','wunderfarbe','bengalholz','wunderherz','wunderzahl','leuchtfontaene','feuerteufel','leuchtstaebe','wunderkerzeXXL','tischfeuerwerk2','wunderbox','bodenkreisel','farbfontaenen','bodenfeuer','goldperlen','bengalfackel','zauberbrunnen','feuerberg','vulkanfeld','funkenturm','bengalduo','feuerperlen','feuerrad','dreiklang','wasserspiel','glitzerkaskade','sternfontaene','lichterkugeln','eisblume','goldvulkan','feuerwand','silberkaskade','goldregen22','feuerkaskade'],
  zubehoer:['streichhoelzer','gehoerschutz','schutzbrille','feuerloescher','luftschlangenspray','berliner','kalender','sektglaeser','kerzen','servietten','haarreifen','fotobox','streukonfetti','lichterkette','popcorn','salzstangen','erdnuesse','gummibaerchen','marzipanschwein','schokotaler','heringssalat','kartoffelsalat','wuerstchen','frikadellen','baguette','mettigel','partypizza','dips','rollmops','glueckssymbole','glueckskekse','gluecksklee','raclettekaese','raclettezubehoer','fonduesossen','kaeseplatte','lachs','cracker','kaesefondue','fondueoel','karaoke','discokugel','cocktailset','kaviar','champagnerturm','luxusfondue'],
  sekt:['rosesekt','bier','cola','kinderpunsch','energy','orangensaft','wasser','eiswuerfel','champagner','rotwein','weisswein','eierlikoer','likoer','kindersekt2','magnum','goldsekt','jahrgang']
};
/* Sparten fuer die Anzeige (Tom, 26.09.: "Essen und Getraenke als eigene
   Kategorie"). Intern bleibt alles cat:0 - sonst kaeme Essen aufs
   Testfeld und an den Zuendtisch. Die Sparte steuert nur, was der
   Spieler sieht: Etikett, Regalschild, Kartondruck, Filter im Laptop -
   und die Warengruppe (Essen und Getraenke zaehlen nicht mehr als
   Zubehoer). */
const SPARTE={
  essen:['chips','fondueessen','racletteessen','berliner','popcorn','salzstangen','erdnuesse','gummibaerchen','marzipanschwein','schokotaler',
    'heringssalat','kartoffelsalat','wuerstchen','frikadellen','mettigel','partypizza','dips','baguette','rollmops','glueckskekse',
    'raclettekaese','kaeseplatte','lachs','kaesefondue','luxusfondue','fonduesossen','cracker','kaviar','fondueoel',
    'neujahrsbrezel','gefuellteeier','nudelsalat','gulaschsuppe','fingerfood','schokofondue','karpfen','tiramisu','neujahrstorte','sushi','austern','hummer'],
  getraenke:['sekt','kindersekt','secco','partyfass','gluehwein','rosesekt','bier','cola','kinderpunsch','energy','orangensaft','wasser','eiswuerfel',
    'champagner','rotwein','weisswein','eierlikoer','likoer','magnum','kindersekt2','goldsekt','jahrgang','bowle','cocktailset',
    'prosecco','radler','bierfrei','limonade','kurze','hugo','gintonic','whisky']
};
const SPARTE_NAME={f1:'F1',f2:'F2',zubehoer:'Zubehör',essen:'Essen',getraenke:'Getränke'};
function sparteVon(t){ const p=P[t]; if(!p) return 'zubehoer'; return p.cat===1?'f1':p.cat===2?'f2':(p.sparte||'zubehoer'); }
/* Wie stark der Marktpreis schwankt: Grundnahrung ruhig, grosses
   Feuerwerk launisch */
function neuVola(q){
  if(q.cat===0) return q.kuehlpflicht?0.8:q.cold?0.6:0.3;
  if(q.cat===1) return 0.4;
  return Math.round((0.6+q.lvl*0.035)*100)/100;
}
/* Spektakel-Batterien (Katalog gross, 26.09., Tom: Anomalie): in die Pakete
   und die Warengruppe ihres Levels */
NEU_LIZ_DAZU.import.push('hagelsturm'); NEU_LIZ_DAZU.grossfeuer.push('hexenkessel'); NEU_LIZ_DAZU.profi.push('geysirfeld');
NEU_GRUPPE.batterien.push('hexenkessel','geysirfeld','wolkenkratzer');
/* Einhaengen */
(function(){
  for(const t in NEUWARE){
    if(P[t]) continue;
    const q=NEUWARE[t];
    if(q.dims&&q.shape!=='shell'&&q.shape!=='battery'&&q.shape!=='fan') q.dims=q.dims.map(x=>Math.round(x*GROESSER*1000)/1000);
    P[t]=q; ORDER.push(t);
    if(VOLA[t]===undefined) VOLA[t]=neuVola(q);
  }
  for(const id in NEU_LIZ_DAZU){ const l=LIZENZEN.find(x=>x.id===id); if(!l) continue;
    NEU_LIZ_DAZU[id].forEach(t=>{ if(l.items.indexOf(t)<0) l.items.push(t); LIZ_VON[t]=id; }); }
  NEU_LIZENZEN.forEach(l=>{ if(LIZENZEN.some(x=>x.id===l.id)) return; LIZENZEN.push(l); l.items.forEach(t=>{ LIZ_VON[t]=l.id; }); });
  /* nach Level sortiert, damit Laptop und Freischaltungen die Reihe kennen */
  LIZENZEN.sort((a,b)=>a.lvl-b.lvl);
  for(const g in NEU_GRUPPE){ GRUPPE[g]=GRUPPE[g]||[]; NEU_GRUPPE[g].forEach(t=>{ if(GRUPPE[g].indexOf(t)<0) GRUPPE[g].push(t); }); }
  /* Sparten setzen; Essen bekommt eine eigene Warengruppe, Getraenke
     sind die bisherige Gruppe 'sekt' - beides raus aus 'zubehoer' */
  const umhaengen=(t,ziel)=>{ for(const g in GRUPPE){ const i=GRUPPE[g].indexOf(t); if(i>=0&&g!==ziel) GRUPPE[g].splice(i,1); }
    GRUPPE[ziel]=GRUPPE[ziel]||[]; if(GRUPPE[ziel].indexOf(t)<0) GRUPPE[ziel].push(t); };
  SPARTE.essen.forEach(t=>{ if(P[t]&&P[t].cat===0){ P[t].sparte='essen'; umhaengen(t,'essen'); } });
  SPARTE.getraenke.forEach(t=>{ if(P[t]&&P[t].cat===0){ P[t].sparte='getraenke'; umhaengen(t,'sekt'); } });
})();

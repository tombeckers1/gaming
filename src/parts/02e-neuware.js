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
  glueckrakete:{name:'Glühwürmchen · 5 Leuchtraketen',short:'Leuchtraketen',cat:2,lvl:6,shape:'rocketset',dims:[0.38,0.05,0.1],grid:[4,2,2],box:8,cost:2.20,market:5.49,weight:7,hype:8,risk:3,
    art:{title:'LEUCHTFLUG',sub:'5 Leuchtraketen',bg1:'#1f5d2a',bg2:'#06200c',ac:'#c8ff5c',ac2:'#ffd23f'}},
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
  silberpfeil:{name:'Silberpfeil · 10 Raketen',short:'Silberpfeil',cat:2,lvl:10,shape:'rocketset',dims:[0.44,0.06,0.13],grid:[4,2,2],box:8,cost:4.20,market:9.99,weight:7,hype:14,risk:4,
    art:{title:'SILBERPFEIL',sub:'10 Raketen',bg1:'#26292f',bg2:'#000000',ac:'#d1e5ff',ac2:'#5ce1ff'}},
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
  kometenraketen:{name:'Kometenschweif · 5 Raketen',short:'Kometenraketen',cat:2,lvl:11,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:5.60,market:13.49,weight:7,hype:18,risk:5,
    art:{title:'KOMETENSCHWEIF',sub:'5 Raketen',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#5ce1ff'}},
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
  farbenrausch:{name:'Farbenrausch · 7 Raketen',short:'Farbenrausch',cat:2,lvl:12,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:6.40,market:14.99,weight:7,hype:20,risk:5,
    art:{title:'FARBENRAUSCH',sub:'7 Raketen',bg1:'#6a24c9',bg2:'#25093f',ac:'#5cff9e',ac2:'#ff4fa3'}},
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
  knisterstern:{name:'Knisterstern · 10 Knisterraketen',short:'Knisterraketen',cat:2,lvl:13,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:6.80,market:15.99,weight:6,hype:22,risk:6,
    art:{title:'KNISTERSTERN',sub:'10 Knisterraketen',bg1:'#12406b',bg2:'#04121f',ac:'#5ce1ff',ac2:'#ffd23f'}},
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
  smaragd:{name:'Smaragd · 7 Raketen Grünstern',short:'Smaragd',cat:2,lvl:15,shape:'rocketset',dims:[0.48,0.065,0.145],grid:[3,2,2],box:6,cost:8.20,market:18.99,weight:6,hype:24,risk:6,
    art:{title:'SMARAGD',sub:'7 Raketen · Grünstern',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  dreiklang:{name:'Dreiklang · 3 Fontänen nacheinander',short:'Dreiklang',cat:2,lvl:15,shape:'fountainset',dims:[0.26,0.17,0.1],grid:[6,2,1],box:5,cost:7.40,market:17.49,weight:6,hype:24,risk:6,
    art:{title:'DREIKLANG',sub:'3 Fontänen in Folge',bg1:'#123a6b',bg2:'#04101f',ac:'#ffd23f',ac2:'#ff4fa3'}},
  sternenmeer42:{name:'Sternenmeer · 42 Schuss',short:'Batterie 42',cat:2,lvl:15,shape:'battery',dims:[0.36,0.28,0.34],grid:[6,1,1],box:5,cost:15.00,market:34.99,weight:5,hype:34,risk:7,
    art:{title:'STERNENMEER',sub:'42 Schuss Verbund',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#f2f5ff',ac2:'#ffd23f'}},

  /* ---------- Level 16: Nachthimmel ---------- */
  sternenmeer80:{name:'Silbermeer · 80 Schuss',short:'Batterie 80',cat:2,lvl:16,shape:'battery',dims:[0.52,0.38,0.42],grid:[4,1,1],box:3,cost:26.00,market:59.99,weight:5,hype:48,risk:8,
    art:{title:'SILBERMEER',sub:'80 Schuss Verbund',bg1:'#26292f',bg2:'#000000',ac:'#d1e5ff',ac2:'#ffd23f'}},
  salutbatterie:{name:'Salutschüsse · 10 Schlag Böllerbatterie',short:'Salut 10',cat:2,lvl:16,shape:'battery',dims:[0.26,0.24,0.26],grid:[7,2,1],box:6,cost:9.40,market:21.99,weight:6,hype:30,risk:7,
    art:{title:'SALUT',sub:'10 Schlag · Böllerbatterie',bg1:'#1c1c24',bg2:'#000000',ac:'#ff3b2e',ac2:'#f2f5ff'}},
  silberwirbel:{name:'Silberwirbel · 30 Schuss Fächer',short:'Fächer 30',cat:2,lvl:16,shape:'fan',dims:[0.56,0.26,0.32],grid:[4,1,1],box:3,cost:17.00,market:39.99,weight:5,hype:40,risk:8,
    art:{title:'SILBERWIRBEL',sub:'30 Schuss Fächer',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  farbenmeer75:{name:'Farbenmeer · Kugelbombe 75 mm Farbwechsel',short:'Kugel 75 Farbe',cat:2,lvl:16,shape:'shell',dims:[0.09,0.115,0.09],grid:[8,2,1],box:8,cost:6.20,market:14.99,weight:6,hype:28,risk:7,
    art:{title:'FARBENMEER',sub:'75 mm · Farbwechsel',bg1:'#5a1470',bg2:'#1a0322',ac:'#5ce1ff',ac2:'#ff4fa3'}},
  blinkstern:{name:'Blinkstern · 5 Strobe-Raketen',short:'Blinkstern',cat:2,lvl:16,shape:'rocketset',dims:[0.48,0.065,0.145],grid:[3,2,2],box:6,cost:9.00,market:20.99,weight:6,hype:28,risk:6,
    art:{title:'BLINKSTERN',sub:'5 Strobe-Raketen',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  wasserspiel:{name:'Wasserspiel · Fontänenkette 4er',short:'Wasserspiel',cat:2,lvl:16,shape:'fountainset',dims:[0.3,0.17,0.1],grid:[6,2,1],box:5,cost:8.80,market:20.49,weight:6,hype:28,risk:6,
    art:{title:'WASSERSPIEL',sub:'4 Fontänen in Kette',bg1:'#0f5a6b',bg2:'#032028',ac:'#5ce1ff',ac2:'#f2f5ff'}},
  weisswein:{name:'Weißwein Riesling',short:'Weißwein',cat:0,lvl:16,cold:true,shape:'bottle',dims:[0.078,0.31,0.078],grid:[12,2,1],box:6,cost:3.40,market:8.49,weight:6,hype:0,risk:4,
    art:{title:'RIESLING',sub:'Weißwein · halbtrocken',bg1:'#e8e2a8',bg2:'#8a8448',ac:'#1b3a2e',ac2:'#c8a23a',light:true}},
  eierlikoer:{name:'Eierlikör 0,7 l',short:'Eierlikör',cat:0,lvl:16,shape:'bottle',dims:[0.08,0.28,0.08],grid:[12,2,1],box:6,cost:3.20,market:7.99,weight:5,hype:0,risk:4,
    art:{title:'EIERLIKÖR',sub:'0,7 Liter',bg1:'#f2d21b',bg2:'#8a7208',ac:'#1b1b1b',ac2:'#ffffff',light:true}},

  /* ---------- Level 17 ---------- */
  regenbogenfaecher:{name:'Regenbogen · 49 Schuss Fächer',short:'Fächer 49',cat:2,lvl:17,shape:'fan',dims:[0.64,0.3,0.36],grid:[4,1,1],box:2,cost:25.00,market:57.99,weight:5,hype:50,risk:8,
    art:{title:'REGENBOGEN',sub:'49 Schuss Fächer',bg1:'#6a24c9',bg2:'#25093f',ac:'#ffd23f',ac2:'#5cff9e'}},
  goldweide100:{name:'Goldweide · Kugelbombe 100 mm',short:'Kugel 100 Weide',cat:2,lvl:17,shape:'shell',dims:[0.12,0.15,0.12],grid:[6,2,1],box:6,cost:12.00,market:28.99,weight:5,hype:40,risk:8,
    art:{title:'GOLDWEIDE',sub:'Kugelbombe 100 mm',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  silberregen:{name:'Silberregen · 5 Raketen Silberweide',short:'Silberregen',cat:2,lvl:17,shape:'rocketset',dims:[0.5,0.07,0.15],grid:[3,2,2],box:6,cost:10.00,market:23.49,weight:5,hype:32,risk:7,
    art:{title:'SILBERREGEN',sub:'5 Raketen · Silberweide',bg1:'#26292f',bg2:'#000000',ac:'#f2f5ff',ac2:'#d1e5ff'}},
  glitzerkaskade:{name:'Glitzerkaskade · 8-m-Glitzerfontäne',short:'Glitzerkaskade',cat:2,lvl:17,shape:'cylinder',dims:[0.18,0.36,0.18],grid:[7,1,1],box:4,cost:12.00,market:27.99,weight:5,hype:34,risk:7,
    art:{title:'GLITZERKASKADE',sub:'8 m · Glitzer · 20 s',bg1:'#12204a',bg2:'#04081a',ac:'#f2f5ff',ac2:'#ffd23f'}},
  kaesefondue:{name:'Käsefondue-Set für 4',short:'Käsefondue',cat:0,lvl:17,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.1,0.18],grid:[4,2,2],box:6,cost:6.80,market:16.99,weight:4,hype:0,risk:5,
    art:{title:'KÄSEFONDUE',sub:'für 4 · mit Brot',bg1:'#e8b418',bg2:'#8a5a08',ac:'#7a1010',ac2:'#ffffff',light:true}},
  likoer:{name:'Sahnelikör 0,7 l',short:'Sahnelikör',cat:0,lvl:17,cold:true,shape:'bottle',dims:[0.08,0.28,0.08],grid:[12,2,1],box:6,cost:4.60,market:11.49,weight:4,hype:0,risk:4,
    art:{title:'SAHNELIKÖR',sub:'0,7 Liter',bg1:'#4a2a14',bg2:'#140a04',ac:'#f2e6c4',ac2:'#e8c35a'}},

  /* ---------- Level 18: Goldklasse ---------- */
  kreuzfeuer:{name:'Kreuzfeuer · 42 Schuss Crossette',short:'Crossette 42',cat:2,lvl:18,shape:'battery',dims:[0.42,0.34,0.38],grid:[5,1,1],box:4,cost:21.00,market:48.99,weight:5,hype:44,risk:8,
    art:{title:'KREUZFEUER',sub:'42 Schuss Crossette',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#f2f5ff'}},
  kometenfaecher:{name:'Schweifstern · 50 Schuss Kometenfächer',short:'Kometenfächer',cat:2,lvl:18,shape:'fan',dims:[0.66,0.3,0.36],grid:[4,1,1],box:2,cost:28.00,market:64.99,weight:5,hype:54,risk:8,
    art:{title:'SCHWEIFSTERN',sub:'50 Schuss Kometenfächer',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#ff7a3d',gold:true}},
  kristall:{name:'Kristall · 5 Raketen Blinkweide',short:'Kristall',cat:2,lvl:18,shape:'rocketset',dims:[0.52,0.075,0.16],grid:[3,2,2],box:6,cost:11.40,market:26.49,weight:5,hype:36,risk:7,
    art:{title:'KRISTALL',sub:'5 Raketen · Blinkweide',bg1:'#0f2a4a',bg2:'#02060f',ac:'#d1e5ff',ac2:'#f2f5ff'}},
  sternenstaub150:{name:'Sternenstaub · Kugelbombe 150 mm Blinker',short:'Kugel 150 Blink',cat:2,lvl:18,shape:'shell',dims:[0.165,0.2,0.165],grid:[4,1,1],box:3,cost:30.00,market:71.99,weight:4,hype:66,risk:10,
    art:{title:'STERNENSTAUB',sub:'150 mm · Blinksterne',bg1:'#12204a',bg2:'#04081a',ac:'#f2f5ff',ac2:'#ffd23f'}},
  magnum:{name:'Champagner Magnum 1,5 l',short:'Magnum',cat:0,lvl:18,cold:true,shape:'bottle',dims:[0.11,0.4,0.11],grid:[8,1,1],box:3,cost:28.00,market:69.99,weight:3,hype:0,risk:7,
    art:{title:'MAGNUM',sub:'Champagner 1,5 l',bg1:'#0e1226',bg2:'#000000',ac:'#e8c35a',ac2:'#f2f5ff',gold:true}},

  /* ---------- Level 19: Sternklasse ---------- */
  goldenerregen:{name:'Goldener Regen · 70 Schuss',short:'Batterie 70',cat:2,lvl:19,shape:'battery',dims:[0.5,0.4,0.44],grid:[4,1,1],box:3,cost:34.00,market:78.99,weight:4,hype:62,risk:9,
    art:{title:'GOLDENER REGEN',sub:'70 Schuss Brokat',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  regenbogenkrone:{name:'Jumbo-Rakete »Regenbogenkrone«',short:'Jumbo Regenbogen',cat:2,lvl:19,shape:'rocketset',stueck:1,dims:[0.8,0.1,0.15],grid:[2,1,1],box:4,cost:12.50,market:29.99,weight:4,hype:40,risk:9,
    art:{title:'JUMBO',sub:'Regenbogenkrone · Einzelrakete',bg1:'#6a24c9',bg2:'#25093f',ac:'#ffd23f',ac2:'#5cff9e'}},
  lichterkugeln:{name:'Lichterkette · 24 Kugeln Römisches Licht',short:'Lichterkugeln',cat:2,lvl:19,shape:'candle',dims:[0.13,0.42,0.13],grid:[7,2,1],box:4,cost:10.50,market:24.49,weight:5,hype:34,risk:7,
    art:{title:'LICHTERKETTE',sub:'24 Kugeln · Farbwechsel',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#ff4fa3'}},
  eisblume:{name:'Eisblume · 12-m-Silberfontäne',short:'Eisblume',cat:2,lvl:19,shape:'cylinder',dims:[0.22,0.38,0.22],grid:[6,1,1],box:3,cost:18.00,market:42.99,weight:4,hype:50,risk:8,
    art:{title:'EISBLUME',sub:'12 m Silberfontäne · 22 s',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  donnerschlag:{name:'Donnerschlag · 20 Schlag Salutbatterie',short:'Salut 20',cat:2,lvl:19,shape:'battery',dims:[0.34,0.3,0.34],grid:[6,1,1],box:4,cost:17.00,market:38.99,weight:5,hype:46,risk:9,
    art:{title:'DONNERSCHLAG',sub:'20 Schlag Salut',bg1:'#1c1c24',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff3b2e'}},

  /* ---------- Level 20-21 ---------- */
  feuerpfau:{name:'Feuerpfau · 100 Schuss Fächerverbund',short:'Fächer 100',cat:2,lvl:20,shape:'fan',dims:[0.76,0.34,0.42],grid:[3,1,1],box:2,cost:44.00,market:99.99,weight:4,hype:72,risk:9,
    art:{title:'FEUERPFAU',sub:'100 Schuss Fächer',bg1:'#0f5a6b',bg2:'#032028',ac:'#ffd23f',ac2:'#ff4fa3',gold:true}},
  goldvulkan:{name:'Goldvulkan XXL · 30 Sekunden',short:'Goldvulkan',cat:2,lvl:20,shape:'cylinder',dims:[0.24,0.36,0.24],grid:[6,1,1],box:3,cost:16.00,market:37.99,weight:4,hype:46,risk:8,
    art:{title:'GOLDVULKAN',sub:'XXL · 30 s',bg1:'#6b4a0c',bg2:'#1f1402',ac:'#ffd23f',ac2:'#ff7a1c',gold:true}},
  nordlicht:{name:'Nordlicht · 150 Schuss Verbund',short:'Verbund 150',cat:2,lvl:21,shape:'battery',dims:[0.76,0.6,0.5],grid:[3,1,1],box:2,cost:58.00,market:129.99,weight:3,hype:80,risk:10,
    art:{title:'NORDLICHT',sub:'150 Schuss Verbund',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#c8a2ff'}},
  blitzgewitter60:{name:'Blitzlicht · 60 Schuss Strobe',short:'Strobe 60',cat:2,lvl:21,shape:'battery',dims:[0.48,0.38,0.42],grid:[4,1,1],box:3,cost:30.00,market:69.99,weight:4,hype:58,risk:9,
    art:{title:'BLITZLICHT',sub:'60 Schuss Strobe',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  feuerwand:{name:'Feuerwand · 5 Fontänen in Reihe',short:'Feuerwand',cat:2,lvl:21,shape:'fountainset',dims:[0.4,0.2,0.12],grid:[5,1,1],box:3,cost:19.00,market:44.99,weight:4,hype:52,risk:8,
    art:{title:'FEUERWAND',sub:'5 Fontänen in Reihe',bg1:'#8a1a08',bg2:'#240502',ac:'#ff8a2a',ac2:'#ffd23f',gold:true}},
  sternkugel150:{name:'Sternkranz · Kugelbombe 150 mm Crossette',short:'Kugel 150 Kreuz',cat:2,lvl:21,shape:'shell',dims:[0.165,0.2,0.165],grid:[4,1,1],box:3,cost:31.00,market:73.99,weight:4,hype:70,risk:10,
    art:{title:'STERNKRANZ',sub:'150 mm · Crossette',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#f2f5ff'}},

  /* ---------- Level 22-26: die ganz grossen ---------- */
  silbermond:{name:'Jumbo-Rakete »Silbermond«',short:'Jumbo Silbermond',cat:2,lvl:22,shape:'rocketset',stueck:1,dims:[0.84,0.11,0.16],grid:[2,1,1],box:3,cost:19.00,market:44.99,weight:3,hype:54,risk:10,
    art:{title:'JUMBO',sub:'Silbermond · Einzelrakete',bg1:'#26292f',bg2:'#000000',ac:'#f2f5ff',ac2:'#d1e5ff'}},
  pfeifkonzert:{name:'Pfeifkonzert · 80 Schuss Pfeiffächer',short:'Pfeiffächer 80',cat:2,lvl:22,shape:'fan',dims:[0.72,0.32,0.4],grid:[3,1,1],box:2,cost:36.00,market:82.99,weight:4,hype:62,risk:9,
    art:{title:'PFEIFKONZERT',sub:'80 Schuss · Pfeifer',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  sternenkaiser:{name:'Sternenkaiser · 250 Schuss',short:'Verbund 250',cat:2,lvl:23,shape:'battery',dims:[0.96,0.84,0.58],grid:[2,1,1],box:1,cost:92.00,market:199.99,weight:2,hype:96,risk:10,
    art:{title:'STERNENKAISER',sub:'250 Schuss · 2½ Minuten',bg1:'#12204a',bg2:'#000000',ac:'#ffd23f',ac2:'#d1e5ff',gold:true}},
  kometenwand:{name:'Kometenwand · 90 Schuss Fächer',short:'Kometenwand',cat:2,lvl:23,shape:'fan',dims:[0.76,0.34,0.42],grid:[3,1,1],box:2,cost:42.00,market:94.99,weight:3,hype:70,risk:9,
    art:{title:'KOMETENWAND',sub:'90 Schuss Kometen',bg1:'#6b2410',bg2:'#1f0a04',ac:'#ffd23f',ac2:'#ff7a1c',gold:true}},
  goldkrone200:{name:'Goldkrone · Kugelbombe 200 mm Kamuro',short:'Kugel 200 Kamuro',cat:2,lvl:24,shape:'shell',dims:[0.21,0.25,0.21],grid:[3,1,1],box:2,cost:46.00,market:109.99,weight:3,hype:92,risk:10,
    art:{title:'GOLDKRONE',sub:'200 mm · Kamuro',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  silberkaskade:{name:'Silberkaskade · 20-m-Fontäne',short:'Silberkaskade',cat:2,lvl:24,shape:'cylinder',dims:[0.28,0.44,0.28],grid:[4,1,1],box:2,cost:28.00,market:66.99,weight:3,hype:66,risk:10,
    art:{title:'SILBERKASKADE',sub:'20 m · Silber · 22 s',bg1:'#8a9299',bg2:'#1a1e24',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  feuerdrache:{name:'Jumbo-Rakete »Feuerdrache«',short:'Jumbo Drache',cat:2,lvl:24,shape:'rocketset',stueck:1,dims:[0.86,0.12,0.17],grid:[2,1,1],box:2,cost:24.00,market:56.99,weight:3,hype:62,risk:10,
    art:{title:'JUMBO',sub:'Feuerdrache · Einzelrakete',bg1:'#7a1010',bg2:'#1a0202',ac:'#ff7a1c',ac2:'#ffd23f'}},
  himmelsfaecher:{name:'Himmelsfächer · 180 Schuss Fächer',short:'Fächer 180',cat:2,lvl:25,shape:'fan',dims:[0.9,0.4,0.5],grid:[2,1,1],box:1,cost:78.00,market:169.99,weight:2,hype:94,risk:10,
    art:{title:'HIMMELSFÄCHER',sub:'180 Schuss Fächer',bg1:'#2a0f5a',bg2:'#000000',ac:'#ffd23f',ac2:'#ff4fd8',gold:true}},
  supernova:{name:'Jumbo-Rakete »Supernova«',short:'Jumbo Supernova',cat:2,lvl:25,shape:'rocketset',stueck:1,dims:[0.9,0.13,0.18],grid:[2,1,1],box:2,cost:28.00,market:64.99,weight:3,hype:70,risk:10,
    art:{title:'JUMBO',sub:'Supernova · Einzelrakete',bg1:'#12204a',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff4fd8'}},
  silvesternacht:{name:'Silvesternacht · 40 Teile Sortiment',short:'Sortiment 40',cat:2,lvl:25,shape:'assort',dims:[0.56,0.22,0.4],grid:[3,1,1],box:1,cost:52.00,market:119.99,weight:3,hype:78,risk:9,
    art:{title:'SILVESTERNACHT',sub:'40 Teile gemischt',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#ff4fa3',gold:true}},
  kaiserkrone:{name:'Kaiserkrone · Kugelbombe 300 mm Gold',short:'Kugel 300 Gold',cat:2,lvl:26,shape:'shell',dims:[0.3,0.34,0.3],grid:[2,1,1],box:1,cost:74.00,market:174.99,weight:2,hype:100,risk:10,
    art:{title:'KAISERKRONE',sub:'300 mm · Goldvorhang',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  kugelfinale:{name:'Finale Grande · 5 Kugelbomben',short:'Kugel-Finale',cat:2,lvl:26,shape:'assort',dims:[0.5,0.3,0.36],grid:[3,1,1],box:1,cost:96.00,market:214.99,weight:2,hype:100,risk:10,
    art:{title:'FINALE GRANDE',sub:'5 Kugelbomben in Folge',bg1:'#3a0507',bg2:'#000000',ac:'#ffd23f',ac2:'#ff3b2e',gold:true}},
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
  glitzerraketen:{name:'Glitzerflug · 12 Raketen',short:'Glitzerraketen',cat:2,lvl:8,shape:'rocketset',dims:[0.42,0.06,0.12],grid:[4,2,2],box:8,cost:3.40,market:7.99,weight:7,hype:11,risk:4,
    art:{title:'GLITZERFLUG',sub:'12 Raketen',bg1:'#12406b',bg2:'#04121f',ac:'#ffd23f',ac2:'#f2f5ff'}},
  heulbatterie:{name:'Heulboje · 12 Pfeifschuss Batterie',short:'Pfeif 12',cat:2,lvl:11,shape:'battery',dims:[0.24,0.2,0.24],grid:[8,2,1],box:8,cost:5.60,market:13.29,weight:6,hype:18,risk:5,
    art:{title:'HEULBOJE',sub:'12 Pfeifschuss',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  familienmix:{name:'Familienmix · 24 Teile Sortiment',short:'Sortiment 24',cat:2,lvl:17,shape:'assort',dims:[0.46,0.18,0.34],grid:[4,1,1],box:2,cost:26.00,market:59.99,weight:5,hype:46,risk:7,
    art:{title:'FAMILIENMIX',sub:'24 Teile gemischt',bg1:'#2f5d9e',bg2:'#0a1a33',ac:'#ffd23f',ac2:'#5cff9e'}},
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
  hochzeitsfaecher:{name:'Herzfächer · 36 Schuss Rosé',short:'Herzfächer',cat:2,lvl:20,shape:'fan',dims:[0.62,0.28,0.34],grid:[4,1,1],box:2,cost:26.00,market:59.99,weight:4,hype:50,risk:8,
    art:{title:'HERZFÄCHER',sub:'36 Schuss · Rosé & Gold',bg1:'#c01c6a',bg2:'#4a0626',ac:'#ffd23f',ac2:'#fff3c4'}},
  raketen50:{name:'Raketenregen · 50 Raketen Mix',short:'Raketen 50',cat:2,lvl:20,shape:'rocketset',dims:[0.6,0.1,0.26],grid:[2,2,1],box:3,cost:18.00,market:41.99,weight:4,hype:42,risk:8,
    art:{title:'RAKETENREGEN',sub:'50 Raketen gemischt',bg1:'#35157a',bg2:'#0c0626',ac:'#ffd23f',ac2:'#5cff9e'}},
  goldregen22:{name:'Goldregen · 22 Kugeln Römisches Licht',short:'Goldregen 22',cat:2,lvl:22,shape:'candle',dims:[0.14,0.44,0.14],grid:[6,2,1],box:4,cost:14.00,market:32.99,weight:4,hype:44,risk:8,
    art:{title:'GOLDREGEN',sub:'22 Kugeln · Brokat',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
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
  eiswuerfel:{name:'Eiswürfel 2 kg',short:'Eiswürfel',cat:0,lvl:12,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.24,0.3,0.08],grid:[6,1,2],box:8,cost:0.90,market:2.29,weight:5,hype:0,risk:3,
    art:{title:'EISWÜRFEL',sub:'2 kg',bg1:'#5ce1ff',bg2:'#1557a8',ac:'#ffffff',ac2:'#0e1226',light:true}}
};
/* Lizenzen: bestehende Pakete bekommen Ware dazu, neue Pakete fuellen
   die Luecken. Die Levelreihenfolge bleibt: jedes Produkt kommt erst mit
   seinem Paket und nicht vor seinem Level. */
const NEU_LIZ_DAZU={
  start:['wunderfarbe','wunderherz'],
  zubehoer:['streichhoelzer','gehoerschutz','schutzbrille','feuerloescher','luftschlangenspray'],
  klassiker:['blitzknaller','bodenkreisel','rosesekt','berliner','glueckrakete','leuchtstaebe'],
  partydeko:['kalender','sektglaeser','kerzen','servietten','haarreifen','fotobox','streukonfetti','lichterkette'],
  krach:['knallteppich','farbfontaenen','bodenfeuer','goldperlen','bengalfackel','glitzerregen12','miniverbund','glitzerraketen','wunderbox'],
  partynacht:['bier','cola','kinderpunsch','energy','orangensaft','wasser','karaoke','discokugel','eiswuerfel'],
  himmel:['nachtfalter','goldstaubboeller','kometenraketen','farbenrausch','feuerberg','vulkanfeld','glueckssymbole','glueckskekse','gluecksklee'],
  genuss:['raclettekaese','raclettezubehoer','fonduesossen','kaeseplatte','lachs','cracker','kaesefondue','fondueoel','luxusfondue'],
  verbund:['feuerperlen','farbrauchboeller','feuerrad','knisterfaecher','palmenkugel75','sternenmeer42','dreiklang','smaragd','kristallkugel100'],
  import:['regenbogenfaecher','goldweide100','silberregen','glitzerkaskade','familienmix'],
  grossfeuer:['feuerpfau','goldvulkan','nordlicht','blitzgewitter60','feuerwand','sternkugel150','hochzeitsfaecher','raketen50'],
  profi:['silbermond','pfeifkonzert','sternenkaiser','kometenwand','goldkrone200','silberkaskade','feuerdrache','goldregen22']
};
const NEU_LIZENZEN=[
  {id:'jugend',lvl:2,cost:60,name:'Jugendfeuerwerk',
   desc:'Feuerwerk, das auch Kinder zünden dürfen: Knallbonbons, Tischbomben, Bengalische Hölzer, Zahlen-Wunderkerzen, Pharaoschlangen, Leuchtfontänen, der Feuerteufel, eine kleine Jugendbatterie und das Kinderparty-Sortiment.',
   items:['knallbonbon','tischbombe','bengalholz','wunderzahl','pharao','leuchtfontaene','feuerteufel','kinderbatterie','kinderparty','wunderkerzeXXL','tischfeuerwerk2']},
  {id:'snacks',lvl:7,cost:260,name:'Snacks & Süßes',
   desc:'Popcorn, Salzgebäck, Erdnüsse, Fruchtgummi, Berliner-Nachschub und die Glücksbringer zum Naschen: Marzipanschweinchen und Schoko-Glückstaler.',
   items:['popcorn','salzstangen','erdnuesse','gummibaerchen','marzipanschwein','schokotaler']},
  {id:'buffet',lvl:8,cost:700,name:'Silvester-Buffet',
   desc:'Heringssalat, Kartoffelsalat, Würstchen, Mini-Frikadellen, Baguette, Mett-Igel, Partypizza, Dips und das Katerfrühstück. Vieles davon gehört in den Kühlschrank.',
   items:['heringssalat','kartoffelsalat','wuerstchen','frikadellen','baguette','mettigel','partypizza','dips','rollmops']},
  {id:'kleinfeuer',lvl:10,cost:1800,name:'Kleinfeuerwerk',
   desc:'Die ersten richtigen Batterien für den kleinen Geldbeutel: Sternenstaub mit 20 Schuss, Schneeball in Weiß, die Heulboje mit Pfeifschüssen, das Pfauenrad als erster Fächer. Dazu Silberpfeil-Raketen, Konfetti-Böller und der Zauberbrunnen.',
   items:['sternstaub20','schneeballschlacht','heulbatterie','pfauenrad','silberpfeil','konfettiknaller','zauberbrunnen']},
  {id:'feuerzauber',lvl:13,cost:4200,name:'Feuerzauber',
   desc:'Goldpalmen, Mondschein, der Funkenturm mit sechs Metern, Knisterstern-Raketen und das Bengal-Duo.',
   items:['goldpalmen','mondschein','funkenturm','knisterstern','bengalduo']},
  {id:'getraenke',lvl:14,cost:5000,name:'Feine Getränke',
   desc:'Champagner, Rot- und Weißwein, Eierlikör, Sahnelikör, das Cocktail-Set, Kindersekt Erdbeere und die Magnumflasche für den großen Moment.',
   items:['champagner','cocktailset','rotwein','weisswein','eierlikoer','likoer','kindersekt2','magnum','kaviar','champagnerturm','goldsekt','jahrgang']},
  {id:'nachthimmel',lvl:16,cost:9000,name:'Nachthimmel',
   desc:'Silbermeer mit 80 Schuss, der Silberwirbel-Fächer, die Salutbatterie mit zehn Schlägen, die 75-mm-Farbwechselkugel, Blinkstern-Raketen und das Wasserspiel.',
   items:['sternenmeer80','silberwirbel','salutbatterie','farbenmeer75','blinkstern','wasserspiel']},
  {id:'goldklasse',lvl:18,cost:15000,name:'Goldklasse',
   desc:'Kreuzfeuer mit Crossette, der Kometenfächer, Kristall-Raketen, die 150-mm-Blinkkugel und die Sternregen-Fontäne.',
   items:['kreuzfeuer','kometenfaecher','kristall','sternenstaub150','sternfontaene']},
  {id:'sternklasse',lvl:19,cost:18000,name:'Sternklasse',
   desc:'Goldener Regen mit 70 Schuss, die Jumbo-Rakete »Regenbogenkrone«, 24 Kugeln Römisches Licht, die Eisblume mit zwölf Metern und der Donnerschlag mit 20 Salutschlägen.',
   items:['goldenerregen','regenbogenkrone','lichterkugeln','eisblume','donnerschlag']},
  {id:'meister',lvl:25,cost:34000,name:'Meisterklasse',
   desc:'Das Ende der Leiter: der Himmelsfächer mit 180 Schuss, die Jumbo-Rakete »Supernova«, das Silvesternacht-Sortiment, die 300-mm-Kaiserkrone, das Kugel-Finale und die Feuerkaskade aus drei Riesenfontänen.',
   items:['himmelsfaecher','supernova','silvesternacht','kaiserkrone','kugelfinale','feuerkaskade']}
];
/* Warengruppen fuer Herausforderungen und Restposten */
const NEU_GRUPPE={
  boeller:['blitzknaller','knallteppich','konfettiknaller','goldstaubboeller','farbrauchboeller'],
  raketen:['glueckrakete','glitzerraketen','silberpfeil','kometenraketen','farbenrausch','knisterstern','smaragd','blinkstern','silberregen','kristall','regenbogenkrone','silbermond','feuerdrache','supernova','raketen50'],
  batterien:['kinderbatterie','miniverbund','glitzerregen12','sternstaub20','schneeballschlacht','heulbatterie','pfauenrad','nachtfalter','goldpalmen','mondschein','knisterfaecher','sternenmeer42','sternenmeer80','salutbatterie','silberwirbel','regenbogenfaecher','kreuzfeuer','kometenfaecher','goldenerregen','donnerschlag','feuerpfau','hochzeitsfaecher','nordlicht','blitzgewitter60','pfeifkonzert','sternenkaiser','kometenwand','himmelsfaecher','kinderparty','familienmix','silvesternacht','kugelfinale'],
  kugeln:['palmenkugel75','farbenmeer75','kristallkugel100','goldweide100','sternenstaub150','sternkugel150','goldkrone200','kaiserkrone'],
  boden:['knallbonbon','tischbombe','pharao','wunderfarbe','bengalholz','wunderherz','wunderzahl','leuchtfontaene','feuerteufel','leuchtstaebe','wunderkerzeXXL','tischfeuerwerk2','wunderbox','bodenkreisel','farbfontaenen','bodenfeuer','goldperlen','bengalfackel','zauberbrunnen','feuerberg','vulkanfeld','funkenturm','bengalduo','feuerperlen','feuerrad','dreiklang','wasserspiel','glitzerkaskade','sternfontaene','lichterkugeln','eisblume','goldvulkan','feuerwand','silberkaskade','goldregen22','feuerkaskade'],
  zubehoer:['streichhoelzer','gehoerschutz','schutzbrille','feuerloescher','luftschlangenspray','berliner','kalender','sektglaeser','kerzen','servietten','haarreifen','fotobox','streukonfetti','lichterkette','popcorn','salzstangen','erdnuesse','gummibaerchen','marzipanschwein','schokotaler','heringssalat','kartoffelsalat','wuerstchen','frikadellen','baguette','mettigel','partypizza','dips','rollmops','glueckssymbole','glueckskekse','gluecksklee','raclettekaese','raclettezubehoer','fonduesossen','kaeseplatte','lachs','cracker','kaesefondue','fondueoel','karaoke','discokugel','cocktailset','kaviar','champagnerturm','luxusfondue'],
  sekt:['rosesekt','bier','cola','kinderpunsch','energy','orangensaft','wasser','eiswuerfel','champagner','rotwein','weisswein','eierlikoer','likoer','kindersekt2','magnum','goldsekt','jahrgang']
};
/* Wie stark der Marktpreis schwankt: Grundnahrung ruhig, grosses
   Feuerwerk launisch */
function neuVola(q){
  if(q.cat===0) return q.kuehlpflicht?0.8:q.cold?0.6:0.3;
  if(q.cat===1) return 0.4;
  return Math.round((0.6+q.lvl*0.035)*100)/100;
}
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
})();

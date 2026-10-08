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
  wunderfarbe:{name:'Farbzauber · 10 Farbspitzen-Wunderkerzen',short:'Farb-Wunderk.',cat:1,lvl:1,shape:'sparkler',dims:[0.105,0.30,0.032],grid:[12,3,1],box:30,cost:0.70,market:1.79,weight:8,hype:3,risk:1,
    desc:'Goldene Funken mit farbigen Spitzen: Jede Kerze sprüht außen in ihrer eigenen Farbe – Rot, Grün, Blau und Pink nacheinander.',
    art:{title:'FARBZAUBER',sub:'10 Farbspitzen-Wunderkerzen',bg1:'#8a1f6a',bg2:'#2a0620',ac:'#5cff9e',ac2:'#ffd23f'}},
  knallbonbon:{name:'Kronen-Knallbonbons 10er',short:'Knallbonbons',cat:1,lvl:2,shape:'boxA',dims:[0.22,0.07,0.1],grid:[6,2,2],box:12,cost:1.30,market:3.29,weight:7,hype:3,risk:1,
    desc:'Ziehen, knack – und heraus fliegen Papierkrone, Witzzettel und kleines Spielzeug: Ring, Kreisel, Pfeife, Quietscheente, Jo-Jo. Vier Bonbons, jedes mit anderem Inhalt.',
    art:{title:'KNALLBONBONS',sub:'10 Stück · mit Papierkrone',bg1:'#c01c20',bg2:'#5a0608',ac:'#ffd23f',ac2:'#f2f5ff'}},
  tischbombe:{name:'Tischbombe »Überraschung«',short:'Tischbombe',cat:1,lvl:2,shape:'cylinder',dims:[0.12,0.16,0.12],grid:[8,2,1],box:12,cost:1.60,market:3.99,weight:7,hype:5,risk:1,
    desc:'Dumpfer Knall, der Deckel fliegt weg, und in alle Richtungen fliegen Papierhütchen, Luftrüssel, Tröten, Masken, Pappnasen, Spielzeug, Luftschlangen und Konfetti.',
    art:{title:'TISCHBOMBE',sub:'Konfetti & Überraschungen',bg1:'#1557a8',bg2:'#061a3a',ac:'#ffd23f',ac2:'#ff4fa3'}},
  bengalholz:{name:'Bengalhölzer · 12 Zündhölzer rot & grün',short:'Bengalhölzer',cat:1,lvl:2,shape:'sparkler',dims:[0.09,0.22,0.03],grid:[12,3,1],box:30,cost:0.65,market:1.59,weight:7,hype:3,risk:1,
    desc:'Ratsch – weiße Stichflamme, dann brennt jedes Holz als kleine rote oder grüne Laterne und verglimmt mit einem Rauchfaden.',
    art:{title:'BENGALO',sub:'12 Hölzer · rot & grün',bg1:'#0d4a2a',bg2:'#021208',ac:'#ff4a4a',ac2:'#5cff9e'}},
  wunderherz:{name:'Herzfunken · 6 Herz-Wunderkerzen',short:'Herz-Wunderk.',cat:1,lvl:2,shape:'sparkler',dims:[0.14,0.28,0.03],grid:[12,3,1],box:24,cost:0.90,market:2.29,weight:6,hype:3,risk:1,
    desc:'Das Herz brennt von der Spitze aus auf beiden Seiten gleichzeitig hoch – oben treffen sich die Funken, und kurz leuchtet das ganze Herz.',
    art:{title:'HERZFUNKEN',sub:'6 Herz-Wunderkerzen',bg1:'#c01c6a',bg2:'#4a0626',ac:'#ffd23f',ac2:'#fff3c4'}},
  wunderzahl:{name:'Jahreszahl 2027 · 4 Zahlen-Wunderkerzen',short:'2027-Wunderk.',cat:1,lvl:3,shape:'sparkler',dims:[0.36,0.3,0.03],grid:[12,3,1],box:20,cost:1.20,market:2.99,weight:6,hype:4,risk:1,
    desc:'Vier Zahlen-Wunderkerzen schreiben 2027 in Funken – Strich für Strich, und danach steht die Jahreszahl noch als Glut in der Luft.',
    art:{title:'2027',sub:'Zahlen-Wunderkerzen',bg1:'#0e1226',bg2:'#000000',ac:'#ffd23f',ac2:'#f2f5ff',gold:true}},
  pharao:{name:'Pharaoschlangen 12er',short:'Pharaoschlangen',cat:1,lvl:2,shape:'boxA',dims:[0.12,0.05,0.08],grid:[8,2,2],box:24,cost:0.50,market:1.29,weight:5,hype:2,risk:1,
    desc:'Vier schwarze Schlangen wachsen aus kleinen Tabletten und winden sich glimmend über den Boden. Eine davon hebt am Ende den Kopf.',
    art:{title:'PHARAO',sub:'12 Schlangen aus Asche',bg1:'#4a3a14',bg2:'#140e02',ac:'#ffd23f',ac2:'#c8e04a'}},
  leuchtfontaene:{name:'Perlenquartett · 4 Perlenfontänen',short:'Perlenquartett',cat:1,lvl:4,shape:'fountainset',dims:[0.44,0.12,0.07],grid:[7,2,1],box:12,cost:1.50,market:3.79,weight:6,hype:6,risk:2,
    desc:'Vier kleine Silberfontänen nacheinander, in denen rote und grüne Perlen aufsteigen. Zum Schluss sprühen alle vier und werfen einen Perlenschauer.',
    art:{title:'PERLENQUARTETT',sub:'4 Perlenfontänen · Rot und Grün',bg1:'#1f5d2a',bg2:'#06200c',ac:'#c8ff5c',ac2:'#ffd23f'}},
  feuerteufel:{name:'Feuerteufel · Zweihorn-Fontäne',short:'Feuerteufel',cat:1,lvl:4,shape:'cylinder',dims:[0.08,0.2,0.08],grid:[12,2,1],box:16,cost:0.90,market:2.29,weight:6,hype:5,risk:2,
    desc:'Aus der Glut wachsen zwei feurige Hörner, die fauchen und sich spreizen. Zum Schluss lacht der Teufel dreimal knisternd.',
    art:{title:'FEUERTEUFEL',sub:'Zweihorn-Fontäne · 9 s',bg1:'#8a1a08',bg2:'#240502',ac:'#ffd23f',ac2:'#ff7a1c'}},

  /* ---------- Zubehoer: Sicherheit und Anzuenden ---------- */
  streichhoelzer:{name:'Sturm-Streichhölzer 10 Schachteln',short:'Streichhölzer',cat:0,kasse:'nur',lvl:3,shape:'boxA',dims:[0.16,0.06,0.11],grid:[8,2,2],box:20,cost:0.90,market:2.29,weight:7,hype:0,risk:2,
    art:{title:'STURMHOLZ',sub:'windfest · 10 Schachteln',bg1:'#c8322a',bg2:'#4a0a06',ac:'#fff3c4',ac2:'#ffd23f'}},
  gehoerschutz:{name:'Gehörschutz-Stöpsel 10 Paar',short:'Gehörschutz',cat:0,kasse:'nur',lvl:3,shape:'boxA',dims:[0.12,0.2,0.05],grid:[10,2,1],box:20,cost:1.00,market:2.49,weight:6,hype:0,risk:1,
    art:{title:'LEISE',sub:'Gehörschutz 10 Paar',bg1:'#f28a1c',bg2:'#8a3d06',ac:'#0e1226',ac2:'#ffffff',light:true}},
  schutzbrille:{name:'Schutzbrille klar',short:'Schutzbrille',cat:0,lvl:4,shape:'boxA',dims:[0.18,0.08,0.1],grid:[8,2,2],box:12,cost:1.60,market:3.99,weight:5,hype:0,risk:1,
    art:{title:'KLARSICHT',sub:'Schutzbrille',bg1:'#2a6a9a',bg2:'#0a2236',ac:'#f2f5ff',ac2:'#ffd23f'}},
  feuerloescher:{name:'Feuerlöschspray 400 ml',short:'Löschspray',cat:0,lvl:4,shape:'bottle',dims:[0.07,0.24,0.07],grid:[12,2,1],box:12,cost:4.20,market:10.99,weight:4,hype:0,risk:2,
    art:{title:'LÖSCHSPRAY',sub:'400 ml · für Haushalt',bg1:'#c01c20',bg2:'#3a0507',ac:'#ffffff',ac2:'#ffd23f'}},
  luftschlangenspray:{name:'Luftschlangen-Spray 3er',short:'Schlangenspray',cat:0,lvl:4,shape:'boxA',dims:[0.14,0.22,0.06],grid:[10,2,1],box:12,cost:1.70,market:4.29,weight:6,hype:0,risk:1,
    art:{title:'SPRAYPARTY',sub:'3 Dosen · bunt',bg1:'#5ce1ff',bg2:'#1557a8',ac:'#ff4fa3',ac2:'#ffe45c'}},

  /* ---------- Level 5-6: Klassiker ---------- */
  blitzknaller:{name:'Blitzknaller · 6 Stück',short:'Blitzknaller',cat:2,lvl:5,shape:'tubepack',dims:[0.13,0.05,0.05],grid:[8,2,2],box:16,cost:1.60,market:3.79,weight:8,hype:7,risk:3,
    desc:'Ein Blitz wie vom Fotoapparat und ein trockener Knall – danach tanzt dir kurz ein Fleck vor den Augen.',
    art:{title:'BLITZKNALLER',sub:'6 Stück · Blitz & Knall',bg1:'#f2f5ff',bg2:'#8a92a8',ac:'#1b1b2e',ac2:'#ff3b2e',light:true}},
  bodenkreisel:{name:'Brummkreisel · 6 Farbwechsel-Kreisel',short:'Kreisel',cat:2,lvl:5,shape:'boxA',dims:[0.16,0.06,0.1],grid:[8,2,2],box:16,cost:1.30,market:3.19,weight:7,hype:5,risk:2,
    desc:'Sechs Feuerkreisel ziehen leuchtende Ringe über den Tisch – vier heben surrend ab und steigen ein bis zwei Meter, wechseln die Farbe und knistern silbern aus.',
    art:{title:'BRUMMKREISEL',sub:'6 Farbwechsel-Kreisel',bg1:'#5a1470',bg2:'#1a0322',ac:'#5cff9e',ac2:'#ffd23f'}},
  rosesekt:{name:'Rosé-Sekt',short:'Rosé-Sekt',cat:0,lvl:5,cold:true,shape:'bottle',dims:[0.078,0.3,0.078],grid:[12,2,1],box:12,cost:2.80,market:6.99,weight:8,hype:0,risk:5,
    art:{title:'ROSÉ',sub:'Sekt 0,75 l',bg1:'#e58ca5',bg2:'#7a2a44',ac:'#f2e6c4',ac2:'#ffffff'}},
  berliner:{name:'Berliner mit Marmelade 4er',short:'Berliner',cat:0,lvl:5,shape:'boxA',dims:[0.24,0.08,0.16],grid:[6,2,2],box:10,cost:1.40,market:3.49,weight:8,hype:0,risk:4,
    art:{title:'BERLINER',sub:'4 Stück · Marmelade',bg1:'#e8b418',bg2:'#8a5a08',ac:'#7a1030',ac2:'#fff3c4',light:true}},
  glueckrakete:{name:'Schwebelicht · 5 Fallschirmraketen',short:'Fallschirm 5',cat:2,lvl:6,shape:'rocketset',dims:[0.38,0.05,0.1],grid:[4,2,2],box:8,cost:2.20,market:5.49,weight:7,hype:8,risk:3,
    desc:'Leise Zündung, dann hängt oben ein farbiger Leuchtsatz am Fallschirm, tropft Glut und schwebt acht Sekunden lang pendelnd herab. Fünf Raketen, fünf Farben.',
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
  miniverbund:{name:'Dreisprung · 9 Schuss Stufenbatterie',short:'Dreisprung 9',cat:2,lvl:8,shape:'battery',dims:[0.18,0.14,0.18],grid:[10,2,1],box:12,cost:3.20,market:7.49,weight:8,hype:12,risk:4,
    desc:'Hop, Step, Jump: dreimal drei Schuss, jeder Sprung landet höher als der letzte. Der dritte Satz endet mit einer kleinen Goldpalme und einem Funkenspritzer im Sand.',
    art:{title:'DREISPRUNG',sub:'9 Schuss · 3 × 3 Stufen',bg1:'#f28a1c',bg2:'#5a1a02',ac:'#ffffff',ac2:'#ffd23f'}},

  /* ---------- Level 8: Krach und Buffet ---------- */
  knallteppich:{name:'Knallteppich · 500er Chinakette',short:'Knallteppich',cat:2,lvl:8,shape:'boxA',dims:[0.3,0.05,0.24],grid:[6,2,2],box:10,cost:3.80,market:8.99,weight:7,hype:14,risk:5,
    desc:'Fünfhundert Kracher in einer Schlangenlinie: Die Kette peitscht, wird immer schneller, rote Papierfetzen fliegen – und am Ende drei dicke Schläge.',
    art:{title:'KNALLTEPPICH',sub:'500er Chinakette',bg1:'#c8201c',bg2:'#3a0507',ac:'#ffd23f',ac2:'#f2f5ff'}},
  farbfontaenen:{name:'Farbenspiel · 3 Fontänen mit Farbflamme',short:'Farbenspiel',cat:2,lvl:8,shape:'fountainset',dims:[0.47,0.145,0.09],grid:[7,2,1],box:7,cost:3.60,market:8.49,weight:7,hype:12,risk:4,
    desc:'Unten eine farbige Flamme, oben ein Funkenstrahl: Rot mit Gold, Grün mit Silber, zum Schluss wechselt die Flamme zwischen Rot und Grün.',
    art:{title:'FARBENSPIEL',sub:'3 Fontänen mit Farbflamme',bg1:'#5a1470',bg2:'#1a0322',ac:'#5cff9e',ac2:'#ff4fa3'}},
  bodenfeuer:{name:'Feuerkreis · Bodenring mit Knisterfinale',short:'Feuerkreis',cat:2,lvl:8,shape:'cylinder',dims:[0.14,0.14,0.14],grid:[8,2,1],box:10,cost:2.40,market:5.79,weight:7,hype:10,risk:4,
    desc:'Der Karton sprüht ringsum flach nach außen, die Funken landen als Glutring und springen auf. Zum Schluss zieht er sich zu einer knisternden Krone zusammen.',
    art:{title:'FEUERKREIS',sub:'Bodenring · 10 s',bg1:'#4a1a02',bg2:'#140600',ac:'#ff8a2a',ac2:'#ffd23f'}},
  heringssalat:{name:'Heringssalat 1 kg',short:'Heringssalat',cat:0,lvl:8,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.18,0.12,0.14],grid:[6,2,2],box:8,cost:2.60,market:6.49,weight:6,hype:0,risk:5,
    art:{title:'HERINGSSALAT',sub:'1 kg · rote Bete',bg1:'#8a1a44',bg2:'#2a0614',ac:'#f2f5ff',ac2:'#ffd23f'}},
  kartoffelsalat:{name:'Kartoffelsalat 1 kg',short:'Kartoffelsalat',cat:0,lvl:8,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.18,0.12,0.14],grid:[6,2,2],box:8,cost:2.00,market:4.99,weight:7,hype:0,risk:5,
    art:{title:'KARTOFFELSALAT',sub:'1 kg · mit Gurke',bg1:'#e8c35a',bg2:'#8a6a18',ac:'#1b5a2a',ac2:'#ffffff',light:true}},

  /* ---------- Level 9 ---------- */
  bengalfackel:{name:'Stadionfackel rot · 30 Sekunden',short:'Bengalfackel',cat:2,lvl:9,shape:'cylinder',dims:[0.06,0.34,0.06],grid:[14,2,1],box:12,cost:1.80,market:4.29,weight:7,hype:9,risk:4,
    desc:'Die Stadionfackel: dreißig Sekunden grelles Rot, der ganze Platz leuchtet mit, Rauch zieht davon und glühende Schlacke tropft zu Boden.',
    art:{title:'BENGALFEUER',sub:'Stadionfackel rot · 30 s',bg1:'#c01c20',bg2:'#3a0507',ac:'#ffffff',ac2:'#ffd23f'}},
  glitzerregen12:{name:'Glitzerregen · 12 Schuss',short:'Glitzerregen 12',cat:2,lvl:9,shape:'battery',dims:[0.2,0.16,0.2],grid:[9,2,1],box:10,cost:4.40,market:10.49,weight:7,hype:14,risk:5,
    desc:'Zwölf Goldbuketts, die hinter sich einen funkelnden Regen herziehen. Zum Schluss wird der Glitzerregen immer dichter, am Boden sprüht Gold.',
    art:{title:'GLITZERREGEN',sub:'12 Schuss Goldglitter',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4'}},
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
  sternstaub20:{name:'Funkelnacht · 20 Schuss Zeitsterne',short:'Funkelnacht 20',cat:2,lvl:10,shape:'battery',dims:[0.22,0.18,0.22],grid:[8,2,1],box:8,cost:6.00,market:14.49,weight:7,hype:18,risk:5,
    desc:'Dunkle Aufstiege, und oben gehen die Sterne einer nach dem anderen an, bis der Himmel funkelt. Zum Schluss fünf Sternennächte auf einen Schlag nebeneinander.',
    art:{title:'STERNENSTAUB',sub:'20 Schuss Verbund',bg1:'#1f3f8a',bg2:'#070e22',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  silberpfeil:{name:'Silberpfeil · 10 Leitwerkraketen',short:'Silberpfeil',cat:2,lvl:10,shape:'rocketset',dims:[0.44,0.06,0.13],grid:[4,2,2],box:8,cost:4.20,market:9.99,weight:7,hype:14,risk:4,
    desc:'Leitwerkrakete ohne Stab: Knall, ein gleißender Titanschweif, und oben schießen Silbersterne als Spinne hart auseinander und verlöschen im Flug. Schnell, hart, silbern.',
    art:{title:'SILBERPFEIL',sub:'10 Leitwerkraketen',bg1:'#26292f',bg2:'#000000',ac:'#d1e5ff',ac2:'#5ce1ff'}},
  zauberbrunnen:{name:'Zauberbrunnen · Verwandlungsfontäne 3-fach',short:'Zauberbrunnen',cat:2,lvl:10,shape:'cylinder',dims:[0.12,0.26,0.12],grid:[8,2,1],box:8,cost:4.00,market:9.49,weight:7,hype:14,risk:5,
    desc:'Hokuspokus: Nach jedem Zwischenschlag ist die Fontäne eine andere, erst Silber mit grünen Sternen, dann Gold mit violetten, zum Schluss knisternd mit beiden.',
    art:{title:'ZAUBERBRUNNEN',sub:'3-fache Verwandlung · 18 s',bg1:'#0f7a6b',bg2:'#03302a',ac:'#fff3a0',ac2:'#f2f5ff'}},
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
  goldstaubboeller:{name:'Goldstaub · 8 Glitzerböller',short:'Glitzerböller',cat:2,lvl:11,shape:'tubepack',dims:[0.15,0.06,0.06],grid:[8,2,2],box:12,cost:3.00,market:7.19,weight:7,hype:12,risk:5,
    desc:'Satter Knall, dann hängt eine Wolke Goldstaub in der Luft – und von oben nach unten blitzt jedes Körnchen einmal auf, wie eine Welle aus Glitzer.',
    art:{title:'GOLDSTAUB',sub:'8 Glitzerböller',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  kometenraketen:{name:'Kometenkette · 5 Raketen',short:'Kometenkette',cat:2,lvl:11,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:5.60,market:13.49,weight:7,hype:18,risk:5,
    desc:'Ein großer Goldkomet steigt auf. Oben fliegen Goldkometen auseinander, jeder spaltet sich zweimal – eine Kette aus immer kleineren Kometen, deren Enden blau verglühen.',
    art:{title:'KOMETENKETTE',sub:'5 Raketen · Kern zerbricht',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#5ce1ff'}},
  pfauenrad:{name:'Pfauenrad · 19 Schuss Radfächer',short:'Pfauenrad 19',cat:2,lvl:11,shape:'fan',dims:[0.4,0.2,0.26],grid:[5,1,1],box:4,cost:8.00,market:18.99,weight:6,hype:22,risk:6,
    desc:'Der Pfau stolziert und schlägt zweimal sein Rad: Goldpalmen mit türkisen Federaugen an den Spitzen, erst fünf, dann sieben auf einmal.',
    art:{title:'PFAUENRAD',sub:'19 Schuss Fächer',bg1:'#0f5a6b',bg2:'#032028',ac:'#5cff9e',ac2:'#ff4fa3'}},
  glueckssymbole:{name:'Glücksbringer-Set: Schornsteinfeger, Kleeblatt, Schwein',short:'Glücksbringer',cat:0,lvl:11,shape:'boxA',dims:[0.2,0.22,0.08],grid:[8,2,1],box:12,cost:1.80,market:4.49,weight:7,hype:0,risk:1,
    art:{title:'VIEL GLÜCK',sub:'Glücksbringer-Set',bg1:'#1b5a2a',bg2:'#062a10',ac:'#ffd23f',ac2:'#ff4a4a'}},
  glueckskekse:{name:'Glückskekse »Neujahr« 20er',short:'Glückskekse',cat:0,lvl:11,shape:'boxA',dims:[0.2,0.1,0.14],grid:[6,2,2],box:12,cost:1.40,market:3.49,weight:6,hype:0,risk:2,
    art:{title:'GLÜCKSKEKSE',sub:'20 Stück · Neujahr',bg1:'#c8322a',bg2:'#4a0a06',ac:'#ffd23f',ac2:'#fff3c4'}},
  gluecksklee:{name:'Glücksklee im Topf',short:'Glücksklee',cat:0,lvl:11,shape:'cylinder',dims:[0.1,0.14,0.1],grid:[10,2,1],box:12,cost:1.00,market:2.49,weight:7,hype:0,risk:3,
    art:{title:'GLÜCKSKLEE',sub:'im Topf',bg1:'#2f9e57',bg2:'#0d3a20',ac:'#ffd23f',ac2:'#ff4a4a'}},
  marzipanschwein:{name:'Glücksschweinchen aus Marzipan 6er',short:'Marzipanschwein',cat:0,kasse:'gern',lvl:11,shape:'boxA',dims:[0.18,0.06,0.12],grid:[8,2,2],box:16,cost:1.60,market:3.99,weight:6,hype:0,risk:3,
    art:{title:'GLÜCKSSCHWEIN',sub:'Marzipan · 6 Stück',bg1:'#e58ca5',bg2:'#7a2a44',ac:'#fff3c4',ac2:'#1b5a2a'}},
  schokotaler:{name:'Schoko-Glückstaler 30er',short:'Glückstaler',cat:0,kasse:'gern',lvl:11,shape:'boxA',dims:[0.16,0.18,0.05],grid:[10,2,1],box:16,cost:1.20,market:2.99,weight:6,hype:0,risk:3,
    art:{title:'GLÜCKSTALER',sub:'Schokolade · 30 Stück',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#f2ecd8',gold:true}},

  /* ---------- Level 12 ---------- */
  farbenrausch:{name:'Halbe-Halbe · 7 Raketen Zweifarbenbruch',short:'Halbe-Halbe',cat:2,lvl:12,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:6.40,market:14.99,weight:7,hype:20,risk:5,
    desc:'Eine Hälfte Rot, eine Hälfte Grün – dann setzen die Sterne kurz aus und die Hälften tauschen. Die Rakete steigt mit roter Flamme und Kohlefunken.',
    art:{title:'HALBE-HALBE',sub:'7 Raketen · Zweifarbenbruch',bg1:'#6a24c9',bg2:'#25093f',ac:'#5cff9e',ac2:'#ff4fa3'}},
  nachtfalter:{name:'Nachtfalter · 36 Schuss Lichtertanz',short:'Nachtfalter 36',cat:2,lvl:12,shape:'battery',dims:[0.3,0.24,0.3],grid:[7,1,1],box:6,cost:11.00,market:25.99,weight:6,hype:26,risk:6,
    desc:'Eine kleine Goldfontäne zum Auftakt, dann gehen am Himmel violette Blüten auf – und ihre Falter flattern taumelnd herab, jeder in seinem eigenen Flügelschlag.',
    art:{title:'NACHTFALTER',sub:'36 Schuss Verbund',bg1:'#2a0f5a',bg2:'#0a0318',ac:'#ffd23f',ac2:'#c8a2ff'}},
  feuerberg:{name:'Feuerberg · Lavavulkan 15 s',short:'Feuerberg',cat:2,lvl:8,shape:'cylinder',dims:[0.14,0.3,0.14],grid:[8,2,1],box:8,cost:5.20,market:12.49,weight:6,hype:22,risk:6,
    desc:'Erst schwelt und grollt der Krater, dann spuckt der Feuerberg Glutbrocken, die im Flug verglühen. Zum Schluss bricht er aus.',
    art:{title:'FEUERBERG',sub:'Lavavulkan · 15 s',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#ff7a1c'}},
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
  goldpalmen:{name:'Palmenhain · 25 Schuss',short:'Palmenhain 25',cat:2,lvl:13,shape:'battery',dims:[0.28,0.22,0.28],grid:[7,2,1],box:6,cost:9.80,market:22.99,weight:6,hype:24,risk:6,
    desc:'Ein ganzer Palmenhain aus Gold: hohe Palmen mit leuchtendem Stamm, darunter kleine Kokospalmen, zum Schluss wiegen sich die Palmen im Wind und vier stehen auf einmal.',
    art:{title:'PALMENHAIN',sub:'25 Schuss · Goldpalmen mit Stamm',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#1b5a2a',gold:true}},
  funkenturm:{name:'Funkenturm · 3-Etagen-Fontäne 6 m',short:'Funkenturm',cat:2,lvl:13,shape:'cylinder',dims:[0.15,0.32,0.15],grid:[8,1,1],box:6,cost:7.60,market:17.99,weight:6,hype:24,risk:6,
    desc:'Mit jedem dumpfen Schlag wächst der Turm um ein Stockwerk, zwei, vier, sechs Meter, oben mit goldener Krone.',
    art:{title:'FUNKENTURM',sub:'3 Etagen · 6 m · 14 s',bg1:'#12735a',bg2:'#063328',ac:'#f2f5ff',ac2:'#ffd23f'}},
  knisterstern:{name:'Spätzünder · 10 Knisterraketen',short:'Spätzünder',cat:2,lvl:13,shape:'rocketset',dims:[0.46,0.065,0.14],grid:[3,2,2],box:6,cost:6.80,market:15.99,weight:6,hype:22,risk:6,
    desc:'Knistert beim Steigen, macht oben kurz »Pff« … und wenn keiner mehr hinschaut, prasselt eine riesige Knisterwolke los.',
    art:{title:'SPÄTZÜNDER',sub:'10 Knisterraketen',bg1:'#12406b',bg2:'#04121f',ac:'#5ce1ff',ac2:'#ffd23f'}},
  mondschein:{name:'Mondschein · 30 Schuss Silbermond',short:'Mondschein 30',cat:2,lvl:13,shape:'battery',dims:[0.3,0.24,0.3],grid:[7,1,1],box:6,cost:11.50,market:26.99,weight:6,hype:26,risk:6,
    desc:'Silberne Chrysanthemen mit blassgelbem Mond im Kern gehen über einer Silberfontäne auf. Dazwischen ziehen Sternschleier und Silberweiden vorbei.',
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
  feuerperlen:{name:'Feuerperlen · 16 Schuss Kometenfächer',short:'Feuerperlen 16',cat:2,lvl:10,shape:'battery',dims:[0.28,0.22,0.28],grid:[7,2,1],box:6,cost:7.20,market:16.99,weight:6,hype:22,risk:6,
    desc:'Große Kometenfächer, deren Köpfe von Rot über Gold zu Weiß werden, dazwischen rote Zackenkometen und knisternde Crossetten – eine Batterie für den Tisch.',
    art:{title:'FEUERPERLEN',sub:'16 Schuss · Kometenfächer',bg1:'#c01c20',bg2:'#3a0507',ac:'#ffd23f',ac2:'#ffffff'}},
  farbrauchboeller:{name:'Farbrauch · 6 Tagböller in sechs Farben',short:'Farbrauchböller',cat:2,lvl:14,shape:'tubepack',dims:[0.16,0.065,0.065],grid:[7,2,2],box:12,cost:3.60,market:8.49,weight:6,hype:14,risk:5,
    desc:'Kräftiger Schlag, dann quillt eine dicke Farbwolke auf – sechs Böller, sechs Farben der Reihe nach, von Rot bis Orange.',
    art:{title:'FARBRAUCH',sub:'6 Tagböller · 6 Farben',bg1:'#1557a8',bg2:'#8a1f6a',ac:'#5cff9e',ac2:'#ffe45c'}},
  feuerrad:{name:'Drehsonne · Saxon mit Richtungswechsel',short:'Drehsonne',cat:2,lvl:14,shape:'boxA',dims:[0.56,0.41,0.1],gestell:'rad',grid:[6,2,1],box:6,cost:5.20,market:12.49,weight:6,hype:18,risk:5,
    desc:'Das Rad auf seinem Ständer dreht rechtsherum in Gold, stockt und wirbelt dann linksherum in Silber weiter, schneller als vorher. Kommt auf dem Zündtisch aufgebaut.',
    art:{title:'DREHSONNE',sub:'Saxon · Richtungswechsel · 14 s',bg1:'#f2a01c',bg2:'#8a3d06',ac:'#ffffff',ac2:'#c8201c'}},
  knisterfaecher:{name:'Silberschwarm · 24 Schuss Fischfächer',short:'Silberschwarm',cat:2,lvl:14,shape:'fan',dims:[0.48,0.24,0.3],grid:[4,1,1],box:3,cost:12.00,market:27.99,weight:6,hype:30,risk:7,
    desc:'Silberne Fischschwärme: Dutzende kleiner Fische zischen im Zickzack auseinander, jeder für sich. Zum Schluss kreuzen sich zwei Schwärme.',
    art:{title:'SILBERSCHWARM',sub:'24 Schuss Fischfächer',bg1:'#12406b',bg2:'#04121f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  palmenkugel75:{name:'Südsee · Kugelbombe 75 mm Palme im Ring',short:'Kugel 75 Südsee',cat:2,lvl:14,shape:'shell',dims:[0.09,0.115,0.09],grid:[8,2,1],box:8,cost:5.80,market:13.99,weight:6,hype:24,risk:7,
    desc:'Eine kleine Insel am Himmel: goldene Palmwedel mit Funkenschweif um einen türkisen Kern – und aus der Krone plumpsen drei Kokosnüsse.',
    art:{title:'PALMENSTRAND',sub:'Kugelbombe 75 mm · Palme',bg1:'#1b5a2a',bg2:'#062a10',ac:'#ffd23f',ac2:'#5cff9e'}},

  /* ---------- Level 15: feine Getraenke, mehr Farbe ---------- */
  champagner:{name:'Champagner Brut',short:'Champagner',cat:0,lvl:15,cold:true,shape:'bottle',dims:[0.08,0.31,0.08],grid:[12,2,1],box:6,cost:12.00,market:29.99,weight:5,hype:0,risk:6,
    art:{title:'CHAMPAGNE',sub:'Brut · 0,75 l',bg1:'#0e1226',bg2:'#000000',ac:'#e8c35a',ac2:'#f2f5ff',gold:true}},
  cocktailset:{name:'Cocktail-Set »Mitternacht«',short:'Cocktailset',cat:0,lvl:15,shape:'boxA',dims:[0.28,0.3,0.12],grid:[5,1,1],box:4,cost:8.40,market:19.99,weight:4,hype:0,risk:4,
    art:{title:'MITTERNACHT',sub:'Cocktail-Set',bg1:'#2a0f5a',bg2:'#0a0318',ac:'#ff4fd8',ac2:'#5ce1ff'}},
  rotwein:{name:'Rotwein Spätburgunder',short:'Rotwein',cat:0,lvl:15,shape:'bottle',dims:[0.078,0.31,0.078],grid:[12,2,1],box:6,cost:3.60,market:8.99,weight:6,hype:0,risk:4,
    art:{title:'SPÄTBURGUNDER',sub:'Rotwein · trocken',bg1:'#5a0a1e',bg2:'#1a0206',ac:'#e8c35a',ac2:'#f2f5ff'}},
  smaragd:{name:'Smaragd · 7 Raketen Achtblatt',short:'Smaragd',cat:2,lvl:15,shape:'rocketset',dims:[0.48,0.065,0.145],grid:[3,2,2],box:6,cost:8.20,market:18.99,weight:6,hype:24,risk:6,
    desc:'Ein grüner Kometenkopf steigt auf. Oben geht eine achtblättrige Blüte in drei Grüntönen auf, geschliffen wie ein Smaragd, mit Glitzer an den Blattspitzen.',
    art:{title:'SMARAGD',sub:'7 Raketen · Achtblatt-Blüte',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  dreiklang:{name:'Dreiklang · 3 gekreuzte Fontänen',short:'Dreiklang',cat:2,lvl:15,shape:'fountainset',dims:[0.63,0.17,0.1],grid:[6,2,1],box:5,cost:7.40,market:17.49,weight:6,hype:24,risk:6,
    desc:'Zwei geneigte Silberfontänen kreuzen sich über einer goldenen, alle mit blauer Flamme an der Düse. Zum Schluss richten sich alle drei auf und knistern.',
    art:{title:'DREIKLANG',sub:'3 gekreuzte Fontänen · Blauflamme',bg1:'#123a6b',bg2:'#04101f',ac:'#ffd23f',ac2:'#ff4fa3'}},
  sternenmeer42:{name:'Tausendblüten · 42 Schuss Senrin',short:'Tausendblüten 42',cat:2,lvl:15,shape:'battery',dims:[0.36,0.28,0.34],grid:[6,1,1],box:5,cost:15.00,market:34.99,weight:5,hype:34,risk:7,
    desc:'Oben ein kurzer Atemzug Stille – dann platzen auf einmal Dutzende kleiner Blüten mit hellem Prasseln. Zum Schluss acht Blütenbeete gleichzeitig: ein Meer aus Blumen.',
    art:{title:'TAUSENDBLÜTEN',sub:'42 Schuss · Senrin',bg1:'#6a1470',bg2:'#1a0322',ac:'#ff4fa3',ac2:'#c8ff5c'}},

  /* ---------- Level 16: Nachthimmel ---------- */
  sternenmeer80:{name:'Silberbrandung · 80 Schuss Wellenbatterie',short:'Brandung 80',cat:2,lvl:16,shape:'battery',dims:[0.52,0.38,0.42],grid:[4,1,1],box:3,cost:26.00,market:59.99,weight:5,hype:48,risk:8,
    desc:'Silberne Gischt, die mitten im Flug zu türkisem Wasser wird – Welle auf Welle rollt über den Himmel, erst sanft, dann als Sturmflut.',
    art:{title:'SILBERBRANDUNG',sub:'80 Schuss · Silberwelle',bg1:'#0f4f5c',bg2:'#02141a',ac:'#d1e5ff',ac2:'#5ce1ff'}},
  silberwirbel:{name:'Silberwirbel · 30 Schuss Farfalle-Fächer',short:'Silberwirbel',cat:2,lvl:16,shape:'fan',dims:[0.56,0.26,0.32],grid:[4,1,1],box:3,cost:17.00,market:39.99,weight:5,hype:40,risk:8,
    desc:'Oben angekommen, zerfällt jeder Schuss in ein Dutzend kleiner Silberräder, die sich drehend und zischend durch die Luft schrauben.',
    art:{title:'SILBERWIRBEL',sub:'30 Schuss · Farfalle',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  farbenmeer75:{name:'Chamäleon · Kugelbombe 75 mm Farbwanderung',short:'Kugel 75 Chamäleon',cat:2,lvl:15,shape:'shell',dims:[0.09,0.115,0.09],grid:[8,2,1],box:8,cost:6.20,market:14.99,weight:6,hype:28,risk:7,
    desc:'Eine grüne Kugel – dann wandert die Farbe: Von links nach rechts setzt jeder Stern kurz aus und glüht orange weiter, bis alle im selben Augenblick verlöschen.',
    art:{title:'FARBENMEER',sub:'75 mm · Farbwechsel',bg1:'#5a1470',bg2:'#1a0322',ac:'#5ce1ff',ac2:'#ff4fa3'}},
  blinkstern:{name:'Leuchtturm · 5 Blinkraketen',short:'Leuchtturm',cat:2,lvl:16,shape:'rocketset',dims:[0.48,0.065,0.145],grid:[3,2,2],box:6,cost:9.00,market:20.99,weight:6,hype:28,risk:6,
    desc:'Die Rakete blinkt schon im Steigen. Oben blitzen weiße Blinksterne wie ein Leuchtfeuer, jeder in seinem eigenen Takt, und in der Mitte glüht golden die Laterne.',
    art:{title:'LEUCHTTURM',sub:'5 Blinkraketen',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  wasserspiel:{name:'Wasserorgel · 4 Fontänen im Tanz',short:'Wasserorgel',cat:2,lvl:16,shape:'fountainset',dims:[0.79,0.17,0.1],grid:[6,2,1],box:5,cost:8.80,market:20.49,weight:6,hype:28,risk:6,
    desc:'Vier Silberfontänen in Zündfolgen: einzeln von außen nach innen, paarweise im Wechsel, als Welle, und zum Schluss alle gemeinsam sechs Meter hoch, mit türkisen Perlen.',
    art:{title:'WASSERORGEL',sub:'4 Fontänen im Tanz · 20 s',bg1:'#0f5a6b',bg2:'#032028',ac:'#5ce1ff',ac2:'#f2f5ff'}},
  weisswein:{name:'Weißwein Riesling',short:'Weißwein',cat:0,lvl:16,cold:true,shape:'bottle',dims:[0.078,0.31,0.078],grid:[12,2,1],box:6,cost:3.40,market:8.49,weight:6,hype:0,risk:4,
    art:{title:'RIESLING',sub:'Weißwein · halbtrocken',bg1:'#e8e2a8',bg2:'#8a8448',ac:'#1b3a2e',ac2:'#c8a23a',light:true}},
  eierlikoer:{name:'Eierlikör 0,7 l',short:'Eierlikör',cat:0,lvl:16,shape:'bottle',dims:[0.08,0.28,0.08],grid:[12,2,1],box:6,cost:3.20,market:7.99,weight:5,hype:0,risk:4,
    art:{title:'EIERLIKÖR',sub:'0,7 Liter',bg1:'#f2d21b',bg2:'#8a7208',ac:'#1b1b1b',ac2:'#ffffff',light:true}},

  /* ---------- Level 17 ---------- */
  regenbogenfaecher:{name:'Regenbogenbrücke · 63 Schuss Spektralfächer',short:'Regenbogenbrücke',cat:2,lvl:17,shape:'fan',dims:[0.64,0.3,0.36],grid:[4,1,1],box:2,cost:27.00,market:62.99,weight:5,hype:50,risk:8,
    desc:'Erst Nieselregen, dann spannt sich Bogen für Bogen ein Regenbogen über den Himmel – Rot außen zuerst, Violett innen zuletzt, jeder Bogen aus sieben Schuss in einer reinen Farbe.',
    art:{title:'REGENBOGENBRÜCKE',sub:'63 Schuss · Spektralbogen',bg1:'#6a24c9',bg2:'#25093f',ac:'#ffd23f',ac2:'#5cff9e'}},
  goldweide100:{name:'Hängeweide · Kugelbombe 100 mm 10 Sekunden',short:'Kugel 100 Weide',cat:2,lvl:17,shape:'shell',dims:[0.12,0.15,0.12],grid:[6,2,1],box:6,cost:12.00,market:28.99,weight:5,hype:40,risk:8,
    desc:'Kein Knall, nur ein Rauschen: Goldene Äste hängen zehn Sekunden am Himmel und sinken fast bis zum Boden – zum Schluss treibt jeder Ast ein grünes Blatt.',
    art:{title:'GOLDWEIDE',sub:'Kugelbombe 100 mm',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  silberregen:{name:'Silberregen · 5 Raketen Silber-Kamuro',short:'Silberregen',cat:2,lvl:17,shape:'rocketset',dims:[0.5,0.07,0.15],grid:[3,2,2],box:6,cost:10.00,market:23.49,weight:5,hype:32,risk:7,
    desc:'Oben öffnet sich eine dichte Silberglocke und hängt am Himmel, aus der ein feiner Silberregen rieselt – zum Schluss funkeln die Spitzen weiß. Schon beim Aufstieg tropft der Schweif.',
    art:{title:'SILBERREGEN',sub:'5 Raketen · Silber-Kamuro',bg1:'#26292f',bg2:'#000000',ac:'#f2f5ff',ac2:'#d1e5ff'}},
  hagelsturm:{name:'Hagelsturm · 320 Schuss in 40 s',short:'Hagelsturm',cat:2,lvl:17,shape:'battery',dims:[0.46,0.32,0.4],grid:[4,1,1],box:3,cost:22.00,market:49.99,weight:5,hype:50,risk:8,
    desc:'320 Schuss in 40 Sekunden: Ein Dauerprasseln aus weißen Hagelkörnern knapp über den Dächern, alle paar Sekunden schlägt oben ein großer Silberblitz ein – und am Boden sprühen die Knisterfontänen.',
    art:{title:'HAGELSTURM',sub:'320 Schuss · 40 Sekunden',bg1:'#3a4a5c',bg2:'#05090f',ac:'#f2f5ff',ac2:'#8fd8ff'}},
  glitzerkaskade:{name:'Funkelsäule · 12-m-Glitzerfontäne',short:'Funkelsäule',cat:2,lvl:17,shape:'cylinder',dims:[0.18,0.36,0.18],grid:[7,1,1],box:4,cost:12.00,market:27.99,weight:5,hype:34,risk:7,
    desc:'Eine dunkle Goldsäule, die oben in tausend einzelnen Glitzerblitzen zerstäubt, zum Schluss in Silber.',
    art:{title:'FUNKELSÄULE',sub:'12 m · Glitzer · 20 s',bg1:'#12204a',bg2:'#04081a',ac:'#f2f5ff',ac2:'#ffd23f'}},
  kaesefondue:{name:'Käsefondue-Set für 4',short:'Käsefondue',cat:0,lvl:17,cold:true,kuehlpflicht:true,shape:'boxA',dims:[0.26,0.1,0.18],grid:[4,2,2],box:6,cost:6.80,market:16.99,weight:4,hype:0,risk:5,
    art:{title:'KÄSEFONDUE',sub:'für 4 · mit Brot',bg1:'#e8b418',bg2:'#8a5a08',ac:'#7a1010',ac2:'#ffffff',light:true}},
  likoer:{name:'Sahnelikör 0,7 l',short:'Sahnelikör',cat:0,lvl:17,cold:true,shape:'bottle',dims:[0.08,0.28,0.08],grid:[12,2,1],box:6,cost:4.60,market:11.49,weight:4,hype:0,risk:4,
    art:{title:'SAHNELIKÖR',sub:'0,7 Liter',bg1:'#4a2a14',bg2:'#140a04',ac:'#f2e6c4',ac2:'#e8c35a'}},

  /* ---------- Level 18: Goldklasse ---------- */
  kreuzfeuer:{name:'Kreuzfeuer · 42 Schuss Crossette',short:'Kreuzfeuer',cat:2,lvl:18,shape:'battery',dims:[0.42,0.34,0.38],grid:[5,1,1],box:4,cost:21.00,market:48.99,weight:5,hype:44,risk:8,
    desc:'Kometen kreuzen sich in halber Höhe und zerplatzen oben mit Knall zu je vier Splittern – rot von links, weiß von rechts, bis der Himmel kariert ist.',
    art:{title:'KREUZFEUER',sub:'42 Schuss · Crossette',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#f2f5ff'}},
  kristall:{name:'Glasbruch · 5 Singraketen',short:'Glasbruch',cat:2,lvl:18,shape:'rocketset',dims:[0.52,0.075,0.16],grid:[3,2,2],box:6,cost:11.40,market:26.49,weight:5,hype:36,risk:7,
    desc:'Die Rakete singt wie ein Weinglas und steigt mit Silberflitter. Oben geht eine eisblaue Kugel auf – und jeder Stern zerspringt klirrend in weiße Splitter.',
    art:{title:'GLASBRUCH',sub:'5 Singraketen',bg1:'#0f2a4a',bg2:'#02060f',ac:'#d1e5ff',ac2:'#f2f5ff'}},
  sternenstaub150:{name:'Sternenstaub · Kugelbombe 150 mm Silberzeitregen',short:'Kugel 150 Sternenstaub',cat:2,lvl:18,shape:'shell',dims:[0.165,0.2,0.165],grid:[4,1,1],box:3,cost:30.00,market:71.99,weight:4,hype:66,risk:10,
    desc:'Keine Kugel, sondern ein Regen: Fünfzig große Silbersterne treiben langsam auseinander und sinken fünf Sekunden lang – jeder rieselt zischend Sternenstaub.',
    art:{title:'STERNENSTAUB',sub:'150 mm · Silberzeitregen',bg1:'#12204a',bg2:'#04081a',ac:'#f2f5ff',ac2:'#ffd23f'}},
  magnum:{name:'Champagner Magnum 1,5 l',short:'Magnum',cat:0,lvl:18,cold:true,shape:'bottle',dims:[0.11,0.35,0.11],grid:[8,1,1],box:3,cost:28.00,market:69.99,weight:3,hype:0,risk:7,
    art:{title:'MAGNUM',sub:'Champagner 1,5 l',bg1:'#0e1226',bg2:'#000000',ac:'#e8c35a',ac2:'#f2f5ff',gold:true}},

  /* ---------- Level 19: Sternklasse ---------- */
  goldenerregen:{name:'Vorhang auf! · 70 Schuss Goldvorhang',short:'Goldvorhang',cat:2,lvl:19,shape:'battery',dims:[0.5,0.4,0.44],grid:[4,1,1],box:3,cost:34.00,market:78.99,weight:4,hype:62,risk:9,
    desc:'Drei Klingelzeichen, dann fällt ein goldener Bühnenvorhang über die ganze Breite und öffnet sich zur Mitte hin – dahinter drei Akte Brokat, Applaus, und am Ende schließt er sich wieder.',
    art:{title:'VORHANG AUF!',sub:'70 Schuss · Goldvorhang',bg1:'#6b0f1a',bg2:'#1a0205',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  regenbogenkrone:{name:'Jumbo-Rakete »Saphirkrone«',short:'Jumbo Saphirkrone',cat:2,lvl:19,shape:'rocketset',stueck:1,dims:[0.8,0.1,0.15],grid:[2,1,1],box:4,cost:12.50,market:29.99,weight:4,hype:40,risk:9,
    desc:'Ein dicker Goldstamm wächst in den Himmel. Oben öffnet sich eine Krone aus saphirblauen Sternen, jeder zieht einen goldenen Funkenschweif, und in der Mitte glitzert Gold.',
    art:{title:'SAPHIRKRONE',sub:'Chrysanthemenkrone · Einzelrakete',bg1:'#12275e',bg2:'#040a1f',ac:'#ffd23f',ac2:'#5c8dff'}},
  lichterkugeln:{name:'Lichterkette · 24 Glitzerkugeln',short:'Lichterkette',cat:2,lvl:11,shape:'battery',dims:[0.34,0.3,0.34],grid:[6,1,1],box:4,cost:9.20,market:21.49,weight:5,hype:34,risk:7,
    desc:'Sechs Rohre legen eine Kette aus Leuchtkugeln quer über den Himmel – jede steigt mit Goldschweif, geht oben kurz aus und zerfällt in funkelnden Silberglitter.',
    art:{title:'LICHTERKETTE',sub:'24 Kugeln · Glitter',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#ff4fa3'}},
  eisblume:{name:'Wendeltreppe · 12-m-Drehfontäne',short:'Wendeltreppe',cat:2,lvl:19,shape:'cylinder',dims:[0.22,0.38,0.22],grid:[6,1,1],box:3,cost:18.00,market:42.99,weight:4,hype:50,risk:8,
    desc:'Eine Silberfontäne schraubt sich wie eine Wendeltreppe zwölf Meter hoch, bekommt einen gegenläufigen Zwilling und öffnet sich zum Schluss zu einem wirbelnden Trichter. Dazwischen türkise Sterne.',
    art:{title:'WENDELTREPPE',sub:'12 m · Drehfontäne · 22 s',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  /* 03.10. abends (Tom: die Donnerschlaege gefallen nicht, die Faecher und
     alles drumherum 'mega schoen'): ohne Knallbomben, neuer Name */
  donnerschlag:{name:'Silberknister · 20 Schuss Knisterkometen',short:'Silberknister',cat:2,lvl:19,shape:'battery',dims:[0.34,0.3,0.34],grid:[6,1,1],box:4,cost:17.00,market:38.99,weight:5,hype:46,risk:9,
    desc:'Breite Silberfächer mit knisterndem Schweif, darüber silberne Zackenkometen, Knistercrossetten und knisternde Sterne – zum Schluss sechs Kometen auf Schlag über einem zweiten Fächer.',
    art:{title:'SILBERKNISTER',sub:'20 Schuss · Knisterkometen',bg1:'#1c1c24',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff3b2e'}},

  /* ---------- Level 20-21 ---------- */
  feuerpfau:{name:'Farbsäulen · 100 Schuss Dreistufen-Fächer',short:'Farbsäulen',cat:2,lvl:20,shape:'fan',dims:[0.76,0.34,0.42],grid:[3,1,1],box:2,cost:44.00,market:99.99,weight:4,hype:72,risk:9,
    desc:'Jeder Schuss ist eine Säule aus Farbe: Feuertopf, Farbkomet und Blüte in derselben Farbe – Magenta und Limette mit Gold – vom Boden bis in 40 Meter.',
    art:{title:'FARBSÄULEN',sub:'100 Schuss · Dreistufen',bg1:'#3a0a5c',bg2:'#0a0214',ac:'#ff4fd8',ac2:'#9cff3a'}},
  goldvulkan:{name:'Lametta · Goldvulkan 30 s',short:'Lametta',cat:2,lvl:20,shape:'cylinder',dims:[0.24,0.36,0.24],grid:[6,1,1],box:3,cost:16.00,market:37.99,weight:4,hype:46,risk:8,
    desc:'Goldene Lamettafäden steigen sieben Meter hoch und rieseln langsam bis auf den Boden. Nach dem Ende regnet es noch drei Sekunden nach.',
    art:{title:'LAMETTA',sub:'Goldvulkan · 30 s',bg1:'#6b4a0c',bg2:'#1f1402',ac:'#ffd23f',ac2:'#ff7a1c',gold:true}},
  /* Spektakel-Batterie: Hexenringe um einen brodelnden Kessel */
  hexenkessel:{name:'Hexenkessel · 180 Schuss in 35 s',short:'Hexenkessel',cat:2,lvl:20,shape:'battery',dims:[0.62,0.42,0.5],grid:[3,1,1],box:2,cost:40.00,market:89.99,weight:4,hype:74,risk:9,
    desc:'In der Mitte brodelt ein Kessel aus Goldfunken mit grünen Sternen, rundherum schießen Ringe aus acht Rohren gleichzeitig schräg nach außen – eine Hexenkrone nach der anderen, immer schneller.',
    art:{title:'HEXENKESSEL',sub:'180 Schuss · 35 Sekunden',bg1:'#2a5a0a',bg2:'#0a0214',ac:'#b6ff3a',ac2:'#c85cff'}},
  /* 30.09. (Tom): Kerzen-Batterien - die grosse Legion und drei reine
     Shows aus grossen Roemischen Lichtern, ohne Knall */
  legion:{name:'Legion · 240 Schuss Kerzen-Heer',short:'Legion',cat:2,lvl:26,shape:'battery',dims:[0.98,0.84,0.6],grid:[2,1,1],box:1,cost:118.00,market:269.99,weight:2,hype:100,risk:10,
    desc:'Ein ganzes Heer aus Römischen Lichtern: goldene Weidenkerzen zwischen Riesenfontänen, ein Wischer aus Blinkkerzen, Kreuzkerzen im Kreis über dem Vulkan, Bombetten, Pfeif- und Fischkerzen, Titanschläge – und ein Finale aus 48 Weidenkerzen, 36 Knallkerzen und zwölf Riesen-Kamuros.',
    art:{title:'LEGION',sub:'240 Schuss · Kerzen-Heer',bg1:'#6a4a14',bg2:'#140a02',ac:'#ffe08a',ac2:'#ff3a2e',gold:true}},
  lichterprozession:{name:'Lichterprozession · 64 Schuss Großkerzen',short:'Lichterprozession',cat:2,lvl:17,shape:'battery',dims:[0.5,0.36,0.42],grid:[3,1,1],box:2,cost:27.00,market:62.99,weight:5,hype:60,risk:7,
    desc:'Eine Show nur aus großen Römischen Lichtern, ganz ohne Knall: dicke Leuchtkugeln steigen in Reihen, Wellen und Treppen, schwebende Perlen hängen als Girlanden am Himmel – zum Schluss sechzehn Kugeln auf einen Schlag über zwei Goldfontänen.',
    art:{title:'LICHTERPROZESSION',sub:'64 Schuss · Großkerzen · ohne Knall',bg1:'#3a1a5c',bg2:'#0a0214',ac:'#ffd23f',ac2:'#ff7ad8'}},
  kometenreigen:{name:'Kometenreigen · 96 Schuss Kometenkerzen',short:'Kometenreigen',cat:2,lvl:21,shape:'battery',dims:[0.6,0.4,0.46],grid:[3,1,1],box:2,cost:44.00,market:99.99,weight:4,hype:76,risk:9,
    desc:'Kometenkerzen tanzen einen Reigen: goldene Brokatkugeln mit langem Glitzerschweif kreuzen sich, fallen als kleine Trauerweiden auseinander und kreisen über einem glühenden Vulkan – ganz ohne Knall, nur Glanz und Rieseln.',
    art:{title:'KOMETENREIGEN',sub:'96 Schuss · Kometenkerzen · ohne Knall',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  sternentor:{name:'Sternentor · 160 Schuss Kerzen-Verbund',short:'Sternentor',cat:2,lvl:24,shape:'battery',dims:[0.9,0.6,0.56],grid:[2,1,1],box:1,cost:76.00,market:174.99,weight:3,hype:94,risk:10,
    desc:'Der große Kerzen-Verbund ohne einen einzigen Knall: Farbwechsel-Kerzen wischen über den Himmel, Sternkerzen öffnen sich zu kleinen Sternen, schwebende Perlen bilden ein Tor aus Licht – im Finale 36 Kerzen auf einen Schlag zwischen zwei Riesenfontänen.',
    art:{title:'STERNENTOR',sub:'160 Schuss · Kerzen-Verbund · ohne Knall',bg1:'#0c2a7a',bg2:'#020a1c',ac:'#f2f5ff',ac2:'#ffd23f'}},
  /* 01.10. (Tom): aus den Lieblingen der 15 Muster (Tigerschweif,
     Kiefernkrone, Lavaregen, Sternspritzer) eine fertige Batterie */
  glutschmiede:{name:'Glutschmiede · 51 Schuss Feuerbatterie',short:'Glutschmiede',cat:2,lvl:22,shape:'battery',dims:[0.9,0.32,0.6],grid:[3,1,1],box:2,cost:46.00,market:104.99,weight:4,hype:82,risk:9,
    desc:'Eine Schmiede aus Glut und Gold: Sternspritzer sprühen wie Wunderkerzen, Tigerkometen ziehen breite Goldbänder, glühende Lavabrocken stürzen im Bogen, Goldsterne zerspringen knisternd zu Tannennadeln – über zwei Vulkanen, im Finale alles zugleich.',
    art:{title:'GLUTSCHMIEDE',sub:'51 Schuss · Feuerbatterie',bg1:'#6a2a06',bg2:'#140602',ac:'#ffd23f',ac2:'#ff5a1e',gold:true}},
  /* 30.09. (Tom): neue Kugeln - die Kanonade und vier klassisch schoene Bomben */
  kanonade300:{name:'Kanonade · Kugelbombe 300 mm 30 Knallkugeln',short:'Kanonade 300',cat:2,lvl:24,shape:'shell',dims:[0.3,0.34,0.3],grid:[2,1,1],box:1,cost:72.00,market:169.99,weight:2,hype:100,risk:10,
    desc:'Dreißig schwere weiße Kugeln fliegen aus wie Knallkerzen und zerknallen nacheinander mit Weißblitz – ein rollender Donner, über dem ein goldener Kamuro hängt.',
    art:{title:'KANONADE',sub:'300 mm · Knallkugeln',bg1:'#2a2e36',bg2:'#000000',ac:'#f2f5ff',ac2:'#ffd23f'}},
  feuerlilie200:{name:'Feuerlilie · Kugelbombe 200 mm Lilienblüte',short:'Kugel 200 Lilie',cat:2,lvl:22,shape:'shell',dims:[0.21,0.25,0.21],grid:[3,1,1],box:2,cost:47.00,market:111.99,weight:3,hype:94,risk:10,
    desc:'Zwölf rote Blütenblätter mit goldenem Schweif biegen sich wie eine Lilie auseinander – und an jeder Spitze öffnet sich ein goldener Blütenstempel. Mitten in der Blüte glüht ein roter Kern.',
    art:{title:'FEUERLILIE',sub:'200 mm · Lilienblüte',bg1:'#7a1010',bg2:'#1a0202',ac:'#ff5a2e',ac2:'#ffd23f',gold:true}},
  nordlicht:{name:'Nordlicht · 150 Schuss Polarlicht-Verbund',short:'Nordlicht',cat:2,lvl:21,shape:'battery',dims:[0.76,0.6,0.5],grid:[3,1,1],box:2,cost:58.00,market:129.99,weight:3,hype:80,risk:10,
    desc:'Leise, hoch und langsam: Silberweiden mit grünen Spitzen, die violett werden, hängen über dem Himmel. Nur einmal bricht ein Sonnensturm los – danach wird es wieder still.',
    art:{title:'NORDLICHT',sub:'150 Schuss · Polarlicht',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#c8a2ff'}},
  blitzgewitter60:{name:'Sternblinken · 60 Schuss Strobe',short:'Sternblinken',cat:2,lvl:21,shape:'battery',dims:[0.48,0.38,0.42],grid:[4,1,1],box:3,cost:30.00,market:69.99,weight:4,hype:58,risk:9,
    desc:'Silberne Chrysanthemen, die mitten im Flug zu Blinksternen werden: Hunderte weiße Blinker, jeder in seinem eigenen Takt, fallen mit kurzem Schweif und verlöschen einer nach dem anderen.',
    art:{title:'STERNBLINKEN',sub:'60 Schuss · Strobe',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  feuerwand:{name:'Feuerwand · 5er Fächerfontäne',short:'Feuerwand',cat:2,lvl:21,shape:'fountainset',dims:[0.72,0.2,0.12],grid:[5,1,1],box:3,cost:19.00,market:44.99,weight:4,hype:52,risk:8,
    desc:'Fünf Rohre je Satz: erst senkrecht, dann als Fächer, der sich schließt und öffnet, dann gekreuzt, zum Schluss eine acht Meter hohe goldene Wand.',
    art:{title:'FEUERWAND',sub:'5 Fontänen · Fächer · 15 s',bg1:'#8a1a08',bg2:'#240502',ac:'#ff8a2a',ac2:'#ffd23f',gold:true}},
  sternkugel150:{name:'Sternkranz · Kugelbombe 150 mm Crossette-Ring',short:'Kugel 150 Kreuz',cat:2,lvl:20,shape:'shell',dims:[0.165,0.2,0.165],grid:[4,1,1],box:3,cost:31.00,market:73.99,weight:4,hype:70,risk:10,
    desc:'16 rote Kometen fliegen als Ring auseinander – dann ein Krachen, und jeder zerspringt zu einem weißen Kreuz: ein Kranz aus Sternen mit knisterndem Herz.',
    art:{title:'STERNKRANZ',sub:'150 mm · Crossette-Ring',bg1:'#7a1010',bg2:'#1a0202',ac:'#ffd23f',ac2:'#f2f5ff'}},

  /* ---------- Level 22-26: die ganz grossen ---------- */
  silbermond:{name:'Jumbo-Rakete »Mondfinsternis«',short:'Jumbo Mondfinsternis',cat:2,lvl:22,shape:'rocketset',stueck:1,dims:[0.84,0.11,0.16],grid:[2,1,1],box:3,cost:19.00,market:44.99,weight:3,hype:54,risk:10,
    desc:'Ein Vollmond aus Silberbrokat geht auf. Er verglimmt, und sein kupferroter Kern bleibt als Blutmond am Himmel, sinkt und verlischt als letzter.',
    art:{title:'MONDFINSTERNIS',sub:'Blutmond · Einzelrakete',bg1:'#26292f',bg2:'#000000',ac:'#f2f5ff',ac2:'#d1e5ff'}},
  pfeifkonzert:{name:'Pfeifkonzert · 80 Schuss Dreiklang-Heuler',short:'Pfeifkonzert',cat:2,lvl:22,shape:'fan',dims:[0.72,0.32,0.4],grid:[3,1,1],box:2,cost:36.00,market:82.99,weight:4,hype:62,risk:9,
    desc:'Ein Orchester aus Pfeifen: erst stimmt jeder für sich, dann Piccolo-Triller, lange Heuler im Duett, kreischende Wirbel – und am Ende zehn Heuler auf einen Schlag, die dreimal gemeinsam den Ton wechseln.',
    art:{title:'PFEIFKONZERT',sub:'80 Schuss · Dreiklang',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  sternenkaiser:{name:'Kaleidoskop · 250 Schuss Spiegelverbund',short:'Kaleidoskop',cat:2,lvl:23,shape:'battery',dims:[0.96,0.84,0.58],grid:[2,1,1],box:1,cost:92.00,market:199.99,weight:2,hype:96,risk:10,
    desc:'Wie ein Blick durchs Kaleidoskop: außen Rot, innen Türkis – dann tauschen die Farben die Plätze. Und alles geschieht spiegelgleich, links wie rechts, außen wie innen.',
    art:{title:'KALEIDOSKOP',sub:'250 Schuss · Spiegelverbund',bg1:'#5a0f6b',bg2:'#05020f',ac:'#5ce1ff',ac2:'#ffd23f',gold:true}},
  kometenwand:{name:'Weidenwand · 90 Schuss Dreiteiler',short:'Weidenwand',cat:2,lvl:23,shape:'fan',dims:[0.76,0.34,0.42],grid:[3,1,1],box:2,cost:42.00,market:94.99,weight:3,hype:70,risk:9,
    desc:'Drei Batterien in einer Reihe: links, Mitte, rechts im Wechselgespräch – und im Finale feuern alle drei gleichzeitig eine Wand aus goldenen Trauerweiden mit weißen Blinkern.',
    art:{title:'WEIDENWAND',sub:'90 Schuss · 3 Module',bg1:'#4a3308',bg2:'#150e02',ac:'#ffd23f',ac2:'#f2f5ff',gold:true}},
  /* Spektakel-Batterie: Geysire springen uebers Feld, darueber Saeulen aus fuenf Schuss */
  geysirfeld:{name:'Geysirfeld · 200 Schuss in 40 s',short:'Geysirfeld',cat:2,lvl:23,shape:'battery',dims:[0.82,0.5,0.52],grid:[3,1,1],box:2,cost:62.00,market:139.99,weight:3,hype:88,risk:10,
    desc:'Irgendwo im Feld brodelt es – dann schießt ein Geysir aus dem Boden, und über ihm steigt eine Säule aus fünf Schüssen immer höher. Die Ausbrüche springen quer übers Feld, bis alle fünf gleichzeitig hochgehen.',
    art:{title:'GEYSIRFELD',sub:'200 Schuss · 40 Sekunden',bg1:'#0f4a5c',bg2:'#020a10',ac:'#f2f5ff',ac2:'#5cffe8'}},
  goldkrone200:{name:'Leuchtqualle · Kugelbombe 200 mm Brokatschirm mit Fangarmen',short:'Kugel 200 Qualle',cat:2,lvl:22,shape:'shell',dims:[0.21,0.25,0.21],grid:[3,1,1],box:2,cost:46.00,market:109.99,weight:3,hype:92,risk:10,
    desc:'Wie in der Tiefsee: Eine goldene Brokatglocke öffnet sich, lange Fangarme aus Goldglitzer sinken langsam herab, und in der Glocke leuchtet ein blauer Kern.',
    art:{title:'GOLDKRONE',sub:'200 mm · Brokatqualle',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  silberkaskade:{name:'Silberausbruch · 20-m-Fontäne mit Knistermeer',short:'Silberausbruch',cat:2,lvl:24,shape:'cylinder',dims:[0.28,0.44,0.28],grid:[4,1,1],box:2,cost:28.00,market:66.99,weight:3,hype:66,risk:10,
    desc:'Zehn Sekunden edles Silber, dann ein Atemzug Stille, und die Säule bricht in ein fast dreißig Meter hohes, breites Knistermeer mit roten Sternen aus.',
    art:{title:'SILBERAUSBRUCH',sub:'20 m · Ausbruch auf 28 m · 23 s',bg1:'#8a9299',bg2:'#1a1e24',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  feuerdrache:{name:'Jumbo-Rakete »Feuerdrache«',short:'Jumbo Drache',cat:2,lvl:24,shape:'rocketset',stueck:1,dims:[0.86,0.12,0.17],grid:[2,1,1],box:2,cost:24.00,market:56.99,weight:3,hype:62,risk:10,
    desc:'Ein Feuerdrache steigt fauchend mit Flammenschweif. Oben ein Feuerball, dann breitet eine rote Palme ihre Wedel mit schweren Goldschweifen aus, und von jeder Spitze tropft Glut herab.',
    art:{title:'JUMBO',sub:'Feuerdrache · Einzelrakete',bg1:'#7a1010',bg2:'#1a0202',ac:'#ff7a1c',ac2:'#ffd23f'}},
  himmelsfaecher:{name:'Kometengitter · 180 Schuss Kreuzfächer',short:'Kometengitter',cat:2,lvl:25,shape:'fan',dims:[0.9,0.4,0.5],grid:[2,1,1],box:1,cost:78.00,market:169.99,weight:2,hype:94,risk:10,
    desc:'Titankometen aus drei Positionen kreuzen sich zu einem Netz aus Funken, an den Kreuzungen blühen Sterne auf – wie ein Gitter, das über den ganzen Himmel gespannt wird.',
    art:{title:'KOMETENGITTER',sub:'180 Schuss · Kometen',bg1:'#0a2230',bg2:'#000000',ac:'#e8f6ff',ac2:'#5ce1ff'}},
  supernova:{name:'Jumbo-Rakete »Supernova«',short:'Jumbo Supernova',cat:2,lvl:25,shape:'rocketset',stueck:1,dims:[0.9,0.13,0.18],grid:[2,1,1],box:2,cost:28.00,market:64.99,weight:3,hype:70,risk:10,
    desc:'Die größte Rakete im Laden zündet in der Luft eine zweite Stufe. Oben ein greller Titanschlag, dann die größte violette Chrysantheme mit Silberschweifen, die zu weißem Glitzer zerfällt.',
    art:{title:'SUPERNOVA',sub:'Zweistufig · Einzelrakete',bg1:'#12204a',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff4fd8'}},
  silvesternacht:{name:'Silvesternacht · 40 Teile Countdown-Sortiment',short:'Silvesternacht',cat:2,lvl:25,shape:'assort',dims:[0.56,0.22,0.4],grid:[3,1,1],box:1,cost:52.00,market:119.99,weight:3,hype:78,risk:9,
    desc:'Der Abend vor Mitternacht in einer Kiste: erst Fontänen, Römisches Licht und Raketen, dann schlägt die Glocke zwölfmal – und beim letzten Schlag geht alles gleichzeitig hoch.',
    art:{title:'SILVESTERNACHT',sub:'40 Teile · Mitternacht',bg1:'#0c3d7a',bg2:'#020a1c',ac:'#ffd23f',ac2:'#f2f5ff',gold:true}},
  kaiserkrone:{name:'Kaiserkrone · Kugelbombe 300 mm Fünfkern-Verwandlung',short:'Kaiserkrone 300',cat:2,lvl:26,shape:'shell',dims:[0.3,0.34,0.3],grid:[2,1,1],box:1,cost:74.00,market:174.99,weight:2,hype:100,risk:10,
    desc:'Die Königin der Kugelbomben: Ein Goldschweif steigt auf und streut drei Blüten. Oben fünf Kugeln ineinander in einer Goldkrone – zweimal wandern Violett und Weiß nach außen, dann erlöschen alle fünf im selben Augenblick, und die Krone hängt allein.',
    art:{title:'KAISERKRONE',sub:'300 mm · Fünfkern-Verwandlung',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  kugelfinale:{name:'Finale Grande · 5 italienische Mehrschlagbomben',short:'Finale Grande',cat:2,lvl:26,shape:'assort',dims:[0.5,0.3,0.36],grid:[3,1,1],box:1,cost:96.00,market:214.99,weight:2,hype:100,risk:10,
    desc:'Fünf italienische Zylinderbomben, jede schlägt öfter als die vorige: eins, zwei, drei, vier, fünf Brüche übereinander – in Grün, Weiß und Rot – die letzte endet mit einem Donnerschlag.',
    art:{title:'FINALE GRANDE',sub:'5 Mehrschlagbomben',bg1:'#0f4a1f',bg2:'#000000',ac:'#f2f5ff',ac2:'#ff3b2e',gold:true}},
  /* Spektakel-Batterie: ein Hochhaus aus Feuer, vier Etagen zugleich */
  wolkenkratzer:{name:'Wolkenkratzer · 240 Schuss in 36 s – vier Etagen',short:'Wolkenkratzer',cat:2,lvl:26,shape:'battery',dims:[0.92,0.82,0.58],grid:[2,1,1],box:1,cost:104.00,market:229.99,weight:2,hype:100,risk:10,
    desc:'Ein Hochhaus aus Feuer: Unten sprühen goldene Fontänen, darüber rote Feuertöpfe, in der Mitte weiße Blüten, ganz oben goldene Kronleuchter und eine rot-weiße Turmspitze – Stockwerk für Stockwerk, bis alle vier Etagen gleichzeitig brennen.',
    art:{title:'WOLKENKRATZER',sub:'240 Schuss · 4 Etagen',bg1:'#12204a',bg2:'#000000',ac:'#ffd23f',ac2:'#ff3b2e',gold:true}},
  feuerkaskade:{name:'Feuerkaskade · 3 Riesenfontänen mit Zerlegerfinale',short:'Feuerkaskade',cat:2,lvl:26,shape:'fountainset',dims:[0.8,0.24,0.16],grid:[4,1,1],box:2,cost:40.00,market:92.99,weight:3,hype:84,risk:10,
    desc:'Drei Riesenfontänen bauen einen Dreizack aus Gold und Silber. Im Finale stößt jede Düse einen Schwall knisternder Goldkometen aus.',
    art:{title:'FEUERKASKADE',sub:'3 Riesenfontänen · Zerlegerfinale',bg1:'#7a1010',bg2:'#000000',ac:'#ffd23f',ac2:'#ff7a1c',gold:true}},

  /* ---------- noch mehr Kleinkram fuer den Laden ---------- */
  kindersekt2:{name:'Kindersekt Erdbeere',short:'Kindersekt Erdb.',cat:0,lvl:14,cold:true,shape:'bottle',dims:[0.07,0.26,0.07],grid:[12,2,1],box:12,cost:1.70,market:4.19,weight:5,hype:0,risk:3,
    art:{title:'ERDBEERSPRITZ',sub:'Kindersekt · 0,75 l',bg1:'#c8325a',bg2:'#5a0a1e',ac:'#ffe45c',ac2:'#f2f5ff'}},
  wunderkerzeXXL:{name:'Riesenfunken · 1-m-Wunderkerzen 5er',short:'Riesen-Wunderk.',cat:1,lvl:6,shape:'sparkler',dims:[0.12,0.41,0.04],grid:[10,2,1],box:10,cost:2.20,market:5.49,weight:6,hype:6,risk:2,
    desc:'Ein Meter Silberregen: Grelle Funken sprühen bis zwei Meter weit, und immer wieder tropft eine glühende Perle ab und zerspritzt am Boden.',
    art:{title:'RIESENFUNKEN',sub:'5 Wunderkerzen · 1 m',bg1:'#26307a',bg2:'#0b0f2e',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  leuchtstaebe:{name:'Magic Light · 6 Bengalstäbe grün & weiß',short:'Leuchtstäbe',cat:1,lvl:5,shape:'sparkler',dims:[0.1,0.3,0.03],grid:[12,3,1],box:24,cost:1.10,market:2.79,weight:6,hype:4,risk:1,
    desc:'Sechs Zauberstäbe brennen wie Kerzen – und auf einen Schlag wechseln alle zusammen die Farbe. Dreimal. Puff!',
    art:{title:'MAGIC LIGHT',sub:'6 Farbwechsel-Leuchtstäbe',bg1:'#1b1b2e',bg2:'#070712',ac:'#ff4fd8',ac2:'#5cff9e'}},
  kinderbatterie:{name:'Pusteblume · 6 Schuss Jugendbatterie',short:'Pusteblume 6',cat:1,lvl:4,shape:'battery',dims:[0.14,0.1,0.14],grid:[12,2,1],box:16,cost:2.00,market:4.79,weight:6,hype:6,risk:2,
    desc:'Erst zwei gelbe Löwenzahnblüten, dann vier kleine Pusteblumen: Jede geht als Silberkugel auf und lässt feinen Glitzer davonrieseln wie Samen im Wind.',
    art:{title:'STERNCHEN',sub:'6 Schuss · Jugendfeuerwerk',bg1:'#2f9e57',bg2:'#0d3a20',ac:'#ffd23f',ac2:'#ff4fa3'}},
  kinderparty:{name:'Brausepulver · 12 Teile Kindersortiment',short:'Brausepulver',cat:1,lvl:6,shape:'assort',dims:[0.34,0.12,0.24],grid:[5,1,1],box:3,cost:6.40,market:14.99,weight:6,hype:8,risk:2,
    desc:'Drei kleine Sternbrunnen, zwei Tortenfontänen und sieben Kinderschüsse in Limette und Rosa, die oben knisternd zerplatzen wie Brausepulver: leise und lustig.',
    art:{title:'KINDERPARTY',sub:'12 Teile Jugendfeuerwerk',bg1:'#ff4fa3',bg2:'#6a24c9',ac:'#ffe45c',ac2:'#5ce1ff'}},
  glitzerraketen:{name:'Himmelsgarbe · 12 Schüttraketen',short:'Himmelsgarbe',cat:2,lvl:8,shape:'rocketset',dims:[0.42,0.06,0.12],grid:[4,2,2],box:8,cost:3.40,market:7.99,weight:7,hype:11,risk:4,
    desc:'Schon der Aufstieg glitzert. Oben öffnet sich ohne Knall eine Garbe aus Limette und Gold, steigt noch ein Stück und fällt mit Goldglitzer in weiten Bögen wie ein Springbrunnen am Himmel.',
    art:{title:'HIMMELSGARBE',sub:'12 Schüttraketen',bg1:'#12406b',bg2:'#04121f',ac:'#ffd23f',ac2:'#f2f5ff'}},
  heulbatterie:{name:'Tonleiter · 12 Heulschuss Batterie',short:'Tonleiter 12',cat:2,lvl:11,shape:'battery',dims:[0.24,0.2,0.24],grid:[8,2,1],box:8,cost:5.60,market:13.29,weight:6,hype:18,risk:5,
    desc:'Zwölf Heuler spielen eine Tonleiter: Jeder pfeift einen Ton höher und steigt höher, oben geht ein kleiner Sternbruch auf. Dann ein schneller Lauf abwärts und zum Schluss das tiefe Heulen der Boje mit einer Goldweide.',
    art:{title:'HEULBOJE',sub:'12 Pfeifschuss',bg1:'#0d4a2a',bg2:'#021208',ac:'#5cff9e',ac2:'#ffd23f'}},
  familienmix:{name:'Rummelplatz · 24 Teile Sortiment',short:'Rummelplatz',cat:2,lvl:17,shape:'assort',dims:[0.46,0.18,0.34],grid:[4,1,1],box:2,cost:26.00,market:59.99,weight:5,hype:46,risk:7,
    desc:'Ein Abend auf der Kirmes: kleine Brunnen sprühen Farbsterne, darüber dreht sich ein Karussell aus summenden Bienen in Zuckerwatte-Farben Rosa und Aqua – zum Schluss die Schießbude.',
    art:{title:'RUMMELPLATZ',sub:'24 Teile · Karussell',bg1:'#c8407a',bg2:'#2a0a24',ac:'#7affe8',ac2:'#fff27a'}},
  wunderbox:{name:'Funkenkranz · 50 Wunderkerzen mit Ringhalter',short:'Wunderkerzen-Box',cat:1,lvl:8,shape:'boxA',dims:[0.34,0.1,0.2],grid:[6,2,2],box:8,cost:4.40,market:10.49,weight:6,hype:5,risk:1,
    desc:'Zwölf Wunderkerzen im Kreis zünden eine nach der anderen – ein Funkenkranz läuft rund, in der Mitte flammt eine Silberkerze auf, dann erlischt alles rückwärts.',
    art:{title:'FUNKENKRANZ',sub:'50 Wunderkerzen · Ringhalter',bg1:'#26307a',bg2:'#0b0f2e',ac:'#ffd23f',ac2:'#ff6a3d'}},
  schneeballschlacht:{name:'Schneeballschlacht · 12 Schuss Kreuzwurf',short:'Schneeball 12',cat:2,lvl:10,shape:'battery',dims:[0.2,0.16,0.2],grid:[9,2,1],box:10,cost:4.80,market:11.49,weight:6,hype:15,risk:5,
    desc:'Weiße Schneebälle fliegen über Kreuz und treffen sich in der Luft – jeder Treffer zerstiebt zu weißem Glitzer, der wie Schnee herunterfällt. Am Ende ein wildes Getümmel.',
    art:{title:'SCHNEEBALLSCHLACHT',sub:'12 Schuss · Kreuzwurf',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  vulkanfeld:{name:'Popcorn · 3 Mini-Vulkane mit Knallsternen',short:'Popcorn-Vulkane',cat:2,lvl:12,shape:'fountainset',dims:[0.55,0.15,0.1],grid:[6,2,1],box:6,cost:5.40,market:12.79,weight:6,hype:18,risk:5,
    desc:'Drei Mini-Vulkane, in denen es erst vereinzelt, dann wie wild ploppt. Und der letzte Knall kommt, wenn keiner mehr damit rechnet.',
    art:{title:'POPCORN',sub:'3 Mini-Vulkane · Knallsterne',bg1:'#8a1a08',bg2:'#240502',ac:'#ff8a2a',ac2:'#ffd23f'}},
  kristallkugel100:{name:'Eiskristall · Kugelbombe 100 mm Blinkkern',short:'Kugel 100 Kristall',cat:2,lvl:16,shape:'shell',dims:[0.12,0.15,0.12],grid:[6,2,1],box:6,cost:11.00,market:25.99,weight:5,hype:34,risk:8,
    desc:'Eine türkise Kugel mit weiß blinkendem Kern – dann zerfallen ihre Sterne knisternd zu funkelndem Diamantstaub.',
    art:{title:'EISKRISTALL',sub:'100 mm · Blinkkern',bg1:'#12406b',bg2:'#04121f',ac:'#f2f5ff',ac2:'#5ce1ff'}},
  hochzeitsfaecher:{name:'Rosenherz · 36 Schuss Herzbomben',short:'Rosenherz',cat:2,lvl:20,shape:'fan',dims:[0.62,0.28,0.34],grid:[4,1,1],box:2,cost:26.00,market:59.99,weight:4,hype:50,risk:8,
    desc:'Rosenblätter schweben, dann gehen nacheinander vier rosa Herzen am Himmel auf, danach ein Rosenstrauß. Zum Schluss: zwei goldene Ringe.',
    art:{title:'ROSENHERZ',sub:'36 Schuss · Herzbomben',bg1:'#c01c6a',bg2:'#4a0626',ac:'#ffd23f',ac2:'#fff3c4'}},
  goldregen22:{name:'Goldene Zwillinge · 22 Kugeln Splitlicht',short:'Zwillinge 22',cat:2,lvl:22,shape:'battery',dims:[0.34,0.3,0.34],grid:[6,1,1],box:4,cost:14.00,market:32.99,weight:4,hype:44,risk:8,
    desc:'Jede goldene Leuchtkugel teilt sich im Gipfel mit einem Knacks in zwei, die in entgegengesetzte Richtungen davonziehen – von Schuss zu Schuss in eine andere Richtung, bis ein Stern aus Paaren entsteht.',
    art:{title:'GOLDENE ZWILLINGE',sub:'22 Kugeln · Split',bg1:'#4a3308',bg2:'#000000',ac:'#ffd23f',ac2:'#fff3c4',gold:true}},
  bengalduo:{name:'Hafenlichter · Bengalfeuer Rot & Grün 30 s',short:'Hafenlichter',cat:2,lvl:13,shape:'fountainset',dims:[0.18,0.2,0.08],grid:[7,2,1],box:8,cost:3.80,market:8.99,weight:6,hype:14,risk:4,
    desc:'Wie die Lichter an der Hafeneinfahrt: Rot und Grün leuchten im Wechsel, das Licht pendelt über den Platz, wird immer schneller – und zum Schluss brennen beide zusammen.',
    art:{title:'HAFENLICHTER',sub:'Rot & Grün im Wechsel · 30 s',bg1:'#0d4a2a',bg2:'#5a0608',ac:'#ffffff',ac2:'#ffd23f'}},
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
  partypopper:{name:'Party-Popper · 10er mit Zugband',short:'Party-Popper',cat:1,lvl:1,shape:'boxA',dims:[0.16,0.22,0.05],grid:[10,2,1],box:24,cost:0.90,market:2.19,weight:8,hype:3,risk:1,
    desc:'Am Band ziehen, plopp – ein Strahl bunter Schnipsel flattert durch die Luft und bleibt als Konfettiteppich liegen.',
    art:{title:'PARTY-POPPER',sub:'10 Stück · mit Zugband',bg1:'#ffd23f',bg2:'#f28a1c',ac:'#c01c6a',ac2:'#1557a8',light:true}},
  tortenfontaene:{name:'Eissterne · 4 Tortenfontänen',short:'Tortenfontänen',cat:1,lvl:3,shape:'boxA',dims:[0.12,0.2,0.04],grid:[12,3,1],box:24,cost:1.30,market:3.19,weight:7,hype:4,risk:1,
    desc:'Vier feine Silberfontänen für die Torte, die sich zusammen aufbauen und zusammen verlöschen. Kalte Funken, kein Rauch.',
    art:{title:'EISSTERNE',sub:'4 Tortenfontänen · 8 s',bg1:'#8a9299',bg2:'#2a2f36',ac:'#f2f5ff',ac2:'#ff4fa3'}},
  luftschlangentisch:{name:'Schlangenregen · Tischfeuerwerk Luftschlangen',short:'Tisch Schlangen',cat:1,lvl:4,shape:'cylinder',dims:[0.1,0.2,0.1],grid:[8,2,1],box:16,cost:1.40,market:3.49,weight:7,hype:5,risk:1,
    desc:'Knack – vierzehn Luftschlangen schießen hoch, rollen sich in der Luft auf und kringeln sich langsam auf den Boden.',
    art:{title:'SCHLANGENREGEN',sub:'Tischfeuerwerk · Luftschlangen',bg1:'#1557a8',bg2:'#061a3a',ac:'#ff4fa3',ac2:'#ffe45c'}},
  stroboblinker:{name:'Blitztürme · 4 Stroboskop-Töpfe',short:'Blitztürme',cat:1,lvl:5,shape:'boxA',dims:[0.12,0.16,0.06],grid:[10,2,1],box:16,cost:1.80,market:4.29,weight:6,hype:6,risk:2,
    desc:'Vier Blitztürme, jeder in seinem eigenen Takt – weiß rasend, rot gemächlich –, dann werden alle immer schneller, verschmelzen zu gleißendem Licht, und schlagartig ist Nacht.',
    art:{title:'BLITZTÜRME',sub:'4 Stroboskope',bg1:'#0f2a4a',bg2:'#02060f',ac:'#f2f5ff',ac2:'#ff4a4a'}},
  bengalflamme:{name:'Blaue Stunde · 3 Bengaltöpfchen',short:'Bengalflammen',cat:1,lvl:8,shape:'boxA',dims:[0.18,0.1,0.06],grid:[8,2,2],box:16,cost:1.60,market:3.89,weight:6,hype:5,risk:1,
    desc:'Drei Bengalflammen tauchen alles in Blau, Violett und Magenta. Die Farben wandern langsam ineinander, und die Rauchwolke darüber leuchtet von innen.',
    art:{title:'BLAUE STUNDE',sub:'3 Töpfchen · blau · violett · pink',bg1:'#2a0f5a',bg2:'#0a0318',ac:'#5ce1ff',ac2:'#ff4fd8'}},
  zauberwald:{name:'Zauberwald · 10 Schuss Irrlichter',short:'Irrlichter 10',cat:1,lvl:10,shape:'battery',dims:[0.2,0.14,0.2],grid:[11,2,1],box:12,cost:3.00,market:6.99,weight:6,hype:9,risk:2,
    desc:'Nach einem leisen Plopp tauchen Irrlichter auf: kleine grüne und goldene Fische, die zischend im Zickzack davonschwimmen.',
    art:{title:'ZAUBERWALD',sub:'10 Schuss · Irrlichter · Jugendfeuerwerk',bg1:'#1f5d2a',bg2:'#06200c',ac:'#ffd23f',ac2:'#c8ff5c'}},
  jugendbox:{name:'Tornado-Box · 30 Teile Jugendfeuerwerk',short:'Tornado-Box',cat:1,lvl:12,shape:'assort',dims:[0.4,0.14,0.28],grid:[4,1,1],box:3,cost:11.00,market:25.99,weight:5,hype:12,risk:2,
    desc:'Sechs Tornado-Wirbel fauchen kurz auf dem Karton auf und schrauben sich pfeifend in die Luft. Dazu summende Bienen, Farbwechsel in Türkis und Silber, Knister und ein Bienen-Finale.',
    art:{title:'TORNADO-BOX',sub:'30 Teile Jugendfeuerwerk',bg1:'#0f7a6b',bg2:'#03302a',ac:'#f2f5ff',ac2:'#5ce1ff'}},
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
  krach:['knallteppich','farbfontaenen','bodenfeuer','feuerberg','roemisch','bengalfackel','glitzerregen12','miniverbund','glitzerraketen','wunderbox','bengalflamme'],
  partynacht:['bier','cola','kinderpunsch','energy','orangensaft','wasser','karaoke','discokugel','eiswuerfel','radler','bierfrei','limonade','kurze'],
  himmel:['nachtfalter','goldstaubboeller','kometenraketen','farbenrausch','lichterkugeln','vulkanfeld','glueckssymbole','glueckskekse','gluecksklee'],
  genuss:['raclettekaese','raclettezubehoer','fonduesossen','kaeseplatte','lachs','cracker','kaesefondue','fondueoel','luxusfondue','schokofondue'],
  verbund:['farbrauchboeller','feuerrad','knisterfaecher','palmenkugel75','sternenmeer42','dreiklang','smaragd','farbenmeer75'],
  import:['regenbogenfaecher','goldweide100','silberregen','glitzerkaskade','familienmix'],
  grossfeuer:['feuerpfau','goldvulkan','nordlicht','blitzgewitter60','feuerwand','sternkugel150','hochzeitsfaecher'],
  profi:['silbermond','pfeifkonzert','sternenkaiser','kometenwand','goldkrone200','silberkaskade','feuerdrache','goldregen22']
};
const NEU_LIZENZEN=[
  {id:'jugend',lvl:2,cost:60,name:'Jugendfeuerwerk',
   desc:'Feuerwerk, das auch Kinder zünden dürfen: Knallbonbons, Tischbomben, Bengalische Hölzer, Zahlen-Wunderkerzen, das Perlenquartett, der Zweihorn-Feuerteufel und die Pusteblume-Jugendbatterie.',
   items:['knallbonbon','tischbombe','bengalholz','wunderzahl','pharao','leuchtfontaene','feuerteufel','kinderbatterie','kinderparty','wunderkerzeXXL','tortenfontaene','luftschlangentisch','stroboblinker']},
  {id:'snacks',lvl:7,cost:260,name:'Snacks & Süßes',
   desc:'Popcorn, Salzgebäck, Erdnüsse, Fruchtgummi, Berliner-Nachschub und die Glücksbringer zum Naschen: Marzipanschweinchen und Schoko-Glückstaler.',
   items:['popcorn','salzstangen','erdnuesse','gummibaerchen','marzipanschwein','schokotaler']},
  {id:'buffet',lvl:8,cost:700,name:'Silvester-Buffet',
   desc:'Heringssalat, Kartoffel- und Nudelsalat, gefüllte Eier, Würstchen, Mini-Frikadellen, Fingerfood, Baguette, Mett-Igel, Partypizza, Dips, die Mitternachts-Gulaschsuppe und das Katerfrühstück. Vieles davon gehört in den Kühlschrank.',
   items:['heringssalat','kartoffelsalat','wuerstchen','frikadellen','baguette','mettigel','partypizza','dips','rollmops','gefuellteeier','nudelsalat','gulaschsuppe','fingerfood']},
  {id:'kleinfeuer',lvl:10,cost:1800,name:'Kleinfeuerwerk',
   desc:'Die ersten richtigen Batterien für den kleinen Geldbeutel: die Schneeballschlacht, die Glutpalmen und der erste Fächer.',
   items:['sternstaub20','schneeballschlacht','feuerperlen','pfauenrad','silberpfeil','zauberbrunnen','zauberwald','jugendbox']},
  {id:'feuerzauber',lvl:13,cost:4200,name:'Feuerzauber',
   desc:'Palmenhain mit 25 Schuss und die Spätzünder-Knisterraketen.',
   items:['goldpalmen','mondschein','funkenturm','knisterstern','bengalduo']},
  {id:'getraenke',lvl:14,cost:5000,name:'Feine Getränke',
   desc:'Champagner, Rot- und Weißwein, Eierlikör, Sahnelikör, Hugo-Set, Gin & Tonic, Whisky, das Cocktail-Set, Kindersekt Erdbeere, die Magnumflasche, Goldsekt, Jahrgangs-Champagner, der Sektturm und Kaviar für den großen Moment.',
   items:['champagner','cocktailset','rotwein','weisswein','eierlikoer','likoer','kindersekt2','magnum','kaviar','champagnerturm','goldsekt','jahrgang','hugo','gintonic','whisky']},
  {id:'nachthimmel',lvl:16,cost:9000,name:'Nachthimmel',
   desc:'Die tanzende Wasserorgel und die Fächerstern-Raketen.',
   items:['sternenmeer80','silberwirbel','kristallkugel100','blinkstern','wasserspiel']},
  {id:'goldklasse',lvl:18,cost:15000,name:'Goldklasse',
   desc:'Glasbruch-Raketen, die Goldader und die 150-mm-Kugeln Crossettennetz, Tigerkrone und Farbcrossette.',
   items:['kreuzfeuer','kristall','sternenstaub150']},
  {id:'sternklasse',lvl:19,cost:18000,name:'Sternklasse',
   desc:'Die Jumbo-Rakete »Saphirkrone«, die Wendeltreppe, die sich zwölf Meter hochschraubt, und die Crossettenkrone.',
   items:['regenbogenkrone','eisblume','donnerschlag']},
  {id:'festtafel',lvl:15,cost:6500,name:'Festtafel',
   desc:'Silvesterkarpfen, Tiramisu, die Neujahrstorte und die Sushi-Platte. Alles gehört in den Kühlschrank.',
   items:['karpfen','tiramisu','neujahrstorte','sushi']},
  {id:'feinkost',lvl:21,cost:12000,name:'Feinkost',
   desc:'Frische Austern und gekochter Hummer für das große Silvesterdinner. Nur aus dem Kühlschrank.',
   items:['austern','hummer']},
  {id:'meister',lvl:25,cost:34000,name:'Meisterklasse',
   desc:'Das Ende der Leiter: die Legion mit 240 Kerzen, die Jumbo-Rakete »Supernova«, die 300-mm-Kaiserkrone und das Finale Grande.',
   items:['himmelsfaecher','supernova','silvesternacht','kaiserkrone','kugelfinale','wolkenkratzer','feuerkaskade']}
];
/* Warengruppen fuer Herausforderungen und Restposten */
const NEU_GRUPPE={
  boeller:['blitzknaller','knallteppich','goldstaubboeller','farbrauchboeller'],
  raketen:['glueckrakete','glitzerraketen','silberpfeil','kometenraketen','farbenrausch','knisterstern','smaragd','blinkstern','silberregen','kristall','regenbogenkrone','silbermond','feuerdrache','supernova'],
  batterien:['zauberwald','jugendbox','kinderbatterie','miniverbund','glitzerregen12','sternstaub20','schneeballschlacht','heulbatterie','pfauenrad','nachtfalter','goldpalmen','mondschein','knisterfaecher','sternenmeer42','sternenmeer80','silberwirbel','regenbogenfaecher','hagelsturm','kreuzfeuer','goldenerregen','donnerschlag','feuerpfau','hochzeitsfaecher','nordlicht','blitzgewitter60','pfeifkonzert','sternenkaiser','kometenwand','himmelsfaecher','kinderparty','familienmix','silvesternacht','kugelfinale'],
  kugeln:['palmenkugel75','farbenmeer75','kristallkugel100','goldweide100','sternenstaub150','sternkugel150','goldkrone200','kaiserkrone'],
  boden:['partypopper','tortenfontaene','luftschlangentisch','stroboblinker','bengalflamme','knallbonbon','tischbombe','pharao','wunderfarbe','bengalholz','wunderherz','wunderzahl','leuchtfontaene','feuerteufel','leuchtstaebe','wunderkerzeXXL','wunderbox','bodenkreisel','farbfontaenen','bodenfeuer','bengalfackel','zauberbrunnen','feuerberg','vulkanfeld','funkenturm','bengalduo','feuerperlen','feuerrad','dreiklang','wasserspiel','glitzerkaskade','lichterkugeln','eisblume','goldvulkan','feuerwand','silberkaskade','goldregen22','feuerkaskade'],
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
/* 30.09.: Mix-Batterien mit Roemischen Lichtern */
/* 30.09.: Kerzen-Batterien und neue Kugeln - in die Lizenzpakete ihres
   Levels und in die Warengruppen */
NEU_GRUPPE.batterien.push('legion','lichterprozession','kometenreigen','sternentor','glutschmiede');
NEU_GRUPPE.kugeln.push('kanonade300','feuerlilie200');
NEU_LIZ_DAZU.import.push('lichterprozession');
NEU_LIZ_DAZU.grossfeuer.push('kometenreigen','glutschmiede'); NEU_LIZ_DAZU.profi.push('sternentor','feuerlilie200','kanonade300');
NEU_LIZENZEN.find(l=>l.id==='meister').items.push('legion');
/* 01.10. (Tom): 20 neue Raketen (14n) - erst in der Teststation.
   02.10. (Tom, Kugeln): Crossettennetz, Tigerkrone, Weidenkoenig und
   Sternensturm ins Sortiment, die anderen 16 Muster-Kugeln sind raus;
   dazu zehn neue, richtig intensive Kugeln (14p) zum Testen. */
const KUGEL_MASS={75:[0.09,0.115,0.09],100:[0.12,0.15,0.12],150:[0.165,0.2,0.165],200:[0.21,0.25,0.21],300:[0.3,0.34,0.3]};
const KUGEL_GRID={75:[8,2,1],100:[6,2,1],150:[4,1,1],200:[3,1,1],300:[2,1,1]};
const KUGEL_PREIS={75:[6,14.99],100:[12,28.99],150:[30,69.99],200:[44,104.99],300:[70,164.99]};
const KUGEL_LVL={75:14,100:16,150:18,200:21,300:24};
/* ins Sortiment: wie die anderen Kugeln, Lizenz nach Level */
[['crossettennetz150','Crossettennetz',150,'Zwölf Crossetten zerspringen zu einem Netz aus goldenen und grünen Kometen.'],
 ['tigerkrone150','Tigerkrone',150,'Tigerkometen mit breiten, glitzernden Goldbändern, die lange am Himmel stehen.'],
 ['weidenkoenig200','Weidenkönig',200,'Eine riesige Goldweide mit roten Spitzen, die langsam herabsinkt.'],
 ['sternensturm300','Sternensturm',300,'Crossetten, ein Regen aus Blinksternen und zum Schluss ein lauter Schlussschlag.']].forEach(([id,nm,mm,desc],k)=>{
  NEUWARE[id]={name:nm+' · Kugelbombe '+mm+' mm',short:'Kugel '+mm+' '+nm,cat:2,lvl:KUGEL_LVL[mm],shape:'shell',dims:KUGEL_MASS[mm],grid:KUGEL_GRID[mm],box:2,
    cost:KUGEL_PREIS[mm][0],market:KUGEL_PREIS[mm][1],weight:3,hype:70+k*8,risk:10,desc,art:{title:nm.toUpperCase(),sub:'Kugelbombe '+mm+' mm',bg1:'#2a1c40',bg2:'#07040f',ac:'#ffd23f',ac2:'#ff8ac8'}}; });
NEU_GRUPPE.kugeln.push('crossettennetz150','tigerkrone150','weidenkoenig200','sternensturm300');
/* 03.10. abends (Tom: "Goldbrokat sieht eher wie eine Kugelbombe aus -
   zu einer Kugelbombe umwandeln"): das Brokat-Bruchbild der Rakete als
   100-mm-Kugel (KUGEL in 14r) */
NEUWARE.goldbrokat100={name:'Goldbrokat · Kugelbombe 100 mm',short:'Kugel 100 Goldbrokat',cat:2,lvl:15,shape:'shell',dims:KUGEL_MASS[100],grid:KUGEL_GRID[100],box:6,
  cost:11.50,market:26.99,weight:3,hype:60,risk:9,desc:'Flimmernder Brokat-Aufstieg, oben eine schwere Brokatkugel mit violetten Spitzen, aus der Goldglitzer nachrieselt.',
  art:{title:'GOLDBROKAT',sub:'Kugelbombe 100 mm',bg1:'#4a3308',bg2:'#0f0802',ac:'#ffd23f',ac2:'#c85cff',gold:true}};
NEU_GRUPPE.kugeln.push('goldbrokat100'); NEU_LIZ_DAZU.verbund.push('goldbrokat100');
NEU_LIZENZEN.find(l=>l.id==='goldklasse').items.push('crossettennetz150','tigerkrone150');
NEU_LIZ_DAZU.grossfeuer.push('weidenkoenig200'); NEU_LIZ_DAZU.profi.push('sternensturm300');
/* 03.10. (Tom): Kronenkranz und Zwillingssonne ins Sortiment, die
   anderen acht Muster-Kugeln sind raus; dazu fuenf neue aus dem, was
   gefallen hat (14p) - alle direkt ins Sortiment */
[['farbcrossette150','Farbcrossette',150,'Ein Ring Crossetten zum Zuschauer – jeder Arm wechselt im Flug von Rot zu Türkis, innen eine zweite Welle in den getauschten Farben.'],
 ['kronenkranz200','Kronenkranz',200,'Zwei Goldkometen steigen mit, oben ein Kranz aus Goldkometen, an jedem Ende hängt eine glitzernde Krone.'],
 ['zwillingssonne200','Zwillingssonne',200,'Zwei Sonnen nebeneinander – goldene Tigerkometen und farbige Sternspritzer –, dann fliegen Kometen über Kreuz.'],
 ['blitzpalme200','Blitzpalme',200,'Dunkler Aufstieg, dann sinken zehn schwere Goldwedel wie eine Palme, an ihren Enden zerstieben Blitze.'],
 ['goldweidenkreuz200','Goldweidenkreuz',200,'Acht Crossetten im Kranz, jede teilt sich in vier Goldweiden, die lange herabsinken.'],
 ['kronenregen300','Kronenregen',300,'Eine große Krone aus violetten und rosa Sternen hängt am Himmel – dann rieselt aus ihr ein langer goldener Regen.'],
 ['dreifachkrone300','Dreifachkrone',300,'Drei Kronen nebeneinander wie ein Tor: links Rot, in der Mitte höher Gold, rechts Blau.'],
 ['crossettenweide300','Crossettenweide',300,'Aus Crossettenstern, Weidenregen und Fächerstern die extremste Kugel: zwei Goldkometen steigen mit, oben zerspringen sechzehn Crossetten, wechseln die Farbe und sinken als Goldweide – darunter öffnet sich ein Kometenfächer.']].forEach(([id,nm,mm,desc],k)=>{
  NEUWARE[id]={name:nm+' · Kugelbombe '+mm+' mm',short:'Kugel '+mm+' '+nm,cat:2,lvl:id==='crossettenweide300'?25:KUGEL_LVL[mm],shape:'shell',dims:KUGEL_MASS[mm],grid:KUGEL_GRID[mm],box:{75:8,100:6,150:3,200:2,300:1}[mm],
    cost:KUGEL_PREIS[mm][0],market:KUGEL_PREIS[mm][1],weight:3,hype:72+k*4,risk:9,desc,art:{title:nm.toUpperCase(),sub:'Kugelbombe '+mm+' mm',bg1:'#2a1440',bg2:'#07040f',ac:'#ffd23f',ac2:'#ff8ac8'}}; });
NEU_GRUPPE.kugeln.push('farbcrossette150','kronenkranz200','zwillingssonne200','blitzpalme200','goldweidenkreuz200','kronenregen300','dreifachkrone300','crossettenweide300');
NEU_LIZENZEN.find(l=>l.id==='goldklasse').items.push('farbcrossette150');
NEU_LIZ_DAZU.grossfeuer.push('kronenkranz200','zwillingssonne200','blitzpalme200','goldweidenkreuz200');
/* Crossettenweide gehoert zur Meister-Lizenz (ab Level 25) - deshalb Level 25 statt 24 */
NEU_LIZ_DAZU.profi.push('kronenregen300','dreifachkrone300'); NEU_LIZENZEN.find(l=>l.id==='meister').items.push('crossettenweide300');
/* 03.10. (Tom, Raketen-Vorfuehrung): Crossettenstern, Weidenregen und
   Faecherstern ins Sortiment, die anderen 17 sind raus. Dazu zwei dicke
   Raketen im selben Stil, nur groesser (Crossettenkrone, Faecherweide) -
   die Kugel daraus steht in 14p (Crossettenweide 300). */
[['crossettenstern','Crossettenstern','6 Raketen',13,[0.44,0.08,0.21],[4,2,2],8,7.2,'himmel','Sechs Crossetten zerspringen oben zu vierundzwanzig roten Kometen – mit leisem Knacken statt Knall.','#3a1206','#0c0402','#ffd23f','#ff5a3a'],
 ['weidenregen','Weidenregen','6 Raketen',14,[0.44,0.08,0.21],[4,2,2],8,7.8,'verbund','Eine goldene Trauerweide, die lange am Himmel hängt und langsam herabsinkt.','#3a2a06','#0a0602','#ffb84a','#fff3c4'],
 ['faecherstern','Fächerstern','6 Raketen',16,[0.44,0.09,0.21],[4,2,2],8,8.6,'nachthimmel','Dreizehn Kometen öffnen sich als Fächer nach oben, abwechselnd Gold und Grün.','#0a2a14','#020a04','#5cff9e','#ffd23f'],
 ['crossettenkrone','Crossettenkrone','4 Jumbo-Raketen',20,[0.89,0.13,0.21],[1,2,2],4,16.5,'sternklasse','Die dicke Schwester des Crossettensterns: zehn große Crossetten, jeder Arm wechselt im Flug von Rot zu Gold – eine Krone aus vierzig Kometen.','#4a0a0a','#120202','#ffd23f','#ff3a3a'],
 ['faecherweide','Fächerweide','4 Jumbo-Raketen',23,[0.89,0.14,0.21],[1,2,2],4,21.0,'profi','Fächer und Weide in einer Rakete: fünfzehn dicke Kometen öffnen sich als Fächer und sinken dann als goldene Weide.','#2a2006','#080602','#ffd23f','#9fffb0']
].forEach(([id,nm,sub,lvl,dims,grid,box,cost,liz,desc,bg1,bg2,ac,ac2],k)=>{
  NEUWARE[id]={name:nm+' · '+sub,short:nm,cat:2,lvl,shape:'rocketset',dims,grid,box,cost,market:Math.round(cost*2.3)-0.01,weight:6,hype:30+lvl*2,risk:6,desc,
    art:{title:nm.toUpperCase(),sub,bg1,bg2,ac,ac2}};
  NEU_GRUPPE.raketen.push(id);
  const L=NEU_LIZENZEN.find(l=>l.id===liz); if(L) L.items.push(id); else NEU_LIZ_DAZU[liz].push(id); });
/* Lichter-Batterien (14m). 03.10. (Tom): Goldader und Weidenhain
   kommen ins Sortiment, die anderen sechs sind raus. Neu, direkt ins
   Sortiment: zwei Blitzweiden-Batterien, eine Blitzpalmen-Batterie und
   Fontaenen-Batterien in drei Stufen - Kinder, mittel, High-End ("nicht
   alles immer so peng, peng, peng, sondern auch einfach nur schoen").
   Je: id, Name, Untertitel, Level, Masse, Farben, Text, Verkabelung, Lizenz */
const LB_SORTIMENT=[
 ['lb_regenbogenbrunnen','Regenbogenkometen','10 kleine Kometenfächer',5,[0.5,0.2,0.3],'#3a1a6a','#0a0614','#ffd23f','#5ce1ff','Sieben kleine Kometenfächer, jeder in einer Regenbogenfarbe – Rot, Orange, Gelb, Grün, Türkis, Blau, Violett –, einer nach dem anderen von links nach rechts; zum Schluss drei zugleich. Kein Knall, nur Farbe.','reihe','jugend'],
 ['lb_glitzergarten','Glitzergarten','17 Schuss Glitzer',7,[0.5,0.22,0.32],'#5a1a4a','#12040e','#ffb8e0','#a8fff0','Glitzerkometen mit Farbspitzen, darüber leise Blütenglitzer und Blütenkränze in Pastell – eine Batterie für Kinder, die schön ist statt laut.','spirale','jugend'],
 /* 03.10. abends (Tom: "24 Schuss stimmt nicht"): gezaehlt - 24 Rohre, davon acht Kometenfaecher mit zusammen gut 220 Kometen (mess.js) */
 ['lb_fontaenenballett','Kometenballett','24 Rohre · über 200 Kometen',13,[0.8,0.28,0.5],'#1a3a6a','#040a14','#5ce1ff','#ff6a8a','24 Rohre, davon acht Kometenfächer mit zusammen über 200 Kometen: Farbkometen steigen paarweise im V links, rechts und in der Mitte; über jedem Fächer öffnet sich eine Farbkrone, dazwischen Farbcrossetten. Finale: drei Kometenfächer zugleich.','wechsel','feuerzauber'],
 ['lb_goldregen','Goldregen','22 Schuss Gold',15,[0.8,0.28,0.5],'#5a3a06','#140a02','#ffd23f','#fff3c4','Ein Goldregen-Kometenfächer eröffnet, dann Goldfächer über zwei Glitzersäulen, Kometenkronen, Weidencrossetten und Goldwasserfälle – zum Schluss drei Doppelkronen. Ganz in Gold, aber jeder Abschnitt anders.','mitte','verbund'],
 ['lb_blitzweiden','Blitzweiden','20 Schuss Blitzweiden',17,[0.85,0.3,0.55],'#1a1a2a','#040408','#f2f5ff','#ff6ad8','Zwei Blitzkometen-Fächer eröffnen, dann dunkle Aufstiege und oben Blitzweiden in Gold und in Farbe, Blitzkronen – zum Schluss fünf Weiden zugleich.','zufall','import'],
 ['lb_goldader','Goldader','86 Schuss Goldkometen',18,[0.9,0.3,0.6],'#5a3a06','#140a02','#ffd23f','#fff3c4','Goldkometen kreuz und quer – mal links, mal rechts –, Glitzerminen, Weidenkometen und zwei Goldregen-Kometenfächer; ein Finale aus sechzehn Goldkometen über einem großen Goldkometenfächer.','wechsel','goldklasse'],
 ['lb_silbergewitter','Silbergewitter','28 Schuss Silberweiden',20,[0.9,0.3,0.6],'#1a2a3a','#04080c','#c8e4ff','#7a5cff','Silberkometen kreuz und quer mit knisterndem Schweif, dann silberne Blitzweiden, in denen farbige Blitze zucken, Blitzblüten und Farbweiden – das Finale drei Silberweiden in der Mitte.','diagonal','grossfeuer'],
 ['lb_blitzpalmen','Blitzpalmen','25 Schuss Blitzpalmen',22,[0.9,0.3,0.6],'#3a2a06','#0a0602','#ffd23f','#ffffff','Zwei Goldregen-Kometenfächer eröffnen, dann jede Palme anders: Blitzpalme, Farbpalme, Königspalme mit Silberkrone, Palmenweide, Stufenpalme – Finale aus fünf Doppelpalmen.','mitte','profi'],
 ['lb_fontaenenpalast','Kometenpalast','41 Schuss Kometen & Kronen',24,[1.0,0.32,0.62],'#2a0a4a','#08020f','#ffd23f','#ff5ac8','Schwenkende Titan-Kometen mit Farbkopf außen, ein Kometentor mit Dreifachtor, Weidencrossetten, glühende Kometenfächer – Finale: sechs Kometenfächer zugleich, darüber Farbkronen und ein Weidenvorhang.','spalte','profi'],
 ['lb_weidenhain','Weidenhain','56 Schuss Weiden',24,[0.95,0.32,0.6],'#3a2a06','#0a0602','#ffb84a','#fff3c4','Weidenfächer, farbige Weiden, Weidencrossetten und ein Weidenfall, schräg durch die Batterie gezündet – das Finale ein Vorhang, der lange am Himmel hängt.','diagonal','profi'],
 ['lb_farbenpracht','Farbenpracht','37 Schuss Farbe',26,[1.0,0.32,0.62],'#4a0a3a','#0f020c','#ff5a5a','#5cff9e','Jede Farbe einmal als Kometenfächer mit ihrer Farbcrossette, ein Dreifachtor in der Mitte, Weidencrossetten außen, Farbkronen – Finale: sieben Kometenfächer und ein Kranz aus Weidencrossetten.','spirale','meister'],
 /* 03.10. abends (Tom: "Goldader in anderen Farben, leichtere Geschosse
    mit kleinem Sound, auch Sachen, die komplett anders aussehen; farbige
    Faecherkometen - eine gruene, eine blaue, Gold mit Farbe"): zwanzig
    neue Lichter-Batterien von Level 3 bis 26 (Lichter in 14q) */
 ['lb_gluehwuermchen','Glühwürmchen','12 Schuss Kinderkometen',3,[0.5,0.2,0.3],'#1a3a10','#050c03','#c8ff5a','#ffe08a','Kleine grüne und gelbe Kometen mit feinem Glitzer; ganz oben zerstiebt jeder leise in eine Handvoll Funken. Erst einzeln, dann im V, zum Schluss vier zugleich.','wechsel','jugend'],
 ['lb_sternschnuppen','Sternschnuppen','14 Schuss Fallkometen',5,[0.5,0.2,0.3],'#0c1a3a','#02050f','#e8f0ff','#8ab8ff','Silberne Kometen fliegen schräg hinauf, ziehen oben einen Bogen und fallen mit langem Schweif wie Sternschnuppen – dazwischen zwei Glitzersäulen.','zufall','klassiker'],
 ['lb_kirschbluete','Kirschblüte','15 Schuss Blütenkränze',6,[0.5,0.2,0.3],'#4a1030','#12030c','#ffb8d8','#fff0f4','Rosa Blütenkränze mit hellem Glitzerschweif, deren Spitzen oben weiß werden, und Lilienkometen, die sich wie Blütenblätter öffnen – leise und zart.','spirale','klassiker'],
 ['lb_jadeader','Jadeader','20 Schuss grüne Kometen',8,[0.5,0.22,0.32],'#0a3a1a','#020c05','#5cff8a','#ffd23f','Die Goldader in Grün: hängende Jadeweiden, knisternde Zackenkometen im Zickzack und zwei grüne Glitzersäulen – das Finale eine Welle aus acht Kometen.','diagonal','krach'],
 ['lb_eisvogel','Eisvogel','22 Schuss Zweigkometen',9,[0.5,0.22,0.32],'#063a4a','#010c10','#5ce1ff','#3a6aff','Türkise Kometen, die sich zweimal teilen wie ein Zweig, blaue Sternschnuppen über Kreuz und Glitzersäulen in Himmelblau.','mitte','krach'],
 ['lb_glutpalmen','Glutpalmen','20 Schuss Glutpalmen',10,[0.8,0.28,0.5],'#4a1a06','#100402','#ff8a2a','#ffd23f','Dunkler Aufstieg, dann glühende Palmen, deren Wedel im Fallen zu dunklem Rot abkühlen; dazwischen knisternde Crossetten und orange Weiden.','reihe','kleinfeuer'],
 ['lb_saphirfaecher','Ozean','16 Schuss Wellen & Gischt',11,[0.8,0.28,0.5],'#0a1a5a','#02040f','#5c8dff','#c8e4ff','Blau, Türkis und Silber: Kometenfächer schwingen wie Wellen hin und her, ganz oben zerplatzt die Gischt in kleinen weißen und blauen Explosionen; dazwischen Zackenkometen und Wechselblüten, die wie Schaumkronen die Farbe tauschen.','spalte','himmel'],
 ['lb_smaragdfaecher','Smaragdfächer','18 Schuss grüne Kometenfächer',13,[0.8,0.28,0.5],'#0a4a1a','#020f05','#5cff8a','#d8ffb0','Grüne Kometenfächer auf Schlag, ganz weit oben zerstieben grüne Mini-Explosionen – dazu Drillingskometen im V – außen grün, in der Mitte Gold – und Glühwürmchen.','mitte','feuerzauber'],
 ['lb_rubinpalmen','Rubinpalmen','22 Schuss rote Palmen',14,[0.8,0.28,0.5],'#5a0a10','#120203','#ff4a4a','#ffd23f','Rote Palmen mit rot-goldenen Wedeln, deren Enden in kleinen Explosionen zerstieben, knisternde Crossetten und ein roter Kometenfächer in Stufen.','wechsel','verbund'],
 ['lb_polarweiden','Polarnacht','20 Schuss Farbweiden',15,[0.85,0.3,0.55],'#063a3a','#010c0c','#5cffe8','#c85cff','Türkise Weiden, deren Fäden im Sinken violett werden, mit weißen Blitzen darin; Sternschnuppen im Wischer und Farbschirme in Aqua.','zufall','verbund'],
 ['lb_lilienfeld','Lilienfeld','24 Schuss Lilien & Helix',16,[0.85,0.3,0.55],'#4a0a3a','#0f020c','#ff7ad8','#ffd23f','Lilienkometen öffnen sich wie Blüten, zwei Farbköpfe umkreisen einander als Helix, rosa Blütenkränze – über einem breiten Blütenfächer.','spirale','nachthimmel'],
 ['lb_goldsaphir','Goldsaphir','26 Schuss Gold & Blau',17,[0.9,0.3,0.6],'#0a1a4a','#02040f','#ffd23f','#5c8dff','Gold mit Blau: Kometenfächer von außen nach innen, Kronenkometen, die von Blau zu Gold wechseln, Zackenkometen in der Welle und blaue Weiden.','mitte','import'],
 ['lb_amethystregen','Amethystregen','28 Schuss Violett & Silber',18,[0.9,0.3,0.6],'#2a0a4a','#08020f','#c85cff','#e8ecff','Violette Glitzerschirme hängen wie Weiden, Kaskaden springen über Kreuz, Polarweiden in Indigo und silberne Kometenfächer – das Finale neun Schirme.','diagonal','goldklasse'],
 ['lb_doppelhelix','Doppelhelix','30 Schuss Helixkometen',19,[0.9,0.3,0.6],'#1a2a4a','#04060f','#ffd23f','#5ce1ff','Je zwei Farbköpfe winden sich umeinander nach oben und trennen sich in zwei kleinen Explosionen – einzeln, als Spirale, zum Schluss paarweise; dazwischen Zweigkometen.','spirale','sternklasse'],
 ['lb_farbtiger','Farbtiger','30 Schuss Tigerkometen',20,[0.9,0.3,0.6],'#0a3a2a','#020c08','#5cff9e','#ff5ac8','Dunkler Aufstieg, dann schwere Tigerkometen in Grün, Blau und Magenta mit breitem Glitzerband, knisternde Crossetten und Farbweiden.','zufall','grossfeuer'],
 ['lb_kronenfeuer','Kronenfeuer','32 Schuss Kronen',21,[0.95,0.32,0.6],'#4a0a0a','#120202','#ffd23f','#ff4a4a','Kronenkometen wie die Crossettenkrone: sechs Arme wechseln die Farbe, an jedem Ende hängt eine Glitzerkrone – in Rot, Blau, Grün und Violett mit Gold.','wechsel','grossfeuer'],
 ['lb_jadekoenig','Urwald','34 Schuss Palmen & Lianen',22,[0.95,0.32,0.6],'#0a3a1a','#020c05','#ffd23f','#5cff8a','Grün in allen Tönen: Blütenkreuze, lang hängende Lianen-Weiden, knisternde Zackenkometen wie schwirrende Insekten und grüne Glitzersäulen; Finale: zehn Urwaldpalmen im W.','reihe','profi'],
 ['lb_paradiesvogel','Paradiesvogel','36 Schuss bunt gemischt',23,[0.95,0.32,0.6],'#3a0a4a','#0a020f','#ff5ac8','#9cff3a','Bunt gemischt: Vierfarbblüten, Farbpalmen im Kreis, Helixkometen und bunte Kometenfächer – das Finale elf Tigerkometen in allen Farben.','spirale','profi'],
 ['lb_sternenfeuer','Sternenhimmel','40 Schuss Silber & Blau',24,[1.0,0.32,0.62],'#0a1a3a','#02040c','#e8f0ff','#7a5cff','Silber, Blau und Violett: Polarweiden, Sternschnuppen im Wischer, silberne Blitzweiden und Zweigkometen über Kreuz – das Finale vierzehn Weiden von außen nach innen.','diagonal','profi'],
 ['lb_himmelsfeuer','Himmelsfeuer','48 Schuss Meisterwerk',26,[1.0,0.32,0.62],'#1a0a3a','#05020c','#ffd23f','#ff5ac8','Das Meisterwerk der Lichter: Gold-Saphir-Fächer, Kronenkometen, Farbpalmen, Schirme, Lilien, Tigerkometen, bunte Fächer und ein Finale aus sechzehn Polarweiden im Kreis.','spirale','meister']
];
LB_SORTIMENT.forEach(([id,nm,sub,lvl,dims,bg1,bg2,ac,ac2,desc,zuendung,liz])=>{
  NEUWARE[id]={name:nm+' · '+sub,short:nm,cat:2,lvl,shape:'battery',dims,grid:lvl<10?[4,1,1]:[2,1,1],box:lvl<10?4:1,cost:Math.round(lvl*2.6),market:Math.round(lvl*2.6*2.3)-0.01,weight:lvl<10?6:3,hype:40+lvl*2,risk:lvl<10?3:8,desc,
    art:{title:nm.toUpperCase(),sub,bg1,bg2,ac,ac2},zuendung};
  NEU_GRUPPE.batterien.push(id);
  const L=NEU_LIZENZEN.find(l=>l.id===liz); if(L) L.items.push(id); else NEU_LIZ_DAZU[liz].push(id); });
/* 02.10. (Tom): "Kreuzfeuer kannst du mit ins Sortiment nehmen" - als
   Grosses Kreuzfeuer (das kleine Kreuzfeuer mit 42 Schuss gibt es schon),
   im Paket Grosskaliber (L20) */
NEUWARE.kreuzfeuer90={name:'Großes Kreuzfeuer · 90 Schuss Crossetten',short:'Großes Kreuzfeuer',cat:2,lvl:21,shape:'battery',dims:[0.95,0.3,0.62],grid:[2,1,1],box:1,cost:55,market:125.99,weight:4,hype:88,risk:9,
  desc:'Crossetten teilen sich im Kreuz, farbige Crossetten und Zwillingskometen, zum Schluss Dreifach-Crossetten – neunzig Schuss ohne großen Knall.',
  art:{title:'GROSSES KREUZFEUER',sub:'90 Schuss Crossetten',bg1:'#5a0e0a',bg2:'#140202',ac:'#ffd23f',ac2:'#ff4a3a'}};
NEU_LIZ_DAZU.grossfeuer.push('kreuzfeuer90'); NEU_GRUPPE.batterien.push('kreuzfeuer90');
/* Listen fuer Tests und die Raketen-Vorfuehrung im Laden-Reiter (17-laptop);
   Batterien und Kugeln sind seit 03.10. im Sortiment (Vorfuehrung raus) */
const NEU_LB=LB_SORTIMENT.map(x=>x[0]).concat(['kreuzfeuer90']);
const NEU_TEST={batterien:NEU_LB,
  kugeln:['farbcrossette150','kronenkranz200','zwillingssonne200','blitzpalme200','goldweidenkreuz200','kronenregen300','dreifachkrone300','crossettenweide300'],
  raketen:['crossettenstern','weidenregen','faecherstern','crossettenkrone','faecherweide']};
/* Fontaenen-Sets (Feuerquelle, Gummibaerchen, Farbenspiel, Farbmischer,
   Wasserorgel, Feuerwand, Feuerkaskade, Popcorn) sind so breit wie ihre
   Duesenreihe - vorher 18-44 cm Karton, die Duesen standen aber bis
   50 cm vom Mittelpunkt, also neben dem Karton (28.09., Tom: "wenn der
   Effekt zu gross ist, dann die Produktgroesse aendern"). Hoechstens
   1 m, so breit wie ein Tischplatz. */
/* 01.10. abends (Tom: "Batterie-Varianten anlegen, jede mit eigener
   Verpackung, Roehrenzahl, Preis und Effekt"): vier Batterien nach dem
   Rohr-Raster - die Rohre stehen genau so (raster), wie es draufsteht.
   Drehbuecher und Effekte in 14o-rohrbatterien.js. */
Object.assign(NEUWARE,{
  rb25:{name:'Farbreihen · 25 Schuss Kometenfächer',short:'Farbreihen 25',cat:2,lvl:12,shape:'battery',raster:[5,5],dims:[0.26,0.2,0.26],grid:[7,2,1],box:6,cost:8.20,market:18.99,weight:6,hype:22,risk:6,
    desc:'5 × 5 Rohre, jede Reihe eine Farbe: aus jedem Rohr steigt ein Kometenfächer – erst rot, dann grün, blau, gold und weiß, jede Reihe schneller –, ganz oben zerplatzen kleine Sterne in derselben Farbe.',
    art:{title:'FARBREIHEN',sub:'25 Schuss · 5×5 · Kometenfächer',bg1:'#1a2a6a',bg2:'#070a1e',ac:'#ff4a4a',ac2:'#5cff9e'}},
  rb49:{name:'Konfetti · 49 Schuss Farbmix',short:'Konfetti 49',cat:2,lvl:15,shape:'battery',raster:[7,7],dims:[0.34,0.26,0.34],grid:[5,1,1],box:4,cost:15.50,market:36.99,weight:5,hype:38,risk:7,
    desc:'7 × 7 Rohre voller Farbmix-Bomben: in jeder Kugel stecken vier Farben durcheinander wie Konfetti, Reihe für Reihe aus einer anderen Farbkiste.',
    art:{title:'KONFETTI',sub:'49 Schuss · 7×7 · gemischte Farben',bg1:'#6a1a5a',bg2:'#14031a',ac:'#ffd23f',ac2:'#5ce1ff'}},
  rb100:{name:'Stakkato · 100 Schuss Schnellfeuer',short:'Stakkato 100',cat:2,lvl:18,shape:'battery',raster:[10,10],dims:[0.5,0.3,0.5],grid:[4,1,1],box:2,cost:30.00,market:69.99,weight:4,hype:56,risk:8,
    desc:'10 × 10 Rohre im schnellsten Takt der Batterie: bis zu fünf Schuss pro Sekunde, kleine harte Stakkato-Sterne mit Knister-Spitzen über einer Glutfontäne – kaum eine Atempause.',
    art:{title:'STAKKATO',sub:'100 Schuss · 10×10 · 5 Schuss/s',bg1:'#2a2a2a',bg2:'#050505',ac:'#ff5a1e',ac2:'#f2f5ff'}},
  rbfaecher:{name:'Pfauenschweif · 30 Schuss Fächerbatterie',short:'Pfauenschweif 30',cat:2,lvl:16,shape:'fan',raster:[6,5],dims:[0.44,0.3,0.34],grid:[4,1,1],box:3,cost:17.50,market:39.99,weight:5,hype:42,risk:7,
    desc:'Sechs Spalten schräger Rohre: jede Reihe fächert von außen nach außen – erst nach rechts, dann nach links, wie ein Pfau, der sein Rad schlägt. Goldpalmen mit grünen und blauen Spitzen über einer Goldfontäne.',
    art:{title:'PFAUENSCHWEIF',sub:'30 Schuss · Fächer · 6 Spalten',bg1:'#0a4a4a',bg2:'#021414',ac:'#ffd23f',ac2:'#3a8aff'}}
});
NEU_GRUPPE.batterien.push('rb25','rb49','rb100','rbfaecher');
/* je in das Lizenzpaket ihres Levels: Kleinfeuerwerk (L10), Verbund &
   Kugelbomben (L14), Nachthimmel (L16), Goldklasse (L18) */
NEU_LIZ_DAZU.verbund.push('rb49');
NEU_LIZENZEN.find(l=>l.id==='kleinfeuer').items.push('rb25');
NEU_LIZENZEN.find(l=>l.id==='nachthimmel').items.push('rbfaecher');
NEU_LIZENZEN.find(l=>l.id==='goldklasse').items.push('rb100');
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
/* =========================================================
   Aus dem Sortiment genommen (Tom, 29.09.: "komplett entfernen, gefaellt
   mir nicht"). Die Produkte verschwinden ueberall: Katalog, Lizenzen,
   Warengruppen, Lieferanten. In alten Spielstaenden wird Bestand dieser
   Sorten beim Laden zur aehnlichsten verbliebenen (ENTFERNT_ERSATZ).
   ========================================================= */
const ENTFERNT=['fontaene50','fontaene30','silberkaskade','feuerkaskade','jugendbox','zfaecher','vulkan','feuersaeule',
  'knisterfaecher','bengalduo','zauberwald','silberwirbel','glitzerkaskade','nachtfalter','regenbogenfaecher','goldvulkan',
  'funkenturm','sortiment','sternstaub20','knallteppich','vulkanfeld','feuerbrunnen','farbrauchboeller','goldstaubboeller',
  'sternenbrunnen','bengalfackel','glueckrakete','mondschein','farbfontaenen','bengalflamme','tisch','tortenfontaene',
  'leuchtstaebe','pharao','stroboblinker','hagelsturm','himmelsfaecher','silvesternacht','nordlicht','wolkenkratzer',
  /* 30.09. (Tom): Farbzauber und Wunderkerzen-Box sollen weg */
  'wunderfarbe','wunderbox',
  /* 30.09. (Tom): Kugel 200 Bluetenkranz raus, dafuer drei neue 200-mm-Bomben */
  'kugel200',
  /* 03.10. (Tom): Brausepulver, Glitzergarten und Korkenzieher-Rakete sollen weg */
  'kinderparty','lb_glitzergarten','pfeifraketen',
  /* 03.10. abends (Tom, Sortiments-Durchsicht): Funkenflug, Konfetti,
     Leuchtturm, Kugel 100 Kristall, Achterbahn, Rummelplatz, Niagara,
     Stakkato, Kugel 150 Sternenstaub, Vorhang auf! ("zu gleich zu den
     anderen"), Titan ("Sound gefaellt nicht"), Kometenreigen ("wieder nur
     Gold"), Pfeifkonzert ("fuerchterlich"), Tonleiter (Heuler); Goldbrokat ist jetzt eine
     Kugelbombe (goldbrokat100) */
  'batterie16','rb49','blinkstern','kristallkugel100','batterie100','familienmix','wasserfall',
  'rb100','sternenstaub150','goldenerregen','titanraketen','kometenreigen','pfeifkonzert','raketengold',
  /* Tom: "Ich will keine Pfeif-Sachen" - die Tonleiter war eine reine Heuler-Batterie */
  'heulbatterie',
  /* 05.10. (Toms PDF "Alles wichtige zum Feuerwerk": "kann weg" /
     "entfernen"): Tisch Schlangen, Zauberbrunnen, Feuerperlen 16,
     Silberpfeil, Lichterkette, Farbreihen 25, Kometenballett,
     Smaragdfaecher, Feuersturm 49, Tausendblueten 42, Goldregen,
     Brandung 80, Lilienfeld, Pfauenschweif 30, Blitzweiden, Goldsaphir,
     Amethystregen, Schimmelreiter, Silberknister, Doppelhelix */
  'luftschlangentisch','zauberbrunnen','feuerperlen','silberpfeil','lichterkugeln','rb25','lb_fontaenenballett',
  'lb_smaragdfaecher','batterie49','sternenmeer42','lb_goldregen','sternenmeer80','lb_lilienfeld','rbfaecher',
  'lb_blitzweiden','lb_goldsaphir','lb_amethystregen','kometen','donnerschlag','lb_doppelhelix',
  /* 06.10. Kuratierung auf ~120 Feuerwerksprodukte (PDF: "Dass wir so auf
     100, 120 Produkte kommen", dazu zehn neue Themen-Batterien). Nichts
     davon hat Tom gelobt: Kreuzfeuer 42 (doppelt zum Grossen Kreuzfeuer,
     das er am 02.10. ins Sortiment nahm), Sternblinken ("am Ende nur
     eintoenig"), Weidenwand ("viel zu niedrig, viel zu eintoenig"),
     Geysirfeld ("komische Punkte ... eintoenig"), Lichterprozession
     ("Lichter bleiben am Himmel stehen"), Goldene Zwillinge (wieder Gold),
     Paradiesvogel, Kometenpalast, Farbenpracht, Himmelsfeuer (Faecher-
     Sammelsurien, mehr Kometen als Rohre), Sternenhimmel (Silber/Blau
     doppelt zu Ozean und Silbergewitter), Kugel 75 Suedsee ("viel zu klein
     ... eher eine Rakete"), Kugel 100 Weide (dritte 100er) und die
     Dreifachkrone 300 (Kronen wie Kronenregen 300 und Kronenkranz 200) */
  'kreuzfeuer','blitzgewitter60','kometenwand','geysirfeld','lichterprozession','goldregen22','lb_paradiesvogel',
  'lb_fontaenenpalast','lb_farbenpracht','lb_himmelsfeuer','lb_sternenfeuer','palmenkugel75','goldweide100','dreifachkrone300',
  /* 07.10. (Toms Test V117 in der Vorfuehrung): Vollmond ("unnatuerlich"),
     Lagune ("das Produkt kannst du komplett wegmachen"), Gletscher,
     Kaleidoskop, Sterntor, Legion, Finale Grande, Kugel 300 Kronenregen */
  'lb_vollmond','lb_lagune','lb_gletscher','sternenkaiser','sternentor','legion','kugelfinale','kronenregen300',
  /* 07.10. (Tom, Gameplay-Vorfuehrung): "Eiswuerfel raus - keine Gefriertruhe, im Kuehlschrank macht das keinen Sinn" */
  'eiswuerfel'];
/* Ersatz fuer alte Spielstaende: jede gestrichene Sorte wird beim Laden
   zur naechsten verbliebenen - gleiche Kategorie, moeglichst gleiche Form,
   Level und Preis am naechsten (18-save.js, SORTE_NEU). Sonst stuende
   Ware ohne Katalogeintrag im Regal und das Spiel braeche ab. */
const ENTFERNT_ERSATZ={};
(function(){
  const weg=new Set(ENTFERNT);
  ENTFERNT.forEach(t=>{ const a=P[t]; if(!a) return; let best=null, bw=1e9;
    for(const [u,b] of Object.entries(P)){ if(weg.has(u)||b.cat!==a.cat||b.eigen||b.noOrder) continue;
      const w=(b.shape===a.shape?0:100)+Math.abs((b.lvl||1)-(a.lvl||1))*3+Math.abs(Math.log((b.market||1)/(a.market||1)));
      if(w<bw){ bw=w; best=u; } }
    if(best) ENTFERNT_ERSATZ[t]=best; });
  ENTFERNT.forEach(t=>{ delete P[t]; if(typeof VOLA!=='undefined') delete VOLA[t]; if(typeof LIZ_VON!=='undefined') delete LIZ_VON[t]; });
  for(let i=ORDER.length-1;i>=0;i--) if(weg.has(ORDER[i])) ORDER.splice(i,1);
  LIZENZEN.forEach(l=>{ l.items=l.items.filter(t=>!weg.has(t)); });
  for(const g in GRUPPE) GRUPPE[g]=GRUPPE[g].filter(t=>!weg.has(t));
  /* 06.10.: auch die Prueflisten der neuen Ware (mblast, richtung) */
  for(const k in NEU_TEST) if(Array.isArray(NEU_TEST[k])) NEU_TEST[k]=NEU_TEST[k].filter(t=>!weg.has(t));
})();

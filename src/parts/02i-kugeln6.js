/* =========================================================
   Kugelbomben-Runde 6 (Tom, 09.10.2026 nachmittags, nach V122,
   docs/uebergabe/kugelbomben-0910b.md):
   - RAUS: Aurora 200, Granatapfel 200, Sonnensturm 300, Drachennest 300 -
     ueber ENTFERNT wie jede Streichung; Bestand alter Spielstaende wird
     zur aehnlichsten verbliebenen Sorte (ENTFERNT_ERSATZ, 18-save).
   - NEU: acht Koenigsklasse-Kugeln, "richtig intensiv, noch krasser als
     Urknall", mehrstufig, Steigerung bis zur teuersten. Level: das
     hoechste Feuerwerk im Spiel war Level 26 (Urknall, Finale/
     Weltuntergang, Legion), die Lizenzen enden bei Level 25
     (Meisterklasse), das Spiel geht weiter (Ausbau bis Level 31,
     xpFor ohne Obergrenze). Die neuen Kugeln stehen darueber: Level 27-30,
     in zwei neuen Lizenzen - Grossfeuerwerk (Level 27) und Pyro-Weltklasse
     (Level 29). Freigeschaltet wird nur ueber die Lizenz (isUnlocked).
   - PREISE nach der Kurve der Runde 5 (Kugel etwa ein Drittel der grossen
     Batterie gleichen Levels): Batterien enden bei Level 26 (Weltuntergang
     250 EUR -> Urknall 80 EUR); ihre Kurve (L24 150, L25 200, L26 250 EUR,
     +50 je Level) weiter gedacht ergibt L27 300 ... L30 450 EUR, ein Drittel
     davon 100-150 EUR. Die Kugeln: 89,99 / 94,99 (L27), 104,99 / 109,99
     (L28), 119,99 / 129,99 (L29), 139,99 / 169,99 (L30, Himmelssturz als
     letzte etwas darueber). Einkauf wie bisher 1 : 2,33, Nachfrage +2.
   Effekte, Knall, Groesse: 14z2-kugeln6.js, Verpackung: 04k-form-kugeln6.js.
   ========================================================= */
const K6_WEG=['aurora200','granatapfel200','sonnensturm300','drachennest300'];
const K6_NEU=[
 /* id, Name, Level, VK, Lizenz, Text, Farben (bg1,bg2,ac,ac2) */
 ['herbststurm300','Herbststurm',27,89.99,'grossfeuerwerk','Eine goldorange Kamuro-Krone, dann entzünden sich vierzig Flammenblätter und segeln flatternd und schaukelnd herab – zum Schluss steigt ein pfeifender Funkenschwarm auf. Ein Schlag, der lange nachrollt wie ein Herbststurm.','#4a1a04','#100602','#ffa030','#ffd23f'],
 ['eiszeit300','Eiszeit',27,94.99,'grossfeuerwerk','Eine eisblaue Chrysantheme mit langen Silberschleiern – dann bricht das Eis: jeder Stern zersplittert in drei weiße Eissplitter, Kristalle blitzen auf, und zum Schluss taut alles zu einer knisternden Silberweide.','#06203a','#02060e','#9ce8ff','#f2f5ff'],
 ['titanenfaust300','Titanenfaust',28,104.99,'grossfeuerwerk','Ein Titan-Salut, der die Fenster zittern lässt – aus dem Blitz schießen fünf Fingerbomben wie eine Faust, die sich öffnet, und jede zerspringt mit eigenem Schlag in Rot, Gold, Grün, Blau und Violett. Danach sinkt Silberflitter.','#1a1a22','#040408','#f2f5ff','#ffd23f'],
 ['lavastrom300','Lavastrom',28,109.99,'grossfeuerwerk','Eine karminrote Brokatkugel bricht auf, und der Kern speit schwere Lavabrocken, die langsam herabsinken und breite Glutströme ziehen – wo sie verlöschen, zerplatzen sie knisternd zu Asche. Tief, lang, grollend.','#4a0a04','#100202','#ff4a1a','#ffb03a'],
 ['galaxie300','Galaxie',29,119.99,'pyroweltklasse','Eine Spiralgalaxie am Himmel: zwei Arme aus Gold und Blauweiß, die sich langsam drehen, im Kern pulsiert ein Sternhaufen – dann zerspringen die Arme zu silbernen Sternhaufen.','#0a1030','#02030a','#ffd23f','#7ab0ff'],
 ['sturmflut300','Sturmflut',29,129.99,'pyroweltklasse','Drei Wellen aus schweren Tigerkometen rollen nach außen – Blau, Gold, Weiß – und brechen nacheinander wie Brandung zu herabstürzender Gischt, jede mit eigenem Donnerschlag.','#04203a','#01060c','#5ce1ff','#ffd23f'],
 ['goetterdaemmerung300','Götterdämmerung',30,139.99,'pyroweltklasse','Drei Schläge, jeder höher und größer: eine blutrote Päonie, dann steigt der Kern zu einer schweren Goldpalme, und ein zweiter Kern zerreißt im Götterschlag – Titanblitz, eine riesige weiße Chrysantheme und Knistern über den ganzen Himmel.','#3a0606','#0c0202','#ff3a1a','#ffd23f'],
 ['himmelssturz300','Himmelssturz',30,169.99,'pyroweltklasse','Die größte Kugel im Spiel: eine Crossette-Palme aus Goldtigern, ein Donnerkranz aus 24 Schlägen – und dann stürzt der Himmel ein: doppelter Titanblitz, eine gewaltige Goldkrone, die sich bis fast zum Boden senkt, und ein Nachbeben, das durch die ganze Stadt rollt.','#3a2a06','#0c0802','#ffd23f','#f2f5ff']
];
const K6_LIZENZEN=[
  {id:'grossfeuerwerk',lvl:27,cost:42000,name:'Großfeuerwerk',
   desc:'Kugelbomben, wie sie sonst nur Profis zünden: Herbststurm mit seinen Flammenblättern, die schwebende Eiszeit, die Titanenfaust mit fünf Schlägen und der grollende Lavastrom.',items:[]},
  {id:'pyroweltklasse',lvl:29,cost:52000,name:'Pyro-Weltklasse',
   desc:'Das Allergrößte: die drehende Galaxie, die Sturmflut aus drei Wellen, die Götterdämmerung mit drei Schlägen und der Himmelssturz – die größte Kugel und der lauteste Knall im Spiel.',items:[]}
];
(function(){
  K6_LIZENZEN.forEach(l=>{ if(!LIZENZEN.some(x=>x.id===l.id)) LIZENZEN.push(l); });
  const insLiz=(id,liz)=>{ const L=LIZENZEN.find(l=>l.id===liz); if(L&&L.items.indexOf(id)<0) L.items.push(id); LIZ_VON[id]=liz; };
  K6_NEU.forEach(([id,nm,lvl,vk,liz,desc,bg1,bg2,ac,ac2])=>{ if(P[id]) return; const mm=300;
    const q={name:nm+' · Kugelbombe '+mm+' mm',short:'Kugel '+mm+' '+nm,cat:2,lvl,shape:'shell',dims:KUGEL_MASS[mm],grid:KUGEL_GRID[mm],box:1,
      cost:Math.round(vk/KUGEL_MARGE*100)/100,market:vk,weight:5,hype:100,risk:10,desc,art:{title:nm.toUpperCase(),sub:'Kugelbombe '+mm+' mm',bg1,bg2,ac,ac2},runde6:true,aenderung:true};
    NEUWARE[id]=q; P[id]=q; ORDER.push(id); if(VOLA[id]===undefined) VOLA[id]=neuVola(q);
    GRUPPE.kugeln=GRUPPE.kugeln||[]; if(GRUPPE.kugeln.indexOf(id)<0) GRUPPE.kugeln.push(id);
    if(NEU_TEST.kugeln&&NEU_TEST.kugeln.indexOf(id)<0) NEU_TEST.kugeln.push(id);
    insLiz(id,liz); });
  /* die vier gestrichenen Kugeln - derselbe Weg wie jede Streichung (02e) */
  K6_WEG.forEach(t=>{ if(ENTFERNT.indexOf(t)<0) ENTFERNT.push(t); });
  sortimentStreichen();
  /* Silberdistel neu (gleicher Platz, Level 14), Fackelhimmel mit Flammen */
  if(P.silberdistel75) P.silberdistel75.desc='Ein violetter Distelkopf, darum silberne Strahlen – und an jeder Spitze löst sich ein Flaumbüschel, das funkelnd und langsam im Wind davonschwebt.';
  if(P.fackelhimmel150) P.fackelhimmel150.desc='Dreißig lodernde Flammenzungen stehen am Himmel – sie züngeln, flackern im Wind, Funken reißen ab, und fast zehn Sekunden lang sinken sie langsam, bis eine nach der anderen knisternd verlischt.';
  /* alle Kugelbomben sind in dieser Runde geaendert (Knall, Groesse) -
     Toms Pruefliste "Vorfuehrung (Aenderungen)" (17b) */
  for(const t of ORDER){ const q=P[t]; if(q&&q.shape==='shell'&&!q.eigen&&!q.rezept) q.aenderung=true; }
  /* Lizenztexte, die gestrichene Kugeln nannten */
  const txt={profi:'Der Götterfunken-Verbund: zweihundert Schuss, und der halbe Ort steht auf der Straße. Dazu die Jumbo-Rakete »Polarstern« und die großen Kugelbomben: Himmelsbrecher, Ringnebel, Kanonade, Sternensturm und Riesenpalme.',
    meister:'Die Jumbo-Rakete »Supernova«, die 300-mm-Kugeln Kometensturm und Urknall – erst ein Boom, dann ein Monster-Schlag. Danach geht es nur noch mit dem Großfeuerwerk weiter.'};
  for(const id in txt){ const L=LIZENZEN.find(l=>l.id===id); if(L) L.desc=txt[id]; }
})();

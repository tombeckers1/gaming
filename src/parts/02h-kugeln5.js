/* =========================================================
   Kugelbomben-Runde 5 (Tom, 09.10.2026, docs/uebergabe/kugelbomben-0910.md):
   - RAUS: 13 Kugeln (Chamaeleon, Smaragdring, Weltenbrand, Abendrot,
     Kometenschlag, Sternkranz, Weidenkoenig, Seerose, Feuerlilie,
     Leuchtqualle, Crossettenweide, Kaiserkrone, Himmelstreppe) - ueber
     ENTFERNT wie jede Streichung; Bestand alter Spielstaende wird zur
     aehnlichsten verbliebenen Sorte (ENTFERNT_ERSATZ, 18-save).
   - NEU: 5 Profi-Kugeln (Level 17-21) und 5 Koenigsklasse-Kugeln (Level
     22-26); die letzte (Urknall) ersetzt die Himmelstreppe. Effekte,
     Knall und Groesse: 14z-kugeln5.js, Verpackung: 04j-form-kugeln5.js.
   - PREISE: "Kugelbomben sollen nicht so viel kosten wie eine krasse
     Batterie". Bisher kostete eine 300-mm-Kugel (eine Zuendung, gut 6 s
     Bild) 165-175 EUR - mehr als Goetterfunken (200 Schuss, 66 s, 150 EUR).
     Neu: Verkaufspreis nach Level, etwa 30 % der grossen Batterien
     desselben Levels (Level 14 Knattersturm 31 EUR -> Kugel 10 EUR, Level 24
     Goetterfunken 150 EUR -> Kugel 48 EUR). Einkauf wie bisher im
     Verhaeltnis 1 : 2,33 (Marge unveraendert); weil eine guenstige Kugel
     oefter gekauft wird, steigt die Nachfrage (weight) um eins.
   ========================================================= */
const K5_WEG=['farbenmeer75','smaragdring100','kugel150','abendrot150','kometenschlag150','sternkugel150','weidenkoenig200',
  'seerose200','feuerlilie200','goldkrone200','crossettenweide300','kaiserkrone','himmelstreppe300'];
const K5_NEU=[
 /* id, Name, mm, Level, Text, Lizenz, Farben (bg1,bg2,ac,ac2) */
 ['fackelhimmel150','Fackelhimmel',150,17,'Dreißig lodernde Flammenbüschel stehen am Himmel – sie flackern, züngeln nach oben und sinken ganz langsam, fast zehn Sekunden lang, bis eine nach der anderen knisternd verlischt.','import','#4a1406','#100402','#ff8a2a','#ffd23f'],
 ['wetterleuchten150','Wetterleuchten',150,18,'Ein blinkender Gewitterkern in Eisblau, darum knisternde Silberkometen – dann laufen zwölf Donnerschläge im Kreis, und eine Silberweide mit bläulichen Blitzen tropft herab.','goldklasse','#0a1a2a','#02060c','#9ce8ff','#f2f5ff'],
 ['schatztruhe200','Schatztruhe',200,19,'Eine schwere Goldbrokat-Kugel öffnet sich, dann springen acht Juwelen in einer Spirale auf – Rubin, Smaragd, Saphir, Amethyst –, acht Funkelsterne antworten, und zum Schluss knistert das Gold.','sternklasse','#3a2606','#0c0802','#ffd23f','#ff2a5a'],
 ['bluetenhagel200','Blütenhagel',200,20,'Ein weißgoldener Strauß, dann platzen vierzig kleine Blüten in Rosa, Weiß, Zitrone und Mint von innen nach außen auf – wie ein knisternder Hagelschauer aus Blüten.','grossfeuer','#3a1430','#0c040a','#ffb0d8','#9cffd0'],
 ['aurora200','Aurora',200,21,'Ein violetter Blinkkern, eine grüne Chrysantheme, die Stern für Stern zu Violett wechselt, und ein Ring aus mintgrünen Rossschweifen, der wie ein Polarlicht-Vorhang herabfällt – darin funkeln weiße Sterne.','grossfeuer','#062a1a','#02080a','#3aff9a','#b85cff'],
 ['sonnensturm300','Sonnensturm',300,22,'Eine riesige Goldbrokat-Krone, darüber vierzehn glühende Sonnenfackeln, die sich weit hinausbiegen und an ihren Enden knisternd als Protuberanzen zerplatzen – im Kern brennt eine rote Sonne.','profi','#4a2006','#120602','#ffb03a','#ff3a1a'],
 ['drachennest300','Drachennest',300,23,'Ein rotes Nest geht auf, dann knistern hundertsechzig goldene Dracheneier von oben nach unten los, eine silberne Welle antwortet von unten, und glühende Tropfen fallen aus dem Nest.','profi','#3a0606','#0c0202','#ff3a1a','#ffd23f'],
 ['ringnebel300','Ringnebel',300,24,'Eine blaue Kugel, die zu Weiß wird, umkreist von zwei schrägen Goldringen; die Ringkometen zerspringen zu roten Kreuzen, in der Mitte pulsiert ein weißer Stern.','profi','#0a1a3a','#02040c','#5c8dff','#ffd23f'],
 ['kometensturm300','Kometensturm',300,25,'Drei Wellen schwerer Tigerkometen mit breitem Glitzerband – grün nach oben, blau rundum, magenta nach unten – um einen Goldbrokat-Kern, und jede Bahn endet in einem knisternden Funkenkranz.','meister','#0a2a2a','#020808','#3affb0','#ff3ad8'],
 ['urknall300','Urknall',300,26,'Erst ein Boom: ein Silberkranz mit grellem Blitz. Dann steigt der Kern weiter – und zerreißt im größten Schlag des Spiels: Titan-Silber, roter Feuerball, eine Goldkrone und ein Knistern, das den ganzen Himmel füllt.','meister','#1a1a1a','#000000','#ffffff','#ff3a1a']
];
/* Verkaufspreis je Level (Kugelbomben), siehe oben */
const KUGEL_VK={14:9.99,15:11.99,16:14.99,17:18.99,18:21.99,19:24.99,20:27.99,21:31.99,22:37.99,23:42.99,24:47.99,25:54.99,26:69.99};
const KUGEL_MARGE=2.33;
(function(){
  /* neue Kugeln wie Runde 4 (02g): Katalog, Bestellliste, Markt, Warengruppe, Lizenz */
  const insLiz=(id,liz)=>{ const L=LIZENZEN.find(l=>l.id===liz); if(L&&L.items.indexOf(id)<0) L.items.push(id); LIZ_VON[id]=liz; };
  K5_NEU.forEach(([id,nm,mm,lvl,desc,liz,bg1,bg2,ac,ac2],k)=>{ if(P[id]) return;
    const q={name:nm+' · Kugelbombe '+mm+' mm',short:'Kugel '+mm+' '+nm,cat:2,lvl,shape:'shell',dims:KUGEL_MASS[mm],grid:KUGEL_GRID[mm],box:{75:8,100:6,150:3,200:2,300:1}[mm],
      cost:KUGEL_PREIS[mm][0],market:KUGEL_PREIS[mm][1],weight:3,hype:60+lvl*2,risk:10,desc,art:{title:nm.toUpperCase(),sub:'Kugelbombe '+mm+' mm',bg1,bg2,ac,ac2},runde5:true};
    NEUWARE[id]=q; P[id]=q; ORDER.push(id); if(VOLA[id]===undefined) VOLA[id]=neuVola(q);
    GRUPPE.kugeln=GRUPPE.kugeln||[]; if(GRUPPE.kugeln.indexOf(id)<0) GRUPPE.kugeln.push(id);
    if(NEU_TEST.kugeln&&NEU_TEST.kugeln.indexOf(id)<0) NEU_TEST.kugeln.push(id);
    insLiz(id,liz); });
  /* die 13 gestrichenen Kugeln - derselbe Weg wie jede Streichung (02e) */
  K5_WEG.forEach(t=>{ if(ENTFERNT.indexOf(t)<0) ENTFERNT.push(t); });
  sortimentStreichen();
  /* Preise und Nachfrage aller Kugelbomben; alle sind in dieser Runde
     geaendert (Knall, Groesse, Optik) - Toms Pruefliste "Vorfuehrung
     (Aenderungen)" (17b) */
  for(const t of ORDER){ const q=P[t]; if(!q||q.shape!=='shell'||q.eigen||q.rezept) continue;
    const vk=KUGEL_VK[Math.max(14,Math.min(26,q.lvl|0))]; if(!vk) continue;
    q.market=vk; q.cost=Math.round(vk/KUGEL_MARGE*100)/100; q.weight=(q.weight||3)+1; q.aenderung=true; }
  /* Lizenztexte, die gestrichene Kugeln nannten */
  const txt={import:'Der Atombomben-Böller mit dem großen Pilz, die 150-mm-Kugel Fackelhimmel mit ihren lodernden Flammen und die Silberregen-Raketen. Teuer im Einkauf, launisch im Preis, aber die Kunden reden darüber.',
    goldklasse:'Glasbruch-Raketen, die Goldader und die 150-mm-Kugeln Crossettennetz, Tigerkrone, Farbcrossette und Wetterleuchten.',
    profi:'Der Götterfunken-Verbund: zweihundert Schuss, und der halbe Ort steht auf der Straße. Dazu die Jumbo-Rakete »Polarstern« und die großen Kugelbomben: Granatapfel, Sonnensturm, Himmelsbrecher, Drachennest, Ringnebel, Kanonade, Sternensturm und Riesenpalme.',
    meister:'Das Ende der Leiter: die Jumbo-Rakete »Supernova«, die 300-mm-Kugeln Kometensturm und Urknall – erst ein Boom, dann der größte Schlag des Spiels.'};
  for(const id in txt){ const L=LIZENZEN.find(l=>l.id===id); if(L) L.desc=txt[id]; }
})();

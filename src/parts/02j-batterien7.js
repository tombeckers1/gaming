/* =========================================================
   Batterie-Runde (Tom, 09.10.2026 nachmittags, "Vorfuehrung
   (Aenderungen)" in V122, docs/uebergabe/batterien-0910.md).
   Nur die Produktdaten - vor 06-fixtures im Katalog (Massraster,
   Kartonwahl). Effekte, Drehbuecher, Klang: 14z3-batterien7.js,
   Verpackung: 04l-form-batterien7.js.
   - RAUS (ueber ENTFERNT wie jede Streichung, alte Spielstaende bekommen
     die aehnlichste verbliebene Sorte): Pusteblume, Zitronenfalter,
     Weinlese, Mohnfeld, Winterwald, Fuchsien, Goldader, Trommelfeuer,
     Glutschmiede, Vulkanausbruch, Schwarzer Samt, Goetterfunken (das
     Basisprodukt 'profi' aus 02-data), Phoenix.
   - NEU: elf Batterien nach echten Vorbildern (Quellen in der Uebergabe-
     datei), eigene Namen, keine Marken. Die Goldlaube (L7) ersetzt den
     Zitronenfalter auf derselben Stufe.
   PREISE nach der Batterie-Kurve (gleiche Stufe, gleiche Groesse wie die
   Nachbarn): L7 41,99 (wie Zitronenfalter), L10 59,99 (Glutpalmen),
   L12 74,99 (zwischen Ozean 65,99 und Herbstlaub 71,99 - mehr Schuss),
   L15 92,99 (Polarnacht 89,99), L17 104,99, L19 116,99 (Blitzpalmen
   113,99), L21 127,99 (Weidenhain 125,99), L22 139,99, L24 164,99
   (Meteorschauer 159,99), dann ueber dem Weltuntergang (L26 249,99) die
   Kurve der Runde 6 (+50 EUR je Level): L27 299,99, L28 349,99.
   Einkauf 1 : 2,2 wie die grossen Verbunde (Goetterfunken 68/150).
   Amortisation: der Abstand VK-EK je Stueck (55-190 EUR) entspricht wie
   bisher einer Stunde Ladenbetrieb auf der jeweiligen Stufe - die zwei
   Koenigsklasse-Verbunde L27/L28 lohnen erst mit der Lizenz
   Grossfeuerwerk (42 000 EUR), die es fuer die Kugeln der Runde 6 schon
   gibt; die Kurve bleibt unveraendert.
   ========================================================= */
const B7_WEG=['kinderbatterie','lb_zitronenfalter','weinlese','mohnfeld','winterwald','fuchsien','lb_goldader','donnerwand',
  'glutschmiede','lb_vulkan','schwarzersamt','profi','phoenix'];
const B7_NEU=[
 /* id, Name, Untertitel, Level, Masse, VK, Farben (bg1,bg2,ac,ac2), Text, Lizenz */
 ['b7_goldlaube','Goldlaube','25 Schuss Goldweiden & Blinker',7,[0.34,0.17,0.24],41.99,'#2a1a04','#08060a','#ffd23f','#5c8dff',
  'Goldene Titanweiden mit blauen Sternen hängen wie eine Laube, dazwischen Brokatkronen mit grünen Blinkern und ein Kranz aus Goldschweifen mit roten Blinkern.','klassiker'],
 ['b7_eisbecher','Eisbecher','36 Schuss Crossetten & Spitze',10,[0.4,0.2,0.28],59.99,'#3a3a06','#0a0a10','#fff35c','#b85cff',
  'Zitronengelbe Crossetten zerspringen über Kreuz und hinterlassen silberne und rote Spitzenblüten, violette Crossetten antworten mit Silber und Gold – das Finale: Nishiki-Weiden mit roten und blauen Perlen, zweimal.','kleinfeuer'],
 ['b7_maerchen','Märchenstunde','66 Schuss Kronen & Schleierkraut',12,[0.56,0.26,0.36],74.99,'#1a0a3a','#06020c','#ffd23f','#9cff3a',
  'Brokatkronen mit roten, weißen und grünen Blinkern im Wechsel, grüne und violette Sterne, die zu weißem Schleierkraut zerstieben, glitzernde Weiden mit blauen Sternen, Goldweiden zu Farbe, eine Silberspinne – und zum Schluss Salven aus Kronen und Schleierkraut.','himmel'],
 ['b7_wolfsnacht','Wolfsnacht','99 Schuss Blau, Gold & Blinker',15,[0.62,0.26,0.4],92.99,'#06103a','#01030c','#5c8dff','#ffd23f',
  'Brokatschweife steigen zu blauen Päonien, die weiß zu blinken beginnen, Silberwirbel jagen in die Höhe, Brokatkronen mit blinkenden Spitzen im W und im Z – und zum Schluss eine Salve aus Brokat-Buketts mit Titanschlägen, die wie Wolfsgeheul durch die Straßen rollen.','verbund'],
 ['b7_wuestengold','Wüstengold','84 Schuss Kamuro & Gold',17,[0.72,0.3,0.42],104.99,'#3a2a06','#0c0802','#ffd23f','#ff3a1a',
  'Opulentes Gold aus 30-mm-Rohren: lang stehende Nishiki-Goldweiden, dazwischen rote Blinker und blaue Sterne im Z und im W, goldene Schweife steigen zu großen Weiden, und schwere Goldpalmen mit blauen Spitzen beenden die Nacht.','import'],
 ['b7_neonkueste','Neonküste','128 Schuss Neon & Wirbelgold',19,[0.8,0.3,0.42],116.99,'#2a0630','#04020a','#ff3ad8','#3affe0',
  'Neonpink, Neongrün und Türkis: leuchtende Päonien mit roten und weißen Blinkern, Goldweiden mit wirbelnden Goldschweifen – und im Finale steigen goldene Wirbel zu riesigen Titan-Goldweiden, die den ganzen Himmel verhängen.','sternklasse'],
 ['b7_goldnatter','Goldnatter','72 Schuss Schlangen & Spitze',21,[0.7,0.3,0.42],127.99,'#1a1a06','#040402','#ffd23f','#ff3a1a',
  'Goldweiden, die in roter und goldener Spitze enden, goldene Schwimmer, die zwischen roten und goldenen Blinkern davonschlängeln, Goldpalmen zu weißer Spitze, violette und orange Crossetten – und als Finale ein Nest goldener Nattern, das sich über den ganzen Himmel windet.','grossfeuer'],
 ['b7_paukenschlag','Paukenschlag','295 Schuss Wellen & Knister',22,[0.9,0.3,0.6],139.99,'#06102a','#01020a','#e8f0ff','#ffd23f',
  'Ein Trommelwirbel aus 295 kleinen Rohren: Reihe um Reihe im Z – Silberwellen, die zu blauen Sternen werden, Goldkometen, knisternde Kometen –, dann der Paukenschlag: fünf Brokatkronen auf einen Schlag, und zum Schluss fünf Rohre Zeitregen, der knisternd verlischt.','profi'],
 ['b7_sternparade','Sternparade','152 Schuss Blinkstern-Buketts',24,[0.9,0.34,0.56],164.99,'#1a0a3a','#04020c','#b85cff','#fff35c',
  'Vier Batterien, über zwei Minuten: Blinkstern-Buketts in Violett und Zitrone, Rot mit blinkendem Weiß, Brokatkronen, goldene Kometen, violett und grün blinkende Buketts, goldene Spinnen und zum Schluss ein grüner Sternenteppich.','profi'],
 ['b7_blumenmeer','Blumenmeer','368 Schuss sechs Blumenbeete',27,[0.96,0.4,0.62],299.99,'#0a2a1a','#02060a','#ff5ac8','#ffd23f',
  'Zwei Verbunde, sechs große Blumenbeete, über drei Minuten: jedes Beet mit eigenem Effekt und eigener Schussrichtung – Rosen, Goldregen, Kornblumen, Lilien, ein Feld aus Blinksternen und ein Sonnenblumenbeet in Gold – zweimal zünden, lange staunen.','grossfeuerwerk'],
 ['b7_ragnaroek','Ragnarök','409 Schuss Weltenbrand',28,[0.98,0.92,0.6],349.99,'#2a0602','#060102','#ffd23f','#ff3a1a',
  'Vier Verbunde, 409 Schuss, zwei Minuten: Es beginnt in ruhiger Eleganz mit goldenen Brokatkronen und blauen Päonien, dann rote Dahlien, grüne Kometen, knisternde und blinkende Fächer, Salven im Z – und es endet im rasenden Weltenbrand mit Titanschlägen, die die Fenster klirren lassen.','grossfeuerwerk']
];
(function(){
  const insLiz=(id,liz)=>{ const L=LIZENZEN.find(l=>l.id===liz); if(L&&L.items.indexOf(id)<0) L.items.push(id); LIZ_VON[id]=liz; };
  B7_NEU.forEach(([id,nm,sub,lvl,dims,vk,bg1,bg2,ac,ac2,desc,liz])=>{ if(P[id]) return;
    const gross=dims[0]>0.5;
    const q={name:nm+' · '+sub,short:nm,cat:2,lvl,shape:'battery',dims,grid:gross?[2,1,1]:[3,1,1],box:gross?1:2,
      cost:Math.round(vk/2.2*100)/100,market:vk,weight:gross?3:5,hype:30+lvl*2.6,risk:lvl<10?4:lvl<20?7:10,desc,
      art:{title:nm.toUpperCase(),sub,bg1,bg2,ac,ac2},aenderung:true,runde7:true};
    NEUWARE[id]=q; P[id]=q; ORDER.push(id); if(VOLA[id]===undefined) VOLA[id]=neuVola(q);
    GRUPPE.batterien=GRUPPE.batterien||[]; if(GRUPPE.batterien.indexOf(id)<0) GRUPPE.batterien.push(id);
    if(NEU_TEST.batterien&&NEU_TEST.batterien.indexOf(id)<0) NEU_TEST.batterien.push(id);
    insLiz(id,liz); });
  B7_WEG.forEach(t=>{ if(ENTFERNT.indexOf(t)<0) ENTFERNT.push(t); });
  sortimentStreichen();
  /* Die Zitronenfalter-Stufe bekommt die Goldlaube (gleiche Stufe, gleicher
     Preis) - alte Spielstaende ebenso (statt der "aehnlichsten" Sorte) */
  if(P.b7_goldlaube) ENTFERNT_ERSATZ.lb_zitronenfalter='b7_goldlaube';
  /* Aenderungsliste (17b): nur, was in dieser und den Kugel-Runden neu oder
     geaendert ist - alles andere bleibt im Sortiment, aber raus aus der Liste */
  for(const t of ORDER){ const q=P[t]; if(q&&q.shape!=='shell'&&!q.runde7) q.aenderung=false; }
  for(const t of ['kornblumen','lb_tautropfen','bienenweide','lb_saphirfaecher','hochzeitsfaecher','meteorschauer']) if(P[t]) P[t].aenderung=true;
})();

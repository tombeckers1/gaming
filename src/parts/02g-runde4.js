/* =========================================================
   Runde 4 (07.10., Tom V117: "10 neue thematisierte Batterien, davon
   2-3 extreme fuer die Koenigsklasse" und "10 neue Kugelbomben").
   Nur die Produktdaten - sie muessen vor 06-fixtures im Katalog stehen
   (Massraster, Kartonwahl). Effekte, Drehbuecher, Rohrfolgen und Klang:
   14y-runde4.js, Verpackung: 04i-form-runde4.js.
   Jede Batterie ein Bild aus der Natur mit eigener Farbfamilie - keine,
   die eine vorhandene doppelt (Silber/Blau = Ozean/Silbergewitter,
   Gold = Goldader, Rosa = Kirschbluete/Rosenherz, Gruen/Gold = Urwald):
     Kornblumen   L2   9 Schuss   Kornblau und Weizengold
     Bienenweide  L6  12 Schuss   Bernstein (Bienen) und Kleeviolett
     Weinlese     L7  16 Schuss   Traubenviolett, Rebengruen, Wein-Gold
     Mohnfeld     L12 22 Schuss   Mohnrot und Limette
     Winterwald   L13 28 Schuss   Tannengruen, Raureif-Weiss, Ilexrot
     Fuchsien     L16 36 Schuss   Magenta und Violett
     Korallenriff L18 48 Schuss   Koralle und Tuerkis
   Level dort, wo das Sortiment Luecken hat (gezaehlt 07.10.: vorher keine
   Batterie auf L1-2, L17, je eine auf L6, L7, L12, L13, L15, L16, L18).
     Schwarzer Samt  L23 120 Schuss  Samtblau, Gold, Silberblinker
     Meteorschauer   L24 160 Schuss  Weiss und Limettengruen
     Phoenix         L25 200 Schuss  Scharlach, Gold, Glutorange
   Preise wie vergleichbare Batterien (Schuss, Groesse, Level), Lizenz
   nach Level, Warengruppe Batterien bzw. Kugeln.
   ========================================================= */
const R4_BATTERIEN=[
 /* id, Name, Untertitel, Level, Masse, Preis EK/VK, Farben (bg1,bg2,ac,ac2), Text, Lizenz, Kat */
 ['kornblumen','Kornblumen','9 Schuss Sommerwiese',2,[0.18,0.13,0.18],3.10,6.99,'#0e1e4a','#03061a','#5c8dff','#ffd23f',
  'Blaue Kornblumen mit gefransten Blütenblättern blühen über reifem Weizen – drei einzeln, dazwischen goldene Ähren, zum Schluss zwei zugleich.','jugend',2],
 ['bienenweide','Bienenweide','12 Schuss Summen & Klee',6,[0.22,0.16,0.2],4.60,10.99,'#2a1a3a','#0a0610','#ffb03a','#b89cff',
  'Runde violett-weiße Kleeblüten, dazwischen summende Bienenschwärme in Bernstein, die kreuz und quer schwirren – mit leisem Summen.','klassiker',2],
 ['weinlese','Weinlese','16 Schuss Traubenbuketts',7,[0.3,0.18,0.24],6.30,14.49,'#2a0a3a','#08020c','#b85cff','#9cff3a',
  'Violette Trauben hängen in dichten Büscheln am Himmel, grüne Weinblätter rascheln im Zickzack, und zum Schluss fließt goldener Wein.','klassiker',2],
 ['mohnfeld','Mohnfeld','22 Schuss Mohnkapseln',12,[0.36,0.2,0.26],9.20,20.99,'#3a0606','#0c0202','#ff2a1a','#9cff3a',
  'Rote Mohnblüten mit grünem Herz, aus dem die Samen silbern herausrieseln; ein Windstoß wiegt das Feld, knisternde Kapseln platzen.','himmel',2],
 ['winterwald','Winterwald','28 Schuss Raureif & Tannen',13,[0.42,0.22,0.3],12.80,28.99,'#0a2a1a','#020a06','#e8f4ff','#2ec85a',
  'Weißer Raureif glitzert und rieselt, Tannenzweige knistern grün, rote Ilexbeeren werden weiß wie Schnee – eine stille Winternacht im Wald.','feuerzauber',2],
 ['fuchsien','Fuchsien','36 Schuss Hängeblüten',16,[0.5,0.26,0.34],19.50,44.99,'#3a0630','#0c020a','#ff3ad8','#9a4aff',
  'Magenta und Violett: Fuchsienblüten öffnen sich wie Glocken, ihre Staubgefäße hängen tief herab, violette Chrysanthemen drehen sich, magentafarbene Weiden hängen lang am Himmel.','nachthimmel',2],
 ['korallenriff','Korallenriff','48 Schuss Korallen & Fische',18,[0.62,0.28,0.4],27.50,62.99,'#063a3a','#010c0c','#ff7a5a','#3affe0',
  'Korallen wachsen verzweigt in den Himmel, Fischschwärme flitzen silbern, türkise Seeanemonen und weißes Plankton – im Finale das ganze Riff auf einmal.','goldklasse',2],
 ['schwarzersamt','Schwarzer Samt','120 Schuss Samt & Gold',23,[0.86,0.36,0.56],58.00,129.99,'#0a0a14','#020204','#ffd23f','#3a5cff',
  'Dunkle Aufstiege, schwere Goldpalmen, samtblaue Dahlien, Silberblinker, die wie Strass funkeln – und Samtkronen, deren Goldbrokat in Blinksterne zerfällt. Ein Finale aus 36 Schuss.','profi',2],
 ['meteorschauer','Meteorschauer','160 Schuss Feuerkugeln',24,[0.96,0.38,0.6],72.00,159.99,'#0a1a10','#020604','#e8ffe0','#9cff3a',
  'Feuerkugeln ziehen grün leuchtend über den Himmel und zerbrechen in weiße Splitter, Crossetten zerspringen, Einschläge donnern, silberne Pferdeschweife fallen – das Finale ein Sturm aus 47 Schuss.','profi',2],
 ['phoenix','Phönix','200 Schuss aus der Glut',25,[1.1,0.4,0.66],92.00,199.99,'#3a0a04','#0c0201','#ffb03a','#ff3a1a',
  'Aus knisternder Glut erhebt sich der Phönix: Flügelschläge aus scharlachroten Kometen mit goldenen Federn, Tigerschweife, rote Dahlien, ein Funkenregen – und am Ende eine Krone aus zehn riesigen Goldkamuro.','meister',2]
];
const R4_KUGELN=[
 /* id, Name, mm, Level, Text, Lizenz, Farben */
 ['silberdistel75','Silberdistel',75,14,'Eine silberne Chrysantheme mit kurzen, stacheligen Schweifen um einen violetten Blütenkopf – zum Schluss knistern die Spitzen.','verbund','#1a1a3a','#06060f','#e8ecff','#b85cff'],
 ['hummelschwarm75','Hummelschwarm',75,15,'Dreißig goldene Wirbelsterne schwirren summend in Kurven auseinander, jeder auf seiner eigenen Bahn.','verbund','#3a2a06','#0c0802','#ffd23f','#f2f5ff'],
 ['blauregen100','Blauregen',100,16,'Lavendelblaue Sterne hängen einen Moment, dann fallen sie in langen, dichten Trauben herab wie blühender Blauregen.','nachthimmel','#2a1a5a','#06040f','#a88cff','#5c8dff'],
 ['smaragdring100','Smaragdring',100,17,'Ein smaragdgrüner Ring steht schräg am Himmel, in der Mitte ein goldener Blütenstempel – dann knistern die Ringsterne.','import','#063a1a','#010c05','#2aff8a','#ffd23f'],
 ['abendrot150','Abendrot',150,18,'Eine dreifache Päonie wie ein Sonnenuntergang: außen Gold, darin Orange, innen glutrot – jede Schale verglüht für sich.','goldklasse','#4a1a06','#100402','#ffb03a','#ff3a1a'],
 ['kometenschlag150','Kometenschlag',150,19,'Vierundzwanzig weiße Kometen mit Goldschweif fliegen weit hinaus – am Ende jeder Bahn ein heller Knall.','sternklasse','#1a1a1a','#050505','#f2f5ff','#ffd23f'],
 ['seerose200','Seerose',200,21,'Ein flacher Kranz weißer Blütenblätter öffnet sich waagerecht wie eine Seerose auf dem Wasser, die Spitzen werden rosa, in der Mitte ein goldener Stempel.','grossfeuer','#063a2a','#010c08','#ffffff','#ff8ac8'],
 ['granatapfel200','Granatapfel',200,22,'Eine große tiefrote Päonie bricht auf, jeder Stern zerspringt in rubinrote Kerne, die funkelnd herabrieseln.','profi','#3a0410','#0c0103','#ff2a4a','#ffb0c0'],
 ['riesenpalme300','Riesenpalme',300,24,'Zehn schwere Goldwedel sinken als riesige Palme, zwischen ihnen ein Ring blauer Leuchtsterne – zum Schluss blühen acht kleine Buketts im Kranz.','profi','#3a2a06','#0a0602','#ffd23f','#3a6aff'],
 ['himmelstreppe300','Himmelstreppe',300,26,'Eine Mehrschlagbombe: Sie bricht viermal, jedes Mal höher – Gold, Rot, Blau – und ganz oben öffnet sich eine riesige Silberkrone.','meister','#0a0a2a','#02020a','#e8ecff','#ffd23f']
];
(function(){
  const LZ=typeof LIZENZEN!=='undefined'?LIZENZEN:[];
  const insLiz=(id,liz)=>{ const L=LZ.find(l=>l.id===liz); if(L&&L.items.indexOf(id)<0) L.items.push(id); if(typeof LIZ_VON!=='undefined') LIZ_VON[id]=liz; };
  const ein=(id,q,gr)=>{ if(P[id]) return; NEUWARE[id]=q; P[id]=q; ORDER.push(id); if(VOLA[id]===undefined) VOLA[id]=neuVola(q);
    GRUPPE[gr]=GRUPPE[gr]||[]; if(GRUPPE[gr].indexOf(id)<0) GRUPPE[gr].push(id);
    if(typeof NEU_TEST!=='undefined'&&NEU_TEST[gr]&&NEU_TEST[gr].indexOf(id)<0) NEU_TEST[gr].push(id); };
  R4_BATTERIEN.forEach(([id,nm,sub,lvl,dims,cost,market,bg1,bg2,ac,ac2,desc,liz,cat])=>{
    const gross=dims[0]>0.5;
    ein(id,{name:nm+' · '+sub,short:nm,cat,lvl,shape:'battery',dims,grid:gross?[2,1,1]:dims[0]>0.3?[3,1,1]:[6,2,1],box:gross?1:dims[0]>0.3?2:6,cost,market,weight:gross?3:5,hype:30+lvl*2.4,risk:lvl<10?3:lvl<20?7:9,desc,
      art:{title:nm.toUpperCase(),sub,bg1,bg2,ac,ac2},aenderung:true,runde4:true},'batterien');
    insLiz(id,liz); });
  R4_KUGELN.forEach(([id,nm,mm,lvl,desc,liz,bg1,bg2,ac,ac2],k)=>{
    ein(id,{name:nm+' · Kugelbombe '+mm+' mm',short:'Kugel '+mm+' '+nm,cat:2,lvl,shape:'shell',dims:KUGEL_MASS[mm],grid:KUGEL_GRID[mm],box:{75:8,100:6,150:3,200:2,300:1}[mm],
      cost:KUGEL_PREIS[mm][0]+(k%2)*(mm>=200?3:1),market:KUGEL_PREIS[mm][1]+(k%2)*(mm>=200?5:2),weight:3,hype:60+lvl*2,risk:10,desc,
      art:{title:nm.toUpperCase(),sub:'Kugelbombe '+mm+' mm',bg1,bg2,ac,ac2},runde4:true},'kugeln');
    insLiz(id,liz); });
})();

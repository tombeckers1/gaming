/* =========================================================
   Zehn Themen-Batterien (06.10., Tom im PDF: "Mache mir 10 neue
   Batterien. 'Kirschbluete' finde ich sehr schoen. Der Name passt
   seeehr gut zum Effekt. Nimm es als Referenz - aber nicht um es zu
   kopieren, sondern um die kohaerente Schoenheit des Produktes zu
   identifizieren und andere themenbasierte Batterien zu erstellen").
   Nur die Produktdaten - sie muessen vor 06-fixtures im Katalog stehen
   (Massraster, Kartonwahl). Lichter, Ablauf und Klang: 14v-themen.js,
   Verpackung: 04h-form-themen.js.
   Je: id, Name, Untertitel, Level, Masse, Farben (bg1, bg2, ac, ac2),
   Text, Verkabelung (Rueckfall; die eigene Rohrfolge setzt 14v), Lizenz.
   Preis wie die Lichter-Batterien (LB_SORTIMENT): Level x 2,6.
   ========================================================= */
const THEMEN_SORTIMENT=[
 ['lb_tautropfen','Tautropfen','10 Schuss Perlentau',4,[0.42,0.18,0.26],'#0e2a24','#030a08','#d8fff0','#9fffd0','Silberne Tauperlen hängen einen Atemzug lang am Himmel und tropfen dann einzeln herab – mit einem leisen Plink. Dazwischen Tropfenketten wie Tau an einem Spinnfaden.','zufall','jugend'],
 ['lb_zitronenfalter','Zitronenfalter','16 Schuss Flatterkometen',7,[0.5,0.2,0.3],'#3a3a06','#0c0c02','#fff35c','#ffffd0','Zitronengelbe Kometen flattern im Zickzack nach oben wie ein Falter im Frühling, oben tanzen Falterpaare umeinander. Leise wie Flügelschlag.','wechsel','klassiker'],
 ['lb_lavendelfeld','Lavendelfeld','18 Schuss Duftrispen',9,[0.56,0.2,0.32],'#2a1a4a','#08040f','#b89cff','#e8e4ff','Lila Lavendelrispen wachsen in den Himmel und wiegen sich im Wind, dazwischen weiche Duftwolken aus violettem Glitzer – ein Sommerabend über dem Feld.','diagonal','krach'],
 ['lb_herbstlaub','Herbstlaub','22 Schuss Blätterfall',12,[0.8,0.26,0.46],'#4a1e06','#100602','#ff8a2a','#ffc04a','Bernstein, Rost und Scharlach: Blätter taumeln und flackern im Fallen, ein Windstoß wirbelt Laub im Kreis, Kastanien knacken als Crossetten – zum Schluss der Herbststurm.','spirale','himmel'],
 ['lb_kolibri','Kolibri','24 Schuss Schwirrkometen',14,[0.82,0.27,0.5],'#063a2a','#010c08','#3affc0','#ff3a6a','Smaragdgrüne Kometen schwirren oben in kurzen Sprüngen hin und her und schillern türkis, dazu Federkronen, die im Licht die Farbe wechseln.','zufall','verbund'],
 ['lb_vollmond','Vollmond','26 Schuss Mondhof & Schleier',16,[0.85,0.28,0.55],'#1a1e3a','#04050c','#fff0c8','#c8d4ff','Ein cremeweißer Mond mit silbernem Hof, Wolkenschleier ziehen vorüber, zwei Mondsicheln – und zum Schluss acht Monde im Kreis. Leise, nur ein weiches Pochen.','mitte','nachthimmel'],
 ['lb_lagune','Lagune','28 Schuss Fischschwärme',18,[0.9,0.28,0.56],'#063a3e','#010c0e','#5cffe8','#c8fff4','Türkis und Aqua: Fischschwärme schießen mit zappelnden Schwänzen auseinander, Seeanemonen wiegen ihre Fäden in der Strömung, Luftblasen steigen und platzen – mit leisem Blubbern.','spalte','goldklasse'],
 ['lb_sonnenblumen','Sonnenblumen','30 Schuss Kernblüten',20,[0.92,0.3,0.6],'#3a2a04','#0c0802','#ffd83a','#8a4a12','Gelbe Blütenkränze mit knisterndem braunem Herz – die Kerne knacken der Reihe nach im Sonnenblumen-Spiral. Dazu Sonnenstrahlen und schwere Blütenköpfe, die sich neigen.','spirale','grossfeuer'],
 ['lb_gletscher','Gletscher','34 Schuss Eisbruch',22,[0.95,0.3,0.62],'#0a2a4a','#02060f','#c8ecff','#5c9dff','Eisblau und Weiß: Kristalle zerspringen mit Klirren in sechs Äste, Eiszapfen fallen als Vorhang, und zum Schluss kalbt der Gletscher – mit dumpfem Donnern.','diagonal','profi'],
 ['lb_vulkan','Vulkanausbruch','44 Schuss Lavabomben',25,[1.05,0.32,0.66],'#3a0a04','#0c0201','#ff5a1e','#ffb03a','Erst grollt es in einer glühenden Aschewolke voller Blitze, dann bricht der Vulkan aus: Lavastrahlen, schwere Lavabomben mit glühenden Schweifen und knisternder Ascheregen – zweimal, das zweite Mal größer.','mitte','meister']
];
(function(){
  THEMEN_SORTIMENT.forEach(([id,nm,sub,lvl,dims,bg1,bg2,ac,ac2,desc,zuendung,liz])=>{
    if(P[id]) return;
    const q={name:nm+' · '+sub,short:nm,cat:2,lvl,shape:'battery',dims,grid:lvl<10?[4,1,1]:[2,1,1],box:lvl<10?4:1,cost:Math.round(lvl*2.6),market:Math.round(lvl*2.6*2.3)-0.01,weight:lvl<10?6:3,hype:40+lvl*2,risk:lvl<10?3:8,desc,
      art:{title:nm.toUpperCase(),sub,bg1,bg2,ac,ac2},zuendung};
    NEUWARE[id]=q; P[id]=q; ORDER.push(id);
    if(VOLA[id]===undefined) VOLA[id]=neuVola(q);
    const L=LIZENZEN.find(l=>l.id===liz); if(L&&L.items.indexOf(id)<0) L.items.push(id); LIZ_VON[id]=liz;
    GRUPPE.batterien=GRUPPE.batterien||[]; if(GRUPPE.batterien.indexOf(id)<0) GRUPPE.batterien.push(id);
    if(NEU_TEST.batterien.indexOf(id)<0) NEU_TEST.batterien.push(id);
  });
})();

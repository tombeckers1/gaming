/* =========================================================
   Sortiment 06.10. (Toms PDF "Alles wichtige zum Feuerwerk", 05.10.)
   Das Streichen selbst laeuft ueber ENTFERNT in 02e-neuware.js (Katalog,
   Lizenzen, Warengruppen, alte Spielstaende). Hier stehen die Aenderungen
   an verbliebenen Produkten, die nach allen Drehbuechern greifen sollen.
   ========================================================= */

/* Drehsonne (Tom, PDF: "Drehsonne auf einfaches Level, Mittelklasse passt
   nicht"): vorher Level 14 in der Lizenz Verbund & Kugelbomben. Jetzt
   Einstieg, Level 5 mit den Silvester-Klassikern (Furzboeller, Flitzer,
   Kreisel) - ein Rad am Staender ist ein Klassiker fuer den kleinen
   Geldbeutel. Preis wie ein einfaches Bodenfeuerwerk (echte Drehsonnen
   kosten 3-8 Euro), Hype und Risiko einer Einstiegsware. */
(function(){
  const p=P.feuerrad; if(!p) return;
  Object.assign(p,{lvl:5,cost:2.90,market:6.99,hype:9,risk:3});
  LIZENZEN.forEach(l=>{ const i=l.items.indexOf('feuerrad'); if(i>=0) l.items.splice(i,1); });
  const k=lizenzDaten('klassiker'); if(!k) return;
  if(k.items.indexOf('feuerrad')<0) k.items.push('feuerrad'); LIZ_VON.feuerrad='klassiker';
  k.desc='Die Ware, wegen der die Leute überhaupt kommen: der Furzböller, Schwärmer, die Drehsonne am Ständer, kleine Raketen und der Sekt für Mitternacht.';
})();

/* Bengalhoelzer (Toms PDF: "gerne da auch noch einen Gelben ... vielleicht
   auch Blau, diese vier Farben so nacheinander"): vier Farben statt Rot und
   Gruen - Name, Text und Druck ziehen mit (Kurzname bleibt) */
if(P.bengalholz) Object.assign(P.bengalholz,{name:'Bengalhölzer · 12 Zündhölzer in vier Farben',
  desc:'Vier Hölzer stecken im Halter. Ratsch – weiße Stichflamme, dann brennt eins nach dem anderen als kleine Laterne: Rot, Grün, Gelb, Blau, jedes verglimmt mit einem Rauchfaden.',
  art:Object.assign({},P.bengalholz.art,{sub:'12 Hölzer · 4 Farben'})});

/* Feuerteufel (Toms PDF: "die Fontaene soll aus zwei Loechern oben nach
   links und rechts kommen"): runde Huelse 8,4 cm mit zwei schraegen Duesen
   (Form 04g, FT_DUESE) - 12,5 cm breit ueber die Duesenmuendungen, 25 cm
   hoch (wie alle neuen Bodenprodukte 1,25-fach, GROESSER) */
if(P.feuerteufel) Object.assign(P.feuerteufel,{dims:[0.125,0.25,0.0875],
  desc:'Aus den zwei schrägen Düsen auf seinem Kopf wachsen zwei feurige Hörner, eins nach links, eins nach rechts, und fauchen immer höher. Zum Schluss lacht der Teufel dreimal knisternd.'});

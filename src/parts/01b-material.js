/* =========================================================
   Materialbibliothek (Fundament Etappe 2, Schritt 0)

   Tom 13.10.2026: "einheitliche Struktur – ändert man es an einer
   Stelle, ändert es sich überall." Farben, Materialien und geteilte
   prozedurale Texturen kommen ab jetzt von hier. Vorher legte jede
   Baufunktion ihre eigenen Materialien an (984 Material-Objekte, davon
   501 Dubletten, 59 fuer ein und dasselbe Gelb) und malte die
   Betontextur 19-mal neu.

   Regeln (verbindlich, siehe docs/fundament/baukasten.md):
   - Ein Material aus MAT.get/MAT.std/MAT.basic/MAT.vc ist GETEILT. Es wird
     nie veraendert (color.set, opacity, emissiveIntensity, map, visible,
     dispose ...). Wer ein Material spaeter aendern will, holt sich mit
     MAT.neu(...) ein eigenes.
   - Texturen aus MAT.tex(name) sind geteilt und kacheln mit repeat 1.
     Den Massstab traegt die Geometrie: MAT.kachel(geo,rx,ry) skaliert die
     UVs (gleiches Bild wie vorher texture.repeat.set(rx,ry)). Ausnahme Wandtexturen
     (fassade, lagerwand, trapezblech): Wand-UVs laufen in Metern, die Kachelgroesse
     steht im repeat - jede gehoert genau einem Rezept (wandFassade/wandLager/wandBlech).
   - Neue Farbe/neues Material: Eintrag in FARBE/REZEPT ergaenzen, nicht
     daneben neu bauen.
   - Grafikstufe: MAT.stufe() steht beim Laden fest. Ultra Low bekommt
     ueber den Lambert-Austausch in reuse-helpers.js automatisch einfache
     Materialien (MAT baut ueber THREE.MeshStandardMaterial).
   - Waechter: mit localStorage bb_matwache=1 (oder window.__MATWACHE vor
     dem Laden) meldet jedes geteilte Material, das doch veraendert wird,
     einen Eintrag in MAT.verstoesse (Test src/tests/material.js).
   ========================================================= */
const MAT=(function(){
  /* ---------- Farbpalette (sRGB-Hex, Name deutsch, wofuer, RAL-Bezug) ----------
     Materialangleichung 13.10. (Schritt 2, docs/fundament/angleichung.md): Jede Farbe steht fuer EINE
     Sache. Die vielen Fast-Gleichen (vorher 628 verschiedene Hex-Werte in den Weltdateien) sind auf
     diese Toene zusammengefuehrt. Ausgenommen: Feuerwerk, Produktverpackungen, Figuren, Laeden-Atlas,
     Licht-/Leuchtfarben und bewusste Zufallsvielfalt (Hausfassaden, Autos, Tueren). Eintrag:
     [hex, Name, wofuer, RAL-Bezug]. Werte = haeufigster Ton im Spiel, Signalgelb = echtes RAL 1003. */
  const PALETTE={
    tiefschwarz:      [0x0c0d10,'Tiefschwarz','Oeffnungen, Schlitze, Displays aus, Schattenfugen','≈ RAL 9005'],
    gummischwarz:     [0x1c1f24,'Gummischwarz','Gummi, Reifen, Kabel, Griffe, schwarze Kunststoffgehaeuse','≈ RAL 9011'],
    anthrazit:        [0x2a2e38,'Anthrazit','Rahmen, Geraete, Regalstaender, Tor- und Lampengehaeuse (Hausfarbe Technik)','≈ RAL 7016'],
    graphit:          [0x3a3f48,'Graphitgrau','Sockel, Maschinenteile, dunkle Bleche, Stadtsockel','≈ RAL 7024'],
    basaltgrau:       [0x59606b,'Basaltgrau','Zaunpfosten, Stahlprofile dunkel, Fuesse','≈ RAL 7012'],
    mittelgrau:       [0x6a7078,'Mittelgrau','Bleche, Abdeckungen, Rohre mittel','≈ RAL 7046'],
    silbergrau:       [0x8d939d,'Silbergrau','verzinkter Stahl: Gitter, Geländer, Pfosten, Traeger','≈ RAL 7001'],
    hellgrau:         [0xa8acb2,'Hellgrau','Beton hell, Stahl hell (Bandrollen, Achsen), Sockelschienen','≈ RAL 7038'],
    aluminium:        [0xc9ced6,'Aluminium','Alu-Profile, Kassentheken, Leisten, Chromteile','≈ RAL 9006'],
    lichtgrau:        [0xdcdfe4,'Lichtgrau','Regalboeden, helle Verkleidungen, Kunststoff hellgrau, Torblatt aller Ladetore (alter R1)','≈ RAL 7035'],
    weiss:            [0xe8ecf2,'Weiss','Decken, Putz, Kunststoff weiss, Schnee, Etiketten','≈ RAL 9016'],
    cremeweiss:       [0xf2efe6,'Cremeweiss','warme Weisstoene: Fensterbaenke, Putz warm, Papier','≈ RAL 9001'],
    steingrau:        [0x9a958c,'Steingrau','Naturstein, Pflaster, Mauerwerk warm','≈ RAL 7030'],
    signalgelb:       [0xf9a800,'Signalgelb','Warnfarbe: Anfahrschutz, Bodenmarkierung, Absperrgitter, Kran, Torantrieb','RAL 1003'],
    schildgold:       [0xffd23f,'Schildgold','Hausstil-Schrift und -Rahmen auf Nachtblau (Schilder, Logo, Automat) - vorher zwei Golds (#ffd23f, #f2c230)','–'],
    signalorange:     [0xed760e,'Signalorange','Blink-/Warnleuchten (Gehaeuse, Glas aus), Tasten, Traversen der Lagerregale','≈ RAL 2000'],
    signalrot:        [0xd8352a,'Signalrot','Not-Halt, Ampel rot (aus), rote Bedienteile, Markierung rot','≈ RAL 3020'],
    feuerrot:         [0xaf2b1e,'Feuerrot','Brandschutz: Hydrant, Feuerloescher; dunkle Rotteile','RAL 3000'],
    signalgruen:      [0x2f9e57,'Signalgruen','Ampel gruen (aus), Fluchtweg, gruene Bedienteile','≈ RAL 6024'],
    signalblau:       [0x2a5a9e,'Signalblau','blaue Bedienteile, Regalrahmen blau (Stuetzen Lagerregal), Hinweisschilder','≈ RAL 5005'],
    nachtblau:        [0x1b2340,'Nachtblau','Hausfarbe Schilder/Laden (mit Schildgold)','≈ RAL 5011'],
    tannengruen:      [0x2a4a33,'Tannengruen','Stadtmoebel gruen (Litfass, Baenke), Hecken-Kaesten','≈ RAL 6009'],
    holzPalette:      [0xc49a62,'Holz Palette','Europaletten, Kisten, helles Holz','–'],
    holzPaletteDunkel:[0xa9814e,'Holz Palette dunkel','Palettenkloetze, gealtertes Holz','–'],
    holzDunkel:       [0x4a3624,'Holz dunkel','Ladenfronten Holz, Tueren, Moebel dunkel','–'],
    wellpappe:        [0xc89b5c,'Wellpappe','Kartons, Packband braun','–'],
    messing:          [0xc9a14e,'Messing','Tuerklinken, Schluessel, Rahmen golden','–'],
    glasKlar:         [0xd6ecff,'Glas klar','Toenung fuer Glas (immer transparent)','–'],
    /* Anzeigen/LEDs an Geraeten (Einheit 15.10.): eigene Bedeutung - leuchtende Bedienanzeigen (Klasse leucht, unbeleuchtet) */
    anzeigeGruen:     [0x37d977,'Anzeige gruen','LED/Signalleuchte bereit/frei (Kasse, SB-Kasse, Automat)','–'],
    laserRot:         [0xd8262a,'Laser rot','Scannerlaser, rote Anzeige an Kassen','–'],
    anzeigeBlau:      [0x3b7fd0,'Anzeige blau','Display Kartenterminal, Bildschirm-Grundton','–'],
    /* Licht (nur emissive, nicht angeglichen - Licht-Paket 05p) */
    lampeWarm:        [0xfff0d0,'Lampenlicht warm','Leuchtflaechen warmweiss','–'],
    /* Fahrzeuglack (Autos 17.10., bk.auto): eigene Bedeutung - Pkw-Lacke wie auf deutschen Strassen (VDA/KBA 2024:
       Grau/Silber 33 %, Schwarz 26,6 %, Weiss 19,9 %, danach Blau, Rot, Gruen). Gewichte in bk.AUTOFARBEN. */
    autoSilber:       [0xa9adb2,'Lack Silber metallic','Pkw-Lack (Reflexsilber, Gewicht siehe bk.AUTOFARBEN)','–'],
    autoGrau:         [0x5a5f66,'Lack Grau metallic','Pkw-Lack (Mondstein-/Dunkelgrau, haeufigste Farbe)','–'],
    autoHellgrau:     [0x8e9399,'Lack Hellgrau','Pkw-Lack (Nardograu, uni)','–'],
    autoSchwarz:      [0x0f1114,'Lack Schwarz','Pkw-Lack (Deep Black Perleffekt)','–'],
    autoWeiss:        [0xe4e5e1,'Lack Weiss','Pkw-Lack (Reinweiss/Perlmutt)','–'],
    autoBlau:         [0x1c355c,'Lack Blau metallic','Pkw-Lack (Dunkelblau)','–'],
    autoRot:          [0x7e1418,'Lack Rot','Pkw-Lack (Kings Red)','–'],
    autoGruen:        [0x2c3f35,'Lack Gruen','Pkw-Lack (Dunkelgruen)','–'],
    autoBeige:        [0x8a7c66,'Lack Bronze','Pkw-Lack (Bronze/Beige metallic)','–']
  };
  const FARBE={}; for(const k in PALETTE) FARBE[k]=PALETTE[k][0];
  /* ---------- Oberflaechenklassen (statt freier roughness/metalness je Stelle) ---------- */
  const KLASSE={
    matt:      {r:0.9, m:0,    name:'matt',               wofuer:'Gummi, Beton, Holz, Pappe, Putz, Stoff'},
    kunststoff:{r:0.6, m:0,    name:'Kunststoff/Lack',    wofuer:'Kunststoff, seidenmatter Lack, Gehaeuse'},
    lackMetall:{r:0.5, m:0.3,  name:'Metall lackiert',    wofuer:'pulverbeschichtetes Blech, lackierte Rahmen'},
    stahl:     {r:0.42,m:0.6,  name:'Stahl',              wofuer:'verzinkter/blanker Stahl, Alu gebuerstet'},
    blank:     {r:0.28,m:0.85, name:'blank/Chrom',        wofuer:'Chrom, poliertes Alu, Messing'}
  };
  /* ---------- benannte Materialien (Rezepte) ----------
     f = Farbe (Name aus PALETTE oder Hex), k = Oberflaechenklasse (oder r/m), tex = Textur, sonst
     Material-Optionen; w = wofuer. Ein Rezept nur aus f+k ist dasselbe Objekt wie MAT.ober(f,k). */
  const REZEPT={
    gummi:            {f:'gummischwarz',k:'matt',      w:'Gummi, Reifen, Kabel, Puffer'},
    kunststoffSchwarz:{f:'gummischwarz',k:'kunststoff',w:'schwarze Kunststoffgehaeuse, Griffe'},
    lackAnthrazit:    {f:'anthrazit',k:'lackMetall',   w:'lackierte Rahmen, Geraete, Tor- und Lampengehaeuse'},
    stahlAnthrazit:   {f:'anthrazit',k:'stahl',        w:'dunkler Stahl (Profile, Achsen)'},
    anthrazitMatt:    {f:'anthrazit',k:'matt',         w:'matte dunkle Teile (Gummiplatten, Filz, Kunststoff matt)'},
    lackGraphit:      {f:'graphit',k:'lackMetall',     w:'lackierte Bleche graphit'},
    stahlGraphit:     {f:'graphit',k:'stahl',          w:'Maschinenstahl dunkel'},
    graphitMatt:      {f:'graphit',k:'matt',           w:'Sockel (Laden, Fassade, Stadt), matte dunkle Bleche'},
    kunststoffAnthrazit:{f:'anthrazit',k:'kunststoff', w:'Kunststoffgehaeuse anthrazit, Griffe, Blenden'},
    stahlMittel:      {f:'mittelgrau',k:'stahl',       w:'Stahl mittelgrau: Bleche, Rohre, Riffelblech-Rahmen'},
    kunststoffHellgrau:{f:'lichtgrau',k:'kunststoff',  w:'helle Kunststoffverkleidungen, Geraete hellgrau'},
    lackSchwarz:      {f:'gummischwarz',k:'lackMetall',w:'schwarz lackiertes Blech'},
    stahlVerzinkt:    {f:'silbergrau',k:'stahl',       w:'verzinkter Stahl: Gitter, Gelaender, Pfosten'},
    stahlHell:        {f:'hellgrau',k:'stahl',         w:'heller Stahl: Rollen, Achsen, Bleche hell'},
    chromHell:        {f:'hellgrau',k:'blank',         w:'Chrom, blanke Wellen'},
    aluBlank:         {f:'aluminium',k:'blank',        w:'Alu-Profile, Kassentheke, Leisten'},
    kunststoffWeiss:  {f:'weiss',k:'kunststoff',       w:'weisser Kunststoff, Geraete hell'},
    weissMatt:        {f:'weiss',k:'matt',             w:'Decken, Putz, Etiketten'},
    lackGelb:         {f:'signalgelb',k:'kunststoff',  w:'gelb lackiert: Anfahrschutz, Kran, Torantrieb'},
    markierungGelb:   {f:'signalgelb',k:'matt',        w:'Bodenmarkierung gelb'},
    lackRot:          {f:'signalrot',k:'kunststoff',   w:'Not-Halt, rote Bedienteile'},
    schildBlau:       {f:'nachtblau',k:'kunststoff',   w:'Schildtafeln Hausstil'},
    holzPalette:      {f:'holzPalette',k:'matt',       w:'Europalette, Kisten'},
    palette:          {f:0xffffff,tex:'palettenMarke',vertexColors:true,k:'matt',w:'Europalette EPAL (bk.palette): Holzton ueber Vertexfarben (Palette / Palette dunkel), Maserung und Brand (EPAL im Oval, IPPC/HT) aus dem Atlas palettenMarke; Alterung ueber die Instanzfarbe'},
    betonBoden:       {f:0xffffff,tex:'beton',k:'matt',w:'Beton innen: Lager-/Schleusenboden (Massstab per MAT.kachel)'},
    betonHof:         {f:'hellgrau',tex:'beton',k:'matt',w:'Beton aussen: Hof, Rampen, Gehweg-Platten'},
    gitterGelb:       {f:'signalgelb',tex:'drahtgitter',transparent:true,alphaTest:0.35,side:THREE.DoubleSide,k:'lackMetall',w:'gelbes Schweissgitter: Ladezonen-Absperrung (UV 0,2 m je Kachel)'},
    warnschraffur:    {f:0xffffff,tex:'warnschraffur',k:'kunststoff',w:'Warnschraffur: Torkanten, Torschienen, Warnstreifen (Massstab per MAT.kachel, 0,4 m je Kachel)'},
    zaunPfosten:      {f:'basaltgrau',k:'stahl',       w:'Doppelstabmatte: Pfosten, dunkle Stahlprofile'},
    zaunKappe:        {f:'graphit',k:'stahl',          w:'Doppelstabmatte: Kappen, Schellen'},
    zaunSockel:       {f:'hellgrau',k:'matt',          w:'Doppelstabmatte: Sockelschiene, Beton hell'},
    zaunGitter:       {f:0xffffff,tex:'doppelstab',transparent:true,alphaTest:0.35,side:THREE.DoubleSide,k:'stahl',w:'Doppelstabmatte (Textur)'},
    /* Waende (Fundament Schritt "Waende", 14.10.): je Wandart EIN Material, UV in Metern (die Wand-UVs laufen in
       Metern, der Massstab steht im repeat der Textur - jede dieser Texturen gehoert genau einem Material).
       Vorher wallBrickMat()/lagerWall/blechMat()/trimMat in 05-world und 05h mit freien Werten. Ladenwand
       (shopWall) bleibt eigen: Tapete waehlt der Spieler (05o). */
    /* Fassade (Fundament-Schritt 2, 16.10., Toms Fotos fassade-0910-*.jpg): weisse Sandwichpaneele quer, Deckbreite 1,0 m, Stossprofil
       alle 6 m, Befestigung an den Stuetzen (alle 3 m), Laufspuren. Der Sockel ist seit 16.10. ein eigenes Bauteil (bk.wand baut ihn
       an jede Aussenwand am Boden: Betonsockel 0,5 m + Abschlussprofil), nicht mehr in die Textur gemalt. */
    wandFassade:      {f:0xffffff,tex:'fassade',k:'matt',     w:'Aussenwand: Sandwichpaneele quer 1,0 m, Stossprofil alle 6 m, Schrauben an den Stuetzen, Laufspuren (Kachel 6 x 2 m)'},
    wandLager:        {f:0xffffff,tex:'lagerwand',k:'matt',   w:'Lagerwand innen: hell mit gelb-schwarzem Sockelband 35 cm (Kachel 2,6 x 3,6 m)'},
    wandBlech:        {f:0xffffff,tex:'trapezblech',k:'lackMetall',w:'Hallenwand aussen: Trapezblech, Sicke 0,4 m, Schraubreihe je Riegel 1,6 m, Laufspuren (Kachel 3,2 x 1,6 m)'},
    wandLaibung:      {f:'aluminium',k:'matt',     w:'Laibung (Stirnseiten an Oeffnungen), wenn die Wand keine eigene vorgibt'},
    wandPutz:         {f:'lichtgrau',k:'matt',     w:'Fensterlaibung heller Putz'},
    sockelAussen:     {f:0xffffff,tex:'sockelBeton',k:'matt',w:'Betonsockel/Spritzschutz 0,5 m vor jeder Aussenwand (Fassade, Trapezblech) - Struktur, Fuge alle 2 m, Spritzschmutz (Kachel 2 x 0,5 m)'},
    /* Hof- und Wandleuchten (bk.lampe mast/wand, 16.10.): Leuchtflaeche opal, nachts warmweiss - veraenderlich, nur ueber MAT.neu
       (bk.lampe holt EIN Material fuer alle Aussenleuchten und haengt es an lampMats). */
    lampeAussen:      {f:'lichtgrau',k:'kunststoff',emissive:LIN(0xfff0d0),emissiveIntensity:0,w:'Leuchtflaeche der Hof-/Mast-/Wandleuchten (opal, nachts warmweiss) - nur MAT.neu'},
    /* Tore (Fundament Schritt "Tore", 13.10.): ein Material fuer jedes Torblatt (Atlas-Textur torBlatt, Zeile je
       Paneltyp, Kleinteile ueber Vertexfarben auf der weissen Zeile) und die drei Zustandsleuchten. Die Leuchten
       sind veraenderlich (emissiveIntensity) - nur ueber MAT.neu(...) holen, nie MAT.get. */
    torBlatt:         {f:0xffffff,tex:'torBlatt',vertexColors:true,k:'lackMetall',w:'Torblatt aller Ladetore (Sektionen lichtgrau wie der alte R1, Lichtband, Warnstreifen) - Atlas torBlatt'},
    ampelRot:         {f:0x300808,emissive:LIN(0xff2a2a),emissiveIntensity:1.4,k:'kunststoff',w:'Torampel rot (Tor zu) - nur MAT.neu, Leuchtstaerke schaltet'},
    ampelGruen:       {f:0x082a12,emissive:LIN(0x3dff7a),emissiveIntensity:0,k:'kunststoff',w:'Torampel gruen (Tor offen) - nur MAT.neu, Leuchtstaerke schaltet'},
    /* Boden-Markierungen liegen 3-5 mm ueber dem Boden und schieben sich zusaetzlich per polygonOffset nach vorn. */
    freihalteflaeche: {f:0xffffff,tex:'freihalteschraffur',transparent:true,depthWrite:false,k:'matt',polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,w:'Freihalteflaeche am Boden: gelbe Schraffur 45° auf dem Belag (Versandbereich, kuenftige Stationen; UV in Metern / 0,4)'},
    bodenSchrift:     {f:0xffffff,k:'matt',transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,w:'Bodenschrift (ANLIEFERUNG, VERSANDHOF): eigene Textur je Text ueber bk.bodenmarkierung - nur MAT.neu mit map'},
    sperrflaeche:     {f:0xffffff,tex:'warnschraffur',k:'matt',polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,w:'Sperrflaeche gelb-schwarz am Boden (Warnschraffur, UV in Metern / 0,4)'},
    glasScheibe:      {f:'glasKlar',k:'blank',transparent:true,opacity:0.24,depthWrite:false,w:'Glasscheibe klar (Schaufenster, Tueren, Lagerfenster, Kuehlregal) - durchsichtig, getoent'},
    torWarn:          {f:0x3a2208,emissive:LIN(0xffb02a),emissiveIntensity:0,k:'kunststoff',w:'Rundumleuchte ueber dem Torantrieb (blinkt, solange das Tor faehrt) - nur MAT.neu'},
    /* Einheit (15.10., Regale/Kassen/Fenster/Tueren/Schilder/Bodenmarkierung, docs/fundament/einheit.md): vorher je Bauort eigene
       Materialien (pegMat, kasseRueckMat, _postM/_deckM in 06, coldGlass, Glas je Tuer/Fenster, regalPaketMat in 08b) */
    lochblech:        {f:0xffffff,tex:'lochblech',k:'kunststoff',w:'Rueckwand Verkaufsregal: pulverbeschichtetes Lochblech, Loch 5 cm (UV 0,4 m je Kachel); Farbe folgt der Wand - nur MAT.neu'},
    lochblechKasse:   {f:'lichtgrau',tex:'lochblech',k:'kunststoff',w:'Rueckwand Kassenregal: Lochblech lichtgrau wie die Kasse (UV 0,4 m je Kachel)'},
    regalStuetze:     {f:'signalblau',tex:'lochprofil',k:'lackMetall',w:'Stuetzen der Lagerregale: Lochprofil Signalblau (wie das Packmaterial-Regal), Kachel 2,34 m hoch (Lochabstand 10 cm)'},
    regalBoden:       {f:0xffffff,tex:'stahlboden',k:'stahl',w:'Fachboden Lagerregal: verzinkte Stahlblechauflage mit Kantung (Kachel = 0,8 m)'},
    regalPaket:       {f:0xffffff,tex:'regalPaket',k:'kunststoff',w:'Flachpaket eines Regals in Folie (LKW, getragen, abgestellt)'},
    gitterBox:        {f:'aluminium',tex:'drahtgitter',alphaTest:0.4,side:THREE.DoubleSide,k:'stahl',w:'Drahtgitter der Gitterbox (UV 0,2 m je Kachel); Farbe folgt dem Regalgestell - nur MAT.neu'},
    lichtleiste:      {f:'weiss',emissive:LIN(0xfff2dc),emissiveIntensity:0,k:'kunststoff',w:'Lichtleiste unter den Regalboeden - ein Material fuer alle Regale, das Upgrade Regallicht schaltet die Leuchtstaerke (nur MAT.neu)'},
    lichtleisteKuehl: {f:'weiss',emissive:LIN(0xd6ecff),emissiveIntensity:1.1,k:'kunststoff',w:'Kuehlschrank-Innenlicht (kaltweiss, immer an)'},
    etikett:          {f:0xffffff,k:'kunststoff',w:'bedrucktes Schild/Etikett mit eigener Textur (Hausstil-Schilder, Lagerplatz-Schild) - MAT.neu mit map, beleuchtet'},
    scannerGlas:      {f:'gummischwarz',tex:'scannerGlas',k:'blank',w:'Scannerscheibe in der Kassenplatte (Glas mit Kratzern)'},
    kassenTastatur:   {f:0xffffff,tex:'kassenTastatur',k:'kunststoff',w:'Kassentastatur (Tasten beschriftet, Summentaste gruen)'},
    kassenband:       {f:0xffffff,tex:'kassenband',k:'matt',w:'Laufband der Kasse (Gummi mit Rillen; eigene Kopie der Textur, weil sie laeuft - offset)'},
    fensterSchmutz:   {f:0xffffff,tex:'fensterSchmutz',transparent:true,opacity:0,depthWrite:false,k:'matt',w:'Schmutzschicht auf den Schaufenstern (Spielzustand S.grime, Deckkraft je Fenster) - nur MAT.neu'},
    /* Autos (17.10., bk.auto): vier Materialien fuer alle Pkw, Farbe je Ecke (Lack eingebacken). Lack/Glas/Chrom spiegeln die
       Strasse (Umgebung umgebungStrasse) und haben Klarlack (nur ab Niedrig, Ultra Low: Lambert). Nachts wird die Spiegelung
       gedimmt (bk.autoNacht) - deshalb nur MAT.neu. */
    autoLack:         {f:0xffffff,vertexColors:true,k:'lackMetall',physical:true,phys:{clearcoat:1,clearcoatRoughness:0.06},env:'umgebungStrasse',w:'Fahrzeuglack: lackiertes Blech mit Klarlack, Farbe je Ecke (Toene auto*) - nur MAT.neu (bk.autoNacht dimmt die Spiegelung)'},
    autoGlas:         {f:0xffffff,vertexColors:true,k:'blank',physical:true,phys:{clearcoat:1,clearcoatRoughness:0.02},env:'umgebungStrasse',w:'Autoscheiben, Leuchtenglaeser, Klavierlack-Blenden (B-Saeule, Fensterrahmen): spiegelnd, Toenung je Ecke - nur MAT.neu'},
    autoChrom:        {f:0xffffff,vertexColors:true,k:'blank',env:'umgebungStrasse',w:'Felgen, Zierleisten, Reflektoren der Scheinwerfer, Dachreling - nur MAT.neu'},
    autoGummi:        {f:0xffffff,vertexColors:true,k:'matt',bump:'reifenProfil',bumpScale:0.9,w:'Reifen (Profil als Relief, UV nur am Reifen), Kunststoff matt (Stossfaenger unten, Schweller, Radhaus), Fugen'},
    kennzeichen:      {f:0xffffff,tex:'kennzeichen',k:'kunststoff',w:'Kfz-Kennzeichen EU-Format 520 x 110 mm (16 Fantasie-Schilder als Atlas, Zelle per UV)'}
  };
  /* Vertexfarben-Klassen (Sammler, bk.sammler): Farbe je Ecke, Oberflaeche je Klasse */
  const VC_KLASSE={
    standard:{roughness:0.45},                                    /* vcMat (04-models): Ware, Paletten, V1 */
    lack:{roughness:0.34,metalness:0.06}, metall:{roughness:0.26,metalness:0.78},
    matt:{roughness:0.72,metalness:0.0}, glas:{roughness:0.08,metalness:0.35}
    /* leucht: MeshBasicMaterial ohne Tonemapping (unten) */
  };
  /* Oberflaechenklassen auch als Vertexfarben-Klasse (13.10., Tore): MAT.vc('stahl') hat dieselben Werte wie
     MAT.ober(...,'stahl') - Sammler-Bauteile sehen dann aus wie Einzelteile mit Bibliotheksmaterial. */
  for(const k of ['kunststoff','lackMetall','stahl','blank']) VC_KLASSE[k]={roughness:KLASSE[k].r,metalness:KLASSE[k].m};
  /* 14.10. (Paletten): Klasse matt (0,9) als Vertexfarben-Klasse - Holz, Pappe. Der alte Sammler-Name 'matt'
     (0,72, Gummi/Kunststoff matt) bleibt fuer die bestehenden Bauteile. */
  VC_KLASSE.stumpf={roughness:KLASSE.matt.r,metalness:KLASSE.matt.m};
  const VC_W={stumpf:'Sammler stumpf (= Klasse matt 0,9): Holz (Paletten), Pappe',kunststoff:'Sammler Kunststoff/Lack (Klasse kunststoff)',lackMetall:'Sammler Metall lackiert (Klasse lackMetall)',stahl:'Sammler Stahl (Klasse stahl)',blank:'Sammler blank/Chrom (Klasse blank)',standard:'Sammler Standard: Ware, Paletten',lack:'Sammler lackiert (Geraete, Rahmen)',metall:'Sammler Metall (Stahl, Alu, Chrom)',matt:'Sammler matt (Gummi, Kunststoff matt)',glas:'Sammler Glas/Display',leucht:'Sammler leuchtend (LEDs, Anzeigen, ohne Tonemapping)'};

  const cache=new Map(), texCache=new Map(), zaehler=new Map();
  const zaehle=(k)=>{ zaehler.set(k,(zaehler.get(k)||0)+1); };
  const hexVon=f=>typeof f==='string'?(FARBE[f]!==undefined?FARBE[f]:(()=>{ throw new Error('MAT: Farbe unbekannt: '+f); })()):f;

  /* ---------- Waechter (nur Pruefung, sonst aus) ---------- */
  let wacheAn=false; try{ wacheAn=!!window.__MATWACHE||localStorage.getItem('bb_matwache')==='1'; }catch(e){}
  const verstoesse=[];
  const WACH=['opacity','transparent','visible','emissiveIntensity','map','emissiveMap','alphaMap','roughness','metalness','side','depthWrite','depthTest','alphaTest','wireframe','vertexColors','color','emissive','polygonOffset','colorWrite','toneMapped','blending'];
  function melde(name,was){ if(verstoesse.length<200) verstoesse.push({name,was,stack:String(new Error().stack).split('\n').slice(2,7).join(' | ')}); }
  function bewacheFarbe(name,c,k){ if(!c||!c.isColor) return; for(const x of ['r','g','b']){ let v=c[x]; Object.defineProperty(c,x,{configurable:true,enumerable:true,get(){ return v; },set(n){ if(n!==v) melde(name,k+'.'+x); v=n; }}); } }
  function bewache(name,m){
    if(!wacheAn) return m;
    for(const k of WACH){ if(!(k in m)) continue; let v=m[k]; if(v&&v.isColor) bewacheFarbe(name,v,k);
      Object.defineProperty(m,k,{configurable:true,enumerable:true,get(){ return v; },set(n){ if(n!==v){ melde(name,k); if(n&&n.isColor) bewacheFarbe(name,n,k); } v=n; }}); }
    const d=m.dispose; m.dispose=function(){ melde(name,'dispose'); return d.apply(this,arguments); };
    return m;
  }

  /* ---------- Grafikstufe (beim Laden fest) ---------- */
  let _stufe=null;
  function stufe(){
    if(_stufe) return _stufe;
    const g=typeof GFX!=='undefined'?GFX:'hoch', p=(typeof GFX_PROFIL!=='undefined'&&GFX_PROFIL[g])||{tex:1,ani:4};
    const rang=typeof gfxRang==='function'?gfxRang(g):2;
    /* lod: 0 = Ultra Low (Kasten statt Fase, wenig Segmente), 1 = Niedrig..Hoch, 2 = ab Maximum */
    return _stufe={name:g,rang,tx:p.tex,kar:p.kar||256,aniso:p.ani,lambert:g==='ultralow',lod:g==='ultralow'?0:(rang>=3?2:1)};
  }

  /* ---------- Materialien ---------- */
  const RM=(R)=>{ const K=R.k?KLASSE[R.k]:null; if(R.k&&!K) throw new Error('MAT: Klasse unbekannt: '+R.k);
    return {roughness:R.r!==undefined?R.r:(K?K.r:0.85),metalness:R.m!==undefined?R.m:(K?K.m:0)}; };
  const NICHT_OPT={f:1,r:1,m:1,k:1,tex:1,w:1,physical:1,phys:1,env:1,bump:1};
  function ausRezept(name,extra){
    const R=REZEPT[name]; if(!R) throw new Error('MAT: Material unbekannt: '+name);
    const o=RM(R);
    for(const k in R) if(!NICHT_OPT[k]) o[k]=R[k];
    if(R.tex) o.map=texGet(R.tex);
    /* env = Umgebungsbild aus TEXTUR (Spiegelung), bump = Reliefkarte aus TEXTUR (Autos 17.10.) */
    if(R.env){ try{ o.envMap=texGet(R.env); }catch(e){} }
    if(R.bump) o.bumpMap=texGet(R.bump);
    /* physical: Klarlack (phys) nur ab Niedrig - Ultra Low tauscht Standard gegen Lambert (reuse-helpers) */
    const P=R.physical&&!stufe().lambert&&THREE.MeshPhysicalMaterial;
    if(P&&R.phys) Object.assign(o,R.phys);
    if(extra) Object.assign(o,extra);
    const m=P?new THREE.MeshPhysicalMaterial(o):new THREE.MeshStandardMaterial(o); m.color=LIN(hexVon(R.f)); return m;
  }
  /* Rezept nur aus Farbe + Klasse? Dann ist es dasselbe Objekt wie MAT.ober(f,k) */
  const reinesRezept=R=>{ for(const k in R) if(k!=='f'&&k!=='k'&&k!=='w') return false; return typeof R.f==='string'&&!!R.k; };
  const rezeptVon=new Map(); for(const n in REZEPT){ const R=REZEPT[n]; if(reinesRezept(R)) rezeptVon.set(R.f+'|'+R.k,n); }
  /* ein geteiltes Material je Schluessel; die Fabrik bleibt gemerkt (MAT.kopie) */
  const fabrik=new Map(), info=new Map();
  function geteilt(k,f,inf){ zaehle(k); let m=cache.get(k); if(!m){ m=bewache(k,f()); (m.userData||(m.userData={})).mat=k; cache.set(k,m); fabrik.set(k,f); if(inf) info.set(k,inf); } return m; }
  /* geteiltes benanntes Material */
  function get(name){ const R=REZEPT[name]; if(R&&reinesRezept(R)) return ober(R.f,R.k);
    return geteilt('get:'+name,()=>ausRezept(name),R?{rezept:name,farbe:typeof R.f==='string'?R.f:null,klasse:R.k||null,tex:R.tex||null,wofuer:R.w||''}:null); }
  /* geteiltes Material aus Palettenfarbe + Oberflaechenklasse (+ einfache Zusatzoptionen wie side) */
  function ober(f,k,o){ const K=KLASSE[k]; if(!K) throw new Error('MAT.ober: Klasse unbekannt: '+k); hexVon(f);
    const key=schluessel('ober',0,o).replace('ober:0','ober:'+f+'|'+k), n=!o&&rezeptVon.get(f+'|'+k);
    return geteilt(key,()=>{ const m=new THREE.MeshStandardMaterial(Object.assign({roughness:K.r,metalness:K.m},o||{})); m.color=LIN(hexVon(f)); return m; },
      {rezept:n||null,farbe:f,klasse:k,wofuer:n?REZEPT[n].w:''}); }
  /* eigenes (veraenderbares) Material aus Farbe + Klasse; extra darf alles (map, emissive ...) */
  function eigen(f,k,extra){ const K=KLASSE[k]; if(!K) throw new Error('MAT.eigen: Klasse unbekannt: '+k); zaehle('eigen:'+f+'|'+k);
    return std(hexVon(f),Object.assign({roughness:K.r,metalness:K.m},extra||{})); }
  /* eigenes (veraenderbares) Material nach Rezept - wird gezaehlt, nicht geteilt */
  function neu(name,extra){ zaehle('neu:'+name); return ausRezept(name,extra); }
  /* frische, eigene Kopie eines geteilten Materials (gleiche Werte, nicht bewacht) - z. B. fuer
     Pracht (03d), das je Ort (Spiegelboden, innen/aussen) eigene Werte setzt */
  function kopie(m){ const f=m&&m.userData&&fabrik.get(m.userData.mat); zaehle('kopie:'+(m&&m.userData&&m.userData.mat)); return f?f():m.clone(); }
  /* Schluessel aus einfachen Optionen; Texturen/Objekte sind nicht erlaubt (dann eigenes Material) */
  function schluessel(art,hex,o){ let s=art+':'+(hex>>>0).toString(16);
    if(o){ for(const k of Object.keys(o).sort()){ const v=o[k]; if(v!==null&&typeof v==='object') throw new Error('MAT.'+art+': Option '+k+' ist ein Objekt - dafuer MAT.neu/eigenes Material'); s+='|'+k+'='+v; } }
    return s; }
  /* geteiltes Standardmaterial nach Farbe + Optionen - gleiche Werte wie std(hex,o) */
  function stdGeteilt(hex,o){ return geteilt(schluessel('std',hex,o),()=>std(hex,o),{farbe:tonVon(hex),klasse:null,wofuer:''}); }
  function tonVon(hex){ for(const k in FARBE) if(FARBE[k]===hex) return k; return null; }
  /* geteiltes MeshBasicMaterial (Farbe wie new MeshBasicMaterial({color:hex}) - ohne Linearisierung) */
  /* eigenes unbeleuchtetes Bildmaterial (Schilder mit veraenderlichem Bild, Bildschirme, Preisschilder): Bild wird nicht vom Licht
     veraendert (kein Tonwert). Eigen, nicht geteilt - die Textur gehoert genau einer Stelle (Einheit 15.10., vorher
     new MeshBasicMaterial({map,toneMapped:false}) an ~30 Stellen) */
  function bild(map,o){ zaehle('bild'); return new THREE.MeshBasicMaterial(Object.assign({map,toneMapped:false},o||{})); }
  function basic(hex,o){ return geteilt(schluessel('basic',hex,o),()=>new THREE.MeshBasicMaterial(Object.assign({color:hex},o||{}))); }
  /* Vertexfarben-Material je Klasse */
  function vc(klasse){ const kl=klasse||'standard';
    return geteilt('vc:'+kl,()=>{ if(kl==='leucht') return new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
      const o=VC_KLASSE[kl]; if(!o) throw new Error('MAT.vc: Klasse unbekannt: '+kl); return new THREE.MeshStandardMaterial(Object.assign({vertexColors:true},o)); }); }
  function farbe(name){ return hexVon(name); }
  /* Farbe als CSS fuer Canvas-Texturen (Schilder, Markierungen): MAT.css('signalgelb') / MAT.css('signalgelb',0.5) */
  function css(name,a){ const h=hexVon(name); if(a===undefined) return '#'+(h>>>0).toString(16).padStart(6,'0'); return 'rgba('+(h>>16&255)+','+(h>>8&255)+','+(h&255)+','+a+')'; }

  /* ---------- geteilte prozedurale Texturen (lazy, einmal gemalt) ---------- */
  const TEXTUR_W={fassade:'Aussenwand Sandwichpaneele quer (Deckbreite 1,0 m, Mikrolinierung, Stossprofil alle 6 m, Schrauben an den Stuetzen alle 3 m, Laufspuren) - Kachel 6 x 2 m ueber repeat, Wand-UV in Metern',sockelBeton:'Betonsockel aussen 0,5 m (Poren, Fuge alle 2 m, Spritzschmutz unten, Schatten unter dem Abschlussprofil) - Kachel 2 x 0,5 m, Wand-UV in Metern',lichtfleck:'Hofleuchten nachts: links Lichtfleck am Boden (rund), rechts Lichtkegel (senkrechter Verlauf) - 128 x 64, additiv',lagerwand:'Lagerwand hell mit gelb-schwarzem Sockelband - Kachel 2,6 x 3,6 m ueber repeat',trapezblech:'Trapezblech Hallenwand, Sicke 0,4 m, Schraubreihe je Riegel, Laufspuren - Kachel 3,2 x 1,6 m ueber repeat',beton:'Beton (innen Lagerboden, aussen Hof) - eine Textur, Massstab ueber die UVs',doppelstab:'Doppelstabmatte (Zaeune, Absperrungen)',drahtgitter:'Drahtgitter/Schweissgitter (Gitterbox, Ladezonen-Absperrung) - Masche 5 cm, Farbe ueber das Material',warnschraffur:'Warnschraffur gelb/schwarz (Torkanten, Sperrflaechen, Bodenrahmen)',palettenMarke:'Paletten-Atlas 256 x 256: oben links Brand EPAL im Oval (Eck-Kloetze), oben rechts IPPC/HT-Stempel (Mittelkloetze), darunter Kiefern-Maserung (Streifen je Brett); Layout MAT.PALETTE_UV. Holzton kommt ueber Vertexfarben, Alterung ueber Instanzfarben',lochblech:'Lochblech hell (Rueckwand Verkaufs-/Kassenregal), Kachel 0,4 m = 8 x 8 Loecher',lochprofil:'Lochprofil der Lagerregal-Stuetzen, Kachel 2,34 m hoch (23 Loecher), neutral (Farbe ueber das Material)',stahlboden:'Stahlblechauflage Lagerregal mit Kantung',regalPaket:'Flachpaket eines Regals in Folie mit Etikett',fensterSchmutz:'Schmutz auf Schaufenstern (Regenschlieren, Fingerabdruecke), Deckkraft je Fenster',freihalteschraffur:'Freihalteflaeche gelbe Schraffur 45° (transparent), Kachel 0,4 m',scannerGlas:'Scannerscheibe der Kasse',kassenTastatur:'Kassentastatur 768 x 384',kassenband:'Kassen-Laufband (Rillen); die Kasse nimmt eine eigene Kopie, weil das Band laeuft',umgebungStrasse:'Spiegelungs-Panorama Strasse (Himmel, Horizont, Haeuserkante, Asphalt) als PMREM - Autolack/-glas/-chrom, Haeuserfenster, Parkteich',reifenProfil:'Reliefkarte Reifen (Flanke, Laufflaeche mit Rillen und Lamellen) 512 x 128, UV nur am Reifen',kennzeichen:'Kfz-Kennzeichen-Atlas 512 x 512: 16 Fantasie-Schilder EU-Format, Zelle 256 x 64',torBlatt:'Torblatt-Atlas aller Ladetore (Optik alter R1, Tom 14.10.): Zeile 0 glatte Sektion lichtgrau, 1 Lichtband (4 Scheiben), 2 unterstes Panel aussen (Griffmulde), 3 weiss (Kleinteile ueber Vertexfarben)'};
  /* Fassade (Fundament-Schritt 2, 16.10.; vorher Faserzementtafeln 1,18 m mit Punkten und gemaltem Sockel, Tom: "flache Platten
     mit Punkten"): Sandwichpaneele quer wie an Gewerbebauten - Deckbreite 1,0 m (Nut-Feder-Fuge mit Schattenkante), feine
     Mikrolinierung, Stossprofil (Alu) alle 6 m mit Schrauben, an der Zwischenstuetze (3 m) zwei Schrauben je Paneel, Laufspuren
     unter den Schrauben, leichte Wolkigkeit. Kachel 6 x 2 m, wiederholt in beide Richtungen (der Sockel ist eigenes Bauteil). */
  const FASS={b:6.0, h:2.0, paneel:1.0, stuetze:3.0};
  /* zufaellig, aber fest (gleiches Bild bei jedem Laden) */
  const zufall=s=>()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  /* auf einer kachelbaren Flaeche zeichnen: f(ox,oy) fuer die 9 Lagen, damit Ueberhaenge am Rand gegenueber wieder auftauchen */
  const rund=(W,H,f)=>{ for(const ox of [-W,0,W]) for(const oy of [-H,0,H]) f(ox,oy); };
  /* Laufspur: senkrechter Streifen nach unten, oben kraeftig, unten auslaufend */
  const spur=(g,x,y,b,l,a,ton)=>{ const gr=g.createLinearGradient(0,y,0,y+l); gr.addColorStop(0,'rgba('+ton+','+a+')'); gr.addColorStop(1,'rgba('+ton+',0)'); g.fillStyle=gr; g.fillRect(x-b/2,y,b,l); };
  /* Layout des Paletten-Atlas (Pixel im 256er-Bild, y von oben): EPAL-Brand 0..128 x 0..64, IPPC-Stempel 128..256 x 0..64,
     Maserung 72..252 (Streifen). Texel-Rand 1 px gegen Filterung in die Nachbarzelle. UV = [u0,v0,u1,v1] (v nach oben). */
  const PAL_UV=(()=>{ const N=256, uv=(x0,y0,x1,y1)=>[(x0+1)/N,1-(y1-1)/N,(x1-1)/N,1-(y0+1)/N];
    return {epal:uv(0,0,128,64),ippc:uv(128,0,256,64),maser:uv(0,72,256,252),maserY0:72,maserY1:252,N}; })();
  const TEXTUR={
    fassade:()=>{ const t=tex(1024,256,(g,W,H)=>{
        const mx=W/FASS.b, my=H/FASS.h, rnd=zufall(7), np=Math.round(FASS.h/FASS.paneel), ph=H/np;
        g.fillStyle='#cfd2cf'; g.fillRect(0,0,W,H);
        /* Wolkigkeit (sehr schwach, kachelbar) */
        for(let i=0;i<34;i++){ const x=rnd()*W, y=rnd()*H, r=40+rnd()*170, hell=rnd()<0.45, a=0.012+rnd()*0.022, q=0.35+rnd()*0.5, w=rnd()*3;
          rund(W,H,(ox,oy)=>{ g.fillStyle=hell?'rgba(255,255,255,'+a+')':'rgba(112,114,110,'+a+')'; g.beginPath(); g.ellipse(x+ox,y+oy,r,r*q,w,0,Math.PI*2); g.fill(); }); }
        /* je Paneel: Deckschale oben etwas heller, unten etwas dunkler (leicht gewoelbt), Ton je Paneel minimal anders */
        for(let i=0;i<np;i++){ const y0=i*ph, d=(rnd()-0.5)*0.04, gr=g.createLinearGradient(0,y0,0,y0+ph);
          gr.addColorStop(0,'rgba(255,255,255,'+(0.10+d).toFixed(3)+')'); gr.addColorStop(0.45,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(66,70,74,0.08)');
          g.fillStyle=gr; g.fillRect(0,y0,W,ph); }
        /* Mikrolinierung alle 10 cm (Licht von oben: helle Kante, darunter ein Hauch Schatten) */
        for(let y=0.05*my;y<H;y+=0.1*my){ g.fillStyle='rgba(255,255,255,.07)'; g.fillRect(0,Math.round(y),W,1); g.fillStyle='rgba(40,44,48,.045)'; g.fillRect(0,Math.round(y)+1,W,1); }
        /* Koernung */
        for(let i=0;i<9000;i++){ g.fillStyle=rnd()<0.5?'rgba(255,255,255,'+(0.02+rnd()*0.05).toFixed(3)+')':'rgba(86,90,94,'+(0.02+rnd()*0.05).toFixed(3)+')'; g.fillRect(rnd()*W,rnd()*H,1,1); }
        /* freie Laufspuren (lang, kachelbar) */
        for(let i=0;i<46;i++){ const x=rnd()*W, y=rnd()*H, l=(0.4+rnd()*1.5)*my, b=1+rnd()*2.5, a=(0.02+rnd()*0.04).toFixed(3);
          rund(W,H,(ox,oy)=>spur(g,x+ox,y+oy,b,l,a,'104,103,96')); }
        /* Paneelfuge (Nut-Feder): Schattenlinie, darunter weicher Schatten, darueber helle Lippe; etwas Schmutz auf der Lippe */
        const fuge=y=>{ g.fillStyle='rgba(255,255,255,.38)'; g.fillRect(0,y-3,W,1); g.fillStyle='rgba(98,96,88,.10)'; g.fillRect(0,y-2,W,1);
          g.fillStyle='rgba(38,42,46,.62)'; g.fillRect(0,y-1,W,2); g.fillStyle='rgba(38,42,46,.16)'; g.fillRect(0,y+1,W,2); g.fillStyle='rgba(38,42,46,.06)'; g.fillRect(0,y+3,W,2); };
        for(let i=0;i<=np;i++) fuge(Math.round(i*ph));
        /* Schraube mit Dichtscheibe (klein, nicht als Punktmuster: Kopf 8 mm, Scheibe 16 mm) und Laufspur darunter */
        const schraube=(x,y,spurL)=>{ if(spurL) spur(g,x,y+2,1.6,spurL,(0.05+rnd()*0.05).toFixed(3),'96,94,86');
          g.fillStyle='rgba(120,124,128,.45)'; g.beginPath(); g.arc(x,y,0.008*mx,0,Math.PI*2); g.fill();
          g.fillStyle='rgba(62,66,70,.8)'; g.beginPath(); g.arc(x,y,0.0045*mx,0,Math.PI*2); g.fill();
          g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(x-1,y-1.5,1,1); };
        /* Zwischenstuetze bei 3 m: zwei Schrauben je Paneel, 12 cm von den Fugen */
        for(let i=0;i<np;i++) for(const dy of [0.12,FASS.paneel-0.12]) schraube(W/2,Math.round(i*ph+dy*my),(0.15+rnd()*0.6)*my);
        /* Stossprofil (Alu, 6 cm) auf dem Kachelrand: helle Kante links, Schatten rechts und auf dem Paneel, Schrauben alle 50 cm */
        const pw=0.06*mx;
        rund(W,H,(ox,oy)=>{ if(oy) return; const x0=ox-pw/2;
          g.fillStyle='rgba(30,34,38,.10)'; g.fillRect(x0+pw,0,4,H);
          g.fillStyle='#bfc3c7'; g.fillRect(x0,0,pw,H);
          g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(x0,0,1.5,H);
          g.fillStyle='rgba(30,34,38,.35)'; g.fillRect(x0+pw-2,0,2,H);
          g.fillStyle='rgba(30,34,38,.12)'; g.fillRect(x0+pw*0.5,0,1,H); });
        for(let y=0.25*my;y<H;y+=0.5*my){ schraube(0,Math.round(y),(0.1+rnd()*0.4)*my); schraube(W,Math.round(y),0); }
      });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1/FASS.b,1/FASS.h); t.anisotropy=8; return t; },
    /* Betonsockel (16.10.): Sichtbeton grau, Poren und Koernung, Fuge alle 2 m, unten Spritzschmutz (dunkler Verlauf + Spritzer bis
       30 cm), oben der Schatten unter dem Abschlussprofil. UV in Metern ab Boden (v = Hoehe / 0,5 m), senkrecht nicht wiederholt. */
    sockelBeton:()=>{ const t=tex(256,64,(g,W,H)=>{ const rnd=zufall(13), my=H/0.5, mx=W/2;
        g.fillStyle='#a2a39f'; g.fillRect(0,0,W,H);
        for(let i=0;i<26;i++){ const x=rnd()*W, y=rnd()*H, r=8+rnd()*40, a=(0.03+rnd()*0.05).toFixed(3), hell=rnd()<0.5;
          rund(W,0,(ox,oy)=>{ if(oy) return; g.fillStyle=hell?'rgba(232,232,226,'+a+')':'rgba(70,70,66,'+a+')'; g.beginPath(); g.ellipse(x+ox,y,r,r*0.5,0,0,Math.PI*2); g.fill(); }); }
        for(let i=0;i<2600;i++){ g.fillStyle=rnd()<0.5?'rgba(255,255,255,'+(0.03+rnd()*0.09).toFixed(3)+')':'rgba(40,40,38,'+(0.03+rnd()*0.1).toFixed(3)+')'; g.fillRect(rnd()*W,rnd()*H,1,1); }
        /* Luftporen */
        for(let i=0;i<170;i++){ const x=rnd()*W, y=rnd()*H, r=0.4+rnd()*1.0; g.fillStyle='rgba(44,44,42,'+(0.35+rnd()*0.35).toFixed(2)+')'; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(x,y+r,1,1); }
        /* Spritzschmutz: dunkler Verlauf unten, Spritzer nach oben duenner */
        const sp=g.createLinearGradient(0,H-0.22*my,0,H); sp.addColorStop(0,'rgba(62,57,50,0)'); sp.addColorStop(0.7,'rgba(62,57,50,.22)'); sp.addColorStop(1,'rgba(52,48,42,.5)'); g.fillStyle=sp; g.fillRect(0,H-0.22*my,W,0.22*my);
        for(let i=0;i<1100;i++){ const h=Math.pow(rnd(),2.2)*0.32*my; g.fillStyle='rgba(58,53,46,'+(0.08+rnd()*0.22).toFixed(3)+')'; g.fillRect(rnd()*W,H-h-1,1+(rnd()<0.2?1:0),1); }
        /* Fuge alle 2 m (Kachelrand) */
        rund(W,0,(ox,oy)=>{ if(oy) return; g.fillStyle='rgba(46,46,44,.6)'; g.fillRect(ox-1,0,2,H); g.fillStyle='rgba(255,255,255,.22)'; g.fillRect(ox+1,0,1,H); });
        /* Laufspuren unter dem Profil */
        for(let i=0;i<14;i++) spur(g,rnd()*W,2,1+rnd()*2,(0.1+rnd()*0.3)*my,(0.04+rnd()*0.06).toFixed(3),'70,68,62');
        /* oben: Schatten unter dem Abschlussprofil */
        const so=g.createLinearGradient(0,0,0,5); so.addColorStop(0,'rgba(20,22,24,.5)'); so.addColorStop(1,'rgba(20,22,24,0)'); g.fillStyle=so; g.fillRect(0,0,W,5);
        void mx; });
      t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.ClampToEdgeWrapping; t.repeat.set(1/2,1/0.5); t.anisotropy=8; return t; },
    /* Hofleuchten nachts (16.10.): links Lichtfleck (rund, Mitte flach hell, weicher Rand), rechts Lichtkegel (oben hell, zum Boden
       auslaufend). Additiv gezeichnet - Schwarz traegt nichts bei. */
    lichtfleck:()=>tex(128,64,(g,W,H)=>{ g.fillStyle='#000'; g.fillRect(0,0,W,H);
        const r=g.createRadialGradient(32,32,0,32,32,31); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(0.3,'rgba(255,255,255,.82)'); r.addColorStop(0.65,'rgba(255,255,255,.3)'); r.addColorStop(1,'rgba(255,255,255,0)');
        g.fillStyle=r; g.fillRect(0,0,64,64);
        const k=g.createLinearGradient(0,0,0,H); k.addColorStop(0,'rgba(255,255,255,.34)'); k.addColorStop(0.3,'rgba(255,255,255,.13)'); k.addColorStop(1,'rgba(255,255,255,0)');
        g.fillStyle=k; g.fillRect(65,0,62,H); }),
    /* Lagerwand (vorher lagerWallTex in 05-world.js): hell, unten 35 cm Sockelband gelb/schwarz, Raumhoehe 3,6 m */
    lagerwand:()=>{ const WH=3.6, t=tex(32,512,(g,W,H)=>{ g.fillStyle='#a3a8b0'; g.fillRect(0,0,W,H); const b=Math.round(H*(1-0.35/WH)); for(let y=b;y<H;y+=16){ g.fillStyle=((y-b)/16)%2<1?css('signalgelb'):'#1f1f24'; g.fillRect(0,y,W,16);} });
      t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.ClampToEdgeWrapping; t.repeat.set(1/2.6,1/WH); return t; },
    /* Trapezblech (vorher blechMat() in 05h): eine Sicke je 32 px = 0,4 m; 16.10.: Schraubreihe am Riegel (alle 1,6 m) im Untergurt,
       Laufspuren darunter, leichte Wolkigkeit. Kachel 3,2 x 1,6 m */
    trapezblech:()=>{ const t=tex(256,128,(g,W,H)=>{ const rnd=zufall(5), my=H/1.6;
        g.fillStyle='#b9bec6'; g.fillRect(0,0,W,H);
        for(let x=0;x<W;x+=32){ const gr=g.createLinearGradient(x,0,x+32,0);
          gr.addColorStop(0.00,'#8f959e'); gr.addColorStop(0.16,'#cfd4da'); gr.addColorStop(0.42,'#e4e8ed'); gr.addColorStop(0.58,'#c4c9d1'); gr.addColorStop(0.84,'#9aa0a9'); gr.addColorStop(1.00,'#7d838c');
          g.fillStyle=gr; g.fillRect(x,0,32,H); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(x+12,0,2,H); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x+30,0,2,H); }
        for(let i=0;i<12;i++){ const x=rnd()*W, y=rnd()*H, r=20+rnd()*60, a=(0.015+rnd()*0.03).toFixed(3), hell=rnd()<0.5;
          rund(W,H,(ox,oy)=>{ g.fillStyle=hell?'rgba(255,255,255,'+a+')':'rgba(70,74,80,'+a+')'; g.beginPath(); g.ellipse(x+ox,y+oy,r,r*0.6,0,0,Math.PI*2); g.fill(); }); }
        for(let i=0;i<1800;i++){ g.fillStyle='rgba(0,0,0,'+(rnd()*0.05).toFixed(3)+')'; g.fillRect(rnd()*W,rnd()*H,2,2); }
        for(let i=0;i<20;i++){ const x=rnd()*W, y=rnd()*H, l=(0.3+rnd()*1.2)*my, a=(0.03+rnd()*0.05).toFixed(3); rund(W,H,(ox,oy)=>spur(g,x+ox,y+oy,1.5,l,a,'80,78,72')); }
        const ys=Math.round(0.12*my);
        for(let x=0;x<W;x+=32){ const sx=x+3; spur(g,sx,ys+2,1.4,(0.2+rnd()*0.5)*my,(0.05+rnd()*0.05).toFixed(3),'82,78,70');
          g.fillStyle='rgba(150,155,162,.6)'; g.beginPath(); g.arc(sx,ys,2.2,0,Math.PI*2); g.fill(); g.fillStyle='rgba(54,58,64,.85)'; g.beginPath(); g.arc(sx,ys,1.2,0,Math.PI*2); g.fill(); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1/3.2,1/1.6); t.anisotropy=8; return t; },
    /* Beton (vorher concreteTex() in 05b-ao.js, 19 Aufrufe an 12 Stellen) - Malcode unveraendert */
    beton:()=>{ const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#8a8e94'; g.fillRect(0,0,W,H); for(let i=0;i<2500;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.06})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=2; g.strokeRect(0,0,W,H); });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; },
    /* Doppelstabmatte (vorher gitterMat() in 05e-street.js, je Zaunlauf neu gemalt) - Malcode unveraendert */
    doppelstab:()=>{ const t=tex(256,256,(g,W,H)=>{
        g.clearRect(0,0,W,H);
        g.strokeStyle='#6f7783'; g.lineCap='round';
        /* senkrechte Einzelstaebe */
        g.lineWidth=7;
        for(let x=16;x<W;x+=51){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.stroke(); }
        /* waagerechte Doppelstaebe */
        g.lineWidth=6;
        for(let y=22;y<H;y+=51){
          g.strokeStyle='#848c98'; g.beginPath(); g.moveTo(0,y-5); g.lineTo(W,y-5); g.stroke();
          g.strokeStyle='#5f6672'; g.beginPath(); g.moveTo(0,y+5); g.lineTo(W,y+5); g.stroke();
        }
        /* Lichtkante oben auf den Staeben */
        g.strokeStyle='rgba(255,255,255,.3)'; g.lineWidth=2;
        for(let x=16;x<W;x+=51){ g.beginPath(); g.moveTo(x-2,0); g.lineTo(x-2,H); g.stroke(); }
      });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; },
    /* Drahtgitter (Schweissgitter), weiss, Farbe ueber das Material (13.10., vorher gitterTex() in 06 fuer die
       Gitterbox und vsGitterMat() in 05h fuer die Ladezone - zwei Malcodes, zwei Maschenweiten). Kachel = 4 Maschen,
       UV-Massstab 0,2 m je Kachel -> Masche 5 cm. */
    drahtgitter:()=>{ const t=tex(128,128,(g,W,H)=>{ g.clearRect(0,0,W,H); g.fillStyle='#ffffff';
        for(let x=0;x<W;x+=32){ g.fillRect(x,0,5,H); } for(let y=0;y<H;y+=32){ g.fillRect(0,y,W,5); }
        g.fillStyle='rgba(0,0,0,.35)'; for(let x=0;x<W;x+=32) g.fillRect(x+4,0,1,H); });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; },
    /* Warnschraffur 45 Grad, Signalgelb/Gummischwarz (13.10., vorher 4 eigene Malcodes in 05d, 05g,
       11e: gelb #f2c230, Streifen mal senkrecht, mal schraeg). Kachel = 0,4 m, zwei Streifenpaare
       -> Baender 10 cm. Massstab: MAT.kachel(geo, laenge/0.4, hoehe/0.4) */
    warnschraffur:()=>{ const t=tex(128,128,(g,W,H)=>{ g.fillStyle=css('gummischwarz'); g.fillRect(0,0,W,H); g.fillStyle=css('signalgelb');
        const P=W/2; for(let c=-2*W;c<2*W;c+=P){ g.beginPath(); g.moveTo(c,0); g.lineTo(c+P/2,0); g.lineTo(c+P/2-H,H); g.lineTo(c-H,H); g.closePath(); g.fill(); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t; },
    /* Torblatt-Atlas (Schritt Tore 13.10., Optik 14.10.): Tom 14.10. "Mach die Rolltore bitte so wie damals
       das allererste Rolltor, was man freischaltet. Das war grau ... auch von der Textur her hat mir das alte
       besser gefallen." = R1 an der Basisrampe bis V129 (05g buildTor): Sandwich-Sektionen glatt lichtgrau
       lackiert (MAT.ober('lichtgrau','lackMetall') auf den grossen Flaechen; torPanelMat lag nur auf den
       Stirnseiten), Lichtband aus vier hellen Scheiben 0,52 x 0,30 m im vorletzten Panel, unten aussen
       Griffmulde (der Warnstreifen 12 cm ist ein eigenes Teil mit MAT.get('warnschraffur'), wie am alten R1). Die graphitfarbene V1-Lamellenoptik von V130 ist verworfen (14.10.).
       Vier Zeilen je 128 px, Massstab fuer 3,26 x 0,6 m (andere Tore strecken): 0 glatte Sektion,
       1 Lichtband, 2 unterstes Panel aussen (Griffmulde), 3 weiss fuer Kleinteile ueber
       Vertexfarben. Zeilen waehlt bk.uvZeile(geo,zeile,innen,rand). */
    /* Paletten-Atlas (14.10., Schritt Paletten): weisse Grundflaeche, Holzton kommt aus den Vertexfarben (multipliziert).
       Brand dunkelbraun wie Brennstempel; Maserung Laengsstreifen + Jahresringe + wenige Astlocher. Saat fest: immer gleich. */
    palettenMarke:()=>{ const t=tex(256,256,(g,W,H)=>{
        let sd=1234567; const z=()=>{ sd=(sd*1103515245+12345)&0x7fffffff; return sd/0x7fffffff; };
        g.fillStyle='#ffffff'; g.fillRect(0,0,W,H);
        const Y0=PAL_UV.maserY0, Y1=PAL_UV.maserY1;
        /* Maserung: Streifen entlang x (Brettlaenge), je Brettband verschiedene Lage */
        for(let i=0;i<260;i++){ const y=Y0+z()*(Y1-Y0), x=z()*W, l=60+z()*190, a=0.05+z()*0.13;
          g.strokeStyle='rgba('+(96+z()*30|0)+','+(66+z()*20|0)+','+(34+z()*14|0)+','+a+')'; g.lineWidth=0.6+z()*1.4;
          g.beginPath(); g.moveTo(x,y); g.bezierCurveTo(x+l*0.3,y+(z()-0.5)*3,x+l*0.7,y+(z()-0.5)*3,x+l,y+(z()-0.5)*2); g.stroke(); }
        for(let y=Y0;y<Y1;y+=9+z()*7){ g.fillStyle='rgba(110,78,40,'+(0.04+z()*0.06)+')'; g.fillRect(0,y,W,1+z()*3); }
        for(let i=0;i<7;i++){ const x=z()*W, y=Y0+8+z()*(Y1-Y0-16), r=2+z()*3;
          g.fillStyle='rgba(84,56,28,.35)'; g.beginPath(); g.ellipse(x,y,r*1.8,r,0,0,Math.PI*2); g.fill();
          g.strokeStyle='rgba(110,78,40,.18)'; g.lineWidth=1; g.beginPath(); g.ellipse(x,y,r*3.2,r*1.7,0,0,Math.PI*2); g.stroke(); }
        const dunkel='rgba(38,26,16,.88)'; g.fillStyle=dunkel; g.strokeStyle=dunkel; g.textAlign='center'; g.textBaseline='middle';
        /* EPAL im Oval (Eck-Kloetze der 1200er-Seite) */
        g.lineWidth=4; g.beginPath(); g.ellipse(64,32,54,25,0,0,Math.PI*2); g.stroke();
        g.font='bold 31px "Barlow Condensed", Arial, sans-serif'; g.fillText('EPAL',64,33);
        /* IPPC/HT-Stempel (Mittelklotz): Rechteck, Laendercode, Behandlung, Herstellernummer */
        g.lineWidth=2; g.strokeRect(138,6,108,52);
        g.font='bold 15px Arial, sans-serif'; g.textAlign='left'; g.fillText('IPPC',144,17);
        g.font='bold 13px Arial, sans-serif'; g.fillText('DE-BY 4711',144,34);
        g.font='bold 20px Arial, sans-serif'; g.fillText('HT',144,49); g.font='9px Arial, sans-serif'; g.fillText('EPAL 4711 10 25',168,50);
        g.beginPath(); g.moveTo(228,12); g.lineTo(228,26); g.moveTo(228,16); g.lineTo(223,12); g.moveTo(228,16); g.lineTo(233,12); g.moveTo(228,21); g.lineTo(223,17); g.moveTo(228,21); g.lineTo(233,17); g.lineWidth=1.4; g.stroke(); });
      t.anisotropy=4; return t; },
    /* Lochblech (vorher pegMat in 06, Malcode unveraendert): neutral hell, Farbe ueber das Material. Kachel = 8 x 8 Loecher = 0,4 m (Loch 5 cm) */
    lochblech:()=>{ const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#f4f5f6'; g.fillRect(0,0,W,H);
        for(let i=0;i<1400;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'120,124,130'},${0.03+Math.random()*0.04})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
        for(let x=16;x<W;x+=32) for(let y=16;y<H;y+=32){ g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(x-3,y-4,7,9); g.fillStyle='#3a3d43'; g.fillRect(x-3,y-5,6,9); g.fillStyle='#6a6e76'; g.fillRect(x-3,y-5,6,2); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; },
    /* Lochprofil der Regalstuetzen (vorher holeT in rackMats, 06): jetzt neutral, Signalblau kommt ueber das Material. Kachel = ganze Profilbreite x 2,34 m (23 Loecher) */
    lochprofil:()=>{ const t=tex(64,512,(c,W,H)=>{
        c.fillStyle='#ffffff'; c.fillRect(0,0,W,H);
        c.fillStyle='rgba(255,255,255,.16)'; c.fillRect(0,0,6,H);
        c.fillStyle='rgba(0,0,0,.24)'; c.fillRect(W-7,0,7,H);
        for(let y=10;y<H-8;y+=22){ c.fillStyle='#7a8496'; c.fillRect(W/2-7,y,14,11); c.fillStyle='rgba(0,0,0,.45)'; c.fillRect(W/2-7,y+9,14,2); }
        for(let i2=0;i2<700;i2++){ c.fillStyle=`rgba(0,0,0,${Math.random()*0.07})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; },
    /* Stahlblechauflage Lagerregal (vorher boardT in rackMats, 06, Malcode unveraendert) */
    stahlboden:()=>{ const t=tex(256,256,(c,W,H)=>{
        const g0=c.createLinearGradient(0,0,0,H); g0.addColorStop(0,'#9aa1ac'); g0.addColorStop(0.45,'#aeb5c0'); g0.addColorStop(1,'#8f959f');
        c.fillStyle=g0; c.fillRect(0,0,W,H);
        for(let x=0;x<W;x+=64){ c.fillStyle='rgba(255,255,255,.08)'; c.fillRect(x,0,2,H); c.fillStyle='rgba(0,0,0,.08)'; c.fillRect(x+2,0,2,H); }
        for(let i2=0;i2<600;i2++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.035})`; c.fillRect(Math.random()*W,Math.random()*H,2,2); }
        c.fillStyle='rgba(40,46,56,.22)'; c.fillRect(0,0,W,4); c.fillRect(0,H-4,W,4); });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t; },
    /* Flachpaket Regal (vorher regalPaketMat in 08b, Malcode unveraendert) */
    regalPaket:()=>tex(256,128,(c,W,H)=>{
        c.fillStyle='#b9bec6'; c.fillRect(0,0,W,H);
        for(let i=0;i<900;i++){ c.fillStyle=`rgba(255,255,255,${Math.random()*0.16})`; c.fillRect(Math.random()*W,Math.random()*H,rand(4,22),1); }
        c.fillStyle=css('anthrazit'); c.fillRect(W*0.22,0,8,H); c.fillRect(W*0.72,0,8,H);
        c.fillStyle=css('cremeweiss'); c.fillRect(W*0.34,H*0.28,W*0.32,H*0.44);
        c.strokeStyle='#8f959e'; c.lineWidth=2; c.strokeRect(W*0.34,H*0.28,W*0.32,H*0.44);
        c.fillStyle=css('nachtblau'); c.font=BUN(15); c.textAlign='center'; c.textBaseline='middle';
        c.fillText('REGALBAU',W*0.5,H*0.42);
        c.fillStyle='#5a6070'; c.font=BAR(13); c.fillText('Stegemann',W*0.5,H*0.58); }),
    /* Schmutz auf Schaufenstern (vorher grimeTex in 05f, Malcode unveraendert): Kachel = halbe Fensterbreite (UV 2 x 1) */
    fensterSchmutz:()=>{ const t=tex(256,128,(g,W,H)=>{
        g.clearRect(0,0,W,H); g.fillStyle='rgba(176,168,150,.5)'; g.fillRect(0,0,W,H);
        for(let i=0;i<900;i++){ g.fillStyle=`rgba(120,110,92,${Math.random()*0.35})`; g.fillRect(Math.random()*W,Math.random()*H,rand(1,4),rand(1,4)); }
        for(let i=0;i<26;i++){ const x=Math.random()*W, w=rand(2,9); const gr=g.createLinearGradient(x,0,x,H); gr.addColorStop(0,'rgba(90,84,70,.34)'); gr.addColorStop(1,'rgba(90,84,70,0)'); g.fillStyle=gr; g.fillRect(x,0,w,H); }
        g.strokeStyle='rgba(210,205,190,.3)'; g.lineWidth=7;
        for(let i=0;i<7;i++){ g.beginPath(); const y=rand(10,H-10); g.moveTo(0,y); g.bezierCurveTo(W*0.3,y+rand(-14,14),W*0.7,y+rand(-14,14),W,y+rand(-10,10)); g.stroke(); }
        for(let i=0;i<14;i++){ g.fillStyle='rgba(150,142,120,.26)'; g.beginPath(); g.ellipse(Math.random()*W,Math.random()*H,rand(3,6),rand(4,8),Math.random(),0,Math.PI*2); g.fill(); }
        const eg=g.createLinearGradient(0,H,0,H-26); eg.addColorStop(0,'rgba(90,82,66,.45)'); eg.addColorStop(1,'rgba(90,82,66,0)'); g.fillStyle=eg; g.fillRect(0,H-26,W,26); });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; },
    /* Freihalteschraffur (Einheit 15.10., vorher reserveTex in 05h je Flaeche neu gemalt): gelbe Linien 45° auf transparent, Kachel 0,4 m */
    freihalteschraffur:()=>{ const t=tex(128,128,(g,W,H)=>{ g.clearRect(0,0,W,H); g.strokeStyle=css('signalgelb',0.6); g.lineWidth=11;
        for(let d=-W;d<=2*W;d+=W){ g.beginPath(); g.moveTo(d,H); g.lineTo(d+H,0); g.stroke(); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t; },
    /* Kasse (vorher in buildCheckout, 06, Malcode unveraendert): Scannerscheibe, Tastatur, Laufband */
    scannerGlas:()=>tex(512,512,(g,W,H)=>{
        g.fillStyle='#10141c'; g.fillRect(0,0,W,H);
        const gl=g.createLinearGradient(0,0,W*0.7,H);
        gl.addColorStop(0,'rgba(210,226,244,.24)'); gl.addColorStop(0.35,'rgba(210,226,244,.05)'); gl.addColorStop(0.62,'rgba(210,226,244,.14)'); gl.addColorStop(1,'rgba(210,226,244,.03)');
        g.fillStyle=gl; g.fillRect(0,0,W,H);
        for(let i=0;i<70;i++){ g.strokeStyle=`rgba(230,238,250,${rand(0.02,0.07)})`; g.lineWidth=rand(0.6,1.6); const x=Math.random()*W, y=Math.random()*H; g.beginPath(); g.moveTo(x,y); g.lineTo(x+rand(-70,70),y+rand(-18,18)); g.stroke(); }
        for(let i=0;i<900;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.035})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } }),
    kassenTastatur:()=>{ const t=tex(768,384,(g,W,H)=>{
        g.fillStyle='#1b1f28'; g.fillRect(0,0,W,H);
        const cols=8, rows=4, mx=26, my=22, cw=(W-mx*2)/cols, ch=(H-my*2)/rows;
        const label=['7','8','9','STORNO','4','5','6','KARTE','1','2','3','BAR','0','00',',','SUMME'];
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
          const x=mx+c*cw+3, y=my+r*ch+3, w=cw-6, h=ch-6, isFn=c>=6, isSum=(r===3&&c>=6);
          g.fillStyle='rgba(0,0,0,.55)'; g.fillRect(x+2,y+3,w,h);
          const base=isSum?'#2f7a48':isFn?'#3d4658':'#e8e9ec', top=isSum?'#3f9a5c':isFn?'#4e596e':'#f7f8fa';
          const gr=g.createLinearGradient(0,y,0,y+h); gr.addColorStop(0,top); gr.addColorStop(1,base); g.fillStyle=gr; g.fillRect(x,y,w,h);
          g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(x,y,w,2); g.fillStyle='rgba(0,0,0,.22)'; g.fillRect(x,y+h-2,w,2);
          const t2=label[(r*4+(c%4))%label.length]; g.fillStyle=isFn||isSum?'#eef2f8':'#1b1f28'; g.textAlign='center'; g.textBaseline='middle'; g.font=BAR(t2.length>3?15:26); g.fillText(t2,x+w/2,y+h/2+1); }
        g.strokeStyle='#0f1218'; g.lineWidth=10; g.strokeRect(5,5,W-10,H-10);
        for(let i=0;i<500;i++){ g.fillStyle=`rgba(255,255,255,${Math.random()*0.03})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } });
      t.anisotropy=8; return t; },
    kassenband:()=>{ const t=tex(512,256,(g,W,H)=>{
        g.fillStyle='#17181d'; g.fillRect(0,0,W,H);
        for(let x=0;x<W;x+=26){ g.fillStyle='#252830'; g.fillRect(x,0,11,H); g.fillStyle='rgba(255,255,255,.07)'; g.fillRect(x+11,0,2,H); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(x+24,0,2,H); }
        for(let i=0;i<5200;i++){ const v=Math.random(); g.fillStyle=`rgba(${v<0.5?0:255},${v<0.5?0:255},${v<0.5?0:255},${Math.random()*0.05})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); }
        for(let i=0;i<22;i++){ g.fillStyle=`rgba(0,0,0,${rand(0.05,0.14)})`; g.beginPath(); g.ellipse(Math.random()*W,Math.random()*H,rand(6,22),rand(4,12),Math.random()*3,0,Math.PI*2); g.fill(); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; },
    torBlatt:()=>{ const t=tex(512,512,(c,W,H)=>{ const RH=H/4, M=W/3.26, MV=RH/0.588;
        const sektion=y0=>{ c.fillStyle=css('lichtgrau'); c.fillRect(0,y0,W,RH);
          /* Fuge: Nut oben, Feder unten (am alten Tor eigene Profile im Spalt) */
          c.fillStyle='rgba(60,66,76,.22)'; c.fillRect(0,y0+2,W,2); c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(0,y0+RH-4,W,2); };
        sektion(0);
        sektion(RH); for(const z of [-1.2,-0.4,0.4,1.2]){ const w=0.52*M, h=0.3*MV, x=(z+1.63)*M-w/2, y=RH+(RH-h)/2;
          c.fillStyle='rgba(255,255,255,.45)'; c.fillRect(x,y,w,h); c.fillStyle='rgba(0,0,0,.05)'; c.fillRect(x,y+h-1,w,1); }
        sektion(2*RH); { const y0=2*RH, yb=y0+RH-2;
          /* Griffmulde 0,5 x 0,09 m, Mitte 6 cm ueber der Panelmitte */
          c.fillStyle=css('basaltgrau'); c.fillRect(W/2-0.25*M,y0+RH/2-0.06*MV-0.045*MV,0.5*M,0.09*MV);
          /* Warnstreifen darunter: eigenes Teil mit MAT.get('warnschraffur') (eine Schraffur fuer alles) */ }
        c.fillStyle='#ffffff'; c.fillRect(0,3*RH,W,RH); });
      t.anisotropy=8; return t; },
    /* Autos (17.10., bk.auto; vorher autoUmgebung/autoReifenRelief/autoSchildMat in 05e) */
    umgebungStrasse:()=>{
      /* Panorama Himmel - heller Horizont - Haeuserkante - Strasse; als PMREM vorgefiltert. Ohne Umgebung spiegelt Lack nichts
         und Lack und Scheiben verschwimmen zu einer dunklen Masse (Tom 26.09.). Auch Haeuserfenster und Parkteich nutzen es. */
      const rnd=zufall(17);
      const t=tex(512,256,(g,W,H)=>{
        const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#7f9cbc'); gr.addColorStop(0.44,'#dfe8f1'); gr.addColorStop(0.5,'#f6f8fa');
        gr.addColorStop(0.52,'#4a4e55'); gr.addColorStop(1,'#1c1e22'); g.fillStyle=gr; g.fillRect(0,0,W,H);
        for(let x=0;x<W;){ const w=8+rnd()*30, h=10+rnd()*48; g.fillStyle='rgb('+(60+rnd()*50|0)+','+(64+rnd()*50|0)+','+(72+rnd()*50|0)+')';
          g.fillRect(x,H*0.5-h,w,h); x+=w+rnd()*6; }
        g.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<5;i++) g.fillRect(rnd()*W,H*0.08+rnd()*H*0.2,40,6); });
      t.mapping=THREE.EquirectangularReflectionMapping;
      try{ if(THREE.PMREMGenerator&&typeof renderer!=='undefined'&&renderer){ const pm=new THREE.PMREMGenerator(renderer), e=pm.fromEquirectangular(t).texture; pm.dispose(); if(e) return e; } }catch(e){}
      return t; },
    reifenProfil:()=>tex(512,128,(g,W,H)=>{
      /* Relief fuer den Reifen: v 0..0.25 innere Flanke, 0.25..0.75 Laufflaeche (Laengsrillen, Querrillen an den Schultern,
         Lamellen), 0.75..1 aeussere Flanke mit Ring an der Felgenschulter */
      const Y=v=>(1-v)*H;
      g.fillStyle='#808080'; g.fillRect(0,0,W,H);
      g.fillStyle='#c8c8c8'; g.fillRect(0,Y(0.75),W,Y(0.25)-Y(0.75));
      g.fillStyle='#2a2a2a'; for(const v of [0.37,0.5,0.63]) g.fillRect(0,Y(v+0.018),W,Y(v-0.018)-Y(v+0.018));
      const n=56;
      for(let k=0;k<n;k++){ const x=k/n*W; g.fillStyle='#2a2a2a';
        g.beginPath(); g.moveTo(x,Y(0.25)); g.lineTo(x+3,Y(0.25)); g.lineTo(x+6,Y(0.355)); g.lineTo(x+3,Y(0.355)); g.fill();
        g.beginPath(); g.moveTo(x+4,Y(0.645)); g.lineTo(x+7,Y(0.645)); g.lineTo(x+10,Y(0.75)); g.lineTo(x+7,Y(0.75)); g.fill();
        g.fillStyle='#6a6a6a'; g.fillRect(x+4,Y(0.48),1.5,Y(0.39)-Y(0.48)); g.fillRect(x+1,Y(0.61),1.5,Y(0.52)-Y(0.61)); }
      g.fillStyle='#868686'; g.fillRect(0,Y(0.965),W,Y(0.955)-Y(0.965)); },false),
    kennzeichen:()=>tex(512,512,(g)=>{
      /* 16 Fantasie-Kennzeichen (EU-Format: blaues Feld mit Sternenkranz und D, schwarze Schrift auf Weiss), je Zelle 256 x 64 */
      const orte=['B','M','HH','K','F','S','D','KA','HD','MZ','WI','DO','E','BO','AC','OS'], AZ='ABCDEFGHKLMNPRSTUVWXYZ';
      for(let n=0;n<16;n++){ const cx=(n%2)*256, y0=Math.floor(n/2)*64+4, w=256, h=55;
        g.fillStyle='#1a1a1a'; g.fillRect(cx,y0,w,h);
        g.fillStyle='#f3f3ee'; g.fillRect(cx+2,y0+2,w-4,h-4);
        g.fillStyle='#1d43b0'; g.fillRect(cx+3,y0+3,22,h-6);
        g.fillStyle='#ffd400'; for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; g.fillRect(cx+13.5+Math.cos(a)*6.5,y0+17+Math.sin(a)*6.5,1.8,1.8); }
        g.fillStyle='#fff'; g.font='bold 15px Arial, sans-serif'; g.textAlign='center'; g.fillText('D',cx+14,y0+h-8);
        const nr=orte[n]+' '+AZ[(n*7+3)%AZ.length]+AZ[(n*5+11)%AZ.length]+' '+(100+((n*733+219)%8900));
        g.fillStyle='#111'; g.textAlign='center';
        fitFont(g,nr,w-40,44,q=>'600 '+q+'px "Barlow Condensed","Arial Narrow",Arial,sans-serif');
        g.fillText(nr,cx+26+(w-30)/2,y0+h-12); } })
  };
  function texGet(name){ zaehle('tex:'+name); let t=texCache.get(name); if(!t){ const f=TEXTUR[name]; if(!f) throw new Error('MAT.tex: Textur unbekannt: '+name); t=f(); t.userData=t.userData||{}; t.userData.mat=name; texCache.set(name,t); } return t; }
  /* ---------- Textur-Atlas mit Zellen (14.10., Schritt "Paletten + Kartons") ----------
     Viele gleich grosse Einzelbilder (z. B. ein Versandkarton je Produkt, vorher 239 eigene
     256er-Texturen = 62,7 MB Bilddaten, alle schon beim Start gemalt) teilen sich wenige
     Atlasseiten. Eine Zelle wird erst gemalt, wenn ihr Schluessel zum ersten Mal gebraucht
     wird; eine Seite (Standard 1024 x 1024) entsteht erst mit ihrer ersten Zelle.
     Grafikstufe: Zellgroesse = zelle * min(1, MAT.stufe().tx) - Ultra Low halbe Aufloesung
     (gemalt wird immer in voller Groesse und verkleinert, Motiv und Aufteilung bleiben gleich).
       const A=MAT.atlas('karton',{zelle:256,seite:1024,malen:(g,W,H,key)=>{...},wofuer:'...'});
       A.material(key,{roughness:..})  eigenes Material je Schluessel (gecacht), map = Atlasseite,
                                       die Zelle waehlt ein Uniform (atlasZ) im Vertexshader -
                                       alle Zellen teilen ein Shaderprogramm
       A.zelle(key) -> {tex,z,seite,x,y}   A.bild(key) -> ImageData der Zelle   A.info()
     Seiten sind ImageData (wie texSpar), nie Canvas: kein zweiter Bildspeicher im Browser.
     Ein Atlas-Material nie mit MAT.kopie/clone kopieren (der Shader-Baustein haengt an
     onBeforeCompile) - es ist ohnehin ein eigenes Material je Schluessel. */
  const atlasListe=new Map();
  const ATLAS_VS_KOPF='uniform vec4 atlasZ;\n';
  const ATLAS_UV='#ifdef USE_UV\n\tvUv = ( uvTransform * vec3( uv * atlasZ.zw + atlasZ.xy, 1 ) ).xy;\n#endif';
  /* Shader-Baustein: auch Pracht (03d) ruft ihn, wenn es ein Atlas-Material veredelt */
  function atlasPatch(sh,m){ const z=m&&m.userData&&m.userData.atlasZ; if(!z) return;
    sh.uniforms.atlasZ=z;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+ATLAS_VS_KOPF).replace('#include <uv_vertex>',ATLAS_UV); }
  function atlasObc(sh){ atlasPatch(sh,this); }
  function atlas(name,o){
    let A=atlasListe.get(name); if(A) return A;
    /* Zellgroesse: o.stufenZelle = Name eines Wertes aus MAT.stufe() (z. B. 'kar', Pixel je Stufe aus GFX_PROFIL),
       sonst zelle * min(1, tx). voll = Malgroesse des Motivs (Koordinaten 256); ist die Zelle groesser, wird der
       Malcode skaliert (Vektoren/Schrift scharf, kein Hochziehen eines kleinen Bildes). */
    const st=stufe(), voll=o.zelle||256, ziel=(o.stufenZelle&&st[o.stufenZelle])||Math.round(voll*Math.min(1,st.tx||1)), cs=Math.max(32,ziel), mal=Math.max(voll,cs), S=o.seite||1024, je=Math.floor(S/cs);
    const seiten=[], zellen=new Map(), mats=new Map();
    let malC=null, malG=null, kleinC=null, kleinG=null;
    const leinwand=()=>{ if(malC) return; malC=document.createElement('canvas'); malC.width=malC.height=mal; malG=malC.getContext('2d');
      if(cs!==mal){ kleinC=document.createElement('canvas'); kleinC.width=kleinC.height=cs; kleinG=kleinC.getContext('2d'); kleinG.imageSmoothingEnabled=true; kleinG.imageSmoothingQuality='high'; } };
    function neueSeite(){ const im=new ImageData(S,S), t=new THREE.CanvasTexture(im);
      t.anisotropy=typeof GFX_START!=='undefined'?GFX_START.ani:st.aniso; t.encoding=THREE.sRGBEncoding; t.userData={mat:'atlas:'+name,atlas:name,seite:seiten.length};
      const s={im,t,n:0}; seiten.push(s); return s; }
    function zelle(key){
      let Z=zellen.get(key); if(Z) return Z;
      let s=seiten[seiten.length-1]; if(!s||s.n>=je*je) s=neueSeite();
      const i=s.n++, x=(i%je)*cs, y=Math.floor(i/je)*cs;
      leinwand(); malC.width=mal;   /* setzt Zustand (Schrift, Ausrichtung, Linien) und Bild zurueck - wie eine frische Leinwand */
      if(mal!==voll) malG.scale(mal/voll,mal/voll);
      o.malen(malG,voll,voll,key);
      let d; if(kleinC){ kleinG.clearRect(0,0,cs,cs); kleinG.drawImage(malC,0,0,cs,cs); d=kleinG.getImageData(0,0,cs,cs).data; } else d=malG.getImageData(0,0,cs,cs).data;
      const ziel=s.im.data; for(let r=0;r<cs;r++) ziel.set(d.subarray(r*cs*4,(r+1)*cs*4),((y+r)*S+x)*4);
      s.t.needsUpdate=true;
      /* flipY: Bildzeile 0 liegt oben (v = 1). Halbes Texel Rand, damit die Filterung nicht in die Nachbarzelle greift */
      const z=new THREE.Vector4((x+0.5)/S,1-(y+cs-0.5)/S,(cs-1)/S,(cs-1)/S);
      Z={key,tex:s.t,z,seite:seiten.indexOf(s),x,y}; zellen.set(key,Z); zaehle('atlas:'+name); return Z; }
    function material(key,extra){
      let m=mats.get(key); if(m) return m; const Z=zelle(key);
      m=new THREE.MeshStandardMaterial(Object.assign({roughness:KLASSE.matt.r,metalness:KLASSE.matt.m},extra||{},{map:Z.tex}));
      m.userData.atlas=name; m.userData.atlasZ={value:Z.z}; m.onBeforeCompile=atlasObc;
      mats.set(key,m); return m; }
    function bild(key){ const Z=zelle(key), s=seiten[Z.seite], out=new ImageData(cs,cs);
      for(let r=0;r<cs;r++) out.data.set(s.im.data.subarray(((Z.y+r)*S+Z.x)*4,((Z.y+r)*S+Z.x+cs)*4),r*cs*4);
      return out; }
    function info(){ return {name,zelle:cs,zelleVoll:voll,seite:S,jeSeite:je*je,seiten:seiten.length,zellen:zellen.size,materialien:mats.size,
      bytes:seiten.length*S*S*4,wofuer:o.wofuer||''}; }
    A={name,zelle,material,bild,info,hat:k=>zellen.has(k),schluessel:()=>[...zellen.keys()],seiten:()=>seiten.map(s=>s.t)};
    atlasListe.set(name,A); return A;
  }
  /* Massstab in die UVs (statt texture.repeat) - dann teilen alle Flaechen eine Textur */
  function kachel(geo,rx,ry){ const uv=geo.attributes.uv; if(!uv) return geo; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*rx,uv.getY(i)*ry); uv.needsUpdate=true; return geo; }

  /* ---------- Uebersicht fuer Waechter-Tests und Uebersichtsseite ---------- */
  function liste(){
    const mats=[], texs=[]; for(const [k,m] of cache){ const e={name:k,typ:m.type,abrufe:zaehler.get(k)||0}; const I=info.get(k); if(I) Object.assign(e,I); mats.push(e); }
    for(const [k,t] of texCache){ const im=t.image||{}; texs.push({name:k,w:im.width||0,h:im.height||0,abrufe:zaehler.get('tex:'+k)||0,wofuer:(TEXTUR_W[k]||'')}); }
    const neuL=[]; for(const [k,n] of zaehler) if(k.indexOf('neu:')===0||k.indexOf('kopie:')===0||k.indexOf('eigen:')===0) neuL.push({name:k,abrufe:n});
    let abrufe=0; for(const x of mats) abrufe+=x.abrufe;
    /* Katalog fuer die Uebersichtsseite: jede Farbe, Klasse, jedes Rezept und jede Textur mit Name und Zweck */
    const hx=v=>'#'+(v>>>0).toString(16).padStart(6,'0');
    const katalog={
      farben:Object.keys(PALETTE).map(k=>({key:k,name:PALETTE[k][1],hex:hx(PALETTE[k][0]),wofuer:PALETTE[k][2],ral:PALETTE[k][3]})),
      klassen:Object.keys(KLASSE).map(k=>({key:k,name:KLASSE[k].name,roughness:KLASSE[k].r,metalness:KLASSE[k].m,wofuer:KLASSE[k].wofuer})),
      rezepte:Object.keys(REZEPT).map(n=>{ const R=REZEPT[n], q=RM(R); return {key:n,farbe:typeof R.f==='string'?R.f:hx(R.f),hex:hx(hexVon(R.f)),klasse:R.k||null,roughness:q.roughness,metalness:q.metalness,tex:R.tex||null,wofuer:R.w||''}; }),
      texturen:Object.keys(TEXTUR).map(k=>({key:k,wofuer:TEXTUR_W[k]||''})),
      vc:Object.keys(VC_KLASSE).concat(['leucht']).map(k=>({key:k,wofuer:VC_W[k]||''}))
    };
    const atlanten=[...atlasListe.values()].map(A=>A.info());
    return {materialien:mats,texturen:texs,eigene:neuL,atlanten,geteilt:mats.length,abrufe,gespart:abrufe-mats.length,farben:Object.keys(FARBE).length,rezepte:Object.keys(REZEPT).length,katalog};
  }
  /* Bodenbelaege im Laden (Licht-Paket 15.10., Tom: "der Boden glaenzt so komisch"): EINE Regel fuer alle Belaege
     statt rau/glanz roh aus FLOORS. Matt bis seidenmatt - auch Marmor und geschliffener Beton sind im Laden
     begangen und gewischt, nicht poliert: Rauheit 0,62-0,9, Spiegelung hoechstens 0,12, in Pracht (Spiegelbild
     der Szene) nur ein Hauch Lack und stark unscharf. */
  function bodenGlanz(f){ f=f||{}; const rau=f.rau!==undefined?f.rau:0.6, gl=f.glanz||0, teppich=f.art==='velours';
    return {roughness:teppich?1:Math.min(0.9,0.6+0.3*rau), env:teppich?0:Math.min(0.12,gl*0.25), lack:teppich?0:Math.min(0.12,0.04+gl*0.16), unschaerfe:0.35}; }
  return {FARBE,PALETTE,PALETTE_UV:PAL_UV,KLASSE,REZEPT,bodenGlanz,get,ober,eigen,neu,kopie,std:stdGeteilt,basic,bild,vc,farbe,css,tex:texGet,kachel,atlas,atlasPatch,atlasObc,stufe,liste,verstoesse,get wache(){ return wacheAn; }};
})();

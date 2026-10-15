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
    steingrau:        [0x9a958c,'Steingrau','Naturstein, Pflaster, Mauerwerk warm; Betonzellen und Brandwaende im Werk (Etappe B)','≈ RAL 7030'],
    signalgelb:       [0xf9a800,'Signalgelb','Warnfarbe: Anfahrschutz, Bodenmarkierung, Absperrgitter, Kran, Torantrieb','RAL 1003'],
    schildgold:       [0xffd23f,'Schildgold','Hausstil-Schrift und -Rahmen auf Nachtblau (Schilder, Logo, Automat) - vorher zwei Golds (#ffd23f, #f2c230)','–'],
    signalorange:     [0xed760e,'Signalorange','Blink-/Warnleuchten (Gehaeuse, Glas aus), Tasten, Traversen der Palettenregale (Hochregal)','≈ RAL 2000'],
    signalrot:        [0xd8352a,'Signalrot','Not-Halt, Ampel rot (aus), rote Bedienteile, Markierung rot','≈ RAL 3020'],
    feuerrot:         [0xaf2b1e,'Feuerrot','Brandschutz: Hydrant, Feuerloescher; dunkle Rotteile','RAL 3000'],
    signalgruen:      [0x2f9e57,'Signalgruen','Ampel gruen (aus), Fluchtweg, Gehweg-Markierung, gruene Bedienteile','≈ RAL 6024'],
    signalblau:       [0x2a5a9e,'Signalblau','blaue Bedienteile, Regalrahmen blau (Stuetzen Hochregal), Hinweisschilder','≈ RAL 5005'],
    nachtblau:        [0x1b2340,'Nachtblau','Hausfarbe Schilder/Laden (mit Schildgold)','≈ RAL 5011'],
    tannengruen:      [0x2a4a33,'Tannengruen','Stadtmoebel gruen (Litfass, Baenke), Hecken-Kaesten','≈ RAL 6009'],
    holzPalette:      [0xc49a62,'Holz Palette','Europaletten, Kisten, helles Holz','–'],
    holzPaletteDunkel:[0xa9814e,'Holz Palette dunkel','Palettenkloetze, gealtertes Holz','–'],
    holzDunkel:       [0x4a3624,'Holz dunkel','Ladenfronten Holz, Tueren, Moebel dunkel','–'],
    wellpappe:        [0xc89b5c,'Wellpappe','Kartons, Packband braun','–'],
    messing:          [0xc9a14e,'Messing','Tuerklinken, Schluessel, Rahmen golden','–'],
    /* Werk West (Etappe B, 15.10.): eigene Bedeutung - Erdung/Entladen (Kupferplatte an jeder Zellentuer, Pflicht in Pyro-Werken) */
    kupfer:           [0xb5713f,'Kupfer','Erdungsplatten an Zellentueren (Entladen), Kupferschienen','–'],
    glasKlar:         [0xd6ecff,'Glas klar','Toenung fuer Glas (immer transparent)','–'],
    /* Licht (nur emissive, nicht angeglichen - Licht-Paket 05p) */
    lampeWarm:        [0xfff0d0,'Lampenlicht warm','Leuchtflaechen warmweiss','–']
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
    wandFassade:      {f:0xffffff,tex:'fassade',k:'matt',     w:'Aussenwand: Faserzementtafeln 1,18 m mit dunklem Sockel (Kachel 2,4 x 8 m)'},
    wandLager:        {f:0xffffff,tex:'lagerwand',k:'matt',   w:'Lagerwand innen: hell mit gelb-schwarzem Sockelband 35 cm (Kachel 2,6 x 3,6 m)'},
    wandBlech:        {f:0xffffff,tex:'trapezblech',k:'lackMetall',w:'Hallenwand aussen: Trapezblech, Sicke 0,4 m (Kachel 3,2 m)'},
    wandLaibung:      {f:'aluminium',k:'matt',     w:'Laibung (Stirnseiten an Oeffnungen), wenn die Wand keine eigene vorgibt'},
    wandPutz:         {f:'lichtgrau',k:'matt',     w:'Fensterlaibung heller Putz'},
    sockelAussen:     {f:'graphit',k:'matt',       w:'Spritzwassersockel aussen an Hallenwaenden'},
    /* Tore (Fundament Schritt "Tore", 13.10.): ein Material fuer jedes Torblatt (Atlas-Textur torBlatt, Zeile je
       Paneltyp, Kleinteile ueber Vertexfarben auf der weissen Zeile) und die drei Zustandsleuchten. Die Leuchten
       sind veraenderlich (emissiveIntensity) - nur ueber MAT.neu(...) holen, nie MAT.get. */
    torBlatt:         {f:0xffffff,tex:'torBlatt',vertexColors:true,k:'lackMetall',w:'Torblatt aller Ladetore (Sektionen lichtgrau wie der alte R1, Lichtband, Warnstreifen) - Atlas torBlatt'},
    ampelRot:         {f:0x300808,emissive:LIN(0xff2a2a),emissiveIntensity:1.4,k:'kunststoff',w:'Torampel rot (Tor zu) - nur MAT.neu, Leuchtstaerke schaltet'},
    ampelGruen:       {f:0x082a12,emissive:LIN(0x3dff7a),emissiveIntensity:0,k:'kunststoff',w:'Torampel gruen (Tor offen) - nur MAT.neu, Leuchtstaerke schaltet'},
    /* Halle Etappe A (14.10.): Gitterroste im Hochregal und Bodenmarkierung Gehweg (bk.hochregal, bk.bodenmarkierung).
       Boden-Markierungen liegen 3-5 mm ueber dem Boden und schieben sich zusaetzlich per polygonOffset nach vorn. */
    gitterRost:       {f:'silbergrau',tex:'drahtgitter',transparent:true,alphaTest:0.35,side:THREE.DoubleSide,k:'stahl',w:'Gitterrost verzinkt im Palettenregal (UV 0,2 m je Kachel, Masche 5 cm)'},
    markierungGruen:  {f:'signalgruen',k:'matt',polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,w:'Bodenmarkierung Gehweg gruen (Halle, Kartonlager)'},
    markierungPikto:  {f:0xffffff,tex:'fussgaenger',k:'matt',polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,w:'Fussgaenger-Piktogramm auf dem Gehweg (Textur fussgaenger, gruenes Feld)'},
    lichtband:        {f:'glasKlar',emissive:LIN(0xe4edf7),emissiveIntensity:0.9,k:'kunststoff',w:'Lichtband im Hallendach (Tageslicht, zugleich RWA) - nur MAT.neu, Leuchtstaerke folgt der Sonne (11f)'},
    sperrflaeche:     {f:0xffffff,tex:'warnschraffur',k:'matt',polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,w:'Sperrflaeche gelb-schwarz am Boden (Warnschraffur, UV in Metern / 0,4)'},
    /* Werk West (Halle Etappe B, 15.10.): Betonzellen, Glas (Leitstand, Schnelllauftor), Erdwall, PVC-Behang */
    betonZelle:       {f:'steingrau',tex:'beton',k:'matt',w:'Betonzellen, Brandwaende und Satz-Bunker im Werk (bk.zelle) - UV in Metern / 2,4'},
    glasScheibe:      {f:'glasKlar',k:'blank',transparent:true,opacity:0.24,depthWrite:false,w:'Glasscheibe klar (Leitstand-Front, Sichtfenster Schnelllauftor) - durchsichtig, getoent'},
    erdwall:          {f:0xffffff,tex:'rasen',k:'matt',w:'Erdwall/Boeschung mit Winterwiese (bk.erdwall) - UV in Metern / 4'},
    pvcBehang:        {f:'signalgelb',k:'kunststoff',side:THREE.DoubleSide,w:'Behang Schnelllauftor PVC (bk.tor art schnelllauf) - Warnfarbe, schnell bewegtes Teil'},
    torWarn:          {f:0x3a2208,emissive:LIN(0xffb02a),emissiveIntensity:0,k:'kunststoff',w:'Rundumleuchte ueber dem Torantrieb (blinkt, solange das Tor faehrt) - nur MAT.neu'}
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
  const NICHT_OPT={f:1,r:1,m:1,k:1,tex:1,w:1};
  function ausRezept(name,extra){
    const R=REZEPT[name]; if(!R) throw new Error('MAT: Material unbekannt: '+name);
    const o=RM(R);
    for(const k in R) if(!NICHT_OPT[k]) o[k]=R[k];
    if(R.tex) o.map=texGet(R.tex);
    if(extra) Object.assign(o,extra);
    const m=new THREE.MeshStandardMaterial(o); m.color=LIN(hexVon(R.f)); return m;
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
  function basic(hex,o){ return geteilt(schluessel('basic',hex,o),()=>new THREE.MeshBasicMaterial(Object.assign({color:hex},o||{}))); }
  /* Vertexfarben-Material je Klasse */
  function vc(klasse){ const kl=klasse||'standard';
    return geteilt('vc:'+kl,()=>{ if(kl==='leucht') return new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
      const o=VC_KLASSE[kl]; if(!o) throw new Error('MAT.vc: Klasse unbekannt: '+kl); return new THREE.MeshStandardMaterial(Object.assign({vertexColors:true},o)); }); }
  function farbe(name){ return hexVon(name); }
  /* Farbe als CSS fuer Canvas-Texturen (Schilder, Markierungen): MAT.css('signalgelb') / MAT.css('signalgelb',0.5) */
  function css(name,a){ const h=hexVon(name); if(a===undefined) return '#'+(h>>>0).toString(16).padStart(6,'0'); return 'rgba('+(h>>16&255)+','+(h>>8&255)+','+(h&255)+','+a+')'; }

  /* ---------- geteilte prozedurale Texturen (lazy, einmal gemalt) ---------- */
  const TEXTUR_W={fassade:'Aussenwand Faserzementtafeln (Fugen, Nieten, Sockel 62 cm) - Kachel 2,4 x 8 m ueber repeat, Wand-UV in Metern',lagerwand:'Lagerwand hell mit gelb-schwarzem Sockelband - Kachel 2,6 x 3,6 m ueber repeat',trapezblech:'Trapezblech Hallenwand, Sicke 0,4 m - Kachel 3,2 m ueber repeat',beton:'Beton (innen Lagerboden, aussen Hof) - eine Textur, Massstab ueber die UVs',doppelstab:'Doppelstabmatte (Zaeune, Absperrungen)',drahtgitter:'Drahtgitter/Schweissgitter (Gitterbox, Ladezonen-Absperrung) - Masche 5 cm, Farbe ueber das Material',warnschraffur:'Warnschraffur gelb/schwarz (Torkanten, Sperrflaechen, Bodenrahmen)',palettenMarke:'Paletten-Atlas 256 x 256: oben links Brand EPAL im Oval (Eck-Kloetze), oben rechts IPPC/HT-Stempel (Mittelkloetze), darunter Kiefern-Maserung (Streifen je Brett); Layout MAT.PALETTE_UV. Holzton kommt ueber Vertexfarben, Alterung ueber Instanzfarben',fussgaenger:'Fussgaenger-Piktogramm weiss auf Signalgruen (Gehweg-Markierung), 128 x 128',rasen:'Winterwiese 256 x 256 (Erdwall Werk West), Kachel 4 m ueber die UVs',torBlatt:'Torblatt-Atlas aller Ladetore (Optik alter R1, Tom 14.10.): Zeile 0 glatte Sektion lichtgrau, 1 Lichtband (4 Scheiben), 2 unterstes Panel aussen (Griffmulde), 3 weiss (Kleinteile ueber Vertexfarben)'};
  /* Fassadentafeln (vorher fassadeTex() in 05-world.js): Kachel zwei Tafeln breit, Fuge auf dem Kachelrand -
     wo sich die Textur wiederholt, sitzt eine Fuge; senkrecht ueber die volle Wandhoehe (Sockel unten bleibt) */
  const FASS={b:2.4, h:8.0, sockel:0.62, tafel:1.18};
  /* Layout des Paletten-Atlas (Pixel im 256er-Bild, y von oben): EPAL-Brand 0..128 x 0..64, IPPC-Stempel 128..256 x 0..64,
     Maserung 72..252 (Streifen). Texel-Rand 1 px gegen Filterung in die Nachbarzelle. UV = [u0,v0,u1,v1] (v nach oben). */
  const PAL_UV=(()=>{ const N=256, uv=(x0,y0,x1,y1)=>[(x0+1)/N,1-(y1-1)/N,(x1-1)/N,1-(y0+1)/N];
    return {epal:uv(0,0,128,64),ippc:uv(128,0,256,64),maser:uv(0,72,256,252),maserY0:72,maserY1:252,N}; })();
  const TEXTUR={
    /* Malcode unveraendert aus 05-world.js (fassadeTex, 26.09.) */
    fassade:()=>{ const t=tex(256,1024,(g,W,H)=>{
        const mx=W/FASS.b, my=H/FASS.h, yv=m=>H-m*my;
        g.fillStyle='#c9cbc7'; g.fillRect(0,0,W,H);
        { let sd=7; const rnd=()=>{ sd=(sd*1103515245+12345)&0x7fffffff; return sd/0x7fffffff; };
          for(let m=FASS.sockel;m<FASS.h;m+=FASS.tafel){ const y0=H-(m+FASS.tafel)*my, y1=H-m*my;
            for(const [xa,xb] of [[0,W/2],[W/2,W]]){ const t2=(rnd()-0.5)*2; g.fillStyle=`rgba(${t2>0?'255,255,255':'96,100,106'},${Math.abs(t2)*0.085})`; g.fillRect(xa,y0,xb-xa,y1-y0); } } }
        for(let i=0;i<70;i++){ const r=rand(40,150); g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'120,124,128'},${rand(0.012,0.045)})`; g.beginPath(); g.ellipse(rand(0,W),rand(0,H),r,r*rand(0.4,1.0),rand(0,3.14),0,Math.PI*2); g.fill(); }
        for(let i=0;i<14000;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'90,94,98'},${rand(0.02,0.09)})`; g.fillRect(Math.random()*W,Math.random()*H,1,1); }
        for(let i=0;i<90;i++){ const x=rand(0,W), y=rand(yv(FASS.h),yv(FASS.sockel)), l=rand(20,140); g.fillStyle=`rgba(96,99,104,${rand(0.02,0.06)})`; g.fillRect(x,y,rand(1,3),l); }
        const fugeV=x=>{ const w2=Math.max(2,Math.round(0.022*mx)); g.fillStyle='rgba(58,60,64,.62)'; g.fillRect(x-w2/2,0,w2,H); g.fillStyle='rgba(255,255,255,.22)'; g.fillRect(x+w2/2,0,1.5,H); g.fillStyle='rgba(30,32,36,.30)'; g.fillRect(x-w2/2-1.5,0,1.5,H); };
        const fugeH=y=>{ const w2=Math.max(2,Math.round(0.022*my)); g.fillStyle='rgba(58,60,64,.58)'; g.fillRect(0,y-w2/2,W,w2); g.fillStyle='rgba(255,255,255,.20)'; g.fillRect(0,y+w2/2,W,1.5); };
        for(let m=FASS.sockel;m<FASS.h+FASS.tafel;m+=FASS.tafel) fugeH(yv(m));
        fugeV(0); fugeV(W/2); fugeV(W);
        g.fillStyle='rgba(84,88,94,.5)';
        for(let m=FASS.sockel+0.10;m<FASS.h;m+=FASS.tafel) for(const x of [0.12*mx,W/2-0.12*mx,W/2+0.12*mx,W-0.12*mx]){ g.beginPath(); g.arc(x,yv(m),Math.max(1,0.018*my),0,Math.PI*2); g.fill(); }
        const sy=yv(FASS.sockel);
        g.fillStyle='#3b4049'; g.fillRect(0,sy,W,H-sy);
        for(let i=0;i<5000;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'0,0,0'},${rand(0.02,0.08)})`; g.fillRect(Math.random()*W,sy+Math.random()*(H-sy),1,1); }
        const sp=g.createLinearGradient(0,H-0.45*my,0,H); sp.addColorStop(0,'rgba(24,26,30,0)'); sp.addColorStop(1,'rgba(24,26,30,.55)'); g.fillStyle=sp; g.fillRect(0,H-0.45*my,W,0.45*my);
        g.fillStyle='#9aa0a8'; g.fillRect(0,sy-Math.max(2,0.05*my),W,Math.max(2,0.05*my));
        g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(0,sy-Math.max(2,0.05*my),W,1.5);
        g.fillStyle='rgba(20,22,26,.45)'; g.fillRect(0,sy,W,2); });
      t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.ClampToEdgeWrapping; t.repeat.set(1/FASS.b,1/FASS.h); t.anisotropy=8; return t; },
    /* Lagerwand (vorher lagerWallTex in 05-world.js): hell, unten 35 cm Sockelband gelb/schwarz, Raumhoehe 3,6 m */
    lagerwand:()=>{ const WH=3.6, t=tex(32,512,(g,W,H)=>{ g.fillStyle='#a3a8b0'; g.fillRect(0,0,W,H); const b=Math.round(H*(1-0.35/WH)); for(let y=b;y<H;y+=16){ g.fillStyle=((y-b)/16)%2<1?css('signalgelb'):'#1f1f24'; g.fillRect(0,y,W,16);} });
      t.wrapS=THREE.RepeatWrapping; t.wrapT=THREE.ClampToEdgeWrapping; t.repeat.set(1/2.6,1/WH); return t; },
    /* Trapezblech (vorher blechMat() in 05h): eine Sicke je 32 px = 0,4 m, Kachel 3,2 m */
    trapezblech:()=>{ const t=tex(256,64,(g,W,H)=>{
        g.fillStyle='#b9bec6'; g.fillRect(0,0,W,H);
        for(let x=0;x<W;x+=32){ const gr=g.createLinearGradient(x,0,x+32,0);
          gr.addColorStop(0.00,'#8f959e'); gr.addColorStop(0.16,'#cfd4da'); gr.addColorStop(0.42,'#e4e8ed'); gr.addColorStop(0.58,'#c4c9d1'); gr.addColorStop(0.84,'#9aa0a9'); gr.addColorStop(1.00,'#7d838c');
          g.fillStyle=gr; g.fillRect(x,0,32,H); g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(x+12,0,2,H); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x+30,0,2,H); }
        for(let i=0;i<900;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.05})`; g.fillRect(Math.random()*W,Math.random()*H,2,2); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1/3.2,1/3.2); t.anisotropy=8; return t; },
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
    /* Fussgaenger-Piktogramm (Halle Etappe A, 14.10.): gruenes Feld, weisse Figur im Schritt, wie Gehweg-Markierungen
       in Logistikhallen (ASR A1.8 Verkehrswege). Eine Kachel = ein Piktogramm (0,8 m). */
    /* Winterwiese (Etappe B, 15.10.): Erdwall um das Mischhaus. Kachel 4 m, Gras mit Schneeresten - wie der Park (05n), aber geteilt und kachelbar */
    rasen:()=>{ const t=tex(256,256,(g,W,H)=>{ g.fillStyle='#56663f'; g.fillRect(0,0,W,H);
        let sd=11; const rnd=()=>{ sd=(sd*1103515245+12345)&0x7fffffff; return sd/0x7fffffff; };
        for(let i=0;i<5200;i++){ const v=rnd(); g.fillStyle=v<0.5?`rgba(40,52,28,${rnd()*0.35})`:`rgba(150,160,110,${rnd()*0.18})`; g.fillRect(rnd()*W,rnd()*H,1+rnd()*2,2+rnd()*3); }
        for(let i=0;i<10;i++){ const x=rnd()*W, y=rnd()*H, r=8+rnd()*26, gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(236,240,246,.4)'); gr.addColorStop(1,'rgba(236,240,246,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); } });
      t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=4; return t; },
    fussgaenger:()=>{ const t=tex(128,128,(g,W,H)=>{ g.fillStyle=css('signalgruen'); g.fillRect(0,0,W,H);
        g.fillStyle=css('weiss'); g.strokeStyle=css('weiss'); g.lineCap='round'; g.lineWidth=11;
        g.beginPath(); g.arc(68,20,11,0,Math.PI*2); g.fill();
        const L=(a,b,c,d)=>{ g.beginPath(); g.moveTo(a,b); g.lineTo(c,d); g.stroke(); };
        L(64,40,58,76); L(58,76,40,108); L(58,76,78,94); L(78,94,76,116); L(62,46,40,64); L(62,46,86,62); });
      t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; t.anisotropy=4; return t; },
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
      t.anisotropy=8; return t; }
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
  return {FARBE,PALETTE,PALETTE_UV:PAL_UV,KLASSE,REZEPT,get,ober,eigen,neu,kopie,std:stdGeteilt,basic,vc,farbe,css,tex:texGet,kachel,atlas,atlasPatch,atlasObc,stufe,liste,verstoesse,get wache(){ return wacheAn; }};
})();

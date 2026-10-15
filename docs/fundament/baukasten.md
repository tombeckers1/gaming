# Baukasten und Materialbibliothek – Schnittstelle (Fundament Etappe 2)

Tom, 13.10.2026: „einheitliche Struktur – ändert man es an einer Stelle, ändert es sich überall.“
Grundlage für die Stilregeln (Etappe 3) und die Wächter-Tests (Etappe 5).

**Regel: nie daneben neu bauen.** Fehlt eine Farbe, ein Material, eine Textur oder ein Bauteil,
wird es hier ergänzt – nicht lokal in der Baufunktion angelegt.

## 1. Materialbibliothek `MAT` (`src/parts/01b-material.js`, im Build direkt nach `reuse-helpers.js`)

| Aufruf | Liefert | Geteilt? |
|---|---|---|
| `MAT.farbe('signalgelb')` | Hex-Zahl (sRGB) aus der Palette `MAT.PALETTE` – für Vertexfarben/Sammler | – |
| `MAT.css('signalgelb',0.5)` | dieselbe Farbe als CSS (`#f9a800` bzw. `rgba(…)`) – für Canvas-Texturen | – |
| `MAT.ober('anthrazit','lackMetall',{side:…})` | geteiltes Material aus Palettenfarbe + Oberflächenklasse (`MAT.KLASSE`: matt, kunststoff, lackMetall, stahl, blank) | ja |
| `MAT.eigen('silbergrau','stahl',{…})` | dasselbe als eigenes, veränderbares Material (Zusatz darf alles: map, emissive …) | nein |
| `MAT.get('zaunPfosten')` | benanntes Material aus `MAT.REZEPT` | ja |
| `MAT.std(0xf2c230,{roughness:0.7})` | wie `std(hex,o)`, aber ein Objekt je Farbe+Optionen (nur einfache Werte, keine Texturen/Farben-Objekte) | ja |
| `MAT.basic(0xf2c230)` | wie `new MeshBasicMaterial({color:hex})` | ja |
| `MAT.vc('lack')` | Vertexfarben-Material je Klasse: `standard` (= `vcMat`, r 0,45), `lack`, `metall`, `matt`, `glas`, `leucht` | ja |
| `MAT.neu('signalGelb',{opacity:…})` | eigenes, veränderbares Material nach Rezept (gezählt) | nein |
| `MAT.kopie(m)` | frische eigene Kopie eines geteilten Materials (gleiche Werte) | nein |
| `MAT.tex('beton')` | geteilte prozedurale Textur (lazy, einmal gemalt): `beton`, `doppelstab`, `drahtgitter`, `warnschraffur` | ja |
| `MAT.kachel(geo,rx,ry)` | skaliert die UVs der Geometrie – ersetzt `texture.repeat.set(rx,ry)` bei geteilten Texturen | – |
| `MAT.atlas(name,{zelle,seite,malen,wofuer})` | Textur-Atlas mit Zellen (lazy, Seiten 1024², Ultra Low halbe Zellgröße): `A.material(key)` eigenes Material je Schlüssel, Zelle per Uniform `atlasZ` (ein Shaderprogramm für alle), `A.bild(key)`, `A.info()` – Versandkartons, Doku `kartons.md` | Seite ja, Material je Schlüssel |
| `MAT.stufe()` | `{name, rang, tx, aniso, lambert, lod}` – Grafikstufe, beim Laden fest | – |
| `MAT.liste()` | Materialien/Texturen mit Abrufzählern (für Wächter-Test und Übersicht); je Material `farbe`/`klasse`/`rezept`/`wofuer`, dazu `katalog` = alle Farben, Klassen, Rezepte, Texturen mit Name, Hex und Zweck | – |

**Geteilt heißt: nie verändern.** Kein `color.set/copy`, `opacity`, `transparent`, `emissiveIntensity`,
`map`, `visible`, `dispose` … auf einem Material aus `get/std/basic/vc/tex`. Wer ein Material
später ändern will (Ampel, Lampe in `lampMats`, Regalfarbe, Hervorhebung, Ausblenden), nimmt
`MAT.neu(...)` oder ein eigenes Material. Lampen (`lampMats`) und Tore folgen in eigenen Schritten.

- **Grafikstufe:** Ultra Low bekommt über den Lambert-Austausch in `reuse-helpers.js` automatisch
  einfache Materialien – `MAT` baut über `THREE.MeshStandardMaterial`, nichts extra nötig.
- **Pracht (Maximum+, `03d-pracht.js`):** entscheidet Spiegelboden und innen/außen je Material.
  Damit geteilte Materialien dort genauso aussehen wie vorher eigene, bekommt jeder weitere Ort
  (flacher Boden ja/nein, innen/außen) automatisch eine `MAT.kopie` (`prTeilen`).
- **Wächter:** `localStorage bb_matwache=1` (oder `window.__MATWACHE=true` vor dem Laden) bewacht
  alle geteilten Materialien; jede Veränderung landet mit Aufrufstelle in `MAT.verstoesse`.
  Test: `src/tests/material.js` (Gameplay-Vorführung + ein Spieltag + Tag/Abend/Nacht, Gegenprobe
  `GEGENPROBE=1`).

### Palette, Klassen, Rezepte (Materialangleichung 13.10., `docs/fundament/angleichung.md`)
- **Farbe = Ton** (`PALETTE`: `[hex, Name, wofür, RAL-Bezug]`), 28 Töne + Lampenlicht. Gleiche Sache = gleicher Ton.
- **Oberfläche = Klasse** (`KLASSE`): `matt` 0,9/0 · `kunststoff` 0,6/0 · `lackMetall` 0,5/0,3 · `stahl` 0,42/0,6 · `blank` 0,28/0,85 (roughness/metalness). Keine freien Werte mehr.
- **Material = Ton + Klasse** (`MAT.ober`) oder benanntes `REZEPT` (z. B. `stahlVerzinkt` = silbergrau+stahl). Ein Rezept nur aus Ton+Klasse ist **dasselbe Objekt** wie `MAT.ober(ton,klasse)`.
- Nicht angeglichen (bewusst): Feuerwerk, Produkte/Verpackungen (`04-models`, `04g`…), Figuren (`09*`), Läden-Atlas (`05e2`), Licht und Leuchtfarben (`emissive`, `03-scene`), Zufallsvielfalt (Listen mit ≥ 3 Farben: Hausfassaden, Autos, Türen), Tönungsweiß/-schwarz unter Texturen.

### Ein Material ergänzen
1. Farbe fehlt → erst prüfen, ob ein Ton der Palette passt (ΔE < 6,5 neutral, < 12 bunt = gleicher Ton). Nur wenn die Farbe eine **eigene Bedeutung** hat, neuer Eintrag in `PALETTE` (Name deutsch, Hex, wofür, RAL-Bezug).
2. Material → `MAT.ober(ton,klasse)`; wiederkehrend → `REZEPT` (`f` = Ton oder Hex, `k` = Klasse, `w` = wofür, `tex` = Name aus
   `TEXTUR`, sonst normale Material-Optionen).
3. Textur → `TEXTUR` (Malfunktion einmal, `RepeatWrapping`, Maßstab über `MAT.kachel`).
4. Aufrufen mit `MAT.get(name)` bzw. `MAT.ober(ton,klasse)`; `MAT.std(hex,o)` nur noch für Einzelfarben, die bewusst keinem Ton angehören (Liste in `angleichung.md` §4).

## 2. Baukasten `bk` (`src/parts/04z-baukasten.js`, im Build vor `05-world.js`)

| Aufruf | Zweck |
|---|---|
| `bk.lod()` | 0 = Ultra Low, 1 = Niedrig…Hoch, 2 = ab Maximum |
| `bk.kasten(w,h,d,{fase,anteil,faseMin,seg,lod0Kasten})` | Kasten gefast oder einfach (Fase ≤ `fase`, ≤ `anteil`·kleinste Kante) |
| `bk.sammler(opt)` | viele Teile → je Oberflächenklasse **ein** Mesh mit Vertexfarben |
| `bk.schild(parent,{text,unter,b,h,x,y,z,ry,bg,fg,px})` | Schild im Hausstil (Nachtblau/Gold), Textur-Cache je Text+Größe |
| `bk.tor(o)` | **jedes Tor im Spiel** (Ladetor sektional/roll, Attrappe, Zauntor) – eine Optik, Parameter statt Kopie; Doku `tore.md` |
| `bk.poller(S,x,z,o)` | Poller in einen Sammler: `art:'anfahr'` (Industrie, gelb – Tore/Rampen) · `'stadt'` (Gehweg, graphit rund); gibt das Kollisionsrechteck zurück. Doku `zaeune.md` |
| `bk.anfahrschutz(S,o)` | Rammschutz-Bügel aus Vierkantrohr (gelb) von `von` nach `bis` in einen Sammler (Mörser) |
| `bk.zaun(o)` | **jeder Zaun**: `art:'doppelstab'` (außen) · `'gitter'` (gelb, innen) · `'gelaender'`; `von/bis`, `hoehe`, `pfosten`, `luecke` (Tor/Einfahrt), optional fremder Sammler `S`. Doku `zaeune.md` |
| `bk.absperrung(o)` | Absperrband zwischen Pfosten (`punkte`, `baender`, `text`, `zone`, `frei`) – ein Band-Mesh, Material je Aufdruck einmal |
| `bk.fuss(S,x,z,b)` | Fußplatte (Pfosten von Gitter, Anfahrschutz) – überall dieselbe |
| `bk.wand(o)` | **jedes Wandstück**: `flaechen:{innen,aussen,laibung}` als Art (`'laden'`, `'lager'`, `'fassade'`, `'blech'`, `'laibung'`, `'putz'`) oder Material, ≤ 3 Gruppen, UV in Metern, `still`, `zone`, `sockel`. `wall()`/`stilleWand()` sind Hüllen. Doku `waende.md` |
| `bk.sockelleiste(o)` | Sockel vor einer Wand: `art:'laden'` (Fußleiste, Farbe folgt der Tapete) · `'aussen'` (Spritzwassersockel graphit) |
| `bk.wandbild()` | zeichnet alle Wandstücke und Sockel je Material und 32-m-Feld als **ein** Mesh (Haupt- und Schattenpass); Originale auf Ebene 3 für Logik/Tests |
| `bk.flaeche(name)`, `bk.wandFlaeche(mesh,k)` | Wandfläche → Material · Material einer Box-Seite (0 +x … 5 −z) einer Wand |
| `bk.stab(S,x0,y0,x1,y1,z,d,farbe,klasse)` | Stab zwischen zwei Punkten (Streben, Abhänger) |
| `bk.uvZeile(geo,zeile)` | UVs eines Kastens auf eine Zeile des Atlas `torBlatt` legen (0 Lamellen, 1 Fenster, 2 unten, 3 weiß) |
| `bk.inst(geo,mat,[Matrix4],o)` | Instanzen einer geteilten Geometrie mit eigener Hüllkugel (Sichtprüfung bleibt an) |
| `bk.palette(art,{fein})` | **jede Palette im Spiel**: EPAL-Europalette 1,2 × 0,8 × 0,144 m (11 Bretter, 9 Klötze, gekappte Deckbrett-Ecken, gefaste Bodenbretter, Brand „EPAL im Oval“/IPPC aus der Textur), eine Geometrie je Art und Detail, Material `MAT.get('palette')` (Atlas `palettenMarke`); Doku `paletten.md` |
| `bk.paletten(liste,{gruppe,fein,schnee})` | viele Paletten als EIN InstancedMesh (gleiche `gruppe` = ein Zeichenaufruf über mehrere Aufrufe; je Instanz eigene Alterung über `bk.palFarbe`); Hülle `palettenStapel(x,z,n,ry)` = Hofstapel |
| `bk.karton(t,{kiste})` | Versandkarton einer Sorte als Mesh (`kartonGeo` + `kartonMat[t]` = Atlaszelle) – Lagerregal, Boden, LKW, Karre |
| `bk.hochregal(o)` | **Palettenhochregal** (Halle Etappe A, 14.10.): `gassen:[{z0,nr,schieneOst}]`, je Gasse zwei Reihen à `felder` × 2,9 m, Ebenen 0/1,9/3,8/5,7/7,6, Höhe 9,95 m (`bk.HOCHREGAL`); Rahmen (Stützen Signalblau), Traversenpaare (Signalorange), Gitterroste (`MAT.get('gitterRost')`) je als **ein InstancedMesh für alle Gassen** mit geteilter Geometrie je Detailstufe; Fahr-/Führungsschiene, Anfahrschutz an der Stirn, Schild „GASSE n“. Rückgabe `{plaetze, gassen:[{mitte,kollision,…}], belegen(liste)}` – `belegen` zeigt Europalette + Kartonladung (`bk.ladungGeo`) je belegtem Platz (zwei InstancedMesh für alle Gassen; Paletten mit Instanzfarbe wie `bk.paletten`, sonst teilen sich in r128 zwei Varianten ein Shaderprogramm und das Zeichnen bricht). Doku `docs/halle/etappe-a.md` |
| `bk.rbg(o)` | Regalbediengerät: zwei Fahrkatzen + Kopf Signalgelb (wie Kran), Mast Anthrazit, Hubwagen mit Teleskopgabel bis zum Boden, Schaltschrank, Warnleuchte. **Einmast-Bauweise** (15.10.): Mast, Antrieb, Schaltschrank im Osten, im Westen nur schmale Fahrkatze – reicht 0,80 m über die Gabelmitte, damit es an Feld 0 nicht durch die Brandwand x −66 ragt. Rückgabe `{g (x), hub (y = Unterkante Gabel), gabel (z), set(x,y,z)}` – fahren lässt es die Logik (11f) |
| `bk.foerderer(o)` | Rollenförderer für Paletten `{von,bis,breite,hoehe,teilung}`: Seitenwangen Anthrazit, Rollen Stahl hell, Stützen verzinkt mit Fußplatte, Antrieb; Rückgabe `{laenge,y,punkt(t),kollision}` |
| `bk.fts(o)` | Fahrerloses Transportfahrzeug (Paletten): Fahrkörper Lichtgrau, Rammschutz Signalgelb, Laserscanner, Hubdeck verzinkt; `{g, deck, set(hub)}` |
| `bk.lampe(o)` | **Leuchten**: `art:'raster'` Deckenleuchten im Raster (vorher `leuchtenRaster`/`leuchtenMat` in 05h, jetzt Hülle), `'halle'` LED-Hallenleuchte linear 1,4 m an Pendeln (zwei InstancedMesh: Gehäuse `MAT.vc('lackMetall')`, Leuchtfläche `MAT.vc('leucht')` in `lampeWarm`), `'strasse'` Mastleuchte (vorher `lampTeile` in 05e). Jede Leuchte meldet sich in `LAMPEN` an (`id` = Zone, `aus` = Zone, mit der sie ausgeht) |
| `bk.bodenmarkierung(o)` | **jede Bodenmarkierung** (ASR A1.8): `linien` (Fahrweg gelb 0,12 m, Stellplatz weiß 0,06–0,08 m), `rahmen`, `flaechen` (`gehweg` grün, `sperr` gelb-schwarz 45° mit UV in Metern / 0,4 m), `piktos` (Fußgänger 0,8 m, Textur `fussgaenger`); je Material **ein** Mesh, 3–6 mm über dem Boden + polygonOffset, Sonnenschatten nur mit `schatten:true` (außen) |

Sammler (`opt`: `form` = Kastenform wie `bk.kasten`, `klasse` = Standardklasse, `reihenfolge`,
`mats` = eigene Materialien je Klasse statt `MAT.vc`, `bauteil` = Name für `userData.bauteil`):
```js
const S=bk.sammler({form:{fase:0.012,seg:2,lod0Kasten:true},bauteil:'versandtor'});
S.box(w,h,d,x,y,z,farbe,klasse,rx,ry,rz);  S.zyl(r1,r2,h,seg,x,y,z,farbe,klasse,rx,ry,rz);
S.rund(w,h,d,r,x,y,z,farbe,klasse);  S.geo(geo,matrix,farbe,klasse);  S.pivot(x,y,z,rx,ry,rz);
S.fertig(parent,{schatten,bauteil,fest});   // -> Mesh[] je Klasse, userData.bauteil/klasse
S.geometrie(klasse);                         // nur verschmolzene Geometrie (z. B. geteilte Palette)
```
Umgestellt (13.10.): `geraetBau()` (06, Kasse/SB-Terminal/Gravur – jetzt dünne Hülle),
Versandhof V1 (`buildVersandhof`, 11e: Telefon, Lampe, Schildrahmen; Bauteil `versandhof`), `vcMat` (04) = `MAT.vc('standard')`. 14.10.: Paletten (`vsHolzGeo` 11e, `palettenStapel` 05h → `bk.palette`/`bk.paletten`) und Versandkartons (`buildKartons` 04b → `MAT.atlas('karton')`, `bk.karton`), Doku `kartons.md`.
Sammler-Klassen: neben `standard/lack/metall/matt/glas/leucht` gibt es seit dem Tor-Schritt `kunststoff`, `lackMetall`, `stahl`, `blank` und seit dem Paletten-Schritt `stumpf` (= Klasse matt 0,9: Holz, Pappe)
mit **denselben Werten wie die Oberflächenklassen** (`MAT.KLASSE`) – ein Sammler-Bauteil sieht dann aus wie Einzelteile mit
`MAT.ober(ton,klasse)`. Neue Bauteile nehmen diese Klassen.

### `bk.tor(o)` – Tore (Schritt „Tore“, 13.10., Pilot)
Eine Implementierung für alle Tore: R1 (05g), R2–R5 (05h `westTor`), V1 (11e), Ost-Attrappen (05h), Schiebetor Hof (05g),
Doppeltor im Zaun (05h). Lokales Maß: x = Wandnormale (außen −x, innen +x), z = quer, Gruppe bei `(x,y,z)` um `ry` gedreht.
```js
const T=bk.tor({art:'sektional'|'roll'|'gitter', breite, hoehe, panele, fenster, fuehrung:'vertikal'|'normal', R, decke,
  seite:'aussen'|'innen'|'beide', ampel:'beide'|'innen'|'aussen'|false, bedien:±1, vordach, dichtung, poller, nr,
  wand:[xAussen,xInnen], blatt:xBlatt, beweglich, offen, parent, x,y,z,ry,  /* gitter: */ bewegung, boden, pfosten, schloss});
T.set(t01);  T.panele / T.blatt / T.zu / T.auf;  T.ampel.rot / T.ampel.gruen / T.warn (MAT.neu, veränderlich);  T.kollision (Welt)
```
Je Tor: statische Teile in 5–6 Sammler-Meshes (Klassen stahl/lackMetall/kunststoff/matt/blank + Warnschraffur), das Blatt
mit EINEM Material `MAT.get('torBlatt')` (Atlas, Kleinteile über Vertexfarben) – 1 Mesh (senkrecht fahrend, Attrappe: im
Sammler) oder 1 je Panel (Rolltor, Sektionaltor mit Bogen) –, je Zustand ein Leuchten-Mesh, Nummernschild über `bk.schild`.
Die Spiel-Logik (Kollision des Blatts, Ampel schalten, Warnleuchte blinken, Klang) bleibt in den Hüllen `doorSet`/`wtorSet`/`vdSetzen`.
Noch eigene Sammler (Folgeschritte): Stadthäuser `hausKit`/`hzAdd` und Stadtmöbel `stM` (05e, eigene
Atlas-/Lichtmaterialien), Stadt `sammler()` (05j), Halle `hvSammler` (Branch, Schritt 9).

### `bk.zaun`, `bk.poller`, `bk.anfahrschutz`, `bk.absperrung` (Schritt „Zäune/Poller“, 14.10.) – siehe `zaeune.md`
### `bk.wand`, `bk.sockelleiste`, Wandbild (Schritt „Wände“, 14.10.) – siehe `waende.md`
Ebenen (`layers`): 0 gezeichnet · 1 Originale der Laufzeit-Bündelung (03b) · 2 Kleinteil-Kappung (03c) · **3 Wand-Originale (Wandbild)**.
Der Zielstrahl des Spielers (15-player `ray`) testet 0, 1 und 3.

### Ein Bauteil ergänzen
Erst prüfen, ob es das Bauteil schon gibt (hier und in der Umbauliste `inventar-optik.md` §5).
Neues Bauteil = Funktion `bk.<name>(o)` in `04z-baukasten.js`: Parameter statt Kopie, Teile über
`bk.sammler`, Materialien nur aus `MAT`, Rückgabe enthält Spiellogik-Haken (Kollision, Treffer,
bewegte Teile) statt sie intern zu verdrahten, jedes Mesh mit `userData.bauteil`.
Danach `bk.<name>` in `tools/fundament/waechter.js` (`BAUTEILE` mit Namenswörtern oder `HELFER`) eintragen und
`node tools/fundament/waechter.js` laufen lassen – verbindlicher Ablauf und Wächter: `stilregeln.md` §10–11.

## 2b. Halle Etappe A (14.10.2026) – neue Bauteile und Materialien
- Neue Rezepte: `gitterRost` (silbergrau Stahl, Drahtgitter-Textur), `markierungGruen` (Signalgrün, Gehweg), `markierungPikto`
  (Textur `fussgaenger`), `sperrflaeche` (Warnschraffur am Boden), `lichtband` (Tageslicht im Hallendach, nur `MAT.neu`).
  Neue Textur `fussgaenger`. Paletten-Töne unverändert; `signalorange` (+ Traversen), `signalblau` (+ Hochregal-Stützen),
  `signalgruen` (+ Gehweg) nur im „wofür“ ergänzt – kein neuer Ton.
- Wächter: `hochregal`, `rbg`, `foerderer`, `bodenmarkierung`, `fts` in `BAUTEILE`; `HOCHREGAL`, `ladungGeo`, `MARKIERUNG` in `HELFER`.
  `bk.lampe` aktiviert die Namensregel „lampe/leuchte“: `leuchtenRaster` (05h) und `lampTeile` (05e) sind dafür Hüllen geworden.
- Einsatz und Messung: `docs/halle/etappe-a.md`.

## 2c. Halle Etappe B – Werk West (15.10.2026) – neue Bauteile und Materialien
| Aufruf | Zweck |
|---|---|
| `bk.zelle(o)` | **Betonzelle** (mannlose Station, Mischhaus, Chemie-Box, Satz-Bunker): Wände Beton Steingrau 25 cm (`MAT.get('betonZelle')`, UV in Metern), Ausblasdach (Platten lichtgrau auf Stahlrahmen), Durchreiche mit Klappe (Feuerrot = Brandschutzabschluss) in beiden Stirnwänden (Rahmen Signalgelb = bewegtes Teil; `band`, `false` = geschlossen), zwei versetzte Stahltüren (`tueren:[{seite:±1,x}|{seite:'w'/'o',z}]`), Kupferplatte + Ampel an jeder Tür (Lampen-Geometrien in `o.leuchten`, der Aufrufer schaltet sie je Straße über `MAT.neu('ampelRot'/'ampelGruen')`), Gummiboden, Zellenschild. Alles in einen fremden Sammler `o.S` (`bk.werkSammler`) → eine Straße = wenige Meshes. Rückgabe `{kollision,tueren}` Parameter (15.10.): `wand:'paneel'` = beschichtet Lichtgrau mit Fugen, Sockel Steingrau 30 cm (Fertigungszellen der Straßen, hell wie im Referenzfoto; `'beton'` bleibt für Chemie-Box, Satz-Bunker, Mischhaus), `fenster` (Panzerglas-Sichtfenster je Längswand gegenüber der Tür), `kamera` (über der Durchreiche West). |
| `bk.drehtuer(o)` | **Drehflügeltür** (`art:'stahl'|'brand'|'glas'`): Zarge Anthrazit durch die Wand, Blatt Lichtgrau (Brandschutz mit rotem Schild), Drücker Stahl; mit `o.S` statisch (zu) in einen Sammler, sonst Gruppe mit `fluegel` und `set(t)` (öffnet um das Band). Schiebe-/Haustüren (`hausTuer`, `buildSchiebetuer`) stellt der Schritt Türen auf `bk.tuer` um – deshalb eigener Name und enge Wächter-Wörter |
| `bk.treppe(o)` | gerader Stahllauf `von`→`bis`, `y0`→`y1`: Stufen verzinkt mit gelber Trittkante, Wangen Anthrazit, Geländer Signalgelb (wie `bk.zaun 'gelaender'`), `gelaender:[links,rechts]` |
| `bk.portalgreifer(o)` | Portalgreifer aus Alu-Profil 90 mm (Referenzfoto): 4 Stützen, Längsträger, Brücke (x) + Hubachse (y), Greifer `zange`/`sauger`, Energiekette, Schaltkasten. `set(u,v)` – bewegt wird von außen (05r Schau-Betrieb) |
| `bk.rohrraster(S,o)` | Batterie-Rohr-Raster (Alu-Platte, nx × nz Pappe-Rohre graphit, innen Pappe hell) in einen Sammler |
| `bk.maschine(S,o)` | Stationsmaschine auf Alu-Gestell, **Arten statt Kopien**: `magazin, presse, fuell, zuendschnur, pruef, verpack, wickler, tunnel, banderole, spritz, verdaemm`, `schutz` (nur Umhausung). `o.schutz` = Alu-Profil-Schutzumhausung mit Polycarbonat an beiden Gangseiten (Abstand von der Bandmitte) |
| `bk.erdwall(o)` | Erdwall-Ring mit Trapez-Querschnitt (Fuß 3 m, Krone 0,8 m, 4 m hoch), Ecken auf Gehrung, Lücke mit Beton-Stirnflächen, Oberfläche `MAT.get('erdwall')` (Textur `rasen`, UV in Metern / 4); optional Prallwand |
| `bk.tor({art:'schnelllauf'})` | **PVC-Schnelllauftor** (N1): Zargen Anthrazit, Wickelkasten, Behang `MAT.get('pvcBehang')` (Signalgelb, schnell bewegtes Teil) mit Sichtfenster `glasScheibe`, Gummiabschluss; `set(t)` rollt auf |
| `bk.foerderer({decke})` | neu: hängend (Abhänger bis zur Decke statt Stützen) – Überkopf-Förderer 4,2 m; `antrieb:false` |
| Helfer `bk.kastenM`, `bk.werkSammler`, `bk.balken` | Kasten mit UV in Metern (Welt-Versatz → Körnung läuft über Stöße) · Sammler mit Klassen `beton`, `scheibe` (ohne Schatten), `rasen` · Balken zwischen zwei 3D-Punkten |

Neue Töne/Rezepte/Texturen (`01b`): Ton **`kupfer`** (eigene Bedeutung: Erdung/Entladen an Zellentüren), Rezepte `betonZelle`, `glasScheibe`
(durchsichtig, Leitstand/Schnelllauftor), `erdwall`, `pvcBehang`; Textur `rasen` (Winterwiese, Kachel 4 m). Steingrau trägt jetzt auch
„Betonzellen, Brandwände“. Wächter: `drehtuer, treppe, portalgreifer, rohrraster, maschine, erdwall, zelle` in `BAUTEILE` (enge Wörter),
`kastenM, werkSammler, balken` in `HELFER`. Einsatz, Messung: `docs/halle/etappe-b.md`.

## 3. Messung Schritte 3 + 4 (Wände, Zäune/Poller, 14.10.)
Mit Laufzeit-Bündelung (Spielzustand): Hauptpass Laden 597 → 490, Lagerdock 635 → 495, Dock-Hof 739 → 561; Schattenpass 464–511 → 266–290
(−40 … −44 %). Meshes im Graf 2 521 → 2 218, Zeichengruppen 3 381 → 2 516. Einzelheiten: `waende.md` §4, `zaeune.md` §4.

## 3b. Messung Schritt 2 (Materialangleichung, 13.10.)
Material-Objekte 563 → 430, Dubletten 114 → 89, Texturen 225 → 223, Zeichenaufrufe fast gleich; Einzelheiten und
Vorher/Nachher-Bilder in `angleichung.md`.

## 3a. Messung Schritt 0+1 (13.10., neues Spiel, alle Zonen offen, Stufe Hoch, swiftshader)

| Größe | vorher | nachher |
|---|---|---|
| Material-Objekte im Szenengraf | 988 | 563 |
| davon Dubletten (gleiche Signatur) | 519 | 114 (Rest: Tore, Lampen/`lampMats`, veränderliche Materialien – Schritte 2 und 5) |
| Texturen im Graf / Rohpixel | 250 / 241,7 MB | 225 / 235,4 MB (Beton 19→1, Doppelstabmatte 9→1) |
| Meshes | 2 653 | 2 653 (Schritt 0/1 bündelt keine Geometrie um) |
| Zeichenaufrufe nach Laufzeit-Bündelung (Laden/Lager/Lagerdock/Testfeld/Dock-Hof/Halle W/Straße) | 681/630/674/431/796/329/122 | 626/576/631/392/764/323/123 |
| Schattenpass je Ansicht | 385–501 | 369–487 |
| von der Laufzeit-Bündelung eingespart | 1 071 Meshes | 1 284 Meshes (geteilte Materialien bündeln besser) |

Bildvergleich (`tools/fundament/bilder.js` + `bildvergleich.py`, 8 Ansichten × Tag/Abend/Nacht,
Hoch und Ultra Low, Max für Laden/Lager/Dock-Hof): gleich bis auf das Rauschmuster des Betonbodens
(eine geteilte Textur statt 19 einzeln gewürfelter; ≤ 0,85 % der Pixel, Abweichung ≤ 16 Stufen fast überall).
Restunterschiede in Hof/Straße/Testfeld liegen im Grundrauschen (alt gegen alt gleich groß: Uhr, Scanner,
Vögel, Schnee).

## 4. Katalog (Übersicht mit Bildern, wiederholbar)

`node tools/fundament/katalog.js <real.html> <ausgabeordner>` startet ein neues Spiel (alle Zonen offen) und schreibt
`katalog.json` plus Bilder: jedes Material (Bibliothek `MAT.liste()` und die heute noch eigenen, nach Signatur
gruppiert) als Kugel + Kachel, jede Textur (Dubletten über Pixel-Hash zusammengefasst, Größe/MB, Nutzung, Herkunft),
jedes Bauteil mit `userData.bauteil` (isoliert gerendert, Varianten, Fundorte) und die wiederkehrenden Objekte, die noch
nicht im Baukasten stehen (Tore, Fenster, Regale, Kassen, Lampen, Zäune, Poller; Tabelle `VORHER` in
`tools/fundament/katalog-seite.js`). Neue Baukasten-Bauteile erscheinen ohne Änderung automatisch; ein Objekt, das in den
Baukasten wandert, wird aus `VORHER` gestrichen. Die Herkunft („Baufunktion“) kommt aus dem Zähl-Wrapper
`pre.js`/`post.js`, den der Generator selbst einbaut (`KATALOG_PROFIL=0` schaltet ihn ab). Bilder ~3 MB, Lauf ~10 Min.

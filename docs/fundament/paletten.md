# Paletten nach EPAL-Vorbild + Kartonauflösung je Grafikstufe (Fundament, Schritt „Paletten“) – 14.10.2026, V134

Tom, 14.10.: „Guck dir an, wie eine Hofpalette aussieht und mach sie einheitlich.“ Und: Karton-Auflösung je Grafikstufe – ja.
Vorher (V133, `kartons.md`): EINE Palette im Spiel (`bk.palette`), aber nur als grobes Abbild – Klötze und Bretter in der
richtigen Zahl, doch ohne Brand, ohne gekappte Ecken, ohne Maserung, Maße der Querbretter/Klötze geschätzt (Überstand 2 cm
über die 1200er Kante), alle Paletten gleich neu und gleich glatt. Jetzt: die echte Europalette, mit Alterung je Palette.

## 1. Standard-Optik und warum

**Vorbild: EPAL-Europalette** (EPAL-Datenblatt „EPAL Euro pallet“, epal-pallets.org; technische Zeichnung 3p4.eu –
beide am 14.10. per Exa abgerufen). Es gibt nur diese eine Palette im Spiel (Versandecke, Hofstapel, später Halle).

| Teil | Vorbild (mm) | im Spiel |
|---|---|---|
| Gesamtmaß | 1200 × 800 × 144 | `bk.PALETTE.euro` l 1,2 · b 0,8 · h 0,144 |
| Deckbretter (5) | außen/Mitte 1200 × 145 × 22, dazwischen 1200 × 100 × 22 | `deck` (z, b), Lücken je 41 mm |
| Querbretter (3) | 800 × 145 × 22 | `quer` bei x 0 und ±0,5275 (bündig mit der 1200er Kante) |
| Bodenbretter (3) | außen 1200 × 100 × 22, Mitte 1200 × 145 × 22 | `boden` |
| Klötze (9) | Höhe 78; Außenreihen 145 × 100, Mittelreihe 145 × 145 | je Kreuzung Querbrett × Bodenbrett |
| Ecken der Deckbretter | 4 Ecken 17 mm × 45° gekappt | `kappe` 0,017 (fein) |
| Bodenbretter | oben an den Enden gefast (Einfahrschräge) | `fase` 0,014 (fein) |
| Brand | linker/rechter Klotz der 1200er Seite: „EPAL im Oval“; Mittelklotz: IPPC-Rechteck, Ländercode, HT, EPAL-Nr. | Textur `palettenMarke` auf der Klotzfläche (beide Längsseiten) |
| Holz | helles Nadelholz | Vertexfarben `holzPalette` (Bretter) und `holzPaletteDunkel` (Klötze), Maserung aus der Textur |
| Gebrauch | gebraucht, leicht vergraut | Instanzfarbe je Palette (`bk.palFarbe`): frisch 1,0 bis vergraut 0,74, dazu ±5 % Helligkeit |

Dicke 22 mm (EPAL: 22–24). Nägel (78 je Palette) sind **nicht** modelliert – kein sichtbarer Gewinn bei gleicher Dreieckszahl
(offen, siehe 6.). Das Maß der alten Palette lag 2 cm über der Norm an den Längskanten (Querbretter 0,14 breit bei Mitte ±0,55);
das ist behoben. Die Kollisionsrechtecke (Hofstapel, Versandpaletten) ändern sich nicht: Maß 1,2 × 0,8 war schon richtig.

Warum Textur statt Geometrie für Brand und Maserung: kein zusätzlicher Zeichenaufruf (Material `palette` = Vertexfarbe × Atlas,
wie `torBlatt`), die Klotzfläche ist selbst die Brandfläche (UV auf den Atlas-Bereich). Ultra Low und Hofstapel (`fein:false`)
nutzen einfache Kästen mit derselben Textur – nur Kappen/Fasen entfallen.

## 2. Parameter

| Aufruf | Parameter | Bedeutung |
|---|---|---|
| `bk.palette(art,{fein})` | `art` `'euro'` (Maß/Teile in `bk.PALETTE`), `fein` (Standard: ab Niedrig `true`) | geteilte Geometrie, eine je Art und Detail; `fein:false` = Kästen ohne Kappen/Fasen (Hofstapel, Ultra Low) |
| `bk.paletten(liste,o)` | wie vorher; Instanzen bekommen automatisch Alterung | alle Paletten einer Gruppe = EIN InstancedMesh (+ Schneehauben) |
| `bk.palFarbe(x,y,z,id)` | Ort/Nummer | stabile Alterungsfarbe (Sinus-Hash, kein Zufall: gleicher Ort = gleiche Farbe) |
| `bk.inst(geo,mat,[Matrix4],{…,farben})` | `farben` [THREE.Color] | neu: Instanzfarbe je Instanz |
| `MAT.get('palette')` | – | Material: Vertexfarbe × `palettenMarke`, Klasse matt (0,9) |
| `MAT.PALETTE_UV` | – | Layout des Atlas (Brand EPAL / IPPC, Maserungsstreifen) für Bauteile |
| `GFX_PROFIL[stufe].kar` | Pixel | Kartonzelle je Stufe, siehe 4b; `MAT.atlas(…,{stufenZelle:'kar'})` |

## 3. Welche Stelle nutzt was

| Stelle | Datei | Nutzt |
|---|---|---|
| Hofstapel Logistikhof Ost, Wartespur, Westrand (32 Paletten, 6 Stapel) | `05h-ausbau.js`, `05m-logistik.js` → `palettenStapel` (04z) | `bk.paletten` (`fein:false`), Alterung je Lage |
| Paletten der Versandecke (1–3; Kran, Hubwagen, DDL) | `11e-palette.js` `vsPalObjekt` | `bk.palette('euro')` fein, jetzt als eine Instanz (`bk.inst`) mit eigener Alterung nach Palettennummer; Mesh `holz` ist ein InstancedMesh (nichts liest `.holz`) |
| Halle-Branch (`hvPalGeo`) | – | beim Schritt „Halle auf Baukasten“ durch `bk.palette` ersetzen |

Es gibt keine weitere Palette im Hauptspiel (gesucht: `palett`, `Pallet`, `hvPal`, `vsHolz` in `src/parts`). Die gefalteten Kartons auf der Packtisch-Ablage (05h, Farbe `holzPalette`) und die Kranteile
sind keine Paletten.

## 4. Messung (neues Spiel, alles gekauft, 8 Lagerregale mit 72 Kartons/60 Sorten, swiftshader 640×400, Stufe Hoch, `tools/fundament/kartonmessung.js`)

### 4a. Paletten

| Größe | vorher (V133) | nachher |
|---|---|---|
| Dreiecke einer Versandpalette (fein) | 960 | **280** |
| Dreiecke einer Hofpalette (grob) | 240 | 240 |
| Dreiecke aller Paletten im Spiel (35 Stück) | 10 560 | **8 520** (−19 %) |
| Palettenzeichenaufrufe (Meshes) | 6 | 6 |
| Zeichenaufrufe Hauptpass Laden / Lager / Versandecke / Nahaufnahme / Hofstapel (2 Ansichten) | 708 / 649 / 224 / 1 059 / 646 / 218 | 708 / 649 / 224 / 1 059 / 646 / 218 (gleich) |
| Zeichenaufrufe Schattenpass Lageransicht | 508 | 511 (+3, Hüllkugel der Instanz ist größer als die der Geometrie – Palette wird später aussortiert) |
| Meshes / Materialien / Shader-Programme | 2 178 / 477 / 140 | 2 178 / 477 / 140 |
| Texturen auf der Grafikkarte | 249 (367,5 MB) | 250 (367,9 MB): +1 Textur `palettenMarke` 256², +0,35 MB |

Ehrlich: Dreiecke sinken, weil die alte V1-Palette 20 Fasenkästen war; die neuen Kappen/Fasen sind Prismen mit je 20 Dreiecken.
Hofstapel ändern die Geometrie nicht, nur Textur und Alterung. Leistung auf der Grafikkarte nicht gemessen (swiftshader).

### 4b. Karton-Auflösung je Grafikstufe (Atlas `karton`, 60 Sorten im Spiel)

Wert: `GFX_PROFIL[stufe].kar` in `reuse-helpers.js` (eine Zahl je Stufe). Bei Zellen größer als das Motiv (256) wird der Malcode
skaliert (`ctx.scale`), nicht das fertige Bild hochgezogen – Schrift und Linien bleiben scharf.

| Stufe | Zelle vorher → nachher | Karton Arbeitsspeicher | Karton Grafikkarte | Texturen Grafikkarte gesamt (nachher) |
|---|---|---|---|---|
| Ultra Low | 128 → 128 | 4,0 MB (1 Seite) | 5,3 MB (unverändert) | 207,5 MB (vorher 207,2, +0,3 Palettenatlas) |
| Niedrig | 256 → **128** | 16,0 → **4,0 MB** | 21,3 → **5,3 MB** (−75 %) | 318,4 MB (vorher 334,1: −15,7) |
| Mittel | 256 → **128** | 16,0 → **4,0 MB** | 21,3 → **5,3 MB** | 339,5 MB |
| Hoch | 256 → 256 | 16,0 MB (4 Seiten) | 21,3 MB (unverändert) | 367,9 MB (vorher 367,5) |
| Maximum | 256 → **512** | 16,0 → **60 MB** (15 Seiten à 4 Zellen) | 21,3 → **80 MB** | 502,1 MB |
| Ultra / Ultra Extrem | 256 → 512 | 60 MB | 80 MB | 602,5 MB (Ultra) |

Wenn alle 239 Sorten gebraucht werden (nur gerechnet, nicht gemessen): 128 px 16 MB (Grafikkarte 21), 256 px 60 MB (80), 512 px **240 MB (320)**.
Das 512er Maximum lohnt also vor allem, solange ein Teil des Sortiments im Spiel ist; bei Vollsortiment auf Maximum +240 MB gegenüber Hoch.

## 5. Bilder (`docs/fundament/paletten/`)

Links vorher (V133), rechts nachher, gleiche Kamera, Tag, Stufe Hoch, Zufall geseedet.

| Ansicht | Bild |
|---|---|
| Nahaufnahme einer Versandpalette (Klötze mit Brand) | [nah](paletten/palette-nah-vorher-nachher.webp) |
| Palettenstapel Hof Wartespur (von der Seite) | [Hof](paletten/hofstapel-nah-vorher-nachher.webp) · [Hof Gegenseite](paletten/hofstapel-seite-vorher-nachher.webp) |
| Versandecke | [Versandecke](paletten/versandecke-vorher-nachher.webp) |
| Kartonzelle je Stufe: vorher 256 px · Niedrig/Mittel 128 px (vergrößert) · Maximum 512 px | [Zellen](paletten/karton-zelle-128-256-512-nachher-isoliert.webp) |

Neu erzeugen: `node tools/fundament/kartonmessung.js <real.html> <ordner>` mit `VIEWS=versandPalette,versandPaletteNah,hofStapelNah,hofStapelNah2`,
`GFXW=ultralow|niedrig|mittel|hoch|max`; Montage: Paare aus zwei Läufen nebeneinander.

## 5a. Tests

Eigene Sperre `/tmp/bb-testlock-epal`, je Lauf ein Browser (`lauf.sh`), Build V134 in real.html, alle grün:

- **Node-Wächter** `node tools/fundament/waechter.js`: ALLES OK (Ausnahmeliste unverändert, Wirtschaft GLEICH); `--gegenprobe`: alle 13 schlagen an.
  Neu eingetragen: `bk.palFarbe` unter `HELFER` (neues Baukasten-Helferwort), sonst nichts.
- **Laufzeit-Wächter** `src/tests/waechter.js`: ALLES OK, MAT-Wache 0 Verstöße, Budget eingehalten (Bauteile `palette` 9 Meshes wie vorher).
- **material**: ALLES OK, MANGEL keine (Textur `palettenMarke` im Katalog, Spitze 8,8 GB).
- **gameplay**: ALLES OK (Vorführung mit Hofstapeln und Versandpaletten, Endstand und 237 Sorten).
- **kartonlogik**: ALLES OK, ATLAS_ZELLE Korrelation 0,96–0,997, Gegenprobe −0,36…0,12 (Stufe Hoch, 256 px).
- **lager**, **versand** (inkl. Neuladen): ERRORS keine, rc 0.
- Stufen Ultra Low/Niedrig/Mittel/Maximum/Ultra: je ein Messlauf `kartonmessung.js` ohne Seitenfehler (siehe 4b);
  Ultra Low zeigt die Palette mit Brand (Lambert-Material, einfache Kästen).

## 6. Offen / für Tom

- **Palettenfarbe:** das Holz ist der Bibliotheks-Ton `holzPalette` (wie vorher), nun mit Maserung und Alterung (grauer bis 26 %). Zu hell/zu grau? Rückweg: Stärke in `bk.palFarbe` (0,26), Maserungskontrast in `palettenMarke`.
- **Nägel** (78 je Palette, Köpfe mit Zweibuchstaben-Stempel): nicht modelliert; als Textur auf den Brettern wären sie billig, auf 2 cm Köpfen kaum sichtbar. Nur auf Wunsch.
- **Maximum 512 px** (240 MB bei Vollsortiment): ist die Zahl `kar` in `GFX_PROFIL.max/ultra/extrem` – bei Bedarf auf 384/256 stellen.
- Halle-Branch: `hvPalGeo` ist weiter eine eigene Palette; beim Schritt „Halle auf Baukasten“ durch `bk.palette` ersetzen.
- Gitterbox/Gitterpalette als Ladungsträger gibt es im Hauptspiel nicht; `bk.PALETTE` nimmt sie bei Bedarf auf.

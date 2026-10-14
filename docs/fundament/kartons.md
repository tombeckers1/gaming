# Paletten und Kartons – `bk.palette` und Karton-Atlas (Fundament Etappe 2, Schritt 6) – 14.10.2026

Tom, 13.10.: „ein Bauteil sieht überall gleich aus; ändert man es an einer Stelle, ändert es sich überall.“
Klarstellung (13.10.): Bauteile einheitlich – **die Verpackungsmotive je Produkt bleiben bewusst verschieden** (Anomalie).
Darum zwei Teile: die **Palette** wird EIN Bauteil (sichtbare Angleichung), beim **Versandkarton** bleibt jedes Motiv
pixelgleich, nur die Ablage ändert sich (Atlas statt 239 Einzeltexturen).

## 1. Standard-Optik und warum

### Palette
**Gewählt: die Europalette von V1 (11e, `vsHolzGeo`) als einzige Palette.**

| | Hofstapel (05h `palettenStapel`) | V1-Palette (11e `vsHolzGeo`) | Halle-Branch (`hvPalGeo`) | → Standard |
|---|---|---|---|---|
| Maß | 1,2 × 1,05 m, Lage 0,15 m (kein Normmaß) | **1,2 × 0,8 × 0,144 m (EPAL)** | 1,2 × 0,8 | **EPAL** |
| Aufbau | 3 Kufen, 5 Bretter, 3 Querhölzer | 9 Klötze, 3 Boden-, 3 Quer-, 5 Deckbretter | ähnlich V1 | **V1** |
| Holz | #8e7550 (eigener Ton, dunkler) | Palette `holzPalette`/`holzPaletteDunkel` | `HVM.holz` | **Palette** |
| Oberfläche | eigenes Material r 0,94 | `vcMat` r 0,45 (zu glänzend für Holz) | r 0,92 | **stumpf = Klasse matt 0,9** |
| Bauweise | 1 Mesh je Stapel (verschmolzen) | 1 Mesh je Palette (bewegt sich mit Hubwagen/DDL) | Instanzen | **Instanzen**, bewegliche: geteilte Geometrie |

Begründung: (1) Nur V1 hat das echte Normmaß (1200 × 800 × 144 mm) und den echten Aufbau – dieselbe Palette, die der
Spieler in der Versandecke belädt, liegt jetzt auch im Hof. (2) Holz ist stumpf: die Bibliothek sagt `holzPalette` =
Klasse matt; dafür gibt es jetzt die Vertexfarben-Klasse `stumpf` (gleiche Werte wie matt 0,9/0). (3) Der Hofstapel
mit 1,05 m Tiefe passte zu keiner Palette im Spiel.

Sichtbare Änderung: Hofstapel sind schmaler (0,8 statt 1,05 m), heller (Palettenholz statt #8e7550), sauber gestapelt
mit Klötzen; V1-Paletten wirken etwas stumpfer (r 0,9 statt 0,45). Bilder: §5.

### Versandkarton
Motiv und Malcode unverändert (Absender, Etikett mit Produktname, Gefahrgut-Raute 1.4G nur bei F1/F2, Klebeband,
Barcode, Griffloch – je Sorte über den Hash). Einzige Änderung im Bild: das Pappe-Rauschen (500 Punkte, Alpha ≤ 6 %)
kommt aus einem Zufall mit Saat je Sorte statt `Math.random` – vorher sah derselbe Karton nach jedem Laden etwas anders
aus, jetzt immer gleich.

## 2. Parameter

| Aufruf | Parameter | Bedeutung |
|---|---|---|
| `bk.palette(art,{fein})` | `art` `'euro'` (Maß in `bk.PALETTE`), `fein` (Standard: ab Niedrig `true`) | geteilte Geometrie, eine je Art und Detail; `fein:false` = Kästen ohne Fasen (Hofstapel, Ultra Low) |
| `bk.paletten(liste,o)` | `liste` `[{x,y,z,ry}]`, `gruppe`, `fein`, `schnee` `[{x,y,z,ry}]`, `parent`, `schatten` | alle Paletten einer Gruppe = EIN InstancedMesh (+ eins für die Schneehauben), Hüllkugel über alle Instanzen |
| `palettenStapel(x,z,n,ry)` | wie vorher (Hülle, jetzt in 04z) | n Paletten übereinander, je Lage ±2 cm versetzt, Schneehaube, Kollision; Gruppe = 40-m-Raster |
| `bk.inst(geo,mat,[Matrix4],o)` | `parent`, `schatten`, `bauteil`, `art` | allgemeine Instanzen einer geteilten Geometrie (Vorbild `hvInst`) |
| `MAT.atlas(name,o)` | `zelle` (256), `seite` (1024), `malen(g,W,H,key)`, `wofuer` | Atlas: Zelle lazy beim ersten Abruf, Seite mit der ersten Zelle; Zellgröße × min(1, `MAT.stufe().tx`) |
| `A.material(key,extra)` | Optionen wie MeshStandardMaterial | eigenes Material je Schlüssel, `map` = Atlasseite, Zelle über Uniform `atlasZ` (Vertexshader, ein Programm für alle) |
| `A.bild(key)` / `A.info()` | – | Zelle als ImageData (Tests, Katalog) / Seiten, Zellen, Bytes |
| `kartonMat[t]` | Sorte | **Hülle wie vorher**: eigenes Material je Sorte (gecacht), jetzt aus `MAT.atlas('karton')` |
| `bk.karton(t,{kiste})` | Sorte, Mehrwegkiste | Karton-Mesh (`kartonGeo`, Schatten, `userData.bauteil='karton'`) |
| `kartonBild(t)` | Sorte | Motiv als ImageData (vorher `kartonMat[t].map.image`) |

Grafikstufen: Zelle 256 px ab Niedrig (pixelgleich zu vorher), **Ultra Low 128 px** (`tx` 0,5; gemalt wird in 256 und
verkleinert – Aufteilung und Schriftgrößen bleiben). Maximum und höher blieben bei 256 – seit V134 (Tom 14.10.): Niedrig/Mittel 128, Hoch 256, Maximum+ 512, siehe `paletten.md` 4b.

## 3. Welche Stelle nutzt was

| Stelle | Datei | Nutzt |
|---|---|---|
| Hofstapel Logistikhof Ost (2) | `05h-ausbau.js` `buildLogistik` | `palettenStapel` → `bk.paletten` (Gruppe Ost) |
| Hofstapel Wartespur/Westrand (3) | `05m-logistik.js` | `palettenStapel` → `bk.paletten` (2 Gruppen) |
| Paletten der Versandecke (1–3, beweglich: Kran, Hubwagen, DDL) | `11e-palette.js` `vsPalObjekt` | `bk.palette('euro')` + `MAT.vc('stumpf')`, ein Mesh je Palette in ihrer Gruppe |
| Karton im Lagerregal | `06-fixtures.js` `putInSlot` | `bk.karton` |
| Karton am Boden / Warenannahme | `08-boxes.js` `spawnFloorBox` | `bk.karton` |
| Karton im LKW | `08b-truck.js` | `bk.karton` |
| Kartons auf der Karre | `08d-karre.js` | `bk.karton`, Materialwechsel über `kartonMat[t]` |
| Karton in der Hand, Einräumer, Tragen | `08-boxes.js` `carryMesh`, `11b-einraeumer.js`, `15c-karton.js` | unverändert über `kartonMat[t]` (Hülle) |
| Pracht (Maximum+) | `03d-pracht.js` | erkennt Atlas-Materialien (`prFremd`, `prOBC` ruft `MAT.atlasPatch`) – Kartons bekommen wie vorher das Relief |
| Katalog | `tools/fundament/katalog-seite.js` | Kontaktbogen über `kartonBild`; Palettenstapel aus `VORHER` gestrichen (jetzt Baukasten) |

Gelöscht: `palettenStapel`/`holzMat` in 05h (Eigenbau), `vsHolzGeo` in 11e, `kartonMat[t]=new MeshStandardMaterial(tex(256,256,…))` je
Sorte beim Start (04b). Nebenbei behoben: eigene Rezepte (`02d`, kommen nach dem Start in `ORDER`) hatten keinen Karton
(`kartonMat[t]` leer → weißer Kasten); jetzt bekommen sie ihre Zelle beim ersten Abruf.

## 4. Messung (neues Spiel, alles gekauft, 8 Lagerregale mit 72 Kartons aus 60 Sorten + 6 Bodenkartons; swiftshader 640×400)

Skript `tools/fundament/kartonmessung.js` (Ansichten wie `messen3.js`, dazu ein WebGL-Haken, der den Texturspeicher je Textur zählt).
Die Gameplay-Vorführung (alle 238 Sorten) ließ swiftshader **vorher wie nachher** abstürzen – daher die eigene Füllung.

| Größe | vorher (d9e733d) | nachher |
|---|---|---|
| Karton-Bilddaten im Arbeitsspeicher beim Start | **59,8 MB** (239 Sorten gemalt) | **0 MB** |
| … nach dem Füllen (60 Sorten in Gebrauch) | 59,8 MB | **16,0 MB** (4 Seiten) |
| … wenn alle 239 Sorten gebraucht werden | 59,8 MB | 60 MB (15 Seiten) – kein Gewinn |
| Karton-Texturen auf der Grafikkarte (Hoch) | 51 Texturen, 17,0 MB | **4 Seiten**, 21,3 MB (+4,3: angefangene Seite zählt voll) |
| dasselbe Ultra Low | 60 Texturen, 20,0 MB | **1 Seite, 5,3 MB** (Zelle 128) |
| Texturen auf der Grafikkarte gesamt Hoch / Ultra Low | 290 / 258 | **245 / 199** |
| Texturspeicher gesamt Ultra Low | 221,8 MB | **207,2 MB** |
| Zeichenaufrufe Hauptpass Laden / Lager / Lagerdock / Versandecke / Lagerregal | 848 / 778 / 1 025 / 425 / 647 | 848 / 778 / 1 025 / 426 / 647 (gleich) |
| Material-Objekte im Szenengraf | 482 | 482 (je Sorte weiter ein Material – Hülle `kartonMat`) |
| Meshes gesamt | 2 484 | 2 487 |
| Paletten-Meshes | 8 (5 Stapel + 3 V1) | 9 (3 Gruppen × Holz + Schnee, 3 V1) |
| Dreiecke eines Hofstapels | 132 je Lage | 240 je Palette (einfache Kästen); V1-Palette mit Fasen wie vorher |
| Shader-Programme | 135 | 140 (Atlas-Karton, Vertexfarben `stumpf`, Instanz-Varianten) |

Ehrlich eingeordnet: Der Gewinn ist **Speicher für Ware, die nicht im Spiel ist** (beim Start 60 MB weniger, im Spielverlauf
so viel, wie Sorten fehlen), **239 → höchstens 15 Texturobjekte**, und auf Ultra Low ein Viertel des Kartonspeichers.
Auf Hoch kostet jede gebrauchte Sorte gleich viel wie vorher (gleiche 256er-Zelle = pixelgleich), die Grafikkarte hält die
Seiten im Raster (bis zu 15 leere Zellen). Zeichenaufrufe ändern sich nicht – jede Sorte hat weiter ihr Material, damit
Karre/Einräumer/Tests (`kartonMat[t]`) unverändert laufen.

## 5. Bilder (`docs/fundament/kartons/`)

Links vorher, rechts nachher, gleiche Kamera, Tag, Stufe Hoch (Zufall geseedet; Kartonmotive vorher/nachher gleich,
nur Drehung/Lage einzelner Kartons verschieden, weil vorher 239 Kartons beim Start Zufallszahlen verbrauchten).

| Ansicht | Bild |
|---|---|
| Kartonzellen vorher / nachher Hoch / nachher Ultra Low | [zellen](kartons/zellen-vorher-nachher.webp) – Abweichung je Zelle ≤ 12 Stufen, 0 % Pixel > 16 (nur Pappe-Rauschen) |
| Atlas, 64 Sorten (Kontaktbogen) | [bogen](kartons/atlas-bogen-64-sorten.webp) |
| Lagerregal | [weit](kartons/lager-regal-vorher-nachher.webp) · [nah](kartons/lager-regal-nah-vorher-nachher.webp) · [Ultra Low](kartons/ultralow-lager-regal-vorher-nachher.webp) |
| Kartons am Boden / Lagerdock | [Boden](kartons/lager-boden-vorher-nachher.webp) · [Dock](kartons/lager-dock-vorher-nachher.webp) |
| Paletten in der Versandecke | [Versandecke](kartons/versand-palette-vorher-nachher.webp) |
| Hofstapel (Wartespur) | [Hof](kartons/hofstapel-west-vorher-nachher.webp) |
| Laden (keine Kartons, Kontrolle) | [Laden](kartons/laden-vorher-nachher.webp) – gleich |

Bilder neu erzeugen: `node tools/fundament/kartonmessung.js <real.html> <ordner>` (`GFXW=ultralow`, `VIEWS=lagerRegal,…`,
`RACKS=8`); `bk.palette`/`bk.karton` erscheinen im Katalog (`katalog.js`) automatisch unter den Baukasten-Bauteilen.

## 5a. Tests (eigene Sperre `/tmp/bb-testlock-kartons`, je Lauf ein Browser)

Container unter Volllast (drei Agenten, Last 10–16 auf 4 Kernen, Speichergrenze 13,4 GB mit OOM-Kills von Browsern).

**Grün:** kartonlogik (Raute nur auf Feuerwerk, 239 verschiedene Motive, alter Spielstand mit Eiswürfeln lädt; neu
**ATLAS_ZELLE**: gerenderte Kartonvorderseite gegen ihre Zelle, Korrelation 0,96–0,997; **Gegenprobe** Zellwahl auf
ganze Atlasseite → −0,36…0,12, schlägt an), karre, kartons, pakete, packband, versandtor, lager, einraeumer (Lauf 3,
inkl. Neuladen; Karton zeigt `kartonMat[t]` = Aufdruck), material (Wächter 0 Verstöße), **gameplay** (Endstand, ALLES OK).
`node tools/fundament/wirtschaft-snapshot.js`: GLEICH.

**Nicht bestätigt – Zeitlimit beim Start/Neuladen, nicht karton-bedingt:** kiste, kartonauf, versand, sortiment hängen in
`neuesSpiel()` bzw. am Knopf „Weiterspielen“ (Klick 120 s, Warten 15–30 s). Gegenprobe auf d9e733d: kiste, versand und
einraeumer brechen **vorher an derselben Stelle** ab; kartonauf lief vorher einmal in einer ruhigen Minute durch. Startzeit
(Klick „Los“ bis Spiel) gemessen, je 3 Läufe abwechselnd: vorher 69 / 40 / 112 s, nachher 19 / 123 / 66 s – nur Lastrauschen.
versand (nachher, Lauf 3) bestand seine Prüfungen GRUPPE, FEST, BELEGT, KAUF und scheiterte erst am Neuladen. → beim Merge in der
Regression bei ruhigem Rechner wiederholen.

## 6. Offen / für Tom

- **Kartonschärfe je Stufe:** heute 256 px ab Niedrig, 128 px nur Ultra Low. Vorschlag: Niedrig/Mittel auch 128 (−75 %
  Kartonspeicher dort, Etikett aus 1–2 m noch lesbar, siehe Spalte Ultra Low im Zellenbild) und Maximum+ 512 (schärfer, +300 %).
  Eine Zahl in `buildKartons` (04b) bzw. `MAT.atlas` – bitte entscheiden.
- **Palettenfarbe/-glanz:** Hofstapel jetzt hell wie die Versandpaletten und stumpf – bitte abnehmen; Rückweg = Holzton in der Palette (`holzPalette`).
- Halle-Branch: `hvPalGeo`/`hvKartonAtlas` sind die dritte Palette bzw. zweite Kartonablage – beim Schritt „Halle auf Baukasten“ durch `bk.palette`/`MAT.atlas('karton')` ersetzen.
- Gitterbox als Ladungsträger gibt es im Hauptspiel nicht (die Gitterbox im Laden ist ein Regal → Schritt Regale); `bk.PALETTE` nimmt sie bei Bedarf auf.
- Befund nebenbei (unverändert): auf Lebensmittelkartons läuft „Lebensmittel · trocken lagern“ rechts über das Etikett hinaus.

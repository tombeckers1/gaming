# Inventar Optik – Fundament Etappe 1 (Bestandsaufnahme, kein Umbau)

Stand 13.10.2026, Hauptspiel Commit `30c0188` (Branch `claude/artifact-review-task-d47i09`), Halle Branch `origin/claude/halle-v7` (`48533c5`, nur gelesen).
Gemessen = Playwright/swiftshader, `real.html`, neues Spiel, Stufe „Hoch“, 640×400, Skripte in `/tmp/claude-0/-home-user-gaming/0193ab14-15bf-5b6d-bc68-5f3758f1dcc3/scratchpad/e1optik/` (`pre.js`/`post.js` = Zähl-Wrapper, `messen3.js`/`messen4.js` = Ansichten). Nichts davon liegt im Repo.
„Statisch“ = aus dem Code gezählt. Alle Zahlen **ohne Ware, Kunden, Personal, LKW** (neues Spiel hat keine Regale; Regale einzeln nachgebaut und gemessen).

## 0. Kurzfazit

| Befund | Zahl |
|---|---|
| Meshes im Szenengraf (Start, alle Zonen gebaut, 19 % davon bis zum Kauf unsichtbar) | **2 639** (2 131 sichtbar) |
| davon Einzel-Primitive (`bbox` = 108 Dreiecke, `box` = 12, `plane` = 2) | **2 099 = 80 %** (1 362 Fasenboxen, 391 Boxen, 346 Planes); nur 185 Meshes sind per Vertexfarben gemergt |
| Material-Objekte / davon ohne Textur / verschiedene Signaturen | **984 / 741 / 240** → 501 Dubletten (68 %) |
| `tex()`-Aufrufe beim Aufbau / Rohpixel | **482 / 304 MB**; 218 Texturen im Graf ≈ 266 MB inkl. Mips |
| Zeichenaufrufe Hauptpass, Spieler im Bild, **ohne** Laufzeit-Bündelung | Laden 892 · Lager 809 · Lagerdock 971 · Testfeld 590 · Dock-Hof **1 275** · Halle West 421 · Straße 122 |
| dasselbe **mit** Laufzeit-Bündelung (03b, 1 071 Meshes eingespart) | 687 · 631 · 675 · 432 · 821 · 339 · 122 (−19 … −36 %) |
| Schattenpass zusätzlich | 435–570 Aufrufe (nach Bündelung 385–500), kaum abhängig von der Blickrichtung (Sonne folgt dem Spieler) |
| Dreiecke je Bild | 289 k (Straße) … 605 k (Dock-Hof); **Stadt/Straße/Park = 79–90 %**, alles andere zusammen 10–21 % |
| Shader-Programme / Geometrien | 134 / 1 299 |

Ehrliche Einordnung:
1. **Dreiecke sind nicht das Bauteil-Problem.** `buildPark` allein 181 k Dreiecke in 29 Meshes, `buildStreet` 334 k, Schneehaufen 19 k, Stadtmöbel 18 k. Das ist ein eigenes Thema (Außenwelt-Budget/LOD), kein Baukasten.
2. **Das Spiel bündelt schon zur Laufzeit** (`03b-post.js:175` `gruppenBuendeln` für 6-Material-Arrays, `:200` `BUENDEL`/`bSammeln` für statische Einzelmeshes, alle 300 Bilder, mit Wächter; Test `buendel`). Der Baukasten spart deshalb weniger Zeichenaufrufe, als die Rohzahl vermuten lässt – er spart dafür **Szenengraf (2 639 Knoten werden jedes Bild durchlaufen, Originale bleiben auf Ebene 1), Bündel-Latenz (erst nach ~5 s Ruhe), Raycast, Speicher und vor allem Einheitlichkeit**. Bündelung kostet außerdem Dreiecke: +0 … +9 % (24-m-Felder, kein Culling je Objekt).
3. **Texturspeicher ist der größte Einzelposten**, nicht die Dreiecke: Kartons 62,7 MB (239 Texturen), Stadt 61,9, Welt/Boden/Wand 31,7, Straße 27,7, Läden gegenüber 16,8 (ein 2048²-Atlas), Fahrbahn 13,5, Packstation 11,4.
4. **Grafikstufen greifen bei Bauteilen praktisch nicht**: `tex()` hat feste Größen; `HIQ` (= kein Touchgerät, nicht die Stufe!) schaltet nur `roundedBoxGeo` (3 oder 2 Segmente), `castShadow` und ein paar Zylinder. Stufenabhängig sind nur Boden/Wand-Innenraum (`05o:439`), Ware (`TEX_FAKTOR`), Läden-Innen-Atlas (`05e2:337`), Anisotropie (`GFX_START.ani`), Ultra Low (Lambert-Austausch in `reuse-helpers.js:53`, Stadt aus). Die Halle (Branch) hat als einziger Teil eine Stufenlogik (`hvQ`, 30-halle-basis.js:51).

## 1. Gemeinsame Helfer (Basis für den Baukasten)

| Helfer | Datei:Zeile | Kann | Anmerkung |
|---|---|---|---|
| `LIN(hex)`, `std(hex,o)` | reuse-helpers.js:58–59 | sRGB→linear, `MeshStandardMaterial` mit roughness 0,85 / metalness 0 | **kein Cache**: jeder Aufruf = neues Material (279 Aufrufe, 161 verschiedene Hex) |
| `tex(w,h,draw,srgb)` | reuse-helpers.js:70 | Canvas→`CanvasTexture`, Anisotropie, sRGB; fertig gemalte Texturen als `ImageData` (spart Safari-Canvas-Speicher, `texSpar` :69, nur WebGL2) | feste Größe, kein Cache, keine Stufe; leere `draw` = Canvas bleibt (Schilder) |
| `tm(x,y,z,rx,ry,rz,sx,sy,sz)` | reuse-helpers.js:74 | Matrix4 aus Lage/Drehung/Skalierung | |
| `merge(parts)` | reuse-helpers.js:75 | `[{geo,m,color}]` → eine `BufferGeometry` mit Vertexfarben (nicht indiziert) | merkt Eckbereich je Teil (`p._o/_n`) |
| `roundedBoxGeo / rbox / bbox / box / plane / hitM / col` | 03-scene.js:93–134 | Fasenbox (Cache max. 600), `bbox` wählt Fase oder Box, unsichtbare Trefferfläche, Kollisionsrechteck | **jede Fasenbox = 108 Dreiecke und ein eigenes Mesh** |
| `vcMat`, `glassMat`, `bottleGlass` | 04-models.js:5–11 | Vertexfarben-Material (r 0,45), Folie/Glas | |
| `geraetBau()` + `geraetMat(art)` | 06-fixtures.js:280–305 | **Sammler**: lack/metall/matt/glas/leucht, `pivot`, `box/rund/zyl/fertig` | Vorbild 1 (Kasse, Terminal) |
| `VC`-Liste mit `B()/Cy()` | 11e-palette.js:166, :397 | Sammler lokal, `vcMat` | Vorbild 2 (V1, Palette) |
| `hvSammler()`, `hvInst()`, `hvMaterialien()` (HVM) | 30-halle-basis.js:267, :302, :211 (Branch) | Sammler je Material (lack/metall/matt/leucht/plexi/…), Einheitsformen, Instanzen mit Hüllkugel, Materialtabelle | **bestes Vorbild**, aber an Halle gebunden |
| `hzAdd/hausKit`, `stM/mT/stOrt` | 05e-street.js:132, :152, :1658 | Sammler für Stadthäuser bzw. Stadtmöbel (nach Material-Schlüssel) | 3. und 4. Sammler |
| `sammler()` (Stadt), `logiSammle()` | 05j-stadt.js:405, 05m-logistik.js:40 | Stadt-Sammler bzw. Szene-Delta (Tore einfangen) | |
| `zAdd/zWand/zHook/oeffneZone` | 05h-ausbau.js:9–55 | Objekt bis zum Kauf unsichtbar | alles ist **gebaut**, nur `visible=false` |
| `leuchtenRaster` | 05h-ausbau.js:121 | Deckenleuchten-Raster, 2 gemergte Meshes | schon fast „Baukasten-Lampe“ |
| `meterUV`, `bodenUV`, `hvMeterBox`, `gitterGeo` | 05-world.js:245/262, Halle :323, 05h:821 | Kachelung über **UV in Metern** → ein Material für alle Größen | richtiges Muster, uneinheitlich genutzt |
| `lampMats` | 05-world.js:6 | Liste emissiver Materialien, die Tageszeit schaltet | 12+ Stellen legen je ein eigenes an |
| Laufzeit-Bündelung | 03b-post.js:175–274 | siehe 0.2 | |
| `reuse-ao/pool/ps/sound.js` | src/parts | **nicht in `build.sh`** (Altlast; `concreteTex`/`flat` stehen dort doppelt) | |

Sammler gibt es also **mindestens sieben Mal** (geraetBau, 11e-VC, 11e-vsHolzGeo, hausKit, Stadtmöbel, 05j `sammler`, hvSammler) mit je eigener Material-Zuordnung.

## 2. Inventar je Kategorie

Spalte „M/T/A“ = Meshes / Dreiecke / Zeichenaufruf-Gruppen (Material-Array-Meshes zählen je Gruppe) **gemessen** (Aufbau, inklusive Unter-Aufrufe), Spalte Material = Material-Objekte (davon neu konstruiert). „Hit“ = unsichtbare Trefferflächen (nicht gezeichnet).

### 2.1 Tore

| Datei:Zeile | Funktion | Aufrufe | Varianten / Parameter | Bauweise | M/T/A (gemessen) | Material |
|---|---|---|---|---|---|---|
| 05g-dock.js:177 (`TOR` :6, `panelPose` :26, `doorSet` :32, `updateDoor` :47) | `buildTor` | 1 (R1 Basisrampe, x −20) | Sektional 3,26×3,0, 5 Panele × 0,6 m laufen über Viertelkreis R 0,42 unter die Decke | 5 Panele = je 1 Mesh (Box, 6-Array), Zarge/Schienen (7 Bogenstücke)/Welle/Federn/Antrieb/Kette/Warnleuchte/Ampel/Bedienkasten/Abdichtung/Puffer = **rund 70 Einzelmeshes**; kein Merge | 97 / 6 224 / 122 | 27 (25), `torPanelMat` 1024×256 geteilt |
| 05g-dock.js:59–135 | `buildDock` (Rest) | 1 | Hofmauer, **Schiebetor Hof** (:79, 21 bbox), Vordach, 2 Wandstrahler, 2 Poller, ~26 Bodenstriche (je Mesh+Material), Schilder ANLIEFERUNG/WARENEINGANG | Einzelmeshes | 187 / 12 694 / 212 inkl. Tor | 84 (79) |
| 05h-ausbau.js:1308 (+ `westTorInnen` :1257, `WRAMPEN` :1194, `WTOR` :1196, `WTORE`) | `westTor` | **4** (R2–R5, `logiToreBauen` 05m:96) | Sektional 3,4×3,05; Außen: Zarge, Gummipuffer, Vordach+Schnee, Dichtung, 2 Poller, Ampel, Nummernschild (Canvas je Tor); Innen: Schienen bis 2×H, Welle, Federn, Antrieb, Ampel, Kasten, Nummernschild | Blatt = 5 Panel-Meshes (derselbe `torPanelMat`), alles andere Einzelmeshes; **Innenseite dupliziert die Ausstattung von R1** | je Tor 73 / 5 916 / 98; ×4 = **292 / 23 664 / 392** | je Tor 29; 116 gesamt, 9 Canvas |
| 11e-palette.js:392 (`vdPanelMat` :355, `vdSetzen` :322, `V1` :37) | `buildVersandhof` | 1 (V1, Rolltor) | Rolltor 3,26×3,0, **6 Lamellenpanele** à 4 Lamellen (3 Texturen 512×128: normal/Fenster/unten), Wickelkasten, Warnschraffur, Ampel, Schwanenhals-Lampe, Fluter, DDL-Schild, Telefon, Hof, Zaun, Poller | **Schienen/Kasten/Antrieb/Lampen gemergt** (`VC`→`vcMat`), Panele einzeln | 83 / 7 402 / 83 (gesamter Versandhof) | 48 (47), 8 Tex |
| 05h-ausbau.js:1618–1626 (in `buildLogistik` :1584) | Ladetore „Logistikzentrum Ost“ | 4 (Attrappen) | Plane mit `torBlattMat` (:1223, 512×640, 5 Panele aufs Bild gemalt) + Zarge, 2 Puffer, Vordach | je Tor 1 Plane + 5 bbox (≈ 28 Meshes gesamt) | – | dritte Tor-Textur |
| 05f-facade.js:240 | `buildSchiebetuer` | 2 (Haupteingang + Eingang 2) | Alu, 2 Flügel, Sensoren, Bodenführung | Einzelmeshes | je 29 / 2 476 / 29 | 6 |
| 05l-eingang2.js:12 | `eingangsAchse` | 1 | Festfelder, Pfosten, Vordach, Matte, Schild | Einzelmeshes | 48 / 4 134 / 48 | 13 |
| 05e-street.js:429 (`tuerTex` :400) | `hausTuer` | 9 (Stadt, Läden gegenüber) | Tür-Textur 256×512 je Farbe (5×) | im `hausKit` gemergt | in Straße | 5 Tex |
| 05h-ausbau.js:459 / :1654 | `streifenvorhang` ×3, Doppeltor im Zaun | 3 / 1 | PVC-Lamellen, Gitterflügel (~25 bbox) | Einzelmeshes | 6 / 792 / 6 | |
| **Branch** 30-halle-gebaeude.js:317 | `hvTor(G,S,name,cx,cz,face,B,H)` | R2–R4 + R5/R6 + N1 (:279) + R1/V1 innen | Lamellenblatt 1 Mesh (`hvLamellenTex`), Fenster/Schienen/Welle/Kasten/Ampel/Taster über Sammler; Überladebrücke | Sammler → je Material 1 Mesh | Halle gesamt laut `docs/halle` 281 Aufrufe / 238 k Dreiecke (**nicht von mir gemessen**) | `HVM.tor`, `HVM.metall`, `HVM.lack`, `HVM.leucht` |

**Fazit Tore:** 6 getrennte Implementierungen im Hauptspiel (R1, R2–R5 außen, R2–R5 innen, V1, Ost-Attrappe, Schiebetür) + 1 auf dem Branch; 3 Tor-Texturfamilien (`torPanelMat`, `torBlattMat`, `vdPanelMat`; Halle `hvLamellenTex` ist die vierte); 4 Ampel-/Warnleuchten-Varianten mit je eigenen Materialien; rund 420 Meshes für die 6 Ladetore + Attrappen (97 + 292 + 28), mit V1-Hof und Eingängen ≈ 600 (23 % aller); danach ungefähr 60–70 möglich (4 Sammler-Meshes + 5–6 Panel-Meshes je Tor).
Die Tor-**Schnittstelle** hängt an Spiellogik: `door/doorSet/doorOpen/doorIsOpen` (05g), `WTORE[k].blatt/zu/auf/t/rot/gruen` + `wtorSet` (08c), `VD.panels/lampR/lampG/warn/schwan` + `vdSetzen/vdOffen` (11e), `TOR_G/TOR_COLS`. Diese Namen müssen bleiben.

### 2.2 Regale, Tische, Gitterboxen, Kassenregal

| Datei:Zeile | Funktion | Varianten (Parameter) | Bauweise | M/T/A (gemessen je Stück) | Material |
|---|---|---|---|---|---|
| 06-fixtures.js:895 (`bauMoebel` :821, `regalFarben` :787, `regaleFaerben` :803, `SHELFKIND` 02-data.js:540) | `createShelf` | 13 Arten: klein 10/368, standard 12/454, hoch 14/528, kühl 20/1 116, gondel 24/908, eck 26/1 100, groß 8/306, tisch 5/232, tischgroß 5/232, gitter(×3) 13/268, kasse 16/744 (Meshes/Tris) | Gestell **je Warenseite 1 gemergtes Mesh** (Vertexfarben nach Rolle: rahmen/seite/blende/boden/lippe/kopf/preis/fuss/platte/rueck; Umfärben ohne Neubau), Rückwand `pegMat` (Lochblech 256², geteilt), **je Fach 1 Preisschild-Plane mit eigener Canvas 700×80 + 1 Hit**, 1 Kopfschild 1024×160 | siehe Spalte links; davon Hit = Anzahl Fächer | 2–14 neu je Regal, 2–9 Canvas |
| 06-fixtures.js:1324 (`rackMats` :1297, `RACKKIND` :1168) | `createRack` (Lager) | standard 19/1 070, hoch 27/1 646, schwer 27/1 478 | 4 Pfosten **einzeln** (`_postM` Lochtextur 64×512), Böden je Ebene einzeln (`_deckM`), Rahmen+Traversen+Diagonalen gemergt (`_rahmenM`), Schild; Hit = Ebenen × 3–4 Plätze (9/15/16) | | 2–5 neu, 1–3 Canvas |
| 06-fixtures.js:821 | Gitterbox (`bau:'gitter'`) | 3 Größen | Unterbau gemergt, **eigenes `MeshStandardMaterial` je Box** mit `gitterTex` 128² (geteilt) und Alpha-Test, 4 Gitter-Planes | 13/268 | 5 neu |
| 11d-packmaterial.js:189 (`vmTexturen` :124) | `vmRegalBauen` | Packmaterial-Regal (blau/verzinkt, 4 Böden), je Packplatz | `B()`-Sammler + 12 Instanzen Klebeband + Folienrollen als Einzelmeshes + 5 Schilder | in `buildPackstation` (188 / 35 728 / 233) | 3 Texturen Wellpappe/Folie |
| 06-fixtures.js:110 / :452 | `buildCheckout`, `buildDesk` (+`geraetBau`) | Kasse/Pult, Kassenregal-Farben `CK_KORPUS` | `geraetBau`-Sammler teils, Rest Einzelmeshes | 33 / 2 342 und 104 / 5 014 | 24 und 68 |
| 05e2-laeden-innen.js (Atlas `iaTex` :333) | Läden gegenüber | Regalinhalt **nur als Texturatlas** | 1 Atlas, kein 3D | – | 1 Tex |
| **Branch** 30-halle-gebaeude.js:293 / 30-halle-hochregal.js:71 | `hvRegaleKarton`, `hvHochregalGasse` | Fachregal (Rahmen Sammler, Kartons **Instanzen**), Hochregal 3 Gassen × 180 Plätze | Sammler + `hvInst` | in Halle | `HVM.karton` (Atlas) |

Texturspeicher je Standard-Regal: 4 × 700×80 + 1024×160 ≈ 1,55 MB (≈ 2,1 MB mit Mips); bei 50 Regalen ≈ 100 MB nur für Preis-/Kopfschilder (Canvas bleibt erhalten, weil er neu bemalt wird).
Fünf Regalbauarten (Laden/Rack/Packmaterial/Gitterbox-Tisch/Kasse) mit **drei Farbsystemen** (`regalFarben`, `rackMats`, `BLAU/ZINK` in 11d).

### 2.3 Lampen / Leuchten

| Datei:Zeile | Funktion | Aufrufe | Bauweise | M/T/A | Material |
|---|---|---|---|---|---|
| 05c-buildworld.js:154–168 | Deckenleuchten Laden (15) + Lager (12) | 27 | je Leuchte 2 `bbox` (Schattenfuge, Rahmen) + 1 Plane → **81 Einzelmeshes**, ~5 900 Tris | in `buildWorld` | `panelM` Basic (`deckenDiffuse` 512×256) |
| 05h-ausbau.js:121 (`leuchtenMat` :113) | `leuchtenRaster` | 11 (Zonen via `halle()` :144) | **gemergt**: 2 Meshes je Raster, Größe skaliert mit Höhe (`f=y/3.8`) | 22 / 4 004 / 22 gesamt | `_korpusM` (Vertexfarben) + `_panelM` |
| 05h-ausbau.js:1442 | `hofMast` | 6 | Zylindermast + Ausleger + 2 Gehäuse + 2 Leuchtflächen, Einzelmeshes | je 7 / 636 | 4 neu (2 `lampMats`) |
| 05e-street.js:2153 (`lampTeile` :2029) | `strassenlampe` | 20 (18 im Straßen-Sammler) | Mast einzeln, Rest gemergt (`lack`/`lampe`), Lichtkarte statt Lichtfläche | 3 / 664 | geteilt (`strMats`) |
| 05g-dock.js:103–115 | 2 Wandstrahler | 2 | 5 bbox je Leuchte | 10 | je eine `lampMats` |
| 11e-palette.js:420–440, :483 | Schwanenhals (8 Zylinder-Segmente in `VC`) + Fluter V1 | 1 | gemergt + 3 Einzelmeshes | in Versandhof | `VD.schwan`, `VD.fluter` |
| 05f-facade.js:70, :81 | Neonröhren (4), Strahler (2) | 1 | Einzelmeshes | in `buildFacade` | 6 `lampMats` |
| 05n-park.js:136, 06-fixtures.js:373 (`sbLampe`), 05d-yard.js:468 (Testfeld), 05j-stadt.js:1042 | Parklampen, SB-Kassen-Lampen, Testfeldlampe, Hochstraße | – | je eigene | | je eigene |
| Tor-Warnleuchten/Ampeln | siehe 2.1 | 6 | Zylinder/Kugel + Material je Tor | | je 3 `lampMats`-fähige Materialien |
| **Branch** 30-halle-gebaeude.js:254, :368 (`lb`) + `hvLampe` | Hallenleuchten, Binderstrahler | ~100 | Sammler (`lack` + `leucht`) | in Halle | `HVM.leucht` |

12 Stellen legen **eigene emissive Materialien** an und tragen sie einzeln in `lampMats` ein (05d:468, 05e:271/1676/1678, 05f:70/81, 05g:111, 05h:1453, 05j:1042, 05n:136, 11e:437/483). `LAMPEN` (03-scene.js:84) füttert die beweglichen Innenlichter (`INNEN_N` PointLights).

### 2.4 Paletten, Kartons, Gitterboxen

| Datei:Zeile | Funktion | Aufrufe | Bauweise | M/T/A | Material |
|---|---|---|---|---|---|
| 05h-ausbau.js:1521 | `palettenStapel` (Holz #8e7550/#a58a5e, Schneehaube) | 5 | 1 gemergtes Mesh je Stapel (132 Tris je Lage) | je 1 / 936 (n = 7) | `holzMat` (Vertexfarben) |
| 11e-palette.js:166 (`vsHolzGeo`) | Palette (Holz #c49a62/#a9814e) | 1 Geometrie, 1 Mesh je Palette (`vsPalObj`), bis 6 | ~20 Fasenboxen gemergt (~960 Tris) | – | `vcMat` |
| 11e-palette.js:288 | `hubModell` (Hubwagen) | 2 | | | |
| 30-halle-hochregal.js:10, :17 (Branch) | `hvPalGeo`, `hvPalGeoRegal` | Instanzen (`hvInst`) | Instanzen | | `HVM.holz` |
| 04b-pool.js:55, :82 | `kartonGeo` (0,6×0,4×0,45), `buildKartons` | **1 Material + 1 Canvas 256² je Produkt: 239** | ein `Mesh` je Karton (putInSlot 06:1403, floorBoxes 08-boxes:13, LKW 08b:220, Karre 08d:108) | Textur 62,7 MB | `kartonMat[t]` |
| 08e-kiste.js:23 | `kisteMat` (Mehrwegkiste) | 1 | | | |
| 11c-versand.js (`vsMat`, `vsPaketMeshe` 11e:182) | Pakete | 4 Größen, je Palette 1 Mesh mit 4 Gruppen | gemergt | | 3 + 3 Deckel |
| 15c-karton.js | Karton-Inhalt (Hand) | | | | |
| **Branch** `hvKartonAtlas` (30-halle-basis.js:162) | Karton-Atlas, `hvKartonGeo` | Instanzen | **1 Atlas statt 239 Texturen** | | `HVM.karton` |

Drei Paletten-Varianten (andere Holzfarbe je Variante), zwei Karton-Systeme (Hauptspiel: Textur je Produkt; Halle: Atlas).

### 2.5 Zäune, Absperrungen, Ladezonen, Anfahrschutz, Poller

| Datei:Zeile | Funktion | Aufrufe | Bauweise | M/T/A | Material |
|---|---|---|---|---|---|
| 05e-street.js:25 (`gitterMat` :4) | `zaunLauf` Doppelstabmatte | **9** (05e:76/80, 05h:1640–1642, 05m:124–127) | je Pfosten (alle 2,5 m) 1 Pfosten + Kappe + 2 Schellen = 4 `bbox`, Sockelschiene, 1 Gitterplane | **302 Meshes / 31 662 Tris** (33 Meshes je Lauf) | `gitterMat` erzeugt je Lauf **neues Material + 256²-Textur** (9×, identisch), 3 `std` je Lauf |
| 05e-street.js:74 | `buildZaun` Testfeld + Warnschilder | 1 | | 47 / 4 546 | 3 Tex |
| 05h-ausbau.js:825 (`vsGitterMat` :809) | `gitterZaun`, `ladezoneBauen` :857, Packstation-Box | 12 Läufe | **gemergt** (Vertexfarben, Sammler-`B`), Gitter als UV-skalierte Plane, **1 Material für alle** | 9 Planes | 1 (geteilt) |
| 05h-ausbau.js:285/308/339 | `sperrband`, `lagerSperre`, `testfeldSperre` | | Band-Textur `sperrbandTex` :271 | | |
| 11e-palette.js:476–481 | `zaun` (Versandhof, inline) | 3 | `bbox`-Pfosten alle 2 m + transparente Box + 2 Holme | ~30 | `std` je Lauf |
| 05g-dock.js:79, 05h-ausbau.js:1654 | Schiebetor Hof, Doppeltor Logistikzaun | 2 | ~21 / ~25 bbox | | |
| 06-fixtures.js:821 | Gitterbox | siehe 2.2 | | | |
| **Branch** 30-halle-produktion.js:146 | `hvZaun` | – | Sammler, UV in Metern (`HV_METER`), `HVM.zaun` | | |
| **Poller / Anfahrschutz** | | | | | |
| 05e-street.js:2356 | `stPoller` (Zylinder grau) | 2 | gemergt | | |
| 05f-facade.js:~150 | 2 Poller (Box + goldene Kappe) | 2 | bbox | | |
| 05g-dock.js:130 | 2 Poller (gelb + schwarze Kappe) | 2 | bbox | | |
| 05h-ausbau.js:1388 (`westTor`) | 2 Poller je Tor (gelb) + Gummipuffer | 8 + 8 | bbox | | |
| 11e-palette.js:479 | 2 Poller (gelb) | 2 | bbox | | |
| 05d-yard.js:238 | Anfahrschutz Stahlrohr (Testfeld) | | | | |

**Fünf Zaunsysteme** (Doppelstab, Gitter-Gelb, 11e-Zaun, Gitterbox, Halle) und **sechs Poller-Varianten** in vier Farben.

### 2.6 Schilder / Beschriftungen (Canvas)

- **Schildstil „Nachtblau #1b2340 + Gold #ffd23f/#f2c230 + `BUN`/`BAR`“ wird mindestens 12× einzeln gemalt**: 05d:272, 05g:124/135, 05h:329/434/1167/1300/1384, 05l:57, 05m:86/158, 06:389/1273, 11e:468 (+ `hvSchildTex` Branch :199). Jedes Mal ein eigener Canvas + eigenes Material, 64–1024 px.
- Weitere Schilder: `schild()` 05d:26 (Pfosten-Hinweisschild, 3×, 9 Meshes), `warnSchild` 05e:65 (3×, Textur `warnTex` geteilt), `drawSignFace` 05f:24 (Leuchtschild 1024×256), `ddlSchildTex` 11e:379, `drawPackSchild` 05h:1164, Regal-/Rack-Schilder (06), `stSchild` 05e:2362 (Straßenschilder im Sammler), Tor-Nummern (4+4 Canvas), Fußmatte 1024×540 (05f), Kanal-Etiketten 6× 120×90 (05d).
- Regalschilder: Preis 700×80 je Fach, Kopf 1024×160 je Regal (`REGAL_TEX` skaliert nur für Vorführungen).
- Halle (Branch): `hvSchild(parent,txt,unter,w,h,x,y,z,ry,bg,fg)` :353 – einheitliche Signatur, aber eigener Canvas je Aufruf.

### 2.7 Fassaden, Paneele, Sockel, Wände, Fenster, Türen

| Datei:Zeile | Funktion | Aufrufe | Bauweise | M/T/A | Material |
|---|---|---|---|---|---|
| 05-world.js:281 (`meterUV` :245) | **`wall()`** | **147** | 1 `BoxGeometry` mit **6-Material-Array** (innen/außen/Laibung), UV in Metern; `occluders`, `WAENDE` | 147 / 1 764 / **882 Gruppen** | `wallBrickMat` :197, `wallSet`, `trimMat`, `lagerWall` :242, … 320 Material-Objekte |
| 05h-ausbau.js:56–112 | `stilleWand`, `sockelLeiste` ×44, `trennwand` ×12, `durchbruchWand` :222 ×21 (75 Meshes, 345 Gruppen) | | bbox/wall | | `sockelM` (#1a2038) |
| 05h-ausbau.js:144 | `halle()` (Boden, Decke, Dach, Wände, Sockel, Leuchten, AO) | 10 | Einzelmeshes + `leuchtenRaster` | 82 / 5 260 / 127 | 74 (28) |
| 05h-ausbau.js:1201 (`blechMat`) | Trapezblech Hallenwand | 1 Material, 4 Aufrufe | Textur 256×64, UV in Metern | | geteilt |
| 05m-logistik.js:49, :67 | `logiSuedwand`, `logiStufeBauen` | 3 Stufen | wall + bbox | 87 / 3 866 / 312 | |
| 05f-facade.js:42 | `buildFacade` (Schild, Gesims, Sohlbänke, Sockel, Matte, Leuchtkasten) | 1 | ~93 bbox/Planes | 93 / 8 230 / 93 | 31, 4 Tex |
| 05e-street.js:1442/1455/581 | `buildNachbar`, `nachbarFassade`, `ladenFront` | 1 / 2 / 6 | 126 Meshes bzw. 2 Meshes mit 2048²-Atlas (16,8 MB) | 126 / 10 638 / 206 | |
| 05h-ausbau.js:1407 | `lagerFensterWand` | 1 | 55 Meshes, 105 Gruppen, Alurahmen/Glas/Bänke | 55 / 4 404 / 105 | 13 |
| 05e-street.js:468 | `fenster` | 123 | im `hausKit` gemergt (Atlas `fensterUV`) | | |
| 05-world.js:210, 05e-street.js | `brickMat(len,h)` Betonfertigteil (**nicht gecacht**), `wallBrickMat`, `fassadeTex` 05-world:121 | 2 / 1 / 1 | 256² je Aufruf | | |
| 05o-oberflaechen.js:439–527 | Boden/Wand Laden (wählbar) | 1 Boden + 1 Wand | Maler-System, `bodenPx` 2048/1024, `wandPx`, Relief, **bereits stufenabhängig und zentral** | | `floorMat`, `shopWall` |
| 05b-ao.js:1–35, `roomAO` | Boden-AO-Streifen, `concreteTex` | 14 / 40 Planes | | 39 / 78 | |
| Branch 30-halle-gebaeude.js:8 | `hvGebaeude`, `hvWand`, `hvHallenWand`, `hvWandMitOeffnungen` | | Sammler, UV in Metern, Paneel-/Sockeltextur mit Schmutz (`hvPaneelTex` :96, `hvSockelTex` :119) | | `HVM.paneel/gelb/sockel/decke` |

**Leitern:** im Hauptspiel keine 3D-Leiter gefunden (nur die Ware „Leiter“ in 04g-form-zubehoer); Halle: Steigleiter am Regalbediengerät (30-halle-hochregal.js:133).
**Bodenmarkierungen:** 24 `flat()`-Aufrufstellen (05b-ao.js:35); 05g:116 (~26 Striche, je Mesh + `std(0xf2c230)`), 05m:117–120 (≈ 32 Quads), 11e:468 (`MeshBasicMaterial` je Strich), 05h `reserveTex` :835 / `ladezoneBauen`; Halle `hvMarkierungen` :162 (**ein Mesh je Material, Schraffur-Textur in Metern**, Vorbild).
**Türen/Fenster/Leitern/Gitter gesamt** sind in 2.1/2.7 enthalten.

### 2.8 Weitere mehrfach unabhängig gebaute Dinge

- **Autos/LKW** (`makeAuto` 05e:1134 ×7, 08b-truck.js, `abstellAuflieger` 05h:1459 ×4 = 10 Meshes / 2 564 Tris je Stück, eigener 512×256-Canvas je Auflieger), **Hubwagen/Sackkarre/Karre** (11e:288, 08d:55), **Müllcontainer** (`buildMuelleimer` ×2 = 34 Meshes), **Masten/Fernsehturm/Kran** (`buildKran` ×2).
- **Schneehaufen** (05e:2486/2501: 1 Mesh, **18 928 Tris**), `schneeGeo` ×28.
- **Streifenvorhang**, **Schleuse** (`buildSchleuse` 05h:484), **Lagergang** (`buildLagergang` :380, 20 Meshes / 70 Gruppen).
- **Ampeln/Warnleuchten** (6 Tore × eigene Zylinder und Materialien) und **Steuerkästen** (Gelb #f2c230, 3 Taster: 05g, 05h ×2, 11e, Halle `hvTor`) – derselbe Kasten fünfmal.

## 3. Materialien, Farben, Texturen

### 3.1 Farb-Cluster (Hex im Code, ΔE < 7, Weltdateien 03–15c, 966 Literale, 526 verschiedene)

Gemessen (Szene, Start): 741 Materialien ohne Textur → 240 Signaturen (Typ, Farbe, roughness, metalness, emissive …) → **501 Dubletten**. Häufigste Mehrfach-Objekte: `#3f4654` r 0,85 ×48 (Sockel/Stadt), `#f2c230` r 0,85 ×38 + r 0,7 ×11 + r 0,6 ×10 (**59 Objekte für ein Gelb**), `MeshBasic #f9e278` ×26, `#eef2f8` r 1 ×14 (Schnee), `#e6e8ee` ×13, `#2b2f3a` ×13, lampenartig `#23262e`+emissive ×13, `#16181d` ×13, `#4b515c` m 0,62 ×12.

| Vorschlag Name | Hex | roughness / metalness | Textur | Cluster (Literale / Dateien) | Stellen (Auswahl, Anzahl Literale) |
|---|---|---|---|---|---|
| `lackAnthrazit` | #2a2e38 | 0,55 / 0,35 | – | 135 / 15 (57 Varianten: 2a2e38, 2a2e36, 2b2f36, 2b3040, 2b2f3a, 23262e …) | 05h 29, 06 25, 05e 20, 08b 9, 05d 8, 05n 7, 04 6, 11e 6, 05f 6 |
| `stahlVerzinkt` | #8d939d | 0,42 / 0,60 | – | 66 / 13 (9aa1ac, 8f959e, 7d838c, 9aa0a8) | 05e 28, 05h 10, 06 8, 05g 3, 11e 3 |
| `alu` | #c9ced6 | 0,30 / 0,80 | – | 65 / 12 (c8ccd4, b9bec6, d9dde3, c4c8ce) | 06 25 (Kasse), 05e 17, 05h 6, 11e 4, 05f 3 |
| `gummiSchwarz` | #1c1f24 | 0,95 / 0 | – | 61 / 12 (16181d, 1b1d22, 1b1b1b) | 05e 14, 05h 9, 06 9, 11e 7, 04 6, 05d 6 |
| `lackGraphit` | #3a4150 | 0,50 / 0,50 | – | 45 / 11 (3a3f48, 3a3f47, 3d4450, 3b3f47, 3b4049) | 05e 16, 05h 8, 08b 5, 05g 4, 06 4 |
| `grauMittel` | #6a7078 | 0,60 / 0,25 | – | 36 / 8 (5a6068, 59606b, 6f757e) | 05e 17, 05h 7, 08b 3, 05d 3 |
| `lackWeiss` | #e8ecf2 | 0,70 / 0 | – | 36 / 8 (e6e8ee, dfe3ea, e9ebee) | 05h 13, 06 8, 05e 4, 05n 3, 05c 3 |
| `schnee` | #eef2f8 | 1,0 / 0 | – | 14 Material-Objekte (`snow` je Funktion neu) | 05f, 05g, 05h, 05m |
| `signalGelb` | #f2c230 | 0,65 / 0 | – | 25 / 10 (+ #ffd23f Schildgold, #ffc93a, #e7a91c Gitter-Gelb) | 05h 5, 04 4, 07 4, 05g 3, 11e 3, 05d 2 |
| `signalRot` | #d8352a | 0,60 / 0 | – | 26 / 12 (c8322a, d23a2a) | 04 8, 06 3, 05e 3 |
| `signalGruen` / `signalOrange` / `signalBlau` | #2f9e57 / #f2a01c / #2a5a9e | 0,6 / 0 | – | 7 / 7 / 9 (Ampel, Antrieb, Regalrahmen) | 05g, 05h, 06, 11d |
| `schildBlau` | #1b2340 | 0,70 / 0 | Schildfabrik | 10 / 6 + 12 Canvas | siehe 2.6 |
| `betonHell` | #a8acb2 | 0,92 / 0 | `beton` 256² (geteilt, UV-Kachelung) | 19 / 7 + `concreteTex` 19× | 05h 5, 06 4, 05e 4, 05g 2, 05m 2 |
| `holzPalette` | #c49a62 (dunkel #a9814e) | 0,94 / 0 | – | 14 / 7 (+ **#8e7550/#a58a5e in 05h:1521 weicht ab**) | 11d, 05h, 11e, 05d, 06, 11c |
| `wellpappe` | #c89b5c | 0,90 / 0 | Atlas (Etikett als Aufkleber) | `kartonMat` 239×, `vmPappe`, `kisteMat`, `vsMat` | 04b, 11d, 08e, 11c |
| `lampeWarm` | emissiv #fff0d0, Körper #23262e | 0,3 / 0 | – | 18 / 11 + 12 einzelne `lampMats` | 03, 11e, 08b, 05d, 05g, 05h, 05f |
| `glasKlar` / `glasGetoent` | #d6ecff / #d8e8f4 | 0,05 / 0,1, Deckkraft 0,17–0,22 | – | `glassMat`, `coldGlass`, 05f `glass`, `HVM.plexi`, Torfenster | 04, 06, 05f, 05g, 11e |
| `blechTrapez`, `sandwichPanel`, `lamellen`, `drahtGitter`, `warnSchraffur` | – | je 0,4–0,6 / 0,3–0,4 | geteilt, Kachelung **nur über UV in Metern** | siehe 3.2 | |

Rauigkeit/Metall sind überall dazu **frei gewählt** (z. B. Gelb r 0,6 / 0,7 / 0,85). Vorschlag: 5 Klassen (matt 0,9 / lack 0,55 / halbmatt 0,7 / Stahl 0,42+m 0,6 / Alu 0,3+m 0,8) statt freier Werte.

### 3.2 Prozedurale Texturen – wo, wie oft, doppelt?

| Textur | Erzeugt in | Aufrufe | Größe | geteilt? | Doppelt / Vorschlag |
|---|---|---|---|---|---|
| Beton | `concreteTex` 05b-ao.js:33 | **19 Aufrufe an 12 Stellen** (05c 1, 05g 2, 05h 6, 05m 2, 11e 1); Definition steht **zweimal** (reuse-ao.js:29, nicht gebaut) | 256² | nein, `.repeat` je Aufruf | **1 Textur**, Kachelung über UV in Metern (spart 18 Texturen) |
| Drahtgitter | `gitterMat` 05e:4 / `vsGitterMat` 05h:809 / `gitterTex` 06:813 / Halle `hvZaunTex`, `hvRostTex` | 9 / 1 / 1 / 2 | 256² / 128² | nur `vsGitterMat` | **1 Draht-Textur + Farbe über `color`** |
| Torpanel | `torPanelMat` 05g:148, `torBlattMat` 05h:1223, `vdPanelMat` 11e:355, Halle `hvLamellenTex` | 1 / 1 / 3 / 1 | 1024×256, 512×640, 3×512×128 | ja (je Typ) | 3 + 1 Familien → **1 Paneltextur-Familie** |
| Warnschraffur | `vsWarnTex` 11e:376, 05g:267 (Torkante), Halle `schraffur`, 05h `reserveTex` | 4 | 64×256, 512×48, 64² | je 1 | **1** |
| Wellpappe | `buildKartons` 04b:84, `vmPappe` 11d:119, `kisteMat` 08e:23, `vsMat` 11c, Halle `hvKartonAtlas` | **239**, 1, 1, 2, 1 | 256² je Produkt | je Produkt | **Atlas** (Halle zeigt es) – 62,7 MB → ~2 MB |
| Preis-/Kopfschild | `createShelf` 06:~950 / :969 | 4–5 je Regal | 700×80, 1024×160 | nein (Canvas bleibt) | **ein Schildatlas** je Seite |
| Nachtblau-Gold-Schild | 12 Stellen (2.6) | 12 | 64–1024 | nein | Schildfabrik mit Cache |
| Betonfertigteil | `brickMat` 05-world:210 | 2 | 256² | nein | cachen |
| Gesamt `tex()` | alle | 482 Aufrufe, 158 verschiedene (Zeichencode, Größe) | 304 MB Rohpixel | – | sichere Dubletten ≥ 27 (Beton 18, Gitter 8, Betonfertigteil 1) + 239 Karton-Texturen mit gleichem Zeichencode, aber je Produkt anderem Inhalt |
| Stufen | – | – | **fest**, nur Boden/Wand-Laden (2048/1024/512), Ware (`TEX_FAKTOR`), Läden-Innen (0,5 bei Niedrig), Halle (`hvQ().tx`) | | Bibliothek soll `MAT.stufe()` einmal beim Laden festlegen |

Größte Einzeltexturen: Boden Laden 2048² (16,8 MB), Läden gegenüber 2048² (16,8), Park 2048×1060 (8,7), Straße 2× 1024×2048 (je 8,4), Wand Laden 1024×1418 (5,8).

## 4. Dreiecke und Zeichenaufrufe – Zusammenfassung je Kategorie

Anteil an den gezeichneten Aufrufen (Hauptpass, **ohne** Laufzeit-Bündelung, gemessen mit `renderBufferDirect` im Build mit Zähl-Wrapper `mess3`; die Gesamtzahlen weichen deshalb um ±10 % von der Tabelle in Abschnitt 0 ab, `mess4` = Build ohne Wrapper; Zuordnung über den erzeugenden Aufbau-Aufruf):

| Ansicht (Hauptpass-Aufrufe) | Anlagen* | Wände/Sockel/Fenster | Tore | Zäune | Regale | Lampen | Fassade/Schild | Stadt/Straße/Park (Dreiecke) |
|---|---|---|---|---|---|---|---|---|
| Laden (973) | 45 % | 13 % | 8 % | 6 % | 9 % | 3 % | 2 % | 8 % der Aufrufe, **79 % der Dreiecke** |
| Lager (815) | 42 % | 13 % | 14 % | 8 % | 2 % | 3 % | 2 % | 10 % / 79 % |
| Lagerdock (1 124) | 35 % | 15 % | 5 % | 3 % | 14 % | 3 % | 10 % | 10 % / 80 % |
| Testfeld (586) | 56 % | 8 % | 0 % | 9 % | – | 3 % | 4 % | 13 % / 82 % |
| Dock-Hof (1 428) | 38 % | 16 % | 8 % | 3 % | 11 % | 3 % | 9 % | 10 % / 80 % |
| Halle West (416) | 24 % | 8 % | **36 %** | 12 % | – | 4 % | – | 11 % / 83 % |

\*Anlagen = `buildDock`, `buildYard`, `buildPackstation` (188 Meshes / 35 728 Tris), `buildDesk`, `buildCheckout`, `buildLogistik`, `logiHofBauen` (273 / 29 798), `buildVersandhof`, Auflieger, Kran, Terminal: zusammengesetzt aus denselben Primitiven – der Baukasten-Sammler ist der Hebel, nicht ein einzelnes Bauteil.
Schattenpass (nur Sonne, fest um den Laden): **`wall()` allein 170–268 von ~620 Aufrufen**, `buildPackstation` 50, `buildYard` 40, `createRack` 38, `createShelf` 34. Die Wände sind der teuerste Einzelposten im Schatten (6 Gruppen je Box, im Schattenpass keine Bündelung der Wände).

## 5. Priorisierte Umbauliste Optik

Ehrlich: **Tore zuerst ist für Einheitlichkeit richtig (Toms Beispiel, 6 Dubletten, größte sichtbare Abweichungen), aber nicht der größte Leistungshebel.** Die Daten legen eine Reihenfolge nahe, in der der gemeinsame **Kern** (Material-Cache + Sammler) und die **Wand-/Zaun-Primitive** vor oder mit den Toren kommen. Tore taugen als Pilot, weil sie alle Bausteine brauchen (Sammler, bewegte Panele, Ampel/`lampMats`, Textur, Schild, Poller) und eine feste Spiellogik-Schnittstelle haben.

| # | Paket | Betroffene Dateien | Nutzen (Einheitlichkeit / Leistung) | Risiko, Tests (Abschnitt 9 + `src/tests`) | Aufwand* |
|---|---|---|---|---|---|
| 0 | **Material-Bibliothek `01b-material.js`** + Textur-Cache (Beton, Gitter, Warnschraffur, Paneltexturen), `std()` mit Cache umstellen (Rückwärtskompatibel: erst Cache hinter `std`, dann Tokens) | reuse-helpers.js, neu 01b, `build.sh`; danach Stellen aus 3.1 schrittweise | sofort: −501 Dubletten-Materialien, −18 Beton- und −8 Gitter-Texturen; Voraussetzung für alles | gering (sichtbar nur, wenn Farbtoken abweicht). Tests: `grafik`, `grafik2`, `gfxtest`, `oberflaechen`, `licht`, `game` | 1 |
| 1 | **Baukasten-Kern `04z-baukasten.js`: Sammler** (aus `hvSammler` + `geraetBau` + `VC`), `bk.lod()`, `userData.bauteil`, `bk.schild()` mit Cache | neu; Vorbilder 30-halle-basis, 06:280, 11e:166/397 | Grundlage; ersetzt 7 Sammler; Schildfabrik ersetzt 12 Canvas-Stellen | gering, solange nur neu (Quelle nicht angefasst). Test `buendel` (Bündelung muss gemergte Originale weiter in Ruhe lassen: `_bnd`/Vertexfarben-Meshes sind ausgeschlossen) | 1–1,5 |
| 2 | **Tore** (`bk.tor`): R1, R2–R5 außen+innen, V1, Ost-Attrappe; Halle bringt später `hvTor` mit | 05g, 05h:1194–1420 und :1618, 05m:96, 11e:322–440, 08c, (30-halle-gebaeude) | Einheitlichkeit **hoch** (6→1 Implementierungen, 3 Texturen→1 Familie, 4 Ampeln→1); ~500 → ~60 Meshes; Halle-Branch passt sich an | **mittel–hoch**: Logik hängt an `door`/`WTORE`/`VD`/`TOR_G`. Tests `rampe`, `wrampe`, `logistik`, `versandtor`, `abfahrt`, `bruecke`, `lieferung`, `tuer`, `ladentuer`, `eingang`, `korb`, `raum`, `neu2`, `durchgang`, `versand`, `stufen`, `ausbau`, `gameplay`/`H:gameplay` | 2 |
| 3 | **Wand-Primitive `wall()`** ohne 6-Material-Array (Seiten über Gruppen/Teilgeometrie, ein Material je Fläche), `sockelLeiste`/`trennwand`/`durchbruchWand` auf Sammler | 05-world.js:281, 05h:56–260, 05m:49, 05c | Leistung **hoch**: 882 Gruppen, 170–268 Schattenaufrufe; Voraussetzung für Fassadenpaneele (`fassade-0910.md`) | mittel: `occluders`, `WAENDE`, Kollision, `meterUV`, Bündelung. Tests `ausbau`, `stufen`, `lager`, `doppelwand`, `wandfrei`, `gangwand`, `gangfrei`, `bodenabstand`, `sockel`, `fassade`, `naht`, `fugen`, `flimmern`, `deko`, `buendel` | 1–1,5 |
| 4 | **Zäune/Absperrungen/Poller/Anfahrschutz** (`bk.zaun`, `bk.poller`) | 05e:4–132, 05h:285–340, :825–870, :1388, :1640, :1654, 05m:124, 05g:79/130, 11e:476, 05f:~150, 05d:238 | Einheitlichkeit mittel, Leistung **hoch**: 302 → ~25 Meshes, −8 Gitter-Texturen | gering–mittel (Kollision bleibt `col`). Tests `aussen`, `karte`, `park`, `packband`, `versand`, `versandtor`, `durchgang` | 1 |
| 5 | **Lampen** (`bk.lampe`: Decke/Raster, Mast, Wand, Schwanenhals, Fluter) + **eine** `lampMats`-Quelle (`MAT.leucht`) | 05c:154–168, 05h:113–144/1442, 05g:103, 05e:2029/2153, 11e:420–440/483, 05f:70/81, 05n:136 | Leistung mittel (81 Einzelmeshes → 2), Einheitlichkeit hoch; Fassade/Hoflampen-Paket (`fassade-0910.md`) wird erledigt | gering. Tests `licht`, `game` (LAMPEN/lampMats), `flimmern`, `grafik` | 0,5–1 |
| 6 | **Paletten + Kartons** (erledigt 14.10., `kartons.md`): eine Paletten-Geometrie (Instanzen), Karton-Atlas statt 239 Texturen | 05h:1521, 11e:166, 04b:55–127, 06:1403, 08-boxes, 08b, 08d, 11b, 11c, 15c | Speicher **−60 MB** (größter Einzelposten), Einheitlichkeit; Halle hat Atlas/Instanzen schon | **hoch** (Karton-Logik, Etikettenlesbarkeit, `kartonMat[t]` wird in Tests benutzt). Tests `pakete`, `packband`, `kartonlogik`, `kartons`, `kartonauf`, `einraeumer`, `kiste`, `karre`, `sortiment`, `versandtor`, `game` | 1,5–2 |
| 7 | **Regale** (`bk.regal`: Laden, Rack, Schwerlast, Kasse, Packmaterial, Tisch, Gitterbox) + **Schildatlas** | 06:560–985/1297–1390, 02-data:540, 11d:113–232 | Einheitlichkeit hoch (3 Farbsysteme→1), Speicher ~−100 MB bei 50 Regalen, Zeichenaufrufe | **hoch**: Slots/Layout/`itemMatrix`/Speicherstand (`18-save`) hängen daran. Tests `regale`, `regalsicht`, `kassenregal`, `moebel`, `moebelneu`, `passform`, `einraeumer`, `kartonauf`, `kasse`, `personen`, `suche`, `sparten`, `verpackung`, `packmaterial`, `versand`, `altstand` | 2–3 |
| 8 | Fassaden-Paneel/Türen/Fenster/Schilder-Reste (`buildFacade`, `lagerFensterWand`, Eingang) | 05f, 05l, 05h:1407 | Einheitlichkeit | mittel. Tests `fassade`, `eingang`, `tuer`, `ladentuer`, `schilder`, `schild`, `laeden` | 1 |
| 9 | Halle (Branch) auf Bibliothek + Baukasten umstellen, **bevor** sie ins Hauptspiel kommt (HVM→MAT, `hvSammler`→`bk.sammler`, `hvTor`→`bk.tor`, `hvSchild`→`bk.schild`) | 30-halle-*.js | verhindert neue Dubletten; Halle-Tests `halle`, `halle-start` | mittel | 1 |
| – | **Außenwelt-Dreiecke** (Park 181 k, Straße 334 k, Schnee 19 k, Stadtmöbel 18 k) – eigenes Leistungspaket, **nicht** Baukasten | 05n, 05e, 05j | Dreiecke: 75–94 % der Last | mittel: Test `park`, `stadt`, `skyline`, `schnee`, `baum` | 1 |

\*Agententage, grob, ohne Fehlerrunden (laut CLAUDE.md × 2 für geteilte Testsperre rechnen). Für jeden Schritt: Vorher/Nachher mit dem Messskript (Zeichenaufrufe je Ansicht, Meshes, Materialien, Texturen).

Reihenfolgeempfehlung: **0 → 1 → 2 (Pilot) → 3 + 4 → 5 → 6 → 7 → 8 → 9**; 9 muss spätestens vor „Halle ins Hauptspiel“ liegen. 3/4 kann ohne 2 starten, falls Tom den Leistungsgewinn früher will.

Erwartung (Schätzung, nicht gemessen): Szenengraf 2 639 → ca. 1 000 Knoten, Zeichenaufrufe im Dock-Hof-Blick um 150–300 geringer (Bündelung fängt bisher schon ein Viertel ab), Materialien 984 → < 300, Texturspeicher −150 MB (Kartons, Regalschilder, Beton, Gitter).

## 6. Vorschlag Schnittstelle

Einbindung: `src/build.sh` führt die Teile **explizit** auf (kein Glob) – neue Dateien müssen dort eingetragen werden.
- `01b-material.js`: direkt nach `reuse-helpers.js`, vor `02-data.js`. Braucht nur `THREE`, `LIN`, `std`, `tex`, `GFX`, `GFX_PROFIL`, `HIQ`. Texturen **lazy** (erst beim ersten `MAT.tex(...)`, dann existiert `renderer`/WebGL2 für `texSpar`).
- `04z-baukasten.js`: nach `04l-form-batterien7.js`, vor `05-world.js`. Braucht `rbox/roundedBoxGeo/hitM/col` (03-scene), `merge/tm` (helpers), `vcMat/glassMat` (04-models), `MAT`. Nutzt `lampMats` (05-world.js:6) nur zur Laufzeit (Aufruf nach 05-world).
- Halle (Branch): `30-halle-*` stehen zwischen `21b` und `22-start`, sehen beides.

```js
/* 01b-material.js */
const MAT = {
  get(name, opt),    // geteiltes MeshStandardMaterial (Cache nach name+Stufe). Nie verändern; Sonderfall: MAT.get('lackGelb',{tr:true}) -> eigener Cache-Eintrag
  vc(klasse),        // Vertexfarben-Material je Klasse: 'lack'|'metall'|'matt'|'gummi'|'glas'|'leucht'  (ersetzt vcMat, geraetMat, gestellMat, _rahmenM, holzMat, HVM.lack/metall/matt)
  farbe(name),       // Hex-Zahl fuer Sammler/Vertexfarben: MAT.farbe('signalGelb') = 0xf2c230
  tex(name),         // geteilte Textur 'beton'|'drahtGitter'|'warnSchraffur'|'sandwichPanel'|'lamellen'|'blechTrapez'|'wellpappe'|... Kachelung NUR ueber UV in Metern
  leucht(name),      // emissives Material, ist schon in lampMats registriert; gleiche Lampen teilen EIN Material (eine Intensitaet)
  stufe(),           // {tx:0.5|1|1.5, aniso, lambert:bool, lod:0|1|2}, beim Laden fest (aus GFX/GFX_PROFIL; Ultra Low -> Lambert wie heute)
  liste()            // Namen + Zaehler fuer Waechter-Test und Uebersichtsseite
};
/* Tabelle: name -> {hex, r, m, tex?, emissiv?}; std(hex,o) bleibt als Altweg, loggt aber (Waechter) */
```

```js
/* 04z-baukasten.js */
const bk = {
  lod(),                                  // 0|1|2 aus MAT.stufe(): Zylindersegmente 6/8/12, Fasen an/aus, Federn/Rollen an/aus
  sammler(opt),                           // Vorbild hvSammler/geraetBau: S.box(w,h,d,x,y,z,farbe,klasse,rx,ry,rz) .rund(..) .zyl(r1,r2,h,seg,..) .strebe(..) .geo(geo,m,farbe,klasse)
                                          //   S.teile() -> [{geo,m,color,klasse}] zum Weiterverwenden in fremdem merge()
                                          //   S.fertig(parent,{schatten,bauteil}) -> Mesh[] (je Klasse eins, matrixAutoUpdate=false, userData.bauteil)
  tor(o),     // {art:'sektional'|'roll'|'attrappe', breite:3.26, hoehe:3.0, panele:5|6, fenster:0|1, antrieb:'welle'|'kasten', ampel:true,
              //  vordach:false, poller:true, dichtung:'gummi'|'plane'|null, nr:'1', seite:'aussen'|'innen'|'beide', offen:0, x,z,ry, lod}
              //  -> {group, panels[], set(t01), ampel:{rot,gruen,warn}, cols[], userData.bauteil:'tor'}  (alte API door/WTORE/VD als duenne Huelle darueber)
  regal(o),   // {typ:'laden'|'rack'|'schwerlast'|'kasse'|'packmaterial'|'tisch'|'gitterbox'|'kuehl', breite, tiefe, hoehe, ebenen:[y..], seiten:1|2, farben:'wand'|{rolle:hex}, schilder:'atlas'}
              //  -> {group, ebenen:[{y,hit,schild}], farbeSetzen(rolle,hex)}   (regalFarben bleibt als Quelle der Rollenfarben)
  lampe(o),   // {art:'decke'|'raster'|'wand'|'mast'|'schwanenhals'|'fluter'|'strahler'|'halle', hoehe, rect, ax, az, zone}  -> traegt sich in LAMPEN ein
  palette(art), paletten(liste),          // 'euro'|'gitterbox': eine Geometrie, Instanzen mit Huellkugel (hvInst)
  karton(zelle),                          // Atlaszelle statt Textur je Produkt
  zaun(o),    // {art:'doppelstab'|'gitterGelb'|'gelaender'|'plexi', von:[x,z], bis:[x,z], hoehe, pfosten:2.5}
  poller(o), anfahrschutz(o),
  schild(o),  // {text, unter, stil:'hinweis'|'gefahr'|'tor'|'regal', b, h, pfosten:false, seite:'ein'|'doppel'} -> Textur aus Cache (Schluessel = Text+Stil+Groesse)
  wand(o),    // Paneel/Sockel/Blech/Beton ohne 6-Material-Array, UV in Metern
  markierung(art,..), tuer(o), fenster(o)
};
```

Regeln dazu (für Etappe 3/5): jedes Bauteil setzt `userData.bauteil` (+ `userData.bauteilArt`); Parameter statt Kopie; Kollision/Spiellogik-Haken (`col`, `hit`, `zAdd`) kommen als Rückgabe, nicht intern; **Wächter-Tests**: (a) Textprüfung: `new THREE.Mesh*Material(` und `std(0x` nur in `01b-material.js` und einer schrumpfenden Ausnahmeliste; (b) Laufzeit: Material-Objekte, Texturen, Meshes und Zeichenaufrufe je Ansicht ≤ Budget (Startwerte aus Abschnitt 0), keine Meshes mit 6-Material-Array außerhalb der Ausnahmeliste; (c) jedes Tor/Regal/Lampe/Zaun hat `userData.bauteil`. Das Messskript aus dem Scratchpad (Wrapper + `renderBufferDirect`) kann als `tools/test/messen-optik.js` übernommen werden.

## 7. Nicht geprüft (ehrlich)

- **Ware, Kunden, Personal, LKW, Feuerwerk** nicht im Bild: die echten Spiel-Szenen haben zusätzlich Hunderte Kartons/Packungen (Pools, `InstancedMesh`) und Figuren (SkinnedMesh) – die Zeichenaufrufe im Laufbetrieb liegen höher. Regale wurden einzeln nachgebaut, aber nicht mit Ware gefüllt.
- **Nur Stufe „Hoch“**, Desktop (`HIQ`=true), 640×400, Software-Renderer. Keine Messung für Ultra Low/Niedrig/Maximum/Handy; die Stufenabhängigkeit ist aus dem Code gelesen. Zeiten (ms) bewusst nicht berichtet (swiftshader, Zähl-Wrapper verfälscht).
- Zeichenaufrufe = `renderBufferDirect` des letzten Bildes nach `renderFrame`; Schattenpass getrennt gezählt, die Sonne wirft immer um den Spieler (`sonneNachfuehren`). Die Zuordnung zu Bauteilen läuft über den **innersten** gemessenen Aufbau-Aufruf; Meshes aus nicht gemessenen Funktionen stehen unter „sonstiges/direkt“. Die Bündelungs-Messung (`messen4`) ordnet nicht zu.
- Bündelung: ein Zustand (nach ~1 000 Takten simuliert, 1 071 Meshes gebündelt); Dauerzustand mit Wächter-Auflösungen (bewegte Teile) nicht untersucht.
- Nicht gelesen oder nur überflogen: `05j-stadt.js` (Stadt/Skyline), `05n-park.js`, `05k-schoner.js`, `08b-truck.js`, `09*`/`10*` (Personen/Kunden), `12-belt.js`, `15*`, `17*` (Laptop/Handy-Vorführungen), `03d-pracht.js`, `05p-licht.js` (nur Überschriften), `05o` Maler-Funktionen, `04*`-Verpackungsformen (Ware). Dort können weitere Duplikate stecken (z. B. Förderband, Hubwagen, Container).
- Farb-Cluster nur aus Hex-Literalen der Weltdateien (ΔE < 7 gegen den häufigsten Wert); abgeleitete Farben (`regalFarben`, `hexMix`, Wandpalette `WALLS`) und Farben in Texturen sind nicht erfasst.
- Branch `halle-v7`: nur Code gelesen (Funktionen, Materialien, Sammler); Zahlen zur Halle stammen aus `docs/halle/zusammenfuehrung.md`, nicht aus eigener Messung. Wie die Halle gegen die Hauptspiel-Tore (R2–R4 `westTor`/`WTORE`, Entscheidung offen) aufgelöst wird, ist ungeklärt.
- Aufwandsangaben sind Schätzungen; Tests wurden nicht gefahren (nur Zuordnung nach `src/tests/*.js` per Name und `grep` auf benutzte API: `WTORE/wtorSet/TOR_G` → logistik, wrampe; `door.*` → abfahrt, bruecke, korb, lieferung, neu2, rampe, raum; `VD.*` → durchgang, versand; `zaun/Zaun` → aussen, karte, packband, park, versand, versandtor; `kartonMat/kartonGeo` → einraeumer, game, kartonlogik; `createRack/createShelf` → game, versand; `occluders/WAENDE` → deko, game, gangwand; `lampMats/LAMPEN` → game).

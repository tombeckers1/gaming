# Materialangleichung (Fundament Etappe 2, Schritt 2) – 13.10.2026

Tom, 13.10.: „Texturen/Materialien werden sichtbar angeglichen … Farb-/Material-Cluster auf je EIN
Bibliotheksmaterial bzw. EINE Textur zusammenführen – mit Vorher/Nachher-Bildern für Toms Abnahme.“

**Grundsatz:** gleiche Sache = gleiche Farbe, gleiche Oberfläche, gleiche Textur – überall.
Unterschiede nur, wenn sie etwas bedeuten (dann eigener, benannter Eintrag mit Begründung).
Alles steht in **einer** Datei: `src/parts/01b-material.js` (`MAT.PALETTE`, `MAT.KLASSE`, `MAT.REZEPT`,
`MAT.tex`). Eine Farbe dort ändern = sie ändert sich überall im Spiel.

## 1. Was angeglichen wurde

| | vorher | nachher |
|---|---|---|
| Farbwerte in den Weltdateien (Bau, Stadt, Laden, Lager, Versand, Hof, Park) | 628 verschiedene Hex-Werte | **28 Töne** (+ Lampenlicht); 693 Stellen umgestellt |
| roughness/metalness | an jeder Stelle frei gewählt (z. B. Gelb 0,55 / 0,6 / 0,7 / 0,85) | **5 Oberflächenklassen** |
| benannte Materialien | 9 | **31 Rezepte** (je mit „wofür“) + Ton×Klasse über `MAT.ober` |
| Warnschraffur | 3 Malcodes (05d, 05g, 11e), gelb #f2c230, Streifen mal senkrecht, mal schräg | **1 Textur** `warnschraffur` (45°, RAL 1003 / Gummischwarz, Bänder 10 cm) |
| Drahtgitter | 2 Malcodes (Gitterbox 06, Ladezone 05h), 2 Maschenweiten | **1 Textur** `drahtgitter` (Masche 5 cm, Farbe über das Material) |
| Hofbeton | 7 eigene Materialien mit 4 Tönungen (#b0b4ba, #a8acb2, #aaaeb4, #a4a8ae) | **1 Material** `betonHof` |
| Canvas-Gelb (Markierungen, Warnschilder, Bodenschrift, Schilder) | `#f2c230`, `#ffd23f`, `rgba(242,194,48,…)`, `rgba(255,210,63,…)` frei gemischt | 30 Stellen `MAT.css('signalgelb')`, 32 Stellen `MAT.css('schildgold')` |

**Gelb getrennt nach Bedeutung:** Bisher gab es zwei Gelbs, beide für beides: #f2c230 und #ffd23f waren je
mal Warnfarbe, mal Hausstil-Gold. Jetzt: **Signalgelb = echtes RAL 1003 (#f9a800)** für alles, was warnt
(Anfahrschutz, Bodenmarkierung, Bodenschrift, Absperrgitter, Kran, Torantrieb, Warnschilder, Schraffur).
**Schildgold (#ffd23f)** nur für die Hausstil-Schrift auf Nachtblau (Schilder, Logo, Automat) – 32 Canvas-Stellen
über `MAT.css('schildgold')`, auch der Standard von `bk.schild`. Signalgelb wirkt dadurch satter/orangestichiger –
das ist das echte RAL 1003. Gefällt es Tom nicht: eine Zeile (`PALETTE.signalgelb`) ändern.

**Oberflächenklassen** (`MAT.KLASSE`, roughness/metalness):

| Klasse | Werte | wofür |
|---|---|---|
| `matt` | 0,9 / 0 | Gummi, Beton, Holz, Pappe, Putz, Stoff |
| `kunststoff` | 0,6 / 0 | Kunststoff, seidenmatter Lack, Gehäuse |
| `lackMetall` | 0,5 / 0,3 | pulverbeschichtetes Blech, lackierte Rahmen |
| `stahl` | 0,42 / 0,6 | verzinkter/blanker Stahl, gebürstetes Alu |
| `blank` | 0,28 / 0,85 | Chrom, poliertes Alu, Messing |

## 2. Cluster → Bibliotheks-Ton (Tabelle für die Abnahme)

Spalte „vorher“: die bisherigen Hex-Werte mit Anzahl Code-Stellen (die häufigsten 8). Farbtafel aller Werte:
`angleichung/farbtafel.jpg`.

| Cluster | vorher (Hex × Stellen) | neu: Ton, Hex (RAL) | wofür / Begründung |
|---|---|---|---|
| Tiefschwarz | 20 Werte / 24 Stellen: #111214×3, #0b0c0e×2, #121315×2, #14161b×1, #0b0c10×1, #11141b×1, #07080a×1, #16171a×1 … (20 Werte) | `tiefschwarz` **#0c0d10** (≈ RAL 9005) | Öffnungen, Schlitze, Displays aus, Schattenfugen |
| Gummischwarz | 41 Werte / 77 Stellen: #1c1f24×6, #1b1d22×5, #1c1f26×4, #22262e×4, #1a222d×3, #14161c×3, #16181d×3, #1f242e×3 … (41 Werte) | `gummischwarz` **#1c1f24** (≈ RAL 9011) | Gummi, Reifen, Kabel, Griffe, schwarze Kunststoffgehäuse |
| Anthrazit | 41 Werte / 98 Stellen: #2a2e36×11, #2a2e38×10, #2b2f36×7, #2b3040×6, #2b2f3a×6, #23262e×5, #2b303c×4, #2b2e33×3 … (41 Werte) | `anthrazit` **#2a2e38** (≈ RAL 7016) | Rahmen, Geräte, Regalständer, Tor- und Lampengehäuse (Hausfarbe Technik) |
| Graphitgrau | 22 Werte / 51 Stellen: #3a3f48×11, #3a4150×10, #3a3f47×5, #3d4450×3, #3b3f47×3, #3b4049×2, #353b47×2, #3e4652×1 … (22 Werte) | `graphit` **#3a3f48** (≈ RAL 7024) | Sockel, Maschinenteile, dunkle Bleche, Stadtsockel |
| Basaltgrau | 15 Werte / 20 Stellen: #5a6068×4, #4b515c×2, #59606b×2, #4a515c×1, #5d646e×1, #5a5f68×1, #5a5e66×1, #5d6773×1 … (15 Werte) | `basaltgrau` **#59606b** (≈ RAL 7012) | Zaunpfosten, Stahlprofile dunkel, Füsse |
| Mittelgrau | 16 Werte / 26 Stellen: #6a7078×6, #767d88×2, #6b7078×2, #6a707a×2, #6f757e×2, #6f767f×2, #7a8089×1, #6a6e76×1 … (16 Werte) | `mittelgrau` **#6a7078** (≈ RAL 7046) | Bleche, Abdeckungen, Rohre mittel |
| Silbergrau | 16 Werte / 39 Stellen: #8d939d×10, #8f959e×8, #7d838c×6, #9098a2×2, #8a8f99×2, #8a9aa8×1, #8f959c×1, #8e959c×1 … (16 Werte) | `silbergrau` **#8d939d** (≈ RAL 7001) | verzinkter Stahl: Gitter, Geländer, Pfosten, Träger |
| Hellgrau | 24 Werte / 48 Stellen: #9aa1ac×9, #9aa0a8×4, #9aa0a6×4, #9ba2ad×4, #9aa1ab×2, #a8adb3×2, #b4bac2×2, #b6bcc4×2 … (24 Werte) | `hellgrau` **#a8acb2** (≈ RAL 7038) | Beton hell, Stahl hell (Bandrollen, Achsen), Sockelschienen |
| Aluminium | 17 Werte / 41 Stellen: #c9ced6×11, #c8ccd4×5, #b8bec8×4, #b9bec6×4, #c4c8ce×3, #cfd4da×2, #c4cad3×2, #d2d5db×1 … (17 Werte) | `aluminium` **#c9ced6** (≈ RAL 9006) | Alu-Profile, Kassentheken, Leisten, Chromteile |
| Lichtgrau | 21 Werte / 33 Stellen: #d9dde3×4, #dfe3ea×3, #d6dae2×3, #dfe3e9×2, #dfe2e6×2, #d3d6da×2, #d9dde4×2, #d6d9de×2 … (21 Werte) | `lichtgrau` **#dcdfe4** (≈ RAL 7035) | Regalböden, helle Verkleidungen, Kunststoff hellgrau |
| Weiss | 20 Werte / 56 Stellen: #f2f5f8×10, #e8ecf2×7, #eef2f8×7, #eef1f5×6, #e6e8ee×5, #e9ebee×5, #e6e8ec×2, #eef4fa×2 … (20 Werte) | `weiss` **#e8ecf2** (≈ RAL 9016) | Decken, Putz, Kunststoff weiss, Schnee, Etiketten |
| Cremeweiss | 23 Werte / 30 Stellen: #f1efe9×3, #f2f2ee×3, #e9e3d4×2, #e8e4dc×2, #f2f0e8×2, #e4dfd4×1, #f2efe6×1, #f2f0ea×1 … (23 Werte) | `cremeweiss` **#f2efe6** (≈ RAL 9001) | warme Weisstöne: Fensterbänke, Putz warm, Papier |
| Steingrau | 5 Werte / 7 Stellen: #9a958c×2, #958a7a×2, #8a857c×1, #a39887×1, #8a8680×1 | `steingrau` **#9a958c** (≈ RAL 7030) | Naturstein, Pflaster, Maürwerk warm |
| Signalgelb | 4 Werte / 29 Stellen: #f2c230×18, #e7a91c×5, #e0a520×5, #f0bf12×1 | `signalgelb` **#f9a800** (RAL 1003) | Warnfarbe: Anfahrschutz, Bodenmarkierung, Absperrgitter, Kran, Torantrieb |
| Schildgold | 1 Werte / 2 Stellen: #ffd23f×2 | `schildgold` **#ffd23f** (–) | Hausstil-Schrift und -Rahmen auf Nachtblau (Schilder, Logo, Automat) - vorher zwei Golds (#ffd23f, #f2c230) |
| Signalorange | 4 Werte / 9 Stellen: #f2a01c×5, #e06a1f×2, #e07a2a×1, #f2a23a×1 | `signalorange` **#ed760e** (≈ RAL 2000) | Blink-/Warnleuchten (Gehäuse, Glas aus), Tasten |
| Signalrot | 7 Werte / 12 Stellen: #c8322a×3, #d8352a×3, #d23a2a×2, #be2418×1, #d93b2c×1, #d0161c×1, #d21d1d×1 | `signalrot` **#d8352a** (≈ RAL 3020) | Not-Halt, Ampel rot (aus), rote Bedienteile, Markierung rot |
| Feuerrot | 5 Werte / 5 Stellen: #8e1a11×1, #b8202a×1, #b01e1e×1, #b3261e×1, #c4302b×1 | `feuerrot` **#af2b1e** (RAL 3000) | Brandschutz: Hydrant, Feürlöscher; dunkle Rotteile |
| Signalblau | 5 Werte / 10 Stellen: #2a5a9e×5, #2a538c×2, #1f4a8a×1, #2f5d9e×1, #1f5fa8×1 | `signalblau` **#2a5a9e** (≈ RAL 5005) | blaü Bedienteile, Regalrahmen blau, Hinweisschilder |
| Nachtblau | 11 Werte / 16 Stellen: #1b2340×6, #141a2c×1, #1c2c52×1, #161c30×1, #2a3042×1, #1a2038×1, #2f3a5e×1, #1d2c47×1 … (11 Werte) | `nachtblau` **#1b2340** (≈ RAL 5011) | Hausfarbe Schilder/Laden (mit Schildgold) |
| Tannengruen | 5 Werte / 5 Stellen: #2c4a2e×1, #3a5a34×1, #2f4a3a×1, #3f6047×1, #2a4a33×1 | `tannengruen` **#2a4a33** (≈ RAL 6009) | Stadtmöbel grün (Litfass, Bänke), Hecken-Kästen |
| Holz Palette | 8 Werte / 16 Stellen: #c49a62×5, #c9a46a×3, #c9a978×2, #bf9a6c×2, #bf9d6c×1, #b79a6c×1, #c39c68×1, #cfa66d×1 | `holzPalette` **#c49a62** (–) | Europaletten, Kisten, helles Holz |
| Holz Palette dunkel | 4 Werte / 6 Stellen: #a9814e×2, #a58a5e×2, #b58a55×1, #9c7a52×1 | `holzPaletteDunkel` **#a9814e** (–) | Palettenklötze, gealtertes Holz |
| Holz dunkel | 12 Werte / 18 Stellen: #5a3b26×4, #3b2a1e×2, #3a2a08×2, #4a3624×2, #5e4230×1, #5a4030×1, #4a3a2c×1, #4a3a2a×1 … (12 Werte) | `holzDunkel` **#4a3624** (–) | Ladenfronten Holz, Türen, Möbel dunkel |
| Wellpappe | 4 Werte / 4 Stellen: #b9a05a×1, #d6a560×1, #c89b5c×1, #c9a25e×1 | `wellpappe` **#c89b5c** (–) | Kartons, Packband braun |
| Messing | 5 Werte / 6 Stellen: #b8913e×2, #c9a14e×1, #e8c170×1, #c9a24a×1, #d8b45a×1 | `messing` **#c9a14e** (–) | Türklinken, Schlüssel, Rahmen golden |
| Glas klar | 3 Werte / 5 Stellen: #bfe0ff×3, #d6ecff×1, #cfe8ff×1 | `glasKlar` **#d6ecff** (–) | Tönung für Glas (immer transparent) |

Bewusst **eigene** Töne trotz Nähe (Bedeutung): Schildgold ↔ Signalgelb (Hausstil vs. Warnung),
Feuerrot ↔ Signalrot (Brandschutz RAL 3000 vs. Bedienteile), Wellpappe ↔ Holz Palette (Pappe vs. Holz),
Messing (Metall, golden) ↔ Holz, Cremeweiß ↔ Weiß (warme Weißtöne: Fensterbank, Papier, Putz warm),
Steingrau ↔ Hellgrau (Naturstein warm vs. Beton/Stahl kühl), Signalorange (Blink-/Warnleuchte, Regaltraverse
RAL 2000) ↔ Signalgelb.

## 3. Bilder (Vorher | Nachher)

Je Bild links vorher (Stand 574faa7), rechts nachher, gleiche Kamera, gleicher Zufall (`shots.js`), Stufe Hoch.
Was man sieht: Gelb wird echtes RAL 1003 (satter, wärmer), Warnschraffur überall gleich (45°), Absperr- und
Gitterbox-Gitter mit gleicher Masche, Grautöne der Technik einheitlicher (Anthrazit/Graphit/Silbergrau), sonst
bewusst wenig Unterschied.

| Bild | zeigt vor allem |
|---|---|
| [Farbtafel](angleichung/farbtafel.jpg) | alle alten Farbwerte je Ton → der eine neue Ton |
| [Versandecke Tag](angleichung/tag-versandecke.jpg) · [Nacht](angleichung/nacht-versandecke.jpg) | Signalgelb (Absperrung, Kran, Torantrieb), Warnschraffur an den Torschienen, Drahtgitter |
| [Packplatz Tag](angleichung/tag-packplatz.jpg) · [Nacht](angleichung/nacht-packplatz.jpg) | Drahtgitter, Regal blau/orange (Signalblau, Signalorange RAL 2000), Packtisch Stahl |
| [Kasse Tag](angleichung/tag-kasse.jpg) · [Nacht](angleichung/nacht-kasse.jpg) | Weiß/Lichtgrau/Aluminium der Kasse, Anthrazit der Geräte |
| [Dock-Hof Tag](angleichung/tag-dockHof.jpg) · [Abend](angleichung/abend-dockHof.jpg) | Anfahrschutz und Bodenschrift Signalgelb, Warnschraffur am Tor, Hofbeton |
| [Lagerdock Tag](angleichung/tag-lagerDock.jpg) · [Abend](angleichung/abend-lagerDock.jpg) | Warnstreifen an der Wand (Signalgelb), Bodenmarkierung |
| [Lager Tag](angleichung/tag-lager.jpg) · [Abend](angleichung/abend-lager.jpg) | Regale/Stahl, Beton innen |
| [Laden Tag](angleichung/tag-laden.jpg) · [Abend](angleichung/abend-laden.jpg) · [Ladenfront](angleichung/tag-ladenFront.jpg) · [Abend](angleichung/abend-ladenFront.jpg) | Regalfarben, Kasse, Sockel |
| [Testfeld Tag](angleichung/tag-testfeld.jpg) · [Abend](angleichung/abend-testfeld.jpg) | Zündtisch/Rampen Stahl, Schilder, Warnstreifen |
| [Straße Tag](angleichung/tag-strasse.jpg) · [Abend](angleichung/abend-strasse.jpg) | Stadtmöbel, Fensterbänke/Bleche (Fassaden bewusst unverändert) |
| [Halle West Tag](angleichung/tag-halleW.jpg) · [Abend](angleichung/abend-halleW.jpg) | Tore/Stahl (Tore selbst folgen im Tor-Schritt) |

Pixelvergleich (Anteil Pixel mit Abweichung > 16 Stufen, Tag): Dock-Hof 2,5 %, Lagerdock 2,3 %, Lager 1,2 %,
Testfeld 0,8 %, Laden 0,7 %, Halle W 0,5 %, Straße 0,2 %, Ladenfront 0,1 % – sichtbar, aber gezielt.

## 4. Bewusst NICHT angeglichen

- Feuerwerk (Effekte, `14*`), Produkte und Verpackungsmotive (`04-models`, `04c`–`04l`, `17c`), Figuren
  (`09*`, auch Enten im Park), Läden-Atlas gegenüber (`05e2`), Licht und Leuchtfarben (`emissive`,
  Lichtquellen und Nebel in `03-scene`, LEDs/Ampeln im Sammler-Typ `leucht`/`lampe`, Zustandsfarben über
  `color.copy(...)`).
- Bewusste Vielfalt: Listen mit ≥ 3 Farben und `pick(...)` (Hausfassaden, Autos, Türen, Fensterblumen,
  Lieferanten-Hausfarben der LKW) – 127 Stellen.
- Tönungsweiß/-schwarz unter Texturen (`0xffffff`/`0x000000`, `color` neben `map`) – 51 Stellen.
- **Offen (99 Stellen, 86 Werte ohne passenden Ton):** meist Einzelstücke (dunkle Rottöne von Rücklichtern,
  LED-Grüntöne ohne `emissive`, warme Grau-/Brauntöne an Stadthäusern, zwei Graus zwischen Graphit und
  Basaltgrau: #4a5058, #4a4f5a). Bleiben als `MAT.std(hex)` stehen; beim jeweiligen Bauteil-Schritt
  (Tore, Lampen, Fassade) entscheiden.
- Tore und Lampen: nur Farben/Klassen angeglichen, kein Umbau (eigener nächster Schritt). Torpaneel-Texturen
  (3 Familien) und die Karton-Texturen (Atlas) bleiben für die Bauteil-Schritte.

## 5. Messung (neues Spiel, alle Zonen offen, Stufe Hoch, swiftshader)

Messwerkzeuge `tools/fundament/*` (Zählung mit `zaehl.js`/`mess.js`, Zeichenaufrufe `messen4.js`), beide Stände
im selben Lastzustand gemessen.

| Größe | vorher (574faa7) | nachher |
|---|---|---|
| Material-Objekte im Szenengraf | 563 | **430** (−24 %) |
| verschiedene Material-Signaturen | 449 | 341 |
| Dubletten (gleiche Signatur, eigenes Objekt) | 114 | **89** – Rest: Tore (`westTor`, `westTorInnen`, `buildTor` 39), Hof-/Stadtleuchten (`hofMast` 12, `baueBeacon` 8), Packmaterial-Regale (Karton-Texturen je Fach, 16), Zündtisch-Leuchten (9) – alles veränderliche Materialien, folgen in den Schritten Tore/Lampen |
| Texturen im Graf / Rohpixel | 225 / 235,4 MB | 223 / 235,3 MB (Warnschraffur 3→1, Drahtgitter 2→1; die großen Texturen sind Boden/Wand/Stadt, nicht Teil dieses Schritts) |
| Meshes | 2 653 | 2 653 |
| von der Laufzeit-Bündelung eingespart | 1 284 Meshes | 1 325 Meshes |
| Zeichenaufrufe nach Bündelung (Laden/Ladenfront/Lager/Lagerdock/Testfeld/Dock-Hof/Halle W/Straße) | 612/349/581/636/400/787/319/117 | 620/343/575/617/387/735/323/122 |
| Schattenpass je Ansicht | 370–483 | 368–484 |

Die Zeichenaufrufe schwanken zwischen zwei Läufen desselben Stands um ±10 (Messrauschen unter Last); klar
weniger sind es nur im Dock-Hof (−52) und Lagerdock (−19). Für die Leistung zählt dieser Schritt wenig – er
ist die Voraussetzung, dass die Bauteil-Schritte (Tore, Lampen, Regale) gleiche Teile wirklich zusammenlegen
können.

## 6. Tests

Auf dem Angleichungs-Build, nur Betroffenes (Rechner unter Dauerlast durch 3 weitere Agenten; mehrere Läufe
wurden vom Speicher-Wächter des Containers – OOM im gemeinsamen cgroup – abgebrochen und automatisch wiederholt):

| Test | Ergebnis |
|---|---|
| material | grün (Wächter 0 Verstöße; neu: ANGLEICHUNG – Warnschraffur/Drahtgitter/Hofbeton geteilt, Katalog mit Name/wofür) |
| aussen | grün (Sockel-Erkennung jetzt über `MAT.farbe('graphit')` statt #3b4049) |
| versandtor | 2× grün (LIEFERZEIT 1–3 jeweils genau 2,64 = Soll) |
| licht, oberflaechen, laeden, packband, sbhilfe, leistung | grün |
| stadt | ohne Fehler (Test gibt nur Werte aus; gleiche Werte wie vorher bis auf „lichterUnten“ 25 → 19, Zufall der Nachtszene) |
| kassenregal | 1. Lauf rot SPONTANKAUF (0 Spontankäufe bei 4 Kunden – Zufall), 2. Lauf grün (4 bei 6); auf 574faa7 grün |
| gameplay (am Ende, einmal) | grün |

### versandtor LIEFERZEIT2 – Ursache
LIEFERZEIT misst `Ruf vor – Ruf nach` dem zweiten Tagesabschluss ohne DDL-Anruf (Strafe 0,06 je wartendem
Paket, hier 2,64). Am simulierten Testtag finden die Kunden leere Regale und kosten je verpasstem Wunsch 0,4 Ruf
(`nextWish` in 10-customers.js, 85–162 mal) – der Ruf fällt von 60 je nach Zufall bis auf 0. Der Ruf ist auf
0…100 begrenzt: steht er schon bei 0 (oder knapp darüber), kann die Strafe nichts mehr abziehen → Test rot.
Belegt mit Ruf-Protokoll je Änderung: 574faa7 Stufe 2 Ruf 0,0 vor der Strafe (rot), Stufe 1/3 10,0/26,8 (grün);
**alter Stand 73e52ef genauso knapp**: Stufe 3 Ruf 2,8 vor der Strafe (2,64 passte gerade noch). Keine Regression
durch MAT/bk, sondern Zufall: die geteilte Betontextur würfelt weniger, dadurch verschiebt sich der Zufallsstrom
der Kunden. Fix im Test (nicht im Spiel): Ruf vor der Messung auf 60, kein Tagesereignis dazwischen, Prüfung
jetzt schärfer (Strafe ≥ Soll statt > 0). Gegenprobe: Strafe im Spiel auf 0 gesetzt → LIEFERZEIT1–3 rot
(„strafe 0, soll 2,64“), sonst nichts.

## 7. Werkzeuge (für den nächsten Schritt)

Scratchpad-Werkzeuge liegen in `tools/fundament/angleichung/`: `scan.py` (alle Hex-Literale mit Kontext),
`palette.py` (Spiegel der Palette + Zuordnungsregeln), `angleich.py` (Umstellung, `--schreiben`),
`tafel.py` (Farbtafel), `paar.py` (Vorher/Nachher-Paare), `shots.js` (Ansichten inkl. Versandecke/Packplatz/
Kasse), `angleich-13-10.json` (Protokoll: jede umgestellte Stelle alt → neu). `angleich.py` ist einmal angewandt;
ein zweiter Lauf findet die umgestellten Stellen nicht mehr (sie heißen jetzt `MAT.farbe(...)`). Zuordnung: neutral ΔE ≤ 6,5, bunt ΔE ≤ 12 und Farbton ± 22°, feste Zuordnungen nach Bedeutung
(`FEST`), Holz/Stein immer `matt`, Messing immer Metall.

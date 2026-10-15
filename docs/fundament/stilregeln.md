# Stilregeln – verbindlich für alle Agenten (Fundament Etappe 3, 14.10.2026)

Tom, 13.10.: „Das Spiel soll im Großen und Ganzen einheitlich sein – die Zusammenhänge, die Logik, der Aufbau, alles.“
„Neues entsteht automatisch im System.“ Ausgenommen sind **nur** die Feuerwerks-Effekte (Bruchbild, Ablauf, Klang)
und die Verpackungsmotive – sie sind Anomalie (CLAUDE.md, 26.09.).

Diese Datei sagt **was** gilt und **wo** es steht. Die Werte selbst stehen nur im Code (eine Quelle):
Farben/Materialien/Texturen in `src/parts/01b-material.js` (`MAT`), Bauteile in `src/parts/04z-baukasten.js` (`bk`),
Wirtschaft in `src/parts/01c-wirtschaft.js` (`WIRT`, `WF`, `WIRT_KETTEN`), Abschuss-Mechanik in `src/parts/14z4-abschuss.js`.
Jede Regel mit ☑ wird von einem Wächter geprüft (Abschnitt 11).

## 0. Die fünf Pflichtregeln (Kurzfassung)
1. **Nie daneben bauen.** Neues Objekt → Baukasten-Bauteil (`bk.*`), neues Material/neue Farbe/Textur → `MAT`. ☑
2. **Geteiltes bleibt unverändert.** Material aus `MAT.get/ober/std/basic/vc/tex` nie ändern; Veränderliches über `MAT.neu`. ☑
3. **Wirtschaftszahlen nur in `01c`.** Texte, die Beträge nennen, werden aus `WIRT` erzeugt. ☑
4. **Feuerwerk: Effekt frei, Mechanik einheitlich** – zünden/aufstellen nur über `14z4`. ☑
5. **Jeder Bericht hat die Zeile „Konsistenz:“** (Abschnitt 12), jede sichtbare Änderung Vorher/Nachher-Bild für Tom.

---

## 1. Farbe
- **Palette = `MAT.PALETTE`** (Ton → `[hex, Name, wofür, RAL-Bezug]`), benannte Töne + Lampenlicht. Hier nicht abschreiben –
  `MAT.liste().katalog.farben` bzw. die Übersichtsseite zeigen sie mit Hex und Zweck.
- **Gleiche Sache = gleicher Ton**, überall. Der Ton wird nach **Bedeutung** gewählt, nicht nach Optik:
  - **Signalgelb** (RAL 1003) nur für Warnung/Gefahr: Anfahrschutz, Bodenmarkierung, Absperrung, Kran, Torantrieb, Warnschraffur.
  - **Schildgold** nur für Hausstil-Schrift/-Rahmen auf **Nachtblau** (Schilder, Logo, Automat) – nie als Warnfarbe.
  - **Signalrot** Bedienung/Not-Halt/Ampel; **Feuerrot** (RAL 3000) nur Brandschutz. **Signalorange** Blink-/Warnleuchte.
  - **Anthrazit** = Hausfarbe Technik (Rahmen, Geräte, Tor- und Lampengehäuse); **Silbergrau** = verzinkter Stahl;
    **Graphit** Sockel/dunkle Bleche; **Lichtgrau/Weiß** Regalböden/Verkleidungen; Holz/Pappe/Messing je eigener Ton.
- **Fehlt ein Ton:** erst prüfen, ob einer passt (ΔE < 6,5 neutral, < 12 bunt = gleicher Ton, `angleichung.md` §7).
  Nur bei **eigener Bedeutung** neuer Eintrag in `PALETTE` (Name deutsch, Hex, wofür, RAL) – mit Begründung im Bericht.
- Im Code: Vertexfarben `MAT.farbe('ton')`, Canvas `MAT.css('ton'[,alpha])`, Material `MAT.ober('ton','klasse')`. ☑ (HEX/CSS)
- **Bewusst frei** (keine Palette): Feuerwerk (`14*` außer `14z4`), Verpackungen/Produktformen (`04c`–`04l`, `17c`, Sortenfarben in `02d`–`02j`).
  **Noch nicht angeglichen** (stehen in der Ausnahmeliste mit Schritt): Figuren, Läden-Atlas gegenüber, Licht-/Leuchtfarben,
  Zufallsvielfalt (Hausfassaden, Autos, Türen), Bedienoberfläche (HTML/CSS – UI-Palette ist ein eigener, noch offener Schritt).

## 2. Oberflächenklassen (`MAT.KLASSE`)
Keine freien roughness/metalness-Werte. Fünf Klassen: `matt` (Gummi, Beton, Holz, Pappe, Putz, Stoff) · `kunststoff`
(Kunststoff, seidenmatter Lack) · `lackMetall` (pulverbeschichtetes Blech, lackierte Rahmen) · `stahl` (verzinkt, gebürstet) ·
`blank` (Chrom, poliertes Alu, Messing). Holz/Stein immer `matt`, Messing immer Metall. Sammler-Bauteile nehmen dieselben
Klassen (`bk.sammler`, Klasse = gleiche Werte wie `MAT.ober`).

## 3. Materialien und Texturen
- **Nur aus `MAT`**: `MAT.ober(ton,klasse)` · benannt `MAT.get(rezept)` · veränderlich `MAT.neu(rezept)` / `MAT.eigen(ton,klasse)` ·
  Vertexfarben `MAT.vc(klasse)`. Kein `new THREE.Mesh*Material(` und kein `std(0x…)` außerhalb `01b`. ☑ (MATERIAL/STD)
- **Geteilt heißt: nie verändern** (`color`, `opacity`, `emissiveIntensity`, `map`, `visible`, `dispose` …). Ampeln, Lampen,
  Hervorhebung, Ausblenden → eigenes Material über `MAT.neu`. ☑ (WACHE)
- **Texturen**: eine Malfunktion je Textur in `MAT.TEXTUR`, geteilt über `MAT.tex(name)`, `RepeatWrapping`, repeat 1.
  **Maßstab über die UVs in Metern** (`MAT.kachel(geo, länge/kachel, höhe/kachel)`), nie `texture.repeat` an geteilten Texturen.
  Kachelgrößen: Warnschraffur 0,4 m (Bänder 10 cm, 45°), Drahtgitter 0,2 m (Masche 5 cm), Beton innen/außen nach Fläche,
  Torblatt = Atlas (Zeilen über `bk.uvZeile`). Eine eigene Textur für etwas, das es in `MAT.tex` gibt, ist ein Verstoß. ☑ (BAUTEIL)
- Neue Textur/neues Rezept: Eintrag mit `w` („wofür“) – erscheint automatisch im Katalog (`MAT.liste()`, `tools/fundament/katalog.js`).

## 4. Maßstäbe (aus dem Code gemessen, 14.10.; Quelle in Klammern)
| Was | Maß | Quelle |
|---|---|---|
| Raumhöhe Laden | 3,6 m | `05-world.js` `WH` |
| Lager/Halle lichte Höhe | 5,0 m (Großhandel 12 m, Schleuse 3,4 m) | `HALLE_H`, `GH_H`, `SCHLEUSE_H` |
| Ladeneingang Schiebetür | 2 Flügel × 1,24 m, Höhe 2,44 m | `05f-facade.js` `TUER` |
| Durchgänge (Sturz) | Laden 2,5–2,7 m, Lager 3,0–3,3 m | `05h-ausbau.js` `durchbruchWand(…, sturzY)` |
| Ladetor R1, V1 | 3,26 × 3,0 m (5 bzw. 6 Panele) | `TOR`, `V1`, `tore.md` |
| Ladetor R2–R5 | 3,4 × 3,05 m | `WTOR` |
| Tor-Attrappe Ost / Schiebetor Hof / Doppeltor Zaun | 3,6 × 4,2 · 4,2 × 2,3 · 6,22 × 2,4 m | `tore.md` §3 |
| Verkaufsregal | Breite 1,0 (klein) / 2,0 m, Tiefe 0,52 m, Fachhöhen 0,56 m Raster (0,19 · 0,75 · 1,31 · 1,87) | `02-data.js` `SHELFKIND` |
| Lagerregal | Breite 2,44 m (Schwerlast 3,30 m), Ebenen 0,14 · 0,94 · 1,74 (Hoch bis 3,66, Schwer 1,1 m Raster) | `06-fixtures.js` `RACKKIND` |
| Bodenmarkierung | Linie 0,12–0,14 m breit, Mittelstrich 0,1 × 0,5 m, Höhe über Boden 0,017 m | `05g-dock.js`, `05m-logistik.js` |
| Bodenschrift | Feld 5,2 × 1,6 m, Signalgelb auf dunklem Grund | `05g-dock.js` „ANLIEFERUNG“ |
| Tornummer (`bk.schild`) | außen 0,8 × 0,62 m, innen 0,62 × 0,48 m | `04z-baukasten.js` `bk.tor` |
| Großes Wandschild | 1,9 × 0,78 m (DDL Abholung) | `11e-palette.js` |

Regel: neue Objekte in **echten Metern** nach diesen Maßen bzw. nach realen Normen (Europalette 1,2 × 0,8 m, Tür 2,0–2,1 m,
Geländer 1,1 m). Abweichung nur mit Grund (z. B. Spielbarkeit) im Bericht. Fehlt ein Maß hier: im Bericht nennen und hier ergänzen.

## 5. Detailgrad je Grafikstufe
- Stufe steht beim Laden fest: `MAT.stufe()` → `{name, tx, aniso, lambert, lod}`; Bauteile fragen **nur** `bk.lod()`:
  **0** = Ultra Low (Kasten statt Fase `lod0Kasten`, wenig Segmente, Lambert-Austausch automatisch), **1** = Niedrig–Hoch,
  **2** = ab Maximum (mehr Segmente/Fasen). Beispiel `bk.tor`: Zylindersegmente 6/10/14.
- Texturauflösung/Anisotropie kommen aus `GFX_PROFIL` (`tx` 0,5 bei Ultra Low … 2,5 bei Ultra Extrem) – nicht selbst skalieren.
- Kleinteile unter ~6 cm ohne Fase (`faseMin`), Bauteile liefern **eine** Geometrie je Oberflächenklasse (Sammler) statt vieler Meshes.
- Ultra Low darf nie langsamer werden als vorher (Licht-Paket legt dort nichts an).

## 6. Beschriftung und Schrift
- **Hausstil** = Nachtblau-Fläche, Schildgold-Schrift: nur über `bk.schild(parent,{text,unter,b,h,…})` (Textur-Cache je Text+Größe).
  Ziffern auf Tornummern weiß. Titel in **Bungee** (`BUN(px)`), Unterzeilen in **Barlow Condensed** (`BAR(px)`), Text an die Fläche
  anpassen mit `fitFont`. ☑ (BAUTEIL schild: Funktion, die ein Schild selbst malt und baut, ohne `bk.schild`)
- **Warnung** = Signalgelb auf Gummischwarz/dunklem Feld (Bodenschrift, Warnschilder); kein Gold.
- Beträge in Texten nie als feste Zahl – aus `WIRT`/`eur(...)` erzeugen. ☑ (GELD „N €“ im Text)

## 7. Abnutzung und Schmutz
Heute **kein** allgemeines Abnutzungssystem. Es gibt: Fensterschmutz als Spielzustand (`S.grime`, `05f` `grimeMats`), Bodenflecken
(`addDirt`, Sauberkeit), Raum-Verschattung (`05b-ao`), das Rauschen der geteilten Betontextur, Schnee auf Vordächern.
Regeln: Schmutz/Abnutzung nur als **Spielzustand** (mit Wirkung, z. B. Sauberkeit → Kunden) oder als **geteilte Textur in `MAT`** –
keine Einzel-Schmutztexturen je Objekt, kein Zufallsschmutz pro Bau. Ein Abnutzungssystem für alle Bauteile wäre ein eigener Schritt
(Vorschlag an Tom, nicht nebenbei).

## 8. Licht (`src/parts/05p-licht.js`, Doku `docs/uebergabe/licht-1510.md`)
- **Belichtung fest `LI_BEL` = 1,05**, drinnen wie draussen – keine Augenanpassung, keine Innen-Abdunklung in der Bildzusammenfuehrung.
- **Innenlicht = Raumlicht im Shader** (`RAUM`): jede Flaeche in einem Raum aus `dachBereiche()` bekommt gleichmaessiges Deckenlicht
  (von oben voll, seitlich 65 %, von unten 30 %), Tag und Nacht gleich; Himmelslicht drinnen nur zu `RAUM.hemi`, Sonne drinnen nur
  durch die Schattenkarte (Fenster/Tore, ab Mittel), ohne Schattenkarte drinnen aus. Neuer Raum = neuer Eintrag in `dachBereiche()`
  (20-loop) – dann hat er Dach, Schnee-Schutz und Licht zugleich. Keine Punktlichter, die dem Spieler folgen; keine Strahler je Raum.
- **Boden** matt bis seidenmatt nur ueber `MAT.bodenGlanz(belag)` (Rauheit ≥ 0,62, Spiegelung ≤ 0,12) – keine Glanzbahnen.
- Kontaktschatten unter jedem Möbel/jeder Person – **ein** Zeichenaufruf, ab Niedrig; Ultra Low legt nichts an (Raumlicht dort im Vertexshader).
- Neues Möbel/Bauteil auf dem Boden meldet sich beim Licht-Paket an (Kontaktschatten), statt eigenen Schatten zu malen.
- Leuchten leuchten über `emissive` (Ton `lampeWarm`), veränderliche Leuchten über `MAT.neu` und `lampMats`; keine zusätzlichen
  Echtzeit-Lichtquellen ohne Messung (Leistung).

## 9. Bildsprache
Referenzen: **Zielbild** `docs/bilder/referenz/versand-max.png` (+ `versand-vergleich.png`, nachgebaute Szene `docs/bilder/referenz/szene/`),
Toms KI-Zielbild (8510991a, Versandecke), **Produktion** `docs/uebergabe/produktion-referenz.webp`.
Was daraus gilt: helle, saubere Industrie-Optik; Technik anthrazit, Stahl verzinkt, Warnung Signalgelb (Poller, Kanten, Markierung);
Ladetore anthrazit mit Fensterband; gefaste Kanten statt scharfer Kästen; Licht von oben mit weichem Kontaktschatten; Produktion als
automatisierte Straßen (Rollenbahnen, Portal-Greifer, Rohr-Raster). Keine Comic-Sättigung außerhalb von Feuerwerk und Verpackung.

## 10. Abläufe

### 10.1 Neues Objekt (z. B. Förderband, Leiter, Regaltyp)
1. **Baukasten prüfen**: `docs/fundament/baukasten.md` + `04z-baukasten.js` + Umbauliste `inventar-optik.md` §5.
2. **Vorhandenes Bauteil mit Parametern** nutzen (Größe, Art, Fenster, Nummer …) – keine Kopie mit Änderungen.
3. Sonst **`bk` ergänzen** (`bk.<name>(o)` in `04z`, nie daneben): Parameter statt Kopie, Teile über `bk.sammler`, Materialien nur aus
   `MAT`, Detailgrad über `bk.lod()`, jedes Mesh mit `userData.bauteil`, Spiellogik-Haken (Kollision, Treffer, bewegte Teile) als Rückgabe.
   Neues `bk.<name>` in `tools/fundament/waechter.js` unter `BAUTEILE` (mit Namenswörtern) oder `HELFER` eintragen – sonst Rot.
4. **Eintrag in Doku/Übersicht**: `docs/fundament/<schritt>.md` (Standard-Optik + warum, Parameter, wo verwendet, Messung) und
   Bildordner `docs/fundament/<schritt>/` (Vorher/Nachher, isoliert); Katalog (`tools/fundament/katalog.js`) zeigt es automatisch.
5. **Wächter grün**: `node tools/fundament/waechter.js` + betroffene Tests + bei sichtbaren Bauteilen `src/tests/waechter.js`.

### 10.2 Neue Wirtschaftsgröße (Preis, Lohn, Gebühr, Faktor)
1. Nur in `src/parts/01c-wirtschaft.js` (`WIRT.bereich.name`, Kommentar „wirkt auf: …“); Rechenregel in `WF`.
2. Wirkung als Kette in `WIRT_KETTEN` (was passiert, `Datei:Zeile`, **Warum**, Quelle, Lücke) – daraus entsteht `wirtschaft.md`
   (`node tools/fundament/wirtschaft-uebersicht.js`).
3. Systeme und Texte lesen nur `WIRT`/`WF`; keine Zahl neben `money/cost/preis/lohn/porto/zins/kredit…` außerhalb `01c`. ☑ (GELD)
4. `node tools/fundament/wirtschaft-snapshot.js` zeigt jede Folge. Bei **Absicht**: `--schreiben` und im Bericht begründen
   (Amortisation/Fortschritt, CLAUDE.md „Preise bestimme ich“). Ohne Absicht muss er GLEICH melden. ☑ (SNAPSHOT)
5. Fürs große Bild `tools/balance/sim.js` vorher/nachher.

### 10.3 Neues Feuerwerk
1. **Effekt frei** (Anomalie): eigener Ablauf, eigene Abschussfolge, eigener Klang, Name passt zum Effekt, Steigerung über die Level.
2. **Mechanik nur über `14z4-abschuss.js`**: Zünd-Ort liefert nur `abPlatz`, ruft `abAufstellen` + `abZuenden`; Rohre/Mörser aus
   `abRohrBau/abMoerserBau`; ausgepackt, Loch = Schuss, aus der Mündung, überall gleich (`feuerwerk-regeln.md` §5, R1–R8). ☑ (FEUERWERK)
3. `node src/tests/abschussregel.js test.html '["neue_id"]'` grün (sowie `lochschuss`, `ursprung` für das Produkt).

## 11. Wächter – laufen lassen, Rot, Ausnahmeliste

| Wächter | Aufruf | Dauer | prüft |
|---|---|---|---|
| **Node (statisch)** | `node tools/fundament/waechter.js` | ~4 s, kein Browser, keine Sperre | MATERIAL, STD, HEX, CSS, GELD, FEUERWERK (R7), BAUTEIL (Baukasten-Duplikate, gelöschte Duplikate, unbekanntes `bk.*`), SNAPSHOT |
| Gegenprobe Node | `node tools/fundament/waechter.js --gegenprobe` | ~10 s | baut 13 Verstöße im Speicher ein, alle müssen anschlagen |
| **Laufzeit (Browser)** | `flock /tmp/bb-testlock nice -n 10 timeout 1200 node -r ./ladezeit-preload.js src/tests/waechter.js $PWD/real.html` | ≤ 10 Min | TORE, BAUTEILE, SECHS (6-Material-Arrays), BUDGET je Ansicht, WACHE |
| Gegenprobe Laufzeit | `GEGENPROBE=1` davor | +1–2 Min | 5 Verstöße im laufenden Spiel |
| Feuerwerk vollständig | `src/tests/abschussregel.js` | lang | R1–R8 je Produkt und Ort |

- **Wann:** Node-Wächter nach **jeder** Änderung (kostet nichts); Laufzeit-Wächter einmal vor dem Commit, wenn Bauteile/Welt/Materialien
  geändert wurden; beide beim Merge.
- **Bei Rot:** die Meldung nennt `Datei:Zeile`. Richtig ist fast immer: Baukasten/MAT/WIRT/14z4 nutzen (Abschnitt 10), nicht die Liste
  erweitern. `node tools/fundament/waechter.js --liste <datei> [art]` zeigt alle Fundstellen.
- **Ausnahmeliste** `tools/fundament/waechter-ausnahmen.json`: je Eintrag Datei, Art, erlaubte Anzahl und Werte, `grund` (warum es heute
  noch so ist), `schritt` (welcher Schritt es auflöst), `anlass`, `seit`. Sie **darf nur schrumpfen**:
  - Weniger Verstöße als erlaubt → Rot „Liste schrumpfen“ → `node tools/fundament/waechter.js --ausgangsliste` (ohne Begründung erlaubt).
  - Neue/größere Einträge nur mit `--ausgangsliste --grund "warum"` (sonst abgelehnt) und Nennung im Bericht.
  - Laufzeit-Ausgangswerte: `BUDGET_SCHREIBEN=1 GRUND="warum" node src/tests/waechter.js real.html` (z. B. nach einem Merge, der
    Bauteile zusammenlegt oder Wände ersetzt). Toleranz 5 % + 15.
- **Beim Merge paralleler Bauteil-Schritte** (Wände, Kartons …): nach dem Merge `waechter.js` laufen lassen; was geschrumpft ist mit
  `--ausgangsliste` festschreiben; neue Einträge nur mit `--grund "Merge <Schritt>: …"`; Laufzeit einmal mit `BUDGET_SCHREIBEN`.
- **Grenzen (ehrlich):** Der Node-Wächter zählt je Datei und Art (plus erlaubte Werte); ein neuer Verstoß, der gleichzeitig einen alten
  gleichen Werts ersetzt, fällt nicht auf. GELD erkennt Zahlen neben Geldnamen und „N €“-Texte, keine Formeln ohne Geldnamen.
  BAUTEIL erkennt Funktionen über ihren Namen (z. B. `rolltorBauen`), nicht anonym gebaute Kopien – dafür zählt der Laufzeit-Wächter
  Torblatt-Material außerhalb von Tor-Bauteilen und das Budget.

## 12. Berichtsformat für Agenten
Kurz (CLAUDE.md „Tonfall“). Pflichtteile:
```
Was: <1–3 Zeilen, was gebaut/geändert ist>
Belege: <Tests/Wächter mit Ergebnis, Messung vorher/nachher, Bilder (Pfad/Artefakt)>
Konsistenz: genutzte Bausteine <bk.tor, MAT.ober('anthrazit','lackMetall'), WIRT.versand.porto …> / was ändert sich dadurch wo
            <z. B. „alle 10 Ladetore graphit statt hellgrau; DDL-Pauschale wirkt auf Tagesabschluss, Handbuch, Laptop“>
            / Ausnahmeliste <-n Einträge geschrumpft | +n mit Grund …>
Offen/für Tom: <Entscheidungen, Abnahme sichtbarer Änderungen>
Artefakt: <Link>
```
Sichtbare Änderungen ohne Vorher/Nachher-Bild und ohne „Konsistenz“-Zeile gelten als nicht fertig.

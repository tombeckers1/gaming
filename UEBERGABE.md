# Übergabe Böllerladen Simulator – vollständiger Kontext für den neuen Chat
Stand: 08.10.2026, ca. 22:30 Uhr (dt. Zeit). Verfasst am Ende des langen Chats vom 07./08.10.

> **Für den neuen Chat:** Diese Datei komplett lesen. Danach `CLAUDE.md` (Repo-Wurzel, Regeln)
> und bei Bedarf `docs/uebergabe/*`. Nichts davon ist optional. Tom erwartet, dass du ab
> der ersten Antwort alles weißt, was hier steht, und nicht nachfragst, was schon geklärt ist.

---

## 1. Wer, was, wo

- **Tom** (tom@tom-beckers.com) baut mit Claude einen 3D-Browser-Simulator „Böllerladen Simulator“ (Arbeitstitel; Logo „Feuerwerksladen Simulator“).
  - Ziel: Steam-Release, erst USA zum 4. Juli 2027.
  - Tom programmiert nicht selbst. Er testet die Artefakte und gibt Befunde (oft per Sprachnachricht, Bild oder PDF).
- **Repo:** `tombeckers1/gaming`.
  - Branch `claude/artifact-review-task-d47i09`: immer darauf entwickeln, committen und pushen, KEINE PRs ohne Auftrag.
  - Letzter Stand: `47c5499` (Spiel) plus Übergabe-Commit.
- **Spiel = eine HTML-Datei** `boellerbude.html` (~8,9 MB, three.js r128 per CDN).
  - Gebaut aus `src/parts/*.js` über `src/build.sh` (Funktion `build`, feste Reihenfolge der Teile).
  - `desktop/` ist ein Electron-Wrapper für spätere Steam-Builds.
- **Spiel-Artefakt** (nach JEDER Änderung neu veröffentlichen, Link IMMER mitschicken):
  https://claude.ai/artifact/7zw7iHrZYiYSGzw1QHNwVJ, aktuell **Version 119**.
- **Ausbauplan v7:** https://claude.ai/artifact/TDsAd4EeAgzsdvS6k6gf5T.
  - Quelle: `docs/uebergabe/ausbauplan-v7.html`. Generator lag im Scratchpad und ist weg; Änderungen direkt im HTML/SVG machen.
  - Ältere Skizzen: https://claude.ai/artifact/EYzJdvGRsKF3Ck6tW9mTsy.
- **Tests:** 164 Playwright-Skripte in `src/tests/*.js`. Werkzeuge in `tools/test/` (siehe Abschnitt 9).

## 2. Spielaufbau (damit du dich im Code zurechtfindest)

**Kapitel** (`src/parts/02-data.js`, `KAPITEL`, `DEMO=false`):

| Nr | Kapitel | Stand |
|---|---|---|
| 1 | Pyro-Kiosk, Lieferung vor die Tür | gebaut |
| 2 | Kleines Fachgeschäft (Lager mit Rampe) | gebaut |
| 3 | Großes Fachgeschäft | gebaut |
| 4 | Pyro-Versand (Onlineshop und Packstation) | gebaut |
| 5 | Eigene Marke (Labor/Rezeptur) | gebaut |
| 6 | Pyro-Kaufhaus (Süd-Fläche, 2. Eingang) | gebaut |
| 7 | Pyro-Logistik (Halle West in 3 Stufen: 6,5 / 8,5 / 11 m hoch) | gebaut |
| 8 | Pyro-Fabrik | geplant, siehe Ausbauplan, Produktion |
| 9 | Großhändler | geplant |
| 10 | Kette | geplant |
| 11 | Imperium, Stadtfeuerwerk | geplant |

ROADMAP.md: Die Demo-Idee mit Kapitel 1–6 ist inzwischen durch den Release-Plan (Abschnitt 7) überholt.

**Wichtige Module:**
- **Welt und Ausbau:**
  - `05-world.js` (Maße `LAY`, Deckenhöhen `WH=3.6`, `HALLE_H=5`).
  - `05h-ausbau.js` (Flächen kaufen, Wände/Durchbrüche, Packstation-Stufen).
  - `05m-logistik.js` (Halle West).
- **Personal:**
  - `11-staff.js` (Personal).
  - `11b-einraeumer.js`.
  - `11c-versand.js` (Packer, Rollwagen-Touren, `vsPlan`/`vsStopsBauen`, `VS_OPT`).
  - `11d-packmaterial.js`.
  - `11e-palette.js` (Paletten, Hubwagen, DDL-LKW 22 Uhr, Rolltor V1).
- **Menschen:** `09-people.js`, `09a-figuren.js` (Rocketbox, Skinned Mesh, Arm-IK).
- **Karton:** `15c-karton.js` (Spieler öffnet Karton, räumt Stück für Stück ein).
- **Feuerwerk:**
  - Partikelsystem `14-fireworks.js`, Shows `14b`.
  - Drehbücher `14g`–`14l`, Erweiterungen `14m`–`14y`.
  - Daten `02e/02f/02g`, Verpackungen `04*`.
  - Löschliste: `ENTFERNT` in `02e-neuware.js`.
  - `P[id].aenderung` setzt die Liste „Vorführung (Änderungen)“.
- **Laptop/Handy:**
  - `17-laptop.js`.
  - Vorführungen: `17b-fwtest.js` (Feuerwerk), `17c-verpackung.js` (Verpackungsraum), `17e-gameplay.js` (fast durchgespielter Laden).
- **Grafik:**
  - `03-scene.js`, `03b-post.js`, `03d-pracht.js`.
  - Stufen: Ultra Low, Niedrig, Mittel, Hoch, Maximum, Ultra, Ultra Extrem; Automatik nach Bildrate.
- **Speichern:** `18-save.js`. Alte Spielstände müssen immer weiter laden; Migrationen testen.

**Koordinaten (Weltmeter):**
- Laden x −7,9…37,9 / z −21,9…5,9.
- Backstock („lbasis“) x −19,9…−8,1 / z −5,9…1,9.
- Lager Süd 1–3 bis z −29,9.
- Halle West x −66…−26 / z −34…−7.
- Schleuse x −26…−19,9 / z −24…−17.
- Testfeld x −7,9…8 / z −28…−6.
- Rampen (WRAMPEN) bei x −31 / −38,5 / −47,5 / −57,5, z −34.
- Haupttür bei x≈0.

## 3. Was in Version 118 und 119 neu ist (heute fertig)

- **Feuerwerk (V118):**
  - Korrekturrunde nach Toms Befunden (`docs/uebergabe/befunde.md`).
  - Gelöscht: Vollmond, Lagune, Gletscher, Kaleidoskop, Sterntor, Legion, Finale Grande, Kugel 300 Kronenregen.
  - Bodenfontänen aus Batterien raus; 8 Abschussstimmen, damit jeder Abschuss hörbar ist.
  - 10 neue Themen-Batterien: Kornblumen L2, Bienenweide L6, Weinlese L7, Mohnfeld L12, Winterwald L13, Fuchsien L16, Korallenriff L18. Königsklasse: Schwarzer Samt L23, Meteorschauer L24, Phönix L25.
  - 10 neue Kugelbomben: Silberdistel, Hummelschwarm, Blauregen, Smaragdring, Abendrot, Kometenschlag, Seerose, Granatapfel, Riesenpalme, Himmelstreppe.
  - Insgesamt **132 Produkte**. Laptop: „Vorführung (Änderungen)“ und „Kugelbomben-Vorführung“.
  - Verpackungen in echter Bauform; Kleinfeuerwerk wird ausgepackt auf dem Zündtisch gezeigt.
- **Menschen:** realistische Rocketbox-Figuren (gehen, stehen, greifen, Tüte, LKW-Fahrer). Kassen standardmäßig weiß.
- **Karton:** Spieler öffnet den Karton, Inhalt sichtbar, räumt Stück für Stück ein (Supermarket-Simulator-Stil).
- **Gameplay (V119)** nach `docs/uebergabe/gameplay.md`:
  - Eiswürfel raus.
  - **Versandecke** am hinteren Ende von Lager Süd 3 an **Rolltor V1** mit eigenem Versandhof. Roboter-Kran nur verlegt und gedreht; gelbe Gitterbox offen zum Tor.
  - **DDL-LKW um 22 Uhr** setzt rückwärts an. Mitarbeiter (Stufe 1) bzw. Hubwagen-Roboter (ab Stufe 2) lädt die Paletten. Ab 18 Uhr kann der Spieler selbst laden. Paletten bis 1,75 m hoch.
  - Durchgang an R1 frei.
  - Echtes Licht in den Ladenerweiterungen (Abendbild etwa 3× heller).
  - Grafikstufe **Ultra Low** (etwa 70 % weniger Dreiecke).
  - Bäume in Niedrig/Ultra Low gröber.
  - **1.4G-Raute nur auf Feuerwerkskartons** (F1/F2), 228 Lieferkarton-Varianten.
  - **Picker-Touren gebündelt:** älteste Bestellung als Anker, wegnahe Bestellungen dazu, 2-opt, gleiche Ware an einem Stopp. Weg im Lager −21 %, gesamt −10 %. Test `tourplan.js`.
  - Packstation braucht jetzt Süd 3 (Level 25/27/29). Alte Spielstände werden umgesetzt bzw. erstattet.

## 4. Bekannte Schwächen und Testlage (ehrlich)

- **Regression:**
  - Alle relevanten Tests waren grün, teils erst bei der Wiederholung (`leistung` ERSTES 1641 ms; `gameplay` PACKMATERIAL). Das sind vermutlich Lastflakes.
  - Auf dem Endstand `47c5499` liefen nur stufen, versandtor, lager, hoehen, neuware und verpackung noch einmal.
  - `anomalie` und `verpackung` wurden nach dem Gameplay-Merge nicht erneut gefahren. Beim nächsten Merge mitnehmen.
- **Testanpassungen am 08.10. (bewusst, geprüft):**
  - `stufen`: 9/11 Regalplätze, weil das Kassenregal mitzählt.
  - `versandtor`: Restpakete nur erlaubt, wenn der LKW voll ist (6 Plätze).
  - `lager`: Süd III nur noch bis z −20,7 geprüft, dahinter steht die Versandecke.
- `themen` mit R4=1 ist knapp (Zufall: weinlese 24,8 vs. bienenweide 25,4, Toleranz 0,5).
- Der Verpackungsraum (`17c`) bricht bei jeder Änderung der Produktzahl (feste Möbelliste, leere Fächer). Sollte aus der Produktzahl berechnet werden.
- **Feuerwerk:**
  - Kleine Kugeln (75–150 mm) dünner als der Himmelsbrecher.
  - Phönix bei der Last am Limit (~20 000 Funken, 44 ms/Schritt).
  - Riesenpalme liest sich aus 90 m wie ein Ring.
  - Meteorschauer mit leichtem Lichthof.
  - Kornblumen und Bienenweide in der Vorführung klein.
- **Packer:** laufen bis zu 48 s am Stück, weil die Station hinten in Süd 3 steht. Wird mit Plan v7 besser (Kartonlager als ein Raum, kürzere Wege).
- **Leistung:**
  - Tom hat einen alten PC (i7-4790), auf „Niedrig“ vorher 10–11 FPS.
  - Echte GPU-FPS mit Ultra Low sind ungemessen. Tom soll auf seinem PC testen.
  - Unklar: Warum zeichnet Niedrig etwa 2,4× mehr Dreiecke als im Sichtkegel liegen? Ein Baum hat ~17 000 Dreiecke.

## 5. OFFENE AUFGABEN (Reihenfolge = Vorschlag; Tom entscheidet, wann gestartet wird)

### 5.0 Neu von Tom am 08.10. (abends) – ERLEDIGT 08.10. (V120)
- Umgesetzt: Stufe 1 ohne Portal/Geländer; Packer (Zustand `stapeln`, `vsStapeln`) bzw. Spieler (Trefferfläche `bandende`, `vsSpielerAblegen`) legen das Paket am Bandende selbst auf die Palette. Kran ab Stufe 2. Tests packband (neu: KRAN1–3, SPIELER1), packer, versandtor grün; Gegenprobe schlägt an. Nicht in der Gameplay-Vorführung (die zeigt Stufe 3).
- **Versandecke Stufe 1 OHNE Roboter-Kran.** Auf Stufe 1 legt der Spieler (bzw. der Packer) das fertige Paket **selbst auf die Palette** in der gelben Box. Der Kran kommt erst mit dem Ausbau (Stufe 2/3).
  - Code: `05h-ausbau.js` (Packstation-Stufen), `11c-versand.js`, `11e-palette.js`.
  - Tests: `versandtor.js`, `packband.js`, `packer.js`.
  - In der Gameplay-Vorführung sichtbar machen.

### 5.0b NEUE RICHTUNG (Tom, 08.10. nachts)
- Ausbauplan v7 (5.4) wird in die Zukunft verschoben. Zuerst den aktuellen Stand auf sehr hohes Niveau: Texturen, Gameplay-Performance, Gameplay, Flow, Wirtschaft. Schritt für Schritt, Tom bespricht jeden Schritt.
- Über Nacht 08./09.10.: Läden gegenüber, Innenräume hinter den Schaufenstern realistisch (gameplay.md 14, `05e-street.js` `ladenInnen`).
  - ERLEDIGT 08./09.10.: `ladenInnen` jetzt in `05e2-laeden-innen.js` mit einem gemalten Textur-Atlas (2048², Niedrig/Handy 1024²) für alle 14 Ladenarten (Sichtwahl, Brotregal, Fleischtheke, Brillenwand, Bücher, Waschmaschinen …), weiter 1 Material/1 Mesh je Laden; Dreiecke der 6 Innenräume 23 776 → 8 452, Zeichenaufrufe gleich (12 Meshes). Eigener Zufall + `_altZufall` hält die Straße wie vorher (Test `laeden` STRASSE/TEXTUR). Bilder: `docs/bilder/laeden-innen/`.

### 5.0c Versandecke, DDL auf Anruf, Onlineshop-Wirtschaft (Tom 09.10., `docs/uebergabe/versand-sb-0910.md`) – ERLEDIGT 09.10.
- **Ecke:** Station 1 m Richtung Lager (`PACK_HOME` z −26,3), fest eingebaut (`packMov.fest`). Vor Rolltor V1 eine **Ladezone** mit gelber Gitterabsperrung links/rechts (`LADEZONE`, `LZ_ZAUN`, 05h) – nur der DDL-Fahrer kommt hinein. **Versandbereich** (`PACK_FL`, gelb schraffiert wo die Box noch wächst) ist für Regale/Möbel gesperrt; alte Stände räumen ihn beim Laden (`versandBereichRaeumen`).
- **Stufen:** 1/2/3 Paletten + 1/2/3 Packplätze, **Kran ab Stufe 1** (Hand-Ablage V120 ist raus). Box wächst je Stufe (`ZELLE`, `PORTAL_Z0`). Alte 2/4/6-Paletten-Stände werden auf 1/2/3 umgestellt.
- **DDL nur auf Anruf** (Wandtelefon links neben V1, `ddlRufen`, Pauschale `DDL_PAUSCHALE` 39 €), LKW nach ~20 s, Fahrer lädt selbst, Box so lange belegt (`boxBelegt`). Box voll → Band staut, Meldung, Handy-Badge „!“. Keine 22-Uhr-/Zwischenabholung mehr; Pakete seit gestern kosten Ruf. Porto S 2,00 / M 3,50 / L 5,00 €.
- **Onlineshop:** Versandkosten 0–20 €, Schwelle (0 = immer frei / nie), Sale auf alles, Sale je Produkt, heute versandfrei; Nachfrage nach Baymard/UPS/Lewis 2006/Bijmolt 2005 (Kopf von 11c); Statistik je Tag + Verlauf (`onlineStatHtml`, `S.onlineLog`). Marktplatz-Pauschale bleibt mit Packstation ganz (16-day). Stufe 2/3 kosten jetzt 5.900/6.900 €.
- **Geräte:** Lagerterminal der Logistikhalle weg; **Lager-PC** in der Versandecke (Bestellen, Onlineshop, Team), **Tablet** im Laden neben der Hintertür (Bestellen), Büro-Laptop wie bisher (`GERAETE` in 17-laptop).
- **Optik:** Rolltor mit Lamellen/Fensterband/Schienen/Wickelkasten/Antrieb/Warnmarkierung, Schild „DDL Abholung“, Schwanenhalslampe und Ampel links, Packmaterial (Wellpappe, Lathe-Klebebandrollen instanziert, Folienrolle mit Stirnseite), Handabroller am Tisch, Laptop-Bilder Versandmaterial. Bilder: `docs/bilder/versand-0910/`.
- **Tests:** versandtor (neu: TORSPERRE + Gegenprobe, NUR_AUF_ANRUF/ANRUF, ABRECHNUNG, BOX_VOLL, ALT_*), versand (FEST + Gegenprobe, VERSANDBEREICH, ALTSTAND_REGAL), online (NACHFRAGE + Gegenprobe), packband (Kran ab Stufe 1), packmaterial (neue Schwellen), gameplay (DDL_ANRUF).
- **Offen/ehrlich:** Ein Packer schafft gemessen nur ~12 Pakete je Verkaufstag (Wege im Lager) – das begrenzt das Onlinegeschäft mehr als Box oder DDL.

### 5.1 Tests beschleunigen (Vorschlag, etwa ½ Tag)
- Jeder Test lädt das Spiel ~50 s im Software-Renderer. Idee: einmal laden und den Spielstand per Hook zurücksetzen, oder mehrere Tests in einer Seite.
- Spart geschätzt 30–40 % Testzeit für alles Weitere. Erst Tom fragen, ob er das will.

### 5.2 Modell-Arbeiten (Opus-Qualität), Punkte aus `docs/uebergabe/gameplay.md`
- 6: Packmaterial (Kartons, Paketband, Luftpolster, Papierkartons) besser modellieren, **Füllstand sichtbar**.
- 9: Automat „Deine Rakete“ neu und realistisch, Aufschrift „Rakete personalisieren“.
- 11: Regalschilder oben standardmäßig **grau**, hochwertig.
- 12: Lagerregale: Farbe bleibt, mehr Textur und Detail.
- 14: Läden gegenüber: Innenräume detailliert (z. B. Apotheke), Beleuchtung und Wände bleiben.
- 15: LKWs „Premium Pyrotechnik Großhandel“ und „Import“ mit mehr Textur; **1.4G-Raute korrekt nach ADR** (UN 0336, Klasse 1.4G).
- 17: Eigene Außenfassade: Design und Farben bleiben, deutlich mehr Detail; Ladenschild **ohne Schattenschrift**.
- 8 (großer Raum mit vier weiteren Stationen): Tom meldet sich, liegt auf Eis.

### 5.3 Feuerwerk
- **Kugelbomben-Runde 6 (Toms Bewertung von V122, `docs/uebergabe/kugelbomben-0910b.md`) – ERLEDIGT 09.10. nachmittags:**
  - Code: Daten/Preise/Lizenzen `02i-kugeln6.js`, Knall/Effekte/Groesse `14z2-kugeln6.js`, Verpackung `04k-form-kugeln6.js` (build.sh ergaenzt).
  - KNALL neu (`k6Knall`): Druckstoss (gerechnete Friedlander-Welle mit Bodenreflexion, Periode 6-34 ms je Kaliber), kurzer Knack 1,5-3 kHz statt Hochpass-Zischen, Sinus-Tiefton mit Fall durch tanh-Saettiger (Obertoene fuer Laptops), gesaettigter Koerper, Mitten-Krachen, Donnerrollen (Wellen), Faltungshall (Strasse/Tal/Donner, prozedural), alles ueber Hochpass 42 Hz -> Kompressor -> Begrenzer (-1 dB). Urknall-Monster-Schlag bleibt alt (Toms Vorbild; er uebersteuert selbst, Spitze ~1,46!). Pegel je Kugel geeicht auf A-gewichtete Laptop-Lautheit (`__kg6.messen`, OfflineAudioContext). Gegenprobe: `kugelknall.js '{"alt5":true}'` = Knall der Runde 5.
  - Groesse (Durchmesser 90 %, m) vorher -> nachher: 75 mm 79-86 -> 108-115, 100 mm 84-88 -> 116-122, Profi 150 109-120 -> 149-165 (Tigerkrone 165, Farbcrossette 164), Profi 200 112-120 -> 151-175 (Blitzpalme 175), Koenigsklasse 118-128 -> 167-188 (Sternensturm 188), Urknall 181 -> 207, neue 200-266. `K6_RAUM` in 14z2.
  - RAUS: Aurora, Granatapfel, Sonnensturm, Drachennest (ENTFERNT + Ersatz alter Spielstaende). Silberdistel neu (Distelkopf, Silberstrahlen, schwebende Flaumbueschel), Fackelhimmel mit Flammenzungen (Leib aus aufsteigenden, abkuehlenden Teilchen, Glutschein, Funken).
  - NEU (300 mm, zwei Lizenzen Grossfeuerwerk L27 42 000 EUR / Pyro-Weltklasse L29 52 000 EUR): Herbststurm L27 89,99, Eiszeit L27 94,99, Titanenfaust L28 104,99, Lavastrom L28 109,99, Galaxie L29 119,99, Sturmflut L29 129,99, Goetterdaemmerung L30 139,99, Himmelssturz L30 169,99 (lautester Schlag im Spiel). Je eigener Monster-Knall mit Stufenschlaegen (`K6_MONSTER`), Dichte x1,8.
  - Kontaktboegen: `docs/bilder/kugeln-0910b/`. Alle Kugeln `aenderung:true`.
  - Tests 09.10. gruen: kugelknall (+Gegenprobe alt5: BOOM 32/32, ZISCH 26/32 schlagen an), anomalie, neuware, sortiment, steigerung, ursprung, rkecht, befunde, hoehen, abschussklang, boeller (Test laesst Lizenz-/Level-Klang erst ausklingen), vorfuehrung, verpackung (Tab heisst seit der Versandecke `shop` - Test war seit 05776a5 kaputt), leistung (Partikel max 18 985).
  - Schwaechen: Klang nur gemessen, nicht gehoert; Lautheit streut je Knall um +-15 %; der Urknall-Monster-Schlag uebersteuert weiter selbst (Spitze ~1,3-1,5, unveraendert als Vorbild); eine 150er Kugel hat jetzt mehr Schallenergie als der Monsterboeller (nur die Spitze ist kleiner). Bilder auf Swiftshader, Blick auf die Bruchmitte.
- **Kugelbomben-Runde 5 (Toms Bewertung 09.10., `docs/uebergabe/kugelbomben-0910.md`) – ERLEDIGT 09.10.:**
  - Code: Daten/Preise `02h-kugeln5.js`, Effekte/Knall/Groesse `14z-kugeln5.js`, Verpackung `04j-form-kugeln5.js`; Streichen ueber `ENTFERNT` (jetzt Funktion `sortimentStreichen()` in 02e, zweiter Aufruf in 02h).
  - 13 Kugeln raus (alte Spielstaende: Ersatz per `ENTFERNT_ERSATZ`), 10 neu: Profi Fackelhimmel 150 (L17), Wetterleuchten 150 (L18), Schatztruhe 200 (L19), Bluetenhagel 200 (L20), Aurora 200 (L21); Koenigsklasse Sonnensturm 300 (L22), Drachennest 300 (L23), Ringnebel 300 (L24), Kometensturm 300 (L25), Urknall 300 (L26, ersetzt Himmelstreppe: Boom, dann Monster-Schlag nach 1,3 s). Jetzt 28 Kugeln.
  - Knall: Ursache gemessen - Bruch auf 86-90 m kam mit distVol ~0,19 an, Klang war Puff/Plopp/Wumms/Herzton (gewichtet 0,02-0,08, Abschuss ~0,9). Neu: je Kugel eigener Bruchknall (`KNALL5`, 9 Klangarten) + Zerlegerblitz 0,06 s. Test `kugelknall.js` (Gegenprobe `'{"aus":true}'`).
  - Groesse (Durchmesser 90 % der Sterne, schwankt je Lauf um +-4 %): Profi 110-120 m (vorher 88-125), Koenigsklasse 116-130 m (Himmelsbrecher 116-121, vorher 100-121), Urknall ~182 m. `K5_RAUM` in 14z. Knall-Pegel bleibt unter dem Monsterboeller (boeller.js).
  - Tests 09.10. gruen: kugelknall (+Gegenprobe: 26/28 KNALL, 28/28 BLITZ schlagen an), anomalie, neuware, sortiment, steigerung, ursprung, hoehen, abschussklang, vorfuehrung, verpackung (17c: ein Hochregal weniger), leistung, befunde, boeller, moerser, perlen, pyro, rkecht.
  - Optik: Sterne des Hauptbruchs brennen gleichmaessig statt linear zu verblassen (`k5Halten`), Brokat-Gold (`k5Brokat`), Tigerkrone neu (Kronen an den Spitzen), Kanonade mit Brokatkrone, Knister aus 90 m sichtbar (psBig).
  - Preise: VK nach Level (`KUGEL_VK`, L14 9,99 ... L24 54,99, Urknall 79,99; vorher 300 mm 165-175 EUR), Marge 1:2,33 unveraendert, Nachfrage +1/+2. Gewinn je Kundenwunsch (alle Waren, rechnerisch): L18 -7 %, L24 -13 % - Kugeln brachten vorher ein Drittel des Feuerwerksgewinns.
  - Kontaktboegen: `docs/bilder/kugeln-0910/`. Alle Kugeln haben `aenderung:true` (Vorfuehrung Aenderungen).
- **Batterie-Formen nach Toms Referenzbildern** (`docs/uebergabe/batterie-referenz-3…7.png`: Hamburg/Caipirinha, Big Final, Magnum, Exotic Place).
  - Erledigt in `14w-batterieformen.js` (seit V118): 16 Batterien mit eigener Bauform, Zonen, Kaliber, Druck rundum, ein Loch = ein Schuss.
  - Offen ist nur Toms Urteil, ob noch welche „0815“ aussehen. Dann gezielt nacharbeiten.
- **Raketen-Runde:** Tom „später“; Raketen wurden in der Korrekturrunde bewusst ausgelassen.
- Kleine Kugeln kräftiger; Phönix-Last senken; Riesenpalme weniger Ring.
- Verpackungsraum robust machen (siehe Abschnitt 4).
- Regeln aus Toms Bewertungen:
  - Realismus vor Effekthascherei.
  - Keine Bodenfontänen in Batterien.
  - Jeder Abschuss hörbar (Hexenkessel als Klangreferenz).
  - Königsklasse nur für wirklich große Produkte.
  - Löcher = Schusszahl.
  - Raketen und Kugeln im Rohr sichtbar.
  - Rohre in der Vorführung wie im Spiel.
  - Toms Referenzbild „10 Batterien“ (`docs/uebergabe/referenz-10-batterien.png`) nur als lose Inspiration, NICHT kopieren.

### 5.4 Großer Bau nach Ausbauplan v7 – NUR auf Toms ausdrückliches Startsignal
- **Schätzung im neuen Chat:** realistisch 7 Arbeitstage, spätestens 10. Mit beschleunigten Tests etwa 5.
- Phasen strikt nacheinander, Tom vorher warnen, wenn sich Agenten im Weg stehen würden.

1. **Ladebildschirm** (≈1 Tag)
   - Die große Halle (auch über den Zugang durchs Kartonlager) wird erst beim Betreten gebaut/geladen, mit Ladebildschirm wie in anderen Spielen.
   - Vorher ist sie grafisch nicht vorhanden bzw. leistungsneutral.
   - Vorher/nachher messen: Heute gibt es schon Frustum-Culling, der Gewinn liegt vor allem beim Blick in Richtung Halle und beim Speicher.
2. **Lager-Umbau** (≈1,5 Tage)
   - **Ein Lager, drei Bereiche, je einzeln freischaltbar:** ① Backstock (Laden-Zone), ② Lager Süd und Versandecke V1, ③ Kartonlager (nimmt der Halle die Nordostecke x −36…−26 / z −17…−7).
   - **Gelbe Wand** zur Halle mit **Tor N1** (~3 m, für den Karton-Nachschub; der Hubwagen passt durch).
   - **Am Ende ein Raum ohne Trennwände** (①–③, auch keine Wand zwischen Kartonlager ② und Packstation). Keine L-/V-Wand.
   - **Schleuse** Halle ↔ Versandecke vertikal auf ~13 m vergrößert (Packmaterial-Weg).
   - In der Halle: **Wareneingang**-Stellplätze an R2–R4; **13 Schnellplätze** am Boden an der Hallenwand unter „Reserve“ für Paletten, die nur kurz stehen; **Packmaterial**-Fläche (Paletten mit Kartons, Folie, Band; der Lagerist bringt sie durch die Schleuse).
3. **Hochregal** (≈2 Tage)
   - 10 m hoch (braucht Hallenstufe 3 = 11 m), an der Westseite, 3 Gassen quer, je Gasse ein Regalbediengerät (Roboter) und ein I/O-Platz am Ostende.
   - Einlagerung aus der Produktion am Westende.
   - **Anbruch:** Roboter holt die Palette an den I/O, der Lagerist nimmt nur die nötigen Kartons, die Restpalette geht zurück ins Hochregal. Kartons gehen durch N1 ins Kartonlager.
   - Kennzahlen aus der Planung:
     - 180/360/540 Paletten je Stufe, Ø 20 Kartons je Palette.
     - 58 Kartons am Tag (41 Laden, 17 Versand), 42 Pakete am Tag, 3,3 Stück je Paket.
     - Max. 20 Kunden gleichzeitig.
4. **Produktion** (≈2,5 Tage, 5 m Decke)
   - 3 Fertigungsstraßen, **nacheinander freischalten: Raketen → Kugelbomben → Batterien**.
   - **R6 = Wareneingang** (Rohstoffe), **R5 = Warenausgang** (Fertigware). Für das eigene Lager geht Fertigware innen direkt in die Reserve.
   - Jede Straße braucht **eigene Materialien/Rohstoffe, die man bestellen kann** (Lieferung an R6).
   - Optik nach Toms Foto `docs/uebergabe/produktion-referenz.webp`: automatisierte Laufbänder/Rollenbahnen, Portal-Greifer, Rohr-Raster (Batterie-Rohre im Gitter), helle Industrie-Optik. **Gern mehrere Stockwerke** je Straße (Platz sparen).
   - **VORHER mit Tom ein kurzes Produktionskonzept klären** (Rohstoffe, Rezepte, Dauer, Kosten, Qualität, was tut der Spieler selbst). Nicht ohne Klärung bauen.
5. **Gameplay-Vorführung** zeigt in jeder Phase alles Neue.

- **Versand-Regel (Tom):** KEIN Versand-Pickregal (nicht alle Produkte passen hinein). Der Packer pickt mit dem Rollwagen aus dem **ganzen Kartonlager**, mehrere Bestellungen je Tour, so effizient wie möglich.
- **Ausbau-Konzept (Tom):**
  - Große Technik (Hochregal/Roboter, Tore, Band, Produktion) fest pro Kapitel; frei platzierbar nur Laden, Backstock und Packtische in Zonen.
  - Idee merken: feste Bauplätze mit Auswahl, der Spieler setzt einen Schwerpunkt (z. B. Produktion ODER Online-Shop).
  - Vorgehen: grober Plan → bauen → testen → dann entscheiden, was frei wird.

### 5.5 Release-Vorbereitung (Plan von Tom, 07.10.)
- **USA-Release 4. Juli 2027** (US-Konsumfeuerwerk ~2,3 Mrd. $/Jahr laut APA 2022; Massachusetts verbietet alles, IL/VT nur Kleinkram). Zweite Welle Deutschland zu Silvester 2027.
- **Kostenlose Demo zum Steam Next Fest Juni 2027:** die besten 30–60 Minuten (Kiosk → erster Ausbau → starke Feuerwerke), Ende mit Wunschlisten-Aufruf, kein Zeitlimit. Kein Spieler darf nach der Demo neu anfangen müssen (Spielstand-Übernahme).
- **Zeitplan:** Steam-Seite spätestens Frühjahr 2027, Streamer ab April.
- **Nötig:** Englisch, Sommer-Saison mit 4.-Juli-Event neben Silvester, US-Produktnamen.
- **Ab Jahresende 2026 keine neuen Ideen mehr**, nur noch fertig machen und polieren.

### 5.6 Nur auf Toms Wort
- **FPS-Analyse:** Gruppen einzeln abschalten, Frame-Zeit messen. Als Wochenend-Aufgabe mit Restkontingent. Nichts selbstständig starten.
- **„Dreh auf“** heißt parallelisieren, aber nur unabhängige Aufgaben.

## 6. Toms Ideen (nur auf Nachfrage), Details in `docs/uebergabe/ideen.md`
- **Favorit: geopolitisches Wirtschaftsspiel.**
  - Welt im Ist-Zustand (seltene Erden aus China, Öl, Konflikte); der Spieler steuert ein Land ab heute.
  - Ziel ist **Weltfrieden** durch Diplomatie, Handel und Abhängigkeiten.
  - Rechtlich: reale Länder ok, reale Politiker besser fiktiv, keine verbotenen Symbole.
- Weitere Ideen: Weihnachtsmarkt-Sim, Späti-Imperium, Zirkus, Dorfverein→Profiklub, Bestatter, Nachtclub, Event-/Hochzeitsagentur, Recyclinghof/Pfand; später ein Shooter.
- Böllerladen später als Xbox-Port (Unity bevorzugt).

## 7. Toms Lage und Termine
- Tom ist **30.10.–16.11.2026 in Japan**.
- **Wochenlimit/Abo:**
  - Tom hat das Abo hochgestuft und achtet stark auf Tokens. Am 08.10. waren 62 % des Wochenlimits verbraucht.
  - Ziel des Chatwechsels: weniger Tokens pro Antwort, damit mehr Aufgaben möglich sind.
- Tom war am 08.10. sehr unzufrieden: Er sah ständige Ausfälle, falsche Zeitprognosen und Agenten, die sich gegenseitig blockieren. Deshalb die Regeln in Abschnitt 8. **Nicht wiederholen.**

## 8. Regeln für die Zusammenarbeit (auch in `CLAUDE.md`)
- **Sprache und Ton:**
  - Deutsch, **wirklich kurz** (wenige Zeilen, keine Tabellen oder Überschriften, wenn drei Sätze reichen).
  - Ehrlich, auch unbequem; widersprechen, wenn etwas nicht stimmt; kein Moralapostel.
- **Messen statt raten:** rendern und hinsehen, Werte auslesen; bei jedem Fix eine **Gegenprobe** (Fehler wieder einbauen → Test schlägt an).
- Termine und externe Regeln (Steam, Fristen) vorher nachschlagen.
- **Artefakt nach jeder Änderung neu veröffentlichen und den Link immer mitschicken.**
- **Anomalie-Regel:** Jedes Feuerwerksprodukt ist einzigartig (eigener Effekt, eigene Abschussfolge, nicht immer links→rechts, Name passt, Steigerung über die Level). Qualität vor Quantität.
- **Agenten:**
  - Sonnet für Routine und Mechanik, Opus für Gestaltung und Effekte.
  - **Max. 2 gleichzeitig, und nur, wenn sie sich keine Testsperre und keine Dateien teilen.** Sonst nacheinander und **Tom vorher warnen**.
  - Bricht ein Agent ab (529, Container-Neustart, „stopped“): **sofort und ohne Rückfrage fortsetzen** (SendMessage) oder neu starten. Tom will nie „der läuft nicht mehr“ hören.
  - **Wächter:** alle 2 h; in der Endphase ein billiger Check alle 30 Min (ein Bash-Befehl).
  - Agenten müssen prüfen, dass ihr Testlauf wirklich in der flock-Schlange steht bzw. läuft. Nicht blind warten (am 08.10. wartete ein Agent 25 Min auf einen nie gestarteten Lauf).
- **Tests:**
  - Agenten testen nur, was sie geändert haben.
  - **EIN Merge und EINE Regression am Ende.**
  - Ein Lauf belegt die Sperre **max. ~20 Min**; FPS-Messungen kurz und nur einmal am Ende (am 08.10. blockierten 4 FPS-Läufe à 40 Min alles 2,5 h).
- **Zeitprognosen:**
  - Testminuten × 2 (geteilte Sperre), plus 1–2 Fehlerrunden à ~60 Min, plus Puffer für einen Container-Neustart.
  - Immer als **Uhrzeit (dt. Zeit) mit „realistisch“ und „spätestens“**.
  - Am 08.10. lag ich 3–4× zu optimistisch.
- **Commits:** Footer
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <aktuelle Session-URL>
  ```
  Keine Modell-IDs in Dateien. Der Stop-Hook mahnt bei uncommitteten Änderungen; nur pushen, was getestet ist.
- **Neue große Aufgaben** in einem langen Chat nicht annehmen, sondern an einen Chatwechsel erinnern.

## 9. Bauen und Testen (Rezept)
```sh
# 1) Spiel bauen (Repo-Wurzel)
sh -c '. ./src/build.sh; W=./src; build' && mv src/boellerbude.html boellerbude.html
# Syntaxcheck
python3 -c "import re;s=open('boellerbude.html').read();open('/tmp/a.js','w').write('\n'.join(re.findall(r'<script>(.*?)</script>',s,re.S)))" && node --check /tmp/a.js

# 2) Test-HTMLs in einem Arbeitsordner erzeugen
mkdir -p /tmp/t && cp boellerbude.html tools/test/* /tmp/t/ && cd /tmp/t
python3 mktest.py   # test.html: three-Stub (schnell, nur Logik)
python3 mkreal.py   # real.html: echtes three r128 (aus tools/test/three.min.js)

# 3) Einen Test fahren – NIE zwei gleichzeitig (gemeinsame Sperre)
flock /tmp/bb-testlock timeout 3600 node -r ./ladezeit-preload.js /home/user/gaming/src/tests/<name>.js $PWD/real.html
#   HANDY=1 vorne dran = Handy-Ansicht; manche Tests mit R4=1 (themen) oder X=0
#   Ausgabe enthält "ALLES OK" / "MANGEL: …" / "ERRORS: …"
```
- Playwright und Chromium sind vorinstalliert (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); niemals `playwright install`.
- Rechner: 4 CPUs, keine GPU. Ein Test lädt ~50 s; Feuerwerks-Filme und FPS-Läufe dauern lang.
- `ladezeit-preload.js` setzt eine Mindestfrist von 120 s für `waitForSelector` und `click` (Last).
- `three-stub.js` kennt u. a. `Matrix4.makeScale`. Fehlt im Stub eine Methode, gibt es den Absturz „xyz is not a function“ nur in test.html; dann den Stub ergänzen.
- `kontakt.js` erzeugt ein Kontaktbild (Figuren, Karton, Handy, Zündtisch).
- **Wichtige Tests nach Bereich:**
  - **Laden/Personal:** personen, kasse, kartonauf, einraeumer, regalsicht, pause.
  - **Versand:** packer, packband, packmaterial, versand, versandtor, tourplan, pakete, karre, kartonlogik, durchgang.
  - **Ausbau/Lager:** ausbau, stufen, lager, online.
  - **Feuerwerk:** lochschuss, themen (+R4=1), abschussklang, kugelknall, bodenfontaene, ursprung (test.html), steigerung (test.html), hoehen, anomalie, neuware, sortiment, vfrohr, vfgrafik, vorfuehrung, mblast, kleinfeuer06, verpackung.
  - **Leistung/Gesamt:** leistung, gameplay, H:gameplay (=HANDY=1), baum.
- Container-Neustarts kommen vor und töten laufende Prozesse. Danach Agenten fortsetzen und Läufe neu starten. Das Scratchpad überlebt Neustarts, aber keinen Chatwechsel.

## 10. Erste Schritte im neuen Chat
1. Diese Datei und `CLAUDE.md` lesen. `git log -5` und den Branch prüfen.
2. Tom kurz bestätigen, dass der Kontext da ist (3 Zeilen), und nach der Reihenfolge fragen. Vorschlag:
   - 5.0 Stufe 1 ohne Kran (klein, ~½ Tag).
   - dann 5.1 Tests beschleunigen.
   - dann 5.2 Modelle oder 5.4 großer Bau (nur mit Startsignal) oder 5.3 Feuerwerk.
3. Für jede Aufgabe eine Zeitprognose nach Regel (realistisch/spätestens, dt. Uhrzeit) und sagen, ob Agenten sich im Weg stehen würden.

## 11. Wo steht was noch
- **Chronik aller Entscheidungen:** `git log` (513+ Commits mit sprechenden Texten). Jede Datei in `src/parts/` beginnt mit einem Kommentar, der Toms Wunsch mit Datum zitiert.
- **Toms Befundlisten:** `docs/uebergabe/befunde.md` (Feuerwerk) und `docs/uebergabe/gameplay.md` (Gameplay 1–18).
- **Skizzen und Fotos:**
  - `tom-skizze-rotgelb.jpg`: Lager-Grundlage für Plan v7.
  - `versandecke.jpg`.
  - `produktion-referenz.webp`.
  - `batterie-referenz-*.png`.
  - `referenz-10-batterien.png`.
- `ROADMAP.md`: Kapitel-Übersicht. Die Demo-Frage ist durch den Release-Plan in Abschnitt 5.5 entschieden: Demo zum Next Fest Juni 2027.
- `docs/realistische-batterien.md`: ältere Leitlinien zu Batterien.

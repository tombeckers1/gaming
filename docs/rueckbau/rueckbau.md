# Rückbau der großen Halle (16.10.2026, Branch `claude/rueckbau`, Ausgangsstand V141 a3baa21)

Tom, 16.10. abends: „Die große Halle ist eine Katastrophe, ergibt keinen Sinn, zu viele Baustellen – ein eigenes Spiel fast.
Mach die große Halle KOMPLETT weg und lösch sie aus dem Code. Auch das Rolltor im Lager zwischen DDL-Tor (V1) und dem
allerersten (R1) muss weg. Mach das Lager wie vorher, mit der Lagerfläche, einfach die Wand davor – einheitlich mit den
anderen Wänden. Der gelbe Streifen unten an den Lagerwänden bleibt. Konzentrieren auf den Kern: Verkauf, Pyrotechnik,
Online-Shop, Versand.“

## Was weg ist (gelöscht, nicht ausgeblendet)
- **Dateien:** `05m-logistik.js` (Logistikhalle 3 Stufen, Tore R2–R5, LKW-Hof 2), `05q-lagerlogistik.js` (Kartonlager ③, gelbe Wand,
  N1, neue Schleuse, Hochregal-Halle, Sprinkler/Tank/Parkplatz/Pforte), `05r-werk.js` (Werk West, Verbindungsbau, Mischhaus/Erdwall,
  Hof West, Werkszaun), `05s-produktion.js` (Rohstoffe, Rezepte, Werker/Mischer, Großhandel, Laptop-Tab Produktion, Leitstand),
  `11f-hochregal.js` (RBG/FTS/Förderer-Logik, Anbruch, Stellplätze), `08c-wrampe.js` (Lieferungen an R2–R5).
- **In anderen Dateien:** Lagergang zum Rückgebäude (kam nur mit der Logistikhalle – geprüft: Zone `lager_west`, ohne Halle führte
  er nirgendwohin) und alte Schleuse samt Streifenvorhängen (05h), `WRAMPEN/WTORE/westTor` (05h), `LAY.lw1/lw2/lwest/schleuse/hof2`,
  `GH_H`, `SCHLEUSE_H` (05), Dächer/Raumlicht (20-loop `dachBereiche`), Sichttakte (03b), Fernausblendung (06), Bodenhöhe/Treppe (15),
  Fixkosten/Werksverkauf/Tagesabschluss (16), Laptop-Pläne/Toasts/Produktion (17), Vorführung (17e: Sprungpunkte Logistik, Hochregal,
  Werk; übrige 1–7), Leistungsbericht-Route (17g: Hochregal, Werk), Handbuch „Werk West“, QS-Stichprobe (14z4), Test-Schnittstellen (22).
- **Daten/Wirtschaft:** Upgrades `lager_west/2/3, rampe2–5, lagerlogistik, fabrik/2/3`, Personal `werker1–3, mischer`, Kapitel 7
  „Pyro-Logistik“ und 8 „Pyro-Fabrik“ (die geplanten 9–11 heißen jetzt 7–9), 01c: Preise, `fix.hochregal/werk/werkStrasse`, Löhne/
  Einstellung Werker/Mischer, Block `produktion`, `ruf.qsJe/qsMax`, Ketten `lagerlogistik/fabrik/produktion`. Die alten Kaufpreise
  stehen nur noch als `WIRT.historie.erstattung.ausbau/rohstoff` (für alte Spielstände).
- **Baukasten:** `bk.hochregal, rbg, foerderer, fts, zelle, treppe, portalgreifer, rohrraster, maschine, erdwall` (+ Helfer `HOCHREGAL,
  ladungGeo, kastenM, werkSammler, balken`), `bk.tor` Art `schnelllauf` (N1), `bk.tuer` Drehflügel und Streifenvorhang, `bk.lampe` Art
  `halle`, `bk.bodenmarkierung` Gehweg/Piktogramm/LKW-Stellplatz; MAT `gitterRost, markierungGruen, markierungPikto, lichtband,
  betonZelle, erdwall, pvcBehang, pvcStreifen`, Ton `kupfer`, Texturen `fussgaenger, rasen`.
  **Bleibt (mit grep belegt):** `bk.lampe` (raster/mast/wand/strasse – 11 Stellen), `bk.bodenmarkierung` (Hof R1, Versandhof, Packplätze –
  19), `bk.dachrand`, `bk.hubwagen` (DDL-Fahrer), `bk.tuer` schiebe (Ladentür), `bk.tor` sektional/roll/gitter, `bk.inst/palFarbe` (Paletten).
  `bk.treppe` gab es nur im Werk – gelöscht.
- **Welt:** Stand vor Etappe B: `STADT_FREI` x −101 / −76, Asphalt 200 × 200 m, Straße/Gehweg bis x −100 (`STR.XW` weg);
  NAV-Gitter x0 −67 → −36 (150 × 110 statt 211 × 110 Zellen). Logistikzentrum Ost (Kulisse) und Ausstellung unverändert.
- **Tests/Werkzeuge:** gelöscht `hochregal, werk, produktion, logistik, wrampe, gangfrei, gangwand, karte, leer`, `tools/halle/*`,
  `tools/produktion/*`; angepasst `kapitel, kauf, park, schnee, leistungsbericht` und die Kauflisten in `bal, blick, doppelwand,
  durchgang, fassade, gang, gehen, naht, schilder`; `tools/licht/bilder.js` ohne Halle/Werk.
- Umfang: `src/parts` −3 202 / +236 Zeilen (35 Dateien), Tests/Werkzeuge −1 187 / +235. `boellerbude.html` 9,73 → 9,47 MB.

## Welches Tor Tom meint
Im Lager ② sieht man nach Westen durch das offene Kartonlager ③ das gelbe **PVC-Schnelllauftor N1** (Bild `bilder/vorher-lagerWest-tag-hoch.jpg`,
Bildmitte links) – das ist „das Rolltor zwischen V1 und R1“. Es ist weg, ebenso alle anderen Öffnungen der Westwand x −19,9 (Durchgang zur
alten Schleuse z −22,4…−18,6 mit Streifenvorhang, die breite Öffnung zu ③ und zur neuen Schleuse). Die Westwand von Lager Süd ist jetzt
**eine** geschlossene `bk.wand` von z −29,9 bis −6,1 (Lagerwand mit gelb-schwarzem Sockelband innen, Sandwichpaneele mit Betonsockel außen –
wie die übrigen Lagerwände), die Ostwand zum Testfeld (Lagergang-Öffnung) ebenfalls geschlossen. Der gelbe Streifen ist das Sockelband der
Lagerwand-Textur (`MAT.TEXTUR.lagerwand`, 35 cm, seit V134 unverändert).

## Alte Spielstände (18-save `rueckbauDaten` / `rueckbauEinlagern`)
Einmalig beim Laden, danach steht nichts mehr davon im Stand:
1. entfernte Ausbauten weg, **Kaufpreis zurück** (Preise V141 aus `historie.erstattung.ausbau`);
2. Werker/Mischer entlassen, ohne Kosten (keine Abfindung, keine Erstattung der Einstellung);
3. Rohstoffe im Lager und bestellte Rohstoffe zum Kaufpreis (Premium × 1,2) zurück;
4. Ware aus Hochregal (Plätze + unterwegs), Fertigung (Paletten, angefangener Karton), Trockenkammer, Förderer, Anbruch-Regalen und vom
   Hallenboden: zuerst in freie Lagerfächer, dann bis 16 Kartons an die Warenannahme R1, **der Rest zum heutigen Einkaufspreis** gutgeschrieben;
5. Lagerregale aus ③/Halle ziehen auf freie Plätze im Lager, ohne Platz nimmt der Regalbauer sie zum Grundpreis zurück; die 5 Anbruch-Regale
   (kamen umsonst mit dem Ausbau) entfallen ohne Gutschrift, ihre Ware zieht mit um;
6. Pakete in der Halle kommen mit der nächsten Lieferung, Deko dort an einen freien Platz;
7. eine Meldung „Rückerstattung: …“.

Gemessen mit dem V141-Vollausbau aus der Vorführung (`src/tests/daten/v141-vollausbau.json`, Level 39): Gutschrift **304.153,45 €** =
Ausbauten 280.500 € + Rohstoffe 8.273,24 € + 7 Lagerregale 880 € + 441 Kartons zum EK 14.500,21 €; 16 Kartons an der Warenannahme
(das Lager war voll), 1 Regal umgezogen; Ware je Sorte vollständig (25.424 Stück in 238 Sorten vorher = nachher inkl. Gutschrift).
Zweites Laden: keine zweite Gutschrift.

## Messung (tools/rueckbau/bilder.js, Vorführung + alle Ausbauten, swiftshader; Zeichenaufrufe je Bild inkl. Schatten/Effekte)
| Ansicht | Hoch vorher → nachher | Ultra Low vorher → nachher |
|---|---|---|
| Laden vom Eingang | 3422 → 3157 (−8 %) | 1538 → 1464 (−5 %) |
| Lager ② Westwand | 3036 → 2462 (−19 %) | 1154 → 897 (−22 %) |
| Versandecke | 2691 → 2341 (−13 %) | 944 → 853 (−10 %) |
| Hof R1 | 4149 → 3722 (−10 %) | 2310 → 2209 (−4 %) |
| außen West | 3636 → 3193 (−12 %) | 2437 → 2169 (−11 %) |
| Draufsicht | 3552 → 2847 (−20 %) | 2272 → 1791 (−21 %) |
| Geometrien / Texturen / Meshes | 3582 / 786 / 4930 → 2804 / 663 / 3668 | 3469 / 665 / 4446 → 2807 / 593 / 3279 |

Bilder: `docs/rueckbau/bilder/vorher-*.jpg` / `nachher-*.jpg` (selbst angesehen: Westwand durchgehend, kein Spalt, Sockelband läuft durch,
keine Z-Kämpfe an den Wandenden, außen Fassade mit Sockel wie die übrigen Wände).

## Progression (nur notiert, nicht neu balanciert)
Weg sind 11 Ausbauten für zusammen 280.500 € (Level 28–37) und 4 Stellen. Letzte Ausbauziele jetzt: L28 Labor 2 (16.500 €), L29 Packstation 3
(6.900 €) und Lizenz Pyro-Weltklasse (52.000 €), L30 Meisterbrief (12.000 €). **Ab Level 31 gibt es kein Ausbauziel mehr** (vorher L31
Lagerlogistik, L33/35/37 Werk), Kapitel 7–9 sind nur Vorschau. Für das Balancing: Geldsenke und Ziel für Level 28+ fehlen.

## Offen / für Tom
- Westlich und südlich des Lagers liegt jetzt eine leere Asphaltfläche (früher Halle/Hof 2, Bild `nachher-aussenWest-tag-hoch.jpg`,
  `nachher-draufsicht-tag-hoch.jpg`). Welt bewusst wie vor Etappe B zurückgesetzt; Vorschlag: Stadt oder Park dort wachsen lassen (eigener Schritt).

## Tests (real.html, swiftshader, Sperre /tmp/bb-testlock-rw, je Test einzeln)
- grün: `rueckbau` (neu, 421 s; Gegenprobe GEGENPROBE=1 schlägt mit WARE und WESTWAND an), `ausbau`, `stufen`, `lager`, `packer`, `versand`,
  `versandtor` (Test angepasst: Hofschrift aus der Geometrie lesen – seit Einheit/bk.bodenmarkierung lag sie nicht mehr in `position`,
  Altfehler seit 16.10., nicht vom Rückbau), `leistungsbericht` (Route 7 Orte), `licht`, `ausstellung`, `verpackung`, Node-Wächter.
- `material` grün (436 s, allein). Laufzeit-Wächter: Ausgangswerte mit Grund neu (Halle-/Werk-Bauteile weg; Laden 629 → 517, Lager 543 → 422
  Zeichenaufrufe), Schattenpass als Höchstwert aus drei Läufen (schwankt 251/323 je nach Deckenschatten-Bild), danach grün.
- **gameplay: rot (Speicher).** Aufbau, drei Spieltage, DDL-Anruf und Packmaterial laufen (START/TAGE wie gefordert: 16/16 Ausbauten,
  10/10 Personal, 351/351 Fächer voll, DDL 3 Rufe/90 Pakete, Packmaterial 99/11). Danach stirbt der Renderer beim Neuladen (gpEnde) mit
  > 12,5 GB (zweimal, auch mit BB_MAX_MB 14500 → OOM-Killer). Derselbe Test auf V141 läuft zweimal grün mit 4,7 GB Spitze – also eine
  Regression dieses Branches. Ursache nicht gefunden: kein Konsolen-/Toast-Spam, Geometrien/Texturen/Meshes stabil, JS-Heap kleiner als
  vorher; der Anstieg liegt im Browser- (2,7 GB) und Renderer-Prozess nach dem Ende der langen Tagesschleife. Offen, vor dem Veröffentlichen klären.

# Produktion im Werk West – Produktions-Gameplay (15.10.2026)

Konzept: `produktion-konzept.md` (Tom 14.10. freigegeben, **ohne Wartung**). Code: `src/parts/05s-produktion.js` (Logik, Laptop-Tab,
Leitstand, QS), Welt/Animation `05r-werk.js`, Zahlen nur `01c-wirtschaft.js` (`WIRT.produktion`, `fix.werk/werkStrasse`,
`personal.lohn.werker1-3/mischer`, `ruf.qsJe`), Wirkungsketten `fabrik` + `produktion` (→ `docs/fundament/wirtschaft.md`).
Test `src/tests/produktion.js` (test.html), Rechner `tools/produktion/rechner.js`, Messung `tools/produktion/messen.js`.

## Was der Spieler tut
- **Team**: Werker je Straße (`werker1-3`) und einen **Mischer** (Satz für alle Straßen) einstellen – Lohn läuft auch, wenn die Straße steht.
  Werker/Mischer haben keine Figur im Wegenetz; der Werker steht sichtbar an seiner Straße (Gang vor Station 5).
- **Produktion** (Tab im Büro-Laptop, am Lager-PC und im **Leitstand** – Pult auf der Galerie, Aktionstaste):
  je Straße einschalten, Standard-/Premium-Rohstoffe, „Großhandel nimmt Überschuss“, **Auftragsliste** (Produkt + Kartons, Reihenfolge ▲,
  Menge −/+, löschen), Produktauswahl sortiert nach Ertrag je Tag mit Rohstoffkosten, Ersparnis, Stück/Tag, NEM, Bestand.
- **Rohstoffe** bestellen (Hülsen/Pappe, Oxidator, Metallpulver, Schwarzpulver; Gebinde ×1/×5, Standard/Premium). Bezahlt bei Bestellung
  (bis in den Dispo), **Gefahrgut-LKW am nächsten Tag an Tor 6** (fährt im Hof West vor, Tor auf, entladen, Tor zu, weg), Lieferpauschale
  einmal je Liefertag. Lager mit Grenze: Inertlager und drei Chemie-Boxen – zu viel bestellen geht nicht, zu wenig heißt Stillstand.
- **Störungen** (keine Wartung): im Schnitt 0,7 je Tag und Straße bleibt eine Zelle stehen – Ampel der Straße blinkt rot, Meldung, Leitstand
  zeigt STÖRUNG und die Station. Freigeben: hingehen und Aktionstaste an der Station, oder im Leitstand „Zelle freigeben“. Sonst schafft es der
  Werker selbst nach `stoerung.selbstSek` (110 s ≈ ein Drittel Tag).
- Produziert wird während der Ladenöffnung (8–22 Uhr, wie die Werker arbeiten); Sonntag ohne Sonntagsöffnung steht das Werk.

## Mechanik
- **Rezept** (`pdRezept`, einmal je Sorte, keine Handpflege): Klasse aus der Form (Raketen = `rocketset`, Kugelbomben = `shell`,
  Batterien = `battery`/`fan`), Größe = Packmaß in Litern. NEM = g/L je Klasse, davon Schwarzpulver-Anteil, Rest Sternsatz
  (Oxidator:Metall); Hülsen/Pappe g/L. Liegen die variablen Kosten außerhalb **45–60 % vom Katalog-Einkauf**, wird das Rezept als Ganzes
  skaliert (Effektaufwand). Takt = Grundtakt × √(Liter/Referenz) → große Ware dauert länger. Herstellbar ist jedes Produkt der Klasse mit Lizenz.
- **Qualität**: Erfahrung = Produktionstage des Werkers / 20 (neuer Werker fängt bei 0 an). Ausschuss 15 % (neu, Standard) … 2 % (erfahren,
  Premium); Effektqualität q 0,90 … 1,14. q geht mit dem Karton ins Regal und wirkt wie Lieferantenware (Kaufbereitschaft, Blindgänger).
- **QS-Stichprobe**: das erste Stück des Tages je Straße geht ins Labor → Ruf (q−1)×6 (max ±1,5); eines je Tag wird auf dem Testfeld
  gezündet (`abStichprobe` in 14z4 = gleicher Platz/gleiche Mechanik, Effekt unverändert, ohne Hype; schlechte Qualität kann ein Blindgänger sein).
- **Ausgabe**: 8 Kartons = 1 Palette (Auftragsende: Rest-Palette) → Sammelförderer → Gasse der Straße im Hochregal (S.hr, Karton-Merkmal
  `e:1` = Eigenproduktion), alle 6 s eine. **Kugelbomben** gehen erst in die Trockenkammer und sind am nächsten Spieltag fertig.
  Ab dort wie Kaufware: `stockOf`/`hrStock`, Anbruch, Nachschub, Laden, Onlineversand. Hochregal voll → 3 Paletten Stau → Straße steht.
- **Werksverkauf an den Großhandel** (je Straße einschaltbar): abends holt die Spedition alles über 6 Kartons je Sorte (Reserve für den
  eigenen Laden) zu 85 % vom aktuellen Einkaufspreis × Qualität (0,9–1,12). Zeile im Tagesabschluss unter Einnahmen.
- **Fixkosten**: Werk 45 €/Tag ab der ersten eingeschalteten Straße (`S.pd.aktiv`), je eingeschaltete Straße 30 €/Tag (auch wenn sie steht),
  Löhne Werker 150 €, Mischer 175 € (Einstellung 900 / 1.200 €). Im reinen Ausbau ohne Produktion bleibt es bei 35 € je Gasse.
- **Statistik**: je Straße Stück/Stunde und /Tag, Rohstoffkosten je gutes Stück, Stückkosten mit Fixkosten bei voller Auslastung, Marge gegen
  Einkauf, **Break-even** (Stück/Tag, die man sonst einkaufen würde; mit Großhandel), Netto je Tag bei voller Auslastung, gestern (Stück,
  Ausschuss, Rohstoffe, Großhandel); oben gebundenes Kapital der Eigenproduktion (Herstellkosten und Einkaufswert), Rohstoff-Reichweite in Tagen.
  **Tagesabschluss**: Block „Produktion (Werk West)“ je Straße + Lager/Trockenkammer/unterwegs, Ausgabe „Rohstoffe für das Werk“,
  Einnahme „Werksverkauf an den Großhandel“.
- **Leitstand-Bildschirme** je Straße: Status (LÄUFT/STEHT/STÖRUNG blinkend), Auftrag, Stück/h, heute; Stationen (Störung blinkt),
  Ausschuss, Qualität, Rohstoff-Reichweite – einmal je Sekunde, nur mit Blick ins Werk.
- **Vorführung**: Werk mit Rohstoffen, eingearbeiteten Werkern, je Straße drei Aufträge und Großhandel; Disponent bestellt Rohstoffe nach.
  Sprungpunkt „Werk“ (Taste 0, mehrmals = Rundgang) zeigt die laufenden Straßen.

## Balancing (CLAUDE.md „Preise bestimme ich“) – Begründung
**Befund, gemessen** (Vorführung = Kapitel 8 mit allem, test.html, 3 Spieltage, `S.stat`): der Laden verkauft je Tag nur
**~34 Raketen, ~42 Kugelbomben, ~35 Batterien** (101/125/106 in 3 Tagen; mittlerer EK 11 / 25 / 40 €). Eine Straße, die nur den eigenen
Laden beliefert, spart damit 34 × ~6 € ≈ 200 €/Tag – bei 400 € Fixkosten (Werker, Mischer, Werk, Straße) **ein Verlust**. 46.000 € wären so nie
drin. Darum der **Werksverkauf an den Großhandel**: erst Menge (Auslastung) trägt die Fixkosten – genau die Lektion des Konzepts
(Fixkosten gegen Marge, Break-even). Ohne ihn bleibt das Werk ein Verlustbringer, mit ihm entscheidet die Planung.

Rechner `tools/produktion/rechner.js` (Katalog-EK, Markt 1,0; Erfahrung wächst ab Tag 0; Straße 1 trägt Werk + Mischer allein):

| Spielweise (fabrik, 46.000 €) | Tag 1 netto | ab Tag 30 netto | Amortisation |
|---|---|---|---|
| **gut**: bestes Produkt (Supernova), Großhandel, Störungen sofort frei, Lieferung alle 2 Tage | +488 € | +994 €/Tag | **52 Tage** |
| wie gut, Premium-Rohstoffe | +502 € | +1.010 €/Tag | 51 Tage |
| nachlässig: Störungen behebt der Werker, tägliche Lieferung | +288 € | +664 €/Tag | 76 Tage |
| falsches Produkt (Median, Knisterstern) | −39 € | +239 €/Tag | 206 Tage |
| nur Ladenbedarf (34/Tag), kein Großhandel | −91 € | −19 €/Tag | nie |
| volle Menge ohne Großhandel (Kapital im Hochregal) | −1.143 € | −1.143 €/Tag | nie (Straße steht, wenn das Regal voll ist) |
| fabrik2 (26.000 €, Himmelssturz 300, gut) | | +1.189 €/Tag | 25 Tage |
| fabrik3 (23.000 €, Goldnatter, gut) | | +1.336 €/Tag | 21 Tage |

**Gemessen** (`tools/produktion/messen.js`, Vorführung in test.html, Straße 1 neu eingerichtet wie „gut“: Supernova, neuer Werker,
Standard, Großhandel, Störungen nach ~15 s frei; 8 Spieltage):

| Tag | 0* | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| gute Stück | 95 | 108 | 117 | 122 | 119 | 116 | 125 | 115 |
| Ausschuss | 11 % | 15 % | 13 % | 9 % | 11 % | 13 % | 7 % | 9 % |
| Großhandel € | 1.388 | 2.296 | 2.696 | 2.494 | 2.570 | 2.634 | 2.659 | 2.725 |
| Rohstoffe verbraucht € | 1.373 | 1.625 | 1.779 | 1.721 | 1.688 | 1.753 | 1.783 | 1.650 |
| netto € (ohne Laden-Ersparnis) | −433 | +223 | +469 | +326 | +434 | +434 | +429 | +628 |

\* Tag 0 angebrochen. Gegenprobe zum Rechner: Tag 5 rechnet er +625 € inkl. ~195 € Ersparnis, weil der Laden 34 Supernova nicht mehr
einkaufen muss; ohne diese Ersparnis +430 € – gemessen +434 €. Stück/Tag 107–134 (Rechner 130), Ausschuss fällt mit der Erfahrung wie berechnet.

Stellschrauben und warum: Grundtakt Raketen 1,25 s je Stück bei 8 L (≈ 135 Supernova bzw. 270 Knisterstern am Tag = 10–19 je Spielstunde,
realistisch für eine Linie) – gewählt, damit „gut“ in 30–60 Tagen landet; Kugelbomben 3,5 s/6 L, Batterien 3,0 s/20 L (fabrik2/3 nutzen Werk
und Mischer mit und sind billiger: 21–25 Tage, wie die „großen Stufen“ 15–30 Tage). Großhandel 85 % vom Einkauf (Großhändler-Spanne 15 %).
Premium ×1,2: lohnt mit neuem Werker (Ausschuss 15 → 10 %), mit erfahrenem etwa gleich – dann zählen Ruf (QS) und Großhandelspreis.
Band 45–60 %: teure Ware mit kleinem Packmaß spart am meisten je Stunde → die **Produktwahl** ist die größte Stellschraube (gut 52 Tage,
Median-Produkt 206 Tage). Rohstofflager reicht bei gutem Spiel für Straße 1 ≈ 7 Tage Hülsen, 8 Tage Schwarzpulver – mit drei Straßen 2–3 Tage:
regelmäßig bestellen (Liquidität!).

## Offen / ehrlich
- Spielverlauf bis Kapitel 8 nicht mit dem Balancing-Bot gemessen; Rechner rechnet mit Katalog-EK (Markt 1,0) – Markt und Inflation heben
  den Großhandelspreis, Rohstoffpreise folgen weder Markt noch Inflation (Lücke in `WIRT_KETTEN`).
- Großhandel nimmt unbegrenzt ab (keine Nachfrage-Grenze) – die Kapazität der Straße ist die Grenze.
- Eigenproduktion ist im Hochregal markiert (`e:1`), im Regal/Laden nicht mehr (die Qualität geht mit).
- Mischer hat keine Figur (Mischhaus ist geschlossen).

## Tests (15.10.)
- `src/tests/produktion.js` (test.html, ~1 min): Bestellen (Preis, Kapazitätsgrenze) → LKW an R6 → Plan → Produktion → Hochregal Gasse 2
  (Eigenproduktion, `stockOf`/`vsBestand`) → Fixkosten erst ab Einschalten (+45 +30) → Kosten je Stück = Rezept, Band 45–60 %, Ausschuss
  plausibel, QS einmal am Tag → ohne Rohstoffe steht die Straße, Lohn läuft → Störung + Freigabe an der Station → Leitstand-Laptop →
  Kugelbomben trocknen bis morgen → Tagesabschluss → Spielstand. **Gegenprobe** `GEGENPROBE=1` (Rezept ohne Rohstoffe) schlägt an. Grün.
- real.html unter der Sperre: `werk` (angepasst: ohne Auftrag steht die Straße, mit Werker/Mischer/Rohstoffen/Auftrag läuft sie), `hochregal`,
  `ausbau`, `gameplay` grün; `test.html`-Gameplay grün. Laufzeit-`waechter`: BUDGET Testfeld knapp über der Toleranz (398 > 393 Schatten) –
  **schon auf dem Ausgangsstand db8c425** rot (Testfeld 512 > 510 Aufrufe, Licht-Zwischenstand), nicht durch die Produktion; nicht neu geschrieben.
- `tools/test/three-stub.js` ergänzt (Box3, Matrix3, InstancedMesh-Matrizen/Farben, Index der Box): test.html lud seit den Paletten (14.10.) nicht mehr.

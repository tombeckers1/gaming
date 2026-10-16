# Werkbank – eigene Batterien (Kapitel 5 „Eigene Marke“, 16.10.2026)

Auftrag Tom (16.10. abends): *„Man soll seine eigene Marke produzieren können: sein eigenes Feuerwerk aus den bestehenden
Effekten bauen, extern produzieren lassen, es wird ganz normal geliefert wie jedes andere Produkt und man verkauft es selbst.
NUR Batterien. Ein komplettes Bauprogramm: wie lang soll die Batterie sein, welche Effekte, die Abfolge. Dazu eine kleine
Vorsimulation … Dann gibt man den Namen, der wird auf das Produkt geschrieben. Maximal 5 eigene Batterien. Gestaffelt nach
Level … am Ende eine Monsterbatterie mit ~500 Schuss. Gesteuert über eine WERKBANK im Lager, NICHT über den Laptop.“*

Die Werkbank **ersetzt das Entwicklungslabor** (02d-rezeptur, Laptop-Reiter „Entwicklung“, Prototyp). Kapitel 5 bleibt.

## 1. Bedienung
1. **Kaufen:** Ausbau › „Werkbank – eigene Marke“ (Level 20, braucht Lagererweiterung 1). Sie steht im **Lager Nord an der
   Westwand neben dem Rolltor** (zwischen den Regalplätzen, nicht in Halle/West), verschiebbar wie der Gravur-Automat.
2. **Hingehen, E** (am Handy Aktion) – Vollbild „WERKBANK“: fünf Plätze, Größen-Übersicht (Stufen kaufen direkt dort oder
   im Laptop unter Ausbau/Einrichtung). Das Tablet auf der Werkbank zeigt die fünf Plätze.
3. **Neue Batterie → Bauprogramm:** Größe wählen (25/60/110/200/500 Schuss), Ablauf als **Zeitleiste aus Abschnitten**:
   je Abschnitt Effekt (nur gesehene Bruchbilder und Lichter), zwei Farben, Schusszahl (−5/−1/+1/+5/Rest), Takt (5/4/3,3/2,5
   Schuss/s – 0,2–0,4 s je Rohr wie im ganzen Sortiment), Abfolge (links → rechts, rechts → links, Fächer, Zickzack, W,
   V-Salve, zufällig, senkrecht, Finale = schnellstmöglich), Höhe (tief/mittel/hoch), Kaliber (klein/normal/groß), Pause
   danach (0/1,5/3 s). Abschnitte kopieren ⧉, verschieben ▲▼, löschen ✕, bis 12. **Live:** Schuss verteilt/frei, Dauer,
   Bewertung (Sterne), Stückkosten, Marktwert.
4. **Vorschau zünden:** Kameraschnitt in die Abendansicht über dem Testfeld; die Batterie steht auf einem Zündtisch neben der
   Mörserbatterie und zündet über den **Abschuss-Baustein 14z4** (`abPlatz` → `abAufstellen` → `abZuenden`) mit derselben
   Engine wie jede Batterie – Vorschau = Spiel. Keine Kosten, kein Hype, Spielzeit steht. „Beenden“/Esc bricht ab, danach
   zurück an die Werkbank.
5. **Weiter: Name & Serie:** Name (22 Zeichen) → Verpackung wird live gestaltet (Linie **Hausmarke**: Markenfeld mit dem
   Ladennamen auf Nachtblau/Gold, Effektfoto in den Farben der ersten Abschnitte, Name, Schussstern, Infozeile Schuss/Dauer/
   Höhe/Kaliber). Kalkulation: Stückkosten, Marktwert, eigener Verkaufspreis mit Preis-Ampel, Deckungsbeitrag, Entwicklung,
   Break-even, Serie (Mindestmenge, Rabatt, Lieferzeit), gebundenes Kapital. **„Entwickeln und Serie bestellen“**.
6. Nach 2–3 Spieltagen kommen die Kartons **mit dem nächsten LKW** wie jede Ware (Rampe, einräumen, Regal, Onlineshop).
   **Nachfertigen** an der Werkbank (mit Mengenwahl/Rabatt) oder im Laptop/Lager-PC/Tablet unter Bestellen › **Eigene Marke**.
   Beim Fachhandel ist die eigene Marke nicht bestellbar.
7. **Höchstens 5** eigene Batterien. Löschen nur ohne laufende Serie; was noch im Laden liegt, bleibt als Restbestand verkaufbar.

## 2. Größen und Zahlen (alle in `WIRT.werkbank` und `WIRT.ausbau.preis`, 01c)
| Stufe | Schuss | Kaliber | ab Level | Ausbau | Entwicklung | Mindestmenge (Kartons × Stück) | Lieferung | Marktwert bei 3 ★ | Stückkosten | DB je Stück |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 Kompakt | 25 | 20 mm | 20 | 2.900 € (Werkbank) | 450 € | 4 × 8 | 2 Tage | 30 € | 11 € | 19 € |
| 2 Fächer | 60 | 25 mm | 23 | 3.000 € | 900 € | 5 × 2 | 2 Tage | 68 € | 23 € | 45 € |
| 3 Verbund | 110 | 30 mm | 26 | 3.600 € | 1.300 € | 8 × 1 | 3 Tage | 100 € | 39 € | 61 € |
| 4 Großverbund | 200 | 30 mm | 29 | 4.800 € | 1.800 € | 10 × 1 | 3 Tage | 150 € | 63 € | 87 € |
| 5 Monster | 500 | 25 mm | 32 | 8.500 € | 3.000 € | 5 × 1 | 3 Tage | 360 € | 140 € | 220 € |
(Stückkosten/DB für einen Entwurf mit Klasse-2-Effekten und Finale; Entwicklung + 30 € je Abschnitt. Stück je Karton aus der
Kartonwahl des Regals, `wbBox`.)

- **Stückkosten** = Schuss × Grundpreis je Schuss (0,30 → 0,20 €) × Effektklasse (1 / 1,2 / 1,45 / 1,75) × Kaliber (0,85 / 1 / 1,2)
  × Höhe (0,95 / 1 / 1,08) × Farbaufschlag + Verpackung + 0,15 € je Abschnitt.
- **Bewertung** 0–1 = 45 % Effektwert (Wow je Schuss, 1,0 Peonie … 1,86 Zeitregen) + 30 % Abwechslung (Effekte, Farbpaare,
  Muster; ein Abschnitt über 60 % ist eintönig) + 25 % Ablauf (Finale am Ende, Steigerung, Tempo-/Pausenwechsel, keine
  Mini-Abschnitte). Sterne = 1 + 4 × Bewertung.
- **Marktwert** = Referenz × (0,7 + 0,6 × Bewertung), **Nachfrage** (P.weight) = Gewicht der Stufe × (0,6 + 0,8 × Bewertung),
  **Hype** je Stück = Hype der Stufe × (0,8 + 0,4 × Bewertung). Ob gekauft wird, entscheidet wie bei jeder Ware der eigene
  Preis gegen den Marktwert (Preis-Ampel an der Werkbank).
- **Serie**: Mindestmenge, Vorkasse, ab 2× Mindestmenge −5 %, ab 4× −10 %, Lieferung nach 2–3 Spieltagen.

### Begründung (CLAUDE.md „Preise bestimme ich“, Finanzbildung)
- **Vergleich Kaufware** (Katalog gemessen): Einkauf = Ladenpreis / 2,2. Eigene Fertigung spart den Zwischenhändler:
  Stückkosten rund 70–80 % des Einkaufs gleich großer Kaufware, Spanne 1 : 2,4–2,9 statt 1 : 2,2. Teure Effekte kosten mehr
  und bringen über den Effektwert mehr Marktwert – der Deckungsbeitrag je Stück bleibt je Größe ähnlich, die Wahl ist Geschmack
  und Risiko, kein Trick.
- **Nachfrage gemessen** (16.10.): Gameplay-Vorführung (238 Sorten, ~78 Kunden am Tag): 109 Batterien in 3 Tagen über 47
  Batteriesorten = **~0,8 Stück je Sorte und Tag**, die eigene Beispiel-Batterie war mit ihren 2 Stück ausverkauft. Kleiner
  Laden (Werkbank-Test, wenige Sorten): 13 von 16 Stück an einem Tag. Planwert je eigene Batterie: **1–1,5 Stück am Tag**.
- **Amortisation**: Werkbank 2.900 € ↔ drei kleine Batterien × 1,5 × 19 € = ~90 € am Tag → 32 Tage (mit fünf 20 Tage).
  Stufen 2–5 ↔ zwei Batterien der Größe (1,3 / 1,1 / 0,9 / 0,7 Stück am Tag) → 25 / 27 / 27 / 25 Tage. Entwicklung ist nach
  15–29 Tagen Verkauf einer Batterie wieder drin (Break-even an der Werkbank: 29 / 23 / 23 / 22 / 15 Tage bei 3 ★).
- **Mindestmenge** = 2–3 Wochen Verkauf: genug, dass sich die Lieferung lohnt, wenig genug, dass kein Laden daran erstickt.
  Der Mengenrabatt (−5/−10 %) ist die bewusste Versuchung: wer viermal so viel fertigen lässt, spart 10 % auf die Serie und hat
  zwei Monate Ware (und Geld) im Lager – genau die Rechnung, die das Spiel zeigen will (Kapitalbindung gegen Stückpreis).
- **Alte zweite Zündstufe**: 16.500 € bezahlt, heute 3.000 € Stufe 2 → 13.500 € Erstattung (einmalig beim Laden).
- Snapshot: `node tools/fundament/wirtschaft-snapshot.js` mit `--schreiben` festgeschrieben (neue Ausbaupreise, WERKBANK-Probe).

## 3. Technik
- `src/parts/02d-werkbank.js` – Effekt-Katalog (`BRUCH` 34 Bruchbilder, `WB_LICHT` 15 Lichter mit genau einem Start je Rohr),
  Entwurf, Bewertung, Kalkulation, Drehbuch `wbShow` (Phasen der Batterie-Engine 14b, `verzoegerung` für Pausen),
  **Verdrahtung** `wbVerdrahtung`: jeder Abschnitt bekommt die nächsten Rohrreihen; Schuss i nimmt das freie Rohr, dessen
  Lage am besten zum Musterwinkel passt, und das Rohr steht in genau diesem Winkel (04c `p.folgeVon`, `p.rohrNeig`) – so
  läuft ein Fächer wirklich über die Batterie, jedes Rohr feuert einmal (R2/R3). Produkt (`P[id].werk`, Linie Hausmarke),
  Serien (`wbTick` täglich → `pending` → LKW), Altbestand, Migration.
- `src/parts/06c-werkbank.js` – Werkbank in der Welt (`bk.werkbank`, 04z), Trefferfläche, Tablet-Bild.
- `src/parts/17h-werkbank.js` – Oberfläche (Start, Bauprogramm, Produkt), Vorschau (`wbVorschauStart`, `wbVsStep` statt
  `step` in 20-loop: nur Zeitgeber, Feuerwerk, Schnee, Licht; `todUhr` ≥ 22 Uhr), Bestellmenü-Karten.
- Gelöscht: `02d-rezeptur.js`, Laptop-Rezeptur (`renderRezeptur`, `rezProto`, `rezBauen`, Reiter „Entwicklung“),
  `abProtoZuenden`, die Rezeptur-Zündung in 14b `igniteType`, Rezeptur-Zweige in 04c/05d.

## 4. Migration alter Spielstände
- Batterie-Rezepturen (12 Schuss) → eigene Batterie Stufe 1 (25 Schuss, gleiche ID, Bruchbild und Farben, Finale), ohne
  neue Entwicklungskosten. Raketen-, Kugel- und Fontänen-Rezepturen entfallen; ihr Bestand bleibt als **Altbestand**
  verkaufbar (nicht nachbestellbar) und verschwindet, wenn er weg ist.
- Alte „Zweite Zündstufe“ (labor2, 16.500 €) ist jetzt die 60-Schuss-Stufe; die Differenz zum neuen Preis wird erstattet
  (`WIRT.historie.erstattung.labor2`). Werkbank-Besitzer ohne Lagererweiterung 1 bekommen sie dazu (die Werkbank steht dort).
- Einmalige Meldung beim Laden.

## 5. Tests und Messung
- `src/tests/werkbank.js` (neu, ganzer Ablauf: kaufen → Werkbank im Lager ansprechen → Bauprogramm → Vorschau mit echter
  Engine → Name/Verpackung → Kalkulation → Entwickeln → Lieferung nach 2 Tagen → Regal → Verkauf → Nachbestellen →
  Migration eines alten Spielstands → Handy-Ansicht): **ALLES OK** (835 s). Bezahlt = Soll 853,28 € (Entwicklung 540 €
  + 4 Kartons Serie), Migration erstattet 13.500 €.
- `gameplay` ALLES OK (Prüfung EIGENE_MARKE: Beispielbatterie „Nordlicht“ wird gezeigt und verkauft),
  `abschussregel` ALLES OK (5 Werkbank-Vorschauen 25…500 Schuss: jeder Schuss aus einem Rohr, 500 Starts/500 Rohre),
  `verpackung` MANGEL keine, `ausstellung` ALLES OK, Laufzeit-`waechter` ALLES OK (Budget eingehalten, MAT-Wache 0),
  `node tools/fundament/waechter.js` ALLES OK (Wirtschafts-Snapshot neu geschrieben, Ausnahmeliste 17-laptop CSS 517 → 484 Stellen).
- **Leistung Monster 500** (`src/tests/werkbank-leistung.js`, schwerster Entwurf: Kometenkrone, Brokat, Zeitregen,
  Kronleuchter, Kamuro-Finale, großes Kaliber; Vergleich Ragnarök 409 Schuss, gleiche Kamera, swiftshader):

  | Stufe | Bild p95 Monster | Bild p95 Ragnarök | Logik p95 | Partikel max |
  |---|---|---|---|---|
  | hoch, ohne Budget | 3200 ms | 2455 ms (+30 %) | 2,0 / 3,8 ms | 9077 |
  | hoch, mit Leuchtlast | 2863 ms | 2407 ms (+19 %) | 1,9 / 3,9 ms | 7789 |
  | Ultra Low, ohne Budget | 592 ms | 361 ms (+64 %) | 1,5 / 2,6 ms | 2625 |
  | Ultra Low, mit Leuchtlast | 459 ms | 371 ms (+24 %) | 1,4 / 2,5 ms | 2299 |

  Grenze: höchstens 25 % über dem größten Kaufverbund. Die ms sind CPU-Zeichnen (swiftshader), kein PC-Wert; der
  Vergleich zählt. **Leuchtlast** (`WB_LAST`, 02d): Takt × Effektklasse × Kaliber je Abschnitt; über dem Budget werden
  die Sterne des Abschnitts kleiner (Faktor √(Budget/Last), mindestens 0,7). Das Bauprogramm zeigt das als Hinweis am
  Abschnitt. Ultra Low liegt damit knapp unter der Grenze.
- Bilder: `werkbank.jpg`, `werkbank-lager.jpg`, `bauprogramm.png`, `vorschau-tisch.jpg`, `vorschau.jpg`,
  `vorschau2.jpg`, `produkt.png`, `regal.jpg`, `handy-bau.png`, `handy-produkt.png` (alle in diesem Ordner).

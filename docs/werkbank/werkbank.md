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

## 2. Größen und Zahlen (alle in `WIRT.werkbank`, 01c)
| Stufe | Schuss | Kaliber | ab Level | Ausbau | Entwicklung | Mindestmenge | Lieferung | Marktwert bei 3 ★ |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 Kompakt | 25 | 20 mm | 20 | 5.200 € (Werkbank) | 900 € | 10 Kartons à 6 | 2 Tage | 30 € |
| 2 Fächer | 60 | 25 mm | 23 | 3.600 € | 1.500 € | 8 à 4 | 2 Tage | 68 € |
| 3 Verbund | 110 | 30 mm | 26 | 5.800 € | 2.400 € | 12 à 2 | 3 Tage | 100 € |
| 4 Großverbund | 200 | 30 mm | 29 | 8.200 € | 3.600 € | 15 à 1 | 3 Tage | 150 € |
| 5 Monster | 500 | 25 mm | 32 | 12.500 € | 6.000 € | 6 à 1 | 3 Tage | 360 € |

- **Stückkosten** = Schuss × Grundpreis je Schuss (0,30 → 0,20 €) × Effektklasse (1 / 1,2 / 1,45 / 1,75) × Kaliber (0,85 / 1 / 1,2)
  × Höhe (0,95 / 1 / 1,08) × Farbaufschlag + Verpackung + 0,15 € je Abschnitt. Entwicklung zusätzlich 40 € je Abschnitt.
- **Bewertung** 0–1 = 45 % Effektwert (Wow je Schuss, 1,0 Peonie … 1,86 Zeitregen) + 30 % Abwechslung (Effekte, Farbpaare,
  Muster; ein Abschnitt über 60 % ist eintönig) + 25 % Ablauf (Finale am Ende, Steigerung, Tempo-/Pausenwechsel, keine
  Mini-Abschnitte). Sterne = 1 + 4 × Bewertung.
- **Marktwert** = Referenz × (0,7 + 0,6 × Bewertung), **Nachfrage** (P.weight) = Gewicht der Stufe × (0,6 + 0,8 × Bewertung),
  **Hype** je Stück = Hype der Stufe × (0,8 + 0,4 × Bewertung). Kauf entscheidet wie bei jeder Ware Preis gegen Marktwert.
- **Serie**: Mindestmenge, Vorkasse, ab 2× Mindestmenge −5 %, ab 4× −10 %.

### Begründung (CLAUDE.md „Preise bestimme ich“, Finanzbildung)
_wird nach der Messung ergänzt_

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
_wird ergänzt_

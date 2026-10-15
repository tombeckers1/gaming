# Licht und Schatten innen – Licht-Paket 15.10.2026

Toms Auftrag (15.10.): „Licht und Schatten grundlegend überarbeiten. Auf der Verkaufsfläche glänzt der Boden so komisch.
Wenn man durch die Räume läuft, ist es immer so dunkel, und wenn man in eine bestimmte Richtung geht, wird es hell – muss
gleich ausgeleuchtet sein. Am Bild (Supermarket Simulator, `licht-referenz-1510.jpg`) nur Licht und Schatten: gutes,
helles Licht im Laden, gute Schatten. Keine Unreal-Grafik.“

## Ursachen (im Code gefunden, gemessen)
1. **Augenanpassung** (05p, seit 10.10.): Belichtung drinnen 0,74 statt 1,05, dazu in der Bildzusammenführung ab Mittel
   `pow(col, 1,2)` – beides umgeblendet nach `unterDach(Kamera)`. Räume wirkten dunkel, an jeder Tür sprang die Helligkeit.
2. **Wandernde Innenlichter** (03-scene/20-loop): das Innenlicht waren 1–3 Punktlichter (12,5 m Reichweite), die alle
   0,18 s auf die Leuchten **2,5 m vor dem Blick** des Spielers umgesetzt wurden – Drehen verschob das Licht, Ecken ohne
   Licht blieben dunkel. Nachts fiel das Himmelslicht auf 0,16 → fast nur noch diese Lichter (Lager nachts Bildmittel 32/255).
3. **Ladenstrahler** (03-scene): ein Spot mit Schattenkarte mitten im Basisladen – nachts heller Fleck, Schatten
   strahlenförmig von einem Punkt, in Ost/Süd/Lager nichts.
4. **Glanz**: Glanzbahnen (05p, Spiegelbild der Leuchten, zum Betrachter gezogen – wanderten mit), Bodenrauheit 0,18–0,5
   mit Umgebungsbild bis 0,6; ab Maximum Rauheit halbiert und Spiegelung ≥ 1,0, Lackschicht 0,75–1.

## Was jetzt gilt
- **Belichtung fest `LI_BEL` = 1,05** drinnen wie draußen; keine Innen-Abdunklung mehr (Feuerwerk/Nacht unverändert).
- **Raumlicht im Shader** (`RAUM`, 05p): `THREE.ShaderChunk.lights_fragment_begin` und `lights_lambert_vertex` werden beim
  Laden ergänzt. Jede Fläche rechnet ihre Weltlage gegen bis zu 24 Raumkästen (aus `dachBereiche()`: dieselben Räume,
  Zonen und Ausbaustufen wie Dach/Schnee; Rand 6 cm – Wandinnenseite gehört dazu, Außenseite nicht). Drinnen:
  gleichmäßiges Deckenlicht (oben 100 %, seitlich 85 %, unten 70 %), Himmelslicht nur zu 20 % (Tageslicht durch Fenster),
  Sonne nur durch die Schattenkarte (Sonnenflecken an Schaufenstern/Toren), ohne Schattenkarte drinnen aus. Flächen ohne
  Umgebungsbild spiegeln einen gleichmäßig hellen Raum (Metall bleibt Metall). Werte über `raumL` (Vector4-Liste, von three
  je Material flach kopiert – die Vektoren sind geteilt, ein Setzen wirkt überall). Kein Zeichenaufruf, keine Lichtquelle.
- **Deckenlicht mit Schatten** (`DECKE`, ab Mittel): ein Richtungslicht 17° aus der Senkrechten (Schatten fallen zur
  Straßenseite, also zum Spieler, der vom Eingang hereinschaut), 3,3 m hoch, Schattenkarte 32 × 32 m um den Spieler
  (2-m-Raster, flimmert nicht), Größe = Stufen-Schattenkarte (max. 2048), weich (Radius × 1,6), neu gezeichnet jedes
  2. Bild. Wirkt nur drinnen (Shader erkennt es an der Richtung). Decken/Dächer liegen darüber und werfen nichts.
  Verhältnis Raumlicht 0,4 : Deckenlicht 0,65 → Schatten am Boden ~60 % dunkler. Nur angelegt, wenn das Spiel ab Mittel
  startet; auf Niedrig übernimmt das Raumlicht seinen Anteil (gleich hell). Halle und Werk werfen bewusst keine Schatten
  (castShadow aus, Etappe A/B) – dort nur Kontaktschatten.
- **Boden** über `MAT.bodenGlanz(belag)`: Rauheit 0,6 + 0,3 × rau (≤ 0,9), Spiegelung ≤ 0,12, Pracht-Lack ≤ 0,12 und
  unscharf (0,35). Gilt für jeden Belag, auch Marmor.
- **Kontaktschatten** kräftiger (Deckkraft 0,66–0,86, Personen 0,72, breiterer dunkler Rand) und jetzt auf **allen** Stufen
  (ein Zeichenaufruf) – auf Niedrig/Ultra Low der einzige Schatten.
- **Ultra Low** (Lambert): Raum-Entscheidung je Pixel im ergänzten Lambert-Shader (Weltlage als Varying über `modelMatrix` –
  three lädt `cameraPosition` für Lambert nicht hoch; je Ecke blieben große Bodenplatten über mehrere Räume dunkel).
- **Entfernt:** 3 wandernde Punktlichter, Ladenstrahler (+ Schattendurchgang), Lichtflecken, Glanzbahnen, Augenanpassung.
- Stilregeln §8 entsprechend neu.

## Messung (tools/licht/bilder.js, Gameplay-Vorführung aufgebaut, 1280 × 720, swiftshader)
Zeichenaufrufe je Bild (inkl. Schattenkarten und Bildeffekte), Ansichten Laden vom Eingang / Lager / Halle / Werk:

| Stufe | vorher | nachher | Bildzeit swiftshader (nur Vergleich, schwankt ±15 %) |
|---|---|---|---|
| Ultra Low | 1824 / 1898 / 808 / 3271 | 1823 / 1909 / 815 / 3174 (+1 Kontaktschatten) | Szene gleich; Werk-Ansicht in 2 von 3 Läufen +20 % (siehe offen) |
| Niedrig | 1856 / 1938 / 834 / 3239 | 1850 / 1932 / 834 / 3237 | 25,5→22,4 s · 14,3→12,4 · 13,5→11,4 · 34,9→31,4 (schneller) |
| Mittel (6 Bilder) | 2754 / 2808 / 1497 / 3789 | 2831 / 2901 / 1485 / 3750 | gleich (±3 %) |
| Hoch | 4257 / 4355 / 2742 / 4609 | 3919–4058 / 4168 / 2399 / 4232–4396 | gleich; Dreiecke 28,3 → 23,9 Mio. (−16 %) |

Hoch: weniger, weil Ladenstrahler-Schattenkarte und 3 Punktlichter weg sind; das Deckenlicht zeichnet seine Karte nur jedes
2. Bild. Laufzeit-Wächter (Budget je Ansicht inkl. Schattenpass): grün.

Helligkeit (Bildmittel 0–255, Hoch, Gameplay-Vorführung), nachts: vorher Laden 72–137, Lager 36, Halle 47, Werk 60, Versand 65 →
nachher Laden 155–157, Lager 96, Halle 115, Werk 129, Versand 117 (Unterschiede = Inhalt: braune Kartons, dunkle Regale).
Tagsüber reines Weiß < 1 % in allen Ansichten. Ultra Low nachts vorher 32–92 → nachher 111–180.

Springen beim Drehen/Gehen: siehe Test `licht.js` (DREHEN: Beleuchtung im Einheitsmaterial, 12 Blicke je Ort, Tag/Nacht);
Zahlen im Bericht. Der lange Helligkeits-Lauf (`bilder.js lauf`) bricht auf Hoch an der Speichergrenze ab (ein langes evaluate
mit Hunderten Bildern lässt den Browserprozess wachsen) – nur Ultra Low vorher gemessen; später in Stücken (H.stuecke) bauen.

## Bilder
`docs/bilder/licht-1510/` – `<ansicht>-<tag|nacht>-<stufe>-<vorher|nachher>.jpg` für Laden vom Eingang und von der Kasse
(erhöht wie das Referenzbild), Gang, Laden Ost, Laden Süd, Lager, Versand, Halle, Werk; Hoch und Ultra Low.

## Grenzen / offen (später)
- Das Raumlicht kennt nur Rechtecke aus `dachBereiche()`; ein neuer Raum ohne Dach-Eintrag bleibt draußen-hell (Regel in
  stilregeln §8). Schräge/runde Räume gibt es nicht.
- Ultra Low rechnet je Ecke (Lambert): Flächen, die über eine Raumgrenze reichen, mischen innen/außen.
- Deckenlicht-Schatten nur 32 × 32 m um den Spieler; dahinter nur Kontaktschatten (in der Ferne kaum sichtbar).
- Halle-Boden auf Ultra Low dunkel (Textur der Stufe, auch vorher so) – nicht Licht, eigener Schritt.
- Ultra Low Bildzeit Werk: im swiftshader-Vergleich teils +20 % (Raum-Entscheidung je Pixel im Lambert-Shader + Kontaktschatten);
  auf echter Grafikkarte prüfen (Tom). Falls nötig: Raum je Ecke + Unterteilung großer Bodenplatten.
- Wandstreifen: das geneigte Deckenlicht lässt an Wänden zur Straßenseite einen ~1 m breiten weichen Schattenstreifen.
- Sonnenflecken nur ab Mittel (Schattenkarte); Halle/Werk werfen keine Schatten (castShadow aus) – nur Kontaktschatten.
- Helligkeits-Lauf in Stücken neu bauen (siehe oben).

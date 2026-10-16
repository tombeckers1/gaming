# Leistungsbericht im Spiel (Fundament Schritt 5, 16.10.2026)

**Für Tom:** Esc → **Leistung messen**. Zwei Knöpfe:
- *Mein Spielstand*: misst dein Spiel, wie es jetzt ist. Orte, die du noch nicht gebaut hast, werden übersprungen.
- *Vollausbau*: baut die Gameplay-Vorführung auf (alles gebaut, Kunden, Personal) und misst darin – der Schwerlast-Fall. Dauert wegen des Aufbaus länger.

Haken „Alle Grafikstufen nacheinander“ misst Niedrig bis Ultra Extrem hintereinander (ca. 10 Min; Ultra Low nur, wenn es schon gewählt ist – Wechsel dorthin braucht Neustart). Esc bricht ab (Teilergebnis).
Route: Laden, Kasse, Halle Süd, Lager, Hochregal, Werk, Straße, Hof je 10 s, Feuerwerk über dem Testfeld 20 s (Nacht). Danach Tabelle, **Bericht kopieren** (Zwischenablage; sonst wird der Text markiert) und an Claude schicken.
Danach lädt das Spiel neu (Knopf „Neu laden und weiterspielen“); der Spielstand ist unverändert, weil während der Messung nicht gespeichert wird (`LM.an`/`LM.halt` in `save()`; im Vollausbau sichert die Vorführung selbst).

## Was gemessen wird (Code: `src/parts/17g-leistung.js`)
| Spalte | Bedeutung |
|---|---|
| Bilder/s, 1 % tief | echte Bildabstände der Spielschleife (ohne die ersten 1 s am Ort); 1 % tief = Mittel der langsamsten 1 % der Bilder |
| Bildzeit, Spitze | mittlerer / größter Abstand zweier Bilder |
| CPU/Bild | Zeit, die das Spiel je Bild rechnet und Zeichenbefehle schickt. Weit unter der Bildzeit = Grafikkarte (oder Bildschirm) bremst; nahe dran = Prozessor |
| Zeichenaufrufe, Dreiecke | `renderer.info.render` je Bild, über alle Durchgänge (Schatten, Szene, Bildeffekte) summiert |
| Geometrien, Texturen | `renderer.info.memory` |
| Heap MB | `performance.memory` (nur Chrome/Edge, grob gerundet), sonst „–“ |
| Ankunft ms | Ruckler beim ersten Blick an den Ort (Shader/Texturen hochladen): größere Zahl aus Rechenzeit des 1. Bilds und Abstand zum 2. |
Kopf: GPU-Name (`WEBGL_debug_renderer_info`, falls erlaubt), WebGL-Version, Kerne, Browser, Fenster, Skalierung, Grafikstufe, Auflösungsfaktor, Rendergröße (pixelRatio).
Je Stufe: **Texturspeicher (Schätzung)** = alle Texturen der Szene, die schon auf der Grafikkarte liegen, Breite × Höhe × 4 Byte mit Mip-Stufen; ohne Zwischenpuffer, also eine Untergrenze.

## Prüfpunkte aus der Übergabe
- *Vorführung hält ~1,3 GB Texturen?* → Messung „Vollausbau“, Zeile „Prüfpunkt“ im Bericht (Schätzung, s. o.).
- *Speicherspitze beim ersten Laden-Bild* → Spalte „Ankunft ms“ + JS-Heap am Ort. **Nicht messbar** aus der Seite: Prozess- und Grafikkartenspeicher (steht dann im Bericht).

## Grenzen (ehrlich)
- Stufenwechsel zur Laufzeit: Texturschärfe, Funkenmenge, Spiegelungen/Relief ab Maximum gelten erst nach Neustart; Auflösung, Schatten, Kantenglättung, Bildeffekte sofort. Die Zahlen der höheren Stufen sind daher eine Näherung; wer es exakt will, stellt die Stufe ein, startet neu und misst nur diese.
- Bildrate ist durch den Bildschirm gedeckelt (60); 144-Hz-Schirme zeigen mehr.
- Feuerwerk: reine Effektaufrufe (Kugelbomben Kaliber 4–5, Rakete alle 2,5 s), kein gezündetes Produkt – also kein Hype, keine Kosten, und der Wächter FEUERWERK bleibt grün.
- Keine Wirtschaftszahl; Messwerte stehen nicht in `WIRT`.

## Test
`BB_LOCK=… sh tools/test/lauf.sh leistungsbericht` (Arbeitsordner mit real.html). Prüft: alle 9 Orte × 2 Stufen mit Werten, Stufe/Pose/Zähler zurück, Spielstand (localStorage) unverändert auch bei `save()` während und nach der Messung, Abbruch (Knopf, Esc), Kopieren (Zwischenablage + Markierfeld), Bedienbarkeit (`HANDY=1`: 390×844), `GEGENPROBE=1` (Sperre ausgehebelt → Test muss anschlagen), `VOLL=1` (zusätzlich Vollausbau).

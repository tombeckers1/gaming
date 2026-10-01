# Realistische Batterien (01.10.2026)

| # | Punkt | Stand | Begründung / Nachweis |
|---|-------|-------|-----------------------|
| 1 | Batterie als 3D-Modell auf dem Zündtisch, bleibt bis abgebrannt | erledigt | Eigenes Modell je Stück (`batterieModell`), wird erst nach letztem Schuss + Nachrauch entfernt. Test `rohrvarianten.js` (TISCH). |
| 2 | Echte Röhren, Anzahl = Schusszahl der Packung | erledigt | Geschlossene Röhren als 3D-Geometrie, Anzahl = Schuss für alle 46 Batterien (`rohre.js`, ANZAHL). Bodeneffekte (Fontänen) kommen aus eigenen Fontänen-Modulen vorn an der Batterie, nicht aus Schussröhren. |
| 3 | Jeder Schuss aus seiner Röhre, feste Folge, 0,2–0,4 s, leichter Winkel, Mündungsblitz, Rauchwölkchen | erledigt | Zündschnur läuft fest in Schlangenlinie; Abstand 0,2–0,4 s (Test TAKT, Gegenprobe mit 0,8 s schlägt an); Röhren spaltenweise geneigt (Batterie ≤ 0,3 rad, Fächer ≤ 0,6 rad) + 3° Streuung; Blitz und Rauch je Schuss. Folge: gleichzeitige Salven gibt es nicht mehr. Bildmuster (Herz, Bogen) zielen weiter auf ihren Punkt. |
| 4 | Abgefeuerte Röhren verkohlen, Nachrauchen | erledigt | Röhre wird beim Schuss dunkel (Test KOHLE), danach ca. 3 s Rauch (Test RAUCH). |
| 5 | Vier neue Varianten | erledigt | Farbreihen 25 (5×5, einfarbig, 18,99 €), Konfetti 49 (7×7, Farbmix, 36,99 €), Stakkato 100 (10×10, schnell, 69,99 €), Pfauenschweif 30 (Fächer 6×5, 39,99 €). Eigene Verpackung, eigene Effekte, bestellbar nach Lizenz ihres Levels, einräumbar (Test `rohrvarianten.js`). |
| 6 | Alle vorhandenen Batterien umgestellt | erledigt | Alle 42 vorhandenen Batterien (inkl. eigener Rezeptur) laufen über Röhren, Zündfolge und Verkohlen. |
| 7 | Raketen einzeln aus Abschussrohr auf dem Tisch | erledigt | Abschussröhren stehen jetzt auf einem Stahltisch (Fußplatte, Schelle), je Rohr eine Rakete; Stab kürzer, hängt im Rohr. Vorführungs-Anlage ebenso. |
| 8 | Performance, weniger Partikel auf „niedrig“ | erledigt, mit Einschränkung | 100 Schuss: Spiellogik im Mittel 2,4–2,8 ms je Bild, keine Shader-Neuübersetzung; auf „niedrig“ 31 % weniger Partikel und 55 % weniger Rauch (Test `rohrleistung.js`). Einschränkung: gemessen mit Software-Grafik im Test, nicht auf echter Hardware; einmalige Spitze ca. 40 ms beim Zünden, beim ersten Aufstellen einer großen Batterie ca. 0,2 s Aufbau. |

# Große Halle (Plan v7) ins Hauptspiel einhängen

Stand 10.10.2026, Branch `claude/halle-v7`. Die Halle läuft heute als eigener Modus
(Startbildschirm → „Große Halle“, oder `boellerbude.html#halle`). Dieses Blatt sagt,
wie ein späterer Agent sie ins Spiel holt (Plan-Phase 1 „Ladebildschirm“).

## Dateien
| Datei | Inhalt |
|---|---|
| `src/parts/30-halle-basis.js` | Maße `HV7` (aus `LAY`, `LHALLE`, `WRAMPEN`, `LAGER_H` …), Zustand `HALLE`, Texturen, Materialien `HVM`, Sammler (verschmilzt je Material), Instanzen, Schnittstelle |
| `30-halle-gebaeude.js` | Hülle 11 m, Binder, Lichtbänder, Leuchten, Boden mit eingebranntem Schatten/Licht, Markierungen, Kartonlager ③, gelbe Wand + N1, Schleuse 13 m, Tore, Produktionshülle, Bunker, Rohstofflager, Leitstand |
| `30-halle-hochregal.js` | 3 Gassen × 180 Plätze, Regalbediengeräte (animiert), I/O-Förderer, Anbruch, Westende-Förderer aus der Produktion |
| `30-halle-produktion.js` | 3 Straßen (Raketen, Kugelbomben, Batterien) mit Bühne, Portalen, Rohr-Raster, Palettierroboter |
| `30-halle-ausstattung.js` | Wareneingang, Schnellplätze, Packmaterial, Laptop, Kollision der Einbauten |
| `30-halle-modus.js` | nur der eigenständige Modus: Startauswahl, Ladeschirm, Licht, Bewegung, Menü, `window.__halle` |
| `src/tests/halle.js`, `halle-start.js` | Prüfungen (Maße, Kollision, Aufwand; Startauswahl und Rückweg) |

## Schnittstelle
```js
hallLaden(opts, fortschritt(anteil,text), fertig)  // in Schritten, je Schritt ein Bild Pause
hallBauen(opts)        // alles auf einmal
hallAbbauen()          // Szene, Kollision, Geometrien, Texturen weg
hallSichtbar(v)        // ein-/ausblenden samt Kollision
hallTick(dt)           // Animation (Roboter, Bänder), HALLE.animAn schaltet sie
hallMessen()           // {bereich:{draw,tri}} - gezählt, Instanzen × Anzahl
```
`opts.umfeld=true` baut zusätzlich Lager ①/② als Hülle mit Regalen, R1/V1, Boden draußen
und Hof. **Im Hauptspiel `umfeld:false`**, dort stehen diese Teile schon.
Alles hängt unter `HALLE.g` (eine Gruppe, `userData._bnd`, damit das Bündeln in 03b sie in
Ruhe lässt), je Bereich eine Untergruppe `HALLE.bereiche[name]`. Kollisionen liegen in
`HALLE.cols` und werden in `colliders` ein-/ausgetragen.

## Schritte zum Einhängen
1. **Hallenstufe 3 ersetzen:** `logiStufeBauen(2)` (05m) baut heute Wände/Dach der 11-m-Halle.
   Beim Kauf von `lager_west3` stattdessen `hallLaden({umfeld:false},…)` aufrufen und die
   Gruppe von Stufe 3 ausblenden. Stufen 1/2 bleiben, aber laut Plan endet Stufe 1 (`LAY.lw1`,
   heute bis z −14) künftig an der gelben Wand bei z −17, weil ③ die Ecke x −36…−26 / z −17…−7 nimmt.
2. **Tore:** v7 hat in der Halle nur R2–R4 = `WRAMPEN[0..2]`; die Produktion R5 (x −74, Ausgang)
   und R6 (x −92, Eingang). Heute gibt es noch Tor 5 bei x −57,5 (`WRAMPEN[3]`, Docks/LKW in
   11e/05h). Entscheidung Tom offen (siehe Bericht). Die Hallentore aus 30-gebaeude sind nur
   Innenansicht; die LKW-Andockung (`westTor`, `WTORE`, `wbays`) bleibt die des Hauptspiels –
   dann in `hvToreBauen` die Tore R2–R4 weglassen (Überladebrücken behalten).
3. **Schleuse und Lager:** Die alte Schleuse (`LAY.schleuse`, z −24…−17, Durchbruchwand in 05m)
   abbauen; 30-gebaeude baut die neue (z −29,9…−17, Durchgang z −26,9…−23,1 mit
   Streifenvorhang, zu Lager ② offen z −21,6…−17,2). Bereich ③ (x −36…−19,9 / z −17…−7)
   gehört dann zum Lager: Zone in 05h anlegen, Wände zwischen ①②③ fallen (Plan: ein Raum),
   `UMBAU_RAUM` (15-player) und `dachBereiche` (20-loop) um ③ und die Produktion ergänzen.
4. **Wegenetz:** `NAV` (10-customers) beginnt bei x −67; für die Produktion bis x −101,6
   erweitern (sonst klemmt `collide` den Spieler ab). Im Modus übernimmt das `SPIEL_RAUM`.
5. **Laden beim Betreten (Phase 1):** Solange die Halle nicht gebaut ist, sind Durchgang
   Schleuse und N1 zu (Tor/Wand). Nähert sich der Spieler auf ~6 m, Ladeschirm aus
   `hmLadeschirm()` zeigen, `hallLaden` laufen lassen (heute 0,6–0,8 s, bei „Maximum“ mit
   Pracht ~7 s im Software-Renderer), danach Tor auf. Optional `hallSichtbar(false)`, wenn der
   Spieler weit weg im Laden ist, und umgekehrt Stadt/Straße ausblenden, solange er in der
   Halle ist (Wände verdecken sie, three zeichnet sie trotzdem).
6. **Licht:** Leuchten stehen in `HALLE.lampen` ({x,y,z}). Im Spiel in `LAMPEN` eintragen
   (mit Zone `lager_west3`); `innenLichter` reichen nur 12,5 m – für die 10-m-Leuchten wie im
   Modus Reichweite ~24 m setzen, solange der Spieler in der Halle ist (`hmLicht`). Boden hat
   AO- und Lichtkarte eingebrannt, das Deckenlicht mit Schatten (`HM.deckenLicht`) ist nur im
   Modus; im Spiel übernimmt die Sonne bzw. `sun` muss in der Halle gedimmt werden.
7. **Takt:** `hallTick(dt)` aus `step()` aufrufen.
8. **Kapitel:** heute wird alles gebaut. Für Kapitel 7.3/8/9 einzelne Bereiche ausblenden:
   `HALLE.bereiche.strasse_kugeln.visible=false` usw. (Gassen sind ein Bereich – bei Bedarf
   `hvHochregalGasse(k)` nur für freigeschaltete Gassen aufrufen).
9. **Spielablauf** (Lagerist, Anbruch, Einlagern, Produktion) kommt erst nach dem
   Produktionskonzept mit Tom. Positionen dafür stehen in `HV7` (I/O, Anbruch, Schnellplätze,
   Wareneingang-Raster je Tor 2×3, Gassenmitten, Strassen-z).

## Aufwand (gemessen, swiftshader, 1280×720, Ansicht am Eingang)
| Stufe | Halle gesamt (gezählt) | im Bild inkl. Schatten |
|---|---|---|
| Ultra Low | 263 Aufrufe, 154 Tsd. Dreiecke | 233 Aufrufe, 153 Tsd. |
| Niedrig | 263 / 161 Tsd. | 233 / 160 Tsd. |
| Mittel | 264 / 214 Tsd. | 237 / 212 Tsd. |
| Hoch | 272 / 214 Tsd. | 337–413 / 274–324 Tsd. |
| Maximum | 272 / 214 Tsd. | 550–650 / 490–535 Tsd. (Spiegel + Schatten) |

Optik-Ausbau 10.10. (RBG-Fachwerkmast, Schaltschrank, Energiekette, Teleskopgabel 2-stufig;
Maschinen mit Eckprofilen, Lueftungsgittern, Bedienpult/Not-Aus, Signalsaeule, Kabeltrasse, Ventilinsel;
Paneel-/Sockeltextur mit Schmutz; Leitstand-Waende): Hoch 272 → 281 Aufrufe, 214 → 238 Tsd. Dreiecke gesamt
(+9 Aufrufe = je RBG Kettenschlaufe, Mittelstufe der Gabel, Leuchte am Hubwagen). Kleinteile (Leiter, Lueftungsgitter, Pneumatik) nur bei `hvQ().fein`, Fachwerk sonst grober.
Bilder: `docs/bilder/halle/rbg-*.jpg`, `produktion-maschinen-detail.jpg`, `hochregal-stirnseite-wand.jpg`.

Bauzeit 0,6–0,8 s (ohne Pracht). Echte FPS auf Toms PC sind ungemessen.

## Fallstricke (schon gelöst, nicht wieder einbauen)
- three r128 setzt `InstancedMesh.frustumCulled=false`. `hvInst` gibt jeder Instanzgruppe eine
  eigene Hüllkugel und schaltet die Sichtprüfung wieder ein (vorher wurde das ganze Hochregal
  auch hinter der Brandwand gezeichnet).
- Kartonladungen bestehen nur aus Außenflächen (−70 % Dreiecke); Regalpaletten sind eine
  vereinfachte Palette und werfen keinen Schatten (der Bodenschatten ist eingebrannt).
- Materialien mit `vertexColors` nie für Instanzen ohne Farbattribut nehmen (wird schwarz).

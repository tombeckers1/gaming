# Fassade, Sockel, Attika und Hofleuchten (Fundament-Schritt 2, 16.10.2026)

Toms Auftrag (`docs/uebergabe/fassade-0910.md`, Fotos `fassade-0910-hof.jpg`, `fassade-0910-wand.jpg`): Außenfassade aller eigenen
Gebäude deutlich stärker – echte Paneele statt „flacher Platten mit Punkten“, Sockel wie eine echte Wand (Beton, Struktur, Schmutz,
Abschlussprofil), Attika/Dachrand, saubere Ecken, Regenrinnen/Fallrohre; Hof- und Mastleuchten neu (Mast mit Fuß/Flansch, Ausleger,
LED-Kopf mit Gehäuse), nachts sichtbar. Branch `claude/fassade` (ab V139 / e5da0a6).

Die Fotos zeigen den alten Stand im Spiel: Paneele 1,18 × 1,18 m mit dunklen Nietpunkten, ein schwarzes Sockelband (in die
Textur gemalt), ein 25 cm dicker schwarzer „Balken“ als Dachrand und als Hofleuchte ein Kasten auf einer Stange.

## 1. Was jetzt gilt (Standard-Optik)

| Teil | Bauweise | Maße | Material (`MAT`) | Bauteil |
|---|---|---|---|---|
| Fassade (Laden, Erweiterungen, Lager, Verbindungsbauten, Versandecke) | weiße Sandwichpaneele quer, Nut-Feder-Fuge mit Schattenkante, Mikrolinierung, Stoßprofil Alu alle 6 m mit Schrauben, an der Zwischenstütze (3 m) zwei Schrauben je Paneel, Laufspuren, leichte Wolkigkeit | Deckbreite 1,0 m, Kachel 6 × 2 m, UV in Metern | `wandFassade` (Textur `fassade` 1024 × 256) | `bk.wand` Fläche `fassade` |
| Hallen (Halle West, Werk West, Logistik-Stufen) | Trapezblech wie bisher, neu: Schraubreihe je Riegel im Untergurt, Laufspuren, Wolkigkeit | Sicke 0,4 m, Riegel 1,6 m, Kachel 3,2 × 1,6 m | `wandBlech` (Textur `trapezblech` 256 × 128) | `bk.wand` Fläche `blech` |
| Sockel / Spritzschutz | Betonsockel 5 cm vor der Wand: Poren, Körnung, Fuge alle 2 m, Spritzschmutz unten (Verlauf + Spritzer bis 30 cm), Schatten unter dem Profil | 0,5 m hoch, Kachel 2 × 0,5 m | `sockelAussen` (Textur `sockelBeton` 256 × 64) | automatisch in `bk.wand` (Aussenhaut), sonst `bk.sockelleiste({art:'aussen'})` |
| Sockelabschlussprofil | Tropfkante Alu auf dem Sockel | 4 cm hoch, 8 cm vor der Wand | `wandLaibung` (Aluminium matt) | automatisch |
| Eck-/Stoßprofile | Alu-Profil an beiden Enden jeder Außenfläche (an Ecken Eckwinkel, in der Flucht Stoßprofil, an Öffnungen Laibungskante) | 6 cm breit, 1,8 cm stark | `wandLaibung` | automatisch |
| Attika / Dachrand | Aufkantung mit den Fassadenpaneelen (Paneele laufen von der Wand weiter), Attikablech Graphit mit 4 cm Überstand (Tropfkante), Dachhaut dunkel | 0,45 m (Ladenzeile 0,3 m), Blech 5 cm | `wandFassade`, `lackGraphit`, `anthrazitMatt` | `bk.dachrand` |
| Fallrohre | Rinnenkessel unter der Attika, Rohr Ø 10 cm, Schellen alle 2 m mit Halter, Standrohr unten | Abstand 9 cm zur Wand | `lackGraphit` | `bk.dachrand({fallrohre})` |
| Mastleuchte | Fußplatte 34 × 34 cm mit Flansch, 4 Ankerbolzen mit Muttern, Mastfuß mit Rippen, konischer Rundmast mit Revisionstür, Kopfkappe; Ausleger 0,85 m leicht steigend (1 Kopf) oder Traverse 1,5 m (2 Köpfe); LED-Kopf flach mit Kühlrippen und opaler Leuchtfläche, zum Platz geneigt | Hof 5–6 m, Flutlicht 7,8 m | Korpus Anthrazit/Silbergrau (`MAT.vc('lackMetall')`), Leuchtfläche `lampeAussen` | `bk.lampe({art:'mast'})` |
| Wandleuchte | Wandplatte mit 4 Schrauben, Arm 0,3 m, LED-Strahler 32 × 26 cm, 26° geneigt | Montagehöhe 3 m | wie oben | `bk.lampe({art:'wand'})` |
| Licht nachts | Leuchtfläche warmweiß (`lampMats`), Lichtfleck am Boden (rund, Ø ≈ 1,9 × Lichtpunkthöhe, mind. 6 m), ab Niedrig dazu ein schwacher Lichtkegel – additive Textur, **keine Lichtquelle** | – | `MAT.bild(MAT.tex('lichtfleck'))` (eigenes Material, Deckkraft folgt der Tageszeit) | `bk.lampe` |

Farben nach Bedeutung (stilregeln §1): Leuchten und Masten Anthrazit (Hausfarbe Technik, Lampengehäuse), Bolzen Silbergrau (verzinkt),
Attikablech und Fallrohre Graphit (dunkle Bleche), Profile Aluminium. Kein neuer Palettenton.

## 2. Wo verwendet (alle Fundorte umgestellt)
- **Aussenhaut automatisch:** jede `bk.wand` mit Außenfläche Fassade oder Trapezblech, die am Boden steht (y0 < 5 cm, Höhe ≥ 0,6 m),
  bekommt Sockel + Profil; jede Außenfläche Eck-/Stoßprofile. Damit: Laden, Erweiterungen (Ladenzeile), Lager, Gang, Halle Süd,
  Lager ③/Schleuse, Logistik-Stufen, Halle West, Werk West, Verbindungsbau, Pforte. `o.aussenSockel:false` schaltet es ab.
- **Entfallen:** in die Fassadentextur gemalter Sockel (62 cm Graphit), Graphit-Blöcke unter den Schaufenstern (05f) und an der
  Ladenzeile (05e), Sockelband 1,05 m an der Logistik-Südwand (05m), Graphit-Sockel 1,3/0,9 m am Logistikzentrum Ost (05h, jetzt Betonsockel-Ring).
- **Attika (`bk.dachrand`)** statt der 25-cm-Platten: Laden und Lager (05c, Fallrohre an der Hofseite R1), Erweiterungen/Hallen
  (`halle()` in 05h, Fallrohre am Feuerwerkshof), Gang (05h), Halle Süd (05h), Ladenzeile vorn (05e). Logistikzentrum Ost: Attika jetzt Graphit.
- **Leuchten (`bk.lampe` mast/wand):** Feuerwerkshof (05d, 2 Mastleuchten – Toms Foto), Hof R1 (05g, 2 Wandleuchten + 2 Mastleuchten
  statt Straßenlaternen), Flutlichtmasten `hofMasten` (05h Logistikhof 3, 05m Versandhof 3, 05r Hof West 2). Straßenlaternen an der
  Straße bleiben `bk.lampe({art:'strasse'})` (mit Lichtkarte auf dem Gehweg). Das Strahlerpaar über dem Ladenschild (05f) gehört zum Schild.

## 3. Messung (`tools/fundament/fassade-bilder.js`, Gameplay-Vorführung + Vollausbau, 1280 × 720, swiftshader)
Zeichenaufrufe je Bild inkl. Schattenkarten und Bildeffekte (Mittel über 2 Bilder), vorher e5da0a6 → nachher 6069aa5:

| Ansicht | Hoch Tag | Hoch Nacht | Ultra Low Tag | Ultra Low Nacht |
|---|---|---|---|---|
| Straße/Front | 4001 → 3949 | 3965 → 3919 | 2174 → 2149 | 2152 → 2130 |
| Straße Ost (Erweiterungen) | 3668 → 3637 | 3701 → 3665 | 2417 → 2400 | 2445 → 2423 |
| Hof R1 | 4204 → 4163 | 4229 → 4180 | 2342 → 2315 | 2360 → 2325 |
| Feuerwerkshof (Toms Foto) | 3726 → 3693 | 3729 → 3696 | 1785 → 1769 | 1790 → 1773 |
| Versandhof | 2460 → 2445 | 2471 → 2450 | 1101 → 1094 | 1111 → 1098 |
| Hof West / Werk | 1598 → 1592 | 1596 → 1592 | 708 → 708 | 706 → 708 (±2 = Rauschen, vorher Tag/Nacht ebenso) |
| Wand nah (Lager West) | 4197 → 4157 | 4201 → 4157 | 2246 → 2222 | 2250 → 2222 |

- **Dreiecke:** Hoch 23,05–24,08 Mio. → +0,07 % (+16–19 Tsd., Eckprofile/Sockel/Leuchten inkl. Schattenpass); danach (Commit
  „Leuchten auf Hoch schlanker“) Fase, Rippen und Kühlrippen der Leuchten erst ab Maximum, Bolzen als Kasten – nicht neu gemessen
  (Wochenlimit), Erwartung ≈ ±0. Ultra Low ±0,0 %.
- **Texturspeicher** (Summe aller Texturen der Szene inkl. Mipmaps): Hoch 1360,0 → 1359,8 MB, Ultra Low 713,5 → 713,4 MB
  (Fassade 256 × 1024 → 1024 × 256, Trapezblech 256 × 64 → 256 × 128, neu Sockel 256 × 64 und Lichtfleck 128 × 64; Leuchtmaterialien
  je Lampe entfallen). Materialien 1161 → 1143.
- Warum weniger Zeichenaufrufe: Leuchten als Instanzen (drei Aufrufe je Aufrufstelle statt 5–8 je Mast, ein geteiltes
  Leuchtmaterial statt eines je Kopf), Sockel/Attikablech/Fallrohre im Wandbild als **ein** Mesh für die ganze Welt (`wbFeld 'alle'`),
  Profile im vorhandenen Laibungs-Material, Graphit-Blöcke weg. Der Lichtfleck kostet nachts einen Aufruf je Aufrufstelle, tags keinen.
- Bilder: `docs/fundament/fassade/<ansicht>-<tag|nacht>-<hoch|ultralow>-<vorher|nachher>.jpg`, Zählung `zaehlen-<stufe>-<vorher|nachher>.json`.

## 4. Vergleich mit Toms Fotos (selbst geprüft)
- Hof-Foto: Kasten auf Stange → Mast mit Fußplatte/Flansch, Ausleger und flachem LED-Kopf; schwarzer Dachbalken → Attika mit
  Paneelen und schmalem Graphit-Blech; schwarzes Sockelband → heller Betonsockel mit Spritzschmutz und Alu-Tropfkante.
- Wand-Foto: quadratische Tafeln mit Punkten → liegende Paneele 1 m mit Schattenfuge, Mikrolinierung, Stoßprofil alle 6 m,
  Schrauben nur an Stützen/Profil (8 mm Kopf), Laufspuren. Nachts: Wandleuchten und Mastleuchten mit Lichtkegel und Lichtfleck.

## 5. Grenzen / später
- **Später:** Fallrohre nur an Laden/Lager (Hof R1) und Feuerwerkshof – weitere Bauten (Halle West, Werk, Logistik) bei Bedarf über
  `bk.dachrand({fallrohre})` bzw. für Hallen eine eigene Rinne; Hallen (Trapezblech) behalten ihre Attika aus 05m/05r/05q.
- **Später:** Eckprofile sitzen an jedem Wandstück-Ende (auch Stoß in der Flucht = Stoßprofil); an sehr kurzen Stücken neben Toren
  wirken zwei Profile dicht nebeneinander – bei Bedarf Profil nur an echten Ecken (bräuchte Nachbarwissen im Wandbau).
- **Später:** Zugemauerte Eingangsachse der Ladenzeile hat ein eigenes Sockelstück (fällt mit Eingang 2); andere zugemauerte
  Öffnungen haben keinen Sockel.
- **Später:** Dreiecke nach dem letzten Leuchten-Commit nicht neu gemessen; Laufzeit-Wächter/Tests siehe Bericht.
- Licht der Hofleuchten ist kein echtes Licht (additiver Fleck/Kegel) – Figuren/Objekte werden davon nicht heller (bewusst, Leistung).
- Straßenlaternen an der Straße und das Strahlerpaar über dem Ladenschild unverändert.

# Tore – ein Bauteil `bk.tor` (Fundament Etappe 2, Schritt „Tore“, Pilot des Baukastens) – 13./14.10.2026

Tom, 13.10.: „ein Rolltor für Anlieferungen sieht überall gleich aus; ändert man es an einer Stelle, ändert es sich überall.“
Und (13.10. nachmittags): Umbau ab Tore ist **sichtbar** – je Bauteil EINE Optik, Unterschiede nur über Parameter.

## 1. Standard-Optik und warum

**Gewählt: das V1-Rolltor (11e, 09.10.) als Bild + die Ausstattung von R2–R5.**

| | V1 Rolltor (09.10.) | R1/R2–R5 Sektionaltor | Ost-Attrappe | → Standard |
|---|---|---|---|---|
| Torblatt | anthrazit/graphit, 4 Lamellen je Panel, Fensterband, Bodendichtung | hellgrau, Sicken, Lichtband (nur R1) | Bild auf Fläche | **V1** |
| Schienen/Antrieb | C-Profil, Wickelkasten, Motor | Welle, Federn, Kette, Bogen | – | je Art (Parameter) |
| außen | – | Zarge, Torabdichtung, Puffer, Vordach mit Schnee, Poller, Nummer | Zarge, Vordach, Puffer | **R2–R5** + Warnschraffur von V1 |
| Bedienung | Steuerkasten mit Not-Halt, Ampel links (Tom 09.10.) | gelber Kasten, Ampel | – | **V1** |

Begründung:
1. **Jüngste und von Tom ausdrücklich bestellte Optik:** V1 wurde am 09.10. auf Toms Wunsch „grafisch aufgewertet –
   Lamellen, Führungsschienen, Antrieb, Bodendichtung, Warnmarkierung“ (`versand-sb-0910.md` Punkt 5).
2. **Zielbild:** Toms Referenz-Render (`docs/bilder/referenz/versand-max.png`) zeigt beide Ladetore anthrazit mit
   Fensterband, schwarzem Kasten, gelben Pollern und Warnkanten – genau die V1-Optik, nicht das helle Sektionaltor.
3. **R2–R5 bringen die vollständigste Rampentechnik** (Zarge, Torabdichtung für den 2,55-m-Auflieger, Gummipuffer,
   Vordach, Nummernschild, Torwelle mit Federn innen). Die fehlte V1 außen; jetzt hat jedes Ladetor sie.
4. Die Art (Rolltor/Sektionaltor) bleibt ein **Parameter mit Bedeutung**: das Rolltor wickelt sich in den Kasten
   (V1, wenig Platz über dem Tor), das Sektionaltor läuft auf Schienen unter die Decke (R1, niedriges Lager) oder senkrecht
   hoch (R2–R5, hohe Halle). Beides mit demselben Torblatt, denselben Schienenprofilen, derselben Ampel.

Sichtbare Änderung: R1–R5 werden **dunkel (graphit) statt hellgrau**, bekommen das Fensterband (R2–R5 hatten keins) und
außen eine Ampel; V1 bekommt außen Zarge, Torabdichtung, Puffer und Vordach; das Nummernschild ist im Hausstil
(`bk.schild`, Nachtblau/Gold, weiße Ziffer) und R1 heißt jetzt sichtbar „1“. Gefällt die Farbe nicht: eine Zeile
(Atlas `torBlatt` in `01b-material.js`, Grundton `graphit`) – dann ändert sie sich an allen zehn Ladetoren.

## 2. Parameter

| Parameter | Werte (Standard) | Bedeutung |
|---|---|---|
| `art` | `sektional` · `roll` · `gitter` | Torbauart: Sektionen auf Schienen · Lamellenbehang in den Wickelkasten · Zauntor (Rahmen + Stäbe) |
| `breite`, `hoehe` | m (3,26 × 3,0) | lichte Öffnung |
| `panele` | Zahl (Höhe/0,6 bzw. /0,5) | Sektionen bzw. Lamellenpakete |
| `fenster` | `true` · `false` · Zeile (⌊0,6·panele⌋) | Fensterband (drei Scheiben) |
| `fuehrung` | `vertikal` · `normal` | Sektionaltor: senkrecht hoch (hohe Halle) · über Bogen `R` unter die Decke, Abhänger bis `decke` |
| `seite` | `beide` · `aussen` · `innen` | welche Seite gebaut wird (Attrappe: nur außen) |
| `ampel` | `beide` · `innen` · `aussen` · `false` | Ampel rot/grün; innen mit Bedienkasten und Not-Halt |
| `bedien` | `+1` · `-1` | Seite (quer) von Ampel/Bedienkasten; Antrieb und Rundumleuchte gegenüber |
| `vordach`, `dichtung`, `poller` | `true` | Vordach mit Schnee und Streben · Torabdichtung (Polster bis 1,35 m an die Mitte) + Puffer · zwei Poller mit Kollision |
| `nr` | Text · `null` | Nummernschild außen und innen (`bk.schild`) |
| `wand`, `blatt` | `[xAußen,xInnen]`, x | Lage der Wandflächen und des Torblatts zur Torgruppe |
| `beweglich`, `offen` | `true`, 0..1 | Attrappe: Blatt fest im Sammler · Anfangsstellung |
| `bewegung`, `boden`, `pfosten`, `schloss` | `schiebe`/`fluegel`, 0,3, – | nur `gitter` |

Rückgabe: `T.g` (Gruppe, `userData.bauteil='tor'`, `bauteilArt`), `T.set(t)`, `T.panele`, `T.blatt`/`T.zu`/`T.auf`,
`T.ampel.rot/gruen`, `T.warn` (eigene Materialien `MAT.neu('ampelRot'|'ampelGruen'|'torWarn')`), `T.kollision` (Poller, Welt).

## 3. Welche Stelle nutzt was

| Stelle | Datei (Hülle) | Parameter |
|---|---|---|
| R1 Basisrampe | `05g-dock.js` `buildTor` → `door` | sektional, `fuehrung:'normal'`, 3,26 × 3,0, 5 Panele, R 0,42, `decke:LAGER_H`, nr „1“ |
| R2–R5 Logistikhalle | `05h-ausbau.js` `westTor` → `WTORE`, `TOR_G` (05m) | sektional, `fuehrung:'vertikal'`, 3,4 × 3,05, nr „2“–„5“ |
| V1 Versandhof | `11e-palette.js` `buildVersandhof` → `VD` | roll, 3,26 × 3,0, 6 Panele, ohne Nummer (DDL-Schild) |
| Logistikzentrum Ost (4 Attrappen) | `05h-ausbau.js` `buildLogistik` | sektional, 3,6 × 4,2, `seite:'aussen'`, `beweglich:false`, ohne Ampel/Poller |
| Schiebetor Hof | `05g-dock.js` `buildDock` | gitter, `schiebe`, 4,2 × 2,3 |
| Doppeltor im Zaun (Ost) | `05h-ausbau.js` `buildLogistik` | gitter, `fluegel`, 6,22 × 2,4, Pfosten, Schloss |

Spiel-Logik unverändert in den Hüllen: `doorSet/doorOpen/updateDoor` (Kollision des Blatts, Ampel, Warnleuchte, Klang),
`WTORE[k].blatt/zu/auf/rot/gruen` + `wtorSet` (08c unverändert), `VD.panels/lampR/lampG/warn` + `vdSetzen/vdUpdate`,
`TOR_G/TOR_COLS` (05m unverändert). Gelöscht: `torPanelMat` (05g), `torBlattMat`, `westTorInnen` (05h), `vdPanelMat` (11e),
`panelPose`, `strebe` (05g), die alten Einzelbauten von Schiebetor und Doppeltor.

Nicht in diesem Schritt (andere Bauteile): Schiebetüren Laden/Eingang 2 (`05f`, `05l`), Streifenvorhänge – Schritt Türen;
Halle-Branch `hvTor` – Schritt 9 (Halle auf Baukasten).

## 4. Messung (neues Spiel, alle Ausbauten gekauft, Stufe Hoch, swiftshader 640×400; `tools/fundament/messen3.js` mit `pre.js`/`post.js`)

| Größe | vorher (f4725e6) | nachher |
|---|---|---|
| Meshes der Tore (R1, R2–R5, V1-Tor, Ost ×4, Schiebetor, Doppeltor) | ≈ 478 (97 + 292 + ~13 + 28 + 21 + 27) | **101** (16 + 4×12 + 14 + 4×5 + 1 + 2) |
| Meshes im Szenengraf gesamt / sichtbar | 2 905 / 2 655 | **2 521 / 2 271** (−384) |
| Dreiecke im Graf | 855 k | 830 k (−25 k; Fasen nur ab 6 cm Kante, Kleinteile einfache Kästen) |
| Bau R1 (`buildTor`): Meshes / Dreiecke / Zeichengruppen | 97 / 6 224 / 122 | 16 / 2 112 / 16 |
| Bau R2–R5 (`westTor` ×4) | 292 / 23 664 / 392 | 48 / 7 488 / 48 |
| Hof (`buildDock`, mit R1 und Schiebetor) | 187 / 12 694 / 212 | 78 / 5 642 / 78 |
| Logistikzentrum Ost (`buildLogistik`, Attrappen + Doppeltor) | 219 / 24 968 / 234 | 186 / 23 344 / 201 |
| Versandhof V1 (`buildVersandhof`) | 83 / 7 402 / 83 | 85 / 6 154 / 85 (V1 war schon gesammelt; jetzt mit Zarge/Dichtung/Vordach außen) |
| Zeichenaufrufe Hauptpass (ohne Laufzeit-Bündelung): Dock-Hof / Lagerdock / Laden | 1 292 / 1 126 / 981 | **1 232 / 1 047 / 919** |
| dasselbe Lager / Halle West / Testfeld / Straße | 824 / 430 / 551 / 123 | 735 / 313 / 538 / 117 |
| Material-Objekte / Texturen im Graf | 525 / 255 | 521 / 253 |
| Torblatt-Texturen | 3 Familien, 5 Texturen (1024×256, 512×640, 3× 512×128) | **1 Atlas 512×512** (`MAT.tex('torBlatt')`) |
| Ampel-/Warnleuchten-Varianten | 4 (je eigene Materialien, Kugel/Zylinder, verschiedene Farben) | 1 (`MAT.neu('ampelRot'/'ampelGruen'/'torWarn')`, je Tor ein Mesh je Zustand) |

Materialien sinken kaum, weil jedes bewegliche Tor drei **eigene** Leuchtmaterialien braucht (Zustand je Tor) – die
geteilten Tor-Materialien sind sechs (Atlas, Warnschraffur, vier Sammler-Klassen). Die Messung mit Laufzeit-Bündelung
(`messen4.js`) lief unter der Last im Container (zwei Browser parallel) vorher und nachher in die 30-Minuten-Grenze und
fehlt deshalb; die Bündelung fasst ohnehin nur statische Einzelmeshes zusammen, die Tor-Sammler sind schon gebündelt.

## 5. Bilder (`docs/fundament/tore/`)

Links vorher, rechts nachher, gleiche Kamera, Tag. „isoliert“ = nur Meshes mit `userData.bauteil='tor'`
(die Vorher-Bilder isoliert: `*-vorher-isoliert.webp`, aus dem alten Vorher-Katalog gerettet).

| Tor | im Spiel | isoliert |
|---|---|---|
| R1 außen (Dock-Hof) | [vorher/nachher](tore/r1-aussen-vorher-nachher.webp) | [nachher](tore/r1-aussen-nachher-isoliert.webp) · [vorher](tore/r1-aussen-vorher-isoliert.webp) |
| R1 innen (Lager) | [vorher/nachher](tore/r1-innen-vorher-nachher.webp) | [nachher](tore/r1-innen-nachher-isoliert.webp) |
| R2–R5 außen (LKW-Hof) | [vorher/nachher](tore/r2-aussen-vorher-nachher.webp) | [nachher](tore/r2-aussen-nachher-isoliert.webp) · [vorher](tore/r2-aussen-vorher-isoliert.webp) |
| R2–R5 innen (Logistikhalle) | [vorher/nachher](tore/r2-innen-vorher-nachher.webp) | [nachher](tore/r2-innen-nachher-isoliert.webp) · [vorher](tore/r2-innen-vorher-isoliert.webp) |
| V1 außen (Versandhof) | [vorher/nachher](tore/v1-aussen-vorher-nachher.webp) | [nachher](tore/v1-aussen-nachher-isoliert.webp) · [vorher](tore/v1-aussen-vorher-isoliert.webp) |
| V1 innen (Versandecke) | [vorher/nachher](tore/v1-innen-vorher-nachher.webp) | [nachher](tore/v1-innen-nachher-isoliert.webp) |
| Logistikzentrum Ost (Attrappen, im Spiel hinter den Aufliegern) | [vorher/nachher](tore/ost-vorher-nachher.webp) | [nachher](tore/ost-nachher-isoliert.webp) |
| Schiebetor Hof | [vorher/nachher](tore/hof-schiebetor-vorher-nachher.webp) | [nachher](tore/hof-schiebetor-nachher-isoliert.webp) · [vorher](tore/hof-schiebetor-vorher-isoliert.webp) |
| Doppeltor im Zaun (Ost) | [vorher/nachher](tore/doppeltor-vorher-nachher.webp) | [nachher](tore/doppeltor-nachher-isoliert.webp) · [vorher](tore/doppeltor-vorher-isoliert.webp) |

Bilder neu erzeugen: `tools/fundament/torbilder.js <real.html> <ordner> [iso]` (`VIEWS=r1-aussen,…` schränkt ein) – Kameras je Tor, `iso` blendet alles außer
`userData.bauteil='tor'` aus. Für Wiederholung im Katalog reicht `tools/fundament/katalog.js`: `bk.tor` erscheint dort
automatisch unter den Baukasten-Bauteilen.

## 5a. Tests (eigene Sperre, je Lauf ein Browser)

Grün: rampe (Tor zu → auf über den Bogen → LKW dockt, Ausladen, Tor zu), wrampe, logistik, versandtor, abfahrt, lieferung,
durchgang, versand, material (Wächter: 0 Verstöße), bruecke, tuer, ladentuer, eingang, stufen, korb, neu2, ausbau (Speichern + Laden), gameplay (Endstand).
Nicht bestätigt (Zeitlimit unter Last, nicht Tor-bedingt): raum und rampe-vorher hängen beide 30 min im selben Aufruf
`oeffneZone('lager',true)` im Testvorspann – vorher wie nachher; licht (drei Seitenladungen Laden-Licht, Tore nicht beteiligt).
`rampe` zeigt `panelX` jetzt in Torkoordinaten (0,1 … 2,46 statt Welt −19,85 …) – gleiche Bewegung, nur andere Bezugsgröße.

## 6. Offen / für Tom

- **Farbe:** graphit (V1/Zielbild) statt hellgrau überall – bitte abnehmen; Rückweg = eine Zeile im Atlas.
- **Halle-Branch** (`hvTor`, `hvLamellenTex`) ist noch eine vierte Tor-Implementierung – beim Schritt „Halle auf Baukasten“
  durch `bk.tor` ersetzen.
- Schiebetüren (Laden, Eingang 2) und Streifenvorhänge sind Türen, kein Tor – eigener Schritt.

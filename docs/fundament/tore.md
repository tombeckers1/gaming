# Tore – ein Bauteil `bk.tor` (Fundament Etappe 2, Schritt „Tore“, Pilot des Baukastens) – 13./14.10.2026 (Optik alter R1 seit 14.10.)

Tom, 13.10.: „ein Rolltor für Anlieferungen sieht überall gleich aus; ändert man es an einer Stelle, ändert es sich überall.“
Und (13.10. nachmittags): Umbau ab Tore ist **sichtbar** – je Bauteil EINE Optik, Unterschiede nur über Parameter.

## 1. Standard-Optik und warum

**Seit 14.10.: der alte R1 (Basisrampe, bis V129) – grau, glatte Sektionen.**
Tom, 14.10.2026: „Mach die Rolltore bitte so wie damals das allererste Rolltor, was man freischaltet. Das war grau.
Jetzt sind alle schwarz. Auch von der Textur her hat mir das alte besser gefallen. Bitte so einheitlich ändern.“

Übernommen vom alten R1 (`git show f4725e6:src/parts/05g-dock.js`, `buildTor`), Maße ab Außenwand/Torkante:

| Teil | alter R1 | jetzt (alle Ladetore) |
|---|---|---|
| Torblatt | Sandwich 9,5 cm, große Flächen glatt **lichtgrau** lackiert (`MAT.ober('lichtgrau','lackMetall')`; die Sickentextur `torPanelMat` lag nur auf den Stirnseiten und war nie zu sehen) | gleich: Atlas `torBlatt` Zeile 0, Ton `lichtgrau` (#dcdfe4, schon in der Palette, „wofür“ ergänzt). Rolltor-Lamellen (V1) 6 cm |
| Lichtband | vier helle Scheiben 0,52 × 0,30 m im vorletzten Panel | gleich (Atlas Zeile 1, Standard `fenster` = Panel n−2) |
| unterstes Panel | außen Warnstreifen 12 cm + Griffmulde, Bodengummi | gleich (Griffmulde im Atlas Zeile 2 nur auf der Außenfläche; Warnstreifen als Leiste mit `MAT.get('warnschraffur')` wie am alten R1, fährt als Kind des Panels mit; Gummi als Leiste) |
| Beschläge | Scharnierbänder außen, Rollen innen | gleich |
| Zarge | verzinkt, 0,3 m tief durch die Wand (innen heller Rahmen) | gleich |
| Torabdichtung, Puffer | Gummi 0,26 m, Puffer unten an der Innenkante | gleich; Polsterbreite über `fahrzeug` (s. u.) |
| Vordach | 1,9 m graphit mit Schnee, Streben | gleich |
| Poller | signalgelb, Gummikappe | gleich (Reflexbänder von V130 entfallen) |
| Ampel / Bedienkasten | kleines Gehäuse, zwei Leuchten; gelber Kasten, drei Taster | gleich (innen); Führung, Welle, Antrieb, Warnleuchte unverändert |

**Verworfen 14.10.:** die V130-Standardoptik (13.10.) = V1-Rolltor 09.10. – Torblatt graphit mit vier Lamellen je
Panel, blaues Fensterband (drei Scheiben), Warnschraffur auf Polstern, Zarge und Schienen, Bedienkasten lichtgrau mit
Not-Halt, Ampel mit Blenden. Tom fand sie zu schwarz; Bilder unten (Mitte).

Was R1 nicht hatte – Entscheidung:
- **behalten: Ampel außen** (R2–R5 hatten sie schon vor V130): zeigt dem Fahrer bzw. dem Spieler im Hof, ob das Tor
  offen ist – gleiche Form wie die R1-Ampel innen.
- **behalten: Nummernschild** „1“–„5“ (`bk.schild`): Torzuordnung für Anlieferungen; R2–R5 hatten es vorher.
- **behalten, als Parameter: breite Polster** an R2–R5 (vor V130 schon so, 05h): `fahrzeug` = Breite des andockenden
  Fahrzeugs, das Polster reicht bis `fahrzeug/2 + 8 cm`. R1 und V1 (Koffer-LKW 3,0 m) ergeben damit genau die alten
  0,26 m; der Auflieger (2,55 m) an R2–R5 und Ost braucht breitere, sonst sieht man links und rechts am Heck vorbei.
  Polster sitzen 30 cm vor der Wand (R1 reichte 10 cm in die Wand – an R2–R5 liegt das Blatt in der Wandebene, das gab
  Flimmern).
- **entfallen:** Fensterband, Warnschraffur auf Polstern/Zarge/Schienen, Not-Halt, Ampel-Blenden, Poller-Reflexbänder –
  ohne Funktion im Spiel, R1 hatte sie nicht.
- Warnleuchte bleibt auf dem Antrieb (am alten R1 schwebte sie 12 cm über der Torwelle).

Die Art (Rolltor/Sektionaltor) bleibt ein **Parameter mit Bedeutung**: das Rolltor wickelt sich in den Kasten
(V1, wenig Platz über dem Tor), das Sektionaltor läuft auf Schienen unter die Decke (R1, niedriges Lager) oder senkrecht
hoch (R2–R5, hohe Halle). Alle mit demselben grauen Torblatt, derselben Zarge, derselben Ampel.
Farbe ändern: eine Stelle (Atlas `torBlatt` in `01b-material.js`, Ton `lichtgrau`) – dann an allen zehn Ladetoren.

## 2. Parameter

| Parameter | Werte (Standard) | Bedeutung |
|---|---|---|
| `art` | `sektional` · `roll` · `gitter` | Torbauart: Sektionen auf Schienen · Lamellenbehang in den Wickelkasten · Zauntor (Rahmen + Stäbe) |
| `breite`, `hoehe` | m (3,26 × 3,0) | lichte Öffnung |
| `panele` | Zahl (Höhe/0,6 bzw. /0,5) | Sektionen bzw. Lamellenpakete |
| `fenster` | `true` · `false` · Panel-Nr. (panele−2) | Lichtband (vier Scheiben, wie R1) |
| `fuehrung` | `vertikal` · `normal` | Sektionaltor: senkrecht hoch (hohe Halle) · über Bogen `R` unter die Decke, Abhänger bis `decke` |
| `seite` | `beide` · `aussen` · `innen` | welche Seite gebaut wird (Attrappe: nur außen) |
| `ampel` | `beide` · `innen` · `aussen` · `false` | Ampel rot/grün; innen mit gelbem Bedienkasten (wie R1) |
| `bedien` | `+1` · `-1` | Seite (quer) von Ampel/Bedienkasten; Antrieb und Rundumleuchte gegenüber |
| `vordach`, `dichtung`, `poller` | `true` | Vordach 1,9 m mit Schnee und Streben · Torabdichtung + Puffer · zwei Poller mit Kollision |
| `fahrzeug` | m (3,0) | Breite des andockenden Fahrzeugs: Polster reichen bis `fahrzeug/2 + 0,08` (3,0 = Koffer-LKW R1/V1 → 0,26 m wie alter R1; 2,55 = Auflieger R2–R5, Ost) |
| `nr` | Text · `null` | Nummernschild außen und innen (`bk.schild`) |
| `wand`, `blatt` | `[xAußen,xInnen]`, x | Lage der Wandflächen und des Torblatts zur Torgruppe |
| `beweglich`, `offen` | `true`, 0..1 | Attrappe: Blatt fest im Sammler · Anfangsstellung |
| `bewegung`, `boden`, `pfosten`, `schloss` | `schiebe`/`fluegel`, 0,3, – | nur `gitter` |

Rückgabe: `T.g` (Gruppe, `userData.bauteil='tor'`, `bauteilArt`), `T.set(t)`, `T.panele`, `T.blatt`/`T.zu`/`T.auf`,
`T.ampel.rot/gruen`, `T.warn` (eigene Materialien `MAT.neu('ampelRot'|'ampelGruen'|'torWarn')`), `T.kollision` (Poller, Welt).
`bk.uvZeile(geo, außen, innen, rand)` legt die Flächen eines Kastens auf Atlas-Zeilen (Warnstreifen nur außen).

## 3. Welche Stelle nutzt was

| Stelle | Datei (Hülle) | Parameter |
|---|---|---|
| R1 Basisrampe | `05g-dock.js` `buildTor` → `door` | sektional, `fuehrung:'normal'`, 3,26 × 3,0, 5 Panele, R 0,42, `decke:LAGER_H`, nr „1“ |
| R2–R5 Logistikhalle | `05h-ausbau.js` `westTor` → `WTORE`, `TOR_G` (05m) | sektional, `fuehrung:'vertikal'`, 3,4 × 3,05, `fahrzeug:2.55`, nr „2“–„5“ |
| V1 Versandhof | `11e-palette.js` `buildVersandhof` → `VD` | roll, 3,26 × 3,0, 6 Panele, ohne Nummer (DDL-Schild) |
| Logistikzentrum Ost (4 Attrappen) | `05h-ausbau.js` `buildLogistik` | sektional, 3,6 × 4,2, `seite:'aussen'`, `beweglich:false`, `fahrzeug:2.55`, ohne Ampel/Poller |
| Schiebetor Hof | `05g-dock.js` `buildDock` | gitter, `schiebe`, 4,2 × 2,3 |
| Doppeltor im Zaun (Ost) | `05h-ausbau.js` `buildLogistik` | gitter, `fluegel`, 6,22 × 2,4, Pfosten, Schloss |

Spiel-Logik unverändert in den Hüllen: `doorSet/doorOpen/updateDoor` (Kollision des Blatts, Ampel, Warnleuchte, Klang),
`WTORE[k].blatt/zu/auf/rot/gruen` + `wtorSet` (08c unverändert), `VD.panels/lampR/lampG/warn` + `vdSetzen/vdUpdate`,
`TOR_G/TOR_COLS` (05m unverändert). Gelöscht: `torPanelMat` (05g), `torBlattMat`, `westTorInnen` (05h), `vdPanelMat` (11e),
`panelPose`, `strebe` (05g), die alten Einzelbauten von Schiebetor und Doppeltor.

Nicht in diesem Schritt (andere Bauteile): Schiebetüren Laden/Eingang 2 (`05f`, `05l`), Streifenvorhänge – Schritt Türen;
Halle-Branch `hvTor` – Schritt 9 (Halle auf Baukasten).

## 4. Messung (Stand 13.10., graphit-Optik; neues Spiel, alle Ausbauten gekauft, Stufe Hoch, swiftshader 640×400; `tools/fundament/messen3.js` mit `pre.js`/`post.js`)

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

14.10. (Optik alter R1): Mesh-Zahl je Ladetor gleich (Warnschraffur sitzt jetzt nur am untersten Panel statt an
Polstern/Schienen); Atlas bleibt eine Textur 512×512, Warnstreifen über die geteilte Schraffur (keine zweite Malroutine).

Materialien sinken kaum, weil jedes bewegliche Tor drei **eigene** Leuchtmaterialien braucht (Zustand je Tor) – die
geteilten Tor-Materialien sind sechs (Atlas, Warnschraffur, vier Sammler-Klassen). Die Messung mit Laufzeit-Bündelung
(`messen4.js`) lief unter der Last im Container (zwei Browser parallel) vorher und nachher in die 30-Minuten-Grenze und
fehlt deshalb; die Bündelung fasst ohnehin nur statische Einzelmeshes zusammen, die Tor-Sammler sind schon gebündelt.

## 5. Bilder (`docs/fundament/tore/`)

Ladetore (R1, R2–R5, V1, Ost), Stand 14.10.: drei Bilder nebeneinander – **links bis V129** (alt), **Mitte V130
graphit (verworfen 14.10.)**, **rechts neu = alter R1**; gleiche Kamera, Tag. Zauntore unverändert: links vorher,
rechts nachher (13.10.). „isoliert“ = nur Meshes mit `userData.bauteil='tor'`, Stand neu
(die Vorher-Bilder isoliert stehen im Katalog: `katalog/vorher/tor-*.webp`).

| Tor | im Spiel | isoliert |
|---|---|---|
| R1 außen (Dock-Hof) | [vorher/nachher](tore/r1-aussen-vorher-nachher.webp) | [nachher](tore/r1-aussen-nachher-isoliert.webp) · [vorher](katalog/vorher/tor-r1-0.webp) |
| R1 innen (Lager) | [vorher/nachher](tore/r1-innen-vorher-nachher.webp) | [nachher](tore/r1-innen-nachher-isoliert.webp) |
| R2–R5 außen (LKW-Hof) | [vorher/nachher](tore/r2-aussen-vorher-nachher.webp) | [nachher](tore/r2-aussen-nachher-isoliert.webp) · [vorher](katalog/vorher/tor-r25-aussen-0.webp) |
| R2–R5 innen (Logistikhalle) | [vorher/nachher](tore/r2-innen-vorher-nachher.webp) | [nachher](tore/r2-innen-nachher-isoliert.webp) · [vorher](katalog/vorher/tor-r25-innen-0.webp) |
| V1 außen (Versandhof) | [vorher/nachher](tore/v1-aussen-vorher-nachher.webp) | [nachher](tore/v1-aussen-nachher-isoliert.webp) · [vorher](katalog/vorher/tor-v1-0.webp) |
| V1 innen (Versandecke) | [vorher/nachher](tore/v1-innen-vorher-nachher.webp) | [nachher](tore/v1-innen-nachher-isoliert.webp) |
| Logistikzentrum Ost (Attrappen, im Spiel hinter den Aufliegern) | [vorher/nachher](tore/ost-vorher-nachher.webp) | [nachher](tore/ost-nachher-isoliert.webp) |
| Schiebetor Hof | [vorher/nachher](tore/hof-schiebetor-vorher-nachher.webp) | [nachher](tore/hof-schiebetor-nachher-isoliert.webp) · [vorher](katalog/vorher/tor-hof-0.webp) |
| Doppeltor im Zaun (Ost) | [vorher/nachher](tore/doppeltor-vorher-nachher.webp) | [nachher](tore/doppeltor-nachher-isoliert.webp) · [vorher](katalog/vorher/tor-ost-0.webp) |

Bilder neu erzeugen: `tools/fundament/torbilder.js <real.html> <ordner> [iso]` (`VIEWS=r1-aussen,…` schränkt ein) – Kameras je Tor, `iso` blendet alles außer
`userData.bauteil='tor'` aus. Für Wiederholung im Katalog reicht `tools/fundament/katalog.js`: `bk.tor` erscheint dort
automatisch unter den Baukasten-Bauteilen.

## 5a. Tests (eigene Sperre, je Lauf ein Browser)

14.10. (Optik alter R1): grün rampe, wrampe, logistik, versandtor, abfahrt, versand, material (0 Verstöße, Warnschraffur 28 Abrufe), stufen, gameplay;
`wirtschaft-snapshot` GLEICH. Erstläufe brachen unter Last ab (Klick-Zeitlimit, Speichermangel-Abstürze fremder Browser) – wiederholt, nicht Tor-bedingt.

13.10.:

Grün: rampe (Tor zu → auf über den Bogen → LKW dockt, Ausladen, Tor zu), wrampe, logistik, versandtor, abfahrt, lieferung,
durchgang, versand, material (Wächter: 0 Verstöße), bruecke, tuer, ladentuer, eingang, stufen, korb, neu2, ausbau (Speichern + Laden), gameplay (Endstand).
Nicht bestätigt (Zeitlimit unter Last, nicht Tor-bedingt): raum und rampe-vorher hängen beide 30 min im selben Aufruf
`oeffneZone('lager',true)` im Testvorspann – vorher wie nachher; licht (drei Seitenladungen Laden-Licht, Tore nicht beteiligt).
`rampe` zeigt `panelX` jetzt in Torkoordinaten (0,1 … 2,46 statt Welt −19,85 …) – gleiche Bewegung, nur andere Bezugsgröße.

## 6. Offen / für Tom

- **Farbe:** erledigt 14.10. – grau wie der alte R1 (Toms Wunsch); graphit verworfen.
- **Halle-Branch** (`hvTor`, `hvLamellenTex`) ist noch eine vierte Tor-Implementierung – beim Schritt „Halle auf Baukasten“
  durch `bk.tor` ersetzen.
- Schiebetüren (Laden, Eingang 2) und Streifenvorhänge sind Türen, kein Tor – eigener Schritt.

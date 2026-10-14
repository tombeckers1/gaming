# Wände – `bk.wand` und das Wandbild (Fundament Etappe 2, Schritt 3) – 14.10.2026

Laut Inventar (`inventar-optik.md` §2.7, §4) der größte Leistungshebel: `wall()` baute jede Wand als Kasten mit **sechs**
Materialien (eine je Seite) – 147 Wände = 882 Zeichengruppen, im Schattenpass allein 170–268 Aufrufe je Bild. Wände sind
Zielstrahl-Hindernisse (`occluders`) und wurden deshalb von der Laufzeit-Bündelung (03b) nie zusammengefasst.

## 1. Standard-Optik und warum

Eine Wand hat zwei Flächen und Laibungen. Die **Art einer Fläche hat eine Bedeutung** – je Art EIN Material:

| Fläche (`bk.flaeche`) | Bedeutung | Material | vorher | Änderung |
|---|---|---|---|---|
| `laden` | Verkaufsraum innen | `shopWall` (Tapete wählt der Spieler, 05o) | gleich | keine |
| `lager` | Lager/Halle innen: hell, gelb-schwarzes Sockelband 35 cm | `MAT.get('wandLager')` | `lagerWall` (05-world, eigenes Material) | Rauheit 0,95 → Klasse matt 0,9 |
| `fassade` | Außenwand: Faserzementtafeln 1,18 m, dunkler Sockel 62 cm | `MAT.get('wandFassade')` | `wallBrickMat()` (05-world) | 0,78/0,04 → matt 0,9/0 (minimal matter) |
| `blech` | Hallenwand außen (Logistik): Trapezblech | `MAT.get('wandBlech')` | `blechMat()` (05h) | 0,52/0,38 → lackMetall 0,5/0,3 |
| `laibung` | Stirnseite an Öffnungen, wenn die Stelle nichts vorgibt | `MAT.get('wandLaibung')` (Aluminium matt) | `trimMat` (eigenes Material) | keine (gleiche Werte, jetzt geteilt) |
| `putz` | Fensterlaibung | `MAT.get('wandPutz')` | `MAT.ober('lichtgrau','matt')` | keine |

Sockel (`bk.sockelleiste`): `laden` = Fußleiste 10 × 2 cm, Farbe folgt der Tapete (`sockelM`, 05o – unverändert);
`aussen` = Spritzwassersockel 1,05 m an der Logistik-Südwand, jetzt **graphit matt** (vorher eigenes `#4a5058`, etwas heller).

Die Malcodes der Texturen sind unverändert in die Materialbibliothek umgezogen (`01b-material.js`, `TEXTUR.fassade/lagerwand/
trapezblech`). Sichtbar ist deshalb fast nichts – Absicht: der Wandschritt ist ein **Struktur- und Leistungsschritt**; die
Wandarten waren schon einheitlich. Was man sieht: Wände minimal matter (Klassenwerte statt freier Werte), Außensockel dunkler.

## 2. Aufbau

**`bk.wand(o)`** baut ein Wandstück: Box, UV in Metern, die sechs Seiten **nach Material gruppiert** (höchstens drei Gruppen
statt sechs), `userData.flaechen` = Material je Seite (für Tests: `bk.wandFlaeche(mesh,k)`), `userData.aabb`, `occluders`,
`WAENDE`, Zone (`zWand`), Sockelleisten (`sockel`).

**Wandbild (`bk.wandbild`)**: alle Wandstücke und Sockelleisten werden je Material und 32-m-Feld zu **einem** Mesh
zusammengezeichnet (Hauptpass und Schattenpass). Die Original-Meshes bleiben in der Szene – Lage, `aabb`, `occluders`,
`WAENDE`, Zonen-Sichtbarkeit, Material je Seite, Raycast –, liegen aber auf **Ebene 3**: Kamera und Schatten sehen sie
nicht, der Zielstrahl des Spielers schon (`15-player.js` `ray.layers.enable(3)`; Ebene 1 = Bündelung 03b, Ebene 2 =
Kleinteil-Kappung 03c). Neu gebaut wird, wenn sich Sichtbarkeit oder Material eines Originals ändert: sofort aus
`oeffneZone`/`applyZonen` (Kauf, Laden eines Spielstands), sonst über eine Prüfsumme alle 10 Bilder (`renderFrame` →
`bk.wandbildTakt`), z. B. für Logistik-Stufen oder Pracht-Kopien. Ein Neubau dauert wenige Millisekunden (≈ 200 Stücke,
je 36 Ecken). Ohne Ebenen (Test-Stub `test.html`) zeichnen die Originale selbst (`WB.aus`).

```js
bk.wand({x0,x1,z0,z1,y0,y1, innen:'+x'|'-x'|'+z'|'-z', flaechen:{innen, aussen:'fassade', laibung:'laibung'},
         ue:0.006, still, sockel:true|[-1,1], zone, parent, bild:true})            -> Mesh (userData.bauteil 'wand')
bk.sockelleiste({art:'laden'|'aussen', laengs, fest, a0, a1, seite:±1, dicke, x, z, zone, versteckt})   -> Mesh
bk.flaeche('lager') -> Material · bk.wandFlaeche(mesh,k) -> Material der Seite k (0 +x, 1 −x, 2 +y, 3 −y, 4 +z, 5 −z)
bk.wandbild(erzwingen) · bk.WB = {liste, meshes, n (Neubauten), aus}
```

| Parameter | Bedeutung |
|---|---|
| `flaechen` | Art-Name oder Material je Fläche; `aussen` fehlt = Fassade, `laibung` fehlt = Alu matt |
| `ue` | Überstand gegen Haarfugen an Fluchtenden; 0 zwischen Stücken derselben Flucht (sonst Flimmern) |
| `still` | kein Zielstrahl-Hindernis (Füllungen von Durchbrüchen, die nicht den Blick auf Regale verstellen sollen) |
| `zone` | Teil der Bauwand: fällt beim Kauf |
| `sockel` | Laden-Fußleiste auf den Seiten mit Ladentapete (`true`) oder auf den genannten Seiten |

`wall()` (05-world) und `stilleWand()`/`sockelLeiste()` (05h) sind dünne Hüllen über `bk.wand`/`bk.sockelleiste` – die
Aufrufstellen (Grundriss-Logik in `durchbruchWand`, `trennwand`, `halle`, `logiSuedwand`, `logiStufeBauen`,
`lagerFensterWand`, Lagergang, Nachbarfassade) bleiben unverändert.

## 3. Welche Stelle nutzt was

| Stelle | Datei | Flächen |
|---|---|---|
| Basisladen (Front, Rückwand, Ost-/Westwand) | `05c-buildworld.js` (14× `wall`, Sockel) | laden / fassade / lager |
| Ausbaustufen Laden + Lager (`halle`), Durchbrüche, Bauwände (`durchbruchWand`, `trennwand`, `stilleWand`) | `05h-ausbau.js` | laden, lager, fassade |
| Lagergang, Lagerfensterwand, Schleuse | `05h-ausbau.js` | lager, fassade-Laibung, putz |
| Nachbarfassade (Erweiterungen Ost) | `05e-street.js` `buildNachbar` | laden / fassade, Sockel `versteckt` |
| Logistikhalle Stufen 1–3 (Süd-, West-, Ostwand, Außensockel) | `05m-logistik.js` | lager / blech, Sockel `aussen` |

**Gelöscht:** `fassadeTex`, `wallBrickMat`, `wallBrick`, `FASS` (05-world → 01b), `lagerWallTex` + eigenes `lagerWall`-Material,
`trimMat`, `lagerUpper` (unbenutzt), `FACE`/`OPP`-Tabellen und das 6er-Material-Feld (05-world), `blechMat`/`_blech` (05h),
Sockel-`bbox`-Einzelbauten (05c, 05e, 05h `halle`, 05m), `MAT.std(0x4a5058)` (05m).
Nicht in diesem Schritt: Hofmauern `brickMat` (05g, eigene Kästen), Fassadenpaneele/Schaufenster 05f (Schritt 8),
Halle-Branch `hvWand` (Schritt 9).

## 4. Messung

Neues Spiel, alle Ausbauten gekauft, Stufe Hoch, swiftshader 640×400, `tools/fundament/messen3.js` mit `pre.js`/`post.js`
(ohne Laufzeit-Bündelung, letztes Bild nach drei Vorbildern). „vorher“ = d9e733d, „Zäune“ = nur Schritt 4, „Wände“ = Endstand.

| Ansicht | Hauptpass vorher | Zäune | **Wände** | Schattenpass vorher | Zäune | **Wände** | davon Wände Haupt | davon Wände Schatten |
|---|---|---|---|---|---|---|---|---|
| Laden | 927 | 855 | **778** | 673 | 672 | **445** | 87 → 25 | 268 → 46 |
| Ladenfront | 479 | 475 | **432** | 656 | 656 | **437** | 59 → 14 | 265 → 46 |
| Lager | 743 | 669 | **607** | 628 | 631 | **425** | 71 → 22 | 253 → 47 |
| Lagerdock | 1 093 | 1 064 | **895** | 625 | 625 | **423** | 140 → 28 | 249 → 47 |
| Testfeld | 553 | 487 | **458** | 642 | 642 | **429** | 30 → 13 | 260 → 48 |
| Dock-Hof | 1 188 | 1 160 | **1 049** | 612 | 612 | **415** | 171 → 31 | 245 → 47 |
| Halle West | 315 | 261 | **240** | 460 | 460 | **332** | 27 → 15 | 169 → 39 |
| Straße | 123 | 123 | **125** | 661 | 661 | **446** | 0 → 3 | 261 → 46 |

„davon Wände“ = Wandstücke + Sockelleisten (vorher `wall`/`stilleWand`/`trennwand`/`durchbruchWand`/`sockelLeiste`, nachher alle Meshes
mit `userData.bauteil='wand'`, d. h. die Wandbild-Meshes). Hauptpass gesamt **−9 … −24 %**, Schattenpass **−28 … −34 %**.

| Größe | vorher | nachher |
|---|---|---|
| Zeichengruppen der Wände im Graf (147 Stücke) | 882 | 294 (≤ 3 je Stück) – gezeichnet werden davon keine, das Wandbild hat ≈ 40 Meshes |
| Zeichengruppen im Szenengraf gesamt | 3 381 | 2 516 |
| Meshes im Graf / sichtbar | 2 521 / 2 271 | 2 218 / 1 997 (Zäune −344, Wandbild +≈ 40; Originale bleiben für die Logik) |
| Material-Objekte / Texturen | 521 / 260 | 516 / 260 |
| Dreiecke im Graf | 826 k | 797 k |
| JS-Speicher / Geometrien im Renderer (neues Spiel, alle Zonen) | 391 MB / 1 236 | 391 MB / 1 116 |
| Neubau des Wandbilds (≈ 200 Stücke) | – | ≈ 16 ms (swiftshader, unter Last), nur bei Kauf/Laden/Stufenwechsel |

Bildvergleich vorher/nachher (gleiche Kamera, Zufall fest, Anteil Pixel mit Abweichung > 16 Stufen): Lager 0,01 %, Lagerdock 0,01 %,
Halle West 0,04 %, Laden 0,9 %, Ladenfront 1,3 %, Dock-Hof 3,5 %, Testfeld 4,7 % – die größeren Werte kommen von Straße, Autos und
Schnee (Zufall/Zeit), nicht von den Wänden.

**Mit Laufzeit-Bündelung** (`tools/fundament/messen4.js`, Build ohne Zähl-Wrapper; erst ohne, dann nach `buendelJetzt()` –
so läuft das Spiel nach ein paar Sekunden Ruhe). Das ist der Stand, den der Spieler sieht (Zäune + Wände zusammen):

| Ansicht | Hauptpass vorher (ohne → mit Bündelung) | nachher (ohne → **mit**) | Schattenpass vorher | nachher |
|---|---|---|---|---|
| Laden | 838 → 597 | 693 → **490** (−18 %) | 593 → 511 | 370 → **287** (−44 %) |
| Ladenfront | 451 → 343 | 408 → **292** | 582 → 500 | 362 → **279** |
| Lager | 730 → 532 | 590 → **440** | 562 → 481 | 355 → **273** |
| Lagerdock | 940 → 635 | 787 → **495** (−22 %) | 557 → 475 | 354 → **272** |
| Testfeld | 592 → 394 | 508 → **343** | 564 → 486 | 351 → **273** |
| Dock-Hof | 1 188 → 739 | 1 002 → **561** (−24 %) | 541 → 464 | 342 → **266** |
| Halle West | 312 → 261 | 239 → **203** | 417 → 358 | 286 → **229** |
| Straße | 121 → 122 | 124 → **125** | 585 → 503 | 365 → **290** |

Die Bündelung fasst nachher 718 statt 981 Meshes zusammen – die Zaunteile und Sockelleisten sind schon im Baukasten bzw. im
Wandbild. Bildrate wurde nicht gemessen: im Container liefen zeitgleich drei weitere Agenten mit Browsern (Last 10–14 auf
4 Kernen), Zeiten wären nicht vergleichbar.

## 5. Bilder (`docs/fundament/waende/`)

Links vorher, rechts nachher, gleiche Kamera, Tag, Stufe Hoch.

| Ansicht | im Spiel |
|---|---|
| Laden | [vorher/nachher](waende/laden-vorher-nachher.webp) |
| Ladenfront (Fensterfront innen) | [vorher/nachher](waende/ladenfront-vorher-nachher.webp) |
| Lager | [vorher/nachher](waende/lager-vorher-nachher.webp) |
| Lagerdock | [vorher/nachher](waende/lagerdock-vorher-nachher.webp) |
| Dock-Hof (Fassade außen) | [vorher/nachher](waende/dockhof-vorher-nachher.webp) |
| Logistikhalle West | [vorher/nachher](waende/halle-west-vorher-nachher.webp) |
| Testfeld (Fassaden) | [vorher/nachher](waende/testfeld-vorher-nachher.webp) |
| isoliert | [innen: Laden mit Fußleiste, Lager](waende/wand-innen-isoliert.webp) · [außen: Fassade, Trapezblech, Außensockel](waende/wand-aussen-isoliert.webp) |

Neu erzeugen: `tools/fundament/bauteilbilder.js` (Ansichten `wand-*`, `iso-wand-*`).

## 6. Tests

Eigene Sperre `/tmp/bb-testlock-waende`, ein Browser, `real.html` (bodenabstand `test.html`). Zeitweise liefen drei weitere Agenten
(Last 10–14, OOM-Kills im Container) – Läufe, die am Start-Klick hängen blieben oder deren Renderer beendet wurde, sind mit dem
neuen Testrahmen (`tools/test/lauf.sh`/`ladezeit-preload.js` aus dem Hauptbranch) wiederholt.

**Grün:** sockel, doppelwand, gangwand, naht, fugen, fassade, aussen, stufen, versand, versandtor (inkl. Gegenprobe Zaunkollision),
packband, durchgang, ausbau (Speichern + Laden), lager, gangfrei, deko, karte, licht, oberflaechen, bodenabstand,
material (Wächter: 0 Verstöße), **gameplay (ALLES OK)**. Wirtschafts-Snapshot: **GLEICH**.
**Rot, schon auf d9e733d gleich rot (gegengeprüft):** flimmern (nur „2 Vordachstreben am Rolltor“ – seit dem Tor-Schritt im Sammler,
Punkte 1–4 grün), wandfrei (Personen streifen Schleusen-/Hallenwand-Enden – Ausgangsstand 4 Funde, nachher 1–3, je Lauf andere Stellen).
**Bekannt rot:** park GRUEN (88 %), buendel GLEICH (Bild ändert sich schon ohne Bündelung von Bild zu Bild – Kontrollmessung
nachher 37,8 % zwischen zwei unbündelten Bildern; Augenanpassung). buendel WENIGER/WAECHTER/TREFFER grün, Laden 849 → 642 Aufrufe.
**Angepasst:** `sockel.js`, `flimmern.js` (Material je Seite über `bk.wandFlaeche` statt 6er-Feld), `aussen.js` (Pfostenliste
`userData.zaunPfosten`). **Gegenproben:** Zaunpfosten in der Verkaufsfläche → 2 Funde; Ladenleiste vor Lagerwand → 1 Fund;
Bauwand nach Kauf sofort weg (Strahl 1,9 m → frei); Wand-Originale nur mit Ebene 3 treffbar (Spieler-Strahl ja, frischer Strahl nein).
Speicher: JS-Heap nach Vorführung 1,02–1,04 GB vorher wie nachher, Geometrien im Renderer 1 236 → 1 116.

## 7. Offen / für Tom

- Wände minimal matter, Logistik-Außensockel dunkler – bitte bei Gelegenheit ansehen (Bilder oben).
- Hofmauern (`brickMat`, 05g) sind keine `wall()`-Wände; sie kommen mit dem Fassaden-Schritt.
- Das Wandbild verliert die Sichtprüfung je Wandstück innerhalb eines 32-m-Felds: das kostet nur Eckpunkte (Wände haben
  12 Dreiecke), keine Pixel. Wer später große Flächen (Halle) hinzufügt, nimmt `bk.wand` – dann landen sie automatisch im Bild.

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

MESSUNG_WAENDE

## 5. Bilder (`docs/fundament/waende/`)

BILDER_WAENDE

## 6. Tests

TESTS_WAENDE

## 7. Offen / für Tom

- Wände minimal matter, Logistik-Außensockel dunkler – bitte bei Gelegenheit ansehen (Bilder oben).
- Hofmauern (`brickMat`, 05g) sind keine `wall()`-Wände; sie kommen mit dem Fassaden-Schritt.
- Das Wandbild verliert die Sichtprüfung je Wandstück innerhalb eines 32-m-Felds: das kostet nur Eckpunkte (Wände haben
  12 Dreiecke), keine Pixel. Wer später große Flächen (Halle) hinzufügt, nimmt `bk.wand` – dann landen sie automatisch im Bild.

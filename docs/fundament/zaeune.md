# Zäune, Absperrungen, Poller, Anfahrschutz – Baukasten (Fundament Etappe 2, Schritt 4) – 14.10.2026

Tom, 13.10.: „ändert man es an einer Stelle, ändert es sich überall“ – und: Umbau ist **sichtbar**, je Bauteil EINE Optik,
Unterschiede nur über Parameter mit Bedeutung. Vorbild für Aufbau und Doku: `tore.md`.

## 1. Standard-Optik und warum

| Bauteil / Art | Bedeutung | Vorher (Varianten) | → Standard | Begründung |
|---|---|---|---|---|
| `bk.zaun` `doppelstab` | **außen**: Grundstück, Hof, Testfeld | Doppelstabmatte 05e (9 Läufe) · Versandhof-Zaun 11e (Pfosten alle 2 m + halbdurchsichtige Scheibe + 2 Holme) | **Doppelstabmatte 05e** | meistgenutzt; echtes Produkt für Gewerbehöfe (Matte mit Doppelstäben, Pfosten mit Kappe und Schellen, Sockelschiene); Textur schon geteilt (`MAT.tex('doppelstab')`). Die Scheibe in 11e sah wie Glas aus – ein Hofzaun ist Gitter |
| `bk.zaun` `gitter` | **innen**: Ladezone, Palettierplatz | gelbes Schweißgitter 05h `gitterZaun` | **unverändert** | Tom 09.10.: „Absperrungen in Gelb, im Stil der Gitterbox“ |
| `bk.zaun` `gelaender` | innen, niedrig, wo darüber gearbeitet wird (Greifer am Band) | `gitterZaun` ohne Gitter | wie `gitter`, Mittelholm statt Gitter | gleiche Familie, nur ohne Füllung |
| `bk.poller` `anfahr` | Industrie: Tore, Rampen | Tor-Poller (bk.tor, R1–R5, V1) | **unverändert** | Zielbild `versand-max.png`: gelbe Poller, Gummikappe, Reflexbänder |
| `bk.poller` `stadt` | Gehweg/Straße | Stadtmöbel-Poller 05e (rund graphit, Reflexring) · Laden-Poller 05f (Vierkant anthrazit, Goldkappe) | **Stadtmöbel-Poller 05e** | öffentlicher Raum = Stadtmöbel; Goldkappe war ein Einzelstück. Beide Laden-Poller sitzen jetzt im Stadtmöbel-Sammler (gleiche Straßenmaterialien, Lichtpfützen) |
| `bk.anfahrschutz` | Rammschutz-Bügel um Geräte (Mörser) | Mörser 05d (Einzelkästen) | **Mörser-Bügel** | einziges Vorkommen; Fußplatte jetzt dieselbe wie bei Gitter/Pfosten (`bk.fuss`, anthrazit statt mittelgrau) |
| `bk.absperrung` | Bereich ist zu sehen, aber noch gesperrt (Kapitel/Kauf) | 3 Bauten in 05h (Testfeld-, Lager-, Packstationsband), je eigenes Material, Pfosten mal mit Klemmen, mal mit Fußplatte | **Pfosten graphit + schwarze Kappe + Bandklemme je Band**, Fußplatte nur freistehend (`frei`) | eine Regel statt drei Bauweisen; Pfosten 26 cm über dem obersten Band |

**Sichtbare Änderungen** (bitte abnehmen):
1. Versandhof (V1): Doppelstabmatte statt halbdurchsichtiger grauer Scheibe.
2. Laden-Poller vor dem Schaufenster: runde Stadtpoller (graphit, Reflexring) statt Vierkant mit Goldkappe.
3. Logistikzentrum Ost: die Matte läuft nicht mehr mitten durch das Doppeltor (Lücke `luecke` – vorher stand die Matte im Tor).
4. Packstations-Band: Pfosten 1,31 statt 1,20 m (Regel), Bandklemmen; Lager-/Testfeldband: Klemmen bzw. gleiche Pfosten.
5. Mörser-Anfahrschutz: Fußplatten anthrazit. Doppelstab-Kappen sitzen auf dem Pfosten (vorher 1,75 cm Luft).
6. Absperrband etwas matter/seidiger (Klasse `kunststoff` 0,6 statt freier Rauheit 0,72).

Gefällt eine Optik nicht: eine Stelle in `04z-baukasten.js` – dann ändert sie sich an allen Zäunen/Pollern der Art.

## 2. Parameter

```js
bk.zaun({art:'doppelstab'|'gitter'|'gelaender', von:[x,z], bis:[x,z], hoehe, pfosten /*Abstand*/, luecke:[[s0,s1]] /*m ab von*/,
         S /*fremder Sammler mit box()*/, parent, schatten})
  -> {art, meshes, gitter:[Mesh], pfosten:[[x,z]], kollision:[{x0,x1,z0,z1}], laenge}
bk.poller(S, x, z, {art:'anfahr'|'stadt', hoehe, breite, y /*Boden*/, kl:{lack,matt} /*Klassen des Sammlers*/})  -> Kollisionsrechteck
bk.anfahrschutz(S, {von, bis, hoehe:0.5, rohr:0.09, pfosten:2.5})                                             -> Kollisionsrechteck
bk.absperrung({punkte:[[x,z],...], baender:[0.5,1.0,1.5], text, zone, parent, frei:true, hoehe})              -> {meshes, band}
```

| Parameter | Werte (Standard) | Bedeutung |
|---|---|---|
| `art` (Zaun) | `doppelstab` 2,0 m / 2,5 m · `gitter` 2,0 m / 1,2 m · `gelaender` 1,1 m / 1,2 m | außen · innen · innen niedrig (Höhe / Pfostenabstand) |
| `luecke` | `[[s0,s1],…]` | Einfahrt oder Tor in der Flucht – Pfosten an beiden Rändern, keine Matte dazwischen |
| `S` | Sammler | Zaun gehört zu einer größeren Baugruppe (Packstation: Teile je Ausbaustufe) – Pfosten/Holme dort hinein, Gitter als eigenes Mesh in `parent` |
| `art` (Poller) | `anfahr` · `stadt` | Industrie (gelb, Gummikappe) · Gehweg (graphit, Kuppel, Reflexring) |
| `frei` (Absperrung) | `true` · `false` | freistehend mit Fußplatte · in einer Türlaibung geklemmt |
| `zone` | Zonen-Id | Band und Pfosten fallen beim Kauf (`zWand`) |

Kollision bleibt beim Aufrufer (`col(...)` wie vorher); die Rückgabe enthält die Rechtecke für künftige Stellen.
Jedes Mesh trägt `userData.bauteil` (`zaun`, `absperrung`, `anfahrschutz`; Poller im Sammler des Aufrufers: `tor`, `stadtmoebel`),
`userData.bauteilArt`, Zaun-Meshes zusätzlich `userData.zaunPfosten` = Liste der Pfosten (für `aussen.js`). Materialien: `MAT.vc(klasse)`,
`MAT.get('zaunGitter'|'gitterGelb')`, Band `bk.bandMat(text)` (eigenes Material je Aufdruck, einmal).

## 3. Welche Stelle nutzt was

| Stelle | Datei | Aufruf |
|---|---|---|
| Testfeld Süd + Ost | `05e-street.js` `buildZaun` | `doppelstab`, 2,0 m |
| LKW-Hof (Süd, Ost, West mit Einfahrt) | `05m-logistik.js` `logiHofBauen` | `doppelstab`, 2,2 m, West als **ein** Lauf mit `luecke` |
| Logistikzentrum Ost (3 Läufe) | `05h-ausbau.js` `buildLogistik` | `doppelstab`, 2,4 m, Lücke fürs Doppeltor (`bk.tor` gitter) |
| Versandhof V1 (3 Läufe) | `11e-palette.js` `buildVersandhof` | `doppelstab`, 2,0 m |
| Ladezone vor V1 (3 Felder) | `05h-ausbau.js` `ladezoneBauen` | `gitter`, 1,25 m, Sammler der Packstation |
| Palettierplatz je Stufe (West, Süd, Geländer Ost) | `05h-ausbau.js` `buildPackstation` | `gitter` 2,0 m ×2 + `gelaender` 1,1 m, Sammler je Stufe, Gitter über `reg` je Stufe |
| Tor-Poller R1–R5, V1 | `04z` `bk.tor` | `bk.poller` `anfahr` |
| Stadtpoller am Überweg + 2 vor dem Schaufenster | `05e` `stPoller`, `05f` `buildFacade` | `bk.poller` `stadt` im Stadtmöbel-Sammler |
| Mörser (Testfeld) | `05d-yard.js` | `bk.anfahrschutz` ×2 |
| Absperrband Testfeldtür, Lagertür, Packstation | `05h-ausbau.js` `testfeldSperre`, `lagerSperre`, `packSperre` | `bk.absperrung` |

**Gelöscht:** `zaunLauf` (05e), `gitterZaun`, `gitterGeo`, `vsGitterMat`, `sperrbandTex`, `sperrband` (05h), Versandhof-`zaun` (11e),
Vierkant-Poller mit Goldkappe (05f), Einzelkästen des Mörser-Anfahrschutzes (05d), drei Band-Materialien (`new MeshStandardMaterial`).
Nicht in diesem Schritt: Gitterbox (Regal, Schritt Regale), Halle-Branch `hvZaun` (Schritt 9), Hofmauern `brickMat` (05g, Schritt Fassade).

## 4. Messung (neues Spiel, alle Ausbauten gekauft, Stufe Hoch, swiftshader 640×400; `tools/fundament/messen3.js` mit `pre.js`/`post.js`)

MESSUNG_ZAEUNE

## 5. Bilder (`docs/fundament/zaeune/`)

BILDER_ZAEUNE

Neu erzeugen: `node -r tools/test/ladezeit-preload.js tools/fundament/bauteilbilder.js <real.html> <ordner> [iso]` (`VIEWS=zaun-testfeld,…`).

## 6. Tests

TESTS_ZAEUNE

## 7. Offen / für Tom

- **Versandhof-Zaun** und **Laden-Poller** sehen jetzt anders aus (siehe 1.) – bitte abnehmen.
- `plexi` (Spritzschutz/Sichtschutz aus Acrylglas) gibt es im Spiel heute nicht – als Art erst anlegen, wenn eine Stelle sie braucht (z. B. Halle/Produktion).
- Die Übersicht (`katalog-seite.js`, Tabelle `VORHER`) führt Zäune/Poller noch als „nicht im Baukasten“ – beim Zusammenführen mit dem Übersichts-Generator streichen (dessen Branch bearbeitet die Datei gerade).

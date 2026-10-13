# Baukasten und Materialbibliothek – Schnittstelle (Fundament Etappe 2)

Tom, 13.10.2026: „einheitliche Struktur – ändert man es an einer Stelle, ändert es sich überall.“
Grundlage für die Stilregeln (Etappe 3) und die Wächter-Tests (Etappe 5).

**Regel: nie daneben neu bauen.** Fehlt eine Farbe, ein Material, eine Textur oder ein Bauteil,
wird es hier ergänzt – nicht lokal in der Baufunktion angelegt.

## 1. Materialbibliothek `MAT` (`src/parts/01b-material.js`, im Build direkt nach `reuse-helpers.js`)

| Aufruf | Liefert | Geteilt? |
|---|---|---|
| `MAT.farbe('signalGelb')` | Hex-Zahl (sRGB) aus `MAT.FARBE` – für Vertexfarben/Sammler | – |
| `MAT.get('zaunPfosten')` | benanntes Material aus `MAT.REZEPT` | ja |
| `MAT.std(0xf2c230,{roughness:0.7})` | wie `std(hex,o)`, aber ein Objekt je Farbe+Optionen (nur einfache Werte, keine Texturen/Farben-Objekte) | ja |
| `MAT.basic(0xf2c230)` | wie `new MeshBasicMaterial({color:hex})` | ja |
| `MAT.vc('lack')` | Vertexfarben-Material je Klasse: `standard` (= `vcMat`, r 0,45), `lack`, `metall`, `matt`, `glas`, `leucht` | ja |
| `MAT.neu('signalGelb',{opacity:…})` | eigenes, veränderbares Material nach Rezept (gezählt) | nein |
| `MAT.kopie(m)` | frische eigene Kopie eines geteilten Materials (gleiche Werte) | nein |
| `MAT.tex('beton')` | geteilte prozedurale Textur (lazy, einmal gemalt): `beton`, `doppelstab` | ja |
| `MAT.kachel(geo,rx,ry)` | skaliert die UVs der Geometrie – ersetzt `texture.repeat.set(rx,ry)` bei geteilten Texturen | – |
| `MAT.stufe()` | `{name, rang, tx, aniso, lambert, lod}` – Grafikstufe, beim Laden fest | – |
| `MAT.liste()` | Materialien/Texturen mit Abrufzählern (für Wächter-Test und Übersicht) | – |

**Geteilt heißt: nie verändern.** Kein `color.set/copy`, `opacity`, `transparent`, `emissiveIntensity`,
`map`, `visible`, `dispose` … auf einem Material aus `get/std/basic/vc/tex`. Wer ein Material
später ändern will (Ampel, Lampe in `lampMats`, Regalfarbe, Hervorhebung, Ausblenden), nimmt
`MAT.neu(...)` oder ein eigenes Material. Lampen (`lampMats`) und Tore folgen in eigenen Schritten.

- **Grafikstufe:** Ultra Low bekommt über den Lambert-Austausch in `reuse-helpers.js` automatisch
  einfache Materialien – `MAT` baut über `THREE.MeshStandardMaterial`, nichts extra nötig.
- **Pracht (Maximum+, `03d-pracht.js`):** entscheidet Spiegelboden und innen/außen je Material.
  Damit geteilte Materialien dort genauso aussehen wie vorher eigene, bekommt jeder weitere Ort
  (flacher Boden ja/nein, innen/außen) automatisch eine `MAT.kopie` (`prTeilen`).
- **Wächter:** `localStorage bb_matwache=1` (oder `window.__MATWACHE=true` vor dem Laden) bewacht
  alle geteilten Materialien; jede Veränderung landet mit Aufrufstelle in `MAT.verstoesse`.
  Test: `src/tests/material.js` (Gameplay-Vorführung + ein Spieltag + Tag/Abend/Nacht, Gegenprobe
  `GEGENPROBE=1`).

### Ein Material ergänzen
1. Farbe fehlt → `FARBE` (Name deutsch, sprechend, Hex wie im Spiel; keine stille Farbänderung).
2. Material → `REZEPT` (`f` = Farbname oder Hex, `r`/`m` = roughness/metalness, `tex` = Name aus
   `TEXTUR`, sonst normale Material-Optionen).
3. Textur → `TEXTUR` (Malfunktion einmal, `RepeatWrapping`, Maßstab über `MAT.kachel`).
4. Aufrufen mit `MAT.get(name)`; bei Einzelfarben ohne Namen reicht `MAT.std(hex,o)`.

## 2. Baukasten `bk` (`src/parts/04z-baukasten.js`, im Build vor `05-world.js`)

| Aufruf | Zweck |
|---|---|
| `bk.lod()` | 0 = Ultra Low, 1 = Niedrig…Hoch, 2 = ab Maximum |
| `bk.kasten(w,h,d,{fase,anteil,faseMin,seg,lod0Kasten})` | Kasten gefast oder einfach (Fase ≤ `fase`, ≤ `anteil`·kleinste Kante) |
| `bk.sammler(opt)` | viele Teile → je Oberflächenklasse **ein** Mesh mit Vertexfarben |
| `bk.schild(parent,{text,unter,b,h,x,y,z,ry,bg,fg,px})` | Schild im Hausstil (Nachtblau/Gold), Textur-Cache je Text+Größe |

Sammler (`opt`: `form` = Kastenform wie `bk.kasten`, `klasse` = Standardklasse, `reihenfolge`,
`mats` = eigene Materialien je Klasse statt `MAT.vc`, `bauteil` = Name für `userData.bauteil`):
```js
const S=bk.sammler({form:{fase:0.012,seg:2,lod0Kasten:true},bauteil:'versandtor'});
S.box(w,h,d,x,y,z,farbe,klasse,rx,ry,rz);  S.zyl(r1,r2,h,seg,x,y,z,farbe,klasse,rx,ry,rz);
S.rund(w,h,d,r,x,y,z,farbe,klasse);  S.geo(geo,matrix,farbe,klasse);  S.pivot(x,y,z,rx,ry,rz);
S.fertig(parent,{schatten,bauteil,fest});   // -> Mesh[] je Klasse, userData.bauteil/klasse
S.geometrie(klasse);                         // nur verschmolzene Geometrie (z. B. geteilte Palette)
```
Umgestellt (13.10.): `geraetBau()` (06, Kasse/SB-Terminal/Gravur – jetzt dünne Hülle),
V1-Versandtor (`buildVersandhof`, 11e), Palettengeometrie (`vsHolzGeo`, 11e), `vcMat` (04) = `MAT.vc('standard')`.
Noch eigene Sammler (Folgeschritte): Stadthäuser `hausKit`/`hzAdd` und Stadtmöbel `stM` (05e, eigene
Atlas-/Lichtmaterialien), Stadt `sammler()` (05j), Halle `hvSammler` (Branch, Schritt 9).

### Ein Bauteil ergänzen
Erst prüfen, ob es das Bauteil schon gibt (hier und in der Umbauliste `inventar-optik.md` §5).
Neues Bauteil = Funktion `bk.<name>(o)` in `04z-baukasten.js`: Parameter statt Kopie, Teile über
`bk.sammler`, Materialien nur aus `MAT`, Rückgabe enthält Spiellogik-Haken (Kollision, Treffer,
bewegte Teile) statt sie intern zu verdrahten, jedes Mesh mit `userData.bauteil`.

## 3. Messung Schritt 0+1 (13.10., neues Spiel, alle Zonen offen, Stufe Hoch, swiftshader)

| Größe | vorher | nachher |
|---|---|---|
| Material-Objekte im Szenengraf | 988 | 563 |
| davon Dubletten (gleiche Signatur) | 519 | 114 (Rest: Tore, Lampen/`lampMats`, veränderliche Materialien – Schritte 2 und 5) |
| Texturen im Graf / Rohpixel | 250 / 241,7 MB | 225 / 235,4 MB (Beton 19→1, Doppelstabmatte 9→1) |
| Meshes | 2 653 | 2 653 (Schritt 0/1 bündelt keine Geometrie um) |
| Zeichenaufrufe nach Laufzeit-Bündelung (Laden/Lager/Lagerdock/Testfeld/Dock-Hof/Halle W/Straße) | 681/630/674/431/796/329/122 | 626/576/631/392/764/323/123 |
| Schattenpass je Ansicht | 385–501 | 369–487 |
| von der Laufzeit-Bündelung eingespart | 1 071 Meshes | 1 284 Meshes (geteilte Materialien bündeln besser) |

Bildvergleich (`tools/fundament/bilder.js` + `bildvergleich.py`, 8 Ansichten × Tag/Abend/Nacht,
Hoch und Ultra Low, Max für Laden/Lager/Dock-Hof): gleich bis auf das Rauschmuster des Betonbodens
(eine geteilte Textur statt 19 einzeln gewürfelter; ≤ 0,85 % der Pixel, Abweichung ≤ 16 Stufen fast überall).
Restunterschiede in Hof/Straße/Testfeld liegen im Grundrauschen (alt gegen alt gleich groß: Uhr, Scanner,
Vögel, Schnee).

## 4. Katalog (Übersicht mit Bildern, wiederholbar)

`node tools/fundament/katalog.js <real.html> <ausgabeordner>` startet ein neues Spiel (alle Zonen offen) und schreibt
`katalog.json` plus Bilder: jedes Material (Bibliothek `MAT.liste()` und die heute noch eigenen, nach Signatur
gruppiert) als Kugel + Kachel, jede Textur (Dubletten über Pixel-Hash zusammengefasst, Größe/MB, Nutzung, Herkunft),
jedes Bauteil mit `userData.bauteil` (isoliert gerendert, Varianten, Fundorte) und die wiederkehrenden Objekte, die noch
nicht im Baukasten stehen (Tore, Fenster, Regale, Kassen, Lampen, Zäune, Poller; Tabelle `VORHER` in
`tools/fundament/katalog-seite.js`). Neue Baukasten-Bauteile erscheinen ohne Änderung automatisch; ein Objekt, das in den
Baukasten wandert, wird aus `VORHER` gestrichen. Die Herkunft („Baufunktion“) kommt aus dem Zähl-Wrapper
`pre.js`/`post.js`, den der Generator selbst einbaut (`KATALOG_PROFIL=0` schaltet ihn ab). Bilder ~3 MB, Lauf ~10 Min.

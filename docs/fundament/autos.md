# Autos – Baukasten `bk.auto` / `bk.autos` (17.10.2026)

Tom, 17.10.: „Die Autos draußen sehen immer noch nicht realistisch genug aus. Die Form und so – da musst du nochmal dran.“

## 1. Was vorher war
`makeAuto(col,form)` in `05e-street.js` (Neubau 03.10.): ein rundum gleich verrundeter, verformter Würfel je Auto,
jedes Auto neu gerechnet, ~23 000 Dreiecke und 5 Zeichenaufrufe je Auto (Straße: 7 Autos = 35 Meshes, 162 000 Dreiecke).
Stumpfe, senkrechte Stirn, kleine Leuchten, Kühlergrill als dunkles Rechteck, Maße geschätzt. Materialien eigen in 05e
(`_lackM`, `_glasM` …), Kennzeichen-Textur als eigenes Schild (Ausnahmeliste).

## 2. Vorbilder und Maße (Herstellerdaten, per Exa geprüft)
| Form | Vorbild | L × B × H (m) | Radstand | Überhang v/h | Spur | Reifen | Quelle |
|---|---|---|---|---|---|---|---|
| `klein` | VW Polo VI | 4,05 × 1,75 × 1,46 | 2,55 | 0,78 / 0,72 | 1,50 | 195/55 R16 (r 0,310) | VW Polo Spec (vw.co.za, 2021): 4053 × 1751 × 1461, RS 2548, Spur 1499/1479 |
| `kompakt` | VW Golf 8 | 4,28 × 1,79 × 1,46 | 2,63 | 0,86 / 0,79 | 1,54 | 225/45 R17 (r 0,317) | VW-Abmessungsblatt Golf 8 (01/2025): L 4284, B 1789, H 1456, RS 2636, Spur 1534–1550 / 1502–1526 |
| `limo` | BMW 3er G20 / Passat | 4,70 × 1,83 × 1,45 | 2,84 | 0,80 / 1,06 | 1,58 | 225/45 R18 (r 0,330) | Mittelklasse-Stufenheck (3er G20: 4709 × 1827 × 1442, RS 2851) |
| `kombi` | VW Passat Variant | 4,80 × 1,83 × 1,50 | 2,79 | 0,88 / 1,13 | 1,58 | 235/45 R18 (r 0,334) | Passat Variant B9: 4917 × 1849 × 1497, RS 2841 (motor1, VW-Abmessungsblatt); Octavia Combi 4,69 m – Mittel ≈ 4,8 m |
| `suv` | VW Tiguan (2024) | 4,54 × 1,84 × 1,65 | 2,68 | 0,90 / 0,96 | 1,586 | 235/55 R18 (r 0,358) | VW Tiguan Spec 2024: 4539 × 1842 × 1631–1660, RS 2676, Spur 1586/1578, Bodenfreiheit 191 mm |
| `van` | VW T6.1 Kastenwagen | 4,90 × 1,90 × 1,99 | 3,00 | 1,00 / 0,90 | 1,63 | 215/65 R16 C (r 0,343) | VW Nutzfahrzeuge T6.1: 4904 × 1904 × 1990, RS 3000, Überhang 998/906 |

Reifenradius = Felge/2 + Flankenhöhe (z. B. 225/45 R17: 0,216 + 0,101 = 0,317 m). Die Räder stehen 12 mm eingefedert
(Radmitte = Radius − 12 mm), der Reifen ist unten abgeplattet. Luft im Radlauf 4,5 cm (SUV 5,5, Transporter 5 cm).

Lackfarben (`bk.AUTOFARBEN`) nach VDA/KBA-Neuzulassungen 2024 (ADAC/VDA, 12/2024): Grau/Silber 33 %, Schwarz 26,6 %,
Weiß 19,9 %, danach Blau, Rot, Grün. Neue Paletten-Töne `autoSilber`, `autoGrau`, `autoHellgrau`, `autoSchwarz`,
`autoWeiss`, `autoBlau`, `autoRot`, `autoGruen`, `autoBeige` (eigene Bedeutung „Fahrzeuglack“).

## 3. Wie das Auto gebaut ist
- **Seitenprofil** je Form (`bk.AUTO`): Stoßfänger, Nase, Front unter der Haubenkante, Haubenvorderkante, Fuß der
  Frontscheibe, Gürtellinie (steigt nach hinten), Heck je Typ (`schraeg` Fließheck, `stufe` Kofferraum, `steil`
  Kombi/SUV, `kasten` Transporter), Boden mit Radläufen. Ecken als Kreisbögen (`_akKontur`).
- **Unterbau** und **Kabine** je als `THREE.Shape` → `ExtrudeGeometry` mit Fase nur nach innen (die Wände liegen genau auf
  der Kontur). Die Seitenflächen werden in Spalten neu trianguliert (`_akMono`, keine langen Splitter), dann **verformt**:
  - Grundriss vorn/hinten eingezogen und gewölbt (Front-Mitte steht vor), Kotflügel über den Rädern ausgestellt,
  - Querschnitt bauchig (unten zum Schweller eingezogen), **Sicke** (Tornadolinie) 11,5 cm unter der Gürtellinie,
  - Kabine nach oben schmaler (Tumblehome 14–17 %, Transporter 5 %), zur Frontscheibe eingezogen, Dach und Haube gewölbt.
  Normalen der Seitenflächen werden aus der Verformung gerechnet (glatte Spiegelung im Lack).
- **Details auf der Fläche** (Abbildung + Abstand entlang der Normale, `_akAuf`): Seitenfenster aus der Kabinenkontur
  (Rahmen und B-Säule Klavierlack, Scheiben eingesetzt, Zierleiste bei Limousine/Kombi), Scheinwerfer an der Ecke und weit
  auf den Kotflügel gezogen (Gehäuse, Reflektor, Tagfahrlicht, zwei Linsen), Grill (SUV/Transporter groß), Lufteinlass mit
  Streben, Luftvorhänge mit Nebellicht, Frontlippe, Rückleuchten um die Ecke (Leuchtband bei Kompakt/SUV), Diffusor,
  Reflektoren, Tür-/Hauben-/Heckklappenfugen, Griffe, Tankdeckel, Spiegel mit Blinker, Wischer, Dachreling, Antenne,
  Kennzeichen (EU-Format 520 × 110 mm, 16 Fantasie-Schilder), Schiebetür beim Transporter, Planken beim SUV.
- **Räder**: Reifen als Drehkörper mit Flanke und Profil (Relief), Felge mit Horn, Ring und Speichen (5 Stile), Nabe,
  dunkles Felgenbett, Bremsscheibe und Sattel; innen eine dunkle Radhaus-Wand.

## 4. Schnittstelle
```js
bk.auto({form,farbe,licht,kennzeichen,detail,lod,abstand,parent,x,y,z,ry})   // EIN Auto -> Group (Kinder je Material)
bk.autos([{form,farbe,x,y,z,ry,licht,kennzeichen}],{parent,lod,abstand,detail}) // Reihe -> THREE.LOD (nah/fern), je Material EIN Mesh
bk.AUTO            // Maße und Gestalt je Form (oben)
bk.AUTOFARBEN      // [Ton, Gewicht] – bk.autoFarbe(r) zieht einen Ton
bk.autoNacht(f)    // 20-loop/applyTOD: Spiegelung dimmen, Licht an (f > 0,5)
bk.autoInfo()      // Dreiecke je Form/Stufe im Cache
```
`form`: klein, kompakt, limo, kombi, suv, van. `farbe`: Ton aus `MAT.PALETTE` (auto*) oder Hex. `detail`: auto (aus der
Grafikstufe), fein (Niedrig–Hoch), fein2 (ab Maximum), einfach (Ultra Low), grob (Ferne). `licht`: Scheinwerfer und
Rückleuchten leuchten nachts. Jedes Mesh trägt `userData.bauteil='auto'` und `userData.klasse`.

**Materialien** (alle `MAT`): `autoLack` (Klarlack, Farbe je Ecke eingebacken), `autoGlas` (Scheiben, Leuchtengläser,
Klavierlack), `autoChrom` (Felgen, Reflektoren, Zierleisten), `autoGummi` (Reifen mit Relief `reifenProfil`, Kunststoff,
Fugen, Radhaus), `kennzeichen` (Atlas), Licht `MAT.vc('leucht')`. Umgebung `MAT.tex('umgebungStrasse')` (auch für
Häuserfenster und Parkteich). Lack/Glas/Chrom über `MAT.neu`, weil nachts die Spiegelung gedimmt wird.

**Verwendet**: geparkte Reihe gegenüber (`05e-street.js`, 7 Autos, Handy 4; Formen nach Bestand, ein Wagen wartet mit
Licht), Testzugang `__bb.makeAuto(farbe,form)` = `bk.auto`. Fahrender Verkehr ist weiterhin nur Lichtpunkte in der
Ferne (`05j-stadt.js`, nachts) – kein Fahrzeugmodell.

## 5. Messung
(siehe Abschnitt 6 – wird mit den Messwerten gefüllt)

## 6. Bilder
`docs/fundament/autos/vorher/` und `docs/fundament/autos/nachher/`: je Form `seite`, `vorn34`, `heck34` (Hoch), Straße
`strasse`/`strasseNah` bei Tag und Nacht, Limousine und SUV nachts; Ultra Low mit Endung `-ultralow`.
Werkzeug: `tools/fundament/autos-bilder.js <real.html> <ordner> <gfx> [bilder,zaehlen,modell]`.

## 7. Grenzen (ehrlich)

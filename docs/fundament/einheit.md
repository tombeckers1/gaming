# Einheit – Regale, Kassen, Fenster, Türen, Schilder, Bodenmarkierungen (Fundament-Schritt 4, 15.10.2026)

Tom (Reihenfolge freigegeben, UEBERGABE.md 00 Punkt 4): „Regale, Kassen, Fenster, Türen, Schilder, Bodenmarkierungen –
Größen und Arten bleiben, nur die Bauweise wird einheitlich.“ Je Kategorie **ein** Baukasten-Bauteil mit Parametern, Farben nur
aus `MAT`, alle Fundorte umgestellt (keine Kopie daneben). Branch `claude/einheit` (ab V138 / 8007f51).

## 1. Inventar vorher (je Kategorie: Fundorte, Varianten, Maße)

### 1.1 Regale – drei Bauweisen, drei Farbsysteme
| Fundort | Funktion | Arten / Maße | Bauweise vorher |
|---|---|---|---|
| 06-fixtures.js | `createShelf` + `bauMoebel` | `SHELFKIND` (02-data): klein 1,0 × 0,52 (3 Fächer), standard 2,0 × 0,52 (4), hoch 2,0 × 0,52 (5), kühl 1,1 × 0,58 (4, Glastür), gondel 2,0 × 0,5 beidseitig (8), eck 1,2 × 0,5 zwei Schenkel (8), groß 2,12 × 0,68 (2), kasse 2,0 × 0,5 (5); tisch 2,0 × 0,94, tischgroß 2,0 × 1,86; gitter 1,0 × 0,94, gitter2 1,9 × 0,94, gitter3 1,9 × 1,86 | Gestell je Warenseite gemergt (Vertexfarben, eigenes Material r 0,72), Rückwand `pegMat` (Textur repeat 5 × 5 – Lochabstand je nach Breite 2–5 cm), Kassenregal eigenes Lochblech-Material + 2 Edelstahlleisten, Kühlregal 2 Glas + 5 Alu-Einzelmeshes + eigene „GEKÜHLT“-Textur je Regal, Gitterbox 4 Gitter-Planes, Eckregal 2 eigene Materialien (`std(RF…)`) |
| 06-fixtures.js | `createRack` + `rackMats` | `RACKKIND`: standard 2,44 × 0,6, h 2,34 (3 Ebenen × 3 Plätze), hoch 2,44, h 4,26 (5 × 3), schwer 3,30 × 0,84, h 4,20 (4 × 4) | 4 Stützen einzeln (Lochtextur blau #2f5d9e), Boden je Ebene ein Mesh, Rahmen gemergt (eigenes Material), Traversen mit zwei Extra-Orangetönen (#f08a3a, #b4520f) |
| 11d-packmaterial.js | `vmRegalBauen` | Packmaterial-Regal 0,55 × 0,58 × 1,76, 4 Böden, je Packplatz (bis 3) | in den Stations-Sammler, Böden **Aluminium** statt verzinkt |
| 08b-truck.js | `regalPaketMat` / `regalPaketGeo` | Flachpaket eines Regals | eigene Textur + Material, Geometrie ungenutzt |
| 06 (tot) | `shUp`, `shBoard`, `shRail`, `shSide`, `rackBlue`, `rackOrange`, `deck` | – | angelegt, nie benutzt |
| 04z | `bk.hochregal` (Halle) | Palettenhochregal 9,95 m | schon Baukasten (Stützen Signalblau, Traversen Signalorange) – Vorbild für die Lagerfarben |

### 1.2 Kassen
| Fundort | Funktion | Maße | Bauweise vorher |
|---|---|---|---|
| 06-fixtures.js | `buildCheckout` | Kassenplatz 3,2 × 0,8 m, Band 1,45 m, Monitor auf Arm, Tastatur, Scanner | ~30 Einzelmeshes, freie Materialien (Korpus r 0,42, Blende #e9ebee, Sockel r 0,6), 3 eigene Texturen (Scanner 512², Tastatur 768 × 384, Band 512 × 256), „NÄCHSTER KUNDE“ eigene Textur |
| 06-fixtures.js | `sbTerminal` (×2) | SB-Terminal 0,78 × 0,66 + Korbablage + Waage | Geräte-Sammler (`geraetBau`), Korpus eigenes Material (r 0,36), Sockel Gummischwarz (Kasse: Anthrazit) |
| 06-fixtures.js | `buildSBKasse` | Tafel 3,6 m „SB-KASSEN“ | Tafel + Pfosten Einzelmeshes, eigene Schildtextur |

### 1.3 Fenster
| Fundort | Funktion | Anzahl | Bauweise vorher |
|---|---|---|---|
| 05c-buildworld.js | Schaufenster Basisladen | 2 Felder 5,2 × 1,5 m + Türzarge | Glas eigenes Material (Deckkraft 0,16), Profile Einzelmeshes |
| 05f-facade.js | Sohlbank, `buildWindowGrime` | 2 + 2 | Sohlbank **Anthrazit**, Schmutz eigene Textur `grimeTex` |
| 05e-street.js | `nachbarFassade` (Erweiterungen) | je Achse 1 Feld | eigenes Glas je Erweiterung, Profile Einzelmeshes, Sohlbank **hellgrau** (`kunststoffHellgrau`) – am Basisladen hatte Tom das Hellgraue schon entfernt |
| 05l-eingang2.js | `eingangsAchse` | 2 Festfelder + „zu“-Scheibe | Glas/Profil von 05e durchgereicht |
| 05h-ausbau.js | `lagerFensterWand` | 3 Flügelfenster 1,7 × 1,25 m | Glas **dunkel blaugrau** #5d7288, Deckkraft 0,38, Bank außen Alu |
| nicht umgestellt | Stadthäuser `fenster` (05e, 123 ×, hausKit-Atlas), Läden gegenüber (Atlas), Werk (`wkGlas`, schon `glasScheibe`), Pforte (Sammler), Logistik-Büro (Fassadentextur) | | Außenwelt-Paket bzw. schon einheitlich |

### 1.4 Türen
| Fundort | Funktion | Anzahl | Bauweise vorher |
|---|---|---|---|
| 05f-facade.js | `buildSchiebetuer` | 2 (Haupteingang, Eingang 2) | ~30 Einzelmeshes, eigenes Glas (0,17) |
| 04z | `bk.drehtuer` | Werk West 13, Kartonlager 1, Zellentüren in `bk.zelle` | schon Baukasten, aber eigener Name neben `bk.tuer` |
| 05h-ausbau.js / 05q | `streifenvorhang` + `pvcMat` | 4 | eigenes Material |
| nicht umgestellt | Haustüren Stadt (`hausTuer`/`tuerTex`, 9 ×, hausKit) | | Zufallsvielfalt, Außenwelt-Paket |

### 1.5 Schilder – sechs Stile für gleiche Sachen
Nachtblau/Gold mindestens 12 × einzeln gemalt; Stationsschilder am Testfeld in **drei** Stilen (Zündtisch gelb/schwarz, Abschussröhren
rot/weiß, Mörserbatterie nachtblau/gold); Durchgangsschilder in zwei (LAGER/TESTFELD gelb, LAGER·GROSSHANDEL nachtblau); Brandschutz
und Fluchtweg über freie `bg/fg`. Fundorte: 05c (LAGER), 05d (`schild()` Pfosten ×3), 05e (`warnSchild`/`warnTex`), 05f (`signFaceTex`
Ladenlogo, Hausnummer), 05g (WARENEINGANG), 05h (LAGER·GROSSHANDEL, TESTFELD, LAGER-PC), 05l (EINGANG 2), 05m (LOGISTIKHOF,
LOGISTIKHALLE · STUFE n), 05q/05r (Brand, Flucht), 06 (SB-KASSEN, NÄCHSTER KUNDE, GEKÜHLT), 11d (Packmittel ×5 je Regal), 11e
(`ddlSchildTex`), 17b (`schild()` Kategorie-Marke).

### 1.6 Bodenmarkierungen
`flat()`-Striche mit Einzelmaterial: 05g Dock (26 + Endlinie), 05m Logistikhof (4 Stellplätze × 8 + 2 Wartespuren), 05h Logistik Ost (8),
05r Stellplatz R6 (8); `MAT.basic`-Striche 11e Versandhof; gemalte Texturen: Bodenschrift ANLIEFERUNG (05g), VERSANDHOF (11e),
Wareneingang (05c), WARENANNAHME auf dem Gehweg (05h), Versandbereich `reserveTex` (05h), Ladezone V1 (05h), Palettierstation je Stufe
(05h), Packplatz-Fläche + PACKPLATZ n (05h). Schon Baukasten: 05q Halle, 05r Werk (`bk.bodenmarkierung`).

## 2. Bauweise nachher (je Kategorie EIN Bauteil)

| Kategorie | Bauteil | Arten / Parameter | Fundorte umgestellt |
|---|---|---|---|
| Regale | `bk.regal(o)` | `art:'laden'` (alle SHELFKIND) · `'lager'` (alle RACKKIND) · `'fachboden'` (in fremden Sammler) | createShelf, bauMoebel, createRack, rackMats, vmRegalBauen, regalPaketMat (6 Baufunktionen) |
| Kassen | `bk.kasse(o)` | `art:'kasse'` · `'sb'` · `'sbTafel'` | buildCheckout, sbTerminal, buildSBKasse (3) |
| Fenster | `bk.fenster(o)` | `art:'schaufenster'` (felder, zarge, pfosten, schmutz) · `'fluegel'` (mit Wand) | 05c, 05f (Sohlbank, Schmutz), 05e, 05l (2), 05h lagerFensterWand (6 Stellen) |
| Türen | `bk.tuer(o)` | `art:'schiebe'` · `'stahl'|'brand'|'glas'` (Drehflügel, vorher bk.drehtuer) · `'streifen'` | buildSchiebetuer, bk.drehtuer (13 Aufrufe 05r/05q), streifenvorhang (3 Stellen) |
| Schilder | `bk.schild(parent,o)` | Stile `bk.SCHILD`: haus · info · warn · tafel · brand · flucht; `malen` (Sonderschild: Ladenlogo, DDL, Kategorie-Marke), `pfosten`, `rueck`, `leucht`, `doppel` | 23 Stellen (Liste 1.5) |
| Bodenmarkierungen | `bk.bodenmarkierung(o)` | + gestrichelt (`strich`/`luecke`), `lkw` (Stellplatz), `schriften`, `flaechen` art `frei`, Warnrand `farbe:'sperr'`, `boden(x,z)` (folgt dem Gehweg) | 05c, 05g, 05h (6), 05m (2), 05r, 11e (12 Stellen) |

**Was sich sichtbar ändert (nur Vereinheitlichung):**
- Lagertechnik einheitlich: Stützen Signalblau, Traversen Signalorange ohne Extra-Töne, Böden verzinkt **Silbergrau** – auch das
  Packmaterial-Regal (vorher Aluminium-Böden). Lochabstand der Ladenregal-Rückwand überall 5 cm (vorher je Breite 2–5 cm).
- Ladenmöbel und Kassen in Oberflächenklassen statt freier Werte (Gestell `kunststoff` 0,6 statt 0,72; Kassen-Korpus `lack` wie das
  SB-Terminal). SB-Sockel Anthrazit wie die Kasse (vorher Gummischwarz).
- **Ein Glas** für alles (`glasScheibe`, Deckkraft 0,24): Schaufenster, Schiebetüren, Lagerfenster (vorher dunkel 0,38), Kühlregal.
- Sohlbank der Erweiterungen Anthrazit wie am Basisladen (vorher hellgrau); Lagerfensterbank außen Anthrazit.
- Schilder nach Bedeutung: Stationsschilder Testfeld alle Hausstil; Durchgangsschilder (LAGER, TESTFELD) Hausstil statt gelb;
  Kühlregal-Schild und Packmittel-Kopf `info` (Signalblau); Warentrenner Hausstil.
- Bodenmarkierung: Linien 0,12 m (vorher teils 0,14), Bodenschrift überall Signalgelb auf dunklem Feld (WARENEINGANG/WARENANNAHME/
  PACKPLATZ vorher ohne Feld), Ladezone/Palettierstation Warnrand aus der geteilten Schraffur, Versandbereich gelbe Freihalte-Schraffur.

## 3. Messung (Vorführung aufgebaut, Vollausbau, Tag; `tools/fundament/einheit-bilder.js`)
(siehe Abschnitt 5 – wird nach dem Lauf eingetragen)

## 4. Bilder
`docs/fundament/einheit/` – je Ansicht `<ansicht>-<hoch|ultralow>-vorher.jpg` / `-nachher.jpg`.

## 5. Ergebnisse
(folgt)

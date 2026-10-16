> **VERWORFEN (Tom 16.10.2026):** große Halle, Hochregal, Werk und Produktion sind komplett zurückgebaut und aus dem Code gelöscht – siehe `docs/rueckbau/rueckbau.md`. Diese Datei ist nur noch Verlauf (Stand V141, a3baa21).

# Halle Etappe B – Werk West (Kapitel 8 / 8.2 / 8.3), gebaut 15.10.2026

Bauvorgabe: `plan-1410.md` (Etappe B), Maße: `skizze-1410.html` (Z/TORE/WEGE/STRASSEN), Optik: `docs/uebergabe/produktion-referenz.webp`.
Code: `src/parts/05r-werk.js` (Welt, Schau-Betrieb), Bauteile in `04z-baukasten.js` (`baukasten.md` §2c), Test `src/tests/werk.js`.

## Was es im Spiel gibt
- **Ausbauten** (Kapitel 8 ist nicht mehr „geplant“): `fabrik` – Pyro-Werk: Werkhalle + Straße 1 Raketen + Hochregal-Gasse 2 mit RBG
  (Level 33, setzt `lagerlogistik` voraus, eröffnet Kapitel 8); `fabrik2` – 8.2 Kugelbombenstraße + Gasse 3 mit RBG (Level 35);
  `fabrik3` – 8.3 Batteriestraße (Level 37). Preise `WIRT.ausbau.preis.fabrik/fabrik2/fabrik3`.
- **Gebaut wird erst beim Kauf** (Zone `fabrik`, `wkBauen`), Straßen 2/3 erst mit ihrem Ausbau (`wkStrasseBauen`). Vorher liegt nichts im Speicher.
- **Werk** x −100…−70 / z −34…−7, 6 m: Trapezblech außen, Lagerwand innen, Leichtdach (helles Trapezblech, Lichtbänder über den
  Straßen – innen Tageslicht nach Sonnenstand, nachts dunkel), Fachwerkbinder alle 5 m, LED-Hallenleuchten über den Gängen.
- **Verbindungsbau** x −70…−66 zwischen zwei **Brandwänden** (Beton, Feuerrot-Streifen, „BRANDWAND“-Schilder, 60 cm über Dach):
  Feuerschutztüren zweiflügelig bei z −9 (offen auf Feststellanlage), Förderöffnungen mit **Brandschutzabschluss** (Gehäuse, Führungen,
  Rauchmelder; geschlossene Blende, solange die Straße nicht läuft), **Sammelförderer** längs, Übergaben in die West-Enden der Gassen.
  Die Brandwand x −66 ersetzt die Westwand der Halle Stufe 3 (`WK_ALT`).
- **Räume** (Skizze `Z`): Inertlager (Paletten, Fachbodenregal, Senkrechtförderer), QS-Labor (Labortisch, Waage, Röntgen, Abzug),
  **Leitstand auf der Galerie +3,2 m** mit Glasfront zu den Straßen, Pult und sechs Bildschirmen (Status je Straße, `wkMonitore`), Technik
  darunter (zu), **Treppe** (zwei Läufe mit Podest 1,6 m, gelbe Geländer), Umkleide/ESD (Spinde, Prüfgerät, Erdungsplatte, Werkseingang
  Glastür zur Straße), Sternhaus (drei Dragiertrommeln drehen, Gummiboden, Werkbank Holz/Messing), drei Trockenkammern, drei Chemie-Boxen
  (Betonzellen: Oxidatoren | Metallpulver/Brennstoffe | Schwarzpulver), Annahme mit **Tor R6** (`bk.tor`, Gebinde auf Paletten, Fahrweg),
  Satz-Ausgabe (Betonbunker), Leergut (Palettenstapel, Ausschussbehälter, Gitter). Satzkanal als Riffelblech-Abdeckung am Boden.
- **3 Straßen × 7 Stationen** (Skizze `STRASSEN`, Station 2,571 m): Zellen = `bk.zelle` (R2, R3, K2, K3, K6, B3, B4), offene Stationen
  = `bk.maschine` (Magazin, Anzündschnur, Prüfen, Verpacken, Wickler, Trockentunnel, Einspritzen, Verdämmen, Banderole) bzw.
  `bk.portalgreifer` (R4, B1 mit Rohrmagazin und `bk.rohrraster` wie im Referenzfoto), Rollenbahn `bk.foerderer`, Abwurf vom
  **Überkopf-Förderer** (4,2 m, hängend, vom Inertlager), **Palettierer** (Portal über der Ausgangspalette), Ausgangsförderer durch die
  Brandwand. Stationsschilder an Pfosten, Zellenschilder über der Nordtür, Straßenschild hängend.
- **Schau-Betrieb** (`wkTick`, eine Funktion, nur wenn sichtbar): Werkstückträger (je Straße 7 Instanzen) wandern im Takt 4 s eine Station
  weiter, Portale greifen in der Standzeit, Zellenampeln rot („Maschine läuft = Tür zu“), Kartonlagen wachsen auf der Palette, alle
  10 Takte fährt die Palette über den Sammelförderer durch beide Brandwände in die Gasse (`wkAusgabe`, zeitbasiert auch unsichtbar).
- **Außen**: Hof West x −104…−70 (Beton, Stellplatz vor R6, zwei Hofmasten), Zufahrt bis x −128, Werkszaun Doppelstab 2 m (West mit
  Einfahrt z −54…−47 + Schiebetor offen geparkt + Schild „WERK WEST“, Nord an der Straße, Süd), Vorplatz Nord, **Mischhaus** (`bk.zelle`
  ohne Band, Leichtdach, Kupferplatte, Ampel grün) im **Erdwall** (`bk.erdwall`, Lücke zur Hofseite), **Gefahrstoffweg** gelb schraffiert
  von der Gefahrstofftür West durch die Lücke zum Mischhaus. Straße/Gehweg/Asphalt reichen jetzt bis x −130 (`STR.XW`, 05e/05c),
  `STADT_FREI` bis x −128 (Stadtkulisse rückt).
- **Gehwege grün / Fahrwege gelb** wie in Etappe A (`bk.bodenmarkierung`): Gänge zwischen den Straßen (2,2 m), Randgänge (1,1 m), Querweg
  West, Verbindungsbau; Fahrweg Annahme, Sperrfläche im Schließbereich R6, Stellplätze. Fluchtweg-Schilder grün.
- **Restfehler Etappe A erledigt**: N1 ist ein echtes **PVC-Schnelllauftor** (`bk.tor` art `schnelllauf`), die **Personaltür x −40** ist eine
  echte Tür in einer neuen Nordwand (`bk.drehtuer`, öffnet beim Nähern; Spieler kommt zum Parkplatz und außen herum zum Werkseingang;
  im Wegenetz bleibt sie zu – Personal/Kunden laufen nicht hinaus, `nurNav`).

## Spieler, Wege, Kollision
- Welt nach Westen bis x −124 nur für den Spieler (`wkWeltX0`, 15-player). **Wegenetz unverändert** (23 320 Zellen, Aufbau 2,9–5,6 ms
  vorher/nachher gemessen): im Werk läuft (noch) kein Personal – ein Teilgitter kommt mit den Werkern im Produktions-Gameplay.
- **Bodenhöhe** `wkBoden` (Treppe, Podest, Galerie) → Kamera `1,65 + Boden` (15-player, `kameraSetzen`). Im Grundriss gibt es keine Stelle
  mit zwei Ebenen (Technik unter dem Leitstand ist zu), daher reichen 2D-Kollisionen.
- Test `werk.js`: Spieler geht Halle → Verbindungsbau → Umkleide → Treppe → Leitstand (Höhe 3,2 m, kein Sprung > 0,06 m), Umkleide → Werk
  → Gänge, Personaltür → Parkplatz → Werkseingang; Brandwände/Außenwände/Straßenblöcke sperren.

## Schnittstellen für das Produktions-Gameplay (nicht Teil dieser Etappe)
`WK.zustand[i] = {laeuft, takt, ausgabe}`, `wkStrasseSetzen(i, laeuft)` (stoppt die Straße, Ampeln grün, Zelle frei), `wkAusgabe(i)`
(Palette erreicht Gasse `WK_STR[i].gasse` – hier kommt später die Fertigware nach `S.hr`), `WK.produktion` (schaltet die Fixkosten
`WIRT.fix.werk` + `WIRT.fix.werkStrasse` je laufender Straße frei, `wkFixkosten`), `WK_STR[i].st` (Stationen mit Kürzel, Schritt, Zelle,
Maschine), Leitstand-Bildschirme `wkMonitore` (Status, Takt, Ausgabe).

## Preis und Amortisation (CLAUDE.md „Preise bestimme ich“)
`fabrik` 46.000 €, `fabrik2` 26.000 €, `fabrik3` 23.000 €. Sofort wirksam: je neue Gasse 35 €/Tag Betrieb (180 Palettenplätze).
Im Schau-Betrieb **keine Werk-Fixkosten und keine Erträge**. Für die spätere Produktion (Konzept: variable Kosten 45–60 % vom Einkauf):
eine Straße spart 40–55 % vom Einkauf ihrer Klasse; bei ~1.200 € Einkauf je Tag und Klasse in Kapitel 8 ≈ 550 €, minus Werker und Strom
≈ 250 € → **≈ +300 €/Tag je Straße**; `fabrik` mit Gasse 2 ≈ +360 €/Tag → **≈ 130 Spieltage**, `fabrik2/3` ≈ 85 bzw. 75 Spieltage.
Bewusst länger als 7.3 (38 Tage): größte Investition, lohnt nur mit Menge (Fixkosten gegen Marge). Mit dem Produktions-Gameplay im
Balancing-Paket messen und ggf. nachstellen.

## Leistung
- Gebaut wird erst beim Kauf; Straße 2/3 erst mit ihrem Ausbau. Gruppen: `WK_G` außen (Wände im Wandbild, Dach, Boden, R6,
  Werkseingang, Gefahrstofftür – immer), `WK_H` Werk-Inhalt inkl. Innenausbau (nur Kamera im Werk, über den Dächern oder aus dem
  Verbindungsbau durch Tür/Förderöffnungen x −70), `WK_V` Verbindungsbau (dazu aus dem Hauptgang Nord der Halle durch die Tür x −66),
  `WK_D` bewegte Teile (wie `WK_V`, Takt nur dann), `WK_A` Außenanlagen (nicht aus Werk/Halle/Lager/Laden).
- Instanzen: Werkstückträger je Straße ein InstancedMesh (7), Kartonlagen je Palette eins (4), Paletten über `bk.paletten`-Gruppen,
  Hallenleuchten zwei InstancedMesh; Zellen, Maschinen, Rohr-Raster je Straße in einen Sammler (wenige Meshes je Klasse).
  Kein Sonnenschatten unter dem Dach (nur Wände und Dach werfen ihn). Ultra Low: Stations-/Zellentafeln ohne Schrift (−21 Aufrufe),
  Kästen ohne Fase, weniger Segmente, Binder ohne Diagonalen.
- Messung (`tools/halle/messen.js`, alle Ausbauten gekauft, Laufzeit-Bündelung an, swiftshader; Haupt- + Schattenpass je Bild;
  vorher = V135/191d7ba, Rohdaten `messung-1510/`). **Maximum nicht messbar**: der Renderer wird im Container bei 13,8 GB vom
  OOM-Killer beendet – auch schon mit dem alten Stand (vorher-Lauf abgestürzt).

| Stufe | laden | lager | halleW | hochregal | wareneing. | lager3 | schleuse | dockHof | strasse | werkS1 | werkS3 | leitstand | verbind. | hofWest | mischhaus | Texturen MB | Meshes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ultralow Aufrufe | 442 → 438 | 373 → 372 | 208 → 216 | 110 → 144 | 173 → 192 | 146 → 171 | 228 → 259 | 517 → 506 | 90 → 88 | 30 → 193 | 30 → 190 | 86 → 235 | 33 → 227 | 268 → 153 | 66 → 64 | 289.8 → 308.7 | 2339 → 2759 |
| ultralow Dreiecke (k) | 222 → 222 | 205 → 206 | 169 → 169 | 131 → 134 | 137 → 139 | 119 → 120 | 158 → 161 | 373 → 371 | 182 → 181 | 48 → 96 | 49 → 99 | 73 → 109 | 49 → 97 | 258 → 163 | 104 → 38 | | |
| niedrig Aufrufe | 463 → 460 | 394 → 394 | 232 → 234 | 131 → 163 | 192 → 211 | 167 → 190 | 248 → 278 | 539 → 528 | 111 → 110 | 48 → 230 | 48 → 224 | 104 → 271 | 51 → 263 | 290 → 174 | 84 → 83 | 307.4 → 329.5 | 2342 → 2787 |
| niedrig Dreiecke (k) | 395 → 379 | 366 → 357 | 320 → 297 | 251 → 240 | 262 → 249 | 215 → 202 | 286 → 274 | 520 → 506 | 279 → 262 | 144 → 279 | 144 → 280 | 169 → 295 | 144 → 282 | 369 → 247 | 200 → 119 | | |
| hoch Aufrufe | 492 → 489 | 434 → 432 | 284 → 285 | 152 → 183 | 200 → 222 | 203 → 223 | 301 → 327 | 542 → 544 | 112 → 106 | 53 → 246 | 53 → 240 | 142 → 312 | 56 → 269 | 309 → 182 | 91 → 86 | 320.8 → 345.5 | 2344 → 2789 |
| hoch Dreiecke (k) | 473 → 457 | 444 → 412 | 360 → 343 | 254 → 242 | 263 → 249 | 220 → 206 | 292 → 279 | 590 → 578 | 281 → 238 | 145 → 280 | 145 → 280 | 174 → 299 | 145 → 282 | 388 → 247 | 201 → 119 | | |

Befund: Ansichten ohne Blick ins Werk (Laden, Lager ①, Dock-Hof, Straße) **−11 … +2 Aufrufe**, Dreiecke gleich oder weniger (Stadt
rückt nach Westen) – auch auf Ultra Low/Niedrig. In der Halle (Hochregal, Wareneingang, ③, Schleuse) **+19 … +34 Aufrufe**: die
beiden neuen RBG der Gassen 2/3 mit ihren Ladungen (gekaufter Inhalt). Im Werk/Verbindungsbau/Leitstand +150 … +215 Aufrufe (Ultra Low
190–235 gesamt): das ist der gekaufte Inhalt (3 Straßen, ~45 Schilder mit eigener Textur, Räume). Texturen +19…25 MB (Schilder,
Leitstand-Leinwand, Rasen), Meshes +420. Wegenetz unverändert (23 320 Zellen, Aufbau 2,9 → 5,6 ms, Rauschen). Ein FPS-Lauf steht aus
(Tom misst auf seinem PC).

## Bilder
`docs/halle/bilder-1510/` (selbst angesehen, Befunde im Bericht).

## Feinschliff Optik und Licht (15.10., nach Toms Befund „dunkler Beton-Bunkergang“)
- **Zellen** (`bk.zelle`, neue Parameter statt Kopie): `wand:'paneel'` = beschichtet Lichtgrau mit Paneelfugen (Hellgrau), Sockel Steingrau
  30 cm; Höhe 3,1 m (`WK.zelleH`, vorher 4,0) – das Ausblasdach ist als Deckel sichtbar, über den Zellen sieht man die Halle.
  `fenster` = Panzerglas-Sichtfenster 0,6 × 0,42 m je Längswand (gegenüber der Tür versetzt, Rahmen Anthrazit), `kamera` = Kamera über
  der Durchreiche West. Durchreiche-Rahmen jetzt Signalgelb (bewegte Klappe), Klappe Feuerrot. In jeder Zelle steht die Maschine
  (`bk.maschine` Presse für R2, sonst Dosierer) – durchs Fenster sichtbar. Chemie-Boxen, Satz-Bunker, Mischhaus bleiben Sichtbeton.
- **Offene Stationen**: `bk.maschine` mit `schutz` (Alu-Profil-Schutzumhausung mit Polycarbonat 0,2–1,9 m an beiden Gangseiten,
  Stirnseiten offen für das Band), Portal-Stationen mit Art `schutz` – die Straße liest sich als Linie aus Alu-Gestellen wie im Foto.
- **Glas** des Werks (Leitstand-Front, Labor, Sichtfenster, Umhausungen) ist **ein** Mesh (`wkGlas`, bei jedem Ausbau neu, nur offene
  Straßen) – sonst kostete jede Straße einen Zeichenaufruf mehr (durchsichtig wird nie gebündelt).
- **Licht**: Hallenleuchten (`bk.lampe` art halle, Leuchtfläche `MAT.vc('leucht')`), Leitstand-Bildschirme (emissiv) und Zellenampeln
  (`MAT.neu('ampelRot/Gruen')`) leuchten schon; das Innenlicht (03-scene `innenLichter`, 3 Punktlichter an den nächsten `LAMPEN`, Werk
  zählt über `dachBereiche` als „unter Dach“) und die Augenanpassung 05p greifen im Werk. **Ehrlicher Befund:** das fast schwarze
  Nachtbild (`nachher-nacht-werk-innen.jpg`) entstand vor allem, weil das Bild 0,2 s nach dem Kamerasprung aufgenommen wurde (Innenlicht
  blendet mit dt × 4 auf) und die Betonwände (Steingrau × Betontextur) kaum Licht zurückwerfen. Mit eingeschwungenem Licht (1,5 s) ist
  der Gang auch vorher lesbar, aber grau; nachher sind die Wände hell. Ein zusätzliches Licht wurde **nicht** angelegt (Leistung, Regel 8);
  das Westende des Gangs bleibt nachts dunkler (außerhalb der 3 Punktlichter).
- **Prallwand** vor der Erdwall-Lücke ist an (`bk.erdwall` deckt die Lücke jetzt ganz und je 1 m daneben; vorher nur den Ostteil, im Werk
  abgeschaltet). Zugang versetzt: Gefahrstoffweg läuft zwischen Wallfuß und Prallwand (2 m) und biegt in die Lücke.
- **RBG an Feld 0 ragte 0,55 m durch die Brandwand x −66** (gemessen: Westkante −66,55 bei Platz x −65,15; Bild `fein-vorher-rbg-oben.jpg`).
  `bk.rbg` jetzt Einmast-Bauweise: Mast, Antrieb, Schaltschrank im Osten, im Westen schmale Fahrkatze mit Puffer (0,80 m über Gabelmitte)
  → Westkante −65,95. Test `werk.js` prüft das (Box3 des RBG am westlichsten Platz ≥ −66,0); Gegenprobe mit dem alten Stand schlägt an.
- **Leistung** (Zeichenaufrufe je Bild, alle Ausbauten, gleiche Ansichtsfolge wie `messen.js`, vorher = 31d479e; Zähler je Draw
  `tools/halle/zaehlen.js`, Werte = `renderer.info`): **Ultra Low** Laden 438 → 438, Werk S1 207 → 205, S3 204 → 203, Leitstand 259 → 258,
  Verbindungsbau 228 → 226; **Hoch** Laden 488 → 488, Werk S1 234 → 232, S3 241 → 240, Leitstand 314 → 313, Verbindungsbau 265 → 263;
  übrige Ansichten gleich (±1 Fahrzeuge). Dreiecke Werk +10 k (Ultra Low) / +32 k (Hoch): Maschinen in den Zellen, Umhausungen, Fugen.
  Hinweis: `messen.js` zeigte im Werk auf Ultra Low +12…+23 – dieselbe Ansicht lieferte vorher je Lauf 193 oder 207 (Stand der
  Laufzeit-Bündelung); der Zähler je Draw zeigt die Ursache (Beton der Zellen fällt weg, Glas 4 → 1 Mesh).
- Tests: `waechter.js` (node) grün, `src/tests/waechter.js` grün (Ausgangswerte neu: weniger Meshes, Bauteil `glas`), `werk`, `hochregal`,
  `gameplay` grün. Bilder `bilder-1510/fein-vorher-*` / `fein-nachher-*` (Gang Tag/Nacht, Zelle, Leitstand Tag/Nacht, Erdwall, RBG oben).

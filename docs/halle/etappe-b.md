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
MESSUNG_PLATZHALTER

## Bilder
`docs/halle/bilder-1510/` (selbst angesehen, Befunde im Bericht).

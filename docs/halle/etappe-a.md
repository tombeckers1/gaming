# Halle Etappe A – Lager- und Hallenteil (Kapitel 7.3), gebaut 14.10.2026

Bauvorgabe: `plan-1410.md` (Etappe A), Maße: `skizze-1410.html` (Z/LINIEN/TORE/WEGE). Branch `claude/halle-v7` nicht übernommen.

## Was es im Spiel gibt
- **Ausbau „Lagerlogistik – Hochregal und Kartonlager“** (`lagerlogistik`, Level 31, setzt Logistikhalle Stufe 3 voraus,
  Kapitel 7). Preis `WIRT.ausbau.preis.lagerlogistik`, Betrieb `WIRT.fix.hochregal` je aktiver Gasse und Tag (Fixkosten).
- **Gebaut wird erst beim Kauf** (`llBauen` aus dem Zonen-Haken, 05q). Vorher liegt nichts davon im Speicher; die alte Schleuse,
  die Ostwand der Halle (Stufe 3) und ihre Rasterleuchten werden beim Kauf ausgeblendet (`LL_ALT`, Kollision und `LAMPEN.aus`).
- **Kartonlager ③** x −36…−19,9 / z −17…−7, 5 m: gelbe Wand (Hallenseite Signalgelb bis 5 m, darüber Paneel bis unters Dach),
  Schnelllauftor **N1** (`bk.tor` art roll, öffnet, wenn Spieler/Personal/Kunde/FTS in 3 m Nähe ist), ①②③ ein Raum
  (Wand ② ↔ ③ fällt), 8 neue Lagerregal-Plätze (Nordwand 5, gelbe Wand 3). Die 24 Plätze in der Halle entfallen (`weg`).
- **Schleuse** x −26…−19,9 / z −29,9…−17, 3,4 m: Brandwand x −26 mit Durchgang z −26,9…−23,1 (Feuerschutz-Schiebetor offen
  geparkt, Feststellanlage, Sperrfläche im Schließbereich, Streifenvorhang), zu ② und ③ breit offen (Sturz 3,0 m).
- **Hochregal** 3 Gassen (`bk.hochregal`), je 180 Palettenplätze; **Gasse 1 mit RBG** (`bk.rbg`), Gassen 2 und 3 stehen als
  Regal ohne RBG (kommen mit Kapitel 8 / 8.2: `LL_GASSEN` = `fabrik` / `fabrik2`, Etappe B legt diese Ausbauten an).
- **I/O Ost**: Aufgabe-Förderer (Hofseite → Reihe A), Auslager-Förderer (Reihe B → Anbruch) (`bk.foerderer`), gelber Schutzzaun
  mit Durchlässen; der ganze Block (Gassen + I/O) ist für Personen gesperrt (Kollision und Wegenetz).
- **Anbruch** x −46…−42: 5 Lagerregale am I/O (normale `racks` – Packer und Einräumer nehmen dort automatisch).
- **Wareneingang** je Tor R2–R4 Stellplätze (R2, R3: 2 × 3, R4: 2 × 2 – vor R4 liegt die Aufgabe), Ausgang R5 (2 × 6, markiert),
  Packmaterial (10 Paletten, Kartons/Füllmaterial/Klebeband), 13 Schnellplätze (markiert).
- **Bodenmarkierungen** (`bk.bodenmarkierung`): Fahrweg FTS gelb, Gehwege grün mit Fußgänger-Piktogramm (Hauptgang z −12 von ③
  durch N1 bis zur Westwand und zur Tür des Verbindungsbaus, Packerweg Schleuse → Anbruch, Personaltür x −40), Sperrflächen.
- **Licht**: 45 LED-Hallenleuchten an Pendeln (`bk.lampe` art halle, 2 InstancedMesh), Raster in ③ und Schleuse, 3 Lichtbänder
  im Dach (Tageslicht, nachts dunkel), Sprinkler (3 Hauptleitungen Feuerrot + Köpfe), Fluchtweg-Schilder grün, Personaltür
  (Notausgang, geschlossen).
- **Außen** (Straßenseite): Sprinkler-Tank Ø 7,2 m mit Sprinklerzentrale, Mitarbeiter-Parkplatz (8 Stellplätze), Pforte, Zaun.

## Lager-Logik (11f)
Wareneingang (Lieferung an Tor 2–4) → Kartons auf die Paletten der Stellplätze (8 je Palette, von hinten nach vorn) → **FTS 1**
holt die vorderste beladene Palette (wartet, bis das Tor fertig entladen hat oder die Palette voll ist) → Querförderung auf den
Aufgabe-Förderer → **RBG** lagert auf den nächsten freien Platz (nah am I/O, unten zuerst) → `S.hr.p`.
Auslagern: RBG holt eine Palette in den Anbruch, wenn die Sorte knapp ist (Onlinebestellungen offen, weniger als zwei Kartons im
übrigen Lager) oder der Anbruch fast leer ist (< 6 Kartons). **FTS 2** fährt Nachschub (bis 4 Kartons, Sorten mit dem kleinsten
Bestand in ③/②/① und Regalen) durch N1 in ein Lagerregal von ③, ② oder ① mit Platz; Kartons, die eine offene Bestellung
braucht, bleiben für die Packer im Anbruch. Bestand im Hochregal und unterwegs zählt in `stockOf` und für Onlinebestellungen
(`vsBestand`). Beim Kauf ziehen Lagerregale aus belegten Flächen auf freie Plätze (③ zuerst); ohne Platz geht ihr Inhalt ins
Hochregal und das Regal wird abgebaut. Spielstand: `S.hr` (Plätze, Ladungen unterwegs), `S.ll` (Anbruch angelegt).

## Preis und Amortisation (CLAUDE.md „Preise bestimme ich“)
18.500 € einmalig, 35 €/Tag Betrieb je aktiver Gasse. Geschätzte Wirkung pro Tag in Kapitel 7 (nicht gemessen – der
Balancing-Bot erreicht Kapitel 7 nicht, offen für das Balancing-Paket):
- Lagerplatz für die Großhandels-Staffel 20 Kartons (−18 % statt −10 %): ~8 Prozentpunkte auf ~3.000 €/Tag Einkauf ≈ +240 €
- Einlagern ohne Einräumer-Wege (Tor 2–4 → Hochregal automatisch): ≈ 1 Einräumer-Stelle anders nutzbar ≈ +130 €
- kürzere Packerwege (Anbruch, Nachschub nach ③) ≈ 6 Pakete mehr à ~26 € Deckungsbeitrag ≈ +155 €
- minus Betrieb 35 € → **≈ +490 €/Tag → Amortisation ≈ 38 Spieltage** (Ziel „große Stufen“ 15–30 Tage; bewusst etwas länger,
  weil Kapitel 7.3 die letzte Stufe vor der Fabrik ist und Fixkosten bei wenig Umschlag zum Minus führen sollen – Finanzbildung).

## Messung (tools/halle/messen.js, vorher V134 / nachher, alle Ausbauten gekauft, swiftshader)
_siehe unten, nach dem Messlauf eingetragen_

## Bilder
`docs/halle/bilder-1410/` (selbst angesehen, Befunde im Bericht).

# Paket „Fundament“ – einheitliche Struktur für das ganze Spiel (Tom, 13.10.2026)

**Entscheidung Tom (13.10.):** Erst Chatwechsel, dann direkt das Fundament bauen – KEIN Neubau des Spiels.
Reihenfolge laut Tom: **zuerst die Optik-/Textur-Struktur (alles einheitlich), dann Wirtschaft,
Stilregeln, Tests, Übersicht** – „die ganzen Punkte, die du genannt hast“. Danach erst Halle ins
Hauptspiel und Balancing – beide bauen auf dem Fundament auf. Ziel auch: bessere Leistung.

## Warum (Anlass)
Toms Kumpel (KI-erfahren): Ein Spiel braucht eine übergeordnete Struktur, damit alles kohärent ist –
z. B. ein Rolltor für Anlieferungen sieht überall gleich aus; ändert man es an einer Stelle, ändert es
sich überall; ändert man eine Wirtschaftsgröße (z. B. Versandkosten), wirkt das nachvollziehbar auf
alles Abhängige (Nachfrage, Umsatz, Ruf …). Tom will sich darauf verlassen können, dass Agenten das
Drumherum mitdenken – das soll über Struktur + Regeln + Tests ERZWUNGEN werden, nicht über Gedächtnis.
Tom sorgt sich: „Code kann man nachträglich nicht ändern“ – stimmt so nicht: schrittweises Refactoring
mit den 166 Tests als Sicherheitsnetz (nach jedem Schritt grün).

## Ist-Zustand (gemessen 13.10.)
- 122 Teil-Dateien `src/parts/*.js`, ~52 300 Zeilen, organisch gewachsen.
- Gut: zentrale Daten (`02-data.js`: P/Produkte, UPGRADES, STAFF, KAPITEL, LIZENZEN …), gemeinsame
  Helfer (`tex`, `rbox`, `bbox`, `merge`, `vcMat`, `roundedBoxGeo`, `std`, `tm`, `LIN` …), 166 Tests.
- Schwach: gleiche Dinge mehrfach unabhängig gebaut. Beispiel Tore: Begriffe Rolltor/Lamellen/Sektionaltor
  in 17 Dateien; eigene Tor-Bauten u. a. in `05g-dock.js` (Docks/Rampen R1–R5), `05h-ausbau.js`,
  `11e-palette.js` (V1, Lamellen/Fenster aus V123), `05m-logistik.js`, Halle `30-halle-*.js`
  (Branch `claude/halle-v7`, eigene Sektionaltore). Ähnlich vermutlich: Regale (Laden/Lager/Packmaterial/
  Halle), Lampen (Laden, Lager, Hof, Halle, Wand), Paletten/Kartons, Zäune/Absperrungen (Gitterbox,
  Ladezone V1, Halle), Schilder (Regalschilder, DDL-Schild, Hallenschilder), Fassaden/Paneele
  (05f-facade, 05h, 05m, Halle), Materialien/Farben (viele lokale `std(0x…)`).
- Wirtschaft: Zahlen verstreut (02-data, 02b-markt, 11c-versand VS_PORTO/Pauschalen, 11e DDL 39 €,
  16-day Kunden/Körbe, 17-laptop Onlineshop, LOANS, fixedCosts …). Balancing-Ist-Analyse
  (`docs/balancing/ist-analyse.md` auf Branch `claude/balancing`) zeigt die Folgen (zu zäh am Anfang,
  Level läuft dem Geld davon, Kredite unplanbar, keine Miete, keine Insolvenz).

## Klarstellung Tom (13.10. nachmittags) – Einheitlichkeit gilt für ALLES außer den Effekten
„Das Spiel soll im Großen und Ganzen einheitlich sein, die Zusammenhänge maximal bestehen, die Logik und
der Aufbau, alles.“ Nicht einheitlich, sondern Anomalie: nur die Effekte selbst (Bruchbild, Ablauf, Klang).
Einheitlich dagegen die **Mechanik**: Effekte kommen genau aus den Löchern/Rohren, sichtbare Löcher =
Schusszahl, immer gleiche Art der Zündung/Darstellung (nicht einmal aus der Verpackung und einmal als
ausgepacktes Produkt).
Folgen für den Plan:
- Etappe 2 ab Tore: Umbau ist **sichtbar** – je Bauteil EINE Optik (beste Variante wird Standard),
  Unterschiede nur über Parameter (Größe, Fenster, Nummer). Schritte 0/1 (Bibliothek, Kern) bleiben unsichtbar.
- **Neue Etappe 2b „Feuerwerks-Regelwerk“**: Inventar, wo/wie Produkte gezündet und dargestellt werden
  (Laden-Testfeld, Vorführung, Silvester, Hof …: verpackt/ausgepackt, Rohrraster, Mündung); EIN Abschuss-
  Baustein (Rohrraster aus Schusszahl, Abschuss an der Mündung, einheitliche Zünd-Darstellung) für alle
  Produkte; die Einzeltests lochschuss/ursprung/vfrohr zu einem Wächter über ALLE Produkte und Orte bündeln.
  Effekte (Anomalie) bleiben unangetastet.

## Toms Anforderung an die Übersicht (13.10. nachmittags) – Sicherheit durch Sichtbarkeit
Tom will den Unterbau SEHEN, ohne das Spiel 20× spielen zu müssen: Grobes in Listen prüfen, Feinschliff beim Spielen.
- **Bauteil-Katalog mit Bild:** so sieht ein Rolltor aus, so die Fenster, Schiebetüren, Kassen, Regale, Lampen … –
  je Bauteil Bild, Varianten (Parameter), wo verwendet.
- **Textur-/Material-Katalog mit Bild:** jede Textur und jedes Material einzeln.
- **Verpackungen/Formen:** jede Produktverpackung ist eigen (bewusst verschieden), wird aber ebenfalls gelistet
  (Detailregeln dazu später gemeinsam mit Tom festlegen).
- **Wirtschaft als Listen/Definitionen:** wie baut sich das Spiel auf; welche Entscheidung hat welche Folge
  (zu viel auf einmal kaufen, zu wenig ausbauen, Kredit, Versandkosten …), und WARUM ein Zusammenhang so gesetzt ist
  (Begründung/Quelle je Regel).
- **Vorgehen:** Übersichtsseite nicht erst in Etappe 5, sondern ab Etappe 2 mitwachsen lassen (nach jedem Schritt
  aktualisiert), damit Tom früh prüfen kann.
- Halle (Branch claude/halle-v7): viele Texturfehler, Tom überlegt Neubau – Entscheidung später, auf Basis des Baukastens.

## Umfang in 5 Etappen (je Etappe: bauen, Tests der betroffenen Bereiche grün, commit, Artefakt, Bericht)

### Etappe 1 – Bestandsaufnahme (zuerst, billig, Grundlage für alles)
- Inventar aller wiederkehrenden Objekte und Materialien: Wo wird was gebaut (Datei/Funktion/Zeile),
  wie oft, welche Varianten, Dreiecke/Draw-Calls je Variante. Ergebnis `docs/fundament/inventar.md`.
- Inventar aller Wirtschaftsgrößen (Wert, Datei, wer liest sie, welche Abhängigkeiten).
- Daraus eine priorisierte Umbauliste (größter Nutzen für Einheitlichkeit + Leistung zuerst).

### Etappe 2 – Baukasten Optik (Toms Priorität 1: „Texturstruktur, dass alles einheitlich ist“)
- **Materialbibliothek** (eine Datei, z. B. `src/parts/01b-material.js`, früh im Build): benannte
  Materialien/Farben (Stahl verzinkt, Lack Gelb RAL 1003, Beton, Wellpappe, Holz Palette, Glas, Gummi,
  Kunststoff weiß, Epoxid-Boden …) inkl. gemeinsamer prozeduraler Texturen (einmal erzeugt, geteilt),
  Grafikstufen-abhängig (Auflösung/Detail). Alle Bauten holen Materialien NUR von dort.
- **Bauteil-Baukasten** (z. B. `src/parts/04z-baukasten.js`): genau EINE Implementierung je Bauteil mit
  Parametern: Rolltor/Sektionaltor (Breite, Höhe, Fenster ja/nein, Antrieb, Zustand offen/zu, Ampel),
  Regal (Typ Laden/Lager/Schwerlast, Fächer, Maße), Lampe (Decke/Wand/Mast/Schwanenhals), Palette,
  Karton, Zaun/Absperrung/Gitterbox, Anfahrschutz, Schild, Fassadenpaneel/Sockel, Tür, Leiter …
  Jedes Bauteil liefert Geometrie für Merge/Instancing (Leistung!) und hat Detailstufen.
- Alle bestehenden Stellen schrittweise auf den Baukasten umstellen (Tore zuerst – Toms Beispiel),
  Optik danach überall gleich; Unterschiede nur über Parameter. Alte Duplikate löschen.
- Leistung messen (Draw-Calls, Dreiecke, Texturen/Speicher je Grafikstufe vorher/nachher).

### Etappe 3 – Stilregeln (verbindlich für alle Agenten)
- `docs/fundament/stilregeln.md`: Farbpalette (mit Hex), Materialien, Maßstäbe (Türhöhen, Regalmaße,
  Torgrößen, Bodenmarkierungen), Detailgrad je Grafikstufe, Beschriftung/Schrift, Abnutzung/Schmutz,
  Licht (aus Licht-Paket 05p-licht.js), Bildsprache (Referenzen: Toms KI-Zielbild 8510991a, Referenz-
  Render `docs/bilder/referenz/`, Produktionsfoto). Neue Objekte: erst Baukasten prüfen, nur ergänzen,
  nie daneben neu bauen.
- In `CLAUDE.md` als Pflichtregel verankern.

### Etappe 4 – Wirtschaftszentrale
- Alle Wirtschaftszahlen in EINE Datei (z. B. `src/parts/02k-wirtschaft.js`): Preise/Margen, Löhne,
  Ausbaukosten, Lizenzen, Porto, DDL-Pauschale, Kredite, Fixkosten/Miete, Nachfrage-Parameter,
  XP-Kurve. Systeme lesen nur von dort.
- Zusammenhänge an einer Stelle als nachvollziehbare Kette (z. B. Versandkosten -> Conversion ->
  Bestellungen -> Umsatz/Porto -> Ergebnis; leere Fächer -> Ruf -> Kunden; Silvester-Faktor …),
  dokumentiert in `docs/fundament/wirtschaft.md`.
- KEINE Werte-Änderung in dieser Etappe (nur Umzug, Verhalten gleich – Tests + Balancing-Simulation
  beweisen das). Das eigentliche Balancing (Zielkurve) kommt danach auf diesem Fundament.

### Etappe 5 – Wächter-Tests + Übersicht
- Konsistenz-Tests: z. B. jedes Tor/Regal/Lampe im Szenengraf stammt aus dem Baukasten (Markierung
  `userData.bauteil`), keine Materialien außerhalb der Bibliothek, Wirtschaftswerte nur aus der Zentrale.
- Balancing-Simulation (`tools/balance/sim.js`, Branch `claude/balancing`) als Regressionstest der
  Wirtschaft übernehmen (Kennzahlen dürfen ohne Absicht nicht kippen).
- **Übersichtsseite für Tom** (Artefakt): alle Bausteine mit Bild, wo sie verwendet werden, und die
  Wirtschafts-Abhängigkeiten als Diagramm. Ab dann enthält jeder Agenten-Bericht eine Zeile
  „Konsistenz: genutzte Bausteine / was ändert sich dadurch wo“.

## Rahmen
- Schätzung: 3–5 Agententage, token-sparsam, Etappen nacheinander (gleiche Dateien!).
- Spiel bleibt nach jeder Etappe spielbar; alte Spielstände müssen laden (18-save.js).
- Halle (Branch `claude/halle-v7`) wird ERST NACH Etappe 2/3 ins Hauptspiel geholt und dabei auf den
  Baukasten umgestellt (ihre Tore/Regale/Lampen sind sonst wieder Duplikate).
- Fassade + Hoflampen (`fassade-0910.md`) werden mit dem Baukasten erledigt (Fassadenpaneel, Mastlampe).

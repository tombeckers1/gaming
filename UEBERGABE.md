# Übergabe Böllerladen Simulator – vollständiger Kontext für den neuen Chat
Stand: **16.10.2026 abends** (Abschnitt 000 neu; Chat 14.–16.10. Halle, Licht, Einheit, Fassade). Ältere Abschnitte ab „1.“ unten gelten weiter, Abschnitt 0 ist der aktuelle Stand.

> **Für den neuen Chat:** Zuerst Abschnitt 0 und 10 lesen, dann `CLAUDE.md` (Regeln), dann
> `docs/uebergabe/fundament.md` (nächstes Paket) und `docs/uebergabe/warteschlange.md`.
> Bei Bedarf `docs/uebergabe/*`. Tom erwartet, dass du ab der ersten Antwort alles weißt und
> nicht nachfragst, was schon geklärt ist.

---

## 000. STAND 16.10.2026 ABENDS – ZUERST LESEN (danach 00 und 0 für Hintergrund)

> **ZUSAMMEN (17.10. nachts, Branch `claude/zusammen2` = Rückbau + Werkbank, noch NICHT veröffentlicht):** Merge von `claude/rueckbau`
> und `claude/werkbank` (Basis a3baa21). Ergebnis: keine Halle/Werk/Produktion, volle Werkbank (Kapitel 5, `docs/werkbank/werkbank.md`,
> Stufen labor..labor5 bis L32). Laptop ohne Reiter Entwicklung/Produktion, Vorführung 8 Sprungpunkte (mit Werkbank). Alte V141-Stände:
> Werkbank-Umstellung (Rezepturen, labor2-Erstattung 13.500 €) läuft VOR dem Rückbau, sonst gingen Rezeptur-Kartons aus dem Hochregal
> verloren; je eine Meldung (Test `rueckbau` prüft beides). **„gameplay rot“ gelöst:** Ursache war die beim Spielstart eingefangene
> Maussperre, die in der Vorführung aktiv blieb – headless Chromium flutet dann den Renderer mit Maus-Eingaben, die sich während der
> Tagesschleife stauten (> 12,5 GB beim Neuladen). Fix in 17e/21-input (Vorführung gibt die Sperre frei, kein Wiedereinfangen ohne
> Spielergeste). **Offen:** Progressionslücke ab L33 (nach Werkbank-Stufe 5 bei L32 kein Ausbauziel mehr) → Balancing; leerer Asphalt
> West/Süd des Lagers → Vorschlag: Stadt oder Park dort wachsen lassen (eigener Schritt, Tom entscheidet).
> Tests 17.10. (real.html, je einzeln, alle grün): gameplay 2× (4,8/4,7 GB; ohne Fix 12,6 GB Abbruch), rueckbau (beide Migrationen; Gegenprobe
> alte Reihenfolge → WARE rot), werkbank, werkbank-leistung, ausbau, stufen, lager, versand, versandtor, verpackung, ausstellung,
> abschussregel, leistungsbericht, Laufzeit-waechter (Budget eingehalten, keine neuen Ausgangswerte), Node-Wächter.

> **PASTELL + REGALKÖPFE (Tom 17.10., Branch `claude/werkbank-farben`, noch NICHT veröffentlicht):** (1) Werkbank-Farbwahl pastellig: 14 Töne
> (Rosé, Koralle, Pfirsich, Champagner, Zitronencreme, Salbei, Minze, Aquamarin, Himmelblau, Lavendel, Flieder + Gold, Silber, Weiß), Tonwerte nur in
> `FW` (14-fireworks, eigene Namen: `koralle`/`lavendel` gibt es dort schon kräftig), Anzeige aus `FW` abgeleitet, alte Farb-IDs werden beim Laden
> auf den nächsten Pastellton abgebildet (`WB_FARB_ALT`, 02d). (2) **Alle Kopf-/Kategorieschilder an Verkaufsmöbeln entfernt** (bk.regal; samt Taste L
> „Regalschild beschriften“, Laptop-Farbwahl der Regalschilder, `08f-schild.js`, `HEADNAME/headArt/updateHead`). Bilder `docs/bilder/pastell-1710/`.
> Tests 17.10. grün: werkbank (mit Farbcheck), moebelneu, regalsicht, einraeumer, verpackung, gameplay, Laufzeit-Wächter, Node-Wächter. `sparten` rot **vorbestehend**
> (eiswuerfel ohne Gruppe, Laptop-Filter zeigt alle 238 – auch auf V142 identisch, offen).

> **RÜCKBAU (Tom 16.10. abends, Branch `claude/rueckbau`, Doku `docs/rueckbau/rueckbau.md`):** „Die große Halle ist eine Katastrophe …
> mach sie KOMPLETT weg.“ Logistikhalle (3 Stufen), Tore R2–R5, Lagerlogistik (Hochregal, Kartonlager ③, N1, Schleuse), Werk West und
> Produktion sind **VERWORFEN und aus dem Code gelöscht** (−3 200 Zeilen in src/parts, 6 Dateien, 10 Bauteile, 8 MAT-Rezepte). Westwand von
> Lager Süd durchgehend geschlossen (bk.wand, gelb-schwarzes Sockelband), Lagergang weg, Welt West wie vor Etappe B, NAV x0 −36. Kapitel 7/8
> gestrichen, geplante heißen jetzt 7 Großhändler, 8 Kette, 9 Imperium. Alte Stände: Kaufpreis/Rohstoffe zurück, Werker/Mischer ohne Kosten
> weg, Ware ins Lager bzw. zum EK gutgeschrieben (Test `rueckbau.js`). **Progressionslücke:** ab Level 31 kein Ausbauziel mehr → Balancing.
> Alles unten zu Halle/Werk/Produktion/Hochregal (Punkte „Offen“ 1–3, 5 usw.) ist damit hinfällig. Fokus: Verkauf, Pyrotechnik, Online-Shop, Versand.

**Spiel V141 veröffentlicht (fc3d369)**, Artefakt https://claude.ai/artifact/7zw7iHrZYiYSGzw1QHNwVJ, Branch `claude/artifact-review-task-d47i09`.
Seit 14.10. erledigt (je Doku in Klammern): V134 EPAL-Paletten + Kartonzelle je Stufe (docs/fundament/paletten.md) ·
V135–V137 **Große Halle + Werk West** nach Skizze docs/halle/skizze-1410.html (Artefakt DpXBJ4k49w1y33uS2rzV9o; docs/halle/plan-1410.md,
etappe-a.md, etappe-b.md) · V138 **Licht & Schatten** neu (docs/uebergabe/licht-1510.md), **DDL-Fahrer/Hubwagen** realistisch,
**Verpackungs-Vorführung 2.0 / Ausstellung** (17f, Laptop → Entwicklung; E = ✓/✗, L = Liste), **Produktion** im Werk (docs/halle/produktion.md,
Konzept ohne Wartung freigegeben) · V139 **Einheit**: bk.regal/kasse/fenster/tuer/schild/bodenmarkierung (docs/fundament/einheit.md), Tests
licht/gameplay stabil · V140 **Leistungsbericht** im Spiel (Esc → „Leistung messen“, docs/uebergabe/leistungsbericht.md) · V141 **Fassade**
(Sandwichpaneele, Betonsockel automatisch an bk.wand, bk.dachrand, Mast-/Wandleuchten bk.lampe; docs/fundament/fassade.md).
Damit sind Fundament-Punkte 0–2, 4, 5, 6 aus Abschnitt 00 erledigt (Übersicht-Katalog nur auf V133-Stand).

**Offen – Entscheidungen von Tom:**
1. Produktion: Werksverkauf an Großhandel (85 % EK × Qualität) behalten? Empfehlung: ja, aber Tagesabnahme begrenzen + Preis schwankt.
2. Rohstoffpreise fest oder schwankend (Empfehlung: leicht schwankend)?
3. DDL-Verladen dauert jetzt ~120 s statt 57 s (realistisch) → im Balancing berücksichtigen (Pauschale 39 €).
4. Abnahmen: Palettenholz/Vergrauung, Karton 512 px auf Maximum (~320 MB GPU gerechnet), Verpackungen (Ausstellung), Fassade/Lampen, Licht.
5. Leistungsbericht von Toms PC (i7-4790) abwarten; Ultra Low im Werk war in Software-Läufen ~20 % langsamer – prüfen.

**Offen – technisch (Reihenfolge Vorschlag):**
1. **Balancing** nach Zielkurve ohne Silvester-Rekordtag (balancing-0910.md) – jetzt inkl. Produktion, Hochregal-Betrieb, DDL-Dauer.
2. Möglicher Ein-Bild-Flackern nach Teleport (Bündelung bWaechter/bSammeln, 03b-post.js) – im Spiel noch nicht gesehen, nur im Test.
3. Licht-Grenzen: Hallenboden Ultra Low dunkel, ~1 m Schattenstreifen an Straßenwänden, Halle/Werk ohne Echtzeitschatten.
4. Fassade-Grenzen: Fallrohre nur an 2 Gebäuden, Eckprofile an kurzen Wandstücken dicht, Lichtkegel-Kante aus der Nähe.
5. Hochregal: Schnellplätze und Ausgang R5 nur markiert (ohne Funktion).
6. Übersicht (Katalog, Artefakt 4fTTh8HyVbz6qNYF47yFg9) auf V141 neu erzeugen.
**Wochenlimit:** 16.10. 08:20 bei 78 %; Reset Sa 14 Uhr. Faustwert neu: ~150 000 Agenten-Tokens ≈ 1 %. Regel „Qualität vor Token-Sparen“ (CLAUDE.md).
Worktree-Muster für parallele Agenten: `git worktree add -b claude/<name> ../gaming-<name> HEAD`, gemeinsame Browser-Sperre, ich merge + baue + veröffentliche.

## 00. STAND 14.10.2026 ABENDS – ZUERST LESEN (danach Abschnitt 0 für Hintergrund)

**Spiel V133 veröffentlicht (f2017e7)** – Branch `claude/artifact-review-task-d47i09`, Artefakt
https://claude.ai/artifact/7zw7iHrZYiYSGzw1QHNwVJ. **Übersicht für Tom** (Bauteil-/Material-/Textur-Katalog, Vorher/
Nachher je Schritt, Wirtschaft „Entscheidung → Folge“, Feuerwerks-Regeln): https://claude.ai/artifact/4fTTh8HyVbz6qNYF47yFg9
– Generator `tools/fundament/katalog.js` + `uebersicht.py` (Branch `claude/fundament-katalog`, liest docs/fundament/*.md
und Bildordner automatisch), Ausgabe nach Scratchpad `bauteil-katalog.html` und von dort veröffentlichen.

**Fundament fertig + gemergt (13.–14.10.):** Inventar (`docs/fundament/inventar*.md`), Materialbibliothek `01b-material.js`
(MAT: 28 Töne PALETTE mit RAL, 5 Oberflächenklassen, Rezepte, geteilte Texturen, Atlas), Baukasten `04z-baukasten.js`
(bk.sammler/schild/tor/poller/zaun/anfahrschutz/absperrung/wand/sockelleiste/wandbild/palette/paletten/inst/karton),
Materialangleichung, Tore (grau = alter R1, Tom 14.10.; Graphit verworfen), Wände/Zäune/Poller (Wandbild: Schatten −40 %),
Paletten + Karton-Atlas, Wirtschaftszentrale `01c-wirtschaft.js` (WIRT/WF/WIRT_KETTEN, Snapshot-Beweis), Feuerwerks-
Regelwerk + Abschuss-Baustein `14z4-abschuss.js`, Stilregeln `docs/fundament/stilregeln.md` (PFLICHT, Verweis in CLAUDE.md),
Wächter `node tools/fundament/waechter.js` (4 s, ohne Browser; Ausnahmeliste darf nur schrumpfen) + `src/tests/waechter.js` (Ausgangswerte 14.10.). Regression V133: gameplay, versandtor, ausbau, sockel, fassade, lager, stufen, rampe, material, waechter grün.
Doku je Schritt: docs/fundament/<schritt>.md + Bildordner.

**Test-Sanierung (14.10.):** Hängende Real-Tests = Speicher (OOM-Killer beendet Renderer stumm, Container ~15 GB für alle).
Neuer `tools/test/ladezeit-preload.js` (Herzschlag, „RENDERER TOT“ Exit 4, Speichergrenze) + `tools/test/lauf.sh`
(`BB_LOCK=/tmp/bb-testlock sh tools/test/lauf.sh <test>`) + `start-hilfe.js`. **Regel: höchstens 2 Agenten mit Browser
gleichzeitig, besser einer** (material braucht ~11 GB).

**Offen, in dieser Reihenfolge (Tom hat zugestimmt):**
0. Übersicht aktualisieren (Katalog neu erzeugen; zaeune.md/waende.md/kartons.md werden automatisch Abschnitte) und veröffentlichen – Sonnet, kurz.
1. ~~EPAL-Paletten + Karton-Auflösung je Stufe~~ – erledigt 14.10. (V134, `docs/fundament/paletten.md`; Veröffentlichung durch Tom/Hauptsitzung).
2. Lampen + Fassade/Hoflampen (`fassade-0910.md`) – Opus.
3. Balancing nach freigegebener Zielkurve **ohne Silvester-Rekordtag** (`balancing-0910.md` unten) auf der Wirtschaftszentrale.
4. Regale, Kassen, Fenster, Türen, Schilder, Bodenmarkierungen (Größen/Arten bleiben, nur Bauweise einheitlich).
5. ~~Leistungsbericht im Spiel~~ – gebaut 16.10. (Branch claude/leistung): Esc → „Leistung messen“, Doku `docs/uebergabe/leistungsbericht.md`, Test `src/tests/leistungsbericht.js`. Tom misst auf seinem PC und schickt den Text; Prüfpunkte 1,3 GB / Speicherspitze stehen im Bericht.
6. Danach großes Paket: **Große Halle NEU bauen**, vorher genauer Plan mit Tom, Welten direkt zusammenlegen (warteschlange.md).
**Halle Etappe A gebaut (14.10. nachts, Agent):** Ausbau `lagerlogistik` (Kapitel 7.3): ③ + gelbe Wand + N1, neue Schleuse,
Hochregal 3 Gassen (Gasse 1 mit RBG), I/O, Anbruch, Stellplätze, FTS-Logik (Einlagern, Anbruch, Nachschub ③), Bodenmarkierungen,
Hallenlicht, Sprinkler, Tank/Parkplatz/Pforte. Doku `docs/halle/etappe-a.md`, Bauteile `bk.hochregal/rbg/foerderer/fts/lampe/
bodenmarkierung` (baukasten.md), Test `src/tests/hochregal.js`, Bilder `docs/halle/bilder-1410/`. Etappe B (Werk West) offen.
**Halle Etappe B gebaut (15.10., Agent):** Werk West (Kapitel 8/8.2/8.3, Ausbauten `fabrik`, `fabrik2`, `fabrik3`; Kapitel 8 nicht mehr
„geplant“): Werk + Verbindungsbau mit zwei Brandwänden, alle Räume der Skizze, Leitstand auf Galerie +3,2 m (Treppe, begehbar über
`wkBoden`), 3 Straßen × 7 Stationen im **Schau-Betrieb** (ohne Wirtschaft, Werk-Fixkosten erst ab Produktion), Paletten laufen über den
Sammelförderer in die Gassen 2/3/1 (RBG Gasse 2/3 mit fabrik/fabrik2), Mischhaus im Erdwall, Hof West mit Werkszaun, Straße bis x −130.
Restfehler A erledigt: N1 PVC-Schnelllauftor, Personaltür x −40 begehbar. Doku `docs/halle/etappe-b.md`, Bauteile `bk.zelle/drehtuer/
treppe/portalgreifer/rohrraster/maschine/erdwall` (baukasten.md §2c), Test `src/tests/werk.js`, Bilder `docs/halle/bilder-1510/`.
Offen: Produktions-Gameplay (Konzept freigegeben, `produktion-konzept.md`) auf den Schnittstellen `WK.zustand`, `wkAusgabe`, `WK.produktion`.
**Licht-Paket gebaut (15.10., Agent, nicht veröffentlicht):** Tom: „immer so dunkel, in eine Richtung wird es hell, Boden glänzt komisch“.
Ursachen: Augenanpassung (Belichtung 0,74 + Gamma je Kameraort), 3 Punktlichter, die dem Blick folgten, Ladenstrahler, Glanzbahnen.
Neu: **Raumlicht im Shader** (`RAUM` in 05p, Räume aus `dachBereiche()`), feste Belichtung 1,05, **Deckenlicht mit Schatten** ab Mittel
(`DECKE`), Boden matt über `MAT.bodenGlanz`. Doku `docs/uebergabe/licht-1510.md`, Bilder `docs/bilder/licht-1510/`, Test `src/tests/licht.js`
(neu), Werkzeuge `tools/licht/bilder.js` (Bilder, Zeichenaufrufe) + `vergleich.py`. Kontaktschatten jetzt auf allen Stufen.
Stilregeln §8 neu. Offen/später: Abschnitt „Grenzen“ in licht-1510.md.
**Verpackungs-Vorführung 2.0 / Ausstellung (15.10., Agent, Branch claude/verpackung2):** Laptop → Entwicklung → „Verpackungs-Vorführung 2.0 (Ausstellung)“. Eigener Raum
(`17f-ausstellung.js`, weit ab von der Karte und von Vorführung 1): Reihen von Verkaufstischen (`bk.verkaufstisch`, Optik wie die Ladentische), nach Kategorien
(Batterien, Raketen, Kugelbomben, Fontänen, Verbund, Kleinfeuerwerk F1, Zubehör, Essen, Getränke), jedes Produkt genau 1× als Einzelpackung, davor ein
Schild mit Nr./Name/Kategorie/Level (`bk.schildAtlas`: alle Schilder = 2 Draw-Calls). Nummern stabil = Kategorie, dann Produkt-ID. **Freigabe:** E bzw. Aktion-Knopf auf ein Stück:
offen → ✓ passt → ✗ passt nicht (Schild blau/grün/rot), Stand in localStorage `bb_vp2_freigabe_v1`; Knopf „Liste“ (Taste L) = Text zum Kopieren (Nr · Name · Kategorie · ID).
Beenden: Knopf oder B. Test `src/tests/ausstellung.js` (`BILDER=<ordner>` schreibt Bilder), Doku `docs/fundament/baukasten.md` §2d, Bilder `docs/bilder/ausstellung-1510/`.
**Zusammenführung (15.10., Branch `claude/zusammen`, nicht veröffentlicht):** ddl-fix (Hubwagen/DDL-Fahrer), verpackung2 (Ausstellung), produktion (Werk-Produktion, Wirtschaft, Personal) und Licht-Endstand a7eb4f8 per Merge-Commit vereint; Wirtschafts-Snapshot und Laufzeit-Ausgangswerte (`bk.hubwagen` neu) nach dem Merge neu erzeugt. Tests grün: versandtor, verpackung, ausstellung, produktion, werk, hochregal, material, waechter, gameplay (1. Lauf PACKMATERIAL-Zufall, 2. Lauf grün). Licht-Test: Drehschwelle 30 ist zu knapp, siehe Bericht in der Hauptsitzung (Erstbild nach Ortswechsel flackert vereinzelt).
**Einheit – Fundament-Schritt 4 (15./16.10., Branch `claude/einheit`, nicht veröffentlicht):** Regale, Kassen, Fenster, Türen, Schilder,
Bodenmarkierungen je EIN Baukasten-Bauteil (`bk.regal` laden/lager/fachboden, `bk.kasse` kasse/sb/sbTafel, `bk.fenster` schaufenster/fluegel,
`bk.tuer` schiebe/stahl/brand/glas/streifen – `bk.drehtuer` entfällt, `bk.schild` mit Stilen haus/info/warn/tafel/brand/flucht + Sonderschild,
`bk.bodenmarkierung` erweitert). Ein Glas (`glasScheibe`), Lagertechnik Signalblau/Signalorange/Silbergrau, Preisschilder je Möbel in einem Bild.
Zeichenaufrufe −7 … −14 % (Hoch), Ausnahmeliste 132 → 117. Inventar, Messung, Bilder: `docs/fundament/einheit.md`, `docs/fundament/einheit/`.
**Beiseite (Tom 14.10.):** Feuerwerk-Fragen F1–F4, Feuerwerk wird jetzt nicht geändert.
**Wochenlimit:** Tom 14.10. ~16 Uhr 41 %; Ziel höchstens ~1 %/h, Sa 14 Uhr ≤ 85 %. Ein Agent nach dem anderen, Sonnet für Routine.

## 0. STAND 13.10.2026 (Hintergrund)

### 0.1 Nächster Schritt (Toms Entscheidung 13.10.)
**Paket „Fundament“** – Auftrag komplett in `docs/uebergabe/fundament.md`. KEIN Neubau des Spiels.
Reihenfolge laut Tom: zuerst Optik-/Textur-Struktur (Baukasten + Materialbibliothek, alles einheitlich),
dann Stilregeln, Wirtschaftszentrale, Wächter-Tests, Übersichtsseite. Danach erst Halle ins Hauptspiel
und Balancing. Tom will sich darauf verlassen können, dass Agenten das Drumherum mitdenken – die Struktur
soll das erzwingen. Start: direkt im neuen Chat (Tom hat zugestimmt), Etappe 1 Bestandsaufnahme zuerst.

### 0.2 Spielstand / Artefakte / Branches
- **Hauptspiel:** Branch `claude/artifact-review-task-d47i09`, Commit `24240d5` (+ Übergabe-Commit),
  Artefakt https://claude.ai/artifact/7zw7iHrZYiYSGzw1QHNwVJ **Version 127**.
- **Große Halle (Optik, eigener Modus):** Branch `claude/halle-v7` (Commit `48533c5`), Worktree
  `/home/user/gaming-halle` (überlebt keinen neuen Container – Branch ist gepusht), Vorschau-Artefakt
  https://claude.ai/artifact/1qMJc7Xf8qgiJ2ndwDmHzh (Version 2). Doku `docs/halle/zusammenfuehrung.md`
  (auf dem Branch). Start: Startbildschirm „Große Halle“ oder `#halle`.
- **Balancing-Analyse:** Branch `claude/balancing` (Commit `cf325f0`): `tools/balance/sim.js`,
  `tools/balance/auswertung.js`, `docs/balancing/ist-analyse.md`. Keine Spielwerte geändert.
- **Automat/SB-Kassen:** Branch `claude/automat-sb` – bereits ins Hauptspiel gemergt (V127).
- Worktrees ggf. neu anlegen: `git worktree add ../gaming-halle claude/halle-v7` usw.

### 0.3 Was vom 08.–10.10. gebaut wurde (Versionen 120–127)
- **V120** Versandecke Stufe 1 ohne Kran (am 09.10. durch V123 wieder ersetzt).
- **V121** Läden gegenüber: Innenräume mit gemaltem Textur-Atlas (`05e2-laeden-innen.js`), 14 Ladenarten.
- **V122** Kugelbomben Runde 5 (`docs/uebergabe/kugelbomben-0910.md`): 13 raus, 10 neu, eigener Bruchknall je Kugel, Größen, Preise ≈ 1/3 einer großen Batterie.
- **V123** Versandecke/DDL/Onlineshop (`versand-sb-0910.md`): Station 1 m Richtung Lager, fest eingebaut; Ladezone vor V1 gesperrt (gelbe Absperrung); Stufen 1/2/3 = 1/2/3 Paletten + Packplätze, Kran ab Stufe 1; Versandbereich schraffiert/unbebaubar; **DDL nur auf Anruf** (Wandtelefon, **39 € Pauschale**, Fahrer lädt; keine Abholung 22 Uhr, keine Zwischenabholung); Porto S/M/L 2,00/3,50/5,00 €; Onlineshop: Versandkosten 0–20 €, Gratis-Schwelle, Sale (alles/einzelne Produkte), „heute versandkostenfrei“, Nachfrage-Elastizität nach Baymard/UPS/Bijmolt, Statistik; Stufenpreise 5 900/6 900 €; **Lager-PC** (Bestellen, Onlineshop, Team) in der Versandecke statt Lagerterminal der Halle, **Tablet** im Laden (nur Bestellen), Büro-Laptop alles; Rolltor V1 mit Lamellen/Fenstern, Schild „DDL Abholung“, Lampe links, Packmaterial-Modelle.
- **V124** Kugelbomben Runde 6 (`kugelbomben-0910b.md`): neuer Knall (Friedlander-Druckstoß, gesättigter Tiefton, Donnerrollen, Faltungshall), alle 30–50 % größer, 4 raus, Silberdistel neu, Fackelhimmel mit Flammenzungen, 8 neue (Level 27–30, Lizenzen L27 Großfeuerwerk 42 000 €, L29 Pyro-Weltklasse 52 000 €), Urknall-Monster als Vorbild; Test `kugelknall`.
- **V125** Batterien (`batterien-0910.md`): 13 raus, 6 bearbeitet, 11 neue nach echten Vorbildern (Links in der Datei); Änderungsliste („Vorführung (Änderungen)“) nur noch diese + Kugeln (49); **DDL auch per Handy** (Onlineshop-App); Kugel-Bruchhöhen je Kaliber 95–150 m, Königsklasse 165–175 m.
- **V126** Licht und Schatten im Laden (`05p-licht.js`, `licht-0910.md`): Kontaktschatten, Lichtflecken, Glanzbahnen (ab Mittel), Innen-Belichtung 0,74, Feuerwerk unverändert; Ultra Low/Niedrig nicht langsamer.
- **V127** Automat „Rakete personalisieren“ (`06b-gravur.js`) und SB-Kassen (`06-fixtures.js` `sbTerminal`, Helfer `geraetBau()`) neu modelliert, weniger Draw-Calls.
- Referenz-Render „was ist maximal drin“ (three r186): `docs/bilder/referenz/` (Vergleich mit Toms KI-Zielbild).

### 0.4 Offene Punkte / Fragen an Tom (nicht selbst entscheiden)
1. **Balancing-Zielkurve** freigeben (Vorschlag in `docs/balancing/ist-analyse.md`, Branch `claude/balancing`): alle 10–20 Min spürbar, alle 45–90 Min Fläche, alle 2–4 h Kapitel; Demo: erster Ausbau ~0:30, Kapitel 2 ~1 h; Kredite 30–120 Tage, Miete je Fläche, Insolvenz mit Auswertung, Silvester als Rekordtag. Kommt NACH dem Fundament (Wirtschaftszentrale).
2. **Halle – 6 Fragen:** Tor 5 (x −57,5) im Plan nicht vorhanden – weg? R4 bei −47,5 (Spiel) statt −43 (Plan) ok? Bunkerzellen verschoben ok? Südstreifen Produktion = Rohstofflager + Leitstand ok? Gelbe Wand nur bis 5 m gelb ok? Produktion höher für mehrere Stockwerke?
3. **Fassade + Hoflampen** (`fassade-0910.md`, Fotos dabei): Tom wollte Referenzfotos nachschicken; wird mit dem Baukasten (Fassadenpaneel, Mastlampe) erledigt.
4. Tom hat die neuen Sounds/Optiken von V124–V127 noch nicht alle bewertet.

### 0.5 Bekannte Schwächen / rote Tests (ehrlich)
- Schon vor dem Licht-Paket rot: `buendel` (GLEICH, Bildabweichung), `vfgrafik` (Funken nach Stopp, Ultra-Extrem-Neuladen Zeitlimit), `grafik2` (automatische Stufen-Absenkung schaltet nicht herunter).
- `gross` GROESSER „raketen“ rot (Verpackungsmaß, nicht aus der Batterie-Runde).
- `gameplay` PACKMATERIAL wackelt (bekannter Flake, 2. Lauf grün).
- Sounds nur gemessen, nicht gehört; Feuerwerks-Bilder nur im Software-Renderer.
- Engpass Versand: Packer schaffen ~12 Pakete/Tag (Wege) -> Amortisation Stufe 2/3 ~47–56 Spieltage.
- Echte FPS auf Toms PC (i7-4790) weiterhin ungemessen.

### 0.6 Neue Regeln dieses Chats (auch in CLAUDE.md)
- Toms Absicht: **Finanzbildung** (Kosten kalkulieren, Kredite, Herunterwirtschaften möglich, Folgen sichtbar).
- **Preise bestimme ich** – Schweizer Uhrwerk, spürbarer Fortschritt, Begründung mit Amortisation.
- **Selbstständig abarbeiten** nach `docs/uebergabe/warteschlange.md`; Agenten selbst takten (nacheinander, wenn sie sich Dateien/Testsperre teilen; parallel nur Unabhängiges in eigenen Worktrees/Branches mit eigener Sperre `/tmp/bb-testlock-<name>` und `nice`).
- **Wochenlimit:** Tom nennt den Prozentstand; bei „aufdrehen“ bis ~95 % planen und rechtzeitig bremsen. Faustwert aus diesem Chat: ~200 000 Agenten-Tokens ≈ 1 % Wochenlimit. Reset samstags 14 Uhr.
- „Was ich als weg markiere, ist weg“ – keine Rückfrage bei Streichungen.
- Wächter-Check per `send_later` alle 2 h, solange Agenten laufen.
- Was gestrichen wird: Lösch-Mechanismus `ENTFERNT` (02e-neuware.js), alte Spielstände ersetzen Ware.


## 1. Wer, was, wo

- **Tom** (tom@tom-beckers.com) baut mit Claude einen 3D-Browser-Simulator „Böllerladen Simulator“ (Arbeitstitel; Logo „Feuerwerksladen Simulator“).
  - Ziel: Steam-Release, erst USA zum 4. Juli 2027.
  - Tom programmiert nicht selbst. Er testet die Artefakte und gibt Befunde (oft per Sprachnachricht, Bild oder PDF).
- **Repo:** `tombeckers1/gaming`.
  - Branch `claude/artifact-review-task-d47i09`: immer darauf entwickeln, committen und pushen, KEINE PRs ohne Auftrag.
  - Letzter Stand: `47c5499` (Spiel) plus Übergabe-Commit.
- **Spiel = eine HTML-Datei** `boellerbude.html` (~8,9 MB, three.js r128 per CDN).
  - Gebaut aus `src/parts/*.js` über `src/build.sh` (Funktion `build`, feste Reihenfolge der Teile).
  - `desktop/` ist ein Electron-Wrapper für spätere Steam-Builds.
- **Spiel-Artefakt** (nach JEDER Änderung neu veröffentlichen, Link IMMER mitschicken):
  https://claude.ai/artifact/7zw7iHrZYiYSGzw1QHNwVJ, aktuell **Version 119**.
- **Ausbauplan v7:** https://claude.ai/artifact/TDsAd4EeAgzsdvS6k6gf5T.
  - Quelle: `docs/uebergabe/ausbauplan-v7.html`. Generator lag im Scratchpad und ist weg; Änderungen direkt im HTML/SVG machen.
  - Ältere Skizzen: https://claude.ai/artifact/EYzJdvGRsKF3Ck6tW9mTsy.
- **Tests:** 164 Playwright-Skripte in `src/tests/*.js`. Werkzeuge in `tools/test/` (siehe Abschnitt 9).

## 2. Spielaufbau (damit du dich im Code zurechtfindest)

**Kapitel** (`src/parts/02-data.js`, `KAPITEL`, `DEMO=false`):

| Nr | Kapitel | Stand |
|---|---|---|
| 1 | Pyro-Kiosk, Lieferung vor die Tür | gebaut |
| 2 | Kleines Fachgeschäft (Lager mit Rampe) | gebaut |
| 3 | Großes Fachgeschäft | gebaut |
| 4 | Pyro-Versand (Onlineshop und Packstation) | gebaut |
| 5 | Eigene Marke (Labor/Rezeptur) | gebaut |
| 6 | Pyro-Kaufhaus (Süd-Fläche, 2. Eingang) | gebaut |
| 7 | Großhändler | geplant (Pyro-Logistik und Pyro-Fabrik: Rückbau 16.10., gestrichen) |
| 8 | Kette | geplant |
| 9 | Imperium, Stadtfeuerwerk | geplant |

ROADMAP.md: Die Demo-Idee mit Kapitel 1–6 ist inzwischen durch den Release-Plan (Abschnitt 7) überholt.

**Wichtige Module:**
- **Welt und Ausbau:**
  - `05-world.js` (Maße `LAY`, Deckenhöhen `WH=3.6`, `HALLE_H=5`).
  - `05h-ausbau.js` (Flächen kaufen, Wände/Durchbrüche, Packstation-Stufen).
- **Personal:**
  - `11-staff.js` (Personal).
  - `11b-einraeumer.js`.
  - `11c-versand.js` (Packer, Rollwagen-Touren, `vsPlan`/`vsStopsBauen`, `VS_OPT`).
  - `11d-packmaterial.js`.
  - `11e-palette.js` (Paletten, Hubwagen, DDL-LKW 22 Uhr, Rolltor V1).
- **Menschen:** `09-people.js`, `09a-figuren.js` (Rocketbox, Skinned Mesh, Arm-IK).
- **Karton:** `15c-karton.js` (Spieler öffnet Karton, räumt Stück für Stück ein).
- **Feuerwerk:**
  - Partikelsystem `14-fireworks.js`, Shows `14b`.
  - Drehbücher `14g`–`14l`, Erweiterungen `14m`–`14y`.
  - Daten `02e/02f/02g`, Verpackungen `04*`.
  - Löschliste: `ENTFERNT` in `02e-neuware.js`.
  - `P[id].aenderung` setzt die Liste „Vorführung (Änderungen)“.
- **Laptop/Handy:**
  - `17-laptop.js`.
  - Vorführungen: `17b-fwtest.js` (Feuerwerk), `17c-verpackung.js` (Verpackungsraum), `17e-gameplay.js` (fast durchgespielter Laden).
- **Grafik:**
  - `03-scene.js`, `03b-post.js`, `03d-pracht.js`.
  - `05p-licht.js` (10.10., Licht im Laden): Kontaktschatten unter Möbeln/Kartons/Personen, Lichtflecken unter den Deckenleuchten, Glanzbahnen der Leuchten im Boden (Mittel/Hoch; ab Maximum übernimmt die echte Spiegelung), Augenanpassung drinnen (Belichtung 0,74 statt 1,05) + sattere Mitteltöne in `03b` (`innen`). Alles Instanzen, je 1 Zeichenaufruf. Ultra Low: nichts; Niedrig: nur Kontaktschatten. Draußen/Feuerwerk unverändert. Test `licht` (Gegenprobe `GEGENPROBE=1`). Bilder `docs/bilder/licht-1010/`.
  - Stufen: Ultra Low, Niedrig, Mittel, Hoch, Maximum, Ultra, Ultra Extrem; Automatik nach Bildrate.
- **Speichern:** `18-save.js`. Alte Spielstände müssen immer weiter laden; Migrationen testen.

**Koordinaten (Weltmeter):**
- Laden x −7,9…37,9 / z −21,9…5,9.
- Backstock („lbasis“) x −19,9…−8,1 / z −5,9…1,9.
- Lager Süd 1–3 bis z −29,9.
- Testfeld x −7,9…8 / z −28…−6.
- Haupttür bei x≈0.

## 3. Was in Version 118 und 119 neu ist (heute fertig)

- **Feuerwerk (V118):**
  - Korrekturrunde nach Toms Befunden (`docs/uebergabe/befunde.md`).
  - Gelöscht: Vollmond, Lagune, Gletscher, Kaleidoskop, Sterntor, Legion, Finale Grande, Kugel 300 Kronenregen.
  - Bodenfontänen aus Batterien raus; 8 Abschussstimmen, damit jeder Abschuss hörbar ist.
  - 10 neue Themen-Batterien: Kornblumen L2, Bienenweide L6, Weinlese L7, Mohnfeld L12, Winterwald L13, Fuchsien L16, Korallenriff L18. Königsklasse: Schwarzer Samt L23, Meteorschauer L24, Phönix L25.
  - 10 neue Kugelbomben: Silberdistel, Hummelschwarm, Blauregen, Smaragdring, Abendrot, Kometenschlag, Seerose, Granatapfel, Riesenpalme, Himmelstreppe.
  - Insgesamt **132 Produkte**. Laptop: „Vorführung (Änderungen)“ und „Kugelbomben-Vorführung“.
  - Verpackungen in echter Bauform; Kleinfeuerwerk wird ausgepackt auf dem Zündtisch gezeigt.
- **Menschen:** realistische Rocketbox-Figuren (gehen, stehen, greifen, Tüte, LKW-Fahrer). Kassen standardmäßig weiß.
- **Karton:** Spieler öffnet den Karton, Inhalt sichtbar, räumt Stück für Stück ein (Supermarket-Simulator-Stil).
- **Gameplay (V119)** nach `docs/uebergabe/gameplay.md`:
  - Eiswürfel raus.
  - **Versandecke** am hinteren Ende von Lager Süd 3 an **Rolltor V1** mit eigenem Versandhof. Roboter-Kran nur verlegt und gedreht; gelbe Gitterbox offen zum Tor.
  - **DDL-LKW um 22 Uhr** setzt rückwärts an. Mitarbeiter (Stufe 1) bzw. Hubwagen-Roboter (ab Stufe 2) lädt die Paletten. Ab 18 Uhr kann der Spieler selbst laden. Paletten bis 1,75 m hoch.
  - Durchgang an R1 frei.
  - Echtes Licht in den Ladenerweiterungen (Abendbild etwa 3× heller).
  - Grafikstufe **Ultra Low** (etwa 70 % weniger Dreiecke).
  - Bäume in Niedrig/Ultra Low gröber.
  - **1.4G-Raute nur auf Feuerwerkskartons** (F1/F2), 228 Lieferkarton-Varianten.
  - **Picker-Touren gebündelt:** älteste Bestellung als Anker, wegnahe Bestellungen dazu, 2-opt, gleiche Ware an einem Stopp. Weg im Lager −21 %, gesamt −10 %. Test `tourplan.js`.
  - Packstation braucht jetzt Süd 3 (Level 25/27/29). Alte Spielstände werden umgesetzt bzw. erstattet.

## 4. Bekannte Schwächen und Testlage (ehrlich)

- **Regression:**
  - Alle relevanten Tests waren grün, teils erst bei der Wiederholung (`leistung` ERSTES 1641 ms; `gameplay` PACKMATERIAL). Das sind vermutlich Lastflakes.
  - Auf dem Endstand `47c5499` liefen nur stufen, versandtor, lager, hoehen, neuware und verpackung noch einmal.
  - `anomalie` und `verpackung` wurden nach dem Gameplay-Merge nicht erneut gefahren. Beim nächsten Merge mitnehmen.
- **Testanpassungen am 08.10. (bewusst, geprüft):**
  - `stufen`: 9/11 Regalplätze, weil das Kassenregal mitzählt.
  - `versandtor`: Restpakete nur erlaubt, wenn der LKW voll ist (6 Plätze).
  - `lager`: Süd III nur noch bis z −20,7 geprüft, dahinter steht die Versandecke.
- `themen` mit R4=1 ist knapp (Zufall: weinlese 24,8 vs. bienenweide 25,4, Toleranz 0,5).
- Der Verpackungsraum (`17c`) bricht bei jeder Änderung der Produktzahl (feste Möbelliste, leere Fächer). Sollte aus der Produktzahl berechnet werden.
- **Feuerwerk:**
  - Kleine Kugeln (75–150 mm) dünner als der Himmelsbrecher.
  - Phönix bei der Last am Limit (~20 000 Funken, 44 ms/Schritt).
  - Riesenpalme liest sich aus 90 m wie ein Ring.
  - Meteorschauer mit leichtem Lichthof.
  - Kornblumen und Bienenweide in der Vorführung klein.
- **Packer:** laufen bis zu 48 s am Stück, weil die Station hinten in Süd 3 steht. Wird mit Plan v7 besser (Kartonlager als ein Raum, kürzere Wege).
- **Leistung:**
  - Tom hat einen alten PC (i7-4790), auf „Niedrig“ vorher 10–11 FPS.
  - Echte GPU-FPS mit Ultra Low sind ungemessen. Tom soll auf seinem PC testen.
  - Unklar: Warum zeichnet Niedrig etwa 2,4× mehr Dreiecke als im Sichtkegel liegen? Ein Baum hat ~17 000 Dreiecke.
- **Licht (10.10.):** Hoch hat weiter keine Umgebungsspiegelung auf Metall/Glas (nur ab Maximum, 03d). Kontaktschatten nur für Möbel mit Stellfläche, Versandecke-Teile und Bodenkartons – Kleinkram ohne `movable` (z. B. Paletten, SB-Kassen) bekommt keinen. Kein Licht auf Regalfronten fern vom Spieler (nur die 1–3 wandernden Punktlichter). Vorbestehend rot (auf dem Stand vor dem Licht gegengeprüft): `buendel` GLEICH (Bildunterschied vorher 8–32 %/1,5–4 %, nachher 38 %/4 % – die wandernden Punktlichter sind zwischen den Aufnahmen nicht zur Ruhe gekommen), `vfgrafik` STOPP (65–70 Sterne nach Stopp) und dessen Neuladen auf Ultra Extrem (Zeitüberschreitung 300 s), `grafik2` AUTO (Automatik schaltet bei 20 Bildern/s nicht ab – der Auflösungsregler vom 03.10. greift zuerst; Lauf ~10 Min, einmal > 40 Min).

## 5. OFFENE AUFGABEN (Reihenfolge = Vorschlag; Tom entscheidet, wann gestartet wird)

### 5.0 Neu von Tom am 08.10. (abends) – ERLEDIGT 08.10. (V120)
- Umgesetzt: Stufe 1 ohne Portal/Geländer; Packer (Zustand `stapeln`, `vsStapeln`) bzw. Spieler (Trefferfläche `bandende`, `vsSpielerAblegen`) legen das Paket am Bandende selbst auf die Palette. Kran ab Stufe 2. Tests packband (neu: KRAN1–3, SPIELER1), packer, versandtor grün; Gegenprobe schlägt an. Nicht in der Gameplay-Vorführung (die zeigt Stufe 3).
- **Versandecke Stufe 1 OHNE Roboter-Kran.** Auf Stufe 1 legt der Spieler (bzw. der Packer) das fertige Paket **selbst auf die Palette** in der gelben Box. Der Kran kommt erst mit dem Ausbau (Stufe 2/3).
  - Code: `05h-ausbau.js` (Packstation-Stufen), `11c-versand.js`, `11e-palette.js`.
  - Tests: `versandtor.js`, `packband.js`, `packer.js`.
  - In der Gameplay-Vorführung sichtbar machen.

### 5.0b NEUE RICHTUNG (Tom, 08.10. nachts)
- Ausbauplan v7 (5.4) wird in die Zukunft verschoben. Zuerst den aktuellen Stand auf sehr hohes Niveau: Texturen, Gameplay-Performance, Gameplay, Flow, Wirtschaft. Schritt für Schritt, Tom bespricht jeden Schritt.
- Über Nacht 08./09.10.: Läden gegenüber, Innenräume hinter den Schaufenstern realistisch (gameplay.md 14, `05e-street.js` `ladenInnen`).
  - ERLEDIGT 08./09.10.: `ladenInnen` jetzt in `05e2-laeden-innen.js` mit einem gemalten Textur-Atlas (2048², Niedrig/Handy 1024²) für alle 14 Ladenarten (Sichtwahl, Brotregal, Fleischtheke, Brillenwand, Bücher, Waschmaschinen …), weiter 1 Material/1 Mesh je Laden; Dreiecke der 6 Innenräume 23 776 → 8 452, Zeichenaufrufe gleich (12 Meshes). Eigener Zufall + `_altZufall` hält die Straße wie vorher (Test `laeden` STRASSE/TEXTUR). Bilder: `docs/bilder/laeden-innen/`.

### 5.0c Versandecke, DDL auf Anruf, Onlineshop-Wirtschaft (Tom 09.10., `docs/uebergabe/versand-sb-0910.md`) – ERLEDIGT 09.10.
- **Ecke:** Station 1 m Richtung Lager (`PACK_HOME` z −26,3), fest eingebaut (`packMov.fest`). Vor Rolltor V1 eine **Ladezone** mit gelber Gitterabsperrung links/rechts (`LADEZONE`, `LZ_ZAUN`, 05h) – nur der DDL-Fahrer kommt hinein. **Versandbereich** (`PACK_FL`, gelb schraffiert wo die Box noch wächst) ist für Regale/Möbel gesperrt; alte Stände räumen ihn beim Laden (`versandBereichRaeumen`).
- **Stufen:** 1/2/3 Paletten + 1/2/3 Packplätze, **Kran ab Stufe 1** (Hand-Ablage V120 ist raus). Box wächst je Stufe (`ZELLE`, `PORTAL_Z0`). Alte 2/4/6-Paletten-Stände werden auf 1/2/3 umgestellt.
- **DDL nur auf Anruf** (Wandtelefon links neben V1, `ddlRufen`, Pauschale `DDL_PAUSCHALE` 39 €), LKW nach ~20 s, Fahrer lädt selbst, Box so lange belegt (`boxBelegt`). Box voll → Band staut, Meldung, Handy-Badge „!“. Keine 22-Uhr-/Zwischenabholung mehr; Pakete seit gestern kosten Ruf. Porto S 2,00 / M 3,50 / L 5,00 €.
- **Onlineshop:** Versandkosten 0–20 €, Schwelle (0 = immer frei / nie), Sale auf alles, Sale je Produkt, heute versandfrei; Nachfrage nach Baymard/UPS/Lewis 2006/Bijmolt 2005 (Kopf von 11c); Statistik je Tag + Verlauf (`onlineStatHtml`, `S.onlineLog`). Marktplatz-Pauschale bleibt mit Packstation ganz (16-day). Stufe 2/3 kosten jetzt 5.900/6.900 €.
- **Geräte:** Lagerterminal der Logistikhalle weg; **Lager-PC** in der Versandecke (Bestellen, Onlineshop, Team), **Tablet** im Laden neben der Hintertür (Bestellen), Büro-Laptop wie bisher (`GERAETE` in 17-laptop).
- **Optik:** Rolltor mit Lamellen/Fensterband/Schienen/Wickelkasten/Antrieb/Warnmarkierung, Schild „DDL Abholung“, Schwanenhalslampe und Ampel links, Packmaterial (Wellpappe, Lathe-Klebebandrollen instanziert, Folienrolle mit Stirnseite), Handabroller am Tisch, Laptop-Bilder Versandmaterial. Bilder: `docs/bilder/versand-0910/`.
- **Tests:** versandtor (neu: TORSPERRE + Gegenprobe, NUR_AUF_ANRUF/ANRUF, ABRECHNUNG, BOX_VOLL, ALT_*), versand (FEST + Gegenprobe, VERSANDBEREICH, ALTSTAND_REGAL), online (NACHFRAGE + Gegenprobe), packband (Kran ab Stufe 1), packmaterial (neue Schwellen), gameplay (DDL_ANRUF).
- **Offen/ehrlich:** Ein Packer schafft gemessen nur ~12 Pakete je Verkaufstag (Wege im Lager) – das begrenzt das Onlinegeschäft mehr als Box oder DDL.

### 5.1 Tests beschleunigen (Vorschlag, etwa ½ Tag)
- Jeder Test lädt das Spiel ~50 s im Software-Renderer. Idee: einmal laden und den Spielstand per Hook zurücksetzen, oder mehrere Tests in einer Seite.
- Spart geschätzt 30–40 % Testzeit für alles Weitere. Erst Tom fragen, ob er das will.

### 5.2 Modell-Arbeiten (Opus-Qualität), Punkte aus `docs/uebergabe/gameplay.md`
- 6: Packmaterial (Kartons, Paketband, Luftpolster, Papierkartons) besser modellieren, **Füllstand sichtbar**.
- 9: Automat „Deine Rakete“ neu und realistisch, Aufschrift „Rakete personalisieren“.
- 11: Regalschilder oben standardmäßig **grau**, hochwertig.
- 12: Lagerregale: Farbe bleibt, mehr Textur und Detail.
- 14: Läden gegenüber: Innenräume detailliert (z. B. Apotheke), Beleuchtung und Wände bleiben.
- 15: LKWs „Premium Pyrotechnik Großhandel“ und „Import“ mit mehr Textur; **1.4G-Raute korrekt nach ADR** (UN 0336, Klasse 1.4G).
- 17: Eigene Außenfassade: Design und Farben bleiben, deutlich mehr Detail; Ladenschild **ohne Schattenschrift**.
- 8 (großer Raum mit vier weiteren Stationen): Tom meldet sich, liegt auf Eis.

### 5.3 Feuerwerk
- **Batterie-Runde (Toms Bewertung V122, `docs/uebergabe/batterien-0910.md`) – ERLEDIGT 09.10. abends:**
  - Code: Daten `02j-batterien7.js`, Effekte/Drehbuecher/Klang `14z3-batterien7.js`, Verpackung `04l-form-batterien7.js`.
  - RAUS (ENTFERNT + Ersatz alter Spielstaende): Pusteblume, Zitronenfalter (-> Goldlaube), Weinlese, Mohnfeld, Winterwald, Fuchsien, Goldader, Trommelfeuer, Glutschmiede, Vulkanausbruch, Schwarzer Samt, Goetterfunken (Basisprodukt `profi`), Phoenix. Lizenztexte neu (14z3 Ende).
  - BEARBEITET: Kornblumen, Tautropfen (Perlen als haengende Mini-Fontaenen), Bienenweide, Ozean, Rosenherz (violette Himmelsfontaenen, Rosen), Meteorschauer (ohne Salute/Glutpunkte, Finale 53 Schuss).
  - NEU (11, nach echten Vorbildern, Quellen in batterien-0910.md): Goldlaube L7, Eisbecher L10, Maerchenstunde L12, Wolfsnacht L15, Wuestengold L17, Neonkueste L19, Goldnatter L21, Paukenschlag L22 (295), Sternparade L24, Blumenmeer L27 (368, Lizenz Grossfeuerwerk), Ragnaroek L28 (409).
  - Neue Sterne `b7*`: Kern mit Hof (weniger Weiss als k5Stern), Spur, Glitzerschleier, Brokat, Blinker (Modus 1), Spitze/Knister (Modus 3), bewegte Sterne (Schwimmer, Nattern, Wirbel). Knall `sfx.b7Schlag/b7Donner/b7Krone` aus den Runde-6-Bausteinen (k6Knall, kleiner).
  - Aenderungsliste: nur noch diese Runde + Kugeln (`02j` setzt `aenderung`, `VF_AENDERUNG` = die 6 bearbeiteten).
  - Kugel-Bruchhoehe (Schritt 0b): 95/105/120/135/150 m je Kaliber, Koenigsklasse ab L27 165 m, Himmelssturz 175 m (`kgHoehe`, 14u); vorher reichten 300er bis 75 m unter den Boden. `distVol` zaehlt die Hoehe nur bis 90 m (Knall bleibt geeicht), Laufzeit Licht vor Schall mit echter Entfernung. Test hoehen: KUGELHOEHE neu, BODEN (>= 10 m), BILD (>= 70 % im Bild); Gegenprobe `hoehen.js real.html alt`.
  - DDL per Handy (Schritt 0): Onlineshop-App, Knopf "DDL rufen", gleiche Pauschale (39 EUR bleibt, Rechnung im Kopf von 11e). Test versandtor HANDY_RUF.
  - Bilder: `docs/bilder/batterien-0910/` (Kontaktboegen je Batterie, Nacht, Swiftshader).
  - Tests 09.10. gruen: anomalie, neuware, sortiment, steigerung (1. Lauf knatter-Wackler, Wiederholung gruen), ursprung, hoehen (+Gegenprobe alt), kugelknall, abschussklang, lochschuss, themen, themen R4=1, bodenfontaene, vorfuehrung (prueft jetzt: keine fremden Produkte in der Aenderungsliste), verpackung (17c: ein Hochregal -> kleines Regal), leistung, pyro, markt (brach seit 29.09. an zfaecher ab - repariert), packer, packmaterial, packband, streuung, versandtor (+Gegenprobe). gross: nur noch GROESSER "raketen" (Raketen-Masse, nicht von dieser Runde).
  - Schwaechen: Blinkstern-Buketts bleiben im Standbild Punkte (Strobe ist ein Punkt); Wuestengold/Goldnatter wirken im Swiftshader-Bild duenner als gedacht; Kugeln brechen nicht mehr "auf einer Hoehe" (Toms PDF 06.10.) sondern je Kaliber; Vorfuehrungs-Kamera schneidet hohe Batteriebrueche oben ab (Pitch 0,8, unveraendert).
- **Kugelbomben-Runde 6 (Toms Bewertung von V122, `docs/uebergabe/kugelbomben-0910b.md`) – ERLEDIGT 09.10. nachmittags:**
  - Code: Daten/Preise/Lizenzen `02i-kugeln6.js`, Knall/Effekte/Groesse `14z2-kugeln6.js`, Verpackung `04k-form-kugeln6.js` (build.sh ergaenzt).
  - KNALL neu (`k6Knall`): Druckstoss (gerechnete Friedlander-Welle mit Bodenreflexion, Periode 6-34 ms je Kaliber), kurzer Knack 1,5-3 kHz statt Hochpass-Zischen, Sinus-Tiefton mit Fall durch tanh-Saettiger (Obertoene fuer Laptops), gesaettigter Koerper, Mitten-Krachen, Donnerrollen (Wellen), Faltungshall (Strasse/Tal/Donner, prozedural), alles ueber Hochpass 42 Hz -> Kompressor -> Begrenzer (-1 dB). Urknall-Monster-Schlag bleibt alt (Toms Vorbild; er uebersteuert selbst, Spitze ~1,46!). Pegel je Kugel geeicht auf A-gewichtete Laptop-Lautheit (`__kg6.messen`, OfflineAudioContext). Gegenprobe: `kugelknall.js '{"alt5":true}'` = Knall der Runde 5.
  - Groesse (Durchmesser 90 %, m) vorher -> nachher: 75 mm 79-86 -> 108-115, 100 mm 84-88 -> 116-122, Profi 150 109-120 -> 149-165 (Tigerkrone 165, Farbcrossette 164), Profi 200 112-120 -> 151-175 (Blitzpalme 175), Koenigsklasse 118-128 -> 167-188 (Sternensturm 188), Urknall 181 -> 207, neue 200-266. `K6_RAUM` in 14z2.
  - RAUS: Aurora, Granatapfel, Sonnensturm, Drachennest (ENTFERNT + Ersatz alter Spielstaende). Silberdistel neu (Distelkopf, Silberstrahlen, schwebende Flaumbueschel), Fackelhimmel mit Flammenzungen (Leib aus aufsteigenden, abkuehlenden Teilchen, Glutschein, Funken).
  - NEU (300 mm, zwei Lizenzen Grossfeuerwerk L27 42 000 EUR / Pyro-Weltklasse L29 52 000 EUR): Herbststurm L27 89,99, Eiszeit L27 94,99, Titanenfaust L28 104,99, Lavastrom L28 109,99, Galaxie L29 119,99, Sturmflut L29 129,99, Goetterdaemmerung L30 139,99, Himmelssturz L30 169,99 (lautester Schlag im Spiel). Je eigener Monster-Knall mit Stufenschlaegen (`K6_MONSTER`), Dichte x1,8.
  - Kontaktboegen: `docs/bilder/kugeln-0910b/`. Alle Kugeln `aenderung:true`.
  - Tests 09.10. gruen: kugelknall (+Gegenprobe alt5: BOOM 32/32, ZISCH 26/32 schlagen an), anomalie, neuware, sortiment, steigerung, ursprung, rkecht, befunde, hoehen, abschussklang, boeller (Test laesst Lizenz-/Level-Klang erst ausklingen), vorfuehrung, verpackung (Tab heisst seit der Versandecke `shop` - Test war seit 05776a5 kaputt), leistung (Partikel max 18 985).
  - Schwaechen: Klang nur gemessen, nicht gehoert; Lautheit streut je Knall um +-15 %; der Urknall-Monster-Schlag uebersteuert weiter selbst (Spitze ~1,3-1,5, unveraendert als Vorbild); eine 150er Kugel hat jetzt mehr Schallenergie als der Monsterboeller (nur die Spitze ist kleiner). Bilder auf Swiftshader, Blick auf die Bruchmitte.
- **Kugelbomben-Runde 5 (Toms Bewertung 09.10., `docs/uebergabe/kugelbomben-0910.md`) – ERLEDIGT 09.10.:**
  - Code: Daten/Preise `02h-kugeln5.js`, Effekte/Knall/Groesse `14z-kugeln5.js`, Verpackung `04j-form-kugeln5.js`; Streichen ueber `ENTFERNT` (jetzt Funktion `sortimentStreichen()` in 02e, zweiter Aufruf in 02h).
  - 13 Kugeln raus (alte Spielstaende: Ersatz per `ENTFERNT_ERSATZ`), 10 neu: Profi Fackelhimmel 150 (L17), Wetterleuchten 150 (L18), Schatztruhe 200 (L19), Bluetenhagel 200 (L20), Aurora 200 (L21); Koenigsklasse Sonnensturm 300 (L22), Drachennest 300 (L23), Ringnebel 300 (L24), Kometensturm 300 (L25), Urknall 300 (L26, ersetzt Himmelstreppe: Boom, dann Monster-Schlag nach 1,3 s). Jetzt 28 Kugeln.
  - Knall: Ursache gemessen - Bruch auf 86-90 m kam mit distVol ~0,19 an, Klang war Puff/Plopp/Wumms/Herzton (gewichtet 0,02-0,08, Abschuss ~0,9). Neu: je Kugel eigener Bruchknall (`KNALL5`, 9 Klangarten) + Zerlegerblitz 0,06 s. Test `kugelknall.js` (Gegenprobe `'{"aus":true}'`).
  - Groesse (Durchmesser 90 % der Sterne, schwankt je Lauf um +-4 %): Profi 110-120 m (vorher 88-125), Koenigsklasse 116-130 m (Himmelsbrecher 116-121, vorher 100-121), Urknall ~182 m. `K5_RAUM` in 14z. Knall-Pegel bleibt unter dem Monsterboeller (boeller.js).
  - Tests 09.10. gruen: kugelknall (+Gegenprobe: 26/28 KNALL, 28/28 BLITZ schlagen an), anomalie, neuware, sortiment, steigerung, ursprung, hoehen, abschussklang, vorfuehrung, verpackung (17c: ein Hochregal weniger), leistung, befunde, boeller, moerser, perlen, pyro, rkecht.
  - Optik: Sterne des Hauptbruchs brennen gleichmaessig statt linear zu verblassen (`k5Halten`), Brokat-Gold (`k5Brokat`), Tigerkrone neu (Kronen an den Spitzen), Kanonade mit Brokatkrone, Knister aus 90 m sichtbar (psBig).
  - Preise: VK nach Level (`KUGEL_VK`, L14 9,99 ... L24 54,99, Urknall 79,99; vorher 300 mm 165-175 EUR), Marge 1:2,33 unveraendert, Nachfrage +1/+2. Gewinn je Kundenwunsch (alle Waren, rechnerisch): L18 -7 %, L24 -13 % - Kugeln brachten vorher ein Drittel des Feuerwerksgewinns.
  - Kontaktboegen: `docs/bilder/kugeln-0910/`. Alle Kugeln haben `aenderung:true` (Vorfuehrung Aenderungen).
- **Batterie-Formen nach Toms Referenzbildern** (`docs/uebergabe/batterie-referenz-3…7.png`: Hamburg/Caipirinha, Big Final, Magnum, Exotic Place).
  - Erledigt in `14w-batterieformen.js` (seit V118): 16 Batterien mit eigener Bauform, Zonen, Kaliber, Druck rundum, ein Loch = ein Schuss.
  - Offen ist nur Toms Urteil, ob noch welche „0815“ aussehen. Dann gezielt nacharbeiten.
- **Raketen-Runde:** Tom „später“; Raketen wurden in der Korrekturrunde bewusst ausgelassen.
- Kleine Kugeln kräftiger; Phönix-Last senken; Riesenpalme weniger Ring.
- Verpackungsraum robust machen (siehe Abschnitt 4).
- Regeln aus Toms Bewertungen:
  - Realismus vor Effekthascherei.
  - Keine Bodenfontänen in Batterien.
  - Jeder Abschuss hörbar (Hexenkessel als Klangreferenz).
  - Königsklasse nur für wirklich große Produkte.
  - Löcher = Schusszahl.
  - Raketen und Kugeln im Rohr sichtbar.
  - Rohre in der Vorführung wie im Spiel.
  - Toms Referenzbild „10 Batterien“ (`docs/uebergabe/referenz-10-batterien.png`) nur als lose Inspiration, NICHT kopieren.

### 5.4 Großer Bau nach Ausbauplan v7 – NUR auf Toms ausdrückliches Startsignal
- **Schätzung im neuen Chat:** realistisch 7 Arbeitstage, spätestens 10. Mit beschleunigten Tests etwa 5.
- Phasen strikt nacheinander, Tom vorher warnen, wenn sich Agenten im Weg stehen würden.

1. **Ladebildschirm** (≈1 Tag)
   - Die große Halle (auch über den Zugang durchs Kartonlager) wird erst beim Betreten gebaut/geladen, mit Ladebildschirm wie in anderen Spielen.
   - Vorher ist sie grafisch nicht vorhanden bzw. leistungsneutral.
   - Vorher/nachher messen: Heute gibt es schon Frustum-Culling, der Gewinn liegt vor allem beim Blick in Richtung Halle und beim Speicher.
2. **Lager-Umbau** (≈1,5 Tage)
   - **Ein Lager, drei Bereiche, je einzeln freischaltbar:** ① Backstock (Laden-Zone), ② Lager Süd und Versandecke V1, ③ Kartonlager (nimmt der Halle die Nordostecke x −36…−26 / z −17…−7).
   - **Gelbe Wand** zur Halle mit **Tor N1** (~3 m, für den Karton-Nachschub; der Hubwagen passt durch).
   - **Am Ende ein Raum ohne Trennwände** (①–③, auch keine Wand zwischen Kartonlager ② und Packstation). Keine L-/V-Wand.
   - **Schleuse** Halle ↔ Versandecke vertikal auf ~13 m vergrößert (Packmaterial-Weg).
   - In der Halle: **Wareneingang**-Stellplätze an R2–R4; **13 Schnellplätze** am Boden an der Hallenwand unter „Reserve“ für Paletten, die nur kurz stehen; **Packmaterial**-Fläche (Paletten mit Kartons, Folie, Band; der Lagerist bringt sie durch die Schleuse).
3. **Hochregal** (≈2 Tage)
   - 10 m hoch (braucht Hallenstufe 3 = 11 m), an der Westseite, 3 Gassen quer, je Gasse ein Regalbediengerät (Roboter) und ein I/O-Platz am Ostende.
   - Einlagerung aus der Produktion am Westende.
   - **Anbruch:** Roboter holt die Palette an den I/O, der Lagerist nimmt nur die nötigen Kartons, die Restpalette geht zurück ins Hochregal. Kartons gehen durch N1 ins Kartonlager.
   - Kennzahlen aus der Planung:
     - 180/360/540 Paletten je Stufe, Ø 20 Kartons je Palette.
     - 58 Kartons am Tag (41 Laden, 17 Versand), 42 Pakete am Tag, 3,3 Stück je Paket.
     - Max. 20 Kunden gleichzeitig.
4. **Produktion** (≈2,5 Tage, 5 m Decke)
   - 3 Fertigungsstraßen, **nacheinander freischalten: Raketen → Kugelbomben → Batterien**.
   - **R6 = Wareneingang** (Rohstoffe), **R5 = Warenausgang** (Fertigware). Für das eigene Lager geht Fertigware innen direkt in die Reserve.
   - Jede Straße braucht **eigene Materialien/Rohstoffe, die man bestellen kann** (Lieferung an R6).
   - Optik nach Toms Foto `docs/uebergabe/produktion-referenz.webp`: automatisierte Laufbänder/Rollenbahnen, Portal-Greifer, Rohr-Raster (Batterie-Rohre im Gitter), helle Industrie-Optik. **Gern mehrere Stockwerke** je Straße (Platz sparen).
   - **VORHER mit Tom ein kurzes Produktionskonzept klären** (Rohstoffe, Rezepte, Dauer, Kosten, Qualität, was tut der Spieler selbst). Nicht ohne Klärung bauen.
5. **Gameplay-Vorführung** zeigt in jeder Phase alles Neue.

- **Versand-Regel (Tom):** KEIN Versand-Pickregal (nicht alle Produkte passen hinein). Der Packer pickt mit dem Rollwagen aus dem **ganzen Kartonlager**, mehrere Bestellungen je Tour, so effizient wie möglich.
- **Ausbau-Konzept (Tom):**
  - Große Technik (Hochregal/Roboter, Tore, Band, Produktion) fest pro Kapitel; frei platzierbar nur Laden, Backstock und Packtische in Zonen.
  - Idee merken: feste Bauplätze mit Auswahl, der Spieler setzt einen Schwerpunkt (z. B. Produktion ODER Online-Shop).
  - Vorgehen: grober Plan → bauen → testen → dann entscheiden, was frei wird.

### 5.5 Release-Vorbereitung (Plan von Tom, 07.10.)
- **USA-Release 4. Juli 2027** (US-Konsumfeuerwerk ~2,3 Mrd. $/Jahr laut APA 2022; Massachusetts verbietet alles, IL/VT nur Kleinkram). Zweite Welle Deutschland zu Silvester 2027.
- **Kostenlose Demo zum Steam Next Fest Juni 2027:** die besten 30–60 Minuten (Kiosk → erster Ausbau → starke Feuerwerke), Ende mit Wunschlisten-Aufruf, kein Zeitlimit. Kein Spieler darf nach der Demo neu anfangen müssen (Spielstand-Übernahme).
- **Zeitplan:** Steam-Seite spätestens Frühjahr 2027, Streamer ab April.
- **Nötig:** Englisch, Sommer-Saison mit 4.-Juli-Event neben Silvester, US-Produktnamen.
- **Ab Jahresende 2026 keine neuen Ideen mehr**, nur noch fertig machen und polieren.

### 5.6 Nur auf Toms Wort
- **FPS-Analyse:** Gruppen einzeln abschalten, Frame-Zeit messen. Als Wochenend-Aufgabe mit Restkontingent. Nichts selbstständig starten.
- **„Dreh auf“** heißt parallelisieren, aber nur unabhängige Aufgaben.

## 6. Toms Ideen (nur auf Nachfrage), Details in `docs/uebergabe/ideen.md`
- **Favorit: geopolitisches Wirtschaftsspiel.**
  - Welt im Ist-Zustand (seltene Erden aus China, Öl, Konflikte); der Spieler steuert ein Land ab heute.
  - Ziel ist **Weltfrieden** durch Diplomatie, Handel und Abhängigkeiten.
  - Rechtlich: reale Länder ok, reale Politiker besser fiktiv, keine verbotenen Symbole.
- Weitere Ideen: Weihnachtsmarkt-Sim, Späti-Imperium, Zirkus, Dorfverein→Profiklub, Bestatter, Nachtclub, Event-/Hochzeitsagentur, Recyclinghof/Pfand; später ein Shooter.
- Böllerladen später als Xbox-Port (Unity bevorzugt).

## 7. Toms Lage und Termine
- Tom ist **30.10.–16.11.2026 in Japan**.
- **Wochenlimit/Abo:**
  - Tom hat das Abo hochgestuft und achtet stark auf Tokens. Am 08.10. waren 62 % des Wochenlimits verbraucht.
  - Ziel des Chatwechsels: weniger Tokens pro Antwort, damit mehr Aufgaben möglich sind.
- Tom war am 08.10. sehr unzufrieden: Er sah ständige Ausfälle, falsche Zeitprognosen und Agenten, die sich gegenseitig blockieren. Deshalb die Regeln in Abschnitt 8. **Nicht wiederholen.**

## 8. Regeln für die Zusammenarbeit (auch in `CLAUDE.md`)
- **Sprache und Ton:**
  - Deutsch, **wirklich kurz** (wenige Zeilen, keine Tabellen oder Überschriften, wenn drei Sätze reichen).
  - Ehrlich, auch unbequem; widersprechen, wenn etwas nicht stimmt; kein Moralapostel.
- **Messen statt raten:** rendern und hinsehen, Werte auslesen; bei jedem Fix eine **Gegenprobe** (Fehler wieder einbauen → Test schlägt an).
- Termine und externe Regeln (Steam, Fristen) vorher nachschlagen.
- **Artefakt nach jeder Änderung neu veröffentlichen und den Link immer mitschicken.**
- **Anomalie-Regel:** Jedes Feuerwerksprodukt ist einzigartig (eigener Effekt, eigene Abschussfolge, nicht immer links→rechts, Name passt, Steigerung über die Level). Qualität vor Quantität.
- **Agenten:**
  - Sonnet für Routine und Mechanik, Opus für Gestaltung und Effekte.
  - **Max. 2 gleichzeitig, und nur, wenn sie sich keine Testsperre und keine Dateien teilen.** Sonst nacheinander und **Tom vorher warnen**.
  - Bricht ein Agent ab (529, Container-Neustart, „stopped“): **sofort und ohne Rückfrage fortsetzen** (SendMessage) oder neu starten. Tom will nie „der läuft nicht mehr“ hören.
  - **Wächter:** alle 2 h; in der Endphase ein billiger Check alle 30 Min (ein Bash-Befehl).
  - Agenten müssen prüfen, dass ihr Testlauf wirklich in der flock-Schlange steht bzw. läuft. Nicht blind warten (am 08.10. wartete ein Agent 25 Min auf einen nie gestarteten Lauf).
- **Tests:**
  - Agenten testen nur, was sie geändert haben.
  - **EIN Merge und EINE Regression am Ende.**
  - Ein Lauf belegt die Sperre **max. ~20 Min**; FPS-Messungen kurz und nur einmal am Ende (am 08.10. blockierten 4 FPS-Läufe à 40 Min alles 2,5 h).
- **Zeitprognosen:**
  - Testminuten × 2 (geteilte Sperre), plus 1–2 Fehlerrunden à ~60 Min, plus Puffer für einen Container-Neustart.
  - Immer als **Uhrzeit (dt. Zeit) mit „realistisch“ und „spätestens“**.
  - Am 08.10. lag ich 3–4× zu optimistisch.
- **Commits:** Footer
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <aktuelle Session-URL>
  ```
  Keine Modell-IDs in Dateien. Der Stop-Hook mahnt bei uncommitteten Änderungen; nur pushen, was getestet ist.
- **Neue große Aufgaben** in einem langen Chat nicht annehmen, sondern an einen Chatwechsel erinnern.

## 9. Bauen und Testen (Rezept)
```sh
# 1) Spiel bauen (Repo-Wurzel)
sh -c '. ./src/build.sh; W=./src; build' && mv src/boellerbude.html boellerbude.html
# Syntaxcheck
python3 -c "import re;s=open('boellerbude.html').read();open('/tmp/a.js','w').write('\n'.join(re.findall(r'<script>(.*?)</script>',s,re.S)))" && node --check /tmp/a.js

# 2) Test-HTMLs in einem Arbeitsordner erzeugen
mkdir -p /tmp/t && cp boellerbude.html tools/test/* /tmp/t/ && cd /tmp/t
python3 mktest.py   # test.html: three-Stub (schnell, nur Logik)
python3 mkreal.py   # real.html: echtes three r128 (aus tools/test/three.min.js)

# 3) Einen Test fahren – NIE zwei gleichzeitig (gemeinsame Sperre)
flock /tmp/bb-testlock timeout 3600 node -r ./ladezeit-preload.js /home/user/gaming/src/tests/<name>.js $PWD/real.html
#   HANDY=1 vorne dran = Handy-Ansicht; manche Tests mit R4=1 (themen) oder X=0
#   Ausgabe enthält "ALLES OK" / "MANGEL: …" / "ERRORS: …"
```
- Playwright und Chromium sind vorinstalliert (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); niemals `playwright install`.
- Rechner: 4 CPUs, keine GPU. Ein Test lädt ~50 s; Feuerwerks-Filme und FPS-Läufe dauern lang.
- `ladezeit-preload.js` setzt eine Mindestfrist von 120 s für `waitForSelector` und `click` (Last).
- `three-stub.js` kennt u. a. `Matrix4.makeScale`. Fehlt im Stub eine Methode, gibt es den Absturz „xyz is not a function“ nur in test.html; dann den Stub ergänzen.
- `kontakt.js` erzeugt ein Kontaktbild (Figuren, Karton, Handy, Zündtisch).
- **Wichtige Tests nach Bereich:**
  - **Laden/Personal:** personen, kasse, kartonauf, einraeumer, regalsicht, pause.
  - **Versand:** packer, packband, packmaterial, versand, versandtor, tourplan, pakete, karre, kartonlogik, durchgang.
  - **Ausbau/Lager:** ausbau, stufen, lager, online, rueckbau (alter V141-Stand mit Halle/Werk lädt sauber, Rückbau 16.10.).
  - **Feuerwerk:** lochschuss, themen (+R4=1), abschussklang, kugelknall, bodenfontaene, ursprung (test.html), steigerung (test.html), hoehen, anomalie, neuware, sortiment, vfrohr, vfgrafik, vorfuehrung, mblast, kleinfeuer06, verpackung.
  - **Leistung/Gesamt:** leistung, gameplay, H:gameplay (=HANDY=1), baum.
- **Test-Harness seit 14.10. (Testsanierung, Branch claude/test-sanierung):**
  - Ursache der „hängenden“ Real-Tests: **Speicher, nicht Rechenzeit.** Das Spiel braucht in real.html mit Vollausbau + Vorführung 5–9 GB (Renderer 3–5 GB, Spitzen bis 8 GB, dazu GPU-Prozess ~1,8 GB und Browserprozess bis 3 GB). Der Container teilt sich ~15 GB für alle Agenten; zwei Browser gleichzeitig → OOM-Killer (`dmesg | grep "Killed process"`) beendet einen Renderer, und **Playwright wirft dabei keinen Fehler** – der Test hängt stumm bis zum 30-Min-Limit. Ein ganzer Spieltag in real.html läuft allein in ~2 Min (2–3 ms je Schritt).
  - `ladezeit-preload.js` (immer mit `node -r` laden) macht jetzt: Fristen (goto/reload ≥ 240 s, waitForFunction ≥ 300 s mit 500-ms-Polling, waitForSelector/click ≥ 120 s), **Herzschlag** alle 45 s (`[hb 300s] evaluate seit 40 s | RSS … | frei … GB`), Seitenfehler sofort (`[seitenfehler …]`), **Renderer-Tod-Erkennung** (Seite offen, aber kein Renderer-Prozess, oder Playwright-„crash“ → Meldung `RENDERER TOT` + dmesg-Zeile + **Exit-Code 4**), und wartet vor dem Browserstart bis ≥ 10 GB Speicher frei sind (`BB_MEM_MB`, 0 = aus). Eigene Obergrenze `BB_MAX_MB` (Standard 12500): wird sie überschritten, bricht der Test selbst ab (`SPEICHER-ABBRUCH`, Exit 4), statt den OOM-Killer des Containers einen beliebigen Agenten treffen zu lassen. `BB_CHROME_ARGS="--flag …"` hängt Chromium-Argumente an.
  - `start-hilfe.js`: `H.laden(p,datei)`, `H.neuesSpiel(p,{stoppen:true})`, `H.neuladen(p)`, `H.vorspulen(p,{sek,dt,max,bis})` (Spielzeit vorspulen in Stücken ≤ 25 s mit Fortschrittszeile), `H.stuecke(p,(st,aus)=>…)` (beliebig lange Arbeit im Browser in Stücken; `st` bleibt zwischen den Stücken erhalten, `aus()` = Stückzeit um). Lange Einzel-`evaluate`s (Tageslauf, 400 Bilder) gehören in `stuecke`/`vorspulen`. **`stoppen:true`** schaltet die Spielschleife ab (Test treibt mit `bb.run/step/renderFrame`) – sie lief sonst im Hintergrund mit und ließ den Renderer zwischen 3 und 5 GB schwanken. Umgestellt: material, leistung, waechter, ausbau (Vorlage); die übrigen Tests profitieren über den Preload.
  - `lauf.sh`: `BB_LOCK=/tmp/bb-testlock-<agent> sh tools/test/lauf.sh <name|pfad>` im Arbeitsordner mit real.html – Sperre, nice, Zeitlimit und bis zu 2 automatische Wiederholungen bei Exit 4 (Renderer tot).
  - **Regel:** nie zwei Real-Browser mit Vollausbau gleichzeitig starten, auch nicht unter verschiedenen Sperren (die Sperren sind je Agent getrennt, der Speicher ist gemeinsam). Vor dem Start `free -m` ansehen.
  - **Laufzeiten und Speicherspitze** (14.10., nice 10, mit einem Nachbar-Agenten im Container, alle grün): `waechter` 166 s (mit `BUDGET_SCHREIBEN=1 GRUND="…"`), 223 s mit `GEGENPROBE=1` (alle 5 Wächter schlagen an), Spitze 5,1 GB; `ausbau` 374 s, 4,4 GB; `leistung` 1158 s (400 Feuerwerksbilder à 1,2–1,7 s in swiftshader; `BB_LIMIT=3000` nehmen, wenn ein Nachbar mitläuft), 7,3 GB; `material` 647 s, **10,8 GB** – braucht ein ruhiges Fenster (Nachbar-Browser mit 4 GB reichen schon für den OOM-Kill: dann `RENDERER TOT`, Wiederholung per `lauf.sh`). Für `material` gelten zusätzlich: Texturen in Häppchen vorladen (`H.texturenVorladen`), Ansichten einzeln zeichnen (+`gl.finish`), Chromium-Argument `--disable-accelerated-2d-canvas`.
  - Ein Spieltag in real.html läuft nach der Vorführung in ~20 s (147 Durchgänge à 3 s Spielzeit); die ersten ~15 s Spielzeit nach dem Aufbau der Vorführung kosten 30–40 ms je Schritt (Einräumer-Suche, siehe Commit), danach 2–3 ms.
- Container-Neustarts kommen vor und töten laufende Prozesse. Danach Agenten fortsetzen und Läufe neu starten. Das Scratchpad überlebt Neustarts, aber keinen Chatwechsel.

## 10. Erste Schritte im neuen Chat
1. Abschnitt 0, `CLAUDE.md`, `docs/uebergabe/fundament.md` und `warteschlange.md` lesen; `git log -5`, Branch prüfen.
2. Tom in 3 Zeilen bestätigen, dass der Kontext da ist, und das **Fundament** starten (Etappe 1 Bestandsaufnahme) – Tom hat bereits zugestimmt. Zeitprognose nach Regel (realistisch/spätestens, dt. Uhrzeit), Wochenlimit-Stand erfragen.
3. Etappen nacheinander (gleiche Dateien), nach jeder Etappe: Tests der betroffenen Bereiche, Artefakt veröffentlichen, kurzer Bericht mit Zeile „Konsistenz“.

## 11. Wo steht was noch
- **Chronik aller Entscheidungen:** `git log` (513+ Commits mit sprechenden Texten). Jede Datei in `src/parts/` beginnt mit einem Kommentar, der Toms Wunsch mit Datum zitiert.
- **Toms Befundlisten:** `docs/uebergabe/befunde.md` (Feuerwerk) und `docs/uebergabe/gameplay.md` (Gameplay 1–18).
- **Skizzen und Fotos:**
  - `tom-skizze-rotgelb.jpg`: Lager-Grundlage für Plan v7.
  - `versandecke.jpg`.
  - `produktion-referenz.webp`.
  - `batterie-referenz-*.png`.
  - `referenz-10-batterien.png`.
- `ROADMAP.md`: Kapitel-Übersicht. Die Demo-Frage ist durch den Release-Plan in Abschnitt 5.5 entschieden: Demo zum Next Fest Juni 2027.
- `docs/realistische-batterien.md`: ältere Leitlinien zu Batterien.

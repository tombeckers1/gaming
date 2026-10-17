# Warteschlange (selbstständig abarbeiten – Tom, 09.10.2026)

Tom: „Du bist komplett freiständig, du aktivierst Aufgaben, wenn es Sinn macht, die Agenten sich nicht blockieren, wir Token sparen und die Qualität am Ende grandios ist.“
Nach jedem fertigen Paket: prüfen, Artefakt veröffentlichen, Tom kurz berichten, nächstes starten. Diese Liste aktuell halten.

| # | Paket | Auftrag | Stand |
|---|---|---|---|
| 0 | **Fundament** (Baukasten, Materialien, Stilregeln, Wirtschaftszentrale, Wächter-Tests, Übersicht) | fundament.md | 14.10. V129 (f4725e6): Inventar, MAT-Bibliothek, bk-Kern, Materialangleichung, Wirtschaftszentrale 01c, Feuerwerks-Regelwerk 14z4 fertig + gemergt; Übersicht https://claude.ai/artifact/4fTTh8HyVbz6qNYF47yFg9 (Generator tools/fundament/uebersicht.py, Branch claude/fundament-katalog); läuft: Tore (Branch claude/fundament-tore); offen: Wände/Zäune/Lampen, Kartons/Regale, Stilregeln, Wächter-Tests; Fragen an Tom: F1–F4 Feuerwerk, RAL-1003-Gelb |
| 1 | Versandecke, DDL, Onlineshop, Geräte | versand-sb-0910.md (ohne Automat/SB) | fertig 09.10. (05776a5, V123) |
| 2 | Kugelbomben Runde 6 | kugelbomben-0910b.md | fertig 09.10. (9b413db, V124) |
| 3 | Batterien + 10 neue nach echten Vorbildern | batterien-0910.md (+ DDL per Handy, Bruchhöhe große Kugeln) | fertig 10.10. (41ce9c7, V125); offen: Test gross GROESSER „raketen“ rot (Verpackungsmaß, nicht aus dieser Runde – prüfen) |
| 4 | Licht und Schatten im Laden | licht-0910.md | fertig 10.10. (d845076, V126); offen: buendel/vfgrafik/grafik2 waren schon vorher rot (grafik2: Auto-Absenkung) |
| 5 | Außenfassade und Hoflampen | fassade-0910.md (+ Toms Fotos) | wartet |
| 6 | Automat „Deine Rakete“ + SB-Kassen | versand-sb-0910.md (Abschnitte Automat, SB) | fertig 10.10., gemergt (V127); Tests sbhilfe, kassenregal, laeden, licht, leistung, gameplay (2. Lauf) grün; offen: Bildschirmtext „Rakete personalisieren“ |
| 6b | **Große Halle eigenständig ladbar** (Plan v7) | halle-1010.md | Optik fertig 09.10. (Branch claude/halle-v7, fbbd7e1), Vorschau-Artefakt https://claude.ai/artifact/1qMJc7Xf8qgiJ2ndwDmHzh; offen: Toms Abnahme + 5 Fragen, später Zusammenführung/Gameplay |
| 7 | Wirtschafts-Balancing „Schweizer Uhrwerk“ | balancing-0910.md | Ist-Analyse fertig 10.10. (Branch claude/balancing, cf325f0, docs/balancing/ist-analyse.md); wartet auf Toms OK zur Zielkurve, dann Werte anpassen |

## Entscheidung Tom 14.10.2026 vormittags – Große Halle
Die große Halle wird **neu gebaut** (nicht der Branch claude/halle-v7 übernommen) – als **nächstes großes Paket nach
dem Fundament**. Vorher gemeinsam mit Tom einen **genauen Plan**: was wohin kommt und wie es aussehen soll. Beim Neubau
werden die Welten **direkt zusammengelegt** (Halle im Hauptspiel, kein eigener Modus). Neubau komplett auf
Baukasten/Bibliothek/Wirtschaftszentrale. Start erst, wenn die laufenden Fundament-Schritte fertig sind.

## Kleinkram (zwischen zwei Paketen selbst erledigen)
- DDL auch per **Handy** rufen können (Tom 09.10.). Pauschale 39 € bleibt, sofern Stufe 1 sich lohnt (Rechnung prüfen: Stufe 1 muss nach Investition + Lohn + Pauschalen im Plus sein; sonst Pauschale senken). Test versandtor erweitern.

Parallel nur bei „dreh auf“ und nur ohne gemeinsame Dateien (z. B. 6 neben 2/3).

## Entscheidungen Tom 17.10. (nach Wirtschafts-Übersicht GTexfF1ZFmNoXxEGdZG8Ah) – Paket „Balancing & Rechnungen“
- Anfang darf etwas eintönig sein (Eingewöhnung), aber nicht zu lang – über die Wirtschaftsregler lösen (z. B. Kredit als Beschleuniger).
- **Miete neu** (je Fläche). **Rechnungen statt Abbuchung:** Miete, Kreditraten usw. gehen NICHT automatisch ab, sondern stehen im Laptop unter „Rechnungen“; der Spieler wählt, wann er zahlt – zahlen muss er irgendwann (Fälligkeit, Folgen bei Verzug).
- **Kundendeckel wächst mit der Ladengröße** (je größer der Laden, desto mehr Kunden gleichzeitig).
- **Verkaufsstarke Tage (Silvester-Ansturm/Saisonspitzen) vorerst raus** – schwer zu bemessen.
- **Spielstände** müssen zuverlässig speichern (save() schluckt Fehler – beheben, Fehler sichtbar machen).
- **Finanzbildung sichtbar:** Tagesabschluss zeigt klar Einnahmen und alle Ausgaben (Wareneinsatz, Miete, Löhne, Zinsen, Fixkosten …).
- **Später (gemerkt):** Stadtfeuerwerk als Finale. **Nicht machen:** lebendige Kunden (Wünsche/Beratung). **Wetter** bleibt wie es ist.
- Nach dem Balancing: Desktop-Version (Electron, eigenes Fenster, Speichern als Datei) für lokales Spielen/Steam.

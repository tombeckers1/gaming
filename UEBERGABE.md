# Übergabe Böllerladen Simulator (Stand 08.10.2026, abends)

Für den neuen Chat. Erst diese Datei lesen, dann loslegen.

## 1. Stand
- Branch `claude/artifact-review-task-d47i09`, Commit `47c5499`, gepusht.
- Spiel-Artefakt (immer nach jeder Änderung neu veröffentlichen und den Link mitschicken):
  https://claude.ai/artifact/7zw7iHrZYiYSGzw1QHNwVJ (Version 119)
- Ausbauplan v7: https://claude.ai/artifact/TDsAd4EeAgzsdvS6k6gf5T (Kopie: `docs/uebergabe/ausbauplan-v7.html`)
- Ein Spiel-HTML (three.js r128), gebaut aus `src/parts/*.js` über `src/build.sh`. 164 Tests in `src/tests/`.

### Seit V117 neu (V118 + V119)
- **Feuerwerk:** Korrekturrunde aus Toms Befunden (`docs/uebergabe/befunde.md`), 10 neue Themen-Batterien
  (Kornblumen, Bienenweide, Weinlese, Mohnfeld, Winterwald, Fuchsien, Korallenriff; Königsklasse:
  Schwarzer Samt, Meteorschauer, Phönix), 10 neue Kugelbomben (Silberdistel … Himmelstreppe).
  132 Produkte. Laptop: „Vorführung (Änderungen)“ und „Kugelbomben-Vorführung“.
- **Verpackungen:** Batterie-Bauformen, Kleinfeuerwerk ausgepackt auf dem Zündtisch.
- **Menschen:** Rocketbox-Figuren (Skinned Mesh, Gehen/Stehen, Arm-IK, Tüte), Kassen standardmäßig weiß.
- **Karton:** Spieler öffnet den Karton, Inhalt sichtbar, Stück für Stück einräumen.
- **Gameplay** (`docs/uebergabe/gameplay.md`, Punkte 1–5, 10, 13, 16, 18):
  - Eiswürfel raus.
  - Versandecke ans hintere Ende von Süd 3 an Rolltor V1, Kran gedreht, gelbe Box offen zum Tor.
  - DDL-LKW um 22 Uhr, Hubwagen-Verladung (ab 18 Uhr auch durch den Spieler), Paletten bis 1,75 m.
  - Durchgang an R1 frei, Licht in den Ladenerweiterungen (gemessen etwa 3× heller).
  - Grafikstufe „Ultra Low“ (etwa 70 % weniger Dreiecke).
  - 1.4G-Raute nur auf Feuerwerkskartons, 228 Lieferkarton-Varianten.
  - Picker-Touren gebündelt (Weg im Lager −21 %).

### Bekannte Schwächen (ehrlich)
- `themen` mit R4=1 ist knapp (Zufallsschwankung, weinlese 24,8 vs. bienenweide 25,4).
- Der Verpackungsraum (17c) bricht bei jeder Änderung der Produktzahl (feste Möbelliste, leere Fächer).
- `leistung` (erstes Feuerwerksbild) und `gameplay` (PACKMATERIAL) waren einmal rot und bei Wiederholung grün, vermutlich Flakes.
- Der Test `lager` prüft Süd III nur noch bis z −20,7, weil die Versandecke dahinter steht.
- Die kleinen Kugeln (75–150 mm) sind dünner als der Himmelsbrecher; Phönix ist bei der Last am Limit (~20 000 Funken); die Riesenpalme liest sich aus 90 m etwas als Ring.
- Die Packer laufen bis zu 48 s am Stück (Station hinten in Süd 3). Plan v7 löst das (Kartonlager als ein Raum).
- Stufe 1 ohne Roboter-Kran ist NICHT umgesetzt (der Kran ist in allen Stufen da). Tom fragen, ob gewünscht.
- Echte GPU-FPS sind nicht gemessen (nur Software-Renderer). Tom misst auf seinem PC (i7-4790, vorher 10–11 FPS auf Niedrig).

## 2. Offene Aufgaben (Vorschlag Reihenfolge)
0. **Tests beschleunigen** (etwa ½ Tag): Spielstand nicht in jedem Test neu laden (Ladezeit ~50 s je Test). Spart geschätzt 30–40 % Testzeit für alles Weitere.
1. **Modell-Arbeiten (Opus)** aus `gameplay.md`:
   - 6: Packmaterial-Modelle mit sichtbarem Füllstand.
   - 9: Automat „Rakete personalisieren“ neu modellieren.
   - 11: graue, hochwertige Regalschilder.
   - 12: Lagerregale mit mehr Textur.
   - 14: Läden gegenüber, Innenräume detailliert.
   - 15: LKWs Großhandel/Import mit Textur, 1.4G-Raute nach ADR korrekt.
   - 17: Fassade mit mehr Detail; Ladenschild ohne Schattenschrift.
2. **Feuerwerk:**
   - Batterie-Formen und Verpackungen nach Toms Referenzbildern 3–7 (#189).
   - Raketen-Runde (Tom: „später“).
   - Kleine Kugeln kräftiger.
   - Verpackungsraum robust machen (Möbel aus der Produktzahl berechnen).
3. **Großer Bau nach Plan v7 – NUR auf Toms Startsignal**, Phasen nacheinander. Schätzung im neuen Chat: realistisch 7, spätestens 10 Tage; mit Test-Beschleunigung etwa 5.
   1. **Ladebildschirm:** Die große Halle (auch über den Zugang durchs Kartonlager) wird erst beim Betreten gebaut/geladen, vorher leistungsneutral. Vorher/nachher messen (heute gibt es schon Frustum-Culling).
   2. **Lager-Umbau:**
      - Kartonlager ③ mit gelber Wand und Tor N1.
      - ①–③ am Ende ein Raum ohne Trennwände (je Bereich freischaltbar).
      - Schleuse ~13 m.
      - Wareneingang-Stellplätze, 13 Schnellplätze an der Hallenwand, Packmaterial-Fläche.
   3. **Hochregal:**
      - 10 m hoch, braucht Hallenstufe 3 = 11 m.
      - 3 Gassen, Roboter und I/O je Gasse.
      - Anbruch: Palette raus, nur die nötigen Kartons nehmen, Rest zurück.
      - Lagerist bringt die Kartons durch N1 ins Kartonlager.
   4. **Produktion:**
      - 5 m Decke, 3 Fertigungsstraßen nacheinander freischalten: Raketen → Kugelbomben → Batterien.
      - R6 Wareneingang (Rohstoffe), R5 Warenausgang.
      - Je Straße eigene Rohstoffe/Materialien zum Bestellen.
      - Optik: automatisierte Laufbänder, Portal-Greifer, Rohr-Raster, gern mehrere Stockwerke (Foto `docs/uebergabe/produktion-referenz.webp`).
      - **Vorher Produktionskonzept mit Tom klären** (Rohstoffe, Rezepte, Dauer, Kosten, Qualität, was tut der Spieler).
   5. **Gameplay-Vorführung** zeigt in jeder Phase alles.
   - Versand: KEIN Pickregal. Der Packer pickt mit dem Rollwagen aus dem ganzen Kartonlager, mehrere Bestellungen je Tour.
   - Merken: feste Bauplätze mit Auswahl, Spieler setzt Schwerpunkt (z. B. Produktion ODER Online-Shop).
4. **Release-Plan:**
   - USA-Start 4. Juli 2027.
   - Kostenlose Demo zum Steam Next Fest Juni 2027.
   - Steam-Seite spätestens Frühjahr 2027, Streamer ab April.
   - Nötig: Englisch, Sommer-Saison mit 4.-Juli-Event, US-Produktnamen.
   - Ab Jahresende keine neuen Ideen mehr.
   - Tom ist vom 30.10. bis 16.11. in Japan.
5. **FPS-Analyse** (Gruppen einzeln abschalten, Frame-Zeit messen): nur auf Toms Wort, als Wochenend-Aufgabe.
6. Ideen (`docs/uebergabe/ideen.md`): Geopolitik-Spiel (Favorit), Xbox-Port später (Unity) und weitere.

## 3. Regeln für die Zusammenarbeit (Toms Wünsche)
- **Antworten:** Deutsch, wirklich kurz, ehrlich, kein Moralapostel. Messen statt raten, bei jedem Fix eine Gegenprobe.
- **Artefakt:** nach jeder Änderung neu veröffentlichen und den Link IMMER mitschicken.
- **Anomalie:** jedes Feuerwerksprodukt einzigartig (Effekt, Abschussfolge, Name passt, Steigerung über die Level).
- **Agenten:**
  - Bricht einer ab: sofort und ohne Rückfrage fortsetzen.
  - Wächter alle 2 h, in der Endphase ein billiger Check alle 30 Min.
  - Sonnet für Routine, Opus für Gestaltung/Effekte.
  - Höchstens 2 Agenten, und nur, wenn sie sich keine Testsperre teilen. Sonst nacheinander und Tom VORHER warnen.
- **Tests:**
  - Agenten testen nur, was sie geändert haben.
  - EIN Merge und EINE Regression am Ende.
  - Ein Lauf belegt die Sperre höchstens ~20 Min; FPS-Messungen kurz und nur am Ende.
  - Prüfen, dass ein Testlauf wirklich läuft, statt blind zu warten.
- **Zeitprognosen:** Testminuten × 2 + 1–2 Fehlerrunden à 60 Min + Puffer für Neustart. Angabe als Uhrzeit (deutsche Zeit) mit „realistisch“ und „spätestens“. (Am 08.10. lag ich 3–4× zu optimistisch.)
- **Tokens:** sparsam. „Dreh auf“ von Tom heißt: parallelisieren, aber nur unabhängige Aufgaben.
- **Neue Aufgaben im alten Chat:** nicht starten, an den Chatwechsel erinnern.

## 4. Bauen und Testen
```sh
# Spiel bauen (Repo-Wurzel)
sh -c '. ./src/build.sh; W=./src; build' && mv src/boellerbude.html boellerbude.html

# Test-HTMLs erzeugen (in einem Arbeitsordner mit Kopie von tools/test/*)
cp boellerbude.html tools/test/three-stub.js tools/test/three.min.js tools/test/mk*.py tools/test/ladezeit-preload.js <ordner>/
cd <ordner> && python3 mktest.py && python3 mkreal.py   # test.html (Stub) / real.html (echtes three r128)

# Einen Test fahren (nie zwei gleichzeitig: Sperre /tmp/bb-testlock)
flock /tmp/bb-testlock timeout 3600 node -r ./ladezeit-preload.js /home/user/gaming/src/tests/<name>.js $PWD/real.html
# Varianten: HANDY=1 (Handy-Ansicht), test.html statt real.html für schnelle Logik-Tests
```
- Playwright/Chromium ist vorinstalliert, ohne GPU (Software-Renderer, langsam: ~50 s Ladezeit je Test).
- `tools/test/kontakt.js` erzeugt ein Kontaktbild (Figuren, Karton, Handy, Zündtisch).
- Die alten Arbeitsordner lagen im Scratchpad und sind nach dem Chatwechsel weg. Alles Nötige liegt jetzt in `tools/test/` und `docs/uebergabe/`.

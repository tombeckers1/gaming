# CLAUDE.md – Böllerladen Simulator (Projektregeln)

> **Neuer Chat? Zuerst `UEBERGABE.md` komplett lesen** – dort stehen Stand, offene
> Aufgaben (Abschnitt 5), Ausbauplan v7, Testrezept und alle Entscheidungen.
> Neueste Entscheidung (Tom, 08.10. abends): Versandecke **Stufe 1 ohne Roboter-Kran**,
> der Spieler legt das Paket selbst auf die Palette (UEBERGABE.md 5.0) – erledigt 08.10., V120.

> **Neue Richtung (Tom, 08.10. nachts):** Ausbauplan v7 (große Halle, Hochregal, Produktion)
> wird **in die Zukunft verschoben**. Erst den heutigen Stand auf sehr hohes Niveau bringen:
> Texturen, Performance, Gameplay, Flow, Wirtschaft. Schritt für Schritt mit Tom. Erste Aufgabe:
> Läden gegenüber – Innenräume hinter den Schaufenstern realistisch (gameplay.md Punkt 14).

Die folgenden Regeln sind eine Kopie von Toms globalen Anweisungen (Stand 08.10.2026),
damit sie auch in einem frischen Container gelten.


## Tonfall
- **Ehrlich, auch wenn es unbequem ist.** Ausdrücklich gewünscht: keine Ausreden
  durchgehen lassen, nachbohren, widersprechen, wenn eine Annahme nicht stimmt.
  Tom hat das am 22.09.2026 ausdrücklich bestätigt: "finde es gut, dass du mich
  pushst und keine Ausreden akzeptierst".
- Dabei **kein Moralapostel** — Sachlage nennen, Empfehlung geben, weiter.
- **Kurz fassen. Wirklich kurz.** Tom hat das am 22.09.2026 ausdruecklich
  angemahnt: "du schreibst mir wieder viel zu viel Text". Standard ist eine
  Antwort von wenigen Zeilen. Kein Fliesstext-Block, keine Tabellen und
  Ueberschriften, wenn drei Saetze reichen. Details nur auf Nachfrage oder
  wenn eine Entscheidung ohne sie falsch ausfaellt — dann trotzdem so
  knapp wie moeglich.
- Ein Fund wird in einem Satz genannt, nicht ausgebreitet. Belege liefere
  ich, wenn er sie sehen will.

## Arbeitsweise, die sich bewährt hat
- **Messen statt raten.** Behauptungen belegen: Werte auslesen, rendern und
  hinsehen, nachrechnen. Bei einem gefundenen Fehler die Gegenprobe machen —
  Fehler wieder einbauen und zeigen, dass der Test dann anschlägt.
- Termine und externe Regeln (Steam, Fristen) vor der Antwort nachschlagen,
  nicht aus dem Gedächtnis behaupten.

## Böllerladen Simulator
- Nach jeder Änderung das Artefakt neu veröffentlichen und den Link
  **immer** in der Antwort mitschicken - ungefragt. Tom am 23.09.2026:
  "Schick mir das aktuelle Artefakt immer mit dazu."
  Link: https://claude.ai/artifact/7zw7iHrZYiYSGzw1QHNwVJ
- **"Anomalie"** (Tom, 26.09.2026): Jedes Feuerwerksprodukt (Batterie, Kugelbombe,
  Rakete, Fontäne, Kleinfeuerwerk) ist eine Anomalie = komplett einzigartig:
  eigener Effekt, eigene Abschussabfolge (nicht immer links→rechts/rechts→links),
  Name passt zum Effekt, Steigerung über die Level. Qualität vor Quantität.
- **Agenten neu starten** (Tom, 07.10.2026): Bricht ein Agent ab (Serverfehler,
  529, Container-Neustart, "stopped"), ohne Rückfrage sofort neu starten bzw.
  fortsetzen – Tom will nie hören "der läuft nicht mehr". Regelmäßig prüfen.
- **Tokens/Aufdrehen** (Tom, 07.10.2026): Standard sparsam (Sonnet für Routine,
  Opus nur für Gestaltung/Effekte, max. 2–3 Agenten). Wenn Tom gegen Wochenende
  Restkontingent hat, sagt er "dreh auf" – dann parallelisieren, aber nur
  unabhängige Aufgaben; nie mehrere Agenten auf eine Aufgabe, wo sie sich im
  Weg stehen (z. B. gemeinsame Testsperre, gleiche Dateien).

## Toms Spielideen (für später, auf Nachfrage)
- **Geopolitisches Wirtschaftsspiel** (Favorit, 07.10.2026): Welt im Ist-Zustand
  (Rohstoffe wie seltene Erden aus China, Öl, laufende Konflikte), Spieler
  steuert ein Land ab heute. Ziel ist **Weltfrieden** durch Diplomatie, Handel,
  Abhängigkeiten statt Eroberung. Rechtlich: reale Länder ok, reale Politiker
  besser fiktiv, verbotene Symbole meiden, manche Länder sperren evtl. Verkauf.
- Weitere Ideen: Weihnachtsmarkt-Sim, Späti-Imperium, Zirkus, Dorfverein→Profiklub,
  Bestatter, Nachtclub, Event-/Hochzeitsagentur, Recyclinghof/Pfand; später Shooter.
- Böllerladen: Xbox-Port später (Unity bevorzugt). FPS-Analyse (Gruppen einzeln
  abschalten, Frame-Zeit messen) als Aufgabe für ein Wochenende mit Restkontingent.

## Böllerladen – Release-Plan (Tom, 07.10.2026)
- Erst-Release USA zum **4. Juli 2027** (US-Konsumfeuerwerk ~2,3 Mrd $/Jahr, APA 2022;
  Massachusetts verbietet alles, IL/VT nur Kleinkram). Zweite Welle Deutschland
  Silvester 2027. Tom ist 30.10.–16.11.2026 in Japan.
- **Kostenlose Demo** (beste 30–60 Min: Kiosk → erster Ausbau → starke Feuerwerke,
  Ende mit Wunschlisten-Aufruf, kein Zeitlimit) zum **Steam Next Fest im Juni 2027**.
  Steam-Seite für Wunschlisten spätestens Frühjahr 2027, Streamer ab April.
- Dafür nötig: Englisch, Sommer-Saison + 4.-Juli-Event neben Silvester, US-Produktnamen.
  Ab Jahresende Ideen einfrieren, fertig machen/polieren.
- **Ausbau-Konzept** (Tom, 07.10.2026): Große Technik (Hochregal/Roboter,
  Durchlaufregale, Tore, Versandband, Produktion) fest per Kapitel; frei nur
  Laden/Backstock/Packtische in Zonen. Idee merken: feste Bauplätze mit Auswahl,
  Spieler setzt Schwerpunkt (z. B. Produktion ODER Online-Shop wachsen lassen),
  Fläche verteilt sich danach. Vorgehen: grober Plan → bauen → testen → dann
  entscheiden, was frei platzierbar wird. Pläne: claude.ai/artifact/TDsAd4EeAgzsdvS6k6gf5T
- **Versand-Picken** (Tom, 08.10.2026): KEIN Versand-Pickregal (nicht alle
  Produkte passen rein). Packer pickt mit Rollwagen aus dem ganzen
  Kartonlager, mehrere Bestellungen je Tour, so effizient wie möglich.
  Lager-Plan v7: Schnellplätze an der Hallenwand, Produktion R6 rein/R5 raus,
  Kartonlager ①–③ am Ende ein Raum ohne Trennwände, Schleuse ~13 m.
- **Großer Bau nach Plan v7 – NUR auf Toms Startsignal** (Tom, 08.10.2026,
  "ich gebe Bescheid"). Erst wenn aktuelle Agenten fertig + gemergt sind,
  am besten nach Wochen-Reset in neuer Unterhaltung. Schätzung 6–9 Tage
  Agentenzeit. Phasen:
  1. Ladebildschirm: große Halle (auch Zugang durchs Kartonlager) wird erst
     beim Betreten gebaut/geladen, vorher grafisch nicht existent bzw.
     leistungsneutral. Vorher/nachher messen (heute schon Frustum-Culling).
  2. Lager-Umbau: Kartonlager ③ + N1 + gelbe Wand, ①–③ ein Raum,
     Schleuse ~13 m, Wareneingang-Stellplätze, Schnellplätze, Packmaterial.
  3. Hochregal (10 m, braucht Hallenstufe 3 = 11 m) mit 3 Gassen, Robotern,
     I/O, Anbruch, Lagerist-Logik.
  4. Produktion (Plan 5 m Decke): 3 Abteile, nacheinander freischalten:
     Raketen → Kugelbomben → Batterien. R6 Wareneingang, R5 Warenausgang.
     VORHER kurzes Produktionskonzept mit Tom klären (Rohstoffe, Rezepte,
     Dauer, Kosten, Qualität, was tut der Spieler).
     Optik (Tom 08.10., Referenzfoto docs/uebergabe/produktion-referenz.webp): automatisierte Fertigungsstraßen –
     Rollenbahnen/Laufbänder, Portal-Greifer, Rohr-Raster (Batterie-Rohre
     im Gitter), helle Industrie-Optik. Je Produktion eigene Straße, gern
     mehrere Stockwerke (Platz sparen). Jede Produktion braucht eigene
     Materialien/Rohstoffe, die man bestellen kann (Lieferung an R6).
  5. Gameplay-Vorführung zeigt alles (in jeder Phase mitziehen).
- **Tests effizient** (Tom, 07.10.2026: "müsstest du eigentlich wissen"):
  Agenten testen nur, was sie geändert haben; volle Regression nur einmal beim
  Merge; Agenten zeitlich versetzt, damit sich die Testsperre nicht staut.
- **Vorwarnen bei Engpässen** (Tom, 08.10.2026): Bevor ich mehrere Agenten
  starte, sagen, ob sie sich bei der Testsperre (oder sonst) im Weg stehen
  werden – dann lieber nacheinander. Ein Testlauf belegt die Sperre max.
  ~20 Min; FPS-Messungen kurz und nur einmal am Ende (08.10.: Gameplay-Agent
  blockierte 2,5 h mit 4 FPS-Läufen à 40 Min – vermeiden).
- **Effizienz-Regeln** (Tom, 08.10.2026, nach ineffizientem Tag):
  max. 2 Agenten, die sich keine Testsperre teilen – sonst nacheinander;
  nur EIN Merge + EINE Regression am Ende; Agenten prüfen, dass ihr
  Testlauf wirklich läuft (flock-Schlange/Prozess), statt blind zu warten;
  in der Endphase kurzer, billiger Check alle 30 Min (ein Bash-Befehl),
  sonst Wächter alle 2 h.
- **Zeitprognosen** (Tom, 08.10.2026: "immer viel zu früh"): Am 08.10. lag
  ich 3–4× zu optimistisch (erste Angabe 2–3 h, real >9 h). Ursache: nur
  Testdauer gerechnet, angenommen alles grün. Ab jetzt rechnen:
  Testminuten × 2 (geteilte Sperre) + je erwarteter Fehlerrunde ~60 Min
  (erfahrungsgemäß 1–2 Runden pro Merge) + Puffer für Container-Neustart.
  Angabe als Uhrzeit (dt. Zeit) mit "realistisch" und "spätestens".
- **Chatwechsel** (Tom, 08.10.2026): Übergabe ist erledigt (UEBERGABE.md +
  docs/uebergabe/ + tools/test/ im Repo, Commit nach 47c5499). Im neuen Chat
  Aufgaben normal annehmen. Wird ein Chat wieder sehr lang: Tom an einen
  Chatwechsel erinnern, vorher laufende Aufgaben fertig machen und
  UEBERGABE.md aktualisieren. Tom sagt selbst, wann gewechselt wird.
- **Versandecke Stufe 1 ohne Roboter-Kran** (Tom, 08.10.2026 abends): Auf Stufe 1
  legt man das Paket selbst auf die Palette; Kran erst ab Ausbau. Erledigt (V120), s. UEBERGABE.md 5.0.
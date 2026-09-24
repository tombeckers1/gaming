# Böllerladen Simulator – Demo und Vollversion

Stand 24.09.2026, festgelegt von Tom.

> **Offen (Stand 24.09.2026):** Tom entscheidet noch, ob und wann es eine Demo gibt.
> Priorität: Kein Spieler darf nach der Demo neu anfangen müssen. Eher wird das Spiel
> komplett fertig gebaut, als dass eine Demo mit unsicherer Spielstand-Übernahme erscheint.
> Der Dezember-Termin ist kein Muss.

## Demo (Entwurf, nicht beschlossen)

Kapitel 1–6, alles vor dem Logistikzentrum:

| Kapitel | Name | Eröffnet durch |
|---|---|---|
| 1 | Pyro-Kiosk | Start – Lieferung vor die Ladentür |
| 2 | Kleines Fachgeschäft | Lager mit Warenannahme |
| 3 | Großes Fachgeschäft | Ladenerweiterung 2 |
| 4 | Pyro-Versand | Onlineshop |
| 5 | Eigene Marke | Entwicklungslabor |
| 6 | Pyro-Kaufhaus | Ladenerweiterung 4 |

## Vollversion

Ab Kapitel 7. Der letzte große Raum (Logistikzentrum) gehört nicht zur Demo.

| Kapitel | Name | Inhalt | Stand |
|---|---|---|---|
| 7 | Pyro-Logistik | Logistikzentrum mit Toren, Andockstationen 2–5 | gebaut |
| 8 | Pyro-Fabrik | eigene Fabrikhalle, eigene Produkte in Serie, Rohstoffe, Qualität | geplant |
| 9 | Pyro-Großhändler | andere Läden beliefern, eigene LKW-Flotte, Händlerverträge | geplant |
| 10 | Pyro-Kette | Filialen in anderen Städten, Filialleiter, zentrale Preise | geplant |
| 11 | Pyro-Imperium | Finale: offizielles Silvester-Stadtfeuerwerk mit Musik, am Ende leuchtet die ganze Stadt | geplant |

## Technik

- Kapitel stehen in `src/parts/02-data.js` (`KAPITEL`, Feld `voll` für Vollversion, `geplant` für noch nicht gebaut).
- `DEMO` in derselben Datei: auf `true` setzen, um die Demo zu bauen. Dann lassen sich die
  Vollversions-Kapitel im Laptop ansehen, aber nicht kaufen.
- Test: `src/tests/kapitel.js` prüft Kapitelreihenfolge, Markierung und Demo-Sperre.

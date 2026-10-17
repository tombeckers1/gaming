# Durchschnittlicher Spielverlauf – Bot „mittel“ (V142, Seed 1, 200 Spieltage)

Stand 17.10.2026, Spiel unverändert (detached 67d1212). Daten: `mittel.jsonl` (je Tag eine Zeile), `mittel.json`
(Auswertung), `vergleich-hype.json` (Gegenlauf ohne Zünden), `ohne-zuenden.jsonl`.
**Echtzeit = Spieltage × 8,5 Min** (ist-analyse: 330 s Öffnung + Ausklingen + 150 s Vorbereitung + 15 s Abschluss).
200 Spieltage = 28,3 h Echtzeit, erstes Silvester = Tag 91 = 12,9 h.

## Was der Bot tut (Strategie `mittel` in `sim.js`)
- wie „gut“, aber **Preise +10 %** über Markt; Ware je Sorte ~3 Verkaufstage, Saisonspitzen eingeplant,
  Kartons je Bestellung nach Sortimentsbreite, bezahlt auch aus dem Dispo (lässt Regale nicht leerlaufen).
- **Ausbau-Polster 1,15×** (Fläche ab 1,15× Preis + 2 Tage Kosten, Kleinkram 1,6×; Flaute 1,4× mehr),
  Reihenfolge wie „gut“, Werkbank nur kleinste Stufe. Regale ab 1,3× Preis.
- **Lizenzen** ab 1,15× Preis, wenn freie Fächer für 75 % der neuen Sorten da sind.
- **Höchstens ein Kredit** (nur Fläche, Tagesrate ≤ 40 % des üblichen Tagesgewinns), vorzeitige Tilgung.
- **Personal nach Bedarf** (Kunden-Schnitt): Reinigung ab 50 Kunden/Tag, Einräumer ab 15 Sorten, 2. ab 40 Sorten
  + 16 Regalen, Kassierer ab 70 Kunden, SB-Betreuer ab 110, Packer sobald Packstation steht. Kurzarbeit in der Flaute wie „gut“.
- **Testfeld**: abends 1 Stück (17:30), bei Saisonfaktor ≥ 1 zwei (17:00, 18:30): Stück aus dem Regal →
  `placeOnStation` → `zuendeKanal` (= Pult, 14z4 `abZuenden` → `igniteType`: Hype, XP, Bruchbild gesehen).
  Meister Hype bis ~1 % des Kontos (8–60 €), Abwechslung; vor dem ersten Bruchbild lieber Steigendes.
- **Werkbank**: kleinste Stufe, Standard-Entwurf (3 Abschnitte, Finale) „Hausmarke Feuerkranz“, Mindestserie,
  Preis Markt +10 %, Nachbestellung bei < 2 Kartons.

## Verlauf in Zahlen
| Tag | Echtzeit | Level | Kap. | Konto | Gewinn/Tag Ø | Kunden/Tag Ø |
|---|---|---|---|---|---|---|
| 7 | 1,0 h | 9 | 1 | 1.204 € | 180 € | 39 |
| 21 | 3,0 h | 16 | 2 | 1.554 € | 435 € | 48 |
| 42 | 6,0 h | 24 | 2 | 3.993 € | 970 € | 68 |
| 76 | 10,8 h | 33 | 3→5 | 7.889 € | 1.896 € | 97 |
| 91 (Silvester) | 12,9 h | 37 | 5 | 6.411 € | 840 € | 95 |
| 120 | 17,0 h | 42 | 5 | 13.497 € | 1.939 € | 81 |
| 174 | 24,7 h | 52 | 6 | 24.158 € | 5.106 € | 82 |
| 199 | 28,2 h | 56 | 6 | 20.813 € | 4.834 € | 78 |

(Gewinn/Kunden = Schnitt der 10 Tage bis dahin; Gewinn = Kontoveränderung ohne Investitionen und Kredit.)

Kapitel: 2 an Tag 22 (3,1 h), **3, 4 und 5 gleichzeitig an Tag 76 (10,8 h)** – Onlineshop (T49) und Werkbank (T44)
waren schon vorher gekauft, Kapitel 3 hing an Ladenerweiterung 2 (7.500 €). Kapitel 6 an Tag 174 (24,7 h).
Kein Tag im Minus, tiefster Stand 64 € (Tag 2), Ruf ab Tag 10 nie unter 90. Ein Kredit: 900 € an Tag 14
(Rate 77 €/Tag, 14 Tage) für Ladenerweiterung 1, an Tag 23 vorzeitig getilgt.

## Befunde (ehrlich)
1. **Durststrecken > 1 h: erst spät, und nur drei** (T159–167, T174–183, T183–195; 1,1–1,7 h), alle im
   Spätspiel beim Sparen auf Lizenzen für 15–21 Tsd. €. Bis Tag 150 liegt zwischen zwei spürbaren Käufen
   höchstens ~1 h (meist 30–60 Min). **Die erste Stunde (Tag 0–7) hat außer Regalen nichts** – genau 1 h.
2. **Level läuft dem Geld davon** – Freischaltungen, die lange warten: Ladenerweiterung 2 (frei T15, gekauft
   T75: 60 Tage ≈ 8,5 h), Ladenerweiterung 4 (67 T. ≈ 9,5 h), Lagererweiterung 4 (58 T.), Meisterbrief (101 T.).
   Lizenzen warten 70–167 Tage – hier bremst **Regalplatz**, nicht Geld: Silvester-Klassiker (380 €, 16 Sorten)
   kam erst an Tag 107, d. h. **das erste Silvester lief ohne Klassiker**, Verbund & Kugelbomben erst T125.
   Level 37 zu Silvester, Level 56 nach 200 Tagen – das Level sagt kaum noch etwas über den Ausbau.
3. **Geld stapelt sich nicht** (kein Tag mit Konto > 3× teuerste kaufbare Sache). Spitze 57.000 € an Tag 173,
   direkt vor Ladenerweiterung 4 (34.000 €). Im Spätspiel ist immer eine teure Lizenz offen.
4. **Silvester fällt flach.** 27.–31.12.: Umsatz 22.150 € (Ø 4.430 €/Tag ≈ 2,6× November), aber Kunden bleiben
   bei 90–101/Tag (Deckel 20 gleichzeitig; 26–55 verpasste je Tag). **Am 31.12. (Saisonfaktor 4,1) nur 2.958 €
   Umsatz** – weniger als ein normaler Dezembertag. Gewinn 27.–31.12. zusammen nur 342 € (Einkauf für die Spitze),
   der Vorrat wird erst 1.–10.1. zu Geld (29.820 € Gewinn). Ab Tag ~60 ist der Laden fast immer am Kundendeckel.
5. **Hype wirkt praktisch nicht.** Gegenlauf gleicher Seed ohne Zünden (identisch bis Tag 42, dann nur das Zünden
   anders): Tag 42–129 Kunden 7.549 mit vs. 7.514 ohne (+0,5 %), Umsatz −2 %, Gewinn −8 %, gleiches Level.
   Nur im ersten Fenster (T42–51, vor dem Deckel) +14 % Kunden, danach steigen mit Hype nur die *verpassten* Kunden.
   Hype im Schnitt 7 von 100 über den Tag (Spitze ~74 abends); 1–2 Stück am Abend sind zu wenig, und der Deckel frisst den Rest.
6. **Werkbank** (gekauft T44, Batterie erst T57 – vorher fehlte ein gesehenes Bruchbild): 3,5 Sterne, Stückkosten
   13,54 €, Markt 33,14 €, Entwicklung 540 €. 13 Serien, 13.867 € Umsatz in 143 Tagen (~97 €/Tag) – nett, kein Treiber.
7. **Online**: Onlineshop T49 (Level 25), Pauschale 300–400 €/Tag = 14 % des Betriebsgewinns. Packstation erst
   T159 (braucht Lagererweiterung 4). Versand danach **nicht aussagekräftig**: 836 offene Bestellungen am Ende,
   ~42 € Versandumsatz/Tag, auch an Tagen mit aktivem Packer meist 0. Ursache nicht geklärt (Packweg des Bots oder Packer in test.html; zusätzlich schickt der Bot in der Flaute auch den Packer in Kurzarbeit).
8. **Personal** kam nach Bedarf: Reinigung T30, Einräumer T40, Kassierer T55, 2. Einräumer T79, Packer T159.
   Löhne bleiben klein gegen Fixkosten (Ende: 988 €/Tag Fixkosten, wachsen mit dem Level).

## Grenzen
- Bot räumt ohne Laufwege ein, Personal spart ihm keine Zeit; Echtzeit ist eine Formel, nicht gemessen.
- Versand ab T159 unbrauchbar (Pakete werden kaum gepackt, Ursache offen; Kurzarbeit trifft auch den Packer). Lizenz-Regel (75 % freie Fächer) hält Lizenzen
  zurück; ein Mensch kauft Klassiker vermutlich früher (mit Ruf-Risiko durch Wünsche ohne Fach).
- `--weiter` ist unzuverlässig: ab ~Tag 86 klappte das Speichern zwischen Etappen nicht immer (Spielstand fiel auf
  einen älteren Tag zurück, `save()` schluckt den Fehler). Der Endlauf lief darum in **einem** Prozess (27 Min).
- test.html brauchte drei Ergänzungen im three-Stub (`clearGroups`, `setFromMatrixPosition`, `transformDirection`),
  sonst lädt V142 gar nicht. Vorschlag in `vorschlag/tools/test/three-stub.js`.
- Ein Lauf, ein Seed. Verlauf bis Tag 42 identisch zu „ohne Zünden“, also reproduzierbar.

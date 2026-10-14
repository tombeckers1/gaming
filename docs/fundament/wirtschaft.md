# Wirtschaft – wie das Spiel rechnet (Fundament Etappe 4, Stand 13.10.2026)

**Toms Wunsch (13.10.):** eine Stelle für alle Wirtschaftszahlen. Ändert man eine Größe, wirkt sie nachvollziehbar
auf alles Abhängige. Zweck ist Finanzbildung: welche Entscheidung hat welche Folge – und **warum**.

Diese Etappe hat **nichts am Verhalten geändert** (Beweis unten). Sie hat die Zahlen an eine Stelle geholt und die
Zusammenhänge aufgeschrieben, so wie sie **heute** im Code wirken – mit den Lücken, die das Balancing danach schließen soll.

## So ist es gebaut
- **Eine Datei:** `src/parts/01c-wirtschaft.js`. Darin `WIRT` (alle Zahlen, nach Bereichen: Start, Zeit, Saison, Kunden,
  Ware, Markt, Einkauf, Versand, Preise der Ausbauten/Lizenzen/Deko/Wände/Böden/Regale, Personal, Kredit, Fixkosten,
  Ruf, XP, Aufträge, Wochenziele, Herausforderungen, Labor, Historie), `WF` (kleine Rechenformeln, z. B. Online-Pauschale,
  XP-Kurve) und `WIRT_KETTEN` (die Wirkungsketten unten als Daten).
- **Kataloge bleiben, wo sie sind** (Ausbauten, Personal, Lizenzen … mit Namen, Texten, Level), holen ihre **Geldzahl**
  aber aus `WIRT`. Die alten Namen (`LOANS`, `VS_PORTO`, `DDL_PAUSCHALE`, `VERSAND` …) gibt es weiter.
- **Texte, die Zahlen nennen, werden aus den Zahlen erzeugt** (Handbuch, Beschreibungen, Laptop-Hinweise): ändert man das
  Porto, stimmt auch das Handbuch.
- **Eingefroren:** Niemand kann eine Zahl zur Laufzeit versehentlich verändern.
- **Alte Spielstände** laden wie vorher. Was im Spielstand steht (laufender Kredit, Restposten-Angebot, offene
  Bestellungen, eigene Rezepte), bleibt so – neue Werte wirken auf Neues. Die Erstattungen alter Ausbauten sind
  eingefroren (`WIRT.historie`), damit niemand wegen einer Preisänderung mehr oder weniger zurückbekommt.

## Eine Zahl ändern – und sehen, was passiert
1. Wert in `src/parts/01c-wirtschaft.js` ändern.
2. `node tools/fundament/wirtschaft-snapshot.js` zeigt jede Stelle, die sich dadurch ändert (Preise, Kundentakt,
   Tagesabschluss, Texte …). Bei Absicht: `--schreiben`, und im Bericht nennen.
3. `node tools/fundament/wirtschaft-uebersicht.js` schreibt die Listen unten und `wirtschaft-werte.md` (alle Zahlen,
   wo sie gelesen werden) neu; `--pruefen` meldet, wenn etwas veraltet ist oder eine Zahl nirgends gelesen wird.
4. Für das große Bild: `tools/balance/sim.js` (Bot spielt 30–45 Tage) vorher/nachher, `tools/balance/vergleich.js`.

## Entscheidung → Folge (so wirkt es heute)
Jede Zeile: was passiert, mit den **aktuellen** Zahlen, und wo es im Code steht (`Datei:Zeile`, Funktion).
Alle Zahlen einzeln: [`wirtschaft-werte.md`](wirtschaft-werte.md).

<!-- AUTO:KETTEN (erzeugt von tools/fundament/wirtschaft-uebersicht.js aus WIRT_KETTEN - nicht von Hand aendern) -->

### Zu viel auf einmal kaufen (Ware, Lizenz, Ausbau, Regale)
- Ware, Regale, Packmaterial und Restposten gehen bis in den Dispo (Konto + Rahmen); Ausbau, Lizenz, Deko, Personal, Rezepte nur mit echtem Guthaben. → `16-day.js:170` (verfuegbar)
- Dispo-Rahmen = 260 € + 70 € je Level (erst ab Level 4). → `16-day.js:169` (dispoLimit)
- Im Minus kostet jeder Tag 0,6 % des Minusbetrags an Zinsen (rund 219 % im Jahr) und -3 Ruf. → `16-day.js:181` (endDay)
- Weniger Ruf heisst weniger Kunden (x(0,55 + Ruf/100)) - und ohne Geld keine Ware, ohne Ware kein Umsatz: Abwaertsspirale, der Tagesabschluss warnt und nennt Auswege. → `16-day.js:124` (spawnInterval)
- Jedes Verkaufsregal kostet zusaetzlich jeden Tag Fixkosten (4 € klein ... 18 € Kühlschrank), jedes Lagerregal 6 €. → `16-day.js:172` (fixedCosts)
- **Warum:** Liquidität vor Rentabilität: wer alles in Bestand und Ausbau steckt, kann laufende Kosten nicht zahlen. Der Dispo verhindert, dass ein schlechter Tag das Spiel festfährt, ist aber teuer (0,6 % am Tag, rund 219 % im Jahr) - echte Dispozinsen sind zweistellig im Jahr, nicht dreistellig: bewusst überzeichnet, damit das Minus weh tut.
- **Lücke heute (fürs Balancing):** Geldpruefung uneinheitlich: Ware mit Dispo, Ausbau ohne, DDL-Ruf gar nicht. · Keine Insolvenz, keine Bank-Mahnung: das Minus kann beliebig tief werden, nur Ruf und Zins bremsen.

### Zu wenig (oder zu spaet) ausbauen
- Ladenflaeche zieht Kunden und fuellt Koerbe: Ladengroesse 1 + 0,34 / 0,26 / 0,3 je Erweiterung, Korb = 0,78 + 0,22 x Ladengröße. → `16-day.js:120` (ladenGroesse)
- Wenige Regalplaetze heissen wenige Sorten im Regal; Sortimentsbreite zieht Kunden: 0,78 + bis 0,52 (voll ab der Hälfte aller Sorten). → `16-day.js:114` (sortimentZug)
- Lizenz ohne Regalplatz: Kunden wünschen die neue Ware trotzdem (gedämpft auf 30 % der Nachfrage) - jeder Fehlwunsch kostet -0,4 Ruf. → `10-customers.js:217` (nachfrageFaktor)
- Werbung wirkt nur, solange gekauft: Plakat x1,3, Radio x1,25, Tafel x1,3, Kundenkarte x1,12 auf den Kundentakt. → `16-day.js:124` (spawnInterval)
- **Warum:** Wachstum braucht Kapazität (Fläche, Regale, Personal). Ausbau ist eine Investition mit Amortisation - wer nicht investiert, bleibt beim Umsatz stehen.
- **Lücke heute (fürs Balancing):** Fläche, Hallen, Tore, Packstation kosten keine laufende Miete - nur den Kaufpreis (Fixkosten hängen am Level, nicht an der Fläche). · Höchstens 20 Kunden gleichzeitig im Laden - große Fläche bringt an Silvester weniger als gedacht.

### Kredit aufnehmen
- Rahmen und Konditionen nach Level (Stufen 1.000 € ab Level 5 bis 60.000 € ab Level 26). → `16-day.js:39` (loanTier)
- Tagesrate = Betrag/Laufzeit + Restschuld x Tageszins; wird jeden Tagesabschluss abgebucht (auch an Ruhetagen). → `16-day.js:40` (loanDaily)
- Vorzeitig tilgen (250 €, 1.000 €, alles) spart Zinsen und bringt beim Ablösen 40 XP. → `16-day.js:46` (repayLoan)
- Mit laufendem Kredit zaehlt man bei Restposten als knapper (Druck x0,5) - es gibt öfter und mehr Angebote. → `17-laptop.js:375` (restDruck)
- **Warum:** Fremdkapital beschleunigt Investitionen, kostet aber Zins und bindet künftige Einnahmen (Rate). Gesamtzins über die Laufzeit je Stufe: 1.000 €: 6,6 % in 10 Tagen, 2.500 €: 8,4 % in 12 Tagen, 5.000 €: 10,5 % in 15 Tagen, 10.000 €: 12,8 % in 16 Tagen, 25.000 €: 16,8 % in 20 Tagen, 60.000 €: 21,3 % in 24 Tagen - lange Laufzeiten sind teurer.
- **Lücke heute (fürs Balancing):** takeLoan nimmt Laufzeit/Zins der HÖCHSTEN freigeschalteten Stufe, der Laptop zeigt die gewählte (Level 8: Karte 10 Tage 1,2 %, tatsächlich 12 Tage 1,3 %). · Zinsen sind Tageszinsen - kein Jahreszins sichtbar, kein Vergleich mit echten Konditionen.

### Versandkosten und Gratis-Schwelle im Onlineshop einstellen
- Jeder Online-Kunde mit Warenkorb w nimmt Versandkosten v hin mit p = exp(-0,75 x (v/(0,2 w + 2,5))^2); sonst Kaufabbruch. → `11c-versand.js:109` (vsAnnahme)
- Knapp unter der Gratis-Schwelle (ab 70 % davon) legen 60 % der Kunden noch etwas dazu. → `11c-versand.js:235` (vsNeueBestellung)
- Jedes Paket kostet festes Porto an DDL (S 2,00 €, M 3,50 €, L 5,00 €), jede Abholung 39 €, dazu Packmaterial je Paket. → `11c-versand.js:677` (vsBuchen)
- Wie viele Kunden ueberhaupt kommen: 4 + 0,12 x Ruf + 0,35 x Level (zwischen 4 und 22) x Packstation-Stufe x Sale. → `11c-versand.js:148` (vsBasis)
- Sale bringt mehr Bestellungen (Elastizitaet -1,5 auf alles, -2,62 je Produkt), jeder Rabatt-Euro fehlt aber am Ergebnis. → `11c-versand.js:126` (vsSaleFaktor)
- Mehr als 8 offene Bestellungen am Abend und Pakete, die seit gestern warten, kosten Ruf. → `16-day.js:181` (endDay)
- **Warum:** Versandkosten sind der häufigste Grund für Kaufabbrüche (Baymard 2024/25: 39-48 % wegen Zusatzkosten; Lewis/Singh/Fay 2006). Gratisversand lockt viele kleine Pakete, deren Porto man selbst trägt - Deckungsbeitrag je Paket rechnen.
- **Quelle:** Baymard Institute 2024/2025; Lewis, Singh, Fay 2006 (Marketing Science 25); UPS Pulse of the Online Shopper 2014 (58 % stocken auf); Bijmolt, van Heerde, Pieters 2005 (JMR 42, Elastizität -2,62)
- **Lücke heute (fürs Balancing):** Die Marktplatz-Pauschale (40 + 1,6 x Ruf + 4 x Level je Tag) kommt ohne jede Kosten und unabhängig von Versandkosten, Sale, Bestand - laut ist-analyse rund die Hälfte des Betriebsgewinns. · Saison, Werbung, Hype, Sortiment wirken nicht auf Online. · Der Ladenpreis wirkt online nur über den Deckel x1,3 - kein Preisvergleich.

### Faecher leer laufen lassen
- Kunde findet die Ware nicht: -0,4 Ruf je Wunsch, geht er ganz ohne Ware weitere -0,3. → `10-customers.js:255` (Customer)
- Bezahlt er trotzdem, gibt es nur 0,2 statt 0,8 Ruf. → `10-customers.js:402` (complete)
- Ruf wirkt auf Kunden je Tag, Preistoleranz (+Ruf/900), Geduld (+0,3 x Ruf) und Online-Besucher. → `10-customers.js:209` (priceTol)
- Leere Sorten werden seltener gewünscht (nur im Lager 50 %, nirgends 30 %) - der Umsatz fällt leise mit. → `10-customers.js:217` (nachfrageFaktor)
- **Warum:** Lieferfähigkeit (Servicegrad) ist ein Kernziel im Handel: Out-of-Stock kostet Umsatz und Kundenvertrauen.
- **Lücke heute (fürs Balancing):** Keine Tagesobergrenze für den Rufverlust - an vollen Tagen kann der Ruf in zwei Tagen kippen. · "Viel zu teuer" (Ruf -0,5) erscheint nicht im Tagesabschluss.

### Verkaufspreise setzen
- Kauf sicher, solange Preis/Marktpreis <= Toleranz; dann linear bis 0 bei Toleranz + 0,5. Toleranz = (0,95 + Ambiente/450 + Ruf/900 + Bilder + Freundlichkeit) x Ereignis x Konkurrenz. → `10-customers.js:210` (buyChance)
- Nimmt er gar nichts, weil zu teuer: -0,5 Ruf. → `10-customers.js:255` (Customer)
- Online zahlt der Kunde den Ladenpreis, hoechstens x1,3 vom Markt; Großaufträge rechnen mit dem Ladenpreis. → `11c-versand.js:168` (vsListe)
- **Warum:** Preis-Absatz-Funktion: höherer Preis = mehr Marge je Stück, aber weniger Käufer. Die Kundenerwartung folgt dem Markt (Inflation) - Preise müssen mitgezogen werden.
- **Lücke heute (fürs Balancing):** Die Preisampel im Laptop nutzt die Schwellen 0,2/0,45, die Rechnung 0,5 - die Ampel ist strenger als die Kunden.

### Personal einstellen, Lohn waehlen, Saisonpause
- Einstellung kostet einmal, der Tageslohn jeden Tag (auch Sonntag): Grundlohn x Lohnstufe (0,75 / 1 / 1,3 / 1,65). → `11-staff.js:269` (dailyWages)
- Lohnstufe macht schneller (Tempo 0,55 + 0,48 x Stufe) und freundlicher -> Preistoleranz und Geduld der Kunden. → `11-staff.js:127` (applyWage)
- Unter Lohnstufe 0,8 kündigt jeder mit 14 % Wahrscheinlichkeit je Tag, Ruf -1. → `11-staff.js:271` (staffMorale)
- Saisonpause: 30 % des Lohns, keine Arbeit, Rückkehr ohne neue Einstellung. → `11-staff.js:269` (dailyWages)
- **Warum:** Personal ist ein Fixkostenblock: lohnt sich nur, wenn es mehr Umsatz oder Zeit bringt als es kostet. Kurzarbeit in der Nebensaison statt Kündigen spart die Einstellungskosten.
- **Lücke heute (fürs Balancing):** Löhne folgen weder Inflation noch Level noch Ergebnis.

### Saison und Silvester einplanen
- Nachfrage je Datum (Tabelle saison.regeln, 31.12. = 1,5 + 5 x 0,34) mal Wochentag (Sa x1,35, So x0,55) bestimmt den Kundentakt. → `02-data.js:498` (dayMult)
- Ab dem 26.12. wollen Kunden F2 x1,9 und öfter ein Stück mehr. → `10-customers.js:221` (makeWishes)
- In der Nebensaison rufen Grosskunden oefter an (x bis 1,9). → `10b-pyro.js:23` (updatePhone)
- **Warum:** Feuerwerk ist extrem saisonal (Deutschland: Verkauf 29.-31.12.). Vorrat, Personal und Liquidität müssen auf die Spitze hin geplant werden.
- **Lücke heute (fürs Balancing):** Saison wirkt nicht auf Online, Markt/Einkaufspreise, Löhne, Fixkosten. · Kundendeckel 20 gleichzeitig bremst die Silvesterspitze.

### Einkaufen, wenn der Markt günstig ist
- Einkaufspreis folgt dem Tagesindex sofort, die Kundenerwartung nur träge (26 % der Lücke je Tag) - daraus entsteht die Einkaufschance. → `02b-markt.js:150` (rollMarkt)
- Inflation ~0,08 %-0,28 % je Tag (selten Sprünge) auf EK und Kundenerwartung. → `02b-markt.js:150` (rollMarkt)
- Grosshandel ab 10 Kartons 10 % / 20 Kartons 18 % Rabatt, Großhandelslizenz x0,9; Liefergebühr 5,90 € unter 150 €. → `17-laptop.js:206` (tierPrice)
- **Warum:** Einkauf ist der größte Kostenblock im Handel: Mengenrabatt und Timing gegen Kapitalbindung und Lagerplatz abwägen.
- **Lücke heute (fürs Balancing):** Inflation trifft keine Fixgrößen (Lohn, Fixkosten, Porto, DDL, Packmaterial, Ausbau, Regale). · SUPPLIERS.delay wird nirgends gelesen.

### Wachsen (Umsatz, Ausgaben -> Level)
- XP je Kunde 0,5 je € + 4, je Tag 60 + 5 % vom Umsatz; Level-Kurve 50 x Level^1,55. → `02-data.js:754` (xpFor)
- Auch Geld ausgeben bringt XP (Ausbau/Deko Kosten/12, Lizenz Kosten/14 + 30). → `17-laptop.js:1647` (buyUp)
- Jedes Level ab 4 kostet 4 € Fixkosten am Tag mehr, hebt Dispo/Kredit, Bekanntheit (+0,019 je Level) und das Diebstahlrisiko. → `16-day.js:172` (fixedCosts)
- **Warum:** Level ist der Fortschrittsanzeiger (Freischaltungen). Er sollte der wirtschaftlichen Leistung folgen, nicht nur der Spielzeit.
- **Lücke heute (fürs Balancing):** Level und Geld sind getrennte Kurven: Ausgaben-XP lassen das Level dem Geld davonlaufen (ist-analyse 3.3). · Die Fixkosten sind eine "Level-Steuer", keine echte Miete.

### Laden sauber und schön halten
- Jeder Kunde hinterlässt mit 8 % einen Fleck (mit Mülleimer 4 %); Sauberkeit = 100 - 7 je Fleck -> Kundentakt x(0,75 + Sauberkeit/300). → `16-day.js:124` (spawnInterval)
- Ambiente (Deko, Musik, Licht, Wand/Boden) hebt Takt, Preistoleranz und Geduld. → `02-data.js:857` (ambienteScore)
- Pruefung (Ereignis): Sauberkeit >= 70 bringt 3 Ruf, sonst -5. → `16-day.js:181` (endDay)
- **Warum:** Einkaufserlebnis beeinflusst Zahlungsbereitschaft und Wiederkehr.

### Gegen Diebstahl sichern (Kameras, Security, Warensicherung)
- Ab Level 4: Diebchance 3,5 % + Level x 0,35 % (bis +5 %); Kameras x0,5, Security x0,35; Warensicherung stellt 70 % der Diebe am Ausgang. → `10-customers.js:247` (thiefChance)
- Entkommt der Dieb: Ware weg (zum Einkaufswert in der Statistik), Ruf -1,8; gestellt: Ruf +0,6, 25 XP. → `10-customers.js:339` (escaped)
- **Warum:** Inventurdifferenz ist ein echter Kostenfaktor im Einzelhandel; Sicherung kostet Geld und lohnt erst ab einer Größe.
- **Lücke heute (fürs Balancing):** Der Diebstahl zählt nicht in die Tagesausgaben (Ware war schon bezahlt) - nur als Zeile "Diebstahl".

### Auf dem Testfeld zuenden (Hype)
- Jedes gezuendete Stueck bringt seinen Hype (bis 100), fällt 1,1 je Sekunde; Hype hebt den Kundentakt (x(1 + Hype/50)) und über 40 die F2-Wünsche x1,3. → `14b-shows.js:702` (igniteType)
- Die Ware ist weg (zum Einkaufswert als "Selbst gezuendet" im Tagesabschluss). → `16-day.js:181` (endDay)
- **Warum:** Marketing kostet Ware - Wirkung ist kurz und muss in den Umsatz der nächsten Minuten umschlagen.
- **Lücke heute (fürs Balancing):** "Gewinn des Tages" zieht Selbst-Gezündetes ab, obwohl es nie vom Konto abgeht (doppelt gezählt).

### Grossauftraege annehmen und verhandeln
- Mit Branchenbuch rufen Grosskunden an; Kartons je Auftrag nach Level, Wert = Kartons x Stueck x Ladenpreis x Angebot. → `10b-pyro.js:8` (makeCall)
- Hoch pokern ueber die Grenze kostet Versuche; Meisterbrief x1,33 auf die Auszahlung. → `10b-pyro.js:65` (haggle)
- Erfuellt: Ruf +2,5, XP; Kartons fehlen bei Abholung: Ruf -4. → `10b-pyro.js:133` (finishOrder)
- **Warum:** B2B-Geschäft: große Mengen, kleinere Marge, Lieferfähigkeit entscheidet.

### Hochregal und Kartonlager bauen (Lagerlogistik, Kapitel 7.3)
- Einmalig 18.500,00 €; danach jeden Tag 35,00 € je aktiver Gasse (Strom, Wartung RBG und FTS) in den Fixkosten. → `16-day.js:172` (fixedCosts)
- Lieferungen an Tor 2-4 landen auf Stellplaetzen und gehen automatisch ins Hochregal (180 Palettenplaetze in Gasse 1) - kein Einraeumen von Hand, Lagerplatz fuer grosse Grosshandels-Staffeln (ab 20 Kartons 18 % Rabatt). → `11f-hochregal.js:97` (ftsEinJob)
- Bestand im Hochregal zaehlt fuer Onlinebestellungen; das RBG lagert in den Anbruch aus, die FTS bringen Nachschub nach ③ und ①, Packer picken auch im Anbruch. → `11f-hochregal.js:253` (hrTick)
- **Warum:** Fixkosten gegen Skaleneffekt: Ein automatisches Lager lohnt sich erst mit Menge - wer wenig umschlaegt, zahlt jeden Tag Betrieb fuer leere Plaetze.
- **Lücke heute (fürs Balancing):** Ersparnis (Staffel, Wege) ist geschaetzt, nicht im Balancing-Lauf gemessen - der Bot erreicht Kapitel 7 nicht.

### Restposten und Wundertueten kaufen
- Preis = mittlerer Karton-Einkauf x Kartons x Faktor (0,7 ... 0,52), gerundet auf 5 €. → `17-laptop.js:342` (packPreis)
- Wer viel Geld hat (Konto/Tageskosten ueber 4 Tage), bekommt seltener und weniger Angebote; Qualität 86 %. → `17-laptop.js:375` (restDruck)
- **Warum:** Gelegenheitskauf gegen Risiko (Mischung, Qualität) und Lagerplatz.

<!-- /AUTO:KETTEN -->

## Fürs Balancing: bekannte Fehler (bewusst NICHT behoben – Etappe 4 ist wertneutral)
1. **Kredit:** `takeLoan` (16-day) nimmt (in Node nachgeprüft) Laufzeit und Zins der *höchsten* freigeschalteten Stufe, der Laptop zeigt die
   *gewählte*. Beispiel Level 8: Karte „1.000 € über 10 Tage, 1,2 %“, tatsächlich 12 Tage, 1,3 %.
2. **„Gewinn des Tages“** zieht selbst Gezündetes ab, obwohl es nie vom Konto abgeht (doppelt gezählt, 16-day `endDay`).
   Außerdem zählen Ausbau und Tilgung als Tageskosten (Kassenfluss, keine Gewinnrechnung).
3. **Geldprüfung uneinheitlich:** Ware, Regale, Packmaterial, Restposten mit Dispo; Ausbau, Lizenz, Deko, Personal,
   Rezepte ohne; DDL rufen (`ddlRufen`) gar nicht.
4. **Saison** wirkt nicht auf Online, Markt, Lohn, Fixkosten; der **Kundendeckel** (20 gleichzeitig) bremst Silvester.
5. **Inflation** nur auf Einkauf und Kundenerwartung, nicht auf Fixgrößen; Lagerregal-Preise hatten zwei Ablagen
   (jetzt eine Preisquelle, `RACKKIND.lvl` bleibt ungenutzt); `SUPPLIERS.delay` wird nirgends gelesen.
6. Weitere Lücken aus den Ketten oben: Marktplatz-Pauschale ohne Kosten (~ die Hälfte des Gewinns), Fläche ohne Miete
   (Fixkosten hängen am Level), Level folgt auch Ausgaben (XP fürs Geldausgeben), Preisampel strenger als die Kunden,
   keine Insolvenz, Diebstahl nicht in den Ausgaben, Löhne ohne Inflation. Neu gemessen: der 5.000-€-Kredit läuft
   wegen Cent-Rundung 15 statt 14 Tage (letzte Rate von wenigen Cent; im echten `endDay` nachgeprüft).

## Was bewusst nicht in der Zentrale steht
- **Produktpreise** (`P[t].cost`/`.market`, 239 Sorten in 7 Dateien) und die **Volatilität je Sorte** (`VOLA`): das ist
  Katalog wie Name und Maße. In `WIRT` stehen nur Regeln (z. B. `ware.kugelMarge`). Ein Margen-Prüfwerkzeug über alle
  Sorten gehört in Etappe 5.
- **Kataloge mit Eigenschaften:** Kundentypen (`CUSTTYPES`), Tagesereignisse (`EVENTS`), Großkunden-Typen (`PYROTYPES`),
  Stimmung/Kauflaune der Deko (`DEKO.amb/buy`), Stimmung der Regale (`SHELFKIND.amb`), Labor-Bauteile (`TRAEGER`, `BRUCH`).
- **Mechanik statt Wirtschaft:** Gehtempo, Kassendauer (Karte 1,0 s, bar 2,2 s), SB-Hilfe-Zeit (`SB_SELBST` 30 s),
  Anteil passend gezahlter Barbeträge (12 %), Karren-Kapazität.
- **Test und Vorführung:** Startgeld der Teststufe (250.000 €, 17-laptop) und der Gameplay-Vorführung (450.000 €, 17e)
  sind keine Spielwirtschaft.
- **Levelangaben in Texten** (z. B. „Reinigungskraft ab Level 6“ im Handbuch) kommen aus den Katalogen, nicht aus
  `WIRT`; erzeugt sind die, die Geld, Prozent oder Kredit nennen.
- **Kommentare** mit alten Herleitungen (Packstation-Amortisation in 02-data, DDL-Pauschale in 11e) sind datiert und
  bleiben als Begründung stehen; sie können veralten – maßgeblich sind die Ketten hier.

## Beweis „nichts geändert“ (13.10.2026)
- **Snapshot** (`tools/fundament/wirtschaft-snapshot.js`, Referenz `wirtschaft-snapshot.json` vom Ausgangsstand 73e52ef,
  lädt das ganze Spiel ohne Browser in Node): 46 Bereiche – alle Kataloge, Kredit/Dispo/Fixkosten für 40 Level, Saison
  für 801 Tage, Kundentakt, Kaufchance, Wünsche, Diebstahl/Geduld, Markt über 40 Tage, Einkauf, Pakete, Restposten,
  Personal, Versand (Abbruch, Bestellungen, Buchung), Käufe aller Ausbauten/Deko/Lizenzen/Regale, XP, Aufträge,
  Herausforderungen, Labor, sechs komplette Tagesabschlüsse mit Text, Handbuch, alle Laptop-Reiter und Handy-Apps.
- **Rückübersetzung** (`tools/fundament/wirtschaft-rueck.js`): setzt jeden `WIRT.…`-Verweis wieder als Zahl ein und
  vergleicht mit dem Ausgangsstand – übrig bleiben nur Strukturzeilen (Aliase, erzeugte Texte, Saisontabelle).
- **Balancing-Simulation** (`tools/balance/sim.js`, jetzt geseedet und ohne Echtzeit; zwei Läufe desselben Stands sind
  gleich): Ausgangsstand gegen neuen Stand **exakt gleich** in allen Kernspalten je Tag (`tools/balance/vergleich.js`) –
  Strategie „gut“ 45 Tage (Ende Level 21, Konto 3.449 €), „schlecht“ 30 Tage (Level 9, −1.547 €), „mutig“ 40 Tage
  (Level 17, 1.862 €); Katalog byte-gleich.
- **Gegenprobe:** DDL-Pauschale 39 → 40 € und Fixkosten-Grundbetrag 10 → 11 € absichtlich geändert: der Snapshot meldet
  172 Abweichungen (Konstanten, Fixkosten, Tagesabschluss, Restposten-Druck, Online-Texte, Laptop), die Simulation weicht
  ab Tag 0 ab (Fixkosten +1 €/Tag, Konto nach 6 Tagen 864 → 858 €). Danach zurückgesetzt, beides wieder gleich.

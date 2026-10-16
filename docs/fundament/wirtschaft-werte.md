# Wirtschaftszentrale: alle Werte (erzeugt)

Erzeugt von `tools/fundament/wirtschaft-uebersicht.js` aus `src/parts/01c-wirtschaft.js` – nicht von Hand ändern.
Spalte „gelesen in“: wo der Wert (oder seine Gruppe) im Spiel benutzt wird. Spalte „Kette“: welche Wirkungskette in `wirtschaft.md` ihn erklärt.

## start

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `start` | geld 500, ruf 50, level 1, startDoy 273 | Spielstart | `02-data.js:463`, `18-save.js:6` |  |

## zeit

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `zeit` | oeffnen 480, schliessen 1.320, echtzeitSek 330 | Tageslaenge | `02-data.js:487`, `11c-versand.js:1215` |  |

## saison

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `saison.regeln` | {m 11, ab 26, silvester true}; {m 11, ab 20, f 1,25}; {m 11, f 1,1}; {m 0, ab 1, bis 1, f 1,35}; {m 0, bis 14, f 0,8}; {m 0 / 1, f 0,72}; {m 2, f 0,8}; {m 3, ab 25, f 1,45}; {m 4, bis 2, f 1,3}; {m 3 / 4, f 0,9}; {m 5, f 1}; {m 6 / 7, f 1,15}; {m 8, f 0,88}; {m 9, ab 28, f 1,25}; {m 9, f 0,92}; {f 0,86} | erste passende Regel gilt: m = Monat (0 = Januar, Liste = mehrere), ab/bis = Tag im Monat | `02-data.js:476` | saison |
| `saison.silvester` | ab 26, grund 1,5, jeTag 0,34 | 26.12. = 1,5 ... 31.12. = 3,2; ab 26.12. auch Wunsch F2 x1,9 und Menge +1 | `02-data.js:476` | saison |
| `saison.wochentag` | 0,55 / 0,82 / 0,84 / 0,9 / 1 / 1,28 / 1,35 | So, Mo, Di, Mi, Do, Fr, Sa (WDMULT) | `02-data.js:484` | saison |

## kunden

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `kunden.takt` | basis 9,2, min 0,55, streuung 0,6 / 1,4, maxGleichzeitig 20, jahrBonus 0,05, rufGrund 0,55, rufTeiler 100, hypeTeiler 50, ambGrund 0,85, ambTeiler 180, sauberGrund 0,75, sauberTeiler 300 | Takt: neuer Kunde alle max(min, basis/m) s x Zufall(streuung), m = Produkt aller Faktoren (16-day spawnInterval). Rechnerisch ~36 Kunden je Tag bei m = 1; hoechstens maxGleichzeitig im Laden (bremst Silvester - Luecke). | `16-day.js:125` | zuviel_kaufen, leere_faecher, sauberkeit, zuenden |
| `kunden.werbung` | plakat 1,3, radio 1,25, tafel 1,3, kundenkarte 1,12 | Faktor auf den Kunden-Takt, solange gekauft | `16-day.js:125` | zuwenig_ausbauen |
| `kunden.eroeffnung` | tage 7, start 1,75, jeTag 0,11 | Neueroeffnung: Tag 0 x1,75, faellt je Tag um 0,11 | `16-day.js:178` |  |
| `kunden.bekanntheit` | maxLevel 20, jeLevel 0,019 | 1 + min(20, Level-1)*0,019 (max x1,38) | `16-day.js:116` | level |
| `kunden.sortiment` | grund 0,78, voll 0,52, vollZaehler 34, vollNenner 68 | 0,78 + min(1, Sorten/SORT_VOLL)*0,52; SORT_VOLL = alle Sorten*34/68 | `16-day.js:113`, `16-day.js:114` | zuwenig_ausbauen |
| `kunden.laden` | shop_gross 0,34, shop_ost 0,26, shop_sued 0,3 | Ladengroesse 1 + Summe -> mehr Kunden und groessere Koerbe | `16-day.js:121` | zuwenig_ausbauen |
| `kunden.korb` | grund 0,78, jeGroesse 0,22 | (Gruppe) Ladenkunden | `16-day.js:123` | zuwenig_ausbauen |
| `kunden.ereignis` | abTag 3, keinsChance 0,34 | Tagesereignis ab Tag 3, an 34 % der Tage keins | `16-day.js:72`, `16-day.js:73` |  |
| `kunden.toleranz` | grund 0,95, ambTeiler 450, rufTeiler 900, jeFreundlichkeit 0,12 | Preis: Kaufchance 1, solange Preis/Markt <= lo; linear auf 0 bei lo + spanne – lo = (grund + Amb/450 + Ruf/900 + Bilder + (Freundl.-1)*0,12) x Ereignis x Konkurrenz | `10-customers.js:209` | leere_faecher, preise, personal |
| `kunden.kauf` | jeMenge 0,18, kuehl 0,16, spanne 0,5 | (Gruppe) Ladenkunden | `10-customers.js:210` | preise |
| `kunden.nachfrage` | nurLager 0,5, nirgends 0,3 | Wunschgewicht, wenn die Sorte nicht im Regal steht (sonst 1) | `10-customers.js:219` | zuwenig_ausbauen, leere_faecher |
| `kunden.wunsch` | n 0,38 / 0,6 / 0,8, silvesterF2 1,9, hypeAb 40, hypeF2 1,3, zubehoer 1,1, jugendF2 0,12, profiF2 2,6, teuerAb 20, mittelAb 7, mittelEins 0,65, kleinMax 3, silvesterPlus 0,45 | (Gruppe) Ladenkunden | `10-customers.js:223` | saison, zuenden |
| `kunden.profiAbLevel` | 8 | Kundentyp "Profi" erst ab Level 8 | `02-data.js:770` |  |
| `kunden.dieb` | abLevel 4, grund 0,035, jeLevel 0,0035, maxLevelAnteil 0,05, kameras 0,5, security 0,35, alarm 0,7 | (Gruppe) Ladenkunden | `10-customers.js:248` | level, diebstahl |
| `kunden.geduld` | min 75, max 110, jeRuf 0,3, heizung 30, klima 35, jeAmbiente 0,35, freundGrund 0,72, jeFreund 0,3 | (Gruppe) Ladenkunden | `10-customers.js:267` | leere_faecher, personal |
| `kunden.gravurWunsch` | 0,3 | Anteil Kunden, die eine Gravur wollen (mit Automat) | `10-customers.js:270` |  |
| `kunden.dreck` | chance 0,08, mitMuell 0,04, jeFleck 7 | Fleck je Kunde; Sauberkeit = 100 - 7 je Fleck | `02-data.js:825`, `10-customers.js:440` | sauberkeit |
| `kunden.ambiente` | musik 6, regallicht 6, heizung 4, fensterDreck 12, wandMax 26, bodenMax 20 | (Gruppe) Ladenkunden | `02-data.js:834` | sauberkeit |
| `kunden.karteAnteil` | 0,6 | 60 % zahlen mit Karte (bar: +3 XP ohne Rueckgeld-Fehler) | `10-customers.js:394` |  |
| `kunden.preisAmpel` | einige 0,2, viele 0,45 | Laptop-Hinweis 'Einige zoegern' / 'Viele lassen es liegen' (lo + x) - weicht von kauf.spanne 0,5 ab (fuers Balancing) | `17-laptop.js:19`, `17-laptop.js:20` |  |
| `kunden.sb` | maxKorb 3, maxKorbBetreut 8, wahl 0,45, wahlBetreut 0,6, problemGrund 0,18, problemJeArtikel 0,025, problemMax 0,36 | (Gruppe) Ladenkunden | `10-customers.js:349` |  |
| `kunden.hype` | max 100, verfallJeSek 1,1 | Hype aus dem Testfeld: + P.hype je Stueck, faellt 1,1/s, Tagesende 0 | `14b-shows.js:711`, `16-day.js:79`, `20-loop.js:143` | zuenden |

## ware

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `ware` | kugelMarge 2,33 | Ware: Produktpreise (P[t].cost / .market) bleiben im Katalog (239 Werte in 7 Dateien), hier stehen nur die Regeln, nach denen Generatoren Preise bilden | `02h-kugeln5.js:40` |  |

## markt

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `markt.regime.fest` | amp 0,1, rev 0,26, d 12 / 30 | (Gruppe) Marktphasen: amp skaliert das Rauschen, rev zieht zur Mitte, d = Dauer in Tagen | `02b-markt.js:27` | markt |
| `markt.regime.ruhig` | amp 0,34, rev 0,15, d 8 / 20 | (Gruppe) Marktphasen: amp skaliert das Rauschen, rev zieht zur Mitte, d = Dauer in Tagen | `02b-markt.js:28` | markt |
| `markt.regime.normal` | amp 0,85, rev 0,07, d 5 / 14 | (Gruppe) Marktphasen: amp skaliert das Rauschen, rev zieht zur Mitte, d = Dauer in Tagen | `02b-markt.js:29` | markt |
| `markt.regime.sturm` | amp 2,1, rev 0,04, d 3 / 9 | (Gruppe) Marktphasen: amp skaliert das Rauschen, rev zieht zur Mitte, d = Dauer in Tagen | `02b-markt.js:30` | markt |
| `markt.regimeWahl` | {bis 0,3, w 72 / 26 / 2 / 0}; {bis 0,6, w 32 / 44 / 23 / 1}; {bis 0,95, w 12 / 32 / 43 / 13}; {bis unendlich, w 4 / 19 / 45 / 32} | Wahlgewichte [fest, ruhig, normal, sturm] nach Volatilitaet der Sorte (bis < vola) | `02b-markt.js:36` | markt |
| `markt.volaStandard` | f2 0,85, f1 0,6, zubehoer 0,45 | Sorten ohne eigenen VOLA-Wert | `02b-markt.js:22` | markt |
| `markt.miMin` | 0,62 | Kappung des Index | `02b-markt.js:46` | markt |
| `markt.miMax` | 1,88 | (Gruppe) Markt: Preisindex je Sorte (02b rollMarkt, taeglich) mi = Einkaufsindex (sofort), me = Kundenerwartung (zieht traege nach) -> Einkaufschance = Luecke me/mi. Inflation wirkt auf EK UND VK-Erwartung (Marge bleibt) - nicht auf Loehne, Fixkosten, Porto, Ausbau. | `02b-markt.js:46` | markt |
| `markt.gaussBreite` | 1,15 | (3 Zufallszahlen - 1,5) * 1,15 ~ Glockenkurve | `02b-markt.js:48` | markt |
| `markt.startStreuung` | 0,06 | Startindex 1 +- gauss*0,06*vola | `02b-markt.js:72` | markt |
| `markt.rauschen` | 0,045 | Tagesrauschen gauss*0,045*vola*amp | `02b-markt.js:169` | markt |
| `markt.traegheit` | 0,26 | Erwartung holt 26 % der Luecke je Tag auf | `02b-markt.js:181` | markt |
| `markt.verlaufTage` | 16 | Kursgrafik | `02b-markt.js:182` | markt |
| `markt.inflation` | min 0,0008, max 0,0028, sprungChance 0,05, sprungMin 0,003, sprungMax 0,009, deckel 4 | ~0,21 %/Tag, x2,1 nach 365 Tagen | `02b-markt.js:156` | markt |
| `markt.schock` | abVola 0,48, chanceJeVola 0,012, knappAnteil 0,55, knapp 0,28 / 0,8, schwemme 0,18 / 0,4, dauer 3 / 9, sturmDauer 3 / 8 | (Gruppe) Markt: Preisindex je Sorte (02b rollMarkt, taeglich) mi = Einkaufsindex (sofort), me = Kundenerwartung (zieht traege nach) -> Einkaufschance = Luecke me/mi. Inflation wirkt auf EK UND VK-Erwartung (Marge bleibt) - nicht auf Loehne, Fixkosten, Porto, Ausbau. | `02b-markt.js:156` | markt |
| `markt.schnittMin` | 0,7 | S.mkt (Marktschnitt fuer Texte) | `02b-markt.js:184` | markt |
| `markt.schnittMax` | 1,5 | (Gruppe) Markt: Preisindex je Sorte (02b rollMarkt, taeglich) mi = Einkaufsindex (sofort), me = Kundenerwartung (zieht traege nach) -> Einkaufschance = Luecke me/mi. Inflation wirkt auf EK UND VK-Erwartung (Marge bleibt) - nicht auf Loehne, Fixkosten, Porto, Ausbau. | `02b-markt.js:184` | markt |
| `markt.konkurrenz` | schwank 0,95 / 1,05, min 0,88, max 1,12, ladeMin 0,85, ladeMax 1,15 | Konkurrenz S.comp: taeglich x Zufall, multipliziert die Preistoleranz | `16-day.js:63` | markt |
| `markt.ladeMktMin` | 0,7 | Klemmen beim Laden eines Spielstands (18-save) | `18-save.js:225` | markt |
| `markt.ladeMktMax` | 1,4 | (Gruppe) Markt: Preisindex je Sorte (02b rollMarkt, taeglich) mi = Einkaufsindex (sofort), me = Kundenerwartung (zieht traege nach) -> Einkaufschance = Luecke me/mi. Inflation wirkt auf EK UND VK-Erwartung (Marge bleibt) - nicht auf Loehne, Fixkosten, Porto, Ausbau. | `18-save.js:225` | markt |

## einkauf

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `einkauf.lieferSek` | 5 | s bis die Lieferung da ist (x Ereignis "Stau" 2,1) | `02-data.js:494` | markt |
| `einkauf.liefergebuehr` | 5,9 | € je Bestellung (VERSAND - Namensfalle: das ist der EINGANG, nicht der Onlineversand) | `02-data.js:494` | markt |
| `einkauf.lieferfreiAb` | 150 | € Warenwert, ab dem die Liefergebuehr entfaellt (VERSANDFREI) | `02-data.js:494` | markt |
| `einkauf.lieferant.fachhandel.mult` | 1 | (Gruppe) Lieferanten (SUPPLIERS in 02-data): mult = Preisfaktor, qualitaet (Restposten: Blindgaenger), Mengenstaffel n/d (Rabatt) | `02-data.js:364` | markt |
| `einkauf.lieferant.fachhandel.qualitaet` | 1 | (Gruppe) Lieferanten (SUPPLIERS in 02-data): mult = Preisfaktor, qualitaet (Restposten: Blindgaenger), Mengenstaffel n/d (Rabatt) | `02-data.js:364` | markt |
| `einkauf.lieferant.fachhandel.staffel` | {n 1, d 0} | (Gruppe) Lieferanten (SUPPLIERS in 02-data): mult = Preisfaktor, qualitaet (Restposten: Blindgaenger), Mengenstaffel n/d (Rabatt) | `02-data.js:364` | markt |
| `einkauf.lieferant.grosshandel.mult` | 1 | (Gruppe) Lieferanten (SUPPLIERS in 02-data): mult = Preisfaktor, qualitaet (Restposten: Blindgaenger), Mengenstaffel n/d (Rabatt) | `02-data.js:366` | markt |
| `einkauf.lieferant.grosshandel.qualitaet` | 1 | (Gruppe) Lieferanten (SUPPLIERS in 02-data): mult = Preisfaktor, qualitaet (Restposten: Blindgaenger), Mengenstaffel n/d (Rabatt) | `02-data.js:366` | markt |
| `einkauf.lieferant.grosshandel.staffel` | {n 10, d 0,1}; {n 20, d 0,18} | (Gruppe) Lieferanten (SUPPLIERS in 02-data): mult = Preisfaktor, qualitaet (Restposten: Blindgaenger), Mengenstaffel n/d (Rabatt) | `02-data.js:366` | markt |
| `einkauf.lieferant.ratzke` | mult 0,6, qualitaet 0,86 | (Gruppe) Lieferanten (SUPPLIERS in 02-data): mult = Preisfaktor, qualitaet (Restposten: Blindgaenger), Mengenstaffel n/d (Rabatt) | `02-data.js:368` | markt, restposten |
| `einkauf.grosshandelslizenz` | 0,9 | Ausbau "Grosshandelslizenz": alle Einkaufspreise x0,9 (gilt nicht fuer Regale, Packmaterial) | `02-data.js:278`, `16-day.js:66` | markt |
| `einkauf.pakete.rabatt` | tuete 0,62, kiste 0,58, palette 0,52 | (Gruppe) Wundertueten/Themenpakete: Preis = mittlerer Karton-EK x Kartons x Faktor, auf 5 € gerundet (mind. 5 €) | `17-laptop.js:341` | markt, restposten |
| `einkauf.pakete.sonstige` | 0,7 | (Gruppe) Wundertueten/Themenpakete: Preis = mittlerer Karton-EK x Kartons x Faktor, auf 5 € gerundet (mind. 5 €) | `17-laptop.js:333`, `17-laptop.js:343` | markt, restposten |
| `einkauf.pakete.themen` | 0,6 | (Gruppe) Wundertueten/Themenpakete: Preis = mittlerer Karton-EK x Kartons x Faktor, auf 5 € gerundet (mind. 5 €) | `17-laptop.js:333`, `17-laptop.js:343` | markt, restposten |
| `einkauf.pakete.sorten` | 0,56 | (Gruppe) Wundertueten/Themenpakete: Preis = mittlerer Karton-EK x Kartons x Faktor, auf 5 € gerundet (mind. 5 €) | `17-laptop.js:333`, `17-laptop.js:343` | markt, restposten |
| `einkauf.pakete.jackpot` | 0,12 | (Gruppe) Wundertueten/Themenpakete: Preis = mittlerer Karton-EK x Kartons x Faktor, auf 5 € gerundet (mind. 5 €) | `17-laptop.js:321` | markt, restposten |
| `einkauf.pakete.teuerAb` | 6 | (Gruppe) Wundertueten/Themenpakete: Preis = mittlerer Karton-EK x Kartons x Faktor, auf 5 € gerundet (mind. 5 €) | `17-laptop.js:322` | markt, restposten |
| `einkauf.pakete.runden` | 5 | (Gruppe) Wundertueten/Themenpakete: Preis = mittlerer Karton-EK x Kartons x Faktor, auf 5 € gerundet (mind. 5 €) | `17-laptop.js:391` | markt, restposten |
| `einkauf.pakete.min` | 5 | (Gruppe) Wundertueten/Themenpakete: Preis = mittlerer Karton-EK x Kartons x Faktor, auf 5 € gerundet (mind. 5 €) | `17-laptop.js:391` | markt, restposten |
| `einkauf.restposten.welle` | 70 / 260 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.dauer` | 120 / 360 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.max` | 8 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.ersteWelle` | 15 / 40 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.druck` | kostenMin 60, tageAb 4, tageSpanne 26, mitKredit 0,5 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | kredit, markt, restposten |
| `einkauf.restposten.leer` | grund 0,15, jeDruck 0,4 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.viel` | grund 0,28, jeDruck -0,2 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.vielN` | 3 / 3 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.normalN` | 1 / 2 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.vorrat` | zwei 0,35, drei 0,12 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.preis` | 0,85 / 1,12 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |
| `einkauf.restposten.takt` | grund 0,7, jeDruck 0,9 | (Gruppe) Restposten-Ratzke: Angebote kommen in Wellen; wer viel Geld hat (druck -> 1), bekommt seltener und weniger | `17-laptop.js:371` | markt, restposten |

## versand

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `versand.std` | kosten 4,9, frei 50 | Voreinstellung = "Nachfrage 100 %" (vsQuoteStd) | `11c-versand.js:86` |  |
| `versand.kostenMax` | 20 | Regler-Grenzen im Laptop | `11c-versand.js:88` |  |
| `versand.freiMax` | 300 | (Gruppe) Onlineshop / Versand (Ausgang) Quellen siehe 11c-versand.js Kopf "Versand-Wirtschaft": Baymard 2024/25 (39-48 % Abbrueche wegen Zusatzkosten), Lewis/Singh/Fay 2006, UPS Pulse 2014 (58 % stocken auf), Bijmolt et al. 2005 (-2,62). | `11c-versand.js:88` |  |
| `versand.porto` | 1 2, 3 3,5, 6 5 | € an DDL je Paket S/M/L (VS_PORTO) | `11c-versand.js:87` | versandkosten |
| `versand.abbruch` | k 0,75, a 0,2, b 2,5 | Abbruch: Kunde mit Warenkorb w nimmt Versand v hin mit p = exp(-k*(v/(a*w+b))^2) – 4,90 € auf 25 € -> 73 % kaufen, 20 € -> fast niemand | `11c-versand.js:109` | versandkosten |
| `versand.korb` | 5 / 9 / 13 / 18 / 22 / 28 / 38 / 55 / 95 | € Warenkorb-Quantile (gemessen L25-34) fuer die Anzeige "Nachfrage x %" | `11c-versand.js:112` |  |
| `versand.aufstocken` | ab 0,7, anteil 0,6, maxSchritte 4 | ab 70 % der Gratis-Schwelle legen 60 % etwas dazu (UPS 2014: 58 %) | `11c-versand.js:118`, `11c-versand.js:258`, `11c-versand.js:257` | versandkosten |
| `versand.sale` | allesElast -1,5, produktElast -2,62, produktNeu 0,5, allesMax 50, produktMin 5, produktMax 70 | (Gruppe) Onlineshop / Versand (Ausgang) Quellen siehe 11c-versand.js Kopf "Versand-Wirtschaft": Baymard 2024/25 (39-48 % Abbrueche wegen Zusatzkosten), Lewis/Singh/Fay 2006, UPS Pulse 2014 (58 % stocken auf), Bijmolt et al. 2005 (-2,62). | `11c-versand.js:101`, `11c-versand.js:102`, `11c-versand.js:127`, `11c-versand.js:129` +1 | versandkosten |
| `versand.basis` | grund 4, jeRuf 0,12, jeLevel 0,35, min 4, max 22 | Besucher je Tag = clamp(round(grund + jeRuf*Ruf + jeLevel*Level), min, max) x Stufe x Sale / Standardquote | `11c-versand.js:148` | versandkosten |
| `versand.stufeMul` | 1 / 1 / 1,45 / 1,9 | Packstation Stufe 0..3 (mehr Packplaetze -> mehr Bestellungen) | `11c-versand.js:147` | versandkosten |
| `versand.onlineDeckel` | 1,3 | Onlinepreis hoechstens 130 % vom Marktpreis | `11c-versand.js:168` | preise |
| `versand.paketwertSchaetzung` | grund 12, jeLevel 0,6 | € Anzeige, solange keine Bestellung offen ist | `11c-versand.js:142` |  |
| `versand.groesse` | anteilS 0,68, bisM 0,94, spaetAb 22, spaetS 0,5, spaetBisM 0,85 | Bestellgroesse: Anteil S / bis M, ab Level spaetAb grosszuegiger | `11c-versand.js:238` |  |
| `versand.pauschale` | grund 40, jeRuf 1,6, jeLevel 4 | Marktplatz-Pauschale je Tag ab Onlineshop (auch mit Packstation, ohne Kosten): round(grund + jeRuf*Ruf + jeLevel*Level) - ist-analyse: ~52 % des Betriebsgewinns (fuers Balancing) | `01c-wirtschaft.js:390 (WF)` |  |
| `versand.ddl` | pauschale 39, anfahrtSek 20 | € je Abholung (Herleitung 11e-palette.js Kopf), s Anfahrt | `11e-palette.js:32` | versandkosten |
| `versand.strafe` | offenAb 8, offenJe 0,12, offenMax 2, wartendJe 0,06, wartendMax 3 | Ruf-Strafen am Abend | `16-day.js:192`, `16-day.js:204`, `17-laptop.js:1046`, `21b-handbuch.js:92` | versandkosten |
| `versand.material.ks` | preis 8,9, stueck 25 | (Gruppe) Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L | `11d-packmaterial.js:13` | versandkosten |
| `versand.material.km` | preis 11,4, stueck 15 | (Gruppe) Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L | `11d-packmaterial.js:13` | versandkosten |
| `versand.material.kl` | preis 12,8, stueck 8 | (Gruppe) Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L | `11d-packmaterial.js:13` | versandkosten |
| `versand.material.folie` | preis 14,9, stueck 20 | (Gruppe) Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L | `11d-packmaterial.js:13` | versandkosten |
| `versand.material.band` | preis 9,9, stueck 48 | (Gruppe) Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L | `11d-packmaterial.js:13` | versandkosten |
| `versand.material.folieJe` | 1 1, 3 2, 6 3 | (Gruppe) Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L | `11d-packmaterial.js:13` | versandkosten |
| `versand.material.bandJe` | 1 1, 3 1, 6 2 | (Gruppe) Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L | `11d-packmaterial.js:13` | versandkosten |

## ausbau

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `ausbau.kistenJeKauf` | 5 | Mehrwegkisten je Kauf (KISTE_STUECK, 08e) - Preis: preis.kisten | `02-data.js:264`, `08e-kiste.js:20`, `21b-handbuch.js:37` |  |
| `ausbau.preis` | plakat 400, sackkarre 350, kisten 10, wagen 1.400, terminal 320, tag4 900, heizung 450, musik 380, radio 1.200, cams 900, regallicht 700, alarm 2.200, grosskunden 500, onlineshop 3.200, kundenkarte 2.600, tafel 4.200, lizenz 6.500, klima 5.400, meister 12.000, shop_halb 1.400, testfeld 3.200, shop_gross 7.500, lager 1.200, lager_nord 1.900, lager_gross 6.200, shop_ost 16.000, shop_sued 34.000, lager_sued 11.000, lager_sued2 15.000, packstation 6.400, packstation2 5.900, packstation3 6.900, eingang2 11.500, kasse2 3.400, labor 9.800, labor2 16.500, gravur 1.200 | € je Ausbau (UPGRADES[].cost), Reihenfolge wie im Katalog | `02-data.js:260`, `02-data.js:261`, `21b-handbuch.js:39`, `02-data.js:264` +35 | zuwenig_ausbauen |

## lizenz

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `lizenz.preis` | start 0, jugend 60, zubehoer 120, klassiker 380, partydeko 520, snacks 260, krach 1.100, buffet 700, partynacht 1.500, kleinfeuer 1.800, himmel 2.600, genuss 3.400, feuerzauber 4.200, verbund 6.000, getraenke 5.000, festtafel 6.500, nachthimmel 9.000, import 13.000, goldklasse 15.000, schabernack 16.000, sternklasse 18.000, grossfeuer 21.000, feinkost 12.000, profi 26.000, meister 34.000, grossfeuerwerk 42.000, pyroweltklasse 52.000 | € je Lizenzpaket (LIZENZEN[].cost), nach Level | `02b-markt.js:194`, `02b-markt.js:197`, `02b-markt.js:200`, `02b-markt.js:203` +23 |  |

## personal

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `personal.lohnstufen` | 0,75 / 1 / 1,3 / 1,65 | Lohnstufen (WAGES in 11-staff): f x Grundlohn; f wirkt auf Tempo (0,55 + 0,48 f) und Freundlichkeit (= Schnitt der f) -> Preistoleranz (+(f-1)*0,12) und Geduld (0,72 + 0,3 f) | `11-staff.js:64`, `11-staff.js:65`, `11-staff.js:66`, `11-staff.js:67` | personal |
| `personal.pause` | 0,3 | Saisonpause: 30 % Lohn, keine Arbeit, Rueckkehr ohne neue Einstellung | `11-staff.js:269`, `16-day.js:273`, `17-laptop.js:996`, `17-laptop.js:1415` +2 | personal |
| `personal.kuendigung` | unter 0,8, chanceTag 0,14 | Lohnstufe < 0,8: kuendigt mit 14 % je Tag (Ruf: ruf.kuendigung) | `11-staff.js:274` | personal |
| `personal.tempo` | grund 0,55, jeLohn 0,48 |  | `11-staff.js:127` | personal |
| `personal.einstellung` | reinigung 250, auffueller 450, auffueller2 600, kassierer 600, kassierer2 600, kassierer3 600, security 800, packer 700, packer2 750, packer3 800 | € einmalig | `02-data.js:335`, `02-data.js:336`, `02-data.js:337`, `02-data.js:338` +6 | personal |
| `personal.lohn` | reinigung 55, auffueller 110, auffueller2 130, kassierer 145, kassierer2 140, kassierer3 140, security 190, packer 165, packer2 170, packer3 175 | € Grundlohn je Tag (x Lohnstufe) | `02-data.js:335`, `02-data.js:336`, `02-data.js:337`, `02-data.js:338` +6 | personal |

## deko

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `deko.preis` | pflanze 70, stehtisch 95, muell 80, teppich 130, lichter 170, ventilator 210, baum 290, neon 480, automat 640, bild_raketen 180, bild_stadt 320, bild_sortiment 420, saeule 900, vitrine 1.400, bild_meister 820 |  | `02-data.js:318`, `02-data.js:319`, `02-data.js:320`, `02-data.js:321` +11 | sauberkeit |

## wand

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `wand.preis` | creme 0, weiss 50, salbei 140, sand 250, streifen 370, anthrazit 520, raute 670, terrakotta 780, ziegel 840, metro 960, beere 1.020, blume 1.210, holzvert 1.410, mitternacht 1.620, petrol 1.840, gold 2.060, gras 2.400, damast 2.900, moire 3.400, nussbaum 4.200, samt 5.600, marmorwand 7.800 |  | `02-data.js:411`, `02-data.js:412`, `02-data.js:413`, `02-data.js:414` +18 | sauberkeit |

## boden

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `boden.preis` | grau 0, vinyl 70, holz 190, schach 340, eiche 520, fliese 720, beton 940, industrie 1.180, teppich 1.430, terrazzo 1.690, marmor 1.970, fischgraet 2.600, chevron 3.200, travertin 3.900, nussfisch 4.600, veneziano 5.400, marmorband 6.200, versailles 8.500 |  | `02-data.js:435`, `02-data.js:436`, `02-data.js:437`, `02-data.js:438` +14 | sauberkeit |

## regal

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `regal.verkauf.klein` | grund 45, jeWeiteres 28 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:516` |  |
| `regal.verkauf.standard` | grund 130, jeWeiteres 70 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:517` |  |
| `regal.verkauf.hoch` | grund 260, jeWeiteres 95 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:518` |  |
| `regal.verkauf.kuehl` | grund 430, jeWeiteres 155 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:519` |  |
| `regal.verkauf.gondel` | grund 560, jeWeiteres 190 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:521` |  |
| `regal.verkauf.eck` | grund 480, jeWeiteres 165 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:524` |  |
| `regal.verkauf.gross` | grund 640, jeWeiteres 210 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:529` |  |
| `regal.verkauf.tisch` | grund 220, jeWeiteres 80 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:534` |  |
| `regal.verkauf.tischgross` | grund 340, jeWeiteres 120 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:537` |  |
| `regal.verkauf.gitter` | grund 140, jeWeiteres 50 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:542` |  |
| `regal.verkauf.gitter2` | grund 210, jeWeiteres 75 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:543` |  |
| `regal.verkauf.gitter3` | grund 290, jeWeiteres 100 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:544` |  |
| `regal.verkauf.kasse` | grund 120, jeWeiteres 60 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `02-data.js:555` |  |
| `regal.lager.standard` | grund 0, jeWeiteres 0 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `06-fixtures.js:794` |  |
| `regal.lager.hoch` | grund 520, jeWeiteres 150 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `06-fixtures.js:795` |  |
| `regal.lager.schwer` | grund 880, jeWeiteres 240 | (Gruppe) Preis = grund + jeWeiteres x schon aufgestellte derselben Art (regalPreis) | `06-fixtures.js:796` |  |

## auftrag

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `auftrag.kartons` | {abLevel 15, n 4 / 9}; {abLevel 10, n 3 / 6}; {abLevel 0, n 2 / 4} | Kartons je Auftrag | `10b-pyro.js:7` | auftraege |
| `auftrag.zweiSorten` | 0,5 | ab 4 Kartons: 2 oder 3 Sorten | `10b-pyro.js:12` |  |
| `auftrag.stammJe` | 0,02 | Stammkunde: + 2 % je frueherem Auftrag, max + 8 % | `10b-pyro.js:21` |  |
| `auftrag.stammMax` | 0,08 | (Gruppe) Grossauftraege (Telefon, 10b-pyro) | `10b-pyro.js:21` |  |
| `auftrag.nachgeben` | 0,35 | zu hoch gepokert: Angebot steigt nur um 35 % des Schritts | `10b-pyro.js:86` | auftraege |
| `auftrag.meister` | 1,33 | Ausbau "Meisterbrief": Auszahlung x1,33 | `02-data.js:280`, `10b-pyro.js:91` | auftraege |
| `auftrag.flau` | grund 1,9, jeSaison 0,9, min 0,8, max 1,9 | Nebensaison: Anrufe schneller (clamp(1,9 - dayMult*0,9)) | `10b-pyro.js:28` | saison |
| `auftrag.vollerKarton` | 0,9 | Karton zaehlt als voll ab 90 % | `10b-pyro.js:105` |  |
| `auftrag.takt` | start 120, keineWare 90, klingeln 26, verpasst 60 / 110, nachAnnahme 150 / 260, nachAblehnung 70 / 130, abholung 18 / 30 | Telefon-Takt in Sekunden echter Zeit (x Nebensaison-Faktor flau, / Ereignis "Veranstalter") | `10b-pyro.js:5`, `10b-pyro.js:25`, `10b-pyro.js:32`, `10b-pyro.js:33` +5 |  |

## ziele

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `ziele.umsatz` | ziel 600 / 260, praemie 120 / 45 | (Gruppe) Wochenziele (GOALS in 02-data): Ziel = a + b*Level, Praemie = c + d*Level | `02-data.js:778` |  |
| `ziele.kunden` | ziel 40 / 14, praemie 100 / 40 | (Gruppe) Wochenziele (GOALS in 02-data): Ziel = a + b*Level, Praemie = c + d*Level | `02-data.js:778` |  |
| `ziele.artikel` | ziel 90 / 34, praemie 110 / 42 | (Gruppe) Wochenziele (GOALS in 02-data): Ziel = a + b*Level, Praemie = c + d*Level | `02-data.js:778` |  |
| `ziele.f2` | ziel 30 / 16, praemie 150 / 55 | (Gruppe) Wochenziele (GOALS in 02-data): Ziel = a + b*Level, Praemie = c + d*Level | `02-data.js:778` |  |
| `ziele.sauber` | tage 5, praemie 130 / 40 | (Gruppe) Wochenziele (GOALS in 02-data): Ziel = a + b*Level, Praemie = c + d*Level | `02-data.js:778` |  |
| `ziele.gross` | levelJeAuftrag 5, praemie 200 / 60 | (Gruppe) Wochenziele (GOALS in 02-data): Ziel = a + b*Level, Praemie = c + d*Level | `02-data.js:778` |  |

## erfolg

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `erfolg.lohn` | v_boeller 60 / 320 / 1.600 / 7.000, v_raketen 80 / 400 / 2.000 / 8.000, v_batterien 260 / 1.400 / 5.000 / 14.000, v_kugeln 300 / 1.600 / 5.500 / 16.000, v_sekt 70 / 350 / 1.500 / 5.500, v_essen 60 / 300 / 1.300 / 5.000, v_zubehoer 60 / 300 / 1.300 / 5.000, kunden 80 / 450 / 2.200 / 9.000, kartons 60 / 300 / 1.400 / 5.500, lkw 70 / 380 / 1.800 / 7.000, gezuendet 80 / 400 / 1.800 / 7.000, brucharten 150 / 600 / 2.400 / 9.000, hype 90 / 500 / 2.200 / 8.000, pakete 200 / 900 / 3.600 / 12.000, ddl 180 / 800 / 3.200 / 11.000, auftraege 220 / 1.000 / 4.200 / 14.000, eigene 400 / 1.800 / 6.000 / 18.000, v_eigene 300 / 1.400 / 5.000 / 16.000, rek_tag 120 / 600 / 2.400 / 9.000, rek_kunden 110 / 550 / 2.200 / 8.000, tage 100 / 500 / 2.000 / 7.500 | (Gruppe) Herausforderungen (ERFOLGE in 02c): Praemie je Stufe; Stufe 2 meist als Warengutschrift | `02c-erfolge.js:34`, `02c-erfolge.js:37`, `02c-erfolge.js:40`, `02c-erfolge.js:43` +17 |  |

## rezept

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `rezept.wow` | schussGrund 0,85, schussLog 0,24, zweiFarben 1,06, farbAuf 0,5, stufe2 1,18, stufe2Wow 0,14 | (Gruppe) Entwicklungslabor (02d): Formeln fuer Eigenrezepte; Ergebnis wird im Spielstand gespeichert | `02d-rezeptur.js:113` |  |
| `rezept.kosten` | grund 0,72, jeKlasse 0,19, farbAuf 0,62, stufe2 1,22, stufe2Klasse 0,06 | (Gruppe) Entwicklungslabor (02d): Formeln fuer Eigenrezepte; Ergebnis wird im Spielstand gespeichert | `02d-rezeptur.js:127` |  |
| `rezept.markt` | grund 1,75, jeWow 0,42 | VK = Kosten x (1,75 + 0,42 Wow) | `02d-rezeptur.js:135` |  |
| `rezept.hype` | jeWowSchuss 3,2, grund 6 | (Gruppe) Entwicklungslabor (02d): Formeln fuer Eigenrezepte; Ergebnis wird im Spielstand gespeichert | `02d-rezeptur.js:137` |  |
| `rezept.entwicklung` | grund 320, jeBasis 95, jeKlasse 0,22, stufe2 1,45 | einmalige Entwicklungskosten | `02d-rezeptur.js:142` |  |
| `rezept.vola` | 0,55 | (Gruppe) Entwicklungslabor (02d): Formeln fuer Eigenrezepte; Ergebnis wird im Spielstand gespeichert | `02d-rezeptur.js:181` |  |

## kredit

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `kredit.stufen` | {lvl 5, amount 1.000, term 10, rate 0,012}; {lvl 8, amount 2.500, term 12, rate 0,013}; {lvl 12, amount 5.000, term 14, rate 0,014}; {lvl 15, amount 10.000, term 16, rate 0,015}; {lvl 20, amount 25.000, term 20, rate 0,016}; {lvl 26, amount 60.000, term 24, rate 0,017} | Kreditstufen (Kopie landet im Spielstand: {amount,remaining,term,rate,paid}). rate = Zins je Tag auf den Rest; Rate = amount/term + Rest*rate (16-day loanDaily) | `02-data.js:404`, `01c-wirtschaft.js:387 (WF)` | kredit |
| `kredit.tilgenKnoepfe` | 250 / 1.000 | € Sondertilgung im Laptop (dazu "Alles") | `17-laptop.js:1432` | kredit |
| `kredit.dispo` | abLevel 4, grund 260, jeLevel 70, zinsTag 0,006 | (Gruppe) Bank: Kredit, Dispo | `16-day.js:169`, `16-day.js:171`, `16-day.js:240`, `01c-wirtschaft.js:383 (WF)` | zuviel_kaufen |

## fix

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `fix.grund` | 10 | € je Tag immer | `16-day.js:173` | zuviel_kaufen, level |
| `fix.jeLagerregal` | 6 | € je Lagerregal | `16-day.js:173` | zuviel_kaufen, level |
| `fix.levelAb` | 4 | ab diesem Level kostet jedes weitere Level ... | `16-day.js:173` | zuviel_kaufen, level |
| `fix.jeLevel` | 4 | ... 4 € je Tag ("Level-Steuer", keine Miete/Flaeche - Luecke fuers Balancing) | `16-day.js:173` | zuviel_kaufen, level |
| `fix.regalArt` | klein 4, standard 9, hoch 12, kuehl 18, gondel 14, eck 11, gross 13, gitter 3, gitter2 4, gitter3 5, tisch 6, tischgross 8 | € je Verkaufsregal | `16-day.js:165` | zuviel_kaufen, level |
| `fix.regalStandard` | 9 | € fuer Regalarten ohne Eintrag (z. B. Kassenregal) | `16-day.js:174` | zuviel_kaufen, level |

## tag

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `tag` | automat 45 |  | `16-day.js:205`, `16-day.js:219` |  |

## ruf

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `ruf` | kaufOk 0,8, kaufMitFehl 0,2, fehlwunsch -0,4, leerGegangen -0,3, zuTeuer -0,5, geduldWeg -2, diebGestellt 0,6, diebEntkommen -1,8, sbAllein -0,4, sbHilfe 0,1, auftragErfuellt 2,5, auftragVerfehlt -4, pruefungGut 3, pruefungSchlecht -5, pruefungSauberAb 70, kuendigung -1, kontoMinus -3 | Jede Aenderung geht ueber rep(d) und wird auf 0..100 geklemmt. Ruf wirkt auf: Kunden je Tag (0,55 + Ruf/100), Preistoleranz (+Ruf/900), Geduld (+0,3*Ruf), Online-Besucher und -Pauschale. | `06-fixtures.js:208`, `10-customers.js:292`, `10-customers.js:302`, `10-customers.js:295` +11 | zuviel_kaufen, zuwenig_ausbauen, leere_faecher, preise, personal, sauberkeit, diebstahl, auftraege |

## xp

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `xp.kurve` | a 50, exp 1,55 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `01c-wirtschaft.js:389 (WF)` | level |
| `xp.kunde` | jeEuro 0,5, grund 4, barPassend 3 | je bezahltem Einkauf; +3 wenn bar ohne Rueckgeld-Fehler | `10-customers.js:409` | level |
| `xp.tag` | grund 60, jeUmsatz 0,05, ohneBeschwerde 40 | Tages-XP = grund + Umsatz*jeUmsatz + (keiner genervt ? ohneBeschwerde : 0) | `16-day.js:214` | level |
| `xp.jahr` | 200 | XP fuer ein volles Jahr | `16-day.js:286` | level |
| `xp.kreditGetilgt` | 40 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `16-day.js:50` | kredit, level |
| `xp.kapitel` | 40 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `19-hud.js:116` | level |
| `xp.ausbauTeiler` | 12 | Geld ausgeben bringt XP (Luecke fuers Balancing: Level folgt Ausgaben) – Ausbau/Deko: Kosten/12 | `17-laptop.js:1673`, `17-laptop.js:1684`, `17-laptop.js:1689` | level |
| `xp.lizenz` | teiler 14, bonus 30 | Lizenz: Kosten/14 + 30 | `17-laptop.js:198` | level |
| `xp.herausforderung` | teiler 10, bonus 25 | Praemie/10 + 25 | `02c-erfolge.js:173` | level |
| `xp.wochenzielTeiler` | 3 | Wochenziel: Praemie/3 | `16-day.js:90` | level |
| `xp.auftragAngenommen` | 20 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `10b-pyro.js:96` | level |
| `xp.auftragErfuellt` | jeEuro 0,4, grund 40 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `10b-pyro.js:137` | level, auftraege |
| `xp.restposten` | 20 | Wundertuete / Restposten-Angebot gekauft | `17-laptop.js:359`, `17-laptop.js:417` | level |
| `xp.eigeneRezeptur` | 180 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `02d-rezeptur.js:198` | level |
| `xp.zuenden` | hypeTeiler 3, min 1 | je gezuendetem Stueck: max(1, Hype/3) | `14b-shows.js:711` | level |
| `xp.serieStufen` | 5 / 10 / 20 / 35 / 50 / 75 / 100 | Serie zufriedener Kunden: n*6 XP an den Stufen | `19-hud.js:168` | level |
| `xp.serieJeKunde` | 6 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `19-hud.js:172` | level |
| `xp.diebGestellt` | 25 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `10-customers.js:332` | level |
| `xp.regalAufbau` | 12 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `08-boxes.js:114` | level |
| `xp.einbau` | 20 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `08-boxes.js:164` | level |
| `xp.gravur` | 12 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `06b-gravur.js:159` | level |
| `xp.paketGepackt` | 3 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `11c-versand.js:693` | level |
| `xp.dreckWeg` | 3 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `15-player.js:446` | level |
| `xp.fensterPutzen` | 4 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `05f-facade.js:185` | level |
| `xp.sbHilfe` | 4 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `06-fixtures.js:209` | level |
| `xp.packmaterialEinlagern` | 1 | (Gruppe) Level-Kurve: XP bis zum naechsten Level = round(a * Level^exp). Level schaltet Lizenzen, Ausbauten, Personal, Kredite frei - Geld und Level sind getrennte Kurven (ist-analyse 3.3). | `11d-packmaterial.js:317` | level |

## historie

| Größe | Wert | Bedeutung | gelesen in | Kette |
|---|---|---|---|---|
| `historie.erstattung.kasse3` | 3.800 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:198` |  |
| `historie.erstattung.sbBetreuer` | 650 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:200` |  |
| `historie.erstattung.packstation` | 6.400 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:210` |  |
| `historie.erstattung.packstation2` | 14.000 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:210` |  |
| `historie.erstattung.packstation3` | 26.000 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:210` |  |
| `historie.erstattung.packer` | 700 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:211` |  |
| `historie.erstattung.packer2` | 750 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:211` |  |
| `historie.erstattung.packer3` | 800 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:211` |  |
| `historie.erstattung.ausbau` | lager_west 22.000, rampe2 12.000, lager_west2 30.000, rampe3 15.000, rampe4 20.000, lager_west3 42.000, rampe5 26.000, lagerlogistik 18.500, fabrik 46.000, fabrik2 26.000, fabrik3 23.000 | Rueckbau 16.10. (Tom: grosse Halle, Werk und Produktion komplett weg): Kaufpreise der entfernten Ausbauten (Stand V141) und die Rohstoffpreise des Werks je kg (Standard; premium = Aufschlag) - gutgeschrieben beim Laden alter Staende | `18-save.js:92` |  |
| `historie.erstattung.rohstoff` | huelsen 2,2, oxidator 5,8, metall 13,5, schwarzpulver 9,8, premium 1,2 | (Gruppe) Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat - unabhaengig davon, was dieselbe Sache heute kostet. | `18-save.js:118` |  |

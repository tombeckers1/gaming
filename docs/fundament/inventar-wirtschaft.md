# Inventar Wirtschaft (Fundament Etappe 1, Stand 13.10.2026)

Zweck: Grundlage für die Wirtschaftszentrale (Etappe 4). **Es wurde kein Spielcode geändert, nichts committet, keine Testsperre benutzt, kein Browser gestartet.**
Methode: Quellcode gelesen (`src/parts/*.js`, Zeilen = Stand dieses Branches) und die reinen Datenteile (`reuse-helpers`, `02*.js`) in Node (`vm`, nur `matchMedia`-Stub) ausgeführt, damit Summen/Verteilungen **gemessen** sind (Skript: Anhang). Die Bot-Zahlen stammen aus `docs/balancing/ist-analyse.md` (Branch `claude/balancing`), nicht von mir.
Abkürzungen: `S` = Spielstand, `DS` = Tagesstatistik, „gespeichert“ = Feld steht in `save()` (`18-save.js:59-61`).

## 0. Zahlen auf einen Blick (gemessen)
- **239 Produkte** in `P` (Zubehör 36, Essen 41, Getränke 31 – alle Kat. 0 –, F1 12, F2 119). Level 1–30. Alle liegen in einer Lizenz (27 Lizenzpakete, Summe **292.140 €**).
- **Marge VK/EK**: Median F1 2,53 / F2 2,33 / Zubehör 2,52; Ausreißer `gravur` 7,81, niedrigste `finale` 2,17. Häufigste Werte 2,50 (59×), 2,33 (35×, Kugelbomben: `KUGEL_MARGE`), 2,49 (26×). Es gibt **keine zentrale Margenregel**, die Verhältnisse stecken in 239 Einzelwerten + 5 Generatoren (02e/02g/02h/02i/02j).
- **44 Ausbauten**, Summe **369.610 €** (Fläche 308.100, Einrichtung 33.210, Markt 28.300). 10 Mitarbeiter (Einstellung Σ 6.150 €, Lohn Σ 1.420 €/Tag), 15 Deko (Σ 6.205 €), 22 Wände (0–7.800 €), 18 Böden (0–8.500 €), 21 Herausforderungen mit Prämien **Σ 278.000 €** (84 Stufen).
- **Geld wird auf drei verschiedene Arten geprüft** (mit Dispo / ohne Dispo / gar nicht, Abschnitt 2.9).
- Geld-/Mengenwerte, die **nicht** in 02-data stehen, sind die Mehrheit: 11c (Porto, Elastizitäten, Körbe), 11d (Packmaterial), 11e (DDL), 16-day (Fixkosten, Dispo, Online-Pauschale, Automat 45 €, Eröffnung), 17-laptop (Liefergebühr, Paket-Rabatte, Restposten), 10-customers (Ruf-Deltas, Toleranzen), 10b (Großaufträge), 11-staff (Pause 30 %).

## 1. Tabellen nach Bereich

### 1.1 Ware (Einkauf, Preise, Margen, Markt)
| Größe | Wert | Datei:Zeile | Liest / schreibt | Abhängigkeiten |
|---|---|---|---|---|
| `P[t].cost` (EK je Stück), `.market` (VK-Referenz), `.box` (Stück/Karton), `.lvl`, `.weight` (Wunschgewicht), `.hype`, `.risk` | 239 Einträge | `02-data.js:8` (≈36 Basis), `02d:175` (Rezepte), `02e:815`, `02f:35`, `02g:64`, `02h:47`, `02i:48`, `02j:63` | Liest: `02b` (`marketOf`, `costOf`, `ekRoh`), `10-customers` (Wunsch, Preis), `17-laptop` (`tierPrice`), `18-save` (`freshState` Startpreise), `11c` (`vsListe`), `14b-shows:707` (`burned`). Schreibt: nur `02h:59` (Kugeln: `market=vk`, `cost=vk/2,33`) und `02d` (Rezepte) | `cost*miOf*inflOf` = EK; `market*meOf*inflOf` = Kundenerwartung. `weight` wirkt auf Nachfrage, `hype` auf Zündwirkung |
| `KUGEL_MARGE` | 2,33 | `02h-kugeln5.js:40` | `02h:59`, `02i:47` | EK-Ableitung der Kugelbomben |
| `S.prices[t]` (Spielerpreis) | Start = `P.market`; Lizenzkauf setzt `marketOf` | `18-save.js:5,137,165`; `17-laptop.js:24,197,1557`; `21-input.js:300` | gespeichert. Liest: `10-customers:363,306`, `11c:168`, `10b:19` | Preis/Markt → `buyChance`; Online-Deckel 1,3×Markt |
| `VOLA[t]` (Volatilität je Sorte) | 239 Einträge, 0,15–1,65 (≈ 100 von Hand in `02b:8-21`, Rest über `neuVola` in 02e/02g-02j; Fallback Kat. 0,45/0,6/0,85) | `02b-markt.js:8,22` | `regimeWahl`, `marktInit`, `rollMarkt` | bestimmt Tagesrauschen, Schockwahrscheinlichkeit (`0,012*v`, nur v ≥ 0,48) |
| `REGIME` (fest/ruhig/normal/sturm) amp/rev/Dauer; Wahlgewichte nach Vola | amp 0,10/0,34/0,85/2,10; rev 0,26/0,15/0,07/0,04; Gewichte `[72,26,2,0]`… | `02b:25-47` | `rollMarkt` | |
| `MI_MIN/MI_MAX` | 0,62 / 1,88 | `02b:48` | `marktInit`, `rollMarkt` | Kappung des Preisindex |
| Tagesrauschen / Erwartungsträgheit / Schock | `gauss()*0,045*v*amp`; `+0,26` Nachlauf; Schock knapp 55 % ×(1,28–1,80), Schwemme ×(0,60–0,82), Dauer 3–9 | `02b:174-182` | `rollMarkt` | `S.mi`, `S.me`, `S.reg`, `S.schock`, `S.mh` gespeichert |
| Inflation | Tagesschritt `rand(0,0008..0,0028)` + 5 % Chance `+rand(0,003..0,009)`, Kappung 1–4 (≈ 0,21 %/Tag im Mittel, ×2,1 nach 365 Tagen) | `02b:158-160` | `inflOf`, `marketOf`, `ekRoh` | **wirkt nur auf VK-Erwartung und EK** (gleichzeitig, Marge bleibt), nicht auf Löhne, Fixkosten, Ausbau, Porto, Packmaterial |
| Konkurrenz `S.comp` | täglich ×rand(0,95..1,05), Kappung 0,88–1,12 | `16-day.js:63` | `priceTol` (multipliziert) | gespeichert (`comp`) |
| `ekFactor()` | `evv('ek')` × 0,9 mit Großhandelslizenz | `16-day.js:66` | `17-laptop:206,299,1317` | Ereignisse „Engpass“ ×1,35 / „Schnäppchen“ ×0,68 (`02-data:766ff`); gilt **nicht** für Regale, Packmaterial |
| Lieferanten `SUPPLIERS` | Fachhandel mult 1,0 q 1,0; Großhandel ab L8+Kap.2, Pack 10 (−10 %) / 20 (−18 %); Restposten ab L14 mult 0,6 q 0,86 | `02-data.js:373-380` | `17-laptop:206-232` | `.delay:[4,8]` wird **nirgends gelesen** (toter Wert) |
| Liefergebühr Wareneingang `VERSAND`, `VERSANDFREI`, `LIEFERZEIT_SEK` | 5,90 € / frei ab 150 € / 5 s | `02-data.js:519` | `17-laptop:225,299,425,446,1273`; Handbuch-Text `21b:26` | **Namensfalle**: `VERSAND` = Eingang vom Lieferanten, `VS_*` = Ausgang Onlineshop |
| `PACKS` (Wundertüten/Themenpakete), `PACK_RABATT`, Faktoren 0,56/0,6/0,7, `jackpot 0,12`, Schwelle 6 € | n = 4…30 Kartons | `02-data.js:388`; `17-laptop:329-346` | `packPreis`, `buyAngebot` | Preis = Ø EK-Wert × n × Faktor, auf 5 € gerundet; **im Angebot** wird `preis` fixiert und im Spielstand gespeichert (`rest`) |
| `RESTPOSTEN` | Welle 70–260 s, Dauer 120–360 s, max 8; `restDruck`: `(Geld/Kosten−4)/26`, Kredit ×0,5; `pLeer 0,15+0,4d`, `pViel 0,28−0,2d`, Preisstreuung ×0,85–1,12 | `17-laptop.js:370-398` | `restTick` | koppelt Angebot an Kontostand/Fixkosten/Lohn |
| `S.gutschrift` | aus Herausforderung Stufe 2 | `02c:166`, `17-laptop:266` | gespeichert | verrechnet beim nächsten Wareneinkauf |

### 1.2 Laden, Kunden, Tagesablauf
| Größe | Wert | Datei:Zeile | Liest / schreibt | Abhängigkeiten |
|---|---|---|---|---|
| Öffnungszeit / Tageslänge | 08–22 Uhr = 840 min, `MIN_PER_SEC=840/330` → 330 s Echtzeit | `02-data.js:512` | `16-day`, alles | bestimmt, wie viel Kunden pro Echtzeit |
| Kunden-Takt `spawnInterval()` | Basis 9,2 s / `m`, min 0,55 s; Zufall ×0,6–1,4; Deckel **20 Kunden gleichzeitig** (`customers.length<20`) | `16-day.js:124-130`, `:149` | `updateDay` | `m` = dayMult × Event `cust` × `eroeffnung` × (1+0,05(Jahr−1)) × (0,55+Ruf/100) × `bekanntheit` × `sortimentZug` × `ladenGroesse` × Plakat 1,3 × Radio 1,25 × Tafel 1,3 × Kundenkarte 1,12 × (1+Hype/50) × (0,85+Ambiente/180) × (0,75+Sauberkeit/300). Rechnerisch ≈ 36 Kunden/Tag je m=1 |
| `eroeffnung()` | `S.day<7`: 1,75 − Tag×0,11 | `16-day.js:177` | `spawnInterval` | |
| `bekanntheit()` | 1 + min(20, Level−1)×0,019 (max 1,38) | `16-day.js:116` | | Level → Kunden |
| `sortimentZug()` / `SORT_VOLL` | 0,78 + min(1, Sorten/SORT_VOLL)×0,52; SORT_VOLL = 119 (`237·34/68`, beim Start berechnet) | `16-day.js:106-114` | | Anzahl Sorten (Lizenzen) → Kunden; SORT_VOLL ändert sich, wenn Produkte dazukommen |
| `ladenGroesse()`, `korbGroesse()` | 1 + 0,34 (shop_gross) + 0,26 (shop_ost) + 0,30 (shop_sued); Korb = 0,78 + 0,22×Größe | `16-day.js:120-123` | `spawnInterval`, `makeWishes` | Fläche → Kunden + Korb |
| `CUSTTYPES` (8 Typen) | w 30/15/13/12/10/8/7/5; tol 0,85–1,28; items 0,7–2,6; pat 0,5–1,45 | `02-data.js:790` | `rollCustType`, `buyChance`, `makeWishes` | `profi` erst ab L8 |
| Wünsche `makeWishes` | n = 1 (38 %) / 2 / 3 / 4, × Typ × Korb; Gewicht = `weight`; Silvester-Nähe ×1,9 (F2), Hype>40 ×1,3 (F2), Event `cat0`/`cat2`, Jugend F2 ×0,12, Profi F2 ×2,6; Menge q nach Marktpreis (>20 €: 1; >7 €: 1–2; sonst 1–3), Silvester +1 (45 %) | `10-customers.js:221-247` | | |
| `nachfrageFaktor(t)` | Regal ja 1,0 / nur Lager 0,5 / nirgends 0,3 | `10-customers.js:217` | `makeWishes` | **Ware fehlt → weniger Wünsche, aber Ruf −0,4 je Fehlwunsch** |
| `priceTol()` | (0,95 + Ambiente/450 + Ruf/900 + Bilder + (Freundlichkeit−1)×0,12) × Event `tol` × `comp` | `10-customers.js:209` | `buyChance` | Ambiente, Ruf, Personal-Lohn, Konkurrenz |
| `buyChance(t,preis,q,kalt,typ)` | lo = priceTol×Typ-tol + (q−1)×0,18 + 0,16 (Kühlung); Kaufwahrsch. linear von 1 (r ≤ lo) auf 0 (r ≥ lo+0,5) | `10-customers.js:210` | `take()` `:306` | `r` = Spielerpreis / `marketOf` |
| `priceHint` (Anzeige) | Schwellen lo / +0,2 / +0,45 | `17-laptop.js:17-22` | | **Anzeige-Schwellen (0,2/0,45) passen nicht zur Rechnung (0,5)** |
| Geduld | (rand(75,110) + 0,3·Ruf + Heizung 30 + Klima 35 + 0,35·Ambiente) × (0,72+0,3·Freundl.) × Typ-pat × Event `pat` | `10-customers.js:266` | | |
| Diebstahl `thiefChance` | 0 unter L4; 0,035 + min(0,05; L×0,0035); Kameras ×0,5; Security ×0,35; Event ×3 | `10-customers.js:248-253` | | Wert = EK (`costOf`); fließt **nicht** in `out` (Ware war schon bezahlt) |
| Kasse: Karte/Bar | 60 % Karte; Kartendauer 1,0 s (Terminal 0,6 s), Bar 2,2 s | `10-customers.js:393-394` | | |
| SB-Kasse | Korb ≤ 3 (mit Betreuer ≤ 8), Wahrsch. 0,45 / 0,6; Problem 0,18+0,025/Artikel (max 0,36); `SB_SELBST=30` s | `10-customers.js:348-375`, `06-fixtures.js:412` | | |
| Tagesereignisse `EVENTS` (17) | Gewichte w 5–8, Wirkung cust/tol/pat/ek/delay/theft/pyro …; 34 % kein Ereignis, nicht vor Tag 3 | `02-data.js:766`, `16-day.js:70-80` | `evv(k)` | |
| Hype | +`P.hype` je gezündetem Stück (max 100), Verfall 1,1/s, Tagesende → 0 | `14b-shows:707`, `20-loop:157`, `16-day:294` | `spawnInterval`, `makeWishes` | Testfeld → Kunden |
| Ambiente `ambienteScore()` | Deko `amb` + Musik 6 + Regallicht 6 + Heizung 4 + Regalart `amb` − Schmutz·12 + Wand/Boden anteilig (26/20), Kappung 0–100 | `02-data.js:861-870` | `priceTol`, `spawnInterval`, Geduld | Deko-Preise (DEKO) → Preistoleranz |
| Sauberkeit | `100 − 7·Dreckflecken` | `02-data.js:854` | `spawnInterval` | |
| Wochenziele `GOALS` | need/pay als Funktion des Levels (z. B. Umsatz 600+260L → Prämie 120+45L; Prämie → +pay/3 XP) | `02-data.js:809`, `16-day:82-100` | | Prämie unabhängig von tatsächlichem Umsatz |
| Großaufträge (Telefon) | Menge 2–4 / 3–6 / 4–9 Kartons je Level (<10/<15/≥15); Wert = Karton×`box`×Spielerpreis; 5 Typen mit `open` 0,74–0,92 / `ceil` 1,03–1,38; Meister ×1,33; Wartezeit-Takt `phone.cd`, Nebensaison schneller | `10b-pyro.js:7-34,91`, `02-data.js:406` | | Saison (`dayMult`) → Anruffrequenz; nicht erfüllt: Ruf −4 (`:144`) |
| Getränkeautomat (Deko) | +45 €/Tag | `16-day.js:204,218` | | |

### 1.3 Personal
| Größe | Wert | Datei:Zeile | Liest / schreibt | Abhängigkeiten |
|---|---|---|---|---|
| `STAFF` (10) | Einstellung 250–800 €, Lohn 55–190 €/Tag, Level 6–29 (Packer 25/27/29) | `02-data.js:345-361` | `17-laptop:1582`, `11-staff:268` | Lohn Packer 165/170/175 hängt an Versand-Wirtschaft (Onlineergebnis) |
| `WAGES` (Lohnstufen) | ×0,75 / 1,0 / 1,30 / 1,65 | `11-staff.js:62` | `dailyWages`, `friendliness`, `applyWage` (Tempo 0,55+0,48f) | Lohn → Freundlichkeit → Preistoleranz + Geduld |
| Saisonpause | 30 % Lohn | `11-staff.js:268`; Text-Kopien `16-day:272`, `17-laptop:1438`, `21b-handbuch:86` | | 4 Stellen |
| `staffMorale` | Lohnstufe < 0,8: 14 %/Tag Kündigung, Ruf −1 | `11-staff.js:270-277` | | |
| Tageslohn | Σ `wage×Stufe×(Pause 0,3)` | `11-staff.js:268` | `endDay` `:204` | gebucht am Tagesende |

### 1.4 Ausbau, Einrichtung, Regale
| Größe | Wert | Datei:Zeile | Liest / schreibt |
|---|---|---|---|
| `UPGRADES[].cost` (Funktion `()=>Zahl`) | 10 € (Kisten) … 42.000 €; vollständige Liste: `docs/balancing/daten/katalog.json` (Branch balancing) bzw. Messskript (Anhang) | `02-data.js:261-326` (Zeile je Ausbau = id) | `17-laptop:1646ff` (`buyUp`), UI, `levelUnlocks`; Katalog `sim.js:268` |
| Fläche (Auswahl) | Ladenerw. 1 1.400 (L3) / 2 7.500 (L11) / 3 16.000 (L21) / 4 34.000 (L24) / 5 Tür 11.500 (L25); Lager 1.200 (L6), Nord 1.900, Gross 6.200, Süd 11.000, Süd2 15.000; Logistikhalle 22.000/30.000/42.000, Rampen 12.000–26.000; Packstation 6.400 / 5.900 / 6.900; Testfeld 3.200; Labor 9.800; Onlineshop 3.200 (L15) | s. o. | |
| Markt-Ausbauten | Plakat 400 (+30 % Kunden), Radio 1.200 (+25 %), Tafel 4.200 (+30 %), Kundenkarte 2.600 (+12 %), Großhandelslizenz 6.500 (EK −10 %), Meister 12.000 (Aufträge ×1,33) | | Wirkung steht **im Code verstreut**: `16-day:127`, `16-day:66`, `10b:91` – nicht neben dem Preis |
| `DEKO[]` | cost 70–1.400, `amb` 2–12, `buy` 0,03–0,07 (Kauflaune) | `02-data.js:328-343` | `ambienteScore`, `bildBoost` |
| `WALLS` / `FLOORS` | cost 0–7.800 / 0–8.500, Ambiente anteilig nach Rang (26 / 20) | `02-data.js:427,451`, `:867` | |
| `SHELFKIND[].cost/step/amb/lvl` | Preis = `cost + step·bereits_aufgestellt` (klein 45+28n … gross 640+210n, kasse 120+60n) | `02-data.js:540-581`, `regalPreis :613` | `17-laptop orderRegal` (mit Dispo) |
| `RACKKIND` (Lagerregale) | standard 0+0n, hoch 520+150n, schwer 880+240n | `06-fixtures.js:1168-1171` | **zweite Preisablage** neben `SHELFKIND`; `.lvl` dort (1/12/18) wird nirgends gelesen, maßgeblich ist `REGALWARE` (`02-data:590`: rhoch L16, rschwer L18) |
| Mehrwegkisten | 10 € je 5 Stück (`KISTE_STUECK=5`) | `02-data:265`, `08e-kiste.js:20` | |
| Sackkarre / Plattformwagen | 350 € (4 Kartons, Tempo 0,9) / 1.400 € (8, 0,85) | `02-data:262,266`, `08d-karre.js:12-13` | Preis in `UPGRADES`, Kapazität in `KARREN` |
| `EINBAU` (kasse2 SB-Kassen) | Preis 3.400 steht in `UPGRADES.kasse2` | `08-boxes.js:135` | |
| Kosten für Eigenrezepte | Entwicklung `(320+Basis·95)·(1+Klasse·0,22)·(2. Stufe ×1,45)`; Produkt-EK/-VK aus `rezeptKosten/rezeptMarkt/rezeptHype` | `02d-rezeptur.js:112-133`, `17-laptop:1946` | Ergebnis (cost, market, hype) im Spielstand (`eigene`) |
| XP-Quelle Ausbau/Deko | Kosten/12 | `17-laptop:1696,1707,1712` | **Geld ausgeben bringt XP** |

### 1.5 Lizenzen, Kapitel
| Größe | Wert | Datei:Zeile |
|---|---|---|
| `LIZENZEN` (15 in 02b + 12 `NEU_LIZENZEN` in 02e, zur Laufzeit gemergt `02e:820`) | 0 € (Start) … 52.000 €; Level 1–29; 1–16 Sorten je Paket; €/Sorte von 0 bis **16.000** (Schabernack, 1 Sorte); Feinkost 6.000, Nachthimmel 3.000, Meister 11.333, Pyroweltklasse 13.000 | `02b-markt.js:194-234`, `02e-neuware.js:575`, `LIZ_VON :235` |
| XP-Quelle | `Lizenzkosten/14 + 30` | `17-laptop.js:198` |
| `KAPITEL` (11) | Auslöser = Ausbau-id (`up`); Kapitel 1–7 gebaut, 8–11 geplant; `DEMO=false` | `02-data.js:230-249` |
| Kapitel-Aufstieg | +40 XP | `19-hud.js:116` |
| Herausforderungen `ERFOLGE` | 21 Reihen × 4 Stufen: Prämie 70–18.000 €, Stufe 2 oft als Warengutschrift, XP = Prämie/10+25 | `02c-erfolge.js:5-110,160-176` |

### 1.6 Versand / Onlineshop (Ausgang)
| Größe | Wert | Datei:Zeile | Liest / schreibt | Abhängigkeiten |
|---|---|---|---|---|
| `VS_CFG_STD` | Versand 4,90 €, frei ab 50 €, nie=false | `11c-versand.js:86` | `vsCfg`, `vsQuoteStd` (Referenz für „Nachfrage 100 %“) | `S.versandCfg` gespeichert (kosten, frei, nie, v:2) |
| `VS_KOSTEN_MAX` / `VS_FREI_MAX` | 20 € / 300 € | `:88` | UI-Klemmen | |
| `VS_PORTO` | S 2,00 / M 3,50 / L 5,00 € je Paket | `:87` | `vsBuchen :678`, Statistik `17-laptop:1038ff`, Text `21b:89`; exponiert in `22-start` | Paketklasse aus Volumen (`VS_GR[..].vmax`) |
| `vsAnnahme(w,v)` | `exp(−0,75·(v/(0,2w+2,5))²)` (Quelle Baymard, Lewis/Singh/Fay) | `:109` | `updateVersand :1217` (Abbruch), `vsQuote` | Warenkorb w, Versandgebühr v |
| `VS_KORB` | 9 Quantile [5,9,13,18,22,28,38,55,95] € | `:112` | `vsQuote` | nur für Anzeige/Standard-Nachfrage, nicht für die echten Bestellungen |
| Aufstocken an der Schwelle | 60 % legen dazu, wenn Wert in [0,7·frei; frei) | `:114-121`, `:253-258` | | |
| Sale | alles: `(1−p)^−1,5`; Produkt: Gewicht `(1−d)^−2,62`, halb so viel Neugeschäft; Klemmen 0–50 % / 5–70 % | `:126-134`, `:100-103` | `vsSaleFaktor`, `vsWahl` | gespeichert (`aktion`) |
| `vsBasis()` | `clamp(round(4 + 0,12·Ruf + 0,35·Level), 4, 22)` | `:148` | `vsBesucheProTag`, `bestellungenProTag` | Ruf, Level → Bestellungen |
| `VS_STUFE_MUL` | Packstation Stufe 0/1/2/3 = 1 / 1 / 1,45 / 1,9 | `:147` | | |
| Besucher/Tag | `vsBasis·Stufe·Sale/vsQuoteStd`, Takt `330/n` s | `:155`, `:1215` | | |
| Bestellgröße | Klasse S 68 % (spät ab L22: 50 %) / M 26 % / L 6 %; Soll-Volumen 35–95 % der Klasse | `:238-242` | `vsNeueBestellung` | `VS_GR[..]` (`:18`) |
| Online-Preis `vsListe` | `min(Ladenpreis, 1,3·Markt)` | `:168` | | |
| Paketwert-Schätzung | `12 + 0,6·Level` (nur wenn keine Bestellung) | `:140` | Anzeige | |
| **Online-Pauschale** | `round(40 + 1,6·Ruf + 4·Level)` €/Tag, ab Onlineshop, **auch mit Packstation, reiner Gewinn** | `16-day.js:200` | `endDay` | Ruf, Level (aus `ist-analyse`: 52 % des Betriebsgewinns) |
| DDL | Pauschale 39 € je Abholung, Anfahrt 20 s (≈ 50 Spielmin), `DDL_RUF=1,5`, 6 Slots | `11e-palette.js:32,41` | `ddlRufen :665`; exponiert | `S.ddlUnterwegs`; kein Geldcheck (2.9) |
| Packmaterial `VM` | Karton S 8,90 €/25, M 11,40/15, L 12,80/8, Folie 14,90/20, Band 9,90/48; Kap 50/30/16/60/96 je Platz; Verbrauch S 1·Karton+1·Folie+1·Band, M 1+2+1, L 1+3+2 | `11d-packmaterial.js:13-23` | `vmBestellen :98` (mit Dispo), `vmKostenJe` (Statistik S 1,30 / M 2,46 / L 4,25) | `DS.vm` (bei Kauf gebucht) vs. `DS.onVm` (rechnerisch je Paket, nur Statistik) |
| Lagerzeit-Strafe | Pakete von gestern: `min(3; 0,06·n)` Ruf; > 8 offene Bestellungen: `min(2; 0,12·(n−8))` Ruf | `16-day.js:191,203` | `endDay` | |
| Online-Statistik | `onlineErgebnis = Ware+Gebühr−EK−Porto−DDL−Packmaterial−Lohn` | `17-laptop.js:1025` | | EK hier = `costOf` zum **Verkaufszeitpunkt**, nicht zum Kaufzeitpunkt |

### 1.7 Finanzen: Kredit, Dispo, Fixkosten, Tagesabschluss
| Größe | Wert | Datei:Zeile | Liest / schreibt | Abhängigkeiten |
|---|---|---|---|---|
| `LOANS` (6 Stufen) | (L5, 1.000, 10 T, 1,2 %), (L8, 2.500, 12, 1,3 %), (L12, 5.000, 14, 1,4 %), (L15, 10.000, 16, 1,5 %), (L20, 25.000, 20, 1,6 %), (L26, 60.000, 24, 1,7 %) je Tag | `02-data.js:414` | `loanTier/loanMax/loanDaily :38-40`, UI `17-laptop:1451ff` | Gesamtzins gemessen: 6,6 % / 8,4 / 10,5 / 12,7 / 16,8 / 21,2 % (1. Rate 112 / 241 / 427 / 775 / 1.650 / 3.520 €). **Kreditobjekt wird im Spielstand kopiert** (`loan:{amount,remaining,term,rate,paid}`) |
| Rate | `amount/term + remaining·rate` | `16-day.js:40,206` | `endDay` | |
| Vorzeitig tilgen | 250 / 1.000 / alles; +40 XP bei Tilgung | `17-laptop:1455`, `16-day:50` | | |
| Dispo | Limit ab L4: `260 + 70·Level`; Zins 0,6 %/Tag auf Minus; Konto < 0 am Tagesende: Ruf −3 | `16-day.js:168-170,215` | `verfuegbar()` | |
| `fixedCosts()` | `10 + 6·Lagerregale + max(0, Level−4)·4 + Σ SHELFFIX[Art]` | `16-day.js:171-175`, `SHELFFIX :164` (4/9/12/18/14/11/13/3/4/5/6/8, Default 9) | `endDay`, `restDruck` | **Level-Steuer**, keine Fläche/Miete. Beispiele: L8 5 kl. Regale 46 €; L20 10 Lagerr.+10 Regale 224 €; L34 382 € |
| Tagesabschluss-Formel | Konto −= Lohn + Fix + Kreditrate + Dispozins; + Automat 45 + Online-Pauschale. „Gewinn“ = Umsatz + Extra − (Wareneinkauf + Ausbau/Deko + Rate + Dispo + Rückgeld + Lohn + Fix + **Selbst gezündet** + Porto + Packmaterial + DDL) | `16-day.js:204-211` | `showSummary` | Mischung aus Kassenfluss (Einkauf, Ausbau, Tilgung zählen als Kosten) und Verbrauch (`burned` zählt zusätzlich, ohne dass Geld fließt) – siehe 2.9 |
| Startwerte | Geld 500 €, Ruf 50, Level 1, XP 0, Tag 0 = 1. Okt. (`START_DOY=273`), Jahr 1 | `18-save.js:5`, `02-data:480` | `freshState` | |
| Rückerstattungen alter Spielstände | 3.800 (SB-Kasse 2. Tür), 650 (SB 3/4), Packstation 6.400 / 14.000 / 26.000, Packer 700 / 750 / 800 | `18-save.js:93-110` | Migration | **historische Preise, müssen fest bleiben**, auch wenn aktuelle Preise sich ändern |

### 1.8 XP, Level, Ruf
| Größe | Wert | Datei:Zeile |
|---|---|---|
| `xpFor(l)` | `round(50·l^1,55)`: L1→2 50; L5→6 606; L10 1.774; L20 5.195; L30 9.739; L40 15.211. Kumuliert bis L11 7.866, L21 43.373, L31 119.484, L41 246.259 | `02-data.js:760`, `addXP 16-day:6-15` |
| XP-Quellen (alle Literale) | Kunde: `round(0,5·Summe)+4` (+3 bar ohne Rückgeld-Fehler); Tag: `60 + 5 % Umsatz + 40 (keine Beschwerde)`; Jahr +200; Kapitel +40; Lizenz `Kosten/14+30`; Ausbau/Deko `Kosten/12`; Kredit getilgt 40; Wochenziel `Prämie/3`; Dieb 25; Großauftrag `0,4·Auszahlung+40`, Annahme 20; Wundertüte/Restposten 20; Rezept fertig 180; Herausforderung `Prämie/10+25`; Serie `n·6` bei 5/10/20/35/50/75/100; Zünden `Hype/3`; Regal aufbauen 12, Einbau 20, Gravur 12, Paket packen 3, Dreck 3, Fenster 4, SB-Hilfe 4, Packmaterial einlagern 1 | `10-customers:408`, `16-day:213,285,90,50`, `19-hud:116,172`, `17-laptop:198,359,416,1696-1712`, `10-customers:331`, `10b:96,137`, `02d:195`, `02c:173`, `14b:707`, `08-boxes:114,164`, `06b:159`, `11c:693`, `15-player:442`, `05f:218`, `06-fixtures:419`, `11d:318` |
| Level-Freischaltung | `P.lvl`/`LIZENZEN.lvl`/`UPGRADES.lvl`/`STAFF.lvl`/`DEKO.lvl`/`WALLS|FLOORS.lvl`/`LOANS.lvl`/`SUPPLIERS.lvl`/`PACKS.lvl` | `levelUnlocks :817` | Level hängt an XP-Kurve, Preise an Einkommen: **keine gemeinsame Tabelle** (ist-analyse 3.3 „Schere“) |
| Ruf-Änderungen (alle Literale) | Kauf abgeschlossen +0,8 (nach Fehlwunsch +0,2); Fehlwunsch (Fach leer) −0,4 (zusätzlich −0,3 bei Weggehen); „zu teuer“ −0,5; Geduld verloren −2; Dieb entkommen −1,8, gestellt +0,6; SB-Selbstversuch gescheitert −0,4; SB-Hilfe +0,1; Großauftrag +2,5, verfehlt −4; Prüfung +3 / −5; Konto im Minus −3/Tag; Paket-Lieferrückstand bis −3; Mindestlohn-Kündigung −1; Zeitungsartikel +2 | `10-customers:291,294,301,309,331,340,408-411,428,494`, `10b:137,144`, `16-day:186,191,203,215`, `11-staff:274`, `02-data:768` |
| Ruf-Wirkungen | Kunden `(0,55+Ruf/100)`; Preistoleranz `+Ruf/900`; Geduld `+0,3·Ruf`; Online-Besucher `+0,12·Ruf`; Online-Pauschale `+1,6·Ruf` | `16-day:126`, `10-customers:209,266`, `11c:148`, `16-day:200` |

### 1.9 Saison
| Größe | Wert | Datei:Zeile |
|---|---|---|
| `seasonInfo(n)` | Nachfrage-Faktor je Datum: 26.–31.12.: 1,5 + 0,34·(Tag−26) (31.12. = 3,2); 20.–25.12. 1,25; 1.–19.12. 1,1; 1.1. 1,35; 2.–14.1. 0,80; Jan/Feb 0,72; März 0,80; 25.–30.4. 1,45; 1.–2.5. 1,30; Apr/Mai 0,9; Juni 1,0; Juli/Aug 1,15; Sept 0,88; 28.–31.10. 1,25; Okt 0,92; Nov 0,86 | `02-data.js:490-508` |
| `WDMULT` | So 0,55 / Mo 0,82 / Di 0,84 / Mi 0,90 / Do 1,0 / Fr 1,28 / Sa 1,35 | `02-data.js:509` |
| `silvesterNah` | 26.–31.12.: Wunschgewicht F2 ×1,9, Menge +1 | `02-data:511`, `10-customers:222` |
| Verwendung | **nur** `spawnInterval` (Ladenkunden) und `10b:28` (Anruffrequenz); nicht Online, nicht Markt/EK | `grep dayMult` |
| Sonntag | Ruhetag ohne `tag4` (900 €) | `16-day.js:131` |

## 2. Abhängigkeitsketten (so läuft es wirklich) + Lücken

### 2.1 Versandkosten → Bestellungen → Ergebnis
Ist: Spieler stellt Versand/Schwelle (`vsCfg`, `17-laptop` Aktionen `vsk`/`vsf`) → `vsBasis(Ruf,Level)×Stufe×Sale/vsQuoteStd` = **Besucher/Tag** (`11c:155`) → pro Besucher `vsNeueBestellung` baut einen Warenkorb **aus vorhandenem Bestand** (`:234`) → `vsGebuehr(Wert)` (`:107`) → Zufallsentscheid `vsAnnahme(Wert, Gebühr)` (`updateVersand :1217`): ja → Bestellung (`S.bestellungen`), nein → `DS.onAbbr` → Packer/Spieler packt → `vsBuchen` (`:676`): Konto + Ware + Gebühr − Porto(Klasse); Packmaterial wird beim **Einkauf** gebucht (`vmBestellen`), DDL-Pauschale beim **Anruf** → Tagesabschluss („Versand (Pakete)“, Porto, DDL, Packmaterial; Lohn über `dailyWages`).
Lücken: (a) `bestellungenProTag` (`:150`, Anzeige „Nachfrage x %“) nutzt `vsQuote`-Quantile, die echte Bestellung nutzt den Warenkorb: beide kommen im Mittel zusammen, sind aber **zwei getrennte Modelle**. (b) **Saison, Ereignisse, Plakat/Radio/Hype, Ambiente, Sortimentsbreite wirken nicht auf Online** – nur Ruf und Level. (c) **Ladenpreis → Online:** nur Deckel 1,3×Markt (`vsListe`), kein Preisvergleich/Abbruch durch hohen Preis; ein höherer Warenwert senkt sogar den Versand-Abbruch (`0,2w` im Nenner). (d) Online-Pauschale (`16-day:200`) kennt weder Versandkosten noch Sale noch Bestand.
### 2.2 Leere Fächer → Ruf → Kunden
`makeWishes` (nur freigeschaltete Sorten, `nachfrageFaktor` dämpft auf 0,5/0,3) → Kunde sucht Fach (`10-customers:289-301`) → leer: `rep(−0,4)`, `DS.missed` → Kauf: `rep(+0,8)` (`:411`) → `S.rep` → `spawnInterval (0,55+Ruf/100)` und `priceTol`, Geduld, Online-Basis. **Lücke:** keine Tagesdeckelung, keine Warnung beim Lizenzkauf ohne Regalplatz; „zu teuer“ (`:309`) erscheint nicht im Tagesabschluss (es gibt nur `missed` und `angry`).
### 2.3 Preis → Kauf → Umsatz → XP/Level → Freischaltung
Spielerpreis `S.prices[t]` ÷ `marketOf(t)` (= `P.market·meOf·inflOf`) gegen `priceTol×Typ+Menge+Kühlung` (`buyChance`) → Umsatz → XP `0,5/€` (+5 %/Tag) → `xpFor` → Level → Lizenz/Ausbau-Freischaltung. **Lücke:** Level und Geld sind getrennte Kurven; XP kommt zusätzlich aus Ausgaben (Kosten/12, Lizenz/14).
### 2.4 Markt → Einkauf/Verkaufserwartung
`rollMarkt` (täglich) → `S.mi` (Index) → `S.me` zieht mit 26 % nach → `marketOf` (Kundenerwartung, dazu `S.comp`, Events) und `ekRoh` (sofort `mi`, nicht verzögert) → Einkaufschance = Lücke `me/mi`. Inflation multipliziert beides. **Lücke:** Saison hat keinen Einfluss auf den Markt (ein Silvester-Preisaufschlag gibt es nur über Ereignisse).
### 2.5 Fläche/Ausbau → Fixkosten
`fixedCosts` = Konstante + Lagerregale×6 + Level×4 + Regalfixkosten. **Fläche, Hallen, Tore, Packstation haben keine Fixkosten** (nur Kaufpreis); Level kostet Geld (`(L−4)·4`). Ausbau → `ladenGroesse` → mehr Kunden und größere Körbe.
### 2.6 Kredit/Dispo → Tagesergebnis → Ruf
Rate aus `LOANS`-Kopie im Spielstand; Dispozins 0,6 % auf Minus; Konto < 0 → Ruf −3 → weniger Kunden. Kredit beeinflusst sonst nur `restDruck` (×0,5). **Lücke:** kein Pfad zur Insolvenz/Bank-Krise; Kreditaufnahme prüft Betrag und Level nur über die Knopfliste (2.9).
### 2.7 Personal → Lohn → Stimmung
Lohnstufe → `friendliness()` → `priceTol` (+(f−1)·0,12) und Geduld (0,72+0,3f); Mindestlohn kündigt (14 %/Tag, Ruf −1). Lohn selbst folgt weder Level noch Inflation noch Ergebnis.
### 2.8 Silvester-/Saisonfaktor
`seasonInfo × WDMULT` (`dayMult`) → `spawnInterval` (Takt) **gedeckelt durch 20 gleichzeitige Kunden** (`16-day:149`); Silvester-Nähe → Wünsche F2 ×1,9 und Menge +1; Nebensaison → Anrufe schneller (`10b:28`). Mitarbeiter-Pause (30 %) wird nur als Textempfehlung gekoppelt (`16-day:269-272`). **Lücke:** Online/Markt/Lohn/Fixkosten kennen keine Saison.
### 2.9 Weitere Inkonsistenzen, die beim Umzug nicht „nebenbei“ verschwinden dürfen (nur melden, nicht ändern)
1. **Kredit:** `takeLoan(amount)` (`16-day.js:41-45`) nimmt Laufzeit/Zins der **höchsten freigeschalteten Stufe** (`loanTier`), die Karten im Laptop (`17-laptop:1457-1459`) zeigen aber Laufzeit/Zins der **jeweils gewählten** Stufe. Beispiel Level 8: Karte „1.000 € über 10 Tage, 1,2 %“ ergibt 12 Tage, 1,3 %. Beträge ≤ Rahmen werden nur über die Knopfliste begrenzt. (Nur gelesen, nicht im Lauf geprüft.)
2. **Gewinn des Tages** zieht `DS.burned` ab (`16-day:211`), aber `burned` wird nie vom Konto abgebucht (`:210`): Selbst gezündetes erscheint als zweiter Verlust zusätzlich zum Wareneinkauf. Außerdem zählen Ausbau und Tilgung als Tageskosten (Kassenfluss, nicht GuV).
3. **Geldprüfung uneinheitlich:** Ware, Regale, Packmaterial prüfen `verfuegbar()` (mit Dispo); Ausbau, Lizenz, Deko, Wände/Böden, Personal, Rezepturen prüfen `S.money` (ohne Dispo); `ddlRufen()` (`11e:664`) prüft gar nichts (nur der Laptop-Knopf ist gesperrt).
4. **Preisablagen doppelt:** Lagerregale `RACKKIND` (06-fixtures) vs. Verkaufsregale `SHELFKIND` (02-data); `REGALWARE.lvl` vs. `RACKKIND.lvl` (letzteres ungenutzt); `SHELFFIX` in 16-day hat keinen Eintrag für `kasse` (Default 9).
5. **Inflation** trifft EK und VK-Erwartung, aber keine Fixgrößen (Lohn, Fixkosten, Porto, DDL, Packmaterial, Ausbau, Regale).
6. **Texte als Wertkopien** (driften): Handbuch `21b:26,27,35,37,86,89,90`, `UPGRADES.desc` (+30 %, −10 %, ⅓ …), `17-laptop:1104` („100 % = 4,90 €, frei ab 50 €“), `:1438`, `:1460`, `16-day:272`, `02-data` Kredit-Hinweis.
7. `SUPPLIERS[].delay` ungenutzt; Online-Statistik-Wareneinsatz zum Verkaufszeitpunkt.

## 3. Inline-/Magic-Numbers (Datei:Zeile)
Alles, was bereits in Tabellen oben mit Zeile steht, ist hier nicht wiederholt. Neu/zusätzlich (Auszug, nach Gewicht):

| Stelle | Wert | Bedeutung |
|---|---|---|
| `16-day.js:168` | `260+70·L` | Dispo-Limit |
| `16-day.js:170,239` | `0.006` | Dispozins (zweimal) |
| `16-day.js:172` | `10`, `6`, `4`, `L−4` | Fixkosten-Grundbetrag, je Lagerregal, je Level |
| `16-day.js:177` | `1.75`, `0.11`, `7` | Eröffnungsbonus |
| `16-day.js:191` | `0.06`, `3` | Ruf-Strafe je wartendem Paket, Deckel |
| `16-day.js:200` | `40`, `1.6`, `4` | Online-Pauschale |
| `16-day.js:203` | `8`, `0.12`, `2` | Strafe offene Bestellungen |
| `16-day.js:204,218` | `45` | Getränkeautomat |
| `16-day.js:213` | `60`, `0.05`, `40` | Tages-XP |
| `16-day.js:215` | `−3` | Ruf bei Minus |
| `16-day.js:63` | `0.95/1.05/0.88/1.12` | Konkurrenz |
| `16-day.js:73` | `0.34`, Tag 3 | Ereignischance |
| `16-day.js:116,121,123` | `0.019`, `20`; `0.34/0.26/0.30`; `0.78/0.22` | Bekanntheit, Ladengröße, Korb |
| `16-day.js:114` | `0.78`, `0.52`, `34/68` | Sortimentszug |
| `16-day.js:125-129` | `0.05`, `0.55`, `1.3/1.25/1.3/1.12`, `/50`, `0.85`, `/180`, `0.75`, `/300`, `9.2`, `0.55` | Kundenformel |
| `16-day.js:149` | `20`, `0.6–1.4` | Kundendeckel, Streuung |
| `16-day.js:66` | `0.9` | Großhandelslizenz-Rabatt (Text: „zehn Prozent“) |
| `16-day.js:272`, `11-staff:268`, `17-laptop:1438` | `0.3` / „30 Prozent“ | Saisonpause |
| `10-customers.js:209-210` | `0.95`, `/450`, `/900`, `0.12`, `0.18`, `0.16`, `0.5` | Toleranz/Kaufwahrscheinlichkeit |
| `10-customers.js:224-242` | `0.38/0.6/0.8`, `1.9`, `1.3`, `0.12`, `2.6`, `20`, `7`, `0.65`, `0.45` | Warenkorb |
| `10-customers.js:249-252` | `0.035`, `0.05`, `0.0035`, `0.5`, `0.35` | Diebstahl |
| `10-customers.js:266` | `75–110`, `0.3`, `30`, `35`, `0.35`, `0.72`, `0.3` | Geduld |
| `10-customers.js:408-411` | `0.5`, `4`, `3`, `0.8`, `0.2` | XP/Ruf je Kunde |
| `10-customers.js:291-309,331,340,428,494` | `−0,4 −0,3 −0,5 +0,6 −1,8 −2 −0,4` | Ruf-Deltas |
| `10b-pyro.js:7,28,91,96,137,144` | `[4,9]/[3,6]/[2,4]`, `1.9`/`0.9`/`0.8`, `1.33`, `20`, `0.4·pay+40`, `rep +2,5/−4` | Aufträge |
| `11-staff.js:270-277` | `0.8`, `0.14`, `−1` | Kündigung |
| `11c-versand.js:109` | `0.75`, `0.2`, `2.5` | Abbruchmodell |
| `11c-versand.js:112,126-134` | `VS_KORB`, `−1.5`, `−2.62`, `0.5`, `50`, `70` | Warenkörbe/Sale |
| `11c-versand.js:148` | `4`, `0.12`, `0.35`, `4–22` | Besucher-Basis |
| `11c-versand.js:168,238-242,253` | `1.3`; `0.68/0.94/0.5/0.85`, `22`; `0.6`, `0.7` | Online-Preisdeckel, Größenverteilung, Aufstocken |
| `11c-versand.js:140` | `12 + 0,6·Level` | Paketwert-Schätzung |
| `11c-versand.js:1215` | `330` | Echtzeit-Tag (Duplikat von `MIN_PER_SEC`) |
| `11c-versand.js:157` | `1.3` | Volumenzuschlag (Klasseneinteilung) |
| `11e-palette.js:32` | `39, 20, 1.5` | DDL |
| `11d-packmaterial.js:23` | `VM_FOLIE`, `VM_BAND` | Verbrauch |
| `17-laptop.js:225,299` | `VERSAND`, `VERSANDFREI` | Liefergebühr |
| `17-laptop.js:329-346` | `0.88/0.12`, `6`, `0.56/0.6/0.7`, `5` | Paketpreis |
| `17-laptop.js:370-398` | `70–260`, `120–360`, `8`, `60`, `4`, `26`, `0.5`, `0.15`, `0.4`, `0.28`, `0.2`, `0.85–1.12`, `0.7+0.9d` | Restposten |
| `17-laptop.js:17-22` | `0.2`, `0.45` | Preisampel (weicht von Rechnung 0.5 ab) |
| `17-laptop.js:198,1696,1707,1712` | `/14 +30`, `/12` | XP aus Ausgaben |
| `17-laptop.js:1455` | `250`, `1000` | Tilgungsknöpfe |
| `02-data.js:861-870` | `6`, `6`, `4`, `12`, `26`, `20` | Ambiente |
| `02-data.js:854` | `7` | Dreck → Sauberkeit |
| `02-data.js:760` | `50`, `1.55` | XP-Kurve |
| `02b-markt.js:158-182` | siehe 1.1 | Inflation, Schock, Trägheit |
| `02d-rezeptur.js:112-133` | `320`, `95`, `0.22`, `1.45`, `1.75`, `0.42`, `0.72`, `0.19`, `0.62` … | Rezeptformeln |
| `18-save.js:5,93-110` | `500`, `50`, `3800`, `650`, `6400/14000/26000`, `700/750/800` | Startgeld/-ruf, historische Erstattungen |
| `17e-gameplay.js:205-214,207` | `450000`, `72`, `×1.04` | nur Vorführung (kein Spiel) |
| `17-laptop.js:1627` | `250000` | Testmodus |
| `20-loop.js:157` | `1.1` | Hype-Verfall |
| `19-hud.js:172` | `[5,10,20,35,50,75,100]`, `×6` | Serien-XP |

## 4. Vorschlag Wirtschaftszentrale

### 4.1 Rahmenbedingungen aus dem Bestand (wichtig)
- `src/build.sh` hängt die Dateien per **fester Liste** zusammen (kein Sortieren nach Namen). Neue Datei dort eintragen; sonst nichts (nur `build.sh` kennt die Dateinamen).
- Alle Teile laufen in **einem globalen Skript-Scope** mit `const`: ein Bezug auf `WIRT` vor seiner Definition wirft beim Laden (TDZ). `02-data.js` wertet `LOANS`, `STAFF`, `SUPPLIERS`, `VERSAND` … beim Laden aus, `LIZENZEN`/`UPGRADES.cost` teils beim Laden/teils lazy. **Die Zentrale muss deshalb vor `02-data.js` stehen** (nach `reuse-helpers.js`, weil `r2`/`clamp` gebraucht werden) – also nicht `02k`, sondern z. B. **`01c-wirtschaft.js`** (`01b` ist für die Materialbibliothek vorgesehen).
- `22-start.js` (`window.__bb`, Zeile 126-128) macht >50 Wirtschaftsnamen sichtbar; **44 von 166 Tests-Dateien** (Namenstreffer) und `tools/balance/sim.js` (per `with(window.__bb)`) lesen sie: `UPGRADES, LIZENZEN, STAFF, LOANS, KAPITEL, PACKS, SUPPLIERS, VS_PORTO, VS_CFG_STD, DDL_PAUSCHALE, VM, REGALWARE, RACKKIND, xpFor, fixedCosts, dailyWages, loanDaily, spawnInterval, dispoLimit, regalPreis, packPreis, dayMult, VERSAND`. Diese Namen bleiben als **Aliase** bestehen.
- Spielstände (`v:3`): es ändert sich **kein gespeichertes Feld**. Gespeicherte Kopien von Werten (Kredit `{amount,term,rate}`, Restposten-`preis`, Bestellung `wert/versand`, Eigenrezept `cost/market/hype`, Wochenziel `need/pay`, `versandCfg`, `onlineLog`, `S.prices`) bleiben unberührt; spätere Balancing-Änderungen wirken dann nur auf Neues (bewusst, im Bericht erwähnen).

### 4.2 Objektaufbau
Eine Datei, zwei Teile, **nur Zahlen und reine Funktionen** (kein Zugriff auf `S`/`P` beim Laden; Funktionen bekommen Argumente oder lesen `S` erst beim Aufruf):

```js
const WIRT = {                                  // Teil 1: Daten (tief eingefroren am Dateiende)
  start:   { geld:500, ruf:50, level:1, startDoy:273 },
  zeit:    { oeffnen:480, schliessen:1320, echtzeitSek:330 },                    // MIN_PER_SEC wird daraus berechnet
  markt:   { vola:{…}, regime:{…}, miMin:0.62, miMax:1.88, trage:0.26, inflation:{…}, schock:{…}, konkurrenz:{…} },
  saison:  { tabelle:[…], wochentag:[…], silvester:{ab:26,…} },
  kunden:  { spawn:{basis:9.2, min:0.55, deckel:20, …}, eroeffnung:{…}, typen:[…], toleranz:{…}, wunsch:{…}, diebstahl:{…}, geduld:{…}, werbung:{plakat:1.3, radio:1.25, tafel:1.3, karte:1.12} },
  ruf:     { kaufOk:0.8, kaufMitFehl:0.2, fehlwunsch:-0.4, … },                   // alle rep()-Deltas mit Namen
  xp:      { kurve:{a:50, exp:1.55}, kunde:{proEuro:0.5, bonus:4}, tag:{…}, ausgabenTeiler:{ausbau:12, lizenz:14, lizenzBonus:30}, … },
  personal:{ stufen:[…], pause:0.3, kuendigung:{unter:0.8, chance:0.14, ruf:-1} },  // Löhne/Einstellung bleiben in STAFF (Objekte), Verweis siehe 4.3
  fix:     { grund:10, jeLagerregal:6, jeLevel:4, ab:4, regalArt:{klein:4,…, default:9} },
  kredit:  { dispo:{ab:4, grund:260, jeLevel:70, zins:0.006, rufMinus:-3}, stufen:[…] },
  ausbau:  { preis:{ plakat:400, sackkarre:350, …, rampe5:26000 } },              // id → Preis; UPGRADES[].cost = ()=>WIRT.ausbau.preis[id]
  lizenz:  { preis:{ start:0, jugend:60, …, pyroweltklasse:52000 } },
  deko:    { preis:{…} }, wand:{…}, boden:{…}, regal:{ verkauf:{klein:{cost:45,step:28}, …}, lager:{hoch:{cost:520,step:150}, …} },
  einkauf: { liefergebuehr:5.9, frei:150, lieferSek:5, grosshandel:{…}, restposten:{…}, pakete:{…}, grosshandelRabatt:0.9 },
  versand: { porto:{1:2.0,3:3.5,6:5.0}, std:{kosten:4.9, frei:50}, max:{kosten:20, frei:300}, abbruch:{k:0.75, a:0.2, b:2.5}, korb:[…], sale:{alles:-1.5, produkt:-2.62}, basis:{…}, stufeMul:[1,1,1.45,1.9], onlineDeckel:1.3, pauschale:{grund:40, jeRuf:1.6, jeLevel:4}, ddl:{pauschale:39, anfahrSek:20, ruf:1.5}, material:{ks:{…},…} },
  ziele:   { … },  rezept:{ … },  erfolg:{ … },
  historie:{ erstattung:{ kasse3:3800, sb:650, packstation:[6400,14000,26000], packer:[700,750,800] } }  // NIE an Preise koppeln
};
const WF = {                                    // Teil 2: reine Formeln (Datei-Ende)
  xpFor:(l)=>Math.round(WIRT.xp.kurve.a*Math.pow(l,WIRT.xp.kurve.exp)),
  fixkosten:(level,lagerRegale,regalArten)=>…, dispoLimit:(level)=>…, kreditRate:(L)=>…,
  saison:(doy…)=>…, onlinePauschale:(ruf,level)=>…, vsAnnahme:(w,v)=>…, ruf:(name)=>WIRT.ruf[name]
};
```
Regeln: (1) **Alles mit Namen und Einheit** (`ruf.fehlwunsch`, nicht `-0.4`). (2) Beziehungen **neben** den Zahlen dokumentiert (Kommentar „wirkt auf: …“), so wird die Kette (Abschnitt 2) an einer Stelle lesbar. (3) Abgeleitete Größen (`MIN_PER_SEC`, `SORT_VOLL`, `VS_PORTO`, `DDL_PAUSCHALE` …) werden in 02-data/11c/11e als **Aliase** aus `WIRT` definiert, damit `__bb`/Tests/`sim.js` unverändert laufen.
### 4.3 Was in `02-data.js` & Co. bleibt (Umzug klein halten)
- **Katalogobjekte bleiben**: `P` (239 Produkte), `UPGRADES`, `STAFF`, `LIZENZEN`, `DEKO`, `WALLS/FLOORS`, `SHELFKIND`, `RACKKIND`, `LOANS`, `PACKS`, `SUPPLIERS`, `EVENTS`, `CUSTTYPES`, `KAPITEL` – mit Namen, Texten, Level, `req`, Geometrie. Nur die **Geldzahl** wird zum Verweis: `cost:()=>WIRT.ausbau.preis.plakat`, `hire:WIRT.personal.einstellung.reinigung` o. ä.
- **Produktpreise `P.cost/market` bleiben im Katalog** (239 Werte in 7 Dateien; Umzug brächte Risiko ohne Nutzen). Die Zentrale hält stattdessen die **Regeln** (`KUGEL_MARGE`, Soll-Marge je Sparte als dokumentierte Referenz) und ein Prüfwerkzeug (`WF.margenBericht()` für Etappe 5).
- Formelcode (z. B. `spawnInterval`, `buyChance`) bleibt, bezieht aber jede Zahl aus `WIRT`. **Reihenfolge der Zufallsaufrufe (`Math.random`) nicht ändern**, sonst driften Simulationen.
### 4.4 Wie Systeme lesen
Direkt `WIRT.bereich.name` (kein Getter nötig, Objekt ist eingefroren). Für Berechnetes `WF.name(args)`. Neue Regel (Etappe 4/5): in `src/parts` außerhalb `01c-wirtschaft.js` und der Katalogdateien dürfen keine Geld-/Rate-Literale stehen (Wächter-Test per Muster-Suche, Whitelist für Tabellen in 3.).
### 4.5 Beweis „nichts hat sich geändert“
1. **Wertesnapshot ohne Browser** (neu, billig, <2 s, keine Testsperre): Node-Skript lädt wie mein Inventar-Lauf `reuse-helpers.js` + `02*.js` (+ später `01c-wirtschaft.js` davor) in `vm` (einziger Stub: `matchMedia`) und schreibt alle Zahlen als JSON: `P` (id → cost, market, box, lvl, weight, hype, risk), `UPGRADES` (id → `cost()`, lvl, req, kap), `STAFF`, `LIZENZEN` (inkl. Items), `LOANS`, `SUPPLIERS`, `PACKS`, `DEKO`, `WALLS/FLOORS`, `SHELFKIND`, `ERFOLGE`, `GOALS.mk/pay` für Level 1–40, `xpFor(1..60)`, `seasonInfo/dayMult` für 0..730, `EVENTS`, `CUSTTYPES`, dazu per Funktionsaufruf mit Testargumenten: `fixkosten`, `dispoLimit`, `kreditRate`, `onlinePauschale`, `vsAnnahme`-Gitter (w×v). **Vorher/nachher `diff` muss leer sein.** Teile, die DOM brauchen (`16-day`, `17-laptop`, `11c`), werden dadurch geprüft, dass ihre Konstanten als WIRT-Aliase im Snapshot stehen.
2. **Gegenprobe** (Regel aus CLAUDE.md): einen Wert absichtlich ändern (z. B. `ddl.pauschale` 39→40) → Snapshot-Diff und Test `versandtor` (`soll=DDL_PAUSCHALE`) müssen anschlagen; dann zurück.
3. **Bestehende Tests** der 44 betroffenen Dateien (Liste per `grep` der Namen oben; wichtigste: `online, packer, packmaterial, versandtor, pakete, preise, markt, kauf, kapitel, lieferant, gross, pyro, ausbau, gameplay`) **einmal am Ende** mit der Testsperre (Effizienzregel), nicht je Teilumzug.
4. **`tools/balance/sim.js`** (Branch `origin/claude/balancing`) vorher/nachher je Strategie „gut“ und „schlecht“, Kernspalten (Konto, Gewinn/Tag, Level je Spieltag) vergleichen; `katalog.json` (`sim.js:268`) muss **byteidentisch** sein. Ehrlich: `sim.js` ist **nicht geseedet** (`Math.random` in Spiel und Bot) – bit-genaue Gleichheit ist nur mit einem per `addInitScript` eingesetzten Seed-PRNG möglich und selbst dann nicht garantiert (Echtzeitschleife). Daher Katalog exakt, Kurven mit Toleranz.
5. **Wächter** (Etappe 5): Snapshot-JSON als eingechecktes Referenzdokument (`docs/fundament/wirtschaft-snapshot.json`); jede spätere absichtliche Änderung zeigt sich im Diff und muss im Bericht stehen („Konsistenz“-Zeile).

## 5. Priorisierte Umzugsliste
Reihenfolge = Nutzen/Risiko. Aufwand in Agentenstunden (grob, ohne Testläufe; „Zeitprognosen“-Regel aus CLAUDE.md: Testminuten und Fehlerrunde obendrauf).

| # | Paket | Inhalt | Dateien | Nutzen | Risiko | Aufwand |
|---|---|---|---|---|---|---|
| 0 | Gerüst | `01c-wirtschaft.js` (leer + Aliasmechanik), Eintrag in `build.sh`, Snapshot-Skript, Referenz-JSON | `build.sh`, neu | Voraussetzung, Beweis | niedrig | 1–2 h |
| 1 | Finanzen | `LOANS`, Dispo (260/70/0,006/−3), `SHELFFIX` + Fixkosten (10/6/4), Eröffnung, Tages-XP, Automat 45, Startwerte | `02-data`, `16-day`, `18-save` | höchster Hebel fürs Balancing (ist-analyse 4/5/10), wenige Stellen | niedrig | 1–2 h |
| 2 | Versand/Online | `VS_*`, Abbruchmodell, Sale, Basis, Stufen-Mul, Pauschale (16-day:200), DDL, `VM`, Liefergebühr (`VERSAND`) | `11c`, `11d`, `11e`, `16-day`, `17-laptop`, `02-data` | Toms Beispiel (Versandkosten → Nachfrage …); viele Tests hängen daran | mittel (Aliase für `__bb`/Tests, Textkopien) | 3–4 h |
| 3 | Preise Ausbau/Lizenz/Personal/Deko/Regale | Preis-Maps id→Wert, `STAFF` hire/wage, `SHELFKIND`/`RACKKIND` cost/step, `WALLS/FLOORS`, `LIZENZEN`/`NEU_LIZENZEN` cost | `02-data`, `02b`, `02e`, `06-fixtures` | alle Balancing-Preise an einem Ort; `RACKKIND`-Doppelung auflösen | niedrig (IDs stabil) | 2–3 h |
| 4 | XP/Ruf-Tabellen | `xpFor` + alle `addXP`-Literale, alle `rep()`-Deltas | 14 Dateien (Liste 1.8) | macht „Level läuft dem Geld davon“ und „Ruf kippt in 2 Tagen“ steuerbar | mittel (viele Fundstellen, mechanisch) | 3–4 h |
| 5 | Kundenmodell | `spawnInterval`-Faktoren, `priceTol`/`buyChance`, `makeWishes`, `CUSTTYPES`, Diebstahl, Geduld, Saison/Wochentag | `10-customers`, `16-day`, `02-data` | Silvester-Spitze, Preisreaktion steuerbar | mittel (Formeln dicht, Zufallsreihenfolge erhalten!) | 3 h |
| 6 | Markt | `VOLA`, `REGIME`, Schock, Inflation, `S.comp` | `02b`, `16-day` | Inflation auf Fixgrößen ausdehnbar (später) | niedrig-mittel (Zufallsreihenfolge) | 1–2 h |
| 7 | Einkauf/Pakete/Restposten | `PACKS`, `PACK_RABATT`, `RESTPOSTEN`, `restDruck` | `17-laptop`, `02-data` | Vollständigkeit | niedrig | 1–2 h |
| 8 | Aufträge/Ziele/Herausforderungen | `GOALS`, `PYROTYPES`, `orderScale`, `ERFOLGE.lohn` | `02-data`, `10b`, `02c` | Vollständigkeit; Prämien 278.000 € sichtbar | niedrig | 1–2 h |
| 9 | Text-Kopien | Handbuch, `desc`, Laptop-Hinweise aus `WIRT` erzeugen | `21b`, `02-data`, `17-laptop`, `16-day` | verhindert Drift (2.9/6) | mittel (Tests, die Texte prüfen) | 2 h |
| 10 | Rezeptur | `02d`-Koeffizienten | `02d` | niedrig (Ergebnisse stehen im Spielstand) | niedrig | 1 h |
| (–) | Produktkatalog `P` | **bleibt** (239 Werte, 7 Dateien) – nur Margen-Prüfwerkzeug | – | – | – | 1 h Prüfskript |

Empfohlene Etappen-Folge: 0 → 1 → 2 → 3 (Snapshot nach jedem Schritt, Tests einmal danach), dann 4–6, Rest nach Bedarf. Befunde 2.9 (Kredit-Stufe, `burned`, Geldprüfung, Inflation) **nicht** im Umzug „mitfixen“ (Etappe 4 ist wertneutral) – als eigene Liste an Tom/Balancing.

## 6. Nicht geprüft (ehrlich)
- **Nichts im Spiel gelaufen:** keine Browser-/Playwright-Läufe, keine Messung von Bot-Kennzahlen, kein Test ausgeführt; Aussagen zu Laufzeitverhalten (z. B. Kredit-Stufenfehler 2.9.1, Abbruch-Verhalten online) sind aus dem Code gelesen, nicht im Lauf bestätigt.
- **Gemessene Daten** (Abschnitt 0, Margen, Summen, Lizenz-€/Sorte, Tilgungssummen, XP-Tabelle) kommen aus dem Datenteil (`reuse-helpers` + `02*.js` in Node). `P`-Änderungen aus anderen Dateien zur Laufzeit (z. B. durch spätere `14*`-Dateien oder `eigene` Rezepte) wurden per Suche (`P[…]=`, `.market=`, `.cost=`) ausgeschlossen, aber nicht per Laufzeitvergleich.
- Nicht vollständig durchgelesen: `17-laptop.js` (Rest der UI), `05*`, `06-fixtures` (außer `RACKKIND`/SB), `08*`, `14*`, `15*`, `17b/c/d/e`, `19b`, `20-loop`, `21*`; dort sind weitere Literale möglich (gesucht wurde gezielt nach `S.money`, `addXP`, `rep(`, `DS.`, Preis-/Prozentmustern, nicht nach jeder Zahl). Die Liste 3 ist daher „gewichtet vollständig“, nicht erschöpfend. Eine automatische Vollsuche gehört in den Wächter (Etappe 5).
- Nicht gelesen: Inhalte der 166 Tests (nur Namenstreffer gezählt: 44 Dateien nennen Wirtschaftsnamen); ob Tests Zahlenwerte als Literale erwarten (z. B. `5.9` in `packmaterial.js:142`) – diese bleiben gültig, solange Werte gleich bleiben, müssten bei Balancing aber auf `bb.…` umgestellt werden.
- `src/tests/bal.js`/`tools/balance/sim.js` nicht ausgeführt, Seeding nur aus dem Code erschlossen.
- Desktop-Ordner (`desktop/`) und `ROADMAP.md` nicht geprüft; ob dort Preise/Texte stehen, ist offen.
- Echte Daten für Kredit-Zinsen/Miete/Porto (Tom: „an echten Daten ausrichten“) wurden **nicht** recherchiert; das ist Balancing, nicht Inventar.

## Anhang: Messskript (Datenteil in Node, ohne Browser)
Benutzt für alle „gemessen“-Angaben; läuft in <1 s. Wird in Etappe 4 zum Snapshot-Skript ausgebaut (`tools/…`).
```js
const fs=require('fs'),vm=require('vm'), D='/home/user/gaming/src/parts/';
const files=['reuse-helpers.js','02-data.js','02b-markt.js','02c-erfolge.js','02d-rezeptur.js','02e-neuware.js',
  '02f-themen.js','02g-runde4.js','02h-kugeln5.js','02i-kugeln6.js','02j-batterien7.js'];   // später: 01c-wirtschaft.js vor 02-data.js
const sb={matchMedia:()=>({matches:false}),window:{matchMedia:()=>({matches:false}),addEventListener(){}},
  document:{getElementById(){return null},createElement(){return{getContext(){return null},style:{}}}},
  THREE:new Proxy({},{get:()=>function(){return{}}}),console,Math,localStorage:{getItem(){return null},setItem(){}},navigator:{}};
vm.createContext(sb);
let code=files.map(f=>fs.readFileSync(D+f,'utf8')).join('\n;\n');
code+='\n;globalThis.__X={P,ORDER,UPGRADES,STAFF,KAPITEL,LOANS,SUPPLIERS,PACKS,DEKO,ERFOLGE,LIZENZEN,NEU_LIZENZEN};';
vm.runInContext(code,sb,{filename:'all.js'});
const X=sb.__X;   // X.P (239), X.UPGRADES.map(u=>u.cost()), X.LIZENZEN (27) …
```

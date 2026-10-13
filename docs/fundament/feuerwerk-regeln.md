# Feuerwerks-Regelwerk – Inventar, Regeln, Abschuss-Baustein (Fundament Etappe 2b)

Stand 13.10.2026, Branch `claude/fundament-feuerwerk` (Basis `73e52ef`).
Auftrag Tom (13.10. nachmittags): *„Einheitlich die Mechanik: Effekte kommen genau aus den
Löchern/Rohren, sichtbare Löcher = Schusszahl, immer gleiche Art der Zündung/Darstellung –
es kann nicht sein, dass einmal aus der Verpackung abgeschossen wird und einmal ein
ausgepacktes Produkt dasteht.“* Die Effekte selbst (Bruchbild, Ablauf, Klang) bleiben Anomalie
und wurden nicht angefasst.

Alle Zahlen sind gemessen (Messskript-Prinzip siehe Abschnitt 7): jedes Produkt wurde an der
Station und in der Vorführung gezündet, mitgeschnitten wurden Starts (Schussprotokoll FW_LOG,
Kometen-/Lichterzähler aus 14t), Rohrbelegung (ROHR_LOG), Abschusspunkt und Darstellung.

---

## 1. Zünd-Orte

| Ort | Wo im Spiel | Code vorher (Basis 73e52ef) | Code jetzt |
|---|---|---|---|
| **Testfeld-Stationen** (Zündtisch, Abschussröhren, Mörser) | Hof/Testfeld, Zündpult, Zünd-Handy (`21-input`), **Teststation** (Kartons nach Level, `17b fwTestSchalten`) | `05d-yard.js` `muendung` :502, `stationsModell` :669, `placeOnStation` :702, `zuendeItem` :772 | `05d` ruft nur noch `abPlatzStation`, `abAufstellen`, `abZuenden` |
| **Vorführung** (alle, „Änderungen“, Kugelbomben – PC und Handy) | Laptop › Laden › Vorführung | `17b-fwtest.js` `vfMuendung` :221, `vfZuendenRoh` :266, `vfAnlageBauen` :198; überschrieben in `14x-runde3.js` :493 (Anlage) und :532 (Mörserhöhe); Modell im Rohr `14u-hoehen.js` `vfImRohr` :196, `NEU_EMIT.vfModell` :224 | `17b` ruft `abPlatz`, `abAufstellen`, `abZuenden`; Anlage aus `abTischBau/abRampeBau/abRohrBau/abMoerserBau`; `14u` nur noch Kamerablick (`vfBlickAn`) |
| **Prototyp** der eigenen Rezeptur | Laptop › Rezeptur › „Prototyp zünden“ | `17-laptop.js` `rezProto` :1926 – Effekte frei in der Luft, eigene Kopie der Rezeptur-Zündlogik aus `14b` :719 | `abProtoZuenden`: Probestück auf seinen Platz, gleicher Weg wie jedes Produkt |
| Engine-Direktaufruf | nur Tests (`igniteType` ohne Platz) | – | unverändert (Ersatzaufbau `fkGestellLose`, `kqPodestNimm`, `kqHolzPodest`) |

„Silvester/Shows 14b“, „Hof“, „Zündtisch“ und „Handy-Vorführung“ sind keine eigenen Orte: Silvester
hat keine eigene Zündung (es wird an den Stationen gezündet), `14b` ist die Effekt-Engine, die alle
Orte gemeinsam aufrufen; der Hof ist das Testfeld; die Handy-Vorführung ist dieselbe Vorführung.

**Getrennte Implementierungen derselben Mechanik – vorher → jetzt**

| Mechanik | vorher | jetzt |
|---|---|---|
| Platz/Mündung (Abschusspunkt) | 3 (05d `muendung`; 17b `vfMuendung` + 14x-Überschreibung; 17-laptop eigene Punkte 1,7/1,3/0,95 m) | **1** (`abMuendung`) |
| Darstellung am Zündort | 3 (05d `stationsModell`+`placeOnStation`; 17b `vfZuendenRoh` + 14u `vfImRohr`; Prototyp: keine) | **1** (`abAufstellen`) |
| Zündung (Zündschnur, Abschuss, Abräumen) | 3 (05d `zuendeItem`; 17b `vfZuendenRoh`; 17-laptop `rezProto` mit eigener Rezeptur-Logik) | **1** (`abZuenden`) |
| Modell fliegt mit | 1 nur Vorführung (14u) | **1** für alle Orte (`abFlug`) |
| Abschussgeräte (Tisch, Raketenrohr, Mörser) | 3 (05d `buildYard`; 17b `vfAnlageBauen`; 14x Kopie) | **1** (`abTischBau`, `abRampeBau`, `abRohrBau`, `abMoerserBau`) |
| Rohrraster aus Schusszahl | 1 (04c `rohrLayout`, Formvarianten 14t/14w als Erweiterung) | 1 (unverändert) |
| Mörserhöhen | 3 Zahlenlisten (05d Rohre 1,30/1,55/1,85; 05d `MOERSER_MUND` 1,48/1,73/2,03; 14x `VF_MOERSER_H`) | **1** (`MOERSER_H`, `MOERSER_MUND` abgeleitet) |

---

## 2. Inventar je Produktklasse (131 Feuerwerksprodukte mit Zündort)

| Klasse | Anzahl | Platz | Darstellung (Modell) | Abschusspunkte | sichtbare Löcher : Schüsse |
|---|---:|---|---|---|---|
| Batterie | 41 | Zündtisch | ausgepackt: `batterieModell` (04c Korpus + ein Rohr je Schuss, Formen 14t `ROHR_FORM`, 14w `BAU`) | jedes Rohr seine Mündung (`rohrSatz.ort`, `rohrMund`) | 41/41 Rohre = Schüsse = „N Schuss“ (12–409) |
| Fächerbatterie | 4 | Zündtisch | wie Batterie, Fächerrohre | wie Batterie | 4/4 gleich (29–100) |
| Rakete | 22 | Abschussrohr | `raketeModell` (05d `RAKETEN_LOOK`) steckt im Rohr | Rohrmündung | 1 : 1 je Platz |
| Gravur-Rakete | 1 | Abschussrohr | `makeEngraved` (06b) | Rohrmündung | 1 : 1 |
| Kugelbombe | 32 | Mörser je Kaliber | `kugelModell` (05d) mit Zündschnur | Mörsermündung | 1 : 1 bei 25; **1 : 3–4 bei 7** (Begleitkometen, Frage F1) |
| Römische Lichter | 1 (Farbkanon) | Abschussrohr | 5-Rohr-Bündel (04g `VP_FORM.roemisch`, jetzt ohne Folie) | je Licht sein Rohr (`o.loecher`) | 5 Rohre : 15 Lichter = 3 je Rohr (wie echte Kerzen) |
| Fontäne | 12 | Zündtisch | 5 Sets: ausgepackt (Kegel je Düse, `fontDuesenLage`); 5 Einzelfontänen mit Produktform (04g: Feuerteufel, Feuerberg, Wendeltreppe, Tischbombe, Goldgeysir); Drehsonne mit Gestell; Feuerkreis als Bodenring | Düsen (Funken, kein Schuss) | 0 Schüsse (Funkenfontänen ausgenommen) |
| Kleinfeuerwerk | 15 | Zündtisch | ausgepackt: 9 × `kfTischAuf` (14x), 5 × Podest (14q Wunderkerzen, Bengalhölzer), Atom-Böller ohne Haube | Oberkante des Produkts | 0 Schüsse; Atom-Böller: die Bombe selbst steigt (1) |
| eigene Rezeptur (Prototyp und Eigenmarke) | 6 Träger | wie ihre Form | wie ihre Form | wie ihre Form | Raketenset jetzt 1 : 1 (vorher 3 bzw. 5 aus einem Rohr) |

Gezählt nach Klasse aus `P` (Basis): Batterie 41, Fächer 4, Rakete 23 (inkl. Gravur), Kugel 32,
Römische Lichter 1, Fontäne 12, Kleinfeuerwerk 15 = 131 (+ 6 Rezeptur-Träger).

---

## 3. Abweichungen (gemessen) und was daraus wurde

| # | Abweichung vorher (Basis 73e52ef) | betroffen | Regel | jetzt |
|---|---|---|---|---|
| A1 | **Kugel tief im Rohr an der Station**: Kugel 14 cm unter der Mündung, vom Pult aus unsichtbar, Schnur zur Seite; in der Vorführung sitzt sie oben in der Mündung | 32 Kugeln | R5, R4 | überall in der Mündung (obere Hälfte schaut heraus), Schnur hängt zum Pult bzw. zur Kamera |
| A2 | **Rakete verschwindet beim Start an der Station** (Modell ausgeblendet), in der Vorführung fliegt das Modell mit | 23 Raketen | R5, R4 | überall fliegt das Modell mit und ist mit dem Bruch weg |
| A3 | **Zündschnur unterschiedlich lang**: Station Rakete 0,4 s / Kugel 0,75 s / Bündel 0 s, Vorführung 0,9 / 1,2 / 0,4 s | 56 | R4 | überall 0,9 / 1,2 / 0,4 s (`AB_VOR`) |
| A4 | **Vorführrohre senkrecht, Stationsrohre 0,1 rad geneigt**: Mündung 8,6 cm versetzt (z −0,086 zu 0) | 24 | R4, R6 | gleiche Rohre, gleiche Neigung, Abschusspunkt zum Platz identisch (< 1 mm) |
| A5 | **Römische Lichter**: Station zeigt die Ladenverpackung (Schrumpffolie) im Rohr, Vorführung zeigt **gar nichts** (Effekt aus leerem Rohr); Lichter kamen auf einer Linie quer heraus – das mittlere 2,0 cm neben dem nächsten Rohr (Rohrradius 1,3 cm), also zwischen den Rohren | Farbkanon | R1, R3, R4 | an beiden Orten das Bündel ohne Folie im Rohr; jedes Licht aus seinem Rohr (`o.loecher`, 14b `ortAus`), je Rohr 3 |
| A6 | **Drehsonne in der Vorführung**: Blisterverpackung steht auf dem Tisch, das Gestell erscheint erst beim Zünden lose daneben (Station: Gestell von Anfang an) | Feuerrad | R1, R4 | überall das aufgebaute Gestell |
| A7 | **Feuerkreis aus der Schachtel**: achteckige Schachtel mit Fenster im Deckel, der Kranz kam oben aus dem Deckel | Bodenfeuer | R1 | ausgepackt nur der Bodenring mit 8 Düsen, Öffnung 3,4 cm über dem Tisch |
| A8 | **Atom-Böller unter der Acrylhaube**: Schuss oben aus der Haube, die Bombe blieb stehen, während sie flog | Atom-Böller | R1, R5 | ohne Haube auf dem Sockel, Start an der Bombenspitze, die Bombe verschwindet beim Abschuss vom Tisch |
| A9 | **Prototyp ohne Produkt**: Effekte frei über den Stationsmitten (Kugel 1,70 m statt Mündung 1,48/1,73/2,03 m; Rakete 1,30 m statt 1,39 m), dazu eine zweite Kopie der Rezeptur-Zündlogik | 6 Träger | R1–R4, EINMAL | Probestück steht auf seinem Platz (Kanal, Zündschnur, Modell), Zündung über denselben Weg; danach wieder aus dem Katalog |
| A10 | **Eigene Raketensets**: 3 bzw. 5 Raketen aus einem Rohr, in dem ein Modell steckt | rakete3, rakete5 | R2 | eine Rakete je Rohr wie alle 22 Raketen im Sortiment |
| A11 | **Gravur-Rakete in der Vorführung ohne Modell** | Gravur | R5, R4 | Modell im Rohr, fliegt mit |
| A12 | **Rauchrest nach dem Abbrand nur an der Station** | alle | R4 | überall |
| A13 | **Vorführanlage anders gebaut**: Holztisch statt Lochblech-Zündtisch, Rohr- und Mörsertische grau statt Lochblech/Riffelblech, Mörserschellen dünner | Anlage | R6 | dieselben Bauteile und Materialien |
| A14 | Kugeln mit **Begleitkometen** aus dem Mörser: 1 Loch, 3–4 sichtbare Starts | 7 Kugeln | R2 | **offen – Frage F1** |
| A15 | Kugeln mit **breiter Goldfontäne** aus dem Mörser (9,5 m, Funken) | 4 Kugeln | R2 | **offen – Frage F2** (zählt als Funkenfontäne, Wächter grün) |
| A16 | **Goldgeysir**: Fontäne kommt oben aus der geschlossenen Golddose (Stülpdeckel) | Goldgeysir | R1 | **offen – Frage F3** |
| A17 | **Raketen-Namen nennen mehr Raketen als je Platz steigen** („Hasenjagd · 20 Hakenschlag-Raketen“, „3er Raketenset“ …): ein Karton-Stück = eine Zündung = eine Rakete | 14 Raketen | Namensregel | **offen – Frage F4** |

Ohne Abweichung (gemessen, beide Orte): 45 Batterien (Rohre = Schüsse = Name, jedes Rohr genau
einmal, keiner ohne Rohr), 23 Raketen (1 Start an der Mündung, 5 cm darüber), 25 Kugeln
(1 Start an der Mündung), 12 Fontänen und 14 Kleinfeuerwerke ohne Schuss.

---

## 4. Fragen an Tom (nicht selbst entschieden – Behebung würde den Effekt ändern)

- **F1 Begleitkometen am Mörser** (Kronenkranz 200, Goldweidenkreuz 200, Kometensturm 300, Urknall 300,
  Titanenfaust 300, Sturmflut 300, Götterdämmerung 300; `14p KUGEL_ABSCHUSS kometen/farbkometen`):
  mit der Kugel steigen 2–3 Kometen aus demselben Mörser. Du hattest am 03.10. gesagt „zwei, drei, die
  hochschießen, ist okay“. Nach der Regel „Loch = Schuss“ brauchen sie eigene Rohre.
  Vorschlag (meine Empfehlung **a**): (a) je Komet ein kleines Kometenrohr am Mörser (sichtbar, wie bei
  Profi-Shows), Effekt bleibt; (b) Begleitung streichen. Bis zur Antwort meldet der Wächter sie als OFFEN.
- **F2 Goldfontäne am Mörser** (Sonnensturm, Herbststurm, Lavastrom, Himmelssturz 300; `goldfontaene`):
  eine 9,5 m hohe breite Funkenfontäne steigt aus dem Mörser, in dem die Kugel liegt. Zählt sie als
  „kleine Funkenfontäne“ (dann bleibt sie), oder soll sie aus einem eigenen Fontänentopf neben dem
  Mörser kommen? Empfehlung: eigener Fontänentopf.
- **F3 Goldgeysir**: die Form ist eine Golddose mit Stülpdeckel; die Fontäne kommt oben aus dem Deckel.
  Ist die Dose das Produkt (dann bleibt es) oder Verpackung (dann am Zündort ohne Deckel, mit Düse)?
- **F4 Raketen-Namen**: 14 Raketenprodukte heißen „N Raketen“ (3–20), am Zündort steigt je Karton-Stück
  eine Rakete. Entweder (a) ein Stück = N Raketen, jede kommt in ein eigenes Rohr (mehr Zündungen je
  Kauf – ändert die Wirtschaft) oder (b) Namen ohne Stückzahl. Empfehlung: (b), Wirtschaftsfrage gehört
  zur Wirtschaftszentrale.

---

## 5. Das Regelwerk (verbindlich, jede Regel vom Wächter `src/tests/abschussregel.js` geprüft)

1. **R1 Ausgepackt** – Am Zündort steht immer das ausgepackte Produkt, nie die Ladenverpackung
   (keine Folie, kein Blister, keine Haube, keine Schachtel). Eine Form aus `04g` gilt nur dann als
   Produkt, wenn sie selbst die Fontäne/das Rohr ist (Liste `AB_KOERPER` mit Begründung je Produkt).
   *Begründung:* Tom 13.10.: „nicht einmal aus der Verpackung und einmal ein ausgepacktes Produkt“;
   07.10.: „beim Zünden steht die Verpackung auf dem Tisch, nicht das Produkt“.
   *Erzwungen:* Wächter prüft die Materialien jeder Darstellung (keine Folie/Klarsicht/Acryl) an jedem Ort.
2. **R2 Loch = Schuss** – Sichtbare Starts = sichtbare Öffnungen: Batterie Rohre des Modells =
   Rohrraster = „N Schuss“ im Namen; Rakete und Kugel genau ein Start; Römische Lichter: jedes Rohr
   gleich oft; Fontänen: Starts höchstens so viele wie Düsen; Kleinfeuerwerk: kein Start, außer das
   Produkt fliegt selbst. Kleine Funkenfontänen zählen nicht.
   *Begründung:* Toms PDF 06.10.: „jeder Schuss ist ja logischerweise ein Loch … außer du hast jetzt eine
   Fontäne – diese kleinen Funken“; 01.10.: „Anzahl entspricht exakt der Schusszahl auf der Verpackung“.
   *Erzwungen:* Wächter zählt FW_LOG + Kometen-/Lichterzähler gegen die Öffnungen des gezeigten Modells.
3. **R3 Aus der Öffnung** – Jeder Start kommt aus einer Öffnung: Batterie jedes Rohr genau einmal,
   keiner ohne Rohr; Rakete/Kugel an der Mündung (≤ 3 cm + Streuung, 0–20 cm darüber); jedes Licht
   aus seinem Rohr des Bündels; Fontänen-Starts innerhalb der Öffnung.
   *Begründung:* Tom 28.09.: „wenn da eine Öffnung ist, dann soll es am Produkt rausgehen – teilweise
   gehen die komplett woanders“; PDF 06.10. (Feuerteufel): „der Effekt soll aus diesen Löchern rauskommen“.
   *Erzwungen:* Wächter (Starts, Rohrprotokoll); Funken-genau zusätzlich `ursprung.js`.
4. **R4 Überall gleich** – Station, Teststation, Vorführung (alle Listen, PC und Handy) und Prototyp
   zeigen dieselbe Form, denselben Abschusspunkt relativ zum Platz, dieselbe Zündschnur und dieselben Starts.
   *Begründung:* Tom 13.10.: „immer gleiche Art der Zündung/Darstellung“.
   *Erzwungen:* Wächter vergleicht Station und Vorführung je Produkt (Abschusspunkt auf 1 mm).
5. **R5 Geschoss sichtbar** – Rakete und Kugel stehen vor dem Start sichtbar an der Mündung (die Kugel
   schaut oben heraus, Zündschnur hängt zum Zuschauer), fliegen nach dem Start mit und sind mit dem
   Bruch weg; ein Produkt, das selbst fliegt, verschwindet beim Abschuss vom Tisch; nach dem Abbrand ist
   der Platz leer.
   *Begründung:* Toms PDF 05.10.: „man sieht keine Raketen und keine Kugelbomben in den Röhren – bitte
   ändern“; 07.10.: „Kugelbomben ohne heraushängende Zündschnur“.
   *Erzwungen:* Wächter (Lage vor dem Start, Flug 0,4 s nach dem Start, Abräumen); Bildpunkte im
   gerenderten Bild zusätzlich `vfrohr.js`.
6. **R6 Gleiche Abschussgeräte** – Station und Vorführanlage haben dieselben Rohre, Mörser und Tische
   (eine Bauart, nur Anzahl und Breite verschieden).
   *Begründung:* Tom 07.10.: „Abschussrohre in der Vorführung sehen anders aus als im echten Spiel –
   dieselben Rohre wie im Spiel nehmen“.
   *Erzwungen:* Wächter zählt die vom Baustein gebauten Rohre/Mörser an beiden Anlagen (3+3, 12+12).
7. **R7 Einmal** – Produkte zum Zünden aufstellen und zünden darf nur der Abschuss-Baustein
   (`raketeModell`, `kugelModell`, `batterieModell`, `kfTischAuf`, `kqPodestAuf`, `fkGestell`,
   `igniteType` werden nur aus `14z4-abschuss.js` gerufen; Raketenrohre und Mörserrohre baut nur er).
   Ein neuer Zünd-Ort liefert nur einen Platz (`abPlatz`) und ruft `abAufstellen` + `abZuenden`.
   *Begründung:* Fundament (Tom 13.10.): „ändert man es an einer Stelle, ändert es sich überall“ –
   erzwungen über Struktur und Tests, nicht über Gedächtnis.
   *Erzwungen:* Wächter liest den Quelltext aller Teile.
8. **R8 Effekte bleiben Anomalie** – Die Regeln gelten der Mechanik. Bruchbilder, Abläufe, Klänge,
   Farben und Abschussfolgen der Drehbücher (14g–14z3) ändert der Baustein nicht; wo eine Regel nur
   durch eine Effektänderung einzuhalten wäre, entscheidet Tom (Abschnitt 4, `AB_OFFEN`).
   *Begründung:* CLAUDE.md „Anomalie“ (Tom 26.09.).
   *Erzwungen:* Wächter meldet solche Fälle als OFFEN; steht in `AB_OFFEN` etwas, das gar nicht mehr
   abweicht, schlägt er an (Liste bleibt ehrlich).

---

## 6. Der Abschuss-Baustein `src/parts/14z4-abschuss.js`

Im Build nach den Drehbüchern (`14z3`), vor Spieler/Laptop/Vorführung.

| Funktion | Aufgabe |
|---|---|
| `abPlatz(art,x,y,z,ext)` | Platz: `tisch` (y = Tischplatte), `rohr` (Reihe; Neigung `ROHR_ACHSE`), `moerser` (y = Mündung, Kaliber) |
| `abPlatzStation(st,slot)` | Plätze der Testfeld-Stationen |
| `abMuendung(pl,t)` | Abschusspunkt und Öffnung (hx/hz/jit); Römische Lichter mit `loecher` |
| `abForm(t)` | Darstellung: batterie, rakete, gravur, kugel, buendel, gestell, podest, klein, koerper, roh |
| `abAufstellen(pl,t,opt)` | stellt das ausgepackte Produkt auf, Griff `h` (= Stationsplatz) |
| `abZuenden(pl,t,h,opt)` | Zündschnur (`AB_VOR`), Mitflug, `igniteType`, Rauchrest, Abräumen; Blindgänger nur mit `opt.q` |
| `abFlug`, `NEU_EMIT.abModell` | Modell folgt Rakete/Kugel; Vorführung hängt den Kamerablick an (`14u vfBlickAn`) |
| `abWeg(h)` | räumt alles ab |
| `abTischBau`, `abRampeBau`, `abRohrBau`, `abMoerserBau` | Abschussgeräte für Station und Vorführanlage |
| `abProtoZuenden(r)` | Prototyp der Rezeptur über denselben Weg |
| `AB_KOERPER`, `AB_OFFEN` | Ausnahmeliste mit Begründung, offene Fragen an Tom |

Weitere Änderungen für die Mechanik: `04g-form-feuerwerk.js` `VP_AUSGEPACKT` (Formen ohne Folie, Feuerkreis
nur Ring, Öffnungen `parts.loecher`/`parts.oben`), `04-models.js` Atom-Böller ohne Haube (nur ausgepackt),
`14b-shows.js` Lichter aus ihrem Rohr (`ortAus`), Prototyp ohne Hype, eigene Raketensets eine Rakete je Rohr.
Gelöscht: `stationsModell`, `stationSlot`, `rampeMund`, `kerzeImRohr`, `stationsPool`, `vfMuendung`,
`vfImRohr`, `NEU_EMIT.vfModell`, die Anlagen-Kopie in `14x-runde3.js`, die Rezeptur-Kopie in `rezProto`.

---

## 7. Messung und Tests

- Inventar-Messung: jedes Produkt an Station und Vorführung gezündet (three-Testdoppel, Partikel
  abgeschaltet), Starts aus FW_LOG und den 14t-Zählern, Rohre aus ROHR_LOG, Darstellung aus dem
  Platz-Eintrag. Das Verfahren steckt jetzt im Wächter.
- Wächter: `node src/tests/abschussregel.js test.html ['["id",…]']` – alle Produkte, beide Orte,
  6 Prototypen, Anlage, Quelltext. Gegenprobe `GEGENPROBE=1..5` baut je einen Fehler ein
  (Verpackung statt Produkt, alle Schüsse aus Rohr 0, Vorführrohr senkrecht, Kugel tief im Rohr,
  zweite Raketendarstellung im Quelltext) und erwartet, dass die passende Regel anschlägt.
- Die alten Einzeltests bleiben, weil sie zusätzlich prüfen: `lochschuss` (Namen, Zählung je Lichtart),
  `ursprung` (jeder Funke, Emitter, Feuerteufel-Düsen), `vfrohr` (Bildpunkte im gerenderten Bild,
  Kamerablick).

# Toms Befunde Gameplay-Vorfuehrung (07.10.)
1. Eiswuerfel aus dem Sortiment (keine Gefriertruhe; Kuehlschrank macht keinen Sinn).
2. Paket-Abholung: LKW (DHL-Stil) kommt abends 22 Uhr nach Ladenschluss und holt die Pakete ab.
3. Vorfuehrung: zwischen Packstation und Rolltor 1 kommt man nicht durch -> Regale anders anordnen.
4. Paletten in der gelben Box hoeher stapeln; ab 18 Uhr Paletten mit Hubwagen rausfahren. Hubwagen kommt mit dem Ausbau. Stufen (falls fehlend einbauen): Stufe 1 = Packtisch, man packt selbst; Stufe 2 = Roboter legt auf Paletten. Mit dem Hubwagen Paletten in den LKW fahren - mehrmals testen, dass es mit hoeherem Stapel wirklich funktioniert.
5. LKW-Modell passt.
6. Bestellbares Packmaterial (Kartons, Paketband, Luftpolsterfolie, Papierkartons) besser modellieren; Fuellstand sichtbar (wie viele noch drin).
7. Tische (vier nebeneinander) so lassen. Bis 22 Uhr packen/packen lassen, Roboter legt auf Paletten - gefaellt.
8. Grosser Raum mit den vier weiteren Stationen: erst mal beiseite (Tom meldet sich).
9. Automat "Deine Rakete": neu modellieren, realistischer; Beschriftung z. B. "Rakete personalisieren" statt "Deine Rakete". (Verpackung spaeter.)
10. Laden-Erweiterung teils extrem dunkel, obwohl Lampen da -> Lampen muessen wirklich Licht abgeben.
11. Schilder oben an den Verkaufsregalen: standardmaessig grau, hochwertiger gestalten.
12. Lagerregale neu designen: Farbe ok, aber mehr Textur/Detail.
13. NEUE Grafikstufe "Ultra Low" unter "Niedrig": alles aufs Minimum (Aufloesung/Pixelratio runter, keine Schatten, wenig Partikel, einfache Materialien, kurze Sichtweite, Stadt/Deko reduzieren), Dinge muessen noch erkennbar sein. Tom hat auf "Niedrig" nur 10-11 FPS auf schwachem PC -> deutlich fluessiger. (Sonnet-tauglich, Messung mit leistung-Test.)
14. Laeden gegenueber: Beleuchtung und Waende gefallen; Innenraeume aber mehr Detail/Textur je Laden (z. B. Apotheke: grosse Pixelflaechen) -> echt aussehen. (Opus)
15. LKWs draussen ("Premium Pyrotechnik Grosshandel" und daneben "Import"): mehr Textur; das 1.4G-Rautenschild ist falsch dargestellt -> korrekt nach echtem ADR-Gefahrzettel Klasse 1 (orange Raute, "1.4" oben, "G" Vertraeglichkeitsgruppe, "1" unten). (Opus)
16. Lieferkartons: ueberall steht 1.4G drauf. 1.4G (UN 0336, Gefahrgutklasse 1.4, Vertraeglichkeitsgruppe G) gehoert NUR auf Feuerwerkskartons (Kat. F1/F2), nicht auf Essen/Getraenke/Zubehoer/Einrichtung. Kartons etwas abwechslungsreicher (Pappkarton bleibt, Aufdrucke/Etiketten/Klebeband/Hersteller variieren; muss nicht jeder individuell sein). (Sonnet fuer Logik 1.4G nur bei Feuerwerk; Opus/Sonnet fuer Varianten)
17. Eigene Aussenfassade: Design/Farben BEHALTEN, aber deutlich mehr Textur/Detail (sieht aus wie "ein paar Pixel an der Wand"). Ladenschild oben gefaellt schon besser, hat aber teils eine Schattenschrift (Doppelung?) -> Schild/Banner hochwertiger nach Vorbild richtig guter Ladenlokale (gute Typografie, Banner). (Opus)
13b. Vor Ultra Low ZUERST MESSEN (Profil), was die FPS kostet: Draw Calls, neue Rocketbox-Figuren (Skinning), Schatten/Lichter, Stadt/Skyline (kein Occlusion Culling), Pixelratio/Aufloesung. Je Gruppe ein/aus schalten und Frame-Zeit messen (Gameplay-Vorfuehrung, Grafik Niedrig, swiftshader + echtes Profil). Ergebnis-Tabelle an Tom.
18. NEU (Tom, Skizze tom-test/versandecke.jpg, Plan raumplan2.html "Grundriss Empfehlung"): Versandecke ans hintere Ende von Lager Süd (Süd 3) verlegen, dort neues Versandtor V1 mit eigenem Versandhof dahinter. Roboter/Band sitzt am Tor und schiebt Pakete auf Paletten in die gelbe Paketablage. Um 22 Uhr kommt der Paketdienst-LKW an V1: Rolltor fährt hoch, Mitarbeiter/Roboter fährt die Paletten mit dem Hubwagen (realistisch) in den LKW, Tor zu, LKW fährt weg. Gilt im normalen Spielverlauf UND in der Gameplay-Vorführung. Rest des Ausbauplans (Kartonlager, Hochregal) NICHT jetzt.

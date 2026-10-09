# Licht und Schatten im Laden (Tom, 09.10.2026)

- Tom ist von der Grafik im Laden noch nicht überzeugt („sieht alles noch so naja aus“): Licht, Schatten, Gesamtwirkung im Laden deutlich krasser/realistischer.
- Ansatzpunkte (aus dem Referenz-Render docs/bilder/referenz/, übertragbar auf r128): Tone Mapping (ACES) + leichte Farbkorrektur, Umgebungslicht/Env-Map für Metall/Glanz, weiche Kontaktschatten unter Regalen/Möbeln (vorberechnet/Schattenquads statt teurer Echtzeit-AO), AO-Stufe nur ab „Hoch“, gezielter Bloom auf Leuchten, Deckenleuchten als echte Lichtquellen mit Lichtkegeln auf Boden/Regalen, glänzender Boden mit weicher Spiegelung als Option für hohe Stufen.
- Reihenfolge-Entscheidung: NACH den Feuerwerks-Runden (die nutzen dieselbe Nachbearbeitung/Bloom; Tom bewertet sie gerade), VOR Fassade und Automat/SB-Kassen (deren Texturen sollen unter dem finalen Licht abgestimmt werden).
- Leistung: vorher/nachher messen (Dreiecke, Draw-Calls, Software-FPS als Relativwert); Tom misst auf seinem PC (i7-4790). Teures nur ab höheren Grafikstufen.
- Vorab von Tom hilfreich: 2–3 Screenshots, was ihn am meisten stört.

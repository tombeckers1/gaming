# Fundament – Inventar und Umbauliste (Etappe 1, 13.10.2026)

Details: `inventar-optik.md` (Bauteile, Materialien, Texturen, Messwerte) und `inventar-wirtschaft.md`
(alle Wirtschaftsgrößen, Ketten, Magic Numbers). Messskripte: `tools/fundament/` (pre.js/post.js =
Zähl-Wrapper, messen3.js/messen4.js = Ansichten; Aufruf siehe Kopf von inventar-optik.md).

## Kernzahlen (gemessen, neues Spiel, Stufe Hoch)
- 2 639 Meshes, 80 % Einzel-Primitive; 984 Material-Objekte, davon 501 Dubletten (59× Gelb #f2c230).
- 482 `tex()`-Aufrufe = 304 MB Rohpixel; Kartons 62,7 MB, Regalschilder ~2 MB je Regal.
- Zeichenaufrufe 122 (Straße) … 1 275 (Dock-Hof), Laufzeit-Bündelung (03b) fängt 19–36 % ab.
- Dreiecke: 79–90 % sind Stadt/Straße/Park – eigenes Paket, nicht Baukasten.
- Tore: 6 getrennte Implementierungen (+1 Halle), 5 Zaunsysteme, 6 Poller, 3 Paletten, 7 Sammler.
- Grafikstufen greifen bei Bauteilen praktisch nicht (`HIQ` = Touchgerät, nicht Stufe).
- Wirtschaft: Mehrheit der Werte außerhalb `02-data.js` (11c, 11d, 11e, 16-day, 17-laptop, 10, 10b);
  239 Produkte ohne Margenregel; Fixkosten = Level-Steuer, keine Miete.

## Wichtig für den Bau
- `src/build.sh` hat eine **feste Dateiliste** (kein Sortieren) – neue Dateien dort eintragen.
  Materialbibliothek `01b-material.js` nach `reuse-helpers.js`; Wirtschaftszentrale **vor** `02-data.js`
  (`01c-wirtschaft.js`); Baukasten `04z-baukasten.js` vor `05-world.js`.
- `window.__bb` (22-start.js) bleibt als Alias-Schicht (44 Testdateien + sim.js lesen daraus).
- Spielstände: Migrations-Erstattungen in 18-save.js bleiben eingefroren.

## Umbauliste (Reihenfolge)
Optik (Etappe 2): 0 Materialbibliothek + Textur-Cache → 1 Baukasten-Kern (Sammler, LOD, Schildfabrik,
`userData.bauteil`) → 2 Tore (Pilot) → 3 `wall()` ohne 6-Material-Array + 4 Zäune/Poller → 5 Lampen
(+ Fassade/Hoflampen) → 6 Paletten/Kartons-Atlas (−60 MB) → 7 Regale + Schildatlas → 8 Fassade/Türen/
Fenster → 9 Halle-Branch umstellen (vor Halle-Merge).
Wirtschaft (Etappe 4, wertneutral): 0 Gerüst + Node-Snapshot → 1 Finanzen → 2 Versand/Online →
3 Preis-Maps Ausbau/Lizenz/Personal → 4 XP/Ruf → 5 Kundenmodell → 6 Markt → Rest/Textkopien.

## Gefundene Fehler (nicht im Umzug fixen – fürs Balancing)
1. `takeLoan` (16-day:41) nimmt Laufzeit/Zins der höchsten Kreditstufe, Laptop zeigt gewählte Stufe.
2. „Gewinn des Tages“ zieht selbst gezündete Ware ab, die nie bezahlt wurde (16-day:211).
3. Geldprüfung uneinheitlich (Ware mit Dispo, Ausbau ohne, `ddlRufen()` gar nicht).
4. Saison wirkt nicht auf Online/Markt/Lohn; Kundendeckel 20 bremst Silvester.
5. Inflation nur auf EK/VK; Lagerregal-Preise doppelt (RACKKIND/SHELFKIND); `SUPPLIERS.delay` ungenutzt.

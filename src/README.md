# Quelldateien

`boellerbude.html` im Wurzelverzeichnis ist **gebaut**, nicht von Hand
geschrieben. Hier liegen die Teile, aus denen die Datei entsteht.

## Bauen

```bash
W=$(pwd)/src bash -c 'source src/build.sh; build'
```

`build.sh` haengt die Dateien aus `parts/` in fester Reihenfolge
aneinander und schreibt `../boellerbude.html`. Die Reihenfolge steht im
Skript; sie ist wichtig, weil einige Konstanten in der Ladereihenfolge
ausgewertet werden.

## Testen

`mktest.py` macht aus `boellerbude.html` eine `test.html`, in der
three.js durch `three-stub.js` ersetzt ist. Damit laufen die Tests in
`tests/` ohne Grafikkarte und ohne Netz:

```bash
python3 src/mktest.py
node src/tests/test.js test.html /tmp/shot.png
```

Jeder Test schreibt am Ende `ERRORS: keine`, wenn alles in Ordnung ist.
Die wichtigsten:

| Test        | prueft                                                    |
|-------------|-----------------------------------------------------------|
| `test.js`   | Start, ein Verkaufstag, Ausbau, Deko                       |
| `test2.js`  | ganzer Tag mit Abrechnung, Speichern und Laden             |
| `karte.js`  | Grundriss, Vollausbau, Wege, Hofobjekte, Szenengroesse     |
| `ausbau.js` | Bauwaende, Zonen, SB-Kassen, Packstation                   |
| `durch.js`  | Geometrie, die in begehbare Raeume hineinragt              |
| `schild.js` | Regalschilder: Farben setzen, alle Kombinationen, Speichern |
| `gehen.js`  | ob jeder ausgebaute Raum wirklich zu betreten ist          |
| `gang.js`   | Lagergang: Kopfenden zu vor dem Kauf, offen danach         |
| `gangfrei.js`| ob im Lagergang etwas steht (braucht echtes three.js)     |
| `schnee.js` | ob es in Gebaeude hineinschneit und ob die Wolke dem Spieler folgt |
| `leer.js`   | ob in Grosshandel, Schleuse und Gang etwas steht, das dort nicht hingehoert (braucht echtes three.js) |
| `online.js` | Onlineshop-Reiter: Stufen, Packen, Live-Zahlen             |
| `wrampe.js` | Westrampen: Andockstationen, parallele Lieferungen         |
| `kauf.js`   | Testmodus und die Begruendung fehlgeschlagener Kaeufe      |
| `bal.js`    | Wirtschaftssimulation ueber beliebig viele Tage            |
| `blick.js`  | Standbilder aus dem Laden (braucht echtes three.js)        |

`bal.js`, `blick.js`, `gangfrei.js` und `leer.js` brauchen ein echtes three.js. Fuer `blick.js`:

```bash
npm pack three@0.128.0 && tar xzf three-0.128.0.tgz package/build/three.min.js
```

und das Skript-Tag in einer Kopie der HTML durch den Inhalt ersetzen.

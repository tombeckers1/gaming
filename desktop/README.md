# Böllerladen Simulator als Windows-Programm

Packt `../boellerbude.html` in ein Electron-Fenster und baut daraus eine
`Setup.exe` und eine portable `.exe`.

## Einmalig vorbereiten

Du brauchst **Node.js 18 oder neuer** (https://nodejs.org, LTS nehmen).

```bash
cd desktop
npm install
```

## Testen

```bash
npm start
```

Das lädt beim ersten Mal three.js und die beiden Schriften herunter, legt
sie in `app/` ab und öffnet das Fenster. Ab dann läuft alles offline.

* **F11** Vollbild
* **Strg+Shift+I** Entwicklerkonsole, falls etwas nicht geht

## Symbol setzen

Leg eine `build/icon.ico` mit 256×256 Pixeln ab. Fehlt sie, nimmt der Build
das Standardsymbol von Electron. Ein `.ico` erzeugst du z. B. mit
https://icoconvert.com aus deinem Logo.

## .exe bauen

```bash
npm run dist
```

Ergebnis in `dist/`:

* `Boellerladen Simulator Setup 0.1.0.exe` – Installer mit Startmenü-Eintrag
* `BoellerladenSimulator-portable-0.1.0.exe` – läuft ohne Installation

Rechne mit rund 180 MB, davon ist fast alles Chromium.

Nur die portable Variante:

```bash
npm run dist:portable
```

## Wenn du am Spiel weiterarbeitest

`prepare.mjs` liest immer die aktuelle `../boellerbude.html`. Nach jeder
Änderung reicht `npm start` bzw. `npm run dist`. Die heruntergeladenen
Bibliotheken liegen in `vendor/` und werden nicht erneut geladen.

## Version erhöhen

`version` in der `package.json` anpassen. Der Name der Ausgabedateien
richtet sich danach.

## Lizenzen, die mitgeliefert werden müssen

* **three.js** – MIT
* **Bungee**, **Barlow Condensed** – SIL Open Font License 1.1

Beides darfst du kommerziell verwenden. Leg die Lizenztexte als
`LICENSES.txt` neben die .exe, bevor du verkaufst.

## Bekannte Stolperstelle bei Steam

Das Steam-Overlay (Shift+Tab) klinkt sich in die Grafikausgabe ein und
findet sie im eigenen GPU-Prozess von Electron oft nicht. In `main.js` ist
dafür `app.commandLine.appendSwitch('in-process-gpu')` vorbereitet, aber
auskommentiert. Zuverlässig ist das nicht – teste es, bevor du Overlay,
Achievements oder Screenshots versprichst.

/* =========================================================
   WIRTSCHAFTSZENTRALE (Fundament Etappe 4, 13.10.2026)
   Toms Wunsch (13.10.2026): EINE Stelle fuer alle Wirtschaftszahlen.
   Aendert man eine Groesse (z. B. Versandkosten), wirkt es nachvollziehbar
   auf alles Abhaengige (Nachfrage, Umsatz, Ruf ...). Zweck des Spiels ist
   Finanzbildung: welche Entscheidung hat welche Folge - und WARUM.
   Darum steht hier je Zahl, worauf sie wirkt, und in WIRT_KETTEN (unten)
   die Wirkungsketten als Daten; daraus entsteht die Uebersicht
   (tools/fundament/wirtschaft-uebersicht.js, docs/fundament/wirtschaft.md).

   Regeln (verbindlich fuer alle Agenten, CLAUDE.md "Dauerregel"):
   - Wirtschaftswerte NUR hier. Systeme lesen WIRT.bereich.name oder rechnen
     mit WF.name(...). Kataloge (P, UPGRADES, STAFF, LIZENZEN ...) bleiben in
     02-data & Co. - mit Namen, Texten, Level -, holen ihre GELDZAHL aber von hier.
   - Alte Namen (LOANS, VS_PORTO, DDL_PAUSCHALE, VERSAND ...) bleiben als
     Aliase bestehen (window.__bb, Tests, tools/balance/sim.js).
   - Diese Datei steht in src/build.sh VOR 02-data.js (nach reuse-helpers.js):
     02-data wertet LOANS, STAFF ... beim Laden aus.
   - Nur Zahlen und reine Funktionen; kein Zugriff auf S beim Laden.
   - WIRT ist tief eingefroren: wer zur Laufzeit hineinschreibt, faellt
     sofort auf (TypeError im strict mode) statt still zu driften.
   - Gespeicherte Kopien (Kredit im Spielstand, Restposten-Angebot,
     Bestellungen, Eigenrezepte) aendern sich NICHT rueckwirkend - neue
     Werte wirken auf Neues. WIRT.historie bleibt fuer immer eingefroren.
   - Jede absichtliche Wertaenderung zeigt der Snapshot
     (node tools/fundament/wirtschaft-snapshot.js) - im Bericht nennen.
   ========================================================= */
const WIRT={
  /* ---------- Spielstart ---------- */
  start:{
    geld:500,           // € Startkapital (freshState). Wirkt auf: erste Regale/Ware - eng gewollt
    ruf:50,             // von 100. Wirkt auf: Kunden, Preistoleranz, Geduld, Online
    level:1,
    startDoy:273        // Tag 0 = 1. Oktober (Tag im Jahr) -> Silvester nach ~92 Tagen
  },
  /* ---------- Tageslaenge ---------- */
  zeit:{
    oeffnen:480,        // Spielminute 08:00
    schliessen:1320,    // Spielminute 22:00
    echtzeitSek:330     // ein Verkaufstag dauert 330 s echte Zeit (MIN_PER_SEC = 840/330).
                        // Wirkt auf: Kunden je Tag (Takt in Sekunden), Online-Bestelltakt (11c)
  },
  /* ---------- Einkauf beim Lieferanten (Wareneingang) ---------- */
  einkauf:{
    lieferSek:5,        // s bis die Lieferung da ist (x Ereignis "Stau" 2,1)
    liefergebuehr:5.9,  // € je Bestellung (VERSAND - Namensfalle: das ist der EINGANG, nicht der Onlineversand)
    lieferfreiAb:150    // € Warenwert, ab dem die Liefergebuehr entfaellt (VERSANDFREI)
  },
  /* ---------- Onlineshop / Versand (Ausgang) ----------
     Quellen siehe 11c-versand.js Kopf "Versand-Wirtschaft": Baymard 2024/25 (39-48 % Abbrueche wegen
     Zusatzkosten), Lewis/Singh/Fay 2006, UPS Pulse 2014 (58 % stocken auf), Bijmolt et al. 2005 (-2,62). */
  versand:{
    std:{kosten:4.9,frei:50},        // Voreinstellung = "Nachfrage 100 %" (vsQuoteStd)
    kostenMax:20, freiMax:300,       // Regler-Grenzen im Laptop
    porto:{1:2.0,3:3.5,6:5.0},       // € an DDL je Paket S/M/L (VS_PORTO)
    /* Abbruch: Kunde mit Warenkorb w nimmt Versand v hin mit p = exp(-k*(v/(a*w+b))^2) */
    abbruch:{k:0.75,a:0.2,b:2.5},    // 4,90 € auf 25 € -> 73 % kaufen, 20 € -> fast niemand
    korb:[5,9,13,18,22,28,38,55,95], // € Warenkorb-Quantile (gemessen L25-34) fuer die Anzeige "Nachfrage x %"
    aufstocken:{ab:0.7,anteil:0.6,maxSchritte:4},  // ab 70 % der Gratis-Schwelle legen 60 % etwas dazu (UPS 2014: 58 %)
    sale:{allesElast:-1.5,produktElast:-2.62,produktNeu:0.5,allesMax:50,produktMin:5,produktMax:70},
    /* Besucher je Tag = clamp(round(grund + jeRuf*Ruf + jeLevel*Level), min, max) x Stufe x Sale / Standardquote */
    basis:{grund:4,jeRuf:0.12,jeLevel:0.35,min:4,max:22},
    stufeMul:[1,1,1.45,1.9],         // Packstation Stufe 0..3 (mehr Packplaetze -> mehr Bestellungen)
    onlineDeckel:1.3,                // Onlinepreis hoechstens 130 % vom Marktpreis
    paketwertSchaetzung:{grund:12,jeLevel:0.6},  // € Anzeige, solange keine Bestellung offen ist
    /* Bestellgroesse: Anteil S / bis M, ab Level spaetAb grosszuegiger */
    groesse:{anteilS:0.68,bisM:0.94,spaetAb:22,spaetS:0.5,spaetBisM:0.85},
    /* Marktplatz-Pauschale je Tag ab Onlineshop (auch mit Packstation, ohne Kosten):
       round(grund + jeRuf*Ruf + jeLevel*Level) - ist-analyse: ~52 % des Betriebsgewinns (fuers Balancing) */
    pauschale:{grund:40,jeRuf:1.6,jeLevel:4},
    ddl:{pauschale:39,anfahrtSek:20},  // € je Abholung (Herleitung 11e-palette.js Kopf), s Anfahrt
    /* Ruf-Strafen am Abend */
    strafe:{
      offenAb:8, offenJe:0.12, offenMax:2,       // mehr als 8 offene Bestellungen: -0,12 je weitere, max -2
      wartendJe:0.06, wartendMax:3               // Pakete seit gestern auf der Palette: -0,06 je Paket, max -3
    },
    /* Packmaterial: Preis je Gebinde, Stueck je Gebinde, Verbrauch je Paket S/M/L */
    material:{
      ks:{preis:8.9,stueck:25}, km:{preis:11.4,stueck:15}, kl:{preis:12.8,stueck:8},
      folie:{preis:14.9,stueck:20}, band:{preis:9.9,stueck:48},
      folieJe:{1:1,3:2,6:3}, bandJe:{1:1,3:1,6:2}
    }
  },
  /* ---------- Bank: Kredit, Dispo ---------- */
  kredit:{
    /* Kreditstufen (Kopie landet im Spielstand: {amount,remaining,term,rate,paid}).
       rate = Zins je Tag auf den Rest; Rate = amount/term + Rest*rate (16-day loanDaily) */
    stufen:[
      {lvl:5,amount:1000,term:10,rate:0.012},
      {lvl:8,amount:2500,term:12,rate:0.013},
      {lvl:12,amount:5000,term:14,rate:0.014},
      {lvl:15,amount:10000,term:16,rate:0.015},
      {lvl:20,amount:25000,term:20,rate:0.016},
      {lvl:26,amount:60000,term:24,rate:0.017}
    ],
    tilgenKnoepfe:[250,1000],   // € Sondertilgung im Laptop (dazu "Alles")
    dispo:{
      abLevel:4,        // vorher kein Dispo
      grund:260,        // € Rahmen = grund + jeLevel*Level
      jeLevel:70,
      zinsTag:0.006     // 0,6 % je Tag auf den Minusbetrag (= ~219 % p. a. - bewusst schmerzhaft)
    }
  },
  /* ---------- Laufende Kosten (Tagesabschluss) ---------- */
  fix:{
    grund:10,           // € je Tag immer
    jeLagerregal:6,     // € je Lagerregal
    levelAb:4,          // ab diesem Level kostet jedes weitere Level ...
    jeLevel:4,          // ... 4 € je Tag ("Level-Steuer", keine Miete/Flaeche - Luecke fuers Balancing)
    regalArt:{klein:4,standard:9,hoch:12,kuehl:18,gondel:14,eck:11,gross:13,gitter:3,gitter2:4,gitter3:5,tisch:6,tischgross:8},  // € je Verkaufsregal
    regalStandard:9     // € fuer Regalarten ohne Eintrag (z. B. Kassenregal)
  },
  tag:{
    automat:45          // € je Tag mit Deko "Getraenkeautomat"
  },
  /* ---------- Ruf (0..100) ---------- */
  ruf:{
    kontoMinus:-3       // je Tagesabschluss mit Konto < 0
  },
  /* ---------- Erfahrung ---------- */
  xp:{
    tag:{grund:60,jeUmsatz:0.05,ohneBeschwerde:40},   // Tages-XP = grund + Umsatz*jeUmsatz + (keiner genervt ? ohneBeschwerde : 0)
    jahr:200,           // XP fuer ein volles Jahr
    kreditGetilgt:40
  },
  /* ---------- Nie aendern: historische Preise fuer Spielstand-Migrationen (18-save) ----------
     Wer alte Ausbauten hatte, bekommt GENAU das zurueck, was er damals bezahlt hat -
     unabhaengig davon, was dieselbe Sache heute kostet. */
  historie:{
    erstattung:{kasse3:3800, sbBetreuer:650, packstation:6400, packstation2:14000, packstation3:26000, packer:700, packer2:750, packer3:800}
  }
};

/* ---------- Reine Formeln (lesen nur Argumente und WIRT) ---------- */
const WF={
  /* Zahlen fuer Texte: deutsch, mit Tausenderpunkt; dez = Nachkommastellen */
  zahl:(v,dez)=>Number(v).toLocaleString('de-DE',{minimumFractionDigits:dez|0,maximumFractionDigits:dez|0}),
  /* "1.400 €" bzw. mit dez=2 "5,90 €" (normales Leerzeichen, anders als eur()) */
  euro:(v,dez)=>WF.zahl(v,dez)+' €',
  /* kleine Zahlen als Wort ("über acht"), sonst Ziffern */
  zahlwort:(n)=>['null','eins','zwei','drei','vier','fünf','sechs','sieben','acht','neun','zehn','elf','zwölf','dreizehn','vierzehn','fünfzehn','sechzehn','siebzehn','achtzehn','neunzehn','zwanzig'][n]||String(n),
  /* Marktplatz-Pauschale des Onlineshops je Tag (16-day endDay, Laptop-Anzeige, sim.js) */
  onlinePauschale:(ruf,level)=>Math.round(WIRT.versand.pauschale.grund+ruf*WIRT.versand.pauschale.jeRuf+level*WIRT.versand.pauschale.jeLevel)
};

/* ---------- Tief einfrieren ---------- */
(function wirtFrieren(o){ Object.freeze(o); for(const k of Object.keys(o)){ const v=o[k]; if(v&&typeof v==='object'&&!Object.isFrozen(v)) wirtFrieren(v); } })(WIRT);
Object.freeze(WF);
/* Fuer Tests, Werkzeuge und die Uebersicht (window.__bb bleibt unberuehrt) */
window.__wirt={WIRT,WF};

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
  euro:(v,dez)=>WF.zahl(v,dez)+' €'
};

/* ---------- Tief einfrieren ---------- */
(function wirtFrieren(o){ Object.freeze(o); for(const k of Object.keys(o)){ const v=o[k]; if(v&&typeof v==='object'&&!Object.isFrozen(v)) wirtFrieren(v); } })(WIRT);
Object.freeze(WF);
/* Fuer Tests, Werkzeuge und die Uebersicht (window.__bb bleibt unberuehrt) */
window.__wirt={WIRT,WF};
